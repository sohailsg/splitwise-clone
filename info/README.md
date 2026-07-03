# Info Folder — Overview

This folder contains comprehensive documentation about the Splitwise Clone application.

---

## Files

| File | Contents |
|------|----------|
| `TECH_STACK.md` | Technologies, frameworks, versions, project structure, dependencies, architecture patterns |
| `ALGORITHMS.md` | Balance calculation, debt minimization, currency conversion, spending aggregation algorithms with complexity analysis |
| `CAPABILITIES.md` | All features, pages, multi-currency support, categories, UI/UX features, security features, data model |
| `APP_FUNCTIONING.md` | How the app works, auth flow, data flow architecture, component hierarchy, Firebase patterns, state management, routing, build/deployment, security model |

---

## Quick Reference

### Tech Stack
- **Frontend:** React 19 + React Router 7 + Tailwind CSS
- **Build:** Vite 8
- **Backend:** Firebase (Auth + Firestore)
- **Language:** JavaScript (JSX)

### Key Algorithms
- **Balance Calculation:** O(E + S + P²) pairwise netting
- **Debt Minimization:** O(N log N) greedy two-pointer — achieves N-1 transactions
- **Currency Conversion:** Pivot through INR with static rates

### Core Features
1. Email/password authentication
2. Friends management
3. Groups with member access control
4. 4 split types (equal, exact, percentage, shares)
5. Multi-currency support (10 currencies)
6. Settlements and payment tracking
7. Recurring expenses
8. Receipt scanning (simulated)
9. Itemized splitting
10. Debt minimization algorithm
11. Spending analytics with charts
12. AI chatbot assistant
13. UPI/Venmo/PayPal payment links

### Data Model
- 5 Firestore collections: `users`, `groups`, `expenses`, `settlements`, `recurringExpenses`
- 1 subcollection: `users/{uid}/friends`
- Security rules enforce group membership and user ownership
