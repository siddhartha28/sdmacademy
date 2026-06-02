"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, CalendarClock } from "lucide-react";
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
  teacher: { id: string; name: string };
}

const STATUS_CONFIG = {
  PENDING:  { icon: Clock,         bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  APPROVED: { icon: CheckCircle2,  bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  REJECTED: { icon: XCircle,       bg: "bg-red-50",   text: "text-red-700",   border: "border-red-200" },
};

function dayDiff(from: string, to: string) {
  return Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1;
}

export default function LeaveApprovalsPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [actionRemarks, setActionRemarks] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/teacher/leave");
    const data = await res.json();
    setLeaves(data.leaves ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAction(id: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch("/api/teacher/leave", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, remarks: actionRemarks[id] ?? "" }),
    });
    if (res.ok) {
      toast.success(`Leave ${status.toLowerCase()}`);
      setLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    } else {
      toast.error("Failed");
    }
  }

  const filtered = filter === "ALL" ? leaves : leaves.filter((l) => l.status === filter);
  const pending = leaves.filter((l) => l.status === "PENDING").length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
          <p className="text-gray-400 text-sm mt-0.5">Review and approve teacher leave applications</p>
        </div>
        {pending > 0 && (
          <span className="bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-full">
            {pending} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filter === s ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"}`}>
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            {s === "PENDING" && pending > 0 && <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">{pending}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No {filter === "ALL" ? "" : filter.toLowerCase()} leave applications
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((leave) => {
            const cfg = STATUS_CONFIG[leave.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={leave.id} className={`bg-white rounded-xl border ${cfg.border} p-4 shadow-sm`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${cfg.text}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800">{leave.teacher.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{leave.status}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{leave.leaveType}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {new Date(leave.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {" – "}
                        {new Date(leave.toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        <span className="text-gray-400 ml-2">({dayDiff(leave.fromDate, leave.toDate)} day{dayDiff(leave.fromDate, leave.toDate) !== 1 ? "s" : ""})</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                      {leave.remarks && (
                        <p className="text-xs text-gray-500 mt-1 italic">Your note: &quot;{leave.remarks}&quot;</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">Applied {new Date(leave.appliedAt).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>

                  {leave.status === "PENDING" && (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <input
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Remarks (optional)"
                        value={actionRemarks[leave.id] ?? ""}
                        onChange={(e) => setActionRemarks((prev) => ({ ...prev, [leave.id]: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(leave.id, "APPROVED")}
                          className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => handleAction(leave.id, "REJECTED")}
                          className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
