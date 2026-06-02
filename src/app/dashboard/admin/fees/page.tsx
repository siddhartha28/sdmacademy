"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, DollarSign, Receipt } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatCard from "@/components/ui/StatCard";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

interface FeePayment {
  id: string;
  amount: number;
  paymentDate: string;
  mode: string;
  receiptNo: string;
  isWaived: boolean;
  student: {
    name: string;
    rollNo: string;
    section: { name: string; class: { name: string } };
  };
  feeStructure?: { feeType: string };
}

interface PaymentForm {
  studentSearch: string;
  studentId: string;
  feeType: string;
  amount: string;
  mode: string;
  remarks: string;
  paymentDate: string;
}

export default function FeesPage() {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [students, setStudents] = useState<{ id: string; name: string; rollNo: string; section: { name: string; class: { name: string } } }[]>([]);
  const [form, setForm] = useState<PaymentForm>({
    studentSearch: "", studentId: "", feeType: "", amount: "", mode: "CASH", remarks: "", paymentDate: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fees?type=payments");
      const data = await res.json();
      setPayments(data.payments || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    if (form.studentSearch.length < 2) return;
    const t = setTimeout(() => {
      fetch(`/api/students?search=${form.studentSearch}&status=ACTIVE`)
        .then(r => r.json())
        .then(d => setStudents(d.students || []));
    }, 300);
    return () => clearTimeout(t);
  }, [form.studentSearch]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) { toast.error("Select a student"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: form.studentId,
          feeType: form.feeType,
          amount: form.amount,
          mode: form.mode,
          remarks: form.remarks,
          paymentDate: form.paymentDate,
        }),
      });
      if (res.ok) {
        toast.success("Payment recorded!");
        setAddOpen(false);
        fetchPayments();
      } else toast.error("Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const filtered = payments.filter(p =>
    !search || p.student.name.toLowerCase().includes(search.toLowerCase()) ||
    p.receiptNo.includes(search)
  );

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonth = payments.filter(p => {
    const d = new Date(p.paymentDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + p.amount, 0);

  const columns: Column<FeePayment>[] = [
    { key: "receiptNo", header: "Receipt No", render: v => <span className="font-mono text-xs">{String(v)}</span> },
    { key: "student", header: "Student", render: (_, row) => (
      <div><div className="font-medium text-sm">{row.student.name}</div>
      <div className="text-xs text-gray-400">{row.student.section.class.name} – {row.student.section.name}</div></div>
    )},
    { key: "feeStructure", header: "Fee Type", render: (_, row) => row.feeStructure?.feeType || "—" },
    { key: "amount", header: "Amount", render: v => <span className="font-semibold text-emerald-600">{formatCurrency(v as number)}</span> },
    { key: "mode", header: "Mode", render: v => <Badge variant="info">{String(v)}</Badge> },
    { key: "paymentDate", header: "Date", render: v => formatDate(String(v)) },
    { key: "isWaived", header: "", render: v => v ? <Badge variant="warning">Waived</Badge> : null },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-sm text-gray-500">{payments.length} payment records</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={15} /> Record Payment
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Collected" value={formatCurrency(totalCollected)} icon={DollarSign} color="success" />
        <StatCard title="This Month" value={formatCurrency(thisMonth)} icon={Receipt} color="primary" />
        <StatCard title="Total Transactions" value={payments.length} color="info" />
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search student or receipt..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No fee records" rowKey={r => r.id} />
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Record Fee Payment">
        <form onSubmit={handleAddPayment} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Student</label>
            <input type="text" placeholder="Type student name to search..." value={form.studentSearch}
              onChange={e => setForm(p => ({ ...p, studentSearch: e.target.value, studentId: "" }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            {students.length > 0 && !form.studentId && (
              <div className="border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto">
                {students.map(s => (
                  <button type="button" key={s.id}
                    onClick={() => setForm(p => ({ ...p, studentId: s.id, studentSearch: `${s.name} (${s.section.class.name})` }))}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 border-b border-gray-100 last:border-0">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.section.class.name} · Roll {s.rollNo}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Fee Type" required value={form.feeType} onChange={e => setForm(p => ({ ...p, feeType: e.target.value }))}
              options={["Tuition Fee", "Exam Fee", "Admission Fee", "Computer Fee", "Sports Fee", "Late Fine", "Other"].map(v => ({ value: v, label: v }))}
              placeholder="Select type" />
            <Input label="Amount (₹)" required type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Payment Mode" value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value }))}
              options={[{ value: "CASH", label: "Cash" }, { value: "ONLINE", label: "Online" }, { value: "CHEQUE", label: "Cheque" }]} />
            <Input label="Date" type="date" value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} />
          </div>
          <Input label="Remarks (optional)" value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>Record Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
