"use client";

import { useState, useEffect } from "react";
import { UserCheck, BookOpen, Phone, Clock, CheckCircle2 } from "lucide-react";

interface Teacher {
  id: string; name: string; phone: string; email: string | null;
  classId: string | null; isActive: boolean; createdAt: string;
  class: { name: string } | null;
}
interface Assignment {
  id: string; isClassTeacher: boolean;
  class: { name: string }; subject: { name: string } | null;
  teacher: { id: string };
}
interface Leave {
  id: string; status: string; fromDate: string; toDate: string;
  teacher: { id: string };
}

export default function PrincipalTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/teachers?role=TEACHER&limit=100").then((r) => r.json()),
      fetch("/api/admin/assignments?year=2025-26").then((r) => r.json()),
      fetch("/api/teacher/leave").then((r) => r.json()),
    ]).then(([t, a, l]) => {
      setTeachers(t.users ?? t.teachers ?? []);
      setAssignments(a.assignments ?? []);
      setLeaves(l.leaves ?? []);
      setLoading(false);
    });
  }, []);

  const today = new Date().toISOString().split("T")[0];

  function teacherAssignments(tid: string) {
    return assignments.filter((a) => a.teacher.id === tid);
  }
  function teacherLeaves(tid: string) {
    return leaves.filter((l) => l.teacher.id === tid);
  }
  function onLeaveToday(tid: string) {
    return teacherLeaves(tid).some((l) => {
      if (l.status !== "APPROVED") return false;
      const from = l.fromDate.slice(0, 10);
      const to = l.toDate.slice(0, 10);
      return today >= from && today <= to;
    });
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff & Teachers</h1>
          <p className="text-gray-400 text-sm mt-0.5">View teacher profiles, workload, and leave status</p>
        </div>
        <div className="flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-semibold px-3 py-1.5 rounded-xl">
          <UserCheck className="w-4 h-4" />
          {teachers.length} teachers
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teachers.map((teacher) => {
            const ta = teacherAssignments(teacher.id);
            const classTeacher = ta.find((a) => a.isClassTeacher);
            const subjects = ta.filter((a) => a.subject).map((a) => a.subject!.name);
            const tl = teacherLeaves(teacher.id);
            const pendingLeave = tl.filter((l) => l.status === "PENDING");
            const onLeave = onLeaveToday(teacher.id);

            return (
              <div key={teacher.id} className={`bg-white rounded-2xl border ${onLeave ? "border-amber-300" : "border-gray-200"} p-5 shadow-sm`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 font-bold text-lg flex items-center justify-center flex-shrink-0">
                    {teacher.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{teacher.name}</span>
                      {onLeave && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> On Leave
                        </span>
                      )}
                      {teacher.isActive && !onLeave && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    {teacher.phone && (
                      <a href={`tel:${teacher.phone}`} className="text-xs text-primary-600 flex items-center gap-1 mt-0.5 hover:underline">
                        <Phone className="w-3 h-3" /> {teacher.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Assignments */}
                <div className="mb-3">
                  {classTeacher && (
                    <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg mb-1.5 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Class Teacher — {classTeacher.class.name}
                    </div>
                  )}
                  {subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {subjects.slice(0, 4).map((s) => (
                        <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                      {subjects.length > 4 && <span className="text-xs text-gray-400 self-center">+{subjects.length - 4} more</span>}
                    </div>
                  )}
                  {ta.length === 0 && <p className="text-xs text-gray-400">No assignments yet</p>}
                </div>

                {/* Leave summary */}
                {tl.length > 0 && (
                  <div className="pt-3 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500">
                    <span>{tl.filter((l) => l.status === "APPROVED").length} approved leaves</span>
                    {pendingLeave.length > 0 && (
                      <span className="text-amber-600 font-medium">{pendingLeave.length} pending</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
