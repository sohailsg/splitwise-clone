# Phase 3: Feedback System ✅ COMPLETE — DEPLOYED

## Goal
Allow users to submit feedback from the main app,
viewable in the admin dashboard.

## In-App Feedback (Main App)

### New Component: FeedbackModal.jsx
File: `splitwise-clone/src/components/FeedbackModal.jsx` (NEW)

Features:
- Type selector (Bug / Suggestion / General)
- Message textarea (max 1000 chars)
- Submit button
- Success confirmation

### Add to Navbar
File: `splitwise-clone/src/components/Navbar.jsx`

Add feedback icon/link to navbar (in tool items section):
```javascript
{ to: "/feedback", label: "Feedback", icon: "💬" }
```

Or add a floating feedback button in the corner.

### Firestore Write
```javascript
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

await addDoc(collection(db, "feedback"), {
  userId: currentUser.uid,
  userName: currentUser.displayName || currentUser.email,
  type: selectedType,
  message: feedbackText,
  status: "pending",
  createdAt: new Date().toISOString()
});
```

### New Route in App.jsx
```javascript
<Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
```

## Admin View (Admin Dashboard)
- Feedback page shows all submissions
- Filter by status, type, user
- Mark as resolved
- Add admin reply (stored in `adminReply` field)
- Notify user of reply (future enhancement)

## Files Modified (Main App)
| File | Change |
|------|--------|
| `src/components/FeedbackModal.jsx` | NEW |
| `src/components/Navbar.jsx` | Add feedback button |
| `src/pages/FeedbackPage.jsx` | NEW |
| `src/App.jsx` | Add feedback route |
| `firestore.rules` | Add feedback collection rules |
