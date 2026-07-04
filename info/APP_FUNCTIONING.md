# App Functioning & Architecture

## How the App Works

### User Flow

```
1. User visits app → Redirected to /login (if not authenticated)
2. User signs up or logs in → Firebase Auth creates session
3. Dashboard loads → Fetches user's friends, groups, expenses, settlements
4. User can:
   a. Add friends → Search by email → Friend stored in Firestore
   b. Create groups → Select friends → Group created with memberUids
   c. Add expenses → Select group, amount, split type → Expense saved
   d. Settle up → Record a payment → Settlement saved
   e. View history → Search/filter/sort expenses
   f. View charts → See spending analytics
   g. Minimize debts → See optimized payment plan
   h. Scan receipt → Assign items to members → Save as expense
```

---

## Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Login Page  │────▶│ Firebase Auth │────▶│  AuthProvider    │
│  (email/pw)  │     │ signInWith   │     │  onAuthStateChanged│
└─────────────┘     │ EmailAndPw   │     │  sets currentUser │
                    └──────────────┘     └────────┬────────┘
                                                  │
                    ┌──────────────┐              │
                    │ ProtectedRoute│◀─────────────┘
                    │ if currentUser│
                    │   render child│
                    │ else redirect │
                    │   to /login   │
                    └──────────────┘
```

### Auth State Management

1. `AuthProvider` wraps the entire app
2. Listens to `onAuthStateChanged` from Firebase
3. Sets `currentUser` in React Context
4. `useAuth()` hook provides `{ currentUser }` to any component
5. `ProtectedRoute` checks `currentUser` — redirects if null

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React App                         │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Pages    │  │Components│  │  Context/Hooks    │  │
│  │          │  │          │  │                   │  │
│  │ Dashboard│──│ Navbar   │  │ AuthProvider      │  │
│  │ Friends  │──│ Modals   │  │ useAuth()         │  │
│  │ Groups   │──│ Forms    │  │                   │  │
│  │ ...      │  │ Charts   │  │                   │  │
│  └────┬─────┘  └────┬─────┘  └──────────────────┘  │
│       │              │                               │
│  ┌────▼──────────────▼────────────────────────────┐  │
│  │              Utility Functions                  │  │
│  │  balances.js | debtMinimizer.js | currency.js  │  │
│  │  paymentLinks.js                               │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
└───────────────────────┼──────────────────────────────┘
                        │
                ┌───────▼───────┐
                │    Firebase    │
                │               │
                │  Firestore    │
                │  (database)   │
                │               │
                │  Auth         │
                │  (login/reg)  │
                └───────────────┘
```

---

## Component Hierarchy

```
main.jsx
  └── App.jsx (BrowserRouter)
        └── AuthProvider (Context)
              ├── /login → Login
              ├── /signup → Signup
              ├── /* (ProtectedRoute)
              │     ├── Navbar
              │     ├── Dashboard
              │     │     └── SettleUpModal
              │     ├── Friends
              │     │     └── AddFriendModal
              │     ├── Groups
              │     │     └── CreateGroupModal
              │     ├── GroupDetails
              │     │     ├── AddExpenseModal
              │     │     └── RecurringExpenses
              │     ├── Settlements
              │     │     └── SettleUpModal
              │     ├── ExpenseHistory
              │     ├── SpendingCharts
              │     ├── DebtMinimizerPage
              │     │     └── DebtMinimizer
              │     ├── ScanReceiptPage
              │     │     ├── ReceiptScanner
              │     │     └── ItemizedSplitter
              │     ├── AiAssistant
              │     │     └── AiChat
              │     └── FeedbackPage
              │           └── FeedbackModal
              └── * (404 page)

Admin Dashboard (separate app):
splitwise-admin/
  └── App.jsx (BrowserRouter)
        └── AdminAuthProvider (Context)
              ├── /login → Login
              ├── /* (ProtectedRoute + Sidebar)
              │     ├── / → Dashboard (stats overview)
              │     ├── /users → Users (manage users)
              │     ├── /expenses → Expenses (view/delete)
              │     ├── /groups → Groups (list/dissolve)
              │     ├── /feedback → Feedback (filter/resolve/reply)
              │     └── /settings → Settings (info/announcements)
              └── * → redirect to /
```

---

## Firebase Interaction Patterns

### Read Pattern (Fetching Data)

```javascript
// 1. Build query
const q = query(
  collection(db, "expenses"),
  where("groupId", "==", groupId)
);

// 2. Execute query
const snap = await getDocs(q);

// 3. Map documents to objects
const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

// 4. Update state
setExpenses(data);
```

### Write Pattern (Creating Data)

```javascript
// 1. Build document object
const doc = {
  groupId,
  payerId,
  amount,
  splits: splitsArray,
  date: new Date().toISOString(),
  createdBy: currentUser.uid,
};

// 2. Write to Firestore
await addDoc(collection(db, "expenses"), doc);

// 3. Trigger refresh
onExpenseAdded();
```

