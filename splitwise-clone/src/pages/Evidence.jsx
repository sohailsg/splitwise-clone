import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import { formatCurrency } from "../utils/currency";

export default function Evidence() {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [assignedExpenseId, setAssignedExpenseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "groups"), where("memberUids", "array-contains", currentUser.uid))
        );
        setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching groups:", err);
      }
    };
    fetchGroups();
  }, [currentUser.uid]);

  const loadGroupExpenses = async (groupId) => {
    setSelectedGroup(groupId);
    setPhoto(null);
    setPhotoPreview(null);
    setAssignedExpenseId(null);
    setDone(false);
    setLoading(true);
    try {
      const expSnap = await getDocs(
        query(collection(db, "expenses"), where("groupId", "==", groupId))
      );
      const expList = expSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      expList.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(expList);

      const group = groups.find((g) => g.id === groupId);
      if (group?.memberUids) {
        const memberPromises = group.memberUids.map((uid) => getDoc(doc(db, "users", uid)));
        const memberSnaps = await Promise.all(memberPromises);
        setMembers(memberSnaps.filter((s) => s.exists()).map((s) => ({ id: s.id, ...s.data() })));
      }
    } catch (err) {
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setAssignedExpenseId(null);
    setDone(false);
  };

  const compressImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxSize = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxSize || h > maxSize) {
            if (w > h) { h = Math.round((h * maxSize) / w); w = maxSize; }
            else { w = Math.round((w * maxSize) / h); h = maxSize; }
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

  const attachToExpense = async (expenseId) => {
    if (!photo) return;
    setAssignedExpenseId(expenseId);
    setLoading(true);
    try {
      const base64 = await compressImage(photo);
      const expense = expenses.find((e) => e.id === expenseId);
      const existing = expense?.evidenceImages || [];
      if (existing.length >= 5) {
        alert("This expense already has 5 images max.");
        setLoading(false);
        setAssignedExpenseId(null);
        return;
      }
      await updateDoc(doc(db, "expenses", expenseId), {
        evidenceImages: arrayUnion(base64),
      });
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === expenseId
            ? { ...e, evidenceImages: [...(e.evidenceImages || []), base64] }
            : e
        )
      );
      setDone(true);
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      console.error("Error attaching evidence:", err);
      alert("Failed to attach image.");
    } finally {
      setLoading(false);
      setAssignedExpenseId(null);
    }
  };

  const getMemberName = (uid) => {
    const m = members.find((m) => m.id === uid);
    return m ? m.name : "Unknown";
  };

  const filteredExpenses = expenses.filter((e) => {
    if (!dateFrom && !dateTo) return true;
    const d = new Date(e.date);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Add Evidence</h1>

        {!selectedGroup ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4">Select a Group</h2>
            {groups.length === 0 ? (
              <p className="text-gray-500">No groups found.</p>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => loadGroupExpenses(group.id)}
                    className="w-full text-left p-4 rounded-xl border hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <p className="font-medium text-gray-800">{group.name}</p>
                    <p className="text-xs text-gray-400">{group.memberUids?.length || 0} members</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={() => { setSelectedGroup(null); setPhoto(null); setPhotoPreview(null); }}
              className="text-green-600 hover:underline text-sm mb-4 inline-block"
            >
              ← Change Group
            </button>

            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="font-bold text-gray-800 mb-4">1. Take or Pick Photo</h2>
              {photoPreview ? (
                <div className="flex items-center gap-4">
                  <img src={photoPreview} alt="Evidence" className="w-24 h-24 object-cover rounded-lg border" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Photo ready</p>
                    <button
                      onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      className="text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <label htmlFor="camera-input" className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2.5 rounded-lg font-medium cursor-pointer hover:bg-green-600 transition-colors">
                    📷 Take Photo
                  </label>
                  <input
                    id="camera-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <label htmlFor="gallery-input" className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-lg font-medium cursor-pointer hover:bg-blue-600 transition-colors">
                    🖼 Choose from Gallery
                  </label>
                  <input
                    id="gallery-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>
              )}
            </div>

            {photoPreview && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-800 mb-4">2. Select Expense Entry</h2>

                <div className="flex gap-2 items-center text-sm mb-4">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-2 py-1 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-2 py-1 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  />
                  {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-red-500 hover:text-red-700">
                      Clear
                    </button>
                  )}
                </div>

                {done && (
                  <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">
                    Evidence attached successfully!
                  </div>
                )}

                {loading && !assignedExpenseId && (
                  <p className="text-gray-500 text-sm">Loading...</p>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        assignedExpenseId === expense.id
                          ? "border-green-500 bg-green-50"
                          : "hover:border-gray-300"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{expense.description}</p>
                        <p className="text-xs text-gray-400">
                          {getMemberName(expense.payerId)} •{" "}
                          {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {" • "}
                          {formatCurrency(expense.amount, "INR")}
                          {expense.evidenceImages?.length > 0 && (
                            <span className="ml-1 text-blue-500">📎{expense.evidenceImages.length}</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => attachToExpense(expense.id)}
                        disabled={loading}
                        className="ml-3 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {assignedExpenseId === expense.id ? "Attaching..." : "Attach"}
                      </button>
                    </div>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No expenses found for this date range.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
