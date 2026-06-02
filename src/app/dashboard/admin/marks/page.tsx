"use client";

import { useState, useEffect } from "react";
import { Save, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import { calculateGrade } from "@/lib/utils";

interface Student { id: string; rollNo: string; name: string; }
interface Exam { id: string; name: string; year: number; }
interface Subject { id: string; name: string; maxMarks: number; }

export default function MarksAdminPage() {
  const [classes, setClasses] = useState<{ id: string; name: string; sections: { id: string; name: string }[] }[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [examModal, setExamModal] = useState(false);
  const [newExam, setNewExam] = useState({ name: "", year: String(new Date().getFullYear()) });

  useEffect(() => {
    fetch("/api/classes").then(r => r.json()).then(d => setClasses(d.classes || []));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    fetch(`/api/exams?classId=${selectedClass}`).then(r => r.json()).then(d => setExams(d.exams || []));
    fetch(`/api/subjects?classId=${selectedClass}`).then(r => r.json()).then(d => setSubjects(d.subjects || []));
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedSection) return;
    fetch(`/api/students?sectionId=${selectedSection}&status=ACTIVE`).then(r => r.json()).then(d =>
      setStudents((d.students || []).sort((a: Student, b: Student) => Number(a.rollNo) - Number(b.rollNo)))
    );
  }, [selectedSection]);

  useEffect(() => {
    if (!selectedExam || !selectedSubject || !selectedSection) return;
    fetch(`/api/marks?examId=${selectedExam}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, string> = {};
        (d.marks || []).filter((m: { subjectId: string }) => m.subjectId === selectedSubject)
          .forEach((m: { studentId: string; marks: number | null }) => {
            map[m.studentId] = m.marks !== null ? String(m.marks) : "";
          });
        setMarks(map);
      });
  }, [selectedExam, selectedSubject, selectedSection]);

  const handleSave = async () => {
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
      if (res.ok) toast.success("Marks saved!");
      else toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newExam, classId: selectedClass || null, year: Number(newExam.year) }),
    });
    if (res.ok) {
      toast.success("Exam added");
      setExamModal(false);
      if (selectedClass) {
        fetch(`/api/exams?classId=${selectedClass}`).then(r => r.json()).then(d => setExams(d.exams || []));
      }
    }
  };

  const currentSubject = subjects.find(s => s.id === selectedSubject);
  const sections = classes.find(c => c.id === selectedClass)?.sections || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Marks Entry</h1>
        <Button size="sm" variant="secondary" onClick={() => setExamModal(true)}>
          <Plus size={15} /> Add Exam
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Select label="Class" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(""); }}
          options={classes.map(c => ({ value: c.id, label: c.name }))} placeholder="Select Class" />
        <Select label="Section" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
          options={sections.map(s => ({ value: s.id, label: `Section ${s.name}` }))} placeholder="Select Section" disabled={!selectedClass} />
        <Select label="Exam" value={selectedExam} onChange={e => setSelectedExam(e.target.value)}
          options={exams.map(e => ({ value: e.id, label: `${e.name} (${e.year})` }))} placeholder="Select Exam" disabled={!selectedClass} />
        <Select label="Subject" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
          options={subjects.map(s => ({ value: s.id, label: `${s.name} (${s.maxMarks})` }))} placeholder="Select Subject" disabled={!selectedClass} />
      </div>

      {selectedExam && selectedSubject && selectedSection && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase">
              <div className="col-span-1">Roll</div>
              <div className="col-span-5">Name</div>
              <div className="col-span-3">Marks / {currentSubject?.maxMarks || 100}</div>
              <div className="col-span-3">Grade</div>
            </div>
            {students.map(s => {
              const m = marks[s.id];
              const percent = m && m !== "AB" && currentSubject ? (Number(m) / currentSubject.maxMarks) * 100 : 0;
              const grade = m && m !== "AB" ? calculateGrade(percent) : "—";
              return (
                <div key={s.id} className="grid grid-cols-12 items-center px-4 py-2.5 border-b border-gray-100 last:border-0">
                  <div className="col-span-1 text-sm font-medium text-gray-500">{s.rollNo}</div>
                  <div className="col-span-5 text-sm text-gray-900">{s.name}</div>
                  <div className="col-span-3">
                    <input type="text" value={m || ""} onChange={e => setMarks(prev => ({ ...prev, [s.id]: e.target.value }))}
                      placeholder="—"
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-400" />
                  </div>
                  <div className="col-span-3">
                    <span className={`text-sm font-semibold ${grade === "E" ? "text-red-500" : grade.startsWith("A") ? "text-emerald-600" : "text-gray-700"}`}>
                      {grade}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <Button onClick={handleSave} loading={saving} className="w-full md:w-auto">
            <Save size={16} /> Save Marks
          </Button>
        </>
      )}

      <Modal open={examModal} onClose={() => setExamModal(false)} title="Add New Exam" size="sm">
        <form onSubmit={handleAddExam} className="space-y-4">
          <Select label="Exam Type" required value={newExam.name} onChange={e => setNewExam(p => ({ ...p, name: e.target.value }))}
            options={["Unit Test 1", "Unit Test 2", "Half Yearly", "Annual"].map(v => ({ value: v, label: v }))}
            placeholder="Select type" />
          <Input label="Year" required type="number" value={newExam.year} onChange={e => setNewExam(p => ({ ...p, year: e.target.value }))} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setExamModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Add Exam</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
