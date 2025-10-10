// Netlify Function: IP Info Proxy
// - Determines client IP from headers (or ?ip= override)
// - Calls ASOasis IP info API with client credentials from env
// - Never exposes secrets to the browser

const API_BASE = 'https://api.asoasis.tech/ip-info/ip';

/**
 * Extract client IP from Netlify/standard headers
 */
function resolveClientIp(event) {
  const h = event.headers || {};
  const xf = (h['x-forwarded-for'] || h['X-Forwarded-For'] || '').split(',')[0].trim();
  const nf = h['x-nf-client-connection-ip'] || h['X-NF-Client-Connection-IP'];
  const xr = h['x-real-ip'] || h['X-Real-IP'];
  const ci = h['client-ip'] || h['Client-IP'];
  return xf || nf || xr || ci || '';
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Allow manual override via query param for local testing: /.netlify/functions/ip-info?ip=1.2.3.4
    const params = new URLSearchParams(event.rawQuery || event.queryStringParameters || '');
    const overrideIp = params.get ? params.get('ip') : (event.queryStringParameters && event.queryStringParameters.ip);

    const clientIp = (overrideIp || resolveClientIp(event) || '').trim();
    if (!clientIp) {
      return { statusCode: 400, body: 'Unable to determine client IP' };
    }

    // API-specific credentials (do not expose via REACT_APP_*)
    const clientId = process.env.ASOASIS_API_IP_INFO_CLIENT_ID;
    const clientSecret = process.env.ASOASIS_API_IP_INFO_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return { statusCode: 500, body: 'Server misconfiguration: missing ASOASIS client credentials' };
    }

    // Header names are fixed as `client-id` and `client-secret`
    const clientIdHeader = 'client-id';
    const clientSecretHeader = 'client-secret';

    const url = `${API_BASE}/${encodeURIComponent(clientIp)}`;
    const headers = {
      'Accept': 'application/json',
      [clientIdHeader]: clientId,
      [clientSecretHeader]: clientSecret,
    };

    const resp = await fetch(url, { method: 'GET', headers });
    const text = await resp.text();

    // Best-effort JSON pass-through
    const contentType = resp.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? text : JSON.stringify({ raw: text });

    return {
      statusCode: resp.status,
      headers: { 'Content-Type': 'application/json' },
      body,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'proxy_failed', message: err && err.message ? err.message : String(err) }),
    };
  }
};
