import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, Loader2, BookOpen, User } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { collection, query, where } from 'firebase/firestore';
import { db, safeGetDocs as getDocs } from '../firebase';
import {
  DEFAULT_TERM_DATA,
  School,
  Section,
  Student,
  Subject,
  TermData,
  TermNumber,
  UserProfile,
} from '../types';
import { formatStudentName, isTleSubject } from '../utils';
import { DEPED_LOGO_DATA_URI, DEPED_SEAL_DATA_URI } from './ClassRecordReportModal';

interface LearnerIndividualRecordViewProps {
  students: Student[];
  assignedSubjects: Subject[];
  selectedSubjectId?: string;
  onSelectSubject?: (subjectId: string) => void;
  activeTerm?: TermNumber;
  onTermChange?: (term: TermNumber) => void;
  selectedSection: Section | null;
  activeSchool?: School | null;
  currentUser?: UserProfile | null;
  globalNumTerms?: number;
  calculateGrade: (
    student: Student,
    subject: Subject,
    term: TermNumber,
    overrideData?: any
  ) => any;
  getDescriptiveRemark: (grade: number | string) => string;
}

const formatScoreCell = (raw: any, hasHps: boolean): string => {
  if (!hasHps) return '';
  if (raw === undefined || raw === null || raw === '') return '';
  return String(raw);
};

