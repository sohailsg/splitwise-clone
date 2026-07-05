import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";

export default function CreateEventModal({ groupId, onClose, onCreated }) {
  const { currentUser } = useAuth();
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Event name is required");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "groups", groupId, "events"), {
        name: name.trim(),
        date: new Date(date + "T12:00:00").toISOString(),
        description: description.trim(),
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
      });
      setLoading(false);
      onCreated();
    } catch (err) {
      setLoading(false);
      console.error("Error creating event:", err);
      setError("Failed to create event.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Create Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="e.g., Weekend trip"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              placeholder="Optional notes"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
