"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MessageSquare, Globe, Bell, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ClassItem { id: string; name: string; }
interface Ann {
  id: string; title: string; content: string; scope: string; createdAt: string;
  class: { name: string } | null; author: { name: string };
}
interface Notice {
  id: string; title: string; content: string; category: string | null;
  isPublished: boolean; createdAt: string;
}
type Tab = "announcements" | "notices";

export default function CommunicationPage() {
  const [tab, setTab] = useState<Tab>("announcements");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [announcements, setAnnouncements] = useState<Ann[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [annForm, setAnnForm] = useState({ title: "", content: "", classId: "", scope: "SCHOOL_WIDE" });
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "", category: "", isPublished: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [classRes, annRes, noticeRes] = await Promise.all([
      fetch("/api/classes"),
      fetch("/api/teacher/announcements"),
      fetch("/api/notices"),
    ]);
    const [cls, ann, not] = await Promise.all([classRes.json(), annRes.json(), noticeRes.json()]);
    setClasses(cls.classes ?? []);
    setAnnouncements(ann.announcements ?? []);
    setNotices(not.notices ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handlePostAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!annForm.title || !annForm.content) { toast.error("Fill required fields"); return; }
    setSaving(true);
    const res = await fetch("/api/teacher/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...annForm, classId: annForm.classId || null }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Announcement posted!"); setAnnForm({ title: "", content: "", classId: "", scope: "SCHOOL_WIDE" }); setShowForm(false); load(); }
    else toast.error("Failed");
  }

  async function handlePostNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.content) { toast.error("Fill required fields"); return; }
    setSaving(true);
    const res = await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noticeForm),
    });
    setSaving(false);
    if (res.ok) { toast.success("Notice published!"); setNoticeForm({ title: "", content: "", category: "", isPublished: true }); setShowForm(false); load(); }
    else toast.error("Failed");
  }

  async function deleteAnn(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/teacher/announcements?id=${id}`, { method: "DELETE" });
    toast.success("Deleted");
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication</h1>
          <p className="text-gray-400 text-sm mt-0.5">Post announcements, notices, and circulars</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "New Post"}
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => { setTab("announcements"); setShowForm(false); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "announcements" ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200"}`}>
          <MessageSquare className="w-4 h-4" /> Announcements ({announcements.length})
        </button>
        <button onClick={() => { setTab("notices"); setShowForm(false); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "notices" ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200"}`}>
          <Bell className="w-4 h-4" /> Notices ({notices.length})
        </button>
      </div>

      {/* Compose Forms */}
      {showForm && tab === "announcements" && (
        <form onSubmit={handlePostAnnouncement} className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">New Announcement</h2>
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Title *" value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} required />
          <textarea rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Message *" value={annForm.content} onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Audience</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={annForm.scope} onChange={(e) => setAnnForm({ ...annForm, scope: e.target.value })}>
                <option value="SCHOOL_WIDE">Entire School</option>
                <option value="CLASS">Specific Class</option>
              </select>
            </div>
            {annForm.scope === "CLASS" && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Class</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={annForm.classId} onChange={(e) => setAnnForm({ ...annForm, classId: e.target.value })}>
                  <option value="">All classes</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Posting…" : "Post Announcement"}
            </button>
          </div>
        </form>
      )}

      {showForm && tab === "notices" && (
        <form onSubmit={handlePostNotice} className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">New Notice</h2>
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Title *" value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} required />
          <textarea rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Content *" value={noticeForm.content} onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Category (e.g. Holiday, Exam)" value={noticeForm.category} onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })} />
            <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl cursor-pointer text-sm">
              <input type="checkbox" checked={noticeForm.isPublished} onChange={(e) => setNoticeForm({ ...noticeForm, isPublished: e.target.checked })} className="accent-primary-600" />
              <span>Publish immediately</span>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Publishing…" : "Publish Notice"}
            </button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-16 text-gray-400">Loading…</div> : (
        <>
          {tab === "announcements" && (
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No announcements yet</p></div>
              ) : announcements.map((ann) => (
                <div key={ann.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ann.scope === "SCHOOL_WIDE" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>
                    {ann.scope === "SCHOOL_WIDE" ? <Globe className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{ann.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ann.scope === "SCHOOL_WIDE" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"}`}>
                        {ann.scope === "SCHOOL_WIDE" ? "School-wide" : ann.class?.name ?? "All classes"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ann.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{ann.author.name} · {new Date(ann.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <button onClick={() => deleteAnn(ann.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}

          {tab === "notices" && (
            <div className="space-y-3">
              {notices.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><Bell className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No notices yet</p></div>
              ) : notices.map((notice) => (
                <div key={notice.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-800">{notice.title}</span>
                    {notice.category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{notice.category}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${notice.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {notice.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notice.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
