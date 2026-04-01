const BASE_URL = 'http://localhost:3000';

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
  const response = await fetch(`http://localhost:3000/api/news/${industry}`);
  const data = await response.json();
  return data;
};
