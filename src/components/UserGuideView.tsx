import React, { useState } from "react";
import { 
  Shield, 
  Users, 
  BookOpen, 
  Layers, 
  Award, 
  FileText, 
  Database, 
  Settings, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Info, 
  Key, 
  GraduationCap, 
  Calendar,
  Lock
} from "lucide-react";

export function UserGuideView() {
  const [activeTab, setActiveTab] = useState("roles-security");

  const sections = [
    {
      id: "roles-security",
      title: "Roles & Security",
      icon: <Shield size={18} />,
      description: "System access levels and privileges",
      content: (
        <div className="space-y-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              Welcome to the CLASS (Centralized Learner Assessment and School System) Enterprise Portal. Access is strictly governed by Role-Based Access Control (RBAC) to ensure student privacy and data security.
            </p>
          </div>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-2xl shadow-sm">
            <h4 className="text-amber-900 font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield size={16} /> Administrator Setup
            </h4>
            <p className="text-amber-800 text-sm leading-relaxed">
              Administrators should first configure the <strong>Schools</strong> and <strong>School Years</strong> before enrolling teachers. Each school has an authorized System Admin who approves teacher registrations and manages school settings.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Lock size={20} />
              </div>
              <h4 className="font-bold text-slate-900">System Admin</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manages school master profile, approves faculty accounts, unlocks finalized grades, and configures grading deadlines.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users size={20} />
              </div>
              <h4 className="font-bold text-slate-900">Adviser / Teacher</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manages advisory class sections, encodes quarterly written works & performance tasks, generates SF2/SF9/SF10, and tracks attendance.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <GraduationCap size={20} />
              </div>
              <h4 className="font-bold text-slate-900">Learner / Parent</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                View-only access to quarterly grades, electronic report cards (SF9), observed values, and attendance records via 12-digit LRN.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "sections-learners",
      title: "Sections & Learners",
      icon: <Users size={18} />,
      description: "Managing classes and student profiles",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 text-sm leading-relaxed">
            Class sections are organized by Grade Level (7–10 for JHS, 11–12 for SHS) and assigned an active School Year.
          </p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 space-y-3">
            <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" /> Enrolling Learners
            </h4>
            <p className="text-xs text-indigo-800 leading-relaxed">
              You can add learners individually with complete DepEd demographic info (LRN, birthdate, sex, address, parents/guardians, eligibility) or bulk import learners via standardized CSV template.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "grading-records",
      title: "MATATAG & DepEd Grading",
      icon: <Award size={18} />,
      description: "Grading system calculations and forms",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 text-sm leading-relaxed">
            Grades are automatically computed following the official DepEd transmutation table and weighted components:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl">
              <h5 className="font-bold text-slate-800 text-sm mb-2">Written Works (WW)</h5>
              <p className="text-xs text-slate-500">Quizzes, long tests, and written assessments (20% - 40% depending on learning area).</p>
            </div>
            <div className="p-5 bg-white border border-slate-200 rounded-2xl">
              <h5 className="font-bold text-slate-800 text-sm mb-2">Performance Tasks (PT)</h5>
              <p className="text-xs text-slate-500">Laboratory work, projects, practical demonstrations (40% - 60% depending on learning area).</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "mysql-migration",
      title: "MySQL Migration",
      icon: <Database size={18} />,
      description: "Enterprise relational database conversion",
      content: (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-3">
            <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
              <Database size={16} className="text-emerald-600" /> Relational Architecture
            </h4>
            <p className="text-xs text-emerald-800 leading-relaxed">
              The system supports full dual-engine replication to MySQL/MariaDB. You can test your connection, create relational tables, and stream Firestore records directly into MySQL using the MySQL Database & Migration console in the Settings menu.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentSection = sections.find((s) => s.id === activeTab) || sections[0];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <BookOpen size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">System User Guide</h1>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                Centralized Learner Assessment & School System Manual
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveTab(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-xs transition-all text-left cursor-pointer ${
                  activeTab === s.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <span className={activeTab === s.id ? "text-white" : "text-slate-400"}>{s.icon}</span>
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>

          <div className="md:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 md:p-10 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{currentSection.title}</h2>
              <p className="text-xs font-medium text-slate-400 mt-1">{currentSection.description}</p>
            </div>
            <div className="border-t border-slate-100 pt-6">{currentSection.content}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
