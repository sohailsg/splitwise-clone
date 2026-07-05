import { useState, useEffect, useMemo } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { CURRENCIES, convertCurrency, formatCurrency } from "../utils/currency";

export default function AddExpenseModal({
  groupId,
  members: membersProp,
  onClose,
  onExpenseAdded,
  baseCurrency = "INR",
}) {
  const { currentUser } = useAuth();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(baseCurrency);
  const [splitType, setSplitType] = useState("equal");
  const [payerId, setPayerId] = useState("");
  const [splits, setSplits] = useState({});
  const [shares, setShares] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const members = useMemo(() => membersProp || [], [membersProp]);

  useEffect(() => {
    if (currentUser) setPayerId(currentUser.uid);
  }, [currentUser]);

  useEffect(() => {
    if (members.length > 0) {
      const initialSplits = {};
      const initialShares = {};
      members.forEach((m) => {
        initialSplits[m.id] = "";
        initialShares[m.id] = "1";
      });
      setSplits(initialSplits);
      setShares(initialShares);
    }
  }, [members]);

  const convertedAmount = useMemo(() => {
    const a = parseFloat(amount) || 0;
    if (currency === baseCurrency) return a;
    return convertCurrency(a, currency, baseCurrency);
  }, [amount, currency, baseCurrency]);

  const handleAmountChange = (value) => {
    setAmount(value);
    recalculateSplits(value, splitType);
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    if (amount) recalculateSplits(amount, splitType);
  };

  const recalculateSplits = (amt, type) => {
    if (members.length === 0) return;
    const baseAmount = currency === baseCurrency
      ? parseFloat(amt) || 0
      : convertCurrency(parseFloat(amt) || 0, currency, baseCurrency);

    if (type === "equal") {
      const share = baseAmount / members.length;
      const newSplits = {};
      members.forEach((m) => { newSplits[m.id] = share.toFixed(2); });
      setSplits(newSplits);
    } else if (type === "shares") {
      const totalShares = Object.values(shares).reduce((s, v) => s + (parseFloat(v) || 0), 0);
      if (totalShares > 0) {
        const newSplits = {};
        members.forEach((m) => {
          const memberShares = parseFloat(shares[m.id]) || 0;
          newSplits[m.id] = ((memberShares / totalShares) * baseAmount).toFixed(2);
        });
        setSplits(newSplits);
      }
    }
  };

  const handleSplitTypeChange = (type) => {
    setSplitType(type);
    if (type === "equal") {
      recalculateSplits(amount, type);
    } else {
      const newSplits = {};
      members.forEach((m) => { newSplits[m.id] = ""; });
      setSplits(newSplits);
    }
  };

  const handleSplitChange = (memberId, value) => {
    setSplits((prev) => ({ ...prev, [memberId]: value }));
  };

  const handleShareChange = (memberId, value) => {
    setShares((prev) => {
      const newShares = { ...prev, [memberId]: value };
      const totalShares = Object.values(newShares).reduce((s, v) => s + (parseFloat(v) || 0), 0);
      if (totalShares > 0) {
        const baseAmount = currency === baseCurrency
          ? parseFloat(amount) || 0
          : convertCurrency(parseFloat(amount) || 0, currency, baseCurrency);
        const newSplits = {};
        members.forEach((m) => {
          const memberShares = parseFloat(newShares[m.id]) || 0;
          newSplits[m.id] = ((memberShares / totalShares) * baseAmount).toFixed(2);
        });
        setSplits(newSplits);
      }
      return newShares;
    });
  };

  const validateSplits = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount");
      return false;
    }
    if (splitType === "equal" || splitType === "shares") return true;

    const totalSplit = Object.values(splits).reduce(
      (sum, val) => sum + (parseFloat(val) || 0), 0
    );

    if (splitType === "exact") {
      if (Math.abs(totalSplit - convertedAmount) > 0.01) {
        setError("Split amounts must equal the total");
        return false;
      }
    } else if (splitType === "percentage") {
      if (Math.abs(totalSplit - 100) > 0.01) {
        setError("Percentages must add up to 100%");
        return false;
      }
    }
    return true;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!description.trim()) { setError("Description is required"); return; }
    if (!validateSplits()) return;

    setLoading(true);
    try {
      const splitsArray = members.map((m) => ({
        uid: m.id,
        amount: parseFloat(splits[m.id]) || 0,
      }));

      const expenseData = {
        groupId,
        payerId,
        amount: convertedAmount,
        originalAmount: parseFloat(amount),
        originalCurrency: currency,
        description: description.trim(),
        splitType,
        splits: splitsArray,
        date: new Date(expenseDate + "T12:00:00").toISOString(),
        createdBy: currentUser.uid,
      };

      if (splitType === "shares") {
        expenseData.shares = { ...shares };
      }

      if (evidenceFiles.length > 0) {
        setUploading(true);
        const base64Promises = evidenceFiles.map((file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
        );
        expenseData.evidenceImages = await Promise.all(base64Promises);
        setUploading(false);
      }

      await addDoc(collection(db, "expenses"), expenseData);
      setLoading(false);
      onExpenseAdded();
    } catch (err) {
      setLoading(false);
      setUploading(false);
      console.error("Expense creation failed:", err);
      setError("Failed to add expense. Check console for details.");
    }
  };

  const getMemberName = (uid) => {
    const member = members.find((m) => m.id === uid);
    return member ? member.name : "Unknown";
  };

  const symbol = CURRENCIES[currency]?.symbol || "₹";
  const showConverted = currency !== baseCurrency;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="e.g., Dinner, Groceries, Rent"
              maxLength="200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evidence (bills, receipts)
              <span className="text-gray-400 font-normal ml-1">— optional</span>
            </label>
            <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 transition-colors">
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  {uploading ? "Uploading..." : "Click to upload images"}
                </p>
                <p className="text-xs text-gray-400">JPG, PNG, PDF — max 5MB each</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const files = Array.from(e.target.files).filter((f) => f.size <= 5 * 1024 * 1024);
                  setEvidenceFiles((prev) => [...prev, ...files].slice(0, 5));
                }}
              />
            </label>
            {evidenceFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {evidenceFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    {file.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Evidence"
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                        PDF
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setEvidenceFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">{symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999999"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-lg font-bold"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
              >
                {Object.entries(CURRENCIES).map(([code, info]) => (
                  <option key={code} value={code}>{info.symbol} {code}</option>
                ))}
              </select>
            </div>
          </div>

          {showConverted && amount && (
            <p className="text-xs text-gray-500 bg-blue-50 px-3 py-1.5 rounded-lg">
              ≈ {formatCurrency(convertedAmount, baseCurrency)} (converted to {baseCurrency})
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paid by</label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}{member.id === currentUser.uid ? " (you)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Split Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "equal", label: "Equal", icon: "÷" },
                { id: "exact", label: "Amount", icon: symbol },
                { id: "percentage", label: "%", icon: "%" },
                { id: "shares", label: "Shares", icon: "×" },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleSplitTypeChange(type.id)}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                    splitType === type.id
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span className="block text-base">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Among ({members.length} people)
              {splitType === "shares" && " — enter share counts"}
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      member.id === currentUser.uid ? "bg-green-500" : "bg-gray-400"
                    }`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-800">
                      {member.name}
                      {member.id === currentUser.uid && <span className="text-gray-400 ml-1">(you)</span>}
                    </span>
                  </div>
                  {splitType === "equal" ? (
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(parseFloat(splits[member.id]) || 0, baseCurrency)}
                    </span>
                  ) : splitType === "shares" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={shares[member.id] || ""}
                        onChange={(e) => handleShareChange(member.id, e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-center text-sm font-medium"
                        placeholder="1"
                      />
                      <span className="text-xs text-gray-400 w-14 text-right">
                        {formatCurrency(parseFloat(splits[member.id]) || 0, baseCurrency)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {splitType === "percentage" && (
                        <span className="text-gray-400 mr-1">%</span>
                      )}
                      {splitType === "exact" && (
                        <span className="text-gray-400 mr-1">{symbol}</span>
                      )}
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={splits[member.id] || ""}
                        onChange={(e) => handleSplitChange(member.id, e.target.value)}
                        className="w-20 px-2 py-1 border rounded text-right text-sm font-medium"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {amount && splitType === "exact" && (
              <div className="mt-2 text-sm">
                {(() => {
                  const total = Object.values(splits).reduce((s, v) => s + (parseFloat(v) || 0), 0);
                  const remaining = convertedAmount - total;
                  return (
                    <p className={Math.abs(remaining) < 0.01 ? "text-green-600" : "text-red-600"}>
                      {Math.abs(remaining) < 0.01
                        ? "✓ Split matches total"
                        : `Remaining: ${formatCurrency(remaining, baseCurrency)}`}
                    </p>
                  );
                })()}
              </div>
            )}

            {amount && splitType === "percentage" && (
              <div className="mt-2 text-sm">
                {(() => {
                  const total = Object.values(splits).reduce((s, v) => s + (parseFloat(v) || 0), 0);
                  const remaining = 100 - total;
                  return (
                    <p className={Math.abs(remaining) < 0.01 ? "text-green-600" : "text-red-600"}>
                      {Math.abs(remaining) < 0.01
                        ? "✓ Percentages total 100%"
                        : `Remaining: ${remaining.toFixed(1)}%`}
                    </p>
                  );
                })()}
              </div>
            )}

            {amount && splitType === "shares" && (
              <div className="mt-2 text-sm text-gray-500">
                Total shares: {Object.values(shares).reduce((s, v) => s + (parseFloat(v) || 0), 0)}
              </div>
            )}
          </div>

          {amount && splitType === "equal" && members.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-600 mb-1">Summary</p>
              <p className="text-sm text-gray-800">
                {getMemberName(payerId)} paid {formatCurrency(convertedAmount, baseCurrency)}
              </p>
              <p className="text-sm text-gray-600">
                Each person owes {formatCurrency(convertedAmount / members.length, baseCurrency)}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
