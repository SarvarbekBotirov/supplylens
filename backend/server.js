require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const axios = require('axios');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const app = express();
const parser = new Parser();

app.use(cors());
app.use(express.json());

// Cache configuration
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours for general news
const INDUSTRY_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for industry
const COMMODITY_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for commodities
const ECONOMIC_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for World Bank
let cache = {
  all: { articles: [], timestamp: null },
  industries: {}
};

// Persistent set of seen article URLs to avoid re-analyzing
const seenArticleUrls = new Set();

const RSS_FEEDS = [
  'https://www.supplychaindive.com/feeds/news/',
  'https://www.supplychainbrain.com/rss/articles',
  'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
  'https://www.wired.com/feed/category/business/latest/rss',
  'https://feeds.bbci.co.uk/news/business/rss.xml'
];

const SUPPLY_CHAIN_COUNTRIES = {
  'CN': 'China', 'US': 'United States', 'DE': 'Germany',
  'JP': 'Japan', 'KR': 'South Korea', 'IN': 'India',
  'VN': 'Vietnam', 'MX': 'Mexico'
};

async function fetchCommodityPrices() {
  try {
    const symbols = {
      'CL=F': { name: 'Oil (WTI)', unit: 'USD/barrel' },
      'BZ=F': { name: 'Brent Crude', unit: 'USD/barrel' },
      'GC=F': { name: 'Gold', unit: 'USD/oz' },
      'HG=F': { name: 'Copper', unit: 'USD/lb' },
      'ZW=F': { name: 'Wheat', unit: 'USX/bushel' },
      'ZC=F': { name: 'Corn', unit: 'USX/bushel' }
    };

    const results = await Promise.all(
      Object.entries(symbols).map(async ([symbol, meta]) => {
        const quote = await yahooFinance.quote(symbol);
        return {
          name: meta.name,
          symbol,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChangePercent?.toFixed(2),
          unit: meta.unit
        };
      })
    );

    return results;
  } catch (err) {
    console.error('Error fetching commodity prices:', err.message);
    return [];
  }
}

async function fetchEconomicContext() {
  try {
    const results = {};
    await Promise.all(
      Object.entries(SUPPLY_CHAIN_COUNTRIES).map(async ([code, name]) => {
        const [gdp, inflation] = await Promise.all([
          axios.get(`https://api.worldbank.org/v2/country/${code}/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrv=1`)
            .then(r => r.data[1]?.[0]?.value?.toFixed(2)).catch(() => null),
          axios.get(`https://api.worldbank.org/v2/country/${code}/indicator/FP.CPI.TOTL.ZG?format=json&mrv=1`)
            .then(r => r.data[1]?.[0]?.value?.toFixed(2)).catch(() => null)
        ]);
        results[code] = { name, gdpGrowth: gdp, inflation };
      })
    );
    return results;
  } catch (err) {
    console.error('Error fetching economic context:', err.message);
    return {};
  }
}

// Keywords to skip (low relevance)
const SKIP_KEYWORDS = ['sports', 'entertainment', 'celebrity', 'lifestyle', 'fashion', 'music', 'movie', 'tv', 'hollywood'];

// Keywords to include (high relevance)
const RELEVANT_KEYWORDS = ['economy', 'trade', 'logistics', 'supply chain', 'technology', 'geopolitics', 'energy', 'commerce', 'business', 'market', 'risk', 'disruption', 'tariff', 'shipping'];

function isCacheValid() {
  return cache.all.articles.length > 0 && cache.all.timestamp && (Date.now() - cache.all.timestamp) < CACHE_DURATION;
}

function isIndustryCacheValid(industry) {
  const c = cache.industries[industry];
  return c && c.articles.length > 0 &&
    (Date.now() - c.timestamp) < INDUSTRY_CACHE_DURATION;
}

function shouldSkipArticle(title) {
  const lowerTitle = (title || '').toLowerCase();
  // Skip if contains irrelevant keywords
  for (const keyword of SKIP_KEYWORDS) {
    if (lowerTitle.includes(keyword)) return true;
  }
  return false;
}

function isRelevantArticle(title) {
  const lowerTitle = (title || '').toLowerCase();
  // Include if contains relevant keywords
  for (const keyword of RELEVANT_KEYWORDS) {
    if (lowerTitle.includes(keyword)) return true;
  }
  return false;
}

async function fetchAllFeeds() {
  const feedPromises = RSS_FEEDS.map(feed => 
    parser.parseURL(feed).catch(err => {
      console.error(`Error parsing ${feed}:`, err.message);
      return { items: [] };
    })
  );

  const feeds = await Promise.all(feedPromises);
  return feeds.flatMap(feed => feed.items || []);
}

function deduplicateByTitle(articles) {
  const seen = new Set();
  return articles.filter(article => {
    if (seen.has(article.title)) {
      return false;
    }
    seen.add(article.title);
    return true;
  });
}

function sortByRecency(articles) {
  return articles.sort((a, b) => {
    const dateA = new Date(a.pubDate || 0);
    const dateB = new Date(b.pubDate || 0);
    return dateB - dateA;
  });
}

