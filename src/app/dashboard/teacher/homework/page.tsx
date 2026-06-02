"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, FileText, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ClassItem { id: string; name: string; }
interface SubjectItem { id: string; name: string; classId: string | null; }
interface HomeworkItem {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  class: { id: string; name: string };
  subject: { id: string; name: string };
  _count: { submissions: number };
}

function dueBadge(dueDate: string) {
  const due = new Date(dueDate);
  const now = new Date();
  const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  if (days < 0) return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Overdue</span>;
  if (days === 0) return <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Due today</span>;
  return <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Due in {days}d</span>;
}

export default function HomeworkPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", classId: "", subjectId: "", dueDate: "" });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [meRes, hwRes] = await Promise.all([
      fetch("/api/teacher/me"),
      fetch("/api/teacher/homework"),
    ]);
    const [me, hw] = await Promise.all([meRes.json(), hwRes.json()]);
    setClasses(me.classes ?? []);
    setHomework(hw.homework ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!form.classId) { setSubjects([]); return; }
    fetch(`/api/subjects?classId=${form.classId}`)
      .then((r) => r.json())
      .then((d) => setSubjects(d.subjects ?? []));
  }, [form.classId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.classId || !form.subjectId || !form.dueDate) {
      toast.error("Fill all required fields");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/teacher/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Homework assigned!");
      setForm({ title: "", description: "", classId: "", subjectId: "", dueDate: "" });
      setShowForm(false);
      loadData();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this homework?")) return;
    const res = await fetch(`/api/teacher/homework?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      setHomework((prev) => prev.filter((h) => h.id !== id));
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
          <p className="text-gray-400 text-sm mt-0.5">Assign and track homework for your classes</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Assign Homework"}
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">New Homework</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Title *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Chapter 3 – Practice Questions"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Class *</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: "" })}
                required
              >
                <option value="">Select class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Subject *</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                required
                disabled={!form.classId}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Due Date *</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                min={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Instructions (optional)</label>
              <textarea
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Additional instructions for students..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Saving..." : "Assign"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : homework.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No homework assigned yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {homework.map((hw) => (
            <div key={hw.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4 hover:shadow-sm transition-shadow">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{hw.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {hw.class.name} · {hw.subject.name}
                  </p>
                  {hw.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{hw.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {dueBadge(hw.dueDate)}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(hw.dueDate).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(hw.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
