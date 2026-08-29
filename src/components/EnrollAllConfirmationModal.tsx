import React from "react";
import { Users, Check, X, AlertTriangle, Loader2 } from "lucide-react";

interface EnrollAllConfirmationModalProps {
  learnerCount: number;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isProcessing?: boolean;
  errorMessage?: string;
}

export function EnrollAllConfirmationModal({
  learnerCount,
  onConfirm,
  onCancel,
  isProcessing = false,
  errorMessage
}: EnrollAllConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden text-center p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <Users size={28} />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900">Enroll All Learners to Subjects</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            This will assign all configured curriculum subjects to <strong>{learnerCount}</strong> unenrolled learner(s) in this section.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 text-left flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Enrolling...
              </>
            ) : (
              <>
                <Check size={14} /> Confirm Enrollment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
