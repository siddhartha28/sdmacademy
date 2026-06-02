"use client";

import { useState, useEffect } from "react";
import { ClipboardList, AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

interface SectionAtt {
  sectionId: string;
  sectionName: string;
  className: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  pct: number;
  marked: boolean;
}
interface TrendPoint { date: string; pct: number; present: number; total: number; }

export default function PrincipalAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<SectionAtt[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/attendance?date=${date}&detail=1`).then((r) => r.json()),
      fetch("/api/principal/overview").then((r) => r.json()),
    ]).then(([attData, overview]) => {
      setTrend(overview.trend ?? []);

      // Build per-section summary
      const raw = attData.sections ?? attData.attendance ?? [];
      setSections(raw);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [date]);

  const marked = sections.filter((s) => s.marked);
  const unmarked = sections.filter((s) => !s.marked);
  const lowAtt = sections.filter((s) => s.marked && s.pct < 80);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Overview</h1>
          <p className="text-gray-400 text-sm mt-0.5">School-wide attendance monitoring</p>
        </div>
        <input type="date" value={date} max={new Date().toISOString().split("T")[0]}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      {/* Alerts */}
      {unmarked.length > 0 && (
        <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <div>
            <span className="font-semibold">Attendance not marked:</span>{" "}
            {unmarked.map((s) => `${s.className}-${s.sectionName}`).join(", ")}
          </div>
        </div>
      )}
      {lowAtt.length > 0 && (
        <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm">
          <TrendingDown className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
          <div>
            <span className="font-semibold">Low attendance (&lt;80%):</span>{" "}
            {lowAtt.map((s) => `${s.className}-${s.sectionName} (${s.pct}%)`).join(", ")}
          </div>
        </div>
      )}

      {/* Trend Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">14-Day Attendance Trend</h2>
        {trend.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No trend data</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="attGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v: unknown) => [String(v), ""]} />
              <Area type="monotone" dataKey="pct" stroke="#2563eb" fill="url(#attGrad2)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Class-wise Bar Chart */}
      {sections.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Section-wise Attendance — {date}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sections.filter((s) => s.marked)} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="className" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v: unknown) => [String(v), ""]} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {sections.filter((s) => s.marked).map((s) => (
                  <Cell key={s.sectionId} fill={s.pct >= 90 ? "#22c55e" : s.pct >= 75 ? "#f59e0b" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Section Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Section Details</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>≥90%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>75-90%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>&lt;75%</span>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : sections.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
            No attendance data for this date
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Class</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Present</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Absent</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Total</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">%</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sections.map((s) => (
                <tr key={s.sectionId} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{s.className}{s.sectionName !== "A" ? `-${s.sectionName}` : ""}</td>
                  <td className="px-3 py-3 text-center text-green-600 font-semibold">{s.marked ? s.present : "—"}</td>
                  <td className="px-3 py-3 text-center text-red-500 font-semibold">{s.marked ? s.absent : "—"}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{s.marked ? s.total : "—"}</td>
                  <td className="px-3 py-3 text-center">
                    {s.marked ? (
                      <span className={`font-bold ${s.pct >= 90 ? "text-green-600" : s.pct >= 75 ? "text-amber-600" : "text-red-600"}`}>
                        {s.pct}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {s.marked ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Marked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> Not marked
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

