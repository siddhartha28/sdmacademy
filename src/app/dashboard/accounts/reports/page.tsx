"use client";
import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

const REPORTS = [
  { id: "fee-collection", label: "Fee Collection Report", desc: "All fee transactions with student details", api: "/api/fees" },
  { id: "expenses", label: "Expense Report", desc: "All school expenses by category", api: "/api/expenses" },
  { id: "payroll", label: "Payroll Report", desc: "Staff salary records for a period", api: "/api/payroll" },
  { id: "waivers", label: "Fee Waiver Report", desc: "All waiver requests and their status", api: "/api/fee-waivers" },
];

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function AccountsReports() {
  const [selReport, setSelReport] = useState(REPORTS[0].id);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  const selected = REPORTS.find(r => r.id === selReport)!;

  const generate = async () => {
    setGenerating(true);
    try {
      let url = selected.api;
      const params = new URLSearchParams();
      if (selReport === "payroll") { params.set("month", String(month)); params.set("year", String(year)); }
      else { if (fromDate) params.set("from", fromDate); if (toDate) params.set("to", toDate); }
      if (params.toString()) url += `?${params}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      let rows: string[][] = [];
      let headers: string[] = [];

      if (selReport === "fee-collection") {
        headers = ["Receipt No", "Student", "Adm. No.", "Class", "Fee Head", "Amount", "Mode", "Date"];
        rows = (data.payments || []).map((p: {receiptNo: string; student: {name: string; admissionNo: string; section?: {name: string; class?: {name: string}}}; feeStructure: {name: string}; amount: number; paymentMode: string; paidAt: string}) => [p.receiptNo, p.student.name, p.student.admissionNo, `${p.student.section?.class?.name || ""} ${p.student.section?.name || ""}`.trim(), p.feeStructure.name, fmt(p.amount), p.paymentMode, new Date(p.paidAt).toLocaleDateString("en-IN")]);
      } else if (selReport === "expenses") {
        headers = ["Title", "Category", "Amount", "Date", "Vendor", "Mode", "Invoice", "Added By"];
        rows = (data.expenses || []).map((e: {title: string; category: string; amount: number; date: string; vendorName?: string; paymentMode: string; invoiceNo?: string; createdBy: string}) => [e.title, e.category, fmt(e.amount), new Date(e.date).toLocaleDateString("en-IN"), e.vendorName || "", e.paymentMode, e.invoiceNo || "", e.createdBy]);
      } else if (selReport === "payroll") {
        headers = ["Staff", "Role", "Basic", "Allowances", "Deductions", "Net", "Status", "Paid On"];
        rows = (data.records || []).map((r: {teacher: {name: string; role: string}; basicSalary: number; allowances: number; deductions: number; netSalary: number; status: string; paymentDate?: string}) => [r.teacher.name, r.teacher.role, fmt(r.basicSalary), fmt(r.allowances), fmt(r.deductions), fmt(r.netSalary), r.status, r.paymentDate ? new Date(r.paymentDate).toLocaleDateString("en-IN") : ""]);
      } else if (selReport === "waivers") {
        headers = ["Student", "Adm. No.", "Type", "Amount", "Reason", "Status", "Requested By", "Date"];
        rows = (data.waivers || []).map((w: {student: {name: string; admissionNo: string}; type: string; amount: number; reason: string; status: string; requestedBy: string; createdAt: string}) => [w.student.name, w.student.admissionNo, w.type, fmt(w.amount), w.reason, w.status, w.requestedBy, new Date(w.createdAt).toLocaleDateString("en-IN")]);
      }

      const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url2 = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url2; a.download = `${selReport}-report.csv`; a.click();
      toast.success(`${selected.label} downloaded`);
    } catch {
      toast.error("Failed to generate report");
    }
    setGenerating(false);
  };

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and download financial reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map(r => (
          <button key={r.id} onClick={() => setSelReport(r.id)} className={`rounded-xl border p-4 text-left transition ${selReport === r.id ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}>
            <div className="flex items-center gap-3">
              <FileText className={`w-6 h-6 ${selReport === r.id ? "text-primary-600" : "text-gray-400"}`} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{r.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Configure Report: {selected.label}</h2>
        {selReport === "payroll" ? (
          <div className="flex gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <p className="text-xs text-gray-400 pb-2">(leave blank for all records)</p>
          </div>
        )}
        <button onClick={generate} disabled={generating} className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
          <Download className="w-4 h-4" /> {generating ? "Generating…" : "Download CSV"}
        </button>
      </div>
    </div>
  );
}
