"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, CheckCircle2, Clock, User, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Slot {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  status: "AVAILABLE" | "BOOKED" | "COMPLETED";
  parentName: string | null;
  notes: string | null;
  class: { id: string; name: string };
  student: { id: string; name: string; fatherName: string | null; phone: string | null } | null;
}

const STATUS_CONFIG = {
  AVAILABLE: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Available" },
  BOOKED:    { bg: "bg-blue-50",  text: "text-blue-700",  border: "border-blue-200",  label: "Booked" },
  COMPLETED: { bg: "bg-gray-50",  text: "text-gray-600",  border: "border-gray-200",  label: "Completed" },
};

export default function PTMPage() {
  const [classes, setClasses] = useState<{ id: string; name: string; isClassTeacher: boolean }[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ classId: "", date: "", startTime: "09:00", duration: "15" });
  const [saving, setSaving] = useState(false);
  const [isClassTeacher, setIsClassTeacher] = useState(false);

  const load = useCallback(async (classId: string) => {
    if (!classId) return;
    setLoading(true);
    const res = await fetch(`/api/teacher/ptm?classId=${classId}`);
    const data = await res.json();
    setSlots(data.slots ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/teacher/me").then((r) => r.json()).then((me) => {
      const cls = (me.classes ?? []).filter((c: { isClassTeacher: boolean }) => c.isClassTeacher);
      setClasses(cls);
      setIsClassTeacher(me.isClassTeacher);
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

  async function handleAddSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!form.classId || !form.date || !form.startTime) { toast.error("Fill all fields"); return; }
    setSaving(true);
    const res = await fetch("/api/teacher/ptm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, duration: Number(form.duration) }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Slot created!");
      setShowForm(false);
      load(selectedClass);
    } else {
      toast.error("Failed");
    }
  }

  async function markComplete(id: string) {
    const res = await fetch("/api/teacher/ptm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "COMPLETED" }),
    });
    if (res.ok) {
      toast.success("Marked as completed");
      setSlots((prev) => prev.map((s) => s.id === id ? { ...s, status: "COMPLETED" } : s));
    }
  }

  if (!isClassTeacher && !loading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <div className="text-center py-16 text-gray-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">PTM Slots</p>
          <p className="text-sm mt-1">This feature is only available for class teachers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PTM Slots</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage Parent-Teacher Meeting schedule</p>
        </div>
        <button onClick={() => { setForm({ ...form, classId: selectedClass }); setShowForm((v) => !v); }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Add Slot"}
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {classes.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {classes.map((c) => (
            <button key={c.id} onClick={() => setSelectedClass(c.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${selectedClass === c.id ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200"}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddSlot} className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">Create PTM Slot</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Class</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
                <option value="">Select</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Date</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Start Time</label>
              <input type="time" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Duration (min)</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
                {[10, 15, 20, 30].map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Creating..." : "Create Slot"}
            </button>
          </div>
        </form>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {(["AVAILABLE", "BOOKED", "COMPLETED"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = slots.filter((sl) => sl.status === s).length;
          return (
            <div key={s} className={`${cfg.bg} ${cfg.border} border rounded-xl p-3 text-center`}>
              <p className={`text-2xl font-bold ${cfg.text}`}>{count}</p>
              <p className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : slots.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No PTM slots created yet
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => {
            const cfg = STATUS_CONFIG[slot.status];
            return (
              <div key={slot.id} className={`bg-white rounded-xl border ${cfg.border} p-4 hover:shadow-sm transition-shadow`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      {slot.status === "COMPLETED" ? <CheckCircle2 className={`w-5 h-5 ${cfg.text}`} /> :
                       slot.status === "BOOKED" ? <User className={`w-5 h-5 ${cfg.text}`} /> :
                       <Clock className={`w-5 h-5 ${cfg.text}`} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800">
                          {new Date(slot.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                        </span>
                        <span className="text-gray-600 text-sm">{slot.startTime}</span>
                        <span className="text-xs text-gray-400">{slot.duration} min</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{slot.class.name}</p>
                      {slot.student && (
                        <p className="text-xs text-primary-700 mt-1">
                          Student: {slot.student.name}
                          {slot.parentName && <span> · Parent: {slot.parentName}</span>}
                        </p>
                      )}
                      {slot.notes && <p className="text-xs text-gray-400 mt-1">{slot.notes}</p>}
                    </div>
                  </div>
                  {slot.status === "BOOKED" && (
                    <button onClick={() => markComplete(slot.id)} className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg font-medium flex-shrink-0">
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
