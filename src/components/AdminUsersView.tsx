import React, { useState, useEffect } from "react";
import { 
  Users, 
  ArrowLeft, 
  Search, 
  Check, 
  X, 
  Shield, 
  ShieldCheck, 
  Trash2, 
  Loader2, 
  Building, 
  Mail, 
  Filter,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { UserProfile } from "../types";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";

interface AdminUsersViewProps {
  onBack: () => void;
  currentUser?: UserProfile;
  activeSchool?: any;
}

export function AdminUsersView({ onBack, currentUser, activeSchool }: AdminUsersViewProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("email", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((d) => {
          list.push({ uid: d.id, ...(d.data() as any) });
        });
        setUsers(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (uid: string, approvalStatus: "approved" | "rejected") => {
    setProcessingId(uid);
    try {
      await updateDoc(doc(db, "users", uid), {
        approvalStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      alert("Failed to update user status: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: UserProfile["role"]) => {
    setProcessingId(uid);
    try {
      await updateDoc(doc(db, "users", uid), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      alert("Failed to update user role: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove user profile for ${email}?`)) return;
    setProcessingId(uid);
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (err: any) {
      alert("Failed to delete user profile: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.schoolId || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesStatus = filterStatus === "all" || (u.approvalStatus || "approved") === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingCount = users.filter((u) => u.approvalStatus === "pending").length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="text-indigo-600" size={20} />
                User Management & Access Control
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Verify faculty credentials, authorize school roles, and manage permissions.
              </p>
            </div>
          </div>

          {pendingCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 animate-pulse">
              <Clock size={14} /> {pendingCount} Pending Approvals
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Controls bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or school ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="teacher">Teachers / Advisers</option>
              <option value="school_head">School Heads</option>
              <option value="guidance_designate">Guidance Designates</option>
              <option value="student">Students</option>
              <option value="admin">Administrators</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={28} />
              <span className="text-xs font-bold uppercase tracking-wider">Loading user directory...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold text-slate-600">No users found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">School ID</th>
                    <th className="py-3.5 px-4">Assigned Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredUsers.map((u) => {
                    const status = u.approvalStatus || "approved";
                    const isProcessing = processingId === u.uid;

                    return (
                      <tr key={u.uid} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-xs">{u.displayName || "Anonymous User"}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail size={12} className="text-slate-400" /> {u.email}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {u.schoolId || "DEPED-10902"}
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            disabled={isProcessing}
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.uid, e.target.value as any)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                          >
                            <option value="teacher">Teacher / Adviser</option>
                            <option value="school_head">School Head</option>
                            <option value="guidance_designate">Guidance Designate</option>
                            <option value="student">Student / Parent</option>
                            <option value="admin">System Admin</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          {status === "approved" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                              <CheckCircle2 size={12} /> Approved
                            </span>
                          ) : status === "pending" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                              <Clock size={12} /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-wider">
                              <XCircle size={12} /> Rejected
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {status === "pending" && (
                              <>
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleUpdateStatus(u.uid, "approved")}
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                                  title="Approve User"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleUpdateStatus(u.uid, "rejected")}
                                  className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
                                  title="Reject User"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}

                            <button
                              disabled={isProcessing}
                              onClick={() => handleDeleteUser(u.uid, u.email)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
