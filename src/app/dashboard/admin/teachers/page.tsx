"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, UserX } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { toast } from "sonner";

interface Teacher {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  isActive: boolean;
  class?: { name: string };
}

interface TeacherForm {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: string;
  classId: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [form, setForm] = useState<TeacherForm>({ name: "", phone: "", email: "", password: "", role: "TEACHER", classId: "" });

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      setTeachers(data.teachers || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
    fetch("/api/classes").then(r => r.json()).then(d => setClasses(d.classes || []));
  }, [fetchTeachers]);

  const resetForm = () => setForm({ name: "", phone: "", email: "", password: "", role: "TEACHER", classId: "" });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, classId: form.classId || undefined }),
    });
    if (res.ok) {
      toast.success("Staff member added");
      setAddOpen(false);
      resetForm();
      fetchTeachers();
    } else {
      const d = await res.json();
      toast.error(d.error);
    }
  };

  const handleDeactivate = async (id: string) => {
    await fetch(`/api/teachers/${id}`, { method: "DELETE" });
    toast.success("Staff deactivated");
    fetchTeachers();
  };

  const columns: Column<Teacher>[] = [
    { key: "name", header: "Name", render: (_, row) => <div className="font-medium">{row.name}</div> },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email", render: (v) => <span className="text-gray-500 text-sm">{v ? String(v) : "—"}</span> },
    { key: "role", header: "Role", render: (v) => <Badge variant={v === "PRINCIPAL" ? "primary" : v === "ADMIN" ? "warning" : "info"}>{String(v)}</Badge> },
    { key: "class", header: "Class", render: (_, row) => <span>{row.class?.name || "—"}</span> },
    { key: "isActive", header: "Status", render: (v) => <Badge variant={v ? "success" : "neutral"}>{v ? "Active" : "Inactive"}</Badge> },
    {
      key: "id",
      header: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditTeacher(row); setForm({ name: row.name, phone: row.phone, email: row.email || "", password: "", role: row.role, classId: row.class ? "" : "" }); }} className="p-1.5 rounded hover:bg-primary-50 text-gray-400 hover:text-primary-600">
            <Edit2 size={15} />
          </button>
          {row.isActive && (
            <button onClick={() => handleDeactivate(row.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
              <UserX size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500">{teachers.length} staff members</p>
        </div>
        <Button size="sm" onClick={() => { setAddOpen(true); resetForm(); }}>
          <Plus size={15} /> Add Staff
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <DataTable columns={columns} data={teachers} loading={loading} emptyMessage="No staff members found" rowKey={(r) => r.id} />
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Staff Member">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Full Name" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" required type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <Input label="Password" required type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} hint="Minimum 6 characters" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Role" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} options={[{ value: "TEACHER", label: "Teacher" }, { value: "ADMIN", label: "Admin" }, { value: "PRINCIPAL", label: "Principal" }]} />
            <Select label="Assigned Class" value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value }))} options={classes.map(c => ({ value: c.id, label: c.name }))} placeholder="Select Class" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Add Staff</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
