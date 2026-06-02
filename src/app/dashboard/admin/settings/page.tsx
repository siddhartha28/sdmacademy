"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";
import { FEE_TYPES, SUBJECTS_BY_CLASS } from "@/lib/constants";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [feeModal, setFeeModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [examModal, setExamModal] = useState(false);
  const [feeForm, setFeeForm] = useState({ classId: "", feeType: "", amount: "", academicYear: "" });
  const [subjectForm, setSubjectForm] = useState({ name: "", classId: "", maxMarks: "100" });
  const [examForm, setExamForm] = useState({ name: "", year: String(new Date().getFullYear()) });

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => setSettings(d.settings || {}));
    fetch("/api/classes").then(r => r.json()).then(d => setClasses(d.classes || []));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) toast.success("Settings saved");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "structure", ...feeForm }),
    });
    if (res.ok) {
      toast.success("Fee structure saved");
      setFeeModal(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...subjectForm, classId: subjectForm.classId || null }),
    });
    if (res.ok) {
      toast.success("Subject added");
      setSubjectModal(false);
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: examForm.name, year: Number(examForm.year) }),
    });
    if (res.ok) {
      toast.success("Exam type added");
      setExamModal(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">System Settings</h1>

      {/* School Info */}
      <Card>
        <CardHeader title="School Information" subtitle="Update school name, contact, and academic year" />
        <CardBody>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="School Name" value={settings.schoolName || "S.D.M. Academy Shaulana"}
                onChange={e => setSettings(p => ({ ...p, schoolName: e.target.value }))} />
              <Input label="Principal Name" value={settings.principalName || "Ms. Mansi Sharma"}
                onChange={e => setSettings(p => ({ ...p, principalName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" value={settings.phone || ""}
                onChange={e => setSettings(p => ({ ...p, phone: e.target.value }))} />
              <Input label="WhatsApp" value={settings.whatsapp || ""}
                onChange={e => setSettings(p => ({ ...p, whatsapp: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" value={settings.email || ""}
                onChange={e => setSettings(p => ({ ...p, email: e.target.value }))} />
              <Input label="Current Academic Year" value={settings.academicYear || "2024-25"}
                onChange={e => setSettings(p => ({ ...p, academicYear: e.target.value }))}
                hint="e.g. 2024-25" />
            </div>
            <Input label="Address" value={settings.address || ""}
              onChange={e => setSettings(p => ({ ...p, address: e.target.value }))} />
            <Button type="submit" loading={saving}>
              <Save size={15} /> Save Settings
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Fee Structure */}
      <Card>
        <CardHeader title="Fee Structure" subtitle="Define fee amounts per class"
          action={<Button size="sm" onClick={() => setFeeModal(true)}><Plus size={14} /> Add Fee</Button>} />
        <CardBody>
          <p className="text-sm text-gray-500">Use the &quot;Add Fee&quot; button to define fee structure for each class and academic year.</p>
        </CardBody>
      </Card>

      {/* Subjects */}
      <Card>
        <CardHeader title="Subjects" subtitle="Manage subjects across classes"
          action={<Button size="sm" onClick={() => setSubjectModal(true)}><Plus size={14} /> Add Subject</Button>} />
        <CardBody>
          <p className="text-sm text-gray-500">Subjects are auto-seeded from UP Board curriculum. Add custom subjects if needed.</p>
        </CardBody>
      </Card>

      {/* Exams */}
      <Card>
        <CardHeader title="Exam Types" subtitle="Configure examination types for the year"
          action={<Button size="sm" onClick={() => setExamModal(true)}><Plus size={14} /> Add Exam</Button>} />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {["Unit Test 1", "Unit Test 2", "Half Yearly", "Annual"].map(e => (
              <span key={e} className="bg-primary-50 text-primary-700 border border-primary-100 px-3 py-1 rounded-full text-sm">{e}</span>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Fee Modal */}
      <Modal open={feeModal} onClose={() => setFeeModal(false)} title="Add Fee Structure" size="sm">
        <form onSubmit={handleAddFeeStructure} className="space-y-4">
          <Select label="Class" required value={feeForm.classId} onChange={e => setFeeForm(p => ({ ...p, classId: e.target.value }))}
            options={classes.map(c => ({ value: c.id, label: c.name }))} placeholder="Select Class" />
          <Select label="Fee Type" required value={feeForm.feeType} onChange={e => setFeeForm(p => ({ ...p, feeType: e.target.value }))}
            options={FEE_TYPES.map(f => ({ value: f, label: f }))} placeholder="Select Type" />
          <Input label="Amount (₹)" required type="number" value={feeForm.amount} onChange={e => setFeeForm(p => ({ ...p, amount: e.target.value }))} />
          <Input label="Academic Year" required value={feeForm.academicYear} onChange={e => setFeeForm(p => ({ ...p, academicYear: e.target.value }))} hint="e.g. 2024-25" />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setFeeModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Subject Modal */}
      <Modal open={subjectModal} onClose={() => setSubjectModal(false)} title="Add Subject" size="sm">
        <form onSubmit={handleAddSubject} className="space-y-4">
          <Input label="Subject Name" required value={subjectForm.name} onChange={e => setSubjectForm(p => ({ ...p, name: e.target.value }))} />
          <Select label="Class (leave blank for all)" value={subjectForm.classId} onChange={e => setSubjectForm(p => ({ ...p, classId: e.target.value }))}
            options={classes.map(c => ({ value: c.id, label: c.name }))} placeholder="All Classes" />
          <Input label="Max Marks" type="number" value={subjectForm.maxMarks} onChange={e => setSubjectForm(p => ({ ...p, maxMarks: e.target.value }))} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setSubjectModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Add</Button>
          </div>
        </form>
      </Modal>

      {/* Exam Modal */}
      <Modal open={examModal} onClose={() => setExamModal(false)} title="Add Exam" size="sm">
        <form onSubmit={handleAddExam} className="space-y-4">
          <Input label="Exam Name" required value={examForm.name} onChange={e => setExamForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Unit Test 3" />
          <Input label="Year" required type="number" value={examForm.year} onChange={e => setExamForm(p => ({ ...p, year: e.target.value }))} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setExamModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Add</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
