"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList, BookOpen, Users, FileText,
  BookMarked, MessageSquare, FolderOpen, Calendar,
  CalendarClock, Award, ChevronRight, CheckCircle2,
  AlertCircle, UserCheck,
} from "lucide-react";

interface Assignment {
  id: string;
  isClassTeacher: boolean;
  class: { id: string; name: string };
  subject: { id: string; name: string } | null;
}

interface TeacherInfo {
  teacher: { id: string; name: string };
  assignments: Assignment[];
  classes: { id: string; name: string; isClassTeacher: boolean }[];
  isClassTeacher: boolean;
}

const quickActions = [
  { href: "/dashboard/teacher/attendance", icon: ClipboardList, label: "Take Attendance", color: "bg-blue-50 text-blue-700 border-blue-200", badge: "Daily" },
  { href: "/dashboard/teacher/marks", icon: BookOpen, label: "Enter Marks", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { href: "/dashboard/teacher/homework", icon: FileText, label: "Assign Homework", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { href: "/dashboard/teacher/lesson-plans", icon: BookMarked, label: "Lesson Plans", color: "bg-green-50 text-green-700 border-green-200" },
  { href: "/dashboard/teacher/announcements", icon: MessageSquare, label: "Announcements", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { href: "/dashboard/teacher/remarks", icon: Award, label: "Student Remarks", color: "bg-orange-50 text-orange-700 border-orange-200", classTeacherOnly: true },
  { href: "/dashboard/teacher/documents", icon: FolderOpen, label: "Study Material", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { href: "/dashboard/teacher/ptm", icon: Calendar, label: "PTM Slots", color: "bg-indigo-50 text-indigo-700 border-indigo-200", classTeacherOnly: true },
  { href: "/dashboard/teacher/students", icon: Users, label: "My Students", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { href: "/dashboard/teacher/leave", icon: CalendarClock, label: "Apply Leave", color: "bg-red-50 text-red-700 border-red-200" },
];

export default function TeacherDashboard() {
  const [info, setInfo] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayDone, setTodayDone] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/teacher/me").then((r) => r.json()),
      // Check if attendance was taken today
      fetch(`/api/attendance?date=${new Date().toISOString().slice(0, 10)}`).then((r) => r.json()).catch(() => ({})),
    ]).then(([me]) => {
      setInfo(me);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="animate-pulse text-gray-400">Loading your dashboard…</div>
      </div>
    );
  }

  if (!info) return null;

  const { teacher, assignments, classes, isClassTeacher } = info;

  // Unique subjects from assignments
  const subjectSet = new Map<string, string>();
  for (const a of assignments) {
    if (a.subject) subjectSet.set(a.subject.id, a.subject.name);
  }

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-5 mb-6 text-white shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-primary-200 text-sm mb-1">{today}</p>
            <h1 className="text-xl sm:text-2xl font-bold">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {teacher.name.split(" ")[0]}!
            </h1>
            <p className="text-primary-200 text-sm mt-1">
              You have {classes.length} class{classes.length !== 1 ? "es" : ""} and {subjectSet.size} subject{subjectSet.size !== 1 ? "s" : ""} assigned
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 text-sm">
            <UserCheck className="w-4 h-4" />
            {isClassTeacher ? "Class Teacher" : "Subject Teacher"}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {!todayDone && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
          <span>Attendance for today has not been submitted yet.</span>
          <Link href="/dashboard/teacher/attendance" className="ml-auto font-semibold text-amber-700 hover:underline whitespace-nowrap">
            Take now →
          </Link>
        </div>
      )}

      {todayDone && (
        <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />
          Today&apos;s attendance has been submitted.
        </div>
      )}

      {/* My Assignments */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3">My Assignments</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((cls) => {
            const clsSubjects = assignments
              .filter((a) => a.class.id === cls.id && a.subject)
              .map((a) => a.subject!.name);
            return (
              <div key={cls.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{cls.name}</span>
                  {cls.isClassTeacher && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Class Teacher
                    </span>
                  )}
                </div>
                {clsSubjects.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {clsSubjects.map((s) => (
                      <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No subjects assigned</p>
                )}
              </div>
            );
          })}
          {classes.length === 0 && (
            <div className="col-span-3 text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-dashed border-gray-300">
              No assignments yet. Contact admin to get assigned to classes.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions
            .filter((a) => !a.classTeacherOnly || isClassTeacher)
            .map(({ href, icon: Icon, label, color, badge }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${color}`}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {badge && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-center leading-tight">{label}</span>
                <ChevronRight className="w-3 h-3 opacity-50" />
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
