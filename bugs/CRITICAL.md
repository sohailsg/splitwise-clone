# CRITICAL BUGS — Will Crash the App

## BUG #1: Null crash on `currentUser.uid` in AddExpenseModal

- **File:** `src/components/AddExpenseModal.jsx:19`
- **Code:** `const [payerId, setPayerId] = useState(currentUser.uid);`
- **Problem:** If `currentUser` is `null` during auth transition, this throws `TypeError: Cannot read properties of null (reading 'uid')` and crashes the modal.
- **Fix:** Use optional chaining or a default: `useState(currentUser?.uid || "")` and initialize `payerId` from a `useEffect` once `currentUser` is confirmed non-null.

---

## BUG #2: Null crash on `currentUser.uid` in RecurringExpenses

- **File:** `src/components/RecurringExpenses.jsx:34`
- **Code:** `payerId: currentUser.uid` inside `useState` initializer
- **Problem:** Same pattern as BUG #1. If `currentUser` is `null`, this crashes.
- **Fix:** Initialize `payerId` as `""` and set it in a `useEffect` when `currentUser` becomes available.

---

## BUG #3: `useAuth()` returns `null` without guard

- **File:** `src/hooks/useAuth.js:5`
- **File:** `src/contexts/AuthContext.js:3` — `createContext(null)`
- **Problem:** Context is initialized with `null`. Any component calling `useAuth()` outside of `AuthProvider` gets `null`. Destructuring `currentUser` from it crashes immediately.
- **Fix:** Throw an error in `useAuth()` if context is null:
  ```js
  export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
  }
  ```

---

## BUG #4: `onExpenseAdded()` called before `setLoading(false)`

- **File:** `src/components/AddExpenseModal.jsx:163-168`
- **Code:**
  ```js
  onExpenseAdded();  // line 163 — likely unmounts this modal
  // ...
  setLoading(false); // line 168 — runs on unmounted component
  ```
- **Problem:** `onExpenseAdded()` fires first, which likely triggers a parent state update that unmounts this modal. Then `setLoading(false)` executes on an unmounted component, producing a React warning or crash.
- **Fix:** Move `setLoading(false)` before `onExpenseAdded()`, or add a guard:
  ```js
  setLoading(false);
  onExpenseAdded();
  ```
