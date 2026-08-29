import React, { useState } from "react";
import { 
  ArrowRightLeft, 
  Search, 
  UserMinus, 
  UserCheck, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  Eye
} from "lucide-react";
import { Student } from "../types";
import { formatStudentName } from "../utils";

interface TransferFacilityViewProps {
  students: Student[];
  onToggleStatus: (studentId: string, status: any) => void;
  onViewReport: (student: Student) => void;
  onViewBlankReport?: (student: Student) => void;
}

export function TransferFacilityView({
  students,
  onToggleStatus,
  onViewReport,
  onViewBlankReport
}: TransferFacilityViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.lrn || "").includes(searchTerm);
    const matchesStatus = selectedStatus === "all" || (st.status || "Active") === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <ArrowRightLeft className="text-indigo-600" size={22} />
          Learner Transfer & Movement Facility
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Process official learner status transitions (Transferred In, Transferred Out, Dropped Out) in accordance with DepEd SF1 / SF2 regulations.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search learner name or LRN..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">All Movements</option>
            <option value="Active">Active / Regular</option>
            <option value="Transferred Out">Transferred Out</option>
            <option value="Dropped Out">Dropped Out</option>
            <option value="Promoted">Promoted</option>
            <option value="Retained">Retained</option>
          </select>
        </div>
      </div>

      {/* Learners Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Learner Name</th>
                <th className="py-3.5 px-4">LRN</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4">Update Status</th>
                <th className="py-3.5 px-4 text-right">DepEd Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredStudents.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {formatStudentName(st)}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                    {st.lrn || "N/A"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        st.status === "Transferred Out"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : st.status === "Dropped Out"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {st.status || "Active"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={st.status || "Active"}
                      onChange={(e) => onToggleStatus(st.id, e.target.value)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="Active">Active / Enrolled</option>
                      <option value="Transferred Out">Transferred Out (T/O)</option>
                      <option value="Dropped Out">Dropped Out (D/O)</option>
                      <option value="Promoted">Promoted</option>
                      <option value="Retained">Retained</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onViewReport(st)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={13} /> SF9 Progress
                    </button>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No matching learner records.
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
