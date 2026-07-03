# Capabilities & Features

## Core Features

### 1. Authentication
- **Email/password sign-up and login** via Firebase Authentication
- User profile creation with name and email stored in Firestore
- Persistent sessions (Firebase handles token refresh)
- Automatic redirect to login for unauthenticated users
- Logout from any page via navbar

### 2. Friends Management
- Add friends by searching their registered email address
- View friend list with name and email
- Remove friends from list
- Friends are stored per-user (not bidirectional)

### 3. Groups
- Create groups with selected friends as members
- View all groups you belong to
- Group details page showing members, balances, and expenses
- Only group members can see group data (enforced by Firestore rules)

### 4. Expense Tracking
- **4 split types supported:**
  - **Equal** — amount divided equally among all members
  - **Exact amounts** — manually enter each person's share
  - **Percentage** — split by percentages (must total 100%)
  - **Shares** — ratio-based splitting (e.g., 2:1:1)
- Multi-currency support (10 currencies with conversion)
- Payer selection (any group member can be marked as payer)
- Expense description and date tracking
- Expense history with search, filter, and sort

### 5. Settlements (Settle Up)
- Record payments between users
- Settlement history showing all past payments
- Settlements reduce outstanding debts automatically

### 6. Recurring Expenses
- Create recurring expenses (weekly, biweekly, monthly, quarterly, yearly)
- Track subscriptions, rent, utilities, and regular bills
- "Log Now" to immediately create an expense from a recurring template
- Pause/resume recurring expenses
- Delete recurring expenses

### 7. Receipt Scanning (Simulated)
- Camera/upload interface for receipt images
- Simulated OCR scanning (demo data)
- Review and edit scanned items
- Assign items to specific group members for itemized splitting

### 8. Itemized Splitting
- Assign individual receipt items to specific people
- "Split all" button to equally split an item among everyone
- Add custom items not captured by scanner
- Per-person running total
- Assignment progress tracking

### 9. Debt Minimization
- Greedy algorithm to minimize number of transactions
- Shows original vs optimized transaction count
- Manual debt entry mode for testing
- Group data mode using real Firebase data
- Visual comparison of debt volume

### 10. Spending Analytics
- **Monthly trend chart** — bar chart of last 6 months
- **Category breakdown** — horizontal bars with icons
- **Per-person spending** — who spends the most
- **Donut chart** — SVG-based category visualization
- Filter by group and time range (week/month/3 months/year)

### 11. AI Assistant
- Client-side chatbot with hardcoded knowledge base
- 14 topic categories covering app features
- Quick question suggestions
- Markdown-like formatting (bold, bullet points)
- No external API required

### 12. Payment Integration
- **UPI deep links** (Google Pay, PhonePe, Paytm, etc.)
- **Venmo** deep links
- **PayPal** deep links
- Opens payment apps directly from the app

---

## Navigation & Pages

| Page | URL | Purpose |
|------|-----|---------|
| Login | `/login` | Email/password authentication |
| Signup | `/signup` | New user registration |
| Dashboard | `/` | Overall balance overview, you owe/owed summary |
| Friends | `/friends` | Friend list management |
| Groups | `/groups` | Group list and creation |
| Group Details | `/groups/:groupId` | Single group view with expenses and balances |
| Settlements | `/settlements` | Payment history and settle up |
| Expense History | `/history` | Searchable/filterable expense timeline |
| Spending Charts | `/charts` | Visual spending analytics |
| Debt Minimizer | `/minimizer` | Debt optimization tool |
| Receipt Scanner | `/scan` | Scan and split receipts |
| AI Assistant | `/ai` | Chatbot help assistant |

---

## Multi-Currency Support

| Currency | Code | Symbol |
|----------|------|--------|
| Indian Rupee | INR | ₹ |
| US Dollar | USD | $ |
| Euro | EUR | € |
| British Pound | GBP | £ |
| Japanese Yen | JPY | ¥ |
| Australian Dollar | AUD | A$ |
| Canadian Dollar | CAD | C$ |
| Singapore Dollar | SGD | S$ |
| UAE Dirham | AED | د.إ |
| Thai Baht | THB | ฿ |

- Foreign currencies auto-convert to base currency (default INR)
- Original amount preserved for audit trail
- Conversion notice shown in UI

---

## Expense Categories

| Category | Icon |
|----------|------|
| Food & Dining | 🍽️ |
| Transportation | 🚗 |
| Utilities | 💡 |
| Entertainment | 🎬 |
| Groceries | 🛒 |
| Rent | 🏠 |
| Health | ❤️ |
| Travel | ✈️ |
| Shopping | 🛍️ |
| Education | 📚 |
| Other | 📦 |

---

## UI/UX Features

| Feature | Implementation |
|---------|---------------|
| **Responsive Design** | Tailwind CSS — works on mobile and desktop |
| **Sticky Navigation** | Navbar fixed at top with z-index |
| **Hamburger Menu** | Mobile navigation with toggle |
| **Loading States** | Spinner animations during data fetch |
| **Empty States** | Helpful prompts when lists are empty |
| **Form Validation** | Required fields, numeric validation |
| **Error Messages** | Inline error display on forms |
| **Expandable Cards** | Click to reveal split details |
| **Active Route Highlight** | Current page highlighted in nav |
| **Scrollable Lists** | Max-height with overflow scroll |

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| **Authentication Guard** | `ProtectedRoute` redirects to login |
| **Firestore Rules** | Server-side access control per collection |
| **Group Membership Check** | `isInGroup()` helper in rules |
| **Expense Immutability** | No update rule on expenses (delete + recreate) |
| **Settlement Immutability** | No update/delete rules on settlements |
| **Self-Registration** | Users can only create their own profile |
| **Creator-Only Delete** | Only expense/group creator can delete |
| **Amount Validation** | Rules enforce `amount > 0` on creation |

---

## Data Model

### Firestore Collections

| Collection | Key Fields | Relationships |
|------------|-----------|---------------|
| `users/{uid}` | name, email, createdAt | Has subcollection `friends/` |
| `users/{uid}/friends/{friendUid}` | friendName, friendEmail | Belongs to user |
| `groups/{groupId}` | name, memberUids[], createdBy, createdAt | References user UIDs |
| `expenses/{expenseId}` | groupId, payerId, amount, splits[], splitType, date, createdBy | References group and users |
| `settlements/{id}` | fromUserId, toUserId, groupId, amount, date | References users and group |
| `recurringExpenses/{id}` | groupId, description, amount, frequency, nextDue, active, createdBy | References group |

### Document Relationships

```
users/{uid}
  └── friends/{friendUid}

groups/{groupId}
  ├── memberUids[] → references users
  └── createdBy → references user

expenses/{expenseId}
  ├── groupId → references group
  ├── payerId → references user
  └── splits[].uid → references users

settlements/{id}
  ├── fromUserId → references user
  ├── toUserId → references user
  └── groupId → references group

recurringExpenses/{id}
  ├── groupId → references group
  └── payerId → references user
```
