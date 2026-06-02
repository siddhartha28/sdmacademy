"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Eye, EyeOff, Trash2, Edit2, Bell } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Notice {
  id: string;
  title: string;
  content: string;
  category?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

export default function NoticesAdminPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editNotice, setEditNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "", isPublished: false });
  const [saving, setSaving] = useState(false);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/notices");
    const data = await res.json();
    setNotices(data.notices || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const openAdd = () => {
    setEditNotice(null);
    setForm({ title: "", content: "", category: "", isPublished: false });
    setModalOpen(true);
  };

  const openEdit = (n: Notice) => {
    setEditNotice(n);
    setForm({ title: n.title, content: n.content, category: n.category || "", isPublished: n.isPublished });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editNotice ? "PUT" : "POST";
      const body = editNotice ? { ...form, id: editNotice.id } : form;
      const res = await fetch("/api/notices", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editNotice ? "Notice updated" : "Notice created");
        setModalOpen(false);
        fetchNotices();
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (notice: Notice) => {
    await fetch("/api/notices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...notice, isPublished: !notice.isPublished }),
    });
    toast.success(notice.isPublished ? "Notice unpublished" : "Notice published");
    fetchNotices();
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/notices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast.success("Notice deleted");
    fetchNotices();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notice Board</h1>
          <p className="text-sm text-gray-500">{notices.filter(n => n.isPublished).length} published</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={15} /> New Notice
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {notices.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p>No notices yet. Create the first one.</p>
            </div>
          )}
          {notices.map(notice => (
            <div key={notice.id} className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4">
              <div className={`p-2 rounded-lg flex-shrink-0 ${notice.isPublished ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-400"}`}>
                <Bell size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                  <Badge variant={notice.isPublished ? "success" : "neutral"}>
                    {notice.isPublished ? "Published" : "Draft"}
                  </Badge>
                  {notice.category && <Badge variant="info">{notice.category}</Badge>}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{notice.content}</p>
                <p className="text-xs text-gray-400">
                  {notice.isPublished && notice.publishedAt
                    ? `Published ${formatDate(notice.publishedAt)}`
                    : `Created ${formatDate(notice.createdAt)}`}
                </p>
              </div>
              <div className="flex items-start gap-1 flex-shrink-0">
                <button onClick={() => togglePublish(notice)} className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors">
                  {notice.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={() => openEdit(notice)} className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(notice.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editNotice ? "Edit Notice" : "New Notice"}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Title" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Content <span className="text-danger">*</span></label>
            <textarea required rows={4} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
          </div>
          <Select label="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            options={["Holiday", "Exam", "Event", "General", "Urgent"].map(v => ({ value: v, label: v }))}
            placeholder="Select category (optional)" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))}
              className="w-4 h-4 text-primary-500 rounded" />
            <span className="text-sm text-gray-700">Publish immediately on website</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>
              {editNotice ? "Update Notice" : "Create Notice"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
