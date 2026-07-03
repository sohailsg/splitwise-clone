import { useState, useRef, useEffect } from "react";

const SPLITWISE_KB = {
  greetings: [
    "Hey! I'm your Splitwise AI assistant. Ask me anything about how Splitwise works, its features, or why people love using it!",
    "Hi there! I can explain Splitwise features, how bill splitting works, or help you understand the app. What would you like to know?",
    "Welcome! I'm here to help you understand Splitwise. Ask me about features, splitting methods, debt simplification, or anything else!",
  ],

  topics: {
    features: {
      keywords: ["feature", "features", "what can", "what does", "capabilities", "functions"],
      responses: [
        `**Splitwise Core Features:**\n\n1. **Group Creation** - Create digital rooms for roommates, travel trips, couples, or any shared expense scenario.\n\n2. **Expense Logger** - Enter bill amounts, select who paid, add descriptions, and attach receipts.\n\n3. **Flexible Splitting** - Divide expenses equally, by exact amounts, percentages, or custom shares.\n\n4. **Live Balance Sheet** - Real-time dashboard showing who owes (red) and who is owed (green).\n\n5. **Debt Simplification** - Algorithm minimizes the total number of transactions needed to settle up.\n\n6. **Settlement Tracking** - Record when payments are made to reset balances to zero.\n\n7. **Multi-Currency Support** - Handle expenses in different currencies with real-time conversion.\n\n8. **Receipt Scanning** - Premium feature to photograph receipts for automatic itemized splitting.`,
        `Here are the key features that make Splitwise popular:\n\n• **Expense Tracking** - Log any shared expense with description, amount, and split method\n• **Multiple Split Types** - Equal, exact amounts, percentages, or custom shares\n• **Balance Dashboard** - See at a glance who owes whom and how much\n• **Group Management** - Organize expenses by trips, households, or events\n• **Settlement History** - Track all payments made between members\n• **Debt Optimization** - Automatically suggests the simplest way to settle all debts\n• **Friend System** - Add friends to quickly include them in groups`,
      ],
    },

    howItWorks: {
      keywords: ["how", "work", "works", "process", "operate", "function", "use", "using", "step"],
      responses: [
        `**How Splitwise Works:**\n\n**Step 1: Create a Group**\nSet up a digital room for your specific situation - roommates, a trip, dinner club, etc.\n\n**Step 2: Add Members**\nInvite friends by email or username to join your group.\n\n**Step 3: Log Expenses**\nWhen someone pays for a shared cost, enter it:\n• Amount paid\n• Who paid\n• How to split (equally, exact, percentage)\n• Description of the expense\n\n**Step 4: Automatic Balances**\nSplitwise instantly calculates net balances:\n• Green = You're owed money\n• Red = You owe money\n\n**Step 5: Simplify Debts**\nThe algorithm restructures group debts to minimize transactions. Instead of everyone paying everyone, it finds the most efficient settlement path.\n\n**Step 6: Settle Up**\nWhen someone pays (via cash, Venmo, PayPal, etc.), record the payment and balances reset.`,
        `Here's the typical Splitwise workflow:\n\n1. **Start a group** for your shared expenses\n2. **Add friends** who are part of the bill\n3. **Log expenses** as they happen - who paid and how to split\n4. **View balances** on the dashboard in real-time\n5. **Settle up** when convenient by recording payments\n\nThe magic happens automatically - Splitwise calculates who owes whom and suggests the simplest way to pay everyone back.`,
      ],
    },

    splitting: {
      keywords: ["split", "splitting", "divide", "divide", "method", "equal", "exact", "percent", "percentage"],
      responses: [
        `**Splitting Methods Explained:**\n\n**Equal Split** 💰\nThe simplest method. Total bill divided equally among all participants.\n• Example: ₹1500 dinner for 3 people = ₹500 each\n\n**Exact Amounts** 💵\nAssign specific dollar amounts to each person.\n• Example: ₹1000 dinner: You ate ₹600 worth, friend ate ₹400\n\n**Percentages** 📊\nSplit by percentage of the total bill.\n• Example: ₹1000 bill: 60% you (₹600), 40% friend (₹400)\n\n**Custom Shares** 📝\nAssign ratio-based shares (useful for couples or unequal groups).\n• Example: 2 shares for a couple, 1 share for single person\n\n**When to use which?**\n• **Equal**: Most common, fairest for similar consumption\n• **Exact**: When portions are clearly different\n• **Percentage**: When you want proportional splits\n• **Shares**: For ongoing household expenses with mixed group sizes`,
        `Splitwise offers 4 main ways to split expenses:\n\n1. **Equal Split** - Divide the total evenly. Best for meals where everyone gets similar portions.\n\n2. **Exact Amounts** - Assign specific amounts to each person. Use when portions vary significantly.\n\n3. **Percentages** - Split by percentage. Great for proportional splits (e.g., 70/30 for different room sizes).\n\n4. **Custom Shares** - Use ratios. Perfect for couples sharing one "unit" vs individuals.\n\n**Pro tip:** Most groups use "Equal" for 80% of expenses. It's simpler and keeps the peace!`,
      ],
    },

    debtSimplification: {
      keywords: ["debt", "simplify", "simplification", "algorithm", "optimize", "minimize", "transaction"],
      responses: [
        `**Debt Simplification Algorithm:**\n\nThis is Splitwise's killer feature! Here's how it works:\n\n**The Problem:**\nIn a group of 4 friends, after a trip, you might have:\n• A owes B ₹500\n• B owes C ₹300\n• C owes A ₹200\n• A owes D ₹100\n\nThat's 4 separate transactions!\n\n**The Solution:**\nSplitwise uses a **Directed Graph Optimization** algorithm:\n\n1. Calculate **net balance** for each person (total owed minus total owes)\n2. Use a **Greedy Algorithm** to match the biggest debtor with the biggest creditor\n3. Resolve balances with the **fewest possible transactions**\n\n**Result:**\nInstead of 4 payments, maybe only 2 payments are needed:\n• A pays C ₹300 (net)\n• B pays D ₹100 (net)\n\n**The Math:**\nFor N people, worst case is N-1 transactions. Splitwise aims for the minimum necessary to get everyone to zero.`,
        `The debt simplification feature is pure math magic! 🧮\n\n**How it works:**\n\n1. **Calculate Net Balances** - For each person, compute: What they're owed - What they owe\n\n2. **Model as Graph** - People are nodes, debts are directed edges\n\n3. **Apply Greedy Algorithm** - Match largest debtor with largest creditor\n\n4. **Resolve and Repeat** - Continue until all balances are zero\n\n**Example:**\n• Original: A→B ₹500, B→C ₹300, C→A ₹200\n• Net: A owes ₹300, B owed ₹200, C owed ₹100\n• Simplified: A pays C ₹300\n\n**Result:** 3 transactions → 1 transaction!`,
      ],
    },

    whyUse: {
      keywords: ["why", "benefit", "advantage", "reason", "popular", "good", "better", "problem", "solve"],
      responses: [
        `**Why People Use Splitwise:**\n\n**1. Eliminates Math** 🧮\nNo more mental calculations, spreadsheets, or IOU slips after group outings.\n\n**2. Reduces Friction** 🤝\nPrevents awkward money conversations between friends, couples, and roommates. The app becomes the "bad guy" tracking who owes what.\n\n**3. Fair Transparency** 👁️\nClear, permanent history of every transaction. Everyone can see exactly where money went.\n\n**4. Tracks Over Time** 📅\nKeeps records of recurring bills (rent, utilities) and multi-day events (vacations, trips).\n\n**5. Settlement Flexibility** 💳\nPay via cash, Venmo, PayPal, UPI - then just record it in the app.\n\n**6. Group Management** 👥\nOrganize expenses by context - separate bills for roommates vs. vacation friends.\n\n**7. Peace of Mind** 😌\nNo more "Did you pay me back for that dinner?" conversations.\n\n**Real-world examples:**\n• Roommates splitting rent and utilities\n• Friends on vacation sharing hotel, food, transport\n• Couples tracking shared expenses\n• Coworkers splitting lunch orders`,
        `Splitwise solves real financial friction. Here's why millions love it:\n\n**The Problem It Solves:**\n• Mental math after every group expense\n• Awkward "you owe me" conversations\n• Forgotten debts and IOUs\n• Complex multi-person settlements\n\n**The Benefits:**\n• **Saves time** - No more calculating splits manually\n• **Preserves friendships** - Money stays out of relationships\n• **Transparent** - Everyone sees the same balances\n• **Permanent record** - No more "did I pay you for that?"\n• **Flexible settlement** - Pay however you want, just log it\n\n**Who uses it?**\n• Roommates (rent, groceries, utilities)\n• Travel groups (hotels, food, activities)\n• Friends (dinners, events, shared purchases)\n• Couples (shared living costs)\n• Coworkers (lunch orders, office supplies)`,
      ],
    },

    settleUp: {
      keywords: ["settle", "settlement", "pay", "payment", "cash", "venmo", "paypal", "upi"],
      responses: [
        `**Settlement Options:**\n\n**How to Settle Up:**\n1. Open the app and go to your group or dashboard\n2. Tap "Settle Up" button\n3. Select who you're paying\n4. Enter the amount\n5. Record the payment\n\n**Payment Methods:**\n• **Cash** - Pay in person, record it in the app\n• **Venmo** - Popular in US, integrates with Splitwise\n• **PayPal** - International option\n• **UPI** - For Indian users (Google Pay, PhonePe, etc.)\n• **Bank Transfer** - Direct deposit\n• **Any method** - Pay however you want, just log it!\n\n**Important:**\n• Settlements are **manual records** - Splitwise doesn't transfer money\n• You can settle up **anytime** - doesn't have to be when all expenses are logged\n• Settlements **reduce balances** proportionally across all shared groups\n\n**Pro tip:** Settle up periodically (weekly/monthly) to keep balances manageable!`,
        `Settlements in Splitwise are simple:\n\n**Process:**\n1. Tap "Settle Up" on dashboard or group page\n2. Choose the person you're paying\n3. Enter the amount\n4. Save\n\n**What happens:**\n• The payment is recorded\n• Your balance with that person decreases\n• Works across all shared groups (if you're in multiple groups together)\n\n**Payment methods:**\nSplitwise doesn't handle money directly. You can pay via:\n• Cash in hand\n• UPI apps (Google Pay, PhonePe, Paytm)\n• Venmo / PayPal\n• Bank transfer\n• Any method you prefer!\n\n**Then just log it in the app.**`,
      ],
    },

    groups: {
      keywords: ["group", "groups", "create", "room", "roommate", "trip", "travel"],
      responses: [
        `**Group Management:**\n\n**Creating a Group:**\n1. Tap "Create Group" or "+ New Group"\n2. Give it a name (e.g., "Summer Trip 2026", "Apartment 4B")\n3. Add members from your friends list\n4. Start logging expenses!\n\n**Group Types:**\n• 🏠 **Roommates** - Rent, utilities, groceries\n• ✈️ **Travel** - Hotels, flights, activities\n• 🍕 **Dinner Club** - Regular meals out\n• 💑 **Couples** - Shared living expenses\n• 🏢 **Office** - Lunch orders, shared supplies\n• 🎉 **Events** - Parties, weddings, celebrations\n\n**Group Features:**\n• View all expenses for that group\n• See group-specific balances\n• Add/remove members\n• Track who paid for what\n• Settlement history within the group\n\n**Pro tip:** Create separate groups for different contexts. Keeps things organized!`,
        `Groups are how Splitwise organizes shared expenses:\n\n**Benefits:**\n• Separate context (roommates vs. vacation friends)\n• Clean balance tracking per situation\n• Easy to see who's involved in what\n\n**How to use:**\n1. Create a group with a descriptive name\n2. Add the people who share expenses\n3. Log expenses with the "Add Expense" button\n4. View group-specific balances and history\n\n**Examples:**\n• "Beach House July 2026" - Track all trip expenses\n• "Apartment 4B" - Monthly rent and utilities\n• "Lunch Club" - Weekly work lunches\n\nEach group maintains its own balance sheet, so your roommate expenses don't mix with your vacation debts!`,
      ],
    },

    friends: {
      keywords: ["friend", "friends", "add", "invite", "contact"],
      responses: [
        `**Friends System:**\n\n**Adding Friends:**\n1. Go to the "Friends" tab\n2. Tap "Add Friend"\n3. Enter their email address\n4. They'll appear in your friends list instantly\n\n**What Friends Enable:**\n• Quick-add to any group\n• See shared expense history\n• Easy settlement tracking\n• No need to re-enter their info\n\n**Important Notes:**\n• Adding is **one-way** - you add them, they see you in their list\n• No approval needed - instant connection\n• Friends must have a Splitwise account\n• You can remove friends anytime\n\n**Friend vs. Group Member:**\n• **Friend** = Someone in your contact list\n• **Group Member** = Someone in a specific expense group\n\nYou can be in groups with non-friends (added by other group members), but adding as a friend makes future groups easier!`,
      ],
    },

    currency: {
      keywords: ["currency", "dollar", "rupee", "inr", "usd", "exchange", "convert", "multi"],
      responses: [
        `**Multi-Currency Support:**\n\n**How It Works:**\n• Set a base currency for each group\n• Enter expenses in any supported currency\n• Automatic conversion using real-time exchange rates\n• Balances tracked in the group's base currency\n\n**Supported Currencies:**\n• USD ($)\n• INR (₹)\n• EUR (€)\n• GBP (£)\n• And many more!\n\n**Example:**\n• Group base: INR (₹)\n• You enter: $50 USD dinner\n• Splitwise converts: ~₹4,200\n• Split among group in INR\n\n**Use Cases:**\n• International travel\n• Cross-border roommates\n• Online purchases in foreign currencies\n\n**Note:** Exchange rates update periodically. Minor fluctuations may occur between logging and settling.`,
      ],
    },

    receipt: {
      keywords: ["receipt", "scan", "photo", "picture", "ocr", "premium"],
      responses: [
        `**Receipt Scanning (Premium Feature):**\n\n**What It Does:**\n• Photograph a receipt with your phone camera\n• AI reads the total amount and line items\n• Automatically creates an expense\n• Suggests split amounts based on items\n\n**How It Works:**\n1. Take a photo of the receipt\n2. Splitwise's OCR (Optical Character Recognition) processes it\n3. Extracts: restaurant name, items, total, tax\n4. You confirm the details\n5. Expense is created and split\n\n**Best For:**\n• Restaurant bills with itemized orders\n• Large group dinners\n• Receipts with clear printed text\n\n**Limitations:**\n• Requires clear, well-lit receipt photos\n• Works best with printed (not handwritten) receipts\n• Premium feature (requires Splitwise Pro subscription)\n\n**Tip:** For simple receipts, manual entry is often faster. Use scanning for complex itemized bills!`,
      ],
    },

    mobile: {
      keywords: ["mobile", "phone", "app", "download", "install", "pwa", "ios", "android"],
      responses: [
        `**Splitwise on Mobile:**\n\n**Native Apps:**\n• iOS (App Store)\n• Android (Google Play Store)\n• Free to download and use\n\n**Features:**\n• Same functionality as web\n• Push notifications for new expenses\n• Quick expense entry\n• Camera for receipt scanning\n• Offline access to balances\n\n**Progressive Web App (PWA):**\n• Access via mobile browser\n• "Add to Home Screen" for app-like experience\n• Works offline\n• No app store needed\n\n**Which to use?**\n• **Native app**: Best for regular users, push notifications, camera integration\n• **PWA**: Quick access, no install required, works on any device\n\n**Pro tip:** Enable notifications so you know when someone adds an expense you're part of!`,
      ],
    },

    privacy: {
      keywords: ["privacy", "security", "data", "safe", "secure", "password", "account"],
      responses: [
        `**Privacy & Security:**\n\n**Data Storage:**\n• All data stored securely in the cloud\n• Encrypted at rest and in transit\n• Regular backups\n\n**Account Security:**\n• Email + password authentication\n• Option to add phone number\n• Password reset via email\n• Session management\n\n**Privacy Controls:**\n• You control who sees your expenses\n• Group-based visibility\n• No public profiles\n• Friends list is private\n\n**Data Access:**\n• Only you can see your full balance sheet\n• Group members see shared group expenses\n• No one sees your other groups\n\n**Data Portability:**\n• Export your data anytime\n• Delete your account and all data\n\n**Note:** Splitwise sells anonymized, aggregated data (not individual user data) for market research. Your personal info is not sold.`,
      ],
    },

    tips: {
      keywords: ["tip", "tricks", "hack", "advice", "best", "practice", "recommend"],
      responses: [
        `**Splitwise Pro Tips:**\n\n**For Roommates:**\n• Create a group for recurring bills (rent, utilities)\n• Log expenses immediately after paying\n• Settle up monthly to keep balances small\n\n**For Travel:**\n• Create a trip group BEFORE you travel\n• Log expenses daily (don't let them pile up)\n• Use "Equal" split for most things\n• Take photos of receipts for big expenses\n\n**For Dinners:**\n• Log the expense before you leave the restaurant\n• Use "Equal" for similar orders\n• Use "Exact" when portions vary a lot\n\n**General:**\n• Add friends BEFORE you need them in a group\n• Check balances weekly to avoid surprises\n• Settle up when amounts get large\n• Use descriptive expense names ("Dinner at XYZ" not just "Food")\n\n**Settlement Strategy:**\n• Pay people back when it's convenient for you\n• Don't wait for perfect accuracy - close enough is fine\n• Periodic settlements keep relationships healthy!`,
      ],
    },

    cost: {
      keywords: ["cost", "price", "free", "paid", "subscription", "premium", "plan", "expensive"],
      responses: [
        `**Splitwise Pricing:**\n\n**Free Tier (Splitwise Basic):**\n• Unlimited groups\n• Unlimited expenses\n• All splitting methods\n• Debt simplification\n• Settlement tracking\n• Mobile apps\n• Web access\n\n**Premium (Splitwise Pro):**\n• Everything in Basic\n• Receipt scanning (OCR)\n• Currency conversion\n• Export data\n• No ads\n\n**Premium (Splitwise Go):**\n• Everything in Pro\n• Priority support\n• Early access to features\n\n**Is it worth it?**\n• Most users: Free tier is plenty!\n• Frequent travelers: Pro for receipt scanning\n• Power users: Go for support\n\n**No credit card required** for free tier. Try it out with no commitment!`,
      ],
    },
  },

  fallback: [
    "I'm not sure I understand that question. Try asking about:\n• Splitwise features\n• How bill splitting works\n• Why people use Splitwise\n• Debt simplification\n• Settlement options\n• Group management\n\nOr just ask me anything else about how Splitwise works!",
    "Hmm, I'm not sure about that. Here are some topics I can help with:\n• **Features** - What Splitwise can do\n• **How it works** - Step-by-step process\n• **Splitting methods** - Equal, exact, percentage\n• **Why use it** - Benefits and use cases\n• **Settlements** - How to pay people back\n• **Tips** - Best practices\n\nWhat would you like to know?",
  ],
};

