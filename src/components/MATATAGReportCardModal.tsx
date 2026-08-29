import React from "react";
import { 
  X, 
  Printer, 
  Download, 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  FileText, 
  School as SchoolIcon 
} from "lucide-react";
import { Student, Section, Subject, TermNumber } from "../types";
import { formatStudentName } from "../utils";

interface MATATAGReportCardModalProps {
  student: Student;
  section: Section;
  subjects: Subject[];
  onClose: () => void;
  calendar?: any;
  globalNumTerms?: number;
}

export function MATATAGReportCardModal({
  student,
  section,
  subjects,
  onClose,
  calendar,
  globalNumTerms = 4
}: MATATAGReportCardModalProps) {
  // Helper to calculate quarterly grade
  const getSubjectQuarterlyGrade = (sub: Subject, term: number) => {
    const termData = student.grades?.[sub.id]?.[term as TermNumber];
    if (!termData) return "-";

    const wwRaw = (termData.writtenWorks?.scores || []).reduce((a, b) => a + (Number(b) || 0), 0);
    const wwMax = (termData.writtenWorks?.maxScores || []).reduce((a, b) => a + (Number(b) || 0), 0);
    const ptRaw = (termData.performanceTasks?.scores || []).reduce((a, b) => a + (Number(b) || 0), 0);
    const ptMax = (termData.performanceTasks?.maxScores || []).reduce((a, b) => a + (Number(b) || 0), 0);
    const examRaw = Number(termData.termExam?.score) || 0;
    const examMax = Number(termData.termExam?.maxScore) || 0;

    const wwPct = wwMax > 0 ? (wwRaw / wwMax) * 100 : 0;
    const ptPct = ptMax > 0 ? (ptRaw / ptMax) * 100 : 0;
    const examPct = examMax > 0 ? (examRaw / examMax) * 100 : 0;

    const initial = (wwPct * (sub.wwWeight || 40)) / 100 + (ptPct * (sub.ptWeight || 40)) / 100 + (examPct * (sub.taWeight || 20)) / 100;
    if (initial === 0 && wwMax === 0 && ptMax === 0 && examMax === 0) return "-";

    let transmuted = 60 + (initial * 0.4);
    if (initial >= 100) transmuted = 100;
    if (initial <= 0) transmuted = 60;
    return Math.round(transmuted).toString();
  };

  const getFinalRating = (sub: Subject) => {
    const grades: number[] = [];
    for (let t = 1; t <= 4; t++) {
      const g = getSubjectQuarterlyGrade(sub, t);
      if (g !== "-") grades.push(Number(g));
    }
    if (grades.length === 0) return "-";
    const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
    return Math.round(avg).toString();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header Actions */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <FileText size={16} className="text-indigo-400" />
            DepEd School Form 9 (SF9) Progress Report Card
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="p-8 space-y-6 text-slate-800 bg-white" id="sf9-print-card">
          {/* DepEd Official Header */}
          <div className="text-center space-y-1 border-b border-slate-200 pb-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Republic of the Philippines &bull; Department of Education
            </div>
            <div className="text-[11px] font-bold uppercase text-slate-600">
              {section.region || "Region VII"} &bull; {section.division || "Division of Cebu Province"}
            </div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
              {section.schoolName || "DepEd Central Secondary School"}
            </h2>
            <div className="text-xs font-mono text-slate-500 font-bold">
              School ID: {section.schoolId || "DEPED-10902"}
            </div>
            <h1 className="text-lg font-black text-indigo-900 tracking-tight pt-2 uppercase">
              MATATAG LEARNER PROGRESS REPORT CARD (SF9)
            </h1>
            <p className="text-xs font-bold text-slate-600">School Year: {section.schoolYear || "2025-2026"}</p>
          </div>

          {/* Student Info Box */}
          <div className="grid grid-cols-2 gap-4 text-xs font-medium border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Learner Name</span>
              <strong className="text-sm font-black text-slate-900">{formatStudentName(student)}</strong>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Learner Reference Number (LRN)</span>
              <strong className="text-sm font-mono font-black text-slate-900">{student.lrn || "N/A"}</strong>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Grade & Section</span>
              <strong className="text-slate-800">Grade {section.gradeLevel} - {section.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Class Adviser</span>
              <strong className="text-slate-800">{section.adviserName || "Class Adviser"}</strong>
            </div>
          </div>

          {/* Report on Learning Progress and Achievement */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              REPORT ON LEARNING PROGRESS AND ACHIEVEMENT
            </h3>
            <table className="w-full text-xs border border-slate-300 text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-2.5 border border-slate-300">Learning Areas</th>
                  <th className="p-2.5 border border-slate-300 text-center w-12">1</th>
                  <th className="p-2.5 border border-slate-300 text-center w-12">2</th>
                  <th className="p-2.5 border border-slate-300 text-center w-12">3</th>
                  <th className="p-2.5 border border-slate-300 text-center w-12">4</th>
                  <th className="p-2.5 border border-slate-300 text-center w-16">Final</th>
                  <th className="p-2.5 border border-slate-300 text-center w-20">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subjects.map((sub) => {
                  const fRating = getFinalRating(sub);
                  const isPassed = fRating !== "-" && Number(fRating) >= 75;

                  return (
                    <tr key={sub.id}>
                      <td className="p-2.5 border border-slate-300 font-bold text-slate-900">{sub.name}</td>
                      {[1, 2, 3, 4].map((t) => (
                        <td key={t} className="p-2.5 border border-slate-300 text-center font-mono font-bold">
                          {getSubjectQuarterlyGrade(sub, t)}
                        </td>
                      ))}
                      <td className="p-2.5 border border-slate-300 text-center font-mono font-black text-indigo-900">
                        {fRating}
                      </td>
                      <td className="p-2.5 border border-slate-300 text-center font-bold text-[10px]">
                        {fRating === "-" ? "-" : isPassed ? (
                          <span className="text-emerald-700">PASSED</span>
                        ) : (
                          <span className="text-rose-700">FAILED</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Grading Scale Legend */}
          <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500 border-t border-slate-200 pt-4">
            <div>
              <strong>Descriptors & Grading Scale:</strong>
              <div className="mt-1 space-y-0.5 font-mono">
                <div>Outstanding: 90 - 100 (O)</div>
                <div>Very Satisfactory: 85 - 89 (VS)</div>
                <div>Satisfactory: 80 - 84 (S)</div>
                <div>Fairly Satisfactory: 75 - 79 (FS)</div>
                <div>Did Not Meet Expectations: Below 75 (DNM)</div>
              </div>
            </div>
            <div className="text-right space-y-8">
              <div>
                <div className="font-bold text-slate-800 uppercase">{section.adviserName || "Class Adviser"}</div>
                <div className="text-slate-400">Class Adviser</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 uppercase">{section.headOfSchool || "School Principal"}</div>
                <div className="text-slate-400">School Head / Principal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
