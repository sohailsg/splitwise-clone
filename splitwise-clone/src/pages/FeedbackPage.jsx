import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import FeedbackModal from "../components/FeedbackModal";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  "in-progress": "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};

export default function FeedbackPage() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "feedback"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, [currentUser.uid]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} submission{items.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          + New Feedback
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No feedback submitted yet.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="text-green-600 hover:underline text-sm font-medium"
          >
            Send your first feedback
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] || ""}`}>
                  {item.status}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                  {item.type}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {item.createdAt?.toDate?.().toLocaleDateString() || "Just now"}
                </span>
              </div>
              <p className="text-gray-900 text-sm">{item.message}</p>

              {item.adminReply && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-green-700 mb-1">Admin Reply</p>
                  <p className="text-sm text-green-800">{item.adminReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <FeedbackModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
