import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Lock, 
  Unlock, 
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { Student, Subject, Section, UserProfile, TermNumber } from "../types";
import { formatStudentName } from "../utils";

interface SummarySheetViewProps {
  students: Student[];
  subjects: Subject[];
  selectedSection?: Section | null;
  currentUser?: UserProfile;
  schoolCalendar?: any;
  onToggleSF9Download?: (student: Student) => void;
  onToggleStudentStatus?: (studentId: string, status: any) => void;
  onViewReport: (student: Student) => void;
  onViewBlankReport?: (student: Student) => void;
}

export function SummarySheetView({
  students,
  subjects,
  selectedSection,
  currentUser,
  schoolCalendar,
  onToggleSF9Download,
  onToggleStudentStatus,
  onViewReport,
  onViewBlankReport
}: SummarySheetViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.lrn || "").includes(searchTerm);
    const matchesStatus = filterStatus === "all" || (st.status || "Active") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="text-indigo-600" size={22} />
            DepEd SF9 Learner Progress Summary Sheet
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Overview of student general averages across all four quarters, promotional status, and report card issuance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            <Printer size={16} /> Print Summary Sheet
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search learner name or 12-digit LRN..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Promoted">Promoted</option>
            <option value="Retained">Retained</option>
            <option value="Transferred Out">Transferred Out</option>
            <option value="Dropped Out">Dropped Out</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Learner Name & LRN</th>
                <th className="py-3.5 px-4">Sex</th>
                <th className="py-3.5 px-4 text-center">SF9 Access</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredStudents.map((st, idx) => (
                <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-xs">{formatStudentName(st)}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      LRN: <span className="font-bold text-slate-600">{st.lrn || "N/A"}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">{st.sex}</td>
                  <td className="py-3.5 px-4 text-center">
                    {onToggleSF9Download ? (
                      <button
                        onClick={() => onToggleSF9Download(st)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                          st.sf9CardUnlocked
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {st.sf9CardUnlocked ? <Unlock size={11} /> : <Lock size={11} />}
                        {st.sf9CardUnlocked ? "Unlocked" : "Locked"}
                      </button>
                    ) : (
                      <span className="text-slate-400 font-bold">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {st.status || "Active"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewReport(st)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                        title="View SF9 Report Card"
                      >
                        <Eye size={13} /> View SF9
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching learner records found.
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
