"use client";

import { useState, useEffect } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { getAcademicYear } from "@/lib/utils";

interface Section {
  id: string;
  name: string;
  classId: string;
}

interface ClassWithSections {
  id: string;
  name: string;
  order: number;
  sections: Section[];
}

interface StudentData {
  id?: string;
  name: string;
  rollNo: string;
  sectionId: string;
  gender?: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
  address?: string;
  admissionNo?: string;
  admissionYear?: number;
  status?: string;
}

interface StudentFormProps {
  student?: StudentData;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StudentForm({ student, onSuccess, onCancel }: StudentFormProps) {
  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<StudentData>({
    name: student?.name || "",
    rollNo: student?.rollNo || "",
    sectionId: student?.sectionId || "",
    gender: student?.gender || "",
    dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
    fatherName: student?.fatherName || "",
    motherName: student?.motherName || "",
    phone: student?.phone || "",
    address: student?.address || "",
    admissionNo: student?.admissionNo || "",
    admissionYear: student?.admissionYear || new Date().getFullYear(),
    status: student?.status || "ACTIVE",
  });

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((d) => {
        const cls = d.classes || [];
        setClasses(cls);
        if (student?.sectionId) {
          const c = cls.find((c: ClassWithSections) =>
            c.sections.some((s: Section) => s.id === student.sectionId)
          );
          if (c) setSelectedClass(c.id);
        }
      });
  }, [student]);

  const sections =
    classes.find((c) => c.id === selectedClass)?.sections || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = student?.id ? "PUT" : "POST";
      const url = student?.id ? `/api/students/${student.id}` : "/api/students";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof StudentData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Full Name"
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Student's full name"
        />
        <Input
          label="Roll Number"
          required
          value={form.rollNo}
          onChange={(e) => set("rollNo", e.target.value)}
          placeholder="e.g. 01"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Class"
          required
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            set("sectionId", "");
          }}
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select Class"
        />
        <Select
          label="Section"
          required
          value={form.sectionId}
          onChange={(e) => set("sectionId", e.target.value)}
          options={sections.map((s) => ({ value: s.id, label: `Section ${s.name}` }))}
          placeholder="Select Section"
          disabled={!selectedClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Gender"
          value={form.gender || ""}
          onChange={(e) => set("gender", e.target.value)}
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
          ]}
          placeholder="Select Gender"
        />
        <Input
          label="Date of Birth"
          type="date"
          value={form.dateOfBirth || ""}
          onChange={(e) => set("dateOfBirth", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Father's Name"
          value={form.fatherName || ""}
          onChange={(e) => set("fatherName", e.target.value)}
          placeholder="Father's full name"
        />
        <Input
          label="Mother's Name"
          value={form.motherName || ""}
          onChange={(e) => set("motherName", e.target.value)}
          placeholder="Mother's full name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Contact Phone"
          type="tel"
          value={form.phone || ""}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+91XXXXXXXXXX"
        />
        <Input
          label="Admission No."
          value={form.admissionNo || ""}
          onChange={(e) => set("admissionNo", e.target.value)}
          placeholder="e.g. ADM-2024-001"
        />
      </div>

      <Input
        label="Address"
        value={form.address || ""}
        onChange={(e) => set("address", e.target.value)}
        placeholder="Home address"
      />

      {student?.id && (
        <Select
          label="Status"
          value={form.status || "ACTIVE"}
          onChange={(e) => set("status", e.target.value)}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "PASSED_OUT", label: "Passed Out" },
            { value: "LEFT", label: "Left" },
          ]}
        />
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          {student?.id ? "Update Student" : "Add Student"}
        </Button>
      </div>
    </form>
  );
}
