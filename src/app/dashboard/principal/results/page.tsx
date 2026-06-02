"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Exam { id: string; name: string; year: number; class: { name: string } | null; }
interface MarksEntry {
  marks: number | null; isAbsent: boolean;
  subject: { name: string; maxMarks: number };
  student: { name: string; section: { class: { name: string } } };
}

interface SubjectSummary {
  name: string; avg: number; max: number; min: number; pass: number; fail: number; total: number;
}

export default function ResultsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [entries, setEntries] = useState<MarksEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjectSummaries, setSubjectSummaries] = useState<SubjectSummary[]>([]);

  useEffect(() => {
    fetch("/api/exams").then((r) => r.json()).then((d) => {
      const list = d.exams ?? [];
      setExams(list);
      if (list.length > 0) setSelectedExam(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedExam) return;
    setLoading(true);
    fetch(`/api/marks?examId=${selectedExam}&limit=500`).then((r) => r.json()).then((d) => {
      const e: MarksEntry[] = d.entries ?? d.marks ?? [];
      setEntries(e);

      // Build per-subject summaries
      const subMap: Record<string, { marks: number[]; max: number; pass: number; fail: number }> = {};
      for (const entry of e) {
        const sn = entry.subject.name;
        if (!subMap[sn]) subMap[sn] = { marks: [], max: entry.subject.maxMarks, pass: 0, fail: 0 };
        if (!entry.isAbsent && entry.marks !== null) {
          subMap[sn].marks.push(entry.marks);
          const passing = entry.subject.maxMarks * 0.33;
          if (entry.marks >= passing) subMap[sn].pass++;
          else subMap[sn].fail++;
        }
      }
      const summaries: SubjectSummary[] = Object.entries(subMap).map(([name, v]) => ({
        name,
        avg: v.marks.length ? Math.round(v.marks.reduce((a, b) => a + b, 0) / v.marks.length) : 0,
        max: v.marks.length ? Math.round(Math.max(...v.marks)) : 0,
        min: v.marks.length ? Math.round(Math.min(...v.marks)) : 0,
        pass: v.pass,
        fail: v.fail,
        total: v.marks.length,
      }));
      setSubjectSummaries(summaries.sort((a, b) => b.avg - a.avg));
      setLoading(false);
    });
  }, [selectedExam]);

  const selectedExamInfo = exams.find((e) => e.id === selectedExam);
  const totalStudents = entries.length > 0 ? new Set(entries.map((e) => e.student.name)).size : 0;
  const overallAvg = subjectSummaries.length > 0
    ? Math.round(subjectSummaries.reduce((sum, s) => sum + s.avg, 0) / subjectSummaries.length) : 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results & Performance</h1>
          <p className="text-gray-400 text-sm mt-0.5">Subject-wise and class-wise marks analysis</p>
        </div>
        <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
          value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
          <option value="">Select Exam</option>
          {exams.map((e) => <option key={e.id} value={e.id}>{e.name} {e.year}</option>)}
        </select>
      </div>

      {selectedExam && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-primary-600">{totalStudents}</p>
              <p className="text-xs text-gray-500 mt-0.5">Students Assessed</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-700">{overallAvg}</p>
              <p className="text-xs text-gray-500 mt-0.5">Overall Avg Marks</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-blue-700">{subjectSummaries.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Subjects Evaluated</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-amber-700">
                {subjectSummaries.reduce((s, x) => s + x.pass, 0)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Total Pass Count</p>
            </div>
          </div>

          {/* Bar Chart */}
          {subjectSummaries.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-4">Average Marks by Subject</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={subjectSummaries} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {subjectSummaries.map((s) => (
                      <Cell key={s.name} fill={s.avg >= 70 ? "#22c55e" : s.avg >= 50 ? "#f59e0b" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subject Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Subject-wise Summary — {selectedExamInfo?.name}</h2>
            </div>
            {subjectSummaries.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No marks data for this exam</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Subject</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Avg</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Highest</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Lowest</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Pass</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Fail</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Pass %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {subjectSummaries.map((s) => {
                      const passPct = s.total > 0 ? Math.round((s.pass / s.total) * 100) : 0;
                      return (
                        <tr key={s.name} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                          <td className="px-3 py-3 text-center font-semibold">
                            <span className={s.avg >= 70 ? "text-green-600" : s.avg >= 50 ? "text-amber-600" : "text-red-600"}>{s.avg}</span>
                          </td>
                          <td className="px-3 py-3 text-center text-green-600">{s.max}</td>
                          <td className="px-3 py-3 text-center text-red-500">{s.min}</td>
                          <td className="px-3 py-3 text-center text-green-600 font-medium">{s.pass}</td>
                          <td className="px-3 py-3 text-center text-red-500 font-medium">{s.fail}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`font-bold ${passPct >= 75 ? "text-green-600" : passPct >= 50 ? "text-amber-600" : "text-red-600"}`}>{passPct}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!selectedExam && (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Select an exam to view results
        </div>
      )}
      {loading && <div className="text-center py-16 text-gray-400">Loading marks data…</div>}
    </div>
  );
}
