// Centralized list of supported trading pairs (UI symbols without broker suffix)
// Grouped for readability; exported as SUPPORTED_PAIRS

// Core currency pairs - Major pairs only (7 pairs)
export const CORE_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'
];

// Extended currency pairs - Cross pairs (21 pairs)
export const EXTENDED_PAIRS = [
  // EUR crosses (6)
  'EURGBP', 'EURJPY', 'EURCHF', 'EURAUD', 'EURCAD', 'EURNZD',

  // GBP crosses (5)
  'GBPJPY', 'GBPCHF', 'GBPAUD', 'GBPCAD', 'GBPNZD',

  // AUD crosses (4)
  'AUDJPY', 'AUDCHF', 'AUDCAD', 'AUDNZD',

  // NZD crosses (3)
  'NZDJPY', 'NZDCHF', 'NZDCAD',

  // CAD crosses (2)
  'CADJPY', 'CADCHF',

  // CHF crosses (1)
  'CHFJPY'
];

// Precious Metals pairs
export const PRECIOUS_METALS_PAIRS = [
  'XAUUSD', // Gold
  'XAGUSD'  // Silver
];

// Cryptocurrency pairs
export const CRYPTO_PAIRS = [
  'BTCUSD', // Bitcoin
  'ETHUSD'  // Ethereum
];

// All supported pairs for UI selection
export const SUPPORTED_PAIRS = [
  ...CORE_PAIRS,
  ...EXTENDED_PAIRS,
  ...PRECIOUS_METALS_PAIRS,
  ...CRYPTO_PAIRS
];

// Broker symbol helpers (FxLabs typically uses trailing 'm')
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

