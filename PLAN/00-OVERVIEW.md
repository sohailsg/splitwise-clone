# Splitwise Clone — Development Plan

## Project Summary
A bill-splitting web app (React PWA) for 14 people. Users can create groups,
add expenses, track who owes whom, and settle up.

## Current State
- **Complete React PWA** with 50+ source files, 12 pages, Firebase backend
- **Admin Dashboard** separate React app with 7 pages
- **Firebase project:** splitwise-copy-e6567
- **Tech stack:** React 19 + Vite 8 + Tailwind CSS + Firebase
- **Status:** DEPLOYED AND LIVE

## Live URLs
| App | URL |
|-----|-----|
| Main App | https://splitwise-clone-gold.vercel.app |
| Admin Dashboard | https://splitwise-admin.vercel.app |

## Decisions Made
1. **App type:** Native-feel app for 14 people (no app store, no Play Store)
2. **No Mac available:** iOS native builds not feasible
3. **Platform:** Both Android + iOS via PWA (works on both)
4. **Admin dashboard:** Separate React app
5. **Distribution:** Direct link sharing, not app stores

## Architecture Decision: PWA (Not Capacitor/React Native)
- PWA works on both platforms instantly
- Zero build/deploy complexity
- Users install from browser ("Add to Home Screen")
- For 14 people, this is the optimal approach
- Capacitor/React Native would be overkill

## Execution Phases
| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | PWA Deployment | 30 min | DONE |
| 2 | Admin Dashboard | 3-5 days | DONE |
| 3 | Feedback System | 1 day | DONE |
| 4 | Iteration | Ongoing | DONE |

## Key Files
- Main app: `D:\splitwise copy\splitwise-clone\`
- Admin dashboard: `D:\splitwise copy\splitwise-admin\`
- Documentation: `D:\splitwise copy\info\`
- Bug reports: `D:\splitwise copy\bugs\`
- This plan: `D:\splitwise copy\PLAN\`
