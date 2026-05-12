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


const INDUSTRY_KEYWORDS = {
  'Automotive': [
    'toyota','ford','gm','general motors','tesla','bmw','volkswagen','vw',
    'mercedes','honda','hyundai','kia','stellantis','nissan','renault',
    'automotive','vehicle','car','truck','suv','usmca','ev','electric vehicle',
    'battery','auto parts','tier-1','tier-2','oem','transmission','engine',
    'chassis','stamping','wiring harness','catalytic','airbag','brake',
    'assembly plant','production line','just-in-time','jit','recall',
    'tariff auto','car manufacturer','auto industry','mobility','driveline',
    'powertrain','axle','suspension','fuel economy','emissions','crash test'
  ],
  'Semiconductors': [
    'chip','semiconductor','tsmc','nvidia','intel','memory','wafer','fab',
    'sk hynix','samsung electronics','arm','microchip','foundry','dram','nand',
    'amd','qualcomm','micron','broadcom','texas instruments','asml','lithography',
    'node','nanometer','packaging','hbm','advanced packaging','chiplet',
    'silicon','transistor','integrated circuit','ic','processor','gpu','cpu',
    'soc','fpga','analog','rf chip','power semiconductor','diode','capacitor',
    'chip shortage','fab capacity','yield','cleanroom','photolithography',
    'etching','deposition','semiconductor equipment','chip design','eda',
    'taiwan','korea semiconductor','china chip','export control','chips act'
  ],
  'Electronics': [
    'apple','samsung','sony','lg','panasonic','electronics','consumer tech',
    'display','pcb','printed circuit','component','iphone','ipad','laptop',
    'macbook','android','smartphone','tablet','wearable','tv','monitor',
    'camera','audio','headphone','gaming','playstation','xbox','nintendo',
    'circuit board','soldering','assembly','foxconn','pegatron','flex',
    'jabil','electrolux','whirlpool','home appliance','refrigerator','washer',
    'led','oled','amoled','panel','screen resolution','pixel','backlight',
    'battery cell','lithium','cobalt','rare earth','magnet','speaker',
    'connector','cable','usb','hdmi','wireless','bluetooth','wifi','5g module'
  ],
  'Energy': [
    'oil','gas','opec','crude','lng','pipeline','refinery','fuel','hormuz',
    'petroleum','energy','barrel','brent','wti','natural gas','gasoline',
    'diesel','jet fuel','kerosene','bunker fuel','tanker','supertanker',
    'offshore','drilling','rig','fracking','shale','north sea','permian',
    'gulf','middle east','saudi aramco','bp','shell','exxon','chevron',
    'totalenergies','energy crisis','power grid','electricity','coal',
    'nuclear','renewable','solar','wind','hydrogen','carbon','emission',
    'carbon credit','cap and trade','energy transition','power outage',
    'blackout','fuel surcharge','energy price','utility','sanctions energy',
    'strategic reserve','spr','iea','opec+','oil price','energy security'
  ],
  'Food & Agriculture': [
    'food','grain','wheat','corn','agriculture','fertilizer','famine','crop',
    'harvest','farm','soybean','rice','barley','oat','sugar','coffee','cocoa',
    'palm oil','vegetable oil','livestock','beef','pork','poultry','dairy',
    'milk','cheese','seafood','fishing','aquaculture','drought','flood',
    'weather crop','usda','fao','food security','food inflation','grocery',
    'supermarket','food distributor','cold chain','frozen food','perishable',
    'food packaging','food processing','agtech','precision farming','gmo',
    'pesticide','herbicide','irrigation','soil','yield crop','arable',
    'potash','nitrogen','phosphate','ammonia','urea','food supply chain',
    'restaurant','foodservice','food manufacturer','nestle','unilever','adm',
    'cargill','bunge','food price','agricultural commodity','crop insurance'
  ],
  'Pharma': [
    'pharma','drug','fda','vaccine','biotech','clinical','medicine','api',
    'cmo','cdmo','biologics','therapeutics','oncology','antibody','biosimilar',
    'generic drug','branded drug','pfizer','johnson','merck','novartis',
    'roche','astrazeneca','sanofi','abbvie','eli lilly','bayer','gsk',
    'clinical trial','phase 3','regulatory approval','drug shortage',
    'active ingredient','excipient','formulation','sterile manufacturing',
    'cold chain pharma','temperature controlled','serialization','track trace',
    'dea','ema','who','health authority','supply disruption pharma',
    'hospital','healthcare','medical device','ppe','surgical','diagnostic',
    'reagent','laboratory','pharmacy','distribution pharma','wholesaler'
  ],
  'Retail': [
    'retail','amazon','walmart','target','costco','kroger','carrefour',
    'inventory','e-commerce','consumer','store','tariff','merchandise',
    'shopping','omnichannel','fulfillment','last mile','delivery','returns',
    'warehouse','distribution center','dc','pick pack','order management',
    'demand forecasting','stock','sku','assortment','markdown','promotion',
    'black friday','holiday season','peak season','consumer spending',
    'household income','disposable income','inflation consumer','cpi',
    'retail sales','same store sales','foot traffic','conversion','basket',
    'loyalty','subscription','marketplace','drop shipping','cross border',
    'import tariff','customs','duty','trade compliance','country of origin',
    'reshoring retail','nearshoring','vendor managed inventory','vmi'
  ],
  'Procurement': [
    'procurement','sourcing','supplier','contract','rfq','rfp','vendor',
    'spend','category management','purchase order','po','invoice','payment',
    'accounts payable','supplier diversity','supplier risk','supplier audit',
    'supplier scorecard','kpi supplier','onboarding','qualification',
    'preferred supplier','approved vendor','sole source','dual source',
    'strategic sourcing','tactical buying','spot buy','blanket order',
    'frame agreement','negotiation','cost reduction','savings','benchmark',
    'total cost of ownership','tco','should cost','price analysis',
    'commodity management','raw material','indirect spend','direct spend',
    'capex procurement','opex','maverick spend','compliance procurement',
    'p2p','procure to pay','erp','sap','oracle procurement','ariba',
    'coupa','jaggaer','supply base','make vs buy','outsourcing','insourcing',
    'tariff impact','trade war','sanctions procurement','supply continuity'
  ]
};

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
  'https://feeds.bbci.co.uk/news/business/rss.xml',
  'https://feeds.reuters.com/reuters/businessNews',
  'https://www.ft.com/rss/home/uk',
  'https://www.bloomberg.com/feed/podcast/etf-iq.xml',
  'https://feeds.feedburner.com/logisticsmgmt/latestnews',
  'https://www.inboundlogistics.com/rss/',
  'https://www.dcvelocity.com/rss/news',
  'https://globaltrademag.com/feed/',
  'https://www.freightwaves.com/news/feed'
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

