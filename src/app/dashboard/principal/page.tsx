"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, UserCheck, ClipboardList, DollarSign, CheckSquare,
  Calendar, AlertCircle, TrendingUp, BookMarked, MessageSquare,
  ArrowRight, GraduationCap, BarChart3, ShieldCheck,
  CheckCircle2, Clock, Bell,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";

interface OverviewData {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalSections: number;
    sectionsMarkedToday: number;
    attendancePct: number;
    presentToday: number;
    absentToday: number;
    pendingLeaves: number;
    pendingLessonPlans: number;
    feeThisMonth: number;
    lastMonthFee: number;
  };
  trend: { date: string; pct: number; present: number; total: number }[];
  classCounts: { id: string; name: string; students: number }[];
  unmarkedSections: { id: string; name: string; class: { name: string } }[];
  upcomingEvents: { id: string; title: string; date: string }[];
  recentLeaves: { id: string; teacher: { name: string }; fromDate: string; toDate: string; leaveType: string }[];
  recentAnnouncements: { id: string; title: string; author: { name: string }; createdAt: string; class: { name: string } | null }[];
}

const STAT_CARDS = [
  { key: "totalStudents", label: "Total Students", icon: GraduationCap, color: "bg-blue-500", href: "/dashboard/principal/students" },
  { key: "totalTeachers", label: "Teaching Staff", icon: UserCheck, color: "bg-violet-500", href: "/dashboard/principal/teachers" },
  { key: "attendancePct", label: "Today's Attendance", icon: ClipboardList, color: "bg-green-500", href: "/dashboard/principal/attendance", suffix: "%" },
  { key: "feeThisMonth", label: "Fee This Month", icon: DollarSign, color: "bg-amber-500", href: "/dashboard/principal/fees", prefix: "₹" },
];

function fmt(n: number, prefix?: string, suffix?: string) {
  if (prefix === "₹") return `₹${n >= 1000 ? (n / 1000).toFixed(0) + "k" : n}`;
  return `${prefix ?? ""}${n}${suffix ?? ""}`;
}

