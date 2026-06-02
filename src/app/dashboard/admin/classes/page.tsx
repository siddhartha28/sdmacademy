"use client";
import { useEffect, useState } from "react";
import { Plus, X, Users } from "lucide-react";
import { toast } from "sonner";

interface Class { id: string; name: string; order: number; _count?: { sections: number }; sections: Section[]; }
interface Section { id: string; name: string; _count?: { students: number }; }

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", order: "" });

  const fetch_ = async () => {
    const res = await fetch("/api/classes");
    const data = await res.json();
    setClasses(data.classes || []);
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, order: Number(form.order) || 0 }) });
    if (res.ok) { toast.success("Class created"); setShowAdd(false); setForm({ name: "", order: "" }); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this class? This cannot be undone.")) return;
    const res = await fetch(`/api/classes?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes & Sections</h1>
          <p className="text-sm text-gray-500 mt-1">{classes.length} classes configured</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <div className="col-span-3 text-center text-gray-400 py-8">Loading…</div>}
        {!loading && classes.length === 0 && <div className="col-span-3 text-center text-gray-400 py-8">No classes found. Add your first class!</div>}
        {classes.map(cls => (
          <div key={cls.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Order: {cls.order}</p>
              </div>
              <button onClick={() => del(cls.id)} className="p-1 text-red-400 hover:text-red-600 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1">
              {cls.sections.map(sec => (
                <div key={sec.id} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-700">Section {sec.name}</span>
                  {sec._count && <span className="ml-auto text-xs text-gray-400">{sec._count.students} students</span>}
                </div>
              ))}
              {cls.sections.length === 0 && <p className="text-xs text-gray-400">No sections yet</p>}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New Class</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Class Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Class 9, Class 10" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Display Order</label>
                <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} placeholder="1, 2, 3…" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
