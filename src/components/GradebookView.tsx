import React, { useState } from "react";
import { 
  BookOpen, 
  Save, 
  Lock, 
  Unlock, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  Download, 
  FileSpreadsheet, 
  User, 
  Calculator,
  Layers,
  ChevronDown
} from "lucide-react";
import { Subject, Student, Section, TermNumber, UserProfile, TermData } from "../types";
import { formatStudentName } from "../utils";

interface GradebookViewProps {
  subjects: Subject[];
  selectedSubjectId: string;
  onSelectSubject: (id: string) => void;
  students: Student[];
  onUpdateGrades: (studentId: string, subjectId: string, term: TermNumber, data: TermData) => void;
  onBulkUpdate?: any;
  onUpdateSubject?: any;
  activeTerm: TermNumber;
  onTermChange: (term: TermNumber) => void;
  selectedSection?: Section | null;
  globalNumTerms?: number;
  schoolCalendar?: any;
  onUnfinalizeYearEnd?: any;
  onCalculateYearEnd?: any;
  onToggleFinalizeSubjectTerm?: (subjectId: string, term: TermNumber) => void;
  currentUser?: UserProfile;
  globalSettings?: any;
}

export function GradebookView({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  students,
  onUpdateGrades,
  activeTerm,
  onTermChange,
  selectedSection,
  globalNumTerms = 4,
  currentUser,
  globalSettings
}: GradebookViewProps) {
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Helper to get raw component score total
  const getRawTotal = (scores: number[] = []) => {
    return scores.reduce((sum, s) => sum + (Number(s) || 0), 0);
  };

  const getMaxTotal = (maxScores: number[] = []) => {
    return maxScores.reduce((sum, s) => sum + (Number(s) || 0), 0);
  };

  // DepEd transmutation computation
  const computeQuarterlyGrade = (termData?: TermData, subject?: Subject) => {
    if (!termData || !subject) return null;
    const wwRaw = getRawTotal(termData.writtenWorks?.scores);
    const wwMax = getMaxTotal(termData.writtenWorks?.maxScores);
    const ptRaw = getRawTotal(termData.performanceTasks?.scores);
    const ptMax = getMaxTotal(termData.performanceTasks?.maxScores);
    const examRaw = Number(termData.termExam?.score) || 0;
    const examMax = Number(termData.termExam?.maxScore) || 0;

    const wwPct = wwMax > 0 ? (wwRaw / wwMax) * 100 : 0;
    const ptPct = ptMax > 0 ? (ptRaw / ptMax) * 100 : 0;
    const examPct = examMax > 0 ? (examRaw / examMax) * 100 : 0;

    const wwWeighted = (wwPct * (subject.wwWeight || 40)) / 100;
    const ptWeighted = (ptPct * (subject.ptWeight || 40)) / 100;
    const examWeighted = (examPct * (subject.taWeight || 20)) / 100;

    const initialGrade = wwWeighted + ptWeighted + examWeighted;
    if (initialGrade === 0 && wwMax === 0 && ptMax === 0 && examMax === 0) return null;

    // DepEd standard transmutation table approximation
    let transmuted = 60 + (initialGrade * 0.4);
    if (initialGrade >= 100) transmuted = 100;
    if (initialGrade <= 0) transmuted = 60;
    return Math.round(transmuted);
  };

  const handleScoreChange = (
    studentId: string,
    component: "writtenWorks" | "performanceTasks" | "termExam",
    index: number,
    field: "scores" | "maxScores" | "score" | "maxScore",
    value: string
  ) => {
    if (!currentSubject) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const studentGrades = student.grades?.[currentSubject.id]?.[activeTerm] || {
      writtenWorks: { scores: [0, 0, 0, 0, 0], maxScores: [20, 20, 20, 20, 20] },
      performanceTasks: { scores: [0, 0, 0, 0, 0], maxScores: [30, 30, 30, 30, 30] },
      summativeTests: { scores: [], maxScores: [] },
      termExam: { score: 0, maxScore: 50 }
    };

    const updatedData: TermData = JSON.parse(JSON.stringify(studentGrades));
    const numVal = value === "" ? 0 : Math.max(0, Number(value) || 0);

    if (component === "writtenWorks" || component === "performanceTasks") {
      if (field === "scores") {
        if (!updatedData[component].scores) updatedData[component].scores = [];
        updatedData[component].scores[index] = numVal;
      } else {
        if (!updatedData[component].maxScores) updatedData[component].maxScores = [];
        updatedData[component].maxScores[index] = numVal;
      }
    } else if (component === "termExam") {
      if (field === "score") {
        updatedData.termExam.score = numVal;
      } else {
        updatedData.termExam.maxScore = numVal;
      }
    }

    onUpdateGrades(studentId, currentSubject.id, activeTerm, updatedData);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={22} />
            DepEd Electronic Class Record (e-Class Record)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Record formative Written Works, Performance Tasks, and Quarterly Assessment in accordance with DO 8, s. 2015.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Subject:</span>
            <select
              value={currentSubject?.id || ""}
              onChange={(e) => onSelectSubject(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.subjectType || "CORE"})
                </option>
              ))}
            </select>
          </div>

          {/* Quarter / Term Selection */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {([1, 2, 3, 4] as TermNumber[]).map((t) => (
              <button
                key={t}
                onClick={() => onTermChange(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                  activeTerm === t
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Q{t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grade Table */}
      {!currentSubject ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400">
          <BookOpen size={36} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-bold text-slate-600">No subjects available</p>
          <p className="text-xs text-slate-400 mt-1">Please create a curriculum subject first in Subjects view.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Header Summary */}
          <div className="p-4 bg-slate-50/75 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-4">
              <span>Class: <strong className="text-slate-900">{selectedSection?.name || "MATATAG"}</strong></span>
              <span>&bull;</span>
              <span>Weights: <strong className="text-indigo-600">WW: {currentSubject.wwWeight}% | PT: {currentSubject.ptWeight}% | QA: {currentSubject.taWeight}%</strong></span>
            </div>
            <div className="text-[11px] text-slate-400">
              Grading Period: Quarter {activeTerm}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 w-10 text-center border-r border-slate-200">#</th>
                  <th className="py-3 px-4 min-w-[200px] border-r border-slate-200">Learner Name</th>
                  
                  {/* Written Works (WW 1-5) */}
                  <th colSpan={5} className="py-2 px-2 text-center bg-blue-50/70 border-r border-slate-200 text-blue-900">
                    Written Works ({currentSubject.wwWeight}%)
                  </th>

                  {/* Performance Tasks (PT 1-5) */}
                  <th colSpan={5} className="py-2 px-2 text-center bg-emerald-50/70 border-r border-slate-200 text-emerald-900">
                    Performance Tasks ({currentSubject.ptWeight}%)
                  </th>

                  {/* Quarterly Exam (QA) */}
                  <th className="py-2 px-3 text-center bg-purple-50/70 border-r border-slate-200 text-purple-900">
                    QA ({currentSubject.taWeight}%)
                  </th>

                  {/* Quarterly Grade */}
                  <th className="py-2 px-4 text-center bg-indigo-50 text-indigo-950">
                    Q{activeTerm} Final
                  </th>
                </tr>

                {/* Sub-headers for score columns */}
                <tr className="border-b border-slate-200 text-[10px] text-slate-400 font-mono text-center">
                  <th className="border-r border-slate-200"></th>
                  <th className="border-r border-slate-200"></th>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <th key={`ww-h-${i}`} className="py-1 px-1 bg-blue-50/30 border-r border-slate-100">
                      W{i}
                    </th>
                  ))}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <th key={`pt-h-${i}`} className="py-1 px-1 bg-emerald-50/30 border-r border-slate-100">
                      P{i}
                    </th>
                  ))}
                  <th className="py-1 px-1 bg-purple-50/30 border-r border-slate-200">Exam</th>
                  <th className="py-1 px-1 bg-indigo-50/50">Transmuted</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {students.map((st, idx) => {
                  const tData = st.grades?.[currentSubject.id]?.[activeTerm];
                  const qGrade = computeQuarterlyGrade(tData, currentSubject);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                        {formatStudentName(st)}
                      </td>

                      {/* WW inputs 1-5 */}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <td key={`ww-${i}`} className="p-1 text-center bg-blue-50/10 border-r border-slate-100">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={tData?.writtenWorks?.scores?.[i] ?? ""}
                            placeholder="-"
                            onChange={(e) => handleScoreChange(st.id, "writtenWorks", i, "scores", e.target.value)}
                            className="w-10 h-7 text-center font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                      ))}

                      {/* PT inputs 1-5 */}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <td key={`pt-${i}`} className="p-1 text-center bg-emerald-50/10 border-r border-slate-100">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={tData?.performanceTasks?.scores?.[i] ?? ""}
                            placeholder="-"
                            onChange={(e) => handleScoreChange(st.id, "performanceTasks", i, "scores", e.target.value)}
                            className="w-10 h-7 text-center font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                      ))}

                      {/* Quarterly Exam input */}
                      <td className="p-1 text-center bg-purple-50/10 border-r border-slate-200">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={tData?.termExam?.score ?? ""}
                          placeholder="-"
                          onChange={(e) => handleScoreChange(st.id, "termExam", 0, "score", e.target.value)}
                          className="w-12 h-7 text-center font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                        />
                      </td>

                      {/* Transmuted Grade */}
                      <td className="py-2.5 px-4 text-center bg-indigo-50/40">
                        {qGrade !== null ? (
                          <span
                            className={`font-mono font-black text-xs px-2 py-0.5 rounded-full ${
                              qGrade >= 75
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {qGrade}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {students.length === 0 && (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-slate-400">
                      No learners enrolled in this class.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