async function fetchFullArticleText(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const html = response.data;

    // Remove scripts, styles, nav, header, footer, ads
    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Return up to 3000 chars of clean article body
    return cleaned.substring(0, 3000);
  } catch (err) {
    return null;
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

async function analyzeArticleWithClaude(article, commodityPrices = [], economicContext = {}) {
  try {
    // Try to fetch full article text first
    let articleText = null;

    // Only fetch if we don't already have full text
    // (description longer than 500 chars = already full text)
    const existingContent = article.description || article.content || '';
    if (existingContent.length < 500 && article.link) {
      articleText = await fetchFullArticleText(article.link);
    }

    const contentToAnalyze = articleText
      || existingContent
      || '';

    const source = articleText ? 'full article' : 'article excerpt';

    const commodityContext = commodityPrices.map(c =>
      `${c.name}: $${c.price} ${c.unit} (${c.change > 0 ? '+' : ''}${c.change}% today)`
    ).join('\n');

    const economicSummary = Object.values(economicContext)
      .filter(c => c.gdpGrowth !== null || c.inflation !== null)
      .map(c => `${c.name}: GDP ${c.gdpGrowth > 0 ? '+' : ''}${c.gdpGrowth}%, Inflation ${c.inflation}%`)
      .join('\n');

    const prompt = `You are a senior supply chain analyst. Respond with ONLY valid JSON. First character must be {.

Article title: "${article.title}"
Article content (${source}):
${contentToAnalyze}

Live commodity prices:
${commodityContext}

Economic indicators:
${economicSummary}

Return this JSON:
{
  "article_summary": "2-3 sentences summarizing only what this article explicitly states. No added claims.",
  "sc_summary": [
    "first supply chain implication — only use facts stated in the article, cite specific details from the text",
    "second implication — affected industries or regions as stated in the article",
    "third implication — only include a number, deadline or cost if the article explicitly states one, otherwise describe the operational signal"
  ],
  "source_quotes": [
    "exact sentence or phrase copied verbatim from the article content that directly supports summary point 1. Must be a real quote.",
    "exact sentence or phrase copied verbatim from the article content that directly supports summary point 2. Must be a real quote.",
    "exact sentence or phrase copied verbatim from the article content that directly supports summary point 3. Must be a real quote."
  ],
  "sc_relevance_score": <1-5 integer>,
  "tag": "<Trade|Shipping|Disruption|Technology|Economy|Politics>",
  "recommended_actions": [
    "action grounded in what this article describes — specific and time-bound",
    "second action grounded in article content — specific and time-bound"
  ],
  "market_signal": "2-3 sentences connecting today's live commodity prices to this specific article. Which commodities are moving in a direction consistent with this event? What does the price movement signal for supply chain managers? Only reference commodities that are genuinely relevant to this article. If no commodity is relevant, write null.",
  "ripple": {
    "trigger": "2-4 words — the core event from this article",
    "first_order": [
      {"label": "2 words max", "type": "risk", "detail": "direct consequence stated or clearly implied by article"},
      {"label": "2 words max", "type": "risk", "detail": "direct consequence stated or clearly implied by article"},
      {"label": "2 words max", "type": "opportunity", "detail": "direct opportunity stated or clearly implied by article"}
    ],
    "second_order": [
      {"label": "2 words max", "type": "risk", "detail": "downstream effect based on article context"},
      {"label": "2 words max", "type": "risk", "detail": "downstream effect based on article context"},
      {"label": "2 words max", "type": "opportunity", "detail": "downstream opportunity based on article context"}
    ],
    "third_order": [
      {"label": "2 words max", "type": "risk", "detail": "broader systemic effect"},
      {"label": "2 words max", "type": "opportunity", "detail": "broader systemic opportunity"}
    ]
  },
  "geo_impact": {
    "epicenter": ["country explicitly mentioned in article as origin of event"],
    "high_risk_countries": ["countries explicitly mentioned in article as affected"],
    "affected_ports": [],
    "disrupted_routes": [],
    "secondary_impact": ["countries with indirect exposure based on article context"]
  }
}

STRICT RULES — violation is not acceptable:
- article_summary: only facts from the article text above. Zero additions.
- sc_summary: every point must be traceable to a specific sentence in the article.
- NEVER invent numbers, percentages, dollar figures, or dates not in the article.
- NEVER invent port names, coordinates, or company names not in the article.
- affected_ports and disrupted_routes: only include if article explicitly names ports or routes. Otherwise leave as empty arrays [].
- geo_impact countries: only countries mentioned in the article.
- If the article does not mention a specific number, write the qualitative signal instead.
- recommended_actions must be grounded in what the article describes, not generic advice.
- market_signal must only reference commodities provided in the live market data above
- Never invent price movements or percentages
- If no commodity is relevant to this article, return null for market_signal
- source_quotes: each must be copied VERBATIM from the article text provided above
- source_quotes: if no exact quote exists for a point, write "No direct quote available"
- source_quotes: never paraphrase or invent quotes
- source_quotes array must have exactly 3 items, one per summary point`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
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
      article_summary: analysis.article_summary || null,
      summary: analysis.sc_summary || [],
      source_quotes: analysis.source_quotes || [],
      sc_relevance_score: analysis.sc_relevance_score,
      tag: analysis.tag,
      recommended_actions: analysis.recommended_actions,
      market_signal: analysis.market_signal || null,
      full_text: contentToAnalyze || null,
      ripple: analysis.ripple || null,
      geo_impact: analysis.geo_impact || null
    };
  } catch (err) {
    console.error(`Error analyzing article "${article.title}":`, err.message);
    return {
      title: article.title,
      link: article.link,
      pubDate: article.pubDate,
      source: article.source,
      error: 'Failed to analyze article',
      article_summary: null,
      summary: [],
      source_quotes: [],
      sc_relevance_score: 0,
      tag: 'Unknown',
      recommended_actions: [],
      market_signal: null,
      full_text: null
    };
  }
}

