"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { toast } from "sonner";
import { todayString } from "@/lib/utils";

type Status = "PRESENT" | "ABSENT" | "LATE";

interface Student {
  id: string;
  rollNo: string;
  name: string;
  gender?: string;
  photoUrl?: string;
}

// Consistent avatar color per student name
const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-rose-500", "bg-amber-500",
  "bg-teal-500", "bg-indigo-500", "bg-pink-500", "bg-cyan-500",
  "bg-orange-500", "bg-lime-600",
];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

interface AttendanceRecord {
  studentId: string;
  status: Status;
}

const STATUS_CONFIG: Record<Status, { label: string; short: string; bg: string; ring: string; text: string; rowBg: string; rowBorder: string }> = {
  PRESENT: {
    label:     "Present",
    short:     "P",
    bg:        "bg-emerald-500",
    ring:      "ring-emerald-400",
    text:      "text-white",
    rowBg:     "bg-white",
    rowBorder: "border-gray-200",
  },
  ABSENT: {
    label:     "Absent",
    short:     "A",
    bg:        "bg-red-500",
    ring:      "ring-red-400",
    text:      "text-white",
    rowBg:     "bg-red-50",
    rowBorder: "border-red-300",
  },
  LATE: {
    label:     "Leave",
    short:     "L",
    bg:        "bg-amber-400",
    ring:      "ring-amber-300",
    text:      "text-white",
    rowBg:     "bg-amber-50",
    rowBorder: "border-amber-300",
  },
};

function StatusCircle({
  status,
  type,
  onClick,
  disabled,
}: {
  status: Status;
  type: Status;
  onClick: () => void;
  disabled: boolean;
}) {
  const cfg = STATUS_CONFIG[type];
  const active = status === type;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={cfg.label}
      className={`
        w-9 h-9 rounded-full flex items-center justify-center
        text-sm font-bold transition-all select-none
        ${active
          ? `${cfg.bg} ${cfg.text} shadow-md ring-2 ${cfg.ring} ring-offset-1 scale-110`
          : "bg-gray-100 text-gray-400 hover:bg-gray-200 disabled:cursor-default"
        }
      `}
    >
      {cfg.short}
    </button>
  );
}

