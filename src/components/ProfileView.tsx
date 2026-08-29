import React, { useState } from "react";
import { 
  User, 
  ArrowLeft, 
  Save, 
  Palette, 
  Building, 
  Mail, 
  ShieldCheck, 
  GraduationCap, 
  BookOpen, 
  HeartHandshake, 
  Loader2, 
  CheckCircle2 
} from "lucide-react";
import { UserProfile } from "../types";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onBack: () => void;
  onOpenThemeModal?: () => void;
}

export function ProfileView({
  userProfile,
  onUpdate,
  onBack,
  onOpenThemeModal
}: ProfileViewProps) {
  const [displayName, setDisplayName] = useState(userProfile.displayName || "");
  const [schoolId, setSchoolId] = useState(userProfile.schoolId || "DEPED-10902");
  const [lrn, setLrn] = useState(userProfile.lrn || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      alert("Display Name is required");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedProfile: UserProfile = {
        ...userProfile,
        displayName: displayName.trim(),
        schoolId: schoolId.trim(),
        lrn: userProfile.role === "student" ? lrn.trim() : undefined,
        updatedAt: new Date().toISOString()
      } as any;

      if (userProfile.uid) {
        await updateDoc(doc(db, "users", userProfile.uid), {
          displayName: displayName.trim(),
          schoolId: schoolId.trim(),
          ...(userProfile.role === "student" ? { lrn: lrn.trim() } : {}),
          updatedAt: new Date().toISOString()
        });
      }

      onUpdate(updatedProfile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
                <User className="text-indigo-600" size={20} />
                User Account & Preferences
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage personal identification, assigned institution, and visual appearance.
              </p>
            </div>
          </div>

          {onOpenThemeModal && (
            <button
              onClick={onOpenThemeModal}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Palette size={14} /> Customize Theme
            </button>
          )}
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 text-xl font-bold">
                {displayName.charAt(0) || "U"}
              </div>
              <div>
                <h2 className="text-lg font-black">{displayName || "User Profile"}</h2>
                <div className="flex items-center gap-2 text-xs text-indigo-200 mt-0.5">
                  <Mail size={12} /> {userProfile.email}
                </div>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-white/10 text-indigo-200 border border-white/20 text-xs font-bold uppercase tracking-wider">
              {userProfile.role}
            </span>
          </div>

          <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Full Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Maria Santos, LPT"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Assigned School ID / Code
                </label>
                <input
                  type="text"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  placeholder="e.g. DEPED-10902"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={userProfile.email}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  System Role & Status
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  <ShieldCheck size={16} className="text-indigo-600" />
                  <span className="capitalize">{userProfile.role}</span>
                  <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
                    {userProfile.approvalStatus || "Approved"}
                  </span>
                </div>
              </div>
            </div>

            {userProfile.role === "student" && (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  12-Digit Learner Reference Number (LRN)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={lrn}
                  onChange={(e) => setLrn(e.target.value.replace(/\D/g, ""))}
                  placeholder="109021234567"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Profile saved successfully!
                </span>
              )}
              {!saveSuccess && <div />}

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 flex items-center gap-2 cursor-pointer transition-all"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
