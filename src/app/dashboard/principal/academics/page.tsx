"use client";

import { useState, useEffect } from "react";
import { BookMarked, CheckCircle2, Clock, XCircle, FileText, BarChart2 } from "lucide-react";

interface LessonPlan {
  id: string; topic: string; date: string; status: string; duration: number | null;
  class: { id: string; name: string }; subject: { id: string; name: string }; teacher: { name: string };
}
interface Homework {
  id: string; title: string; dueDate: string;
  class: { name: string }; subject: { name: string }; teacher: { name: string };
  _count: { submissions: number };
}

const STATUS_CFG: Record<string, { bg: string; text: string; icon: React.ComponentType<{className?: string}> }> = {
  PLANNED:   { bg: "bg-blue-100",  text: "text-blue-700",  icon: Clock },
  COMPLETED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
  SKIPPED:   { bg: "bg-red-100",   text: "text-red-700",   icon: XCircle },
};

export default function AcademicsPage() {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"lessons" | "homework">("lessons");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/teacher/lesson-plans").then((r) => r.json()),
      fetch("/api/teacher/homework").then((r) => r.json()),
    ]).then(([lp, hw]) => {
      setPlans(lp.plans ?? []);
      setHomework(hw.homework ?? []);
      setLoading(false);
    });
  }, []);

  const classes = [...new Set(plans.map((p) => p.class.name))].sort();

  const filteredPlans = plans.filter((p) =>
    (!filterClass || p.class.name === filterClass) &&
    (!filterStatus || p.status === filterStatus)
  );

  const completionRate = plans.length > 0
    ? Math.round((plans.filter((p) => p.status === "COMPLETED").length / plans.length) * 100)
    : 0;

  const plannedCount = plans.filter((p) => p.status === "PLANNED").length;
  const completedCount = plans.filter((p) => p.status === "COMPLETED").length;
  const skippedCount = plans.filter((p) => p.status === "SKIPPED").length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Academic Oversight</h1>
        <p className="text-gray-400 text-sm mt-0.5">Monitor lesson plans, syllabus progress, and homework across all classes</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-primary-600">{plans.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Plans</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{completedCount}</p>
          <p className="text-xs text-green-600 mt-0.5">Completed</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{plannedCount}</p>
          <p className="text-xs text-blue-600 mt-0.5">Planned</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{completionRate}%</p>
          <p className="text-xs text-amber-600 mt-0.5">Completion</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab("lessons")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "lessons" ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200"}`}>
          <BookMarked className="w-4 h-4" /> Lesson Plans ({plans.length})
        </button>
        <button onClick={() => setTab("homework")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "homework" ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200"}`}>
          <FileText className="w-4 h-4" /> Homework ({homework.length})
        </button>
      </div>

      {/* Filters for lesson plans */}
      {tab === "lessons" && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-44"
            value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-44"
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="PLANNED">Planned</option>
            <option value="COMPLETED">Completed</option>
            <option value="SKIPPED">Skipped</option>
          </select>
          <span className="text-sm text-gray-400 self-center">{filteredPlans.length} plans</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : tab === "lessons" ? (
        <div className="space-y-3">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><BookMarked className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No lesson plans found</p></div>
          ) : filteredPlans.map((plan) => {
            const cfg = STATUS_CFG[plan.status] ?? STATUS_CFG.PLANNED;
            const StatusIcon = cfg.icon;
            return (
              <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <StatusIcon className={`w-5 h-5 ${cfg.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">{plan.topic}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{plan.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {plan.class.name} · {plan.subject.name} · {plan.teacher.name}
                    {plan.duration && <span> · {plan.duration} min</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(plan.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {homework.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><FileText className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No homework assigned</p></div>
          ) : homework.map((hw) => {
            const overdue = new Date(hw.dueDate) < new Date();
            return (
              <div key={hw.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${overdue ? "bg-red-100" : "bg-amber-100"}`}>
                  <FileText className={`w-5 h-5 ${overdue ? "text-red-600" : "text-amber-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{hw.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{hw.class.name} · {hw.subject.name} · {hw.teacher.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Due: {new Date(hw.dueDate).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                  <BarChart2 className="w-3.5 h-3.5" /> {hw._count.submissions}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
