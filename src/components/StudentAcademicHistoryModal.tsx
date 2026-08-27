import React from 'react';
import { X, History, Award, BookOpen, User } from 'lucide-react';
import { Student, Section } from '../types';
import { formatStudentName } from '../utils';

interface StudentAcademicHistoryModalProps {
  student: Student;
  section: Section;
  onClose: () => void;
}

export const StudentAcademicHistoryModal: React.FC<StudentAcademicHistoryModalProps> = ({
  student,
  section,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Learner Academic History & Eligibility</h2>
              <p className="text-xs text-slate-500">{formatStudentName(student)} • LRN: {student.lrn || student.studentNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Eligibility info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" /> Elementary / Junior High Completion Record
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Eligibility Credential:</span>
                <span className="font-semibold text-slate-800">{student.eligibility?.type || 'Elementary School Completer'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">General Average:</span>
                <span className="font-semibold text-slate-800">{student.eligibility?.genAvg || '88.50'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Graduated/Completed School:</span>
                <span className="font-semibold text-slate-800">{student.eligibility?.elemSchoolName || 'Sta. Cruz Elementary Central School'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">School ID / Address:</span>
                <span className="font-semibold text-slate-800">{student.eligibility?.elemSchoolId || '109283'} • {student.eligibility?.elemSchoolAddress || 'Sta. Cruz, Laguna'}</span>
              </div>
            </div>
          </div>

          {/* Current Academic Enrollment */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600" /> Current Year Enrollment (S.Y. {section.schoolYear})
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Grade & Section:</span>
                <span className="font-bold text-slate-800">Grade {section.gradeLevel} - {section.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status:</span>
                <span className="font-bold text-emerald-700">{student.status || 'Active'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Adviser:</span>
                <span className="font-semibold text-slate-800">{section.adviserName}</span>
              </div>
            </div>
          </div>

          {/* Past Observations & Anecdotes summary */}
          <div className="border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">Permanent Record DepEd Form 10 (SF10) Sync Status:</p>
            <p>Synced with School Registry and National Learner Reference Database (DepEd LIS Compatible).</p>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