export default function PrincipalDashboard() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/principal/overview")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="animate-pulse text-gray-400">Loading dashboard…</div>
      </div>
    );
  }

  const { stats, trend, classCounts, unmarkedSections, upcomingEvents, recentLeaves, recentAnnouncements } = data!;
  const totalPending = stats.pendingLeaves + (unmarkedSections.length > 0 ? 1 : 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-2xl p-5 mb-6 text-white shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-primary-200 text-sm">{today}</p>
            <h1 className="text-xl sm:text-2xl font-bold mt-1">Principal&apos;s Dashboard</h1>
            <p className="text-primary-200 text-sm mt-1">S.D.M. Academy Shaulana — Academic Year 2025-26</p>
          </div>
          <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 text-sm">
            <ShieldCheck className="w-4 h-4" />
            Principal
          </div>
        </div>

        {/* Quick stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {STAT_CARDS.map(({ key, label, icon: Icon, color, href, suffix, prefix }) => {
            const val = stats[key as keyof typeof stats] as number;
            return (
              <Link key={key} href={href} className="bg-white/10 hover:bg-white/20 rounded-xl p-3 transition-all group">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-primary-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xl font-bold text-white">{fmt(val, prefix, suffix)}</p>
                <p className="text-primary-200 text-xs">{label}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Alert Banners */}
      {unmarkedSections.length > 0 && (
        <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <div>
            <span className="font-semibold">Attendance not marked</span> for {unmarkedSections.length} section{unmarkedSections.length !== 1 ? "s" : ""} today:{" "}
            {unmarkedSections.map((s) => `${s.class.name}-${s.name}`).join(", ")}
          </div>
          <Link href="/dashboard/principal/attendance" className="ml-auto font-semibold text-red-700 hover:underline whitespace-nowrap">
            View →
          </Link>
        </div>
      )}

      {stats.pendingLeaves > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-500" />
          <span><span className="font-semibold">{stats.pendingLeaves} teacher leave{stats.pendingLeaves !== 1 ? "s" : ""}</span> pending approval</span>
          <Link href="/dashboard/principal/approvals" className="ml-auto font-semibold text-amber-700 hover:underline whitespace-nowrap">
            Review →
          </Link>
        </div>
      )}

      {stats.attendancePct > 0 && stats.attendancePct < 80 && (
        <div className="mb-4 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-orange-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-orange-500" />
          <span>School-wide attendance is <span className="font-semibold">{stats.attendancePct}%</span> today — below 80% threshold</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">14-Day Attendance Trend</h2>
            <Link href="/dashboard/principal/attendance" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Full view <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {trend.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No attendance data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v: unknown) => [String(v), ""]} labelFormatter={(l) => `Date: ${l}`} />
                <Area type="monotone" dataKey="pct" stroke="#2563eb" fill="url(#attGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Pending Approvals</h2>
            <Link href="/dashboard/principal/approvals" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <CheckCircle2 className="w-8 h-8 mb-2 text-green-400" />
              <p className="text-sm">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLeaves.map((leave) => (
                <div key={leave.id} className="flex items-center gap-3 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs flex-shrink-0">
                    {leave.teacher.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{leave.teacher.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(leave.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {leave.leaveType}
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Approval summary */}
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-amber-50 rounded-lg">
              <p className="text-lg font-bold text-amber-700">{stats.pendingLeaves}</p>
              <p className="text-xs text-amber-600">Leave Requests</p>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-700">{stats.pendingLessonPlans}</p>
              <p className="text-xs text-blue-600">Lesson Plans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Students by Class */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Students by Class</h2>
            <Link href="/dashboard/principal/students" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {classCounts.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={classCounts} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="students" fill="#2563eb" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Today Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Today&apos;s Summary</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Students Present</span>
              </div>
              <span className="font-bold text-green-700 text-lg">{stats.presentToday}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-400 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Students Absent</span>
              </div>
              <span className="font-bold text-red-600 text-lg">{stats.absentToday}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Sections Marked</span>
              </div>
              <span className="font-bold text-blue-700 text-lg">
                {stats.sectionsMarkedToday}/{stats.totalSections}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Upcoming Events</h2>
            <Link href="/dashboard/principal/events" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Calendar className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-primary-50 border border-primary-100">
                  <div className="w-9 h-9 bg-primary-600 text-white rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0">
                    <span className="text-[9px] font-bold leading-none">
                      {new Date(ev.date).toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}
                    </span>
                    <span className="text-sm font-bold leading-none">
                      {new Date(ev.date).getDate()}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-700 truncate">{ev.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Recent Announcements</h2>
          <Link href="/dashboard/principal/communication" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentAnnouncements.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">No announcements yet</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAnnouncements.map((ann) => (
              <div key={ann.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ann.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ann.author.name} · {ann.class?.name ?? "School-wide"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links Grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/dashboard/principal/approvals", icon: CheckSquare, label: "Approvals", color: "text-amber-600 bg-amber-50", count: totalPending },
            { href: "/dashboard/principal/attendance", icon: ClipboardList, label: "Attendance", color: "text-blue-600 bg-blue-50" },
            { href: "/dashboard/principal/academics", icon: BookMarked, label: "Academics", color: "text-green-600 bg-green-50" },
            { href: "/dashboard/principal/results", icon: BarChart3, label: "Results", color: "text-violet-600 bg-violet-50" },
            { href: "/dashboard/principal/fees", icon: DollarSign, label: "Fees", color: "text-teal-600 bg-teal-50" },
            { href: "/dashboard/principal/reports", icon: TrendingUp, label: "Reports", color: "text-pink-600 bg-pink-50" },
          ].map(({ href, icon: Icon, label, color, count }) => (
            <Link key={href} href={href} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${color} border-current border-opacity-20`}>
              <div className="relative">
                <Icon className="w-6 h-6" />
                {count !== undefined && count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">{count}</span>
                )}
              </div>
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

