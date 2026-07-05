# LOW BUGS — 4/5 Fixed

## BUG #16: Silent error swallowing across 10+ pages

- **Status:** FIXED — Added error states and user-facing alerts to key operations (add/remove member, delete expense, leave group, settle up, add evidence).

---

## BUG #17: Native `confirm()` dialogs freeze the event loop

- **Status:** ACCEPTED — Kept native `confirm()` for now. Functional, just not pretty.

---

## BUG #18: `getNetBalances()` recalculates on every render without `useMemo`

- **Status:** FIXED — Replaced with `calculateGroupBalances()` using `computeRawBalances()` + `netPairwiseBalances()` from shared utility.

---

## BUG #19: Dashboard shows forever-loading on fetch failure

- **Status:** FIXED — Added `error` state and displays error message to user.

---

## BUG #20: No input length limits on text fields

- **Status:** FIXED — Added `maxLength="200"` to description inputs, `maxLength` on name fields.
