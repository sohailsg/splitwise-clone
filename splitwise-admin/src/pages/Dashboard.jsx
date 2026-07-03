import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, groups: 0, expenses: 0, settlements: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [usersSnap, groupsSnap, expensesSnap, settlementsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'groups')),
        getDocs(collection(db, 'expenses')),
        getDocs(collection(db, 'settlements')),
      ]);

      setStats({
        users: usersSnap.size,
        groups: groupsSnap.size,
        expenses: expensesSnap.size,
        settlements: settlementsSnap.size,
      });

      const recentQuery = query(
        collection(db, 'expenses'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const recentSnap = await getDocs(recentQuery);
      setRecentActivity(recentSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.users, color: 'bg-blue-500' },
    { label: 'Total Groups', value: stats.groups, color: 'bg-purple-500' },
    { label: 'Total Expenses', value: stats.expenses, color: 'bg-orange-500' },
    { label: 'Total Settlements', value: stats.settlements, color: 'bg-green-500' },
  ];

  if (loading) {
    return <div className="p-8 text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-xl font-bold">{card.value}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h2>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500">No expenses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Created By</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">{expense.description}</td>
                    <td className="py-3 px-4 font-medium">{expense.currency || 'USD'} {expense.amount?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-500">{expense.createdByName || expense.createdBy}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {expense.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
