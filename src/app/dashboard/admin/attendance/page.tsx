"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, Calendar } from "lucide-react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { toast } from "sonner";
import { todayString, formatDate } from "@/lib/utils";

interface AttendanceRecord {
  studentId: string;
  status: string;
  student?: { name: string; rollNo: string };
}

interface AttendanceData {
  id: string;
  date: string;
  isLocked: boolean;
  submittedAt: string;
  records: AttendanceRecord[];
  section: { name: string; class: { name: string } };
  teacher: { name: string };
}

export default function AttendanceAdminPage() {
  const [date, setDate] = useState(todayString());
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [classes, setClasses] = useState<{ id: string; name: string; sections: { id: string; name: string }[] }[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/classes").then(r => r.json()).then(d => setClasses(d.classes || []));
  }, []);

  useEffect(() => {
    if (!selectedSection || !date) return;
    setLoading(true);
    fetch(`/api/attendance?date=${date}&sectionId=${selectedSection}`)
      .then(r => r.json())
      .then(d => setAttendance(d.attendance))
      .finally(() => setLoading(false));
  }, [selectedSection, date]);

  const handleUnlock = async () => {
    if (!attendance) return;
    const res = await fetch("/api/attendance/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, sectionId: selectedSection }),
    });
    if (res.ok) {
      toast.success("Attendance unlocked for editing");
      setAttendance(prev => prev ? { ...prev, isLocked: false } : prev);
    }
  };

  const sections = classes.find(c => c.id === selectedClass)?.sections || [];
  const present = attendance?.records.filter(r => r.status === "PRESENT").length || 0;
  const absent = attendance?.records.filter(r => r.status === "ABSENT").length || 0;
  const late = attendance?.records.filter(r => r.status === "LATE" || r.status === "HALF_DAY").length || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Attendance Records</h1>
          <p className="text-sm text-gray-500">View and manage attendance</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input type="date" value={date} max={todayString()} onChange={e => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
        <Select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(""); }}
          options={classes.map(c => ({ value: c.id, label: c.name }))} placeholder="Select Class"
          className="min-w-36" />
        <Select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
          options={sections.map(s => ({ value: s.id, label: `Section ${s.name}` }))}
          placeholder="Select Section" disabled={!selectedClass} className="min-w-36" />
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && selectedSection && !attendance && (
        <div className="text-center py-12 text-gray-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p>No attendance submitted for this date.</p>
        </div>
      )}

      {!loading && attendance && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-600">{present}</div>
                <div className="text-xs text-gray-500">Present</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-500">{absent}</div>
                <div className="text-xs text-gray-500">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-amber-600">{late}</div>
                <div className="text-xs text-gray-500">Late/Half</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                Submitted by <span className="font-medium">{attendance.teacher?.name}</span>
                {" "}at {new Date(attendance.submittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
              {attendance.isLocked ? (
                <Button size="sm" variant="outline" onClick={handleUnlock}>
                  <Unlock size={14} /> Unlock
                </Button>
              ) : (
                <Badge variant="success">
                  <Lock size={11} className="inline mr-1" /> Unlocked
                </Badge>
              )}
            </div>
          </div>

          {/* Records */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {attendance.records.map(record => (
              <div key={record.studentId} className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 last:border-0">
                <div className="font-medium text-sm text-gray-500 w-8">{record.student?.rollNo}</div>
                <div className="flex-1 text-sm text-gray-900">{record.student?.name}</div>
                <Badge variant={
                  record.status === "PRESENT" ? "success" :
                  record.status === "ABSENT" ? "danger" : "warning"
                }>
                  {record.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
