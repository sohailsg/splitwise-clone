import { computeRawBalances } from "./balances";

export function minimizeDebts(balances) {
  const net = {};

  Object.entries(balances).forEach(([from, targets]) => {
    Object.entries(targets).forEach(([to, amount]) => {
      if (!net[from]) net[from] = 0;
      if (!net[to]) net[to] = 0;
      net[from] += amount;
      net[to] -= amount;
    });
  });

  const debtors = [];
  const creditors = [];

  Object.entries(net).forEach(([uid, amount]) => {
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0.01) debtors.push({ uid, amount: rounded });
    else if (rounded < -0.01) creditors.push({ uid, amount: Math.abs(rounded) });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const settleAmount = Math.min(debtors[i].amount, creditors[j].amount);
    if (settleAmount > 0.01) {
      transactions.push({
        from: debtors[i].uid,
        to: creditors[j].uid,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    debtors[i].amount -= settleAmount;
    creditors[j].amount -= settleAmount;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return transactions;
}

export function summarizeDebts(expenses, settlements) {
  return computeRawBalances(expenses, settlements);
}
