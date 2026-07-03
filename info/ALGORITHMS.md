# Algorithms & Data Structures

## 1. Balance Calculation (`utils/balances.js`)

### Purpose
Computes net balances between every pair of users, then filters to show only debts relevant to the current user.

### Algorithm — Two-Phase Approach

**Phase 1: Accumulate Raw Pairwise Debts**

```
For each expense:
  For each split where split.uid ≠ payerId:
    balances[split.uid][payerId] += split.amount

For each settlement:
  balances[fromUserId][toUserId] -= settlement.amount
```

This builds a 2D map: `balances[debtor][creditor] = amount_owed`

**Phase 2: Simplify via Netting**

```
For each pair (from, to) where from < to (to avoid duplicates):
  netAmount = balances[from][to] - balances[to][from]

  if |netAmount| > 0.01:
    if netAmount > 0: from owes to
    else: to owes from

    Only include if currentUserId is involved
```

### Complexity
- **Time:** O(E + S + P²) where E = expenses, S = settlements, P = unique participants
- **Space:** O(P²) for the balances map

### Edge Cases
- Self-splits (payer paying their own share) are skipped
- Floating-point precision handled with 0.01 cent threshold
- Null/undefined inputs safely default to empty arrays

---

## 2. Debt Minimization (`utils/debtMinimizer.js`)

### Purpose
Minimizes the total number of transactions needed to settle a group of debts. This is the classic **"Minimum Cash Flow"** or **"Optimal Account Balancing"** problem.

### Algorithm — Greedy Two-Pointer

**Step 1: Compute Net Balance Per User**

```
For each (from → to) with amount:
  net[from] += amount   // debtor (positive = owes money)
  net[to]   -= amount   // creditor (negative = owed money)
```

**Step 2: Partition into Debtors and Creditors**

```
debtors  = users where net > 0.01  (sorted descending by amount)
creditors = users where net < -0.01 (sorted descending by absolute amount)
```

**Step 3: Greedy Settlement**

```
i = 0 (debtors pointer)
j = 0 (creditors pointer)

while i < debtors.length AND j < creditors.length:
  settleAmount = min(debtors[i].amount, creditors[j].amount)

  if settleAmount > 0.01:
    emit transaction: debtors[i] → creditors[j] for settleAmount

  debtors[i].amount  -= settleAmount
  creditors[j].amount -= settleAmount

  if debtors[i].amount < 0.01:  i++
  if creditors[j].amount < 0.01: j++
```

### Example

Given: Alice owes $10, Bob owes $5, Charlie is owed $12, Diana is owed $3

**Naive approach (4 transactions):**
- Alice → Charlie: $10
- Alice → Diana: $0
- Bob → Charlie: $5
- Bob → Diana: $0

**Minimized approach (3 transactions):**
- Alice → Charlie: $10
- Bob → Diana: $3
- Alice → Diana: $2

### Complexity
- **Time:** O(N log N) where N = number of people (due to sorting)
- **Space:** O(N) for debtors/creditors arrays

### Guarantee
For N people with arbitrary debts, the algorithm achieves **at most N-1 transactions**, which is the theoretical minimum.

---

## 3. Currency Conversion (`utils/currency.js`)

### Purpose
Converts amounts between 10 supported currencies using static exchange rates with INR as the pivot currency.

### Supported Currencies

| Code | Symbol | Name |
|------|--------|------|
| INR | ₹ | Indian Rupee |
| USD | $ | US Dollar |
| EUR | € | Euro |
| GBP | £ | British Pound |
| JPY | ¥ | Japanese Yen |
| AUD | A$ | Australian Dollar |
| CAD | C$ | Canadian Dollar |
| SGD | S$ | Singapore Dollar |
| AED | د.إ | UAE Dirham |
| THB | ฿ | Thai Baht |

### Algorithm

```
convertCurrency(amount, from, to):
  if from == to: return amount

  // Convert via INR as pivot
  inrAmount = amount * RATES_TO_INR[from]
  result = inrAmount / RATES_TO_INR[to]

  return result
```

### Example
```
convertCurrency(100, "USD", "EUR"):
  inrAmount = 100 * 83.5 = 8350 INR
  result = 8350 / 90.8 = 91.96 EUR
```

### Limitation
- Rates are hardcoded and will become stale
- JPY formatted with decimals (real JPY has none)
- Unknown currencies silently return original amount

---

## 4. Pairwise Balance Calculation (`pages/GroupDetails.jsx`)

### Purpose
Computes a nested balance map showing who owes whom within a specific group.

### Algorithm

```
For each expense in group:
  For each split where split.uid ≠ payerId:
    raw[split.uid][payerId] += split.amount

// Net bidirectional debts
For each pair (A, B):
  if A owes B $30 and B owes A $20:
    net[A][B] = $10  (A owes B $10 net)
```

### Output Format
```js
{
  "uid1": { "uid2": 50.00, "uid3": 25.00 },
  "uid2": { "uid1": 0 },
  "uid3": { "uid1": 0 }
}
```

---

## 5. Net Balance Aggregation (`pages/Dashboard.jsx`)

### Purpose
Aggregates all debts into per-person net amounts for the dashboard display.

### Algorithm

```
For each debt in youOwe:
  net[debt.to] -= debt.amount

For each debt in owesYou:
  net[debt.from] += debt.amount
```

### Output Format
```js
{
  "uid1": -50.00,  // you owe uid1 $50
  "uid2": 30.00,   // uid2 owes you $30
  "uid3": 0        // settled
}
```

---

## 6. Itemized Split Calculation (`components/ItemizedSplitter.jsx`)

### Purpose
Splits individual receipt items among assigned group members.

### Algorithm

```
For each item:
  assignedMembers = members assigned to this item
  perPersonCost = item.price / assignedMembers.length

  For each assigned member:
    memberTotals[member.uid] += perPersonCost
```

### Output Format
```js
{
  "items": [...],
  "splits": { "uid1": 450.00, "uid2": 320.00 },
  "total": 770.00
}
```

---

## 7. Spending Aggregation (`pages/SpendingCharts.jsx`)

### Purpose
Aggregates expense data for visual charts (monthly trends, category breakdown, per-person spending).

### Aggregations

**Monthly Trend:**
```
For each expense:
  month = expense.date.substring(0, 7)  // "2026-07"
  monthlyTotals[month] += expense.amount
```

**Category Breakdown:**
```
For each expense:
  category = expense.category || "other"
  categoryTotals[category] += expense.amount
```

**Per-Person Spending:**
```
For each expense:
  payerTotals[expense.payerId] += expense.amount
```

---

## Data Flow Summary

```
User Action
    ↓
React Component (pages/ or components/)
    ↓
Firebase Firestore (read/write)
    ↓
Utility Functions (utils/)
    ↓
UI Update (React re-render)
```

### Key Data Structures

| Structure | Format | Used In |
|-----------|--------|---------|
| Expense | `{ groupId, payerId, amount, splits[], splitType, date, ... }` | Firestore `expenses` collection |
| Split | `{ uid, amount }` | Embedded in expense document |
| Settlement | `{ fromUserId, toUserId, groupId, amount, date }` | Firestore `settlements` collection |
| Balance Map | `{ [debtorUid]: { [creditorUid]: amount } }` | `debtMinimizer.js`, `GroupDetails.jsx` |
| Debt Object | `{ from, to, amount, type }` | `balances.js` output |
| Transaction | `{ from, to, amount }` | `debtMinimizer.js` output |
