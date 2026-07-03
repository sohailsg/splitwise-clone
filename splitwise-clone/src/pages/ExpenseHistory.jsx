import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import { formatCurrency, CURRENCIES } from "../utils/currency";

export default function ExpenseHistory() {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [loading, setLoading] = useState(true);
  const [memberNames, setMemberNames] = useState({});
  const [groupNames, setGroupNames] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const groupsSnap = await getDocs(
          query(
            collection(db, "groups"),
            where("memberUids", "array-contains", currentUser.uid)
          )
        );
        const groupsList = groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (cancelled) return;
        setGroups(groupsList);

        const namesMap = {};
        groupsList.forEach((g) => { namesMap[g.id] = g.name; });
        setGroupNames(namesMap);

        const groupIds = groupsList.map((g) => g.id);
        const expensePromises = groupIds.map((gid) =>
          getDocs(query(collection(db, "expenses"), where("groupId", "==", gid)))
        );
        const snaps = await Promise.all(expensePromises);
        if (cancelled) return;
        const allExpenses = snaps.flatMap((s) =>
          s.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
        allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        setExpenses(allExpenses);

        const uidSet = new Set();
        allExpenses.forEach((e) => {
          uidSet.add(e.payerId);
          e.splits?.forEach((s) => uidSet.add(s.uid));
        });

        const namePromises = [...uidSet].map(async (uid) => {
          const snap = await getDoc(doc(db, "users", uid));
          return { uid, name: snap.exists() ? snap.data().name : "Unknown" };
        });
        const nameResults = await Promise.all(namePromises);
        if (cancelled) return;
        const namesMapResult = {};
        nameResults.forEach(({ uid, name }) => { namesMapResult[uid] = name; });
        setMemberNames(namesMapResult);
      } catch (err) {
        console.error("Error loading expense history:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [currentUser.uid]);

  const filtered = expenses.filter((exp) => {
    if (selectedGroup && exp.groupId !== selectedGroup) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const descMatch = exp.description?.toLowerCase().includes(q);
      const payerMatch = memberNames[exp.payerId]?.toLowerCase().includes(q);
      const amountMatch = exp.amount?.toString().includes(q);
      if (!descMatch && !payerMatch && !amountMatch) return false;
    }

    if (dateFrom) {
      const expDate = new Date(exp.date);
      if (expDate < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const expDate = new Date(exp.date);
      if (expDate > new Date(dateTo + "T23:59:59")) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "date-desc": return new Date(b.date) - new Date(a.date);
      case "date-asc": return new Date(a.date) - new Date(b.date);
      case "amount-desc": return b.amount - a.amount;
      case "amount-asc": return a.amount - b.amount;
      default: return 0;
    }
  });

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const myExpenses = filtered.filter((e) => e.payerId === currentUser.uid);
  const myTotal = myExpenses.reduce((s, e) => s + e.amount, 0);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Expense History</h1>
        <p className="text-sm text-gray-500 mb-6">Searchable timeline of all expenses</p>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading expenses...</div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 space-y-3">
              <div className="relative">
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by description, person, or amount..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                >
                  <option value="">All groups</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                  placeholder="To"
                />

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                >
                  <option value="date-desc">Newest first</option>
                  <option value="date-asc">Oldest first</option>
                  <option value="amount-desc">Highest amount</option>
                  <option value="amount-asc">Lowest amount</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500">Total Expenses</p>
                <p className="text-xl font-bold text-gray-800">{filtered.length}</p>
                <p className="text-xs text-gray-400">{formatCurrency(totalAmount, "INR")}</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500">You Paid</p>
                <p className="text-xl font-bold text-green-600">{myExpenses.length}</p>
                <p className="text-xs text-gray-400">{formatCurrency(myTotal, "INR")}</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500">Unique Payers</p>
                <p className="text-xl font-bold text-blue-600">
                  {new Set(filtered.map((e) => e.payerId)).size}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm divide-y">
              {sorted.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <p className="text-4xl mb-2">📋</p>
                  <p>No expenses found</p>
                  {(searchQuery || selectedGroup || dateFrom || dateTo) && (
                    <button
                      onClick={() => { setSearchQuery(""); setSelectedGroup(""); setDateFrom(""); setDateTo(""); }}
                      className="text-green-600 text-sm mt-2 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                sorted.map((expense) => {
                  const isExpanded = expandedId === expense.id;
                  const isMyExpense = expense.payerId === currentUser.uid;
                  return (
                    <div key={expense.id} className="p-4">
                      <div
                        className="flex justify-between items-start cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            isMyExpense ? "bg-green-500" : "bg-blue-500"
                          }`}>
                            {memberNames[expense.payerId]?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{expense.description}</p>
                            <p className="text-xs text-gray-500">
                              Paid by {memberNames[expense.payerId] || "..."} &middot;{" "}
                              {groupNames[expense.groupId] || "..."}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(expense.date)} at {formatTime(expense.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${isMyExpense ? "text-green-600" : "text-gray-800"}`}>
                            {expense.originalCurrency && expense.originalCurrency !== "INR" ? (
                              <span>
                                {CURRENCIES[expense.originalCurrency]?.symbol}{expense.originalAmount}
                                <span className="text-xs text-gray-400 ml-1">({expense.originalCurrency})</span>
                              </span>
                            ) : (
                              formatCurrency(expense.amount, "INR")
                            )}
                          </p>
                          <p className="text-xs text-gray-400">{expense.splitType} split</p>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          {expense.originalCurrency && expense.originalCurrency !== "INR" && (
                            <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                              Converted: {formatCurrency(expense.amount, "INR")} (rate: 1 {expense.originalCurrency} ≈ {(expense.amount / expense.originalAmount).toFixed(2)} INR)
                            </p>
                          )}
                          <p className="text-sm font-medium text-gray-600">Split breakdown:</p>
                          <div className="space-y-1">
                            {expense.splits?.map((split) => {
                              const isPayer = split.uid === expense.payerId;
                              return (
                                <div key={split.uid} className="flex justify-between items-center text-sm bg-gray-50 px-3 py-1.5 rounded">
                                  <span className="text-gray-600">
                                    {memberNames[split.uid] || "..."}
                                    {isPayer && <span className="text-gray-400 ml-1">(paid)</span>}
                                  </span>
                                  <span className={isPayer ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                    {isPayer ? "+" : "-"}{formatCurrency(split.amount, "INR")}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
