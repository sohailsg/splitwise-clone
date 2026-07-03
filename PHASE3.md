# Phase 3: Expenses System

## Status: COMPLETE ✓

## Files Created
1. `src/components/AddExpenseModal.jsx` - Add expense with split options

## Files Modified
1. `src/pages/GroupDetails.jsx` - Added expense list, stats, and delete functionality

## Features Implemented
### Expense System
- Add expenses to groups with description and amount
- Three split types:
  - **Equal**: Automatically divides evenly among all members
  - **Exact**: Set specific dollar amounts for each member
  - **Percentage**: Split by percentage (must total 100%)
- Select who paid for the expense
- View all expenses in a group sorted by date
- Delete expenses (only by creator)
- Stats cards: Total expenses, Your expenses, Expense count

## Firestore Collections Added
```
expenses/{expenseId}:
  - groupId: string
  - payerId: string (uid of who paid)
  - amount: number
  - description: string
  - splitType: "equal" | "exact" | "percentage"
  - splits: [{uid: string, amount: number}]
  - date: timestamp
  - createdBy: string (uid of who created)
```

## Next Phase
Phase 4: Dashboard + Balances + Settlements
