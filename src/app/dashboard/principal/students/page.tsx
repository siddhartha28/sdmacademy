"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, GraduationCap, Phone, User } from "lucide-react";

interface ClassItem { id: string; name: string; order: number; }
interface Student {
  id: string; name: string; rollNo: string; gender: string | null;
  fatherName: string | null; phone: string | null; admissionNo: string | null;
  photoUrl: string | null; status: string;
  section: { id: string; name: string; class: { id: string; name: string } };
}

const COLORS = ["bg-blue-500","bg-green-500","bg-purple-500","bg-amber-500","bg-red-500","bg-teal-500","bg-pink-500","bg-indigo-500"];
const initials = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
const colorFor = (n: string) => COLORS[n.charCodeAt(0) % COLORS.length];

export default function PrincipalStudentsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "500" });
    if (selectedClass !== "ALL") params.set("classId", selectedClass);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/students?${params}`);
    const d = await res.json();
    const sorted = (d.students ?? []).sort((a: Student, b: Student) => a.name.localeCompare(b.name));
    setStudents(sorted);
    setTotal(d.total ?? sorted.length);
    setLoading(false);
  }, [selectedClass, statusFilter]);

  useEffect(() => {
    fetch("/api/classes").then((r) => r.json()).then((d) => setClasses(d.classes ?? []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.admissionNo ?? "").includes(search) || s.rollNo.includes(search)
  );

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-400 text-sm mt-0.5">View all student profiles across all classes</p>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-semibold px-3 py-1.5 rounded-xl">
          <GraduationCap className="w-4 h-4" />
          {total} students
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search by name, roll, admission no…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-44"
          value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="ALL">All Classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-36"
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ACTIVE">Active</option>
          <option value="">All Status</option>
          <option value="LEFT">Left</option>
          <option value="PASSED_OUT">Passed Out</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading students…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No students found
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 text-xs text-gray-400">{filtered.length} students shown</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Student</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Class</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Father&apos;s Name</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Contact</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.slice(0, 200).map((student, idx) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          {student.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={student.photoUrl} alt={student.name} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className={`w-9 h-9 rounded-full ${colorFor(student.name)} text-white font-bold text-xs flex items-center justify-center`}>
                              {initials(student.name)}
                            </div>
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 bg-white border border-gray-200 text-gray-600 text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{student.name}</p>
                          {student.admissionNo && <p className="text-xs text-gray-400">Adm: {student.admissionNo}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-600 hidden sm:table-cell">
                      {student.section.class.name}
                    </td>
                    <td className="px-3 py-3 text-gray-500 hidden md:table-cell">
                      {student.fatherName ?? <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      {student.phone ? (
                        <a href={`tel:${student.phone}`} className="text-primary-600 hover:underline flex items-center gap-1 text-xs">
                          <Phone className="w-3 h-3" /> {student.phone}
                        </a>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${student.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