function isFromSupplyChainSource(article) {
  const link = (article.link || '').toLowerCase();
  const source = (article.source || '').toLowerCase();
  return link.includes('supplychaindive') || 
         link.includes('supplychainbrain') ||
         source.includes('supplychaindive') || 
         source.includes('supplychainbrain');
}

function filterForRelevance(articles) {
  return articles.filter(article => {
    // Always skip articles with skip keywords
    if (shouldSkipArticle(article.title)) {
      return false;
    }
    // Keep articles with relevant keywords OR from supply chain sources
    return isRelevantArticle(article.title) || isFromSupplyChainSource(article);
  });
}

async function analyzeArticleWithClaude(article, commodityPrices = []) {
  let responseText;
  try {
    const description = article.description || article.content || '';
    const truncatedDesc = description.substring(0, 200);

    const commodityContext = commodityPrices.map(c =>
      `${c.name}: $${c.price} ${c.unit} (${c.change > 0 ? '+' : ''}${c.change}% today)`
    ).join('\n');

    const prompt = `Respond with ONLY a JSON object. First character must be {. No explanation before or after.

You are a senior supply chain analyst briefing your manager in 60 seconds.

Article: "${article.title}"
Content: ${truncatedDesc}
Market data: ${commodityContext}

Answer in JSON only - no markdown, start with {:
{
  "summary": [
    "exact operational impact - what changed and by how much",
    "which specific industries/regions/companies are exposed",
    "financial magnitude or deadline that requires action"
  ],
  "sc_relevance_score": <1-5>,
  "tag": "<Trade/Shipping/Disruption/Technology/Economy/Politics>",
  "recommended_actions": [
    "specific action + exact timing + expected outcome",
    "specific action + exact timing + expected outcome"
  ],
  "ripple": {
    "trigger": "max 4 words",
    "first_order": [{"label": "max 2 words", "type": "risk|opportunity", "detail": "one sentence"}],
    "second_order": [{"label": "max 2 words", "type": "risk|opportunity", "detail": "one sentence"}],
    "third_order": [{"label": "max 2 words", "type": "risk|opportunity", "detail": "one sentence"}]
  }
}

Rules: actions must be specific and time-bound, not generic. Bad: 'review contracts'. Good: 'Contact top freight carriers this week to lock Q3 rates before July reviews'. first_order 3 items, second_order 3 items, third_order 2 items.`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 30000
      }
    );

    responseText = response.data.content[0].text;
    const cleanText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      title: article.title,
      link: article.link,
      pubDate: article.pubDate,
      source: article.source,
      summary: analysis.summary,
      sc_relevance_score: analysis.sc_relevance_score,
      tag: analysis.tag,
      recommended_actions: analysis.recommended_actions,
      ripple: analysis.ripple || null
    };
  } catch (err) {
    console.error(`Error analyzing article "${article.title}":`, err.message);
    return {
      title: article.title,
      link: article.link,
      pubDate: article.pubDate,
      source: article.source,
      error: 'Failed to analyze article',
      summary: [],
      sc_relevance_score: 0,
      tag: 'Unknown',
      recommended_actions: []
    };
  }
}

app.get('/api/news', async (req, res) => {
  try {
    // Check if cache is valid
    if (isCacheValid()) {
      console.log('Returning cached data');
      return res.json({
        success: true,
        fromCache: true,
        cacheAgeMinutes: Math.round((Date.now() - cache.all.timestamp) / 60000),
        totalArticlesCached: cache.all.articles.length,
        data: cache.all.articles
      });
    }

    console.log('Fetching fresh RSS feeds and commodity prices...');
    const [articles, commodityPrices] = await Promise.all([
      fetchAllFeeds(),
      fetchCommodityPrices()
    ]);

    if (articles.length === 0) {
      return res.json({ success: true, data: [], totalProcessed: 0 });
    }

    // Deduplicate and sort
    const deduped = deduplicateByTitle(articles);
    const sorted = sortByRecency(deduped);
    
    // Filter for relevance
    const relevant = filterForRelevance(sorted);
    const topArticles = relevant.slice(0, 15);

    console.log(`Processing ${topArticles.length} articles with Claude...`);

    // Analyze each article with Claude sequentially
    const analyzedArticles = [];
    for (const article of topArticles) {
      // Skip if we've already analyzed this URL
      if (seenArticleUrls.has(article.link)) {
        console.log('Skipping already-analyzed:', article.title.substring(0, 30));
        continue;
      }

      const result = await analyzeArticleWithClaude(article, commodityPrices);
      analyzedArticles.push(result);
      seenArticleUrls.add(article.link);
      
      // 500ms delay between Claude calls
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Update cache
    cache.all = {
      articles: analyzedArticles,
      timestamp: Date.now()
    };

    res.json({
      success: true,
      fromCache: false,
      totalArticlesProcessed: topArticles.length,
      totalAnalyzed: analyzedArticles.length,
      data: analyzedArticles
    });
  } catch (err) {
    console.error('Error in /api/news endpoint:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch and analyze news',
      message: err.message
    });
  }
});

