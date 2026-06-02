"use client";
import { useEffect, useState } from "react";
import { BookOpen, Plus, RotateCcw, Search, X } from "lucide-react";
import { toast } from "sonner";

interface Book {
  id: string; title: string; author?: string; isbn?: string; subject?: string;
  publisher?: string; edition?: string; totalCopies: number; availableCopies: number;
  _count?: { issues: number };
}
interface Issue {
  id: string; issuedTo: string; issueDate: string; dueDate: string;
  returnDate?: string; status: string; fine: number;
  book: { title: string; author?: string };
  student?: { name: string; admissionNo: string };
}

export default function LibraryPage() {
  const [tab, setTab] = useState<"books" | "issues">("books");
  const [books, setBooks] = useState<Book[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [query, setQuery] = useState("");
  const [showAddBook, setShowAddBook] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [loading, setLoading] = useState(true);

  const [bookForm, setBookForm] = useState({ title: "", author: "", isbn: "", subject: "", publisher: "", edition: "", totalCopies: "1" });
  const [issueForm, setIssueForm] = useState({ bookId: "", issuedTo: "", dueDate: "" });

  const fetchBooks = async (q = "") => {
    const res = await fetch(`/api/library/books?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setBooks(data.books || []);
    setLoading(false);
  };
  const fetchIssues = async (status = "") => {
    const res = await fetch(`/api/library/issues?status=${status}`);
    const data = await res.json();
    setIssues(data.issues || []);
  };

  useEffect(() => { fetchBooks(); fetchIssues(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchBooks(query); };

  const addBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/library/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bookForm) });
    if (res.ok) { toast.success("Book added"); setShowAddBook(false); setBookForm({ title: "", author: "", isbn: "", subject: "", publisher: "", edition: "", totalCopies: "1" }); fetchBooks(query); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const issueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/library/issues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...issueForm, bookId: selectedBookId }) });
    if (res.ok) { toast.success("Book issued"); setShowIssueForm(false); fetchBooks(query); fetchIssues(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const returnBook = async (id: string, fine = 0) => {
    const res = await fetch("/api/library/issues", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, fine }) });
    if (res.ok) { toast.success("Book returned"); fetchBooks(query); fetchIssues(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const deleteBook = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    const res = await fetch(`/api/library/books?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetchBooks(query); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const overdueCount = issues.filter(i => i.status === "ISSUED" && new Date(i.dueDate) < new Date()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Library Management</h1>
          <p className="text-sm text-gray-500 mt-1">{books.length} books · {issues.filter(i => i.status === "ISSUED").length} issued · {overdueCount} overdue</p>
        </div>
        <button onClick={() => setShowAddBook(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> Add Book
        </button>
      </div>

      {overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> {overdueCount} book(s) are overdue
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["books", "issues"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`pb-2 px-4 text-sm font-medium capitalize border-b-2 transition ${tab === t ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t === "books" ? "Book Catalog" : "Issue / Return"}
          </button>
        ))}
      </div>

      {tab === "books" && (
        <>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title, author, ISBN…" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Search</button>
          </form>

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{["Title", "Author", "Subject", "Copies", "Available", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading…</td></tr>}
                {!loading && books.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No books found. Add some!</td></tr>}
                {books.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.title}{b.isbn && <span className="ml-2 text-xs text-gray-400">ISBN: {b.isbn}</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{b.author || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{b.subject || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{b.totalCopies}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${b.availableCopies > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{b.availableCopies}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedBookId(b.id); setIssueForm(f => ({ ...f, bookId: b.id })); setShowIssueForm(true); }} disabled={b.availableCopies === 0} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-40">Issue</button>
                        <button onClick={() => deleteBook(b.id)} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"><X className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "issues" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{["Book", "Issued To", "Issue Date", "Due Date", "Status", "Action"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {issues.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No issues found</td></tr>}
              {issues.map(i => {
                const overdue = i.status === "ISSUED" && new Date(i.dueDate) < new Date();
                return (
                  <tr key={i.id} className={`hover:bg-gray-50 ${overdue ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{i.book.title}</td>
                    <td className="px-4 py-3 text-gray-600">{i.issuedTo}{i.student && <span className="text-xs text-gray-400 ml-1">({i.student.admissionNo})</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(i.issueDate).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(i.dueDate).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${i.status === "RETURNED" ? "bg-green-100 text-green-700" : overdue ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                        {overdue && i.status === "ISSUED" ? "OVERDUE" : i.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {i.status === "ISSUED" && (
                        <button onClick={() => { const fine = overdue ? prompt("Enter fine amount (₹):") || "0" : "0"; returnBook(i.id, Number(fine)); }} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100">
                          <RotateCcw className="w-3 h-3" /> Return
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Book Modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New Book</h2>
              <button onClick={() => setShowAddBook(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={addBook} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[["title", "Title *"], ["author", "Author"], ["isbn", "ISBN"], ["subject", "Subject"], ["publisher", "Publisher"], ["edition", "Edition"]].map(([k, l]) => (
                  <div key={k}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{l}</label>
                    <input value={(bookForm as Record<string, string>)[k]} onChange={e => setBookForm(f => ({ ...f, [k]: e.target.value }))} required={k === "title"} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Copies *</label>
                  <input type="number" min="1" value={bookForm.totalCopies} onChange={e => setBookForm(f => ({ ...f, totalCopies: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddBook(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Add Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Issue Book</h2>
              <button onClick={() => setShowIssueForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={issueBook} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Select Book *</label>
                <select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">— Select Book —</option>
                  {books.filter(b => b.availableCopies > 0).map(b => <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} available)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Issued To (Name) *</label>
                <input value={issueForm.issuedTo} onChange={e => setIssueForm(f => ({ ...f, issuedTo: e.target.value }))} required placeholder="Student or staff name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Due Date *</label>
                <input type="date" value={issueForm.dueDate} onChange={e => setIssueForm(f => ({ ...f, dueDate: e.target.value }))} required min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowIssueForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Issue Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
