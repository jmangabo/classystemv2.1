import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Student, Section, Subject, TermNumber } from '../types';
import { X, Printer, BookOpen, Loader2 } from 'lucide-react';
import { formatStudentName } from '../utils';
import { calculateGrade } from '../lib/calculations';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface SF10ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  allEnrollments: { student: Student; section: Section }[];
  schoolCalendar: any[];
}

const COMMUNICATION_COMPONENTS = ['Effective Communication', 'Mabisang Komunikasyon'];

const normalize = (v: any) => String(v || '').trim().toLowerCase();

const isCommunication = (s: Subject) =>
  COMMUNICATION_COMPONENTS.some(n => normalize(s.name) === normalize(n));

const getUnits = (s: any) => {
  const u = Number(s?.unit ?? s?.units);
  return u > 0 ? u : 0;
};

const getTermGrade = (s: Student, subject: Subject, term: TermNumber): number => {
  // IMPORTANT: SF10 must read the learner's STORED grade for this exact
  // subject/term from Firestore first. This prevents Mabisang Komunikasyon
  // from being replaced by a default/calculated 100.
  if (subject.offeredTerms?.length && !subject.offeredTerms.includes(term)) return 0;
  if (!Array.isArray(subject.finalizedTerms) || !subject.finalizedTerms.includes(term)) return 0;

  const stored = s?.grades?.[subject.id]?.[term] as any;

  // manualFinalGrade is the saved/finalized grade for this subject and term.
  // It must take precedence over recomputation.
  const storedManual = Number(stored?.manualFinalGrade);
  if (Number.isFinite(storedManual) && storedManual > 0) {
    return Math.round(storedManual);
  }

  // Otherwise use the same calculation engine as the Grading Sheet/SF9,
  // using the exact Firestore term record as its input.
  const result: any = calculateGrade(s, subject, term, stored || undefined);
  const grade = Number(result?.final);
  return Number.isFinite(grade) && grade > 0 ? Math.round(grade) : 0;
};

const getFinalGrade = (s: Student, subject: Subject, numTerms: number): number => {
  let terms = Array.from({length: numTerms}, (_, i) => (i + 1) as TermNumber);

  // Only terms actually offered by this subject are required.
  if (subject.offeredTerms?.length) {
    terms = terms.filter(t => subject.offeredTerms!.includes(t));
  }

  if (!terms.length) return 0;

  // Every required term must be finalized/released.
  if (!terms.every(t => Array.isArray(subject.finalizedTerms) && subject.finalizedTerms.includes(t))) return 0;

  // These are the actual stored term grades from the learner record.
  const grades = terms.map(t => getTermGrade(s, subject, t));
  if (!grades.every(g => g > 0)) return 0;

  return Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length);
};

const getCommunicationGrade = (
  s: Student,
  components: Subject[],
  term: TermNumber | 'final',
  numTerms: number
) => {
  if (components.length !== 2) return 0;
  const grades = components.map(c =>
    term === 'final' ? getFinalGrade(s, c, numTerms) : getTermGrade(s, c, term)
  );

  // Both stored component grades are required. Never substitute a default 100
  // or average only one component.
  if (grades.length !== 2 || !grades.every(g => g > 0)) return 0;

  // The SF9/SF10 learning-area grade is the average of the TWO stored
  // component grades, rounded to a whole number.
  return Math.round((grades[0] + grades[1]) / 2);
};

const getCommunicationUnits = (components: Subject[]) => {
  const units = components.map(getUnits).filter(u => u > 0);
  return units.length ? Math.round(units.reduce((a,b) => a+b, 0) / units.length) : 0;
};

