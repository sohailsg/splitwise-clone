import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import SettleUpModal from "../components/SettleUpModal";
import { formatCurrency } from "../utils/currency";

export default function Settlements() {
  const { currentUser } = useAuth();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSettleModal, setShowSettleModal] = useState(false);

  const fetchSettlements = async () => {
    try {
      const q = query(
        collection(db, "settlements"),
        where("fromUserId", "==", currentUser.uid)
      );
      const q2 = query(
        collection(db, "settlements"),
        where("toUserId", "==", currentUser.uid)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q), getDocs(q2)]);

      const allSettlements = [
        ...snap1.docs.map((d) => ({ id: d.id, ...d.data() })),
        ...snap2.docs.map((d) => ({ id: d.id, ...d.data() })),
      ];

      allSettlements.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSettlements(allSettlements);
    } catch (error) {
      console.error("Error fetching settlements:", error);
      setError("Failed to load settlements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.uid]);

  const getUserNames = async (settlementsList) => {
    const userCache = {};
    const uniqueUids = new Set();
    settlementsList.forEach((s) => {
      uniqueUids.add(s.fromUserId);
      uniqueUids.add(s.toUserId);
    });
    const uidPromises = [...uniqueUids].map(async (uid) => {
      const userSnap = await getDoc(doc(db, "users", uid));
      return { uid, name: userSnap.exists() ? userSnap.data().name : "Unknown" };
    });
    const results = await Promise.all(uidPromises);
    results.forEach(({ uid, name }) => { userCache[uid] = name; });
    return userCache;
  };

  const [names, setNames] = useState({});

  useEffect(() => {
    if (settlements.length > 0) {
      let cancelled = false;
      getUserNames(settlements).then((result) => {
        if (!cancelled) setNames(result);
      });
      return () => { cancelled = true; };
    }
  }, [settlements]);

  const handleSettleCreated = () => {
    setShowSettleModal(false);
    fetchSettlements();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Settlements</h1>
          <button
            onClick={() => setShowSettleModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            + Settle Up
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg mb-4">{error}</p>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : settlements.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">No settlements yet</p>
            <p className="text-sm text-gray-400">
              Record a payment when you settle up with someone
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm divide-y">
            {settlements.map((settlement) => {
              const isFrom = settlement.fromUserId === currentUser.uid;
              return (
                <div
                  key={settlement.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {isFrom ? "You paid" : "Payment from"}{" "}
                      {names[isFrom ? settlement.toUserId : settlement.fromUserId] || "Loading..."}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(settlement.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${
                      isFrom ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {isFrom ? "-" : "+"}{formatCurrency(settlement.amount, "INR")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showSettleModal && (
        <SettleUpModal
          onClose={() => setShowSettleModal(false)}
          onSettlementCreated={handleSettleCreated}
        />
      )}
    </div>
  );
}
