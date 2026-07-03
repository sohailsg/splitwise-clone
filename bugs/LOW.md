# LOW BUGS — Error Handling & Performance

## BUG #16: Silent error swallowing across 10+ pages

- **Problem:** Many operations catch errors but only `console.error` them, providing no user feedback.

- **Affected locations:**
  - `src/components/RecurringExpenses.jsx` — all 4 operations (create line 87, toggle line 99, delete line 109, logNow line 154) only `console.error`
  - `src/pages/GroupDetails.jsx:88-96` — expense deletion error is silent
  - `src/pages/Friends.jsx:35-43` — remove friend error is silent
  - `src/pages/Groups.jsx:15-32` — fetch error is silent
  - `src/pages/Dashboard.jsx:82-83` — fetch error only logged to console
  - `src/pages/ExpenseHistory.jsx` — silent on fetch errors
  - `src/pages/ScanReceiptPage.jsx` — silent on fetch errors
  - `src/pages/Settlements.jsx` — silent on fetch errors
  - `src/pages/DebtMinimizerPage.jsx` — silent on fetch errors
  - `src/components/SettleUpModal.jsx:25-45,47-80` — both fetch operations silent

- **Fix:** Add `error` state variables and display user-facing error messages (toast, inline, or alert).

---

## BUG #17: `confirm()` dialogs freeze the event loop

- **Files:**
  - `src/components/RecurringExpenses.jsx:104` — `if (!confirm("Delete this recurring expense?")) return;`
  - `src/pages/GroupDetails.jsx:89` — `if (!confirm("Delete this expense?")) return;`
  - `src/pages/Friends.jsx:36` — `if (!confirm("Remove this friend?")) return;`
- **Problem:** Native `confirm()` is blocking, cannot be styled, and freezes the JavaScript event loop.
- **Fix:** Replace with a custom modal confirmation component.

---

## BUG #18: `getNetBalances()` recalculates on every render without `useMemo`

- **File:** `src/pages/Dashboard.jsx:131-147`
- **Code:**
  ```js
  const getNetBalances = () => { /* ... */ };
  const netBalances = getNetBalances(); // called in render path
  ```
- **Problem:** Recalculates on every render even when `youOwe` and `owesYou` haven't changed.
- **Fix:** Wrap in `useMemo`:
  ```js
  const netBalances = useMemo(() => {
    const net = {};
    youOwe.forEach((debt) => { /* ... */ });
    owesYou.forEach((debt) => { /* ... */ });
    return net;
  }, [youOwe, owesYou]);
  ```

---

## BUG #19: Dashboard shows forever-loading on fetch failure

- **File:** `src/pages/Dashboard.jsx:28-86`
- **Problem:** If the main fetch fails, `setLoading(false)` runs in the `finally` block, but there's no error state to show the user what happened. User sees an empty dashboard with no explanation.
- **Fix:** Add an `error` state and display it:
  ```js
  const [error, setError] = useState(null);
  // in catch:
  setError("Failed to load dashboard data");
  // in JSX:
  {error && <p className="text-red-500">{error}</p>}
  ```

---

## BUG #20: No input length limits on text fields

- **Files:**
  - `src/components/AddExpenseModal.jsx:191` — description input
  - `src/pages/Signup.jsx:55` — name input
  - `src/pages/Login.jsx:41` — email input
- **Problem:** No `maxLength` attributes. Users can submit arbitrarily long strings to Firestore, causing storage bloat and potential performance issues.
- **Fix:** Add `maxLength` attributes (e.g., `maxLength="100"` for names, `maxLength="500"` for descriptions).
