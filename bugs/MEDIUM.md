# MEDIUM BUGS — Validation & UX Issues

## BUG #10: No `max` attribute on amount inputs

- **Files:**
  - `src/components/AddExpenseModal.jsx:209` — `min="0"` but no `max`
  - `src/components/SettleUpModal.jsx:182` — same issue
- **Problem:** Users can enter astronomically large numbers that could overflow or cause display issues.
- **Fix:** Add a reasonable `max` attribute (e.g., `max="999999999"`) or validate in code.

---

## BUG #11: Negative amounts allowed in ItemizedSplitter

- **File:** `src/components/ItemizedSplitter.jsx:38`
- **Code:** `if (!newItemName.trim() || !newItemPrice) return;`
- **Problem:** Only checks truthiness, not positivity. `parseFloat(newItemPrice)` can be negative, allowing negative-priced items.
- **Fix:** Add: `if (parseFloat(newItemPrice) <= 0) return;`

---

## BUG #12: Recurring expense amount not validated for positivity

- **File:** `src/components/RecurringExpenses.jsx:195-203`
- **Problem:** Amount input has `required` but no `min="0"` or `step="0.01"` attributes. Negative or non-numeric values can be submitted.
- **Fix:** Add `min="0"` and `step="0.01"` to the input.

---

## BUG #13: `parseFloat(value) || 0` silently swallows errors

- **Files:**
  - `src/components/AddExpenseModal.jsx` — lines 41, 59-60, 68, 72, 98, 105, 120, 147
  - `src/components/DebtMinimizer.jsx` — line 42
  - `src/components/ItemizedSplitter.jsx` — lines 38, 59, 81, 105, 119
- **Problem:** Invalid inputs (empty strings, non-numeric text) silently become `0`, hiding data entry mistakes from users.
- **Fix:** Validate input before parseFloat, or show a warning when conversion results in 0.

---

## BUG #14: Hardcoded `₹` symbol despite multi-currency support

- **Files (30+ locations):**
  - `src/pages/Dashboard.jsx` — lines 174, 224, 241, 269
  - `src/pages/GroupDetails.jsx` — lines 252, 267, 280, 288, 337, 426
  - `src/pages/Settlements.jsx` — line 136
  - `src/components/RecurringExpenses.jsx` — lines 194, 288
  - `src/pages/SpendingCharts.jsx` — lines 159, 168, 178, 200, 237, 285
  - `src/pages/ExpenseHistory.jsx` — lines 205, 210, 269, 280, 294
  - `src/components/SettleUpModal.jsx` — line 175
- **Problem:** App supports 10 currencies but hardcodes `₹` in display locations instead of using the existing `formatCurrency()` utility.
- **Fix:** Replace all hardcoded `₹` with `formatCurrency(amount, currency)`.

---

## BUG #15: Hardcoded exchange rates will be wrong in production

- **File:** `src/utils/currency.js:15-26`
- **Code:**
  ```js
  const RATES_TO_INR = {
    INR: 1,
    USD: 83.5,
    EUR: 90.8,
    // ... more hardcoded rates
  };
  ```
- **Problem:** Fixed rates will produce incorrect conversions. The comment acknowledges this but it's a data accuracy issue.
- **Fix:** In production, fetch rates from an API (e.g., exchangerate-api.com) and cache them.
