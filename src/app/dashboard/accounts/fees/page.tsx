"use client";
import { useEffect, useState } from "react";
import { Plus, Download, X, Search } from "lucide-react";
import { toast } from "sonner";

interface FeeStructure { id: string; name: string; amount: number; classId?: string; term: string; class?: { name: string }; }
interface FeePayment {
  id: string; amount: number; paymentDate: string; mode: string; receiptNo: string; remarks?: string;
  student: { name: string; admissionNo: string; section?: { name: string; class?: { name: string } } };
  feeStructure?: { name: string };
}
interface Student { id: string; name: string; admissionNo: string; }
interface Class { id: string; name: string; }

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function AccountsFeesPage() {
  const [tab, setTab] = useState<"collect" | "payments" | "structures">("collect");
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayForm, setShowPayForm] = useState(false);
  const [showStructForm, setShowStructForm] = useState(false);
  const [search, setSearch] = useState("");

  const initPayForm = { studentId: "", feeStructureId: "", amount: "", paymentMode: "CASH", receiptNo: "", remarks: "" };
  const [payForm, setPayForm] = useState(initPayForm);
  const initStruct = { name: "", amount: "", classId: "", term: "ANNUAL" };
  const [structForm, setStructForm] = useState(initStruct);

  const fetch_ = async () => {
    const [pRes, sRes, stRes, clRes] = await Promise.all([
      fetch("/api/fees"),
      fetch("/api/fees?type=structure"),
      fetch("/api/students"),
      fetch("/api/classes"),
    ]);
    setPayments((await pRes.json()).payments || []);
    setStructures((await sRes.json()).structures || []);
    setStudents((await stRes.json()).students || []);
    setClasses((await clRes.json()).classes || []);
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const collectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: payForm.studentId, feeStructureId: payForm.feeStructureId, amount: Number(payForm.amount), mode: payForm.paymentMode, remarks: payForm.remarks }),
    });
    if (res.ok) { toast.success("Fee collected"); setShowPayForm(false); setPayForm(initPayForm); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const addStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().getFullYear();
    const res = await fetch("/api/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "structure", classId: structForm.classId || undefined, feeType: structForm.name, amount: Number(structForm.amount), academicYear: `${now}-${String(now + 1).slice(2)}` }),
    });
    if (res.ok) { toast.success("Fee structure created"); setShowStructForm(false); setStructForm(initStruct); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const filtered = search ? payments.filter(p => p.student.name.toLowerCase().includes(search.toLowerCase()) || p.student.admissionNo.includes(search)) : payments;
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);

  const downloadCSV = () => {
    const rows = [["Receipt No", "Student", "Adm. No.", "Class", "Fee Head", "Amount", "Mode", "Date"]];
    filtered.forEach(p => rows.push([p.receiptNo, p.student.name, p.student.admissionNo, `${p.student.section?.class?.name || ""} ${p.student.section?.name || ""}`, p.feeStructure?.name || "", String(p.amount), p.mode || "CASH", new Date(p.paymentDate).toLocaleDateString("en-IN")]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "fee-collection.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-sm text-gray-500 mt-1">Total collected: {fmt(totalCollected)} · {payments.length} transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"><Download className="w-4 h-4" /> Export</button>
          {tab === "collect" && <button onClick={() => setShowPayForm(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"><Plus className="w-4 h-4" /> Collect Fee</button>}
          {tab === "structures" && <button onClick={() => setShowStructForm(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"><Plus className="w-4 h-4" /> Add Structure</button>}
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {([["collect", "Payment Records"], ["structures", "Fee Structures"]] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-2 px-4 text-sm font-medium border-b-2 transition ${tab === t ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{l}</button>
        ))}
      </div>

      {tab === "collect" && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name or admission no…" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{["Receipt No", "Student", "Fee Head", "Amount", "Mode", "Date"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading…</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No payments found</td></tr>}
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.receiptNo}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.student.name}<span className="block text-xs text-gray-400">{p.student.admissionNo}</span></td>
                    <td className="px-4 py-3 text-gray-600">{p.feeStructure?.name || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{(p.mode || "CASH").toLowerCase()}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "structures" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{["Name", "Class", "Term", "Amount"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && <tr><td colSpan={4} className="py-8 text-center text-gray-400">Loading…</td></tr>}
              {!loading && structures.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400">No fee structures defined yet</td></tr>}
              {structures.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.class?.name || "All Classes"}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{s.term.toLowerCase()}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{fmt(s.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Collect Fee Modal */}
      {showPayForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Collect Fee</h2>
              <button onClick={() => setShowPayForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={collectFee} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Student *</label>
                <select value={payForm.studentId} onChange={e => setPayForm(f => ({ ...f, studentId: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">— Select Student —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fee Head *</label>
                <select value={payForm.feeStructureId} onChange={e => { const s = structures.find(st => st.id === e.target.value); setPayForm(f => ({ ...f, feeStructureId: e.target.value, amount: s ? String(s.amount) : f.amount })); }} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">— Select Fee Head —</option>
                  {structures.map(s => <option key={s.id} value={s.id}>{s.name} ({fmt(s.amount)})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input type="number" min="1" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select value={payForm.paymentMode} onChange={e => setPayForm(f => ({ ...f, paymentMode: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Receipt No.</label>
                <input value={payForm.receiptNo} onChange={e => setPayForm(f => ({ ...f, receiptNo: e.target.value }))} placeholder="Auto-generated if blank" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowPayForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Collect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Structure Modal */}
      {showStructForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Fee Structure</h2>
              <button onClick={() => setShowStructForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={addStructure} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fee Name *</label>
                <input value={structForm.name} onChange={e => setStructForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Tuition Fee, Transport Fee" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input type="number" min="1" value={structForm.amount} onChange={e => setStructForm(f => ({ ...f, amount: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Term</label>
                  <select value={structForm.term} onChange={e => setStructForm(f => ({ ...f, term: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {["MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Class (leave blank for all)</label>
                <select value={structForm.classId} onChange={e => setStructForm(f => ({ ...f, classId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowStructForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
