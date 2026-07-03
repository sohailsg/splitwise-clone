import { useState } from 'react';

export default function Settings() {
  const [announcement, setAnnouncement] = useState('');
  const [sent, setSent] = useState(false);

  const handleAnnouncement = () => {
    if (!announcement.trim()) return;
    alert(`Announcement sent: "${announcement}"\n\n(In production, this would save to Firestore and notify users.)`);
    setAnnouncement('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">App Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">App Name</span>
              <span className="font-medium">Splitwise Clone</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Firebase Project</span>
              <span className="font-medium">splitwise-copy-e6567</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Platform</span>
              <span className="font-medium">PWA (React + Vite)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Announcement</h2>
          <textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            rows={4}
            placeholder="Type an announcement for all users..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleAnnouncement}
              disabled={!announcement.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Send Announcement
            </button>
            {sent && <span className="text-sm text-green-600">Sent!</span>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Currency Rates</h2>
          <p className="text-sm text-gray-500 mb-4">
            Currency rates are static in the main app. Update them in the codebase at{' '}
            <code className="bg-gray-100 px-1 rounded">src/utils/currency.js</code>.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'MXN'].map((cur) => (
              <div key={cur} className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{cur}</span>
                <span className="text-gray-500">Static rate</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
