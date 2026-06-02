"use client";

import { useState } from "react";
import { FileBarChart, Download, BarChart3, Users, DollarSign, ClipboardList, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ReportType = "attendance" | "performance" | "fee" | "staff" | "students";

interface ReportConfig {
  id: ReportType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  params?: { name: string; type: string; label: string; options?: { value: string; label: string }[] }[];
}

const REPORTS: ReportConfig[] = [
  {
    id: "attendance",
    label: "Attendance Report",
    description: "School-wide or class-wise attendance for any date range",
    icon: ClipboardList,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    params: [
      { name: "from", type: "date", label: "From Date" },
      { name: "to", type: "date", label: "To Date" },
    ],
  },
  {
    id: "performance",
    label: "Performance Report",
    description: "Class and subject-wise marks and pass/fail statistics",
    icon: BarChart3,
    color: "bg-violet-50 text-violet-700 border-violet-200",
    params: [
      { name: "type", type: "select", label: "Report Type", options: [{ value: "class", label: "Class-wise" }, { value: "subject", label: "Subject-wise" }] },
    ],
  },
  {
    id: "fee",
    label: "Fee Collection Report",
    description: "Monthly and class-wise fee collection summary",
    icon: DollarSign,
    color: "bg-green-50 text-green-700 border-green-200",
    params: [
      { name: "period", type: "select", label: "Period", options: [{ value: "month", label: "This Month" }, { value: "year", label: "This Year" }, { value: "all", label: "All Time" }] },
    ],
  },
  {
    id: "staff",
    label: "Staff Report",
    description: "Teacher attendance, leave summary, and workload",
    icon: Users,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "students",
    label: "Student Strength Report",
    description: "Enrollment statistics class-wise and gender-wise",
    icon: Users,
    color: "bg-pink-50 text-pink-700 border-pink-200",
  },
];

export default function ReportsPage() {
  const [selected, setSelected] = useState<ReportType | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);

  async function generateReport() {
    if (!selected) return;
    setGenerating(true);
    try {
      // Map report types to existing API endpoints
      let url = "";
      if (selected === "attendance") {
        const from = params.from ?? new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
        const to = params.to ?? new Date().toISOString().split("T")[0];
        url = `/api/reports?type=attendance-trend&from=${from}&to=${to}`;
      } else if (selected === "performance") {
        url = `/api/marks?limit=500`;
      } else if (selected === "fee") {
        url = `/api/fees?limit=500`;
      } else if (selected === "staff") {
        url = `/api/teachers?role=TEACHER&limit=100`;
      } else if (selected === "students") {
        url = `/api/students?status=ACTIVE&limit=500`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setReportData(data);
      toast.success("Report generated!");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  function downloadCSV() {
    if (!reportData || !selected) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `SDM Academy — ${REPORTS.find((r) => r.id === selected)?.label}\n`;
    csvContent += `Generated: ${new Date().toLocaleDateString("en-IN")}\n\n`;

    if (selected === "students") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const students = (reportData.students ?? []) as Array<any>;
      if (students.length > 0) {
        csvContent += "Name,Roll No,Admission No,Class,Father Name,Phone,Status\n";
        students.forEach((s) => {
          csvContent += `"${s.name}","${s.rollNo}","${s.admissionNo ?? ""}","${s.section?.class?.name ?? ""}","${s.fatherName ?? ""}","${s.phone ?? ""}","${s.status}"\n`;
        });
      }
    } else if (selected === "fee") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payments = (reportData.payments ?? reportData.fees ?? []) as Array<any>;
      if (payments.length > 0) {
        csvContent += "Receipt,Student,Class,Amount,Mode,Date\n";
        payments.forEach((p) => {
          csvContent += `"${p.receiptNo}","${p.student?.name}","${p.student?.section?.class?.name ?? ""}","${p.amount}","${p.mode}","${String(p.paymentDate).slice(0, 10)}"\n`;
        });
      }
    }

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${selected}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success("Report downloaded");
  }

  const selectedReport = REPORTS.find((r) => r.id === selected);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Export</h1>
        <p className="text-gray-400 text-sm mt-0.5">Generate and download school-wide reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => { setSelected(report.id); setParams({}); setReportData(null); }}
              className={`text-left p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${report.color} ${selected === report.id ? "ring-2 ring-primary-500" : ""}`}
            >
              <Icon className="w-6 h-6 mb-2" />
              <p className="font-semibold text-sm">{report.label}</p>
              <p className="text-xs opacity-75 mt-0.5">{report.description}</p>
            </button>
          );
        })}
      </div>

      {selected && selectedReport && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">{selectedReport.label}</h2>

          {selectedReport.params && selectedReport.params.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {selectedReport.params.map((p) => (
                <div key={p.name}>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{p.label}</label>
                  {p.type === "select" ? (
                    <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={params[p.name] ?? ""} onChange={(e) => setParams({ ...params, [p.name]: e.target.value })}>
                      <option value="">All</option>
                      {p.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={p.type} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={params[p.name] ?? ""} onChange={(e) => setParams({ ...params, [p.name]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={generateReport} disabled={generating}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              <FileBarChart className="w-4 h-4" />
              {generating ? "Generating…" : "Generate Report"}
            </button>
            {reportData && (
              <button onClick={downloadCSV}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-sm font-semibold">
                <Download className="w-4 h-4" /> Download CSV
              </button>
            )}
          </div>
        </div>
      )}

      {reportData && selected === "students" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Student Strength Report</h2>
            <span className="text-xs text-gray-400">{(reportData.students as unknown[])?.length ?? 0} students</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-700">{(reportData.students as unknown[])?.length ?? 0}</p>
                <p className="text-xs text-blue-600">Total Students</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-pink-700">
                  {(reportData.students as Array<{ gender: string }>)?.filter((s) => s.gender === "FEMALE").length ?? 0}
                </p>
                <p className="text-xs text-pink-600">Girls</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-indigo-700">
                  {(reportData.students as Array<{ gender: string }>)?.filter((s) => s.gender === "MALE").length ?? 0}
                </p>
                <p className="text-xs text-indigo-600">Boys</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportData && selected === "fee" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-green-700">
                ₹{((reportData.payments ?? reportData.fees ?? []) as Array<{ amount: number }>).reduce((s: number, p: { amount: number }) => s + p.amount, 0).toLocaleString()}
              </p>
              <p className="text-xs text-green-600">Total Collected</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{((reportData.payments ?? reportData.fees ?? []) as unknown[]).length}</p>
              <p className="text-xs text-blue-600">Transactions</p>
            </div>
          </div>
        </div>
      )}

      {!selected && (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <FileBarChart className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Select a report type above to get started</p>
        </div>
      )}
    </div>
  );
}
