"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Phone, Search } from "lucide-react";

interface ClassItem { id: string; name: string; isClassTeacher: boolean; }
interface Student {
  id: string;
  name: string;
  rollNo: string;
  gender: string | null;
  fatherName: string | null;
  phone: string | null;
  admissionNo: string | null;
  photoUrl: string | null;
  status: string;
  section: { id: string; name: string; class: { id: string; name: string } };
}

const COLORS = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500", "bg-red-500", "bg-teal-500", "bg-pink-500", "bg-indigo-500"];
const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
const colorFor = (name: string) => COLORS[name.charCodeAt(0) % COLORS.length];

export default function TeacherStudentsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async (classId: string) => {
    if (!classId) { setStudents([]); setLoading(false); return; }
    setLoading(true);
    const res = await fetch(`/api/students?classId=${classId}&status=ACTIVE&limit=200`);
    const data = await res.json();
    const sorted = (data.students ?? []).sort((a: Student, b: Student) => a.name.localeCompare(b.name));
    setStudents(sorted);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/teacher/me").then((r) => r.json()).then((me) => {
      const cls = me.classes ?? [];
      setClasses(cls);
      if (cls.length > 0) {
        setSelectedClass(cls[0].id);
        load(cls[0].id);
      } else {
        setLoading(false);
      }
    });
  }, [load]);

  useEffect(() => {
    if (selectedClass) load(selectedClass);
  }, [selectedClass, load]);

  const filtered = students.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.includes(search) ||
    (s.admissionNo ?? "").includes(search)
  );

  const selectedClassInfo = classes.find((c) => c.id === selectedClass);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-400 text-sm mt-0.5">Students in your assigned classes</p>
      </div>

      {classes.length === 0 && !loading ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No classes assigned yet
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex gap-2 flex-wrap">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    selectedClass === cls.id
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
                  }`}
                >
                  {cls.name}
                  {cls.isClassTeacher && <span className="ml-1 text-xs opacity-75">(CT)</span>}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {selectedClassInfo && (
            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">{selectedClassInfo.name}</span>
              <span className="text-xs text-gray-400">{filtered.length} student{filtered.length !== 1 ? "s" : ""}</span>
              {selectedClassInfo.isClassTeacher && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">You are Class Teacher</span>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              No students found
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((student, idx) => (
                <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                  <div className="relative flex-shrink-0">
                    {student.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={student.photoUrl} alt={student.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow ${colorFor(student.name)}`}>
                        {initials(student.name)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 bg-white border border-gray-200 text-gray-600 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{student.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Roll {student.rollNo}
                      {student.admissionNo && <span> · Adm {student.admissionNo}</span>}
                    </p>
                    {student.fatherName && <p className="text-xs text-gray-400 truncate">{student.fatherName}</p>}
                    {student.phone && (
                      <a href={`tel:${student.phone}`} className="text-xs text-primary-600 flex items-center gap-1 mt-0.5 hover:underline">
                        <Phone className="w-3 h-3" /> {student.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
