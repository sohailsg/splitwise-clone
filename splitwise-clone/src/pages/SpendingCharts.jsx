import { useState, useEffect, useMemo } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import { CATEGORIES, getCategoryIcon } from "../utils/paymentLinks";
import { formatCurrency } from "../utils/currency";

const COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#78716c",
];

export default function SpendingCharts() {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const groupsSnap = await getDocs(
          query(collection(db, "groups"), where("memberUids", "array-contains", currentUser.uid))
        );
        const groupsList = groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (cancelled) return;
        setGroups(groupsList);

        const groupIds = groupsList.map((g) => g.id);
        const snaps = await Promise.all(
          groupIds.map((gid) =>
            getDocs(query(collection(db, "expenses"), where("groupId", "==", gid)))
          )
        );
        if (cancelled) return;
        const all = snaps.flatMap((s) => s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setExpenses(all);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [currentUser.uid]);

  const filtered = useMemo(() => {
    let list = expenses;
    if (selectedGroup) list = list.filter((e) => e.groupId === selectedGroup);
    if (timeRange !== "all") {
      const now = new Date();
      const ranges = { week: 7, month: 30, quarter: 90, year: 365 };
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - (ranges[timeRange] || 365));
      list = list.filter((e) => new Date(e.date) >= cutoff);
    }
    return list;
  }, [expenses, selectedGroup, timeRange]);

  const categoryData = useMemo(() => {
    const cats = {};
    filtered.forEach((e) => {
      const cat = e.category || "other";
      cats[cat] = (cats[cat] || 0) + e.amount;
    });
    return Object.entries(cats)
      .map(([id, amount], i) => ({
        id,
        amount,
        color: COLORS[i % COLORS.length],
        label: CATEGORIES.find((c) => c.id === id)?.label || id,
        icon: getCategoryIcon(id),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const monthlyData = useMemo(() => {
    const months = {};
    filtered.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = (months[key] || 0) + e.amount;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, amount]) => ({
        label: new Date(key + "-01").toLocaleDateString("en-IN", { month: "short" }),
        amount,
      }));
  }, [filtered]);

  const payerData = useMemo(() => {
    const payers = {};
    filtered.forEach((e) => {
      payers[e.payerId] = (payers[e.payerId] || 0) + e.amount;
    });
    return Object.entries(payers)
      .map(([uid, amount], i) => ({ uid, amount, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const totalSpent = filtered.reduce((s, e) => s + e.amount, 0);
  const maxMonthly = Math.max(...monthlyData.map((m) => m.amount), 1);
  const maxCategory = Math.max(...categoryData.map((c) => c.amount), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Spending Trends</h1>
        <p className="text-sm text-gray-500 mb-6">Visual breakdown of your expenses</p>

        <div className="flex gap-2 mb-6">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
          >
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
          >
            <option value="all">All time</option>
            <option value="week">Last week</option>
            <option value="month">Last month</option>
            <option value="quarter">Last 3 months</option>
            <option value="year">Last year</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading charts...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-4xl mb-2">📊</p>
            <p className="text-gray-500">No expenses to chart yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500">Total Spent</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(totalSpent, "INR")}</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500">Expenses</p>
                <p className="text-xl font-bold text-gray-800">{filtered.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500">Avg per expense</p>
                <p className="text-xl font-bold text-gray-800">
                  {formatCurrency(totalSpent / filtered.length, "INR")}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
              <h3 className="font-bold text-gray-800 mb-4">Monthly Trend</h3>
              <div className="flex items-end gap-2 h-40">
                {monthlyData.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500">{formatCurrency(m.amount, "INR")}</span>
                    <div
                      className="w-full bg-green-400 rounded-t-lg transition-all hover:bg-green-500"
                      style={{ height: `${(m.amount / maxMonthly) * 100}%`, minHeight: "4px" }}
                    />
                    <span className="text-[10px] text-gray-400">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
              <h3 className="font-bold text-gray-800 mb-4">By Category</h3>
              <div className="space-y-3">
                {categoryData.map((cat) => (
                  <div key={cat.id}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <span className="text-sm text-gray-700">{cat.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-800">{formatCurrency(cat.amount, "INR")}</span>
                        <span className="text-xs text-gray-400 ml-1">
                          ({((cat.amount / totalSpent) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(cat.amount / maxCategory) * 100}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
              <h3 className="font-bold text-gray-800 mb-4">Spending by Person</h3>
              <div className="space-y-3">
                {payerData.map((payer) => {
                  const maxPayer = payerData[0]?.amount || 1;
                  return (
                    <div key={payer.uid}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                            style={{ backgroundColor: payer.color }}
                          >
                            {payer.uid.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-700">User</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">{formatCurrency(payer.amount, "INR")}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(payer.amount / maxPayer) * 100}%`,
                            backgroundColor: payer.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4">Donut Chart — Category Breakdown</h3>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    {(() => {
                      let cumPercent = 0;
                      return categoryData.map((cat, i) => {
                        const percent = (cat.amount / totalSpent) * 100;
                        const radius = 70;
                        const circumference = 2 * Math.PI * radius;
                        const dashLen = (percent / 100) * circumference;
                        const dashOff = -(cumPercent / 100) * circumference;
                        cumPercent += percent;
                        return (
                          <circle
                            key={i}
                            cx="90"
                            cy="90"
                            r={radius}
                            fill="none"
                            stroke={cat.color}
                            strokeWidth="20"
                            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                            strokeDashoffset={dashOff}
                            transform="rotate(-90 90 90)"
                          />
                        );
                      });
                    })()}
                    <text x="90" y="85" textAnchor="middle" className="text-lg font-bold fill-gray-800">
                      {formatCurrency(totalSpent, "INR")}
                    </text>
                    <text x="90" y="102" textAnchor="middle" className="text-xs fill-gray-400">
                      total
                    </text>
                  </svg>
                </div>
                <div className="ml-6 space-y-1.5">
                  {categoryData.slice(0, 6).map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs text-gray-600">{cat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
