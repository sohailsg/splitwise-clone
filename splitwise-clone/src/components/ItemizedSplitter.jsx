import { useState, useMemo } from "react";
import { formatCurrency } from "../utils/currency";

export default function ItemizedSplitter({ members = [], items = [], onConfirm }) {
  const [assignments, setAssignments] = useState(() => {
    const init = {};
    items.forEach((item, idx) => { init[idx] = []; });
    return init;
  });

  const [customItems, setCustomItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const allItems = useMemo(() => {
    return [...items.map((item, idx) => ({ ...item, idx })), ...customItems.map((item, idx) => ({ ...item, idx: items.length + idx }))];
  }, [items, customItems]);

  const toggleMember = (itemIdx, memberId) => {
    setAssignments((prev) => {
      const current = prev[itemIdx] || [];
      const updated = current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId];
      return { ...prev, [itemIdx]: updated };
    });
  };

  const splitEvenly = (itemIdx) => {
    setAssignments((prev) => ({
      ...prev,
      [itemIdx]: members.map((m) => m.id),
    }));
  };

  const addCustomItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || parseFloat(newItemPrice) <= 0) return;
    setCustomItems((prev) => [
      ...prev,
      { name: newItemName.trim(), price: parseFloat(newItemPrice), idx: items.length + prev.length },
    ]);
    setNewItemName("");
    setNewItemPrice("");
    setShowAdd(false);
  };

  const removeCustomItem = (idx) => {
    setCustomItems((prev) => prev.filter((_, i) => items.length + i !== idx));
  };

  const memberTotals = useMemo(() => {
    const totals = {};
    members.forEach((m) => { totals[m.id] = 0; });

    allItems.forEach((item) => {
      const assigned = assignments[item.idx] || [];
      if (assigned.length > 0) {
        const share = item.price / assigned.length;
        assigned.forEach((uid) => {
          totals[uid] = (totals[uid] || 0) + share;
        });
      }
    });

    return totals;
  }, [allItems, assignments, members]);

  const grandTotal = allItems.reduce((s, item) => s + item.price, 0);
  const assignedTotal = allItems
    .filter((item) => (assignments[item.idx] || []).length > 0)
    .reduce((s, item) => s + item.price, 0);

  const handleConfirm = () => {
    const splits = {};
    members.forEach((m) => { splits[m.id] = 0; });

    allItems.forEach((item) => {
      const assigned = assignments[item.idx] || [];
      if (assigned.length > 0) {
        const share = item.price / assigned.length;
        assigned.forEach((uid) => {
          splits[uid] += share;
        });
      }
    });

    onConfirm?.({
      items: allItems.map((item) => ({
        ...item,
        assignedTo: assignments[item.idx] || [],
      })),
      splits,
      total: grandTotal,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800">Itemized Split</h3>
          <p className="text-xs text-gray-500">Assign each item to the people who shared it</p>
        </div>
        <div className="text-right text-xs">
          <p className="text-gray-500">{assignedTotal.toFixed(0)} / {grandTotal.toFixed(0)} assigned</p>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${grandTotal > 0 ? (assignedTotal / grandTotal) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {allItems.map((item) => {
          const assigned = assignments[item.idx] || [];
          const perPerson = assigned.length > 0 ? item.price / assigned.length : 0;

          return (
            <div key={item.idx} className="bg-white rounded-xl border p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                    {customItems.some((c) => c.idx === item.idx) && (
                      <button
                        onClick={() => removeCustomItem(item.idx)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(item.price, "INR")}
                    {assigned.length > 0 && ` · ${formatCurrency(perPerson, "INR")} each`}
                  </p>
                </div>
                <button
                  onClick={() => splitEvenly(item.idx)}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                >
                  Split all
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {members.map((member) => {
                  const isAssigned = assigned.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(item.idx, member.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        isAssigned
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        isAssigned ? "bg-green-500 text-white" : "bg-gray-300 text-white"
                      }`}>
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                      {member.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd ? (
        <form onSubmit={addCustomItem} className="bg-white rounded-xl border p-3 flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Item name"
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            required
          />
          <div className="relative w-24">
            <span className="absolute left-2 top-2 text-gray-400 text-xs">₹</span>
            <input
              type="number"
              step="0.01"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              className="w-full pl-7 pr-2 py-2 border rounded-lg text-sm text-right focus:ring-2 focus:ring-green-500 outline-none"
              required
            />
          </div>
          <button type="submit" className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
            Add
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-green-300 hover:text-green-600 transition-colors"
        >
          + Add custom item
        </button>
      )}

      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="text-sm font-bold text-gray-800 mb-3">Per Person Totals</h4>
        <div className="space-y-2">
          {members.map((member) => {
            const total = memberTotals[member.id] || 0;
            return (
              <div key={member.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-[9px] font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700">{member.name}</span>
                </div>
                <span className={`text-sm font-bold ${total > 0 ? "text-red-600" : "text-gray-400"}`}>
                  {formatCurrency(total, "INR")}
                </span>
              </div>
            );
          })}
        </div>

        <div className="border-t mt-3 pt-3 flex justify-between text-sm font-bold">
          <span>Unassigned</span>
          <span className="text-orange-500">{formatCurrency(grandTotal - assignedTotal, "INR")}</span>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={assignedTotal < 0.01}
        className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Confirm Itemized Split
      </button>
    </div>
  );
}
