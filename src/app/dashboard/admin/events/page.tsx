"use client";
import { useEffect, useState } from "react";
import { Plus, X, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Event { id: string; title: string; description?: string; date: string; endDate?: string; isPublished: boolean; }

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const initForm = { title: "", description: "", date: "", endDate: "", isPublished: true };
  const [form, setForm] = useState(initForm);

  const fetch_ = async () => {
    const res = await fetch("/api/events");
    const data = await res.json();
    setEvents(data.events || []);
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, date: new Date(form.date).toISOString(), endDate: form.endDate ? new Date(form.endDate).toISOString() : null }) });
    if (res.ok) { toast.success("Event created"); setShowAdd(false); setForm(initForm); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const res = await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetch_(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const upcoming = events.filter(e => new Date(e.date) >= new Date());
  const past = events.filter(e => new Date(e.date) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events & Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">{upcoming.length} upcoming · {past.length} past</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {["Upcoming", "Past"].map(section => {
        const list = section === "Upcoming" ? upcoming : past;
        return (
          <div key={section}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{section} Events ({list.length})</h2>
            {loading && <div className="text-center text-gray-400 py-4">Loading…</div>}
            {!loading && list.length === 0 && <p className="text-sm text-gray-400">No {section.toLowerCase()} events</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map(ev => (
                <div key={ev.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-500 shrink-0" />
                      <h3 className="font-semibold text-gray-900 text-sm">{ev.title}</h3>
                    </div>
                    <button onClick={() => del(ev.id)} className="p-1 text-red-400 hover:text-red-600 rounded"><X className="w-4 h-4" /></button>
                  </div>
                  {ev.description && <p className="text-xs text-gray-500 mb-2">{ev.description}</p>}
                  <p className="text-xs text-gray-400">{new Date(ev.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{ev.endDate && ` – ${new Date(ev.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}</p>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ev.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {ev.isPublished ? "Published" : "Internal"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Event</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Event Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pub" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="rounded" />
                <label htmlFor="pub" className="text-sm text-gray-700">Publish on website</label>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
