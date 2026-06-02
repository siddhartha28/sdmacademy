"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { toast } from "sonner";
import { isAfterLockTime, todayString } from "@/lib/utils";

interface Student {
  id: string;
  rollNo: string;
  name: string;
  gender?: string;
}

interface AttendanceRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
}

export default function TeacherAttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Map<string, string>>(new Map());
  const [date, setDate] = useState(todayString());
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState("");
  const [user, setUser] = useState<{ classId?: string | null; name: string } | null>(null);

  const isLocked = isAfterLockTime() && date === todayString();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.user) return (window.location.href = "/login");
        setUser(d.user);
        if (!d.user.classId) return;

        // Get sections for this teacher's class
        const classRes = await fetch("/api/classes");
        const classData = await classRes.json();
        const cls = classData.classes?.find((c: { id: string }) => c.id === d.user.classId);
        if (cls?.sections?.length > 0) {
          const sec = cls.sections[0];
          setSectionId(sec.id);
          setSectionName(`${cls.name} – Section ${sec.name}`);
        }
      });
  }, []);

  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/students?sectionId=${sectionId}&status=ACTIVE`).then((r) => r.json()),
      fetch(`/api/attendance?date=${date}&sectionId=${sectionId}`).then((r) => r.json()),
    ])
      .then(([studentData, attendanceData]) => {
        const studs: Student[] = studentData.students || [];
        setStudents(studs.sort((a, b) => Number(a.rollNo) - Number(b.rollNo)));

        // Init all to PRESENT
        const map = new Map<string, string>();
        studs.forEach((s) => map.set(s.id, "PRESENT"));

        // Apply existing records
        if (attendanceData.attendance?.records) {
          attendanceData.attendance.records.forEach((r: AttendanceRecord) => {
            map.set(r.studentId, r.status);
          });
          setSubmitted(true);
        } else {
          setSubmitted(false);
        }

        setRecords(map);
      })
      .finally(() => setLoading(false));
  }, [sectionId, date]);

  const toggleAbsent = (studentId: string) => {
    if (isLocked) return;
    const current = records.get(studentId) || "PRESENT";
    const next = current === "PRESENT" ? "ABSENT" : "PRESENT";
    setRecords((prev) => new Map(prev).set(studentId, next));
  };

  const setStatus = (studentId: string, status: string) => {
    if (isLocked) return;
    setRecords((prev) => new Map(prev).set(studentId, status));
  };

  const handleSubmit = async () => {
    if (!sectionId) return;
    setSubmitting(true);
    try {
      const entries = Array.from(records.entries()).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, sectionId, records: entries }),
      });

      if (res.ok) {
        toast.success("Attendance submitted successfully!");
        setSubmitted(true);
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to submit");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const absentCount = Array.from(records.values()).filter((s) => s === "ABSENT").length;
  const lateCount = Array.from(records.values()).filter((s) => s === "LATE" || s === "HALF_DAY").length;
  const presentCount = students.length - absentCount - lateCount;

  if (!user?.classId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle size={40} className="text-warning mb-3" />
        <h3 className="font-semibold text-gray-700">No Class Assigned</h3>
        <p className="text-sm text-gray-400 mt-1">Contact admin to assign a class to your account.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
          {isLocked && (
            <Badge variant="danger" className="flex items-center gap-1">
              <Clock size={12} /> Locked after 10 AM
            </Badge>
          )}
          {submitted && !isLocked && (
            <Badge variant="success">
              <CheckSquare size={12} className="inline mr-1" /> Submitted
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">{sectionName}</p>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm font-medium text-gray-700">Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={todayString()}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-emerald-600">{presentCount}</div>
          <div className="text-xs text-emerald-600">Present</div>
        </div>
        <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-500">{absentCount}</div>
          <div className="text-xs text-red-500">Absent</div>
        </div>
        <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-amber-600">{lateCount}</div>
          <div className="text-xs text-amber-600">Late/Half</div>
        </div>
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-gray-700">{students.length}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => {
            const status = records.get(student.id) || "PRESENT";
            const isAbsent = status === "ABSENT";
            const isLate = status === "LATE";
            const isHalfDay = status === "HALF_DAY";

            return (
              <div
                key={student.id}
                className={`bg-white border rounded-xl p-4 flex items-center gap-3 transition-all ${
                  isAbsent
                    ? "border-red-300 bg-red-50"
                    : isLate || isHalfDay
                    ? "border-amber-300 bg-amber-50"
                    : "border-gray-200"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: isAbsent ? "#fee2e2" : isLate ? "#fef3c7" : "#dcfce7",
                    color: isAbsent ? "#dc2626" : isLate ? "#d97706" : "#16a34a",
                  }}
                >
                  {student.rollNo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{student.name}</div>
                  <div className="text-xs text-gray-400">{student.gender || ""}</div>
                </div>

                {/* Status buttons */}
                {!isLocked ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setStatus(student.id, "PRESENT")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        status === "PRESENT"
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-emerald-50"
                      }`}
                    >
                      P
                    </button>
                    <button
                      onClick={() => setStatus(student.id, "ABSENT")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        status === "ABSENT"
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-red-50"
                      }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setStatus(student.id, "LATE")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        status === "LATE"
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-amber-50"
                      }`}
                    >
                      L
                    </button>
                  </div>
                ) : (
                  <Badge
                    variant={
                      status === "PRESENT"
                        ? "success"
                        : status === "ABSENT"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {status}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Button */}
      {!isLocked && students.length > 0 && (
        <div className="mt-6 sticky bottom-4">
          <Button
            className="w-full py-4 text-base rounded-xl shadow-lg"
            variant="success"
            onClick={handleSubmit}
            loading={submitting}
          >
            <CheckSquare size={20} />
            {submitted ? "Update Attendance" : "Submit Attendance"}
          </Button>
        </div>
      )}
    </div>
  );
}