export default function TeacherAttendancePage() {
  const [students, setStudents]     = useState<Student[]>([]);
  const [records, setRecords]       = useState<Map<string, Status>>(new Map());
  const [date, setDate]             = useState(todayString());
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [submitted, setSubmitted]   = useState(false);
  const [sectionId, setSectionId]   = useState<string | null>(null);
  const [sectionName, setSectionName] = useState("");
  const [user, setUser]             = useState<{ classId?: string | null; name: string } | null>(null);

  const isLocked = false; // 10 AM lock disabled — will be enabled in final version

  // Load teacher's class
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.user) return (window.location.href = "/login");
        setUser(d.user);
        if (!d.user.classId) return;

        const classRes = await fetch("/api/classes");
        const classData = await classRes.json();
        const cls = classData.classes?.find((c: { id: string }) => c.id === d.user.classId);
        if (cls?.sections?.length > 0) {
          const sec = cls.sections[0];
          setSectionId(sec.id);
          setSectionName(`${cls.name} — Section ${sec.name}`);
        }
      });
  }, []);

  // Load students + existing attendance
  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/students?sectionId=${sectionId}&status=ACTIVE`).then((r) => r.json()),
      fetch(`/api/attendance?date=${date}&sectionId=${sectionId}`).then((r) => r.json()),
    ])
      .then(([studentData, attendanceData]) => {
        // Sort alphabetically — roll number = position in alphabetical order
        const studs: Student[] = (studentData.students || [])
          .sort((a: Student, b: Student) => a.name.localeCompare(b.name))
          .map((s: Student, i: number) => ({ ...s, rollNo: String(i + 1).padStart(2, "0") }));
        setStudents(studs);

        const map = new Map<string, Status>();
        studs.forEach((s) => map.set(s.id, "PRESENT")); // default all present

        if (attendanceData.attendance?.records) {
          attendanceData.attendance.records.forEach((r: AttendanceRecord) => {
            const raw = r.status as string;
            const st = (raw === "HALF_DAY" ? "LATE" : raw) as Status;
            map.set(r.studentId, st);
          });
          setSubmitted(true);
        } else {
          setSubmitted(false);
        }

        setRecords(map);
      })
      .finally(() => setLoading(false));
  }, [sectionId, date]);

  const setStatus = (studentId: string, status: Status) => {
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
        toast.success("Attendance saved!");
        setSubmitted(true);
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to submit");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const counts = {
    present: Array.from(records.values()).filter((s) => s === "PRESENT").length,
    absent:  Array.from(records.values()).filter((s) => s === "ABSENT").length,
    leave:   Array.from(records.values()).filter((s) => s === "LATE").length,
  };

  if (!user?.classId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle size={40} className="text-amber-400 mb-3" />
        <h3 className="font-semibold text-gray-700">No Class Assigned</h3>
        <p className="text-sm text-gray-400 mt-1">Contact admin to assign a class to your account.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-gray-900">Daily Attendance</h1>
          {isLocked ? (
            <Badge variant="danger" className="flex items-center gap-1">
              <Clock size={12} /> Locked after 10 AM
            </Badge>
          ) : submitted ? (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckSquare size={12} /> Saved
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-gray-500">{sectionName}</p>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm font-medium text-gray-600">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={todayString()}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: "Present", value: counts.present, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Absent",  value: counts.absent,  color: "text-red-600",     bg: "bg-red-50 border-red-200"         },
          { label: "Leave",   value: counts.leave,   color: "text-amber-600",   bg: "bg-amber-50 border-amber-200"     },
          { label: "Total",   value: students.length, color: "text-gray-700",   bg: "bg-gray-50 border-gray-200"       },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-3 text-center ${s.bg}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className={`text-xs font-medium ${s.color} opacity-80`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <span className="text-xs text-gray-400 font-medium">Tap circles to mark:</span>
        {(["PRESENT", "ABSENT", "LATE"] as Status[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full ${STATUS_CONFIG[s].bg} flex items-center justify-center`}>
              <span className="text-white text-[10px] font-bold">{STATUS_CONFIG[s].short}</span>
            </div>
            <span className="text-xs text-gray-500">{STATUS_CONFIG[s].label}</span>
          </div>
        ))}
      </div>

      {/* Student List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No students found in this class</div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => {
            const status = (records.get(student.id) || "PRESENT") as Status;
            const cfg = STATUS_CONFIG[status];

            const color = avatarColor(student.name);

            return (
              <div
                key={student.id}
                className={`border rounded-xl px-3 sm:px-4 py-3 flex items-center gap-3 transition-all ${cfg.rowBg} ${cfg.rowBorder}`}
              >
                {/* Avatar — photo or initials placeholder */}
                <div className="relative flex-shrink-0">
                  {student.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-sm border-2 border-white ${color}`}>
                      {initials(student.name)}
                    </div>
                  )}
                  {/* Roll no badge */}
                  <span className="absolute -bottom-1 -right-1 bg-white border border-gray-200 text-gray-600 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm leading-none">
                    {student.rollNo}
                  </span>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{student.name}</div>
                  <div className="text-xs text-gray-400">{student.gender || "—"}</div>
                </div>

                {/* P / A / L circles */}
                {isLocked ? (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.bg} text-white`}>
                    {cfg.short}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {(["PRESENT", "ABSENT", "LATE"] as Status[]).map((s) => (
                      <StatusCircle
                        key={s}
                        status={status}
                        type={s}
                        onClick={() => setStatus(student.id, s)}
                        disabled={isLocked}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Submit */}
      {!isLocked && students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-200 lg:static lg:mt-6 lg:bg-transparent lg:border-0 lg:p-0 lg:backdrop-blur-none">
          <Button
            className="w-full py-3 text-base rounded-xl shadow-lg"
            variant="success"
            onClick={handleSubmit}
            loading={submitting}
          >
            <CheckSquare size={18} />
            {submitted ? "Update Attendance" : "Submit Attendance"}
          </Button>
        </div>
      )}
    </div>
  );
}
