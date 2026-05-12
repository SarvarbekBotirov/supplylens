export const getSourceName = (link) => {
  try {
    const host = new URL(link).hostname.replace('www.', '');
    const sourceMap = {
      'supplychaindive.com': 'Supply Chain Dive',
      'supplychainbrain.com': 'SC Brain',
      'freightwaves.com': 'FreightWaves',
      'globaltrademag.com': 'Global Trade Mag',
      'nytimes.com': 'NY Times',
      'bbc.co.uk': 'BBC',
      'reuters.com': 'Reuters',
      'wired.com': 'Wired',
      'ft.com': 'Financial Times',
      'bloomberg.com': 'Bloomberg',
      'dcvelocity.com': 'DC Velocity',
      'inboundlogistics.com': 'Inbound Logistics',
    };
    return sourceMap[host] || host;
  } catch {
    return 'News';
  }
};

export const getArticleAge = (pubDate) => {
  if (!pubDate) return null;
  const hours = Math.round((Date.now() - new Date(pubDate)) / 3600000);
  if (hours < 48) return null;
  return Math.floor(hours / 24);
};

export const calculateRiskScore = (articles) => {
  if (!articles || articles.length === 0) return null;
  const validArticles = articles.filter(a => a.sc_relevance_score > 0);
  if (validArticles.length === 0) return null;
  const avgScore = validArticles.reduce((sum, a) => sum + a.sc_relevance_score, 0) / validArticles.length;
  const disruptionCount = validArticles.filter(a => a.tag?.includes('Disruption')).length;
  const disruptionBoost = (disruptionCount / validArticles.length) * 2;
  const rawScore = Math.min(10, ((avgScore / 5) * 8) + disruptionBoost);
  return {
    score: rawScore.toFixed(1),
    level: rawScore >= 7 ? 'HIGH' : rawScore >= 4 ? 'MEDIUM' : 'LOW',
    color: rawScore >= 7 ? '#ef4444' : rawScore >= 4 ? '#f59e0b' : '#10b981',
    topRisks: validArticles
      .filter(a => a.sc_relevance_score >= 4)
      .sort((a, b) => b.sc_relevance_score - a.sc_relevance_score)
      .slice(0, 3)
      .map(a => ({ title: a.title, tag: a.tag, score: a.sc_relevance_score })),
  };
};
