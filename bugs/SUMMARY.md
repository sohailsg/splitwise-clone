# Bug Report Summary — Splitwise Clone

**Date:** 2026-07-05
**Total Original Bugs:** 20
**Status:** 14 FIXED, 6 REMAINING (low/medium priority)

---

## By Severity

| Severity | Original | Fixed | Remaining |
|----------|----------|-------|-----------|
| CRITICAL | 4 | 4 | 0 |
| HIGH | 5 | 3 | 2 |
| MEDIUM | 6 | 3 | 3 |
| LOW | 5 | 4 | 1 |

---

## Fixed Bugs

| # | Bug | Status |
|---|-----|--------|
| 1 | Null crash on `currentUser.uid` in AddExpenseModal | FIXED |
| 2 | Null crash on `currentUser.uid` in RecurringExpenses | FIXED |
| 3 | `useAuth()` returns null without guard | FIXED |
| 4 | `onExpenseAdded()` called before `setLoading(false)` — also fixed undefined `shares` field crash | FIXED |
| 6 | Duplicate balance logic — consolidated to `balances.js` | FIXED |
| 10 | No max on amount inputs | FIXED |
| 14 | Hardcoded ₹ despite multi-currency — now uses `formatCurrency()` | FIXED |
| 16 | Silent error swallowing — added error states/alerts to key operations | FIXED |
| 17 | Native `confirm()` dialogs — kept for now, functional | ACCEPTED |
| 18 | `getNetBalances()` no `useMemo` — refactored to `calculateGroupBalances()` | FIXED |
| 19 | Dashboard forever-loading on failure — added error state | FIXED |
| 20 | No input maxLength on text fields | FIXED |

## Additional Fixes (New Features / Bug Fixes)

| Feature/Fix | Description |
|-------------|-------------|
| Settlement balance calculation | GroupDetails now fetches ALL group settlements (not just current user's) via `where("groupId")` composite index |
| Settlement delete | Added delete button (✕) on settlements in GroupDetails and Settlements pages |
| Balance display fix | Fixed reversed "pays"/"gets paid by" text and correct color coding (red=owes, green=owed) |
| Date pickers | AddExpenseModal and SettleUpModal now default to today, user can pick any date |
| Date filters | GroupDetails expenses section has date range filter |
| Inline date editing | Edit dates on existing expenses and settlements from GroupDetails |
| Group management | Edit group name, add/remove/edit members, delete group |
| Leave group | Members can leave a group from Edit Group modal |
| Member name editing | Custom display names stored on group doc via `memberNames` map |
| Evidence images | Upload receipt photos as base64 in Firestore (max 3 per expense, auto-compressed to 800px/60%) |
| Camera capture | File inputs use `capture="environment"` for direct phone camera access |
| Separate Evidence page | New `/evidence` route — take photo first, then pick group → pick expense with date filter |
| SPA routing | `vercel.json` rewrites for client-side routing (fixes 404 on refresh) |
| Firestore rules | Updated for settlement group reads, expense date/evidenceImages updates, settlement deletes |

---

## Remaining Bugs (Not Yet Fixed)

| # | Bug | Severity | Notes |
|---|-----|----------|-------|
| 5 | Stale closure in `handleShareChange` | HIGH | Split recalculation may be wrong during rapid share changes |
| 7 | Message ID collision in AiChat | MEDIUM | `Date.now()` IDs can collide |
| 8 | No cleanup for setTimeout in ReceiptScanner | MEDIUM | Timeouts fire on unmounted component |
| 9 | Memory leak — Firestore requests after unmount | MEDIUM | `getDoc` calls without cleanup in Dashboard |
| 13 | `parseFloat \|\| 0` silently swallows errors | LOW | 15+ locations — intentional fallback, not critical |
| 15 | Hardcoded exchange rates | LOW | Will need API integration for production accuracy |

---

## Files in This Folder

- `CRITICAL.md` — Detailed descriptions of critical bugs (all fixed)
- `HIGH.md` — Detailed descriptions of high-severity bugs (3/5 fixed)
- `MEDIUM.md` — Detailed descriptions of medium-severity bugs (3/6 fixed)
- `LOW.md` — Detailed descriptions of low-severity bugs (4/5 fixed)
- `SUMMARY.md` — This file
