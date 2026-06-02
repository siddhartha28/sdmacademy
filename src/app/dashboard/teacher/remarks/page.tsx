"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Award, ChevronDown, ChevronUp, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Student { id: string; name: string; rollNo: string; }
interface Remark {
  id: string;
  remark: string;
  type: string;
  date: string;
  student: { id: string; name: string; rollNo: string };
  teacher: { id: string; name: string };
}

const TYPE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  GENERAL:  { bg: "bg-gray-100",  text: "text-gray-600",  label: "General" },
  POSITIVE: { bg: "bg-green-100", text: "text-green-700", label: "Positive" },
  NEGATIVE: { bg: "bg-red-100",   text: "text-red-700",   label: "Concern" },
  CONDUCT:  { bg: "bg-amber-100", text: "text-amber-700", label: "Conduct" },
};

export default function RemarksPage() {
  const [classes, setClasses] = useState<{ id: string; name: string; isClassTeacher: boolean }[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentId: "", remark: "", type: "GENERAL" });
  const [saving, setSaving] = useState(false);
  const [isClassTeacher, setIsClassTeacher] = useState(false);

  const loadRemarks = useCallback(async (classId: string) => {
    if (!classId) return;
    const res = await fetch(`/api/teacher/remarks?classId=${classId}`);
    const data = await res.json();
    setRemarks(data.remarks ?? []);
  }, []);

  useEffect(() => {
    fetch("/api/teacher/me").then((r) => r.json()).then((me) => {
      const cls = (me.classes ?? []).filter((c: { isClassTeacher: boolean }) => c.isClassTeacher);
      setClasses(cls);
      setIsClassTeacher(me.isClassTeacher);
      if (cls.length > 0) {
        setSelectedClass(cls[0].id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    // Load students
    fetch(`/api/students?classId=${selectedClass}&status=ACTIVE&limit=200`)
      .then((r) => r.json())
      .then((d) => {
        const sorted = (d.students ?? []).sort((a: Student, b: Student) => a.name.localeCompare(b.name));
        setStudents(sorted);
      });
    loadRemarks(selectedClass);
  }, [selectedClass, loadRemarks]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.studentId || !form.remark) { toast.error("Select student and enter remark"); return; }
    setSaving(true);
    const res = await fetch("/api/teacher/remarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Remark added");
      setForm({ studentId: "", remark: "", type: "GENERAL" });
      setShowForm(false);
      loadRemarks(selectedClass);
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this remark?")) return;
    const res = await fetch(`/api/teacher/remarks?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      setRemarks((prev) => prev.filter((r) => r.id !== id));
    }
  }

  if (!isClassTeacher && !loading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <div className="text-center py-16 text-gray-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Behaviour Remarks</p>
          <p className="text-sm mt-1">This feature is only available for class teachers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Remarks</h1>
          <p className="text-gray-400 text-sm mt-0.5">Record behaviour and conduct observations</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Add Remark"}
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Class selector */}
      {classes.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {classes.map((c) => (
            <button key={c.id} onClick={() => setSelectedClass(c.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${selectedClass === c.id ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Student *</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
                <option value="">Select student</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Type</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Remark *</label>
            <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Describe the behaviour or conduct observation..."
              value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Saving..." : "Add Remark"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : remarks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Award className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No remarks added yet
        </div>
      ) : (
        <div className="space-y-3">
          {remarks.map((r) => {
            const cfg = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.GENERAL;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">{r.student.name}</span>
                      <span className="text-xs text-gray-400">Roll {r.student.rollNo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{r.remark}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
