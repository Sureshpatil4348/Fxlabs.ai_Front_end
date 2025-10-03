// Simple REST client for indicator snapshots (cache-first backend)
// Fixed API base per product guidance
const API_BASE = 'https://api.fxlabs.ai';

const buildUrl = (indicator, timeframe, pairs) => {
  const params = new URLSearchParams();
  params.set('indicator', indicator);
  params.set('timeframe', timeframe);
  (pairs || []).forEach((p) => params.append('pairs', p));
  const prefix = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  return `${prefix}/api/indicator?${params.toString()}`;
};

export async function fetchIndicatorSnapshot({ indicator, timeframe, pairs }) {
  if (!indicator || !timeframe) {
    throw new Error('indicator and timeframe are required');
  }

  const url = buildUrl(indicator, timeframe, pairs || []);
  const headers = { 'Content-Type': 'application/json' };

  const resp = await fetch(url, { headers, method: 'GET' });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`indicator fetch failed (${resp.status}): ${text || resp.statusText}`);
  }
  return resp.json();
}

const indicatorService = {
  fetchIndicatorSnapshot
};

export default indicatorService;


