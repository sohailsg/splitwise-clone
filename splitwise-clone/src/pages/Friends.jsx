import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import AddFriendModal from "../components/AddFriendModal";

export default function Friends() {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchFriends = async () => {
    try {
      const friendsRef = collection(db, "users", currentUser.uid, "friends");
      const snapshot = await getDocs(friendsRef);
      const friendsList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setFriends(friendsList);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setError("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.uid]);

  const removeFriend = async (friendId) => {
    if (!confirm("Remove this friend?")) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "friends", friendId));
      setFriends(friends.filter((f) => f.id !== friendId));
    } catch (error) {
      console.error("Error removing friend:", error);
      setError("Failed to remove friend");
    }
  };

  const handleFriendAdded = () => {
    fetchFriends();
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Friends</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            + Add Friend
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg mb-4">{error}</p>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : friends.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">No friends yet</p>
            <p className="text-sm text-gray-400">
              Add friends to start splitting expenses
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm divide-y">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-medium text-gray-800">{friend.friendName}</p>
                  <p className="text-sm text-gray-500">{friend.friendEmail}</p>
                </div>
                <button
                  onClick={() => removeFriend(friend.id)}
                  className="text-red-500 hover:text-red-600 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddFriendModal
          onClose={() => setShowModal(false)}
          onFriendAdded={handleFriendAdded}
        />
      )}
    </div>
  );
}
