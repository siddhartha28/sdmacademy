"use client";

import { useState, useEffect } from "react";
import { Users, UserCheck, DollarSign, BarChart3, TrendingUp } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface Overview {
  totalStudents: number;
  totalTeachers: number;
  feeCollectedThisMonth: number;
  todayAttendancePercent: number | null;
}

interface TrendPoint {
  date: string;
  percent: number;
  total: number;
  present: number;
}

const COLORS = ["#4169e1", "#ef4444", "#f59e0b"];

export default function PrincipalDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports?type=overview").then(r => r.json()),
      fetch("/api/reports?type=attendance-trend&days=30").then(r => r.json()),
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

  const presentCount = trend.length > 0 ? trend[trend.length - 1]?.present : 0;
  const absentCount = trend.length > 0 ? (trend[trend.length - 1]?.total || 0) - presentCount : 0;

  const pieData = [
    { name: "Present", value: presentCount },
    { name: "Absent", value: absentCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Principal Dashboard</h1>
        <p className="text-sm text-gray-500">School-wide analytics and overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={overview?.totalStudents ?? "—"}
          subtitle="Active enrollment"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Total Staff"
          value={overview?.totalTeachers ?? "—"}
          subtitle="Active staff members"
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
          title="Today's Attendance"
          value={overview?.todayAttendancePercent != null ? `${overview.todayAttendancePercent}%` : "—"}
          subtitle="School-wide present"
          icon={BarChart3}
          color={
            overview?.todayAttendancePercent != null
              ? overview.todayAttendancePercent >= 80
                ? "success"
                : "warning"
              : "primary"
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attendance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader title="Attendance Trend — Last 30 Days" />
          <CardBody>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip formatter={(v) => [`${v}%`, "Attendance"]} />
                  <Line
                    type="monotone"
                    dataKey="percent"
                    stroke="#4169e1"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Attendance %"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                No attendance data for this period
              </div>
            )}
          </CardBody>
        </Card>

        {/* Pie */}
        <Card>
          <CardHeader title="Today — Present vs Absent" />
          <CardBody>
            {presentCount + absentCount > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name ?? ""}: ${value ?? ""}`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={index === 0 ? "#4169e1" : "#ef4444"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                No attendance submitted today
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "View All Students", href: "/dashboard/admin/students", color: "bg-primary-50 text-primary-700 border-primary-100" },
          { label: "Fee Management", href: "/dashboard/admin/fees", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { label: "Marks & Reports", href: "/dashboard/admin/marks", color: "bg-purple-50 text-purple-700 border-purple-100" },
          { label: "Manage Notices", href: "/dashboard/admin/notices", color: "bg-amber-50 text-amber-700 border-amber-100" },
        ].map(link => (
          <a key={link.href} href={link.href}
            className={`border rounded-xl p-4 font-semibold text-sm text-center transition-all hover:shadow-md ${link.color}`}>
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
