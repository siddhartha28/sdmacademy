"use client";

import { useState, useEffect } from "react";
import { Users, UserCheck, DollarSign, BarChart3, Bell, TrendingUp, BookOpen, CalendarCheck } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Overview {
  totalStudents: number;
  totalTeachers: number;
  totalNotices: number;
  feeCollectedThisMonth: number;
  todayAttendancePercent: number | null;
  todayPresent: number;
  todayTotal: number;
  studentsByClass: { name: string; count: number }[];
}

interface TrendPoint {
  date: string;
  percent: number;
  total: number;
  present: number;
}

const BLUE = "#4169e1";
const RED = "#ef4444";
const GREEN = "#10b981";

export default function PrincipalDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports?type=overview").then((r) => r.json()),
      fetch("/api/reports?type=attendance-trend&days=30").then((r) => r.json()),
    ]).then(([ov, tr]) => {
      setOverview(ov);
      setTrend(tr.trend || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avgAttendance = trend.length
    ? Math.round(trend.reduce((s, t) => s + t.percent, 0) / trend.length)
    : 0;

  const pieData = overview?.todayTotal
    ? [
        { name: "Present", value: overview.todayPresent },
        { name: "Absent",  value: overview.todayTotal - overview.todayPresent },
      ]
    : [];

  const recentTrend = trend.slice(-14); // last 14 days for cleaner chart

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Principal Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">School-wide analytics — real-time overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={overview?.totalStudents ?? "—"}
          subtitle="Active enrollment"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Teaching Staff"
          value={overview?.totalTeachers ?? "—"}
          subtitle="Active teachers"
          icon={UserCheck}
          color="info"
        />
        <StatCard
          title="Fee — This Month"
          value={formatCurrency(overview?.feeCollectedThisMonth ?? 0)}
          subtitle="Collected so far"
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Avg Attendance"
          value={trend.length ? `${avgAttendance}%` : "—"}
          subtitle="Last 30 days"
          icon={TrendingUp}
          color={avgAttendance >= 80 ? "success" : avgAttendance >= 60 ? "warning" : "danger"}
        />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Today's Attendance</span>
            <CalendarCheck size={16} className="text-primary-500" />
          </div>
          {overview?.todayTotal ? (
            <>
              <div className="text-2xl font-bold text-gray-900">{overview.todayAttendancePercent}%</div>
              <div className="text-xs text-gray-500 mt-1">
                {overview.todayPresent} present of {overview.todayTotal} students
              </div>
              <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-primary-500 h-1.5 rounded-full"
                  style={{ width: `${overview.todayAttendancePercent}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400 mt-1">Not submitted yet today</div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Notices</span>
            <Bell size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{overview?.totalNotices ?? "—"}</div>
          <div className="text-xs text-gray-500 mt-1">Published notices</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Attendance Trend (14 days)</span>
            <BarChart3 size={16} className="text-primary-500" />
          </div>
          {recentTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={recentTrend}>
                <Line type="monotone" dataKey="percent" stroke={BLUE} strokeWidth={2} dot={false} />
                <Tooltip formatter={(v) => [`${v}%`, "Attendance"]} labelFormatter={(l) => l} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[60px] flex items-center text-sm text-gray-400">No data yet</div>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attendance Trend 30 days */}
        <Card className="lg:col-span-2">
          <CardHeader title="Attendance Trend — Last 30 Days" />
          <CardBody>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Attendance"]}
                    labelFormatter={(l) => `Date: ${l}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="percent"
                    stroke={BLUE}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Attendance %"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center text-gray-400 gap-2">
                <BarChart3 size={32} className="opacity-30" />
                <span className="text-sm">No attendance data yet</span>
                <span className="text-xs">Data appears once teachers submit attendance</span>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Today Pie */}
        <Card>
          <CardHeader title="Today — Present vs Absent" />
          <CardBody>
            {pieData.length > 0 && overview!.todayTotal > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    labelLine={false}
                  >
                    <Cell fill={BLUE} />
                    <Cell fill={RED} />
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center text-gray-400 gap-2">
                <CalendarCheck size={32} className="opacity-30" />
                <span className="text-sm">No attendance today</span>
                <span className="text-xs">Check back after 9 AM</span>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Class distribution */}
      {overview?.studentsByClass && overview.studentsByClass.length > 0 && (
        <Card>
          <CardHeader title="Students by Class" />
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={overview.studentsByClass} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, "Students"]} />
                <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "All Students",    href: "/dashboard/admin/students",  icon: Users,        bg: "bg-primary-50   text-primary-700   border-primary-100"  },
            { label: "Fee Management",  href: "/dashboard/admin/fees",       icon: DollarSign,   bg: "bg-emerald-50   text-emerald-700   border-emerald-100"  },
            { label: "Marks & Results", href: "/dashboard/admin/marks",      icon: BookOpen,     bg: "bg-purple-50    text-purple-700    border-purple-100"   },
            { label: "Manage Notices",  href: "/dashboard/admin/notices",    icon: Bell,         bg: "bg-amber-50     text-amber-700     border-amber-100"    },
          ].map(({ label, href, icon: Icon, bg }) => (
            <a
              key={href}
              href={href}
              className={`border rounded-xl p-4 flex flex-col items-center gap-2 font-semibold text-sm text-center transition-all hover:shadow-md ${bg}`}
            >
              <Icon size={20} />
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
