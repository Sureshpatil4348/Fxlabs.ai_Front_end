// Simple REST client for correlation snapshots (cache-first backend)
// Fixed API base per product guidance
const API_BASE = 'https://api.fxlabs.ai';

const buildUrl = (timeframe, pairs, windowParam) => {
  const params = new URLSearchParams();
  if (!timeframe) throw new Error('timeframe is required');
  params.set('timeframe', timeframe);
  (pairs || []).forEach((p) => params.append('pairs', p));
  if (Number.isFinite(windowParam)) params.set('window', String(windowParam));
  const prefix = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  return `${prefix}/api/correlation?${params.toString()}`;
};

export async function fetchCorrelationSnapshot({ timeframe, pairs, window = 50 }) {
  if (!timeframe) {
    throw new Error('timeframe is required');
  }

  const url = buildUrl(timeframe, pairs || [], window);
  const headers = { 'Content-Type': 'application/json' };

  const resp = await fetch(url, { headers, method: 'GET' });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`correlation fetch failed (${resp.status}): ${text || resp.statusText}`);
  }
  return resp.json();
}

const correlationService = {
  fetchCorrelationSnapshot
};

export default correlationService;


