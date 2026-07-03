import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { CATEGORIES } from "../utils/paymentLinks";
import { formatCurrency } from "../utils/currency";

const FREQUENCIES = [
  { id: "weekly", label: "Weekly", days: 7 },
  { id: "biweekly", label: "Every 2 weeks", days: 14 },
  { id: "monthly", label: "Monthly", days: 30 },
  { id: "quarterly", label: "Quarterly", days: 90 },
  { id: "yearly", label: "Yearly", days: 365 },
];

export default function RecurringExpenses({ groupId, members = [], onExpenseCreated }) {
  const { currentUser } = useAuth();
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    frequency: "monthly",
    category: "other",
    payerId: "",
    splitType: "equal",
    nextDue: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (currentUser) setForm((prev) => ({ ...prev, payerId: currentUser.uid }));
  }, [currentUser]);

  useEffect(() => {
    const fetchRecurring = async () => {
      try {
        const q = query(
          collection(db, "recurringExpenses"),
          where("groupId", "==", groupId)
        );
        const snap = await getDocs(q);
        setRecurring(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching recurring:", err);
      } finally {
        setLoading(false);
      }
    };
    if (groupId) fetchRecurring();
  }, [groupId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = {
        groupId,
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        frequency: form.frequency,
        category: form.category,
        payerId: form.payerId,
        splitType: form.splitType,
        nextDue: form.nextDue,
        lastCreated: null,
        active: true,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, "recurringExpenses"), data);
      setRecurring((prev) => [...prev, { id: ref.id, ...data }]);
      setShowForm(false);
      setForm({
        description: "",
        amount: "",
        frequency: "monthly",
        category: "other",
        payerId: currentUser.uid,
        splitType: "equal",
        nextDue: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error("Error creating recurring:", err);
    }
  };

  const toggleActive = async (id, current) => {
    try {
      const ref = doc(db, "recurringExpenses", id);
      await updateDoc(ref, { active: !current });
      setRecurring((prev) =>
        prev.map((r) => (r.id === id ? { ...r, active: !current } : r))
      );
    } catch (err) {
      console.error("Error toggling:", err);
    }
  };

  const deleteRecurring = async (id) => {
    if (!confirm("Delete this recurring expense?")) return;
    try {
      await deleteDoc(doc(db, "recurringExpenses", id));
      setRecurring((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const logNow = async (item) => {
    try {
      const splits = [];
      if (item.splitType === "equal") {
        if (members.length > 0) {
          const share = item.amount / members.length;
          members.forEach((m) => splits.push({ uid: m.id, amount: share }));
        }
      }

      await addDoc(collection(db, "expenses"), {
        groupId,
        payerId: item.payerId,
        amount: item.amount,
        description: `${item.description} (recurring)`,
        splitType: item.splitType,
        splits,
        date: new Date().toISOString(),
        createdBy: currentUser.uid,
        category: item.category,
      });

      const freq = FREQUENCIES.find((f) => f.id === item.frequency);
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (freq?.days || 30));

      await updateDoc(doc(db, "recurringExpenses", item.id), {
        lastCreated: new Date().toISOString(),
        nextDue: nextDate.toISOString().split("T")[0],
      });

      setRecurring((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? { ...r, lastCreated: new Date().toISOString(), nextDue: nextDate.toISOString().split("T")[0] }
            : r
        )
      );

      onExpenseCreated?.();
    } catch (err) {
      console.error("Error logging expense:", err);
    }
  };

  const getMemberName = (uid) => {
    const m = members.find((mem) => mem.id === uid);
    return m ? m.name : "Unknown";
  };

  const getCategoryInfo = (catId) => CATEGORIES.find((c) => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];

  const getFrequencyLabel = (freqId) => FREQUENCIES.find((f) => f.id === freqId)?.label || freqId;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800">Recurring Expenses</h3>
          <p className="text-xs text-gray-500">Auto-track rent, subscriptions, and regular bills</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
        >
          + New
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g., Netflix, Rent, Internet"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            required
          />
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2 text-gray-400 text-xs">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="999999999"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Amount"
                required
              />
            </div>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
            <select
              value={form.payerId}
              onChange={(e) => setForm({ ...form, payerId: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Next due date</label>
              <input
                type="date"
                value={form.nextDue}
                onChange={(e) => setForm({ ...form, nextDue: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600">
              Create
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
      ) : recurring.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-4xl mb-2">🔄</p>
          <p className="text-gray-500 mb-1">No recurring expenses</p>
          <p className="text-xs text-gray-400">Add rent, subscriptions, or regular bills</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recurring.map((item) => {
            const cat = getCategoryInfo(item.category);
            const isActive = item.active;
            return (
              <div key={item.id} className={`bg-white rounded-xl shadow-sm p-4 ${!isActive ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                      {cat.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        {getFrequencyLabel(item.frequency)} · {getMemberName(item.payerId)} pays
                      </p>
                      <p className="text-xs text-gray-400">
                        Next: {new Date(item.nextDue).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(item.amount, "INR")}</p>
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => logNow(item)}
                        className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full hover:bg-green-100"
                      >
                        Log now
                      </button>
                      <button
                        onClick={() => toggleActive(item.id, isActive)}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full hover:bg-gray-200"
                      >
                        {isActive ? "Pause" : "Resume"}
                      </button>
                      <button
                        onClick={() => deleteRecurring(item.id)}
                        className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full hover:bg-red-100"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
