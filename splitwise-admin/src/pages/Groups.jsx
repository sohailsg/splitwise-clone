import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGroups() {
      const snap = await getDocs(collection(db, 'groups'));
      setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchGroups();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Dissolve this group?')) return;
    await deleteDoc(doc(db, 'groups', id));
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading groups...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Groups ({groups.length})</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Members</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Created By</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Created</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{group.name}</td>
                <td className="py-3 px-4 text-gray-500">{group.memberUids?.length || 0}</td>
                <td className="py-3 px-4 text-gray-500">{group.createdBy}</td>
                <td className="py-3 px-4 text-gray-500">
                  {group.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    Dissolve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {groups.length === 0 && (
          <div className="p-8 text-center text-gray-500">No groups yet.</div>
        )}
      </div>
    </div>
  );
}
