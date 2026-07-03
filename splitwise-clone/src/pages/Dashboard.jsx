import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
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
import { getYouOwe, getOwesYou } from "../utils/balances";
import { formatCurrency } from "../utils/currency";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [friendCount, setFriendCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [youOwe, setYouOwe] = useState([]);
  const [owesYou, setOwesYou] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [userNames, setUserNames] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [friendsSnap, groupsSnap] = await Promise.all([
          getDocs(collection(db, "users", currentUser.uid, "friends")),
          getDocs(
            query(
              collection(db, "groups"),
              where("memberUids", "array-contains", currentUser.uid)
            )
          ),
        ]);

        if (cancelled) return;
        setFriendCount(friendsSnap.size);
        setGroupCount(groupsSnap.size);

        const groupIds = groupsSnap.docs.map((d) => d.id);

        const expensePromises = groupIds.map((gId) =>
          getDocs(
            query(collection(db, "expenses"), where("groupId", "==", gId))
          )
        );

        const [expenseSnaps, settleSnap1, settleSnap2] = await Promise.all([
          Promise.all(expensePromises),
          getDocs(
            query(
              collection(db, "settlements"),
              where("fromUserId", "==", currentUser.uid)
            )
          ),
          getDocs(
            query(
              collection(db, "settlements"),
              where("toUserId", "==", currentUser.uid)
            )
          ),
        ]);

        if (cancelled) return;
        const allExpenses = expenseSnaps.flatMap((snap) =>
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );

        const allSettlements = [
          ...settleSnap1.docs.map((d) => ({ id: d.id, ...d.data() })),
          ...settleSnap2.docs.map((d) => ({ id: d.id, ...d.data() })),
        ];

        setYouOwe(getYouOwe(allExpenses, allSettlements, currentUser.uid));
        setOwesYou(getOwesYou(allExpenses, allSettlements, currentUser.uid));
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [currentUser.uid, refreshKey]);

  useEffect(() => {
    const fetchNames = async () => {
      const allUids = new Set();
      youOwe.forEach((d) => allUids.add(d.to));
      owesYou.forEach((d) => allUids.add(d.from));

      const uniqueUids = [...allUids].filter(
        (uid) => uid !== currentUser.uid
      );

      if (uniqueUids.length === 0) return;

      const namePromises = uniqueUids.map(async (uid) => {
        const userSnap = await getDoc(doc(db, "users", uid));
        return {
          uid,
          name: userSnap.exists() ? userSnap.data().name : "Unknown",
        };
      });

      const results = await Promise.all(namePromises);
      const namesMap = {};
      results.forEach(({ uid, name }) => {
        namesMap[uid] = name;
      });
      setUserNames(namesMap);
    };

    if (youOwe.length > 0 || owesYou.length > 0) {
      fetchNames();
    }
  }, [youOwe, owesYou, currentUser.uid]);

  const handleSettleCreated = () => {
    setShowSettleModal(false);
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const netBalances = useMemo(() => {
    const net = {};

    youOwe.forEach((debt) => {
      if (!net[debt.to]) net[debt.to] = 0;
      net[debt.to] -= debt.amount;
    });

    owesYou.forEach((debt) => {
      if (!net[debt.from]) net[debt.from] = 0;
      net[debt.from] += debt.amount;
    });

    return net;
  }, [youOwe, owesYou]);
  const totalYouOwe = youOwe.reduce((sum, d) => sum + d.amount, 0);
  const totalOwesYou = owesYou.reduce((sum, d) => sum + d.amount, 0);
  const totalBalance = totalOwesYou - totalYouOwe;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <span className="text-sm text-gray-500">
            {currentUser?.email}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <button onClick={() => { setError(null); setLoading(true); setRefreshKey((k) => k + 1); }} className="text-green-600 text-sm hover:underline">
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <p className="text-sm text-gray-500 mb-1">Overall Balance</p>
              <p
                className={`text-4xl font-bold ${
                  totalBalance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalBalance >= 0 ? "+" : ""}{formatCurrency(totalBalance, "INR")}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {totalBalance >= 0
                  ? "You are owed overall"
                  : "You owe overall"}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h3 className="font-bold text-gray-800 mb-4">Balances</h3>
              {Object.keys(netBalances).length === 0 ? (
                <p className="text-gray-400 text-sm">
                  No balances with anyone yet
                </p>
              ) : (
                <div className="divide-y">
                  {Object.entries(netBalances)
                    .sort(([, a], [, b]) => a - b)
                    .map(([uid, balance]) => (
                      <div
                        key={uid}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              balance >= 0 ? "bg-green-500" : "bg-red-500"
                            }`}
                          >
                            {balance >= 0 ? "↑" : "↓"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {userNames[uid] || "Loading..."}
                            </p>
                            <p className="text-sm text-gray-500">
                              {balance >= 0
                                ? "owes you"
                                : "you owe"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            balance >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(Math.abs(balance), "INR")}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">You Owe</p>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    {youOwe.length} expense{youOwe.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(totalYouOwe, "INR")}
                </p>
                {youOwe.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {youOwe.slice(0, 3).map((debt) => (
                      <div
                        key={debt.to}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-600">
                          → {userNames[debt.to] || "..."}
                        </span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(debt.amount, "INR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">You're Owed</p>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    {owesYou.length} expense{owesYou.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(totalOwesYou, "INR")}
                </p>
                {owesYou.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {owesYou.slice(0, 3).map((debt) => (
                      <div
                        key={debt.from}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-600">
                          ← {userNames[debt.from] || "..."}
                        </span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(debt.amount, "INR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <button
                onClick={() => setShowSettleModal(true)}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors"
              >
                Settle Up
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Link
                to="/friends"
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  Friends
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {friendCount}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {friendCount === 0
                    ? "Add friends to get started"
                    : "Manage your friends"}
                </p>
              </Link>

              <Link
                to="/groups"
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  Groups
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {groupCount}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {groupCount === 0
                    ? "Create a group to split expenses"
                    : "View your groups"}
                </p>
              </Link>
            </div>
          </>
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
