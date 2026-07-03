import { useState } from "react";
import { minimizeDebts } from "../utils/debtMinimizer";

export default function DebtMinimizer({ groupMembers: _groupMembers = [], groupBalances = {} }) {
  const [manualMode, setManualMode] = useState(false);
  const [manualDebts, setManualDebts] = useState([]);
  const [newDebt, setNewDebt] = useState({ from: "", to: "", amount: "" });
  const [name, setName] = useState("");

  const useGroupData = !manualMode && Object.keys(groupBalances).length > 0;

  const getTransactions = () => {
    if (useGroupData) {
      return minimizeDebts(groupBalances);
    }
    const result = {};
    manualDebts.forEach((d) => {
      if (!result[d.from]) result[d.from] = {};
      if (!result[d.from][d.to]) result[d.from][d.to] = 0;
      result[d.from][d.to] += parseFloat(d.amount);
    });
    return minimizeDebts(result);
  };

  const addManualDebt = (e) => {
    e.preventDefault();
    if (!name.trim() || !newDebt.from || !newDebt.to || !newDebt.amount) return;
    if (newDebt.from === newDebt.to) return;
    setManualDebts((prev) => [
      ...prev,
      { ...newDebt, id: Date.now(), name: name.trim() },
    ]);
    setNewDebt({ from: "", to: "", amount: "" });
    setName("");
  };

  const removeManualDebt = (id) => {
    setManualDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const transactions = getTransactions();
  const totalOriginalDebt = manualDebts.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const totalMinimized = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Debt Minimizer</h2>
          <p className="text-sm text-gray-500">
            Reduces the number of transactions needed to settle all debts
          </p>
        </div>
        <button
          onClick={() => setManualMode((p) => !p)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            manualMode
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {manualMode ? "Manual Mode" : "Use Group Data"}
        </button>
      </div>

      {manualMode && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">Add Debts</h3>
          <form onSubmit={addManualDebt} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Person name (e.g., Alice)"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              required
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={newDebt.from}
                onChange={(e) => setNewDebt({ ...newDebt, from: e.target.value })}
                placeholder="Owes from"
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
              <input
                type="text"
                value={newDebt.to}
                onChange={(e) => setNewDebt({ ...newDebt, to: e.target.value })}
                placeholder="Owes to"
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={newDebt.amount}
                onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
                placeholder="Amount"
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              + Add Debt
            </button>
          </form>

          {manualDebts.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-400 uppercase font-medium">Current Debts</p>
              {manualDebts.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div className="text-sm">
                    <span className="font-medium text-red-600">{d.name}</span>
                    <span className="text-gray-400"> ({d.from})</span>
                    <span className="text-gray-500"> owes </span>
                    <span className="font-medium text-green-600">{d.to}</span>
                    <span className="text-gray-500"> ₹{parseFloat(d.amount).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => removeManualDebt(d.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-red-50 rounded-xl">
            <p className="text-xs text-gray-500">Original Debts</p>
            <p className="text-2xl font-bold text-red-600">
              {manualMode ? manualDebts.length : Object.values(groupBalances).reduce(
                (s, t) => s + Object.keys(t).length, 0
              )}
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <p className="text-xs text-gray-500">After Minimization</p>
            <p className="text-2xl font-bold text-green-600">{transactions.length}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-gray-500">Saved</p>
            <p className="text-2xl font-bold text-blue-600">
              {(manualMode ? manualDebts.length : Object.values(groupBalances).reduce(
                (s, t) => s + Object.keys(t).length, 0
              )) - transactions.length}
            </p>
          </div>
        </div>

        {manualMode && manualDebts.length > 0 && (
          <div className="flex justify-between text-sm mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Total debt volume:</span>
            <span>
              <span className="text-red-500 line-through mr-2">₹{totalOriginalDebt.toFixed(2)}</span>
              <span className="text-green-600 font-bold">₹{totalMinimized.toFixed(2)}</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <h3 className="font-bold text-gray-800">Optimized Transactions</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">&#10003;</p>
            <p>No outstanding debts to minimize</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={`${tx.from}-${tx.to}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-xs font-bold">
                      {tx.from.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">
                      {tx.to.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    <span className="font-medium text-red-600">{tx.from}</span>
                    <span className="text-gray-400"> &rarr; </span>
                    <span className="font-medium text-green-600">{tx.to}</span>
                  </p>
                  <p className="text-lg font-bold text-gray-800">₹{tx.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
        <h4 className="font-bold text-green-800 mb-2">How Debt Minimization Works</h4>
        <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
          <li>Calculate net balance for each person (owed minus owes)</li>
          <li>Match the biggest debtor with the biggest creditor</li>
          <li>Settle with the minimum amount needed</li>
          <li>Repeat until all balances are zero</li>
        </ol>
        <p className="text-xs text-green-600 mt-2">
          For N people, worst case is N-1 transactions. This algorithm achieves that minimum.
        </p>
      </div>
    </div>
  );
}
