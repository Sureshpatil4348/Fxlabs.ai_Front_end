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
  const data = await resp.json();

  // Targeted debug log for BTCUSDm correlation in initial REST snapshot
  try {
    const requestedPairs = Array.isArray(pairs) ? pairs : [];
    const includesBTCUSDm = requestedPairs.some((p) => String(p).toUpperCase().includes('BTCUSDm'.toUpperCase()))
      || requestedPairs.some((p) => String(p).toUpperCase().includes('BTCUSD'.toUpperCase()));

    const entries = Array.isArray(data?.pairs) ? data.pairs : [];
    const btcRelated = entries.filter((e) => {
      const key = String(e?.pair_key || '').toUpperCase();
      return key.includes('BTCUSDm'.toUpperCase()) || key.includes('BTCUSD'.toUpperCase());
    });

    if (includesBTCUSDm || btcRelated.length > 0) {
      console.log(
        `[REST][Correlation][BTCUSDm] timeframe=${String(timeframe).toUpperCase()} window=${window}`,
        {
          requestPairsCount: requestedPairs.length,
          hasBTCUSDmInRequest: includesBTCUSDm,
          btcPairsInResponse: btcRelated,
          url
        }
      );
    }
  } catch (_e) {
    // best-effort logging only
  }

  return data;
}

const correlationService = {
  fetchCorrelationSnapshot
};

export default correlationService;


