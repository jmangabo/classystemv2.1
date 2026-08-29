import React, { useState } from "react";
import { 
  GraduationCap, 
  Search, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  LogOut, 
  Sparkles,
  ShieldCheck,
  User
} from "lucide-react";
import { UserProfile, Student } from "../types";
import { db } from "../firebase";
import { collectionGroup, query, where, getDocs } from "firebase/firestore";
import { formatStudentName } from "../utils";

interface StudentLinkingViewProps {
  userProfile: UserProfile;
  onLinked: (id: string, type: "lrn" | "section") => void;
  onLogout?: () => void;
}

export function StudentLinkingView({ userProfile, onLinked, onLogout }: StudentLinkingViewProps) {
  const [lrn, setLrn] = useState(userProfile.lrn || "");
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lrn.trim()) return;
    setLoading(true);
    setErrorMsg("");
    setStudent(null);
    try {
      const q = query(
        collectionGroup(db, "students"),
        where("lrn", "==", lrn.trim())
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        setStudent({ id: d.id, ...(d.data() as any) });
      } else {
        setErrorMsg(`No learner record found with LRN: ${lrn.trim()}. Please double check your 12-digit number.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to query learner database.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (student) {
      onLinked(student.lrn || student.id, "lrn");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 text-indigo-300">
            <GraduationCap size={24} />
          </div>
          <h2 className="text-xl font-black">Link Student Account</h2>
          <p className="text-xs text-indigo-200 mt-1 font-medium">
            Connect your login email with your official DepEd learner profile.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              12-Digit Learner Reference Number (LRN)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={12}
                required
                value={lrn}
                onChange={(e) => setLrn(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 109021234567"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-100"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Search
              </button>
            </div>
            {errorMsg && <p className="text-xs font-bold text-rose-600">{errorMsg}</p>}
          </form>

          {student && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                  {student.photo ? (
                    <img src={student.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-indigo-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-slate-900 truncate">{formatStudentName(student)}</h4>
                  <p className="text-xs text-slate-500 font-mono">LRN: {student.lrn}</p>
                </div>
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              </div>

              <div className="text-[11px] text-slate-600 font-medium border-t border-indigo-100 pt-2 flex justify-between">
                <span>Section: <strong>{student.sectionName || "MATATAG"}</strong></span>
                <span>Sex: <strong>{student.sex}</strong></span>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Link & Enter Portal <ArrowRight size={14} />
              </button>
            </div>
          )}

          {onLogout && (
            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
              >
                <LogOut size={14} /> Switch Account / Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