export const LearnerIndividualRecordView: React.FC<LearnerIndividualRecordViewProps> = ({
  students,
  assignedSubjects,
  selectedSubjectId,
  onSelectSubject,
  activeTerm = 1,
  onTermChange,
  selectedSection,
  activeSchool,
  currentUser,
  globalNumTerms = 4,
  calculateGrade,
  getDescriptiveRemark,
}) => {
  const recordRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [schoolDetails, setSchoolDetails] = useState<{
    name?: string;
    schoolLogo?: string;
    depEdLogo?: string;
  }>({});
  const [teacherNamesByEmail, setTeacherNamesByEmail] = useState<Record<string, string>>({});

  // Resolve active subject strictly from assignedSubjects
  const effectiveSubjectId = useMemo(() => {
    if (
      selectedSubjectId &&
      assignedSubjects.some((s) => s.id === selectedSubjectId)
    ) {
      return selectedSubjectId;
    }
    return assignedSubjects[0]?.id || '';
  }, [assignedSubjects, selectedSubjectId]);

  const [localSubjectId, setLocalSubjectId] = useState<string>(effectiveSubjectId);

  useEffect(() => {
    if (
      effectiveSubjectId &&
      (!localSubjectId || !assignedSubjects.some((s) => s.id === localSubjectId))
    ) {
      setLocalSubjectId(effectiveSubjectId);
    } else if (!effectiveSubjectId) {
      setLocalSubjectId('');
    }
  }, [effectiveSubjectId, assignedSubjects, localSubjectId]);

  // Keep synced when parent selectedSubjectId changes and is in assignedSubjects
  useEffect(() => {
    if (
      selectedSubjectId &&
      assignedSubjects.some((s) => s.id === selectedSubjectId)
    ) {
      setLocalSubjectId(selectedSubjectId);
    }
  }, [selectedSubjectId, assignedSubjects]);

  const selectedSubject = useMemo(
    () => assignedSubjects.find((s) => s.id === localSubjectId) || assignedSubjects[0] || null,
    [assignedSubjects, localSubjectId]
  );

  // Available terms for the selected subject
  const availableTerms = useMemo<TermNumber[]>(() => {
    if (
      selectedSubject?.offeredTerms &&
      Array.isArray(selectedSubject.offeredTerms) &&
      selectedSubject.offeredTerms.length > 0
    ) {
      return [...selectedSubject.offeredTerms].sort((a, b) => a - b);
    }
    const maxTerms = Math.max(4, globalNumTerms || 4);
    const terms: TermNumber[] = [];
    for (let t = 1; t <= Math.min(4, maxTerms); t++) {
      terms.push(t as TermNumber);
    }
    return terms;
  }, [selectedSubject, globalNumTerms]);

  const [localTerm, setLocalTerm] = useState<TermNumber>(activeTerm || 1);

  useEffect(() => {
    if (availableTerms.length > 0 && !availableTerms.includes(localTerm)) {
      setLocalTerm(availableTerms[0]);
    }
  }, [availableTerms, localTerm]);

  useEffect(() => {
    if (activeTerm && availableTerms.includes(activeTerm)) {
      setLocalTerm(activeTerm);
    }
  }, [activeTerm, availableTerms]);

  // Fetch school logos & details
  useEffect(() => {
    const sId = selectedSection?.schoolId || activeSchool?.schoolId;
    if (!sId) return;
    let cancelled = false;
    const q = query(collection(db, 'schools'), where('schoolId', '==', sId));
    getDocs(q)
      .then((snap) => {
        if (cancelled || snap.empty) return;
        const data = snap.docs[0].data() as any;
        setSchoolDetails({
          name: data.name || undefined,
          schoolLogo: data.schoolLogo || undefined,
          depEdLogo: data.depEdLogo || undefined,
        });
      })
      .catch((err) => {
        console.error('Error loading school details for individual record:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSection?.schoolId, activeSchool?.schoolId]);

  // Fetch teacher names for school so assigned subject displays teacher's full name
  useEffect(() => {
    const sId = selectedSection?.schoolId || activeSchool?.schoolId;
    if (!sId) return;
    let cancelled = false;
    const q = query(collection(db, 'users'), where('schoolId', '==', sId));
    getDocs(q)
      .then((snap) => {
        if (cancelled) return;
        const nextMap: Record<string, string> = {};
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const email = String(data.email || '').trim().toLowerCase();
          const name = String(data.displayName || data.name || '').trim();
          if (email && name) {
            nextMap[email] = name;
          }
        });
        setTeacherNamesByEmail(nextMap);
      })
      .catch((err) => {
        console.error('Error loading teacher profiles for individual record:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSection?.schoolId, activeSchool?.schoolId]);

  // Filter & sort learners for the selected subject
  const sortedStudents = useMemo(() => {
    const list = students.filter((s) => {
      const name = formatStudentName(s)?.trim();
      if (!name) return false;
      if (s.status === 'Dropped Out' || s.status === 'Transferred Out') return false;

      if (selectedSubject) {
        const subjectName = selectedSubject.name || '';
        const isElectiveOrTle =
          isTleSubject(subjectName) || selectedSubject.subjectType === 'ELECTIVE';
        if (
          isElectiveOrTle &&
          Array.isArray(s.enrolledSubjectIds) &&
          s.enrolledSubjectIds.length > 0 &&
          !s.enrolledSubjectIds.includes(selectedSubject.id)
        ) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) =>
      formatStudentName(a).localeCompare(formatStudentName(b))
    );
  }, [students, selectedSubject]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    sortedStudents[0]?.id || ''
  );

  useEffect(() => {
    if (sortedStudents.length === 0) {
      setSelectedStudentId('');
      return;
    }
    if (!selectedStudentId || !sortedStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(sortedStudents[0].id);
    }
  }, [sortedStudents, selectedStudentId]);

  const selectedStudent = useMemo(
    () => sortedStudents.find((s) => s.id === selectedStudentId) || sortedStudents[0] || null,
    [sortedStudents, selectedStudentId]
  );

  // Reference TermData across class so HPS is always populated even if learner is new
  const refTermData = useMemo<TermData>(() => {
    if (!selectedSubject) return DEFAULT_TERM_DATA;
    for (const st of students) {
      const td = st.grades?.[selectedSubject.id]?.[localTerm];
      if (!td) continue;
      const hasAnyMax =
        (td.writtenWorks?.maxScores || []).some((m) => Number(m) > 0) ||
        (td.performanceTasks?.maxScores || []).some((m) => Number(m) > 0) ||
        (td.summativeTests?.maxScores || []).some((m) => Number(m) > 0) ||
        Number(td.termExam?.maxScore || 0) > 0;
      if (hasAnyMax) return td;
    }
    return DEFAULT_TERM_DATA;
  }, [students, selectedSubject, localTerm]);

  const studentTermData = useMemo<TermData>(() => {
    if (!selectedStudent || !selectedSubject) return DEFAULT_TERM_DATA;
    return (
      selectedStudent.grades?.[selectedSubject.id]?.[localTerm] || DEFAULT_TERM_DATA
    );
  }, [selectedStudent, selectedSubject, localTerm]);

  // Merge HPS cleanly (student's own maxScores fallback to class refTermData)
  const effectiveTermData = useMemo<TermData>(() => {
    const wwMax = [0, 1, 2, 3, 4].map(
      (i) =>
        Number(studentTermData.writtenWorks?.maxScores?.[i]) ||
        Number(refTermData.writtenWorks?.maxScores?.[i]) ||
        0
    );
    const ptMax = [0, 1, 2, 3, 4].map(
      (i) =>
        Number(studentTermData.performanceTasks?.maxScores?.[i]) ||
        Number(refTermData.performanceTasks?.maxScores?.[i]) ||
        0
    );
    const stMax = [0, 1].map(
      (i) =>
        Number(studentTermData.summativeTests?.maxScores?.[i]) ||
        Number(refTermData.summativeTests?.maxScores?.[i]) ||
        0
    );
    const teMax =
      Number(studentTermData.termExam?.maxScore) ||
      Number(refTermData.termExam?.maxScore) ||
      0;

    return {
      writtenWorks: {
        scores: studentTermData.writtenWorks?.scores || [],
        maxScores: wwMax,
        names: studentTermData.writtenWorks?.names || refTermData.writtenWorks?.names,
      },
      performanceTasks: {
        scores: studentTermData.performanceTasks?.scores || [],
        maxScores: ptMax,
        names:
          studentTermData.performanceTasks?.names || refTermData.performanceTasks?.names,
      },
      summativeTests: {
        scores: studentTermData.summativeTests?.scores || [],
        maxScores: stMax,
        names:
          studentTermData.summativeTests?.names || refTermData.summativeTests?.names,
      },
      termExam: {
        score: studentTermData.termExam?.score as any,
        maxScore: teMax,
      },
    };
  }, [studentTermData, refTermData]);

  const computedGrades = useMemo(() => {
    if (!selectedStudent || !selectedSubject) {
      return {
        ww: { total: 0, max: 0, ps: 0, ws: 0 },
        pt: { total: 0, max: 0, ps: 0, ws: 0 },
        ta: {
          total: 0,
          max: 0,
          st1: { score: 0, hps: 0 },
          st2: { score: 0, hps: 0 },
          termExam: { score: 0, hps: 0 },
        },
        initial: 0,
        final: 0,
        hasData: false,
      };
    }
    return calculateGrade(
      selectedStudent,
      selectedSubject,
      localTerm,
      effectiveTermData
    );
  }, [selectedStudent, selectedSubject, localTerm, effectiveTermData, calculateGrade]);

  const teacherDisplayName = useMemo(() => {
    const email = (
      selectedSubject?.teacherEmail ||
      (selectedSubject ? selectedSection?.subjectTeachers?.[selectedSubject.id] : '') ||
      ''
    )
      .trim()
      .toLowerCase();

    if (email) {
      if (teacherNamesByEmail[email]) return teacherNamesByEmail[email];
      if (
        currentUser?.email &&
        currentUser.email.trim().toLowerCase() === email &&
        currentUser.displayName
      ) {
        return currentUser.displayName;
      }
      if (
        selectedSection?.adviserEmail &&
        selectedSection.adviserEmail.trim().toLowerCase() === email &&
        selectedSection.adviserName
      ) {
        return selectedSection.adviserName;
      }
      return email;
    }

    return selectedSection?.adviserName || currentUser?.displayName || 'Subject Teacher';
  }, [selectedSubject, selectedSection, teacherNamesByEmail, currentUser]);

  const fatherNameDisplay = selectedStudent?.fatherName?.trim() || '';
  const motherNameDisplay = selectedStudent?.motherName?.trim() || '';
  const guardianNameDisplay = selectedStudent?.guardianName?.trim() || '';
  const hasGuardian = Boolean(guardianNameDisplay);

  const parentSignatureUrl = selectedStudent?.signatures?.[localTerm] || '';

  const schoolNameDisplay =
    schoolDetails.name || activeSchool?.name || selectedSection?.schoolName || 'SCHOOL NAME';
  const schoolLogoUrl =
    schoolDetails.schoolLogo ||
    (activeSchool as any)?.schoolLogo ||
    DEPED_SEAL_DATA_URI;
  const depEdLogoUrl =
    schoolDetails.depEdLogo ||
    (activeSchool as any)?.depEdLogo ||
    DEPED_LOGO_DATA_URI;
  const schoolYearDisplay = selectedSection?.schoolYear || '';

  const descriptorText = computedGrades.hasData
    ? getDescriptiveRemark(computedGrades.final)
    : '';

  const handleDownloadPdf = async () => {
    if (!recordRef.current || !selectedStudent || !selectedSubject) return;
    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(recordRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - margin * 2;
      const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      const x = (pageWidth - imgW) / 2;
      const y = (pageHeight - imgH) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);
      const safeStudent = formatStudentName(selectedStudent).replace(/[^a-zA-Z0-9_-]+/g, '_');
      const safeSubj = (selectedSubject.name || 'Subject').replace(/[^a-zA-Z0-9_-]+/g, '_');
      pdf.save(`Individual_Record_${safeStudent}_${safeSubj}_Term_${localTerm}.pdf`);
    } catch (error) {
      console.error('Failed to generate Individual Record PDF:', error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const wwTotalMax = effectiveTermData.writtenWorks.maxScores.reduce(
    (s, n) => s + (Number(n) || 0),
    0
  );
  const ptTotalMax = effectiveTermData.performanceTasks.maxScores.reduce(
    (s, n) => s + (Number(n) || 0),
    0
  );
  const taTotalMax =
    (Number(effectiveTermData.summativeTests.maxScores[0]) || 0) +
    (Number(effectiveTermData.summativeTests.maxScores[1]) || 0) +
    (Number(effectiveTermData.termExam.maxScore) || 0);

  const wwHasAnyScore = [0, 1, 2, 3, 4].some((i) => {
    const val = studentTermData.writtenWorks?.scores?.[i];
    return val !== undefined && val !== null && (val as any) !== '';
  });
  const ptHasAnyScore = [0, 1, 2, 3, 4].some((i) => {
    const val = studentTermData.performanceTasks?.scores?.[i];
    return val !== undefined && val !== null && (val as any) !== '';
  });
  const taHasAnyScore =
    (studentTermData.summativeTests?.scores?.[0] !== undefined &&
      studentTermData.summativeTests?.scores?.[0] !== null &&
      (studentTermData.summativeTests?.scores?.[0] as any) !== '') ||
    (studentTermData.summativeTests?.scores?.[1] !== undefined &&
      studentTermData.summativeTests?.scores?.[1] !== null &&
      (studentTermData.summativeTests?.scores?.[1] as any) !== '') ||
    (studentTermData.termExam?.score !== undefined &&
      studentTermData.termExam?.score !== null &&
      (studentTermData.termExam?.score as any) !== '');

  if (assignedSubjects.length === 0) {
    return (
      <div className="min-h-[420px] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <BookOpen size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No Assigned Subjects Found
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not have any assigned subjects in this section. Learner Individual
            Records are available for the subjects assigned to you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 md:p-8 space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="max-w-[1160px] mx-auto bg-white rounded-xl border border-slate-200 shadow-xs px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-4 sm:gap-7">
          {/* Learner Selector */}
          <div className="relative min-w-[200px] sm:min-w-[230px]">
            <select
              aria-label="Select Learner"
              value={selectedStudent?.id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full appearance-none bg-transparent border-b border-slate-200 focus:border-blue-600 py-1.5 pr-7 text-sm font-medium text-slate-800 outline-none cursor-pointer"
            >
              {sortedStudents.length === 0 ? (
                <option value="">No learners available</option>
              ) : (
                sortedStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatStudentName(s)}
                  </option>
                ))
              )}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Assigned Subject Selector */}
          <div className="relative min-w-[160px] sm:min-w-[190px]">
            <select
              aria-label="Select Assigned Subject"
              value={selectedSubject?.id || ''}
              onChange={(e) => {
                const nextId = e.target.value;
                setLocalSubjectId(nextId);
                onSelectSubject?.(nextId);
              }}
              className="w-full appearance-none bg-transparent border-b border-slate-200 focus:border-blue-600 py-1.5 pr-7 text-sm font-medium text-slate-800 outline-none cursor-pointer"
            >
              {assignedSubjects.map((subj) => (
                <option key={subj.id} value={subj.id}>
                  {subj.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Term Selector */}
          <div className="relative min-w-[110px] sm:min-w-[130px]">
            <select
              aria-label="Select Term"
              value={localTerm}
              onChange={(e) => {
                const nextTerm = Number(e.target.value) as TermNumber;
                setLocalTerm(nextTerm);
                onTermChange?.(nextTerm);
              }}
              className="w-full appearance-none bg-transparent border-b border-slate-200 focus:border-blue-600 py-1.5 pr-7 text-sm font-medium text-slate-800 outline-none cursor-pointer"
            >
              {availableTerms.map((term) => (
                <option key={term} value={term}>
                  Term {term}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf || !selectedStudent || !selectedSubject}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isExportingPdf ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span>{isExportingPdf ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Individual Record Sheet */}
      {!selectedStudent ? (
        <div className="max-w-[980px] mx-auto bg-white rounded-xl border border-slate-200 p-10 text-center space-y-2">
          <User size={28} className="mx-auto text-slate-400" />
          <p className="text-sm font-semibold text-slate-600">
            No enrolled learners found for this subject.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div
            ref={recordRef}
            className="bg-[#ffffff] border-2 border-[#0f172a] p-6 sm:p-9 min-w-[780px] max-w-[980px] mx-auto shadow-sm text-[#0f172a]"
          >
            {/* Institutional Header */}
            <div className="grid grid-cols-[90px_1fr_110px] items-center gap-4">
              <div className="flex items-center justify-start">
                <img
                  src={schoolLogoUrl}
                  alt="School Logo"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                  crossOrigin="anonymous"
                />
              </div>

              <div className="text-center">
                <h1 className="font-serif font-bold text-base sm:text-[18px] tracking-wide uppercase text-[#0f172a] leading-tight">
                  {schoolNameDisplay.toUpperCase()}
                </h1>
                {schoolYearDisplay && (
                  <p className="font-serif text-xs sm:text-[13px] text-[#334155] mt-0.5">
                    SY {schoolYearDisplay}
                  </p>
                )}
                <h2 className="font-serif font-bold text-sm sm:text-[16px] tracking-wide uppercase text-[#1e3a8a] mt-2">
                  LEARNER&apos;S INDIVIDUAL RECORD
                </h2>
                <div className="mt-2 inline-flex items-center justify-center border-2 border-[#0f172a] py-1.5 px-5 bg-[#ffffff]">
                  <span className="font-serif font-bold text-base sm:text-[18px] text-[#0f172a] leading-none">
                    Term {localTerm}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <img
                  src={depEdLogoUrl}
                  alt="Department of Education"
                  className="h-12 sm:h-14 w-auto object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            </div>

            {/* Learner & Subject Metadata */}
            <div className="grid grid-cols-2 gap-x-10 items-center mt-6 mb-7">
              <div className="space-y-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs sm:text-[13px] text-[#334155] w-16 shrink-0">
                    Name:
                  </span>
                  <span className="flex-1 border-b border-[#334155] pb-0.5 text-xs sm:text-[13px] font-bold uppercase text-[#0f172a] truncate">
                    {formatStudentName(selectedStudent).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs sm:text-[13px] text-[#334155] w-16 shrink-0">
                    Gr.&amp;Sec:
                  </span>
                  <span className="flex-1 border-b border-[#334155] pb-0.5 text-xs sm:text-[13px] font-bold uppercase text-[#0f172a] truncate">
                    GRADE {selectedSection?.gradeLevel || ''} -{' '}
                    {(selectedSection?.name || '').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs sm:text-[13px] text-[#334155] w-16 shrink-0">
                    Subject:
                  </span>
                  <span className="flex-1 border-b border-[#334155] pb-0.5 text-xs sm:text-[13px] font-bold uppercase text-[#0f172a] truncate">
                    {(selectedSubject?.name || '').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs sm:text-[13px] text-[#334155] w-16 shrink-0">
                    Teacher:
                  </span>
                  <span className="flex-1 border-b border-[#334155] pb-0.5 text-xs sm:text-[13px] font-bold uppercase text-[#0f172a] truncate">
                    {teacherDisplayName.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Three Component Breakdown Tables */}
            <div className="grid grid-cols-[1.22fr_1.22fr_1fr] gap-4 items-stretch">
              {/* Written / Oral Work */}
              <table className="w-full border-collapse border border-[#64748b] text-xs text-[#0f172a]">
                <thead>
                  <tr className="bg-[#e8eff7]">
                    <th
                      colSpan={7}
                      className="border border-[#64748b] py-1.5 px-2 text-center font-bold text-[#0f172a]"
                    >
                      Written/Oral Work
                    </th>
                  </tr>
                  <tr className="bg-[#f1f5f9]">
                    <th className="border border-[#64748b] py-1 px-2 w-12" />
                    {[1, 2, 3, 4, 5].map((num) => (
                      <th
                        key={num}
                        className="border border-[#64748b] py-1 px-1.5 text-center font-bold w-9"
                      >
                        {num}
                      </th>
                    ))}
                    <th className="border border-[#64748b] py-1 px-2 text-center font-bold w-12">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#64748b] py-1.5 px-2 font-medium text-[#334155]">
                      HPS
                    </td>
                    {[0, 1, 2, 3, 4].map((idx) => {
                      const hps = effectiveTermData.writtenWorks.maxScores[idx] || 0;
                      return (
                        <td
                          key={`ww-hps-${idx}`}
                          className="border border-[#64748b] py-1.5 px-1 text-center tabular-nums"
                        >
                          {hps > 0 ? hps : ''}
                        </td>
                      );
                    })}
                    <td className="border border-[#64748b] py-1.5 px-1.5 text-center font-medium tabular-nums">
                      {wwTotalMax > 0 ? wwTotalMax : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#64748b] py-1.5 px-2 font-medium text-[#334155]">
                      Score
                    </td>
                    {[0, 1, 2, 3, 4].map((idx) => {
                      const hps = effectiveTermData.writtenWorks.maxScores[idx] || 0;
                      const scoreVal = studentTermData.writtenWorks?.scores?.[idx];
                      return (
                        <td
                          key={`ww-sc-${idx}`}
                          className="border border-[#64748b] py-1.5 px-1 text-center tabular-nums"
                        >
                          {formatScoreCell(scoreVal, hps > 0)}
                        </td>
                      );
                    })}
                    <td className="border border-[#64748b] py-1.5 px-1.5 text-center font-medium tabular-nums">
                      {wwTotalMax > 0 && wwHasAnyScore ? computedGrades.ww.total : ''}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Product / Performance Tasks */}
              <table className="w-full border-collapse border border-[#64748b] text-xs text-[#0f172a]">
                <thead>
                  <tr className="bg-[#e8eff7]">
                    <th
                      colSpan={7}
                      className="border border-[#64748b] py-1.5 px-2 text-center font-bold text-[#0f172a]"
                    >
                      Product/Performance Tasks
                    </th>
                  </tr>
                  <tr className="bg-[#f1f5f9]">
                    <th className="border border-[#64748b] py-1 px-2 w-12" />
                    {[1, 2, 3, 4, 5].map((num) => (
                      <th
                        key={num}
                        className="border border-[#64748b] py-1 px-1.5 text-center font-bold w-9"
                      >
                        {num}
                      </th>
                    ))}
                    <th className="border border-[#64748b] py-1 px-2 text-center font-bold w-12">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#64748b] py-1.5 px-2 font-medium text-[#334155]">
                      HPS
                    </td>
                    {[0, 1, 2, 3, 4].map((idx) => {
                      const hps =
                        effectiveTermData.performanceTasks.maxScores[idx] || 0;
                      return (
                        <td
                          key={`pt-hps-${idx}`}
                          className="border border-[#64748b] py-1.5 px-1 text-center tabular-nums"
                        >
                          {hps > 0 ? hps : ''}
                        </td>
                      );
                    })}
                    <td className="border border-[#64748b] py-1.5 px-1.5 text-center font-medium tabular-nums">
                      {ptTotalMax > 0 ? ptTotalMax : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#64748b] py-1.5 px-2 font-medium text-[#334155]">
                      Score
                    </td>
                    {[0, 1, 2, 3, 4].map((idx) => {
                      const hps =
                        effectiveTermData.performanceTasks.maxScores[idx] || 0;
                      const scoreVal =
                        studentTermData.performanceTasks?.scores?.[idx];
                      return (
                        <td
                          key={`pt-sc-${idx}`}
                          className="border border-[#64748b] py-1.5 px-1 text-center tabular-nums"
                        >
                          {formatScoreCell(scoreVal, hps > 0)}
                        </td>
                      );
                    })}
                    <td className="border border-[#64748b] py-1.5 px-1.5 text-center font-medium tabular-nums">
                      {ptTotalMax > 0 && ptHasAnyScore ? computedGrades.pt.total : ''}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Summative Tests / Term Exam */}
              <table className="w-full border-collapse border border-[#64748b] text-xs text-[#0f172a]">
                <thead>
                  <tr className="bg-[#e8eff7]">
                    <th
                      colSpan={5}
                      className="border border-[#64748b] py-1.5 px-2 text-center font-bold text-[#0f172a]"
                    >
                      Summative Tests / Term Exam
                    </th>
                  </tr>
                  <tr className="bg-[#f1f5f9]">
                    <th className="border border-[#64748b] py-1 px-2 w-12" />
                    <th className="border border-[#64748b] py-1 px-1.5 text-center font-bold w-11">
                      ST1
                    </th>
                    <th className="border border-[#64748b] py-1 px-1.5 text-center font-bold w-11">
                      ST2
                    </th>
                    <th className="border border-[#64748b] py-1 px-1.5 text-center font-bold w-11">
                      TE
                    </th>
                    <th className="border border-[#64748b] py-1 px-2 text-center font-bold w-12">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#64748b] py-1.5 px-2 font-medium text-[#334155]">
                      HPS
                    </td>
                    <td className="border border-[#64748b] py-1.5 px-1 text-center tabular-nums">
                      {(effectiveTermData.summativeTests.maxScores[0] || 0) > 0
                        ? effectiveTermData.summativeTests.maxScores[0]
                        : ''}
                    </td>
                    <td className="border border-[#64748b] py-1.5 px-1 text-center tabular-nums">
                      {(effectiveTermData.summativeTests.maxScores[1] || 0) > 0
                        ? effectiveTermData.summativeTests.maxScores[1]
                        : ''}
                    </td>
                    <td className="border border-[#64748b] py-1.5 px-1 text-center tabular-nums">
                      {(effectiveTermData.termExam.maxScore || 0) > 0
                        ? effectiveTermData.termExam.maxScore
                        : ''}
                    </td>
                    <td className="border border-[#64748b] py-1.5 px-1.5 text-center font-medium tabular-nums">
                      {taTotalMax > 0 ? taTotalMax : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#64748b] py-1.5 px-2 font-medium text-[#334155]">
                      Score
                    </td>
                    <td className="border border-[#64748b] py-1.5 px-1 text-center tabular-nums">
                      {formatScoreCell(
                        studentTermData.summativeTests?.scores?.[0],
                        (effectiveTermData.summativeTests.maxScores[0] || 0) > 0
                      )}
                    </td>
                    <td className="border border-[#64748b] py-1.5 px-1 text-center tabular-nums">
                      {formatScoreCell(
                        studentTermData.summativeTests?.scores?.[1],
                        (effectiveTermData.summativeTests.maxScores[1] || 0) > 0
                      )}
                    </td>
                    <td className="border border-[#64748b] py-1.5 px-1 text-center tabular-nums">
                      {formatScoreCell(
                        studentTermData.termExam?.score,
                        (effectiveTermData.termExam.maxScore || 0) > 0
                      )}
                    </td>
                    <td className="border border-[#64748b] py-1.5 px-1.5 text-center font-medium tabular-nums">
                      {taTotalMax > 0 && taHasAnyScore ? computedGrades.ta.total : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Row */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-7">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#334155]">
                  INITIAL GRADE:
                </span>
                <div className="border border-[#0f172a] bg-[#fde2c4] min-w-[68px] px-4 py-1.5 text-center text-sm font-bold text-[#0f172a] tabular-nums">
                  {computedGrades.hasData ? computedGrades.initial.toFixed(1) : '—'}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#334155]">
                  TERM GRADE:
                </span>
                <div className="border border-[#0f172a] bg-[#fde2c4] min-w-[68px] px-4 py-1.5 text-center text-sm font-bold text-[#0f172a] tabular-nums">
                  {computedGrades.hasData ? computedGrades.final : '—'}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#334155]">
                  DESCRIPTOR:
                </span>
                <div className="border border-[#0f172a] bg-[#fde2c4] min-w-[180px] px-6 py-1.5 text-center text-sm font-bold text-[#0f172a]">
                  {computedGrades.hasData ? descriptorText || '—' : '—'}
                </div>
              </div>
            </div>

            {/* Signature Blocks */}
            <div className="mt-8 pt-2 space-y-6">
              {hasGuardian ? (
                <div className="flex justify-center">
                  <div className="text-center">
                    <div className="h-10 flex items-end justify-center pb-1">
                      {parentSignatureUrl && (
                        <img
                          src={parentSignatureUrl}
                          alt="Guardian Signature"
                          className="max-h-10 w-auto object-contain"
                          crossOrigin="anonymous"
                        />
                      )}
                    </div>
                    <div className="border-b border-[#0f172a] w-64 mx-auto" />
                    <p className="text-xs font-bold uppercase text-[#0f172a] mt-1.5">
                      {guardianNameDisplay.toUpperCase()}
                    </p>
                    <p className="text-[11px] text-[#334155]">
                      Guardian&apos;s Signature
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-12">
                  {/* Father Signature */}
                  <div className="text-center">
                    <div className="h-10 flex items-end justify-center pb-1">
                      {parentSignatureUrl && selectedStudent?.primaryContact !== 'mother' && (
                        <img
                          src={parentSignatureUrl}
                          alt="Father Signature"
                          className="max-h-10 w-auto object-contain"
                          crossOrigin="anonymous"
                        />
                      )}
                    </div>
                    <div className="border-b border-[#0f172a] w-64 mx-auto" />
                    <p className="text-xs font-bold uppercase text-[#0f172a] mt-1.5">
                      {fatherNameDisplay ? fatherNameDisplay.toUpperCase() : "FATHER'S SIGNATURE"}
                    </p>
                    <p className="text-[11px] text-[#334155]">
                      {fatherNameDisplay ? "Father's Signature" : 'Signature over Printed Name'}
                    </p>
                  </div>

                  {/* Mother Signature */}
                  <div className="text-center">
                    <div className="h-10 flex items-end justify-center pb-1">
                      {parentSignatureUrl && selectedStudent?.primaryContact === 'mother' && (
                        <img
                          src={parentSignatureUrl}
                          alt="Mother Signature"
                          className="max-h-10 w-auto object-contain"
                          crossOrigin="anonymous"
                        />
                      )}
                    </div>
                    <div className="border-b border-[#0f172a] w-64 mx-auto" />
                    <p className="text-xs font-bold uppercase text-[#0f172a] mt-1.5">
                      {motherNameDisplay ? motherNameDisplay.toUpperCase() : "MOTHER'S SIGNATURE"}
                    </p>
                    <p className="text-[11px] text-[#334155]">
                      {motherNameDisplay ? "Mother's Signature" : 'Signature over Printed Name'}
                    </p>
                  </div>
                </div>
              )}

              {/* Teacher Signature - Bottom Center */}
              <div className="flex justify-center">
                <div className="text-center">
                  <div className="h-10 flex items-end justify-center pb-1" />
                  <div className="border-b border-[#0f172a] w-64 mx-auto" />
                  <p className="text-xs font-bold uppercase text-[#0f172a] mt-1.5">
                    {teacherDisplayName.toUpperCase()}
                  </p>
                  <p className="text-[11px] text-[#334155]">
                    Teacher&apos;s Signature
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
