import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";

export default function SettleUpModal({ onClose, onSettlementCreated }) {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [members, setMembers] = useState([]);
  const [toUser, setToUser] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingGroups, setFetchingGroups] = useState(true);
  const [error, setError] = useState("");
  const [settleDate, setSettleDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
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
      } catch (err) {
        console.error("Error fetching groups:", err);
      } finally {
        setFetchingGroups(false);
      }
    };
    fetchGroups();
  }, [currentUser.uid]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedGroup) {
        setMembers([]);
        return;
      }

      try {
        const groupRef = doc(db, "groups", selectedGroup);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          const memberUids = groupSnap
            .data()
            .memberUids.filter((uid) => uid !== currentUser.uid);
          const memberPromises = memberUids.map((uid) =>
            getDoc(doc(db, "users", uid))
          );
          const memberSnaps = await Promise.all(memberPromises);
          const memberList = memberSnaps
            .filter((snap) => snap.exists())
            .map((snap) => ({
              id: snap.id,
              ...snap.data(),
            }));
          setMembers(memberList);
        }
      } catch (err) {
        console.error("Error fetching members:", err);
      }
    };

    fetchMembers();
  }, [selectedGroup, currentUser.uid]);

  const handleSettle = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedGroup) {
      setError("Select a group");
      return;
    }

    if (!toUser) {
      setError("Select who you're paying");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const settleData = {
        fromUserId: currentUser.uid,
        toUserId: toUser,
        groupId: selectedGroup,
        amount: parseFloat(amount),
        date: new Date(settleDate + "T12:00:00").toISOString(),
      };

      await addDoc(collection(db, "settlements"), settleData);
      onSettlementCreated();
    } catch (err) {
      console.error("Settlement creation failed:", err);
      setError("Failed to record settlement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Settle Up</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSettle} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setToUser("");
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pay to
            </label>
            <select
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              disabled={!selectedGroup}
            >
              <option value="">Select a person</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="999999999"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={settleDate}
              onChange={(e) => setSettleDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
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
            {loading ? "Recording..." : "Record Payment"}
          </button>
        </form>
      </div>
    </div>
  );
}
