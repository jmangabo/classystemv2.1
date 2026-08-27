import React, { useState } from 'react';
import { 
  User, 
  Award, 
  CheckCircle2, 
  FileText, 
  CreditCard, 
  Calendar, 
  ShieldCheck,
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';
import { Student, Subject, Section, TermNumber } from '../types';
import { calculateGrade } from '../lib/calculations';
import { formatStudentName, getGradeDescriptor } from '../utils';
import { SF9Modal } from './SF9Modal';

interface StudentPortalProps {
  student: Student;
  section: Section;
  subjects: Subject[];
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  section,
  subjects
}) => {
  const [activeTab, setActiveTab] = useState<'grades' | 'attendance' | 'values' | 'pta'>('grades');
  const [showSF9Modal, setShowSF9Modal] = useState(false);

  const enrolledSubjectIds = student.enrolledSubjectIds || subjects.map(s => s.id);
  const activeSubjects = subjects.filter(s => enrolledSubjectIds.includes(s.id));

  // Compute grades
  const subjectGrades = activeSubjects.map(sub => {
    const q1 = calculateGrade(student, sub, 1);
    const q2 = calculateGrade(student, sub, 2);
    const q3 = calculateGrade(student, sub, 3);
    const q4 = calculateGrade(student, sub, 4);

    const validGrades = [q1.final, q2.final, q3.final, q4.final].filter(g => g > 0);
    const finalRating = validGrades.length > 0
      ? Math.round(validGrades.reduce((a, b) => a + b, 0) / validGrades.length)
      : null;

    return {
      subject: sub,
      q1: q1.final > 0 ? q1.final : null,
      q2: q2.final > 0 ? q2.final : null,
      q3: q3.final > 0 ? q3.final : null,
      q4: q4.final > 0 ? q4.final : null,
      finalRating,
      remarks: finalRating ? (finalRating >= 75 ? 'PASSED' : 'FAILED') : ''
    };
  });

  const finalRatings = subjectGrades.map(sg => sg.finalRating).filter((g): g is number => g !== null);
  const generalAverage = finalRatings.length > 0
    ? Number((finalRatings.reduce((a, b) => a + b, 0) / finalRatings.length).toFixed(2))
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Student Profile Card Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-3xl font-black shadow-inner overflow-hidden">
              {student.photo ? (
                <img src={student.photo} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-indigo-200" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black uppercase tracking-tight">{formatStudentName(student)}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {student.status || 'Active'}
                </span>
              </div>
              <p className="text-indigo-200 text-xs mt-1 font-mono">
                LRN: {student.lrn || student.studentNumber} • Grade {section.gradeLevel} - {section.name}
              </p>
              <p className="text-xs text-indigo-300/80 mt-0.5">
                School: {section.schoolName || 'Laguna National High School'} • Class Adviser: {section.adviserName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {generalAverage && (
              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-center">
                <span className="block text-[10px] uppercase font-bold text-indigo-200">General Average</span>
                <span className="text-2xl font-black text-amber-300">{generalAverage}</span>
              </div>
            )}
            <button
              onClick={() => setShowSF9Modal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <FileText className="w-4 h-4" />
              View Form 9 (SF9)
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-1 rounded-xl shadow-xs">
        <button
          onClick={() => setActiveTab('grades')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'grades'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Academic Grades
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'attendance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Attendance Logs
        </button>
        <button
          onClick={() => setActiveTab('values')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'values'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Core Values
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'grades' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Learning Areas Progress (DepEd MATATAG / K-12)</h2>
              <p className="text-xs text-slate-500">Official Quarterly Ratings and Transmuted Final Grades</p>
            </div>
            {generalAverage && (
              <span className="text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                {getGradeDescriptor(generalAverage)}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-2/5">Subject Area</th>
                  <th className="p-3 text-center w-16">Q1</th>
                  <th className="p-3 text-center w-16">Q2</th>
                  <th className="p-3 text-center w-16">Q3</th>
                  <th className="p-3 text-center w-16">Q4</th>
                  <th className="p-3 text-center w-20 bg-indigo-50/50">Final Rating</th>
                  <th className="p-3 text-center w-24">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectGrades.map(sg => (
                  <tr key={sg.subject.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-semibold text-slate-800">{sg.subject.name}</td>
                    <td className="p-3 text-center font-mono">{sg.q1 || '-'}</td>
                    <td className="p-3 text-center font-mono">{sg.q2 || '-'}</td>
                    <td className="p-3 text-center font-mono">{sg.q3 || '-'}</td>
                    <td className="p-3 text-center font-mono">{sg.q4 || '-'}</td>
                    <td className="p-3 text-center font-black text-sm bg-indigo-50/50 text-indigo-950 font-mono">
                      {sg.finalRating || '-'}
                    </td>
                    <td className="p-3 text-center font-bold">
                      <span className={sg.remarks === 'PASSED' ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded' : sg.remarks === 'FAILED' ? 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-400'}>
                        {sg.remarks || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {generalAverage && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td className="p-3 text-right uppercase">General Average</td>
                    <td colSpan={4} className="p-3 text-center text-xs italic text-slate-500 font-normal">
                      {getGradeDescriptor(generalAverage)}
                    </td>
                    <td className="p-3 text-center text-base font-black text-indigo-900 font-mono">
                      {generalAverage}
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-700">
                      {generalAverage >= 75 ? 'PASSED / PROMOTED' : 'RETAINED'}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Attendance Summary (School Year {section.schoolYear})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="block text-xs font-semibold text-emerald-700">Total Days Present</span>
              <span className="text-2xl font-black text-emerald-950 mt-1">
                {Object.values(student.attendance || {}).reduce((acc: number, curr: any) => acc + (curr?.present || 0), 0)} Days
              </span>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <span className="block text-xs font-semibold text-rose-700">Total Days Absent</span>
              <span className="text-2xl font-black text-rose-950 mt-1">
                {Object.values(student.attendance || {}).reduce((acc: number, curr: any) => acc + (curr?.absent || 0), 0)} Days
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'values' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Learner's Observed Core Values</h2>
          <p className="text-xs text-slate-500">Department of Education Core Values Assessment</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h3 className="font-bold text-xs text-indigo-900 mb-1">1. Maka-Diyos</h3>
              <p className="text-xs text-slate-600">Expresses spiritual beliefs and upholds moral integrity.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h3 className="font-bold text-xs text-indigo-900 mb-1">2. Makatao</h3>
              <p className="text-xs text-slate-600">Sensitive to individual differences and solidarity in community.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h3 className="font-bold text-xs text-indigo-900 mb-1">3. Makakalikasan</h3>
              <p className="text-xs text-slate-600">Cares for environment and natural resources.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h3 className="font-bold text-xs text-indigo-900 mb-1">4. Makabansa</h3>
              <p className="text-xs text-slate-600">Demonstrates pride in Filipino identity and civic responsibility.</p>
            </div>
          </div>
        </div>
      )}

      {/* SF9 Modal */}
      {showSF9Modal && (
        <SF9Modal
          student={student}
          section={section}
          subjects={subjects}
          onClose={() => setShowSF9Modal(false)}
        />
      )}
    </div>
  );
};
