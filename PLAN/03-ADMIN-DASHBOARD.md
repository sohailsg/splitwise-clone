# Phase 2: Admin Dashboard (Separate App) ✅ COMPLETE

## Goal
Build a separate admin panel to manage users, view expenses,
review feedback, and configure the app.

## Project Structure
```
splitwise-admin/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── UserDetail.jsx
│   │   ├── Expenses.jsx
│   │   ├── Groups.jsx
│   │   ├── Feedback.jsx
│   │   └── Settings.jsx
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── StatsCard.jsx
│   │   ├── DataTable.jsx
│   │   └── Modal.jsx
│   ├── contexts/
│   │   └── AdminAuthContext.jsx
│   ├── firebase.js
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
└── index.html
```

## Tech Stack
- React 19 + Vite 8 (same as main app)
- Tailwind CSS (same styling)
- Same Firebase project (shared Firestore)
- Deploy to Vercel (separate deployment)

## Pages

### 1. Login Page
- Email/password login
- Check `users/{uid}.role === "admin"` after login
- Reject non-admin users with error
- Redirect to dashboard on success

### 2. Dashboard Overview
Stats to display:
- Total Users (count of `users` collection)
- Total Groups (count of `groups` collection)
- Total Expenses (count of `expenses` collection)
- Total Settlements (count of `settlements` collection)
- Recent Activity (last 10 expenses + settlements)
- Pending Feedback (count where `status === "pending"`)

### 3. Users Page
- Paginated table with search
- Click row → user details (profile, groups, expenses)
- Toggle disable/enable (`disabled: true/false` in Firestore)
- Show user activity counts

### 4. Expenses Page
- Searchable, filterable list
- Filter by group, date range, amount range
- Click row → full expense details
- Delete inappropriate expenses
- Export all as CSV

### 5. Groups Page
- List all groups with member counts
- Click group → members, expenses, balances
- Dissolve abandoned groups

### 6. Feedback Page
- All submissions from users
- Filter by status (Pending / In Progress / Resolved)
- Filter by type (Bug / Suggestion / General)
- Mark as resolved
- Add admin reply

### 7. Settings Page
- Update currency rates
- Display app version
- Toggle maintenance mode
- Create announcements for all users

## Firestore Changes

### New Collection: `feedback`
```javascript
{
  userId: "user-uid",
  userName: "John",
  type: "bug" | "suggestion" | "general",
  message: "Feature request: ...",
  status: "pending" | "in-progress" | "resolved",
  adminReply: "",
  createdAt: timestamp,
  resolvedAt: timestamp
}
```

### New Field: `users/{uid}.role`
```javascript
{
  name: "Admin User",
  email: "admin@example.com",
  role: "admin",
  createdAt: timestamp
}
```

### Updated Firestore Rules
Add to `firestore.rules`:
```javascript
// Feedback collection
match /feedback/{feedbackId} {
  allow read: if isAuthenticated() &&
    (resource.data.userId == getUserId() || isAdmin());
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && isAdmin();
  allow delete: if isAuthenticated() && isAdmin();
}

// Helper function
function isAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
}
```

## Security
- Admin role check on every page load
- Firestore rules enforce admin-only access
- Separate from main app (different URL)
- Non-admin users cannot access admin dashboard

## Deployment
- Deploy to Vercel as separate project
- URL: something like `splitwise-admin.vercel.app`
- Same environment variables as main app
