# CRITICAL BUGS — All FIXED

## BUG #1: Null crash on `currentUser.uid` in AddExpenseModal

- **File:** `src/components/AddExpenseModal.jsx`
- **Status:** FIXED — Now uses `useState(currentUser?.uid || "")` and initializes via `useEffect`.

---

## BUG #2: Null crash on `currentUser.uid` in RecurringExpenses

- **File:** `src/components/RecurringExpenses.jsx`
- **Status:** FIXED — PayerId initialized as `""` and set in `useEffect`.

---

## BUG #3: `useAuth()` returns `null` without guard

- **File:** `src/hooks/useAuth.js`
- **Status:** FIXED — Throws error if context is null.

---

## BUG #4: `onExpenseAdded()` called before `setLoading(false)` + undefined shares

- **File:** `src/components/AddExpenseModal.jsx`
- **Status:** FIXED — `setLoading(false)` moved before `onExpenseAdded()`. Also removed `undefined` shares field from Firestore document.
