const BASE_URL = 'https://supplylens-backend.onrender.com';

export const fetchNews = async () => {
  const response = await fetch(`${BASE_URL}/api/news`);
  const data = await response.json();
  return data;
};

export const fetchCommodities = async () => {
  const response = await fetch(`${BASE_URL}/api/commodities`);
  const data = await response.json();
  return data;
};

export const fetchEconomicContext = async () => {
  const response = await fetch(`${BASE_URL}/api/economic-context`);
  const data = await response.json();
  return data;
};

export const fetchNewsByIndustry = async (industry) => {
  const response = await fetch(`https://supplylens-backend.onrender.com/api/news/${industry}`);
  const data = await response.json();
  return data;
};

export const analyzeUrl = async (url, industry) => {
  const response = await fetch('https://supplylens-backend.onrender.com/api/analyze-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, industry })
  });
  const data = await response.json();
  return data;
};

export const analyzeArticleWithLens = async (article, industry) => {
  const response = await fetch('https://supplylens-backend.onrender.com/api/analyze-article', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ article, industry })
  });
  const data = await response.json();
  return data;
};

export const refreshNews = async () => {
  const response = await fetch('https://supplylens-backend.onrender.com/api/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
};

export const fetchHeadlines = async () => {
  const response = await fetch(
    'https://supplylens-backend.onrender.com/api/headlines'
  );
  return response.json();
};

export const generateRiskReport = async (article, lens) => {
  const response = await fetch(
    'https://supplylens-backend.onrender.com/api/risk-report',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article, lens })
    }
  );
  return response.json();
};

export const checkSupplierRisk = async (article, supplier) => {
  const response = await fetch(
    'https://supplylens-backend.onrender.com/api/check-supplier',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article, supplier })
    }
  );
  return response.json();
};
