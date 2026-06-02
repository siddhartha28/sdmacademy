"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FeePayment {
  id: string; amount: number; paymentDate: string; mode: string; receiptNo: string;
  student: { id: string; name: string; section: { class: { name: string } } };
}
interface Student {
  id: string; name: string; section: { class: { name: string } };
}

export default function PrincipalFeesPage() {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetch("/api/fees?limit=500").then((r) => r.json()).then((d) => {
      setPayments(d.payments ?? d.fees ?? []);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 3, 1); // April = new academic year

  const filtered = payments.filter((p) => {
    const d = new Date(p.paymentDate);
    if (period === "month") return d >= startOfMonth;
    if (period === "year") return d >= startOfYear;
    return true;
  });

  const totalCollected = filtered.reduce((sum, p) => sum + p.amount, 0);

  // Monthly breakdown
  const monthlyMap: Record<string, number> = {};
  for (const p of payments) {
    const key = p.paymentDate.slice(0, 7);
    monthlyMap[key] = (monthlyMap[key] ?? 0) + p.amount;
  }
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({ month: month.slice(5) + "/" + month.slice(2, 4), amount }));

  // Class-wise collection
  const classMap: Record<string, number> = {};
  for (const p of filtered) {
    const cn = p.student.section.class.name;
    classMap[cn] = (classMap[cn] ?? 0) + p.amount;
  }
  const classData = Object.entries(classMap).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);

  const modeCounts: Record<string, number> = {};
  for (const p of filtered) modeCounts[p.mode] = (modeCounts[p.mode] ?? 0) + 1;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">School-wide fee collection oversight (read-only)</p>
        </div>
        <div className="flex gap-2">
          {["month", "year", "all"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${period === p ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200"}`}>
              {p === "month" ? "This Month" : p === "year" ? "This Year" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-green-700">₹{(totalCollected / 1000).toFixed(0)}k</p>
          <p className="text-xs text-green-600 mt-0.5">Total Collected</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-blue-700">{filtered.length}</p>
          <p className="text-xs text-blue-600 mt-0.5">Transactions</p>
        </div>
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-primary-700">{new Set(filtered.map((p) => p.student.id)).size}</p>
          <p className="text-xs text-primary-600 mt-0.5">Students Paid</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-amber-700">
            ₹{filtered.length > 0 ? Math.round(totalCollected / filtered.length) : 0}
          </p>
          <p className="text-xs text-amber-600 mt-0.5">Avg per Payment</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Monthly Collection (Last 6 months)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => [String(v), ""]} />
              <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Collection by Class</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={classData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => [String(v), ""]} />
              <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment mode breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Payment Mode Breakdown</h2>
        <div className="flex gap-4 flex-wrap">
          {Object.entries(modeCounts).map(([mode, count]) => (
            <div key={mode} className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <DollarSign className="w-4 h-4 text-primary-600" />
              <span className="font-semibold text-gray-800">{mode}</span>
              <span className="text-sm text-gray-500">{count} payments</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Transactions</h2>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No payments in this period</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Student</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Class</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500">Amount</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Mode</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.slice(0, 50).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{p.student.name}</td>
                    <td className="px-3 py-3 text-gray-500 hidden sm:table-cell">{p.student.section.class.name}</td>
                    <td className="px-3 py-3 text-right text-green-700 font-semibold">₹{p.amount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-center hidden md:table-cell">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p.mode}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-gray-400 text-xs">{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
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

