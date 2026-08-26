/**

 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Scanner } from "@yudiel/react-qr-scanner";
import { QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { 
  Users, 
  BookOpen, 
  Plus, 
  Search, 
  LayoutDashboard, 
  GraduationCap, 
  Calendar,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Folder,
  FileText,
  MoreVertical,
  Table as TableIcon,
  Settings,
  Edit2,
  Check,
  Zap,
  Layout,
  Layers,
  Loader2,
  UserPlus,
  UserCheck,
  UserMinus,
  Mars,
  Venus,
  User,
  Trash2,
  Minus,
  X,
  LogOut,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  FileUp,
  Upload,
  HelpCircle,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ClipboardCheck,
  Lock,
  Unlock,
  Bell,
  XCircle,
  Building,
  History as HistoryIcon,
  Building2,
  MapPin,
  Briefcase,
  Mail,
  Shield,
  BarChart2,
  Heart,
  CreditCard,
  IdCard,
  Share2,
  RefreshCw,
  Clock,
  MessageSquare,
  Sparkles,
  Menu,
  Terminal,
  Activity,
  UserX,
  Coins,
  Printer,
  Receipt,
  Tag,
  FileSpreadsheet,
  ExternalLink,
  Camera,
  Save,
  Maximize2,
  Minimize2,
  Info,
  Edit,
  Copy,
  Type,
  Palette
} from "lucide-react";

import { ThemeCustomizerModal, DEFAULT_THEME_SETTINGS, SystemThemeSettings } from "./components/ThemeCustomizerModal";
import { SystemDocumentationView } from "./components/SystemDocumentationView";
import { SF8View } from "./components/SF8View";
import { ManualSiblingSelector } from "./components/ManualSiblingSelector";
import { PhotoCropModal } from "./components/PhotoCropModal";
import { SF10ReportModal } from "./components/SF10ReportModal";
import { AralProgram } from "./components/AralProgram";
import { AralMasterData } from "./components/AralMasterData";
import { 
  DEFAULT_SCHOOL_INFO, 
  DEFAULT_COMPETENCIES,
  AralSchoolInfo,
  AralCompetency,
  AralRole
} from "./components/AralData";

const formatGradeSection = (gradeLevel?: string | number, sectionName?: string) => {
  const g = String(gradeLevel || "7").trim();
  const s = String(sectionName || "MATATAG").trim();
  
  if (s.toLowerCase() === `grade ${g}`) return `Grade ${g}`;
  if (s.toLowerCase().includes(`grade ${g}`)) return s;
  
  return `Grade ${g} - ${s}`;
};

function EncodingClosedBanner() {
  return (
    <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-center gap-3 animate-pulse shadow-lg z-[100] shrink-0 border-b border-rose-500/50">
      <Clock size={16} className="text-rose-100" />
      <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">
        Centralized Learner Assessment & School System is Currently Offline &bull; No Active School Year Found in Global Settings
      </span>
      <Clock size={16} className="text-rose-100" />
    </div>
  );
}

function DeadlineBanner({ globalSettings }: { globalSettings?: any }) {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('deadline_banner_dismissed') === 'true');

  if (dismissed || !globalSettings?.finalizationDeadline) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('deadline_banner_dismissed', 'true');
  };

  const deadline = new Date(globalSettings.finalizationDeadline);
  const now = new Date();
  
  if (deadline < now) {
    return (
      <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-center gap-3 animate-pulse shadow-lg z-[100] shrink-0 border-b border-rose-500/50 relative">
        <Clock size={16} className="text-rose-100" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">
          Deadline for Finalization has passed ({deadline.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })})
        </span>
        <Clock size={16} className="text-rose-100" />
        <button onClick={handleDismiss} className="absolute right-4 text-rose-200 hover:text-white transition-colors" title="Dismiss">
          <X size={16} />
        </button>
      </div>
    );
  }
  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-md z-[100] shrink-0 border-b border-amber-600/50 relative">
      <Clock size={16} className="text-amber-100" />
      <span className="text-[11px] font-bold uppercase tracking-widest">
        Deadline for Finalization: {deadline.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
      </span>
      <Clock size={16} className="text-amber-100" />
      <button onClick={handleDismiss} className="absolute right-4 text-amber-100 hover:text-white transition-colors" title="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}

function SectionYearEndBadge({ sectionId, schoolYear, globalSettings, isSectionFinalized }: { sectionId: string; schoolYear?: string; globalSettings?: any; isSectionFinalized?: boolean }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (!sectionId) return;
    const qStudents = collection(db, `sections/${sectionId}/students`);
    const unsubscribeStudents = onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
    }, (err) => {
      console.error("Error checking students:", err);
    });

    const qSubjects = collection(db, `sections/${sectionId}/subjects`);
    const unsubscribeSubjects = onSnapshot(qSubjects, (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
    }, (err) => {
      console.error("Error checking subjects:", err);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeSubjects();
    };
  }, [sectionId]);

  const isFinalized = useMemo(() => {
    const isGlobalFinalized = globalSettings?.finalizedSchoolYears?.includes(schoolYear);
    return isGlobalFinalized || isSectionFinalized || students.some(s => s.status === 'Promoted' || s.status === 'Retained');
  }, [students, globalSettings, schoolYear, isSectionFinalized]);

  const isYearEndReady = useMemo(() => {
    if (students.length === 0 || subjects.length === 0) return false;
    const activeStudents = students.filter(s => s.status === 'Active' || !s.status);
    if (activeStudents.length === 0) return false;
    
    // Check if ALL active students have completed ALL subjects
    return activeStudents.every(student => {
      let validCount = 0;
      subjects.forEach(subj => {
        const termsCompleted = (subj.offeredTerms || [1,2,3,4]).every(t => {
          const g = calculateGrade(student, subj, t as TermNumber);
          return g.hasData;
        });
        if (termsCompleted) validCount++;
      });
      return validCount === subjects.length;
    });
  }, [students, subjects]);

  if (students.length === 0) return null;

  if (isFinalized) {
    return (
      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1.5 shrink-0 shadow-sm transition-all bg-emerald-50 text-emerald-800 border-emerald-250">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Finalized
      </span>
    );
  }

  // Only show 'Unfinalized' if the grade book's terms are fully completed
  if (isYearEndReady) {
    return (
      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1.5 shrink-0 shadow-sm transition-all bg-amber-50 text-amber-800 border-amber-250">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-550"></span>
        Unfinalized
      </span>
    );
  }

  return null;
}

function SectionStatsDisplay({ sectionId, schoolYear, schoolCalendar }: { sectionId: string, schoolYear: string, schoolCalendar: any[] }) {
  const [stats, setStats] = useState({ 
    promoted: 0,
    promotedM: 0,
    promotedF: 0,
    retained: 0, 
    retainedM: 0,
    retainedF: 0,
    transferredOut: 0, 
    transferredOutM: 0,
    transferredOutF: 0,
    droppedOut: 0, 
    droppedOutM: 0,
    droppedOutF: 0,
    transferredIn: 0,
    transferredInM: 0,
    transferredInF: 0,
    lateEnrollees: 0,
    lateEnrolleesM: 0,
    lateEnrolleesF: 0
  });
  const [isYearEnd, setIsYearEnd] = useState(false);

  useEffect(() => {
    if (!schoolYear || !schoolCalendar || schoolCalendar.length === 0) return;
    
    // Determine if it's year end based on the calendar
    const entries = schoolCalendar.filter(c => c.schoolYear === schoolYear);
    if (entries.length === 0) return;

    const monthOrder = ["June", "July", "August", "September", "October", "November", "December", "January", "February", "March", "April", "May"];
    
    // Find the latest term and latest month in that term
    const sortedEntries = [...entries].sort((a, b) => {
      const termA = parseInt(a.term) || 0;
      const termB = parseInt(b.term) || 0;
      if (termA !== termB) return termB - termA;
      return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
    });

    const lastEntry = sortedEntries[0];
    if (lastEntry) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.toLocaleString('en-US', { month: 'long' });
      
      const currentMonthIdx = monthOrder.indexOf(currentMonth);
      const lastMonthIdx = monthOrder.indexOf(lastEntry.month);
      
      const lastTerm = lastEntry.term;
      const currentMonthEntry = entries.find(e => e.month === currentMonth && e.year.toString() === currentYear.toString());
      
      if (currentMonthEntry && currentMonthEntry.term === lastTerm) {
        setIsYearEnd(true);
      } else if (currentMonthIdx >= lastMonthIdx && currentYear >= parseInt(lastEntry.year)) {
        setIsYearEnd(true);
      } else {
        setIsYearEnd(false);
      }
    }
  }, [schoolYear, schoolCalendar]);

  useEffect(() => {
    const q = collection(db, `sections/${sectionId}/students`);
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => d.data() as Student);
      
      const retained = docs.filter(s => s.status === 'Retained');
      const promoted = docs.filter(s => s.status === 'Promoted');
      const transferredOut = docs.filter(s => s.status === 'Transferred Out');
      const droppedOut = docs.filter(s => s.status === 'Dropped Out');
      const transferredIn = docs.filter(s => s.isTransferredIn);
      
      // Identify the first month of the school year and calculate all school days
      const syCal = schoolCalendar.filter(c => c.schoolYear === schoolYear);
      const monthOrder = ["June", "July", "August", "September", "October", "November", "December", "January", "February", "March", "April", "May"];
      const sortedCal = [...syCal].sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
      
      // Calculate All School Days of the Year for 80% cut-off
      const yearDays: string[] = [];
      sortedCal.forEach(m => {
        const monthIndex = MONTH_INDICES[m.month];
        const yearNum = parseInt(m.year);
        const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
        
        const openingDate = parseInt(m.openingDate || '1');
        const closingDate = parseInt(m.closingDate || '31');
        const monthNum = (monthIndex + 1).toString().padStart(2, '0');

        for (let d = 1; d <= daysInMonth; d++) {
          if (d < openingDate || d > closingDate) continue;
          const date = new Date(yearNum, monthIndex, d);
          const dayOfWeek = date.getDay();
          const dateId = `${monthNum}-${d.toString().padStart(2, '0')}`;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isHoliday = PHILIPPINE_HOLIDAYS.includes(dateId) || m.localHolidays?.includes(d);
          
          if (!isWeekend && !isHoliday) {
            yearDays.push(`${yearNum}-${monthNum}-${d.toString().padStart(2, '0')}`);
          }
        }
      });
      
      const lateEnrollees = docs.filter(s => {
        if (s.isTransferredIn || !s.dateOfFirstAttendance) return false;
        
        // 80% yearly cut-off logic
        if (yearDays.length === 0) return false;
        const firstAttendIndex = yearDays.findIndex(d => d >= s.dateOfFirstAttendance!);
        if (firstAttendIndex === -1) return true;
        
        const remainingDays = yearDays.length - firstAttendIndex;
        return (remainingDays / yearDays.length) < 0.8;
      });

      setStats({
        retained: retained.length,
        retainedM: retained.filter(s => s.sex === 'Male').length,
        retainedF: retained.filter(s => s.sex === 'Female').length,
        promoted: promoted.length,
        promotedM: promoted.filter(s => s.sex === 'Male').length,
        promotedF: promoted.filter(s => s.sex === 'Female').length,
        transferredOut: transferredOut.length,
        transferredOutM: transferredOut.filter(s => s.sex === 'Male').length,
        transferredOutF: transferredOut.filter(s => s.sex === 'Female').length,
        droppedOut: droppedOut.length,
        droppedOutM: droppedOut.filter(s => s.sex === 'Male').length,
        droppedOutF: droppedOut.filter(s => s.sex === 'Female').length,
        transferredIn: transferredIn.length,
        transferredInM: transferredIn.filter(s => s.sex === 'Male').length,
        transferredInF: transferredIn.filter(s => s.sex === 'Female').length,
        lateEnrollees: lateEnrollees.length,
        lateEnrolleesM: lateEnrollees.filter(s => s.sex === 'Male').length,
        lateEnrolleesF: lateEnrollees.filter(s => s.sex === 'Female').length
      });
    }, (err) => {
      console.error("Error fetching section stats:", err);
    });

    return unsubscribe;
  }, [sectionId, schoolCalendar, schoolYear]);

  return (
    <div className="w-full">
      {(isYearEnd || stats.retained > 0 || stats.promoted > 0) && (
        <div className="mt-5 pt-4 border-t border-slate-100 relative z-10 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={12} className="text-indigo-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Year-End Summary</span>
          </div>
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl hover:bg-emerald-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-sm font-black">P</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-emerald-900 leading-none">Promoted</span>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tight mt-1">Total learners promoted</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-emerald-700 leading-none">{stats.promoted}</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-[9px] font-bold text-slate-500">M: {stats.promotedM}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    <span className="text-[9px] font-bold text-slate-500">F: {stats.promotedF}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl hover:bg-indigo-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-sm font-black">R</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-indigo-900 leading-none">Retained</span>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tight mt-1">Total learners retained</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-indigo-700 leading-none">{stats.retained}</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-[9px] font-bold text-slate-500">M: {stats.retainedM}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    <span className="text-[9px] font-bold text-slate-500">F: {stats.retainedF}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-xl border border-slate-100 group/stat">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1 group-hover/stat:text-rose-500 transition-colors">Trans. Out</span>
          <span className="text-sm font-black text-slate-700">{stats.transferredOut}</span>
          <div className="flex gap-2 mt-1 opacity-60 group-hover/stat:opacity-100 transition-opacity">
            <span className="text-[8px] font-bold text-blue-600">M:{stats.transferredOutM}</span>
            <span className="text-[8px] font-bold text-rose-600">F:{stats.transferredOutF}</span>
          </div>
        </div>
        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-xl border border-slate-100 group/stat">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1 group-hover/stat:text-amber-500 transition-colors">Dropped</span>
          <span className="text-sm font-black text-slate-700">{stats.droppedOut}</span>
          <div className="flex gap-2 mt-1 opacity-60 group-hover/stat:opacity-100 transition-opacity">
            <span className="text-[8px] font-bold text-blue-600">M:{stats.droppedOutM}</span>
            <span className="text-[8px] font-bold text-rose-600">F:{stats.droppedOutF}</span>
          </div>
        </div>
        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-xl border border-slate-100 group/stat">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1 group-hover/stat:text-indigo-500 transition-colors">Trans. In</span>
          <span className="text-sm font-black text-slate-700">{stats.transferredIn}</span>
          <div className="flex gap-2 mt-1 opacity-60 group-hover/stat:opacity-100 transition-opacity">
            <span className="text-[8px] font-bold text-blue-600">M:{stats.transferredInM}</span>
            <span className="text-[8px] font-bold text-rose-600">F:{stats.transferredInF}</span>
          </div>
        </div>
        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-xl border border-slate-100 group/stat">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1 group-hover/stat:text-emerald-500 transition-colors text-center">Late Enr.</span>
          <span className="text-sm font-black text-slate-700">{stats.lateEnrollees}</span>
          <div className="flex gap-2 mt-1 opacity-60 group-hover/stat:opacity-100 transition-opacity">
            <span className="text-[8px] font-bold text-blue-600">M:{stats.lateEnrolleesM}</span>
            <span className="text-[8px] font-bold text-rose-600">F:{stats.lateEnrolleesF}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  or,
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  addDoc,
  deleteField,
  writeBatch,
  collectionGroup,
  updateDoc,
  orderBy,
  limit,
  arrayUnion
} from "firebase/firestore";
import { auth, db, handleFirestoreError, safeGetDoc as getDoc, safeGetDocs as getDocs } from "./firebase";
import { Subject, Student, Course, TermNumber, RatedValue, Section, UserProfile, School, Eligibility, AnecdotalRecord, AralClass, AttendanceScanLog } from "./types";
import { formatStudentName, capitalizeName, capitalizeFirst, getSubjectSortScore, printHTMLContent, isTleSubject, getTleDisplayName } from "./utils";
import { INITIAL_STUDENTS, DEFAULT_TERM_DATA } from "./constants";
import { AttendanceCard } from "./components/AttendanceCard";
import { DailyAttendanceTracker } from "./components/DailyAttendanceTracker";
import { SF2ReportView } from "./components/SF2ReportView";
import { ObservedValuesTracker } from "./components/ObservedValuesTracker";
import { SF10View } from "./components/SF10View";
import { SF4ReportView } from "./components/SF4ReportView";
import { SF7ReportView } from "./components/SF7ReportView";
import { AdminSchoolCalendarView } from "./AdminSchoolCalendarView";
import { AdminSchoolYearView } from "./components/AdminSchoolYearView";
import { FeedbackModal } from "./components/FeedbackModal";
import { AdminFeedbackDashboard } from "./components/AdminFeedbackDashboard";
import { AdminStudentListView } from "./components/AdminStudentListView";
import { AnecdotalRecordsView, getOffensePenalty } from "./components/AnecdotalRecordsView";
import { PTAFeesManagementView } from "./components/PTAFeesManagementView";
import { TleDashboardView } from "./components/TleDashboardView";
import { ClassRecordReportModal } from "./components/ClassRecordReportModal";

const transmuteGrade = (initial: number): number => {
  if (initial >= 99.50) return 100;
  if (initial >= 97.50) return 99;
  if (initial >= 96.00) return 98;
  if (initial >= 95.00) return 97;
  if (initial >= 94.00) return 96;
  if (initial >= 93.00) return 95;
  if (initial >= 92.00) return 94;
  if (initial >= 91.00) return 93;
  if (initial >= 90.00) return 92;
  if (initial >= 89.00) return 91;
  if (initial >= 88.00) return 90;
  if (initial >= 87.00) return 89;
  if (initial >= 86.00) return 88;
  if (initial >= 85.00) return 87;
  if (initial >= 84.00) return 86;
  if (initial >= 83.00) return 85;
  if (initial >= 82.00) return 84;
  if (initial >= 81.00) return 83;
  if (initial >= 80.00) return 82;
  if (initial >= 79.00) return 81;
  if (initial >= 78.00) return 80;
  if (initial >= 77.00) return 79;
  if (initial >= 76.00) return 78;
  if (initial >= 75.00) return 77;
  if (initial >= 73.00) return 76;
  if (initial >= 70.00) return 75;
  if (initial >= 68.00) return 74;
  if (initial >= 66.00) return 73;
  if (initial >= 64.00) return 72;
  if (initial >= 62.00) return 71;
  if (initial >= 60.00) return 70;
  if (initial >= 58.00) return 69;
  if (initial >= 56.00) return 68;
  if (initial >= 54.00) return 67;
  if (initial >= 52.00) return 66;
  if (initial >= 50.00) return 65;
  if (initial >= 48.00) return 64;
  if (initial >= 46.00) return 63;
  if (initial >= 43.00) return 62;
  if (initial >= 40.00) return 61;
  return 60;
};

const getDescriptiveGrade = (grade: number | string): string => {
  const numericGrade = typeof grade === 'string' ? parseFloat(grade) : grade;
  if (isNaN(numericGrade)) return '';
  if (numericGrade >= 90) return 'A';
  if (numericGrade >= 80) return 'B';
  if (numericGrade >= 75) return 'C';
  if (numericGrade >= 65) return 'D';
  return 'E';
};

const getDescriptiveRemark = (grade: number | string): string => {
  const numericGrade = typeof grade === 'string' ? parseFloat(grade) : grade;
  if (isNaN(numericGrade)) return '';
  if (numericGrade >= 90) return 'Advancing';
  if (numericGrade >= 80) return 'Benchmarking';
  if (numericGrade >= 75) return 'Connecting';
  if (numericGrade >= 65) return 'Developing';
  return 'Emerging';
};

const computeBMI = (weightKg: number, heightCm: number) => {
  if (!weightKg || !heightCm) return { bmi: 0, category: 'N/A' };
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let category = 'Normal';
  if (bmi < 18.5) category = 'Wasted';
  else if (bmi >= 25 && bmi < 30) category = 'Overweight';
  else if (bmi >= 30) category = 'Obese';
  return { bmi: parseFloat(bmi.toFixed(1)), category };
};

const calculateGrade = (student: Student, subject: Subject, term: TermNumber) => {
  const data = student.grades?.[subject.id]?.[term] || JSON.parse(JSON.stringify(DEFAULT_TERM_DATA));
  
  if (data.manualFinalGrade && data.manualFinalGrade > 0) {
     return {
        ww: { total: 0, ps: 0, ws: 0, max: 0 },
        pt: { total: 0, ps: 0, ws: 0, max: 0 },
        ta: { total: 0, ps: 0, ws: 0, max: 0 },
        initial: data.manualFinalGrade,
        final: data.manualFinalGrade,
        hasData: true
     };
  }

  const calc = (cat: string, weight: number) => {
    const component = (data[cat as keyof typeof data] || { scores: [], maxScores: [] }) as any;
    const total = (component.scores || []).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
    const max = (component.maxScores || []).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
    const ps = max === 0 ? 0 : (total / max) * 100;
    const ws = ps * (weight / 100);
    return { total, ps, ws, max };
  };

  const ww = calc('writtenWorks', subject.wwWeight);
  const pt = calc('performanceTasks', subject.ptWeight);
  
  const s1 = Number(data.summativeTests?.scores?.[0]) || 0;
  const m1 = Number(data.summativeTests?.maxScores?.[0]) || 0;
  const s2 = Number(data.summativeTests?.scores?.[1]) || 0;
  const m2 = Number(data.summativeTests?.maxScores?.[1]) || 0;
  const se = Number(data.termExam?.score) || 0;
  const me = Number(data.termExam?.maxScore) || 0;

  const ps1 = m1 === 0 ? 0 : (s1 / m1) * 100;
  const ps2 = m2 === 0 ? 0 : (s2 / m2) * 100;
  const pse = me === 0 ? 0 : (se / me) * 100;

  let totalActiveWeight = 0;
  let weightedPsSum = 0;

  if (m1 > 0) {
    totalActiveWeight += 30;
    weightedPsSum += 30 * ps1;
  }
  if (m2 > 0) {
    totalActiveWeight += 30;
    weightedPsSum += 30 * ps2;
  }
  if (me > 0) {
    totalActiveWeight += 40;
    weightedPsSum += 40 * pse;
  }

  const taTotal = s1 + s2 + se;
  const taMax = m1 + m2 + me;
  const taPs = totalActiveWeight === 0 ? 0 : (weightedPsSum / totalActiveWeight);
  const taWs = taPs * (subject.taWeight / 100);

  const rawGrade = ww.ws + pt.ws + taWs;
  const transmutedGrade = transmuteGrade(rawGrade);
  const computedFinal = subject.isZeroBasedGrading ? Math.round(rawGrade) : transmutedGrade;
  const hasData = ww.max > 0 || pt.max > 0 || taMax > 0;

  return {
    ww, pt, 
    ta: { total: taTotal, ps: taPs, ws: taWs, max: taMax },
    initial: rawGrade,
    final: hasData ? computedFinal : 0,
    hasData
  };
};

const PHILIPPINE_HOLIDAYS = [
  '01-01', '04-09', '05-01', '06-12', '08-21', '11-01', '11-30', '12-25', '12-30'
];

const MONTH_INDICES: { [key: string]: number } = {
  'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
  'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
};

export async function fetchSubjectsForSection(
  secId: string,
  gradeLevel: number,
  globalIds: string[] = [],
  globalSubjectsList: Subject[] = []
) {
  try {
    const { collection } = await import("firebase/firestore");
    const secSubjectsSnap = await getDocs(collection(db, `sections/${secId}/subjects`));
    const secSubjs = secSubjectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));

    const matchedGlobals = globalSubjectsList.filter(s => 
      Number(s.gradeLevel) === Number(gradeLevel) || 
      globalIds.includes(s.id)
    );

    return [...matchedGlobals, ...secSubjs];
  } catch (error) {
    console.error("Error fetching subjects dynamically in global helper:", error);
    return globalSubjectsList.filter(s => Number(s.gradeLevel) === Number(gradeLevel) || globalIds.includes(s.id));
  }
}

const compressImage = (dataUrl: string, maxWidth: number, maxHeight: number, quality: number = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        // Detect original MIME type from data URL to check for transparent formats (PNG, WebP, GIF)
        const match = dataUrl.match(/^data:([^;]+);/);
        const originalMime = match ? match[1] : '';
        const isTransparentFormat = originalMime === 'image/png' || originalMime === 'image/webp' || originalMime === 'image/gif';
        
        if (isTransparentFormat) {
          // Keep transparent background by exporting to PNG
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [sections, setSectionsRaw] = useState<Section[]>([]);
  const [aralClasses, setAralClasses] = useState<AralClass[]>([]);
  const setSections = React.useCallback((val: Section[] | ((prev: Section[]) => Section[])) => {
    const sortFn = (list: Section[]) => {
      return [...list].sort((a, b) => {
        const valA = Number(a.gradeLevel) || 0;
        const valB = Number(b.gradeLevel) || 0;
        if (valA !== valB) {
          return valA - valB;
        }
        return (a.name || '').localeCompare(b.name || '');
      });
    };
    if (typeof val === 'function') {
      setSectionsRaw(prev => sortFn(val(prev)));
    } else {
      setSectionsRaw(sortFn(val));
    }
  }, []);
  const [expiredSchoolIds, setExpiredSchoolIds] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedAralClassId, setSelectedAralClassId] = useState<string | null>(null);
  const [schoolCalendar, setSchoolCalendar] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [isAuthorizedCashier, setIsAuthorizedCashier] = useState(false);
  const [confirmYearEndUnfinalize, setConfirmYearEndUnfinalize] = useState(false);
  const [confirmFinalizeSection, setConfirmFinalizeSection] = useState(false);

  // ARAL Master Data States
  const [aralSchoolInfo, setAralSchoolInfo] = useState<AralSchoolInfo>(() => {
    try {
      const saved = localStorage.getItem('aral_v2_school_info');
      return saved ? JSON.parse(saved) : DEFAULT_SCHOOL_INFO;
    } catch {
      return DEFAULT_SCHOOL_INFO;
    }
  });

  const [aralCompetencies, setAralCompetencies] = useState<AralCompetency[]>(() => {
    try {
      const saved = localStorage.getItem('aral_v2_competencies');
      return saved ? JSON.parse(saved) : DEFAULT_COMPETENCIES;
    } catch {
      return DEFAULT_COMPETENCIES;
    }
  });

  const [isMasterDataOpen, setIsMasterDataOpen] = useState(true);

  // Helper for per-user storage key
  const activeUserId = currentUser?.uid || userProfile?.uid || (userProfile?.email ? userProfile.email.toLowerCase().trim() : null);

  // System Theme Settings State & Live Dynamic Engine (Per-User Preferences)
  const [systemThemeSettings, setSystemThemeSettings] = useState<SystemThemeSettings>(() => {
    try {
      const saved = activeUserId ? localStorage.getItem(`class_enterprise_system_theme_${activeUserId}`) : null;
      if (saved) return JSON.parse(saved);
      const legacySaved = localStorage.getItem('class_enterprise_system_theme');
      return legacySaved ? JSON.parse(legacySaved) : DEFAULT_THEME_SETTINGS;
    } catch {
      return DEFAULT_THEME_SETTINGS;
    }
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Automatically update active theme state when user changes or logs in/out
  useEffect(() => {
    try {
      if (userProfile?.themeSettings) {
        setSystemThemeSettings(userProfile.themeSettings);
      } else {
        const userKey = activeUserId ? `class_enterprise_system_theme_${activeUserId}` : 'class_enterprise_system_theme_guest';
        const saved = localStorage.getItem(userKey);
        if (saved) {
          setSystemThemeSettings(JSON.parse(saved));
        } else if (!activeUserId) {
          setSystemThemeSettings(DEFAULT_THEME_SETTINGS);
        }
      }
    } catch (err) {
      console.error('Error loading per-user theme:', err);
    }
  }, [activeUserId, userProfile?.themeSettings]);

  const handleUpdateThemeSettings = async (newSettings: SystemThemeSettings) => {
    setSystemThemeSettings(newSettings);
    if (userProfile && userProfile.uid && !userProfile.uid.startsWith('demo-')) {
      try {
        await updateDoc(doc(db, "users", userProfile.uid), {
          themeSettings: newSettings
        });
        setUserProfile(prev => prev ? { ...prev, themeSettings: newSettings } : null);
      } catch (err) {
        console.error("Failed to save theme settings to firestore:", err);
      }
    }
  };

  useEffect(() => {
    try {
      const userKey = activeUserId ? `class_enterprise_system_theme_${activeUserId}` : 'class_enterprise_system_theme_guest';
      localStorage.setItem(userKey, JSON.stringify(systemThemeSettings));
    } catch (err) {
      console.error('Failed to save system theme settings:', err);
    }

    const root = document.documentElement;
    if (systemThemeSettings.mode === 'dark') {
      root.classList.add('dark');
    } else if (systemThemeSettings.mode === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    root.setAttribute('data-theme-color', systemThemeSettings.color);
    root.setAttribute('data-theme-density', systemThemeSettings.density);
    root.setAttribute('data-theme-font', systemThemeSettings.font);
    root.setAttribute('data-theme-radius', systemThemeSettings.radius);
  }, [systemThemeSettings, activeUserId]);

  const mapUserRoleToAralRole = (role?: string, email?: string): AralRole => {
    if (email && aralSchoolInfo?.coordinatorEmails?.some(e => e.trim().toLowerCase() === email.trim().toLowerCase())) {
      return 'ARAL Coordinator';
    }
    if (!role) return 'Teacher';
    switch (role) {
      case 'system_admin':
      case 'admin':
      case 'school_head':
        return 'ARAL Coordinator';
      case 'teacher':
        return 'Teacher';
      default:
        return 'Teacher';
    }
  };

  const handleUpdateAralSchool = (info: AralSchoolInfo) => {
    setAralSchoolInfo(info);
    localStorage.setItem('aral_v2_school_info', JSON.stringify(info));
  };

  const handleAddAralCompetency = (comp: AralCompetency) => {
    const updated = [...aralCompetencies, comp];
    setAralCompetencies(updated);
    localStorage.setItem('aral_v2_competencies', JSON.stringify(updated));
  };

  const handleDeleteAralCompetency = (id: string) => {
    if (window.confirm("Are you sure you want to delete this learning competency?")) {
      const updated = aralCompetencies.filter(c => c.id !== id);
      setAralCompetencies(updated);
      localStorage.setItem('aral_v2_competencies', JSON.stringify(updated));
    }
  };

  const handleCreateAralClass = async (
    gradeLevelNum: number,
    name: string,
    tutorName: string,
    tutorEmail: string,
    studentIds: string[],
    targetSubject?: string
  ) => {
    if (!userProfile?.schoolId) return;
    try {
      const newClassData = {
        name: name,
        gradeLevel: gradeLevelNum,
        schoolId: userProfile.schoolId,
        schoolYear: globalSettings?.activeSchoolYear || "2026-2027",
        adviserName: tutorName,
        adviserEmail: tutorEmail,
        studentIds: studentIds,
        targetSubject: targetSubject || "Mathematics & Reading"
      };
      await addDoc(collection(db, "aral_classes"), newClassData);
      alert("Successfully created ARAL Class.");
    } catch (err) {
      console.error("Error creating ARAL Class:", err);
      alert("Failed to create ARAL Class.");
    }
  };

  const handleUpdateAralClass = async (
    classId: string,
    tutorName: string,
    tutorEmail: string,
    studentIds: string[],
    targetSubject?: string,
    name?: string,
    gradeLevel?: number
  ) => {
    try {
      const docRef = doc(db, "aral_classes", classId);
      const updateData: any = {
        adviserName: tutorName,
        adviserEmail: tutorEmail,
        studentIds: studentIds,
        targetSubject: targetSubject || "Mathematics & Reading"
      };
      if (name !== undefined) updateData.name = name;
      if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel;

      await updateDoc(docRef, updateData);
      alert("Successfully updated ARAL Class.");
    } catch (err) {
      console.error("Error updating ARAL Class:", err);
      alert("Failed to update ARAL Class.");
    }
  };

  const handleDeleteAralClass = async (classId: string) => {
    try {
      const docRef = doc(db, "aral_classes", classId);
      await deleteDoc(docRef);
      alert("Successfully deleted ARAL Class.");
    } catch (err) {
      console.error("Error deleting ARAL Class:", err);
      alert("Failed to delete ARAL Class.");
    }
  };

  useEffect(() => {
    if (!currentUser || !userProfile?.schoolId) {
      setIsAuthorizedCashier(false);
      return;
    }
    if (userProfile.role === 'admin' || userProfile.role === 'system_admin') {
      setIsAuthorizedCashier(true);
      return;
    }
    const unsub = onSnapshot(query(collection(db, 'settings'), where('id', '==', `pta_config_${userProfile.schoolId}`)), (snap) => {
      if (!snap.empty) {
        const configData = snap.docs[0].data();
        const emails = configData.cashierEmails || [];
        setIsAuthorizedCashier(emails.map((e: string) => e.toLowerCase()).includes(currentUser.email?.toLowerCase() || ''));
      } else {
        setIsAuthorizedCashier(false);
      }
    }, (err) => {
      console.error("Error loading cashier settings:", err);
    });
    return unsub;
  }, [currentUser, userProfile]);

  // Run once-per-app-session database cleanup to clear defaulted JHS section subjects where adviser was assigned by default
  useEffect(() => {
    if (!currentUser || !currentUser.email || !userProfile) return;

    const hasRun = localStorage.getItem('jhs_tle_teacher_cleanup_v2');
    if (hasRun) return;

    const runCleanup = async () => {
      try {
        console.log("Starting JHS sections default teacher cleanup...");
        const sectionsSnap = await getDocs(collection(db, "sections"));
        let clearedCount = 0;

        const userEmailLower = (currentUser.email || "").trim().toLowerCase();
        const userUid = currentUser.uid;
        const userRole = userProfile.role;

        for (const secDoc of sectionsSnap.docs) {
          const sec = { id: secDoc.id, ...secDoc.data() } as Section;
          const isJHS = sec.gradeLevel && Number(sec.gradeLevel) <= 10;
          if (!isJHS) continue;

          // Check if user is authorized to write to this section's subjects under firestore rules
          const isAuthorized = 
            userRole === "admin" || 
            userRole === "system_admin" ||
            sec.createdBy === userUid || 
            (sec.adviserEmail || "").trim().toLowerCase() === userEmailLower;

          if (!isAuthorized) continue;

          const adviserEmailNorm = (sec.adviserEmail || "").trim().toLowerCase();
          
          // Get the subjects sub-collection
          const subsSnap = await getDocs(collection(db, "sections", sec.id, "subjects"));
          for (const subDoc of subsSnap.docs) {
            const sub = subDoc.data();
            const teacherEmailNorm = (sub.teacherEmail || "").trim().toLowerCase();

            // Clear defaulted adviser email from CORE or TLE subjects
            if (adviserEmailNorm && teacherEmailNorm === adviserEmailNorm) {
              await updateDoc(doc(db, "sections", sec.id, "subjects", subDoc.id), {
                teacherEmail: ""
              });
              clearedCount++;
            }
          }
        }
        console.log(`Database JHS sections teacher cleanup finished. Cleared ${clearedCount} default assignments.`);
        localStorage.setItem('jhs_tle_teacher_cleanup_v2', 'true');
      } catch (err: any) {
        console.warn("Note: Automatic JHS sections teacher cleanup did not complete entirely:", err.message || err);
      }
    };

    runCleanup();
  }, [currentUser, userProfile]);

  useEffect(() => {
    if (!currentUser) {
      setGlobalSettings(null);
      return;
    }
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalSettings(docSnap.data());
      } else {
        setGlobalSettings({ schoolYears: [], activeSchoolYear: null });
      }
    }, (err) => {
      handleFirestoreError(err, 'get', 'settings/general');
    });
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setSchoolCalendar([]);
      return;
    }
    const q = query(collection(db, 'school_calendar'), orderBy('year', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setSchoolCalendar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, 'list', 'school_calendar');
    });
    return () => unsub();
  }, [currentUser]);

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sectionSubjects, setSectionSubjects] = useState<Subject[]>([]);
  const [globalSubjects, setGlobalSubjects] = useState<Subject[]>([]);
  
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, 'global_subjects'), (snap) => {
      setGlobalSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
    });
    return () => unsub();
  }, [currentUser]);
  const [activeSchool, setActiveSchool] = useState<School | null>(null);
  const [teacherCount, setTeacherCount] = useState<number>(0);
  
  const [activeTab, setActiveTab ] = useState<"dashboard" | "gradebook" | "enroll" | "subjects" | "summary" | "guide" | "sys-docs" | "attendance" | "sf2" | "observed-values" | "sf10" | "transfers" | "sf8" | "sf4" | "sf7" | "anecdotes" | "pta" | "tle-dashboard">("dashboard");
  const [ptaInitialTab, setPtaInitialTab] = useState<'collection' | 'setup' | 'reports' | 'audit'>('collection');
  const [preselectedStudentForAnecdotal, setPreselectedStudentForAnecdotal] = useState<Student | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSectionSwitcherOpen, setIsSectionSwitcherOpen] = useState(false);
  const [showAdminUsers, setShowAdminUsers] = useState(false);
  const [showAdminStudentList, setShowAdminStudentList] = useState(false);
  const [showAdminSchools, setShowAdminSchools] = useState(false);
  const [showAdminSchoolCalendar, setShowAdminSchoolCalendar] = useState(false);
  const [showAdminSchoolYear, setShowAdminSchoolYear] = useState(false);
  const [showAdminFeedback, setShowAdminFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAdminPTA, setShowAdminPTA] = useState(false);
  const [showAdminSF4, setShowAdminSF4] = useState(false);
  const [showAdminSF7, setShowAdminSF7] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [studentViewMatched, setStudentViewMatched] = useState<{ student: Student, section: Section } | null>(null);
  const [allStudentEnrollments, setAllStudentEnrollments] = useState<{ student: Student, section: Section }[]>([]);
  const [noApprovedAdminFound, setNoApprovedAdminFound] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [combinedTleStudents, setCombinedTleStudents] = useState<Student[]>([]);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [selectedStudentForBlankReport, setSelectedStudentForBlankReport] = useState<Student | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ student: Student, newStatus: 'Active' | 'Transferred Out' | 'Dropped Out' | 'Retained' | 'Promoted' } | null>(null);
  const [statusChangeDate, setStatusChangeDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusChangeReason, setStatusChangeReason] = useState("");

  const [scanLogs, setScanLogs] = useState<AttendanceScanLog[]>([]);
  const [showGlobalScanner, setShowGlobalScanner] = useState(false);
  const [isScannerFullScreen, setIsScannerFullScreen] = useState(false);
  const [globalScannerFacingMode, setGlobalScannerFacingMode] = useState<'user' | 'environment'>('environment');
  const [globalRecentScan, setGlobalRecentScan] = useState<{ status: 'success' | 'error', message: string, student?: Student | null, section?: Section | null, scanType?: 'IN' | 'OUT', scanTime?: string } | null>(null);
  const [globalScannerError, setGlobalScannerError] = useState<string | null>(null);
  const [globalManualLrnInput, setGlobalManualLrnInput] = useState('');
  const [scannerViewMode, setScannerViewMode] = useState<'scanner' | 'all_logs'>('scanner');
  const [allLogsSearchQuery, setAllLogsSearchQuery] = useState('');

  const openGlobalScanner = useCallback(() => {
    setIsScannerFullScreen(false);
    setShowGlobalScanner(true);
    setGlobalRecentScan(null);
    setGlobalScannerError(null);
  }, []);

  // Sync scan logs from Firestore
  useEffect(() => {
    if (!db || !currentUser) return;
    const q = query(collection(db, 'attendance_scan_logs'));
    const unsub = onSnapshot(q, (snapshot) => {
      const logs: AttendanceScanLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() } as AttendanceScanLog);
      });
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setScanLogs(logs);
    }, (err) => {
      console.error("Error fetching attendance_scan_logs:", err);
      handleFirestoreError(err, 'list', 'attendance_scan_logs');
    });
    return () => unsub();
  }, [currentUser]);

  const handleAddScanLog = async (logData: Omit<AttendanceScanLog, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'attendance_scan_logs'));
      const newLog: AttendanceScanLog = {
        id: docRef.id,
        ...logData
      };
      await setDoc(docRef, newLog);
    } catch (err) {
      console.error("Error saving scan log:", err);
      handleFirestoreError(err, 'write', 'attendance_scan_logs');
    }
  };

  const handleDeleteScanLog = async (logId: string) => {
    try {
      await deleteDoc(doc(db, 'attendance_scan_logs', logId));
    } catch (err) {
      console.error("Error deleting scan log:", err);
      handleFirestoreError(err, 'delete', `attendance_scan_logs/${logId}`);
    }
  };

  const handleClearScanLogs = async (logIds?: string[]) => {
    try {
      if (logIds && logIds.length > 0) {
        const batchOps = logIds.map(id => deleteDoc(doc(db, 'attendance_scan_logs', id)));
        await Promise.all(batchOps);
      } else {
        const snap = await getDocs(collection(db, 'attendance_scan_logs'));
        const batchOps = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(batchOps);
      }
    } catch (err) {
      console.error("Error clearing scan logs:", err);
      handleFirestoreError(err, 'delete', 'attendance_scan_logs');
    }
  };

  const globalScannerConstraints = useMemo(() => ({
    facingMode: globalScannerFacingMode
  }), [globalScannerFacingMode]);

  const globalScannerComponents = useMemo(() => ({
    audio: false,
    finder: true,
  }), []);

  const handleGlobalScan = async (scannedLrn: string) => {
    if (!scannedLrn) return;

    let targetSection = selectedSection;
    let student = students.find(s => s.lrn === scannedLrn);

    if (!targetSection) {
      // Find the student across all sections of active school year
      try {
        const q = query(collectionGroup(db, 'students'), where('lrn', '==', scannedLrn));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const pathParts = docSnap.ref.path.split('/');
          const sectionId = pathParts[1];
          const sect = sections.find(s => s.id === sectionId);
          if (sect) {
            targetSection = sect;
            student = { id: docSnap.id, ...docSnap.data() } as Student;
          }
        }
      } catch (err) {
        console.error("Error finding student in global scan:", err);
      }
    }

    if (!targetSection || !student) {
      setGlobalRecentScan({
        status: 'error',
        message: targetSection 
          ? `LRN "${scannedLrn}" was not found in the selected section (${targetSection.name}).`
          : `LRN "${scannedLrn}" was not found in any registered section.`,
        student: null,
        section: null
      });
      return;
    }

    // Now, check for today's validity
    const today = new Date();
    const currentYear = today.getFullYear();
    const JS_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthStr = JS_MONTHS[today.getMonth()];
    const currentDay = today.getDate();

    const monthVal = String(today.getMonth() + 1).padStart(2, '0');
    const dayVal = String(today.getDate()).padStart(2, '0');
    const scanDate = `${currentYear}-${monthVal}-${dayVal}`;
    const scanTime = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    // Determine scanType (IN vs OUT)
    const studentTodayLogs = scanLogs
      .filter(l => l.scanDate === scanDate && (l.studentId === student.id || l.lrn === student.lrn))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let scanType: 'IN' | 'OUT' = 'IN';
    if (studentTodayLogs.length > 0) {
      const lastLog = studentTodayLogs[studentTodayLogs.length - 1];
      scanType = lastLog.scanType === 'IN' ? 'OUT' : 'IN';
    } else {
      scanType = 'IN';
    }

    // Record scan log to database
    handleAddScanLog({
      studentId: student.id,
      studentName: formatStudentName(student),
      lrn: student.lrn || '',
      sectionId: targetSection.id,
      sectionName: targetSection.name,
      gradeLevel: targetSection.gradeLevel,
      schoolId: targetSection.schoolId || userProfile?.schoolId || '',
      schoolYear: targetSection.schoolYear || '',
      scanDate,
      scanTime,
      scanType,
      timestamp: today.toISOString(),
      scannedBy: currentUser?.email || 'ID Scanner',
      status: 'On Time'
    });

    // Reconstruct filtered calendar entries for this section's school year
    const sectionCal = schoolCalendar.filter(c => c.schoolYear === targetSection.schoolYear);
    const monthOrder = ["June", "July", "August", "September", "October", "November", "December", "January", "February", "March", "April", "May"];
    const sortedCal = [...sectionCal].sort((a, b) => monthOrder.indexOf(a.month as string) - monthOrder.indexOf(b.month as string));

    // Construct the calendar map
    const localCalendarMap: { [key: string]: any } = {};
    sortedCal.forEach(c => {
      const term = (c.term || '1').toString();
      const month = c.month as string;
      const key = `${month}_${term}`;
      const year = parseInt(c.year);
      const openingDate = parseInt(c.openingDate || '1');
      const closingDate = parseInt(c.closingDate || '31');
      const localHolidays = c.localHolidays || [];
      const daysInMonth = new Date(year, (MONTH_INDICES[month] || 0) + 1, 0).getDate();

      const allSchoolDays: number[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, MONTH_INDICES[month], d);
        const dayOfWeek = date.getDay();
        const dateStr = `${(MONTH_INDICES[month] + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = PHILIPPINE_HOLIDAYS.includes(dateStr);
        if (!isWeekend && !isHoliday) {
          allSchoolDays.push(d);
        }
      }

      const hasManualCoverage = openingDate !== 1 || (closingDate !== 31 && closingDate !== daysInMonth);
      let validDays: number[] = [];

      if (hasManualCoverage) {
        validDays = allSchoolDays.filter(d => d >= openingDate && d <= closingDate);
      } else {
        const allEntriesForMonth = sortedCal.filter(entry => entry.month === month)
          .sort((a, b) => (parseInt(a.term || '1') || 1) - (parseInt(b.term || '1') || 1));
        
        const currentTermNum = parseInt(term);
        let startIndex = 0;
        for (const entry of allEntriesForMonth) {
          if ((parseInt(entry.term) || 1) < currentTermNum) {
            startIndex += parseInt(entry.days) || 0;
          } else {
            break;
          }
        }
        const daysToTake = parseInt(c.days) || allSchoolDays.length;
        validDays = allSchoolDays.slice(startIndex, startIndex + daysToTake);
      }

      localCalendarMap[key] = { 
        schoolDays: parseInt(c.days) || validDays.length,
        year,
        term,
        month,
        openingDate,
        closingDate,
        validDays,
        localHolidays
      };
    });

    let termKeyToUpdate: string | null = null;
    for (const key of Object.keys(localCalendarMap)) {
      const data = localCalendarMap[key];
      if (data.year === currentYear && data.month === currentMonthStr) {
        if (data.validDays.includes(currentDay)) {
          termKeyToUpdate = key;
          break;
        }
      }
    }

    // Helper for disabled day
    const isDayDisabled = (stud: Student, year: number, month: string, day: number) => {
      if (stud.dateOfFirstAttendance) {
        const [fYear, fMonth, fDay] = stud.dateOfFirstAttendance.split('-').map(Number);
        const currentMonthIdx = MONTH_INDICES[month];
        if (year < fYear) return true;
        if (year === fYear) {
          if (currentMonthIdx < (fMonth - 1)) return true;
          if (currentMonthIdx === (fMonth - 1) && day < fDay) return true;
        }
      }
      if (stud.status === 'Dropped Out' || stud.status === 'Transferred Out') {
        if (stud.dropoutDate) {
          const [dYear, dMonth, dDay] = stud.dropoutDate.split('-').map(Number);
          const currentMonthIdx = MONTH_INDICES[month];
          if (year > dYear) return true;
          if (year === dYear) {
            if (currentMonthIdx > (dMonth - 1)) return true;
            if (currentMonthIdx === (dMonth - 1) && day >= dDay) return true;
          }
        }
      }
      return false;
    };

    const isDisabled = isDayDisabled(student, currentYear, currentMonthStr, currentDay);
    if (isDisabled) {
      setGlobalRecentScan({
        status: 'error',
        message: `${formatStudentName(student)} logged TIME ${scanType} at ${scanTime}, but is marked inactive/dropped out today.`,
        student,
        section: targetSection,
        scanType,
        scanTime
      });
      return;
    }

    if (!termKeyToUpdate) {
      setGlobalRecentScan({
        status: 'success',
        message: `${formatStudentName(student)} logged TIME ${scanType} at ${scanTime} (Section ${targetSection.name}). Note: Today (${currentMonthStr} ${currentDay}) is not a scheduled school day in calendar.`,
        student,
        section: targetSection,
        scanType,
        scanTime
      });
      return;
    }

    // Attempt to update attendance
    try {
      const dailyAttendance = {
        ...(student.dailyAttendance || {}),
        [termKeyToUpdate]: {
          ...(student.dailyAttendance?.[termKeyToUpdate] || {}),
          [currentDay]: true
        }
      };

      // Calculate monthly present count
      const monthDaily = dailyAttendance[termKeyToUpdate];
      let presentCount = 0;
      Object.values(monthDaily).forEach(val => { if (val) presentCount++; });

      const calendarForMonth = schoolCalendar.find(c => c.schoolYear === targetSection.schoolYear && (`${c.month}_${c.term || '1'}` === termKeyToUpdate || c.month === termKeyToUpdate))?.days || 0;
      const absentCount = Math.max(0, calendarForMonth - presentCount);

      const attendance = {
        ...(student.attendance || {}),
        [termKeyToUpdate]: {
          present: presentCount,
          absent: absentCount
        }
      };

      await setDoc(doc(db, `sections/${targetSection.id}/students`, student.id), {
        dailyAttendance,
        attendance
      }, { merge: true });

      setGlobalRecentScan({
        status: 'success',
        message: `${formatStudentName(student)} logged TIME ${scanType} at ${scanTime} (Section ${targetSection.name}).`,
        student,
        section: targetSection,
        scanType,
        scanTime
      });
    } catch (err) {
      console.error(err);
      setGlobalRecentScan({
        status: 'error',
        message: `Logged TIME ${scanType} at ${scanTime}, but failed to update daily matrix: ${err instanceof Error ? err.message : String(err)}`,
        student,
        section: targetSection,
        scanType,
        scanTime
      });
    }
  };

  const globalScanRef = useRef(handleGlobalScan);
  useEffect(() => {
    globalScanRef.current = handleGlobalScan;
  }, [handleGlobalScan]);

  const handleGlobalScannerError = useCallback((err: any) => {
    console.error("Scanner Error:", err?.message || err);
    let errMsg = "Unable to access camera.";
    
    if (err && typeof err === 'object') {
      const errName = err.name || err.kind || '';
      const errMsgStr = (err.message || '').toLowerCase();
      
      const isPermissionDenied = 
        errName === 'NotAllowedError' || 
        errName === 'PermissionDeniedError' || 
        errName === 'permission-denied' ||
        errMsgStr.includes('not allowed') || 
        errMsgStr.includes('permission') || 
        errMsgStr.includes('denied') || 
        errMsgStr.includes('current context');
        
      if (isPermissionDenied) {
        errMsg = "Camera permission denied or blocked. If you are using this app inside the preview frame, please click 'Open in New Tab' at the top-right of the preview to allow camera access.";
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError' || errName === 'no-camera' || errMsgStr.includes('notfound') || errMsgStr.includes('no camera')) {
        errMsg = "No camera device found.";
      } else if (errName === 'OverconstrainedError' || errName === 'overconstrained') {
        errMsg = "Selected camera type is not available. Please try switching cameras.";
      } else if (err.message) {
        errMsg = err.message;
      }
    } else if (typeof err === 'string') {
      const lowerErr = err.toLowerCase();
      if (lowerErr.includes('not allowed') || lowerErr.includes('permission') || lowerErr.includes('denied') || lowerErr.includes('current context')) {
        errMsg = "Camera permission denied or blocked. If you are using this app inside the preview frame, please click 'Open in New Tab' at the top-right of the preview to allow camera access.";
      } else {
        errMsg = err;
      }
    }
    
    setGlobalScannerError(errMsg);
  }, []);

  const handleGlobalScannerScan = useCallback((result: any[]) => {
    if (result && result.length > 0) {
      globalScanRef.current(result[0].rawValue);
    }
  }, []);

  const [enrollAllModalOpen, setEnrollAllModalOpen] = useState(false);
  const [enrollAllProcessing, setEnrollAllProcessing] = useState(false);
  const [enrollAllSuccessMsg, setEnrollAllSuccessMsg] = useState("");
  const [enrollAllErrorMsg, setEnrollAllErrorMsg] = useState("");

  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [course, setCourse] = useState<Course>({
    name: "General Management",
    code: "GEN-01",
    instructor: "Pending...",
    section: "TBA",
    termWeight: { written: 30, performance: 40, summative: 20, exam: 10 }
  });

  // Enrollment Form State
  const [learnerForm, setLearnerForm] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    extension: "",
    name: "",
    lrn: "",
    email: "",
    photo: "",
    age: "",
    birthdate: "",
    birthplace: "",
    address: "",
    sex: "Male" as "Male" | "Female",
    fatherName: "",
    motherName: "",
    guardianName: "",
    guardianRelationship: "",
    primaryContact: "guardian" as "father" | "mother" | "guardian",
    contactNumber: "",
    dateOfFirstAttendance: "",
    attendance: {} as any,
    weight: "",
    height: "",
    nutritionalStatus: {},
    isTransferredIn: false,
    siblingIds: [] as string[],
    enrolledSubjectIds: [] as string[],
    eligibility: {
      type: 'Elementary School Completer',
      genAvg: '',
      citation: '',
      elemSchoolName: '',
      elemSchoolId: '',
      elemSchoolAddress: '',
      peptRating: '',
      peptDate: '',
      alsRating: '',
      alsCenterInfo: '',
      othersSpecify: ''
    } as Eligibility
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTerm, setActiveTerm] = useState<TermNumber>(1);
  
  useEffect(() => {
    if (userProfile && (userProfile.role !== 'system_admin' && userProfile.role !== 'admin') && userProfile.approvalStatus !== 'approved' && userProfile.email !== 'jessiemangabo@gmail.com') {
      const q = query(
        collection(db, "users"),
        where("role", "==", "system_admin"),
        where("schoolId", "==", userProfile.schoolId),
        where("approvalStatus", "==", "approved"),
        limit(1)
      );
      getDocs(q).then(snap => {
        setNoApprovedAdminFound(snap.empty);
      }).catch(err => {
        console.error("Error checking for approved admin:", err);
      });
    } else {
      setNoApprovedAdminFound(false);
    }
  }, [userProfile]);

  useEffect(() => {
    const sId = userProfile?.schoolId;
    if (!sId) {
      setActiveSchool(null);
      return;
    }
    const q = query(collection(db, "schools"), where("schoolId", "==", sId));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        setActiveSchool({ id: docSnap.id, ...docSnap.data() } as School);
      } else {
        setActiveSchool(null);
      }
    }, (err) => {
      console.error("Error listening to active school:", err);
    });
    return () => unsub();
  }, [userProfile?.schoolId]);

  useEffect(() => {
    const sId = userProfile?.schoolId;
    if (!sId) {
      setTeacherCount(0);
      return;
    }
    const q = query(
      collection(db, "users"),
      where("role", "==", "teacher"),
      where("schoolId", "==", sId)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTeacherCount(snap.size);
    }, (err) => {
      console.error("Error listening to teachers count:", err);
    });
    return () => unsub();
  }, [userProfile?.schoolId]);

  const isAnySectionAdviser = useMemo(() => {
    if (!userProfile || userProfile.role !== 'teacher') return false;
    const authEmail = (currentUser?.email || "").trim().toLowerCase();
    const profileEmail = (userProfile?.email || "").trim().toLowerCase();
    const uid = currentUser?.uid || "";
    return sections.some(s => {
      const advEmail = (s.adviserEmail || "").trim().toLowerCase();
      return (advEmail && (advEmail === authEmail || advEmail === profileEmail)) || (uid && s.createdBy === uid);
    });
  }, [currentUser, userProfile, sections]);

  const isSectionAdviser = useMemo(() => {
    if (!selectedSection) return false;
    const authEmail = (currentUser?.email || "").trim().toLowerCase();
    const profileEmail = (userProfile?.email || "").trim().toLowerCase();
    const adviserEmailStr = (selectedSection.adviserEmail || "").trim().toLowerCase();
    const isAdviser = adviserEmailStr && (adviserEmailStr === authEmail || adviserEmailStr === profileEmail);
    return !!isAdviser;
  }, [currentUser, userProfile, selectedSection]);

  const isEntireSchoolFinalized = useMemo(() => {
    const activeYear = globalSettings?.activeSchoolYear;
    if (!activeYear) return false;
    const activeSections = sections.filter(s => s.schoolYear === activeYear);
    if (activeSections.length === 0) return false;
    return activeSections.every(s => s.isFinalized);
  }, [sections, globalSettings?.activeSchoolYear]);

  const editableSubjects = useMemo(() => {
    const email = (currentUser?.email || userProfile?.email || "").trim().toLowerCase();
    if (!email) return [];
    return subjects.filter(sub => {
      const subjEmail = (sub.teacherEmail || "").trim().toLowerCase();
      return subjEmail === email;
    });
  }, [subjects, currentUser, userProfile]);

  const globalNumTerms = useMemo(() => {
    if (!schoolCalendar || schoolCalendar.length === 0) return 4;
    const terms = schoolCalendar.map(c => parseInt(c.term) || 0);
    return Math.max(...terms, 4);
  }, [schoolCalendar]);

  const activeTermsInfo = useMemo(() => {
    const years = Array.from(new Set(schoolCalendar.map(c => c.schoolYear).filter(Boolean))) as string[];
    const latest = years.sort((a, b) => b.localeCompare(a))[0] || "";
    const filtered = schoolCalendar.filter(c => c.schoolYear === latest);
    const terms = Array.from(new Set(filtered.map(c => (c.term || '1').toString()))).sort();
    
    return terms.map(term => {
      const termEntries = filtered.filter(c => (c.term || '1').toString() === term);
      const totalDays = termEntries.reduce((sum, c) => sum + (parseInt(c.days) || 0), 0);
      return { term, days: totalDays, schoolYear: latest };
    });
  }, [schoolCalendar]);

  const hasCalendarMatch = useMemo(() => {
    if (!globalSettings?.activeSchoolYear) return false;
    if (!schoolCalendar || schoolCalendar.length === 0 || !selectedSection?.schoolYear) return false;
    return schoolCalendar.some(c => c.schoolYear === selectedSection.schoolYear);
  }, [schoolCalendar, selectedSection?.schoolYear, globalSettings?.activeSchoolYear]);

  // Pending Users Listener
  useEffect(() => {
    if (!currentUser || !userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'system_admin' && !isAnySectionAdviser)) {
      setPendingUsersCount(0);
      return;
    }

    let q;
    if (userProfile.role === 'admin') {
      q = query(collection(db, "users"), where("approvalStatus", "==", "pending"));
    } else if (userProfile.role === 'system_admin') {
      q = query(
        collection(db, "users"), 
        where("approvalStatus", "==", "pending"),
        where("schoolId", "==", userProfile.schoolId)
      );
    } else {
      // For section advisers (teachers), only show pending students in their school
      q = query(
        collection(db, "users"), 
        where("approvalStatus", "==", "pending"),
        where("role", "==", "student"),
        where("schoolId", "==", userProfile.schoolId)
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      setPendingUsersCount(snap.docs.length);
    }, (error) => {
      handleFirestoreError(error, 'list', 'users');
    });

    return () => unsub();
  }, [currentUser, userProfile, isAnySectionAdviser]);

  // Auth Listener
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const profile = userDoc.data() as UserProfile;
              let updatedProfile = { ...profile };
              let syncNeeded = false;

              // Sync name from Google Auth if it was changed
              if (user.displayName && profile.displayName !== user.displayName) {
                updatedProfile.displayName = user.displayName;
                syncNeeded = true;
              }
              
              // Bootstrap Admin
              if (user.email === 'jessiemangabo@gmail.com' && (profile.role !== 'admin' || profile.approvalStatus !== 'approved')) {
                 updatedProfile = { ...updatedProfile, role: 'admin', approvalStatus: 'approved' };
                 syncNeeded = true;
              }

              if (syncNeeded) {
                 await setDoc(doc(db, "users", user.uid), updatedProfile, { merge: true });
                 setUserProfile(updatedProfile);
              } else {
                 setUserProfile(profile);
              }
              
              if (updatedProfile.role === 'student') {
                 // Look for student in all sections
                 const identifiers: { val: string, type: 'email' | 'lrn' }[] = [];
                 if (updatedProfile.email) identifiers.push({ val: updatedProfile.email, type: 'email' });
                 if (updatedProfile.lrn) identifiers.push({ val: updatedProfile.lrn, type: 'lrn' });
                 
                 if (identifiers.length > 0) {
                   await findStudentEnrollments(identifiers);
                 }
              }
            } else {
              // Check if this is the bootstrap admin
              const isAdmin = user.email === 'jessiemangabo@gmail.com';
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || "",
                role: isAdmin ? "admin" : "teacher",
                displayName: user.displayName || "",
                approvalStatus: isAdmin ? 'approved' : 'pending'
              };
              
              if (!isAdmin) {
                setIsCompletingProfile(true);
              } else {
                await setDoc(doc(db, "users", user.uid), newProfile);
                setUserProfile(newProfile);
              }
            }
          } catch (err) {
            console.error("Error fetching user profile:", err);
          }
        } else {
          setUserProfile(null);
          setSections([]);
          setSelectedSection(null);
          setStudentViewMatched(null);
          setIsCompletingProfile(false);
        }
        setAuthLoading(false);
      }, (error) => {
        console.error("Auth state change error:", error);
        setAuthLoading(false);
      });
      return unsubscribe;
    } catch (error) {
      console.error("Auth Listener Error:", error);
      setAuthLoading(false);
    }
  }, []);

  const findStudentEnrollments = async (identifiers: { val: string, type: 'email' | 'lrn' }[]): Promise<boolean> => {
    try {
      const sectionsSnap = await getDocs(collection(db, "sections"));
      const matchesMap = new Map<string, { student: Student, section: Section }>();
      
      for (const sectionDoc of sectionsSnap.docs) {
        for (const idObj of identifiers) {
           const studentQuery = query(
             collection(db, `sections/${sectionDoc.id}/students`),
             where(idObj.type, "==", idObj.val)
           );
           const studentSnap = await getDocs(studentQuery);
           studentSnap.forEach(sDoc => {
              const combinedId = `${sectionDoc.id}_${sDoc.id}`;
              if (!matchesMap.has(combinedId)) {
                matchesMap.set(combinedId, {
                  student: { id: sDoc.id, ...sDoc.data() } as Student,
                  section: { id: sectionDoc.id, ...sectionDoc.data() } as Section
                });
              }
           });
        }
      }

      const matches = Array.from(matchesMap.values());

      if (matches.length > 0) {
        // Persist LRN to user profile for security rules affinity if we have a match
        const firstWithLrn = matches.find(m => m.student.lrn) || matches[0];
        if (userProfile && !userProfile.lrn && firstWithLrn.student.lrn) {
          try {
            await updateDoc(doc(db, "users", currentUser!.uid), {
              lrn: firstWithLrn.student.lrn
            });
            setUserProfile({ ...userProfile, lrn: firstWithLrn.student.lrn });
          } catch (err) {
            console.error("Failed to persist LRN:", err);
          }
        }
        
        const sorted = [...matches].sort((a, b) => (b.section.schoolYear || "").localeCompare(a.section.schoolYear || ""));
        setAllStudentEnrollments(sorted);
        setStudentViewMatched(sorted[0]);
        setSelectedSection(sorted[0].section);
        return true;
      }
    } catch (error) {
      console.error("Find Student Error:", error);
    }
    return false;
  };

  // Sections Listener
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    
    let q;
    let unsubscribeSections: () => void;
    let isSubscribed = true;

    if (userProfile.role === 'admin') {
      q = query(collection(db, "sections"));
    } else if (userProfile.role === 'system_admin' || userProfile.role === 'school_head' || userProfile.role === 'guidance_designate') {
      const userEmail = (currentUser.email || "").toLowerCase();
      q = query(
        collection(db, "sections"), 
        or(
          where("schoolId", "==", userProfile.schoolId || ''),
          where("adviserEmail", "==", userEmail)
        )
      );
    }

    if (userProfile.role === 'admin' || userProfile.role === 'system_admin' || userProfile.role === 'school_head' || userProfile.role === 'guidance_designate') {
      unsubscribeSections = onSnapshot(q!, (snapshot) => {
        if (!isSubscribed) return;
        setSections(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Section)));
      }, (err) => {
        handleFirestoreError(err, 'list', 'sections');
      });
    } else if (userProfile.role === 'teacher') {
      const userEmailLower = (currentUser.email || "").toLowerCase();
      // 1. Get all sections for their school to check subjectTeachers dynamically
      const baseQuery = userProfile.schoolId 
        ? query(collection(db, "sections"), where("schoolId", "==", userProfile.schoolId))
        : query(collection(db, "sections"));

      const processSections = async (snapshotDocs: any[]) => {
        try {
          const allSections = snapshotDocs.map(d => ({ id: d.id, ...d.data() } as Section));
          let subDocs: any[] = [];
          
          if (userEmailLower) {
            const subjectsQuery = query(
              collectionGroup(db, 'subjects'),
              where("teacherEmail", "==", userEmailLower)
            );
            const subjectsSnap = await getDocs(subjectsQuery).catch(() => ({ docs: [] }));
            subDocs = subjectsSnap.docs;
          }

          const teacherSections: Section[] = [];

          for (const sec of allSections) {
            let isRelevant = false;
            const teacherSubjectNames = new Set<string>();
            
            // Check custom subjects via collectionGroup
            for (const subjDoc of subDocs) {
              const pathParts = subjDoc.ref.path.split('/');
              const sectionId = pathParts[1];
              if (sectionId === sec.id) {
                isRelevant = true;
                teacherSubjectNames.add((subjDoc.data() as Subject).name);
              }
            }
            
            // Check global subjects via subjectTeachers map
            if (sec.subjectTeachers) {
              for (const [subjId, tEmail] of Object.entries(sec.subjectTeachers)) {
                if (tEmail && typeof tEmail === 'string' && tEmail.toLowerCase() === userEmailLower) {
                  isRelevant = true;
                  const gSubj = globalSubjects.find(g => g.id === subjId);
                  if (gSubj) {
                    teacherSubjectNames.add(gSubj.name);
                  }
                }
              }
            }

            if ((sec.adviserEmail || '').toLowerCase() === userEmailLower) {
              isRelevant = true;
            }

            if (isRelevant) {
               teacherSections.push({
                 ...sec,
                 teacherSubjects: Array.from(teacherSubjectNames)
               });
            }
          }

          if (isSubscribed) {
            setSections(teacherSections);
          }
        } catch (e) {
          console.error("Error processing teacher sections", e);
        }
      };

      const unsubBase = onSnapshot(baseQuery, (snap) => processSections(snap.docs), (err) => {
         handleFirestoreError(err, 'list', 'sections');
      });

      let unsubSubjectsGroup = () => {};
      if (userEmailLower) {
        const subjectsQuery = query(
          collectionGroup(db, 'subjects'),
          where("teacherEmail", "==", userEmailLower)
        );
        unsubSubjectsGroup = onSnapshot(subjectsQuery, async () => {
           const snap = await getDocs(baseQuery);
           processSections(snap.docs);
        }, (err) => {
           handleFirestoreError(err, 'list', 'subjects');
        });
      }

      unsubscribeSections = () => {
        unsubBase();
        unsubSubjectsGroup();
      };

    } else {
      return; // Students don't browse sections
    }

    return () => {
      isSubscribed = false;
      if (unsubscribeSections) unsubscribeSections();
    };
  }, [currentUser, userProfile, globalSubjects]);

  useEffect(() => {
    if (!currentUser || !userProfile?.schoolId) {
      setAralClasses([]);
      return;
    }
    const q = query(
      collection(db, "aral_classes"),
      where("schoolId", "==", userProfile.schoolId)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setAralClasses(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AralClass)));
    }, (err) => {
      console.error("Failed to load aral classes", err);
    });
    return () => unsub();
  }, [currentUser, userProfile?.schoolId]);

  // Students & Subjects Listener for Selected Section
  useEffect(() => {
  if (!selectedSection) {
      setStudents([]);
      if (userProfile?.role === 'admin' || userProfile?.role === 'system_admin' || userProfile?.role === 'teacher') {
        // Fetch all subjects for the school (admin/system_admin) or the teacher (teacher) to show on section cards
        let q;
        if (userProfile.role === 'admin' || userProfile.role === 'system_admin') {
          // Administrators view all subjects across the school
          q = query(collectionGroup(db, 'subjects'));
        } else {
          // Teacher: Fetch subjects where they are the teacher
          q = query(collectionGroup(db, 'subjects'), where("teacherEmail", "==", userProfile.email || ''));
        }
          
        const unsub = onSnapshot(q, (snapshot) => {
          let list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
          if ((userProfile?.role === 'system_admin' || userProfile?.role === 'admin') && userProfile.schoolId) {
            const schoolSectionIds = new Set(sections.map(s => s.id));
            list = list.filter(sub => {
              return (sub.schoolId === userProfile.schoolId) || (sub.sectionId && schoolSectionIds.has(sub.sectionId));
            });
          }
          setSubjects(list);
        }, (err) => {
          console.error("Error fetching all subjects for directory view:", err);
        });
        return () => unsub();
      } else {
        setSubjects([]);
      }
      return;
    }

    const studentsUnsub = onSnapshot(
      collection(db, `sections/${selectedSection.id}/students`),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        setStudents(list);
        
        // Sync studentViewMatched for student portal reactivity
        if (userProfile?.role === 'student' && userProfile.lrn) {
          const me = list.find(s => s.lrn === userProfile.lrn);
          if (me) {
            setStudentViewMatched(prev => prev ? { ...prev, student: me } : null);
          }
        }
      },
      (err) => handleFirestoreError(err, 'list', `sections/${selectedSection.id}/students`)
    );

    const sectionSubjectsUnsub = onSnapshot(
      collection(db, `sections/${selectedSection.id}/subjects`),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
        setSectionSubjects(list);
      },
      (err) => handleFirestoreError(err, 'list', `sections/${selectedSection.id}/subjects`)
    );

    return () => {
      studentsUnsub();
      sectionSubjectsUnsub();
    };
  }, [selectedSection?.id, userProfile?.role, sections]);

  useEffect(() => {
    if (!selectedSection) {
      setSubjects([]);
      return;
    }
    const globalIds = selectedSection.globalSubjectIds || [];
    const secTeachers = selectedSection.subjectTeachers || {};
    const enrolledIds = new Set(students.flatMap(s => s.enrolledSubjectIds || []));
    
    // Map of section subjects by ID for overrides
    const secSubjMap = new Map();
    sectionSubjects.forEach(s => secSubjMap.set(s.id, s));
    
    const list = [
      ...globalSubjects
        .filter(s => 
          Number(s.gradeLevel) === Number(selectedSection.gradeLevel) || 
          globalIds.includes(s.id) ||
          enrolledIds.has(s.id)
        )
        .map(s => {
           const override = secSubjMap.get(s.id);
           if (override) {
             secSubjMap.delete(s.id); // Remove so it's not rendered twice
             return { ...s, ...override, sectionId: selectedSection.id, teacherEmail: secTeachers[s.id] || override.teacherEmail || '' };
           }
           return {
             ...s,
             sectionId: selectedSection.id,
             teacherEmail: secTeachers[s.id] || ''
           };
        }),
      ...Array.from(secSubjMap.values()).map(s => ({
        ...s,
        teacherEmail: secTeachers[s.id] || s.teacherEmail
      }))
    ];
    setSubjects(list as Subject[]);
  }, [selectedSection, globalSubjects, students, sectionSubjects]);

  useEffect(() => {
    if (!selectedSection) return;
    
    // Wait until subjects are loaded for the current selected section
    const subjectsForSection = subjects.filter(s => s.sectionId === selectedSection.id);
    if (subjectsForSection.length === 0) return;

    if (subjects.length > 0) {
        // If a subject was selected (maybe via navigation or persistence), check if it exists in the section's subjects
        // We check against both ID and Name to support direct navigation from section cards
        const matchedSubject = subjects.find(s => 
          (selectedSubjectId && s.id === selectedSubjectId) || 
          (selectedSubjectId && s.name === selectedSubjectId && s.sectionId === selectedSection.id)
        );

        if (!selectedSubjectId || !matchedSubject) {
            const mySubjects = subjectsForSection.filter(s => (s.teacherEmail || '').toLowerCase() === (currentUser?.email || '').toLowerCase());
            if (mySubjects.length > 0 && userProfile?.role === 'teacher') {
                setSelectedSubjectId(mySubjects[0].id);
            } else {
                setSelectedSubjectId(subjectsForSection[0].id);
            }
        } else if (matchedSubject && selectedSubjectId !== matchedSubject.id) {
            // Upgrade name to ID if it matched by name
            setSelectedSubjectId(matchedSubject.id);
        }
    }
  }, [subjects, selectedSubjectId, selectedSection?.id]);

  useEffect(() => {
    if (activeTab !== 'gradebook' && activeTab !== 'summary') return;
    if (!selectedSection || !selectedSubjectId) {
      setCombinedTleStudents([]);
      return;
    }
    
    const isGrade910 = Number(selectedSection.gradeLevel) === 9 || Number(selectedSection.gradeLevel) === 10;
    const matchedSubject = subjects.find(s => s.id === selectedSubjectId || s.name === selectedSubjectId);
    const isTle = matchedSubject?.name?.toLowerCase().includes("tle") || false;
    const activeYear = globalSettings?.activeSchoolYear;

    if (isGrade910 && isTle && activeYear) {
       const qGroup = query(collectionGroup(db, 'students'));
       const unsub = onSnapshot(qGroup, snap => {
         const list = snap.docs.map(d => {
            const data = d.data() as Student;
            const refPath = d.ref.path.split('/');
            const secId = refPath[refPath.length - 3];
            const sec = sections.find(s => s.id === secId);
            return { 
                id: d.id, ...data, sectionId: secId,
                sectionName: sec ? `Grade ${sec.gradeLevel} - ${sec.name}` : data.sectionName 
            };
         }).filter(s => {
            if (!s.enrolledSubjectIds || !s.enrolledSubjectIds.includes(selectedSubjectId)) return false;
            const studentSection = sections.find(sec => sec.id === s.sectionId);
            return studentSection && studentSection.schoolYear === activeYear;
         });
         setCombinedTleStudents(list);
       });
       return () => unsub();
    } else {
       setCombinedTleStudents([]);
    }
  }, [selectedSection?.id, selectedSubjectId, activeTab, subjects, globalSettings?.activeSchoolYear, sections]);

  // Persistence for dropdowns
  useEffect(() => {
    if (currentUser) {
      const savedSectionId = localStorage.getItem(`selectedSectionId_${currentUser.uid}`);
      if (savedSectionId && sections.length > 0) {
        const section = sections.find(s => s.id === savedSectionId);
        if (section) setSelectedSection(section);
      }
      
      const savedTerm = localStorage.getItem(`activeTerm_${currentUser.uid}`);
      if (savedTerm) setActiveTerm(parseInt(savedTerm) as TermNumber);

      const savedSubjectId = localStorage.getItem(`selectedSubjectId_${currentUser.uid}`);
      if (savedSubjectId) setSelectedSubjectId(savedSubjectId);
    }
  }, [currentUser, sections.length]);

  useEffect(() => {
    if (currentUser && selectedSection) {
      localStorage.setItem(`selectedSectionId_${currentUser.uid}`, selectedSection.id);
    }
  }, [selectedSection, currentUser]);

  useEffect(() => {
    if (currentUser && activeTerm) {
      localStorage.setItem(`activeTerm_${currentUser.uid}`, activeTerm.toString());
    }
  }, [activeTerm, currentUser]);

  useEffect(() => {
    if (currentUser && selectedSubjectId) {
      localStorage.setItem(`selectedSubjectId_${currentUser.uid}`, selectedSubjectId);
    }
  }, [selectedSubjectId, currentUser]);

  // Reactivity for the selected section document itself
  useEffect(() => {
    if (!selectedSection?.id) return;
    
    const unsub = onSnapshot(doc(db, "sections", selectedSection.id), (snap) => {
      if (snap.exists()) {
        setSelectedSection({ id: snap.id, ...snap.data() } as Section);
      }
    }, (err) => {
      handleFirestoreError(err, 'get', `sections/${selectedSection.id}`);
    });
    
    return () => unsub();
  }, [selectedSection?.id]);

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      const unsub = onSnapshot(collection(db, 'schools'), (snap) => {
        const expiredIds: string[] = [];
        snap.forEach(d => {
           const school = d.data();
           const now = new Date();
           const fallbackDate = new Date(school.createdAt || now.toISOString());
           fallbackDate.setFullYear(fallbackDate.getFullYear() + 1);
           const expirationDate = school.expiresAt ? new Date(school.expiresAt) : fallbackDate;
           if (expirationDate < now) {
              expiredIds.push(school.schoolId);
           }
        });
        setExpiredSchoolIds(expiredIds);
      }, (err) => console.error("Admin schools snapshot error:", err));
      return () => unsub();
    } else {
      setExpiredSchoolIds([]);
    }
  }, [userProfile?.role]);

  useEffect(() => {
    const isExpired = activeSchool?.expiresAt ? new Date(activeSchool.expiresAt) < new Date() : false;
    if (isExpired && selectedSection !== null && userProfile?.email !== 'jessiemangabo@gmail.com') {
      setSelectedSection(null);
    }
  }, [activeSchool, selectedSection, userProfile]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login Error:", error);
      const isCancelled = 
        error.code === 'auth/popup-closed-by-user' || 
        error.code === 'auth/user-cancelled' || 
        error.code === 'auth/cancelled-popup-request';
      if (isCancelled) {
        setLoginError("Login popup was closed before signing in. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        setLoginError("Pop-up window was blocked by your browser. Please allow popups for this site or use Quick Access / Demo Login below.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setLoginError("This domain is not authorized for Google Sign-In in Firebase. You can use Quick Access / Demo Login below.");
      } else {
        setLoginError(`Authentication failed: ${error.message || 'Please check your connection and try again.'}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = async (demoRole: 'admin' | 'system_admin' | 'school_head' | 'teacher' | 'student') => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      let email = 'jessiemangabo@gmail.com';
      let name = 'Dr. Jessie J. Mangabo (System Admin)';
      let uid = 'demo-root-admin';
      let schoolId = '10101';
      let lrn = '';

      if (demoRole === 'system_admin') {
        email = 'sysadmin@school.edu.ph';
        name = 'System Administrator';
        uid = 'demo-sysadmin';
      } else if (demoRole === 'school_head') {
        email = 'principal@school.edu.ph';
        name = 'Maria Santos, PhD (School Head)';
        uid = 'demo-schoolhead';
      } else if (demoRole === 'teacher') {
        email = 'teacher@school.edu.ph';
        name = 'Juan Dela Cruz (Teacher)';
        uid = 'demo-teacher';
      } else if (demoRole === 'student') {
        email = 'student@school.edu.ph';
        name = 'Mark Reyes (Student)';
        uid = 'demo-student';
        lrn = '123456789012';
      }

      const mockUser: any = {
        uid,
        email,
        displayName: name,
        emailVerified: true,
        isAnonymous: false,
      };

      const mockProfile: UserProfile = {
        uid,
        email,
        displayName: name,
        role: demoRole === 'admin' ? 'admin' : demoRole,
        approvalStatus: 'approved',
        schoolId,
        ...(lrn ? { lrn } : {})
      };

      try {
        await setDoc(doc(db, "users", uid), mockProfile, { merge: true });
      } catch (e) {
        console.warn("Demo user setDoc warning:", e);
      }

      setCurrentUser(mockUser);
      setUserProfile(mockProfile);
      setIsCompletingProfile(false);
    } catch (err: any) {
      console.error("Demo login error:", err);
      setLoginError("Failed to initialize Demo session: " + (err.message || String(err)));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('home_filters');
    if (currentUser) {
      localStorage.removeItem(`selectedSectionId_${currentUser.uid}`);
      localStorage.removeItem(`activeTerm_${currentUser.uid}`);
      localStorage.removeItem(`selectedSubjectId_${currentUser.uid}`);
      localStorage.removeItem(`dailyAttendance_selectedMonth_${currentUser.uid}`);
      localStorage.removeItem(`dailyAttendance_selectedTerm_${currentUser.uid}`);
      localStorage.removeItem(`sf2_selectedMonthKey_${currentUser.uid}`);
    }
    setCurrentUser(null);
    setUserProfile(null);
    setIsCompletingProfile(false);
    try {
      signOut(auth);
    } catch (e) {
      console.warn("SignOut error:", e);
    }
  };

  const handleRenewSubscription = async (yearIndex: number) => {
    if (!activeSchool?.id || !activeSchool?.schoolId) return;
    try {
      const currentExpiration = activeSchool.expiresAt 
        ? new Date(activeSchool.expiresAt)
        : null;

      let newExpiration: Date;
      if (currentExpiration) {
        newExpiration = new Date(currentExpiration);
        newExpiration.setFullYear(currentExpiration.getFullYear() + 1);
      } else {
        const schoolCreatedAt = activeSchool.createdAt || new Date().toISOString();
        const createdDate = new Date(schoolCreatedAt);
        newExpiration = new Date(createdDate);
        newExpiration.setFullYear(createdDate.getFullYear() + yearIndex);
      }
      const newExpiresAt = newExpiration.toISOString();

      const batch = writeBatch(db);

      // 1. Update activeSchool document
      const schoolRef = doc(db, "schools", activeSchool.id);
      batch.update(schoolRef, {
        paidYears: arrayUnion(yearIndex),
        expiresAt: newExpiresAt
      });

      // 3. Commit atomic batch in Firestore
      await batch.commit();
      console.log(`Successfully renewed subscription for Year ${yearIndex} until ${newExpiresAt}`);
    } catch (err) {
      console.error("Error during renewal transaction: ", err);
      handleFirestoreError(err, 'update', 'subscription renewal');
    }
  };

  const handleCreateSection = async (sectionData: any) => {
    if (!currentUser) return;
    try {
      const newSection = {
        ...sectionData,
        createdBy: currentUser.uid,
        adviserEmail: (sectionData.adviserEmail || "").trim().toLowerCase()
      };
      await addDoc(collection(db, "sections"), newSection);
    } catch (error) {
      handleFirestoreError(error, 'create', 'sections');
    }
  };

  const handleUpdateSection = async (id: string, sectionData: any) => {
    const isCriticalUpdate = 'name' in sectionData || 'gradeLevel' in sectionData || 'schoolId' in sectionData || 'schoolYear' in sectionData || 'adviserEmail' in sectionData;
    
    const sec = sections.find(s => s.id === id);
    const adviserEmail = (sec?.adviserEmail || "").trim().toLowerCase();
    const profEmail = (userProfile?.email || "").trim().toLowerCase();
    const isSecAdviser = adviserEmail && adviserEmail === profEmail;
    
    const isOnlyUpdatingSubjectTeachers = Object.keys(sectionData).length === 1 && 'subjectTeachers' in sectionData;

    if (userProfile?.role === 'teacher' && !isSecAdviser && !isOnlyUpdatingSubjectTeachers) {
      alert("Teachers are not authorized to edit section details. Please contact the System Administrator.");
      return;
    }
    if (userProfile?.role === 'teacher' && isSecAdviser && isCriticalUpdate) {
      alert("Section Advisers are not authorized to edit core section metadata. Please contact the System Administrator.");
      return;
    }
    try {
      const updatedData = {
        ...sectionData,
      };
      if (updatedData.adviserEmail !== undefined) {
        updatedData.adviserEmail = (updatedData.adviserEmail || "").trim().toLowerCase();
      }
      await setDoc(doc(db, "sections", id), updatedData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'update', `sections/${id}`);
    }
  };

  const cascadeDeleteSection = async (id: string) => {
    try {
      const batch = writeBatch(db);
      
      const studentsSnap = await getDocs(collection(db, `sections/${id}/students`));
      studentsSnap.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      const subjectsSnap = await getDocs(collection(db, `sections/${id}/subjects`));
      subjectsSnap.forEach(doc => {
        batch.delete(doc.ref);
      });

      batch.delete(doc(db, "sections", id));
      
      await batch.commit();
    } catch (error) {
       handleFirestoreError(error, 'delete', `sections/${id}`);
       throw error;
    }
  };

  const handleDeleteSection = async (id: string, action?: 'approve' | 'disapprove' | 'cancel' | 'request' | 'delete', reason?: string) => {
    const section = sections.find(s => s.id === id);
    if (!section) return;

    if (userProfile?.role === 'teacher') {
      if (action === 'cancel') {
        try {
          await updateDoc(doc(db, "sections", id), {
            deletionStatus: 'none',
            deletionRequestedBy: deleteField(),
            disapprovalReason: deleteField(),
            deletionReason: deleteField()
          });
        } catch (error) {
          handleFirestoreError(error, 'update', `sections/${id}`);
        }
      } else if (action === 'request') {
        try {
          await updateDoc(doc(db, "sections", id), {
            deletionStatus: 'pending',
            deletionRequestedBy: userProfile?.email || "",
            disapprovalReason: deleteField(),
            deletionReason: reason || "No reason provided."
          });
        } catch (error) {
          handleFirestoreError(error, 'update', `sections/${id}`);
        }
      } else if (action === 'delete') {
          try {
             await cascadeDeleteSection(id);
          } catch (error) {
             handleFirestoreError(error, 'delete', `sections/${id}`);
          }
      }
    } else if (userProfile?.role === 'system_admin') {
       if (action === 'delete' || (!action && section?.deletionStatus === 'approved')) {
           try {
              await cascadeDeleteSection(id);
           } catch (error) {
              handleFirestoreError(error, 'delete', `sections/${id}`);
           }
       } else if (action === 'approve') {
           try {
             await updateDoc(doc(db, "sections", id), {
               deletionStatus: 'approved',
               disapprovalReason: deleteField()
             });
           } catch (error) {
             handleFirestoreError(error, 'update', `sections/${id}`);
           }
       } else if (action === 'disapprove') {
           try {
             await updateDoc(doc(db, "sections", id), { 
               deletionStatus: 'rejected',
               disapprovalReason: reason || "No reason provided."
             });
           } catch (error) {
             handleFirestoreError(error, 'update', `sections/${id}`);
           }
       }
    } else if (userProfile?.role === 'admin') {
       if (action === 'delete' || (!action && section?.deletionStatus === 'approved')) {
           await cascadeDeleteSection(id);
       } else if (action === 'request') {
           try {
             await updateDoc(doc(db, "sections", id), {
               deletionStatus: 'pending',
               deletionRequestedBy: userProfile?.email || "",
               disapprovalReason: deleteField(),
               deletionReason: reason || "No reason provided."
             });
           } catch (error) {
             handleFirestoreError(error, 'update', `sections/${id}`);
           }
       }
    }
  };

  const updateStudentGrades = async (studentId: string, updates: any, subjectId: string, term: number) => {
    const targetStudent = combinedTleStudents.find(s => s.id === studentId);
    const secId = targetStudent?.sectionId || selectedSection?.id;
    if (!secId) return;
    try {
      const studentDocRef = doc(db, `sections/${secId}/students`, studentId);
      const studentDoc = await getDoc(studentDocRef);
      if (!studentDoc.exists()) return;
      
      const currentGrades = (studentDoc.data() as Student).grades || {};
      const subjectGrades = currentGrades[subjectId] || {};
      const termGrades = subjectGrades[term] || JSON.parse(JSON.stringify(DEFAULT_TERM_DATA));
      
      const updatedTermGrades = { ...termGrades, ...updates };
      
      await setDoc(studentDocRef, {
        grades: {
          ...currentGrades,
          [subjectId]: {
            ...subjectGrades,
            [term]: updatedTermGrades
          }
        }
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'update', `sections/${secId}/students/${studentId}`);
    }
  };

  const updateSubjectConfig = async (subjectId: string, updates: any) => {
    if (!selectedSection) return;
    try {
      const subject = subjects.find(s => s.id === subjectId);
      const mergedUpdates = { ...updates };
      if (subject) {
        if (subject.teacherEmail) mergedUpdates.teacherEmail = subject.teacherEmail;
        if (subject.name) mergedUpdates.name = subject.name;
        if (subject.schoolId) mergedUpdates.schoolId = subject.schoolId;
        if (subject.sectionId) mergedUpdates.sectionId = subject.sectionId;
      }
      const subjRef = doc(db, `sections/${selectedSection.id}/subjects`, subjectId);
      await setDoc(subjRef, mergedUpdates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, 'update', `sections/${selectedSection.id}/subjects/${subjectId}`);
    }
  };

  const handleBulkUpdate = async (updatedStudents: Student[], subjectId: string, term: number) => {
    const defaultSecId = selectedSection?.id;
    if (!defaultSecId && updatedStudents.length > 0 && !updatedStudents[0].sectionId) return;
    const batch = writeBatch(db);
    try {
      updatedStudents.forEach(s => {
        const targetStudent = combinedTleStudents.find(st => st.id === s.id);
        const secId = targetStudent?.sectionId || s.sectionId || defaultSecId;
        if (secId) {
            batch.set(doc(db, `sections/${secId}/students`, s.id), s, { merge: true });
        }
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, 'write', `sections/bulkUpdate/students`);
    }
  };

  const handleSaveLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection) return;

    // Check for duplicate LRN in current section
    const isDuplicate = students.some(s => s.lrn === learnerForm.lrn && s.id !== editingId);
    if (isDuplicate) {
      alert("A learner with this LRN already exists in this section.");
      return;
    }

    // Auto-generate full name for display convenience
    const nameParts = [
      learnerForm.lastName + (learnerForm.firstName ? "," : ""),
      learnerForm.firstName,
      learnerForm.middleName,
      learnerForm.extension
    ].filter(Boolean);
    const fullName = nameParts.join(" ").trim();
    
    try {
      if (editingId) {
        const oldStudent = students.find(s => s.id === editingId);
        const { bmi, category } = computeBMI(parseFloat(learnerForm.weight) || 0, parseFloat(learnerForm.height) || 0);

        await setDoc(doc(db, `sections/${selectedSection.id}/students`, editingId), {
          ...learnerForm,
          name: fullName,
          age: parseInt(learnerForm.age) || 0,
          weight: parseFloat(learnerForm.weight) || 0,
          height: parseFloat(learnerForm.height) || 0,
          bmi: bmi,
          nutritionalStatus: {
            ...learnerForm.nutritionalStatus,
            bmiCategory: category
          },
          studentNumber: learnerForm.lrn,
        }, { merge: true });

        setEditingId(null);
      } else {
        const { bmi, category } = computeBMI(parseFloat(learnerForm.weight) || 0, parseFloat(learnerForm.height) || 0);

        const newLearner = {
          sectionId: selectedSection.id,
          name: fullName,
          lastName: learnerForm.lastName,
          firstName: learnerForm.firstName,
          middleName: learnerForm.middleName,
          extension: learnerForm.extension,
          lrn: learnerForm.lrn,
          email: learnerForm.email,
          studentNumber: learnerForm.lrn,
          age: parseInt(learnerForm.age) || 0,
          birthdate: learnerForm.birthdate || "",
          birthplace: learnerForm.birthplace || "",
          address: learnerForm.address || "",
          sex: learnerForm.sex,
          fatherName: learnerForm.fatherName || "",
          motherName: learnerForm.motherName || "",
          guardianName: learnerForm.guardianName || "",
          guardianRelationship: learnerForm.guardianRelationship || "",
          primaryContact: learnerForm.primaryContact || "guardian",
          contactNumber: learnerForm.contactNumber || "",
          weight: parseFloat(learnerForm.weight) || 0,
          height: parseFloat(learnerForm.height) || 0,
          bmi: bmi,
          nutritionalStatus: {
            bmiCategory: category
          },
          dateOfFirstAttendance: learnerForm.dateOfFirstAttendance || "",
          isTransferredIn: learnerForm.isTransferredIn || false,
          attendance: learnerForm.attendance || {},
          eligibility: learnerForm.eligibility || {},
          photo: learnerForm.photo || "",
          grades: {},
          enrolledSubjectIds: learnerForm.enrolledSubjectIds || [],
          gradeLevel: selectedSection.gradeLevel || "",
          sectionName: selectedSection.name || "",
          siblingIds: learnerForm.siblingIds || []
        };
        const docRef = await addDoc(collection(db, `sections/${selectedSection.id}/students`), newLearner);
        const newStudentId = docRef.id;

        // Bidirectional update for new student
        try {
          const sibs = learnerForm.siblingIds || [];
          for (const sId of sibs) {
            const snaps = await Promise.all(sections.map(sec => getDoc(doc(db, `sections/${sec.id}/students`, sId))));
            const snap = snaps.find(s => s.exists());
            if (snap) {
              const sRef = snap.ref;
              const sibList = snap.data().siblingIds || [];
              if (!sibList.includes(newStudentId)) {
                await updateDoc(sRef, { siblingIds: [...sibList, newStudentId] });
              }
            }
          }
        } catch (e) {
          console.error("Error creating manual bidirectional links for new student:", e);
        }
      }
      setLearnerForm({ 
        lastName: "", firstName: "", middleName: "", extension: "", name: "", 
        lrn: "", email: "", photo: "", age: "", birthdate: "", sex: "Male", weight: "", height: "", attendance: {}, 
        birthplace: "", address: "", fatherName: "", motherName: "", guardianName: "", guardianRelationship: "", primaryContact: "guardian", contactNumber: "",
        nutritionalStatus: {}, isTransferredIn: false, siblingIds: [], enrolledSubjectIds: [], eligibility: { type: 'Elementary School Completer' } as Eligibility 
      });
    } catch (error) {
      handleFirestoreError(error, 'write', `sections/${selectedSection.id}/students`);
    }
  };

  const handleEnrollAllLearners = async () => {
    if (!selectedSection) return;
    if (unenrolledStudents.length === 0) {
      setEnrollAllErrorMsg("No pending learners to enroll.");
      return;
    }
    setEnrollAllModalOpen(true);
  };

  const handleToggleSF9Download = async (studentId: string, value: boolean) => {
    if (!selectedSection) return;
    try {
      await updateDoc(doc(db, `sections/${selectedSection.id}/students`, studentId), {
        sf9CardUnlocked: value
      });
    } catch (error) {
      handleFirestoreError(error, 'write', `sections/${selectedSection.id}/students/${studentId}`);
    }
  };

  const handleToggleStudentStatus = async (studentId: string, status: 'Active' | 'Transferred Out' | 'Dropped Out' | 'Retained' | 'Promoted') => {
    if (!selectedSection) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (status === 'Active') {
      try {
        const updateData: any = { 
          status: status,
          dropoutDate: deleteField(),
          dropoutReason: deleteField()
        };
        await updateDoc(doc(db, `sections/${selectedSection.id}/students`, studentId), updateData);
      } catch (error) {
        handleFirestoreError(error, 'write', `sections/${selectedSection.id}/students/${studentId}`);
      }
    } else {
      // Trigger modal
      setStatusChangeDate(new Date().toISOString().split('T')[0]);
      setStatusChangeReason("");
      setStatusChangeTarget({ student, newStatus: status });
    }
  };

  const confirmStatusChange = async () => {
    if (!selectedSection || !statusChangeTarget) return;
    const { student, newStatus } = statusChangeTarget;
    try {
      const updateData: any = { 
        status: newStatus,
        dropoutDate: statusChangeDate || new Date().toISOString().split('T')[0]
      };
      if (statusChangeReason.trim()) {
        updateData.dropoutReason = statusChangeReason.trim();
      } else {
        updateData.dropoutReason = deleteField();
      }
      await updateDoc(doc(db, `sections/${selectedSection.id}/students`, student.id), updateData);
      setStatusChangeTarget(null);
    } catch (error) {
      handleFirestoreError(error, 'write', `sections/${selectedSection.id}/students/${student.id}`);
    }
  };

  const handleCalculateYearEnd = () => {
    if (!selectedSection) return;
    setConfirmFinalizeSection(true);
  };

  const executeFinalizeSection = async () => {
    if (!selectedSection) return;
    setConfirmFinalizeSection(false);
    try {
      const activeStudents = students.filter(s => s.status === 'Active' || !s.status);
      const updatePromises = activeStudents.map(student => {
         let totalWeightedFinals = 0;
         let totalUnits = 0;
         editableSubjects.forEach(subj => {
             const termsPassed = (subj.offeredTerms || [1,2,3,4]).map(t => calculateGrade(student, subj, t as TermNumber).final).filter(f => f > 0);
             if (termsPassed.length > 0) {
                 const finalRating = Math.round(termsPassed.reduce((a,b)=>a+b, 0) / termsPassed.length);
                 const u = (subj.unit !== undefined && subj.unit !== null && subj.unit > 0) ? subj.unit : 1.0;
                 totalWeightedFinals += finalRating * u;
                 totalUnits += u;
             }
         });
         
         let finalStatus = 'Retained';
         if (totalUnits > 0) {
             const genAvg = Math.round(totalWeightedFinals / totalUnits);
             finalStatus = genAvg >= 75 ? 'Promoted' : 'Retained';
         }
         return updateDoc(doc(db, `sections/${selectedSection.id}/students`, student.id), {
             status: finalStatus
         });
      });
      await Promise.all(updatePromises);
      await updateDoc(doc(db, 'sections', selectedSection.id), { isFinalized: true });
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, 'write', `sections/${selectedSection.id}/students`);
    }
  };

  const handleShowFinancialStatement = () => {
    setShowAdminPTA(true);
  };

  const handleUnfinalizeYearEnd = async () => {
    if (!selectedSection) return;
    setConfirmYearEndUnfinalize(true);
  };

  const executeUnfinalizeYearEnd = async () => {
    if (!selectedSection) return;
    setConfirmYearEndUnfinalize(false);
    try {
      if (userProfile?.role === 'system_admin' || userProfile?.email === 'jessiemangabo@gmail.com') {
        const finalizedStudents = students.filter(s => s.status === 'Promoted' || s.status === 'Retained');
        const updatePromises = finalizedStudents.map(student => {
           return updateDoc(doc(db, `sections/${selectedSection.id}/students`, student.id), {
               status: 'Active'
           });
        });
        await Promise.all(updatePromises);
        await updateDoc(doc(db, 'sections', selectedSection.id), { isFinalized: false });
        alert("Section successfully unfinalized.");
      } else {
        const docRef = doc(db, 'settings', 'general');
        await updateDoc(docRef, {
          unfinalizeRequests: arrayUnion({
            schoolYear: selectedSection.schoolYear || 'active',
            sectionId: selectedSection.id,
            sectionName: selectedSection.name,
            requestedBy: userProfile?.email,
            timestamp: new Date().toISOString()
          })
        });
        alert("Unfinalize Section request sent successfully. A System Admin will review your request.");
      }
    } catch (error) {
      console.error(error);
      const isTeacher = !(userProfile?.role === 'system_admin' || userProfile?.email === 'jessiemangabo@gmail.com');
      handleFirestoreError(error, 'write', isTeacher ? 'settings/general' : `sections/${selectedSection.id}`);
    }
  };

  const handleToggleFinalizeSubjectTerm = async (subjectId: string, term: TermNumber, finalize: boolean) => {
    if (!selectedSection) return;
    
    try {
      const subjectDocRef = doc(db, `sections/${selectedSection.id}/subjects`, subjectId);
      const subjectDoc = await getDoc(subjectDocRef);
      if (!subjectDoc.exists()) return;
      
      const currentFinalized = (subjectDoc.data() as Subject).finalizedTerms || [];
      let updatedFinalized: TermNumber[] = [];
      if (finalize) {
        if (!currentFinalized.includes(term)) {
          updatedFinalized = [...currentFinalized, term];
        } else {
          updatedFinalized = currentFinalized;
        }
      } else {
        updatedFinalized = currentFinalized.filter(t => t !== term);
      }
      
      await updateDoc(subjectDocRef, {
        finalizedTerms: updatedFinalized
      });
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, 'write', `sections/${selectedSection.id}/subjects/${subjectId}`);
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingId(student.id);
    
    let parsedLastName = student.lastName || "";
    let parsedFirstName = student.firstName || "";
    if (!parsedLastName && !parsedFirstName && student.name) {
      if (student.name.includes(",")) {
        const parts = student.name.split(",");
        parsedLastName = parts[0].trim();
        parsedFirstName = parts.slice(1).join(",").trim();
      } else {
        parsedLastName = student.name.trim();
      }
    }

    setLearnerForm({
      lastName: parsedLastName,
      firstName: parsedFirstName,
      middleName: student.middleName || "",
      extension: student.extension || "",
      name: formatStudentName(student),
      lrn: student.lrn || "",
      email: student.email || "",
      photo: student.photo || "",
      age: student.age?.toString() || "",
      birthdate: student.birthdate || "",
      sex: student.sex || "Male",
      weight: student.weight?.toString() || "",
      height: student.height?.toString() || "",
      birthplace: student.birthplace || "",
      address: student.address || "",
      fatherName: student.fatherName || "",
      motherName: student.motherName || "",
      guardianName: student.guardianName || "",
      guardianRelationship: student.guardianRelationship || "",
      primaryContact: student.primaryContact || "guardian",
      contactNumber: student.contactNumber || "",
      dateOfFirstAttendance: student.dateOfFirstAttendance || "",
      attendance: student.attendance || {},
      nutritionalStatus: student.nutritionalStatus || {},
      isTransferredIn: student.isTransferredIn || false,
      siblingIds: student.siblingIds || [],
      enrolledSubjectIds: student.enrolledSubjectIds || [],
      eligibility: student.eligibility || { type: 'Elementary School Completer' } as Eligibility
    });
  };

  const handleMarkAllPresent = async (studentId: string, monthKey: string) => {
    if (!selectedSection) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const monthName = monthKey.includes('_') ? monthKey.split('_')[0] : monthKey;
    const calendarData = sectionSchoolCalendar.find(c => `${c.month}_${c.term || '1'}` === monthKey || c.month === monthKey);
    const year = parseInt(calendarData?.year || new Date().getFullYear().toString());

    // Get term coverage
    const openingDate = parseInt(calendarData?.openingDate || '1');
    const closingDate = parseInt(calendarData?.closingDate || '31');
    const daysInMonth = new Date(year, (MONTH_INDICES[monthName] || 0) + 1, 0).getDate();
    const hasManualCoverage = openingDate !== 1 || (closingDate !== 31 && closingDate !== daysInMonth);

    // Collect school days for the month
    const schoolDays: number[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, MONTH_INDICES[monthName], day);
        const dayOfWeek = date.getDay();
        const dateStr = `${(MONTH_INDICES[monthName] + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isLocalHoliday = calendarData?.localHolidays?.includes(day);
        const isHoliday = ['01-01', '04-09', '05-01', '06-12', '08-21', '08-25', '11-01', '11-30', '12-25', '12-30'].includes(dateStr) || isLocalHoliday;
        if (!isWeekend && !isHoliday) {
            schoolDays.push(day);
        }
    }

    let targetDays: number[] = [];
    if (hasManualCoverage) {
        targetDays = schoolDays.filter(day => day >= openingDate && day <= closingDate);
    } else {
        // Dynamic split fallback
        const allEntriesForMonth = sectionSchoolCalendar.filter(c => c.month === monthName)
            .sort((a, b) => (parseInt(a.term) || 1) - (parseInt(b.term) || 1));
        
        const currentTerm = parseInt(calendarData?.term || '1');
        let startIndex = 0;
        for (const entry of allEntriesForMonth) {
            if ((parseInt(entry.term) || 1) < currentTerm) {
                startIndex += parseInt(entry.days) || 0;
            } else {
                break;
            }
        }
        const daysToTake = parseInt(calendarData?.days) || schoolDays.length;
        targetDays = schoolDays.slice(startIndex, startIndex + daysToTake);
    }

    // Filter by FOA and Dropout Date
    if (student.dateOfFirstAttendance) {
      const [fYear, fMonth, fDay] = student.dateOfFirstAttendance.split('-').map(Number);
      const currentMonthIdx = MONTH_INDICES[monthName];
      targetDays = targetDays.filter(day => {
        if (year < fYear) return false;
        if (year === fYear) {
          if (currentMonthIdx < (fMonth - 1)) return false;
          if (currentMonthIdx === (fMonth - 1) && day < fDay) return false;
        }
        return true;
      });
    }

    if ((student.status === 'Dropped Out' || student.status === 'Transferred Out') && student.dropoutDate) {
      const [dYear, dMonth, dDay] = student.dropoutDate.split('-').map(Number);
      const currentMonthIdx = MONTH_INDICES[monthName];
      targetDays = targetDays.filter(day => {
        if (year > dYear) return false;
        if (year === dYear) {
          if (currentMonthIdx > (dMonth - 1)) return false;
          if (currentMonthIdx === (dMonth - 1) && day >= dDay) return false;
        }
        return true;
      });
    }

    const dailyAttendance = {
      ...(student.dailyAttendance || {}),
      [monthKey]: {
        ...(student.dailyAttendance?.[monthKey] || {})
      }
    };

    targetDays.forEach(day => {
        dailyAttendance[monthKey][day] = true;
    });

    // Calculate monthly present count
    const monthDaily = dailyAttendance[monthKey];
    let presentCount = 0;
    Object.values(monthDaily).forEach(val => { if (val) presentCount++; });

    const attendance = {
      ...(student.attendance || {}),
      [monthKey]: {
        present: presentCount,
        absent: Math.max(0, (calendarData?.days || 0) - presentCount)
      }
    };

    try {
      await setDoc(doc(db, `sections/${selectedSection.id}/students`, studentId), {
        dailyAttendance,
        attendance
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'update', `sections/${selectedSection.id}/students/${studentId}`);
    }
  };

  const handleUpdateDailyAttendance = async (studentId: string, monthKey: string, day: number, present: boolean) => {
    if (!selectedSection) return;
    
    // Find the student
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const dailyAttendance = {
      ...(student.dailyAttendance || {}),
      [monthKey]: {
        ...(student.dailyAttendance?.[monthKey] || {}),
        [day]: present
      }
    };

    // Calculate monthly present count
    const monthDaily = dailyAttendance[monthKey];
    let presentCount = 0;
    Object.values(monthDaily).forEach(val => { if (val) presentCount++; });

    const calendarForMonth = sectionSchoolCalendar.find(c => `${c.month}_${c.term || '1'}` === monthKey || c.month === monthKey)?.days || 0;
    const absentCount = Math.max(0, calendarForMonth - presentCount);

    const attendance = {
      ...(student.attendance || {}),
      [monthKey]: {
        present: presentCount,
        absent: absentCount
      }
    };

    try {
      await setDoc(doc(db, `sections/${selectedSection.id}/students`, studentId), {
        dailyAttendance,
        attendance
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'update', `sections/${selectedSection.id}/students/${studentId}`);
    }
  };

  const handleUpdateObservedValue = async (studentId: string, term: number, statementId: string, value: RatedValue) => {
    if (!selectedSection) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const observedValues = {
      ...(student.observedValues || {}),
      [term]: {
        ...(student.observedValues?.[term] || {}),
        [statementId]: value
      }
    };

    try {
      await setDoc(doc(db, `sections/${selectedSection.id}/students`, studentId), {
        observedValues
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'update', `sections/${selectedSection.id}/students/${studentId}`);
    }
  };

  const handleUpdateAttendance = (month: string, field: 'present' | 'absent', value: number) => {
    setLearnerForm(prev => {
      const calendarForMonth = schoolCalendar.find(c => c.month === month)?.days || 0;
      const newPresent = field === 'present' ? value : (prev.attendance?.[month]?.present || 0);
      
      // Auto-calculate absent based on school days
      const newAbsent = calendarForMonth - newPresent;

      return {
        ...prev,
        attendance: {
          ...prev.attendance,
          [month]: {
            present: newPresent,
            absent: Math.max(0, newAbsent)
          }
        }
      };
    });
  };

  const handleTogglePublishGrades = async (studentId: string, term: number, val: boolean) => {
    if (!selectedSection) return;
    try {
      const updates: any = { 
        [`publishGrades.${term}`]: val,
        [`parentSignatureEnabled.${term}`]: val
      };
      await updateDoc(doc(db, `sections/${selectedSection.id}/students`, studentId), updates);
    } catch (e) {
      handleFirestoreError(e, 'update', `sections/${selectedSection.id}/students/${studentId}`);
    }
  };

  const handleToggleParentSignature = async (studentId: string, term: number, val: boolean) => {
    if (!selectedSection) return;
    try {
      await updateDoc(doc(db, `sections/${selectedSection.id}/students`, studentId), { [`parentSignatureEnabled.${term}`]: val });
    } catch (e) {
      handleFirestoreError(e, 'update', `sections/${selectedSection.id}/students/${studentId}`);
    }
  };

  const handleDeleteLearner = async (studentId: string) => {
    if (!selectedSection) return;
    try {
      await deleteDoc(doc(db, `sections/${selectedSection.id}/students`, studentId));
    } catch (error) {
      handleFirestoreError(error, 'delete', `sections/${selectedSection.id}/students/${studentId}`);
    }
  };

  const handleDeleteManyLearners = async (studentIds: string[]) => {
    if (!selectedSection) return;
    const batch = writeBatch(db);
    try {
      studentIds.forEach(id => {
        batch.delete(doc(db, `sections/${selectedSection.id}/students`, id));
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, 'delete', `sections/${selectedSection.id}/students`);
    }
  };

  const handleBulkEnroll = async (studentsList: any[]) => {
    if (!selectedSection) return;

    // Check for duplicates
    const existingLrns = new Set(students.map(s => s.lrn).filter(Boolean));
    const uniqueNewStudents = studentsList.filter(learner => {
      if (!learner.lrn) return true; // Allow if no LRN (though template says it has)
      return !existingLrns.has(learner.lrn);
    });

    if (uniqueNewStudents.length === 0) {
      alert("All learners in the list already exist in this section (based on LRN).");
      return;
    }

    if (uniqueNewStudents.length < studentsList.length) {
      alert(`${studentsList.length - uniqueNewStudents.length} learners were skipped because their LRN already exists in this section.`);
    }
    
    // Firestore batches have a 500 operation limit
    const CHUNK_SIZE = 450;
    
    const processBatch = async (chunk: any[]) => {
      const batch = writeBatch(db);
      chunk.forEach(learner => {
        const docRef = doc(collection(db, `sections/${selectedSection.id}/students`));
        batch.set(docRef, {
          sectionId: selectedSection.id,
          name: learner.name,
          lastName: learner.lastName || "",
          firstName: learner.firstName || "",
          middleName: learner.middleName || "",
          extension: learner.extension || "",
          studentNumber: learner.lrn || Date.now().toString(),
          lrn: learner.lrn,
          email: learner.email || "",
          age: parseInt(learner.age) || 0,
          birthdate: learner.birthdate || "",
          sex: learner.sex,
          weight: learner.weight || 0,
          height: learner.height || 0,
          bmi: learner.bmi || 0,
          nutritionalStatus: learner.nutritionalStatus || {},
          dateOfFirstAttendance: learner.dateOfFirstAttendance || "",
          isTransferredIn: learner.isTransferredIn || false,
          birthplace: learner.birthplace || "",
          address: learner.address || "",
          primaryContact: learner.primaryContact || "father",
          fatherName: learner.fatherName || "",
          motherName: learner.motherName || "",
          guardianName: learner.guardianName || "",
          guardianRelationship: learner.guardianRelationship || "",
          contactNumber: learner.contactNumber || "",
          eligibility: learner.eligibility || {},
          grades: {},
          enrolledSubjectIds: subjects.filter(s => {
            const isTle = isTleSubject(s.name);
            const isJHS = Number(selectedSection?.gradeLevel) === 9 || Number(selectedSection?.gradeLevel) === 10;
            if (isJHS && isTle) return false;
            return true;
          }).map(s => s.id),
          gradeLevel: learner.gradeLevel || selectedSection.gradeLevel || "",
          sectionName: learner.section || selectedSection.name || ""
        });
      });
      await batch.commit();
    };

    try {
      for (let i = 0; i < uniqueNewStudents.length; i += CHUNK_SIZE) {
        const chunk = uniqueNewStudents.slice(i, i + CHUNK_SIZE);
        await processBatch(chunk);
      }
    } catch (error) {
      handleFirestoreError(error, 'write', `sections/${selectedSection.id}/students`);
    }
  };

  const sectionSchoolCalendar = useMemo(() => {
    if (!selectedSection?.schoolYear) return schoolCalendar;
    return schoolCalendar.filter(c => c.schoolYear === selectedSection.schoolYear);
  }, [schoolCalendar, selectedSection?.schoolYear]);

  const studentPortalSchoolCalendar = useMemo(() => {
    if (!studentViewMatched?.section?.schoolYear) return schoolCalendar;
    return schoolCalendar.filter(c => c.schoolYear === studentViewMatched.section.schoolYear);
  }, [schoolCalendar, studentViewMatched?.section?.schoolYear]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.status !== 'Dropped Out' && s.status !== 'Transferred Out' &&
      s.enrolledSubjectIds && s.enrolledSubjectIds.length > 0 &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       s.lrn?.includes(searchTerm))
    );
  }, [students, searchTerm]);

  const enrolledStudents = useMemo(() => {
    return students.filter(s => s.status !== 'Dropped Out' && s.status !== 'Transferred Out' && s.enrolledSubjectIds && s.enrolledSubjectIds.length > 0);
  }, [students]);

  const unenrolledStudents = useMemo(() => {
    return students.filter(s => 
      s.status !== 'Dropped Out' && s.status !== 'Transferred Out' &&
      (!s.enrolledSubjectIds || s.enrolledSubjectIds.length === 0)
    );
  }, [students]);

        const globalScannerModal = (
    <>
      {/* Render Global Scanner if open */}
        <AnimatePresence>
          {showGlobalScanner && (
            <div className={`fixed inset-0 z-[150] ${isScannerFullScreen ? 'p-0 bg-white' : 'p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center'}`}>
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
                  isScannerFullScreen 
                    ? 'w-screen h-screen rounded-none border-0' 
                    : 'rounded-2xl sm:rounded-3xl w-full max-w-[95vw] lg:max-w-6xl xl:max-w-7xl h-auto max-h-[98vh] animate-in zoom-in-95'
                }`}
              >
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <QrCode size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 tracking-tight text-sm sm:text-base">Scan ID Card</h3>
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Attendance & Learner Validity (Full Screen Window)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsScannerFullScreen(!isScannerFullScreen)}
                      className="p-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 text-xs font-extrabold shadow-xs cursor-pointer"
                      title={isScannerFullScreen ? "Exit Fullscreen Window" : "Expand to Fullscreen"}
                    >
                      {isScannerFullScreen ? (
                        <>
                          <Minimize2 size={16} className="text-slate-700" />
                          <span className="hidden sm:inline">Exit Fullscreen</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 size={16} className="text-slate-700" />
                          <span className="hidden sm:inline">Full Screen</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        setShowGlobalScanner(false);
                        setGlobalRecentScan(null);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Close Scanner"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* View Mode Tab Switcher */}
                <div className="px-5 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setScannerViewMode('scanner')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${scannerViewMode === 'scanner' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'}`}
                  >
                    <span>📷 Camera Scanner & Verify</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScannerViewMode('all_logs')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${scannerViewMode === 'all_logs' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'}`}
                  >
                    <span>📋 All Scanned QR IDs ({scanLogs.length})</span>
                  </button>
                </div>

                {scannerViewMode === 'all_logs' ? (
                  <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-black">
                          {scanLogs.length}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">All Scanned QR IDs & Attendance Logs</h4>
                          <p className="text-xs text-slate-500">Real-time scan logs across all sections and students</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text"
                          placeholder="Search student name, LRN, or section..."
                          value={allLogsSearchQuery}
                          onChange={(e) => setAllLogsSearchQuery(e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm text-black placeholder:text-slate-400 w-full sm:w-64"
                        />
                        {scanLogs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to clear all scan logs?")) {
                                handleClearScanLogs();
                              }
                            }}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-extrabold transition-colors cursor-pointer border border-rose-200 shrink-0"
                          >
                            Clear All Logs
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex-1">
                      {scanLogs.filter(log => {
                        if (!allLogsSearchQuery) return true;
                        const q = allLogsSearchQuery.toLowerCase();
                        return (
                          log.studentName?.toLowerCase().includes(q) ||
                          log.lrn?.toLowerCase().includes(q) ||
                          log.sectionName?.toLowerCase().includes(q) ||
                          log.scanDate?.toLowerCase().includes(q)
                        );
                      }).length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-3">
                            <QrCode size={24} />
                          </div>
                          <p className="text-sm font-bold text-slate-700">No scan logs found</p>
                          <p className="text-xs text-slate-400 mt-1">Scan student ID QR codes or type an LRN to start recording attendance.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                <th className="p-3.5">Student / LRN</th>
                                <th className="p-3.5">Section</th>
                                <th className="p-3.5">Scan Type</th>
                                <th className="p-3.5">Date & Time</th>
                                <th className="p-3.5">Scanned By</th>
                                <th className="p-3.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                              {scanLogs.filter(log => {
                                if (!allLogsSearchQuery) return true;
                                const q = allLogsSearchQuery.toLowerCase();
                                return (
                                  log.studentName?.toLowerCase().includes(q) ||
                                  log.lrn?.toLowerCase().includes(q) ||
                                  log.sectionName?.toLowerCase().includes(q) ||
                                  log.scanDate?.toLowerCase().includes(q)
                                );
                              }).map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="p-3.5">
                                    <p className="font-extrabold text-slate-900">{log.studentName}</p>
                                    <p className="text-[11px] text-slate-500 font-mono">LRN: {log.lrn}</p>
                                  </td>
                                  <td className="p-3.5">
                                    <p className="font-bold uppercase text-slate-800">
                                      {Number(log.gradeLevel) === 0 ? `Kindergarten • ${log.sectionName}` : `Grade ${log.gradeLevel} • ${log.sectionName}`}
                                    </p>
                                    <p className="text-[10px] text-slate-400">SY: {log.schoolYear}</p>
                                  </td>
                                  <td className="p-3.5">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      log.scanType === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {log.scanType || 'IN'}
                                    </span>
                                  </td>
                                  <td className="p-3.5">
                                    <p className="font-bold text-slate-800">{log.scanDate}</p>
                                    <p className="text-[10px] text-slate-500">{log.scanTime}</p>
                                  </td>
                                  <td className="p-3.5 text-slate-500 text-[11px]">
                                    {log.scannedBy || 'ID Scanner'}
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteScanLog(log.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Log"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 overflow-y-auto lg:overflow-hidden">
                  {/* Left Part: Scanner Controls & Camera */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-start border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-8">
                    {/* Camera Selection */}
                    <div className="flex justify-center gap-2 w-full max-w-sm sm:max-w-md mx-auto mb-4">
                      <button
                        type="button"
                        onClick={() => setGlobalScannerFacingMode('environment')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${globalScannerFacingMode === 'environment' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        <Camera size={14} />
                        <span>Back Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGlobalScannerFacingMode('user')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${globalScannerFacingMode === 'user' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        <User size={14} />
                        <span>Front Camera</span>
                      </button>
                    </div>

                    {/* Scanner Camera Frame */}
                    <div className="w-full max-w-sm sm:max-w-md aspect-square rounded-2xl overflow-hidden bg-black shadow-inner border-4 border-slate-100 relative shrink-0 mx-auto">
                      <Scanner
                        onScan={handleGlobalScannerScan}
                        onError={handleGlobalScannerError}
                        constraints={globalScannerConstraints}
                        components={globalScannerComponents}
                        allowMultiple={true}
                        scanDelay={2500}
                      />

                      {globalScannerError && (
                        <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-10 animate-in fade-in duration-200">
                          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-2">
                            <AlertTriangle size={24} />
                          </div>
                          <p className="text-sm font-bold text-white mb-1">Camera Access Issue</p>
                          <p className="text-xs text-slate-300 leading-normal max-w-[280px] mb-3">{globalScannerError}</p>
                          <div className="bg-white/10 p-3 rounded-lg text-[10px] text-slate-300 text-left max-w-sm border border-white/5 space-y-1">
                            <p className="font-bold text-indigo-300">💡 Troubleshooting Guide:</p>
                            <p>1. Check if another application is using your camera.</p>
                            <p>2. Click the camera or lock icon in your browser's address bar, choose <b>"Allow"</b>, and refresh.</p>
                            <p>3. If you're on mobile, verify camera permissions are enabled in system settings.</p>
                            <p className="pt-1 border-t border-white/10 text-indigo-200 font-semibold"><b>Backup Option:</b> Use the <b>Manual Entry</b> section below!</p>
                          </div>
                        </div>
                      )}

                      {/* Scanner overlay corners */}
                      <div className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-white/70 rounded-tl-xl"></div>
                      <div className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-white/70 rounded-tr-xl"></div>
                      <div className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-white/70 rounded-bl-xl"></div>
                      <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-white/70 rounded-br-xl"></div>
                    </div>

                    {/* Manual Entry Fallback Panel */}
                    <div className="w-full max-w-sm sm:max-w-md mx-auto mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                          <Users size={14} />
                        </span>
                        <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                          Manual Keyboard & Barcode Entry
                        </h5>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-3 leading-normal">
                        Type a student LRN or scan with a hardware barcode scanner to verify status and record attendance automatically.
                      </p>
                      
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Type Student LRN..."
                          value={globalManualLrnInput}
                          onChange={(e) => setGlobalManualLrnInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (globalManualLrnInput.trim()) {
                                handleGlobalScan(globalManualLrnInput.trim());
                                setGlobalManualLrnInput('');
                              }
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm text-black placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (globalManualLrnInput.trim()) {
                              handleGlobalScan(globalManualLrnInput.trim());
                              setGlobalManualLrnInput('');
                            }
                          }}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-wider rounded-xl cursor-pointer transition-colors shadow-sm"
                        >
                          Submit
                        </button>
                      </div>

                      <div className="relative mt-2">
                        <select
                          value=""
                          onChange={(e) => {
                            const lrn = e.target.value;
                            if (lrn) {
                              handleGlobalScan(lrn);
                            }
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-sm appearance-none"
                          style={{
                            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center',
                            backgroundSize: '14px',
                            paddingRight: '30px'
                          }}
                        >
                          <option value="">-- Or Select Student from Enrolled List --</option>
                          {enrolledStudents.map(s => (
                            <option key={s.id} value={s.lrn}>
                              {formatStudentName(s)} ({s.lrn})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right Part: Learner Info and Validity check */}
                  <div className="lg:col-span-7 w-full flex flex-col justify-start pl-0 lg:pl-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Scan Status & Learner Info</h4>
                    {globalRecentScan ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Scan Status Banner */}
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${globalRecentScan.status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                          {globalRecentScan.status === 'success' ? (
                            <CheckCircle size={24} className="text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle size={24} className="text-rose-600 shrink-0" />
                          )}
                          <span className="text-xs font-bold leading-relaxed">{globalRecentScan.message}</span>
                        </div>

                        {/* Learner Info Card (scanning validity of the learner information) */}
                        {globalRecentScan.student && (
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm text-left">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/40 rounded-full blur-2xl pointer-events-none"></div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start relative z-10 text-center sm:text-left">
                              {/* Student Profile Picture or Placeholder */}
                              {globalRecentScan.student.photo ? (
                                <img
                                  src={globalRecentScan.student.photo}
                                  alt={formatStudentName(globalRecentScan.student)}
                                  className="w-32 h-32 rounded-3xl object-cover border border-slate-200 shadow-sm"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className={`w-32 h-32 rounded-3xl flex items-center justify-center font-black text-5xl text-white shadow-sm ${globalRecentScan.student.sex === 'Female' ? 'bg-rose-500 shadow-rose-100' : 'bg-indigo-500 shadow-indigo-100'}`}>
                                  {formatStudentName(globalRecentScan.student).charAt(0)}
                                </div>
                              )}

                              <div className="space-y-1.5 min-w-0 flex-1">
                                {/* Status Badge */}
                                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                                  {globalRecentScan.scanType && (
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                      globalRecentScan.scanType === 'IN' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-amber-600 text-white shadow-xs'
                                    }`}>
                                      LOGGED TIME {globalRecentScan.scanType}
                                    </span>
                                  )}
                                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                    globalRecentScan.student.status === 'Dropped Out' 
                                      ? 'bg-orange-50 border-orange-200 text-orange-600'
                                      : globalRecentScan.student.status === 'Transferred Out'
                                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                  }`}>
                                    {globalRecentScan.student.status || 'Active / Enrolled'}
                                  </span>
                                  {globalRecentScan.student.sex && (
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                      globalRecentScan.student.sex === 'Female' ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-blue-50 border-blue-200 text-blue-600'
                                    }`}>
                                      {globalRecentScan.student.sex}
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-base font-black text-slate-800 tracking-tight truncate">
                                  {formatStudentName(globalRecentScan.student)}
                                </h4>
                                
                                <p className="text-xs font-bold text-slate-500">
                                  LRN: <span className="text-slate-800 font-mono font-bold">{globalRecentScan.student.lrn}</span>
                                </p>
                              </div>
                            </div>

                            {/* Secondary Fields Grid */}
                            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200/60 text-xs relative z-10">
                              <div>
                                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Grade & Section</p>
                                <p className="text-slate-700 font-bold uppercase mt-1">
                                  {(() => {
                                    const activeSec = globalRecentScan?.section || selectedSection;
                                    if (!activeSec) return 'Unknown Section';
                                    return (Number(activeSec.gradeLevel) === 0) ? `Kindergarten • ${activeSec.name}` : `Grade ${activeSec.gradeLevel} • ${activeSec.name}`;
                                  })()}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Contact Number</p>
                                <p className="text-slate-700 font-bold mt-1">{globalRecentScan.student.contactNumber || 'No registered contact'}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">First Attendance</p>
                                <p className="text-slate-700 font-bold mt-1">{globalRecentScan.student.dateOfFirstAttendance || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Guardian Name</p>
                                <p className="text-slate-700 font-bold mt-1 truncate">{globalRecentScan.student.guardianName || 'None'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center h-full min-h-[280px]">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3 animate-pulse">
                          <QrCode size={28} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-700">Waiting for scan...</p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Position Student ID QR inside the camera view
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </>
  );


  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <BookOpen size={48} className="text-indigo-500 animate-pulse" />
          <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">Syncing System...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} isLoading={isLoggingIn} loginError={loginError} onDemoLogin={handleDemoLogin} />;
  }

  if (isCompletingProfile) {
    return <RoleSelectionView user={currentUser} onComplete={(profile) => {
       setUserProfile(profile);
       setIsCompletingProfile(false);
    }} />;
  }

  const isExpired = activeSchool?.expiresAt ? new Date(activeSchool.expiresAt) < new Date() : false;

  if (userProfile && (userProfile.approvalStatus !== 'approved') && userProfile.email !== 'jessiemangabo@gmail.com') {
    return <PendingApprovalView 
      onLogout={handleLogout} 
      isExpired={false} 
      isRejected={userProfile.approvalStatus === 'rejected'}
      noAdminFound={noApprovedAdminFound}
      userRole={userProfile.role} 
    />;
  }

  if (userProfile?.role === 'student') {
    if (studentViewMatched) {
       return <StudentPortal 
         onOpenThemeModal={() => setIsThemeModalOpen(true)}
         student={studentViewMatched.student} 
         section={studentViewMatched.section}
         subjects={subjects}
         onLogout={handleLogout}
         schoolCalendar={studentPortalSchoolCalendar}
         allEnrollments={allStudentEnrollments}
         onSwitchEnrollment={(e) => {
           setStudentViewMatched(e);
           setSelectedSection(e.section);
         }}
         onShowFeedback={() => setShowFeedbackModal(true)}
         isFeedbackOpen={showFeedbackModal}
         onCloseFeedback={() => setShowFeedbackModal(false)}
         user={userProfile}
         currentUser={currentUser}
         sections={sections}
         students={students}
       />;
    } else {
       return <StudentLinkingView userProfile={userProfile} onLinked={(id, type) => { findStudentEnrollments([{ val: id, type }]); }} onLogout={handleLogout} />;
    }
  }

  if (showAdminUsers && (userProfile?.role === 'admin' || userProfile?.role === 'system_admin' || isAnySectionAdviser)) {
    return <AdminUsersView 
      onBack={() => setShowAdminUsers(false)} 
      currentUser={userProfile!} 
      isAnySectionAdviser={isAnySectionAdviser}
      schoolCalendar={schoolCalendar}
      globalSettings={globalSettings}
      onShowFeedback={() => setShowFeedbackModal(true)}
      isFeedbackOpen={showFeedbackModal}
      onCloseFeedback={() => setShowFeedbackModal(false)}
      sections={sections}
    />;
  }

  if (showAdminSF4 && (userProfile?.role === 'system_admin' || userProfile?.role === 'school_head')) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAdminSF4(false)}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                <FileText className="text-amber-600" size={24} />
                School Form 4 (SF4)
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Monthly Learner Movement and Attendance Report</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <SF4ReportView 
             schoolId={userProfile.schoolId || ""}
             calendar={schoolCalendar}
             globalSettings={globalSettings}
          />
        </div>
      </div>
    );
  }

  if (showAdminSF7 && (userProfile?.role === 'system_admin' || userProfile?.role === 'admin')) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAdminSF7(false)}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                <FileText className="text-indigo-600" size={24} />
                School Form 7 (SF7)
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">School Staff Assignment and List of Personnel</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto animate-fade-in">
          <SF7ReportView 
             schoolId={userProfile?.schoolId || ""}
             activeSchoolYear={globalSettings?.activeSchoolYear || "2026-2027"}
             userProfile={userProfile}
          />
        </div>
      </div>
    );
  }

  if (showAdminPTA && (userProfile?.role === 'system_admin' || userProfile?.role === 'school_head' || isAuthorizedCashier)) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAdminPTA(false)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CreditCard className="text-emerald-600" size={20} />
                School Financial Statement
              </h1>
              <p className="text-xs font-bold text-slate-500">PTA Fees & Contributions (School Year Wide)</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <PTAFeesManagementView
            currentUser={currentUser}
            userProfile={userProfile}
            selectedSection={null}
            sections={sections}
            initialTab={ptaInitialTab}
          />
        </div>
      </div>
    );
  }

  if (showAdminStudentList && (userProfile?.role === 'admin' || userProfile?.role === 'system_admin')) {
    return <AdminStudentListView 
      onBack={() => setShowAdminStudentList(false)}
      sections={sections}
      onNavigateToSection={(sectionId) => {
        const sec = sections.find(s => s.id === sectionId);
        if (sec) {
          setSelectedSection(sec);
          setShowAdminStudentList(false);
          setActiveTab(userProfile?.role === 'school_head' ? 'sf8' : userProfile?.role === 'guidance_designate' ? 'anecdotes' : 'dashboard');
        }
      }}
      onViewAnecdotals={async (studentLrn, sectionId) => {
        const sec = sections.find(s => s.id === sectionId);
        if (sec) {
          setSelectedSection(sec);
          setShowAdminStudentList(false);
          setActiveTab('anecdotes');
          
          try {
            const tempSnap = await getDocs(collection(db, 'sections', sectionId, 'students'));
            const foundStudent = tempSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)).find(s => s.lrn === studentLrn);
            if (foundStudent) {
              setPreselectedStudentForAnecdotal(foundStudent);
            }
          } catch (e) {
            console.error("Failed to preload target student:", e);
          }
        }
      }}
    />;
  }

  if (showAdminSchools && (userProfile?.role === 'admin' || userProfile?.role === 'system_admin')) {
    return <AdminSchoolsView 
      onBack={() => setShowAdminSchools(false)} 
      currentUser={userProfile} 
      globalSettings={globalSettings}
      onShowFeedback={() => setShowFeedbackModal(true)}
      isFeedbackOpen={showFeedbackModal}
      onCloseFeedback={() => setShowFeedbackModal(false)}
      sections={sections}
    />;
  }

  if (showAdminSchoolYear && (userProfile?.role === 'admin')) {
    return <AdminSchoolYearView 
      onBack={() => setShowAdminSchoolYear(false)} 
      currentUser={userProfile} 
      onShowFeedback={() => setShowFeedbackModal(true)}
      isFeedbackOpen={showFeedbackModal}
      onCloseFeedback={() => setShowFeedbackModal(false)}
    />;
  }

  if (showAdminSchoolCalendar && (userProfile?.role === 'admin')) {
    return <AdminSchoolCalendarView 
      onBack={() => setShowAdminSchoolCalendar(false)} 
      onShowFeedback={() => setShowFeedbackModal(true)}
      isFeedbackOpen={showFeedbackModal}
      onCloseFeedback={() => setShowFeedbackModal(false)}
    />;
  }

  if (showAdminFeedback && userProfile?.role === 'admin') {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAdminFeedback(false)}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic uppercase">
                <Sparkles className="text-indigo-600" size={24} />
                Beta Feedback Center
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Summary & Insights for Administrators</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <AdminFeedbackDashboard />
        </div>
      </div>
    );
  }

  const handleAddSubjectGlobal = async (s: Omit<Subject, 'id'>) => {
    if (s.gradeLevel === undefined || s.gradeLevel === null) {
      alert("Target Grade Level is missing.");
      return;
    }
    const grade = parseInt(String(s.gradeLevel));
    if (isNaN(grade) || grade < 0 || grade > 12) {
      alert("Subjects in the Global Subjects Directory can only be added for Kindergarten (0) to Grade 12.");
      return;
    }
    
    // Clean undefined fields to prevent Firestore errors
    const cleanS = { ...s } as any;
    Object.keys(cleanS).forEach(key => {
      if (cleanS[key] === undefined) {
        delete cleanS[key];
      }
    });
    
    try {
      const docRef = await addDoc(collection(db, `global_subjects`), {
        ...cleanS,
        teacherEmail: s.teacherEmail ? s.teacherEmail.trim().toLowerCase() : ""
      });

      if (grade >= 0 && grade <= 10) {
        const relevantSections = sections.filter(sec => parseInt(String(sec.gradeLevel)) === grade);
        for (const sec of relevantSections) {
          await addDoc(collection(db, `sections/${sec.id}/subjects`), {
            ...cleanS,
            sectionId: sec.id,
            schoolId: sec.schoolId || userProfile?.schoolId || "",
            teacherEmail: s.teacherEmail ? s.teacherEmail.trim().toLowerCase() : ""
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, 'create', `global_subjects`);
    }
  };

  const handleEditSubjectGlobal = async (id: string, s: Omit<Subject, 'id'>) => {
    try {
      const updateData: any = {
        group: s.group,
        name: s.name,
        gradeLevel: s.gradeLevel,
        subjectType: s.subjectType,
        wwWeight: s.wwWeight,
        ptWeight: s.ptWeight,
        taWeight: s.taWeight,
        offeredTerms: s.offeredTerms || [1],
        unit: s.unit !== undefined ? s.unit : null,
      };
      if (s.order !== undefined) {
        updateData.order = s.order;
      }
      if (s.teacherEmail) {
        updateData.teacherEmail = s.teacherEmail.trim().toLowerCase();
      }
      await updateDoc(doc(db, `global_subjects`, id), updateData);
    } catch (error) {
      handleFirestoreError(error, 'update', `global_subjects`);
    }
  };

  const handleDeleteSubjectGlobal = async (id: string) => {
    try {
      await deleteDoc(doc(db, `global_subjects`, id));
    } catch (error) {
      handleFirestoreError(error, 'delete', `global_subjects`);
    }
  };

  if (!selectedSection) {


  if (activeTab === 'subjects') {
      return (
        <div className="flex-1 bg-slate-50 min-h-screen">
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-[50] shadow-sm">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={24} className="text-indigo-600" />
              Global Subjects Directory
            </h1>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold px-4 py-2 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
            >
              Back to Dashboard
            </button>
          </div>
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
               <div className="bg-amber-50 text-amber-800 px-5 py-4 rounded-xl mb-6 text-sm font-medium border border-amber-200/50 flex flex-col gap-1">
                 <p className="font-bold">Global Curriculum View</p>
                 <p className="opacity-90">You are viewing the global subject curriculum for all grade levels. Changes made here will affect the available subjects for student enrollment across the curriculum.</p>
               </div>
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <SubjectsView 
                    subjects={globalSubjects}
                    onAddSubject={handleAddSubjectGlobal}
                    onEditSubject={handleEditSubjectGlobal}
                    onDeleteSubject={handleDeleteSubjectGlobal}
                    selectedSection={null}
                    currentUser={userProfile}
                    globalSettings={globalSettings}
                    allSections={sections}
                 />
               </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'tle-dashboard') {
      return (
        <TleDashboardView 
          sections={sections}
          subjects={subjects}
          currentUser={userProfile}
          onBack={() => setActiveTab('dashboard')}
        />
      );
    }

    if (activeTab === 'aral') {
      return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
          <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-50">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-[#002060] rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                  <GraduationCap className="text-indigo-600" size={24} />
                  ARAL Program Module
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Academic Remediation and Achievement Learning</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold px-4 py-2 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer"
            >
              Back to Sections
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="max-w-[1600px] mx-auto">
               <AralProgram 
                 enrolledStudents={enrolledStudents}
                 selectedSection={null}
                 sections={sections}
                 userProfile={userProfile}
                 globalSettings={globalSettings}
                 aralSchoolInfo={aralSchoolInfo}
                 onUpdateAralSchool={handleUpdateAralSchool}
                 aralCompetencies={aralCompetencies}
                 onAddAralCompetency={handleAddAralCompetency}
                 onDeleteAralCompetency={handleDeleteAralCompetency}
                 aralClasses={aralClasses}
                 onCreateAralClass={handleCreateAralClass}
                 onUpdateAralClass={handleUpdateAralClass}
                 onDeleteAralClass={handleDeleteAralClass}
                 selectedAralClassId={selectedAralClassId}
                 onSelectAralClassId={setSelectedAralClassId}
               />
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <SectionsView onOpenThemeModal={() => setIsThemeModalOpen(true)} onCreateAralClass={handleCreateAralClass} onUpdateAralClass={handleUpdateAralClass} onDeleteAralClass={handleDeleteAralClass} aralClasses={aralClasses} 
          selectedAralClassId={selectedAralClassId}
          onSelectAralClassId={setSelectedAralClassId}
          onScanID={openGlobalScanner}
          sections={sections} 
          expiredSchoolIds={expiredSchoolIds}
          globalSettings={globalSettings}
          onSelect={(s) => {
             setSelectedSection(s);
             setActiveTab(userProfile?.role === 'school_head' ? 'sf8' : userProfile?.role === 'guidance_designate' ? 'anecdotes' : 'dashboard');
          }} 
          onSelectSubject={setSelectedSubjectId}
          onSetActiveTab={setActiveTab}
          onNavigateToSubject={(section, subjName) => {
             setSelectedSection(section);
             setActiveTab('gradebook');
             let subjectObj = subjects.find(s => s.name === subjName && s.sectionId === section.id);
             if (!subjectObj) {
                subjectObj = subjects.find(s => getTleDisplayName(s.name) === subjName && s.sectionId === section.id);
             }
             setSelectedSubjectId(subjectObj ? subjectObj.id : subjName);
          }}
          subjects={subjects}
          globalSubjects={globalSubjects}
          onCreate={handleCreateSection}
          onUpdate={handleUpdateSection}
          onDelete={handleDeleteSection}
          user={userProfile}
          onUpdateUser={setUserProfile}
          onLogout={handleLogout}
          onManageUsers={() => setShowAdminUsers(true)}
          onManageStudentList={() => setShowAdminStudentList(true)}
          onShowFinancialStatement={() => {
            setShowAdminPTA(true);
          }}
          onShowSF4={() => setShowAdminSF4(true)}
          onShowSF7={() => setShowAdminSF7(true)}
          pendingUsersCount={pendingUsersCount}
          isAnySectionAdviser={isAnySectionAdviser}
          onManageSchools={() => setShowAdminSchools(true)}
          onManageSchoolYears={() => setShowAdminSchoolYear(true)}
          onManageCalendar={() => setShowAdminSchoolCalendar(true)}
          onShowFeedback={() => setShowFeedbackModal(true)}
          isFeedbackOpen={showFeedbackModal}
          onCloseFeedback={() => setShowFeedbackModal(false)}
          onShowFeedbackDashboard={() => setShowAdminFeedback(true)}
          schoolCalendar={schoolCalendar}
          onToggleFinalizeSubjectTerm={handleToggleFinalizeSubjectTerm}
          activeSchool={activeSchool}
          teacherCount={teacherCount}
          onRenew={handleRenewSubscription}
          aralSchoolInfo={aralSchoolInfo}
          onUpdateAralSchool={handleUpdateAralSchool}
          aralCompetencies={aralCompetencies}
          onAddAralCompetency={handleAddAralCompetency}
          onDeleteAralCompetency={handleDeleteAralCompetency}
          mapUserRoleToAralRole={mapUserRoleToAralRole}
        />

        {globalScannerModal}

        <ThemeCustomizerModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          settings={systemThemeSettings}
          onUpdateSettings={handleUpdateThemeSettings}
          onResetSettings={() => handleUpdateThemeSettings(DEFAULT_THEME_SETTINGS)}
        />
      </>
    );
  }

  const handleAddSubject = async (s: Omit<Subject, 'id'>) => {
    if (!selectedSection) return;
    const adviserEmail = (selectedSection.adviserEmail || "").trim().toLowerCase();
    const authEmail = (currentUser?.email || "").trim().toLowerCase();
    const profEmail = (userProfile?.email || "").trim().toLowerCase();
    const isSectionAdviser = adviserEmail && (adviserEmail === authEmail || adviserEmail === profEmail);
    const isAdmin = userProfile?.role === 'system_admin' || userProfile?.role === 'admin';

    if (!isAdmin && !isSectionAdviser) {
      alert("Only Administrators and Section Advisers can modify subjects for this section.");
      return;
    }
    
    // Clean undefined fields to prevent Firestore errors
    const cleanS = { ...s } as any;
    Object.keys(cleanS).forEach(key => {
      if (cleanS[key] === undefined) {
        delete cleanS[key];
      }
    });

    try {
      await addDoc(collection(db, `sections/${selectedSection.id}/subjects`), {
        ...cleanS,
        sectionId: selectedSection.id,
        schoolId: selectedSection.schoolId || userProfile?.schoolId || "",
        teacherEmail: s.teacherEmail ? s.teacherEmail.trim().toLowerCase() : ""
      });
    } catch (error) {
      handleFirestoreError(error, 'create', `sections/${selectedSection.id}/subjects`);
    }
  };

  const handleEditSubject = async (id: string, s: Omit<Subject, 'id'>) => {
    if (!selectedSection) return;
    const adviserEmail = (selectedSection.adviserEmail || "").trim().toLowerCase();
    const authEmail = (currentUser?.email || "").trim().toLowerCase();
    const profEmail = (userProfile?.email || "").trim().toLowerCase();
    const isSectionAdviser = adviserEmail && (adviserEmail === authEmail || adviserEmail === profEmail);
    const isAdmin = userProfile?.role === 'system_admin' || userProfile?.role === 'admin';

    // Allow the assigned Subject Teacher to edit weights and details of their own subject
    const existingSubject = subjects.find(sub => sub.id === id);
    const existingTeacher = existingSubject?.teacherEmail || selectedSection.subjectTeachers?.[id] || "";
    const isAssignedTeacher = existingTeacher && (existingTeacher.trim().toLowerCase() === authEmail || existingTeacher.trim().toLowerCase() === profEmail);

    if (!isAdmin && !isSectionAdviser && !isAssignedTeacher) {
      alert("Only Administrators, Section Advisers, and the assigned Subject Teacher can modify subjects for this section.");
      return;
    }
    
    // Clean undefined fields to prevent Firestore errors
    const cleanS = { ...s } as any;
    Object.keys(cleanS).forEach(key => {
      if (cleanS[key] === undefined) {
        delete cleanS[key];
      }
    });

    try {
      await setDoc(doc(db, `sections/${selectedSection.id}/subjects`, id), {
        ...cleanS,
        schoolId: selectedSection.schoolId || userProfile?.schoolId || "",
        teacherEmail: s.teacherEmail ? s.teacherEmail.trim().toLowerCase() : ""
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'update', `sections/${selectedSection.id}/subjects/${id}`);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!selectedSection) return;
    const adviserEmail = (selectedSection.adviserEmail || "").trim().toLowerCase();
    const authEmail = (currentUser?.email || "").trim().toLowerCase();
    const profEmail = (userProfile?.email || "").trim().toLowerCase();
    const isSectionAdviser = adviserEmail && (adviserEmail === authEmail || adviserEmail === profEmail);
    const isAdmin = userProfile?.role === 'system_admin' || userProfile?.role === 'admin';

    if (!isAdmin && !isSectionAdviser) {
      alert("Only Administrators and Section Advisers can modify subjects for this section.");
      return;
    }
    try {
      await deleteDoc(doc(db, `sections/${selectedSection.id}/subjects`, id));
      
      // If this subject is part of the global subjects chosen for this section, remove it
      if (selectedSection.globalSubjectIds?.includes(id)) {
        await updateDoc(doc(db, "sections", selectedSection.id), {
          globalSubjectIds: selectedSection.globalSubjectIds.filter(gid => gid !== id)
        });
      }
    } catch (error) {
      handleFirestoreError(error, 'delete', `sections/${selectedSection.id}/subjects/${id}`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {!globalSettings?.activeSchoolYear && <EncodingClosedBanner />}
      <DeadlineBanner globalSettings={globalSettings} />
      <header className="sticky top-0 z-[100] h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 xl:px-8 shrink-0 shadow-sm">
        {/* Left Side: Back button, Logo, & Interactive Quick Section Switcher */}
        <div className="flex items-center gap-2 sm:gap-4 xl:gap-6 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 border-r border-slate-100 pr-2 sm:pr-4 shrink-0">
            <button 
              onClick={() => setSelectedSection(null)}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all group border border-transparent hover:border-slate-100"
              title="Back to Sections"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex flex-col">
              <h1 className="font-black text-base sm:text-lg md:text-xl tracking-tighter leading-none text-indigo-600 uppercase italic">
                CLASS
              </h1>
              <span className="text-[7px] sm:text-[8px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-0.5 hidden xs:inline">Enterprise Portal</span>
            </div>
          </div>

          {/* Quick Section Switcher Dropdown (Responsive for Mobile, Tablet, and Wide Screen) */}
          {selectedSection && (
            <div className="relative z-[110]">
              <button
                onClick={() => setIsSectionSwitcherOpen(!isSectionSwitcherOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/60 rounded-xl text-xs font-bold text-indigo-900 transition-all cursor-pointer shadow-2xs max-w-[140px] sm:max-w-[200px] md:max-w-[260px] truncate ${isSectionSwitcherOpen ? 'ring-2 ring-indigo-400/40 bg-indigo-100' : ''}`}
                title="Click to switch section"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></div>
                <div className="flex flex-col items-start truncate min-w-0">
                  <span className="text-[11px] sm:text-xs font-black tracking-tight truncate w-full text-indigo-950">
                    {selectedSection.name}
                  </span>
                  <span className="text-[9px] font-semibold text-indigo-600/80 uppercase tracking-wider hidden sm:block truncate w-full">
                    {(Number(selectedSection.gradeLevel) === 0) ? "Kindergarten" : `Grade ${selectedSection.gradeLevel}`} • {selectedSection.schoolYear}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-indigo-500 shrink-0 transition-transform duration-200 ml-auto ${isSectionSwitcherOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSectionSwitcherOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSectionSwitcherOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 shadow-xl rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Quick Switch Section</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {sections.filter(s => !globalSettings?.activeSchoolYear || s.schoolYear === globalSettings.activeSchoolYear).length} Sections
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                      {sections
                        .filter(s => !globalSettings?.activeSchoolYear || s.schoolYear === globalSettings.activeSchoolYear)
                        .map(sec => {
                          const isCurrent = sec.id === selectedSection.id;
                          return (
                            <button
                              key={sec.id}
                              onClick={() => {
                                setSelectedSection(sec);
                                setIsSectionSwitcherOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs ${
                                isCurrent 
                                  ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                                  : 'hover:bg-slate-50 text-slate-700 font-medium'
                              }`}
                            >
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="font-bold truncate">{sec.name}</span>
                                <span className={`text-[10px] ${isCurrent ? 'text-indigo-100' : 'text-slate-400'}`}>
                                  {(Number(sec.gradeLevel) === 0) ? "Kindergarten" : `Grade ${sec.gradeLevel}`} • Adviser: {sec.adviserName || 'Unassigned'}
                                </span>
                              </div>
                              {isCurrent && <Check size={14} className="shrink-0" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Desktop Navigation (xl:flex) */}
          <nav className="hidden xl:flex items-center gap-1 shrink-0 ml-2">
            {(() => {
              const allTabs = [
                { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: <LayoutDashboard size={14} /> },
                { id: 'enroll', label: 'Learner', shortLabel: 'Learner', icon: <UserPlus size={14} /> },
                { id: 'subjects', label: 'Subjects', shortLabel: 'Subjects', icon: <BookOpen size={14} /> },
                { id: 'gradebook', label: 'eClass Records', shortLabel: 'eClass Records', icon: <TableIcon size={14} /> },
                { id: 'summary', label: 'Grading Sheet', shortLabel: 'Grading Sheet', icon: <ClipboardCheck size={14} /> },
                { id: 'transfers', label: 'Transfer Facility', shortLabel: 'Transfers', icon: <Share2 size={14} /> },
                { id: 'pta', label: 'PTA Fees', shortLabel: 'PTA Fees', icon: <CreditCard size={14} /> },
                { id: 'sf2', label: 'School Form 2', shortLabel: 'SF2 Report', icon: <FileText size={14} /> },
                { id: 'sf10', label: 'Learners Records', shortLabel: 'SF10 Record', icon: <HistoryIcon size={14} /> },
                { id: 'attendance', label: 'Daily Attendance', shortLabel: 'Attendance', icon: <Calendar size={14} /> },
                { id: 'observed-values', label: 'Teacher Comments/Remarks', shortLabel: 'Remarks', icon: <Heart size={14} /> },
                { id: 'anecdotes', label: 'Anecdotal Records', shortLabel: 'Anecdotes', icon: <MessageSquare size={14} /> },
                { id: 'sf8', label: 'School Form 8', shortLabel: 'SF8 Health', icon: <Activity size={14} /> },
                { id: 'sf4', label: 'School Form 4', shortLabel: 'SF4 Report', icon: <FileText size={14} /> },
                { id: 'sf7', label: 'School Form 7', shortLabel: 'SF7 Profile', icon: <FileText size={14} /> },
                { id: 'guide', label: 'Guide', shortLabel: 'Guide', icon: <HelpCircle size={14} /> },
                { id: 'sys-docs', label: 'System Documentation', shortLabel: 'Docs', icon: <Terminal size={14} /> },
                ...(currentUser?.email === 'jessiemangabo@gmail.com' ? [
                  { id: 'logs', label: 'VIEW LOGS & UNKNOWNS', shortLabel: 'Logs', icon: <Terminal size={14} /> },
                  { id: 'logs-clear', label: 'CLEAR UNKNOWN ONLY', shortLabel: 'Clear', icon: <Trash2 size={14} /> }
                ] : [])
              ];

              const allowedTabs = allTabs.filter(tab => {
                if (tab.id === 'subjects' && userProfile?.role !== 'system_admin' && userProfile?.role !== 'admin' && !isSectionAdviser) return false;
                if (tab.id === 'logs' || tab.id === 'logs-clear') return currentUser?.email === 'jessiemangabo@gmail.com';
                if (tab.id === 'summary' && !isSectionAdviser) return false;
                if (tab.id === 'pta' && !(userProfile?.role === 'teacher' && isSectionAdviser)) return false;
                if (tab.id === 'gradebook' && (!editableSubjects || editableSubjects.length === 0) && !isSectionAdviser) return false;
                if ((tab.id === 'attendance' || tab.id === 'sf2') && !hasCalendarMatch) return false;
                if (tab.id === 'sf4' && userProfile?.role !== 'system_admin' && userProfile?.role !== 'school_head' && !isAuthorizedCashier) return false;
                if (tab.id === 'sf7' && userProfile?.role !== 'system_admin' && userProfile?.role !== 'admin') return false;

                if (userProfile?.role === 'system_admin' || userProfile?.role === 'admin' || isAuthorizedCashier) {
                  const allowedTabsList = [
                    'dashboard', 'enroll', 'subjects', 'pta', 'sf8', 'guide', 'sys-docs', 'gradebook', 'summary', 'attendance', 'observed-values', 'sf2', 'transfers', 'sf10', 'sf4', 'sf7', 'anecdotes', 'logs', 'logs-clear', 'aral'
                  ];
                  if (userProfile?.role === 'system_admin') {
                    return allowedTabsList.filter(id => {
                      if (id === 'summary' && !isSectionAdviser) return false;
                      if (id === 'gradebook' && !isSectionAdviser && (!editableSubjects || editableSubjects.length === 0)) return false;
                      return true;
                    }).includes(tab.id);
                  }
                  if (isAuthorizedCashier) return allowedTabsList.includes(tab.id);
                  return allowedTabsList.filter(id => id !== 'sf4').includes(tab.id);
                }
                if (userProfile?.role === 'school_head') {
                   return ['sf8', 'sf4', 'sf10', 'anecdotes', 'aral'].includes(tab.id);
                }
                if (userProfile?.role === 'guidance_designate') {
                   return ['anecdotes', 'aral'].includes(tab.id);
                }
                if (userProfile?.role === 'teacher') {
                  if (isSectionAdviser) {
                    return ['dashboard', 'enroll', 'subjects', 'pta', 'sf8', 'sf10', 'attendance', 'observed-values', 'sf2', 'transfers', 'anecdotes', 'guide', 'gradebook', 'summary', 'aral'].includes(tab.id);
                  }
                  return tab.id === 'gradebook' || tab.id === 'dashboard' || tab.id === 'anecdotes' || tab.id === 'pta' || tab.id === 'aral';
                }
                return true;
              });

              const renderButton = (tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setOpenDropdown(null);
                    setIsSettingsDropdownOpen(false);
                  }}
                  className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all relative ${
                    activeTab === tab.id 
                      ? 'text-indigo-600 bg-indigo-50/50 font-extrabold' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon}
                  <span className="uppercase tracking-wide">{tab.label}</span>
                  {activeTab === tab.id && <motion.div layoutId="minimal-nav-active" className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
              );

              const mgmtTabs = allowedTabs.filter(t => ['enroll', 'transfers', 'sf8', 'pta'].includes(t.id));
              const attTabs = allowedTabs.filter(t => ['attendance', 'sf2', 'observed-values', 'anecdotes'].includes(t.id));
              const academicTabs = allowedTabs.filter(t => ['subjects', 'gradebook', 'summary', 'sf10', 'sf4', 'sf7'].includes(t.id));
              const supportTabsGroup = allowedTabs.filter(t => ['guide', 'sys-docs'].includes(t.id));

              const renderDropdown = (id: string, label: string, icon: React.ReactNode, tabs: any[]) => {
                if (tabs.length === 0) return null;
                const isOpen = openDropdown === id;
                const setIsOpen = (val: boolean) => setOpenDropdown(val ? id : null);
                
                return (
                  <div className="relative z-50">
                    <button 
                      onClick={() => {
                        setIsOpen(!isOpen);
                        setIsSettingsDropdownOpen(false);
                      }}
                      className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all relative ${
                      tabs.some(t => t.id === activeTab) 
                        ? 'text-indigo-600 bg-indigo-50/50' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}>
                      {icon}
                      <span className="uppercase tracking-wide">{label}</span>
                      <ChevronDown size={14} className={`opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      {tabs.some(t => t.id === activeTab) && <motion.div layoutId="minimal-nav-active" className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-indigo-600" />}
                    </button>
                    {isOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute block top-full pt-4 left-0 w-56 z-50">
                          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex flex-col gap-1">
                          {tabs.map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id as any);
                                setIsOpen(false);
                              }}
                              className={`flex shrink-0 items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all text-left ${
                                activeTab === tab.id 
                                  ? 'text-indigo-600 bg-indigo-50/70 font-extrabold' 
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {tab.icon}
                                <span className="uppercase tracking-wider">{tab.label}</span>
                              </div>
                              {activeTab === tab.id && <ChevronRight size={14} className="text-indigo-600" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                    )}
                  </div>
                );
              };

              return (
                <>
                  {allowedTabs.find(t => t.id === 'dashboard') && renderButton(allowedTabs.find(t => t.id === 'dashboard'))}
                  
                  {renderDropdown('student-mgmt', 'Student Management', <Users size={14} />, mgmtTabs)}
                  {renderDropdown('attendance', 'Attendance & Behavior', <Calendar size={14} />, attTabs)}

                  {renderDropdown('academic', 'Academic Records', <BookOpen size={14} />, academicTabs)}
                  {renderDropdown('support', 'Support', <HelpCircle size={14} />, supportTabsGroup)}

                  {/* Settings Menu Submenu */}
                  {(userProfile?.role === 'admin' || userProfile?.role === 'system_admin') && (
                    <div className="relative z-50 ml-2 border-l border-slate-100 pl-2">
                      <button 
                        onClick={() => {
                          setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
                          setOpenDropdown(null);
                        }}
                        className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all relative ${
                        isSettingsDropdownOpen 
                          ? 'text-indigo-600 bg-indigo-50/50' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}>
                        <Settings size={14} />
                        <span className="uppercase tracking-wide">Settings Menu</span>
                        <ChevronDown size={14} className={`opacity-50 transition-transform ${isSettingsDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isSettingsDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsSettingsDropdownOpen(false)} />
                          <div className="absolute block top-full pt-4 left-0 w-56 z-50">
                            <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex flex-col gap-1">
                               <button
                                  onClick={() => { setShowAdminUsers(true); setIsSettingsDropdownOpen(false); }}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-50 w-full text-left cursor-pointer"
                               >
                                  <Users size={14} /> <span className="uppercase tracking-wider">Manage Users</span>
                               </button>
                               <button
                                  onClick={() => { 
                                    openGlobalScanner(); 
                                    setIsSettingsDropdownOpen(false); 
                                  }}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-indigo-50 hover:text-indigo-700 border-b border-slate-50 w-full text-left cursor-pointer"
                               >
                                  <QrCode size={14} /> <span className="uppercase tracking-wider">Scan ID</span>
                               </button>
                               {userProfile?.role === 'system_admin' && (
                                 <button
                                    onClick={() => { setActiveTab('subjects'); setIsSettingsDropdownOpen(false); }}
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-50 w-full text-left"
                                 >
                                    <BookOpen size={14} /> <span className="uppercase tracking-wider">Subject Menu</span>
                                 </button>
                               )}
                               <button
                                  onClick={() => { setShowAdminSchools(true); setIsSettingsDropdownOpen(false); }}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-50 w-full text-left"
                               >
                                  <Building size={14} /> <span className="uppercase tracking-wider">Manage School</span>
                               </button>
                               <button
                                  onClick={() => { setShowAdminSchoolYear(true); setIsSettingsDropdownOpen(false); }}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-50 w-full text-left"
                               >
                                  <Calendar size={14} /> <span className="uppercase tracking-wider">School Year</span>
                               </button>
                               <button
                                  onClick={() => { setShowAdminSchoolCalendar(true); setIsSettingsDropdownOpen(false); }}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-50 w-full text-left"
                               >
                                  <Calendar size={14} /> <span className="uppercase tracking-wider">School Calendar</span>
                               </button>
                               <button
                                  onClick={() => { setShowAdminFeedback(true); setIsSettingsDropdownOpen(false); }}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 w-full text-left"
                               >
                                  <Sparkles size={14} /> <span className="uppercase tracking-wider">Feedback Dashboard</span>
                               </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </nav>
        </div>

        {/* Right Side Header Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile & Tablet Section Menu Trigger Button (xl:hidden) */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="xl:hidden flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Open Section Menu"
          >
            <Menu size={16} />
            <span className="hidden sm:inline uppercase tracking-wider text-[11px]">Section Menu</span>
          </button>
        </div>
      </header>

      {/* Responsive Horizontal Quick Bar (Mobile & Tablet - xl:hidden) */}
      <div className="xl:hidden h-14 bg-white border-b border-slate-200/80 flex items-center justify-start px-3 shrink-0 shadow-2xs overflow-x-auto custom-scrollbar gap-2 snap-x">
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="px-3 py-1.5 shrink-0 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95 cursor-pointer snap-start"
          title="All Section Menus"
        >
          <Menu size={14} />
          <span>All Menus</span>
        </button>

        <button
          onClick={() => {
            openGlobalScanner();
          }}
          className="px-3 py-1.5 shrink-0 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all flex items-center gap-1.5 text-xs font-bold border border-indigo-200/60 active:scale-95 cursor-pointer snap-start"
          title="Scan ID"
        >
          <QrCode size={14} />
          <span>Scan ID</span>
        </button>

        {(() => {
          const allTabs = [
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
            { id: 'enroll', label: 'Learner', icon: <UserPlus size={14} /> },
            { id: 'subjects', label: 'Subjects', icon: <BookOpen size={14} /> },
            { id: 'gradebook', label: 'eClass Records', icon: <TableIcon size={14} /> },
            { id: 'summary', label: 'Grading Sheet', icon: <ClipboardCheck size={14} /> },
            { id: 'sf8', label: 'SF8 Health', icon: <Activity size={14} /> },
            { id: 'transfers', label: 'Transfers', icon: <Share2 size={14} /> },
            { id: 'attendance', label: 'Attendance', icon: <Calendar size={14} /> },
            { id: 'sf2', label: 'SF2 Report', icon: <FileText size={14} /> },
            { id: 'observed-values', label: 'Remarks', icon: <Heart size={14} /> },
            { id: 'anecdotes', label: 'Anecdotes', icon: <MessageSquare size={14} /> },
            { id: 'sf10', label: 'SF10 Record', icon: <HistoryIcon size={14} /> },
            { id: 'pta', label: 'PTA Fees', icon: <CreditCard size={14} /> },
            { id: 'guide', label: 'Guide', icon: <HelpCircle size={14} /> },
          ];

          return allTabs.filter(tab => {
            if (tab.id === 'subjects' && userProfile?.role !== 'system_admin' && userProfile?.role !== 'admin' && !isSectionAdviser) return false;
            if (tab.id === 'summary' && !isSectionAdviser) return false;
            if (tab.id === 'pta' && !(userProfile?.role === 'teacher' && isSectionAdviser)) return false;
            if (tab.id === 'gradebook' && (!editableSubjects || editableSubjects.length === 0) && !isSectionAdviser) return false;
            if ((tab.id === 'attendance' || tab.id === 'sf2') && !hasCalendarMatch) return false;

            if (userProfile?.role === 'system_admin' || userProfile?.role === 'admin') return true;
            if (userProfile?.role === 'school_head') return ['sf8', 'sf10', 'anecdotes'].includes(tab.id);
            if (userProfile?.role === 'guidance_designate') return ['anecdotes'].includes(tab.id);
            if (userProfile?.role === 'teacher') {
              if (isSectionAdviser) return true;
              return ['gradebook', 'dashboard', 'anecdotes', 'pta'].includes(tab.id);
            }
            return true;
          }).map(tab => (
            <button
              key={'sub-bar-' + tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 shrink-0 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 snap-start ${
                activeTab === tab.id 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              {tab.icon}
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ));
        })()}
      </div>

      {/* Complete Mobile & Tablet Section Menu Sheet Drawer (xl:hidden) */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-[250] flex flex-col justify-end xl:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Slide-Up Sheet Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border-t border-slate-200 dark:border-slate-800 z-10"
            >
              {/* Drawer Top Drag Indicator & Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h2 className="text-base font-black text-slate-900 dark:text-white truncate">Section Navigation</h2>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-500 truncate">
                      {selectedSection?.name} • Grade {selectedSection?.gradeLevel}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  title="Close Menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content Body with Categorized Menus */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                {(() => {
                  const categories = [
                    {
                      name: "Overview",
                      icon: <LayoutDashboard size={16} className="text-indigo-600" />,
                      tabs: [
                        { id: 'dashboard', label: 'Section Dashboard', desc: 'Overview & key metrics', icon: <LayoutDashboard size={18} /> },
                      ]
                    },
                    {
                      name: "Student Management",
                      icon: <Users size={16} className="text-emerald-600" />,
                      tabs: [
                        { id: 'enroll', label: 'Learner Roster', desc: 'Enrolled students & profiles', icon: <UserPlus size={18} /> },
                        { id: 'transfers', label: 'Transfer Facility', desc: 'Process learner transfers', icon: <Share2 size={18} /> },
                        { id: 'sf8', label: 'School Form 8 (Health)', desc: 'BMI & physical assessment', icon: <Activity size={18} /> },
                        { id: 'pta', label: 'PTA Fees', desc: 'PTA collection & records', icon: <CreditCard size={18} /> },
                      ]
                    },
                    {
                      name: "Attendance & Behavior",
                      icon: <Calendar size={16} className="text-amber-600" />,
                      tabs: [
                        { id: 'attendance', label: 'Daily Attendance', desc: 'Track daily attendance', icon: <Calendar size={18} /> },
                        { id: 'sf2', label: 'School Form 2 (SF2)', desc: 'Monthly attendance summary', icon: <FileText size={18} /> },
                        { id: 'observed-values', label: 'Teacher Remarks', desc: 'Core values & character', icon: <Heart size={18} /> },
                        { id: 'anecdotes', label: 'Anecdotal Records', desc: 'Behavioral logs & notes', icon: <MessageSquare size={18} /> },
                      ]
                    },
                    {
                      name: "Academic Records",
                      icon: <BookOpen size={16} className="text-sky-600" />,
                      tabs: [
                        { id: 'subjects', label: 'Section Subjects', desc: 'Subject assignments', icon: <BookOpen size={18} /> },
                        { id: 'gradebook', label: 'eClass Records', desc: 'Input grades & exam scores', icon: <TableIcon size={18} /> },
                        { id: 'summary', label: 'Grading Sheet', desc: 'Quarterly summary sheet', icon: <ClipboardCheck size={18} /> },
                        { id: 'sf10', label: 'Learner Record (SF10)', desc: 'Permanent transcript', icon: <HistoryIcon size={18} /> },
                        { id: 'sf4', label: 'School Form 4 (SF4)', desc: 'Monthly movement summary', icon: <FileText size={18} /> },
                        { id: 'sf7', label: 'School Form 7 (SF7)', desc: 'Personnel assignments', icon: <FileText size={18} /> },
                        { id: 'aral', label: 'ARAL Program', desc: 'Intervention program', icon: <Sparkles size={18} /> },
                      ]
                    },
                    {
                      name: "Support & Help",
                      icon: <HelpCircle size={16} className="text-purple-600" />,
                      tabs: [
                        { id: 'guide', label: 'User Guide', desc: 'Help & instructions', icon: <HelpCircle size={18} /> },
                        { id: 'sys-docs', label: 'System Documentation', desc: 'Features & specs', icon: <Terminal size={18} /> },
                      ]
                    }
                  ];

                  // Filter allowed tabs for mobile
                  const filterAllowed = (tabId: string) => {
                    if (tabId === 'subjects' && userProfile?.role !== 'system_admin' && userProfile?.role !== 'admin' && !isSectionAdviser) return false;
                    if (tabId === 'summary' && !isSectionAdviser) return false;
                    if (tabId === 'pta' && !(userProfile?.role === 'teacher' && isSectionAdviser)) return false;
                    if (tabId === 'gradebook' && (!editableSubjects || editableSubjects.length === 0) && !isSectionAdviser) return false;
                    if ((tabId === 'attendance' || tabId === 'sf2') && !hasCalendarMatch) return false;
                    if (tabId === 'sf4' && userProfile?.role !== 'system_admin' && userProfile?.role !== 'school_head' && !isAuthorizedCashier) return false;
                    if (tabId === 'sf7' && userProfile?.role !== 'system_admin' && userProfile?.role !== 'admin') return false;

                    if (userProfile?.role === 'system_admin' || userProfile?.role === 'admin' || isAuthorizedCashier) return true;
                    if (userProfile?.role === 'school_head') return ['sf8', 'sf4', 'sf10', 'anecdotes', 'aral'].includes(tabId);
                    if (userProfile?.role === 'guidance_designate') return ['anecdotes', 'aral'].includes(tabId);
                    if (userProfile?.role === 'teacher') {
                      if (isSectionAdviser) return true;
                      return ['gradebook', 'dashboard', 'anecdotes', 'pta', 'aral'].includes(tabId);
                    }
                    return true;
                  };

                  return (
                    <>
                      {categories.map(cat => {
                        const validTabs = cat.tabs.filter(t => filterAllowed(t.id));
                        if (validTabs.length === 0) return null;

                        return (
                          <div key={cat.name} className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                              {cat.icon}
                              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{cat.name}</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {validTabs.map(t => {
                                const isActive = activeTab === t.id;
                                return (
                                  <button
                                    key={'drawer-tab-' + t.id}
                                    onClick={() => {
                                      setActiveTab(t.id as any);
                                      setIsMobileNavOpen(false);
                                    }}
                                    className={`flex items-start gap-3 p-3 rounded-2xl transition-all text-left border cursor-pointer ${
                                      isActive 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                        : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-slate-700/60'
                                    }`}
                                  >
                                    <div className={`p-2 rounded-xl shrink-0 ${
                                      isActive ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-500 shadow-2xs'
                                    }`}>
                                      {t.icon}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span className="text-xs font-bold leading-snug truncate">{t.label}</span>
                                      <span className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-400'}`}>
                                        {t.desc}
                                      </span>
                                    </div>
                                    {isActive && <CheckCircle size={16} className="text-white shrink-0 mt-0.5" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Admin Settings Section inside Mobile/Tablet Drawer */}
                      {(userProfile?.role === 'admin' || userProfile?.role === 'system_admin') && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 px-1">
                            <Settings size={16} className="text-slate-500" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Settings Menu</h3>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <button
                              onClick={() => { setShowAdminUsers(true); setIsMobileNavOpen(false); }}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/60 dark:border-slate-700"
                            >
                              <Users size={14} className="text-slate-400" />
                              <span className="truncate">Manage Users</span>
                            </button>
                            <button
                              onClick={() => { openGlobalScanner(); setIsMobileNavOpen(false); }}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/60 dark:border-slate-700"
                            >
                              <QrCode size={14} className="text-indigo-600" />
                              <span className="truncate">Scan ID</span>
                            </button>
                            {userProfile?.role === 'system_admin' && (
                              <button
                                onClick={() => { setActiveTab('subjects'); setIsMobileNavOpen(false); }}
                                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/60 dark:border-slate-700"
                              >
                                <BookOpen size={14} className="text-slate-400" />
                                <span className="truncate">Subject Menu</span>
                              </button>
                            )}
                            <button
                              onClick={() => { setShowAdminSchools(true); setIsMobileNavOpen(false); }}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/60 dark:border-slate-700"
                            >
                              <Building size={14} className="text-slate-400" />
                              <span className="truncate">Manage School</span>
                            </button>
                            <button
                              onClick={() => { setShowAdminSchoolYear(true); setIsMobileNavOpen(false); }}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/60 dark:border-slate-700"
                            >
                              <Calendar size={14} className="text-slate-400" />
                              <span className="truncate">School Year</span>
                            </button>
                            <button
                              onClick={() => { setShowAdminSchoolCalendar(true); setIsMobileNavOpen(false); }}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/60 dark:border-slate-700"
                            >
                              <Calendar size={14} className="text-slate-400" />
                              <span className="truncate">School Calendar</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Workspace Area */}
      <main className={`flex-1 overflow-auto bg-[#fcfdfe] scroll-smooth custom-scrollbar ${['gradebook', 'summary', 'dashboard', 'subjects', 'enroll', 'guide', 'sf8', 'transfers', 'sf10', 'observed-values', 'pta', 'tle-dashboard'].includes(activeTab) ? 'p-0' : 'p-6 md:p-12'}`}>
        <div className={`${['gradebook', 'summary', 'dashboard', 'subjects', 'enroll', 'guide', 'sf8', 'transfers', 'sf10', 'observed-values', 'pta', 'tle-dashboard'].includes(activeTab) ? 'w-full' : 'max-w-full 2xl:max-w-[1600px] mx-auto w-full'}`}>
          <AnimatePresence mode="wait">
            {activeTab === 'tle-dashboard' && (
              <motion.div
                key="tle-dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <TleDashboardView 
                  sections={sections}
                  subjects={subjects}
                  currentUser={userProfile}
                  onBack={() => setActiveTab('dashboard')}
                />
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <DashboardView 
                  students={enrolledStudents}
                  subjects={subjects}
                  sections={sections}
                  currentUser={userProfile}
                  globalSettings={globalSettings}
                  onNavigate={(tab) => setActiveTab(tab as any)}
                  onCalculateYearEnd={handleCalculateYearEnd}
                  onUnfinalizeYearEnd={handleUnfinalizeYearEnd}
                  onToggleFinalizeSubjectTerm={handleToggleFinalizeSubjectTerm}
                  section={selectedSection}
                  onShowFinancialStatement={handleShowFinancialStatement}
                  isAuthorizedCashier={isAuthorizedCashier}
                  isSectionAdviser={isSectionAdviser}
                  isEntireSchoolFinalized={isEntireSchoolFinalized}
                  onSelectSubject={(subjId) => {
                    setSelectedSubjectId(subjId);
                    setActiveTab('gradebook');
                  }}
                  onTermChange={(t) => setActiveTerm(t)}
                  teacherCount={teacherCount}
                  activeSchool={activeSchool}
                  schoolCalendar={sectionSchoolCalendar}
                  onUpdateAttendance={handleUpdateDailyAttendance}
                  onScanID={openGlobalScanner}
                />
              </motion.div>
            )}
            {activeTab === 'gradebook' && (
              <motion.div 
                key="gradebook"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <GradebookView 
                  subjects={(userProfile?.role === 'system_admin' || userProfile?.role === 'admin' || userProfile?.role === 'school_head' || isSectionAdviser) ? subjects : editableSubjects}
                  selectedSubjectId={selectedSubjectId}
                  onSelectSubject={setSelectedSubjectId}
                  students={combinedTleStudents.length > 0 ? combinedTleStudents : enrolledStudents}
                  onUpdateGrades={updateStudentGrades}
                  onBulkUpdate={handleBulkUpdate}
                  onUpdateSubject={updateSubjectConfig}
                  activeTerm={activeTerm}
                  onTermChange={setActiveTerm}
                  selectedSection={selectedSection}
                  globalNumTerms={globalNumTerms}
                  schoolCalendar={schoolCalendar}
                  onUnfinalizeYearEnd={handleUnfinalizeYearEnd}
                  onCalculateYearEnd={handleCalculateYearEnd}
                  onToggleFinalizeSubjectTerm={handleToggleFinalizeSubjectTerm}
                  currentUser={userProfile}
                  globalSettings={globalSettings}
                />
              </motion.div>
            )}
            {activeTab === 'summary' && (
              <motion.div 
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <SummarySheetView 
                  students={enrolledStudents}
                  subjects={subjects}
                  selectedSection={selectedSection}
                  currentUser={userProfile}
                  schoolCalendar={sectionSchoolCalendar}
                  onToggleSF9Download={handleToggleSF9Download}
                  onToggleStudentStatus={handleToggleStudentStatus}
                  onViewReport={setSelectedStudentForReport}
                  onViewBlankReport={setSelectedStudentForBlankReport}
                />
              </motion.div>
            )}
            {activeTab === 'transfers' && (
              <motion.div 
                key="transfers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TransferFacilityView 
                  students={students}
                  onToggleStatus={handleToggleStudentStatus}
                  onViewReport={setSelectedStudentForReport}
                  onViewBlankReport={setSelectedStudentForBlankReport}
                />
              </motion.div>
            )}
            {activeTab === 'enroll' && (
              <motion.div 
                key="enroll"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AddLearnerView 
                  form={learnerForm} 
                  setForm={setLearnerForm} 
                  onSave={handleSaveLearner}
                  students={filteredStudents}
                  sections={sections}
                  unenrolledStudents={unenrolledStudents}
                  onEnrollAllLearners={handleEnrollAllLearners}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteLearner}
                  onDeleteMany={handleDeleteManyLearners}
                  editingId={editingId}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onBulkEnroll={handleBulkEnroll}
                  onCancelEdit={() => {
                    setEditingId(null);
                    setLearnerForm({ 
                      lastName: "", firstName: "", middleName: "", extension: "", name: "", 
                      lrn: "", email: "", photo: "", age: "", birthdate: "", sex: "Male", weight: "", height: "", attendance: {}, 
                      birthplace: "", address: "", fatherName: "", motherName: "", guardianName: "", guardianRelationship: "", primaryContact: "guardian", contactNumber: "",
                      nutritionalStatus: {}, isTransferredIn: false, siblingIds: [], enrolledSubjectIds: [], eligibility: { type: 'Elementary School Completer' } as any
                    });
                  }}
                  sectionName={selectedSection.name}
                  schoolYear={selectedSection.schoolYear}
                  onUpdateAttendance={handleUpdateAttendance}
                  schoolCalendar={sectionSchoolCalendar}
                  globalSettings={globalSettings}
                  onToggleStatus={handleToggleStudentStatus}
                  onViewReport={setSelectedStudentForReport}
                  onViewBlankReport={setSelectedStudentForBlankReport}
                  onTogglePublishGrades={handleTogglePublishGrades}
                  onToggleParentSignature={handleToggleParentSignature}
                  section={selectedSection}
                  currentUser={userProfile}
                  isSectionAdviser={isSectionAdviser}
                  onViewAnecdotals={(s) => {
                    setPreselectedStudentForAnecdotal(s);
                    setActiveTab('anecdotes');
                  }}
                  globalSubjects={globalSubjects}
                  subjects={subjects}
                />
              </motion.div>
            )}
            {activeTab === 'subjects' && (
              <motion.div 
                key="subjects"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SubjectsView 
                  subjects={subjects}
                  onAddSubject={handleAddSubject}
                  onEditSubject={handleEditSubject}
                  onDeleteSubject={handleDeleteSubject}
                  selectedSection={selectedSection}
                  currentUser={userProfile}
                  globalSettings={globalSettings}
                  isSectionAdviser={isSectionAdviser}
                  globalSubjects={globalSubjects}
                  onUpdateSection={handleUpdateSection}
                  onBack={() => setActiveTab('dashboard')}
                />
              </motion.div>
            )}
            {(activeTab === 'attendance' || activeTab === 'sf2') && selectedSection && (
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-4">
                   <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                     {activeTab === 'sf2' ? 'School Form 2 Report' : 'Daily Attendance'}
                   </h2>
                   <p className="text-sm text-slate-500 font-medium">{activeTab === 'sf2' ? 'Summary report of learner attendance.' : 'Record and manage learner daily attendance.'}</p>
                </div>
                {activeTab === 'sf2' ? (
                  <SF2ReportView 
                    students={enrolledStudents}
                    calendar={sectionSchoolCalendar}
                    section={selectedSection}
                    userId={currentUser?.uid}
                  />
                ) : (
                  <DailyAttendanceTracker 
                    students={enrolledStudents}
                    calendar={sectionSchoolCalendar} 
                    schoolYear={selectedSection?.schoolYear}
                    onUpdateAttendance={handleUpdateDailyAttendance} 
                    onMarkAllPresent={handleMarkAllPresent}
                    userId={currentUser?.uid}
                    section={selectedSection}
                    sections={sections}
                    scanLogs={scanLogs}
                    onAddScanLog={handleAddScanLog}
                    onDeleteScanLog={handleDeleteScanLog}
                    onClearScanLogs={handleClearScanLogs}
                    currentUserEmail={currentUser?.email}
                    schoolName={selectedSection?.schoolName || activeSchool?.name}
                    schoolId={selectedSection?.schoolId || activeSchool?.schoolId}
                    division={selectedSection?.division || activeSchool?.division}
                    region={selectedSection?.region || activeSchool?.region}
                    onScanID={openGlobalScanner}
                  />
                )}
              </motion.div>
            )}
            {activeTab === 'observed-values' && selectedSection && (
              <motion.div 
                key="observed-values"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ObservedValuesTracker 
                  students={enrolledStudents} 
                  onUpdateValue={handleUpdateObservedValue} 
                  globalNumTerms={globalSettings?.numTerms || 4}
                />
              </motion.div>
            )}
            {activeTab === 'anecdotes' && (
              <motion.div 
                key="anecdotes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AnecdotalRecordsView 
                  currentUser={currentUser}
                  userProfile={userProfile}
                  selectedSection={selectedSection}
                  students={enrolledStudents}
                  sections={sections}
                  preselectedStudent={preselectedStudentForAnecdotal}
                  onClearPreselectedStudent={() => setPreselectedStudentForAnecdotal(null)}
                />
              </motion.div>
            )}
            {activeTab === 'pta' && (
              <motion.div 
                key="pta"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <PTAFeesManagementView
                  currentUser={currentUser}
                  userProfile={userProfile}
                  selectedSection={selectedSection}
                  sections={sections}
                  initialTab={ptaInitialTab}
                />
              </motion.div>
            )}
            {activeTab === 'guide' && (
              <motion.div 
                key="guide"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <UserGuideView />
              </motion.div>
            )}
            {activeTab === 'sys-docs' && (
              <motion.div 
                key="sys-docs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SystemDocumentationView />
              </motion.div>
            )}

            {activeTab === 'sf8' && (
               <motion.div 
                 key="sf8"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
               >
                 <SF8View 
                    section={selectedSection}
                    students={enrolledStudents}
                    userProfile={userProfile}
                    activeSchoolYear={globalSettings?.activeSchoolYear}
                 />
               </motion.div>
            )}
            {activeTab === 'sf10' && (
               <motion.div 
                 key="sf10"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
               >
                 <SF10View 
                    section={selectedSection}
                    students={enrolledStudents}
                    subjects={subjects}
                    schoolCalendar={schoolCalendar}
                    userProfile={userProfile}
                 />
               </motion.div>
            )}

            {activeTab === 'sf4' && (userProfile?.role === 'system_admin' || userProfile?.role === 'school_head') && userProfile?.schoolId && (
               <motion.div 
                 key="sf4"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
               >
                 <SF4ReportView 
                    schoolId={userProfile.schoolId}
                    calendar={schoolCalendar}
                    globalSettings={globalSettings}
                 />
               </motion.div>
            )}

            {activeTab === 'sf7' && userProfile?.schoolId && (
               <motion.div 
                 key="sf7"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
               >
                 <SF7ReportView 
                    schoolId={userProfile.schoolId}
                    activeSchoolYear={selectedSection?.schoolYear || globalSettings?.activeSchoolYear || "2026-2027"}
                    userProfile={userProfile}
                 />
               </motion.div>
            )}

            {activeTab === 'aral' && (
               <motion.div 
                 key="aral"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
               >
                 <AralProgram 
                   enrolledStudents={enrolledStudents}
                   selectedSection={selectedSection}
                   sections={sections}
                   userProfile={userProfile}
                   globalSettings={globalSettings}
                   aralSchoolInfo={aralSchoolInfo}
                   onUpdateAralSchool={handleUpdateAralSchool}
                   aralCompetencies={aralCompetencies}
                   onAddAralCompetency={handleAddAralCompetency}
                   onDeleteAralCompetency={handleDeleteAralCompetency}
                   aralClasses={aralClasses}
                   onCreateAralClass={handleCreateAralClass}
                   onUpdateAralClass={handleUpdateAralClass}
                   onDeleteAralClass={handleDeleteAralClass}
                   selectedAralClassId={selectedAralClassId}
                   onSelectAralClassId={setSelectedAralClassId}
                 />
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="h-10 bg-white border-t border-slate-100 flex items-center justify-between px-10 shrink-0 z-40 bg-slate-50/50">
        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-4">
          <span>Server Status: Online</span>
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
        </div>
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">© 2024 Centralized Learner Assessment & School System • Professional Edition</p>
      </footer>

      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        user={userProfile}
      />

      <AnimatePresence>
        {enrollAllModalOpen && (
          <EnrollAllConfirmationModal
            learnerCount={unenrolledStudents.length}
            onConfirm={async () => {
              setEnrollAllProcessing(true);
              setEnrollAllErrorMsg("");
              try {
                const connectedSubjects = await fetchSubjectsForSection(
                  selectedSection!.id,
                  Number(selectedSection!.gradeLevel),
                  selectedSection!.globalSubjectIds || [],
                  globalSubjects
                );
                const allSubjectIds = connectedSubjects.map(s => s.id);
                
                if (allSubjectIds.length === 0) {
                  setEnrollAllErrorMsg("This section does not have any curriculum subjects configured. Please configure or add subjects first.");
                  setEnrollAllProcessing(false);
                  return;
                }

                const batch = writeBatch(db);
                unenrolledStudents.forEach(student => {
                  batch.set(
                    doc(db, `sections/${selectedSection!.id}/students`, student.id),
                    { enrolledSubjectIds: allSubjectIds },
                    { merge: true }
                  );
                });
                await batch.commit();
                setEnrollAllSuccessMsg(`Successfully enrolled all ${unenrolledStudents.length} pending learner(s) in ${allSubjectIds.length} subjects!`);
                setEnrollAllModalOpen(false);
              } catch (error: any) {
                console.error("Enroll All Learners Error:", error);
                setEnrollAllErrorMsg(error?.message || "Failed to complete enrollment batch.");
              } finally {
                setEnrollAllProcessing(false);
              }
            }}
            onCancel={() => setEnrollAllModalOpen(false)}
            isProcessing={enrollAllProcessing}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {enrollAllSuccessMsg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setEnrollAllSuccessMsg("")}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center border border-slate-150"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">Enrollment Completed</h2>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed mb-6">
                {enrollAllSuccessMsg}
              </p>
              <button 
                onClick={() => setEnrollAllSuccessMsg("")}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Okay, Awesome
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {enrollAllErrorMsg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setEnrollAllErrorMsg("")}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center border border-slate-150"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">Enrollment Failed</h2>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed mb-6">
                {enrollAllErrorMsg}
              </p>
              <button 
                onClick={() => setEnrollAllErrorMsg("")}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedStudentForReport && selectedSection && (
          <MATATAGReportCardModal 
            student={selectedStudentForReport}
            section={selectedSection}
            subjects={subjects.slice().sort((a, b) => (a.order || 0) - (b.order || 0))}
            onClose={() => setSelectedStudentForReport(null)}
            calendar={schoolCalendar}
            globalNumTerms={globalSettings?.numTerms || 4}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {statusChangeTarget && (
          <StatusChangeModal 
            student={statusChangeTarget.student}
            newStatus={statusChangeTarget.newStatus}
            onConfirm={confirmStatusChange}
            onCancel={() => setStatusChangeTarget(null)}
            date={statusChangeDate}
            onDateChange={setStatusChangeDate}
            reason={statusChangeReason}
            onReasonChange={setStatusChangeReason}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmFinalizeSection && selectedSection && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-emerald-100 text-emerald-600">
                <Sparkles size={32} />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2">Finalize Section?</h3>
              
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Are you sure you want to finalize this section? This will lock all student records, compute final averages, and set statuses. This action is irreversible without requesting unfinalization.
              </p>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setConfirmFinalizeSection(false)}
                  className="flex-1 py-3 bg-slate-100/80 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeFinalizeSection}
                  className="flex-1 py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                >
                  Confirm Finalize
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmYearEndUnfinalize && selectedSection && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-amber-100 text-amber-600">
                <AlertTriangle size={32} />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2">{userProfile?.role === 'system_admin' ? 'Unfinalize Section?' : 'Request Unfinalize Section?'}</h3>
              
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                {userProfile?.role === 'system_admin' 
                  ? "Are you sure you want to unfinalize this section? This will reset the promotion and retention statuses for all learners in this section and unlock the gradebook."
                  : "Are you sure you want to request unfinalization of this section? An admin will review and approve."}
              </p>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setConfirmYearEndUnfinalize(false)}
                  className="flex-1 py-3 bg-slate-100/80 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeUnfinalizeYearEnd}
                  className="flex-1 py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                >
                  Yes, Unfinalize
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {globalScannerModal}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        settings={systemThemeSettings}
        onUpdateSettings={handleUpdateThemeSettings}
        onResetSettings={() => handleUpdateThemeSettings(DEFAULT_THEME_SETTINGS)}
      />
    </div>
  );
}

function StatusChangeModal({ 
  student, 
  newStatus, 
  onConfirm, 
  onCancel,
  date,
  onDateChange,
  reason,
  onReasonChange
}: { 
  student: Student, 
  newStatus: 'Transferred Out' | 'Dropped Out' | 'Retained' | 'Promoted',
  onConfirm: () => void,
  onCancel: () => void,
  date: string,
  onDateChange: (d: string) => void,
  reason: string,
  onReasonChange: (r: string) => void
}) {
  const isTransfer = newStatus === 'Transferred Out';
  const isDrop = newStatus === 'Dropped Out';
  const isPromoted = newStatus === 'Promoted';
  const label = isTransfer ? 'Transfer Out' : isDrop ? 'Drop Out' : isPromoted ? 'Mark as Promoted' : 'Mark as Retained';
  const color = isTransfer ? 'rose' : isDrop ? 'orange' : isPromoted ? 'emerald' : 'indigo';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
      >
        <div className={`bg-${color}-50 px-8 py-6 border-b border-${color}-100 flex items-center gap-4`}>
          <div className={`p-3 bg-${color}-100 text-${color}-600 rounded-2xl`}>
            {isTransfer ? <Share2 size={24} /> : <UserMinus size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Confirm {label}</h3>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">{formatStudentName(student)}</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
              "Are you sure you want to mark this learner as <span className={`font-bold text-${color}-600`}>{newStatus}</span>? This will affect monthly enrollment reports and the Learner Permanent Record."
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                Date of {isTransfer ? 'Transfer' : 'Last Attendance'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium ml-1">This date determines which month the learner is counted as {isTransfer ? 'transferred' : 'dropped'} in the SF4 report.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                Reason for {isTransfer ? 'Transfer/School' : 'Dropping Out'} (Optional)
              </label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder={isTransfer ? "School transferred to..." : "Reason for dropping out..."}
                  value={reason}
                  onChange={(e) => onReasonChange(e.target.value)}
                  className="w-full h-14 pl-4 pr-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={onCancel}
              className="flex-1 h-14 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 h-14 bg-${color}-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-${color}-200 hover:scale-105 transition-all active:scale-95`}
            >
              Confirm {label}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SectionForm({ 
  initialData, 
  onSubmit, 
  buttonLabel,
  user,
  globalSubjects = []
}: { 
  initialData?: any, 
  onSubmit: (data: any) => void,
  buttonLabel: string,
  user?: UserProfile | null,
  globalSubjects?: Subject[]
}) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    grade: initialData?.gradeLevel || initialData?.grade || "",
    adviserName: initialData?.adviserName || initialData?.adviser || "",
    adviserEmail: initialData?.adviserEmail || "",
    region: initialData?.region || "",
    division: initialData?.division || "",
    district: initialData?.district || "",
    schoolName: initialData?.schoolName || "",
    schoolId: initialData?.schoolId || (user?.role === 'system_admin' ? (user?.schoolId || "") : ""),
    schoolYear: initialData?.schoolYear || "",
    globalSubjectIds: initialData?.globalSubjectIds || [],
    subjectTeachers: initialData?.subjectTeachers || {}
  });

  const [availableSchools, setAvailableSchools] = useState<any[]>([]);
  const [availableSchoolYears, setAvailableSchoolYears] = useState<string[]>([]);
  const [activeSchoolYear, setActiveSchoolYear] = useState<string | null>(null);
  const [advisoryCandidates, setAdvisoryCandidates] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!form.schoolId) {
      setAdvisoryCandidates([]);
      return;
    }
    const q = query(
      collection(db, "users"),
      where("schoolId", "==", form.schoolId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const candidates: UserProfile[] = [];
      snap.forEach((docSnap) => {
        const u = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
        if (u.role !== 'student') {
          candidates.push(u);
        }
      });
      candidates.sort((a, b) => (a.displayName || a.email || "").localeCompare(b.displayName || b.email || ""));
      setAdvisoryCandidates(candidates);
    }, (err) => {
      console.error("Error fetching advisory candidates:", err);
    });
    return () => unsub();
  }, [form.schoolId]);

  const schoolYearsToDisplay = useMemo(() => {
    const list = [...availableSchoolYears];
    if (form.schoolYear && !list.includes(form.schoolYear)) {
      list.push(form.schoolYear);
    }
    return list.sort((a, b) => b.localeCompare(a));
  }, [availableSchoolYears, form.schoolYear]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const activeYears = (data.schoolYears || []).filter((sy: string) => !(data.closedSchoolYears || []).includes(sy));
        setAvailableSchoolYears(activeYears);
        setActiveSchoolYear(data.activeSchoolYear || null);
        const defaultYear = data.activeSchoolYear || (activeYears.length > 0 ? activeYears[0] : "");
        if (defaultYear && !form.schoolYear) {
          setForm(prev => ({ ...prev, schoolYear: defaultYear }));
        }
      }
    }, (err) => {
      handleFirestoreError(err, 'get', 'settings/general');
    });
    return unsub;
  }, [form.schoolYear, user]);

  useEffect(() => {
    // Both admins and system admins can see the full school list to pick from.
    if (user?.role === 'admin' || user?.role === 'system_admin') {
      const q = query(collection(db, "schools"));
      getDocs(q).then(snap => {
        setAvailableSchools(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      }).catch(err => console.error("Error fetching available schools:", err));
    }
  }, [user]);

  useEffect(() => {
    if (!initialData && user?.role === 'system_admin' && user?.schoolId && !form.schoolId) {
      setForm(prev => ({ ...prev, schoolId: user.schoolId || "" }));
    }
  }, [user, form.schoolId, initialData]);

  useEffect(() => {
    const fetchSchoolDetails = async () => {
      if (!form.schoolId) return;
      
      try {
        const q = query(collection(db, "schools"), where("schoolId", "==", form.schoolId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const schoolData = snap.docs[0].data();
          setForm(prev => ({
            ...prev,
            schoolName: schoolData.name || prev.schoolName,
            region: schoolData.region || prev.region,
            division: schoolData.division || prev.division,
            district: schoolData.district || prev.district,
            headOfSchool: schoolData.headOfSchool || prev.headOfSchool
          }));
        }
      } catch (err) {
        console.error("Error fetching school details:", err);
      }
    };
    
    // Auto-fetch if adding a new section or if schoolId changes in edit mode
    // (Wait, in edit mode we should probably trust initialData unless schoolId explicitly changes)
    if (!initialData || form.schoolId !== initialData.schoolId) {
      fetchSchoolDetails();
    }
  }, [form.schoolId, initialData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Section Name</label>
            <input 
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all"
              placeholder="e.g. Einstein"
            />
        </div>
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Grade Level</label>
            <select 
              value={form.grade}
              onChange={e => setForm({...form, grade: e.target.value === "" ? "" : parseInt(e.target.value)})}
              className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all"
            >
              <option value="" disabled>Select Grade Level</option>
              <option value="0">Kindergarten</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>Grade {n}</option>)}
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Adviser Name</label>
            {advisoryCandidates.length > 0 ? (
              <select 
                value={form.adviserEmail || ""}
                onChange={e => {
                  const val = e.target.value;
                  const matched = advisoryCandidates.find(c => c.email === val);
                  setForm(prev => ({
                    ...prev,
                    adviserName: matched ? (matched.displayName || matched.email) : val,
                    adviserEmail: val
                  }));
                }}
                className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all text-slate-800"
              >
                <option value="" disabled>Select Class Adviser...</option>
                {form.adviserEmail && !advisoryCandidates.some(c => c.email === form.adviserEmail) && (
                  <option value={form.adviserEmail}>{form.adviserName || form.adviserEmail}</option>
                )}
                {advisoryCandidates.map(c => {
                  const label = c.displayName || c.email;
                  return (
                    <option key={c.uid} value={c.email}>
                      {label} ({c.email})
                    </option>
                  );
                })}
              </select>
            ) : (
              <input 
                value={form.adviserName}
                onChange={e => setForm({...form, adviserName: e.target.value})}
                className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all text-slate-800"
                placeholder="No registered users found. Type manually..."
              />
            )}
        </div>

        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Adviser Email</label>
            <input 
              value={form.adviserEmail}
              onChange={e => setForm({...form, adviserEmail: e.target.value})}
              readOnly={!!form.adviserEmail && advisoryCandidates.some(c => c.email === form.adviserEmail)}
              className={`w-full h-11 px-4 border border-slate-200 rounded-lg outline-none font-semibold text-sm transition-all ${
                (form.adviserEmail && advisoryCandidates.some(c => c.email === form.adviserEmail)) 
                  ? 'bg-slate-100 text-slate-500 cursor-not-allowed' 
                  : 'bg-slate-50/50 focus:border-indigo-500 text-slate-850'
              }`}
              placeholder="Enter Teacher's Email"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Select School ID <span className="text-rose-500">*</span></label>
            {(user?.role === 'admin' || user?.role === 'system_admin') ? (
              <select 
                value={form.schoolId}
                required
                onChange={e => setForm({...form, schoolId: e.target.value})}
                className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all"
              >
                <option value="" disabled>Select a School</option>
                {availableSchools.map(s => (
                  <option key={s.id} value={s.schoolId}>{s.schoolId} - {s.name}</option>
                ))}
              </select>
            ) : (
              <input 
                value={form.schoolId}
                required
                onChange={e => setForm({...form, schoolId: e.target.value})}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all"
                placeholder="School ID"
              />
            )}
        </div>
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">School Name</label>
            <input 
              value={form.schoolName}
              readOnly
              className="w-full h-11 px-4 bg-slate-100/50 border border-slate-200 rounded-lg outline-none font-semibold text-sm text-slate-500 cursor-not-allowed transition-all"
              placeholder="Auto-filled School Name"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Region</label>
            <input 
              value={form.region}
              readOnly
              className="w-full h-11 px-4 bg-slate-100/50 border border-slate-200 rounded-lg outline-none font-semibold text-sm text-slate-500 cursor-not-allowed transition-all"
              placeholder="Auto-filled Region"
            />
        </div>
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Division</label>
            <input 
              value={form.division}
              readOnly
              className="w-full h-11 px-4 bg-slate-100/50 border border-slate-200 rounded-lg outline-none font-semibold text-sm text-slate-500 cursor-not-allowed transition-all"
              placeholder="Auto-filled Division"
            />
        </div>
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">District</label>
            <input 
              value={form.district}
              readOnly
              className="w-full h-11 px-4 bg-slate-100/50 border border-slate-200 rounded-lg outline-none font-semibold text-sm text-slate-500 cursor-not-allowed transition-all"
              placeholder="Auto-filled District"
            />
        </div>
      </div>

      <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center justify-between">
            School Year
            {!activeSchoolYear && (
              <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                <AlertCircle size={10} /> No school year is in active
              </span>
            )}
          </label>
          {schoolYearsToDisplay.length > 0 ? (
            <select 
              value={form.schoolYear}
              onChange={e => setForm({...form, schoolYear: e.target.value})}
              className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all"
            >
              {schoolYearsToDisplay.map(sy => (
                <option key={sy} value={sy}>{sy}</option>
              ))}
            </select>
          ) : (
            <input 
              value={form.schoolYear}
              onChange={e => setForm({...form, schoolYear: e.target.value})}
              className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all"
              placeholder="e.g. 2023-2024"
            />
          )}
      </div>

      <div className="flex justify-end pt-6">
        <button 
          onClick={() => {
              if (!form.schoolYear || !form.schoolId) {
                if (!form.schoolId) alert('School ID is required.');
                return;
              }
              const data = {
                name: form.name,
                gradeLevel: form.grade,
                adviserName: form.adviserName,
                adviserEmail: form.adviserEmail || "",
                region: form.region,
                division: form.division,
                district: form.district,
                schoolName: form.schoolName,
                schoolId: form.schoolId,
                schoolYear: form.schoolYear
              };
              onSubmit(data);
          }}
          disabled={
            !form.schoolYear || 
            !form.schoolId || 
            !form.name.trim() || 
            form.grade === "" || 
            !form.adviserName.trim() || 
            !form.adviserEmail.trim()
          }
          className="bg-indigo-600 text-white disabled:bg-slate-200 h-11 px-10 rounded-lg font-bold text-sm shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 disabled:shadow-none transition-all w-full md:w-auto"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

function LoginView({ 
  onLogin, 
  isLoading, 
  loginError, 
  onDemoLogin 
}: { 
  onLogin: () => void; 
  isLoading?: boolean; 
  loginError?: string | null;
  onDemoLogin?: (role: 'admin' | 'system_admin' | 'school_head' | 'teacher' | 'student') => void;
}) {
  const [showPricing, setShowPricing] = useState(false);
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden font-sans p-4">
      <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white p-6 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative z-10 mx-auto flex flex-col justify-center my-auto"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-indigo-50 blur-xl rounded-full" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 relative">
              <GraduationCap size={36} className="text-white" />
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">Official DepEd Portal</span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug text-center mt-1">
                Centralized Learner Assessment <br />
                &amp; School System
              </h1>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Class Record &amp; Enterprise School Management</p>
          </div>
        </div>

        {loginError && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-left flex items-start gap-3 shadow-sm"
          >
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="text-xs text-amber-900 leading-relaxed font-medium">
              <p className="font-bold text-amber-950 mb-1">Authentication Alert</p>
              <p>{loginError}</p>
              <p className="mt-2 text-[11px] text-amber-700 font-semibold">
                Tip: You can use <button type="button" onClick={() => setShowDemoOptions(true)} className="underline font-bold text-indigo-700 hover:text-indigo-800">Quick Access / Demo Login</button> below to test any role directly.
              </p>
            </div>
          </motion.div>
        )}

        <button 
          onClick={onLogin}
          disabled={isLoading}
          className="w-full bg-slate-900 text-white h-14 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mb-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span className="text-sm">Authenticating with Google...</span>
            </>
          ) : (
            <>
              <span className="text-sm font-bold">Secure Log In with Google</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">or direct portal access</span>
        </div>

        <button
          type="button"
          onClick={() => setShowDemoOptions(!showDemoOptions)}
          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 h-12 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors mb-3"
        >
          <Sparkles size={16} className="text-indigo-600" />
          {showDemoOptions ? "Hide Demo / Quick Access Portals" : "Quick Access / Demo Login"}
        </button>

        <AnimatePresence>
          {showDemoOptions && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Select Role to Login Instantly</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button 
                    onClick={() => onDemoLogin?.('admin')}
                    className="p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-indigo-300 flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                      <Shield size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">System Admin</div>
                      <div className="text-[10px] text-slate-500">Dr. Jessie J. Mangabo</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => onDemoLogin?.('school_head')}
                    className="p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-purple-300 flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600">School Head</div>
                      <div className="text-[10px] text-slate-500">Principal / Administrator</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => onDemoLogin?.('teacher')}
                    className="p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-emerald-300 flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">Teacher / Adviser</div>
                      <div className="text-[10px] text-slate-500">Subject / Class Teacher</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => onDemoLogin?.('student')}
                    className="p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-amber-300 flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                      <User size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600">Student Portal</div>
                      <div className="text-[10px] text-slate-500">Learner Class Card &amp; SF9</div>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowPricing(true)}
          className="w-full border border-slate-200 text-slate-600 h-11 rounded-xl font-medium text-xs flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <CreditCard size={15} className="text-slate-400" />
          View Pricing &amp; Payment
        </button>

        <div className="mt-6 flex items-center gap-2 justify-center text-[11px] text-slate-500 font-medium">
          <ShieldCheck size={15} className="text-emerald-500" />
          Authorized DepEd Academic Access Only
        </div>
      </motion.div>

      {showPricing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200"
          >
            <button 
              onClick={() => setShowPricing(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Pricing &amp; Payment</h3>
                <p className="text-sm text-slate-500 mt-1">Flexible pricing based on your school's size</p>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">The Centralized Learner Assessment & School System offers flexible pricing based on your school's size. Fees are collected per year of use. <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Free for First year of access.</span></p>
              
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">School Category</th>
                      <th className="px-5 py-3">No. of Teachers</th>
                      <th className="px-5 py-3">Annual Fee (PHP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">Small</td>
                      <td className="px-5 py-3 text-slate-500">9 &amp; below</td>
                      <td className="px-5 py-3 font-semibold text-indigo-600">₱599</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">Medium</td>
                      <td className="px-5 py-3 text-slate-500">10 – 25</td>
                      <td className="px-5 py-3 font-semibold text-indigo-600">₱1,199</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">Large</td>
                      <td className="px-5 py-3 text-slate-500">26 – 100</td>
                      <td className="px-5 py-3 font-semibold text-indigo-600">₱2,499</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">Mega</td>
                      <td className="px-5 py-3 text-slate-500">101 &amp; above</td>
                      <td className="px-5 py-3 font-semibold text-indigo-600">₱4,999</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
                <h4 className="text-slate-800 font-semibold text-sm mb-3 flex items-center gap-2">
                  <Building2 size={16} className="text-slate-400" /> How to Pay
                </h4>
                <div className="space-y-4">
                  <p className="text-slate-600 text-sm leading-relaxed">
                    We currently support payments via <strong>GCash / Digital Transfer</strong>. Please send your payment to the following number:
                  </p>
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-fit">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GCash Number</p>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">0905 152 6827</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs italic">
                    *After payment, please contact the administrator with your proof of payment and School ID to activate your license.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function GlobalFinalizationController({
  sections,
  subjects,
  user,
  activeSchoolYear,
  selectedFilterSchoolYear
}: {
  sections: Section[],
  subjects: Subject[],
  user: UserProfile | null,
  activeSchoolYear?: string,
  selectedFilterSchoolYear?: string
}) {
  const [processing, setProcessing] = useState(false);
  const [isAnySectionFinalized, setIsAnySectionFinalized] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirmFinalizePrompt, setConfirmFinalizePrompt] = useState(false);
  const [confirmUnfinalizePrompt, setConfirmUnfinalizePrompt] = useState(false);
  const [requestUnfinalizePrompt, setRequestUnfinalizePrompt] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isMainAdmin = user?.email === 'jessiemangabo@gmail.com';
  const isSystemAdmin = user?.role === 'system_admin';

  const targetSchoolYear = selectedFilterSchoolYear || activeSchoolYear;

  // Active sections for the targeted school year
  const targetSections = useMemo(() => {
    return sections.filter(section => {
      const effectiveYear = targetSchoolYear;
      if (effectiveYear && effectiveYear !== 'all') {
        if (effectiveYear === 'No School Year') {
          return !section.schoolYear || section.schoolYear.trim() === '';
        }
        return section.schoolYear === effectiveYear;
      }
      return true;
    });
  }, [sections, targetSchoolYear]);

  // Check if any student in any of these target sections has a finalized status (Promoted or Retained)
  useEffect(() => {
    if (targetSections.length === 0) {
      setIsAnySectionFinalized(false);
      return;
    }

    let isSubscribed = true;
    setChecking(true);

    const checkStatus = async () => {
      try {
        let foundFinalized = false;
        // Check target sections to see if any have finalized students
        for (const sec of targetSections) {
          const q = query(
            collection(db, `sections/${sec.id}/students`),
            where("status", "in", ["Promoted", "Retained"]),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            foundFinalized = true;
            break;
          }
        }
        if (isSubscribed) {
          setIsAnySectionFinalized(foundFinalized);
        }
      } catch (err) {
        console.error("Error checking query finalized status:", err);
      } finally {
        if (isSubscribed) {
          setChecking(false);
        }
      }
    };

    checkStatus();

    return () => {
      isSubscribed = false;
    };
  }, [targetSections]);

  const relevantSubjects = useMemo(() => {
    const targetSectionIds = new Set(targetSections.map(s => s.id));
    return subjects.filter(sub => targetSectionIds.has(sub.sectionId));
  }, [targetSections, subjects]);

  const isAllSubjectsTermsFinalized = useMemo(() => {
    if (targetSections.length === 0 || relevantSubjects.length === 0) return false;
    return relevantSubjects.every(subj => {
      const offered = subj.offeredTerms && subj.offeredTerms.length > 0 ? subj.offeredTerms : ([1, 2, 3, 4] as TermNumber[]);
      return offered.every(t => subj.finalizedTerms?.includes(t));
    });
  }, [targetSections, relevantSubjects]);

  const unfinalizedSectionsSubjectsAndTerms = useMemo(() => {
    if (isAnySectionFinalized) return [];
    const sectionMap = new Map<string, string>(targetSections.map(s => [s.id, s.name] as [string, string]));

    const list: { sectionName: string; subjectName: string; terms: TermNumber[] }[] = [];
    relevantSubjects.forEach(subj => {
      const offered = subj.offeredTerms && subj.offeredTerms.length > 0 ? subj.offeredTerms : ([1, 2, 3, 4] as TermNumber[]);
      const pending = offered.filter(t => !subj.finalizedTerms?.includes(t));
      if (pending.length > 0) {
        list.push({ 
          sectionName: sectionMap.get(subj.sectionId) || "Unknown", 
          subjectName: subj.name, 
          terms: pending 
        });
      }
    });
    return list;
  }, [targetSections, relevantSubjects, isAnySectionFinalized]);

  const pendingByTerm = useMemo(() => {
    const termGroups: Record<number, { id: string; sectionName: string; subjectName: string; teacherEmail?: string }[]> = {
      1: [],
      2: [],
      3: [],
      4: []
    };

    if (isAnySectionFinalized) return termGroups;
    const sectionMap = new Map<string, string>(targetSections.map(s => [s.id, s.name] as [string, string]));

    relevantSubjects.forEach(subj => {
      const offered = subj.offeredTerms && subj.offeredTerms.length > 0 ? subj.offeredTerms : ([1, 2, 3, 4] as TermNumber[]);
      offered.forEach(t => {
        if (!subj.finalizedTerms?.includes(t)) {
          termGroups[t].push({
            id: subj.id,
            sectionName: sectionMap.get(subj.sectionId) || "Unknown",
            subjectName: subj.name,
            teacherEmail: subj.teacherEmail
          });
        }
      });
    });

    return termGroups;
  }, [targetSections, relevantSubjects, isAnySectionFinalized]);

  if (targetSections.length === 0 || relevantSubjects.length === 0) {
    return null;
  }

  const handleFinalizeAll = async () => {
    if (processing) return;
    setConfirmFinalizePrompt(true);
  };

  const executeFinalizeAll = async () => {
    setConfirmFinalizePrompt(false);
    setProcessing(true);
    try {
      for (const section of targetSections) {
        const sectionSubjects = subjects.filter(s => s.sectionId === section.id);
        const studentSnap = await getDocs(collection(db, `sections/${section.id}/students`));
        const sectionStudents = studentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student));

        const activeStudents = sectionStudents.filter(s => s.status === 'Active' || !s.status);
        const updatePromises = activeStudents.map(student => {
          let totalWeightedFinals = 0;
          let totalUnits = 0;
          sectionSubjects.forEach(subj => {
            const termsPassed = (subj.offeredTerms || [1, 2, 3, 4])
              .map(t => calculateGrade(student, subj, t as TermNumber).final)
              .filter(f => f > 0);
            if (termsPassed.length > 0) {
              const finalRating = Math.round(termsPassed.reduce((a, b) => a + b, 0) / termsPassed.length);
              const u = (subj.unit !== undefined && subj.unit !== null && subj.unit > 0) ? subj.unit : 1.0;
              totalWeightedFinals += finalRating * u;
              totalUnits += u;
            }
          });

          let finalStatus = 'Retained';
          if (totalUnits > 0) {
            const genAvg = Math.round(totalWeightedFinals / totalUnits);
            finalStatus = genAvg >= 75 ? 'Promoted' : 'Retained';
          }
          return updateDoc(doc(db, `sections/${section.id}/students`, student.id), {
            status: finalStatus
          });
        });

        await Promise.all(updatePromises);
        await updateDoc(doc(db, 'sections', section.id), { isFinalized: true });
      }
      setIsAnySectionFinalized(true);
      setSuccessMessage("Successfully finalized the school grading system for all sections in this school year!");
    } catch (error) {
      console.error("Error finalising all sections:", error);
      setSuccessMessage("An error occurred during finalization.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnfinalizeAll = async () => {
    if (processing) return;
    if (isMainAdmin) {
      setConfirmUnfinalizePrompt(true);
    } else {
      setRequestUnfinalizePrompt(true);
    }
  };

  const submitUnfinalizeRequest = async () => {
    setRequestUnfinalizePrompt(false);
    setProcessing(true);
    try {
      const docRef = doc(db, 'settings', 'general');
      const syToRequest = targetSchoolYear || 'active';
      await updateDoc(docRef, {
        unfinalizeRequests: arrayUnion({
          schoolYear: syToRequest,
          requestedBy: user?.email,
          timestamp: new Date().toISOString()
        })
      });
      setSuccessMessage("Your request to unfinalize the school year has been sent to the Main Admin for approval.");
    } catch (error) {
      console.error("Error sending request:", error);
      setSuccessMessage("Failed to send request.");
    } finally {
      setProcessing(false);
    }
  };

  const executeUnfinalizeAll = async () => {
    setConfirmUnfinalizePrompt(false);
    setProcessing(true);
    try {
      for (const section of targetSections) {
        const studentSnap = await getDocs(collection(db, `sections/${section.id}/students`));
        const sectionStudents = studentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student));

        const updatePromises = sectionStudents.map(student => {
          if (student.status === 'Promoted' || student.status === 'Retained') {
            return updateDoc(doc(db, `sections/${section.id}/students`, student.id), {
              status: deleteField()
            });
          }
          return Promise.resolve();
        });

        await Promise.all(updatePromises);
        await updateDoc(doc(db, 'sections', section.id), { isFinalized: false });
      }
      setIsAnySectionFinalized(false);
      setSuccessMessage("Successfully unfinalized school grading system for all sections in this school year.");
    } catch (error) {
      console.error("Error unfinalising all sections:", error);
      setSuccessMessage("An error occurred during unfinalization.");
    } finally {
      setProcessing(false);
    }
  };

  if (user?.role !== 'system_admin' && user?.role !== 'admin') return null;
  if (targetSections.length === 0) return null;

  if (isAnySectionFinalized) {
    return (
      <div className="mb-6 p-5 bg-indigo-50 border border-indigo-200 rounded-3xl animate-in fade-in slide-in-from-top-3 duration-300 shadow-sm relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/40 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-white/60 transition-colors pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-200 shadow-sm">
              <Sparkles size={22} className="text-indigo-600 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-indigo-950 text-base leading-tight">School Year Finalized ({targetSchoolYear})</h4>
              <p className="text-xs font-semibold text-indigo-700/80 mt-1 max-w-2xl leading-relaxed">
                The school year grading system is currently finalized. All learner promotion/retention statuses and final end-of-year grades have been successfully calculated and set to read-only.
              </p>
            </div>
          </div>
          <button 
            onClick={handleUnfinalizeAll}
            disabled={processing}
            className="shrink-0 bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-50 transition-colors"
          >
            Unfinalize School Year
          </button>
        </div>

        <AnimatePresence>
          {confirmUnfinalizePrompt && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-amber-100 text-amber-600">
                  <AlertTriangle size={32} />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-2">Unfinalize Grades?</h3>
                
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Are you sure you want to revert finalization for all sections under {targetSchoolYear || 'active'} school year? This will reset the promotion and retention statuses for all learners.
                </p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setConfirmUnfinalizePrompt(false)}
                    className="flex-1 py-3 bg-slate-100/80 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeUnfinalizeAll}
                    disabled={processing}
                    className="flex-1 py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                  >
                    Yes, Unfinalize
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {requestUnfinalizePrompt && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-indigo-100 text-indigo-600">
                  <AlertTriangle size={32} />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-2">Request School Year Unfinalization?</h3>
                
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  You do not have direct permission to unfinalize school years. Clicking "Send Request" will notify the Main Admin (jessiemangabo@gmail.com) to unfinalize the {targetSchoolYear || 'active'} school year.
                </p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRequestUnfinalizePrompt(false)}
                    className="flex-1 py-3 bg-slate-100/80 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitUnfinalizeRequest}
                    disabled={processing}
                    className="flex-1 py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                  >
                    Send Request
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {successMessage && (
            <div className="fixed bottom-6 right-6 z-[200]">
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 20 }}
                 className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl shadow-lg border border-emerald-200 font-medium text-sm flex items-center gap-3"
               >
                 <CheckCircle size={18} className="text-emerald-500" />
                 {successMessage}
                 <button onClick={() => setSuccessMessage(null)} className="ml-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-1 rounded-md transition-colors"><X size={14} /></button>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }



  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-250 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-emerald-600 mt-0.5 animate-bounce" />
          </div>
          <div>
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-1 text-emerald-900">Finalize School Year</h4>
            <p className="text-xs font-medium text-emerald-700">You can finalize the entire active school year to lock all student records, stop edits and deletes, and finalize all statuses.</p>
          </div>
        </div>
        <button 
          onClick={handleFinalizeAll}
          disabled={processing || !isSystemAdmin}
          className="self-start sm:self-auto shrink-0 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all uppercase tracking-wider shadow-md shadow-emerald-600/15 cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          {processing ? (
            <Sparkles size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          Finalize School Year
        </button>
      </div>

      <AnimatePresence>
        {confirmFinalizePrompt && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-emerald-100 text-emerald-600">
                <AlertTriangle size={32} />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2">Finalize All Sections?</h3>
              
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Are you sure you want to finalize all sections for {targetSchoolYear || 'active'} school year? This will compute all status automatically and prevent any edits or deletions.
              </p>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setConfirmFinalizePrompt(false)}
                  className="flex-1 py-3 bg-slate-100/80 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeFinalizeAll}
                  disabled={processing}
                  className="flex-1 py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                >
                  Finalize
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatementOfAccountView({ 
  activeSchool, 
  teacherCount, 
  onBack,
  onRenew,
  userProfile
}: { 
  activeSchool: any, 
  teacherCount: number, 
  onBack: () => void,
  onRenew?: (yearIndex: number) => Promise<void>,
  userProfile?: any
}) {
  const [renewingYearIdx, setRenewingYearIdx] = useState<number | null>(null);
  const schoolCreatedAt = activeSchool?.createdAt || new Date().toISOString();
  const createdDate = new Date(schoolCreatedAt);

  const ledger = useMemo(() => {
    const rows = [];
    let grossTotal = 0;
    let promoDiscountTotal = 0;
    let netTotal = 0;
    let amountPaid = 0;
    let currentBalance = 0;

    // Resolve expiration source of truth:
    const finalExpiresAtStr = activeSchool?.expiresAt;
    const expirationDate = finalExpiresAtStr 
      ? new Date(finalExpiresAtStr)
      : new Date(new Date(createdDate).setFullYear(createdDate.getFullYear() + 1));

    // Year 1 (Trial Year) ALWAYS spans from createdDate to 1 year later (or expiration date if shorter)
    const firstYearEnd = new Date(createdDate);
    firstYearEnd.setFullYear(createdDate.getFullYear() + 1);
    
    let currentYearIndex = 1;
    let currentStart = new Date(createdDate);
    let currentEnd = new Date(firstYearEnd);

    // Adjust Year 1 end if expiration is sooner
    if (expirationDate <= firstYearEnd) {
      currentEnd = new Date(expirationDate);
    }

    while (true) {
      const yearIndex = currentYearIndex;
      const start = new Date(currentStart);
      const end = new Date(currentEnd);

      const periodStr = `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
      
      const count = teacherCount || 0;
      let category = 'Small';
      let fee = 599;

      if (count <= 9) {
        category = 'Small';
        fee = 599;
      } else if (count <= 25) {
        category = 'Medium';
        fee = 1199;
      } else if (count <= 100) {
        category = 'Large';
        fee = 2499;
      } else {
        category = 'Mega';
        fee = 4999;
      }

      const isFirstYear = yearIndex === 1;
      const discount = isFirstYear ? fee : 0;
      const netFee = isFirstYear ? 0 : fee;

      // The year is Paid/Settled if it is Year 1 OR if its end date is <= the expirationDate
      const isPaid = isFirstYear || 
                     (end.getTime() <= expirationDate.getTime() + 10000) || 
                     (activeSchool?.paidYears && activeSchool.paidYears.includes(yearIndex));

      const isCurrentSubscriptionExpired = new Date() > expirationDate;

      if (!isPaid && !isCurrentSubscriptionExpired && yearIndex >= 2) {
        break;
      }

      grossTotal += fee;
      promoDiscountTotal += discount;
      netTotal += netFee;

      if (isPaid) {
        amountPaid += netFee;
      } else {
        currentBalance += netFee;
      }

      rows.push({
        yearIndex,
        schoolYearStr: `${start.getFullYear()}-${end.getFullYear()}`,
        periodStr,
        category,
        count,
        fee,
        discount,
        netFee,
        isFirstYear,
        isPaid
      });

      // Break condition: We stop looping once we have generated a year that is unpaid/pending (the succeeding year)
      // or if we have at least shown Year 2.
      if (!isPaid && yearIndex >= 2) {
        break;
      }

      // Prepare for next year
      currentYearIndex++;
      currentStart = new Date(currentEnd);
      
      // If the current year's end is before expirationDate, the next year should extend up to expirationDate
      if (currentEnd < expirationDate) {
        currentEnd = new Date(expirationDate);
      } else {
        const nextEnd = new Date(currentEnd);
        nextEnd.setFullYear(currentEnd.getFullYear() + 1);
        currentEnd = nextEnd;
      }
    }

    return {
      rows,
      grossTotal,
      promoDiscountTotal,
      netTotal,
      amountPaid,
      currentBalance,
      isExpired: new Date() > expirationDate,
      expirationDate
    };
  }, [createdDate, teacherCount, activeSchool, userProfile]);

  const handleExportExcel = () => {
    const ws_data: any[][] = [];

    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F46E5" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    const cellStyle = {
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
    
    const boldCellStyle = {
      font: { bold: true },
      border: cellStyle.border
    };
    
    ws_data.push([{ v: "Statement of Account", s: { font: { bold: true, sz: 16 } } }]);
    ws_data.push([{ v: `SOA Reference: CLASS-SOA-${activeSchool?.schoolId || 'NEW'}-${new Date().getFullYear()}` }]);
    ws_data.push([{ v: `School: ${activeSchool?.name || 'N/A'}` }]);
    ws_data.push([{ v: `School ID: ${activeSchool?.schoolId || 'N/A'}` }]);
    ws_data.push([{ v: `Date Issued: ${new Date().toLocaleDateString()}` }]);
    ws_data.push([]);
    
    ws_data.push([
      { v: "Coverage Period", s: headerStyle },
      { v: "Licensing Tier", s: headerStyle },
      { v: "Teachers Count", s: headerStyle },
      { v: "Base Rate", s: headerStyle },
      { v: "Promos / Discounts", s: headerStyle },
      { v: "Net Subscription Fee", s: headerStyle },
      { v: "Payment Status", s: headerStyle }
    ]);
    
    ledger.rows.forEach(row => {
      ws_data.push([
        { v: `Year ${row.yearIndex} (${row.schoolYearStr})\n${row.periodStr}`, s: cellStyle },
        { v: row.category, s: cellStyle },
        { v: teacherCount, s: cellStyle },
        { v: row.fee, t: "n", z: "₱#,##0.00", s: cellStyle },
        { v: row.discount > 0 ? -row.discount : 0, t: "n", z: "₱#,##0.00", s: cellStyle },
        { v: row.netFee, t: "n", z: "₱#,##0.00", s: cellStyle },
        { v: row.isPaid ? 'PAID' : 'UNPAID', s: cellStyle }
      ]);
    });
    
    ws_data.push([]);
    ws_data.push(["", "", "", "", { v: "Total Subscription Price:", s: boldCellStyle }, { v: ledger.netTotal, t: "n", z: "₱#,##0.00", s: boldCellStyle }]);
    ws_data.push(["", "", "", "", { v: "Amount Paid:", s: boldCellStyle }, { v: ledger.amountPaid, t: "n", z: "₱#,##0.00", s: boldCellStyle }]);
    ws_data.push(["", "", "", "", { v: "Action Required / Balance due:", s: boldCellStyle }, { v: ledger.currentBalance, t: "n", z: "₱#,##0.00", s: boldCellStyle }]);
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    ws['!cols'] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 }
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statement of Account");
    
    XLSX.writeFile(wb, `SOA_${activeSchool?.schoolId || 'NEW'}_${new Date().getFullYear()}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Back & Actions - Hidden during print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 print:hidden">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-bold text-sm bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Active Sections
        </button>
        
        <div className="flex items-center gap-3 font-mono">
          <button 
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 text-emerald-750 hover:text-emerald-900 font-bold text-xs bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 shadow-sm transition-all cursor-pointer"
          >
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Main Print Wrapper */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden print:overflow-hidden print:border-0 print:shadow-none print:rounded-none">
        
        {/* Top Header Decors / Corporate Ribbon (hidden in print) */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 h-2.5 print:hidden"></div>

        {/* Invoice Structure */}
        <div className="p-8 md:p-12 space-y-10">
          
          {/* Brand & Metas */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black tracking-tighter shadow-md">
                  <span className="text-lg font-sans">E</span>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">CLASS Enterprise Solution</h2>
                  <p className="text-[10px] text-indigo-600 font-black tracking-widest uppercase">Class Record Solutions</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Real-Time Cloud Ledger & Continuous Gradebook Integration Service
              </p>
            </div>
            
            <div className="md:text-right space-y-1 font-mono text-xs text-slate-500">
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider block w-fit md:ml-auto mb-2 print:border print:border-indigo-100 print:text-indigo-900">
                Statement of Account
              </span>
              <p><span className="font-semibold text-slate-800">SOA Reference:</span> CLASS-SOA-{activeSchool?.schoolId || 'NEW'}-{new Date().getFullYear()}</p>
              <p><span className="font-semibold text-slate-800">Date Issued:</span> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p><span className="font-semibold text-slate-800">Valid Until:</span> {ledger.expirationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p><span className="font-semibold text-slate-800">Status:</span> 
                {ledger.isExpired ? (
                  <span className="text-rose-600 font-extrabold uppercase ml-1 bg-rose-50 px-1 rounded">Expired Account</span>
                ) : (
                  <span className="text-emerald-700 font-extrabold uppercase ml-1">Active Account</span>
                )}
              </p>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 print:bg-white print:border-slate-200">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statement For:</h3>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">{activeSchool?.name || 'Authorized DepEd School'}</p>
                <p className="text-xs text-slate-500 font-semibold">School ID: <span className="font-mono">{activeSchool?.schoolId || 'N/A'}</span></p>
                {activeSchool?.headOfSchool && <p className="text-xs text-slate-500">Head of School: <span className="font-semibold">{activeSchool.headOfSchool}</span></p>}
                <p className="text-xs text-slate-400">
                  {activeSchool?.division} Division {activeSchool?.district && `• ${activeSchool.district}`} • {activeSchool?.region || 'DepEd'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Issued By:</h3>
              <div className="space-y-1 text-slate-600 text-xs">
                <p className="text-sm font-bold text-slate-900">CLASS Enterprise Solution</p>
                <p>Support & Accounts Desk</p>
                <p>Email: <span className="font-mono">jessiemangabo@gmail.com</span></p>
                <p>Hotline: <span className="font-mono">0905 152 6827</span></p>
                <p className="text-[10px] text-slate-400 italic">Enterprise Cloud Invoicing Division</p>
              </div>
            </div>
          </div>

          {/* Ledger Table Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt size={16} className="text-indigo-600 animate-pulse" />
              Annual Subscription History & Breakdown
            </h3>
            
            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Subscription Year</th>
                    <th className="px-6 py-4">Coverage Period</th>
                    <th className="px-6 py-4">Licensing Tier</th>
                    <th className="px-6 py-4">Teachers Count</th>
                    <th className="px-6 py-4 text-right">Base rate</th>
                    <th className="px-6 py-4 text-right">Promos / Discounts</th>
                    <th className="px-6 py-4 text-right">Net annual Fee</th>
                    <th className="px-6 py-4 text-right print:hidden">Status / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {ledger.rows.map((row) => (
                    <tr key={row.yearIndex} className={row.yearIndex === 2 ? 'bg-indigo-50/25 border-l-2 border-indigo-500' : ''}>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">Year {row.yearIndex} Subscription</p>
                          <p className="text-[9px] text-slate-400 font-mono">SY {row.schoolYearStr}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-[11px] font-mono">
                        {row.periodStr}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                          {row.category} Tier
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {row.count} active {row.count === 1 ? 'teacher' : 'teachers'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-500">
                        ₱{row.fee.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-600">
                        {row.isFirstYear ? (
                          <span>-₱{row.discount.toLocaleString()} (100% Promo)</span>
                        ) : (
                          <span className="text-slate-400">₱0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold font-mono text-slate-900">
                        {row.isFirstYear ? (
                          <span className="text-emerald-600 font-extrabold">₱0 (Free Promo)</span>
                        ) : (
                          <span>₱{row.netFee.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right print:hidden">
                        {row.isPaid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-750 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-150 text-[10px] font-extrabold uppercase">
                            <CheckCircle size={12} className="text-emerald-600" /> Paid & Settled
                          </span>
                        ) : (
                          <button
                            id={`pay-btn-year-${row.yearIndex}`}
                            onClick={async () => {
                              try {
                                setRenewingYearIdx(row.yearIndex);
                                if (onRenew) {
                                  await onRenew(row.yearIndex);
                                }
                              } catch (err) {
                                console.error("Error during renewal: ", err);
                              } finally {
                                setRenewingYearIdx(null);
                              }
                            }}
                            disabled={renewingYearIdx !== null}
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-300 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-xl shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95 text-center uppercase"
                          >
                            {renewingYearIdx === row.yearIndex ? (
                              <svg className="animate-spin -ml-0.5 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : null}
                            PAID
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* totals calculation box */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 pt-4">
            <div className="space-y-3 max-w-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Account Settlement Policy</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                🔒 Subscription Year 1 (First 12 Months) introductory access is 100% sponsored under the trial program promotion.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Subsequent renewals (Year 2 onwards) are calculated in real-time according to total registered educator profiles active on the roster. No credit check or upfront collateral required.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full md:w-80 space-y-3 font-mono text-xs print:bg-white">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 font-sans">Payment Summary</h4>
              
              <div className="flex justify-between text-slate-500">
                <span>Total Base Value:</span>
                <span>₱{ledger.grossTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Promo Discounts:</span>
                <span>-₱{ledger.promoDiscountTotal.toLocaleString()}</span>
              </div>
              
              <div className="w-full h-px bg-slate-200 my-2"></div>
              
              <div className="flex justify-between text-slate-900 font-bold text-sm">
                <span className="font-sans">Total Subscription Price:</span>
                <span>₱{ledger.netTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-indigo-600 font-bold">
                <span>Amount Paid:</span>
                <span>-₱{ledger.amountPaid.toLocaleString()}</span>
              </div>

              <div className="w-full h-px bg-slate-200 my-2"></div>

              <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-dashed border-slate-300">
                <span className="font-sans">Current Balance:</span>
                <span className="text-indigo-600">₱{ledger.currentBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment execution details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Option 1: GCash Transfer</span>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Send payment to GCash Merchant ID: <strong className="font-mono text-slate-800">0905 152 6827</strong><br/>
                Quote reference: <strong className="font-mono text-slate-800">{activeSchool?.schoolId}</strong>.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Option 2: Bank transfer</span>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Land Bank of the Philippines (LBP)<br/>
                Account Name: <strong className="text-slate-800">Jessie J. Mangabo</strong><br/>
                Account Number: <strong className="font-mono text-slate-800">107 640 6444</strong>
              </p>
            </div>
          </div>

          {/* Final signatures */}
          <div className="flex justify-between items-end pt-12 border-t border-slate-100 text-xs">
            <div className="space-y-1">
              <p className="text-slate-400 font-medium">Prepared by:</p>
              <div className="w-40 h-px bg-slate-300 my-2"></div>
              <p className="font-bold text-slate-800">Enterprise Billing Desk</p>
              <p className="text-[10px] text-slate-400 font-mono">ID: CLASS-78904</p>
            </div>

            <div className="space-y-1 text-right">
              <p className="text-slate-400 font-medium">Verified For Authorization:</p>
              <div className="w-40 h-px bg-slate-300 my-2 ml-auto"></div>
              <p className="font-bold text-slate-800">{activeSchool?.headOfSchool || 'School Administrator'}</p>
              <p className="text-[10px] text-slate-400">Head / Principal Representative</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SectionsView({ 
  sections, 
  expiredSchoolIds = [],
  onOpenThemeModal,
  onSelect, 
  onCreate,
  onUpdate,
  onDelete,
  onSelectSubject,
  onSetActiveTab,
  onNavigateToSubject,
  user,
  onUpdateUser,
  onLogout,
  onManageUsers,
  onScanID,
  pendingUsersCount = 0,
  isAnySectionAdviser,
  onManageSchools,
  onManageSchoolYears,
  onManageCalendar,
  onManageStudentList,
  onShowFinancialStatement,
  onShowSF4,
  onShowSF7,
  isAuthorizedCashier,
  onShowFeedback,
  isFeedbackOpen,
  onCloseFeedback,
  onShowFeedbackDashboard,
  globalSettings,
  subjects,
  globalSubjects,
  schoolCalendar,
  onToggleFinalizeSubjectTerm,
  activeSchool = null,
  teacherCount = 0,
  onRenew,
  aralSchoolInfo,
  onUpdateAralSchool,
  aralCompetencies,
  onAddAralCompetency,
  onDeleteAralCompetency,
  mapUserRoleToAralRole,
  aralClasses = [],
  onCreateAralClass,
  onUpdateAralClass,
  onDeleteAralClass,
  selectedAralClassId,
  onSelectAralClassId
}: { 
  sections: Section[], 
  expiredSchoolIds?: string[],
  onOpenThemeModal?: () => void,
  onSelect: (s: Section) => void,
  onCreate: (data: any) => void,
  onUpdate: (id: string, data: any) => void,
  onDelete: (id: string, action?: 'approve' | 'disapprove' | 'cancel' | 'request' | 'delete', reason?: string) => void,
  onSelectSubject: (id: string) => void,
  onSetActiveTab: (tab: string) => void,
  onNavigateToSubject: (s: Section, subName: string) => void,
  user: UserProfile | null,
  onUpdateUser?: (p: UserProfile) => void,
  onLogout: () => void,
  onManageUsers?: () => void,
  onScanID?: () => void,
  pendingUsersCount?: number,
  isAnySectionAdviser?: boolean,
  onManageSchools?: () => void,
  onManageSchoolYears?: () => void,
  onManageCalendar?: () => void,
  onManageStudentList?: () => void,
  onShowFinancialStatement?: () => void,
  onShowSF4?: () => void,
  onShowSF7?: () => void,
  isAuthorizedCashier?: boolean,
  onShowFeedback: () => void,
  isFeedbackOpen: boolean,
  onCloseFeedback: () => void,
  onShowFeedbackDashboard?: () => void,
  globalSettings?: any,
  subjects: Subject[],
  globalSubjects?: Subject[],
  schoolCalendar: any[],
  onToggleFinalizeSubjectTerm?: (subjectId: string, term: TermNumber, finalize: boolean) => void,
  activeSchool?: any,
  teacherCount?: number,
  onRenew?: (yearIndex: number) => Promise<void>,
  aralSchoolInfo: AralSchoolInfo,
  onUpdateAralSchool: (info: AralSchoolInfo) => void,
  aralCompetencies: AralCompetency[],
  onAddAralCompetency: (comp: AralCompetency) => void,
  onDeleteAralCompetency: (id: string) => void,
  mapUserRoleToAralRole: (role?: string, email?: string) => AralRole,
  aralClasses?: AralClass[],
  onCreateAralClass?: (gradeLevel: number, name: string, tutorName: string, tutorEmail: string, studentIds: string[], targetSubject?: string) => void,
  onUpdateAralClass?: (classId: string, tutorName: string, tutorEmail: string, studentIds: string[], targetSubject?: string, name?: string, gradeLevel?: number) => void,
  onDeleteAralClass?: (classId: string) => void,
  selectedAralClassId?: string | null,
  onSelectAralClassId?: (classId: string | null) => void
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(true);
  const [showSOA, setShowSOA] = useState(false);
  const [isBannerPaying, setIsBannerPaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [isSectionEmpty, setIsSectionEmpty] = useState<boolean | null>(null);
  const [sectionToEdit, setSectionToEdit] = useState<Section | null>(null);
  const [disapprovalReason, setDisapprovalReason] = useState("");
  const [requestDeletionReason, setRequestDeletionReason] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [confirmFinalizeConfig, setConfirmFinalizeConfig] = useState<{ subjectId: string, term: number, finalize: boolean } | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [collapsedAdminGrades, setCollapsedAdminGrades] = useState<Set<number>>(new Set());
  const [openAdminMenu, setOpenAdminMenu] = useState<string | null>(null);

  const hasAssignedSubjects = useMemo(() => {
    return subjects.some(s => (s.teacherEmail || "").toLowerCase() === (user?.email || "").toLowerCase()) ||
           sections.some(sec => sec.teacherSubjects && Object.values(sec.teacherSubjects).map((e: any) => (e || "").toLowerCase()).includes((user?.email || "").toLowerCase()));
  }, [subjects, sections, user]);

  const adminGroupedOverview = useMemo(() => {
    const groups: {
      [gradeLevel: number]: {
        [sectionId: string]: {
          sectionName: string;
          sectionObj: Section | undefined;
          subjects: Subject[];
        }
      }
    } = {};

    subjects.forEach(sub => {
      const sectionObj = sections.find(s => s.id === sub.sectionId);
      let gradeLevel = sub.gradeLevel;
      let sectionId = sub.sectionId || 'unknown';
      let sectionName = 'Unassigned Section';

      if (sectionObj) {
        gradeLevel = sectionObj.gradeLevel;
        sectionName = sectionObj.name;
      }

      if (!groups[gradeLevel]) {
        groups[gradeLevel] = {};
      }

      if (!groups[gradeLevel][sectionId]) {
        groups[gradeLevel][sectionId] = {
          sectionName,
          sectionObj,
          subjects: []
        };
      }

      groups[gradeLevel][sectionId].subjects.push(sub);
    });

    return groups;
  }, [subjects, sections]);

  const adminSortedGradeLevels = useMemo(() => {
    return Object.keys(adminGroupedOverview).map(Number).sort((a, b) => a - b);
  }, [adminGroupedOverview]);

  const [isListOpen, setIsListOpen] = useState(true);
  
  const [isSchoolDbFinalized, setIsSchoolDbFinalized] = useState(false);

  const [isUploadingDashboard, setIsUploadingDashboard] = useState(false);

  const downloadDashboardCSVTemplate = () => {
    const headers = "LastName,FirstName,MiddleName,NameExt,LRN,Email,Birthdate,Age,Sex,GradeLevel,Section,DateOfFirstAttendance,Weight_kg,Height_cm,EligibilityType,GenAvg,Citation,ElemSchoolName,ElemSchoolId,ElemSchoolAddress,PEPTRating,PEPTDate,ALSRating,ALSCenterInfo,OthersSpecify,IsTransferredIn,Birthplace,HomeAddress,PrimaryContact,FatherName,MotherName,GuardianName,GuardianRelationship,ContactNumber";
    const example1 = "Dela Cruz,Juan,,Jr,123456789012,juan.delacruz@email.com,2010-01-15,12,Male,7,Einstein,2023-06-05,45,150,Elementary School Completer,85.50,,,Rizal Elem School,123456,,,,,,No,Manila,123 Rizal St. Manila,father,Juan Dela Cruz Sr.,Maria Dela Cruz,,,09123456789";
    const example2 = "Santos,Maria,G,,987654321098,maria.santos@email.com,2011-03-20,11,Female,7,Einstein,2023-06-05,42,148,PEPT Passer.,,,,,,,80.20,2022-05-15,,,,Yes,Quezon City,456 Quezon Ave. QC,mother,Pedro Santos,Maria Santos,,,09876543210";
    const csvContent = `${headers}\n${example1}\n${example2}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_enrollment_dashboard_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const [uploadSuccessDashboard, setUploadSuccessDashboard] = useState(false);
  const [pendingLearnersDashboard, setPendingLearnersDashboard] = useState<any[]>([]);
  const [showSelectionModalDashboard, setShowSelectionModalDashboard] = useState(false);
  const [selectedIndicesDashboard, setSelectedIndicesDashboard] = useState<Set<number>>(new Set());
  const [bulkFirstAttendanceDateDashboard, setBulkFirstAttendanceDateDashboard] = useState("");

  const handleDashboardFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDashboard(true);
    setUploadSuccessDashboard(false);
    
    const reader = new window.FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const learners: any[] = [];

      // Determine helper mappings
      let lastNameColIdx = 0;
      let firstNameColIdx = 1;
      let middleNameColIdx = 2;
      let extensionColIdx = 3;
      let lrnColIdx = 4;
      let emailColIdx = 5;
      let birthdateColIdx = 6;
      let ageColIdx = 7;
      let sexColIdx = 8;
      let gradeLevelColIdx = -1;
      let sectionColIdx = -1;
      let dateColIdx = 9;
      let weightColIdx = 10;
      let heightColIdx = 11;
      let eligibilityTypeColIdx = 12;
      let genAvgColIdx = 13;
      let citationColIdx = 14;
      let elemSchoolNameColIdx = 15;
      let elemSchoolIdColIdx = 16;
      let elemSchoolAddressColIdx = 17;
      let peptRatingColIdx = 18;
      let peptDateColIdx = 19;
      let alsRatingColIdx = 20;
      let alsCenterInfoColIdx = 21;
      let othersSpecifyColIdx = 22;

      let isTransferredInColIdx = -1;
      let birthplaceColIdx = -1;
      let homeAddressColIdx = -1;
      let primaryContactColIdx = -1;
      let fatherNameColIdx = -1;
      let motherNameColIdx = -1;
      let guardianNameColIdx = -1;
      let guardianRelationshipColIdx = -1;
      let contactNumberColIdx = -1;

      const firstLine = lines[0];
      if (firstLine && (firstLine.toLowerCase().includes('lastname') || firstLine.toLowerCase().includes('lrn') || firstLine.toLowerCase().includes('name'))) {
        const headerParts: string[] = [];
        let p = '', inQuote = false;
        for (let i = 0; i < firstLine.length; i++) {
          let c = firstLine[i];
          if (c === '"' && firstLine[i+1] === '"') {
            p += '"'; i++;
          } else if (c === '"') {
            inQuote = !inQuote;
          } else if (c === ',' && !inQuote) {
            headerParts.push(p.trim().toLowerCase()); p = '';
          } else {
            p += c;
          }
        }
        headerParts.push(p.trim().toLowerCase());

        lastNameColIdx = headerParts.indexOf("lastname");
        firstNameColIdx = headerParts.indexOf("firstname");
        middleNameColIdx = headerParts.indexOf("middlename");
        extensionColIdx = headerParts.indexOf("nameext");
        if (extensionColIdx === -1) extensionColIdx = headerParts.indexOf("ext");
        if (extensionColIdx === -1) extensionColIdx = headerParts.indexOf("extension");
        lrnColIdx = headerParts.indexOf("lrn");
        emailColIdx = headerParts.indexOf("email");
        birthdateColIdx = headerParts.indexOf("birthdate");
        ageColIdx = headerParts.indexOf("age");
        sexColIdx = headerParts.indexOf("sex");
        gradeLevelColIdx = headerParts.indexOf("gradelevel");
        sectionColIdx = headerParts.indexOf("section");
        dateColIdx = headerParts.indexOf("dateoffirstattendance");
        weightColIdx = headerParts.indexOf("weight_kg");
        if (weightColIdx === -1) weightColIdx = headerParts.indexOf("weight");
        heightColIdx = headerParts.indexOf("height_cm");
        if (heightColIdx === -1) heightColIdx = headerParts.indexOf("height");
        eligibilityTypeColIdx = headerParts.indexOf("eligibilitytype");
        genAvgColIdx = headerParts.indexOf("genavg");
        citationColIdx = headerParts.indexOf("citation");
        elemSchoolNameColIdx = headerParts.indexOf("elemschoolname");
        elemSchoolIdColIdx = headerParts.indexOf("elemschoolid");
        elemSchoolAddressColIdx = headerParts.indexOf("elemschooladdress");
        peptRatingColIdx = headerParts.indexOf("peptrating");
        peptDateColIdx = headerParts.indexOf("peptdate");
        alsRatingColIdx = headerParts.indexOf("alsrating");
        alsCenterInfoColIdx = headerParts.indexOf("alscenterinfo");
        othersSpecifyColIdx = headerParts.indexOf("othersspecify");

        isTransferredInColIdx = headerParts.indexOf("istransferredin");
        birthplaceColIdx = headerParts.indexOf("birthplace");
        homeAddressColIdx = headerParts.indexOf("homeaddress");
        if (homeAddressColIdx === -1) homeAddressColIdx = headerParts.indexOf("address");
        primaryContactColIdx = headerParts.indexOf("primarycontact");
        fatherNameColIdx = headerParts.indexOf("fathername");
        motherNameColIdx = headerParts.indexOf("mothername");
        guardianNameColIdx = headerParts.indexOf("guardianname");
        guardianRelationshipColIdx = headerParts.indexOf("guardianrelationship");
        contactNumberColIdx = headerParts.indexOf("contactnumber");
      }

      // Fallbacks
      if (lastNameColIdx === -1) lastNameColIdx = 0;
      if (firstNameColIdx === -1) firstNameColIdx = 1;
      if (middleNameColIdx === -1) middleNameColIdx = 2;
      if (extensionColIdx === -1) extensionColIdx = 3;
      if (lrnColIdx === -1) lrnColIdx = 4;
      if (emailColIdx === -1) emailColIdx = 5;
      if (birthdateColIdx === -1) birthdateColIdx = 6;
      if (ageColIdx === -1) ageColIdx = 7;
      if (sexColIdx === -1) sexColIdx = 8;

      if (gradeLevelColIdx !== -1 && sectionColIdx !== -1) {
        if (dateColIdx === -1) dateColIdx = 11;
        if (weightColIdx === -1) weightColIdx = 12;
        if (heightColIdx === -1) heightColIdx = 13;
        if (eligibilityTypeColIdx === -1) eligibilityTypeColIdx = 14;
        if (genAvgColIdx === -1) genAvgColIdx = 15;
        if (citationColIdx === -1) citationColIdx = 16;
        if (elemSchoolNameColIdx === -1) elemSchoolNameColIdx = 17;
        if (elemSchoolIdColIdx === -1) elemSchoolIdColIdx = 18;
        if (elemSchoolAddressColIdx === -1) elemSchoolAddressColIdx = 19;
        if (peptRatingColIdx === -1) peptRatingColIdx = 20;
        if (peptDateColIdx === -1) peptDateColIdx = 21;
        if (alsRatingColIdx === -1) alsRatingColIdx = 22;
        if (alsCenterInfoColIdx === -1) alsCenterInfoColIdx = 23;
        if (othersSpecifyColIdx === -1) othersSpecifyColIdx = 24;

        if (isTransferredInColIdx === -1) isTransferredInColIdx = 25;
        if (birthplaceColIdx === -1) birthplaceColIdx = 26;
        if (homeAddressColIdx === -1) homeAddressColIdx = 27;
        if (primaryContactColIdx === -1) primaryContactColIdx = 28;
        if (fatherNameColIdx === -1) fatherNameColIdx = 29;
        if (motherNameColIdx === -1) motherNameColIdx = 30;
        if (guardianNameColIdx === -1) guardianNameColIdx = 31;
        if (guardianRelationshipColIdx === -1) guardianRelationshipColIdx = 32;
        if (contactNumberColIdx === -1) contactNumberColIdx = 33;
      } else {
        if (dateColIdx === -1) dateColIdx = 9;
        if (weightColIdx === -1) weightColIdx = 10;
        if (heightColIdx === -1) heightColIdx = 11;
        if (eligibilityTypeColIdx === -1) eligibilityTypeColIdx = 12;
        if (genAvgColIdx === -1) genAvgColIdx = 13;
        if (citationColIdx === -1) citationColIdx = 14;
        if (elemSchoolNameColIdx === -1) elemSchoolNameColIdx = 15;
        if (elemSchoolIdColIdx === -1) elemSchoolIdColIdx = 16;
        if (elemSchoolAddressColIdx === -1) elemSchoolAddressColIdx = 17;
        if (peptRatingColIdx === -1) peptRatingColIdx = 18;
        if (peptDateColIdx === -1) peptDateColIdx = 19;
        if (alsRatingColIdx === -1) alsRatingColIdx = 20;
        if (alsCenterInfoColIdx === -1) alsCenterInfoColIdx = 21;
        if (othersSpecifyColIdx === -1) othersSpecifyColIdx = 22;

        if (isTransferredInColIdx === -1) isTransferredInColIdx = 23;
        if (birthplaceColIdx === -1) birthplaceColIdx = 24;
        if (homeAddressColIdx === -1) homeAddressColIdx = 25;
        if (primaryContactColIdx === -1) primaryContactColIdx = 26;
        if (fatherNameColIdx === -1) fatherNameColIdx = 27;
        if (motherNameColIdx === -1) motherNameColIdx = 28;
        if (guardianNameColIdx === -1) guardianNameColIdx = 29;
        if (guardianRelationshipColIdx === -1) guardianRelationshipColIdx = 30;
        if (contactNumberColIdx === -1) contactNumberColIdx = 31;
      }

      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;
        
        // Skip header if it matches keywords
        if (index === 0 && (trimmedLine.toLowerCase().includes('name') || trimmedLine.toLowerCase().includes('lrn') || trimmedLine.toLowerCase().includes('lastname'))) return; 
        
        const parts: string[] = [];
        let p = '', inQuote = false;
        for (let i = 0; i < trimmedLine.length; i++) {
          let c = trimmedLine[i];
          if (c === '"' && trimmedLine[i+1] === '"') {
            p += '"'; i++;
          } else if (c === '"') {
            inQuote = !inQuote;
          } else if (c === ',' && !inQuote) {
            parts.push(p.trim()); p = '';
          } else {
            p += c;
          }
        }
        parts.push(p.trim());

        if (parts.length >= 5) {
          const lastName = parts[lastNameColIdx] || "";
          const firstName = parts[firstNameColIdx] || "";
          const middleName = parts[middleNameColIdx] || "";
          const extension = parts[extensionColIdx] || "";
          const lrn = parts[lrnColIdx] || "";
          const email = parts[emailColIdx] || "";
          const birthdate = parts[birthdateColIdx] || "";
          const age = parts[ageColIdx] || "";
          const sexInput = parts[sexColIdx] || "Male";
          const dateInput = parts[dateColIdx] || "";
          const weight = parts[weightColIdx] || "";
          const height = parts[heightColIdx] || "";
          
          const eligibilityTypeRaw = parts[eligibilityTypeColIdx] || "";
          let eligibilityType: 'Elementary School Completer' | 'PEPT Passer' | 'ALS A & E Passer' | 'Others' = 'Elementary School Completer';
          if (eligibilityTypeRaw.toLowerCase().includes('pept')) eligibilityType = 'PEPT Passer';
          else if (eligibilityTypeRaw.toLowerCase().includes('als')) eligibilityType = 'ALS A & E Passer';
          else if (eligibilityTypeRaw.toLowerCase().includes('other')) eligibilityType = 'Others';

          const eligibility = {
            type: eligibilityType,
            genAvg: parts[genAvgColIdx] || "",
            citation: parts[citationColIdx] || "",
            elemSchoolName: parts[elemSchoolNameColIdx] || "",
            elemSchoolId: parts[elemSchoolIdColIdx] || "",
            elemSchoolAddress: parts[elemSchoolAddressColIdx] || "",
            peptRating: parts[peptRatingColIdx] || "",
            peptDate: parts[peptDateColIdx] || "",
            alsRating: parts[alsRatingColIdx] || "",
            alsCenterInfo: parts[alsCenterInfoColIdx] || "",
            othersSpecify: parts[othersSpecifyColIdx] || ""
          };

          const isTransferredInRaw = parts[isTransferredInColIdx] || "";
          const isTransferredIn = isTransferredInRaw.toLowerCase().includes('yes') || isTransferredInRaw.toLowerCase().includes('true') || isTransferredInRaw === '1';
          const birthplace = parts[birthplaceColIdx] || "";
          const address = parts[homeAddressColIdx] || "";
          let primaryContact = (parts[primaryContactColIdx] || "father").toLowerCase();
          if (primaryContact !== 'father' && primaryContact !== 'mother' && primaryContact !== 'guardian') {
            primaryContact = 'father';
          }
          const fatherName = parts[fatherNameColIdx] || "";
          const motherName = parts[motherNameColIdx] || "";
          const guardianName = parts[guardianNameColIdx] || "";
          const guardianRelationship = parts[guardianRelationshipColIdx] || "";
          const contactNumber = parts[contactNumberColIdx] || "";

          // Generate full name automatically
          const nameParts = [
            lastName + (firstName ? "," : ""),
            firstName,
            middleName,
            extension
          ].filter(Boolean);
          const name = nameParts.join(" ").trim();

          if (lastName && firstName && lrn) {
            const { bmi, category } = computeBMI(parseFloat(weight) || 0, parseFloat(height) || 0);
            
            // Robust sex detection
            let finalSex: 'Male' | 'Female' = 'Male';
            const sValue = sexInput.toLowerCase();
            if (sValue.startsWith('f') || sValue.includes('girl') || sValue.includes('female')) {
               finalSex = 'Female';
            }

            learners.push({
              lastName,
              firstName,
              middleName,
              extension,
              name,
              lrn,
              email: email.toLowerCase(),
              birthdate,
              age: parseInt(age) || 0,
              sex: finalSex,
              dateOfFirstAttendance: dateInput,
              weight: parseFloat(weight) || 0,
              height: parseFloat(height) || 0,
              bmi,
              gradeLevel: gradeLevelColIdx !== -1 ? parts[gradeLevelColIdx] || "" : "",
              section: sectionColIdx !== -1 ? parts[sectionColIdx] || "" : "",
              nutritionalStatus: {
                bmiCategory: category
              },
              eligibility,
              isTransferredIn,
              birthplace,
              address,
              primaryContact,
              fatherName,
              motherName,
              guardianName,
              guardianRelationship,
              contactNumber
            });
          }
        }
      });

      if (learners.length > 0) {
        setPendingLearnersDashboard(learners);
        // Default select only those matching actual sections in the list
        const validIndices = new Set<number>();
        learners.forEach((l, idx) => {
          const hasSection = sections.some(sec => {
            const csvSecName = (l.section || "").trim().toLowerCase();
            const dbSecName = (sec.name || "").trim().toLowerCase();
            const csvGrade = (l.gradeLevel || "").trim();
            const dbGrade = String(sec.gradeLevel || "").trim();
            return csvSecName === dbSecName && (csvGrade === "" || csvGrade === dbGrade);
          });
          if (hasSection) {
            validIndices.add(idx);
          }
        });
        setSelectedIndicesDashboard(validIndices);
        setShowSelectionModalDashboard(true);
      } else {
        alert("No valid learners parsed from CSV. Please verify columns.");
      }
      setIsUploadingDashboard(false);
      // Reset input element value
      e.target.value = "";
    };
    reader.onerror = () => {
      alert("Error reading file.");
      setIsUploadingDashboard(false);
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (!user?.schoolId) return;
    const q = query(collection(db, "schools"), where("schoolId", "==", user.schoolId));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setIsSchoolDbFinalized(snap.docs[0].data().isFinalized || false);
      } else {
        setIsSchoolDbFinalized(false);
      }
    }, (err) => {
      console.error("Error checking school finalized status:", err);
    });
    return () => unsub();
  }, [user?.schoolId]);
  
  // Real-time listener for behavioral records
  const [behavioralRecords, setBehavioralRecords] = useState<AnecdotalRecord[]>([]);
  const [loadingBehavioral, setLoadingBehavioral] = useState(true);

  // States to read, open and fill "Action Taken / Interventions Conducted"
  const [activeBehavioralRecordSection, setActiveBehavioralRecordSection] = useState<Section | null>(null);
  const [showBehavioralRecordsPopup, setShowBehavioralRecordsPopup] = useState(false);
  const [selectedRecordToFill, setSelectedRecordToFill] = useState<AnecdotalRecord | null>(null);
  const [formActionTaken, setFormActionTaken] = useState("");
  const [isSavingAction, setIsSavingAction] = useState(false);

  useEffect(() => {
    if (!db) return;
    setLoadingBehavioral(true);
    const recordsCol = collection(db, 'anecdotal_records');
    const q = query(recordsCol, where('category', '==', 'behavioral'));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as unknown as AnecdotalRecord);
      // Sort newest first
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setBehavioralRecords(list);
      setLoadingBehavioral(false);
    }, (err) => {
      console.error("Error loading behavioral records in SectionsView:", err);
      setLoadingBehavioral(false);
    });

    return () => unsub();
  }, []);

  const handleSaveActionTaken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordToFill) return;
    setIsSavingAction(true);
    try {
      const recordDocRef = doc(db, 'anecdotal_records', selectedRecordToFill.id);
      await updateDoc(recordDocRef, {
        actionTaken: formActionTaken.trim()
      });
      // Update our selected view
      setSelectedRecordToFill(prev => prev ? { ...prev, actionTaken: formActionTaken.trim() } : null);
      alert("Action Taken / Interventions Conducted has been documented successfully!");
    } catch (err) {
      console.error("Failed to update action taken:", err);
      alert("Error documenting actions. Please try again.");
    } finally {
      setIsSavingAction(false);
    }
  };
  
  const isGlobalFinalized = useMemo(() => {
    return globalSettings?.finalizedSchoolYears?.includes(globalSettings?.activeSchoolYear);
  }, [globalSettings]);

  const isEntireSchoolFinalized = useMemo(() => {
    const activeYear = globalSettings?.activeSchoolYear;
    if (!activeYear) return false;
    const activeSections = sections.filter(s => s.schoolYear === activeYear);
    if (activeSections.length === 0) return false;
    return activeSections.every(s => s.isFinalized);
  }, [sections, globalSettings?.activeSchoolYear]);

  useEffect(() => {
    if (sectionToDelete && (user?.role === 'system_admin' || user?.role === 'admin' || user?.role === 'teacher')) {
      const checkEmpty = async () => {
        // Check subjects first (already in state)
        const subjCount = subjects.filter(s => s.sectionId === sectionToDelete.id).length;
        if (subjCount > 0) {
          setIsSectionEmpty(false);
          return;
        }
        
        // Check students subcollection
        try {
          const studentSnap = await getDocs(query(collection(db, `sections/${sectionToDelete.id}/students`), limit(1)));
          setIsSectionEmpty(studentSnap.empty);
        } catch (err) {
          console.error("Error checking section emptiness:", err);
          setIsSectionEmpty(false); // Default to safe (not empty) if error
        }
      };
      checkEmpty();
    } else {
      setIsSectionEmpty(null);
    }
  }, [sectionToDelete, subjects, user]);

  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('home_filters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved filters", e);
      }
    }
    return {
      schoolYear: '',
      region: '',
      division: '',
      district: '',
      visibility: 'all',
      gradeLevel: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('home_filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    // Automatically set the school year filter to the active school year if none is selected
    // and only if we haven't explicitly set schoolYear before (either in this session or from storage)
    // Actually, if it's empty, and we have an active year, it's better to just set it.
    if (!filters.schoolYear && globalSettings?.activeSchoolYear) {
      setFilters(prev => ({ ...prev, schoolYear: globalSettings.activeSchoolYear }));
    }
  }, [globalSettings?.activeSchoolYear]);

  const isFiltered = filters.schoolYear !== '' || filters.region !== '' || filters.division !== '' || filters.district !== '' || filters.visibility !== 'all';

  const subDetails = useMemo(() => {
    const count = teacherCount || 0;
    let category = 'Small';
    let fee = 599;

    if (count <= 9) {
      category = 'Small';
      fee = 599;
    } else if (count <= 25) {
      category = 'Medium';
      fee = 1199;
    } else if (count <= 100) {
      category = 'Large';
      fee = 2499;
    } else {
      category = 'Mega';
      fee = 4999;
    }

    let isFreeAccess = false;
    let expirationDateStr = '';
    const schoolCreatedAt = activeSchool?.createdAt || new Date().toISOString();
    const createdDate = new Date(schoolCreatedAt);

    const finalExpiresAtStr = activeSchool?.expiresAt;
    const expirationDate = finalExpiresAtStr ? new Date(finalExpiresAtStr) : new Date(new Date(createdDate).setFullYear(createdDate.getFullYear() + 1));

    expirationDateStr = expirationDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const firstYearEnd = new Date(createdDate);
    firstYearEnd.setFullYear(createdDate.getFullYear() + 1);
    const isPaidYear2 = expirationDate > firstYearEnd;
    isFreeAccess = !isPaidYear2 && (new Date() < expirationDate);

    return {
      category,
      fee,
      isFreeAccess,
      isPaidYear2,
      priceLabel: `₱${fee.toLocaleString()}`,
      expirationDateStr,
      isExpired: new Date() >= expirationDate
    };
  }, [activeSchool, teacherCount, user]);

  const filteredSections = sections.filter(section => {
    const effectiveYear = filters.schoolYear || globalSettings?.activeSchoolYear;
    
    if (effectiveYear && effectiveYear !== 'all') {
      if (effectiveYear === 'No School Year') {
        if (section.schoolYear && section.schoolYear.trim() !== '') return false;
      } else {
        if (section.schoolYear !== effectiveYear) return false;
      }
    }
    
    const isExpired = section.schoolId ? expiredSchoolIds.includes(section.schoolId) : false;
    
    if (filters.visibility === 'active') {
        if (isExpired) return false;
    } else if (filters.visibility === 'expired') {
        if (!isExpired) return false;
    }
    // 'all' shows both

    if (filters.gradeLevel !== '') {
        if (String(section.gradeLevel) !== String(filters.gradeLevel)) return false;
    }

    if (user?.role === 'admin') {
      if (filters.region && section.region !== filters.region) return false;
      if (filters.division && section.division !== filters.division) return false;
      if (filters.district && section.district !== filters.district) return false;
    }
    return true;
  });

  const renderItems = useMemo(() => {
    type RenderItem = 
      | { type: 'section', section: Section } 
      | { type: 'tle-group', key: string, tleName: string, gradeLevels: number[], sections: Section[], isExpired: boolean }
      | { type: 'aral-class', aralClass: AralClass };
    const items: RenderItem[] = [];
    const tleGroups = new Map<string, { tleName: string, gradeLevels: Set<number>, sections: Section[], isExpired: boolean }>();

    filteredSections.forEach(section => {
      const isExpired = section.schoolId ? expiredSchoolIds.includes(section.schoolId) : false;
      
      if (user?.role === 'teacher' && (section.gradeLevel == 9 || section.gradeLevel == 10)) {
        const isAdviser = (section.adviserEmail || "").trim().toLowerCase() === (user?.email || "").trim().toLowerCase();
        
        const userEmail = (user?.email || "").trim().toLowerCase();
        const sectionSubjects = subjects.filter(s => s.sectionId === section.id);
        
        const teacherTleSubjects: string[] = [];
        sectionSubjects.forEach(sub => {
          if ((sub.teacherEmail || "").trim().toLowerCase() === userEmail && isTleSubject(sub.name)) {
            const dName = getTleDisplayName(sub.name);
            if (!teacherTleSubjects.includes(dName)) teacherTleSubjects.push(dName);
          }
        });

        if (section.subjectTeachers) {
            for (const [subjId, tEmail] of Object.entries(section.subjectTeachers)) {
              if (typeof tEmail === 'string' && tEmail.trim().toLowerCase() === userEmail) {
                const gSubj = globalSubjects.find(g => g.id === subjId);
                if (gSubj && isTleSubject(gSubj.name)) {
                  const dName = getTleDisplayName(gSubj.name);
                  if (!teacherTleSubjects.includes(dName)) teacherTleSubjects.push(dName);
                }
              }
            }
        }

        if (teacherTleSubjects.length > 0) {
          teacherTleSubjects.forEach(tleName => {
              const groupKey = tleName;
              if (!tleGroups.has(groupKey)) {
                tleGroups.set(groupKey, { tleName, gradeLevels: new Set([Number(section.gradeLevel)]), sections: [], isExpired });
              } else {
                tleGroups.get(groupKey)!.gradeLevels.add(Number(section.gradeLevel));
                tleGroups.get(groupKey)!.isExpired = tleGroups.get(groupKey)!.isExpired || isExpired;
              }
              tleGroups.get(groupKey)!.sections.push(section);
          });
          
          let teachesNonTle = false;
          sectionSubjects.forEach(sub => {
              if ((sub.teacherEmail || "").trim().toLowerCase() === userEmail && !isTleSubject(sub.name)) teachesNonTle = true;
          });
          if (section.subjectTeachers) {
              for (const [subjId, tEmail] of Object.entries(section.subjectTeachers)) {
                if (typeof tEmail === 'string' && tEmail.trim().toLowerCase() === userEmail) {
                  const gSubj = globalSubjects.find(g => g.id === subjId);
                  if (gSubj && !isTleSubject(gSubj.name)) teachesNonTle = true;
                }
              }
          }
          
          let teacherSubjectsFromFallback = section.teacherSubjects || [];
          if (teacherSubjectsFromFallback.some(n => !isTleSubject(n))) teachesNonTle = true;

          if (!teachesNonTle && !isAdviser) {
            return;
          }
        }
      }
      items.push({ type: 'section', section });
    });

    tleGroups.forEach((group, key) => {
      items.unshift({ type: 'tle-group', key, tleName: group.tleName, gradeLevels: Array.from(group.gradeLevels).sort((a, b) => a - b), sections: group.sections, isExpired: group.isExpired });
    });

    // Populate and filter ARAL program classes
    const effectiveYear = filters.schoolYear || globalSettings?.activeSchoolYear;
    const filteredAral = (aralClasses || []).filter(cls => {
      if (user?.role === 'teacher') {
        const userEmail = (user?.email || "").trim().toLowerCase();
        const adviserEmail = (cls.adviserEmail || "").trim().toLowerCase();
        if (userEmail !== adviserEmail) return false;
      }

      if (effectiveYear && effectiveYear !== 'all') {
        if (effectiveYear === 'No School Year') {
          if (cls.schoolYear && cls.schoolYear.trim() !== '') return false;
        } else {
          if (cls.schoolYear !== effectiveYear) return false;
        }
      }

      const isExpired = cls.schoolId ? expiredSchoolIds.includes(cls.schoolId) : false;
      if (filters.visibility === 'active') {
        if (isExpired) return false;
      } else if (filters.visibility === 'expired') {
        if (!isExpired) return false;
      }

      if (filters.gradeLevel !== '') {
        if (String(cls.gradeLevel) !== String(filters.gradeLevel)) return false;
      }

      return true;
    });

    filteredAral.forEach(cls => {
      items.push({ type: 'aral-class', aralClass: cls });
    });

    return items;
  }, [filteredSections, user, subjects, globalSubjects, expiredSchoolIds, aralClasses, filters, globalSettings]);

  const schoolYears = useMemo(() => {
    const list = Array.from(new Set(sections.map(s => s.schoolYear).filter(Boolean)));
    if (globalSettings?.activeSchoolYear && !list.includes(globalSettings.activeSchoolYear)) {
      list.push(globalSettings.activeSchoolYear);
    }
    return list.sort();
  }, [sections, globalSettings?.activeSchoolYear]);
  const hasNoSchoolYear = useMemo(() => sections.some(s => !s.schoolYear || s.schoolYear.trim() === ''), [sections]);
  const regions = useMemo(() => Array.from(new Set(sections.map(s => s.region).filter(Boolean))), [sections]);
  const divisions = useMemo(() => Array.from(new Set(sections.map(s => s.division).filter(Boolean))), [sections]);
  const districts = useMemo(() => Array.from(new Set(sections.map(s => s.district).filter(Boolean))), [sections]);
  const gradeLevels = useMemo(() => Array.from(new Set(sections.map(s => s.gradeLevel).filter(g => g !== null && g !== undefined))).sort((a,b) => Number(a)-Number(b)), [sections]);

  const [showRequestsModal, setShowRequestsModal] = useState(false);

  const isMainAdmin = user?.email === 'jessiemangabo@gmail.com';
  const pendingRequests = globalSettings?.unfinalizeRequests || [];

  const handleApproveRequest = async (req: any) => {
    try {
      const docRef = doc(db, 'settings', 'general');
      const reqs = pendingRequests.filter((r: any) => !(r.schoolYear === req.schoolYear && r.timestamp === req.timestamp));
      
      const sectionsSnap = await getDocs(collection(db, 'sections'));
      const allSections = sectionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const targetSections = req.sectionId 
        ? allSections.filter((s: any) => s.id === req.sectionId)
        : allSections.filter((s: any) => s.schoolYear === req.schoolYear || (!s.schoolYear && req.schoolYear === 'No School Year') || (!req.schoolYear && req.schoolYear === 'active'));
      
      const updatePromises = [];
      for (const tsec of targetSections) {
         const snaps = await getDocs(collection(db, `sections/${tsec.id}/students`));
         for (const docSnap of snaps.docs) {
           const studentData = docSnap.data();
           if (studentData.status === 'Promoted' || studentData.status === 'Retained' || studentData.status === 'Active') {
             updatePromises.push(updateDoc(doc(db, `sections/${tsec.id}/students`, docSnap.id), { status: 'Active' }));
           }
         }
         updatePromises.push(updateDoc(doc(db, 'sections', tsec.id), { isFinalized: false }));
      }
      
      await Promise.all(updatePromises);
      await updateDoc(docRef, { unfinalizeRequests: reqs });
      alert(`Unfinalize Request Approved${req.sectionName ? ' for Section: ' + req.sectionName : ''}`);
      
    } catch (e) {
      console.error(e);
      alert("Failed to approve request.");
    }
  };

  const handleRejectRequest = async (req: any) => {
    try {
      const docRef = doc(db, 'settings', 'general');
      const reqs = pendingRequests.filter((r: any) => !(r.schoolYear === req.schoolYear && r.timestamp === req.timestamp));
      await updateDoc(docRef, { unfinalizeRequests: reqs });
      alert(`Unfinalize Request Rejected for School Year: ${req.schoolYear}`);
    } catch (e) {
      console.error(e);
      alert("Failed to reject request.");
    }
  };

  const handleFinalizeEntireSchool = async () => {
    if (!globalSettings?.activeSchoolYear) {
      alert("No active school year set.");
      return;
    }
    if (window.confirm('Are you sure you want to finalize all sections for the current school year? This action cannot be undone.')) {
      try {
        const batch = writeBatch(db);
        let count = 0;
        sections.filter(s => s.schoolYear === globalSettings.activeSchoolYear && !s.isFinalized).forEach(s => {
          batch.update(doc(db, 'sections', s.id), { isFinalized: true });
          count++;
        });

        // Also finalize the school record itself in firestore
        if (user?.schoolId) {
          const q = query(collection(db, "schools"), where("schoolId", "==", user.schoolId));
          const snap = await getDocs(q);
          snap.forEach(d => {
            batch.update(doc(db, 'schools', d.id), { isFinalized: true });
          });
        }

        if (count > 0 || user?.schoolId) {
          await batch.commit();
          alert(`Successfully finalized the school and its ${count} sections for ${globalSettings.activeSchoolYear}.`);
        } else {
          alert('All active sections are already finalized or none exist for the active school year.');
        }
      } catch (err) {
        handleFirestoreError(err, 'write', 'sections');
      }
    }
  };

  const renderAdminDropdown = (
    id: string, 
    label: string, 
    icon: React.ReactNode, 
    items: {
      label: string;
      icon: React.ReactNode;
      onClick?: () => void;
      customRender?: (close: () => void) => React.ReactNode;
      visible: boolean;
      textClass?: string;
    }[]
  ) => {
    const visibleItems = items.filter(item => item.visible);
    if (visibleItems.length === 0) return null;
    const isOpen = openAdminMenu === id;
    const setIsOpen = (val: boolean) => setOpenAdminMenu(val ? id : null);

    return (
      <div className="relative w-full sm:w-auto z-30">
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between sm:justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm w-full sm:w-auto"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span>{label}</span>
          </div>
          <ChevronDown size={14} className={`opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-full sm:w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {visibleItems.map((item, index) => {
                if (item.customRender) {
                  return (
                    <div key={index} className="w-full">
                      {item.customRender(() => setIsOpen(false))}
                    </div>
                  );
                }
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${item.textClass || 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen print:h-auto bg-slate-50 flex flex-col font-sans overflow-hidden print:overflow-hidden">
      
      <AnimatePresence>
        {showRequestsModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-100 text-indigo-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Unfinalize Requests</h3>
                    <p className="text-sm text-slate-500 font-medium">Approve or reject System Admin requests to unfinalize school years.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRequestsModal(false)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {pendingRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                       <CheckCircle size={32} />
                    </div>
                    <p className="text-slate-500 font-bold mb-1">All Caught Up</p>
                    <p className="text-slate-400 text-sm">There are no pending requests to unfinalize any sections.</p>
                  </div>
                ) : (
                  pendingRequests.map((req: any, idx: number) => (
                    <div key={idx} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-slate-200 text-indigo-600">
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Pending Action</h4>
                          <p className="text-xs text-slate-600">
                            Requested by <span className="font-semibold text-slate-700">{req.requestedBy}</span> for <span className="font-bold text-indigo-600 border border-indigo-100 bg-indigo-50 px-1 rounded">{req.sectionName ? `Section ${req.sectionName} (${req.schoolYear})` : req.schoolYear}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRejectRequest(req)} className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border border-slate-200 rounded-lg transition-colors">
                          Reject
                        </button>
                        <button onClick={() => handleApproveRequest(req)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2">
                          Approve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="print:hidden">
        {!globalSettings?.activeSchoolYear && <EncodingClosedBanner />}
        <DeadlineBanner globalSettings={globalSettings} />
      </div>
      {(subDetails.isExpired && user?.email !== 'jessiemangabo@gmail.com') && (
        <div className="bg-rose-500 text-white px-4 py-2.5 text-center text-sm font-semibold flex items-center justify-center gap-2 relative z-50 shadow-sm shrink-0 print:hidden">
          <AlertTriangle size={18} className="animate-pulse" />
          {(user?.role === 'system_admin' || user?.role === 'admin')
             ? "Your school's enterprise license has expired. Please contact the system provider to renew your subscription."
             : "Your school's enterprise license has expired. Please contact your system administrator to restore access."}
          {(user?.role === 'system_admin' || user?.role === 'admin') && onRenew && (
             <button onClick={() => setShowSOA(true)} className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded border border-white/30 transition-colors text-xs uppercase tracking-wider">Renew Now</button>
          )}
        </div>
      )}
      <header className="h-16 bg-white px-6 md:px-8 flex items-center justify-between shrink-0 gap-4 relative z-50 border-b border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
            <GraduationCap size={22} />
          </div>
           <div className="flex flex-col">
            <h1 className="text-slate-900 font-bold tracking-tight text-lg leading-tight flex items-center gap-2">
              <span className="md:hidden">CLASS</span>
              <span className="hidden md:block">
                CLASS Enterprise
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-md border border-slate-200">v2.4</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          {/* Theme button hidden from section header per user request */}

           {(isMainAdmin || user?.role === 'system_admin') && !!globalSettings?.finalizationDeadline && (
             <button
               onClick={() => setShowRequestsModal(true)}
               className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold text-xs px-3 py-2 rounded-lg transition-all shadow-sm relative"
             >
               <AlertTriangle size={14} /> <span className="hidden sm:inline">Unfinalize Requests</span>
               {pendingRequests.length > 0 && (
                 <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                   {pendingRequests.length}
                 </span>
               )}
             </button>
           )}

            {onScanID && (
              <button 
                onClick={onScanID}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
              >
                <QrCode size={14} /> <span className="hidden sm:inline">Scan ID</span>
              </button>
            )}

           {user?.role === 'system_admin' && onManageUsers && (
             <>
                <button 
                  onClick={onManageUsers}
                 className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-lg transition-all shadow-sm"
               >
                 <Users size={14} /> <span className="hidden sm:inline">Manage Users</span>
                 {pendingUsersCount > 0 && (
                   <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                     {pendingUsersCount}
                   </span>
                 )}
               </button>
               {onManageSchools && (
                 <button 
                   onClick={onManageSchools}
                   className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-lg transition-all shadow-sm"
                 >
                   <Building size={14} /> <span className="hidden sm:inline">Manage School</span>
                 </button>
               )}
             </>
           )}

           {user?.role === 'system_admin' && !!globalSettings?.finalizationDeadline && !isEntireSchoolFinalized && !isSchoolDbFinalized && (
             <button 
               onClick={handleFinalizeEntireSchool}
               className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-all shadow-sm"
             >
               <CheckCircle size={14} /> <span className="hidden sm:inline">Finalize Entire School</span>
             </button>
           )}
           
           {(user?.role === 'admin') && (
             <div className="relative z-50">
               <button 
                 onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                 className={`flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border text-slate-700 font-semibold text-xs px-3 py-2 rounded-lg transition-all shadow-sm ${isSettingsOpen ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-200'}`}
               >
                 <Settings size={14} /> <span className="hidden sm:inline">Settings</span>
                 <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} />
               </button>
               
               {isSettingsOpen && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                   <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 py-1 z-50 divide-y divide-slate-50">
                      {onManageUsers && (
                        <button 
                          onClick={() => { onManageUsers(); setIsSettingsOpen(false); }} 
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                        >
                          <Users size={14} className="text-slate-400" /> Manage Users
                          {pendingUsersCount > 0 && (
                            <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                              {pendingUsersCount}
                            </span>
                          )}
                        </button>
                      )}
                      {onScanID && (
                        <button 
                          onClick={() => { onScanID(); setIsSettingsOpen(false); }} 
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                        >
                          <QrCode size={14} className="text-indigo-600" /> Scan ID
                        </button>
                      )}
                      {onManageSchools && (
                        <button 
                          onClick={() => { onManageSchools(); setIsSettingsOpen(false); }} 
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          <Building size={14} className="text-slate-400" /> Manage School
                        </button>
                      )}
                      {onManageSchoolYears && (
                        <button 
                          onClick={() => { onManageSchoolYears(); setIsSettingsOpen(false); }} 
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          <Calendar size={14} className="text-slate-400" /> School Year
                        </button>
                      )}
                      {onManageCalendar && (
                        <button 
                          onClick={() => { onManageCalendar(); setIsSettingsOpen(false); }} 
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          <Calendar size={14} className="text-slate-400" /> School Calendar
                        </button>
                      )}
                      {onShowFeedbackDashboard && (
                        <button 
                          onClick={() => { onShowFeedbackDashboard(); setIsSettingsOpen(false); }} 
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors bg-indigo-50/30"
                        >
                          <Sparkles size={14} className="text-indigo-400" /> Feedback Dashboard
                        </button>
                      )}
                      {onOpenThemeModal && (
                        <button 
                          onClick={() => { onOpenThemeModal(); setIsSettingsOpen(false); }} 
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                        >
                          <Palette size={14} className="text-indigo-500" /> Appearance & Themes
                        </button>
                      )}
                   </div>
                 </>
               )}
             </div>
           )}

           {/* Keep Verify Students button separate for Advisers */}
           {user?.role === 'teacher' && isAnySectionAdviser && onManageUsers && (
              <button onClick={onManageUsers} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                 Verify Students
                 {pendingUsersCount > 0 && (
                   <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                     {pendingUsersCount}
                   </span>
                 )}
              </button>
           )}

           <button 
             onClick={() => setShowProfile(!showProfile)} 
             className="flex items-center gap-2.5 p-1.5 pr-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm group"
           >
             <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors shrink-0">
               <User size={16} />
             </div>
             <div className="flex flex-col items-start min-w-[80px] max-w-[120px] hidden sm:flex">
                <p className="text-xs font-semibold text-slate-700 leading-tight truncate w-full" title={user?.displayName || ''}>
                  {user?.displayName}
                </p>
                <div className="flex items-center gap-1 mt-0.5 w-full">
                  <p className="text-[10px] text-slate-500 font-medium truncate">{user?.role?.replace('_', ' ')}</p>
                </div>
             </div>
           </button>
           
           <div className="w-px h-6 bg-slate-200 mx-1"></div>
           
           <button onClick={onLogout} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all" title="Sign Out">
              <LogOut size={18} />
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto print:overflow-hidden print:h-auto print:block print:p-0 p-12 custom-scrollbar">
        <div className="max-w-full 2xl:max-w-[1600px] w-full mx-auto space-y-12">
          {showProfile ? (
            <ProfileView 
               userProfile={user!} 
               onUpdate={(p) => {
                 onUpdateUser?.(p);
               }} 
               onBack={() => setShowProfile(false)}
               onOpenThemeModal={onOpenThemeModal}
            />
          ) : showSOA ? (
            <StatementOfAccountView 
               activeSchool={activeSchool}
               teacherCount={teacherCount}
               onBack={() => setShowSOA(false)}
               onRenew={onRenew}
               userProfile={user}
            />
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Institutional Dashboard</span>
              </div>

              {/* Premium Contextual Header for Sections */}
              <div className="relative bg-white rounded-2xl p-8 md:p-10 mb-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl opacity-60 -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="relative z-10 space-y-3 max-w-2xl">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                    Welcome back, <span className="text-indigo-600">{(user?.displayName || 'Educator').split(' ')[0]}</span>
                  </h1>
                  <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
                    Overview and manage academic sections. You currently have access to <strong className="text-slate-800 font-semibold">{sections.length}</strong> active class records.
                  </p>
                  <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">One System. One Encoding. Everything Connected.</p>
                </div>

                <div className="relative z-10 flex flex-col items-end gap-3 shrink-0 w-full md:w-auto">
                   <div className="flex items-center justify-between w-full md:w-auto gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Session</span>
                        <span className="text-xs font-semibold text-slate-700">{user?.role?.replace('_', ' ')}</span>
                      </div>
                      <div className="w-px h-8 bg-slate-200 mx-2"></div>
                       <button 
                         onClick={onShowFeedback}
                         className="p-2 bg-white rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 transition-all shadow-sm"
                         title="Submit Feedback"
                         id="admin_header_feedback_button"
                       >
                         <MessageSquare size={16} />
                       </button>
                   </div>
                </div>
              </div>

              {(sections.some(s => s.deletionStatus === 'pending') || sections.some(s => s.deletionStatus === 'approved') || sections.some(s => s.deletionStatus === 'rejected')) && (
                <div className={`mb-8 p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm transition-all ${
                  sections.some(s => s.deletionStatus === 'pending') 
                    ? 'bg-amber-50 border-amber-200' 
                    : sections.some(s => s.deletionStatus === 'rejected')
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-start md:items-center gap-4 md:gap-5">
                    <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center border shadow-sm ${
                      sections.some(s => s.deletionStatus === 'pending')
                        ? 'bg-amber-100 text-amber-600 border-amber-200'
                        : sections.some(s => s.deletionStatus === 'rejected')
                          ? 'bg-rose-100 text-rose-600 border-rose-200'
                          : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                    }`}>
                      <ShieldCheck size={28} className={sections.some(s => s.deletionStatus === 'pending') ? "animate-pulse" : ""} />
                    </div>
                    <div>
                      <h4 className={`text-base font-bold tracking-tight mb-1 ${
                        sections.some(s => s.deletionStatus === 'pending') ? 'text-amber-900' : 
                        sections.some(s => s.deletionStatus === 'rejected') ? 'text-rose-900' : 'text-emerald-900'
                      }`}>
                        {(user?.role === 'system_admin' || user?.role === 'admin') 
                          ? (sections.some(s => s.deletionStatus === 'pending') ? 'Waiting for Approval' : sections.some(s => s.deletionStatus === 'rejected') ? 'Deletion Disapproved' : 'Ready for Deletion')
                          : (sections.some(s => s.deletionStatus === 'pending') ? 'Deletion Pending' : sections.some(s => s.deletionStatus === 'rejected') ? 'Request Disapproved' : 'Ready for Deletion')}
                      </h4>
                      <p className={`text-sm font-medium max-w-xl leading-relaxed ${
                        sections.some(s => s.deletionStatus === 'pending') ? 'text-amber-700/80' : 
                        sections.some(s => s.deletionStatus === 'rejected') ? 'text-rose-700/80' : 'text-emerald-700/80'
                      }`}>
                        {(user?.role === 'system_admin' || user?.role === 'admin')
                          ? (sections.some(s => s.deletionStatus === 'pending') 
                              ? "There are sections awaiting your security authorization. Please review and approve requests before records are permanently removed."
                              : sections.some(s => s.deletionStatus === 'rejected')
                                ? "One or more deletion requests have been disapproved. The Adviser has been notified of the decision and the reason."
                                : "Deletions have been authorized. You can now proceed with the permanent removal of these records.")
                          : (sections.some(s => s.deletionStatus === 'pending')
                              ? "Your deletion request is currently waiting for authorization from the System Administrator."
                              : sections.some(s => s.deletionStatus === 'rejected')
                                ? "Your deletion request has been disapproved. Please check the section details for the reason provided."
                                : "The System Administrator has authorized your deletion request. It will be permanently removed shortly.")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-end gap-2 shrink-0">
                    {sections.filter(s => s.deletionStatus === 'pending').length > 0 && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm flex items-center gap-1.5">
                        <Clock size={14} /> {sections.filter(s => s.deletionStatus === 'pending').length} Waiting
                      </span>
                    )}
                    {sections.filter(s => s.deletionStatus === 'approved').length > 0 && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm flex items-center gap-1.5">
                        <CheckCircle size={14} /> {sections.filter(s => s.deletionStatus === 'approved').length} Ready
                      </span>
                    )}
                    {sections.filter(s => s.deletionStatus === 'rejected').length > 0 && (
                      <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm flex items-center gap-1.5">
                        <XCircle size={14} /> {sections.filter(s => s.deletionStatus === 'rejected').length} Disapproved
                      </span>
                    )}
                  </div>
                </div>
              )}

              {(user?.role === 'admin' || user?.role === 'system_admin' || user?.role === 'school_head' || isAuthorizedCashier) && (
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto shrink-0 mt-6 xl:mt-0 mb-8">
                  {renderAdminDropdown(
                    'financials', 
                    'Financials', 
                    <BarChart2 size={16} className="text-emerald-600" />,
                    [
                      {
                        label: 'Financial Statement',
                        icon: <BarChart2 size={15} className="text-emerald-600" />,
                        onClick: onShowFinancialStatement,
                        visible: !!(onShowFinancialStatement && (user?.role === 'system_admin' || user?.role === 'school_head' || isAuthorizedCashier)),
                        textClass: 'text-emerald-700 hover:bg-emerald-50'
                      }
                    ]
                  )}

                  {renderAdminDropdown(
                    'school-forms', 
                    'School Forms', 
                    <FileText size={16} className="text-amber-600" />,
                    [
                      {
                        label: 'School Form 4 (SF4)',
                        icon: <FileText size={15} className="text-amber-600" />,
                        onClick: onShowSF4,
                        visible: !!(onShowSF4 && (user?.role === 'system_admin' || user?.role === 'school_head')),
                        textClass: 'text-amber-700 hover:bg-amber-50'
                      },
                      {
                        label: 'School Form 7 (SF7)',
                        icon: <FileText size={15} className="text-indigo-600" />,
                        onClick: onShowSF7,
                        visible: !!(onShowSF7 && (user?.role === 'system_admin' || user?.role === 'admin')),
                        textClass: 'text-indigo-700 hover:bg-indigo-50'
                      }
                    ]
                  )}

                  {renderAdminDropdown(
                    'academic-programs', 
                    'Academic Programs', 
                    <BookOpen size={16} className="text-indigo-600" />,
                    [
                      {
                        label: 'Subject Menu',
                        icon: <BookOpen size={15} className="text-indigo-600" />,
                        onClick: () => onSetActiveTab('subjects'),
                        visible: user?.role === 'system_admin',
                        textClass: 'text-slate-700 hover:bg-slate-50'
                      },
                      {
                        label: 'G9/G10 TLE Allocation',
                        icon: <GraduationCap size={15} className="text-indigo-600" />,
                        onClick: () => onSetActiveTab('tle-dashboard'),
                        visible: !!(user?.role === 'admin' || user?.role === 'system_admin' || (user?.role === 'teacher' && hasAssignedSubjects)),
                        textClass: 'text-slate-700 hover:bg-slate-50'
                      },
                      {
                        label: 'ARAL Program',
                        icon: <GraduationCap size={15} className="text-indigo-600" />,
                        onClick: () => onSetActiveTab('aral'),
                        visible: !!(onSetActiveTab && (user?.role === 'system_admin' || user?.role === 'school_head' || user?.role === 'admin' || (mapUserRoleToAralRole && mapUserRoleToAralRole(user?.role, user?.email) === 'ARAL Coordinator'))),
                        textClass: 'text-indigo-700 hover:bg-indigo-50'
                      }
                    ]
                  )}

                  {renderAdminDropdown(
                    'learner-mgmt', 
                    'Learner Management', 
                    <Users size={16} className="text-indigo-600" />,
                    [
                      {
                        label: 'Student List',
                        icon: <TableIcon size={15} className="text-indigo-600" />,
                        onClick: onManageStudentList,
                        visible: !!((user?.role === 'admin' || user?.role === 'system_admin') && onManageStudentList),
                        textClass: 'text-slate-700 hover:bg-slate-50'
                      },
                      {
                        label: 'Download CSV Template',
                        icon: <Download size={15} className="text-indigo-600" />,
                        onClick: downloadDashboardCSVTemplate,
                        visible: user?.role === 'system_admin',
                        textClass: 'text-slate-700 hover:bg-slate-50'
                      },
                      {
                        label: 'Bulk Upload (for Learner Upload)',
                        icon: <FileUp size={15} className="text-indigo-600" />,
                        visible: user?.role === 'system_admin',
                        customRender: (close) => (
                          <label 
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer w-full text-indigo-600 hover:bg-indigo-50/50 ${
                              isUploadingDashboard ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <FileUp size={15} className="text-indigo-600" />
                            <span>Bulk Upload (for Learner Upload)</span>
                            <input 
                              type="file" 
                              accept=".csv" 
                              className="hidden" 
                              onChange={(e) => {
                                handleDashboardFileUpload(e);
                                close();
                              }}
                              disabled={isUploadingDashboard}
                            />
                          </label>
                        )
                      }
                    ]
                  )}
                </div>
              )}
              {activeSchool && (user?.role === 'system_admin' || user?.role === 'admin' || user?.role === 'school_head') && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 animate-in fade-in duration-200">
                  <div className="flex items-center gap-4">
                    <div className={`p-3.5 rounded-2xl flex items-center justify-center shrink-0 border ${
                      subDetails.isFreeAccess 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                      <CreditCard size={24} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">
                          {activeSchool.name} Subscription Status
                        </h4>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-slate-200">
                          {subDetails.category} Tier ({teacherCount} active {teacherCount === 1 ? 'teacher' : 'teachers'})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Your data subscription tier is calculated in real-time based on the number of registered school teachers.
                      </p>
                      <button
                        onClick={() => setShowSOA(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer hover:underline mt-1"
                        title="View Ledger"
                      >
                        <Receipt size={14} /> View Statement of Account & Ledger
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-stretch md:self-auto justify-between border-t border-slate-100 pt-4 md:border-0 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Computed Annual Payment</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        {subDetails.isFreeAccess ? (
                          <>
                            <span className="text-xl font-black text-emerald-600 font-sans">Free Access Mode</span>
                            <span className="text-xs text-slate-400 line-through">{subDetails.priceLabel}</span>
                          </>
                        ) : (
                          <span className="text-xl font-black text-indigo-600 font-sans">{subDetails.priceLabel}</span>
                        )}
                        <span className="text-[10px] text-slate-400">/ year</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                      {subDetails.isFreeAccess ? (
                        <div className="bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-4 py-2.5 rounded-xl text-xs space-y-0.5 font-semibold">
                          <p className="font-extrabold flex items-center gap-1.5 uppercase text-[9px] tracking-widest text-emerald-950">
                            🎁 One-Year Free Access Active
                          </p>
                          <p className="text-[11px] text-emerald-750 font-medium">Valid until {subDetails.expirationDateStr}</p>
                        </div>
                      ) : subDetails.isPaidYear2 ? (
                        <div className="bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-4 py-2.5 rounded-xl text-xs space-y-0.5 font-semibold">
                          <p className="font-extrabold flex items-center gap-1.5 uppercase text-[9px] tracking-widest text-emerald-950">
                            ✅ Paid Subscription (Year 2) Active
                          </p>
                          <p className="text-[11px] text-emerald-750 font-medium">Fully paid. Valid until {subDetails.expirationDateStr}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                          <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-2.5 rounded-xl text-xs space-y-0.5 font-semibold">
                            <p className="font-extrabold flex items-center gap-1.5 uppercase text-[9px] tracking-widest text-rose-950">
                              ⚠️ Renewal Pending (Year 2)
                            </p>
                            <p className="text-[11px] text-rose-750 font-bold">Unpaid. Click PAID to renew subscription</p>
                          </div>
                          
                          <button
                            id="banner-pay-btn"
                            disabled={isBannerPaying}
                            onClick={async () => {
                              try {
                                setIsBannerPaying(true);
                                if (onRenew) {
                                  await onRenew(2);
                                }
                              } catch (err) {
                                console.error("Error trigger renew:", err);
                              } finally {
                                setIsBannerPaying(false);
                              }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-755 disabled:bg-slate-300 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 text-center uppercase whitespace-nowrap inline-flex items-center justify-center gap-1.5"
                          >
                            {isBannerPaying && (
                              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            )}
                            PAID
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => setShowSOA(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <Receipt size={14} /> View SOA & Payments
                      </button>
                    </div>
                  </div>
                </div>
              )}

          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end border-b border-slate-200 pb-6 mb-6 gap-6">
            <div className="space-y-4 flex-1 w-full xl:w-auto overflow-hidden">
              
              <div className="flex flex-wrap items-center gap-2 max-w-full">
                <div className="relative group shrink-0">
                  <div className={`flex items-center bg-white border ${!globalSettings?.activeSchoolYear ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200 hover:border-indigo-300'} rounded-lg px-3 py-2 shadow-sm transition-colors`}>
                    <Calendar size={14} className={!globalSettings?.activeSchoolYear ? 'text-rose-500 mr-2' : 'text-slate-400 mr-2'} />
                    <select 
                      value={filters.schoolYear}
                      onChange={e => setFilters({...filters, schoolYear: e.target.value})}
                      className={`bg-transparent border-none text-xs font-semibold outline-none ${!globalSettings?.activeSchoolYear ? 'text-rose-600' : 'text-slate-700'} cursor-pointer min-w-[130px]`}
                    >
                      <option value="all">All School Years</option>
                      {schoolYears.map(sy => <option key={sy} value={sy}>{sy}</option>)}
                      {hasNoSchoolYear && <option value="No School Year">No School Year</option>}
                    </select>
                  </div>
                  {!globalSettings?.activeSchoolYear && (
                    <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white border border-rose-200 rounded-xl shadow-lg z-50 pointer-events-none transform origin-top transition-all scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-rose-500 shrink-0" />
                        <p className="text-xs font-medium text-slate-700 leading-snug">
                          No active school year. Please set one in <span className="text-rose-600 font-semibold">Settings &gt; School Years</span>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full" style={{ scrollbarWidth: 'none' }}>
                  <button 
                    onClick={() => setFilters({...filters, gradeLevel: ''})}
                    className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${!filters.gradeLevel ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    All Grades
                  </button>
                  {gradeLevels.map(g => (
                    <button
                      key={g}
                      onClick={() => setFilters({...filters, gradeLevel: String(g)})}
                      className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${String(filters.gradeLevel) === String(g) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {Number(g) === 0 ? "Kinder" : `G${g}`}
                    </button>
                  ))}
                </div>

                {user?.role === 'admin' && (
                  <>
                    <div className="w-px h-6 bg-slate-200 mx-1 hidden lg:block"></div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <div className="flex items-center bg-white border border-slate-200 hover:border-indigo-300 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors">
                        <Building size={14} className="text-slate-400 mr-1.5" />
                        <select 
                          value={filters.region}
                          onChange={e => setFilters({...filters, region: e.target.value})}
                          className="bg-transparent border-none text-[11px] font-semibold outline-none text-slate-600 cursor-pointer min-w-[70px]"
                        >
                          <option value="">Region</option>
                          {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center bg-white border border-slate-200 hover:border-indigo-300 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors">
                        <Building size={14} className="text-slate-400 mr-1.5" />
                        <select 
                          value={filters.division}
                          onChange={e => setFilters({...filters, division: e.target.value})}
                          className="bg-transparent border-none text-[11px] font-semibold outline-none text-slate-600 cursor-pointer min-w-[70px]"
                        >
                          <option value="">Division</option>
                          {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center bg-white border border-slate-200 hover:border-indigo-300 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors">
                        <Building size={14} className="text-slate-400 mr-1.5" />
                        <select 
                          value={filters.district}
                          onChange={e => setFilters({...filters, district: e.target.value})}
                          className="bg-transparent border-none text-[11px] font-semibold outline-none text-slate-600 cursor-pointer min-w-[70px]"
                        >
                          <option value="">District</option>
                          {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="w-px h-6 bg-slate-200 mx-1 hidden lg:block"></div>
                      <div className="flex items-center bg-white border border-slate-200 hover:border-indigo-300 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors">
                        <select 
                          value={filters.visibility ?? 'all'}
                          onChange={e => setFilters({...filters, visibility: e.target.value})}
                          className="bg-transparent border-none text-[11px] font-semibold outline-none text-slate-600 cursor-pointer min-w-[100px]"
                        >
                          <option value="all">Status: All</option>
                          <option value="active">Status: Active</option>
                          <option value="expired">Status: Expired</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
          </div>

          {user?.role === 'system_admin' && subjects.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-6 transition-all">
              <button 
                type="button"
                onClick={() => setIsOverviewOpen(!isOverviewOpen)}
                className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/70 border-b border-slate-100 transition-colors text-left font-sans cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider leading-none font-sans uppercase tracking-tight">Section Subject Finalization Overview</h4>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">Monitor finalization status across academic classes</p>
                  </div>
                </div>
                <div className="text-slate-400 p-1 bg-white hover:bg-slate-200 rounded-lg border border-slate-200 transition-all">
                  {isOverviewOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              
              <AnimatePresence initial={false}>
                {isOverviewOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="space-y-4">
                        {adminSortedGradeLevels.map(gradeLevel => {
                          const gradeLabel = Number(gradeLevel) === 0 ? "Kindergarten" : `Grade ${gradeLevel}`;
                          const sectionsInGrade = adminGroupedOverview[gradeLevel];
                          const sectionIds = Object.keys(sectionsInGrade).sort((a, b) => {
                            const nameA = sectionsInGrade[a].sectionName.toLowerCase();
                            const nameB = sectionsInGrade[b].sectionName.toLowerCase();
                            return nameA.localeCompare(nameB);
                          });
                          const isCollapsed = collapsedAdminGrades.has(Number(gradeLevel));

                          return (
                            <div key={gradeLevel} className="bg-slate-50/40 rounded-2xl p-4 border border-slate-200/65 space-y-3 transition-colors hover:bg-slate-50/70">
                              <button
                                type="button"
                                onClick={() => {
                                  setCollapsedAdminGrades(prev => {
                                    const next = new Set(prev);
                                    if (next.has(Number(gradeLevel))) next.delete(Number(gradeLevel));
                                    else next.add(Number(gradeLevel));
                                    return next;
                                  });
                                }}
                                className="w-full flex items-center justify-between gap-3 cursor-pointer text-left focus:outline-none select-none"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded shadow-xs">
                                    {gradeLabel}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50">
                                    {sectionIds.length} {sectionIds.length === 1 ? 'Section' : 'Sections'}
                                  </span>
                                </div>
                                <div className="text-slate-400 p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center justify-center shadow-xs">
                                  {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </div>
                              </button>
                              
                              <AnimatePresence initial={false}>
                                {!isCollapsed && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden space-y-4 pt-1"
                                  >
                                    {sectionIds.map(sectionId => {
                                      const secData = sectionsInGrade[sectionId];
                                      return (
                                        <div key={sectionId} className="space-y-2.5 bg-white/70 p-3.5 rounded-xl border border-slate-100">
                                          <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-[11px] text-slate-500 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
                                              Section: <span className="text-slate-800 font-extrabold">{secData.sectionName}</span>
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                              ({secData.subjects.length} subjects)
                                            </span>
                                          </div>
                                          
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {secData.subjects.map(sub => {
                                              const offered = sub.offeredTerms && sub.offeredTerms.length > 0 ? sub.offeredTerms : ([1, 2, 3, 4] as any[]);
                                              const teacherName = sub.teacherEmail || 'No Teacher Assigned';
                                              
                                              return (
                                                <div key={`${sub.id}-${sub.sectionId || ''}`} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between gap-2.5 transition-all shadow-xs group hover:border-indigo-200">
                                                  <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                      <h6 className="font-extrabold text-slate-800 text-xs truncate" title={sub.name}>{sub.name}</h6>
                                                      <p className="text-[9px] text-slate-500 truncate mt-0.5 font-semibold" title={teacherName}>{teacherName}</p>
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-100/80">
                                                    {offered.map(term => {
                                                      const isFinalized = sub.finalizedTerms?.includes(term);
                                                      return (
                                                        <div key={term} className="flex flex-row items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                                                          <span className="font-semibold text-slate-600 text-[10px] uppercase tracking-wider">Term {term}</span>
                                                          {isFinalized ? (
                                                            <div className="flex items-center gap-1.5">
                                                              <span className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1"><Check size={10} /> Finalized</span>
                                                              {onToggleFinalizeSubjectTerm && (
                                                                <button 
                                                                  onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    setConfirmFinalizeConfig({ subjectId: sub.id, term, finalize: false });
                                                                  }}
                                                                  className="text-[9px] px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 font-bold uppercase hover:bg-amber-100 cursor-pointer transition-colors"
                                                                  title={`Unfinalize Term ${term}`}
                                                                >
                                                                  Unfinalize
                                                                </button>
                                                              )}
                                                            </div>
                                                          ) : (
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Pending</span>
                                                          )}
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Confirmation Modal for Homepage Finalization Overview */}
          <AnimatePresence>
            {confirmFinalizeConfig && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                  onClick={() => setConfirmFinalizeConfig(null)}
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-white rounded-3xl p-6 w-full max-w-md relative z-[130] shadow-2xl flex flex-col items-center text-center"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                    confirmFinalizeConfig.finalize ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {confirmFinalizeConfig.finalize ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-900 mb-2">
                    {confirmFinalizeConfig.finalize ? 'Finalize & Release Term Grades?' : 'Unfinalize Term Grades?'}
                  </h3>
                  
                  <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">
                    {confirmFinalizeConfig.finalize 
                      ? `Are you sure you want to finalize Term ${confirmFinalizeConfig.term} for this subject? Finalizing will release and display these grades in the Learner's Class Card (SF9), Permanent Academic Records (SF10), and Section Grading Sheet.`
                      : `Are you sure you want to unfinalize Term ${confirmFinalizeConfig.term} for this subject?`}
                  </p>
                  
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setConfirmFinalizeConfig(null)}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        if (onToggleFinalizeSubjectTerm) {
                          onToggleFinalizeSubjectTerm(confirmFinalizeConfig.subjectId, confirmFinalizeConfig.term as any, confirmFinalizeConfig.finalize);
                        }
                        setConfirmFinalizeConfig(null);
                      }}
                      className={`flex-1 py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 ${
                        confirmFinalizeConfig.finalize 
                          ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' 
                          : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      }`}
                    >
                      {confirmFinalizeConfig.finalize ? 'Yes, Finalize & Release' : 'Yes, Unfinalize'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showAdd && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm py-12"
                onClick={() => setShowAdd(false)}
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Add New Section</h2>
                      <p className="text-xs font-medium text-slate-500 mt-1.5">Register a new academic group to the system</p>
                    </div>
                    <button onClick={() => setShowAdd(false)} className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-100">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-8 overflow-y-auto custom-scrollbar">
                    <SectionForm 
                      onSubmit={(sectionData) => {
                        onCreate(sectionData);
                        setShowAdd(false);
                      }}
                      buttonLabel="Create Section"
                      user={user}
                      globalSubjects={globalSubjects}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all mt-8">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsListOpen(!isListOpen)}
              onKeyDown={(e) => { if (e.key === 'Enter') setIsListOpen(!isListOpen); }}
              className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/70 border-b border-slate-100 transition-colors text-left font-sans cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider leading-none">Academic Sections List</h4>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">Browse and manage active groups below</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {(user?.role === 'admin' || user?.role === 'system_admin') && !isEntireSchoolFinalized && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (user?.email !== 'jessiemangabo@gmail.com' && (!globalSettings?.activeSchoolYear || isGlobalFinalized)) return;
                      setShowAdd(true);
                    }}
                    disabled={user?.email !== 'jessiemangabo@gmail.com' && (!globalSettings?.activeSchoolYear || isGlobalFinalized)}
                    className="flex items-center justify-center gap-1.5 bg-indigo-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-sm hover:bg-indigo-700 hover:shadow transition-all cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add Section</span>
                  </button>
                )}
                <div className="text-slate-400 p-1 bg-white hover:bg-slate-200 rounded-lg border border-slate-200 transition-all">
                  {isListOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {isListOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isFiltered ? (
               <div className="col-span-full flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-dashed border-slate-300 text-center shadow-sm">
                 <div className="size-16 bg-indigo-50/50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-indigo-500">
                   <Search size={28} />
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-slate-800 tracking-tight">Selection Required</h2>
                   <p className="text-slate-500 max-w-sm mx-auto mt-1.5 text-sm">Please use the filters above to browse and select academic sections.</p>
                 </div>
               </div>
            ) : renderItems.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-dashed border-slate-300 text-center shadow-sm">
                <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-400">
                  <Users size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">No Sections Found</h2>
                  <p className="text-slate-500 max-w-sm mx-auto mt-1.5 text-sm">Try adjusting your filters to see more results.</p>
                </div>
              </div>
            ) : (
              renderItems.map((item) => {
                if (item.type === 'aral-class') {
                  const { aralClass } = item;
                  const isExpired = aralClass.schoolId ? expiredSchoolIds.includes(aralClass.schoolId) : false;
                  return (
                    <motion.div 
                      key={aralClass.id}
                      whileHover={isExpired ? {} : { y: -4 }}
                      onClick={() => {
                        if (onSelectAralClassId) {
                          onSelectAralClassId(aralClass.id);
                        }
                        if (onSetActiveTab) {
                          onSetActiveTab('aral');
                        }
                      }}
                      className="flex flex-col bg-amber-50/20 p-6 rounded-2xl border border-amber-200 shadow-sm hover:shadow-md hover:border-amber-400 cursor-pointer transition-all duration-300 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/30 rounded-bl-full -z-10 group-hover:bg-amber-100/40 transition-colors"></div>
                      
                      <div className="flex justify-between items-start mb-5 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors border border-amber-200 shrink-0">
                            <GraduationCap size={24} />
                          </div>
                          <div>
                            <div className="flex items-center flex-wrap gap-2">
                               <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-md border border-amber-200">
                                 ARAL PROGRAM CLASS
                               </span>
                               <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                                 Grade {aralClass.gradeLevel}
                               </span>
                               {isExpired && (
                                 <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-200">Expired</span>
                               )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight mb-2 group-hover:text-amber-800 transition-colors">{aralClass.name}</h3>
                      
                      <div className="flex-1 space-y-3 mb-5">
                        {aralClass.schoolYear && (
                          <p className="text-[12px] text-slate-500 tracking-wide flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-400" />
                            SY {aralClass.schoolYear}
                          </p>
                        )}
                        {aralClass.targetSubject && (
                          <p className="text-[12px] text-slate-600 font-medium tracking-wide flex items-center gap-1.5">
                            <BookOpen size={12} className="text-slate-400" />
                            Subject: <span className="font-bold text-slate-800">{aralClass.targetSubject}</span>
                          </p>
                        )}
                        {(aralClass.adviserName || aralClass.adviserEmail) && (
                          <p className="text-[12px] text-slate-500 tracking-wide flex items-center gap-1.5">
                            <User size={12} className="text-slate-400" />
                            Tutor: {aralClass.adviserName || aralClass.adviserEmail}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto pt-4 border-t border-dashed border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Users size={14} className="text-amber-600" />
                          <span className="font-semibold text-slate-700">{aralClass.studentIds?.length || 0} Learners Enrolled</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Manage Remediations <ArrowRight size={10} />
                        </span>
                      </div>
                    </motion.div>
                  );
                }

                if (item.type === 'tle-group') {
                  const { key, tleName, gradeLevels, sections, isExpired } = item;
                  return (
                    <motion.div 
                      key={key}
                      whileHover={isExpired ? {} : { y: -4 }}
                      className={`flex flex-col bg-slate-50 p-6 rounded-2xl border-2 border-indigo-100 shadow-sm transition-all duration-300 relative overflow-hidden`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/30 rounded-bl-full -z-10 transition-colors"></div>
                      
                      <div className="flex justify-between items-start mb-5 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
                            <Users size={24} />
                          </div>
                          <div>
                            <div className="flex items-center flex-wrap gap-2">
                               <span className="text-[10px] font-semibold bg-white text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                                 Combined TLE Class
                               </span>
                               <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                                 {gradeLevels.length === 1 ? `Grade ${gradeLevels[0]}` : `Grades ${gradeLevels.join(' & ')}`}
                               </span>
                               {isExpired && (
                                 <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-200">Expired</span>
                               )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight mb-4 group-hover:text-indigo-700 transition-colors">{tleName}</h3>
                      <div className="flex-1 space-y-4 mb-5">
                         <div className="p-3 bg-white border border-indigo-50 rounded-xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Enrolled Sections ({sections.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {sections.map(section => (
                                <button
                                   key={section.id}
                                   onClick={() => {
                                     onNavigateToSubject(section, tleName);
                                   }}
                                   className="text-[11px] items-center flex gap-1.5 font-bold bg-indigo-50/50 hover:bg-indigo-600 hover:text-white text-indigo-700 px-3 py-2 rounded-lg border border-indigo-100 transition-colors"
                                >
                                  {section.name} <ArrowRight size={12} />
                                </button>
                              ))}
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-4 mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 shrink-0">
                            <User size={12} />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">
                            Grouped by Specialization
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                }
                
                const { section } = item;
                const isExpired = section.schoolId ? expiredSchoolIds.includes(section.schoolId) : false;
                const currentUserEmail = (user?.email || "").trim().toLowerCase();
                const isAdviserOfSection = currentUserEmail.length > 0 && (section.adviserEmail || "").trim().toLowerCase() === currentUserEmail;
                const isSubjectTeacherOfSection = currentUserEmail.length > 0 && (
                  subjects.some(s => s.sectionId === section.id && (s.teacherEmail || "").trim().toLowerCase() === currentUserEmail) || 
                  (section.subjectTeachers && Object.values(section.subjectTeachers).some(tEmail => typeof tEmail === 'string' && tEmail.trim().toLowerCase() === currentUserEmail))
                );

                const cardBgClasses = isAdviserOfSection
                  ? 'bg-emerald-50/20 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100'
                  : isSubjectTeacherOfSection
                  ? 'bg-indigo-50/20 border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100'
                  : 'bg-white border-slate-200 hover:border-indigo-300';

                const iconBgClasses = isAdviserOfSection
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600'
                  : isSubjectTeacherOfSection
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-100/50 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600';

                const cornerGlowClasses = isAdviserOfSection
                  ? 'bg-emerald-100/30 group-hover:bg-emerald-200/40'
                  : isSubjectTeacherOfSection
                  ? 'bg-indigo-100/30 group-hover:bg-indigo-200/40'
                  : 'bg-indigo-50/50 group-hover:bg-indigo-100/50';

                return (
                <motion.div 
                  key={section.id}
                  whileHover={isExpired ? {} : { y: -4 }}
                  onClick={(isExpired && user?.role !== 'admin') ? undefined : () => onSelect(section)}
                  className={`flex flex-col p-6 rounded-2xl border shadow-sm transition-all duration-300 group cursor-pointer relative overflow-hidden ${cardBgClasses} ${(isExpired && user?.role !== 'admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10 transition-colors ${cornerGlowClasses}`}></div>
                  
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors border shrink-0 ${iconBgClasses}`}>
                        <Users size={24} />
                      </div>
                      <div>
                        {section.schoolName ? (
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{section.schoolName}</p>
                        ) : null}
                        <div className="flex items-center flex-wrap gap-1.5">
                           <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                             {(Number(section.gradeLevel) === 0) ? "Kindergarten" : `Grade ${section.gradeLevel}`}
                           </span>
                           {isAdviserOfSection && (
                             <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                               Assigned Section
                             </span>
                           )}
                           {isSubjectTeacherOfSection && (
                             <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-300 shadow-2xs">
                               Assigned Subjects
                             </span>
                           )}
                           <SectionYearEndBadge sectionId={section.id} schoolYear={section.schoolYear} globalSettings={globalSettings} isSectionFinalized={section.isFinalized} />
                           {isExpired && (
                             <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-200">Expired</span>
                           )}
                           {section.deletionStatus === 'pending' && (
                             <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 animate-pulse">
                               <Clock size={10} /> Pending
                             </span>
                           )}
                           {section.deletionStatus === 'approved' && (
                             <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                               <CheckCircle size={10} /> Approved
                             </span>
                           )}
                            {section.deletionStatus === 'rejected' && (
                              <span className="text-[10px] font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                                <XCircle size={10} /> Rejected
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                       {user?.role === 'system_admin' && !isEntireSchoolFinalized && !section.isFinalized && (
                         <button 
                           onClick={(e) => { 
                             if (user?.email !== 'jessiemangabo@gmail.com' && (!globalSettings?.activeSchoolYear || isGlobalFinalized || section.isFinalized)) return;
                             e.stopPropagation(); 
                             setSectionToEdit(section); 
                           }}
                           disabled={user?.email !== 'jessiemangabo@gmail.com' && (!globalSettings?.activeSchoolYear || isGlobalFinalized || section.isFinalized)}
                           className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 rounded-md transition-all border border-transparent hover:border-indigo-100 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 focus:opacity-100"
                         >
                           <Edit2 size={14} />
                         </button>
                       )}
                       {((user?.role === 'teacher') || (user?.role === 'system_admin') || (user?.role === 'admin')) && !isEntireSchoolFinalized && !section.isFinalized && (
                         <button 
                           onClick={(e) => { 
                             if (isGlobalFinalized || section.isFinalized) return;
                             if (user?.email !== 'jessiemangabo@gmail.com' && !globalSettings?.activeSchoolYear) return;
                             e.stopPropagation(); 
                             setSectionToDelete(section); 
                           }}
                           disabled={(isGlobalFinalized || section.isFinalized) || (user?.email !== 'jessiemangabo@gmail.com' && !globalSettings?.activeSchoolYear)}
                           className={`p-1.5 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed border opacity-0 group-hover:opacity-100 focus:opacity-100 ${
                             true
                                 ? 'bg-white text-slate-400 hover:text-rose-600 border-transparent hover:border-rose-100 hover:bg-rose-50'
                                 : ''
                           }`}
                           title={
                             (isGlobalFinalized || section.isFinalized) ? "Cannot delete when finalized. Please request unfinalization first." : user?.email === 'jessiemangabo@gmail.com' ? "Delete Section" : (
                               section.deletionStatus === 'pending'
                                 ? ((user?.role === 'admin' || user?.role === 'system_admin') ? "Approve Deletion Request" : "Awaiting Approval")
                                 : "Delete Section"
                             )
                           }
                         >
                           {section.deletionStatus === 'pending' && user?.email !== 'jessiemangabo@gmail.com' ? <Clock size={14} /> : <Trash2 size={14} />}
                         </button>
                       )}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight mb-2 group-hover:text-indigo-700 transition-colors">{section.name}</h3>
                  <div className="flex-1 space-y-3 mb-5">
                    {section.schoolYear && section.division && (
                      <p className="text-[12px] text-slate-500 tracking-wide flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        SY {section.schoolYear} <span className="opacity-50 mx-1">•</span> {section.division} Division
                      </p>
                    )}
                  </div>
                  
                  <SectionStatsDisplay 
                    sectionId={section.id} 
                    schoolYear={section.schoolYear} 
                    schoolCalendar={schoolCalendar} 
                  />
                  
                  {(() => {
                    const sectionSubjects = subjects.filter(s => s.sectionId === section.id);
                    const userEmail = (user?.email || "").trim().toLowerCase();
                    
                    const localItems = sectionSubjects.filter(sub => (sub.teacherEmail || "").trim().toLowerCase() === userEmail).map(s => s.name);
                    const globalItems: string[] = [];
                    if (section.subjectTeachers) {
                      for (const [subjId, tEmail] of Object.entries(section.subjectTeachers)) {
                        if (typeof tEmail === 'string' && tEmail.trim().toLowerCase() === userEmail) {
                          const gSubj = globalSubjects.find(g => g.id === subjId);
                          if (gSubj && !globalItems.includes(gSubj.name)) globalItems.push(gSubj.name);
                        }
                      }
                    }

                    let subjectsToDisplayNames = (user?.role === 'admin' || user?.role === 'system_admin' || user?.role === 'teacher') 
                      ? [...new Set([...localItems, ...globalItems])]
                      : (section.teacherSubjects || []);

                    if (user?.role === 'teacher' && subjectsToDisplayNames.length === 0 && section.teacherSubjects && section.teacherSubjects.length > 0) {
                      subjectsToDisplayNames = section.teacherSubjects;
                    }

                    const isSHS = section.gradeLevel === 11 || section.gradeLevel === 12;
                    let displayItems: { label: string, targetName: string | null }[] = [];
                    
                    const tleNames = subjectsToDisplayNames.filter(n => isTleSubject(n));
                    const nonTleNames = subjectsToDisplayNames.filter(n => !isTleSubject(n));
                    
                    nonTleNames.forEach(n => displayItems.push({ label: n, targetName: n }));
                    
                    if (tleNames.length > 0) {
                      if (tleNames.length === 1) {
                        displayItems.push({ label: tleNames[0], targetName: tleNames[0] });
                      } else {
                        const shortNames = tleNames.map(n => {
                          let stripped = n.replace(/^Technology\s+and\s+Livelihood\s+Education\s*(\(\s*TLE\s*-\s*)?/i, '').replace(/^\s*-\s*/, '').replace(/\)?$/, '').trim();
                          if (stripped.startsWith('TLE - ')) stripped = stripped.replace(/^TLE\s*-\s*/i, '').trim();
                          if (stripped.startsWith('TLE')) stripped = stripped.replace(/^TLE\s*/i, '').trim();
                          return stripped || 'General';
                        });
                        displayItems.push({ label: `TLE (${shortNames.join(', ')})`, targetName: null });
                      }
                    }

                    if (isSHS) {
                      displayItems.sort((a, b) => {
                        const subA = a.targetName ? sectionSubjects.find(s => s.name === a.targetName) : null;
                        const subB = b.targetName ? sectionSubjects.find(s => s.name === b.targetName) : null;
                        const typeA = subA?.subjectType || 'ELECTIVE';
                        const typeB = subB?.subjectType || 'ELECTIVE';
                        if (typeA === 'CORE' && typeB !== 'CORE') return -1;
                        if (typeA !== 'CORE' && typeB === 'CORE') return 1;
                        return a.label.localeCompare(b.label);
                      });
                    } else {
                      displayItems.sort((a, b) => {
                        const scoreA = a.targetName ? getSubjectSortScore(a.targetName) : 99;
                        const scoreB = b.targetName ? getSubjectSortScore(b.targetName) : 99;
                        if (scoreA !== scoreB) return scoreA - scoreB;
                        return a.label.localeCompare(b.label);
                      });
                    }

                    const isExpanded = expandedSections.has(section.id);
                    
                    if (!isExpanded) {
                      const subjectsToShow = displayItems.slice(0, 4);
                      return (
                        <div className="mb-4 mt-4">
                          <div className="flex flex-wrap gap-2.5">
                            {subjectsToShow.map((item, idx) => (
                              <button 
                                key={idx} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.targetName) {
                                    onNavigateToSubject(section, item.targetName);
                                  } else {
                                    onSelect(section);
                                  }
                                }}
                                className="text-[11px] items-center flex gap-1 font-medium bg-indigo-50/50 text-indigo-700 px-3 py-1.5 rounded-md border border-indigo-100/50 truncate max-w-full hover:bg-indigo-100 hover:border-indigo-200 transition-colors"
                              >
                                 {item.label}
                              </button>
                            ))}
                            {displayItems.length > 4 && (
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   const next = new Set(expandedSections);
                                   next.add(section.id);
                                   setExpandedSections(next);
                                 }}
                                 className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors py-1 pl-1 cursor-pointer"
                               >
                                 + {displayItems.length - 4} more
                               </button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Expanded Grouped View
                    const coreItems = displayItems.filter(item => {
                      if (!item.targetName) return false;
                      const s = sectionSubjects.find(sub => sub.name === item.targetName);
                      return s?.subjectType === 'CORE';
                    });
                    const appliedItems = displayItems.filter(item => {
                      if (!item.targetName) return false;
                      const s = sectionSubjects.find(sub => sub.name === item.targetName);
                      return s?.subjectType === 'ELECTIVE' || s?.subjectType === 'APPLIED' || s?.subjectType === 'SPECIALIZED';
                    });
                    const otherItems = displayItems.filter(item => !coreItems.includes(item) && !appliedItems.includes(item));

                    return (
                      <div className="mb-6 mt-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        {coreItems.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-px flex-1 bg-slate-100" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Core Subjects</span>
                              <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              {coreItems.map((item, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.targetName) {
                                      onNavigateToSubject(section, item.targetName);
                                    } else {
                                      onSelect(section);
                                    }
                                  }}
                                  className="text-[10px] items-center flex gap-1 font-bold bg-white text-indigo-700 px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all shadow-sm"
                                >
                                   {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {(appliedItems.length > 0 || otherItems.length > 0) && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-px flex-1 bg-slate-100" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Applied & Specialized</span>
                              <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              {[...appliedItems, ...otherItems].map((item, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.targetName) {
                                      onNavigateToSubject(section, item.targetName);
                                    } else {
                                      onSelect(section);
                                    }
                                  }}
                                  className="text-[10px] items-center flex gap-1 font-bold bg-white text-emerald-700 px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all shadow-sm"
                                >
                                   {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = new Set(expandedSections);
                            next.delete(section.id);
                            setExpandedSections(next);
                          }}
                          className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em] bg-slate-50/50 rounded-xl"
                        >
                          <Minus size={12} /> Hide Details
                        </button>
                      </div>
                    );
                  })()}
                  
                  {(() => {
                    const sectionBehavioralRecords = behavioralRecords.filter(r => r.sectionId === section.id);
                    const pendingInterventionCount = sectionBehavioralRecords.filter(r => !r.actionTaken || r.actionTaken.trim() === '').length;
                    
                    const isAdviserOfThisSection = (section.adviserEmail || "").trim().toLowerCase() === (user?.email || "").trim().toLowerCase();

                    if (sectionBehavioralRecords.length > 0 && isAdviserOfThisSection) {
                      return (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveBehavioralRecordSection(section);
                            setShowBehavioralRecordsPopup(true);
                          }}
                          className={`mb-4 p-3 rounded-xl border flex items-center justify-between select-none cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all ${
                            pendingInterventionCount > 0 
                              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/70' 
                              : 'bg-emerald-50 border-emerald-250 text-emerald-850 hover:bg-emerald-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={15} className={pendingInterventionCount > 0 ? "animate-pulse text-rose-500" : "text-emerald-500"} />
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-black uppercase tracking-wider leading-none">Behavioral Incidents</p>
                              <p className="text-[9px] font-bold opacity-85 mt-1 truncate">
                                {pendingInterventionCount > 0 
                                  ? `${pendingInterventionCount} Pending Intervention` 
                                  : 'All Interventions Settled'}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-1 rounded-md shadow-xs uppercase tracking-tight whitespace-nowrap shrink-0 ml-1 ${
                            pendingInterventionCount > 0 ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            Read & Open
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <User size={12} />
                      </div>
                      <p className="text-xs font-medium text-slate-600 truncate">
                        {section.adviserName || 'No Adviser Assigned'}
                      </p>
                    </div>
                    
                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all shrink-0">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </motion.div>
                );
              })
            )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </>
          )}
        </div>
      </main>

      <AnimatePresence>
        {/* Behavioral Records PopUp Read & Open */}
        {showBehavioralRecordsPopup && activeBehavioralRecordSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex justify-end"
          >
            {/* Backdrop */}
            <div
              onClick={() => {
                setShowBehavioralRecordsPopup(false);
                setSelectedRecordToFill(null);
                setFormActionTaken("");
                setActiveBehavioralRecordSection(null);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col border-l border-slate-200 overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600">
                    <AlertTriangle size={18} className="animate-pulse" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 tracking-tight text-sm uppercase">
                      Class Behavioral Logs
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Class: {activeBehavioralRecordSection.name} &bull; SY {activeBehavioralRecordSection.schoolYear}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowBehavioralRecordsPopup(false);
                    setSelectedRecordToFill(null);
                    setFormActionTaken("");
                    setActiveBehavioralRecordSection(null);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-900 bg-white transition-all shadow-sm cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedRecordToFill ? (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecordToFill(null);
                        setFormActionTaken("");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      <ArrowLeft size={14} /> Back to Class List
                    </button>

                    <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-rose-900 uppercase">
                            {selectedRecordToFill.studentName}
                          </h4>
                          <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                            DATE LOGGED: {selectedRecordToFill.date} {selectedRecordToFill.time ? `@ ${selectedRecordToFill.time}` : ''}
                          </p>
                        </div>
                        <span className="text-[8px] font-black bg-rose-100 text-rose-750 px-2 py-0.5 rounded border border-rose-200 uppercase tracking-wider">
                          Behavioral
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Observation narrative:</span>
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold mt-1 whitespace-pre-wrap">
                          {selectedRecordToFill.observation}
                        </p>
                      </div>

                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        Logged by: <span className="text-slate-600 font-extrabold">{selectedRecordToFill.createdByName || 'Staff Member'}</span>
                      </div>
                    </div>

                    <form onSubmit={handleSaveActionTaken} className="space-y-4 border-t border-slate-150 pt-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          Action Taken / Interventions Conducted
                        </label>
                        <span className="text-[9px] text-slate-400 block mb-2 leading-tight">
                          Please fill in the actions, interventions, counseling steps, or solutions conducted for this behavioral issue.
                        </span>
                        <textarea
                          required
                          rows={4}
                          value={formActionTaken}
                          onChange={(e) => setFormActionTaken(e.target.value)}
                          placeholder="Please document details of the actionable response, parental contact summaries, counseling referrals, or resolutions..."
                          className="w-full p-3 border border-slate-200 rounded-xl outline-none text-xs font-semibold bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all font-mono"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isSavingAction}
                          className="flex-1 py-2.5 bg-rose-650 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all shadow-md active:scale-95 text-center cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isSavingAction ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} />
                              <span>Save Action / Intervention</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecordToFill(null);
                            setFormActionTaken("");
                          }}
                          className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed mb-1">
                      The following behavioral concerns have been logged for this section. Click <strong className="text-rose-600">Read & Open</strong> on any incident to fill in or update actions taken and interventions.
                    </p>

                    {behavioralRecords.filter(r => r.sectionId === activeBehavioralRecordSection.id).length === 0 ? (
                      <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400 flex flex-col items-center justify-center">
                        <CheckCircle size={28} className="text-emerald-400 mb-2" />
                        <p className="text-xs font-extrabold uppercase text-slate-500">Perfect Record!</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">No behavioral incidents found for this section.</p>
                      </div>
                    ) : (
                      behavioralRecords
                        .filter(r => r.sectionId === activeBehavioralRecordSection.id)
                        .map((r) => {
                          const hasAction = r.actionTaken && r.actionTaken.trim() !== "";
                          return (
                            <div 
                              key={r.id} 
                              className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                                hasAction 
                                  ? 'bg-slate-50/50 border-slate-200/60 text-slate-700' 
                                  : 'bg-rose-50/30 border-rose-150 text-slate-800 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div>
                                  <h4 className="text-xs font-black uppercase text-slate-800">{r.studentName}</h4>
                                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">{r.date} {r.time ? `@ ${r.time}` : ''}</p>
                                </div>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                  hasAction 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-250 font-bold' 
                                    : 'bg-rose-100 text-rose-700 border-rose-200 font-bold animate-pulse'
                                }`}>
                                  {hasAction ? 'DOCUMENTED' : 'PENDING ACTION'}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Observation Notes:</span>
                                <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                                  {r.observation}
                                </p>
                              </div>

                              {hasAction && (
                                <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/55">
                                  <span className="text-[9px] font-bold text-emerald-600 block uppercase tracking-wider">Resolution Action Taken:</span>
                                  <p className="text-xs text-slate-650 font-bold italic mt-0.5 whitespace-pre-wrap">
                                    {r.actionTaken}
                                  </p>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRecordToFill(r);
                                  setFormActionTaken(r.actionTaken || "");
                                }}
                                className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                  hasAction 
                                    ? 'bg-white border border-slate-250 hover:bg-slate-50 text-slate-600' 
                                    : 'bg-rose-650 hover:bg-rose-700 text-white hover:shadow-md'
                                }`}
                              >
                                <FileText size={12} />
                                <span>{hasAction ? 'Read & Update Action' : 'Read & Open / Fill'}</span>
                              </button>
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        {sectionToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSectionToDelete(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col items-center text-center p-8"
            >
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${
                sectionToDelete.deletionStatus === 'approved' ? 'bg-rose-50 text-rose-500 shadow-rose-500/10' :
                sectionToDelete.deletionStatus === 'pending' ? 'bg-indigo-50 text-indigo-600 shadow-indigo-500/10' :
                'bg-amber-50 text-amber-500 shadow-amber-500/10'
              }`}>
                {sectionToDelete.deletionStatus === 'pending' ? <ShieldCheck size={40} /> : 
                 sectionToDelete.deletionStatus === 'approved' ? <AlertCircle size={40} /> : <Trash2 size={40} />}
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">
                {user?.role === 'system_admin'
                  ? (isSectionEmpty ? 'Delete Empty Section' : sectionToDelete.deletionStatus === 'approved' ? 'Permanent Removal' : sectionToDelete.deletionStatus === 'pending' ? 'Authorize Deletion' : 'Request Deletion Authorization')
                  : sectionToDelete.deletionStatus === 'pending' ? 'Awaiting Approval' : 'Request Deletion'}
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                {(user?.role === 'system_admin' || user?.role === 'admin')
                  ? (isSectionEmpty 
                      ? `This section ${sectionToDelete.name} has no learners and no subjects saved. You can delete it directly without requiring an adviser's request.`
                      : sectionToDelete.deletionStatus === 'approved'
                        ? `This deletion request for ${sectionToDelete.name} has been authorized. Permanent removal will delete all learner records and academic history permanently.`
                        : sectionToDelete.deletionStatus === 'pending' 
                          ? `The adviser has requested the deletion of ${sectionToDelete.name}. Do you want to authorize it for permanent removal?`
                          : `You are about to request the deletion of ${sectionToDelete.name}. Since this section has active records, it requires authorization from a System Administrator.`)
                  : sectionToDelete.deletionStatus === 'pending'
                      ? `Your deletion request for ${sectionToDelete.name} is currently waiting for authorization from the System Administrator.`
                      : sectionToDelete.deletionStatus === 'rejected'
                        ? `The deletion request for ${sectionToDelete.name} was disapproved. Reason: "${sectionToDelete.disapprovalReason}"`
                        : `Submit a deletion request for ${sectionToDelete.name}? This includes learner records and academic history, and requires System Admin authorization.`
                }
              </p>

              {sectionToDelete.deletionReason && (
                <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left mb-6">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2">Adviser's Reason for Deletion Request</span>
                  <p className="text-sm font-semibold text-slate-700 italic">"{sectionToDelete.deletionReason}"</p>
                </div>
              )}

              {/* Request Deletion Reason Input field */}
              {(((user?.role === 'teacher' || user?.role === 'admin') && !(sectionToDelete.deletionStatus === 'approved' || isSectionEmpty)) || 
                (user?.role === 'system_admin' && !isSectionEmpty && sectionToDelete.deletionStatus !== 'pending' && sectionToDelete.deletionStatus !== 'approved')) && (
                <div className="w-full text-left mb-6">
                  <label className="text-[11px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">Reason for Request for Deletion (Required)</label>
                  <textarea 
                    value={requestDeletionReason}
                    onChange={(e) => setRequestDeletionReason(e.target.value)}
                    placeholder="Provide a valid, detailed reason for wishing to delete this section..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all resize-none h-28"
                  />
                </div>
              )}

              {(user?.role === 'system_admin' || user?.role === 'admin') && sectionToDelete.deletionStatus === 'pending' && (
                <div className="w-full mb-8 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Reason for Disapproval (Required for Disapprove)</label>
                  <textarea 
                    value={disapprovalReason}
                    onChange={(e) => setDisapprovalReason(e.target.value)}
                    placeholder="Provide a reason if you plan to disapprove this request..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all resize-none h-24"
                  />
                </div>
              )}
              
              <div className="w-full flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      setSectionToDelete(null);
                      setDisapprovalReason("");
                      setRequestDeletionReason("");
                    }}
                    className={`py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors col-span-1`}
                  >
                    {sectionToDelete.deletionStatus === 'pending' && user?.role === 'teacher' ? 'Close' : 'Cancel'}
                  </button>
                    {(user?.role === 'system_admin' || user?.role === 'teacher' || user?.role === 'admin') ? (
                        <button 
                          onClick={async () => {
                            let actionToTake: 'approve' | 'request' | 'disapprove' | 'cancel' | 'delete' = 'request';
                            
                            if (user?.role === 'system_admin') {
                               if (isSectionEmpty || sectionToDelete.deletionStatus === 'approved') {
                                 actionToTake = 'delete';
                               } else if (sectionToDelete.deletionStatus === 'pending') {
                                 actionToTake = 'approve';
                               }
                            } else if (user?.role === 'teacher') {
                               if (sectionToDelete.deletionStatus === 'approved' || isSectionEmpty) {
                                 actionToTake = 'delete';
                               } else {
                                 actionToTake = 'request';
                               }
                            } else if (user?.role === 'admin') {
                               if (sectionToDelete.deletionStatus === 'approved' || isSectionEmpty) {
                                 actionToTake = 'delete';
                               } else {
                                 actionToTake = 'request';
                               }
                            }

                            if (actionToTake === 'request' && !requestDeletionReason.trim()) {
                              alert("Please specify the reason for the Request for Deletion.");
                              return;
                            }

                            await onDelete(sectionToDelete.id, actionToTake, actionToTake === 'request' ? requestDeletionReason : undefined);
                            setSectionToDelete(null);
                            setDisapprovalReason("");
                            setRequestDeletionReason("");
                          }}
                          className={`py-4 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all bg-rose-600 shadow-rose-600/20`}
                        >
                          {(user?.role === 'system_admin') 
                            ? (isSectionEmpty || sectionToDelete.deletionStatus === 'approved' ? 'Yes, Delete Permanently' : sectionToDelete.deletionStatus === 'pending' ? 'Authorize Deletion' : 'Request Authorization') 
                            : ((user?.role === 'teacher' || user?.role === 'admin') && (sectionToDelete.deletionStatus === 'approved' || isSectionEmpty) ? 'Yes, Delete Permanently' : 'Request Deletion')}
                        </button>
                      ) : (
                        <div className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center border border-slate-100 opacity-60">
                          <Clock size={12} className="mr-2" /> 
                          {sectionToDelete.deletionStatus === 'pending' ? 'Pending' : 
                           sectionToDelete.deletionStatus === 'approved' ? 'Approved' : 
                           sectionToDelete.deletionStatus === 'rejected' ? 'Disapproved' : 'Ready'}
                        </div>
                      )
                  }
                </div>

                {user?.role === 'teacher' && (sectionToDelete.deletionStatus === 'pending' || sectionToDelete.deletionStatus === 'rejected') && (
                  <button
                    onClick={async () => {
                      await onDelete(sectionToDelete.id, 'cancel');
                      setSectionToDelete(null);
                      setRequestDeletionReason("");
                    }}
                    className="w-full py-4 bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-300 transition-colors"
                  >
                    Cancel Request
                  </button>
                )}

                {(user?.role === 'system_admin' || user?.role === 'admin') && sectionToDelete.deletionStatus === 'pending' && (
                  <button 
                    onClick={async () => {
                      if (!disapprovalReason.trim()) {
                        alert("Please specify the reason for disapproval.");
                        return;
                      }
                      await onDelete(sectionToDelete.id, 'disapprove', disapprovalReason);
                      setSectionToDelete(null);
                      setDisapprovalReason("");
                    }}
                    className="w-full py-4 bg-rose-50 text-rose-600 border-2 border-rose-100 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={14} /> Disapprove Request
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {sectionToEdit && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSectionToEdit(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Edit Section</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1.5">Update administrative details for this section</p>
                </div>
                <button onClick={() => setSectionToEdit(null)} className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <SectionForm 
                  initialData={sectionToEdit} 
                  onSubmit={(data) => {
                    onUpdate(sectionToEdit.id, data);
                    setSectionToEdit(null);
                  }} 
                  buttonLabel="Save Changes"
                  user={user}
                  globalSubjects={globalSubjects}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FeedbackModal 
        isOpen={isFeedbackOpen}
        onClose={onCloseFeedback}
        user={user}
      />

      <AnimatePresence>
        {showSelectionModalDashboard && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <UserCheck className="text-indigo-600" size={22} />
                    Review and Enroll Learners
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Matching parsed CSV rows against registered active academic sections
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowSelectionModalDashboard(false);
                    setPendingLearnersDashboard([]);
                  }} 
                  className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Toolbar */}
              <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600">
                    Selected: {selectedIndicesDashboard.size} of {pendingLearnersDashboard.length} Row(s)
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const valid = new Set<number>();
                        pendingLearnersDashboard.forEach((l, idx) => {
                          const matchedSec = sections.some(sec => {
                            const csvSecName = (l.section || "").trim().toLowerCase();
                            const dbSecName = (sec.name || "").trim().toLowerCase();
                            const csvGrade = (l.gradeLevel || "").trim();
                            const dbGrade = String(sec.gradeLevel || "").trim();
                            return csvSecName === dbSecName && (csvGrade === "" || csvGrade === dbGrade);
                          });
                          if (matchedSec) {
                            valid.add(idx);
                          }
                        });
                        setSelectedIndicesDashboard(valid);
                      }}
                      className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      Select All Valid
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedIndicesDashboard(new Set())}
                      className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Bulk Attendance Date Overrider */}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">First Attendance Date:</label>
                  <input
                    type="date"
                    value={bulkFirstAttendanceDateDashboard}
                    onChange={(e) => setBulkFirstAttendanceDateDashboard(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Table Body */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50 sticky top-0 backdrop-blur-md">
                      <th className="py-3 px-4 w-12 text-center">Enr</th>
                      <th className="py-3 px-4">Student Name (LRN)</th>
                      <th className="py-3 px-4">Gender & Age</th>
                      <th className="py-3 px-4">Parsed Dest Section</th>
                      <th className="py-3 px-4">Enrollment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {pendingLearnersDashboard.map((l, index) => {
                      const matchedSection = sections.find(sec => {
                        const csvSecName = (l.section || "").trim().toLowerCase();
                        const dbSecName = (sec.name || "").trim().toLowerCase();
                        const csvGrade = (l.gradeLevel || "").trim();
                        const dbGrade = String(sec.gradeLevel || "").trim();
                        return csvSecName === dbSecName && (csvGrade === "" || csvGrade === dbGrade);
                      });

                      const isSelected = selectedIndicesDashboard.has(index);

                      return (
                        <tr 
                          key={index} 
                          className={`hover:bg-indigo-50/20 transition-colors ${
                            !matchedSection ? 'bg-rose-50/10' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!matchedSection}
                              onChange={() => {
                                const next = new Set(selectedIndicesDashboard);
                                if (isSelected) {
                                  next.delete(index);
                                } else {
                                  next.add(index);
                                }
                                setSelectedIndicesDashboard(next);
                              }}
                              className="size-4 rounded-md text-indigo-600 focus:ring-indigo-500 border-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            <div>{l.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">LRN: {l.lrn}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-semibold">
                            {l.sex} ({l.age || 'N/A'} yrs)
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-700">
                              {l.gradeLevel ? `Grade ${l.gradeLevel} - ` : ''}{l.section}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {matchedSection ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-100">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Valid Section Match
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-100" title="Please configure a section with this name and grade level to enroll this student">
                                <span className="size-1.5 rounded-full bg-rose-500" />
                                Section Not Found
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between sticky bottom-0 z-10">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[50%] leading-relaxed">
                  Notice: Invalid (Not Found) sections are unselectable. Make sure sections exist before running bulk uploads.
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSelectionModalDashboard(false);
                      setPendingLearnersDashboard([]);
                    }}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isUploadingDashboard || selectedIndicesDashboard.size === 0}
                    onClick={async () => {
                      let selection = pendingLearnersDashboard.filter((_, i) => selectedIndicesDashboard.has(i));
                      if (bulkFirstAttendanceDateDashboard) {
                        selection = selection.map(l => ({ ...l, dateOfFirstAttendance: bulkFirstAttendanceDateDashboard }));
                      }
                      if (selection.length > 0) {
                        setIsUploadingDashboard(true);
                        try {
                          // Group learners by matched section
                          const grouped: { [sectionId: string]: any[] } = {};
                          selection.forEach(learner => {
                            const matchedSec = sections.find(sec => {
                              const csvSecName = (learner.section || "").trim().toLowerCase();
                              const dbSecName = (sec.name || "").trim().toLowerCase();
                              const csvGrade = (learner.gradeLevel || "").trim();
                              const dbGrade = String(sec.gradeLevel || "").trim();
                              return csvSecName === dbSecName && (csvGrade === "" || csvGrade === dbGrade);
                            });
                            if (matchedSec) {
                              if (!grouped[matchedSec.id]) {
                                grouped[matchedSec.id] = [];
                              }
                              grouped[matchedSec.id].push({
                                ...learner,
                                sectionId: matchedSec.id,
                                sectionName: matchedSec.name,
                                gradeLevel: matchedSec.gradeLevel
                              });
                            }
                          });

                          // Process and write batches
                          for (const [secId, list] of Object.entries(grouped)) {
                            const batch = writeBatch(db);
                            list.forEach(learner => {
                              const docRef = doc(collection(db, `sections/${secId}/students`));
            x��kr�H�(�߫(3:>��$%R�jI>�,��ǯ�r���s�A16 ��E��-܈���������Y�'I��ӟa(TeUeeeeeeeb�FQ5��˸jO�����K�w�L֯��U�gG�m|<�tW�ȢY�M�8*������2iTV��r"����Z
�$)l2�)�Y2���	D�5�_TqV���FY-&qV�Z�Fq�!���FU����v�_��U�d��N$��AWfQ�j��צ]�N��(㣬j��A�����N���2�1�U^V�8���i�
���M�Z���)<�%ZOgI�b� �h�WQ�(��gB�˫�0ůO���ٯ�t'Q6ֆ����$�"�ʓ�(�ɑF���w�e�A�b�Fc�ThZc��L���������,*.�����ITM�	W�-�&��܅�ҚB9]D�$�2��z]Ho�4B�,��܅�m
y̐l�M#�1O��d��Iu��@��t2��$�j�7Ί<M���b�Xx�&P����u���b�[���ܒ��� k��
0W��js���GI�E�q>�%U���՝�� ��:O�:�\~��Q�ծ�E\��Kfq�����ݫ�E�T�K�666V�<����qʐ�2�D�
g�7�oa���Gk����>Y��,�����jՂ�Ҹ�ڭ�4�Q��!�d���dA�OH����LN3x�r�&)p�9v�,�Vޭ�񊌑H��N��
��Ӹ�foЏC�L&���p���'o�{eL��x�I®o�I�,����0G%�!����_��ӯ��c��K�Żˏ'i|A�*���1���O�yoH���d~����贗 ����d��CUi ���w>8���{�"%'�k{�<���%`ucDhUD�O���y2�Jǋ�̋�<Oh*\����T�rM���l"�Tsև$���]�a4{��mH9���q����h'�Q@�V҉���$����e�{Lvww�F�<&k9T+@okC�!�+lt~��fy��m������q���]z����񃡟^�-����ܻ�(�e �Tq��'Y��׀Lg{�t��F����u�jQ Vt�^�Z�����+�"�	g�5{�O���1��ܰ[���Y-�*� �Y�$gv�'qg�6�}닕U־����
���=�#�ρ����"�ܘ*��Y^��K��Ŭ����H14i8��L�o��S��҅'�K����O2�b�[�C�L�%�8]��t�uBۀ�X�I��k)]|簀O3�����Z������D�
�<����pi#���Yӫ�C��4 �W��dV���|.{�[b(v��:H��g��7��x$��X%�(��[j�w�|8H�q�Yq�ʩ?��E�N�wm3\�>���8|���������ڌ��5�eE����"����,{2�l��!m�}��Vy�N���+�F �ڽz?ؘ_|`v����w���'� ���P��N+1�el���,J�e���¢b����`e��I�!x g,�M�~�qէ�A��s��u����,�Q�T��m�����������FR��N���}�Wm��aA���ǆcO�Ō��L�>X�-�S&İ�j�IRF#��L��2_:��`��6��xpR5̭�����?ON����F Yd	̽ ܺ����9|��Ah�K���/��>�r(!�)���F�C��cI�MZ��1���ˎ��t�i���_�ݝ�(��Ռ����0�K�hƋh��Ϗ~�3�^dD��4�p#Zq��C���5�ݩS}�d��m���>y�Շu����l�q�v��mm͕n�7��p6k�����o��\��_IjIEul�%:!�������������y���oBrcѺ�� ��%���D�����CO���X=B�yC�2}��o���R��k����P����Z:2��_����Y 0��˩��!�Il_�p~�3cah�V�*���������o���Ť�ǉ�#.�ɂ
��|���"��/ן>]��޴TMz�m�nH�6����-��e|�{Z~����;1}K���@A��,Hߩ�6�_����]�&h��������@�wr����kJ���Lb�?�ˁ�*9}e9��O�A}���H����7-��v��e8;���:����4��|��o��	���"���l�>��_���\S�C���'@|'�۰E�$�捪�_�AFiyk�(a|��o�="�uM2|�8��R�����(;�oGZ
�w�
d��.뻑9� ׀魇J�4�P}�{�%��O�
�ӀҀ:�(��n�a蚏L���ț=����Qz�0
y��;�N
}γ��,�xG4ś�I�O/��
߸��O�|���rIv����I`W>�G�-����i\�Uv���l�[�������m҆o�h\����4��:˓IW��4�U�oE�iezӪX3ͮ��h��Ig��d�D�I2 I�c!����1n[�/al��EF�d����E��X\��%���J���(��U�,O����($.���u)Y��y%��~T�H �x�r~���JNH[�pT��O�촚�=��)nz�]2�I����
�Ũ/��PV-���L��[6�8s�-h̛ �iW�;��$�k����.��C�Z�tE�>���O�*?Bf�6>a������^���ܒv����׸��G��4>.�t��}�vJ�H�Ӧ$!���1-�,IcƱ񞞜w,��<�aֈޕ�S����~�C�����:y�<E�W\!W�l�[� ����<�YE{ ���#l"M��<�h�H+���K#?ώ׷Z��nF_WFK��~	���׷/��#��Z�@�XS��aa�2D�e6&���+����_�дY���ښ�>��\�w�Մ�w��]�(#/޾�����AC��;�������۬D�
u�~}���s��O�0�rG?��>o�	����������˶]b2��T������"�����utvd�9�ˢ9��k��4���d&���b�~<�W�:�A��E�bt���\��E��ʛ�V�˞H����HWP?�=��a���Hw���ŮUC{xyX!as�4zI��(
L�\
��֐��aJHh�w�/Ȼ�s��gq��<�:���X5�:�ǇF4�n
m�)�f�*�~Ģ��-:�_�ܒ�4��V�Л|�@��P#���x��@��3�8�@K�VI]/�Y�w�� �N�@�	О�����k &2!��9^�>ǻ3'(��C-�Ck���$�`�@��d
&��_s��0\��%t�izӁ�YFs��1ܥ�%�3�R�\��0=��>�j	�tf�Bx;3sҕ��I�ܜ/Zzɠ'-R�{�EK��k�m|
�XE�߲�:5K�d�����YB&{���Ռ6�4��(������<����7�"�u�����̂��Q��ش���`����͸�"a��t�������\Q�š^�?��Lk��Q��Y[1��Mo7܏M)�RQ�6iu�r+Өy��)$S>?�qt�}��kAם�\��\P�,�2��N9Jw���gNV�Ɇri�����3�V*�iN��@�{�wԥl|�xX�����R��a�/��`�����	,y�Q�(��;�6�d�iw)����1��s��ԫ
4��h����K�����G�/4�Jh	���Q�*d_�aɎ����7������5���f���50��w޻w�J=��B���G\ORx�glD�?tA�O{�m�M?4��G�{��~g�:��������<�ꌱ��E�[�
W�<:
:��t�A��+؜p��>Z�.����gV�u?X!����.�:�d$.���kTM.~��H�Y�˥Ү����j�JRZ�c�
�#���Ƶ)��R��yú�,��� �3-M��re;���c��`�H�x����z/I�;b��Ai�9������R�������sWEK9�54��pn�;=�+G�p�A���֜��P�3Dr��^���6�=Խ�P��j�fȐ���w��ИT��r�O��p���s���_ɳ�o�.�O�W5WQ����
�ȖM7=��L��Pb�k�٨�IFi���^�x��C�9Z�#<�P�lB�]"Z���v�Xֿ��[��Cڹ���I��������a�ɞ��m���<���\���q�3Ii�����dũ]��4^8t]��,�hw���kqz�D�^�8S�'M�ED4z[�,\�h�Dw��h�z4d	�9�i��/�!B1��th��MqB�a��/�����!Of�v�Day���N��0���7�`w�ѵ��
��v�?���KC~\<�kV_{]
�F�Қ�*�{�M�����n�/��T�ĵ�
Ջp�����l.M���Heb31�>g�j9V�'�^��U�y<���f�8��zN'�h�y�Sp��O�,�")�er�� ��ڒ��q:�����1�i{}Q~���6��m�,��N{O��C�0��)l��cu�����[���]9�<�22,�>?�eu�ҭ2F5�9?��\�J��k�{H���u��:�d꿐7֠ӝdvJ�b��A�"QZ����gI|��3Lٟ�� �5[�Y��<]��#� �^C,��G�
�H��6O�uϝP�؃>�)G���l��=����x��u7�p˄�UN`=�[�'_z���5��O,��x��?��-s|u�}˷�BY}XGg~v��\k�v���iL$S��%�Fֲ��F?�F[�
�Y*dԩ" ��EE��u���îyC�!�����}.�ݥ�f��������D�q<��`��?�X��f��xZ�!/��z�E�����0�w �,֚*��s`��	1�;�i]q�j���w�%�SA	T��
��!��K��c��l���׷�MO�m�����&�q�S��x �$�
I�㵃.Wj��~Mm�Z��}B]@�}���6Vw0Fq�^ |�B0�`Zcpj����^�~
�9(��p%�a扰��]�;�����a�8�'U�/�wG!�z�|)��/����O��%�59���K��,"�:)Z�7�E͐�;1�#�M�Kj,�u�6�U��m;�ңn&� �A�&	����E��ẕ蒣���iYIݐ5��������狷��aҢ/�	d���H��|E��")��jꖇ]��o ��#mj+hR�O"�ƈ��0ü�"��4$M>�P(`���T��ZK(f[Wh�x\"���2�����p��Q�Uv�o�c�p�8V��'ѥ^��o4䦥���g0�GE�Cz�~3uU�3�K���	�'�� nfd�l '�'�
5@*�d�@YJ�>b t�׻~�=�����!P!@.�Ҍ�'U��̲�B!3WF��#2������S�:��y�!�(���ot+�ڤ�0-y� �Q]lY�@	C�T��M�Kl�Yί^g����I�N-m5RT�Tw������~�9����4�L���$���,��|2H��-�v���gD����	�O3V�>e�M�ҧ*��оA��E�G�F$u��N5R�MB<�/��玫q�F#Lo��r�����
o��㒊W:7C�!~[{��?���3X8��.�顕�:9Ă��[��P{��t�E�\�I��j�U<�mm�M5S����+w\�٭6�����wo4�|b�_�����:ǳo�:�e+���9�=qN���ݐ�fW���j��N��W��Z���[�cz�6`����Y3����w�.
�'B���%͒.^	�O��\�]�B��'/���(�giUm�w��7���:վ���&T��V�c��%�\��a)�q�
�����l���@^u<��>7�#�����|�3����K�7���7+:�^���=p7���o����:r�_6����1�����8�k���ɨc��F���7'��VR�C���xo��g`A�JJV~d�ζg![IN,��x���Ѡ�-2�����)D�.��HToXhzOx�-6���,�~�����y�jo��W8�F�ۧ��x��h�����쎜��[l�c�_�3R־hȑ�Q��Q=�ɦ�Xש@����1��z����F�ހ�D�QO=�E�����2����0�Z�_�c6�[(�k��@A�ͫ�;&��J��"t��V<��v�k
n;�.��N����§!�uE4I�����HfQq	��e�,��`)W���	�Е6�L~5���۪lǸ!�'��}3����|��-Z_
����}c004A�*�w	��\uF�0Uo���W��������\�����`le�ߜ������*��0uK���|g+0���"*&I���˩�ҍX�*�ߌ���,�P��dW���[r�w�����-�f�g�4�Y����EV%+�:ALz�>m��t���w"���~��
�/���L��!�D�,��՛n<7�m���Q�k��ĚtcU��B�
�9*��D�2�Qz���u����!/\")Y��I),�d���WnMV��s��X�m�2���6�>A�v��3�̑��sB���YFِ@��س���"4�V<���5R-�u.�b��ú�uAi��G����A8����Ͱy���	���]5lo�I�z=��O=J�m��C��_�K�Y�nz[�u�kف̨!6O��}��d�H3��҃
�'ȃb=�@�qǦуٵ��r�h�7������)
̪�g�r��E���i�	�ӟEsZ���$���.a�#���~��S��%��8?����W�O�%�J���G��:y��9~�a�u�1Y�Aռ\R���/̐C3�:�J�M�:���	L܍�a�*Scm'+�����*ąoEџ�Dĵ�L�F^��_Q�
�
�
_��?�ǲ>�`x��&Տ:��R�����ܐq��M��"���5�6T�	���U/�3�{d
�B��Clb�%��iu�������˺�������j�1^���+/c^Q�Dg-�����&Q5���+_Gޡ�P��^�=\�h[=k�n	���&��}�U��U�7-:�r`��>�������q����dY��>
"j����l�$9]��
LY��X}�ʕ�ʐ�Q��?7O�5ݺ���_���� *�۫�_Z���k�o�����}���}#{7q�2Z�ԝ��ͽn��_R��v���*�AC@�F��5=A�4!�n�%
6M��.5�p���x�p�Uܣ���K,�^�k�������^����� V���c�P����ԣ:�v�W:�GC�U'�̮�J�q��f�Ǔ'�P����5�}��m�ͬ���2���]9��4�"��"f0c�X��}�S���|S�V���Aeyp�.��~�q�ۢ���G4%fD�)LCV�J�h�b�qS����8J���ע�^������$�}T�X�/سҔ�'��txrp�}�<��tyP�,���I\���;�n�.o>�}�Q~c�;Zی�J�3#։a�c#~�h�Z+���:T�9����vi�`����a<%�tQ
�7��O����qb����hRc��A*OʸSBD���݀�����hz�0/�>@����&�=t�Lx�Er��Ayr�0��p��~��������qe~��w��^��2�1
I�!5ʶϥ���L�Ί������8��V9@eOsK�f9�r�!
ĩ*]��X�
�Z�FG��E&%g�t�J9v���S���|QN�/
:�2�\�7�7�:�V�W.��l�)��hS�����-R2&r�O�zv��J���ؼ�]���Q8���>%����E��QNl;�6�0�������t=n�#���M�,��2�cS(?��4���F�f�Uvu�e��.Zh�SiI�Z<eBy���D�d3��P�;&$�K�uo�@�2Q����d�WQ�.8ǓgD����,����;/��ԧ�䞏�bV�;n��|?����{�쮰�`LC=��]۝�]B8�@�Īӧ1;"�	�9��5�G4i�{�-�@�F4f�.yU�>�
(���8f�vw/�x�['nM63b�,(-�Bb�%w�p� u�V]}B��L���%l�Aê�7�?��Y�
�ц��W�+$OTd����*�`�f��Ӻu�zq" <��Kl���
�9����q!��_���=��@l��E��Fc�d`L�|����bnjq1��x��ڡ1n5��ozWE��������;�1�1,lT]�L;��#�j��^�?�|�Bv���B�Xs���7�ǰn̒1�,�F���B�S�Z�5})����T�;(3y�c ����� �>��Fz��i����(;��Q��4Z8���d�웭<�zۄ�W��Q`�Ĵ�7��5b�����7�Q�;�G�6.�E�C�~9��$ð-����M�R@�/@�m�q��bN�\�푫wHc߈�I��ߊ�?����'����	~���4lp�4���<ù�7k��z�g�N�5*L�]r$'���?�&�'<�1�d�[14��r�[��F���A�����_�������y�>��#��{�*4(�Q��]�[k�0K���/
�,��3 �K��$8�' �xa���jnҤ��������|��^�@�m� ���[~ŏ�=з�ת_9J�/�_�
\ؾV��EV.jU7��z�:���̎+���OVUxák�2��(/�Pzv�{g;̢r��K��tB����gm�SG�R��@�ⱥ�Z�5����9���U}(��V��zY�.��L���U�2�#����	�;.N�q��̏�����Y��#:ࡉT(���M{��V�5KR"��|y�B"�&���#M��8aB��C|�V�)$}�W*nh�M�Wh�k�V�nqŚTx<o�s%	Վ��G�}m �\]�h��#o���m��H2j>Mq4�@�=fj���WL����-�_a-�hN��Ú��o�±�q0���v�3��Ʉ��9��۸R�;�Y$z�ȏY��$���Sj��1�Qco��������$����j��"��lu�/A|e�h�q<�d�,�stb��W�<Q�i4�i����8����'����4f$�Rocܨޟ�Q�IOd��,FiRN)_6ཡ�r��ip�X�>r�_˸PU�g�x��G
�n�����������L^dҸ����F?��)tZIi�h4���s��vm�wF �)�o�h\����T/O�u��a@ P\}0�	2��(�:�7rH�_	3�7�P|t� ��=�Z�Q�:��W�TPQ��7��x����L;S�*y	�(E�z���]�	`�0�����8�͋���怬E#��e�z�y����}s'�c����x[����r�z[���{g�i橖�w5=�э5kk�z&�c���hE���mD�<���˜�7�&n�H���5����Ijzm3�ǲ	.�y�L�9�cw^�籘B��(�n���Lɰ*��9�d�䈚�k	�͎:�5�2J�T��g�a��wh��h�����[q�G-Jt.��_�/��8 ���~#��xG�g�dd�;X�Px�Ǔ����(0�a�a8�퀈;}��Y۱�APO�H�:�A5�ʑBk�Ъ��z�:/�sq��\~�8�����1x�.3n96&����w`�~`ֻr�Уf�O���8z�qF.2�I��5�TWL����ʦ���}R�:�M!��{-k�X�"�8�;�߽|AS�x��)sV^߂B?^�`5��_���:߳�9��UZ���`X�򅊯�n3$X�����֢4��"�0,�T; <Q
p'%p��L3�S�˶M��]R���\���zt��gh�3I ���f"-�v�������::��Öa�E!?�3��j��ā�nS���j?��Z���<z�Ĳ�D��X��dBs�A��!Po�Q������"&TiD~�_nl"	p�d�<\)y (���&_��i4���)~��ٚ�����4���K���梇�|*��@�6�)�{�d�|�^d4�HA(x=�2ڻw��M���+2,N,����5%����̐*￮�Q��}�� ��7�g|X���r�}��$�fSxI�v�kx^Ay��b<-��>��5r����E��^.�"r �&Xc�F���kc�(
�ʅ���K�N~$m^xܟ 0�sM���Ov�o��U���=�Q��~$�
X^u�
�����h�۲?�M��d�袽�u��3��Wq]��>���_c���Ԛߠ�{t��aɇ�j��q-�`�f�7ױ�E!y�d�w���q=D�ճ�"����'���(��̉��{��6%u]]m�f[WɎ�S`�z��yY���j��$�SR��"��Di�o�|�ui2erJ�@g?]�Cx��<T\��w�j�54�ۂ>8@=�M�[�8��^��������[f7ͽ~ ��,��w�E3��s�j
�r:��B��-���Ե�{?6pD��:�ܛ���z"2gW��en��Mk�������
tݺ3�J�wE���Վ東#ܺ��D�wA7�V/��F����
�"�Ѽ�yc�N����,w�ܽZK6S�"Oo\�fc��n���O�4n�O�<�
�'�;B��t�s�����[�M��݀��d�rL����A�,��v8��o�Z��
��B��F\�� K��Y���X���[@m��;][4�������+�
�|�g[�FU��Yp%�����8}�$U�DםA7�}�e蠥ȍV$��}Q��x�alx|CJ�<��+~%�C5t��T���ʁ9ЏV1U�x��ɨ�Ʀ^�T���#@��L�+1����b�U�dܱ��!��
(�ծw7��
�/A3[���u�Qo�\�a'�%�Ӻ����vOnl��N��n'��Mw��
W��	�m�V�)�j<�%DK��Ғ0�6�����߻$a�b�#t��h���
������!� ֏����.�k���첃�#aF�����E%�9��724�6���[��պw	�*�RN����߮ذ|4��tVl^̩���!�EA�[Qu,�1p�,�1����an��r��ܾi.�B�
;g��v�k:�ivJZԲ����E���'��f8풞B�������7�^sQ�:��/���w����s��:�r�Q?A���'�S��������Q�Ά,�'^�^��ߙ��Ǳ�����9�9;?2�[����b�%�g�xw'f JY�G��7����q������:�k�UK�*�&0���b
���7<N7uW�-������b��g��L���]��k�E��{Kq�
|�b�ܣg�W��aO$�!jУK�@�K��j�r/CM��-�Ʒ(����,G���h�ּ���վ��q8,�n��ݴ0�zB���k7��w��~���ψ��z6����,7)�ϥ{��
la5����tQGgf�N�wH�6�vG{����=�����v'fҦ����Bh�5�!�]ޡ��L�C�D>����R[��_������~V����]m������3Է��-y���\��]��V��vL仳d	��S���i���(���a
�(P�K��Rꦐ�v�I$�6��H�n�'���:S��r`i���"<j}�dPύ&�N��+]攉�w�M�F����[�.}y<Tn9�Wg���'��P��B�o#��dPR"���f��-�{5#�v�?#N��X>K��4�n���^�j¿z����b�Wb�w�u�v��?��34?�\C��e��G\�����p�,��>��%}�_ߟL��-�;�ċ��˸,�e�o�nM ��m0��Ƶ��7����kG��ѵ]�b'��>�m�K+U��]<���e۹�I�H5��οnfי��b���Y�6��~�%ࡏZ<�U�9���������i�p49��ϰ0h�ʹ�vX-�vAӨ�n�U����~��hL,�z#�'�rWaGӢƲޚ��1t���+J�~�hBhA�|��^���Q
_�g)�
��kv��k�C�_�/��� SA%��`�,�n�<h��[dܺ���	�=����gX�1���C:['h٦a�+L���v�[��Q��X�ԼuZ^����Trk�Os�fn��i�������_�jd[3���gY|�M��"�f�j�u����T�6��~�!d}m8���pkUGufI�KG�C6IcTp���f�F�P>=����ý������ D^�w<M���t��D�����S]���>ܵ���`��q�0e��>v�-MW.��gVo��!]	��x�~�]z�{�R��̧�OF�h����x����+[gg�)֒���҅��ů�r<�ϲ�N���M*$�8��C�h>�Kf<z$���hr�9R�_�Me�y��%���P�}�a�7��i�>�3ʡI����%E5E�j����v����C_��J~��{�$�_��<ҿ0{D�8�S�3V�`�Z��e �9W
Ԏ�*2Z=0�X:`S����`S#���gٟL��K����<�W̳������TG���%�i��p��~@%���$Wy���ʠ<�����R������"�A�DH�d2La/cc��1g��y�@���l��a��� ��7Ȣ�d5sy�D���;���I��8���[[�f��PdאG�ū5z�A�"k����ءEp��J�&**��H��#���uI���"�T������E�+�����=+���M���Md}�W��1;�j�+YZ��ۙ��'@:�Q���E�
�>�����a"�
M�0�3竞9X 2{���mld��>5�V٩8k�=q^�>i����}��~z��lvY���-��٥ݥ�[�AV�$��k���i�i
��@d�t�������o��z0�^ƕ7��d6��.�xKA=�.�x�C=�Gt���R�g�f�5�i&��jd`��������D#/���NmJ2s2jQ7mP����xf�c�kGs�a>?����� S$���3����-'r������f�3��aU>9s�d�`]+�D,��#�z�`���K?]9A0��,��2�ҭ�/���3hYu~���e-Y֖�R��g/���T�$s��)`��.�gLk��퟉��Ctv�0�o
�G\~��O$,/��
�����
�ϑ+�=�_��}��
?��9C���ZH�V�``�m������q�iM�E�e�IhI�l	��BXy"�9�R5J,��}�\���z"֦^L��D�|zZ�.@	�~]
fwd'^�F�C3���Zy���j�y����t�aNuQ�.�4��F�
����:�E
���c���TI�L(�����-��-7�R����b�� ��L=�P2�AW[=��3���#�+/pAb��}�ҕ#D-�rd1O\5��)�J
��O�fћWN�*�{��  R�!���2��^L�ax�6���">�*.Ͽ�-t�p�:����"9w+���oZ$�[��t�-�y��m��.�Az�n�I����$HGԄO?��޸�|6=��޼!������-�tp��6����5ش�X4e���p
6�qk6=�5�~6�y6}�Vlz�3����`�nΦ���l�^"nͦ7nͦ%A��=�!����'�5�z�F��,�hI��lj/��s�����J�|[�%t�]��q�7����ۤl���UZ=+Γ��InyP�(�<��n��w�/sp��s�ѕ�y�ᕑ����j� }�*o&�fYD�x����v"�	�.���[|@
l1�s\�����T�
Y��^�Ju�,j)0�%1б�b�*7wc-�Pj�`	����,MF�dt��HeF0w_P3*YD*5Xt��)��0�5h�S&J�o���,3�/�"�v�F�j|r���Jf��q�3X�yA�1� ������yG�De���_�}��PO�/�5��u�lv�v*��Qn&nw k�[�� Y�5�n����m���L�2�ϟ���d4dEG��5��m�6�}�	��.�;�����179ےFݭϊ���.,v=+�r!�-oH�^ jg#J�{�`1��腞ڌ�,"74����	R������6�0��g_�������Α�ۜ g�]
�z@g�e\2i�e�6T�I1���BF�^�J����K�;���X�]�.(����و1l���b�vy<6-I�7�g��
~#W��� *�rR��[E%GY�ǰ �;e��c���Q��������с�����}���=Jؾ�gq���EE�,��K��a���ҩ���?��#)%��c:�ѥ�Z���,f�i-�-�U-�CȔ�l.�T����<��-�R�,ڗ����_�xYK2�%]"<����!ʋ*I?K��Q�K�S�uE�x�{��<���&z�f��1�0��p/��,�X�)*��ԣ|�])��A>Ȯ��|��}]��KRM�k'�w�/���&E�$�ƹa�EG�����d�wu��<3�g;<�ۮS���Ԩѣ�!�d�q���h��1�l��!�Ct��v(��r²��H��G�C�m����3
�&!���O��Ӛ�8��$u¼������ǂZ�9ϣ���ʘI��sj	��X.[ ;����]���v�3�m�.�\W�(y��d�'^¡�C9L���͵ؙ$r}ufI�����o�jg�12s�w��x���
�/��Ym���p��a�im���$|�o��&��U�	g� ͷ.g�����uƹ�Ў]�?����/эN�^��M�	��rp��w1�����\0c�]\�[/}&9�K�"�Ë������!2��ɻ�O�.���r�ݧ>����U�>֢�Ck��3ݠv���{hl#�ף���%�.*؎�>��y���I�vM���6�{dM�'j�=W�{��9���	�R͘��)�oN蓀ˀB���d�C����b�{��E�u����p����m��@j�Ɛ��"�\w�1��mz�-��Eɠ��{� �8���p��q���ս�6�5
��í>��v�&�G)��<oJ��^�PM�������������"�EJI�� ��#�Gb����(������>z���ֽ��`����S�%�b"e����
7��A�	!���{����Ϻ�}�ч�u����[\v�s��g� 9:�������O��˸i�M<)r�7^�`�e�n��3$2��K>s��+�a)hE^}d�5�4v��	<��+�� �2-�޵\�O?����W�����5ɘ���O m��H5�10�*�4�nE-#��@��o_�|,����U<+���
���cYN�������<��A���gq��)�8�C�Z��2��gI��jk,Vg��o�|rُ�w�`��<�����o!E�Ŋx���N1DE��4T�^2Vn8�p�}3G��K�eo��G����mg��
�����iUp��yv�<O4�A�6[�O�����{�ކ搶�Oۭ��u�h��3�dx�%���=-;~��˓.�`�&��v|�&�ߦ�k�E��a���,��M����P��V?�{��Ý�����6cx1���W�k��>9I�I�u���>X)s���+&C^ip
7bVa�D�b�PB\�'�K�]�C��
.�Xq�v��5D��'��rN��b�?�'�~rH��>���	·(��\K���Jm�H;��w�}7U9y1�]��f�?�����5ώ��Xy��77͜�2(m׋�E�,������
o�~f���e�Ѭ��
��O�w�A���|�`�\��;��]A�ޯ��\�xW$��q�!���#�	~i�w�,�UЕ����C?6�J���B�Q��P-a��X4qHݼ�[�v�j������#�-��
��9���fA�if�1��0b[H��E>|����V&L��&�3�ܘ���O�bI5�Iu�O0��:8,�,4S���6 %n`
ۏ�_�~�9��1��Ӕ�p�(����˞I*��*_���d�nb�?#���_$U=]�L.�	T������`��j�q�G�
��(�8�.�A̞�l���Y$r9�\�ZBPo��%�p��VW����C
>yсVn@�y�	_�:�Y��+V�sU- ��]��fCH��� D�!��v@js�c0$��>\��َq;2T{�t�Z[�۬M��W��lԻ/�q�� ���ޕ�6ޱ���nzC��@[��nG�1A��u��,�b�Ž�#s�-У�(MYP��M�~͠�i�q>�F`�u�V�
�-ڃ7#q�C�zp�_��2_���Σ�	b��܈����n
yQ���e
UH��+y��wG���"VzI����2RM�R�v��𚝢I����(NK�1y�9#���,�+2�	P*�_ߡ���y@g�i�L�8�J�*R=��f�8�k�/�O�L]�lz��T�Ңw���(��fҍ|��k����������ք ���tUǓ��$kӪ-l����v�����3��� J)Ϫ����]����/�ͭF�ύY N
<��Ɩ�`�
�Ԉ(8��4&
_ �u%8�
_�.ƕ���wY�3X�l��u�=M{�n�M?�T溞XrX@}��<<�BW�9V�->��оe˫��>z�Z=l" 6WH��b�`C�i�Ԁ(: �o("����g}��s\9���X�[����i e��������o��V}���!����F��*�i�:_�
#�2�n7���G�kͥ~5��?p��!T��uvV���[�{�o}>�3�_��C]įQ����B�z�kG��Y��,/�׌>n5���D�֎իu�ӯC�~C���3n��#��H7C7��CH��k�Lp5J�;s'(MuO�!�����Lv��{ϯS�0��@L
��n/=�g`Ec5z�K?���P�"��֤�?��x�L����ڽ�J�`�;th�K���c�[\�l�9����Svu(~���5m��� ��"����MN��7����.G���e}���O�i�;��2�3퉿x۴R��;�/���Pռ
	[� 6i���������^N<O���$�I`� �C��s�
 I�Qʮ�Ke��>�Kq�t2/�3�T�z�����2S�P3�dF�N�(���$��+J��w^�B�{%�[��])�_��R �8	�]��z�{8���R��V����G��v
���]oĆ�l�ď�C�⡨,���(��[��2�52���SX�?��6v�Ca��b���S1�f�&�y�2�Eu�x5ˏ�5��mޠ?ܢ;=.�X�
�=��}��dZ��D<S
�G�!f��-O���,��'���f�*��Z́x���5�Z~<��'Y�:6K��r#L;��Վ�
���͍:l㴻��֒}���=ʪ�?�I&�twI���$�������&��Z��B� ��祁x��;���0�k����׽MS����k�.��
8�fF�[��Z��(�6�}|5��rK,�:/��
|��4˳�N��H@��"k�}���>Ļ��w��ɑn���:PrW,���|DXzq�(F
6�9dUwr�:G�����
z�"���ו5�G�
iED'��Ь?Dpl1KZ��"����R$�I�K�j�?z����鑥�wӰ�`��I�/����Yi�s�S�K�;eT';�6{�
T�>IٷKQ[^Ά�M�w��"Fҹ$Ӕ�� MМ?>�(�lG�O/ w#/޾*��fAͻ&����v�ȯ�ɹ ���9|L���V@�[�}����ԀM�2��d7���`.
䭲��
 ��U�
b����W��g+E�W��^��;�~�^���$�U(�����}�Fn�j$W�U�jsl�����P`6߯*.k`��7�*�i�u�jP
XO�
���u	�1ۈ���+��9�XU"��j�jJ^�
��㢨M�)�Ӹ�f��Joj��cZ{;��3�l��'����Puؖ������9n�}9��2
$�KZP%	����{x�c�ᢄ}(�~�< ��)c�����ꂛ�I7���Y��/�HՉN��j�-����`���춾�Qsg
�k��s}�%-�T$���-���_����\�ʂ�C������.3�2)�u��+��L�
 ������g��4�
�$0�% L�a
_�ӕ9,���h��Z����	�f��>�������\�+�(ǡq44-�ˡ�K�7�Y�D�_�����(�>B�vU&�ٸ�A�+��F[*�[�[�υbQP,�Xƌ�7l�h\�

`�,��fR�l�m�E�U$0j3��-�ĩ�at�*�8�+c@{�E������Q:���RVD�5ӿ�v�l-�j�g7M������H7e*[��g�p�z��z�HP��݄�n���8�sx�η�Ov��%B�����1_�'�-ʼ�mQ �,�xr�$�����v�o���}���{`�^�	�6+<>c>������\�����@<�VTO�
��S���mm��dų�������Lf��2~�|r� cd:���F`2K�
�d�+����C4�i9�O�o;�T=��) �t#�6@Ǭqa�~�2=�e����T}�p���e�6�Vv惛.�G�����b���_9zZނMv�(�)E��B轔/G�]�!2I�%���Ԅc)�����q�/8���T<ܜnb���Ýi{�j�(_cDs6F���a��5F��1����Y��h�Ip�z��B�f���jG��K�\�/X�������ŗئ�&��E�N�T���x쎝�fz�iL�z4�xcxx�
���:_E:�����.�v
��g�k���l��%�-��9��$S�ǫZu��Q�2L܍3t��^9O��^��M��D�Q����FT�Q���Ȣ���S����}۔u�5���Q��`�h	 8BoY��!a����&�,�f������=~���(!.v[������Ƹ��Ŷ�}��o���ʒW��fցE�k�?O��BP���j����V�(��̴�E�1��U�����DY�g0����P��*o���m��"��>qq��Z#�yT��㔽������5��=j{SΔ�W*�7�2��s\ ��G��n�����k$. ��-��q?���]��\Hc1��;MV)�F��拴���N�~��������x��Dj%&�ŵ+_	���}��e�z�R��-@��s3�TE����*wC���W;���g�0/�z��ںړG�u��
B~O�M�E<��|Q�(�if�ޣ��|��4.�%0FQ�(S�=��ܷ��O�[��u<���u��*���Ȼ)�Ѯ/�d�W-F�0�Ʉ]�@[��*P4���A�
t����+�5/��L�������9�UE��)Q�iq�
�V-@*Ϳ��C7Z�BHR��$��E[}��U�c�.�t�E�@�aX�%謶,qf�sUHONFy�	�2��x� QGŤ�[�eo�V]� �_�HO�����i#�'*���^��Ӗ+�At`IZ7��x��r�Zg�r�2/0�����ѽp���u�7+������������[��v�{1���}K���,o��N|� d��/_�﯅j_'�L7�8�SP�]^;tW'`
�pi��i8C���o�ø�p��#=56u
׏��.����,Vlk�U
�����ד7Q��O����Q��������uR����@�Q����.|CS\��CY���C�tݥ�����՗QQjRjCwb�+����l.tU�H�GiAs ���;���H�a��R�������f5�0��@Z���[":[Җ@�B����V� bK�Ч�כ�ỿ�mOA�Uȭ��z���e������ڨ��� �����Y�L��}}n��Q��j���W��jw��^�;A��d�ζ��:�0rn������ؓ����3}�$��%&*���&!H&J��k�9l��ޛ^�Fa������WQ���w�O:�Fd�	��kcY���4�^l��ƒ�*X� 9��t���zu����\�Y�?�j̏���jL�OW�����7�sr�o� ��n� ���� ��{_uI֪�r�������9�n�(@_bQ��oU&�_oU�5�Uٝ�M�e9j�eF+�V+3C��X�O�i�D_ty6^�X]����>5G>�u��P�o����^���+�h�]�U��C������8�$��8�i��]���UGS�,*��4��~fn�1<���^b��k��F�|oW��]�N4=ݦ>�Z{�yG<!�8�i�}���B�0������N��k()]����y��Zz4��� L�|�Lyg��p+��܃�J]����{�e������i���掳�k/Hִ�[��-Fܐ˳]W?k��Z�X�`��F��DŠ�̛��7.�q4�gɘg��E!s��zF���ck��^ �7P��`?\�;�W�׵�k�=zʌo���kn�K��������*b������?�Kmt�0��ɣ.���W�.ч�P��Bu��a��R�����H���gc�i}=��դ`��x�}a�T�!�k��K S�h
�9n7�B�HM�q��h����F��k�z������aw���).[��#�H^�d�%c�Y�Y��''Pa��j_��ēE�x�U�#Ҷ F�����F�I��J2p��	
?��v�;�,®a[3���,�}> ��d'�Y���nä>S����~��_�MQl���BKb������!?�����}-�����қ]�Cg��=n�NZ��@����'���e��Fr�, �8��E-�*�p�(��-��>w�M!���Z��~��a��a׶��ʯ��ߚ6�5;_�/��X}W��c0?��[���*���wx��ɢ�X�}-��쇥|���C�4��/�j��U���%iĪ�n�wW 7��#�X{h��	�$um�<w�%�ߗ?���u�e8�U>��!�]��%%k��h���F�ߢ3�+�-�s�����K`���ql{�c�F�4w	�سlC�ӼX�$v9{���l�������R��hK�^�k磗>qC�4S�0)�N���+O`���r
!Cl����Ү!3�dӘ�s�my%�}�?8�'@��fJ�)#��
ـ����r�����	�E�9��q��e�f���j[�e�۵��J�in�i(0�����]�2�D9�X5g�h�׹�k�xtI c�"�ps+�Ȭ�f]��/�(�g�R��'Ք̧9:!��#p-�v�R�^�2��5�X��.,���r���Դ�g����G�g�����{7/ld��+n�UV�L�]ܽ[�YGQ�b�}h�y]&��7�E]w�}~��Ëy��3Y'��d�ĩ3)����ط0$��wۇ�wǔ"�ǔhF�@`�W��an�R����� L�^
��������� ����@����h/�yK!_>��g�`�NO��M�(.���
Z��elw����JT��m6�J�Z��<*h`*UM���I��؈1_V����2]b:-�~�Ce�yK/sҟ���ɀ�=s��n.0�P/HO�,Dw߿<?��S>+�l���i�A�Ǽf�W��1���x��V�!��eE�F���� "t>�;"�0�Q���K�l9*=X�Jo+Tk����h�K�w�G�]�oѳL��r����)p��6ʂZ�=�N�Y�c�"uR2��%]

u���{k���y���dBҔ��It���B��BQLI���b�K�3s�u4w�
i�\���5�9͇R|{
u��<W-d�����cf�mW+g��X"�6R�n���wťh��Q�ʨ���._a���[t%)n��V�~t����d�<w�W�yj|P�v��oYNC�	B����2J�T�Ѐ��F��#�^����颬��8�W1�.��z\���l�D��x,����H||�
��ovQȰ�IY�e��OV�`�+����{�{yw>��c��6���������먏I�Y��T�'z�Q ;"��F������[/Ŀ+D��1�>�jhbJy�F���u%��t�J�%�L�`-S��2��P��2���O]��1���_P���N��tl,Z�a
[)��m�y
�/B��U��@nW��G#���3�.���18�O0�����ׯ�=��ѫ�G���%�?�Ǐ��O�>�tJ�P��t��z�F�
�9L����J_����u�3B�D_�eA@9:��R�E��X�)GIJl�3��QV�tIRQKG�����}S<�M�T�C�Y��
ݖ���@/�
P�6��m[<Pk%��\���4L�ڧ�'�*C?j�B?�Q��a)[}E���TÅ�c��\,g�8S��_R>����Q-J���}�ܵ�x���4F�P�@���5��%�[K�t����������.+�A�����a�VbL��J.)��i�N�C>�M>}*���,�쯣Әe�t��F�E�jϳ|<-�Y���6gt���yb�)UV�Z�FG�prmǞ:E |�.z��ox�O�k�^6��#c[R��V��0�RSD	�V
2d9���7�.�E�g���jB=)��Z�;��*�1V��+*&�+�Oߠz�%'i2GԼan�is��i�D�d�t1�ߠ:�I~�(�LkR�	pz,��������*�u�҇F��O���s��G� Dŧ�)��=��r�g���10��9
�. ��S�8�x�ǧq6�|�W1�IFw)�iј[�p���y68�*��~e��~��y���9}��i8K�d�_U2!�"��Bpή_
�-�D�hK`
Rʧ
��$��WB�SNO1���x�׿��������0�\Y�����J5��`�-�FK0�mttͺ�<�#:����nqM���<J�^Џ�����u�r��fG�A�i
�q��$�(�`�@�x����4�!8RE����)��ġ���z���m<_��d,d�7��
�f�x��4F�5KЇ�Řҟ(�
�$!�D?x�7��I�M�"����𞧃0����zKD���C�~�=h@d�Ɏ�1[w�� hYΞ�:Z&��4������r1��*��eX��?y�s���E�{'�g4�F��1y0�$�hN
�~��ܒ��Ue�td���y��H�]شA��L�H~�Ӈ�,� P{�x{�6��I!L*� G��w�m��=�fI�$�g��K�kG��$�Szh+�H�������N��$�[X�Ɏ��J�~)����K���}�x��*@��O�h>�$�\G5/[��JK�f���Ph=�M�$��$-
 Oʹ��h�O�sr`�[���΋Wv�mg�=>�F' P�ڨ�/4P[<�k����ϩ{nU����:ş�]��h�,JDO
�r O#.[����WE�-d��<*Kԙ��9~��1{���Jv��D�qt�B��69�JX�)��
-�a���]c�iI9�qT�*I;bfj%�B�ON�+�}�wW�wR��b�+����,z �EBt��X��2|���_t)��л��h	o�L|9��F�fd�ؤy˷�	�ЯҞ����?�QGX�� �o���l��]r>Y��գ�bwm�x��.�:΢y	�}�1bP�����oZ~�G����r��k�0@�i�ڎG5;�ǘI�G�tSgI�j!7/ן�����(�xE	H���j(o�؃&W�)��6�xj�58
N�d?Ɛ[e�c�4�.E쎚�=�
�	����U��	��)������)ɿcJ��L+AIY�����Õ$�^�q
��]�-e*j�Q �җ������e��b)n�!�4s��t;��ש�k���s�UW��d�XJ&�XJ��1K�,5�,����'X�A-\���g�����t�N(c
DS��qu8��u$�kL:�%����st�=�7K]��B��;�� m�႙k�*�CMJ��X	�I�!�쫷�JȺ����)��.*�*�}���9`}o�/T���y���P��*����k_,�j>ҽ���7z��¼�Y�x��uV��j��x�_�E�A�Bz����TA�*K��ꊄv0X��*� K\yF�*��
�ZԠʴp��� ���?   ���]sɖ�~EN��A��џ@C�K��d��%83��1�,t�K���j �x[��v�:�
mHZ�
;�/V8B���'�?�?��	>�dfUfVf} 
~�E��!�*++��ɓ���^�aQGş��
��1����	m�{Z����"?GAM�|f�	���t4�
�K� ԩ�5���i�\�B=AF��Y5���/�r�U%�R�Yx�ŷ^{J�ރ�섘�e�b�v�0K�U����*�c.���9f��d�C�)A#�X�Pw� ��' ؞�TC����i0�2�'*��@��^�˪G[fT��c�K}��-��nuz��g?�%������m�A�%��jn��ȈɌR�PS�c4�;Ln���:g�~�6��-����e��twTU+�V�TM���$�^h@RP�b����I�Dԛ���x��X�N(MT7��Šj���#i�W��x�a0�R��Yy�[ԎtHF�� خ��jSECn��o��6r-�rW��(�
{��Ĵbp�	���!�n����do+��̳Ĝ��LI3OR�g�S�e2Ӣ`f��MOڴ����e�G@Ң O$J\R�h�0'TVp3�ORF����:��ҕ���(��W�sN���ӕ���y�0�P��"��E�
���W"�U!g��t��M�dո/�oa�)!y�c�����"2��:��Q��(�Y�bƂ�s��RN�X pj��l�{>�8čL��0���2���z+����/�m6�*���f}�<�+@s.��+s`O,����m�u~
��E���1��S�C��I��a��aN�U�qݥ���7
��վ�4wU�o�1O��HM���*��s���Y��E�����cM�Y潅� ���v�k�:�_}�́�ly�`<����[u"����
, +�%��w���������������D}>`~s���Y��a Z(�4�>���$N5���~h��H=��R�L���Y�5�f�ؒ��->�4��l��2|���>K���n��L9��^Yj��z�!Zד����ٌ��B��͎���.NS�bV)2xG�MKu�1�S�W!��h�l��
#tX�2Z硨�����R��$�����]��e�__Y����O����@�F��T����x<�S�
�[ �(i�����u���^�J`�	��twDI�����~R����_=�>�d�P���t�l����C�ÈY6b����+���kdt& :����]	�F^�lፑ���b�	��"�c"<aeB�=���|h�缽a��rǇ_q�x�[t�	<D�Z�w�'S���%%̀�N�����N���P��ƶ����J�͎�ֺ9�%�cmt�aPmn�Y�6q�9��;4�-�[����a\z�h���P6N�C��<X�Y ����V�^�q�!m-gJeJ�U��7��&R��kԪ�$8|ܓH�Wy���r�IH�qOCE��Q_ΟJ%��)�<KT�ڳF*�K=
�h� ���9���T#ł!e�L2N$�C~Ъ��|d~
���F>\���j�m�D;Zψ�Pi��d�����W�q���С��^�H�x/��Y
�.�]��ܫ��|���Z���MĿ!ek�*�t~����`x�W��
y�Ȩ�J��_j�
(a8Od������^�n�C��{�k�N����t���5�·0!�N�(o�f����	��.�Wl�W{��N'4zl�h�~�O�F�1`�w���b�n�����0n���7:Za4��G�6��e�s�o���o���2�0k��m�m�v�V�����a;�����g��`����<�A��vsm�n���{�6̕����i7��Vw�A�B�>>��p��d���/���޻v��.�h�u���9�G첑��j}��9ٮ��<�NBR������]��"0�5V���G�<��\�
G\Ʊ< 1��f�H��S���a_{��J�?��·"�У�I~����B~�}�Y�z�](�F�n��h< �0Iu�Ukk����ڿBc� ��@iel��y^=�Ǘ��~
3�?d��k��
��Z�a�5>x��^�≐�J+g��{Qr��,�u�,�5H�==;i�e�.��A�"̀�&���ޮĎ�:v0jPB�22J�����%�b���~>c�t�\�Iy��P!v�傛�^��]LQ��ծ�o,��K �>I����ɘ������j��ױ���J+2��]�6Te6	a�t�*�IۤIJ�.͑Sڈ�~�YBj��#v4
���ShΫ��dϤ���>/o��?�g@�'��^�D/� �&�ʀ��z2��7/*e��m�2j�Vq8��O�*7��;F[�l�)+�0� �nJf�r�浳�8��=�9g�[��y|`��Lz�he�a�8ˡ�Q�_̖��T"��!���`������3��Lz�繲���� {t<6k�0JCe�֕c�/߈�@?4�
3Q��R�ϛ����.�iU#����4�tU��r���,Ċ_'�� -���VO=_7F
�d�_K�v�k3��K�I��@��ɯ���s+ou�`\Ɲ�06�h�!���@MB�?��Hhh����K&Q�*��7m�hUHV��E� X�a95�?0,�58��c� AhkzU�E�l�?t���׍
�F�~b48=��01�������1Y�����xJ��h���䘀~'�Q���pk�x�!ϗ�#�l�[�v��VK�Zz��� �*EI?�������PX/�).�P�~�Y���������5�	1�X>�m��[;k��]�E��
�uK�zG�n*|e��V��b�+'��f�hvJ@Z���+������X�zۃ�v��Z��. v�[�.��hWԢ.�s��okC�A�+ �hک�ӽa{�c���a��G9p���*�YV�S����Z����]�F�h���԰��nw�W���9p�Do�*��%��r��0C���~J@y���?E@;�L�L�2��eׅ	��i�55�D�[tY�����s�O����K`��5��z�����`T��� ~��"�Wb9ҏl�r�IfzL�Q�^to�%��a{�m�}����}�Ұ���w��������*�<5+GmD��`�6��ȱ̍����Mz��r�xk�ˁ�HY�!0�c$�}������b����@�~%�I+m(e@4���~�ku-Kp���mo������
pzjEz�k�L��$�����������e�v{�ܽ���q��ި��ǵ����Snuo�5^z9U�Us��ۄM�6oW$e]7��P�0��e%�ҵ-F;�ۭ�m�9k��o/H5���*ɧ��2�)�,8 ���3�]���n+`xwk�k�0|p<:�;oE>�
`^���gz���U��S�rl5��[|TAp˞����o�#��mw��pZI�\��X�.�UBq�R94����0�M�a�exL�r�����	�]�_�"h����ܫ"J���d�m��3s~.j_nYx[�[�uIj��1�c.\Ѵ]E�m�����u�ԷB�I��g�1�zrf̄<�.N���r?�Hj�����I�=���� o��U2���!E8��_����,=�E
������h|��;�����//�׮�7XahsM�_^���Z�v���
��}
 �k�Ư�d#Q�V�*�P��\:�d��0���=wȘ'-�k�jr��ۉ.�ے����O1�y�҂w�Kn�Q/ L�"��Lcb�F�l3Q��j��R"��bkj/6�^��t�>�ŷ�~Gu��{�l�^O�M'�����_5R���y^�������pg�K��+_0<|c��z��L�˻���l��yl�-��$�Hn��ӑ�>�k<����ƒ�w���n���;<���%D�E��p����'m��g;���3U���φ�E0j��\Ϩ�ПNk���^/�K^�]7�g��z/X�����C�|J��U]�`���tJ��+��}I��7W����E��l�3���0)�򌘥�ɕ۸'<@2�?�N�|gߗC]��{
H���YÚ˱��"�������B���$O��Νx�����|�Hސ>7O��Fޠ�jX�ޓ��[����P)�O�u�3�iz.�C�((u�93�F�Q�Л�"^Xs��Z��MGO5y���U��%:4)�xF�.3xNH�f%����h�h��9s#��Щ��38����CG�$>�Q�ar2�C���ī��Q��K )N�VMY-����
0{T`�f��gF���3S2��R�<|�-��8��.h��W����6j.��~����&_}��$
~â���v��Y�yJ���|y�r�d��ͳ-{�@��]���wZ��Z!F���)VSIJ�:�l�_��%�ۭ~�檖��ɸ�)yg��c%�L�BMA#|ٲ`#�$�=�<��Ra{�twEZ�	�'� |�,[�{��X��LF[niŲ%�p�,�^��B��9h�ZB��h)e;�r�e��H��f*I��Y�׫��L<�L�'���y��%܆�Z@MnJ���������ml�P˭Vu�(���{S�d��:Ҁ����F�� ��܅��`A�7��ư+6y���k|�n���J%4�/z����@ܨe�+��f���g�--.�A��pZ%n��[�vǟ���
���*���y���\�_�敬����.��!zjf���e�@sHL<�fr/̠�l�mN�뒰_����{�7�YW@�@�#�B5f���,�D�% 
<ƈ� ��g0oL�{���Ϸ�/ܛ�2��lrN�֨{����5��l�
�Z������j��]ަ�i&i�cj'uv���^12�O�%b0�M��P��p�*����2��4��L"�
ʋ+QP)�;���~`���21O64��:��zJ|�5�h����'�l���l�r��@�����NEP*b�?�b,3���Chc���t� ��#��#W�|��`�Ps�k���G'+���G%I.�/�?�l,X�P 1 =!��ݻ��Q��r�ؐ`Al{?�*`�*1	���g/	��驿�2�B�w�����{����+s�m������N�9�� �_U�L�R=>����(T��#�W�1�
E[
0�}��98d�5�i���F
C��q��y&����'��R�16]���Q �^4���"
�������aW���7��˶}io
<_���>�%�3voIj�`�KU���0�Av������	��){����o�����m��n�U�@A��%
L�Hyi�Bm�
�J���C�d����Ŵ
U5��&W��`��V^ҧ�]�:G���]���=M�b MBM�˕�"��s�ݝV(��9q�H�0��� 2��)��ݒ��(��б�&����A�}���!�1�4f�Ʀr]6��=��5)KV5(8��V]b�N�υ������"�,֐m�ntG��gk��p�����Y�uL�~?�Cͦ�kT3Ig�urNd@.Y�\@1�M�ՙ�&U�&�u��u�b��'2c�U]�~��(�*�/��<���)��*3 �������\���N�@�?��Tۂ��=��`�����e0�%y*¨��̡7���r�S3olo8��R׺u�$�-#�~�%�=�]Γm�����{��Mױ��I�ށ��E�]K&w��cX�L1'���'�OÄvZ������>=�?x��=��rt���Q��<��2]/|��\RǓ���R�d�U3on���ۛ��G� <V2:ƚ`�T54�Uj��DwR-���%��I�YMz0�n��5���wX
�~֗�M��ɺ��ٝ��ӣch�x�t�@��؜s���ӝ�s�������r���N�SB��E�[��{�.dɪ�*U~���j��Թ��D�0
a�{ԛby��1�Qi~��&-�/ܹ�ݪ;ޝ��-xڭ���΅�΅�΅�΅��B'>�Dw�Dg��#$��\V�BgH�O��v�
�H|z��"
���6�b��
�� �$I��$u�{<S���Z�����m�贃Ū��$��☫������N8�F�/�f0b�A��'*�%	������V��Sm|n��;����
O@QJ����H^�J�t�;�g��'pU?�t=`��w��,�ޝ'�'����y�%C����=�����������SߝS_�Sߝ+ߝ+ߝ+��T�s�s����|w^|�Y�;/>
����\�z��CZ7���Ҿ��>��ѯd.9����cu�(�!�O��nOI��J:���^]M-H������lN��x9��z�4�����^����4構i�=�Șy�TP�L�ʭ�~Mv�%#��L�'߃�@M'>��ړs���3����K�NB6��f-��˥,5�p�����j'���ޤ�H0\m���q��R��ևo�T��m
���»��<����px�\^�#g�]��jL�n��=5��I7@pl��E;��<Ċ��Yf�B��ݫ��`��'���û��3���_�������~w��M����_ݓ� �|�J�ݧ�S�s��K�(��;���{�>g��ch(�ޫ�.O���>�-� _	<�r��w77����q�a�昜m���:g���?V�>���?�n� ��N���h�O������� ?��l�fB\ۋϼ2�S4�^L}8��%�{�0
K���G�&�q?��p���@b���'��%��<	ư3�"�rB]�d�QQ�&�&uu����y��n��)��ǣ���r7���Owz^�x�y��O�z۽�q��*���O�[}�H��T=��пR���� �e��;F'K9�T��r�>���M3�q0�e-yCT�U�(q�0h�&L[
�@#���D����?�7�Y�ᙟ�)�J^�8����earh΃�:�@�A Y�T���=�Q"�N�]����
��d���HC�<�\Y��/X8M���(�tk���l�o@�������O�"���Rf�.¼W<M�M�&|�
:xO0�"Qx��fBz���F"�]Fw�f���͗�g�� �nA�`��lS����-�E#��X�p���͝�l�n�@��s����h�� �uf3]Y�d�<�٧vY&�O��i�g���)q��/��d$�ػ�C�=#=K�9�~s�� ѫ�e��4R��9詰ѱȕ߆
S�An�m���k��]J��.�/KO��
3ٖx�7��/y�%�:�e޻к;ʵJ���-����8�ϑ6e5����R�(N��p������-�,�ֽ�x������f��)�����w��f� �~v��-�5� -9;壬�a�Mtu~IAVW�e�fH��z�9��N��a:N1�
trQ#q���.�L�>�N�O
P�4�}L<�Ԓ�=p��j��%�\m��C!T������ڹN��wRw��*!�-���o��
�;��Eݤ��ȼ�m�ޒ�X�K:ڼG�w�����[���L�=�ea]�����q��'��K�ZE2ۦ����W K��A�������Ku0�B��h�J�������X*��󰡏G�hl��(r2�}��������B9����Ϫ��ͽbp����b<�t��Uv~�J!� ���f(g(�Q�q�=P�֤�I�fhZ7gY�zO�켷ɵ��p���FC����&
�1{�?�hP���W�Ƒ��1(��˗zq��B�����v�o�T��5�(�6͢��ړޡ3��÷���#C��Sh�؊�t��6)��/b�K�4+�Ql�����Ϧ���w77��Κg�f�7;�VkZ��& ���V
��}\�~����Qx�Wk������С<
��{��i��`�fʽ��0���5�=P|�Fí���)��}��{�N���jϻ�!&���m��Oڳ�_��6�M��˺0�V����8H~5��w[�O�}�>��k�$�+.��nҖ��V�s$�oB���E+����!2� ��J��{�Ȣ��F�z��<k�^�n�H�f�Ӌf�����t3���h]q)Q&��Y_S�1���:�؟4�dS��9�k���ms�#��x�07�W�~�CL°ebk�᎛WFq)7�P��{������u�p>�¾ޫ	�p�~}]	��&�ݮ�[ے �P�-�d�0 �5@�PP�7����I��8�gA'3�3�=�C!�{�����$��آ������b���{V���ᜬ�{��tN���i���	 �B8K�
��ߤ�n�wO��il��8�w���[��[��L�7��+A�{M�{�t�) �36y#,���n�C�.���
�C?z	�+aǡw��N�f!�ЄJd� c�L*��c"����>�σ��U��1@_}I����?���:�.��R���V���'#$�f��_�[�2� �I�G��~D���NT}����a
���`C�20j-���?� � x����m�ț�}آ����_H��͟�9.�.{���?���]+�����$X:� ��!����v,Xz�
z����6���^��7�����o#�x�g;m����Ӭc�|���X�9X[�&�}k�R�+e}�m�oJ�B2_��T+�9��Mz��5��N�'~�z% �ʣ�EB�}Mz���M�ݧ�����)wP.����*��*-f
T1l�xs<k�1;�͝_�ny�Wy�V��_E�5^�ե�J9��yk�5�k�t���Uh�,c]�s)acL{-;�2�w~����-Q�Y�d(�J�j�RŦ��QhY�+h��ʔ0W��z��7
�J��į���m����]S8�RVz�}s����,�?�
,��*2���l%�
-�i�%�]�-�_�m�F�2]�hẻ�w�u�_n/�J!jŽ�I!ku/��.�>�nk�]���_wX�`m�y�_E.�*rd��W~�R��Η��dY?1�����"�~����WUA�����xl�+�o�_���������}{U���Wy�
ǎ��?��̿�hɲx®�)��B���o2�.	v��E��$Ǝsp�༓@q���'�g�r�r���?�N��h����i9���fN1�]>� �'Q8�_2Ѹ�3�`Z����#���zs�-��?� �2�i���Ɏ��ɏ(��s}'�C��t^�����Z�������T�"�N�!�������vϚ7=�����(��'�*�L�3em<a	?��I�׳�ޗ�ɫ8OIsHE(T�Yv��y�T����ix�a���c��_��Ϧ�Ì����
x�wŞR��%�e�c��(<�O�2ǫs�"ou�d�0���8�O/�����*Ae��@1�����Yr�P�\��(�@B=�"O06��?�b��4x]%/�V2�R���2���`2����O�)� �	r��R1r�里�N��1��&�T̝�a�Zi5��3�+5b�TN�ܳ�)�BA�¥3��JF��L��A�����ϵ�y�yGM#l��s�V@,��.Z"_
��������p6ڕ���4�&�v$���)��������I��N�����7��Qe�8Q�R6�_/c5���IR#�L����Q�}Y��g���f\��ăV�5	a��"�q65����u�̂�V�ȷ-�-ݤ�I�2#<e�"�J��g:Gqs�HR���#�	�{��Nf �d?�4W�~w)8��	ͪ�����a�}�.Q��-���0G�[%af��d�\,S�F)�3� 
'��K81�j���8�����T�@!.�/TR������zm�NP)�$4�p�ʫ�"����)�*�p&q��c���c��a�R�.P��8ފ�����d-0	0��s#Cd�%4�Ϟ���Y3���6�-����*Աm�D,:1�'��}a)�X��1Yg�L��i��x�b.8
vTu&����%w�����0�d�wo��mm�z��Bmߛ���4,k��}�r=�C)G{�%��r����h1
���6"�)E5��ߦ��:"�IrF?��0��3�Gq�?���kg������eB�cI�q�36RH���23�0
�N�g\�ܧ�+��,�&.�����nfJ�Yp��ZoҮl7iF�LbWV�I7�R
������.eJE�U�6���^�O���:u܎�㨺r��;o�  ^zђ�zJ3M���L��D�G�j%�I�
eDH!'� ��|��Dčӳ ����}=� gǘ,���]��0w(��߃�j�ɘ�J ���y���k�� �^�=L�:��x1�'T=c9	b���FdZ�bF�v5�s̆p��UKs~!]$���Fپ"���|_Q8c�p�+�]{��� m�r(�#�陚h82�[o���ˎ��+�)a#n�a��S�eq�Nk��~��	x����:r��6�#��g�6?]'`vK��Ŷ�o�k�������~Kˢ�������KEL���Ic;Zɱ9��ݙ�ia�i�U�`�_y�'�x��^wR���c�Ӕ����ni���a�f�	q�x��l6s�&����K�T�6*�y�e�3�L��MG	b����O>��[F���C�g�|HU��\�5���]�:�IWF|���iH�waM���&qj�I(��+��n�ć`���h����$мA߲�g1}�%܏��X �ޗ�����7�=��&}�yx�]X�;�:δxq>�U�
�aY�EJx-�%é�+�J�`K�Vx�@���QF
atf_�����������%������Z��L/��
��|uj8�y�^d7����w���~�h��[�Y�Pi䍿_��"��o��}����	dHV�O�tw"W���O�{��_�oIQJϪ�H��\����`/�`����F�,I����G������O��KV�珫�lv���{2?�7~�.Ɣ����?�g���-d��á��)���/�s/�,����A��ħ�����;��[��*�8F����a/|���	 [|Pe0�0�j��h���̨`�á7�gp�����4��4��@�-�;z{���*�xoA^�����O�(�.�8��~D+��p'���L����!1c�{��>�'Mr:���h{����\P*�����x4��c���j&^Dq�OLE�\��#�L��,���ũ�0�J��`��RF�-˽,������Q攼�6�n
�5�ǒ����[?�x�'c�ugϲ�����?cOᕗt���ꚉWD��?ǈ[/���I�;����]қb9Э�.z�y:]"[�2�|�B��y��b�� μ �u�P�?E!��?��v�):wߨ�XO?���U!���co����_'�;6ވي0L����ZC�b܂��"L[����:����~'f\���V�C׎�֪\����\�l4F���c�v�U�,UГ_R�UU�y})���?��#CDz3�&O5.!]s	���}J�.d��ޒ§~�"/�k�n���5��T{p��$	������q0f�%8�f�C�C��u��9=��"[�U^�Ĉ��[���k��LZy
��Z���D�q�i�_�Jm�^�/NQ�j�r�V!�_Y�� �$�����=�W&��eF��9C��0�r�&ҠQ� �+��=ō��_t�w�Ӎ�/����2N��
ӧ��m����l�0��U�g�\���t-\�}�1��O����R�55-�ݪ�ԯn���gI�wʖ�([,��$��G �J����k�W�C^�쑈T�
[Ie�|?��Jx�~��>���,��+w���4���FO=�r���J��8���[qG��S��Eٮ�Wr���(Yn����pM�b����).VJ]�yX���$D ����TSP��VN�+�G��&�IT&��`]��0�V�U�2ɚ�O<Kb�����H�͝�&��Z ��Z�)#��p�6S>�����F��Ϟ�E@����] �⮤k��7��n�]����wɧCy�;���{{�;^y��cQ����=÷ʻ��<<�~��z��)~�i�C����ɋ�oΚ���(^y�s�*G+��J	����q$yL^*Q$�<'��7�r/����mYS�W�ҭ�;SH�4���\H��
����n�t��Z^߻I�)�7}�JẇΚ��+	��Hx��ȿ����/�8HXo+Op�I��3���3p"���Q��y�w�yX��v��:�؎m�>+�+a3(����,����]�5/�n��XQy8�cH���i�!r��Z�<SFy'S9��o�ŕ��~Ks��0���]Š���O���/��w��Zg�����	
���"����HHV����:=k����:�QmC���X�`.�G3q���ù��oڝ�:��g��m�a:��`�av���9o@/8� ��QS�����M�ӡ��w:�;-�΀f!^*�.�>CA����z�L�}����IO|"�bJ}��3��!j8�Z-T->�~�`H����@�g(�p����~ �������I�Y��?�o��/Nя���o'�o���[Z�15wv�y���g+��߶�;3�*üUa�2\���aB���Y�%�0%n�|R��#"�/)���z�h���%��c�,��F>c�\����Q��|(c�a@l(@
wʑ nOr�(Ý��T�b$��`Tá%>F1rw_�S�gG�
E�+ߚ`7�介[g���
�v0S����Ѧ�Q��L��<��ZfPL�-:��4�*G�8_ϳ)�s�vC�H�u�#F�*[���j�&�Q��wx��~̼�� t��:�ͅ}6i(��l&�NfwI"U�\��9 �R�}c�i�to�Ƶ��[��{������u�J,�׿���z�VV��"?3�5`m@[��qg�m�Sa&P蕵YY��f)P����@	g����C�Ÿ�A�Ab
uM���O!1��C�۾;�����XL8� T�YM8�:�������:�:./�$D�v�"�?��Y�R>���l����<�̹��IUl�Q]��ٓ�x2ۥ�� 	R���6�����]�m�*��<�x�B(�H�IÚ�������v�ۍ���nFm�ngKj��O|c��{�?<�Β�G��n'��-�C�}QSm1ڝ��\Ϙj�/*�.�J����V[�<I� �z�V��I;=��?��_�u�_
;)� @{��Nm��}�Z2p9����"����p<��U,��kY`�퇱ź#�Wl���?���#�={��=�a8r���,���Ӥv_Tل�9�q
��\ĔU�9J!�ߊ�%ϸ)��@t�kND�/�w!�E'�⚵���}
M���T�� �}�n �=�	?�ui�W�1/%##z �^�-�����d�	M��ѣq�wZ8HG'r�^��Q���\��jJj�۟>Ixxr��~�������,<�b6��	H��΢�i�Rb�>3� X��,��.��qu�w�A>Y9exr.��P�`9�ȟC�iWA ���<k��cN�^g�AxΩ��d~Xr�%./B�C�_����>��Ӏ���#���l�i�7�%(xO1Kă��l�/�����HOy���<L��'�-$q����yXO����F�T�ʗ��cb��j��w5Ĝ,c>�`?I�Ƒ3�v�%@�jj�:�e�/�ҳ[_�-+�?z�}����k�*D*�� ���P#ʦ�h��䑚i��0�����sy��*r�^�����������g��D~��C�Ջ�����&���٭-0���Z����u�ɏd�%߬��`˹�x�C��ŉ=i�V�N�ʇ�\�����������H���Zk緿e��-�O)��u�p�T�"M~V�x����X�@��f�yu\�L�����;x-���Ld�9]�`�<�����{#�o~)`��f,��ٰc0�j��L_�]P�+W�~�(�
�Sݏ�"��e	�~�Q����@��J�Q���(k;/G��+�Oc���ya	8u�M�7�_,�z�Q����!e��h���^�3�?����dŜ�`��C
s��6���c?�svT9�h�=�@��Jٴ���Hέ�	CM�� �����r����5��v��#`���a[(�f7�Mn#�M+(��;�s�uT-�9�}kf�<���Hږl7`�Ĥ�N����?�<���4{4��3:�A�WK���ڷ'�|�~����qP~s�d/���1�a
O�r��I0
�6SO&�\���8?���c@��G�mnu>��|�ԩ��:bun��c�%�N�=�dt�O����w�b�B�j��H�A�|]�r���v)�+����
q����/]oSU�j��m2�U_�����`9�V��Mi��i,�C,�N��+��/''�m		p'Fp��o~R��N#߄�:��H�U|��ē��׸TgO��/-��։�l�:�*[J�*Q�}t�b�a�j����?��L}X!LW�"f5;��d�vs�t�s�Opp*�?Ntƍp��?ẹ������%a]�>͟2������K�/
�>v�LE5�3��an��豑2�QiկI/�KC�JT���;BI�	��z}��	��f�aȱ�}r���n��Q�X���
�4��|��(�L����%=V'��q䍟���Z�S
pj6@Cߢ$�a,� ����*$�E�S���Tf�w��{ގ�����t�����dxc�~�&
���dO#ߧ�T��e�W���X�**_k�A�~��Ƹ�.W<�]�5�Iڌ0
ޣSǔ�����u�O}<�q{-�27�I����9jD[W����4yew
��%���E1���3�����&��_��r��x��o�$<��Z��j�Rݿ����D脪
:IMQ/rqj6��֕�Q^v�%;'�
v�K)/,p� 8��:��V��R9���k~����УO���(ʅ���VHP.��J	��A��AH8�%R�s�e�J�>��$2#}��A>����Qޔ���U	O�)^�Ib���Xv�Hg^�q��wE�bn��l���=�>#�n6(�CV��k��0OvQj3c�%an�H6�|�ɕ�X���K���V����ޣ�-Ht�Y/�+�Y	��5H|;T�"6h�|�P���3?Ng;�?(!��ƕ��8<���X�sUG�#�uS�IT�
��l^e�����*��hw�i��ǣIxƔJPE�n��N呾�h�Kq���*�/} D��s�>P6wK�z�ҭ�����#�iTe��g�Hr㷦X!L߬��4Mr�xos���U�BV	���^y,��!r��\�	/1��,q�O��'�:ᕿly�1^�<2��8���Vo��<�V�ό�/`���3^e�H�Ջm'�LM(�i�X���bƳH:�2udNX�D׊�6^[g�W�%_�����~�c!�}<�n�C/���Y�*��+�K@��x�;��[KE���|�Wf��٤|��^2N&�������ߩ�=W�9?L��'��X��.��>�ݐ��*�
wC��+��}滣P��w�܊�|��E����{�#+R��椱��4k��Y"��.�גQ�m���"����?c�A���S
�����
A��KHT{�g�ˋ#�x8�ȁ��
5"'a4����HMP<嬞R���%'�W�����W�t��Z#��p�=���k�BU���J��$�9��<Ϻ"I�Ѕ{�x��{�hY�c����]����bQ�MWk�.���ce�M�ҨFދZ^���#���
�/Ӆ�\+�Bb��J
Q
r]w���Yf�����y/i��i�4e��T�/�\o�<O�ė���=RZ�*����o�MD�O��'R�<�a#��a��p����삫��~j��M���_D�
-��n/
W���YbU1ɬ�>��0]V0F�
,�x�-O#�s�Y��撰&ֺ��Zy����O�Q��A�W�$W׈�02s���ۭ���q�ܼ�7�a̇���y:�C����y990#�9/GS!W��8�*��䭲95�rP�v��8�b�Ey��"p�TY
��N� �M��܋��O��ۀC��J���D�!���c�T��P��".�u���r�̼��������*�O�o�	O�w��������Ɯ���D>ՈL{l���K�Q���/5�9%ß��u�Ƶ��m��̽�#X߭t ����C�L�%P�q�.�k΀�c�BYX�\����
�����Vs��͗#U�F��{�^�%@��<�{K�����r��2�S��dH|���YG4�E��u.�)$�~B%�Mh���g��㔤)o(+gߌ�훸#���W�=a��^����N�����B0�8��R6������C`Z1
�1�{$g�m��`�W
��[=����<l�[5�*_�n_?��܌s@貶7
�0��Tn��@OQ��H3G�:~��9^�3�Dz"�Ax}��<[_���l�G���jߛ��|�>�ĺ��y�dƇQ�L���s�?s!��b�#o1� B�E�W>�y@��$���4eq`��k�'ٺ@��tg4��Qi�8x�W�{�K�L�!m/\�[7���I�lK����ډ���<<ၪ�V����Y8��w��:�\���Ëcv�rmZP����,�^\;��J1� ��7 �s�dGˋi����#��C͗}�%���x�?M��.%'I"�$��r'Mr�zi��$]Y$�;�:�F�X�a�FX����F������HAR��=�X0��y"t��C���W�:z���p���6�ـ�����Cƿ[7���������~�/��'/���ųkt�E�����G|H'��x������ŉD�q/�o��9�'�, 8²<��c�X]�v�/��������T,���v���V���DCG>�N�>z�*�G���
��?}�c$�{O0z���RӬN���� 7��sҧ��Nͮ�"ρ�@���\�?��,��_F�m���5�����$0� F/�г:ot�ޏ�d�FXU�m�|��5��g^E���p�/��#�+ߝ�
�߮����G?ys���g �3`)<DaVMoc��R��Z�E�HCJ��F�)@� J����Nk�;�gQ�~
�{��5����G��1���
V~N���!��[_c?Π�%�z'g~05��w���4�xN�����C1C����uk��;�6+��;�#���)�h>B��4��n�!��V���5w(�v�w4%��"�[9ʭ�;�����*
��MN������g�'��·�\�rOz���fxKkCf��c��e��e�48�G���z_�>q���>�Hpm���N�8p�z�zg����<��Y��������9��Bj�(���.~>���V�<���	����9�_72�?1�];M���ܝ�����Lc���̩.Um����ܝ���	���IU:Πβ�f�p�U�U�������1�di��_�*��}cy����_�9jL	��jT��ރq�nߝ����ORs��(mo�l��,moݝ���	��۹gi{�g�I5o�05��9M�l��=~�"���9'|�'��UW�WW]=r��[��|�K��|α���y�
�?��F�Nz|=����x��Ӫ)?��v_�8����7+,y��y�\rK�.[��������GO�6�v���+w���/��ܼ5��Tc�q�%}P���)|�^�Q��>���>�T];��J��0���_���� �>��O&%Hߞ�^W������)��F����TZ�U/~K�J���&_Iy��"MUj2ݠF˰I���+�W����NU��ȿFy�LR��1����S��Xn�_�-�z���w�.+�۠���em��E:���OK�!��M��ȧI�Z�KԚ��-����Xr ������K�R�|�r�^v������D��$�j����9��3h��3h��1|�C(���ζ�&�nqh�f��3�?�_44��f�4+)
A;���ٓAuΣeX(�z�&j��
Q�C"�X�K�Jd�����������o��f�d�î�[�L �O�%���,&r�Es��?���J$�P��e(3Q8�:�(��m
�$J��0���U9�mJ�qTM0v�@'#ާv_dy�a��E\�llaa�K�A��~�2/��c6D6G�e��"�Vݘ2UR�ܬH���C:�I�U���2u1���~���KZ�,I��
Y���� C}*w�~O��M`�^pl��3��q�(E���k}�w-5�����<��)�.�*h�Fh��(G %7��l���!nfj���4iX��E�PJ��D�y���M���ɒH�+\2OA�N϶�T�
쫭L�K/Z�'.�w0?	e|mO���'Q0�h�ю�)g|-�P���4x��B���/��"������p¿ ��?{Ɇ ���9�1:��K��#8J"����I��Nd9@��!��)�|��Fc5�����`�ck�\�,�x-�Y4qR�"
�P�	�a�y�{�-p�ڈB� �00��֣���?!;Y
_©*�)5>(�(��D�b��F&��ź<O��Hm0�wH����k;��@�V��R�F�h��3�$��[F���σ�2<���l?������8\74�6���6��F��w[W����>������E�	�v������_q2>>.sD�1I�5����|��2Fn�VU,l����'C�V�Wbv�)0���4v�b%%� 8�<���[�B̯�lN��x9�����]ϠU6���ևK���U"?�3�MΖ��愊��t*�P@�ފ�p��ds��b��6�Ҏ[4��b�G�I�hB\�eX�&0+\��������.D�s$��pV��s�uPX��,����O�&��0�"\�� 6����P��Q��D�2�]S�P7��
"V����~*����۩�_�v����m��3�8�y6���F>�
Om��)�x�1� y�iS�e$x���||A7͍�e:V^�鑓��SK�m�|��f��^��6�^��̆{�t��e��0#�1�����LR�d8��'�̬R^��(�N�`�8M�V�#=�R�0R�*4a�.�)�7����puXj���/�Y#�Q{6�@���\
9/�؃�2�Tp_ �g�\��"���C>}���N0@<�CkV�خu���R�8Ǌ�V�������(nN��7W^I�64�����hN�ğ�e��뤔Zs+�@��K>�|8�i�e_�/ٻ�|�繩�*P���LK ]�+��4�7�r�G�0��yV%b�HF� ���u�I`�ӆ��T1f�2�oQ�]�r[2]�KNz�U�L�"�l��G�/(�
"����`8rj����jO+C;+ᙞ���,���W#�¿�;�wrL'��훫\�2.���Hn�LD�
��o����r�wI
�<;x~mA����a(�"��W�T�BC�y��N�C�6�0ԥ4��֌�)h��5 ��K���~�ɬ|����I��o��Ƶd�R���6���!l��3_�>i!�V�T|�1�������%{�9l�����u�9M;����h�1��!�5
��M�
yQO�����f�k��_�,'����2uD����Y՞7��\�x�Nq�#F�\
K4��=|uUY�蓺`�f��0�6����4��p*e�zע=��:|g���Il�4f���ꔍ.=#^�&{|'&6,�TV>�^���@(W*[:�h�0���5N�>����4X<���$�g��?ʘ<�M-)j��3	i�$+��]
CQUb�s��;p���8�j/�%�[���v'lL3/ckp^�&�A��']ĕ�(� B�ĉ��jdK���/�C��Ue0?H�����j�*wv����[+�Y��0X z�sq��/̡�n������YCY��K�'-te�K�b� 0ܝ��	#����RLrŁ9�V�t�9{�^��"O����F�����d���GG�����Ij�vU�7�m���T��؆�+A�`^/������(p��i7B��~
nm�K��5]oS�R�㰬�R3b#�V�0�ӾgSZ�e��m���9��#X�Q����3Te�����6;0̳�`��LU�b��1gfU����`M@6�_5��YӺ`H��//��7q�ѭ+��O,!:b�A5�r/�,�a����ǔ��]�(1�*d��5z@B���e�`oz��Or�S���t���'g*4���\��1\���Ҙ�_,�S����ǘ]_�E�`j�}˥���T}�ۯ�6X0�L��P��/���o!J��5O�uL1nIй]f�{��m�6�mJ�'ː�
v��Ԥ���	A%(�K���z7�����)�SP}�Oꝋ�Y�Й�ھ�f
R�A�-�c-H�J��{��F�5��7����]ۓ�H��eD3
�����
�yf��Q8�H������f^���1 ��_Y��r˿��K���\��)������R6�Pk��A�Y#�kb-��ְ�1�?�@����i��y��b�x���lyĤ��.���'9Ѓa8�T��+��t
�ϵ� -��0�� �4���d�>��4ͧ��uľ1��O��X�3 
2�i�B��Sʨ�K���a̐�;�]����bS��w�{�_!���|��9W�s�B�=�o� ���I�VB�k嗄��5
��Ɨu!Jy���G!���lH-ݟ�z��%M��W��7�%}G��3>���(8�����خp�'PI*��|E���-Z�"&���Z�;��v��n�p�t��B�y0'��!��5�DG��OdB�|
.�:�Fվ'�   ���}�VI��{}EZSSH�����2f� l���A��԰X�DJP�%�:S2P,~b^�q�|���|���q���L	����.#e�=v�����0���"��1:~�����|�A�� �_Z_/��	���ד�47��9��a��t�[z�Zk��Ύ%sD�n����YNr�A��W�)�Q����- =����5��Z?�Hc��Ʀ�
�6�ő�M�g�CR�Ce���͉�*۵�Џ;�r�V�� -��d� 4��T��p�J钣 F����+���b�k�1��d��Y4ˬ
j>h�
^��ຮS?��מk^S-e��B���������VJ��-Q#�I���'P�uJС�����:%�VQ�F	�v���
&p���C(���37,2W�+05P��������[� 7���)�B�CM�w�~ ^�!�,%�,q���>�ܿ��[��o(��Q���� �V��
)�ˍ�n��PTvR�jj�6�e���H�¸����&�O�������G�O~(R��C����k��-}�@��_h��K��#�h(6�BPC/S�f�WE5o�T��P\R��/�l��?�)N�C;)�T�s}�I��hc�p����*�K�[("�p�>!h�%�f��[���(ʠ��0G
�HӢ�����k��OY���z�J�����#nɸ��Z*D��X�ŧĸ����N�Y�
KaWJ���pm�ra8Y������ᅲ���*�dϭO���a��@I�3/�FIW@��r�Y���
fj���% i��}p���a��(�f���H�2
�������Ί:2���N#�"S���ɉ��Ȝ�<�*Ւ�K@���2������M/W'�"Jȟ �����JQ*ԛ2c�)|���4[rYd9�	��){*�a&	��BN��5�0�L��("�@e�m0,<2aH"�c��P��A�"�q��s%ƹ�����S?�"~E�O�Q�fm�E3��,�C�BB
�������3rH�:�g�7i�c]�e
N	�t�($]��P\#�2ч����Q�����n���Q�H
�����3��c����B��`l�`���c|1s�ט5�?� �x�����;0��ƕ*E��B��;^���6?^x�
�����
�v���~F$7c0�*��nk��Nx���<�}cq2��:��n�By��-�����V預��瞯��w��b����H4V�8��̠�R�_�]�3��W�Q`�"����+�{B!�J�E���	x��w�,Hp���Is�!4�Eo̵��C|4���0�QRNU�'8o<!��V@'���Zd�<ȼ�"� 5n\A�5\���l�
�PA97��5
�����Y,�O%��l�
���wd�����A��u���E���P4ƈ��Q��@�r�_�r���.b��,_�	q���q�������ۛ��3�j���L#
�i[LQ}�����C��սy�-l�A��2q�F�jBق�U��W�!����˲���ئ�lf9A)oȉ��*�
SE5e͈���#��場�4j��R��I�4���@��@8�V�-\��m�����*q!�݌*�ٻ��b����:g���A���|�d�5.N��C�
���>b_��F�.
#E���s@¡�)M�&)EH6�qLs�f�8R`���o��J]�%q�i���iڨ_��U#���K�)���}	�@�|e�j2�s��5�e��ɱz����@t�iz���j�X+�bQ5�$�0C.��a2Gm������ʞl�.b�fΥ|1�<��R�6��??F�Yon���,Uj�MoT!�7��B�gGBaxB������˥'-��K��b����n����~�v�ww���כ�t���ý�����[�������å,�!6�d�/�C�P��(���C��*��}�n�n��Xd�k!������&�d���.���W�,��)���NU5K*j2h�bJq}�O������=:��x0��>�R,�)�ޠ!�K�T~���'�^�>܆B�O����G��4�3��rt>�3B��\�UGk��#����_̍��N�wu!��@jY�o�}��^hI�Q��($���є�S���t}􎣅afq��2�h\F�Z���N�����=)���et1���_�]�k;�.⋳�'��D����v�)�~S�=t!כ���e�B��S�� $E<��,����@�()����d)�ϯ���=���"��4�������N�ig�ʿ�s����� ��yn�ŝ:�8�ny�|��w輳���x�߼<�G��/��^�#���G�o��Z�m��!jT�<.t�\=�w)>~`{�E\'�v�}@���b��L��
�{s�\��!0�v��h.�~Y����b-�x���.���\��ϵ�]P������hy�n��zV~%��ż*�!�+{T�՟r�	>_J���/�S��4��%�)�S_�%<)�M?�"`ߋ��wN��e|'���#��\���g������%�	��+��xJ~1?�%�$��@QP]�Qt��0��@j�j�W���V>]�u1[m���OWM!�Yw����$�m]�ez��9^,h'�_L"�j��ށ�$d@˹��f�V+2���^��D2��o�V�ZDm�h�>�S	D�#�#�Mf�>Y.\|u]�PhQ���`t5);E@B���S20����l���"��pY�ߚ��{�a��z/�`S�+���Ņ�����m�
�1n� &�@�;��;X'��x���bJ/@��-M�\33��`��8D�<����#���+H��F�~g�'d�`-��p���ή�h���"E<*4�>����z�&Yx�&�B����g��s����O��S���%���x`�)-ݬg���7�'��p4\�`���>9�C?)'�p@5�O�GnO��F��1$f��JE�]4g���7��/J�y����q�XQ��q���\�~�2����"|!$���֭	�4��9x!��4�R��nh���LT��6���\�\;��d䑿�z���`+��",���-�dHn�Q�: *Y��޿(�G�t�ȑ	�?�֝ 9Ɵ�=�`>����O�"rCs�q+L87�@:ݰob���jl����p4� E�N�}�{��*���=@V%�)Ҕ�0P
H�%>����{��GV8�'���P��{E�7�Go��'F�56��y�ь x���:�b�� ��#o������*� �J��k�.����%���t��
�b)?M�������K2T�=��^�8�r�4d��=h���B�j�-S����k�V�&��O*��t��O��I�J��N̂�hr��(yt
�Q��di?Z���iA�˟�	k��-����m�'z=�c�+��(hm�/H{��'�k])��BN�[��i��[���b��"2h��up�\UUr$�2�W�Tr��|IcR�3�f]�рК0*c�*��A�!�4=sm�x���k�7��z�#�65S=eEX��R��5�
|��wa:}X\>da5
 ��`2-���[e�{R�ЧX�����I1��4J�bJ�	�t���(������ʺ��g��m��8��aSb�e��U4�ℑ]V���(��'�-�_�
�Z�i�
��5L0�yt�����^2g_.}��	yc�E�m�!ab�>0��p� A�ј"~h	e���0L�v"8��O&��;<�1�ʩi�9u�R�P�!w��	�� ���6��)��XN
�ֽLyԺ���7��]�Q�c%�����tl�����	��`��)�T'(�9?�,���w�@�9��]��I�F���r���#z�v��U��U��{������4�j�ʄ�G�ֈv�:.Z��6����}7��s��X]
o�Ep����ޏ�ٸ�ǃG}7i�"�ۼ�۹7��O� �*L*�`�4���gd ��t��]���y�[>Y���tYZ&�8�X9/����B��U�>9r���N���`BS�ї�BN��z L�~w%A�0��G�1$��d�E�k<#�dJtq�*칐�� ��s�Wp�e�������?�Y�YA�'UJ�Y�&�e^R"�2���!��@�1�,�`���y�ͨ��cJ�����C�:5�F�%R8w`�/@cO���ԌV�G.�O�N��5�~#_AI�(��\V��Oj�2���?*bNJ�TdQ��J2ν��ʃ�S�N�ׯA"���)��������� T��2����za�(%����^=���nμ䁻 �M��W��V�Nh��:��]����(�b<�Ejn��>i��$��ߘ�A?�8�D�2����Hf����ǿ���X�{��'��:�*�{����{F�Ro<[}����F����=�����9n��������ͦG��Z�ěz��j��&x��6H�gdiZP��l�Zm�6ן�i9A��/l�����j5���4԰iж������9MUwO�JJ��l���cr9@X&�G0���1��o�!=�ʏ��Qt�vH
���^&����'O��|����}8Az'iMvYqU����坜V�a�tUs����r\��\��	��P�Vj���}Jz�'A�[_P����2p��d�
�>9��&[2&�͒������?J�J�Q|��*]�C�R*��B��~~�n�IjZn3գZ��0¼B���:+��-X��PO_�{}�`�{e�=��"���r^z�
+*�]Q����g�u���X���l8���<z�X;:�����Fͩf,vs[�N��F/¦�T�
(���Az��	��G	�5�ї�KX9�tCU��6N����ҽׁ�����!،lyO2'�s  -�E�Ai��ؓ093�mA4
���O���
/]U�2�n�Q,���A���);f�P��N�ҙ(�;����I�+�.W�1)SRZy���+H�"*x8��
� �=��
~�*�5�����|:;\8��/thD��`��FKU2}Plgp�ʵY���B\23�>�+1.��轩��0-떐U����G�<8�z�̓���/Y��5^��79	.Yw�Q6�����ϲ�_U���p�bvU�D�m}��S�ͧm�t|���l�w�����e��@*����QW�!����
0�f�^�r��>ِ�;���]wy�;���P�Og��F]k˷��O NHC}�l_�{������<�	"	�1��NU�Y�ZUo�T�U�7���`i�n��H���~sf�C$��)�&�D�34Hp�r������w�,�y*8S\JO���I�oV��qɚ�N'��'��2�Z5 ��T4㏂xV��.���v��4��(��b���7roK�K�30N(��k�p[0�D�(���F�y����ǝ�^�	�&5�+ڽ�����^r�jDy���7Mr�Ʊ��v%�ृ#��մ	�Jb(�j#ys�7�d(xݦ�u`��ENN�9>��^�1 �r�CD�A�
���hV�w��x�'ѻl@n��K��}��z��N/.�/^\��*�Lqam�Qt��|��^5���$̧
�S�u.h������`E�?�H<N�b��%-{��������h9�!T��<o~��n:|`A��-���֫�E6�)壡�Y������O��h��ISG����A)���kvJ[�Z�,0��d+W|��m����eMS��4ն��cˏ�5�YO)^Q��Ñ���7��e��	0��� uP̀�↋���)i�n�h�����&3�ƒ�P�CQ��M)^t�Dڡ�f<�i1���A `z�)Q�]U����T��x�(N*=�B�*��j���V/}��״D�S�2��L��6�k2���B-�:o[U=�Q�����#+�a?O�	�W�D"�͓�?�T�����i7��󎴘���=��d@���n0������M��>�t�@�`#>����k��ޑ�4AJ�P]@;���u<P�'�kt�d��t�`�f��j��Vk��4!��c7��QUk#ց����è,36O t�|<��.[�����4�D>ܧ Y�)2C����V�uס������vc�����X�E���$B`l����]����e���`j4�\�z�-��p�3*���^<JUd��pG��/W1gX�AM��Q�Bv��<�r+H*���P�Cb�0T������dk�"���'#����T4,'8t��t0+�x�$A��tU�H��17��l�OvZ'��C���g�ք�75�y��w�w�M��f��[�#�\���#X|��MAS�]�����L�x3��5��:4�YnP��{�;�!jv�xҢA�.�q0P�jI۱�8Z�[<�>Y���a�U��-�-�%�d���FY�仵�_�v�F�/"E*�H�6�΢����v�G�l�܏�����|kC�Ū�~�f�k�'O9fRjM�E�O3� 1c�9�G}r���`4�$�֚u����Pk�|�a�h��k�:�j=��U�Ύ�7w4E�H�V��ru�mA�+g�[]}�F��Z�ɲ:�+YS�3mxm�O�kw<>�O���
��-��#+��M�$9�(�����3�qK��p�T>�zFXڼ�WQ�!�X-#r��[R�Mn!��=�׹c�C��_�ɝ��t��]%��� ������-ä�i]��1 �jiQ"��0�����*�+�	9BZ=�Qhpv��( !db��+��N��Uh'�����ݣ?4��������#��G�{��zݣ���{�_�������N筷{��;.T��Q���u��z�;��?��G��v������|8����� �»G�^���B�����\����;o�v`H8Ѓ�����λ��v^�V>�=�pD��9:|�[h�{���P����O�E�g�{������\���6��V�q��p{�&ϛ�|�W)�tc뛟����i�_CA^�j�i���0�x5��rm��	Щ�ӰBe����â��o��uL?��g;�Hߘ�"{S*q�FT8\C�oI%����A��r��Rt��,�����}�6l��eJo�`h����t�Ί?x��$��alA�q�
�,���[X�T �,�>�tk5�����ϗ��6���/��u�索3����nn��S��ق���?��
�v3�c�T�C��v#S�]���Y�5��������l!9-��}��:sn��&�J���u-�
N�Zʼ��j��/�� /��:-�� ��
p�+�_�/�Jv>�������"�B����9{�ƫ�~)��lT�Kᄜ�if�5�h5��!�r
 ��Bx����LG����(�S�V5���0�Pt�1���,��9P�(��-�j1�-gT�� y����/x=�!�\��!��!����w�Jx��U}���<P7	Zw/j�Dn��]$�>�2��j&���C��Oq0�����3��s��c1�b�� ��=Ń�<J�G�)c6:b������6�!��_��Ho��l���`��0V7D�Q G�?�`�}����P,j�0�%�v�i
ٰ�0�F?��7�P(������ �����B�*r�9��b��M��x������>7Q/�@��8�b�l�9l�)E��%����9�t�hd�զqHHoYGgI��M����HӲ�
���6�%II0J/��I��ո���h�B�~Ȉ�����+_�;I=���Lg���xA�3
&��Bm���gs��Ơy	-,�,�^�Lv��
+�0|I2H.sR��\8!s�	z���WÃQ����o����
�D�O/�sy8,r$-�~�g���(�����Q&�Ѷ+���lc	�f��w�EB��J�pƂN*�I��N.�=��z�j��A}��f���]��XJ��5�7���b�%�Ǐƶ�ڟ�Ko�n��ND��I��:��N���nΌ}���6m�:}�<&07����!%!q�q��W<B��g��JU�<\��'_D�[��ۢ}mU�E����n+1��eN=g�SD�.2``4��/a�@Y��g���iA�V��$�ӕK��̞W~�Z:��ڟL�̡��������[|ʒ#�,Ö����q4��A/����(,!�T��~��
`ͽpP�7R_�>��_z`Ǝ>�pdQ�f<:��V�>Н�q30@Q��Z&&�!���"{���?}]�&�����t���u�]#�|>���k��g�!������F:	�Go�0#V\7� ����ӣu�����������)AW� �<.��ocJE�E��5��Ӣq��M�N�Q�sY<�51��7�n���-�M�]д�B�Γ��pMctFb�����WЎ�?9�\ҀB�S��{������)�4������-�(��FR0�=+�i��FU�ch���f|��'���n+e�HgˎԔ��B�b��ܖi�zPx�\��x���!��~�!���c�A�����3pC9�Y��ق� 	�|F�D�qf�U�gK]���Y�`�\>HU�"���.ݕ�:4:��BEo��P�lkָ @�8�An����zﱕ��]9�5"�
jmK�#��Z��J!`��]������K��MP\����C�n��� l>VE*^y4!��w�)O�^���Vn=4�*I	 `�������y!�D�7+��q���愪���Ir1P��\�ȟ6tL�/�i�h)�|�)ץJ�i�^�Ŏ�_%H�y~��{�����V�ʲ,]�����+����?��B��J`�vW2�}��$K7j��H�Es�3��LĚ9䧆��n
��`�4��<zdٳ�D{�����m ��R��������]���*~�U���`JpWE��Æ~�ef�F�Z�KŲ.��]���S(؋�	qi�1&G�%7^��A���WS��eٙu$� �:�(�f�i\���X҄t-�BI�.��1L�ء��{�!�m�S��Q��P���3�������
)��L���l��Op4��!�>���?��{J�*�1�V)�]� ������?���02E�;�f�	����@�YTw�F�^ߟb��?1jlY��Un��tz�s�2<Z�i�i�]]��/���<�m7f�J��3U�8�s���5W��M���^?4L�m�;lcTp<���E+? ��B��A!���($�8�;äl�P~#@�{޽��I�Uo?(I��P,�&E+?@�Vİ��2Z�>�r��p����;��U>�w�`��޽�<yܪ�\`��h@�L�� ��Rq��y[��i�m�qB��ژ��(�O��qR�������*�gCě�wil|�Oo+��ؙ� M6�*�� !��*ᜢ�{�7�:�A$ɗȝh<3�[T���@����s.�i*L� -��f�ڕ�Y���g� ^I<0�gl�K���ە̌6&�D.z��I��A�0��Vi�c?�����70��be�j�,�ߧ�T+�tF�j����d��۲�f�QbЭY�1����� ��[��:��H ֬z(I�z��CJt��Y�|�h��U�m���Q��
����1
�����h¹�0�l�F�6���(��~<����S.����*��_
��{���A���"�����@+�^?.�R��;Bk�h���ȗ:��,̽�8 ����T�S���o@y�3���X� ��-�2� ��
�i����8C���{o��7
��; ��Y@����F��������tq��tLtH.��n��"������صG�LQB�K#P�\H�cB{p��8�L0"Tx ����Y/E��q0s'�=�����.�
U\�h�Y4����l��,֩���τb\�}�O���M����{�jVd���g�h"ڤ�!ED��I%+7��ꪫOW����Km��o�5t{#%��M �
M�YG��9�$�F�"���!�c?��r��� Zȹ�����?BKj�VG3��J�ލX�/t'.
jߞaF�����w�� �z�	[D�9�A�[��*��\���]�rD�w�g��B��<�傖I4X�.�A�7�F��+78��=9��W���(Xn�I߉��'+������k��陖`mK/�߬�2F�=r{@5��]ѕmf�����.$���DGGR����m
W�R�F0�&�`�U������t8w1�d��E�7p����;�}]h{à�?~�6�;�
@ݳ吤�ǈb�.ƂK�ޱ.`�	{�nN8kX&��Ќ�퐽W}P�N
��$m�u^�NDN�7��8�zX�"���[o��A����~y��I�7��YYA���z�3���N	�!E��Hj�������[�~��㸅l�+��۟���ߊU~P�Dy����⴩�Ytd���삊����9�'�Z�������vB�]���ȢV��)+��׃�j�-aZ�w�Ԧ�EW��Jd������<�	3�o�O�U�^@���C�'�-�X��P��
oH�S�u�F�%�����KK`-5o��DQ�p6�y�W�Hf
�iFj
ȴ��WP���yH/	wM	OA�k૾���n�6E �mڋ���z�2�G��l	�q*Q�ڄ�$� �NNo�u�IpIJ:AdSm���Xd�-�	<��2e��1���� !����k�S���̭���D���n���(���Q8��C���-_D��ܦ�l|����[�	m�d4��!�L6�h��y�@K`���Z��r�ԑq�Kk/�T�)q<G:���� X�'������X8�
ɹ1p��������]V�d��8%n������8"�XB�jn�,%d�D���G�Q#��@"�Z8���M�<E��X��Z>�BВ�h��Xq��oYn��o�I� �2�E*K�T�f�rv+���1���f>޺cD�����������O.٢~a".+����A&{$���5H����r������5�
tKy0)?!���  ��xE�^,5��׉c����2�bW�*�&W�hT$d[�4�K%P�B�)�sL`��� gٙ|<�u��H��{G��T<���'3θ(Te�;a��8���T�[�"fH�<�(�~h�uYo�"�`����`٢7Vr��)��UT\$�HO.I��yx1�4�x���kҕҐ�]�s�5�C�j�t*뮤)�Y:*���X��:3�,�)ŐN<�L)Od6���R�`Q̖F��R����S�� ��=g߰�fZ&C;��z��EΕ(3s�ib&�pO]
�K�RI�d�Q�{�K=� �t�wUYfǏFc[7��[�4� ��[�
d�㌵�	BhY�ݚ��xO5F-���hڈ��@����5W�'2�ߨ�(�k���|
��Fk2du���SD�yG�H(2
�.�\���Ń*jmA|E�4S@���s�'��C&݂ZE�o�h� ��DAx)���apI��$�y
���Iv�9{��b���Ф�ɤ.��7{bO^�G��S����7��7���d� �.��|%�?gGIOD�!�����t'��"�:���8��{���|H�Xɾ�f�JHD�"��j���?J�c��iE1-y�\y��4����z�Ea2]�K$,{Rb��JP�V�d,R�P���a��4��J���x��M^��K
�M�!�Ό"�J�peK����JޔDN��6�N�a�R�	���2�
�i]�9J�B%aZ���!�>׳@�LXp%�҄�ʈ�@J�+��������ewk��90��H7����!R�o(Lzozޖ	TpǉLP�-a�K�Q�[;�G����l�W��40b:�X)�K�HbEW7-i�V�qF��b˒e�
$�R/�7wRKt5��0�;I^LD�n�:�y�+�`-M�K�J���q����F�A�Cnt�
*+e��bc��5�`��Z�|)c;��j%'�͐l]�	�W�W��b�/���UɢƇ��w�j��at�6�&���(��Q��xb������;���o��s��̧j�2�=+F#;@��(`�.J��6&[��yq?6�Fy`ɤ��<��5�	��=����s8��~]l�CJ�4�� mr�@'�o2�σ���T��˃��W�5�R��]�}�%�F����*�ζ�D���1����a�r2�dcf:iN�.{E��tv�;�0P��m#���	��
�,��xtMTJ�D�֖���I����ڼ$����J�����r��\a*�L�ȋ(.����;HY io�%A���r�*2����ո6<�K:�hg�
*��5�b�hO�/�6� dR��Xkp���dl�SA;(r�9mo�#x�G�Z($�֙��d��50����/�'/x���|��zI>�[u�1~�$��`�$!٘O�w��ź��������XL�A�2�
�dBŶ�>��+BjC`�����ܟ�f��[P���?X���ќ��9��t0,7u��	V_G��C����u� @`_.�	�*���s�]���+R�V�2��Ф�%��p: �&�P(��L�8SrD�+"f�������,�$?��m��t�0F���A&5&��PK�A���AO���������Nu��"�X�v���9)�D��	ZrR:�}�#��
��^3?$$Ǌ����O2�5�5U���u�$�N�*����~�ǭ{��L4�D(
Cl�Q�l^Gt��G��s��;�R�X-�op"��7�Bsz��-n��Q��U�U��O�j�L�������*�'��2^N�#�1�^(K��p��9,}���V�'Z�5��E�=��r�gJ����/ ��uV�d~B4���-��TY!����@���p�v��(�ޤ66�8��]W6�J�þ ��W�~�eSlg5
2�s��T����`���ư�қff�v��c�9�gmͣ��@��[6,)~���ے���2��>�c6؉��ƫ�-��}w	j1`�rpwĈ��:^CHp��f�U]?���<ͫd�"i�У:>�
; �t?�}�e~���D��Rmm� ��6 AM#���)�FT��E�<�c�P"yC���%�Ϻ�Ru�]@b���
ئ�	�ZJd�-�|"I.��3�ε�i�O�1}DHOPd��i�0ʵ�F�E[��w{�o$��}��a��7������O
�]X֖2@U� �Y�Γa�\QnhT��%���ŴH1���\�ҭ�i��aN��?��5�"����'UR���DJI���� �K�)_�Fۣ��4�-��:����O��	�b����� L�D�f��N4ib*�jcX�^8@N+�n+�>R%[�u#e[i�Bf>�Ld�����Ape��a�"i�[U��K! K��L9$�S���Wq1�hUV�Ʃ4�D�[����W��#x�"�H �Z)�6ꯙC
�w����m�Ό7*�eUT�UF&?b4bc�q&��<�@��
��$d��֋bh3[��/�Z���S�D拎�
'�QݲK
C�����[��JX�2#���h�1���4����1%�ժ�d:
g�����n��Z�~dp���љt2�����u��:��l����aL�l�����g$���g�1%ے�{AGG���9�^�7�g���wx���-h�C;rW�A /�5����' ԕ��`�"������(C�1N��/P����$�'.	�f'�́����~
�j��JE	��(Oi_���bI����d����_3��֮a�ss
�	b�C��%�_�o�I ʠ��G��3��'3���� ��ɏ��,b_�E���ݠ/��
|�bld/8���?���i���ҩ�	��cu��X��9�A�rٯzg�����p�p<��X?�>{�*��)9�\"��>><'��!T��=co�ܚ6KL!�ϛ9e4r�� �<̲	}�J�����7�������(q��i�"����L�~�M�(�YܕUA�������h����ap�]�a@l��pA��k�BY0������r��^(�giU�F:?(��m��t�D���5f^�[��+@�RD�Vh[�d�*�뿥J�w��`��g��ȟ�+�g(b20+�WM�Ξc�5ԙ � �Lk�%���8u��:!he��;
ȃ��Uѱrl�R�Y	
#��UL	��8�T�)�Nʢ�ʔ�Lq���	�<�5g�1e��n�CI����Hh�@�S ��[k�����@�j�qƿ�G�t6��
=Ե���4��M���:�L.?��i��6���ɗ�!���>��d���ҽ�ǬežK����Ac��:�hP�6r��]�"��	�> a�����z�(����ť�7MZ@]��W�y:{f����J���mN��&ѥ%Ĭ�P�ێ����Պ"R�(��ŊU�`�J�,B� Ut/�ѩ"Vg�,?��T�SU�(Kl.������?���*\�X�o;l���-��>ܭ׸��SrP��[��7��krz.A��v���a��}r�	@U�>w��Tՙ͸��Q����1_6's���Rk_p��=x���tn��'p'�)GV�U����M��DEl�b/�jUh֦*�n�	FK�n �S��W,��}0EK��	�-�ڶ��@H�M'�N;�9�axݟ���E��Ѯ�YF�+q�P�.�`Oؘq7�#��f�8�^���E�f��t�7	I�a5M�� ������).I
��x2@&LYT��)^�d?����&��%�l[��0��#�2���T*e�bJ��Xف�L0Ek�hkw��P(�c�]�a��,Ny��┺ m?A��p)7���P�<�i�F�{e+�3���k[No�_��Q��Y�N���9��-a���H�SӸ�M�}n�&j1�YB���=�aYi�g�׊<�ܑ�Dȅ��h>�$^9�B-=-�1P�����/�{� x�T���v��\Ha?�6���oe��C��?/��	��4K$�CI�-N���oL/H����4V^��&�8��[Z�~\	����v�4Cط(���̹sT�9�
7���$�[,�Kjm2a9����{��$��
Mե����彭T���x�=C���/%ifuqHI��X��Ŋ)�VbDy1����.��-1�E!�>,/f�Z�b�/+�<XQ67�����e7����@��~P��\���b�Ԛ�c�yB� �fȖO2�y�i�v.~��.�����Kψpp�y��ޯb>l��������<����X�<�K�!Ig����a.ߒ�<���
�Uw}[�z[؋�-����hARj¹؛E�ąRd��I��./w�Q�� ��Я^K�{:3*�0�Q!�e�����݀W̖p"�1�
���ʰ~Uz���o����@1*����nZ]��hE
������p����?'��.W���2a���e­��m��#����Na$>B�_�А!xF�XJg����]����A���Q��1�l�N0Bޗ��77|hJ`��H0���I�t0t��
y~1!/VF�90��
� �_c��D�>��_�!&A�<�H0��p)m`ܧ�a0��+� ��A <�Ǿ�����rHa���AtKC�8ڛ�e��:��O�V#+�5�'�1�
�t���� n��aAid5k�l�.18`�����OZ縵�!pO[�MТ�D�xx�%բ+���w�ˊ�̺Z6��=y�K�o�= �}"exU$Ɓ9�a�B�Ñū�/G���"kR�*U�a|�Y؇x9��e�O��+�/hVS�E��@{�! ���.x
֗��e��39j|LnLT^�o+Up���`��~�.,��x@�U�B��x���$��P��/v���9��ˀ���F��&�"��u6���M�<t��QKO�Ej�R�4����2�Y4E;c
��0���A�	�!ߪ@ <#s�� m�׎iF�E�g��85*'$
�#{�(D�B�h����HP����9q7��փ1*��f{,�K�Rj�<r�y��.�d�x,�W�d�X��m���ކ{�Ah����֠uϰQ,J��(S8�������:;���������|�yGݝã]��?_��R��� �r������
d���;�
�a�=����$��3J�V�#��,ˉT�\�������xQ�
�8�@�M����M���6s`����/���.��؃Fz裆��YU��TSN�Ϫ�V�z�*-<7ZxZ���^z�ͅ�k4�&62;\7J��p�h����Q��x�O�&,���r��?y�u�@�1�3կ�S��i�
ȟ�����p;u6�t7�����4ڶG�x�d+��:+�!o��T�`����]'����?��0��4d:&	���������uع��1*�[��-�M���r�
���s��opg�g9��F�͂��F��;#��"�yw�j6��P��K T��l�j�^��M�j3�6��6�B��g�Y���K<�\���w�9�����`$�����p!:�h-v�l��s�b�V�E���v4���?�`����Ǥ��-�cP���l�L���@*b�j«�d`yՂW�_��φ+Y����ۭ�x���ۭ;���"x�uw�m6�����K�m��l�m�^o�M��v+o��o�x�8?K�������|�2I����1�����Z�Pfl�8�e�s�)@送�oB�����7oޢ�������7(
_o��X����8��]O�����s=�;��O�����u��Ӧ��>�#�|�MAN�ؿus�6��m��Wh]��~�C�6��z˭���Ӛw�ޙ���`�h�ߞf��fp��G0g�'ƃ�m��6EIݟh���4�j
3U�����v��R�3U{):�ur;֯��қ�y���p�#J�-�KV�u�jam+'}�PE�����Б:�)��.�uq���?�֊����&�_./٥[�����ކ�ɚ�}<!�$� eTT�����c��S��^���}�3����mz�
��
�F���@ӄr�c_��/��0�!�C-���;vj!�z�S/�jņb�c[+� ;<d� �����"�ǰ���5M	�|��ů�_Th���w[-뼭�{׽��ilnn���z�M��}�v��v5Wpߤ�ҏ}���Fs���Vd����;�ԝt�n���GF`����l"^Eq���S�c>�1N�)�����K��KIZ�ʬ�{Fa��Q~�Y�{���M� ���^o��ۮ׃$�^���^�����6�n��v�JV�����j?ʪr�N��-x�-a�=�b���3;Z�n<^>�z��Z�EZr�
��G7#Q�E{�U0(�+�|��U�`v�oڅvZ?��ywޒ�����h���S�=���o��v�ng��p)+��w3�~��6��5���ZA��� ��ݽL�Z��Q3�P�����h$���s�^�'1��y��t h0j�ϝN���ݩv�� �[R�ܙ�2�{�-I��mo��zL� s��"{]^h���M�h���N��@&b}�0�
X��|��Ғ\{�m�֡��'�qnؚ�ꕼ���ѻj�}������z�muK�ܳ�t�Zآ��),:��4~R�%��/qx����B��ѐ��Z��6l��jz�4ԥ��4����ч~�f
J�"��i��P9�o�nD�TT�qk�Dl4���{�9x@�
���6/��
�(ۥ?B8Q�6E�2���k�s�>Q��5O��i�����0������+�g��hȺ(C�&�jT�!��M�1������BC�Ԇr)�Ҵ��X�ݧ�Wn��3��Ai=y^煏A����=
�=T��tf��A�Bz4�Q�_v�C�Ԇ�GAד@\�!q�+�R�@d;�>��0Xx(;�$V(��.W
�l� ������=er>�fa�$<C��A䠧G�t��`==�Km(u��1��_�B�-�b��a��8�D�/W�5��xo�y
nyO7`�h��nk��Ji�*�da�A����5�3@ �Y���>�����9�k�S�"�:,��#��D~(x�y�A@�Z��MU:��>�j��@ʜ���U�L�~'�~i�{lJ�#����Q����� ;xb���#���JVT�7;C�Y����z����}88��ѳ���Ap�9�'��N�Afp�+X�ֻO�e)XL�oQ�Xu&-�3����o՗�J/�F�m��@+�Z�Vk=��ͥ�}��l���6��;Mꍥm'��G�;ޚ�a�;ǇGU^������Y�m�����.ۓIb}��}QA���iʘ����+�wh��TG)�,гˊ+�tg]x� �>��K��$�����v�w!E>��UＭ\?�鬭�/���w���OB���B�}N��'j�I��$�<,�@��#\j���I9ij��� 9�PF����_4f[$�9>��
��WkQ�CV���9�L��Q��| ��5��^��J<OyXdy��9�d-���֌mH�0�'}������뫍z݄O�3ATyaS��«`�r�2�g��g��A�)�q��/�F�M&@�ʱ<�X}�K_3G��1�!_�b�����Z�be8/���@��k�4`M83U�=�T4����_�,R�DѰ����-	o	�A�Z9t?v��JR����mf����b�<u4S�>�5!w!�<h#E
������I�`�q�(��&X�<��Ie`�YK��Q���Q�ce&���x��"��SJ���hdNS����HT��}H�x��f�4��Wj�H����J[�)k�
�2�"� �G���d:�����ᒧ�k�;��,�>�K�����L�J` ^� �tx�BSXZ7��(�!W��!�^������4� ��Q�
�Kj6�q�
��)�W�U��8� AB`�/E�贐?����їUy��s'���f�����y®�ny<����Vr�;6��7 ��;I�;�a����]l�]�s7̖ 3�D���7�X6̉bYΠt՚�s��)�`��)Ǫ���\�k:@NGi�ح
ܚ��H+DZ�	"�b ��ַ��ֽ�I+���;
��
W�/-:r�V�wh���~� �m2���֏�΢�2o��*������.�T�Wew U�5��><|	d�_����?$���Iu�lH��$�]V�Kz-\�^uz�gJy���Ы�༛�P+O`�+��䋲HfpaLz9`σWeSU�$=�N0a+`�셣@�g�4�H��ϟo����?��@��?b�4��<	���\:/�����TW�XK�]7TC�&���h�j����a��y v6���ׇ`  b[���9�=W��*�%r��d�4�_��
���t��wv����lu�N8/P�V�W#v"�V�Y�~�j��^
�98髍M�z�.������j՟�"o|����D�zE����B/[7�g�j�8@��:�הQ��a��6S
�R@X�U��<��g���"9(	�yxAX����aSkw��Yr
�^��r����KT���ӳ�"�$a�+��<�yq���^�M�T~�!�M�-1��H��J��oɱN@_e.�-@϶'���,�۵��)�#O.����w��������F�% Q���u>�=��q����������`ʡ�,A(�)�����S�N�4�!�SZ�^qt�ͫ��:��nd�)���h�V�����I?7����5	f�Iχ�e���
��kC�6�Bzq�&r����i�t���W8Ҋcդ��R�T,�Sxĺܠ1�N4��>�W-S��]v�[O�e�C������}�d�J�1��9��2�چ|�j�A�t��"+�IUm-����ƚ�jW���'#µ6� ���Taꬌ�����3�`�6 {�N��g�5}���l�S&��X���+��|s��{�'&�0;CH���1]�R��E�J����I��5"�\$��?��'%Q3�5D��9����.�A0��Ԕ��y}�z� ��Ch�8���ź�L<|�E}�
��!!�`�p������D#��T��.ǭ�h��� 5t���n��Wa�E_�'��T&O����\�SY��k��[�������cO���֕�� �}Ӽ>s�=k���,��[��E�����=�F�(��6Ü�5�� ZN�~�ћP���`;��ݞU��"�?�|��Hs�4����'ef�i�#Q?��,[+���%��W�9e-ݕe���B~Aȿ}�,�a�0t�%̂Q�Drg�l���/�K�dH�8+�������u�v&��ڻ���m��)L��A�1�&)D����<������aJ.����Q�3zyK�"�>�4Ú�z���Z����,[/(pJp]w�k�'H�I<��S�6��V�oіXt��ԑ�4>[2��-h(w"��-�&��/.�Խam.]نڦIa˚Z���XmC#�e��� ��R�E6JGiN.��|E^�|M��޶>m�ȁ�щu}��2�4C�b��D!�Y���K�3�b�|��KQ$��T���1��G͙.Œ���*t[���T�B�|������1�?��#�Ć�����&I�ƀ�=DOxb5� ���&�*���)��1Ds���y���,�]�ڀ(~�@�_��(��qK��0I�8s��\�Pi��4�|��]��r�W\�4pO��F�U��U��@{k�.vS�'�D㔰�vXe�.���>��j�E�a<�M�K��Y0���$�(
c
|Q���t�����������&5)�i넰�1����v۲[WDR`1Ѹ��3�7�-�s�o�1�
e+�Xu��b�j��o�zb[��U����UR~ɒ����Y;X�Y��((�{(<󭀚$���[8�PY�����y���r�V��<���aByr�$��l��Мb�"!��r����>���O
��KI&��vS���-h�^i���'�R�Ml�:��S8j̟��!𜯘��dNh�C��&�K��/����9U��?\��{��8+��ք�Ξ���i⡨�g�jF��m��S[<xV�����r�,m�A��OјA!w^��L`<�u����+����5f�]�{ӫ�uoz�ڤ�W	��H�qhZLl�u
>>��Iz�O�|���$���x�͈& ;Y��m��L'fժb�_Fm�eb7w�*-i@� &Ǳ?I�P�Ε�U��yB�
��GJ�����nM�YM�����hQj�V����<
f>����3����J/	A2���
�OX�-W�؄�#��3�+~}
[~��%��T�	��KAp�����ZK"z�D�[̘ �P)&)�dy�O93 ӗ���`_�  ���}�vW�໿"�q�6 �b�ɡ%�V����xxt�$�$r"�L@�s��7��|��R�D�ݷ�H�d�Y��y׸qc�q#�ˎ�׿�����+��^�b�]1��� �k�o`�1���p��⺘&��ٕz'����s�{��lt����������0���Q�^s�:Ł�h�o-C���j����M�~:��_F���)䂜�q��Ƥ�ĮB
�������!4Oco ���{Q|��U��v<����L����i��>����p���zO��-��+0�	�:j؞2��b������ր�2������<�/o��`�9H��ahX��;!4_�y�E�֘��8�@�F��dl$I��n|C
Lk�-<wx�-���.�|�G�	�`M6�>A��A�����6=E�-@��	���)d/tG�@������F7�x˿Ѹ=5Q�_>!h�A'E���w����R�ۭ*���z&R,]z&1J�<ػ�Y��o3˟��ҕ��ڿY�n��'3P��m�lo~�ފ�-�Ҷъ6�����;`��u����1��o�,����2�"?����=��	��*
�&�Я�����y"5.��FbW�O�_�.���z��d4:I����۷ "}ӽ���3�=���o���z��( W *5_fd�)��*�@v�яcG$ ���j� @z2�I��� �c^��P��m
50��� ��Q����9φ&t��l�$��M.!^�I��۵�+ 򙦈�~I@�^�~��/�π�}�G"����>�1��޼<�3F���(� ��!��I��p����^�י"���%��Kecf�ޛ7R��ئ�Z꼭������v�Q�߃�`W��3���?��(Vw#�r$h�5��\zǪ�;���B k:������`���m�'�Ae�,����J1ZǈE��$��ev�ފ70��M��P%���p{�+��.�hͣ@8<�_6�&!������+�yA�!-kQ�
o�qj��i�r!�(!h�*���d)��|D� ���������7:��b�a���
�o�S�<����`c����A��
���xu�;�\W+��m���:���dW%���ҜG�{}���8��N�n��Uv�Kmay�ZR�#���Yij����lV%�-*���Kud�?�4��B؂��#u�)i�x�ҕ��"�ƽteA�^�
æB�R�A�a�A�Um��F�/S *Q�?��Rz�V��=�����SuLS��R��S�@&d�Z� ��X#�T����k�
La���/F���jyOeg2k�ݲ#�m�fqƘt��2���z�A�HἼ�=Ǚ7�M�7�dWq��h
I�j�o����Β=f5�1�U�9ZXD��)���
]�=�)̍�]��]���έXrb�۞���|^F���>C��
�A.	2��%�lSLU�gED&�������m�{>f=���-�)�<|m�_�t�30(#O`S�%��O�����7����&lѨ�џîa�V4�~G��9 z=����D�R���l����&��Y(����VQ k(�j��{1ޘ'#f�"/�5���(.� aRgռ�r�_���s�;��?�㚖�*�R]�����O���)��ض>���R�nx�u�h-��s2d?&С+(�a�&�� �Lp$�K<|�H�������v�+����D�d�\� y.�H����C����SUf�*��P"�����t�x���>�ѣlBIX�VV$30��� ��vx�hwN�;�yvٜG��n�I����������܆��>�p��^�Zs�d<��7b}��}�oŨV��b)mc����/��Mk�h=�U���Hb^!tL3�Hc����r=�-;��j�Y� ��ٸc�x
�#�Un7ZoE,� �S�أ_�V@�v�_zv5z�Ҝ�O�"�~��`�rV��.�Ʊ��UJ��}S���ܪ��{�ue�e�<Ϡ�'VRϘD��w�j�D��ϡ���	[�6R�_��s�{-s��^&n��_�{��(�0�p�l3쉴�R�cqCx"� M9�o���(چQrJ�S*-��֪6�Ң�PTM�.*�.�[	\x��=E tDӇc`�,�7/oi���f���OHYo ���I��������?�oD�-fSf-w��
��p�#��M�[iu���U�*CT�bA˵r}�ҵ}��,ߢ�J��b$c��S(T3��i���b������c0�I4�����dB`��1����M|R|(k;*c�T�d
�0Y�]\b��zQ�>�=L 	�
u������"�`�lj�2�������Ir�ʧ�G��K�R�Վ�kb�\��x�]f�P ���%B���'+Q1�F�9� RœYΣU66�Ftc�"�h)&,G'wĆc���#Hݲ���L��H�(;ZU����S�>,E���l�ްT��"XDo�>�!bHnp�Q���Ҿ�&�D�ݗ�mu�6�@�i�^g�h�Q\�a��1�fR��q�&��̢Q(��t�l,y�]F�fd�4�A_Ɠ�(�9Y�J"�ErV��t��ot�=`��� GJ2MY���Qa"H��(�VOX�)>��Ĭ��{j2`ٴc�R�O�1)n.��5ݞUC�>>B�5ӶX��X�)/����iYĶA*�b۰K/�i��p["�U:���7G	�E��Dª�h�~£�[�m~��T&B1A}6`9�X�AN�n��&���Z�N u�u6�<@���o�%+��+�0���eX�A��R�G�M���+��6n���8κ�:$�����s��E53)���?�]���������7��ܹ,C�z��]໨��OJOd�ڙfeߟT��^�������&gjZn"C4`1j�
�_�H�THz��٫B�;�V��1���sئ�ÿg�7����F���օz��A��?:C���o��9��L�Y+��h�Ӽ��Y�j��U93X4��p����W����p{o�IwÞ�����.��[�씜>MrF=׃a=��e>e�m�6�1S\�<�ɳ�6#b `(
���Z�.F�Y<��@ �5/��ly�V�{����:��C�x�+���K��6�ax�_M�
`K�=i�v�_�U�Rf�|�k���$���݂���M����f�l����96nh*���WP&�8�Zv	�fQn:��g���kR
[T���a�1m
�h���L`�d2��K�fw��mH�|M/<v��e��,|c��zt�RGW2�|�dC1��ô�E��v���-��m�?������Tg٧!�Lxmo�NZ��$ϾNA���ߒM�Y&���VzK�FQ�ϧ���:�ᳳ��J��eE��-~���ؤs>yn�h��e� }�B��#��bV���h<N�Lk�¾b��¡���1O� �+�C��(��hC��<��ba��W�ޜͦS`#֘`�����&�K�dz<̮QK��/�A<b���w�P�۠�[ ��vO�2me|�87L5��u�J2��1g���T0�M�f�U��d ��ɨ�lJo�\�07{���H�\��^EL�
W�����+O�$�t�e0�Mn>w� 	�h>Ɏ>�A��3�8
Hh6,�9K` ��'�G�i~�#��oj(�i2�����'�y���XL�q5>�0(�_󀛱��
���r�ZL˯�/=�c�����ֵ�	3 _�
;]���ڹ(���4�c:O��n�n��:�f.���QSP9.�����0"	���2O�yB ��cZ���������ݽG��H�l|�]\�ѻ�
��� -~N��h<P����{ڙ����*4c���B����������D���C�%O��>�l�L!����#v��������' ����P�D��X��YmG3 RFLG��f��]���^���w7�!��Bh�Ci�f��ک���]��G�$��=��O����g���ɷ�-�7+�������A���"�ɍ�؈�㊞�`��W��a�"ErG2��'��9A]f�'ۂ��������Q4'R���N���%?%hT^Bf�X�H����!�7$��L>h��>j�Z����]�j�Ǉ�}}a�$]��N��u�D���Z��C��"�K�X���q�[Lұ��nrvGQ	'�X\q@���M�yau̵!Du��״D�F�e��xf>m[�cc�Gg� 8*�ߕ�����i<^��������b>�׿hsz�����K�a{r����p��4#�O^�i/�,�cy'�J27z��q:��d�0�8�b��tϡ��	o��p��J������:w�uq(�bx~y���K�m��}�݋y"�lV�&�t��)u�L���Yd��H�Y�}�r#S�r!�W�75`Ú1
q�b
���I6I��+��M���"-H���oW�R7j�F�)�d�RR����$�
U�~�=��9
Y ?��T�[R
P�_{����B��tR	���ޑI�`g�+@j7�
G����>Ą��ҭ�zꊄ_��ss�S�t(��`e;���pޭ޸my�\�<H_
�hg}��!�5��;G<3�/P�Q9���tT8��Sv�Y��WGZu�*.�t@���0������A�l��{r��gypǌ�U��FѨo�ttMl'���8�����l4K�T����k�tܸ��X􃛿����f�����	����j��*��Nr+�M�̰�o��	�E�L�HW�?n6f6nDۦ�KN�؎�[��/��9��gc�z�N^~�TU�rllZ���-�ݕ��FX�`X���@D,tp�zk>�6�?�a����_x�k*2�n~|�J����oth"��}�=�L
j�F�v)�d���8F�v�[ �����Bkq����2�a}Ou�0��y�9���&��L�/��,Ed
��6f���/����~q�x)�B#����$��#I�
��XL���{�������4^��P%�>�+5��Z�W��*]K��(Ņ &,�WJ_im�lh��ZN?��_T��T��ͤS2���]Fg=���(��u��T�0y�.��KP��ؗ���>�'��jk�r���������1�����F�ǣv:D>��ZЪY^��bk3]�di��Q�Z��mײ�d46���E\%G�1�����޼w��<�s<F��?Z��r�9Ga�-3�ҡ��-h�fh,�
� #6���%��ئ���!�r[�w�� `� ��+�'���XL���0�(0�@LH�4��3���{ן��fY.4||�eӴ�1: ��ъ��� ��k�u�������e��ߢ�J{H���A�.e��i������{��H*��=ꡊ�_W�r���E��:[��r�Y��J��.=���ҩj�����
80��vl����R��F�0�S��X<�����q"�7/����O+]Z08�(ص̦��A{l�$�����P��rIT�9�#y���4�1���IR��A��%��_V���@����蚯�Qj��A	(t�Nǫ�Ht��d���o�G�,��6X
�/b�o�f��NʞSPX*Z�Ld	�E��m�;�+.L�'/��`������_J2���Ƚ�W�����^��V��"Ix����x��\4���E��Ք�l��^:}��^:
>5�#3S�o.!�l��ҽ�Ğ{	�^B�"$��<t\_ZN
�	,*-��P[*~kȲB�@�� ~j@zN��\�9����)���,��H_t-٢�}���#�+����}�����a����˓��U�3��4�{'o5)[�u�ػY��KHl���M���m���0_Fn�R'�� -�u���w����ᖋNw)M�DUG�Q1J�?>���#�_�:>~������7GћWo���BP�����l��6m��M������5vl�`0���Ӌ!
ܯ����"E���|��;��N���zR܁2bgZu��sk�]G���e\<�[��Rv-7�~ �)^��뙰�R"W/v�+_Pz7$�v��q�[�^}YI�?��[-�V	�a8DB�9-�|{�?�预���^� �}��s�nUe\ۍ�K���bv#�|-�&I'�V�� ��F�=�j���0��o�S�L�s�����}VTy��gCu�oˊ�s�{vtώ�0�d�ܳ�;bI��,iNT��9Q��:��Y����)�p�Ł���*���<������-~T�,��������r�g�����1{g�u5�%[�t����4b&���R(�m�w�oq^D�2c�mć;���	G��[��?�>⹈�������
 1�<x�W�n(n���6�>_}%�YF]�ik �>f�c�_�\����7"j�)��Гu��s�d3|O�CX<�Mb���Y6��y��k:H���k�o�e\�$̊�_4/�j�t6�HS�t����
����Ҭ�^@}L��/J�P�"�+��F�?�c�^k�jA�t�� FP�Q\(�2�$ :�T�p�< ��cr9:���b�(�i}ݩ����5�b��d��;�(�-���儯EӅ�<�!���l�=z��zm?�i�֖U4.V4O�!��G2��mc��7Z��T�LPQ�T$������Ii�W]+�
�E%:4���n��ؓ���g��xn����v6���|oK0���i��� ��X>_�G�d����w�$�PLu#�eN�y��o.�1��Aw��ڮV�u��
�L /���b<9�@�
�CV��8�F�b�����b8<�t��.8<iρj��Ӎ���H�����c<�c����u���r`��o*���`�}2��E} p���w.	-=��J��t�u������l<F΍ �v���� ��&������w�'��d�QԴ�6 jsI@�dl>\T���
TG�M.P���e�D��M0�+J	�n!Um�4�`��/�G�_��o
pS=L��5T����ڙfO�Oɠ�[] ��N'�n!
XYhA;��(�HD�U�dM�,���<)�Lk
Ѽ��0f�Ŝ�S��q�L)���zIzK��o綌]f8�6n(e���sq	d�D'A�]g�ŒO鴪)=#�Y��f��	�J��&���y6A����j�U7s+�ٵہ4�>(k�W��V+Bp���ڥz�j.�uWO�҂��:l�,�D"�)`��á��5u���ݿޘ@�v�&�n�|�����;�4=O�;���afJJ��ٖmU	��-����i�dZW{V��$϶�߹I[��ѧ�I���aJ�C��x�������Z�<�.�I�%x�":+,���Uϵa%�;��P9��kwvnr/�Ȃ�мq6�K���j���9�ˌ���*O�i&��Et���@�h5�99Q��JaS�L�)s��Q|M���X.����3�ݒ��Ƌ��9����:v����8�Q"���6��=�Pإ�^Y���=7��=���T�Ӵh���[���es�V}��c��y$0v�E��4��J2�3˖��m��O&|m�e��B����|����O���{/����u�#|a�A�����c��h`e��{�gu�"��u�S_�Y����W}�b1���7�W3QBh�I�$6��mC�S�;�EK$��+yjڊ��i�}4T�;RLL	ۖ�AY��qt|��l�N�����i���-h"�}�p���%�">����a:�^���Yv	��n�'�1��=�(Y�׺G'u��W�<�?���7\�Z�B�He�!oĆ	
�����{s�����-�b�rG4g ���}lf6���Գ׶SǞ�A� %����a�\�9���D����<yl��;�|;!�%�;U�5娰疋fX}�?���KS�VP�mE����dqqN�
�,�@��>���9#anh ���0��j��k5<�$}X�2������iD�<J��0�9�t��dJ'��}���lAua�f���q���=p#���MA��ټ�TS�4?�2O���,��m�l��ZYf��謄o߮�)I�჆?+[������>�+��۪�\���?m��g��j��=�b�J��J�W)-�Sc� Th#�A�����L���OD��Q�a��+s�UD1
�rۘ�N�,��Q��8���=�s�L:�����<��j�0g+�{:��	��y�W�M��˻������OKPx�@��2���C�ܴ+�N�'��e��tg����F��Ý���E.ٕm*�~k��N���;Ocs_�&���S�
'ٽ�\7Gz�������$ /�|o�Cy�7ͪp�r�7����\Wn�y���?\zSv����������Bv�� L���������g3_����H�¡n���(���ī�~�Y%��W�_xڍ;���{�62���%��w��Ô�������d��g���(�۽���H�>1���_�Xpk��3�,_K��,��ea�?-�=(�	�	Nge��8����5�w�S�-/�C>p^�w^����������b�r�w�'�-oI'�����*��ߑ'��F��~4g��~�B�Ҫ���7�n퀌�z�>rV���4�����:ݚF�Do���g��Ө�$�
�㧽�㧛�(��^u�TS]V�դ�״x5I�{t��)�4+kA�
΢��X{2���ʹ�٦$UR�N��~�nK�§��^������a�����C+��3�t�
�U9N%�_�֗�	r���ľ�O�bx����ir՜#���xT���
�K����6^�y1���w٥��e�1����_���9�boՍ�5��E�5���@a����l:�r�e�a*)
T!��c%9��B�uc��]0cM��i���Y6�<?M�q9���|���V��/�� P �s	L�iD��q3�c>�~<~�䫛��X�����j�u���/��/����6;+w@���S��*»�4>ۅQ�P����,�WK[E��v���G�!!B�V@�3 {�=��
ȫ�����c7���`�v�;��H�G+��k���r�`�xj�Y����B[�&ֲ�!ĥi0�ԧq	|p�~�k"tB�ަ���M`��W7�(�z�"��Rcl�����Y��p�𝪘'(�aQ��F�ԫ=�S�=�ʢF1��A�i b6�<��L
^������ܦ���Ǿ��rc�,��i O�Oc 
�+g}�?�y6�
��o?�fA��� q�å֟�o�N�,�#��ǳx�<?C}��{a�2 ������p�<N��*�H.�&[�&;.Q@����
-
-d��}\N@"*�"�
�[�`!aw�ܹbٌ�P_F�ʯHַ[=]���8YiE����=�]�Ȋ'�X����U��?_�L(^?�;B5�F�&g���E�����$OG����;{���h�:��j̡���u�S��|#⎒η*�N�}�5�)w��D/���J� apV��K��#�k��xgz_�Uޡh�S�،[�MY-\�ӫ�fܡ�x\���ܙS�����#oEP��&�U��Z/�I`�8��N?$ׂ̼���'�u���5t�~1���H��H������y	zw:���϶ڏ�_�� d�f3���o(;�Y~�-�8e��{Q����&6����4;�7��QۉP�o��Y���=�R7�|=����Rׄ^�$΋��x
c�V�%
i3����͚X͚����T5�L�5�P�m�
�6~��3N�"l�yM��|���ɏ�<{�����S��ȡ�
�y��v.�)�`ت�G�c�Nߑ$+��w���F����?�����o��#=�1h����
�f��3~u�6I>D{���u�Sp
�)g� AG��$ ;Z�kE����M������{�״�����ɡ�
 o��vk�ņگ|������^����Ϟ�|d�?I�h��i�&�z��_��53چ���ɬ6u0���D�a\0��m ���� ���)6uDǷ]��V��9⒇q��JM��>C��3�ʹ� 	� �7' c$�*v% 88�����I�4��&t� �ē�{�?8%C,��V���YSRfy���]�`�˙�E[Mk�\'�j�N�����KQ �?CΈڮ�F����&��{@a"��-�>�G��� 1�X��F�B\by��*g��9˓��Q�A|���d'�����L�b��w5а����f�2f����O ?(�������6����ȫ��@�~��چP/��r��^�J��M�Ɣ�`B����!7����� b	=kO�R����"j�ż���W�OӼ�*-w�\Nϙ�wN(���p1J��Q:m6� ⠧�XrCj�� w��e�:-$y�Qtn���|gBbË�M�_��EM6A 1@M|��+bzU"�����
�]�\_��S��'y6����j6m���)s���sP�y95Ic���lF2�+��������U�+�t�U�ȵ\4�T����v`�����*W�d}��+�X�(��:j�D�mώQ���NJ��y>6�v�b+J���5ͪ��CW1:ԠY��BgC!�S��k����aCjjv#�V�������s��M4�0��l�����0-���^ڔv�!I"�x�^&�}My�
��7�hc}}]V�!��ε��I�R_Օu��LgeQ�~
=�;���B}�2�b�2�܉�g���L��c<�����U_�'Y�P�P(B�����$cQ����ǎ �F��$TMAJz�ܕ�W��l�6���cT U��:E�"���E�=9�5	ӂ�M�����J�PY5��)�N����% ������a'��ͯ��4o"�
�p�
�����.\j"�E1���6�gڂ �p���r�j�۲��!�F�TK���9�k���ɸ��
2�#�p���,|�|F �Ȓ�q����M2�tвqW_���>\?���@}�a��
? !�p�p�������IΙ��h*�J�����9�#��W�p�@�����Cbg���6
��G>���S��4%B��
�Q�]�������2 ���G��^���OcD{�_�2���۝M&@�H*�e(3�"12#ݰ)2|��o�_tW�����2�5��k������7���<�J��q�(��BZ�dM�d�'����DU�G�2��̑/��%�&��Od���*`Y�(���
��l0�U�a��j�Fa>��s���p-"�H�����B�ǄA�j��ď!�A'zvN���<TG��D�x2���� !�c
b�yM��	���G����N1Ȋ^B�����SZ-��sʈ	����8���(��#/�p�v[�� �����Z��*J��6�V|�!ɹl��%���~ȿ �8(&8W�S����c�Bf�j��p��z�H�bHY�c����t��l-�V\���q�U	.��	ގ��ڰ�Fꅛ	1o�Kz�9Q�l7{��{�SD߹���~�CnD�"ۖI�|G�MVS�JV0_�C����hʝ;,U�}cY'�/-�Z���k�������?�}WN�N1���
])WVT� w|�O��i��xR$����r����d������
Ë�������HNp�1��g�O^'���I�B�A0�YS���B�?ǌO�nWçSnBP�8�g�r��o�:<�>�~��d���9RF��������Wz=y./ܓa5�H: �����R3;��I'H
T_:�^LV���H@��?���q�S�ˁZ*V��qH���3st��g��աV�O�l�j�8��3;��j��M),�hU+����ſ��N�)sF[�G��t�/A��U�["Y+��J�X����:NU�G��h����},2`��퓿8jGg��[5��Ξ$SFB#�F.�j����3��>���*���%�U��Dĭ��S�8k��^�P�:mDz�BHQF����7�.kX-u�eMaBLo[���To�j�?��ت�D=e&L��y�2
tO�����i����O�����z2o�<��C\2�e�ӗ_`��!D�gǯL/�������G�	�5�GG8֤8��a��H�G�+svt$n�s�F�|\�v�W��6~�&�=Z�`کɽCL�q�I�h���d���ъ��<�1�@���
~��!�E]$�b�ݡu���Fc�����jm��aPϙ%Hrz�`h"���)��+zd�gQ{˴�Nꝩw�C�j`L�����������І\#��7�Eyg����i���-���tGy���z����	_lg␓�8���:��Թ�W�q�w"�[�!(�"C%��c��yv�M������ɒK�[$�?~�L�27�r���������1^Q�DǢ3��
�'=A�'���d��plU5�Ra�Wo���+���.'�i���gM1�-9���8�����*���%ڍGw�k�� �V�.:Q���%Er'}`CV�76�qT[[�^*<��耯�	�kG����|��'p4*(mAڇu�XG9K�,o\�R�~?ɞ�j{j�m��d�N�ta@L�6^y�&:�t/^�	a+T�+���BbG�{-~��c�z��W����kO}���o��������]n5K�W����.v��ub*�n��iNP����q�߄+���ľ��o��2��	.no��L��xO�iS�#����q�W�a:��Z�~%UگpHP�OC�f`)D L��f��p�AߣkLCZ��%�+`}��vdRe��r�┌5z�:hܚ�OKl����7��U�I#�]v̭�vTǞ���o���:5{��ujn�jn֩��|�~Ё3z6jx��:*(O����x 
}�[�e5�Nk�o����(��?~����������8��6��kz#��Ʊ]�oӛ��7Mo�8�bM[mk+�j��߶���g�Mc�/Ⱥt�i�3���=�	��Fc�^���o��aGA�y_o�ah�,�z���(bD���O�$�)���v��Zm����v�Z��
� z���X�*�k�DN{N��@ã�Z�F�e&ڕL���m�5���E����VzF+=�J�F+Z+F+����lj�l�l�V6=��3]�;,[n MfӭT\h�
3M���CkBl	���l��|��0�+�ߩB|�e�[��|j�ӻ�$��:��,#������;1�!]1�	il���l�r�]�8|�<��2�0���X4K,"&�S�����'�H&i�^�Ȕ�ԝ���S:���H;ޠ�z����U>K��'0��y3��!/���u&��c{U�����oW՞�PLT��t^�r�?�#6�S��A���I$Dy��*�kw<����v���/5�H�[g7j�j���I����Ԧ0԰VԹ�tu���\�|��@���>a���Ċ� �u�HX��Q*-J�	��z¼ut�x��{�ޜ���Nc��<(>=�ǆ�cS���}Ak)Q����̡�jUwW���w�ɔ�hA�I�@=����ɝYF_,^H�a�[z1L��11� uC!�&ŦP��`-��v����a�!����!?>Վ��w�́:��m"#x%;b�
����(�՝{*h0'���B�;�t�鵁U��o�yr�6YeO��Tfc:d��I���i�Aqg�B��n�a��&Bk�G�3�Bh�c=��]5OF,��L=i�D���	���kgw6s?C}�;Ϯ���,� ^��(�f@E{t�Y��fS�(����{��ތ��#���<�dژ�:���k,о�a���������� �D����BC:˦�6vD�s6�ML�������3�f�n_��?��T2:�����Bl��ݽO#;����r���ߛ�7��m������S::Т�=�$�}��@�%������͎׆]k(n�f T�¼�|R0��8,����
p�s6�#t�ιr�UdiL��/0��h4Z�h�`R]�Q�]s�|����,�Eg�?D'6�r��6�"Y��ԍ!�1��6��'����|e�/�1�kߦ|�z�F��t?
���m
$_4ɴ/�c���ܮ�١7����Mk#z�A����F�ȕ��Y�\,摸��s2��-��l�.r���H|v0���aN���W�i|�oϒ�4�֐�rf]|[ Ŵ�1�̋8 o���#�G�_��R�=��ϲ�~�:���������\vEŮ>q~���5Vǟ��v��pD�`��WqY����9�sb�n:�kIr�K7����(��W�dt\m��|�nXٟ��逝Խ��4G�Y?�f9�A��n�X=]��Ű �����u�!=>�`��X�3j &fHfb��#��"�:�dƋ1,d�@���+B1k�s�},���Fׄ�#<��K�
�j[��aW�D�⯦a�a�Mi��J�O���8��خ*6�M�/q�oQ@�Ζ�=�1�x�x�˃������vm��x����� ���}�L��O�={���3k�Եv#p#~��*��H��^*G��/C�7
��	�HX��ƅZ�#$R�C�w]G�_z�ċA$��2(���j$�>��ͼ��M�� a����L�8�0^�j�
���b���pI����.�yڅ�M>���<wE�1�8j��(h��9I�F��[�R��}��Ɔ�d/̘sf�2ɯ7涮g�h������$XY�-�B	
���A%��ܰ:��+yx+^�r
�?j���E��b��� ɉu��FE��%��x�F��{�.�+6�C~�u8;{��#����d��}v׌�OW�0�pO������B:�����JEM����,i>�Ǘ�B��M��S8P��"z�D���p@ћZ�n�"喻��95P���l<��U� �}�n͠T;j0�KNd�����ǮJ�����|Y�v��\���d
��n��ac�m��R&����~�e�ƪt�$Rp��)�ڎ��cO��K�i
�0:��>��O��>���p��
_I��������}��(�pܐ���F�*�|��
.NO��5�I�l�9]��!�Ha=��vQS��/�I<r9���>+ԅ� /\��sC]�\�����������:H�b��`$��/��q��lz�(�K���,�.OmS�9�E�YI"�[���qiV ��cpA�w?D$���d��4NgERxb�t.��#���jFu8��Y4�5�l
�~Vc���sW�F��ݲ��`"�jM��H���,&�x��ze�|!����vшn�ڼ�̵�z<Hd:f��ϳx �����8Į��_�q���g`$%��=�u$��,���Y[3����7_P�4~g�Oܥ2U��p7���ht���`6;���= Ǜ��-l�x�8|N�>˹p؃�i���۵p�� �^���:��(Ɋ�eD�z�]���oXI����
�Dy��H�%����T��I����lJ3�l -�l�Qz�cQ?Jj��x� ��Y�SغW�CTn;Lvi{$��^�DS�лG+EI��՟���:v���C#��AE=��ID��s��v$3yx�@i�y`w�zG����R�Ѻ�)��k�V���ȿh_��_׌��e� �|�&����d�D����]��L1:$�sgkq���~W٭����h�<���K�>Q�$)�d
/�Dpm'�#�rnC�e��3�G��W�
��؊;�~xh~ހ��iY��/n9o+D�C	���z�PC[����J)X[F-g"Ge�G}=�'{5��6�ғ�Ew�qyp���4�'�v3�X��D���QU�,c��Ee���|��Kn�O ��)�Nt��b�A.g-��5�J�������l��c���]P��O4���8�Z�t�Q��]�3�μ_E�e��z냐oaU�fW��򎹧ޓ�9ϋ�/�0���>ڵ�ڬéQ>��](NOXg̇?������g���
��g���`:ܛot��Ƭ��a��T�bx��;���Tk�0C[O�G�t��s�?Ӱ�>�E�Y��y�JQ�t�i6y�g�������w�j��|4��D�[<��
�A7`���SI���� @�{�V��D��z�I�%M6
bY��{8iz���Ħ��U�|T�8Xk[��r
-
"�͢�t��Ӂ�pUhǸ�
�"��.ڪ�/�lH߶:V�Z�s�ì2����Pvv��Ǿ
���򬽍Z��%���C?��h�0�fo7;�?�$j
����n�"s�f�9��u�Y�i�U}�^b�t���X�YA���r�`=4��8	ۉ����¡��8��gb�������-w���s-�9Zث�������b���S�tW���ø�`y��Gda;	l�����l�N�<�ϙ�Q�yV�?� �L���������H�yo�fAe�-���:4����3��}�oQz������q r�/O�+m�ᙴb}��CfTzM�
�I��Z��hoNR��T����j������A&��<�U�-q���X&���V�1O���WM>��{S��8n���Wа��=�<[\Ǉ횆z����!`�܉eJ�1=Nm�x���A��eM��ʣ D+�t�1t5^A���w�z�J��4�^D�gc�
���~�h�� ���֝ �>�p >���N�w-έ?ܺ���=��-ؚ0/��X�
�q�4���|�ћ���7j�x�ݠ鮺��T�����l'x�ڦ)�M乬Cm׶�����b��-zB���LX&����	�
Z�� �UvG�A��xtQf�K�O4Lc��:�R��A��,��7N!t�~<,ZY�0T+�A����EevƲb�oV�f�)���U���݇�$D�o#�6�3+����3c�r�-,�����T)�ן>��Os�,ºt���}�Dܬ�W��9�@IU��� ��*?��+�õ��;�]�\뾥����QZ\�f�[���e��:·�h4�ҁW�ݴc%2o����*���,(B��=�'XjB��2��<-�[���YB���r�x��	6�`9l����ɇJ���:���<f	{*qA��Ʃ->J��
����I��?���{d���P��j���~��0�ԟ�a8�m���É�n�s)��9���9G]��y6F��_��R�sq�	����i뽑���;�d�}^<��y9(���4�~n5}��R�M��۸s��RuμT�3
�$r�x55^f�	{'�g���U�&)�gvU�S=P��秂�H���~u�|����F��M��PS���ܱ��o,5\G)^�^\�1c@�1i[���*��
�9\���0������2��g.����������=R%�]�4��]�R������n��\d�+����HF����(Xġ�}v1�̬���-5蔶_"�YǇ��*���V�w)Щ%4��(>����@Qߕ��,�`��w;�?��3�������K��{��]w8�\,}:�奄�*�~k��q\�?�vg
<�m/|��>�z.Q���
1��BB�쫖ӥ����S���V��C첄pa-��v{���cY�p=_���g�B�*ȣ5e�
ut��,ǟ�
0�*4z����=ɿ�A���t�_��jX[�=E��alo��!
\�ZZ6�/�x��>lo���W*�gt��n���=�	/͈�'��N��t�E#^i�:^�p���K8)���p��f~�lβ������^��o���W��ʉ�~t��.�f	�ǓϹz"΁L�әfO�Oɠ�E٩�_����ZsU_�$Cfr�И?�b�i+��빖I[ߛ��M���_���.���c�x����H��/z�bP*ЋW�*P�\;��ˏ3>�m_�
��6���"ڣr�)�����$��.�x2L�n��j��7�Te�(=@z�t�	���Q������@�!�Q/b%|�"���RxԻ{7.�C�
H�Lr�7�׌��Q�Р�������G2���S�YrW�������s-�����-V��^wݏ�h�8����|����
���-������L�Dx4إ'�u���Ϊ�����ۻ�ڕO���v�����Á�7�-�ǰv�L�o��� ��:�q_8J�8(�.��!;�&^_��=�ۃ
��+�����\-���b�Ӓ�/a9:�R���t�Do�I�!L�=S����5�_�\ ��1��qt���|��1���;Raջ�:n�tB��e0�9;���B�B�77»x]0�y<���<:����
e5�][X{��6�Ax`�w�:�O���
 h[���b����s� �=��S�C�J}s���,���3��O��O6m�u1�s�ȵ�
��W��!��wHm��fT�%��g�/�d��_���S;����K��o�|�̦���e�og(�
=����(�4�+_d�m�޷�*4�m>s�(x�Rw��8��=�o�Q<��7�Y/^��������8��=-�;-38Hh�U�;Ł��,���σgI�hx���K[g��w�	����D`��E��(Y|lc�u/	Ȱ�En�I��>��0� ���NGG��BX�7��b����b���=Wjk��I�Z=�/���TO��xiJ�e���b�6�a��w��V[�+BGW�Z�� 2���Ń��� ��B]���������I�e�ϰ���m��
�|��l+GC�ʡf@[DG̓20�7A���lP�mcg���Ԝ�P�E�ɸ9D�R�2�����-��!n��KIe�r�*�� ��y4Lr�l�h,�A2�]
�/X	6���MRL�� ;�S̺{E��V #���o1�_^�<�J��^���޼���>
��>��E��k��
|����zoe#�X��pMӾ�eʋ����������`�G���SZ�Tq�K���*C8y�y���C�rx����X��-���_%tC/�p��{�o��P:o����L3d���{�Sh���M4D.�t|v�NBC�� �$��
�N��=+`����S����o�Z��O�č��6B����io���z��[��;��F�%74dy���2gS�YP�l�p1�t����VE9�2�kF��P�j�YӍ��H�}bv��lk{�'r������!h��Ay�-��zA�E�H�q����! ����T�K�P��>�,Z׋l�4�;�y
�}��U1����!J�E�'
�h���Usi�(�$$�v}��ֺvO��^��_֔�LE�Q�' b(̋<ȳ	��sL0e���_"�P�)}�v �̈́����íV��6Y�K�<�\0���wJ&$�
�&$]=dt� ~m ~q����zq{�1������+�C��')Y��)j<���;K�T�
-�up$���nXlo�u����|��Cc<`q<G ֜� �\X_k��s�#����XL),ŋN��TCF��k�&���7C�,|@��o��o��t�-��ʲ��DHA�$":��%f�a���CYT��W�2xڷd���님1�eJ���4��#]"��lh<�;�@�� ����}n�c�Q�� .�������j�"���e
Kt�WY�5aH�%����I2���L�d�3��B p�2��B"Z�gv�iB5r�.�T�c
�R1D�^�R*-���7�)g4�'Jg�{_>��1�C#�`�'U~���,�}��j��rI������V�Y�%i#{J�������<]�@��*bl�$��gc�?��������e�	.�ס,�SV|�mdK����q�Rk=��u&o4��Y��dlη6���駱}���/]Jl��-�tw�O�&���d�rj�?�o����xqx���㟾����'��^t
EV���t��1��<I'-��׋�T���9��-�u�������l�\���*���x46x4��I-[i�ۓ�?��&��0v��l�
F͓�G����"=̧b������:X��$M�+_��NL�嫗����.�+�<��N������N~<zy������'D50���l���}��Ⱦ��2��!.�ŧ�1^�0�$��%�<	&�I�'���x��1���`Gq_��4�)�%���J�S��<~��ș�+l�3�7LܤQ�Eg�������%�qs(�QGo����l4���x��`ܬ�E1�+��<;���?����_'ɇ�����"�V�^X;�.L�1�����/F� �+M���!�'�߽��рCm��,ǃ+U���j�Mr�a��
�8S[��d{!d}��YtL\a*�:�� /F�+Iߏ�|:��V_x����g�i���bnY�M��QvNo~��h�r!V�|׳"T�<�P��3�/?�u�b�tB�i-�Vt��ȦlC��`V&�(N�w>1���U��6�(Y�1ǹHy�_
R���E/�P�[�����ȏ�����̇�o@8;�b}��a�*�$�eޱ��4�]��l�=�%��nv#cj�b�PӞ�nԄ�.��#9�F:h쓼	�s	�y�1K�-P7�@S��Ҋk� �ђ���]�a�%ǳ������t�hE������Z��4��6��,�@���s���]�bh#�!Дq�j��|��
�=���'H� @�!��;@�Y� H��I$��*��Y2K��k�[���[�w�  �C[�]�v1,��â�V�����y�L�#=�z������~��p�q,�B�c9#�����w�M�N6��FC�7
�;�hA���?"��h�`_M��8^$�YS��(���82��)�ɚ"��H+�R���9pEǯ����Rkw�a�%�����,��O���4��%�, W�BTF��.~tו�ˁ�`a��b�#����Hz+B�3q]���oZ�f��%Y�?���*
�Ѡ+
@�ƛi� �^yxt-��F�K�ӂM�N7'�w���zq
��2c�~=�RBqi}�WR)�_�g����~v�������(�

������B�����w�"͜�0����vIxM�ïU5��ZvH��{Ry?�ڤ���f�gW�0G��苎"��S���"��o�=Ax�W1~<1;O"E,�n|e�<1/-���*�_�������hpSD4��^t7ZYa�s���z�=")��q>w}8KA4Y٫+q���bo&�`k���e�h���i�{
j��Jd���8�	��`M��/�	�F")O�^Qc��{?S٥�k��iO�.mN��H���A�00N>e�YN}�سH�=�&�a�kK,��,���`y��mn�4{�-TfBa���M��?2��윑3U]3K�wb��:/�x�����Դx�i>�#{+4�ɋ���q���c��P�e�׉���4M2��/���h�]��k/�3g�G�r�)0{{�k�
J�@�j�ߕ��c�{y6�ə��@�%=���;����.3��e 6�_a(�Β�Z8U`:6�����0
��j��B���
���[iə�ݫ��7a���xR�i���?�avHʇo�v��H#�����G0�fs�����d�Po�P��(b��?Q;�������h���c�B��anQ5��dV��U�F���Vj�f��g���!V(���j�o:�K��e�^Q�h
�乳.0��������'���',�s��؂N�T�Zj���HSh'����t�锝7hl�d���� ���]��Y��U� �DN�G�A}�bb\���l��3�n%��b�O���p>).(��$9����%�Z��I�h�9��BJ%ఠqq=��nٍ����\ѣ�0]m�B.x�$9�g��H�FDE|
"�jPg&��׆%�O���W1��0�55Aۗ�����r++aӬ ��V��@�`�����r2Q�5"�iC��{� lD�vCY����ݧ[
V\�?l�<��f8nTVB`��L>�w��x	b<Z�(8���k����Kv��d<`ᐴ�%_ϭ=�g�h��p̓&�����4��.^�n��>V5�0\��7�!��H�k�o 'B�֣�%�������&</X����pa>'9-�js5<Q��j�N	8WH�
V���/�����E��!(���?P�f�F����1�����a��s�m��Tfk�����=�dY��噓�O4o�h�j�C��?��{ov�Þ��w�_#̒6x�2�v�Kc�YvZ�4K ��i���׆]ϐ��]��?   �� ��x���BI�(��Hk�4b�$$q1ƀ���6�=3�ۧ]�
��%�\U204�����/�y��kU���e�����l��U�Mf��fc�D�|:��ɀ��h�G��z<���n6�|6��$����`:�_?N�E8M�?	z�xP�=����+�̛�>!�g{e|1�H���7�w*����סc�sB&�U��~5����ΛzC������$��a�
 ҏ�ď�F����Q������"?�����v�D!���`Іx�c����� ��lL������������-��6��0�0S�a�E{��L�����p\\�����&U�!�������|�����X��/�x�l�V��TZ����I�sN��A���Mu���s� MIw ����x���^� �p:O�U/�q��:���̟V�hn+w{k<����:��6��ްL�0�o ��/~��={&��rT�I����$y��i��4�uo<&c��@�I\��S T���8��?���e��C&��˺7OB�@������jB�Q0�ToV�Q��d�d<����ܴ6n��.�N9���U�Y&[MlV��q26�q��1}0��n�(I2���
9��sdb�N/�ސr�d�	���Z��^��'ČJWl:�EN�^�vˑح������/�!#�	�g�����
�����μ�_��oJ��f�?�ޯ��{������vϺ�g�?W2�n��i���0���Ҥ<��u�`�ژ��������?�~D2٢ߣ��[���'�>��Ś![�GmC,^Ō,)IJ�r-OK��fT@آ
a��;4�`��2��
��ǎ�m:�}ړ�
!_������t�̥�`v#o:�ZU��;�c�_��
��A�Y�����r�\���'��W)�I�(:w��{oE8Mm�gF�~�����%{E�y2�~}N}�Q�ǆt@{8���P\��A{��?��<�ᆪp>#����
�fo��}�FZ5Ү��Y���٨�g5�Y#���������ěU�8?&� ~�nSZ�ݽ����T���%��B�#�_���x���u�AW�㷰X�ά�a)�/�a�A��[���m2J?W��X����7����@��o$ζ�C��z�+����X��E��5�\�`���� IJk;7��  �~
�(|g�t��"u?���`]5p8?J���P��`�
r2����ĳ�rDqҨX�!���dM]��㕵3&�� g�U�N�/A���P�f|}��8wB�_�d'��_c\���Ҧ`)>ǉ?Z�eX��:��ߛ��~}�����Y�ի�-LL�����O�Q�ի�`q+��M	�z�R����_]�x	�7t�΢WR�h"?W����eF�WJ���*�\��t�s�ԑ.��t� �Q�d�ؿH25��C;�`0���!?4����p<��%������������$y�����7fb�N5^
|]W�[MZE(��0�+�V�l�М!;3uտD�u��h3�,i �:9ҖĎ	���I1��m\Cɡ1��d�0N)
�7
&H��, )�v�5���"���͔g.6�3W�n0�Gk�]hbW��7��ڛ Vv9[Uw-�����՚]} �-l�Ps�\=�·�]@`1�w&d ��`od�#�xH��T
?�W��퇔�>����3�����E��,x|��\��O�c������G�G��Q�۪~-)[��w/���y���[��A, �E��O�g��fSyaq.�[���� ���p�|�2�����9�a�$xc�i�S��A�h��|c1=,hh�[|��P�%�CG(�!,�<�v�������"��}����Jb�,�%i<��ٻ�
ѯ(B{����u��AvR�������df���C�fNtaYI+[������C�H��-OJ�5N�qO�(L�p��h<K�����eI^��z��씐9B���%��t��C�O��ݣ7�o�G���Q*.,�Q���)��<���ÿ�L�5�/��C�A؅%#�n���7�^:"�{��^)���ID�G��O���Jv,
r'�#O�x��k����ڃL�nw�<SZ��}�Kg���"����
L�<,�����o.��IH=w�}m��������նH��̜n�b-��$EMir[�ԓR�b�-��SJ]Y��@���&h� &*�]�bj$ ���k��"+�ڢ�,�L��N�N*����&3!)��j����{�9��}
�D�^�Y��5Z�taF-����F�TX�-�*�[襌
��]!�l����!�x��l\�塞�z	�.���|�h�q՗�d����^8��s�����xz�rf���dg�&F��8�u��h/ɵ6ZPc�XaI2".ݦ�+?v�\�g(�
4͡��C�PBO��z��z���I�_�{YLu��`s5���ݼՙÊ]�X�Ub]�.�ق�f��F���/��ی�pR��Q8��ȱxlΛ�ƺ}�c����~�Ϛ�0m��r��'�ܳmf썊<}�Д]���H�x�ui��U}Mr�.��X����b����,��C�;.��̬)F�p�ۡ�ׁ�ս��1���DIL:3 �i��x�jd/� �q0gz�Ms0��_��̀,�X�#�Fl�F�f!�������x<��XG���ϖ��r
��E�Q�dߏ��'f��(��TxaH����C��x��F���d�Gq:��BM:<+��y�:���{Zv����n,��Ø�}�8�k�	+�T�����.�?v:/��{�(<�Cҝx�ë?.�/�.�ӎ�?1ӗ�m6��1�s ������$����m�S{?ϩ]�:���`�:��>�w���>l���ػ>��E=RM�X΃�plv�xV׵�i=˽��f0��s���S�]SJ���`]�.v:�˿�&����R=�=���7�D/�MC��-������9��v$�V�e[����.��`3
���'�<�T���v�,�eC�l�c���`�+�PZͼ�ź�D���;)�n�S�� ���sc�Y�r���M���\�r�]�sۚ�f˸̖�{��xj
�p���;�~qL�s��Ou��C�\�Q���'��m�{��v�$���ؿk˰G���������I\��Hx�'݈%�U$�w�b(���U����j�;˭t}��֛!mu��S�B���K�{'�g:�15��e?]<.Ƕ�C��ʶ�2�.��h���F#ݢ��H��FE	*|Un5D�so4�p��'ո-�����H%~�Fq2��鮻D�� ��8��0@ *�Z.�	������|�����/
�+��c����@�J'n�Q�G��~��=��<���oQ������:�SR(6sB��O.V`�5d �$��6��	�=h|�S(��������b���3�����y�5P�(���=$����<W�gf���>�x���w3v�\��+s�8��M�(\W�gɶA�a���<!3�8(�������_���/��i��#�2G;^�����zke��3͞7��f8�7����i��s�����*��v��J��������hY�Jy\9#��X���I�k'�簇��+J���R��Tt:i�_R:���X���*��^��'yY5�v$�40�������mޥ@�)t#.���W�$�"�a�r*!y��.[��4�6�V^}��sX �p��'��g����B+�MC�l�68��~����h�%��-�vxy�w��H{=��,�֛��ʵG�b�jZu�F�~n��ϟ����O�d��q�,��]'!��sk���
cOT;�N����<�7@�+���~�����u�����?"U?�yl.[
�~J�Q��=�语J
�8���~_5`��Sp�H���� ����-�����"���iݟ�Q�W�%�p�b�q������
3��b;�ڷi��z���Vl&����HhbGWR�AStУ!�f5��`����-߷P<7|���a�ŀ��tH'�uM~�>��������!}~?'C�i��|h7��"):�cpҶ䄦Ô���nVa%������`�s� C=�/�g���#�Q�K�?A�`D��K��ō�x1���?߷gc)a����۰� �:&ȩ���w�}j?�����|�T-��W-�4�p��}�{�������3<>����+bp��Ȭ5���X�����%�n�u
J�{��h4����*��.��1�S�}��h���t��(nZ/`�3�C#J�[�=�7E|��%<���Eoэ�pE�8;0�,�L�؀#�;�t�5:b��
��+��'on�ȵ���5]��̑p�q���|���:�T�Op�h�X#�5�t�E$��h-�cYY�]�ny˱�!Ȋ��)vM��[Fe#�Z�\���ݚ�[iX\~4��Gs%ܷQ�����q�D����z�͢���t�s9����84 ��<����Kk��;Xn���xF�!��ǜ�Am�yQ��@9>�]O(Y��%U]�T��c�����	���Do��q��eu6.:��&� �,�
����}�{���V�o I�~X�[l�uB'8���*nZ�3ۮ�I����B=��]�͇>u�c�2}<��WB�1��@��9� �~���nu����h)V�Og��/v
�	�E�(#�=�|�}ؔ���f�\��^�(��r���&�|3+��&���1��.�)Z�o�8��y�Ӧmx��뀞�����������y����|D�eD���)B7�5A�E��~��T���/���ֲ�첬�+vIZ�. a�6WV1H�&�=qw	��rx�G�^08��u���9��%���vՅ�t�"�G��^�J��ܝ�[��u�E�a(u�V��s��=���j��t�w��A�,�Ձ�Jn�W.9�����)���
Ä/5��Q�.�eI��b�`���~�
4���f���<w��㧀3<ȭ�X&7
&e���gB�����$</�P�W�7�
YI�gx�kyVn�du�k02�w�
C��u
I9T��"�j��s=��PpE?����瑮������s󶜛4y��砫�;�62���"�!U��&{��Ԫ �;�ޗ`���O�Η^M�"�7���<gƼ�f9
�-�Q��F
�9���t;�d�@�+���=C���L����n��Gf��Nw���.���][�J�-��<�[��(t��8��&Bj��}��`�3����Wy��0���P)�y�lR*���S�}�Ԅb%�h�i4�6!1]r���%|�%A�:p�|�`����)�Ög掜�q��ތ�1C���K^��|��?�z
wt�Ff��k��K�[�V�(-�N-��� ��a`�4v��<L�{�;�c�5��Ä�q4~��1�f2�m>W��EEͣ,_$[J����:W��I�v*�l�.��%�g��a֜�pW��Ӷ0B�����i���/���3���;7���D�s�s���(��#P��ˢ�T�H߂���H�X�J�Hn�mС��~y�ֲ�j��O�adӁ�NO��YFr"�,��&�1�����;Z��5��8!q~����	ɏ�'$?NH��y�wqB�o��.v!x=�h��r�V]N�
"���Drp]&H~� �[�`��i�Eˑ��(�M�vj��W�Ol�J@�{�5ʺ%
!�M/n�Q4�_c��1�N6z�^�X���x�o5��C���]L~
' �P�����������{ҟ�:''���� (|��ı铔ă�
:��8�1'}�Dpv��;����A28�fx�0��3%�뻠n��u:(��}0���ME:���i���h;{[C��(���e�����o�g���D:��K�j��6af��
��7�?,gNh�^LG�lyE���?)����nJ��-��e��@����DT%�l`�ĽqsP�HQ���cr1��-�������h,p?I?����I
�Z#&U}h�a�TK�V\(׍�d&.��0�r���\Ze�
��~QԹ��ŵ���
�Rn��t�ɟ�\�[t�"��2ü�Kq��K�ޡ�d���*� C�,ҐI�J�a$VG$a#N�0�H!V֕؄�%���o+)����3B�����Ϥ�k;,E��z����1��=ȳ�
��v�Y�e�7�Ei�\m�q,��v�Cs%���B�#�i+�8��?�&�k��	�#��)������AZ"�Șvm��V[�mԞ�6k�k�f�ժ	��)҄r4M�����n�[��ӷ|�0u��u$1YA'�A�m�ʹ�L�J�f�q��`-w�I0�9v�7}lV9�eF1�;���WWx�Ӈ�>�x̳��['�w��&�B��X;�1e�����8��*���V�l���8e�%�#�8��rE[�-�����/�'y�]�p��\���>���'&�1@RK��8��7�V���N����ʣg��9|���w��9õݪ�۹3�P|�w�+�������+?�'�
��+(�,�x�k;&�����4�4��}��Xf
%B��F�r�X=gVnR�}�n����wL�'~��A���������,����^�!��m����N�q�������"�,����`3�kIrM͸�K�y�4*�$�u[�J���TKU�;:����2>9~qM~!
;��P�C�tCa���E	��U��ǒӨMFҘ)�=�Mn�>��c_�����,�߿��hp�<S��{Dw'��g��gS:o�E��/V��T���K�wsd�>>��r���s��|�%rm�)���?Yl�.�Y�ռ�jdA2��7/�ƍr���v�TH����i�R;B�l�\<��s�$O�1�u�Ow�-R�V����{VaU]���tu��|�R�/�k7�RQvb�԰��H3\�$����{Q&1�S�Fg^��IQ�O�d�ۼ�1�O��XyX&�<
(�T��{	���cmqA9�Q/��;l>�Lb��oHL����!@�9?�TW�0ߥ�]Mf�����+���Ħ�,l��Qx�߭$%�1���WZ�rI�u�׺�o����� 5��ͤ�%�K�
8�5z�Ev�ֆ�2ْ�؈i�Z.Ψ � ս,��#���h��L��5!�r�pm0e���?��
�fx3+���O2�A�#òÛ���l�r{T"�m�p���62�:z��e��i��cqՓ�>��k�Ye�:#԰�W�h��
�#1���K��[;Ix�3
-��6@� P�7���nڡXˉO�,J�[.]�%��[���E�v�*���j�*k��Z�*��z�*��F�*�D�g��l�*���<U�����Ϣ�,_)#�������|ŔZ����cq���2Itƹ����"�z?8diɝ��39�׹��5bq��B��p2��N�{��.y�J�#�D3.�2��j��Fq�<����4�n]D����$��J�2��G������óY�;��ӏZs��u����O�N)��qŒ���-Ϛ_F�L+�&'�M���������L����(ԓ`Z����l��+�����Q�?]�$��Ԏ�*�d� �MPŊ%��v),˹)TiӖ��BM0���Fd+��6�6�[��+�豻b����;RW:��_�S�f��#�� I�v (�c�K� C��;�F���Ne�����!��ȹK ��#��t͎�S��;�ďB9��Z	F���<Z�۽pp-���_�E9%��")����D�:��1ȑp|rG��K3��Kء`Rs��|�o.�ڐ�r]iɷ��g%ޔE^pD^<�3��7Ȓ�Nd¤{y߷�_0cf�\����
��d�͎۟k��gy]3��f�A�ᚒ�%C�����ش2��,zf�t��}��"�����yxx�;ak*Ƙ���3�����8��5X��S\р�¢�)�U�Fzt�Z��ٙW�T{�4�
��Ƅڡ.���l����U[>x��������פu'%������n:���}�n��������=@)�]ޚw�_hW��,��)m���&$;�\9�!DP�r�C7��/�y�`tQ�x7����n�<?���4��_M��K���c��Tح6!� 5F��x�����]=R�v�+�xDky.�P,�7a]�2��<�����Ƃo��uL���iu�F�G�e�u�H[ɇh�\���R����6s�R��Ù	����	v�R�$c�im����
Sܨ�Y"�=�����w�_�8}��1^��.�-�ӥ<�"Ku's��
N{|�۪v��<|��>�	b[���u��)���@y��Z&F�x*0,P\qQ�0gBU%� C��)��E�]2��R~�v�.�b�	Eݼ0:�mPz��|8 ���G���$m]�&�Y��B�u�tѱ+��c�l!H�zz�/߀����^̟��[���Q��ݍ-R��0��'�`0�ˬ[|�,,$>l��>��3�$��a��:�|��ԿO8A�KF�T}Q*��
�8�S\�+�
�� S<�]s��S+�Wx�s�q�2W|#�g�IL��%Y��t��Ϲ���g�HS�v
�DX$��n��̎P��A�.xc�tUAT���
�+)ΐ�Q{��ƨJ�ǚ�Mm�6��G�o����s��2��`L̘nh8��"�Q�	p!��){�-H�y犃2mc[m���{����9�b�h��?
���/w񶎕)�w��;�p���}�h�s"Yd�>�2�|�E�޵*\��.�c/�ʩ?	��Y��+���ȋG����*/���k3�c�}�~�{��9�5��j8�Cз��9�H�ү�n�<a����w�~=:����N���G�g��y_銬2d/�L`��g�j�����7�����_Ë/�<���!ed<E̩�9���h@�b�W|��4x!~g��i��'l��"��׾7�ʋ�;�V����Ę�ޘ�l�G�	5����h ^������"g&��ЖX�?ȰmƖ���@������:���cߛ��;v�X=+�䖅�d��~��~܏��H��J
��_mo> ��Y��J�A���cJ.Z��*+�X��Eg�h�ɳ$�BY�y������+J���*j�7�EK�ȧqU�+���f���B�"6�|��u1�����CV��m��7�� ���!fO�_x1���Y Y�J�Po{��}�L���	�1���A<b��/�?k:At�8$�A ����1���ҡ��A�}f�8}�L�`XKK٠D]���jR�c�E[͵�X.hTv���Vƹ<y�[KG��d�m��[��q�?��5�*Lew�	Q�DQ�X��8��1wLY�f��y�y�
��4�Q����≪�
[yCbJ�\����v�.����֡�`[��,o�*Fh!yT
9��t	
@7@���wEu���Ea��QKL@pw���W�Z�&Veޗ�u��UIS	���ߠ������KFP��h�2 W��KŢ���O�DD���6�&�B�U��dʀ�C۔Ȥ~�)��s�?�������vL��n$F&���i���|�~{��p?���謵[Eӽ��ȋ�8��Q�,@)wOg2-/'�b��MRk
g�c�\���	?1���­���~�᜽~�{���{��9������A�,gP����v�Z�m�;`V��*��O}�n�:_㿝��~;�g S0�8�'!�z['�x�����M�^Dy��"��&��-Ϣ`\I�s���PQ��H0������a!�w�Rk)�����J�c]SC���dA�襜	w0MB�Ƙ�Y��m��"W��=_N{^�z&,��Tp#+��[p5+ؖ
Z��炿*�_���W��o��i�S�-��gM�B�E&5�������
��Sɷ,�9F��b�-(�>����_������R���#� �L�^E_�E{��8_�M��U����u�T[a�
��xu|@��B}���8S��"|z����b�|��z1����-��ei�$�Q����
o��w�*չ��aH٩>52���T��rwz0�-r��\����c���fJ���*ʦQ�"��^�З�l��Ye^*@���ya� �CT���wM����t�q
�3���Ϧ����A��{^���R�b��,X&��. n�K�S*4�\eJ����>��%��n��K�+<��R/-DW�G���l}�����*Y��T�L�{�8�?���f�-���O�T#��0�gz;;Ö�C��8���0+g�4���a�!��wM&-ܞ��� K���@鈸��Wkb���b��e��y,k���������Q��~6�!�ݽp��b�J�pY�5��-г��>��	���e� �.���ݗ:F��g�&���B���J�F�	�N�R��
(DI��]6T���ٰ�H���~_;&��.[��EaߏaQ&�<�i8�����X��B\�|V��m
*ۖaix�p�` ��`���<UeV���`����R
���?�ۄ���������4��7�axR��К�1�4�_���k�B��k�8�O& vѦ\W>[B2N�;�3��#,6��S�	6��S䞄B�8>��Z����!�e�¿���{��8lM�>]�=�'3�x!��Z�C���7
X<9���
h��D^�:{�:�`fO��!f�h_�'@�X}��:��H~���y���u"i��xS�r>����9Y�+ �;� �E�؃�Ù7��/$�n|��B�l���<���T$�:{�X�)^,A�Rw��p
m' Tߝ�Ic��ٯ`��&�`����!�n>���wO$����h���5�T���M{"�����BU�]i&;'ݷ��Spǔ��5��X&�ws���N�HDs2���X�����LM��L�mH�$�y�
�h09~6�tys
+W��?�:LYG�PgC���-��s	0�2��0�@��	Ӂ������%q�ۣ�vˀ$��B�����n�O$^���`�`�������TK[���@�!ʓ��pSKuXD<}�!���V8�\��p���V�,\�� �s%�&�V�hJ�x��R�C�R�-ۖ)ծD	ݑE�Ů�i���Iٮ�際�*�����rFi�]�y:��uic��Y��z�wG.f��E>_���^&x��ǌ����(e�ʌrCE
��z��h�o�>�v[�@���o�/n�m6��8��2��7k��D"L�L�TX�)�/Q�FDu��0�fPO
��[�!d�:��`�m���e�Jř?`�7fb�w�h����yO,���@����T���xa_�9Z��u�=X������u]����l�ٶ �ľ��]�^�Z�2�2*|��>���4��E� �VźJ�n"Ki*��dz����%���m!�E�,� Rw�D�̫m�>��������*�d�za,i烴R#I�OZ�
��a��@�s�1֠�-'[R)�R�A�X}��1q�:n�2�b덲�I�fT���}��eM	.���k�}>XIQ��vu��b
�2�\��}�Vi�Z��Y_dCkD>l�|Ё3��҇G~!�4���+�x�Ak�~|�2-ebT�Y���P��|Au&���t�+&%��j����rB��?)�@s����7�;_����^+�Y����)$ 
�:���i��R�´��ZƙvSZL��D� �;��ձ�<*.B�K�Xb���ڏ�)����E:{�@�pT��<e�b.qy�Td�n�(C/��_S����f��隰a�y��I�Ja�9(3����
��k��:���"��5 Yrb{?�#��pR�}������:6iNTig������+�]��'.�1NZ蚷�%�����>Q�z�{����e�ʐ�, ]c�G�����6���b������]W��5r9�#�Zݣc��NE�^:��h[gSo�B<��.��*3�ĸ�YEO��
��%׶��A��Bִ<��7?�0*�2�y�� ~V)�NqU�v+�O^5k��Ŏ/��,�7��R�ȗ"��i'��e���l6�>����Q��P��o��0�V��#[��a�D,n-`]M�e?5:��n:�h^����ٺcߕ5��AҢ�C������n�>���Q�!"ux}�1�����EN@�g"h+u&A����H��5�N��5w�L�q��^�0f�坽o�H��ڀ�Z�f�YJC8H��*K����W�^C�i�ƣ�z�2��(��Ao�g^�V��/ϋ���B��R����*�Y[� �A}��v���&¬�H�}
����O�j��v_NCg�{�6�|cDo�I�7�N��*s���~�&mF�&6�WI�rB�V5`����yφI����xO]�>0+�&e�Mv�F���9�P{����x�/X-�;���RSU��$�A�5<�M��{Mn��D�mӯ���Y�ο�
LSZB��/9�^̛�ݮ�`��H2
b
�D�L�ɿb6�L�N+�D�*S0%����nz��ڲ��U�w�b��b��(۶M�x9��:�f�Eo�y��k�ʻ����	���z�LȰ*y�ϨG�ʑ &T9����e���p$�HQn�DI����T��R��!�u �M�˒j`oZ �Ml�ʐ�r*�i%|nXp	p�@p�k��&�4�)�V--�ъ_e#Ȫ����MX��ct�?|��R(F��a�k�
y���<����#x%����b� �Ɵ�S�E�������6���Dq��Ȋe*�>�Gj��.�����}6vL}-���p�6U�]��,�ZKTH--!�����ݗ��-a'G���qr=7�����l�ϒd�S�b��F����Ȯ�o������?����%�Z�w�
�,w��Ks/�)ٰX�[�?.6/���?��lv�����o"P�%�B"
��6/xN��n>ߚ�� z��Y�^�O7��-�vh���x���6�n
��t��� S�@�zzK^e)�K���Kd�)�I;W��Dl:��������zy���9U]
��S�h�g�r'�}�9���j}.RO��%�eʢ����T���N��VU_�0�e�Ӊ��vr��;>��S^H	)v*����-k�-�y��m�u�~�ܶ�,Y&F���5\��Ĥ��l�}��]�0�?�3�%�ٱ2Gܳ�]8a��]�ee��(��N�e���V�5�m&�.�6����`���}\��H�`��E���2�~�߼h��_cTw~|�94��D���@Y�8TTٵ���) ��;O;�< ޑ]K�Q4�3&Vm�5e����
VuJ�dI�6B�Xs,(T�� ��l`f!nS���c[�����p:h!�h`�:
f�A�*�]1��cЍC�ئ0���# �<a	x��P��A�h�"�#>|����1���D�2�0���y��x��6�Fg��vz�J�B��Ȁ���F�5�͌�f�O����{lԂj����5m7W{f`�|��P-�IvE��@�
�R:m�<w�OLDh��`��ʕQf76�{��[�pG�l���0�s`?�i12�l��3��$�mp��H��g]���-!oQl��Ϳ� bV0��=S���>
C��}�u[{��x�٦c�/)Q�PÂ4Tx�6���ᘼr;�I�q����vy�e���Ab?B����*��i���p�#F���M"�g�f�&��Z���"��ĆWMI0���Iw��9f$�e�5X9w�
���}q�9������������<�UVn����s tihSL���%D�N}J���l����t�`0q���m��n"�vw��薷����;?󢄚���j^9 �/<j���UTp����B��G+��-��7�_H����J���j-�)�j��K���D/�IMҙ�V]D��V��o.�@8�J��Dc$�ct���qii}��*Oo҇/dݛ�L;Sx�!�-�/¾Oz�Ї`,UR={�|�.��D�.�E`�o?_�ɪK3�
t���ϣ�|��%�E����F����%Ud�I�BVb(��)TR���
T�O��r�X��.L�j�I���}�q4��G
���/��_������{�y�}`�~��d��6�abٍ�}�O��Λ�F�oip�������?�1	�ۿ�s���ig�K~&g���Y�h���W*Ðq�4Eʲ�QשL�QR����'���L=*I���?��ӯ�
�&�%��Yۅ(��G�A��Mt���T߁n�ks�y�t-��Q��{e�Ӡx��tp���X@JYz��	B7obC�j��K�$��d�k�sp9
�:�ݺ7:�,���w@0't�5%�p֙�?nEgȈ����ģ�2�;9�;��El�	
�:�G�?�)y1�(��>�z�M1=h�4�O�C��%�I���L�F#�}��=�r�nrP}��M�C��� �s ��8�Ɠ�|���d�=y�p�Hp��.F#w���g�bf̦d9KIg]��MUq.�O�%.�*�6۞�3H�T���&m�m�B�¸#j���N[�
�i�:)_�X�we�bk�#?���U���}IYĭ?Ƣg�<b}hXsjsk��6������|O� fs@h��y�#����
=q/���H`�])����fܕ���KG�Bɣ̼�<YH� Y [��v�8��` o� ���I�PM*lİI��n7)���וp��3�Ϧ���н���~���S+��/sv���d,Z��b�N,�v��P�*�}P{����j�6��F1(t+^��U��ѫ��5�k�_22�Z�F=�2�����Zk]�����P͕���)�����{%S��_t{8�M^�6�j���k��V.�i�����a�sXʒ��q�CI�~�R��yڋg/x.�H�{�,�{9�w�B���m�.#vcz�������G��Ēnm��{�˺��i1��Ң�<����A��g�s͹,�T������֍B�9��Q^������h�:��c�`v*�6O�MM�s�P��$�J������ۙ��j��|����(�x�M 3� �d�|#�I�A-y���}o�L��)��
��qBZ�'$�������;}�'A?���sJ�w!��D�,�ӛ�d��+V� >�z,��܈��+�K�Q�c�����a-���x�&��^��59P�-�ۀ�5��>`�A��k�҂q�u�c���4�+v�S-
�o>�؊7"���8����i<4��"{+���j�k- �hD
B��K�ǐΒ�4�l�v�Y����±5B��W�Yg�)[a�j��>&�ŀ� �,�^X�G�>K��j;ͣ�a0��#m�
Hv��M�gjDJ-wA/�Ǝ1�T\�c?�!��:���^d	^i:��Y�X�oMg�z��/�$���=�]z��߯Ξ�nD]��*�b��U��˩zE4:#C�6	�j�w����DS���m���Ƿu�ix4"C�����Ҿ���̅�E����-��E/]�1@ �������\J��<�Ѹ�LC@y1%
ziz�fW�o�����s�uV���G��yf����C� t�'xbLK���}5O��R�'|r5��1[T�/���I	���r�XImV�>Z�ͧY�+���(��ڬ�D'w��3	X��@?��[t9��J�3��i�ޝ6�I�	b�ۡ�
 �:��_\j�Ӡ��f� �KaD�rtk�Q<�a���e=l;��«�«f�5��`����To��&�nS"��V	��@T�|��C��Jj�./�5	�;��=���B�4��a$���j����$ZEI���W�w�,��d�R��C�� ��|�k��w�m�`�ܸc�s�o[.s�K�Q��6��~��c��M~�C���e���u�A'�(�|5�C�Hc��MH �$
��Q��������ydmGk,j���Q�7b��o��&ŭ��"q5WSq�5��� VL���Q���E����xL����2���
�q���|��[(,7Z�ȓ��*Ѕ$c	��7�Ebc��VA^W���o/e�u��q��qc�u��L/=��^��,.��z�R�ыVv�e��):��-��4�t�.>^�[5R����˩3���)��pJ��q�'��${Iz�O
:�h1�����:k�:��:k�Xg?�ٷ_gj�a�:[�n��*�D[g�?�ُu����BZT��Eko��Y{k��/X{�9 ��Ƶ���j|�՘~]Y!4`6s�#�>���ayJQpȳ�EXօ����|�_�,"r_Ԡ��"_P��Q�u�p7�]f���,�o4�YӦ�ł���4#`&eu������lA��6 ��>��Bvc�����V���F,(�|a�;�b�Kh��l��W[�n:��`2�y����3�����o��ny���I�쬻O���W���
9z��ٌ�&e�	�:���u��6N}�cW|fs5�H�/�l̬�PW=��k�sk��Vsk�:j�q�a����k�~,�A8�92�`�1_حyb<->�������u�S�e�I��yǉ�x}�S	�r'#6�J��تYNJh1%�u�#�6��+Z���Bx����P��ۨ�WD���i?d�{hZ���a���$���w�6��r��1���!.��� �4��b��B\��2y(�I���!�eh�!�q8���}��~'
��Ȫ$ys�!<�0���WSj��1=/9)u��s�-oq&���ޗ!Ζ#a�W�-,�kR������Œ��. �5�����&[ӻ�oi�U����1r�.G�3&�� ��y*p��ޢ���5���J�,��~���N���oH��y���Y#1ʸ�1����P~X�|��=QD�J�f�t?��򦢄q�R��Eڢ�\G�|�]�T�@Zp�K������t����C��
�y��b�h��
.˜��~��L����\�z���ez7�&Qƻ���N�(S���mz��6�)(/�?X
��%��HJS�%��42�	Z���l����aN�'ǧ����v;�GGo����������
gg�G�H1yi�̤e�B�#��>5.�P�%#���^xP�D$�N�{f��nT�K��ͭ���; -�͚+��s<R4 ђ�ʙ��A__tznIOF��fI���n4����WPՅe&�.��%�\^�Ѫ�����m��c�_S�I�Q åW�Ft	/����/s�r���xo�;K�h��G0ܸPFa^$���Vxq�}�ϒj�f�/KTG l�w�FI2�ZY���l\�6�h�r~�r�ݫ#�kͥ-�'~��oU&;�yrQ�Txr�ݳ�ϕ���t���-�UxZ���m�0��$���; U���-�8 t���5���B)B�4'�+��^��p��j6� �������0ય��z���T2t��������?�u�!]Yr{�k���*Ęz���Ʉ�[��D5b ��X�.Qpe�f�0�s�l�S��B�5j}��n8�î�R�]
���*R�z�M��5��{��zQ�T#K�(���%�Z�.��-��8s���$��sw�}���OAR�!���uo�������'�aS6�5�և0tr�	,g�	K1���	�w�``N�9K\E"{��q$�Pܠ�Q/7�@
kG&���(����׶p��iw�#-�s:��J�r��b��9 O�	2ro꜈��J�V��١Ϸ��*���u��{���I=�[�VT�@-KY	%l{���Q^�6������A�fZ�B>®_���q>���i:^7�-�Hry@��z$ffj�y�!���v����t�q�r����-4���$�X����|���|�J�gU��׵j��_�`�S��_�\6��.z���#D����F;B!g����
���kJ,��5l�]�jE�����o��{�m-��d����vF��KZ�z�yu�%ǯI������l�ț
��jE�iQf��1��+u~�}}�E�_�uO���:��v���Dʢ����X�&��b˖�K��_y�<[�=�����{�=�CK�lx�uN�vf
ŕc��	�V*��Y�Q�*Ӕc5A�
\���oZ狘}6�FA93���?h��ݽp2������SKL�܅|[
x���&�����?��f�P�LJ��F���Y�j�[3����Ӄ7oa���4O��w����t���`�݆u��*����̲��jO�$�J�j����j��E�����A��z�Ɨ�u���{
?>zAw�������3	���O��O���Ե���9�~���
���%H��_O�g5��==?x}��9����v��^�|���M^��@[,��^g���`/;�a���.��K!{���T-�h������8�09R0��,ܽq���_������3��/.��/���CM�يZ�0�K��2���aS�&�%^!s�b]�#<�����чŘ���y~W�0�p-/������eq
��(�/�,4�=��y���?{}����_V�5�������g�����s������z
N@� �}	U=	�> �S��V��I���+!N"�K�I�	���%}��GR�JDS�+xF�
=��^Q�}mUj+�6�k�^���^�iT���Y��|�!Fk����?�$�
|�;����	�����
�?@����?��6t�M�~Z�	'սp<�LcX�ѼO3����Z8M��s�P>#�i(�{W��;/5�g5m�F0�.��N*�1�T��~�W(��-��M|2�}��g�:`���Au�%J)�4O��3G8�ʋ^b�P�@K���v\�+�pR���J�ș/�o�+���.aޫ��XJK�7f<C���OK���R\����|���N:���/�p�a�<ga+u7�/*w:�e)zn,��^��_R�^�EC�����}�Jkb H��1��E0�י*��^�Ҋ��/�K�J�M�Wྌz׈�-eύ��[���$*5�U��-A.
D4�j�%�r��ӧ���ߋqY	�$-r[Si
ّ
�(��a��q-��T:*��cT��,�`�����^F��t��.��,u�� P2��))��_��N�a/��>N�:�<0���,P����n��v0��
���a@ك�����9���GRt��cm��
-���Z�B��ui����E��WhI���;�_���=�]���|J�w͋:{��NU���*�(����+��:����/w�YeA@�YO��W6����!c��]ks�{��9T��d#����3#(����se!�o���+	Qi��<!�d�\�Zq*`,���:���᡼���P�����}�� �����ۼ�L��z6�G�L&W+��-`�&sy9C�2xh�2p�ʒW�tʉ���k`d�T���P��v#�t�=���!�ap���KN���u�8���1ֈ8n��I�)�x����z��sW�T$W#��U>�T����3��=*�$���T�E������:U'-�9U9�Z��i�������mz�������=8>ra���L���|���L� 3�|̴�i��L�J@ܔP7����Y���>�{��}R��2�s�O�J�K��~T0�.F~[C~��m�����͌�T^�OŘ7���o磿mG� �����AY��	��Rت ���*�N���h1��}���=~��z�'��w���5K��Y�>���Ipy	ʌĎ:�[�jb��m?_}e�U��`P5���-�������a���=0D@�q4U�U0�P��.�B\ؗ�4���G*���f�j�+Iz��_;S�ٳ\����;�V7j�B]�:�)zb���Ϻ����ݣ���#Mn�_i���)- �Λ�^{.t�[ �7���.9���=|h��/�GZ)_��[� ��h���*�g��lu�Ep{o�����r��=��q9��*8~pn�0]t�E�Z�bV窃q��'O*E�����d������x��3�ރ�N�o���:�L�u��N����]�-�vfټ�jH�)ί�˃��/`���9u427�%/f���脵���6��	sn7����e�[W����Z)�S���Ӯ�Q�R�N�h�b���4��#�̃�����Z4�������;����0I�S��T^u	Ue���X_��	並�V�0v�sɐwW�ya�����HE�hz0�*�)3��8���ج��ғGG��l���m��k�ZX�o��cf��erm�Zf�-g���V�@6�d�z�\[��i���l=j�-e&��L��ȃ�
� 	Q �i)l:OG����e!��g���� �+D��\$��B�2߫�n�PO��S�k4ޛv�s]��J��|:mXm�a�t�	�sc\50�Et�̒`-@Ȟ@���4G�r���e�)����IY�
3A�il���ѹLMy?���	� ���I@9��kB�*>
̝L�̇t�|�2�0�%a��-4Q+F@�END�zG��1�jiA.G�)�#`�!��P��a��k]�u���8e&C>�S�6q8#=g.X<$�6�I
���Zg���C�nD�ʇu�1q���IiT��]	^f���B���Y�.F9ʁtn�<X��u���{��z]�g�ݕ-�S9<p|�=�i0�
E��X0(c���(�X(*Z����^kOQ���͢Ue�o�������.������Oy���K3
zk
nu�XuOE�\�|���97��gSةCU���q�?k���.Q���.-JK3c��2��%ީ�;K�\�`���]`�?g���ΖKJ[���'��HY�I��=��$xQYk>P���U5/��	u��/C�
)��j|���	4��eE��my��I���ND�&���սg�B~��Geut��N���ݵ�����W�W�D�J�~���a�lS<TL������I����9��U!Z��\N��؈n-�4ʫ��\�J���뤄�'a�d>ڋK��AY뱚�*��	 ��A�ʝ	u��tX������B����C<���O��ԉ�+�w<N���9+����r�f&��7���,Ls��L^f��CEU��+>r��D8L+7�_6�� ��]�@�w�hf:&-7�b�m�#)�:}����z��-[���7�$�L?�ƖR�2�����ؙA�}ѕJ\ў�J�9��KU�Hzn��w���=Õ�K��Ibe�R������)�����{.�v�T��Slz��|��,��ѐ�����-p�w��Ӄ���Ǉ���BP�l��2�fИ��d�nv�]mbn�|�
�p'(�r~|�9����I)Jo�����昶�]Ǹ4�g�M��o���
^ȵ����>3��a��16��f��T�)of�)ڜ�7�a��	Ǎ�n`mw_�w�S�t�?OJQi���D~��uu����qO�\_����Lv�^&��5��M��=]���
�1)��$�<@c����؛~x�M��C�`Y��ܦh_�Q�fw"��|JP����9(��( V����S�׳E:�r4�ZII��3,ԁAޝ�#���<Ңwإ�V��@I�h]����Y�E��r�)(H]N�F��S����'��I�{��	����{�lz�Z�j���`q���#������Gurzp�wp�9|���G	�r&+��DJslj��K�a�\s�yͭ�:h1�r-u �ʏ�߰͞.�қ�7[�R��f�X�K�1�L,yk	}~�/��5�R<�;)^3_5,��^�;!zw�2 '�\Ҽ(X�H�+����~Z�E�i�us�NC���`�{��t�����o�s�5E��\��4� �����FW�
9��`cq�Gu!e�rP�ja�މ�V�k�$,�~�y0>�#ߧ��f�ŗC8\���HP^������7U�pZ�}�)����׬slDc]�""��/(�o�K3�Tjh������}�6��\�;�a/������	D�fW0k�:3
E��^9�b`��j�߼д6��]�f���|`;�Yh���~M&�y��e o���]"�����@�W���̠7R�����k���ʃQ�Y�m1�)
Y�3��Ku�yG��?������Ř������Ȳ��  ��Y��A:��3��g��C_�}����ؖ�g��J�!M���Ě3�6�  ���}�ZI���~�jM� �膍1؃A�ك/�=g���.�B����U%�������lDdfU^�J cw4�F��KdddDdddDM��ٔt�
��l�|!��6$4�`��h�Èv���|`|&�x{,� g�".�Z�̚W��=����e�{*�;F�_R��t�����Dc��4L��pH }�����߰��~�Ѻ��_
�Ԑ�p��{À��P�![@�0>��Ʈh6�,�ߊ�5��YofɊ�!+w Rn�˰!���i4#w0h�ƽ���s�1�c�"/ �
>�H���GX��Z���N�F|r�*h��6�?�A�P"R�����ңmB�Wtcb7�n�"���n���e�j�c�YV4!/"Q��0Qt���IZ=� �_�΁�&\J�"��3L��N�c彔e��6��xϯT4�r?5�E�zі�hK/ڶ���m�Ae]�_REIp��5�y�aFp�>��"=O��]�C9�?�:yJ( 7A�H�0���\����}9P.���E�䃨�*���J��-��v���1<�6�o��:�Ӗ��Q|�&�PXgB��lL����$�-��H��ri��=[D}�N�Q���/�K6���Pw���gV%[@.���Z
���M6�yn�ۂl�� �?Z�7:��pcޚ2R"�pc�e�/-�+�^ ӵZ5���0�jc�1>�!T?5���F�L��� j� �D�� Cݬ��Evsܻ?d�r��B)�Dv��5�V�ɲod;�6�)�&��'K�S�/O0݅;`EG^�jܩ��=^���N���`��#����b��}��n�M\�))meEl ��6��U%��� =�-7���)HL�|y���9Dh%#���ґ�2�Kf�T����.B��5���Q�=��Vגnp����NTCA���̭Ӵ�i��iY��D�F�}��P�9�ɒ����:��v4Y�~��r/-dmx#�QJ�X�hv�e��	�P���,B�N��m�`�|�K������Q���"~L-����5�{x��-P#� �J��ղ[F�t���mOk�g7H��s���� ��J�8�����.ڑ���C��^v�zB����uS�ƥnX��[d���;��B����*��4Uxki�0��gwR�mM�|�ּ{	��3K���ǥ��%}�v?R��:�8���XC���o�ִ򥌭��*��U�IɃ����L���~>{u�I����7�g�|���4s;�%���q}�G��Q�W����h�jY3J6^�����LoՕA�L��
D]�ޏ�>�*'!��mt��������#���%𸿷��m¿G��1�ۂ����O�v�K���A��Y'��$����7�ǽ��0u���>j{Yd�h�����'�I�";3;c9[:g6\X�4��5/���`T��k^
3�5�� 
��`^��g�b�$����`_<d)ٵ�d���0���`¤R���{�
��n�}Ϧ�뙾����f^L*�xV��ǣ��Հ��f���J�e{�f)�/��D�R�r�������]-�uߟغ���CL�3{��4��8DǘmX�Q t�P����5JC�Oj�p�|q�����'��@����M�b�Fe��{�b�H-��^3�
{�a_+�2��[�PEIUk���e�&�L)�J
(�#QL���4٤��]`��O�f�Ѳe�N����rM�k�Τ
K�m_�&e�;p����d�f}�38�]�۹��m�Hqmr���O�;�A-]�MG�z��l�A�%��OM���3	'J�V�2����ư��7���d��jJ
qe#�՞7�)�ϝ@�D�|�{�Ⱦm�� RN/ݨ� �ۘ��KC�t@(&c��Ά���l�
厚w�D����y
��R��Y�wz�g��D�z���Yvo�a�͋��	���u����)���.|k鿥����|�:��{ߦx�MK� e����f=S������`� �M�繂��|�L�]�B���S�,��Y��^B~3-��"W��Z �@dI�%�;����՝׸��������l�E����G�նnsJ��Q���+��p�^K�Yt:�.)�'�"�,��V�G�X~���O�L�@Fj/Ra�A�Y���$-VIMɒ�W§�$J��2�Гӏ@5*-2�� $v��n�'�L��@��V�n�)Z�˒J�����ηV�i(��(��\H�䌟�)����;
�U ��ڲ;<F���;�9�#�&� ��ʺ+''.~7^n@oc��
?\�	R.�w�9'go-�i;�~�ǪyO�ȡ*�е�͊��eck�k\g����01;,��wF}�dP�}����)����oT���޻F���,�}8�|�?ױ���z�Pe�2�N	�l��c�}T K����{�s�~lf|����هl��a֝,ԏD0El�Y��msF������ͺL���c<�����p��t��!'R{$cNn���a��ToX�.��uN��
��<�0���/gK"�W�x%�M�E�C|^���n�8�ַ�3�rw,�v�=fI^���6���Co5)Y��T�0P��SEc�R��f�ιw�aqR��c	uc����ȑp�aJ�oI)%��b���O���.z,G�=?�o�Y�@�o�J9�Y(]2=�뾯��ۏ�a�w���#_�mw6����s�V�?p��N�^�|�
�~�xd�;��|]Ғ&v3h���2���,��VI���k�Arc�%Mj[:�H�0�6C�D �a�	��k:�kK;�l�F3O�Q�rKk�j���N�8�G���^<��*��Ȕh��~�)ۧ�GD*{�"D(\?ty���A�~�f�h�����y�9��߼|�� (6BF��!fo��1�䲹�t�/�8���LvY����a �ZC�g,� 9	&�s`!�
a�� ��I8�E���$6
$�i�H�������
� ��ӄ�{ ^�7��ȗn���ZWq�ە���d|���2������cɏ���		Ê�V*zh#��18F�⁕��G�Y��B�r�-mx��b�ߒ�SMf�jp�N���f0�;�3����Qj����i�!�g��;9(��L٤#F>��i��t��`��
�A�/�4��:r�&��4��h�[�@A��dN ݐ.(Q�O^o����u���b
�%a�i�x���t�q`~cdj���t&w���kvqa�z������p�׿7��ĉ��H<
��L6��C%��7x�@+�)�(���s��ϝ���]t�p�����o�e�l:��-������>0ͻ���m�����99;:<��;�xo����ק����b�0���+��jL1vN�G]kS�:e��zӬ(:GIM�1�_[�|r��v�gj�٘X�T�Q��� �����E�z��Ӯ�?�]_rM��'Ө?
�ػ�fS����Z��+�c�R�ؓ
1^ޘ �0�a�]b��=m@��b���y�� Ĉr�c�b��hX��¯� ��$�>��Ko�=���,��_��Q������K۴�t��c��3Iq��� �f[,�bs�y�3�'�7GC�]��X�++Z�
�NVs1��c��A	���k))�geK���՟jRK���s�|��.�%-h�ʵ�lef��<
�a���H�9a�*���w���
��ÿ�����lˇ� G�E4��UZcN.�s�5�.���6��-�=b��c�a7�A��d���)�Þ�dW�\۸yY]x��h`N��X_�
�U1�Y8�k���m�o�)�ȥt�#��I��:Yʱ�z�#+��6n�v^��.�a�F����!V��%��2�Wy���I�P���鶷�^aeW�B��9\8&��3�@'�Ǔ�;��t/~��6�w��B���Nx:��-�*�S��ኹ��a_\�~�eg�O��P��y_\��Rt��P�MF�h�<�+
���j��Y�b��&�*��c�pE���㽳�7�Q�v��^�8:>:��"�v���U�.K�g乏�<�!��9If�p+9�.���-��$0�-�]/��*~�ڡ{����t-����h4sn	��=�q����R_���������Ќ����,b0��x��2=)�ru�7���آN�Q��5s�8z�2����o�����O���*�G,|�S^{��{���i�_y,��{��w�Ap�,
�p6�j7�Jܚ(�v�
��Y�}C�˧9-�kz�w�Ԍe��>�Q��%׸�=��h<�|��z1+��1d� 9GA4K��2is����R��y�ͺm���
�Ά<fX�i�%�M}`Ħ}&֪j')�
w�R��Q$��v/�I�won��q�k�F���u�u#{\���*��� 7�H<����w�z��wޯ�讶YOyl����@B��D5F�aK�㤬�V������?�qC�X �^��,�t?��5�4dP�@��� ��SZ�z��ږ7���5І�m�>�.�;y���+�[��T}��	��/��F��g���~}���h|�`XԳ�AS.(�����~��F�	C s؏j�:�1�^���@l��F)�PhS�|b�}���*�x�t&��8Ok$J�=6?V��g�>NLYE�Pݍ��]�����遱���)
��K�,1��S�)���֪�U�6~J|<��J���A���L�eb�5m�v�g��ukR4�º۽�n����A
��է����F�R�Dx4ץA��X�-\��u
B��i��=�\�w��#��d�T�)������+䑍e�����ƣ�7@��=[�k�㺌kQ��XE���ݑ��f����Ho�G���.k����5լ{#.�FW�Z����2��b�~��3����DAW��G��:(R�7�b��P]�B��!��r3T�6���ܐE��BDvg�8��&�c�ǲ�b�ɞlZ%,BU�I��az�y�qn���d��'+��a��ݏd�4
Ы��{c�uk���TX
���v�U��?��:�²��cN`
���<G?0$@
u��,��?d�i�> eD�hCǖ�FrD/r�չb��812a��2mp�z��&�bʌ�9
)�B��s�
�nnSY��2��r�H-׹����Ʋq-�J.w�9�.���9�7��h£�/��34��꾰x>��
q�ߌ��x������=�
J+�Ao!B���l��~��@�uN�bN��)�%��␞<V5��79ߡ��9y�o�g@�*��w;�p)�'�id��ʴ(��[�(3�ϒB�*�m����LE�x�a(q� ��Xj�B�6�0	�?ђž�Mp���md1̀���7�b~\�!�	�x���֚d�[��,���ǒ�WkHuT��VqY�h�[|4��.��OO�fC�c�S3�*�z����f�%� Û�2�L;c��֡(u>!�̌e*�����Ehx?n�s�y:���w��=��w��= ���p�^�	cJB�&�a�g�Qf��	o�0ƞ�juݹG�b�,��*��3�fAt��+����p�J���dUCL�e�Cj�1i�1O��hs=�̪i
q�'�	����%L�Sot��|��|#�L���Ym�-<O=�� qo}�m�%��a@یZ�g��a����B��>�i4Xm�B��&n<
�펝��Z���G��ƺr�[�6}Hp���v�m)�/��rPH���&I4�J͞q�Z�D��jz����z���<�^*��E.5̈́f�T
Y?"���OrC���tbY�Avn2
�i_,+��Gi 67���(�cB���V�b��OPB[�ư�s�g�#8��)�D���k�u�����e�`劦���Q�@*5~�Z�S�tV�!b]��\gΗ�^�/>9��D;EԜ�9���`a��\�Ӂ���s*��Swa�����G0��k�ʝ����|�s���0��G� �� K�"m�6�ֱ`��_�̆q.�����l��>z���R�_-�&�����G;+�:v��-Gy[�d;���N�}�E��'��v*6(���@9>YJ�i���l����(�y�!����K�q.
�`(g�q
�26���a�9�$�b�g-�3�b^<�h3��0��� f��R,�
4��\t�G�^��3�Sl�ui�	u�0�t�r�2)f��Wn���|��bN�2[N�,:|-Aj*�/k[�a���
���c�]�@�#O�Z&E��܀������^~<ߒۥ�tg��x�{�c��"EvID׻#�U���E;r��;�J)<ʴ�8�-���"�^>Tx�i/�I�0 �5�2����	�J��:�z�h�-�x�,���x���_�4�D!_e.�4K�%��H�.z4������P���g���m 3���}d�ݙ�6S?����to3+�P�9�c�f7<�f�X��4ǰ`�������m�	�Bl��K� �k�*���t��Q׏^�񪯣K/{'x c��:Q�-3a�����=VK/dJV�:��V衔��� �c���~��Q��Q|4HȖò��Z���Kπ��X�ݔ����J�ڃ�4���`}]ch��x�t�Y�"ȜH��N���X_�J���R���ƣ�}QD�/h��|��Qv��.7Ȼ���a^����V���}�(9ںs���4�k��Y�v#^��1\�Ӱon��m+õ�`����r��.6����7��{�z�1�O��5^�ɏ�nAIQ���-s����Ȕ����Z���*��(�2��:W�2*t���"K�e�Ք�-Xt�	���s�^��1��t�P�sD�����`
�����鸕�y%n�p�B�ߙhm����?�X���gqp�g���o�1A˅�U�UG���(�������r"��X�z(�?�D�qҿ�$Z�}�d�p/�G�g½��gu���k���ixJͫ�y'�Z�w/���^�h%H�գ���I�{���ǉ��� 袓�h׶4!��f���>�o3����	�n	 i�@�<��XF柦b��m�͘$�sP��N�w�[�sZ �.bHǵ-�F=����e�w�9���O~�/g�/۴J��J����ZYZ|G���}lq�f�V�˦�&�j�����_uQ��@ ��!=�}-�����!���j#d)�$���u���Hhij$ ��;��d���E+UE��������k�RT�łx�����/'�B?�{'x������wrpzĊ��wT
�e����c %�{��=�rqr��/����NJL�LXt#��� �����3�KXqő�����G�{a)��歡��T��%�u�����
��/t�/��*t�w����˼��`O�k�'�BPv9��A�n�ܸ�w����D!E7_�M¹�?,���_�Z�a�O7����o�b�
�og�.+y�]rj�����T�q#�E��U�+T���=����ڞ[�/>撑�A�[�A�]f)
����@n��ϒ��u��.v�%6?vճ��Q�V {׏�W�-`�b��/@e6C�>a�2�v�l�t�dw���n.WT�3Qm���n����E��䕎����n��;�鰼H]D>�&9�!0��v�,(yax�rb�ׂz�c�91��>���x�7����Xy�ꍙ����86��4]���}3�#�XN^l^8w���b5Pe[E�O}��}�%��a��C���x��?�	�!���z�ζ�����&+�|��|��%�j�t�"Ѯ!�^�ofГ⨓�;�F�%Vf�e�Q�͇���,�ʥ�y`>�?E��,h4�8��l��P��l���mO��a�IK� 	�,Aف(��u;�gG�v01�8��1UKqLTr�(�u�n�!�\ ��ּ�ϴ���lL����EO�A4M�wS����"��C�$�cP���������B�&��Ȱ��9�2.��z5����.� <Zp�V=���Rc�����`�R����@�֪%s��`O&���J��Q�
4U�N$��iM�_�L�����q�����$�l�
�a��
�4�
Ea^<���c�/_��<oE�����2��O7�d��m��)e\��ǖWF,�ҫ� p�0H<��i
v��+��w�Gc�2�}wg%��cx�U��0N�]����f�
����rų���AF�]�V*ʹ_)�φ(�oR�=�������ah�Z�M�*A�Z�n{����ˮ.	w��>�ff<� &�4��IZ��s������ͱl�و�I"2�)Q��s����
h��]oD�Fs#|C;m<��LwHFv,���8m��v�F �4C�r�aa�'����tF'|�q'�4fݠZ���5�ya�*?��T�����κ�����7���� #��˭	�B̍�I0X�����lH�a���g5���
:���9���V�4�{�6��IVޜ��9ɡ���4��a���3�
Y0��ּ�{h~
g��9"�^�{�j�ˊ��mY�5�ch��p�	H���n:�U���!w���64P1��.�y�)p0������)���|��\b���2#��ˋM����$4#��b�B��}j:�6붜u[�u�6�io��ޖ$J�sXkD���T�V��"�@)�ﲐa���������菊��q/p�O�<�UQ�,\:<�z?!o���
���q���x�d:s���Ja�_[�}5��j+"��3�o��gx(���j�
{�;�3qSD�BQ�';AAӴNY�|17��ےV�|h�&jt��O��
����1���'��*OB�SF��-&۵�0� A�����Q� fEiro2��/)n5b�2[ӧo;�G{�G�e6:	��?�c�cfl���`x�-ݲ��S�Á��w�@Q����9	`��~8��t[��"-'X����"���O�?�Q�b���'���(�������@1RZ���'�� i=u�+�a-��p�%����-p.T���=��7Nms%I�	8ޖû�b�1�ݤS�;�u呕	���^-9����E��i���ETQ��
n�\4�����f��������1���G�x�hpn�Ba�oK�q�AL�Ki�Rb�l�

�LTO=��Jy��^����N:��8Β M6\"�p�SM�ec� �����ަ|�6ٺ��3=��n���J��i�L�v���Z��	 V�d�w�w�����l�,
�c�d���ϻMc�2y�O�|��_�)Gcs�|!�G��:j�~˵WBP��
-�;Ȫ�eUs�k.IV5dՃ�r}dՃ�z�UbY�zR����DY�Z�ZK�U�Y� �\�Y� �d��Yez��ҫ�D��^�ڷ�^&��<k?ȳy��<ȳy� ϾYy���]�]d1�{&��L�=�0O	��"ᬷ��M���_L�Q��coۙ��y��ּ�:ВՆ��� �~������a@A�x�(�S�&=��|}%���L� �ƞ�\-F�0��� �N�	
<���	���W΢V�ֲ-��3Y�=�JMnmTQ�A��H���Ÿ��4 M�X�om��"��,%2��i��W���%��?�,����.��^'�`�\\�)���=�����[�1艨<�b���C?��K�|>��/�?��J�-)�C��2��nz�N#�����	+یaS�>�r#��Fr���FZ���x1ˍ�\���sg�:H}�y��v���d�~�{��װ����n5-#7���d���Ї�-�����<e}���?hJyY&�ZK���&Fd�5�]�DD3X�Jp�'�w;v^��vq�ѱ��/6��[��8^f�Zd��V�Hl�Z췱�-�4���v6TaG����S�*�NS��\D��_k��`��8#y��KpG-5�-��ەg/�q0�����~?�! ����@��d*�f.͕��U�bҢ�� yB�܎��F8 ���>qw�Dŧ��`����	֍D�[S�e�w�	�ex�v���Ng�օ���Ko��D�������R~;���9���.ʖ�(���	P�5����W���	��J�����/�R�L�����뀒�q��ý�c�0q�!{w|�ΐ�;6^�q��R�#K�Z�ɅC�Q0Jw�@L-��-��e#IZc�% q g�b��$H�F�΍+��x$�A0v#� V�=����_~��]\uU(5�>F�Z���jQ$���O��7Qe���E0��p�L��*�
3[��֓?4b���ou2�$�d6�GwC������#� g�mM�u�h���l6���!� ������(��9N�0G�>�
'�ڣۣd	�L������H�bO�"�kP���}w1Sh�t6�u}:��@;�B�(>^���4��]���3��#~��8��O6w���'��,�����ᓃ�r<����uvJ�+�BrBYܲ�/����x8��@�=�ʻ�
��⪷x���-2%x�M�
��й�9&z
ڇ�|��'G�m���Xcⶁ�#ЉǤh�B7"�0������
 n�^�F*��'&i	z��-l"�F�v�=E���4���͙&�#=0:c5N�ؒ�^_v~>{u|~���Uqh�*������ ��|󞵌H�EjL�1P�W�(Rve����i��(4�y.#y��D܋h����S�
�\Ɂ�D���`�%�n����ړ�0�Je���N �>㗃���.�*��w9 ��V�����J��x�4ۈi��8Y��'"��>�`���&�b�W�C�.���h��l���:�W~2�
W��u*�38���{Ƈӈ��Y��?dJ�a1v�U[2iq#�:eߕJ�L�NU�/Z�U�ܿ�ˁd2��B;q���C|�r�r��YN~�ޗw����5߫
�{�Z�g�4,�ZC�w�5�m���~a��+��
	U��9�'�)�C=C�Ɔ�s0��U%����i�9DC��=<
�Y���w&�,deE� K�=�KiY,^��й�
�ի����ӚX��/�w��Q]]����M�PQ��#�Z�'@ �\��A�����Qt�`@�� v��l�*��.ʏ��:()K�Wu���"KY��D���a�x��x�3�Q��a8
�V%}7������ �#a��� ��p\����]����z�}��W����ڿ6����
q�!�R��q�]R�K�Լ��LH��
�T�M��c��!��$��3�R/�|��PWM�'�a2П���3�ŐJAvƩ��l#[�0�7��n @�Sd:�i c�9�N%������"�ud�*�*\@���2��)�,�$����d���{K���i�/���G�
$i�;g��z�͘!bېbѸ�<Ե�p����0��^Q�
JrB/(�|J{��0�ي�d��P���^�g"5Sg�C[D7�Djz=���ՅC��׶��pȲF�W/	�t9x�u�\�Bm$�����A
���;��aWb5r99r�:�Ŭ^���MN2s�����&8VL"9vD<��^��#b�U�;'D��²>$���h�l�zNW3�ƥY��?6Cm�1���m,E�*ߵ3�.�G �"X� YH��u���h�8�k|�S@�%��oP�I����F���W}AG��Y^�}�[�N�S�� I>;۞�v
�O�q�
4�TㅣƹZ�4@�
4V5[��M�?���<,s�d|jH��}��
g������\
r��ۻ��xm����&�)�`t�lW-k�����\��������6CjN�;܅5���b�$U���l���
���|��P�
�+�e5�q4��@j��mؔ��W�4�}M[*h��T)���G�1&M�@%���V���G�/>��5�x���$s��Ђ2d�S`{���3\�}���t��CCzL��_��ю�[rϪR�_���(�n��X+��(�ܔ!��T��]{T-���,0{j��؉�*c-j�j)d,,:k�&Z�լ8f��𬓸"���nr���=��y�p�?^{��F䚈�TO�?�=x�N�d�����(t��.�8��v��ԑH?��Ō49 � q\e�~l'�$l1�l���5]��P��Ą��@������C����V9*�����&�����I?F˃߽����p���Ig��� {��A��$a7Vf�N�a �C��G���~�ho
��x돡���{ս��y�wo% {3������q�%~�U;�ܠ��T$���
b�	�+޼|u�/���,���8�V�[�~5K�4���8h?�_}��l�_#:o��J ���8F�k> ����B�Uώ;�U�
w�I#��z�T����I*��:��n�ho�H��vp
/�'epb��(U�I �
�7o�x�f��TX���,��!$���e����&��af#�����q��7�(�[������ё}�a��ξ�`#cdY2��ѽF�/�E	���e�
}i'�0o#��Bg(�:���TkRH�ͬ9'�Ѹ\���I�8��- ������yY��o��NI�ľ��W�:��U�X�c��\��Roն�Ik%T���^캧֘���tmWG��QI!� ���N�ʚ�����=i����9�&�1֬0��V���[�Js
r��y�.U�T~	�L��1�; Q �T��ߪE\L�!��3w]��e�H����_Q���?6�QI}�i�Ԃ��0>�sDj���Nxs�Rv�P��������"&�5{����R�J1��66СK���W��-�*��@ǀ6jmC�k\ӌ'�����.@�*"�fb$�w�W�U�� �hV�h8���2���Z��ZK�Aؙf)����T:W��3�d?�t�Qpe;�Y�6V�6/�e��Z��%K���>��9:��=��[nY�?'��'�f�E��m٭B��0FK�q|�P�9��UP	��Jk�^(���W���}�ʺ��!X���^��	��h8Tvt��|�q�,-ɪ�8y֚���u�x����Kg�ztqL�;��I�<�T#R��e$�1Y j��j^2c�:
��}��fP��yQ������T�Z	�^��nN�.kK�
&��С{R�Fo��VT��%�e��_�zh5�V)��F�\��ޕ�30,�N���4��D�BQ�KXW)W4nm�M��Ԩ��8vx���j�dsQGzs ���_U��g�OXX�b@}j�ЪHI*-{����$%:{y����M�UO������O�9�d�6��� ��d�pB4�!�'L؉�P��"/��s��m�\���S�a;�U�$yY�B�l��d=S�!����
�65��rc�e�D]����3��:�7��p�Ƞ!�%Q5V9�{@�R���:�1��ռ�Ϳ�� ���Ԡ�>ڨ��>�Ii@y���W�^�l@�H�����օ/��t%3�l[u;�I��ɲ7��e(ﲪ�M��݌�H���|I
=d�Kz`I_�%�3�R܈��ޡ��E�VDϲ��C�.�⁄>L����l��(��8SSC"�ٞ����Z�A���Lѯ�I��U�C�GA��br��jK{ݒ
9^��{]�6|�p���'�Ӝ�)���nA�6o�HZ�b��5E���6��@����
5��4p<���X��Ķ�q4��Y[���ތ�c��=PqޤŜͤP6H8:yA7*��ڹ���{���.Ov�o�U��/�����b������o�E�D��Oy�z,$�K{~Z�lk^�ח���`�c�^�R۱�q/�E��|d��U�r��
TL)֯�֗ѯ�5,���_c��d��5�`�����R�K����ԗ	;
��!��G�iR�
0A���>��\��dQ�v����1�%lL���
>g/������]
�ߛʨ�6r�Z򵇾�z&�r��a���lpd�NY���:8w0}{p��1^3/i����%��)1Zn�L���{Q�{_�;�^���!4�� +Õ̕a61L�h$=c���oKOQ͞1p\�bͦ�R 	ح�La3�U�1�`}���U^MV�@�?����4�C��6���-��HqXH�&�4 �l�O��`A����j�1�[Es{
4��]�Ux��O:�E�� ��P���a4NN�߃���YpŢGV�uK��T��=x?܄s����M���K9�����a/ �ռV=����ZR�M��'pa�U��I�7���]�R���I��,�3����H������>{��`d����H�x��ճ_�ʯK���z,?����7�f��i<
K��L��Te��0X���
��>���%j�t�]Y�X�� o`�}���	e1vM?�G�G���ǧ��>K�a��O~�e�������H<��t����S �-����>� �a��.?
0>�#з��6=t��G��	ؔ7_f����$y�`���C�D�v<���9h�tO�j_���(Ԫ�Cw�	�E\���7�ODW�a��Z��:�Ӏ%��O�0mo�y��fp��%�����b�Jۥ��sq)�)��Z���h�Y��%s�7f�?���OKc���¦"u�|j�2�^p�φ�1lղ[܀���-w���5IM�8cL2�����
X����������iMx�bL�N3�fU�xT0[��6��9tI� c��y�(h(����0e��Sه	<���/�}[�:�m��H'���ߋR�[~��E.����Q�(���X��F��PQ��*�Q�A�'��ʪ��`��6~;-'�����*�̖4���gq��d�F_G��w�vo�?Ϡ�ǩ�4P89M�[�����J�>��
�����b`%(���7��<�)�����t޷�&�_>h�z�KW�	.����҉'�uL%R(\�{�����GN���F��u�$
=�&8l��*� ��p]Y�s��qu$��o_	�����.V=g�83['�"6�i��=�N2L5w{3�*�+*�I	Q��mFU�d�m
����m�5Fz�u^��H׷�tS����ɐ�#9f²Z������&�;�^���~���霁�����o�z{�{�WG��I�훓�
��c,9��"P�ڰu����4��^dSP9��.A��q'з�bQ�3,i*v6��)���&](~(BbU��x!6U4&�Au��^G7�@y�Md
&r�x��Ii��zҦ%��0�����'%�3�f
�����@������bf�|���d`<·
O�,�xW���^e��6��;�f��T(��)�q�y�D�����BA
�yD���'"��\:j�t�(MG�m�U��ط�b�Y���FS��@�3}������o�{��^u��Mh�4;[�u�bޞdr�b�j����Eo��X�R��ɦ�ͧ�=Ziv�����"�'>E�ba�����1v�+��-���gg��G���c���۫��f>�bQe��*2e
�DM�`��rW}��xC^��Q˱�[֕�¾�_8W�s�'��Go^/k���	�}�)�ܢE����ף�{��������Ѿ�?}��1��,i ��W�ӳ��8�m Z�G���_PvFA�w�F$G,�B�C49 o�3OyQ��X�u'����ڠJbC]��؆S�y�͟pV3hi;���2/#2�,���d}Z ����1?{g�E�[c
�
6\�ɴD�n�䑑`�ss�{�4Jcָ97� �^wN�J�F��b���d���^h�b!���"5�O���	T��y34X�����(���B#�n"=&T�2�{�æt�Q+Qcq���˙����}~��ez4���7�N�8��#��y��l�gX�,�T��A&=+���sIq#�^�o+yt�-v���N�Oڅ�b�@��p�	O�lӸ��V����̟���1o�ш�<�����GO\ ����]�KMV���m��%
�Ҧϫ�ǰ؎(k��M���ǽ� �C�ͯ�祛�9G�~��E���P��;�e�W]=%��Z	�Vkk/o*��rǖ������;<z�wL�������amt/�N�kQ%2��jو4E����B�qt�+8��t�6����!�lZ� ��O3 ;���I�#H���r?�Q��]�e(�M�X<7��?G���j︃��,
���T�U8�U��˖Jo�~�(u�Kɼ�{յe]���8ِR:��
W�7��6	�!�ZS�4��Z'��߉Ȼ�̰���2��^
EG�Z������Gk�f�sr�Ĥd��2�XJ<a������\z��D�E�0�y=��!)��kO�&�� d����C$0%�M���>ÂWN+����R��ə4muteE�Ư��
�x�k�DW�*�η�gN�v�O��p1�:�e��M%הݻ�s9f�}��k�تh1Z���܍����^���O��5���z��H�����?��xSo�Sd"��za �3�`��Ae`�"�;�p�U���Z/�4���t�Y��
EJp�%�X�e��SKE 'g��v8B�R�7wȑ����*��+1�M�9�3�ĳ�w�'�;����鄬�}eӡ4�͈�\��xk�<S���2�
�\�}�ex3�+I?-�q+�zʢ�z��E�e�^U2<��u�t�������rRFE:�H�|�gT��������H���������χ��O���$:��^������s5�+AE�AU� ��t:�M<�v/h����[�[�����t	�]y�G&��'h��/5}������
k*�F�m>��}:���y�fUkX���]��͟[7�as���}os��Fe��A��Ք��?^{x^���WK�����Z���<i�h����FJ�"�Ou�U]v*k��\7����\�<J��,�ыWu-�#��$���TEo�b.���|�t�
*�쫺m{;��.߿M�m�0+�W#r�JI�a@��4 L�vd������K�����S�V�U����|}�gU�Yo���{y{O֘Ɍ?�O��Y�1��
�Q7��6�)�9����uu�̺�.����$@l=�k��lE�a4��A���
^ӍW޳�Լi�4�9�{�r�_
+�>G����`�D#��`ٰ�����`r����Ѱ��
�+�l���O(�t=m=��0E�˿�+�H˳��ܶՑf6��h{W��jnMi������L�2fdYja�e�2e�:n����	^�ad4���]ijDĒ)Zf��u�)O����{�o
�����5%t� �P��l���4L��pH�?ȕ~c��.� ��O������:�ӳ�̓�T�&���`�p���k�uo�k�Z�;��m��P�r �0r�f�F<�{�e-a��:�/�1T��0Wo�?���r�5p��e�Q���W��~������x8|>�Mk�����'׵Gu�6�bz��(�?��.�Ԃ�Ha5:}���`��y������(�����.Fq�md����7�B�ۃ�䘢�� S�[gJi���а���^��2��\��ņ�E� ��|T�P
x4;��?�l򼑆2�� ��V7�$����y�O{������H�7������a&ޱd"�4��Ұ�8�4�2=b��`L�~S���&C���<S2H�l�F�;��8R�bϒ�9�Ԋ L�m����;�����/�t�2�
!l�O���㍜��Q�X�����ƦLp*=�8���
�J0�0i5R�co�Z�J�Њ%Q����ZO�@<�8����	ǓYb����f��J	�<�2l>�C����5}�n(c�h�?��}X9Հ��v����{�λY�7�0�m1A괴�&븈��xo;IO+�n6���S�S������RIZ���3		�l�;D��6Y��.]��nl�%�\�'�
tx�gI��?L�0�~����f�lY&8��-���þ�9�L��?[����p�&�D�ro�+_'�l�;�Ҟn�i���u���z}e�A�9�-r����g�^����	h[�^`*�7� yRn�q��Z_�lN��c
r�\�JLg�Ҍ[3�}a����^�_p(I��5
������|k�h��tV��%�r�*s��M�k��M�`5S��^%�l�`*B}g�8E�l��f1����mǘ���d�#@ȗv���Q�O����������O]�F1�i�T[�ڄX�i�9���g� �c���Y	FhY�9&��X85��G���p��R�P�������g�c@s*%0=b�ж�v(4�]�-�3+���}�-�u�?�MIOD��&�nI{=�TB�xx}$G��|��x�����7��}P��w���֍C��c��M�B{mo�{@��i&�Q��� ?B��ep�1Lj�6���������
h��>!��q��+WJ�'�K
��V���#�oJm���W�9�R���z%ۉ��5�&W{���`뢞� ���*?o��6�X��/iq_�z=-p�-��* �� ]4.6/��j� J�O�:������ls\�3�X6��*#��|�#���m~.�Ws}�8Yg��Rrג}�k&M���Əޛ���\<����rm��΁�>3��4V�2�n��(N� j3H�Fцֹi��pI!c4EI9=nʍ�)��y��`J.��n��u�Q���լ����7��X���A+��H�	j�U�eeқs�&1��3�)����vy����mn�2�g�scC&"'}T�9��k�+�Zme�A(�IWF�(;��zz��ͮ�.a��%{�/���p�+��:`v��k8�R���A� OE��ܧ�C��ւ+_~��/�<ܝ>J�;��+
[����u�\l�)��W�m��g[��s�#W#����0Q�h�>�b�[;v��z�ة�{l]�`�9in5{�J�؁��n�lK��I��x��2~������b����P�X짧��~x
8ݽi�-��-�;��ΡO�ub�=&5���v$�����M
7�
�[��F�-n(���_��se�m>m��9�S;&�k��H6l�hދi$k�|=C���z���q���h��� �g	<������MH��Œ�j���?���`�؝t��kJV����[:���c�R�lr'�6����`��G9�X�I��}��=	`	~�탅������C��c�{��n�{�,�%N�����S �c8׎��}A��'u�A��}�Q�o_�V��w��~���?v> �~�1���c�G����=�ã����l�4T�Q.FJ��iD9�Wi�&��g�>I)G���ې��i
�E���(��{�!��Ig���W�`Ł$�Œ�D��yԻ�Q���^P�����J,��F���e��ѧ��	Z95��e��=>�;4�=��O�)b�K��qN@�#s���Fz?
�+�BwJ� �|&��}iJ��ޕ��9~������{��oɸ���~o?���1 :b�"oi���D��,w�e�$?� ��N����_�%�U3{��<���e�&�{��q0�����'�+�o��7��
�Lo`���fn��썠��8�s�[9������,�Lq�r��+��<z��Z2�	�<�:C�{��;t���m+nJ�`�y���N��V�{ox�+�fi��Hd(oQ���F�Q��$_I�-f���3g'{�O;''��2q��9��'n	���x�b+��㋿X:�N޼}�lY���_�d	~��-�h`���L
�uq3�.nB�������k|�l��5/t�S�T��߻� ��*�`r@���� +Ͳ�K�>�?%�}Pޛ����vȻ
Y�,!��Q�9ZJ�,[ZL��ؒk�;�v��a5�k�Xz�?|�{`%������pt�/�#�8�Y��zc�W�Qɪ�:��vwK�f���<ֱXyv\G� ��S5�r)�	Ҋ�v"c���7/�F�o��<�b%(^��a_��^��Y�cԯ�8�rXl!s}�W�ǌh-}�+B��.�-s	����0(ȼ,Qcm��iP(�Y壧�M�o�B5�Y�6�>N�u��|V�y�%���	3S�Y��F��Q-n%���eIqT(#,|_�{������:΅���
Һ����h;8��J�J�G�� h��P�kw����x�)=e�89f�|<�q��xм�J�S)���'N�xl���B�m���A�C-V��������?�q��n��8.��=���\�y܃C@��2}ġd
]��g��� �9�s^yv�wt�T�tC?_����\��e+7d|д;o��R�������rj@�#�o�B��/tH���1��1����1��1��1��1}�)�)�)�)�)�)�)�)������1��1�}��)�)nE���c�7��p�1$�A��?�P�>�W|c��i�Bg*<Y<YL��x�~�����?��B�v	�
�#�<=�����������;�<�<�<��>����?�y��  ����v�8�(���ݻ-glY�/�8������w�c;�{VvV��h��%QMRq<����(�
�+�'9U�@�e;I�zƑx��P(Խ����l#�����1�Y����.Pz#�
����/�	e`eRM�"���]S��9Z.V�+�#����3�z�������泥`�����m�5�-U���[�|<�x��p�a.���
�*X�}�����e�DJ,�}fA4	���(��q?h�b�s�{>@�c������3�
Mx�ܸ��ás��T�S*�T�cukW����X,Xf�uy�VqE�⩚t�K�wZ�I�)\_��"%p�3��O�5�>ŀHG��طk�7-��vN.�$��J�˕���\�����1<�eLR�ҳ�������oq��:%���[�YG�Z�:��.Y)�����z#�l���z��A�OO�[z_��3���1hI��#�g�>W؋Ż�R5���-�Wɪ��]�g��4WW�&c��`�u��ɐ?���9��.cv|��Q�Z@�ƥ�m���ګ[��%�Ͷ+�TN���V}����/�V���,N�� �%�},���a}�Ւ>83�j��F�\�L�<(��z��r=�B��1�Z{�1{),�̀��F۵����8��J�����wz&������r����$.0�mX-[��bq�Z
g���k�ȟ��Va�E
�AJ�z�?�lt��\�o����ݨ�,�-]�ph�nJ�o�+]6}
J����^_��heѕ�z?�=0kv[r�����[��$�ogK��w����=�P�4���
 ���3�LG�q�p-�(*mE�Pҵ�g�YaS�[\��ĺ
:�&�Y��L[���x���NU��DuIљ��+��9Ѫq�0)�22g11s�
CC����p��'%����,�|nș���O�����sW��1��(e/�;�a웾���P�C��y2Yi��*�$�-�K���KL��Ix�.m�����"���d�6��e������
[���a
�V��t	W�KY������+M`�tϸo��FB����*�X(�K^9
ٰ;��2�Co�����r�F����\�v ���XAۚfpʉ�*�O7)sSu!{eUK�޲�*��cԲV�,h��]=���:/�?M�[�^�Js
�U��3��44��ɢl��'/�#�sN�n�Z�r�W�q�ث��]w��JË���t�]�{���Xv�"�o�t���jm������.��\Y�XY�G��dxdם�~m���Z~��F�<0?ϓ0�|v���v��11y/�������z*�b�~Ow�1By��bpêS��o�����0YA���QkF����^DIx���xD�i�)�fx�����Lӧ�K��������b�|��R�I�/А�Naa
��h�/P�_�����EC�x�+ Kt1�Ɩ��ysd��K��J&j��%�)Yѕ=?*��m̭�2��=}��P}x�8���n1�iMf��^����]���^)��W��C+p���k~�FO�� ߧ���#���nE���M�9n/�,�l]�O���ΒY�Ͳ�Z�h�Q`��p(����ǥW��G���uk�q�n�VX��O[�+�
�3�l�www��+<9��Q��-;�;�S�Ued��� ��8�姀��	����c��;�U�P\�� �i��n�^�,��̮�#���0S6�3~�ȠńV�?��ȑu��(D�K(��'Jkq��ΰb<�C�e��X,6 ��i�Pn�R�ݘ �9oN�p�k�Js��Z�R�y/��=k�NKo�+�9:�~l�TjC!�EA�]�#N�����	_e$ �*�(e�(�fX�9�q+�]½|�;��dtͰ�{��Q|/MѲEϗ����@h���i���_j^_[c/p����+�=[�+L�_�<��"�G/�t
'��p(i5!�^��8lm�,��a��°�_�%i�ƻ��D[�q�yC?���pD#~��i���Ep�����1�  ��p@S
F'�,���7:�d� ������#��!�����Le�$>��U�Lp�rb��U1�&����a� \�6�˥#V�
�@S�D�.m�Kj/��o�5��C�z��>�Ҍ�}��o�r*�	�m���w�{����̫��wì8H�adƗS�b��g��P�GrG�]XN";SO|j� �yu|�q ��c<�ʳCv�R&�.	;��D?��8�M+�H
"c�d�A����v+��] ���h��.6t
_�Yf8#<9�ovNJΊ�44��|���F|�Ya 5���SK�L��i<����A\j�|ω�<�&C"�oەƣ���R��"׬���-g#���yB�`+V W
'T��2B}mU���J%>�l�@.)��I�
��` �G����<����m���q2�sdрv��h5�P/J;|"�p��A���M���^o�bٿ��|� ⵟm��΃F��'o�5Ǡ�� �6X��������O�(	S�1�ә�Wm�ǰ���������?�.�c�K��i4��_܅�X��P�� 1E�o \��Ź�D4IMr��^��9�Ĵ����eŹ�qj����إ�Z�8�f���qM�O<h;�s$� O����,n=�?���P��8Τ����#<�4Ѧ���
x�ܸ�۞E
q����N��Z��t�����6?0�g�Q:ׇDl�I�
6\t�7 	��ci�]�=��CWz� m:ڕ�)%(t jL�����zI��N�S�-��9��V��@����F.���#}JH����������\v4�Gs"�f�B�T_KNI��1�gY;��Qai�\����o,�S�iyE��2�H�6k���;c@p�����c���8M�Ա�ps�Ի�K'r�<WkVA�+�LR� ^D�:Ç���@gh����]���{^��i0���Ս.����~D
��$����Z㽵
��73}�Z}��%��e��0������h������U��ڼ��\̢`��hb.۬���o��n
i%�D���s=zN{Lsդ�qG��E�0��jWs�+�ߤ��t{C�}��\���oG���pW��g�+��V{[h7��s��]ZE�\�I+lz�b��,��{�+7���
�_ٛ��Z����.7�G%7��^nv��e�畚���q֌�0�P#Ɏ�!�
�i2 f�9
��(5N�V/�u˺ۜc��
*�;��o�e��6���5��1[U~f��HtPҐg����5wE�L%S}��i�,����OR����#��"f��-cV��'�ʽ�9�Q 6�v�5�<��\�/)�X	Ld9��2��*_��XeU=�%W��_ԧ�(�\l�K��r�K,��8��
�����\����PIM�4���[<3�$X�� C����G�"hp\�=�$ ��K@���׬��yف+�WqR�K��QM�-0!��_�
��ą�֗@���(
�"(�~L�cy����] 0=
�%N��HrY`�G��7
��@�#��*4�v֨;c�d:�L؏�hp�����=�w�!=To�v�ɂ�"�:���cӢ�Jt�h�pOd�5�������g��t���m�ݤ�^x�
RQ�P)Ǳ��Ч#X�KX�0�m�.�}��l"�r�Ơ���UI�!`_�(Vq��%\�g�P`\�K�����B`S����Њ�.4��wJ�lX�&���9P���8�>� I
4��WգLF���3��x8C"o�_�H���*���s�4p�1���Z�XO呱��!��Փ,�#��-cM�ՈƖ����gQ2@5���E�|������veX�t�~X>��:j�GE���B҈���S�Yi�(7�j.+>���mi!�C���W��邒`Z�ڈ�
؈�Hp��˸�U�0� �u�@ `��I)����S6Z�8��c����Nǭ(Si�!s�P��(;�RL�3
' ����r����YM�^�sMc��0w�P{*8W4��RH���cI��C=�xt�xT�v����ﺝGߛ,����Ԁ��̯
fI'@A�U��4B]��O� ��R��<L4ŧ�=������E���t�!��H)2֦RtI��:_Z�Į���xD��D?I�Q<���	���d�CYl��۬MF-��3�<�+��O�`���-�g,A��e0�+��.��ݥ��t���6������%�u�g8�>{h�KB:��k���u
ƴTdH����ir��
��zq����T��R��V�Ỳ.`a�kc��թl����@��>o^�6r��Fn��ep�Y���t�m��t��W`��#ឬu�����N3ƹ�we��-�y����]����=Mr[ٌn��%�0����nt�5�q�W��Tf���g��d���əf '�8HǸ1�<�I�~'1I��t�)1�*��ÏQJY<�+��A��� Q�~����ִ$+�J�`��0�e��l���±!��b�?���!�jϕ7�;�j6X|UFC�������|VV]1�����M�����'��&�0�]?������=Ar�7̵�uQ��J�"upi۸!}r!�Ͻ��c�Q��
���8ɂ�������9��%KD
W>$�M����8|�^�2�Ll�W yI�1E��{|��eq�2�z��3 �x%J�/�?�l������H���?���?�gf���3�����U���{
�e���<���[ԡ��,�!���1�	݆��ƌ���aNC_�m8}@P	lKd����U�X|n,!AF]�|�|ʖ���K��('���Z���4 TE�de�I߃,�6�~"��D��p$��I8ưs0�_4�E��xƒgA"b��K�1�����Dkø^��ɋ^7ԼB�\�2�s̈<�/�.k��˭��������Kݘ��^�Y (�RWG���>m������Pᥣ�z,"t�E���eq�=��ۯ��r݃�h&_�AM3޹y��{�96q��g߸�5g�t�N<j3�/V�R*Ĉ�� V�rْQ6�%[s�ੋ8��4�ߪl�/��<x�ӄ'�h������jIԽ� Q �|��Z�*k�P�5�S�7��ҕ]OM5�^>O��K�4Ř�D��T��ӻ\�66���Rr��TpYe�������׮(E`���|sm�lv��<�7~�B~�V�K4<QS�Lf�(L����"b�xQKe�Eϙ;A��kA���J���4�,�Vļ3<��:iP����zW�0���SH���@m׻6���	T`��f�qy�M�߉0 H��WD��(��l����8o�wY���QGD/	x��x���r�+<�]��qA��f@ԡ>#\���	xx��˛�XD�(�=�(08O<Ѓq���Ĕ�9��wJ'��`�`���y�_ه1��5C�5��:����O��nw������%[{����[;�hM�d��:#�Ո� 0 �][�'޻�fE蚍�UN�<Ϥ�'�?�XN%��(�IC`$�\�a��L� �䉋��k���I=(^�}�6�}s�6�ɕ����2}�� ���'��)m�ɻ�F�
����hچ0�ꪱ��$�o��q~���g��9p��q��+Z��]�˽�E���UZXD�S�uїu�O���J6;�l}_ϱ��IGڔ�|��*�B�Y
�
n1��=޹H�#��{�
97�/!{������Y��.ig^)�;ш~�-�I-Ac��K��Y������W�V�%�?�_X
DBA��TN?�1���S��soY��B�Qw�m)1�
]'�7
O�#�T�G
����J�ȗ�h"��QE^-����QF�⍂�/�^.��"��;��d�󞓇�<����,Q��~�i.m��1
�e�j��m��5ג�Lfc^��D���8��`M5GUL�+�|"f���}/�%���M×��=���d�Iy
$��
X@́,a�H���QRy�5�w5S��T�r������(MM��O�[��Oն����F��<
��	�dD�
��:�p=;�U�-�R�:/��Q��ֶɬ�y6�m�z�?�*z�gp���h�1�e�V��ʹ��"��D�k���/M�� `d *����P��ʃ���9�'����Y�AV��p�1�.�n�2�S�sv�Xrg�9@�>0�#�Q�3σ�(��R!m���:DJ5F���0r�S>���G�e�q	�9C��|���K��P�򞕵��®o���$,��:��'I�4�ؑUD��V^}9T�}����6�'�2A BV���*��q��Y��Y�+D����,fO�T����/�=VU=�{���*'�e��Me�һf97�]0�Cn�7K��~b�C%�Z��1��� 9C�?ӧՇ�nY'����x��Yϛ0K����K^�В[ �Gՙ��W=-��޴��m���iv.{��#i�.y3�nNҙ��Dv�.{�~j����-�Uܒ��\�_l�R\��@�wA$o,H���]����UeJE�0Ն��ǆ%$D�-Õ�B�@~XX,�k�{%d�g�pc��EY�h�z���V��:ԁ���&H����^���zu��㳫�KE�%��mUs�{�v�^yA�hѝJ��
�U��Ɠ��'��'��B	:ު� Z<��	Gx/	�RT�(�!"Hij�$�0uj<l��HYV�Ik�W�Ԫ�� �.��)�z��
w���W~d�^�^����~^�DS'�ϰl��Ka�۲':X�(��3#��I8�6me
�o_8	x����8�&&�[���5�l i���sŨ�N*�z�&ԋS�-�0$<��ڢ��K<�54R�Q
)W*4�K*��CůL%R!�#������YW�(m��ܼ\�^��8D���{�G�9�b�i��e��oei�]����Κ����Ƴ�Y�ؙ/V��g�hB��~�-��2��������ka��u;�p���Rn�s�{��|߄s|�®6�x!s�n����w�6/�M�{�6w�jˡ�?ګ�c8Z���'��?�����S8i�m����X9���͇�9�K����US
����d���l��j0�.zmˈ�!�R0�urIM@w�G�]�bJ������ލ����G�P���0s������Cv�8�,�,k��ɴ%?_{�
��Y�Dq�8a�J7w�:��u�j�Iw(E߬�{����㪫k����aXQqtG��� ��8�`EG���69�aׄI)�%�*P�@�3HV�)
հ�&яXV�'.�J4w�[�+UH�UL+)\	��.v������2��W�`�?��V�L�,�Q�7`�s�����rC.���ٱ��t|j�K�� �����ҧT��t�W WQ�CM/[K��E�cvJT�@��6���~�, �j[p��S	�*��``5<(�gu֨�ǽe�G۸���S	s�*��j������s*�h�t���TUw�:̖��#%�n���XeĖ5w^�g�+����/�w��2�����o��j"�1�C���(��*G����7?��	�U��B�K�k�����C�F���RVѻ֑j4Ġl^�\�N\,�0�玙�E��z�3��15EL]�V"~�:��4j�W�d��y�#�/���'
�3d���sB�o���-'I��4��Ԋ���ȸ��fm�@��qqDTZ�ՙ��o� ���JX�G�ϵ�j�ܗ]R7�Q��8��Ū^/��X¯fS!�_��|���"��Y�bH_�:�A���!E�v}����Mi�������$�5�\��W��k�?y�GM�+�K���L+�㢟6Ց�H=�a24�dB%������@���G��v��[¡���-P�z;6��Ո����Q����E�T�q;�A� /���!�7�Q�Z�^��\�
��l�8��b�*4�
d�ҳeCkxp�R�o�IļT���t�s(�!P`��*�l��V��j�J�tޥ<��r���۝\��l}�[a����6�c�a������"�YX,sw�\��Z1=���#|�oV�G]F���:WI��/q�[�1tq��v 
���w�Ӛu��"�:�A��B:�)��)pg���>c� 9�?�&��*?���A���n*nW������h_�J�;�v� /��C]Uq.�����h�M��*l�%��g6A���4(��J����/V���uӚ����9b����a̵NC��%���)����p>�6n�E%3�Yk��I�]E��ĝ a��� ������;2�St�t��讅YՖ�K-�gS�x�(	�3 ~�`0X����T`=/�Eǯ1W�	<��=�~�ߡ�w�Դx�3���m9��ޭ �
�S�: v&th�y���|��p��(��i�Xa�|W�i�CV>��J+�HF���Yl����G[K
lIB5o(W�P���P���r~L�8�F뎀���ʭ]
M[����G�����f��Y���Lu��z��"�Y6��Xl���	�`jE�ic�j|4��E4����6���M��.��e��ߗ;��z����2�R���Q�^�$����c@s� cL���O-r�I�Jy�l�Ω��,%� )���g$E~o�qZ_�_e�+��k�f1e�bP�;^���hG�C�L�*Q�����l���)���b�R,���:U.�U��Z�Tt�Z��qI�5�"�wK����zV����3$�|�ٲ�6M0���S��JFh`�rO�t2�`�����7��"�����!Z����w`A}�h޼��k�&l�x4�UC���z���SN뺠��ۺS!��
��q�m����p��c���*���U���@���	�[q�Ԫ�f���9f*z̯��#�u����/�g��`MۿW�����)OI=��x�&�N��o��b(]��@ �W�jK3ڞ��(������Q-t
=�.4}TP�kj	U{aw�C�)e.OؒLŽ�4#����̒����6��
hO�+T�"ɸ%��oz�I79�(���-�0��GDLi	�A�L� �p�e�t�Ѕ2q�,	�߀A A��	n�i�#�'U��-���y�ǈێ�u/�]�y�ɏ	K�M휅Q�LW���V^s��n�Wq������	5��`��YTJ�p�f3�Bt�� �QQ;/�Bmҗ˒�ؤi�Cу�/��?L�����e�����Q���e?n掵�A�𸐅�ɱև���ĩx�o��O$�m�f��xQ�������b�'L�:���@Տث^'�ԣI� j�pmn��%�b���&U|I�9�JG�	�Ǟ%�$����������\��P�䊔-�Z
��F�bT!��F�:��Σ�*ܩ7ʥ�m֠��t�iX�碭|����W�ÊR/CK������p��aò4�WW�N�CB� 	�%�#��ZR�ĕ�=]l����|;���F)�Y�D뎫E*���`�X��T����V��o��K��RXX�*�� �K�6g٣��C���5�gT�"��|ι
;���Ö	��,V˼�"��S_��vR���l$���U�~L��X�ꎪ��VY�BMK���~U�-��:�?֎6_�4���a�(��7+;������V/ժ��l$���T��Rk�9��/�0�`�VX[��'W���a��Y�`E�x
��4�(a���^�&Ti�9Ow��]4M_"�WX��(�[��PC�����\�b|�l�>^�uFE�ʯ��FkE	W��Ɛ�~�a����P�����lb����]i+}��},O[K��}xټ�&Ɓ�C�8�V�	��"�D4�Y����9�n>4����O�ڶ��V?v���j��|Q�IY���Id��Z �������4�QQ���Z��G]��j�G�8�0��~�{S���u/Uީ��U��"оz�R�
�/G4#�z�p�h�V�n��Tq��vEkv�U*L+9.�J�T8�[K��f�8�&l@Qv�����#M�Mŗ�1�*����U:�$�u9�U��KtɛF��dh��%��l�j0�S�R4.µ
ߏ'*���0!�l��)����/�N�u}톌�9�V�Vֆ�ܷ�l^1�,�����zn��� .��w����c1:T�mm0L�,��� ��(����MF���y7�ơҰ�f���X�/ϼ5a�X�S��#���O�Y����~��xs��(� �����FU���j��1'�j
υ�G�ٕ/
�[��c�,M��\�)F|�X�㐪����+�2��<���	�턯�|;�}��v��?�N�?�	/�w��Q9�ѾnSk<��5�l�i�����Qpv����4LP�q{o��G*�D]p���popٚ�����x����!@��Ӡ"C����y�aM�V۰��m�B3�c`�0L����`^�먈Z��:p��A����-�5ÿ#@h  ��U��*��/7G�2xq3�ݏi3��n	�8C��<�bOB\>����Ň�T�c��s@���jI�?�[��&VNKD@h�}��I&$�ovo�,��0}Y�~���iMȗ��f���� ���q���88�$�vk��Sy��L<���3-No�.N��P𑦄��N��.�x��$]s�f+�d�r'�_D��a�_?a�LX����e��hC��ql�={�����ӗ?`?�׎���)�Ԧ�,&5_�3F�}�Q�+�x�S��Φ�Un�����������`��RxrE7��Q.L>��e��/��{�{<j�㬨ġ�5
�v@k�iʙg�kN_�,��}�^���9L��	5I~BL�H��H6��BmV��Z��X*�W],��&S<�CP�ŭ۫Ź�H�H%WnI�P��Xኊn5�*+�܎?�E�D�4�3��K5n`�+�!j<y��L׫[��
�����3��D�F����1�l�(�,�/
G�5�$�S`���JYwQ�J,��K��G�2����� i��V$��r�񮦴����;E�iJ�h�\�+��w)j�S<�+;��%�n:�'����V���bH�����@$1��I�#����,�C�V���-�뿁��1���E��[��F^�f�ɂI4F�0e���r�v'���UX|gђ��$c'�CōJ��PR��j��F�2^�j���ɺ�`&_�����Sji2s#c*J�*K��.P��>U����
�x%	*c[{������! *�O��龨SB$�F�^VE�,�P95S�Tb�H�U��>�w<�l����c�i"B7ֆ�.3
�UP�߃6����l����9/�?F�0]��o�V{z�
���`2 xz&!�Ģb��2KoX�v�4���yZ�3���G)byο�~p��;�Jvy	x�����u_�I�А�X��V�5�&�Q��gǹ�kuU1¸o_�Δ��L��N-���c��`��љ^��]k~�ϙ��K�c/���@�_!����I�J��h�VߨߪIw�������|�0X#�׹o��(=�Ξ������Qp-���t8�v���0|�k����g�΀���Z�Y^xeY��{BɶE^��y'.d<mEk7��Tt�uQ�Պ!7Oi&E�B [{/`���u�7B��76EmP0�/���s_Q�S���׽���e֐��V��V���5U�鵧o��h�q�k���KLK�8��'�q�o����q8�i��W��n�-:*�2n��2
Z�����y���"s &��SEZ$,Iz�+��*	a/��4F��6�G���W��.w[�e������*+9i�����4QE���4�S�g��0����k���ګ�/D���k� j�U1N��3��5�b���T�R�N� V��U��de�`�nEC��gpUe��i�{�V>�u��rc�� .i;4	�a�x��D<\�(^\��.� ������L|)�.W "g�(;7����Y�Ⴜ5�p
�0�� [�^�.�͹�w�bH�Y�T�hS��c�0��ht}f��1�Ǉ\��"T��!��DU�o5#�	�\w�`�J�ϕ̡��*J-��~˩��˽}a*��ˍ�Q���z5�L���_�����50V��2�k2m�RhW�s�F��g��skS�M?���-���ܫv�|����N��*o~�p�Β�(, +~!�
���ܞ��/h��v/f����Zh�I�i���{���w ԃ$d��^Y=*o����/�>�N�@
G�@��@\"]�ߔ�� ����"����y��Qp�N_`��[{����y��F=�
�*��qn��v�7P��wnE�����g�LEoJJi��OC���x�Qz�g�Y���3X��FJ���gG���$��
����2���)��X`�.��ߟ@�Y�F���BV<�t�=ŦL�����@1���v�]����4[f�S$����n��į) �b��u�p���N���^��y��yq[�6��G�Bv8
'�q���>��nUv�*'q��Ʈ��V�
UY�ޞ�b,�6qC�lj�ϫ��5�&���?h�cŮ���{� �v�D5��r�� ߀���W�[���5�zV�T����Խ�bFY0��X�*h�#����cHu0��L�EiLXq��prO��Ǧ��?Y�W�)���j���d��Z'�sD�u���e�p��Q
��f
z\�2$���pL�6���P=�.wֲ�[4��q��[�C,
�2&�\u���H��[�$����Mш%�M��<�Tc�Z=*�dg����^�����P�h��L*����|x	׮OQ��#[gC��~�O�$��Y�3��A<�=�۱��9�I����Roq·­��hǩ��0<�j��7�i�~1�GW�,�e2�`"Z�]��l=Mh �֝L��R�Q2l#�UfG v����J0��잉\ԡ+�P�ģ9�l)R�mɚb�,��g����ߣ�J��^��Ϡ��d+�T���D��wX#�a1ίJ,�\	2	Ct������}�@8��k�~�E< D�&nUP�\�
����[�^��u����=
�ߏ���9C�{���@�oWPp
�
rf���
;+�x!GN��������F��9�S ʈ^�,O����@G^�D8�Ѥ�#�y�0M#�(0)�)� ϳ?�D�F)�	\�`pP\>�a�S�� �X��"�|Kq�R����t��#�)n�`D���"Fa���3f�O
c*(�a�
�HW��Z�����R� �D�x���#6�<ra�k�d��կ ��ډUa.+�=?�|���B~��:MQzK%<�8�$��7��¨���5F����P-A<�@q'ל�)����	���2������*���S��`�Ga�%p.3��0�`8��)�y�?)Ɲ��z�VD��5ꝍfwB��Ŭ�_T��%�Ώ�V�� �b�/�h[%�~�k�:� �9p��<���s����[���6eO���l���k�!�I�,Z��E�h�8�΄1���1� �(҃����a�T+��;�	�P���;�����*-���+�e��r�T����3��;E��0�/5���S/�,sǊ:{��}2�I	Y�"�v �5�t;�e��AiF�%̿���CQ����~4!�����ӫ�o���/E+Z�>AYj���j꺟$�u�<��ḿfmh� �D�
!.:ɚ1Ny�ȧp!&��X9��<�hz�a��!�Hz}#�����^s��wa'Į#�U�����p$@�v�Y�-�mߒ��|�	�M��B?�`4Sș�ݼ%)=��Q�V8���9��Јr�Ƥ0��[��K�>���k	�ƣ_�Tu��W����Gp?%'��s
���2W���{~M
戸?�2��J����T����v+�
V/#,�q�J���� �?	��O_����,�Zo�e>��B�b`|�|����*s��/��h[h���K8$�=���*N�����ּȇ͇�Q�Dy����F���a�đz��;��R����/�Ѩ��|ae��U�_�W���z� ͮ�f��I�� 8���z�-�DA$��:�bu��`��P�D��4�=b�!Y�3��m�o���h��1���2D�6�C�і��7z��b����&m�^Z�<v?�m=�f��'�ƣh��-�ϻ4+���mط�ܤ�)�7�K��c�m!l��~h�C�n>Ӎf�Lձ4�ʙ̩��1"�G�������c���)���C�p/��o6���?x�l�.$�'`F�5n�k�D�WbO=�l4炇;*��]�׍7)0���LO���Y_�`q�F"�!r�s��h#X?{�`S�ZS[?n<<kܔ��U��q��6���F��&h�9ZZ���Y;d�c~��(�M��s�p&ŐM��<��?F�V��-s��?�����"!�� ���� +���u��ˍHoFTS��,^`��D�h�!�Fy�L�6R�����}LM���9�hN]�2)�� ��m � )ě�Y���vj�˴gQ]B��m��d4�.i�3C\D�c�78n�=��Z��7ͣk�_T����e���	��:�����T��j҄7�}�a�e�xq�!�z�yA��لD�v���y+�90�4G�-�	3m$	

�͓n�l9
��hƳ�]��
{��6��Ѹ��	*���7��e��K!�^�G��5�-
��G
�(RiF�2V�\��*nVUz�=�7xmG����_\�B.��T˷i��u�:���8�M�b)tͫJ�t�����WEv1FO������\��S%\��P�d��b�0:s �5�;�����+�v��U*���V�˼#1�]uc�0�dbC^w��:��a�J:�W���U�؞\O�g��E��t�m��*�6s� �Bk"���)�Sk��
��Xzx�����k���>�Ɓ��O�_�����3{�����n��r���Ѻv�^ �j*h����y�
���J(h ���S����Q}��U��K��y�(.r�=�I��8j�=���T$Z��VUD�k����b'��7>�Z�,i>���a&�|O��	�����a��#�퍱Jw8,��Xx]�_��4
�O	(�W_=:D�v��'�8��+_����(�З=���3��ܭ��f�e��^WL�,A�:��R��J��Pÿ��_��|�=�j����
��
�㈾
��:�$�p�}�j-E� +�Z<v�~��o�8Ĩ���?��*���W֫j�����啾��ޘ�禑ז;s�`����!w>�D����MV���3���N�R�$!�W�H������3�(���ũ�zɱ㿾���]�d�t��ĚK���$o����Ճx�L~^��NZ㹄o8]h��s��ԙ׵���0�@�T
b�_�q
v��
Y1$~=L2�K3�1W��Ǜ���zso�'t���Z�7�% � ���W�+~��\���q�=j��-����(p�+O���3�_7�x>p�l/̌��Qk�:O:En��?� `|*۶������}s4��5���,f4k���"+�I�U�� �ؓ������eQ#$�ŋ����:����
�a��(�!���n��p�n��롆le���=���"ut'܃I��>��������
����Z���6B�ӫI+�e�I��S�4�2�v�g�k�-�-��N�������S ՞
�tS���÷"�p�ι=�4���ڡ4�IL.������ $�-_��S4%���,�qGl
�P��'ɻo�|�ޡ�>��r�\����"��*f!�/��2��F�������^��_nr�����V�1H���{����G< ��zt ��$(�/!�z%C^"���X�p�,P�v��>	�Re��I�D�,��/�6���:����cBc���]J�^GW)�M�#��SK����;�ZwC��"���5Ը�'��S����J�1��6l�[�����T���m�;B��e�*�.L1�U�/�ƦOv���5J�������tG��I�D�{��������a�^���l��{��}˓xrQ[��W�|�O?��+��}L�&4njw�o�Q�H�nܝ.��$eGDԟ�
��V� �9H�瀍��x�ɜA�}��֎��`�$��*C���3rD]�K�o��jsV)o��&�u�<o	'��t�{*�J���g��t_����xs��� �y���q�kw.�6;j��]�����I�z|<���R� �{9!'�%�+�iwIx /aQ��p�u�Пo�wFs:��3L������2E�i4���~�9�lՏ�9[f��]b�%����s��~�4��G�ǧ�Oٛ����g��/��L�W.�r�G�Y3����ИO����Q<��w^z�UG`��D�s%[�P������&Y����3�0Q3�|�gܜ�gL��dT}9=�$�9~ބ�ŷDaK(�E�x�4s�%lgi�<�ee�g�/�$��&z�K�"�k�Jn�IR�΃W�I �����c�|ˡf'_�����jPG�m����*]�PY�G:�󀇚}R� �U��������Ãcv���`��h�`��%ɛm�k��c�k�J:�g�}��*��n�W�O��/���÷�������Eq�"{�RlA��ژ�f���Y8u���%o��Lb~OU���Q��=>F���rwH-\�a˺���7�C��J��B~�q��y�Y�������~yx�9d��O��X`�sw��N���(ğ'��^
'�oO��9�vb����U�.Mu2�I��V�P.�,yi�V�[Vf	�H����Q"�	K ��x�3J�,K���
f�
?�yLޱ������wwI�'9���!������,,1��1�K����h<z�[C����*\�9w�9�=<@�^�.�O3��$$V{�!v�%�:Y��Yh��)wիO�|��z7&�H��f��c�w�[ѳ C�n�m����z�޷����`'V��|쫃ܱ�	k�v���S��3��~���?.at����8�{�������r�Z�� i��<��U�Z���0Z���Z�YE�Ay�>�:K�nxm�;���%��rY95�*�����%��j��D���jտ�� ���N�>����mƪ����<Lo*w��G��d���B�R��Tis�4�<�\�5n����f���tY�E}p^��`��� U�yzrp�wү�Wo~�%S���<����D?p�L�8r|J9Gmq����y�٢�d+z֡你�]��y�~~�7�_�[�'��/d���	��<<$a���Od����C��܍qvc�>���Y՜�c��9`j-���ڼ���������۹�7�]���*�ʶ^a�].�����v�n�i�m$pc��.�ʕj>���t�.�îB{����"Đ���c�2p��d���.b�5[��[�4&�f�2��F��77J���QZ!�9b�F�2����bZmi���0�.n2�~v��>�A��-�y4 L0֤��j+͒����*�o(}�(}���7o^��޾|��f[_>;��"3��M��[;�3�(E�>���ں>��cN`g
�G��>��q$�2�-�S����ςdXf�w^��?ϼ���Ȕ��ە�3����4���s�5��7�	L���R��Dz�<��<��
�~V���E� [X#sw�%�R���(>F���i��a��MNs(׆C�~:
&���n��k�:6EC�5R�$'/z�����'JP���4D�����O:@V����cw��.����z��Y+э�֋0��[BM	�(���o��0�|N}fR����W׊��S����z�3�#�h����2eaH*v>L�)
J��䟫������	oPːW����l��<��,�)�(	��B7㭼��i+��8�%a�j5׫M�P� �����V)�z�.i@�EWˎ���\P�dOJ��,�5t��o�q�G�l�	�����:o������(�%�ٌ\x.:���o�S�zcw�f �	CYX%�Ui)?�
��)m���ȧf�ˊ���7��ݞ�}N�	��*����Nϥ�"�w)azD[��k	�3]��lqK��G��9�*u��''o���:�����������d��y>�e��C����W�����ˣS�ë�������Yj�̦�s�vj���yY��P���ŪB�<|�I� 03�v�¤BĨu�+yRw���W�4 @c
��m'N��0.!�	R"��x��=
�Ƀ�ύlsH��g�;y^��8�p�.	�@�Mt��&_���9��u6�,fMJ�|�[�_��0�QU��Z��e���+���P��td��^@��6�7�1��{�\&>T�W�ޣ�=[�D+X
�W
�WǕ��^�y/; 2J&�D��:%�r�1�y�#��8+�lߡu�|J,_�
���yE�c�
����vaG�£��]�	�{&Ҧh�K�
h�J�e=�~]v��JI���s��	�d�`6�j���ioL�SGA4��f�zI�5ِ�0�fn��V4<C���x�&t�m��'�*�� ]����$�l$��@SXq���s�S�xT�����8Zw\�N�@�L�_�N�hRb�,�f�KY}�0�hl/���o*���y��Z�:�5
ϭ�]H�l���L�锓�j�;|s����6���WoO����H�zsxz���[�i�|��l1�?������e�2�3���q�9ÝIx˒��Y�P�<
�sU�
+* ��i�b�+�
� ���p�LW��tFћpoy�da��y��t"t
�T0�������<���w�a�ƓU9����Ⱃ0��`zz}�S��{�{��c 󼀵�)�w$8X��w���,H�Q0�$]�B&��S4Ab{�����$������j.�s��ƨ���~F�π���+�;��pt�q�W?L��l���h���ZcW0�A<��F)��~�����#e�	v�L�	�);�^"x�鮢�R$zC�0���
K;����=�m#�^:5�?�\;�ؓ��F[�˽oͥ����-����zB�~�������(>�`��l%kH����[��Q�	���(Щ�K�J��'p>�U(�rJ���^���ץ��*��]R�&-�#�������R�F�f�v��:�9qQʎ�ʬ!�>��tY諅8���WT�n��ZGt���يNP��=Y,�~X�#,��*VUc�
(��d�����Z__o82����)��Z�>'H�F�;���q�� �C�j��*lհ���E/�ڍǠ��S�s���}���`�J]H�]S��ޠ��oh;�t��m@x��c)�7��z=[E��.*^�I�3?�}���)��$��hy{��� B~����9g����֛F���h�f
��#Z*�<���v�+�N�Rj�6����J����ݰtd�R�� t�-�v�����o⯨�h�	rky1n�q�ñ�x
J�q�P�=}o�r{�}���v4J��6�V�ۉ<�Y܄Y���L�a'^�j�'`��rPR��~>b��jҕ��!��sI��M��<���6\Y"%��!d��_VEN)�߱Tir�BG�ZӾ,R�:��w�q��p�V��iT�
<?7��0<��E�*��9����
@�H�t�DxAu�dP���.	FIߑ$`]�
Y����H��Tp4�!�@�P�ޗ!��B/���Y��7[����:��4M̈́=4?|#=�X���~\�땻���m����)bս� fk�qR���v����e�v(P�K�����l����u_psig�7�C����)"�q��o��Ie��9?f7�3%BW���}��w��8�^;�G5� D�wQ�>�`�k��Ժ�,���Zl�Ȃ���q��9 05_Hy��x���Za��=�X�
L��)���ڋ��� ��nh�2���n|�Q��b�B5���2��E��`����=x!x���f��5�迕��q���2Ʈq՛%�2n韫�z}߰��pC)�5��=,�:Y�����P,8M`}�����dה�#ŀ?�Dm��k��(WZ{���ޣw����l�nm!X�ث�O����Gݏ��K>zF�W���ˀl�w���P����y���n�����EYG3fC`-N:}�<kx�<�c
%�e�7n[6��;K�x��33�O#]l0�bkϲ�e�.�pk^?�^����a�f7��
���?(�p��k!����q�6ց�W'�Y�;r�N�O���4<��	�h���:�o�ND�ܜqԹ��@�(�\���wݨ^�{�Lxc#���TD[�#�D� �
�Hfg���V��҉�a�T�ȗGW�,$ԓ�S��;w���aE^W�\=� SI��|O:�*6h4|o �|�y��������Ӄ�׿>�?�w�y�;��-t��>��qv�$K��l<F����om� H�s���������c��,m��_@ʀ��'��K+�c0���ϗ�suչJ-�
��c��^]�T)(����X6=�Ga~�я)�J�Q���4H-#���ȧ�s��8L��0��������i��(��F��>��P:������=�W�j��,�;�i�#�T��r�
�w�!�B�
R�E1!�xڡ�z�g5��>�\3��'����%nT4�Ur�g�5jLU쬚��pi��ac�I��Tl��q�n.�Jw�]���Yz��/A�|�p,��q�#�=�'1�����w��^g����8�
[��k���|�,�	�c�8�
^W�*���`쉘~%.+W��3o>�t�0T�N:�`��z�~�Sz�$I}EQ��G�����7�wB��׭��_���45��˺˒�Ci�I+|�����*J�|�����STc�x��?ȯ�,�����yӱr�_~�~Q��m8�%����|ʡ�|����q~{��]e�Q���èL/��1�5FJ�ݹ�27{���ǝ�;?�k�_Q�5#�����Sk�$�+���i��;U�I􏻘iy��1į�-���"ce�:.�����h[{�A���SQp�)��hs��_���c�g�J��7���R��\U	�_7g5-�K�����W�a�������S'�e��7N��������iɓ�O�la\�W�ly=�l#�K}}z�~�ՃO�x�[Q�g>��1�e+2iX�3L��'��-l�:���8u�cp5>�B 
��ʮOaisv؝nC��������_��`[�J��x����"�i*
�
�9��z �;|�UC�ƍ��w�Z�7��O�k�1����#��m��Z[һꓷ,�-�"o����|�1ކ��׏�0]�4�1=���9�r��y����I�����wr�ՃC#��r��䓣�Ҭe���w�s6����i�Z��������{U1��~����3�w�g\����g\2�vƉ濝q�θog��w�5��[ws¡G*�+ζ۟jE��<�R'Y��j��6�(��e�+�a��@4	\U+����p�	���9��  ����r�H�.z_O���)QU%R?�U�Z�m͖-���>u|m��(�A���9Et��ٱoOĹ=W�J���Z+3�?�@Iv����v� ���\��r�o�	4��ПI�=0$�(�T�u+D�Ƨi��H��i���$�*�F����p���NH��أ�6}N���#J�p�
iMF�yCo��߮�.6n�Jc���� yb����B]l6O����oB�s��j�)TU���L���N�ӈZQ���d�jE��k�Ee\Z�}���7Ѽ�ds��[$���H��fH�<�])!u�HHU�\�����NM��*I��-�Zs����h
��^Vw�X^G�7y���Ă��:�q	U�9u�Oq�z�;|"�'}�'T���c��ʪ��0��o���(c"qo2I�� �2��k���a2��f��$J�~<�F)W�l��`{�@mm�ʩ'q�n3\>,Q�/�h�5��V��`�7�_�ׯ�n�I$r�O2i�i�K�
x�eYW|F'<�e;BQ�'T'�0g"�;�5w-���HS�s�΋�D���!��I)�\�
I~�c5M<>���Sq�	hBސ�x�E�HL�R��(�2DU�{~M�)a�L9(R�"P<cWA��}��F0{A��D{mO��(�A�E]
#��[�0/����@�
v�@�Q��[쵽H���s�zKhw�4�IƳM`���fN��O���L�;����D�z�A����7,�$X9�pP�3x���H��5H��1F
�?v�����@{��XY9XтM i8���~��(�2v�
h*�L5�yI�Q0���`J�R�̠�OH
��L��4�HR�@�K�q�,j
����`��*tG�%�=��6�[�a�^�T-�*KT(�ER�ݪ(橦e���i�f�X�7	;�e�-2<�їW��@����Ҽ�� Z�`͐?���zGGǇ���m�Y��kF. �j
���V�/�QJ7��y�s���nI��:���%ضkA9������K+�Y
���H�/|U�5����W. �ʊ㥊�6͖�kc� NP⍎�
��Mp�%�щ��
V�9G��r��#397րKd�
�5L� �P"��`���T\t��R9�����OW+o�nQ!�(>	.Ա����ѷF�l�a	T.}���������Q���!�+��2� ���<HE6>��;=h4�$X 
!��ht�[�Ԑ�
��%?�B"�E	�h$�пcƭ��$ki���l��CA�?�B"(Y�w�o�yo������1R��*�ԝJh����a����£�OO�u]�����́�����IƘݚ����r��^/�ϦVg�*�#r����s%3�F%��$y�~U��M�$�@��BYC�%�c/I!�\x'��yI�"�\��WBDM�82�N.���@��b�Pph Y��UhE��gՔx����P7jƠ0�l2v�$�H���w����s�U�$���V��ɀIp7����=b�p�m�qC�壇�9<5��&�O��N�EtE�/�{оI{9�WHo�9�(I�h
ʽ����j�X�/NX*��m[y:
-�����(D��`���0m�yA�pMG�g�Ů��
�J�:g~rM	�$�����؁i�� H�ƭϖ��5�o�N�nDtcXT1�O�Q�4
@��ȋ^`�k�'QZi�S������}S�о�
r�)���W70�����Aj�`�0�_Ƙ���5C�{��zD��1�Q�_(��ʍ )T,�z��Q�1L[x��w���>
|K��[�xu"��
����Wr�[��;�]�ß
R�;�]���y�Pf�pK�S�fyG˅�F��$�AU������Q��0}�Hۉ� cL@��>�g��s"�g��$Lվ�x.z�v`b� &g����2�@�	7�PI��st��1m�"3����Y�M��t���´=��M��H24��&aK�q���z�aH^�䛒=
�Y�9�v��6lM�r���s�j��ǈO����)}]+N��h�����&+���Y�%�ǌ���j#2"�D)������y��_ܦ����5C��6���A��ZG����ځ�<o�O!|�gq�^�,͕��a��J���fUP��|�|}�2.�a�F`��yު�]���>|�,��s�6ԫ$�����o>zTն�~��}M��i�;k��/���d��Y����� H��=�nw�f6�'�����jz_����h�#�Cp�\�v��xc��m�~��.ٽJ�۫�ժ����dU������C���ře�����J�Е	:�s�����;y��[~?�wO�%�B���d���]F(�y���O_��[e��1�EC�c�hqC�����@�@���t*rr�*����l{(���40������Ʃv:T�1�mX'�aْ�p��ek-���8���᧬��J���f)ڭY���d��ʄ
�k�ԓq����*k��6Yg�˶vܺ~B͏���S�d)�������2Nk�m5Q��<��&��l;���(���Q8
�CN�:!4x?	C�1lr^����!!�j�����B�p(�����Sz��?:��9L��}����@@��Q�Q���GYo<u�{��H^���� �z��0N΂�$�1�,[�vѡ�� }��Ԝ���V�=;X�J�I���
o�}Ca�� ͸Bs���=J��(}��c
Kﱍ��޾s��3���R�xJ/��*����|k�I�_ވqē���i����ګ�}����������=z�?A�t�����i��a���n�B�S^���po�-�:wK(�>ܠ�֞v�x���s�<�לA�*�4�������kE�t�Ã7��LE��k��T���'��_���nL��X^wh�7��$��F�jS�KgSG�=�-�.��6r4�WT��v�`8N@��ec��f�Y4��?��?x�]�qlH�շ���v2�q�O�<��ʿ�K ���Q�1�6��&��r�Tj^� �u��.Ԑ1�ݍ��pa[Х���8WWٛ�����\����l�����w��aї�T=`�!��9�ip&ؗvŘ��$�\�6��c1����O�bv�/��$Ƣ����O[�SƢ������z��g<`]�~���]ZMY���%�/V7q	���25Ӗ�*4���y�GP��28��G�Rq=8cv�`��Y�c�����}��u}�w���qӼ�����<�X
_�c��Uk^�e���
�v�րV��ϡ-#�C��57�Ĕ�I�^�%�y��o?MiO;uǕ,������6
�YK��`i�l��I���������p1X�g��<a	��d�s�����(�[���%1,�-{��XdU"װ�)�uq�[���"LA�ʆpPO�����-F���t�M�` �ҍ�	�P��m��2�b &�<�~�
��*�%|k�^�n��A�@7KKEN�k���cX����=ֹ
ד�����a�a޿@'�ùRI�p�6�6ָs�_�M��I�5bap%��Zj�*��;��Z��j#�q6���n��3
邶�f/�ɍ���ȳ˾uFo�^ɀ�hؽ�̝]h�����}�?���h�����5�����ޚ	�|���E��]�ui�/o�U1�6:p�ba�ci����6�5�7񀚙�uo�!�ֵ�%�8�4F	8�������}���4�,Z[�w� �� It��I'{�xW�Fk+���y���Nr(�Lҷo�9G/�OQ^�X��p3�
G�|�/�\���$&��Bu���Q��t��I��5���_��,�y2!��ω
�0��N_`���)����Q���^ O��9�e3�h�T�w���\{���-��;�=�%�
&^�=�f-��~2B���#��]�q��f��X~�S��c,��@EY�C�%Vw�?�R�	Fp�����fYՍ 0�X���J���8يP�5b�ى ��lIE2�.R�t<ӵ���#��K�)8����#�"D����_Vv��T���5C�U�ǗA
�hU6�Ps�����nT�\�i�qk���xb!7�B��$ĲtD�x��f����9���q��R��a���Y�g�Y13����v�Q}Y4�Nk���8q�_)~I?}�M�^I*���&�C��3YktԘp�Q���Q��Z2�}�����ј�J`�%�F�HG�/��pW�X,�+o��Fs�@�sA�RI Q�ʋW�X�9Y�_X��o}��+ztڻ��Ķ���]��yd|�%�<�_�"ju_먼��p�z�}��
���
�K|"� ,�rr�#,�W�Ob߶��P�+:DClG9*�c1�~J�f�^�Q�{_�(��.Ʋ̰�RC6�^P�q��ﮱ���N�߂�H:��)�Aܑ�;�>WW4:�Һ}Ch�D>�C�?K!��m��*�\k�e�L'b��R��[6���7`�W�����8�d�&��7.�-��^w׆�s�*��-\��Qc]5�-���k�N�w�}�%�6����}�d��=�t�ѝ8�����QT�MT��Cb\|S,YΈ�[h�oCÒp
��	9_Lp`���������t�&U��mhO����3�f�S&���PE/�e��ø�k`�gL�T�W����V�� ��9�|��S r��@�<>8�}i�߳�S�-x���=	� �$�P���'"-0`�k�(��P��w����qވ���7L\���{QO�%�Y�u;���ݭ(nuG�mt�	Thi<뮽R+ԩ����W�` !�Ǟ���]/�I���Wa�H��\f?�6з�s�*|M�mPm^���Pl$":���pgq�-��U�8��q���0ǯ4���%�M���B4b�?��#���P�a�Cm=H0�C�����"�<�[v�,��B�K=]W��r�U}�|a�~
EF��	y(۹~�vL��j
�g�@5*h|��a�jÞhd���Ϙ�z4���p�3vs����M4׻a_kJ���8���$�J5�H�Qs)Q�#br2�OpƝ|
_f [l	
E`N��q榦^��s���W����W��V�����J�̙���#v
�F"������=iD�m�� k�O�[���rs�q�)i*���u����Uϟb8�e�Q�<2#�D��P��J�����S����z�?_���簞���w*�h��b��F�l���w̠����w��)毈/f�r �~�9V�b?�~A����s�+ƅ/l�
t�5w��h�'�Մj:�'L�Yn�aL��Gl̓"+f){;�Z6���ӯi1��"���U[��5̾���&�#Θ9s��#����1/�6CcG���}�_���9����-6cv�G�^*�*�;$%.<�l~R�|�/���Ύ��U".F�C?�)�^K�,qx� "��a���zl�- K�N�-��09g��g�|[�So�2�i@*��yT����h�d��:�#���H�R�V���0���)���ڹ{8A.G:�m���[J�_��(���E>�=Z!�هH�A���.�)��h@�F-/��_����E$`^i��M���Q�/��=kwy�P{�o��R��T��,˟'��	�ѭ�`�	 xJ���˄'%.jo[v�L��'�=a�����w$=�.E�+���6�%���i�rmXV\\>��>3�{��XQ���{��w��0n�W�1�b
Rơ�
���u�~���=��צ=l���k��y0�s�q�RiKDV>����燿�4pM5�&&��
�l3~v���j*��ث���q��Ԥ��=
U�FD}����R�t~�?����X�Mmy���w�=>���~D{����aR�x\k�з�I
����@X,so�Op�(9~�<c\�jQ��n�F���l�ɵ�]C��P�cb�TJ��[!�n:p
8����up�F0��%��z��-�6i�0�,P�*�	n�`S8H�j����)��cZ\��j�E��*�г2W2_�H�+ᠪB<�ɵ��ߔF�G���uB���Y�g;�̶��� �Qe�ڛO�U�: {�J�5�c��U>� ��'R��#LG|��?���4�m��ɋ|�~���5�HY�4���e)�Z�G��4wUP���p��泉��w�ݦ�k���US��i�O�[�D���7�\��/oS��������#�o��ߦ���� `;���ݣ,��ˇh�"%X�>h�h�"wQ_T���Κ���WF��d����>v�2;���=������)d���7̇'��c���v�AP�V	]da�k���XÚ
J[w��Ok���t�(��8P�C���wpm�t�Ď5sÎ�O{F��5��	�`lvՍJ�T���R+�=�ke:�'5���Z1�۲����U[db���x�ouf'�B�-i��gX�Ky��~��MP��>��"XЍ��l�ܯ�ޅ��H=R���b�_�j\Fڜ[K��)pM1mH
�Jb�">\��!U�˦��U��&�<�@��!��5�>̀�-�2~y�:=�y%�����?�-����+�ܖ��N����3^�2�	}���e+��7�L��F������Z
i��\�%5L�鮁īa0n�����vֈ˼�)����v�?���%j����\���I���D�(��C����\n��v�u��rj�D�*ʦ��FA��J~g��ǧi�9J�����").	���-:�'��A��� �Pi\<F��bD���b��fbW0���dl�P��#���(IC��ç���_��O���}.._q.����N��;?��Mc�x���|���L�ܘ�����2���֧g�>��W��D����*hK	�m#�|1�܁n�7��& ؟���J�I��Q��zˎ����Jjr?�-蟬���w�cF"���k3��A�,ѫ���S��g�q=��8�3�;ɾ��ϐ|��Y!��j�%Vx��{E���������]�c�íV:Y���*t��iw�T�j��S
Ӯ7�]���Ê�~AgU�A�.o�oE���o"��Ҙޚi��W�)�Z�_;�Zx�aD��p/.�&�X
���Ę��E�PrIv7�t�ä	H�j1�N[]zV���-��q�h=Ekj��v �+G`�f�@l���[�J;6�M�k|�8z�����#�:�7���&��?U��XF�a:kf���b���4 ���h��k�~�d�=�w��v�"H{yk
e��ع�ۺP~�����-:�N%׳#®�,�\�HM���B_�1[
�l�9�����L�_��	���cA�5ٸ.&��e�h��7A+�3P«$=j\D�O�X੨���1��!f�f���i`��2 Ac;�ɂK؄�H>�V.�K����'}c��I���o���.Q�VmC1��dVw�m�zm�|O~]�t���D�q�h	�ɨ�'�Ν�G3��i��\��=�������}�&��9��v��y�,�3���6l� w�:�[���B�P��T�RR���R̿ZγQ����k�V�Bzo>�4IF��A���&��Ȃ>#hM��ƫ���2���W���-�{)Ĥ�A���=땬��.�ے�&μ;��l�������]7�"Ϧ{S���A3r�d�_$�dixW�����Epd�4$oCa1�	�u]�3Q�|gO����S����]b�(�YD(V���|�?�&�S���)� [u
�޽\{#��6�V�k�7K4J7��W��u_�^�WK�&q�8<���򿪥m�&����ڑ%"*ە�C�D�(�*Z����0�^m��zų��7�x�_�V�AC�u-�;ܦ��Ju���[F�q8�MϜJ�1��R�e)"~��[=J|�����.:b��t��,���]�͗&=����/�d��Ġwx1��.��[��־�?pW�U���8�u�U��lH1�;=��	]Wr[
�cR���ɭ�R���Xy��tތ���O:ktl[r"��p8
� Жս?��g�M�>�e�ѣ�ԏ���I�nޛ����b��[��<�,�B�$蝏VKWㅵv��S��#�IRc%3�6���f�h~�#���<�J�i�s��<�D�6��Po�7KY�Y7�~���_%�я��'SY�WvM�m՚�6��2�^�䗗���)
7���<�ϡ+�aS�Oiy	B��nb��eLF�f\��_�L��g4�!~</���}����v���F[LV3ft��+�3�0�(�Ȁr@'���9\o�!XI��1!��ӷ�I��U��m5jg.�D:OZ�Ȋ�6�h�T+1t��8Nr(O
���*0Z��'�_D?�՗bA���ɽ+0K���`�L�QT{�I���L����4{@���6,���,}��l�6��,6m��5h�)]
�@5�nV�'�o��N�+�Y�?ݓw+ȹ�|��V`���3��Q��h	�e�G�Ķ'u�:�VL��kDwR_���Q�����/e�f���s�mCp��0��TtR��\g�7K�|�*, �*jZ/�$oLX�z*J��]n����q���0"� O�����OSSܡI�����N�d@2���4͒te�DtP[z	�2�U*s,�	�Ց��p�JDQ�?C�!�;��{c�i��Gu�57�t7>�2.��&���Vz �}ާ)�ek7��dľ��摻8�z%�Ͳqs���&a����Y6yd�m�z7|��a:B��p�y�����H�N�4-GK�a�3�A�
�0O�ˋ��d��d��7� �C������󗱣`��A�����Q�I.X\^���5���t��9m�1tM̵>O��uYe���'���2.�!-{+�� P�Up	�*>v����Y�����ଵ�s�3W4���{���H!�b�lVx��%r���e�������S�z�U����ԥ��O� ���p�}*�'-O��
B�:5��P�'���!�iT�S�����^R����"��m
(��7����?(9�W�KPZ�b�_.I��xt��O�M
�Pv!;����u s
5��g"2U$�ʹ�7� 8�0\�8��$9y틦9��(�5!8��#L�E�;�/>uM��~ Ju�1�K�
�
Fg@&u�k����/��v�I#���&���̫nEg�d���_$t���,E��m�p	Cv���.�D��*�WT�79S�՟��^�((ʏhK�u��nmPd�<�D
wo)���oU/hUk)Dp��E�{+[~[:H(U�2K�Tt��[��.F!�o�����fF}��˷��&
;�j�y*�E^�
���uM%]�=�D����L�c��UЮ�����Z����ʋ,�(U�H�3N3��Gi��(%_�Hͳ �A���|�В+��>��lI���
��醈`�1,<=�@x��(�p諳0N�K���H$�_9�
�P`30{f�dY�e@2i:���	D}X~v�N��t~��UBY`�Sپ3B��w����;�>�Ce�-����4�ӏ���Tl�/�&	W����MgMO0��Q8"Av�I�7Bs�z'1b��a'J�`��k�t�>
	w��.��׻q�0�[_��3 ۘ�ʥ�%LQF��8l�^���2`!�����`���V���k�_�i�J�8=X�(�e6�_��fc�/�?�c
|��W���K\�)�Xe�s�!y��U97pau�M���M��8vw��L�Jg^���tA�T
ݣU�.����s6v$���Av뵁N��/��|�<uK~��?զ�;�MⲀ�̃��_����l����޾	
����BFr04��s�S�"ܓ֝c7X���Y2��&(�+�)���!�r����#y�Y^>��ݎd!-e]��蕼v�T5�Oq��"�׍��7��Ż�emE�2��O�kG�T�P ����-\�:�Г�Y���'�e&W�Q���j��G��aC�I�(CN��[g�߂��)�姩J5������!1,T	�A4k�qܱ�H������9S��&4X���c���:������R���g'vi�_5����b�����!�YC�zG
�u�)X�Rߺ��T���J���m=��4g���Q�x�O�Q�&T*����I�+�ZT�-�2���Z�չ�~O���	p��"��L�WF���`|kU�����T��S��V���1;B��1{�jcw��DI�/Hہ&��O��)�F5,�S	K������S�?��O�k��������\u�?�^%i�����R�

*%��U��n��S�����SIu�`�Z������?���!�B[BB��'5���ғ���
}D�G,�Y?*��F.X��F�m�~�Q9��T֑�,�YS���}U����?�£�C�1������O�=E5��,3�]�\�c����U{�n�k/s=�l�cd���?WJϝvkI�#�Ł�h丘�FnE���e�T,De����Q�#C�Q�#��eȾg*��$O�`4_��Ƥwg� K�\�\�w��	�Y�pm��Q����ӰF��]&� �b>K��(��$�J
.���)ص�`���qm-\�7�2܆�'�xq��1�<�	�M�뛔�i��M���<_O�-c��h�c�~.T�L>����6U!�u��Go=�j6]U����5�O���0j��5s���3�a9T�	�m�ԨA.���I46�feIr�Q?V#/ZX�m`?���[�ӫ�߰��K8*��/)M��psǭϖ�F|�M"L$�������$���z��`�	Z�~��Q��'Xd�D�i`�ǹB��0�p��S!�Ő�a��$��/�+3��7��4e���Y.h�!�]�
]xu��	�;�F������q
�d<Ȫl�g�&�-�����:kkk��6��;������6aJ́�:)��L�Q*0;�?4��U��8�\�i�7��eB����Ҽ��!CިI`6��BY�/�to�Jذz١2d��<�f��f�n��	���k`+�RıNg�S88|Y[p�5���@�j���X.�fl�gVch�2�U��K5�q�a��	 r
��m�>�m�p&��z��p��[T�2g����7�ЭZ:���m��y���Z����
����/�Z[f[K7��Լp��L�������l�73�u����rwz���rW5�;cOhXW5���3 ��>OG�h ն��t4
R��g ��g:(05�L0	$7�n�R)8 ڞ��e�>	����	���.50ȃx�E�@��r�F���Փ�tX6�V_׹��p���~�>������n��� ����}���"�����s۠��c�Τ�a��Q�l����F����n*	���/L��i앂��3͜ud���f����!a��?���D�k�w��y̒i����ѵ�s�@���N���w�-˳�����hՁ� (��������ѩ��c���'q�R:���P�?4P(J���_�κvX#UQ�˵R=��c�ré���P90Kj��j�'�tT�A�<��$��Ȼ���A�=E�}�ǴV�6�A�Dt4��ۥC~鰐����O}>�d�R��	����	�ŀhZ�/s$�oqÐ�&� {@���D�u�Aqݟ����*��~�2N�`9Z�W�0�p�/s�x��$e���{������&I�i&�q��@.dM_���m��W��@�&vu�� �`[7��?2tW!H�2��B�r��ڬx�{�zがX3aW�0���V+��)�;8��p���-���pA/���߿"~Y�y���D��-��-4�n��O���w�g�M��4��,|�I���g�ev}ÂLd�>掯e9�o�=]rB��#�\��!}jM�QH`����TH���ۿҪd��[9�`������:��x��NTE[�kV̢ܰ�pm��v4������sI��͒{z�,��-�Y<�g7��I��t.�ΧF�8^�}i^�~i(�1}��+ӷgq��w>��7�0/}��*�n�/��<ԛ/V��D3�pa<�����te���{[�͠kxnmNL� �sX%P܁�2����-岲�4ΣI���bh,9W�iAi�e��U��CoR��y�~ı�_�X�]��|�j6<֋�����V�:@�(�3�t���m^6���P����Gn����g��(��1
�2���������O��	@�?u���ϖ��8�����6���d�A�� �I��,|\j�͡Ǩ�SM�9��Y�-�6Y����Ⱑ;O)蒍쒉�	S��5M3��]{��%�ѿ�0ƃU`�-���
QV�(��\Ř�qe�r��3"u0C��(Bz�����NN�_���e'{;���o� '{�����w���{��}L�<�~�D=�L�����C�Vb�E�wI�kƕ������S�m6Nīnn.�ͪ��ݧ�� �F��I��t��?������:�.%�9������X��Հh�Pٍ��u���dhZ
zf�����̓%��6_����<���=��D��!9�l9ӛ��yח�>�Pkb��B���H{>Y�yh�ۜK�f#�6R�ڠ!?H����	��k5�����;�k����Z�n��\˧�h�N ni�)'�W�m�M.�W����V����֊��g�����y�n����[>���n|���t���t,M3��I�\�f���A}�_�}�!��饓կ��WK���_-5_#���"�X��4�J���A�I�:{��첤}�ְA�!<I�^�f��,�O.�+Laߍ�8�΃8s��3Ӊ)��k�o:D�m1�M���E<Y���F���7(غ?M�$]�$a�X�T^��d�����%��._�<v�
��w+]����z�"�AZ���a��d������3�Y���㤦����sX8�b��**鬕��I%[��ᶃW�X��s^��� ��y�f�x�r��4_t�a	��
�H��ȹ
�1��u0�!��ǫ�_dϦ�E��WR��Xko.<������8�� �0�W���QL�)��~ݲ�y����Ɣ�E�`ܷ�ߗl��� <���d�E�mz�qk���e.x�2#��iX�(�c���� v9�6xP�
�+%݉ab�,�E%�,	��0�f@�UhU<���(�"�&�=�������5T�Ѹ0)�űWK!p!^
?��wA|��u�����IЏ��ʦ�lo}�.Fp�k̕;�S�*p�]x�<j8���?�Gy��K
x��<Cmhh��Ǳ?��1��ZR�8s���UP
�lL1�����V��>��MV���<g�����9M�j�5�F� j�Ƽy|bƋAgYO

�6����Y��"pbT3�`�,�Zm���q4�Ls�M䳉���8��~x{0L�,���v۾�2��!V!ǻ������!��
������ �y�*)�e���!�9�f�O�N�6�n~����6n`U�� ��q4W��8����5�a��Z
|�j��0@������nj}���|����Z� _�{��V�⁇�~g+֨ʦ�3��� �
4%��ʩ],?�M��WC���͵E�9�$�� �1[�2( gr������:al��L����%J���i��٢ I 0��r�N����A|��4�j�D��Ts�j�\��~VF�t���jrދ�r�F|I��7�7V�-��[���\�hl���uxG�D3f�8zv���=O��s��`
��lh=[8ԟ�#vl0�²ӣt8d����!*���hܱ�a��+[H��.;
n��#"�]���;h��Ύ�������}�4e�9���D�wc�v�$$��K��s��O˜��8t�2�
�D�.�i&<v���4'�O��=�޴ ;�2�nY|�'�^O��P��ny׬�9Q��e��˦fB�|�H�a'��hM�`3�BJ)��]�*Lw�eZK*O5gޱ�i$P����j��^��ﭵF�&P�E���]/9<>Ջ'X=[�Y���
�y�&��K������n��#����n;7v����F�����f��S��GK��2���!d{9}N
Vs�Tt�-u	v���=������ՋnE���l$��ANeܝ^�iH9��s?N��-f�v�Oa�(h��9�O�������"�*Е�η|?so=��*�������4�����?��A��/���(�g"��7��p�N�py`�����{1^P6'��6��i�:Q B�UvO�UF_�*[֍�MnQ�^0S�_tB�΃� ��	
�-���E��w02�YC��yϺ���9�!�b��t�Q*(��mqw� ������h�Z2�$����ƹs��Ȩi{jF�<T
�咱��N�P\;`H�ݍ�Q	 ��BC����W /���	1�| ��|�8�c�]kt��Hh׆~	ڃ�ݿ�^�"���Q�T�-H�Qu��^����Uml���#4Q'a��l:�(r�5�ƪ_d�0�LuY�ɯ�>$����|���_�|5�1Y�
�G��|�V�<c����Gbj)�+GU3U�?b��/Q6
�X� ��k�s�;#4�������v|M�Ֆ�-u�",�͔��K��w�~��Y-;��@�˨��5lM�s�'89z���p�j��M*��Ӊc�8����5��!8$t��_����g�rm�VhPj޵�yi�c�sK�29�z����*g%D�
�<0 �A2"|�F˭ke��#ʛ�I��k�����S�(��2'�)JiK�h_�7L�r
G��Wi0q캦)A��ۛ�f�iPY��$e>Ig��ϔf�"��
٨�:<��NK͋�t���S����D�~X*X"�H���=*n��]�������2z��h:s�y��ݦ���m]Wl�έ���l�}`ϑ����d�	0>�=�,{L�`�\���RI�f��0�m������St���,H�_��K柶��%���%���p[����)(w������3�y-�y��|�
��W����~�F�p��=^���K�oʻJa):32=A�V�@�s@�8�Ӑ��Z�E�[\���)_ە��R�����.2y��_� �/�
�ZS1���H��I��,G���nM���'��}�ů��E6�S�Лʶ�n>
�Fh��yw�MeËZ%	=��>V�:�.��H���Y`
��}��&I�����̢f�����
��o�BVqS��6� �S;����I���>��4��ӧ Q�-O�^�s�ػM�d�-�W�.;���n|gWK���}y*�~���b&�s=�^o��ʖ��p��\��\�cz�ϱ�����@�_���4�Dyˏn<���S�f��A�5WJ ����9?Yha�a(K�.�/���])Ҡ��Z_$��7.�ވdnEŊ�����Ƌ�ߣ��"[���Lt��Ũ�Y��[h?��xǮ��ӷK�p&�;�ޫr{�b�V� ������C�ಽ��֍�=@�ș
_�<�KMH�
�A��B�!���@-.�߈&0�f�cU:��f�O.���^�L�1�~M��mY�k"`i^�qF	��4���pfE�}`��4�.%���`�/�P§�I(v`x�tU�r(c݂�7Ϳ��1(��D��9蝜��Vfb��*0��t&OghD�0��%��
&�
��(I� n3�we�)���9 �ן�.��s�������:~��Y�!��l���x�zПQ��k�$�QV�$�r�a��" C �0�/����Fi-x;��ٌYU����ҁe`�2�|��*Z���	������t���(�*�`�E2���G)�#�ϣ!.����$�ͳ�����Q8�?��n����s, LCd) ��.�`o�m4h3y;E�A�c��B�O������u����i�F�X�!/� 3��3�?m�g���p��g`SM�F�a�_����_Xԕ���a��0�s£u�4MQ�Z���k�,���+�@���h����
{j�sg:ncU6��������akzjN}�/䕂]��i�G�L����H�

aD��$)%i�妣ig�	�ㇵ��C�t*Jb��� �)qh
wh}��"$�%S~�A��L�2�
1>,��`W���	v��]'����A��i��H��/wO��<I>N07���\�ޅ�N�)����0!m�e���`%�p�sQ��wx:JЌ�fF���!��$�f�����zy�%T��xd��$�k�*�f�7�e]R�ו�p��4IŰ%b��K�K��UI9U�ם���F{�:k����h���m��Jh��»��G� �fXCK�����u!}4����F� �qd/W��U�rbA9r�x�EY]j�"]�Ł�p3r&�RR�q���������
v��'��Բ���#�M�/8��`

���4C��d��|`��	��v9��_Dl��5I`&�TT+[F�J��Y
�ȓ0�8�T#A���Y����{�N�?��8�2�M���p�/;3u]�y�)��d��<J�Q��J*��o��8�,�wt��媰A?��0�����	�$'	F��\�f��&%�uv�"��NYt����!)���>A�v����"M����K�xat`3��R^/ʧ�~ե�����K�o�1�!�-G
�����=(�����"����$�5�{�ܾK�vg�{�t�U[�����\{f;Ɉ"[W�C�~I��cc�$�Z��C�q�	�+�Ly@�,�U����>�� �`��f1s����D�G��ycl���zYB�I�)F�a�;98V�\
���-H�<HaM�pz�Oə�[NCK�m���w���)�p���I
�|����xy�]�O��/@�8���E���A�{o+��
�0c]t䦠�'��Q���@P �I�!EƘ�X��m���M���v�QA���C�x�}��y��+��rf~��|b����>.}okz,z�EqYѧ�	�
�N�0�� ���������⃅.�PJI ���w�c�K�
�"�����L{[�Z^�ʃ��n�e�0B���)ǯ8����������
��aT�W��X)Ex�E̔J�I�n�{��7�:���#V�q��ب[U4$vjg�i���~��b�z;�n�}cM�s�_$|<B��E��o���/i���%�-�̎4�4�>dR3����d��[rG�T�.F�y�ɖ-���Y�C'%b��~�ylΜ`M#���F�`�����3$��'�i(TKDA��G#�7���^����1�rM�l?��������h�
|EP+�)����G�.
���"�ڰ��G'Kb4y8L���y�g3�o�G�W�
���V�7��"��9�z�����$�1|�y����yV
��p�t� ���+��!}�F�=c�ɴcл�:��d��6y����Xt�@q�Ʌ�����+eAt�s�]�a��=��܀eT��x3OZ��Qc�՛��)�$��
դ[����2����Y��߳���B|�
�iYTP~Ď�{��3F�MўO��+q+�i�Pa��Zex��J�b�kf���!l�j��y�X��l��k��8����0l���d&����N`h|�w��E�(o��W������@���&�"d�A|E�_z<<O�?���O����	U߁��.��?a��(�#�!da|�=@ؤrr��}�pO@�JK��_��@�Z����̝(G��ɉL���yh� ��\��p��K��8�e'�|x����PL�&*��o�f/�I���jc�-mOֈ��h�-/(�=�HH�i~+���+�6Nf�3��ٕs`J��@�
�/K7���M���]W�.}cn��"`���y��Fp�E��H䂄�	`��%Kx�x�kT�P0�f/.3�ŏ�!��bu��Cd�����|�hQ2w�iω6:k��/�����,wj[9@�j�Hw���R�Jwy��X�A1��Op{Goec��Rj���J��ey{CQ5�P��j�D�	�5��
�[Qլ:}��o��k���FV���T��6>5�]�',��]�����9�l+����-Y�:��g��X+3�t�{w�U����<q�Z�<p.��(���cy���#B��M�u`��=��I9Б��^��	��ѳP�3@B��8B-	W,��^�7�űs���Hb�
������$��2
0_y:N>c�cgt ��(��;AvA���.=;��y�"6�����Ǧ�Q0��C^Ũ,��A�L�.E�֯,`䲎�`�ʮ�P5�F"h���������|3Es�
����6J�ڣ���fw�a���QG�6�oR�x_`�Ҕ�XGO����;;��r�'g�8��v~o����	WX:�}
VN0O~��
\���c_h19É��2h�S ��<5�Sd#���X�-��q��C�r������5K߳C�V�(�~�AV��<�P�2Xw�$���e�L�N�
@20�cX^�D��8�����I�"#��K<���E���7a�*�FN X<����|X��~wצ����#����O�^�졚.��!�o���_�|�ڨ��o*_֘�ɸ�h
l ���?�n�,���y�@2*���h)@\,���8Q�Q&��9A���,My�p�
�!�����K2�E��f	:�_K1�fxN{Ld=L)8�-k��r�JֶV�k����Z��ɧ�P��\�G/K����]^�.^�(B��2�i�jg��VB�Llu�"���ْ�/�9�~�}�3d��H��x�d_���@YM��0�h�O��=���)���i0�(�o_���6{�	h$��D��C5�/i�����"�pe�)�Y� ���)"U�̑�]%���E���dǌ�@$	�)�չF�`�}�Y�RC�N��{"�^��i
����z�^�.�+u�ХWP��Ĕ�<��L��@'���~��3!�ej/&�"%��&I�k�9'b�������h8���`'\�gr�S�J:��A�
Eb��Ùh�U��@Gၲ��%K��g���w;�n`�����'b�����#��g^{Ǟ`a<�[2���ڻv4XҚ
?�}MQj����xLG��w������[����S"���ZJ�H��L��RG��
�|�`���Hlv�����D����i�Ah��<P�9��I��W�P� ��|r�?<�]�/�Q�E�k���#?��h	�P�Z�
7o��wZ]ex������ {�!PFQ��`0�y����@�X�Ӳȍ�~�0Շ�
�k����5C`=���٘� ��V��W�#��gO��[a݇K	N%{ki���v���y	�_A��jܔx~��F��z�����N���qoG�Y�*�h�W��sb�1�oT��n��z<Y$M�r�L�%��C8��heq~@<�h`d�s����(�	�����:��e��>X�i@���d�>���� 
cA:�Tw� �e��~��_(D5V���TDJ�oa]Wh�֍௤akzi-\��e����l���~��p���7�߰g��
<����/�`�=�����N��O{��_��דӽ���h�w���O���?e�zov��_1G�Hx��{{��=�K�����llM��ev�`	�ș� aQ1���&���И/���_���%�y`�����Z{��)G-�#�s����,S�$��o�Ѭ?"�7�\3S��l	�w��Ӎj���l!�p��y�Dk.����	�u�D+(>��>O�<�D��8vu�Z3���5�W�{���� ��2Fi/����,���9i�����Lw%�0�<7[jN=dGy��$O@ֶ�9C]�hwg� #c���P<|�<��H)�;<���kEZ7�,Q׳y7&��q������_���Q������;��?�Ͱ�Q��S{�Qh��T�%|�}Y��݄�*��|�
����:���2Ȋ&�ŃLX�^P/���{g��猂�<:R�")��R�$s6aJ;ȅ����ؖ����K�4z�f���c 9?�ZZ�(�it�f^b��%�D�(��Lx�wci's��A�%�T�
Е�q`��6]�x�q�q�?�
����_���Ot�yq
n�IZ}�0�-���O�g+y���l�|g�7x��=���A�z��H�7lJ�o1:]?���QG4����>:����+�3�-�id$y�F7'dojH#i鐔�O��|�us�G:a$�d(MD���$����#��v:�-�yWmh��>a=�'� L��c������7��'=�Rq���H�{[K�B�t<�Q�Bu�Y�(�L��E�\ҽ�Ya8�P�"I8�f���U��PB`�.O�2�xl����[Pf#����Ҩ/��w�!�}ʳ�A�?�	����b�I8ا���roD+s�Ъ`�)�6�[�4�5���H��](�%��WA|��
�mв�<�4)�'�*
oζ�6�I���4Ax;���V�c�p���{oN����������㽗�'�ǿ��?~����Tz�?ݮ�5��Y��M�������t۠���++�1��t�mؾ?��:<�׺���2��6� ��2;��m/�x<���)����n�:MU�@�4(�����/�w�Y���C~Pg��%�w|�7��)k��������G���`iA(����iK:�����A��j�н��o�!��[H-���E���lvn'A�eS�7�M�dR3
L_���a%tɻ���{o�Lˡ������.7^�0s�T�,WX�
�C����
��=3�Tʛ�;�
�\��a��HD<-��_�M���
�L��,t����`Ք��콁��#>��7�Y<:	� ���"�.ƿ
����a�O�V#�"��"x�wr��t��M<�RbPR�=�Z��tr����p��$oi��qr�I8����i����=Rx�#����;R@k�������?���8AA���4	vlB��
Br,�<�)��Q�:�Dt��a�`�3�Ɍ=JТ�Ղ�!��3%�c�.���q�}E�)Y⡡�6	�E�ö�5�:��;I���
F
.ɔ��g<x�r�(�c���cex��fE~):�)F�hL�o��'S�Q������yW�����]і�9��c�*M\�)�W<ŕ��4W:�B����*�
�6;+��1��-���6P�.|lFBW/��Lsx�� �t�+1
�E�\����n����ym��N�g��|��f'�?�"ˑ������{�`���ί;{Mؐ`;@C ��a��M0�㥩�y��/�uD��c��眧bi�8yBk;�\z��0��U����"��n�����r��_�Mڏ'DF�ƕ-����O�#�<.%j`\��Ig�P)�8��f����PJ��'�ɐ�9��=:��SS�IP�\+x���׀#ЗH��т���h��]����-���xl
���8�ն��Rƒ���,2Dd����۬w
�.�N^������׽�=P8v^���uY��R�/�0Fb��
BiK0|u��i�nD�n����Q�2��0O^q�v�!��x`�� 4,�{��e��R(�^�9�+r���E��"��}��z��`�$�󙞿N�\�Pf( x�����a"�oS��&���!��\S�����8����$B6��[(�O1��F晋�6@���óޛ���C��=����`���~}�f���x��Kvp����V�#�T�@���h�ԕ.c�v�SQ����"D���!
��D�����7A*4 � ��4��%MƠ�qA�Ҩ�c��P؆�J�y���rLˋ�<�$��c,G��p�2@�Ɍ0�f�xQB,�&GdУ�%焍�7�R0u�,c�c��@�Q

ND�����-b�0K��[�������y���G�LAxq��A�a3�p!\�r�Ӡ���4E�)-B��A#"2�u$!և��;�v��ݧ��,��s�$���=����Xo����z��<���+����F
��T��-4G=3H� -�6F �������]BR=��6��h��Y3^�I������H��>�.2,Χ��5#X%�S�:<�HxWAm}
yI]�//� [Br*�ο���I�� �%���fa� �*Wq<�Fmn�	E0s����|4��idw�Ȕ�'�����=���>y���h$ɵ�Y-�C��S�QD
��2Ya'�
��i&�i�RT5L��쒦���hg�Ώ�Z�D˅�'�%OHF#ƫW�=>�B;�2���>�54G@4�s����-��J����B�Wp����h.a������!��*�����ۀ��,pl�Q$�j�$(b������3�棪m�xv�ޜ�׽7���󽌓9:����T��xBq0!�z�C����(��6����
LkP.�o�� _��	��GE�/>Ǔ��A�	��-� ʄ6��v#��]��|�V�[�
O�4������5�h#�ڡ�o_;
��>D�<��"}6���d�Rz_�
">�
�_�q��6�2�\�f��5Ǡr#[�C�� a�`⹗�ä�@R|v��u��l ��[��pB�?���A*}���*� K�s)3-���G�g� k����v<t�,����O"��/V��0$�ϔ�H����'.�"�s��Ƈ��m��:k�s�#��it����?���Y�}f��u�h�����	X�"�2� ���jK{���KzD-H�,�̺��Ž�"���(*��;}���'�nq��Gh�$�uPZ��<(�&��o��ey��F{�lִ6����:F�Ag�=��5�6��W�R�ʅv���׼�C- O�b���Z�VDxol��U��A�8�<h�Y��&`�\�f��@Zޘ֟F[���w{�i�s�[�j��N�t��y���n�:Ꮯ��v^�����x��;����lm6h����Ͻv�p���k4����rb�+,�q4����pC���@�Y�*�M�P@�,h�����_A}Z0Qfd;B���ʏ�W|*[⪏�P���-qݧfL���#*po����S4���|�T*�q����R�S��֥�ڝ%�"�#Be:�GV�7����t�M�,��*.����ÍÙk��ZD�?�]![�W��r
�G�h�A��+ �L�!F��~8���������Y(�y�-�e��y�
@u�6���ְ;c���'�����X��C�<�Q�h�}�';�e��>����ݮWf�����-�2y�ı�oTW[L�����ajȑ�<�x3¬�N�Lƻ)M�W�W�vN����GǇ;{f �zK�6��+��� ��qK>�y�����K14�,��R����(�6�eaU��O����0��	��f��G��0xQ�yR��f����b�KN't� c/�K�X�H�
�MM2��3lU]4�]�N��֊5��ܼh��,��  �� �(:�x��}�v7��?��3��")��d�,��ql�%g6G��[l��q�����G�3{�����9����	�#l�@ͦlO<��$�	��BU�P(�9%�����tT�fA��`6�{iv�&���^�d�V��Q�����8��#�X�Ȣi{��AV���I{�������Z�肴e�u��W�iR�:?��k2n�Żǎڣ4N��5T�zQ������5���=S����#݁�A�HA���@ٵ~����d`5'���፳zm]'�+�׌�O9�0��Y����8����1�/�\RФ�S�%�-OJC~G��	�ׇ.im�b���7d�7���{�eݝ�ч7��ςm�
4�9c��7�y�� ~\Rmc�<��y^�S�4�S���lS�<C-�Gq|tȐ���f��*]��J{d�(A$tT'�%�V�
;����l��U1�g��4I�>��==b��&4��E4
�:d
��Ln�g,��+���G?|#��7���e(����2:���0��k�e
#�L�<l����K S��8J(�t��"%L�z
-%A�	�CW c��4K	���`fs��`����jI֊�,��Bac�$i6
�4YN��yL6���H�MR�Kg�g�o�!@��+1p�F���P4�
]v� =�KHȪ��7�[Z����$֧9L�49_�b-���Ƕ�֒}�۶8T{rr+��"H� IH�Q͊d����y��>8Lэ� �jx|��s�Ӱq����sƹe��	�1k;:�����h�̶�h
��bjy�M�/4���rU�
L�j�5�t��/�ȴ�_RR���vp��6Mn/{��`�sF�A���<���E����UrN�+JFk_3�	�{z{���g�tF.�K�q��q|C�Q��9���c�Y��טr@!���J[�L�8
B��hƔs��<
�]ǈ\�Yr������#�^�,�r�ӻ�f?}$� ����b9��<KH���
�K2��<L�����{5�
J�QҝtOGA<j���I����z��\��z����7��C^�ј��lH�&������F,���n B$���C�O����s�Wݛn0si�L�.�4�σ�u��Ӆ%�u�E�>܀m5�02��vc��FPE��zCf��-����b������s�?�J����%0Q�`��P;ͻ#��22f�!�
�hD�����B�UB��������� ���Y:.�^�n�a�=�Sw�I4����16�� �AnL�YeЧ����L���x@�^�������i��=�T����L#$��6))�`����xyo���W�m]���HK�}�7{@/
��ir���w�f���#ԌǼƋ�]�]�+��}ũ1��o��MwS�
��d�@��B&y�MtQt�s.�C@�׶�& e��=X�]�
�쓖���$��H7�o�u`"3VN���iMp���X���RfD˂�xobԚ6� �(<�7^Ŵ�H���F>*���� �WG0Ǧ�}8K�;D�hd�f���R^2f�r$�*Z��oUzUm���[
c��4�G1��Jf+�9�Eؿ�H�ܒ��2�V��DU�T�ȅLL/�R�O�֤dVt��m[@KJݾ��j2����$]NAS�3�h��]�/K;�YJ�^1�񂘙5���lhSF�)��
,�:�Pm:����(Ն����Tˈ4i4Xg�np���]�X��h����5�:Fܛg����,a
k�1-4�ġ���C��J4�S���}f�&�T��`J��)nfh_�֌_�����\՟��{s��w�]�z�5�����QV�/��@�ӄ�*���;`�[:�[R�nI		S�3�N!̯m4��4��҈�du9x�l���)��PŢ���Ҙ��іFI0f� �\c��n�v�� V`���ѿ�y���|����Kr�a�n��t&q����z�3��ٟ�8��E��d��%.�H>�1�S0�#d�0���V Ნ>�Ę�\'�C!.]b
t��H:(C�YT��BQ��(���;`w����V���E4VL�3�Q��,$�D�i~�=	� �����Q�0���Ҵ "�$� _�.	���Uw�:6g����d4�8�i�������4�B1�tٟ�@��e��\	��[�:,K�����c����7JXiGaz�]�r�b
i�B��f�P0�w�i�7�h^�����L���k�P��%Au5�I,ե� B��,O��5��yX��2u�s�Xb�U�#H�Ŏc�����aE,l�������SZ,7�� �=:s�\X]���9[����ų��>���Cנ������	8��.�>IGkM���I�7�s�8z�bw�״�)��Q�S�X��+gQ~�'����{�{�.�|f��&KQK�ѫ�-��4o:`Ǽ���
~{
��A�&'X|���);Ĩ�ü;�=3~b���4
%�}(b�42~�u�or��i>��i��8f_���鸀�w�+�I@+>i��w&*G�Q20��/��}�9�+���l����
_g�Q>��d�K=���/����|$/B��|[�\�AF��%���=ԀwG������\�b4���o�iA���ձu႔��"�����_�_�4��x��φvx�!-%o�w�Մf�ݒp[�����lT��&�$�a�Q_X<KGy��Z16 ,գ�Yqcz���,���XK�i���,����w�� h��&��5��
(e����v4!m�; 8�F�Ӭ�v�8�С��jI��5���E���Pzƹ�cs&^L��K�d����`gRѲNyf��(�P��HC����P��DP��B�C����O���)1f�;	[�tU��r��|%q��*�Y���] ���Q֤kI�,[��p[��6�6�@��4�a��2|�����r��P���� ���qľt/�t
VW����i��#�l�tr�(�`,��Pp��;��2��!�sӯ=��F*9��2Y��Z�2c��t%�I�^d+&\q���w?�Pc���W�����+��Uh�
������ܓ1��ݢ��!<�A��,��X��Zm�/�$�н�������=���C�M�-t�Dc��|��}�ܳ���p��)G�-t�#��IH���M �2�8�a�˫�	��ma2b^��
d�o��ݸ�������X`��9�F
�`�K���L1��tJWök�V7�Ju��}X�a�օ�2|ЯG�F�ś8J�	G�!�k}lւG� �*��k<��"��F����(�r�Ry�7�HV��티�{�4��K�� :��n���Dz�`a�n��*]�kEsNi3V����-����{�ɭn�Q�բ�`w������츽54�d���A�3nU��Ch���EuO5
����;W��2��0e\n��l�1�oS)_�ڵ}�[�ˀ�A�kα	���P��7�\� ���+gn"�P�ōA_�`�m��L��+K҄�B�c�=�9�� ��W}������6��~u�ڠ��]��������`~��ƚ�Vm����_���w�pk,ek"�tN��X�c��
�J���-��b���_J�r���|
^lI���r�+�P��ih�B@�6�}���/�z����R� �~咀"���z
�>��%6͆��o��rq�Ϣ-r�Ag�.T��b)�@�q�}V�!��DlahB
w�Ж�v��)Q����i<G���e�↿W��[#��,dƲ��E���>�N3���R�M�.����|�>Y]6�"ܝ�B��a�LÝ�q�c�$B~��F�C����ƷT=4&���@�XC�3@AAf�������l�}rB�Z��nrY��#�m!G��\�/�;\n�ګ�3:�."��֣w�6}M�TU���KZf'/���`-��f+	R.-��=�A{h�Y ��$���&y("��զ��,�LO��4eB�m�0�%1}�$�`�v��M3���x��pӇ��W'��U��.5#�1��tD�yl+���`z-K�O+r�<�њ��$6_<�td���B��u ��,�CE\�|7�~)�]M�/�2�%O�c 6'�~/��"����_E��)5��/]#����
�ݑ�U��������͵'/�?
�"�H}D��Ç��yp��+m%�Y֘G|�Vݿ��/�pk/��9cm�-��G:�3�g�Sא�s
�Yt���h����8���_�m�w@���^���aN�Q��1Ǜ���D�j�������_�A8��Rr�v����{�'Z���<�z�+|<I��S�c%x��	7�y��8ͩ^H��=rzv�Ų���x4�V�[�K�;$Hn�3`V:�<
�p��]S�Z��8 GX\����F`����I��l�`2���°�����sQ�n�7�|��8gŎ������o�+'�긌|%�̠=�0z� �[�&`����U�.��w)����:���8���QX>򟏣q`�>9�(�0f�/�>����V��I�
|,h0���4o��y��1༥#���<�O ���ɓ��by\�7�o�Er����5\b.��=�W�oM���p�$��D�WI0�'i��k��10��=�y�p(;��FS�f*�O���s?��İ?��G ���N�4PaoN������u̐��C��	X2@�#B�,���	�s�Y���x&� �w�f({!��X3�@e��R8f���X�g��8g(9�	�-(� }u^���`��(��A�/kU����0�򞳴J��8�0U�x�q���b����G�?϶�0v��#-�����xX�g���=۬� 
u����K���@
�,P�N��T���)L�&�(=`��0�[�Q�-���sp�Z���l(� �Ϩ�@/�����{E����1O=f�Q�AuUÂlT1��K���z��4�������|������Co��g�z]f�p��|C��WLEy�&�w�-<�;�q�"N�1*��`�PPB�|Mj/��"�;���u��:��Q�0b��
����o�(���Q�'F���V_� 0N���k�����f�N����X�N5(_� ��%�y���_���[��h$9s�^���ϝ2���302pG�
,h����t�J�Ű[�f��G?�F���E�Fä́����>)�͊guV ��
 �T��8+
�}�f�hZ9w����R�(WU�
U�����
v�����Hi��KK�����Xn�[<_ ª��C�"
���wƂ;T=)x�«H3z$��; ,�Hm�/��o��5�9N<��E�X`�y� �*J����N�f�v� �nM��r��+R"��$<b(���uW�vJ�}B圅�cz���O��E��|e�v�?^�1"��y�X=~z�<� i�a��� �`�`�jܸ�"�3��Q:�F�n��p�
@f�*��-�tH�a�d�y��b�s��b	Y�P��囷j� 
0�bc�9|������K򧃷�^����|%����I�,��������ۣ���y(��''�('W�qF�i�@���9x��h+o�J���z�y=�����u0b�z���[���ի�'@��ӄ~�3�4o�X�c8�c`���Y�^;��Q�2��!�Z�2M7"5X�I֪�s g�5A��ѐ�@�XH�f�spAͼD��8�P��Zz8��rɌ�&8�OE%�	7���'�_M�V?��gY���7>bL���*c�*-?Ic�OЇ�4*9�3~�aT��c�W�kgX�j�8l�Pm��Cͩ;K���9r��SJ��k�d>��a/�6K~����MKX�l9yg5~���a�F<���
�,�d{�
�k䦷��k ���EE�9��]#xN��y�/c���e�ՙ�pc���-d!4C�)
�(�RY�|��Q�ēk$R��HX�"��c|�8D�*Β�;:���
��Ⳕ�<Z?T`�A\X[I�x)���$�"�G��g'�]s��������!���t����I��ޯ����HӀ	$�%5��������/ߝ���j	��Te����b�.��a���gVT��SPҜU�e���0��]�Տ�C�+X��L�I霩&�S�>6���(O�-f�R3�qȭR��o�'z�"wND,UWK�U��JoZ��H�q�*�/�&~�,}*�\f�|��'hb擭�4C~����g�\����s�Wzl��Z�E3sFT��4Wp	a���㥹�Ya�4ܛ�{�{�j��Z�g�O[v���Xֲ�f%�>5�<
9�X�Y�=M5m[�L� �<�r�1��/邶�p��#����m�"�$�e c@�%�Ʀ�U�,_.*C	��Q� ,��-rG�:Τ� ѻ�>�r�-$�-�w��r�ܰ��zN/Υ�3A!��1���++���p�^4���m����Z�ɂZ�b<F79�ȯʏᑖ��N�����|�O:����l��ER��4oU���*�&>�����Y�Z穗LI�ɬ�(���ʽe�Kq����D����#��cދi0��V�t�A���4
�� ��,i���2{m�0���U�����;��6�xم{��]`"�+���A�W�(k�2z	�(!�~�'�����Xu�����l@��[�p�D��19��GǑړ]�`H�� JU�W�}V�40$K�x
T�Ŋ�����\H�`�B���ݑ8�6���]��)��߽}�nElc��D����8����i6

!˸K�M��L�X�N.m��lK����W����v�`���B#̏<��AY $F���@��e(�j��s�K�i��l��D���?����s�`���ekZ�z����l�ܧ�x�Ѿ"_���N�k�� ])���8S���ͭ��t��g)4���mS�Gq ?��8=�)|m���|+�<å��8�6F�e�ㅅ�& RH�����Ѝ�A�L
��zX��6t�7��!t�O� H��*��7��#	'��|�Ǟ�J0+dt�^R��X5���:�]�an6�T)^a�4S�wR�_q�*m�{b�i���C�\4�K��f��V�r��,od��4���
��,���7�7����9�XGl�'��3h��s��]Jz��$�{�%C]Z���ܢ�������b
<:Ń����Wʖ_��A���!�g��!�FJ���$��[�����b����U��'�$W4;r\�r<�:�u&�s�r�*� q���Y6�x�d{��'�(����n����6����X�q},R� ��� �J�U�A��H������ ^{q�Hdx�N���S\��YB�!^��hn��wA�'{���h�q�t_
zaaN4Q�?�1��4/�`���q�UǙǏ��a��c��K�9o���NMY�tS���s!��1�д悈L�m�Ԋ�����X�6�~W�M��+��4���6�Ȍ���ѥ������J0~���0��{�y>i뽷���Uڽ���v����lЙҌ�щrB6�]^���@O�g�����������8}�]��t�;*$�hu �_�4Y�8��'%�� �(�iU!��M{R$���˻������a�a[S��x���z`9gk��F���X��8���醮Y�ѕ9�C��4^	3���_L�����<W%ߒ�jG��J��q��UP���dՂnϫF���o��m�!�ȕ���4w>�F�Yt��)������[��	���6k�=+�̶�i	�Ӳ}�����%N�)M�2�ֳ���~_��Tw��YU�k�B��cL�V��?��f:�{��Z��!W���������4�p��6́]ib�\Q)~����+��"[?�7J��G�(�1�y�� I`��D]R"c��/&̽[�Y;�m9��̫�#��%��n���=�g˓h���[}�
�,�uY��|Z����{���(���ҘhJdյϝ�N6WKp�y�F8!�w7&�ԥ�M@� ���'��aG�&K�k`�&A�:��vP,D���jK_���jnw�]W�X׾Gm�F+��p�<{*��+���������ln�Ȏtz��zM�d�R���q7���L��
�������;�
�Ŗ�G��g;M�S����d�Л#���F�Cz��+��� �;�XF�c���7`_>.��dn;?�k_��dG�,�i�ˌ����;�#i��˴)}Gڔ��ƺ ȗ-jy2?%��WO�3vTS?�L�M��0�	T!HO*bw���L�80��i2�Ta�O@(T�R�`ܗ�R\�he�w�h�ՐC��$R싉?q�:�F{����:�)�'e]��	o��uk$�����
k0�0�i�&�I|����]�J�uޖ�_�l\��
lν�ˮ8yy�i�9�]��"Rg�5�+��Z5�3l�M;j{�L�*�~J� 3x����<F��+f&��3G��ߧ�ҩSj��)�e�h��M����>l�L���gP���U;�T���K
�ocB�4��j�Y�w��,�l�#�㠷M�1��H�蝓��)�#��0ýݔ.iH�oB[���ʉ�b	׽�q�-Q{ۈ~����(#i�v���s���ۄ��kX�:���a&@-�����#��%�K?*�P025���κ�^�TX3��)�t0�\��D�
�X.����?C��O�$u��Ŝ/��W,����Sr�
&G�_2T���S2��,��f�^~��ֈ�p���/;��*,v7����˪��eev��Z�I}x�
�I?_��>	�mr���/PL�Im�us?}%��>�����Iq�y=@aE�K����y����"�u�|d,������3n)^�d3��:�)^OZ��3��ѫm���?г��XAL����I��t��Y�.݇��n�_��ѧ��L�ݬ��L��e��i$�7��ޛ�UJ���{��UoF�d	���o�3�|؟s�x7	�����7�]w"�k�rr�Fn��a?w����e����/�0�N����ظ�a�ˬ���������pB/�4yI/
�&��.�jFvǕ�ܒ.��<Urnߔ�$�F�!q˦��A��^et����j�(�(�,��CSǱM�ĺQ�H*��z��48ښeQ�
��[�i���~6��[�Q��Kq��Qe����uT�Ҁ9O�n���@��9��dlc�1	b���;nl�(`x0\������KCKx���+�7�UI�Z%��ܭ���6Z�m[0�K�ď�]y
��QDz�#|���X*�����k��՝=�4��%M��<�^�����iRN���X^u6x�g�tfZ�gO]7܋�X�Ui�L0ՈH2h�ֈL�u��>7x�ALpc`�.�ح4T���Z��̲�f�&
*ɗ���ar�0�F��#&�L��gf��}��#ѐ�"���ML!����q|錜�5�+Ьf%`nB/����\bh��<'-����Tukb�X�:AW�|.4�{��A��ˆ��E�o!{�ȝe<��-��E܁�+Yz��>�}���.�q����i4ITd�
egH����ş\*�+��7�<o���@�Ϣ��ڏ��dw���a�q��|(B��ÚM�8_w�y��,�����لWl[a.�ev�U���ur�=}п����ϋt��n�8>�ɿ[�Dpx`�\��y�`��jlm��#���l�.q�-2K�W�崰V�n�h�2�wݽ��a��h���+�M�R��/&��%���D~��t���7V�<�5�^u~��y�hF�܆�T�9�Ϊf�@�i�yV����Bڽ�_��2n�nc�a�U��_����0�Gm�d���S2�F���-4m<��dQ�ka��z=@RCnt�~�8*������(�3�눨�
Ր��#���J&���MN��?�D�fw�݅��J+�{s����c_����9�ywc2�ot��(w� 1�vg��,�)<��4����]�ߪ�%9P兹u4"=���� �κ>�����m�mus�/��%o2����ܭ�����]@��{ʎV8�ݘ���S�r?� V���*�E���(����F�_��o+�9f����au��9��8�l���@o�n1�1�*G27\�2=V�xT!�k��-B���V �z�֚tj�RjL�\
vm��!�~#�5�|w�]���8S�&�jQ����I��W,<״��	�o�{��E�4X���n�U�8�M]O-UMK10��M�S閥����KUů�2|���%�
�T�𔢊)�q�֞d��k�]MIK�'Q�Q�[�K�/AS�ϟz�:��nݶ�y������+�=-�����Tdق��J�����_�k���}]��C�mǽ
�G��W+�	���E�.=i��蹯�m�=-�9o�X(���_�;�<�6�/�*��S�_���]��q@�!R�_��z��~�������Ҿ��t[l���Va�? ����2L��^���,�^ӱ�.S��7�A�bN{E�Ib��YPRU.��f�������������5�3��uI|�ͺވ*u�<}����lCB6���;�Z��Q�4�]�Su�V?�m�c�y��l��y�=�`��k~?93�������yى�7Y:M	E��qL�fjm�`�[h�y������z�ۅOmTT�����<�.���+����P�������.�e��5����������w!|� +��Q���R�
[.
a�"�~��̇�|p�|V۰���<�5uｩ�扺��k����^�G����*�}�	侶��&�ޓ��4��X��\w*�#w�5��z7���~�O0��%ˌ��gS����z��6ev�{ś,O{T��Fd�N�������=�]�V�����K:Ҡ��2�8���6�<�kFj�W�fl��ʄu��AM�g�=�NQs�]�_*?M��/K4���q�|��7!�W��b��.�Wʵqſ�`V�G��b��1��PH�c�6l���y.��Jz����f3����R^���8j?,�LA�ēЄ�z��>����c��K����e=��cC{p�)\���p=�����ݓ,�'úU�*?��������V�:7+�գ#,�͊G�`�M�n`�.R?@o�
  �� (p��