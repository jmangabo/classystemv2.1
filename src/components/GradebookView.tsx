import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Lock, 
  Unlock, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Users,
  Search,
  Filter
} from 'lucide-react';
import { Student, Subject, Section, TermNumber, DEFAULT_TERM_DATA, TermData } from '../types';
import { calculateGrade, transmuteGrade } from '../lib/calculations';
import { formatStudentName } from '../utils';
import * as XLSX from 'xlsx-js-style';

interface GradebookViewProps {
  section: Section;
  subject: Subject;
  students: Student[];
  onBack: () => void;
  onUpdateStudents: (updated: Student[]) => void;
  onOpenClassRecordReport?: () => void;
}

export const GradebookView: React.FC<GradebookViewProps> = ({
  section,
  subject,
  students,
  onBack,
  onUpdateStudents,
  onOpenClassRecordReport
}) => {
  const [selectedTerm, setSelectedTerm] = useState<TermNumber>(1);
  const [filterSex, setFilterSex] = useState<'All' | 'Male' | 'Female'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocked, setIsLocked] = useState<boolean>(
    subject.finalizedTerms?.includes(selectedTerm) || false
  );

  // Local state for fast reactive editing
  const [localStudents, setLocalStudents] = useState<Student[]>(students);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Filter students
  const enrolledStudents = localStudents
    .filter(s => s.status !== 'Dropped Out' && s.status !== 'Transferred Out')
    .filter(s => !s.enrolledSubjectIds || s.enrolledSubjectIds.includes(subject.id))
    .filter(s => filterSex === 'All' || s.sex === filterSex)
    .filter(s => {
      if (!searchQuery.trim()) return true;
      const full = formatStudentName(s).toLowerCase();
      const lrn = (s.lrn || s.studentNumber || '').toLowerCase();
      return full.includes(searchQuery.toLowerCase()) || lrn.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Sort males first then females or alphabetical by last name
      if (a.sex !== b.sex) {
        return (a.sex || '').localeCompare(b.sex || '');
      }
      return (a.lastName || a.name).localeCompare(b.lastName || b.name);
    });

  // Handle max score changes (applied across all students for this subject & term)
  const handleMaxScoreChange = (
    type: 'writtenWorks' | 'performanceTasks' | 'summativeTests' | 'termExam',
    index: number,
    value: number
  ) => {
    if (isLocked) return;
    const updated = localStudents.map(student => {
      const grades = student.grades || {};
      const subGrades = grades[subject.id] || {};
      const termData: TermData = subGrades[selectedTerm] || JSON.parse(JSON.stringify(DEFAULT_TERM_DATA));

      if (type === 'termExam') {
        termData.termExam = { ...termData.termExam, maxScore: value };
      } else {
        const comp = { ...(termData[type] || { scores: [0,0,0,0,0], maxScores: [0,0,0,0,0] }) };
        const newMax = [...(comp.maxScores || [0,0,0,0,0])];
        newMax[index] = value;
        comp.maxScores = newMax;
        termData[type] = comp;
      }

      return {
        ...student,
        grades: {
          ...grades,
          [subject.id]: {
            ...subGrades,
            [selectedTerm]: termData
          }
        }
      };
    });

    setLocalStudents(updated);
    setHasUnsavedChanges(true);
  };

  // Handle individual score change
  const handleScoreChange = (
    studentId: string,
    type: 'writtenWorks' | 'performanceTasks' | 'summativeTests' | 'termExam',
    index: number,
    value: number
  ) => {
    if (isLocked) return;
    const updated = localStudents.map(student => {
      if (student.id !== studentId) return student;

      const grades = student.grades || {};
      const subGrades = grades[subject.id] || {};
      const termData: TermData = subGrades[selectedTerm] || JSON.parse(JSON.stringify(DEFAULT_TERM_DATA));

      if (type === 'termExam') {
        termData.termExam = { ...termData.termExam, score: value };
      } else {
        const comp = { ...(termData[type] || { scores: [0,0,0,0,0], maxScores: [0,0,0,0,0] }) };
        const newScores = [...(comp.scores || [0,0,0,0,0])];
        newScores[index] = value;
        comp.scores = newScores;
        termData[type] = comp;
      }

      return {
        ...student,
        grades: {
          ...grades,
          [subject.id]: {
            ...subGrades,
            [selectedTerm]: termData
          }
        }
      };
    });

    setLocalStudents(updated);
    setHasUnsavedChanges(true);
  };

  // Save changes
  const handleSave = () => {
    onUpdateStudents(localStudents);
    setHasUnsavedChanges(false);
  };

  // Export to DepEd format Excel
  const handleExportExcel = () => {
    const rows: any[] = [];
    rows.push([`DEPED E-CLASS RECORD - ${section.schoolName || 'Laguna National High School'}`]);
    rows.push([`Grade & Section: Grade ${section.gradeLevel} - ${section.name}`, `Subject: ${subject.name}`, `Quarter: Q${selectedTerm}`]);
    rows.push([`Teacher: ${section.adviserName}`, `School Year: ${section.schoolYear}`]);
    rows.push([]);

    // Table Header
    rows.push([
      'No.',
      'Learner Name',
      'LRN',
      'Sex',
      'WW 1', 'WW 2', 'WW 3', 'WW 4', 'WW 5', 'WW Total', 'WW PS', 'WW WS',
      'PT 1', 'PT 2', 'PT 3', 'PT 4', 'PT 5', 'PT Total', 'PT PS', 'PT WS',
      'ST 1', 'ST 2', 'Exam', 'QA Total', 'QA PS', 'QA WS',
      'Initial Grade',
      'Quarterly Grade'
    ]);

    enrolledStudents.forEach((student, idx) => {
      const calc = calculateGrade(student, subject, selectedTerm);
      const data = student.grades?.[subject.id]?.[selectedTerm] || DEFAULT_TERM_DATA;

      rows.push([
        idx + 1,
        formatStudentName(student),
        student.lrn || student.studentNumber,
        student.sex || '',
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

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Q${selectedTerm} Gradebook`);
    XLSX.writeFile(wb, `ClassRecord_Grade${section.gradeLevel}_${section.name}_${subject.name}_Q${selectedTerm}.xlsx`);
  };

  // Get current max scores from the first student as template
  const sampleTermData = localStudents[0]?.grades?.[subject.id]?.[selectedTerm] || DEFAULT_TERM_DATA;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition border border-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{subject.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                Grade {section.gradeLevel} - {section.name}
              </span>
              {isLocked && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Weights: Written Works ({subject.wwWeight}%) • Performance Tasks ({subject.ptWeight}%) • Quarterly Assessment ({subject.taWeight}%)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quarter Select */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {([1, 2, 3, 4] as TermNumber[]).map(term => (
              <button
                key={term}
                onClick={() => setSelectedTerm(term)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  selectedTerm === term
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Q{term}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              isLocked
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {isLocked ? 'Unlock Quarter' : 'Lock Quarter'}
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>

          {onOpenClassRecordReport && (
            <button
              onClick={onOpenClassRecordReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Class Record
            </button>
          )}

          {hasUnsavedChanges && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs animate-pulse"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
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
            ({enrolledStudents.length} Students)
          </span>
        </div>
      </div>

      {/* Grading Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
            <thead>
              {/* Top Category Header */}
              <tr className="bg-slate-800 text-white font-bold text-center text-[11px]">
                <th rowSpan={2} className="p-3 text-left w-12 border-r border-slate-700">#</th>
                <th rowSpan={2} className="p-3 text-left w-64 border-r border-slate-700">Learner Name</th>
                <th colSpan={7} className="p-2 border-r border-slate-700 bg-sky-900/80">
                  Written Works ({subject.wwWeight}%)
                </th>
                <th colSpan={7} className="p-2 border-r border-slate-700 bg-emerald-900/80">
                  Performance Tasks ({subject.ptWeight}%)
                </th>
                <th colSpan={5} className="p-2 border-r border-slate-700 bg-amber-900/80">
                  Quarterly Assessment ({subject.taWeight}%)
                </th>
                <th rowSpan={2} className="p-3 w-16 border-r border-slate-700 bg-slate-900">Initial</th>
                <th rowSpan={2} className="p-3 w-20 bg-indigo-900 text-amber-300 font-black">Quarterly Grade</th>
              </tr>

              {/* Sub-columns & Max Scores row */}
              <tr className="bg-slate-100 text-slate-700 font-semibold text-[10px] text-center border-b border-slate-300">
                {/* Written Works cols (1..5, Total, PS, WS) */}
                {[0, 1, 2, 3, 4].map(i => (
                  <th key={`ww_${i}`} className="p-1.5 w-12 border-r border-slate-200">
                    <span className="block text-slate-500 font-bold">W{i+1}</span>
                    <input
                      type="number"
                      disabled={isLocked}
                      value={sampleTermData.writtenWorks?.maxScores?.[i] || 0}
                      onChange={e => handleMaxScoreChange('writtenWorks', i, Number(e.target.value) || 0)}
                      className="w-full text-center py-0.5 bg-white border border-slate-300 rounded font-bold text-indigo-700"
                    />
                  </th>
                ))}
                <th className="p-1.5 w-12 bg-sky-50 border-r border-slate-200">PS</th>
                <th className="p-1.5 w-12 bg-sky-100 border-r border-slate-300 font-bold text-sky-900">WS</th>

                {/* Performance Tasks cols (1..5, Total, PS, WS) */}
                {[0, 1, 2, 3, 4].map(i => (
                  <th key={`pt_${i}`} className="p-1.5 w-12 border-r border-slate-200">
                    <span className="block text-slate-500 font-bold">P{i+1}</span>
                    <input
                      type="number"
                      disabled={isLocked}
                      value={sampleTermData.performanceTasks?.maxScores?.[i] || 0}
                      onChange={e => handleMaxScoreChange('performanceTasks', i, Number(e.target.value) || 0)}
                      className="w-full text-center py-0.5 bg-white border border-slate-300 rounded font-bold text-emerald-700"
                    />
                  </th>
                ))}
                <th className="p-1.5 w-12 bg-emerald-50 border-r border-slate-200">PS</th>
                <th className="p-1.5 w-12 bg-emerald-100 border-r border-slate-300 font-bold text-emerald-900">WS</th>

                {/* Quarterly Assessment cols */}
                <th className="p-1.5 w-12 border-r border-slate-200">
                  <span className="block text-slate-500 font-bold">ST1</span>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={sampleTermData.summativeTests?.maxScores?.[0] || 0}
                    onChange={e => handleMaxScoreChange('summativeTests', 0, Number(e.target.value) || 0)}
                    className="w-full text-center py-0.5 bg-white border border-slate-300 rounded font-bold text-amber-700"
                  />
                </th>
                <th className="p-1.5 w-12 border-r border-slate-200">
                  <span className="block text-slate-500 font-bold">ST2</span>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={sampleTermData.summativeTests?.maxScores?.[1] || 0}
                    onChange={e => handleMaxScoreChange('summativeTests', 1, Number(e.target.value) || 0)}
                    className="w-full text-center py-0.5 bg-white border border-slate-300 rounded font-bold text-amber-700"
                  />
                </th>
                <th className="p-1.5 w-12 border-r border-slate-200">
                  <span className="block text-slate-500 font-bold">Exam</span>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={sampleTermData.termExam?.maxScore || 0}
                    onChange={e => handleMaxScoreChange('termExam', 0, Number(e.target.value) || 0)}
                    className="w-full text-center py-0.5 bg-white border border-slate-300 rounded font-bold text-amber-700"
                  />
                </th>
                <th className="p-1.5 w-12 bg-amber-50 border-r border-slate-200">PS</th>
                <th className="p-1.5 w-12 bg-amber-100 border-r border-slate-300 font-bold text-amber-900">WS</th>
              </tr>
            </thead>
            <tbody>
              {enrolledStudents.map((student, idx) => {
                const calc = calculateGrade(student, subject, selectedTerm);
                const data = student.grades?.[subject.id]?.[selectedTerm] || DEFAULT_TERM_DATA;

                return (
                  <tr key={student.id} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-indigo-50/30 transition`}>
                    <td className="p-2.5 text-center text-slate-500 font-mono text-[10px] border-r border-slate-200">{idx + 1}</td>
                    <td className="p-2.5 font-bold uppercase text-slate-800 border-r border-slate-200 whitespace-nowrap">
                      {formatStudentName(student)}
                      <span className="block text-[10px] text-slate-400 font-mono normal-case">
                        {student.lrn || student.studentNumber} • {student.sex}
                      </span>
                    </td>

                    {/* Written Works Inputs */}
                    {[0, 1, 2, 3, 4].map(i => (
                      <td key={`ww_${i}`} className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          disabled={isLocked}
                          value={data.writtenWorks?.scores?.[i] || ''}
                          onChange={e => handleScoreChange(student.id, 'writtenWorks', i, Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full text-center py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-indigo-500 rounded font-medium text-slate-800"
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center bg-sky-50/60 text-slate-700 font-mono text-[10px] border-r border-slate-200">
                      {calc.ww.ps.toFixed(1)}
                    </td>
                    <td className="p-1 text-center bg-sky-100/60 font-bold text-sky-900 font-mono text-[10px] border-r border-slate-300">
                      {calc.ww.ws.toFixed(2)}
                    </td>

                    {/* Performance Tasks Inputs */}
                    {[0, 1, 2, 3, 4].map(i => (
                      <td key={`pt_${i}`} className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          disabled={isLocked}
                          value={data.performanceTasks?.scores?.[i] || ''}
                          onChange={e => handleScoreChange(student.id, 'performanceTasks', i, Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full text-center py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-emerald-500 rounded font-medium text-slate-800"
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center bg-emerald-50/60 text-slate-700 font-mono text-[10px] border-r border-slate-200">
                      {calc.pt.ps.toFixed(1)}
                    </td>
                    <td className="p-1 text-center bg-emerald-100/60 font-bold text-emerald-900 font-mono text-[10px] border-r border-slate-300">
                      {calc.pt.ws.toFixed(2)}
                    </td>

                    {/* Summative & Exam Inputs */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        disabled={isLocked}
                        value={data.summativeTests?.scores?.[0] || ''}
                        onChange={e => handleScoreChange(student.id, 'summativeTests', 0, Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full text-center py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-amber-500 rounded font-medium text-slate-800"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        disabled={isLocked}
                        value={data.summativeTests?.scores?.[1] || ''}
                        onChange={e => handleScoreChange(student.id, 'summativeTests', 1, Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full text-center py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-amber-500 rounded font-medium text-slate-800"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        disabled={isLocked}
                        value={data.termExam?.score || ''}
                        onChange={e => handleScoreChange(student.id, 'termExam', 0, Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full text-center py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-amber-500 rounded font-medium text-slate-800"
                      />
                    </td>
                    <td className="p-1 text-center bg-amber-50/60 text-slate-700 font-mono text-[10px] border-r border-slate-200">
                      {calc.ta.ps.toFixed(1)}
                    </td>
                    <td className="p-1 text-center bg-amber-100/60 font-bold text-amber-900 font-mono text-[10px] border-r border-slate-300">
                      {calc.ta.ws.toFixed(2)}
                    </td>

                    {/* Final Calculations */}
                    <td className="p-2 text-center font-bold text-slate-700 bg-slate-100/50 border-r border-slate-200 font-mono">
                      {calc.initial > 0 ? calc.initial.toFixed(2) : '-'}
                    </td>
                    <td className="p-2 text-center font-black text-sm bg-indigo-50/80">
                      {calc.final > 0 ? (
                        <span className={calc.final >= 75 ? 'text-indigo-700' : 'text-rose-600'}>
                          {calc.final}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal">-</span>
                      )}
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
