import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};

const TYPE_COLORS = {
  bug: 'bg-red-100 text-red-700',
  suggestion: 'bg-purple-100 text-purple-700',
  general: 'bg-gray-100 text-gray-600',
};

export default function Feedback() {
  const [items, setItems] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeedback() {
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchFeedback();
  }, []);

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'feedback', id), { status });
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
  };

  const addReply = async (id, reply) => {
    await updateDoc(doc(db, 'feedback', id), { adminReply: reply, status: 'resolved' });
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, adminReply: reply, status: 'resolved' } : f)));
  };

  const filtered = items.filter(
    (f) =>
      (filterStatus === 'all' || f.status === filterStatus) &&
      (filterType === 'all' || f.type === filterType)
  );

  if (loading) {
    return <div className="p-8 text-gray-500">Loading feedback...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Feedback ({filtered.length})</h1>

      <div className="flex gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        >
          <option value="all">All Types</option>
          <option value="bug">Bug</option>
          <option value="suggestion">Suggestion</option>
          <option value="general">General</option>
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || ''}`}>
                  {item.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[item.type] || ''}`}>
                  {item.type}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {item.createdAt?.toDate?.().toLocaleString() || 'N/A'}
              </span>
            </div>
            <p className="text-gray-900 mb-2">{item.message}</p>
            <p className="text-xs text-gray-500 mb-3">By: {item.userName || item.userId}</p>

            {item.adminReply && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                <p className="text-xs font-medium text-green-700 mb-1">Admin Reply:</p>
                <p className="text-sm text-green-800">{item.adminReply}</p>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              {item.status !== 'in-progress' && (
                <button
                  onClick={() => updateStatus(item.id, 'in-progress')}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  Mark In Progress
                </button>
              )}
              {item.status !== 'resolved' && (
                <button
                  onClick={() => {
                    const reply = prompt('Admin reply (optional):');
                    if (reply !== null) addReply(item.id, reply);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  Resolve
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-8">No feedback found.</div>
        )}
      </div>
    </div>
  );
}
