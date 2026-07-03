# Phase 4: Balances & Settlements

## Status: COMPLETE ✓

## Files Created
1. `src/utils/balances.js` - Balance calculation utilities
2. `src/components/SettleUpModal.jsx` - Record payments
3. `src/pages/Settlements.jsx` - Payment history page

## Files Modified
1. `src/App.jsx` - Added settlements route
2. `src/components/Navbar.jsx` - Added settlements link
3. `src/pages/Dashboard.jsx` - Added balance summary, settle button

## Features Implemented
### Balance System
- Calculate who owes whom across all groups
- Show total balance (net of what you owe and what's owed to you)
- Display "You Owe" and "You're Owed" lists with names and amounts

### Settlements
- Record payments between users
- Select group and person to pay
- View payment history
- Track who paid whom and when

## Firestore Collections Added
```
settlements/{id}:
  - fromUserId: string (who paid)
  - toUserId: string (who received)
  - groupId: string
  - amount: number
  - date: timestamp
```

## Next Phase
Phase 5: Notifications + Polish
