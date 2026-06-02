"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, FolderOpen, ExternalLink, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ClassItem { id: string; name: string; }
interface SubjectItem { id: string; name: string; }
interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  isPublic: boolean;
  createdAt: string;
  teacher: { id: string; name: string };
  subject: { id: string; name: string } | null;
}

export default function DocumentsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", fileUrl: "", classId: "", subjectId: "", isPublic: true });
  const [saving, setSaving] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [meRes, matRes] = await Promise.all([
      fetch("/api/teacher/me"),
      fetch("/api/teacher/documents"),
    ]);
    const [me, mat] = await Promise.all([meRes.json(), matRes.json()]);
    setClasses(me.classes ?? []);
    setCurrentTeacherId(me.teacher?.id ?? "");
    setMaterials(mat.materials ?? []);
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
    if (!form.title || !form.fileUrl) { toast.error("Title and file URL are required"); return; }
    setSaving(true);
    const res = await fetch("/api/teacher/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, classId: form.classId || null, subjectId: form.subjectId || null }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Material added!");
      setForm({ title: "", description: "", fileUrl: "", classId: "", subjectId: "", isPublic: true });
      setShowForm(false);
      load();
    } else {
      toast.error("Failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this material?")) return;
    const res = await fetch(`/api/teacher/documents?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Material</h1>
          <p className="text-gray-400 text-sm mt-0.5">Share notes, worksheets, and links with students</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Add Material"}
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Title *</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Chapter 5 Notes" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">File / Link URL *</label>
              <input type="url" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://drive.google.com/... or YouTube link"
                value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} required />
              <p className="text-xs text-gray-400 mt-1">Paste a Google Drive link, YouTube video, or any shareable URL</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Class</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: "" })}>
                <option value="">All classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Subject</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} disabled={!form.classId}>
                <option value="">All subjects</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
              <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} className="accent-primary-600" />
              <span className="text-gray-700">Visible to all teachers</span>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Adding..." : "Add Material"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No study materials yet
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {materials.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{m.title}</p>
                  {m.subject && <p className="text-xs text-primary-600 mt-0.5">{m.subject.name}</p>}
                  {m.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">By {m.teacher.name} · {new Date(m.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <a href={m.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {m.teacher.id === currentTeacherId && (
                    <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
