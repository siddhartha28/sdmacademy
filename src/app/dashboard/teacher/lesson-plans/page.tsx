"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, BookMarked, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ClassItem { id: string; name: string; }
interface SubjectItem { id: string; name: string; }
interface Plan {
  id: string;
  topic: string;
  description: string | null;
  date: string;
  duration: number | null;
  status: "PLANNED" | "COMPLETED" | "SKIPPED";
  class: { id: string; name: string };
  subject: { id: string; name: string };
}

const STATUS_CONFIG = {
  PLANNED: { label: "Planned", icon: Clock, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  SKIPPED: { label: "Skipped", icon: XCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export default function LessonPlansPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterClass, setFilterClass] = useState("");
  const [form, setForm] = useState({ topic: "", description: "", classId: "", subjectId: "", date: "", duration: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [meRes, plRes] = await Promise.all([
      fetch("/api/teacher/me"),
      fetch("/api/teacher/lesson-plans"),
    ]);
    const [me, pl] = await Promise.all([meRes.json(), plRes.json()]);
    setClasses(me.classes ?? []);
    setPlans(pl.plans ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!form.classId) { setSubjects([]); return; }
    fetch(`/api/subjects?classId=${form.classId}`)
      .then((r) => r.json())
      .then((d) => setSubjects(d.subjects ?? []));
  }, [form.classId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/teacher/lesson-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, duration: form.duration ? Number(form.duration) : undefined }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Lesson plan added");
      setForm({ topic: "", description: "", classId: "", subjectId: "", date: "", duration: "" });
      setShowForm(false);
      load();
    } else {
      toast.error("Failed to save");
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/teacher/lesson-plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setPlans((prev) => prev.map((p) => p.id === id ? { ...p, status: status as Plan["status"] } : p));
      toast.success(`Marked as ${status.toLowerCase()}`);
    }
  }

  const filtered = filterClass ? plans.filter((p) => p.class.id === filterClass) : plans;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lesson Plans</h1>
          <p className="text-gray-400 text-sm mt-0.5">Track your syllabus and teaching schedule</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Add Plan"}
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Topic *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Fractions and Decimals"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Class *</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: "" })} required>
                <option value="">Select class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Subject *</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required disabled={!form.classId}>
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Date *</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Duration (minutes)</label>
              <input type="number" min={1} max={300} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. 40" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
              <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Saving..." : "Add Plan"}
            </button>
          </div>
        </form>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {(["PLANNED", "COMPLETED", "SKIPPED"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = plans.filter((p) => p.status === s).length;
          return (
            <div key={s} className={`${cfg.bg} ${cfg.border} border rounded-xl p-3 text-center`}>
              <p className={`text-2xl font-bold ${cfg.text}`}>{count}</p>
              <p className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
          value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No lesson plans yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((plan) => {
            const cfg = STATUS_CONFIG[plan.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{plan.topic}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {plan.class.name} · {plan.subject.name}
                      {plan.duration && <span className="ml-2 text-gray-400">· {plan.duration} min</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(plan.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
                    {plan.description && <p className="text-xs text-gray-400 mt-1">{plan.description}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {plan.status !== "COMPLETED" && (
                      <button onClick={() => updateStatus(plan.id, "COMPLETED")} className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded-lg font-medium">
                        ✓ Done
                      </button>
                    )}
                    {plan.status === "PLANNED" && (
                      <button onClick={() => updateStatus(plan.id, "SKIPPED")} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-lg font-medium">
                        Skip
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
