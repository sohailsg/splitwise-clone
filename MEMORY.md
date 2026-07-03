# Splitwise Clone - Project Memory

## Overview
A bill-splitting web app (React PWA) for 14 people. Users can create groups,
add expenses, track who owes whom, and settle up.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS
- Backend/DB: Firebase (Firestore + Auth + FCM)
- Hosting: Free tier (Vercel/Render)
- Type: PWA (installable on phone home screen)

## Core Features
1. User signup/login (email + password via Firebase Auth)
2. Add/search friends
3. Create groups and manage members
4. Add expenses (equal, exact, or percentage splits)
5. Dashboard showing all balances
6. Settle up (record payments)
7. Push notifications (FCM)

## Database (Firestore Collections)
- users/{uid}: name, email, avatar, currency, createdAt
- groups/{groupId}: name, members[], createdBy, createdAt
- expenses/{expenseId}: groupId, payerId, amount, description, splitType, splits[], date
- settlements/{id}: fromUserId, toUserId, amount, date, groupId

## Users
- 14 people total
- All must create accounts

## Build Phases
1. Project setup + Authentication
2. Groups + Friends system
3. Expenses (create/edit/delete)
4. Dashboard + Balances + Settlements
5. Notifications + Polish

## Current Phase
Phase 1: COMPLETE
Phase 2: COMPLETE
Phase 3: COMPLETE
Phase 4: COMPLETE
Phase 5: COMPLETE - Enhanced UI with Splitwise-like features

## Project Structure
D:\splitwise copy\splitwise-clone\
├── src/
│   ├── firebase.js (Firebase config - NEEDS REAL KEYS)
│   ├── contexts/AuthContext.jsx
│   ├── utils/balances.js
│   ├── components/
│   │   ├── ProtectedRoute.jsx
│   │   ├── Navbar.jsx
│   │   ├── AddFriendModal.jsx
│   │   ├── CreateGroupModal.jsx
│   │   ├── AddExpenseModal.jsx
│   │   └── SettleUpModal.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Friends.jsx
│   │   ├── Groups.jsx
│   │   ├── GroupDetails.jsx
│   │   └── Settlements.jsx
│   ├── App.jsx (Router)
│   └── index.css (Tailwind)
├── vite.config.js
└── package.json

## Before Running
1. Create Firebase project at console.firebase.google.com
2. Enable Authentication > Email/Password
3. Create Firestore Database (test mode)
4. Replace placeholder values in src/firebase.js with your config
