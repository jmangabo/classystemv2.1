import React, { useRef, useState } from 'react';
import { X, Printer, Download, Award, CheckCircle2, ShieldCheck, FileText, UserCheck, Lock } from 'lucide-react';
import { Student, Subject, Section, TermNumber } from '../types';
import { calculateGrade, transmuteGrade } from '../lib/calculations';
import { formatStudentName, getGradeDescriptor, printHTMLContent } from '../utils';

interface SF9ModalProps {
  student: Student;
  section: Section;
  subjects: Subject[];
  onClose: () => void;
  onUpdateStudent?: (student: Student) => void;
}

const MONTHS_ORDER = [
  'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'
];

const CORE_VALUES_CONFIG = [
  {
    coreValue: '1. Maka-Diyos',
    statements: [
      { id: 'cv1_1', text: 'Expresses one’s personal spiritual beliefs while respecting the spiritual beliefs of others.' },
      { id: 'cv1_2', text: 'Shows adherence to ethical principles by upholding the truth.' }
    ]
  },
  {
    coreValue: '2. Makatao',
    statements: [
      { id: 'cv2_1', text: 'Is sensitive to individual, social, and cultural differences.' },
      { id: 'cv2_2', text: 'Demonstrates solidarity and support towards common good in school and community.' }
    ]
  },
  {
    coreValue: '3. Makakalikasan',
    statements: [
      { id: 'cv3_1', text: 'Cares for the environment and utilizes resources wisely, judiciously, and economically.' }
    ]
  },
  {
    coreValue: '4. Makabansa',
    statements: [
      { id: 'cv4_1', text: 'Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen.' },
      { id: 'cv4_2', text: 'Demonstrates appropriate behavior in carrying out activities in the school, community, and country.' }
    ]
  }
];