async function processBatch(articles, processFn, batchSize = 3) {
  const results = [];
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);
  }
  return results;
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
    const [articles, commodityPrices, economicContext] = await Promise.all([
      fetchAllFeeds(),
      fetchCommodityPrices(),
      fetchEconomicContext()
    ]);

    if (articles.length === 0) {
      return res.json({ success: true, data: [], totalProcessed: 0 });
    }

    // Deduplicate and sort
    const deduped = deduplicateByTitle(articles);
    const sorted = sortByRecency(deduped);
    
    // Filter for relevance
    const relevant = filterForRelevance(sorted);

    // Filter out already-seen articles
    const unseen = relevant.filter(a => !seenArticleUrls.has(a.link));

    // If fewer than 3 unseen, reset seen history (we've exhausted the feed)
    if (unseen.length < 3) {
      seenArticleUrls.clear();
    }

    const pool = unseen.length >= 3 ? unseen : relevant;
    const topArticles = pool.slice(0, 6);

    console.log(`Processing ${topArticles.length} articles with Claude...`);

    const analyzedArticles = await processBatch(
      topArticles,
      (article) => analyzeArticleWithClaude(article, commodityPrices, economicContext)
    );

    analyzedArticles.forEach(a => {
      if (a.link) seenArticleUrls.add(a.link);
    });

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
    // Try to fetch full article text first
    let articleText = null;

    // Only fetch if we don't already have full text
    // (description longer than 500 chars = already full text)
    const existingContent = article.description || article.content || '';
    if (existingContent.length < 500 && article.link) {
      articleText = await fetchFullArticleText(article.link);
    }

    const contentToAnalyze = articleText
      || existingContent
      || '';

    const source = articleText ? 'full article' : 'article excerpt';

    const commodityContext = commodityPrices.map(c =>
      `${c.name}: $${c.price} ${c.unit} (${c.change > 0 ? '+' : ''}${c.change}% today)`
    ).join('\n');

    const prompt = `You are a senior supply chain analyst specializing in ${industry}. Respond with ONLY valid JSON. First character must be {.

Article title: "${article.title}"
Article content (${source}):
${contentToAnalyze}

Live commodity prices:
${commodityContext}

Return this JSON:
{
  "article_summary": "2-3 sentences summarizing only what this article explicitly states. No added claims.",
  "sc_summary": [
    "first implication for ${industry} supply chain — only use facts stated in the article",
    "second implication — affected ${industry} operations or suppliers as stated in article",
    "third implication — only include a number or deadline if article explicitly states one"
  ],
  "source_quotes": [
    "exact sentence or phrase copied verbatim from the article content that directly supports summary point 1. Must be a real quote.",
    "exact sentence or phrase copied verbatim from the article content that directly supports summary point 2. Must be a real quote.",
    "exact sentence or phrase copied verbatim from the article content that directly supports summary point 3. Must be a real quote."
  ],
  "sc_relevance_score": <1-5 integer, higher if directly relevant to ${industry}>,
  "tag": "<Trade|Shipping|Disruption|Technology|Economy|Politics>",
  "recommended_actions": [
    "specific action for a ${industry} supply chain manager based on what this article describes",
    "second specific action grounded in article content"
  ],
  "market_signal": "2-3 sentences connecting today's live commodity prices to this specific article. Which commodities are moving in a direction consistent with this event? What does the price movement signal for supply chain managers? Only reference commodities that are genuinely relevant to this article. If no commodity is relevant, write null.",
  "insights": [
    "key signal from this article that a ${industry} manager should act on — grounded in article text",
    "market or operational implication for ${industry} based only on what article states",
    "risk or opportunity for ${industry} supply chains — only if article supports this claim"
  ],
  "ripple": {
    "trigger": "2-4 words — the core event from this article",
    "first_order": [
      {"label": "2 words max", "type": "risk", "detail": "direct consequence for ${industry} from article"},
      {"label": "2 words max", "type": "risk", "detail": "direct consequence for ${industry} from article"},
      {"label": "2 words max", "type": "opportunity", "detail": "direct opportunity for ${industry} from article"}
    ],
    "second_order": [
      {"label": "2 words max", "type": "risk", "detail": "downstream ${industry} effect from article context"},
      {"label": "2 words max", "type": "risk", "detail": "downstream ${industry} effect from article context"},
      {"label": "2 words max", "type": "opportunity", "detail": "downstream ${industry} opportunity"}
    ],
    "third_order": [
      {"label": "2 words max", "type": "risk", "detail": "broader systemic effect on ${industry}"},
      {"label": "2 words max", "type": "opportunity", "detail": "broader systemic opportunity for ${industry}"}
    ]
  },
  "geo_impact": {
    "epicenter": ["country explicitly mentioned in article as origin of event"],
    "high_risk_countries": ["countries explicitly mentioned in article as affected"],
    "affected_ports": [],
    "disrupted_routes": [],
    "secondary_impact": ["countries with indirect exposure based on article context"]
  }
}

STRICT RULES — violation is not acceptable:
- article_summary: only facts from the article text above. Zero additions.
- sc_summary and insights: every point must be traceable to the article text.
- NEVER invent numbers, percentages, dollar figures, or dates not in the article.
- NEVER invent port names, coordinates, or company names not in the article.
- affected_ports and disrupted_routes: only include if article explicitly names them. Otherwise [].
- geo_impact countries: only countries mentioned in the article.
- If article has no specific numbers, describe the qualitative signal instead.
- market_signal must only reference commodities provided in the live market data above
- Never invent price movements or percentages
- If no commodity is relevant to this article, return null for market_signal
- source_quotes: each must be copied VERBATIM from the article text provided above
- source_quotes: if no exact quote exists for a point, write "No direct quote available"
- source_quotes: never paraphrase or invent quotes
- source_quotes array must have exactly 3 items, one per summary point`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
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
      article_summary: analysis.article_summary || null,
      summary: analysis.sc_summary || [],
      source_quotes: analysis.source_quotes || [],
      sc_relevance_score: analysis.sc_relevance_score,
      tag: analysis.tag,
      recommended_actions: analysis.recommended_actions,
      market_signal: analysis.market_signal || null,
      full_text: contentToAnalyze || null,
      insights: analysis.insights || [],
      ripple: analysis.ripple || null,
      geo_impact: analysis.geo_impact || null
    };
  } catch (err) {
    return {
      title: article.title,
      link: article.link,
      pubDate: article.pubDate,
      source: article.source,
      error: 'Failed to analyze article',
      article_summary: null,
      summary: [],
      source_quotes: [],
      sc_relevance_score: 0,
      tag: 'Unknown',
      recommended_actions: [],
      market_signal: null,
      full_text: null,
      insights: []
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
    const topArticles = relevant.slice(0, 6);

    const analyzedArticles = await processBatch(
      topArticles,
      (article) => analyzeArticleWithIndustry(article, commodityPrices, industry)
    );

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

app.get('/api/headlines', async (_req, res) => {
  try {
    // Use cached news if available — no extra API cost
    if (isCacheValid() && cache.all.articles.length > 0) {
      const headlines = cache.all.articles
        .filter(a => a.sc_relevance_score > 0 && a.title)
        .sort((a, b) => b.sc_relevance_score - a.sc_relevance_score)
        .slice(0, 5)
        .map(a => ({
          title: a.title,
          tag: a.tag,
          score: a.sc_relevance_score,
          summary: a.article_summary || null
        }));
      return res.json({ success: true, data: headlines });
    }

    // If no cache, return empty — don't trigger new analysis
    res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

function validateUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  // Only allow http and https
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, reason: 'Only HTTP/HTTPS allowed' };
  }

  // Block private IP ranges and localhost
  const hostname = parsed.hostname.toLowerCase();
  const blocked = [
    'localhost', '127.0.0.1', '0.0.0.0',
    '::1', '169.254', '10.', '192.168.', '172.16.',
    '172.17.', '172.18.', '172.19.', '172.20.',
    '172.21.', '172.22.', '172.23.', '172.24.',
    '172.25.', '172.26.', '172.27.', '172.28.',
    '172.29.', '172.30.', '172.31.',
    'metadata.google.internal',
    '169.254.169.254'
  ];
  for (const b of blocked) {
    if (hostname === b || hostname.startsWith(b)) {
      return { valid: false, reason: 'Private/internal URLs not allowed' };
    }
  }

  return { valid: true };
}

app.post('/api/analyze-url', async (req, res) => {
  try {
    const { url, industry } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL required' });

    const urlCheck = validateUrl(url);
    if (!urlCheck.valid) {
      return res.status(400).json({ success: false, error: 'Invalid URL' });
    }

    const articleRes = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 20000,
      maxRedirects: 5,
      maxContentLength: 5 * 1024 * 1024
    });

    const html = articleRes.data;
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Article';
    const cleanTitle = title.replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000);

    const [commodityPrices, economicContext] = await Promise.all([
      fetchCommodityPrices(),
      fetchEconomicContext()
    ]);

    const fakeArticle = { title: cleanTitle, link: url, description: textContent, pubDate: new Date().toISOString() };

    const result = industry && industry !== 'All'
      ? await analyzeArticleWithIndustry(fakeArticle, commodityPrices, industry)
      : await analyzeArticleWithClaude(fakeArticle, commodityPrices, economicContext);

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/analyze-article', async (req, res) => {
  try {
    const { article, industry } = req.body;
    if (!article) return res.status(400).json({ success: false, error: 'Article required' });

    if (article.full_text) {
      article.description = article.full_text;
    } else if (article.link) {
      const fullText = await fetchFullArticleText(article.link);
      if (fullText) {
        article.description = fullText;
      }
    }

    const commodityPrices = await fetchCommodityPrices();

    const result = industry && industry !== 'General'
      ? await analyzeArticleWithIndustry(article, commodityPrices, industry)
      : await analyzeArticleWithClaude(article, commodityPrices);

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/risk-report', async (req, res) => {
  try {
    const { article, lens } = req.body;
    if (!article) return res.status(400).json({
      success: false, error: 'Article required'
    });

    // Use stored full_text or re-fetch
    let contentToAnalyze = article.full_text
      || article.description
      || article.content
      || '';

    if (contentToAnalyze.length < 500 && article.link) {
      const fullText = await fetchFullArticleText(article.link);
      if (fullText) contentToAnalyze = fullText;
    }
    const truncatedContent = contentToAnalyze.substring(0, 1500);

    const commodityPrices = await fetchCommodityPrices();
    const commodityContext = commodityPrices.map(c =>
      `${c.name}: $${c.price} ${c.unit} (${c.change > 0 ? '+' : ''}${c.change}% today)`
    ).join('\n');

    const prompt = `You are a risk management partner at Deloitte.
Respond with ONLY valid JSON. First character must be {.

You are generating a comprehensive risk analysis for a
${lens} professional based on this news event:

Article title: "${article.title}"
Article content: ${truncatedContent}
Live commodity prices: ${commodityContext}

Return this exact JSON structure:

{
  "executive_summary": "3-4 sentences summarizing the risk landscape for ${lens} professionals based on this specific news event. Be specific to the article content.",

  "overall_risk_level": "HIGH|MEDIUM|LOW",
  "overall_risk_score": <1-10 number>,

  "risks": [
    {
      "id": 1,
      "category": "Market|Operational|Regulatory|Reputational",
      "title": "Short risk title max 6 words",
      "description": "One sentence max.",
      "probability": <1-5>,
      "impact": <1-5>,
      "risk_score": <probability * impact>,
      "early_warning_indicators": ["signal 1", "signal 2"],
      "mitigating_strategy": "One sentence action.",
      "contingency_plan": "One sentence response."
    }
  ],

  "scenarios": {
    "best_case": {
      "title": "Short optimistic title",
      "description": "One sentence — what goes right specific to this event.",
      "revenue_impact": "One sentence impact statement.",
      "timeline": "e.g. Q3 2026 — Q1 2027",
      "strategic_response": "One sentence response for ${lens} professionals."
    },
    "base_case": {
      "title": "Short realistic title",
      "description": "One sentence — most likely outcome based on article.",
      "revenue_impact": "One sentence impact statement.",
      "timeline": "e.g. Q2 2026 — Q4 2026",
      "strategic_response": "One sentence response for ${lens} professionals."
    },
    "worst_case": {
      "title": "Short pessimistic title",
      "description": "One sentence — what goes wrong simultaneously.",
      "revenue_impact": "One sentence impact statement.",
      "timeline": "e.g. Q2 2026 — Q2 2027",
      "strategic_response": "One sentence response for ${lens} professionals."
    },
    "black_swan": {
      "title": "Short extreme scenario title",
      "description": "One sentence — plausible but extreme event.",
      "revenue_impact": "One sentence impact statement.",
      "timeline": "Uncertain — could emerge within weeks",
      "strategic_response": "One sentence emergency response for ${lens} professionals."
    }
  }
}

STRICT RULES:
- Generate exactly 15 risks spread across categories:
  4 Market risks, 4 Operational risks, 4 Regulatory risks, 3 Reputational risks
- Every risk must be grounded in the article content or
  directly connected to the event described
- probability and impact must be integers 1-5
- risk_score must equal probability * impact exactly
- early_warning_indicators must be specific and observable,
  not generic
- All scenarios must reference the specific event in the article
- NEVER invent statistics not in the article
- revenue_impact: if article has no numbers, use qualitative
  terms like "significant margin compression" or
  "moderate cost increase"`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 90000
      }
    );

    const responseText = response.data.content[0].text;
    const cleanText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Raw response:', cleanText.substring(0, 500));
      throw new Error('No JSON found in response');
    }
    const report = JSON.parse(jsonMatch[0]);

    res.json({ success: true, data: report });
  } catch (err) {
    console.error('Risk report error full:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/refresh', async (_req, res) => {
  try {
    cache.all = { articles: [], timestamp: null };
    cache.industries = {};
    console.log('Cache fully cleared, fetching fresh...');

    const [articles, commodityPrices, economicContext] = await Promise.all([
      fetchAllFeeds(),
      fetchCommodityPrices(),
      fetchEconomicContext()
    ]);

    const deduped = deduplicateByTitle(articles);
    const sorted = sortByRecency(deduped);
    const relevant = filterForRelevance(sorted);

    // Filter out already-seen articles
    const unseen = relevant.filter(a => !seenArticleUrls.has(a.link));

    // If fewer than 3 unseen, reset seen history (we've exhausted the feed)
    if (unseen.length < 3) {
      seenArticleUrls.clear();
    }

    const pool = unseen.length >= 3 ? unseen : relevant;
    const topArticles = pool.slice(0, 6);

    const analyzedArticles = await processBatch(
      topArticles,
      (article) => analyzeArticleWithClaude(article, commodityPrices, economicContext)
    );

    analyzedArticles.forEach(a => {
      if (a.link) seenArticleUrls.add(a.link);
    });

    cache.all = {
      articles: analyzedArticles,
      timestamp: Date.now()
    };

    res.json({ success: true, message: 'Refreshed', data: analyzedArticles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
