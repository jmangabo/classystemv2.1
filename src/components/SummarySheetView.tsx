import React, { useState } from "react";
import { Student, Subject, Section, UserProfile } from "../types";
import { formatStudentName, printHTMLContent } from "../utils";
import { Printer } from "lucide-react";

interface SummarySheetViewProps {
  students: Student[];
  subjects: Subject[];
  selectedSection: Section | null;
  currentUser: UserProfile | null;
  schoolCalendar: any;
  onToggleSF9Download: (studentId: string) => void;
  onToggleStudentStatus: (studentId: string, newStatus: 'enrolled' | 'dropped' | 'transferred') => void;
  onViewReport: (student: Student) => void;
  onViewBlankReport: (student: Student) => void;
}

export const SummarySheetView: React.FC<SummarySheetViewProps> = ({
  students,
  subjects,
  selectedSection,
  currentUser,
  schoolCalendar,
  onToggleSF9Download,
  onToggleStudentStatus,
  onViewReport,
  onViewBlankReport,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const getDescriptiveRemark = (grade: number | string): string => {
    const numericGrade = typeof grade === 'string' ? parseFloat(grade) : grade;
    if (isNaN(numericGrade)) return '';
    if (numericGrade >= 90) return 'Advancing';
    if (numericGrade >= 80) return 'Benchmarking';
    if (numericGrade >= 75) return 'Connecting';
    if (numericGrade >= 65) return 'Developing';
    return 'Emerging';
  };

  const filteredStudents = students.filter(s => 
    formatStudentName(s.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.lrn && s.lrn.includes(searchTerm))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Class Summary & Academic Report</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Section: {selectedSection ? `${selectedSection.gradeLevel} - ${selectedSection.name}` : 'All Sections'} | Total Learners: {students.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search learner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>
          <button
            type="button"
            onClick={() => printHTMLContent(document.getElementById('summary-sheet-print')?.innerHTML || '')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            <Printer size={14} /> Print Summary
          </button>
        </div>
      </div>

      <div id="summary-sheet-print" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">Master Class Record & Descriptive Remarks</h2>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Grade Descriptors: 90-100 (Advancing), 80-89 (Benchmarking), 75-79 (Connecting), 65-74 (Developing), 0-64 (Emerging)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">No.</th>
                <th className="py-3 px-4">Learner Name (LRN)</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">General Average</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((student, idx) => {
                const gradesObj = student.grades || {};
                let totalGrade = 0;
                let count = 0;
                Object.values(gradesObj).forEach((termObj: any) => {
                  if (termObj && typeof termObj === 'object') {
                    Object.values(termObj).forEach((g: any) => {
                      const num = parseFloat(g);
                      if (!isNaN(num) && num > 0) {
                        totalGrade += num;
                        count++;
                      }
                    });
                  }
                });
                const genAvg = count > 0 ? (totalGrade / count).toFixed(2) : 'N/A';
                const remark = genAvg !== 'N/A' ? getDescriptiveRemark(genAvg) : 'N/A';

                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div>{formatStudentName(student.name)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">LRN: {student.lrn || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{student.sex}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        student.status === 'dropped' ? 'bg-rose-50 text-rose-700' :
                        student.status === 'transferred' ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {student.status || 'enrolled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{genAvg}</td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        remark === 'Advancing' ? 'bg-emerald-100 text-emerald-800' :
                        remark === 'Benchmarking' ? 'bg-blue-100 text-blue-800' :
                        remark === 'Connecting' ? 'bg-indigo-100 text-indigo-800' :
                        remark === 'Developing' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {remark}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => onViewReport(student)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-all"
                      >
                        View Report
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewBlankReport(student)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all"
                      >
                        Blank Form
                      </button>
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
