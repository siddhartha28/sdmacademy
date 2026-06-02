"use client";
import { useEffect, useState } from "react";
import { Plus, X, BadgePercent } from "lucide-react";
import { toast } from "sonner";

interface Waiver {
  id: string; amount: number; reason: string; type: string; status: string;
  requestedBy: string; approvedBy?: string; approvedAt?: string; remarks?: string; createdAt: string;
  student: { id: string; name: string; admissionNo: string; section?: { name: string; class?: { name: string } } };
}
interface Student { id: string; name: string; admissionNo: string; }

const TYPE_LABELS: Record<string, string> = { DISCOUNT: "Discount", SCHOLARSHIP: "Scholarship", SIBLING: "Sibling", STAFF_WARD: "Staff Ward", OTHER: "Other" };
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function WaiversPage() {
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const initForm = { studentId: "", amount: "", reason: "", type: "DISCOUNT" };
  const [form, setForm] = useState(initForm);

  const fetch_ = async () => {
    const [wRes, sRes] = await Promise.all([
      fetch("/api/fee-waivers"),
      fetch("/api/students"),
    ]);
    const wData = await wRes.json();
    const sData = await sRes.json();
    setWaivers(wData.waivers || []);
    setStudents(sData.students || []);
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/fee-waivers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Waiver request submitted — pending principal approval"); setShowForm(false); setForm(initForm); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const displayed = filter === "ALL" ? waivers : waivers.filter(w => w.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Waivers & Concessions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {waivers.filter(w => w.status === "PENDING").length} pending · {waivers.filter(w => w.status === "APPROVED").length} approved
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> Request Waiver
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
        <BadgePercent className="w-4 h-4 shrink-0" />
        Waiver requests require <strong>principal approval</strong> before they are applied to student accounts.
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[["ALL", "All"], ["PENDING", "Pending"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filter === v ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{l} ({v === "ALL" ? waivers.length : waivers.filter(w => w.status === v).length})</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{["Student", "Type", "Amount", "Reason", "Status", "Requested By", "Date"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && displayed.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No waiver requests found</td></tr>}
            {displayed.map(w => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{w.student.name}<span className="block text-xs text-gray-400">{w.student.admissionNo} · {w.student.section?.class?.name} {w.student.section?.name}</span></td>
                <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[w.type] || w.type}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{fmt(w.amount)}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs">{w.reason}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[w.status] || "bg-gray-100 text-gray-700"}`}>{w.status}</span>
                  {w.status === "APPROVED" && w.approvedBy && <span className="block text-xs text-gray-400">by {w.approvedBy}</span>}
                  {w.remarks && <span className="block text-xs text-gray-500 italic">{w.remarks}</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{w.requestedBy}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(w.createdAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Request Waiver Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Request Fee Waiver</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Student *</label>
                <select value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">— Select Student —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason / Justification *</label>
                <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">This request will be sent to the principal for approval.</p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
