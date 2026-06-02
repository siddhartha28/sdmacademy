"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, GraduationCap, BookOpen, AlertCircle,
  Calendar, UserPlus, ArrowRight, School,
} from "lucide-react";

interface Overview {
  totalStudents: number;
  totalTeachers: number;
  openComplaints: number;
  booksAvailable: number;
  totalBooks: number;
  markedSections: number;
  upcomingEvents: { id: string; title: string; date: string }[];
  recentAdmissions: { id: string; name: string; admissionNo: string; createdAt: string; section?: { name: string; class?: { name: string } } }[];
}

const quickLinks = [
  { href: "/dashboard/admin/students", icon: Users, label: "Students", color: "bg-blue-100 text-blue-700" },
  { href: "/dashboard/admin/teachers", icon: GraduationCap, label: "Teachers", color: "bg-purple-100 text-purple-700" },
  { href: "/dashboard/admin/assignments", icon: School, label: "Assignments", color: "bg-indigo-100 text-indigo-700" },
  { href: "/dashboard/admin/classes", icon: BookOpen, label: "Classes", color: "bg-green-100 text-green-700" },
  { href: "/dashboard/admin/library", icon: BookOpen, label: "Library", color: "bg-amber-100 text-amber-700" },
  { href: "/dashboard/admin/complaints", icon: AlertCircle, label: "Complaints", color: "bg-red-100 text-red-700" },
  { href: "/dashboard/admin/notices", icon: Calendar, label: "Notices", color: "bg-teal-100 text-teal-700" },
  { href: "/dashboard/admin/users", icon: UserPlus, label: "User Accounts", color: "bg-gray-100 text-gray-700" },
];

export default function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/admin/overview").then(r => r.json()).then(setData).catch(() => null);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">School operations overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: data?.totalStudents ?? "—", icon: Users, color: "bg-blue-50 border-blue-200 text-blue-700" },
          { label: "Teachers", value: data?.totalTeachers ?? "—", icon: GraduationCap, color: "bg-purple-50 border-purple-200 text-purple-700" },
          { label: "Open Complaints", value: data?.openComplaints ?? "—", icon: AlertCircle, color: "bg-red-50 border-red-200 text-red-700" },
          { label: "Library Books", value: data ? `${data.booksAvailable} / ${data.totalBooks}` : "—", icon: BookOpen, color: "bg-amber-50 border-amber-200 text-amber-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 flex items-center gap-3 ${s.color}`}>
            <s.icon className="w-8 h-8 shrink-0" />
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs font-medium opacity-80">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map(l => (
              <Link key={l.href} href={l.href} className={`${l.color} rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:opacity-90 transition font-medium text-sm`}>
                <l.icon className="w-6 h-6" />
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming Events</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {data?.upcomingEvents.length === 0 && (
              <p className="text-sm text-gray-400 p-4 text-center">No upcoming events</p>
            )}
            {data?.upcomingEvents.map(ev => (
              <div key={ev.id} className="p-3">
                <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                <p className="text-xs text-gray-400">{new Date(ev.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
              </div>
            ))}
            {!data && <div className="p-4 text-sm text-gray-400 text-center">Loading…</div>}
          </div>
          <Link href="/dashboard/admin/notices" className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:underline">
            View all notices <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Recent Admissions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Admissions</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Adm. No.", "Class", "Date"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.recentAdmissions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.admissionNo}</td>
                  <td className="px-4 py-3 text-gray-600">{s.section?.class?.name} {s.section?.name}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(s.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
              {!data && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Loading…</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Link href="/dashboard/admin/students" className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:underline">
          View all students <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
