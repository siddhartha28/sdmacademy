"use client";
import { useEffect, useState } from "react";
import { Plus, X, Filter, Download } from "lucide-react";
import { toast } from "sonner";

interface Expense {
  id: string; title: string; category: string; amount: number; date: string;
  description?: string; vendorName?: string; invoiceNo?: string; paymentMode: string; createdBy: string;
}

const CATEGORIES = ["UTILITIES", "MAINTENANCE", "SUPPLIES", "PETTY_CASH", "TRANSPORT", "SALARIES", "OTHER"];
const CATEGORY_COLORS: Record<string, string> = {
  UTILITIES: "bg-blue-100 text-blue-700", MAINTENANCE: "bg-orange-100 text-orange-700",
  SUPPLIES: "bg-green-100 text-green-700", PETTY_CASH: "bg-yellow-100 text-yellow-700",
  TRANSPORT: "bg-purple-100 text-purple-700", SALARIES: "bg-red-100 text-red-700",
  OTHER: "bg-gray-100 text-gray-700",
};

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const initForm = { title: "", category: "OTHER", amount: "", date: new Date().toISOString().split("T")[0], description: "", vendorName: "", invoiceNo: "", paymentMode: "CASH" };
  const [form, setForm] = useState(initForm);

  const fetch_ = async () => {
    const params = new URLSearchParams();
    if (filterCat !== "ALL") params.set("category", filterCat);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(data.expenses || []);
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, [filterCat, fromDate, toDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Expense recorded"); setShowForm(false); setForm(initForm); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetch_(); }
  };

  const displayed = filterCat === "ALL" ? expenses : expenses.filter(e => e.category === filterCat);
  const total = displayed.reduce((s, e) => s + e.amount, 0);

  const downloadCSV = () => {
    const rows = [["Title", "Category", "Amount", "Date", "Vendor", "Payment Mode", "Invoice No", "Added By"]];
    displayed.forEach(e => rows.push([e.title, e.category, String(e.amount), new Date(e.date).toLocaleDateString("en-IN"), e.vendorName || "", e.paymentMode, e.invoiceNo || "", e.createdBy]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "expenses.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {fmt(total)} across {displayed.length} records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"><Download className="w-4 h-4" /> Export</button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"><Plus className="w-4 h-4" /> Add Expense</button>
        </div>
      </div>

      {/* Category summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORIES.slice(0, 4).map(cat => {
          const total = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
          return (
            <div key={cat} className={`rounded-xl border p-3 ${CATEGORY_COLORS[cat]}`}>
              <p className="text-sm font-bold">{fmt(total)}</p>
              <p className="text-xs capitalize mt-0.5">{cat.toLowerCase().replace("_", " ")}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          <span>to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{["Title", "Category", "Amount", "Date", "Vendor", "Mode", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && displayed.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No expenses found</td></tr>}
            {displayed.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{e.title}{e.description && <span className="block text-xs text-gray-400">{e.description}</span>}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[e.category] || "bg-gray-100 text-gray-700"}`}>{e.category}</span></td>
                <td className="px-4 py-3 font-semibold text-red-700">{fmt(e.amount)}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(e.date).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-gray-600">{e.vendorName || "—"}{e.invoiceNo && <span className="block text-xs text-gray-400">#{e.invoiceNo}</span>}</td>
                <td className="px-4 py-3 text-gray-600 capitalize">{e.paymentMode.toLowerCase().replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => del(e.id)} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"><X className="w-3 h-3" /></button>
                </td>
              </tr>
            ))}
            {displayed.length > 0 && (
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={2} className="px-4 py-3 text-gray-700">Total</td>
                <td className="px-4 py-3 text-red-700">{fmt(total)}</td>
                <td colSpan={4}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Expense</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title / Description *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {["CASH", "ONLINE", "BANK_TRANSFER"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vendor Name</label>
                  <input value={form.vendorName} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Invoice / Receipt No.</label>
                  <input value={form.invoiceNo} onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
