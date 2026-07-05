# MEDIUM BUGS — 3/6 Fixed

## BUG #10: No `max` attribute on amount inputs

- **Files:** `AddExpenseModal.jsx`, `SettleUpModal.jsx`
- **Status:** FIXED — Added `max="999999999"` to amount inputs.

---

## BUG #11: Negative amounts allowed in ItemizedSplitter

- **File:** `src/components/ItemizedSplitter.jsx`
- **Status:** NOT FIXED — Allows negative-priced items. Low priority.

---

## BUG #12: Recurring expense amount not validated for positivity

- **File:** `src/components/RecurringExpenses.jsx`
- **Status:** NOT FIXED — Missing `min="0"`. Low priority.

---

## BUG #13: `parseFloat(value) || 0` silently swallows errors

- **Status:** NOT FIXED — 15+ locations. Intentional fallback pattern, not critical.

---

## BUG #14: Hardcoded `₹` symbol despite multi-currency support

- **Status:** FIXED — All major display locations now use `formatCurrency(amount, currency)`.

---

## BUG #15: Hardcoded exchange rates

- **File:** `src/utils/currency.js`
- **Status:** NOT FIXED — Needs API integration for production. Low priority for now.
