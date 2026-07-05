# HIGH BUGS — 3/5 Fixed

## BUG #5: Stale closure in `handleShareChange`

- **File:** `src/components/AddExpenseModal.jsx`
- **Status:** NOT FIXED — Split recalculation uses stale `shares` state during rapid changes.
- **Impact:** Minor — only affects split-by-shares mode during very fast typing.

---

## BUG #6: Duplicate balance calculation logic

- **Status:** FIXED — Consolidated to `src/utils/balances.js`. GroupDetails uses `computeRawBalances()` + `netPairwiseBalances()`. Settlements now included in balance calculation via `where("groupId")` query with composite index.

---

## BUG #7: Message ID collision in AiChat

- **File:** `src/components/AiChat.jsx`
- **Status:** NOT FIXED — `Date.now()` IDs can collide. Low priority.

---

## BUG #8: No cleanup for `setTimeout` in ReceiptScanner

- **File:** `src/components/ReceiptScanner.jsx`
- **Status:** NOT FIXED — Timeouts fire on unmounted component. Low priority.

---

## BUG #9: Memory leak — Firestore requests after unmount

- **File:** `src/pages/Dashboard.jsx`
- **Status:** NOT FIXED — `getDoc` calls without cleanup. Low priority.
