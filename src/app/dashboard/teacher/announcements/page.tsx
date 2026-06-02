"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, MessageSquare, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ClassItem { id: string; name: string; }
interface Ann {
  id: string;
  title: string;
  content: string;
  scope: "CLASS" | "SCHOOL_WIDE";
  createdAt: string;
  class: { id: string; name: string } | null;
  author: { id: string; name: string };
}

export default function AnnouncementsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [announcements, setAnnouncements] = useState<Ann[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", classId: "", scope: "CLASS" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [meRes, annRes] = await Promise.all([
      fetch("/api/teacher/me"),
      fetch("/api/teacher/announcements"),
    ]);
    const [me, ann] = await Promise.all([meRes.json(), annRes.json()]);
    setClasses(me.classes ?? []);
    setAnnouncements(ann.announcements ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.content) { toast.error("Fill required fields"); return; }
    setSaving(true);
    const res = await fetch("/api/teacher/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, classId: form.classId || null }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Announcement posted!");
      setForm({ title: "", content: "", classId: "", scope: "CLASS" });
      setShowForm(false);
      load();
    } else {
      toast.error("Failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const res = await fetch(`/api/teacher/announcements?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-400 text-sm mt-0.5">Post updates for your class or school</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "New"}
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm space-y-4">
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Content *" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Scope</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                <option value="CLASS">My Class</option>
                <option value="SCHOOL_WIDE">School-wide</option>
              </select>
            </div>
            {form.scope === "CLASS" && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Class</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                  <option value="">All my classes</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No announcements yet
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ann.scope === "SCHOOL_WIDE" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>
                    {ann.scope === "SCHOOL_WIDE" ? <Globe className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{ann.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ann.scope === "SCHOOL_WIDE" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"}`}>
                        {ann.scope === "SCHOOL_WIDE" ? "School-wide" : ann.class?.name ?? "All classes"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ann.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(ann.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(ann.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
