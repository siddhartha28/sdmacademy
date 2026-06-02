"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IndianRupee, TrendingUp, ShoppingCart, Clock, ArrowRight, BadgePercent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Overview {
  totalFeeThisMonth: number;
  totalFeeToday: number;
  totalExpensesThisMonth: number;
  pendingWaivers: number;
  pendingSalaries: number;
  overdueIssues: number;
  recentPayments: { id: string; amount: number; paymentDate: string; student: { name: string; admissionNo: string } }[];
  recentExpenses: { id: string; title: string; amount: number; date: string; category: string }[];
  monthlyTrend: { month: string; amount: number }[];
}

const quickLinks = [
  { href: "/dashboard/accounts/fees", label: "Fee Collection", icon: IndianRupee, color: "bg-blue-50 text-blue-700" },
  { href: "/dashboard/accounts/expenses", label: "Expenses", icon: ShoppingCart, color: "bg-orange-50 text-orange-700" },
  { href: "/dashboard/accounts/payroll", label: "Payroll", icon: TrendingUp, color: "bg-green-50 text-green-700" },
  { href: "/dashboard/accounts/waivers", label: "Fee Waivers", icon: BadgePercent, color: "bg-purple-50 text-purple-700" },
  { href: "/dashboard/accounts/reports", label: "Reports", icon: Clock, color: "bg-gray-50 text-gray-700" },
];

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function AccountsDashboard() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/accounts/overview").then(r => r.json()).then(setData).catch(() => null);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounts Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Financial overview for SDM Academy</p>
      </div>

      {/* Alert */}
      {data && data.pendingWaivers > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BadgePercent className="w-4 h-4" />
            {data.pendingWaivers} fee waiver request(s) pending principal approval
          </span>
          <Link href="/dashboard/accounts/waivers" className="underline text-xs font-medium">View</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Fees Today", value: data ? fmt(data.totalFeeToday) : "—", icon: IndianRupee, color: "bg-green-50 border-green-200 text-green-700" },
          { label: "Fees This Month", value: data ? fmt(data.totalFeeThisMonth) : "—", icon: TrendingUp, color: "bg-blue-50 border-blue-200 text-blue-700" },
          { label: "Expenses This Month", value: data ? fmt(data.totalExpensesThisMonth) : "—", icon: ShoppingCart, color: "bg-orange-50 border-orange-200 text-orange-700" },
          { label: "Salary Dues Pending", value: data ? `${data.pendingSalaries} staff` : "—", icon: Clock, color: "bg-amber-50 border-amber-200 text-amber-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 flex items-center gap-3 ${s.color}`}>
            <s.icon className="w-8 h-8 shrink-0" />
            <div>
              <p className="text-lg font-bold leading-tight">{s.value}</p>
              <p className="text-xs font-medium opacity-80">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Fee Collection (6 months)</h2>
          {data?.monthlyTrend && data.monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.monthlyTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(Number(v) / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => [`₹${Number(v).toLocaleString("en-IN")}`, "Collection"]} />
                <Bar dataKey="amount" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Modules</h2>
          <div className="space-y-2">
            {quickLinks.map(l => (
              <Link key={l.href} href={l.href} className={`${l.color} rounded-xl p-3 flex items-center gap-3 hover:opacity-90 transition text-sm font-medium`}>
                <l.icon className="w-5 h-5" /> {l.label} <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Fee Payments</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {data?.recentPayments.length === 0 && <p className="text-sm text-gray-400 p-4 text-center">No payments yet</p>}
            {data?.recentPayments.map(p => (
              <div key={p.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.student.name}</p>
                  <p className="text-xs text-gray-400">{p.student.admissionNo} · {new Date(p.paymentDate).toLocaleDateString("en-IN")}</p>
                </div>
                <span className="text-sm font-semibold text-green-700">{fmt(p.amount)}</span>
              </div>
            ))}
            {!data && <div className="p-4 text-sm text-gray-400 text-center">Loading…</div>}
          </div>
          <Link href="/dashboard/accounts/fees" className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:underline">View all fee records <ArrowRight className="w-3 h-3" /></Link>
        </div>

        {/* Recent Expenses */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Expenses</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {data?.recentExpenses.length === 0 && <p className="text-sm text-gray-400 p-4 text-center">No expenses recorded</p>}
            {data?.recentExpenses.map(e => (
              <div key={e.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.title}</p>
                  <p className="text-xs text-gray-400 capitalize">{e.category.toLowerCase()} · {new Date(e.date).toLocaleDateString("en-IN")}</p>
                </div>
                <span className="text-sm font-semibold text-red-700">{fmt(e.amount)}</span>
              </div>
            ))}
            {!data && <div className="p-4 text-sm text-gray-400 text-center">Loading…</div>}
          </div>
          <Link href="/dashboard/accounts/expenses" className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:underline">View all expenses <ArrowRight className="w-3 h-3" /></Link>
        </div>
      </div>
    </div>
  );
}
