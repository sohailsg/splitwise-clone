import { useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";

export default function AddFriendModal({ onClose, onFriendAdded }) {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No user found with that email");
        setLoading(false);
        return;
      }

      const userDoc = snapshot.docs[0];

      if (userDoc.id === currentUser.uid) {
        setError("You can't add yourself as a friend");
        setLoading(false);
        return;
      }

      const friendRef = doc(
        db,
        "users",
        currentUser.uid,
        "friends",
        userDoc.id
      );
      const existingFriend = await getDoc(friendRef);

      if (existingFriend.exists()) {
        setError("Already friends with this user");
        setLoading(false);
        return;
      }

      await setDoc(friendRef, {
        friendUid: userDoc.id,
        friendName: userDoc.data().name,
        friendEmail: userDoc.data().email,
        addedAt: new Date().toISOString(),
      });

      setSuccess(`Added ${userDoc.data().name} as a friend!`);
      setEmail("");
      setTimeout(() => onFriendAdded(), 1000);
    } catch (err) {
      setError("Failed to add friend");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add Friend</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Friend's Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="friend@email.com"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-green-600 bg-green-50 p-2 rounded-lg">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Friend"}
          </button>
        </form>
      </div>
    </div>
  );
}
