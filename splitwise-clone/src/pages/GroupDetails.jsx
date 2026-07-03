import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import AddExpenseModal from "../components/AddExpenseModal";
import { computeRawBalances, netPairwiseBalances } from "../utils/balances";
import { formatCurrency } from "../utils/currency";

export default function GroupDetails() {
  const { groupId } = useParams();
  const { currentUser } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [groupSnap, expensesSnap] = await Promise.all([
          getDoc(doc(db, "groups", groupId)),
          getDocs(
            query(
              collection(db, "expenses"),
              where("groupId", "==", groupId)
            )
          ),
        ]);

        if (!groupSnap.exists()) {
          if (!cancelled) { setError("Group not found"); setLoading(false); }
          return;
        }

        const groupData = { id: groupSnap.id, ...groupSnap.data() };

        if (!groupData.memberUids.includes(currentUser.uid)) {
          if (!cancelled) { setError("You are not a member of this group"); setLoading(false); }
          return;
        }

        if (cancelled) return;
        setGroup(groupData);

        const memberPromises = groupData.memberUids.map((uid) =>
          getDoc(doc(db, "users", uid))
        );
        const memberSnaps = await Promise.all(memberPromises);
        if (cancelled) return;
        const memberList = memberSnaps
          .filter((snap) => snap.exists())
          .map((snap) => ({
            id: snap.id,
            ...snap.data(),
          }));
        setMembers(memberList);

        const expensesList = expensesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        expensesList.sort((a, b) => new Date(b.date) - new Date(a.date));
        setExpenses(expensesList);
      } catch (err) {
        console.error("Error loading data:", err);
        if (!cancelled) setError("Failed to load group");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [groupId, currentUser.uid]);

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await deleteDoc(doc(db, "expenses", expenseId));
      setExpenses(expenses.filter((e) => e.id !== expenseId));
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  const handleExpenseAdded = async () => {
    setShowAddExpense(false);
    try {
      const snapshot = await getDocs(
        query(
          collection(db, "expenses"),
          where("groupId", "==", groupId)
        )
      );
      const expensesList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      expensesList.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(expensesList);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  const getMemberName = (uid) => {
    const member = members.find((m) => m.id === uid);
    return member ? member.name : "Unknown";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const calculateGroupBalances = () => {
    const balances = computeRawBalances(expenses, []);
    return netPairwiseBalances(balances);
  };

  const groupBalances = calculateGroupBalances();

  const getUserBalance = (uid) => {
    const balance = groupBalances[uid];
    if (!balance) return null;

    return Object.entries(balance).map(([to, amount]) => ({
      to,
      amount,
    }));
  };

  const myBalance = getUserBalance(currentUser.uid);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Link to="/groups" className="text-green-600 hover:underline">
              Back to Groups
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/groups"
          className="text-green-600 hover:underline text-sm mb-4 inline-block"
        >
          ← Back to Groups
        </Link>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {group.name}
            </h1>
            <p className="text-sm text-gray-500">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowAddExpense(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            + Add Expense
          </button>
        </div>

        {myBalance && myBalance.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Your Balance</h3>
            <div className="space-y-2">
              {myBalance.map((b) => (
                <div key={b.to} className="flex justify-between items-center">
                  <span className="text-gray-600">
                    You owe {getMemberName(b.to)}
                  </span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(b.amount, "INR")}
                  </span>
                </div>
              ))}
              {Object.keys(groupBalances)
                .filter((uid) => groupBalances[uid]?.[currentUser.uid])
                .map((from) => (
                  <div
                    key={from}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-600">
                      {getMemberName(from)} owes you
                    </span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(groupBalances[from][currentUser.uid], "INR")}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(
                expenses.reduce((sum, e) => sum + e.amount, 0),
                "INR"
              )}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500">You Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                expenses
                  .filter((e) => e.payerId === currentUser.uid)
                  .reduce((sum, e) => sum + e.amount, 0),
                "INR"
              )}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Expenses</p>
            <p className="text-2xl font-bold text-gray-800">{expenses.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-800">Balances</h2>
          </div>
          <div className="divide-y">
            {Object.keys(groupBalances).map((from) =>
              Object.entries(groupBalances[from]).map(([to, amount]) => (
                <div
                  key={`${from}-${to}`}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        from === currentUser.uid
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    >
                      {from === currentUser.uid ? "↑" : "↓"}
                    </span>
                    <span className="text-gray-800">
                      <span className="font-medium">
                        {getMemberName(from)}
                      </span>
                      {from === currentUser.uid ? " pays " : " gets paid by "}
                      <span className="font-medium">{getMemberName(to)}</span>
                    </span>
                  </div>
                  <span
                    className={`font-bold ${
                      from === currentUser.uid
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatCurrency(amount, "INR")}
                  </span>
                </div>
              ))
            )}
            {Object.keys(groupBalances).length === 0 && (
              <div className="p-4 text-center text-gray-400">
                No outstanding balances
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-800">Expenses</h2>
          </div>
          {expenses.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No expenses yet
            </div>
          ) : (
            <div className="divide-y">
              {expenses.map((expense) => (
                <div key={expense.id} className="p-4">
                  <div
                    className="flex justify-between items-start cursor-pointer"
                    onClick={() =>
                      setExpandedExpense(
                        expandedExpense === expense.id ? null : expense.id
                      )
                    }
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {expense.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        Paid by {getMemberName(expense.payerId)} •{" "}
                        {formatDate(expense.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {formatCurrency(expense.amount, "INR")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {expense.splitType === "equal"
                          ? "Split equally"
                          : expense.splitType === "exact"
                          ? "Split by amount"
                          : "Split by %"}
                      </p>
                    </div>
                  </div>

                  {expandedExpense === expense.id && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Split breakdown:
                      </p>
                      <div className="space-y-1">
                        {expense.splits.map((split) => {
                          const isPayer = split.uid === expense.payerId;
                          return (
                            <div
                              key={split.uid}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600">
                                {getMemberName(split.uid)}
                                {isPayer && (
                                  <span className="text-gray-400 ml-1">
                                    (paid)
                                  </span>
                                )}
                                {split.uid === currentUser.uid && (
                                  <span className="text-gray-400 ml-1">
                                    (you)
                                  </span>
                                )}
                              </span>
                              <span
                                className={
                                  isPayer
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {isPayer ? "+" : "-"}{formatCurrency(split.amount, "INR")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {expense.createdBy === currentUser.uid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExpense(expense.id);
                          }}
                          className="mt-3 text-xs text-red-500 hover:text-red-600"
                        >
                          Delete expense
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddExpense && (
        <AddExpenseModal
          groupId={groupId}
          members={members}
          onClose={() => setShowAddExpense(false)}
          onExpenseAdded={handleExpenseAdded}
        />
      )}
    </div>
  );
}
