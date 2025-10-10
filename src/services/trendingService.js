// Simple REST client for trending pairs snapshot
// Mirrors indicatorService/pricingService pattern

const API_BASE = 'https://api.fxlabsprime.com';

const buildUrl = (limit) => {
  const params = new URLSearchParams();
  if (typeof limit === 'number' && limit > 0) params.set('limit', String(limit));
  const prefix = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  return `${prefix}/trending-pairs${params.toString() ? `?${params.toString()}` : ''}`;
};

export async function fetchTrendingPairs({ limit } = {}) {
  const url = buildUrl(limit);
  const headers = { 'Content-Type': 'application/json' };
  const apiKey = process.env.REACT_APP_API_TOKEN || process.env.API_TOKEN;
  if (apiKey) headers['X-API-Key'] = apiKey;

  const resp = await fetch(url, { headers, method: 'GET' });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`trending fetch failed (${resp.status}): ${text || resp.statusText}`);
  }
  const data = await resp.json();
  return data;
}

const trendingService = {
  fetchTrendingPairs
};

export default trendingService;

