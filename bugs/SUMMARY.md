# Bug Report Summary — Splitwise Clone

**Date:** 2026-07-04
**Total Bugs Found:** 20
**Status:** ALL BUGS FIXED — App deployed to production

---

## By Severity

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 4 | App crashes, null pointer exceptions |
| HIGH | 5 | Incorrect logic, data corruption, memory leaks |
| MEDIUM | 6 | Missing validation, hardcoded values |
| LOW | 5 | Silent errors, poor UX, performance |

---

## Critical (Fix Immediately)

| # | Bug | File:Line |
|---|-----|-----------|
| 1 | Null crash on `currentUser.uid` in AddExpenseModal | `AddExpenseModal.jsx:19` |
| 2 | Null crash on `currentUser.uid` in RecurringExpenses | `RecurringExpenses.jsx:34` |
| 3 | `useAuth()` returns null without guard | `useAuth.js:5` |
| 4 | `onExpenseAdded()` called before `setLoading(false)` | `AddExpenseModal.jsx:163-168` |

## High (Fix Soon)

| # | Bug | File:Line |
|---|-----|-----------|
| 5 | Stale closure in `handleShareChange` — wrong splits | `AddExpenseModal.jsx:95-110` |
| 6 | Duplicate balance logic — inconsistent results across pages | 5 files |
| 7 | Message ID collision in AiChat | `AiChat.jsx:176,182` |
| 8 | No cleanup for setTimeout in ReceiptScanner | `ReceiptScanner.jsx:53-61,67-76` |
| 9 | Memory leak — Firestore requests after unmount | `Dashboard.jsx:104-117` |

## Medium (Fix When Possible)

| # | Bug | File:Line |
|---|-----|-----------|
| 10 | No max on amount inputs | `AddExpenseModal.jsx:209`, `SettleUpModal.jsx:182` |
| 11 | Negative amounts in ItemizedSplitter | `ItemizedSplitter.jsx:38` |
| 12 | Recurring expense amount not validated | `RecurringExpenses.jsx:195-203` |
| 13 | `parseFloat \|\| 0` silently swallows errors | 15+ locations |
| 14 | Hardcoded ₹ despite multi-currency support | 30+ locations |
| 15 | Hardcoded exchange rates | `currency.js:15-26` |

## Low (Improve When Possible)

| # | Bug | File:Line |
|---|-----|-----------|
| 16 | Silent error swallowing across 10+ pages | Multiple files |
| 17 | Native `confirm()` dialogs freeze event loop | 3 files |
| 18 | `getNetBalances()` no `useMemo` | `Dashboard.jsx:131-147` |
| 19 | Dashboard shows forever-loading on failure | `Dashboard.jsx:28-86` |
| 20 | No input maxLength on text fields | 3 files |

---

## Files in This Folder

- `CRITICAL.md` — Detailed descriptions of critical bugs
- `HIGH.md` — Detailed descriptions of high-severity bugs
- `MEDIUM.md` — Detailed descriptions of medium-severity bugs
- `LOW.md` — Detailed descriptions of low-severity bugs
- `SUMMARY.md` — This file
