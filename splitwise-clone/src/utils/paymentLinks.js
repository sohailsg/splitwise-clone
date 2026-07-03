export const PAYMENT_APPS = {
  upi: {
    name: "UPI",
    apps: [
      { name: "Google Pay", icon: "GP", scheme: "tez://upi/pay" },
      { name: "PhonePe", icon: "PP", scheme: "phonepe://pay" },
      { name: "Paytm", icon: "PT", scheme: "paytmmp://pay" },
    ],
  },
  venmo: {
    name: "Venmo",
    apps: [{ name: "Venmo", icon: "V", scheme: "venmo://paycharge" }],
  },
  paypal: {
    name: "PayPal",
    apps: [{ name: "PayPal", icon: "P", scheme: "paypal://xmoney/request" }],
  },
};

export function buildUpiLink(recipientUpiId, amount, note, recipientName = "") {
  const params = new URLSearchParams({
    pa: recipientUpiId,
    pn: recipientName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

export function buildVenmoLink(recipientUsername, amount, note) {
  const params = new URLSearchParams({
    txn: "pay",
    recipients: recipientUsername,
    amount: amount.toFixed(2),
    note,
  });
  return `venmo://paycharge?${params.toString()}`;
}

export function buildPaypalLink(recipientEmail, amount, note) {
  const params = new URLSearchParams({
    receiver: recipientEmail,
    amount: amount.toFixed(2),
    currencyCode: "USD",
    note,
  });
  return `paypal://xmoney/request?${params.toString()}`;
}

export function openPaymentApp(url) {
  if (typeof window !== "undefined" && window.location) {
    window.location.href = url;
  }
}

export function getCategoryIcon(category) {
  const icons = {
    food: "🍕",
    transport: "🚗",
    utilities: "💡",
    entertainment: "🎬",
    groceries: "🛒",
    rent: "🏠",
    health: "💊",
    travel: "✈️",
    shopping: "🛍️",
    education: "📚",
    other: "📦",
  };
  return icons[category] || icons.other;
}

export const CATEGORIES = [
  { id: "food", label: "Food & Dining", icon: "🍕" },
  { id: "transport", label: "Transport", icon: "🚗" },
  { id: "utilities", label: "Utilities", icon: "💡" },
  { id: "entertainment", label: "Entertainment", icon: "🎬" },
  { id: "groceries", label: "Groceries", icon: "🛒" },
  { id: "rent", label: "Rent", icon: "🏠" },
  { id: "health", label: "Health", icon: "💊" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "education", label: "Education", icon: "📚" },
  { id: "other", label: "Other", icon: "📦" },
];
