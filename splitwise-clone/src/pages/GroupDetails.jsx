import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import AddExpenseModal from "../components/AddExpenseModal";
import SettleUpModal from "../components/SettleUpModal";
import { computeRawBalances, netPairwiseBalances } from "../utils/balances";
import { formatCurrency } from "../utils/currency";

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [friends, setFriends] = useState([]);
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

        try {
          const [sentSnap, receivedSnap] = await Promise.all([
            getDocs(query(collection(db, "settlements"), where("fromUserId", "==", currentUser.uid))),
            getDocs(query(collection(db, "settlements"), where("toUserId", "==", currentUser.uid))),
          ]);
          if (cancelled) return;
          const allSettlements = [
            ...sentSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
            ...receivedSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          ];
          const unique = allSettlements.filter((s) => s.groupId === groupId);
          const deduped = Object.values(unique.reduce((acc, s) => { acc[s.id] = s; return acc; }, {}));
          setSettlements(deduped);
        } catch (e) {
          console.warn("Settlements fetch failed:", e);
        }
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

  const fetchGroupSettlements = async () => {
    try {
      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(query(collection(db, "settlements"), where("fromUserId", "==", currentUser.uid))),
        getDocs(query(collection(db, "settlements"), where("toUserId", "==", currentUser.uid))),
      ]);
      const allSettlements = [
        ...sentSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        ...receivedSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      ];
      const filtered = allSettlements.filter((s) => s.groupId === groupId);
      return Object.values(filtered.reduce((acc, s) => { acc[s.id] = s; return acc; }, {}));
    } catch (e) {
      console.warn("Settlements fetch failed:", e);
      return [];
    }
  };

  const handleExpenseAdded = async () => {
    setShowAddExpense(false);
    try {
      const expensesSnap = await getDocs(
        query(
          collection(db, "expenses"),
          where("groupId", "==", groupId)
        )
      );
      const expensesList = expensesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      expensesList.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(expensesList);
      setSettlements(await fetchGroupSettlements());
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleDeleteSettlement = async (settlementId) => {
    if (!confirm("Delete this settlement?")) return;
    try {
      await deleteDoc(doc(db, "settlements", settlementId));
      setSettlements((prev) => prev.filter((s) => s.id !== settlementId));
    } catch (err) {
      console.error("Error deleting settlement:", err);
    }
  };

  const handleSettleCreated = async () => {
    setShowSettleModal(false);
    setSettlements(await fetchGroupSettlements());
  };

  const openEditGroup = async () => {
    setEditGroupName(group.name);
    setShowEditGroup(true);
    try {
      const friendsSnap = await getDocs(
        collection(db, "users", currentUser.uid, "friends")
      );
      const friendsList = friendsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFriends(friendsList);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const handleRenameGroup = async () => {
    if (!editGroupName.trim() || editGroupName.trim() === group.name) return;
    try {
      await updateDoc(doc(db, "groups", groupId), { name: editGroupName.trim() });
      setGroup((prev) => ({ ...prev, name: editGroupName.trim() }));
    } catch (err) {
      console.error("Error renaming group:", err);
    }
  };

  const handleAddMember = async (friendId) => {
    try {
      await updateDoc(doc(db, "groups", groupId), {
        memberUids: [...group.memberUids, friendId],
      });
      const userSnap = await getDoc(doc(db, "users", friendId));
      if (userSnap.exists()) {
        setMembers((prev) => [...prev, { id: userSnap.id, ...userSnap.data() }]);
      }
      setGroup((prev) => ({ ...prev, memberUids: [...prev.memberUids, friendId] }));
    } catch (err) {
      console.error("Error adding member:", err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm(`Remove ${getMemberName(memberId)} from this group?`)) return;
    try {
      await updateDoc(doc(db, "groups", groupId), {
        memberUids: arrayRemove(memberId),
      });
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setGroup((prev) => ({
        ...prev,
        memberUids: prev.memberUids.filter((uid) => uid !== memberId),
      }));
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm("Delete this group? This cannot be undone.")) return;
    if (!confirm("Are you sure? All group data will be lost.")) return;
    try {
      await deleteDoc(doc(db, "groups", groupId));
      navigate("/groups");
    } catch (err) {
      console.error("Error deleting group:", err);
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
    const balances = computeRawBalances(expenses, settlements);
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
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddExpense(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              + Expense
            </button>
            <button
              onClick={() => setShowSettleModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Settle Up
            </button>
            <button
              onClick={openEditGroup}
              className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              ⚙
            </button>
          </div>
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
              Object.entries(groupBalances[from]).map(([to, amount]) => {
                const isMe = from === currentUser.uid;
                const isOwed = to === currentUser.uid;
                return (
                <div
                  key={`${from}-${to}`}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        isMe
                          ? "bg-red-500"
                          : isOwed
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    >
                      {isMe ? "↑" : isOwed ? "↓" : "•"}
                    </span>
                    <span className="text-gray-800">
                      <span className="font-medium">
                        {isMe ? "You" : getMemberName(from)}
                      </span>
                      {" pays "}
                      <span className="font-medium">
                        {isOwed ? "you" : getMemberName(to)}
                      </span>
                    </span>
                  </div>
                  <span
                    className={`font-bold ${
                      isMe
                        ? "text-red-600"
                        : isOwed
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {formatCurrency(amount, "INR")}
                  </span>
                </div>
                );
              })
            )}
            {Object.keys(groupBalances).length === 0 && (
              <div className="p-4 text-center text-gray-400">
                No outstanding balances
              </div>
            )}
          </div>
        </div>

        {settlements.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm mb-6">
            <div className="p-4 border-b">
              <h2 className="font-bold text-gray-800">Settlements</h2>
            </div>
            <div className="divide-y">
              {settlements.map((settlement) => {
                const isFrom = settlement.fromUserId === currentUser.uid;
                return (
                  <div
                    key={settlement.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="text-sm text-gray-800">
                        {isFrom ? "You paid" : "Payment from"}{" "}
                        <span className="font-medium">
                          {getMemberName(isFrom ? settlement.toUserId : settlement.fromUserId)}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(settlement.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold text-sm ${
                          isFrom ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {isFrom ? "-" : "+"}{formatCurrency(settlement.amount, "INR")}
                      </span>
                      <button
                        onClick={() => handleDeleteSettlement(settlement.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

      {showSettleModal && (
        <SettleUpModal
          onClose={() => setShowSettleModal(false)}
          onSettlementCreated={handleSettleCreated}
        />
      )}

      {showEditGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Group</h2>
              <button onClick={() => setShowEditGroup(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={handleRenameGroup}
                    disabled={!editGroupName.trim() || editGroupName.trim() === group.name}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Members ({members.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          member.id === currentUser.uid ? "bg-green-500" : "bg-gray-400"
                        }`}>
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {member.name}
                            {member.id === currentUser.uid && <span className="text-gray-400 ml-1">(you)</span>}
                          </p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                      </div>
                      {member.id !== currentUser.uid && group.createdBy === currentUser.uid && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {group.createdBy === currentUser.uid && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Member</label>
                  {friends.length === 0 ? (
                    <p className="text-sm text-gray-400">No friends to add. Add friends first.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                      {friends
                        .filter((f) => !group.memberUids.includes(f.id))
                        .map((friend) => (
                          <div key={friend.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                            <span className="text-sm text-gray-800">{friend.friendName}</span>
                            <button
                              onClick={() => handleAddMember(friend.id)}
                              className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50"
                            >
                              + Add
                            </button>
                          </div>
                        ))}
                      {friends.filter((f) => !group.memberUids.includes(f.id)).length === 0 && (
                        <p className="text-sm text-gray-400">All friends are already in this group.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <button
                  onClick={handleDeleteGroup}
                  className="w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Delete Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
