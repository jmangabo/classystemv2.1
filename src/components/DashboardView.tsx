import React from "react";
import { 
  Users, 
  BookOpen, 
  Layers, 
  Calendar, 
  QrCode, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileText, 
  CreditCard, 
  Sparkles,
  School as SchoolIcon,
  ShieldCheck,
  UserCheck,
  Building
} from "lucide-react";
import { Student, Subject, Section, UserProfile, TermNumber } from "../types";
import { formatStudentName } from "../utils";

interface DashboardViewProps {
  students: Student[];
  subjects: Subject[];
  sections: Section[];
  currentUser?: UserProfile;
  globalSettings?: any;
  onNavigate: (tab: string) => void;
  onCalculateYearEnd?: () => void;
  onUnfinalizeYearEnd?: () => void;
  onToggleFinalizeSubjectTerm?: (subjectId: string, term: TermNumber) => void;
  section?: Section | null;
  onShowFinancialStatement?: () => void;
  isAuthorizedCashier?: boolean;
  isSectionAdviser?: boolean;
  isEntireSchoolFinalized?: boolean;
  onSelectSubject?: (subjId: string) => void;
  onTermChange?: (term: TermNumber) => void;
  teacherCount?: number;
  activeSchool?: any;
  schoolCalendar?: any;
  onUpdateAttendance?: any;
  onScanID?: () => void;
}

export function DashboardView({
  students,
  subjects,
  sections,
  currentUser,
  globalSettings,
  onNavigate,
  onCalculateYearEnd,
  onUnfinalizeYearEnd,
  onToggleFinalizeSubjectTerm,
  section,
  onShowFinancialStatement,
  isAuthorizedCashier,
  isSectionAdviser,
  isEntireSchoolFinalized,
  onSelectSubject,
  onTermChange,
  teacherCount,
  activeSchool,
  schoolCalendar,
  onUpdateAttendance,
  onScanID
}: DashboardViewProps) {
  const maleCount = students.filter((s) => s.sex === "Male").length;
  const femaleCount = students.filter((s) => s.sex === "Female").length;
  const activeCount = students.filter((s) => !s.status || s.status === "Active" || s.status === "Regular" || s.status === "Promoted").length;
  const droppedCount = students.filter((s) => s.status === "Dropped Out" || s.status === "Transferred Out").length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles size={14} className="text-amber-400" />
              {activeSchool?.name || "DepEd Centralized Learner Assessment System"}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Mabuhay, {currentUser?.displayName || "Faculty Member"}!
            </h1>
            <p className="text-indigo-200 text-xs md:text-sm mt-1 max-w-xl font-medium">
              {section
                ? `Active Class: ${section.name} (Grade ${section.gradeLevel}) • SY ${section.schoolYear || "2025-2026"}`
                : "Manage institutional sections, quarterly grades, learner attendance, and DepEd School Forms."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onScanID && (
              <button
                onClick={onScanID}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 transition-all cursor-pointer"
              >
                <QrCode size={16} /> Scan ID / QR
              </button>
            )}
            {section && (
              <button
                onClick={() => onNavigate("gradebook")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
              >
                <BookOpen size={16} /> Open Gradebook
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Enrolled</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{students.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {maleCount} Male &bull; {femaleCount} Female
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Learners</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{activeCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {droppedCount > 0 ? `${droppedCount} Dropped / Transferred` : "100% Retained"}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Subjects</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{subjects.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            DepEd K-10 / MATATAG
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Sections</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Layers size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{sections.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Active Classes
          </div>
        </div>
      </div>

      {/* Quick Access Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate("addLearner")}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Learner Roster</h3>
              <p className="text-xs text-slate-500 mt-0.5">Enroll, register, and update learner demographics.</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigate("dailyAttendance")}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily Attendance Tracker</h3>
              <p className="text-xs text-slate-500 mt-0.5">Record daily present/absent logs & export SF2.</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigate("summarySheet")}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">SF9 & DepEd Reports</h3>
              <p className="text-xs text-slate-500 mt-0.5">Print quarterly progress reports & MATATAG cards.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Students Table Sample */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Recent Class Roster ({students.length} Learners)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Alphabetical list of learners enrolled in {section?.name || "current section"}.
            </p>
          </div>

          <button
            onClick={() => onNavigate("addLearner")}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            Manage Roster <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Learner Name</th>
                <th className="py-3 px-4">LRN</th>
                <th className="py-3 px-4">Sex</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {students.slice(0, 8).map((st, idx) => (
                <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{formatStudentName(st)}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-600">{st.lrn || "N/A"}</td>
                  <td className="py-3 px-4">{st.sex}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      {st.status || "Active"}
                    </span>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No learners added yet. Go to "Add Learners" to enroll students.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
