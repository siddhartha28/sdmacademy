"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, CalendarClock, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface Leave {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  leaveType: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedAt: string;
  remarks: string | null;
  substitute: { id: string; name: string } | null;
  teacher: { id: string; name: string };
}

const STATUS_CONFIG = {
  PENDING: { icon: Clock, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  APPROVED: { icon: CheckCircle2, bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  REJECTED: { icon: XCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

function dayDiff(from: string, to: string) {
  const d = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1;
  return d;
}

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromDate: "", toDate: "", reason: "", leaveType: "CASUAL" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/teacher/leave");
    const data = await res.json();
    setLeaves(data.leaves ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fromDate || !form.toDate || !form.reason) { toast.error("Fill all fields"); return; }
    if (new Date(form.fromDate) > new Date(form.toDate)) { toast.error("From date must be before to date"); return; }
    setSaving(true);
    const res = await fetch("/api/teacher/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Leave application submitted!");
      setForm({ fromDate: "", toDate: "", reason: "", leaveType: "CASUAL" });
      setShowForm(false);
      load();
    } else {
      toast.error("Failed to submit");
    }
  }

  const pending = leaves.filter((l) => l.status === "PENDING").length;
  const approved = leaves.filter((l) => l.status === "APPROVED").length;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Applications</h1>
          <p className="text-gray-400 text-sm mt-0.5">Apply for leave and track approval status</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Apply Leave"}
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{pending}</p>
          <p className="text-xs font-medium text-amber-600">Pending</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{approved}</p>
          <p className="text-xs font-medium text-green-600">Approved</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{leaves.length}</p>
          <p className="text-xs font-medium text-gray-500">Total</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">New Leave Application</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">From Date *</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.fromDate} min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">To Date *</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.toDate} min={form.fromDate || new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Leave Type</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
                <option value="CASUAL">Casual Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="EARNED">Earned Leave</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Reason *</label>
            <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="State the reason for leave..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          </div>
          {form.fromDate && form.toDate && new Date(form.fromDate) <= new Date(form.toDate) && (
            <p className="text-xs text-primary-600 font-medium">
              Total: {dayDiff(form.fromDate, form.toDate)} day{dayDiff(form.fromDate, form.toDate) !== 1 ? "s" : ""}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No leave applications yet
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => {
            const cfg = STATUS_CONFIG[leave.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={leave.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">
                        {new Date(leave.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {" "}–{" "}
                        {new Date(leave.toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{leave.status}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{leave.leaveType}</span>
                      <span className="text-xs text-gray-400">{dayDiff(leave.fromDate, leave.toDate)} day{dayDiff(leave.fromDate, leave.toDate) !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                    {leave.remarks && (
                      <p className="text-xs text-gray-500 mt-1 italic">Admin: &quot;{leave.remarks}&quot;</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Applied {new Date(leave.appliedAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
