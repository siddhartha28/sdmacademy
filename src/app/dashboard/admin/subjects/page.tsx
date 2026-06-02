"use client";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Subject { id: string; name: string; code?: string; class: { name: string }; }
interface Class { id: string; name: string; }

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", classId: "" });
  const [filterClassId, setFilterClassId] = useState("ALL");

  const fetch_ = async () => {
    const [sRes, cRes] = await Promise.all([fetch("/api/subjects"), fetch("/api/classes")]);
    setSubjects((await sRes.json()).subjects || []);
    setClasses((await cRes.json()).classes || []);
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Subject created"); setShowAdd(false); setForm({ name: "", code: "", classId: "" }); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    const res = await fetch(`/api/subjects?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const displayed = filterClassId === "ALL" ? subjects : subjects.filter(s => s.class?.name === classes.find(c => c.id === filterClassId)?.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects Management</h1>
          <p className="text-sm text-gray-500 mt-1">{subjects.length} subjects across all classes</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select value={filterClassId} onChange={e => setFilterClassId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="ALL">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-sm text-gray-500">{displayed.length} subjects</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{["Subject Name", "Code", "Class", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={4} className="py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && displayed.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400">No subjects found</td></tr>}
            {displayed.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.code || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{s.class?.name}</td>
                <td className="px-4 py-3">
                  <button onClick={() => del(s.id)} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"><X className="w-3 h-3" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Subject</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Mathematics, Science" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject Code</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. MATH-9" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Class *</label>
                <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">— Select Class —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
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
