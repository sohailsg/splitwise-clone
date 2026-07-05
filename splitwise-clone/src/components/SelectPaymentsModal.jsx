import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { formatCurrency } from "../utils/currency";

export default function SelectPaymentsModal({ event, expenses, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const assigned = expenses.filter((e) => e.eventId === event.id);
  const unassigned = expenses.filter((e) => !e.eventId);
  const otherEvent = expenses.filter((e) => e.eventId && e.eventId !== event.id);

  const [selected, setSelected] = useState(() => {
    const map = {};
    assigned.forEach((e) => { map[e.id] = true; });
    return map;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const toggle = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const updates = [];

      for (const exp of expenses) {
        const wasAssigned = exp.eventId === event.id;
        const isNowSelected = !!selected[exp.id];

        if (!wasAssigned && isNowSelected) {
          updates.push(updateDoc(doc(db, "expenses", exp.id), { eventId: event.id }));
        } else if (wasAssigned && !isNowSelected) {
          updates.push(updateDoc(doc(db, "expenses", exp.id), { eventId: null }));
        }
      }

      await Promise.all(updates);
      setLoading(false);
      onSaved();
    } catch (err) {
      setLoading(false);
      console.error("Error updating payments:", err);
      setError("Failed to save. Please try again.");
    }
  };

  const renderExpenseRow = (expense) => {
    const isChecked = !!selected[expense.id];
    return (
      <label
        key={expense.id}
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
          isChecked ? "bg-purple-50 border-purple-300" : "hover:bg-gray-50 border-gray-200"
        }`}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => toggle(expense.id)}
          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{expense.description}</p>
          <p className="text-xs text-gray-400">{formatDate(expense.date)}</p>
        </div>
        <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
          {formatCurrency(expense.amount, "INR")}
        </span>
      </label>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-800">{event.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Select which payments belong to this event</p>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <div className="flex-1 overflow-y-auto space-y-2">
          {assigned.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1 px-1">Currently assigned</p>
              {assigned.map(renderExpenseRow)}
            </div>
          )}

          {unassigned.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1 px-1">Group level (unassigned)</p>
              {unassigned.map(renderExpenseRow)}
            </div>
          )}

          {otherEvent.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1 px-1">Assigned to other events</p>
              {otherEvent.map(renderExpenseRow)}
            </div>
          )}

          {expenses.length === 0 && (
            <div className="p-6 text-center text-gray-400">
              No expenses in this group yet.
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
