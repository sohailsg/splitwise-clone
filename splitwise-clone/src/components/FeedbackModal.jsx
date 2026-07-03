import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";

export default function FeedbackModal({ open, onClose }) {
  const { currentUser } = useAuth();
  const [type, setType] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "feedback"), {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        type,
        message: message.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setMessage("");
      setType("suggestion");
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setSubmitted(false);
    setMessage("");
    setType("suggestion");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">Send Feedback</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you!</h3>
            <p className="text-gray-500 text-sm mb-4">Your feedback has been submitted. The admin will review it soon.</p>
            <button
              onClick={handleClose}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="flex gap-2">
                {[
                  { value: "bug", label: "Bug", color: "red" },
                  { value: "suggestion", label: "Suggestion", color: "purple" },
                  { value: "general", label: "General", color: "gray" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      type === opt.value
                        ? opt.color === "red"
                          ? "bg-red-100 text-red-700 ring-2 ring-red-300"
                          : opt.color === "purple"
                          ? "bg-purple-100 text-purple-700 ring-2 ring-purple-300"
                          : "bg-gray-200 text-gray-700 ring-2 ring-gray-300"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                rows={4}
                required
                placeholder="Describe your feedback..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none text-sm"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/1000</p>
            </div>

            <button
              type="submit"
              disabled={!message.trim() || loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
