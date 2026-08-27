import React, { useRef, useState } from 'react';
import { X, Printer, Users, Award, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { Student, Subject, Section } from '../types';
import { calculateGrade } from '../lib/calculations';
import { formatStudentName, getGradeDescriptor, printHTMLContent } from '../utils';

interface BatchSF9ModalProps {
  students: Student[];
  section: Section;
  subjects: Subject[];
  onClose: () => void;
}

const MONTHS_ORDER = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

export const BatchSF9Modal: React.FC<BatchSF9ModalProps> = ({
  students,
  section,
  subjects,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [filterSex, setFilterSex] = useState<'All' | 'Male' | 'Female'>('All');

  const filteredStudents = students
    .filter(s => s.status !== 'Dropped Out' && s.status !== 'Transferred Out')
    .filter(s => filterSex === 'All' || s.sex === filterSex)
    .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Batch SF9 - Grade ${section.gradeLevel} ${section.name}</title>
          <meta charset="utf-8" />
          ${styles}
          <style>
            @media print {
              @page { size: letter portrait; margin: 8mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; font-family: 'Times New Roman', serif; }
              .sf9-card { page-break-after: always; }
              .sf9-back { page-break-before: always; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body class="bg-white p-4">
          ${content}
        </body>
      </html>
    `;
    printHTMLContent(html);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Batch SF9 Progress Report Cards
              </h2>
              <p className="text-xs text-slate-500">
                Grade {section.gradeLevel} - {section.name} • {filteredStudents.length} Active Learners
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
              {(['All', 'Male', 'Female'] as const).map(sex => (
                <button
                  key={sex}
                  onClick={() => setFilterSex(sex)}
                  className={`px-3 py-1 rounded-md transition ${filterSex === sex ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {sex}
                </button>
              ))}
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print All ({filteredStudents.length})
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div ref={printRef} className="space-y-12 max-w-4xl mx-auto">
            {filteredStudents.map(student => {
              const enrolledSubjectIds = student.enrolledSubjectIds || subjects.map(s => s.id);
              const activeSubjects = subjects.filter(s => enrolledSubjectIds.includes(s.id));

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
                ? Math.round(finalRatings.reduce((a, b) => a + b, 0) / finalRatings.length)
                : null;

              const genRemarks = generalAverage ? (generalAverage >= 75 ? 'PROMOTED' : 'RETAINED') : '';

              return (
                <div key={student.id} className="sf9-card bg-white p-8 rounded-lg shadow-sm border border-slate-300 text-slate-900 font-serif">
                  {/* DepEd Header */}
                  <div className="text-center space-y-1 mb-6 border-b-2 border-slate-800 pb-4">
                    <p className="text-xs uppercase tracking-widest font-sans text-slate-600">Republic of the Philippines</p>
                    <p className="text-sm font-bold uppercase tracking-wider">Department of Education</p>
                    <p className="text-xs uppercase">{section.region || 'Region IV-A CALABARZON'}</p>
                    <p className="text-xs uppercase">{section.division || 'Division of Laguna'}</p>
                    <h1 className="text-base font-black uppercase text-slate-900 mt-2">
                      {section.schoolName || 'Laguna National High School'}
                    </h1>
                    <p className="text-xs font-mono">School ID: {section.schoolId || '301234'} • School Year: {section.schoolYear || '2025-2026'}</p>
                    <h2 className="text-sm font-bold uppercase tracking-wide mt-2 text-indigo-900 font-sans">
                      PROGRESS REPORT CARD (SF9)
                    </h2>
                  </div>

                  {/* Learner Info */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-sans mb-6 bg-slate-50 p-4 rounded border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-600">Name: </span>
                      <span className="font-bold uppercase text-slate-900">{formatStudentName(student)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600">LRN: </span>
                      <span className="font-mono font-bold text-slate-900">{student.lrn || student.studentNumber}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600">Grade & Section: </span>
                      <span className="font-bold text-slate-900">Grade {section.gradeLevel} - {section.name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600">Sex: </span>
                      <span className="font-bold text-slate-900">{student.sex || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600">Class Adviser: </span>
                      <span className="font-bold text-slate-900">{section.adviserName}</span>
                    </div>
                  </div>

                  {/* Learning Progress Table */}
                  <div className="mb-6">
                    <table className="w-full border-collapse border border-slate-800 text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-center font-bold">
                          <th className="border border-slate-800 p-2 text-left w-2/5">Learning Areas</th>
                          <th className="border border-slate-800 p-2 w-12">1</th>
                          <th className="border border-slate-800 p-2 w-12">2</th>
                          <th className="border border-slate-800 p-2 w-12">3</th>
                          <th className="border border-slate-800 p-2 w-12">4</th>
                          <th className="border border-slate-800 p-2 w-16">Final</th>
                          <th className="border border-slate-800 p-2 w-20">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectGrades.map((sg, idx) => (
                          <tr key={sg.subject.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="border border-slate-800 px-3 py-1.5 font-medium">{sg.subject.name}</td>
                            <td className="border border-slate-800 px-2 py-1.5 text-center">{sg.q1 || '-'}</td>
                            <td className="border border-slate-800 px-2 py-1.5 text-center">{sg.q2 || '-'}</td>
                            <td className="border border-slate-800 px-2 py-1.5 text-center">{sg.q3 || '-'}</td>
                            <td className="border border-slate-800 px-2 py-1.5 text-center">{sg.q4 || '-'}</td>
                            <td className="border border-slate-800 px-2 py-1.5 text-center font-bold">{sg.finalRating || '-'}</td>
                            <td className="border border-slate-800 px-2 py-1.5 text-center font-semibold text-[10px]">
                              <span className={sg.remarks === 'PASSED' ? 'text-emerald-700' : sg.remarks === 'FAILED' ? 'text-rose-700' : ''}>
                                {sg.remarks || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-bold">
                          <td className="border border-slate-800 px-3 py-2 text-right uppercase">General Average</td>
                          <td colSpan={4} className="border border-slate-800 px-2 py-2 text-center text-slate-500 font-normal italic">
                            {generalAverage ? getGradeDescriptor(generalAverage) : ''}
                          </td>
                          <td className="border border-slate-800 px-2 py-2 text-center text-sm font-black text-indigo-900">
                            {generalAverage || '-'}
                          </td>
                          <td className="border border-slate-800 px-2 py-2 text-center font-black">
                            <span className={genRemarks === 'PROMOTED' ? 'text-emerald-700' : genRemarks === 'RETAINED' ? 'text-rose-700' : ''}>
                              {genRemarks || '-'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs font-sans">
                    <div>
                      <div className="border-b border-slate-800 pb-1 mb-1 font-bold uppercase">{section.adviserName}</div>
                      <p className="text-slate-500 text-[11px]">Class Adviser</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-800 pb-1 mb-1 font-bold uppercase">{section.headOfSchool || 'Principal / School Head'}</div>
                      <p className="text-slate-500 text-[11px]">School Head / Principal</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