export const SF9Modal: React.FC<SF9ModalProps> = ({
  student,
  section,
  subjects,
  onClose,
  onUpdateStudent
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'signatures'>('preview');
  const printRef = useRef<HTMLDivElement>(null);

  // Compute grades per subject
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
          <title>SF9 - ${formatStudentName(student)}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${styles}
          <style>
            @media print {
              @page { size: letter portrait; margin: 8mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; font-family: 'Times New Roman', serif; }
              .page-break { page-break-before: always; }
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
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                DepEd Form 9 (SF9) / Learner Progress Report Card
              </h2>
              <p className="text-xs text-slate-500">
                {formatStudentName(student)} • LRN: {student.lrn || student.studentNumber} • Grade {section.gradeLevel} - {section.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print SF9 Card
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Report Card Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div ref={printRef} className="space-y-8 max-w-4xl mx-auto">
            {/* PAGE 1: FRONT (ACADEMIC PROGRESS) */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-300 text-slate-900 font-serif">
              {/* DepEd Header */}
              <div className="text-center space-y-1 mb-6 border-b-2 border-slate-800 pb-4">
                <p className="text-xs uppercase tracking-widest font-sans text-slate-600">Republic of the Philippines</p>
                <p className="text-sm font-bold uppercase tracking-wider">Department of Education</p>
                <p className="text-xs uppercase">{section.region || 'Region IV-A CALABARZON'}</p>
                <p className="text-xs uppercase">{section.division || 'Division of Laguna'}</p>
                <p className="text-xs uppercase">{section.district || 'District of Sta. Cruz'}</p>
                <h1 className="text-base font-black uppercase text-slate-900 mt-2">
                  {section.schoolName || 'Laguna National High School'}
                </h1>
                <p className="text-xs font-mono">School ID: {section.schoolId || '301234'} • School Year: {section.schoolYear || '2025-2026'}</p>
                <h2 className="text-sm font-bold uppercase tracking-wide mt-2 text-indigo-900 font-sans">
                  PROGRESS REPORT CARD (SF9)
                </h2>
              </div>

              {/* Learner Info Grid */}
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
                  <span className="font-semibold text-slate-600">Age: </span>
                  <span className="font-bold text-slate-900">{student.age || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Class Adviser: </span>
                  <span className="font-bold text-slate-900">{section.adviserName}</span>
                </div>
              </div>

              {/* Learning Progress Table */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider mb-2 font-sans flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  REPORT ON LEARNING PROGRESS AND ACHIEVEMENT
                </h3>
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

              {/* Grading Scale & Descriptors */}
              <div className="grid grid-cols-2 gap-4 text-[10px] font-sans border border-slate-300 p-3 rounded bg-slate-50 mb-6">
                <div>
                  <p className="font-bold text-slate-700 mb-1">Descriptors</p>
                  <p>Outstanding</p>
                  <p>Very Satisfactory</p>
                  <p>Satisfactory</p>
                  <p>Fairly Satisfactory</p>
                  <p>Did Not Meet Expectations</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-1">Grading Scale / Remarks</p>
                  <p>90 – 100 (Passed)</p>
                  <p>85 – 89 (Passed)</p>
                  <p>80 – 84 (Passed)</p>
                  <p>75 – 79 (Passed)</p>
                  <p>Below 75 (Failed)</p>
                </div>
              </div>

              {/* Signatures Row */}
              <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs font-sans">
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

            {/* PAGE 2: BACK (OBSERVED VALUES & ATTENDANCE & CERTIFICATE OF TRANSFER) */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-300 text-slate-900 font-serif page-break">
              {/* Observed Values Header */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider mb-2 font-sans flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  REPORT ON LEARNER'S OBSERVED VALUES (CORE VALUES)
                </h3>
                <table className="w-full border-collapse border border-slate-800 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-center font-bold">
                      <th className="border border-slate-800 p-2 text-left w-1/4">Core Values</th>
                      <th className="border border-slate-800 p-2 text-left">Behavior Statements</th>
                      <th className="border border-slate-800 p-1 w-10">Q1</th>
                      <th className="border border-slate-800 p-1 w-10">Q2</th>
                      <th className="border border-slate-800 p-1 w-10">Q3</th>
                      <th className="border border-slate-800 p-1 w-10">Q4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CORE_VALUES_CONFIG.map((cv, cvIdx) => (
                      <React.Fragment key={cv.coreValue}>
                        {cv.statements.map((st, stIdx) => {
                          const v1 = student.observedValues?.[1]?.[st.id] || 'AO';
                          const v2 = student.observedValues?.[2]?.[st.id] || 'AO';
                          const v3 = student.observedValues?.[3]?.[st.id] || 'AO';
                          const v4 = student.observedValues?.[4]?.[st.id] || 'AO';

                          return (
                            <tr key={st.id}>
                              {stIdx === 0 && (
                                <td
                                  rowSpan={cv.statements.length}
                                  className="border border-slate-800 p-2 font-bold align-top bg-slate-50/50"
                                >
                                  {cv.coreValue}
                                </td>
                              )}
                              <td className="border border-slate-800 p-2 text-[10px] leading-relaxed">{st.text}</td>
                              <td className="border border-slate-800 p-1 text-center font-bold text-[10px]">{v1}</td>
                              <td className="border border-slate-800 p-1 text-center font-bold text-[10px]">{v2}</td>
                              <td className="border border-slate-800 p-1 text-center font-bold text-[10px]">{v3}</td>
                              <td className="border border-slate-800 p-1 text-center font-bold text-[10px]">{v4}</td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                <div className="text-[10px] font-sans text-slate-500 mt-1 flex justify-between px-1">
                  <span><strong>AO</strong> - Always Observed (95-100%)</span>
                  <span><strong>SO</strong> - Sometimes Observed (85-94%)</span>
                  <span><strong>RO</strong> - Rarely Observed (75-84%)</span>
                  <span><strong>NO</strong> - Not Observed (Below 75%)</span>
                </div>
              </div>

              {/* Attendance Record */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider mb-2 font-sans flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  REPORT ON ATTENDANCE
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-800 text-[10px] text-center">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-slate-800 p-1.5 text-left w-24">Month</th>
                        {MONTHS_ORDER.map(m => (
                          <th key={m} className="border border-slate-800 p-1 w-10">{m}</th>
                        ))}
                        <th className="border border-slate-800 p-1 w-14 font-bold bg-slate-200">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-800 p-1 text-left font-semibold">Days of School</td>
                        {MONTHS_ORDER.map(m => (
                          <td key={m} className="border border-slate-800 p-1">
                            {((student.attendance?.[m]?.present || 0) + (student.attendance?.[m]?.absent || 0)) || '-'}
                          </td>
                        ))}
                        <td className="border border-slate-800 p-1 font-bold bg-slate-50">
                          {MONTHS_ORDER.reduce((acc, m) => acc + (student.attendance?.[m]?.present || 0) + (student.attendance?.[m]?.absent || 0), 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 p-1 text-left font-semibold">Days Present</td>
                        {MONTHS_ORDER.map(m => (
                          <td key={m} className="border border-slate-800 p-1">
                            {student.attendance?.[m]?.present || '-'}
                          </td>
                        ))}
                        <td className="border border-slate-800 p-1 font-bold bg-slate-50 text-emerald-700">
                          {MONTHS_ORDER.reduce((acc, m) => acc + (student.attendance?.[m]?.present || 0), 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 p-1 text-left font-semibold">Days Absent</td>
                        {MONTHS_ORDER.map(m => (
                          <td key={m} className="border border-slate-800 p-1">
                            {student.attendance?.[m]?.absent || '-'}
                          </td>
                        ))}
                        <td className="border border-slate-800 p-1 font-bold bg-slate-50 text-rose-700">
                          {MONTHS_ORDER.reduce((acc, m) => acc + (student.attendance?.[m]?.absent || 0), 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Certificate of Transfer */}
              <div className="border border-slate-400 p-4 rounded text-xs font-sans space-y-3 bg-slate-50/50">
                <h4 className="font-bold uppercase tracking-wider text-center border-b border-slate-300 pb-1 text-slate-800">
                  CERTIFICATE OF TRANSFER
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium text-slate-600">Admitted to Grade: </span>
                    <span className="font-bold border-b border-slate-600 px-2">Grade {section.gradeLevel + 1}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Section: </span>
                    <span className="font-bold border-b border-slate-600 px-2">_______________</span>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  Eligible for admission to Grade <strong>{section.gradeLevel + 1}</strong>. Has no deficiency in any subject area required by the Department of Education.
                </p>
                <div className="grid grid-cols-2 gap-8 pt-4 text-center">
                  <div>
                    <div className="border-b border-slate-800 pb-1 font-bold uppercase">{section.adviserName}</div>
                    <p className="text-[10px] text-slate-500">Teacher / Adviser</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-800 pb-1 font-bold uppercase">{section.headOfSchool || 'Principal / School Head'}</div>
                    <p className="text-[10px] text-slate-500">School Head / Principal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
