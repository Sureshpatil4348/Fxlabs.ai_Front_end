// Simple REST client for pricing snapshots (cache-first backend)
// Mirrors indicatorService pattern

const API_BASE = 'https://api.fxlabsprime.com';

const buildUrl = (pairs) => {
  const params = new URLSearchParams();
  (pairs || []).forEach((p) => params.append('pairs', p));
  const prefix = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  return `${prefix}/api/pricing?${params.toString()}`;
};

export async function fetchPricingSnapshot({ pairs }) {
  const inputPairs = Array.from(new Set(pairs || [])).slice(0, 32);
  if (inputPairs.length === 0) {
    throw new Error('pairs are required');
  }

  const url = buildUrl(inputPairs);
  const headers = { 'Content-Type': 'application/json' };

  const resp = await fetch(url, { headers, method: 'GET' });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`pricing fetch failed (${resp.status}): ${text || resp.statusText}`);
  }
  return resp.json();
}

const pricingService = {
  fetchPricingSnapshot
};

export default pricingService;

