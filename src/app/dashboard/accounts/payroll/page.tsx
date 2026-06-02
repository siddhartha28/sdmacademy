"use client";
import { useEffect, useState } from "react";
import { Plus, CheckCircle, X, Download } from "lucide-react";
import { toast } from "sonner";

interface StaffMember { id: string; name: string; role: string; }
interface SalaryRecord {
  id: string; month: number; year: number; basicSalary: number; allowances: number;
  deductions: number; netSalary: number; status: string; paymentDate?: string;
  teacher: { id: string; name: string; role: string };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function PayrollPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);
  const [selYear, setSelYear] = useState(new Date().getFullYear());

  const initForm = { teacherId: "", month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), basicSalary: "", allowances: "0", deductions: "0", remarks: "" };
  const [form, setForm] = useState(initForm);

  const fetch_ = async () => {
    const [rRes, sRes] = await Promise.all([
      fetch(`/api/payroll?month=${selMonth}&year=${selYear}`),
      fetch("/api/admin/users"),
    ]);
    const rData = await rRes.json();
    const sData = await sRes.json();
    setRecords(rData.records || []);
    setStaff((sData.users || []).filter((u: StaffMember) => ["TEACHER", "ADMIN", "ACCOUNTS"].includes(u.role)));
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, [selMonth, selYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/payroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Salary record saved"); setShowForm(false); setForm(initForm); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const markPaid = async (id: string) => {
    const res = await fetch("/api/payroll", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "PAID", paymentDate: new Date().toISOString() }) });
    if (res.ok) { toast.success("Marked as paid"); fetch_(); }
  };

  const totalPayable = records.filter(r => r.status === "PENDING").reduce((s, r) => s + r.netSalary, 0);
  const totalPaid = records.filter(r => r.status === "PAID").reduce((s, r) => s + r.netSalary, 0);

  const downloadCSV = () => {
    const rows = [["Staff Name", "Role", "Basic", "Allowances", "Deductions", "Net Salary", "Status", "Payment Date"]];
    records.forEach(r => rows.push([r.teacher.name, r.teacher.role, String(r.basicSalary), String(r.allowances), String(r.deductions), String(r.netSalary), r.status, r.paymentDate ? new Date(r.paymentDate).toLocaleDateString("en-IN") : ""]));
    const csv = rows.map(row => row.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `payroll-${MONTHS[selMonth - 1]}-${selYear}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-sm text-gray-500 mt-1">Pending: {fmt(totalPayable)} · Paid: {fmt(totalPaid)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"><Download className="w-4 h-4" /> Export</button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"><Plus className="w-4 h-4" /> Add Record</button>
        </div>
      </div>

      {/* Month/Year selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
        </select>
        <span className="text-sm text-gray-500">{records.length} records for {MONTHS[selMonth - 1]} {selYear}</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Staff", value: records.length, color: "bg-gray-50 text-gray-700" },
          { label: "Pending Payment", value: fmt(totalPayable), color: "bg-amber-50 text-amber-700" },
          { label: "Paid", value: fmt(totalPaid), color: "bg-green-50 text-green-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color} border`}>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{["Staff Member", "Basic", "Allowances", "Deductions", "Net Salary", "Status", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && records.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-gray-400">No records for {MONTHS[selMonth - 1]} {selYear}. Add salary records above.</td></tr>
            )}
            {records.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.teacher.name}<span className="ml-2 text-xs text-gray-400 capitalize">{r.teacher.role.toLowerCase()}</span></td>
                <td className="px-4 py-3 text-gray-600">{fmt(r.basicSalary)}</td>
                <td className="px-4 py-3 text-green-700">+{fmt(r.allowances)}</td>
                <td className="px-4 py-3 text-red-700">-{fmt(r.deductions)}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{fmt(r.netSalary)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
                  {r.paymentDate && <span className="block text-xs text-gray-400">{new Date(r.paymentDate).toLocaleDateString("en-IN")}</span>}
                </td>
                <td className="px-4 py-3">
                  {r.status === "PENDING" && (
                    <button onClick={() => markPaid(r.id)} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100">
                      <CheckCircle className="w-3 h-3" /> Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Record Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Salary Record</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Staff Member *</label>
                <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">— Select Staff —</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                  <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                  <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Basic Salary (₹) *</label>
                  <input type="number" min="0" value={form.basicSalary} onChange={e => setForm(f => ({ ...f, basicSalary: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Allowances (₹)</label>
                  <input type="number" min="0" value={form.allowances} onChange={e => setForm(f => ({ ...f, allowances: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Deductions (₹)</label>
                  <input type="number" min="0" value={form.deductions} onChange={e => setForm(f => ({ ...f, deductions: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-center">
                  <p className="text-xs text-gray-500">Net Salary</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(Math.max(0, Number(form.basicSalary) + Number(form.allowances) - Number(form.deductions)))}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                <input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
