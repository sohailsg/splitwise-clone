# Key File Reference

## Project Root
```
D:\splitwise copy\
├── MEMORY.md                    # Project memory
├── PHASE1-5.md                  # Phase completion status
├── info/                        # Documentation (5 files)
│   ├── README.md
│   ├── TECH_STACK.md
│   ├── CAPABILITIES.md
│   ├── ALGORITHMS.md
│   └── APP_FUNCTIONING.md
├── bugs/                        # Bug reports (5 files)
│   ├── SUMMARY.md
│   ├── CRITICAL.md
│   ├── HIGH.md
│   ├── MEDIUM.md
│   └── LOW.md
└── splitwise-clone/             # Main React app
```

## Main App Structure
```
splitwise-clone/
├── .env                         # Firebase config (REAL KEYS PRESENT)
├── firestore.rules              # Firestore security rules
├── package.json                 # Dependencies
├── vite.config.js               # Vite + Tailwind config
├── index.html                   # Entry HTML
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Router (14 routes)
│   ├── firebase.js              # Firebase init
│   ├── index.css                # Tailwind import
│   ├── contexts/
│   │   ├── AuthContext.js        # Auth context
│   │   └── AuthProvider.jsx      # Auth provider
│   ├── hooks/
│   │   └── useAuth.js            # Custom auth hook
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx         # Main dashboard
│   │   ├── Friends.jsx
│   │   ├── Groups.jsx
│   │   ├── GroupDetails.jsx
│   │   ├── Settlements.jsx
│   │   ├── ExpenseHistory.jsx
│   │   ├── SpendingCharts.jsx
│   │   ├── DebtMinimizerPage.jsx
│   │   ├── ScanReceiptPage.jsx
│   │   └── AiAssistant.jsx
│   ├── components/
│   │   ├── ProtectedRoute.jsx
│   │   ├── Navbar.jsx
│   │   ├── AddFriendModal.jsx
│   │   ├── CreateGroupModal.jsx
│   │   ├── AddExpenseModal.jsx
│   │   ├── SettleUpModal.jsx
│   │   ├── RecurringExpenses.jsx
│   │   ├── ReceiptScanner.jsx
│   │   ├── ItemizedSplitter.jsx
│   │   ├── DebtMinimizer.jsx
│   │   ├── AiChat.jsx
│   │   └── PaymentLinkButton.jsx
│   └── utils/
│       ├── balances.js           # Balance calculation
│       ├── debtMinimizer.js      # Debt optimization
│       ├── currency.js           # Currency conversion
│       └── paymentLinks.js       # UPI/Venmo/PayPal
```

## Firebase Config (from .env)
```
VITE_FIREBASE_API_KEY=AIzaSyBIWyvmnizAgdW_bZum41AVjWakqTNIpzE
VITE_FIREBASE_AUTH_DOMAIN=splitwise-copy-e6567.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=splitwise-copy-e6567
VITE_FIREBASE_STORAGE_BUCKET=splitwise-copy-e6567.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=544080981372
VITE_FIREBASE_APP_ID=1:544080981372:web:360cebe6751d419af848f9
```

## Key Algorithms
- **Balance Calculation:** `src/utils/balances.js` — O(E + S + P²) pairwise netting
- **Debt Minimization:** `src/utils/debtMinimizer.js` — O(N log N) greedy two-pointer
- **Currency Conversion:** `src/utils/currency.js` — Pivot through INR with static rates

## Routes
```
/login, /signup                    (public)
/                                  (Dashboard)
/friends, /groups, /groups/:id     (management)
/settlements, /history             (tracking)
/charts, /minimizer, /scan         (tools)
/ai                                (assistant)
```
