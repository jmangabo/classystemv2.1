import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail,
  School as SchoolIcon,
  RefreshCw
} from 'lucide-react';
import { UserProfile, School } from '../types';

interface AdminUsersViewProps {
  users: UserProfile[];
  schools: School[];
  onUpdateUser: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  onRefresh?: () => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  users,
  schools,
  onUpdateUser,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loadingUid, setLoadingUid] = useState<string | null>(null);

  const filteredUsers = users
    .filter(u => {
      if (roleFilter !== 'All' && u.role !== roleFilter) return false;
      if (statusFilter !== 'All' && (u.approvalStatus || 'approved') !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (u.email || '').toLowerCase().includes(q) ||
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.schoolId || '').toLowerCase().includes(q)
      );
    });

  const handleApprove = async (uid: string) => {
    setLoadingUid(uid);
    try {
      await onUpdateUser(uid, { approvalStatus: 'approved' });
    } finally {
      setLoadingUid(null);
    }
  };

  const handleReject = async (uid: string) => {
    setLoadingUid(uid);
    try {
      await onUpdateUser(uid, { approvalStatus: 'rejected' });
    } finally {
      setLoadingUid(null);
    }
  };

  const handleRoleChange = async (uid: string, role: UserProfile['role']) => {
    setLoadingUid(uid);
    try {
      await onUpdateUser(uid, { role });
    } finally {
      setLoadingUid(null);
    }
  };

  const handleSchoolChange = async (uid: string, schoolId: string) => {
    setLoadingUid(uid);
    try {
      await onUpdateUser(uid, { schoolId });
    } finally {
      setLoadingUid(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            User Management & Role Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage teacher approvals, system roles, and school assignments.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search email, name, school..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
          >
            <option value="All">All Roles</option>
            <option value="system_admin">System Admin</option>
            <option value="school_head">School Head / Principal</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher / Adviser</option>
            <option value="guidance_designate">Guidance Designate</option>
            <option value="student">Student</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
            <option value="rejected">Rejected</option>
          </select>

          <span className="text-xs font-bold text-slate-500">
            ({filteredUsers.length} Users)
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">User & Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Assigned School</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => {
                const isPending = user.approvalStatus === 'pending';
                const isRejected = user.approvalStatus === 'rejected';

                return (
                  <tr key={user.uid} className="hover:bg-slate-50/60 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.displayName || 'Unnamed User'}</p>
                          <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <select
                        value={user.role || 'teacher'}
                        disabled={loadingUid === user.uid}
                        onChange={e => handleRoleChange(user.uid, e.target.value as UserProfile['role'])}
                        className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800"
                      >
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                        <option value="school_head">School Head</option>
                        <option value="guidance_designate">Guidance Designate</option>
                        <option value="system_admin">System Admin</option>
                        <option value="student">Student</option>
                      </select>
                    </td>

                    <td className="p-3">
                      <select
                        value={user.schoolId || ''}
                        disabled={loadingUid === user.uid}
                        onChange={e => handleSchoolChange(user.uid, e.target.value)}
                        className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 max-w-[200px]"
                      >
                        <option value="">-- No School Assigned --</option>
                        {schools.map(s => (
                          <option key={s.schoolId} value={s.schoolId}>
                            {s.name} ({s.schoolId})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-3 text-center">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApprove(user.uid)}
                              disabled={loadingUid === user.uid}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(user.uid)}
                              disabled={loadingUid === user.uid}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <UserX className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {!isPending && isRejected && (
                          <button
                            onClick={() => handleApprove(user.uid)}
                            disabled={loadingUid === user.uid}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold transition"
                          >
                            Re-Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
