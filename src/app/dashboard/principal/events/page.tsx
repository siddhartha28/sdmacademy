"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string; title: string; description: string | null;
  date: string; endDate: string | null; isPublished: boolean; createdAt: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [form, setForm] = useState({ title: "", description: "", date: "", endDate: "", isPublished: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/events");
    const d = await res.json();
    setEvents(d.events ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.date) { toast.error("Title and date required"); return; }
    setSaving(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { toast.success("Event added!"); setForm({ title: "", description: "", date: "", endDate: "", isPublished: true }); setShowForm(false); load(); }
    else toast.error("Failed");
  }

  const now = new Date();
  const filtered = events.filter((e) => {
    const d = new Date(e.date);
    if (filter === "upcoming") return d >= now;
    if (filter === "past") return d < now;
    return true;
  });

  function monthGroup(evs: Event[]) {
    const grouped: Record<string, Event[]> = {};
    for (const e of evs) {
      const k = new Date(e.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(e);
    }
    return grouped;
  }

  const grouped = monthGroup(filtered);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events & Calendar</h1>
          <p className="text-gray-400 text-sm mt-0.5">School events, holidays, and special occasions</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Add Event"}
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Event Title *</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Annual Sports Day" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Start Date *</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">End Date (optional)</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={form.endDate} min={form.date} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
              <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="accent-primary-600" />
              <span className="text-gray-700">Publish to school website</span>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Adding…" : "Add Event"}
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(["upcoming", "past", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filter === f ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200"}`}>
            {f === "upcoming" ? "Upcoming" : f === "past" ? "Past" : "All"} ({events.filter((e) => {
              const d = new Date(e.date);
              if (f === "upcoming") return d >= now;
              if (f === "past") return d < now;
              return true;
            }).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No {filter !== "all" ? filter : ""} events
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, evs]) => (
            <div key={month}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{month}</h3>
              <div className="space-y-2">
                {evs.map((ev) => {
                  const isPast = new Date(ev.date) < now;
                  return (
                    <div key={ev.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${isPast ? "border-gray-200 opacity-75" : "border-primary-200"} hover:shadow-sm transition-shadow`}>
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0 ${isPast ? "bg-gray-100 text-gray-500" : "bg-primary-600 text-white"}`}>
                        <span className="text-[10px] font-bold leading-none">
                          {new Date(ev.date).toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}
                        </span>
                        <span className="text-xl font-bold leading-tight">
                          {new Date(ev.date).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800">{ev.title}</span>
                          {!ev.isPublished && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Draft</span>}
                          {ev.endDate && ev.endDate !== ev.date && (
                            <span className="text-xs text-gray-400">
                              – {new Date(ev.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                        {ev.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{ev.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
