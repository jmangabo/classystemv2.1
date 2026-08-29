import React from "react";
import { Clock, ShieldAlert, LogOut, XCircle, AlertTriangle, Building, HelpCircle } from "lucide-react";

interface PendingApprovalViewProps {
  onLogout: () => void;
  isExpired?: boolean;
  isRejected?: boolean;
  noAdminFound?: boolean;
  userRole?: string;
}

export function PendingApprovalView({
  onLogout,
  isExpired = false,
  isRejected = false,
  noAdminFound = false,
  userRole = "teacher"
}: PendingApprovalViewProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-center p-8">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-sm ${
          isRejected
            ? 'bg-rose-50 border border-rose-200 text-rose-600'
            : isExpired
            ? 'bg-amber-50 border border-amber-200 text-amber-600'
            : 'bg-indigo-50 border border-indigo-200 text-indigo-600'
        }">
          {isRejected ? (
            <XCircle size={32} />
          ) : isExpired ? (
            <AlertTriangle size={32} />
          ) : (
            <Clock size={32} className="animate-pulse" />
          )}
        </div>

        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          {isRejected
            ? "Account Disapproved"
            : isExpired
            ? "Subscription Expired"
            : noAdminFound
            ? "Awaiting System Initializer"
            : "Account Pending Approval"}
        </h2>

        <p className="text-xs md:text-sm text-slate-600 mt-2.5 leading-relaxed font-medium">
          {isRejected
            ? "Your account registration has been reviewed and rejected by the school administrator. Please contact your ICT coordinator."
            : isExpired
            ? "Your institutional access period for this school year has expired. Please coordinate with the division office or administrator to renew."
            : noAdminFound
            ? "No approved administrator was found for your institution. The first administrator must be verified to authorize faculty accounts."
            : `Your registration as a ${userRole.toUpperCase()} has been submitted. An authorized school administrator must verify and approve your account before you can access learner records.`}
        </p>

        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Building size={14} className="text-slate-400" /> Account Status
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Status: <span className="font-bold text-amber-600 uppercase">{isRejected ? "Rejected" : isExpired ? "Expired" : "Pending Verification"}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            DepEd Central Security Protocol enforces Role-Based Access Control (RBAC) to ensure confidentiality of official student records.
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-3">
          <button
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
