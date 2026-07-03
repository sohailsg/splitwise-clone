import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import CreateGroupModal from "../components/CreateGroupModal";

export default function Groups() {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchGroups = async () => {
    try {
      const q = query(
        collection(db, "groups"),
        where("memberUids", "array-contains", currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const groupsList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setGroups(groupsList);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setError("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.uid]);

  const handleGroupCreated = () => {
    fetchGroups();
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Groups</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            + Create Group
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg mb-4">{error}</p>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">No groups yet</p>
            <p className="text-sm text-gray-400">
              Create a group to start splitting expenses
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  {group.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {group.memberUids.length} member
                  {group.memberUids.length !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CreateGroupModal
          onClose={() => setShowModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}
