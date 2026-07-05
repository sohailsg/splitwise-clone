import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function MoveExpenseModal({ expense, events, onClose, onMove }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const handleMove = async (targetEventId) => {
    setLoading(true);
    setError("");
    try {
      const update = targetEventId ? { eventId: targetEventId } : { eventId: null };
      await updateDoc(doc(db, "expenses", expense.id), update);
      setLoading(false);
      onMove(targetEventId);
    } catch (err) {
      setLoading(false);
      console.error("Error moving expense:", err);
      setError("Failed to move expense.");
    }
  };

  const currentEventId = expense.eventId || null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Move Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Moving: <span className="font-medium text-gray-800">{expense.description}</span>
        </p>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          <button
            onClick={() => handleMove(null)}
            disabled={loading || currentEventId === null}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              currentEventId === null
                ? "bg-green-50 border-green-300 text-green-800"
                : "hover:bg-gray-50 border-gray-200"
            } disabled:opacity-50`}
          >
            <p className="font-medium">Group Level</p>
            <p className="text-xs text-gray-400">Not assigned to any event</p>
          </button>

          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => handleMove(event.id)}
              disabled={loading || currentEventId === event.id}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                currentEventId === event.id
                  ? "bg-green-50 border-green-300 text-green-800"
                  : "hover:bg-gray-50 border-gray-200"
              } disabled:opacity-50`}
            >
              <p className="font-medium">{event.name}</p>
              <p className="text-xs text-gray-400">{formatDate(event.date)}</p>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
