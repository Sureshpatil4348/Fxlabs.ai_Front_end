// Centralized list of supported trading pairs (UI symbols without broker suffix)
// Grouped for readability; exported as SUPPORTED_PAIRS

// Core currency pairs - Major pairs only (7 pairs) - sorted alphabetically
export const CORE_PAIRS = [
  'AUDUSD', 'EURUSD', 'GBPUSD', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY'
];

// Extended currency pairs - Cross pairs (21 pairs) - sorted alphabetically
export const EXTENDED_PAIRS = [
  'AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD',
  'CADCHF', 'CADJPY',
  'CHFJPY',
  'EURAUD', 'EURCAD', 'EURCHF', 'EURGBP', 'EURJPY', 'EURNZD',
  'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPJPY', 'GBPNZD',
  'NZDCAD', 'NZDCHF', 'NZDJPY'
];

// Commodities & Precious Metals pairs - sorted alphabetically
export const PRECIOUS_METALS_PAIRS = [
  'USOIL',   // Crude Oil
  'XAGUSD',  // Silver
  'XAUUSD'   // Gold
];

// Cryptocurrency pairs - sorted alphabetically
export const CRYPTO_PAIRS = [
  'BTCUSD', // Bitcoin
  'ETHUSD'  // Ethereum
];

// Index symbols (OHLC-only indices exposed to KLineChart via REST / WebSocket)
export const INDEX_PAIRS = [
  'DXY' // U.S. Dollar Index (DXYm on broker)
];

// All supported pairs for UI selection
export const SUPPORTED_PAIRS = [
  ...CORE_PAIRS,
  ...EXTENDED_PAIRS,
  ...PRECIOUS_METALS_PAIRS,
  ...CRYPTO_PAIRS
];

// Broker symbol helpers (FxLabs Prime typically uses trailing 'm')
export const BROKER_SUFFIX = 'm';

export function toBrokerSymbol(symbol = '') {
  const s = String(symbol).trim();
  if (!s) return s;
  return s.endsWith(BROKER_SUFFIX) ? s : s + BROKER_SUFFIX;
}

export function fromBrokerSymbol(symbol = '') {
  const s = String(symbol).trim();
  if (!s) return s;
  return s.endsWith(BROKER_SUFFIX) ? s.slice(0, -BROKER_SUFFIX.length) : s;
}