### Real-time Pattern (Not Currently Used)
The app uses one-time reads (`getDocs`, `getDoc`) rather than real-time listeners (`onSnapshot`). This means:
- Data is fetched once on page load
- Changes require manual refresh
- No real-time collaboration between users

---

## State Management

### Global State
- **Auth State:** `AuthProvider` → `currentUser` via Context
- **No Redux/Zustand:** All other state is local to components

### Local State Patterns

| Pattern | Example |
|---------|---------|
| **useState** | `const [loading, setLoading] = useState(true)` |
| **useEffect** | Data fetching on mount or dependency change |
| **useMemo** | Expensive calculations (balances, charts) |
| **useRef** | DOM refs (file input), timeout IDs |
| **Custom hooks** | `useAuth()` for auth context |

### Common State Variables

| Variable | Purpose | Found In |
|----------|---------|----------|
| `loading` | Show spinner while fetching | Most pages |
| `error` | Show error message | Forms, some pages |
| `showModal` / `showForm` | Toggle modal/form visibility | Pages with modals |
| `data` (array) | Fetched list data | All list pages |

---

## Routing Architecture

### Route Definitions

```javascript
// Public routes
/login    → Login
/signup   → Signup

// Protected routes (require auth)
/                   → Dashboard
/friends            → Friends
/groups             → Groups
/groups/:groupId    → GroupDetails
/settlements        → Settlements
/history            → ExpenseHistory
/charts             → SpendingCharts
/minimizer          → DebtMinimizerPage
/scan               → ScanReceiptPage
/scan/:groupId      → ScanReceiptPage (scoped to group)
/ai                 → AiAssistant

// Catch-all
*                   → 404 Not Found
```

### Navigation

- **Client-side routing** via React Router
- **No page reloads** — React re-renders on route change
- **History API** — browser back/forward works
- **Link component** — `<Link to="/friends">` for navigation

---

## Build & Deployment

### Development

```bash
npm run dev        # Start Vite dev server (port 5173)
```

### Production Build

```bash
npm run build      # Outputs to dist/
npm run preview    # Preview production build locally
```

### Build Output

```
dist/
├── index.html
├── manifest.json   # PWA manifest
├── sw.js           # Service worker
└── assets/
    ├── index-{hash}.js    # Bundled JavaScript
    └── index-{hash}.css   # Bundled CSS
```

### Deployment — Vercel (Production)

Both apps are deployed on Vercel with automatic deploys from GitHub.

| App | Vercel Project | Root Directory | URL |
|-----|---------------|----------------|-----|
| Main App | splitwise-clone | `splitwise-clone` | https://splitwise-clone-gold.vercel.app |
| Admin Dashboard | splitwise-admin | `splitwise-admin` | https://splitwise-admin.vercel.app |

### Deployment Steps

1. Push code to GitHub repository (`sohails/splitwise-clone`)
2. Vercel auto-deploys on every push
3. Environment variables set in Vercel dashboard (Firebase config)
4. Root directory set to respective app folder

### PWA Installation (For Users)

- **Android:** Open URL → tap "Add to Home Screen"
- **iOS:** Open URL → tap Share → "Add to Home Screen"
- App icon appears on home screen, works offline via service worker

---

## Performance Characteristics

| Aspect | Current State |
|--------|--------------|
| **Bundle Size** | No code splitting — all pages eagerly imported |
| **Initial Load** | Fetches all routes at once |
| **Data Fetching** | One-time reads, no real-time listeners |
| **Caching** | Firebase SDK handles caching internally |
| **Image Optimization** | No images (except SVG icons) |
| **Lazy Loading** | Not implemented |
| **Code Splitting** | Not implemented |
| **Error Boundaries** | Not implemented |

---

## Security Model

### Client-Side
- `ProtectedRoute` redirects unauthenticated users
- Firebase Auth manages sessions
- User ID stored in context for API calls

### Server-Side (Firestore Rules)
- **Authentication check** on all operations
- **Group membership** enforced for group data
- **User ownership** enforced for profiles and friends
- **Creator-only** delete for expenses and groups
- **Amount validation** (> 0) on expense and settlement creation
- **Immutability** on expenses and settlements (no update rules)

### Data Access Matrix

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `users/{uid}` | Any auth user | Self only | Self only + Admin | Not allowed |
| `users/{uid}/friends/*` | Self only | Self only | Not allowed | Self only |
| `groups/*` | Members + Admin | Auth + in memberUids | Members + Admin | Creator + Admin |
| `expenses/*` | Group members + Admin | Group members | Not allowed | Creator + Admin |
| `settlements/*` | Participants + Admin | Participants | Not allowed | Not allowed |
| `recurringExpenses/*` | Group members + Admin | Group members | Group members + Admin | Group members + Admin |
| `feedback/*` | Self + Admin | Self (own userId) | Admin only | Admin only |