export const SF10ReportModal: React.FC<SF10ReportModalProps> = ({
  isOpen, onClose, student, allEnrollments, schoolCalendar
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const [records, setRecords] = useState<{student: Student; section: Section; subjects: Subject[]}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const out: {student: Student; section: Section; subjects: Subject[]}[] = [];
        for (const enrollment of allEnrollments) {
          const snap = await getDocs(collection(db, `sections/${enrollment.section.id}/subjects`));
          out.push({
            ...enrollment,
            subjects: snap.docs.map(d => ({id: d.id, ...d.data()} as Subject))
          });
        }
        if (!cancelled) setRecords(out);
      } catch (e) {
        console.error('Error fetching SF10 subjects:', e);
        if (!cancelled) setRecords([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, allEnrollments]);

  const handlePrint = () => {
    if (!printableRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>SF10 - ${formatStudentName(student)}</title>
      <style>
      @page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}
      body{font-family:Arial,sans-serif;font-size:10px;color:#000;margin:0}
      table{width:100%;border-collapse:collapse}thead{display:table-header-group}
      tr{page-break-inside:avoid}th,td{border:1px solid #000;padding:4px;text-align:center}
      th{background:#e2e8f0;font-weight:800}td.left{text-align:left;font-weight:700}
      .record{margin-bottom:18px;page-break-inside:avoid}.header{text-align:center;margin-bottom:15px}
      .info{border:1px solid #000;padding:7px;margin-bottom:12px}.row{display:flex;gap:18px;margin-bottom:4px}
      .label{font-size:8px;font-weight:700}.value{font-weight:800;border-bottom:1px solid #000}
      .section-head{border:1px solid #000;border-bottom:0;padding:6px;font-weight:800}
      .ga{font-weight:800;background:#f8fafc}.cert{border:1px solid #000;border-top:0;padding:10px;display:flex;justify-content:space-between}
      .sig{width:42%;text-align:center}.line{border-bottom:1px solid #000;height:18px}
      </style></head><body><div>${printableRef.current.innerHTML}</div>
      <script>window.onload=()=>setTimeout(()=>{window.print();window.close()},400)</script></body></html>`);
    w.document.close();
  };

  if (!isOpen) return null;

  const sorted = [...records].sort((a,b) => (a.section.schoolYear || '').localeCompare(b.section.schoolYear || ''));

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <div><h2 className="text-lg font-bold">Permanent Record (SF10)</h2><p className="text-xs text-slate-500">Learner's Permanent Academic Record</p></div>
          <div className="flex gap-2">
            <button onClick={handlePrint} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold"><Printer size={16} className="inline mr-2"/>Print / PDF</button>
            <button onClick={onClose} className="p-2 text-slate-500"><X size={20}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
          <div ref={printableRef} className="max-w-[800px] mx-auto bg-white p-8 shadow-md" style={{fontFamily:'Inter, Arial, sans-serif', color:'#000'}}>
            <div className="header">
              <p className="text-[10px] font-semibold uppercase">Republic of the Philippines • Department of Education</p>
              <h1 className="text-[16px] font-black mt-2">LEARNER'S PERMANENT ACADEMIC RECORD (SF10)</h1>
            </div>

            <div className="info text-[10px]">
              <div className="row">
                <span><span className="label">Last Name:</span> <span className="value">{student.lastName || '-'}</span></span>
                <span><span className="label">First Name:</span> <span className="value">{student.firstName || '-'}</span></span>
                <span><span className="label">Middle Name:</span> <span className="value">{student.middleName || '-'}</span></span>
              </div>
              <div className="row">
                <span><span className="label">LRN:</span> <span className="value">{student.lrn || '-'}</span></span>
                <span><span className="label">Date of Birth:</span> <span className="value">{student.birthdate || '-'}</span></span>
                <span><span className="label">Sex:</span> <span className="value">{student.sex || '-'}</span></span>
              </div>
            </div>

            {loading ? <div className="text-center py-12"><Loader2 className="animate-spin inline mr-2"/>Loading academic records...</div> :
              sorted.length === 0 ? <div className="text-center py-10 italic">No academic records found.</div> :
              sorted.map((record, idx) => {
                const { student: es, section, subjects } = record;
                const numTerms = Math.max(
                  1,
                  ...((schoolCalendar || [])
                    .filter(c => !c.schoolYear || c.schoolYear === section.schoolYear)
                    .map(c => Number(c.term) || 0)),
                  ...subjects.flatMap((s:any) => Array.isArray(s.offeredTerms) ? s.offeredTerms.map(Number) : [])
                );

                const comm = subjects.filter(isCommunication);
                const commComponents = comm.length === 2 ? comm : [];
                const normalSubjects = subjects.filter(s => !isCommunication(s));

                const entries = [
                  ...(commComponents.length === 2 ? [{
                    id: 'comm-calc',
                    name: 'Effective Communication / Mabisang Komunikasyon',
                    components: commComponents,
                    units: getCommunicationUnits(commComponents)
                  }] : []),
                  ...normalSubjects.map(s => ({id:s.id, name:s.name, subject:s, units:getUnits(s)}))
                ];

                let totalWeighted = 0, totalUnits = 0;

                const rows = entries.map(entry => {
                  const grades = Array.from({length:numTerms},(_,i) => (i+1) as TermNumber).map(t =>
                    entry.id === 'comm-calc'
                      ? getCommunicationGrade(es, entry.components, t, numTerms)
                      : getTermGrade(es, entry.subject, t)
                  );

                  const finalGrade = entry.id === 'comm-calc'
                    ? getCommunicationGrade(es, entry.components, 'final', numTerms)
                    : getFinalGrade(es, entry.subject, numTerms);

                  if (finalGrade > 0 && entry.units > 0) {
                    totalWeighted += finalGrade * entry.units;
                    totalUnits += entry.units;
                  }

                  return {entry, grades, finalGrade};
                });

                const generalAverage = totalUnits > 0 ? Math.round((totalWeighted / totalUnits) * 100) / 100 : 0;

                return (
                  <div className="record" key={`${section.id}-${idx}`}>
                    <div className="section-head">
                      School: {section.schoolName || '-'} &nbsp; | &nbsp;
                      School ID: {section.schoolId || '-'} &nbsp; | &nbsp;
                      Grade & Section: {Number(section.gradeLevel) === 0 ? 'Kindergarten' : `Grade ${section.gradeLevel}`} - {section.name} &nbsp; | &nbsp;
                      School Year: {section.schoolYear || '-'}
                    </div>

                    <table>
                      <thead><tr>
                        <th rowSpan={2} style={{width:'40%'}}>Learning Areas</th>
                        <th colSpan={numTerms}>Quarterly Rating</th>
                        <th rowSpan={2}>Final Rating</th><th rowSpan={2}>Remarks</th>
                      </tr><tr>
                        {Array.from({length:numTerms},(_,i)=><th key={i}>{i+1}</th>)}
                      </tr></thead>
                      <tbody>
                        {rows.map(({entry,grades,finalGrade}) => (
                          <tr key={entry.id}>
                            <td className="left">{entry.name}</td>
                            {grades.map((g,i)=><td key={i}>{g > 0 ? g : ''}</td>)}
                            <td><b>{finalGrade > 0 ? finalGrade : ''}</b></td>
                            <td><b>{finalGrade > 0 ? (finalGrade >= 75 ? 'Passed' : 'Failed') : ''}</b></td>
                          </tr>
                        ))}
                        {generalAverage > 0 && <tr className="ga">
                          <td colSpan={numTerms+1} style={{textAlign:'right'}}>General Average</td>
                          <td><b>{generalAverage}</b></td>
                          <td><b>{generalAverage >= 75 ? 'Passed' : 'Failed'}</b></td>
                        </tr>}
                      </tbody>
                    </table>

                    <div className="cert">
                      <div className="sig">Prepared by:<div className="line"></div><b>Adviser / Teacher</b></div>
                      <div className="sig">Certified True and Correct:<div className="line"></div><b>School Head / Principal</b></div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    </div>
  );
};
