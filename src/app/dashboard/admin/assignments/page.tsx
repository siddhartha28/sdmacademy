"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, UserCheck, BookOpen, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Teacher { id: string; name: string; phone: string; }
interface ClassItem { id: string; name: string; order: number; }
interface SubjectItem { id: string; name: string; classId: string | null; }
interface Assignment {
  id: string;
  isClassTeacher: boolean;
  academicYear: string;
  teacher: { id: string; name: string };
  class: { id: string; name: string };
  subject: { id: string; name: string } | null;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTeacher, setFilterTeacher] = useState("");

  // Form state
  const [form, setForm] = useState({
    teacherId: "",
    classId: "",
    subjectId: "",
    isClassTeacher: false,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, tRes, cRes, sRes] = await Promise.all([
        fetch(`/api/admin/assignments?year=2025-26${filterTeacher ? `&teacherId=${filterTeacher}` : ""}`),
        fetch("/api/users?role=TEACHER&limit=100"),
        fetch("/api/classes"),
        fetch("/api/subjects"),
      ]);
      const [a, t, c, s] = await Promise.all([aRes.json(), tRes.json(), cRes.json(), sRes.json()]);
      setAssignments(a.assignments ?? []);
      setTeachers(t.users ?? []);
      setClasses(c.classes ?? []);
      setSubjects(s.subjects ?? []);
    } finally {
      setLoading(false);
    }
  }, [filterTeacher]);

  useEffect(() => { load(); }, [load]);

  const filteredSubjects = subjects.filter(
    (s) => !form.classId || s.classId === form.classId || !s.classId
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.teacherId || !form.classId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: form.teacherId,
          classId: form.classId,
          subjectId: form.subjectId || null,
          isClassTeacher: form.isClassTeacher,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to save");
      } else {
        toast.success("Assignment added");
        setForm({ teacherId: "", classId: "", subjectId: "", isClassTeacher: false });
        load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this assignment?")) return;
    const res = await fetch(`/api/admin/assignments?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Removed");
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    }
  }

  // Group assignments by teacher for display
  const grouped: Record<string, { teacher: { id: string; name: string }; items: Assignment[] }> = {};
  for (const a of assignments) {
    if (!grouped[a.teacher.id]) {
      grouped[a.teacher.id] = { teacher: a.teacher, items: [] };
    }
    grouped[a.teacher.id].items.push(a);
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Assignments</h1>
          <p className="text-gray-500 text-sm mt-1">Assign teachers as class teachers or subject teachers</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-primary-600 hover:text-primary-800 text-sm font-medium">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Add Assignment Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary-600" /> Add Assignment
        </h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={form.teacherId}
            onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
            required
          >
            <option value="">Select Teacher</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: "" })}
            required
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={form.subjectId}
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
          >
            <option value="">Subject (optional)</option>
            {filteredSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl cursor-pointer hover:bg-primary-50 text-sm">
            <input
              type="checkbox"
              checked={form.isClassTeacher}
              onChange={(e) => setForm({ ...form, isClassTeacher: e.target.checked })}
              className="accent-primary-600"
            />
            <span className="text-gray-700 font-medium">Class Teacher</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {saving ? "Saving..." : "Add"}
          </button>
        </form>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-3 items-center">
        <select
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
          value={filterTeacher}
          onChange={(e) => setFilterTeacher(e.target.value)}
        >
          <option value="">All Teachers</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <span className="text-gray-400 text-sm">{assignments.length} assignments</span>
      </div>

      {/* Assignments Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No assignments found
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(grouped).map(({ teacher, items }) => (
            <div key={teacher.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-primary-50 px-5 py-3 flex items-center gap-3 border-b border-primary-100">
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                  {teacher.name[0]}
                </div>
                <span className="font-semibold text-primary-900">{teacher.name}</span>
                <span className="text-primary-500 text-xs ml-auto">{items.length} assignment{items.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((a) => (
                  <div key={a.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {a.isClassTeacher ? (
                        <span className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-green-600" />
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </span>
                      )}
                      <div>
                        <span className="font-medium text-gray-800 text-sm">{a.class.name}</span>
                        {a.subject && (
                          <span className="text-gray-400 text-sm"> — {a.subject.name}</span>
                        )}
                        {a.isClassTeacher && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Class Teacher</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
