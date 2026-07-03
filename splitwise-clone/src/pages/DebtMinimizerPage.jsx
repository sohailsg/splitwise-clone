import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import DebtMinimizer from "../components/DebtMinimizer";
import { computeRawBalances } from "../utils/balances";

export default function DebtMinimizerPage() {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupBalances, setGroupBalances] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const q = query(
          collection(db, "groups"),
          where("memberUids", "array-contains", currentUser.uid)
        );
        const snap = await getDocs(q);
        setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching groups:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [currentUser.uid]);

  useEffect(() => {
    if (!selectedGroup) {
      setGroupMembers([]);
      setGroupBalances({});
      return;
    }

    let cancelled = false;
    const loadGroupData = async () => {
      try {
        const groupSnap = await getDoc(doc(db, "groups", selectedGroup));
        if (!groupSnap.exists() || cancelled) return;
        const groupData = groupSnap.data();

        const memberPromises = groupData.memberUids.map((uid) =>
          getDoc(doc(db, "users", uid))
        );
        const memberSnaps = await Promise.all(memberPromises);
        if (cancelled) return;
        const members = memberSnaps
          .filter((s) => s.exists())
          .map((d) => ({ id: d.id, ...d.data() }));
        setGroupMembers(members);

        const expensesSnap = await getDocs(
          query(collection(db, "expenses"), where("groupId", "==", selectedGroup))
        );
        const expenses = expensesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const settleSnap = await getDocs(
          query(collection(db, "settlements"), where("groupId", "==", selectedGroup))
        );
        const settlements = settleSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (cancelled) return;
        const balances = computeRawBalances(expenses, settlements);
        setGroupBalances(balances);
      } catch (err) {
        console.error("Error loading group data:", err);
      }
    };

    loadGroupData();
    return () => { cancelled = true; };
  }, [selectedGroup]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading groups...</div>
        ) : (
          <>
            <div className="mb-6">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
              >
                <option value="">Select a group (or use manual mode)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.memberUids.length} members)
                  </option>
                ))}
              </select>
            </div>

            <DebtMinimizer
              groupMembers={groupMembers}
              groupBalances={groupBalances}
            />
          </>
        )}
      </div>
    </div>
  );
}