async function analyzeArticleWithIndustry(article, commodityPrices, industry) {
  try {
    const description = article.description || article.content || '';
    const truncatedDesc = description.substring(0, 200);
    const commodityContext = commodityPrices.map(c =>
      `${c.name}: $${c.price} ${c.unit} (${c.change > 0 ? '+' : ''}${c.change}% today)`
    ).join('\n');

    const prompt = `You are a senior supply chain analyst specializing in the ${industry} industry. Respond with ONLY a JSON object. First character must be {.

Article: "${article.title}"
Content: ${truncatedDesc}
Market data: ${commodityContext}

Analyze this article SPECIFICALLY for a ${industry} supply chain manager.
Focus only on impacts relevant to ${industry} operations, suppliers, costs and risks.

{
  "summary": [
    "direct impact on ${industry} operations with specific numbers",
    "which ${industry} companies/suppliers/regions are exposed",
    "financial magnitude or deadline for ${industry} professionals"
  ],
  "sc_relevance_score": <1-5, score higher if relevant to ${industry}>,
  "tag": "<Trade/Shipping/Disruption/Technology/Economy/Politics>",
  "recommended_actions": [
    "specific time-bound action for ${industry} supply chain manager",
    "specific time-bound action for ${industry} supply chain manager"
  ],
  "ripple": {
    "trigger": "max 4 words",
    "first_order": [
      {"label": "max 3 words", "type": "risk", "detail": "one sentence"}
    ],
    "second_order": [
      {"label": "max 3 words", "type": "risk", "detail": "one sentence"}
    ],
    "third_order": [
      {"label": "max 3 words", "type": "risk", "detail": "one sentence"}
    ]
  }
}

Rules:
- trigger: max 4 words describing the event
- first_order: exactly 3 items, type is "risk" or "opportunity"
- second_order: exactly 3 items, type is "risk" or "opportunity"
- third_order: exactly 2 items, type is "risk" or "opportunity"
- all labels max 2 words, keep very short`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 30000
      }
    );

    const responseText = response.data.content[0].text;
    const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    const analysis = JSON.parse(jsonMatch[0]);

    return {
      title: article.title,
      link: article.link,
      pubDate: article.pubDate,
      source: article.source,
      summary: analysis.summary,
      sc_relevance_score: analysis.sc_relevance_score,
      tag: analysis.tag,
      recommended_actions: analysis.recommended_actions,
      ripple: analysis.ripple || null
    };
  } catch (err) {
    return {
      title: article.title,
      link: article.link,
      pubDate: article.pubDate,
      source: article.source,
      error: 'Failed to analyze article',
      summary: [],
      sc_relevance_score: 0,
      tag: 'Unknown',
      recommended_actions: []
    };
  }
}

app.get('/api/news/:industry', async (req, res) => {
  const industry = req.params.industry;
  try {
    if (isIndustryCacheValid(industry)) {
      console.log(`Returning cached data for ${industry}`);
      return res.json({
        success: true,
        fromCache: true,
        industry,
        data: cache.industries[industry].articles
      });
    }

    const [articles, commodityPrices] = await Promise.all([
      fetchAllFeeds(),
      fetchCommodityPrices()
    ]);

    const deduped = deduplicateByTitle(articles);
    const sorted = sortByRecency(deduped);
    const relevant = filterForRelevance(sorted);
    const topArticles = relevant.slice(0, 10);

    const analyzedArticles = [];
    for (const article of topArticles) {
      const result = await analyzeArticleWithIndustry(
        article, commodityPrices, industry
      );
      analyzedArticles.push(result);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    cache.industries[industry] = {
      articles: analyzedArticles,
      timestamp: Date.now()
    };

    res.json({
      success: true,
      industry,
      totalAnalyzed: analyzedArticles.length,
      data: analyzedArticles
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/commodities', async (req, res) => {
  try {
    const prices = await fetchCommodityPrices();
    res.json({ success: true, data: prices, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error in /api/commodities endpoint:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch commodity prices', message: err.message });
  }
});

app.get('/api/economic-context', async (req, res) => {
  try {
    const data = await fetchEconomicContext();
    res.json({ success: true, data, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error in /api/economic-context endpoint:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch economic context', message: err.message });
  }
});

app.get('/api/status', (req, res) => {
  const isStale = !isCacheValid();
  const cacheAgeMinutes = cache.all.timestamp ? Math.round((Date.now() - cache.all.timestamp) / 60000) : null;

  res.json({
    cacheAgeMinutes: cacheAgeMinutes,
    totalArticlesCached: cache.all.articles.length,
    cacheIsFresh: !isStale,
    cacheIsStale: isStale,
    seenArticlesCount: seenArticleUrls.size,
    cacheExpiresIn: cache.all.timestamp ? Math.max(0, Math.round((CACHE_DURATION - (Date.now() - cache.all.timestamp)) / 60000)) : 'N/A',
    industriesCached: Object.keys(cache.industries)
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
