"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, CalendarClock, BookMarked, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Leave {
  id: string; fromDate: string; toDate: string; reason: string; leaveType: string;
  status: "PENDING" | "APPROVED" | "REJECTED"; appliedAt: string; remarks: string | null;
  teacher: { id: string; name: string };
}
interface LessonPlan {
  id: string; topic: string; date: string; status: string;
  class: { name: string }; subject: { name: string }; teacher: { name: string };
}

type Tab = "leave" | "lessonplans" | "tc" | "reportcard";

export default function ApprovalsPage() {
  const [tab, setTab] = useState<Tab>("leave");
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  const loadLeaves = useCallback(async () => {
    setLoadingLeaves(true);
    const res = await fetch("/api/teacher/leave");
    const d = await res.json();
    setLeaves(d.leaves ?? []);
    setLoadingLeaves(false);
  }, []);

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    const res = await fetch("/api/teacher/lesson-plans");
    const d = await res.json();
    setLessonPlans(d.plans ?? []);
    setLoadingPlans(false);
  }, []);

  useEffect(() => { loadLeaves(); loadPlans(); }, [loadLeaves, loadPlans]);

  async function handleLeave(id: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch("/api/teacher/leave", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, remarks: remarks[id] ?? "" }),
    });
    if (res.ok) {
      toast.success(`Leave ${status.toLowerCase()}`);
      setLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    }
  }

  async function approvePlan(id: string) {
    const res = await fetch("/api/teacher/lesson-plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "COMPLETED" }),
    });
    if (res.ok) {
      toast.success("Lesson plan approved");
      setLessonPlans((prev) => prev.map((p) => p.id === id ? { ...p, status: "COMPLETED" } : p));
    }
  }

  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");
  const pendingPlans = lessonPlans.filter((p) => p.status === "PLANNED");

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{className?: string}>; count?: number }[] = [
    { id: "leave", label: "Teacher Leave", icon: CalendarClock, count: pendingLeaves.length },
    { id: "lessonplans", label: "Lesson Plans", icon: BookMarked, count: pendingPlans.length },
    { id: "tc", label: "Transfer Certificates", icon: FileText },
    { id: "reportcard", label: "Report Cards", icon: FileText },
  ];

  function dayDiff(from: string, to: string) {
    return Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1;
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Approvals Center</h1>
        <p className="text-gray-400 text-sm mt-0.5">Review and action all pending approval requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === id ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"}`}>
            <Icon className="w-4 h-4" />
            {label}
            {count !== undefined && count > 0 && (
              <span className={`text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${tab === id ? "bg-white text-primary-700" : "bg-red-500 text-white"}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Teacher Leave */}
      {tab === "leave" && (
        <div>
          {loadingLeaves ? <div className="text-center py-16 text-gray-400">Loading…</div> :
          leaves.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No leave applications</p></div>
          ) : (
            <div className="space-y-4">
              {leaves.map((leave) => (
                <div key={leave.id} className={`bg-white rounded-xl border p-4 shadow-sm ${leave.status === "PENDING" ? "border-amber-200" : "border-gray-200"}`}>
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${leave.status === "APPROVED" ? "bg-green-100" : leave.status === "REJECTED" ? "bg-red-100" : "bg-amber-100"}`}>
                      {leave.status === "APPROVED" ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                       leave.status === "REJECTED" ? <XCircle className="w-5 h-5 text-red-600" /> :
                       <Clock className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-800">{leave.teacher.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${leave.status === "APPROVED" ? "bg-green-100 text-green-700" : leave.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{leave.status}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{leave.leaveType}</span>
                        <span className="text-xs text-gray-400">{dayDiff(leave.fromDate, leave.toDate)} day{dayDiff(leave.fromDate, leave.toDate) !== 1 ? "s" : ""}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {new Date(leave.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – {new Date(leave.toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">{leave.reason}</p>
                      {leave.remarks && <p className="text-xs text-gray-400 mt-0.5 italic">Note: {leave.remarks}</p>}
                    </div>
                    {leave.status === "PENDING" && (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Remarks (optional)"
                          value={remarks[leave.id] ?? ""}
                          onChange={(e) => setRemarks((prev) => ({ ...prev, [leave.id]: e.target.value }))} />
                        <div className="flex gap-2">
                          <button onClick={() => handleLeave(leave.id, "APPROVED")} className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => handleLeave(leave.id, "REJECTED")} className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lesson Plans */}
      {tab === "lessonplans" && (
        <div>
          {loadingPlans ? <div className="text-center py-16 text-gray-400">Loading…</div> :
          lessonPlans.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><BookMarked className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No lesson plans</p></div>
          ) : (
            <div className="space-y-3">
              {lessonPlans.map((plan) => (
                <div key={plan.id} className={`bg-white rounded-xl border p-4 shadow-sm flex items-center gap-3 ${plan.status === "PLANNED" ? "border-blue-200" : "border-gray-200"}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${plan.status === "COMPLETED" ? "bg-green-100" : "bg-blue-100"}`}>
                    {plan.status === "COMPLETED" ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm">{plan.topic}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{plan.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {plan.class.name} · {plan.subject.name} · by {plan.teacher.name} · {new Date(plan.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  {plan.status === "PLANNED" && (
                    <button onClick={() => approvePlan(plan.id)} className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg font-medium flex-shrink-0">
                      Approve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coming Soon tabs */}
      {(tab === "tc" || tab === "reportcard") && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-500">{tab === "tc" ? "Transfer Certificate Requests" : "Report Card Release Approval"}</p>
          <p className="text-sm text-gray-400 mt-1">Coming soon — requires student TC and report card modules</p>
        </div>
      )}
    </div>
  );
}
