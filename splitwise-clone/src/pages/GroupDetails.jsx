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
  arrayUnion,
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
  const [memberSearch, setMemberSearch] = useState("");
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingMemberName, setEditingMemberName] = useState("");
  const [expandedExpense, setExpandedExpense] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingDateId, setEditingDateId] = useState(null);
  const [editingDateValue, setEditingDateValue] = useState("");
  const [addingEvidenceId, setAddingEvidenceId] = useState(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

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
          const settlementsSnap = await getDocs(
            query(collection(db, "settlements"), where("groupId", "==", groupId))
          );
          if (cancelled) return;
          const settlementsList = settlementsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setSettlements(settlementsList);
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
      const settlementsSnap = await getDocs(
        query(collection(db, "settlements"), where("groupId", "==", groupId))
      );
      return settlementsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
        memberUids: arrayUnion(friendId),
      });
      const userSnap = await getDoc(doc(db, "users", friendId));
      if (userSnap.exists()) {
        setMembers((prev) => [...prev, { id: userSnap.id, ...userSnap.data() }]);
      }
      setGroup((prev) => ({ ...prev, memberUids: [...prev.memberUids, friendId] }));
      setMemberSearch("");
    } catch (err) {
      console.error("Error adding member:", err);
      alert("Failed to add member. Please try again.");
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
      alert("Failed to remove member. Please try again.");
    }
  };

  const handleUpdateMemberName = async (memberId) => {
    if (!editingMemberName.trim()) return;
    try {
      const memberNames = { ...(group.memberNames || {}), [memberId]: editingMemberName.trim() };
      await updateDoc(doc(db, "groups", groupId), { memberNames });
      setGroup((prev) => ({ ...prev, memberNames }));
      setEditingMemberId(null);
    } catch (err) {
      console.error("Error updating member name:", err);
      alert("Failed to update name. Please try again.");
    }
  };

  const getMemberDisplayName = (uid) => {
    if (group.memberNames && group.memberNames[uid]) return group.memberNames[uid];
    const member = members.find((m) => m.id === uid);
    return member ? member.name : "Unknown";
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

  const handleLeaveGroup = async () => {
    if (!confirm("Leave this group? You won't be able to see it anymore.")) return;
    try {
      const updates = { memberUids: arrayRemove(currentUser.uid) };
      if (group.memberNames && group.memberNames[currentUser.uid]) {
        const memberNames = { ...group.memberNames };
        delete memberNames[currentUser.uid];
        updates.memberNames = memberNames;
      }
      await updateDoc(doc(db, "groups", groupId), updates);
      navigate("/groups");
    } catch (err) {
      console.error("Error leaving group:", err);
      alert("Failed to leave group. Please try again.");
    }
  };

  const startEditDate = (id, currentDate) => {
    setEditingDateId(id);
    setEditingDateValue(new Date(currentDate).toISOString().split("T")[0]);
  };

  const saveEditDate = async (collectionName, docId) => {
    try {
      const newDate = new Date(editingDateValue + "T12:00:00").toISOString();
      await updateDoc(doc(db, collectionName, docId), { date: newDate });
      if (collectionName === "expenses") {
        setExpenses((prev) => prev.map((e) => e.id === docId ? { ...e, date: newDate } : e));
      } else {
        setSettlements((prev) => prev.map((s) => s.id === docId ? { ...s, date: newDate } : s));
      }
      setEditingDateId(null);
    } catch (err) {
      console.error("Error updating date:", err);
    }
  };

  const handleAddEvidence = async (expenseId, file) => {
    setUploadingEvidence(true);
    try {
      const compressImage = (f) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const maxSize = 800;
              let w = img.width;
              let h = img.height;
              if (w > maxSize || h > maxSize) {
                if (w > h) { h = Math.round((h * maxSize) / w); w = maxSize; }
                else { w = Math.round((w * maxSize) / h); h = maxSize; }
              }
              canvas.width = w;
              canvas.height = h;
              canvas.getContext("2d").drawImage(img, 0, 0, w, h);
              resolve(canvas.toDataURL("image/jpeg", 0.6));
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(f);
        });

      const base64 = await compressImage(file);
      const expense = expenses.find((e) => e.id === expenseId);
      const existing = expense?.evidenceImages || [];
      if (existing.length >= 5) {
        alert("Maximum 5 images per expense.");
        setUploadingEvidence(false);
        return;
      }
      const updated = [...existing, base64];
      await updateDoc(doc(db, "expenses", expenseId), { evidenceImages: updated });
      setExpenses((prev) => prev.map((e) => e.id === expenseId ? { ...e, evidenceImages: updated } : e));
      setAddingEvidenceId(null);
    } catch (err) {
      console.error("Error adding evidence:", err);
      alert("Failed to add image.");
    } finally {
      setUploadingEvidence(false);
    }
  };

  const getMemberName = (uid) => {
    return getMemberDisplayName(uid);
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
                      {editingDateId === settlement.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="date"
                            value={editingDateValue}
                            onChange={(e) => setEditingDateValue(e.target.value)}
                            className="px-2 py-1 border rounded text-xs outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            onClick={() => saveEditDate("settlements", settlement.id)}
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingDateId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p
                          className="text-xs text-gray-400 cursor-pointer hover:text-blue-500"
                          onClick={() => startEditDate(settlement.id, settlement.date)}
                        >
                          {new Date(settlement.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                          <span className="ml-1 text-gray-300">✎</span>
                        </p>
                      )}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-bold text-gray-800">Expenses</h2>
              <div className="flex gap-2 items-center text-sm">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1 border rounded-lg text-gray-600 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="From"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1 border rounded-lg text-gray-600 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="To"
                />
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          {(() => {
            const filtered = expenses.filter((e) => {
              if (!dateFrom && !dateTo) return true;
              const d = new Date(e.date);
              if (dateFrom && d < new Date(dateFrom)) return false;
              if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
              return true;
            });
            if (filtered.length === 0) {
              return (
                <div className="p-6 text-center text-gray-400">
                  {expenses.length === 0 ? "No expenses yet" : "No expenses in this date range"}
                </div>
              );
            }
            return (
              <div className="divide-y">
                {filtered.map((expense) => (
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
                        {expense.evidenceImages && expense.evidenceImages.length > 0 && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                            📎 {expense.evidenceImages.length}
                          </span>
                        )}
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
                      {expense.evidenceImages && expense.evidenceImages.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-600 mb-2">Evidence:</p>
                          <div className="flex flex-wrap gap-2">
                            {expense.evidenceImages.map((img, i) => (
                              <a
                                key={i}
                                href={img}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <img
                                  src={img}
                                  alt="Evidence"
                                  className="w-20 h-20 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-3">
                        {addingEvidenceId === expense.id ? (
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={`evidence-${expense.id}`}
                              className="inline-block bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-green-600 transition-colors"
                            >
                              {uploadingEvidence ? "Compressing..." : "Choose Image"}
                            </label>
                            <input
                              id={`evidence-${expense.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingEvidence}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) handleAddEvidence(expense.id, file);
                                e.target.value = "";
                              }}
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); setAddingEvidenceId(null); }}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setAddingEvidenceId(expense.id); }}
                            className="text-xs text-blue-500 hover:text-blue-700"
                          >
                            + Add evidence
                          </button>
                        )}
                      </div>
                      {expense.createdBy === currentUser.uid && (
                        <div className="mt-3 flex items-center gap-3">
                          {editingDateId === expense.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={editingDateValue}
                                onChange={(e) => setEditingDateValue(e.target.value)}
                                className="px-2 py-1 border rounded text-sm outline-none focus:ring-2 focus:ring-green-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); saveEditDate("expenses", expense.id); }}
                                className="text-xs text-green-600 hover:text-green-800 font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingDateId(null); }}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); startEditDate(expense.id, expense.date); }}
                              className="text-xs text-blue-500 hover:text-blue-700"
                            >
                              Edit date
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExpense(expense.id);
                            }}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Delete expense
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
          })()}
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
              <button onClick={() => { setShowEditGroup(false); setMemberSearch(""); setEditingMemberId(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
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
                  {members.map((member) => {
                    const displayName = getMemberDisplayName(member.id);
                    return (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          member.id === currentUser.uid ? "bg-green-500" : "bg-gray-400"
                        }`}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          {editingMemberId === member.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingMemberName}
                                onChange={(e) => setEditingMemberName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleUpdateMemberName(member.id)}
                                className="px-2 py-1 border rounded text-sm outline-none focus:ring-2 focus:ring-green-500"
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateMemberName(member.id)}
                                className="text-xs text-green-600 hover:text-green-800 font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingMemberId(null)}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-gray-800">
                              {displayName}
                              {member.id === currentUser.uid && <span className="text-gray-400 ml-1">(you)</span>}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingMemberId !== member.id && (
                          <button
                            onClick={() => { setEditingMemberId(member.id); setEditingMemberName(displayName); }}
                            className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                          >
                            Edit
                          </button>
                        )}
                        {member.id !== currentUser.uid && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Member</label>
                {friends.length === 0 ? (
                  <p className="text-sm text-gray-400">No friends to add. Add friends first.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                    {friends
                      .filter((f) => !group.memberUids.includes(f.id))
                      .filter((f) => {
                        if (!memberSearch.trim()) return true;
                        const q = memberSearch.toLowerCase();
                        return (f.friendName || "").toLowerCase().includes(q) || (f.friendEmail || "").toLowerCase().includes(q);
                      })
                      .map((friend) => (
                        <div key={friend.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                          <div>
                            <span className="text-sm text-gray-800">{friend.friendName}</span>
                            <span className="text-xs text-gray-400 ml-1">{friend.friendEmail}</span>
                          </div>
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
                {friends.filter((f) => !group.memberUids.includes(f.id)).length > 3 && (
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full mt-2 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <button
                  onClick={handleLeaveGroup}
                  className="w-full bg-yellow-500 text-white py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                >
                  Leave Group
                </button>
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
