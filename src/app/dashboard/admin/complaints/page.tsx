"use client";
import { useEffect, useState } from "react";
import { AlertCircle, Plus, X, Filter } from "lucide-react";
import { toast } from "sonner";

interface Complaint {
  id: string; complainantName: string; complainantType: string; phone?: string;
  category: string; description: string; status: string; assignedTo?: string;
  resolution?: string; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-green-100 text-green-700",
  ESCALATED: "bg-purple-100 text-purple-700",
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ complainantName: "", complainantType: "PARENT", phone: "", category: "OTHER", description: "" });
  const [updateForm, setUpdateForm] = useState({ status: "", assignedTo: "", resolution: "" });

  const fetch_ = async () => {
    const res = await fetch("/api/complaints");
    const data = await res.json();
    setComplaints(data.complaints || []);
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const displayed = filter === "ALL" ? complaints : complaints.filter(c => c.status === filter);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/complaints", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Complaint logged"); setShowForm(false); setForm({ complainantName: "", complainantType: "PARENT", phone: "", category: "OTHER", description: "" }); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const update = async (id: string) => {
    const res = await fetch("/api/complaints", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updateForm }) });
    if (res.ok) { toast.success("Updated"); setSelectedId(null); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this complaint?")) return;
    const res = await fetch(`/api/complaints?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetch_(); }
  };

  const selected = complaints.find(c => c.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaints & Requests</h1>
          <p className="text-sm text-gray-500 mt-1">{complaints.filter(c => c.status === "OPEN").length} open · {complaints.filter(c => c.status === "IN_PROGRESS").length} in progress</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> Log Complaint
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[["ALL", "All"], ["OPEN", "Open"], ["IN_PROGRESS", "In Progress"], ["RESOLVED", "Resolved"]].map(([v, l]) => {
          const count = v === "ALL" ? complaints.length : complaints.filter(c => c.status === v).length;
          return (
            <button key={v} onClick={() => setFilter(v)} className={`rounded-xl border p-3 text-left transition ${filter === v ? "border-primary-500 bg-primary-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{l}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Filter className="w-4 h-4" /> Showing: {filter === "ALL" ? "All Complaints" : filter}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{["Complainant", "Type", "Category", "Description", "Status", "Date", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && displayed.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No complaints found</td></tr>}
            {displayed.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.complainantName}{c.phone && <span className="block text-xs text-gray-400">{c.phone}</span>}</td>
                <td className="px-4 py-3 text-gray-600 capitalize">{c.complainantType.toLowerCase()}</td>
                <td className="px-4 py-3 text-gray-600 capitalize">{c.category.toLowerCase()}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.description}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700"}`}>{c.status.replace("_", " ")}</span></td>
                <td className="px-4 py-3 text-gray-400">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedId(c.id); setUpdateForm({ status: c.status, assignedTo: c.assignedTo || "", resolution: c.resolution || "" }); }} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">Update</button>
                    <button onClick={() => del(c.id)} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"><X className="w-3 h-3" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Log Complaint Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-500" /> Log New Complaint</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Complainant Name *</label>
                  <input value={form.complainantName} onChange={e => setForm(f => ({ ...f, complainantName: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.complainantType} onChange={e => setForm(f => ({ ...f, complainantType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {["PARENT", "STUDENT", "STAFF", "OTHER"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {["ACADEMIC", "FACILITY", "STAFF", "TRANSPORT", "OTHER"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Complaint Modal */}
      {selectedId && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Update Complaint</h2>
              <button onClick={() => setSelectedId(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <p className="font-medium text-gray-900">{selected.complainantName}</p>
              <p className="text-gray-600 mt-1">{selected.description}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {["OPEN", "IN_PROGRESS", "RESOLVED", "ESCALATED"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
                <input value={updateForm.assignedTo} onChange={e => setUpdateForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="Staff name or department" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Resolution / Notes</label>
                <textarea value={updateForm.resolution} onChange={e => setUpdateForm(f => ({ ...f, resolution: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setSelectedId(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => update(selectedId)} className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
