import React, { useRef } from 'react';
import { X, Printer, Download, FileSpreadsheet } from 'lucide-react';
import { Student, Subject, Section, TermNumber, DEFAULT_TERM_DATA } from '../types';
import { calculateGrade } from '../lib/calculations';
import { formatStudentName, printHTMLContent } from '../utils';
import * as XLSX from 'xlsx-js-style';

interface ClassRecordReportModalProps {
  subject: Subject;
  section: Section;
  students: Student[];
  term: TermNumber;
  onClose: () => void;
}

export const ClassRecordReportModal: React.FC<ClassRecordReportModalProps> = ({
  subject,
  section,
  students,
  term,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const activeStudents = students
    .filter(s => s.status !== 'Dropped Out' && s.status !== 'Transferred Out')
    .filter(s => !s.enrolledSubjectIds || s.enrolledSubjectIds.includes(subject.id));

  const males = activeStudents.filter(s => s.sex === 'Male').sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
  const females = activeStudents.filter(s => s.sex === 'Female').sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));

  const sampleTermData = activeStudents[0]?.grades?.[subject.id]?.[term] || DEFAULT_TERM_DATA;

  // Compute statistics
  const grades = activeStudents.map(s => calculateGrade(s, subject, term).final).filter(g => g > 0);
  const passedCount = grades.filter(g => g >= 75).length;
  const failedCount = grades.filter(g => g < 75).length;
  const highestGrade = grades.length > 0 ? Math.max(...grades) : 0;
  const lowestGrade = grades.length > 0 ? Math.min(...grades) : 0;
  const avgGrade = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2) : '0';

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
          <title>DepEd Class Record - Grade ${section.gradeLevel} ${section.name} - ${subject.name}</title>
          <meta charset="utf-8" />
          ${styles}
          <style>
            @media print {
              @page { size: landscape; margin: 8mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; font-family: 'Times New Roman', serif; }
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

  const handleExportExcel = () => {
    const rows: any[] = [];
    rows.push([`DEPED ELECTRONIC CLASS RECORD`]);
    rows.push([`School: ${section.schoolName || 'Laguna National High School'}`, `School ID: ${section.schoolId || '301234'}`]);
    rows.push([`Grade & Section: Grade ${section.gradeLevel} - ${section.name}`, `Subject: ${subject.name}`, `Quarter: Quarter ${term}`]);
    rows.push([`Teacher: ${section.adviserName}`, `School Year: ${section.schoolYear}`]);
    rows.push([]);

    const renderStudentList = (list: Student[], title: string) => {
      rows.push([title]);
      rows.push([
        'No.', 'Learner Name', 'LRN',
        'WW 1', 'WW 2', 'WW 3', 'WW 4', 'WW 5', 'WW Total', 'WW PS', 'WW WS',
        'PT 1', 'PT 2', 'PT 3', 'PT 4', 'PT 5', 'PT Total', 'PT PS', 'PT WS',
        'ST 1', 'ST 2', 'Exam', 'QA Total', 'QA PS', 'QA WS',
        'Initial Grade', 'Quarterly Grade'
      ]);

      list.forEach((s, idx) => {
        const calc = calculateGrade(s, subject, term);
        const data = s.grades?.[subject.id]?.[term] || DEFAULT_TERM_DATA;
        rows.push([
          idx + 1,
          formatStudentName(s),
          s.lrn || s.studentNumber,
          data.writtenWorks?.scores?.[0] || 0,
          data.writtenWorks?.scores?.[1] || 0,
          data.writtenWorks?.scores?.[2] || 0,
          data.writtenWorks?.scores?.[3] || 0,
          data.writtenWorks?.scores?.[4] || 0,
          calc.ww.total,
          calc.ww.ps.toFixed(2),
          calc.ww.ws.toFixed(2),
          data.performanceTasks?.scores?.[0] || 0,
          data.performanceTasks?.scores?.[1] || 0,
          data.performanceTasks?.scores?.[2] || 0,
          data.performanceTasks?.scores?.[3] || 0,
          data.performanceTasks?.scores?.[4] || 0,
          calc.pt.total,
          calc.pt.ps.toFixed(2),
          calc.pt.ws.toFixed(2),
          data.summativeTests?.scores?.[0] || 0,
          data.summativeTests?.scores?.[1] || 0,
          data.termExam?.score || 0,
          calc.ta.total,
          calc.ta.ps.toFixed(2),
          calc.ta.ws.toFixed(2),
          calc.initial.toFixed(2),
          calc.final
        ]);
      });
      rows.push([]);
    };

    renderStudentList(males, 'MALE LEARNERS');
    renderStudentList(females, 'FEMALE LEARNERS');

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `DepEd E-Class Record Q${term}`);
    XLSX.writeFile(wb, `DepEd_ClassRecord_Grade${section.gradeLevel}_${section.name}_${subject.name}_Q${term}.xlsx`);
  };

  const renderTableSection = (list: Student[], groupTitle: string) => (
    <div className="mb-4">
      <div className="bg-slate-200 px-3 py-1 font-bold text-slate-800 text-[11px] uppercase tracking-wider border border-slate-300">
        {groupTitle} ({list.length})
      </div>
      <table className="w-full text-[10px] text-left border-collapse border border-slate-300">
        <thead>
          <tr className="bg-slate-100 text-slate-800 font-bold text-center border-b border-slate-300">
            <th className="p-1 border-r border-slate-300 w-8">#</th>
            <th className="p-1 border-r border-slate-300 text-left w-48">Learner Name</th>
            {/* WW */}
            <th className="p-1 border-r border-slate-300 w-7">W1</th>
            <th className="p-1 border-r border-slate-300 w-7">W2</th>
            <th className="p-1 border-r border-slate-300 w-7">W3</th>
            <th className="p-1 border-r border-slate-300 w-7">W4</th>
            <th className="p-1 border-r border-slate-300 w-7">W5</th>
            <th className="p-1 border-r border-slate-300 w-8 bg-sky-50">Tot</th>
            <th className="p-1 border-r border-slate-300 w-8 bg-sky-50">PS</th>
            <th className="p-1 border-r border-slate-300 w-8 bg-sky-100 font-black">WS</th>
            {/* PT */}
            <th className="p-1 border-r border-slate-300 w-7">P1</th>
            <th className="p-1 border-r border-slate-300 w-7">P2</th>
            <th className="p-1 border-r border-slate-300 w-7">P3</th>
            <th className="p-1 border-r border-slate-300 w-7">P4</th>
            <th className="p-1 border-r border-slate-300 w-7">P5</th>
            <th className="p-1 border-r border-slate-300 w-8 bg-emerald-50">Tot</th>
            <th className="p-1 border-r border-slate-300 w-8 bg-emerald-50">PS</th>
            <th className="p-1 border-r border-slate-300 w-8 bg-emerald-100 font-black">WS</th>
            {/* QA */}
            <th className="p-1 border-r border-slate-300 w-7">ST1</th>
            <th className="p-1 border-r border-slate-300 w-7">ST2</th>
            <th className="p-1 border-r border-slate-300 w-7">Exam</th>
            <th className="p-1 border-r border-slate-300 w-8 bg-amber-50">Tot</th>
            <th className="p-1 border-r border-slate-300 w-8 bg-amber-50">PS</th>
            <th className="p-1 border-r border-slate-300 w-8 bg-amber-100 font-black">WS</th>
            {/* Final */}
            <th className="p-1 border-r border-slate-300 w-10 bg-slate-200">Init</th>
            <th className="p-1 w-12 bg-indigo-100 text-indigo-950 font-black">QG</th>
          </tr>
        </thead>
        <tbody>
          {list.map((student, idx) => {
            const calc = calculateGrade(student, subject, term);
            const data = student.grades?.[subject.id]?.[term] || DEFAULT_TERM_DATA;

            return (
              <tr key={student.id} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                <td className="p-1 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                <td className="p-1 font-bold uppercase text-slate-800 border-r border-slate-200 whitespace-nowrap">
                  {formatStudentName(student)}
                </td>
                {/* WW */}
                {[0, 1, 2, 3, 4].map(i => (
                  <td key={`ww_${i}`} className="p-1 text-center border-r border-slate-200">
                    {data.writtenWorks?.scores?.[i] || 0}
                  </td>
                ))}
                <td className="p-1 text-center font-bold bg-sky-50/60 border-r border-slate-200">{calc.ww.total}</td>
                <td className="p-1 text-center font-mono bg-sky-50/60 border-r border-slate-200">{calc.ww.ps.toFixed(1)}</td>
                <td className="p-1 text-center font-bold bg-sky-100/60 border-r border-slate-300">{calc.ww.ws.toFixed(2)}</td>
                {/* PT */}
                {[0, 1, 2, 3, 4].map(i => (
                  <td key={`pt_${i}`} className="p-1 text-center border-r border-slate-200">
                    {data.performanceTasks?.scores?.[i] || 0}
                  </td>
                ))}
                <td className="p-1 text-center font-bold bg-emerald-50/60 border-r border-slate-200">{calc.pt.total}</td>
                <td className="p-1 text-center font-mono bg-emerald-50/60 border-r border-slate-200">{calc.pt.ps.toFixed(1)}</td>
                <td className="p-1 text-center font-bold bg-emerald-100/60 border-r border-slate-300">{calc.pt.ws.toFixed(2)}</td>
                {/* QA */}
                <td className="p-1 text-center border-r border-slate-200">{data.summativeTests?.scores?.[0] || 0}</td>
                <td className="p-1 text-center border-r border-slate-200">{data.summativeTests?.scores?.[1] || 0}</td>
                <td className="p-1 text-center border-r border-slate-200">{data.termExam?.score || 0}</td>
                <td className="p-1 text-center font-bold bg-amber-50/60 border-r border-slate-200">{calc.ta.total}</td>
                <td className="p-1 text-center font-mono bg-amber-50/60 border-r border-slate-200">{calc.ta.ps.toFixed(1)}</td>
                <td className="p-1 text-center font-bold bg-amber-100/60 border-r border-slate-300">{calc.ta.ws.toFixed(2)}</td>
                {/* Final */}
                <td className="p-1 text-center font-bold font-mono bg-slate-100 border-r border-slate-200">
                  {calc.initial > 0 ? calc.initial.toFixed(2) : '-'}
                </td>
                <td className="p-1 text-center font-black text-[11px] bg-indigo-50 text-indigo-950">
                  {calc.final > 0 ? calc.final : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 my-4">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Department of Education Class Record Report
            </h2>
            <p className="text-xs text-slate-500">
              Quarter {term} • {subject.name} • Grade {section.gradeLevel} - {section.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="p-6 overflow-y-auto flex-1 bg-white font-sans">
          {/* Header Banner */}
          <div className="text-center mb-6 border-b border-slate-300 pb-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">
              Republic of the Philippines • Department of Education
            </p>
            <h1 className="text-base font-black uppercase text-slate-900 mt-0.5">
              {section.schoolName || 'Laguna National High School'}
            </h1>
            <p className="text-xs text-slate-700 font-bold mt-1">
              CLASS RECORD IN {subject.name.toUpperCase()} — QUARTER {term}
            </p>
            <div className="flex justify-center gap-6 text-[11px] text-slate-600 mt-2 font-medium">
              <span>Grade & Section: <strong>Grade {section.gradeLevel} - {section.name}</strong></span>
              <span>School Year: <strong>{section.schoolYear}</strong></span>
              <span>Teacher: <strong>{section.adviserName}</strong></span>
            </div>
          </div>

          {/* Tables for Males and Females */}
          {renderTableSection(males, 'Male Learners')}
          {renderTableSection(females, 'Female Learners')}

          {/* Summary Statistics */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
            <div>
              <span className="block text-slate-500 text-[10px]">Total Learners</span>
              <span className="font-black text-slate-800 text-sm">{activeStudents.length}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-[10px]">Passed (≥75)</span>
              <span className="font-black text-emerald-700 text-sm">{passedCount}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-[10px]">Failed (&lt;75)</span>
              <span className="font-black text-rose-700 text-sm">{failedCount}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-[10px]">Highest Grade</span>
              <span className="font-black text-indigo-700 text-sm">{highestGrade}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-[10px]">Quarter Average</span>
              <span className="font-black text-slate-900 text-sm">{avgGrade}</span>
            </div>
          </div>

          {/* Signature Lines */}
          <div className="grid grid-cols-3 gap-8 pt-12 text-center text-xs">
            <div>
              <div className="border-b border-slate-800 pb-1 mb-1 font-bold uppercase">{section.adviserName}</div>
              <p className="text-slate-500 text-[11px]">Subject Teacher</p>
            </div>
            <div>
              <div className="border-b border-slate-800 pb-1 mb-1 font-bold uppercase">Master Teacher / Dept. Head</div>
              <p className="text-slate-500 text-[11px]">Checked by</p>
            </div>
            <div>
              <div className="border-b border-slate-800 pb-1 mb-1 font-bold uppercase">{section.headOfSchool || 'School Head / Principal'}</div>
              <p className="text-slate-500 text-[11px]">School Head / Principal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