function findResponse(input) {
  const lower = input.toLowerCase().trim();

  // Check greetings
  if (/^(hi|hello|hey|sup|yo|howdy|greetings)/i.test(lower)) {
    return SPLITWISE_KB.greetings[Math.floor(Math.random() * SPLITWISE_KB.greetings.length)];
  }

  // Check each topic
  for (const [, topic] of Object.entries(SPLITWISE_KB.topics)) {
    if (topic.keywords.some((kw) => lower.includes(kw))) {
      return topic.responses[Math.floor(Math.random() * topic.responses.length)];
    }
  }

  // Check for "thank" or "bye"
  if (/thank|thanks|thx|bye|goodbye|see ya/i.test(lower)) {
    return "You're welcome! Feel free to ask if you have more questions about Splitwise. Happy bill splitting! 💰";
  }

  // Fallback
  return SPLITWISE_KB.fallback[Math.floor(Math.random() * SPLITWISE_KB.fallback.length)];
}

function formatMessage(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/• /g, "&bull; ")
    .replace(/\n/g, "<br/>");
}

export default function AiChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      text: "Hey! I'm your **Splitwise AI assistant**. I can explain:\n\n• **Features** - What Splitwise can do\n• **How it works** - Step-by-step guide\n• **Splitting methods** - Equal, exact, percentage\n• **Why use it** - Benefits and use cases\n• **Debt simplification** - How the algorithm works\n• **Settlements** - How to pay people back\n• **Tips** - Best practices\n\nWhat would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const msgIdRef = useRef(2);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { id: msgIdRef.current++, role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const aiResponse = findResponse(trimmed);
      const aiMsg = { id: msgIdRef.current++, role: "ai", text: aiResponse };
      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "What are Splitwise features?",
    "How does bill splitting work?",
    "Why should I use Splitwise?",
    "How does debt simplification work?",
    "How do I settle up?",
    "Tell me a pro tip",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-green-500 text-white rounded-br-md"
                  : "bg-white text-gray-800 shadow-sm rounded-bl-md"
              }`}
            >
              {msg.role === "ai" ? (
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                />
              ) : (
                <p className="text-sm leading-relaxed">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInput(q);
                  setTimeout(() => {
                    const userMsg = { id: msgIdRef.current++, role: "user", text: q };
                    setMessages((prev) => [...prev, userMsg]);
                    setTimeout(() => {
                      const aiResponse = findResponse(q);
                      setMessages((prev) => [
                        ...prev,
                        { id: msgIdRef.current++, role: "ai", text: aiResponse },
                      ]);
                    }, 600);
                    setInput("");
                  }, 100);
                }}
                className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-white border-t">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Splitwise..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
