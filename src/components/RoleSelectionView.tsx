import React, { useState, useEffect } from "react";
import { 
  Shield, 
  GraduationCap, 
  BookOpen, 
  Building, 
  HeartHandshake, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  School as SchoolIcon
} from "lucide-react";
import { UserProfile, School } from "../types";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

interface RoleSelectionViewProps {
  user: any;
  onComplete: (profile: UserProfile) => void;
}

export function RoleSelectionView({ user, onComplete }: RoleSelectionViewProps) {
  const [selectedRole, setSelectedRole] = useState<UserProfile["role"]>("teacher");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [schoolId, setSchoolId] = useState("");
  const [lrn, setLrn] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchSchools() {
      setLoadingSchools(true);
      try {
        const q = query(collection(db, "schools"), orderBy("name", "asc"));
        const snap = await getDocs(q);
        const list: School[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        setSchools(list);
        if (list.length > 0) {
          setSchoolId(list[0].schoolId || list[0].id || "");
        }
      } catch (e) {
        console.error("Error fetching schools:", e);
      } finally {
        setLoadingSchools(false);
      }
    }
    fetchSchools();
  }, []);

  const roles = [
    {
      id: "teacher" as const,
      title: "Teacher / Adviser",
      desc: "Encode quarterly grades, manage attendance, and generate DepEd SF reports.",
      icon: <BookOpen className="text-indigo-600" size={24} />,
      color: "border-indigo-500 bg-indigo-50/40",
      badge: "Faculty"
    },
    {
      id: "school_head" as const,
      title: "School Head / Principal",
      desc: "Oversee instructional leadership, approve final grades, and review SF8/SF7.",
      icon: <Building className="text-purple-600" size={24} />,
      color: "border-purple-500 bg-purple-50/40",
      badge: "Administration"
    },
    {
      id: "guidance_designate" as const,
      title: "Guidance Designate",
      desc: "Manage confidential learner anecdotal records, counseling, and observed values.",
      icon: <HeartHandshake className="text-emerald-600" size={24} />,
      color: "border-emerald-500 bg-emerald-50/40",
      badge: "Student Affairs"
    },
    {
      id: "student" as const,
      title: "Learner / Parent",
      desc: "Access quarterly progress, electronic SF9 report cards, and attendance via 12-digit LRN.",
      icon: <GraduationCap className="text-blue-600" size={24} />,
      color: "border-blue-500 bg-blue-50/40",
      badge: "Learner Portal"
    },
    {
      id: "admin" as const,
      title: "System Administrator",
      desc: "Manage school profiles, approve faculty accounts, and configure system settings.",
      icon: <Shield className="text-amber-600" size={24} />,
      color: "border-amber-500 bg-amber-50/40",
      badge: "Full Access"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      alert("Please enter your full name");
      return;
    }
    if (selectedRole === "student" && !lrn.trim()) {
      alert("Please enter your 12-digit Learner Reference Number (LRN)");
      return;
    }

    setIsSubmitting(true);
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: displayName.trim(),
      role: selectedRole,
      schoolId: schoolId || (schools[0]?.schoolId || "DEPED-10902"),
      approvalStatus: selectedRole === "admin" || selectedRole === "student" ? "approved" : "pending",
      lrn: selectedRole === "student" ? lrn.trim() : undefined
    };

    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles size={14} className="text-amber-400" /> DepEd CLASS Enterprise
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Select Account Profile</h1>
            <p className="text-indigo-200 text-xs md:text-sm mt-1 max-w-xl font-medium">
              Choose your official role in the Centralized Learner Assessment and School System.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* User Display Name */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Full Name / Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Juan Dela Cruz, LPT"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800"
            />
          </div>

          {/* School Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Assigned School</span>
              {loadingSchools && <span className="text-slate-400 font-normal">Loading schools...</span>}
            </label>
            {schools.length > 0 ? (
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 bg-white"
              >
                {schools.map((s) => (
                  <option key={s.id || s.schoolId} value={s.schoolId || s.id}>
                    {s.name} ({s.schoolId || "DEPED"})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                Default School: DepEd Central Secondary (DEPED-10902)
              </div>
            )}
          </div>

          {/* Role Cards */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Choose Your Role
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roles.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="p-2 rounded-xl bg-white shadow-xs border border-slate-100">{r.icon}</div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {r.badge}
                      </span>
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        {r.title}
                        {isSelected && <CheckCircle2 size={16} className="text-indigo-600 ml-auto" />}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student LRN input if student role */}
          {selectedRole === "student" && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 animate-in fade-in">
              <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                12-Digit Learner Reference Number (LRN)
              </label>
              <input
                type="text"
                maxLength={12}
                required
                value={lrn}
                onChange={(e) => setLrn(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 12-digit LRN (e.g. 109021234567)"
                className="w-full px-4 py-2.5 rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm font-bold text-blue-900 bg-white"
              />
              <p className="text-[11px] text-blue-700">
                Your LRN connects your account directly to your official DepEd learner master record.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving Profile...
                </>
              ) : (
                <>
                  Complete Setup <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
