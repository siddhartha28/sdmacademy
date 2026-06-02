"use client";
import { useEffect, useState } from "react";
import { UserPlus, X, Shield, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface UserRecord {
  id: string; name: string; phone: string; email?: string;
  role: string; isActive: boolean; createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  PRINCIPAL: "bg-indigo-100 text-indigo-700",
  TEACHER: "bg-blue-100 text-blue-700",
  ACCOUNTS: "bg-amber-100 text-amber-700",
};

export default function UserAccountsPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const initForm = { name: "", phone: "", email: "", role: "TEACHER", password: "" };
  const [form, setForm] = useState(initForm);
  const [editForm, setEditForm] = useState<Partial<UserRecord & { password: string }>>({});

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };
  useEffect(() => { fetchUsers(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("User created successfully"); setShowAdd(false); setForm(initForm); fetchUsers(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const updateUser = async () => {
    if (!editId) return;
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...editForm }) });
    if (res.ok) { toast.success("Updated"); setEditId(null); fetchUsers(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  };

  const toggleActive = async (user: UserRecord) => {
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, isActive: !user.isActive }) });
    if (res.ok) { toast.success(user.isActive ? "Account deactivated" : "Account activated"); fetchUsers(); }
  };

  const editUser = users.find(u => u.id === editId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} users · {users.filter(u => u.isActive).length} active</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <UserPlus className="w-4 h-4" /> New User
        </button>
      </div>

      {/* Role breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {["TEACHER", "ADMIN", "ACCOUNTS", "PRINCIPAL"].map(role => {
          const count = users.filter(u => u.role === role && u.isActive).length;
          return (
            <div key={role} className={`rounded-xl border p-3 ${ROLE_COLORS[role] || "bg-gray-50 text-gray-700"} border-opacity-30`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium capitalize mt-0.5">{role.toLowerCase()}s</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{["Name", "Phone", "Email", "Role", "Status", "Created", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No users found</td></tr>}
            {users.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50 ${!u.isActive ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                <td className="px-4 py-3 text-gray-600">{u.email || "—"}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700"}`}>{u.role}</span></td>
                <td className="px-4 py-3">
                  {u.isActive ? (
                    <span className="flex items-center gap-1 text-green-700 text-xs"><CheckCircle className="w-3 h-3" /> Active</span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-700 text-xs"><XCircle className="w-3 h-3" /> Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditId(u.id); setEditForm({ name: u.name, email: u.email || "", role: u.role, password: "" }); }} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">Edit</button>
                    <button onClick={() => toggleActive(u)} className={`text-xs px-2 py-1 rounded ${u.isActive ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5 text-primary-600" /> Create User</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={createUser} className="space-y-3">
              {[["name", "Full Name *", "text"], ["phone", "Phone (login ID) *", "tel"], ["email", "Email (optional)", "email"], ["password", "Password *", "password"]].map(([k, l, t]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{l}</label>
                  <input type={t} value={(form as Record<string, string>)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required={["name", "phone", "password"].includes(k)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                  <option value="ACCOUNTS">Accounts</option>
                </select>
              </div>
              <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded-lg">Note: Principal accounts should be created via the database seed script.</p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editId && editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit User: {editUser.name}</h2>
              <button onClick={() => setEditId(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input value={editForm.name || ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input value={editForm.email || ""} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select value={editForm.role || ""} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                  <option value="ACCOUNTS">Accounts</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password (leave blank to keep)</label>
                <input type="password" value={editForm.password || ""} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setEditId(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={updateUser} className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
