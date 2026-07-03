# HIGH BUGS — Logic/Data Errors

## BUG #5: Stale closure in `handleShareChange`

- **File:** `src/components/AddExpenseModal.jsx:95-110`
- **Code:**
  ```js
  const handleShareChange = (memberId, value) => {
    setShares((prev) => ({ ...prev, [memberId]: value })); // line 96
    const newShares = { ...shares, [memberId]: value };    // line 97 — STALE
    // ... recalculation uses newShares (lines 98-109)
  };
  ```
- **Problem:** Line 96 uses the functional updater (correct), but line 97 reads `shares` from the closure, which may be stale if `setShares` hasn't been committed yet. The split recalculation on lines 98-109 uses this stale `newShares`, producing **incorrect split amounts** during rapid share changes.
- **Fix:** Use the functional updater form or combine into a single state update:
  ```js
  const handleShareChange = (memberId, value) => {
    setShares((prev) => {
      const newShares = { ...prev, [memberId]: value };
      // recalculate splits from newShares here
      return newShares;
    });
  };
  ```

---

## BUG #6: Duplicate balance calculation logic — inconsistent results

- **Problem:** Balance math is implemented 5 different ways across the codebase:
  1. `src/utils/balances.js` — `calculateBalances()` uses `parseFloat(split.amount) || 0`
  2. `src/utils/debtMinimizer.js` — `summarizeDebts()` uses raw `split.amount` (no parseFloat)
  3. `src/pages/Dashboard.jsx:131-145` — `getNetBalances()` has its own inline logic
  4. `src/pages/GroupDetails.jsx` — `calculateGroupBalances()` is yet another implementation
  5. `src/pages/DebtMinimizerPage.jsx` — inline in `loadGroupData`
- **Impact:** Users may see **different balances** on different pages. For example, `debtMinimizer.js:59` adds raw `split.amount` while `balances.js:18` does `parseFloat(split.amount) || 0`.
- **Fix:** Consolidate all balance calculations into the shared `src/utils/balances.js` utility and use it everywhere.

---

## BUG #7: Message ID collision in AiChat

- **File:** `src/components/AiChat.jsx:176,182`
- **Code:**
  ```js
  id: Date.now(),        // user message
  id: Date.now() + 1,    // AI response
  ```
- **Problem:** If two messages are sent within the same millisecond (or `Date.now() + 1` collides with the next `Date.now()` call), message IDs collide, causing React key warnings and broken rendering.
- **Fix:** Use a counter or `crypto.randomUUID()`:
  ```js
  const [msgId, setMsgId] = useState(0);
  // in handler:
  setMsgId(prev => prev + 1);
  id: msgId
  ```

---

## BUG #8: No cleanup for `setTimeout` in ReceiptScanner

- **File:** `src/components/ReceiptScanner.jsx:53-61,67-76`
- **Code:**
  ```js
  setTimeout(() => { /* sets state */ }, 2000); // line 53
  setTimeout(() => { /* sets state */ }, 1500); // line 67
  ```
- **Problem:** Timeouts are never cleared. If user navigates away during the scanning animation, the callbacks fire on an unmounted component.
- **Fix:** Store timeout IDs in refs and clear them on unmount:
  ```js
  const timeoutRef = useRef(null);
  useEffect(() => () => clearTimeout(timeoutRef.current), []);
  timeoutRef.current = setTimeout(...);
  ```

---

## BUG #9: Memory leak — uncontrolled Firestore requests after unmount

- **File:** `src/pages/Dashboard.jsx:104-117`
- **Code:**
  ```js
  const namePromises = uniqueUids.map(async (uid) => {
    const userSnap = await getDoc(doc(db, "users", uid));
    return { uid, name: userSnap.exists() ? userSnap.data().name : "Unknown" };
  });
  const results = await Promise.all(namePromises);
  setUserNames(namesMap); // may run on unmounted component
  ```
- **Problem:** Multiple `getDoc` requests fire without cleanup. If user navigates away during name-fetching, state updates execute on unmounted component.
- **Fix:** Add a `cancelled` flag like the main `useEffect` already does, or use `AbortController`.
