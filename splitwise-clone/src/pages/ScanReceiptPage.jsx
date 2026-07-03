import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import ReceiptScanner from "../components/ReceiptScanner";
import ItemizedSplitter from "../components/ItemizedSplitter";
import { formatCurrency } from "../utils/currency";

export default function ScanReceiptPage() {
  const { groupId } = useParams();
  const { currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [scannedItems, setScannedItems] = useState(null);
  const [itemizedResult, setItemizedResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadGroup = async () => {
      try {
        const gid = groupId || (await (async () => {
          const groupsSnap = await getDocs(
            query(collection(db, "groups"), where("memberUids", "array-contains", currentUser.uid))
          );
          return groupsSnap.docs[0]?.id || "";
        })());

        if (!gid) { if (!cancelled) setLoading(false); return; }

        const groupSnap = await getDoc(doc(db, "groups", gid));
        if (!groupSnap.exists()) { if (!cancelled) setLoading(false); return; }

        const groupData = groupSnap.data();
        if (cancelled) return;
        setGroupName(groupData.name);

        const memberPromises = groupData.memberUids.map((uid) =>
          getDoc(doc(db, "users", uid))
        );
        const snaps = await Promise.all(memberPromises);
        if (cancelled) return;
        setMembers(
          snaps.filter((s) => s.exists()).map((s) => ({ id: s.id, ...s.data() }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadGroup();
    return () => { cancelled = true; };
  }, [groupId, currentUser.uid]);

  const handleItemsScanned = (data) => {
    setScannedItems(data);
  };

  const handleItemizedConfirm = async (result) => {
    setItemizedResult(result);
    try {
      const splitsArray = Object.entries(result.splits).map(([uid, amount]) => ({
        uid,
        amount,
      }));

      await addDoc(collection(db, "expenses"), {
        groupId: groupId || "",
        payerId: currentUser.uid,
        amount: result.total,
        description: scannedItems?.restaurant
          ? `${scannedItems.restaurant} (itemized)`
          : "Itemized receipt",
        splitType: "itemized",
        splits: splitsArray,
        items: result.items,
        date: new Date().toISOString(),
        createdBy: currentUser.uid,
      });

      setSaved(true);
    } catch (err) {
      console.error("Error saving:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Scan Receipt</h1>
        <p className="text-sm text-gray-500 mb-6">
          {groupName || "Select a group"} — Assign items to people
        </p>

        {saved ? (
          <div className="bg-green-50 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-2">✓</p>
            <p className="font-bold text-green-700">Expense saved!</p>
            <p className="text-sm text-green-600 mt-1">
              {formatCurrency(itemizedResult?.total, "INR")} split among {members.length} people
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-6">
            {!scannedItems ? (
              <ReceiptScanner onItemsScanned={handleItemsScanned} />
            ) : !itemizedResult ? (
              <ItemizedSplitter
                members={members}
                items={scannedItems.items}
                onConfirm={handleItemizedConfirm}
              />
            ) : null}

            {scannedItems && !itemizedResult && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-2">Scanned Summary</h3>
                <div className="space-y-1 text-sm">
                  {scannedItems.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="text-gray-800">{formatCurrency(item.price, "INR")}</span>
                    </div>
                  ))}
                  {scannedItems.tax > 0 && (
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-gray-500">Tax</span>
                      <span className="text-gray-800">{formatCurrency(scannedItems.tax, "INR")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total</span>
                    <span>{formatCurrency(scannedItems.total, "INR")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
