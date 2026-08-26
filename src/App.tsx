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
                    <span>ðŸ“· Camera Scanner & Verify</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScannerViewMode('all_logs')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${scannerViewMode === 'all_logs' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'}`}
                  >
                    <span>ðŸ“‹ All Scanned QR IDs ({scanLogs.length})</span>
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
                                      {Number(log.gradeLevel) === 0 ? `Kindergarten â€¢ ${log.sectionName}` : `Grade ${log.gradeLevel} â€¢ ${log.sectionName}`}
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
                            <p className="font-bold text-indigo-300">ðŸ’¡ Troubleshooting Guide:</p>
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
                                    return (Number(activeSec.gradeLevel) === 0) ? `Kindergarten â€¢ ${activeSec.name}` : `Grade ${activeSec.gradeLevel} â€¢ ${activeSec.name}`;
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
                    {(Number(selectedSection.gradeLevel) === 0) ? "Kindergarten" : `Grade ${selectedSection.gradeLevel}`} â€¢ {selectedSection.schoolYear}
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
                                  {(Number(sec.gradeLevel) === 0) ? "Kindergarten" : `Grade ${sec.gradeLevel}`} â€¢ Adviser: {sec.adviserName || 'Unassigned'}
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
                      {selectedSection?.name} â€¢ Grade {selectedSection?.gradeLevel}
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
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Â© 2024 Centralized Learner Assessment & School System â€¢ Professional Edition</p>
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
                      <td className="px-5 py-3 font-semibold text-indigo-600">â‚±599</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">Medium</td>
                      <td className="px-5 py-3 text-slate-500">10 â€“ 25</td>
                      <td className="px-5 py-3 font-semibold text-indigo-600">â‚±1,199</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">Large</td>
                      <td className="px-5 py-3 text-slate-500">26 â€“ 100</td>
                      <td className="px-5 py-3 font-semibold text-indigo-600">â‚±2,499</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">Mega</td>
                      <td className="px-5 py-3 text-slate-500">101 &amp; above</td>
                      <td className="px-5 py-3 font-semibold text-indigo-600">â‚±4,999</td>
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
        { v: row.fee, t: "n", z: "â‚±#,##0.00", s: cellStyle },
        { v: row.discount > 0 ? -row.discount : 0, t: "n", z: "â‚±#,##0.00", s: cellStyle },
        { v: row.netFee, t: "n", z: "â‚±#,##0.00", s: cellStyle },
        { v: row.isPaid ? 'PAID' : 'UNPAID', s: cellStyle }
      ]);
    });
    
    ws_data.push([]);
    ws_data.push(["", "", "", "", { v: "Total Subscription Price:", s: boldCellStyle }, { v: ledger.netTotal, t: "n", z: "â‚±#,##0.00", s: boldCellStyle }]);
    ws_data.push(["", "", "", "", { v: "Amount Paid:", s: boldCellStyle }, { v: ledger.amountPaid, t: "n", z: "â‚±#,##0.00", s: boldCellStyle }]);
    ws_data.push(["", "", "", "", { v: "Action Required / Balance due:", s: boldCellStyle }, { v: ledger.currentBalance, t: "n", z: "â‚±#,##0.00", s: boldCellStyle }]);
    
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
                  {activeSchool?.division} Division {activeSchool?.district && `â€¢ ${activeSchool.district}`} â€¢ {activeSchool?.region || 'DepEd'}
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
                        â‚±{row.fee.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-600">
                        {row.isFirstYear ? (
                          <span>-â‚±{row.discount.toLocaleString()} (100% Promo)</span>
                        ) : (
                          <span className="text-slate-400">â‚±0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold font-mono text-slate-900">
                        {row.isFirstYear ? (
                          <span className="text-emerald-600 font-extrabold">â‚±0 (Free Promo)</span>
                        ) : (
                          <span>â‚±{row.netFee.toLocaleString()}</span>
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
                ðŸ”’ Subscription Year 1 (First 12 Months) introductory access is 100% sponsored under the trial program promotion.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Subsequent renewals (Year 2 onwards) are calculated in real-time according to total registered educator profiles active on the roster. No credit check or upfront collateral required.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full md:w-80 space-y-3 font-mono text-xs print:bg-white">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 font-sans">Payment Summary</h4>
              
              <div className="flex justify-between text-slate-500">
                <span>Total Base Value:</span>
                <span>â‚±{ledger.grossTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Promo Discounts:</span>
                <span>-â‚±{ledger.promoDiscountTotal.toLocaleString()}</span>
              </div>
              
              <div className="w-full h-px bg-slate-200 my-2"></div>
              
              <div className="flex justify-between text-slate-900 font-bold text-sm">
                <span className="font-sans">Total Subscription Price:</span>
                <span>â‚±{ledger.netTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-indigo-600 font-bold">
                <span>Amount Paid:</span>
                <span>-â‚±{ledger.amountPaid.toLocaleString()}</span>
              </div>

              <div className="w-full h-px bg-slate-200 my-2"></div>

              <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-dashed border-slate-300">
                <span className="font-sans">Current Balance:</span>
                <span className="text-indigo-600">â‚±{ledger.currentBalance.toLocaleString()}</span>
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
      priceLabel: `â‚±${fee.toLocaleString()}`,
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
                            ðŸŽ One-Year Free Access Active
                          </p>
                          <p className="text-[11px] text-emerald-750 font-medium">Valid until {subDetails.expirationDateStr}</p>
                        </div>
                      ) : subDetails.isPaidYear2 ? (
                        <div className="bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-4 py-2.5 rounded-xl text-xs space-y-0.5 font-semibold">
                          <p className="font-extrabold flex items-center gap-1.5 uppercase text-[9px] tracking-widest text-emerald-950">
                            âœ… Paid Subscription (Year 2) Active
                          </p>
                          <p className="text-[11px] text-emerald-750 font-medium">Fully paid. Valid until {subDetails.expirationDateStr}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                          <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-2.5 rounded-xl text-xs space-y-0.5 font-semibold">
                            <p className="font-extrabold flex items-center gap-1.5 uppercase text-[9px] tracking-widest text-rose-950">
                              âš ï¸ Renewal Pending (Year 2)
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
                        SY {section.schoolYear} <span className="opacity-50 mx-1">â€¢</span> {section.division} Division
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
            xœì½krÛHÒ(úß«(3:>‘Ó$%R–jI>²,·ÕÇ¯ÏrÏãúsŒA16 êÑEœÜ-Üˆ³³§»‚»„›Yï'I¶ÇÓŸa(TeUeeeeeeebÿFQ5žöË¸jOòñÛø¤K–wœLÖ¯ŒÇU’gG“m|<štW–È¢Y¼MÒ8*²¸èãÛê2iTV¯Œr"…üóŸ¤ÕZá$)l2©)ŒY2™¤±	D¥5…_TqVÎ™ÔFY-&qV½ZÌFq¡!¥ žFUÜÏòóv§_åÇU‘d§íN$™ªAWfQ’jÝÀ×¦]ˆN‹ó¨(ã£¬jÚA«Œ’¢šN «ª2©1ãU^V—8“Ói¥
±÷†MžZ…§×)<š%ZOgIÃbÙ §h”WQµ(µ¹gBË«Õ0Å¯OžáüÙ¯€t'Q6Ö†Áû¹é$å»"ÊÊ“¸(âÉ‘F‘Ö„w¥eîAÉbžFc›ThZc‚LŠ¸ÔÐÇš–ŸÉ,*.ò¬ŠÆ˜éÚITMã¢	W£-¶&ÓóµÜ…¢ÒšB9]DÅ$‰2Žžz]Hoã4Bò,§ÉÜ…¨m
yÌlóM#¹1O“Ód”¤Iu©±@•Øt2Ñ$²j’7ÎŠ<MãÉñbôXx&Pîý‡†u¼ˆÏb[«´æÜ’®õæ k‰Î
0WŸjs¬úGIÅE•q>›%U»¶ÄÕš ëü:Oó:Ã\~•ÓQôÕ®ŠE\Š¾Kfq¾¨ÚíÙÝ«EÙT§K¶666VÁ<žæçÇqÊú2ŸD©g€7ÀoaÁÁ†GkÅû«Š>Y¤Ÿ,®¢„ÑjÕ‚ˆÒ¸¨Ú­ý4ÔQ’’!ãd‘¦—dAñOH”Á¿²LN3x©r¼&)pÓ9vü,¤VÞ­«ñŠŒ‘H–„N­¬
¼ÌÓ¸ó‚foÐCÌL&”ŸÈpÃÛß'o {eLÆÓxüIÂ®oéI«,  ®•0G%£!¨²ù¸_¾øÓ¯üÉc¨KœÅ»Ë'i|A’*ž•½1ˆ™ÀO£yoHæ½ûd~Ùö·Èè´— ¥æ½ûdšŸCUi ­±¶w>8¤ÈŒ{ï"%'Àk{£<°ï%`ucDhUDãOÐõÞy2JÇ‹¢Ì‹Þ<Oh*\þ©¼ÒT’rMòóÞl"žTsÖ‡$¢„´]Ža4{¶mH9‡¿¢qÍÉ¡±h'žQ@æVÒ‰‰ÒÇ$ª–ßúeò{LvwwÉF‡<&k9T+@okCô!Ë+lt~Ëæfy¯‘m²¶æ¦¾qÚóæ]zü˜´Üñƒ¡Ÿ^à-†»´»Ü»Ò(£e «Tq¯œ'Y‹¬×€Lg{‡t¹‚FõûýušjQ Vt“^üZÆÅžª+›"ì	g„5{”OÚËÚ1¿êÜ°[¾±ÝY-ª*÷ ÛYŸ$gv²'qgÄ6˜}ë‹•UÖ¾³¾Ïô°ÞØ=Ë#³ÏåóÎÉ"£Ü˜*éæY^ÌÚK˜ÍÅ¬‹ŒßÉH14i8ü¥L§o°°Sæ‡ì²Ò…'²K‹¸¢ÓO2÷bŽ[ŠC£L›%–8]€ÙtæuBÛ€èXóI¦k)]|ç°€O3ñê†ÿ‹¸ZÀŽšÑßàDŸ
ã<íáÐ÷pi#£¼€YÓ«ÄC™â4 œW½‡dVõîÆ|.{÷[b(v¦›:HÊËg‘°7ùÄx$ö€X% (À²[jÔwè|8HŠq‹YqÿÊ©?žÅE”N€wm3\Ç> •¾8|¹þËóãõãçÇÚŒ‘”5ÝeE’…ÀÓ"™ü¯¨,{2›l«×!mÿ}½ýVyN½+F ÑÚ½z?Ø˜_|`v«³­½w—ó˜ä'ä ŸÍÓP»³N+1ªel‚Óñ,J€eØúÂ¢b²Éòì`e§˜IÙ!x g,ºMâ~§qÕ§ÀAˆâsË§uÿœè©ì,§Q“T‡€m•†•þ®ô›€²ñ¢ÜFR´NÖü©}³Wm—aAˆéêÇ†cO’ÅŒÇLß>XÌ-ŸS&Ä°Új‘IRF#ØíLóî2_:™î¬³µ`ÓÉ6àäxpR5Ì­½š€?ON§°ÞäF Yd	Ì½ Üº¯À¿9|óŽ¼ÒAhÚK£Âû/ŽÉ>ùr(!Ø)À¼F½CÙÚcIûMZöÉ1ì’“ËŽ¬Àtîiœ‚­_òÝ(ª­ÕŒîùÿ0äKÖhÆ‹hÎÏÏ~Ž3œ^dDîè4öp#Zq’ÍCÂöŸ5ÂÝ©S}Ødó¸ØmÅýÓ>y¸Õ‡uÀÉèál§q¶vŠ¼mmÍ•nð7Àáp6kÃßƒ½áoÝà\™î_IjIEul°%:!û¯þÖù¢Äö—¤š’çy–ÃüoBrcÑº› ñì¾%²£ÊD¸ýÉÏCO°ŒÌX=B›yCª2}§­o‰¶øRôôkÑÒÑä³Pž°§£Z:2·ä_•ªöùY 0­¯Ë©öÕ!ä­Il_œp~§3cahÎVí*¼»¯ïû‰ïû‰o‚˜ÿÅ¤†Ç‰È#.¢É‚
Þë|ŽÀã—"¼—/×Ÿ>]ÿüÞ´TMzÊm‰nH‚6¨ïÄø-£Øe|{Z~–…æ;1}KÄô•@A·ÿ,Hß©ê6Â_þ»ø]ü&hú»¸’ðþñ…@Öwrü–ÈñkJÿøLbà?¾Ëß*9}e9ðŸO´A}§«ÛH‚šõÄ7-øÑv¾…e8;ý²”:ç«ç4ª€|§Îo‰ë	™îð"š‘öl¶>™¬_Âï‹Ù\SžCº¹¥'@|'¼Û°EÛ$ì›æª±_ƒAFiykþ(a|§Òo‰="˜uM2|©8ÐÔRû‹“«æ(;ÉoGZ
Îwòºd¦­.ë»‘9Ã ×€é­‡Jý4¦P}Ò{Æ%¯ÅOŸ¨Ó€Ò€:ÿ(´¹n’aèšL·®öÈ›=ÀœøQzç0
yØí™;òN}Î³ãè,æxG4Å›ÃI¹O/Üÿß¸ŠŸOÓ|¥üÆrIvù…åÒI`W>µGõ-ÏÞÉéi\àUvÕí½lÄ[Éï©¦ªÖÞmÒ†oãh\õñûá4Þ:Ë“IWëä4ÒUÇoEäiezÓªX3Í®ÂþhöØIg½ÅdöDþI2 Iêc!õ–ß1n[½/alÇÓEFïd‹·€àE£ó‡X\îå%’’åJî²‹©òÝ(¥î¦U½,OµªàÍ($.³¬­u)Yã½y%Áð~T¾H xÏr~ášÝ÷JNH[ÒpTñÜOãì´š’=¼“)nzò]2ÏI’ÂŠ†åéîÅ¨/ýÙPV-†¦ŸLøý[6§8s¼-hÌ› ¾iWí;¬ø$ kßÙõ³.à‘CíZµtE£>èøšOó*?Bfü6>a˜‚‡çï^¾ ©Ü’v¯„¥×¸ÈçG³è4>.ÆtÄ´}ÐvJêH†Ó¦$!‡ž¤1-ù,IcÆ±ñžžœw,‰Î<·aÖˆÞ•Sµ–•ô~ãC‡Öüµ:yõ<EŒW\!WŸlì[š ü°Ïý<ÃYE{ ™… #l"MåÕ<îƒh·H+ýº…K#?ÏŽ×·ZåínF_WFKðÏ~	›Ïè×·/ÚØ#žÝZæ@´XS·õaaÓ2Dåe6&öü¹+ù»åÌ_úÐ´Y›‘ìÚšê›>¯Õ\¦wëÕ„æwäÙ]Ä(#/Þ¾Â›þøšææACÖû;¼çèþüÕÛ¬Dª
uë~}¼Ès¼ÈO’0”rG?ÃÊ>o¯	ž¾ÖáùÄý¶ˆ‹Ë¶]b2ê­T—œƒ·×Ò"ƒö¬íî®utvdÏ9«Ë¢9Žõkƒù4—íßd&âîbÖ~<›W—:¡A§ÞEŸbt¢ÀÜ\‘ºEÀÉÊ›¶V¢ËžH–à³HWP?…=ºa² ŸHw«¡×Å®UC{xyX!as€4zI‘º(
Lå\
ø‡Ö’ÌaJHh”w‹/È»ùs¿Ìgq»¤<™:µ¢¼X5Ó:¦Ç‡F4ùn
må®)ôf·*Ø~Ä¢¸ó-:Ñ_³Ü’è4ËèVÇÐ›|¾@™‘P#çxÁº@ÇÐ3¥8@KµVI]/µY£wŒ¼ èNá¼@×	Ðž™ÿ¿Äk &2!˜9^½>Ç»3'(ŸšC-¯Ck­£µ$å`Í@³æd&˜–_s§¦0\ª™%tçizÓšYFs•¦1Ü¥™%¨3‹RÜ\šë0=¯á>Ìj	ótf´Bx;3sÒ•ØÌI“Üœ/ZzÉ '-RÉ{éEKéÑkím|
ôXE˜ß²¿:5KÉd·æ¬ìïã™YB&{š…ÞÕŒ6Å4×Ë(œÔœž<ƒ ßã7†"ìuéÊÇÅüÌ‚»ªQì‚ïˆØ´êêâ`Îçö„Í¸ø"aªœt›¸‚æÂú·\Q©Å¡^å’?±ÉLk©¦Q…¨Y[1¥ÅMo7ÜM)–RQÁ6iu‰r+Ó¨yû¡)$S>?îqt­}®ÇkA×Ú\Ýñ»\PÞ,ä2˜ÁN9Jw—°ågNV¶É†riÃý“Ÿê3ŒV*ªiN’º@‹{äwÔ¥l|ðxXøÇÆþäR¼Îaÿ/µ`×ƒŒ¢ñ§	,y½Qº(´Ý;ì6Ódüiw)¶¬Ò1„Ûs£ïÔ«4¿ÿh««õ¦Kàÿá†îâGÃ/4ÐJh	£€ÀQó*d_aÉŽ÷äó7Ðëè”Ú÷´5õ‹†fÀóÄ50³è¢wÞ»w‘J=ËðBºùÁG\ORx™ÂšglDð?tA‹O{ïmœM?4‡½GÌ{÷…~gä:í ÅðŽâê<†êŒ±×ÔEë[¦
Wù<:
:×’tóA­È+Øœp´³>Zç.ÀÒðôgVõu?X!€¡ .¥:ê•d$.í¬ÏkTM.~ýþHîYÊË¥Ò® üçÑjØJRZó“c¥
½#ûèêÆµ)çÔR«¼yÃº–,×í•Ð ¢3-M±ôre;´²¼cùœ`ÙHðxÂíï¯óz/IÌ;b‹ðAiÿ9àúÈïÅÈRÀò´Ç®è‰sWEK9Š54ÔÃpn™;=ù+GËpÃA‹¯—Öœ°½PØ3Dr³Ë^´€Ù6ï=Ô½ÝP©žjÀfÈ™óÊw„õÐ˜TÚãrýOäøpÿíÁsòäõ_É³×oé.üOëW5WQ°£çéÍÈ–M7=¦ÿLÂåPb½k£Ù¨·IFi»ÎÕ^Žx¸ÂC¹9Zß#<íPˆlB¼]"Z¬áõvøXÖ¿éÖ[û†CÚ¹Á°øI˜ì×ïÏû¤ŠaåÉž®ým›ê£ú<ºÌˆ\³½”qí3Iiî‰úÔô„dÅ©]ë4^8t]š‹,áŽhw©éÎkqz­Dø^Ü8SÔ'MóED4z[¹,\½hèDw‡òh”z4d	Î9žiðÖ/å!B1à•thùœMqB¦aÅÏ/°âþ ×!OfÙvûDayãØÐNÞÑ0ñêã•7µ`wöÑµ¨ãƒ˜ÓvÈ?ÛúžKC~\<ÏkV_{]
ÛFØÒš—*ù{²MŸ‹üœùnãˆ/ÉT‡ÄµéÕ‹p‘âÿÂÙl.M«ëôHeb31Ù>gëj9Vó©'³^ðU¼y<öñðfÜ8¾ŒzN'¸hôyýSpùöOô,ƒ")äerÇØ ªŸÚ’Ñ™q:ÔçÚÇý1æi{}Q~úòÅ6æèmû,¶ÅN{O¦³Cñ0‰Ê)l¬cuÎù¾¯É[­†¬]9Å<–22,û>?Õeu™Ò­2F5…9?À\ëJÇýkƒ{HðùÐuˆœ:¶dê¿7Ö ÓdvJÊb¼«A¹"QZí¶ÄgI|Þò˜3LÙŸœ’ Ã5[íYÊ<]Àª#” ¶^C,„’G¡H˜‹6O¾î ±uÏPÈØƒ>ƒ)G§›Ïl•Ý=ˆ×xÁ¤u7ðpË„«UN`=Þ[Å'_zØéí5¸¡O,õ÷xÏí?ìÍ-s|u™}Ë·¡BY}XGg~vùÈ\kÛv½„÷iL$S¹±%œFÖ²×ÚF?ÀF[È
éY*dÔ©" ™çEEŽõuÕ‰ÆÃ®yC›!ïâòÒò}.â“Ý¥±fø–µ³ðýûŠDãq<þ•`Öõ?ùX°†f¶¢xZè!/Óz¤EŠŽô¯0Âw þ,Öš*ÖÚs`ÂÊ	1ó;Œi]qÔj‘«Žw•%µSA	T­‘
¢Í!´ÚK¦¹c£¹l‘åà×·´MOÃmÇ·¹²Ï&¾qóSñÛx Ù$óIÐãµƒ.Wj¥©~MmâZø—}B]@†}ƒ—¥6Vw0Fq¿^ |¯B0»`Zcpj×ëðç^È~
²9(¿ûp%aæ‰°Ÿ¦]•;–þ¸Õaó8š'U”/ÄwG!±zÒ|)ãÍ/ª˜ÀŸOÍê%ñ59ÒÃç¯K¿,":)Z¶7¤EÍá;1ê#úMãKj,òu©6âU¾šm;–Ò£n&ó õAý&	’Ž÷áEÕÿzÌ±è’£££ÕiYIÝ5¬ïä¨ªÏõ‘ç‹·¯¾aÒ¢/ó	dÊ³¸HÆþ|EüÛ")âÉjê–‡]µŽo ‹·#mj+hRñO"þÆˆö‰0Ã¼é"€Õ4$M>ÑP(`³§žTúÅZK(f[Whóx\"ú¼…2£•ô¤ªpÇêQÓUv«oªc¡pÐ8V¦Ê'Ñ¥^¦¦o4ä¦¥úÐËg0þGE»Cz¬~3uUõ3ØK •©	‰'…Á nfd‡l '€'ƒ5@*ëd‘@YJ§>b t´×»~È=¢†´ðË!P!@.»ÒŒ–'U—™Ì²ÊB!3WFúû#2³•‰ž¤ÚSÎ:æ÷yß!µ(ç÷Äot+œÚ¤¯0-y“ ÅQ]lY’@	CT†îMìKl’YÎ¯^gÿÝÉÒIüN-m5RTºTw­åùóÒè~Ð9äê‡4ÙL–¬‘$ñÏë,½ô|2Hýð-Ðvÿ¤ÈgDÊ¾Úô	ùO3V’>eÑMÌÒ§*úëÐ¾A®†E¿GîF$uûïšN5R¿MB<Ž/Â„è‹ÆçŽ«qåF#Lo¸Ür„¿æ¶£oƒÔã’ŠW:7Cº!~[{ø¿?œ·Ð3X8°û.è†é¡•ÿ:9Ä‚ÿÅ[¤¿P{Òþtò°Eë\¹IªÛj—U<ßmmôM5S÷¶ ï+w\ì†Ù­6îçÜç´wo4Õ|b¯_õ¯¥Îçœ:Ç³oˆ:®e+ûéÄ9½=qN¿§üÝéfWÞÌò°j¯ýNˆ¶W¹òZÀ†Ñ[¨czÅ6`Åã¯ÕÝY3§êõ±w†.§'B¢ú”%Í’.^	Oóâ’\‘]øB…Þ'/Úó¨(ãgiUmwÞ7ºÄþ:Õ¾õüÂ&T‹žVÈcòñ‡%¼\‘ùa)Úqõ¨©££lÌâ¯ù@^u<ö¨>7¡#ëÕè¶ï¯|™3ôü„¨KÜ7ÚÞû7+:ó^¿Á®=p7ý²‹oÀÐ»ù:ró_6Ø÷‚ó1Îí¬´›8á¹kóàŠÉ¨cŒ÷Fù…‡7'“ÝVR¾C”œÄxoûÈg`AàJJV~dôÎ¶g![IN,xÞõÑ ¥-2í©‹’é)DŽ.œ…HToXhzOx–-6ù§Õ,…~¸˜³ÅÕy…jo¶ÙW8éF†Û§ºèx¡—híŽºþìŽœ±þ[l×cœ_˜3RÖ¾hÈ‘—Q–¤Q=ëÉ¦ÜX×©@Üä´ü¿1ëüz÷ýïÜFÅÞ€äDÈQO=ÝE×òÜïÑ2úÝõ§0óZ³_þc6û[(ÞkíÝ@AôÍ«ì½;&¿€JÙÏ"t¥ºV<Åå–v¡k
n;Ã.­µN»Ö¸¦Â§!›uE4IòÉØþ°HfQq	³«eÉ,üË`)Wìòå	ëÐ•6“L~5•ÌâÛªlÇ¸!Ã'„³}3»¼Ãð|ãý-Z_‚ƒîÏ}c004Aï*ýw	³¹\uFÂ0Uoþ¸ÚW¹™µÙ…¿ýÀ\—­¼Ìÿ`le–ßœ­ˆ²ßÙÊ*¶Â0uK¶¢€|g+0¶òó"*&I”ýË©èÒX‹*ýßŒ¹,¯P‰dWñ¦[rÌwÞòó––ää-õf‘gå4™Y²¤ê§ýEV%+×:ALzã>mêàt¥ëðw"½Ù¥~´„
„/¬µâL—¼!ëD¬,ŠÀÕ›n<7ïmÝððQ½kÌÚÄštcU–å»Bë†
­9*´üDù2ÊQzœŒ u§Çô¸!/\")Y†£I),ådŽíûWnMVÉâsÈX¨mÂ2¢¤â6>AçvìÉ3úÌ‘÷†sB¥æûYFÙ@õÐØ³ÚòÇ"4ˆV<™„Š5R-†u.b¿˜ÃºèuAi­ðºG¹ôºîA8ñ¸³åéÓÍ°yƒÅÞ	Ÿº‡]5loçIžz=³O=J–m­ï‘CáÉ_„KÙYŸnz[ïu kÙÌ¨!6O¨«}¤„d¼H3¿¨Òƒ
œ'Èƒb=¢@ßqÇ¦ÑƒÙµÚæræh›7¹ëã­ûÄö)
ÌªÊg½rŒ­EèÈïié	¸ÓŸEsZ§Æî„™$¥Äû.aÆ# ä~’S˜°%­ë8?Ã¸çÇWØOñ%ÌJ§ŽåGà¨:y¿é9~ÿa©uâ1Yó¸AÕ¼\R‡€–/ÌC3î:›JËM£:ÿõ¹	LÜ€aŸ*Scm'+íôŸÜÉ*Ä…oEÑŸ¶DÄµÆLªF^“’_Qƒè
ò
_Ùâ?ºÇ²>è`x·Š&Õ:÷ÇR“úšôÜqú²Mö‹"ºìã5…6TÒ	Ýð’¿ÀU/ù3¥{d
ÿB¯ìClb®%Ž·iuÞÐØ÷úÏÄËºëÖáö‹úàjí1^Š™+/c^Q÷Dg-úýŠ&Q5ó§ˆ×é+_GÞ¡³P”›^¿=\ë¬h[=kŒn	üç&ú÷}ÞUÇU“7-:Ír`Éå>¯›–”äªùq¬óì×dY¯Ñ>
"jí½ÊÕlè$9] µLY¶â‹X}ë„Ê•„ÊáQ»µ?7Oâ5Ýºâ·©_³‰ *×Û«ß_Z¯äkùoçþŒÑý}íÞÒ}#{7qæ2ZïÔµËÍ½n‰ëº_R¯ìv÷•è»*®AC@ßF°É5=AÓ4!“nš%
6MïÐ.5üp·§é©x¢p‡î¶•UÜ£©´–K,‚^×kÍÜŽŒ­èÐ^µ½ÇÀ VŽ‹ãc—PýÝø¼Ô£:áv©W:ÑGCžU'¼Ì®ÁJ qø²f™Ç“'ÀPîßóÊ5Í}°Ðm Í¬í¨‚2ž£ú]9í¤4¯"¸ô"f0cX‘†}¶S¬€²|SþVŒ¼¸Aeyp‘.åè~“qå©Û¢ü¬G4%fDÓ)LCVòJŒh•bé’qS»¢šù8Jµº—×¢²^½ÿ°×æÂ$¯}T‹X¨/Ø³Ò”Ç'„txrp‹}ê<²tyP×,£ÄÚI\§¼;íŽnò.o>}§Q~c€;ZÛŒðJø3#Ö‰aÕc#~¦h‡Z+µê…:Tñ9‘À€Üviü`Ããú˜a<%ŒtQ
ž7›¡Oû“¤ˆqbÄî¦«hRcóÍA*OÊ¸SBD± ÍÝ€ ¡¿Œ¦hz™0/Ò>@—°Ø&Ø=t‘LxôEr…áAyr0Œ°p¯“~ŸôÙÙÿ£— qe~Ûñ…„wì^Ìä2æ1I‰!5Ê¶Ï¥†ÎÃL²ÎŠ‚¼ËâÕè8«ØV9@eOsKf9¹rí!Ä©*]³æ²X­
 ZÔFG”ªE&%gàtèJ9v¥ÙÂS§§þ|QN‘/
:çˆ2é\‘7±7‚:ßVÏW.ÉëlÂŠ›)øhS™À»¢îˆ-R2&r¿OóœzvÁJ«Õé§Ø¼í]æÚQ8§‰‚>%š®âÚEÇâQNl;Ê6µ0£„¯ÛáÊÿt=nÉ#ëÑÿMŽ,Âò2ÍcïŠ­S(?±à½4„³â…F°f UvuµeÍš.Zh‘SiIî‘Z<eBy½¨ÖDŒd3õ§Pô;&$ûKšuoÂ@Ž2Q˜ý«d•WQÊ.8Ç“gDñ´ñ“•ã×,©ôìÙ;/£ñÔ§¿äžâbV¢;nª´|?è»›Ý{èì®°ô`LC=Òý]Û]B8¿@ìÄªÓ§1;"ø	‚9¡È5êG4i•{ã”-¥@ßF4fÑ.yUÓ>î(€áÅ8fÓvw/úxÀ['nM63b•,(-¢Bbˆ%wpÿ uÇV]}B™ÑL¥Í¬%l“AÃªÊ7´?îüYø
±Ñ†¼úWÎ+$OTd¨•±ñ*¦`¶f£ÓÓºu­zq" <³·Kl¡Öøˆ9”¦úá·q!ú‰_é­‘è=³µ@l÷¨EóþFc¾d`LÜ|‹Éãbnjq1ß‹xöáÚ¡1n5‰ozWEÈôº¸”­Ä;á1ƒ1,lT]àL;°Î#¿jÇ^ž?Î|±Bvø’ìB‹Xsøèê7öÇ°nÌ’1á°,åFƒžB¡SŸZŒ5})äªÔ¡T“;(3y•c ¹µ«ÎÊ ž>—Fzè‘i…îÐÂ(;—•QëÂ4Z8û«ÃdÝì›­<²zÛ„üW§šQ`›Ä´äŠ7þÏ5b¹Øüô²7°Qí;¸Gé6.†E›Cƒ~9ì•ó$Ã°-÷¼¶ŸMˆR@š/@ümíq™ÄbNþ\‡í‘«wHcßˆÆIÃÆßŠó?¸÷ÐÀ'¢Ðãå	~³‰ô4lpô4‚·€<Ã¹â7kðŽz©g‘N²5*Lâˆ]r$'¨‚à?’&Ù'<ä‘1èdÃ[14¡€rø[ŠÑFÁ›ïA»°­¾Ÿ_ú®ÙÖ•ÖÎy›>•Ô#«Ä{¢*4(ˆQÛà]µ[kë0Kÿ‰¬/·,â²3 ‰K¼ˆ$8´' áxa³ý•jnÒ¤Œ‰ŒÞþ¨ïø|ßÝ^ð@Þm¿ £‚Î[~ÅË=Ð·‚×ª_9J°/Ü_»\Ø¾VõôEV.jU7¥”z“:«¨¹ÌŽ+¯ÄÈOVUxÃ¡kœ2×Ü(/ìPzvÇ{g;Ì¢rŒ–K¤ÈtB¨¼–ügmêSG†R·Ä@–â±¥žZû5û”åç9þÛÚU}(°šVËÞzY­.ü–L‘€ŠUÍ2±#—Àµÿ	ì;.N÷q†›Ììðù‡¥Yâê#:à¡‰T(¬íÎM{ìå³VÔ5KR"¹|yñB"Ÿ&¯€ö#M²8aB¡µC|ÅV£)$}™W*nh¥M«Wh×kï‰VÐnqÅšTx<o·s%	ÕŽ•ÚGÍ}m ë\]­hÁò#oÂÀŠm¶ÃH2j>Mq4¿@£=fj¯¹’WLÙŠ×þ-ß_a-ÕhN¬ ÃšÏáo¡Â±Ìq0•Áøví3ÛýÉ„Çÿ9‰ÏÛ¸Rµ;òY$zšÈYêá$©ØÓSj‡Ï1¤Qcoƒ£º”ƒ¡ïÌ$¥°ƒjèÉ"ýÄluÀ/A|eðh³q<é«dê,ó¯stb¥¼W©<QŠi4ßiš¢ô8®°¼'ïòÓÓ4f$ÏRocÜ¨ÞŸ¤QöIOdÅÞ,FiRN)_6à½¡ÇrÇÉip‹Xë>ró_Ë¸PUìgñx‚úG
£nÓüû“³ò‰­êÈêýL^dÒ¸•üF?í§)tZIiƒh4áž×s² vmÈwF °)€oãh\õñóáT/Oóuò‘§²a@ P\}0Š	2€ô(‘:Ø7rHª_	3Ñ7‰P|t‰ ŸÑ=„Z§QÝ:Á¦WøTPQœð“›7ìØx³ïÙôL;SŠ*y	‰(Eèz£Á›]±	`Ï0Ž‚Ì›À8ä¬Í‹¸ôÂæ€¬E#úØe×z¶y³Æìá}s'Ñcô©ôx[ž©¡érÙz[ŠáØ{g‚iæ©–w5=×Ñ5kkóz&ócƒâºôhEà‰¢mD‚<£ÌËœÿ7„&nžH“¶5¢ÉIjzm3˜Ç²	.‹y¬Lú9Ícw^Ûç±˜BÎÜ(Õn¤úLÉ°*§ù9¬dÔäˆšëk	†ÍŽ:õ5ì2JôTÍò½Œg¹aÆÃwhïÑhçþÀ—[qêG-Jt.þ¸_å/òó¸8 §Ýá~#ÐÙxG”gídd©;X‹PxßÇ“¹ˆÊñ(0üaÙa8»í€ˆ;} ­YÛ±¯APOêH‡:òA5Ê‘Bk™ÐªÔÁzÇ:/sq‘È\~±8‰¿ÁÊ1x.3n96&Ñßþ®w`œ~`Ö»rºÐ£f‘Â‡Oõçû8zÆqF.2ŒI¥ó5®TWL¡ÓÎÊ¦ “ù}Rþ:×M!Ô{-kÅXã"˜8Ë;Ïß½|ASÓxÕî)sV^ß‚B?^Ð`5´Æ_õ”Ú:ß³«9ïèUZö©–`X‹ò…Š¯¥n3$X¹ðš†Š§°Ö¢4¥Ë"ƒ0,÷T; <Q
p'%pýÆL3€S‘Ë¶MÅ]R„õÐ\÷Ìäzt±ëgh©3I ¹†™f"-®v˜¼²·×·³::ÄÈÃ–a¾E!?ñ3šØjéÐÄ’nS¬ì¥âj?üýZƒè<zúÄ²ÊD¦žXÊdBs¾Aùš!PoèQèëõšÉä"&TiD~ì¦_nl"	p–dè<\)y (º†þ&_ïÙi4ÊÿÇ)~èóÙšçø²¬â™4ëÞKšéïæ¢‡|*ƒÖ@½6µ)¾{×d|ü^d4›HA(x=‹2Ú»w­ÍMŸ™û+2,N,«“Ú5%¿ÃðÊÌ*ï¿®ÜQÕ}óò™ Êô7²g|Xßæçr×}°³$¥fSxI„vökx^AyÔÉb<-“ˆ>ó¨5rµ‡”•EÐø^.©"r ì&XcŸF—¨ºkc—(ÓÊ…¶½«KN~$m^xÜŸ 0îsMØØãOvÅoØÎUÕúš=óQ¶Ë~$¹
X^uü™…‚¾™h«Û²?âM¡¶d³è¢½ÑuÐÓ3ÚÍWq]š‡>–ž˜_cöžÏÔšß ’{tÚûaÉ‡ðj•çq-ç`ƒf¥7×±ÿE!yìdÜwÖààq=DÒÕ³¶"œ€Ç'•«“(ïëÌ‰–Ï{Éþ6%u]]mÀf[WÉŽ—S`äŸz¶úyYöé…×jì$³SRâÕ"žçŠDi…oÌ|Çui2erJá@g?]žCx²ƒ<T\Àºwåjä54ÜÛ‚>8@=÷MÄ[Ö8Î^†®±•ÿÀÀŠ[f7Í½~ ´…,Ÿé‰w­E3¨Ñs†j
Är:µŽB¨ç-ˆÁñÔµÁ{?6pDóÈ:±Ü›‡Þóz"2gWôÄení°Mk‡¿ÝÎÍÓå
tÝº3ÔJ€wEÚ¬ìˆÕŽæ±#ÜºýÂDƒwA7á¸V/Ž²Fðù¦
ž"žÑ¼¹ycèˆNèÎò,wæÜ½ZK6SÒ"Oo\‘fc¶Ñn™¼…OÏ4nÿOÁ<íý'‰;BžütÃs¡µ®¾[ÞMé˜ÉÝ€¤ë¡dÓrL€±éÀAÛ,…Òv8õ¶oÃZ©ì
¨€Bù‚F\¾ñ K¦ñY†—ÇXª§â[@må;][4¤­áÁš¯+õ
â|™g[‰FU²ÒYp%»µ†æ8}œ$UæD×A7å²}Òeè ¥ÈV$­¢}Qìõxñalx|CJþ<œœ+~%¬C5t»›T—ÙÖÊ9ÐV1U½xÕüÉ¨™Æ¦^ÈTãÉË#@¼­Là²+1ÙéÓÐbíU¹dÜ±Ž¯!²ñ(ÊÕ®w7¯Û/A3[óºåÛuÒQo´\ÿa'%ùÓºÑà†ÄvOnlð†NÀî¦n'åíMw¨W‚°	‘mŒVÐ)‚j<æ°%DKÍõÒ’0ø6¹‡šööß»$a—bò#tìëhÂüÛ
³å¤ä‡ÊôÞ!Þ Ö˜ûïÓ.¬k¿¦¡ì²ƒÿ#aF£¿žÔE%Ú9ïá724ï‡6»üü[—ÜÕºw	¿*©RNž•âµß®Ø°|4÷øtVl^Ì©èíÜ!“EA¯[Qu,™1p§,Ÿ1½À©áanàÄr´¥Ü¾i.ÝBí;g²ç¢vÝk:µivJZÔ²Ž¡áÞE•ì¥Ó'åÞf8í’žBûôàå÷•Ã7²^sQÒ:ïÍ/èðêw„ÜËßs¶ÿ:Þr˜Q?AŒ³˜'üS˜Åü»ð§¯ÔQŠÎ†,¿'^à^óƒß™ŸŽÇ±öÏöÌÇ9¡9;?2€[”õ¢œb›%¡gËxw'f JY¬Gâ­7àç½÷›q˜¬õïö™:àk°UK*ï&0§›ŒbŸ›÷7<N7uWŠ-Òû¸½ÁÀbÎÛg¡ Lòùí]¨k°EÂÀ{Kqí
|×b¦Ü£g–WˆØaO$Ø!jÐ£KÚ@©K¼îj±r/CM¸-¬Æ·(²Øí«,G³µ÷h¦Ö¼ù°øÕ¾éÂq8,çn–žÝ´0ôzBö°¿k7üÙw¶—~©œÏˆ³Äz6ã¹÷ý“,7)‰Ï¥{Õ
la5¹ôËátQGgf²N¿wHÙ6òvG{¥±ÜÑ=÷‰½…ôv'fÒ¦«é÷¡Bh•5î!ß]Þ¡Üá‰LëCÊD>†û†ÜR[–ã_š¨Üú†~VÀ—„•]m½åþ©€ß3Ô· á-y™²µ\øÞ]ýñV·¡vLä»³d	ÿ¶SÉÖËiÓÈã(ÇéÚa
Ù(PçKÚÒRê¦ÊvóI$£6›ÓH…nÖ'’ªð:SÉêr`i¹šÎ"<j}™dPÏ&ÒNÝÉ+]æ”‰»w‘MÃF“°é¬Ò[Ñ.}y<Tn9ˆWgðÊ'©¼PëúB½o#°ðdPR"³­ÙfÂâ£-×{5#—v?#N¸ÏX>KÒø4£nÈýî^íjÂ¿zŒµ¦Üb Wb©wòu›vµé?ÍÏ34?ý\C®®eü«G\µä¡ªÂp–,œ½>Ðœ%}•_ßŸLˆì-÷;ìÄ‹óŒýË¸,Ñeîo˜nM ±m0²ÍÆµÞÖ7ÆÎ»ãkGÄíÑµ]¼b'íóŽ±>¥mÇK+U»®]<ÃêÔeÛ¹”IÍH5»ÒÎ¿nf×™·ýbªÇÒY¸6¶³~%à¡Z<ÑUÖ9„¿£ ½†³äèiöp49ˆŠÏ°0hÊÍ´ËvX-ÊvAÓ¨ÔnûU´æí¾~™ÏhL,ìz#Ç'…rWaGÓ¢Æ²ÞšÚòŠ1tûº¸+Já~öhBhAº|çÀ^ú§»Q_Òg)û
Ôê½kvÇøk¸CÆ_ó/þü· SA%µ­`È,Ün²<hº³[dÜºÑôÙ	õ=ŸýøôgX“1Äü¹C:['hÙ¦aÔ+L†ƒ¡v¹[©óŸQ´öXêÔ¼uZ^¯’·íTrkíOsºfnüÂi€€ÝåÈð’ä_‹jd[3¡‘úgY|ýMÜà"ÅfýjïšŸuýîË¤Tý6ÔÒ~Þ!d}m8ˆïŠ¨œÞpkUGufIÚKGùC6IcTp°ë–èfŸFªP>=˜«êÕÃ½ÇéÜÂûŸ D^Ãw<MÞà§ÉtÝÅD¥ÿ¥éæS]µ¯‚>Üµš‹`òøqç0eóó>vì-MW.Ýñ­ŸgVo¥Ó!]	çáxá‡~æ]zÜ{‘R—àÌ§ÃOF¼h€âí—óxÙúÿ+[ggû)Ö’òûÀÒ…øîÂ‚Å¯†r<ÌÏ²¾NžÆèM*$Ó8£C¸h>ÇKf<z$”òôhr¡9R§_åMeùy ž% ãûPÿ}ŒaŸ7õÏi¡>Ü3Ê¡I²ü´¥%E5EÓjùù¾þvæòÃýC_ÈõJ~”ß{³$•_¦<Ò¿0{D…8±Së£3Vñ`ñZ±Êe —9WÔŽ“*2Z=0ôX:`S™¶ü™`S#³Ü÷gÙŸL€ðK•ÏÀþ<žWÌ³»ÊðÐÎðTGåÀÀ%Ìi«øpÃú~@%»£ì$Wy¬æèÊ <žÇãääRåÊƒ™¬»"A§DHÃd2La/ccÄÌ1g¡¼yï@¦“Ûl‘™a–¯È ¢¿7È¢ˆd5sy¾D¹Æä;»ŒßIþÎ8¼úŽ[[ùfú‚Pd×GáÅ«5zó²Aþ"kš•íØ¡Ep‚âJð&**Í“HˆŽ#¤­­uI’ýç"¯Tø™‰†¢¤E™+üÙÑÚÅ=+äÇM¿£ÝMd}ŸWˆÇ1;ÍjÑ+YZÆÄÛ™éƒ'@:­Q‡§ùE‡
«>Þåõº´a"¯MÃ0‹3ç«ž9X 2{êòômld»ã>5®VÙ©8k¤=q^¼>i·•¶´}“»~z‹ÒlvYÏâê-ÌòÙ¥Ý¥×[‹AV½$Œk—ÞÅiÞi
õ‹@dÙt¸ºüà’ÂÈoŠþz0‹^Æ•7¼åd6½¬.ŒxKA=¿.£xóC=¿Gtñ£ùRÌgÖfÊ5i&½Üjd`Žü„µº¯ƒ°D#/–çïŸNmJ2s2jQ7mPŠåùûxf·cêkGsˆa>?‰ªÌ…Ô S$ô°Š3©Ž¬è-'r™íöŠ‘fÇ3æÂaU>9sŒdâ‡`]+ÀD,»Ë#ªz`¾‚æ³K?]9A0—Ã,×Ï2ÒÒ­Õ/þ†Ê3hYu~ñØƒe-YÖ–¾R†Äg/˜¤¬Tæ$s¸®)`‡Ù.ÍgLkôíŸ‰ÑCtv»0Äo
ÝG\~©ßO$,/—¹©ÂÝøÅ
šÏ‘+Ü=ƒ_®È}¥½
?£á9C¼ûZH…VÂ``Þm‰Ÿ‹±¬Ìï‹‚q¥iMžEÔeüIhIl	“BXy"·9žR5J,æÊ}¼\¶åz"Ö¦^L“¢D·|zZƒ.@	è~]fwd'^¤F‡C3žÚ¼ZyôÂÊjéy´¼Ž´t—aNuQè.µ4‚§F”
§¹˜¢:ÍE
¥çácâ—Äè„TI÷L(¦äÀÛ¦-³Œ-7ðR®êé¾ÝbŸÔ ì×L=ÁP2ƒAW[=•÷3ùÅÖ#’+/pAb¸á–}êÒ•#D-Úrd1O\5ÙÐ)éJ
ª´O‰fÑ›WNà*¶{º„  R’!†ù¹2‚Î^Láaxÿ6«ûÐ">ÿ*.Ï¿Ä-t×p±:¸‹ûÐ"9w+„»´oZ$ç[¿Åt÷-í›yßêmÁñ.ð›Az×nÁI¼ëú¦$HGÔ„O?º›Þ¸›|6=¼›Þ¼!›¾÷ØôÖ-Ùtp©¸6›¶çì5Ø´½X4eÓöÒp6½qk6=¸5›~6½y6}ïVlzë3°éû·`ÓnÎ¦íåáºlÚ^"nÍ¦7nÍ¦%AÊÍ=’!¹ÛøŠ'°5ózêFµü,žhIŽ›lj/ ås¯ÉØÙJæ|[ˆ%t]§q‰7ÏÏÑþÛ¤l¹…UZ=+Î“ðì©InyPÕ(³<ëÈn·Ÿwó/sp¥·såÑ•–yÕá•‘õßãøjîž }î£*o&fYDìxØ›Íäv"Â	ý.ùÞÔ[|@
l1µs\£ ¥º–Tª
YÔÖ^ËJu…,j)0‚%1Ð±ìb±*7wc-êPjŒ`	©·¥,MF°dtªÊHeF0w_P3*YD*5Xtàï)†í0Ë5h÷S&Jè’o°ÌÔ,3­/ã"ÞvßFçj|r°¦ÇJf›¬q³3XÖyA‚1Ð ¯ ž­ß¾yGÞDeÉß÷_“}òäPO¤/Ê5œÇuðlvæv*ÈÈQn&nw kÔ[¨× YÓ5ªn¨Åé÷m«¢òL 2ŽÏŸîÔÑd4dEGÔ×5²°mÏ6§}Ä	ÆÌ.ö;¢€¹ÿñ179Û’FÝ­ÏŠâçÊ.,v=+Šr!×-oH¿^ jg#JÛ{`1ÜÖè…žÚŒÄ,"74¢ŒµÃ	Rû­ ½¹ñ6¶0¢°g_Ãë­‡­½ŒÎ‘¼Ûœ g´]ïz@gÑe\2iðeÐ6TˆI1ƒµÀBF·^æJ¦íÆÂK£;ÅýíX€]›.(ÞæäåÙˆ1l‹Õê„bùvy<6-IÅ7ßg¶ÿ
~#Wú´» *òrRŒ’[E%GY»Ç° •;eíÝc°¬¾Q”¥ÝÝãÊòúÑãîƒðŒ}¢äÙ=JØ¾ýgqÒõEEÃ,¡ûKØÃaøúôÒ©³Ðó?Üþ#)%âµc:ôÑ¥žZ“ÛÈ,f²i-î-äU-õCÈ”Ûl.´T¶ºÿ<ÉÚ-ÒRá¡,Ú—Ýöâ¤_›xYK2š%]"<£Âîö!Ê‹*I?Kó¨âŠQë¢K´SíƒuEÈx{›<à×¤&zÈfŽµ1Ï0üÉp/©‹,ÂXÜ)*„½Ô£|é])ÿŒA>È®—Ã|‚Ò}]¹üKRMÛk'Œwò/Š­ž&Eø$ÂÆ¹aâEG°ÕÏÌèdìwuÇê<3ßg;<šÛ®S‹—ÃÔ¨Ñ£ý!ódÒqÊãÞh›ý1‘lç”û!ûCtÊä‰v(žðrÂ²²•HöG¯Cõmµí±ó3
Þ&!¢¶²OÝìÓšì8¬$uÂ¼íÚæñÓæÇ‚Zß9Ï£ÜÇÅÊ˜I®¾sj	ÑøX.[ ;Á¬è€]µ‰vï€3‰mÉ.¬\W¡(yÝþd‰'^Â¡â‡C9L¶°“ÍµØ™$r}ufIú¢¯Œ¡oújgç12sÞwü‚xºê†
’/µðYm„ÜÐp²„aÝim“±Ù$|¼o¤Ž&ŽUÞ	gú Í·.gé°ˆºêuÆ¹µÐŽ]±?üÆþÙ/ÑN›^ÿÂúM´	÷¸rpüçw1ìÁ™¦í\0cÚ]\ð[/}&9æKÅ"ñ¿Ã‹ªûâí«î!2¶îÉ»öOã.òŸŸåírïÝ§>Ôý‹°Uí>Ö¢ÝCkïú3Ý vø¶³{hl#µ×£‰öÂ%ë.*ØŽŠ>Òðy°çIð¤vMÝ×ú6¨{dM¼'j¦=W¢{÷9Ÿž©	ôRÍ˜Ÿõ)ò³oNè“€Ë€B­¡îd€CóŠƒbñ{÷—E”u»¿ÝÁpóÞÖým†Ý@j™ÆçÄ"¬\w¸1Øèmzƒ-ÈßEÉ û {˜ ø8Éàëp³·q¿·±Õ½¶6º5
œîÃ­>äèvß&¿G)Áœ<oJ—þ^åPM–¤¦–÷¸êžÈøí‘"ÇEJI¤Ò ÔÆ#ÙGb†ˆ˜ã(«ò’îþÜí>zøàþÖ½Íá`ãÑÃîSû%Íb"eÐÛØì7ºƒA—	!´»ƒ{»š–©ÏºÙ}¸Ñ‡òuù¿ðû[\vÿsÿžgä 9:´ð÷ý³¸Oþó Ë¸i÷M<)r¢7^¼`·eŒnË3$2íãK>s¯þ+ûa)hE^}dÅ5£4v¥ó	<¶ß+ º ë2-ÒÞµ\‡O?§¸¶W»‹ê¤÷ð§5É˜åÕÌO m’H5ý10¥*æ4ÔnE-#÷¢@åñ¯o_ð|,ò¼·±U<+‚ì£ž
–ÜÑcYN‹ø¤ÕÅâá<‚ÛA¾çÖgqµ±)¯8ìCŸZ”ê2ûgI©Ôjk,Vgº²o£|rÙæwô`š¤<Œû¤ƒãµo!E›ÅŠx–ŸÅN1DEŸåŸ4Tˆ^2Vn8Ép½}3GçÔKíeoƒÌG½òÚmg·ý
ŽÜëß‹iUpÞàyv¼<O4áªA÷6[ÎO—¤Êçü{ïÞ†æ¶™OÛ­ºèu€hùÿ3Ýdxœ%¥§«=-;~•ËË“.õ`ø&•‡v|›&ñß¦ÇkÅEêÄa…áÛ,¿ÅMÂýáïPÎÂV?ë{­ÿÃƒíñú¹6cx1ê»‚W½kí½>9IÆIäu¼±³>X)s§Ê+&C^ip
7bVa“DÁb…PB\¤'»K¾] CÍÜ.èXq„vÖç5Dàó'˜¶rNÂÿbª?Ô'Ï~rH³à>ãäõ	Î‡(©´\KŒÍ’JmÿH;ðw•}7U9y1Û]âÿf?£Ÿøƒù5ÏŽ£³XyÁ°77Íœ×2(m×‹¶E,šý®ì è™
oø~fÕÂÝeÈÑ¬ˆüˆàOæwÓAÔîÒ|·`É\¥ÿ;£µ]A‹Þ¯¥ü\ÚxW$§§q!¤Ùö# 	~i®wÉ,ÎUÐ•–¿¼ÏC?6×Jõ»êBë†Qã¬ÚP-aš£X4qHÝ¼ü[ÑvjÅöÈÌéÀ#Ö-Ž¯ð×9îÙÔfAÛif™1áø0b[H“˜E>|¾þ„úV&L€Ö&š3‡Ü˜÷¨O’bI5€IuœO0·Ô:8,Õ,4SóŒÕÙ6 %n`Û_®~«9¦¡1ÆöÓ”žpÛ(ƒ ©ËžI*Ìé*_ŠÀÛdÃnbÄ?#ÓÀÎ_$U=]øL.â	T¥’êûÁ`ãÃjq®GÝá(Œ8ˆ.˜AÌžµlìêÁY$r9ž\ìZBPoæ¨Ã%èpÿÑVWë—ÀÿC>yÑVn@ËyŠ	_·:ÛY–Ç+VsU- ‹ï]ôèfCH ï‡°óú Dø!ˆÔv@js›c0$åè>\áÕÙŽq;2T{·tïZ[šÛ¬M”ôW‘×lÔ»/úq‘ñ ÖúÀÞ•Ð6Þ±îùânzC÷í@[¾ÖnGÂ1AñÈuœ½,ÏbìÅ½Ö#s›-Ð£÷(MYPü»MÖ~Í Éi†q>ÃF`è´uåVÀ
†-Úƒ7#q¢C“zp·_Ää2_ÀúÂÎ£Œ	bì”Üˆ«­½šn
yQ¨­·e
UHòä+yìÅwGµ˜ã"VzI˜úƒò2RM“R¬v±³ðš¢IÚö¦Ñ(NKÀ1y‡9#š–ý,Ë+2Š	P*Œ_ß¡žùêy@gæi‘Lè8ÍJØ*R=f›8ÖkÈ/ÅOßL]êlzàÆT“Ò¢wÀõ(»ÖfÒ|äÕkæØîÆñÜÅÍíÜÖ„ ãÖãtUÇ“€Õ$kÓª-lˆÊÙÁvú²ÍÁÓ3”’Ž J)ÏªþÑõå]é÷¹/ Í­FÛÏY N
<ÄÖÆ–ã`Õ
ÎÔˆ(8ßŒ4&_ ôu%8˜
_º.Æ•ÎéÖwYÎ3XÁl¥”uï‚=M{ïnM?ÜTæºžXrX@}¼<<°BW­9V÷->ôÐ¾eË«¢>z¸Z=l" 6WHË¡bú`Cãši¿Ô€(: î‘o("¶öÞÆg}à…s\9×ÚXñ[†¤²¹i e­™¨ãÕÿ÷ýoÔûV}Äæ©!¨§¡äF”ç*ôiÙ:_é#€2Ïn7éÚïG•kÍ¥~5¦¡?pí§!T»‰uvV­Þô€[÷{‘o}>²3˜_À¢C]Ä¯QÆùýÈBÕz½kGô¹YöÏ,/‘×Œ>n5žòÐDìÖŽÕ«užÓ¯CÄ~CŸúÞ3nèÛ#§ëH7C7àCHÝùkèLp5Jü;s'(MuOŒ!öÖùú×Lv„û{Ï¯Sð0ªÞ@LüŠn/=³g`Ec5zØK?óü„P«"¢´Ö¤½?Ÿ§xÊL§èì¬ÓÚ½íJð`Â;th±KÝòùc¸[\¡l¥9ðžœSvu(~’¥5m·¨ú Óñ"ªžªóŠMN‚õ7‘ší.G‹ô“e}…èóO˜iÔ;ùî2æ3í‰¿xÛ´RóÎ;¯/öÆËPÕ¼
	[® 6iæä­Ñü´ö¨ªƒ^N<O»Æ$êI`Ç ôCÝ×s’
 IàQÊ®¤KeÛó‚>¡Kq†t2/ò3 T®z‰ÉÁñŸé2SÃP3³dFœNú(öœÅ$žÍ+J¸¤w^†Bë{%Œ[ðŽ])–_öðR ê8	]•Ïzå{8ŠŠÀRíÐVÄÖôøG£«v
«ö„]oÄ†ñl¬ÄÆC‡â¡¨,¢‹(¨Ô[½2¬52ºœÊSX¸?Ê6v§Caõ™b…¦„S1ˆf&“y½2ÑEu›x5Ë¡5ÿÉmÞ ?Ü¢;=.•X²
ï=Ï¶}¡dZàêD<S
èGì!füó-OøóµºÒ,ô¹'àªÊÜfà*üùZÍxåÁÀ5æ¤Z~<ïÝ'Yþ:6KŽ¤r#L;áäÕŽÕ¯±ÛÍ:lã´»’§Ö’}ûŠá=ÊªÈ?ÅI&ÕtwI·³Ð$ÏÙ½¨Íþ¦&àáZ„Bó ¸öç¥x¸ˆ;»†µ0ˆk›µüÈ×½MSˆú¡¡kú.äÑ8¼fF’[ÃÑZ¦ì(º6Þ}|5ÞÚrK,¦:/¢ù
|¬õ4Ë³¼N¨ÓH@ÿÓ"kÐ}¯âõ>Ä»½Ôw­®É‘n¾Ùü:PrW,üŽ˜|DXzqŠ(F
6ê9dUwrè:GÎ€Ïéå
zÿ"¨õ¡×•5æG±iED'—¾Ð¬?Dpl1KZó­Æ"’ŸÀ‚R$§IÖKã“j ?zÍÂÄÿé‘¥€wÓ°Ð`€ÝIö/°ß…ëYiøsðSÇKí;eT';±6{ÕTË>IÙ·KQ[^Î†ÌM¯wø¢"FÒ¹$Ó”âþ MÐœ?>Á(ìlGó¿O/ w#/Þ¾*åÆfAÍ»&ö®÷÷vÚÈ¯¨É¹ ùˆª9|Lþúç¶V@Õ[è}˜ÕÔçÔ€M’2¥ñd7¬§Û`.ä­²àŸ ÓU»b±œøØWÈïg+E«Wòë^©³;¿~¡^»¬š$ŸU(°ö’ôû}ØFn¿j$W×Uëjslÿò¡ÛúP`6ß¯*.k`¡7Œ*ªi˜u¿jPXO¸ñûÉu	ð1Ûˆ×œ÷+ÊÙ9ßXU"¤ÁjµjJ^áÞñ”´ã¢¨M¦)ÈÓ¸ó‚f¯ƒJoj§õcZ{;Ôô3Ÿlêã'—·¶›PuØ–ïýá‡Æ’9n‹}9¬ä2$¤KZP%	«Œò{xcá¢„}(â~ì< ®»)c‡ˆ‚Œ½ê‚›˜I7²õØY·î”/§HÕ‰N¡à¢jà-‹€š«`õþšì¶¾µQsgžkíÜs}Ï%-ŸT$·«-­»­_§üöÆ\üÊ‚ãCü„›Ÿ£ñ“.3ê2)÷u¹¤+ºLÙ
 °¯­ƒ¹Ûg Î4ÂŸ©æ$0”% L„a
_áÓ•9,ÛÌáh°“Z»–Ž§	ñf¡ü>ÅÑžŠèõ\¢+›(Ç¡q44-ýË¡µKª7ªY­DÙ_ž“úÐô(Ô>B¡vU&ÝÙ¸ƒAê•+ƒ¹F[*Ó[Î[íÏ…bQP,ìXÆŒþ7lâh\±

`«,«˜fR lÐm•EU$0j3´µ-ŠÄ©§atã*É8Ñ+c@{·EÖõÚÁýÀQ:à‘¼RVDž5Ó¿šv®l-Ájíœg7M–òê‡áúH7e*[€²gìpízˆ×zÕHPÛŠÝ„Ánÿ¹Ö8±sxÿÎ·ˆOv—ú%B¿üÊÎë1_Ë'‚-Ê¼ÚmQ þ,Úxr¹$¨Äà‡äv´oÛÔæ}ÅöÜ{`îµ^¸	Ñ6+<>c>ïÑ¶º¸ó\÷²µáå@<óVTOîùÎSŽÚmmžšdÅ³„‡ù£×áLfÂ–2~Û|r– cd:ŸãËF`2K²ÎdÝ+ÙãîØC4ái9›Oì³o;ÔT=š¼) ët#Á6@Ç¬qaƒ~¹2=¥e¿Æê¨ìT}úpõú¨e¼6¯Vvæƒ›.’G“ƒ¨˜¬bÌÂ_9zZÞ‚Mvó(®)E™×Bè½”/Gº]€!2I¦%£ ÔÔ„c)“°›¿qÓ/8þê‰T<ÜœnbƒÕÚÃi{éjŒ(_cDs6FÐÓžaÀõ5F”³1²÷û®Y”ëhÅIpôzùåB×fúè·æjGàŽK—\ø/X®»ÐüÞìîÅ—Ø¦Š&žÅE”NäTñÎ·xìŽófzøiLäz4xcxxè–
’ÊæŽ:_E:¾ëè¿üÊ.‡v¥Ýg”kóÜlŒ•%ù-†Ø9Äß$SøÇ«Zu©ÝQ¯2LÜ3tŽÕ^9O²Ö^à¸øM‘ãDÆQ–ûîÖFTãQ‰†»È¢®ž©S“íóÞ}Û”uç5žê£Q™§`Ñh	 8BoYƒõ!aˆ õ’&˜,¶füþ­“îˆ=~ÔÍá(!.v[¼òììÜÆ¸¤ßÅ¶£}¯ÄoøçƒÊ’W™»fÖEÙkÉ?O©ë¤BP¿»îj†Ö÷üV×(“…Ì´óE…1–˜U£µÆËÝDYg0ëõŽ‘PÀ›*oœ’úmöå"“ê>qqž›Z#·yTþêã”½„–¬žÌ5Ç¥=j{SÎ”žW*ð7ñ2ÿ¦s\ ›…Gó‘Çn¡©‰¥î¡k$. „¯-¸¼q?‹ê]‘À\Hc1‹º;MV)òFÁùæ‹´Œ½ÛN¦~ñ½¼ãþÆô©x’ÅDj%&„Åµ+Â_	×÷’}êž×e¿zÇRØÈ-@ž±s3TEÝîê§Ô*wCž„ðW;®–­g 0/¥z–„ÚºÚ“G®uÈò
B~OôM¤E<öÂ|Qé(ÀifŽÞ£ÁÚ|‹ë§4.ë%0FQü(Sß=„ÆÜ·…ðOº[‰Ûu<çÕùuÏŠ*÷–È»)¢Ñ®/ÿdŠW-FÈ0¢É„]ô@[ª’*P4›€°A”t¡ûÑÀ+ø5/ÒÅL›Øì¨Žº9ôUE­Ð)Qùiq¼
ÿV-@*Í¿‡­C7ZìBHR€ä$…ƒE[}‰×U cØ. túEï@¡aXÙ%è¬¶,qfâsUHONFyþ	“2 ºxž QGÅ¤ì[£eo®V]û ­_ûHOµ×ÍÀÅi#’'*å¶^ñÀÓ–+ïAt`IZ7µŠx“rƒZg¦rÙ2/0 ›Ž®§Ñ½pé­ÕãuÒ7+¼‹Œ©•‚öòùòÓÚ[–ÂvÛ{1¹áÎ}KîÜó,oíÁN|› d‡¾/_­ï¯…j_'ÿL7•8×SPÑ]^;tW'`ÓpiÁŸi8C¯å¡áoã•Ã¸¤p»µ#=56u×æÆ.£òŽüµ,VlkÞU
ÝÉúŸž×“7Q§äOëêÓç°QÁ»™†—ŠºíuRÁ¶–Í@¹QþúÐñ.|CS\·CY¼¸CßtÝ¥¦“žùÄÕ—QQjRjCwbþ+ŸÓÍæl.tUƒH¦GiAs ±ÙÐ;ÈöêHÊa±áR™Çüð¹ÅòÙf5³0ò¨¨Å@Zçö[":[Ò–@çB€ÄãÏVÏ bKúÐ§Ï×›Òá»¿°mOA¢UÈ­Ÿ»z¼ÚÝe½ ‡ú¬ÜÚ¨áæ”â ˜²¢ÁíYœL½Á}}nêÕQ•Çjç€ì¯W¦µjwèÙ^Š;AþýdøÎ¶·®:Ï0rnÓ¡Á«œØ“×ëýÅ3}å$Ž%&*¼”‡&!H&JþÇkÎ9lÑÞ›^ÆFaùú¬õ¤ìWQžå©ßw×O:FdÔ	Á¸kcYßæçº4Œ^l¯ÈÆ’È*Xö 9ÞñtïÐøzuž³öÝ\‹Y?ÈjÌí¾øjLëOW­ÆŽ³Å7ºsrøo´ ûén¹ ëþ¯¿ ³¨{_uIÖªür‹²˜œµ‹²9³n±(@_bQÖç¯oU&›_oU¦5ŠUÙÃM×e9jÖeF+ÿV+3CÈçX›Oãi™D_ty6^îX]Ñý»‡>5G>ë›uÓÎP·o¤‡×^ÁäÆ+¸hî—]¿U£¬Cµ‚û¸Íó8$ÅØ8ñiêšÛ]¦ÕôUGSâ,*©¢4·ö~fnž1<áÞÛ^b¸ê¸kõF—ï…—|oWî‡½€áµ]æN4=Ý¦>·Z{òŒyG<!£8…iˆ}áîšûBÈ0—¹¾ö‰«N©ÂŠÊk()]‹¶…òyîÑZz4–Ÿã Lž|éLygÀ½p+ý¥ÜƒúJ]¿ÙèÝ{ÔešÈùº‚–i­”¤æŽ³ùk/HÖ´­[š-FÜË³]W?k¼ò²ZšX„`»ÈFžÃDÅ ÚÌ›´Ú7.£q4‰gÉ˜g ßE!s­â©zFý€ck·â•^ §7P¹æ¢`?\’;Wå×µîký=zÊŒo‘±Èkn—KËä™ö³™Á·†*bõ„¢‡«Ò?ÏKmt¨0âÖÉ£.ÒàWØ.Ñ‡¿PŒøBuñ†€ÕaÿñR…†Ž«ðHšŒÚgcî»i}=ö«Õ¤`¢xè€}aùT˜!¯k–K S¿hª9n7ÂBóHMõqšêh‡…ÉâF¹×kàzˆÁ˜Á˜ÜawŸÑé).[ÏÐ#ÆH^’dÒ%c×YÄY—ä''PaÙÅj_‹ç¤Ä“EÀxÜUü#Ò¶ F…çå¹ÚF£I€¬J2pÈï“	?¾¤v¡Â—;–,Â®a[3ÚÈø,Æ}> ‡¶d'¹YÑÚÚnÃ¤>SßåÍà~¿_ÄMQl…ØÚBKbúãþéÞ!?ÒÚú¬å}-äü¥‘ýÒ›]ÄCgãÁ=n¡NZ¥ò@³ÇåÅ'€íñeŽêžFrÃ, Ï8ºÄE-þ*£pã(¡±-à>wùM!ŒÏZ—ü~’àa¥Êa×¶ÏãÊ¯¡Íßš6ß5;_È/±ƒX}W²›c0?¹[ÎÑô*¼ƒwx¡ÎÉ¢ˆX…}-‚îì‡¥|»’‰Cù4©¤/ñjº“U¾¬Î%iÄª»nä¢wW 7™–#ÍX{hÀº	Â$umÅ<wÙ%Þß—?éÝÖue8ÍU>æ­!ù]¯%%küïhž¥÷Fúß¢3‘+Ë-çsÿßÿóÿK`¿ˆ©ql{­c´FÖ4w	šØ³lC°Ó¼Xé$v9{‘šôl“Òø·ýÃRÖÕhK¾^Âkç£—>qCæ4SãŒ0)òN ·Ä+O`€®’r
!Cl‘îýœÒ®!3dÓ˜‹sûmy%‰}‚?8æ'@¯ÌfJ)#£ÅÙ€¥³êùr¶Íýå	ÄEÈ9‚‚q”Ñeàf¿åéj[ïe×Ûµ®êJ×in×i(0ï÷ºª•]Õ2øD9ØX5ÂˆgþhÖ×¹kêªxtI cÑ"­ps+ÛÈ¬Ûf]Êñ/(šgé¥RÁ'Õ”Ì§9:!¦÷#p-áväRô^ú2™°5ñX½€.,Êø¸rÝ íÔ´·gÅý±‹Gåg‡¯Âïî{7/ld„ã+n€UVÞLÓ]Ü½[öYGQ°b}hèy]&®Ù7ûE]wØ}~†ÿÃ‹yÂø3Y'ŽÒd‚Ä©3)¼¤²¨Ø·0$àÀwÛ‡†wÇ”"ÆÇ”hF¤@`•W¾¶an R¤«ÅÙÄ Lˆ^µ³ôžº†ìí’Á û­¥í@Úýƒ¶h/¶yK!_>´€g™`ºNO•ªMÎ(.©ïŒã
ZÛúelw¶áÆðJTù²m6÷J ZëÏ<*h`*UM¿œ§I…ÌØˆ1_V¿£»2]b:-ý~ãCe¨yK/sÒŸÀò·ÈÉ€=sÆn.0ŒP/HOù,Dwß¿<?–™S>+Ùl †­ižAÍÇ¼f¨WŒ¬1ƒÜúxªßV¿!«ÿeEõF·­ù‹ "t>ë;"ñ0Qº‹ŠKäl9*=X“Jo+Tk²šðÑhÂKÍwæGÉ]Âˆ—oÑ³L†¬r—¼Œª)p…‹6Ê‚Z=­NƒY¦c"uR2á»å%]

uËÜá{kƒõƒyŽ‡üdBÒ”²šIt‰¡èBÀ¸BQLIÄö…bÀKâ3sèu4wÖ
iÄ\‚ˆŽ5ì²9Í‡R|{
uîÂ<W-d÷ü€ÂÎcf„mW+g€µX"ƒ6R¼nö †wÅ¥h·ÑQêÊ¨‹ý§._a¡ƒè[t%)nýŒV°~tìÚõó…dŒ<wÜW‰yj|PÐvŠÓoYNC•	B°ƒ´¼2J¢TðšžÐ€ÐÁFª‹#–^âßýÅé¢¬ðé8žW1®.øòz\åüñlƒDòÓx,Ÿ‰²ÌH||
ñüovQÈ°—IYÊeëÃOV³`‹+ù¡ìó{{yw>ôñc»Á6ÈÑÚðé¤¾¯³ë¨I”Yž€Tö'zöQ ;"•ÁF€“¾‚«[/Ä¿+D÷Ü1¾>jhbJy¾Fü«‚u%–ÕtœJˆ%œLÎ`-S±Ý2§é«PŸ§2«»¯O]½Þ1ˆ¥À_Pž©ãNÑòtl,Zåa
[)™Šm˜yíš/B®€U˜Ò@nWâ…ÚG#Ÿâê¯3Ÿ.©øˆ18ðO0üÑä—…×¯Þ=ÿûÑ«§G‡Çï%Æ?ÇÉÖO>¢tJPòötÄñzðF§ 9LýâûéJ_¹œ¥€u„3B€D_ÜeA@9:±²RºEÄæX„)GIJl 3œ´QVètIRQKGÀÀ¡¶º}S<ÉMÏT•CêYÜù
Ý–¨Ð¤@/éP¶6—õm[<Pk%ó‘À\…²ø4LÊï’¸Ú§í'›*C?jéB?³QÔùa)[}EØÞªTÃ…ØcËé\,g‚8SÎñ_R>ƒýùñ¸ˆQ-Jý”ª}ë§Üµð’xÅèÝ4FÏPì@¼ÛÅ5Üæ%¸[K¢tü“¬ÍâªÈéº¹.+úAêô’¿ŒaÓVbLã¢J.)èÃižNèC>†M>}*”¹Å,ßì¯£Ó˜eøtÉþFŸEÄjÏ³|<-òY¼¶×6gtÆÌybÅ)UV±Z‰FGÙprmÇž:E |Í.záòox¶OÜk¸^6‡•#c[R¦ÉVïÖ0ÀRSD	ÃV
2d9Žæâ‹7.óE…g×ìùjB=)¨ÞZÞ;‹‹*ó1VéÚ+*&è+ÍOß z½%'i2GÔ¼anÒisž™iµDšdãt1‰ß :àI~Á(ÜLkRþ	pz, Šó¤ÚÒñÍú*§uÑÒ‡F’O®ÁÚsÀœG¸ DÅ§ù)ƒò=Å”rŠgŒð10”ç9
¶. âùSÇ8‘xÇ§q6¾|•W1ÓIFw)«iÑ˜[ÈpùÈòŒy68‰*…ã~e¶ ~íÉyŽ§Î9}•‚i8KðdÄ_U2!¬"£™BpÎ®_
á-×D¨hK`
RÊ§ŒÉ$«WB×SNO1ºÔÚxô×¿’¿þ•ý×ÒÁ0\Y…Ž¸¢ÌJ5ÁæŒ`é-üFK0ÊmttÍºù<Ž#:–¯´×nqMêÇÉ<JÍ^Ð’ŽåëuØrœœfG¬A’iÀqÛ$©(¥`‡@‚x‡ºþ„4˜!8REž–ªî)ÍöÄ¡­÷¹z÷£ãm<_ŒÒd,d£7ÓÈ
”fà¡xèü4F­5KÐ‡“Å˜ÒŸ(Ãó‚$!«D?xœ7ÑïIÿMƒ"’¼ËÅðž§ƒ0ÖÇÉïzKD’ÆæCÆ~Ê=h@dšÉŽ˜1[wâ¶ hYÎžÐ:Z&£4ýü‰—óàr1ª’*ŸeXý°?yûs¿¿åE¢{'Îg4ˆFºÙ1y0Å$hNó~¹Ü’ÑÕUeòtdšŸËyøÜHª]Ø´A¿¨LªH~§Ó‡†,é– P{Àx{Ý6¸ÌI!L*¦ G©çw m•„=‹fIÊ$’gòÕK™kGÎÐ$åSzh+–Hùêï‰²ÊëÓ¾ÖNå$Î[XŠÉŽ¡—J‘~)¯ööÚK¥×‹}¦xÂÎ*@šÉO‹h>½$â\G5/[ôõJKðf÷ÝöPh=ŒMÆ$®¢$- OÍ´€ˆhÈO˜sr`é[á‘àÎ‹Wvêmg…=>ŒF' PãÚ¨Ð/4P[<åk“ÞÐÂÏ©{nUš½û‹:ÅŸÐ]òÛh’,JDO€r O#.[¿‘¯–WE¨-d‚Ü<*KÔ™÷ìƒ9~©É1{¤¼€Jv¢¤DîqtŸB¡É69ÌJXœ)‡€-Èa½æÑ]cÐiI9ŠqTª*I;bfj%žBûONÐ+¸}öwWœwR§Übú+•Á³,z ×EBtµâXüµ2|žÄˆ_t)¥¦Ð»Ä‡h	oãL|9šØF¼fd®Ø¤yË·ñ	ê±Ð¯ÒžŒº¤Å?êQGX©ß óo‹¸¸l«ò]r>Y¶ÝÕ£âbwm‹x´Ù.Â:Î¢y	ä‚}¤1bPŸ”ËöoZ~àG¢ƒ £rŠÏkØ0@öi¬ÚŽG5;ÉÇ˜IôG€tSgI´j!7/×ŸÀ«®ðò(üxE	HûØ†j(oâØƒ&WÍ)ð6ëxjë58
N£d?Æ[e»c«4Í.EìŽšš=÷
Š	ßüÖÇUäõ	£íŽ)ø³ÙÝÒò)É¿cJþL+AIY¿ã‘ÿë²ëÃ•$á^Ùq
Àåš]â-e*jÙQ ûÒ—ª«Ž¡ºòe¨ƒb)nè!ƒ4séøt;áÂ×©ˆkˆÔÇs®UW»¦dêXJ&¦XJ±Ô1KÞ,5€,½Ž––'X´A-\Õ®„g¬«ÂÐítÝN(cDS‡Óqu8Á¬u$¨kL:Ž%”±¢ÚstÌ=‡7K]BÇÝ;³Ö mÂá‚™kà*ÖCMJ¢õX	–I³!¸ì«·ÈJÈºˆ‚¯ç©)¾².*‡*¡}êÀê»9`}oç/TÜÜêyÀ›¿PÁº*¬ §k_,ºj>Ò½¡¾Ü7z²¯Â¼±Yìx·uV¢žjþ‚x§_½EšAÖBz‹¬†¬TAð*K¸ðêŠ„v0XÈ*Ø K\yFÏ*¸º
©ZÔ Ê´pæÕÃ õ…ÿ?   ÿÿì½]sÉ–ö~ENïÜAãºÑŸ@CK‚äd’ƒ%83÷š1±,tºKìîê­j ±x[éÁvè:¤mHZÅ;Ù/V8BŽµì'í?Ù? ý	>çdfUfVf} ~ÌEÝÝ!º*++óäÉ“çûì^³aQGÅŸÎî
‹Â1ÿ¥âé	m¢{Z¢ëÅ"?GAM½|fí	þÃåt4›ŠK» Ô©Õ5…ãÿiö\´B=AFŒÿY5–ð°Œ/’r€U%àRÈYx˜Å·^{J¿ÞƒÇì„˜üeÈbôv“0K…U™À§¢*Ðc.œ¡É9fÉ­dCä)A#ØX¨Pwƒ ¤Û' ØžùTC¢ÛÏ±i0–2é'*Èß@ùÌ^æËªG[fTèåcÜK}Óú-öÖnuzêÒg?È%ð¡˜ùÁÌû™m°A«%þÓjnøÈˆÉŒRí™PSçc4ñ;Ln¥³é:g£~Ì6™Œ-¬‡Óèeçò«twTU+­V©TM¥¤½$‘^h@RP¥b÷®®ÛIœDÔ›Æúïšx“×XºN(MT7å¶âÅ j€ì#iìWžèxåa0×RŠÕYy [ÔŽtHF­– Ø®–jSECnÞªoó¶¦Ò6r-µrW³‹(÷{‡òÄ´bpà¦	ãºÑ!ónúµÞîdo+¦×Ì³ÄœšíLI3ORÓgöS¦e2Ó¢`fòÜMOÚ´ªåÛeŠG@Ò¢ O$J\RËh0'TVp3òORF“‘Ó:ž‘Ò•ÞÝÐ(‡ÂWˆsN×ä¸ÆÓ•³üäyœ0æP¸ø"¥‰Eò
ÔÈ×W"—U!gÀ£tçÒMÀdÕ¸/‚oaµ)!yäc‡¹°ŠÞ"2±²:…“Q×þ(ÆYžbÆ‚‰s§ÌRN‰X pj©Ôl{>ñ8ÄLº¹0»™¥2àòÃz+’ªþò/ßm6›*¸µ§f}×<ð+@s.Â+s`O,‚·³šm…u~
´“E¬‘ò1ÀìS¤C€ÑIŸÖa¿ùaN†U“qÝ¥Œú¢7
„ùÕ¾¼4wUƒoù1OœHM®Àð*²ðsÂÏÃYí¨Eƒ¤˜‘cM™Yæ½…á £¥¸v¡k½:’_}îÍílyÌ`<¤ù¦œ[u"´¤°·
, +âµ%›üwòéò€­±¯áèê¶ÄüýèD}>`~s‚ÀèYäæa Z(¢4Ú>¥˜”$N5îá~h·H=üžR†LÉÏýY˜5ÔfüØ’ù->š4ÖÙló¥æ2|žùÑ>Kš½Œn´øL9žÈ^YjËãzÅ!Z×“ìôµšÙŒš¤B¡çÍŽôçÔ.NS bV)2xG”MKuŠ1¢SãW!¯µh‡lÞÔ#tXÛ2Zç¡¨ÖÖ¤¹‹R¦$Ð‰œèºÇ]íÝeª__Y¡§ÄëOáøÉØ@¼F§ÞT¼Æ÷úx<õS¯þ[ ñ(i¶Çê¸çˆu£à^ð›J`‚	€ÈtwDIŸð˜©~Ràý”ô_=î™> d³PÑâátªlµºž£CïÃˆY6býÿä˜+¼¯÷kdt& :óñ‘Íé©]	‡F^­lá‘Œâ›bê	á›"¯c"<aeB=×öÓ|hæç¼½a‹žrÇ‡_qåx÷[t…	<DÂZòwÂ'Sð”Òú%%Í€¡N‚…ú†ÙN³‡‘P¯üÆ¶ˆ³¶ÉJÜÍŽÎÖº9Ï%ŸcmtâaPmn“Y¨6q‚9À;4­-Æ[ñƒ³a\zÑh¡ñóP6N—Cìä„<X»Y ô¢±Vœ^òq¬!m-gJeJ®Uúê7ú‹&R‰ÙkÔªÒ$8|Ü“HáWyé«“«rýIHüqOCEþÊQ_ÎŸJ%ìÖ)‚<KTÁÚ³F*¨K=
h« ­ßÅ9úñÛT#Å‚!e´L2N$þC~Ðªäø|d~¯ƒ„F>\††ìjÂmêD;ZÏˆÂPiææd”õñšÂýWáqª¸­Ð¡ÊÝ^ÆHx/˜Y÷.“]¯¾Ü«Õô|Œ¯·Z¿þ™MÄ¿!ekÐ*ót~’€†Ó`x±W›‡yËÈ¨¨JÙÉ_j¶(a8Odõ©ªä±Ìå^ünÌC…ç{µk±Nþ¯’ÎtŠšû5äÂ·0!¿NÃ(ožf–ÊÐÑ	©÷.ÛWl´W{Þî°N'4zlÐh·~ìOƒF·1`ÝwÛÃÛbÖnÑÞ×Ìâ—0n¥¶Ï7:Za4ÒîGŸ6÷™eÃs˜o¤Áþoÿ´®2ð0k¯æmÚm¶vØV³³õ¬Óa;ÍÎö´Ñg½æ`›µ›í<žAÃövsmá½n³ÓÏ{Í6Ì•¿´ÕÜi7ÚÍVwªA™B½>>”pê°îdËë±Ã/·áßÞ»vÏë².Ýh¦u¿ËÌ9·Gì²‘öÙj}¶ô9Ù®ˆ­<ŒNBR¤³ù„»â]«é"0½5V…œ¬Gž<æá\‰G\Æ±< 1ê„äfªH˜œS¼ô¼a_{˜ÄJš?žžÎ‡"âÐ£”I~¯Œ¬è¡B~á}ˆYªzÎ](±FénÁh< þ0IuŽUkk¦ïîÚ¿Bc° ­—@ielý·y^=½Ç—òæ’~
3¸?dô±kïÃ¶Z¯aí5>x¨¬^îâ‰±J+gŸ€{Qr»Ï,›uÖ,³5HÅ==;iÊeÁ.æüAƒ"Í€­&‡¤„Þ®ÄŽï±:v0jPBÅ22J¾ÖãËË%šb›ÇÞ~>ctû\½Iy™¾P!v³å‚›Ð^…‹]LQ ÛÕ®ço,…K Ô>IÀÔÛàÉ˜¸—´á¼ôÖjöÖ×±»”ßJ+2®î]ê6Te6	aÁt´*‘IÛ¤IJ÷.Í‘SÚˆÉ~ŸYBj÷#v4—ìÛShÎ«”dÏ¤êïÍ>/o”?§g@²'Ž^™D/É ò&ÅÊ€ÑÄz2²•7/*eò¾ÑmÙ2jæVq8£±O´*7²‚;F[¯l’)+¥0ý ânJf•ràæµ³8û´=‘9góµ[ê®Ñy|`ÊáLzÛhe¦a«8Ë¡ÚQË_Ì–”ÉT"¼“!à`¾ª¼½¦î3š–Lz†ç¹²¤š¶ {t<6kä‰0JCe©Ö•cÝ/ßˆö@?4’3QÑåR±Ï›‹‰œ‹.¬iU#Œ¤¯²4¥tU’Ãr°›•,ÄŠ_'Â¯ -ãò÷VO=_7Fšd‹_KÕv¿k3è¯K’Iú¯@ËÌÉ¯®ÐÒs+ouî`\Æò06 hƒ!¯¦@MB“?ÀšHhh™ÑèÉK&Q¡*ëÆ7mhUHV„£E£ XÆa95­?0,î58Áácö AhkzU£Eæl?t¦ˆß×
äFÆ~b48=÷©01ö—ôˆ’Ÿ1Y—ô¥ë»xJ¢Œh§®‹ä˜€~'ÕQ¶µÊpkêxÃ!Ï—’#ä¯lõ[–vÜ»VKöZzÛ‘ú ’*EI?íœ¯½ë®Ù…PX/½).™PÍ~‡YÒ×þ¤Ûíµûý5ò›	1°X>èm÷û[;kª¥]¡E‚§
€uKÒzGò†n*|eÃíV§Ýbõ+'˜ÓfúhvJ@Z¶íô+ÀºµÕó»ÇX·zÛƒþv¬“Z ý. v™[ü.„µhWÔ¢.¢s¨“okCÙAÄ+ ´hÚ©‚Ó½a{´cÃéía×óG9p–ÉÉ*€YVàSêñ‚˜Z•°¬è”]ÑF­h¢¥²Ô°þínwÛW¿Ýõ9p¥Do€*Š¤%Ìêrïƒù0C³€¦~J@yîŸÂá?E@;¡LŸLˆ2ýÂe×…	ºÝiã55¬D©[tY ßÀÿŽs OÙõª€K`•É5Ž±zÿóÂÇê`TŽ‚à ~·—"©Wb9ÒlörŽIfzLÊQÂ^toŽ%úía{§mÅ}ï¸ÛÊÃ}žÒ°ø‡Þw°úô¨×ê­þ*†<5+GmDÿ¹`§6’ÚÈ±ÂœÌ‘‹ïàMz¶ÓrëxkÔË¸HYä!0Îc$›}ÐÅÃåÅïbÀ‹†å@Ÿ~%øI+m(e@4­´½~Ûku-Kp²³Ýmoå¤”²³Â
pzjEzÉkõL¶Ñ$Ÿ«â˜™„ô›ƒ±eØv{ÃÜ½±ÿ³q’ÝÞ¨»“ÇµËª–†Snuoè5^z9U“UsöÓÛ„MÒ6oW$e]7ûÚPÊ0˜¢e%þÒµ-F;ÛÛ­¼m9k«Äo/H5áŽ÷·*É§¼£2Ò)´,8 °‰„3þ]†úˆn+`xwkÇkÛ0|p<:É;oE>à
`^ ²ØgzúUÈÛS«rl5íæ[|TApËžËÃûØoú#©ïmwŽópZIº\æ’ãXÀ.ŸUBqùR94—­óÔ0²MÂaÊexL×r¡³…ÿ³	®]ü_Î"h¹®‹¼Ü«"J½íèd´m•ø3s~.j_nYx[Ü[îuIjàñ1¦c.\Ñ´]Eèmûíãží¨uûÔ·BÂI³¹gê1ëzrfÌ„<õ.NŒ½År?™Hj™Š«†¿IÞ=‰ú•™ oÑ˜U2Êãä!E8ïê_ÆÒòØ,=èE¬“ƒÁ·õh|ìÕ;ýþ†üÿ//Õ×®Ö7XahsMë_^šƒ¼ZÃvÙçÃÛà¹} ñk„Æ¯×d#QàVò*…PÀ±\:’dÀô€0‹¬µ=wÈ˜'-†kÊjr×áÛ‰.äÛ’ËÃü†O1ëyâÒ‚wðKn—Q/ LÏ"ôçLcbFí›l3Qµô„jˆ¯R"‘˜bkj/6Ú^“tå>ÝÅ·Ž~Gu¶€{ëlÙ^OÒM'¾èÙÃ_5Ró×Ñy^¼¬¸îÆ÷ØpgKû®+_0<|c·³zìôLË»¡“Ël‘»ylõ-·$ëHnŸ–Ó‘Ü>Åk<¶ºˆÛÆ’õwŒÅån‹æü;<½‹Ð%DîE·ûp‹ˆ±“'mê©Øg;Á±ß3Uô”šÏ†£E0jÓ\Ï¨ÆÐŸNk¼Úû^/áK^ö]7¿g¬öz/X•Üõ¤ËC÷|J”ýU]“`“”ò©tJÈ+¦»}I£7W©ÿ‚šEºÙlÊ3çêÊ0)ÚòŒ˜¥îÉ•Û¸'<@2ô?ÛNø|gß—C]„Ü{
H¸ôÍYÃšË±¿¤"½ÂƒµÔ÷BþæÞ$O¼…Îx‹Ÿ¼»®|üHÞ>7OÈåFÞ °jX•Þ“•Š[¦™›ãP)¼OÚu½3ôiz.ØCâ·((u¡93ÉFÂQóÐ›û"^Xs…¢Z»ÙMGO5yµÁ£U¿ù%:4)ÉxF™.3xNHÙf%üýå™h¾hôŸ9s#äøÐ©œÂ•ÿ38ÏçõÔCGØ$>ƒQñar2ç˜CÒÀÄ«Œð¶QÂëK )NØVMY-¤ü¾‘
0{T`¹fÎægFžÔ×3S2¼ÁRÀ<|ç-Í8òÇ.hÝÉW’ÓåÅ6j.Ôä~‘ƒŠ&_}áß$
~Ã¢°¬vÍéY¨yJ„¾Ò|yÙrœdôîƒÍ³-{†@«Æ]›ÈïwZªŸZ!FÌÎÞ)VSIJ“:Õl‚_ßå%µÛ­~Íæª–¦œÉ¸©)ygø³c%ÙLÚBMA#|Ù²`#Ø$á=†<¸çRa{¯twEZÕ	ÿ'ñ |‡,[ù{ÍÛXýÛLF[niÅ²%â²pë,ï^àB¿µ9h•ZB¹Þh)e;ŠrØe‚©H…éf*I³¯Y­×«¹ÿL<ƒL·'¼†ƒy½³%Ü†ñ‡Z@MnJîÃÝþº†ŠßšmlÔPË­VuŒ(³þ…{SÓdØö:Ò€¤–‚êF³ë —·Ü…€Ë`AÉ7ÊâÆ°+6yžºÊk|Õn¹‰‡J%4‡/z¸¬·¸@Ü¨eù+÷òfÛÞÞg®--.¬Aä‡pZ%nƒ¯[ÍvÇŸýÌ×
õ¢ä*Øì³Åy£ƒÿ\_±æ•¬žÊÁõ.°Ê!zjf·°úe—@sHL<öfr/Ì ×l÷mNŠë’°_¦ªŒ«{›7ÂYW@Ã@ø#‚B5f³Ô,‡D†% 
<Æˆ ›çg0oL¯{½ÅùÏ·Â/Ü›ô2˜¥lrNÐÖ¨{ žª„5ÐÍlçàZ»¦³­Éòj¹’]Þ¦¦i&i›cj'uv¦›“^12èO³%b0‘MüPãñpí*÷ôºº2ƒê4â¡ýL"ìÊ‹+QP)Å;ýÀ~`•ú21O64Õâž:«ŒzJ|¤5‰h³·ªÐ'ÛlòÂŸÇêlàr–@ÁºŒ¤NEP*b“?½b,3ÂƒÇ±ôChcúÚõtþ š„#Ïû#WÌ|¸´`öPsÄk¹¾äG'+˜ÝËG%I.ì/¢?Úl,XÆP 1 =!‡ŒÝ»õŒQòÅrôØ`Al{?˜*`Ü*1	‡´ûg/	âï¼é©¿§2ÍBîw®€œ¾ó§{µçÅÓ+s¡m”Ž¢•¬½Nú9úõ ¸_UþL…R=>…å¡¡(T»¯#ØWì1å
E[0ˆ}ëŽ98d¤5ç¨i¡£€F
CÁËq©§y&¡ñà„'„¯Rš16]˜ÍüQ ãš^4²çÂ"
Ø´”¸”ÔÿaÂŠWž’Ù7„ÕË¶}io
<_æÚÝ>¹%ö3voIj²`éŽKU´Œ”0‰AvèÁ¶ÿðè	ûþ){òüÉËoŸ¼Øÿm˜ØnŸU±@A¸—%L­Hyi˜Bmò”‡Jì˜´C­d•ÆæÅÅ´U5¶î&WïÞ`ðíV^Ò§¸]¨:GÝÅ§]©˜Ñ=Mýb MBMìË•±"—šs©ÝV(ÀÑ9qµHâ0áÚÑ 2äœÎ)ÁÂÝ’ÙÄ(æàÐ±§&½ý•ÎAïˆ}öºÝ!ü1Ò4fèÆ¦r]6®ì=œä5)KV5(8µÄV]b²N©Ï…Âê¸‡ªâ"à,Öm¼ntGþøgkùÔpèÚüÜ›YÁuL¦~?öCÍ¦ï³kT3IgurNd@.Y \@1®MÕ™–&UÛ&uªïuÊb‰Ô'2cºU]—~üè(Š*äïŸœ/Á¬<ö×)–€*3 ­–¤…‚‘€\³ŸÀNñ@Í?Ëí‡TÛ‚»™=§Å`Öî€Øóe0Ý%y*Â¨ž¸Ì¡7¤ÿÙròS3olo8½ëR×ºu¬$ë-#§~Ü%¬=Å]Î“mÉìéäð{øÑM×±ÂÊI±Þô…ÌEé]K&wÀÁcX–L1'‚ëã'‡OÃ„vZš ²³ïŸ>=Ø?xøŒ=Üßrt”ý¢Q´Ð<–2]/|áÕ\RÇ“® ‰RÈd×U3on²ÇÂÛ›ýèGË <V2:Æš`¢T54³UjžïDwR-ÛÔÐ%•ÐIŸYMz0Änž·5ùáñ´wX
~Ö—á‚M¼éÉº±ÀÙöºÓ£chÒxÝtè@²ŽØœs¢ëã½Óêºsô­«´ëÏ¥rºù­NæSB›ÌEû[õÐ{Ž.dÉª˜*U~‡½ëjÿ¨Ô¹¼ˆDý0
a„{Ô›byü•1™Qi~Èž&-£/Ü¹ãÝª;Þ§Ý-xÚ­ÆÏîÎ…îÎ…îÎ…îÎ…î—áB'>çDwçDgâÇ#$ˆ×\VìBgHãO‘¤vòàH|z¼œ"Ÿâò6ùbø¤
Õù ï$I¤$uð{<SŠýˆZ¶’–ÒÍmóè´ƒÅª¤ $¦Žâ˜«¥¸š¢ÁžN8þF›/Éf0bíAë¿þ'*×%	¼ëüÖôÒVŸ½Sm|nª;·À•»
O@QJãÒÝÌH^òJtü;æg¡¤'pU?åt=`…wª«,ìÞ'ß'êÉ×Üyò%Cºóäû=ùºèÉ×þÔýø‹òSßS_¡Sß+ß+ß+ŸõT»så»såûˆ®|w^|×YÂ;/>ú¹·ò\ë”z¢CZ7ÿÜžÒ¾›À>œúÑ¯d.9þ›·Úcuø(à!šO“nOIýˆJ:£„ß^]M-HôÞ‰ìŽñ«úlNýùx9¡„z­4œè´¬×^„¸Ññˆ4æ§‹i˜=âÈ˜y‘TPLñÊ­°~MvÈ%#þ†L‰'ßƒ–@M'>¬ÿÚ“s’ºÙ3ù¥ŸàKèNB6ûµf-©³Ë¥,5ßp¯‚™­ëj'£ƒÞ¤áH0\m°ŽÈqªæRåþÖ‡o¢T½±mÚôØÂ»À¯<Á¼£pxŠ\^©#gø]Œê©jL´nÀà=5×åI7@pl—å€E;àÙ<ÄŠð’Yf¬BíøÝ«çÏ`´É'›¤ÿÃ»ßè3û¢é›_Ýûâñ÷û¯~wø„M–³éý_Ý“ÿ …Â|JÖÝ§ÁÂ€SÜsÌìK“(å×;»·É{Â>gþÒch(ÌÞ«.OÁÛÜ>î-› _	<ìr¹ˆw77‘ŒÆÍqŽaùæ˜œmã¸ó€Ç:ï‘‘g÷ÎÂ?Vé›>üÿü?œnß òÍN«õ•hùOüå£Øßøëç ?¥¯l‹fB\Û‹Ï¼2¼S4î^L}8áý%ê{ñ0
KâÀ“Gó&Œq?ÂÀp€µû@b©©ò'²%æÊ<	Æ°3–"“rB]ádñQQ­&ž&uu¬ßçy“±n¿…)—‡Ç£¾ßÖr7ãÕãOwz^÷xyÚçO·zÛ½Áqæé*ª™O·[}µHšöT=©•Ð¿RÿÅÿê Äeàð;F'K9ÑTßrÒ>éŸìÈM3ó¢q0ße-yCTÛUî(qó0hÂ&L[’@#ö£àD¥ÅôŸ?Ñ7ýYäá™ŸŒ)ùJ^é8ÎÂöåearhÎƒò:Ë@žA YøTµ³³=›Q"åN»]™“ÁŽ
­ßdÀ°ËHC›<Ï\Y‹–/X8MÖèÂ(ótkƒþ×l¯o@‹ÜÞÂç½ìó´Oâš"á†ÓÞRf‰.Â¼W<MšM“&|¥:xO0”"Qx®¾fBzÇ°¯F"Ü]Fw¿fèÐéÍ—²g¼Ý ¾nAì`ÌélSˆü…ï-ëE#îÁX»pÀö»ÍÁl¶nù@ÂÜs’¼ËÿhŠ· Øuf3]Yžd¡<ÝÙ§vY&øOø’ig¿…)qÅÙ/Êd$•Ø»ŒCÕ=#=K‰9ƒ~sËÚ Ñ«°e§å4RÕý9è©°Ñ±È•ß†SöAnm“Ókö­]Jë×.æ/KOºÇ3Ù–xÜ7Ž/y‚%Ö:ØeÞ»Ðº;ÊµJ­ý‰-òÆøÙ8ÅÏ‘6e5Îüã·ÁR¢(N¸áp¯íÂ‰¹²-Ã,ÝÖ½Òx›·ÚÛýfçî†œï)ÛÁÝê“Úw›àf› É~v©£-¹5å -9;å£¬«aMtu~IAVW›eêfHÚàz«9èÛNõ¤a:N1¤trQ#q“°ô.ðLÎ>ÀNíO
P¼4²}L<ÊÔ’µ=p£ÂjÊù%¡\mîêC!TÂ—›ˆääÓäÚ¹NÁÌwRw§Ë*!Ý-Š˜oŒçÒ;çåEÝ¤·ËÈ¼’m†Þ’X¸K:Ú¼G«wŸ´œÏÒ[¤ÄŽL†=†ea]ëÌÆÖñ»q²è'ÁÕK©ZE2Û¦þÀû€W KÆùA¾þ§äÖÃßKu0ªB¦Šh¢J§¶§©ªÆòX*Œšó°¡GÙhl–ï(r2ª}˜ªŽÅñÁ‚¹B9ÂœÈ×¤ôÏªÐ×Í½bpŠµ§˜b<öt¥ÏUv~…J!” ½þè£f(g(¿Q†q=PÖ¤êIÇfhZ7gY”zO®ì¼·Éµð÷pƒ‘ô‹FCØÒÐË&
§1{Ä?ÔhPƒÄè¹WÓÆ‘ì‘Ä1(©ÃË—zqÞØB‡ žáÏvéoôT†¿5›(ü6Í¢èÇÚ“Þ¡3´ÑÃ·äÐÎ#C„µShÖØŠ½t»¨6)¬‘/bKé³4+ÓQlª÷–ŸÏ¦ó˜ëëw77ÏÎÎšgÝf7;­VkZÔä& †³ÆVÉþ}\æ~¡…æQx¾WkÁþìôàÿÐ¡<
ßú{µái‘×`fÊ½·ð0ú†š5Ð=P|¯FÃ­©·ÿ)Òæ}ÚË{µNöjÏ»°!&íÁómÖîOÚ³ƒ_³Æ6ëMÚ¯Ëº0¨V«Ûèþ8H~5àçw[ÊOÖ}—>…ßkÎ$÷+.¾ÒnÒ–€âVïs$’oBíþÑE+Ëû™…!2Œ ÇÛJÿ­{áÈ¢ØÑFŸzµº<kÜ^…nùHíf‰Ó‹f³Éê‡áât3ŽòÈh]q)Q&®üY_S‡1óØ:‡ØŸ4dS¢¿9ä¡kžâÈmsâ#ÿxÜ07„W€~ÝCLÂ°ebk áŽ›WFq)7úPóª{À½ãÓå¨uò¥p>œÂ¾Þ«	ôpÆ~}]	ŸÕ&ÆÝ®’[Û’ ¥Pá-ªdº0 Ó5@õPPŠ7¬¹ŒÞIÁô8ˆgA'3å“3–=õC!š{„ö¿˜ý$ø…Ø¢‹¡•‰óå¥bœ½Ò{V‚’áœ¬À{ìätNÄúºiíçÞ	 ÝB8K¨™¾ß¤Ån“wOÂáil¾¦8äw·Áè[ö[ð¦ôLÀ7ûÂ+A”{M­{°t¾) Û36y#,ÖÔ‚nŸC±.×”
ãC?z	Õ+aÇ¡wµ¬N÷f!¾Ð„Jd¹ cÈL*ã¤ñc"‡ö¸>öÏƒ¥ëUÕý1@_}Ió½¨û?ûá‰:í.àÀRõÍíV’¦½'#$Òf¶¤_©[‚2  œIÑG¨Î~DŸ„ûNT}›ÃÁäaßûá`Cò20j-âà?½ ª x“Ô‹›mÙÈ›}Ø¢ñôâÈ_H¯„ÍŸÿ9.ú.{“ìÏ?å¬•¼]+íðýéò$X: ¤À!ûÄ¢¯v,XzÓz«µïµ6¶è¿ø^ïÈ7Ðçøëo#x«g;mµÌßûÓ¬c|ì½ó½¥öXó9X[ÿ&õ}kºRº+e}mØoJµB2_ªá¢T+Ø9¥ÚMzåšõ5‡ÍNÌ'~Øz% ÈÊ£ãEBë}MzÀ«ˆMçÝ§ÿ‰ÕÈÕ)wP.îÕ¯ð*±ð*-fT1l©xs<k»1;‡Í_·nyçWyå˜Vž_E²5^¥Õ¥úJ9ìòyk5Ñk£t›ùøUhÑ,c]”s)acL{-;€2Öw~•²Æñ«„-QôYÞd( JÛjÈRÅ¦ª¾QhY+hìøÊ”0Wòëz‚Å7
öJÖòÄ¯Š›Æm÷ ¹õ]S8‚RVzã»}sûæóÞ,“?¿
,¨ü*2¸ˆÛl%è
-·i%¿]Â-€_¥m¹Fó2]±heÌ‰¢w—u—_n/¿J!jÅ½õI!ku/‡µ.«>¿nk¾]Â÷€_wXû`mÖy_E.ü*rdŸW~˜Rî‡ƒ‚°Î—„˜dY?1”òˆ˜ã“Á¯"Ï~•óÏàWUA´¤¯¿Êxlð+×oƒ_Þüúàãöçà—}{UôíàWyÇŽÈ—?ô¨Ì¿ÞhÉ²xÂ®å)œÆBÌÕo2Œ.	v£¾EŽí$ÆŽspÃà¼“@qø–ó'…gŠrùr‚ÃÒ?¤N´ºh”±‡æi9”±í’fN1¦]>Œ š'Q8«_2Ñ¸Ë3ý`Zû¸©Ú#ÖÙÕzsæ-êõ?ß ñˆ2Ñi‘œíÉŽÁíÉ(åøs}'žC¿žt^ù òýûZ—º¨™ÚÊ–T»"éNÉ!†÷¡èöð„vÏš7=ƒý³–É(æÌ'†*ÁLô3em<a	?‡éIé×³‘Þ—üÉ«8OIsHE(TñYv³†y®TÐòõˆix¦a´¢Öc‘ã_¦úÏ¦”ÃŒý…‡µx‹wÅžRºÔ%‚e­c½ƒ(<ƒOÚ2Ç«sø"ou÷d×0øÒþ8œO/ÖÖí¹¾*Ae¦@1º²éÕ³Yr°PÝ\•º(ó@B=¬"O06ˆ¨?‹bé“Ú4x]%/óV2†R£“¿2¾“µ`2ÚÀ¸çŽOƒ)¹ ó	ršÖR1rÒé‡ŒÀNƒ¡1³¯&ËTÌ¢a›Zi5¥Ñ3¿+5b’TN·Ü³Ñ)ÏBA®Â¥3ëJFŽýLùºAüÚÁ±áÏµ…y€yGM#l§õsâV@,–.Z"_
Ï…‚ý¹¦õäp6Ú•¯¿î4û&çv$ËÛì“)—÷»ÉÕùIãõNçÝäç´ï«7†ÊQe–8Q÷R6_/c5ÆüýIR#÷L»Ÿ—ÜQº}Y“ýg¥×ýf\îðÄƒV·5	aÄ"Óq65éÁˆªuóÌ‚V¦È·-ñ…-Ý¤“I¤2#<eÎ"ÓJÏÏg:Gqs¹HRÆÖ#…	Â{›“Nf Îd?É4W£~w)8œ	ÍªÅø³¯Žaƒ}Ã.Q£à-¿Åü0G¼[%afù¶dí\,SöF)œ3³ 
'ãóK81öjü‘™8œï“”ÈñTã@!.õ/TR“™—ŽÝêzmëNP)æ$4Òp¢Ê«¯"÷¦ÒÒ)«*èp&qÈÀc±µÎc”ÓaïR.PÓÚ8ÞŠù­ŸÈ¨d-0	0øés#Cd†%4ºÏžØ÷¬Y3ŸÃÉ6ƒ-ß¿½å*Ô±mÉD,:1³'‰ƒ}a)éXí¾1YgžLÿöiŽ¹xçb.8vTu&›£ºÔ%w¯¿Çð0Îdõwo£žmm­zÙ÷Bmß›ý©È4,k¹¨}ï·r=–C)G{ö%žrŒËÅìh1Œ„Ô6"™)E5§Žß¦û˜:"ùIrF?ôæ0õú3Ôï“‹GqÉ?âÛàkg­Äü–eBcIÆqÁ36RHø¡ó23ç0‘NÖg\†Ü§Ä+‚½,Ì&.¿ÒËò“nfJâYpâØZîœ¢oÒ®l7iFúLbWV¯I7›RŽ¨‡˜º×.eJE¥U÷6·ûÆ^áOà:uÜŽÌã¨ºróö;o¢  ^zÑ’ÏzJ3M«ÉLÇöDÎGÊj%˜I¹
eDH!'ä  Ö|ÓôDcÌŒÓ³ øÇ’±}=à© gÇ˜,úáè]€å©0w(‰ÔßƒðjÍÉ˜ŠJ û¦ßyš†õkµû «^Ž=LÓ:‡›x1ù'T=c9	bžæ„FdZ…bFúv5™sÌ†pÜðUKs~!]$õÏòFÙ¾"«Àò|_Q8c³pÂ+á]{…Îü mór(ø#ãé™šh82„[oÛÕ´ËŽ¤ó+¯)a#n²aÝÄSïeqâNkžñ~¯•	xàãÄÂ:r°÷6é#–g÷6?]'`vK—‘Å¶µoÍk‰†®·õ  ~KË¢¹­áŽ¡ÏýÈKEL´œÈIc;ZÉ±9¿‘Ý™Éia¦i˜U—`‰_y­'¸xð¸Ñ^wR»¬¸c„Ó”’é°Ûìniüû¿af»	qí•x—’l6s“&ÜÜ¬ÉK•Tç6*‹yîe½3ÀLîîMG	bÈßÛ¦O>éô[F¡´ÜCˆgñ|HU†Ü\³5µ½å¦]‡:“IWF|ÐïþiH±waM¬­’&qjÉI(ŸÂ+ ûnºÄ‡`Á´çh£´´…$Ð¼Aß²¥g1}í%Ü­ˆX áÞ—Òý¾ì¶î7=ûË&}yx¢]Xò;ë:Î´xq>©U„ÖaY¾EJx-ò%Ã©¸+ºJˆ`K•VxÎ@‡§QFatf_¦ìà¶––§”íæá%žðÌ‘ÃøZª‡L/ëþ„±|uj8êyÚ^d7þñ¿ÿwÿíï~ÏhÌì[œYýPiä¿_¢ë™"õùo°Ï}ÌöüÜ	dHVŽO«tw"W‚ýýOÿ{‚ð_°oIQJÏªôH°œ\ðþþå¿`/Ã`Š›úFÁ,I‡õÿ°G§ÑÐå‚ýèOßùKVßç«Œlv÷¯ÿ{2?œ7~….Æ”ªûþö?²g§ç§Ñ-d…÷Ã¡ïñ)ýì±ï/Øs/Â,ÿõïñA•ÉÄ§¨¿§®þ;¢ì[ÀÚ*¾8FÒõÿöa/|¸ý„	 [|Pe0ï0¢jìãhþÿÌ¨`âÃ¡7ògpŽû‹À«4¹·4³ÿ@è-º;z{ÁÁã*ýxoA^¤®þŽíOü(Â.Â8¾º~D+í»p'À¶ÓLÿ÷ÿ›!1c¤{ó¦š>Ÿ'Mr:†ƒ“h{ùŒàû\P*ßýÀßðx4Ú÷c¯š³j&^Dq¹OLE™\Êù#ˆLêºó,…ÑóÅ©í0•J·“`êÛRFÕ-Ë½,àØßü½Qæ”¼´6“nø5¶Ç’ÓÇš¯[?ãxÓ'c«ugÏ²ïˆ¿öØÜ?cOá•—t£¾îêš‰WD¸­?Çˆ[/¾˜ÃI‘;—ô›Ü]Ò›b9Ð­¼.zòy:]"[€2í|ìBš¼y†ÇbìÓ Î¼ ½u€P×?E!¸â?­ævÎ):wß¨ŸXO?—óêU!äðŸ‡ñcoéýðò_'×;6ÞˆÙŠ0L¹”¶ƒZC×bÜ‚ïÎ"L[»Äÿ:—÷–Š~'f\ú•ðVøC×ŽðÖª\™¾¡—\•l4F…²ÎcÙv‘U¼,UÐ“_RÕUU¡y})¡Øè?£É#CDz3«&O5.!]s	ôô­}JÝ.dïÊÞ’Â§~À"/ºk¸n±ü¨5ÍÓT{pâíž$	‡ÊÒþÄÁq0fÕ%8ê¯fCÔC½úuþû9=¦Ã"[áU^üÄˆÞ[êÀÊk†‰LZy¼ó½Z»•×DŠqŽiº_´Jmö^ê/NQåjˆrëV!Ž_Yƒ¯ ­$¢±Ÿ’Ž=ŽW&«†eF†9CÌç0”rÃ&Ò Qª £+€›=Å­Ò_tØwÍÓ¹/ýô«°2NµÙÓ§ŽÍm«­”£l±0’©UˆgÃ\ëÐÍt-\¡}Ê1‰ïO—¸“©Rô55-úÝª–Ô¯nµº–gI¿wÊ–›([,þ’$éÿG ŸJ·ÚúÃk°W©C^«ì‘ˆTÄ[Ie’|?ó¯þJxÁ~ÅÝ>¤§,æŠ+w‹þš4úÿFO=¡ršÛÂJ÷–8Òÿ½[qGÕÅSîÜEÙ®¾Wr¬–ž(Ynƒ¨ØçpMºb«›¸¨).VJ]”yXÈË†$D ƒ­±¿TSPÜÑVNÁ+ÀG»ë&üIT&ùÑ`]†À0™VžU¡2ÉšˆO<Kbéðé¯ë•þHõÍÔ&áÐZ ü£Z„)#í³p–6S>ÊÛèžÎF»éÏžÓE@ôÚÊÃ] äâ®¤kŒÆ7„Ïn]™µ„ôwÉ§Cy÷;Ì„Š{{¾;^y›«cQ‘Š÷Þ=Ã·Ê»ÿÝ<<Ÿ~„¬zŽŸ)~àiC„·ºÅÉ‹‚oÎšµØ(^yþsò*G+ñÊJ	æàÚÔq$yL^*Q$Ã<'„ª7ár/—”äÑmYS÷WýÒ­;SHñ4È¥Ø\H•”
ÇÀ„°nöt½çZ^ß»Iß)Å7}ÍJáº‡Îš£÷+	ïÛHxêÞÈ¿¬­ÝÔ/—8HXo+Op³IÕÅ3ªÙÇ3p"œÇÀQ¾ôyÈwêyXžúvÓÉ:¶ØŽmô>+Ô+a3(ô¹ƒÂÀ,’¹ý¼]Ž5/ãnÖËXQy8ýcHÅ×íi„!rÁÜZª<SFy'S9«©oõÅ•šÚ~Ks‘Ø0¥…Ö]Å ©òäO´…þ/ü÷wžZg™ë’¹Ï	™ÊÈ"»ÝíêHHV¢œº©:=k÷“á‰ñ:œQmCÍðùXê`.ð˜–G3q†‰½Ã¹ÿþoÚÁ:œÞg”Æmƒa:·Î`ƒav Î‹9o@/8ù ã’QS²ÊÎßÿM¾Ó¡ï´äw:ò;-úÎ€f!^*ù.ñ>CA¾ÐîÃzÉLÚ}þ…ž˜IO|"‘bJ}â¯ÿ3Û¢!j8¨Z-T->…~‹`HÍËê÷@§g(¯pü­¾è~ †ßêóáËÞIÏY²÷?üoìè/NÑ ƒƒo'ƒo‹Á·[Z÷15wvÏy¶…›g+âÚß¶È;3ñ*Ã¼Uaß2\ž¶èaB¾ê‹æY‘%ñ0%nÐ|Rªù#"µ/)™¼•zéhò´Ž%«™c§,£ûF>c›\œ¨èQœò|(céa@l(@wÊ‘ nOrú(Ãò¸ÓTàb$ùå`TÃ¡%>F1rw_‰SÍgGó¬
EÛ+ßš`7öä»‹[g¾à‚­v0S±ùòîÑ¦©QãëLŽÈ<¼·ZfPLò-:¥ù4ê*G³8_Ï³)–sávC‹Hèu‰#F§*[ñÞÛj•&˜QŒüwx—²~Ì¼óú t³Á:¥Í…}6i(Ìíl&üNfwI"Uœ\Ùú9 ïRà}cÇito©Æµ¶Ò[Êû{¬½½šµæuèJ,æ×¿ÈÅüzµVV÷ƒ"?3î5`m@[ŽÉqgmÇSa&Pè•µYYæÉf)P°§’Ã@	gëùåC‚Å¸ÖAô‰œAb
uMŒþÜO!1©ëC’Û¾;‡èúèçXL8ˆ T«YM8‰:­»“ÈöôÓ:‰:./õ$DëvŽ"?ŸþY´R>›—ˆlŠ’þ³<”Ì¹ˆÓIUlžQ]«‹Ù“®x2Û¥ûÊ 	R¯²6¥ïØº¹]–m‰*ˆ¶<šxÑB(ÎHÉIÃšËÄãÖÛßÖvÌÛ®­ªnFmngKjú­O|cææ{È?<‹Î’ŠG«n'ÁÜ-ÑCå}QSm1ÚÂö\Ï˜jý/*¨.²Jˆµ²’V[ñ<Iü ëz¡VÈòI;=øÇ?üõ_¡uÍ_
;)å @{©âNmûÏ}îZ2p9ƒ¯ÂÙ"œ£»ì«p<žúU,°kY`óí‡±Åº#üWl¥­Ý?˜§§#Ÿ={ù‚=ò¢a8r»îÒ,‘ý–Ó¤v_TÙ„Å9q
àž\Ä”U¸9J!ŒßŠ«%Ï¸)©¨@tÍkNDõ/íw!¡E'½âšµØþ™}M¿æçTûë Ý}šn ö=¬	?ÞuiÍW¦1/%##z †^º-¹²¦ìd©	Mí¼Ñ£q©wZ8HG'r^Ž´Q“Æâ\“jJj÷ÛŸ>IxxrœŠ~¯ú““·®†,<b6òâ	H‚œÎ¢ëi”RbŸ>3ª X€ó„,È.Èüqu¶w”A>Y9exr.˜™Pë§`9ÁÈŸC¾iWA óìû<kÿÁcN’^gðAxÎ©œÇd~Xr‘%./B‚Cý_ûýˆ€>€ëÓ€¿¡³#¿½ýl½i“7È%(xO1KÄƒÎýlä/½ÀêþéHOyßËå<LÄ‡'Ú-$qãñÎyXOœ¯äùF®TÆÊ—¬ò¾—cb©îjØÏw5Äœ,c>¼`?IâÆ‘3ó–v%@œjj¡:òeç/°Ò³[_Ñ-+£?z¢}ÇÔ•ókÊ*D*¼Â ¦ãâP#Ê¦Ûh÷Œä‘ši¡ïŠ0êÛÜÓÕsy³ß*rº^¾¥Î¼ä•ÃÈøg¢œD~ÄÂ›ýCÆÕ‹¬þ¥õý&•‘éÙ­-0ÇúÕZÌ£òu¼Éd¨%ß¬¹¦`Ë¹ÀxñCáé¶Å‰=iØV·N“Ê‡—\˜«¾†‰¶µÛîíµH…­½Zkç·¿e¿ý-ÿO)‹¡u¤pÚT¡"M~V¼xþ€‘šX‡@–çf‰yu\ÃLòñ£¼´;x-£‹‚Ld³9]Œ`»<‡õþÿñ{#¾o~)`ŒÓf,Š½Ù°c0Œj£ð£L_ê]PÁ+W¹~©(‡©SÝ¢"¸ðe	§~‡Q½öÿá@À£JÌQ’Íù(k;/GÎÓ+æOc³  ya	8u€Mî7Ý_,éz«QœšÞÖ!e¥Òhöþò²^¸3×?ú±µ‚dÅœÅ`ž…C
sÞà6¯Øc?ÆsvT9‹h=¹@ËÌJÙ´ð·˜½”HÎ­·	CM¼´ ‡ƒûðÒr£ç¹Ã5þ¨v¿þ#`¥æa[(æf7ï–Mn#–M+(„Ò;ÀsÜuT-È9¯}kfä<˜ÐÐHÚ–l7`ÙÄ¤N©–«?Ã<”í¼4{4À›3:˜A›WKÄãøÚ·'£|—~¤¼€¢qP~sÜd/ýÅé1¦aOØrâ³ÃI0è6SO&½\‡‘Û8?ú®óc@çÇG’mnu>Äê|øÔ©°ƒ:bun²ƒcòœ%ÕN…=ôdtÊOö»ÝówÏbBõj·H†A¢|]²r¸‹ºv)ó+·•Ž’
q·½ŸÒ/]oSU«j÷Ém2ßU_ðÒÁ¹·`9ƒVÄÄMiµÚi,êC,ÊN¤ñ+™É/''m		p'Fp¨úo~RŠ•N#ß„—:ßýHáU|áùÄ“éÖ×¸TgO±Å/-–—Ö‰§l°:÷*[Jìº*Q¼}t¼b°a®j…Û÷Ÿ?œšL}X!LW¡"f5;“šd£vsÂt¯s»Opp*ƒ?NtÆp£¼?eÌ£ñýÑãÖü%a]„>ÍŸ2ÚñþÑãÝKÃ/
ñ°>v’LE5—3ˆ˜anåÿè±‘2ÜQiÕ¯I/ûKCÌJTñÁÌ;BI™	¾æz}¢ù	“ÒfÙaÈ±ƒ}r‚ùÌnÉþQÂX¤—º¡4…Ÿ|â©(¶LŒ·€ð”%=V'ðøqäŸó°äïZ¢Spj6@Cß¢$¼a,š ²¨²*$†EÝSÔÈÅTf¿wòö{ÞŽÏÛó´ìêtþñÿâÿdxcŒ~¼&ýþödO#ß§‡TÉØeŠWÑñåXÓ**_k¾A×~½ŽÆ¸ä.W<°]›5çIÚŒ0
Þ£SÇ”Õ›ˆ¬¾uéO}<Êq{-’27øI·öóƒæ9jD[W‹óÂÊ4yew
µÒ%¢ùE1Á3µÁØàü&ñÒ_ìÕr¬Õx›Ôo´$<óÉZ¹’jüRÝ¿ì±ÇùÞDè„ª:IMQ/rqj6›ØÖ•žQ^vÙ%;'¬v±K)/,pº 8åú:¡ÇV¾ÛR9Â“Ðk~¹«ûäÐ£Ož¤ü(Ê…°úïVHP.îÊJ	ÊÅAáÅAH8Á%Rƒsúe”J>œÜ$2#}ÅÒA>‡›ìÐQÞ”Š–¸U	O¹)^‹IbÆù¯XvHg^æqñûwEébnžÔl•¢–=–>#Ìn6( CVì kéÍ0OvQj3c×%anŸH6¬|ÁÉ•à¬XúùàK‹©…V¶¶Á¼Þ£Å-HtöY/®+ÝY	Íì5H|;T‚"6hà|ŠPÏù˜3?Ng;Í?(!€ŽÆ•êÔ8<ƒ¬«XâsUG¸#ÖuSõITš
ý´l^eêÓ÷éÌ*½ªhwêiõºÇ£IxÆ”JPEÎnŸŒNå‘¾˜h¿Kqˆ¾­*î/} DÉÐs¼>P6wKäz Ò­¹ž÷µ#×iTeÌÖgæHrã·¦X!Lß¬À§4Mr¿xos¿ÎùUâ€©—BV	¯²ì^y,“œ!rÃí\–	/1‘½,q»OŒ×'Î:á•¿lyü1^Å<2µú8‹üòVo•‹<óV¯ÏŒ×/`ñÝü3^e¿HøÕ‹m'çLM(•i¯X»˜ÍbÆ³H:»2udNX‹D×ŠÌ6^[g–Wÿ%_Õõ”—ž~ïc!Â}<þn‘C/òÁY*ŒÀ+ŠK@–°x§;»[KE¼ìÔ|ùWfÿÎÙ¤|‹¿^2N&™ûª¤Çö”ß©¾=W·9?L€Ö'½’XÈì.>µÝƒì¼*Ë
wC·¼+Ìï}æ»£P…“wÚÜŠ‡|÷½E°ô¦Á{ò#+RåØæ¤±­­4kêÃY"…¼.ë¯×’Q¯m°µ¡"ý¢ÚÈ?cÅA²‚®SÈúÈò
AÒðKHT{ËgàË‹#Õx8·È«õ
5"'a4ãóÍïHMP<å¬žR˜¨æ%'õWÚØÈçÇWðªt¸åZ#³°p¯=óÝkñBU‘ŽôJîö$º9¿Ÿ<Ïº"IˆÐ…{§x‹“{øhYéc“éùñ]ü›÷ùbQÊMWk.öÍßce¶MéÒ¨FÞ‹Z^öŠŸ#ø¿æ
á/Ó…ï\+õBbéôJQ
r]w•–»YfæÁ»Õì—y/ißî–i®4eë”£Tå/£\o—<O—Ä—Åá­Â=RZì*ÏçÄéo’MDÄOêÊ'RŠ<§a#ŸÐaÇÓpø–©Áì‚«°ç~j÷ÊMù‡þ_Dµ
-“ên/
WÄââ¦YbU1É¬°>áÐ0]V0F²
,ûxî-O#—s¸YÓÍæ’°&ÖºÝÔZyžÐÜÏO‡Q›¼A¶W–$W×ˆ¥02sðý†Û­áÈËqýÜ¼ê¼7ÙaÌ‡ÁÂãy:òCö‹íóy990#‡9/GS!WñÖ8Ð*öó£ä­²95²rPÂv¥»8Ÿb”EyÇË"p©TY
–ÄN¹ ”M¬óÜ‹íO½ÈÛ€CùñJ¬ú×Dã•!« â³cüT¼ÍP´›".æ‘u…âÅr¯Ì¼±¿ù›¾¬¬*÷OÅoª	Oñwü ùºõ³û¼Æœ§”ó¶D>ÕˆL{lîŸ±§ðÒKºQÏõå/5Ã9%ÃŸàu‘Æµ´ßmÁêÌ½é#Xß­t úŒüŽC”Lã%Pq¾.ïkÎ€‰cŸBYXå­\Žºþ±ÖÃ”ôŸVs»ØÍ—#U‚Fõô{ù^´%@ˆÿ<Œ{Kï‡—Ïø¢¹ßr‘¦2ìS–ÕdH|øùÝYG4ýEäŠÿu.ï)$~B%ÞMhþÐógóÖã”¤)o(+gßŒÆí›¸#³ëëWÅ=a¶ä^…©ÐNòø¤Öå™B0³8î™ã¾R6¨°ðøŸúC`Z1
˜1Ó{$g°måø`ÞW
žÏ[=ñ£ä«Â‹½Ú<lÈ[5·*_ón_?öÑÜŒs@è²¶7ï£0öTnŠð@OQ´°H3GÍ:~åé9^ú3øDz"¹Ax}çÉ<[_©Ûöl»Gï¼ùjß›¿ò|ä–>“ÄºîÈyÿdÆ‡Q˜L×Åùs¾?s!÷êbŽ#o1¹ BšEÐW>„y@¼$¸«ò•4eq`‚²kË'Ùº@ŽÅtg4ƒQi”8x¬W»{•KªLÈ!m/\ë™[7—õÌIºlK§œ—Ú‰ª¯¾<<áª¹V‚º©ïY8ÝÕw±É:º\ýš‘Ã‹cvõrmZPØ¼§Þ,˜^\;‹ÝJ1Ï ÔË7 ©sØdGË‹iœÁ‘#ÿªCÍ—}±%ÿôíx™?Mú¯.%'I"«$†ä’r'Mr²ziÙà$]Y$«;ü:‰F¸XŽa‚FXœ–„F˜³ú«ÈÑHARýŠ=‚X0†ëy"tˆªCŽµµWÁ:zòÛËpæÍ×6ÝÙ€„ÕîïãšCÆ¿[7š¯ßÛäý•þà·~/éÿ'/šÉÎÅ³ktêE¢Ñ³ÌG|H'ù˜x§ú×Ö§ÞÅ‰Dìq/àoøˆ9­'°, 8Â²<™úcäX]¾v/îó÷þÔò—ÐùT,ü«óv… ç„VåñöDCG>ÌN¡>zê*”Gº‡˜ö?}çc$Ì{O0zƒðRÓ¬N­«Ãì 7¨ÞsÒ§ù¬NÍ®±"Ï¦@·‘·\Ó?òé,ÓÌ_F€mõ´á5¾òýéò$0¿ F/ªÐ³:otÞðdßFXUë­m¯|¬ä¢5»Æg^Eþñépâ/Ùó#ã+ßÂ€ß®«ªãG?ys÷ÇÜg Ô3`)<DaVMocÀR‡ÄZE„HCJ¼žFœ)@» Jâ×›ÉNkÈ;úgQ€~
¶{úÊ5ÖåŸøËGˆþ1õ¶¦
V~NÁÉû!ÍÕ[_c?Î ç%ìz'g~05·èw¾÷î‚4°xNÃö¤·®C1C¢õ¸ä„ukûÞ;Ÿ6+ÍÁ;˜#ÑãÓ)Œh>B°Ò4Ó÷nŒ!ÀØVµ•5w(Ùvêw4%ù¥"[9Ê­„;àŽ“áÝ*
¿¯MNøø¡©¦‚gß'ô­Î‡‚\ŠrOzªÊûfxKkCfœ¨c˜ˆeëÍeø48÷Gõöúz_ò>qý”‚>×Hpm½ïï±NÅ8p×zózg ®÷×<ëýY‡·“å¾ñÑá9¾ÀBj×(å­Èí.~>±áŠñV<¹æ¡ù	—²¼9Æ_72ä“?1õ];MŠãÐÜ™ÆõñÏLcÅñÔÌ©.UmÉñÜìÜ›Æõ	Ÿ›ùIU:Î Î²Çf¹p²U¤UùÎÇþÒ¦1Ûdi¹ø_Ð*§÷}cyŒŽø“_Ò9jL	ÒíjTõ±Þƒq’nß¤ÆõñORsÍá(mo­lÑá,moÝ¥Æõ	Ÿ¥Û¹gi{ë¦g©I5oå05òó9M¿lÆÈ=~‚"ú±§9'|ö'©œUWæWW]=rÐ[Çý|ýK»ç|Î±¿÷ÓyÞ
Ö?•ÝFøNz|=ˆ™çúxŽÇÓª)?òÍv_§8à¸Ÿ‹Ã7+,yùÚy¨\rKâ.[ûáððÉËý‡GOÖ6õvµÀÖ+wîç´®/ÚçÜ¼5øµTcöqÅ%}Pð·ûíŸ)|˜^ÌQø‘>±¸>×T];¯ÇJÒÐ0ÎÀ›_”®œ² ì>‡ÿO&%HßžŒ^W½ˆÂÂçæˆ)ú™FûÏTZÒU/Â~Kå¹J‡Œï&_Iy¾œ"MUj2Ý FË°Iˆƒ‚+ùWœ”õÏNUàÃÈ¿Fy¥LR³ã½1íúææ’SÜ»Xnç_ý-Ëz†wâ.+ô‚Û ŽÝem€E:þ»›OK“!üþMšÈ§IÁZžKÔšöù-ãóèïXr ÿî¿ýÝï÷KÊR¸|Ìr¿^vòÿòÿåÎDÂÓ$ýjŽŠöá¾9í¢3h±’3hÑÄ1|ôC(ŸÚëÎ¶‹&‡nqhšféã3Å?‹_44‹fº4+)A;Þéï«Ù“AuÎ£eX(ÓzÂ&j‡ë©
QæC"ŸX²K×JdÃÐ´½µÒ¦‚¡ÝÊoŸŠf€dÅÃ®ž[£L ¦OÆ%ùÊÉ,&ráEsáæ?þá¯ÿJ$¥PŽùe(3Q8÷:‰(²÷m
$J’â±0¸Î”U9ØmJñqTM0ví@'#Þ§v_dyŽa„èE\”llaa¤K˜Aè‹~Å2/ÉÁc6D6GÔeÐé"éVÝ˜2URÅÜ¬H¦¹²C:îŠIêUäÉï2u1¯‘«~…™êKZÊ,IŽå
YêõÙÞ C}*w€~OñÒM`ãº^pl½‡3¿þqÇ(Eö–Šk}Âw-5–§üéú<£³)™.¯*h¯FháÔ(G %7Éðl†–Ú!nfjÊˆ„4iX‡úEùPJœ‡DŸy°©“M·—˜É’HÝ+\2OAÖNÏ¶ÆT™
ì«­LÇK/Zæ'.¸w0?	e|mO‹¯'Q0ÛháÑŽ¦)g|-·P¼ŽÙ4xë“üBü³—/¤ôˆ"½ŒŸ‡¿“pÂ¿ –³?{É† »Ž®9›1:öÙKôú#8J"ØûÓØI”ØNd9@ÎÇ!Š±)­|“ÑFc5Â‰óŽñ¨õæË`æck€\Ø,Œx-Y4qR‰"
‘P‡	€aêyï€{-p›ÚˆB– Ì00¿ÔÖ£íÞã?!;Y_Â©*©)5>(—(¨ÔD§b›ÏF&ÈÂÅº<O­¸Hm0ÇwH• ´ìk;°à@æVöÄRÃF’hè¯Ø3˜$ªá[F¾ÇêÏƒ¬2<£êól?œžÎæ˜óæ8\74‹6®¹Ñ6ò“ÌF»ôw[Wñ¸†Æ>’‰ó×ÇèEÃ	vÏþÄ¾Â_q2>>.sDÙ1Iíž5¶’üî|ÑØ2FnŒVU,l¶‘ç¤'CµV—WbvŒ)0»Ž…4všb%%Ð 8—<¤ÈÉ[¯BÌ¯¶lNýùx9¹Ê¿í]Ï U6·œñ“Ö‡K’ÃùU"?‡3›MÎ–•ãæ„Šáát*¡P@§ÞŠ°pÕÓdsËêb“ðº6ÝÒŽ[4³Èb©G‹I—hB\¸eX”&0+\‚Ÿ‚åäÏÐë.DÊs$« pVö¢sóuPX››,€¬”O›&œ‡0Â"\ÌÎ 6‚Á€áP²³Q¹ÅD¨2ë‡]S P7–Ì"V“ŸÖÆ~*—¹áúÛ©ß_ývÂô¨ê‰m£¦3Ž8ëy6ß“žF>Ì
Omù½)¯xÇ1– yÔiSŒe$x³Ã©||A7Íäe:V^Æé‘“ŸŠSKÉm˜|ÌÍfÓÖ^æâ¤6ñ^ùÑÌ†{Ötœæ‹eòÜ0#ç´1€£–§åLRd8ÔÕ'çÌ¬R^†Þ(œN‘`Ï8Mâ¼V¹#=õRÈ0Rª*4a¡.Þ)È7ˆ›ÛÈpuXjƒ†É/ÃY#¦Q{6©@”¹\9/´Øƒò2­Tp_ Ïg°\ö•"¿˜¡C>}²™·N0@<æCkVÞØ®uà™ÉR…8ÇŠÂVñ‘àÙ“ìàÁ(nN¼¸7W^Iþ64¢“ÞýâhNêÄŸÍeÌêë¤”Zs+ä@¾ŸK>ÿ|8…i¼e_È/Ù»ˆ|Áç¹©*P²ÌâLK ]’+š€4ì7­r¥Gà0Ù yV%bœHFÞ õ€ÊuåI`œÓ†¹‡T1fÐ2öoQ†]¿r[2]ÿKNz…UÛLí"ñl­¨GÓ/(å"´Éçé`8rj´®¦àjO+C;+á™ž¥òëž,‚©åW#ºÂ¿­;ÎwrL'·†í›«\ã¶2.Øã÷Hn—LDû
Óî†oýŸ‚Ñr²wI
’<;x~mAû¡”¯a(î"ßèWªTêBCûy²ŒNçC€6™0Ô¥4¼çÖŒÚ)hÅÁ5 ò†ÊK´¼ù~ÀÉ¬|µÁðçI‰ßo®œÆµdÑRœ—¼6™žÝ!l»˜3_’>i!¼V“T|º1§¨É”˜§–%{Á9l—ŠŒÖÌuä9M;ÈÅÌÃh’1£è!í5
‡˜M‡yQOíÅ÷¨¥fkùë™_Ô,'¯«í¾2uD¸¸µ‘YÕž7‡ç\çxÌNqö#FŽ\
K4‘ÿ=|uUY¬è“º`éf£Ý0àº6ÏÜËÖ4¡“p*eµz×¢=”Ó:|g‘·°Il¥4f‡ãê”.=#^Ý&{|'&6,¾TV>×^¥â’Û@(W*[:‰h0¨¬º5N×>¬™óé4X<‚ï‹É$¥g¾À?Ê˜<ÚM-)j±ý3	iË$+×õ]
CQUbµs¸Ë;pÅÕå‰8 j/Ã%ž[§‹ˆv'lL3/ckp^É&íAë¿þ']Ä•Î( B’Ä‰îµjdKµŽ¿/ÆCßÇUe0?Hù½îøÒj­*wvŸµËÚ[+‘Y¡Œ0X zsqº¼/Ì¡òn²ƒ’€àÖYCYƒµK…'-te¡KÙb 0Ü”ø	#ÚÓÜ»RLrÅ9Vàtß9{†^£À"O‡¥°FÊæ®ýïdž¤æGG€¯ðêáIj»vUŽ7ÿm¡ìýTÕáØ†€+Aé`^/þ’Àù¯ÿ(pž³i7Bú²~nmæK¦5]oSæRÂã°¬ÁR3b#ÛVè¹0ÀÓ¾gSZòe‘æm‡®Ò9œß#X¼QƒêèÈ3Teœ‡§”Â6;0Ì³ã`“—LUâŽbº1gfU¼îôˆ`M@6Ð_5»çYÓº`HïÙ//—æ7qÙÑ­+ƒ¡O,!:b¿A5Ãr/—,Ía¾µÇ”›˜]å(1Ø*d‡šî·Š5z@BŸõe¸`oz’•OràSÓÀÓtˆ²Û'g*4ääÄ\òÕ1\©ŽüÒ˜ _,àS˜šêÇ˜]_½E…`j…}Ë¥“ÎÂT}•Û¯Ö6X0êL…ÏP‰/þõºo!Jóê5O¼uL1nIÐ¹]fý{þ€m²6–mJØ'ï¶ËÖvû×Ô¤÷ÞÓ	A%(óKý²Üz7¹¯æÔÂ)ÐSP}ÀOê‹ YÐ™”Ú¾¸fRïAÉ-Ñc-H¨J¤¬{ÄËF¡5û™7¿Àõ]Û“çHÎîeD3ðÞê¯Õ¦yfŒéQ8ºHÒù Îà‰f^ô¶è¸1 ã•_YÕÅrË¿§òK…üò’\¿)ãþ•ÊåR6ËPkÁ¨AÂY#kb-¦½Ö°·1Î?É@À¨ÅÞiø´y„çºbÌxßÈÎlyÄ¤ªø.Çþò'9Ðƒa8¯TØÎ+ÿžt
‹ÏµŸ -†‹0âõ ˜4¨Š¸dÞ>œò4Í§øôuÄ¾1žÕOˆX’3 2¦iÅB°ðSÊ¨†KÂ™ÈaÌû;]ÐœáébSôò­°w©{–_!“û½|–Ù9W°s°Bîœ=Åo¸ ¹òœÎIÉVB‰kå—„ÒÎ5ÂéÆ—u!Jyí´¤G!ú‹¹lH-ÝŸâ¨zóå%MƒÌW‹ó7é©%}G¿ù3>¤—Þ(8Ó”»Ø®pÇ'PI*¿¹|E‡´½-ZÜ"&üŸ¤ZÜ;¬ßvÝânÊp‹tìüBãy0'Ûò!Ïù5±DG„‘OdB©|
.‹:«FÕ¾'þ   ÿÿì½ëVI¶ ü¿ž"¬©)¤)!$q±­2fa6ÝÆø Üuêóbµ)AyJRª3%Åâ%æÏüœ5Ï2/4ðÅÞqŒÈL	|m«»Œ”÷Ø±cß÷g„	Qn‰ÂéhøÑëãwŠò)½y…¬~ec£RŠÞ¥ žF^O…ÒÜª+æXM‡›Ï³ñSlIšõÍZ6;–Êéº=”âúá!g8)D9â^…v” F“Þâj ´ ô®{¨JÖ(jýb £IZ›Ê+|×j–Gj·UpŸfIÁU]Ø«J4/Z«í4úÃ ÙU›X°²ê/h¹¤'Ÿ¥AP-¦sžÇ“UF—œ„pà0:e|á=¬]»­ÉØ4¬$WÏãXfm2óAËlð¸×MÝ˜úi³¹öÔðÚ˜)ãF—2<ŒtÌ7U¦­®g„XØ3"›Ä(¨±}qÚdÚ¸€Z]¼i2’iåiŒpêdk=Ýä7ÕH1„¶¸9:sË"Cs¥ºSýzø¿ÿË¸Êè±å
ÃYèŸ²1+Œ:ÌÔy?ì'!à5rÙÊJËW“°Ayô)äÁ%†ÝªÖ~CÉ¬\Žê•¡gØ™ Y%5Z°ÓV¹¥©ì”HÕÖÄmiÖ	ÚîµM‘,ƒqµ¥ãMêŸr›KÈïþð£ú§8©QúsÁÌáäKÀÄ-}Œ@óë¿)Ðø£—êŸ¯h$¢aØðAk¼:Ì šá¿+ªyõ} šÏ5À%5lþM‘Í«‡G6åéïh'CÂÙŠx¡oßl´ÚáX'\A²†à2ù¬N÷²ðšˆ4š OZcI¹™býb¥6Ë2h<Ì‘Æ!²´(vìðÿAZÖ&ýS•¡n™Þ¤Vâ(·üHX2®®®VJ‘®ÏÖLñi	1.Fkå#¾—t¸ÂŠCØ•‘Á¢lè\›ÝÆ†BDMV‡«ï76(Åÿù…²Ãàjåd/¬O™¡®e·‹@I›s/ýVÅT@Hè1r9à„‰fzü«Ž# iÀíCpÿÅèa¸±(¤æ•-ÒH 2
®¨û«í˜¦Î‰:r…‚w^#Ž2S`É×é‰ÂÈœ£<€)ÕÒù9K@°ÖÀ2‹¨ÎÁ±‚O¯P'Õ2JÈ_ ”sˆòJQ&Ô›Y2cÓ)|³¹ö8_rYf9	°{&¬á&	«L!§á`™d¸M&ÛˆqÓ?J ²È6X™0d‘æ	RP(Ž“è’"KÆ8kï¹’à\VéTdè©F?Œ"Ô§Ð(Â°6èây9Ë©ÅP­”‚7u;G:zµú„’¶Iò9õMîØÐc™‚SÂF	]<
IEp.×»LÌakáã
2…tµ²Û#8Þ(N©Á½Àñ}<ñ´öžÛ_8¨²ŒÍ3ÀúsŒOfŽñ³¦ÿÇ	$1øÖ	sfxÜuCJÀøR¥h:hü%«Ì¹ØEàçÀ‹[ƒ !½Ò>71ËµÝ/‚¤ŸÉÍZÌ¤j†‰ ”­ƒß¢´íí?NpßxÜ†\n°I?•;®PÞxrG±èÇp´]9*¥ì-Å¹ëßÜô]‰¹>næ9ú-BÄiÎ(3¨<7Áþ²qæ òåJ6K°D„VóüwvR(„VI ¹(µõ·¡Hø&ž…)nñámŽÞ ”†¡è»öƒ~{H…A@Y¥3F
Â©ŠúçÇá ¢£Ý4Jèd]]KÌ‚•Q¦dÆË (¹†«}Ö˜Q!*É@ ç6ß° ‰Ÿ]úà8#‹ÅñIâ”ž˜Í¦å{ø†@r|@ºGÝ“—Ý7{”9®CÑjY#ÒÈf“5Êqp½*DBÜ“»Œi·|9§ÄMäøÇ– çVÎmobIx,üÓÌÉª¡>'H2QŒ4Œ¦9Eýé'š¦æ…RVÿæü­³`³-l–‹k²×Ê–ô­R±*9°Ü]÷^–%ðTOÄ6Õd3Ë	JEC^ÜDWm˜r(ª)_hNt~ZŠÝ=jQÊX*;J«ö)¥zÊ‘ÄûVUHRˆ&dÝÂuZÜE«ÿE©¯ŠÜÏ¨²œ½›[Í!w›,a sNé;$OÂå3ïW×áå™ytØ´aZÆÜgRìkÚØ!Ñe¡r¤Ûp(C8”1¥)Ö$eÉöiÎ³Ì}	G
l5ù-}_é+´$¶-˜žxMÍkÝ¸j$±YyÎcâ‚;e?š£OÿŒ¢H¶€¯ì^O#Nrî@±"C·,¸<9Öl
¼Wˆ­1KO““VÍkÅÁQ,ªæTfˆÀÅ#ï&³hÔAþ_- ¬_5eìÉNã2	ák`æ|Ê»ÌcH(Åk3Èü#d!ÚÍö&Eí­J­1 ÝôfIIb9yÃ (¼v$‚Fê|HX „\ÊsÒ
‰ºìI+·ûâîwÀÜØ‘ÃîÇ~÷mwŸNïi³]N—+š>>88Ü;Ü}Mv÷öº½Þ{¸t¥#âxÄŒŒþÅè*”Õ^8ˆ}Á\…R¿ÐmÕïs»‹ì~!dWrrA”TÔd’l|å>¹‹ªlŠ6Ë¨kÊ(k¾SUÍ’ŠšÚ&‡˜Ò\Dßz;,ã"ú€¢0Li}(´iJ?…7hDùRÀ,•Ÿà*H/Wb ·¡”î³ ½ãÅí¾%Æ‚úŒr¦»ƒ%czá%®ÞªŒ£5ˆèƒÔEßèçßÌôÞN¤÷u!ýá@êX“oÉ}´œ^hI×Q·ã($¬y×ÑŒ‡SÖô›týêGKÃÌâòÃeô«q-k1j:„z1Ú2Ž£¤´~h—ÑÅF¸‹~2wÑ/í,ºˆ/Îâž8÷pýBN¢_µN9÷›Rî¡¹Þ|YÆ-ôK9…~@RÆCë«’¥Ü@¿”èw %¥Ü?¿:(YÊíó‹9}~`ò°È¤,Í|Ï6~8y~^'Ï…´÷ÒÁ³Œeå¿‰sç÷êÚù;‹Ü:Ë;u–qà{ÁÜòv‹]:?»Cç½uà ˆü,*pŒGýÍkÀ‹}¨»ÿíÔÝËx$~¿þˆïX@ü!B‹Á´ÛpDj¯]ç×FOñ}†?³½Â"®“ŸÝvÖ}@™¶¦rª¥LÈó{sÂ\Âós:`.í~¹Ù^Èý²?]¤ÅZÒñò+w»ü¼N—_Ôå²„}~¡õî‚"€%]-¿wGËt³\Ö³òùU.æUY±_Ø£ò¾þ”KMðkñ¥Ô}Jnû>•K³0*ZÂ›ò;õ¥\Â“òÛô£,c ö½øP.àAyï”ÚŸÆwò«ðœü
ý&Æt÷ñ™ü®=&¿'ÉrBûøJ~/ž’ŸÌOrI/Ér.eT7áh_ÊFÓRHÝòO#_ çê—Õ@¹Êgû.f§-v)³üéj«-E4 ë.–·µ¼ë×¦F™]$ãAÚÉÿ'—È¬·}FïÀlR2`Ý»ª–f˜Uk2ó„Tž¿‰e2èÏoìW‘:î´ëTo®h†>ß2	DÒ# †MgeŸ<.¾:¯A¨
´ˆ(ÆÑ`0ºš–¢ %éû)^Bñ|6Å\|±l¸<ÃoÃs÷Ý?Å°nh}Ç°©¿à•ßN“èòÒ³Â¿WO6Ýÿ7Vh MÈ:ø¬è÷\¼BÓF1e ÿ€à–‚&É	®¹™Ê-h°Li<¢KWy~J	á9f»ýÒ0úÑaŽßÅ9í	™4X‹6‘Nr˜ÜÙw³]fˆGÆ0_”?Aß4Ïß†×(s~3ûþ<õwaúxuþ’~Ì{c£äÑ¶`,8e¥ÛÍ<‘tõ–Ÿñ´qfàƒË¬³U9¤§u¤Õ´˜FÿQÊÝôèíÉ¿6èU4†Äì`°R«Éµ‹ÇÑŒ6Ò!“˜ù¢Ô¼×‹]=÷‹Uøzû Ì­»PŽñc±±£4P„/”ätßÒ¦5!š¦­/ä?•–ÃU&÷üãMÃÙ›©ÎŸº¦àÞœÙÃµsîNNù{­ç Já,¶Î-ÂbÓ½ÚrO†ô–…/Cz¡ÒõÁêoƒËR{´ÅöˆIP£nÝ	’iü)ÞÃ	£ïèJqõT("7§¿ÂD`q”Óÿ&‡Ho¬Ö¦eQºi;à¸G»P¤!ïñ”Þg™F×áh•Ž÷èº*QM‘¦t…R@²`-èM¤äíþ]á0˜ŒnÊCá³î5Þ$½Ž&rz¬µéUÌ‹æÁ€ÀfëÐ‹ÕƒXaŽ¼éXþúÂ«àg W¦8ÝÐv‘<¤4/]X0ÍÅ´KrNÉ7ð‹eüt<AÚ·?O ‹¯èPÁö4{Õòp+(ÒBeƒ#Ð>Û…àÕy:fYŒŸÏÖÆ1¬~C>³ŸÔ~ûéî§Ÿ.æ“>“@Ñ˜…{ñä"‹Qúè(£ê-˜É¤Ê~´¿)x³‚âW0éSÖâ§;ÊÁ[å;ÈO.Íz”ÇDW€q40ÚÐ_Ðöjäö'"´®ŒP{¦¦!,x¢	…´`ö-ÒØM3MãŒ×-õ:¼Žf¾ª:9nYØ«ü*¹æY±$3)Ês«)íh@hM•± JÁÕ`Ã{š¹1w<|tø§›šÕ_³Nè¿mÃTO[^©¥Õha£‚X£ò]ØN—UX l9¸L‹±û”ãÖY8ÍžÔ6ô)±C¬¸vz2ÌåƒÒt˜Òm%Ýì.Ê)‚å?š¦²®8xÅùê–EÛ>;M‚tØÖ„k9çdí¬8aä–U€áè?*ÏÙÉB‹gkÃ¶ÑhVDAwÃ"c-k»IHnâ9IçüËU@Ñ2%/’pL÷Ï£èq8¢LlÔ†Pa!¤>3Ä-¡Ìc‡œ£o'ŠãúÁdÏÈyHèÆÐ+§a,æÔƒJ5CAÜõ2¡È
þ˜KUKÛ²x<N¦˜vˆà8)”RØ ¹ò¨Ý¿Il–ƒ»à£ÌÆJÐoKsKÙØŒõËÞo…d—ÁR3ÄS¶¥OPB{~þYü¦ur‚@˜;•û]­ÝIF»£‘ãv¥¥GìàíQl1«—«v/Â÷(¥è³¦)=ixÕZ•)Ê{£ã¦õ\´vã
1Ðù_÷Ün>Ì<d.`}5È ‹ðsEuÈ»Ùº›Çƒ¯ún–Ò8MP·õ ·so$ŽÂÔ©d°A¨"â‚¥ÓhR¡p$œÓôÃÊ}.wÍ³ÒuÃ3D(·|ºø5¿å³´LÃqä°4ò^ú!°…n«Ú#srôÚ×Ñ¼÷§á„¥Àc/«iž<l?¾ ô@”
ýîJŠ<aÔŸæcH 0éŽ
ÈÖxF‘É”1èò>ÕØs)å÷²AÈkéç¡¯&àÎ7Ê]wBþßÿþŸÿ‡.í,‰!ÿ“ƒª%Õ,ìÐõÃ2Ï‘tÀëê’’Mp ‡áv–Q2ÛbÉm3îG(*Â˜’t. ¨]gÐè¸D+çÌô%hìé °qú€™ÑêõèÅó'½“{m¤ßèWPR%á4Nf,—hòÓ†¹ŒÖ®åðÅ_1§$M:²(A]§9çÞMõ9åAå)A¯Éë— zÝ4×[ÀVzå
o&ðZ|í‹ÄVW=sH”ÒÆÁ×¯Âò~nØ3¯p#¾IXÁCö"¾Þ®4)­ÑÞ ÿw«]úQÒ…FŒG¾HíÍ
éÓZmú÷†ýMèôãJâ?iQ.ŸCß0ñÉlW6<úøgÓ€bGw7ÅÌVÛ•£ÒjOÈ:•fëÉê“4÷6ë×á7ßZíáÆ_ã6ýÝ~ÚÚ}ÜxºÕ&ì_¨M¼jö›d½ÑÜhƒWÿú&-ú„.Í:[2Z_m7¶6ÿå9Eµ/]»žéî6·ŽÍ6Ôpi°¶£Q÷½«9CU÷@¼JJ/Àl—õÝãr9@X¦ÈGp®½C¸Dý7Æ€žJçGàñå(>d;´ûöþ^¦žÇìš§OÙÖ|/øöæ}8Af'YÍvUq]´žÙ&ïÏêÚ°Ô6Žº=àÞ|Å8®~L/NòžÑJ¨á+µYWý>£½ÌÓ°ö­Ï˜ŒõýÙó*pCÔäÐ
 ~VûMµ¥tL(›¥Mòz»Õ‹`”†z•0Iâä(eUºü‡Q¥R¡åe…(}ùô8yÙjÒ"Ì´ÜeªÇ´ÒOa„E…ZM­u^J,âk°rÁ¡Qž¾ÊöúÁ6º U¹=¿ü"·Jèrž“f•ì®,#tîósÔºÏÏ¼ãÃŽI6àZÂŽoÇ„«51_Ú¨=Õœ¥Ànîêä½cÝêEÚ4žé»aEÞ‚‰5È®°6ÿBîQÁdƒ{ô¥ø–C4ÛP]¯jŒ3øD#¸tt b{dvGÑe6#ÛäQî$~b
D ¸È1hMR{¥§r¬-ˆ¦![»ûÉS™ƒPé¥««SæÜm5Še–p2(·Ó0eÏŒ—¦:ÝKBŠUv'†úNq»‚ôfÒ'UÐåê:&mJB«Î’¹Xui1DgÉ”±§8TÃï÷@„¬­‘]ÔgæÓ(ØáÂ‰~ C#V×…32-yTéÌAñÁQà*7fñ; .÷(qÉÍ|Äú˜¯ä¸4¨~dö¦Ã6Ç´¼[JVNÂ:5èêà¼N>ð™§k?#^ºwk¢âÙ­hr^ñîöã>lêUÑ£?ÐŸU«¿º6 ‚‘p:rvuíB‘}êØÓ¬Ï§R9	?F)egÿ6Ô{RJPÑËòAA Zcïø¤k¾Ð!jŒÜ¦Y½7¬œÆfa@7$éŽ°x7ß]]ýÎÃ~´7õçÓ™x¾Ù4Ú
ÜåçˆÒÒ!Û×!OŸ>5ž^\„	E$a2¦4ÔûV´ëd½N6Îd¡;m3 «o^–fúÖ[‹ô­nî7·aö=d`@Š]‚‘FmÒMÔ±?Gƒ§i÷ª¨‹ÛO¯ÚÿÍÂðWÄ§†3å¥ôÈnžófµ
X—¬íL"ºúžò\ö\ë ÓáÉf‚Q˜ÌªÞ„Wäôu—ô¦a?
FÑ_«W~¾{W¡7XJÎÁp8ed?È—n ÃAlÁØM¢˜KØ‘‹8áË.…;ïHFª”
ïÐ75ãÞŠGaéój/9±QÞ#åðMA“^¹I"'d\‰xÙàè(Y5c‚Š
®ÚHÝœú«Ø^w™k˜!u‘ÓwBÏ¬q'c@¤]åÑ}÷Ã‹`>šUÕ]~+žóIì.Ð'÷ã`ê¢ž~¿³‹‹ö‹—l·.3\XG?G@Ýôžï€[\¨Á«Á0V—„€ùtÀ @tª±Îåà mÿ4X$ÜV4¸¢ûÄ×©Xlµ?¥e²0þ¡<\Ý¸-§=„êÃÕ÷OÛ‡ge4†[XmcË¶³‡±õzj‘ÍfFùhiu0Ãyj!¯ëS"2‰{ÒÖÑùü…uPF¤m9âZ†Ê–†§–©JÌ‡¿kùÊßoe›okolYÛVc´mµ­¥õXÀòã™pk73ŠWDTýFçp$gÆpzÔfx™ñð_ŒoXì E”A3`Æ³¸b¶¬J²×u4SïˆOÂM“[c)@(Ï¡(ñÙðfÏvDÚcšn<»å0ž•“4A `fð£[%Q,\]ÿå	‰‚tüØDŒ(N*;ÇR¾*À˜ià­êN/}ŒÌ×vDæÓÎ²ÐäLçô6ukrüêB#”:o;U=/Q«û”üBèÊaØÇÓxöÕk‘HqódŒÕàp=q¹Cº ‹¼#¦‡ºqBÞML½MöÃiw YÔoJ>”ÒAÀF|Œ07To7¸‡'¼£iŠ”¥º€v€Éµê<¤x AŽ'£tÜäŠïl¯`©fŠ‚jkdVkšñ¬´!ÊÒc·À»QWk#ÖËÁ¥ÚÃ¨,³`6O!tã|<qú.;Î»â=ž˜,£B>Â§ ]Ü)2G»é×VÃu·Ë]0n).¸ßµíÖ!Eõeq˜‹´K9ÜkH”ÀØ²]YÅ»#2å«ô=^·ÁÌh¢	%¸hõ$7Z‰áÅvTlß#»xŒªÈ«á6‚ßu_®rÎ°Üƒšt‡0ÈB~ªã‚<år+(*ºfŠP²KbÌ0T¿¦†þûh{Û!ö—Š÷''†¯é´Ž©XXAp˜æ·Ù`Vìñ¦M‚,æ7™èéªÞ‘"¨£g~PËØþêŸü´
^ ñ‡6ráâ¸Ö¤›75³y‡¥÷Û7±K%ÀfÁñ;½'ð\û”ó£X|²ÐMÁR‡Ý¬®{¹e™*ùfÐkÔ¸uXü³Â D9÷ÚwúCÔìcð¤Eÿ‚>$]Î“p KÕÒŽgq´>·x$<}ò¨£ÙÃª%¦.ð[Š[(Krª„+þó²0ÚÈw³ ¹gìÚ.@_D‹Ôr‘kEKKýí<ŒDÙõy)³ës—ûÖ!†‹U‡ý8ËÃ×ž7^<ž5rÌ¥ÔÚ&‹ˆŸebbÆ-s¸ˆûôf,ÅhÚE’­µ›üïK£ÖâùÃ²±ðkÖDw$¥Ôz'«<6á{oîxŠh‘­Jåùêª8Ú’z×Î4Y]}¶ÆªøZ¼Í³:À+ÙPˆsmxcLÙk<1Ö?Ã›í[ ç;ðG^£Û”KrèPQrõCõgþãŽò?Ñ,­} ôœ°´E3¯y¢ÐQB±ZNäºw¤ÎšÜB+wˆ/s3'd—2{¿“;Åõ™Ý'º*>Šçk¸|öXóSc·“ÞÇMÃÞÄ€ˆn˜¥EIˆøÏÀ`&ŽrÒ«B®t/üå	iõ„E¡ÁÙ!Žc€„i‰¸ž¯¢{ïÝ¯
@;E¤ÇÇïžüa¨½=Þ¾;ížÞ½ÓîQôº'ÿ8Ü;|ó²¸îiwïÕ›Ã½Ý×dÿd÷à´T'ÝÝ}²ûfŸ¼ÝížüAÞžï¿Û;=<~S¢rw÷Ýédo×²pÞ?éözG»/5¬îëîÞé	ÎåðMït÷õë]ôh÷ðÍi÷Íî›½½î¾¤­¼{}úî„6µwrü¶·ÐŽ÷¡Èƒ{ÊŸ±K‹‚Ï"÷-®î-üQ²…<õam~‰;¬Ôã21Láö22¼-‘7­ý¯8Z„ëÆ6¶>ñ7|o² ¿–2‚¾´ÕlÓ$sßabðjzä:hA¢S a¥Ê*Ãýå‡E+#¡ß²%ô˜~jSÌvÈ¾5%Dö¶Tâæ%Œ(©ð2¸–üß‘JH–þƒøÝ+¾ËÐ=óüzžgööÙÚp½|4/[z«CsGÕ×¦+uVâÁ'ñÈ<o-cF‹(gLèç½ÛßÂ1§ðäP÷±¤[«iÆv$x¾ˆ¸€Ã=D¿Ü×ŸÓ‰Î*fVº…1ˆŠOW8æú³BþT„Ó¶dÚí"}ññPÉ!7ß\Yw¹ó+BææE8ÄÖürs—g®Wd.Í¦ó…ä¬òw ôUêÜ¹A½š *)J|çÖµ¨*9}Hk©ò²êªy@Ô–¿0ƒ¢œKr¼wú´ÐÛƒ2¯+À±®P~¿¤+ùù˜òCüzc§ç‹ü
‰§÷×Gì-¯b Gø¥™§Â³0Põ.…rr¦™¯×(£Õ°t–ˆË+ äjé1R‚Ïc§2ùÃ¿£…VÌX>8Õ~NÐÀ\RÑaÇ<+RCðXfLçÀ¢`R· hÄj­{£’åÈóÄðu¬}ÉëI‰çC6÷!}Áô(Ð¶¿s^Â«g/âøOxè‰-%“ ÿ¢–I„à'©ÞÄÊéC,£ÿ¬æb3<´Ìíñ“.€- :CzZq·}9<C/Áë	ÂI?P<hÇ£¯q‚rfcWŽpy#WÖýïÍ`(1ü§ç(²[ùX
>AÉQðße
§¢ä(€#^ŒŸøl„{à_¡YÔ–a$ŒK˜ïbÛ²a­eë~0?Šo†¡Ð4£?ø	/?*s3<ÃOg¥ˆkTä(s&îÅF'[ÖÅñØd-iáæ+a¢^6$8Þ¹q†Ã(Ùæ?
ØÐSÊè[KðoGsé¬ÕÊÉ«ÍâÐÞòŽÎ’ÌIÙ›î«æFö MË^&pŽ!KØüL,IF‚Qy~€NŠÝ/ÆœUFºõcHG$=Øxl7“_ùtÜIæAŽ¾f:[Ý$~ãÃÏ(œXBu´yzJ;HœËÁ&ƒ%´p¤²zm_0ÙÍf&¬XËò%É!¹ì-Èóá„ÜÙ§ècÏ^Æ¼óç¿%æ_l7PU?»€Þåx|<pÈ‘Œ ûM°Ÿ¿šr¢h’}£·#F™DGÛ®Bú¶³#$›>Ü¥+¢:©”‡&1î;½ÔÄwæñj„ƒõu0›Ñ³?÷ƒYÀb)½¿ÖpW¾§°|¦/É<~,¶-ÓþôþX2x“pÆw2Ê=Lpõ™¨l:¯wsnìûìÄwXËÎéÓwÕ1…¹¡Š¶ù()‰;MÂ”ö¸B(œã×:SÉ‹pÁFŸbYo|!äbîÈöUÝ‘ƒ³ë»£ÅèÒ—9óœN‘Á»è€ÑÐ—_½„]0e±3tœc`ª]ñË’µr¤QŸ­„\º•çUþ¼ö#°ÔÒ¥0oÔád:çõt¥è—g¯N^ãSžùy¶T'ÖOâéá8¸{I·nO{àqÆ¡B6ô“V kD£™¿Ñúêô±Gxþ²³vô‘´„£‹bè4ëÑûæYïÛ7eÊêeJÿPÒk-²`°'ø@øø³×x2ŠƒÎÀ
ˆÀ†ˆOy7;zÊç##nµ–Fy^rúðÈIf0;c$ðg7ôîäufÄ‹›æ‚òŠ!øÀ??}µÎý?Òv|;ÞýÍïÁ»ŸR@2%è*¹²AÈã2þý.¦T¦ZtøZsê8+*‘W ¼ÞŒèä¤;—Ã£Þ3þ|+ïV–;ß¢;ôÛ%K».eë"	;
×6Ád$Vî>Ü=íÃÉEì“”šv•?Øµ6ï?OE¦y8œ‚¼NhD!_o$Ü³±žØ¦ˆ>`ÔE<v€F‰Æ§B}²•9í®R¶‹t¾ìHO)Ë,4¶Iém™u®…'ËEúnŠ7þÿ6äÅÙosäUaL<è\±Õ”raÈ "‡4kp8[ðô/å‘Ïé•?ÎÝºÊâl©¸]€£6LèåƒT.’O¨èÓ]Y¨Ã S<TôN£eªNÁ±atˆ3€ä–™¿}¡é÷_YKÞ—óÚPq!’Ùd–Ñ®ä=2¯^)¡¥.®”†‰Û…*ÝŒÊ¸‚hÜÅµ`)ß8äQéVZ-úÀå“áT¤â•ÇÒz}ç½òäh|IÒ¤¿­µrG‚Ñl»¢ $„€å†C‡~¡»Gæ….]ß¼êÖ£s<šSªFÐ6I(Ä@Mjp•m xÚ21)¼è¦i¢¥Lòa¯\—)¦ùz¡g{H~µ -öùeN$þâ~Æ[å+ËòtEÎÊ;Rç¬¨/cpvþ c÷mšû«h€M×]É%÷ù’<Ý¨+£Ã"ý—Í	Îskî[X(_¸)ÔKƒÈ[Ú¦óèÑeÏW-ì¡žy®w]L€KÅõ:	/¶oÛÂu9(7;§øÁU%è÷Ã)Å]]û.ô«-375ÊŽÐ\:–õé¼ÜÂt}E¸BÁ]$KˆƒH³Š1)x8B°-¹%m¬³\MÉÏ²3ï (’AšuzQžËÞÓº.=Ñ±”	éZ&¢…–Æ]ñ*c˜þqC17÷ÄCæÚ¯&Ô§£*AÒ¡–qÚà4b	Ó3A	·|2Î·¹+[ù¤ßë€â*h&ÇCÖ´(Cn%÷”ÂU8¤c
“íJØ¸l@úÛ€ì%ó¿Ü¸ž0:EÌ;‰f“	…Bý ÜB´YTwˆF:¤L1ÂÇ_5¶jÊÔjwÅ‡F9½¹RY­,Ù´æ®¿¡ÿXSžû®›³meÝø¹*l¢¹ÓÛÕ™+Åí&þeAò J>7Lþmxlctp¼€Ýe+? òÈ#JP®ø³B$eÅgq1HŽqh÷†IÕÌ üF€÷¼{=k|>$™ÔÉááa1PÒ6Cº X¾LÊV~€d9¬Œa•åe´Œ|6ˆåbáé×“7¤*T>”w“pÒ¹Þ½æ=EÜªï\`µ£x@‹Læã0‰ú®RIø¯y”8£Áäm’sBŠéÚ„žó(¸OÂ÷q2§ ö9añE”Ì†ˆ7î²Øø(˜D£ÀUV±s9¤{@šjd9Tü  B"§UÂyE
Ž¯bJ!ìI˜¦Ÿ ÷âñtÎdoEP°b÷ IÞÂXÌù,¦™0y´ôzÿÚ0«Ó®ÄÈúùA0†ÉJJÀÀž³m>Ùwvœ~W2;Ú˜ÒùØáb')	Q\Á¤[Û•iƒäV*¤n
`DÍÄÊìÕ]¦ Ï\©V.ØŒîôhs5÷É0«wT]Ãd£Â¡[3²€-°b>z!p5{!è±·œõõ"žOŠ‘@¬Y'(IªÆ¿!%¶Nù¬t±pG6òãª46ûÛÆ(Gñ÷†QÆñòEÔýQ²uá\ü E5ò£›ýmc”—ó DÁä{Â)—bNKaUûß
¯^I,ò rNb‘î‰Tôf~ c¯¿.´R‘ˆ‚œ 5d<I‡Ñô3È—vç“YTxÅ	@Ò÷ p©7§Ã'^¿ß&€ŠÈgÂ{Ã0@UÑ±´<8;åªt™È²ÿqŽšÉÞ[²FÄÂ$ø@÷ygA¼ù´Õ^ßØÜzüäi¶¸å}6&6$x·ÑJÉÕ×ÂËàØµ¯
™¢„z—F P¹”Ð
–Æ„îàþÌ‡q0+™.`D©ð@œÃ#“³^zŠ‚Wã`æO*Àz>Ç90çÉ}úªø²	°³xÜè5¼åù`iY¬Ó s:\Ÿ)Å¸Êú6Ÿæw=Ö›:m³þÈ×¬È˜<#MØ3úM4‘m²ùÐ"²Iö¤–—›NquÕ×§/zŽÜDú¥1‹{è7êº»FÞ¡U‡¦;¼#wúgˆï#}’kòßÝq
t9ùwb-\ŠÂÉË!`<ŒÐ’Ú¥Õ1Œ>°Ò²w#Öþ7ºµoÏ0c÷òáµà÷¶¾ ÿzÈ	[F¡9ŸAŠ[ˆÜ*©†B½æå}˜rDÉ÷Ôgf³B‚"Ø‚–I<X¯B‡Aþ7ÀF÷Âk?8ò´=»›†×¸»GÁ(\n‡iß‰Æ: +$à½À½ë”º™™–`m+Ïáß¼”2V¥z{@5ö×_Ñ—mfÉëßÂÉ>$ü…íDGGRRýóÒoWÆR”E0r¦³pº]i6ZÅ¶¡Wl8÷1½â®±eÒ7p”–¶u;â}Yh{Å¡­?þ* mxhþ€6¶gË!I#ºÅ°0\Œ—:½c}ÀZöàÍœrÖ°L”ÅaË=Ú!w¯2ú r”ê)–IÚë¼šŸˆœ‰3nÉù8ª,}'7äŽlÓ7H•¾8:¬Nƒ$Fq0«jhµÞ¬ûíP{ë•€ðR´[ˆ¤©L¾¥?îÈ*ùùVŒã²™®@€*r8és³¿§ü æˆòàZß¯‹ÓfÎgñÑcÉ,Áo»Ù7A‰ãìOõµ4ílíCí…(·þ|]D#‹Xmî¦¬MÖ\^ªÕt„iñÞq>P›~_;o4Ø®ÐiÎÓSX–‹0¡Ìì¡Ë?ÑTÉGfy ¥‹`”I[œ¬¶4@â}:/@–6Éþ§‡ë†äKÆ28I‘ËÝ´––ÂZfÞŽ»‰¡€ál<¢óp¯^™Ì¼ÓœÔiÝ´¯`,ó]áš¥DEžkGà«~˜‰ÚîÄ6e ÚoÚ‹±’Ýz¼£`2F½è|	×q*q’Ú”8¤‚– ÌÞŸÝeëh& “ðŠ–ô‚¨¦:„ìxdÒm‘	<uà2eˆË1åÁÀ !Œ¥·ÊK—S¶¯ë,¬ßÁDµêþnËà«î(ºŒÎ£Q4»C…›ÏXDè¿ÜeÔlb®ðÞÐ[9ñ´)m¹d4ž°!®L6¾h×OEà@G`­œ‹Z¥šòÇÔQq+kÏ³TÝ)qˆ'ˆEW²D<ÁäoHˆúóÑ|¬Ï†ôÜ8
¸ŠàrõðêîXê¾+E2átœ‘	¯óøŽ›[%’Ýx"Ý:Bôn<”,#d£T®û6aä¨•ÖL"‘Z#šôGôì¦U‘¢ÎC¬ñN~!ÉtŒ€…Àa¬8yû¯;nûŸoµI° …*‰E&KŽˆT¨gÂò“v+w9¹Ì1†¹ºf>ÜùcD¹âä7=œ¿ª“ÃŽËO!Ù¢$a¢./õ1n‹0—=R}0ð¤\ßÜgàåã|äƒýZ„Nº ¥"˜TŸ]Xk{T¾¢C/–™K‡ì&IpÓ ÍD•vRs«oµS“«}ª²mÃæRÔ¯‘lZê˜s#'ÀY~&â¿n´YÔwï™œÊ'pòôÄcÆY…®Lñ'l³Uý™ƒjcË_Ä©ÁŒÙ‡nY—óV(“†äø¨µ,Ë½Ñ²’†M‹¸¸p–¯²â"DfrIŠ†.¢Ë9õ 1Ç_ÄÕ_#HW¤!ý»vïèkŽ‡FÕRéT6|ISÆ³lTÖû%JqÑõf
Y4SŠ%øú2¥<RÙÊ'K‘‚E9[Y%J‘K°Þ,Ÿ*…(¥ì9ÿ†í¶³2Ö1ËÕ‹½°,r¾D™¹Í3i„{æRÀ\*Œ"H7$7
û¸\ši? ae~øÃ¨ª2{A2°Û¾5ßÉ¦áØÜÉl Û·â›`¬UNJËÊïÎ$UåÃxê1j)ÝoGÓF§& ÒÅ@%°møR=ù0UþVOEa_Ï0|äSÀ$6F“¯³m´`ž"Š^è;JFB‘i8xAqùÖ†“¤,TÑhâ+Ú÷¤B&ßPŸ»Ì8Ýh2Ùô*Ú~ËçesáG&
ÂKéœ²ÏÿˆÂ+–%Hå ÈkhD§H²ƒÏùSÌÃ-”&M‚+.uIõ¼9Øòb>ú“=ÕKh­ñxã!¥{± |c( ®Jå
béRÞÌÇP2Uùsö´ôD´z?OÐ{ ÎMw2`i!Ê¬ÓOOãËËQxÀ+ðÁ‰!qYÏ»4L´ì;álF©„Tæ*K©gÝq®ªÈð£¥ß±Ö˜žæH3’©•çËÎRû˜ëN«§B¦ÒÍ±DÊ³'¥öhê@n%GÆ"}UÛÆlÏ€H­ä¨®×LÚ$á¥Cà_fXoÃmtf1WÒ„+WR$ÎÄT²ð¦%rr€ÝŽt*ƒŽ"^€ô¬–=Wˆ7ÈêÊÌQf*Ó*í•	Ùì¹™ÊfÊ‚k™–&”WF”"P–\É}TEæ°WÎÆ€/»_s˜HÍÃoNº©GVW"‘Žïô|CQÚ{Õ#Û6PÁ'3AoŒ„QÏI«i¶vŠ)Žð/AÕ®
¿i`Ält9°R&–6n™ÄŠ­nVÒ°£‰ã¬N£AÍ•%ËZHn¥_nï¤‘èjýa˜ì¦it9‘E|»Åê0#ämRÕÁZ™&W*µ='ã*ý¿Ž¯ÂdÞè*T^Ê0LïÅÇÔ-jÁ»udùÒÆvfæÕJKN6Ú˜!ÝºF¯ð®HH%Â_D<p¯«–EMY¿ï|ÕŒ¤ÃøêuR3L$&™Qnë£„ƒñÈ1o-m´	tw2Kn^E“æ.ëÙOõfUT{Ö¬Fö€ú=	ûq28	Á°]6”yãlLµ6+â‹â~lä•öÀ‘Ií¹}êwzLçÏz 5»pÎõý¶º(Ùœ€”LivkÚØMì_tèÿš‡ÉMµ¨ KWçuRa5ÒJ­N®è¾…ÕŠh£BßnoW2g[u"É`ð˜‰ûiõ_ô°ÃI5Sº13“4gh—¿¢Gw:»1l8¨aóÈ¶Qt+ŠhûÉƒmE@0H	[Ç%‘µ¥³=y2ëî©¦7¯Hvñí®Öè³þ°&‰9W˜
=ú"Nª•.ü!!-d!ë@O(Z’d{‡.7­¢2Éi¸QoÃ3»dBŽq–ñÌ  "šÝ +&Ï‹ñ´øà‰â¯ÃKJ&eZaf g©AÆ–Œ´‡"7–ÃÐõÆ8‚·E$©ƒB"wÞä‡ïG1eÐ9_#x­~ý2|òLôèþ)F@é«çôS½½Ó§Mã»I|\Âý4D¾Z¬{ÈøœýÀ‰ÉŒÅF,-Ã‹BjøN%TìýQ7“_R«MŸï‡Á|4ÓÝÂ»´þÁ³Vþˆç´§!™³ÁðÜÔ}6&HX}Ï‚/rƒì&!<¦€À¿\ðUñÿÇp§¢úãW¤Ñ­<eâË¥Iã+P	át@ðN(¡P9Ç™Îq¦ôˆfWDÎLè/q)x{	f/X²Iqô3Ûdœé(åŒ†8/ƒ\j*J_"# —¶Xƒ†8;ƒžM9	GA1“êÊöE¯±Lí(5ßR6Ç¡ dS´ädtÆÛ$Ç´,m¼:	gADIŽE¡I:ÕœdkZkª1eEë*HL“ìÕV9Lmý[“ö\¿Ùhž‹P4†Ø!<btÙ2¼ŽìT4ŒFÇiw@2ÌX#fop"˜¥7ç½Fs’ü–(·û¾U'í:Y¯“3¸Ú“+u»<E.$©Šç)«¹­WÐôHsÌÈ3mÉŒ.´}´‡eî“Ò üÈè¿Aq¥¨°GYUmðLË\z?wåÈg{“—/YœC39vËï6SV(f9u3úáb\añ7Ej6iŒÍ5þÄªÅÖ•F¿RØ°/ûò¼ŸEÙÛYÏ‚JüÜ ((>ŽgØ¢ü¾qì»ô¦Ù¯½+öµìþ³¶F˜¾‡6°ûú5–¿à}.lÉXDLt™í‡Èé1ìÅsxCšbKg']Ê€:˜„èÜ=9¢m®Ž7œûV½]_¯oœÕôCžåUrA‘6LéQŸ…uº_lŽ9ìš¶
¿þjó
²]}©¶·mËz— €¢¦‘Ì_ŽëTt#êIÝË"YžÃ€µ‹l(±º¡2{Ç“ÇçÝE™:å. 9F^WlÓ{ÓÏ¤D-#22–x>Q$¿;ˆ«Î·ÄYÊO®ï{#cúˆ’ž Èà}³ aŒkù‹Ž1or÷˜	ÑHáû²›ÃéÊoƒ½-wI'•Ü'¶°¼-m€ºV³1§Ãª½¢ÂÐ¨.UJÐ;$\A‹Y‘bv{M¹£[ß².^ÜÀœr)ÓK°E¢³XÕ[¢TR¿ùÀDIIw¤–‹ÊsÚ©XœV‡0U	|ÚúuýÇü`ñÛOßˆIâ£sŠ·Š Ì¸DÔf¼Ÿqh2ÄT¸!ÌÆ°n¼ð€œQFß,^H¤K¶´ëFÉ¶Ò2…ÌbÌ¹ÈŒ‹‡'ƒðÚÖ!áÃ|EÒŽ°ªüÉ”B@–Z¥™òHÎY§ÆµÔ¯òbzoTY%­3eÎ‰œ·!Å‡¼	¯g%Gð,CÖÑ DR Ü_m-:Ô_s‡¥oâ™—“ÛÉœnt0Ë«¨Ÿ«œ6l~ÄjÄÅãL(qyƒH‹ãøOHÈ*§7¦¸­'Ðf¾¦O\„FCÐ7g‰,‰A.£ºeŸ†ãù•æ[ÝãJ8”2#4´¥xŽ1¥œÅä…ß	#êõªt:ŠfÕ•Õã–’åÅnÀðÖý¨àJ¡í£3éád¦yß´oÔšëL€vs•oA(®–5ºuôº«aÀIn$¡`¤1%ß’•{AGGÕÀáú^È7àgõ¢{p|ÒÅç¼-hœ ?½+‡Ñ „—ã†jæwÊ€ æÊ!L°f1ðì|HWc!è'ÊÆjÌ^ÃXè—÷È°ØÀÕGÅb¿ãµMk¥¦üB”§µ¯ÞÔt±ƒ"þYn2ÚKtâ/Ã™crk7°õñ…½†Æ±ä1ZëRú¯ò·ù$eÐßæ£ø»;¿œ§3øÖ§³Ýùéãþ,æ_ßÄåãý°/¿ÿ|Òlä <OÄ÷£ é±åiØ“›Ê™	ˆ)ž÷S}íáX«Å9k@‘j5¨“óZöj8u8çøU®Ÿë€?_UxÑŒY-E`_ÐÚøª;Þžó·YnÍ˜%¦çÍž29k€ofÕ„9v­ŠèàèøÍé«¾Ù?ÜëöÞkq¬gY ¢‡ä¢ÄLÀ~ÖMê(†÷YÜWUAž•R°ü€š;4GXƒBü0¼!W!k7.\â<ÓÖí¦úB¾¢¸\!µgÚ‚ÄY–EU¤‘ÉªãwWó [{ ÑvAj‰Ä7/ø-SäuÑ¯Ö(Ù±Šææo™Rò]ë7Ø…·ó9z¥ELv%ÕàªÜùslº:³$ÁWYM¿dA³´§ÉÔÜ¤­ì1r'‡£yÐ8¸f*:^ŽVÉÃ+a`~3£Š)S•‡ü˜‰ƒÿoÒª,¤3%‡[äªòKž©š3Œý˜±Vå·Š~†¡¤m‰Êïc¤ŒÞCé3 ùÛ;gažW@­WIÆ¿¿ÇÉŸ)èlèé•>z¨k©¦}e'L›úµçM¸™|4~hëÓ0m0=ÒOÑC:Eéì´è¥{ŒyËš}—zÇ^AƒÖrsu*,6Ð 1FläÜ™»ˆ%DŠ@ÂÁuÕxQ'™(­º±ÆÅe˜7CZ@]åÒ×´y&{æÐöé³J½¸écNÆø&ñ•#Ä¬ÁPòÛŽ–t…5Š"R(¯`ÄŠÕ¨`¤SFí,B£ Uô ÔÑ™&Vç²¬ T„ÓUß(	K|.‡˜¬š’¤?úýÁ+ÜèX§o;|¿nè-©¯>Ü­7¸§úSzP°÷gÛÙõ·¡Åkjz>Eïôv1ï½e¾æ}zÞ)@ÕI»~pêúÌfBÑÚªÕéêÉ/œ ›Ó9‡å×}©µ/¹þÆ<_`ž{·ÀÂ¸Æ”­#kâªÌnlþ¦ÖO¡">f¹fµº‰ kSi·Ð§%L7 ‡Ý©`ók{`ˆ>˜¡%²Â[‰^ï8Œ@W $á
…¦÷ÙÎ4;Ñ9‹aøpÝ_„àˆéEû¿5®å9Fd*q¸P‹-³àOø˜q7ý—#¯Áfó4î^÷Ã‘CÚf‹–Lõ7	EÝa5MÀô £ƒ×èýl(.iŒSúx2@&L[Tª)^³d?Ûˆ&˜Ž%­í8™€(=#Ú¶”¸†T*cùbK¥,ÍXÕ›L°EkÀh÷òÚPŸã€]´aýÍ.Îxž¢âŒº m?B’äšr)·Äú¨DÖ,S#Ë½p•ÓŠÙOîÌµ­f·7¨Õ,þ([æ¼æ¦Ô’ðBÄìV0Fù¤ò™i\Ú¡ô¾°]“µ¸Ý,%ux}Àžð°ª5	Ö³ìkM‹ýîÈh"åBýx4ORR¯QDËN‹|Œ”gìA~‚üBÞ*€ PÓ†ÇÚýýwz!EýPºÛjF¾UáæP¿Oÿ<ƒ[&úõWÛ,‘Þ=$Ñ·…Î§¿c19¢ ýú>:c±ò²\7mÆSÞ²ºîãJ)~1ãh¶k¶ÂÀ½Ei-oUÁ}Ø£Jí)Õ„¿ 'Þr©ž3k“	Ï1%F®ßóÖ&1­Td«.µ]Em—,O¶3-ê7ë%éáºcBÉÛÓO%YfuqHÉ¶ñµ@‹ÿT#7¬$ÄÈòbTˆQÅ}Ó[bÚ‹BŒ-|X^ì¾hq‹U>¬ôŠ`EÛÜð:×ŽÝP¢1}äúA‘²kXr³ëg‰2k&VŒxLç	 Ÿ!_>cÈÀçÙkfphÆA¸üýw¶T&N–Œr <#¢Áµá¹_å|ø
ç]£ƒkux–áí©6u¦—C’ÎGÃ^¾%’{ös†Ñ•ð«ïúŽÜõŽ	°—§»¬4ÿ¯²E©Içb2‹!‰£ÈÄÙIµ¦®®öâQâg ‚ƒÐ¯d]ï{:³*d0²U!T”Ò…4çÝ‚×ì–p"´1¸Zô¥û¯Ú°~Õzü•¢o­QB1&ƒQ­¡nZ_
ËàhEýçëÞ6æ³h”6àÉ?'á•)W³“ø*åÎßÚe"¬’K¸m°¡ðÉ…äNa$>JÀßŒÐ!QxF‹X
Jç£\Et®GéõêA¼º›Q¨Ë1“nò^8BÞ—ãŠÂ¤77|XJ`$’…H0;ÒåIãt0tµë}~9¡/VFá0–d…EÁ¯	„ÐÒ"AŸ_JÓ/õ“ :žC$˜q¸´60îÓé0ÃÛ•sÂî žì‚cß²[ÁÁgF)=¤°ß7Ó0¾€¥aLëÍâ2ûtÏÿO³V£+Ú‘5Á'Î±øÁt.À—„n¥B° 2²šuøvh—0]ãþí'£sÜÚl×¸§cÙ&hÑU¡G<:O¢ŠnÑ•þÕ»Ý€eEifS/ß!‰Rð[Ï @/Áž(^Ý‰qho'Ñ_îp¤ƒEñªËQá!»èšT ¤*5}Ãdõ¡QN{•ÓÓðšöšÕŒxQ­,Ðb~:¡Þ€õeï`ÙIry®Fém€éª+ÿm¥ÎµÊìÎÕÏù¥£“¨¾JSˆ°“L ¼dSªÃ˜ãÅåôÞ±Çt~éZ‚ÌÐp±ÃD[?ºÝ-øŸô|3¯?'pÔ²â‘Ú¶5}â}è/©MnOÑÎ˜|e6Œ&•:CrÂjÈw:ÐÏ(Æ\¾>@Ûòµ–b‘êy»Ã0NƒÉ	iƒýÈßs
Ñ¸§Ð;Z`~á"T÷BµBw~IOÜ-ü¹#0Fm›;|•x‰^J­¡×iv¸@Óí±,^“I˜`1v·IgœzPìÑI|h<Ònß;‹Ö=ÇFa°(IK£Máøààpïp÷5ÙÝÛÝïî‘—'ôKœt÷ŽOöI¾8>þ{­RÇù–äPÇë¥CZ°
t»ZÍÇ{-µa•üÐˆ£Âñ3J£Ñ #ÆÞ¬ª‰Ôð\W­µ¾5úxQØ
§ÅÀÖM›¹¶úm¶ú­w`Çüðäñëp^çìA+»ìQK[ú¼ªílU¦©‰&Õ'u}+WÉ“ZÉFeO­×rº£·—YzkáþZ-«‰ÍÜ7¬Òë‹w¸i5ÑÎípË*ÝZ¼ÃÇzŽÎ2‡O;}IKœ<ã’:æ ŽŽðö™éW$î©
á4oäÏÛÆÑÕ@¸“9›xRº[ð?ç4Ûn[m»£N¼á²…•7k»+Ð¡h©ŒL£9`é™Êáþ}'’š¥æx8pÎ°¸¿,dz&	Êâ‡›¦	Ÿ¥¦(tØ…“41*ï[Ã¦ë›¶Á™åÀûÑÇ(åßàÎìÏ
j;‹PÛ%j;‹PÛ÷F¨íEjûþÕn"¡Ú¥—@¨vùÕ.½Bµ›ð#Ôv1Bm?Bm{*ƒâ¥Ïf».M°—2x´½0çï¾s¸ð!,3ÁHTà•‡›áBt ÐZñì,ìÙ¶±çÃžëÍú"íh¤ËûÌÁ¢;YC‹I•#ÄkLÇ ;3 kÙ™H+TÄzÕ†WíÉÀñj^­'øjec6\É;ÕëY¼½^o¯gñöú½ñöú"x{ýþxÛn"oÛ¥—ÀÛvùxÛ.½Þ¶›ðãíõb¼½þ x{Ýƒ·­ó³4jXw#ð¬ýŸoýA&Y6?û=f<øƒÿÖ'”yÛ{Nqü®Æ\`J%P:` ‡›P.:ÿðó­Ä›wèhüaxÝFá›…otxd¬Ý½ûÂ¤€æÝÈâÎ’¸s#‹;7ŠOßÆƒœ¾Ïé3¦¾ô>n”#žÖMINÔÚ¿{ÿ¶ØþmvÈ´®ê…Ó 	 U›ØA³…åÖOëðqƒœB¨w.üC' ÁZ;Â·Ç9»¿•œÇâÌz‰ñ`…
›jéM±GJ÷'›üý÷éZÃœFu…¢ìàíé‚­”ëL×^ÊŽ{»…›×fvéí÷¢éÃI4‹‚£íé%¯Ù:zµð¶µ“>D¨¢`ÔòH{uèÈœÔŒØÖ”êú…¸ü‚
‡ìlßLkÅêï¿×ÌK“ß/WW¿ËìÒëÍ»ÿþáÁ†iÈš¥}<%þÄ eTVöœýÛSÿì3¶™¤úöÔ½Ó™ZÍÏ³êœÜoz»þè	Fˆð÷@Ó„jo×½³@-Fûó,†B÷X½¼îØé]0„€ëù@½èªŠi{PŒkqœˆ‚îðß‚ÜÊŠÄ“ÑMMme7·k&&†ŽûîÃ‹_Ñ¿¨Ô¼Ÿnì¯¯;çí\ÞS¸î½kÚÄh{o«Û|±QzçÞö>M»¿?`»Š+¹oÊ|éÇ¾}ù}£ˆ¹xßl+2÷Æ}èBêN¶oweñq‰£#°ÌÕÞÛl"^eq›¿Ë3°c>û1^ˆ)‹Ð‹Ê‰KÄÁK)ZÕÉ¬©{FcŸž0~íI‡¼:|ùªKñíq¯wøâu—ô ‰#©¾zÛ«Y‚Òá4=A×f×m•×Ž›•¥ÖÞÛÓ¬Öñ£­ªàAÝäñÛÞ‚ÜvÁù/‡;™9³§¥îæÓ§¥á³Õl6š¾Å\¤%/«°C>ø‰Æ,>ˆ®ÃAµY£ä#Å­ú³ÿtË-¤pÓú™­,ºó–4¯~íDËð¯z;%ßãÜNñöÓl'0.úv–»
—²R_z7óïGa©¾hóþ»YÃÕ #¹C'Èˆ·Ÿ d2³{éAS·£3jÖŠ7Ÿ¸?1¢‹ÐC_ráÚ‹ÿ¤–ºˆ·“F­â¹×i¸†^Âª;ÝÎÕDqKº™;wXzO½%åó¾CVŽv_wAià.ðPä +
­Ÿ¾êž¬8úy%ˆÈD®¯ÆYŸ”/ÓVV’ë.â´í4:4·ü½|n¾f¿’
yÝÝ=yÓ=ÉRiûO»»ûë}ÓZÜ]ïV¤¹gÓOép,µ°E'ïSZt"Dk~iâ¤<Hzå_âñ43³¥Å !Õuàm¸TõìihJGw³š—btGGé«)(}ÊPŽgY7Cí pÿ½A¶ÍSQ¯'L¬ÕñÑ`
vlî‘áàa*äcÀ;¢ÜÎŒK¢lŸþáD[Ú!ËýY«—”.l0Ï-öD{Ð×<<}ÓdÝÖjîÃŠ@ÔOv^à>“’£¡ë¢ešÊëªU³‡T{4;,ÏPÖ6¶Ê•1”+5”¶s(åÇÒÝì>î¾ðƒ¿C<ž{,J»ì(ò:/}r¼¿Þ£ÀÜCåŽOgÖQ>ËQÈŽF;
øë³…ìP®Œ¡|Æ£`êI ®ÓøÎƒ“U){ òêK‡ö¯ë08x(7Å$W(ëè®Vš…\³ ƒv–ÚÙ)<er>ãæ`Ý<CçÆA—>ËAÏŽF;èøë³ôìP®Œ¡|®ƒ®Iö@Áý²qm¡ÿm«üÞ0ÆÑ¿ fçx¹Ê®Ù¯Å{“Ìƒlp›<Þ„¢a ú»ë›ÍHKTa™í Ë²?mÝÁ Ï¢tõOöè§—ŠÈ`_Ãœ50ÔáÁè$qô¶'óCÁ;Ã‹*È rÎ*ìm¦ÒñÇ0	ÐÐ¨eÂÐæô6`®’tôÃ$upôK =`Súí'7=ˆâÌdìNÙÃ›•±£€ÛT²¦½¹bÃbíõn¯ÇüIïÝÑÑîÉ=ëäøà4 §»§‡ô:ÝË2Èœn	ÓÁF÷ñ“ŠCåãùeŽugÒ
8“j^æV0}É®ôÂ[aUÎÚ†¹
¬Z+ºjm5»µT³‹š-8êÜ¦RsO£I³±¬íäQ÷ôäp¬¿{z|âÊ´ÚÀrvÓÊt³ûº[²a›€²šÞ°›fb´‡iüqÆ2øøt÷5©âyõ¨ã
û0ÑÙ£cç÷yqMÖsKæ<„€	oâDÁçVt)éNÈè)dÇy¯P2âOú¶N.:ÚÕ!ŸÎ:úÝÀ+Oxooƒ4¥Ôd/ÓšÕç_Ú}Š§VŸì±«OÊ‡Ã—!t=Â…TýïÐ’qfæÊ)ÁËõglÀi§Ißec®E2›s)Ù {}å:ä5éZž#Èb­­ãªG u^#»ÐìeXj©äÓñ4uve–G{^ÐHÞ’è/\Í¸–A‚d4Ãï`Ò(AOR}Ú\m5›6|¢˜¢Úk˜òMÑ^„“þ’
j£xÒ\}òÔÄ¹VÐ‡ùÎŠþ²h4{ñdÔ§ËãÍÕÇ™±ôe1{$úkêUÑ(ö¡ëxJK®uáÕ†óŒ£'d=0™OCÞ„03ÕøsGEkJ™šâ…¨Ê£|+KkzªÀ‘¬–²,&•Goã¦/X­,¤=_7´1…ÍlxšÙZ¬™ÇžfJÐ6¦ã>$62”¬áÐïÁjÚÄ	ÖçËpåõ.ŠëÙDÖ›°³Ze˜ÑcØ0Îe*™Ðo€‹.‹x7­4Ï_ø†EÕ´uñ;F~C-ÑÞ»4LvèiæO3Jz­Âé¸®µÅšr­	,³#“²ÞETLãá J§£àæë.}*<îÈ)gEöÑY¢w¦lg†D£7 ñÊ· øœãVÂÑºý^D €&(¹ò6‰èõ:F((3û{4`)ª ±\Œâ8Ñ˜UZ³mŒ‹V8Šm¢eNi×e3â<B Y„k¿”Í·ê²ÓR¾¬vC¢rN_NÅ»yt¸ŸÍ½øCÖJ–c{›€+äøºÉºÔ‰Hr&êBd[÷ÈÌîøü3ž|î"¢½îÅ†]n¦Kwm±al n‘Íý0[!@ðÊ\X“Þdcù0'‹å9r²Uk?Ìµ30§¡wŠUßM§«‹~A®í9¥=`·.pk/"ëE ²þ ²^D<žöNÔ´þ `²žEMöûÄ£O—‚u:òÝVËwè‚ŠuóŒAŒÚt†33HmÿœÅÿÄ7UÑoUVy_yÄ6»Sa_µÝ47”Jˆú"hð\©y•š’§«þr(§Õ¥S¯%I–Œ|wy½Ç>É³t÷+Y^zÄ™åŸhåù£B¯öCðnæB­<‚™®àŽÓ/Ú"Ù1aå€/¼ \WMÕIEy½¥‚`ÂVÀT)<ˆF¡VÏa%ŠQþù?ß*[±»v1ùM‚À6Y„Èyv/. 1tQ6œÃH‡®§ .—»i'—†ÜKvóuÙxÝn‰«\Ã½‹ ê|(ÏÑGÒG~ ±íÊpõ‚ñ^ŒÂküg•î½ûÃqºÊù¯yJi…ñsºú„œ_®¦ âZÝlRÎÔßƒÕöõˆŸHþ‡i7›”Ÿ¸žñú•çR<`NújkKµÞjªæÕ(ó7¾^æ³˜ŒÏW7´žh_/(PCFTèeû¶ýäNïÈ:Ý ½ïš6Ê5:LsÐFÃÃv¦!X
‰»
—ÑÚ~BÛ~þ&QR ]D—”…<[¶v§žñmÒE¡×ÐêÕêx æK;­<G5©hš>=/#Hð5	PºrÏ–ÓNHãÙÚÔ3Kí;*UTÖŠR³ìíÈt7™”V‡ŽüèôuæâœÒìl™‹‡gàÜi¼§-œÑ?êä¢ÉÊßzÇo˜Ø­Š_YôV
ÕýîÁî»×§ÿ<ížýs÷tWÜvpV0]ÐKžÜ“÷aûÙnÔ)æ'IÛPÌ©mXžx:ÀæõÆy;…d7ªe…”D8øáîhôZõ¡Ò›I¿0s—™ƒ5g‡i/€äïU ¼ø
Í’Kº6ŸBjp©È~¥j¯Í`ì®”°YÃr¥‡ÁW8ÚŠgÕ”}æÒêÔ–OxäºÜ¢!	N,‡«ƒ>ÚW#Ë¬Þ]~rZbôÍ³ÆÊ!¸Þ¹Æáï¾l¢[-l‹ÛÎW\Ùn]C~ÏkžY§%t»æ¢*±IÕ]³‘õ¬òÖšÜ×„ðq€''Â6Ô ÌÁ‰4_ú¬¬Îä÷ŸÔ3þ`Ò5 w²Íà*ˆfô1ýùk¹*gÌÛé1pZ¸ãÖAõöÎ|÷*HßM aö†:!­bªm­P0
“¬•Òë£ßÓnÛD4¸H {uÏ*²f&T9oˆ^osÖ#é³.É œádZm†ðH?˜õ‡¤&‰™(B’Ä	¾µx»‚ïHÜGÜ€\)ñã…{Ží§ììŽ%Ù)¤¦ã=}9î,DK‡?…¨ùc«§Ýu‡+¼“/ãäF=Á”¤*ñÉÇ`4ØâÆå˜É@¶T‘˜2ðÌê¼_í{$¼´®5Mðè›åä™óxôèþ0U™ßòÜ*†ÄOíïáÚ6±_¬î €­éÎÐræô‹Ù„f\ÍØÆÖ¹M­˜¶¨ºå þ¦WF‰‡?²7ûj3NÓ%ˆú!12ÿñL«˜bZ”°SWåæÿSµL7”¡aŽ¹!wö{mÏ,£\€¡3#ÙŒŠ'áP;«eâ FD¾xŽ]Ò'Cf‚YËœÕ]8EÒÚ™ž"f«ZýùV´Aï¦(eØ'	Ä°š´mö®Ö ”ÿæ¯ AÃ$¦”\ÈPGãƒ†gÌäïŽTeütTiŽ5Åõ
•õµ„õ¥(](¾^PàŒâ¶î¬%Þ†HnÎpV­§,åù™«†Ø¢m¹èBsi"åi~tdïZÒ*Pî½|l¥švxxØtò¡¼Œ3÷†³¸tUz›6…­jLÂ«S½ƒ(V­«‹Ö ôŽXH“þ•}¸(mX­9µLfâuÉ‹5Ñ/{×út,"ZÐWÄ$ôõé˜Ë ÓYŠAé9„d¯fIƒg/!0&Ï½ƒ>ïsïÛå¾Xú“"é‡€ØØ‡y¦=ÆðŽ°p–\¾­ÕÙ ;j½î~ R*«ÖÑ—ý&-‰I‚É<a5ììXÕÿ0ÁY>ì!x$’¢Q¡ž>#[,Ó§B"`o§¡ÎqÌÁ¢ç)úópv†h"ðAìÅàN¡äÇ-sÜÆÀ($õãÌ•>siÊ¤pÎ²ìòE‚öwE²?,C!$í]ñ1ÓÀ=ÙòåVBVVí­CŒºØMýœ‹1Â[Úã•uºwT„ê›j„‡ñH¼¶ù/YÏdÁà£WSLØ¢4(|¬)ˆEáë2KuÚ1ÇêÏØ''š›Ì¤¦ÂâÖdÊÛí¨n}9iÅDã²ZÏÂß¬¶lÏ¿µÆìf”­ÁcÝÃ.Êéë-æô¿éQŠm’Ö¥ÂR¬VIC|ø%Or[Jjëfí(`):dY¢£¤Hïsá™oÔ9½ß"„ÎºÜ<—…ÎÎŸ3G±ð—Q¢	è% SÆ“Ã%‘ÌgC4‡Ì(›	‰§WÃx2u6ù…W?i<z/#™ ‹sØM9ß[¾ %øz­A:Òž„K­6E°ÉË$žOá¨q
A‡\Âs±bš†“û}bþQšV¯ F¾’9¢†×/Toìj(üÑ înâ¬qFf*zÀ/°
¶‰‡¦ÖŸ%ºn·1’?;òÁ“fs>ä–çYV\ŠÆ¹ól6€eã¡íÛö¦a_~ÛÞ`ÖØÕ&™^¯néÍj›ÙF\§ÌZ"Ç‘m1±%º6-4Äø¶&Ù>†òE3ÿ‹V6¦CÈíˆ%‘;Y½um‹¨L'fÝªb–¨_Vm²åb7¤)	-Y@P ¥§I0I/BPÏµóÕ ·ˆyÊ®­¡¥2‘Ñ¢t?‰§Ó¼&xOõ·I<Žµéª,^;jž„³ cj¸kŠ×9CNôÙmg—„"}~Ù†'<zò¶¯UlBÎ‰ÙÍ•¿>¥­¸ÿîMÃ‹'Á•$¸«ÞH_œFm¤1½jªø-nLÖ˜“ó²<ú§šLéÓôæŽUóiú²#¾üòmïÿ  ÿÿì}ÙvW’à»¿"ÅqÀ6 àbŠÉ¡%ÊV—¶éÒxxt¬$$r"áL@ÍsúÌ7ÌË|ÆüRÉDÄÝ·ÌH¹d›YÝ‘y×¸qc»q#¨=ã3ûÊz°—¨fWÌ:…¸6È®ÆîØûlL†"-­Û£¨¸.¦Éåcv%…Þ‰5¶ÃêÜâø Û po®¼ptr>?Ì>&ù®CT­×œ´Nqà)ÚøÛÄFÆ1´¸Úb ¾f“¸ŸN¯æ—‘ë­uŠä¸ §jÜ¼¿1©;±«‡‚î®†é4±:ÍÓØÛ x?B÷Ä^ßëlUs¾çë-Áù.Óqûª}Úë­O>½³8œëƒiú^Ä“özgË©õ
Ìš¡¡D€@Â²Ž€¶§C€ÌÅ0²Ø¸=Á­u¶º5à@€»Léì²q³?óË›Gk8Xw»y–!ü¯ÆNÍ—ydžv¨5&ÅF;Æ1Ž<Ð¤Ñ45I’>¬ßÓZuÏÞwËinÄ²Ëi _ðÑñBÂ~ X“Í¦OÐ6x½Çã®ä*ÂŸMOvøa‚¿xb	~ÝÑ/ÐCÀ  ¦ù´ªÑÍ*Þòo4nBMúW€OZ¿GÐIiiÀáñx4°ñv«
xb ·ž‰K—žIŒR5ö®r¢óÛÌÂògg¯t¥…&ºöoVœÚgãÉT [3Û›Ÿ®·¢n¯´m´¢Íwþ˜„øøØ+ãÔ~çmdÌ.Åú[!K¨laeÅß„ŒÈãý¥`Ï§fñCýáŠ`¨É-ôëe6}u~žH€ä(…‘Ø•þS|ÁW°?èúÞc?NÒ)Å{ÿö-ˆHßto`cãŒaïFìï¾1¿žóAÁ7JeÈ€
DÍ—ÙdŠdº
"Ý§GôãÂ	€ï¯®Ú0žùoÒî.$ˆì˜—@¢+‡¸d²C[…AŒ 7< êl÷? Dð@Î³¡	]k=[<	mm“Kˆm’<ñvíxê
€|¦)"¶_ÒÇ¶W¼ß©ê‹l …Æ3 Diß_nÀ‘ˆ¤$þ·¦FÌ¢»7/¿ŒÑ$ýD9Š& °d¢d’ï)ÜÀà.»°üu¦ˆo{s‰zþRÙ˜Y¨÷æÍ„Ô%Ç;¶©´…–:okEi+Âx69¨¾f”ö÷ #Ø»ð£ãŒ!13Á…é.ŠÕÝ¸	šx02—Þ±jéßÎ³þ¬ÈšŽéEFt¸†ªé5úïk›â‰‡/CP™$Ë}ðë®RŒÖ1â@‘å0É)v™]%ƒ†·âŒ¦iS©:T	ã®6Ü^êÊí¸Ë<Zó(Ïá—´IH<1uµùûJk^oHËZT…ºÂ[iœZmoZ²\;JZô€Ê²¿'YŠÃl'Ñ*Hø+A¹?ç¾ì"pù¶{¨X1ÔëA§»nƒçÛõß6=°é~Øn9l8pP¾s±;2^éÎ'×Õ
¾n›¿,©Îm#,ÙUÉt¿¥4ç‘ã^Ÿ|69Îk¼²ÛdúG•ÝüR[X^«–ÔêÈhºtVšÀ/¡-&›UIe‹ÊcºóR™ì'…å°¶ ìõÅH]†¼eJZêÞ½t%x¥È…q/]YP¹—®Â°©®TnoXV€pU[¦ª‘¿ãËˆJE”â+¢”ž¬•1qÏè&ª2óTÓT=³”.ô”$	¥5H-*ÖÈ!Õ44ýñÄšrSØ¸´°aé‹o<%ZÞS™À™ÌÃšg·ìH†{Û´Yœ1&¯°¬£ê²ÞÆú_Ð)R8/¯zÏqæÍfS÷)ÙUÜ}7ZC¾ý[´±¾ª³dYÍwdtŽ€ï€@o
ýp»‚@×gÏr
s#j{|×ðƒ9Ÿ¾s+–œý¶§EfV.Ÿ—Ñp3²ÏÐxä»BxK‚ÌsmI<ÛÄôPFUïYÑ‘Éyrw}FÆ¦.v|ížYÏçæcËlÊ?_Û¬Å×8]ùÊÈñ×TlÉ9DúÓkí"ÝßÍ=l|°	[4*`ôç°kØiM»†DÀQzwˆ^Oêï;5Q²T;w'›:s°¹‰mzVŠ¦o0¦GÀ
²¸øÂ^Œ€7æÉˆY¤ÈKy¹…//Š+H˜†ÔY5¯Ç´\Aï×o}îÜèÎëúÏø¸¦%³J°TE—õ;å=büÓï¿aJi,¶­Ï±|G®”¹®ÞuÝ®ZuøœÙ	tè

{Xû¡Év< /I„äß(/mwþ¥£ª]ì
¥e~'‘)Ù;!@ž9R…äuøÅdwztÅÄE•€¨Ê…46”ˆÆÂc`F¥<$^?4¿Oiô(›PU©•ÉŒ±ú+ x»Ý ÞÀjÚSDñÎyž]6ç»+·mR ýæ/­(%¨â2·áo2ƒ1\é¾×¯Ö+¡ôX_ü{Ÿþ[1ªUÿz€XJÛØç¨äøËB+xÓÚ)ZnU¢¯)’˜WÓÌ#Òàµ~¯\OA‹Æ¢¢ÚuV+H0}6î˜"†BGóˆe•ÛÖ[Ë/Èþ)öè×å„©Ýè—ž]^¨4gôS¥£Ÿ"1¥‹Õï°Ë«qlìt•'eß”+¿#·*îâ^`]™Ù¸-Ï3èí‰•Ô3&Q 0þÝ¸šû¯ýãs¨´z{Â–ƒ¯wÆ-éœñ^ËÜf¼—‰ÛèíWúà!Š/+)Û{"e´TíXÜžDú!@SŽÿ›od!Š¶a”Ü’ú”J»µªÍ²´è6U·‹Š©‹÷VžwsO ÑôáÅ+4ÁÍË[Zã(…Æ9 ™zñøãÅSRÖˆm³~ÒlÆý~+b!$àÏèÑu‹Ù”Y‹Ær¹m5œå+zÓðÖDZcutU¸ÊU§XÐr­<Ý²tí$Ý²F C·¨¢) ÉØïñ
ÕÌ£`Z>u±eëa»èçŒkÒo°;iw{%™X|L# üsŸJÀÚŽÊ˜°Õ1YC1ŒAn—†(¥^”­ÏA<kÓ@­B]ëb¿5ºø¬ÈF3Ä4›€ZÁ¯Læh1‚‡í.¨0gR†Ü¶ò)¸í‘`<äÒ±”<¥BµcäšX$Ä¶/Þd—™9€âqz‰<ƒ~úÉJTL¯ÑkÎ?€Tñd–óh•¢ÝØ‡¾ˆ8ZŠ	ËÇÉ±áXïdêR·,)†9“ú1R*ÊÎ…VÕ>î¹ö¡KcZy&ÛÃ¼7,•%¡Ñ›¤pˆ’nTå ¸´ï±‰>¡@÷%p[Ý¾M0eÚ‡¯×Ù,d—röÅc8…™ácÜê…Isx³h”ÅÊq:¦Kže—¿Ù1Â'CÐWñ$-Š:bN£’ˆf‘œÅ%Åt Bäñ]GlXí¾†)È‘’ÌFS–Fc"rE˜’¥/Š°ÕÓÖdŠO2>1k6ðžZ ‚X6íðŸ”í“tLŠ›‹øxM·§EÕÐ©PtÍ´-Öj9VeÊËB­ªkjFZ±mÊ¯Ø6ìÒqª+Ü–H}•„~)ñÍQÂ_fÑ¡@ ‘°ê1­Ÿð¨ó–xm›Ÿíü.•‰PFPŸXŽ$cÓ²,¹‰¾|°»@mDM+p*úsÉ
ê*ÂJ2,0e–sr³”‡ø‘xSð9hðŠ¨·›.ë Ž³n°	+þ½v6ÂÜdtQÍLŠ!lømý¢G'¨Æ?ê èþú³<w.Ë§Þ5}—ø.ê{ò…Ò™†$†v&‡YÙ÷'Õ²³ñ¾«·¾5‚-ƒÉ„ ƒš–Û†ÈXŒ‡Z|mþ"Ò‡5’ž)uöªPè¢•¿aL¾üð¶)èðï™©ÅM/¦ªû¬Qþƒ/¯u¡Þjo¨æÎ2q²ÀadŽ¤=ÓÖÊ­-Zþ4o1Çvºg„dUÎ–#"œ°41ðÕ¾Äª:Å2ÜÇ›tÒÝ°ç¦ú"f£‹sô–/;%§O“œQÏõ`XÃæj™O™qÛ¦MnÌ×*Ouò¬ð†Í„J!)¼¼‹Qv`-À…iÍKAÇì2[Þ¯Õëžñ¹ì9Æ¦ƒÿÆúÐ3û
8Æ«òÒ ºfÞøW³ØRrOZ<†]òWi•„¿”™÷ƒ÷²ù¯4‰.®o· ã6{ÓÃ7½ñ@½ÙÀ79½ilN‡šJ$;BâÕ”‰8Î¬–]¦Y”›Níû™â¹ñšTÃUøöx˜|ÌA›Â3Æ5»=ÓX*™L¯ì’²Ù]ëEl>_ÓÏ]éfÙt7ßþ{ª¹ÔÑ•L&Ÿ@2ÙPL«ç0­oQ(«ÝE£«f¨}›$ÆOæ+ï½÷1ÃYöiÅ_ˆ>^Û›·“ÿ3É³ï…Skàà·dh–ÉÆ,°¥•ÞÒß®QÔáó)…;qG¹«Žnøì¬¼cúãŸR%gYçi‹Ÿóù|$6éœOžÛ)Úoq™+ÀDÀFß¹éëˆn¾˜U¡¸6S'ÓZÄ°°¯c~p(¸~mÌ“8ˆø
úé70Ê£5ÚP52»,½XX½éUª7g³éØˆ5&Ø'£´ÿ¶	í’"™³«CÂÒéõ‹lXôõð>Tñ6èøÈCè´Ý·L[_(ÎSòyº’LmºeÌÆY¨£A:ÌcÓC»YnUk%€ou2*1›Ò›3×‚<ÌÃ «‡2’ /¥WS¿BÀU»oð*CçB€ÆÄÊÇ“<‰,]vÌu“ƒÏ,@B)šO²£O}Ð­þL8ŽšË`ÎXÀ¼<¢ãIèÑxš_ÿ­ƒä›ŠkšŒ8÷…"ø	t^e´1Óx\Ï5Šü×<àf¬{-9GChªÅ¿Ü¼†ÖÓò+èKùØ¨Àifxµ‡uíbÂÈ­ÂN°`¸v.Êÿõ8Íû˜Î“­Æ¶›©[£ Ž½™Ë.>kÔTŽ‹}¦$i&ŒHB¾Â+Ä³ÌÓñ@žÐ ;Cø˜)ès°ià=n¼¢cwï8<RÅ<Ÿd£Dô®¡º{?H‹Ÿ“8?bx¼Àùžvfënjâ‡
Í{½¾yæw½!âñ:Ä®æ5Ñbç÷ÐÂnDÉS½úŸ*$SˆÁÆz~ëãˆ]¯9d9ë³t<ú	H¬<µC=Ô#ÿ4³vVÛÇÑˆ”Ó‘(¸ÙklD×æn7‡×¶6ôÝÍ)DÈ¼(è±ZéPªÙw7†v* Gad×jÅé‘ IìwOðöcõ:õ™£©~ò­kæÍ
½®ë%:w{=:Æ£HEümr##6"±Á¸¢§µòöÕào˜«†H‘Ü‡Œø­Cæ	feNG—üÉ¶`':½vÁ%¨ïtÍ‰Ôl<¨Óð…»uÉO	š•—Ù8 V(ä&¬w†îÉ23“šA§¢Ï‡©€‡Öè2Æ"ÅwW©çñax__2I—ÿ¾“îtÝ5Ñs½Ö(Çì;µèÒ +–÷üûCý“t,v‡µ›œÝETÂI;WÐ¡ä@o@¹F^XÁAsmQné5-Q¶Q{Ùƒf(ž™OÛÖìØßØöÑù+ŽŠûw%dp23v×æôy8>ê~£˜Ïòõ/Úœžíé‡éÁ­÷{Øž\D¯·vºœî9Çæ“—}Ú<¼û.$ÇXÞÉ¥’ÌþäEœŽ#:G;E-ÎµØ'!Ýsh®{ÂÛ79\…g§Òí¥§é6Â¬Î]e]
ú¡ž_ž%ðûRiaes÷bžÈ4›´	1Ý/zJ]'S¹aó‡"Rr–e°ÜˆÀÔ±\ˆì³ÄMØ°fŒÂFÜ®˜yúkt’MÒ~A÷
0sSô<¹H@ÒÃ@;B+ùÛU¹­Ô ‘‡Å}J,ù®”Ôïæ¯&É¸DC•DÄ§Ÿz||Î€CÈá5•û–”å×»¸éèÁ¢Ð«%T‚lyi»wä@Ò6ØYÇí
ÚÍ'FÃýr<½1!û¨E¸¡tk¨žº"áW<©ãÜÜõÔ&ÝÊ½,XÙo>(œw«7n[8×8Ò—Â9ÚY_èlHÁ{aÍîÎÏÌÄTxTŽ`A7Â8Î±yÀ”]}VäëÕ‘V¢ŠF€‹<ÐpêLør°«~n:Å¢âžœåøYœÅ1ã…iÕ¦±ÑC4êÛ€9]“ÛÉçÃæ9Ž¼bF~ao>ÍÇ/ÕCzñ1ó47®«+ýàæ/«>â¸Yínƒí£wB¯F&;¿‡Zí¬
ì¹“Ü
zS53,ø› EiÂïD‘)kÒÕéO…›™…Ñ¶iû’0¶ã÷V-»ÇËºpŽ½óÙ£^ “—5UU²›–ê¼}KÁw¥m¹¤ Vç½ ºÞ…¸9íÏyØ" pø^EôšŠŒ†½›¯’ê³ûýšHo¤FO9SƒÚ¸Q¶]Š3™þ!(Î‚Q¿Ýæˆ þ¯¦<¾ÐÚ_åy}²åAXßS/ŒêøoÞhÎ¡v¿É¥6Óø¡6K™…ÂàºY$ÆníË!0¾À¸_9^ŠÀ¨ÐÈ¿o*ƒ7IªâHÒ°©â“²õÅÃàjx½E5¼à/A¬@8Ô@‰¿ÏðJM>ºÖèUpµJ×’!Ax)Jq!ˆ	ò•ÒWZ[6ZøÂß¢–ÓO#åUj?·„l3é”Ìøob—ÑYýl4Š'x]ká U8LzªûÔB÷Ã$ö¥êe·Ïÿ	ü¶ÚÚ¼\F{þ müi±v~Lð,4ú¯Qáñ¨‘8·´*D–×¯ºæ…ØÚL!Yšñ¸d”ÿ„VåcÛµ¬*»1sWÉQhÌ$¾:†­»7ïÝì?Oâ‘pøÖ¦C¯eÎQØ{Ë¹tháÅbÚ¥·2ÈˆÍf'p	è6¶)$-H ÜV…þÝf; %H¡øJî‰äû@ù&ü?;Œj
A0ÒG:M²ñŒgdçÞõg¹y«Y–„ßuÙ4­pŒNHsz´â%s3ˆ©ùÚ<*Ä@(ëGhåÇ<wÀ{Y&â·è²Òóusó‚KY°jºý©„õ†îÄø^¥%’Š¬¼Cz¨¢ò×¾ÜD)z¢z‘ƒì½Î–¢ª\vVþº’ë®Dg'­tªZ®©†#b{8¥ ›f&ý²T(®QéLñT% î=i2wœÈƒáÍËæ#¯þÓJ—Î,
v-³©ånÐ[ I°xôðû+” ¯D•yNíH°°4kÌ/"z’ý<¥kÐ%v	|*"ðW„ÕÄÅ°þ-P#ð¾"ºæël”Z¡xP
ÝªÓñj7¾6Y§âï[æ=õß¼V†‚ì‹˜ÿ[¥™‡Åãµ“²§Ä–Š2YÂEmQ(tíŽâŠ“á	Æ‹¯)}ic}¼èÀ—’Ìzw2ro@æ•ý·Á9ä¡×'¿•<´H^·±;;¬-M¦årQýlE5%#[7½—Ž@_?¹—Ž‚OéÈÌÔû›KH"[õ½„t/!±ç^Bº—¾	) ×—‡–ƒÂn‹
AK»/ÔŠßZ²¬Ð÷Pt|/ …ŸžÓ÷7ŽïÅŸ{ñÇzlJÄ@e'&¥4Ò]K¶hEkŸ"íÂüÁÈìJä­?‡8f‚é0Äs¹ vX† ê+ûòd´|UëÌ¼0M¦ÀÞÉ[MÄAÊVy#ön–¯óf~p“8îüFr›¾<:Ì—‘›¿ÔÉ,"Hw]}"ìÝCx¹mD<y¸å¢Ó]JÓ*‘D•ÁÑTŒöÏ~øñÄì×¯ŽŸ}ÿü(:~üêÍQôæÕ[¯´½Ô"§Äßd/3›â‚®M®kS}¨/-,úi=}eÿÇôbˆ÷ë¬`!©H‘(£)ß{~ÀBùÂ†ä€S+¬…<¥žw ŒØ™VÅ$ìÜZ!E×‘ ëdÏç–´¹”]ËÍ€ù¨€zŠ—þëz&¬¬”ÈÕ‹íÊÆ”ÞÉ½v…|mÜû–®W_VôÏ"øV‹¤Uq@‘NE‹&ßÞ¼äÏgº(!!¯.‡W(È¼jßàêœ¾[U×v£1Å’oEg»˜Ýˆ%_‹¾‰DÒ‰³Uv3€r°Ñ†óGO÷ƒÚêmeŒ?þÛö>Óü,h2½gAŸ•UžêúÙPÃàÛ²"ëížÝ³£?;*Ù?÷,éŽXÒq5KZ€ÿzNTÿ<¥Nâ{Öfå1E½CŠE8Üoq aq¹Šc;?«>ë+åp‹•,Ëáêó¸{.÷ù¸\éÄ|¬ªºuÌžÀYhÝCfÉÖ-ÝâDxåEü)b7˜Iªâ´ŠïFëõ[œ—‘»ÌØñá¨¶yÂQ÷@ãÖ4û®x.âû©³ÿÆþ2:¶HÌ3Þë¿Š¤··ë€ÏB_‰ºn–Q×rÚ@à…þêW5¾¥öõHZ…€JEí3ôd]*þœ=Ùßß“ïk“Ø)ühz–®kÞã…ýš’öµøÃÚ~Æ[v×=	Æ ³¢èÍÆ‹x„ZG10Òþ#q6<DÃ¬û4¹4k³PStzë‹’¯ ¹HøÊ©°ÑöOã˜çƒ×Ú§ZÐ<¯»í€”vŠ|b„L)	€Ž?Õß*:ˆþúX„\ŽŽ¤c¶X#ŠvÁ_šA_wê}=kwM§˜ù©1™yDé!Êu‹§Ånt9á+GÑtá3oˆ*d?ïF^Äy¡Eº^ÛnZ¦µe‹…Í~È¶ÿ‘ŒguÇäÀûÖù;Õ<TT?‰3z­}f¿iRZìU×Š£ÂrQ‰å¦æ†[ì&ö¤½¥EìY6<žÛDdè9²Ín«/ßÛÌü=qÚ¯90ä7–Ï—õ$™÷7ûü.I0SÝˆ{A™“~^®ì›KuŒ9rÐ¤ð…¶«•}]D»sÁ/ÀKÄpð²OŽ )zÃüƒUt4Î³¨Xvðo³=]t±OÚs Ú|€ýtãí( þ«At8øû¬©ùp§´º˜*¢Å[€ŠE¯¿+X}ŸŒûC`Q\;ëí‡KBKÏ…¢ºo7xi=ÿ®@ö8‘s#À¾Ýj»,À(‚¹	-zå‚ª/{ü]êIò1e5­¹€Ú\P2›Ï×Õ@öù»Õl“Ôz{{Y8Q®{LôÊ…RÂ»[F•@[*A½ ˜uÁìKúQúèå[ÜT¤únÕã¥ ¾v¦ÙÓôS2höV ~­€“FÄI®[ˆVZÐNx¦0Ê/Qb=YÓ!Kòö:O
 ÓšB4ïû2ŒÙv1g;á”£t\$S
à¸µ^’ÞRøüÛ¹-£G—Ž¶ƒ[ JYÄ¯½ù\\Ù=ÑIPÆs×Åºn±äS:­jJÏˆwVd£hb‚ºR°¶	¿ãþ‡AžM¾ç(²ZmÕÍÜŠÁ†-Evív ÍªÊüÕy¸ÕŠuÁ&«v©ž§šÆzÝÕS¶´`§¨)K/‘m
Ø}ðp¨*jM­äðE÷¯7&P¡] I¿ÛÃ8ß=#²wõŽ MÏ“ýÎ»%;"}˜™’Rd¶e[UqvË/ñ6xÚ;™ÖÕÇžÕ½»!É³íäwnÒÖ(DiôiyRá±<l˜’ò³1žäi<¾°¾º– ÅµËxRu	^°ˆÎ
KèãeÕsmXÉüh-TŽbùÚ›ÜË.² ¸"4oœÍö³ñ°ÚƒèýaNù2£bÆÿ¸ŠÇÓhšÉ<xÝçú:Ð:ZÍoDÎC¥®RØT<“7EÊ¤Åd_GÓ!p5–K¯è¼÷Œf·d4³ñ"ãq¢<<¿ŽÝ‡å#d4Îg”¦9½oa5véºW÷²FxÏõu f¤•ù4-m½ÿÖ<}dÂÜ£UŸ|÷}éF	ÌŸ]m0û#`.’¶ÁÌ²eio›~ô“	_[ö@Ù&ã‚ø%?®*ß·4µþÓÂr<óÞK-G¾ù{û_˜dPFnö8þØ*.X™:ùžýY£Èà¦F]yëÔ—}Öwºí½æUŸ©XÌÄa"áMáÕL”Zr’"‰Í£5GÛÐôóN~ÑÉ,ÿJžš¶âbdÚcÕäŽSÂß¶%|ÐBE–ìtŸÁ<›£“³s| n„ÿ…EZ&!o@šÈ<lŸ>\ÿ8|g	¼ˆç#èe˜ —k³úg–]Â¿í‡[á‰yLí­E)JÄŸäµîÑIëþ*Cü!B{DæW°Ö¨P%R™kÈ±aÂ_‡'ë¹E{ëÞÜ¢%æ/o‹¦Ø»ÜÍÈ_+ûr›™M}â)õìµíÔ±ç8AÐ)@Iô_ÿù˜À6WiÎog)‘ê¤±=GEEÛ«ö ßÎBˆd‰êNFÕoM9*ìÇÅ¹å¢VýqöºãÁÀÒª”c[‘£ëv<Y\œÓmÃ(‹)Ð£¢ÇbgqÎH˜È{»0…õ³Z=òZ'IÖµæ¾Eº‡ÿê6EFZ&’¸?ŒbŽ!è8™Ò	C<&>G`$5[P]X Ùå¸ãÁ_g\þDhtÜH?ásSP€«i6/#Õ”&ÍO¼ÌÓ`±0ça[$›Çe¯V–Ùý2:+¡ÇÛ·«D{J{ø áÏÊVïðB&k»Ã¼ÿŠ¨ùÁ¶ê'W»DbëOkûÙô¸šm`ºX„µÒ-¿RºãUJKîÔX+ÚˆaÐwq¹+-êlá‘èl”9áCXôûÊÜlQŒB³Ü6f¹S>Ë?q”´;¢?Ïâœ5“ÎE'úû,ý'å·Z;ÌÙŠîžäzÂ,CeçUn“†÷úò.ée+¿làÓÞ4Px±L ²ñÐ67íÊ>†Sümã	.vYï7ÝY*9'¿ïQ&ïp§-Ån‘Kve›Ê¡ßkªh©îÎÓØÜ¼	ãlÁ©ÂIGv/(×Í‘^*+{ò¼½>	ÈË*ßÛïP^þM³*Ü¡ÜìMz~/7×•›y^„{¹ù—^Á”µ< ÷²sðó½ìü§ï(>÷òsx¾¿#ùÙÌp/=;Ò³p¨[Dv>,Š¤(.ñª£_`VÉÿóžvãeäâ^F¾Œ||/#	2ògà0%dE­îåä{9ÙûüÙää;
äv/%)R²OÌ²öò—!ÜZ$øŒâ Ë×¦;ärYXðOËt
&GÂm‚ÓYÙÿû,Îa.£këÝõ”nËîÜ‡—ûÝ†—ûãó€` é`03¿¼Ø­\óãÉxË[ÒÉxà:62¿Jgàwä‰:ù„‡ø½ÍÅY»‡¡ß¹Ð¹´ªxnFxüM¹[; ã¢ž§O ƒœ*q7¾0~*¾N·¦$Ñ›v÷ þ™dù4j>I&Gƒèøioíøéf4Š¯§WÝ;ÕT—Ue5©„ì5-^M’ñÝ`pŠªÅÁÍŠÄZP§‚³¨",Öž«¥}3-G{¶)I•T¾Ó{ºµÛ³ði-±ª$¬.ªn­io®ýÐJÄ£þw ]m„BÆoUŽÓ_I±Å¾õåj‚Üky>3ãã“¸žeq>øGš\5çÈ¿d0¿@ÅþfƒGóÒé;|¡^Œ²³xÄ]v©F6~L/`°ì×c1vÎ Ø[uãF{Í;c%pm‘eû)t0…P˜Àoiq8›³yÙc˜JÊ†Uâ|åXIüÃÁÇ´ÅpÝƒá¿CÌXGãiš'Çýa–$ÅOSt\NòÇ°û§ Ÿu|Ç0ƒ†wxå‹fF/ @Àâ\à@Ñ!zÜðØ€O¤Ÿ=ùêf72g7:f±Úbà5û‹¿æKv°+¬ÍÎÊPpFwýÔ{µŠð®9Ïva9”¡­÷1KþÕÅÒVg©2|ÄjÀÑHÈ…ÁiÄƒPæÀžÄc~`òª wv6öØÍ)<"Á¯]íN¡… ’yÇÑŠìæZò2°…5X/žšcÖ1ö@Æê´ÐV!‰µì}qi;õi\ªŸƒøZ…Ð¥·©>bëüÕ»(Ê¬Þ§È/°Ô[ãì€ÿ~{lV$„.œ!|§*æ	JwX”ê½‘?õjæ{¤²¨QÌú}Pg€˜$Ï³¼SƒñE¢&Ç§ ·)Gãè†ÿ±¯®€òœÇ6¥ÈSùÓHþÊYßãižq4ö›ÆO½YPÆ`«0Háp©õçö[£6‹àH/ãñ,=ÏÇÏP_¡ö^¯ˆ7p8²²>œÇø&S<»¡
/’Ë¬É–¸ÉŽKPvµ¿¿BKCKÙ»p—ˆJºˆgƒ4ÃÖ1XFØ] wî‚X6£7Ô—Ñ¡ò+’õíVOWþ}6NVZü;ºÆg ²â_ÇÉ( <þxÕŸfüÏ— Š×O ÅßÿŽPÍ©‘§ÉY.þ~çý!µ<ÉÓ{s½òÎäy:š¢N¨±s¨lþxûÅ”@c3ßˆ¸£¤ó­ŠÃ¡ÓwßiMpÊÝa5‘ÀË‚fc¬’9HœÕ#ûÒìãHûZ£4Þ™Þk•w(ší(6ãVtFSV×ÁEþôê¼wè%Þ„¿í+wæ”£.o ìæÈ[‘-­Ic•ú¼Ö‹xX ŽrñE€ÓÉµ 3ïðëâI|](jzª_Œ}¨pÒ6üc¢jôA¶v^‚Þô~€ü³­ö#æ×6> ™»ÙÌo¾ãÊÄÄÎy–ûa‹+FÙ<éFþ^Ôì³»ù€‰ncµ3ÍŽiÄMiwÔv"”ïÛ«c¨A¡÷_Ï©ÔÍ/_Ï)2Å{³Ô5¡W4‰ó"y6žÂ®f‰BÄÌ²ú>l³¦V³¦þkn8U8ÓtÍ7|Û¬‚ïŸ_pøŒ“«Ûo^26_¼zyòã/Ï^>yöøèø” "rh|ƒ~žë«‹dJ5¶ª†ãÑèØAºÓw$ÉŠ!à]¾æ(QÀëîwðÏ£=}Dðæ›oôHbÌk°¾±‚ü Y åŒ_¿M’ÑµÄfpÝôœsÊFøA@Ð‘®3‰ÀÎ€–ôZQc½±zÓþz>(-ðÞî5-pl°hxr¨dEÈ›¯¶ÝÚ|±¡öëŸ=öúõ³—G¿üøêù³'‡?™ê@Ò(š|rÚ¤‰<«Þÿú×èlÍŒ¶a,mg2+†MÌB§¼1bŒÿ?FÛÈA0D}3<€ùtqŠMÑñíFGc¿ÕðDvŽ¸ä¡@é¾Ru£ÏP¶ õÌ¹rn3@‚4ˆöÍ	À	µÊÝD	&Cë „çiR<Ír±	]:Èzñ$¿ÆžéNÉè¯Uml~Ö”T„Y^):~9˜úr¦ÑVÓ1×	¹š¡(ª®êáRˆêÏ3¢¶«¾Ñ¾gí±IeçP˜H‡«¦FË@ Ïå‘54;@Œ6–o´Q³†—Xžý¼ÊY4|Îò$þ`”r_§­'ÙIüÁ"ä²7¹˜ðô]4,Fi?iªµŒÙiý*üÈ
¸%æjmuñ€¯¥>2ò*"ÐµŸ„|*(¹¶!ÔKmG´Üé©W·#gS¸1%7˜†«ìíbÈMi=<á‡ €XBÏÚ“º§Ô½l(¬ˆZb1o¨ƒ$õÕùÓ4/¦JË]µ—Ós&çŠÃ¿0>\ŒÒF:Åd”N›6ˆ8è)Æí–ÜÀÐŸÚ}6ÀçcY¢ŽFIžy²8j5ßÙ…ØðbjSàW»ïGQ“MHP_£þŠØƒ^•ˆ*p³G(oCl×q××ƒéâÔdãIžM& ?¼šM¤·xÊœ }ý”u^NMÒXeh)›‘ÌãJ&§¶º¾º{uUåŠ5]nU5r-8Upe­µØkë_$`(ƒÊÕ-Yß»¾ÀJ¡Ö%
m©…‡9ÑmÛ³£ATîi§“’?xž«¡ØŠb¬sM³*$åÆUŒ5ht²ÐÁPHåT-éZ/«¢@kØššÝÈ±½þæeôõ\µ{3Ì?5c0¦h:L©è¾—6¥]nH’=ž¤—	`_Sž†hC ëM+ÚX__—UtHp sí+c¦”ÀWue¯9ÓÂYY”±ŸBøÎ,üïÇ¿B£Œ¶˜)ƒŒ'wbDyç>á(ÿåOådèksÕWñ	F–4”#Šþ-¹>É˜AT ¤0ý±# ®+9	US’^1weøU45›ÀªÍf å@U„¸¾NÑ±HGn}}ÑhONcMÂ´`b“*-ù¹R2DVMªbÁ F
£Ói‡%ey	 í,«¥¥vØ	¡sóë¹5Í›H¾‚)Ü¬‚4A{/f²—šˆ~ÑFL$¼µø™¶ 6\ªà¤Á³Zúê¶ìÅliˆ«Ñ,ÕÁR0ýzN÷Z¦|(x2.†³zƒ€LÇì!G &<Kß9Ÿ€,²¤}¡fé~“Ì?´lÜÕÁ×"¾¥×.q8P`˜û`Ã@ˆ0Ü%œn,þ)mão’sfo„?šŠ«R5x{t~äÈ°CêU;4Ð„ª+ävõÆØÙkçädü†l6ãT¾8eÍFI‡±¹ÂkGT}è=¼?èp€£¿ùô‘,Ã¯Åt³òÓÑã×Æ´L°«ñÂvgE“	‡ ’JtÙÊŒ¿HŒÌˆD7lŠß_²ûðÝÕàcè| 1‚zïì0"Æ‚°3}ì2v>Ï®’üq\$Êxe´¯YÓ¢ Ùà	èeD,$Q•#ÂQ¿Ì¦‡,s$Á‹„dI»ÉªòY¾= 
XV/Ê&©¸Fƒh,LcÕnØ)­Ú¯Q˜ º À\ $zè4\‹#’64t>§Pê1aP¤†± ñ#GÈdÐ‰žSðä8O ÕQ" Ñ.žL0æf:HˆÃ ø˜‚ØužC“­hÂ"6÷Ño)j S²¢—Pà$>kDñ”…VË&íœ2b¢ê­ Ž# 9Šs„ïÈË>ÜÂ±ÝÀ–§(€ªµ7>?Ö¡¡ŠRã¬ÍºŸ|ˆ@r.[/	>ôÆªò/E€8Š	ÎÕ3ÄÔi}qò˜„¦™¥þ1s¿1¤R–ø§#¤7è5[K´‡Wé´?D`U‚K"h‚·cí»¥,«6lêÅ„Q‡záfDBÌ[õ’lN”+ÛÍž2ööÑw®ç³³_ÿÑ¿È¶%D)ß~“Õ”§’Ì—ëÐï!d6šrçK•fßXÖIüKKE©VÄ'#ðš§ëï:y|õrßÕ„{¤SLíÆe¥BWÊ•U/ÈŸ° ÿÓ)xÚù3žÉ€¥h±¸ÜÆ;Ãÿá8™>bÁýý&ªÂð¢¹ª»@¤9eù5’\hDjø™÷“×	E¶Géq’¨PzLeAÖ ?¥þÏ1ã“0c¾ÛÕðé”›”+ŽñYº\!íÛµOµÏ Ÿê>YèåzŽ”Ñ(êz¡5=~<ü•^OžÃ÷dX$’ ¦©47²ÔÌÎ:rÒÆ	’Ã—Žz¡“•#«1ÐfããìjÜðÔàr –ŠU€¬aR©©èÄÌ,âddu¨FùÓ9 …š!Ž†.ïÌÎí¯Ú~uS
Ë*ZÕ
b~<lyñ¯åEµÓw
ÅœÑ–öß‘xG'ðKÐ%aÕá–HÖŠ «Ò'V"¡A¿ð„ŽSêÑu<šëmëv‹æcûä/ŽÚÑ™¤õVMs@³³'É„‘ÐH¸‘‹û®®¬êà±¼Äë"Ã£Ê¨q|‰9iÕ·óqëáÃï”.Îš|´=Ô¤Ž@‘Þ£R”‘íô¶ü½ ËVKÝnYS˜ÓÛÖs¼fb5ÕÛ´šòâ"¶êA5QO™	Óâiž$‡LÝSfn®­~š¤,*øé¥ ôG¾žÌÛ(Oàûà—ÌpÙìôåX=eÈÑîÙñ+Ó‹†¯<«ðÄr¾°ú{BømãÑŽ5)§l˜æ0ñQïÊœ‰Ûí¨8W£]õUþ¡¶‰fÖ>˜vjrïòAÜ|GR1Z y„`#·:n´¢¹8OlŒ2¯ùybƒ_àjˆÃGùBQÉ¼˜rwhüú¬¸ÑX+¹À<uøƒZ§tÔsf	’œÞ7šÈú@o sJ(üŠYíYDÔÞ2-µSÄŸzgêìP¼š “ç,;öûÿúßÿïë9´!×H`øÍ{QÞYà¯$³@Ú©£mË -ÝQÞ ©§Þ¬"­`ÂÛ™8ää=9x»ŽÃ_©5uîû•réàÖoJA»ÈÐBÉD*ýõuž]fSfæ±>½ACz²ä’â‰èÏ€ßxÓÆ·Ì¿œ3qs²q>G~3|ŒWàÑ±èéoçIOäÉpÆ =™}6[ÕA…¼TXàÕÛ¸ hìŠ†õAõ³ËÉlš|ÿâYSŒïAKïÁjG1èx…µ´²Ê':x‰vãÑ]tÀZr:@yU¾‹NTknGgI‘ÜIØÕüsÕÖÖ¢—
Ï(%:à+…a‚æÚÑáó·‡?#â	
J[öaÝ9ÖQÎR2ËW¥”t…ßO²'<«ÚžƒÚßiõ1²S<]SüŸWÞ¡‰¹+Ý‹×ÇhÂ@Ø‚°¤Ç
•íÊ+a¼ØQ†ñD‹_»ÇäØµÞ‚?åU%%züÚSß{¾ïêû†ïû¦ú¾©}—[ÍRå•ï£¥º‹Ý(vØ„Ê°¼ DšÔ³Æìïa\àÅ7áÊoú5±/§ïÄ[á|¤L*t‚‹Û›Dw>59Þ“gÚTé¯%Çâ~œöFuØŸÎx³–ÀÇ´_IÕ„ö+”ìÓñ…X
“A"°Yb?ÜqÐ÷èÓüx‰ü
Xk¼Ù„Tð­²8%ct„·¦áÓ5$ëúñqÕk@ÒÈv—sk·Õ±'o©%Å£f¯NÍž¯æFš¾š›ujn*_jtàŒžÞ¨¯…Ž†
ÊÓn‡cû*^€Bß€âÖeYÍ¾ÓÚüæ›ïø¶7
ðí_oì¦{¾¦{¦{ÇvN9¼MoøšÞ4½qlàDÇÛô¦¯éÍ@Ó›ÇvN¯XÓVÛÚ
9¨yö·í-eùqÓØáÇ².]FkÚðÌz&9úfÏmÂ,¯ÑX­—ý½èÛ-{Ø‘AÐ`ÞÆ×w3K»^²73Šo‡jîS0	sÊkn±]v¹V›A°­¦A³Ý¶V£C3€Þ¤ä!Ö²Šï+‘ÓžSø>Ðð(±V·Ñb™‰v%“e£aÛpM¾¥dÑ­@+=­•žÑJ·Ò«ÑÊ†ÖÊ†ÑÊoe£F+›Z+›F+›¼•MO+ïL—úËÖ„H“Ùt+Z¼ÂLS³½öÐš[Â|ò1Ûì+_ò7ÌºÀ
ðwª_eY€ÿVúÃ8ŸEÄÂûô®7I<¸h0Ëˆ=¶ÿ£©ùŽFL}HWÌ(ÆEBÛñEó2›¬ýG—2Ÿ?¤ ÌÇ5Œ?&$ÖÍ‹ˆ‰êÔÀê:å¾ö‰>’IZ¢W@(2%"u§¬x,G´ÇÄ”NÆbæ0ÒŽ7¨º­^k£µùn•Æ¯ä	L«eÞÌ)kÈÂ¦¬cI7Åâ˜Ã^Õ  (°ªÃÛÕAµç=•,-´œìGòˆàTecÐdÀjt	Qžã€µŠüÚpÄ¦d®jþöKMºRåÖÙš§Z>sÁèDÒ +¯«#µ)5¬Õun=]]u€í1×<_'ãÐ¨ï¯OØýÇ°5±â~Èb<V£y”J‹Òw¬Æ¹ž0o]Æ)Þîçª7§ïöµÓ˜î.JOOÿ±¡ÿØ”‡/ey_ÐZŠE£³ö7sè®ZUÇÝ•-Æéô;F2å,Zl’…2P¹:3~rg–Ñ‹Ò_éB˜ï–^@Sc.EL4@ÝCH¹I±©é$X‹Gýê ‚]6=.mØoÈºzy}ÈOµãýàÝus Îåt›È^ÉŽ˜ñ_¨eã&Jfuçž
šÌ‰Å£D°±óN>xzm`ÕÆªãÛpžÜ¢MVÙÓj6Õ‚Ù˜mmm½{šfPÜYµ†ã¨›i˜"±‰ÐÚëÑäÃC²ZñXåhWÍ“‹®.GOÚ;Ñå`w‚-„cãÚÙÍÜÏPŸþÎ³+'¼:4ˆWj1Ê PÑ]|Vd£Ù”9
­Gä*ÿ^µ·7£!þÇÈ¬¬Ç?(™6fªÎ *éô´/s<ü3Åxp°60'€;‘Ã¨év|¯ÐÎ²)¦]QëœjÓ=o®k¹?ëi„¢Û—gøO½!•ŒN.ç?±9<qwïÓÈÎ±=ì:q„°€ô÷&üMhÄbÛçqÿp¾ö”Ž´(z=Inß&#gÉqøñóÃãc³ãµa×Š›µY AÅ¸0/4ŸŒpªgÿ)qÜýœÍòÝ½s.…A…}¡cYíòÅu8Ö¥Ú´˜To”Fg×Ü1ùÿ56K‡ÑY<íÑ‰·\à¬«HÖì'ucÈ¹kÌ¦½«ô‰å267_Y†çËtŒùÚ·)_»¥Q¦C.Ý€B¸ñz›FDGÉM2íþØusÁ#·+xvèM;;´wÓÚˆÞsÐ«g"·'reÿe=‹y$.cüœLs{`.[­Ë\,$>ŸÌý!c˜“D+¢÷•hŸáÛ³ä"p€5ä-‡œ„Yß@1ícÌº*ó"NÇ‡À›h/òÈ+Äÿl¢~/â³ì¿_à‡l}æ½eð®¥9—]Q±«Oœ_}"zÕñ'ü±æ_%‘-Ø·ÁíU\Vñ6º|Žåœ˜º›ÎîZ’ûÒ<d115
íFð4W[n _¹Vöç¦t:`'u/ù=ÆÑ`Ö§Yb¿¸5VO×ßys1,Hìi‡hádiHO<˜ñG#ÖâŒ ƒ‰’™¯°Çú½½$™ñbÙ-Ðþr÷ŠPÌšáÜs¡.BºÑ5a;ÇâêÆR¶Â¸Úm|Ø0Ñ¸ø«iX`ØsSêµ’øS`i+¬7¶«ŠkSèKÜò[P¶³%yl-,žùò`°@yù_¼y´]Ûð_8^ì£¿ƒ ?H8Cênßø‚fî“ÇøßßDÏžøCaûãÌZ!u­ÝÜˆß¸`²Ê/1Rh²W†Ê‘hóËøMƒ¶v‚=V…¢E.‡q¡Öî‰TâP…Dâ]×‘-Ä—žÀ/ñbG‰å±Ê;{º‰¾óÇh3ïixd21HØ)+a$“ Ž$Œ—Æ¶¢B€)»¼Xé ;\" äµË~žvab“Oïø8Ï]‘}Ì=ŽZ.:
Ú8½DN’¢Ñt@ÿ£”þhŸç ±¡.Ù‹3æÜ†¹Lòë¹­ë™&Zñ÷=-49	–A`¶A‚B¤s1DP‰h67¬NpæJÞŠW¸\Cüšmw}Qñ¾æéøHrb&³Q‘ør	<:žÄù‡Q"ÄúÞº‹ýŠMøßpÝŸÎÎÞÆ6üä h6™$yŸÝ5ãâÓ LÁ5ÜÓ.!(jèÆªÎ+îv<§»RQS"éª?KšOòñå¾P¼peÿD“ëñ´¸ˆž:ÑáhÄ"Pô¦–­´H¹å®-tÎDä…Cúm;®m•!bß»[3(UÀŽÌù’™‡d;òEíõ±«†e°,§#_Ö=£]2:W2?ý"™Bî ‡›v |ØXk[®ìƒT„I¢»ºå¶nÙø ±*-‰&{
 ¶#áøØ,êRkZC1Œð¶ ³¼íí¢Oì¯3ÜzêsÃ—CÒÇÅ,¡©fdþ~cÇá)
"Ü7d7¾·‘¶
9<°‡‹Óæq{3[|fNbuH*RXOh GÔ”&jÁËi\N(¬­ÏÀ
ua-È—g†åÜP*—c‡þ„¢58 &ÿ¡b¼Ò¨X÷3I?ñK…ádœ52›Þ‚7Šás|jmð K¬ËEÛÄÎfjV’ˆèÖ/äkÜEšˆbæ\PðÝ‰î>.Y°0ÓY‘^†X;K=ýÈ¦%¥šQN#um-[ƒ¢ŸÕØj÷ò\ÆÕÁµ­u·,µ;˜ˆªZ“²6RwóÆG(‹I:^å½A™9ßGHn9…ö³]4¢¯6o#s-Åª™Ž™sòó,·ûçè~¬§:±+÷ð×b\º4ôIIjdu	ÆfÀ:‹4vrÖÖŒÀ>üâöÍ”'ßæw©LU&=ÜMêg/]h?7˜ÍÎ!àsÈñæ©u[=/ŸG¹Çr.ö dZ3¼ôv-œ¥0 ±×a§†¿Žþ8/J²"k‘¿žcWé ƒD»÷ÇV’dí¼zC'Q^å¼+Ò`I)Ä'i ÕädÒ¨½a&›ÒÌ>@=›Gn”žçXÔ’écÞ;ÀpzVç¶îU@ìU†ÛÓ‡]šÇÞƒIùAæ€—+Ñ3ôîÑJQá}õ'ìÀí²Ž]vúÅëhPQ ƒa¨áœv²ÉÌ_Þ-PšDwØÁ´Þ‘''b:¦Ôt´®lŠ;8ÅZ¢•%q:ò/Ú×:Äè×5ã$qY.-Ÿ¥	~#é6Y2Ñò¼¾x×ø7SŒ„N‰ýÜÙZD¬&©ßUv+õp÷C),5bÆ<­OT$ÉC
B0™Ç&\Û	ãÈ¼œÛûc™(üÇLì,è•ä„‚ë(¶bÆN·šŸ7à¹ZÖ­î‹[ÎÛÊüPÂíÄ£¸%ÔÐÖlþ>¬R
VÀ–QË™ÈQÙâQ_ÏõÉDóÄÄ¢°ôdÑ;lÜ@\º!‚©$Í§Æ‰¤]ÁÌ<Öi2Q¡dyTU-ËX§jQÙã9ä4Ÿòõ’íˆ&x
¢Ó]m¶XnËYkiM¶÷u5<5Ä¨,!êØú·rT`èsÅ4Ž³8kÔèy—÷Ì¨3ïWÑ|Ù¬¢Þú ä[BUo€Ù%¸¼cî©÷äxÎóâDêK;"G;:*¼v­¢6ëpj”§|ŠSÁÖYóá5³2òÅû`÷Y¸Æ½~ƒnñÙ‡äm:˜÷æ­°1k+p˜i>²„½GáŽaEè8ÕAù*ÌÐÖSúÑ€:sóúÏ4ì!…8ìGQa–?z^§R%bšM^çÙ$¾ -§¹ú]½š¡0M3´QöÏ«¡BzÐÃe?üTp|ü:ížA´©3Ñ'¤žs{I“MÃ€X–û¢øNšÞkG*:±©$m•äÕx%ÖÚ¥{«\C‹‚Hp³¨$øàt`7\•Ú1îqÃ´ˆr¸K‡¶jëË+Ò·­ŽÕ¯Öù\ø0«Ì&(±>”]?á±o(¤¿<ko£–¾c	1¶ýÐO¶0+…¾ÙÁÍNî!‰š‚ï½ƒ)®[ªÈ\¾YrÎ#„r]n–{ZiUß®—˜;]ªA¤/hVÐ2º°Ü9XM'5NÂv¢!ü¿®pèî0Ž¿eÅ™˜ÿ(ìû,û@abË]êîà\ËcŽöê .ü´ñFF-Ã´ØïÂ0õT;Ý•{|ó0®1Xž²úYØNÛ¯»²ÿ"§Ó,ôsf~Ô*DžøO<H.Ó>ë=)n{þe!’eÞ› BPkËèF)¸*¥)øÌý{ä[”^?æègk`ˆœâË“ìÊÄF›`x&­XŸùú•^S¾‚~¥°i<Ú›“Tã(Õ¡aû½Z.3òøGh{Iv5†<hÕzK\A¢à>–É­`z­rÌÓªvýU“OétÁÞÔ:bÅ<Ž[ïôü4¬²xO=Ï×ña»¦¡^ø3ú|Ø3wb™’aLS>b¥x+fYÓj®ò(ÑÊß(ÝòE]WP½dá¾ž«Òz2M³‚õÙX…°B¡ê±_+y6À{¦FÀ"³u'«Ï>ÁÜˆµ8Å¼…Óø]G‹së·îoí{Okg¶&Ì‹88–A6ACyœ'MêÂç&_rô&chã3ž6F7hº«nÆ?2U~¦¦á‚%Û	²¶iJry.ëPÛµí-íF¡+³X$|…žÐ¦*5–I}â©mBtƒ–71È|•Ý‘cp,]ƒ™cÅRýÓX'´Ž«Ôbgà!‹¡ÃS]ª‹V8ÕÃÅÂÊuP¡v…æjQ™Ý±¬˜ºÄÛŸ»ÙlJ'C$qdýe÷a½	ÑâÛÈÁ²ûÌÊ¼¾bûÌXG¨\pKghp`'UÊäÀõ§OEéùÓ\1‹°.]eüó_Ÿ*7+íÕìdN?P’Fí,.He¶ÊÏ(çŠípmöÆóŽød-×ºo)ÿ»ðx”ÖW©Yâânwq·Žóa5Íu†tà~7-ÁX‰Ì›>±¸°Ê-Dþ*ŠÐr~ô	–šP5AºŒÆ/%O‹çrµx–¯Å³°œ-ž°¼-E‚M:X›+ënjò¡R©$ªŽ¥,*YÂžJ\Pn8®qj‹’­dÃ7>õ€{`ÒnGãp<óY½{ïÁ!Tó´-y¨¿Ÿ…u=Ì õg~w[~êøp"¾à\Ê¨cNeeÎ‘Dþkž¨ê—ô³Ôå\œjB¥©fgÚzo¤ñwõ'YaŸÏÂ¸ìxf^Ê<3?´Ÿ›GMßãB«ÔuÓ÷ü6îœ,§T3/éŒÂ2‰7ž@M—YtÂÞIïÙF½.jªIJÅó™]@•øTÏÔïéù©`&¯ƒh¥_;ß;tý¬Ñ÷e“ï.ÔÔ~¢;wì'êK×QŠÄ»WfÌbLÚVaé¿Ê¼G}ÃªG—,~;Ìòúÿ¡t²Œ ï™÷½zî¾ç®}ó|Ï‚TI<aW=¼x—­Ôä!¶…ëºç¸Û-+ƒöŠu¾ 1Ò‚Qn§ 1„<
q(rŸ…]Œ<3«%üvK:¥í—ÈnÖñ¡~»J-0 •}Ç]
tj	e!ŠÏü¶>C!PÔw%ò?K:ùŸåÝŽüÏoçŒäj¹(ùŸ ã’ëñôr×Ž,KŸNby)¡½Ê¶ßÚçu—üÏ­Ý™ÏrÛŸú¾O§žKTè©pCu¹!ûªåtéé®>áTê¯D°•}î»,!\DK€g¡ÝòD»õX(\ÏW²Æ@kõY£Pé€ÊòhMÙfC]]ÿ,Ëñgu¼
Þi®d¬ACò/¤D? ùù—E/¾ÖfOÑý"ÂAÛÛÆ)rHW~––Íø‹º.^®ªÛ¦>ì•
ýÁÝ(¤[îmfOtÂK3"á	å¿!:uÑˆWÚ­ŽW:ÜðÆ}ôN
­àD1n®™ß/›³lê¦¸½l¶âç[9>„û•«¹r"³ê¸‡¯Y‚¢Çñäs®žÈ‚s Sêt¦ÙÓôS2hvQvjü×þŸÆýªÖ\Õ×,ÉP„™‡ÜE54æÏ°˜FoÚÊ¾ÿz®eDÒÖ÷æ/x“«±þÃƒ d±Ëã%:ìØ8Þpù/2úôû‹ž¤˜„”
ôâÕ¯
” ×N-äòãŒÏuÛôƒ³­M<ôÇ¶ˆö¨œ~Jcl¬ì?I.³‹<žÓ¾à£Ú(ä,U=J4{Gõ0pTïnb¤o1mÈhÔ‹X	½ˆs=¸ÔõîÞ†KÇø†ƒ<†ƒR)“\øÍé5£>iÔå4èiª¾óùïz-ÿ‘ŒgÿºÅÔr–ÜÕr>¥&ë.è\K¯â¹¿t‹Uÿ²×F÷c2š<Nóþ()_þ²{nw€jBçc‹ãÀ+l³þ=“:véIeÝ<~º³ª%´~yôön9¨våS¤c±¦è,¹<ìp ÷:hËü1¬6ûÄÛ®á(Èßº¼ŽrÂŽR;J¹°€|ÈN²‰×W±váö`Ã2²ÆÊ¾»üþ;W‹Eåå±ý´dîKXŽŽ¨´ý6$Ñ›d’xuÏTóƒ/îiMæW3 :A}L/`œf£8ßixŒhu CùŽT˜Aõn§ŽÛ*©pÌuÎN¡4ºP§ôÍð.^W|ÏÆý¡$ó<»zCYt×VÖ+¾MuXùí³Îò“ú2¶ ÚÖ3÷ø¤kkoôÜ(ll0ÆÔóÇ­Rßbþ2‹¾ñŒ…¢îÇ“é,Ç“Me]Œõœ9,ríªB­ê•ù…yˆ½ò]R[í±UjÉÁ£èÅÙåË,™©Ä;Å×d©=ÃÄÔë èÿ¶ñ[€$_.³é·qyd™ïÆÊ³B3D?ë…!
,MåJ„Ãp›¿÷­EÅ„¨
Ía›ÏÁ\<
žÄªÔ]?1}kâ[wù(üM|–EÇ…Wä¨®-¼<y6Ž¥OKïNËZUïNq t8 ‚jçó ÃYR$d9FåÒÖ™¿ø]a‚>'ªÁ'Q†Xçn 4ŠEÛXtÝK2,f‘›`Ò¯ Ob€y/Ì? ¯#³ÓÑÂò½ÖéÍ®»tÀâ#:¬§t~Ï•ÚÚ¯GpÒ´VòË.w¿Õ¹:^šo™¾;ºØ¹©~,eÅ]k¿ÕVäŠÐÑU:¥¡#€n®<iñ`¿4?HåÇ²P×+ûAð»:èü:}pÒlYë3loîDúeÛzz,Ÿ~7ÛÊÑ¼r¨Ð‘ÁQó ŒúMÐ…mh*”gÛØÙ³z;!5g3”;kÑh2nÑª¢he½¹CyË¡tˆÛ2ƒ(ÆRRD»»Šè*@Æ€­q“6"Ëin—ÂÀçV‚>´x“ ¬@€ÀNã³î^Ql¾Àˆ¿¬ð[Œü—6Ï¡-´—x£²¹7ïãw„²Â¬ª1vF‘ÆcòšaaŸÄ@¾ò<¾Þ[Ùˆ6V" \Ó´¯n™òb{+ÿí¼{¾uþ0CðÑÿ8ü”!Uôßè¯A¬„JÅÐN^v(#üP·ÞûD„=&7Öîz‹~½åWIÝÐËu\­ñßnÆg;”ÁÛ`hæ?ÓÌÙ%¬öÞüZ„µ}w‘‹†* Ÿ¦“ÐÐû0H 	Ç"u£So€bÏ
k·7ùÔhñ·ð­ÖôûÓ1q#<³ÐÁ=ênÁÚðŸüâ¬¹áÿÖ¢õNwµrÉA5…°¸ÌÆÙcTâAÛ5\L"Ýæùæv²UQN…¾õšÑýa Ô¦ZmÖt£¥7RzŸ˜…}"ÛÚ^º­ÀI†Ü÷>æ¡+ušy|PfËŸ¯º^Pz`‘/’x½x}l 'y26Õÿwá¸:‹Öõ"Ä#Mv³ïÄkž}Ÿo{UÌ¿stsˆÒq‘àIÃ?½õwÕ\Ú=J/	I¥]Ÿ/»µ®Ý“/»/îÂ—5å;Ss”â	„
ó"òl‚¦äLYm¹Aý—0¹eJ_»ˆ`3aà!¼«ÿp«!8ê‚MVíR=O5Œõºó’		oƒ¢	IW™]jˆ_€_\ap3…¹žFÜžjŒ¢âàþþ
åÐ!þÇIJV*{bŠO,mïÎ’7Õ¸eCË;b	Ã†7sÁ¶ÛrÝ¿½õA0ß)ãÐXÃˆ5'9ˆ>Ö×!îœûˆ>¿+)S
Kñ¢‡e&ÕÑ²ÿ½I@a+øÍ&lí[#â›;5ÝkË?³²,å¾R…"‰ˆôt‰™zØáAôþ„ûël3þÇU<¦žö-ëìú"fLg™Òx(}q½ðH—È9`1Ïú5Ð¼Ä3ˆ¦cü-|ŸEôa8=ÀƒË‡«-dyÀï0¹Ú¡)ù†eYÃÝõU–lMRp‰°ÿãa’L;ï=Óß-™þÌ¹&´ £ŒGeªÐˆ–è™Ý}šPÜ£‹3öXCÁ³TÑf„²”JKiýäeÊÄÍÄê‰ÒYãÞ—O¼{ŒâÐÈ#Ø…îIÕ‡Ÿÿê1Kq¼(¹¼±\R©éG4y°`tIÚÈž*)0;pqÆ/O—#¯¥Š›,É…@+;àÙÂXä° ¢C¯6}'cwy‚ãu(ËÅâ”ƒiÙµ¼»|œªÔZ¸y EÉª{–¼=Y›ó­Çjìõ;©fŸ?cþK—‡Û¤oË$Ý]äÂ“{…I¼w4™¯œòO@á›¯¾b1^žÀÿ~øåø§ïÿýèñÉq´B‘•§é(¤cŒ«…?@ÒI‹!ÿõ"†:U¿àoŽû)vËæ àG¯ã1´2ƒ"×<|½Ê¿þ#Í€f}RËVZøö$éÇ@ /®‰µ=Œ¥Ã,¨‚Qóäù‘håÅ¬ ®ˆEó©Æëáuæ&­–ø1‰GÓáÊWï¾Ó~ùêå/¿ï©ËþJ&Ï?¸Ó?>ysôò‡“^=ùåøÇcGçç	QLiv9§úx_Ägi²oô·?}ˆ‹kñé‡dŒ—ú#Lú	-|	"O‚	xhÒçItü(^áu{=Æ*ØQ\Ä×ð Íx
e	° d±RúÔ`6_½9r¦ô
ÛòÌæ7ioÑÙm|Á>è³ÃnaIcÜÜŠôCTÄÑ[ø†ïÿ6Mg¹11ƒ37«zQÌ@ðJq2ÏÎâÿúÏÿ;Åá×Iò¡ !ìd6¾È°U½ÖN¯ÓzÂà,¿†¹ó‹Ñ3ˆòJ“$ùzˆýBÇIA³Àwo³|4àPFÛßå$ËñàJ•¥}£y“\`Ø7¾Â ŽÇÔÖ³1Ù^YßýkVÝÓW˜
¾Î³3À‹úJÒ÷£8ŸµµÕ^¢ªñöÙxšg€»"±˜[Vd“áu”Ó›g £„\ˆ,ßõ¬‡"O0Ôk6Á‡ìËOx¤˜Æ,ÐcZË¤g0²)Û¯3˜•ƒÉ:ŠþÏÆFÌúâirÕ¤ "JíGÌq.RžòGƒTäæjÑ‹'áV{Å"¸&.òã+-yþ4ó¡ãDÄNüé¤Xßca´Ê"‰l™wl ?MðDWë5rIë«›ÝÈ˜Ú®˜6Ô´g¹5áû«ËtúHÎ»‘û$oæ\Âx}ÌÒÁ~Ë†ÔM1Äó¾´¢ÅÚ1Àh´ä¯aAyWjXÿAÉñ,¨ïFø_hä<%Z+3ý.!³Öã@6Í m¯|?Ë2.Æîêè véÀ‚ÚÈi4eœªZF,+_uÃ„xFGO1„>î	) Ð<AˆzõÐdV$H’&aÉÆ¼ú„Êü}–ÌªûZýÖ+>jÀ‚ÿ]4 €xîÐÖÅ°]ö÷°h£•¿Á!½¯ÄqÞ%ëHE§Þð~2Âàµßl4Üi¼ûXÎÈþäióôÝ~“¡“'‚ÁªÑPðMÿ:ZÐûÿøÈ?A5Z6ØWB16ŽÉeÖÔõ:Êý¨-ŽÌþxÊ|²¦È7|/Ò
²Ô8ru\Ññ+!º;µÔÚxtI=±þ%"‹¬îêô9>jI<ÀU;„…<D°‹Ýu¥år !˜@Ec¤Xöçiq2D‡ÞŠÐâL\×ªâë›–µY<#{çAIÖþxAGGíµŠ‚d4èÊCP²ñ&AZ3ˆþ†W]Kû³ÑìÒÀÿ´ C¼ÓÍI€ü]ºÿ¡^œ5»LÇ¦_Ï³”PEZßÿ•E
¿ÇñYöß/ðC§Ÿ]6ôv¼m„r5ÁjÊ±FÃäãŸ¡m}´Ð;ãyðÀ"ä¦H3§&L'…çA¬¨]R^S…õðkU¯ª–’`æžÔ@ÞÇ°6éùµÆÆµYâÙ•€&ÌÑæ8ú¢£ÈG«ýþ0°ÈÃ{÷›lO^áUŒAÌÎ“HKº¤„_™3FÇ‹F‹jã6Êü—"{»¥4ñ¬,šE ÜÍ*«ÝVVXã\b9¹ž`HŠx¯zœÏ]ÎRMVöêJœù÷¶Ø›‰ôØZçíÅv=ZéntÚ}Ç^ƒš…äD¾™ør€0Žx‚ö0X“#ñËÃi‚¬Q †HÊS¢WÔØ±ûÞÏAviøÄ©xÚS¯K›“í1ª¸èsÐ,Œ“Ox–S_+ö,qÏ¤	cXïšÁs¶€Ëô|1X^|r›[5Íž|hD•™Pin<CSpòL„¤%;gäEU×Ì’ÄáØ¸€»ÎK3$öÀ"æ.5-^jšÏx!†ÃÈÞ
Mlòâ¡ƒ4:nœò}ùu4t™øub¿50M“Ì5ñËà 'Úv×8¨þÚ‹¼!ÂÀÆÅ™ñÄ‘ºÜz
ÌÞÞõ¼‚’#®Ú÷we½óïÄ^ž|r¦üf3PñA‰FÄ+côÎj4µ°Ë5tˆèWÊ¯³$¿N˜Î‡©98kE+3Œ´²ÚâŸ¯ÐA¯¹"°%ööVZrf,B÷ª.óÍÆD0ö8žÃlÚüµû~‡’…òáºÝé;ÒˆÅt°rxäL¹Ùdýc»5Ù;Ô›G3TÇx1Š†ØétÄOÔÎ`©npçi=š»yÆä¢s†n˜[T¼3™ÃælÕ³Qå;­´•Zªwø™%Å¿lˆŠ¯¬¬Zé›ÎìÒgFiÙ¡AÔ(ZÃÂ$yî¬Ì½ï³¼¹r„ÿDçÉ´?DvÇ	‹àÜÅ. ¶  ¹–&„h*ÒÚ	-ÿ>(Ýg:eç›Å)™=©9G<À_­2yG—anV-`•5È&‘ìpP¤‡×íä6[rûÌ²[‰ô¶˜üæ“à|2œOŠÊq>IN¡¡.»éG‰¦V¥iR7Úja³R	8,h\\û°[v£70éiWôè#LW[è„Þ=IÎãÙh*’³GŸ‚ˆ¯Ô™É­ùµ!GIùS§9ñU#1LuMMPÅöåö¿a¹·ÜÊÊDØ4+HÆ!°U >Ð.ØûD'²|µœLñGHpÚåú"‘­ÝPä~%|÷é–‚×£ÃÛE?O´»Ž••Ø¾ ¾ “Oí<#ÞÁ@‚–"
N($éÚ¯eàìÒ ƒ]ö3X8$í~É×skÏá'Zô?\ó 	ÿlo2‡+Íé¬‹WÇ¬)ºUÍ8WííÍhˆÿ1’á÷È‰ýàdÀ†õ¨}‰xáŸ)þÃ£ç¶	Ï–àl¿"\˜ÏIŽA‹¢EÆ\O”9³šº¡SÎÒ±‚Õ+ñþä ±ƒ hÑô„ÁnÊ  ùT¹™¸Ñ-ðBÿsŒ,edwÅi˜3÷j>6•Ùp¢v´qO<D–îfyæä…üÍ;šÃ¡Ú Å$þm÷Þ›ç°çF;ðê×³äG„BÆªŒ¾ƒÝÅâÒØy–#ÍÈ¼§/xš+·óµa×3¤²„xe.Už$wèÔºYåzÊü   ÿÿ ÷ÊìVxœì½kCI’(ú½EZëiÄ¶$$6Æ€ÂfèžõñµKR!ÕZRÉU%Ãðñþ‡ûûî/9ù¨ÊgU‰‡ížµzKUùˆŒŒŒˆŒŒŒ¨_?NÈE8Mê±?	záxPÙ9ó“$˜ã­•xæMw~!Êgke|5ÎHìÅñ‘7ñ·+‰í½Ä¯¯7›„ýœ‰wU¿¬_+zmø¼ó¦ÞÐ'ñ¼÷ß~?‰kdy ‚ô£ ñ£À«o: ýyýùx>!³Èý$à#²'Qˆ…­0<´!ÞÄþúñgð7§¯S¨EþùO²”Œ‚˜ÄìñÒ-à€6½Ó0Ð0S‡aàE{ ýL¿Üô½é»p\\ŸñÁ“_%U¹!µ£›'ðöÑ|Òó£ªö¦Xôý¯þx™l‘V‹¼RZ¦­÷æIsNwÇAÿóöMu™lïsÒ MIw ±ªÓùx¼üÒ^ê îp:Oè¤U/¼qì»Ë:¼ññÌŸV“hn+w{k<’¦~vU_'³ëz»±NzÃz0Ã°þ¨`~õ£ÍìÙsA—# 2•HHÎ§ Kâ‘7/‘†“È›Æâ¶îÇäbì_¨:‰ë}
„Jþ{'0—âçÐ›ÕÛä²~È!“ÁæeÝ›'!‰| Ìà«OþQo5¡ù(˜~®7+Ú¨Ìu²u2žuÿð·oZÏnÉÊÄN9‰²©U›Y&›MlVÏíq26‰qö¼1}0ˆ‘nß(I2ŒÈÊ
9õëóØ't^Œ½!å ÉÈ'$›Ÿ4µ0M½ÃÏˆ•®Øt’‹(œÝ”í–#±[…f/ÓœŠ_ðCF6ÏI“+66@ÿþmµqp„3¯ï×¯ë’<¹Yùw²ûûééÁîï‡¿¿#'§Ý³îùù÷•¢!cc:LFd{{›4)Ï½c]6˜¶6&í3MúéåèìãŸz?"™lÒïQx‰ß­TÑó“KfÉbÍ­[£¶!¯bF–”$%A¹¤;ŸÍü¨ïá‹¼þgX€u¦%Tv2* lQ‚†0jëšâ	0tÍÒÍŽNÝ0fFÝ6Ä>íÉò†¯ÞxÄÌx÷M:gæRÇ0»‘7B­ªOÙÖ±Ö¯úÄ‹†~Ò Ý,ÛÛsçÙrÆza4€©dÿðYhÃ,H|H~•ržT¢s7ñÁ¿÷çñf„ÓÔ–pfê×J»É_ð^²W$œ'ã`ê×§áÔ×~lH´‡3:¯Å•
±×ûƒÎ3n¨
ç“1"¬Ñhl­°jö6oÞ7k¤U#íY­‘µY¯‘g5ò¼F6jä¼Â×ð¾ÕþÐ˜x³êçÇ$#ÀÏþ5PÀmJ·;7C¾Ü_‘Ê_~4ô¢ÄŸV@(~¢óKžB¹O·ùÐ.[gtE:~‹µéÌZ–2ú¢FÁ€àäq½…1ûÙ&ã¡ôs•\¥ŸkþpÃœqô«ÿFâl;Ûä9®×¼2[Û09ŽEm]´.]?ÉõÆÉJØ’¤´¶}(
òê'ðˆÂwöwç
/Rgð\€,°ÖUƒ ‡ó£¤Z9
ÅÞ6Ø 'c*{@<Ëú A'ŠUbŸÈOæÑÔõÞ>^Y;cRïp–YuéÔÿÄþ€üiÆ×—œý÷s'düuL¶ó¨!¿úE0ÁÝn“*m
–âœ8ñ£Õ\†•ù®sÿ½ùxöûëÿèîžŸ5X½*Ý¢Á´Á4Ÿ}> út•Z½š·ÂúØ”€Ñ®—*õÿ÷ÜŸûÕ¥‰—ÀCî,z%Åˆ&òsEû¬þ¬¼ÌhƒÐàJ©ÂðWSe•«ž“®z‘:Ò%¶‚Î$× *˜ìûI¦fbSchg¾u¹:ä‡ÆÖ¼^Žç0²$œÕaÁp”À¿—õÕ6áŸž$ÏVÖ³‘öÆL¬Ö©ÆK¯ëêx«I«HvFqeÇÊ”íš3dg¦®ú—¨µŽð<m&U€% pC@'GÚ’Ø1¡¿‘6)v²íƒkˆ 94üŠl†À	"Eáô¦Á)4ž eÙ£½Fw›dë¿¼™òÌÅÆræŠaÛæÖhÍ´Mì
ð‹f3S{¤ÃÊg+ ê®åtbÚ¿Þ·Z³«D³…M€²a	1W§óaeXGò	À,/Ø› Y÷ÃÈ'^Ä09•ÂóU¶wû)¥L)}ööŒìâôŸ¥fÑãd_tú ×$è“î˜a þ1¤÷ÑñÑÇ;Jp[Õo%ÅaTÿá%¹?ñ#o<øs‹r1ˆd¹¨òã	ól0Úlj /,ÎE}‹<w½úú¡wÎ“]¦^¾\?Ç3,œoŒ;­v*àãÙ8HMœ›o,¦‡Í ­–c‹ïÖŠ´„{è¥4„ÅõƒGÖòtû"y\½ _„B[wO»©$vÉR]’Æ#`l ½[«ý†"´7žûß^~Zìd'…~ÁIËßAjÞOfæJL>mæd@–•´²EPZŸßOJ>„ŒÔÎÛò¤dZã”÷”‚Áä	Çû‰Æ³Ä›¼h@Y–äÕQm­§N ËN	™#­/\²qA9H79?áÿ4Ax~Ú=zsþ¶{ÔÝûˆRqaê LyFxäùç•ˆþd"¯ñcIÅtÚªÀ.,yu‹lt¼ùþÒùÓÜÃnwK‡¿—ˆL"ê>âO}*ÄOT²ci;Y—èy…Às'ßBFæÖÖd"u«Ãæ™ÒÂ´ïK^:³Œ=ùÍ\W€à`
åaéÿ×l~(¦~snMBê¹ƒíkC¦@æÞxûæ†p®¶Iš&gæt«k™Åü« )jJ“ÛšÄ ž”z_hõœRêÊüZDÀ4A)0QÙïÊýS#qøÖx±^#ð¨]YiÕ­g©f"¯\wvR$<ä¨7Ùx˜	IÁFW37¼÷Í­æìêãþ‰†½j³Fÿk´–?èÂŒ(>Z*n÷+œ©°æ[UJ·ÐKÖå»BæÙdo?Cvñ>«?Ø¸,ßKYõþ>\]"T+³ù„ÑŽ-.âª/“É[•Ýpzç ã)\UñôääÌ7çÉÎ MŒ*©qëõÑ^’km´ Æì±Â’dD\ºM7-V~ìb¹|ÏP†hšC5‡L! „žrõfIõ sû“¤¿2÷²˜êÁæj[ÿ)ÄwóVg:+v‰cÅV‰u•ºXföš¹"Õß?k~}€Ýfœ„“zÜÂñ¸çEŽÅcsÞl5Öí#{=Ø÷”õ³|Þ„i‹†¶ãäh?‰åžm3coTäáè+„¦ìªTßFâÅÀË¯K»8Î®êk’£ti7ÇbGF§£î?mg)ÏÊßqÁMgfM1*˜…óÝ-€ì>ÐV÷jÆÀ#k¤%1éÌ€ ¦IÐ÷ãQ0«‘ÝÈg²tÆÁœmèñ6ÍÁt~¥ª6²Dc…Žœ±™9›…ôß·¾7NF´ÿ¿ùãñÔcYÖ
¿ZŠ/Ê)P»õGY=?†vœ˜5j¢ø¯Rá…!9÷û#˜}èÆã…þ[}&“‰Åé Ôg5éð¬ì8^ä5^è k<×ïiÙmo‹3ì»±ìNŒóc>÷½>,à® '¬Ð.PU0€6Ò;ÔÿØé¼œÇïñ£ð|Iwâ¯vü¸ø¾\»œO;~þÄL_~·Ñ4.ÇˆOÎ°æû¾s“,òÖ~,´Níý<§v¹wêØÞoÌƒAêÜÞoø”ÜÒŽû°Í‹gcïúˆßwõH5mb9‚Â±Ù}ãY]×ò§õ,÷ÒÒšÁt6ÏYÌÂN¡wM)!0ê¾?‚uíG¸Øéü/ÿÊ›ÌÆ~£NHõÐ÷@HöÆÞô3½T6	/·ìnöçr¼Çr”ædSÛ‘”[©–m~÷3¬»0,{ÿ€Í4œ»“Ÿôò¤S)KsÛí³t—‰²™	ì›:ƒA®ŒCi5ó¦ëf­›Š³³î¤DJoò¡ÁSÙÆfæøGç¹1Í¬g9\úÞ¦GYn.e¹õ.Þ¹mÍy³e\fKû½
L<5Z8Dgámn¿8¦Ì9vû§:_à!a.â¨UDê“?Îó¶Í=Ys»frKüqìßµeØ£Hpæöãxãðô$.Bg$¼ì³nÄ’ì*í;/YßÆuß*Ã×q}5èåVº¾ÆCëÍ¶‹¿:ÏyŠ)E¡GñâY‚½ã3ñ˜šÑÎ²Ÿ®—c[Þ!‡Æ@eÛX™K—õUa4Z]G£‘nQÒH¤xÇq£¢¾*·"ŒË¹7q8Të“jÜKˆÕŒNÒ{¤¿E£¸Ùõt×]"ó|V]FõY  •ò-—ýÓþx‹CAV>ÛÉcÐËW„ÿ~é1UÃÈ [¥7ç(Å£Ê€Ü
¿×äžóxV×ÊÙ·¨ëáæÓe}Œê))Œ9¡hê©‹Xg€z!I%«gJìÊ4>Ç)èoéöSîfg1À~ý•líŽ|`à<Â(
I~öÿ’ÑöÍjž+s3³KMrŸ<ç‡AÀ»»ä.yã•9Cœní&w®+ÏŽ³d[Œ þ°ü	Ybžg”ËÙLøn}ì‡¯øqGÉÄÒ´>Ó#É2G;^±ù¦Ëzkeµœ3Í®7íûf8”7ñóâëiŸä±s¦›¢º›*¥¯v†ÆJ‹³³óƒÙlžhY½Jy\9#¹ËX¶€øI¢k'‡ç°‡ó¨ï+J¸ý„R¿ØTt:iø_R:ÝÔ¼X…†*½®^¨ó“'yY5¶¶%Ô40ÔÂÕñ»êå–mÞ¥@ý)t#.‡åÉWê¸$°"ŸaÕr*!yï³È.›Äâ4‰6³V^}Ž¬sX ¾p—òŠ'’Íg“èæîWB+’MCÔlÇ68¿Ç~ôŠ™íhð²%´¢-åvxyù7ò7I{=¯Ü,åÖ›¹ðÊµG©b“jZuŒFÆ~n’/^äì½˜O‚d‹Ïq,ƒ¥'!¹Äskýôô†±'‡ªY§Ã€TänžÄ âÏû}?ŽÑôqÝøäºzHú^Ò‘ªñ<6—-…c¿%Ã¨Zážxô×f¥†_œxãn¿û@M ìr ÂÜMR!¿aõÆÀõ†®u|K.‚)¨†nÆ¹H<8ûdZ÷çynÔÅûÕf	?\ Xw°21¿¬±Â!¯Ø¹ömÚþ¬ž¸é3¾›†	ªéá%šØÑ•Ô`Áôhˆ¹jYÍ<4XÀ½ck%óAË÷-ÏßBñÆítd1àþ‡;Ò‰Ü£ÉOÃõ1\»ÿt2¤Ïïçdè8íÐœíF6_Ä#EçsNÚ–œÐt˜2ö]qÜÍ*¬d×50–q®Bd¨GþeúÌ¾µ~$?Jq	yà' è™Œˆ¶{IU¹¸q/Æ¼}£“ãàçÇöl,%,ÔÕq¶`ÀPÇ9ßtûŽ]·Oí‡0ö=ÿÂ›“ªE‘BóªÅ•&£RøNŸ¡/o×0Ýâ•r†Çç|C:;zEL .`ñâ™µ¦Ö±k3ÔÜº$ßm±NAIuï†Ñ´VUÅ›Ûe÷6æ}Š±›¸Sž4mcVqîÙÅ­CëlvÆqHbD©¾b«°gá¦ˆ/Wº„'ð°è-#º1®ˆagaæ=%ãœ©päXbž¹FGì 8]á6òc\—þäÍM¹v6Ú¾¦‹ÿ92®ôž"šïtBû^Çœ
ó	®mkÄ²†ž,¾ˆÄR­¥{,+½ëâÐÃ-o:vA6YÑV0Å®	6qË¨lTKƒ “«š»¿[óx+‹Ëæ6ðh®„û6êC<¸¾‘ã#nœè±ŸUÏ¸Y”4–.Gw<‡ ™™'½úšyiµ‚rË-µCÐÏÈ1¤ ¿B]ð˜³0¨3/JÐ(ÇÇ·ë	#k—º¤ª«Ã’
wr£P}üJ9á±œ•èÍ¸ù/ò¼Ì¢ÎÆEç˜ÜÄb•¥Va÷AÔ¾rOüøÚÊõ$©×{‹ºNˆã'“^VÅM«~†aÛ5@;IC£Þ´œV¨§¿¶‹µùÐ§n~ÌW¦§q½ðªBè7f×H¼5ƒ5çÄÒòôÔ­Ž·º¼Ð-Åjþé,ÿÐÃáÅN¡ƒ>¿heDQ¢'•O¢²›Ò5P¢×—+qÖ«¥V\ntòÜäžofÅÞäÞð1¦UÙA:E‹üm'q5/|Ú´´bÐs‚R=ãò2¹qô“7o·9¾œÈ¿Œh÷¹£4EèC³f"(±¨Ü¯R—êT6õÅ¶u ÔZ‘]–UxbÅ.Ië×$ÜæÊ*iÑä»'î.»\Ïö¨Ù†GÞ¾NÂ=ç€ø`¶„7RÜ¡ºðœ.›äøèðïÂ«]I¢ ´’»³tk>¹N¶:¥ŽÞ
9~®÷¹Ç‘^[-s›ƒôŽ7:(˜E·:ðÃ]É­ûÊ%‡wœø˜>åTS¿Á`˜ð¥¦4ªÞå¹,‰Ø\ÌÌ`º£ß/_f¶±Üìpr–nrüp†¹õËäâFÁ¤¬8œøìB¿–ñª‘„‡á%Šý*ãûFcZ!#+IñàL ow,ÏÊ¶€¬îzF†úÎWa( ÷½C!)‡Š\\ä_¡õs®ÇÐ
®Èà§Ô5ü<ÒUüüäq÷àqnÞ–s“&o>rôþt•ÒÂa'ÒFF™ø›ä<¤
Õß¤`oÂž™Z„{ÇÔû=øIÖùÒ«){Aÿ†ÑužR—çÌ˜w×,G°¥6Ê]”ßIÁ9g1Ù˜nÇÜ–ì¨Qs¥ûß¹gh¡TB“‰ü/s˜!×üÈl SÒéÎ×ÔE€’°k+P©€²¥¿Ø„Çy\ã…nÛg‘½ÂDˆ@í‚^¾ÏvlÖsõ*O2&“òÊ#Å>šMJ…óÑrJ±OžšP¬$X5íÆZÀ&$¦K.˜r´„O¼$èS®žÏ}ÔÐÓ—ù<…›`ØòÌÜ‘;îüÜ›q>fHÚ~ÉkúœO9C²à§P¯áŽ®ÖÈ,yzÍ¿6c)KßÊT ¥¥ØÉ£…±W¸@ß:L™Æî4‡‰c¯p'€"bŒ»Æ@z˜Ð1ŽÆï>ÆÒìC†¡ÍçÊÁa³¨¨yá‚å‹dK©pØ[ç*ÔÁ1ÉÔv…MÖ…½½dô¿1lÀšóûîÊúzÚFÈ ’pš{;­PbõE6öø ›zç†~}ƒhb±``N{Îž·EÞu}ªStYô“*ß é[°þÓvaF¤yE¬Y%j$7Ä6èÐXM¿¼DkÙn5}à'õ0²…‚é@ùT§§ßó,#9n–sy“ýeÛÂ]xÖ-	üð‡šÔ~ž8?Fóó„äç	ÉÏ’Ÿ'$ÿÊ<î‡8!É·wý»¼ž\´Éw9i«.'kÉÒ{"9¸.$?f Ê-w°ó‰[ŽŒ‚4Ê¢åHarÌ¦W;5Jä«à)[»ìž0…C²®G@IFH7DÓ‹›j@Íá×X{†‡&FL¹“­W9Viwx&^â{M|÷¶ü“ŸÂÂ	ÀÃ-”4ÿìw:ýìç1ûÂžôg¤€ÎÉÉáAwïG  
Ÿ#qlú$¥ñà‡ ‚Îl6rÌI?0œtw:‡ÿõc‚'†^5Ì(þLÉ€þú!h€[ü‚ÜƒŠ=eL?"wS‘Ž/.hšós?šÄÅÎÞÖP­"J#½Cty³|?é›÷Ùa5;‘N ó·,·M˜Y.dƒ cÀÃûËÙ…Ú¸Ó2[^Ñ=ƒr÷OÊ¬qþ¡›R„#ËA?eÙÿ,u0ý(U	7˜8,qïCÜ3R¨0ý˜\LîS '.$8¶„úÃ ÜOÒO©¨…¥a’B­ÖˆIUq%ÕÒ°Êu£á™‰‹¨-Ìs€†¾37—V™ªÂ)±_uîÙ·âÚüSâÎ)·òŠE:ýäOn®À-ºq‘Ë[™ƒa^ß¥¸ÑÜ¥PïÐV2õEV[¡kiÈ$V%Þ0«#’°§Sh¤+ëJlÂõTØÊ·•Ñ_xì™?!UÆR[äWÒÎµ–¢Àï=ËThÿœåôÓžäY^…Y^»ï,ç2Š‡Öï¢4J®¶ë8–Þ_»û¡¹ÑPu!Ûî´ôVœyQìLÓµõ_õ„ý\ËJXÐSIö -‘HdL»¶Z[«­×žÕž×6j/j­f­Õª	×Ö)Ò„r4M¦·œná[Ú×Ó·ü‹0u¦û}$1YA'µAmâÊ¹ÛL©JëfŒqâÏ`-w‘I0Å9v¾7}lV9ÅeF1‡;¼çÓWWxÎÓ‡ù>óxÌ³íÀ['•wäé†&§B¨6Y;‚1eãáüizIÊän+r6
nŽUœ2Çß‘}GY9‰¢­×–sâ€ÛÞèÉ“¼øÞ®t8ÖG.FÀbŸôÆaÿ3Ì ˆ©%{AœDèÈ«Yv§ÏÎ?ýZåÑ3øë>æâ}‹;êðœáÚnUÕíÜ™E(>ä;ü•¿EABÅLÑ•ŸÂ“s…Eæ”y–ˆD¼Àµ“edáŒ]Úšnšeí¾wd	,³†!~^£R9b¬ž3«7)JaÊ>n7À\Eú¦Õ?Â	Ç öß‹^EDì{ÑkVûÏA¯âj‚ÍŽ¶þGSl'Žý8Æ ˆß‹`Ehö{lßýÏA°™åµ$¹¦fÜÇ%Ö¼WO’úº-
xY%ãæSª¥*éauùdŸŒ?Š¸&¿…Šß‚P¨îŽ!ÃŠº¡Œ°‰ó{È¢ýÙ*ÊñcÉiÔ&#iÌ”Ð
ú¦7]ŸÍÇ±¯ANAÍsÓï_ß|2¸Nž©XÌ=¢»Pà³àÏ‹³)‡‰7Þ$‹pû—+Ðm*Â{×¥ê»92Vüe9ÇññÎ9rv>÷Ý¹6D”íˆäçŸ,¶~—‹Ô¬Çj^Y5² ™qï›IãF9i\v;G*¤|Ës	„Æ4v©¡Y6
].BÔ¹ ^‘'ÐuÒ:û»»Ø&©V«êzDÉ½«°ª.Kõqº:Ùc¾F©Ø—úµ›ø©(;1SjØÒe¤.R[mæç½(“˜Ã)û
£3¯×Ò¤¨Æ§W2ÎmÜòô'ãy¬<,cžfª\Œì½y‰Zé±¶¸ œÆ¨ñé6g&1{ú7$&õéæý ÕœŸj*Œ+[˜ïRâ®&³^gq„]éÚŒgsbSC6é÷(¼ÄïV’Éx`Ö+-p_¹¤ÐºxÐk]Ö7@IÚPr€šþÈfÒå’÷¥ìœã=è‡"»Bë™¡2Ù’ÃØˆi´Z.Î¨ Ù ÕÝ,¾¤#öÖÊhÕè¾Lœ5!Ôrpm0e’¦Ø?Œ® fx3+ù¤ôO2úA‚#Ã²Ã›…‰¬l¾r{T"—m•pº¶Ø62Ï:z†µi×ùi«cqÕ“³>ÚÄ>õ¬2YjX
è+U4NM†î‘˜ï€Ñï¥Ðü­$<à…–àW E¨Ç›ÐDe§íP¬åÄ'È?%Õ¿.—®Ûgó­ÒUÚ¢J»t•UQeµt•5Qe­t•uQe½t•g¢Ê³ÒUž‹*ÏKWÙU6JWy!ª¼(?•©ŸE«Y¾RF -òÿÿÿoùŠ)´ÚyíÇâ¶ýßwe’èŒs?‰-Ü…Efõ~rÈÒ’;Ÿ—grÔ¯s!Gk,Äâh…8­ádp,ü%0ö„ñ]ò¨•èG&‰f\de,Õ°¯â†ydgÁýiÆ[)Üºˆ²!žx{E>=½ÑJÝ2“Û'³ô&–ÎéóÃ³YÚ;…—ÓOZs·êuþ é•ÚOçN)ÍÞqÅ’«ð„-Ï›_GŒL+ê&'ÁM‚åÀ€™ûý‹ÔL†©Œ¼(Ô“`Z¿¬¿ßh¢®+¦ÉÈ÷ÊQô?_“$œÑÔŽ«*¥d† ñMPÅŠ%ñÈV),Ë¹)TiÓ–²èBM0þ	vÈVb·mX1l¤·|·V’ÑcwÅ.?~?<&ßcw¤®t*ÿ¿u§ÔyÍÞ©-FÌã’†í P,îÇê—$A2†¹w
>sÿÊÎßþöçC€#9 s/–@:9ÿN Qéš3§ wä#Y‰…r"Ö‡…	µ<ŒtyOy´Î·{áàZ$ô[¿&ü‹rJbÏER(™í1‰¶tÅc#áø$ä¶ŒÉWfjÅW°CÁ¤æ4$‰ùò<ÞX¾µ!¿åºÒ’o½ÉÏJ¼!‹8¼à6ˆ¼x¤gJo%»È„I÷ò¾oÁ?`Æž™9r™G€C+´;N„’n6;®—žåuÍÌòš¹‡kJ–¹¦/bÃbÈ<
³hè™Ó•3–÷Y”7.‹ŒÆŒö–æá	#âï„­©c_À>HÎÐc†v¿cTàœó×d`a´OqEÂ‹6¦Ào*V½éÑýkÕk0rdg^uRíÉÒ s4˜Š#j‡"¸–Ó²éÇ[°6Wmùài¨Z[HVî^“Ö”ˆ
fs|Âk;éx².÷‰»}Šîk.Ï÷ ¥”vykÞå¡]µ¢² ª¦´UV›@ì<`såì†AÊÅÝDÃ¿,ç…‚ÑD3àÝx6—Ó»­óüø#šÓ”r5íò.=º^Ž…¦cPa·rØ„,L‚ÔýÍ[r¶Sàõr“;—wõH‘ÚU®˜ã­å¹B±(ß„uqË4®.ðtÚW6rœr¼ñ{Ö15þ;¦Õ¥±!—Å×]"m=$r 5sÝrd²Kq"2>$ÛÌ5Jåƒ.g&ØÏ4]O°Ã–b%‘£Mks_äÀÏÈV˜âFMfÈ)°ì	OoÌRî{ð?~mâôy>rÄxíºŒ·üN—ò|“,ÕÌén8Z(8í}ðé^l«Úñ:óðOû˜'ˆmIÞ·Ö)§¦ÔºÏo åñ÷j™!Ðã‰À°@qYÄE±Ãœ	U•Ü§T—avEÈT>Kùa3Ø­»¤O¶‰&uóÂè¨¶AéRóaà  ^Á=VhÂû’´u•›0g¹šŸ
%×åÓEÇ®t#A²…L ]ëéE¨¿|vðÓ{1Nð3oå;òFÕªv7¶H-gøÂpZŸƒÁ8/³nñA²°ø°A§û$Î¼~À¾†m'ëló)žRÿ.<á•/SõE© V7ÔãpLqác¬*(:Lñ@wÍÕ'Ox¬ ßáÉ+ÎÐÇÕÊ\ñTžo$Q0©.—deÖÒeB>çúþfŸ…#M‰Û5Øa‘ FW¸yV3;B¹šñ»pàÑÒUQéÖ*¯¤8C¦Gí™¿£*}k:4µ‘Ú<f¾Åî‡’ÎYè£ËH^Ø‚11cº¡á€Š˜çFuŒ&À…4j¦ì· åæ+Ê´…mµ…Käjî-^CçxŠù¢esÿ($—;Œ¿`ÜÅÛ:V¦8ÄOîÞ1—ï|ÇµN÷ £‰Ï‰d‘ÅûË^ðQ¡z×ªp	Š»X½ +§þ$üšfÉÊ¯T¸BÎ#/=ö¢bü¨¼ üÑBÚ®ÍXŽÁ÷uû¹îBäT×êªápAßž~æô#½K¿Â:¸ýå¶‹Ù=~÷î÷£ƒÝÎùÁñÑGøur|Ô=:?ƒ½ÍûJWd•!»ád{Ü>K·U#•w^/ˆ½éü5ÄŸ½ø^|xùË/°5¤ŒŒ§ˆ9õ1GØ®¨P¬ÞàŠ“ù€/Äï^ö=MÕö[ú°jðµïA¥ò"ü¼†Õþ#ð/1f¤7f…†4[íÑ|BM`¬èkš€úåv“ÈÝo’3xhhS¬÷dØ6	cK_Ã` ÃùjSBY^xÑÃ±ïMMˆá»h,ž•ÿå–…´dóö~û{~Ü‚™HûºJµßmo>  ÊY¬ªJ‘A¹¡ˆcJ.Zçá*+öX‚²EgåhÂÉ³$‚BY’y÷¯ðúªÒ+J•ÊK©*j¥7™EKÈ§qUª+ïÿŸfýÅ‡B¥"6¿|“‹u1—Êü¾µMV±Àm¼7áø •¥‘!fO_x1‹ÒúE Y‹JñšPo{™¾}¢L¢¥À	«1›÷ÆA<bþÖ¯ï¿h:Atè8$€A ó§õvý1Æõ©Ò¡¥¤AÃ}f¿8}¾Jé³`XKKÙ D]ÃþÄjRÎc›E[ÍµÌX.hTvêŠÑåVÆ¹<y´[KG¥÷dòm™ô[êÓqö?ãü5á*LegŸ	QÖDQÆX¨¨8Ž”1wLYÀf¶²y«y²™4¸QÉòÅîà‰ªè
[yCbJÝ\ø¤‡vœ.À»ú‰Ö¡Ï`[¾Õ,o·*Fh!yT
9ßâŸt	@7@…úwEuì¢Ea¿éQKL@pwšŽ‡WÜZÒ&VeÞ—ÐuµUIS	¥ü°ß ÔÍ¹ŽòÎKFPáªÚhÐ2 W—÷KÅ¢³ÂßO…DDé‘Âã&;BšUÖ”dÊ€CÛ”È¤~ô)ìÚsä¸?©÷Ö÷è³ô§vLÅÍN$F&Ìú iœú¬|Ùz{þîp/øÚûè¬µSEÓ½ÜÙÈ‹w9ÙýQÁ,@)wOg2-/'Ðbý»MRk
gÙcË\›…ä	?1¨‡Â­†‡Å~¼áœí¿øØ9?ïíuŽv»A9==èžåJ¿6ÁÎXë°zÌjS…÷?æSµÛÿ˜¯ñßÎ|Â¿ù3)~÷“=‚­“x¼ç÷ÓïÿáMç^DÙ÷{‘øþÔÒ–gQ0®¤Í9VSh(‹¨Nj$\iû^Øú°ßÛd©µ”miqèb¥Ó±®©!ÐWV² lôRÎ„;˜&!YcLj“¬Öñ¿¶Tjƒ+ÔÀ^,§=¯I=Û\*ø,+¸š[p5+Ø–
Z¢¥ç‚¿*À_«¯ÕWíÀo”…iÍSú-ýÂgM“BµI&5éÓØð¯üô³å²æSÉ·,Ë9F¥Ìbð=(”>¹®¨‹_öæ«ÌðäR×Ž¾#ï ¼Lâµ^E_ËE{–¢8_¬M‰ÿu¦•ÓçuöT[a“¼Ôxu|@ÐùB}ŒÉô8S‹ôŒ"|z–¥Œ€b¬|öûz1ïŒ¸´§-­¥eiß$ÊQÚøôô†7tû¿Jun?qRvªOGLmº@?t³Üm“œú}À—²5¾åØz7·™Räâ¶Š²iº£®×1ôeëäcV™ƒ
Ð½çâE^Ø0ˆ÷PU†~cà]S…¦ùRe*qBÃþŒô¼8è³)¤=aò@âãž×ÿ¬±”'Ø´1Ë–‰ý¹€[ë’ç”
M¹&W™R¾åì Ïþ€zÉo§Û>ò
æ
ù¶ÔKÑÕÄæQiæ¸[Ÿ¯þà¼Jç4*Óæ~aœÚŸuDJ3ÞÛS‚i§CªŠ‘Ãpô3½aËî¡Ø¿LœÐô>ÌÊ™?àŸ·ÁpD˜jHªé]Ó_I‹·§{3Ã>ÀÒ"ëz P:".½¼ÅÕš˜.ï¸Ø§pYåaËÚäj1v{í-ë|Ô£®Ÿqˆkw7œ ­¸>\Öz³<Aô,çEºOïa‚ç<iY¼  ©‹ä}z÷¥ŽQ>ñ 	«%¼Ðß*¤©¦Äd‚=†S Tº{
QF’.c—•+ú}6l:óü´ß×ŽIy³ËV¨fQØ÷cXT„‰'O7BN0!67D"V>¼—;)ŸUheÛDÃ‚Ê¶eXÞ` œ;È~+Ø}c6GU™•',9°7´TÃ%}êÏñ6!> o)çíc¯1låMcžÔ'!´æhÁ¬ô—Dªú%‡íš¬«é*æ“	ˆ]´é×U„@À¦†Œ“§ÃNóŒ2zá‹M9÷DÁlBÍ þ¹'¡P Ž}©–a!&rHnYªð¯éâøQ â2[¢OWwÏýÉ-^H¹¼Vå¦mîAON}f´!‡@-‘×¿ÎÞîã`LÃìIw:DÃlö í+þh£«³_gý cÉ¯?{=o{Ù£Nä!’o
]Î§Þ”T;'Ëy¤w'€ƒ9£H{Px8ófÐ[â…¤ÚO–ñB—ÍPRœÇV–ŠÄRgoÂp ëa:Å‹%ˆÂSê³N¡í„ê»Ó]iø3ûU:ÜÄƒøðü5ÔÍGÞµ<þî‰Ó¹ßMÃq8¼æ“
2;! iO¤z~Ø]^¨ŠTø°+Ídç¤û–y
î˜²¾ÆÑÂËDønŽz"vÔ‰‰hNF×ðÂKpb¡·¾7–©‰V—é"¿é7oT&ÇÏ†”.o®aåŠúGY‡)ëHøêl(q¶%“ßa.†aU¦ð†?HT=a:Z—¿£s¼$.y{ÔÖnÄ¶^j^à1º"Ñ­ú‰Äëò;@¬B‚—ýÓ|Ù?Õ‚ji+œè5¤ãcCy2÷OÞnj©.£‹ˆ§ï8ÄÞ"Û
çAüÒ€«W®Þ"pÙ
—…KØã`u¡$Ò¤ÒŠMÉøTŠs¨Xj½eÛ2¥Ú•(¡;²è½Øu4­1]U#2)Ûõ6]sS^¥’_?WÎè#M;£«8OçRµ.mŒR9«ž¡[ùîÈÅlô¹Èç+¿ÜËü˜1@÷Ò—å¢LÀ]W™Qn¨HÁÑ!7@âó1MÿMÝ§ØnËhÿÇ[4Ã‹[%ÆF›ôŽ§ L«©ÃÍ§'‘:“=–ŠñK1†QÝ¯3Ì±ÔSƒº&ôÖdÙ¿N|ü XmÛµübs§Rqæú™˜ó/šbè¶vÞjè'Pr/» •¾e· ^ÚWxŽ¯ c]h¿,ëÞ_ŽÐcxŠº®Xkôm¶ðl[ub_xú‚.G¯J­ß˜V¾DLŸ}fdNë¢‚P€r«b]¥c7‘¥4•CQ2=Ywù‹Ó’FAÚ¶ï¢H–N ©;M¢kæUƒ¶AR}WøÅdnäŸd‰za,içƒ´R#IÍOZÃƒaÖà@àsµ˜kPø–“M©‚c)Ä U¬¾Nð˜¸U7X™~±õFÙÊ¤x3ªÓÓÆ>Eä²¦—EBß5ð>¬¤¨r}»:T|±†h™m.Sê>`«€4M-Kó‰¬/²¡5"¶M>èÀ™ƒTOéÃ#¿`šMƒqOøH¼ü 5j?>N™–2±ªÐ,c
R¨Ör¾ :“Pb:ä“Ø`µõùãŒT9!irßŸ”A Ž9GÍè?Åí¯ðwHDt¯ó¬ÁîöÐ”wÐTtÙZá´M‡@©ZaZìy-ãL;)-¦~Z¢ƒ\€Ò‚ÑêØ]!ã¥Ò,1cú\íGäfõhä"=h 8ªùyž²h1—¸¼T*²_·u”¡—ní¯)ç{e{³IZtMØ°õÛ¶<Ä's¥0Ã”™‹s_iñgwè5jiÙz\‘jà„,9±½àÚa8©ÔžøeñA‡ˆI›4'ª´³ôçâì…ýÙ‹þ.ÑÌ/.×1NZèš·è%´çÅ×Ó>Qïz°{ÀŠ—¦eàÊ˜, ]cÇGËÆÌÃ²6ªþ²b¨Š_ ð—¹]W³ú5r9ò#¿ZÝ£cÄövE÷^:°žh[gSoB<Ñô.½€*3€Ä¸úEEO”âØê%×¶³ðAØÇBÖ´<ß7?¼4*Ä2šyíÆ ~V)¢NqUÔv+ŠO^5kºÅŽ/ø¡,õ7ö¤Ré”È—"·Éi'£ôe•Ò…l6ƒ>õý«úQ¤«PáØoÀã0ªVºø#[ºÁaãD,n-`]M³e?5:¯¦n:õh^þÝÍÙºcß•5·äAÒ¢çCœÐÛÓÁÒN•>–¢ÎQç!"ux}Û1¼ÆúëÆEN@¡g"h3u&A «k$`ÁšP§ZËš;s&Î8üL/@3ÌòÎÞ·j¤ýAm@X­o3Ï,¥!¤ÑP•¥ƒ×[JuÍ+„÷
¯ˆ¡Ø4ŠtãQS½fêe”~â 7ö3¯‹L+pá—çEázDõÕ¡ñ~©…[Úøgÿ¬-} á >þP
»ZWiaVk¤ú>…JÅjê§uµ\„_»/§¡3É=gb¾1¢· Ä$ÙL§Ìá•¹ÁÐX¿y“6£J›¿ì«¤J¹¡H«0Flxï¼gÃ¤~Kh	t¼§.F˜•uF“²À&»Y#^Í
g¨½`w^P¼ðÒ¬–xNÕÉSL©©*BÂ	’Ì ÷ý¦ÌM‡½&·Zs¢îƒ¶é×÷HŒÙ…,sç_p¦)-!ËÕ—œK/æMz‹nW@°ój$1I"¦Áä_
1o¦m§W"q•)˜o`p7½Ø\mÙvˆîªÒ;w1ßR1xôM”mÛ¦b¼~qøW3_„¢·ó<äÿ5båÝÈûøk‡„ppA½W&dX•<ÆgÔ£`åHªÊŠ]ÁÅ²y×P~8v¤(7öD¢¤e‡UIiªpg)íüìº æ&òeI5°7- Û"6xeHõ]¹	Ú´¾7,¸8\ 8è5ÇZcrÃ”~+‡––ÑhÅ¯²dURUêâ&,Rh±:Ûþ’­R(FÉß`ákÖyÜãõ<ˆðê®#x%†§Îõbê …ÆŸ•SâEŸ…á°êåù6™àDq³“ÈŠe*ï¾¨GjÂü.ÝÁÔîõ}1vL}-šÖÃp¿6U¼]ùþ,ñZKTH--!â–wÿÚÝ“¼ø-a'GçÇè¡qr=7Ññþß&Ùh¬Ï’—dÄSòb¼«—FÈû¨È®ðo’ÖìŠÀöëßšôó´%šZ„wÏ vYî’7Œ—æ^t9R²a±H7É¿]l\xý—<~ Æ«Ù$ìFãKrPIß@ ÈW?JÐ…DbQm^òœOo¾Üš×ï zËÚYÎ^òÓeö–x;4ÉÝ¿½XóV{K·JŸÞðy4ÀT/Ð§žÞ’WYJï’3tFêYg
 AÒÎ;aéU)4›Îî¢>27½¶Åû…^^y}}NU—BG{ü+šúY¶ÜÉ{ŸjÎ¸}¬ZŸ‹Ô“­¬G	³DG™²h²;¸Û¾£­ÓkµAUÀW†<g@Yët¢3µœvwO÷ô”RBŠí
ª©uúDËZaaž.`Û:j]¬_¼°­:K–‰Ñ"«b„¼<1iFº8[-Fßô~—-LüÓ›cfµ=;Væˆ{ö°'ÌÐ¾£°¬\%^£Ý®<½Qf™Îñmå^ÃÜF`ríbí™¿ž1ìãÖ6²OË<©Œô¾(0Y&ÚoûÍÿkŒêÎÏ;‡&–èøš(Ë ‡Š*;v’q2$•tçi§•À;²ki?Š†wÆÄªM¼¦¬úïýx´aÃªN	–,	[FHkî‚…êš]À0•Ì,Ämª{Þul‹<sZXN-ä,ZGÁì?Teµ+&pºq¨Û&¿xdÀ™',or
¸1(à-RDÒ`Ä‡ï¡>=Þã<f÷Ö–h^fÙÆ´6¯Ÿt o@¢ÔcÐèìG¢ÑNïO@¢Cé£Q¨“ÿrÔè• F#°™Ö,Ûáéþ¼ß~/‚ZPÍ³ö˜¸¦íæjÏlÌ‘O›ÞäªÅ3Éî (•\HÃ{ XJ§—çÎþŽ‰¸ì@öVB¹2ÊáÆ†z#r‹î¨•Íò8†xìG|7-fCF›|&za’„°nµiòô¬«V¾%ä-ŠU³ù——DÌ
f}©g*Ü$â›Ù§aÈ‘·r£nk<4O8Ûtlü%%
jX†
¯ÓfcðÏô8“Wn“!‰£>n÷ÒÙ./µ¬Ð9HìGH·š˜[q3M¼`ú.}Âèÿò´I¤øœ™ÀlÜÂä>^ÿ{)\¤6•Øðª)	†¹×=éî‘Ãã7ÇŒ$µL¹+çŽ[A>¾¹/î3ùÙ›?#öÏvß–G¿ÊÊÍp”ö¼p€Î mŠ‰þ6³„( Û©OCéõQ¹€9á•Î&ÎáÑR·­U£×dÕîNSÝòVŸ­£r³çÏ¼(¡&i #½šW€ZamnÜ<ò‡x³9ùÑJ§rK~íÍÇã—¿Ç<}±R¦$¦ZcŠ¾ õÒc¡3Ñ‹/BRStf¢UQ"{èBè›‹,C¶že¢‡±	’?ò±:HTÇ¸´´>ö~•§7éÃ2
ƒîÍc¦)<çöÔ–pÏaß‚'½xèC0–*©ží¿X¶Kr5‘³Kw˜ðÛ/V{²êÒÌx¤upôóèB;_!rIlÑb*ë³Qû-n rIYkFR°•J»i
•ÔFú|}ý*Í‡§G›¹b¬D‡j&kµÓ$]gü¾É8šJû£ÿWÜ—ø'Í_“Ïí¿¶ð{Ôy×}`ç¬~÷ˆdš¥6áabÙö}ùOŠÓÎ›‡F©oip¢¡ÿç¦Á³î~gL¶õçFå›ÓÎ^—üJÎ02ÐñC³ÎEÑZ-¸H¯TþŠ!ã¢!hŠþ”eQ£®S™–£¤R#uéOîy·™zT’f[ƒ¿w;§ß„XMK ²¶Qô¡O¦ƒÀ	2›6èX	©¾Ý
~×æ ó’9èZ4r£a÷Ê¦A36ðšéàœ—Í±€”²ôXí„nÞÄ†²ÕX]—ÔI¦¿É
×,çàr&uÖ9»uot˜Yx³íî€`*Nè˜kJjá¬3­~ÜŠÎS[10/‰GáeLwr^vr	‹Ø2îu8H„S4òb€P0…},õv›bzÐŠiÀŸÈ‡ð¿K“ÿBO+˜ÊFrûJÝ{å@Ýà úÂŸšì‡õÀAˆç ~øq '!ù</É{òzá<‘à}]ŒFî^ÓÉÎÅÌ˜MÉr–’Îº6•ªâ\ŠŸHK\˜UžPÚl{6Ï S;›´¶U1ãŽ¨ÕÖ¬:mµž™N[h×IùºÇ"¿+ûPý[³ŒùAŒ¯‚¬oíKÊ"ný1=ó æëË@Ãš{¦6÷líùÚ6W=PƒïIÀla4opdƒV6tR¡'î•þ	,½+E·_œÜŒ»R?>½q`éHV(yôƒ™7þ¾”'k© `ëqÐgñäÍdS 8Y")ªIå6IßÖí&%Ø3óº.¸x†úÅtò°œº—ÛÓL=µ¢xø2gÇÛ¿HÆ¢UÁ/¶ìÄâi·m¥¬¢ÙµÇ‹ÝNª¶Q_`Ã8oƒB·ÒqàUªZµ¹½ªË^c¹öú%#ã¯5iÔ#-Sy-­®®µÖ%¼/º	Õ\9œ²J(È0½W2åÚŠðE·‹ó{ÐäÁáj³n¡v©jºvºaåR˜–.AîšÚ–=‡¥,¹,'8”Dì+•_§½xö’ç2‰¤°÷ò½—Ó}Ÿ•Bh#ºmÐÃeÄnL½ÜšºøãXÒ­ÙxÏ3cY×±:-æžQZtÐvt2HÕãl‚}î£9—e“ŠÖp¿S4ÓºQ¨=çY<Ê«¸ÿ’ÿ@íA¹zìÌNE¢Òæ‰´¡inj»„XÉ1ØrWx};Ó²XØ”ï¢spCÅÏ¼© `àú,¶ƒï$2É¨%ØõóM–éÒþ!EÙºU9NHëýä„ä_’²|§zã$ègÖRrNi]ò.Ä›zƒ(œ…szs—lãu{Å
ÄSEùO½‚q»<vÅ|I0*tŒ<žc”ZËíA73^F¾É'u€W¸yMrù6 yÍo°ÇØcmüZµ´`Ü~ðØ±´2ïŠðAKÿÂ›1¶âH7´4§Ã%%BgM¿½ÈÂÞÊ±þDºÄíZH$Qƒ©ó’å1ä…³¤<Í%[´ei0¬Ýpl°{ìU}ÖYvÊVµÚ»#¿	~1`"*K¾ä‘¢ÃÒ¥°ÚNóhnŒoéH£’Ý,…ó™‘R‹ÁEÐK¯±cŒ,×öØfÈ3¼©Žï³¼Y‚WšŽ&k–?Vë[ÓÙ¤Þ¿â‹9I§xxc{—^lï÷k„‡…³'¯QWa)„J¶ØôyÕ"õrªžGÎÈP®MÃ¡šê]Ä¿÷¿º*ÑÔo4t›elïñm´0"EÈ+ a¤º´¯ei¸-s!d‘Æû}¼|ÿwÁ+W°F€7wyGé4²0—/õÏÅi4.>ÓP^L‰‚^šÞ¦ÙUù[k¨C~ñ¸êœîGU+âåèqžY8Dxyèõ/ Ýã	žÓ’võÂh_ÍÓ¤¶Ôá	Ÿ\¥qGÌ•üKj«gRB§;´œ%VR›©lóI–íÊ>x<Ê-²6+*ÑÉ]jõLÖb7ÐO©ûß]Žê¦ÒêL,ýFÚ¹w§oRt‚ØpÄv(r@µÎrÿ×—ZÿÅ4èº$±Y/ˆíRQ¯ÝZxcØrÆÿl™AÛÎÂm³ðª³ðªYxÍ¦&Øk¯¡c •Å›²°I£Û”hªUBÿ%•-Ÿ<ûÐ8³’š´ÃÂAMBzîN(`9o€# Ð0q?ŒDâø¯ÞXM4ŸäB«(	–´ðªáŽ“ý¸‚ìWêyˆ·¶œïy­±ø.¹MÌ”wÌ.÷mËe}©2ŠÜÚÀ†bRÒOðbŒ•¼Éâw¨°³Ì4´·®<è¤…—¯‡»ÈiŒ¹		€WäÓB4>É•7Y>Ý¿6¬íhEM 7_>)ñF¬¼^âíOo²QÜšn.Ws5õ7_s/¯ˆàbÅdn~Ÿ¤‘ÑÈXTÏ’œ i=™U[Æ:y¸¡;®µZ™OõKe‚åF«yRÙAbZºð€d,ÖóT Hl, ÒÚ*ÈëÊ¾ôíÅB¢l¸.u:î9nL´.Ú™é¥ç·Ú«ý"c”ÅÅ—Z/^é!6zÑÊŽb¿,¸B6E§õ±Å”æOÜ”NÚeÃÇ«|«Fj¸À_‚Õáy9uæ4š<~NéÑ=ýž “d/IOÞSã©Ag-æáÖYû‡YgmT§[gíŸëìç:ûþëL5l_g«?Ì:[ÅÈbëlõç:û¹Î{•^h@‹êž¹hí­ý0koöñkO3À`õÕ¸ös5þ\±Ó¯++„Ìf.qÝ'´]7,O)
îy4£Ëº°Üð¿b’’¯Xâ«žEDî‹4ø½Tä*õ?ê².î¦²Ã¬8:ž¥õ¦:kÚÔ»XpwÀ–•fÌ¤¬Î0Á sØÜwƒ-ˆbÿbpÁ† Û ×§òQÈ®b,PuQò Öê‚ü‘Öˆe ”/L'^Ìx	-µMž¯¿üfÛMçŒCF£>¯=ßXÎ¢>÷^´ú­þÒ-"–•:éœu÷h¡ýÎÁ!|5èé»Ñ£<H‘Íx@jRvqšàx¡³ýì\WlãÔ7=vÅg6WƒŒDúâÌÆÌÊuÕs¹V;·VÛQk5·Öª£çÀvúî®¾¦áàÇÒ4€³€š#S>ó…ÝšG ÆÓâ“üØO?¡™]—=‘[¶œ„¸šwœˆˆ×w;‘`)w2bƒ®Ä	‰­šå¤„Sr\—8Rph³ºº¢Åh|.„©¬ÁÊÕ™¹*E(JœöC1¹w1€¦uîM¢ºÀ«}çiƒI+·ˆÓ*üÝâ2?BLÓ!¦ùî»!Äe¿+ƒ‡²±Ø‘dÚY¾’\†’‡šzØ÷kžëwÒ mŽ¬Jò‘7'ÂS‘{˜z5Å  f¼ÓSð’3Rçë9çÚòg‚zï}âl9–|ÛÂB»&ÞoiPÈ^,ÙîR^Ó*qI›8i²5½ënú–†Z…š¿#Çþè2qdˆ0c¢}ÐŸÞÈSf÷µ ¶­!×.VeÁ†öûL¬u"ý5ÿ™´Ü^´z­ž5£Œ‹Ÿ³z«.ÿå‡…Ìç‘9Ú/ŠÈÁ]éÙÌ›îC–\ÞT”0.Z*v6I[´”ëÈ›ï¿;xáÓŽ‚Ë[úÅ¶oàíõ¦{Ô=í’ÎðÏ›®£Dó-VpWæœH¿L÷ôF"(At²w¯réêC—é]š4ïòÓk:}@p¢L-Ÿ³·éÕÛÔ¦ ¼ZHß`)£ÓÊ›–ž"1(MZ”„3ÓÀ¸&$h‹Þ'³Åc³‡ƒ9ížŸž“ã#rØíœ½!'§ÇoN»gg¤s´Gœ½ëÛ"Ãä¥)3“”å“¸É«Ù-q_1>5®¼Pr%#‹´^xP¼Dä¶Nä{fÞ¥§7*Ñ¥ÉÎŽæÖ|g÷€ïfÍ¾Ù9)ë€hInåLnôÀ ¯/:=§¤'¡T-³$ÁzXŸ5…ÚèWNÕ…e&æ.©‹%Ì\^»ÁªðÏýùxÌ¶rxd1é¯)û¤ùWÃ(€áÒ«ò
#º„—Øá^Ø—9Ð9ÒÕd<7Ãí¥y4ÝŒû#n\(£0/ÀÏd3¼¸ú>ÿgIµu³ê—%ª#¶ÊÛK£$™m®¬\^^6.Wa4\9?]9íîÖÀµæRŠÇ?ñH„·(“íÊ<¹¨o(¼¹éÎÙþ%Zù¡7Ä}o†´FdžÔëïa4L|2‰Còâƒô@U¦ÿr1c0~f/7QŠÐ+ÌÉÖ
ÿ¥ù¯0œì´šM,@¿ëöÂ£09†=Ë¸ê~½F–ŠB†.@¶V·ž¼÷§ƒàâC½.=¤+KnïÍÐR ZSo¿x>™v«9™¨F@UkÕ%ê®,Ð¬æqí›µ`jþu]@``ñ F­>ÂtØõf
º«\ýZE*P/¼I0¾}øY/
–jd©Þ¾Ä [ë@Á…~œÅXgŽöñ½Ô€äüS{îŽ³¯U ÷9Hê3$xV²îþ{ƒvà_yýÄ5lÊæ@¾Óú0†®b@Ž2¡‚åŒ1a)ÆÃ64Aû®£Ì‰4g‰«Hd/’7ŽDŠ;êåÆ¨áà`íèÁä2¶E–Ÿ¶öÚ¾ÂÕ3mâ]³c£{Nç•:IY­ž_lô7äI0AFîMÑPTiÛŠ9:ôù6UZåµ[µ®=~Ó6:)‚§vkÓŠJ9à§e)+¡ƒmïÓ>ÊK{‚RQb°\9èÚLãQÈGØu+ûZXÓá5ÎC™;MÇËÃâ3½cKö‘\m»‰™™ÚoÞxhÈ¸² ƒª]8»¶>Ýv»\ºh=o{Í ¶¹,I4–}Àâk:c.>_€±RãYÕÇãð¾u­Z9ÐW1˜üTâ—@5—…$¼‹ž¾àõˆP…Cq²õ»ÑÎƒPˆÁÙ%¬ö{ƒu¿eÅšû,oh×Â¬Z‘¶µ¢èö[+òÞiKËw)™¢„¢ªFâ‚9é¼é’©žw^vÉñ>i“ÝãÃßß-yS¡¢R­(5-Ê¬Ð0™ya¥Î»ûç›äøõY÷ôîù£sø{÷ŒüJ¤¬™*(¬Í€EhR:(¶ìˆ ½”õ•gË³Å×cyÏ»Ý·ÝSÀá;´äÁ†÷]çô¯gÖÐ[9Æ½œl¥²Nj±žåu[¡2M9VCä¯ÀÕ_÷¦u¾ˆÙç™Ý((ÇÝcf2[â÷í³²³N&Ôñ2uøuwj‰!ž»oKù.>OoÂl¿úƒ?hÖ	ÕÈ¤4ooÄÈ ˜µ¬fº5Æá‰@ÎÊ==xó–îîñ@óôÙ^÷ìàÍQþzM÷¹6ÝmX×kÑ®ÂLOÍ$k®öDO*¬«¦Ïzéª¡‰^ä{Ÿë=d¬o|é]Ç/aè¾Ñpã£—tÊŠ¡»nŒ=£‘¿±òéöCói5bŸ‘ª¶€s·9çÞëvpöOáÕø¿© sþûi÷¬Fv»§çû»s
ùùiçèlæ{0õ§7y™u\ m± :»½î»ƒÝìD‡ÍÓºÌ#¬{,…ì’"Rµ|£Í×jøÞ/§ãÐÃdHÁpèGü³p÷ÆaG7|_«ï—þÏüÂ¿¸X"¿ÉÖï5Iwd+jÉÃQ,êÊ$ÆÂ/…M™š”—x…ÌéŠu9ð8ï÷ÓÃFcâSgqø]E`´Â˜+~Àm´¼|wìã¯ê’—Å%ô£È¿€²Ðxöl F¾M>å%÷kDþlìõýêÊÿ‰[ÖÈÒÇ¥åÛgû/>¾ëœÃo ©~zˆžÂƒÐ 4 ßÅÄAUO¨Èùœù©•"~õõJˆ“Èÿ~–pâïoIŸF‚¬ú‘§ÑÂæ
†QµB3ºWÔlßÅG›•Á
¼_„O5C¯OKv¯ú4
XUò¤O@>÷Â£3þçáÙ6æI0Žøä#Œ”	ºžÐÐûï?@•÷ä÷?úð–6têM‡~ZèNª»áx>™Æ°X£yŸféQ'µpšKæ|N@ÓPº÷®xÙw^2jÀÏjÚ@`¾]XkTXcD©ÀOôýF¯LHÍ1ZqšødÐ[
0úÿÎpuÀ˜³ÅƒêÜ+”R0iždgŽo¶7”½Â¡À–È?ÉÛqÑ¯”ÃIÁzC(É"e¾DŒ¾õ¯Ø¶tºd„y®–þm)-Mß˜ð\Nö>-êç+qéBê’òÇó¬J„RD7EèÐjK¿Â9Z„™òœ…©ÔÝ0¾¨Üá—£è¹±ŠW¨{ëIåx5Å>¶šB÷u3­‰ÑïWüÆLÇÁ”^_ª`º?xQK+³g¼‚.©ëPœr4Í_û.ê]#
7•=7:öo’
?“¨Ô¤Wñ?6¹4Ñh«)—@ÊÙ$OžˆRø[~/rÂe%Ø“´ÈmM¥)dG*|£0
þÙQÆ0´(BSè¨0úCŒQ¢²,ƒ!dèfZN~{y³sÐýYêº4³Ôé’ƒ@ÉPöŸ¤o ~Ù;D;‰†½jú8åë@óÀÔ—–³À¨†o—»É
ÛÁT¤Ê6 {C„e2Šg¸ˆ¦çT†VèIAÐ‡µ©¨7´Œ&Ã_>hÙ
åK×¥	.+G¥O\m %Rôcî<Ãÿ*”}ì"ïV?æPŠ½k^ÔÙ“4tª"ßˆÕTIFÁ„W_AGÖñ­LÏ„ˆ}¹sÌ*2Îzb¯Œ¾²‰‡ÿîSïZ›ëß‹TÏ¡
Î&1¶}Aùý+þž+™`~ëg0_IˆJ3¨@å	ñ'³äšÖŠSÃ`‘5ÔÅàoðþå%´ÀÕ„šìl¦_æ»É§¥…ÞâÅeâÅ×³y<ªf2¹Z©`tm‰ sHõ0™ËËZ”ÁC;–ãV–¼ö¦SNÄ<ü^ó #Q¤J‡ï¥Rµ¦ÓîÉï¯aƒ[´·]ròöàðàääà¨{ÆÁEŒ±FÄq[ð½HÊMAÆÃ¯ýÖþúþW²T$W#¨ÉU>ÞTŠ«¨É3µŒ=*£$µÉÆT¶Išèüç…:U'-¤9U9ŠZÅØiéØÙëÂÆömzˆŸîÞï°›=8>ra¦åÂL·ÝÝØoæ`¦U€™V>fZvÌ´Ja¦G		% nJ¨›b÷té,ÛÕrÆÝÎé©ÂdÚ9û;q%Ö¥I	n?)˜m#¿­!?Ëí6Gnk­û|#ã?•}ú©“áF» ýí|ô·íèo Öòº#(‹˜=áû_ê[ QÙ]¥±Â©#Û-ÆaÔ½o4¼ÇTïüÄÃ‚¸ÿî–¹f‰U4‹B€Ó‡·t9	./A™‘ØQç]wÓXMtV÷^t[ûíJÆu`5³±œ´eÆÅËì­æ!òŠžÝoÔ"¼Ì8šª¹'¨ÔJ—báÐí‹BšÇüÕ!Ì]&³Œµäu"=_eËƒ¯Œ)ÍÓY®ÅuG‹lcL«Ïjò2\Ö:‚ùÅJÃmŸuÿ3|vöº§3—±¥EFRf°€`;oî¹èœ·@¿oN;{]rØý£{xÏþÍÜ¯ò“Ýã^Ï	eMp|© *,gÑêpÕE=»o€ý©—Ë=hèq™Þf8¾/ããã.:Ò"zX-K«<nÕÁãV]<Žgs¢¬ÎJDk"Ú;øãàìÁ0:ÐÞNïA?§Ý7Näï_b{¹ÀJtke‰nÍ®2–Ræ²œX|ã5$:§BìåÁtàp7Qáœºï˜ÛÉ’×röPt~ÚÍÕçÏÖL­Þ©Ä+på#V)š»ž-Ø1}W¡Ü]—Z)ÎS•‹Ó®©ÉÉ„¬Ì«xÃÿÍÿH×Ûàço¿eö
Ãrñé¼{úŽæ~þT ‚t¦SÜleÿà¨sH¨
aÛî³nóõšÔpa“Üó¦UË¹$Ä[/GD¼°uÅaiúT¤A¢ÇZ4AËƒ”Ñƒ™ÐH}ËdÖdéYœ#YA²GIA¶h2a?+Î8eÍ13Jð„2Ù¦h-3å”3áTJ+Z(—EòM=`¶©ÇÊ5õð™¦5Ï”2ÚŠv&™bäÁîIO˜½(±°6…‰Ã4‰¡q‹«ž/€³Éí~P€È•xš¬IþI¡v´UÓ/Ól'Ô- ï¥Ë)þ&ïM»Ñ¹®‚Â|…T>6¬¶ç0å9D¼ô\ÆëÆ µ˜_X¨ÅBèØSHñP:"•æšR.ù”\£l¦¥’}:)K´a¦¨1íqÒt0:W€©)ï‡Ú[<óD·™›+Ç×tMèµ@=§¡©Ó‚é’ùŽ’ÏW&†¶4„Üãƒ¦*Åà¿É©S09fq-Èåè1åà]³d,œ0$/*Â28ì1h­ë»N¸õH£ÌdÈçZJä"#e¤G¡Ì‹¥´Â¦2I±wx±ÖY}½ñ ±–òafL\#î{ARU)‡¾CW‚—¡0~¼ `%©E–¦‹QŽrD›G9(nÝ—tw÷÷ö×U[„Þ]ÉÑâ8•ãäÇ§ÞÃ}°‘†Cª°pHÔ‡…C2&ŒÏˆR‹c¢µ^¿hí¶vUèQèØ,ZUûV‘)!l‹ìÑ›ï»™oPà½Mÿ”‡¿+°4Ó°¯¦àV—ŠU÷TTÏEl
¸_rc?1…:TEø.yù‹Ö®ßì¥¬oŠàÒ¢´4Ó1›.C¿X"~:¡¹³Í	¦Ë ÚFÿKf5}ál¹ô ´uËùÅþ}‘V)«1	^Õ¾§Q™/*K`Í+HvÐ‚ªFÝEâ€~3¡.÷öu¨²!åHQxVÒ|ßX¿—””·ÃuØ8«®>DAîþêîse™ÞehÅAF­fÅ­³¶¿ß]ë>“Œú/^´^·^gÓØ*¹%šbyõÁVÙ¦E8ÏˆTÝƒ~îAtÆJÊ9’ÖµZ¾À²MËäŸ‹ˆn-§!Ê«Œi¸üžJbó»„]†1xd–×‹KaAYëé•ëïƒŸU	 òçA”Ê	uÜætXÞçžK¥åãB?‡¬¨ƒ“ã±Q¹C+½ž:xý¶Ü¹ŽÌÿMœ—:×ÉÊ•Ã{l=ð7_;°¾ˆ”JÓlçLMfz’ä¹¡+ªeéí¹Æ+"üŽ•KÈ¯ï¿|€?ô|Þ.} ç,K4I“c–K0±ËHø‰G;t+îoìwöw­Žœ5[{xYF:‡ÏDæ“llé"U†›Ù@]7³²/ºv‡ƒ+ÚüÑBé;‡Ù9c˜
IÏMòaòà®5»VfxyzIRÞ I¬¬TŠâpÚÝ=>5ò½ÏûyÏ²Œ—Ê—fÊ€-"Í|Ÿ¶ŸÝ¯g.rÞ¿¦ö®{~z°[ÄÓøð×ÅîŸšä}¿†¡i0CÂ$œ&#´,³“äj³Zä{Ï:”qH_Ôoåüø¼sXòÈßœv¥ñÂéWJË*ó»Úó®c\gÒô1_|Á7)2èGaƒ„rmû88ïºÏü)p˜»goŒEï¼Ù{6‘ŸýkÊ›Ù±\
„6EùMgX;Çë¨q#¶›-ÛÝý½Ž{ª”NòçI)*M“ÈÑj­ÎÒ ^ñ7îi’ëkótŸ™ÉnÓKKTRfÕµép½§ëŽ–¸!3"å;™‘hLR¿{ÓÏâ¢h¡iðv(,ËÖ‰Ûí‹4jÂìN„ všO	jY:=%°„À
=Úz}pªðzV¢HÇZŽ&X+)Ip†…:0èÃ»3}¤}“GZôÊÒúÑhœ½ï¯«Gq0<K¼ˆ[Žn©#‡ÛÔurŠÌº{äõßIu÷°ƒ^’{œuO—M·U«Õ½öxÛ‡êÿÁëääôø>ª“Óƒ£Ýƒ“ÎáÃŒÈ®J˜.3YÁ\PšcSÔ_Ên åš[Íkn]V(‹i•«œàW~„^äü&Ÿpô“Þ¤ÞÊ2•b ß~0óÆr]*ŽQebIÉXKèIs|Á5Ÿ¬)•â±•ØIñ˜ùZ¦aÍ6v?Ñ¸{”9i^àºæEÁ²DŠ¾M¹tŸXˆöÓZ.úO¬››*(vRox3ÝÅ K¤Ã(vWüÔœû ­)º-§]<˜¤á]÷cÐW…/6ºWÈ‰ ·‹“´8ª)‹—[€V‹kõN„µZDX«&a¡˜÷Ì·ð9ù>½t3ÃX!¾*à2}­DòBïc~¤oª/à´ÊûÊ|ã
±¯YçØˆÆTŒEä/©_Prß²—fø¢Ôj1S`ó%û¶eè#ô¹lDÄS^vUYÀ»ˆÍ®`ÖÄm%fç‰„K»rLÄÀØÞ.Õ$=Gy©imfs;5é×_ùÀ¶Éó2ÐfM3ýšLÄ]æÀ7Ê Þ.86g»V"3}¯WÈ¯TkS™A?KÁb’š_éÏ®¾ßH+Fýµf&¤n©Å°¦(dµDò(ÔæY„süKöW^ŽX„.Æ¬eEÌ\öG–õ†O ðÍº4ÒQeŸ™òû°Ä8û„úìS$fvÄ¶Œ=£¿VºišŽÔœa½ÙV~³)éXÌ«ÙJù‚MV$s2ÝÁŽ¯Ñ‹‘Ó
æÓ—ÑùÀøLèqÝX<;ÎjEü·ZÖLT05Í…Ü²1ÅÉ!ö.|)T tº@ ¾ÊGÑï2
?û@Ÿ0<ëý#öþñéÖåmãj_}¢ÉAïFÞt0öi’šÙÆø.ˆ¦»÷°-]ù‡M*1÷  ÿÿì½ûzÛHŽ8ú?[Û;–»-[7'Žc'£ØrÚgËg»gv6“Ó¡%ZâD‘ŠíñêûÎ³œG;Or TYW’ò-éþY3iKd]P(€B¡€ÓýÞÍ“54@Vn¤Ü”—a#B¢íÃÓhNNVÐ~û23ïá´c`Ç¢E^~t|,Ì‘úiUŸ
°pøµj©¯GùäPUÐ¨"lœ'Nƒ¹¡
D¤†aè"¼¥Gu„ZoèÂn
Ýúy8éW«½ÌI®Ç,.lÕ`ÇŠªhB^D*¢ÒKW¢è:e¿Ãc±zæl/¨_šÎ¡ï¥&\JŸ"ÊÐL*’N–Ëå½”½·øŽ“éÎÎ/*4œ×r¿4E›zÑ–³hK/Ú¶N´×mã©c]­_î„REIœï‹5î£yîaFp¢¾ ¢"=O/¬û#9¸<Š:yJ( 7AÁHý š‰XŽÄ‘µæñÜp9PÞÉ]Ö‹æUÈQ©U²-”¾ßþÜv¸ï“«1<˜6\
o–Ý8íÓ–AúQ<ó&¨PXgB7ùlL×ô–½k#×-å¿G'ôriÇ/=[ävž¶Ã¹½¢äÉÄ«+ÿ	Û-¡îj‹%x!©J¶€,\è9Á°Zþ§ël$‹ÜœªYUÏ@(¶f	t$¨üéÚ¼‹d¤ÚýéÚÌEÊL_ZQÌ=»De7´j¦
SaDÕÆ*c|&C¨~i ;F—‹š™4øÞ jæ ÔD¦ï ã´¬¬,–EvsÒ8d·rÆÖB)åDvš`4“VùI˜od;È6‡)&ÖÍ'w§Ê_žaZw¦¹ŠŽ¼jÕ¸©€Ÿ¼h$>%yB+kÁrF~}±Å>9Âú4F£Ýµ•›8WSÚÊŠ÷êÍgÐ¯«JÎY}5Ü=åÇ6“‰ý)HLÇ|yêÁŸ9Dh%#¶õ·Ò‘ƒ2Ô«[˜¼¶ºï˜®ú°5¦‡ËQ‘=×¸û®ÔÝ‹ÇM£†‚Q§™[§i­ÓÊ­Ó²Öqí‰¨û"©¡tsÄ+’%)«™éuø)Òíh²2ýNO^Z,É6ÚðFü£Ô%œ°HÄìà#ËüÌ¡¡,M¯³Y„ø­ô¿›ÁÎù,P—Ö	{JáB™£(ör5Eü˜ZJéé±kŒ8ð-²W F²AÞR•¼9ä9ªe¯Œnéž¹{€mOkÃg/Hå„çK«‚…Í ÄßJ¥8qÎÃü6Ú‘‰¦žC´^vüzâ O’ÅÄu­QÁ&¥î-æ¨dµ£½‹;©ÝRóù¤È*¡ÝßTxci´4Œ•·RâmMè|àÆ¼ûsk–*5«Kÿ}Cú°í~¤¼Öu8|qÜž§±†p5gßäu­iåw2¶rŒj«hÔâWy&%&cLŸ¶3£c;<|ûõôÍ‘'q’÷ßíþã}×“Ó™í¨?”;”/ôIJG‘^ÍËKø…¢•ªeÍ(Y_ñóW–33ŠUW†I2·76uñú Š°«œ†˜gf¼Ñ‹ãæËsŽ®vûÛÀãþÚ·	ÿžÀ¿§ðoþÛû?1Ú/üéŠ²ù+f7Ô6’lž:moäOúqöaê¥Ôö ²ÈøÙHa|‰“OÔ“æßufÆle¶´Ál¸°(iÀ+k^|'Á¸6×¼f†jì	¼¬ÅÁ,<W!ÏDÅ6&úHìáÁYJª¬=™sö9Ljè?˜0©TóûÿšÇ †‚K¿—x?²©ö'zFé%k(©—™“Š:ž}°ùìéx¬v5är±Ù¨ë¯ÒqÙ^¥Ù0ýs$<‘SE´\ «¨¯9=n{ç£@K˜<ð§¶nñ^÷ùS¸Ã>,(¨(Ñ1f–9hÀ8ÔêÄ0l{Òâ“Z?œ1_œmîaÇ­™B>o jmä¦—±w­2Oà½f±x¬{f/†™íÔ‚†½äh •kåè-j¨¢¤ªµZÊâ²Ò“R¦”M¥Í‘(&ÌL‰ZšlRŠ_ÔÎ1/Ûµ§dMUŠhY™S§Nkžf3ï<“6<ó¼uAš”áîÀA"–®’ášõq¿0©¼…é)»å‘JÙäÖÙéŸVwN‚Zº>Ö›Ž¤èŽáåå“GZr°{ýÔÔÍ¾’p¢TaE(Ã<Ó.¾i›Ï.êpó˜)QN6.®¦ÔWV0,ùë-˜røÜ	äKÄÉ‡¸×Šì[QÑVJ å4ÆzÂÐ¼YuïÂ¦B1[.w6]ogCV(wÔüÞ”ˆøä×n÷ÔkxU–’[Í­¤°G‘¯ž®c}–Ešgr~÷ê¤{Œ÷uþÖ9ú­{‚7x²ÛÛZši©i9‡±@_µŽ½AúÅ·i¶DÓ’<HYzÅbj¦YÏ”/ø¬+t†.X)@¢@“e•wÄÿ€ùh™æ9á¶Ì…rsn§YÒn³fÝÉâg¥ÐSä
"3^ ˆ,¹¹dx§Õ“ºóà7Ü˜õþ‚£òb…šˆ½ÔGÕÕ¶nsJŸÚQº“¨+ûüt^Kñit2Œ.(ÕÖÛ"û,nÃV“‡Ò¸û ê‡ŸÜ™ÆqŒÔ^&¤Â¦ƒD³*}eIZ¬’š’%o¯„O‘I”
¿ed¡'Aƒj<
TZdtGÑDìöuÜJOŒ™Xó­ó…ôÓµ2E+ÿÁ²qR&ÞÿxÖö[g[+Ûˆ4”ÒiN_.¤vrÆÏ'Û/V×ÿ…“*ƒyömÙˆ=Mç®?Ga„ð°%¶—²¿KOoËÉ‰‹ßŽ—ÐÛ˜8.uÃ×v‚”Ëï|ÎÁÉÙ[‹}ÚÎªŸæ±jÞ“)r¨Êtmv³b† ‡ƒ„üá~ÙØZüê
×Ù60ãLÌ²ÆQ_(™zmŸâkõEÀx
 r¸ÆUësº÷®ç6?‹fÎ;ß1ÂÏÁU¬tµº1TYRÆÁÿ„S‚7¦þ}À’‹täùœ·Ÿ›_#n1|ñ)[çn˜u'õ#L›fV0ÁhÛœÑâeÿ<²r³.Ói èÏ´FåEî$9œ¯ /7FÈ‰Ô'Ç˜“›b=n„:ÕÖ¥KÅao“Ä¤¤ÂÃaz*/(ŒF(’–åËÙ’ˆï ^‰s“Å¸áGÑåŸ×‡õ0ù§k3Î…õÍñÌÃ ÜËÅ¬FkY’¯¤0‚í#ôÐMJ~d•.T¤†¼áT‘Çï‹`4ØÌÐ9N?,NÊƒ|,¡nlŸrÔã"9ÎwL)þ)Å¡äóWLÑ×_à)¶UÝECåÈ·ïÇÃÀ<óm4KhóÍP)‡=ë ¥K¦ûxÝ÷m”x{Ñä<ÌñÎ#Þ¿uä%·ÍàÎ†uóòÉtnÑÊñ›Úñáë_O·á×ßºÇ™çö»'‡¯ß–´¤‰ÝZ?¸¥ÌÃc¾ðüª‹-¡UãõóÚY\ÁÄbI“Ú–Ž>Ò>Ã©Í%€zØe‚#æšÎæÚÒN.Û´ÑÌiÔ@¡ÇÒZµ`úÁ´Û?Š¹l„ãÏz¨J§/2%Zì®ŸlÊö)ú‘Ê^;J ×]Þ9s|’‡¨Ÿ¡Y,å¼¸€÷vßw÷½£w¯ß1B1Š§mˆÙ›ïvŒ<»jî ëK&Îì,/“]hé¸rÀêŸÕôË!@ŽƒéüXÆxEØ{?GátN‚x™þ­&‰MIt©R«3¾&¯*fƒØ¦þ,!ë€×íÏ{>ò¥›!Æã¾ÖUÜäv%5}.ÙßntVÞÿ÷ÿü¿cÉ~³7€		ÃŠ·V*úh#ðÙ18†Øá•Š©'äY&ëBàr¡-mx¢îbºß’íSMf jp•NõõÆf0¶;Á3ûŽ•ëQ²×îñÊI–3—çÓÝëï—[_¦lÒ#aê´T|:AF0Ûù†À ÆzžsVm¹l“ÛqšÖw4Ö­r  ûw2'€nH—”‹¨GÇo·Ýú×ÍºÖ]K1]Þ’°ó4X<FÂh6Qƒ80¿12µÑòp:“»õÄÄµ»¸°½ù×‚ó}ñþ@8í¥2q¢cà’O‚Ëï„Ó…ÍB@ýñPÉ‚füEžú.ÐÊ`Ê4Š,Óõ‚|pÅsçe°ïÝ< îhtÅûiY7[;„k‹­ý´ùÀ4¹Lóv>0o@ÛÂfþâíuO÷:§]ïÝwzÜy{r [ù{s„¹Ùö^ÑdUcŠ±sR=êZ›%Ð)«UÕ›šfEÑé$JjrŒIýÚ‚æ“Ã¨·C@8<ÿéÎÆÔÚ§¢ªÕO‡aÌÝô½:Ôã¶˜v}þìú’+Já=EƒYÇÞU4Ÿy=Øö1Ö@\!œxýâÝÀžl„ñÂðÆ€„™cïãíÀ_èic*V3«%Ï‹õ% FpK›îEã€ÀBÈç ~íq$‘÷y]xcìÑ?‹æ‰ÿJœŽÊÆ}(êÊ.mÓfÓiºŽ¥oÎ$Å9ãP›m±˜ŠÍSäMÏˆŸÉÞ±w­:b-¯¬hy4\;Y	Ìå,#O]¦%nN¯¥¤Ÿ•-}RÌWªI-ûÎ±#8ðf»@X—0´ *×Î²•™YÊ»ò4,l‡Í#ñ
üõ„AªàJ´ßeÎú>ìÿB·ožCŸ³->¨Ÿ®aX€¹#ÑdñŸÒs²pižK®±tmå·I¶o±ïóÅC¸Q
-$£ÕeMY¶ö´&»ªäÚÆÍËêÒÀóÖ°Esò–§úÒmè®ŠyÌÂÉ]ün¢|ëOIE.¥§GNÒ ×ÉRŽ•Ö³Y™Çˆ7q´ó’=tù<{¨4:÷DU±ª|-iG•1¼Ê‹N&IÐG6¦ÛÞz…•]U
5§çpá„tú3ÌLüerOŸïl`Ã/Ò½ø:Ú,ßÑ
ñ¦;]à]è|@G·ˆª˜N%n‡+æv‹1Ü»6ýä~g«OŸÝPççy÷®cm):Vóg“Q<Y7OðŠBf|¿šóiVïMs¾«I¾GeYì®èœ~tÔ9=|÷¥k÷èðõá«Ã£ÃÓ,#`mÇÁ.›Îm%ï]éðŒ<÷Ð“g4¢óa: 'iÀ,9 n$‡ÛEr8¼¡`|º„Æ¸å7ëåÉmÅï^;tO=˜8œ®å–röfÎ-¡?"£y`6ã"îœ³}ãA¾#ZêK°ß=íÜÂÍˆM°ìÎ"cÚŽ·ø Ó“/W§~ƒXP‰-êtaàïÞ2w‹Ã·¯3uÞî{“øŠ×?ìßè¨ˆ±ô]Oyí•ŠîUæ:§å~å‘°‚wfï¾ƒà²YÜ%ál¢Õ2nè•¸5Q®í6:E³dû†R—OsZä×ôîº©Ëlù+|ò£üÃ3
J®qNú0«Ñdùxõ|>!VZÕcÈÆArŽƒhžTeÒæ(VMU»¥´XóZ›u5Úþs	V¸yÌ°Ó¨KÜs›úÀˆM{L¬UÕ8NR¢î:^¥j;ãH8Â‰í^8	“Ðí^_{úã$Wä.&ÂŸ„cëÊëFö:¸WUb¸µn^’x¬Õ½×>4ëõÞÙ c »Úf=å±µ«š?-ùÕ™†-y`Œ“²Z[õ:4Žúþ¨Æ]Àb	€{)§g°€:ÐûŒšÖ”ƒÒAyRtÌ‹‡>LiíräM/k[ÞôªÖÖ@¶éû,ºÀïäå+b®Ào¡~ðSMô†&„V ¾Pg>žm&f søõ¹V—£ñiƒQ`QÏz‡M¹ ˆ‡cO3øRA'@Ìá ªµëÐ?ÆôzÓ9…ÿØR/ Ð¦ÒùÔèûR™;hUrñ'èLª±qžÖH(”z{l~¬Î™/ò}œ˜²Šž¡ºÇÍ»bDY3UÓcÍ“½/R æ55X—øYbö/fþÔSh	­U±«<Rm ü”øx|•&7=Ò?‚>4Å™Ë"ÄtkÚ´íœÍAÕèÖ¤h²7‚u·{ÍoÝ"K}ËƒV[«Ïñ÷	X¥X‰ðh¡KƒøëO°[¸ë„…Óì}x6½üè"ö™G:EÉ©8ÒC'R`q3ŽãKoÇWÈË ËñÙÓ'uoˆ<n;{¶²Ð¼Çu×¢c±ŠÞ†ßÛ#½ýÝ"½ý-‘Þ.tm=]Ô@ÿ"wkªY÷Æ\ž/k´~û›»˜:Š‰ú­¦ÎˆÎú@]ã?Ðê H­ßŠ’B1tU
Åæ†üZËÍPUÛa2rCòÙ›ÏâhV›ÂŽ	ËòŠ'{²i•`°U	&Í’†éeçIÇ¹i'Óybž¬`:‡ÝJoô>“-Ó(@¯‚þîµ5Ö­¹KZú“Pa5 jÚýÍVµ¬'þl$ë¼ËTšŽ9Q4¸{°"óýÀ 5Ôåzóx›ÿÕG¤Í@ø”­£[´É½ÈÅWŠùGãÄÈ„‰Ë´Á•êq›ìŠ)3–Û±1Š”Mà—(T|I½aµaAÇ3(KÃOÉ”ž<U«…O¤—ž> 1ÇIœæ<÷ÒÑ¨›å²ÜŽ1²@íÙ¦<¿üoŠu»{Ýh.ôY"xïýA ¬'(‚NE´M­5´]•2±‡Š1«5bxËØ.¦û7tÿ ñ‹½” þ7}ì[Ú'^œÑF6sÇŒŸYp¾{Þ˜ÇÁ¹LÒnšðŒ—¢žm­Iûã5wÐ›ª$‘vÙ¼ZCªÓ :uµŠkH£ßâ£Áïuydü{jXc‹8Fè.Â¾§;^•™2ôÂ¾}c3c¨£lšÙ2ÛL;c•êÖ¡(u>%G¦Œe*»Þø™Ý nx?o,rÖy:·°ÇH¾Ï| À½°°U	'Åš0&ÁÏXÜWâôê0Ù3Â(ÛªÛÉ„7IcOÆµº~.¢cB^uá¹¹ºYˆ°ú  ?
\t€’£à<YÕSvYášiøFuÌÓ™9ÚÜÃ´"DZCÇ¥-õ¼ø±„5bæÏ2Ï4Ï`„™•$?Ž¡ë°g©±xªñ[(þÄ½õÙ·–Ì×GIäZ‚Ç*ù€ð¤ÇB÷¹îfiàDm­JN®”Ö ´šçvÇŒÌr‡–á#õ‘þ«±®œŠDO¼IÜåƒ)¦å&É±vgpR¸v	T ‰¦^©Ù3Žª_H¯« gæ}®v¯¿,òñèeTr1	ZáRÓL¸`–¸ÈúÙYB~èQ•ð&À¤ËÂt±k#ÓYÀ¬`bYaÈs´:ƒDØÜD
Og €Ž	ýF,KŒMYXÍó–_i762„¶@aWM*/ÞF"XfìE3P=ˆ€á/¢úë¦1ÑþÁ`™e†`åŠ¦‚©™sK •?B-Ä©^:«Ñ±.nF®2?¥rC/ôlŸœ˜7¢"jÎçÐE^\w(ÏékÃ^å§
qËIƒ»0Ñƒ~®Áè#˜ô‹äµë°öVJBé¸—ø¹þÑˆ}iX(Ü£gme€¥L‘¶w›x°áX0\Ë¯Mç£8—ûïtFÁ,9…°¥GL¶Zêù«Ù”7¦QñÀ@%ãQÇîUâp¸v”·…µcø®Ô)·Û_¡¨Öõ¤ôPÒNÅ”9M+Ç'K©7Y Öší¢H0%bÞi´Ó»‰wzO‹bž.õuœB­ŒÍ+éeXaî;'"UŠ£XÏ?ÀÉZ˜fn+!ˆ™jF°‹»|5ùY—#øLé›þF]ZvB]*ŒÒZ¨Ü«A
/x÷+·D¤bX¾ù±
1ýo™­'A–.¾– 5óµ-¼÷<Á#…TÆû±G-R rÑ‘§@Ý%EñÕÜØ•ùÄü µ^~èË’Û¥†t½öëèjÌC1Lf‘"{GD×¿%ÑU^¨‘pE;r4Ü[ÐJ)<Ê´¢ø~,,·ã¹—Y/U·ô´—Ñ$ú«ÒU™D×û›DÙM¥÷í	Oi=¬*ŽÍ‚7_Þ'-Þ.ï7%Í2{ïˆ2ïž4KFðõî4]ôhÆùý~É1?Øo¡pu‹Ï#‰Û f,Y‡ûÄT»3oF¦~*&uy+éÞfVÞ5œs JÇ8nÌn>x²0Ìd±À=iŽaÁ|¸óÕG´m¯	•BlöÁ‰KÛ œkv³¬å™tØÖŠß¼óªo£/šxÇx c©•:Q›Ž,3aµñ¹ŸÕž”=VKï.IV¤:¶ÐVè¡”Õ÷Þÿcš§´~¤ÃQÉÖQ|4HÈ–#§A¤ðÅKÏýáA¸wÅóGÉn¥‚GíÁlÌÞG°¾®0
SM<Bºõ,^»2'’Ã“±x);Ö·Â¢%9C£"ù¡ñ¨„>^‘î»Œ¹6_%ºŠÝ®Æ¡Ë‡l»08l˜ê£{Ô*Ý:#%G[wŽ6#Ÿq‚fs-È1‹ml„6^8†k^ìÃMc¿me¸–hÅÝõ?g¬íb“é‡úz3Ä®·£+ðÔ˜^¡—{~aJŠâçp|m™»T…ÌE¦·gG˜WšÃ¾«4£¬oÊD¯ë\ÅzÈ¨Ð]Æ¢Š,ÙµVSò·`!ƒÝ'pö¾ÏÔ+¦>Ä®ÒÝR]•æòß‚yÔàÛbXº¹¢ãV²ç•¸4ógÀ)‹|k¢µQ§?þL˜bñ‚ïŽø¬8‹ƒË?ÎÌÀÀ´x«Œ	Zîž­Òµ::°Tþ+Dá> TOÌ“‘4ø†Ö£ÿi&J)|“dhM´÷]“å"#XYîf÷ÚæŸÕ½Vó¯Í‚§‘Ü4¯Úæ­¼jÉsVÞ½è.hË{Õ¢• ¥VnÈ&‰î¹:jW§ænŽîÛ¢‹NÍXÛÒD+Ö›…ÆZúˆ¿Ï¨Å:ä &n±%ÖšIƒYØ÷ð?Hc1L™šŠ¶I6c’hÎi@µš;­ÞÕnIÎi}„ºŒ-D ×¶ÄõHhÿ×o·Þ~÷¨ãíÿö?Î\8¶i•®n•òÏÁíµ²´PhÖ	tuûÔâFÍâ<—MMxÕ4ˆ+±Šk‹›°ñU'}þP.–ÒCç[„ÏèI.7P) Kñ¦I­ív¨¶íFB“@HS#á6Þ9Ü%sÎ7,Z¨*’Lä¾.IÕœ^‘Ç”¢š-”ÀÃ×o;§¿wýˆßwŽñF	Å]þ­s¼zÄŠ—ÖwTÛe— •ÝcÌü{…WV/sqr“¿/¡¬¡NJL¼LXt#¤›Â ¹»”3ŸKXq…\Îñø•àGÃ{a)Ûæ­Q›ËTçú%åuŠQ íÿåÖ/tÚ/ôð*tÆwìýˆ‰Ë¼£Ø`OŽk„'éBPv9¥èA¬n£Ü›·òÖîÜD!E7_³MÂ™ƒ?,Á¯œ_«Z¦aO7†‹¼Áo…båŠ8mg“.+yƒ]rj¾Sƒ—™‘qT×q#\µEÂØU¤KTÉñ¾¹³=­A©oÛž[ô/?æ’A¨Aæ[âa­]f)¤ÌÆ—@n ßÏ’»Ñ}ëL÷]î ø>6?vÕ³üõ|ëF {×OVë-`Ñb¸Ð=G™ÍÐ÷O7ŒL[(›9Ý$ÙÝ!!­›w+ªë™¨¶D¥‘6Cîsj
8HWòJ‡¤^NP7óÄô­ätX^¤.#Ÿn“õº˜‹Z»^”<0¼h9µEMÌkA½Ë±éœkå?güf¼ñ;áŽù‚óBw[y¦ê™ºëœv^ÁNš.×ÌÒ¾™ÅM,'/6/œ[ÝOb±¨²­Œ¢î§¾CñØ¾Ã’Cì0ÊãÑ¯¯½¿gŸÃ„h`£„wú¸Î¶½•àÒï%+Þbñ¢|,pû%êëjæ€tÇ‚6®!^¿ïæÐ“â¨“•ÛŸE€%VfÕe‡QÈõ§¢¥É,¶Ê¥DZy`¾äaòD¼®,p^4ÃjôlñÉPãä´súÛÉ¶§õå°û¤¥ú€„hž ì@|òºÝ½ÓÃ¿u1‡Ù$¸ d
UKqŒéá(üuÂnÕ!¹œýô×¼kï
Ï´½•É|ÌÂÞÊ»EOâa4Kàw³#¤ïñ"À'»C÷8ðcPàãnçäÝÛm	ËJ!{“VndXPìæ..ŠÓz5—òÈ.Í <ZéV]B–†»Ìü+|²ÜµÃ \LµäQ”ÃÈD‹;ÄQ©(;ª>Ö¨Òaõ‘‡^I¸kÁD‰CÜ žq8©]Ô>´š¤£‘¹¯Aà8Ìuß žæmá¡˜¤wOëÎà1£ùÞ„í<oD´¶†‹ò)ìœÍ6^äT¸i‡…	\wŸÒ;Å–WF¸©Ò«½ 6Ä(H<ÎØi
v½š+¾»ZÆ‡i2»`wk=ÁÑcxîU¥þ0j´]¾Š+ÄfÎú>ÕØõr%°óV Av¼]ÖV*­¹¤^AíÏG(†¯SÁ<Š&ƒ•¼À¬ah†ÅRÙM´R¿_­ö¶=rEóØc·	‡‰»UDŸh33žF S‡“$­Kñ7hV_q÷æX¶ŽÇlÄ	^ã”¨Lå%üÛöZ´È‚7¢Y£¹‡ñn¡Œ½{¦Ç##;§ ÕÂtœ6ŸÊ»^£ Xš¡W¹pÑ°0Ý	R	KWu2§C¼ø(Œ“uXó^P­ú½ÞšG×D×¼°™ÃW*ò‡`†ÍÖsgÝDLîüú›ÏÐëˆAXØýÕ„~!æÆþ4®àrcob6¤õ°ÏÞc³ÐLo}QWöÞwéîªZšÿ=M›eå¤
+ïNíçPZ
ðt|í²‹Áˆ?ï…W‡†,ÿ€ok^ã#4?²\ÓY//½j5ýeÅLö¶,vÌå1´Zb8Ä¤‰ýqw7ÜªDPî¨:Î³^~á¨£òÀ?É¼ä8˜FtÇ“6üÒ‡ƒá a±æafûK„m™‘—DÙåÅ¦ýKP1šZC±h¡QÄ¾¿4u›…u[Îº­Âºm÷´7ÖF‡J%Û9,„µ¢Ç	ÔÊ9ªQ+ÎYm ”ówYÈ°…ZÍØMyÔT@t9ÅòìD8Ö—mÁª(.
X½_·KÏWuû£8ÈYe¼X2›»K-Šp¥0ío-È¾™L@5ƒŠ‘ýÝ3ÿïŠógx(äòéj˜úèö+qSD‹BQ¨';AAÓ´NY«|17‘ÛÛR¸¤|hð¤&jt««Ï½ÏÙ 1–æîžœ%OBäQ~	èŸ-&Ûµ0… AÜyÿþè°»³¢4Ù™NG!ìKŠ[F–ÌÖôÉûîÞaçèðÌæO¦A/ôGá¿oÙE÷ˆÙõö»êwK7lüÇTãpàÝúƒ(PròvŽØä­ÌüÝ¶–¨HË	Ö¬åüÐÇ×Æ:(vt…ˆ´ÛùŠœãXlP[;Å±`¤ô%™ÝO¾È¡eÇÛ6°C9É®Øað:ê¢ˆ%"ä†È-ðT§ãú“=mÆO×Nms%I…	8Ù–#¸°bâ1•Ý¤ƒ[Ûuå‘•‰ƒ[-9N¶ø]½ÂiÈ»”ETQµªn•\6„Œø¼¦fö‚Ñ¨ú¥±†ù/”òàF”x­hpn¡BaÏ/D–ñÆAÌ¢i­RšÒlý
¶LàN=`ºJyì™p­^ÚÕ™ Õ3ý³8Í“ M½Y"ËŠð°SM—eÃ{« ˆµ™î¡¥|Ý6Ùº}€c;ó£à•n¹¨âJûši²LDvêÊ‡Z¿Ô¢	 9¤dž·ß9ín{üXå±]²M÷çí¦…NªM™¼É§D>¹ö/ñ”£±¹TJý#cg±ß¿åÚ+!¨Ôl_–Ï-dUóeUsÍkÞ‘¬j>ÊªGYåú<ÊªGYõ(«þÄ²*õ¤PeUëeUkÍkÝ‘¬j=ÊªGYåú<ÊªGYõ(«þOU¦×Ÿ*½Úw(½Úk^û†ÒËS—gíGyö(Ï\ŸGyö(ÏåÙw+Ïò¸MJ‹,æ…t•ãn–É¬‡æ)Tä”õv½Îøùúù,W¯=æñ¶‰ÑÅšWý}Í©-mH>P«ë0ÿ«êW,ñµ ¯~ð0ÿGt1ù‹"=õhÒó´Ê7ä.Yä‰`[,‡D9 ÐoìÊÕb¤±
ó8ØâÞ,œ¢ÀC- /˜èÌå4j•k-KÂb/“%Ñ3®Ôä&ÉFe$Ž4\Œ›OJs Ðtq‹ÅíñÖVÜN ¢)LäW"ùí­Ö˜~{øY^^OñùÓ.ÁâI)¿<ðçRënéub,vËeÉ5Pšbi0»ÞÓMÌA¿ƒ¾¼³-†›¾?ðÃ‘ü¾$Íç“{þ‚(ðsq9¨¤Þ’’?4ù*ãïì¦Gî4rïLá¯Ì°²Í6•ë³,7ÒÌm$ÇyYn¤•ÛHŽ³ÜˆË•ÙÑj9wf©ƒÔ§™7Hn‡Y‹ù@»±á½—È}\ûê†PÓ2r3KM–áºxÕ|TÛ²è›OÑkÁSÖwèýƒf”ze:«µtÉœmbDXÃZÐãND4ƒ¥¬|¢|ËÑ±cç»ÝAÜrtì âÞFw÷V«[Ž—™¶–ï•.Û¥ûM¬vwâšÃps;ª¿°£{ë‹Uó©Cpg"ÜIÎ£ÈÞ¯5¿tN<FK(‘{3Pr¶[µ·+/^“`æ¼¨Äþ È! Åºàž@³Ðd*¤f.Í•ô­U_Ò¢ÛÌ yB¹ÜŽä›ïF8 _ì>qoŽDÅ§Ï`µ ‰%ì	ÖD–>SÞeæØ¹ðÃ÷2¼ùR»	ÇTj§s—Ö…Ûï˜˜ÀàKo˜ŠDƒ¸ùußR~;¥ö£9›¥Û.Ê–¹(…ýÍ	P©5x+à›¯â»³',cK(½ÂîÌŽP~Y”"f ·¬¼ÇˆWû”§˜tØÃ<ÄÝ„ìÝñ=¬:CšÑØxa†îoK)Ž,]kñ%—ŽbFñ&Ý‘ 1{›·h—i÷Û–,€Älœ!“–“Å@:7t°3èâY\ÁÄ€‚pŒöôªJÚOqùÕŸôpÕU¡Ô|<ÿõk‰?„«EÁÊsó·>«£v˜ßDa Ýo‹šWÁ¤7DfÀ±3õÇð?¨t;ÌlÕk[ÏþÐˆÙ‹&¼ÕÉÐ’Ì“ùdÝ)O7kOoŽ”‚´4´5¹×á£iJvóùdä÷o‡à'€àöšêºã`6à8‰Ã8ƒút;œÔkOnŽ’;XêÌž—ýG"Ý²x*Ñ_ƒê¶øá‡óù„B+x'ó1p¯«“afÚ!âGññýà—¥Ù ïj}žD`ñ›Ø¿ÅÁ²È¸{<>‰&§Ñ`0
NžíG“Qä÷•Ç¬³ò]a/’cJÔ–ý~5ò'ŸÅÃÅ¶§ ºíñV>|T`ÞW½Åsüm‘Áû_
W ‡Î5Ì1ÑchÐ>´—Ûžp>9ìo{,äÅK·DN<!Eûkºáh†yø€þ×¡ó+ ¸%z™©˜‡%èÓ÷°ˆ +Ú©÷©–bÒl8Êþ°`š8ôÀèŒÕ8ÎaKz=|ÙùõôÍÑ~øµ;
È*VÅy ý«øÁªþ"œ"óÍGÖ2"1¨R©1yÇ@ÅÞãHÙ•±r#d®'	Æ£Ð(æ¥Œäåzq/¢U4æV*Ï¥6`s%&M®Ï‚)p– ºñáÿ®×ž}Ü€±T*«|GÅwX÷¿ŒßwvYT1Ø§}Èè#µ’Ž¶$TòÉÃ¤ÙFL›5•ÀÉ2­<±¸÷!³%7ak½"ö°·,DÅf#ŒÕÕa¿ñ“!T¸¬®¯S™XœÁÑ¸•v?²0>œFÄF–Èâ-ÿ!SÂ‹±ó¢Ú’I‹ù¨Ö	û®Tâfzvª‚ÑBÿ¢Jåþ¥4W$cQE—Ú‰ó½7â[–N—£§Írò#ö¾¼³5¯ùQmàÃGÖÂ"¦a9†Ðª~h­ym£¥ÕõópÃ¯^"¼—H¨b(Î…<ÁØ˜˜OyÎêJ76¼_ƒÑ­*‘çŸÍ‚¯!úr–îái`ÌÄ´½ó0Ig!++â´ ØXZpOèñ]JËbñÒ †îe/˜’hÀ®ÞtÞwMkbEXû¿¡Þ±zGuu=œôFs6µBE1Žh˜h­|pM ÏqSŒøbÒÐI‚EªCØáâ³ñª´Îz(?‚>èH ¤,åŸÕõŸÿ¹Š,eEÄ"=žLGaâ]á)ÎFÕFá8L0Z•ôÝ˜xÆ>N¨BC|àa„1@ßƒ¤·.Ãqê®w	N2ë1öîŸñÚú?kÿÜøËÇ_6Ä† ˜ÕÆùntAA€.ÈSóB`73u q R* Sg4ÃÿÂú†8ÆÓäŠÏxœVHP¼òi~C]ýQ4ÓŸ\„ÉPNR[ÌBC*!Ù§BlÖ²lÂ˜ßMÂ÷6º ÑÏégA€Œçðe”ÔÚ‡úGtCgˆ¨Ö‘•ª4«p©³Ó‹È’§4²Ô’Ü+ëóq~oHï-}×§¾ 0V×ÿ…“*¤€Dœ1¤Ò«I/c†ˆmCŠE“^ ÿñP×‚JÀm»ççPÂjzEÅ6(É	½ ð)í­"xÂ˜'$Ê“­’B‰2ïGM€Ûž‰ìKÝ±ŽlÝø©éõ Ë¾T‘R^Ûæ:Ã!Ë½^ý£$@cÐåà×µsõµ‘tHBOçË)à×ï(„=‰ÕÈaääÈqê¸r³zE’šz49É`Ì9,Rþn
›àX1‰äØñL
{¹ºŽˆ©Vý5ïŒá“Ëúˆ|Ï÷¢1²ýê=\Í˜—b<d•£ÿØµ™Æ»M·±«|×JÌ°Ût”›‰0`ñd!ÅnÖ=§Ã qâ´¯yð…O}—ðB¿U@…&•RïÕuF¾^õ}Àg©ËöüYõ­O1Ì:ô‚$ùì lÅìÊŸàã*h:$©Æ+G3µi€¬h¬j¶DÙ›þ\e÷yXæÈÉ4øÔ`á)úNq/ÍÇS!ÿÄ¹$äý¯wMïñÚëqeMÐSjÀèªÙ®ZÖ½…¥!æ¹f·+ð‡/K5.	~ÁmFÔœ4–¸jz1Å¾Kªˆ‡åÙ¨›3ºÎãù,o©6ÆWÈË–j:ãhZ»Ôä‡›°)/¯&æi<Æ5û–¶TÐj…©Rx…žçÌ‹
¤Jöÿ,„­ÀÀû¯_|öã+xññ¹½Iæ"ŒÛ eÈJ§ÀöÆAµ7a¸àû*]éMÔ‡†ô˜Î"Ø¿ ·=¤	Þ;	’¶ä^T¥ˆ¿9RQ(ÝúÉ±V
6]Px¹)CêÔ©~µ·ö%¨<Z’ëÓy<döÔô£±ùUÆZÔ®ÕRÈXXtÖÁ,šOµ6«YqÌ¢·áY'qEjC	øÜä05{d#^ó.àÈs4ºò@È57©žœûðÊKÄÈÆËáU9¸—Qèfç=Ækq§í©#‘~d÷‹ir b â¸ÊDýØNtIØb.$Øb6ékºÀ¿ 4‰		œÙáÎ)ì¹G,IÅ^­rT6÷AeM<9fi“~„–¿w•½=Gá4œDÙ“îd0
ãaö Íƒ°ËIÂ^¬>Ì~ôÂ ö‡òëÏþ™?‰ýìQgŒàxïO ËùÄŸxÕÎûÕ¼Ò»÷€ý9[@^ìcr¸©?…Þ?òªÝXnÐYP*KÿÏ
bª	ö+Þ¼~s¼'ýŠ¢>,éÉ­8ˆVJM‹~5Kÿ4¦Äú8h?Á_ÀÏ|è_!ºï¨ßK ½á$Eƒ+> ýÃ!öŸBéUOº«KU‘
u¥I#‹ýúø\¦¶ìòI*²Ò:ó”nì¨3K$úx?¼‚À“28±Ð¯?’	‡ªË$ß†ôN‚›7j<]³\p
*¬BÿQVÊþ€Yÿ2Þ€ŒA}r“ãqÕ0³‘øHÔ}Ö¤oðq”×-VÏÌðøwÅèÈ>â0Cmg?Z°‘1²¬™‰øþè^£èÖ¢D~gŽ2\…¾Š´“u˜·±CI¡3[ÔRlª5)$ÆfÖœÿpÒ.IÁRaÆ‰¤wpÿ€[ëä þÜ ï¬,xg7 ÏZ§$xbßÊà«q@D‡Ë*],Ð±F~.ÝQ©·j[ü¤5Š*Õ{F/vÝSkÌPAUº¶«£yú¨¤j ÙËm§leMyÚFŠÃ—ž4htcüÎÐkV˜zb«L
Tg‡-R¥…¹HÕ<FïTõT~	·LÍêž1æ¤7Q ™Tï”¿U‹¸˜,C–ågîº2gËp‘~ÑG©¿(¢ÔÙq‘l.£’ú0Ð+Óˆ©1“a|:çˆÔ8;,¤‹ðfŸ¥ìÀ¡JoY#	dß©ELXk:ý>°¤±R‚J1Ùô66Ð¡Küü¹Wåþ÷*ò°á@Ç€6jmC‘k\ÓŒ'ª¥½â.@Ü*"œfb$ØW–U®Ø  hVò–h8þªí2«õÊZëÌZKèAØ™f)¥¦˜T:Wû©3d?âtûQpi;ôYÁ6V¤6Ïƒ»h•µ"·K–¦[4ûc
,Ýst‘{N;·Ü²ÆCN©O’Íü‹>Û²[…NaŒ–Tãø¡d5rì§« 4êÏ•Ö`½Pz•¯¤É$ûj•u™C°4öõ£LfÑh¤ì$èÑù:ãÐYZ’U‰;pò¬5)ÇÍÛ(ñD?d«—Îxõèü<˜}vF‹“fy.©F¤ò[ËH¢c6¶@ÔH!âÕ¼dÆ4uhiû”ãÍ ÔÃË¢.êiiÅ™¸µN¼€Ý=<Ö–:L,½¡C÷¤bÞ™­2¨h•KìËv£¿õ>Òj.­RÆ%î&¹f=¿-!g`XZœ.!NgièG‰…¢¾°®R®hÜÚ¬›ÈW¥©QK‰qìðvÙÏÕl!Èæ
¢Žôæ  lQ-,4¿ªˆË¯ ž°°FÅ€Ô¡U‘’TZö„‘ÁÅIJtöò’ùÒÍ›*«ž&+Mƒ½_¼3LÉèmhãçA8´…ÉÎá
„
h0ÌC8O˜°‡‘QE(^UçbÛP¹ŠáÅ§vÃvT«ÚIò]q
‘³Z“õL†pÖ»+n µ©q•+-$Zèòoç&ž!ÔéÎäªËa#ƒ†T—DÕXåÌîIK56öë$ÇÔîVó†¶øáVÔVºRƒ"ûh£Ê_ûœ&¥å-þê@Éz)³1"…s#;[¾h€Ò•Ì,H²mÕíh&­F&Ëþ|<¾’¡¼ÍªN7M2kt3ª"BpªÛò%)ôm,é‘%}–d#Ìø¾¸™¥-¼C5#>‹Ò­ˆžecãFÌ}]2Å	}˜ÆÉqql¯Ó(Íñ8SSC"ØÙž®–ážZßA‘ÿ™¢ß “"Ã«ì‡Æ‚ÈÅähÏÕ–:½’9^¤ {=ƒ6|ÈpËúÕŸ$™ÓœÖ)§ôžnA´6o¬HZŒb¾ô5Ežðü6‚Í@¬—ãÔ
5¤Ú4p<†¥ÈXÚ–Ä¶çSq4ˆ£Y[©!ÌÚÞŒÓcãò=PqÞ¤ÅœÍ¤P6H8:yA7*¬Ú¹‡–Ä{¡Ÿ‡ÞìÌßü«£÷½õ·ÈÓb„ÐÆÞÜÒoæEåDÄÚOy„z,$¦K{~ZËlk^¸×—™œÒ`œc³^ýRÛ±äq/D¿â|äÎÕ«åÊE2v¨˜R¬_¹5¬ûÑ¯ò5,×èÄ_cæ²dÀ–5¹`¿Œ¤ØþRåK¯šÞãÔ—	;Ò÷!’¨G‹iR‘
0A­‘º>÷ê\ÊÊdQçvŒ±š¶1á%lLö•í‘
>g¯ú­ÃÀƒ]
æß›Ê¨”6rçZòµ‡¾Ôz&ær†ªaÛÛðlpdöNY.ñ:8w0}¿ Àø1^3/i÷Ç×ù%Ûí)1ZnÒLfW²ûQ{_ý+†^«ˆf!4ê³Ø +£•Ì•a>	1Láx,=c€ðÔoKOQÍž1p\™bÍ¦¨R 	Ø­÷La3¨Uó1þ`}˜ŒGU^MVÙ@á?ó{Ÿ·½4ÈCÊÛ6’”æ=¨ÏHqXH„&ž4 Ël}@÷ä`A¾;§‚jì1¼[Es{4žÃŸ]©UxðË/:‡EØã ÁÕPã†üÝA4INÂÕ-ûûÓà’E¬66ë–"§©ú	{ð~ºx[ñ§ë¬Å§5*–r
O±?íßÃ~2ò«y­zN±_tµ¤r›NOàÂN«ú‰“øïäCýûO×ºÄ¥ÇëÓþù'YÆg4•!ä‡Í5ÿÿcöSÀÈÂÉ€ç‘‘¨ñrÛ«g¿®”_8Öm¯¹õT~6éGgoÍzÝÓ(x–ô†^5˜Í¢™Ê†£Q°N«\ÍÚ£±KÔé|»²æ±j%øÞÀÆû*e/Êbì"š}>‹¢ÏPý¿Nþ{}ž„£xŸüË^=Îïû‰‰‘xXéê?f@4ê[zM7Õ}ÃJ]~`|ØG o-4émzè XÁc
°)5n¾Ìß›ÇI4ö¦ÁÝù)†*:‰Ùíxd3€Û3ÐÖéžìå(¾¬ý+®Q¨U©‡Þ,ð
ä‹¸ä“",n‚Ÿˆ®ºÃ ³µŠ¡u^¦K$ÕŸ"aÚÞÀóÁä%òÍàœÅK`áé+Åd•¶Kgƒ—âRÔs†ÉK´
 CÁÑDóÄ[ùÌ±‹Þ˜ÿ`°ö>-)B^
›ŠÔ%ó©ËD(ûÁ¹?1@'°UËnq¢®Ù:¶ÜÅã·$5qãŒ0ÉÔÖÛŠ*`‚GïÎþE¸ÆVSX¾n§51à	Š1ñ;ÍHšU¥âQÁl}&Û‚—Ð%EŒš©ç¢ - ³kDØ¶Â”™«Oe&ðlVdÿ½øßÛ‚8Ö­h£.—@:Ùö~üQ”Âßò{F/r	öÄÆæˆ‚ÆßÄò¿j$ZÑEhªäpRA
¬¬Ê`|f	nã·ÓròÛ‹™?E©¢ÈlIãN1KzˆNo„ðuÄ/{‡h÷fƒ³jzœºM…“Ó´¸h±è¹›¬ÔéS‘*Û€<X ‰È(V‚Rî”|Ã*ÀÈÃ¾‚ ó	Üm}@gËh2üåƒ–­G¾„pšàò8‹¸(xâ^ÇT …Â•Îü_…˜År*àäýp>¦°Ô¼¨³'ièI4ÅaóÕTI†!Þ‡ë)èÈ:^ÈôŒ«#~óúHÈ7¯MLw¹ê9sÇ™Ù:Ù±AMûçï¹h—ä˜p’aª¡¸FÜ›	WI\QLJˆ%l3ªš%“ok(.ÎÏl[(¬1Ò«¬óZ­F¢¸¾í½¢›2øDî/LF$É0–ÕÊÞ»·'ïŽ1±Ü¾÷ú¸³øöµwòk·{
Jß»ƒƒC¼êuö:ûÝ7‡{Þq÷ý»ãÓ
¦‘c,9ÉÉ"P¤Ú°uí¬Òè6Ÿµ^eSP9 Æ.A†–q'Ð·¸bQ²3,i*v6æí)‡&](~(BbU³¦x!6UÂ‹4&òAuÒæ^G7Î@y”Md&r¡x½ŠIi…zÒ¦%†Ç0ÜO'õÉû%æ3õf
ß.ð¾¶ÇÎ@ÿâ¥ñÝØ³bfâZ |…œšd`<Î‡Oƒ,ÆxWúíF§²øô\Œ‹ÌðN3Bd*ÔàtÐ8Ø<x&QPJRwBA
¬yDÄáÈ'"¥µ\:j˜tÔ(MGÍmïMøØ·÷j„YâðiG£©q@ uLE_¼1Ç{²÷ë»wGÞÛÎ›®±´	Ýfwë nb_ÌÛ³AÎ^ìT­”Þ·èK_Ê”7Ù”·ùT»G+ÍîÖAç`Í.bzêSt*Æ°Î÷c‡ýB|Ý /1žt;Ç="äl·ÓÅvÝ^5í4ó‹*[øET‘)kÐ%jjK_´—»ê›´ÄòªgZŽ•Þ²®ôWö•þÊ¹Ò_™£<î¾>|÷ö®&Øì@ŸàY0àÑŸÒÉ-ZÔnà÷ÿvxò àã]ÿø.prz|¸gêO÷8 4&ô’;ÀI÷M÷ä´{gÂ6 -Ú#îyá/(;ã æ;_#’#‚¿J¡Êš·Üš§¼*ÃS,èºOyeamP%1Œ¡®ßSlÃ™Ð¼ÐæO8«´´fag™—}–VÓz²>-n‚~úØ˜N¼SÌ¢À­ˆ±ùPX.ËdZ¢i·NòÈH°õ9‚¹Æ½O¥1kÜœ›#to»Çv¥‡k£õõM±änq2lep/µK±‹Õ‚jj‘š…õ—LÓÌ*Jü¼…¬GÝ‹Ævgð|@¡i7‘ªq™ Ì}É‚…aSz³(Ž•¨±¸gåíåÌLÏrß>?Ïn3=šöXçc§mïäUÎ¼fv¶Ò3,M–sªõ‚¿X† ‹žÀÒê‹¹¤¸‘@/ô·‰•<:â»mùú§êíÂ~±¢vºþ‚'R¶iÜrOc«ÕnlnæOcvè˜·âhDŽuž@ûéææ“g. „ÉHBÿ®ÿ¿ˆ¥&+{ZÎ6qÊü’ŒÀ?iÓçU÷A†‡Xl‡”µÇëŽ§CŒû¿ZÈã^wÃ¡ùæoðçµ›Í9GÐ~ÒÍEÿÖP¹Ä;×eå7]=%ÖÂ=­„v«µµ×É›ŠE±Ü±åû«¼Câ8:òßvŽHqZ´4¬nãUÛÉ|-ªDFVM#‘¦hpX\(<Žîÿg3ŸÐ¦–â6#Ä”MË†ƒ¡÷e`'#š"5	}©x]ìEsÊv¶«»Eó©‹çÚùgÈ>WÞtŽºxÁ<ÍÒ ÜANMÕY…ƒ®QE»¸l©ôîô×î±RG½”Ì«|T][ÖEqÙŒ#‘)¥cú©pu~sŸ½`“€¯5õL3ùQ­u‚¾˜íðˆ¼‹È{ŒÍ0.³ë0ì¥Päq”¬åÌÿÀAiY;¿I«q´Öl¦=W!§±OLJ6k)“‰¥Ä¦ÌÊ+Ì¥'Ñï‚è ·(\ãbf6¯ç¶6$[zíÉÛ3€€Ì²³Ôwˆ¦¤½©_?fXðÊi¥2ø_^+×99“¦­Ž®¬ÈÕÂøm”¼ã¯w­žèŠ[åKÃùöÇÌ‰ÓîâúEsÞ.¦YÇ¶l~â¸I¢äš²{Wx.Ç¬`¸ÏÚÖ«­Š£?zÊ<ÎÝXÝ<ïEû(„ªZãŽÀ1­~HŽ$»Ì¿ùîxO7õöL0E&Â®²18cF	T-Ân»û!«Q…^©õêYc¯±GKWœ…ëÑP¤wÊPrNäY¶{±>·TpÂI†Nl‡#¿š(•nzs‡™ðÚ/©²¿ãÐÞác=XA<ë~×{F\±»w°°™NÈªÞW6JsÙŒ¨ÍÕÛO·6ŸÊ3µš?/3!®`ËÅÙ×Z†7#¼’ôÓ²}·bª',J®w§[îU%ÃSj[—M§ÿuð7tÝq^NÊ¨Hçi¯ƒŒŠx{œø/“–RéS“Q”ÔÒKöù`ù	¾žDáeÐ¯6WWSrs®fr%¨èt ¨J€BU•n÷ ‰ÇÛî­V•Ötëi«ÞiÙºL—€±Ü•ydÂ½®q‚F0OƒRÓ'\ÏM!Œß±¦²i”ÚæS)=Ñ§SújŸWiVµ†•™ÍÞ•™Ýü¹us6çÚˆqÞ÷:›â•½§ûÍÜVSÆ–ÁptåáyZ;c\},Í®‡¦Wk1Ûö¬ñªñŠÚç)‹H?ÕéVuÙ™¬Å2”sÝð—_Òçió(ívÐ³4F/^ÕµÔüß“èwzS½	‹¹¨ò¡ò#Ó™+¨H²¯ê¶íý8T,X–Gn¸|ÿ6õû´)Ã¬H˜_ÈiäO)$‡†³ 0­Ú‘1ÐkHRb¯½‹¹þz‹Ïe[±W¶bºòõCžTMg½ÁBk¤î=ä]ì=[c&3þ˜?mÔogiÌÆ$¶4œFÝ;æ.Û0§Ø"<ä Ö7ÖÕ}3ëþ‡¼r[XŽ’ ±õÀ¯í¢³n„Ñ<žqüƒFk+xM7^ùÈ.Ró¦ÍÓæÈî‘ËiH~y4LX¬ÈûÙÆæƒ55Â‚eÃj[\§³wb4Ãéå¶×z"FÃŽ?Ð7$¯|³-Ê?¡ÜÒõ´õ ÖÃ}@–,ÿ*¯|#-ÏŽšrÛVGšÙ¼*¢=ì_z›«¹4¥¡[ë?á«3%Ë˜‘ed©…a”Ë”éê¸!:~ï'x†‘Ð °æv¥™K¦<h™Q^Ö§<ÝøW0és¾)¼ö×²ÆÖ@”ÐÅ‚XìC™.(²QPk³0	ÂQ Õÿ$WúUr\»‚Ç¿PãßWVëèNÏ.c0OF¾bRÙšèÿƒùÂA<Öbtw¬mÖ½q8©k1ˆï`’f·Õ«C…‹!ÂÈËšÁKñÐïGµxŒùÎëx¿ÌÇPñRÂ\½Qÿ0'§Ë)ÖÀY€¿µ'moˆÿ^y²ûÍú€*R—ŸãáðÙh>«µ.G^„sŸ\ÕžÔ½Úx†émjãÿL#ºS¾"…Õè@ô…ž›VƒiZ{âûÛÓÚ–§¢Òw¤oø¸Ç5¶‘1c.ö'ÞtÝoÃ>cŠïß ™’DØ:SJóØÜ& …†}_Ôð:–‰Xoæ¢Ö@,6T,²ñüç“z†RÀ£Ù±ÿ©f“ç4”©‡0èÏµº‘&ygoNÏ"Öß½ÏdFÚ½n¶Þ†63ÁðŽ%ñÎ°)–†ÕÄA¤9—é#Ïg c2ó{˜½–4±PÿìWå…’AbgcØ4ú›Ý‰Ä‘z{–„ÏY¿ Vèø“`ÒnÇðN±d0ÛÙ˜`ÄxPDMD¸xÀ¤«–AWaÂ_}¯åô´xZÇ’­÷”w 56e‚SéÉÆIp§— W‚™„I¨‘{CÔ2·U¢„V,‰ºwÈ ]¼Öšxªâ©Æˆ5ç÷N8™ÎÓ„4CîVzHègÑ¥aóazôw¯­éƒuCûD“½¡?ÀÊ©ìV·#Çp5XO|PÞ“uÞÍª½A…a ¿h‹	R§¥U7YÇyÔ›ÇÛxÛIzZ±t³aÅŸžÒœšÿÐ¨O/?–ZHÒÄ~_HHpeCßÙ 
0Ö¶Ér4t¹èšu,pc«¾,y‡äê?En Ãs6OÐdøaúGaï3Ì¾˜ü4CdË2ÁÀ×Ÿhñ˜ä.ÀtÎÉg"ÿÙJDÿ§ë4)&Z•[xû+]ù:éd+Ü$ötsLc´l­KŸÖë+‹OúÐÍ™o‘ƒDlL<Ãô]L@û;›€ö÷5í%&À¡|—'åæ·I uÏ$`søŽ¨àïÃh[çÝ¯Ät&(Íø÷5Üö;š	î•{Ó@IÚ¿¯iàÞÆßÑ4p¿ç³Eû¼¤³¢G/1‹Ua˜£MozUk®o2«™Lö*q`ecSê;³§)òd“„6‹Ù¬ø”}n;Æµg›B¾Ì°»ÇŽª~dŒ6¼DÍ·ŸØ~êè,ŠiN+¦Ú
Ô&Ä:MËÌ	Eø?}Vö£‹	æJÏ™•`Œ–å¾cb‹…S£[~äŸÊ‡,55šºQkœï^ëñq94§RÓ#f
m[h‡BÝ°>Ðrù1³ÌØ7ÞZ·øÞ”ôD4ÉL`2Nè–´×ÇM%ŠGW'ArˆŠÑ¯§oŽv¯¯½ßÇ0>ÛÞ'¿Å‹ê>kÝ8´û+†¡Á+Ýä*Ôi{#Òê˜ÏÓ01úxüÜpùjÕ.‚³ÏaR£¶Ù&¿æ÷Ñµí—@kÞáQìO’ç^¹Rz?	]j7&°úÈŸÆ˜‰Sjó 4€ÿÿTžS+µ‘Í¡W²È¯YãPozé‘±Çû l×óA¦pUåçmÛÞ&kÁ?ù%-î‹€]¯§n¼å¾ ZE ¾ óÆùæù3;@m@©ûiQ§xš ýöYþžmŽkvÆÀËæ×ŸAe$Ãž}ƒ‚°ÍÏ%ój®O¢'ë¬wZJîZò¯OÍ¤)}½ÞøÙ{w~’‹wÿyC®­óœñ0 â€ÜgF“5Ã†Á*]FÐ-`2Å‰@mIÝ(ÚÐ:7M¢\?.)dŒ¦(©"Ç¡ÇÍ¸‘4E•8ï}ÌÈ…qÒ¼N`‡=ñ[ÍjÊùyyÃ(ŠÕK`ðø÷
´R»Œ¤é ÖLPÅ[V&½9GoC¯¼°›ÂX»ml—‡8Üßæ–-Ózæ>—¡16d"rÒGå…#|»¶¼R«ÕV„²›teÄ²#>¦«§?ÜìÊëv³ä`÷ùEÕ‡®|EöAÌ.¶~‹gWj—0?(â©Èrø!˜trÈ0ÕZråãËoµöE‡ÛÓGi~ÇC™|£akÑRî`]4—›m
%óf[„sxÀÙÖ#â<øÈÕH;ö@;.L+¸>áÖŽ¯¦ž %vêé[×-ØÆdNÚ††[Íž¡R&v ¦µ›)ÛRcqö>_q·Œ×ZÖÃTP±Õýmf(P,	öÓSØæ ?<œî^7–Îñ
ïvÁhçÐ§ß‚:±àž’Jp`;’ÊÆÈbÚ¦†}…Ã­ïßi#ú7Z®Ã÷—+´Á\Yc›OÛ+oÁãÔ.^È÷Úw6’¡×š÷bÉZ?_Ï÷9¸Ú½ÆÄ¾Ü³2<Ú/¯*ÈÅõYö…¤)¾êt’êcqÇxµbPéŸÁŽïk0ˆÔ ìNºã Ü5%«Öòˆù¥Ñ-Réû1I)~6¹d›Š»Æðë`²î¡Ÿ¶G9‹X¸IåÆý°Ã=`	~Žíƒ…§³›òÀÔCèÃS´{”ðn°{œ,Ë%ŽáúÁÌP ïŒc8×Žãò½}AÔîuöA¯“}ºQŽo_¨Véõ÷ngý@wÑ7~ì|@Œý6cvñ…§„†ƒ	ßõøßº‡¿³¡ÒPyF¹)•"#¤åÄ_¥'šØ*ž‡$¥qâoC"’¦)<–,dãýQ’Ý÷ CÒýƒÎLOºo0(ÁŠI6‹%A‰05Ö³¨%£ý våñ/)•X8éµ|[_Ëm£O7—´rj¬ÓÏ{|XwhX{$‹_<SÄ2—H«ãœ&€ÜGæn©«ôa¸709"6„î.”…A.2<ùL`iûÒ”|‡ýKësüðK%t[ª÷ôÓÞþ’qû'ýÞ2~}c0@tÄEÞÒô%ß‰ÜóYîËÎI~ºˆŸœ'Zuí¿ÒsKj«föúoò´G#—yšüáSx4ÆUÀ¬úFî(¯Œ+¾ÍÓßô+l3½U€õëë›¹-˜¾²×‚^×ãÄOæÌáoåçÿ<˜a0„wó„2ÅÙÊíÏ"`¬Ì*òèQ8	jÉ&x0ôTë1î`îîÐ—·­ü¹.°ƒç¡‚Ÿ;=å[Qî½á)®š¥…#‘¡¼Ei]Æ}tˆ“|%v´˜U#³ÏœwÞžt»ûeâT+sð%OÜà*šá©Š­ô§Ž/þâÎ1¶üîýû;À–Å:YúµK–àÇ¹ß²‰ö)Í¤0Z‡7Cïâñ äO®èá˜YzûÈ±ÆGÏÆ;XóB§8µ`NÅÙ‡ð£{r½o&)/²Ò,[»tèýSbNÙå½¹Ûºþ4¥m‡¼«5ËBû§ke˜£¥¤AÊ²¥Åd‹Š-¹†¹Ãk§›V3»vµ ÇŒñÃ÷'º·Vo°Ž	ÌŠºGÎ‡Ò<²ÃšOo7:ø¼*ˆJV­×‰Œ´»["6C5ï€æ©ŽÅÊ‹kà:ZAuª”K‘NVÜ¶‰s°ø¬¼EA7ª~[Dç™+Añª–€ø2­÷ÒÄÌzœ ~5Â	”ÃÒ`™ë£§¸B>eDk‰èã^ru	l™K ý-–€†AAæe‰kS¶OƒBáÍ*=oÚ|Óª) Ì2¶1öq’¯›p]æ³"ÍÃ/&&O˜™‚ÈÏÄø–È0ê§Œjq#¤î/KŠ£BaáûšÝã¡×€ý>¨…Öq.ì´oÖý4þŽ¯DÛÁ!×VòUê<â¿Ak6†²,X»Ã­˜ÌÞÀëDHé)+ÀÉ1³åà9ËvÇƒæ•®PšœòH©$U<sÅSd’mC¾Òj±‚lŸå˜¬-—þÁ0ŒË¬wK>pýÃpVgèqìø“X‡Påò Ïã‚w—é#%Sè2ä=û¾sr’šTþå¨ÎyxåÅAçðH©
é†~±Zu3*'¹ÚÍËVnÈø iwÞøÙ; XÁ©[sÿæåÔ€ÂGßÙ…6‡÷tH¡Áã1Åã1…ÀÄã1Åã1Åã1Åã1}))))))))ô÷Ç¶Ïã1Åã1…}Ê))nDÇÇ–cŠw˜žpã·	$L@—Ï?°P²>žW|gç–i¼§3•,,&n}¼ðG?\¸££…?ÇÁBî¦öþ,G
9xz</0?çççççççvªy</x</x</°}Ïn:eç7¡ŠÇó‚Çó‚?àyV#1éyj(:éRo¤_¡óÅ?œÏ'Õf²¿r/¹¢C×xrÁ©2^ÃÑä4ÐgíFkô‹²ñÙïW#ò™=üa±í)mù‡–6_‚ÎÆKö·=Œ%=¬yÌPÓÓ¡L(+ÞÿÚ,‘š~‰N‚>ýx?‹ÆQ?h½bž}Ô{
 ¥˜40GÙlqmhÂR·¤‡;»)ÖÏÃ°ªjLiŠm¬nëêw”›“‹h¼<//æ*ÎIQ<•ƒÎ±Ýþ¦vrù›¤.ÎÜL“ýÿ   ÿÿì½ëVI¶ üÿ<E”N’pƒÄ¥lø`Œ«üiÀ]§—W9‘”S’R•™2ÐjÖúÖ<Ê¼Á¼Ò<Éì—ÌˆÈˆÈH!lW—UÝXÊK\vìØ±ï›*óœy~B¯Ùó)ÌA:ºßh‹=³¶yËˆm÷l$aïóV~\®læ†áLˆO~ ˆáñ,#‚"•ž-'¯¾*ï…v~›©–7hÒ?µ¾u™u¤Y‹íVÇrÙ%#ÅŸë»ž[CïD™”´ÞìÓ(Bxó¸¥×ñu˜ÂpÍÀ½AK‚$Ø>‹÷¹J^.Þ‹ªèì²èl¥¼JFüýê?ce¤ÙØ]š»Þ¬“LìÌ—Ìà=ŒÉ0ø2Ã#'µ€nµKC›Z5W·²!Kn›m9ÈTN˜ÕŠV=†V×/²V‚t¨'VJWÁ
í)â°ºñ*IœÛäl³S®a&	p”n¸Qj \±!aLÝÆþqL^ñËw3`ó†Öv%.§c2nÖhu7IpiìŸÃPþßŸVN²Ñ-™Äæ"³Ë¢eCc$NHCâmsÍñù]v]%Ñ€àÄ¡¨'`oñ³GFWÒÏvø–Ê™ëØJ)Î™ÒÕî‡Æë¦”ýfX!°ÒeÝ× ô@õŽÙ®(LÙÍëõŒŽR]Ê!«ñ£¾zÍnCnV¢³7lË ˜dæ-bm©túnÚ|€Ô·çž¦ó¢W€õ}av†—éÑñ’Ÿ/LËÆË„
E[Q5”êÚà‹Ñ¬°)ÓÛLÕlµÄÚ
Ú} &Y«cM[oµþšx¤üžJU¬ÔDvIQ™•²+Œì9Ñ¨p’Ð)‘42k11}­
CCõûúôx§ð'%“»Ò*-‡xnÀ˜»ÐÛÕÀÐ¹+†sÌ]3J3ŠÎÀ0öt_À`ê‹àö¡9|ž‚DTÚì 
8‰Á‡{ó®h^„KË «Ê~aPüuFeãŽîeÜU³o±°iNfã0‰úÍU20áJ:‘~°Ø^~ßis,dÝ=c¿¡“ù®L.\¢1WÐ—¼r$²avF¡¤ƒË ½E€lTÇ{ØÒ5:RY¦7æ27±\ÇÚÆ4ƒSŽŸV™zº	™›V2WFµ$ö-k­bÍ>Z-k¹Í‚†YÞU³¸o×y!ø©[ß:÷”š“È4¯j­žñU§¡~ü‹Oe#˜Íé~ö’<1?g%èz­åm+m±UÇ¹º@IÝµÜE—^dåM¥+–µîEkŸcÙ) Y|½¤óŸ/¨±±Òj*ÊÛv«`ÃWse­ee5HþP)ÈðÄ¬;»ÿÚ>.sé•ü,#†yX`~^&a:<¼–Jn[Öç†ƒ¼—Å„ÌHûmkh<v×1J½§ºÖè¡¸ça18aÕi·ˆméÖœÌÒ0YE‰ÇÓQkFuÿxu‡¼Œ’ðçöˆ Ó$¾R¶CðÞ	û‘ëÓ‰¢OŸ@·«$3ìÿÙÃÖùÂÝf}ž©ªŸ£!û~›ÂÂþÆÑ„] uø~Åºô÷Õ,`ÅÛ_Y¢«	4ÖÜoåÍQ3ïø[Úùëd"÷Ýj*O‰Š®ôÑ3þÃñ<ncfå€–ÙwåéË`”†òÀ3Ä	}ü¿)``˜Öd6í·ð¯ü*…Âá0ìÿöZêõ@¿jìZkG——XóK6z²¶ûø>m	]?ÒÛIŸ¨–Q´Y
Ø´a˜ãÖJÉ²G6dû¤iL­,™…’Ñ,Kn‹&¶;ìhpQ»|Zz…=ðWxô÷Y˜Ü¶°¶ÃëÖàb•4Øý´±²J®Q;Ójˆ&pwoþj½Â“£he­îŠµ¿³I0E@]QFMöq?åàù+¶øpÃwÚáxšÝâqŒ{|G}UWoIÈ®[€µçÃä5Ém<#”ì7:ˆÃ”LâŒ„75h®Ue§ rdmr2
‘ðRÀ×©µ8ÁygX1žÝ¡ƒ%t}±Xl Ô¯ÝÐ¬¡Ìœ%_»ÓABç¸Wš¾>ÉÂA˜­®F*õÅFj…K­=æ½ðæ÷p¬ù;y¼å®æ¨tû©aR©	…t-ÕwiŽ8e/€&l•‘€È«D¢”£Pè–`ýæ”¡Æ%¬l6„{ùZ·ÉÛÉè–`-÷òû£ø^š¢e‹>_Zó;¡±/§eÒ+ÿVñúú:y‰ÃdÄ<]•ìÙÒÎX%âøŠP‡ãAgYˆÀéÁNÜOá@ÐjŠx¥Æã°50y³°—AÀƒ6~i•„ï¶-ÛmIÚ}ëõ æ·ÃqØýÿ¦i¿'WÁEüŸWx£ÝÇ@€Ò‡:Õ`t&ÉâŸ¾æèq§]Nv‚ý·¾+A:ÒOJv»ø©t@BžÅ—¹’	î3@N,Z»ÆGU÷ï¹]òïw¤dý!i_±R:Ra5Ú!§tÊŒÈÓK;€Æø’Ü‹­ÿ;BÝšFê¡m<è†GjiÆæ¾Øãw|9%æØ6k"áàauå+ó*ÝÞr˜iñ",œ¬ÀørŠRŒÕü¬ºŠóHì½ÃIdbgª‰OÅ¤ò!¯OD:|@`ŒûXyv@®#XŠ`BÄØa'A¿’bÁ“€èrc=°i‰IAdŒ“L;ˆØØ®s[,ùXEc8N÷°¡søÏ2Í±àÉ³a8)9+Ò¥¡£^É7IAÙïø·»UR3ÿ!È<m©–IÑ9}
^ä &µz~`DVE“‘h†7íJãQ|ÕjHÏöŒekVÈLò–3†Zò‹~Bç`+–#S'Tà”4Bume—­®L%>§lRC.)°FIV4¬r0 æ#^ÝbpPžÀÎŽRÔ6°Ç bý8ÐsdQŸî(dCÑjÂŸ¡½Hí°‰ƒLÄ>$qhíèàS)$Ö½Þ!ù²?×¾û¨>Þ2Äë Û!¹:¯ÎÞrkŽF§A4ø;l°t‡¼ï~Pï…7Ó(	S¥1üÓžÄ×-ÌÇ°±½E‘Þ&üÙîˆ?ÝìcµK™ö)4«Ä_,C`,„EY(di2Eéo \€‘Å¹ÌD4IurmÝ^ú£sÊ‰iƒ_ÆKÇ¹íqjûŸÙØ¥óZ‚8ôfÜßòqMIÐt^çHðQœÖßÏ‹YÜ-z^\âªŠP¤Ó8Î„”ƒËá#<¨4Ñ¤›„Æ
x€Ü¸ÃÚžEq íÈÙk4Šév”!>Ë%¡v`æÏ¢t:
n)±¡MJW°á¢›gm¸HÐüÏæÊûÎÚ+]êÙƒ´©hW¦ Ð¨6™×[hNÃ	.tSÂåv»]¹-¡9þÜ‘¯ÝAƒóÜñN,&ÿ‡!}J‘¾5Àÿu5_Å•U±ìhRŽæ*DXÍB‰<
l¡¾œ’Ä3î`øÏŠr¢KL£ÄÒ¹FU/ƒßHÜ§Na@dgTËË»†–éX€ôìP~ì¼=GºÁ)=¶¾’SçH-[7×]µ‹¹p"WÌs•fô¼bñyÁ$…àEô¬Ó|È­ŽéÁ t†–¹xºÖy_®™—áýOƒ~”Ý®mvÈ4Ž°×µðj€Ö&ñ$tx¦+w×7I‚ÞÌôÛõÚû­5:óo…É¸ÛÑü/F³­T4!Ì¾ËeÔäýçb#ŒFãsÙ!U{rWH+Á$¦(TžëÒç”ÇWM:<æˆ8º*æ S>sUí(Žr…ó›p—noè·osœË—óíšîr×øbí±ÓQÿz­»vÃm?‡ /ßµñÍr˜ÔÅN›T±Âº,F\Í\½C8_™Ño£§ýÊÞÄ×z >ý¾as³Rr³oìçf7~Né^Ö~^©º€0ËcÍ(Fj$ÙÑ dWa³#MÄLG!Ý¥Â©ÔèEºaXw““fŒæVAÉt§žÕáMÙ¢ÌWÙdör¢¦æaÌV•ŸY¹5”äÙf©vdÍ]Q™SÉÁT]¸rZ+ƒcêó“”À¡¡/ò©#RD¶0eÌêvó„Y¹73ƒB9
ÀdÐ®µÆ‚'ø’kœó%ÅK‰Ä‘ƒáK.óòW™û¢>Ä*Ëê/¹ÒÿÊ¡>%@qÅbó_b­¥›_b©ŸÇñooµ~€åfrÿÏ ‚JšhÒ¦Áè–ßà™ñ%±À0	rn›?êAƒóàjùðy! ñ{_±êæe®\ÃIÁ/é«B·À„`|9*°Š[_Î†Q8< EŒý>˜PÅ$²ËÛµ-³  z\„#Cœ@w‘ä²Àêâþo4Ü«ý0ê«Ðt>Ú]§ÝiCˆ&ÓY¦{À~
F3€³Ð·è^€÷CôDß›‡Ôè!{‹µÂv$WaÖ¦¬<Õ-²D§o‰F. wy¶]-€»¾-íŸx–Ñ€”ŽzýYº£ò¯[4µ^G¥†T?¤GÊq,E¡6ôé–{k&{#ºU"õ“H%]11h%çeYÒ¶ØÃÅ*&=Û„kñLÆ&<XòÄ|hää›µ×§ÇF$µ¡iŽ¨½SºgÂR4ÖGÐÏ¢¿mÇQù™Hª¡i··¨e"
”œ†˜yÅãyýýRDªÙEW:ètÔž3% †ËÖˆI»ÞÕ:Úòx*´U¤’)[=ÁòXRáÊîÛ"ÖdCŽhlØ­ÿ:Œ’>ª9õ4."æ+ÂÊþ¶ÖaiÂéúqù„+ë@h+?J*9È|Rèê°nBÌbHAr3¯æŠä³8/yÞ–R;¸›–pµ)Qõ.(	¦Õ­ŒØÞ„¸YŠ—ˆ¹ˆZ£f``²ªãälR4)…_Óiã”¹–1N$øD@¨h~‡v»mW”É€4ð9Y¨Ôe”D)¦Ë …ãÿç?Iy9àâwâ¬¦Þ^æsMc+ôaæ6!÷T&p¶h |›¥mÇ‚jðñèŠ°¨êƒ×ÞwÚOÐY^1í¡‡Í™_ëÏ’4N€‚fkÂ3³n„¼Ä9dŸéAB»¥…]x˜(ŠO{¬»>¯U‹þ½©8CÑF!¥ÈXëJÑ¦L_U¾´¼‰mÁ\áñˆCŠ~8v£x‚71(¾ÅW˜É$†81Ø‹7vH‹µDê#ÌHó€k4XZù¤Fyû;ÜyÆ4a[ƒ¡»<ùê‘	ÿ¦ºô¼›0²×äÔcv×1ø½¸ÎÿÌg-|IHàÖú§Y‡15‹iÕv=1MfÞ›£QY/r¹Ó;—ñ-UK~a•­‘Áh³ Æ¾eãä¬Neƒœ—ü²ÌõXóÜ0·™æ6sÃ\.ƒ[Ír„lN·Ø¦ÙNÇ~|Ö:8ÈZ'›ßjZîcœMï±,Sk±”Èëçp4åì¢Ñ§çï©“ÛÊdt;e.iÇqF^âÌT£›¯ÉY¼ÊÜ¦4³_ÐÌ?&MšÅ@iúp’Ž£¾pŒ#ÍÁc˜
‚Ìï$¦¡)D]w@JŒ¯K!:ÁàS”Ò,èˆ•FÀ ƒ`Ó–€(q¿Vt`‰?`k’•|¥M0#-˜øŠID6ÊÇVáX“ŒÍr±öÎWIc~O•çÊÍŠå5›5,¾2£¡ÂØÈíWZ>#«.aÿµxu]¤þ|üúìBJ“*˜uÎ®Ÿ†ÈrÆZIƒQßž 8ã;b[yºÈ‚¿XV)	@‘:¸´mì>»Ž<`^Žd°1ù¨ÇÅšRÉIœdÁHÉÞJ­¦Ì9•}g%Kx
W6$öM†çÃp¾‰Á¯1™X$¶Á+€…¬¤Ä˜FÒÑ÷Ø<‹Ëüê0¾~†ƒ Öx%JÅ/ì‡=s8ŠÓP~ˆ†‘£HÁ ½ã?ùøi"ŠOÏ.›çc•gS‡«ìÛû2d1Ê‘gú*x¨ËkQ…Ž³<H}„äNŒF‡'tJ?üÓf"¯†>uevàôA%0-‘þ&‹ï—ýcYð¹¶„2ò:æãdS6ä¦¹tI!Ž2Bz\° uñKMpE«QY™»GÒïA–á@"»“D°ñp$ìIØÄ°s0øŸ7¢DõðXÆ’Ã á±ýÊ%wÌ>¾.e=QÚÐ®W7tö²ÛÉßÆ¯Po.V™èfD±—K—HÎÅVÉwÊ*­±´CðÎKÝé™Š^§Y (“Ò®NØw¥}ºQö[ï?ÈC…—N‚Û1Ð¥/ŠßÕ/óCí0o¿–.( Êu¢[J3ÙzöÃhš±Îõ«úì“Ï±‰Él8ÚE¥9í¦uvü¹P™a~Ñ9K>¨#J^Ò°ò°¤Ë†Œ°)€ 5MÍÂSWqrkhR½ålößlÙ%Xð £	ÏÚÑ`%÷ÿ×4J9dÕ¯{É ¢ VùÒ5òµú•?Ö¡Àëëä§ +n"1/¤+º0 žšÖ8{õ"./‰ÓcV"½rRM†¦w¹%-ló³¥Ô™RPÁi”yâsÌ®4¿rE*Ë9…gú˜k“Ê&a»ÈË#|ãw€.ä?(a… ºDƒ3y0ÅÈDæàˆ†‰÷4XDÌi/*©l•è9}'T·-¨+pN¬ÔkŒ~!@ÓÀ²˜`å@Ì;Ãòë4ÑIƒ†Èø’lt¤	ÓX6S}
)ð’a¨íFÇ„QÕ#
LÑ".O´‰ñ; ‰^ÙŠœ…™M€ô¾„Õäçmqà®p’Ýâ?òˆèKžp;¦<pZd-1ÖUÐ®Fˆ²¸ Õ’3 êÐ>#\4£ðð"öŸ•7ÑÖ±ˆ(äÿÐh÷„FÁyÚg„É·°TMLÓ3GcúŽCi§˜¬¬’-\5ÏCâ+0æVÐ¦ÍÐø{kœÓˆ OÐËÎN§Ãîá=(J´ö[»0·váÑWÉæÍµG4W#Z À€|ÐJt­cO $¼wÅÝ*×5kk+œPó<’Ÿ bìè#9¬‡£`&Ž‘sq‡Ñdüž$O\Ìå^µäMªAñ¼@%ï£´±Ì›Ë¶Áh˜\™è)!qÊ.SwL>
€ªø~¦oÒö‘Ÿ\Î6²mM5DS6„UçÆ2L˜Ë¿	CÇå‘$¯!Ÿ†;—Àm†Ä1ú^Ñruï<^ì%]t/ÓÂ"šÍ‘}EÅñä]Á.e³SÏÖÕ;àŸµ…MÙÊ·PöTæYèa–‚¼‚[8â_/w.Òíp#:Æ¯GÆM°KÈ^H'¾fdyš¢Ñ¦r¦á•Ò¾ã¨§YSLª	íí5sá³˜­ñd1-¯à­ÒK4þ0¡ð„‚Ê)~(ch§´ÜsoE¦É\°‘wÑ})1¬ºJ€ï$žTEŽ)—$É5²«/ÛÑD<¡¢Š¸ZB©Á{£Œ èÅA_½lx#DLwò9>,þˆÎmç=#Ë<ëÃÄäQ§ö~«i.Ýyc
pËÔU[Ó’Ék®$™ÌÆ¬3)ß„ãØ@‚Õ­b¢\Ñä>«%]ïC{1/én¾šd­~¥ŽAZž”7 AÂ7-ÀÚÈZŽÑ®–%×ßÐ#vY3ežNåÝ!L—\™‚ÖMF§ß—Þ§š5OÕ´ØÊô±F9×<Wá–dDøá#;–0=;Þ•ü-ÐRØ¸‡Á§(N‚QcGgÖç,ïi<ÏŸB=ìŠ‹+¸Zrl4ÕÂ²x«ÀßfÊFÎ"Ìµ®a“®:†Ò0ø…| ü·6”üµò`hf'DÎèëGÌþP‚‹¨Æ *láÏ|8ô—6þ‚.¹nÖ	™ü)Â8;i,¹³î {hÃïÈã„—Ál”9Fñ–ªƒ6bæm"¥£Æpm¹ù)FáäÃÙ2ªq	9Cl¡¢|¢ÆáW”òž•µ‚4…]ÞF9õIXRMµÑ¡N>QMÓäS[llTAC¬[qõÕ@bö¹ÚëÚŸµË²ÒU5U	¼Ã-ÏÂDÏŠ\!òÌU-e1{šI•¾ÏQúRß“aåê™ßC~¿8V‰,kM*[›ÞU3ËÙ	ì‚‰rc½^â/÷+ø»*	°TfŽAU¥©3ú3Ý¬=vºEQœÜ÷ÛàBàU
g#oB/}PöozL†¬^¡!· ª2ËK^¶zZ´c-xÓdZ7%þ6W¦Ùv-Fï'Âè]òfÐÝœ„33‰ì®»†~*äÚ-î*nIc®â/¶j(.SU Í» ’7p¤OÇ;6|Êë²ª2¥"h˜jÃìãcÂ…¢Ý¶æÊx%m ?,,–Æ6qÖ½2ÞÕóYØ1Ñ÷¢¬g4Y»¶õiªúãu`®y³	Òiî"ù¾Û£	Wx½GÝ$æøl«çâ¨·d»©jŽq¯š®™+/H-ª3Bi J¹ÁžŒpÆxR=ó„^üd«T(AÅ[9D‰G•2ápï%îá[ŠªâÅ0x)93ÌAjàzÒD–…N2i¬œ`+Z"Zö–ø ÚY1T•ƒÚ¢ÁžPœÿÊŽlÔÒ~e ª^„7,ÑÔÙï3,[¸ðRü¶ÌÇÉ¦
Ö<
¬ìÌˆ>p¬M…;ogYÍ«ÛD
¼ÂßqwDü­uÞé–y6÷4Çcä¹bTB'N¦š{ªõb”q3qÏj8«¶éYÕ¡<×-4R†Q)—*4›KJ§ãcÅw¦€â©Ð‘Ø\{ÍÄßlHI”6snV.N­N¬"Â›ó=Æ#üŽF1Æ‡´ì‡ÃŠÈÄ·Ú\yßýðLd¨ƒ³ÆQ•¿CXö>cá3óEün˜qfŒ&Ôýí;â
+3É¥ü.=zlÛûN»Ž?Ø`VÊ- sN1¯µœï›0ŽÏT@ØÖæ5«"daŽ6•aÕ¶öÏþNæe¹ésbÞbîU-1êö:üŽV„¶òiü þarëNd‡|Ä$d!VÎ+½v÷Ñ5s©?[Õ>75PÐ+/ØNÖªßÖ6Ëq¯Cmá¢×·µH*Rr†¼J.©¨ h/ÿÈ³kÐ˜R‰aÖ1¾ð¾·c!Ã¬åQ8àª.3Ìlëc¼n*l‘'á e­‘¶£DãçëH¡š ?s—(æ€'äÑºFéæ6_§®±]Å9i¥èéÕïQR—ÆðØêêª÷|k:*ŽîrP¾êÇ.]uÁµ::2Ôµ5Éa‹¸&LJ¡/¹«@­Î Qy–§(dÃ&šD?aY=–¸)ÑìuLï]¯T"}×I0uR¸N—]:Ì
P“ƒ‡õÉjš’\ÅWÅ¿)¹­¨‘.Y8£:6o@WçJ?a+ÊÏå†:ö\þó©µcEiùT”—äZfj/gK?¥ò…º›½9Gi\5µl-Õøô:M°“¢â¨
ä}w“>ßÏ¥`Um®T!`j*QåVŒ†Iðtg*}ì[–}”;ÿ¨°‹9•Ð'(¼.¯Ö«îyZÚ{n@Eí›ÇëMWÝiã0Jº|”X$ºQ0`†ÎkòbÎ([VoÜxi=ë\éåo¯ÞÍJðŠäâÍw“ß&ñõ„§cª†´«à(û”*Gñ¹µ7?£ä	a9YU®Â¥‚«ÓÆ€t}Û"t£Žkªg)sô®t$1(›U"—¹‹Ë2Å¹£gyáCpQÏræ½<¦¦©*ÞJ‰ß–JünFµùjL~?Ï£}xòE×óL¢všìžsqV¨õLû ã·m%‰fœ¦{=5¢®}+,¾4"®é«Y›<Ðêk\•Vsuæ%÷›%ÀV—R
Kó(€ý¹ÖS–û²Kjç=
w‹p¼XÕë¶£KøÕlJ-ÄñkÜš‡ò?ù,"=¿šµ*†ôU®S4Pk,R´í`·ÐWOÍ M¯X—6‹ˆZæ_M’mãÉuŽ=9¼bûTä¹’-±$HiÈäÈX‰ý4©ŽìEêá“1 é$ã*IÒB0­Ô&¾€ B5^>ÁxçwLÞì'ì}±€¶P­G0cƒíFüÔEŽ’t..=,bàÇ%Çí¾ ¡xy`~( Âqã‰5hË•âÂ‹õëä°ßÿÁVŠAiKåÐ(×åKÏ–¤æÁaK)¾m&óRaTýÃ½Ò±ÏÏ‡@øWáe›º[Q’B«™R(}Ö~Ÿ²xlGÔåŸ=ovr5~„²õ}w•ôVÉÆ*Ùü€Á‡E6‡÷VŠxg`±ÂÜý1r¡rjÅô0*†ð=¾éž4ºŒ®f+k_'2ø¿ÄÉo)ÆÐÅ	‡ÛhF¾Ó<­YØ.jSaà<H=^Hgã1ÍlwÜYõã8…£›`Ì¤NÀ¸Ã/£	;¶Êì£bÐ¦çbŸ;Çm×=\~-ö.@;uîÄí’A½D
W^u•ã\¶wy©Ñh~4Ùæ+±±†¼ÒžÙ­vºÒ ô:*
Úš¿è°µ©ª¦5E-mrsÄ$wýã˜i"9Kê¶­Iý•µàp>iÖ6fçE%3ƒYcÿï’I\G˜òÄ !€§qÅZí	Ñwd§èÆÇé@ÛGÑ]	3×–ù·JÚÏ¦
ñÖvQf@üZA¿¿*{Å©@z^œ’Ž_b(®VxÅ{úü‡R|‡.Þ»©iñl{:K‡-1ŸÃÞu x•Ìi¸: v'ôÐX-òhíù¬=¼eà	QðÓ–¶&Ü|ù¾€Ó*ƒ¬xà³•:ÍHF¨=P²³˜XMž¶’˜’„*ÞP¶¡,7e¡°±™åü˜æq˜6,	tn>Ä*·vÕ4m)v¬ú£ç‘Ãµébñ³^ÚÐøŒ»ò`½V*
ú,
™+J˜o¹
ÒÁgjyœimîÌ5>:–ßy4òïœÉé£þM×±UD‹‹,_¿¯´i>êUNX
ÊœKÎ.FQ:üI0«¿À€fç 8cL¡Ÿ¶È˜&Î*å³0]Ò"Î°¤üG€¤4È–"~K~FPtà÷V	£åð•üEô½Š(¾nh“Qvƒ²ßñâ¯¬E;ÊJÉÄ©•ªé`ÉFáÏ(žbji,ö±i*Å¢~L®Så’ZåH­µ-I'©¤=—d\-ß+Ò}»´‹ŸÊ­gÔ	™CâÍ÷é-ëoÓ¤éé9õ¤#e„/÷DN'³+B³ýB3cjèÍñ»Èú1~¤ÂE¸FˆVîë;/øXPg:oÞØì5g6ÕP<:ž5M¡†¶zù†æSNëº ÐÝ^ª`Ô†TK;ð6fc}G[ï1Èy}•A~ðTªØGx áëGü„Øs:•êµÙã8{{‰YÀ‡³+ìä…ãÈt]>d°ö‹ñ™hÒÁ@ÓÖïn»øø=å)©çŸ]ÓDþÐ“å÷»:¯hJ×ïÐ€ÔD šÒŒ¶æ¯Á2Šþnqý±}dD˜MŠZBÖ^˜ÝòÐ}JšË3Ò©¸7f·4}71äâ.‡h¡®¥‚ÚSá
2O2nˆêêéžÂMÎ0
)q¸a@+>zñá“DœÇ%Ð/á;€%ÂEl˜&Ý èB31ù"	ƒß€A ‚Dƒ	ÌúÓðG OªL?¦XÒ'ú	§#v;.Ó½üvçI'>:,½7µuZ¡2U-ÖØ_«9@dxõÕ[Þ -®âÀ?x#u!Žª;ÿÀM³(•²a¤õ:&4
Ñ6HG‹Úyqr“¾\–øøïÀ:M{Šä1.hþqŠåUM,ûnVg˜ø~ŽÂçþùq+w¬•ú…Ç…(ôLk}¸?cHœÌçûÆZøD`Þ6l¦ƒOWÎ@5Î/¨šJ(¶`ÂÔÝÑo¥r?b®z©}¬(S&Õƒ¨xÂf´¹[i•Ü‹ÙgÎuš´âKÚÊ¹VzôžÑúØ³$dõŸÿ$ó;nT£)s>­8ª"›l‘²e<—+Ca°ÖèŠUŒ*x \Æè\ËPìAÀyÔŸÃz³\ÚÙÔa:L'˜†Å|.šÊ7°˜ú|•<¬(Õ2´Ðh€1;N’ølX’æ=±êJÓ)pHˆ”ABs	ÍWe-©@bçmO·¾tÓoGý<”Ø(„:ƒœhÜq•#ÏB%^“,«²Ç-?`nµøýN=¾¤\/……µ¨Ò:ÒaXÒ¶¡8#Éå´ªÔT®A¯=#Ë¹4äsÎ9ìÈ>S&˜ŽµDX%óøŠ¨FÎ}9øjÛI7~³¼ÆS‰ú1UÖcaª:ªªš[iù5-U×z®\[‚Ëµ¬m4¾"iÒß+€uG‚QØoVrþ=¬ÉG•ñnÖ†rÕCV6’ž¶k´`¡Ö°uþ,«_ÈaþÁ
­°¦l)ÖO®Há%RÃj;³òÁŠñ•ipÐ„½¾º'úò4¡•6_°t‡uÞEÓô5 R|Ý†¸Œ’q«qŽ5xîa± Ï+ž(ÚGÍïóae_g´œRùU×h¬Jáªx×RsÃ¯Öì–÷‹“¡MñöÃ„Xgø%æ h9-b¥ËÙÇð´±´¬ß‡•ÍËkb‰:´«¤ÉÀØ\%ôÖ‹DÑàn] /çÀ»ûXoìÞÏú>YiÛSýØ5, Û#k	2jðEJð'd9“['%C•Ô²( (Íô+úª	s-
Ø>\©ø¤£”\­úðG|æ4Õïuo*þ_¾î¥Ò;•ž¾ò³^ÚW¯SÊ\áïôåáˆ¦…Vojnµ|Ñ\^ëÚÀÞM%7_oW´z‡ŸSaêä¸Ð+ÉRá`¹–@ÍÔpjuØ€¢ìèw9çíGš4›Š/Açb­X»—Wi÷“ÖåˆUAj5éý¦7¦·‘¡6›4¦³Þ«A¿Nq@Íh\…ëj¾Oú´¨.ºÂ„´d`MÆ(O™ŒMäÅxñwú¾ãk7$ŒÏÁ·ê°¢6Í}»G&á5áÌÒKhë”^¯ÃmÞÀ…nü=ÂùÅ¤.ÃXŒU|Û›3sð<k? | Êè,±z.Â¹}AÞÍÂ½1¨Ôl«ãv?ÖíË3ouØ7RäT÷ùp,ÇÒA¼;}Í¶Ÿ+Þc=ŠÔGâì»g=¹QY¿Ã¥Z=yŒÁÉÔ­á¹Òýˆ»òUat+4¾"uŒ•¥)Û™«2Åð«qÒªâ”cðâ|™IoñÛ	ÿí„ÿvÂW¾ð¾Ï;áÍŸo'üŸñ„çúŠåðÕC”Ni´¯›Ôj<›xaGg¨¢yÍr\Ü’ƒÁ§(ÔpÜß¡úg”¨m öVíw,î6[:[bžøAO±¶S‚>èY {82ôÚý*W$l5»^NqÞ†)43ß;æpÃ¤Ý[ž{æ¾NŠ¨å
¯«Ë4PÊ0 8:˜²Zü;„¬œCeçDR¿Ü]gðâfb³ÓVžóÝfq§y|Å$ž„¸|lÓÕŠ­SeŽÕæÎN[©%mÿpoÖ_9%@«í{ÿûO"!ÁÃ{û“sø'¹·…îËjõ3-<L+B¾ä7[(Çøý51¶»BØ]UÅÁ&©´['žÊƒœEâá€ü…\(pjƒU¡pPÄ„‚OtJøï¤êí"÷÷ÝLÂ5GoÖ	$óVÚYü2º	­^õ„™3¡ë	ŸËjÿÑš2h¥Ä±±øîÍ»×ç¯þvD~:9¨MS6©Mo&5_ç3†Ó¾e)Ì•¿\<Ó©Eªö–§Un”²·º±º¹ºõÁQ¥ðäŠî49`³\˜|²»G69‡_TPY÷.ó*xTâM5Çé¨Ä¡ò5ªv@kØiÊ˜gÆkN_,›Þ}jó²^©­9L½Ò	ÕI~B™bžPÃ’lÀ…ÚrûÌÌÖX*ŽU],¸Ÿ:S<ëCªÅm˜«ÅÙ—H™ˆ“+7¤cp°{%VØQÑ­"±€³BAÉíø&-
'ò¤y?\À¦Zªq³ ãí‡¨ðäíQdº]Û¦ÿÞ8Ü"ªbiÞ™	—^Ÿ»Š1lå(™,ë/
G³k< H¦ÀÐ´NYwQ
,žIÖŽÊ#_@ÎÂ›HÞÜ‹Äù\®<Þå”ÖËH¸[äŸ¦iÍ“+zE•÷^#E-sdÂŽ'ï¨Þ?7Â“ëëÍLkñdtKcH„æßÜDŸ'1‡Î©æG$5·uYè‡öŒ:#ó[¨×Ú›cÚM#‹êY9¶r%µ¼Öõ““hŒ(aÊÄýw0K¨µ=QÖ¯Ââ;£ˆ.ÙÁ(L2r–A;´¸Q©|•yRÊßRí2qC«^ÆêSm‘\8ÙÌÄŠºßZ|J.M¦oäbLE)`QeÉÃÓÐê¼ÖÚ#†JW(=W’ÀóØØNä- ´.ñ„œœð:%”ÃÝÑˆÛË\Î0™‘“35µ!Æm€´ïâ†@¾cfkç,59HÓ¸Qt#-ì
QÐ™Ð
ªð»ŸÁæ~ôèS<šM² ¹}ô¨-æö§¨¦«8Ê[ÊÕžÞœÃ?˜^=“kbÑbò¯2KoXv¢4ïÄ—yZÂ2ÄöÌöGSÄ²œýíèôÑ#rÂ•l8¼ZEß÷à6„/Ð$Lh@Xá ¶Vˆ5¹&4£J1Ï¶uê×êr1Â¸oß„Î”ü„L°çN-…¾¥cÿÜ`µ‹Ñé^’Ö²5?L†gÌÀßÎ‘—aHÎ©ÿ@•ï_ÑìŽÙ‹„nÅ)>§ÕÓê·*Ò]cÿÿþ¯ÿ3ŸfVË÷ué›»1JÏ¢‹C4£R-44vÜŠ"m N±iû2_±Úf—¼úÙ´Ýgo=¿…`–W^Y•þžÑŒd;</Yë²Œ2–ƒÖÑÚj#%cU”¶[1dç)õÄ ¨#”dcÿ%ìù|˜.ôŽ+’âF¦¨
ÆÕùþ5÷M zŽUÔºËÛZzÉûnµ|oåÛAÙ_S)Ÿ^kÊñö$ˆw¿ü<bZúÛxÆ˜eX,8ÙðŒã|óŸ/OÃ~M³”¼Ž¯®0pc¹è(eÊ¸?>*ÈÈiÍ—Â«·——°r#LŠÌ ˜„WÀNi‘°$ép4¯‘²Ê$„¼ø“óanZCY°Jn^é×»Ümu–gu=kQURrÒð+MËÊ)¢Š'9)¨Y§VÍ ½©kƒåí×Ø—{5W_ˆÍÑ×
zAÔH]1NÎÄ™EŽ÷
×1zô)ªx!\§S«åÃˆV»æ²¤3zÐµ[Ñ­òLUYgªZû®ÓÊç¿Î,YÎq,øÄ%e‡&áï3,5 Ãž¢'—.Š;S~TÁÅ ðppí–ð/EÖe röŽfç>øá8ë0\·fNý †ô`‹Ò‹Ò¥Ûœ+|CúÎ0¦ŠFë2LS„™ÍF£Û³0Ë˜×Œ6ç}6äBŒÁÙ¾‡èRUQØ¾Ô´T&˜sÝ^‚Õ•ºž+™C7YÍ[Y”jé°¨ýÜ+—Uƒå—{ÿÂTrcÃÍÒQfÍŒz5
f‘xÓ«¶2i!å#b+`t”áÒÇ«3mÀRhW¢ç6%û™Ÿ½’Ï­IÑ7½¡Œ# J§¨ƒ«s¯þÙõòIzNÇ;yšgª¼ùá:%ÓQX –ÿþBåäˆ¹½àÁQ_Ð¾Ñí^Ì¾Î»ÙµÐt'§"Ïï™ž’¾ î' 1 c`qMïvË2ïQzûÎÇ}ÑôÑfJR@8ºªBˆt™þ¦¹4¾ù,ØAË²O‘ùáháôf)¹±¯hkž×»ë´'¿AÛ<îÃ®ÒTNõŠ”êÎHßØGý?ö¬Ÿ©èMISKlÅ3‰ÇÆ†g.}¼Æ(=Ñ³Ò,^|ô,Ju£	M»oñgG’Úc$µK
½¥Òç¼2 ¬¬)´âX`¢*‘¤ßŸ@ïRcßa”ôG¡ÈÛB­x:é^>Å¦™„õs-d^-Ùíî»¢­%­‚0[f]$pÉZW÷[ƒ\âW ËX"}ÿœ€ð€:º3¦ö}`¸Új^ÜªõjôÑO!;œ„Ô8}Å\ŸÏS÷*;çÊIìÔÚ˜u´nÕ/WePK>×Û“QŒåaÒ:n(ŸMíûy•º¹F^çØ˜þKVìJÊ¿¿…	ð¾hgJdC@n ÎàP}/aÕó5:}ºÞ‚•\–ªW3õ,AÝ«/f”£¨_ŽÅvAãïñŒƒO!­ƒ1F‡Ø`rËKcÂŠ³,Äè€“{ú¨>>&å/üÉ^1KRþæ	\o*«ÿìf4)µN@ÏeWTÐb;Ã0Tà,ñ£vÑMô˜\¥Iì•‡à˜\m
#ö¡z]î®gÃ{4ñö”0§ë{¶CYŒeL„¹êž0‘Ž	¶÷j‰{ÛÅ÷›¢K„›Æ£=x$qcâz5*îfñàÖË^"ãâê±P…hŠ›šT¦ÕeMÙð¦]Ÿ¢nÝG¶Îˆ7=üÙI>‰¯“`Šfõö”ñD÷¬jÇÚgPˆ'±%g«C{‹¶îÝ•A;N;¸Ãc¦_¸}Í™¦ì#pTõÌâ]&³I¦Á£ÅÞw{ÈÖÓ	õÅÖZÊ´ê(Õj%ÃÖR]¥avbW0:Æ×œad÷Lä"]†$äX²¥Í·!kŠ^°²XoŸázJO‹ÂkÁº{ß?ƒ®RT’I¬€â\h‰¤‹wX§ÌÃbœŸK,ò¹\	2	ûtÃûœ±“Ë}Í@8‰²[*ü4‹X WMÜ#ª P¹&Þ1üù'÷)(¼>þXò:ôy¿Å	\}{þ÷Œ­?‰ÖÝÞ#® àjFä8Lx!õUrQŒñJŒœºï3¿:Œ$ŽÇ$–f0Š¯XÌÁ8ˆh9 ŒèÕOòéõUäÅH„óaˆ&E1ÍÀ´€i¡Ì@“²˜†äy6àG”pÙ(Å0«.ŠËÆ7YÊ6 ‹òY˜o)NRÚï-ím:@O†‘‡ñ·K0¢ÍàÍ"Fa–¢3&˜Oc*hxÃ,à94"]Ícki\Œ.ªá$ÊÄ»ô¹°¹ôÈ…­¯É“•9W¿œ^¶«Ä\:Ž=?Ö|ïžr”úB~¬¹:MRzœ
%%x¾p”H>ŸoôW…Qá_6F‰úPÜ“-A<i£@q'·Œû)Ž‰æÊ×„yxÚbÛâpúŒþø_Î‰ì)ËÆ8XõQ˜}	œøŒ¾.Œ;ÌúÑð”g<øŸãÎPQ=Z/"Ú—z£ÙRˆº˜ný…Eß7©v~Ô\UR|(Š¹H¼’£­Käý
šÕVtþxsàÐ‘yQnhé¼éK
KfÕb*Ú”<’¥Ù Ñ»×¸Cî“6´^´
mõ£eãüáÆèþºÂ”‚Ð¢‘d6¹‡Suî%;¾q²P„©T;¼íÂ¾ûN•­»'öeˆí2˜8ÕMñäæ‹ß›ó"yi˜”šhå‰ài/n–Šˆ¹cE•=|t…>T	Y¨"Œv ¾5û³t'žeÔÍƒ¦e—0ÿ:ˆfÒIaÂ®ªº÷£	U	oR•°}znûFÌ¼NÙR4‚ ê¤¥jÁrS×ƒ$	nÛ—I<naü³0kAkGy&fØqÁÐIVqÊSE>‡a0YYÁ’ÈIÖbÙDÓ[{ˆ˜µˆ¤·wÁàëþÙß	þë5§¾;Eì*ÒîÚþ‡‚úÃ‘ YÛ%fñ´@´}Oz 6ó&ˆÏB43
ý(‚ÖL!gªRtý–„ô KFõ[aì^Îëæ¼ÒB#ÊF“Ä4×o)Î†¨}~‹ÿP¯%Àv|‰’ëžÅ¯ÈÕÑ³G0?%+±š3
ÄîS2»‚]¸IÑ>¿:sxÜl™ŒÕËRµØþ¼TÎóÛWƒV#—
Ö†Ù¸]£¯6Vžë?	“ŸÏß¼vÉab¥·Ê2Ò¡¥b`|ó|„;ðý:s‡´†Ùx´Ã´Ð™Ó—pH¼3úÄÊ*P«8ÅxR0rWYó"6‚GméévN:ÒÖGc$ŽÔ3è­ÚA(–V:-ýr|PýÌV¤Ü\#ÿý½;å'kÔsivëý0!ÔdÎ€Ë`nwHó
 y¦·)Hk³¾“„º$º|J¦Á í;ÉúS@ŸQœìï†½'O	=9†!Zðw:Oý‹¶´e¸9ÐEW“Â.Öi+÷Òšç±û1lëñéMoH¢ù÷°>¾ì,Ð,/kŸ·MÁ¾CØå:íM±¾ù\ 5cwaëßðCÛÐÌ
8tó™nÖke*¥þ dÎdN‹o\QFdMàÈåãËà²_Ü9œaL÷Y<)·p¾rh]î…t{õ&[¸iû¯Q›ðS®‰þ˜sµ›gZ%Þþ5ßSO¶jÍ¹à¡ùŽÊk<ïüuíM
Läü>Ó9:ÕF6hX\µ‘šH«‰óœ =Ù6./ØÔ–ÒÔöæ›/j7%ywmm^nn‡µ¨ªª‘Ó°	¯–†v~¬×5Ï1¿ßtÀ¦ÁßO™e8ã‰b¨MÖó2Áÿ?EÍVýÕ-s¸áoÖØïà ‘àI ÂÒÕE€CøÿÚ­•Z¤7£T““Þ,^`”ÐDWk¢&åFy¸Lÿk6R¸í“Gä/ðuLu“Ü9µhŽ]¥2)Ç ëŽòÊ :5 Rˆ7/´»îÍåíVx—)Ï¢º„Žb¯A}&£A6¤{¥˜â"ªhŸšŽ¸þÅ`+ìJ<×Æ¾©]Ûì¢ŒÞ°T.“5lc8ý¯Ý]yêK¼©"MxÃÞ7YV/î=$^Ï2/Hy9›PQ°U« aÞJp	Œ%£Ö–x„
3-$	5

æÍSÝˆÞrfçÑ8ŒgYËÝã*yÜéÔìÚÒ¸ùè)TjU…ou¼Ëù—B„½ì$»ëž[v½èQ¤Ò(ŒŠet¿ìÜQŽ›®Jªgò&«í¨¸›ü‹K^È¥2rù6Å¹ªP‡0·Ç±n¡’,…¶y¹4N'¸ ymî†+²‹út!¿Ž¯ÈÙ0­*á
/ç…b%sµyÑ‘˜™¬Ü¹Ô@mÑk‰Àºâm{¸™SY¯¯²zˆ/â‰¹a«Ã†Q'òºcÖŽ¸+iÍ^aË‚æð±=»ôÑÏRF‹´Ýn»mçŽz•d‡XuU¡‚‘‚òêø”ø©ŒŒ5tyñˆj,5¼{CBº™+ÉÀ¸:°Æ•ªÏ¡_lçgå™=ËXZsl¶TÑrÇ±ØÑªvJ^"ˆ**húÄöðYÜŒÃR(h ‡°ShSß¡£2úD'#*9k—\¯ó Q\ä„yLSÍ>\b¨m÷8fkãH:´`Q-WD©m±]ho°Ð˜76÷J¿(i> %ã¯ÂLùžã¥3äýyS…ÃŽ‹#`í±Jw8(ìÕXx]µ__ÅÔØK	ÈûãW_<:D‹v¹×gÓ8¦ì+_uõà¸5
3ôe'ixH£<÷ÜµÑL A³ì7ZÁëò	_$S‹VJ½°Ò¤ÍÕð¯TÀæø²ÅÍûÁ˜WA+XeuÑWc[A»Ÿ„npÀS­£¥™`å×ŠÇ.ìUô­A‡‚õ
6úM1}¡"Ø!]WÃ.nÖqË+}c‘½1Ï]-¯-{æÎË/l”Cî|È‰4T+ëuŸ¬’‹g"®œÙÌ/;¤âIB‰ŸË‘DŽÆÃÍ?zgž‘rJÑÿ’S‰1ô’aÇ?§T»}qå“…Ó2Ôk*Öé_e$yó@^XeL¯øKÔäç<ï¤5žKø–Ñ…Z+8WˆI•y]ùxøSˆ–Jïó«<NÁŒ~U!sAâ×Å$sÝ4Ãs¥›=¼Ù›Œ77ðæFBo~ü^iù.Rp`ûAÊ{¥½â—=ÑAÎ~ŸMíÚeq zZ.\ØR^Pc:G¼ò¤H5ãùmçGÁ6°ÂÌ{l¹æ®õ¤“ä†m_úƒ Æ¦²cš›ŸŠx©èì›£Ñ/‡¨V§g13 YíL.8QéNè¬ºž‡Åˆ}øËˆáLñZÕBB_¼pÕnÞ ©Cÿÿÿ]#Ï¶xH#AjÂ(Ë¾<á:©I§–‹œ^Õd+k…ž­¨i¼ï©£:áM2ôÀõÉõm­Uü¸o®iŸ%}ÔúÆ0Â®ZMZJ,3MÂ5–Z¦Æ–‘´#>‹^™nÙoÉçUâ®ß.öÀœœ¨vMP¥7U úQº*|+’çìœÝóÛB³=®]šÆâ<‰‚ÉU‘ó´wW ‡D§áKpXŠ†“„¦¿¾EÜYÇ,”Á(óIòî›%ß°wèxŸlut¹G,nÒg~fœIå³ê´º2êš#üÖm®*|°/ê—›Ü&+<1D¢tŒÚµþ^`8Ä>£Ëˆd\
º3)6šÈùŸ£dÀJd“5rKŽC”*ÞîÑ·ÏB¬T™¿~&Q<KiÙˆ—QAÜyMb`Î1¡1Ì«¹L©Ñëè*e´)}¸XjÉóà·p²4ªµ
”ï.x¸ƒOäPãRžœH^L•ç†[xOK	o*Ä\¸Zß4ÑnIÆÚXÊ©h\Õ¥mö%!^ý2_ŽªSŒnþK*§±å“¸D¾*’}Jx`ï÷UºÃõïT’DÒ{¼~ÐôfnÍã0e¯Ýêl5öYÙ=rq‹¾åI<¹ª,ÃÊ«¾…é§ŸßæƒåÂö¦Í	:nÚî¾ß<P£ò‡nÜž.Ùa’2#"êO~Ž@«rD ú¤ès@FÁm<ËDÎ Ì¾JÝÖO^¼$Wá$d¼œ¡ËÑ`Ï9"/×ŽÆ7ÌX¶9Ë”7W@Sßuô<op'·¹pð{Î›%_{à¸3[þº¯ÁeæW¼¹I¯â X@“¥IîìêÚÝaÏdG­#×¼ï´{[áøƒ4©ÜSç¼ð næÀX±—3ê„ÜDh¸Âv›Ü¸‰E±3˜ÃÖB¾&ëŒÎé4œÎ.0Ýo|IM­'ÃhM§ÑCÜ†½Zs¶ÙªŸÈs6Ì°É\bá¿¦ÿ\7Ô¹v.»?ö:¥G'§çoŽŽÏÉÛ—äèÅ»ÃƒóWo+¦Ó-—\¹²Õ#Ùª˜Ïæóy¬Í§×ÙîþÈŸù…û;7Ÿ`Õ˜âk^å\ÊÇV8±>,Ç°['Ë‚p Ð³|æ&*æ›Ï€ùŒë3€ö´‰ÃâÓ9iUyNÏ¥$¡Žßœ7¡lŠä["±%4žE°xÅ4sñ&¶Ó\¥ã¢²è!õor‡q¼‰ã‚¼ïÚfÉí¸ IÒÓyðÊ¡ "^É[:åÎ·jfòå¤Tî3ªFiÙ¶E¥õ@§¡Ò¥õ~¢â9x¨Ø'Å
Ð¾Êó~}tpz|tJŽÞíTíæH£^‚¼™v½‚Þ?v:ª¤"|qÆ˜çK7ƒ38ï>yUþ$pzôòèôèøðˆ¿{ó.´^Ÿ¯,ŠŽìÍR±u¶/Ehc›¥ÓB_daÔ‘-{”L¼ÙïjTÐ‰ùy<•iò¿0¢¾;=Eáìè¹ƒ%RmØ6.·rôMðÐ#­Ÿ¬ _Ådœ!Õ¼Ü­|[ñ…Wüè¿Þ¼:>zAÞ“çË< XòÜj¥Å¯ã~0
ñçto5ÃÉÚ»3xwŽ¡¿Ó¸ŠÓ¥SÌÆa!c€•2¤(KÞGj±Uyè–‘YB½3øçE”mB€1OrF©’eq»J®b†Úð¦ÊcrÉ“ŸÛ_òÁÝ%íw|œäŒ>ršpNÉ]+^yÍÀ£šÓ¿¼qù-ŒÆ£v*ÈU>0MçÂU®˜ãqgpa8×ÓÁ41À+Ôåùiòè„ÄhÏ×Ä®²$R%KÚ8EÓå®jõéœ­À_H÷®Mx)òÃÅl4zªøŽ!{‡#:0énÞâ¹8>¯÷ëC{¸òÙôqbÛÉÇ¾ÚÏÛž‘i5°@z_s;;Ç½Ð×<ÃŽ_¨W™KØéîFoÜÿüÇÔ o_¾<:>;ZiÀÝFã) ­jš§Þ×åš¡„È˜Ù]¡ÅùO¬•UT”gäã¢³¤ì¦ñ‘ÕF_ÊÄ},	”ËÈ©1UAµÖÏ,1%øáëƒ³3™f—Ýª£‹@–ü“œ½{þÿAc;Œe_-/P{y*è^Wîp¬ãÉÖ6eÍ±CåRÖÏ¸´9.7-–w?.©Ýr™.ëƒ;¨®ÁKŸþRõÛçgG§£úUòúíO¾dajTsë§“4t–è®PÓ!ŽŸÆCÆQ\fªí~^h¶¨-ÙˆžU(ù hgV.n]n\^æä×ƒÁöeèIf
Y·½Çƒ'KAÖWÇç€¤ ì#–þ@(™;#çÿãèØ¿$wmœÝìwO¶¼pV6gûØª}˜JKµzÆÈ6/Z
ËŒFË9xrûîNnàÍbÖ‡)"µº²­—y×¹K„dì½ï©]õ„]†³Zxk	Ü˜ëºC”r¥ŠÅlá+ÝÈËý¸#Ñv©§§Ñä4?óƒÅØ+œ',iözE¬±:b‹´pMLcBß¬ZÆ’ØhSüæFi“]@3JKÄ;GlÝ(½Y¦˜?VRL£-Íi>x€êâ&RégËTôYoõ£aÂ±.l§g´¶Ò,©Ìì_­Rý†ÒÒg‡?¿}ûšüôîÕ‹4ë€ØúêðèÏŠÌ˜b7…coý8Î˜£õö¹.WÖ=ð¹¬sê»ëXP­8êvX>Ž^–AnižÒÚ˜è¿p$ƒ2³½ûæàþû©xæM<FºTÍ‰Þž°žé‡0l÷„©¥tŸI­)<À¿éO`ZÞ8¥âžgÊÐ[—Á(-çÙîó8h˜êgE\Žþ\”r²…52÷æY2+…:]â‹`t<Ÿ‡ÉF:áßÔç‡re8ÖÏGÁä·?0Àµñ-PÇ¦èÐLT,ÉÙË®!¦u/³‰Ò(u÷v"xy~ÐÃ'- «ZPÕà±7W—ZSÀî^xv×Kt#¿õ2(ç–PS€%JÅ#ø[î/ÿ"ž“Ÿ™T±7Ç¿ùÕõ¢÷ùT¯ê«­^éÆêÈ$šÀ"¬u”LY’Š’xŠ…‚ô=ùÇÚûÞVçCuÂÔ2äUío9[ª*ÏÈ)DÊ,šft%‚›ñVÞóð4•‚ýGõ’°zµšÛµÇºs¨a€ÆÂÅÓ›5}½i–‰ ‰¢«eGÔj‡m&(Ý˜“ìÆ°†6?úMjf?Ûæ@Bk>)s(ºÊ›Ha´¹¿/JxIt1£.¼-Œùh·×·ö©e=„1‰»v3 Ë„!-¬”ƒ²Ui)?›	Žÿ% mÌßeÉ§fÀËŠ»Ç¹7ò6ÃÝ®î}N¢ƒ5F¸7t%ÆžK97xúïRÂôˆ6"¦ÁE×§» [Ùâ†àÁOÐsfMè€ÎÎÞ¾b:àÖÙÉùÁŠÅÕÖäd«¢y>˜e«±CW¯ÉéÑáÑ«“s‹Ã«½ ˜Ýk‘ÀY*ÛÌ¤´³¨v*ÊÓöXY.W¨QÍôb®6u*t ˜O	p;aâ1*çJžÔéàëº’À¨­Aù¼mÇ	¢ÝÆ&äXAÊCDº'Á-õ Aósm ›’Là™²N^8£÷-'‚.W%A¢9T€t¯ÆW÷æ„E=F.»í­:‹Y‘Ò1_ïFî—ÿ"Ì‚hä*¹\‰6¦,B°;ºE¾™Š=’Îl\úÂèþ{ÃüúàT"fû/‘ËÄ‡\^y®öžäí™r÷ Z™ÀR(H¿R¸¼>uº¦zAÄä½lÈ(™Ü¥‚ë4¡—%Œ±Ç¢¯ÇYdû­K,às(±|!Ë•zòæåNš«ýÇfaF¼Â£Âå®i…øi]´Ë%Ä4Z&ò¢\ÏA—íf­RÒ%;‡jÝ#pÂ&YÔŸh5G÷~Ú?Sß©“ Ü{3L½¤ÓŠlH.Œ7„™›(¢/Ã£ 5^¼Žö6AÓV•æ¸ŸnÉ§xÐ’[2dr )¬8GÅÓKš§¶öpòš–àÿ÷ý8ºî¸ìí,~‰ê™VÏáN]kÒÄfYÍhl^,dõA”Â¢±¹¦Å¿©ˆ»ß¶ç5Sk«\Ö(¼4²³f!©½eÚ"QÀ–UN"²1lÿøíù«Ã£ò··¯ßŸœþP!êíñùé«çïX„¦Éó¡Bp3ÅÿXN^`ÞWçÃ(%œ-&ð5-ã,Vs†;“ð–$áï³(¡¥óhÐt˜«:WIQq•L“˜S\…W`$ ™ø’k?¹ógº
Í¦3½	÷ú!'šì#L×1orÂZ‚N¸NŸ
&·¢•‹p^F>€þNQ?l“ãx²&f“1{(;	ÓÙ¦7¡¯OYJ|p/|
`žW°V1ÿqn³Ýº~5’ALI—¿Ð‚	€à¼ÃMÄ`åmè7‰¯GáàŠBG5ËÙ—uc´¡OÌ~FƒŸ!a½Wñw”¥áèr•â­~˜fÁÅ(J‡ðhÑç•Æ®a ýx<RºÃø»"ÜpO¤Í§%Ø‘2uÈ
$d¦ÌÀ{…àAÜ£HweCž@è-¥ Çq›t7VIÚ&½N¯ç9lôÒ©iüWäš™Ä®àX6Z‡.÷¡5—\÷§·è•‹[l¨	,üùB¤\üBÉÿë£ø¤Oug=(Cj¾`íNßŠlˆœN`0DKN¹\’RRï óY­B)•SŒür5¥¼.e·ë¨w$wI‘B«7i(Éu¿ÿÞï÷Ÿ–ê6*5«”‹ÎêØúÄy);Ú˜Rfqõ)÷XXK…ËBO.Ä¹½½ýÔQé¸AvjÐ3e-ÏV$q‚BuìáÈbõãÒ¨Ÿ`q8¹­båcn@Ém&‹¥g  ÖÆÆFÍ‘ôÍN§$ç]´Ì}NÞ=-,ŒÂwPq4ãÑAR…Œn×K¶*Xh ¼sÑ½ví1¨½øäÜ¤pøÞ­»®ÀºX)SªÃ®¨Âö`PVõÛ÷´~ªrû> ¼ÿî1ÕRE½®©¢Þc/í$É™Ü>Áÿ–Jë=Éº>ZÖžv|Y€ßß¢[BÓœ“Ö÷órë]­ãá~4l«‚b©‘bžÚlc;5÷•i'x)µóÎ?@»U‰¢zp;,mÙƒ¤8•áŸ€–º¥Ê.b7=@[0âMü%Uù­ÖAn%/Æýã3îw8Ö‚KáA“v<0”XOß›²…Üb_ê¤4Â(±C˜Uâ~"v×aV?ï1Sy@˜‰W¡Ú÷	X®8‚,”øºŸOˆ©÷ššti$Kä~U.©{¹\’…3ÒØš+KIÉZÄ²CpY¾ÆyçÃ—¹èÀ9Mþw*TšÌ†µÐ‘)×´/‹Ô¹Ž#ì^l^|>Ü¸)Z2
;á——†—=zÑ@»
¬CmC=¥x{¡à'Ç6•2Q¼ uªDP·½%/	FI/I0.¶CÐõCÔl¤ÎI(¸4ø˜Ò@ûPÅÞ!ºB/×ÁÖI÷Ç7[¿­Ç„ìè?š¦bÂš¶‘ž0¬ÏU}?nt‚ç. û›nššÅ)¢ëÞGs³±Ú8Uô·š»´¤ùî0û»4P¡KÅõñk¤IþBìº/¸ÙÜ]gìRpïÿçvNt¶èÛIe…ò½»5?%w°)BGÒÏÃ}ŒÇw×Ù8i½vl&Àðªï¼}<Áê×dÈuíI~3¸„µ¤°±<"
²“»§Å[— ÀT!e9†âYÖr7´Jc½{l±â:0þÎ'/kÏKÖó‚ôÖº¡µËÌh¦ºñUFµêŠñÔüëÆ‹x¤¡W ‚V¾gŽ÷`…à9î{šíÊV¿¢þ–’?¸ã,yeeŒ]cª7CÈ™3nékï»=ß°¤ñ`C)Š5Þê¬?.Ç:ìºìˆmãP8M`}ƒÆåÆÈd·49GŠÈ‰<ÙZ%·( 1Q¬´òz7½Kßµ¼ÞDÙ¢ÝšB°¬±W›7ìÛpíý“Î§á‡’žVî•ÅiÝxñ.Óêâ,^á›×ß\AÉâ†mlA)_”uÔc6d Vâ¤ÕwÊ³†çîó8¦¡„¢lüæ}ËÆ»»3ˆ§ó´f&Vãi„‹&Ylì6¿HÓ%nõëÇ›Ë:«Ž`àÆavX­ «pø³2×	 ;ºÒt÷,ù ÜDÃÚ°¶cw"E¹#»ëû”ÝLÎJÃ³ú™°²{²£ÿVéDÔÊÍiG=Ì®1ÂÎUŠ »^ÇŽêNßkÂÉ ®@e¥E´ù9LkÀÏ€dvX+kå™(­èÀF¨êù2 àè*œ…õDî ìÖc¼‡hèÈëÊ½T‚ëA`*Ižâ›ãYû½cƒFƒæ°Ï˜éÅÑËƒw¯Ï=?:}óë‹ƒóû@¬7¼³¿šB§ªëÑòÝ ŽÁ.Ÿd)9›Ç(ÿUWû­Œ8 )~n°:ŸSó÷ÕÏàcd\„£Òü$ èÿ/qò[Ú\%Ÿ‚ÑÎ~¶„íëëöu*i¹V‰K{}ÍR¥ 0òRbØôÀ…ù¡GüHÓa­ÖµLKÏƒÔ0rÊê|šYGŽÃ$òÁ‹ß‹Ÿþƒ4ÓÅ‘Òè³`ÑguôJ§ùØÙ/6òê`ùªQí°J"J‡<àDZåH.9ÿˆœ´DômeHU†PaƒdQL;ž¶él½‹Ò“ŠÀ çÏ"×9Çpd	á÷Ù8è×*šKœÜætÓZ;]3Ô.…Ã“ ØXwU0 ÛÂºNXG­kƒË§Ò]½GW*s{–ž…#íK1_G)Ë>X„µÇñÄ‡£x¿Rô¶3Ñë"æ çQaË³zm·ï€ˆ7A ylƒçRÁ‹¢àê]Å>
Œ=Ó¯Ä¥ƒA±E›>óçÓ¨Î†JGú¬öãXFà·ÞXa”ž^¤ÞQ” ôen€4÷÷Îh‡ÀûE”Ëë8²ú—>è>M›ßÛ#ÁÝ¡4R§6Ì€g|¶%H6ÌúmsÃë9*‚1e<ïê‡Ä×v–Dcàé¿Ã¼éX¹öã/¿|?hŠú8Ñ)ÓôG·ˆxÊ¢å6|ØàòÇr~{²]e¨QVëüâÃp¦—±Eãhç¡Jù½¹¼2wûêÏúÇ§¥ÞówÔ*DÍn²…'díÔ5IsØ•‹ÃÏÿ4_üWyõc/fZ…®vÌ ñ«ƒeég»ÈXYªŽKõIKà÷¼9ÚÆþiÁ¯e±}2ŠN"åTmîþãË3~¬aìTIöüÆR™XªB`^œ«*úëæ¬¦Åpéhž»*÷øUsXåá~f.ëäÜÊeé¸öÓúÆi}ã´þ8-qý	™-Œ+ûJ™-¯‡<”mÔè’EŸBIŸž’˜mõè&/ +
CúÌçs0f¾L¢ƒ!6€Ù1ÍdáÁŠyòa‹ØÂ6<á¡"H×S'>WíÃ+âa ñ;©èú–6gÝéÔäÌL¼ŸÞ¸ÌùÕm¶¥ªtYµ§î!mL/â™¦R³Ý€˜[ª0Í±Ã§l‘&nD?˜KÔ"¼Ù—`}®9pÆ :²òŽïwHs­²¤·ë“·,ü=Ø"o¦¢˜ý|‘6Þš?ï×‡Ð]Äÿ15§¦È9ksìyƒ™ŠáIJ3Hk£óÔµ_T^àóËÙ’O†ëH³VÈ#²ÑYÉÙ®?Û§ kAÄªÛ[md¨÷‚'{ìUÅ”~Ô3®÷ÕœqÝ>ãê¶ÿç<ãz“Á·3Ž7ÿíŒûvÆ};ãX?¼3®Ž@ÏßZÎ	‡©Ø/?ÛîªŠóìKdÅ«ÌÂZ_£ì{–U¬‡YŽÑ$°U­¨‡?ÃyÆáûã×p IU…þL'ÚÊ‰Æ…øi=Ç‘¶ù°GÚæ—;ÒþµÏ´%+Á_Æ1ªŠY Q}}7.Ø¦‰wm’²?öx°C¿'ñµÛD‰®T!ÍgT²“7ôæLümjn¸å¹IÂTÝE}¼_ÂÉ3¢1³ŒAÃ-ßñ”ËYÕ~ã§ß)KÀCM,…ªJ]ûšf¼‚»ÞÖuT&26éU­Èn^ÑÖ›WÆ¥KûŠÅà²Md¦Zÿ  ÿÿì½ÛRI¶6x_Oá…Õ.’*HÈä ‰ÒáO’Ø?PÕS£‘µ‚Ì ‰VdFVD$(›YÛ~¹Ø¿Íí˜Íí\íWê'˜G˜µ–»‡Â="JÕ%¬[™~\¾N¾Ö·æ–os·H‹+:‘ú;'ÌêyŽºRBêäc‘ªŽ¹HÇ…âµš^UU’þ¼û[hµæS)ãÑ¤ç½ìîV±½ŽÒoòîY÷%ˆ?'Âu0ã#TÅæÔÅ>ÅëíŸð‰HŸLôÕŸP¹òæ—¥ç+«ªoÀÐn¾ùFBL°£pŒ‰Ä½É$M.ƒËä¶®Y2>H†É4G´›½“(øëqø7J¹Zfã¤7 ÛãjkËTNõ8‰Cvƒ˜áòe‰~™D­¡gˆµc½IýS½qýsÙÍ3‰DëI&-7-ßb©\O»,âŠ¿ßÑ	¯cÙŽPÔÇý	Õ‰8Ì‚ˆ„éfMÁS‹çi2WÄ”üœ¨ûâÅŸÄ+ôø|ˆO{RÊ6×lC’Þ±&àÁä©¸ë4!ÈE<×¢Ø$&w©hbf¢ªÀ3¿&Ó”0g¦©?M(ž±« Âø
‚>
pa#X½ Ç¿D{mo³«(ŽA¬E]#¸Ð[å0/°¯ý@°v‰@êQ˜ñGìµ½H«Š±sÅ~Khw×2§IÆ³M`•é÷-±>Ì\bñœ(á'_2˜>îï‹wë)†C_ß°H@ŒS’`å@ÃA1Îpàf¨Ò"åÖ áÓŽñ2RÀÿ¶¥}­MÚ,zbgå`E6¤áï.\úmŠ¢à"ÈØ* ©xY"0ÔÐæ%9FÁfƒ)KEc0ƒRx	~£ @jf:¦ùE’Âˆ‚^Úìˆƒf!PS ¯e˜+ŸBq^BØ#ü/`#x$ø¶ííÑyAÕ©Â`°E…ráÚ$%ß­ŠbžjZÖ^=ŸF1ÆŠÍz“°“YÚ"£Á3}yÇNašþþ.­é° ÖùSpIç®wtt|øËÞ®Ñv›õÌ¾F`tàrJ Öuøã<Jés4osŽÞŸÑ#"iXtö·Ûvm(G2û?3}kU «!>Ôiü…ï*²ÃcW²¾¢ñÊ‚ „¼RYq½T‘ [Â¦Ù2rbmÌÀ	êB¼ÑUP¡’Ù£	Î²$ž":Q2YÁª6çˆ’# \.ød&çÆpI‚Zº†E€JD_]œŠë€îcø^*GÑYÝà ·ôÛÕÊ[ [T/ŠßêXÁMŒðxÀè[£y¶þ°*—~ÒîPåât‡uÏã(Äð\ãÚ•é‡pBy ŒJàA¤"ŸH?„4H,†@ƒp4:jVë5ä GnÂjÉÏ­ˆsQ‚%‰#ôwÌ¸T‹dmÍõûšãÓáp(¨÷GXH%+ûîZãí7ï\’³°3FJ#¸‚©BOÝ9¡„Fù<G›ôÝ5¥|zú\×åK:ùÝØ)ºïšdŒÙ­éøÐ~ÕXÎ3ÛÁëüÙÔêìY…¼pDÿÕu¡þc®ÄbFÒè¯$]€$ÏØÂ¯J€¡eŸ¤HšX(k¨²„|ì%)„šï;/éV¶´ÝðJˆ¨éGÆÃÓéÂÅÙ¾ã¨]ì
$ËQ¸
­hÁ2ø¬«š»ß½êFÍÆœMÆ”¤Izzã®²`õø®´Š‘ä“ÙÊººp€#	îœ‘÷"þŽ‡˜þœl›`ÜÐùèá;EOÍ£¢	äÅ“h8f‡Ó|]òö=hß¤½ÀÒÅmÍ$JÒ7Zƒòì}ÿ=«:!Öå‹–ÊE¥lÛVžNCË­`º´7
‘á)kºä¸+L[o^3DÓ‘ªÁÙ|±kï»Â½Ò‡°Î™ŸÜS0Éôsky?v`Y£|'H qëÆsdð~ÍöÛ¡“±Ý6U,£ÁSmÔ+MÐ}2òC/0ãµæ“(í´	Ñ©BØÀƒNýÁ~¨Œih?Q‰¹ÖR?ê«Hÿ^úá µe0pý“1VEa>ú×G­Pãª QéBeÌ€{Tê
ÿB»r#@
Ë†C«>¸tdÓ–^¬»jÆÂee‡¥Oßú÷V-^lªÃCîaèè•Â5kVƒqç·kvù³A
¢Ã¡G¸Ë» ]:¯ÊìÒnéqjûÀ,ïˆa¹ð´`ÁÁhò“dÃ>¨J—R4²]8#ª˜ú–/:i;`ŒÉ h]w`€Ò‡‹áœq.„ûzž„©Ú)l¹Šç¢—h&br¶ÉúZ*	d˜p#	•49?G§ÎùëÐf/Â0cAŠJnÌ‘ÕØº™AwX*LÛSªÛTÜŒ$C.nòŽ´çJìW†ä5zA¾)Ù£ÐŸÅ-s£jÏžmÃÖÄ)wù˜9W¯FŽ}Œøô¡yÎ9›Ò÷µâ–þqŽ¶®¯ŽnmÂ±òX®œ•&á½f|œ§þ[+‘'Jù®5?wDpÍãÕüâ6Í ì=l¬¨šÝ¶™Þx<b$XÖ:zu´TÕ|ç™1¾…ðñžÍ!z­ ,°4WfLüRØk­7PÒ„W7«‚âççôÊ¸L@‡}=óÌª²]“¶ž>|ù,„ósË6Ô«$ÞÂÓþço>zTÕ¶û~—õ}MßÓwÖØ?ÿñ_¬»ùÉ·³ÜùC-ïAÃ{ZÝî­.ÐO¶¼Ýå?Ôò¾‡Á½ÑnG°‡à,¹¼ížÕ/ñÆò£Û.1|CU1\²{•„·Wñ«U+tIíÓ#Èªw%Ì+ÿ˜Û)†^á9sã‹;ËnSw	{•\¡+trçò¹ÓÙçvòú9·ü~Nï™øK¨…<dÓ	-È"Q»ŒP^ó4Ÿ¾Ü	²¶Êv£!bÔ3Š†:Ç²ÑâÂÝ›…ã.QoéTää
Uê1•»ÙöP '(ßi`×›ÕiýMSív¨c¸Û°N‚Ã²%gáZ3Ë6ÖZ¶•ñq¿ßÃOY¥Á•¶¡‡ÍR´[³<ÒÉ9áÉå•	f×œ©'ã¤m-0UÖ­m²Îf—m=ì>¸uý„š/]ëÓ)§ìÉRéÚû9yeœÖD;j¢Ê×y$Mdí18vnÓÓPú70£pŒ‡ œþÇp„Ðàýd$IÄpÈyM.~S„``„ø‹P³üØ·,>J…CÁüÈñçþ\sJÏóG7V?g`‰p¿oÐøhl ¿£¬7ž‰:Á½Áe$?çþƒ Æzü£aœœñI˜cÀY¶Lí¢CLµú„—©9ù–[áÏì`*ý!Q+8¼}÷…ƒ4ã
Ío3ü÷(MÎ£8ô^),Ícëí½}ç˜Î3úª<)c<¥	ª¾Ê3µß”³†žÄˆqòFŒ#Þ$eÝH¨Ç5>Ö¦þöÝÓÖÛw†*^ÄÚg0zõ€ÿnEÒ%ÒOfG§Én‡yXô'?ðuËþƒòžòº(¥Öö€{kmáŸs·„ ŸÃJmíi3ZXp½w ­Ãžù™3HTE—†AÚ¿ÀÔ\ZüYÑ)ÝþðàÍÃq<SQ©ê3_dªhìù^Õ€ïzOým,ø°¼ïÐ@oöI-MˆOƒø˜J]:›::í	?mÑ˜ö‘Ñ#G{EõÍl7
†ãä_6æüÒhöšEÿû“<1ûƒgÚg<ŽéAûôí‡p&ÿzG'™Ý8Ç'NžcpåoÌ-GÖÕ(ñW›öf“ôm¹E*5
9H†|v´jÈÈžÆGw¸°-èÒþÂGœ««ìMxÅèóŒ\·ø]¬‚l‚Øì¿†9ÆÉ°èK}T=`x ëÑ=þip&Ø—ö‰±^‹I:¹ m~ØÇb0…ãM¿ŠÕåß¦“‹¶âf.>mo›†oëÛ“Õ“¸`´=ãýëÃê)O¦XìÒjâÈú°~›ñÐÞbýÃê&.a7±CP¦†c:’\%€†~q~5?/ÿ
X'¿ö¨X*îgÌŽ/ŒÖ9‹zÌó²±OŸ¶®oôpãw0nš7»[üiÌœGKáK`ÌÿTÅšŸö…²P|üævÐÑ€V÷ÎÏ¡-#åC™¿5‚Ä”ýIô^¢%’y°ÿo?MiO;uÇ•,Éþ¿Á\›†é¬%nv°´è ŽÒÂ$þJtþW<dKX¸¬‡ç³ÖB°ïh² Ï9ÓÇoãhå­ÎÚÚ’–Ô–=	Ô€},²ª‘kXûùº¸øÓ-Æuu¦ \eC8¨'Oà_èë£þFv:Î¦g0PéÆÁv(oý¶ÌZüa &è<€¾Å
ªÃ/T
ˆK&ø«zi»O´A !Ü,-9A®­V‡a…×V˜¦F÷8XØç6|ž¤­…=ü;óþ:!h­®•Jò…c·a%°±Æ‹ÿÊ8m-¯ƒ+1t×V›Ÿ"¾»Óùà»E3V§±Ž³Ù¸ÏLt‹<iHtt@6{©MüµEžSö­3zË5ý%j£a÷~2wv¡V‹æG”÷PHþxk¢½æz+pÖ˜b2^¦zkJ$ óÎù†t¥ö¥¥OÞâ«bhmtàèÅÂ,F+ÆÒ>;Ì/ômÞkšoâµ2Åto !ÎÖµ1÷ÒÑBœiš£œÌ>P|éoøŸ}úŒ4ã,ZÛçwº ÚÉ ItÇ¶I'{‡xWäFk+üö§y¹±òIr(ºLÒoº9G/–OQ^™X‹‡ð0ÏG“|¦o¬\š·Þ$&Ä£Bu¶½ Q¼kJ:ûó­¤ýŒÎšÔñã“9C2¹ëB>LHlîs¢Â'Œ*®Ó°DKÆƒ”éõDáà(yì}/€7PèœØ2Š]´dªË'Ûix®M€úøñG‹áñŽáŒc‰qƒ…‰Iµ'Óì¢etÓOF(_uvÄšÍµ‡>Wµš7ÆþóŸ"ÿcázè(ÊÂ6b-ñ²z‚(èýÉ”¢M0‚cÆøÊØw×´òÈªnaÅú˜È¬ý¾P‚\ŒÅÉV„b¯«ÍNA¿àeÓ°H*’!ïp¡èÒ¤ã™®ÔuQßX\‚/Á	´‡‡d)!Ê,îvø²²ÃåG%Ù.P+$¦º?¾âhÀD«²)†š“vvõw£ÚåZN[x[Ü?Å¹Yª¦'!–5 +¢gÀƒŒ6ËÜÎqxÓ†_ˆ‹½—¢lCÎçfU´ž½_fÅÊXÈWsÛ¡FõmÑ<:­I^âÂá¥ø%ýô)6z%© ª›líg²Öè¨1áÒ«<ë)¢´´µdÌûE;)-£1áIo•"ÀÈKfÈ!Ž.¼_ Ûá®t±X4øWÞ aæ¤Â'ç$‚?H%D;/¦äÙk±Õsn²˜_Xì²o±»;ztÚ»·ÍÄ¶äíì]÷µye|‹-Ô<¡_à&ju_û¨¼µšpàzü}‡û
±ˆ£Õ$>‘|–Ê¹8ó–Ó+î'±o[Dd¨Ç¢¡
¶£ÿ²Xv?%j«s¯Ô¨Ú½/bîwcYfX]©!›y/¨E‰8ÑðÂw×ØÌÍ‚A'ïoÁg$Ü‚Ç”ï îÈjŠ“uŸ»+wkÝ¾!4‰x"¬!ÚŸ%¬Â‰6r	KU.‡µú2M¦±IB)[Ô-ÍQÂ°ý+ð©ßÁò›¦Ê8íd‡&áî½7.÷-¯èŸ^w×†ðs÷*ä¶Ù-|XÑ£Æºj–[pIO×¼rïZûº;J®7ï”‹sèYdù¶½Ðô¹£;q™çïï£¨âm›¨øz‡Ä¸ø¡X²œe·Ð$Öß††%áÎër¾˜àÀ‚sñC%=Ü—ýSé1Mª0ÍÛÐžh™‹ÿ<f¤¿*Ìz§L:Ð©¡~Š^ÌÑÏãÒ>S=cÂ¤Ò¼
¦‡G·ºä¹ÈØVÎùás®Ÿº ã— ÚâñÁY7íKKþžuRÁ;tîîIøé$i„ÂÖ¿©hÛ\“DyŽ—Rï¿»¦¿	çøpqñ†‰ÏãÀøø½¨§Øˆƒñ¬Š
ÝºÚËÉîV·º#eŠ¶:ñ*´4žu×^©êTúþæqÖ«{0ÊcO[\ï®Êƒ¤Vãâ«°F¤úA.³ŸTèÛ÷9í¾&×6¨6¯ÃQb(6¿Gì
x²¸ÑñTKŠªÂœ…të8Bÿd˜ãŸ´Âðß%s&ðDq!1†	b†ßã‡Éñjo(ö0tÒ¡6†ß$ñ¡?gdaaI‘vžÐ#;AÊ¹ðRoÅU¥»\ü©…>Y¾0S¿†EFïÿ	y(Û¹þYí˜Ä%ƒÕ*ÏŽjTÐø>0–ÃÖÕ†=ÑÈ¦=Ä5Þ1ýõh8ãÔpó‹;vsý•¤k&šëÝ°¯5¥ûÆwTDùn’ô¥š[¤ùÕ¨¹”(ã±8™8‚'¸âN¾†“À[BC˜Såcœ¹©¥—ôûœÇ©hìÕœùüúêÚªþÂtüaœ\I›9_!bÄN¡ßHä’ôTX¢'È¾-ö¢}d-óÍ‚}+qCn.3Î\1Å"Meº~½n¡ûØÞ±êõSŒ°Ì4Ê‹Gfäü–hê^ºB‰–Ô6¾J»ÝRYïú×ëöóÖ³±ZüiCåÿ-Ô]Ì~Ûè—­TZþŽ4ß¶ÚûãÚåÏ|Š81‹•‹ ö£Í±J_ç±ôRœý™¾vü»b\8akT ƒ¬¹ã4Ds<	¬&TÃÐ<avÈrÃPcIï?bÃhY±2H¹ØØAÖ¶‘mdí˜þ™Ã¯>„}ÒÿÔ¶¨˜†Ù·?Ò$räÏ3"W®6tä›‚›;æ…Ùfhìhºþ­8:G°€â\Ø¾Åf£Âî¡ú*:À‚ÊæƒŠÆë.I‰O*›ŸT4ßüª,ÄÂÊŽBgGÅÉ*£À!ƒÞ\¯%¯H–8¼M‘Lþ0Yim½¶Í€¥c'ô–ã~˜œ3Þî3|¿-ñ©·Ù	™ý4 ïíˆ<ªàÒMx´}³ÇcéØO¤c©Q+ÚÑ™tÿôÎyÛ ^íÜ=áÉ ‚#ñ6ÄÆ‹Á-%ìŽh<
mão†OyV~ö!.G†ø‡P}—Ù”nñ“h@¾F-/Å“_ŠÏéóE$`^éìàC ÌÆQ–/Âiž‹µ»<ŽV¨½Ï·Ø‡Q)}eªy\x–åÏ˜|heÂfôè6Øuž¡dA úcÂ“µÙ–3Sj<ã	tOØuñ~":àI«KÑòÊvú¶Í{hÉËrA4<dZN®ÛŠ›Ëã–Üg†t¯â²;Ê{€=}OÃXýîÚÆÍûJ>&SLAjÃ8ÔVÁþÃ±ÎÛ/’t´‡ñÚ²‡mTðÙnxLãÜpœªTÚR‘•Ïês³ñõáS®¥ÆÖÄB_³A”Mâ`ÆïNô\Må2{U²×=.»’Zt—@²—¡JÚˆ¨óáò]j‹ÎŸòÇ{8"8\Ë›¡¥-¯ÿòN«ÇP^=Õ¯ƒhoW˜¡€35 L
ëo­ú6¿Iá~Ó_è‹eîû	î%ÇžcŒËZ-
a>ÞƒÖß˜m>¹6ÿÖAä(ñ˜¼%,•nçV¸›\Îa.äßeœ¶pñF	ð¶½vËD¯ÍFzmŒ¯Ôª
f‚)ØRª6:ƒem
tô˜6Wa½ÚcÑ`¥Ê€1ô®ÌUÅ—Ì©• Ic%TUˆ§?¹vqú›Ò}àHU0²Nˆ‘88ãòjgžÕöTs 5ª,\{sáé±*C`W©³æx¬^¸Êà¯·ú„B*š|„Åáˆ:û§û¸›æ¸­µ+y‘bÂOt±F)Ÿf•w¹,%R«Záh<™æ®

ýà®óÑ|6£wºÛNÞš»jj2Þ!­óÉu+”hÑ:ø˜Ë9øåmjÒSüfÞ/€:B\ñö°Íþ}ŒÙnÈ¶“Nÿîegµà_>D+)ÁîõAKEs¹‹úCUJ\í¬‰/Lxe\M¦9Ê!*îcW!ð ï!³Óæ¬ïÝóDøïØ»ãÛ¦Íî]¸a>Ô8î§&þµke@q[%t‘…5®•Ž¶ck(8(mßú <­-Ó·Ó5Pz'p N‡P)Ëspàt¯ÄŽ=sÃŽ×/{F¢Å5ÒÊê`lvÕJ³T_Ì¢R+å=Çke:ÄojT«Ýµb±·eM-Y÷«¶ÈÄ\[‡ñßêÌN…4ÛÒRkÏ°~#–,ò`+
ýl%› 8Y}JE° ç¥Ùb¹_/,½/U‘z¤0ãUUíÅ°¾Õ¸Œ´9·–ú9TSàšbÙž9”Ä&E|¸ê×KCªþ—MÅ/W‡šÔòd]3¼‡Tf×°ú4@Ëø2äSèlô€ç•Â"@ÊÿÊ3¶øŠã®·¯Àr[Âz:åŽ‹:ÏÏx	Ê€g$ôÁÚK¨–!ì<02ß2mŽ
e;¼²†‹ßj5¤M\_Kp=0—Ô0ýz¤»¯†Á¸‘þvckØY#.ó2§pò²žÚÕ3ü(s¯—¨©ªV?xà’V÷°Nª<”øMôŽBh¾5ä³m´†åêp«8´®ë_–SÛ&2TQ6E 6
ÂÔWò;s`?>MƒÌQšOÖ^ðIqIàO%]hÓ™¼Aü†î)„ºHãâ1-£ jÀo*FA‹LÀ`&vuÉx`LÆ	Õ±?b^A0ž’44Ù<ü¶|¼÷ËÞñÉþóƒ½ÏÅå+î%¿²ûÚe´£~ççøâ´i,?ù|<_ô??Ó7æ'gþ:bÇ¼Œ¿{+Æ¿õé¿Ïý÷U ø‚¬ð„gî³Ê:R‚cÛH8_?w Û|ååMy¹	ögbè‚¹Ò|R~îFT%®Þ²ã1y´E¦’šÜ/sú'ë½€GééEþ˜‡H¡†âéÚL)r4Kô*%8å3Gâ™j\O{4®¦Å
ÿN²¯¡ô3$ŸrxVH>»Úz‰^¯þÀ^QqtöÃª}:íA¡ôu‡ë˜÷p«•NÖ³0¿
ciZ…Ä]ÅÄ-Õ­"óTÃ´ëdi4þ°â«ŸDÐÄYUaPzÊ[âÁ[Ã%úaó›ˆ~»4&‡·fÚa÷ÕÅt
}à«–ð×n§žz‘í#\ÄoE,…WxjbÌSø¢B(¹$»lºÑeÒ¤Tµ÷V§­.=+EÌú–CÄ¸¯ŠZ´ž¢55n; Á•#0O3~ 6eéá­F¥‡‡û&Áµ?>O½W×ËÒëuÇ›XGCÁÝŸ*Ldl£â05³LÑƒMqDà³4 ¥–íh§—kÖ~Óä´=ó‰wí¡vÿ"H{ykeíÏØ¹ËÛºP~¦”†ŠŸ-:ÏN%×³#Â®ü,¶\¾H-¬ÅíB_Ä1[
³lÃ9˜•ˆ†çLË_º§	·”½cAá5Ù¸.µ¢eûj«·7A+¡;PÂ«$=j\DÊO²Xà©¨ëŸŸ1Ü­!.fæføåi`þŒ2 Ac;›É‚KØ„—H>æV.®Kš´þ£'}c‡ÙI˜«Ìo¾ðÔ.Q?–VmC1¸»dVw m´š¶N¾'¿.zº¿ñËR¢Õ¸L´ÏbÔ‚pÐOçÎéÑŠðtmšKsÌ³ÙîÁÀ{iÌÚçi2j™YjgIš·ZÁ2;#Š8kÃâp'¡sº,ùú!$Õ˜L…,%5š?+Åü©å<eÝ¼Añ¾Ž*°Fm5(¤÷&á#I“dÄ©Tš‹h‚èˆ,èƒ‘1‚ÖdÞ|A`¼ú!yz(³®íŸª¿àœoÓÝ[!UßÊ÷˜5 ìY¯d—NpÙ®8–4qæ=	E¿e[·|F€&Þ6ïzHy6=›b²¾}ÌÈQ“]ŸH”ÉÒ.0Wù—·ÙìEpd¬4$Ca1à	óu]2QÄ|gO®³™½S¥Šú«]b¾(¤YD(VµôÆ|©Ë&òSÿñÐ)² [u–>½\û î×6ûVíkÍ7K4J¸ùSŽ­u_˜^ÎWKå–&qÓ8<÷ÄÍòŸª­mê&ñÕíÕÚ‘%"*Û•ÛC‹D«(Ž*Z¶•Öê0ç^mÁêzÅ»­7ÒxÆ*­ƒ†ÞëZâwxLßWÓI•êZ?® [Fq9 -ÏœJ¸±–ˆR¨e)"¾ãî˜[½J|µƒ«œáš.:bç_Âš»ôˆu
,•§Æ]§­—&=žÁ™¸/ÓdüóÄ w˜˜üf	Iÿ®z¾µ3ñîªŸŠ¯ôá¹Î¾Jœ)†r§G—;¡ëJnk£A{L*v;¹ÕSÊà’Ó+²žÎ›qA4•ùMgmƒŽcKNdºGaÄ:²º÷Ç‘øãl¹IÑgúXvô¨*õcáiy‘½‡÷f©¦,´bý‘Ã? KŽP5	z×£ÕÒÕxa­Ý²ðë÷Èe’€ÔXÉŒ¬®¥²Ä4Zòˆ5™šÇ³@I:Þw.1™'ÂžhÔ†¡~ŠãMõa)«7ë&Ý¯>´ó«äwÝ5úRÛ™âf*k8e×ÂÝV­©j“h #mj%¿¼Œ®ŸLÁXhxÀõçy~]©à›gXxJÛKòÍt«w/c2ú4ã¤ÿòe
F=£ñ×ƒð2ŒoØ÷g°Š?±l—	JntÄ´a5cF·}¼B=³C‹2@(t²NA/ñ°™ÃõV‚•Dé2)Ì±|Kž¼[5XÛV£væRI¤ó¤Eˆ¬˜kƒ‰6MµCwÊ‹ë$‡òÔ`›?¯£å~RýEôÓX})6äÚoœÜ»ã±d¾lF®ÔE…±™t˜:Ï¤ùso~JO³”ªMmÃ¶¿ÿNÉÒ÷hÊnÞÏbÓök]ƒöÒÕpT“íf…ÿfÍñæýíô¸âø—Õ8ñÕ=iq·RœgÉÇYlõI¨?s©µº–ZV}Il{Rç¬{iÅ¹¾Ft'õµO«Õj;î,ÞûRvlF?¯Ž:×l2€›/M‡©}¤¢“Êwçºó½Yrå+WaXŸ¢¦õ"Iò†Á„5®§R0¡äláØåýlÁ_WèX#²ò´ÿÍód05ÅšdÈ[Ùïê&H$ËêOÓ,IW&IDµ¥I¸H„‘Ø_¨R™cãçH¯Ž\Ö`‡[V"Š*_ýò˜Ø¡¸–OÝcöHSœ×=ªî¹¤»ñ1–qq71.Î ´Òxíû>M‘,[xÐ^'ƒ öÅî6ÜÅ!×+Æn–›Ûî6	Û%ð§Î²É#óoÖ»áü;Ó"ÀU‡óÎää5Eªuó¥i9Z‚ûž)Zo o…y¢&/âw“qR’áZß„Äáï€G<|Ïx¿Œã0nšäþp¾lÅ0šäâ€ÅåeÌÎP]3ê¾:L—o™ÓæQC×Ä\ëóDŠ ^'‘UfŠxxhZ+ãà2Òv±çŽ¸ø…Z—08¡âcWi0¹{žî*N?ÎZ‹<W8sE“ªQ_¿÷xˆ‹¢®!FËf…WúZ"Wðžï\fk¬œ_>ËÑ;u¯glQ%jœM}ÔôI y.º=\`ŸJý	GËS£kƒÐ»NM¥<ÔòM¸ƒt{ˆ}šFÕéw¢å|Fz–Ôþ¢>¨2w[Šèï (¹ðJN|ìÄä”–„´ÿ—KR¯"í÷“q‚Âz&”]ÈN)q´uÈ\CÍyø™ˆL‰û£r.}§]†k§*IN~öEÓ-B”ÏšÆùÆ¦Ê¢îçŸº¦Ðq?¥ºþ˜ä¥O¡‚¾‚ÑÐƒI]ê3I[ü“/š²v’I#ªÚÕ¦Ž ÌOÝŠ ®øÉ$ìGçQ¿Hè‚ù,E‘ˆmçp	Cv“¼ì„.ÓDì–í*ÛWT¡79S—Õ¿Æ^à((Ê¯èHéuöêmPd¯<¦D
wo)´±“oU/hUk)Dp÷¨Eƒ{+[~[ºH(Uˆ2K·Tt¨×[´ª.F!—oƒêî‚†‰âfF}£¤Ë·“êŽ&;²j‚y*¾E^¾«»›uM%]¤=ýD‘Š¼LìkÊµ]Ð>3êk%•µôïU•YºQª¤‘þþgœf«_¥ÉSH£”|aB 5ÏT-ÒfòI0BKF¬dÚR0DøÊ<²%xüWÎ^4ìV¦"‚ýÇp°ðôôá)b`£kÀ¡¯ÎÂ8?r=_F")°ü"ÈÙU˜†›q€Ù3“$ËÂ,’IÓé$'Oè êÃö³£t:Æ¦ó‹pÄ®"Ê»ŸÊöÌm˜¢‚Œì<ú¨.•±¶¢šöÓ„N?‚«S±ß\›$\y‡^75=ÁHRFáˆÙ&iØÞÍë½œÄˆÝþ‡(íƒujï™Ð9ú($ÜÙÊºŒs_ïVÄ¹WÀ”Ûn}EˆÎL lc¶+·æ—0EM’¿â°Qz)&†RÈ€…´ô#£ƒq2
bØe^"¯Í~M¦©F(âô`u£Ô–Ù¸‘&cX?¼À{ýä5ðq\=ÿ¹.qÅ§@c•ÑÎ%†äq×WåÜXÀ…Õ	7%Â^7U¢âÚÝå[3Up+yÝÏÎÒåR)tVi¹Ð®‹BÏØØ‘S¤_0Ù­×:=¾jó%òÔ-=øõ_3DüT[>ïR7‰Ëú2/*‹ë~®Ÿ_Ü²°³¿{û&(äò¶¯ÉÁ@Ðp¯ÏyO}‹ðLZwÝ`·çgÉ`V›H hx®Øg¤$_Ð³‡(Ê‰[@'«ëŽä­f1xùÀ^v;’…´”u"£WòÚcRÕ<¿Å1Šh^72ß¬öïÒ—uÊ¢?-ø®	RmÐBe €ëÇò·peë$BO6g©‚þZœ–™Ü©FÁ#øcª9<\€v¹Ú†i&q¢9U|³nÝ	è~úL/M-?MUª¡þ#n®P¥yˆa¡J¢YKãŽF¢ð¬7È,/6È™RÏ6¡ÁzæVûmÔ±6xå¬ÿ‘êpO>;±KËHüª!•5$kl/×WéÎ_Ð;jH¯#°LÁš•úÖ]T¥"ôð”W:ýshMŽhë9´¦9Ã¿HJÅª´( R±– Ü¥Oª\A×¢jo•¹øÇHŸ^»á÷Ô»Zœ —™+ÂÿÏ¤{e´(š
ÆöW¬ºßO+9å¿ê`%L¬Q³ã!dH³î«6vWmL”Ôø‚´±˜Ð0Ig
-L4ªaéœJXúGp\¥í,ŸÿÉß|:]+ý½4­´Ýäª#˜ý±õ*I“-$¯?•"UhP)‰œ¯
Tu¿Ÿ¥E0|UJªÃÈ ÔšÔj}Õ—þõô¥ÞÁPÿÚòW=©Q_–žôÏÿüoè; J=
`3þÈúPáŸX5špÁòU7ªnã÷ÓÊñœ_u¤²ŽÄW	~‘5EQQ*/ÝW…é_MaúC)<:Aþ9?¸“Vòû©B¿§‚¢¨†ô”efÏõÏu=V¨.a±._µ—ê6>¹ö2×;MÁ†0FŽŒüq¥”ñÜi·–ô92\¨‹FŽ‹‰l$áVôÌM_LÅFTfÈhèÕ92ûe9¢~\†ì{¦r­Oò4Fóå+hLzw6°ÌÏõ.zg¡œðAœEqŸ-³>*t²T|öÃh’³Ë$ÀŸ˜ÏÒÇB«C6JE&…7‰¥’‚K©ãu
v-ƒ/X:0ªA\[Wþ¢áàÉõÞ@œªúwL0unÓøú&%eZ|}Ó}bòrÏ×SpË óZù˜¶Ÿ•–Ó†øgív›ªðºÖø¥·A5›®*dçøæë'Xcj˜5[éš9PV^‰Õ°*õ„Ð¶ajÔ —ØÖÙ$a³²$¹Ö¨«‘­ ,ô6°ørÁé-òéUéoØÄÛ%•Nð—”¦C[¸¹ãÖgËE#>ü&&ÏÈð?ýáà~Ñzz=÷p0„å­k¿Ûì(LÏ¬Ž2e"ï40Qã\!Áß°
ÃpŒ°S!’ÅÒaˆþ$Åò˜/­+3Þ×7›”4e“´¥Y.hñ!Þ]ƒ
]˜:[öçßÎ£œ¢`4A¡d|€†@2dU¶Æ3J“ß…[îw`µµ5^rKÚPÝÂÖRE›°¤æÀ|”[E&É(˜Þ/àë*D]‡e.Ó´ÐËö2¡Ýèr0­4/inÈ7j˜!ºP–ë7Ý[¥„6¬^v¨™¦)®Õz°Y [{t…<k»ðØJ´•q¬ÓÙ„û_Öbáð=P¹(°&–'„Y[œÙ†Õ¡ÌzÕéõRn\¢A˜#;oˆ\ì˜íÂÓç³m¾ÎÄÃÁsU/—.Þ°–ýˆ
YæLþ¯¢Þãbx÷&ºU[§ûOÝÞ£M^÷¶Ã1µ¢[>¶PK±û»b™¢Á³v6=ãe`[kËlké4œš	×OÍ’xÙªüøÎfz3ƒ\G˜šÏ,w§‡ßÎ,wUsº3ö„†uUcZï <C AJaéótTPm[ŸLG£ Åœ}*p¥ƒBS«Ï“à@ð èVm•‚ ãIjXóI@Ü¦O mv©A€AÄ³,ºŠ„½‘Ã40ü­žl¥Ã²Ñ¶úsKÚ
çˆ)ï7í{,/~¯Žñë–«
‚Ù¯ìß¬­-r«ëÛ[8·êß=FÐëLú7VÙUÌ¦ïß/aÔqÞøñŠé¦’púÂ¨›Æ^)8=ÓÊYWÜíÁm*È^\VÙAþñ“øN˜NT¿†à~÷O›Á,™æ_qj]›:w
4‰]pïô‰|‡Ø²¼ûÉèÏ?­: Þ?•t¿8:õ3ÑbÌTöö$NòOJ§}ÑÝ}ª÷‹
E‰~×½ô«×ÁY×.k¤*ês¹Vª‡µq,Yn8Õý2*¦`é@m” _ð¤œîƒª;¨’çÐ·d´y×½~0ñ¢§H¼ïó˜Ö*Ûæ1h—ˆŽæÖq»tÉ¯#²š¿7÷­Ï'^ŒSÊu;á‘÷¶ ºMËÓõe.ƒD>Â¡Âë-n²ÝdDcHsÝša¼n:(®ûÓ±^QE4Ño^ÆÉlGëðj¦òe./¶¤ì8`¯`½‚´1»Ý"I5Íd=®²È…¬åK“8¼í2ùêcÜÁ{ ×ÀÄ®®²@Lbë†þG†î*	Xfô«Ð¥\®n6+^åž®Þx #ÖLØU0L¦ý°Õ
ú}Ê_÷Nµü!œA#wpþã?\ÐãdEæ÷¯ˆooÞû¼<Ñ9k}£xÍ¿[bò7èéí;ß;ò¡ödš]`¾×‡$üïð‚³ŽÔ2»¾aA&2|sÇ×²\þ·ïž.9¡HÅ•‡Ü.Ùö~kM¦QH`µÎÍðÝTHØÖÖÛ¿Ò®dï¶Ù[9ª`Œ„˜¿ð…ºøïxÃë›.TE[­kV<°Ì¢Œpmã‡íhÜeg-ç–.±›%÷ò8èYJ•[Ð³xÕMÏnð[“¸óé\ÄO<¢qüì÷¥q˜ÄýÒ8P@cú–»W¦oÏæ4£ï|ê¡oøb^úöµUÐ7<p_ô]y©7_¬–ëfŽáÂxœË-LýUéþÊ­Á%.Î¶$ÞšA×ðÜ&Úœ˜Äç°K ¸]dšµÙ)†[Ême£iœG“a…ÅÐXr®ªÓ‚ÒËØû«h-‡Þ
þ¤‡óD}#ˆc;¾
±»6 UùvÕlx¬Çå-T•Á­òu€¶Q’;f	è¥“Û¼lðg4¡?ô±Ü>%ü±§Ï
d]Q¼7¬cFele}åùqùŸ4k€Üê4 w¯Ÿ-hWqñÏ·ˆ7lóždõAÞÝ ‰I­€,|\j–Í¡Ç¨À[Mò9™Y¾->m²õ;ÁÅaCvžRÐ%Ù%ë¦ŒŸkZfºN»öŽÛKž«+vaŒ«À4[Z	¢¬ÆQžã\Å˜íqe×rÆÜ+"u0Cîå(Bz•áœòõNNö_¾ÙÛe'{;§û‡oÄ '{¯²²¶ÙwÖÊŠ{¹Î},Ö<~¢D=½Lýòæã­ÏCÁVbŸE©wIäkÆ•YYLaá©Ô6'âU77ðfUSwËîÓZnG£=Û$SSºIîŸúÑÙÐ\Xz—ëœCv~þŒ@},{Ïj@4ç€¨ìÆ>Ô:Læà24­=³yn`ýhæÉÔZ›/_Pý|HMõóÇËT?"Pðœ[¶œéÍÛØ¼ûËnŸQ¨51Gn¡þÖ|¤=Ÿ¬Ï<4ÚmÎ%k³õG©õmÐ¤ÿ\{ý_ÍµsMmð-âÌ5ÙÐWs­Q·÷i®åSn4h7 ·´Ú”û«Õ6‡Õ&7à«ÕöÕj«kîàøkEçxÛ³ôÕtsüè¼ˆL·|z{Ó-ŸþÁL7>àOdºAãq:–¦Râ$M.á0ÍQÔ ¾Ë/Í>Ó]øòÒÍêWKí«¥Öäù¯–š¯‘
Kí~‘l¬Ïð4¾Jí¯“A³I‚:{“âì²¤}ÙÖ°Aâ!<IÁ^¶f±­,ÌO.’+Laß‚8¶Îƒ8s•Ã3Ó‰)¡²k¦o:D™m1–MÊù±E<YÊÄÌFÑ“û7(Øº?M³$]™$aîXS*ïùn2íutž÷ÍX*¢y<ìè_ïVº<{õ!.õfEfƒ´1žëÃŒåÉdeý¸¹3£Yš¹‚ã¤¦‚’’ñsØ8“búî**é¬•ž®I%[šÀá¶ƒWäX›²s^¦Éø Íy²f±x×v–“4_tÊa	±ÛòHÏÅÈ¹
‚1¶ìu0†!ŠÿÇ««_dÏ¦}DªÑWRŒXko.<íõû¼”ø8­ƒ ”0ÈWÄÒðQLê)¶øûºeÇóX]™å)£‹¨Á¸ãß/ÙŽ±ÛAxx™ÅÉÊ1‹ÀÛôhãÖ"G—Ë\ðeF˜§Ó°ŒQf3ÆúÙàÞ v9Ï1xP¸
‚+%Ý‰ab·,˜E%ß,	šÓ0…f@ÜUhU<þý—(¼"ð&ö=¨‘™ËÇãá¹5TÀÑ¸0)íÅ±WK!p!^?ºžšwC|–¥uãËþ¶“IÐòÙÊ¦®lo}º.Fpûk¬•;î±Sã*pª]x«<j8§šÑ?ÁGy‚Kx‚¶<Cmhh’ÌÇ±?ƒÃ1®›ZR·8sñÆãUP
ýlL1û ®V¶€>„ßMVˆÿÑ¼g‚‘Ûô{š\Õ*VkJ	@Ô€yóø$ÄŒƒÎ²$ž"HmÙå¥³Úe+DàÄ¨fôå²{µUÚ«ÇÑx2Ím6‘Ï&BÒÚjà$úáœÁ0}² ÈÆÛmûÙË ž†X…ŸBÆg3àFÀ‡†ðL+,ôëâéVØÎƒtæmj¨¤d—ý¦–†Xæàši>‰W:Ä«ÚºùyÒŸfÛxx€Ui˜€É4£q¸2NÆ¡ÍWD¨¹«Ôjà;U«†r¦OSëÛÌü`É§Z^¿¯åÐ
ò…¼ºj%+xxéw¶BaªlZ=c‹
	b«@SÒ?Q9µ‹å÷·é}Ã"ðjÈ–ò°¹¶h4gÞXä9c‹óSäLîÚž-L÷	cËÅÇ„Èx^¢T?›†Yž-:’ ƒHh ·ê´LÐ	Ä'yO3®6NDËK5—«öµÊõû¿êgedJ×ï\S“ë^d—‹=â["E¼!¼±jn™åßzª6/p­£qÊ¢ÃÖáÉÍ˜‰ãêÙ×o÷P¼%ãÏ9ÔÞƒ5„Ú³¡õláPw$ŒØ±Á$ËNÒåe;¯‡|¨ü›¾«qÇq¬†=°ïO>®l!‘nHºì(¸Õ*ˆ0,w9Æï¢åÞ:;kî“wrpüæ“÷!Ó”½÷h÷×ðOÜqÛÑ“$®.]ndÏ-¿-sr8ãÐíÊLþRX°%Z—p¹N3á±Û¥M·9I|ÌîÉõ¦èØé–!tËâÛ¼¹÷â0(xÚŸ…zçvË»VÍ‰2g/»x6 X6ý‹0Êä¦ôEâýè8q¬EkÚ›RJ|FèšWaº“i-©<ÕœùÄ’§Y@!ÆFÞªAw{q:¾·Öyš@	˜Yÿów½äðøTožP`÷luW¹Z¦7èKäEš”“4{/#ä×g§Ýâœ	FÔõ-8ÝvnìjmRíÏ	
¤9Ì6-§p-Î–çO'e-MCÈö"rúœ¬æÖ©è¢[êì/ƒ{(ž9ÆÛ\‘Ç«ÝŠj=ÍÙH¸ð¹h”qwz¦!åŽÎý8yâ±˜aÚ]?…H£ A‚æ\_ÍÇ—ËG€sjŠœªh@WR;?òý`Ì½õpÚ«üÙ>þZúiÎÒèËok¿”þt7mÚ¿ŠÇÖ£¬7ž‰¨²Þà2Âc :åÃå}n0gÌÓ¯ïÅ˜ lN2¿1dWÓþ}¢@„@«ì,ž*«Œþ@«lY7Â7M¸Eõ}ÁTL=~Ñ	1À;.ƒ<HwpH&4”·@[ìßÄ‚5¿«€	™Í
Æ0Ì{Ö§-!¯ë.â;&éHÇà¿Jþ¦ð%øo[<]$H,,,µó4µ–L1Iû'{¯zpî\ÿ"2jÚžZQ%O•Bs¹dl;¬Ó0×’zwciT¯®ÐPnáúýÂøÿ|BÌº@°2_'.þØw×]:=ÚÏµ¡_‚ö`üÝî_i/oXüÏ¨EªØ–
¤ï‰Š¨Žº€×R¯tèââª6¶ÚÎàš…¨“°	tSd6c9b„KcÕ‡¯²n˜ÅŽ¦º¬áä×òSý[Lþƒ³äùn$#b²:æ¯|[ùJ­yÆ_q·ÄÔR4PWŽªf©*¿ÄÐ™_¢l€±ÎŒ×&çÚ%vFhÊ³û£1V‚GíøšR«-‹[êÎEØh›)k_—.°sæ~¸ÚU-;¾ñB«Ë¨éá¶¦â¹ôœ½ûNG8zC5tþ&}áéÄ1vÜ]wxþ‡šÞÎº|øoïñû€Ç³t¹‹¶ã+´.(5ïZÍº4Hˆ±ò¹¥Á™u½ˆOËËÊ	•³’ ¢M‚Nì >Q£åÖµ‡2ôåMÃ¤ˆfaŠµIOSZ÷©O”}G™Ñ¥4
ƒ¥A´¯o‰¦m¹†£Ìß«4˜8N]Ó” wqƒ‡íÍâ°ÂiPYð§äƒ$e>IgÛó¤Ï”V‰"à…
Ù¨9ÿJ§¥æEcºdôð)ÿÕam"T?,,‘ßt¤Ä×ù7o8Æþ¿ÿûÿüM„à(š®ÁkÞ,l·ihm}[×Çò_ó( ¿7›óØk¤eñûë:™?ŒO4Ë^“6Xz-Wª¶¿T’§Ùƒà,ŒyÛ ª½g­ï.½Ç;K‡ÒýÓ æ’ù£rn	ç|Åm‰÷£÷Ä ÜÖ|ùøk
ÊO?žÿÿú¿˜‚ï¼–ëÞ<]c¾ôÅ†dà+ôbw}?L£Y8þí^¯túÒ%æ7å]¥°™ž d+~ É= PœÚiHÑE­Å¿¢ß‰-.UÖú”Óv¥áªT0?ì<ÍE&oýóÿËàñ¥Î ( 55£?ëD*/Oê„d9ÒE¯åvkÅøÀ(/Ç8é?î;.þY8Xa3>å½©l{îæÓðo„V)›w‡ÞT6¼¨U’Ð³ÜñEïk5®³ëÒh‘Œä}ŸŸÖ`{ß'l’Y_Ê,j–[y]¾¬àîÿ&þ(ta705Šh³‚:µ³¼ßš´ÝÜíSïM³ü>}
åÝâõ”êu>·}Ú”OF;’zÕè²3Ùí€éÆwvµôø¼îËSQõµg?3ùœûYôz‹ýT¶Œ‡kì°äŠ¿çöÓ4?Çî6s°Ö¦Ù?YH.óÓdoå-?f¸ñ>‹oážµÊwõÖ\)Èþ±2çüd¡…„¡,¥»l¾HÒÆ¹R¤Aõóµ¾HjÇo\z¼ÉÜŠ&Šçéçí7ÃFïa#D¶ü=l…™èr?›QW³Ô·Æ·Ð~|yñŽSwc§o—ÆáL†w$½Wåö>^Å4þWñŒææ›oÎ§cÙƒÛör
Z7^÷ !"g*|9òúþ-5!™V4Ø9
U†ûS,µ¸,¾#šÀÈ{üš}UéÌ"h|›=>¹ˆBz	3ùÄ Ìúi4Á¾·eq_¬‰€¤qxÆ%NÒè2ŠÃa˜m÷9€½tÓ »”ôŽÇƒÑ¿ü@	Ÿ>&¡ØáåÛU™Ê¡Œuß4ÿþÆ h†~ç wrÂZ;X™!ˆ©ªªÀ(ÃÛX¼¡‘Ã|…–Ø*˜°*0ò£$Íƒ¸ÍDÞm”1,§@“Cä _6c¸I+ÏÁþÈ'wD†nëøyog	‡Ž³iÊâ´êAFý#®9“`GY•“ÐËñþ…ä+Š€lÌÂ¾pöÇ¥½àí<*g3fUiËgÞ;K–IÊ”òÅzªhm’Â!È§ë _lÔÒ»+> («`ôƒñÉ†r¥4>†¸yHV¢R“7ÏŠòJ´“òKQàT~Õ`ºÙ;Ï±€0‘¥T€$C»¾€³¶Ñ Íäã•ŽÒ?	2Fð54¿×¡
Â§­É/`Û‡¼˜¬ –Îÿ´-HžY³Çá>ïÀ¡š¤!Œ"Ã”¿bþ‚_XÔ•ÀëjÂ0JJÂ5áÑºXš¦¨\­KÈøgò.ªŽî+Ž@©Þðh Õîºë{júsg:ncU6ˆÝø¸°«ÛakzjN}è«/ä•‚]âiæƒGð,°<ü›H‚
aD…ë$)%iŽå¦£igé	Óã‡µÏÏCŒt*Jb~‚Ë Š)qh
wh}ìê"$òŸ%Sþ˜AÐËLÝ2ž1>,‹Ò`WÞü‚	vÇã]'˜êçÍA”žeûýH©Â/wOÄô<I>N07ì““Ï\êÞ…†N£)Ø¼¾0!mÃeàÀÁ`%Áp³sQ‹wx;JÐŒèfFü‘Þ!Ç¿Å$ñ¢fæ±àëÈþzyŽ%Tâïxd’–$¼kù*‘fè¿7Ëe]Rð×•Ñp”—4IÅ°%b‰­K–KŠ»UI¹T ×ƒæ˜ÁA{Á:kË4ßS´~à ß‡6ÙD%4T@á]ÄíŽ£s]3¬¡ƒ%ŽÄä¥ÄnEg]HMF¦!*¬Ñ(HgœÙÛU!‡|•­œXPŽœdvQV—¹H×yq &\ÅŒ\……®”Tueá©-†¸Fw7F¡x„‚Ýsñ	g/µ¬ÃeapÆÈ{Sú.Äe4˜‚3C¹2ÍP"!Ù-<ŸÆØþhld‡A|†êÛèƒ AM˜É2ÕÊ–…Æn…eVÄ!òä~eª‘ Îdù,ÎÙDÈ=Z'èŸÜfg™í¦	èæv8Í—‹“™º>ØyŒ)§ d’¨<J“Q’»J*Éäo¾Ò8Ø, wtï•Âå®°A?Š±0ô÷¦’ý	É$'	F ê\Ãf &%¤uvˆ"ÔœNYtŽ¼ÒÈ!)§8Ÿ S'	Oem‘¦ÖGZØ¥ˆƒ[L@Ø±”WÁ‹ò)¯_Gué2°eáäÒá›ÃhLeÈèˆ†Ç‘‚¼0w½gÄûACÊÃÊYx\FIZ’ëš‚ñ={n?%D»³Ö½[ºï‚ª­¦F²½+D;×žÙN2¢ÈÖÕãÄä‡ßEÒŸâøØ#‰¥Ö…%árW‚çŠ"SÐtÀ€¾
_à<0¿!è#ÝÐ–Lp6sˆùÛ˜›öx&Â<J¶Ïcó>7ÕËNN1ŠKÜÉÁ±äRÈMÎhë@RæA
{
¼€ÓcJÎÞpÚjnÛõ%½s¼0,M~€O¸N~‘ÄÑ ˜ÁÓ<Áï£ opŠÿ%öñ(§ð˜¹‰ÂV~'ˆuïm{|AÁ†c¬‹ŽÜôñäü<ê£–£8
d½ 	Þ ¤ÈóCÀ‹#’!¿M£”¾)0b0ÙÎ1*6©¾ÏÝÃ3Ç}?\ÎÌÏ´—¯BLT36ÒÇ¥ïmO…@/¸(n+ú5»ÁvÃÉÞ bö„Á"µ ˜°z¾1µ]|±0Ã…^ J)	ä8úwÌ}ÉY!CV„’S²–ioËWËKRy#ü³Ü­¼¬]F¶ö2åø'a˜ÿ>Â•¼¾¸?cPBÚœ!ŒŠøj+¥o¸ˆ™Réa¹HÞCy/¶ó¦ãšC‡ãÒTzÄ
6î<u«â Š†ÄIí,<í´U]ÒïÙ_B˜BoçÖm´o¬©pŽë‹„W(°½è¾¸âÍÒ²ÿ%C²¿$p„—Ù‘¦ãœÙ‡LjfÀµ5Bâ|ø€¬¿|KîèZjÝÅhx ïºØ²%µÚÝ6wè¦D»Û¯4¯ƒÍ™ìi„>><háœÜ6¿óºb†¤Ÿý¤;…j‰‚(ˆWòh$ ôFÓ\;ÚÙ8£Ë@øE¬¿ÜÓ6ÛÏ¹ý.äa¨)!šu"¨•v‡”MGÀÆ£¿KGÃk,Æ|¤ˆæ„lëõÑÉ’MñÂ½ð_ÞáÙŒûúèU³‚=¡¹Õê.¸Hñß^ è ¿v’ñ>ü}—«Íôûì0‰á’éA1W¸ÏCúU}÷HŒEÌ'Ó®AïJˆê®““ázÛäÉ·§Â—bÓIÅ&rVH¿«¯”ÑqÍ%w—e’÷Dc0r–Q!
âÍ<iFGVo·p“47T“né{æ–óÊc ÊÎgaWÏ^ßñù*Œ'¦eQ!@ù;Î÷^ãwŒü˜¢=ŸN¹WâVrÓÀ¡Âˆ»µÊð†«•.^Åt×Ìƒ[CØØÕÄËë²±æ¯Ù(×”7Öq¯ß-Ï)aØROÕÍ>2L WÀÐøÒï&ý)ŠQÞ¼•¯„§á!£B±%^Mˆ=D,È¶ƒøŠì5¾õxxž&#~¥-H‹ßhÿ%$‡ª¾AÿH)\JgÂÎƒQGÈOCºÈÂøœ{€°I-ä
ä.bšç¦á™€&•–NÃÿN9jiÍJ0w¢ÕÞ&72Q¯ç¡I‚„.sÇÀ!/’àLà”hòáõžÚ@±8š¨ä(Î¶Í^„!7’majc’-mOÖˆ®˜h™-/(ˆ=“HHçi~+âõ›+§6Nf3»ËÙ•s`J™@˜€/K7ž~¶M ¼’]W¶.}cn€Ã"`‡«³yóªÞFpˆE‰™Hä‚„ô	`›£%Kxë˜Â5*h(A3Š—žâGÀÎ@±º‚¿ÏCdÿüÏÿÞ|ôhQ2w¯éÌ‰6:kìŸÿø/ÖÝÔÛè,wj[9@ÈjÑHw‹éRÑJwy£ÁX†A1’Ì'8ƒ³£·²±üˆZ)5òŽCy¥ÉÕ2‹¼…=ˆ¡¨^¨qe5o¢ÿ†æÆØ†ùVT5«Nß±óÛdþ¶;¾‘U­³;e•¤ºO|Wô	›ã‹;·œÕ>gœm³5Ñµ%«]V[à:kežŽvï®½Ê1Ÿà¹’'ÎVË˜îÏ¥_E|x,o×ÚÝpdB¨t¹é±ý´'y8):ò×ë4:¡¸9z*\qHÈð<G¨%!ãŠpÐ‹õF±8vnv;8IŒA±ØÂšañ¤€Q\Fæ+oÇÉgvìŒ.àZÅór'È.(¶6Ã¥wGÓ8VÄ!b1Ÿ¼Ð}mÚS€Ðk>äUŒÊ‚å¤ÉÁêRÔkýÊBF.ë8¶¯ìJU«m$‚VþHi¯èkáé‘XË7S4wÝNŽ>mƒ¡d¬=ZÛìlv·vxu$kóü&å‹÷F*MÉu´ðôPÞ.‰¸³3].‡{r&Ãþ cç÷&Ë'Ýp…¥ëÚ×`åÃðä·)ªÀõú¿¼ö…“30œ¸I‘-ƒö<âÉSó=E6Âè`Ó©Ž%ÚBYpGÿ÷¸Ä-œjÎ¹~P«ô=;T³¾@/ðÃ²Ê(E¿àß€"–ÁºC'é(ÄÌ½(e"tºˆn ’åÃžðZ&ò‚ÅÉVN&àWjAU]â¥­/r'Ž‡¼	ƒVa´0:xq’ Áâµå>påÃÚ\Ýð»»6Mw×—Ùï$g~[õVÕt±©ÿ3	~«%¯øFæKÖA½¨Sù²Æ¬ˆOÆ½Œ@k`áæ@ggøu›eUÇÎ’Q¡øüz„GK) âbÙ$ìGÀ¡ˆrˆŒ2–Ï	J4¨diÊ“‡m@iä¾@$=X×X’±Æ(260KÐˆþZŠi6ÃsbÐØc"ëaJÁ90€¤hY“Ïø'w¨dmk7¾îßO¬µëœ|Ê€ëNµéÌµyä~ú²ÄÎSÄîòâvñ’Dz·—AOP'£pt·"eb«cì™…@Ì–Äy¡Ã!ÎœëXÜ!‹ãEjeÄC%ûZ6˜tÊjŠ $„±EÛ|©ÿì9 åÈŸOI•Ý6HƒaD}ûº¸ýÄ´Ù›L@3 é-$zpªÉIS­°=l/±…ƒ(ëOyÎÈ²ÐènL©Še`Ž¦èú#(|.Ä(Jî¾&;f"Io1¦¨Î0*8Ëì Ìš˜—2ub¼Üöâ0ÍOSÐ†Ÿ…D×Ûxõ*té]©KŸ€.½r€Êô'¦Ôça?˜fJe:A¥•õƒ4	‰.S{1É)Õ6IŠ\ûÇÈ9#DD`]žFÃ!W_X'á~'w=…«¤#®Ž$¯P$&)ñqºœ‰\Ž1t(ü\²d]}fxŽhq·#íÆüËqÚy"ö[®©ŸH ;Ò»zægïØ,,€7ðaKF8¿]{×ŽKZSáG<´¯)Jí49Ú}¯éˆü)ÐáóqxÅþ–Á3-i&Â’È«2¼%‚–Ò Ré8Óq„¾ÔÑ¨ø„b>ð³`ƒƒÝHlvÞÑ´†¿D¬‚¶i™Ah¶ñ‹¼P†9=ÐIôê½W™Põ"Â|sà­?¼Õ]Ó?Æ£‹×
k‰W~`]Ñ¡DµþÞXsZ]exñ‰¥€à– {¨!PFQÎë`0 u½„â¡Ú@»XÃÓ²È„~ü0Õ‡†á´ÐzÅý‡!°>»m6&?ˆ*¢U?ø•ýÈôçÙS}ñVX÷á’F‚K	CÄÞZj6ÙîÃŸpžÇ! û4î«ÆC‰÷÷87šsëa{s4‚ßtÃŽÃ ˜Ý>dIª¬£A\a¯Ï‰¡÷Æ0Z|P‚»moêñ¼d‘4íËi2a—»[á·£•ÅaøñÜ£Q€‘¨Î…rX¸0ÍQ€}km™u:ëË¬Û}°DË€¢7dÇÉÚ}OCíEÆ‚tà­î²AbËl­ýp™-¾Pˆ,j¬bêúTDJ³oa]Whéöà¯¤akzi-\„ñeˆáÁËl®‹~´çðœ´´7íï°g>áÎúžÿóHŸòË4˜i/¡,h-ð‹Ó£ÃãÓÞûç?þ;ùõätï5;<Ú;îî¾9Á›ãŸw÷OÙ«Þ›Ýç‡‡ÿÆW¬‘=ÞèñÞÁ^ïdýÒm¯m.,GSu™]3ØÂ!r&ºHXTÌ†–õF¬	Âc)(4æ¤w˜ø¤»ë°[âŸöÚ@+œ!­µ×/‘rÔ†?Â9Çú¨˜f™š_$Iî `þ@Žfýqx@çz˜™ŒgKÈô¸[ôðœTçgW„‡ø'øÏã'Z‹ðÁ?Úœ ¦Kœ ÒXAñ¬èó$Ï“¿JÄCŽ+`7P·¬5ëXZƒ}uºWÙzH¯â?(c”VñBylÎÃR\œ‹v@ZN?™ÌäuWÂ/3Îs£aq¤æDÑC@v”7ñ(MòT`í¸™+ÔõŒvw602–
ÅÃWÊ#}”Â¾ÃëMÐŸ¾»V¤uó¾Éu=ç—wcr×ÊÊ
Û9üeï˜õ^î±ý7û§û½ƒýÿØk¥á=µ'…ÆN.H5]Â·¾Ñ·µ`ìÝM8­òÎçŽÐ Á…Ì‘op«£Œ/ƒ¬h‚X<È„5m‚ú¼$ƒ—ƒî¡CªŸ3
Ž“òè,H1Š¤ €[J’ÌÙ„%í Z_·r$c[bÂj>B,Ó`èY›\þ1€äü\Xchii£à¦Ñ±>˜˜Ä&üKŒ‰þQâ¯™ðòŸÆÒI4ÖìƒRJR©8 +­ãÀ66Ú]m¹Nñúãã\èf÷þ¿Þ+ëŸèÐóâÜšIZ}Ø0è-y†å°O¦g+yƒ¡›lÏ|gË7x·»=ç²fó cÍf7’î›RçÛŒN×O5úvÔ¨2;‡¯ö{ovöÊúŸÅÃ5Œ$/½Àèæ„ìÍBi$-’rCûÊ’ºn®ûH'ìƒ„ß¥‰Óž™Ävzyä_ÞN‡Ž%ý#âªÞ'l¡g!÷$á€ÃÚyŒBuµøY\Sø#âIÏ¡TÜl¹¸ÒàÞÖ¾P:eTºP]lùŠ+ôtQ6—toaV| Ô£HN¦;Ã<z•{<—˜©ËÁ“´Ì1›/ãèé”Ùˆ¦'C£á‹4êËtû]qÉhßò¬|÷O|A²ö‚¾ºXü`öi£¹½œÁŒhgNÚµbL;Å>zKšæ¾¦÷)¶ƒ¶„¶ø*ˆÏ—´ÁQ Z–›&Eù$P¥ áÍÙÖÖ&0©uúŸ&oÇ?ÞŠ}ìîüüzïÍ);ÙÛùùxÿôWv¼÷rÿäôøWc<”ãÇß­aj¬•^þO·ëgënÖ`uÓé¸øüb>dºmÐRÞÅ•È€HGºÄ6ßŸO_Ã´.üóß	W™ý{\[y™]ì¶T<žzõäØhïx·xYÝ¦*v S”zëltÃýû;Ä¬‹öü€wÄ!
?¨³ÅÂÝ;>ÑEÃ”µÊGSÄHdlï#žøp°´ Ùwe
ä´%Lb}ÛÀ ö€[µZè^^æ—·Ë¿Å#¤6ìüÓ¢ÇÙL6;·“ Î²)èÐ¦u2©™¦Œ¯[w_:Yvß°ºä]S]ã³7K¦åÐÛÝÅƒxøf—›/A˜¿9ÅªÛ–+¬ìë¡ÁÂýv…çõžUƒ*åMù[Ó®dî°à\$
"ž–eø/ñ¡Ì>}…A&Bu:mv|x°‡jJÁröÞÀDwöˆátáP"‹W'A€Ø™\dÛEÃø³@Añó¢ ]3ÌôÉÑjÄGDx[/ÖâNŽ®Ö…¿‰ça QJJ
¼ÇP«›N.”1"xžä-mÔ0NÎ0É Wpv±¸MU½½ G
/p$Ó¡awG
h¸Q4Ø6_øç?þ'(È6{ž&ÁÀŽMÈú à´AHŽ…º€7À<EUÀ7JX'‘h€nvº¡L|‡T#™±G	Z“¡Z¡>s"‚¦{,Ô¶›ÀÇ	ÑW4™’õ!^ÊlC‘`XÔ8l;¦­×©iï$	âP6)p¸%SÊ–3Îxð0åüQàÇY	Ç
Êð3ÍŠüR>:™)FÇhLo›í'SÌQ¸£—§äðuW…SÄAð®èHŒÂœtHŒ€É1_•>¸)®W<Å•.®´4WºÙBå°ÀÀ¬*Ï
ë6;;žÐ5Œ¤-àÏÔ1P°.|lFBW/•î˜Ls˜yÆ{ :yÑ•Ë"õFî­Å@d·ËÎôà¼¶y~'Ý3Ë^>Ôm³“ÓŸw‘åHXÒÑñá‹ýƒ=v°ÿboç×ƒ½&lH° !ké0á÷&˜ÆñÒTè<OÚ—Áº¢Or†±PÒsÎS±4xœ<¡½ò.=‰ÕP^Û*l
ÀêÖÀ·ÅYzÈmyN	Ù¯Ì&íÇ"#BãÊ–U]sŽÙ'®úŒK^—µ0.‰Þå¤3e¨xMœWm³BIbH(%î÷ádÈCœÄÕÝÆâ­)á$(\®|D‡ÕÃÏ€#Ð—H‚Ñ‚¼¤üh¬”]ç¸š´-]ñžÍÌxl
™ä®¸ÈÕŽ‹RÆ’¤?Ú,2Dd™‹Ð×Û¬w
Ä.ùN^ííòëŽÓÃ×½Ó=P8v^ ®ñšuYŽàRª/á0Fbýh¡´%NÖzÚ§‘°›'°&dT@{ „Œ3y+Ì“Wg†|ˆ&0˜F†ƒ¤&ËðÙ®fY!¥J¢×pŽ£ÅŠœÁæpQk¯È0Ge_ä¬Ã€^á%Ø9Éë|¦ç¯.)‚
¾åp¾f˜H÷Û>ŒB“IdáSy®)Ù|ˆZ{Z\ÏÂÊN!‹óÊ-ä§ÿg#óÌEA †÷_îãåYïÍÞÎî!þö=Û½ôø` èÙ~}øfÿôðxÿÍKvpø²±öVä#ºT˜@¢‡‚håÔ•.cúvÂSQ¨øé²"D‰âè%–ŠD’ƒÈ‹Í7A*4 ’ úÑ4Š %MÆ öqAÛÒ¨€c£PØ†±J·Â™yÊÃórLË‹¸<ù$‰¼c,G‘ép›2@ÅÉŒ0ÆfÄxQB,Ñ&GdÐ£°%ç„ƒðˆx)Xºà–±æ1YE ö(…'"jû‰ÐPß±Zƒ%òä­Øîbkà{ä¼@ÍKŠ#N¦ ‚
¼8Úf À°G¸îS9Ž‡ÔiÐÖñ~š¢Ñ”¡Åí Ñ:’ëÃt@ís;ZèîSØY–FÙ‡9U’MhùÕX@Ç{¬·ÓÛÝ{½¿Ã^Ã/èÁ+éåþ›F
ÉáT‘ú-4G=3H¤ -°6F ÐÁø¹]BR=±á6çÔhë‰Y3~“L#Sc‘P}X]dXœOQíkF°J6§*ux¤‘ð®‚Ú0úò’º2t_^¦A¶„äTH•““ÖÜAK&/Š	¾ÌÂ A 'T®âxÊ(:ÜŠ&Š`æ™³ñùhd‹ÓÈîÞ‘)¹OØÉÏû§{(¾Ñ}òâ!þ³ÑH’kW³Z¢‡ð§
£ˆ"I%d²Â!NÒL/ÒL”ÓØ¥¨j˜h5>Ø%MÁ ªÑÎByµ0è‰0–½OrKžŒFŒW¯Ô{|ˆ>„þvä„2öüõ>°54G@4ó{Ò¦ƒ¬-ììJÜœÐêB7Wpåñà¡Ïh.aÀµúÑÓ! §*«”·ƒÛ€Á½,pl¤Q$j¸$(b±•ú•§ß3Òæ£ªm°xvöÞœì±×½7½—Üó½Œ“9:ÞßÉÞT¨ÇxBq1!ùz¦C„Ò|PO›q`ýV–5ˆ¨QaÆ7¬e€Sùy‚çóQ‘ò‹ïñ¤owPn‚g|Ë6€2¡î¦Ýe}W5C)ß²•î¶Â7f(í»z4Ã@¥ƒÚÃû­v(ñÛ×ŽÂÁ ´Q+ç9…HŸ"n"™y¡”ÞW$…‚ˆ·»äŸ÷¸wd›i‰K.B3|ÉšcP¹‘-Ú¡px‘°J0ñÜKÉaÒD ©>;ÃÜ:éc6[Ý­Âk8¡‰ÈŸã{è •¾RÛó\V%ç9Š”™PPqÓ£ú³¯{5wéî;:qOCÄË'Hñ+á`’gˆgJE¤ðúfà‰Ë8«ˆ4ÆÜm¯ñ¡:yÛh¾ÎÚíœèH(my­oêl«¸oV{_„™>a-Z°ü08tÖº¶Ìä ¦ª®ÚÒi¹9ãÂ’‘FW‹Òr‹¼³.¸dñ,§H*ƒs_ŠJçmÅNß®½ûÉzZÜmâš¸‰v]”m:/Jµ…)«}YÞþ¶ÑÞÄ+›5­»Ä¨=ªŽQ{ÐYf1gÍ~L¿á•£T—¼r£]aÁ°÷5³{¨à	Tl#ÝZY›AŸÞ›?ùVUðG&Î0/šmÖdF¼	˜&W¥®¼–¦õ·ÑVäoóÓ^uíÜlÇ‘7‚Z¸b»Ó;Ý{yh^Eoh×¿›¥Nøë§{½W{xuö3Þ(õŽz;û§F+[›šé½yósï€Ã(œñ½ð‹5šÊXAm;1Þ6Ò¸}hŸ{x Ó®ÒðG Â,p•‡Ô¦‡Y( n4Ì‚ÐzVÙ¯ >-˜(3²¡÷èIåGo‡+>•-qÕGo¨Ðô–¸îS3&Ð~Ì¸7zS\ý)šRZˆc½q)•òAˆ8éþàc©â)Šü‚ýëRaíÎ’UÕ¡‰2ÿ£«Ê‡c‡{nºö¡c–ž|—ÅóÊtèáÆáÌµÍŽ`-¢Ñqˆ®-ù­ÑF¹¿Ü£Ž4å ÚéB&ç#Þh?œÌe×XˆYÃÂÁ,Ú¼Í–î2FïºV :F‡ÌÏðÔ kØ1hþÖö@}ïdZ,ƒèè¡[Ê¨E4F‹>Æ›Œè²ØhŸUÈìn×+³Gý[<æÙ™¼FâX„pÛªƒ«í¦átmùí05äHlžbLÄŒ0+Íé“Éx7¥)ñ*õêÞÎéþ/<>þèøpgÏ ÞR³Ä¿æ›A½Rú°jwGò¡ÎcT^^Ð'^Š¡¡'dQ— –âd<ÄDQ·a-«Š`~3…Åô„¡M¶6k8<"íž€Á³ˆj§È›ò¥6Û—^'£_r:¡;{©&!tc	#å6,´™šdf§gØªºhÖ»—NÛ­kÚ»yxÑ)2/Xg¡&-CJ‰û	N¦$êE€Zö|£6ö„Ñcí<F­¥6a—e‰@H¢KÆä©¨%Èmý@¨nx¦ÇåV§g<ì¨ÕYŸýäxáõÆ¨…<‘µ)bîð¼µ°½`½büAù•òíoAY))0…Õ#ª5´µe5 XðRhþ:á7º^¯|×Ù” —ç¼E	bgb½Ê$¸á¡‘\
r§½CÒúÒ-Á.©ïkuÃ5¥…ÞA³™žÉ¸å†ó5i‘îL3Q&QÇa}B°ž¯v9æ­´tÏŠäÂÔî–T÷PÅQ"Ê‚Ö(Û¿Hô÷Œ´‰c=ïp&ÏÔêˆòYbV8ZPÒ'1n)/ÁÂ’Æ³™+ò°Á:¼Ný* €¼p»"„d‡~DiO÷(Ó„bªâ`bSŽÒ‡Ô8ÔÒªÚêEïy	^A5Þ—æëÜ“úñéÇÆ–h‡ÔÜ‡«Ç9yßšaì±ƒ¬ ™'ÙÀ–½´%A#úÐyW…_NpÈ2ßZ«á[ÿ?   ÿÿ LD´xœì}ÛrG²à»¾¢Œp@ ”%š—¢¨±6dIG¤<ÇÁáZMtèQ£ÓÝàÅ4"ÎîìÓ¾oÄþÁþÒ|Á~ÂfÖ­ëÖ%=>FØ"ºQ•U•™•™•••M¦Ù'×Y0ŸÓð”Þý˜&“bJ¾"Ûýùšlõß> ÆÇzOéøÃ›`BOæÁ˜vJC~G# ½±ªjšä¹XÄ1-~„~ŒYF“âG»Z˜Žû9-žGq|”ÆiÖtÉp¸Õ%£Ñ7NXxeã˜vfA6‰ÅNWµò5öG]þOûy{UeÓiRtZS_Ñ"­.i%i6â–·}Qã$ú™vW•@tóá|3ì’GÐÇá`Ç[¸€’H]¢FöXÙ¨?X‰rbòu-ÙGýÐR{Zç”Ü67ÉI$a…$¤ù8‹æEtEÉ<È‚	44%q:þ`ÔáôÝx%»|À4#†¢Ó”¡qÎU
èÿ_¢°˜ZcåÐtþ+Y[×Ç¹ãÜ¶ÙÛ„Ø˜µ=‰ò“ÅÅw4iý`ÝïY4ëlôiæ‰Ši§µkóO%¿éàHë"ÃÙ­bC‡	û6gE—¤£ÁÜ°ÈéáÒðþ¿5´@yùa-6_V#ÓæII9ºŠ¥mvp9½Š¶Ln/{³Ô`>ðFþAÖ£¸<§ÈñEš‘˜&J&ä‚×”&$Œ./)Ö¾
æÍòz{ØûÂgÒlN.ÓK‘Iœ^q|K‚q–æ9ïÀc³yÓæ×„r@a\?gU:¨géu§AHÒ9…~EiÄd²ˆBú@)¸¢ÖÑËÃ““ŸŽazeó,ÊéOïršýô},‚¸?/9‹-äŒ‹,!b/Œ®È8òüU0£û­‹Iïz”Ì¢¤7íƒxÜWÓÞÃíùÍÆ9¹ŒéMë‰ýÝæWäºC^WÑ„õ|µ)i°—ðëÞ£¹H3`Ù^&¿äqPÐ4Aòi%zâm7½¢Ùeœ^÷n{Á¢H’y‘Îz ¬Ò8¾2Ö1öOoœÆdÞ{Hr˜~nI‘Î(ŒŒ7µ3ØÜ¨¸(˜]@oÈü¦·­ÂrÓ¡^ùºw¡“¢wã„½â<†ñ¼&êLž±þjgyoL‘RdÌ{#xÄÑ˜,€É³qS³UB”„“ÒüÁîø5 ›ÂÿYºH@Öõ.A·à°£$Œ&)Œ{@‚$ša÷æ‹ÚÛæ 7§CóÅÜôÙp0¿9×G» 9@²•#)1p<buVô†­'?€ªÛÙÛœk$àý¨$	£êMJ
ô(ºËé/ïÏ‚yG<ý'‚ÃÌ‹EQ¤‰%ç>ÐÛ}	 …Këç49Ú|Ø¿ël Dˆ‡cÔŒ'¼Æ‹°SÖÝ°+—¸{Í©1ÚÌo‘ùmoK‘
ù¨d¼²‚qÇ6¢0É#l¢‡¢#\p9ÐÊ¿´¥6)ctìïï“²‹¶AŸÒV“>Ÿ!Ì°x"¿	Ö‰sFÌX9qËßÚ>¸»¤=Å9»«s …¤.Ìˆ¶eùÞÄ¨5/l.A$QxÀ?~¼Ši÷7Ñå­|TbGCõu^~slŠñ>D!€³¤»#Äà®Fkf™+å%c¦G2«¢5«ÿæÒËE´[˜Vo)Œµ?ŽÓ„ÇtÈ*™¬$ä„aÿŠ"]rGr0ZvÉh ZÑž®ÀqéÈ…LL/‹RæO£0-</zƒþŽ- ‰%¥îÞsÎ4™Td‹dˆ’®¦ )Çm´W;>Ô—¥½È,¥T¿ˆŠ˜ÚxAÌÌ›KH_6´£ÅŒÄ`–z&C©Õfs™>žnˆ€RmØØn0LµŒH“FƒõpÆÞ&ÙúÛ¥l­ÆÈ¿-@\“ `Ä½yöœßÌS¦°æ˜ÐB³M<z¿è=B{¨D“9å`šn>d†ÁHi¢-%=¦ôéšâvŽöû¡eü¢”e}åªþ4…Þ›˜3T½Wè¢¶RZ[,?,ße•øÏß¨ršP[GÒ2{ŒvK§qK*×-)! a
sfÝÍÁ „ùµƒ|žf½y1¬.o"•M³ý–² ‹)%P,Ê(y-éœümi”dc–K°Êu0?*`(áöï†ÛK²iÆHžÿû›×oOÉ÷‡¯Þ¾$§¯öÞ&ûIg{û¬­ÇUÆ–5û37°¨ÐP‚¬1´ÄåŸi‚Ã§8æ
¦t„¬tÆr¶ÃÊ  \•Ó–”ë$½d(Ä¥KLîÎŠ¤‹2d‘EÅ-/É˜‚0Ê‹¼vgÌ
kU\__FaÅä}®E(`!¡&:Nó#îI ‡ôÇ,ˆáh¯”¦9"ñdø²vIÜô®{Û7±9Ë¹5ý&£9ÅÁÎÒçfÎ÷f)ŠÑ•Ïþ´²-/£æJïßÝÖaYZÜî’A—Ürk—&¾QzÈJ{
Ó›¨ðÀíù —³kHCªô·º„‚¹¿KÎý<@sðuç6˜Uº_#‚÷.	ÜÕÔ±T—n1S³<¹°×|•ÍÃR—©#œ›ÆË·¨RAb.v<c¬¨¹79ba§zé¹c/=9å ÅrSJ Ùãsÿ Ë…Õ%Œ¯“³Zh0X<»qPeØà’rä”+êJûŠ›€\0nëÂî“t´Ö4ih›8¾Ù*GŠ§ÇkvWxM˜Ò{›¥œ15%©*å,ÊOþ¤~ØøöÁòÁƒK0Ÿë¾ÉRÔ’?DôºsG9ÍÄ›.Ø1ïæ!´‚ßžÿá_ÐµÉé–ß§!hŠå.1*í2ï†a—tæÆOlõ}•F¡„} EŒ—fCÆÏ°aþMîÚ=ËÇÓ4Q]'ìë9ÙÇ>ÐòE~!	hÅ'ü—ùÎDå(?A&Vÿ…|ÒAt.ƒ8§z%`ÝâyšÍXcñ`TáëÌ0Êçqp‹´«c©¯ý@~ù…´Û]VžäEh–oË’K½3hÀÈþ¿äß½½‡ðîøòX±Ã‘É{Éá\Òb<È®Ío“1ÑKq'õ¾Žm¤tÏÙ­ææàÿ@ÿ¾ Ùm–-1Ÿð¢KÚJÞÞè’ë)Íh§-á¶á×ý}ø×Û¨ææMäI0Ç®£¾&°8x–ŽóÎßµbl XªOgóâÖô²+îYX9°–ò³ÁyY²ßïï€¯@Ð­M^SkÊã…/P<(ÊJÏ3íxJ:43v pt)Œ^§Y§uŒ8¹Ð¡ÍñÑµ$PáÄæe;ÜmÜ%g>”žs.áØœ‚‰Ó“àŠzÙ¡d¶Ø™T´¬SžƒY°ùŠ¦ Ô"Ò3ð,'”ì2TäµÿGvÁª¹Å }{JŒóNÂÖ']W-§œ*'_I\*¬JiÖ1¥~×ˆ&4ª(kÒµ$ß–-	Ûb¸+Kd`›m ç|î2ÓX¾dvÃMg¹ò}¤|É`q_‚eó8b_z—Y:««@ývé´dö‘T6+:¹z{0–}n(8k~„ùRuKKÊ¬rÓ·ž|+•œí÷™,3c-f™1Âßº’Ü¦XŽ/²®‡8ß€u‰»€ˆŸêPcû×ôŒ;ú÷Ojä¯öUhÞ
xµû»¢³£rOÆpK(w‹ŽÎGðÙ‡²€zcUüF¾×j#|é&A„îµp–{Bø"àË÷àóËŽT7õ·Ð%Ž…ù&€U5úˆ¹gagépšæ”)G§-t”#ÊöIH¯ÄÉm ‡°2¶8ÿaÔË]ßD…ómi2b•,eÈß`½ûq‹ãÿ¦Â?>rj‡±ÀNät5`ƒ•.©zBÿ9% D¿Kgt=lûæ©»9Uª¦d+Ý‡5öo]Ø.ÃoõÈüÔˆ´xGi8á{#Äv­ÍZðèä;eÜ“§+·Èå Q»Tñàe9`©<š~$«YÊöEØZ½‹ƒ»ûÒy…s ‡Õåƒn!î²¼¥“Dzaaïm²Æœ.TkEsNi3V›“U»[K)wëÉnÇQìÕÒY°ûVÆÕ¨›³ì¸ýt2¥õyúŒ[•áV!4Jæ‹ÂÝSB·“N!®º±sîoWA¼€)ã³p]GH°é'P¾C¥|‘k×În…w-º_¬§ú¬9Ï& o'CMªª‰äc Çx‘ïfˆìmý¡T‹›ÃøÁÜÛ@™.
¶W–¤	µ…T…Q÷ÈVäÄÙ°™Ï}á³ä˜üµç»×6³¤¾»CmÐÉã.[×Ë`Aoès0?K'´±fù£U[a%ô†úæWçhä{h8„5–²5‘Å:§Øô¬1÷ï„g¥Þá}„–Wl±Œ«üWR¿\o¯…£*¯	¶
I–éøòÙkàPªÄYh…B@¯6G…Ó]±/z¢ÙîâJê ‡~á“€"¾³žz
ÊÙÃ%6ÍFÒyh˜ìrqœÏ£-rÜAgÎ.Tóör%Ø@ýqà}VåÁíDlahB
wâÐ–Ÿ°vÈá)Q»Ç\äi¼@žÅäe¸â†¿×½‡Û#ýˆ,dÆ²Å‹ŒE²ÅÃéÍ2øéáRÃMÇ½‚žä|¾>Y]6É"ÜŒB‘Èa¾ÌÂÝòqÄcŠ$B~†§FÜ#·Úwã[\‰(b/%ÖÐâPPYp!çà‘»íaC½O^ˆ®5(í&Ÿ5È<BÜòÄ¿øÁÕør¸Ãå®N«½Jaé0§ãè2¢aÛµ+Çl³ÑÇÑ´’ªÊ0¶|I«ìäÕ´þ¬å_Öl%AÊ¥EsºÇ“jÐ´¯X üÚ$¾\Œ§y("Ëçõ¦îÓ,¢—LOÿÚ4eBäm¯1‰%1«IÆÁœíTÿL-šfèÏ(Ìé1í´ÂMÒÞXŸÈžWµÂºÔŒ Ä,ŒÝéˆžóØV>xÍEÁìZ–<ÄŸÖä E£53úÕ9Hl$¾xöé8Èbc…ò[×tF³ qåóýÈû[¡îzj~¥„,y²˜ ±9ú‰®è/YŸ•Àe¬þ::þÃm©á?ÜVÒU0²_™ÏßàŽÛ=Iëº`üÍ¬Mmttmµž¼LÇü4Ð‹ä2­"z½>' Ìƒ;_i+ÑŠeyÄÇnÕÿ‹?üR·®dp4g¬í»•€WùHg"Ö]1vÆá¬½yXÁÔ5dÿ\ƒ]Eùç~(šùxè}NëáæpÛ¼ÀÊÐïJ†úÌåE‹ÏŽ9ÞÌÇ`®J”¬g`U¾0ÜPvÎ¢„«”\„¡= *äì:ã‰V){æG0OhžÆ¼Ë
ŸLÓëç”†X	ÞD¹|ÂMm^æ(Nsª’q{dŸœ?`±lªe3Íì…åæté`—É­Û1¦ÓÉ]àQ°…_oíš²çÐ’-ÄxÂâr-..7ã ‡gçO:gçë“©X>w†eô¨ž‹òws½™ås}Å+v²iÎ‡õNS_9¡×'eœà+ùdí‘„ùÐÛ°)Ýâø4Óäõ%¯ÂßpáÍ¿KI&ŸøìÔá¼L'©ø•ÎÃò‘ÿ|M’ CõùËqF1¼è0ƒýxùÓôÅ }¶ò•MâÊÀÇ‚ã)ÍŽ@ó›§úÎ[:é¹‡ãB¢%\›<yÒ¹[®Ž+¬ük±H®–
ûkáBs9ìïã¿¢-ç'ÂÉ’|qa^%Á<Ÿ¦Eçï]ÒÁÀ<c÷„—³¡ìÿ1MÅ›©Ð¾þešCÓqfîÇp˜ö'²"ð@3¾ßi‘ú~ïÍ™QÑÜñÿ Â}°2<‘‚zÈ™A6KˆuEÈ™…™êhBõ\t–€E x&W ˜w‰f({!ƒÏX3Œ@e˜¡R8f]\¨Xíg´¢8g(9ž	Ø-ÂË(¡ }u^ÝäƒžÜÌ£Œæ‡Å¬å04 `ˆå=‡	ƒ‘yt’f·Pª}2â¸]þvI1bqçñcq‚	ÌAîí“ÇZ$_¢C`(ãa¡œÑŽÐ÷l³Ò‚4Ö~X/q×5Ú¶@ù;1	¬zPMÖ{ 0š,£ô	b(ÃÄo‰GF)¶|x°O
ÌÁÑnëóš³ý‘dL?£¾½@z¬ÚÙèé‹“×'ŒÜC4ˆ
Xª«d£ŠÙ/¨¥XŠ”ÔKÜ¤QoÕ­Ý–æí4Èôúí=›Ô2+„7æ;2®¾b*
àÈÛ4é½;iãéÜØŽSÐqšLPÁ·ð s„‚‚ç[hR{Qf¶aßQ–Ø­ã$ÔÑ¦J„k%×§Žï(D!þ8rFIž-ðj[}¡À8µ’/ÈžOSH'›¹»%OË¯zcå;Õ |54Ò—ç±KÞÿãüß/ï †¢‘äÌå{YÞ!0Ÿ;eþ‰›g`dàŽêXÐëßïé,5”*‹a·¬Í>‹Ž~æ(2(_Ÿ‹âÂš	§Ìž6û¤X7+ž×Y8ÿ«m a¤*-ÏÄYih0ï0;GÓÎY¸ãOLµ‘úF9Wå6hT™²¶2?4ØÎ‰ƒå=ì‘Òï”–Koñ!š³Üwx¾ „UÑå‡ðE.76tï÷¨zRð…W‘fôXÆ™wAX€‘ÚÖ_¬ß@×k8óœ$xÎ™‹Æ±À„÷\2Àu”„éuŸ,ÍföaF1Üšäñå: }W¤D0,eIxÄPÚ¾Àyí”‚ÿ„ÊÑÇôDQAŸâp‹fÝ	øÊ>Ìíh~¼¤bDt+´ó8±&úüô@y¢AÒ ËáA¢ÁØÅTÔ
¸ñ'Eâg&x#ãt6‹
Ý:á”€ÌU@™+J.0’ÄdØ/Y¡ê<J[1Üyùj¹‚¿,i(ÚðÜòí[
µ@ ¸9Ö”kŽÞ¾8}qtø’üåðí«¯þ¼K$E	¨¬0ºÀCÒ6K=?<:}ýöGòöøäøT?dŠöÈé4ÊÉuxœÓl$P  …lùE_¾$ÚÊ›¯Òùyi¶ÞlÞŒé¼àç¸mŒ™·Ñç î9:|õêõ)-á4¡_èŒ-Í[6Vî˜Îå˜gél^tZ§·sJÚÆ€Ú8DQ«_¦)ãF¤ë¸fM8+µyBDC¡b`!=ÿ™y2ÌÃ5óUã¨#aÆkéáð·U3Öšà|J<•|'Ü2´VŸ›Ž­~¦ñÏªÞñOÕøˆ1É¿}àŒEª´ü4=ŠÁ>A–Òl¨äÄÏø=X„QñSœNÄ/\m·Î5° ÕpØ˜ÀmÂÂCÍ©;KãÂã†9r­¹SJÑÁ5G2Ÿ]°ŸÑK‡%
¿þÚúÉ¦%¬^v€œ¼³?XÔÓ0o#žMâ“c–î²=hË7rÓÛàøˆæn`Q|Îþl×ž“Ip‘þ—	þ€Úþm Õ›šps“ Ý-d!4Cç)
•(\RYÁ|ÍÓqÄÄ“o$R©âHXÎ"å¿ãc|Ñ8D³*ÎçÍãô–ROñyÊC­Ü ØÖV*^Êe¦7É‘ÈðÑgºéÙáé!h×œ«ýëhn¨|"uH,¶û èbí|£à’÷ë'¦/>Ò4`	mIÍ¡´¾EyøôäõËw§Ç/t-1“ªÌ²4ÚÀY¬Ù|Y"¬62ÔàlÁŠJža
Jš³*¼,ƒ Sÿ
FÚ¿¯µú1rèk2ž©`5)3ÕÄuªÙÇÆ–¼ÑåI²ÅŒQj.<¹UJ·ÿaV‰žûÈ¥+ÕÕJmU*«Ò›V·8’r¼
eŽ ®–¿÷¿÷–¾‡ŽÄ(—Y9ßªâ	š˜€ùd+.Í†)a+þ³u®ÚOSñ9Ú+=6K{­ï¢™9#Ü¼cÍ\BXÃ)løxin»…Ç–C˜è÷¦þ¾Ê½i5Æz­×³ú§-»:jp,kYr»’CŸz…œm,Ë,
Úž¦Ž¶-R&S€XžŠÔ¹Ö˜V¨*é‚¶®ð÷·+û§±²më•"â4¼e c@†%¬Æ¦¿UÃ,_.¡aˆã¨q –ýñÍ¹£mgÒwÓ»ÆU"å.[H[Šï:WË	sÃºzÖszq.­`=²Ns\Ï±²6
x/ ïEã›_Þ9/ß×JOÔ‚ã1
¸ÉIwE~U~dè´ì}wúýËx<Tä[}Òe'>w±`›·É/’ü«¤yÛMàÃó«¨ÓšøœôÏç¥k§^2%m&³â£l†òs(÷–½/Å)/×O5À†o<šMLx/fÁ„[å³‰É±‹ÉUóÍv–´PÈ™½¶Í˜×Fðª³àæY4ƒª[Ãæc/^W ?aØw»ÀTÞW€%øÃ·z)_Q '¢¬mËè%xW „„ûÕ¾ìÞ&ïË·ªKüý·«/xÀ8½Go@t¿“·	}t©}Ù%CâwP"È¡^qƒÛ¸¼40$KñxT…ÅŠ›ƒ>æËç\HïbÚBøµÝ•8v›@áý.‹ËfŠÝÄïÞ¾ì´#¶9g{¢ƒþ£‡‚8ÍøÎŸi6!Ë¸+µMƒ†LýXšN.m‡¾lKŸÀëµçýÚVï»v0úZI¡æGžQê ,’#[óE\ Àã2”fµd	þ9Ì%É´\J¶LE¢Ö£“NÑYÃ97Øh*eYKQïu¡Kð‚™ûTO<Ú·Kdà+~ãÚø¯Ië[| +Áßð¯ßg*8ÃÁp´µÝ%ÿ5&äY
¿:zÛÅTÿQÀÏ ¡ðEœ^‰ù¾vÎÄ@¾MžãRHèœD›ãüªÔñÂBd)¤äë‹¿ÍƒˆEèFÑ F¦rrý)¬Áp:‹åIŒßºñ§B¤}âì‹4¼íãmIx4`Ý(àc<ö,U‚Y!£³ôŠšp\Àªém\Ð1ís³1¦Jñ
Ë¤™ú½—Zý‚ëUiÛ<SN‹lÔ:và¢a\j-7SÌ¶Z–£u”3ZðK}šÍW^Ã rDuSð›€:›Íþšln 6ðŠ,‚má_qîšû£KIxbä}/{d¤‹@_vþ [ô¿¢4”3]lAGG £x¹ ²ôZÙòâÔ;Ìs`22„ð]»äÓH	[bZœ¦°r`«µ³s^lâ”w±Êp‚ù1‚äšfGAŽ+ZŽçv·½ÁÃxNQŽZ…$®B^„7L#3à,é‹$¤7)VŸö£d/BšwÚX¸]f[Ø¸~:µ±VãúXÄ «£Æ øJÊ‹ªÆ äÌ$_çöFia ¯½¸T$2¼|'ÏYè).y,¡òˆàùî1ÍM"¾Àù.(ùdŸ0M<î–îKA/,Ì‰&Šò‡Ý2fTæ…ŒVT>î’‘ê8óø±p>5üþì}ÎÂ›¯¿¶SS8Ý#GçåœEH,gL.4­¹ b“[¤µâå¯"ªä–{†‡ªßUÇÓ Ãù
=1Í*¶³?2ã«å]ZÛ_Èï6\	¦ËÂTy&r¾È§½÷–ÃÒ30§Ý»ê_ï³QW¹,t¦4ã`t¢œÍÀ##Ÿƒ—ùúöÐ³äÅù:¹»ùßZ¿´¾Ü¡/•k±+Ï ­D÷«”€¦ë'°ö¥äSC ä/W Å< m²:Ü´/E’	›¿¼/lqüg_J*vÞ¶5U}·ýìª–s¶ÖkTlìŒŸóÉúšnèš]™ó9tç¤ñJ˜ñ`¿•t1½‚/Ëó\N¾%é7ÔŽº…J‡¢q´ÎWPú“dnA¿çU#Œî}ÅOe”šmŽ!³È•‚ÇÜ4w>›FêYt«ØS Ÿ¥ã·lµÖù‹mÖâ{VÀ™Ó&Œ§UûšÎÚÀØ%N£M2Ì¶b9Ñ%;ƒ~©îM3Wºk‡Bž.bLÅVìÕ.?ø‘f:¼æßZÞÊ!Wª»¥±Šá¼²ô4ÈpÌï6Ì]ib¤\Q)~Œ»ËÛHj‘­ŸÑ%

Ã½ãdœâ˜Ø‰¼ði$°òØ|¢.)‘±Òâæþù¬ì¶œÊfæUçˆz„wÁD	 ¹7 ?÷Î†ÃÁùê$ZÆëÇƒÁæö€àÂ0Kç=–)ŸÕæ>rrOÝð»Ež?žPM‰¬ºö¹ó½éÖz© .0ožÀ'ÄÁÞætË‚ºò²	è€zØzR=ì‰Þd‰u¬×$¨Q'rÕ® ª‚¥H¾{à¦±¬Ê¸åæñ§Üõ¥ˆõí{Ô&h´rÈÖÊ³g¡b¦¸Hê¦çu.+³³¹¹=éôªê5A“±Kµ&Z&½æ»7±^#4°Úßî…ÞáFhX÷(¶>òèî¿’ØydŠ2Ý +v|“ÍJ@oŽ€KåéU“¯D‚wƒïàcOÄVXß€}ù¸t\ÉÜv~Pß¾ô¿ÈŽ4YºiÐËŒ»Îí‹½sÇ“´àßeÚ”'mJÃYc] T•-ju2?%ÖýWOUgìpS?óLÃM³´0µ	T!H–ŠTÄþ._÷†˜®qhæ«Ódš©"Â Ÿ‚PpÆJ©`¼*#¥¸ÑÊÎï»Ñp»!‡ðÏ]H¤Øâvuž÷}¿/ÝÄ:€)ö'e=¼Î	o©›÷†-ÄÅ~«¤BÆx	†3ÍÞ¤0‰o÷[IÚ“¯DQïm©ú•ÌÆÕÜÀæÜë¹ìŠ“—ç›æ™£Ùˆ,"u]ã»¢_µÜlÐÞ°…íªíQ3ªÌû)5ƒÌà9°“¾ûò±N®™™ä3Ï!²ÿ˜:+§N©	*æNYà>“G#ÄïböˆàßùôafJýÿ1ƒÌ …­Úi¤J}Ä\R0~ªŒ ùUçT³Ì‚UwÈ²Þæ>r>û;d#yŒD•s²ê~
üˆ+&Ìpo?¥KRá›Ð–$f¸râ¹XÂw¯~¼wKÔÞ6¢_/òC¿'ÊHZ¯]01ª¸mbT}Û„ïÒkXÔzÇÀöa¦@-ší·ŽÙüÇÚï¥Î-ŒLÍ²?ú³.þ“×"b&Ø:¥PÃ‚&”«Ú*‘³+–äfìø¯Æâæ“4Iý¬i1ç‹gäË¯ä/í•œ¿‚ÉQò—Õáôü”L¦;K>£™¾—ß'³5b1Ü­%þËŽð³‹ÝO$nUxÝeÕÏÍ²2»ìjVuxRß ^®Ã}ÒÏçðÝ'á°-î2—\ðeRÛ{`ÝÜO_ï¥Oõ?/æeRÜ{a^PXóÒýÛÃ¼íðÏXð‹:x>2|sÏu_Íá™?¿w(YÆøtÊ€×ÓöÆÙàœE'}ô*CÛ°âôì~Æ/VïÇïbaRo6]nT,zWîÃVßn¦_éõÑ§ŠÞL¨Ý¬ä»øLÛíe—¬i$³7þf•7Ÿ]Jªú»7£m±„ßÛ«·ˆÙZ>ìÏ¹O¼—þYÁxžÈnzs;5N9¹Oã·âú°Ÿ{Ûƒòî2ë~ðÕr˜‹\/SÖ^ZlÜë°ÖeÖú}ŒÉLÊ×Ü|{4¥WYš¼¤—EÕ&¦÷.97#»çÊôunIëtž*9·oJoq#õ¸e³òÚA™Ï^etÃÀíòjÚ(ž(,…CSÇ±M™ÄºQÝH*î¹ûz–²48ÚšeQôâý»;éiÜÅÐ~6»á[ÿ±{Û¥¸DÐ¨2TU†nzë4`ÎÓº[g¤3Ô.{Ž'&!Û˜zL‚z=îž†‹~×³U‚»zih	¯’zóó/œ$ª.AíæîôTŸe¶Ñ2ÍhÇªàÁ^Vé@üXzÐ—×p¥E@¤ota„/YK09jK»æxæî\TÑ“Ì2ø§¼QÒdìÁc÷]üTXú‡˜&å4‹Àˆ‹åUgÃGÞûnXyMg¦e|öÔwÃ½(_+¶.¼	¦IyÁ‘I·.Ö£Òç¦O4ˆ	n¬Ü‡{NCŽ•ÝÔªt3ËÖšš`4¨$_þ„òà‡ÉÉ£(¯"˜ 2n…<3³'¶‰†Ù>–~bVòŸ+==ÇÀWÎÈ¹Z£ûÍjVæ&ôÊNþË%†FŸÉsÒ²›kÌLU·&¦¬tŽ¿às¡ÁÞ[­?½jH«\ôúrE¹³Œ§Ñ+ixw W•,½öÁò*‡}¹šÕ.ºñ® kµ?¦Ñ$Q‘á*H”!i¢ºÖXr©¯¥¾ÞÄ‹¼©Ö*m?‹¢2h?Ë“½MXG«‡Æi³ó‘i~k6ã|ÓEZ³¶ÖâÕÎ&¼bÛ
sñ-³ÝT-ÞÖÉiïì›ÁÕô¦~^¤3<w“ÆñE`Oþ½'‚ÇÃÏ€àŠWtÏ[óœº±µzwŒx
Ó_°å»Äm¯È,,Y^9ŸÓÂZÍûÑ£õË ßMï!Î†m"¢e†ê®86ª–ÂÆîx1ý¬-ñÏÜˆ¼%ò³7¤ÛŸŸ¿±"(yU3þUç'jœÏ¸‹æp,Ìmèˆ+Îáuæšml¹Ó
ó¬x%	îW…´w+¿(˜3î„ncÒcä¹}á¯CL~Rõ£…¶²æèÃ¥)‡##îlå–š6èÌdQÞkaðöû}@’ƒ!?:q?@œ•VÑÜ|fÞtDÔÜ†jÈKÐ‘ˆB_l%Æ+ã&gRô_TD±f=wûÝ…[ÀJkà¡{s´Öòc_¥’Ìä9Žyos:ª ßè<aQî bØìÎ"ÌXšPxÂ+„iØ¯º&w-~sKr ÊsçiD$zb;?òëVuý¶ŒE-oËì¨›3ù/y“y€à57>ÇånÎ¼|ÄìêgÞ3(PvÔIà\vcäZÌNiÈ«±*¯îWÁÌ(\•ü@¦Wx‡62ý‚—ê¶¢œcVoÈ¸Qçëƒ€}ŒãÏöíôvÿ³NóÎ9’¹é;•Ya¡@r‹±æ¾Ü"ô*»Ê
„¸Gm­I§¶+¥ÆdÈ¥`×¶ð nXmä³f½“ïÞÃ¸ÏžƒýQg*üDV-ªPñÜ8ißðŠ…çš6÷#2…ÿ­ ñÊøze¯¯é¦_pÕ!NvS×S+UÓŠAM³~ËcÄ8Ý²ôØðaåâRU©VZU®‰‡ðÕT§ð”¢Š)³qäÖžd‹šk©}MIKË'Q×Q›[ï+ ¯@SíÏŸzÒzïà¶nÝ¶å‹y÷ÿø_5WnW´`"r›§P‘eKÂD°(¡÷ÿøÿC¾Ô^.ß×5ù‰1t×ñÜÛ`}D>Ayµ‚qŸðYn]dëÓ“& ~žÿŠØNÞ×œó&ñŽ…ò.:øµºS!©âÜcõUBÃVeQÂby\ùå\%ï»ïÝˆ; jZƒrŸ¶R`¯ê'ªšÅE_^¹$;ŽKà>IG°Å†¸= nfûâ{Þ^n¬ÂD­î­Âµ‘œÅ¿Àk:6ãÂÐUªTôf5hVÌk¯è;I¬Ãð2JªÊ…¾×,6ÿü¿ÿý?ÿ;y,Åfv]c³®7¢JÝ0Ï«ã_å"ÛrÌgì.§–s5j¦¼Ïx\ç­ûYm«Xƒ@Í³^Í&±ÈWÞC&
»æ÷“3ƒŸHþm½ŠÖ>/;ò&Kg)¡(?Ž©ÖÃL­MWlÀ}« ­4/›X Õêq¹Ñ©ìÂ§6*Ü%q½„v˜GÛ¥W¶½³mï¨W
å®¯j¯êá*žX%<|Cð.N~Êî¿ù +;Â7	²2`U0ŠáÙ^±@ª_aËE!ZD ÕO—µùuƒï®œÏj¶òú³Šçšº÷•©Ë‰ºúøK¹º;x¿áÞ£æÿØië>îò_[ÌR¹÷$V~šæv¬ûX®;•ù‘;ïš¹òz7·Ýå~ÀO0èæ%ËŒ™—gSÂã§ÉÕz•ÝmÊ4ì*´÷Š7Yžö¨ÈÕÈÚh%/‡ý÷{RuQZýç^W¯èHƒR«Ë8q¼îÇ6¡<£kFjðW;fl¯µÊ„uÕúAMågµ=óNQs¥]S¾T~šç¿-ÑüÛÌžûäë>¿¹¼æ˜ÿËä¡¼¾P®+þ•³
>æ÷{OŽÙŸ†BºSµa‹åÇÎs¹šˆVÒË~¿Ÿ7›¹Npäª:+y¡Æßã	¨ý\|°Š0é
OBzëAß<êû7Æ¼—hmÍ]•õ8oài]q€ã^ñàúGÆ†ë©­?~^ïfA>Õ¨rª|ü¬^¹›Wí@¨€ë‹aÅÝ¹élC¸GG6Y„›ºÉR›(ÜÛÄ(]þ¤~€Þ,ÿ?   ÿÿ Ý