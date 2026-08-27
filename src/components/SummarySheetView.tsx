import React, { useState, useRef } from 'react';
import { ArrowLeft, Download, Printer, FileSpreadsheet, Award, Search, Users } from 'lucide-react';
import { Student, Subject, Section, TermNumber } from '../types';
import { calculateGrade } from '../lib/calculations';
import { formatStudentName, getGradeDescriptor, printHTMLContent } from '../utils';
import * as XLSX from 'xlsx-js-style';

interface SummarySheetViewProps {
  section: Section;
  subjects: Subject[];
  students: Student[];
  onBack: () => void;
}

export const SummarySheetView: React.FC<SummarySheetViewProps> = ({
  section,
  subjects,
  students,
  onBack
}) => {
  const [filterSex, setFilterSex] = useState<'All' | 'Male' | 'Female'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const activeStudents = students
    .filter(s => s.status !== 'Dropped Out' && s.status !== 'Transferred Out')
    .filter(s => filterSex === 'All' || s.sex === filterSex)
    .filter(s => {
      if (!searchQuery.trim()) return true;
      const full = formatStudentName(s).toLowerCase();
      const lrn = (s.lrn || s.studentNumber || '').toLowerCase();
      return full.includes(searchQuery.toLowerCase()) || lrn.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (a.sex !== b.sex) return (a.sex || '').localeCompare(b.sex || '');
      return (a.lastName || a.name).localeCompare(b.lastName || b.name);
    });

  // Calculate averages per student
  const studentRows = activeStudents.map(student => {
    const enrolledIds = student.enrolledSubjectIds || subjects.map(s => s.id);
    const studentSubjects = subjects.filter(s => enrolledIds.includes(s.id));

    const subjectGrades = studentSubjects.map(sub => {
      const q1 = calculateGrade(student, sub, 1).final;
      const q2 = calculateGrade(student, sub, 2).final;
      const q3 = calculateGrade(student, sub, 3).final;
      const q4 = calculateGrade(student, sub, 4).final;
      const valid = [q1, q2, q3, q4].filter(g => g > 0);
      const finalRating = valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
      return { subject: sub, q1, q2, q3, q4, finalRating };
    });

    const finalRatings = subjectGrades.map(sg => sg.finalRating).filter((g): g is number => g !== null);
    const generalAverage = finalRatings.length > 0
      ? Number((finalRatings.reduce((a, b) => a + b, 0) / finalRatings.length).toFixed(2))
      : null;

    const remarks = generalAverage ? (generalAverage >= 75 ? 'PROMOTED' : 'RETAINED') : '';

    return {
      student,
      subjectGrades,
      generalAverage,
      remarks,
      descriptor: generalAverage ? getGradeDescriptor(generalAverage) : ''
    };
  });

  // Export to Excel
  const handleExportExcel = () => {
    const rows: any[] = [];
    rows.push([`SUMMARY OF QUARTERLY GRADES & GENERAL AVERAGE`]);
    rows.push([`School: ${section.schoolName || 'Laguna National High School'}`, `School Year: ${section.schoolYear}`]);
    rows.push([`Grade & Section: Grade ${section.gradeLevel} - ${section.name}`, `Adviser: ${section.adviserName}`]);
    rows.push([]);

    const header = ['No.', 'Learner Name', 'LRN', 'Sex'];
    subjects.forEach(s => header.push(s.name));
    header.push('General Average', 'Remarks', 'Descriptor');
    rows.push(header);

    studentRows.forEach((sr, idx) => {
      const row: any[] = [
        idx + 1,
        formatStudentName(sr.student),
        sr.student.lrn || sr.student.studentNumber,
        sr.student.sex || ''
      ];
      subjects.forEach(s => {
        const found = sr.subjectGrades.find(g => g.subject.id === s.id);
        row.push(found?.finalRating || '-');
      });
      row.push(sr.generalAverage || '-', sr.remarks, sr.descriptor);
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Summary Sheet');
    XLSX.writeFile(wb, `SummarySheet_Grade${section.gradeLevel}_${section.name}.xlsx`);
  };

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
          <title>Summary of Quarterly Grades - Grade ${section.gradeLevel} ${section.name}</title>
          <meta charset="utf-8" />
          ${styles}
          <style>
            @media print {
              @page { size: landscape; margin: 10mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; font-family: 'Times New Roman', serif; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body class="bg-white p-6">
          ${content}
        </body>
      </html>
    `;
    printHTMLContent(html);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition border border-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Summary of Quarterly Grades & General Average
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Grade {section.gradeLevel} - {section.name} • Adviser: {section.adviserName} • S.Y. {section.schoolYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel Export
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Summary
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by learner name or LRN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Filter Sex:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
            {(['All', 'Male', 'Female'] as const).map(sex => (
              <button
                key={sex}
                onClick={() => setFilterSex(sex)}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  filterSex === sex ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {sex}
              </button>
            ))}
          </div>
          <span className="text-xs font-bold text-slate-600 ml-2">
            ({studentRows.length} Students)
          </span>
        </div>
      </div>

      {/* Printable Sheet View */}
      <div ref={printRef} className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 overflow-hidden">
        {/* Printable DepEd Header */}
        <div className="text-center space-y-1 mb-6 border-b border-slate-300 pb-4">
          <p className="text-xs uppercase font-sans text-slate-600">Department of Education • {section.region || 'Region IV-A'}</p>
          <h2 className="text-base font-bold uppercase text-slate-900">
            {section.schoolName || 'Laguna National High School'}
          </h2>
          <p className="text-sm font-semibold text-indigo-900">
            SUMMARY OF LEARNER GRADES AND GENERAL AVERAGE (GRADE {section.gradeLevel} - {section.name})
          </p>
          <p className="text-xs text-slate-500 font-mono">
            School Year: {section.schoolYear} • Class Adviser: {section.adviserName}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-800 text-white font-bold text-center">
                <th className="p-2 border border-slate-700 w-10">#</th>
                <th className="p-2 border border-slate-700 text-left min-w-[200px]">Learner Name</th>
                <th className="p-2 border border-slate-700 w-24">LRN</th>
                <th className="p-2 border border-slate-700 w-12">Sex</th>
                {subjects.map(sub => (
                  <th key={sub.id} className="p-2 border border-slate-700 text-[11px] font-medium min-w-[90px]">
                    {sub.name}
                  </th>
                ))}
                <th className="p-2 border border-slate-700 bg-indigo-900 text-amber-300 font-black w-24">Gen. Avg</th>
                <th className="p-2 border border-slate-700 bg-indigo-950 font-bold w-24">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {studentRows.map((sr, idx) => (
                <tr key={sr.student.id} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-indigo-50/30 transition`}>
                  <td className="p-2 text-center text-slate-500 font-mono text-[10px] border border-slate-200">{idx + 1}</td>
                  <td className="p-2 font-bold uppercase text-slate-800 border border-slate-200 whitespace-nowrap">
                    {formatStudentName(sr.student)}
                  </td>
                  <td className="p-2 text-center font-mono text-slate-600 border border-slate-200">{sr.student.lrn || sr.student.studentNumber}</td>
                  <td className="p-2 text-center text-slate-600 border border-slate-200">{sr.student.sex}</td>
                  {subjects.map(sub => {
                    const grade = sr.subjectGrades.find(g => g.subject.id === sub.id)?.finalRating;
                    return (
                      <td key={sub.id} className="p-2 text-center border border-slate-200 font-semibold font-mono">
                        {grade ? (
                          <span className={grade >= 75 ? 'text-slate-800' : 'text-rose-600 font-bold'}>
                            {grade}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-black text-sm bg-indigo-50 border border-slate-200 text-indigo-950 font-mono">
                    {sr.generalAverage || '-'}
                  </td>
                  <td className="p-2 text-center font-bold text-[10px] border border-slate-200">
                    <span className={sr.remarks === 'PROMOTED' ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded' : sr.remarks === 'RETAINED' ? 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded' : ''}>
                      {sr.remarks || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures for print */}
        <div className="grid grid-cols-2 gap-12 pt-12 text-center text-xs font-sans">
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
    </div>
  );
};
