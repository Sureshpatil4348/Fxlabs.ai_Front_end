// Client-side adapter to fetch IP info via Netlify Function proxy

const DEFAULT_ENDPOINT = '/.netlify/functions/ip-info';

export async function fetchIpInfo() {
  const endpoint = process.env.REACT_APP_IP_INFO_FUNCTION_URL || DEFAULT_ENDPOINT;
  const resp = await fetch(endpoint, { method: 'GET' });
  const contentType = resp.headers.get('content-type') || '';
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`IP info fetch failed (${resp.status}): ${text || resp.statusText}`);
  }
  if (!contentType.includes('application/json')) {
    const bodyPreview = await resp.text().catch(() => '');
    throw new Error(
      `IP info response is not JSON (got content-type: ${contentType || 'unknown'}). ` +
      `This often happens when the request hits the SPA index.html (e.g., wrong path or functions not enabled). ` +
      `Verify /.netlify/functions/ip-info is deployed and reachable. Body preview: ` +
      (bodyPreview ? bodyPreview.slice(0, 160) : 'n/a')
    );
  }
  return resp.json();
}

const ipInfoService = { fetchIpInfo };
export default ipInfoService;
