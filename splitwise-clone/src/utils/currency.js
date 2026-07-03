export const CURRENCIES = {
  INR: { symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  USD: { symbol: "$", name: "US Dollar", locale: "en-US" },
  EUR: { symbol: "€", name: "Euro", locale: "de-DE" },
  GBP: { symbol: "£", name: "British Pound", locale: "en-GB" },
  JPY: { symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  AUD: { symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  CAD: { symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  SGD: { symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
  AED: { symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE" },
  THB: { symbol: "฿", name: "Thai Baht", locale: "th-TH" },
};

// Approximate rates relative to INR (base). In production, fetch from an API.
const RATES_TO_INR = {
  INR: 1,
  USD: 83.5,
  EUR: 90.8,
  GBP: 105.5,
  JPY: 0.56,
  AUD: 54.8,
  CAD: 61.2,
  SGD: 62.3,
  AED: 22.7,
  THB: 2.35,
};

export function convertCurrency(amount, from, to) {
  if (from === to) return amount;
  const numAmount = parseFloat(amount) || 0;
  const rateFrom = RATES_TO_INR[from];
  const rateTo = RATES_TO_INR[to];
  if (!rateFrom || !rateTo) return numAmount;
  return numAmount * rateFrom / rateTo;
}

export function formatCurrency(amount, currencyCode) {
  const c = CURRENCIES[currencyCode] || CURRENCIES.INR;
  const num = parseFloat(amount);
  if (isNaN(num)) return `${c.symbol}0.00`;
  return `${c.symbol}${num.toFixed(2)}`;
}
