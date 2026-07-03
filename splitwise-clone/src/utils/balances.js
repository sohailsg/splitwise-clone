export function computeRawBalances(expenses, settlements) {
  const balances = {};

  (expenses || []).forEach((expense) => {
    const { payerId, splits } = expense;
    if (!splits) return;

    splits.forEach((split) => {
      if (split.uid === payerId) return;

      if (!balances[split.uid]) balances[split.uid] = {};
      if (!balances[split.uid][payerId]) balances[split.uid][payerId] = 0;

      balances[split.uid][payerId] += parseFloat(split.amount) || 0;
    });
  });

  (settlements || []).forEach((settlement) => {
    const { fromUserId, toUserId, amount } = settlement;

    if (!balances[fromUserId]) balances[fromUserId] = {};
    if (!balances[fromUserId][toUserId]) balances[fromUserId][toUserId] = 0;

    balances[fromUserId][toUserId] -= parseFloat(amount) || 0;
  });

  return balances;
}

export function netPairwiseBalances(balances) {
  const net = {};
  const processed = new Set();

  Object.keys(balances).forEach((from) => {
    Object.keys(balances[from]).forEach((to) => {
      const pairKey = [from, to].sort().join("-");
      if (processed.has(pairKey)) return;

      const amountA = balances[from]?.[to] || 0;
      const amountB = balances[to]?.[from] || 0;
      const netAmount = amountA - amountB;

      if (Math.abs(netAmount) > 0.01) {
        const actualFrom = netAmount > 0 ? from : to;
        const actualTo = netAmount > 0 ? to : from;

        if (!net[actualFrom]) net[actualFrom] = {};
        net[actualFrom][actualTo] = Math.abs(netAmount);
      }

      processed.add(pairKey);
    });
  });

  return net;
}

export function calculateBalances(expenses, settlements, currentUserId) {
  const balances = computeRawBalances(expenses, settlements);
  const simplified = simplifyBalances(balances, currentUserId);
  return simplified;
}

function simplifyBalances(balances, currentUserId) {
  const debts = [];
  const processed = new Set();

  Object.keys(balances).forEach((from) => {
    Object.keys(balances[from]).forEach((to) => {
      const pairKey = [from, to].sort().join("-");
      if (processed.has(pairKey)) return;

      const amountA = balances[from]?.[to] || 0;
      const amountB = balances[to]?.[from] || 0;
      const netAmount = amountA - amountB;

      if (Math.abs(netAmount) > 0.01) {
        const actualFrom = netAmount > 0 ? from : to;
        const actualTo = netAmount > 0 ? to : from;
        const actualAmount = Math.abs(netAmount);

        if (actualFrom === currentUserId) {
          debts.push({
            from: actualFrom,
            to: actualTo,
            amount: actualAmount,
            type: "you_owe",
          });
        } else if (actualTo === currentUserId) {
          debts.push({
            from: actualFrom,
            to: actualTo,
            amount: actualAmount,
            type: "owes_you",
          });
        }
      }

      processed.add(pairKey);
    });
  });

  return debts;
}

export function getYouOwe(expenses, settlements, currentUserId) {
  const debts = calculateBalances(expenses, settlements, currentUserId);
  return debts.filter((d) => d.type === "you_owe");
}

export function getOwesYou(expenses, settlements, currentUserId) {
  const debts = calculateBalances(expenses, settlements, currentUserId);
  return debts.filter((d) => d.type === "owes_you");
}

export function getNetBalance(expenses, settlements, currentUserId) {
  const debts = calculateBalances(expenses, settlements, currentUserId);
  const youOwe = debts
    .filter((d) => d.type === "you_owe")
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const owesYou = debts
    .filter((d) => d.type === "owes_you")
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  return Math.round((owesYou - youOwe) * 100) / 100;
}
