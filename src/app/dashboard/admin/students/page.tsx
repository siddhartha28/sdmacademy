"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Upload, Edit2, Trash2, Eye } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StudentForm from "@/components/forms/StudentForm";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface Student {
  id: string;
  rollNo: string;
  name: string;
  gender?: string;
  admissionNo?: string;
  phone?: string;
  status: string;
  sectionId: string;
  section: {
    id: string;
    name: string;
    class: { id: string; name: string; order: number };
  };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [classes, setClasses] = useState<{ id: string; name: string; order: number }[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "ACTIVE" });
      if (classFilter) params.set("classId", classFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      setStudents(data.students || []);
    } finally {
      setLoading(false);
    }
  }, [classFilter, search]);

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((d) => setClasses(d.classes?.map((c: { id: string; name: string; order: number }) => c) || []));
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/students/${deleteId}`, { method: "DELETE" });
    toast.success("Student archived");
    setDeleteId(null);
    fetchStudents();
  };

  const columns: Column<Student>[] = [
    { key: "rollNo", header: "Roll No", width: "20" },
    {
      key: "name",
      header: "Student",
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.admissionNo && (
            <div className="text-xs text-gray-400">Adm: {row.admissionNo}</div>
          )}
        </div>
      ),
    },
    {
      key: "section",
      header: "Class",
      render: (_, row) => (
        <span className="text-sm">
          {row.section.class.name} – {row.section.name}
        </span>
      ),
    },
    { key: "gender", header: "Gender" },
    { key: "phone", header: "Phone" },
    {
      key: "status",
      header: "Status",
      render: (v) => (
        <Badge variant={v === "ACTIVE" ? "success" : "neutral"}>{String(v)}</Badge>
      ),
    },
    {
      key: "id",
      header: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Link href={`/dashboard/admin/students/${row.id}`}>
            <button className="p-1.5 rounded hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors">
              <Eye size={15} />
            </button>
          </Link>
          <button
            onClick={() => setEditStudent(row)}
            className="p-1.5 rounded hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500">{students.length} active students</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/bulk-import">
            <Button variant="secondary" size="sm">
              <Upload size={15} /> Bulk Import
            </Button>
          </Link>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, roll, adm no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
        >
          <option value="">All Classes</option>
          {classes.sort((a, b) => a.order - b.order).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={students}
          loading={loading}
          emptyMessage="No students found"
          rowKey={(r) => r.id}
        />
      </div>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Student" size="lg">
        <StudentForm
          onSuccess={() => {
            setAddOpen(false);
            fetchStudents();
            toast.success("Student added successfully");
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editStudent}
        onClose={() => setEditStudent(null)}
        title="Edit Student"
        size="lg"
      >
        {editStudent && (
          <StudentForm
            student={editStudent}
            onSuccess={() => {
              setEditStudent(null);
              fetchStudents();
              toast.success("Student updated");
            }}
            onCancel={() => setEditStudent(null)}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Archive Student" size="sm">
        <p className="text-gray-600 text-sm mb-5">
          Are you sure you want to archive this student? They will no longer appear in active lists.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>
            Archive
          </Button>
        </div>
      </Modal>
    </div>
  );
}
