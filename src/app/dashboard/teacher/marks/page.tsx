"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { toast } from "sonner";
import { SUBJECTS_BY_CLASS } from "@/lib/constants";

interface Student {
  id: string;
  rollNo: string;
  name: string;
}

interface Exam {
  id: string;
  name: string;
  year: number;
}

interface Subject {
  id: string;
  name: string;
  maxMarks: number;
}

export default function TeacherMarksPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [className, setClassName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(async (d) => {
      if (!d.user?.classId) return;
      const classRes = await fetch("/api/classes");
      const classData = await classRes.json();
      const cls = classData.classes?.find((c: { id: string }) => c.id === d.user.classId);
      if (cls?.sections?.length > 0) {
        setSectionId(cls.sections[0].id);
        setClassName(cls.name);
        // Load exams
        const examRes = await fetch(`/api/exams?classId=${cls.id}`);
        const examData = await examRes.json();
        setExams(examData.exams || []);
        // Load subjects
        const subjectRes = await fetch(`/api/subjects?classId=${cls.id}`);
        const subjectData = await subjectRes.json();
        setSubjects(subjectData.subjects || []);
      }
    });
  }, []);

  useEffect(() => {
    if (!sectionId) return;
    fetch(`/api/students?sectionId=${sectionId}&status=ACTIVE`)
      .then(r => r.json())
      .then(d => setStudents((d.students || []).sort((a: Student, b: Student) => Number(a.rollNo) - Number(b.rollNo))));
  }, [sectionId]);

  useEffect(() => {
    if (!selectedExam || !selectedSubject || !sectionId) return;
    fetch(`/api/marks?examId=${selectedExam}&sectionId=${sectionId}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, string> = {};
        (d.marks || []).filter((m: { subjectId: string; marks: number | null; studentId: string }) => m.subjectId === selectedSubject).forEach((m: { studentId: string; marks: number | null }) => {
          map[m.studentId] = m.marks !== null ? String(m.marks) : "";
        });
        setMarks(map);
      });
  }, [selectedExam, selectedSubject, sectionId]);

  const handleSave = async () => {
    if (!selectedExam || !selectedSubject) {
      toast.error("Select exam and subject first");
      return;
    }
    setSaving(true);
    try {
      const entries = students.map(s => ({
        studentId: s.id,
        examId: selectedExam,
        subjectId: selectedSubject,
        marks: marks[s.id] !== "" && marks[s.id] !== undefined ? Number(marks[s.id]) : null,
        isAbsent: marks[s.id] === "AB",
      }));

      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (res.ok) toast.success("Marks saved successfully");
      else toast.error("Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  const currentSubject = subjects.find(s => s.id === selectedSubject);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Marks Entry</h1>
        <p className="text-sm text-gray-500">{className}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Select
          label="Examination"
          value={selectedExam}
          onChange={e => setSelectedExam(e.target.value)}
          options={exams.map(e => ({ value: e.id, label: `${e.name} (${e.year})` }))}
          placeholder="Select Exam"
        />
        <Select
          label="Subject"
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          options={subjects.map(s => ({ value: s.id, label: `${s.name} (Max: ${s.maxMarks})` }))}
          placeholder="Select Subject"
        />
      </div>

      {selectedExam && selectedSubject && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase">
                <div className="col-span-1">Roll</div>
                <div className="col-span-7">Student Name</div>
                <div className="col-span-4">Marks / {currentSubject?.maxMarks || 100}</div>
              </div>
            </div>
            {students.map(student => (
              <div key={student.id} className="grid grid-cols-12 items-center px-4 py-2.5 border-b border-gray-100 last:border-0">
                <div className="col-span-1 text-sm font-medium text-gray-500">{student.rollNo}</div>
                <div className="col-span-7 text-sm text-gray-900">{student.name}</div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={marks[student.id] || ""}
                    onChange={e => setMarks(prev => ({ ...prev, [student.id]: e.target.value }))}
                    placeholder="—"
                    className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 text-center"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleSave} loading={saving} className="w-full">
            <Save size={16} /> Save All Marks
          </Button>
        </>
      )}
    </div>
  );
}
