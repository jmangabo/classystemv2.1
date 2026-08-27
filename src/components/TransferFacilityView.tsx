import React, { useState } from "react";
import { Student } from "../types";
import { formatStudentName } from "../utils";

interface TransferFacilityViewProps {
  students: Student[];
  onToggleStatus: (studentId: string, newStatus: 'enrolled' | 'dropped' | 'transferred') => void;
  onViewReport: (student: Student) => void;
  onViewBlankReport: (student: Student) => void;
}

export const TransferFacilityView: React.FC<TransferFacilityViewProps> = ({
  students,
  onToggleStatus,
  onViewReport,
  onViewBlankReport,
}) => {
  const [filter, setFilter] = useState<'all' | 'dropped' | 'transferred'>('all');

  const filtered = students.filter(s => {
    if (filter === 'dropped') return s.status === 'dropped';
    if (filter === 'transferred') return s.status === 'transferred';
    return s.status === 'dropped' || s.status === 'transferred';
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transfer & Dropouts Facility</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage student transfers, dropouts, and academic credential release records.</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'dropped', 'transferred'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Learner Name (LRN)</th>
                <th className="py-3 px-4">Section / Grade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <div>{formatStudentName(student.name)}</div>
                    <div className="text-[10px] text-slate-400 font-mono">LRN: {student.lrn || 'N/A'}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-600">
                    {student.sectionName || 'Unassigned'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      student.status === 'dropped' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(student.id, 'enrolled')}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-all"
                    >
                      Re-enroll
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewReport(student)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-all"
                    >
                      SF10 / SF9
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
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    No records found for this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
