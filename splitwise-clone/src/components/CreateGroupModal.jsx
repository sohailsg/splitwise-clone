import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";

export default function CreateGroupModal({ onClose, onGroupCreated }) {
  const { currentUser } = useAuth();
  const [name, setName] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingFriends, setFetchingFriends] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchFriends = async () => {
      try {
        const friendsRef = collection(db, "users", currentUser.uid, "friends");
        const snapshot = await getDocs(friendsRef);
        if (cancelled) return;
        const friendsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFriends(friendsList);
      } catch (err) {
        console.error("Error fetching friends:", err);
      } finally {
        if (!cancelled) setFetchingFriends(false);
      }
    };
    fetchFriends();
    return () => { cancelled = true; };
  }, [currentUser.uid]);

  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Group name is required");
      return;
    }

    if (selectedFriends.length === 0) {
      setError("Select at least one friend");
      return;
    }

    setLoading(true);
    try {
      const memberUids = [currentUser.uid, ...selectedFriends];
      await addDoc(collection(db, "groups"), {
        name: name.trim(),
        memberUids,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
      });
      onGroupCreated();
    } catch (err) {
      setError("Failed to create group");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Create Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="e.g., Roommates, Trip, Dinner"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Members
            </label>
            {fetchingFriends ? (
              <p className="text-sm text-gray-500">Loading friends...</p>
            ) : friends.length === 0 ? (
              <p className="text-sm text-gray-500">
                No friends yet. Add friends first.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {friends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFriends.includes(friend.id)}
                      onChange={() => toggleFriend(friend.id)}
                      className="w-4 h-4 text-green-500 rounded focus:ring-green-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {friend.friendName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {friend.friendEmail}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
}
