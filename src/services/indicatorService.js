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
  const data = await resp.json();

  // Targeted debug log for BTCUSDm initial REST snapshot
  try {
    const requestedPairs = Array.isArray(pairs) ? pairs : [];
    if (requestedPairs.some((p) => String(p).toUpperCase() === 'BTCUSDm'.toUpperCase())) {
      const entries = Array.isArray(data?.pairs) ? data.pairs : [];
      const btc = entries.find((e) => (e?.symbol || '').toUpperCase() === 'BTCUSDm'.toUpperCase());
      console.log(
        `[REST][Indicator][BTCUSDm] indicator=${indicator} timeframe=${String(timeframe).toUpperCase()}`,
        {
          requestPairsCount: requestedPairs.length,
          hasBTCUSDmInRequest: true,
          responseItem: btc || null,
          responseTs: btc?.ts || null,
          url
        }
      );
    } else {
      // If not explicitly requested, still log when response contains BTCUSDm
      const entries = Array.isArray(data?.pairs) ? data.pairs : [];
      const btc = entries.find((e) => (e?.symbol || '').toUpperCase() === 'BTCUSDm'.toUpperCase());
      if (btc) {
        console.log(
          `[REST][Indicator][BTCUSDm] indicator=${indicator} timeframe=${String(timeframe).toUpperCase()} (found in response)`,
          {
            requestPairsCount: Array.isArray(pairs) ? pairs.length : 0,
            hasBTCUSDmInRequest: false,
            responseItem: btc,
            responseTs: btc?.ts || null,
            url
          }
        );
      }
    }
  } catch (_e) {
    // best-effort logging only
  }

  // Debug for currency_strength responses as well
  try {
    if (String(indicator).toLowerCase() === 'currency_strength') {
      console.log('[REST][Indicator][currency_strength]', {
        timeframe: String(timeframe).toUpperCase(),
        hasStrength: !!(data?.strength || data?.data?.strength),
        keys: data?.strength ? Object.keys(data.strength) : (data?.data?.strength ? Object.keys(data.data.strength) : []),
        url
      });
    }
  } catch (_e) {
    // best-effort logging only
  }

  return data;
}

const indicatorService = {
  fetchIndicatorSnapshot
};

export default indicatorService;


