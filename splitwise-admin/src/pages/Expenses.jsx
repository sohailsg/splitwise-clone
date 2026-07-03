import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExpenses() {
      const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchExpenses();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await deleteDoc(doc(db, 'expenses', id));
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const filtered = expenses.filter(
    (e) =>
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.createdByName?.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading expenses...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses ({filtered.length})</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total.toFixed(2)}</p>
        </div>
        <input
          type="text"
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none w-80"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Group</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Created By</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((expense) => (
              <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{expense.description}</td>
                <td className="py-3 px-4">{expense.currency || 'USD'} {expense.amount?.toFixed(2)}</td>
                <td className="py-3 px-4 text-gray-500">{expense.groupId?.slice(0, 8)}...</td>
                <td className="py-3 px-4 text-gray-500">{expense.createdByName || expense.createdBy}</td>
                <td className="py-3 px-4 text-gray-500">
                  {expense.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">No expenses found.</div>
        )}
      </div>
    </div>
  );
}
