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
  if (isNaN(numericGrade) || numericGrade <= 0) return '';
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
                              const docRef = doc(collection(db, `sections/${secId}/studxœì½krÛHÒ(úß«(3:>‘Ó$%R–jI>²,·ÕÇ¯ÏrÏãúsŒA16 êÑEœÜ-Üˆ³³§»‚»„›Yï'I¶ÇÓŸa(TeUeeeeeeeÆYU~ìt~ºCj£¨Oûe\µ'ùøm|Ò%Ë%)ãq•äÙÑd&Ý•%²ho“4ŽŠ,.úø¶ºL•Õ+£œH!ÿü'iµVC8I
„Lj
c–L&ilQiM¡ÄUœ•€3D&5…QV‹IœU¯³Q\hH)(„§Q÷³ü¼ÝéWùqU$Ùi»Ó ÉEf€jÐ•Y”¤Z7ðµi¢SÀâ<*Êø(«Ú¤vÂÆj £¤¨¦èªj€LjŒÇøB•†—Õ%ÎãätZ©Bì½a“§Váéu
f‰ÖÓYÒ°X¶ À)¥ÇUT-JmîÙŸäòj5LDñë“g8ö+ ÝI”µað~n:$Iù®ˆ²ò$.Šxr¤Q¤õáDiÙ€{P²˜§ÑØ&šÖ˜`'“".5ôñ„¦åçE2‹ŠËƒ<«¢±Ff:…vUÓ¸hÂÕhF‹­É´Æ|-w¡¨´¦PNQ1I¢Ì„£§^ÒÛ8<Ëi2w!ê_›B3$Û|ÓHnÌÇÓä4%iR]j,P%6L§E4‰¬šä³"OÓxr¼ýÞ£	”{ÿ¡a/â³XãÖ*­9·¤k½9ÀZ"ƒ³ÌÕ
1dÕ÷è<J*.ªŒóÙ,©Úµ%®îÔ|Yç×yšG€ÐñæòÓ¨œŽr ¯vU,âZ¸Pô]2‹óEÕnwÈî^,Ê¦:]²µ±±±
æñ4??ŽS†Ô—ù$Jm8+ ¼~þ6<Z+ÞXUôÉ"ýdqm%ˆV«D”ÆEÕní§© Ž’”'‹4½$ŠŸxB¢þ•eršÁK•à5IA€›Î±ãg± µòn]WdŒd@Ú°$tjeU˜àežÆ}È˜4{ƒ~bf2Y üDF€Þþ>yÝ+c2žÆãOv}KOXeu­„!8*A•ÍÇý*ðÅŸ~åOƒD]â,Þ]~<Iã’Tñ¬ìAÌžxÍ{C2¿èÝ'óËÞ°¿EF§½(í4ïÝßØ ÓüªJ{ iˆµ½ó)À!E¾È`Ü{)9^Ûåé„}¿(«ó¸#B«"‚®÷Î“	T:^e^ôæyBÛPáòOå• ’”Óh’Ÿ÷fñ¤š³>Ü %¤ír£Ù{´EhCÊ9,ø=‹hN~E;ñŒ2·’NL”>&	PµüÖ/“ßc²»»K6:ä1YË¡Xz[¢Y^a£óóX67Ë³xl“µ5ÿ0}ôÓž7ïÒÛàÇ¤èàŽýôgh1$Ø¥ÝåàÞ•F­(Y¥Š{å<ÉZd½`:Û;¤Ë4ªßïï¬Ó¤P‹°:€ ›ôâ×2.èôTýXÙ\Á`O8#¬Ù3 |Ò^ÖŽùUç†ÝòíÎúhQU¹ØÎú$9³“=‰;ë ¶Áüè[_¬¬²öõ}6 o€õÆÀîY™x,ŸwNåÆäPI7ÏòbÖ^Âl.f]d\øN®@Š¡IÛÀá/e:}ƒ…2?d—•.<‘]ZÄ~’¹sÜReÚ,±¤ÀéÌ¦3¯ÚDÇšgHj4]Kéâ;‡|š‰P7ü_ÄÕvÔŒþv 'úTçi‡¾‡KåÌš^%Ê§É ¸à¼ê=$³ªw0æsÙ»ßC±3ÝÔAR†XÎ8‹„½É'Æ#°‡ ,À*E–ÝR£¾CçÃARŒÓXÌŠûWNýñ,.¢t¼kÃ˜á:ö­äðÅáËõ_ž¯??ÖfŒ¤¬é¦(+’,žÉ„à=@eÙÙd[½iûïëí·Êtê}„\i4‰ÖîÕûÁÆüâC ³[u˜mí½»œÇ$?!ùlžÆ€ÚuZ‰Q-cÄ˜ŽgQº ,kÄÖ¯“MgÓ(;ÅÜHÊÁ9cÑm÷«¨8«>BŸ[&8­ûçœ@Oeg9š¤:h«4¬ô÷p¥ß”å6Ê@¢½ht²>Øà_8Hí›½jƒ¼BLW?6³x’,f|<fúöÁbnùœ2!†ÕV‹L’2Áfhï`šç0p—ù¢ÐÉtg•¨s˜ÆH¶°'Çc€“ªaníÕ|lüyr:õ€õ&7øË"K`îàÖ}mþÍá›wäBÓ^ÞqLöÉC	ÁNiæ5êÊÖûKÚoÒ²OŽa_œ\v|`¦sOãlý’ïîDQm­ft×Èü‡!wX²F3^Ds~~~ôsœáô"û rG§±‡ÑŠ“l¾°þ°ÿ¬îNêÃ¦ ›ÇÅn+îŸöÉÃ­>¬NFg;³ý³Sämkk®tÓ€¿1 ‡³Yþþìë¶ çÊtÿJR;H*ªcƒ-Ñ	Ùõ·Î%¶¿$Õ”<Ï³æ’‹ÖÝœèˆïd÷-‘U&‚ÄåpèÏH~z‚edÆêÚÌR•	è;m}K´Å—ú£§_‹–Ž&Ÿ…’ð„ý;ÕÒ‘¹%ÿªTµÏÏi}]Nµ¯!oMbûâ„ó;ûCs¶jWáÝ}}ßO|ßO|Äü/&5<NDùsMTð^çs¿á½|¹þôéúßà×ˆð¦¥jÒSnKtC´A}'Æo‰Å.ãk,ØÓò³l,t0ß‰é["¦¯, 
B¸½øgAúNU·þê4ðßeÀï2à7AÓßeÀ•„÷Ï(:°¾“ã·DŽ_S
üÇgÿñ]üVÉé+Ëÿø|‚ ê;]ÝFÔ¬'¾iÁ¶ó-,ÃÙé—¥Ôy<¯X=· Qä;u~K\OÈt‡ÑŒ´g³õÉdý~_Ì^àšòÒÍ-Å8â;áÝ†-Ú&aß4oTý2JË[óG	ã;•~KìÁ¬k’á;HÅ> –Ú_œ¬X5GÙI~;ÒRp¾“×m˜ 3muYßÌ¾ ¹Lo=Tê§Ñ0…zè“Þ3.y-~úl@”ÔùG¡Íu“C×|dºuµGÞìæÄoŒÒ;§€QÈÃnÏÜ‘wjèsžGg1<À;¢)ÞNÊ}záîøoøÆýS”ø|šæ£(å7–K²Ë/,—N»ò©=ªoyö®HNOã¯¨²«nwèe#ÞJ~ßH5U%°ön“6ü{GãªßÏ yôÖÐYžLºZg §‘®:öx("Oã(Ó»ø˜VÅšiv¾ðG³ÇN:ë-&³'òO’Iê˜Pƒy¬·üŽqÛê}	c;ž¾(2z'ëX¼} /Ê?Äâr//‘”,Pr—]L•ïF)u7Õ¨êeyªUoF!q™em­KÉŸèÍ+	†÷[ òEiÀËx–ó×ì¾WrBÚ’–€£Šç~g§Õ”ìáLqÓ“ßè’yN’V4,Oop/F}éÏ†²j14ýdÂïß²9Åá˜ãmAcÞðM»jß¡`Å']ûÎ®Ÿuj×ª¥+õAÇ×|šWù2ã·ñ	Ã<ì<÷òMå–´{m$,}¸ÆE>?šE§ñq1¦#v %èƒ¶SRG2œ6% 		8ô$iÉgI3Ž÷ôä¼cItæ¹³Fô®äà€Ô˜ªµ¬¤÷:|ØÈ°fà7¨ÕÉ«ç)b¼â
¹²øœ`cßÒáG€}îçÎ*ÚÉ,ai*¯æqD»EZé·Ð-\ùyv¼¾ÅÐ*ow3úº2Z‚öKØ|F¿¾}ÑÆñìÖ2¢Åšº½¨›†!*/³1±çÏ]ÉØ-gþÒ‡¦ÍÚŒd×ÖTßôy­æ2½[¯&4¿#Ïî"FyñöÞôgÀ×47ú²Þßá•h<G÷Çà¯Þf%PU¨[÷ëëäEžãE~’d€¡”;ZøVöy{MðôµÏÏpø î·E\\¶í“Q—h¥ºäÄ¸½–´gmww­ë Sùáâ¬.‹æ82Ô¯æÓ|\¶“™4Š»‹Yûñl^]ê„z}ŠÑ‰ssEfè'+oÚZ‰.{"Y‚WÌ>"]Aýöê†É‚|"Ý­†^»Víáåa…„ÍÒè%Eê¢(0•s)àZCJ2‡)!¡QÞ-¾ ïæÏý2ŸÅí’òdêÔŠòbÕ\Lë˜Ñä»)´•»¦Ð›-Üª`û‹âÎ·èDÍrK¢Ó,£[CoòùeF.@@Bžãë[@Ï`”ât-I`ÔZ%u½ÔBddqŒÞ1ò‚ ;…ó]'@{fþÿ¯˜È„`6æxõúïÎœ |jµ¼­µ^\ŒÖ’”ƒ5Íš“5˜`Z~Íš^Àp©f–Ð§éELjfÍUš^Äp—f– >Ì,Jqsi®Ãô¼†û0«%ÌÓ™Ñ
áíÌÌIWb3'Mrs¼hé%ƒž´LH%wì¥-¥G¯µ·ñ)Ðcaa~ËþþéÔ,%“ÝJ˜³²¿gf	™ìizW3Ú_Ð\/£46rRgpzNHð‚~ßŠ°×¥+ó3îªF±¾#bÓªO¨‹ƒ9ŸÛ6ãâ‹„©rpÒlâ
šëßrE¥‡z•KþÄ&3­¥šF. flÅ”>p?4½Ýp?6¥XJEÛ¤Õ%Ê­L£æíg„¦|LùüD¸ÇaÐµö¹o¬]wjsuÇïrAy³Ë`;å(Ý]Â–Ÿ9YÙ&Ê¥÷Ob|¨Ï0ZU¨¨¦8I.èZ -îmßQ—²ñÁãaáû“Kñ:‡ý¿Ô"<‚]ÿý2ŠÆŸ&°äõFé¢Ðvï°ÛL“ñ§Ý¥Øv²fHÇnÏ¾S¯6Ðüþ£­®Ö›.ÿ‡º‹#¼Ð@+1 %ŒGÍ«}A„%;Þ“Ïß@¯£SjßÓÖÔ/šWÌ;×ÀÌ¢‹ÞyïÞE*õ,ÃéæqQ<Iáe
kFœ±ÁÿÐe->í½´q6ý Ðö1ïÝú‘ë´ƒBÃ;Š«óª3Æ^S­om˜.(\åótè(è\WHÒÍµ" ¯`sÂ9ÐÎúthAœ» K?À{ÐŸYÕÔiü`… >†‚º”ê¨W.‘¸´³>¯Q5¹øõû#¹g)/—J»‚òŸG«a+Ii]ÌOŽ•*ôŽì£«×¦œSK­ò:äëZ°\·WBƒˆÎ´4ÅbÐË•íÐÊòŽås‚e#ÁãY·¿¿Îë½$1ïHˆ-Â¥}püç€ë#¿#KËGÐV¸¢wTp$Î]-å(Ö,ÐPÃ¹eîôä¯-Ã-¾^ZsÂöBaÏÉÍ.{ÑfÛ¼÷P÷vC¥zª›!CfjÌ+ßÖCcRiËõ?‘ãÃý·ÏÉ“×%Ï^¿¥»ð?­_ÕL\EÁŽ"œ§44#[6ÝôP˜þ3	—Cqˆõ®f£Þ&¥9ì:W{9âà
åæh}ð´C!²	ñnt‰h±†×wØácqXÿ¦[ÿmíiçÃà'a²_¿<ï“*†•'{ºö·mªêOðè2; rÍöRÆµÏH$¥¹G$êSÓ’§vA®ÓxáÐui.²„;¢Ý¥¦;¯Åéµá{q3àLQŸ4ÍÑèmå²põ¢¡wÝÊ QêÑ%8çxþ¥ÁsX¿”‡}Ä€WÐ åGp6Å	™†?¿ÀŠûƒ^‡<™eÛì…UäeŒcC;exGÃÄ«WÜÔ‚ÝÙG×¢Ž6`NÛ!ÿlë{.Yøqñ<¯Y}íu)laKk^¨äïÉ6}.òsæ»#¾&S9×¦7T/ÂEŠÿg³¹4­®Ó#•‰ÍÄdûœ­«åXÍ§žXÌz<ÂWñæñØÇsÀ_˜q#àXø2êm8à¢ÑçõOÁåoØ?Ñ³Š¤—Écƒ¨~jKFwdÆéPŸkh÷Ç˜§íõEiøéËsØ˜£·í³Ø;í=™.pÌÅÃ$*§°±vŽÕ9çsø¾~$oq´2°våóüYÊÈ°ìûüT—ÕeJ·Ê0Õæü r­+÷¯î ÁçC× rêØ’©ÿBÞXƒ^Lw’Ù))‹ñ®åŠDiµÛR4Ÿ%ñyËcÎ0erzhH×8lµgY4*ót«ŽP‚Øz±\lJ=6„"u`.Ú<ùºƒÆÖ=wB!cú¦ün<³Uv÷ B>^ã“ÖÝÀÃ-®V9õxoŸ|éa§·×à†>±Ôßÿá=·ÿl°7·ÌñÕeö-ß†
eõaùÙå#sp­mÛõZÞG¤1uLåÆ–pYË^ký m!+¤g©}P§Š dž9Ô×U$»ämB„¼‹ËKË÷¹ˆOv—Æšá["ÔÎÂ{ôï+ÇñøW‚Y×ÿäcÁšÙŠâi¡‡¼tNë‘):BÒ¿Âßø³Xkª8XkÏ	+'ÄÌï0¦uÅQP«E®:ÞU–ÔN%8P9´Fn(ˆ6;„Ðj/™æŽæ°E–ƒ_ßÒ6!<·CÜväÊ>›øÆÍOÅoã d“Ì7$A×º\©•¦zø!4µ‰ká{\Rô	uyö^–ÚXÝÁÅýzðE¼
Áì‚iÁ©]¯cÀŸ{!û)Èvä Xüî/À•t†™'Â~švUìZúãV‡ÍãhžTQ
¼ß…ÄêIó¥Œ7¿¨b>5«—ÄÿÕäHŸ¿.=þ²ˆ<jüé¤hÙÜ5C†ïÄ¨è7IŒ/©±È×¥FØˆWùjr´íXnHº™Ìw‚Ôõ›$H:Þ‡Uÿë1Ç¢KŽŽŽV¤e%uCzÔL°¾“£>¨þ=×7Fž/Þ¾úB„I‹¾Ì')[Ìâ"ûóño‹¤ˆ'«©[veÔ:¾,ZÜŽ´©­ IÅÿ=‰ø#Ú'ÂóV¤‹ VÓ4ùlDC¡€aÌžzRéh-¡˜mi\¡ÍãqUˆèGðÊŒVÒ“ª.À«DMWÙ­¼©Ž…ÂAãX™*ŸD—z™š¼Ñ›–êC/ŸÁTø[íé±úÍÔUÕÏt`/V¦&$žƒ¸™‘²œ žh6Ô I¨¬WEe)úˆÐÑ^ïú!÷ˆVxÐÂ/‡@… ¹ìJ3ZžT]f2Ë*…Ì\éïÈÌV&z’jO9ë˜ßçe|‡Ô¢œß¿Ñ­pj“¾Â´äM^€Gu±eI%ARº7±/±Hf9¿zýw'Kÿ%ñ;µ´ÕHQéRÝµ–çÏK£ûAç«BÒd3Y²F’Ä[<¯³ôÒóÉ }ôÃ·@Ûý“"Ÿ)gøjÓ'@ä?ÍXIú”E70kHŸªè¯Cû¹1ü¹‘Ôí¿k:ÕHýþ5	ñ8¾¢/Ÿ;®Æu”0½árËþv˜[ØŽ
4¼RK*^éÜé†ømíáÿþpÞBÏ`áÀbìo¸ þM¤‡Vþëpäþo‘þBíQHûÓiÈÃ­så&©n«]Vñ|·µÑ4ÕLÝÛ‚¾¯Üq±f·Ú¸Ÿskœ?ÐÞ½ÑTó‰½~=Ô¿–:ŸsêÏ¾!ê¸–­ì§çôöÄ9ýNœòwCl\¤˜ý]y3ËÃª½ö;!Ú^åÊkzDl¡ŽéÛ€¿VOtgÍœª×ÇÞº4œžx‰êS–d4Kºx%4>Í‹KrEvázŸ¼<jÏ£¢ŒŸ¥yTµ5^ÜAzßèûëTûÔ_ð›P-zZ!ÉÇ–ðrEzä‡¥hÇÕG4 ¦ŽŽ²1wˆ¿æyÕñØ£ú0Ü„Ž4®W Û¾¿òeÎÐó¢.qßh{ïß¬èÌ{aü»öÀÝô?È.¾CìæëÈÍÙ`SÜÎÄ8·³Ò:lâ„çlx¬Íƒ+&£Ž1ÞåÞœLv[IùQrã½í#Ÿ€X()Yù‘Ð;Ûž…l%9Y°4Bâuz×Gƒ–¶È´§.J¦§l9ºpþi"Q½a¡uè	<áY¶ØäŸV³úáb.ÌWç>¨½Ùf_á¤nŸê¢ã…r\¢µ8êúK4²;r.Äúo±]q~aÎHu0TXû¢!G^FY’Fõ¬s$›rc]§q“ÓòÿÆ¬óëÜsô¿s{’!D=õt]Ës¿GËèw×ÿÂÌkÍ~ùÙìo¡x¯µwÑ7¯²÷î˜üJ *e?‹Ð•êZIð—[Ú…®)¸í_¸´Ö:íZOàš
Ÿ†lÖÑ$É[$cûÃ"™EÅ%Ì®–%³ð/€¥h\±Ë—'¬CWÚL2-øÕT2‹o«²ã†ŸÎöÍìbðÃóqŒ÷·h}5j¸?÷ŒÁÀÐ½K¨ôß%ÌærÕ	ÃT½ùãjc\	äfÖfþöop s]¶ò2ÿƒ±•Y~s¶"Ê~g+«Ø
ÃÔ-ÙŠò­üÁØÊÏ‹¨˜$Qöb,§¢K7b-ªô3ærtB²¼B%6z]ÅWšnÉYt0ßyË7Î[Z’[·Ô›Ež•ÓdþeÉ’ªŸöY•¬\ë1éû´©ƒÓi”®Ãß‰ôfG”úÑ*¾°ÖŠ3]rð†¬±Z°(_Toºñh0Ü¼·uÿÁÃGõJ¬1kkÒUY”ï
­*´æ¨ÐòåË([Déq2‚ÖÓã†¼p‰¤dŽ&¥°”“	8¶ï?\¹e4Y%‹Ï!g@bQ ¶	Ëˆ’ŠÛøÛ±'Ïè3GFÜÎU”"˜ïgeCÕCo`ÏjË‹Ð Zñd*ÖdHµFÔ¹4bˆaüJ`ë¢Ô¥Q\´Âë-äÒëºáÄãÎ–§O7Ãæ{{$|êzvÕ°½'yþéõ<Îj<õ(Y¶µ¾G…'.eg}ºém½×®e2£n„Ø<¡®ö‘’ñ"]ÌTü¢J*pž Šõˆ}Ç›F>d×j›Ë™£mÞä®·îÛ§(0«*ŸõÊ1¶f¡W ¿_¤¥'àNÍih»fv’”ï»„p€’stúI6NaÂ–´
¬ãüWàž_a?Å—0G(:–5‚£>èäqü¦çøý‡¥Ö‰ÇdÍãUórIZ¾0CÍ¸w tèl*-7êü×çZ0H$0q7†}ªLµü­´#Ðr'«¾EÚ×3©:yMJ~E6 +È+|e‹ÿhèËú ƒUàAÜ*šT?êÜKMb<êk^ÐsCÆéË6Ù/Šè²×ÚPI'tÃKþW½äÏ”î‘)üi¼²±‰¹–8jÜ¦ÕyCcßë?/ë®[w„Û/êƒ«µÇx*f®¼ŒyEMÜµPè÷+B>šDÕÌŸ"^W¤¯|y‡ÎBQn>xýöp­³¢mõH¬1º%4òŸ›èß÷yWWMÞ´0è`4Ë%—û¼BnZR:«æÇ±Î³_“e½Fû(ˆ¨µ÷*WK<°¡“ätÖ60eÙŠ/bõ­*W*C†GíÖþÜ<‰×tëŠgÜ¦~5Î&B‚¨\o¯~iu¾’¯å¿û3F÷÷µsxK÷ìÝÄ™Ëh½SwÖ.K4÷º%®ë~I½²ÛÝW ïª¸Q }Á&×ôMSÐ„Lºi–(Ø4½C»ÔðÃÝž¦§â‰ÂºÛVVq¦ÒZ.Q°z]¯E4sgl82¶r C{iÔö6X9.Ž}\BõwãóRnè„Û¥^é0DyjTð2»s(ÆáÈ2˜eOž C¹Ï+×4÷hÀB·6³¶£
ÊxŽêwå´“Ò¼vˆàBÐ‹˜ÁŒbUDöÙN±ÊòMùsX1òâR•åÁEº”S ûMÄ•§n‹Bò³Ñ”˜M§0YÉ+1¢UŠ¥KÆMíŠj^äã(Õê\^‹ÊzõþÃ^›“¼>ôQ-b¡¾`ÏFHSŸ
@ÒáÉ	À1,ö©óÊÐåA!\C°xŒk'q5žòî´;F¸É»¼ù4öFaøîhm3Â+áÏŒX'†Uø™¢j­ÔªoêPÅçD^ rÛA¤ñƒýQcèc†ñ”0ÒMD)xÞl†>íO’"Æ1ˆ»3˜®¢I]ŒÍ7©<)ã>pL	Å‚6w‚†þ2š¢éeÂ¼Hû M\Â>b›L`÷ÐE~0áÑÉ†å=üÉÂ0ÂÂ½NúE|Ògg_ü^‚ÆY”ùmÇÞ±;<z1“Ëp˜Ç4$%†Ô(Û>—83É:+
ò.‹W£ã¬bGXå a”=Í-5šåäÊµ‡4§ªtMÌšËbµ*x€jQQª™”œÓ¡+åØ•fOœžúóE9E¾(èœ#Ê¤sEÞÄÞê|[=_¹$¯³	+n¦à7¢Me^ ïŠº#¶HÉ˜Èýr<ÍsêÙw*­V§Ÿbób´wškGáœ&
jø”hºŠkW‹G9±í(ÛÔÂŒ¾:lc„;(ÿÓõ¸%¬Gÿ79²ËË4SŒ½+¶N¡üÄ‚÷ÒÎŠÁšVÙÕ1Ô–5ghºh¡EN¥%E¸GjAð”	äõ¢Z1’ÍÔŸ@Ñï˜ì/!hÖ½	 9ÊDaö?®’U^E)»àOžaAÄÓÆOVŽ_³¤Ò?°ÿUdï¼8ŒÆSŸþ’{>Š‹Y‰î¸©Òòý ;ìnvï} ³»ÂÐƒ1õH÷wmwBv	àü ±«NŸÆ<ìˆ@à'æ„F ×¨Ñ¤UîSn´”}Ñ˜E»äeTMûT¸7  †ã˜MÛÝ½èGà} o¸5ÙÌˆU² ´ˆ
‰ –Ü
ÀýÔODXuõ	eF3•6ÿ±–°Mý«*ßÐþ¸ktðOdá+ÄFòê_9¯<Q‘¡VÆÆ«˜‚Ùþ™NOëÖµêuÄ‰ ðÌÞ.y°…Zã7 äPšê‡ßÆU„è$~¥·RD¢÷Ì>Ô±Ý£ÍûŒ9ø’1qð=.&‹¹©ÅÅ|?,âÙ‡k‡Æ|¸Õ84&F¼é=\!Ó;èâR¶vï„ÇÆ°°uPu3íÀ:üª={!xþ8óÅ
ÙáKþ°-
`Íá£«ßØÃº1KÆ„Ã²”Bz
…N	`|j1Öô¥3¨R„RMî ÌäUŽäÖ®:+ƒxút^þé¡[D¦ºCK ì\VFm¬Óháì¯Z“u³o¶òÈêmò_yœjFeTlÓ’+Üø?×ˆåbóÓËÞÀFµïà¥Û¸rmúå°WÎ“Ã¶ÜóÚ~6!Ji¾ ñ·µÇej‹9ùsa¶G®zÜ!AŒ}#
'_+Î<üàÞCŸˆB#Œ—'øÍ&ÒÓ°UÀÐÓÞòçŠß¬Á;Zè-¤žE:ÉÖ¨0‰#vÉ‘œ 
‚oüHšdŸð@GþÅ “GlÅÐ„Êáo)Fo¾íÂ¶ú"|B,|]è»f[3TZ;çmúTR¬ï‰ªPÐ  FmƒwÕn­­Ã,ý'²¾4Ü²0ˆÈÎ $.ñ"’à@ÐžHx „ã…ÍöWªe¸I“2&2zû£¾ãó}wwxÁy·ý2€Œ
:lù?.÷t@ß
^«~å(Á¾pí6paûZÕÓ#Y¹8¨	TÝ”RêM^è¬¢æ.0;®¼#?YUá‡®qÊ\s£0¼°CéÙQïœí0‹Èm0Z.‘"Ó	¡òZòŸ]´©OJÝQXŠÇ–zjí×ìS–ŸgäøokWõ¡ÀjZ!,{ëeµ:¸ð[2E*V5ËÄŽ\×þ'°ï¸8ÜÇn2?²Ãç–f‰«è€‡&R¡°¶;7í±”ÏZQgÔ,I‰äòåÅ‰|š¼z VØ4uÊâ„	…Öñ[¦ôe^©¸¡•6­^¡]¯½'ZA»ÄkRáñ¼ÝÎ•$T;Vj{5Oôm´¬suµ¢Ë¼	+¶YØ#É¨ù4ÅÑüö˜©½æþH^1eo(^û·T|…µT£9±‚k>‡¿y„
Ç2ÇÀTãÛµÏl÷'~ÿç$>oãjH-ÔîÈl|d‘èi"?
d©‡“¤bOO©I>ÇF½ZŒêR†¾3“@–Âª '‹ô³-Ô¿ñ•Á£ÍÆñ¤¯’©³Ì¿ÎÑ‰•ò^¥òD)¦Ñ|§i>ŠÒã¸Âvòž¼ËOOÓ˜‘<KA|¼1p£z’FÙ'=‘{³¥I9¥|Ù€÷†Ë'§À-b­øÈmÌ-ãBU±ŸÅã	ê) ŒºMóïOÎÈ'N´n¨#«÷0y‘IãB>Vòý´Ÿ¦|Ði%¥B Ñ„;x^ÏÉ‚Ú1h´!ßÀ¦ þ½£qÕÇÏ‡gP½<Í×ÉGžzÈ†@qõÁ(&È rÐ£Dê`ßÈ!©N|%ÌDß$BñÑ%F€|F÷.hFuë›^áPAEqÂOnÞ°cãÌ¾gÓ3íL)ªä%$¢¡ëVovÅ&|€=Ã8
2lã³6/âÐ›²èc—]ëÙæQXÌv³‡÷ÍD5JÐ§Òãmy>¤†¦Ëeëm)†ccì	¦™§ZÞÕô|\G7Ö¬­Íë™ÌŠëÒ£'Š¶m	ò4Ž2?,sþßš¸y"M"4ÚÖxˆ>&'©éµÍ`Ë&¸,æ±v0éç4Ýym3œÇb
9s£T#¸‘ê?2%Ã2¨œæç°’Q“#j®s¬%6;êÔ×°Ë(ÑS5Ë÷2žå†ß¡½G£žû_nÅ©µ(Ñ¹øã~•¿ÈÏãâ dœv‡û@gãQFœµ“‘¥î`-Bá}Oæ"*Ç£Àüñ‡ed‡áìL´"~ìô¶fmÇ¾A=A¨#êÈuÔ*G
m¬e@«Rëëh¼4ÎÅE"sùýÅFà$þ>+Çà5ºÌ¸åØ˜Dû»ÞqúYïÊéBšE
>ÕŸïãèÇ-¸È0&•Î×¸R]1=†N;+›‚Næ÷Iùë\7…<Rïµ¬c‹`â,<ì<÷òM=LãT»§ÌYy}
ýxAƒÕÐÕSjë|Ï®æ¼£W}hÙ§Z‚a-Ê*¾–ºÍ``åÂk(žbÀZ‹Ò”
,‹vÀ°ÜSíl ðD)À”Àô3Í NE.Û6W<vIÖCsÝ3“ëÑÅ®Ÿ¡¥Î$ä2fš‰´¸ÚaòÊÞ^[ÜÎêèG [>„1ø…üÄÿÍhb«¥CJºM±²—Š«ýð÷k6¢óèéË*™zb=*“	Íùåk†@½¡G¡¯×k&“‹˜P¥ù±›~¸	°‰$ÀY’¡ópM¤ä èú˜|	¼g§Ñ(ÿ§ø¡?Îgk:œãË²Šg^HÐ4®{/i¦¿G˜‹Rò©ZõÚÔ¦øî][5òñ{Ñl"- àõ,ÊhïÞµ67}fîw¬TÈ°8±¬vNj×”üÃ+3Cª¼ÿº
pGAV÷ÍËg(ÓßÈžña}›ŸË]÷ÁÎ’”šMáYT$ÚÙ¯áyåQ'‹ñ´L"úÌ ÖÈÕ.hPVAã{¹¤ŠÈ°›`}]¢z@è®]¢4L+Úöf¬.A@:ù‘´yáqÀ¸Ïy4ac?Ù¿a;WUëkJôÌSDÙ.û‘ä*`yÕñ7djúf¢U¬nËþˆ7…Ú’Í¢‹öF×AOÏh7_ÅuiJúXzb~Ù{>Sk~ƒJîÑiï‡%Â«UžÇµœƒš•ÞT\ÇZü…ä±“qßYƒƒÇMôIWÏÚŠpvŸT®N> ¼¯3'Z~<ï=$SøgØ”Ôuuµ›m]%;^N‘êmØêçeÙ§z\«²“ÌNI‰W‹xž+¥¾1ó×¥É”ýÉ)…œyütyáÉòPqëÞ•«‘×Ðpoúà õÜ/4oYã4:{ºÆVþ+n™Ýd4÷úÐ²|¦'ÞµÍx FÏª)ËéÔ:
¡Fœkx´ Ç,P×ïýØÀÍ#ëxÄvpozÏ/è‰Èœ]Ñ—¹µÃ6­þv;7O—+ÐuëÎP+Þi?°²#V;šwÆŽ`pëöÞÝ„ãZ½8ÊuÂç›*xŠx^Dóææ¡#:u¢;Ë³Ü™s÷jM,ÙLI‹,<Q¼qEšŒÙF»eò>=Ó¸uü?,ó´7ôŸ$îyFðÓÏ…Öº>úny7¥c&w’®‡’MË1Æz¤]l°hJÛáÔÛ¾k¥²+ 
åqùÆƒ,™Æg^c©žŠoI A´=–ïtmÑ¶†k¾®Ô+ˆóežal%UÉJgÁ•<îÖ˜_àôq’T™]wÝ”Ëjô`H—¡ƒ–"7Z‘´ŠöEEL°Ôã=Ä‡±áñ)ùópr®ø•°ÕÐínR]jd[+nxä@?ZÅTõâUó'£f›z!S'/ ñZ´2Ë®Äd§OC‹µWå’qÇ:¾~„ÈÆ7 (W»ÞÝ<¾6l¿ÍlÍë–o×IG½-ÐrýO„4–äOëFƒÛ=¹±Á:»›º”3´7Ý4¢6\	Â&D¶1ZA§ªñ˜Ã–,5×KKÂàÛäjÚÛï’„]ŠMÈdÐ±¯ÿ¡	óo+Ì–“’*Ó{‡xX?bî¿ÿM»°®ýV˜†²Ëþ„þ4zR•hç¼‡ßÈÐ¼Úìòóo]rWëZ Ü%üª¤Jq8yVŠ?XÔ~»bÃò1XÐÜã?Ð}X±y1§¢·s{„L½nEÕ°dÆÀz°|zÄô§†‡¹ËÑ–rû¦¹tµ7ìœÉž‹Úu¯MèÔ¦Ù)iQË:††7zUb°—NŸ”{˜á´Kz
íSÐƒ—ßWÿÝÈzÍEIë¼7¿ Ã«ßr/S|{ÌEØvüëxËaFý1ÎbœðOaóïÂŸj¼RG):²üžx{Ís~g~28ÇjØ?_Ø3ç„æìüÈ jlQÖ‹r~ˆm–„ž-ãÝ˜(e±FuŠ·Þ€cœ÷Þo>Äi`²Ö¼Ûgê€¯ÁV-uª¼›Àœn2Š5|nÞßð8ÝÔý])¶Hïãö‹9lŸ…€2Éç·w¡6®Á	ï-Åµ+hð]‹™ržY^!R`‡=‘`‡¨A.i¥.ñº«ÅÊ½5á6¶°ß¢Èb·¯²EÌÖÞ; ™Zóæ/ÀâWû¦Çá°œ»YzvÓÂÐë	ÙÃþý®ÝðgßÙ^ú=¦r>#ÎëÙŒçÞ÷O~°Ü¤$>—îAV+°…ÕävÐ/‡ÓEeœ™É:ýÞ!}dÛÈÛí•ÆfpGôÜ'öÒÛ˜I›®¦ß‡
¡UÖ¸‡|wy‡r‡'2­)ùvìrKH!lYŽi¢rlè>úY_Vvµõ–û§~ÏPß‚†·äe:ÈÖrá{wõÇSXÝ†Ú1‘ïÎj%üÛN%[/§M#£§k„)d£@/iHK©›B*ÛÍ'‘ŒÚlN#ºYŸHªÂëL%«Ëi¤åj:‹ð¨õe’A=7šH;u'¯t™S&îÞE.4MÂ¦³JoE»ôåñP¹å B\uÂs(Ÿ¤òB­ëõ¾IŒÀÂ“AI‰Ì¶f›	‹¶\ïÕŒ\ZØArüŒ8áN<cù,IãwÐŒº!÷¸xµ«	ÿê1Öšr‹^ˆ¥Þ1È×lÚÕ¦Cþ4?ÏÐüôs¹º–ñ¯qÕ’[x„ª
wÀY²pöú@p–ôU|}2!²·Üï°/Î3ö/ã²D—¹¿-@`º5Æ¶ÁÈ6×z{Xß;#ìŽ¯#´G×vñrˆ´Ï;Æú”¶/­pTíºvñ«P—mçR&5#ÕìJ;ÿº™]gjÜö‹©KgáÚØÎú5–€‡>jñDWyXçþŒ‚ö^Î’£§ØÃÑä *>ÃÂ Y(7Óf,Ûaµ(ÛM£R»ìWÑš·ûúe>£1M°°ë]ŒŸÊ]…M‹ËzkjË+Æ< Ðíëâ®(…ûÙ£	- éò{éŸîF5|IŸ¥xì+P«÷®Ùã¯áÍ7¾øóßLyü•Ôf´‚!³p»ÉZð éZ`Ìn‘qëFÓ;d'Ô÷L|öãÓŸaMÆóçél e›†Q¯0†Úmän¥ÎFÑÚc¨SóÖiy½JÞ¶/PÉ­µ?Íéš¹ð§v—#ÃK’-ª‘]lÍ„FêŸeñQô7qƒ‹˜õ_¨½k>~Öõ»/?RõÛPKûy‡õµá ¾+¢rzÃQ¬UÕ™%i/ågXHÙ$QÁÁ®[¢›}©Bùô`®2¨W÷§s[ïxßñ4yƒŸ&Óu•þ—¦›WLuQÔ¾
jøp×j.bt‚ÉãÇÃ”ÍÏûØ±·4]¹tÇ·~žY½•NK„t%œ‡_à…ú™wéqdìEJ]‚3Ÿ?Eð¢Š_X´_ÎSàeëÿU<þ¯lí§XKÊïKâO¸¿Ê]pð0<Ëú:y£7	¨LãtŽá¢ù/™ñ,è‘P\P>ÈÓ£É…æH~•7•åçþy–L€>ŒïCý;ô1†LD|ÞÔ?§…úpÏ(‡&ÉòÓ–þi”ÕM«åçûúgØ™Ëôe|!?<Ô?(ùQ~ïÌ’T~|5šòHÿÂìâÄN­ÌXÅƒÅkÅ*—\æt\}4P;NªÈhõÀD0LÐcé€MeÚòg‚MÌrßŸe2Â/U>ûóx^1Ïî*ÃC;ÃS•—0§­âÃëû•ìŽ²“\å1°š£+ƒòx““K•g(gf²îŠ!“È0…½Œ3Çœ…òæA¼™N"l³1Df†Y¾"ƒˆþÞ ‹ >ÕÌmä1øå/ïì2~'ù;ãðê;nmå›éB]]C…¯ÖèÍËù‹¬iV¶c‡Á	Š+Á›¨¨4wLV !:Ž¶¶Ö%IöŸ‹¼Rá?d&ˆ’e®ðgGk÷¬@’4ýŽRt#4‘õ}bX\!Çì4«E¯di|_lg¦sž é´Fžæu*¬úx—?ÖCèÒ†‰¼64Ã,þÍœ¯zæ`|Èpì©ËÓ·±‘íŽûÔ¸Ze§â¬‘:ôÄyñú¤ÝTÚÒöMîúé-J³Ùe=‹«·0Ëg—v—^oa,Yõ’42®]z§y§)Ô/‘eÓáêòƒH
#¿)VøëÁ,zWÞð–“Ùô²º0â-ôüºŒâÍôüÑÅ[ŒæK1ŸY›)×j¤™ôr«‘9òJÔêþ½Â¼@Xž¿:µ)É,ÌÉ¨9DÜ´A)–çïã™ÝŽ©¯Í!„øü$ª2cRƒ L‘ÐOÀ*Î¤:²¢·œÈe¶Û+FšÏ˜O‡UùäÌ0’‰‚-t­ ±ì:,¨ê‚ù
šÏ.ýtåÁ\³pD\?ËHK·V¿ø*Ït 	dÕaøÅc/–µdY[úJŸ½`’²R™“Ìáº¦€f»4Ÿ1­=Ò·&BF	ÐÙíÂS¼)tqù¥~?‘°¼\æ6¤
w[à+h>G®p÷~¹"÷•ön(üŒ†çAðî7j!Z	ƒy·%~.Æ²2¿/
Æ•¦5yaP—ñ'¡%Aj°%@N
aå‰ÜæxJÕ(U°˜+÷ñruÚ–ë‰X›z1MŠÝòéehº % ûu5˜Ý‘x‘ÌxjðjuXäÑ+«¥çÑò:ÒÒ]Z„9ÔE¡»ÔÒ`ž~]P*œæbŠRè4)”ž‡‰_v£R%Ý3¡˜’/lk˜¶Ì2¶ÜÀK¹ª§ûv‹}Rƒl°_3õ CÉ]mõ0TÞÏäk[LH®¼ÀAx‰á†[ö©KWŽ1´hË‘Ä<qÕdC§¤+)¨Ò>%šEo^9C¨Øîé€H	HH†ZäçÊ:{1…‡áýÛ¬îC‹øü«¸<ÿ?´Ð]ÃÅêà.îC‹äÜ\¬îÒ¾i‘œoýÓÝ·´oüå}«·Ç»ÀoZé]»'ñ®ë›’ -P>ýèlzãlzðYØôðlzó†lúÞg`Ó[·dÓÁ¥âÚlÚž³×`ÓöbÑ”MÛKÃ5ØôÆ­ÙôàÖlzøyØôæ-Øô½[±é­ÏÀ¦ïß‚M?¸9›¶—‡ë²i{‰¸5›Þ¸5›–)7Wô,H†änã+œÀÖÌë©Õò³x¢$9n²©½€–Ï½6&`gwü)™óm!–LÐ=v5žÆ%Þ<?Gûo“þ±e<æTiõ¬8OÂ³§&¹åAU£Ìò¬#»IÜ~2ÜÍ¿ÌÁ•ÞÎ•GWZæU‡WFÖã«¹{‚ô¹ª¼U˜<še±ãaÿm6“Û‰'ô»ä{Soñ)°eÄ,ÔÎq‚–ê"XR©*dQ[{,+Õ²¨¥À–Ä@Ç²‹ÅªÜÜµ¨C©1‚%¤ÞB–²4Á’Ñ©*#•ÁÜe|AÍ¨d©Ô`EÐ¿§¶Ã,× eÜO™(¡K¾Á2S³Ì´¾Œ‹xSØ}«QðÉÁ˜+™m²ÆÍÎ`Yça	ÆL@¼‚z¶~søæy•%ßqLöÉC=‘F¼(×p×Á³Ù™Û© #G¹˜¸Ý¬Qo¡^ƒdM×¨¸y §ß·­ŠÊ3Ê8>ºSGÑdQ\×ÈÂ¶=ÛœrôM'3»ØïˆæþÇ[ÄÜälKu·>+Šcœ+»°Øõ¬(Ê…\·¼!ýz¨(mïu‚Åp[£zj3³ˆÜÐˆ2Ö'THíc´‚öæÆ[ØØÂˆÂž}/¬/´J´ö2:Gòns‚œÑv5¼ëœE—qÉ¤Ák”AKØP!&ÅÖÝz™+™¶/eŒî÷·wbvmn¸ x›“—g#Æ@°-V«ŠäÛåñØ@´$ß|ŸÙþ+øYlŒ\éÓî‚¨È/ÈI1Jn•eíÃ‚Tî”µwÁ²úFQ–vw+ËëDŽ»{Â3ö‰g÷(!h `ûösœÅJ_Ô³„î/a‡áëÓK§BÌBÏÿpûcŒ¤”ˆÔŽéÐD—z~huLn#³˜ÉJ¤µ¸·WµÔ!Sn³¹ÐRÙêþ?ò$k·HK…‡²h_vCØÿ‰~mâeu,Éh–t‰ðŒ
»Ø‡(/ª0$eü,Í£Š+FY¬‹.Ñ>LµÖ!ãFìm>Zð€_šè!›9ÔÆ<Ãð' À½¤.²@cq§¨öRò¥w¥ü3ù »R\ó	~XHôitåò/I5m¯0ÞÉ¿(¶zšià“ç†‰ÁV?3£“±ßÕ«óÌ|Ÿíðlhbl»N-^ZS£Fö‡Ì“HÇ){£möÇD²Sî‡ìÑ)“'JØ¡TxÂË	ËÊV"<Ú½Õ·Õ¶ÇÎÏ(x›„ˆÚÊ>u³Ok²ã<²’Ô	ó¶k›ÇO›þi}ç<r+c&¹úÎ©%Dãc¸lì³¢ tÕ&>Ú½Î$¶%»°r]9„¢äuû“%žx	‡Šå0ÙÂN6×bg’ÈõÕ™%yè‹¾2†¾é«ÇXÈÌyßñâéªc*H¾ Ô:ÀgµrCÃÉ†u§´MÆf“ðñ¾‘r8št:Vy'pœé@4ßºœ¥_À"êª×çÖB;vÅþðWøg¿D7:mzý?ê7Ñ&ÜãÊÁñŸßÅ°gJ˜¶sÁŒiwqÁo½ô™ä˜/‹Äÿ/ªî‹·¯º‡ÈØºO$ïÚ?»È~–s´Ë½;tŸúxP÷/ÂVµû\X‹v­½ëÏtƒÚ=àÛÎî¡±Ô^&Ú—¬»¨`;*úHÃçÁ6ž'Á“Ú5u_ëÛ î‘5ñž¨™ö\‰îÝ7æ|z¦&ÐK5c~Ö§ÈÏ¾9q O.
µ^„º“ÍS(BŠÅïÝ_QÖíþRtÃÍ{[÷<|´1vÿ©ý	dCžÿ‹°rÝáÆ`£·1è¶ %ƒîƒîaàã$ƒ¯ÃÍÞÆýÞÆV÷dØÚèÖ(pº·ú£Û}›ü¥sò<¼)]ú{•C5Y’F˜JXÞãªOx"ã3´DvŠ}(U$‘JPd}ˆ"bŽ£¬ÊKV¸ûs·ûèáƒû[÷6‡ƒG»3Lí—4‹‰”Aoc³7Üè]&x„Ð2ìî=ìjZ¦>ëf÷áFÊCÖ!äCüÂïoqÙýÏEü{ž‘äèÐvÂß÷Ïâ>ùÏƒ.ã¦Ý7ñ¤È‰Þxñ‚Ý–}0º=.ÏXXÈ´?,ùÌ½ú¯ì‡¥ ýexõ‘×`ŒÒ|DØ•Î'ðØ~¯€~è‚¬Ë´Hkx×r>ý4žâÚ^í.ª“ÞÃŸÖ$c–W3?´I>^ ÕôÇÀ”ª˜ÓP»µŒÜ‹•Ç¿¾}Áó±ÈsðÞÆVñ¬²>x*XrGŒe9-â“V‹‡ónùZœ[ÿÅÕÆ¦ü½â°}jPªË4îŸ%¥R«­±XeœéÊ¾òÉe?šcÜÑƒi’Nð0î“jŒ×¾…m+âY~;ÅE|–ÒP!zÉX¹á$ÃõöÍS/µ—½2õÊk·Ýö+8r¯c,¦tTÁ=@xƒçÙñò<Ñ„«ÝÛ0l9?]’*ŸCòï½{šCÚf>m·ê¢×2 åSüÏt“áq–”ž®ö´ìøiT.,OºÔƒá›T:0ÚñmšÄ›¯©„†o³ü7	÷‡¿C9#[ý¬ïµþ3w¶ÇêçÚŒáÅ¨3ì
^õ®µ÷úä$'‘×ñÆÎút`¥Ì6*¯˜y¥À)ÜˆY…Mv‹@	q‘žì.ùvj05s7D¸ cÅÚYŸ×ÏŸ@`ÚÊ9	ÿ‹©þPŸ<ûÈ!UÌ‚ûŒc×'8¢¤Òr-16/H.T(µý#íÀÞUöÝTåäÅlw‰ÿ›=üŒ~âæ×<;ŽÎbåÃÞÜ4s^Ë ´]/Z\Ø=²Dhö»²[t€¢g*¼áûA˜eTw—!G³"ò7 ‚?™ßMQ»KóÝ‚%s•þïŒÖv-z¿–òsicà]‘œžÆ†fÛPh€&ø¥¹Þ%³8_TAWZzüò>QüØ\+ÕïªK@­F³jCµ„iŽbýÑÄ!mtóòoEÛAªOØ#3O¤X´8¾6À_ç¸gS›1m§™eÆ<„àÃˆQl!M`ùðùúê[™0Z›hÎxrcÞk@¢>IŠY$Õ &Õq>ÁÜRëàX°T{ü°ÐLÍ3VgÛ ”¸5l?B2|¹ú­æ˜.„ÆÛOSzÂm£vD€¦>.{&©d0§#¨|)Cl“»‰[üŒL;S|‘Tõ`tá3¹ˆ'P9t–Jªïƒ«Æ¹uD4†w¢0â º`1{Ö²±«g‘Èåxr±k	A!¼˜£— ÃýG[]­ÿ]ÿ4øäEZ¹-ç)&0|ÝêlgY¯X5ÎUµ P,¾[tÑ£›!¾ÂÎëƒá‡ RÛ©ÍmŽ1ÀT”£ûp…/Tg;2ÄíÈPEìÝÒ½kmin³6QÒ_E^³Qï¾èÇEjÄ_ Xë{WBÛdxÇºç‹»éÝ·elùzX»	ÇÅ#Ôqö²<‹±÷Z{ŒÌm¶@Þ£4eAðï6Yû5ƒf$§Æù|¡ÓÖ•[+¶hÞŒÄ‰MzèÁÝ~“Ë|ë82$ˆ5:°Sr#®¶öjº)äE¡¶Þ–)T!É“¯ä±ßÕbŽ‹Xé%aêÊËH5MJ±ÚQÄÎÀkvŠ&AhÛ›F£8-ÇäæŒhFXö³,¯È(&@©0~}‡zæ«ç™§E2¡ÿá4+a«Hõ>šmâX¯!¿?}3u©³éSALJ‹Þ5×£ìZ›I7ò‘T¯™c»ÿÇs7·sGXŒ[ÓUOV“¬M«¶°!*gCÛéË6OÏPJ:‚(¥<«úG×—w¥ßC>ä¾€6·m?7f<8)ð[[ŽƒU+8S#¢à|0Ò˜4|Ð×•à`j(|éºW:§[ße9Ï`ý!³•RÖ½ö4í½¸u6ýpS™ëzbÈaõ5òòðÀ
]µæXÝ·ø4ÒCû–-¯>zˆúèáj}ô°‰ Ø\!-[„Šéƒik¦ýþQR èT ¸GF¼¡ˆØÚ{ŸaôRÌqå<^kcÅo}RÊæ¦A€”µNpPPd¢ŽWÿßÿõ¿QïkXô›WD¤z„ œ†’Qž«Ð§eë|¥7Œ Ê<C¸Ý¤k¿U®5—úÕ˜R„üÀµŸ†Pí&ÖÙiXµzÓnÝoìY\D¾õùÈfÌ`~‹u¿2Dç{ô#Uëõ®ÑçfÙ?³¼D^3ú¸ÕxÊCc±[;V¯>üÕyN¿ûm|ê{Ï¸¡lœ®#ÝQÜ@‚!uç¯¡3ÁÕ(ñïÌp 4Õ=1zH„Ø[wäë_3Ùîï=¿NÁÃ¨zy05ðs(º½ôÌžÕdèa/ýhÌCòB­ŠˆÒZ“öþ|žâ)3œ¢³³Nk÷¶+Áƒ	ïÐ¡Ä.uËçaànq…²a”æÀ4zrNÙÕ¡øI>^”Ö´Ý¢êLÇ‹¨zªÎ+6y8	ZÔßDj>¶»-ÒO–õ¢Ï?Q`¦Qïä»Ë˜Ï´'þâmÓJÍ;ï¼¾Ø/@Uó*$l¹r€Ø¤™“·FóÓÚ£ªz9ñ<Aî“¨'Ðu_ÏiH*`€$G)»’.•mÏzø„.ÅÒÉ¼ÈÏ€R¹ê%&Ç¦GÈLCÍÌ’1Hq:é£Øs“x6¯(á.Þy
­ï•0nÁ8v¥X~ÙÃK¨ã$@vU>ë•cìá(*p Kµ3@[[Óã\Œ®Ú)¬Úv½=Æ³±?Š‡¢²4ˆ.¢ RoõBÊ°ÖÈpèr*Oaáþ4*ÛØ…ÕgŠš.LÅ š=šLVäõÊDÕmâÕ,?†Öü'·yƒþp‹îô¸TbÉ*<¼÷<OØö…6’i¨ñL)D /±‡˜ñÏ·<áÏ×êJ³Ðçž€«Z(s›«ðçk!4â•×˜“jùñ¼wŸ`dùëØ,9’Ê0í„“W;V7P¼Æn77ê°ŒÓîJžZKvôí+†÷(«"ÿÿ%™TÓÝ%ÝÎB“<g/xô¢6û›š€‡k5F
Íƒà^Ø;Pœ—vàá"îìÖÂ ®mÖò#_÷6M!ê‡:„®é»G4àðšInGk™²£èÚx÷MðÕxkË-±˜^è¼ˆæ+ð±:ÔÓ,Ïò:y N#ýO‹¬A÷½ŠÔûïöBPßµº&Gºùfóè@É]±ð;bbðyamèÅ)¢y(Ø¨çUÝÉ¡wèD9_ >§—+èý‹ Ö‡^W~Ô˜Å6¤\úB³þ0Ám°Å,iYÌ·‹H~ J‘œ&Y/OªUl€þè5ÿW¤G–r BÜMÃBƒvc$Ù¿À~[®g¥áÏÁO_,µ[ì”QìÄÚìU7P-û$eß.Emy927½Þá?ˆŠIç’LSŠûƒ4Asþø£°³	Ìÿ>9¼€tÜ¼xûª”›5ïšØ¸Þ#ÜÛi#¿¢&çä#ªæð1ùëŸÛZUo¡÷aVSŸS6IÊh”Æ“Ý°žnƒ¹4·Ê‚|6 <NWí6ˆÅrâcC\U ¿Ÿ­­^É#¬{¥Îîüú…zí²j’|V¡ÀÚKÒï÷a¸ý¨‘\]WI¬«Í±þË‡nëCÙ|¿ª¸¬EH„vÞ0ª¨¦aÖýªA5`=QàV4Äcì$×%ÀÇl#^TpÞ¯(g_ä|ÿaU‰«Õª)y…7xÇSÒŽ‹¢n4™¦ Oã>dÌš½*½©ÖiííPÐÏ|²a¨œ\ÞÚnBÕa[N¼ô7†VOHæ¸-öå°’Ë4.iA•$¬2BÊïá5ŽM4†‹ö¡\ˆû}°?ò€¸î¦Œ"
2öªnv8`&ÝÈÖcgÝºS¼œ"U':E„‚‹ª·,j®‚Õøk²ÛúÖFÍ5x®µpÏõ=—´|R‘Ü®¶´î¶~EœòÛsñ+Ž{ñn2|ŽÄOºÌ¨Ë¤ÜgÔå’®4ê2e+€Àf¼¶æn#œ:Ó¦N4˜“ÀP–€0†)|i„sLWæ°\@l3‡£ÁNjíZ:ž&ÄO˜…òûGtz*¢×s‰®l¢‡ÆÑÐ´ô/‡Ö.©Þ¨fµey~LêCÓ£Pû…ÚU™tgã©Wf¬æm©Lo9oµ<ŠEA±°c3úWÜ°‰£qÅ*(€­²p¬bšI²A·UuV‘À¨ÍÐÖ¶(§ž†Ñc¨$ãD¯ŒíÝY×k÷Gé€GòJYyÖLÿjÚ¹²µ«9´sžÝh4YÊ«7z†ë#Ý”©lÊ:œ±Ãµ?è!vX\ëU#Al{(v»}püçNXãÄÎáý;ß">Ù]ê—ýò+;¯Ç|-?œ¶(ój·E= ø³hãÉå’ ƒ’ÛÑ¾ýmS›÷Ûsï¹×zá&DÛ@¬ðøŒù¼GØêâÎsÝËÖ†—ñÌ[XP=¹7ä;O9.4j·µyj’ÏæŒ^‡3™	KXÊømóýÉYŒ‘é|Ž/KýÉ,É:48“u¯d»cÑ„§ål>±Ï¾íPSIôhò¦ ¬ÓÛ ³Æ…úåÊxô”–ý«£²SõQèÃÕë£–ñÚ¼ZÙ™nºHM¢b²Š1St
äèiyR4ÙÍg ¸¦e^¡÷R¾]èv†È$™–Œ‚RSŽ¥LÂn6þÆM¿àø«$Rñps
¸‰Vkw¦ìy¤«1¢|ÍÙAOcx†OÔ×QÎÆÈþiÜï»fQ®£'ÁÑkèå—]›é£ßš«;.]rá¿`¸îBó{³»_j`›*šxQ:‘WPÅ;wÜâ±;vÎ›éá§1kèÑ<âmàá¡[*H*›;ê|éø®£ÿò+»Ú5”vœQ®uÎs³1V–ä·bç“Lá¯bhÕ¥vG½Ê0q7ÎÐ9V{å<ÉZ{ãâ7EŽGY:pì»wXQG%î"‹ºz¦nLM¶Ï{÷mSÖchÔxªŒFež.€E£% à½eÖ‡„!‚rÔKš`²ØV˜ñû·VLºC öøQ7‡S „¸ØmñjÈ³³sã’f|ÛŽRô½¿áŸg*K^eFìšYe¯%ÿ<¥®“
Aýîº«Zßó[]£L2ÓÎÆXbVÖ/WteužÁ¬×;Fj@oª¼qJê·Ù—‹LªûÄÅ]`xnjÜæQùG¨SöbX²>x0×”ö¨íM9S
|x^©ÀßÄËü›ÎqlÌG»…¦&j”~¸‡®m¸ ¾¶àòÆý4.ªwEs!Å,~èî4Y¥Èç›/Ò2ön;™úÅ3ôòŽ[øÓ§âI©•˜×®?~%\ßKö©{\—ýêÿIU` · yÆÎÍ@Ru»«ŸR«ÜyÂ_í¸Z´ž€Â¼”êYjëjO¹Ö!Ë+dùy<Ñ7‘ñØóE¤£ §™9zkó1,®ŸÒ¸¬—ÀEñ£L}÷sßÂw<én!$n×ñœWç×e<K(ª<<Ü["ï¦ˆbD»¾ü“)^µ!Ãˆ&vÑm©Jª@!ÐlÂQ>4Ðý…îG¯xà×d¼H3unb/°o F8êæÐW9´B§Då¤Åñ*ü[µ ©4ÿ¶Ýh±!I’/mõ%^WŽa»€RÐé½…†ae— ³Ú²Ä™‰/ÌU!=9åù'LÊ€êây^€D“²o–½¹Zuí8´~í#=Õ^7§}ŒHž¨x”ØzÅO[®¼Ñ%iÝÔ*âMÊj™ÊeË¼À€n:ºžF÷Â¥·V×Iß¬ð.2¦V
ÚÈçËOkoY
ÛmïÅä†;÷-¹sÏ³¼µ;ñm1`ú¾|µ¾¿ª!|ü3ÝTnà\OAEwyíÐ]€5LÃ¥¦á½–‡†¿Wã’ÂíÖŽôÔØÔ5\?š»XŒÊ;ò×²X±­yW)ptg$ë"x^OÞDYœ’?­«OŸÃFïf^*ê¶{Ô]HýÛZ6äFùëCÇ»ðMqÝ6e=òâ}Óu—šNzæW_FE©I©Ý‰ù¯|N7›³¹ÐU"™¥ÍÄfCsì Û«s Q(‡Å†KeóÃçËg›ÕÌÂÈ£¢iÛn‰èlI[cŒk<gX=; ˆ,èCŸ>_oJ‡ïþÂ¶1<‰V!·~~ìêñjw—õ€ê³rk£†w˜SŠ`ÊŠ·gq2õ÷õ¹©WGU«^°¼^I˜ÖªMÜ¡g{)îù÷“á;ÛÞºê<ÃÈ¹Mk|„v¯rbO^¯÷Ïô•“@:~”˜¨ðRš„ ™(ù¯9ç°uF{oz…åë_°Ö“:°C^Ey–§~ß]?é<‘Q'ã®e}›ŸëÒ0z±½"gK"«`ÙäxÇÓ½CãëÕUxÎÚwkp-fA4þ «1?¶ûâ«1­g<I\µÿ9ÎßèrÌÉá¿Ñ‚ì3¤»å‚¬û¼þ‚Ì¢î}Õ%Y«òË-ÊbrÖ.ÊæÌºÅ¢, }‰EYŸ¿¾UY˜l~½U™Ö(Vew7]—å\¨Y—­ü[­Ì!Ÿcm>YŒ§e}ÑåÙx¹cuE÷/ìúÔù¬oÖM;CÝX¼‘^{g¯à¢¹_výV²iÔ
îã6Ïãt~cãÄ§©knw™VÓWM‰³¨¤ŠÒdÜÚû™¹yÆð„{[l{‰áªã®Õ7^]¾^ò½]¹ö†×v™;Ñôt›úÜjíÉ3Näñ„Œâ¦!jô…»kî!/TÀ\æúÚ'"¬:¥
+*¯¡¤t-ÚÊç¹GkéÑX~Žƒ0yò¥k0å÷À­ô—þqê+uýf£CvïQ—i"ç?è
zXnx¤µR’š;Îæ¯½ YÓ¶n5j¶qC.Ïbt]ý¬ñÊËjib‚í"oyƒj3oÒjß¸ŒÆÑ$ž%cž~…ÌµŠ§êõŽ­Ý:ˆWzœÞ@åš‹‚ýpIît^•_×º¯õ÷è)3¾EÄ"¯¹].-“gÚÏfß:8¨ˆÕBˆ®Jÿ<w,µÑ¡ZÀˆ['ºH;<‚O\a»TDþn@1âÕÅV‡ýÇK:®Â#i2jŸ¹ï¦õõlØ¯V“‚uŠâ¡ö…åSa†¼®uvX.,Lý 5¨Bä¸ÜÍ#5ÕÇiª£&‹å^¯ë!^ccr‡ÝE|ZD§§¸l=CŒ#yI’I—Œ1\gg]’Ÿœ@…e«}-ž“OãqWñoŒHÛ‚|Už—Wäj$²*@ÈÀ!¿O&4üø’Ú…
_îHX²»j„m=Ìh#ã³÷ù Ú’äf=Dkk»“úL}—7ƒûý>~7E±z`sh-‰éû4¦{‡üHkë³–÷µó—FöKov÷¸a„:Uh•ÊÍ—Ÿ ´Ç—9ª{Ég° €<ãèµø«ŒÂ£„Æ¶€úÜå7…0>
H<k]òûH€‡-”*‡]Û>+¿†6kÚ|×ì|!¿ÄbEô]ÉnJŒÁü<æn9GÓC¨tòÞá…:'‹"bnôµPºo°–òíJZ$åÓ¤¾Ä«éNVù²8—¤«îº‘‹bÜ]ÜdZ2Œ4cí¡ë&“ÔµóÜe{”x_jü¤w[×u–á4Wù˜·vJ„äw½zt–”¬ñ¿£y–Þé‹VÌD®,·œÏýÿÏÿý,ý"¦Æ±íµŒÑYÓÜ%hbÏR°ÁrLób¥“ØQäì!D:hÒ³M>JãßöKAXWs -ùz	¯^úPÄa™ÓL3Ât¤È;Þ¯<ºJÊ)„±-Dº÷pJ»R„Ì@þIMc.Îí·å•$ö	þà˜Ÿ ½N0›)-<¦ŒŒ7d–ÎªçËÙ6÷ot–' ç
ÆQF—˜müB”§«m½—]o×ºª+]§¹]§¡À¼ßèªVvUËàå`w`Õ#žù£Y_ç>®©«âÑ%ŒE‹´ÂÍ­l#³nK˜u)Ç¿p¢hž¥—JwžTS2Ÿæè„˜ÞÀ-´„Û‘KÑ{éËdÂÖÄcõþº°(ãã
Èup€¶oPÓÞž ÷Ç.•Ÿ¾¿»ïÝ¼°‘Ž¬¸VYy3Mwmp÷nÙgEÁŠ=ö¡¡3hä]t™¸fßìuÝa÷ùþ/æ	ãÏdü9J“	F§Î¤ð’Ê¢bßFÀ€gÜmÞSŠ S¢U^ù:Ø†¹J‘®gƒ0!z5Ô2X|Ì^Ð{ê²·Kì·–¶iCôÚ¢½Øæ-…|=øÐže~x€é"8=Uv¨69£¸¤¾3Ž+hmë—°ÝMXØ†Ã (QåË¶ÙÜ+j­?ó¨ ©T5ýrž&2c#Æ|YANüŽîÊ0týˆé´ôû”I æ-½ÌIþËßV $6öÌ5»¹À0B½P M<å³Ý}ÿòüXfNùP¬@d³¶Z0¤-x5óšI ^1²Ærëà©~#Xý†¬þ—ÕÝ¶æ/‚ˆÐù8¬ïˆÄÃ4Fé.*.‘³å¨ô`M*½­P­ýÉjÂG£	?,5ß™=$w	#^¾EÏ2²Ê]ò2ª¦À.Ú(juö´:Zd™Ž5ŠÔIÉ„ï–;”t)(Ô-s‡#ìi¬Öæ9ò“ISÊj&Ñ%†J ã:E1%ÛŠ/‰KÌÌ ×ÑÜY+¤s	":Ö°Ëæ4Jñí)Ô¹ó\µÝó
;™¶]­œÖb‰ÚHñºÙƒÞ—¢ÝFG©+£.öŸº|a„…þ¡oÑY”¤¸õ3ZÁú!Ð±k×Ï’1òÜq_q$zä©ñAAØ)L¿ea8	U&`Á.Òò:È(‰RÁkzBB©.ŽXz‰÷§‹²Â§ãx^Å¸ºàËëq•óÇW°ÉOã±|þ%Ê0#ññY<*ÄóK¼ÙE!Ã^&e)—­?YÍ‚-¬ä‡²ÏïAîåÝùÐÇívÛ GkÃ§ú¾Î®£>&QfmxRÙŸèÙGìˆTE ZLú
b@z¬n½ÿ®ÝOpÇøúª¡‰(åùñ¯
Ö•XZTÓq*!–p28ƒµLÄvËœ¦¯B}žÊ,¬fì¾>uõzÇ –Ax¦Ž;DËÓ±±h•‡)l¥x\d*¶aæ5´k¾Q¸^ VaJW ¸]‰"h|Š«¿ZÌü}º¤â ÆàÀ?yÀPðG“\^¿z÷üïG¯ž¿—ÿ@?&[?úˆÒ)uBÉÛÓUÄëÁ>4€æ0õ‹wì§+}år–ÖÎi }yp—åèÄÊJé›/`¦%)	°ÌpÒFY¡Ó%IEY,‡ÚêöMñ$g4=SU©gqç+t[B BP	¼¤7@ÙÚ\Ö·mñ@­•ÌGsÊâÓ0)¿KâþiŸ¶Ÿl¨ý¨¥ýLÌFQç‡¥lõa/@xW¨2Pb-§s±œ	âL9Ç7~IùöçÇã"Fµ(õSªô­Ÿr×ÂKâ£wÓ=;@±ñfl×p›—àn-‰Ò5òO²6‹«"§Oèæº¬èc©ÓKþ2†M[‰1ÿ‰*¹¤ §y:¡ù6ùô©\`PVär³|g°¿ŽNc–áÓ%û}Z«=Ïòñ´ÈgñÚ^ÛlœÑ53ç	ˆ§TYÅzh%eÃÉµ{ê! ð5»\è…Ë¿àÙ>q¯=à^x9ØVŽŒmI™&[½[Ã KM%[)Èå8š3ˆ/:Ü4ºÌž]S°/ä«	õ¤ z;hyï,.ªdÌÇX¥k¯¨˜ ¯4?}ƒê} ô–œ¤ÉQó†¹I§Íyf¦Õi’ÓÅ$~ƒê€'ù£p3­Iù'Àqè±€*Î“jKÇ4ë«œÖEKI>¹kÏsáŸ^ä§Ê_ôsPÊ)žy0ÂÆÀPžçl(Øº€ˆçOãDâ=ŸÆÙøòU^ÅLth$Ý¥¬¦Ecn!3Àå#Ë3æÙà$.¨Žû•Ù‚úµ'ç9žd8çôU
¦á,ÁKS|UÉ„`\°ŠxŒf
1LÀ9»~)„·\¡¢-)H)Ÿz40&X4®^	]L9=ÅèRkãÑ_ÿJþúWö_KÃ<"pe:FàŠ2+Õg@˜3‚¥´ð-Á(·ÑÑy4ëæó8bŒèX¾zXÐ^»Å5Q¨k'ó(5{A?JB:–¯×agÈqršE0±I¦5 Ç5n“¤¢”‚	âèúzÐ`†àHyZªº§4Û‡´ÞçêÝŽ·ñ|1J“±ÞL` s(P˜Q€‡à¡ðÓµJÔ,@NcJ 7Ì’„¬ýà=pÞD¼'ý7ŠHò.Ã{žÂX'¿ë-I^›]û)÷ ‘i&;bÆHlÝ‰OØT e9{Bëh™ŒÒôð'^ÎƒËÅ¨Jª4~”aõÃþäíÏýþ–‰î8ŸÑ éfÇäÁ“@¢95Ìû=ærKFWW•ÉÓ‘i~.çás#©vY`Óý¢2©"ùNz°¤[<@íãíatsØà2'…0©˜‚¥žßf´Uö,š%)“HžÉW/e®9C“”Oé¡­X"å«¿'Ê*C¬;L#øZ;•?4’8oaY(&;B„^^(Eú¥x¼ÚÛk/•^ÿ-ö™â	;¨ i&?-¢ùô’ˆsÕ¼lmÐ×+-Á/˜ÝwØC¡õ06u“¸Š’´4€<5Ó"¢!?aVTÌÉ¥oM„KD‚;/^Ù©·öø0€@]Œk£B¿Ð@qlñ”¯MzC?§î¹Uiöî/>|èBwÉo£I²(=5 Êt<¸lýF¾Zb\¡¶	ró¨,QPg2Üo°æø¥&Çì‘ò*Ù‰’¹ÇÑI|
…&Ûä0+aq¦6´ ‡aôR˜GctA§%å (ÆQ©ª$íˆ™©•xZí;<9A¯àöÙß]qÞIr‹é¯TBW0Ì²è\yÐÕŠ`]ð×ÊðyW ~Ñ¥”šBï_v %¼3ñåhbñš‘Y¸b“æ-ßÆ'¨ÇB¿H{2ê’ÿ¨Ga¥~ƒÌ¿-ââ²­ÊwÉùdÙvKTŠ‹Ý]´-âÑfd»\xë8‹æ%ö‘ÆˆA}R>.Û¿iùi€‰z€ŽÊ)~<¯aÃ Ù§±j;Õì$c&ÑY ÒM%Ñª…Ü¼\¯ºÂË£ðã% ícª¡¼‰cš\5§ÂÛ¬ã©­×à(8’ýCn•íŽ­Ò4»h±;jjöÜ+(&|ó[W‘×'Œ¶;¦àÌfwKË§$ÿŽ)ù2­%eýŽGþ¯Ë®CW’L„{e{Ä) —kv‰·”©¨eGìK_ª®:†êÊ—¡Š¥¸¡‡ÒÌ¥ãÓí„_§"®!jPÏ¹T]íš’©c)™ü™j`)ÅRÇT,y³Ô ²ô:TXZž`ÑµpUO¸ž!T°®
C·Óqt;¡Œ5MNÇÕá³Ö‘ ®1é8:”PÆˆjÏÑ1÷Þ,uý56
wïÌZ´	‡f®«dX5)‰ÖW`%X&Í†à²¯Þ"+!ë"n¾ž§¦øÊº¨,ª„~ô¨«ïæ<€õ½¿Pps«çonüBëª°v‚ž:¬}a°èªùH÷†ørßèÉ¾
óÆf±ãÝBÖX‰zªùâ~õiyXyè-²²RýÁ«,áÂ«+ÚÁ`5"C¨`,qåaQ<C¨àê*¤jQƒ*ÓÂ™ýpÿ   ÿÿì½]sÉ–ö~ENïÜAãºÑŸ@CK‚äd’ƒ%83÷š1±,tºKìîê­j ±x[éÁvè:¤mHZÅ;Ù/V8BŽµì'í?Ù? ý	>çdfUfVf} ~ÌEÝÝ!º*++óäÉ“çû¨4ô…îÅ0uTüéì®°(ó_*žžÐ&º§%¸^,òSpÔÔËgÖžà?\NG#€°Ù ¸´BZ]S8>ðŸ†`ÏE+ÔdÄøŸUc	Áø")XU.…€œ…‡Y|ëµ¡ôë=xÌNˆÉ_†,Fo7	³TøW•	|*ªB=æÂšœc–‘ÐJfp8Dž4Â€%€
u7Bº}‚í™Oµ 1$ºýü›³`)“~¢"€ü”Ïìe¾¬z´eF…^>Æ½Ô7­ßb¿aíV§§.}öƒ\Š™Ì¼±ŸùÐ´Zâ?­æ¶‰Œ˜Ì(…Ñž	5u>&@¿ÃäV:›®s6êÇl“ÉØÂz8^v.¿JwGUµÒj•JÕTJÚKé…$U*vïêºÄID½i¬ÿ®‰7y¥ë„ÒDuƒPn+^ª–ÁðÈ>’Æ~å‰nWs]!¥X•Š±EíH·€dÔj	‚íh©6U4äæ]¡ú6ok*mó!×R+w5»ˆrß°w(OL+†nš0¾ 2Ÿá¦_ëíNö¶bzÍ<KÌ©ÙÎ¤‘4ó$5}f?eZ&3-
f&ÏÝô¤MÛ¨Z¾]¦x$-
ðDÒ¡Ä%µŒ8ÑsBeU7#ÿ$e89] ã)]éÝr(|…8gátMŽk<]ù1ËOÞ˜Ç	c…‹/Rš˜Q$¯@|}%rYr<JwN ÝLV;ð"XñV›’G>vè‘«è-"+«S8uíbœå)f,˜x1wºÁ,å”ˆ §–JÍÖ¸ç³@ÜÈ¤[‘³›Y*³ .¯1¬·"©ê/ÿ²ðÝf³©‚[{jÖwÍ¿4ç(¼26ðÄ"x;«ÙVXç§@;ùWÄ)Ì>E:ôiö›ædX5×]Ê¨/z£@A˜_íËKpW5ø–óÄùˆÔä
¯"1'<ñ<œµÐŽZQ4HŠù8Ö”™õgÞ[2ZŠkº–Ñ«#ùÕçÞØ.Á–Ç†ÀãAšoÊ¹U'BK
{«À°"^[²ùÀ'ø.Øû>€®nKÌßÞAÔçæ7g€!8ŒžEn¢…"J£íSŠIIâTÓèî‡Fq‰ÔÃï)%aÈ”üÜŸ…YCmÆ-	‰ßâ£Ic-Í6_j.Ãgá™íÃ°¤ÙËèF‹Ïã‰ìõ—¥¶<®'Q¢u=ÉN_«™Í¨I*ÊpÞìHNíà"à4*f•"ƒwDÙ´T§#:5~òZ‹vÈæMÝ0B'µM £uŠj-`M!Aš»(e
I]‘Èé®{<ÐÕÞ]¦úõ•zJ°þñŽß‘ŒÁ»`têMÅk|¯ÇS?õÚà¿’f{¬Ž{ŽX×9ú î¥¿é ¦!h° (LwG”ô	ˆ™êG µÞOi@ÿÕãžéJ6-N§ÊV«ë9:ô>Œ˜e#ÙÑÿO@Ž¹Âûz_±FFg 3ù×œžÚ•p8aäÕÊÞÉ(î±)¦ž>°)‚ð:&ÂV&Øsm?Í‡ög~ÎÛ¶è)w|øWˆw¿EW˜ÀC$¬%'|2O)­_RÒê$X¨o˜í4{	õÊol‹8k›¬ÄÝìèl­›cñ\ò9ÖF'Õæ6™…j ˜¹CÓÚb¼uÑ08KñÆ¥?eãt9ÄNNÈƒµ›ÐI/ºkÅé%ÇÒÖ‚q¦T¦äZ¥¯~£¿h"•˜½F­*M‚ÃÇ=‰~•'‘¾Z0	±*×Ÿ„Ä÷4Tä¯<õåü©TÂn"È³ÄA¬=k¤‚ºÔ£ˆ¶
Òú-Pœ£¿M5R,RFË$ãDâ?p0ä­J¾ÏGæ×ð:HaäÃehÈ®&Ü¦ŽA´£õŒ(åAfhNFY¯)Üþ§ŠÛ
ªÜ½àeŒ‰÷‚Ù˜ÅÑpï2ùÐðêË½ZMÏÇøz«õëŸÙDüRÖ±­B0¯Aç' 	øÑa8†{µyØ·ŒŒŠª”ü¥f;@Ñ€âq†óDVŸªJË\îÅïÆ1äQx¾Wk±ëôàÿj éL§8 ¹_CÞ)|Óòûá4Œòæif©\ ÍÊpï²}ÅF{µçíëtâA£ÇvëÇþ´1htÖ}·=l±-6`íýç}Í,~	ãVjû|££F#í~ôisŸY6<‡ùv@¼àÿFðOë*³öj.Ð¦Ýfk‡m5;[Ï:¶ÓìlO}Ök¶Y»ÙÀ“Áà4lo7·áÑÞë6;ýgð¼×lÃ\ùK[Ív£Ýlµ±q§”)ÔëãCÙ	§ëN¶¼ë1ürþí½k÷¼.ëÒ`Z÷»Ìœs{Ä.iŸ­†Ñg›AŸ“íŠØÊÃè$$E:›O°+Þµš.Ó[c•±PÈÉzäÉÁcþÇ•ØpÄEaË£NHn¦Š„É9ÅûAÏKöµ‡I¬¤ùãéé|(ò =Jù—ä÷ÊÈŠ*ä÷~Ð‡˜…¡ªçÜ…kô—î< )Æà“TçXµ¶°Öhúî®ý+4ûÒz	”VÆÖ›çÕÓ;q|)o.é§0#€ûCF»ö>Üðh«õÖ¾QÓñàƒ‡Êêå.ž«´rö	¸%·ûÌ²Y×aÍ2[ƒTÜÓ³“¦\ìbÎ4ø ÒØjrHJèíJìø«c£%T<!#£äk`=¾¼\¢)¶yìÍáç£1æH·ÏÕ›”‡‘é2a7[.¸	íU¸ØÅº]íjqþÆÒøQ¸âAí“L½žŒ‰{IÎK¿a­fo}»Kù­t°"ãêÞ¥nCUf“LG«™´Mš¤tïRÐù0¥˜ì÷%¤vß9bGÓpÉ¾=Å€æ¼
IIöLªþÞìóbðFøsºq${Òèè•Iô’"ÿgR¬M¬'#Ë0Qyó¢R&ïÝ–-£fn‡3ûD«r#+¸óa´õÊ&™²R
Ó"žá¦dV)n^;ûˆ³O{Ð™s6_»¥îÇ¦Î¤·Vf¶Š³ªµüÅlI™L%Â;©Ò	Þ	æë ÊÛkê>£iÉT¡gxž+ÛH¡i°°GÇc³†@ž£4T–j]‰Q1ÖýòÈ`ôC#Ù0].û¼¹˜È¹èÂšV5ÂHú*ëASJW%9,»YÀB¬øu"ñ
Ð2.¿aõÔóu“aÔ I¶øµTm÷»6ƒ¾ñŠ±$™¤ÿ
´ÌœüZá
-=·òVçÆ`Ü)cŠ6òÚh
Ô$4ù¬‰„†–ùž¼dª²n|cÐˆV…dE8jP4
€e–SÓúÃâ^ƒþ7fß„¶¦W5ZdÎùCgŠø}Ý¨@ndìÇ FƒÓso‘
cI‰(ù“…Ðy)A_º¾‹§$ÊˆvêºHŽ	èwRe[«·¦®7’ññ|)9BþÊV¿eiÇ}°°kµ´a¯¥·]€© ©R””ñÓ^ÀùÚ»îš-Q…õòÑ›â’	Õìw˜%}íOºÝ^»ß_#¿™‹åƒÞv¿¿µ³¦ZÚuZ$xª XQ·$­w$oXá¦ÂW6Ün•pÚ-V¿r‚9m¦f§¤eÛN¿¬[[=¿{lu«·=èoçÀ:É UÚï`a—)°ÅïBX‹vå@-ê¢!:ç:ù¶6”D¼@‹¦*8Ý¶G;6œÞv=”g™œ¬˜e>¥_!ˆ©U9 ËŠNyÐmÔŠ€&ZZ K+áï`Ðîv·-põÛíQoWJôV¨¢X@ZbÀ¬.÷>˜3$1hê§”çþ)þS´ÊôÉ„(Ó/\v]˜ ÛV1^SÃJ”ºE—úíüï8ú”]¯Ê¸¦Q™\ã«çñ?/|¬Få(âw»p)’úp%–#ýÈf/ç˜¤a¦Ç¤u!ìE÷æXr¡ß¶wÚVÜ÷Ž»­<Üç)+€xáÍq[ Oz­¾Ðºá¯bÈS³rÔFôŸvj#©k!Ì©áÀÜ¹ø> Þ¤g;-·Ž·F½ˆ‹Ô‘@ã<F²Ù· ]<LP^ü.¼hXôéWò€Ÿ´Ò†RfDÓJKÐë·½V×²';ÛÝöVÞAJ);+¬ §§V¤—¼VÏdMò¹*¾±€™IH¿9ÛYP†m·7ÌÝ;ð?'Ùíº;y\»Ì Zai8åV÷†^ãu —S5Y5×Q`?½MØ$móvERÖu³¯¥ƒ)ZVâ/]Ûb´³½ÝÊÛ˜³¶ÊAüö‚äPîx«’|Ê;*#BË‚ ›H8ãße¨è¶†w·v¼¶ÃÇ£“¼óVä® æ*‹mp¦	Ù¡_…¼=µ*ÇæPÓn>°ÅG•”·ì¹<¼ýö ?²‘úÞvç8§•¤Ë`.9îìòY%—/•CsÙ:O#Û$¦¼Q†Çt} w:[ø?›àÚÅÿå,‚–ëºÈ«Á½*¢ÔÛŽNFÛVI€?3çç¢öå–…·Å-±å^—¤c:æÂEMÛU„Þ¶ß>îÙŽZ'±O}+„!œ4›{¦³®'gÆLÈSïâát1ÁØ[,÷“‰¤–™¡¸jø›äÝãñ‘¨_™	ò¦=€Y%£<NR„ó®þe,-ÿ€½ÁÒƒ^ÔÀ:9|[ÆÇ^½ÓïoÈÿÿòR}íj}ƒ66§Ñ´þå¥9È«õ7l—½q>Ü°žëÐ× ¿FhüzM6a%¯RË¥#IL³ÈZ»ðÐs‡ŒyÒb¸¦¬&wm¾èáB¾-I±<Ìoø³ž'.-x¿äöqñÀô,BÎ4&¦ÑhÔ¾É6UKO¨æ€ø*%‰)¶¦öbó¡í5YÐHWîÓ]|ëèwTg¸·Î–íõ$ÝtâÛ‰ž=üU3!5çÅËŠënœñpwö¸´ïºòÃÃ7v;«ÇNÏô¸¼:¹Ì¹›ÇVßrH²Žäöi9ÉícQ¼Æc«‹¸m,YpÇX\þàö±hÎß±ÃÓ»]òGä^t»·ˆÈ;9qÒ¦žŠ}¶<û=SEO©ùl8Z£9Í5ðŒjýé´Æ«½¿áõ¾äeßuó{Æj¯÷‚•QÉ]Oº<tÏ§DÙOPÕ5	F0I)ŸJG¡ôˆ¼bºÛ—ô8zs•ú/¨Y¤›Í¦<s®®“¢-ÏˆYêž\¹{Â$Cÿ³í„Ïwö}9ÔEÈ½§€„Kßœ5¬¹ûK*Ò+\1èðXK}/äoîMò4À[èÜ‰·øÉ»ëÊWÁäésó„\ndÑá
«æUé=Y©¸eš¹9•òðÀËð¤]×;CŸ¦Wá‚=$~‹‚Rš3“l$5½¹/â…5W(ªµ›}Ñtô”Q“W<:Qõ;‘_¢C“’Œa”é2ƒç„”mVÂ/ñØ_žù€æ‹FÏð™37BŽÊ)\Ùñ?ƒó|^O=t„Mâ3&·!sŽ9$!üH¼Êo%¼¾’â„mÕ”ÕBÊïY  ³wA–kæì`~fäI}=3%Ã,ÌÃwÞØŒ#ì‚†QÑ|%9]nPl£æBMî9è øhòÕþM¢à7,úËj×œž…šG¡Dè+Í‡—-·ÀIFï>ÈÐ<Û²g´jü×µ‰ü~§¥ú©bÄì¼áb5•Ô¡4©SÍ&øõ]^R»Ýê×l®jiÊ™Œ›š’w†?;V’Í¤-Ô4Â—-6‚MÞ#`Èƒ{.¶÷JwW¤UðÀwÈ²•ñ1°×¼Õ¿Íd´å–V,[".·ÎòîÕ	.ô[›ƒV©%”ëý–R¶£(‡]&˜ŠT˜n¦’4ûšÕz½š{ñÀÄ#1Èt{Âk8˜×;[Âm¨åÔä¦ä>Üí¯k¸¡øÍ ÙÆF%±ÜjUÇˆ2ë_¸75M†m¯#Hj)¨Þh4»ðwyË]¸”|£,n‹±bC‘ç©«¼ÆWí–›x¨TâAs8ñ¢‡Ëz‹ÄZ–¿r/o¶í=à}æÚÒâRÀDÞq§Uâ6øºÕlwüÙÏ|­P/J®‚Í>[œ7:øÏùk^Éê©ÌQï«¢§ffq+«_v	4‡ÄÄc°a&÷ÂzÍvßæ¤¸.	ûeªÊ¸º·‰p3!œu´0$?"(Tc0ûHÍrHdX¢ÀcŒøÑ	²y~óÆ¤ñº×[œÿ|+üÂ½I/ƒYÊ&ç„ mºªá©JXÝÌpÞ ®µk:Ûš,¯–+Ùåmjú—f’¶9v¡vRggº9é#ƒþ4ËP"vð )ÑÈ5Ï ð ×Þ±¡rO¯«+3¨N#ÚÏ$ÂNÑ ¼¸•R¼ÓÜéV©(ódCS-î©³Ê¨§ÄGZ“ˆ6{«
}²Í&/ü)q¬Î.gÙé¬ËHêT¥"6ùãÐ+Æ2#<xÌK?„6¦_ QOç¢™A8Rñ¼?rÅÌ·€Kög/5G¼–ëK~4q²‚Ù½|Tò—äÂþ"jð£ÍÆ‚å`ÒrÈØ½ÛQÏ%_,G	Ä¶'ñƒ©Æ­¢“pH»ö’ þÎ›žú{*Ó,Dà~ç
Èé;ºW{^Q<½2ÚFé(ZÉÚë¤Ÿ‘£_€ûUåÏT(ÕãSXnŠBµû:‚}ÅS®P´Õ ƒØ·iá‘ƒCFZsŽš0
h¤0DÌ±—zšgNxBø*¥‰cƒ!Ð…ÙÌ0®éEÓ!{.,¢€mAK‰KIý&¬Xq%á)™}CX½lÛ—ö¦ÀóeÞ¡Ýí‘[Âa?#a÷–¤&–î¸±TEËH	“ôa‡¼`ûž°ïŸ²'ÏŸ¼üöÉ‹ýßÙqÑ†‰í¶ñY+„{éPÒ`Á$€ÐŠ”—†)Ô&OÙp¨Ä^I;ÔJ†Pil^\LÛPUcën2põîßn%à%}ŠÐ…ªstÐ]\pJÐ•ŠÑÓÔ/Ò$ÔÄ¾\+r©9—ÚÝi…ÃçP‹$®` AÎé¼,Ü-™MŒb{j"ÐÛ_éôŽØg¯ÛÂ#=@c†nl*×eãÊÞÃI^“²dUƒ‚SKlÕ%&ëÄ‘ú\(¬Ž;àq¨*.ÎbÙÆëFwäÖ±–O‡®ÍÏm1°™\Çdê÷c?Ôlú>»F5ÃtY'çDäRÊãÚYiiRµmÒY§ú^§,–H}"3¦[ÕuéÇˆ¢¨‚@þþÉù"ÌÊcyb	¨2ÐjIšQ(	È5û	ìÔü³Ü~Hµ-¸›ÙsZfí>ˆý0_Ó]’§R !Œê‰ËzCúÏ-'?5óÆö†Ó».u­[ÇJ²þÑ2rêÇ]ÂÚSÜå<Ù–ÌžN¿'Ýt+¬œëH_È\d‘Þµdr<†eÉs"¸>~røä1Lh§Õ©9 *;ûþéÓƒýƒ‡ÏØÃýý'GG¹Ð/ZEÍc	)ÓõÂ^Í%u<Ià
š(…Lv]5óæ&{,¼½Ù~´€Àc%£c¬	&JåPC3[U¡æ¹ñNt'UÐò·M]R	ôù‘µÑ¤Cìæy[S€‘O{‡å  Iág}.ØÄ›ž¬œÝi¯;=:†&×ÝA‡$ëˆÍ9'º>1Þ;Ýù§®;GßºJ»þ,Q*§›ßÊàd>%´É\´¿U½GáèB–¬Šù§RõçGqØ»®ö÷JË‹HÔ£pF¸G½)–÷ÁOQ“•Fá‡LàiÒ2úÂ;Þ­ºãÝyÚÝ‚§Ýjüìî\èî\èî\èî\è~.tâówNtwNt&~<B‚xÁeÅ.t†4þ©Ajç ß .€Ä§ÇË)Òð).!o“/†O@ªPòN’DúHR¿Ç3¥ØÈ¡e+i)ÝÜ6N;X¬J
*Abê(Ž¹ZŠ«)ìé4€ão´ù’l#Ö´þë¢r]À»ÎoMŸ!mðÙ;ÕÆç¦Ú¸s\¹[ ð¥4> ÝÍŒä%¯ôHÇ¿c~Jz·QõSN×caVèx§ú1±ÊÂîÝyò}¢ž|½Á'_2¤;O¾ÏÐ“¯‹ž|íOÝÏ°(ß9õÝ9õ:õÝ¹òÝ¹òÝ¹òYOµ;W¾;W¾èÊwçÅw%¼óâÓ Ÿ{+ÏµNù¡×(:¤uóÏýá)í»	ìÃ©ýJæ’ã¿y«=V÷w¢ù(1éö”Ô¨¤¡3JøíÕÕÔ‚Dïý‘Èî¿
©ÏæÔŸ—J¨×JÃÉþGËzíEˆëÍHc~º˜†€Ù#n€Œ™IÉT¯Ü
ë×d‡\2âoÈ”xò=h	ÔtâÃú¯=9'©›=“_ú	¾„î$d³_kÖ’:»\ÊRóí7ñ*˜ùÐº®pb0Ú9HáMŽÃÕëˆ§j.Uáo}ø6 *AåÐûwÐÖ Mÿp€-¼üÊÌÛ9
‡§Èå5‘:r†ïÑÅÁ¨žªÆDëÞSs]~‘t“ÇvYX´N‘ÍC¬O ¹ð—eÆ*ÔŽß½zþF›|²Iú?¼û>³±/š¾ùÕ½/¿ÿêw‡OØd9›ÞÿÕ=ùP(ÜÉ÷¨dÝ},èà1Å=Ç¬Á¾4‰R~½³{›¼'ìsæ/=††rÀì½Úéò¤1¼Í=àãÞ²	ð•ÀÃ.—‹xwsÉhÜ‡á–`ŽÉÙæ0Ž;x¬óyvÏà,üS`•¾éÃÿoÁÿÃéö0 ßì´Z_‰–ÿÄ_>Š€ý¿~òSúÊ¶h&Äµ½øÌ[ Ã;EãîÅÔ‡Þ_¡¾£`±$<áp4o¢Á÷#X»$–š*oqÒ([b®Ì“`Ë 1c)2)'ÔNÕjâiRWÇú= xþ˜7ëö[˜ryx<êûm-w3^=þt§çu™§}þt«·Ýgžnñ§¢Ú™ùt»ÕW‹¤iOÕ“ZÉý+õ_ü¯@\¿ct²”MÕùáqð''í“þÉŽÜ43/ó]Ö’7Dµ]åŽ7ƒ&lÂ´Õ 	4b?
NTZLÿù}ÓŸEžùÉ˜’/ ä•Žã¼!ì`_^†&‡æ<(¯³ä’…O¥Q;;Û³%Rî´[ð×•9ì˜¡ÐúM»Œ4´Éƒð¼Á•µhùBÁ€µÓd.ü‡2O·6èÍöú´èÁí-|ÞË>Oû$®)n8í-e–è² Ì{ÅÓ¤ÉÑ4iÂWÚ ƒ÷C)…çák&¤wûj$ÂÝet÷‹`†Þ|){ÆÛàëÄ®ÆœÎæ0…È_øÞ²^4âŒµl¿ÛÜÌfë–$Ì='É»Lð–¡x€]g6cÐ•å¹@ÊÓ}j‘¥a‚ÿ„/™p&ñY˜Wœý©LFR‰½Ë8TÝ3Ð³4˜3è7·¬½
{QvZN#QÝŸƒž
‹\ùmØ01e/äÖÙ6Ù9½fßÚ¥´~í2aþ²ô”¡{Ü0“m‰Ç}ãø’· Xb­ƒ]æ½­»£\«ÔÚŸØ"oŒŸcQüiS¶QãÌ?~,%Šâ„Þ÷Ú.œ‘˜+Û2ÌÒmÝ{ ·ùx›¡½Ýov>ànÈùž²Ü­>©ýp·	n¶	’ìg—:Ú’[SÒ’³S>ÊººPÖÙDAWç—duµY¦n†¤®·šƒ¾íTO6€A ãCÚÐA'57	KáÏäììÔþ¤ ÅK#ÛÇÄ£,A-‰PÛ7*¬¡œ_RÊÕæ¡>B%|¹‰HN>M®ëÌ|'uwº¬²ÒíÑò¨ˆyð¦ÁxÞ ½sŽàP^ÄÐMz»ŒÌ+Ùfè-Ùˆ…»¤£Í{´Jp÷IËù,½5AJüàøÁd¨ÐcXÖµ®Ál¼a}¿'‹~LQ½”º ÕQ$³mê¼x²dœäëJn=ü½T£*dªˆ&ªtj{šªj,¥Â¨9úx”æÀfùn"'Ã Ú‡©êX,˜K ”#Ìù|}AJÿ¬j }ÝÜ+&÷§ÈP+pŠ)ÆãaOWú\eçW¨B	 Ñá>j†r†òe×ÙÕhMªžtl†¦us–EI¡÷äÊÎ{›\7iA¿h4„-½l¢p³GüC5HŒž{5mÉIƒ’:¼|©ç-tên0ñl—þFOeø[³‰ÂoÓ,Š~¬=é:CM0|{Aí<2DX;Õf­ØK7±‹j“ÂºIð"Ö¹”>KÓ±2Å¦ziùùl:¹¾~wsóìì¬yÖm†Ñx³Ójµ6¡EM~``8klÕìOÑÇeî×Zh…ç{µìÏNþÊ£ð­¿WžFy=öh¦Ü{£o¨YÝS Å÷j4ÜšzûŸÂ!mÞ§½¼WëÔØh¯ö¼bÒ<ßfíþ¤=ë1ø5kl³Þ¤Ýñº¬ƒjµºîƒäW~~·¥üdÝwéSø÷½æLra`±ârà+í&m	(nõž1W@"ù&Ôî]Ä°²L±‘ÙQ"Ãp¼­ô¿ÐºŽ,Šmô©W«ËÃ±ÆíUè–Ônæ‘È1½h6›¬~.N1óç(ŒÖ—eâÊŸÕñ5u¸ó8­sˆýY@óH6%úËCºæ)y€Ü6'>òßH€ÇsCxè×=Ä$KP†!¶î¸yõ`7‘r£ï 5O!¡ºÜ;>].Z'_
çÃ)ìë½š0@§aì××•!ñYmbÜí*¹µ-	P
ÞB¡J¦ 2]s TÕÑ¥xsÁšËèLƒxÄq2S>9cÙS?¢¹Ghÿ‹ÙO‚?Pˆ-ºZ™±0_^*ÆÙ+½gÕ(( ÎÉ
¼ÇNNç¤A¬¯›Öþpî Ò-„³„ÚéëñMZì6y÷$žÆækŠƒA~wl€¾i¿oJÏ|³/¼D¹×ÔºK@ç²=c“7ÂbM èö9ëÒxqp@©0>ô£—pPí±vzWËêtoâMX D–°00†Ì¤2N?&2qhÛécÿ<Xº^UÝôÕ—‘4ïÑ‹ºÿs±ßž¨³Ñî,õPßÜn%iºÑ{2B"mfKú•º%(
Â™}„êìGôIh°ïDÕ·9LÖð±6$/£öÑÑ"ÞùÓ 
‚7I±¸Ù–¼ùØ‡-O/ŽüåôJ@ØüùŸã¢ï²7ÉþüSÎQÉÛµÒ> ßŸ.O‚¥Ó	@: Â°O¼ úú±`Ç‚¥7Ý ·Zø^kc‹þ‹ïµñŽ|ó}Ž¿þ6Âðˆ·úw¶ÓVûÁü½?Í:ÈÇÞ;ß[j5ŸƒµõoRß·¦+¥»RÖ×Ù†ý¦T+$ó¥.Jµ‚SªÝ¤W®Y_shÐìôÁ|âG¡W€¬<:^$´Þ×¤¼ŠØtÞ}ú÷ŸX]€\råâ^Mñ
¯B¯ÒbÖ@³ðÇ–j€7Çã°¶³sØÜùuë–w~•WŽ‰aXáùU$[ãUZ]ª¯”Ã.Ÿ·Y½6J·™_…m1À2ÖE9—6Æ´×²(c}çW)k¿JØEŸåM†ª´­†,Ulªê…–UÑ¸‚ÆŽ¯L	s%¿®§‘!øW|£`¯d-Oüª¸iÜvoš[ß5…#(e¥0¾Û7·°o>ïÍ’1ùó«À‚Ê¯"ƒ»€H±ÍV‚®Ðr›öXòÛ%ÜøUÚ–k4/cÑ‹VÆœ(zwYwùå¶ñò«¢VÜ[Ÿ²P÷rXë²êóëv±¶àÛ%|øu‡µŸÖføUäÂÀ¯"Gùyå‡)å~8(ë|IˆYA–õÃC)ˆ9>ü*òÌàW9ÿ~UDKújð«ŒÇ¿rý6øUà½Á¯Ž1n~Ù·WEß~•÷ðøÐ°pìˆŒqùCÊüë–,‹'ìZžÂi,È\ý&Ãè’`7ê[äØNbìH170Î;9‡?aé0Rx¦(—/‡ 8,ýCêD«Ë€F{hž–#AÛ.iæcÚåÃ°¡y…³ú%ã»<#ðÐ¦E±›ª=b]­7gÞ¢^ÿó(ÉÉÑžìÜžüˆRŽï1×wâi0ôëIg@á•*_Ñ°¯µq©‹š©­,`Iµ+’î”bxïŠnOh÷¬yÓ3Ø?k™ŒbÎ|b¨ÌD?SÖÆ–ðs˜n‘Ä‘~=é}ÉŸ¼º€ó”4‡T„¢AŸe7k˜çJ-_˜gúF+j=9þeªÿlJ)1ÌØ_xPKÐ€·xWì)•Á {@]"XÖ:Ö;ˆÂ3ø¤-s¼:‡/òæPwOvƒ/íÃùôbmÝžë«T–Ñi
£+;^M0›%ÕÍåP©‹20$ÔÃÊ "ðcƒˆú³(–>©Mƒ×Uò2o%c(5:ù+ã;Y&£Œ{îø4˜’ë 0ŸÀ!§i-#'~Èìô73ûj²LÅÜ)¶©•–QS=ó»RS!&IåtË=ò,ä \Š0ó¸î däØÏ”¿P ÄO¡Íþ\[˜˜wÔ4ÂvZ?'nÄb	é¢%ò¥ðLP(˜ÑŸkZ@g£]ùúëN³arnG²¼Í>™ry¿Û˜\ÿ˜4^ïtÞM~Nû¾z#a¨Uf‰u/eóøõ2VcÌßŸ$Å0rÏ´ûyÉ¥Û—5Ù_qVzÝoÆ5àO<hu[“F¼(2gS“Œ¨Z7Ï,ØieŠ|Û_ØRÑM:™D*Ó1ÂSæ,2½¡ôü|¦s7—‹$il=R˜ ¼·9édàLö“ŒAs5ê—q—‚ÓÉ™Ð¬ZŒ?ûê6Ø7ì5
Þò[ÌsÄ;°¥‘QÆ`–oKÖÎEÁ2eo”Â93¢pp2>¿„c¯Æ™I€Ãù>y@‰_@5âRÿB%5™yéØ­®×¶î•bNB#'ª¼ú*ro`*-²Ú¡‚g‡<[ë<6á@9ö.Õé5­=C€á­˜ßú‰Üj@áÑ“0ƒŸ>72DfXB£ûì‰}Ïš5ó9œl3Øò±ñÛ[®BÛ–LÄ¢3{’8XÐ–’ŽÕî“uæáÉôoOæ˜‹wþ!æ‚Ó`GUça²9ªK]r÷ú{ÿãLV÷6êÙ¶ÑÖª·‘}/Ôö½ùÐŸŠLcÁ²–‹Ú÷~+×s`9”²p´g_ÒXá)Ç¸\ÌŽÓÀHHm#’™RTÓqêømº©#’Ÿ$gôCoS¯?Cýñ>¹x—ü#¾¾vÖØÙJÌoY&9–d<c#å„:/Ó1sÓéd}ÆeÈ}J¼"ØËÂlâò+½,_1éf6¡$ž'®­åÎ)ú&íÊv“f¤Ï$veõšt³)Õàˆzˆ©{í"P¦TTZuos»oìþùØ®SWñÇíÈ<Žª+7o¿£ñ&
 â¥-ùü¡§4Ó´šÌÑÈtlOä|4¡, V‚™”«PF„BpBjÍ7MO4ÆÌ8=°€| Û×ž
pvŒÉ¢ŽÞXž
s‡2‘H­ñ=¯ÖœŒÙ¡¨°oú§ièP¿V»²ºàåØÃ4­s±‰³‘BÕ3–“ æižAhD¦U(f¤oW“‰1ÇlÇ_µ4çÒERÿl0 o”í+ò±
,Ï÷…36G \P±Þ5°WèÌÒ6/A€‚_02žž©é€†#C¸õ¶]}A»ìH:¿òš6¢á&ÖM<õŽP'î´æï÷Z™€>N,¬#{o“>bùxvoóCÑuf·t‰Pl[ûÖ¼–hèz[
ê·´,šÛÚîèúÜüQ°TÄDË‰œ4¶£•›óÙ™œfšÖYu	–ø%×z‚‹íu'°ËŠ;F8M)ù0‘»Íî6Æ¿ÿÖi¶;ð—÷Ð^‰wÉ Éf37irÁÍýÀš¼TIun£²˜ç^Ö;¼ÀäîÞt” †ü½aúä“N¿eJË=„xÏ‡TeÈÍ5[SÛ[nÚu¨3™qeÄýîŸ†€{ÖÄÚ*i§–œ„ò)¼ºï¦K|,@{Ž6JKQHÍô-[zæQSÐ×^ÂýØZ¸1Á€î})ÝïËnë~Ø“±¿lÒ™‡'Ú…%¿³®ãL‹ç“ZEØq`–å+áP¤„×"_2œŠ»¢«„¶Ti…çTÐxxÅaÔFgöeÊ>`kiyJÙn.Qâ	Ïü9Œ¯¥zÈô²îßpAËW§¶€£ž§íEvãÿðû÷ßþî÷ì€ÆÌ¾Å™Õ•&@Þøû%ºžù ‚PŸÿûÜÇlÏÏ}€@†dõçø´Jw'!r%Øßÿô±'¿ñû–õ§ô¬Jo€ËÉïï_þö2¼ Öé¡¸Y¡ŸaÌb”qXÿ{t].Øþô¿dõ}þ¸ÊÈæaawÿú?°ð'CðÃyãWèbL©ºÿáoÿ#{vz~]ÐBVx?úŸÒÿÀûþ‚=÷"Ìò_ÿT™L|Šú{êêŸ±#úÁ¾¬­á‹c$]ÿðoÿöÂ‡ÛOø‘ °ÅUó#ªÆ>ŽæÿøÏŒj0&>z#vç¸¿¼J“{{A3û„Þ¢»£·ì<®Ò÷äEêêïØþÄ"ì"Œcà«ëGô°Ò¾çápl;Íôÿ¿Ù3Fº7o éóyÒ$§c88‰¶—Ï¾Ïe¥òÝ<1ðG£-p?öª9«fâEt—ûÄT”É¥œ1‚È¤®;ÏR]0_œÚS©t;	¦¾í eTÝr±Ü«ÁŽýÍßØeNÉKk3éÖ€_c{,9=ñwü ùºõó7Ž÷0}2¶Zwö,ûŽ¸ñkÍý3ö^yI7êë®®™xE„ÛúsŒ¸õâ‹9œ¹sI¿ÉÝ%½)–ÝêÁë¢G Ÿ§Ó%²(ÓÎÇî!¤É›gx,Æ>âÌÒ[¸ uýS‚+þÓjnçÌ‘¢s÷ú‰õôs9¯^Bÿy?ö–Þ/Ÿñur½cã˜­#ÁD‘Ki;¨5t-Æ-øðî,Â´ø±Kü¯syOa©èwbÆ¥_	o…?tío­Ê•éŠpÉUÉFcT(ë<–mYÅËR=ùe!U]Uš'Ñ—Šþ3š¼12D¤7³jòTãÒ5—@OßÚ§ÔíBöî ì-)|ê,ò¢»†ëËoZÓ<Mµ'ÞîI’p¨,íAS`V]‚£þj9D=Ô«_ç¿ŸsPÐc:,²^åÅOŒé½¥¬¼f˜È¤•×À;ß«µ[yM¤ç˜¦ûE«Ôfï¥þâU®†(·nâø•5Xð
ÐJ"û)éØãxe²jXfdØ˜3Ä|C)7l"¥
0ºH±™ÑSÜØ*ýE‡}×<Ý˜ûÒŸA¿
+ãÄQ›Ý0}êØÜ¶ÚJ9Ê#™Z…Èp6ÌµÝL×ÂÚ·¡l“øþt‰;™*E_SÓ¢Ñ­jIýêV«ky–ô{§l¹‰²Åâ/I’þDò©t«­?ì±{…‘:äµºÁ‰HEÜ°•T&É÷ð3ÿê¯„ìWÜíóHzÊbþ§¸r·è¯I£ÿÿhôÔó*§¹-¬to‰ó'ñß‹±wT]<åÎ]”íê{%·Ájé‰’5á6ˆŠ}×¤+–±º‰‹šâb¥ÔE™‡…¼¬aHB2ØûK5ÅÍaå¼|´»þgòAÁŸDe’Öåa“iEáY*“¬‰øÄ³$–¿‘þj°^éTßÜI½qa­Â?ªEX‘2ÒÑ>ÇaiÃ0ås¡¼-€^1àél´›þì9]T D¯­<Ü%Ð@.îJº¶ÁhpCøààÖØ•YKH—|:”w¿Ã,@H ¸·Gáû°ã•·¹:©x¿àÝã0|«¼ûßÍÃ3 AðéGøÀªçø™âÎö8Dx«[œ¼(øæ¬X‹â•ç?'¯r´¯¬Ä‘`®MG’Ç„á¥E2ÌsB¨zÑq.÷rIIÝ–51uÕ/Ýú¸3u€ßAƒÌQŠ=À…TI©pLëfO÷ Ðëp®åõ½›ôR|ÓçÐ¬®{è¬9z¿rð¾„§îüËŠÑÚMÝñr	q€ƒ„õö·ò7›T]Q<£š}ìq0ó'ÂyåKŸ‡|§ž‡å©o7]‘¬c‹íØFïCq°RA½6ƒBÿ˜[0(Ì"É‘ÛÏÛåX“ñ2îf½Œ•‡Ó?†TQ|ÝžF2 Ì­¥Ê3e”w1•³šúV_\©©í·4‡‰³QZhÝUš*Oþ„AûWèÿÂGáùWÐ©u–¹î!™û\ðÑ©l€,²»ÑÝ®Žt€t`%Ê©›ªÓ“±v?ž¯ÃÕ6ÔŸ‘¥æiy4g˜ØË0œûïÿ¦Ý¬Ãé}FiÜ6¦së6fêl°˜óô‚“0>ñw Å1%«ìüýßtà;úNK~§#¿Ó¢ïøgâ¥’Ÿáï3Tàí>|¡—Ì¤Ýç_è‰™ôÄ')¦Ô'þú?³ý ¢6€ƒªÕ2AÕâSè·ø†Ô¼, ~tz¶À€òú Çßê‹îbø­>¾ìôœ%{ÿÃÿÆŽþâýH:8øv2ø¶|»¥uSsg÷œg[¸y¶"®Mðm‹¼3¯2Ì[ö-ÃÀå™1a‹&ä«¾hžYSâÍ'¥š?"Rû’’iÁKQ©—Ž& ¿AëX²š9vÊ2ºoäC1¶ÉÅ‰Ú‰åÀ)Ï‡2–Ä†DÑp§	âö$§2Üé ;M5 .F’_F51Zâcô#w÷•8Õ|v4ÏªP´½ò­	vcO¾»¸õpæ.ØÐj3›/ïmš5¾ÎäˆÌÃ{«eÅ$ß¢SšO£®r4‹óõ<›b9n·1´ˆ„^—8btª²ïí±­Vi‚iÅÈ‡w)ëÇÌ;¯oÁB7¬SÚ\Øg“†ÀÜÎfÂïdv—$RÅYÀ•­ï‘ò.Þ7vœI÷–j\k+}°¥¼¿ÇÚÛ«YË`^‡®Äb~ý‹\Ì¯Wkeu?(ò3ã^Öä0°å˜wØv<f…^Y›•ežl–{*9”p¸žoPÞ9$XŒkDŸÈ$¦P×ÄèÏý“ºÞ1$¹í»sˆ®~‰Å„ƒ@µšÕ„“¨Óº;‰lO?­“¨ãrñRO"A´nç(øóéŸEû!å³y‰È¦(é?ËCÉœ‹8TÅFáåÐµ±˜=éŠ'£±]º¯Ì  õú(kSúŽ}¡›ÛeÙ–¨‚haË£‰-„âŒ„ð—œ4¬¹L<n½ýmmÇ¼ÝèÚªêfÔÖèv¶¤¦ßúÄ7fn¾‡üÃ³øà,©xÔ¹êvRÌÝR=TÞ5Õ£Ý)lÏõŒ©ÖßñBq ‚ê"«„X++iu±Ï“Ä²®j…,Ÿ´ÓƒüÃ_ÿZ×ü¥°“R ´—ú'ÞéÔ¶ÿÜç®%—3ø*œ-Â9ºË¾
Çã©_ÅÛ¹–61ß~[¬;ÂÅVÚÚýƒùpz:òÙ³—/Ø#/†#·ë.ÀÙo9Mj÷E•MXœÓyð§ îÉELYU›£Âø­¸ZòŒ›’Š
D×L±Æá$@Tÿ"Ð~ZtÒÛ!®Y‹í_Ù×ÐôkþwNµ¿> ÒÝ§é`ßÓÁšðã]—Ö|eóR22‚¡`è¥»Ð’ë kúÈN–šÐÔÎ=—z§…ƒtäÑqR ×éåH5i,Î5¨¦¤¡v¿ýé“„‡''Á¹ è‡ðª?	1yëjÈÂÃÑ(f#/ž€$Èé,ºžF)u öé3£
‚8OÈ‚¼ññè‚ÁaPg{Gä“•S†'ç‚Y	µ~
–Œü9ä›vâ1Ï¾Ï³ö<æÔ!Éàu„çœJÀÀyLæ‡%Y2 àò"$8Ô¿ðµßè¸>øð:;òÛÛÏÖ›6yƒ\‚‚÷³DA<èÜÏFþÒ¬îŸŽôñ”÷½\ÎÃD\qx¢ÝB7ï|ð˜‡%ñÄIðJžoäJe¬|É*ï{9&–ê®†ý|WCÌÉ2öçÃö$®a93o‰Q`÷XÄ©¦ª#_vþ+=»•ñÝ²2ú£'ÚwL­Q9¿¦¬âA¤Â+L  ±a:.5¢lºvÏH©™ú®£¾Í=]=—7û­"' ëeáûØXê\ÁKnQ9Œüw&ÊIäG,¼Ù?d\½Èê_ZßoR™™žÝÚs¬_­Åì0
)_Ç›üH†ZòÍška
¶œ[Œ?äžn[œØ“V€=`uë4©|øp)À…¹êk˜h[»íÞ^‹TØÚ«µv~û[öÛßòÿ”²ZG
§M!ÑägÕÁ‹ç©‰udyn–˜WÇ5Ì$0ÊK»ƒ×2º(hÁD6›ÓÅ¶ËãpXáÿo°7â;ñæ—²À Æ8mÆ¢ÈÑ›;Ã¨6
?Êô¥ÞE ¼r•ë—ŠrØÊ1Õý(*‚_–pê7¡qÕkOð<ªÄå Ùœ²¶Á°ó‚qä<½bþ46
šæPSØä~ÓýÅ’®·úÅ©émRV*fï//ë…;sý£[+HVÌùGQæY8¤0çnøŠ=öã`<gG•³ˆvÑ(Ñ“´Ì¬”M‹©ÑK‰äÜz›0ÔÄKÀp8¸/-7z^ð‘‘;\ãj÷ë?¦QZi¶…ÂanvóniÑä6bÙ´‚B(}°<ÇíQGÕ‚œóÚç°fFÎƒ	­ô mÉvp–MLúèô˜j9°ú3ÌCÙÎK³G¼9£ƒù´y±D¼1Ž¯}{2ÊwéGÊ(å7ÇMöÒ_œcÖð„-'>;œÓ`±€n3õdÒËuˆ ¹ó£ï:?t~|$ÙæöwPçCì Î‡ßA
;¨ó!vPç&;è1&ÏYRíTØCOF§üd¿Û=q÷ð,(T¯v‰d$Ê×%+‡»¨ûaw‘2¿r[é(©wÛû)ýÒõ6UµªvŸÜ&ó]õ?!œ{–3ØaELÜ”V«Æ¢>Ä¢ìD¿’™ürròØF wb‡ªÿæ'¥ñWé4òMxù¡óÝîPÅžO<™n}Kuö[üÒbyixÊ«s¯²¥Ä®«Å;ÑGÇ+‹æªV¸}Oñù£Á©ÉÀÔ‡Ât*bV³3©I6j7'L÷1·û§2øãDgÜ÷0ÊûSÆ<ß=Þa=Á_ÖEèÓü)£à=Þ½D0ü¢ëcW yÀT4PsÉ10ƒˆöç6PQù)Ã•Výšô²¿4Ä¬D?Ì¼#”t‘™àkŽ¡×'šŸ€0)mf †;Ø÷''˜Ïì–ì…!ŒEz©ÛJS(ðÉ(žŠbËÄxOYÒcuGÞø9IþÎ¡%:5Ñ §f4ô-JrÀkPÆÒ¡	² ‹*Û¨BbXÔ=E\Leö{'o¿çíø¼=OË®Nçÿð/þO†7ÆèçÀËaÒÐÿáoÿGö4ò}zH•ŒQ¦x_Ž5­¢òµætí×ëhŒKîrÅÛµYs>‘¤Í£à=:uLYý·¹Èê[—þÔÇ£L·×")sƒŸtk??hž£F´uµ8/¬L“Wv§P+]"˜_Ü8PŒÎo/ýÅ^-ÇÀZ·IýFKÂ3Ÿ¬•+©Æ/ÕýË{œïM„N¨Ú “Ôõ"§f³‰m]éåe a—]²sòÇÚ`»”òÂ§‚S®¯zlå»-•#ü7	½æ—»ºO=úäIÊ¢\«ÿn…åâŽ ¬” \ÜNP„„\"58§_A©ôèÃÉM"3ÒW,!äs¸É½åM©h‰[•ð”›âµ˜$fœÿŠe'‰tæua¿W”.ææIÍV)jÙ³aé3Âìfƒ:dU Éê±–Þód¥63v]æö‰dÃÊœ\	ÎŠ¥Ÿ¾´˜ZhekÌë=ZÜ‚DgŸõâºÒ•ÐÌ^ƒÄ°C%X!bƒÎ§È õœ9óãt¶Óüƒèh\©NÃ3(ÁºŠ%>Wu„;‚`]Ç0UŸD¥©ðÐOËÁæU6¡>qŸÎ¬Ò«Šv§žV¯{<š„gL©UäìöÉ˜1pàTé‹‰ö»tç€èÛªâÎñÒ’1A”=Çëes·D®w*ÝŠ‘ëÙy_;rFUÆ\a}fŽ$G1~kº€òÁôÍ
¼pJÓ$÷‹wðF1÷ëœ_%˜z)d•ð*Ë.á•Ç2É"7ÜÎe™ðrÙ‹Á·ËñÄx}â¬^ùË–ÇãUÌ#S«³øÀ/oõV¹øÀ3oõJñÌxýßÍ?ãUfñ‹ô‡P½ØvrÎÔ„R™öŠµ‹9Ñ,f<‹¤³+SGæ„µHt­Èlãõ±ufyõ_òU]Oyéé÷>"ÜÇãï9ôÑ)œ¨Â¼¢(°d	;€wÊ±¹»µTÄKÁNÍ—eöïœMÊ·(ðë%ãd’¹¯J*qlOùêÛsu›óÃh}Ò[ ‰…ÌîùèSÛ9ÈÎ«²¬p7d`pË»ÂüÞg¾;
U8y§Í­èqÈpß[Ko¼'?²"UŽmNÛºÐJ³¦>œ%QÈë²þz-õÚ[Ê!Ò/ªü3V$+è:Õ€¬ÏÐ‰,¯$¿„¤A!±·|¾¼8R‡s‹¸Z¯P#rF3>ßüŽ´ÐÅSÎêy …‰j^rR¥|nq|¯J‡[®52ë÷Úó8ß½/TéH¯änO¢›óûÉó¬+’„]¸§qŠ·8¹‡öQ‘•>V0™žIÑåÁ¿yŸ/¥ÜTpµÖèbÿÑü=VfÛ”.jä½¨åe¯Èñ0‚ÿk®þ2](ñÎµR/$fN¯Ô¥ ×uWY`¹±›e&a¼[Í~™÷’öín™æ:AS¶N©1JUþ2ÊõvÉótI|YÞ*Ü#¥Å®ò|Nœþ&ÙDDü¤®\q"¥ÈÃpF1ò	v<‡o™Ì.¸
{î§vß¡ìqÑ”øçÿET«Ðr1©îö¢pEì .nše!V“Ì
ëÓec$«À²çÞò4òqÙ1‡›5Ýl.	[ab­ÛM­•ç	Íýüt%°É+dKqeIruX
#3ßo¸ÝŽ¼×ÏÍ«Î{“FÁ|,<ž§#?d¿Ø>Ÿ—“3r˜ór4ro­b??JÞ*›S#+%lWQº‹ó)FYt‘wì°,—J…‘¥`Iì”@ÙÄ:Ï½(ðØþÔ‹¼8”¯ÄªM4^²
*>;FÁOÅÛE»)âbY°Q(^,÷jÁÌû›¿ÉáËÊú¨rÿTü¦šðÇš¯[?»ÏkÌyJ9oKäSøÁ´Çæþ{
/½¤õ\ÿPþR3œS2üù^i\KûÝ†¬ÎÜ›>‚õÝêA¢ÏÈá8DÉ4^Õçûàò¾†áX8öi ”…UÞ:Àå¨ëÛ`=¬AIÿi5·‹Ý|9R%hTO¿—ïE[„øÏÃø±·ô~xùŒ/šû-i*Ã>eY A†Ä‡ŸßEpDÓ_D®ø_çòžBÒè· TâÝ„¶á=6o=NIšò†"±röÍhÜ¾‰;0+±¾~UÜfKî•Q˜ÚhíTà ¯ÿAj]žé !³1‹£áž9î+u`€
ÿ©?¦ã¡€3½GrÛVŽæMp¥àYð¬±5ÀÑ?Š@¾
A ¼Ø«ÍÃ†¼Us›¡ñ5/áöõcÍÍ8„.k{Óð>
cßHå¦ôE‹t0sÔ¬ãWžžã¥?ƒO¤'’„×wžÌ³õ•ºmÏ¶ûpôÎ›©ö½ù; ÏGnéà3I¬ëÞˆœ÷Of|…Ét]œ?çû3·r¯.á8ò“!¤Y}ås@˜ÄÛH‚»*_ISF‡ &(»¶|’­äXLwF3•F‰ƒ÷Àzµ»W™±¤Ê„ÒÆñÂµž¹UqsYÏœ¤Ë¶xÊy©¨úêËÃ¨šk%¨›úž…óÐ]}›¡£ËÕ¯9¼8fWP/×¦…AÀ{êÍ‚éÅµ³Ø­ó@½|:‡Mv´¼˜È|9ò¯:Ô|Ù[òOßŽ—ùÓ¤ÿêRr’$²JbH.)wÒ$'«—–NÒ•E²ºÃ¯“h„‹å&¸`„ÀiùHh„)1«¿Š¼$Õ¯ØÃ!ˆ³`¸žÇ B‡¨:äHP[{Ì £ ¿½gÞ|mƒÑXAøPíþ>®I0dü»u£ùú½MÞ_é~ë‡Ñ8ð’þò¢™ì\<»F§^ä)m0Ë|Ä‡$p’‰wªmípê]œxAÄñþ†˜ÓzË‚#,Ë“©?FN€Õåk×øâ~0ïO-ßy	OÅÂ_°:oWøzNhUï`O4täÃìê£÷§> By¤{ˆ€Ù`ßùÓw>F@Âl°÷ã 7ø/5ÍêÔº:Ìpƒê='}Š‘ÿpÀêÔì+òh
tyË5ý#ÎÀ2ÍüeØVO^ã+ßŸ.Oóbô¢
=«óF×èýAöm„UµÞÚ¦ñÊÇJ.Z³k|æUäŸ'þ’=?2¾òÝ)ìÑ øíºÚ¨ú7~ô£‘7÷pÌýwB=óÇ–ÂCfuÑô6ö,uH¬YDˆ4T ÄûáiÀ™´ $~m°™ì´†¼£xðà§`»§¯\c]þ‰¿|èSokú§`åçœ¼òÐ\½õ5öãz^Â®÷@pñçñpræSs‹~ç{ï.H‹ç4lOzë:3$ZKNX·¶ï½ói³âÑ¼ƒ9=>Âˆæ#+M3}ïÆŒ-ñaÕY[Ys‡’m§¾pGS’_*ò¸•£ÜJ¸î8Þ­¢ñûÚä„šj*xö}òAßê|(È¥(÷„¡§z¡¼o†·´6dÆ‰:†¹€X¶Þ\†OƒsTo¯¯Wð%ïS×O)èás×ÖûþëTŒw­w0¯wêzýÇ³ÞŸepxÛ9Yî_žã,¤vRÞŠÜ®áâç®oÕÈ“kšŸÐy)Ë‹‘cüu#C>ùSŸÑµÓ¤8ÍÁÝ™i\ÿÌ4VOÍœêRÕ–ÏÍÎÝ¹i\Ÿð¹™ŸT¥ãê,{l–'[EZ•Ïðè|ì/½`³M––‹ÿ rz_1QÐ7–Çèˆ?ù%£Æ”ð Ý®FUë='éöÝIj\ÿ$5×ŽÒöÖÊÎÒöÖÝYj\ŸðYº{–¶·nz–šTóVS!?ŸÓô{ÀfŒÜã'(¢{ê‘sÂg’Ê©Q…pe~uÕÕ#÷½uÜÏ×¿´{Îçû‹p?ç­`ýSÙýg„ï¤Ç×ƒ˜y®Wáx<­šò#ß\a÷uºŽkð¹8|³Â’—¯‡Ê%·$î²µŸ¼ÜxôdmQoWl½rç~N{àú¢}ÁÍ»Pƒ_Kõñ0fOWüQÒ»ßþ™‚Á‡ùqàÅüÅ€éó‹ësMÕµóz¬$ã¼ùEéÊ)ÂîsøðdR‚ôíÉèõPpÕ‹¸ ,|nŽ˜¢ŸiÔ¹ïñˆðL¥%ÍQPõ"Üé·Tž«tÈønò•”çË)ÒT¥&Ój´›„ø7(¸’_qÅùÀAYÿìðPõ >Œük”WúÀ$5;ÞÓN¡on.9Å}°‹åvþÕß²¬gØ	y'î²B/¸êùÐ]Ö	X¤cá¿»ù´4Âïÿ×Ô©‰|š”¬å¹D­iŸß2>þŽ%ðïþÛßýžq±Ä¡,…ËÇ,÷ëe'ÿ/ÿ_îL$<MÒ¯æ8¡hî›Ó.:ƒ+9ƒMÃG?„ò©½îl»hrè‡¦i–>>Sü³øECÓ¹h¦K³’Ò´ãþ¾êA‘=Twà<Z†…2­'l¢v¸žÊ e>ä!ò‰%Q°tí D6AÛ[+Ma*Ú­üö©hHV<ìê¹5Êbªñd\’¯œÌBa"ÎP4nþãþú¯DR
å˜_†2…q¯“ˆ"{ß¦ðH¢$)ƒëAY•sÝF GÕc×t2â}j÷E‘çFˆ^ÄEÉÆÆ0Aº„„~±XáWl!ó’<fCdsD]&` .’nuÐ)S%UÌÍŠdê‘+;¤ã®˜¤^Ež<ñ.Só¹êW˜©¾¤¥Á’äX®¥^Ÿí2Ôç¡rè÷/Ý¶0®ëÇÖ›q8óëowŒRdo©¸Ö |·ÐRcyzÁŸ®À3:›’éòª‚fñza„NrPr“Ïfh©âf¦¦l¡HH“†u¨_”¥ÄyH4ð™w›:IÐt{‰™,9Ô½âÀ%óT`íTñlkL…‘©À¾ÚzÀt¼ô¢e~â‚{ó“PÆ×ö´øÚxó·íhšrÆ×r…Àë˜Mƒ·>É Ä?{ùBJ(ÒËøyø{1	—!üb9û³—l°‹áèš³9£cŸ°D¯?‚£$‚½?½€D‰íD–ä|¼¢›ÒÊ7m4V#œ¨1ïZo~±f>¶È…ÍÂˆ×X‘E'•(¢	u˜ ¦þ‘÷¸×Ù·©(d	ÂóKm=Úî=¾ñR°“Õð%œª’šRãƒr‰‚JMtú ¶ùld€,\¬Ëƒ°QðÔŠ‹Ôsp‡T	JË¾¶“dneO,5l$‰†þŠ=ƒI¢Ž°õaä{¬þ<Á*Ã3ª>ÏöÃéélŽ9oŽÃuC³hãšm#?Él´KG°epO€khLà#™8}Œ^4œÐa÷ìOüáÛ)ü'ããã2G”“ÄÁÑîYc+ÉaáÎ-cäÆhUÅÂfÙyNz2Tkuy%fÇ˜’³ëXHc§)VR€sÉCŠü‘¼õ*ÄüjËæÔŸ—“+ LðÙÞõZesË?i}ø±$9œ_%òs8³)ÐälY9nN¨8N§
tJà­W=M6·¬þ'6	¯kÓ-í¸E3‹,–z´˜t‰&ÄkQ&€Ei³Â%ø)XNñ½îB¤<G²

ae/:7_…µ¹ÉB ¸ÐÈŠAù´iÂ9pS l ÂÅì`#%;•[L„*#°~Ø5
UqcÉÜ b5ùimì§r™®¿úýÕo'ŒAªžØ6j:Ãáˆ³î‘góý1éiäÃ¬ðÔv‘OÑ›òŠwÃa	G6%ÀX†@‚7;¬‘ÊÇtÃÐÜH^¦cåeœ9ù©8µÔ‘Ü†ÉÇÜl6míe.Nj#ï•Íl¸gMÇi¾X&ßÈ3rN8jyZÎ$ÕH†C]}rÎÌ*åeèÂéYöŒÓ$Îk•;ÒS/…#¥ªBê¢á‚|#¸¹W‡¥6h˜ü2œ5bÕ±gS
H™ÁÕóB‹=(/ÓJ÷ð|Ëe_)ò‹:äÓ!›yËáÄc>´fáíZž™,•Qˆs¬(<ae	í1ÉŒâæÄ‹ëq3på•äoC#:YàÝ/¾€æt@¡¾@üÙ\FÁ¬¾NJ©5—±BäûY°äãðÏ‡S˜Æ‹ðPö÷…ü’½‹È|ž›JÑ©%Ë,Î´tÒ%¹¢	HsðÁ~ãÐ*WzÔ‘“šgU"Æ‰däR¨\WžÆ9m˜‘{Hc-cÿ•aØUñ+·%ÓõÏð±ä¤WXµÍÔ.ÏÖŠz4ý‚R¾Ð B›|ž†#§Fëj
®ö´2´³žéY*_°îÉ"˜Z~E1¢+üÛºã|×!ÇtrkØ¾¹Ê5n+ã‚=~ävÉD´¯0ínøÖÿ)-'{—¤ É³ƒç×´Jù†â.ò~¥J¥.4d°Ÿ'Ëèt>h“	C]JÃ{nÍ¨‚V\ o¨¼D›Á›/á|ÌÊWž‘øýæÊi\K-!ÅyÉk“éÙÂ¶‹9ó%é“BÀk5IÅç¡sŠšüç@‰épjY²œÃv©È˜AaÍ\GžÓ´ƒ\ÌÌ1Œ&I3ŠÒ^£pˆÙtˆð×p‘§EðÔ^|Zjvð¸–¿žùEÍròºÚNá+SGd‹[™UíyóÑqxÎuŽGÁìg?bäèÁ¥°DùßãÁWWÅŠ>©; –n6Ú] ®kóÌ½laM:	§RV«w-jÑC9­ÃGqy›ÄVJcÖqø8®NÙèÒ3âÕm²Ç@q‚abÃâKeåsíU*.¹„r¥R±¥“ˆ	ƒjÀZ [ãtíÃš9ŸNƒÅ#ø¾˜LRzæü£ŒÉÓ¡ÝÔ’¢Û?“¶L²r]ß¥0Uõ!V;‡»¼W\]žèðªö2\â¹uºˆhwÂÆÁ4ó2Æ°ç•lÒ´þë‚ÑE\éŒÒÑ	 $IœèþQ«æ1@¶Tëˆðûb<ô}\Uóñ”ßëŽ/­ÆÐZ rg÷Y»¬½µb™zÀƒå ×9§ËûÂ*ï&;(	nm5”5X»TxÒBWº”-Ö ÃÝI‰Ÿ0¢=Íý ±+Å$W˜óhN÷³gè5Z` ,rñtpX
i¤lNÁàÚÿNæIj~tøš¯ž¡¶kWåxóßÊÞOUŽmø·”æõâ/	œÿúç9›v#¤/ë×àÖf¾ôaÚXÓñ6e.å1!<Ë,5#6²m…ž<í{6¥%_1iÞvè*íÃù=‚Å5¨ŽŽ<CUÆùqxJ)La³Ã<;æ0yÉT%î(ö¸ sfVÈëNÖdÃý%Q³{ž5­†Dñžýòr9ñg~—íÝº2úÄ¢#öT3\ ÷rÉÒæXKðxL¹‰ÙUŽ­Bv(¡I0á~«X£$øY_†6ñ¦'Yù$>5<ÝA‡(»}r¦BCNNÌ%_Ã•êÈ/	úÅ>ˆ) ©~ŒÙõUÑ[T¦VØ·\:é,LÕW¹ýjmƒs ÎTøñ•Hðøâ_¯¡ûR¡ô7¯^ó4À['Áã–ÛeæÐ¿çØ&kcÙ&¡„}òi»iÝ`§±qMMzï=T‚2¿Ô/Ë­w“ûjN-œ=Õüä¡Þ¹šEÑ	I©í‹kfÐ õd‘Ü=Ö‚„ê DÊºG¼lZ³ŸyóÜYß…°=yŽäüá^FDð1Ó ï­žñZÝ`šgvÁ˜…£‹Ä!êŽhæEo«Ž2~Pù•ÅQ],·ü{*¿dPÈ//ÉõûÑ˜2î_Ù©\.e³µŒ$œ5Ò¹&ÖbÚk[qãü“ŒZì†O›Gx®+ÆŒ÷ìÌÆ‘wALJ¡Šïrì/’=†ózA…í¼òïI§°ø\û	Òb¸#^/€Iƒ¡ˆKæ=áÃ)OÓ|ŠO_GìãYý4ðÑˆˆõ'9Ð cšV,?å¡Œj¸$‘‰æÁ¹¿Ø Áž.6Eÿ!ß
{—ºgù2¹ßËg™s;+àÎÙSü†+ÏYáœ”l%”¸V~I˜!í\SÑ œn|Y¢”×NKz¢¿˜›Á†ÔÒý)Žª7_^Ò4Èüqµ8“žZòÑwô›?ãCzé‚Ó8mñH¹‹í
w|•¤ò›ÀWtHÛPÐ¢Å-bÂÿIªÅ½Ãúm×-î¦·HÇÎ/4žs²-rðœ_KtDyñD&”Ê§à²¨³bTýÿ  ÿÿì½ëVI¶ ü¿ž"¬©)¤)!$q±­2fa6ÝÆø Üuêóbµ)AyJRª3%Åâ%æÏüœ5Ï2/4ðÅÞqŒÈL	|m«»Œ”÷Ø±cß÷“Í/¢Ü(;„ÓÑð£×ÇïåSzó
YýÊÆF¥<½KA=¼ž
¥¹UWÌ±š7Ÿgã§Ø’4ë›µlv,•#Òu{(ÅõÃCÎ2pRˆrÄ½
í(A&½ÅÕ hè)\÷P•¬QÔúÅ@F“´66•Wø®Õ,Ôn«à>Ì8’‚ªº°W”h^´VÛiô‡A²;«6±`eÕ#0^ÐrIO>Jƒ ZLç<'«Œ.9	áÀatÊ$ùÂ{X-ºv[“±iXI®žÇ3°ÌÚdæƒ–Ùà5>p®›º1õÓfsí©áµ15RÆ.exé˜oªLÿZ]Ï±°%fD6‰QPcû*â´É:´qµºxÓd$Ó*ÊÓáÔÉÖzºÉnª‘cmqstæ–E†æJu¦úõðÿ—q#”ÑcË†³Ð?ecVu˜©ó~ØOBÀk8ä²••–'®&aƒòèS ÈƒK»U­ý†’Y¹Õ+CÏ°2²J6j´`!7.>¦­rKSÙ)‘ª­‰ÛÒ¬´Ýk›"Yãj;KÇ›Ô?å6—ßýáGõOq(R£ôç‚™ÃÉ—€ˆ[úæ×S ñG/Õ?_)ÐHDÃ°á'‚Öxu˜A5ÃWTóêû@5Ÿj€Kj"Øü›"›WlÊÓßÐN†„³ñBßþ¾ÙhµÃ±N¸‚dÁeòYîeá-4i4AŸ´Æ’r3Åú-ÄJm–eÐ.x˜#CdiQìØáÿƒ´­Mú§*CÝ2½I­&ÄQnù‘°d\]]­”"]Ÿ­™âÓb\ŒÖÊG|/é,p…‡°+#ƒEÙÐ%¸6»…ˆ0š¬WßolPŠÿóe‡ÀÕÊÉ^XŸ2C]Ën’63æ^ú­Š©€Ðcä:sÀ	ÌôøWG@Ò2"€Û‡àþ‹ÑÃpcQHÍ+[¤‘@e\Q÷WÛ1Muä
ï¼Fe¦À’¯Ó…):‘9Gy Sª¥ós<–€`­eQƒcŸ^¡(Nªd”¿@(ç3.ä' ”¢L¨7³dÆ¦Søfsíq¾ä²Ìr:`;3öLXÃMV	˜BNÃÁ3Ép›L¶ã8¦”@e‘m°,<2aÈ"Í¤ P'Ñ%E–2ŒqÖÞs%Á¹¬Ò©ÈÐS?Œ"~E¨O¡Q„amÐÅ3òr–S‹¡Z)!oêvŽtôjõ	=$m“äsê›Ü±¡Ç2§„ºx’.Šà\(®v™˜ÃÖÂÇ(d
éje·Gp¼Qœ Rƒ{ã5úxâhí<·¿pPe&›&f€õæŸÌã%fMÿH.bð­æÌð¸ë†”€ñ¥JÑ:tÐøÿJV™s±‹ÀÏ¶ACz¥}nbþ–k»_I?'’›µ˜IÕ([¿5Di'<ÚÛœà¾ñ¸¹Ü`“~*w\¡¼ñäŽbÑáh»rTJÙ[Šs/Ö¿¹é»s}6ÜÌsô[$+„ˆÓœÿPfPyn‚ý/dãÌAä%Ê•l–`‰­:çøïì¤P­’@rQjëoC‘ ðM<SÜâÃÚ½A(1BÑwíýöƒ€²2JgŒ„Sõ)ÎÃADG9ºi”ÐÉºº–™%*/¢L!ÈŒ—APrWû¬1¢B,T’@Îm2¾a?»ôÁqF‹ã“Ä)=1›MË=öð8äø€tº'/»oöþ(s,\‡¢Õ²F¤Í&;j”ãàzUˆ„¸'wÓ6n9ørN‰›(Èð-Î%8¬œÛÞÄ’ðXø§™“UC}Nd¢iM;rŠúÓO4MÍ
¥¬þÍ+4ø[gÁf[,Ø,×d¯!”-é[¥>bU8r`¹»î½,Kà©žˆmªÉf–”Š†¼¸‰®"Ú0åPTS¾Ðœèþü´»{Ô¢”±Tv”Ví;SJõ”#‰÷­6ª4¤ MÈ*º…ë´¸‹Vÿ‹R_!$¸ŸQe9{7·šCî6;YÂ@çœÒw"Hž:„ËgÞ¯®ÂË3óè°iÃ´Œ¹Ï¤Ø×´±1B¢ËBåH¶=àP†p(cJS¬IÊ’í'Óœg™ûŽØj>ò[ú¾ÒWhIl[0=ñš6š×ºqÕHb³òœÇÄwÊ~4FŸþ#El_Ù½žFœäÜ€b-D†nYpyr¬Ùx¯8&[c–ž&'­š7ÖŠƒ£XTÍ©0Ì‹GÞMfÑ¨ƒü¿Z@X¿jÊØ“ÆeÂ×ÀÌù”/v™ÇPŠ×fùG$ÈB´›íMŠ2Ú[•Zc@»éÍ’’*Ärò†@P(xìH#Œ."Ôù ± ¹”ç¤uÙ“Vn÷Å!<Üï€¸±#‡ÜýîÛî>ÞÓf»œ.W4}|pp¸w¸ûšìîíu{½öpéKGÄñˆ%ü‹Ð)T('ª½p$û‚¹
¥~¡ÛªßçvÙýBÈ®ää‚(©¨É$ÙøÊ}rUÙ+l–Q×”QÖ|§ªš%59´M1¥¹ˆ¾&ôvXÆEôDa<˜ÒúPh)Ò”~
oÐˆò¥€X*?ÁU<^¯Ä nC)ÝgA{Ç‹Û#|KõåL9v?3JÆôÂK\½UGkÑ©'Š¾ÑÏ¿™é½HïëBúÃÔ±&ß’ûh9½Ð’®£nÇQHXó®£§¬è7é:úÕ;Ž–†™Å!ä‡ËèWã2ZÖbÔtõb´eGHiýÐ.£‹9Œþpýdî¢_ÚYt_œÅ=qîá&ú…œD¿jœrî7¥ÜCr½ù0²Œ[è—r
ý€¤Œ‡ÖW$K¹~)'Ðï JJ¹~uP²”ÛçsúüÀäa‘IYšùžmüpòü¼Nžiï¥ƒgËÊçÎïÕµó38v¹u–wê,ãÀ÷‚¹åí»t~v‡Î{ëÀAùYTàú›×€û(þPwÿÛ©»—ñHü~ýÞ±€øC„ƒi·;àˆÕ _ºÎ	®žâûf{…E\'?»í¬û€2m?LäTK™.<æ÷æ„¹„æçtÀ\Úýr³½ûe	~ºH‹µ¤ãåWîvùy.¿¨Ëe	ûüBëÝE KºZ~ïŽ–èf¹¬gåò«\Ì«²b¿°Gå}ý)—šà×âK©û•Üö|*–faT´„7åwêK¹„'å·éGYÆ ì{ñ¡\ÀƒòÞ)µ?ïäWá9ùúM.Œéîã3ù]{L~Oþ’å„÷ñ•ü^<%?™Ÿä’^’å\ Ë(¨nÂÑ(¾"”)Œ¦¥"ºåŸF¾@ÎÕ/«r•Ïö]ÌN[ìRfùÓÕV[Šh@Ö],!ok	x×¯M2»HÆƒ/´“ÿO.‘YoûŒÞÙ¤dÀºwU-Í0«:Ödæ	©<ËdÐ=žßØ¯"uÜi×©Þ$\Ñ}¾eˆþ0¤G.@›ÎÊ>y.\|u_ƒPhQŒ£Á`t5-;E@JþÒ÷S:0¼„âùlŠ¹ø("bÙpy†ß†çî»ŠaÝÐú ŽaSÁ+¾&Ñå¥f…
®žlºþ1n¬&Ð@š;tð;X'Ðï¹x„¦ŒbÊ.@þÁ-M’\s3•[Ð`™ÒxD–<®òü”Â#rÌvû¤aô£Ã¿‹sÚ2i°m"ä0¹³ï(:g7ºÌa¾(:ƒ¾iž¿¯Qæü&föýyêïÂôñêü3$ý˜)öÆFÉ£mÁ4XpÊJ·›y"éê-?ãiã"ÍÀ—%Xg«rHOë0H«i#0þ£”»éÑÛ“mÐ«h‰ÙÁ`¥V“k£m¤C&1óE©y¯ÿºzî'ªð=.ôö˜[w ãÇbcGi _(Éé¾¥MkB4M['^È*-‡«LîùÇ›†³*6S?uMÁ½'8²‡kçÜœ<ò÷ZÏA”ÂYlœ[„Å¦{µåžé-5
_†ôB¥ëƒÕß—¥öh‹í=’ ¡FÝº$ÒøS¼‡,FßÑ•âê©PDnN5~…‰Àâ(§þM‘ÞX­MË¢tÓvÀqŽv HCÞã)½Ï2®ÃÑ*ïÐtU¢>š"Mé
¥€dÁZÐ›:HÉÛýºÂa0Ý”‡ÂgÝk:¼I0zMþäôXkÓ«˜Í	‚ÍþÖ¡«-±ÂyÓ°üõ„W5ÀÏ ®Lq8º¡í"yHi^º°`š1Ši—äœ’oàËøéx‚´ož$@_Ñ¡‚íiöªåáVP¤… ËG }¶Á«ó:t<Ì<²?Ÿ­cXý†|f?©ýöÓÝO?]Ì'}&¢;1÷âÉE£ôÑQ<FÕ[0“I•ýh~SðfÅ¯`Ò§¬ÅOw”ƒ·Êwž\šõ(‰® ãh`´¡¿ íÕÈíODh]¡öLMCXðD
iÁì[¤±›fšÆ#2¯[êuxÍ|Uur$Ý²°WùTrÍ³bIgR”3æVSÚÑ€Ðš2*c”:‚«Á†!÷4;scîxøèðO75«¿fÐÛ†©ž¶"¼RK«ÑÂF±Få»°>.ª°@Ørp™c÷)Ç­³pš=©mèS.b‡Xqíôd˜Ë'¥é0¥ÛKº-Ø]”S
Ë4Me]qðŠóÕ-‹¶}všé°­	1ÖrÎ?È*ÚYqÂÈ-« Ã	ÐTž³“/„;ÏÖ†m£Ñ¬ˆ‚î†EÆZ&Ö<v“ÜÄs’Îù—«€¢eJ^$á˜îŸGÑãqD™Ø¨¡Â0B H|<fˆZB™Ç9F)ÞNÇõƒÉ$ž‘óÐ¡WNÃXÌ©•j†‚¹ëeB‘ü0—ª–¶eñxœL1í=8ÀqR(¥°AråQº“Ø,wÁG™• ß–æ–²±ë—½ß
'È.ƒ¥fˆ§lKŸ <„öüü³ø#Lëä0w*÷»Z»“$vG#ÇíJKØÁÛ£ØbV7.Wí^„ïQJÑg?LSzÒðªµ*S•÷F#ÆMë¹híÆ;b ó¿î¸Ý|˜x<È\Àúj@áæŠêw³u7_õÝ,¥qš nëAnçÞ4Hþ…©SÉ`ƒPEÄK§Ñ¤BáH>8§é‡•û\îšg¥ë†gˆP$nùtñk~Ëgi™†ãÈaiä½ôC6`Ý"VµGæäèµ¯£;yïOÃ	KÇ^VÓ=yØ~|Aé(úÝ•yÂ¨?ÍÇ@,`Ò¬ñŒ"“)cÐå}ª±çRÊï>dƒ×ÒÏC_MÀo”»î„ü¿ÿý?ÿ]ÚYCþ'UJªYØ¡ë‡ež3"é*×Õ%%›à@Ã1ì,£d¶Å’ÚfÜPT„1%éþ&\@P»Î Ñq‰VÎ˜éKÐØÓAaãô3£ÕëÑ‹çOz'÷ÚH¿Ñ¯ ¤JÂiœÌX.+Ðä§s­]Ëá‹¿*bNIštdQ‚ºNsÎ½›êsÊƒÊS‚^“×/A">ôºi®ÿ¶€­ôÊÞ Làµø2Ú‰­®zæ(¥ƒ¯_=„åýÜ°g^!à.F|“°‚‡ìE|½]iRZ£½AÿïV»ô£¤?
|‘Ú›Ò§´Úôïû›Ð?èÇ•ÄÒ¢\>‡¾aâ)’Ù®lxôñÏ¦Å6ŽîoŠ	˜­¶+G¤Õž't*ÍÖ“Õ'ÿhîm6Ö¯Ão"¾µÚÃ¿Æmú»ý´µû¸ñt«MØ¿PšxÕì7Éz£¹Ñ¯þõMZô	]šu(¶þd´¾Únlm<þË9rŠj?^º6
.0v=ÓÝm4n›m¨á2Ò`m!G£î{Ws†ªîx””^€Ù.ë»Ç/
är€°L‘à\{‡p‰úoŒ!=•ÎÀãËQ|Èvhöíý¼L=Ù5OŸ²/¬ù^ð1ìÍûp‚ÌN²<š1ìª6âºh=38²MÞŸÕµa©lu{À½ùŠq\ý˜^œä=£•PÃVj³®ú}F{™§aì[Ÿ1ëû³çU>à†¨É; @üþ¬ö›j=Jé˜P6K›>ä?ôv«Á(õ*a’ÄÉQÊªtù£J¥BËË
Qúòéqò²Õ¤E˜i¹ËTi¥ŸÂ‹
µšZë¼”XÄ×`å‚C9¢<}•íõ-‚mtAªr{~ùEn•Ðå<'Í/*Ù]YFèÜçç¨uŸŸ7xÇ‡“l4Àµ"„1ÞŽ	-Vkb¾´Q{ª9KÝÜÕÉ{1ÆºÕ‹´i<ÓwÃŠ¼k]amÿ…Ü£‚É÷èKñ%,‡h¶¡º^Õgð1ˆFpé>è@Åö
ÈìŽ¢ËlF¶É£ÜIü&Äˆ$@+p‘cÐš¤ ö(JOåX[MC¶v÷“§2¡ÒKWW§Ì¹ÛjË,ádPn§aÊž/Luº—„«ìNõâvéÍ¤Oª ËÕuLÚ”4„V%s±êÒbˆ
Î’6(cOq¨†ßï
Y[#»¨ÏÌ§#P°Ã…)üA‡F¬¯1
gd6Zò¨Ò1˜ƒâ;ƒ£ÀUnÌâw@\îQâ’›ùˆõ1_ÉqiPýÈìM‡mŽiy·”¬„t8jÐÕÁy|à3O×~F¼tîÖDÅ²[Ñä$¼âÝíÇ}ØÔ« ¢G0 ?«Vum@#átäìêÚ…";úÔ±§Y#žO;¤r~ŒRÊÎþl¨÷¤” ¢—åƒ‚@*´ÆÞñI×|- ¡CÔ
¸M³zoX9ÍÂ€nHÒ`ñn¾»ºú‡ýhoêÏ§3ñ|³i´¸ËÏ''¤¥?B¶¯Cž>}j<½¸ŠHÂdLi¨÷­:i×ÉzlœÉBwÚþf@Wß¼,Íô­·é[ÝÜonÃì{ÈÀ€»#Ú¤›¨cŽ)NÓîUQ·Ÿ"^µÿþ›…á¯ˆ!OgÊKé‘Ý=)æÍj°.YÛ™Dtõ=å¹ì¹Ö- ¦Ã;“Í£0™U?¼	¯Èéë.éMÃ~Œ¢¿V¯ü|+ ÷®Bo°”œƒápÊÈ~/Ý †ƒØ‚±!šD1—°7"qÂ—\
wÞ‘>ŒT)Þ¡5njÆ½ÂÒçÕ
^rb5¢¼FÊá›‚&½r“DNÈ¸(ð²ÁÑQ²jÆ9\µ‘º9õW±¼î2×:0Cê"§'î„ŸYã NÆ€H»Ê!¢ú î‡Á|4«ª»üW<ç“Ø]6 7Nî%ÆÀ>ÔE=ý~gí/.Ùn]f¸°Ž~Ž€(º%è=ß·¸PƒWƒa¬.	óé€A€èTcËÁÚþi°H¸¬hpD÷‰¯S±ØjJËeaüCy¸ºq=ZN{Õ‡«ïŸ¶?ÏÊh·<>° ÛÆ–mgcëõÔ"›ÍŒòÑÒê,`†óÔB^×§Dd4÷¤­£óùê ŒHÛrÄµ;•-O-S•˜×ò•+	¾ßÊ6ßÖÞØ²¶­ÆhÛj[Kë±€åÇ3áÖnf¯‰¨úÎáHÎŒáô¨Íð2ãá¿$ß°Ø Š&(ƒfÀŒgq+ÄlYÿ”,d¯ëh¦ÞŸ„›&3¶ÆR€PžCQâ³áÍ(ží‰´Ç4ÜxvËa<+'i‚@ÀÌàG·J¢X¸6ºþË
éø"°‰Q*œTvŽ¥|U €1ÓÀ[Õ^ú™¯íˆÌ§e¡É™ÎémêÖ4äø+:Õ…F('tÞvªz^¢V÷)ù…Ð•Â°§ñì«×,"‘âæÉ<1ªÁázâr‡tAyG:Ltã„¼›˜z›ì‡Óî@³¨;Þ”|(¥ƒ:ø`n¨ÞnpOxG/Ò)-Juí “k-ÔyHñ@ƒOF7è¸ÉßÙ^ÁRÌÕÖÈ¬Ö4ãYiC”¥Çnw£®ÖF¬—ƒKµ‡QYfÁlžBèÆùxâô]vœ7vÅ{<1Y>F…|„OAº¸SdŽwÓ¯­†ën—-º`ÜR\p¿kÛ­CŠêÊâ0i—r¸×<(±e»²Šw-FdÊWé{¼nƒ™ÑDJpÑêIn<´Ã‹?ì¨Ø2¾GvñU‘WÃm¿ë¾\åœa¹5èa3„üTÇyÊåVPTtÍ¡d?–Ä˜a¨M9ý÷Ñö¶Cì/1îON_Ó;iR±°‚à0Ío³Á¬ØãM›YÌo2ÑÓU9¼#EPGÏ<ü –±ýÕ?ùi¼@âmäÂÄq­I7ojfóKï?¶ob—4J€Í‚ãw zOà¸&ö)çG±ød¡›‚¥»Y]÷rË2UòÍ( ×¨që°øg…A‰rî´ïô‡¨ÙÆàI‹þ}0Hºœ'á@—ª¥Ïãh}nñH<xúäQG³‡TKL]à;¶·P–ä2T	Wüçea´/ï6fArÎØµ]€¾ˆ©å"-Ö0:‹––ûÛy‰²ëó0Rf×ç.÷­C-«ûq–‡¯=o¼x<kä˜K©µM?ËÄÄŒ[æp÷éÍ
:XŠÑ´Š$[k7ùÞ—F­Åó†ecá×2¬‰îHJ©õ4NVyl:7Â÷ÞÜñÑ";Z•ÊóÕUq´%õ®i²ºúlUñµx›gu€W²¡çÚðÆ8˜²×þxb¬†7Û· Îw#à¼ F·)—äÐ/ 0¢äê‡êÏüÇå¢YZû è9ai‹f^óD¡£„4bµœÈ1tïHœ5¹…Vî_æf8NÈ.eö~&wŠë3ºOt=T|Ï×pøì7°æ§Æn9&½›†'¼‰Ý0K‹’8ñŸÁLå¤W…\é^øËÒê	‹Bƒ³CÇ 	!Ó3p=_	D÷Þ»_€vŠHÿÞ=ùÃP{{
½}wÚ=!½?z§Ý£éuOþq¸wøæeqÝÓîÞ«7‡{»¯ÉþÉîÁi©:/Nº»ûd÷Í>y»Û;=ùƒ¼=9Þ·wzxü¦Dåîî»Ó?ÈÞ®eà,¼ÒíõŽvÿ^jXÝ×Ý½ÓœËá›Þéîë×»0$èÑîá›Óî›Ý7{%zÝ}I[y÷úôÝ	mjïäømo¡ïC÷”?c—ŸEî-Z\Ý[ø£dxêÃÚüwX©Çeb8˜Âíedx["oZû	^q´×ml}âoøÞdA-e}i«Ù¦Iæ¾ÃÄ:àÕô"ÈuÐ‚&D§AÃJ•U†ûË‹VFB¿eKè70ýÔ¦˜í!}kKˆìm©ÄÌKQR	àep-ù¿#•.,#üñÿºW|—¡{çùõ<Ïìí³µázùh^¶ôV†æŽª¯MWê¬Äƒ'Oâ‘yÞZÆŒQÎ˜ÐÏ1z·¿…cN%àÉ¡îcI·VÓ>Œí<Hð|!ÿp‡{ˆ~¹®7>§1TÌ¬tcŸ
®pÌôg…ü©§mÉ´ÛEûâã¡’=Bn¾¹²îrçW„ÌÍ‹pˆ­ùåæ.Ï\¯È\šMçÉY9äï@è«<Ô¹sƒz5TR”øÎ­kQ'TrúÖRåeÕUó€¨-aE9—äxïôi¡·e^W€c]¡ü*~IWòó1å‡øõÆNÏù;Oï¯(Ø[4^Å ŽðK3O…g+` ê]
/ääL3_¯QF«aé4,—W ÈÕÒc¤ŸÇNe6ò‡~G­˜±|pªüœ ¹¤¢ÃŽyV¤†à±Ì˜Î	DÁ¤nA&Ðˆ	ÔZ÷F%Ëç‰áëXû’×“Ï‡lîBú‚9èQ mç¼„WÏ^ÄñŸðÐZJ&AþE-“ÁOR½‰•Ó‡XFÿYÍÅ:fxh™Ûã1&?\ 7Z@u†ô´ânûrx<†^‚×„“~ xÐŽG^ã;åÌÆ®áò<F®¬ûß›ÁPbøOÏQd·ò3°|‚’£à¿Ë0N7DÉQ G¼?ñÙ8÷À¿6B³¨-ÃH—0ßÅ¶3dÃZËÖý`(~0ßC¡iFð^~Tæfx†ŸÎJ1×¨ÈQæL*Ü‹N¶¬‹ã±ÉZ0ÒÂÍWÂD½lIp¼sã‡Q²Í° §”Ñ·–à;ÞŽæ"ÒY«•“W›Å!¡½å%™“²7ÝWÍìAš–½LàC–°ù™X’Œ£òü »_Œ;9ªŒ6<tëÇŽHz°ñØn&¿òé¸“Ìƒ}Ít¶ºIüÆ†ŸQ8°„êhóô”v8—ƒM>-JháHe!õÚ¾`²›ÍLX±–åK’CrÙ[	æÃ	¹³OÑÇž½ŒyæÏKÌ¿Øn  ª~v½Ë#ðøxà#ö›`?5åD!Ð$ûFoGŒ2‰Ž¶]…ômgGH6;|¸;-JVD3tR(MbÜwz©ˆïÌãÕêë`6£g~î³€ÅRz~­á®|Oaù L!^’yüXl[¦ýéý±dð&áŒïd”{˜:áê3QØt:^ïæÜØ÷Ù‰ï°–Ó§ïªc
sCmÿòQRwš„)íq…P/8Ç¯u¦’á‚>Å"²ÞøBÈÅÜ‘í«º#g×wG‹Ñ¥/sæ9œ"ƒwÑ£¡/¿z	»`Êbgè48ÇÀT»â—$kå<H£>[	¹t+Ï«üyíG`©¥KaÞ¨ÃÉtÎêéJÑ/Ï^½Æ§<9òó*l©O¬ŸÄÓÃqpö’>nÝžöÀâŒC…lè'3¬ Ö<ˆF!3£õÕécðüefíè#i	G5ÄÐiÖ£÷Í³ß¶3"n(Ê”ÕË$”þ¡¤×6ZdÁ`Oððñg¯ñdœŸònvô”ÏGFÜk-ò¼8äôá‘“Ì` wÆHàÏn
8èÝÉë*Ìˆ7Í	äCð~újû¤íøv¼û›ßƒw?¥€dJÐUrdƒÇeüû]L©LµèðµæÔqVT"¯@y½ÑÉ?Hw.‡G½!füùVÞ­,w ¿Ewè·K–v]ÊÖEv®l‚ÉH¬Ü}¸{þÚ!‡“‹Ø'(5;í*°)jmÞžŠLóp8y<<Ð‰B¾ÞH
¸gc%<±M}À¨‹xì Œ7ŒO…úd+sÚ]¥lé|Ù‘žR–Yh2l“ÒÛ2ë\
O–‹ôÝoüÿlÈ‹³ßæÈ«Â˜xÐ¹b«)åÂDiÖàp¶à%è_Ê#ŸÓ+~œ»u•ÅÙRp» Gm#˜ÐË©*\$ŸPÑ§»²P‡A§6x¨èFÊT‚cÃèg =È-3ûBÓï=¾²2–¼/çµ¡âB$³É,£]É{d^½RBK]\)·U:»!•qÑ¸)ŠkÁ6R¾qÈ£Ò­´6ZôË'Ã©HÅ+%¤õúÎ{åÉÑø’¤I[kåŽ£ÙvEAHË‡ýBwÌ]$º¾y	Ô­3Fæx4§T m’Pˆš,Ôà*Û@ñ´ebRþxÑMÓDK™äÃ^¹.SLóõBÏöüjAZìóËœHü&ÄýŒ·ÊW–åéŠœ”w¤ÎYQ_ÆàìüAÆî1Ú4÷WÑ ›®»’Kîó5$yºQWF‡Eú/›œ;?æ"ÖÜ!?¶þ°P¾pS¨—+·´LçÑ£Ëž¯$ZØC=ó8\ïº˜ .–Šëu^lß·…ërPnvNñƒ«JÐï‡SŠ»"(ºö?\èW[fnj”¡¸t,ëÓy¹…éúŠp…‚»H–‘fcRðp„`[rKÚXg.¸š’;ŸegÞAP$ƒ4ëô¢<—½§u]z¢c)ÒµLD-»â#TÆ0ýã†bnî‰‡Ìµ%^M¨OGU‚.¤C-ã:´ÁiÄ¦g‚nù6dœosV¶òI¿×ÅUÐLŽ‡¬ÿhP†þÜJî)…«pHÇ&Û•°qÙ€ô·ÙKæ¹+p6<atŠ˜wÍ&<&
1„úA¹…h³¨îtH?˜b„¿0jlÕ”©ÕîŠrz-r¥²<Z7X²iÍ]Cÿ!.°¦2<÷]7fÛÊºñsUØ8Ds§·«3WŠÛMüË‚äA”|n˜üÛ<ðØÆèàx»7<ÊV~ ä7G”4 \ñg…HÊŠÏâbãÐî“ª™@ù %îy÷zÖø|H2©“ÃÃÃb ¤m†t@±|˜”­ü Ér<XÃ*ËËh/ølËÅÂÓ¯'oHU¨|(ï&á¤r½{Í{6Š¸Uß¹ÀjGñ€™ÌÇaõ]¥’ð_ó(qFƒ3ÈÛ$ç„Óµ	=æQpŸ„ïãdNA9ísÂâ‹(™o>8Üe±ñQ0‰F«¬bçrH÷€4ÕÈr¨ø 2 „DN« „óŠ_Å”BØ’0M?-@îÅãé(œÉÞŠ 2`Åî’¼…°þ˜óYL3aò&h1èõþµaV§]‰?õóƒ`6“•”€=gÛ|²ïì8ý®dv´1¥'ò9 °ÃÅNR¢¸‚I·¶+Ó$É¬THÜÀˆš‰•Ù«=ºLAŸ¹R­\°ÝéÑæjî“aVï¨º†ÉF…C·fd[`Å|ô:BàjöBÐbo9ëëE<Ÿ#X³NP’T'Œ/BJlòYébáŽläÇUilö·QŽâï£Œãå1Š¨û£dëÂ¹ø0ŠjäF16ûÛÆ(/çA2ˆ‚É÷„S.Åœ–Â*ªö¿^9¼ “XäA.äœÄ"Ý©èÍü@+Æ^]h¥"9AkÈx’£ég/íÎ'³¨ðŠ€¤îàRoN‡O¼~¿M ‘Ï„÷†a€ª¢cix8pv<ÊUè2+d%þ
â5“½·dˆ…Ið=€îó< Ï‚xói«½¾±¹õøÉÓlqÊûlLlH>ð.n£•2’«¯„—Á±k_2E	=8ô.@¡r)¡;,	ÝÁý™ã`V2]ÀˆR9à8‡G&g½ô¯ÆÁÌŸT€õ|Žs`Î“ûô+Tñe`5fñ ¸ÑkxËóÁÒ²X§Açt0¸>SŠq•õm>Íïz¬7uÚf;ü‘¯X‘1yFš°gô›h"Ûdó¡Ed“ìI-/7âêª¯O_ô¹‰ôKc÷ÐoÔ7tw#%Œ¼C!ªMwxGîô9Î$ßFú$×ä'¾!»ã èròïÄZ(¸…“–BÀx<¡%µK«c}`¥eïF¬ýot'.
jßžaÆîåÃkÁïm}þõ¶ŒBs>ƒ·¹UR…zÍËû0åˆ’ï©ÏÌf…,8E°+-“x°_…ƒüo€î…×~päi{
v7¯qw‚Q¸ÜÓ¾u@W:HÀz{×)u33-ÁÚVžÃ¿y)e¬Jôö€jì¯¿¢/ÛÌ’×¿…“}HøÛ‰þŽŽ¤¤úç¥ß®Œ¥(‹`ä6þLgát»Òl´ŠmC¯ØpîczÅ]cË¤oà(-mêvÄû²ÐöŠC[üU@ÛðþÐ6ümlÏ–C’Ft+Šaa¸.uzÇú€µ ìÁ›9å¬a™(‹Ã2–{´Cî^eôAå:)ÕS,“´;Öy5?9gÜ’óqT'Xú2NnÈÙ¦o*}qtXIŒâ`VÕÐj ½Y'öÛ¡öÖ+á1¤h·IR™þ|KÜ‘Uòó­Çd3] UäpÒçf+NùAÍåÁµ¾_§ÍœÏâ¢Ç’Y‚ßv³:n‚ÇØŸêkiÚÙÚ†ÚQnýùºˆF'°ÚÜMY›¬¹¼T«éÓâ½ã| 6ý<¾v ßh°]¡Óœ¦§°,aB™ÙC—¢©’Ìò JÁ(’¶8Ymi€Äût^€,m’!ýO×É—Œep’"—»i--…µÌ¼wCÃÙxDçá^½2™5x§9©5 Óºi_ÁX
æ!»$Â5%J‰6Š<×ŽÀWý0µÝ‰mÊ@´ß´c%»õxGÁdŒzÑù®ãTâ$´)+p8H/, ˜½?»ËÖÑL@&á-é1QMu+ Ù!ðÈ¤Û"xêÀe,Ê—cÊƒ1€ABKo•—2.§l_ÖYX¿'‚‰jÕýÝ–ÁWÝQtG£hv†
6Ÿ;±ˆÐ~¹Ë¨ÙÄ(\á)¼¡·râiSÚrÉh<aC\™l|Ñ®ŸŠÀŽÀZ9µJ5å©£â:WÖžg3¨ºSâO:‹®d‰ x‚'Èßõç£ùX8žé¹qpÁåêáÕÝ±Ô}VŠdÂé8#^çñ7·J$»ñD0ºu„è52Üx(YFÈF©\÷mÂÈQ+­™D"µF4éèÙM«"E‡X5â:>üB0’é5€ÃXqòö_wÜö?ßj“`A
U‹L–©PÏ„å<&í>Vîrr™csuÍ|¸óÇˆrÅÉoz8U'‡—ŸB²EÿHÂD-\^êbÜa.{¤ú`à5H¹¾¹Î
ÀËÇùÈûµtKE0©>!%º°Ö ö¨|E‡^,3—ÙM’à¦š‰*í¤æVßj§&WûT$dÛ †Í¥¨_#Ù´Ô960çGN€³üL>ÄÝh%²¨;ïÞ129•Oàäé‰ÇŒ³.
]™âOØf%ªú3Õ
Æ–¿ˆ9R9‚²Ý².ç­P&ÉñQkY–+z£e%›qqá,_eÅE
ˆÌä’]D—s êAcŽ7¾ˆ«¿F®$HCúwíÞÑ×ª¥Ò©lø’¦ŒgÙ¨¬÷K”â¢ëÍ²h¦K:ñõeJy¤²9”O–"‹r¶"0²J”"—`½Y>U
PJÙsþÛmge2¬c–«{aYä|‰2sš%fÒ÷Ì¥€¹TEnHnöq¸4Ó~ ÂÊ&üð‡QUeö‚d`5¶}kþ¾“MÃ	°;¹“Ù@¶oÅ7ÁX«œ ”–•ßIªÊ‡ñÔcÔRºßŽ¦(NM ¤‹J`Ûð¥zòa «ü­žŠÂ¾&žaø>È§€IlŒ&#^gÛhÁ<E½Ðw”Œ„"Ópð‚âò­'IY>¨¢ÑÄW´ïI;„L¾¡>w™q"ºÑ<d²-èU´ý–ÏËæÂL„—Ò9eŸÿ…W,KÊA?×ÐˆN‘dŸó§˜-†	Z(MšW\ê’êys°'þäÅ|ô'{ª—ÐZãñÆCJ÷bøÆP@]”ÊÄÒ¥¼™¡dªòçìié‰h?ô~ž ÷ œ›îdÀÓB”Y§#0žžÆ——£ð€WàƒCâ²žwi˜hÙwÂÙŒR	©ÌU$–RÏºã\U‘áGK¿c­1=Í‘,f$R+Ï—¥ö1×VO…(L¥+šc‰”gOJíÑÔ)*€ÜJŽŒEúª¶1,ØžZÉQ]¯™´IÂK‡À¿Ì°Þ†ÚèÌ*b®¤	W®¤H&œ‰©dáMKää »;éTE¼ éY-{®oÕ•™£Ì,T
¦UÚ+²Ùs3”Ì”×2-M(¯Œ(D ,¹’ú¨ŠÌa¯œ_v¿æ0;š‡ßœtS¬®D"ßéù†¢´÷ªG¶m ‚;Nf‚2Þ	£ž“VÓlíSá_>‚ª5"\~ÓÀˆÙèr`¥L>,mÜ2‰[Ý¬¤aGÇYFƒš+K–µ*ÜJ¿28ÜÞI#ÑÕ,úÃ0ÙMÓèr"‹øv‹ÕaFÈÛ¤ªƒµ2M®TjzNÆUú'~_…É½ÑU6¨¼”a˜Þ‹©[Ô ‚)vëÈò¥íÌÌ«•–œ,l´1Cºu!&Œ^á#\‘:K„¿ˆxà^W-‹š²~ßùª3H‡ñÕë¤f˜HL2£ÜÖG	ã‘cÞZÚ2hèîd–Ü¼Š&3Ì]Ö³Ÿê	Ìª¨ö¬Yìõ{öãdp‚a»l(óÆÙ˜jmVÄ=ÄýØÈ+í#“ÚsûÔï4ô&˜ÎŸõ@kv/.àœëûmuQ²9)™ÒìÖ´)°›Ø¿èÐÿ5“›jP–®Îë¤Âj¤•Z\Ñ}«ÑF…¾ÝÞ®dÎ¶êD’Áà1÷Óê¿èa†“j:	¦tcf&iÎÐ.Eîtvc:ØpPÃæ‘m£èVÐö)’ÛŠ€.`¶&:%ŽK"kKg{òdÖÝSMo^‘ìâÛ]­Ñfýa5Ls®0z&ôEœT+]øC.BZÈBÖžP´$Éö]nZEe’Óp1¢ß†gvÉ„ã,ã™AAE4»AVLžãiñÁÅ_‡—”LÊ´ÂÍ Î2R‚Œ-*hEn,‡¡ëqo‹HR…Dî¼ÉßbÊ s¾FðZý6úeøä™èÑýSŒ€ÒWÏé§z{§O›"Æw“4ø¸$„!ûiþˆ|µX÷ÿð!87ú“‹<XZ†!…ÔðJ¨Ø!ú£n&¿"¤6V›>ß/‚ùh¦;º…viýƒg=¬üÏiOC2gƒá¹©ûlL°ú&ž'1:_äÙMBxL¹
&à«âÿáNEõÇ¯H£[yÊÄ—+J“ÆW Âé€à;œPB¡rŽ3ãLéÍ®ˆœ™Ð_âRðöÌ^°d“âèg¶É8ÓQÊq^¹ÔT”¾DF@/m±qv=)šrŽ&*‚b&Õ•í‹^c™ÚQj¾¤lCAÈ¦hÉÉèŒ·I<Ži+XÚxuÎ‚ˆ’+ŠB“tª9ÉÖ´ÖTcÊŠÖU˜&Ù«­"r˜Úú)·&í¹~³Ñ<¡h±5BxÄè²exÙ©h0Ž/ Òî€d˜±FÌÞàD0KoÎ{æ$;ù-Qn÷}«NÚu²^'gpµ+&WêvyŠ\HRÏSVs[¯ é‘æ˜‘gÚ’-\hûhËÜ+&¥5@ù‘Ñƒâ6JQa²ªÚà™–¸ô~îÊÏö&/_²8!†frì–ßm¦¬PÌrêf õÃÅ¸Â:âo4ŠÔlÒ›kü‰U‹­+Œ~¥°a_÷!ä+x?‹²¶³ž•ø¹AQ*P|Ï:°Eù}ãØwéM³3^{WìkÙ9ügm0}m`÷õk>,%~Áû\Ø’°ˆ˜è2Û‘>Òc6Ø‹çð†4Å–*Î>Nº”u0	Ñ=¸{rDÛ\o $8÷­z»¾^ß8«é‡<Ë«ä‚"m˜Ò£&>3
7 êt¿ØsØ5m~ýÕæd»úRmoÛ –õ. EM#™¿×©èFÔ“º—E²<‡kÙPbuCeöŽ'Ï»‹2uÊ]@rŒ¼®Ø¦÷¦ŸI‰ZFdd,ñ|¢H.þ~w2Wo‰³”Ÿ\ß÷FÆô%=A‘ÁûfÂ×ò;cÞäî=0¢‘Â#öe7‡Ó”ß{[î’N<*¹Olay[Ú u!¬fc:O‡U{E…¡Q],ª”: w8H¸‚³"Åìöšr9F·¾e]¼¸9åRþ0¦—`‹Df±ª·D©¤~ó‰’’îH-”ç´S±8­aªø´õëúøÁâ·Ÿ¾“ ÅGçoA˜q‰¨Íx?;ãÐdˆ©pC˜aÝxá9£Œ¾Y¼þH—li×’m)¤e
™Å˜s‘Náµ­CÂ‡ùŠ¤aUù“)…€,µJ3å‘œ³Nk©_åÅôÞ¨²JZgÊœ9oCŠ#x^ÏJŽàY†¬£ ˆ¥@¸¿ÚZt¨¿æ5JßÄ3/'·“93Üè`–WQ?W9mØüˆÕˆ‹!Æ™Pâò(‘ÆñŸUNoLq[/N Í|MŸ¸† oÎY,:+‚\FuË>3!Çó*3Ì·ºÇ”p(eFhhKñcJ9‹È
¿FÔëUétÍª+«+Æ-%Ë‹Ý€á­;ûQÀ•BÛGgÒÃÉL5ò¾iß¨4×™ íæ*ß:ƒP\-k*tëèu5 WÃ€“Ü$HBÁHcJ¾%+)ö‚ŽŽªÃô½oÀÏêE÷àø¤‹Ïy[Ð8A;zW£A/ÇÕÌï”	& Ì•C˜`ÍbàÙø®Æ(CÐ1N”/Ô˜½†±$Ð'.	î‘a'°#€«ŠÅ~Çj›ÖJMø…(Ok_½©ébEü³þÜd´–èÄ_†3ÇäÖn`ëã{	bÉc´Ö¥ô_åoóIÊ ¿ÍG7ðww~9Ogð­Ng!ºóÓÇýYÌ¿¾‰?ÊÇûa_~ÿø¤%ØÈAxžˆïGAÒbËÓ$±'7•3S<ï§úÚÃ±V‹sÖ€"ÕjP'çµìÕ4pêp<Îñ«\?	Ö¾ªñ¢9²Z"ŠÀ(>>¾ µñ!Tw¼=ço³Üš1KL!)Î›=e4r0Ö ß>Ìª	sìZÑÁÑñ›ÓWÿ<|³¸×í½×*âXÏ²@E%È!D‰™€ý6
¬šÔQî³¸¯ª‚<*¥`ù5whŽ°…øaxC®BÖ0 >n\¸ Ä5x¦­Ú+Lô…|Eq¹BjÏ´1ˆ³,‹ªH#“TÇï®æA¶ö@¢í‚Ô‰5n^ð[¦È ê(¢_+¬-P²c	ÌÍß2¥ä»Öo°oç3r>
&ôJ8Š˜ìJªÁU¹óçØtuf!H&(‚¯²š~É‚fh!N“©¹I)ZÙcäNGò qpÍTt¼­’‡	VÂÀüfFS*¦*ù1ÿÞ¤UYHgJ¶8ÈUå=–<S5gû1c­ÊoýCIÛ•ßÇH¼‡Òg ò·wÎ:Ã =	®€Z4®’Œ“?SÐÙÐÓ+}ôP×RMûÊ O˜6õkÏ›p3ùh<üÐÖ§aÚ`þz¤Ÿ¢‡t>ŠÒÙ'hÐK÷:ó–5û.õŽ½‚­åæêTXl: AcŒ>ØÈ¹3wKˆ ?6€„ƒëªñ¢N2QZu3b‹Ë0o†´€ºÊ¥¯ióLöÌ¡íÓ)f•"zqÓ+ÆœŒñMâ+GˆYƒ¡ä·-é
!kE¤.P^Áˆ«Q;ÀH§ŒÚY„FAªèA¨£3M¬ÎeYA:#¨¦-ª¾Q–ø\0Y5%Iô-úƒW¸Ñ±Nß"vø~ÝÐ[R_}¸[opOõ§ô `ïÏ¶³ëoC#Š×Ôô|"6ŠÞéíbÞz5Ê|Íûô¼S€ª“>wýàÔõ™Í„¢µU«ÓÿÔ1’_86§sË¯ûRk_rý=x¾À<÷n…'p'Œ)[GÖÄU™ÝØüM­ŸBE|Ìr/ÌjuÖ¦:Ón¡	NK˜n »SÁæ×öÀ}0CKd…	¶-¼Þq®@HÂ
Mï³-œiv:¢sÃðáº¿À1Ó‹ök\(ÊsŒÈTâp¡[ f)ÀŸð1ãnú.G^ƒÍæiÜ½î‡#‡´Í-™êoŠºÃj(š€éA("F¯ÑûÙP\Ò §ôñd€L˜¶¨T+R¼fÉ~·=L0KZÛq2Qz(F´m)q©TÆòÅ–JYš+°ª7™`‹Ö€Ñ6&îåµ% 0>Ç»hÃú›]œñ<EÅuAÛ~„$É5åRn‰õ1Pˆ:¬Y¦F–{á*§³ŸÜ™k[ÍnoP«YüQ¶ÌyÍM©%á…ˆÙ­`ŒòÿHå3Ó¸´Cé}a»&kq»YJêðú€=áaUk¬gÙ×š:û!Ü‘ÑDÊ…úñh>ž¤¤^£ˆ–ù(ÿÎØ	‚üù…¼U A ¦µûûïôBŠú¡t·1ÔŒ |«ÂÍ¡~Ÿþy·Lôë¯¶Y"½zH¢o
OÇbrDAúõ}tÆbåe¹nÚŒ§>¼euÝÇ•Rüb Æ!Ñl×l3„{‹ÒZÞª‚û°G•ÚSª	N
¼åR=gÖ&žcJŒ\¿ç­MbZ©ÈV]j»ŠÚ.YžlgZ0ÔoÖKÒ!ÂuÇ„’·§ŸJ²Ìêâ’mãk+þ© FnXIˆ‘å%Ä¨£Šû ¦·0Ä´…[ø°8¼Ø-|-Ðâ«|*XéÁŠ¶¹áu0>
®»¡D5búÈõƒ"e×°ä
f×ÏeÖL¬'ð˜Î*@ >C¾|ÆÏ³×ÌàÐŒƒpùûïl©Lœ,å@yFDƒkÃs7 ¿ÊùðÎ»F×.ê2ð,ÃÛSmêL/9†$3Ž‡½|K$÷ìç£+áWßõ¹ë`/OwYi>þ_eŠR“ÎÅdCF‘ˆ³“jM]]íÅ£Ä7Î ¡_ÉºÞ÷tfUÈ`d«B¨
(¥iÎ»3®Ù-áDhcp´èK5ö_µaýªõh50
R(Æd0ª5ÔMëkBa­h¡ÿ|ÝûÏÆ|Ò<ùç$¼2ƒàjv_¥Üù[»L„Br	·6t>²Ü)ŒÄG	ø›2„#
ÏhKAé|’«ˆ®Ñõ(½^ý/ˆWw3
u9fÒMÞGÈûrÜCQ˜ôæ†K‰ Ì€D²	fGº<iœ†®v½¡Ï/'ôÅÊ(¼ Æ’¬°"ø5ZZ$èóKiú¥bDÇsˆ³#—ÖÆ}:†cx»2`BØÂ“½Apì[v+8øÌ(¥‡öûfÆ°4Œ‰c½Y\fŸ®ãñùáâiÖjtE;²&ø„Á9¿!˜Îø’PÀ­TTFV³Áíƒ¦+bÜ¿ýdtŽ[›í÷t!Û-º*ôˆGçITÑ-ºÒ¿:b·°¬(Ílê%`ã;äÑ#Q
~ëï è%Ø%Ã«› 1íñã$úÒŽÔ`°(^Ub9*<d]“
€T¥¦ãc˜Ì¢>´ Êéo¯’`z^Ó~A³š/ª•ÚCÁO'4pÁ°¾ì,;I.ÏÕ¨ñ1½0=Puå¿­ÔÁ¹V9ƒÝ¹ú9¿ttáÕWi
v’	„w£“LcJus¼¸ÜƒÞ;ö˜Î/RK.v˜h‹àG·»ÿ“žoÆàÕ¡ãçŽZvB<RÛ¶¦O¼c¡ý%µÉÍâ)Ú3¯Ì†Ñ¤RgBNXùN: áÅ˜Ë×h[¾vÂ2B,R=owÆi09!mÐ¢ù{N!÷zGÌ¯!\D‚ê^¨VèàÎ/é‰»…?wÆ¨ms‡ï±/ÑK©Õ ôZ#Íhº}"–Å‹`2	,Æî6iàŒSï@Š=š ‰GÚí{gÑºçØ(%‰bi´)îî¾&»{»ûÝ£Ã=òò„~é‘“îÞñÉ>©âÏÇÇ¯Uê8?Àr€êx½tHkVnW«ùxo£¥6¬r€ú q”B8 ~æCi4 qÄØ›U5‘žëªµÖ·F?/
[át Øºi3×V¿ÍV¿Õáì˜žü"~îÃëœ=he÷€=jiKŸWµ­Ê45Ñ¤ú¤®oå*yR+Ù¨lá©ÕÂãZNwôö2Ko-Ü_«e5±™Ûá†Uz}ñ7­&Ú¹nY¥[‹wøXoÂÑYæði§/i‰“§`\RÇÄÑÃ>3ýŠÄ=U!œæ­€üyÛ8ºw2gOJwþç<€fÛm«mwÔ‰7\¶°òfmw:Í"•‘i4,=S9Ü¿ïDò@³ÔÎ÷—…LÏ$AYüpÓ4á³Ô…»p’&Få}kØtaÓ68³\¢x?ú¥üÜ™ýYBmgj»$BmgjûÞµ½Bmß¡ÚMä#T»ôÕn"¡Ú¥—@¨v~„Ú.F¨íA¨mBeP¼ôÙl—Ã¥	öR¶Æ£âüÝw÷@£>„e&X‰
¼òp3\ƒZ+ž…=Û6öÜ`Øs½Ã£YÿB¤tyÿ9Xt'khñ#0©r„xétgd-[ i¥3ŠX¯Úðª=8^­Ã«õ_­lÌ†+y§z=‹·×Kâíõ,Þ^¿7Þ^_o¯ßoÛMäãm»ôxÛn"oÛ¥—ÀÛv~¼½^Œ·×o¯{ð¶u~–Fënþµÿó­?È$Ëæg¿ÇŒrðßúâ„2`{Ï).ƒßµÀ˜L©JôpÊEç~¾•xó?,@ ¯Û(|“¡ðŒµ; w_˜Ð¼YÜ¹QwndqçFñéÛxÓ·á9}ÆÔ—ÞÇrÄSÀº)É‰Zû·aïßÛ¿ÍyÖU½p$¤j;h¶°Üúi>nSõÎ…è#ØBkGøö8g÷·²€óX<‚9C"1¬PaS-½)öHéþd“¿ÿ^¢!]k˜Ó¨®P”¼=]°£•réÚKÙqo·°cwe—Þ~/š>œD³(1Ún±^Z½´T/èÝ²xyíË¶OÂqü™ê˜dˆPKÁ´å‘&ëÐ—Á±°)5ö‰ùE~r²}0­!«¿ÿ^3/e~]]ý.³W¯7ïþû‡¦!Ë–ö÷”¸T	”WYÙvvöoOý³ÏØ~’êÛS÷
Lgj6?Ï
¨sx¿èíúW 'lD‰ BEÞMª½]÷bÌµíÏ³
Ýc1ôò®y¸c§wÁ®ç'ì…£œû7®ë…\ø«íÁ_®•wb!
>C~…s1OF75µ÷–ÑØÇDx ^üŠÎQ¥æýtc}Ý9oçªž­â]Ó&~DÛ{[Ýæ‹Òö¶÷iÚýýÛ5ðgÉ}S¶W?öíËïÅúÅûf›À¹7îCïòŽ²}»+‹ìKlek÷Þæqñ&*‹Ûü]žöÙˆñBLY„þPåÄeã`ÁìäHÕ}¤ñˆOSú¤C^¾|Õ¥ ûö¸×;|ñºKz©’T_½íÕ,iðpšž ÿ¶ëVËkÇÍ¯SHlïíi¦ëøÑV_0ÚnýmoÁ‹p	ãçü—Ã±ÌfÛÓRwóéÓÒpÜj6Mßb.Ò’—_Ù!üÜLcD×á Ú¬Q,ÿV}ƒÙºå–Ä¸ŽÌVÝKÚ?Èv¢ùûW½’ùrn§xûi¶¸'};Ë]™K™â/½›ù÷¨0Ç_´yÿÉLþ¿j‘,ªdÄÛO 2™Ù=Èô ©iÇ;?o+:[hÝÄxŠ[ƒ_° 	=t»^ÐøOj9ì‹ÐDÙ˜Ù`ÿ+ž{ý«kèP­ºÓM‚A·¤{pßn¡"Ö[RávÈÊÑîë.¨|í<Z 9èŠB+Ç§¯º'+Ž~^	RFÄ|‘ë«G¼Ö€Ë'¬Ì´•z»‹8Í`Í-/Ÿ[§¯Ù¯¤B^wwOÞtO²4*BÚþÓîîþºF%µÖw×»iÛôÓK×-lüÊû”Æ¯ÑšŸ8'¬_¹âxœòL?v©p2(Qcuqx.-N=»‡@`š‚ÞÝ,;è¥;Ýä‡Aúj
ú±2ôçYÖ#S;ÜÕqmDsêÔë	ktµD|4˜­›{døÂ@Dù°ÇŽ(·³ã’ˆß§jC8Ñ–6Cs×ßê%¥.ÌÉ=Ñtà5œOß4Y·µšûÞ±†"õÓƒÝƒ¸Ï¤ähèºhC™¦òÒkÕì!Uà6ÎË3”õƒƒ­…†reåJ¥íJù±t7»»/üàïôç‹^/{ŠôKƒ\_ø¯÷(0OZ¹ãÓ™uäƒÏr²£ÑŽþúlG!;”+c(Ÿñ(˜*Â”=¾óàdxÊˆüø¥CŽ³ÿ×uœ˜›b’+”	 Vc2š…\³ ƒv–ÚÙ)<er>ûç` <CçÆA—>ËAÏŽF;èøë³ôìP®Œ¡|®ƒ®Iö@Áý²qÅ§ÿm«üÞ0ÆÑ¿ fçx¹Ê®Ù¯Å{“Ìƒlp›<Þ„f ú»ë›MkyJ,œí‡i?‰¦€r˜~µÊ‹¨ÅÑÎµ6pí©=½‚>õÙÓzÚÄilt?¡ÓÒÊòVöIÓX‚Ü²l¹Ú››O•ÝÂ²{[›O[ÆÒj•ØØ2"C)+©döOdw0€pÖ³(E}¸ŠztÉî˜Š8–`íÅ\l5É=Ôá¡%«vô¶'³•Á;Ã§*Èp†Î*ìm¦ÒñÇ0	Ð©Õ¨e„eÑæô6`æœtôÃ$uM–6‡{À¦ô9ÂÍšÜô ¦8S†8e±ƒYÙ!tppîÖtL·ÌÁ°Ÿ|½Ûë1¯[Ò{wt´{òÄr;9>8UÍéîé!¥Xö²2.dh	•!;X9î·6[½¨üAwm®€k³æƒknSláJ/¼Vå¬¥¢«Àz¡í¬«ÖFQ³[K5û¸¨Ù€£Îm*…]÷4á5ËZòuOO÷ÈÁ¤»§Ç'^¹Wë í ,g7­L7»¯»%¶iT«é»i&©|˜ÆgìÔOw_“*žWÞ´°˜=:v~Ÿ×Äi·`ÎCßñ&n@Nns™’î$üòÐxÜ‘÷
¥Ôþ¤oëä¢£]òé¬£ßü±ŠËàïím¦”`¯â\³úœâK»OñÔê“=võù6L`ƒËº†áBªþwèN‰‘3så´(Kä€ú36`zÖÔ$²1×"™Í‰¹”lÐ½¾F‹ròšt-ÏäT×Öˆ±\Õ#0X#»ÐìeXj©äÓñ4uPÏe–G{^ÐHÞ’è/\Í¸–A‚d47„`Ò(A¿R}Ú\m5›6|¢˜¢Úk˜òMÑ^„“þèlmOš«OžÚƒ8×
Úã0ßYCÑ_f/žL€úTcy¼¹ú83–¾,fDcC½*Å>tOµQlÑQlØ£Èbö(ô7Ö(Ô«¢Qtá×ÆÐ\ÝÊ!äeì¨çV÷âF#ì€ô­éGNeÊS°Ði™›ð`µ²Ô‘ö|ÝÐ„6³áifk±f{š)Aô˜¤ûÐ:ÚÈ8°þ¿Ó«iS-Xsœ/?K$	Ö»(®gSXoV JÐÚ(Ã¥ö'‡áXSÉ~Œ]tYÄÔi¥yšÍ7,ø«mM±c¤áÔòA¾KÃd‡žfþ4cf¡ÕâÁby´¶XSÎ¢5qîÈœ•¬w¼Õx8ˆÒé(¸yãzÇ†KŸ
ÇPrÊÆY‘}t–è£Àë.Û™!jÀ #@Õò- èø‚G?q´n¿R 	JÇ¼M"zïNƒQÅ 
ÊåþX&5@,£8N4.–Ölã¢Ž¢A›h	~ÚuÙŒ€8t@A`áÚ/eó­ºì´”ËµÝ¨œÓ—ÓèÁ<:Ü]ë^Œ#k%ËÊ½MÀcRÑÝd=?EÀCu!²­{„	fw|þ‡Sˆ`xÑ^÷b
Ã.oè¥»¶ø36·,ç~˜­È¯*Žsÿe‡€7ÙX>ÌÉbyþÆlÕÚsíÌièbÕwÓ©ÀªÅb÷Bk{@ÎDiØ­ÜÚ‹€Èzˆ¬?$ˆ¬—O@'jZ0YÏ¢&ûŽ‚}bÓ§KÁÆºùn«å;tAÅºyÆ ”r:Ã™K9ˆƒÎââ›ªh†·*«¼¯<b›]©°¯Úî@6’J%D}Ûú
.ÈÔ¼JM‘ÔUH¹”—ÓêÒ÷Ü1K?X¾»¼ÞcŸHZz–,/+ÍòO´òüQ¡Wû!x7s¡VÁLWpÇém‘ìøÕ˜WuÀ^Ä¹®«¦ê¤¢œ'SA0a+`&D£P«ç°óÅ`"ÿüŸo•ÞÝ?»˜£©1¬?`›,é<»¿¼(iÓ!3°2¥—ËÞÞ´s CŠ0»ùºl¼n·Äu®a‰ÞE¬>”gƒè#éC¼	 ±íÊpõbF_ŒÂküg•î½ûÃqºÊù¯yJi…ñsºú„œ_®¦ ûZÝlRÎL«íë?‘ü/Òn6)?q=ãõ+Ï¥Ë
œôÕÖ–j½ÕTÍ«Qæn|½Ìg1Ÿ¯nh=Ñ¾^P 8†Ä½ÐËömûÉÞ5uº:÷5m”kt˜æ †‡íLC°¹y.5¢µý„¶ýüM,‚S¥ Zºˆ.)9x¶6líN=ãÛ¤‹B¯¡Õ«Õñ@Í—vZyŽúSÑ4}z^F‡n tå&ž',õœÆ³µ©g–Úv"TF³¬«fUÝ‘Y™2™×1ï«u£Î\œSZ€m"SFñD±;÷´…3úG\4ú[ïøMóVñ+2L¢ºß=Ø}÷úôŸ§Ý“£îïžîŠÛÎ
fµzÉsÐòž"l?Û:Åü$)U?ÅœjÐ†Õ§l^oœ×¹S@v£ZVHId-øîŽF¯U¿,½™ôÌ™©‚Ópv˜ö‚à‡”_¡YrcI×æSÈ`/5Ü¯£Tíµ™3À•¹8kÔ¯4ø
gB[ñ¬š²­ÂTgZšÃê/ã\—[4Â2Á‰¥ÖB¥ÃGûj$CÖ»ËÏ¡LŒ¾yrc9×;×8üÝ—ÍÇ¬E·cé¸û‘+)³kÈïyÍ3+.º„n×\T%6©º«¢c6²žUÞZ“;càš°>ðäD¸Ñ†€98‘NŸ•Õ™üþ“zÆ¿LºàÎ	\ÑŒÞâ/æ£?ßa-WåŒk=Nï<Ã"¨ÞÞ™ï^é»	 ŒÁÞ2|¤UÌ¯
Fa2ãàRz}ôûašÂm{ƒˆf 	$YïâùàQEÖÌDÔçÑëmÎz$}Ö%„3œLC«Íé³þTÃ$1ÓXÅ /H’8ÁW¢ïbwBð‰û(‚«!%þ`¼pÏ±ý”Ý±\0#…Ôt¼§/Ç…héð£U‚lõ´»îp BÚ×aáeœÜ¨'˜9WåçùŒæ¡ß¸3‰ÁØj ò§F–ÁZô«Ýc„ç‡Öµ¦é þ}³ÔQsž6=’À©*S÷â[žÈøñ©ý=¼A£'ö‹5Ã3°5ÝQZÎœ~ñ1›ÐÛ±ÛÐ=·©ÓX÷/£Ô?À&+À`†à²Iö†aÿOmfÃiÚ£Q?$F‚Jž3¡‹v†µÜ4•ª–é44L¡!…%¤x¯-ð™e0tfädƒQñ\1jgµ„1ÀˆÈÏ±KúdÈÌ_k™³ú¡§¨Cº@;ÓSÄì„«?ßŠ6èÝ¥Ì‡þ„"`‚˜ V“¢ÍÞÕ„òß¼âä™Ä”’êh|ÐðŒ¡ÎDie|¤TiŽ5Åõ
•õµ„õ¥(](¾^PàŒâ¶î¬%Þ·',OlÕzŠÉákg®b‹¶å¢Í¥‰”§IøÑ‘dVhI«@¹÷ò1¿IM(âä½M'ÊË8so8›KWµ¡·iSØª¦ÑÀ$¼:ÕÛ0ˆbÕººh@ïˆ…4é_Ù‡‹Ò†ÅÑšSËdæ÷Q—¼Xý²w­OÇ"r }ELbA_ŸŽ¹:Í¥”.‘CHöj–4xöCþÜ;èó^1÷¾]î‹¥?)’.pÆø}Ø˜'„dá„—aÉåÛZº£Öëî*õ¡R±j}Ù`Ò’˜ô(˜ÌƒãÃÎîUýøóðåc@À²G"wEêé3²ÅÒ*$†xêàÇ,Èöxžâ¡?gWa86 #DŸPü— îJþqÜ2ÇmlŒBR?Î\é3—¦LÚç,Ë._D!hW$ûÃiBné3Ü“} ¿QnÕ)dÕi5ÐÞ:Ä¨‹ÝÔÉ9±ø.¼¥=^Y§‹pGE˜±©FXqÄk›ÿ’õL>z5Å„-JƒÂÇš‚Xþ¸.“©§s¬þÄ’rb ¹ÉL
aÚ9!,nM¦ü8±ÝŽêÖ—j“XL4.«õ,üÍjËöüø[kÌnÆ@Ù<Ö=ì¢œ¾ÞbNÿÛ™¥ØV i]*,%Áj•4Ä‡_ò$·¥¤¶nÖŽ–¢C–%:JŠô>žùV@M‘ÓËð-Aè¬Ë}ÀsYè|@àü	9ów«y%š ^ð0e<9\É|6DshÁŒ±Éxz5ŒG!Sg“Qxõ“Æ£÷2’	°8‡Ý”ó½åZ‚¯×¤#íI¸ÔjS›¼LâùŽwqtÈ%<+¦i8¹C(¦é¥iõ
jä+™#j¸Ã@õfÁ®†Â½ âÞá&Îg`4!tIpÒ›Bƒü«`›xhjýY¢›èvƒ ù³#<i6×èCn¹qž5á`Åõ§hÌ ‘;ÏfX&0Ú¾moöàÐýç&7^m’éõê™Þ¬¶™mÄuÊ¬%ÒpÙ[¢kÓBCŒÏak’èc(_4ó¿hec:„ÜŽXŽ¹“Õ[×¶hA2Àtb6Ð­*f‰úeÕö [.vóGù’Ð’‚Qzš“ô"õØñ\;_p‹˜§ìÚÐ
Z*•.J÷“x:Ík‚ðT›Äã˜Q›®Êâµ£æI8 žÉÿ  ÿÿì}ÙvW’à»¿"…vÀ6 àbŠæÒ´DÙêÒV"]Ž•’D¶@$ŒD±Ð<§Ï|C¿ÌgÌ/õ—LDÜ}ËL€”,ÛÌê¶ˆÌ»ß¸±ßˆ@Mñ¹`È}v{î’ ’Ñçç6ôtÄãdï…Z¥&äé—˜Ý\uò)}mý»Mü9-W,¾Ž¯$ÃÝFYã<j;Ï ô¹’·¸3A¾Â´˜P,(òèO£0Õ§éÍ'èÓôeGÛùë_E{Ægö•õ`oQ>È®˜v
a­Ÿ]4Ø7 ÷éˆEZöÁÝ(¿Î§Éå#v%…Þ‰pA¶ÃêÜ¢ø Ù po®¼ptt>7È>$“©Z¯9jâÀSÔñ·ˆŒæŒ byuÄ€}ÍÆq/^Î/B×›kEsAJU¿ywcbw"W!
Ý]Òibuþš§±·àýÝyQt¯½YNù¶=”¯»å»LG­«Öi·»6þøÖ¢p®¦éz[kíM§ÔË1ùŠ	Û:lØš`e.‘EÆí	n®±Ý­°´p—I?]Öoöçazy³»Šƒuç ¡›Ç–a‰ìÿjœ„Ð|™GæiµÂ¤ØhG8Æ¡g5i4ÇF”¤ëÆ7¤À´VÜÂs‡öÝrš›¶ìr€|t¸kß¨ÉfÓÇ¨<ˆÞ¡¹+¹ŠðgÃS„Ýz˜à/žBD†>CwôKXè@ ÓÉ´¢ÑÍ
^ÿ¯×o¿„+ô[,Ÿ`´~K'Y¤¥ïˆÇÃ¾%ˆ·›e‹'pë™H¶té™ÄÈXó`ïJg!:¿Í,,vöJZh¢«ÿjÅ~:Ï@ú×U³½ùéZ3ê4ñJÛz3Úxë‰ÏÀ^#ø;o##v)Öß
iBeµš¿	›’›ãý¥àÌ§9&›DùáŠ©ñ-ôëE6}y~žH‰€3äÈ…Û•þS|ÁWp
ßëòÞc/OÒ)&{÷æ°Hßtnà`ãŒáŒïDìï~0¿žóAÁ7JF‚È€
Dédòdº,Ý§‡õãÌ1€ï®®Z0àžþoÜê,Äˆl›—@¢+d‡8g²MG™Amox ÔÙ0î½GŽàœg]cºV»6{Úêç/ZÄyâíÚÑÔe ùLSl?§v€kÞïTõyÖ‡B£`¢´ç/×ç@D\ÿÛ‡S#¦ÑÝ›Ç¾ÆHž~¤EcX°d ¬d2ÙS°Q_và,øëLÞöæôü¥²ÓPïÍ	‰KŽwlCIMeokFi3Â@7}ÛL)íïA°+váG‡ƒcfŒ2Ód«;P9b4ñ`dn½£ÕÒ¿g½Y.€5õÓ‹ŒðpT“k0&à×6Æß† 0Išûà×%­aÄ<›À$§Øev•ôëÞŠ70š†¥ª`%Œy[w{©Ê·ã)óhÕ#@84‡_6Ò&!áÄ”ÕæïJµyA¸!)kQê
o¥qlµµañr!è(@hÑ*Ëþg)³•|@­ Á¯\Êý9÷eAãoôe»_+~}µÕé¬ÙËóíÚg]›‡žµé|‚µ1‚óµá‹ƒüßáñªpw>¾®Rà{[ýequnaÎ®Œ§ûœÜœ‡{uòÉø8¯òNðnãé•wósma~­œS«Â£éÜYaJ?‡¶oVÆ•-ÊéÎKUx²?7æÃBØ‚¼×Ãuü–Éi©x÷Ü• •"É=we­Ê=w^›îJåUù†eT	0W•yª
¹S¾L†¨EÉÿ¸,J¡e­ ˆ‰k£¨¨ŠÔSUTSÕÔR:ÓSx'¤”ZT!µ([#‡TQÑôÇckŠLaåÒÂŠ¥/†½ñ(”hy­2›ÌÃŠ¶[f’áÞ6-gŒqç5–7V]Ö[_û:E
çå¯gÞh4tß‚SÅÝw£UDá+Ñ¿Fëk+:Iö¨Õ|f « cZ˜E¼½!ôÃ­]<Ë)Ì¨]ìñ]ÃæÛúÎ­X`1ú¼Ö"3#šÏËè@¸Ù64ù.ä!ó<gÎ605—QÕk+ú#9OÞ´OHØÔÅnƒ®ÝÓ1ëùÔtl™Cùç¡k•èÇ+Ÿ€@ùŠ,9F¤?½Ô.R-ÞÜ¯omÂ’5úsè5ì””¦^Ã¿D@Qºw¾Ý®”ß·+.DÁVmßÕ:ÙØ™/››4ÓÆgUVÑôæ‹iÅ…eY\|a/†@'Éi¤ÈKy•¹…/ÏŠ-H‡TÙ5¯Ç´ÜAï×o}îÜèÎëúÏø¨¦Å³Êe)‹.ëwÊÛeôÓï¿ari,¶­Ï±|[î”¹¯ëÞ}Ýª¶´èð9¼cèÐÎ°öCãíx ^Æ8É9~P$\ÚîüK1Fe§ØeJ‹üN"“³w.B ?r¤
ñëþð!‹ñîôè‚‰ÉŠ*3P•3il(…ÇþÀŒJ“´ŸxýÐü>¥Ñn6¦Ìªl¥j5IŒ$¸ú+XðV«´Õ´;§ˆâíóIvÙ˜Gì®ÜN´Aö¿4£”V·¹“|„áJ÷½~µæXIy¥oÄþâßûôß’Q­ø÷ØR:Æ>G%Ç_ZÁ›ÖNÑjëVÆú–±$Do?-¥ š°-hB§S¦@¿s¢àÅî{ðº¤±Ì»ú-Y¿Œ´ÀeV‹‹,¶ó¬ºRŒyäØÕ>O¢hmdNð]-@6¡‹Â: ñtÏì2ÇÈ¦Û8¹AeðÐø€“§‡®Wð­_ªuJ(]çp1³ïñÒ«¥ÚÝRí†ýè+µÌ™d¹=8z…M¸»€©ù;vöè0|=§Ý$®šÆM €tI–=öá7ï;zÙ]RÀk=¨„ž˜5ÄBiwÙ­áôÙ¸`ŽD(7<šG,×äN´ÖŒXÖQö§H¼I¿.Ç¬€LøH¿ôœ‹ôB%?¤Ÿ*!ýY)‰´ÀBÞ‹ec§{Ô8)ûšlñÙqÿëÊüïF¨žWSL=]Eÿãß{ù¿íÑ08J¶¹'¹øÚH|i|ÑRQïµäÆ{™µ‘Þ~¥ŸVŸüÂ@ØlIÙIÞ	åå™`Aƒ$Þ[QãÿæYˆBí%·¡¤>¥ÂÂßn®h³,,ºEÕÄí¢bêâ½•½‰gãÕð¹húpˆâ•˜àáå-­rBÍ<ÐG½xüáâ‰XRÖçY/i4â^¯±ø1ðgôèºÉJ¬E#€„€\¶Ìr€½ipk­±:¸*Xe€ªc,hó†êÝw	–š¾­|§—fùDCåÙW³Ï4ª¢²¨ Éxïã)ª˜DÅ4{èì2Qƒ0‰oÜÚŠ.û;ãV§[…%÷À""»×ïKÙ1À×­n«t)ëP3µäƒáV~i°ŠRäEÁúd³Ö íÃJ J¸cEõ°FŸåÙpƒ˜fcàù}é	ª‹áßA«\éÙ…Æ®Ô,o4«=’Š\4–b§Ô>jlžhf‘D0[Özñ&;LÇ©(¥—¸’gÐO/©Eùô0çüˆgª¶¾ž×£ÛãGË/cyá9‰cÖ¶Tæ!NÂb”g˜0­#¦¢Ô|hRéá™kMqõa+â>þ"Áæ½né+
_½Nz°rc€ƒõ²4—ö%VÑ'ÔG@T¸ÜV·oŒB›öàëu6‹ú¥Ä }ñ£ÍaUø÷ {aÆ,¾0fqŸrOiÎÆ2É²Ëˆ_‹n›Ö “È%@x’&…2'‹!‰D³ˆÎòü’ºÄ“D$ñ^GìXí¾‚)Â’#&™§,‡ÎX$(‹0,Ë]÷á¨§9ìÉ£e|bÖlà=µ  lÚ6Ö\tNÒim\ÀÇ;ú]-¤ŽŽ}|ˆ¢cæl²vË—()µªî¨9™Ä±A,_³X…·a5PW°-ú*íå’„7G÷"‹ ‰luÐbõ˜§œ°ØkÛöd'w*Í‚d‚êdÀò"³ƒœ–Ý`AŠå#5Ù èl!èlXIÀ€RÑß˜HZ`WS–A`Žù
±œ…4ÄÄ‚ÎAƒW„½mØtIQœ5ƒtÈµâoÐeo=LM†åÄ$ÀßrÁ/Ú=AÞSÀï¯Ý8gÀsáºpªÅèpq€/J‡'9Y(7™©‹a`gR˜Ú¾?£žºŒ÷]~ô­lDÎ@Ñ¸X1,´bhÑæ{p¾a~¬©÷LYíW„@wÕþ†9' çpL£èÓ³º¹UuŸ*Úoõöª«íö:±jþÐ,!û‹ºæH3üŽ\Õª%Oôsç¡{±F<fåÉd©Ï1Ê	Ë_]ŒèËpe<oÒ£nÃç¦üö1¦¢Œ'xU¦ÈE†>'{®cúËvÂ,[6nr&¹ÚW¥ªòÄÌ	Ä	XIñh¼êû‹ava/psS•Ÿ‚ŒÙaŠü_Ë÷=ãsÙs”Mmþõ¡§;÷p”WÅ¥uÎ0¶ù¯&d ¥ H‚x£Ä¯Ò$)Ï>o¹ä¿Ò$:¸¿œ,[ìMßtG}õfß¬OèM}c:¨ßÐT"Ù"¯€LÄaf¥( Í¢Ønb_ÎÏ×ž6§À·GƒäÃ¤)4Ð2ªÙéšþÿRÈdre‡„ÍÎj7bÇàùš^x¬õ…‡eÃ=,ü`ø/©{täbG—3Îd]­®C´¾E¦¬rŠ²œ, ôm¢?š/zÑÃ<,gÙÇš¿}&¸¶o;Íÿw2É¾Nì‚ß’L Z&±¨¶Vn[»FQ‡Î§ëÈåŽ²ÛòÙYIõÇ?¥RÊRÆôÅü>©²UI£½Âý•¹Hhô…=@_…uó¬µÒhœ26jáÃŽ¢Œøb!áþµ0Ij?â;èÇCÞ¨H»«t *0d_yz±°xÓ-oÎfÓ)kLpN†iï=:%y2=dW‡È„¥ÓëçY?²Ôá¼(â­“ï ‡«'h¡¶3¾8¼ë¦ås9v9™ÊxË˜³QGýt*ˆÇ†w³ÄÊÖN²¾Åª“R‰é”^'˜6¼ÒÊÃÜøÚÃêê¶V¹äâ¥t)dâWhqÕé[`y•¢s¡…Æ¬êÇãI÷)	{ášë*7¶>w°	åg?ÉŽ>ö@¶ú3Á82H¨6,Zs–½>°ÌË:ZBFÓÉõ0Ð*@¾¡¸&ÉÈçï¾P ?Î‹VuŒù4•Ãs…"ÿ5Ü1Ð]Óªê@ð/V¯¡vÀÔü
üÒev*j¢[ñaU½˜PòM+ÑÓ4®ž‹’ÿ=J'=ÌåËvÃ#o{«8úfÎ»ø´QS9.ö™¤©0"¹òm`X¡ˆ§W@óÀ$! ³!|Hóä984ð^Þ¶»÷0®bžN²‹‹a"z×@ïz<HóŸ“xr4ê+Àð\ágÚ™­{¨‰*0cääznž œgFïBíh^Mf¿‡v"Êœì•ÿ|XÙ@™‚6öó[EìxÕ!Ë!XŸ¦c÷'@±Òj‡r¨‡#þi$fíì¶¢+R„L/Âàa¯p]»ÝÞÙ\×O7Ç!õ¢ÀÇ‚i%£4T³/nì<`ŽÀÈîÔë‘@IìwWÐöu;õ™C¡nùÖ¥óZ•^×u"œ»ƒ=ˆvÑ©¿n¤›"ŒËzZ€a o_uþ†¹jˆüèmadÄomRO0-s‚8ºÌàOvÛÑ!Èp
.A|'S4GR³Ñ vÝëÚE?`^Bjã [¡PNêp8Ô²
:Cw…fiÙÉÍYA§¢ïb®ÑyŒEŠï¢b9ÌãÃà¾:3d¢.ÿeGÝ¹¶c‚ÿÆZ¥ÛŽ
ØAwjÐ¥vlÒõŸaúÍÇéHœë49§#Š¨„“s0
2®8 CI^ƒ$r´°„‚:êÚ :ÔÒ«Z¢TÃö¶ÕP<-§v¬™Ùß8öÑù+ŠŠç·R8™ézÇ«sú4å ¿RÌ§ùú§çxú×ôàÖg‰=ìL."×['Ý³œ®Æ£óñË>éÞsâc¬«	…œÌûèyœŽ"²Œ£†B–O´ÀG!Ýsh®_ƒ±¯q¹Ïv©ÛKW“m„Y•@:;ôC1<¿<[à÷¥ÒBmwc’Ø4›åt1×7zJ]'Syá|æó‡"Tr–eï±Ü–©m¹Ù;f±›ÚbÃž1q½b
èé¯ÑI6N{9]*Â´mÑ³ä")Hï0­äoWæ¶R5dˆ†÷)±xä»R¿‡59NFªD">ùÔkðñ9
Y 9ŒWUîÛRŠN6¹öèÅM'@…^-é¤$ËKë½#g%m…]Ù}šM‰Ãü&h½!ÛÔ"ÜP:DO]ðžT‚Qnîzj£î æ^vYÙ	o<Èw+7n[žu®`Ò·Â± m¯-dRë½°ä?wçˆ6óñö$šÊqYÐ0N‡¹c6¨²ËmE¾^nÕAª¨¸˜¤}úN=‡	_öwÔÏuG £XT\’µ?‹#39j¼0®Ú0zG}P§£krà8ù|Ø<æÈ+¦äúfºMfû¥zP/>fR“†ãÆuuÅBŸÜüeÅ‡7ÊÝ­`°=ôNèVHcé÷P«œR…=w’XEoªbz$(ù(Reb@®Jý)q³¡ef1#‡tlZ¾Ì$Œìø½U‹.ñ³.³÷d6Â7èäåMU•4ÇÆ¡¥:oÞPäï©[.h„E‡Ýy'DÄâ†‡î¶Ga·1§ý9YÿÂ{È^U‘Ñ°÷ðããR}z`¿£ƒéíïÕèù¦*`7Ä¾‹qÆÓ?ÆY0ä¿ÛÜáÿkÌã‹«ÿÅažW'Ë`\ë{¬ó…aÿÍ› Î9Ôî7¹Øf!Øf)$³Pl·1ÅØ­}9Æû‹C0ÇK!ý÷eð&IYYV Od@cR´¿hî¢„×]TÂnðÒp„
\‡
 ñ÷^©™¯5|Ü­Â½d@ÞŠBXBÂ‚t¥ð•Ö–M†¾ð·¨æôãPùEêOÅ-![M:%5¾A›ØetÖc/ã1^×Z8æSÄ‚¿}Ù©¡ûAûòt³Ûçÿz[®m^æ’¤|P7þ4Ç@[?&h~ÀkThµs¡òO¬-…äõ«®x!¶2ÑÅ•,Lw^0ÊB«ò‚±íZVUŠÆ†Ý˜‰ÈËø(Tf_ÃÑÝ›woöŸ%ñÍH8üÝÕéÀËG™s”²–ráÐÂ›Å6´C346®†AžØl¶—€n£›BÔò‡\”ÛŠÐ¿û…Ù
,Œb¤}%÷Dò} d3‹1þŸ|*„­`  ¬ušhã)‹ÌÊìÞÕg¹q«YÄ
›ï:lšV,V'¨Ÿ9=Úñç¶þ[í R°dn,€^îŸ˜MMÖ&¾!ÎÀÝ6Xl¿º¦‚åWƒ¾8­qnfu^p)Õ\E¾?AºÞÐXÊÄ_€P‘k|à‘{U®‘ª\¥›þIè(2+¾ÓémT–¡ÓÊÊYpwœÌ„Læâb<çßI! ™*ìøf«(H‰DÞ,OYZuñèn¡vzÇ;>˜´¡h>2¦ítaÁ`8à<g÷MZÆó:±RŸ‹GO*R£´ŸÅK$AùƒßHZŽXòÙUæðÉ¸¤Ù¨@á‚OI^‘’d!ý8T¿Þj¤QH×|S+†¶@©u<^î£¯¯Ö©xàû¦é{À˜4n•¡Ô!"“Éfa>uñxÀì)Ðq…Ù½…ô_gQ™C]³»£l	Bz‚Y0*rE_ÚØ_/:ð¥XÎîŒÜf¾¶ÿ&8‡ ?ôêäsñC‹¤w»3»ge¾h<-æ‹ªç`«ÈÙB÷=wEÜžzÏùž
Ü‘™ü³sH¯Nî9¤{Iî9¤{é‹àüÐqu~h96(ìÿ°(´´_Fe(ÿÜ,¥^¿g€¢ã{(üT`€ôLåŸý9¾gîÙë±1[*;Ýb(I’¾éZ
Y+ýqfEGbWÀoý9Ø1Ûº§¯!åØ!©×ö¥É·`ùÊö™¹—šDA&RÒ(HÑ.¯a(ââ}^‚cÃ”njÚíÏÄ·éÛ£¯ù2|ó—:™Eiá‡¬O„½{/·ŒP.7]pºKnZeÈ(S8úMÅÈaÿøô‡€Í~õòøøé÷ÏŽ¢ãG/_E¯_¾ñrÛ¹v-b%þ6À{™™ÿôÙZw}¶ª¯úÒÌ¢×Øöþ`”÷ÚþéÅ îWYÎbm‘ Q„Sú¾÷ÜÀLùÂŠä€·.ì…´Ró;FìüÑŽ`öÚ-á¢«pÐÔÄó¬G³Ëd’öÂe?5§Í¹ìJnÌùþ ÄSŒfPÕ3¡V+à«3íÊÆäÞÎ½^ìþÚ¸Ð.}Êè4ñ»#\ÂŒëßžZ»_6}Æ·œ%-cˆÌp…ø3ÅZ8ùöê%–æE	¹t9´2€AæeçwçôíŠJ%·(H~3:ÛÁ´M,«\ôM$²iœ­°+”\Žœ?,¼©íE½-€Õ?oOa›æ§ Aãé=	ú¤$¨Ôªë'CUŒÁ·%E–ížÝ“£?9*8?÷$éŽHÒq9IZ€å¿=%ªnO1#»Ýn,5ST3R,Bá>‡AÃ¢r%f;?+·õR¸ÅM%ËR¸ê4îžÊ}:*Whƒ˜/ Ue×©Ù°…V5j0M¶®éáÚóøcÄ®P1•T‰µŠïDëkíµ[ØKƒÀ]¤ì¿ûpXÛ´pT5hÜgÿÁåO„?vö‡"XFæÀV ˆyJÅ{¹âwƒqƒøö¶+ðùBð+a×"ìZŒ[ ¼°™á!~•Sá[J_ßˆÜ®e ø§Ô>AOÖméOÙ“Mð?]OÖýáPW>{/Z†“Ø)¼;=Ëú×¯jHûIëZüatã-»÷ëÁ´(‚H£þ<¢€“Og}ŒÖ…?AÜÁh¦u~2ë>I.ÍÚìÔÇ4§Þú¢äKXŠ‰HšË¾ÑöO#XŽôb”ôµö©4O–|·}X`\J;E1ÂÎ‘ÇŸêoRž•u,ÂVGÇ@=0ã®‰<ç/ÍÀ¹ÛUçžµ:¦ÿÍüÔ˜Ì<¢”‘@{å¾ÅÓ|'ºó£ˆÄð™ÇˆDiµ—v¢Ýçñ$×¢…¯îG7Í@ÓÚ¶ŠÆÅÆŠæ	>dÛÿHF³ªcw`3ŒÖù;Õ<ã‰T?å‰3z­}¦*jPjñWa¤B›Q‰6å¦â[ìÒ÷¸µ©E=òÆ2®’çæò}&ÎTŒ-Ëƒc‘[6³4GDýk¾´ä7–{™õ˜¦w7ûünI0œUÕ¨…Aö–~^ÖöÍ­:Æ<Cèy’ûÂVÊ`/"ºÁô—	‚&bExiŒ'Ï‚ä=½¡’È—+:M²!Hsvo³p=]t°¾žtæ@ŠzçéÆÛQ€ûü­—è°ÿ!õ0àUãáNie¹e*‰¸o-T,zý]­Õ÷É¨7À°%´\Ûk­í‡K®–žOFu%Þn8ëu¦õü»Z²GÙh„”ìÛÍÖ·Ë.E7W‹^¹KÕ“=þ®êqò!fy®±µ±äBÉ„v>w_k©ú²ÏßÕRÁ1¹ …Zkm-»NÈH[ËD¯ÜUJxw­Qé¢-•Ê¡ZÑªËìKœR²ôÏÑ¡¸ÂrS=L2ë» T–ûÚžfOÒI¿Ñ]Y`ñ+í4¢vrÙB°2ù‚tÂ³­QŽ–ˆ’Óè	¯Y¢¼W“$4­	Dóž/K›­‚sŽN9JGy2¥ ˜›k)BÅõ;?h´{™áhÛØ¸µ@)‹š¶7Ÿ‹û&; ':IÞxþ?£XÇ-–|L§eMi³‹Ïòl8‰@LP
V7àwÜ{ßŸdcÄïdY­¶ªf¿Å€Í– »z»%ÉªÂüÕ~¸ÙŒp9ª.›¬Ú¡zžjî2Vë®š°¥ŒEqØHûzÙDxX€6èƒ‡”UYd+ÊhvÝ•ß˜@‰tÖƒNc¥wèèå'‚$=OAï‘l‹lfZO‘AÛæmU	„ÙM?Ç[ç©ej\yVW,ì†$Í¶º‰o£¦Ñ§åI'ÈrÙaZÏCÌhy2IãÑ…õÕÕy0®]Æ“îLÐ‚EdVØB-+ŸkÝJˆx@{¡ò<Ë×îìÜiv‘Ù!yãl¶–˜‡ÔDï'”s4Êgü«x4¦™Ì%ÑÕ±¯­£‚þæ@äDVê*…CÅ³¡S´Ñ~š‡ñu4 Ucùóö;Ïhv
F3-2Çæå¡ùUô>,§#Ãq>¥D0Uìmh{¬¡°ûÝÝ¢Ø¡l®¯­y5#½ªÌIjáhëý·¦¡“eYs­¸>þîºí=˜?CÝ"Ëìj€ù
² ³ó¥nøÁO&ÍmÈeìŒsâÜ2V|n©~ý†Éb8ó^-¾ù;ú^gPFn>Þ2*Ø™*9³ý™±£È ¦F]yÁÕ—Á×gH÷Þ(«NT,bâ‘ð¡ðJ&Š	-°¤Hd³»êHšœb^ÿÏ›"!è_É)Ô\Œl…ì£!šÜ‘`brø[6‡R¨È4žŽ¢s 3øoŸgÄtòž.SÁÍ’°0KË8äuhAc™­Ó‡ko-†áñ|½Ò~ärmVÿÌ²Kø·õp3<1Š µ¹¨™¢`Cü‰r«šNªh÷¯PxàÚÃ2¯»Œµ†…JÊÜCÞˆ½&üu(F³žŸµ»æÍÏZ þò¶h²½Ë™hÎ€ÿªíËslf‡õ±§Ô³W·SEŸã’§X(Ñÿü×3†m®RÅßNSÀTI|ó’\ÀW­m ¾í… ÉbÕ¬´ßš|TØeŒSËE³Ôîþ/a{Ýö@`aÚÌ±¥ÐÑu+ž/.ìt[0Ê|
ø(ï¡Yì,ž0æF!òÞöÎEaõÌ`»^­áñ8éÁ~ ”Á<ÅHöðß§ L+ÀÂL¢$î¢˜CH;:N¦daˆGDçèŒ$§fsª4»µ=ðëŒËŸLŽ®œ)<|n
já*ªÍ‹P5¥šó#/Ó,6fá\v‹¤±óxVÊÔ»_ä«g%Eyóf…pOArßjø3ÛU3^È„ww˜;ó·Ðpl«z‚ºKD¶þÔ»¶ŸM—‹Ùô ‹EX*Ýô¥Û^¡´àúŽµƒP¡…}ç—;ò×2QÕ¶ˆDgÃÌ‰TÂí—æ·+	˜šå–1ËíâYþ‰²Ýq¼þù;R­‘´/ÚÑßgé?yÔÀ•ÊÕjº'< ë1Ó9·—ùMŽòË{¿íü²1V@xÃ áÅ²©ÊÆCØ<´µ}ŒÜøyC.v/ð³ž,•à”_-Á€–wxÒ–¿Í·È}¾¢Cåào4U‰éTõäidî>„Ÿ9ã2ÅpRºÝ3ÊUóÌòÊž\y¯Nü²Ê™÷;ä—?k‡;ä›½‰ãïùæª|3OÁpÏ7ÿá29˜¼³–räžw~¾çÿ¼óÅ{ÂçžÏ÷wÄ?›©	î¹g‡{u‹ðÎ‡yžäù%^uô3Ì*òoÁ0á>îGÎïyäÛðÈÇ÷<ò—À#ßy²“CVØêžO¾ç“½ÏŸO¾£˜q÷\ò—Â%ûØ,ë,lÁ­Y‚OÈ°Ô0a¼³@Ú˜…y ÿ´L÷ `&<&8Úþßgñæ2¼Ö¨Þ]Oé¶´àéÀ}$»ßm$»?>Æ¬ÆMóKÀ‹ÝÊ5ß9žŒ·¼%Œú®c#ó«t~Gž¨ãqˆßûÑ\œµ{úH­Šçf„Çß”»µ0.êyú ÈÙ¡wÓàã§¢ëtk—$zÀéîÃ?ãl2“ñQ?:~Ò]=~²ãk€é÷N5ÕeUYM*!{Mó—ãd´G7œ¢jspC³<±6Ô©àlª‹µ'ÃjißLÍÑž­JR%•ïôžîGí¶Ä4|ZKì…*	»‹¢FkÚ›k?´ñ°7Ã@W¡ñ[•ãøWblñ…}¹›À·Á^žÏFLùø8ÎgY<éÿ#M®s¤_be0¿@ÅþfƒGõÒé[|¡^³³xÈ]v©F6zH/`°ì×#1vN Ø[uãF{Í;c%po‘dz)t0…™Àoi~8›²	Ò²G0•”ªÐŠóc%ùâö?¤¹(†ûÆÿº`Æš8MÓIrÜdÙPÒPü4EÇådòNÿÖgß1È`…á^ù¢™ÑX
@`ñD.&¬ID‡èqÓG³ŸH/=}üÕÍNdlÎNtÌþbµÅ>ÁköÍ·ì`Gh›; 8îþ©÷já]cŸíÀ(&P†ŽÞ‡,íûwK[Eœ­vÊð«Gÿ)W.N#¨€2g°ìI<òÀ6 ¯
zggCÝœ‚#Z#øµ£Ý)´V!dÞq4#»¹¦¼,GaÖ§æ˜uˆ=aA-°U@`B-{\šƒN}—@êg?¾VÑHÇtémêŸ8Æ>uÃ.Š2­÷)Ò,5ÂÖ89à¿ßÂ›å	'ß©Š“¹;,Jõ^ËŸzµÝ9ÅÞ®,ªç³^Ä™: f=™L²I¦/â‹DMŽOÿ@SÆÑÿc_]å91lrÿ4'ò§1:ü5a}>¤“l„ ¾ß0~êÍ‚0G…­Ä—Zf¿5:a³Žô2Íâá³Éè)Ê+ÔÞsã•±âuŽ¬¬ç¾™Ä)Ún¨Âóä2k°-n0s‰Z”íï¯PÓÐÔ—ìm¸Ë1pD]Ä³~šaë ,#œ.à;w€-›ÑêËè@ù%ñúv«§µŸ’Z3‚‡×øïáìXVüë8Æ€Ç/{ÓŒÿùxBñú1  øûßqU'ÔÈ“äl"þ~Ozjy<I‡ìÍuí­=Èót8E™P#5æPÙüñ:ö‹(Äf¾qGIæ[Æ¡Ó·ßiMpÌÝf5ÁË‚fc¬’9HœÕ#ûÒèáH{Z£4Þ™Þk•w(šmçÈ6âftFSV×ÆMþøò¼·é%Þˆ¿å+wæ”£.o`ÙÍ‘7#ÏR4µ&]êñZÏãq`ƒ8ÈÅcdNß'×Í¼Å¬‹Çñu®°é5t¨~1òÀÂpÛðpŒ‰ªÑÞÚy	rwÚ×ûôÏŽÚ˜ÊÛø hîf3¿ùŽ(ÛçÙäÈÛ\aeó¤ù{Q£Çîæ$Ö;õ•ö4;¦7¤ÞQ;‰P¾gïŽYV
½ûzN¥n~ùzN‘)Þ™¥®	¼¢q<É“§£)ŒáZA–(¤­˜YVÿÀ‡mÖÔ–Õ¬©ÀšëNUciºæŠómVÁ÷OGÏùúŒ’«Ûo\06ž¿|qòã/O_<~úèèø”VE¤ëøý<×VÚÉ”j0hUÇÃá±t§o‰“CÀ»|a£€×ïàŸÝ=}Dðæ›oôHbÌ´4Ö`}cþAÓ@Ë¿<“$ï£=j‰Íàºá)8â4aá_
XèÚã¸äpI·Õ×ê+7­¯çýÂïì^ÓÇ€†'‡JZ4XyóÕ–[›o6Ô~õãÓgO_½zúâè—_>{úøðçc@S½!pyƒON›4¡gÕû_ÿ=­™Ñ6Œ­mgù ¡/³)oL€Ä9£ÿP·|Q?`>œbCt|»ÞÁÑØo58‘#,y0º¯ÔDÁè3”-@=s®œÚô!õ£}s0F`m r`7QŒƒÉÐ:0á“4ÉŸdq]<Èzödr=Ó“!Ð_+ÚÙô¬!±Ó¼R þR0õåLÿ¢í¦5b.r1CGPT]ÕÃ­ÈÔŸ"eDiW}£sÏÚc“ÊÎ=Kaîš-[}.»ÖÐì 1ÚX¾ÑFÍBXb)t{•³iøœM’ø½QÊ|·žd'ñ{‘ËÞLàbÌÓwÀ0¦½¤¡fÔ4f§õ«àO ?0Èà‘˜«½ÕÙ6¾¦úÈÐ«ü‰‹®ý$àSAÉµ¡^j'¢éNO½2¨•9›ÂÉ¹Á4[eƒoJsèá17‚ `	9kOÊžRö²¢° j±Å¼¡6¢Ô—çOÒI>URîŠÅ¸œž3>ïœ@þ…ñáf6ÒÎÇÃtÚ¨·€ÅAO1®/°øþÔîÓ>ž8Éu4\HüÌntnðâ(Õ|gBdÃ‹©C_í¾w£›  À&¾Fý±½*!U f»´PÞ†Ø©ã ®ï“Å©ÉúãI6ƒüðr6­“Üâ)s‚úõsÖy95Ic—¡¥lF<Ë™œöÙîöùîöíÝU•Köt¹]ÕÐµÜ4 TÁµö¶oï­“€ ôKw·`ûîþ)í‡6Xç(´­2Jä„´cÏLƒ(ÜÓI'!¿ÿl22´v†`+Jˆ°Î5É*—˜C(W1:T¿‘“e¡=„¡È©ZÒ¥^VE-­¡Cjhz#GWôîÙëÑ×sÕîM4Ê0ÕÕl„Á˜¢é Í¥ ûNê”v¸"Iôx’^& }iÑ†@Ú›f´¾¶¶&«è+ÁK_ã0%¾¢ë|Ï™ÎÊ"ýzÀwfá?þ… úy´ÅT¤<¹%Ê[Ïð	Fû/Çx*'C_+¾ŠiidIC8B¦éçß’ë“Œ)DH
Õ3p‰XñI(š—ô’¹+Ã¯¼¡éVl2-Ç( ª"DõuŒŽEÚòèë›Fgrk¦µ&6ú§Ò’ž+!C­ÈŠ‰U¬5€‘ÂètÜaqY^@'Ëji©vBàÜøznMó&’¯`
7+ÀMÐÙ‹ïÂ¹&Â_t¹ÞÚAüDGÎÕÀâ¸A³šúî6íÍlj€«á,ÕÁRkúõœîµLùPÐ2.†³rƒ™Ž˜	!ÇEMx–~r>á²È’¶9BÍÒý&‰ÚoÚ°«/_“è–>\ÿr	ã@õÃÜ°6Ü Bˆá.×éÆ¢ŸR7þ:9gúFø£¡¨*Uƒ·Gçç€Ž=¤^µÍ—šPuß®Þ;{íXØ(€ÇbøÀF N¥¦SÐl˜´	5^;¢ê;€ïáýA›/8ò€ð›OÑ2üzž_@7µŸFö¿6¦m‚S¶Û5'@‚ˆ*Ñe03þ"62#]·12|ÁîoÀ_tWƒ¡ýØRèÕ¿³kÀˆ	ÂÎô±×IÙù,»J&â<QÊ+£…4Àšæ9ðA.#d!‘ªŽúE6=dI*i½ˆIö—´›,+?–å[}ª€eõ¢l’ŠjÔ	Ç²ÁÔWì†Òªý
…ùÊ
È……Dº«aHÒ^Î)zD©¡Fl ˆüÈ2é·£§ç<9ž$ êÈkÇs3í'Da |Hí:Ÿ@“ÍhÌ"6÷Ðo)ª£S’¢Pà$>«Gñ”…VËÆ­	%ß@Õ[AÇ…æ Î¾-/ûp‡vZž ªöÞøüZ‡†JJ²ëV|òñ¹l¿ü%øÐë+þ•!
ÀŠã ã\>CLÖ–Ç$4…Ì,U÷á˜ûõˆ‘ Æ¼Ä‡8"¾iG¯Ø^¢>,¿J§½Â «Ü¼kß-aYµac/ÆŒ:Ø#"bÞªõ`s¢\Ñiö”±Ï°§ˆ~r=Ÿóú‡<ˆþM¶5!IùLøVSZ%Kˆ/—¡ÚLÈl8åÎ–(Í¾±¬“ø—–ŠRíˆGà5O×Þ¶'ñÕ?È}WcNì‘N1µç•r](WZT½ w|Â‚üO§àiøÏxœ'}– Éârïÿ‡ãdºË‚ûû…áEcEwHsrÊ&×ˆNp£0¨á§ÞO^'Ù¥ÇIú¢B¡!˜Ê¯)–ü”Bø?ÃŒOBùvGƒ§S®BP®8Ægér…¸oÇ2žjŸA>Õ}²ÐËõ1£QÔõBJzÜ<ü•^OÚ…á…kV‰¤€©ªÉ45³³¶œ´aARKÅà¥­^èÅdåÈjŒ´Ùèý(»Õ=58¨¥bKV7ŒTj*:23G'‹xYj…‘ÿtl$P3ÀÑÀå­Ù¹ýU3à—7¥ ¬¤U­ và‡Ã¦þš^P;}«@Ìmaÿm	wdé„_/	­×D²V^•>±ü…:ŽU¨G×ñh®·­ë},4`¨mË_µ¢3‰ë­šæ€fg“)0#¡‘p%÷]5\Y•á¡¼Èë"CSeT?¾Äœ´êÛy‚€¸ùðáwJgMîîE5®#ÐF¤·À0„ded;ÝMCÏé²†ÕR§SÔ&Äô¶õ¯™XMu7¬¦üƒ¸ˆ­zPMÔSjÂ42I’C&î)57—V?ŽSü±ôRò#ßOæm4Ià{ÿ·ÌpÙl÷äØ=¥ÈÖîéñKÓ‹†ï<«ðØr¾°úgBømâáŽ5É§l˜æ0ñQïÊœ™ÄívÔœ+ÑŽú*ÿÐÆÇDÓGkL=5¹wˆ	ùVÜ|G\1j y\Áz2jýt\oFsaO¬3à¯¹=±Î/pÕ…ñQ¾PØE¬ä$Ÿrwh}ùõYq¥±Vryêëbmœ’1¨ëÌ89½®04õÞ æ”PðíZíYHÔ>2MuRÄŸzgêìP¼Ã2&ÏXvìwÿóþß×shCî‘€ð›w¢¼³Á_Ib¸SÛ¦þšº£¼SO½YEšÁ„/¶3qÈÉ{rðv‡¿R{êÜ÷+¤8Ò;–[¿!(í<C%c©t3ê«Iv™M™šÇúô	ÉÉ’JŠ[$¢?cýF3˜6¾enüÅ”‰«“ûùÍð1^Q€Ç¼= ¿˜'9A¢'ÃƒädöÙplU†x©°€«7q«±#ÖÕË.Ç³iòýó§1¾M9¼+mE8 ãk©¶Â':xzãá]tÀZr:@~U¾‹NTknGgIžÜIØÕüsÔVW£
Î(%:À+…a‚æZÑá³7‡?#à	rJ[ö`ß9ÔQÎRRËW¥w…ßO²Ç<«ÚžÚßiõ)²S´.ô	)úÏÆ+ïÐD‡Ü•îù«cTaàÚ³¤Ç
•íÊ+a¼8Q†òX‹_;ÇäØµÖ„?åU%ÅzüÚUß»¾ïëêûºïû†ú¾¡}—GÍå•ï£%º‹Ó(N8„J±¸ Dšc”³FìïAœãÅ7áÊoú5±/§oÅ[á|¤T*dÁÅãM¬;Ÿ‰šïÉ3mªt„×’cq?Nû
£:ìMg¼Y‹ácÒ¯ÄjBú	JöIÈøÂ,… „É q±Yb?<qÐ÷ðÓæÜ¼D~¬UÞŽlBŠøVYXÉX£m!Ä­Iø´ÅFM@Éº|c|\ñ*4´Ýafní¶£2{ò–š’½1jv«Ôìúj®W©¹î«¹Q¥æ†ò¥ðAgôlÔàF}Íu0T«<í´9´¯à (ôn–Õì;­Ío¾ùŽ{£ ?þøõÆnºëkºhº{là˜ÃÛôº¯éõ@ÓëÇvŽt¼MoøšÞ4½qlàøŠ5mµ­íª‘ç|ÛÞR–ŸW~¸ íÒe´ªÏ¬g¢£oöÜ&ÌòŽÕzÙß‹¾Ý´‡æm|½q‡¡!8³´ë%{P£ˆòv°æ>“0§¼êÛa—kµÛj8Ûmk%úWTèMJbm«ø®‘9í9…ï	kuêM–™hGY6vWå[JÝ´ÒÕZé­ty+Ý
­¬k­¬­¬óVÖ+´²¡µ²a´²Á[Ùð´òÖt©o³lMx€4žM×Rq¦ÅËÌ44Ý;@í	‘%Ì'³cÀ¾ò-Í´¬ §
ñ]–øoU 7ˆ'S£ˆØxŸÜõ:‰û×	f¶Çö4å ŸiÄ”‡tÁŒb\$$±=_4_ ³ÉÒqÐt.ãðÙ³H2Ê|\ƒøCBl=0,±ˆ˜¨Ž¬®Øîkë#‰¤Åz˜"“#RwÊòGrD{ŒMig,fCíxƒªÓì6×›oWøh,öJZ`JH=ófNYƒ_:eêL¼)6ÇöŠ¶

«:¼]}©ö¼F1QÉ’ÒyAËÉþp(Ml´Ne:,'¡å9X»È¯Ýñ GlJæÞ¡äo¿Ô¸K@Un¨qªå307Œ,’Æ²òº:`P›BQÃZ=PvëéÊŠ³Ø¾%æ’ç«dÔõýõ	»ÿÖ† TüÀm€,ÖÉ®ÐÍ£Tj”¾ËjØõ„zëè2Nñv?÷P½9}»¯Yc:;<(>]ýÇºþcC_Šy_Ð^ŠM£³Î7sè.ÛUÇÝ•mÆéô-3#™|m6ÉB¨ÇÜ·Ü™eôÍâ…ôW:æ»¥`ÃÔ˜P7äR¬RlèEÚ	ÖâQ¿Ú `—KöÒ®^^ró©fÞÞ]7ê\N·‘Œ •ÌÄŒÿ‹Z4nÂdVw®UÐ,`N,&‚Œ…ˆwòñÀÓk«ÖWß†óäm²ÊžV³©ÌÆtÈhi“héÝÓ4ƒìÎŠ0FÝLÃ‰M„Ö^‹Æg’…ÐŠGz(G»ê$²èê2qô¸µ]öwÆØB86®ÝÙÌýõéïIvå„WgñJ-F4*Ú£‹Ïòl8›2G¡µˆ\…àß«ÖÖF4Àÿ™•õøç%ÓÆLÕ¬J:½Æ­Ë	þ™â?<8Xˆ¬;‘Ã¨év|¯ÐÎ²)¦]VëœjÓ=o¬i¹?«iˆ¢[—gøOµ!ŒNnç?±9ë<qw÷ãÐÎ±=è8q„°ô÷üM`ÄbÛOâÞ{ |­)™´(z=Inß$CàgÉqøÑ³Ããc³ãÕAÇŠ›µY AÅ¸0/4ŸŒp¢gÿ1qÜýœÍ&º{O8&è«ÈÒ˜h—_`È¯s€Ñh ¸.ÍQ§ÝÇ¤ºx£4:»æŽùHÿ¯±Y2þEgñ´7@'6ÞrŽ³6®"Y³W!çî1›öîÒG–ËØ<|Ež/Óækß¢|íz”F™¹ð<áÁën _4É´/øcÇÍÔ.çÙ¡7ììÐÞCkz×¯®	ÜFœÈÚþ‹,z&6óH\Æø9™äv€\¶[—}¹Yˆ|$<;ûCÆ '‰j¢÷Z4ÏðíYr‘‚ØÇò–Ã„˜YÞ 1í#Ìº(ó<NG‡}€›h/òð+DÿQ
¿GñYöoø¡GŸyo´kiÊeWTäê#§W	^cuü	l…éWEdömðxå—e´.Ÿc9'¦î†sº–DÇ¾t#YLLC»|NFÇÕ¦ÈWž†ÚþÜäNûÌR÷‚ßÓ¨õg½xšM€âw£úÊéÚ[o.†‘=-œ¬3éñ‰†4b-Î¨±`01ƒ3ãú¿Á×$3^ˆa!»Ø_î\ˆY3œ{îcáª‹ntMØÎ1Â£¸º±”­0®¶FvL4.þjöÜ†z-EþXÚŠëíªbÃÚúü&”moJÚC‹‹6_0/ÿ‹7ºk{ýŽ»ûw`ôû	'H­_°`‚Ì}òÿûëèéc(lœY+¤®uñŒWù%FMúÊP9bm~ ½©³ÀÖN°G‚ªP´Èå .ÔÚ‘Jª€H¼ë8¼…øÒð%^l$±<”AyçL—Ñ÷ñäêÌ»ÙˆLNJ-dr‰#¹ÆKC[V!@”]Z¬dmÎ	Ñ"çµÃ~žv`bãoÅòqš[“}Ì=ŽZ,:Ú(½DJ’¢Ò´OÿæÃ”þhO@bCY²õgÌ¹3r™è×s[—3M°âï»Zhrb,ƒ$Àfl&‚…H§b ÐljXžàÌå<¼¯p»ø5ÛÎÚ¢ì}>˜¤£÷ÀÉ‰}Ï†yâË%°{<Ž'ï‡‰`ë»k.ô+2á~Àu8;{;ðCàƒ¢ÙxœLzì®gŸ® `r.ážv@QB7v…d^q·ãÝ•ŠHWüYÒ|œ/÷…¢…µý¯G+¨q=µ£ÃáE8 èMM[6h’pË][ÈÎDää…Còm+¯m‘!¸Ä¾w·&Pª€5˜Ó%'
2Évä‹Úë#WË YNG¾¬	zF»dx®x~úE<…<	€7ì øp°V7]Þ±ãDwrtËm=Ü´áA#U:Y)8Lò m‡Ãñ‘'ØÔ¥ö´‚`àm±Ìò¶O´ƒ>±¿Îðè©Ïu_I³˜¦Š‘ùø	ŒmŽC+
Ü7d7¾·¶8<°‡ë	ó¸†3‰™->1¥‘:D)ì'4ÐšDÔ”ÆjÁËi]J(¬ÍO@
uf-H—'†ÅÔPg*—#‡þ„¢( Æÿ¡`¼Ü¨Ø÷3I/ñs…ádœ2›Þ‚6Šáq|bð I¬JEÛDÎfJV‰èÚ/¤kÜEšˆbæœSðÝ÷±î>*™³0ÓYžä^‚X9K5ùÈÆ%…’QJ#el)[[E?©±Åîå©Œ+ƒk#ZílZbw0U¹$e¤ÎÆQæãtTƒí½B™9?Gˆn9†ò³•×£¯4os%Áª™Ž™sò³,î·ûgè~¬§:‘+×øk.ú„¤ 5²G»Žc# E;>kiJ`|qýæsÊ“Æïó‰»X¦,“ž&õ³/´ŸëLgç ð¹gÉñæ©u[=/ŸG±Çr.ö dZ3¼ôv-œ¥0 ±×a§‚¿Žþ8/
²"k‘¿žcWiƒD»÷ÇëV’dÍ^½®£(¯pÞi°$âã4kr4iÔ^7“MijŸuÀ…žÃ#J×cõƒ¤†ú‚÷0œžÕ±bÀÑ½
°¢Ê`Ë!úpJ'±×° 1?ðð²M1Cïí%ÞWÂ	Ü*êØ%÷§‘°Lƒ
{	ãˆ@ç¸“H¦þòÐn1€Â$ºóÀé8¦õŽ<9Ó¥¦£}eSÜÆ)Vb­,ŽÓáQ¿Ö&B¿¦)'‰ÊrF ¨ù,LðI·É‚‰çõÅ»ÆŸq™bDtj‘ØÏíÍÅ—ˆÕ$ñ»Lo¥î~(YƒåWÍŸ˜± N«#‰òƒÐšLâ“®n‡ad^Lmˆü±L~3{	z))¡ :Š¬˜±Óí‡‡æçxîŸu«ûâÓ¶âA?P;ñ(ªG	5´=›¿‹”‚°mÔr&rP¶hÔ×s}²QÝ´˜X¸¶žô/ºc‡HƒD0•¤ùT°HÚÌÌcíc
¶GUÕ²ŒµË6•=#§ùï—<h5A+ˆŽt±Ù"¹A*gm¬%5ÙBÜ×åë©FiÙAÇ–¿•» 2€¡O4ÎÿÑ(ÎjÀ:W¯Ðóï™agÞ¯Âù²Y…½õAÈ·0„²Þ ²KJp~Ç<SïÈñœçÅ‰Ô—VDŽztTxíXEmÒáÔ(Nñ)VÁÖY	ñá5³"ôÅû`÷Y¸Ä½vƒnñÙûäMÚŸöæëíÍ°2k3`Ì4Ÿ^BM/ÁQ¸c`P2§Z#(Þ…€Úz
?«NvŽ`žC¿MÃRØÄa?
³üÑó*•¢(içÓlüj’ã’r+ßU«
óÑ0C{foò¼*¤Ý€1\öÃO)ÇÇ/ƒ ÒîH[¡:|BâI0'±5Ù8e±/Šïá¨éfRÑ‘M)j+E'ø¨ÆKa°Ò±(<[ÅZ‚›E9éÀ§»á²<ÐŽr+¦E”Ã2Úª£/¯lHß¶*Z¿Jö¹°1«H'(¡>”]·ðØ·Ð_žµ¶PJß¶˜[èG[†Bßìƒàf'÷ÇDIÁ÷Þ×-Ud.ß(°ó¦\ç›å™VRÕ·kêNkªÁ‹š´/,gë¢ê¤‚%l;Àÿë‡îãø[–ØÄü¦°ï³ì=…‰-v©»»–G-ôÕA\øiãŒJŠiqÞ…bê‰fÝ•g|{—,OYÝDÖ“ÀñëÔöŸg£tšM"ÝÎÌM] BL²ÿ‰ûÉeÚc½'ùmí_ Yê½1ª!–±ŽŒŽ`”€ëà Bœ‚ÏÜö¿EîõÃýlˆ–S|yœ]™Ðh#Ï¤é3_2¥Ò+ÊWÐK¢ö"‡{sâj¡:4l¿WËeFÿ¸Ú`’]Í£ZµÖW(ø€dr-˜^«FŽyZÕŽ¿jò1.Ø›ÚG¬Ø—æ¸µv×_Aƒ*‹öTólq¶**ê…?£Ï‡€=s'–))Æô8µaó+Åƒ\1ÍšVs…GA8ˆj£tË1t5ª¡xÉÂ;|=W¥õdšf/"ëÓ‘
a…BÕc¿–4ò´÷L€EfëNVŸ~‚¸ƒ%>ÔâóNã·m-Î­?Üº¿µï=­-ØšP/âàXÙåñ$iP>7ùÓ›Œ¡7jÌxÚÝ áîºÿÈT±MMƒ‹·4duÃääÆÒ.ë`ÛÕ­MíF¡Ë³X(|™žÐ¡*Tq}â©¬Btƒ–70È|™Þ‘CP,]ƒ™cÅBùÓX'´+Ôb»Ÿ ‘Å¿ÑáÆ)„.ÕûýE+†êábaá:(P»Ls9«ÌîÀXZLãíÍòl6%Ëq\9iÙ}Xï@B¸ø6|°lÃ¶Y™×WlŸË„Ê·0w†
f©R*.?}ÌíOsE,Â²t™òÏ}ª€Ý,ÕW3ËœnP’JÍÄ2›Å6Ê¹";\š½ñ¼#:ÙAÍµî[ÊÿÎ=¥Õ–«P-qv·³»[Åù°Œæ:A:ð2¿c¬Xæ[\a±Š5Dþ*²Ðr~ô	ªP5FºÇ/ÅO‹ç|µx–à¯Å³0Ÿ-ž0¿-Y‚2,‡Õ•U5ùP©TeæAÉ‹ŠÀc³§+Ž+XmñQ¼•løÆ'pL:í¨üŠgÞ#«vï=8„ršV¡%ö÷“°Ž‡TÀþÌÃ¡nËOŽÄw”K)uÌ©ÔöçHtæ¿¢mŒ–ªzI?I]ÎÅ©âª4ÔìL]ïTþ®Üá$KôóâY–ÏÌË~‘gæÇ¡ös#à¨é{ÜÕ*tÝô=ŸÇ“å”ªbóR‘Î(,“Èqã	ÔT‘E'ìôž­Wë¢R¡Š¨T<ŸØT±OÕ<@ýžžs¦"ñ:ˆ–úÕ¹ó½C×Ï
]poP6ùÎBM-à'º}Ç~¢¾±Tp¥xA¼{qeÆŒ!Æ¤–þ«È{Ô7¬jèpÉâ·ƒ,¯ÿr'Ëx úž¹pß«æþç{îÚ7Ï÷,ˆ•ÄvÕÓ–ï²ª<Ä±p]÷w»eù"cÐ^¶Î4Fj0ŠõÀ†GÁ"Eî³°‹‘gf•˜ßN¡B§°ýÞÍ2ê·«Ô²TÛwÜ¥@¦–«±ìŠâ3¿­ÏPh)ª»ùŸ%ŒüÏònGþçó9#ùŸJ.Jþ'è¸äz¼½Üu‡#ËÅÒ'“X^J¨¯²õ·¶= Šã’ÿ¹µ;SàYîxáSÝ÷)ðTs‰
=%nˆ¡.b2d_•œ.=ÝUGœJü• VÛç±Ë"Â…—h‰åYè´‡<Ñn=–
Wó•¬0ÐJ}V(T8 ¢ì®*Ýl¨‹ ëŸ¥9þ¤n€W¡Ñ;ÍŒ5èaHþ…”âTŸ ã ÿ²èÅWCÛÂô)º_D8ckË°"‡$påhIÙŒ¾¨ëâÅ¢ú µnÊÃ^®ÐœÑBºéÞföD'¼4#žPþ;¢Óx¥òx¥ƒuoÜG/â¤Ð
NÃÁzàšùý¶9Û¦nŠÛÛf{!~ºãC¸ß¹Š;'2û‘UÇÝ8|Í=ŠÇŸr÷Dœ™R§=Íž¤“~£ƒ¼Sýþë¿ë÷»ZqW_±$Cfr7Õ˜?Áf½i;ûîë¹–IÛß›¿àM®úÚ_‚‚Í.Ž—ècÃ¼áÒ_$ô?$è÷=N1		èÅ«_( ®íJÀå‡Ÿë¶/èfj›xè-íQ9ýÆY¯í?N.³‹I<¤=7ÀG¹RÈXª4z” =¨:÷Žêbà¨îÝÄHßdK¶.£Q/¢%Ü}OôàRxÔ»g7.ãCò
P¥LráW§WŒú¤a—çÐ §©êÎç¿ë½üG2šýv›©å,¹«í|BMVÝÐ¹–^Åsé»þeï;ŒîÇd8~”NzÃ¤xû‹î¹Ý¨ÙÇ‡—Øfõ{&U"<äÒ“Êºqüd{EKhýâèÍÝRPíÊ§HÇb;M‘-¹8ìp ÷:hËü1¬cûÄÛŽá(Èßº´ŽrÂRÛH¹° È,ÙDëËH»q{ a^£¶ïn¿ÿÎÕbQyy,F?.™û–£#*m½IûIô:g°<‰ºgªùÁ÷´"ñ«˜  >¤0Îƒv£žŸo×=J´*CùŽT˜Aõn»ŠÛ*YÈT¸æ:g§P^(+}s#¼‹×åŸÅ³Qo ‘Àîád’]½¦¬Fºk«³Ö-¾uXùí[g±¥¾ˆ¬Àmé™{|\Œu´×»nvFÖaêúcˆ–‰o2‘Eß?ÊBQ÷âñt6AË¦².Äzl‹\»*«ºE~ad¯|Õ–{lF¥RrÐ½8¹|‘M€g*ðNñ5Y¨Ï0!µÍ:ú¿„uüÖB’/—Ùô›8Ç<²Ì÷ãM²\3D?«…!
lMéN„Ãë6çÛ‹’	QšÃŸƒ¹y<‰U©ºbúVÅ·î(òQø›ø$›Ž
¯ÈQ]Ûxiy6ÌÒ¿§­w§e	í¿ªw§0P8œ Aµói€á,É²	FåÒö™¿ø]A‚>'ªÁ'QXçn 4ŠE6ÛXtß2,¦‘cÒ¯ Ob€x/L?^…g'Ó®å;Á¬Ó›w3ÈÀì#:¬V:¿çJeé×Ã8iR«Gøe—»_è‰T/M	†·HÞ^ì ßÔB?–²â®¥ßr-rIèè2™R‹Ð 7WžÔx°_š¤òcY¨ëÚ~pù]tþ@Yœ4[ÖþZÛ‘~Ù¶šÜ Û§ßÍ¶r4¯j
´Exp”<(£~tašÊå96vö¬îvHÌÙåÎZ4šŒ›C´,…(ƒÚYoîPÞr(â–Ì Š±”TÑ‡®<ºJa!c€Öx’	64–Ó éß.…Ï¬ }`ñ:ÉÇ€Y ‚Æ)fÝ½¢Ø|5€ˆ¿Ôø-FþË»6Ï m´y£°¹7ïáw\e†hUaìŒ<Gä5ÃÂ>Ž}M&ñõ^m=Z¯E€¸¦iOÝ2åÅöjÿrÞ9ß<Œ!¸û¿?¦yÈAý·:ÁkµP©ZÀÉËÎå`„ï«–Ã{Ÿ°ÇäÆÚYkÒ¯7ü*)€z¹ªÕÿåáF¼~¶Mé¼†fþ3Í¼Ÿ]ÂnïÍO¡EØÛ·7Ñ ©h¨Ò	ÐÙi:½ƒ”p,R70<õ0ö,‡±vºãõ&¿QkM¿?5B›m„îQgþÓZ‡ÿL.Îkþo5ZkwVê!—ÜÐqÉƒKM!,.³Q6Å˜¥pÃq“@·q¾±•l–”S¡/C½ftjCí6kºÞÔ)¼OÌÂÎ>–mm-ÝVÀ’!Ï½yðJ„fšŠÃlùóUWJ$òy¢ç¯Žàd’ŒLñ¿À] Y8î£Î¢u=ÏúñPãÝì;ñš§@ÏçÛ^óïÝ¢t”'hiø'¬Fwím9•vMé!©´ëóE·Öµ{òE÷âÅ]ø¢¦|61GÉž Cˆ¡p0/r’Q•<ÁSV[nÐAÿ%En©ÒWo·Dp˜0ðÞÕ¸ÙŒp9ª.›¬Ú¡zžjî2VëÎg%Þ:E’®2º”
¾Ö¾¸Ààf
s=¸>ÕE‰áþî
ùÐþÇIJVÈ{bŠO,mïÉ’7Õ¸fCË;bŽ„bÃ›¹`Ë‹í¹î?Þú ˜ï”a4F3 ‹ãq8¶æd¬Ï…õµBˆ;ç>¢ÏïJ²Å”ÂÁ¼Èâ°Ì¤ê2Zö_£×	l9¿ÂxáZ[ûÖˆøæNM÷ÚòÏ¬(K¹Ï B¢$ÐŸ.1S9<ˆÞsÍ¢|Æÿ¸ŠG”ÁÓ¾%ão]_ÄŒé,S¥/î ¡É¾°˜g}‡¨^âDÓþ¾Ïõ<z„k;ÝGÃåÃ•&’< w˜\íP„”|Í²¬a‰ÎÚ
K¶&)¸EØÿñ I¦íwžéïLæ\Zh¥ŒGd*‘—è™Ý}’P…Ü£‹öXCA[*†h3ÂYB¥%´~ôÆ2eìŒ¦bõDé¬pïËÇÞ=BvhèaìB÷¤ª¯Ÿÿê1Kq¼(¹¼±\P©á4y° tIÚÈž*) ;pqÆÏO¯¥’›,É… +;àÙÂPä° ¬¯}' cwy‚ãu(ËÅâ˜ƒhÙµ¼»|œªÔj¨y EÈª{–¼=Y›óíGkìõ;)'Ÿ?cþK—†Ù¤oË$Ý]äÂ“{…I¼w$™¯œòO á›¯¾b1žžÀÿ~øåø§ïÿýèÑÉq´B‘Ú“t˜ŽÓÆÕÂŸGÀé¤ù€ÿzC™ª—ó7Ç½»å¿'°@^Å#he6A®qøj…ýG<œ<êÏz$–Õšøö$éF€ /®‰´=ˆ¦ƒ,ë«‚QãäÙ‘håù,ªˆE'S1ŒWƒëÕMZ,ñc§ƒÚWo¿Ó~ñòÅ/¿ï©Ëþ
&Ï?¸Ó?>y}ôâ‡“^=þåøÇcgŽÎÏÂ˜Òìr6Jõñ>ÏÒxßèo~zç×âÓÉ/õGÆ2éäjáK`yLÀC“>O¢ã÷À@ñ
¯b8ë1VÁŽâ<¾†ÿƒÕŒ§P–Yì”>5˜Í£—¯œ)½Ä¶<³yÍØMÅtv]°úì°[ØÒ÷û<}åqô¾áû¿Í†ÓÙÄ˜ÁŒ›U½ÈgÀx¥8™§gñÿü×ÿâ¿ðë$yŸv2]dØªÞk§Ûi=fp6¹†¹ñ‹Ñ3ˆòJ'ùj€ýBÇIN³Àwo²É°ÏWu—ãl‚†+U–Îjäuraßø;S[OG¤{!d}÷®YtLsÜa*øj’\ÑW’¾Å“é@Û[}ã%¨oŸŽ¦“`Wd sËòl<¸Ž²szóãXcäs±ƒÅ§ž¡âPä1†zÍÆ˜á}ù	¯ƒäÓ˜¥zD{™4£ãF6eòU³r Yq‚¿óÙÈˆYŸÿ#M®´ADÉ¢óˆ9ÎEÊSþâ¨ŸŠÜ\Mzñ˜"Üj¯X×¤ÏY~|¥%¯ÀŸf>t|ÌˆØ‰?ë{,ƒVY$Ñ€#ó–ä§1Ztµ^³Ñ÷À—4¿ºÙ‰Œ©íˆiCM{–;Q¾¿¼L§»rÞõ´_ß'~ çÆ³û!KûûM{= nŠ$¦˜÷¥-ÖŽ±ŒFKþÖ*ïH	ë?)9žµê;þ9O‡‰VÄÊL¿ƒAÈ¬ý8M³…¶÷¾Ÿep#wwô¥v7éÀZ1Ô‘ÓhÊ8UµXV¾þê†1ñžb}<ÄRÀBó!êÕ[ “Yž HIÄóêc*ó÷Y2K¨î+õ[¯¸[‡#ÿ»¨Ã¢Ý¡¥ÿÎóA+äìïAÞB-¯ô¾bÇy—l™XG*z<õþƒ÷“1¶^ûzÝÆ±€yŽåŒìOž6Oßî7x:Ùp"¬ß4àï ­½ÿÏÿŒüT£eƒ}9&cãxž\f]®£ÜÚæÈì§<À'kŠ|Ã÷"­ K#wçÀe¿¬»SKíÝ‡@ÔûPÀ²Èê>¦NŸÓðƒ–À³\´Ã¢¢0‚‡¸ìâGgMI¹|Ñp™@Da¤Xö¸ÎÒüd(½¡Å»®UÅ×7Më°xFöÖ’¬ýðƒŽÚkÊ¨Ó•‡:€dýu‚¸¦ý¯<<¼–öfÃÙ¥ÿiNF¼ÓÍQ€ü]xþ¡^œ6»LG¦_Ï³”PEÚßÿHò<…ß£‹ø,û·üÐîe—u½o¡\M°[r¬€Ñ0-òñÏÐ¶>Zh‚Ùx<°y›	ÒÌ©	ÓI¡=ˆµKÊÀkª°~­¬áÕ²ƒÌÜ“Ú’÷âìMz~­‘qm–h»«	s´)Ž¾éÈòÑn??(òÐÞý;WxãÇc`³'I¤%]RÂƒ¯Ô™GCãy½Iµñ˜@eþK¡½Bœø vÕ"°ÜÍ*«Ý‰j5Ö8çXN®ÇØ#¢"Þ«çsÇ³D“•½º6ÿî&{3–^ ›k¼½Ø.£G+Ý‰N;oÙk3 œÈW"“ ß`ÆNP{r$~y(M4Š…!”ò„ð5vì¾÷Eà]ê¾q*žöÔëÂæd{…**ú$‹ ãèSžåØ×Š=‹HÜ3i‚Ö»¦°ÄÂœ,`À2=_–ŸÜæVLµ'áB¥&JšÏÐÔ:ùG&BÒ’ž3r†¢ªkjI¢ðNl\€]ç¥{`s—š/5Ìx!ÃHÞrmòÂ¡4:lœòsùe4dtûub¿5 MãÌ5öË  'Úq×(¨þÚ¼!ÄÀÆÅ™òÄáºÜzj™½½ë5xÅGàºjßßõÎc¼yyÚ÷ñ™ò›M@ÅÅ=¯ŒÑ;»ÑÐÂ.3ÐÐy 6¢_a(¿Î’ÉµpªÀt>lHþY3ªÍ0
Pm¥É?_¡ƒ^£&Pƒ{{µ¦œ‹Ð½¢ó|³!Ì€=ŠÇù ›6~mÂùƒ†±C’P>|C¶;}K±˜Vn<‚)7ý¬wl·&{‡zóh†â/FÑÛí¶ø‰ÒlÕž<­Gó4ÏC"gÎÐuóˆª·Ç³|Ð˜­xª|§•¶RK5â6·YRük€†Xx­¶b¥o:³KŸ¥e‡^ Q£`“L&Î¾ÀÜÛð>›4jGøOtžL{$w±Êï 0`:R‘k©aˆ†BM¡“ÐôŸƒÂs¦cvÞ qH’Ù“s„üÕ,âwtæfÅB VYm:ÁõAŠqˆqÝŽo³9·OÌ»poÄ¿ý   ÿÿ QÃÀUxœì}ÛBI²à»¿"­ÓÓÓ’@l,Ûxemf0°@÷ÌÖÛ.I…TÇ’J®*†Çý‡ý¾ý’ÈKU^«J\l÷«g°T•—ÈÈÈˆÈÈÈˆÁØzS/˜tÈ`Eþ,ù5ö£WMŸ‘ý‹T«õG„~..þæ£qÒ!íMñlžˆg›kâYâ™åÂós?ò‡§~4;ä¬õA¼XÌ(¸˜ýó`æéÓ›•çôßØOzÃ 	f£½am¶˜L²ç{ñûpèMçþ¬vîMbŸ¾ºyþþÂYœ±7Nü“E$ä%ñâ«Ù€Ôü9ö½AÒ|FÓÞî
y¹M®i»~sùøl×?÷“¤ÆûÎIíñ9ThÎ¼©¿B"?YD3öŽþI¢+Þ+ì¨WÒÇ„x@ÎpH Öùƒ$+X'Ø>ïB|“¥rw8uÕ
üßÈäàØì7dà%ƒ1ÀEa”ÁƒH
'~“>®Uzø‰½/ ‰YJ°Z¼©Ã¤F¿_È`âÅñ`çeå¢qSEâ¹7ðW52ï7ZmÒ5â‰—øÍ52fq#D¾?«lsˆ´v®?B‹qø¤FC?jôÅÖN{š¾ll‘ùü™;ðúÁ/WÖ9Ÿø—ôOcNð1ý…ä¿qœ_5ú~rèc7âÄ‹,Ç~ú³!yóÆ½axÑˆ§ä§ëØŸ füá	üÂyEªÐÖàÓIÂ9ŒõŸµ*éjäÁž´Öª7$üâGçhf‡þìãÍv:·:½>ÌÌÆÍšŒp-Á¿'dŒ 1ÁlŒBÄeââ2¤÷'‹¨±~9!!`?H®°@c®àŸÿ™‡Á,R:³pæW¶_¬n€TLÊØBme¬•¬B®ÃÙkoð‰üü3'–´‹þ"I ÊC`³	`ó%¯w£½Öab |…¥Mÿ2I	mŒïú£ì	<=gPÈŸýp2dU.cXÅÐ%Ðã"úøk8É8ê0Š+
0Ûh/º°R.öýó„ÄÁ?|[OnÈê6Áa¨#_eC—X‘jÅ¾ŽôÍŠ
€¹[H,-XtDâiÉ˜ë„ÿd«O,BÞJZÉH<Ž‚Ù§ÆZÅ@Ïë0ü„Üšc§½ØÑ£¡•Ñ’=!¬“)p¨>nÉµ)Bèè‘$2r`ô—RE‚ëÐÒ"!; 8ƒÁb²˜’pvŒ‘‡„cv¾:nY@V93€:k­Í/?dl-ö„q¿6r¿µæf:“Ó¡6O³\Ìç~4ðb_¥t•Êz¨lŸø	J¥øÅ*BfL€9Oðpn [„ìç”L½ËÆEãrbCâ{oæ|!zâ:EÞ…Ñ ‚É¯N@ S…£zNe]Œ‚P˜D!¶ÂðT_ò•m‘¿¢¢ê;É8ˆAÅ «7€ÚôvÓ@Ã¼€~u®ªþL¿\¼(3°Ð¸duvùBíèú±.… ìƒÅ´ïG5íM±èï³Ÿ¬¤ÕUÓbgÅ3®I:’úqihF©½4(vD'MRÙ¬e3Ý.‰¶r7ºdPd¬‹M\mXû{’ŠƒìÙSALÑPå‚XRÀ2'‰oR‚i2©Äu"P..Þ"	U‘™±MmT^q4YÄª„ÄN9‰š¢„¨'÷LlVOíq26‰qö½	½7Œ‘nÏ>”$F	duøÆ™®Óó‰7¢ ûdŠdóƒ¦–¦)M6sºbÓIÎ£p*I¸r$¦è3’œO_pfhWý+LP<$M/ÙØ¨¢ŸêøLÁ;Œ-Iž\¯þ™ìüz|¼·óëþ¯ïÉÑqï¤wzBþ¼šAt-dLsâÏFÉ˜¼|ù’¬Qž{Æºb0mmLÚ'š›ªlÇÓlÛß­T!¶1T75¯qÛ‹—±]ßÙÈÓ*Û’žÃ%hã¶Þ¡)ž 3@×ü—!Ýìh»È)§n«âõ‚õdyCÈo² bf<‡û63s©ã˜ÝØ› VÍ§ìëXë×ü&¨â#?iÒnVìí9†ÃvpòÖÖÔÕ$>$¿N9OªGÑ¹›úÃ`ß‹¸á4µå©Î¿¶Ú^ã/TÍ5³p‘L‚™Ï¶–1Øhçt^Š+2b¯?ñ‡Ûœg0ÜPÎ'DX³Ù|±ÊªÙÛ¼>[«“V´ëd½N6êd³NžÔÉÓ:Ùª“gð
_ÃûVûCsêÍk#œ“ŒT ?ùW@7)-Ül_ørE*DøÑ¶Tþ¬Bñ#_Øän>ÞäC»bqÐéø-,Ö¦3km8ö?2¢`Hðò†¸ÑBŽ˜ýl“ÉHú¹N.'ÒÏ¸æÎ??ÇúÅ+q¶í—ä)®×¼2/^Âä8µuÑºtü$Ws'+a#H’ÒÚËë@QW?†G¾“8Wx‘:ƒjð³ÖUƒ ‡ó£¤V9ÅÞ6Ø$G*{@<Ëú çA'ÍŠUbÙêh~ìã•µ3&õÞg™×ªÇþ— ö‡ä¯(H3¾^uöÏŒª“/ò2ò«Ÿ“ÍÀÐF6KñNœøÑZ[•ù¾{
ÿ½ýýä××éíœž4Y½Ý¢Á´Á4ŸRÓ.µƒR›,*µz5,n…õØ”€Ñ®—*õÿçÂ_øµêÔKà¿‘w½’b$Ï„¡‹v4C––hÎàJ©Âð×Se•«žÓ¡®zŽ:Ò%Ö‘¬ˆTöLÐ¼•ª™šIs	ùQÖà¹Þ&cü#Û°V%›gÂÄjƒj¼ø†®Ž·ÖhÓœ§[=ó ´™LfêªZë˜›Á3sœË¢&±ŒeN7ëÙ1¡¿‘6)vÜ–¼ì£3àWäÅ~œ RNoL‘Bãy RV¶þÁ’}ñŸÞ\yæbc9se7JoÇ¦]hZÞàÇÙ
¨º9˜ö¯³Vxš-lšPsÄ\#ž-F•m@`1Èw&d ³¼`od=#ŸxHÃäT
?ÎWÙÞí‡”þ>¥ôÉ»²ƒÓ’šE“1,x|Ñ \Ó`@z†øûÞ‡¿ßR‚Ûª~-)[ Æw/Éý©y“á[”‹A,!ËE•ïO˜gƒÑfSyiq.ê[ä¹ëÕ÷ Ð÷½«p‘|ï2ý ðòäú)žaá$xÜiµSÏ'Aò`âÜ|c1=,ihµ[|·žP¤%ÜAG(¥!,¯<°v§ØÉÃêù"Úú}çð¸—Jb—,Õ%i<ÆÐÙ»µ
Ñ¯(Bû“…ÿõå§uÁÞBvRè—œ´ü-¤æÝdf®ÄäCÐfNtiYI+[¥õùÝ¤ä}ÈH«/Œ¨5NùqGù(Lžp¼›h<I¼ÙÐ‹†”eI^µÖfê²â”9BÐúÂ%—”ƒt“óCþw„§Ç½ƒ·§ïz½ÝßQ*.-ãq„â÷)Ã<ÿ¸‘Ã¿„Lä5¾/©˜C›AØ¥%#¯n‘Ž7ß^:"ZPÿÉRÆáo%"“ˆºø3Ÿ
±‡•ìXäNÖ%:FE!ðÜé×‘¹µµ™H}ÑeóLia6ð%/yÆ‹üfÎƒK@p0ƒòÔ¿þ–Â‡bê7—á‹iH=w°}mˆÁÈÜ›¼¼¾Žó²frfN·J±–YÌ¿’¢¦4¹­IêI™ãüžòE–ÔK(uu~­#`šôB@<UÙ¯îx½$bê$€‚ ßšÏ6ëµË"+­Ú¢õ,ÕLä•ëNÂN*ƒ„‡õ&›Œ2!)Øèzæ†w¶ö;:\ÿ¾¢Q¿¶V§ÿ5[+ta¦^-)¸ ‘3ÖÖû,èàM¶_ONøéœ—.²Ž­«ßæVÚÿ=eMìâ÷÷áê¡Z™Í'ŒvlqW}™LfØªlz_å¨Š§'ïx‡›ódg&F•Ô8u„úh/Éµ6ZPcöôŠdD¬Þ¤›+?v±\¾g(Ã4Ía5ýötÅªœz¹ýIÒ_™{YLu‡Œ`s5‚â{Í¸íÁ°b—8Vl•XW©‹e¶`¯˜û(²€qãìÉÚ—ñØmÆI8ÅëgádÒ÷"Çâ±9o¶šúÅ^~âõaßSÖÏòé L[4´…'GûI,÷l›{£"G_!4eW¥ú6/^~UÚÅq~ÙØ¥K»9;2:½uÿi;Kyz_þŽKn:3kŠQÁ,œïvhäMàmõ.ça<²NºQ“î|Ž7yƒƒyìD>“ 3lC·iöf³ðUµ%+tä´ÀˆÍÔÉÉ<¤ÿ¾ó½I2¦ýÿÍŸLf~ëÈ²VøÙR|iPŽÚ½h0Îš €ìúq0²ãÄ¬QÅ–
/É©?ÃtèC7/ÝðßÂèÙ›Ný(N¡>[ªI‡§`eÛñ"¯ñBYã¹qáÖj{[žaßŽewcœwó©ï`çpm =a…v€ª‚!´‘^8Ø¦þÇNçå<~…çsHè~×A«›ïËµËù´ãçÌôåw[kÆåñÉ9Ö|ß·Bb’EÞúÂ…6Ð©}çÔ.÷NÛÍE0LÛ,dÃ»SÚñ ¶yñ|â]ðûŽ¢©¥M¬äAP86»o<«ëZþ´žå^ZZ3˜Í9K‚YØ)ô®)%F=ðÇ°®ý;€ÿá_zÓùÄoÂ)©íûÉþÄ›}¢—Êf!áåVÜÍþXŽwXŽÒœt´I¹•jÙVàÇq?ÃºÃ²wßØLÃ¹;y¼ î–N¥,Ím·ÏÒm6$Êf>&°oê‡¹2®øòº;ö€íö:¥ÞÂÿè<7¦¹õ,‡Kß›ô(ËÍ¥,·ÞÅ;·­9Ïa¶ŒËli¿WáÉãõì£³ðKn¿8¤Ì9vû§:_à!a.â¨UDê“?Îó¶Í=Ys»fZâß,Õ2ìQ$8sûq¼qxz¡3’`¨“RHÜ¡
ïãºo•áë¸¾šôÎr+]_“‘õfHÛÅ_ç<Å”¢Ð£xñŠTaïÄøLw2¡f´“ì§ë€ÇåØ–wÈ¡1PÙ6VæÒ%FaF£õM4é%ÝˆDŠw×*JPá«q«á+•w£‡Cµ>©ÆM±„XÏè$½G*ñ[4Š;‘]OwÝ%2ÏaÕÅaÔà1†*åZ.û	fƒÉ‡‚¬|¶“Ç0ÆBƒÿ
¿ô˜ªaä1Ð­Ò‰›s”âQeÀ@n…ßërÏy<+kåì[ôèZM2n¤¤P:üÆ ~r±ë¬!P/$©dõD‰@ÙƒŒQ(Ð_õæcîfg9À~þ™¼ØûÀÀy„P’(üäÿ-&ã—×ëy®ÌÎÌ.5É}þñ”ïfì’¸äWæ9pºµ›ÜQ¸®<;Î’m1‚øÃò'd‰yBfœqP.g3á»õ±[¾âÇ$_kQ›œA´ã›o
¹h´V×Ë9Óìx³o†CÉq/1F1‡3ÝÕÝT)¥xµ34VZœ†Ìæ¥à‰–Õû¡”Ç•3‘;°Œeˆ9²£öp|E	·ŸPê›ŠN'ÿë‚CJ§›Ú’«ÐðQcc£×µÂsu~ò$/«ÆÖÁK	5MµpyxÎ®z¹e›%Ìež|¥ŽK+òV=§‚÷>‹ìÒ!§I´™µòêsdÂ
 ñ…3XÍ+žH6ŸÑÍÝ¯„V$›†¨ÙÎ¬­hÕÜma\m[hWë ,á^mJN¨i50ûÙ!Ïž=ËÙz19œÉ>ÇuR†Õm'!¹ÄskýøÓ5cOT;²N‡©Èí<ˆ7DÅ+^~£éãªùÑuõP
ãÚ¡ç±¹lIŠìÊ=ñè/ÑÕ‰7îöû¨	 ƒ]@˜‚Û!òVoN\oäZÇ7ä<˜jèfœËÄƒ³O¦užçF]¼_]+á‡ëŽV&æ—5V˜!äÛ!×¾-¡Nmž¸é3¾›…	ªéášØÑ•Ô`Áôhˆ¹ZYÍ<4XÂ½ãÅjæƒ–ï[(ž¾…âÛé0ÈbÀý7w:L£Dÿð1¼WÃËÉ'CúünN†®àÎªó¡ÝÈ–†TGçsNÚ–œÐt˜2ö]qÜÍ*¬d×50ª†8W¡
2Ôÿ"}fßZ?¥¸„<ôôÌFDÛ½ ª\Ü¼cÞ¾ÑÉqðó}{6––÷êêøCûîXò‚tÓí;vÝ®´òÍ«WšŒJáG8ûuŽ¾ü½]ÃtoˆWWÉ	Ÿóèìè1¸€Å‹{dÖšZÇF¬Í`Xwë’|·Å:%Õ½_l6›FÓZuT¯oVÜÛ˜³c:4eC3Ñ6f×éžQÜ8´^Àfw‡˜’Á\±5Ø3ŒqSÄ—+]ÂSx	XôVÝWÄ°Ž³°‹>È’IÎT,“¤Bý™'Ì®K®êÇš±b„CsVˆ{ŠöÜZ‡Æ3ó	®mkÄ²†/¿ˆÄR­¥{,+½íâÐÃ-w» ‚¬h+˜b×›¸eT&gh©™»¿óx+ËæÁŽæ¶ðh®„û6êC<¸±•ã#nœè±ŸUÏ¸^–4Vœ.Gw<‡ ™™§ýÆ†yiµ‚rË-µCÐÏÈ1\‰0ü™cî‰ðœÈññízBÁÈÚ¥.©êê°¤äƒ\+T¿RNøD,g%z3nþ‹ƒ<¯°¨³qÑ9&7±Xe©UØ}5‚ïÃÜ?5ãŽóÃ½~XØ[lÔuB,goÁÿ¤ÚA}ÚIÒ5Ëi…zúk»X›}êæÇ|ex×/+„~cvÄ3XsþA,ýÐÜLÂ­Ž·º²Ô-Åjþé,ÿÐÃáåN¡ƒ!>¿heDQ¢'•O¢²›RLþ²áJ÷b¥V\ntòÜäžofÅÞäÞð1¦UÙF:E‹üM'q5ŸfîQ7<Ò^ˆu@Ï	JõPpŒËËäzÄÑOÞ¼Ýäør> ÿ2¢ÝçŽÒ¡[Íš‰ Ä¢^r¿J]ªSÙ4ÛÖ¡PkYDvYVá‰»$­_0p“+«¤E“ïž¸Ûìr9<Û£f/
œ&‰¢1‡™ËX²úgŽ8·C¨.<§K‡ìÿCxµ+I”Vrw–nÍ'×ÉA‡¡4Ð[!ÇÏõ.÷8Òk«ensÐÞòF³èV~¸+¹u_YuxÇ‰éSN5õk†	_êÚA£ê]žË’ˆÍÅ|É©;úÝòhfËÍ'gyæö!ÇOg¸—[ø±L.nLÊŠÃ©Ï.„ðk¯šI¸^`¡Ø¯1¾o4¦2²’ÎðfÛò¬ÜhÈê¶×`d¨o}†p×ë0’r¨ÈÅEþÕZ?çzm¡àŠ~J]“ÁÏ]•ÁÏwçæm97iòæ#GïÏAW)-ó"£Lü9©B@õ7)Ø›°g¦VáÞ1ó¾#~’u¾ôjÊnÁ¿at•§Ôå93æÝ5ËQ l©rå7RpNYL6¦Û1·%»jÆ\éþ3÷-Ô‚Jh2‘ÿy3äºaƒ™dJ:Ýù¦É »¶•
([ú‹<Î[àï(tÛÖ8‹ì&Bjôò}¶ó`û#°ž»¨Wy’±0™”·T)ö¹×lR*œ–SŠ}òÔ„b%ÁhlÍh¬lBbºä"€)GKøÔK‚uàêûÜG]Á0}™ÏS¸	†-ÏÌ-9±ãÎÏçC†d¡í—¼¦Ïù”3$~
õîèjÌ’§×ü{3–ò·ô­LPZŠ<Xø{…[ôµÃÀ”iìV¹ŸX1ö
·è>"Æ¸kÜ
¤û	ãhü®ác,ÍÞgÚ|®Ì6ËŠš.X¾H¶”
w¸u®B“L½¬°³É†°·—Œžá7GMXsþ À]Ù @OÛÂTÎro§
B¬¾ÌÆþ  ïuSïÜÐ¿@ß šX,šÓž³çíF‘wÕDÚ]ý¤Æ7@úì_ÿ²]˜éC^kV‰:É±:4VÓ//ÑZ¶[MøI=Œl©`:P>Õéé÷<ËHN„å\Þd?FYÂ¶pžuKK?ü¡&µ'$ÎÏÑü8!ùqBòã„äÇ	É¿3û.NHòí]ßÅ.¯'íBò]NÚªËÉFAD²ôžH®ËÉÂÀA£rËì|â–#£ ²h9R˜³éÕNù*ø‰­]	vO˜Â¡†@ÙÔ# ¤#¤¢éÅM5 Šæðk¬=ÃC#¦ÜÊFÖ««´;</ñ­&¾·[‚½ß¾‹ÉOaáàáJšö;~öó»˜}aOú#R@÷èh¯·û=€ …Ï¿‘86}’Ò€xð]PAw>Ÿ9æ¤ï˜NŽz;{Ýý½ÿü>A‡Ã¯f”@¦d@}4À-~Á?ï@Åž²÷¦‘Û©H‡çç4Íù©Mãbgok¨V¥‘Þ!ºˆ¼y¾ŸôõYvXÍN¤è¼Ä­Ëmf–Ù èpãpöa%»pB÷b:BfË+ºgPîþI™5Î?tSŠpäo9è§,[àŸ%¢¦%¢*áf‡%î}ˆ›ƒbFŠ¦“‹ÉýwpâB@‚cK¨?¢±Àý$ý”ŠZX&)Ôj˜Tõ¡‡QR+[q¡\7þ‘™¸ˆÚÂ<hÈá[ssi•©*œûEQçž|-®Í?%nÐàìr+¯X¤ÓOþäæ
Ü¢¹¼•9æõ]Š-Á]
õmu SÿPdU±ºb‘†LbUâ#±:"	q:…F
q°º©Ä&Ü,A…­|[Iýµ€ÇžøSRc,µE~&í\Ûa)
üÖ³L…öYN?íÙPžåu˜å»Îr.£¸o½ñ6J£äj{¿ŽcéýµÛš+U²—Â¶‚ÞŠs/Šý½Ybº¶þ»ž°?€k™B	KzÊ !É¤%É€Œi××ëõÍú“úÓúVýY½µVoµêÂµu†4¡ÍÒc Ù§[ø–öuËô-ßÃ"Lé~ILVÑIm$E›¸rî63ªÒºcœøs˜ÁfË]dÌpŽïM›õfNq™Q,`Äïùô†Åžóôa¾ÏüólûðÀÖIåyº¡É©ªkG0¦l<œ?½™„^Rƒ2¹ÛŠœÂ›c§Ì±ÄwdÇQVN¢hëµåœ8à¶7úEò$/¾·+ŽõÂ‘‹°Ø'ýI8øÄ3bAjÉn'Q ú²ÃÚŸVÜé³óO¿Öyô~Ã:‡¹xßòŽ:<g¸¶[Uu;wfŠùeûoQP1Stå§ðä\a‘yež%"/qmÇdY8c—ö‚¦›µ²vß[²–YC‰@¿ƒF¯Q©1VÏ™U†›¥0e·`®"ýÓê‘á„cPûoE¯""öè5«ýÇ WqµÁfG[ÿ­)¶Ç~c ÄoE°"4û6‹ïþÇ ØÌòZ’\S3îÃkÞ+Š§IcÓ¼¬’qý1ÕR•ôŽŽ°º|²ŒOFŽE\“_ˆÂÅoA(TwÇaEÝPFØÄù=dQ‚þlåø±ä4j“±4fJh÷ýš7Ý˜/&±¯ANAÍsÓï__4¸Nž©XÌ¢»Pà³àO‹³)†‰7éå@¸ùÓ’è6a†½kµö~ŒÕÇZÉq|¼uN£œÏ]·D®Ñe;"ùù'‹­ßå"5ë±šW×,Hf\À»æEÒ¸QN—ÝÎ‘
)ßò\¡1]jGh–ÂA—Ë‡u.€Wä14F´Nþá.Ö!µZM](¹W`ÖÔe©>NW'{Ì×(ûR¿v!e‡!fJ[ºŒ4ÃEJbëkùy/Ê$æpÊ¾ÂhãÌëµ4)ªñé•Œs[7<ýÑd+ËÄ˜§…™*#{/A^¢Vz¬-.(§1êE|z‡ÍÇ™IÌžþ‰I}zy?D h5ç§šŠãÊæ»”¸«É¬7YaWz…6ãÙœØÔÅÃý…øÝJR"Ìz©î+—Zz­‹Æ(I[JPÓÙLº\2ð¾”Á €S\£{ƒPdWh=1T&[r1×ËÅÕ ¤º“Å—tÄÃ~±:^7º/gcCµÜ#\LY„¤½ö£+¨yÞLÄJ>)}ÆÓŒ>EàÈÇ°ìðfi"+›¯Ü•ÈeÛE%œ®-¶ÍŸ…Ì³ŽžauìZ ?m5p,®zrÖG›xC=«LVg„–úJSS£¡;ä#æ;`ô{)4k'	÷xF¡%øÕhêñ&4QÙîB;k9ñ	òEIí¯+¥ë¶ÄÙ|«t•¶¨Ò.]e]TY/]eCTÙ(]eSTÙ,]å‰¨ò¤t•§¢ÊÓÒU¶D•­ÒUž‰*ÏÊOeêgÑZ+_)#€ùÿ÷ÿ”¯˜’A«WÑ~,nÛÿ}S&‰Î8wã‘ØÂmXdVï‡,Í!¹óyy&Gý:—âq´ÆR,ŽÖXŠÃÑN·ÄÒÉ_Oß%Z‰~dâhÆEVÆòQûÚ(®™GvÜŸf¼•Â­‹(â™·WäãO×Z©frûh–î`éœ>o0<›¥½“qx1û¨5w£¡^çš^©ýtî”Òì—,¹
OØòtíËøƒ‘iEÝä$¸I°0s¿žšÉ0•‘7…zÌ³­5ÔÀuÅ4ûÞP9"J‚Á§+’„sšÚq]¥”Ì ¾	ªXµ$y‘D
Ërn
UÚ´¥¬ºPŒ?A‚Ý ²•ØmVé-ß«Éø¡»b‰¾“ï¡;RW:•ÿ_»Sê¼fïÔ#æá IÃv (÷CõK’ ™@‹Ü;…F‹¹ÿNeûoûÊó!À‘È©K ~#¨tÍŽ™S€N»ò‘¬ÄB9ë¿ËÂ„Z	Fº¼§<ZçÛýpx%ƒúm\þE9%±ç")”Ìö˜D/tÅc#áä$äK“¯ÌÔŠ¯`‡‚IÍiHóå3x¼µrcC~Ëu¥%ßz“Ÿ•xKqx!ÀmzñXÏ”
0Þ Kv;’)“îå}ß‚ÂŒ=1sä2 ‡6Vhwœ
%Ýþlv\.=Ëë†™å5r×”,rM_Ä–ÅyfÑÐ3¦+g,ï³(o\ÿí-ÍÃFÄ"Þ	[S1Æ>‡}œ¡Çí~Ë¨À9ç¯ÉÐÂhžâŠ„mLßT¬yuÒ§û×š×däÈÎ¼¤Ö—¤Aæh0G0&ÔEp9,§'dÓ·`m®ÛòÁÓPµ.¶­<Ü½&­;)Ìæø„×$¶Ó1ðd]îwûÝÖ\ž'îJ)íòÖ¼ËÿB»jE/dTkÒVXlB±ó€Í•³BU(ÿ1tÿ²’
Fw5Î`€wãÙ\Nï¶ÎóãhNSÊýÕ´ËÛôèxa8šŽA…ÝÊa²0	Rcô7oÉÙN×Ëuî\ÞÖ#EjW¹bŽG´–çrÅ¢|ÖÅ-Ó¸ºÀÓi_ÝÊqn,ÈñÆïAZÇÔü¯0˜Õªub?B.‹¯ÛDÚºO>ä@kæºåÈd—âDd ¼O¶™k”Ê]ÎL°Ÿhºž`‡-ÅJ"1F›Öæ¾ÈŸk‘­0ÅšÌ%R`Ù~º6K¹ïÁwøµ‰Ó§ùÈãµ_è2Þò;]Êó©6œÌév8Z*8í]ðé^lëÚñ:óð]Ì˜'ˆmIÎZ›”Ó3jÝç7€òø{­LŒèñX`X ¸"â¢ØaÎ„ªJ†ˆS
ªË‹0»"d*Ÿ¥ü°ìÖ]2 /‰&uóÂè¨¶AéRóaà  ^Á=VhÂû’´u•›0g¥–Ÿ
%×åÓEÇ®t#A²…L ]ëéE¨?}vwðÓ{1Lð3oå[òFÕªv;¶H-gøÂhÖ˜Ãá$/³nñA²°ø°A§û$Î½AÀ¾†m'ló)žRÿ.<á•/3õE© V×ÔãpÌpác¬*(ºCLñ@wÍµÇy¬ _áÉ+ÎÐÇÕÊ\ñTžo&Q0­­”deÖÒeB>çúþfŸ¥#M‰Û5Øa‘ FO¸yÖ2;B¹š{ñûpèMÐÒUQéÖ*¯¤8C¦Gí™¿£*}k:4µ‘Ú<æ¾Åî‡’ÎYè£ËH^Ø‚11cº¡á€Š˜çFuŒ&À…4j¦ì· åæ+ÊôÛj—ÈõÜ[$¼†ÎñóEËæþQH.·Á¸‹·u¬LqˆŸÜ½c.ßù†k=œíFŸÉ2‹÷>—!½à£,Bõ®Uáw±zVŽýiø%Í’•_©p…œF^<~èEÅ&ø+PyAø£¥´]›±ƒïëösÝ3„È©®!ÔUÃá‚¾=ƒÌéGz—~…upóèÛÅì¾ÿëÁÞN÷tïðàwøutxÐ;8=½ÍY¥'²Êp:…=î€¥Ûª“Ê{¯ÄÞlDþâ‹O^|/><ôè¶†”‘ñ1Ç>æÛñ¢!Šµk\ñq²Òà…øÁË¾§©Ú±¥‹ _ÞT*/ÂïÀkXíßÿcFzVhD³Õ,¦ÔÆŠ¾¦y x¡G7"wß!'&ðÐPG¬³2lÂØÒ—0Êp¾ê`Š@(«Ã/úa8ñ½™	1¼c%Ð³ònXHK6og‹ØßõãAÌEÚÐUê¨}üj{óp UN`U5ŠÊESêpÑ:×Y±÷À”-:+GNž$âÈ’ÌC¸…wÐW^QªTžKUa`P+½É,ZjF>«R[=ûßkgVa•ŠØüòM.ÖÅ\F(Sðû‹—dÜÔÉ™	Ç¨,1{üÂ‹Y”ÖÏÉÒèXäPŠïÔ´€zÛóôíce-…øNXÍù¢?	â1ó·~Õ<û¬èDÑY ã 9 ÌŸÖÛñ'×§F‡–’÷™ýâôù*¥Ï‚aU«Ù D]ÃþØjRÎc›E[ÍµÌX.hT¶ŠÑåFÆ¹<y´[KG¥÷dòm™ô[êÓ±>áüá*Leû>¢lEc¡: â8RÆÜy0c›ÙÊ¾?ä­äÉ6dvÒàF%Ë»'ª¢+|lå!8‰!(qtsá“6Úqº ïzä'Z‡>ƒmåF³¼Ý¨¡…äQ)ä|ƒÒ%4Ý ê÷Þ%uÔ±s4Š…ý¦kD},1ÁÝi:þ]qkI›X—y_B×ÕË¬JšJ(å‡ƒ&¥nvÈ­p”÷^2†
—µf“–Ñ¸¾"¸_*5˜x6¥CZD/7ÙÖ‚Ð¬³– $SêØ¦D&õ£Ha×ž« Çƒ1H½w¾7¤@Ÿ¤?°c*n¶k 12a6 MãØ?gåàË‹w§ï÷wƒ/½‰ÎZÛ54ÝË½x‡ã=çÌr÷t&Óòr-6ÐøÐ$µ¦pq–=¶ÌµYHAžð³ƒºŸñˆ Üú`xXì‡ÎÉ›g¿wOO{»ÝƒÞï œïõNr¥_`g¬uØF½f5Ž©Âû—ÅÌGíö/‹ÉþÛ]Œ@xà·2ƒÀÀÃAò¯°uwýAúý/ÞláE´‘7~?ßßc‚ZÚò<
&•4°9Çj
eµiÃKmß[òû%©¶ªÙ–‡.V:ë†}u5ÂF/åLÙ¸ƒY’Æ¤:d½ÿµ¥zT‹^¢öl%íyCê™°ØæRÁ'YÁõÜ‚ëYÁ¶TÐ-=üuþFc£±n~«,L˜Òoé>k2˜ª™Ö¥gLcÃ¿òÓOþ”ËšO%ßŠ,ç•2‹Á· Púäª¢.~Ù›K¬2Ã“K]g8ú®¼ð2‰×zn}-í[Šâ|±6E$þ×™VNŸ7ØSm…QL6ñRãåá9 Açõ1&KÐãL-Ò7ŠðéY‘2Š±òÙèuÄ¼3JàÒž:´´ª+Ò¾I”£´ññ§kÞÐÍïøUªsó‘Ã²S}:êdfÓ© ›çîô`hrì \ÊÖù–cê]ßdJ‘‹Û*Ê¦Qè<ŒzÞ`ÌÐ—­lYe^*@ôž‹yaÃ Î 
ªƒæÐ»¢
ÍÚs•©t'qûsÒ÷â`À¦ö„ÉAŠOúÞà“ÆRcÓÆ,X!öç. n¬KžS*4åš\eJù–³‹>ûCê%ÿ2Ýö‘W0WxÌ·¥^Zˆ®&6J3‡}Øú|ñ‡¿áU²8§©P)˜6÷ˆqjÞ)Íx[lO	¦5ž¨*FöÃQ0Èôvv†-»‡bÿ2qBÓo`VNüY ÿ¼FcÂTCRKïšþLZ<¸=Ý›ö–Y×€Òqéå-®ÖÄtyÇÅ>…+*óXÖ&W‹±ÛkoEç£uýlNB\»;ámÅÀ•ðáŠÖkœå	Z¢g9/Ò]z<ÿãIËâ% H]$ïÒ»/uŒò‰Ï MX-á…þV!M•0 ¦Sì1œ¥ÒÝPˆ2’t»l¨\Ñ°aÓ‘˜ç§ƒvLÊ›]±B5ÂÃ¢Ú"L<1xºÒp‚	±¹!±òá¹¸ÜIù¬2@+Û&T¶-ÃÒô†CàÜÁPö[Áî›óE<®É¬<aÉÁ€½ùãj—ô±¿ÀÛ„ø€¾¥œw€½Æ4²•7N`xRœ„Ðš¡1³42¨ŠTõU‡íš¬«é*Ó)ˆ]´é×U„@@GCHÆÉÓa§yF½p„Å¦œ{¬à6¡ÀfŠÜ“P(ÇÇ^­gXˆ‰’[–*ükº8¾€¸ŒÃÖ„èÓÕÝS:G‹R.¯UÙ‡i[x#Ð€Å“cŸ­€FÈ>PKä®²·o‚I0faö¤7¡a6{€ö
´1ˆÕ‡Ù¯“A€1ä×Ÿ¼¾7‹½ìQ7òFÉ‘7ƒ.3oFjÝ£•¼Ò»#	Àá‚Q$‰=(<š{sè-ñBRëÅG+x!„Ëf()Îc
+KEb©³·a8„õ0›áÅDá1u‡Ù	gÐvBõýñŽ4ü™ý*nâÁ
|x	þêcïJïH‚éÔŒgá$]ñI™ŒÐ´'R;Ýï­,UE*¼ß“f²{Ô{ÇŽ<wLÙ?_ãháŒe"|¿@=;êF‰D4Gã+xáM$8±Ð;ß›ÈÔD«Ët‘ß†ôN‚›7ª Ž†“ãgCJ—7×°rEý£¬Ã”u$üu6”¸Û’Éï0— Ã°*SøÃ$ªž0
-‹Ë_Ñ9^—¼=jk·Hb[ÏµÏñ]‘èVýDâuù V!A	†ËþY¾ìŸiAµ´ÎNôÒñ±¡<™û'o7µT—QEÄÓwboˆm…ó ~nÀÕ/W¸l…ËÂ%ìq°‡PiRiEˆ¦d|*Å9T,µÞŠm™RíJ”ÐYô^ì:šÖ˜®ª™”íz›®¹)¯RÉ/Ÿ+gô‘¦ÑUœ§s©Z—6F©œUÏÐ­‡|wäb6ú\äó‹_îeŠG~Ì {éËŒrY&à®«Ì(7T¤àè ñé¦ÿ¦îSl·e4ˆÿòÍðâV‰±Ñf}†ã)(ÓZÓáfÓ“H„	ÉËƒ?Ãø%ŠÃˆ¨î×æØê©A]zc2„ìÀ_'>~¬¶íZ~±¹ŒS©8÷‡ýÆL,øÎM1t[»è‹5ò(¹›ÝJß°[ Ïí+<G‹W€±.´GÂ:ƒ÷—#ôž¡®+Ö}›-<ÛDÝ€Øž¾ ËÑëƒRëW¦UF…ÏÓ'Ÿ‚9™…³†hƒ  ÜªXWéØMd)MåP”LOÖ]þò´¤Q¶-Ä»(’¥@êÍ’èŠyÕ mÐÇŸTß~1™[ù©R/Œªv>H+5“Ôü$ 5Ü0Ø)aí Ž >Woðó``
ßrÒ‘J!8–BZÅêë‰[Õqƒ•[o”­LŠ7£:=mPD®hJpY$\ðÁJŠ*×·k#Åk„–ÙµJÝ{l5SËÂ|*ë‹lhÍÈ‡m“:pæ ÕWúðÈ/˜æšÁ¸§ü
$^~Ðµ§LK™Ø&UhV¾2)Tk9_PI¨?1òªI	l°Úúü~Fªœ¬qßŸ”A Ž¹@Íè­?ÃíÝ/ðwDDt¯ó¬Áîö°&ï ©$"
è:²µÂi›RµÂ´ØózÆ™¶SZLý´D¹ ¥;þ£Õ±»<*.BÆK¥XbÆô¹ÚÈ)ÌêÑÈy:{Ð@þpTóó"eÑb.qy©Td¿në(C/ÝÚ_SÎ÷Êö¦CZÍtMØ°õËKyˆ&¥0Ã”Yˆs_iñg·é5jiÙz\•jà„,9±ñm?…ÔjWü²ø? CÄ¤ŽMšUÚÆIúsùFvÃÁžìŠE—hæ‘ËuŒ“ºæ-z‰íyñÕl@Ô»ì°â%„i¸2$&H×ØñÑ²1óÃ°…¬ÚD@…¿¬ªâg(üyáGWµ¬~\ŒýÈ¯UD÷èñòeE÷^Ú³žh['3oC<Ñô.¼€*3€Ä¸öYE•âMØê%W¶³ða8ÀBÖ´<ÏÖ><7*Ä2šyíæ~Ö)¢NqMÔv+ŠO^-kº‰ÅÏù¡,õ7ö¤Ré”ÈW"·Éi'£ô•Ò…l6ƒõý«ùQ¤«PáÄoÂã0ªUzø#[ºÁaãD,v€°®¦Ù²Ÿ×R·z4/HŠîælÝ±ïÊš«z´èù'ôßölXÝ®ÑÇrCÔ9ê4Ä@¤¯a;†×x@Õ<Â)(ôLuRgºö{,XS êTkEsgÎÄ‡Ÿéc†YÞÙY«NÚÔ„Õú&óÌRÂAÕX:x½¥T×¼Dx/ñê€ŠM£H7uÕk–¡^Fé— ú?óºÈ´~y^î GT_=gÕliãŸuü³Qý ÂA}ü¡vµ®Ò&–Â¬ÖHí,…JÅjê§u¹R„_»/§¡3É=gb¾1¢· Ä$ÙL§Ìá•¹ÁÐX¿y“6§J›¿ì«¤J¹¡H«2Flxïœ±aR¿%´:ÞS£ÌÊ:§IY`“½V'^ŸÍ
ç¨½`wM^P¼ðÒ¬–xNÕÉSLiMU„„$™Cïu<úM™›{]nµîDÝmÓ¯ï³YæÎ¿à
Ìš´„,W_r.½˜75-º]= ÁÎ«‘dÄ$‰ü™“)Äl|-m;­¸‰«LÁŒø;xƒ»éÅæjË¶CtW•Þ¹‹ù–ŠÁ£o¢lÛ6ãåð‹ëÄ¿œû"½ç!ÿ¯+ïFÞÇ_;$„ƒê½2!Ãªä1>£+G‚˜PåPVì
.–Í»€ò[À‘°#E¹±Ç%­8¬JJS…;Kiç‡d×[07‘¯Hª½iØbƒW†Tß•›P¡M+á;pÃÂ€K@€Ã:€ƒ^s¬51¦7Lé·rhiVü*AV%µP¥.nÂ"…Öë ³ýá£l•BÑ0Jþ_³nÈû à¯ÁdH„W§pÁ+1<u®S)4þ¬ûS/ú$Ç¸€U/ÏwÉo$Š›DV,Sy÷Y=Ræwé¦v¯ï³±c0€hÑ´†ûµù¨âíÊð§ÊkU©ªVqÕýÃ¿öv%/~Ë€@ØÉÑù1zhœ\MÄMt¼ÿ×![ÍÍyòœŒyJ^ŒwõÜy?ÙþiÍ/	l€°þc~žƒ¶D³ÃA‹ðî	´Â.Ë]ð†ñÒÜs‚.Ç#J6,i‡üÇùÖ¹w>xÎãb¼ša7Ÿ“‹`ˆJúE¾øQ‚.$¢‹jóœç„øéúóyqý ·¬%áü9á ÿt­Ì^•·C“ÜýÇ³o½¿U½1PúÓ5ŸGLõ}êé-y•¥ô.9Cg¤.‘u¦ $í¼–^•B±éì.ê#sÓk[¼_èå•×W§Tu)t´ÇO±¢©ŸeËœùTsÆícÍú\¤žle=J˜%:Ê”E“ÝÁ}Yá;Ú½V[T|eÀÃp”µI':SÛÉqoçðxWOy!%¤xYA5µAŸhY+l!ÌÓl[G­óÍóg¶UgÉ21^fUlà‚—'&ÍHg«Åè›Þï²…‰ÿéúY-AÏŽ•9âž=ìÂ	3´o+,+F‰×h_V~ºVf™ÎñMåNÃÜF`rã|ã‰¿™1ìãÆ6²+<©Œô®(0Y&Úoû[çk)þ7Õžv÷M -Ññ51P–A?U¶í$ãd
H*éÎÓN+÷€wd×Ò~ïŒ‰ÕÖðš²ê¿÷ýÑ†«:%X²$¼0B²Xs,)T7ìº †©lbf!nSÝõ®b[ä™»ÐÂòp:h!Çh`Ñ:
fÿ^ *«]1©€cÐCÍØ¦0ÙøÅ Î<a	x“»PÀµAh‘"’#>|õñá¦ç1»·V¥y™eÓvØ¼~Ô¼ù‰RŒA£óï‰F»ý? ‰Z¥F¡Nrd@üÛQ£W‚ÀfFX³l‡§ûó~ý½6jA5ÏÚcâš¶›«=³0G>mºÃT‹g’ÝAQ*¹"†÷@±”N/Ïüq5Øì„re”ÂõF&ä#ÜQ+›åI8
ñØønZÌ†Œ6.øLôÃ$	aÜj#ÒäéÙT­,|KÈ[«µµ?='bV0³ès=Sa‡ˆofŸ†!GÞ>Êº­=òÐh<álÓ±õ§”(X¨aA*¼N›Á?ÓãpL^ù"˜ŽHp»—¾Èvy©e…öÈAb?BºÕÄÜ*ˆ›Yâ³ç˜pé#Fÿ—§M"Å§Ìfã&÷ñZøßsá"ÕQbÃ«¦$ænï¨·Köß2’Ô2ä¬œ;nùøæ®¸ÏtägoþˆØ?Ùywx¸_ý*+7ÃQÚðÌ9 :ƒ4´)&úëd	Q ¶cŸ†Ò r1r4Æ+sLœÃ£¥n[ëF¯[ÈªÝ¦,ºå­?ÙDåf×Ÿ{QBMÒ Fz5¯ Ï–µÂÛÜ**¸yäðf!ròƒÕnå†üÜ_L&Ï%~yúb¥LILµ–Æ}5Dë¥ÇBg¢_„¤¦éÌD«.¢Dö+Ð…Ð¯-³@8ÙJx’‰Æ&HþÈ'>è QãÒÒúØûežÞ¤_È(º·ˆ™v¦ðœ}Ø3?ªâž/Á¾OzñÐ‡`,UR;yólÅ.ÉÕDÎ.ÝE`Âo?[ïËªËZÆ#è¬ƒ£ŸÚù
‘Kb‹SYŸÚoqKªÈZ3’‚…¬ÄPÚk¦PIm¤O77Ÿ Ò¼|ÐÉc%:T»0Y«&é:ã÷M&ÑLÚ5ù¿â¾Ä¿hþš|nÿÍ°]€ßƒîûÞ=#8gõ¸G$Ó,µ	ËnÌ°ï+PœvßÞ7J­xKƒü?6žôþþI0]Øþå•o»»=ò39ÁÈ@‡÷Í:—Ek­àF ½zPù+†Œ‹F )ú3–EºNeZŽ’J4¤7<¹çífêAIšmþÑëV`5YTA,"dm¢èCM#d6mÐ±ÎR{ºü®Ìæ%ÐµhäF!Âî!”-Lƒflà5»³á)/›c)eé±Ú'Ý¼‰e«¹¾)©“L“®yÎÁå,L¬svëÞè0³ðfÛÜÁTÑ1×•ÔÂYgZ;ü¸!#¦¶b`^Ã‹˜îä¼>ìä±e.4Ü«p‘Á§hìÅ , `ûXêí6Ãô Ó€?‘à&þ…žV1•äö…º÷4ËºÅAõ…??491ê€ƒ/ ü:ôã OBòi^)öäõÃE"ÁúºÜ½¦“ßŸ!‹™1×$ËYJ:›ÚTn©Šs)~"-qaVyb@i³íÙ<ƒtNeìLlÒFØV-Ä,Œ;¢V[°ê´Õzb:m¡]'åë‹ü®ìCõClÍ2bä1V¼
²¾µ/)‹¸õÇXôÌ˜G¬/kî‰ÚÜ“§[Ø\íDp@B¾GQ ³9$4|„Ñ¼Á‘ZÙÒI…ž¸Túw$°ô®Ý~qr3îJ}ÿôÆ¥#Y¥ä1æÞäÛRž¬	¤z€,€­ÇAÛLœÅUÈÛÈ¦ pR%)ªIåž6IßÖí&%Ø3óº.¸x†úÙtò°œº—ÛO×˜zjUñðeÎŽ7’ŒEë6‚_nÙ‰ÅÓnÛJYE³j»Tm£¾À†qÞ(…n¤ãÀËTµjs9zÙ½ÆríõU#ã¯5iÔ-Sy-­¯o´6%¼Ïº	Õ\9œ²J(È0½—2åÚŠðE·ƒó{ÐäÁá9j³n¡v©jºvºeåR˜–.AîšÚ[–=‡¥,¹‹,'8”Dì+•íŸgýxþœç2‰¤î±÷­ò½—Ó}Ÿ”Bh#ºmÐÃeÄnL ½ÜšºüâXÒ­ÙxÇ3cY×±:-æžQZt{Ðvt2HÕãl‚}î¢9—e“ŠÖp·S4ÓºQ¨=çY<Ê«¸ÿ–OíwA¹zì-ÌNE¢Òæ‰´¥inj»„XÉ1ØrWx};Ó²XØ”ï spCÅÏ¼© `àú,¶ƒo$2É.¨%÷ØõÓïM–éÒþ>EÙ¦U9NHëýà„äß’²|w zã4dÖRrJi]ò.Ä›zÃ(œ‡zs—¼ÄëöŠ>ˆ÷f‹òŸz7ãvyìŠyU0*tŒ<\`”YËíB7s^F¾É'u€W¸yMrù6 yÍo¸ËØcmüZ³´`Ü~òØ±´2ïŠðAÕ¡î-&[ñZ¤ªNÂÙ¨ªDèLã¡é·YØ[9ÖŸHWƒx ]k‰D#j"u^²<†¼p–”g­j‹¶£Ì"†µN¬6`½®Ï:ËNÙ
£V{gì0Á/LAeÉ÷Â‚<RôaXºVÛiÍƒñ-icT@²›åo£p1W#Rj1¸³zé5vŒ‘¥âÚûÑy†7Õñ}–÷"KðJÓÑdÍòÇj}k:›ÔûW|1'éoìqïÒ‹íƒAð°pöäucê*,…PÉ›>¯Z¤^NÕ‹(¢ÑÊµI`8TS½‹ø÷þW%šú†n³Œíß6H#R¤áÑˆ¹FªKûZ‘†Û2Bi|0ÀË·ð¼rkÄ xs—w”N#s)ñROð\œFãâ3åÅ”(è¥é—4»*kuÈ/×œÓý ³jE¼<=Î3‡/÷½>ò {<ÁcªjW/ŒöÕ<MjK]žðÉÕXwÄlQÉ¿¤¶z"%tºEËYb%µY‘úhÉ6gÙ®ìƒÇ£Ü2 k³¢Ü¥VÏ$`-vý”ºÿmÑå¨n*] ÎÄÒ/¤{wÚð&E'ˆ-Gl‡"7 Të,÷Mp©õ_Lƒ®K›õ‚Ø.…õÊÑ…Gñ8†-güÏ–ô°í,Ü6¯;¯›…7lj‚½ö:PYÜ‘…MÝ¦D@S­ú/(¨lùäÙ‡Æ™•Ô¤m^ø3jÒswB{Ìy$…†iˆoÂH$ŽÿâMÔ´ñ‹i.´Š’`I¯*î8YÐ+È~¥Q‘‡x£A`Ëùž×‹ï’Û$`ÁL¹qËüçrß¶\æÐ—*£Èl(&%ýt/ÆXÉ›ü ~ê;ËLC{ëÊƒNúQxñz´ƒ‘ÆØ‘› xE>.@ã£\¹Ãòéþ‰´ydmGk,j½ùòQ‰7båõoÿé:Åéæ"q5WS÷qó5÷òŠŽ VLææ÷Q©ŒEõüÉ	ð˜Ö“ÙQ­e¬“ûºãZ«•ùÔ>·P&Xn´J‘'•$¦U HÆh=o @ŠÄÆ ­­‚¼¡ì[Aß^.$Ê–ëR§ã™ãÆDë¼™^ú~«½>(2FY\|©õâ•b£­n+öË‚+d3tZŸX,AiþÄŽtÒ.>^å[5RÃþ¬ÏË©3§Ñä1ðûpFîqì'ð˜${IzòžO:³h1÷·ÎÚßÍ:k£:µÜ:kÿXg?ÖÙ·_gj¬aû:[ÿnÖÙ:îD–[gë?ÖÙuöÐë¬ôBZT÷ÌEkoã»Y{°/X{š9 «¯Æ«ñÇj|ˆÕ˜~]]%4`6s‰#è>¡íºayJQp—È³ EXÖ…•¦ÿ“”|Á_ô,"r_Ô Áï¥"_P©ÿA—u™p7•mfÅÑñ,­o4ÕYÓ¦ÞÆ‚ó°¶¬4#`&eu†ñ™Ãæ¾ñlAçÃs6 Ý¹>•Bvcª‹’µVä÷´F,( |aú;òbÆKh©—äéæó¯¶°ÝtŽñÁ8d4êóÆÓ­Í§,êsÿYkÐTox±¬ÔQ÷ä¤·K½éîíÃWƒž¾9zÁƒÙŒ¤&e§	Ž—:ÛÏÎuÕÉ6N}ÓcW|fs5ÈHd ÎlÌ¬ŒPW=·‘kµskµµÖsk­;jáqüa§ïîêÚ~,íA8¨92µ`éƒ1_Ø­yb<->ùÀýôƒšÙuÙS¹eËIˆ«yÇ‰ˆx}»S	–r'#6èJœØªYNJh1%Çu‰#‡6««+ZŒÆ{áBx‘Ê¬ÌP™Û¨òWD€¢Äi?d“{hZ·à°á~‘áÞ$ª¼6pž6˜´ró€1­Âß!.³ðý Ä4ÝÙbšï¾B\ö»2¹/‹I¦å›!Éeh±!éa8 ©‡}»æ¹~'ÚæÈª$y{Ô%<õ0¹‡©WSjÎË1=/9)u¿Œ˜s®-oq&ø¨÷Þ—Î–#aÉW±-,µkRáýš…ÜèÅ’­á6 å5­—´‰“&[Ó»n§oi¨U¨ùëÙ1rì.G†3&Ú× ý§ky*pÃìÞ¢ÄÀ¶5äÚÅJ£,ØÐ~›‰µN¤¿á?‘–Û³V¿Õ·Fb”qñcVoÔå¯ü°ù<0G{¤ˆÜ•žÌ½Ùn0bÉåME	ã¢¥b§CÚ¢¥\GÞ|ÿÝá3Ÿžp\ÞÒ/¶}o¯·½ƒÞqwŸtƒÞö´%šo±‚»2çDúeºŸ®%‚D'{÷*—®Þ{1t™ÞE I“ñ.?½¦3 'ÊÔò9{—^]°Mm
Ê«¥ô–2:­Ü±¤ð‰Ai
Ð¢$œ™Æ5!A[ô>™-›=Ìqïèðø”ý^÷ø`ïà-9:>|{Ü;9!Ýƒ]‚\àää}ïàÔ&/M™™¤,ŸÄEH^=Èn‰ûŠyô©qå¥’+éX¤õòÀƒâ%"·u#ß3ó.ýt­]šìì`aÍwv×hñn6\á›ã‘²žˆ–äVÎäF÷úæÒ ÓsJzJÕ2K¬û…ðÉÚ²òC2ãÊ©º°ÌÄ\À%uQ£„¹‘Ëk7Xþùf1™°­YLû“+Ê>iþÕ0
`¸ôª¼Âˆ.à%v¸d4FŽt9ÌâNø²ºˆfx0†áÆ€2
ãð<üL;áùy0ðù?UÕÖÍª_”¨Ž@Ø*¿¬Ž“dÞY]½¸¸h^¬7Ãh´zz¼zÜÛi €kÕ-Ž§~â‘ÁoQ&/+‹ä¼±¥ð:ä¦Û'ož)ÑÊ÷½Ù0xs¤5Z «ð¸Ñ8ƒmÐ(ñÉ4É³Ò; U™þ‹bºÀ`üÍ^tPŠÐ+ÌÉ‹UþK/òŸa8Ýn­­aú]/°„É!ìY¦ÀUß„Ñkô ña©(dèäÅªò‹Çgþlœh4¤‡teÉíý9Z
T+cêígO§SÒn­M§ªÑPÕÀZ‰ú€+4k…y\ûµæF03ÿº. 0°x£Ö÷Há¦:ìº“‚îj W¿V‘
ÔsoL®@ßß~Ö‚jT»QàMàK²µœëÇYŒ…qæhßsHÎ?µçî8ûJ1PúŸ‚¤1G‚g%Þð¿1hþ¥7H\Ã¦läk0kŒ"`è*ä(*XÎ–b<lƒA´ïêÁÀœÈÚ<q‰ìEòÆ‘èCqƒbG½Üx5¬=˜\ÆÖ¢ÈòÓÖ^ÛÂW¸z¦MÜ¢kvl´dÏé¼òC')«ÕÓó­ÁÖ<¦ÈÈ½™s"šŠ*m[Q"G‡>ß¦J«¼v«³ÖµÇïaÚF'EðÔnmZQ)ü´,e%t°í}ÒGyiOÐàB*j@–K]›i<
ù»ne_:¼Æyè2s§éxyX|¢wlÉ>’Ë²m×13SûÍW`Pµg×Ö§Ûnc—Kç­§mo©Ô6—%‰Æ²X~MçcÌÅç0Vj<ëúxÞ·®U+ú*“Ÿê/Aü¨æ²±„wÞ×¼ªp(N¶~;Ú¹
18»„ÕA¸é·¬XSbŸå­aíZ˜U+Ò^¬*ºý‹UyïôBËw)™¢„¢ªFâ‚9ê¾í‘©v_ï÷ÈáÒ&;‡û¿¾?8Y!ò¦B7D¥ZQjZ”Y¡a2óÂJï÷ÞœvÈáë“Þño½]ò[wÿ×Þ	ù™HY3UPX›C‹Ð¤tPlÙA{)ê+Ï–g‹¯Çò<žöº;ïzÇ€Ã÷hÉ;ïûîñ_O¬¡·rŒ{9!ÙJeÔb=Ë=ê¶Bešr¬†"È_«¿ïMë|³Ï»QPŽ»ÇÌd¶Äï÷Úge{'œN©ãeêðëîÔC<w!ß–ò]|~ºû°!üâ£Y'T#“Ò¼½#ƒbÖ²šéÖ‡'9+÷xïí;Xº;‡¿ÍÓg»½“½·ùë5Ýä.Øt·a]¯E»
{0=5“¬}¸Ú=©°¬š>ë§«†$ú‘ï}jô}-°¼É…w?‡¡û^DÃŸÓ](+†îºi40öŒFþ~dåÓíûæÓjÄ>#UmçnsÎ½ÛëâìÃ«ó	RA÷ô×ãÞIìôŽO÷ÞìítO)ä§ÇÝƒ“7@0ß‚©ÿt—YgÉÐ »ÓÝí½ßÛÉNtØ<}§ËÀ<ÂºÃRÈ()"UË7Ú|­†ïÝðb6	=L†ŒF~Äß0wöytÃ×ðµvVý_‹sÿü¼J~‘­ßê’îÈVTÕÃQ,êê4ÆÂÏ…M™š”«¼BætÅº\Dxœ÷ëñ~s ‹1ñ©³8ü®!0ZaÌ?ä6Z^¾7ññW­êeq	½æ8òÏ¡,4ž=Š‘¿$ó’û5#>ñ~mõÅ¿¬Žê¤ú{uåæ÷“7Ï~ß=…ÿÞBSƒô=…' 	h þ¾ƒ‰ƒjžÐ ó)óÿR+Eþ4üâë•'‘ÿ%ü$áÄßßYó#)N%¢)„Í<£Z…gô.©Ù¾‡:•:Á
¼GÂ§š¡×§%{—¬&yÒ§ ŸúaˆÑÿ¾ò÷æ"	&qŸü$#FÇ#e‚n…'4ô>ÃÙ¨röA~?õ£‘oiCÇÞlä§…qRÝ	'‹é,†Å-4“HŸ:©…³ô°Xj07èäSš†Ò½wÉË¾÷’q~ÖÒêóíÂZë¦Â#J~ ïzeBjŽÑ¢ˆÓÄ'ƒÞR€Ñ×ùïpŽ«Æœ-Tç^¡”‚Ió$»8s|³½¡¼èÆT%ÿ"U¶ã¢_)‡“‚õGP’EÊ|Ž}ç_²mètÉó\Uÿ£š–¦oÌ
x.†
'{Ÿ–Fõó•¸t!uIùãéV%B)¢›"thµ¥_†á-ÂLyÎÂTê®_TîpˆËQôÜX„Å+Ô½€õ_Uù^ƒEC±­¦Ð}é¤51ð#úýŠß˜éø<˜ÑëKL÷/êiE`ö‚WÐ%uŠSŽ¦ù+pßE½kDaGÙs£c‡Tø™D¥.½ŠÿÙäÒDD# ­5¹RN‡<~,Jáoù½È	—•`OÒ"7u•¦©ðÃ(ø'fG™dÀÐ¢MM £Âè1FuˆÊŠ†¡´œüö"òæ§ û³Ôuhf©Ó%’¡ì?IÞDü²wˆvúÔôqÊ×æ©WW²À¨†o—»É
ÛÁT¤Ê6 û#„e2Šç¸ˆf§T†VèIAÐ9‡ÕÑÔYF“á/´l…ò%„ëÒ—•£‹Ò‰'®6Ð’ )ú1wŸàÊ>vw«‹)(ÅÞ/êìI:U‘¯Åjª$ã`Âk  #ëøF¦gBÄ¾Ü9f•g=±WF_ÙÄÃ·‡Œ)Ž·­ÍõïeªçPg“Í˜Û¾ÊŒ üþÏ•…L0¿ó's˜¯$D¥™FT ò„øÓyrEkÅ©€a°È‚ê€bð7x „‡òZàjB]v6Ó/ó]€‚äÓÒB¿àÅeâÅ×óE<®e2¹V©`tm‰ sHõ0™++Z”ÁC;–ãV–¼öf3NÄ<üÞÚF¢H•ßs¥j72LÇ½£__ïÃ·hïzäèÝÞþÞÑÑÞAï„ƒ‹cˆã¶:á{‘”›‚Œ‡_oZo6ß<Ãáp%KEr-‚š\åáãMA¥¸ŠÖøc¦–±‡@e”¤:l|@e²†Î¾ñX¨SÒBšS•£¨UŒ–ŽÝllOÑ¦‡øéíþ
»Ù½ÃfZ.ÌôÚ½­7k9˜i`¦•™–3­R˜éSBB	ˆ›ê¦Ø;®žd»ZîÃ¸Ó=Þ%5Ø¬@;'ÿ ®Äº4)ÁÍG³íbä·5äg`9°ÝæÈm½Ùè=ÝÊøOåýTŒÉp£¿]€þv>úÛvô·ÐkùÝ”EÌžðý/õ€­	Ð¨ì®ÑXáÔ‘í–ã0êÀÎšÍ&ïñƒÕ{?ñ° î¿Ÿd®YbÍ£àôá-]N‚ËKPf$vÐ}ßë«‰Îêî³^ëM»’qCÝl,g­D™qñ2{«yˆ¼‡âûÇwµ/3‰fjî	†*µÒ¥X8tû¢æ1uHs—É<ãG-yHÏ×Ùòà+cFót–kqÓÑ"ÛX³Ú“º¼W´Ž`FYi¸í á“Þß1Ãgï`·w|?sû—Zd$e¶ûöŽI€ÎyKôûö¸»Û#û½ßzûwìßÌñ*?Ù=îõœPÑtÇ—
ªÂr­/Á×]Ô³óîðpÿØŸ*q¹Ü†–é`Ö€Ã»2>>ÞÙ²#-¢‡õ²ô°^ÀãÖ<nÝÅãx6'Êê¬D´á ¢Ý½ßöNî£Ã íáìôsÜ{{oàDþènÀð%¶·{Ÿlox¯D·Q–è6ì*c)e.Ë‰Å7ŽPC¢3q*Ä^îÍ†~wN©ûŽ¹,yÝ)gEç§½¶þôÉ†©Õ;•x®|Ä*Es×³;¦¢ï*”»ëR+Åyª2b±{Ü359™u¢Cƒyoø¦9‚àézüüå—Ì^¡ÁbX.>žöŽßÓÜÏ@ÎtŠ›­¼Ù;èîªBØÇ¶ó¤·özCj¸°IîyS„ª•\â­—#"^Øºâ°4}*Ò Ñc-š ‹åAÊèÁLh$ŽÀ¾f2k²ô,Î‘†¬ 	Ùƒ¤ [6™°Ÿgœ2†æ˜%xB™lS´–™rÊ™p*¥-”Ë2ù¦î1ÛÔCåšºÿLSšgJ™	mE;“L1ò`÷¤'HÌ^ÈXX
›ÎÂÄašÄÐ¸ÅUÏgÀÙäv?(@äJ<MÖ¤ÿ¤P»Úªé—i¶Sê€÷ÒåÆ÷¦Ýè\WAa¾‚Â?*ŸNVÛs˜ò"^z.cŒ‹uc€ZLƒÏ,Ôr!tì)¤x(‘JsM)—|J®Q6ÓRIˆ>”%Ú0SÔ˜ö8i:+ÀÔ•÷#í-žù
¢ëdÇæÊñ5]z-PÏihê´`ºd>¤£äó•	†‘-!÷ø ©J1ø/r*ÆÔ_ LY\Gr9zL9xÛ,Y 'É‹ƒŠ°{ZëúnÐn=Ò(3ò¹–¹ÈˆDéQ(sÁâA)­°©LRìžmt×_oÝèF¬¥|XG×ˆûN”FUÊ¡oÑ•àeF(Œï/(XIj‘¥ér”£ÑæÆQÎƒŠ[÷%½7»o6U[„Þ]ÉÑâ8•ãä{Ç§ÞÃ]°‘†Cª°pHÔ‡…C2&ŒÏˆR‹c¢µ^?kí´vUèžQèØ,ZUûV‘)!Kl‹ìÑ›o»™oPà½Mÿ”‡¿+°4Ó°¯¦àV—ŠU÷TTÏel
¸Ÿsc?6…:TEø.yù³Ö®ßì¥¬oŠàÒ¢´4Ó1›.C?["~:¡¹µÍ	¦Ë ÚÆàsf5}æl¹ô ´uËydÿ¾L+Ë”Õ˜¯jßÓ¨L‚•%°æ$;èAU£î2q@¿šP—{û2RÙr¤¨F<+i¾onÞÉJÊÛá:lœKÈUW÷¢ ƒ@ïÍúÎSe™ÞfhÅAF­fÅ­³öæMo£÷D2ê?{ÖzÝzMc«ä–hŠåÕ[e›á<#RQtú¹Ñ+)çHZ×ZhùË6-“."ºµœ†(¯2¦áò{*uˆuÈïBvRÄà‘Y^?.}„e­§W®{¼÷~V% ÈŸQ*w&Ôq›ÓayŸ{.•–ý²¢NŽÇFå­ôzê<àõÛrç:2ÿ7q^ê\'+Wï±õÀß|íÀú2R*M³35™éI’ç†®¨–¥·Oä¯ˆð:T.!¿jž}þ èù¼­~ ç,Uš$É1Ë%˜Øe$üÈ£ºÎßl½é¾Ù±:rÖmíáeé>™³±¥‹TnfQtÝÌ2È¾èÚ®hóG¥ïfçŒa*T$=7É‡ÉƒÛrÔìZ™áåé%Iyo€$±²R)ŠÃqoçðØÈw>ïç=È2^*_š)¶ˆ4ó}þÙ~v¿ž¹\hÈyxpú˜ÚûÞéñÞNOãÃw^»j÷ý:†¦Á	Óp–ŒÑ²ÌN’kk˜Õ"ß{Ö¡œˆCú¢~+§‡§Ýý’Gþæ´+N¿RZVA˜ßÕ®wã:“¦ùúà¾I‘A?›$<—kÛÇÁy×]æOÃÜ={l(zïÍÏØD~ò¯(?^ËŽåR ´)Êo:ÃÚ)^G›±ÝlÙî½Ùíº§Jé$ž”¢Ò$ÑÙ9Šü­Öê,áãž&¹¾6Ow™™ìv1½´D%eV]›×{ºîh‰k2g R¾“‰y€Æ$ñë‰7û$.ŠÖš&o‡RÁŠl¸IÑ¾L£!ÌoEj§ù” –ÕI¡ÛwP{Q@¬Ðƒ­×{§
¯o%Št¬åh‚µ’’DgXªƒ>¼[ÓGÚg1y¤Eo±¡,­€ÆéÑûþºz£“Ä‹8±åèFP:r¸M]GÇxÁ¬·K^ÿƒÔvö»è%¹ûÛÞIïxÅt[µZÝëç°½dqØ±¡þ¼ŽŽŽã£::Þ;ØÙ;êîßÏˆìº „é9“ÌÕ¥96ÕAý¥ìR®¹õ¼æ6e…²˜V¹Ê9~åGèEÎoò	G?éMê­,S)úso"×¥âU&–”Œµ„ž4‡ç\óÉšR)[‰¯™¯eÐlc÷½»“æ®i^,K¤èÛ”K÷i¥h?­å¢ÿ´À¦¹©‚bÇ!õ†w0Ó°DºŒÂ`wÅOÉ©Òš¢ÛrÚÅƒIÞuß}Uøb£+q•	rsåÿ  ÿÿì}ëZI²àÿ~Š²¦gÝtÃÆì‘A¸Ùƒ/Ð3gŽÇÛ.¤Bª±¤’U%ÃÑ÷í³ì£í“lDdfU^«J€±»ši#Uå%222"222bé±8I‹£º²x¹%( UDX­V«ˆ°Z&a¡˜Ì·ð)]º™b¬@p‘¾V"ù‘ÿ[ýFoª/à´ÊûÊ#|ã
±¯YçØb*Æ"ò—Ô/(¹¿°—fø¢Ôj8c¦Àú3ömÇÐGè¹lDÄS^¶¥…,àÝ	D§—0mq[‰ÙyfÂ¥]9&b`ìî–j’ÎQžiZ›ÙÜsŒšô—¿ðízOÊ@›5Íôko,î2 ¾Uðf)À±9Ûµ™é{í¸B~¥Z›Êúq
“ÔüJÞpmðýì5ò`Ô_kfBrK-†5E!¬%’G© .1Ïâ Ü˜ã²ååˆEh1f-+bæ¢7´¬7|* €ïÀh6¥qxuQö˜)¿KŒ³Oø¡¯Á!1³#6eìý5ÒeHiv6x8Rs†õfùÍ¦¤cm0¯f#åÁl¼!™“i;ºBC.FN+˜L_Fó=ð™Ðãº±xvœÕŠøokY3k^SÃP.(¼à–¥ˆ©(N±H¡ Ó%ðU~x³0	ÂQ ôÃó±ÞÃÞûñZër±~9Š/?RCrÐ»¡?éJ2C™mlïÂøpâ³{»Ò•Ø¤²s+"¦%ú;½'+jh€¬Ü>H¹)/ÃF„DÛ‡§Ñœœ¬ ý÷efÞÃiÇÀŽE‹¼ü>è*øX˜#õÓª>`á,ðkÕR_;ŽóÉ¡ª QEØ8O(œsCˆHÃÐExJêµ^Ó=„ÝºõópÒ¯V{™“\Y\ØªÁŽTÑ„¼ˆTD¥—®DÑuÊ~‡ÇbõÌÙ^P¿4C?ÞKM¸*”2>E”¡ç˜T$,5–'Ê{){oñ'Ó_Th8¯44ä~n:‹6õ¢-gÑ–^´mœh¯ÛÆSÇºZ¿Ü¥Š’8ÞgkÜ'FòÜÃŒàD}FEEzž^X;÷Grpyþuò”*4P n‚‚‘úA4±)ˆ#jÍã¹ár ¼“»¬Í«¢R«d[(}¾ý¹ípß'Wcx0m¸Þ,»qÚ§-ƒ0ô£xæ-LP¡°"Î„,nòÙ˜*®é-{×F®ZÊK~NèåÒŽ_x¶Èí<m‡%r{EÉ“‰WWþÛ-¡îj‹%x!©J¶€,\èg9Á°ZþÇël$‹ÜœªYUÏ@(²f	t$¨üñÚ¼‹d¤ÚýñÚÌEÊL_ZQÌ=»De7´j¦
SaDÕÆ*c|&C¨~n ;F—‹š™4ø«ÔÌ¨‰LßÆiYYY,‹ìæ¤ÈnåŒ­…RÊ‰ì4Áh&­ò“0ßÈvm.S M¬›OîN•¿<Å´
îLsyÕªqS?÷xÑH|J8ò:…VÖ‚å
Œüú&b‹}r„ôiŒF»k+7q®¦>´•7îÕ›Ï _W•œ³újø
ôT”ÛL&ö‡ 1óå©æ¡•ŒØÖßJGÊP¯naòÚ>ê¼cº^èÃÖ˜.GEö\ãî»Rwt/Jl|7
bDfn¦µN+·NËZÇµ'r4¢î‹¤†ÒÍ¯H–¤¬f¦×á§H·£ÉÊô;=exi°$ÛhÃñ¥.á€E"fYægžeizÍ"Äo¥ÿÝdvÎgº´NØ+P
ïÊE±—«)âÇÔRJO]c¼Ççh‘½5’ò–ªäÍ!ÏQ-{etK÷Ì}•Øö´6|ö2TNx¾°*XØ"@ü­TŠçÜßÈo£™hê9D»èeÇ¯'ú(YL\×…lRêÞb¾€ºAV;Ú»¸“Ú-5Ÿ‹¬ÚýM7–FKÃXy~+%ÞÖ„ÎnÌ»ï`0·f©R³ú¸ôß7¤ÛîGÊk]Q‡ÃÇíykWsöM^×šV~'c+Ç¨¶ŠF-~•gRò`2ÆôQa;3:¶ÃÃ·_N_y'y´ÿvïôïºžœÎlGý¡$xÜ¡|¡ÏñHR:Šôj^^Â/­T-kFÉúŠŸ¿²œé˜Q¬º2L’i¼½±¨‹×Q4€]å4Ä<3ã^7_œûãptµ{ˆØß¾ ÷×6°¸Møï1ü÷þÛ‚ÿ€íý…ŸíÆþtEÙƒü³jI6O¶7ò'ý¸û0u‡ÇÒj{Ydüd¤0¾ÄÉ'êIóï:3c¶2[Ú`6\X”4à•5/¾Š“`\›‡k^3Ã5öÞ Öâ`ž«g¢b}$öŒðŒà‹‡,%UÖžƒÌ9û&5ôL˜TªùýÍcCÁ¥ßK¼Glªý‰žQzÉJêeæÅ¤¢Žgl>}2«]¹\l6êú«t\¶Wi6Lÿ	O$ÃT-À*êkNÛÞù(Ð&ü©­[¼×}>Â.Ã°J*ŠCtŒÙ†epA'Ž µ:qÛ^£4„ø¤ÖgÌg›ûAØqk¦ÏˆšG¹éeì]«Ìx¯Y,«ÅžÚ‹af;µ`£a/9håZF9z‹ª(©j­–²¸¬ôÂ¤”)eS©Es$Š	3C¢–&›”âµsÌËví)YS•"ZVæÔ©Óš§ÙÌ;Ï¤Ï<o]&e¸;pˆ¥«d¸f}Ü/L*oazÊîEyc¤R6¹uvú§Õ…“ –®õ¦#)ºcxyùä‘–ì^?5us‡/$œ(UXÊ0Ï´‹oÃæ³‹:Ü<fJ”“‹«)5Ä•KþzË¦>wùqò!îu„"ûVT´U€H9q£žƒ04ocVÝ¯aÓ¡˜Œ-Œ;Š®·³!+”;j~oJD|òK·{ê5¼*KÉ­fƒVRØ£ÈWO×±>Ë"Í39¿}yÒ=Æû:ëýÚ=Á<Ùím-Í´Ô´œÃX ‚¯ZÇÞ }âÛ´[¢iI¤,½b15Ó¬gÊüÖ:C¬‚ Q É²Ê;âÀ|´LóŽœp[æB¹9·Sˆ,i·Y³îdñ³Rè)r‘¯ D–Ü\2¼ÓÎŽêqÝypnÌzƒÆÁQy¾ÇBMÄ^ê£êj[·9¥Oí(ÝIÔ…•}~¼F¯¥ø4:F”jë³í‘}–	·a«ÉCiÜ} õÃOîLã¸@Fj/RaÓA¢Y•¾²$-VIMÉ’·WÂ§È$J…ß2²Ð“ A5*-2º£h"vûºn¥'ÆL¬ùÖùBúñZ™¢•?±lœ”‰÷OOÛ~ëlkea‘†R:ÂéË…ÔNÎøùh›âÅêú¿¢pRb0Ïþ¡-±§éÜõç(#Œ¶ÄöRöwéém99qñÛñrzÇ¥nøáÚNrù½“Ï989{k±OÛYõ“<VÍ{2EUy®ÍnVÌàp?Ü/[‹_^á:ÛfÜƒ‰ÙaACÖ¸3ês%S¯íS|­¾Oä}@×xƒ j}N÷ÞÕàÜægá`ÑìÃyç[æ@ø)¸Š•®V×c †*KÊ˜ øqJðfÃÔŸ ï£Xòa‘®€Ü#Ÿóöã`3ãkÄ-†Ï?fëÜ³îd¡~$‚)bÓÌ
&m›3Z¼ìŸGVnÖe:ãY€Ö¨¼ˆÀ$‡ó¤óåÆ9‘ÚãäsrS¬çÃP§zÃºt©8ì­s’˜”Tx8LOå9…ÑEÒ²|9[ñýÄ+qn²7ü(ºâóú°&ÿxmÆÀ¹¡°¾9žy”Ûc¹˜µÃhí1Kòâ•F°±}„z£IÉÂ¬ Ò…ŠÔ7œ*òã×"63tÎ½Ó‹“òû K¨Û§õ¸HEŽ„óSŠCJq(ùüSôõxŠmUwÑÐc9òíûñ00Ï|ÍÚ|3TÊaÏ:@é’é>^÷}%Þ^49s¼óˆ÷oyÉm3¸³aÝ¼|4[´rüÃ¦v|øê—Ómøõ·î±Gæ¹ýîÉá«7%-ib7ƒÖn)óð˜/<¿ªÁbKh•Äxý¼v$A0±XÒ¤¶¥£´Ãpj3DI v™àˆ¹¦³¹¶´“Ë6m4óD5P(Ç±´V­˜~0íö¢AD.áxàÅ³ªÒé‹L‰»ëÇ›²}Š~D¤²×ÎC„ÀõC@—·AÎå!êgh‹F9/.à½ÝwÝ}ïèí«·ŒP‚b#dÄiböæ»#Ï®š;HÇú’‰3;ËËd—Z:®°úg5$}Ærã`:?‚1Þ@öÞÃQ8†“ ^¦«IbÓ@Fê€ÔêŒ¯É«ŠÙ öƒ©?KÈºàuûóž|éfˆñø¯u7¹]IMŸK¶Á7•…÷ÿþÏÿ•£Hö›¸LHV¼µRYÐGÏŽÁ1Äî¬TL=Ö Ï2Y—miÃpÓý–lŸj2Uƒ[¨tŠ¨¯76ƒ±Ý	žÙw¬\’½vWN²œ¹<Ÿî^çx¿Üú2e“ŽùS§¥âÓ	2‚ÙÎ71¾Ð³œ³jëÈek˜ÜŽÓ´f¸£±n•Ý¿“q8tCº< \D=:~³íÖ¿nÖµîZŠé*ð–„§Ábà1F³‰Äù‘©–‡Ó™Ü­'Þ#®-ØÅ…}oèÍ¿œï‹÷;Âigpo(•‰—4x\~'$˜.lê÷‡J4ã/"ðÔwVS¦Qd™®äƒ+ž;/ƒ}¿èæá qG{¯+ÞØOËºÙ2tØ!\[lí§Í¦É}`š·óyÚ6óo¯{|zxp¸×9ízo¼ÓãÎ›“ØÊ5G˜›mïMV5¦;'Õ£®µ)Q²ZU½©iVN¢¤&Ç˜Ô¯-h>9ŒÚp;„ÃóŸîlL­}*ú¨ZýtÆÜMßë¡C=Þa‹i×çŸÁ®/¹¢ÞÓY4˜qì]Eó™×ƒý`c-DÀÂ‰×)ÞìÉF/oL H˜I0ö.0Þü…ž6† bõ0³úò¼X_bD9à±t±é^4,„|`á×~‡ÐIyŸ&Ñ…7Æý³hžHð¯Äé¨ì`|E]Ù¥mÚl:M×±ôÍ™¤8g|l j³-S±¹`Š¼	òñSÙ›£!ö®UG¬å•-†k'+¹œeä‰Ëô ÃÍéµ”á³²¥OŠyáê5©¥‚`Ã9v¾Álë†4PåÚY¶23KyWž†…í°ùab$^¿šƒ0A\É‚ö»ÌYß‡ýÂá_èöÍsès¶åÃõã5#wÄ"š,þ,­1'—æ¹äKÐV~›dûû1_Ì±Ñ0„Å ÐB2Z]Ö”e‹aOk²«J®mÜ¼¬.<o[40'oy¢/Ý†îª˜Ç,œÜµÀïá&Ê·þ”TäRºpŠqä$Ýp,åXi=Û‘•yŒx·@;/ÙC—Ïó°‡J£sO„Quñ«Ê×’vTÃ«<ïôÇa’}Tðhcºíí WXÙU¥PszNH§?ÃÌ$ÐÉ_&gñôÙÎ6ü<Ý‹ß¨£Íò-¡o:°ÓÞ…Îtt‹¨ŠéTâv¸bna·ÃW×¦]ÅÙêÓg7ÔùyÞW×±¶«ùg“Q<^7OðŠBf|¿šóïiV¿šæ|W“ü•eý±[¸¢súÑQçôðí”®Ý£ÃW‡/Oÿ±Œ€µ»l:·•¼w¥Ã3òÜCOžÑˆÎ‡é€œ¤³ä€¸‘nÉáð†‚ñÉã–ß¬—Ç·¿KxíÐ=õ`âpº–[ÊÙg4š9·„~ŒæžÙŒ‹¸sÎöùŽh©/Á~÷´sxtr?4#6Á²w8‹Œi;Þâw€LO
¼\úb`A%¶¨Ó…{T¼}ÃÜ-ß¼Ê0Ôy³ïuNNà+^ÿ4°£K "zÄÒw=åµW*ºW™ëœ–û•GÂ
Þ™¾û‚ËfQp—„³‰VË¸¡WâÖD¹¶ÛlèÍ’íJ]>Íi‘_Ó»¿ë¦f,³å¯ðÉòÏX((¹ÆE8éÃ¬F“QäãÖóù„XiU!Éi8¢yRu–I›£X5Uí–ÒbÍkmÖÕhûÏ$XUàv6ä1ÃL£.qÏmê#6í1±VUã8I‰V¸ëx•ªíŒ#á'¶{á$LB´{}íEè“\‘7º˜ŽA¬+¯Ùëà2L\U‰=àÖ¸AxI:à±V÷þ]{ß¬×?xgƒZŒîj›õ”ÇÖ®jþ´ äLTcd¶ä0NÊjmÕë<.Ð8êû£7t‹% Rì¥œžÁê@ïjZSJCå)4J}Ð0/ú0¥µË‘7½¬myÓ«Z[m4Ø¦ï³è¿“—¯ˆ¹¿…úÁO5ÑWšZøBm4øx¶™˜Îá×§Z]ŽÆ§FE=ë6å‚"Ž]<Íà7J=`Aœ0 1‡ƒ¨Ö®CÿÓëuçþbC4JA¾€B›JçS£ïKeî UÉÅsœ 3©ÆÆyZ#¡Pêí±ù±:g>Ï÷qbÊ*z†ên7ïŠEeÍTMŒ5Oö¾HP˜×Ô`]âg‰Ù¿˜ùSO¡=$´VÅ®òHµðSâãñ]TšÜôHÿú,8ÐgJ,‹Ó­iÓ¶s6Uw¢[“¢ÉÞÖÝî5¿u‹,õRXm­>Ãß',4b•b%Â£….2à¯?Âzlázl¬kJN³÷þéôòƒ‹Øgé%¤âHHÅÍ8Ž/¼@_!m,ƒ.ÇgO7×½!ò¸íìÙÊBó×e\‹rŒÅ*z7~oôöw‹ôö·Dz»<ÒµõtQý{ˆÜ]¬©fÝsy6¾¬5Ðúeìoîbê(&ê·š:#:ë=MtŒ{|O«ƒ"µ~(FHî	ÅÐU)›òk-7CUmc„ÉÈYdÈ/Ddo>‹£Ym
;&|,Ë+6žìÉ¦U‚Á"T%˜4K¦—'ç¦] œLç‰y²‚év+½aÐûD¶L£ ½
ú»×ÖX·æ.	hyèO@…Õ€¨h÷W[Õj°žø³A¬ó.,{Pi^8æFÑàîÁ.ˆÌsôCÔP—ëÍãmþCV‘6/ áCPF´Ž6tlIÐj$Gô"_](æ#&n,ÓWªÇým²+¦ÌXnÇÆ(R6_¢8Pñ%õ
„Õ„Ï ,?%SzòD]¬>‘^zzÆ'ýqšóÜKG£n–Ër;ÆÈµ§›òthüò?)Öíîu£¹Ðg‰Pà½ó²þuž :Ñ65´ÖÐvUÊxÄ*Æ¬Öˆá-c»˜îßÐýƒÆ/öR‚øOÜô±oiœ0xqFÙ@Ì3~fÁùî5zcç2AH»iÂ3^Šzºµ&í×<ÜAoª’DÚeój©NƒêÔÕ*®M ~‹¿×å‘ñï©a-â8¡»ûžîxUfÊÐûöÍŒ¡Ž°!hfËl3íŒUªX‡¢Ôù”™2”©ìzã'vƒ¸áý´±ÈYçéÜ^À6#ù~ >óž÷~ ÀÞÃV%œ|CjÂ˜?cq_‰Ó«ÃdÏ£l«n'Þ$aŒ=×êú9¸ˆZŒ	yÕU„#äæêfA Âêk€€ü(pÑJŽ‚ódUCLÙe…Cj¦áÕ1OgæhsÓŠ,ia—¶Ôïñþá‡Öˆ™7>Ë@>Ó@>ƒfV’ü8†®Ãž¥Æâ©Æo¡ø÷ÖgßFX2_$‘k	«äG Â“Ýçº›¥µµb(9¹RFXƒÐjžÛ32ËZ†ÔGú¬Æºr*R=ñ&}Hp—¦˜v”˜$ÇÚÁIáÚ%PY€$šz¥fÏ8v¨~&½®Z€ž™÷)¸Ú½þ¼ÈÇ£—PÉÅ$h„KM3á‚Y2à"ëgCdA
ù¡GaTÂ› “N,ÓÅ®Lg³‚‰e…!ÏÑêas)<:&ô±,16ea5Ï["|¥ÝØÈÚ5†]5©<‰`™±Í@õ †¿ˆ.è¯›ÆDûƒe–‚•+š
¦fÎ-Tjüµ§zé¬FCÄº¸¹Êü”Ê½Ð³U|rbÞˆvŠ¨9Ÿs@yquÜ¡l<§¯{•wž^(Ä-'îÂDú¹£`Ò/’×®ÃÚ[)	¥ã^âçú‘ûÒ°P¸GÏ ÛÊ K™"mï6ñ`Ã±`¸–_›ÎGq.÷ßéŒ‚Yr:aK˜lµÔóW²	>(oL£âJÆ¢ŽÝ«Äápí(o/jÇð]©Sn·¿BQ­ëIé¡¤Š
(sšVŽO–Ro² ¬5ÛE‘ a6JÄ:½Óh§wïôkD<-ŠyºdÔSÔq
µ26¯¤—a…ºïœ`ˆT-@*ŽbQ<ÿx 'kaš¹­„ fªÁR,î
4òÕ\tæd]Žà3¥SlúuiÙ	u©0Jk¡r¯2)¼àÝ¯Ü‘ŠaùæÇ*Äô¿e¶œYº`øZ‚ÔTÌ_Ô¶ðÞóoŒRïÇ=¶HÊEGžu—UÄWscWæoóÔzù¡/Kn—ÒõJØC¬£«1wÅ0™EŠì]ÿ–DWy®FÂíÈÑpoA+¥ð(ÓŠâû±d°ÜŒç«Ìzù¨º¥§½Œ&ÑÇX•Öð¨Ê$ºÞß$Ên*½oOxêLëaUql¶¼ù²ðkÒâíâð~SÒ,°÷Ž(óîI³d_ïIÓEfœßï—óƒý
W·øÌ1’¸`ÆÁ’u¸Mµ;ófdê§bR—·’îíafEàÝñXÃ9¢tŒãÖÀìæƒÇÃŒAÜ“ælÁ‡;_üpDÛöšP)Äfßœ¸´ÂiQ°fw1ËZžI‡m øðÍÁ[¯ú&ºð¢‰wŒ0æ‘Z©µéÈ2V›Ÿ»ñYíqÙcµôî’dEªcm…JYíp¿áñÓ<¥õ#ŽJ¶Žâ£AB¶Á8j …/¶Xz†ìZÀÝ¸+ž?Jv+<jf³`ö.‚õu…Q˜jâÒ­gñÚ•9‘–˜ŒÅKÙ±¾•(É¥É÷G%ôñ²ˆtßeÌµù*ÑUìv5]n<dÛ…ÁaÃôPØóè VéÖéxØ(9Úºs´ùŒ4›kAŽYlc#´ñÂ1\ó2Àh`n°ûm+ÃµD+^è®ÿ9cm›Lß××›Áøv½Å]§Æô
½ÜóC[PR/8‡ãkËÜ¥*d.2%¸=;Â¼Òö]¥ñe}Sæ@ z]ç*ÖCF…î2UdÉ¾¨µš’¿ì>³÷}¦^¡0õ!†t•î–
ì‚¨4—ÿ^Ì£ßÃÒÍ·’=¯Ä¥™?NYÔà[­:ýAðGÂ‹|wÄgÅY\þ‘pf¾§Å[eLÐr÷l•®ÔÑ¥ò!
÷è, zbžŒœ Á1l°5ø3QjHá¯8I†ÖD{ß¥1Y.2‚å‘ån†p¯mþQÝk5ÿÚ,ÈqÉMóªmÞÊ«–<gåÝ‹î‚¶¼W-Z	Rjõèfl`’èž«£vÅqjîæè¾-ºèdÑŒµ-MA´b½Yh¬¥øûŒZ¬Cnú~â[b­™$0˜…}ÿA‹aÂÈüÓTl°M²“DsNªÕÜiõ®vKrNëC Ôel!é¸¶%Þ¨GBû_¿vÞxûÝ£Ž·wüë9sáØ¦UººUÊ?·×ÊÐB¡Y'ÐÕí‹c5‹ð\64áUÓ ®Ä.(®-nÂÆW@Dôù=@¹XFHoER<£ß%1¸Ü@m¤€,Å›&µ¶Û¡nØ¶	M!M„Ûxçp—Ì9ß°he ªH2‘_øº$UszESŠjB¶XP_½éœþzÜ-ô#~×9Æ%wù×Îñþ!è+^ZßyP5l—]‚Vv1Gðï^Y½ÌÅÉM.ü¾@þ…²†:A(1ñ2aÑRlfƒäìB>RÎ|.aÅr9ÇãW‚ï…¥<n›·Fm.SèK””×)F¶üK4”{PX¿Ði¿ÐÃ«Ðß±÷#&.óŽbƒ=9®ž¤AÙå”¢°ºŒrClÞÊ[¸s…Ý|Í6	gþ°¿np~­j™†u>Ý:,ò¿Š•+â´Mº¬ävÈ©ùN^fFÆQ]ÇpÕ	cW‘.Q%ÇûærÌJô´¥¾m{nÑ¿ü˜K¡.™o‰‡µv1˜¥42\¹~s<KîF÷­3Ýw¹ƒà¯±ù±«žå¯'°à[7Ú Ù»~|¿Zo‹þýÃ×Ø}â(³úþ	ã†‘ie3§›$»;$¤uónEu=Õ–¨4ÒfÈ}NMéJ^éÔË	êfž˜¾•œË‹ÔeäÓM`’£^sQk×Ë‚’ç†-§¶¨‰y-¨w96c­üÇãŒßŒ7~'Ü1_pÞAèn+ÏT½1SwÓÎË##ØIÓåšYÚ7³8¢‰åäÅæ…s«ûÉ@,VU¶•QÔýÔw(ÛwXrˆFy<ºóõµ÷÷àìS˜ìa”ðN×Ù¶·\ú½dÅ[,ž—n¿D}]Íp€îXÐÆ!$Ðë÷ízRu²rû³°ÄÊ¬ºì0Ê¹þX´4™ÅVC¹”H+Ì<Lžˆ×•Î‹fRž->:jœœvN=Ùö´¾vŸ´TÍ”ˆ‚^÷à »wzø·.æ0›”L¡j)Ž1ý"¼…¿NØ­:$—s Ÿþšwí]á™¶·2™ƒYØ[Yc·háI<Œf	üîcv„ô=^øh7bèà~
|Üíœ¼}³-aY)doÒÊŠÃÜÅEqZ¯æòQÙ¥¢„G‹#Ýª«AÈÒpWƒ™…O–[£v”‹©–<ŠrØBƒ™hq‡8*eGÕ'ÐU:¬>ò#À+	w-˜(qˆÀ3'µ‹ÚûV“t42÷5‡¹îÀÓ¼-<“ôîàiÝ<f4ß»°áˆ¶ÑÖÃpQ>…³ÙÆó‚œ
7í°0Á‚ëîSz§ØòÊ7UzµÄ†‰Ç;MÁ®WsÅW`WëÂøpÂ"Mfìn­'8zÏ½ªÔF¶ËWq…ØÌÙ Aß§»^®vÞªã4ÈŽ·ËÚJ¥5—Ô+ ¨ýùÅðu*˜GÑd°’˜‚5Í°X*»é€ÖAê÷«ÕÞ¶çO®h{ìv"á q·Šèmæ`ÆÓ`êÏâàp’¤u)þmÁê+îÞËÖñ˜8ÁË‚ "cœ•©¼€ÿ¶½V-² ÄhÖhîa¼[hcïFçžéñÈÈŽÅ)@µ0§Í§òù®×h  –fèU.\4,Lw‚TÂÒUÌé/>
ãd–Æ¼T«~¯·æÑ5Ñ5/ì_æÇpÁ•Šü!˜a³õÜY7“;ÿ‚þæ3tÅ:bv5¡_ˆ¹±?†+¸ÜØ›˜i=ì³÷Ä¬4Ó[A_Ô•½·Ç]º»ª–æOÓfY9©ÂÊÛÓ_ºÇ9”–<_ºìb0âÏ{îÕ¡!ÆßãÛš×ø ÍO@§,×4GDÖË¯ZMY1“½-‹³Fy­–1ibíî¦ƒ[•ÊUÇyÖË/<cTøÏE2/8Å ¦ÑÝñ¤Í ?…ôá`8@X¬y˜YÇþ’a[fä%Qvy±iÿÜ T‚„f„ÖP,Zh±ïÏMgÝfaÝ–³n«°nÛÆ=íµÑ¡’DÉvaí‚èqµrŽjÔŠsVDhåü]2l¡V3ö_S^5•]N±<;ÑŽõy›G°*Š†…‹B‡VïgäíÒóUA]çþ(rV/–ÌæîR‹"\)Lû[²o&PÍ bEd÷Ìÿ»âü
¹|ºæ£>º‡ýBÜÑ¢PêÉAPÐ4­SÖ*_ÌMäö¶.)‚<©‰Ýêê3ocÃã3DvhŒ¥¹û™'gÉÓùG”_E#úg‹Évm#L!HwÞ½;:ìîÃ¬(Mv¦ÓQû’âVƒ†%³5}ò®»wØ9:ü/³ù“iÐýQøï[vÑ=böD½ý.†zÇÝÒ”j¼ [¿cŠBŽCÞÎq ›¼õƒ™? ÛÖR i9Áš€µœúøÚXÅ®€®‘v;_‘s‹­"B jk§8Œ”¾$³ûÉ9´ìxÛF v('yÃ;^§S]1°D„ÜÂ¹þƒêt\´§ÍøñÚ©m®äÏ ©Ð 'ÛrVL<¦²›t0pk»®<²2q°ñ`«%Ç©ÓV¿«W8ùo—²ˆ*ªVµÁ­’Ë†‚‘ Ÿ×ÔÌ^0U?7Ö0ÿ…2@Ü¨€¯Ám T(ìù…È2>À8ˆYt!­UJSš­_¡Á–	Ü©LW)=®ÕK»:´Úa¦G£y¤©7KdYvªé²lxo ±6sÂ=4Ð¡”¯Û&[·÷plg~ô¼rÃ-U\i_3M–‰ÈN]YãPë—Z4À"‡”ìÁóö;§ÝmïþË¢ <¶K¶é>à¼Ý´ÐIµ)“7ù”È'×þ%žr46—J	¢Äa¬ã,öá·\{%•šíËò¹…¬jÞ¡¬j®yÍ;’UÍYõ «\ŸYõ «dÕXV¥žª¬jÝ¡¬j­y­;’U­Yõ «\ŸYõ «dÕÿYezý©Ò«}‡Ò«½æµo(½L0uyÖ~gòÌõygòìAž}·ò,¯Û¤´Èb^HWI0îf™Ìzøaž AENYo×ëÌ€Ÿ¯ŸÏ¢qõÚcoÛ™]¬yÕßÖ¼:ÐòÑ†äµº ó¿ª~Á_
òÚáóÉ0  ‹yÈ_é©G“ž§U¾!wÉ"HÛb9$Ê€~cÏQ®#U˜ÇÁ~÷fájxÁ„@gþ+§Q«\kYkx™,‰žq¥&7I6ª(ƒ Ñ€p¤iìäbÜäxRš€¦‹[,n·¶âvMa"¿ÉooµÆôÛÃOóòzŠÏv	OJùå?—ZwK¯c	°[.K®ÒKƒÙõžlb~jüÀôEàm1ÜôýŽä÷%i>ŸÜóDŸ‹ËA%õ–”ü¡ÉWg7=r§‘{g
eî„•mÆ°©\Ÿe¹‘fn#9ÎËr#­ÜFr¼˜åF\®ÌŽVË¹3K¤>Í¼Ar;ÌZÌ²Ø?è½DîkØàzØW7„š–‘›ÙXj²×Å«æ£Ú–Eß|‚^kž²¾C÷ì4£Ô+ÓY­¥Kæl#ÀÖ‚w"¢,e%¸çå[ŽŽ;ßõèîìâ–£c_mtwoµºåx™ik™ñÞXé"±]j±ßÄjw'Ž 97Ç °³¡ú;ú°·¾X5Ÿ:Tw&Âä<ŠìýZóKçÄc´„ùªaJÎvK£övåù«`Ìü‘×•Ø9 ¸@ÜhšL…ÔÌ¥¹’¾µJàKZ´c› O(—Û‘|óÝàË€Ý'îÍ‘¨øò¬4±„=Áº‘ÈÒgÊ»lÁ;~˜à^†7_j á˜JítîÒºpû8 |éS‘h70¿ò[Êo§Ô~4g³tÛEÙ2¥°¿9*µï`|óU|wö„el	¥WØÙÊ/‹RÄLàöƒ•wñjŸò³qáÃƒÎá{˜‡¸›½;¾‡UgH3/ÌÐým)Å‘¥k-¾äÒQÌ(Þ¤; faóÍâ²Á"­á~Û’8€3daÒrr XHç†v]<’‹ ˜¸PŽÑž^UIû‰!.¿ø“®º*”šçŸ¢~-ñ'ƒpµ(XynþÖ§uÔó›(¤ûmQó2˜ô†È8v¦þþ•n‡™­zmëéï1{Ñd‚·:Z’y2Ÿ¢Û!åÉfíÉÍ‘R–æ÷¶&÷ñ:|4MÉn>ŸŒüþíüÜþ]S]wÌ'q‡cPŸn‡“zíñÍQrKÙó²ŸãH¤[O¥"úkPÝ?üp>ŸPhïd>îuu2ÒÌ@;„Bü(>^£ü²4ûà]í Ï“¬Á#~û×8˜áOwƒÂ'Ñä4FÁÉÁÓýèb2Šü¾ò˜uvB¾+ìBrL‰Ú²ß/Gþä“x¸Øö@·=ÞÊû
ÌÛâª·x®‚¿-’!xÿMá
´áÐ¹†9&zÚ‡öbÛÎ'‡ým…¼XcIà¶è#Ð‰'¤h‰B7"Í0Ðÿ:tc~ ·D/S#•áïã ó°}úñ¶`aE#C;õž"ÕRLš*ûÂ,üÃ‚©â<Ô#4Vå88‡=	(öðeç—Ó×Gûá—î( ³X'‚6¬â{«þ˜pŽÌ7XËˆÅ JAP¤Æä-{Œ#e[ÆÊ»ž$B#™R4’ëIÄÝˆVÑš[©<“Ú€Ý•™L4¹>¦ÀZ‚êÆûÿ]¯=ý°c©TVù–Šo°îs~;¿ïì²°b°Q{ŸÐj%m?H¨äkÿ’ÇI³˜vk*…“iZy"‚q÷CfKoÂLÖzE<%ìaoYŒ6
ÎF««Ã~í'C¨pY]_§2±8„£q+í~`q|8ˆ,‘ÅþC¦„dçyµ%“·òQ­ö]©ÄíôìXÿ¢‰þy•ËýKy®HÆ( £Š.µç›o<1Ä·,Ÿ.GN›åèGl~ygïk^óƒÚÀû¬…EMÃr¡5T}ßZóÚFK«ëçá†_½Dx/‘PÅP8œy‚±11Ÿòœ1Ô3”nlx¿£)šU"Ï?;›_Bt8ä<ÝÃãÀ˜eˆi{ça’ÎBVVj°±´`Ÿ:Ñã»”–Åâ¥ †îe/˜’lÀ®^wÞuIkbEXû¿¢â±ŠGuu=œôFsŒ6µBE1Žh˜h­|	pM ÏqSøbÖÐI‚EªCØââ³ñª´Îz(@‚>èH ¤,åŸÕõŸþ¹Š,eE#=žLGaâ]á1ÎFÕFá8L0’Z•Þ˜NxÆ>NèBC|àa„1@ßƒ¤·.Ãqú®w	N2ë1öîŸñÚú?kÿÜøË‡Ÿ7Ä	† ˜ÕÆùntAQ€.ÈUóB`7³u q R* Sg4ÃáÇ}CãirÅg<N+
¤(`95H¿¡®þ(šéO.Âd¨?'©1f!¢‹!•‚ìŒS!6kÙF¶aÌo'á{ý €ègÈt†³ @Æ‚søƒ2Jjí}ýú¡3DTëÈJUšU¸€ÔÙéEäÉSYjIî•õ‡	9¿7¤÷–¾‰ëÓ_ «ëÿŠÂIHÒ
À"ÐRéÕ¤—1CÄ¶!Å¢I/€<T¶ pÛîù9”0„š^Q1JrB/(Ã|J{«ž0æ‰òd«¤Q¢Ì{¤	pÛ3‘~©;öÃ‘-¤"5½`ÙêÂ!RÊkÛ\g8dY¥×«hº¼àÊv®~¡6’I(ê|Ù ürâEƒ°'±9Žœ:NWŽbV¯HRS''YŒ9‡EÊßMa+&‘;BžIq/W×1Õª¿æ"|òaY‘óù^4F¶_=£‡«sãRŒÇ¬rô›±6Ó `·é6–Âc•ïZ	v›î#r3,^‚,¦ØÍºçtø4Nœö5¾ð) ï^è·
¨Ð¤RêýZ£ÎÈ×«¾¤³Xà,wÙž?ë¯þ õ)†ùA‡^$Ÿ„­£¸@ù|\eM‡$Õxé¨q¦Ö õ€UÍ–({SãÏŸ©ì>Ë9™ŸZ,<Eß)îE£ùxâb*ä x"—„‚²ÿö®é=ÞÛ`=®¬	zJ^5ÛVËZ¢·°4ÄÜ ×ì†þðE©Æ%Á/¸Íˆš“Æòw!BM/f¢ØÂwÉ@ñ°<usFwÃyü1Ÿå-Õ¦Âø
yÙRMgMk7š|6åeñÕÄ<Ç¸fßÐ–
Z­0U
ïðÁóñ|‚‰Q4PÉ~íŸ…°xÿá‹O~|/><³7É|„q{ ´ YéØÞ8¨ö&|_¥+0½‰úÐÓYûà¶‡´#ÁK`'A²Ã–Üóªò—BG* 
¥[?:ÖJÁ&°
/7eHý:Õ¯öÖÃ¾•GKr}:‡Ì š~4v"¿ÊX‹ÚµZ
Ï:˜Eó©Öc5+ŽYô6<ë$®Hm(ÿ›¦6bŒÄkÞE yîFWè£ù&â&ÕÃ£ó/a^y©—8"Ùx9¼*'÷2
Ýì¼Çx-N€à´=¢#u$Òì‚1#M@¬@W™è¡ÛÂ‰.	[Ìå€[lÀ&}Møw”¦!1!#!3;<Ä9…=÷ˆe©xÏ«UŽ€Êæþ ¨¬‰'Çì† mÒÐòà÷®²·á(œ†“({ÒFa<Ì yv9IØ‹Õ‡Ù¯“^ÀþP~ýÉ?ó'±Ÿ=êÌ€Qïü	t9Ÿø¯Úy·šW@z÷N°?gÈ‹}Ì7õ§Ð[âG^µË:JEb©á¿áaAìA5Á~Å›W¯÷¤_QÔ‡%=™ ÑJ¹é`ÑO fbéŸÆ”øCí'øk ø™ý+ÄB÷õ;	¤Ó 7œD£hpÅç¤8ÄþS(½êéQwu©*Rá£®4id1£_žÉÔ–Ý>IEVZgƒÒuf‰Dï†WðxR'ú%ðG2áPu™òÛÞIpóF-€§k–kNA…Uèea¥!á˜õ/ãÈÔw 79W3‰€DÝgMú¿GXpÝbõÌWŒŽì#3d`ÐvöÈ‚Œ‘e-È\HøGÿE¿°n% ò;Cp”á*ôU¤¬Ã¼J
¡Øê¤–bS­I!16³æœø‡“~pI
–
3N$½ã€û7 ÜZ'ðgxgeÁ;»xÖ:%ÁûV_ê :\VébŽ5òséŽJ½UÛâ'­Q”P©Þ3z±ëžZc†
ªÒµ]ÍÓG%…TÈ^n;e+kÊkÔ6R¾ð¤A£ã—p–€ÆX³BÀÔ[eRX :;l‘*-\(ÈEªæ2z§ª§òKøejV÷Œ1'½!ˆÉ¤z§ü­ZÄÅd²,?s×•9[†‹ô‹>êLýE¥ÎŽ‹ücs•Ô‡^™FL-ˆ™ãÓ‘8G¤ÆÙa!Ýì„7û,gUzË1H û¾H-bÂZÓé÷%ý2TŠÉ¦·±]âçÏ½*÷o¸7Pñ‡…:´QkŠ\Ëàšf<Q-…ì÷âVá5#Á¾ÿ°ê°¬rÅ E³*`ˆ·DÃñWmGY­—ÖZgÖZBÂÎ4K)5Å¤Ò¹ÊØO½$û Û‚KÛ¡Ï
¶±"µyÜE«¬¹]²4Ý¢ÙG)°tÑÑYDî9íÜrÍý9	¤>I6ó/úllËn:m„1ZRã3„’ÕÈ±Ÿ®‚JÐ¨?SZƒõBùmT¾’fGì«UÖ5¦ÁÒ,Ú×#'˜Ì¢ÑHÙIÐ	¢óuÆ¡³¼$«wàäYkR’›7Qâ‰6~ÈV/ðêÑùy0úìŒ'Íò\RHå·–‘DÇll¨‘BÄ«yÉ0Œiê4ÐÒö)ÉšA©‡E]ÔÓÒŠ3qm%œx;»9zx¬-u*˜XzE‡.JÅ½12[ePÑ*—Ø—íJ9ê} Õ\Z¥”KÜMrÍzv[BÎÀ°´.8]BœÎÒÐ#‰…¢¾°®R®hÜÚ¬›ÈW¥©QK‰qìðvÙÏÕl!Èæ
¢Žôæ  la-,4¿ªˆË/ ž°°FÅ€Ô¡U‘’TZö„‘ÁÅIJtöò‚ùÒÕ›*«žf+Mƒ½Ÿ½3ÌÉèmhãçQ8´…ÉÎá
„
h0ÌE8O˜°‡‘RE(^UçbÛP¹ŠáÅ§vÃvT«ÚIò]q
‘´Z“õL†pÖ»+n µ©q•+-$Zèòoç&ž!ÔéÎäªËa#ƒ†T—DÕXåÌîIK56öë$ÇÔîVó†¶øáVÔVºRƒBûh£Ê_ûœ&¥å-þê@I{)³1"…s#;[¾h€Ò•Ì,H²mÕíh&­F&Ëþ|<¾’¡¼ÍªN7M2kt3ª"BpªÛò%)öm,é%}–d#Ìøkq#2K[x‡jF¼¥[=ËÆÆ˜ûºdŠú0“ãâ+²½rL£4ÇãLM‰`g{ºZ†W8xh}Dþ7fŠ~LŠ¯²?
"“£=S[êôJ6äpx‘¢îõlÚð!Ã-ë’dNsZ§œÒ{ºÑÚ¼±"i1ŠùÒ×yÂóÛ6±^>ŒS+<ÔjÓÀñ–Bci/üYÛžOÅÑl Žfm¥†t0k{3NË÷@Åy“s6“BÙ QàèäÝ¨t²jçZï…~zw²3ó¯:Œ~í­¿Ež#„6öæ–¾x3/*'"Ø~Ê#Ôc!‘1]ÚóÓZf[óÂ½¾Ìä”ã£˜õê—ÚŽ%‘»xy/úç#w®^å(W.j±«@ÅbýÊ­a}ý*_ÃrNü5f~!KlY“öËHŠí/U¾ôªé=N}™°Ó }"‰z´±˜&© Ô©ëCq¯Î¥¬LunÇ«iS^ÂÆdoQÙ©àsðJ ß:<©Ñ¥`þ½©ŒJi#w®%_{èK­gb.g¨f°½ÏGfï”Õ¹à¯ƒsÓwû Œã0ó‘v|ßQ²Ýž£å&Ídv¥!»õ¸÷Õ¿bèµš±€hB£>°2ZÉ\æ“ãŽÇÒ3v Oý¶ôÕìY‡À•)ÖlŠ*’€ÝzÏ6c€Z5Ðá Ö‡ÉxTåõ×d•þ3¿÷iÛK£<T¡¼m#IIaÞúŒ‡…DlbàY@°ÌÖtOäÛs*¨Ã«±U4·‡Ð@ãüÙÙ•Z…?ÿ¬sX„=,P5nÈßD“ä$üwPÝ²¿?.YøÈjc³n)‚šª±ïÇëp·¼ÎÀZ|\£bé §ðûÃÑþ=ì'C ¿š×ªçû%@WK*·éð.ì´ª9‰ÿF>Ô¿ýx­K\Šq¼>íŸ”e|FSPyI¾ß\óøÿ?do1÷Œ,œx"‰/·½zöëJùucÝöš[Oäg“~tñwö¦Ñ¬×=‚@aIoèUƒÙ,š©l8ëô¸ZÁÕ< =»DM¡Î·+k«V‚àl¼¯Rö2¡,Æ.¢Ù§³(úÕÿóèä?×çI8Š×ñÉo°ìÕãü¾Ÿø˜‰Çõ®ÞðÓø`D£¾¥×tSÝÇ`1¬tÐågè€}úÖB“Þ¦‡òøˆ<¦ ›RãæË¬ñ½yœDcoÌÐŸ‚¨¢“ÈÝŽG6¸=mîÉ^ŽâËÚ¿âÅZ•zèÍ?¡H¾ˆK>Y ÂÒè&ø‰èª;2[«[çE±DRý)¦í<L^ ßÎY¼‘¾RPVi»t6x!.E=c˜¼D« 0M4O¼•?eŽ]ôÆ¬€ü£õ°÷iiÌòBØT¤.™OíX&BÙÎýùˆ:­Zv‹uÍÖ±å.^¿!©‰g`,€I¦–°ÞVT<z{ö/Â5¶šÂòe;­‰OPŒ‰ßiJ"Ð¬*
fë3Ùæ¼€.)`,Ð´H=m%˜]#Â¶¦Ì\}*{0g³°"ûïÅÿÞÄ±ŽhE@u¹ÒÉ¶÷è‘(…¿å÷Œ^äì‰Í¾!ˆåÔH´¢*ŠÐT:*<Ê3à¤‚XY•ÁøÌÜÆo§åä·3ŠRE‘Ù’Æb–ô,,Þáëˆ_öÑîÍgÔô8u›
'§iq+ÐbÑs7Y©Ó§"U¶y6°@3Q¬¥Ü)ù†U€‘‡}Aç¸Ûú€Î–ÑdøË-[|	á*4ÁåqQ:ñÄ½Ž©$@
…+Çø¿
1‹=äTÀÉûá|Lq©yQgOÒÐ“hŠÃæ«©’C¼×SÐ‘u¼éWG<üæõ‘o^›˜îrÕsæŽ3³u²/bƒšöÏßsÑ.É1á$ÃTCq'Œ¸7®’¸¢"˜•5JØfT5K&ßÖP\œŸØ¶PXc¤WYçµZDq}Û{I7eð‰Ü_˜ŒH:’a&,«•½·oNÞbf¹}ïÕqgÿðÍ+ïä—n÷”¾·‡xÔëìuö»¯÷¼ãî»·Ç§Ì#ÇX"r’5’E HµaëÚY¥Ñm>m½Ì¦ r@Œ]‚-ãN oq-Ä¢dgXÒTìl4ÌÛSMºPüP„"ÄªfMñBlª„iLäƒê¤Ì½Žnœò(›ÈLäBñz“Ò +
õ¤MKa¸O(ê“÷ÊÌgêÍ,(¾]à}mþÅK¼±fÅÌÄµ ø
95É<Àxœ<žYŒñ®ô›Neññ™6™á;f„ÈT(¨Á)è q°yðT¢ ”¤î„‚XóˆˆÃ‘ODJk¹tÔ0é¨QšŽšÛÞë ñ±oïåÓÄáÓŽFSã€@ë˜Š¾xcŽ÷dï—·o¼7×]ciºÍîÖAÝÄ¾˜·§‚œ½Ø©Z!(½oÑ):–¾”)o²)oó©vVšÝ­ƒÎÁ›]ÄôÔ§èT,Ža9œîß7Æû…øºA_b<ÿèvŽï{DÈÙn1¦‹!ìº½jÚiæ(U¶ð‹¨"SÖ KÔÔ
–¾h/wÕ7i‰7äUÏµ+½e]é/í+ý¥s¥¿4GyÜ}uøöÍ]M°Ù>Á³`À£?¥“[´¨ÝÀïþíðä^ÁÇ»þñ]àäôøpÏÔŸ¾â Ð˜ÐKîh 'Ý×Ý“ÓîqÛ ´h¸ç…¿ ìŒƒ˜ï|HŽXþ*…*hr@Þrkžò²O± ëV<å¥…1´A•Ä0†º~O±gBóB›?à¬fÐÒv˜…e^FdôYXMëÉú´@º	úéc`c~8ñN1·"ÆäCal¸,“i‰¦Ý:É##ÁÖçæ÷>i”Æ¬qsnŽ@Ð½éÛ•®Ö×7-Ä’»ÅÉ°•Á½Ô.Å.BTª©EjÖŸ3M30¨(ñóf<h°u/ÛQÀó…F¤ÝDz,L¨Æe0÷%†MéÍ¢8V¢Æâž•·—33=Ë|ûü<½ÍôhÚcoŒ¶q¼“GT9óšÙÙJÏ°4YÎ©Öþl‚L,zV K«/æ’âF½Ðß&Vòèˆ[ì¶åëœ6ªŸµû9Äþ‘Úýñú3žHÙ¦qË=­V»±¹™?Ù¡cÞŠ£9Öy í'››Ÿº &#	ý»6üÿ,–š¬ìiIÛÄ)ðK2 ÿ¤MŸWÝN`±RÚ¯;ž1ðÿj!{Õ‡æ›¿ÁŸWn6çýAûq7ý7ZCåVï\—•ßtõ”X_i%´[­­½NÞT,ŠåŽ-á_å-ÇÑ‘wpø¦sDŠ“Ðòø£¥amt/ÛNækQ%2‚°jÙˆ4EƒûÀâBáqtÿ+8›ùt€6¥°„·!¦tZÞ0½Ïs ;ÁÑ©Iè#HÅ³èb/šSº³]Ýe(šOåX<×ÞÈ?Cö¹òºsÔÅæišårjªÎ*t*ÚÅeK¥·§¿t•:ê¥d^åƒêÚ².ŠËÞ`‰lH)ÓO…«ó›ûì›Äx­©gšÉj­ôÅl‡ïDä]DfØcl†q™]‡a/…"£d-gþJË
ØùMZ£µf3í¹
9}bR²YK™L,%ž0}\`V^b2=‰~ÿ¢ƒÜ¢p‹˜Ù¼žÙÚléµ'oÌp 2ËÎRß!˜’ö¦¦|ýaÁ+§•Êà~¥\çäLš¶:º²"Wã7Qò–_¼Þµz¢+n•/çÛG™§ÝÅõ³æ¼#\L³ŽméüÄq“DÉ5e÷®ð\ŽYÁpŸ¶;­—[-F~ôœyœ»±ºyÞ‹öQUµÆ7cZüIv™ó'Üñžlêí™`ŠT„\/dcpÆŒ8¨Z„Ýv÷1.B>V£
¼RëåÓÆ^c–®8×¢¡H	î”¡ä<œÈ³l÷b}f©à„“ØG(~5Q*Ýôæ92ÿàµ_Pe~%Æ¡½)Â;Çz°‚xÖý®÷”¸bwï`ÿ`3U½¯l:”æ²Q›«·Ÿlm>‘gj5^fB\Á–‹³¯µoFx%é§eû nÅTOX”\ï$:O·Ü«J†§Ô¶.›NÿËàoèºã¼œ”Q‘Î)Ò,_ñö8!ñ_&-¥(Ò§&£(©¥,ìóÁ(òþ|=‰ÂË _m®®¦äæ\ÍäJPÑé@P•4 …ª*ÝîA·ÝZ­*­éÖ“V½Ó²u™.c¹+òÈ„{]ã`ž¥¦O¸ž›B¿eMeÓ(µÍ§Rz¢O§ôÕ>¯Ò¬j+3›½+3»ùsëæ4lÎµã¼ïu6;Ä5*{Oö›¸­¦Œ-ƒáèÊÃó´vÆ¸úXž]M¯.Öb¶ÿôiãeã%µÏ7R‘~ªÓ­ê²3Y‹e(çºáÏ?§ÏÒæQÚí giŒ^¼ªk©ù¿%Ñoô¦*zsQå}åÓ™+¨H²¯ê¶íÝ8T,X–Gn¸|ÿ6õû´)Ã¬H˜_ÈiäO)$‡†³ 0­Ú‘1ÐkHRb¯½‹¹þz‹Ïd[±W¶bºòõCžTÍg½ÁBk¤î=ä]ì=]c&3þ˜?mÔogiÌÆ$¶4œFÝ;æ.Û0§Ø"<ä Ö7ÖÕ}3ëþ‡¼r[XŽ’ ±õÀ¯í¢³n„Ñ<žqüƒFk+xM7^ùÀ.Ró¦ÍÓæÈî‘ËiH~y4LX¬ÈûÙÆæƒ55Â‚eÃj[\§³wb4Ãéå¶×z,FÃŽ?Ð7$¯|³-Ê?¡ÜÒõ´õ ÖÃ}@–,ÿ2¯|#-ÏŽšrÛVGšÙ¼*¢=ì_z›«¹4¥¡[ë?æ«3%Ë˜‘ed©…a”Ë”éê¸!:~ç'x†‘Ð °æv¥™K¦<h™Q^Ö§<ÝøW0és¾)¼ö×²ÆÖ@”ÐÅ‚XìC™.(²QPk³0	ÂQ Õÿ(WúUr\»‚Ç?SãßVVëèNÏ.c0OF¾bRÙšéÿÁ„á k1º;Ö6ëÞ8œÔ†µÄw0IÓÛêÕ¡ÂÅa$ÇeÍà%Œxè÷£‹Z<Æ„çu¼_æc¨x)c®Þ¨˜“Óåkà,Àß‹Úã¶7Ä Wží~³¾ ŠÜåçx8|6šÏj­Ë‘áÜ'WµÇu¯6žaz›Ú8Á?Óˆ.ÆÔ‚/Ha5:}®'§Õ`šÖ{ãþö´¶å©(ƒ‡ôé¾.ÆqmdŒÂ˜Œý±7A÷ÛÃ°ä˜¢Ãû7@¦d¶Î”Ò<6·	h¡aCß5¼N£¥"Ö›¹¨5‹‹,C<ÿù¸ž¡ðhv,ÆÅªéäy#eêã!úS­näIÞÙ…Ó³ÈŸõ÷†Aï™‘v¯›í…·¡ÃÌ0¼cIE¼3lÊ£¥a5qiÒezÄÈó)À˜Ìüæ@¯%$MF,Ô?ûUy®dØÙ6þ¦Fwbq¤^Æž%ãsÖ/¨:þ$˜µÛÂ1¼S,Ìv6¦1Q.^ 0éªeÐBØÆŸðWŸÇk9=-Þ£Ö±dë=å@M™àTz²qÜé%À•`*aÒj¤†ÇÞµÌm•(¡K¦î2h¯µ&ž*xªqbMú½N¦óÄ4áÍ»•úYtiØ|Ø‡^ýÝkkú`ÝPÆ>ÑdoèO°rª»ÕíÈ1\Ö”÷dw³joPaÈ/Úb‚ÔiiÕMÖqõæñ6Þv’žV,ÝlXñ§ç4§æß7êÓË¥’´±ßç\éÐw6ˆŒµm²].ºfÝÜØª/KÞ!¹úO‘èðœÍ“4~˜þQØû³/&?ÍÙ²LpðõGZ<&¹pGsò™ÈÁ¶Qçÿñ:MŠ‰VåÞþJW¾N:Ù
w 	¤=ÝÓ-[ëÒÃ'õúÊâ£>tsæ[ä Ï0}ÐþÎ& ý}M@{‰	p¨ ßåäI¹yÆíBh}e°9	|GTð÷a4
È­óîWb:”füûš	îûÍ÷ÊýŠÓ@IÚ¿¯iàÞÆßÑ4p¿ç³Eû¼¤³¢G/1‹Ua˜£MozUk®o2«™Lö*q`ecSê;³')òd“„6‹Ù¬ø”}n;Æµ§›B¾Ì°»ÇŽª~dŒ6¼DÍ·ŸØ~êè,ŠiN+¦Ú
Ô&Ä:MËÌ	EøŸ>+ûÑÅs¥çÌJ0FËrß11„ÅÂ©Ñ-?òOå‡Ã–š†MÝ¨5Îw¯õø8‹šS)é3…¶-´C¡îXh9Èü˜Y	fìo	­[ü	oJz"šd&0'tKÚëã¦
Å£«“ 9DÅè—Ó×G»××Þo¿aŸmï£‚ß¿âEuŸµnÚýÃÐà•nrê´½‘?éuLƒgi˜˜F}<~f¸ƒüµjÁÙ§0©QÛl“_óûhŠÚö‚K 5ïQ8Fû“ä™W®”ÞOB—Ä	¬>ò§1¦Gâß”Ú<àÿÏÊsj¥6ò¯¢9ôJ¶ù5kêM/=2öx
šÁÖy=´a
WQU~Þ¶ímB±ü'¿¤Å}°ëõ´À·ÜT«h Ô·tÞ8ß<j¨í(u?-êO ß>Ëß³ÍqÍÎXbÙüú3¨ŒdXÃó¡O ãcP¶ù¹d^ÍõITãdõNKÉ]Kþõq¡™4¥¯×?yoÏÏCrñà.ã?mÈµuž3>@ûÌh²fØ0X¥ËºLÆ¢8q¨Í ©EZç¦I”ëgÀ%…ŒÑ%Uä8ô¸7’¦¨ç½ï‚¹0Nz×éŒã°ç1~«YM9?/oE±z	ÿ^Vj—‘4Ôš	ªxËÊ¤7çèMbè•çvSk·íò‡ûÛÜ²eZÏÜç24Æ†LDNú¨<w„/`×–WjµÚÊ‚ƒPv“®Œ¸QvÄÇtõôþ‡›]y½ƒÁn–ì>¿¨zÿÃ•¯ÈÞë€ÙÅÖo1àìJí²æ%C<Y?ó€N¦ZK®||ù­Ö¾òp{ú(Íïx(“o4l-ZÊ¬‹ær³M¡d¾Ñl‹p÷8ÛzDœ{¹iÇhÇ…‰bE÷Ñç#ÜÚ±ãÕÔ ÄN=ÝcëºÛÀ˜ÌIÛÐp«ÙSTÊÄÔ´v3e[j,NÂÞ§+î–ñïZËz˜
*¶º¿ÍŠ%Á~z
Ûà‡'€ÓÝëæÂÒ9ÞBá½Ã.íúô[P'ÜRC	lGRÙYŒ@ÛÔp# ¯°Àa¸õý;mDßáf€BËuøþr…6˜+klói{å-xœÚÅsù^ûÎF2´aãZó^L#Yëçëò>W»×˜Øw{V†GûåU¹¸>KàÑ¾4Å×@nBR},î¯VÌ *ý3Øñ}	‘€ÝIw€»¦dÕZ1¿4º¥S*}?¦1)ÅÏ&w‚lSq×~LÖ=ôÓvá(g+7)£Ü¸ïw¸Ç,ÁO±}°ðtvS˜z½‚vÞv“e¹Äq #\?˜ù
àqçÚq\¾³·/(€Úý¬Î>ãu²O7ÊñíÕÊá"²þÞí¬Ÿè.úÆˆ±ßfÌ.¾ð„ðÑp0á»ÿÁá÷ðw6T*Ï(—#¥Rd„4¢œø«´ñX[Å3pŸ¤”#NÜãmHDÒ4…Ç’"ƒ…lüz”d÷=ÀtGÿ 3Ó“îkJ°â@’ÅbIP"Lõ,ê_É¨CCF?¨]yüKJ%Nz-ßÖ×²@ÛèÓÍå­œëô3EÁÖÖÉâgÏ±Ì%Òê8§	 ÷‘¹[êj#½î5LŽˆ¡»¥DaP„‹€O>“ XÚ¾4%ßaÿÒzã?üR	ÝÖÇ‚ê=ýtƒ…·¿dÜÁþI¿·ŒÅ_ß±D‘·‡4}Éw"÷|–»Æ²s’¯âÅG'Æ‰V]û¯ôÜ’Úª™½þ›<íÑÈež&¿Êq0«†¾‘»'Ê+ãŠoóô7ýÇ
ÛLo`ýúúfn¦¯ìµ ×õ8ñ“9sø[9Åù?fáí<¡Lq¶rû³˜+³Š<zN‚Z2„	=Õ:CŒ{˜»;tÄÂåm+®Kì`Ày¨àçNOøV”{oxŠ+‡fi¡ÇHd(oQÚÂ¤F—qâÃ$_I§-fÕÈì3§Ç7'Ýããî~„8ÕÊ|Éw¸ŠfxêŸb+ý©ã‹¿¸sŒí¿}÷î°e±N–~í’%øqî·l¢}JF3)ŒÖaÄÍÐ»¸A<ù“+z8f–Þ>r¬ñÑ³ñÖ¼Ð)N-˜Sqö>üàƒ\ï›‚ÉEÊËÇƒ¬4ËÖ.úDÿ”˜SöAyoî¶®?NiÛ!ï*dÍ²„ÐþñZ™æh)i²li1Ù¢bK®aîðÚé&†ÕÌ®Ýc-è1cüðý±îm€•DÄ¬c³¢îÂÑó¾4ìcà°fÅÓ›>¯Ê#¢’Uëu"$#íî–ˆÍPÍ; y¢c±òü¸ŽÖAP¤j åR¤¤·íD"Æ,>+oQÐªßÑy&ÅJP¼ªåÃ ¾Lë½41³'¨_på°4ØBæúè)®OÑZ"ú¸W„\A][æh‹% aPyY¢ÆÚ”íÓ Px³ÊGOÇ›6ßt…j
³ŒmŒ}œäë&\—ù¬HóðK†‰Éf¦ ò³ 1¾%2Œú)£ZÜH ©ûË’â¨PFXø¾f÷¸ï5`¿j¡uœ;­Ã¤u?¿ã+ÑvpÈµ•|•:øo@Ðš¡,Öîp+&óû7ð:RzÊÊprÌlùxNã²Ýñ y¥+”&§<R*IODñÄB…dÛP§ïƒ4‡Z¬ Ûg9&k‹Å¥0ã2ëÝ’\ÿp\ Õz;þ$Ö!T¹<Àó¸‡€àÝeúˆCÉºyÏ¾ëœœ¤æ •9ªs^y~Ð9<RªAº¡_¬VÝŒÊI®vó²•2>hÚ7~ò(VpjàÖÜ¿y95 ðÃÅwvD¡ÍáW:¤Ðˆàá˜âá˜B`âá˜âá˜âá˜âá˜‚>ÇÇÇÇÇÇÇÇúû‡c
Ûçá˜âá˜Â>åÇÇ7¢Š‡cŠ‡cŠ?Ê1Å[LO¸ñë& ËçX(ÙÎ+¾³ó
Ë4~¥3•Ž,Ž,&n}¼ð{?\¸££…?ÆÁBî¦öþ(G
9xz8/0?çççççççvªy8/x8/x8/°}þ‡ü   ÿÿì½ývÛ8² þÿ<Z·o[î±eIþèÄ±ë8Nw~›8Û™¾srs&´DÛÜ–D5IÅñh|Îïì£ìì+í“lU  AÙNÒwÂžq$ŠÄG¡P¨ïúf/øf/à×7{A~}³ÈËi/0^ÆLLfÊNº@éü#t~û§?]Ì&”•I5Ù‹` ç^vC†æh¹X™®à—xr_^¢Ï<êVè>Ê3ÄßŸ‚ÉoüæŸn·™ÖÐ¶T‘¿{oió)ðlâÉ—Ãm†¹¤'—+Œ+ª`yö©Êû§Mi(±àûI˜Ñ$Ò—ã$Ç|¡ýŠu
ÌPïù -)£gŸ–þÓ-ßh‚šðÚ-¹ug7Dç"­j§T×©^ÉêV¯~EÅ‰±Z°LÇ+
ób±âŠÅS5ë÷ïµ.°“Ì/R#¸¾$p?¯DZà<i‡ŸTlö}ªŽ.å'j±oW7oZ2±íœ^IØÿ¼¥€•KÛ¹n9T%â³bx<Ë˜$I¥gËÙ«/Í{¡žßâºåuÊú§¸.óŽ”¶Ømv,×]²’ü¹¹ë…9ôVÖÙHYûõ¶å1ƒ"„Ÿž»ô*¾“ò¸÷1jI’×#Àh‰>WØ‹Å»â!R5]-—WÉª‚¿[h,4W—€&k×ë`‚…’‚É?‚	“9ü¯¯bv|¹åQZ@·Æµ¡m'­ƒŠÚË[¹%7Î¶+ÈTN˜õ’V}“†Ö/ÒVƒôÊ¬N¬Õ ¯%‚}¬Ú×äa}ãÕ’>83¶jÈÙF·\ÄL‘à<(ÝÕz©rAÄBˆ„1õZ{G1{),ßÍ€ÍëFÛµ¸œŽÙ8ø´JåÝÉ¥µwv&€²ðÿÁ°r’nØ$.0¹mX-[›ÐbqÂZ
gÐêØ‹öÈ¯ÈðVa×eþAJzö_ûlt©|]ç‡o©ž¹‰Ý¨•,-_í°h¢pJÙq†W+Ý6JÔï˜­šÊ”½¼`_ÁèhuÑ•$²z?r>0‹v[’³Ú“½á[øÀ$³ogK¥ÓwÃå¤¿=ÿPð4˜³ ì¬ï»3¼LGÇq¾p5›¨*5mEÙPR¶Áç£YaT¦/[\×ì4Åº=
: &ûY»ëÌ[ï4ÿÚx¤ü7ª8©‰ê“¢3+e_Õu¢Uã%aR"edÎjbæZ–†ú#öÕÉÑváP0J&·¥#TYùÜ3wÏ¡Ÿj_ÿAç¾•cî9˜QJ)^xw ÃØ7 ƒÉ¡Ú‰æ ðy2Yj³‹:à$þ-ükîÎ×KL¸¢IxÍ.m¬–‰ýÂ* øí”„ã6Žî…Ü´o°²[šÌÆa–VØÀtwÒ+Yáû«íå¿WÚÀ*²éžqÿ`’	ùžJ.ªDc¡¡/¹å(dÃîB¤CÈ ¼E€\TÇ{ØÊ=©*Ó[“™ÛX.cmkšÁ)'N«L?Ý¤ÌMå…ì¥T5‰{Ë:ËXóË(f­¶YÐ0Ç»z÷Vu^¨~š¸ÎÝ•æ2-ÊZëg|ÝihÿòÊ¢ló¡¤î§/ØcûsN‚n[ÞrÒWÙq¼ìåJú®û]t¥áEVÞV»â¾Ö½hís,;b‘Å7k:ßãâ‹µ6VZMM{ÛiløJ®­u¬¬Á£É¿Ò*2<¶ëÎî¾¶Ê\z-?ËI£e˜Ÿ„I˜^\+5·ësCŒAÞËbÆf¥ý®5´ž
;k…¥ÿ¦ûÖ˜¡üÍÃdpÃªS!·ˆoéöœÍÒ0YA‰ÇÓQkFÊ¼»Í^DIx‹óÖxDÐi_ )ÛføÛ1ÿ’ëÓ™¦O—@·+,3ìÿ=ÛÅÖùÂ¥, <“®_ !ÿ|“ÂÂþ=Ž£	¿A…øþŽ…/èûå,bÉÛ¿²D—hli¯7GvÑ;ð·Ôù«d¢öÝ^Òž’%]éÑSñ¥âyÜÆÜÌ-óÏÚÓÁ(Õ€gˆzü?i`à&˜Öd6íµñ¯ú*Aáà*üöJéuß¼kíZ{‡XôKµzò¶ø>µ„¾éÍdÀtÓ(-%l:0Ìq{9eÙeëªÒ6¦v–ÌBÅj–%7šI“Û‡C	v4¸è]>)½Âø<úû,LnÚXÜãu{x¾ÂZü÷´µ¼Â®Q;ÓnÉ&[ðëî.ü5z…'GÑ8ÊÚ½eg§“`Š€º¢Œlöñ àù¶¼
¸á;p<Ínð8Æ½À¾#gUÅõŸd7MÀÚ­³«åEÙM<cDö€ÆaÊ&qÆÂO´˜ÐªòÇS9²;…Hx	ðõDi-NpÞ–Œç¿Ð`­/V‹€úuZ†9”›³Ô{·&HhŽ»¥é›“,<„ùê¤Ò\l¤V¸ÔÆcÞoÇš¿ÓRÇ[îJbŽN·ŸX&•ÚPÈôÑBP}—æˆSv(°`ÂW	ˆºJ,JY0J …npN9j\ÀÊfWð[¾Ööf2ºaXÌ½üþ(¾†—¦hÙ¢çKk~ËB 4îñå´LyåO5¯¯­±8LNÌÓÅ ­ìŒ&Ï€¯utïø£WAº?…÷c8”´šc¯tÒx¶‡6wþò0ÈxaØÁí’ƒ´Aã¯ÇöD[’ñ»óý ?‡ã ñßÿg˜¦|Ÿ\çñ\âA< $hªÁèT‘Å1}ÃÓãV'º‚ìúoW‚tdž8Dv{]ø½©L@BžÆ»’	î3@N¬Z»*FÕ÷ï¸]òÏ·ldƒ+Ö¾b¹t¤ÂjtBAhÊœÈÓ­m@c|IíÅÕÿ-#¿¦‘~h[ú‚áÑ‡Zš±½/þø­XN…9¶­‚5QðNr°ºÀò•y•^ÿ~˜iñ",‚¬ÀørŠRŒÕþ¬¾ŠóHî³ËIdcgê‰OÍ¤ó!¯NŽ4D9|@`ŒXzvÈ®#XŠ`ÂäØ%agÁ` ’bÁ“€èrg=°i…IAdŒ“Ì8ˆØØnå¶¸ä·`uá8ÝÅ†Îàc<ËoÄ‚'üÍ®ÂIÉ[‘–†F½œo’‚²ßŠO·+¤fñE’yji€–IÙ9‡ž‚9ˆKm€žï9‘•GÑdB$šám»RÂx_¶[Ê³ƒ ƒYäš2“ºål„¡‘|@`1OèlÂ
$ãJ‚@á„
œRF¨¯­ÊãòÕU©Äç”MÈ%Ö˜"É²U€ýˆ×·”Ç°³£µü1€Ø N†t`Žƒ,ÐŽB6­&âêEi‡O$a"Uà3H’€Ö¶	>BbáëmöA,û÷sãáÛúã c@¼ö³m–ÛyÐ¨óòô°æxDÃ¿ÁK·Ù»Þ{ý·ðÓ4JÂTkÿt&ñu2¬om²YþluåŸ^ö±Þ¥Jû4šUâ/îC`,„EU(Ti˜¢ô7.@‚Èâ\æ "š¤&¹vn/s‹ÑœrbÚààWñ²âÜö8µýÏì…NìÒy­À‚z³îoõ¸&Ò'´×9|§õ÷ób·‹ž×îqUe,ÒIgRÊÁåðtšhÓMBc<@nÜæmÏ"…8PGÛj§@öZ­âDºmmˆOsIh›˜ù³Ã(Ž‚›#"6Ô¤r.ºyÚ 	–þciù]÷=õŠCWzö m:Ú•‡)%(t jLæÍ–¦ázIÁåN§S»-¡9~ÝVïÝBƒóÜñV.¦ø‡#}JHßâÿ‹º’¯âòŠ\v4©Gs"¬f¡B¶T_KNIá·1þgY;Ñ¦Qai¬\£®—ÁO,SÙiyE×Ð2HÏ6kåÇÎ;c@p¤»°‚ÒcëËù8MŽÔ±åpsÝÖ»˜K'rÍ<WkVAÏ+ LRè ^DÏ:Ã‡Üé˜œ@gh™‹§«]™øåš{^ñâi0ˆ²›Õ.›Æöº~DÐê$ž„žéZã½µ– 73}º^}·Ù%£ÓUþ©0÷º†¿ãùh– •Š2ÂìU¹ŒÚ¼ßà\Ì¢`„áhb.Û¬»Âào¿Ëni%˜DÀ…Ús=zN{LsÕ¤áqGÄÑe‘1ò¹«jWs”+œß¤»œt{C¿}—ã\¾¬˜pGÚÐÜpW¹Æç«*õ¯W{[h7Üòsðò]ZE“\ìŒI+lzÁbÈÕ,ÀÕ;€ó•ýÖû†Ñ¯ìMìp­àÓçu—›ýã’›}k/7»‰sÊô²öóJÍÐ„[ö8kFt}¨‘dGÃß…ÍŽ43Õ…Lw”§R«éºeÝmN†1ZXÓnxÖc†7T‹²Xe›UØË‰šÌÃ˜®*?³rk$:(iÈ³Å#RÝÈš»¢r¦’ƒ©¾på¼VÇÔuî'©€Ã@_äÒŠH3ØÂ–2«×Ë3fåÞÌ
å( ›A»ÑKžàK®qÎ—k¬D&²Š$_r™ï•…/êC¬²ªø’+mð¯êÓYW.¶ø&×ZùñK,õ³8þí°Ö°Ü\îÿ€ÁPIMÑ4=Àò[<3¾$X†£ CîÁíòGý"hp\Þ?ü, ÁžK@<ÄÞ×¬úŸyÙ+WqRðMù¨QMà-0!ŸÃ_
ü‹Ä…â§/§WQ8> EPŒý>˜PÇ$òË›ÕM» `zœ‡#Kœ@o‘ì²ÀêâÁoîÕþGõUh:ÜY£îŒ!D“é,3=`?£ÀYê[L/HÀû+ôDß‡dôP½ÅÚa'’Ë0ëP#ËOL‹†*Ñ™[¢•À=‘n×à.‡o+û'žep‚Ò1@o0K·uþu“r{á}T*`HEñEy¤ÇRDCŸŽ`¹¯`Âd·uH»P÷!Ò_°‰TÊƒVr^V%m‡€}¢XÅ¥g—p-ŸYBq	,yb>4r
MÚ«“#+’ºÐ4GTŒÞ)ýfÃR46GÐÏ¢¿íÆQõ™Hj i¯¿
¨e2
”„˜zÅ£yóýRDªÝEW9èLÔžs% ËÎˆI·ÞÕ:Æòx*ŒU$É”¯ždy¹pU÷mk²®F4¶ÜÇÖDÉ Õœfó•^ÁÊþ¶Ú•aiÒéúQù„+ë@¨•Ÿˆd>
I#ºŠ:¬O!¦1¤E0£Üì«¹¬ø,ÎKž·¥…4A î†#\­ÏJTD?¤J‚yuk#¶7`#n”"Áb.ã†ViÃLLÖuœ€MŠ&¥ðkš6NYØh9ãÄ‚A„Šò;t:·¢L¤…‡Ì9ÈB¥®¢ì0J1_Î(œ€ü?ÿÉÊË7¿“g5y{ÙÏ4-ÓÃÜmBí©Là\Ñ@ø6J!ÆŽ%1õàãÑ%ãQÕÛ)®¾ëv?zo²¼rÚÛR›3¿7˜%iœ ÍV¥gfÓu‰sÈ>5ƒ„vJ!;ð0ÑŸ:ö8w/\/9U‹þ½é8Ch£‘Rd¬M¥è’J_u¾´¼‰]ÁBáñ
ˆC‰~8–v£x‚?bP&|Š/1“Iql±)ol³6µdî#LIó€{¬@V>%…QÞþ¶pž±M¸Â”Á`è®È¾º@dÂŸt—ž·Ó!FöÚœzìî:¿— ×ùáûì¡…/	é n¯ýWúç5ÓR‘"­Þ®'§ÉÍ{s40jëÅA®vz[eüãKÕV_Xákd1º,€…±ï¾qjV§²AÎKþYæú¼ya˜ÛÈs¹a.—Áf9ÆO6‚Ó¶i·Óñ/_µŽ„²Ö©æ·†–;ÍçÒ{Ü—)Ž·XJäõK8š
vÑj„3ó÷4Éme3ºp—´£8c/pfºÑÍ×äÆ-^enS™Ù¯hæŸ†“%Jã?$gšœ¤ãh ãÆHsð&AûÄ$ÚBtÐu¤Äøº¢?F)eñ@G¬4›ŽD…ûu¢Oü[Ó’¬ä3(m\‚kÃÄ—m"²U>v
Ç†dl—‹wþ¸J‡ð{r¤=WÞhNì(W¨Ùh`ñUÆVnÿ»ÒòYYuÅûß‹W7EêÏÇ¯ŸÂ.$šTÃ¬vý$D^P0ÖZŒæöÉß2×ÊÔEüå²*I ŠÜÁ¥mã†ôéu„|à>÷rdkŒÉG=.¿4”JŽã$FZúVÊ´šrçTþ™×,9\ùøg4ž]…ãðu<FxËÄ2±Þ,ä5%ÆIGïñy·ÅÝ«øúEÏXã(•ß°þÌÁ(NCõ!
#G‘‚'@{+¾ŠñS2ŠÏL/›çcUg7-S‡»üÓ»÷*T1Ê‘§æ:xÈå·¨C	ÇY¤9Bv+GcÂº•/~3QWÃœ†¾2Ûpú€ Ø–È|“Ç÷«þ±<øÜXB‚ŒºŽù8ù”-	‚)—.+ÄQNHÏ‚s´.¿éi .©ŒÉÊÂ=’>Y†l }Ev'‰`ãáHø“p0Œaç`ð¿hD‹êàñŒ%A"bûµ[Õ1ûøº’õDkÃ¸_ßÐé‹^7¿Ô¼BÞ\¼4ÑsL‰<â/—nkœË­’ï”*²´ÍðÁKÝš™Š^§Y (“RWÇü³Ö>m”½ö»÷êPá¥ãàf,"téEù½þeq¨ÄòíWÊD¹îAvK4“¯ç Œ¦ïÜ¼kÁ=ù›¸|À‡³oÜÔš3~tÎN<j3ÌoVÎR*Äˆ’” V–rÛ’Q6´%[sðÔeœÜXšÔªlöO®ì<xÓ„§h¸œûÿ¥ªjI¾ä Q Ë|ùZý]<Ö’¡Àkkìç Kn"1/¤+º0žšŠœ½|ž——ÄiŠ1+ˆ^9©fW¦w¹amló³¥äL)©à²2Ê<ó9æ	×Jä¯ÝQªÀ
Ná©ùæÚ$Ù$ìyy¤oü6Ð…üæ{-¬D—hxª¦™ÌQ˜øwßAƒEÄœñ¢–ÊV‹ž3w‚Du×‚VÎÉ•z…Ñ/hX3,ˆygx~%tÒ _°õ®2aŠåá35§/¶Ú®wmõ3¨À4Í ãòd›¿a ì•¯ˆÄ¹Q˜±ÙHïXMqÞî² 9Ð-þ£Žˆ^ð„Ÿc
àÓ"kË±®ð€v=B”Ça¨–š	 Q‡VøHŒpRF'àáeì?¯ob¬cQ(þ¡h÷„¢Àà<ð@Æå[XRSzæh,Cßq(ƒµƒvn„«æyB|eÆÜ:ÔÅ×`Ø[ëŒB ‚>A·»Ýín—ÿ†Ì (ÙÚ3líÜÞÚ¹GkB%›7×Q®F´@€ù µèÚŠ=ðÞ·+B×l¬­pBæy&%?IÄøÑÇr"(1ØGÁL#9æâ£dâ‘$O\,ä^µMêAñ¢B¥è£´±ì›ËµÁ(L®Lô´8m—é;&@U~>5·Niû¨OÞÏ6rmMDÓ6„UWe>˜&1W|’†Ž‹C=HÞ@>w.€Û‡ˆcô^Ñr}ï"^î-]v¯ÒÂ"šªæ¨‹¾¬ã€|ò6`W²ÙégëûzŽ…ðO;Ò¦ìä[ˆ=Uy:ÌRWp‹Gü÷à‹t;ÂˆŽ±ÇkÑsü²Ê‰€¯YYž%Ùè’v¦áÒ¾è§Ù’œÔ4¶»»”ŸÅl­/ ‹éx*½Dñ‡ùKH(¨˜Êé‡2†±‘qJ÷{î-«4Y6ê.º+%†µ! ëøVáIuä˜
ùHA\#@]©@ù²Mä:ªÈ»%tQ¼3ÊH‚^¼Qô…ÐË…7RÄÔq'ŸãÃâìÜuÞsòpŸg=b˜œœ%êÔÝo=Í¥Í7¦·L]õ·-™ºæZòÉlÌ‹0“Hù:Ç¬©æ¨Š‰vÇOÄ¬Öµt!¢ãÅ¼¦7¸iør’µ|”ƒŒ<)¯A‚„>µ¨9%Œ)²]#=J*ï¿¦#ö¾fÊ=Ê»C˜–\›‚Ñ¥	£é”÷©qK³ö©Ú[›>)ÚƒgÁð2<ÅšŒÈ¡¿!½cTÇ®gÇ_´¶ÎÃ«àc'Á¨µm2ësžw›µžåO¡ŠvÅù%Ü-96Úja]¼ào3í…n«ˆ?ç‘æÚªaìK“®>†Ê0Ä| â»1”üµò`(3C%DNé‰µCn(ÁEVc¶ðk>úfF¼`K®›­„Lþãœ2–ÜÙÀtP½ŒáÈwÔñÃ‹`6Ê*Fñ†ÔAH1ó¶‘R‘Qk8‡1ŒÜü”£pòli\ÂaÎ;(¬ŸhpøRc#Ô ¥¼ge­ ¥°kÃÛ*§>	Kª©z#´ÃÉGÒ4M>väÆF4Ä»•w_f_¨½n Íði§Lˆ•îê©Jàmny6zVä
Qg®k)‹ÙS&U>úxDëKO…UUÏâ7ä÷‹c•“È²ÖØ¦²ué]³œ›À.˜È!7Ö›%þr?±Â€¿ƒ¡’ K­aîTWJœ!ÐŸéÓê£
C·,Š“û~[\¼Já¬çM˜¥ÊþMØ¯WhÉ-€Å£êÌòŠW«žuloÚLë¶ÄßöÊ4;W=‡Ñû±4z—¼L7'éLÃM";kW=K?µÎNjí–ê*nIko®ã/¶j).SW Í» ’7¤OÇÛ.|Êëòª2¥"h˜jÃîãcÃ…¢Ý–áÊx©l ?,,–Æ5qÞ½2Þ3óY¸1Ñ÷¢¬g4Y½või«úSêÀ]óf¤ÓÂEò]¯O	WD½…ŠºIÜñÙUÏ¥¢Þ’mì¶ª9Ö½j»g¯¼ x´èÎ¥håû*ÂYãIÍÌfñ“ÍR¡oÕh-UÉ„#¼—„‡o)ªJÃ¤45vf˜ƒ:5¶Àõ¤‰,+É¤µr‚«h‰jÕ[â hdåP=Tj‹†»Rqþw~d£^^ø;Qý"¼æ‰¦NŸaÙÂ…—Ââ·e?N6t°æQ`egFô“pàmÚ,üòf–5¸¾}á@$àþŽ;ã š˜äoµWðN7Ü³y ¤9#Ï£:©d`ê¹§šP/N·0Ãð¬†³j‹Îª.ñ\7ÐHF5¤\©Ðl/Y¨œŽl¿2”H…„ŽÄöÚk6þf]I¢´‘ûsórqzubã‘.Ø‚ï±	ì—p4Š1>¤í>–e&¾•¥åw½÷Oe†:8k*ªŠwÏÞg-œcg¾Xÿ…fœY£	Mûá¶¼ÃËLr†F+¿KG¯…m{×íôÃñ{ÌJ¹tÀcÎ)îµ–ó}ÎñÙ
»Ú¼æU„ÌÑº¥2¬ÞÖÞéßØ¼,7}îQÌÛÜ½ª-‡Bþh¯ÂáhYj+Ÿ²Öÿ ê&—°Ná¤Å¶ÙLBbå¼Òk·ªæ`/õçªÚWM4ôÊ¶‡“¡³ê·³ÍrÜ«ÁP;¸èµ-#Ò‡DJÁ×É%5 ÝåEvŠ)Ufãï{70öWÌZ…C¡ê²ÃÌµ>Öû¶ÈÙ©â² ²¬õ#&Óv”hü|íGV¨&Ø/Â%Š; Æ	ûqÍ ts—¯SÏZ‡®æœt‡RôÍê¿w(©K1<®ºº–jà}ß†Gw(_â*]sÁVtd©kk“ÃqM˜”Â\òªµ>
8ƒdåY‘¢0P›hýˆeõxâB®Ds×1½s½R…ô]'Á´’Â•pºìÒaW€Ú<œO.“iJq_ÿSÉmE¿dºdéŒêØ¼S«|…­¨>—êøsù×'ÎŽ5E¤ãª)/).ª3u—³¥«T¾Ðt³W WQ—CM/[KŸ¾EÇcvJT©@Þõ6èðù~®, ¯j[p¥ÓS	È*·š``5<(‚guÖ¨ÒåÞ²üÒ6îüƒÆ.æTÂœ Jðz¢Z¯¾ç©´÷Ü‚Š:Ú/­í/UÕ¶³¥¥ûÈG‰E¢[fé¼!/VÙ±eÍÆ]€—êYçJ¯*ðöËàÝ¨¯L.¾ôvòÛ$¾žˆtLõ®*8Ê¯Rå(qÙËQ{ó3ZžþP%«*T¸$¸VÚ®o9„nÔqMÍ,e½k©FCÊæ•ÈUîÄÅâ
£Lqî˜Y^Äª¨g9ó^SS„ÀÔo%â·©¿O£Æ|µI&¿ŸçÑ>"ù¢ˆëyªP;CvÏ¹8'Ôú¶}PŽñÛr’D;NÓ^O­¨ëÞ
‹/ŒkújÖ&´úGD¥5\yÉýæž
`ëK©„¥yÀþ\ë©Ë}Ù%uó…;ˆC8^¬êõÛQ%üj6¥âø5nÍuˆŸ|‘ž_ÍZCú*×)h´F)Úu°;è«§fÐ¥WlJ›eD-÷Ç¯'É®ñä:Ç¾š^³ýÉ›?iò\É–X¤dªÈX‰—‹~ÚTGî"õpŒ†ÉÐt’	•$k#˜–_@ ©H/c¼óÛ	&o	‡îö®X@-ÔëìØ`DgW#^M‘£$Ë[‹xUÉq;ÏAè£ /ìÀ‹ ÅFˆí¨A-×
ˆ/ÖC®S…ýþ¶RJ÷±Tå²|éÙ²!‚5<8\)Å·ì$b^*Œj^Â+ûŠ| >J/Û´º½!%´š+…Ò§w)Ç®h\þùóv'Wë%•­ïz+¬¿ÂÖWØÆ{>,²9¼{¿\Ä;Ë ‹eîî‘µS+¦‡Q1|„ïðÍêù(£Ëh5ÛYç:‰Áÿ5N~K1†.N8ÂDAùNyZ³°]dSaà,H=^Hgã1e¶;î¬þqœÂá§`,$'`ÜáÑ„[åGöP1èÒsñë¶âçªßpùu<tÚWºRçÎª]2ÈK¤påõPWUœËî.¯15åGSm¾
»nÉ+í™MÐi§+Ê¬£Ò­¡­ù‹¶6ýAÝ´¦©¥mnŽ˜ä®µws­ÓP&gI«mkJe-8œO†µÛyQÉÌaÖÚû›bRc×¦|q'HàÁi<@q…ª=a "úŽLãÝøèø(ºkaVµeþTK»ãÙT#ÞÆ.JÂáˆ_;V$a¯9˜FÏ‹ó@Ññ«AÅÝz£xGÏ¿_fÅgèâ]55-žíLgéU[NÄçp€w+ ¼Âæ®Î€	+E­½"Ÿ³‡7<!
þaÚ6ÖD˜/ßpZá•¼ç¶ÒJó’²*v+°!òÑÖ’[’PÍÊ•#”ç¦,Ô.6³œÓ>»£Ñº# ææC¬rkWCÓ–fÇj>záyµ:ý¤B<Æl–6´>S]y°‡^+5…}…Í5%[®†tpÂ!˜ZgÚ˜;«åwü;†ƒg²ÍÁh0C`Ó:¶‹hq™åë÷åå£^aá„§ Ì¹Ôéì|¥W?Kfõ÷÷Ð\9Á4pãS‹œi¬R1[¦*â¬ KÉHJA¶„ømõIÑß[aœ–ÃGögÙ÷
¢øš¥YLFÙ­”û/þÊY´£|%“§JTª"d^À’Â_P<ÅÔÒXìcÃVŠE¿l®Så’ZåH­ÕME'©¥=—d\#ß+Ò}·´‹WíÖ³ê„ìÈœ!ñæûÌ–Í€·iÒ€ôôœzÜU2B‹—{"§“Ù%£l¿ÐÌ˜½9>Y?ÆÕ¸7ÑÊ}}ç¿êãÌ@Ãðæí^s6a`CÅ£ñ¬
5´Õ«?Î1å´®
	½­{¬Úz`ÞFÁll ïgë=9o®2ÈžZu¿¤¾~(NˆÝŠC§V 7{go.0øPáÐc~‡Ÿ¼pÙî«‡Ö~±>M#hÚþ½šÇ..¿§<%õüÚñ8MÔ‹N–ßo›¼b(]¿Ó@ ÒWjK3Úž¼Ï(ú»ÃõÇu©:…pš>*(Ö5µ„ª½°»å¡û”2—§lI¦â^GšÜPúnfÉÅ]ÑB\[´§Â*d‘dÜÕÕ7=ÿ¤›œeJâpË€–}ôâ“DZ‚ÇeÐ/;€'ÂElÙ&Ý"t¡ÌD\@>OÂà7`HhqA‚[ZþàI•é²Å’>6O8ãqÛq¹îå/°k<O:y™°ôÞÔÎY…ÊtµXkoµá ‘á5WïþépþÁ[i
qœPÓ	ø¶šE¥”w mÖ1£(DWØ µóâ(Ô&}¹,yùïÀ&M{Šä1.hþaŠåU$M,ûnÖg˜ø~ŽÂçÞ.ûi3w¬Uú…Ç…,ôLŽµ>ÜŸ5$NåÀó}ã,|"1o6ÓþÇËÊ@5ÎÏIM%[°?aêÕÑo¥ª~Ä^õÒ¸œ(S&õƒ¨yÂe´¹]n—Ü‹ù5:Mªø’¶s®•ŽÞSª=KBIVÿùO6¿F5J™óq¹Âñ¡.²É)[Æsµ2k.yÅ¨B€ÊeÎuÅœGýU¸So”K;Û:¬A'‹éÓ°ØÏE[ù¦cSŸ¯’‡¥^†–ºáóá8‰?Â†eiÞ¯®4‡„˜AšK(G\µ¤‰+öt±©Ö—nXòíè×C‰R¨³È‰ÖW+0Š,Tò5¥Áb±j©øÉO#˜[-~¿Õ/%×Kaa-ª´ƒô*,iÛPœQdrZ]j*× 7žQå‹\ò9ç*ìÈ>[&˜®³DX-óøŠ¨ÆÎ|9øzÛI7~³	¼ÆW‰ú1UÎcaª;ªêš[eù5-©ƒ®VûU¹¶$—ë(þX;Úh|ÉÒd°[ ë–£°;ß¬ìì{X“:ã|Z½R«ò²‘tÚ®RÁ:K­aç üYV¿ÃüÂ
­°¶l)Î+W¤ˆ©a½Y»°¢C<…Ce\”°×W÷D/Oª´ùœ§;lò.š¦¯‘âë¬ÀE”ŒÛ­“p¨!rË}ÚZ®ñD1.=¼ÏÅË¾Î¨œVùU×h­(áªx_ÔÒsÃ¯4ì–±wŠ“¡Cxû~›C¬3üs ´+-b¥«ÊÙÇò´µ´¬ßÅËæå51eÚ¶ÄÁ¸´Â>Hè­‰$¢áíšÞÎwû¡ÙØ½Ÿõ}²Ö¶%/[ýØU, Ûg«	2jðAIð'e9›['‘¡ZjY TÎfúˆ¾jÒ\FE{À‡kUwµ’«u—Hq$öaNSý^÷¦âÿéë^ª¼Sëé«>ëE }õ:¥ÌþN_ŽhFhõ†ávÑÈ­ÊkÝØÛ©âæëíŠÖìð«T˜Vr\è•Æe©px¿–@ÍÔpjMØ€¢ìèw9çíGš›Š/AbU¬ÝÍ‹«tIërÈ« µ—è÷%oMw¡6—(¦³Ù«Á`Nq@KÑ8¸×~lø~<PQ]t…	©d`CÆ(O™ŒMäÅxñ{ú®ëk7dœÏÁ·š°²6å¾Ýe“ðš	fé´uB÷›p[L´p¡¿Ë¿˜4e‹Ñ¡Šokƒabfž§à€D'Vo2ÂE8·/È»9¸7•†m5cÜîÆº}yæ­	ûÆŠœê>—Àrüg?}dÁÛ“W|ûù·âÍ16£H$Î¾{Ö“Uõ;Bª5“ÇXœL«5<—¦‘fW¾,Œn…ÆW¦Žq²4e;s]¦qù±'!U'ŽÁ‹Wðe&½yÄo'ü·þÛ	_};á}ŸÿvÂÛ¯o'ü¿â	/ô÷À×Q9¥Ñ¾nSk<²¨5òlâ…iœ¡ŠæÏQp~Ãö‡£4LPÃqwo„úG*£D]p·êþÅáÞà²5¡³%æ‰&ñk;%èC€žª§AE†^·ÿ@­óÀ£š„­¶a7Ë).Ú°…fæ{ÇÀa˜t{ËïÁ¼Â×qµ\ãuàt9PƒJ4G[Vk†G€Ð@@€•«PÙU"©_nŽ^eðâfb»ÓfžóÝfqŽ§y|Å$ž„¸|lÓõŠ‹êTÙcµ…s@«ÛÑjI»/á­À[+§%"  ´Æ¾÷¿ÿ,<¼·?{0‡–{[˜¾¬N?ÓÂÃ´&äK½¼ÙB5Æï/9ˆ°ehÜ%Âî².Î2I­Ýš€8ùTä,ìÏì\„Ó¬…S€"'|¤)á?¾“j¶‹$Þßu3I×³ÙJ ÙÇ°ÜÉâÑ§pØî×O˜;V=áãsYï?ÚÐAm D[{o_¿}µöò¯‡ìçãýÚÑÔq1e“Úô“Å¤&âëà|æÃ¨´o9
så/× ÏvjÑAÕÙô´ÊÍRöWÖW6V6ßŒU
O®èÖ6Êe!€Ég;»lCpøEu uïq¯b€G-ÞÔsœ•8t¾FA•Âhb?M9óÌy‚ÃIâKeÓ»¡Oc^Ö+5°3‡©W:¡&ÉOˆ)	5ÉüX¨ÍjŸY‹ÙKÅñª‹÷Ó$cŠg½ÂbJµ¸u{µ8÷i©äÊ-é*Ø½+\QÑ­&±@e…‚’Ûñ§´(œ(’æýp›þI©ÆÍŒwE8D'oŸéfu‹þýTáQ·÷æ™ÙèÕÉQµãÀB1F’­%“Å`ý%@Ácã(»Æ€äa
ýA@»_)ë.
R‰eÀrÉº¢òÈWÓðÓ$?Ý‰ÄùÜ®=ÞÕ”Ö÷‘0p§È?Mií“+zE•÷n#E-sŠraÇ“·¤÷ÏM‡ðäÚC3Ój<ÝP‰ÔüÛ›ˆ$æÐ9i~dRsW—…~h×ª3²¿…zý70 Ý9¦Ý´²¨ž•ckWÒÈkÝl1Y0‰Æˆ¢¦LÒ¿ÃYB.ÔîDuX¿
‹ïŒ"Z²ýQ˜dì4ƒv¨¸Q©|•}JÊßRí2ùƒQ½Œ×§Úd¹p².+˜É4u¿³ø”ZšÌÜÈÅ˜ŠRÀ²Ê’‡§¡Ôy­µOi4tºBô^I‚Ê˜ÇÖÞópz8do€ÊºÄv|¶/ê”	†_G#a/«¢p–q¨Œœš©Yª1n¤ý*nxä;`¶zÆSã±ý4¡kÃ`—™†ÎŒ*¨Â÷A›ûÇ?Æ£Ù$’›ìÈy‡ý1„é
…xKµÚÓëý3øïg“Á‹Ð3	±&“Çx}YBxÀ
´c¥yï,¾ÈƒÐž!v`¶?JËsþýøãÑá_O~ü‘‡p'»º¼ZAß÷à&„Ð$LhHF¬p[+Äš\Ê¨RÌ³ã\‡æµºªaÜ·¯CgÊ~F&Øs§–BßÒ±n°ÆÅèÌ/Ië¾5?\†çÌÀ_%Î±aÈÎÈ N‚¯_ÑìŽÙ‹¤n¥R|´N«oÔoÕ¤»ÖÞÿý_ÿg>Í¬‘ïëÂ7wc”žFçhF%-44vÜÈ"m N±iç"_òÚf¢úÙ´3ào=»`–—^YµþžRF²m‘—¬}Ñ	Æ€ÏA[ÑÚ-j#c]”vµbÈÍSš‰AQG¨ÈÖÞØóùp]è­P$kÄMQŒëòý÷ÜW”@õ«(èu/îok™5$ïºÕò½•omM•|zí©ÀÛã rÜýZðóì
ÓÒßÄ3Î,ÃbÁÉ†gœà›ÿÕñò$„Ñ4KÙ«øò7î•LwÇG­ùRxõæâ"Vn„I‘9 “ðØ©"-–$} ŽæRV•„°— v#ÃMÈ#VÉÍ+ýz—»­Ï²RY]ÏYT••œ4üJÓòr@š¨€¢ÃqN
Ö©Õ3ho˜Ú`uûµöÔ^íÕÆ"Dsôµ‚^5Òª§ÊÄ™EŽ÷W1zôiªx)\§S«ÕÃˆª]Y²2z°j·¢!Zç3¸ª²ÉT4ö½J+Ÿÿ:ód9G±ä{—´š„¿Ï°Ô <{ŠN".]/®LùQo ÀWÀÁÕ&>Y—+ ‘³w”øà‡ã¬ÃpAÞšw8öÒ3€-J/Z—Õæ\é»P1¤ï,cªi´)Ãä1E˜Ùl4º9³Œ{ÍsÞãC.Äu*Û÷]j¢*
Û7‡š‘Ês®»K°V¥î…çJæÐ^óV¥–ŠtXd?÷ÊÄåÔ`ùÄåÞ½0•ÚØÕFé(sæ	F½Y&Þðêƒ¯LZHùˆØ+Êp™ã5™6`)´+Ñ¹M£ä_ó³Wñ¹µ)ú¦ŸˆqDéupMîÕ?»^>IÏéx'OóL•7¿G¸NgÉt€ß¿dùcrnÏEpÔ´ot»³oònn-4í$à4Cäù=ÓSÒ; êA2×ô^¯,ƒˆ•·o}|ÐMm§d „£ Êp ®.ÓwÊe`ðEÈg‘ÀZV}Š¼Èç(8G§/°KÉ­=M[Ãð¼ÞY£žüeló¸·JS;Õ(Rê;·"}kõÿØ³y¦¢7%¥4VØŠ§
¡ŒÏ\z¼Á(=Ñ³Ö,^\æ¥ºÑ„Òî;üÙ‘¤ö9Ií±‚@oêô9¯¨*k
­ù˜¨Käé÷'Ð;dì;ˆ’Á(”y[ÈŠg’îû§Ø”IXãQ?×(æÕ’Ýî®‹ Ûº§UfËìAàoŠÕB²ÑÕÝÖ —ø5À}¬@‘¾ÎŽAx@Ý)Wû>°?\]5/î
Õf5úè*d‡ãp‚§¯˜ëóyêNeçªrWjmì:ÚjÕ¯Pe%_èíÙ(Æò0i7”Ï¦öý¼JÝ\#orl\ÿƒŽ{Vì*Ê¿¿†	ð¾hgJTC@n çðHßËxõ¼EN_£®·`%ïKÕk˜zîAÝk.f”£hPŽÅ®‚Æßâ»
>†TcŒ±ÁäF”Æ„çYˆÑ'÷ôÑ}|lÊ_ø“UxÅÜ“ò7Oàú©¶úÏNFI©µp:G´]Q@‹í\…Á°Ž g‰Õp‹n¦ Çå*Cb¯=, ÇÔjS±Ï	Õsèrg-»ºCoNwº¾c;ÄÒ`,c"ÍUwlpŸ‹t\°½SKÂÛ.¾ÛX"Ü4íÁ#I5&®Õ£âNvo¼ì%*.þ¤uˆ¦Y±É¤2­/kÊ‡—píúuë>²u64@¼Îèðç'ù$¾N‚)šÕ;S>ÄsÝ³ºëjœC!žÄŽpœÍ.õ'|+Ü¹+‹vœ:¸Ã#®_¸}Ã™¦ì£ptõÌâ]&³É ¦!¢ÅÞõúÈÖÓ„rkÝË´š(Õ%Ã6R]¥avbW0:½Š¯Ã
Èî™ÈEº"UH<ŠãÈ–"5ß–¬)fÁÊb½}†ë)=ý5
¯%ëî~ÿº^HQK&±Jåú@H$«x‡5bãüªÄ"ŸÛõ‘ “p0D7¼Ï;0¹ˆÐ×„“(»!YàçYÄ@„jâQ…ÊÅª0ñŽ)Ï?¾sHAáõñÇŠ(P×©X Ø³øý(Nàî›sô¿çlýq´îæq÷Ð0ª Ça&
©¯°óbŒ—rää¾ÏýþiIY¬Ì`_ò˜ƒqQ9 ŒèÕÏòé?þ8Ð‘#Î®B4)òˆiÞ ¦LÓe
LÊb
5ÈólÀ—(²QŠa—3\—oò”m0 !å³0ßRœ¤Ôïõ6 €'ÃÈÃxŠÛ%Q3øc£0KÑÆ3Ì§†1Þ0„GA¤+yÌb-ÅUÀèb©JN¢\¼KÿØ‘÷¹°ù5y²rçêW€Ó÷íÄª0—ÇžŸk¾wOJ}!?Ö\¦(=N¤ƒžoå ’ÏçýUaTAøï£d}‰‡@(áÉ– žtP ¸Œ“ÎýÇÄÒò×„yxÚbÛâpúŒþø_ÎÉì)÷q°ê£0û8ˆ}]w8œÑð”ç<ø¿(Æ¢¢z´VD´ß7êf÷BìôÅ¬Ö_T£è»%ÒÎ–V´Ô ï‹bî/çh[%ò~Ík«:ÿ ¼9pèÈ<ˆºwÞôÁ’[µ¸Š6eÏ‚äÞlèÝkÝ!wIÚ,Z…ÚEýhÙ8¿Î„1º¿®1¥ ´(ÒƒƒÌ¡êaÀT+÷Î=;¾	²P„©Ô;¼íÀ¾•*-ª»+÷eˆír˜Tª›âÉå‹ß‹"yi˜í—šhç‰à©—j–Žˆ¹cE=|t‰>ë¤„,TV;€ØšƒYºÏ2ró 4£üæ_ÑLù¢(Lø]]ƒC{?šJxƒTÂîéUÛ7bîuÊ—¢Œ ­PŸ ,5PþP5uÝO’à¦s‘Äã6æÀ?³6´v˜g"à†dÍ§<Uä3¸“åe,‰œdmžM4½ñ°‡ÈÉE$½¹•÷NÿÆð_¯¹Tê;°b×‘öªí ¹¡?	Pµ]rAdÛw¤z3ßh‚¼¢	˜QèGŒf
9S—¢›·$¥U2jÞ
g÷r^7ç•QÎ0Â˜¦¹yKqv…Úç7øy-Þx´ãK”ª~sø¹:üÄíÜOÉI¬æœ‚‡C¹û´ÄUÁ.Â¤èž_“‚9"î¶LF Dõ²R-¶¿(•óìæå°ÝÊ¥‚Õ«‹lÜ¬Ò«­å§ÀúOÂä—³×¯*ƒä0±Ö[m™e„¿R©ß<á6|¾N€ÅÜfí«l<ÚZhæôItFO,¯ µŠS|A$c·µ5/òaó!xÔ&Qžîäà¤‘¶?x#q¤žAoõBù³Té´pôËm4êAõ_X™rs•ý×÷Õ)?y£ž#H³ï‡#w’9? .‚q4ºÙfK/Q É3½IA²XEð1˜¤ Ô%ÑÅ6†hØfHÖŸ úŒâd›ý[/ì?^?Âèä¸
Ñ‚¿ÍàÐyâ_´¥£úÃÍE€Þ(ºœl3~³I[¹—Ö<Ýa[·Yú‰¥ñ(²ûá£‹îÍŠ²öyÛömÆo7ioŠõÍç¨ù{[[ÿf€Ú‚fÆÀPÀ¡›Ït£Y+Su,Í¡r&s*¾qIŒÈªÄ‘‹GÁÅ 9¸s8Ã˜î²xJná|åÐºÜëõ›M¶p%2öÞ#›ð¡‰þ˜s›çZ%ÑþµØS7Í¹à¡ÅŽÊk<oüuãM
Läü.Ó“9:õFÖhX\½‘†Hkˆóœ =ÞÖÏ-ØÔ¦ÖÔÖÆOÎ7¥xwmm\ll…¨ª®‘3°	oŽ––v~jÖ‚ç˜ßo:
`Óà÷'Ü2œ‰D1d†õ¼HðÿOP³Õ|uÅnøO«üû6p€HHð$ aéò<ÀŠ!âîær#Ò›Õ¤7‹%4Ñ3šhH¹Q.Óÿ†®D{ìGögø¿>¦¦ÇIîœZ4'ˆ.‡R™”ËcwGü…6€nƒ€âÍí¬ysy;5ÞeÚ³¨.¡Qì¶Èg2fW´WŠ™!.¢Šö‰íˆœ7ÃžÂs­oâ›æÑµÅoªèKÅà6[ÅÖ†ÓÞòÿX*àM5iÂö¾Á°È²R¼¸÷D=Ë¼ åÅlB¢`»QAÃ¼•àKš£Ñ–|„„™6’„óæI7b¶œ†ÙY4ãYÖ®îq…=êvvíhÜ¿|ô•FÕBaÀ›]ï2Aþ¥a/û#ÉÎšç…]ï#z©´
£r«_®ÜQ?VUzÔ=“7xmGÍåØæ_\òB.•TË·i¾Èu…:¤¹µ8ŽM•b)tÍ«JãtŒ×öè­WEv1FOÒù«ø’^…¡S%\ãå¼P¬d®–b¯0:s ³5†;—Ô½–¬+Þv‡›U*ëÍÒVñ¥Ë¼#1×]ucø0šdbC^wŒÁ:Ò÷QåJ:³W¸² UøØžÞLèg©¢EÚétªmçõ*Ù6sê ëBk"ÕÕñ)ñSkéòãõXzx÷º‚´™kÉÀ¸>°Æ•ªÏ _ìÊ°ÎÊ3{–µ´æØn©¢rG±ÜÑºvÊ^ ˆj*húÄöðyÜŒÃJ(h ‡°S¨©ïÐQ}¢ŒUœµK®×yÐ(.rÂ=¦I³·8j»=ŽùÚT$Z°¨VUD©k±«ÐÞb' ˜7>÷Z¿,i>¤’ñ—a&|ÏðÖ)òþ¢©Âa§Š#àí±Jw8,ìÕXx]·__ Å4ØO	(úw_=:D‹v¹×§Ó8¦ì+ß­ê¡â§Q˜¡/{8IÃŠòÜ­®åˆfše¿Ñ^WLø<A˜:œ°RòÂJ“ŽPÃ¿Ô›ßüá|È=”jÞÆÀ½
ÚÁ
¯ãˆ¾
ãØ:ƒ$Äpƒ}‘j-EÈ +¿Z<vî~¬¦oê8Ä¨—°Ñ?Ó×*‚íðgÖ«j¸Š›­øÉ+}c‘½1Ïm#¯-wæÁ«/¬—Cî|È‰2T'ëu—¬’ë‹g"®œÝÌ/;¤æIBÄ¯Ê‘DŽÁÃÍ?xgžQr*ÑÿŠS‰5ô’cÇ}?'ªÝ9¿ôÉÂéê5‰5WôWIÞ<^Ó«ñ™ü¼€ç´Æs	ßpºÐhç1©3¯k—‡ß0Ù@ŒT
bŸ_æq
v¤ð«
Y1$~=L2×K3Ì1Wú±?ö'CëëøãzB?~ø^kù6»¤Àöƒ”÷J{Å/{¢ƒšü.›Ú#´Çã@Í´\¸°¥¼ ÖtŽxåIQ.=ãùM“çGÉ6ðÂÌ;lµæ®ó¤Sä†-_úƒ Æ§²m››ŸŠø^ÑÙ7G£_Q#¬ÎÌbfA³Æ™\p,²ÒÔYõ<	Âˆ=	ø!ÏˆáLùZ5BB_¼¨ªÝ¼N©CÿÿÿÝ Ï¶x@‘ a”eOp“Ô¤€S÷‹œ^5d+…ž­èi¼ï©£;áN2ôÀõÉõí¬Uü¨onhŸ}ÔÚ&Æ°Âž^MZI,3MÂUžZ¦Á–Q´#>‹^›nÙoÉçuâ®ß.öÀœœ¨ölP¥u úQº:|+’çìœÛóÛA³=®Jcq–DÁä²ÈyÚ¿-P@¢Ûò%8<EÃqBé¯ÏCwÄÖ0e0Ê|’¼ûfÉ·ìïãÍ®)÷ÈÅmÁA¹æ—a&˜T1©~‘HÕ•Q÷°4ÂO½¥öâEýr“»d…Ç–H´‚Žñ@B·ÖßØgtñ€Ì‚ëÑ@;“ °¾„œÿÙU”y‰l¶ÊaIÂqˆ²@ÍÛ}zû4ÄJ•ùë§aÅ³”ÊF¼ˆØò—×Ñ$æÃ¼–îSjô:ºJmJ—O-yüNîjÝÊwŠ<ªƒOÔPãRžœX^LUä†[xO+	ojÄ\¸ZÛ°ÑnEÆZ¿—SÑºª÷¶Ùï	ñš—ùª¨º0ÅèVé¿¤s›>Ù‰Kä«Ö(ÙÚ#Â{ Ó¡'IIïÑÚþ’7sk‡-{ífw³µÇËî±óô-OâÉem	^^]ò-\?ýì&¬¶÷1mN˜Ð¸©Ý=¿	x Fí#ºqwºä
“”QòK4Z•#Ðç EŸ6
nâY&saöUrOX;~þ‚]†“gðª]Ž†»ÎÈu¹®h4¾aÆªÍY¥¼¹š|×Ñó¼%œÜæÒÁï™p@\*ùÚ œÙògÐ}nsw¸âÍº‹ƒØç1 K|,KìÖ­®Ý¹êÛì¨MäšwÝN3¿W&•{êññœÔKy0Vìå”œ—Ðî§Ý%á¼„E±3˜Ã)ÖB¾%ÞÍé$œÎÎ1Ýo|A¦Öã«hM§ÑCÜ®úæì²U?Vçl™áw‰…ÿ–üçº®Ïµ{Ñû©Ð”žïŸœ½><:co^°ÃçoöÏ^¾9ª™N¯\råÒUd³f>Ìç‘1Ÿ~w«÷“xæWáï¼ô«ŽÀ_‰*çJ>¶Â ˆõáù;®zM²,H 3Ëgža¢f¾ù¸Ï¸9hÏ˜8,>ÍÉ¨ú(rzÞKòrü¼	±)Šo‰Â–P<‹dñŠiæþâKØÎÒ
yŒËÊ¢ä/¾$ÆñGô—äEz×.•ÜŽ’¤<¯H òà•¼¥á|Ë¡f'_•”ªúŒjPGµm‘´£è*]€PYïÇ:žó€‡š}R¬ õUž¸œ÷«Ãý“£Ãv´ÿúp»öh¯`Žê%É›m×kèýS·k¡J:ÂgŒ}¾´*ƒóî’Wå_N_ž²£·¯ŸÁö«“£åEq¢"{³RlAŸíÚ˜Çf™´ÐY8uäËß%oö»Lb~OUšüßQÞžœ ‹pzx€ÜÁ=RmØ².·vôMðÐcíŸ¬ ßÅdœ!i^n—¿­øÂ+~øŸû¯_>goŽØóý³û< XòÜj¹“Å¯âA0
ñë)º·—ÂÉêÛSxwŽ¡¿³4q§KSÌÆa!c€•2”(KÞG±Uyè–•YB½3øçy”HmÂ c6žäŒR-ËRí*¹‚jÃOu“÷ì0ù¹ý%Ü]Òý‹“œÕGÎÎ‰ÌÐZ‰Êk–ÕÌ˜þ¥àËoa4=Ø­!WùÀU\®
Åœˆ;ƒûÃ…ž Ä /Q—ç§Èb«=ß»Ê’H,éâ,4QÌ”»êÕ§s¾f½ÛY¤Øç³Ñè‰æ;„ì-Žè À¤Ûy[äâø¼Þ¯íá*f3XÄ‰Un'ûê wl{ÊZ¬ÝÂéÃAìô÷ÂÀð;z®ßå.a'Ï…Kýp{öËS‹½yñâðèôp¹¿¶ZOà i×Ð<õ¾U®ZˆŒ0Z‚ðÄZÕYE÷AyÊ>ü:Kªnxmô{™¸%ÁƒrY95®*¨×úù‘%®?xµzªrÂüvµêßêbeÿd§oŸýÐØ¶cÕWËÔ^ž
&7•;Bç£êx²ÕUs\¡r)ëgª´9U
o[.î7\R	V3Èevº¬î¢>¸/}v¸ðHÕožžü•ô«ìÕ›Ÿ}ÉÂÔªæ6O'eè<ÑÜ!Ó!ŽŸ’ÆCÎQ[\fêí~^h¶¨-ÙŠžu(ù hgW.n^¬_\ää÷‡ÃáÖEèIf
Y·†ýGÃÇ÷‚¬/Î IAØG,ýí™;egûÿãðÈ¿$wcœÝô†7½pV5gûØª}˜ZKµ~Æ¨6/*…eG£û9xrûîvnàÍb×‡i"µ
º²­Wy×„K„bì½ë©]÷„[†sZx	Ü˜ëºË´r¥šÃlá+Ý¨Ëý¨«Ð~«o¦1ä4?óƒÃØ«\$,Yê÷»‹XcMÄ–iá–0	½Y·Œ%±Ñ¥øÍÒ6»€a”VˆwŽØ¦Qz£L1ª¥˜V[Z¥ùà!L º‹›L¥ŸÝ§¢Ïy¨xËAhŒ5i;=¥ÚJ³¤6³½JõJ?<JŸüòæÍ+öóÛ—Ï÷Ñ¬bëËƒÃUdÆ»){kGqÆ¥ÈÛç.¸\[÷Àç¶vÌéì¬aAµâ¨ÛÙçù8ŽEYµ¥yJµ1Ñá H†ef{çõþü÷sñÌëxŒL©Z½]i=3a!ØîJSKéw.µ¦ð€ød>iyã4TŠ{žjCo_£´œg{ âp aÒÏÊ¸ó¹(dkdîÎ³dV
uºÅçÁèh6>“1Œt">éÏiåÚpÖÏFÁä·?0Àñ-PÇ¦hh¶Fj–äôEÏÓºƒ·ùDiJÝ½™†^Ñ€ôðIÈêT7xìÎõï¥Ö4°W/ƒ<;k%º‘ÿô"‡(ç–PS‚%Jå#ø]í/Œø ŸSŸ™T±;Ç¿ùÝµ¢÷ùÔ¬êk¬^éÆêÈ,šÀ"¬vµLY’Š“xŠ…‚ô=ùÇê»þf÷}}ÂÔ2äUío,9[ê*Ï¨)dÊ,J3º”ÁÍøSÞ÷ð´•‚ýGÍ’°fµš›ÕG¦s¨e€ÖÂÅÓO«}½a—‰4 É¢«eGÔz‡m.(}²'%Ø9ˆa]~ôdæ?[ö@Bg>){(ºÎ›(a´¹¿/JxIt>#^‹ÆÀ~´»ë[ûÔ²ž ÂØÄ]·€gÂPVÉAlUZÊÏfƒãJ@[ów9ò©Yð²âîQî¼Åq·gzŸ“CtÂa°Êið†®Å8«Ós)ç†Hÿ]J‚ÑVÄ´¸èZBàLd'[Ü’<øñ>zÎ¬Jðþéé›ƒ—\Ü>=>Û_v¸ÚÚœlu4Ï“¡¬àô!Ö‚aHx¹ÿŠ¾<>s8¼ºŠ¹-°Î	œ¥¶ÍlJ;‡j§¦<mŸ—åª
5j˜^¬*„ÍÃG„ ó	nç<L*DŒZç¹’'uW9øzUIà 4Ö |Þvâ„Ñíãrœ !¢ˆŽ	Ýãà†<HÐüÜÀ6‡$x¦¼“ç•ÑûŽÁ—ë’ Q$ÝD'!Ýo‚ñõÇ½=aQŸ“Ë^g³ÉbÖ¤tÌ×»•ûå?³ U•\®E[!Ø½"ßLÅ>I@¶.}át÷½a~spj³­½ÈeâCU^yUí=ÎÛ³åîA´²¥P~¥pyuRéšê›÷² £drw@”
®SB/GcŸG9"^³"ÈöZ—Þ;ÀW¡Äò…¬Pê©›WD<VªÐªÚd'vÄ+<*ªÜ5`"mŠv¹„Ø€F«D^ÖƒëWÐe·Y«”tÉÍ¡:÷œ°If#ªæX½ŸööÇä;uDÃ;o†©—tZ“©
ã-aæ6ŠhEÃ‹0(èŒo¢A§Þ&hzÂªrÀ²Ñû šArÃ¦A‚L4…çH<½ <µ7@%¯éÞQañÿ×ÿ±€# uÇeïdñTÏ´ûîÔv!%6Ë‚lF±y±”Õ‡Q
sˆÆö˜ÿ¦"î~Ë×L¯¬sY£ðÂÊÎÚ…¤Î¦mÿÉD›N9‰©Æ°½£7g/·Ù_ß¼z{t¶ò7FBÔ›£³“—ÏÞòM›çCàf‹!ÿ©œ¼À¾¯Î®¢”	¶˜ÁÇ´Œ³XÍ~™Ä€·,	ŸE	•Î£ é0Wu®°¢â
›&1/¦¸¯ÀH 2ñ…Ð~
çÏtšMg½	¿B O”ì#L×0orÂ[‚N„NŸ
&7²•óp^D>€þNÑ ì°£x²*g“^aöPv¦³LoB¯OyJ|p/~`ž—°V1ÅÿŽ?óÝºv9’aL,I—¿Ð‚I€à¼ÃMÄ`åmè7‰¯Gáð’  ¢š‹å¨º1jè#·ŸQð3 $¬÷
~²4]¬°aòÕÓ,8Eé<dô¼ÖØ5`§³QJ;<o°+Âá ÷XÙ|F‚%S‡ª@BfÊ¼—Ä=Bºë(»	„Þ9Š;¬·¾ÂÒëwû}ÏaÛˆ —NÍà„"×Î$ö$À³ÑVèrZs)tzq‹~¹¸Åºžñ§ÂŸß*DªÅ/´ü¿>ŠO2Xxª;›AÉRókwúVìäCtûƒ!:
tªå’´’zû	œÏzJ¥œ`ä¿—«)åu){½ŠzGj—„F½IKéH¡ûý·Á`ð¤T·Q«Y¥Ý¬¬ŽmN\”²£Æ´2kˆ«O„ÇÂj*]új!Î­­­'•þ€ä§Ö1)«y¶"…”ªcGË¨•Fý‹Ã©…¼¨ŠUÕsJn3Yl,}%°Ö××ŽÌ¢o®tJªüÕ-sŸ¤wO
£ôÔ\í¸ÇLÔ!cµëe¶jXh|å¢zíÆcÐ{ñ)È¹Apø¾Zw]ƒu°R¥.¤Ã®©Âö`PÖõÛw´~ºrû. ¼ûî±Õ‡JE½ž­¢Þ#/í$Å™Ü>Æÿî•Ö{’us´¼=ãør !ÿ}“¶„¡9gíïçåÖÛFÇÃÝhØfÅÒ#Z*Ä<µÙÖvî+ÛNðRjç6€öê’JˆÖèÁÝ°td’R©ÿ tÔ-ÕvÿÑ´õ#ÞÄ_Q•/ÐjäÖòbÜ=>ãn‡c#ñ”´ã¡Ä{úÞ–-äîûR'¥íh”F‰mÆ­wyŒ³¸	³úy™ÚÂN¼
Õ¾OÀrÍä ¤À×ýrÌl½7Ô¤+#¹GîWç’z›À%9x0+m¸²DJV#žBÈòÎ;¾¬ŠœQò¿©Òä6¬…ŽLµ¦}Y¤Îuaï|ãüóáÆHÑ=Ó¨°þtqaðáaxÑ§›ÚU`js8êiÅÛ€8‘¶é”‰ð‚êTÉ ^gS]Œ’¾'IÀºØ²€©"³‘>'©à2hà#¢>ö¡š½/Ct[…^®‹­³.îo¶[Ou² ÿh6šš	{h~øFzÌ±>Wõý´ÞÖ+wíÿ-Ú4‹SÄªß>Øƒ˜­ÕÆIÑß^Ú¡’æ;Wa0ÜÛ¡T@….×KÆC¬²%ögæÖ}ÁK;k¼÷ÞLaçŒCw“ÞN‚(+”ï½Íñø	»eX€)ùºŠ~~Ç(plqg“êµãxT3@T}õèã	V¿f»L­kÏòƒXK‚ãYÝ>)Þº  ¦æ)Ï1Ï²vuC+ìÖ»ÇkÞ¡‰w6Å;yY{Q²^¤wÖm\fÞb@³Õ¯3ªÕWŒ_È æ_7^Æ³ µ½Œ‚ð}{¼//pßÓlWÞ°æý»’ü¡:ÎRTVÆØ5®z³„œUÆ-ýcõ]¯ï–4nc(E±Æ›ÝµGåX'‹]—±Šç¢	¬o0Â¸Üùì†’s¤ð‡œÈãÍvƒ¢åJk¯÷ò×{ô®ãÕðS”-Ú­-Ë{µñ‰ºZ}÷¸ûñê}ÉGÏ(÷Êã´>y­ñ.ÓsêRY¼Â7¯¿½‚’ÃÛÚ‚V¾(ëhÆl¨ ¬ÅI§ï”gÏgqL¡„²lüÆ]ËÆWwg)Oótf&Öãi¤‹&YlíY6¿LÓ%nÍëÇÛËVVÁÀ#Œ;Âì&°ZV#ðçå®c@wt-¤t÷<ù ÜFÃ:°¶ãêD:‹rGn×	~•ÝLNKÃsú™ðKÛ‡}ÕÑ³t"åæŒ£ÎfWŠØGáæ*e]¿ëFõJßgÂÉ ®Àe¥"Úâ&
ÈUàg@2;œ•µòL”Ntà#¤:E¾8º
g!¡žÌ”Ý¹c¬¿!Väu^*Áõó 0•¤HñÍ‡ñ´ó®bƒFÃ÷ö°Ï÷˜éùá‹ý·¯Îþ~vxòúïÏ÷ÏöÝqþàýÕ:U_ŸˆÊwƒ8»|’¥ìt6£üW_í·6â ¤øºÎCê|JLÍßÕ?ƒ±QpŽ¶ÙÒ¯ e@ÿ“ßÒ¥ö1ÍàìçKØ¹¾î\§Š–k…IÁ±bi¯¯yªFþ]I,›ø£0?ôèËO”k¥á¨UZz¤–‘ƒTÖ|äÓÌ9òp&Áh˜^~_lüDø÷Ó4LSGJ£Ï‚FŸÎÑ(æcçßøÈëþžç«FµÃ
‹ˆyÀÊ´Ê‘Z*rþ9i…è»Êê¡Æ©þ¢˜v<íÐl½‹Ò³šÀ€ÊŸG®ŽàÈÂïñqÐ7*šË*¹Ísè5¦*vVÍÐ`¸4KN‚°±é$ê`*¶„uñŽ8Z7—O¥»f.×æö,=Gß— c¾ŠR8îû8àÖÇ“ŽFâýJÑ»ÎD¯3ˆÙƒzxDœG…-Ïêµ}Üv¾bÜä±uVœK/Š‚«w[¸4{"¦_‰Ë
Ål»æmÁ§‘Î†J#}ÚIq,#ð[ïÞ/sJO·$©¯(JPºdYOÀÚ{ƒßN©Càý"âòºYýKºOSó»»¬»,¹;”Fš´Â‡ˆŒÏ®¡¢É‡Ù¼max=CE0¦Œ]ýðƒüØÉ’h<ýw˜7+×~øõ×ïç¥¨ß†-P2MPq‹É§ZnûåÃ—/ÇùíQtÊw•¥FY£óK£2½Œ+Ç8×)åwçêÊÜîé_›w
œîýð®™E­BÔŒà&[xBÎN­Q“t˜Ã®\~þ§ùâïT•'Ñ/w1Óò(Lµcˆ_,[H?[EÆÊRu\Ò'Ý¿çÍÑ¶öN‚¾ÝÛ§¢(àd!RNUÑæöß¿<óçÇÚ1ÎN•dÏo,•¥*æÅ¹ª¨¿nÎjZ—FûðÜU¹Ç¯šÃ*÷3sYÇgN.ËÄµoœÖ7Në§õßÓ’'Ñ¿ ³…qe_)³åõ‡²Œ.Yô1Tôé)ûÛV?ãôoEaHŸù|ÆÌ—I¬`È¤`AvÌ0Yx°bž|Ø"¶°uOxèÒóãÔ™ÁÕ¸D…@<~'•]ŸÁÒæì °;Ý†œ™÷3W9¿¦í/À¶Ô•.«7ð4=¤­éE<ÓT¶s`Kõ ¦9vø”-ª†€1O'îµoö%XŸ
×8cyyGŽ÷Ûliµ¶¤wÕ•·,üØ"o¦¢˜ý|‘1Þ†¿è×‡0]Ä4ÿ1=§¦Ì9ër“ìy‹›ŠáI¢¬½Þýwrí—ÕƒC#¸~=ÝFòÉQbiÖ2û‘­w—s6¤çÏöiÀZ±šöÖš½àÉ{U1¥K?ãú_Í×{à3®iûÿšg\2üvÆ‰æ¿qßÎ¸ogïçwÆ5èÅ[÷sÂ¡G*ö+Î¶»ŸjEƒò<ûR'Y±Åj³°6×(ûžeõ+äa–£@4	\U+šÁ¡áyöÿ   ÿÿì½ÝrI’.x_OE«)‚U$H‚?’XúŠ¤$Î¡DÉªÞZ­¬•’`¶ $*3A
Ã¡YÛ¼À¹˜cçvÍöv¯æ•ú	öÖÝã?2"3AR*U—hÝ* ‘áááþùl_ˆ<óûàKhFU¡?“D{`I4Q(¤©HëTˆ´õO+ÒÖ?‘öÏ-ÓîÙ	þ"MÑUÌf÷wcá‚MÞ”ã±‡½-úœ¥WÕG”ÈáJÒšŒÊò†Þ*¿}Í]l4Ü¤•Æ”Êî¢ï y”ó1)„ºØh:žr9«’ß„ô;æ 	"Õ$P¨ªÔuÓ£™FI«O#,hEe"o“ª…Wœõ•qii÷y.ßD³“ÍdZn’$Gt"õwF˜!Ýót¥„ÔñG•ª·¹HÇ…âµšUU’þ¼ë«´Z{©”ñpÒó^VwS-¯§ô›<{6}	bÁÏ‰…pÌº„ªØŒºØ§8s½ý!’‰¡ú:WÞþ±teUUë	ÚÍ7ßHˆ	v0‘x{<ÎÒËh€er[×,¤ýtR ÚÍÞÇq’Å=üxÿR®Ù(ÝîíñµµE*§zœbvƒ˜áòa‰~™&=£¡gˆµ7G#³IóªÙ¸y]vóL"‘Ã|’IËMË·X*WÀÓ.Ê‚¸âû;0:áq,Û‹ú¸?¡:1ˆ† "q¶ƒYSp×üy–Å1%?§ú¼xþ'ñH=>ïãÝ”²×ä×WF ‰Ç¸1y*îMÈ
Ï5/‰ÉURMã<GT¸ç×t’æÌ„ƒ"u'¦ì*J0¾‚ "œØf/*ð›h¯Íàiv• Ö‚®†\hŠ­r˜X×nL ?Ø»D õ$Îù-=öÚž§YÅØ9µÞÚÝ7ÍYšól˜eú¼)æ‡ÙS,î%üäCöÓåUõ¼š¼ƒX/0H1úù†Å@bœ’+÷Ô8ã^p˜±N‹”O8ƒ„««ÖÃHÿÇN’ua´.o±-VVV´à@÷ùêrÀ¥ß&(
.¢œ¡š‰‡%“Em^’cMáfÖ›¸T23(ƒ‡àRÃ01“Q4).ÒFÜôÒfG4š"x„(Ã¦8˜q¸
’øzÀáÂ-Ñ‡¸í.ÉªHƒ%RÊ…o‘´|w*Šªi9kõ|’h3V,Ö›”LsÐžÑèË+v
K Ðô÷wi^HG€	U0XSäOÑ%í»í££ãÃ_öv­¶ÛlÛîkF. §jÁÐøV‡/çIF7œ£y[pôþœnIëÀ: ³¿¥Ø¶oA9’Ùÿ5Ÿ›K+¨Yñ ®Äà/|U‘5X»’õ•Œ–. æ•ÊÔñREl	›fÓÊ‰u1x '¨?ñFGAJ%sGåé`‚èDéx	«Úœ#JŽ€r¹àÿ‘™œë+À%	2h	è&Q ^h}­"º85×ÝÇò½TŽbuyÜÒ§«¥·@·¨^¨O‚­:ÁMŒðxÀè[¡y®þ° *—¹ÓîPåât‡uÏãPbx¦qHíÊöCx¡Œ F%ð  R‘‹OdîBö$	*¤!Ð UýVkä ‚#a¹äç6@HÄ¾(ÁÅúwÌ¸Ô“ä,Íõûší³ÊáPPïO°JVöÝµÁÛoÞ[¸$%fáfŒ”Fp¯
=uf„~äï9DØ¤ï®¹ð(åÓÓuS—/éäwts`ÿ¥è¾k’1v·¶ãÃøh°œg®ƒ7ø³aÔÙs
yáˆ<þ«k¥þc®Ä|NÒè¯$æ}€$ÏØÜ¯Z€¡ig	HšPÖPe‰ùØKR5Þ	"v^Ò©,h»ñ•Q“3ŽŒ‡»Ó‡‹³uÇ!P/¦ØU
$/P¸
­hÎ1øœ£š»ßµêFÍ4ÆœKÆ”$Œ$=³q_Y°zü?_ZÅPòŠñtiMŸxÀ‘wÎÈ{ß}LN¶E0nè¿|ôð&‡§öV1òüIÒ±ÃI1®ù…}Ú7i/ð
Ùü1g%é£A¹÷¾ÿžUíçðÅKåÁ¢Ò¶m«È&±ãV°]ÚëJd
ÆÚ.9î
3æ›äŒ{Éd¨kp6_ì¸ë®q¯Ì!¬qæ'×” Lrsß:Þ˜Ö¤Ø‰²žhÜ¼	l<_sývèä@ìFD7†EÓhñTõÊÐ LŸŒ¼f¼6|¥•!!zUxÐ«?¸7•1Ý;*Ñ Wš¢Aš[}yÝ^Ë0¤1cøe¬YÑ˜áùÑ3Ô¸‡*¨GTºP³àµú…Â_iW~H¡b¹phÕ—Ž‚¬aºr ˆuWÍX¸£¬ì°ià›BÿÞ¬Å«MU`xÈ=,½’CøÞšÕ`Ü…Àíšþ¬“‚èqèßîò.h—Þã…2»€[œÚ!0Ë;bXÎ=U,8Ž’l8UéSŠ†®gHS_Àô%g mÇ¢Œ1é­›Púp2¼3Þ‰ðŸAÏ’0Uû
›¾â¹è%Ú‰É¢9Ûd}-2L¸‘„JšžŸ£Sç|†yh³qœ³(C%wÀ‘ÕØº™BwX*L;PªÛVÜ¬$C.nü¶´çJ¬WÇä5zA¾)Ù£ÐŸÅ)w¡j÷žkÃÖÄ)wø˜9W¯FŽ}Œøô±½Ï9›2×µâ”þq¶n¨ŽnmÂ±öX.•^"xÌø¸ÈÂ§V0"+2N”ò]S5?wDpÍãåââ6Í ì=,¬¨šß¶™íÑh`YëèÕÑBU;ð[àñ)„,aÐýa¥¹4eâC}`;ÌµÙ@I^Þ¨
Š\ô¼¯ïQÆe:¬Óì!x±À[U¶kÓÖÜÓG‚/ŸÅ°nÙ¦‡zµÄ›{úÿüïGªÚ/ßï2¿¯éò=Mðê
ûÇßÿ‹u6>Ùä®.®þ¡¦÷ Êúñ=Íng“f6è'›ÞÎâújz_ÇýèÞhwU°‡è,½¼íšÕOñúâ£ÛN1üBU1|²{™„wPñ«U+LIÒ#Èª÷%Ìkÿ˜ß)†^ásãÕ™e§©»„½J¯Ð•	:¹wúüéì³;ýœ›a?gpOü%6BòÉƒd‘¨œ]&(¯E–ŽúO_îDù[f»I1êECcÙhqƒr÷æñ¨'B „GÔ[:9½B•zDån¶Ê÷˜êx³:­¿©qjœÕbwÖIðX¶ä,\ifÙúµ–me|œÇï÷ðSVið¥m˜a³íÖ,trNx²FyeÂ†Ý5gêé(m`[L••G+lu£Ã6vÜº~BÍ¾ùY-§ìÉRéÚû9yeœÖØØj¢Ê×y"Mdí1Øv~ÓÓPú70“xú œþµ?Dhðn:†$‹°ÉyM.~Ž£B00
B|#Ô¬ðMKÈ…RáP°/ù#þü×§ôL1tbõs˜÷ûÏ€ñ£`£x}OòíÑTÔ	Þî]&ò:÷ìD, Ç/õéY48‰8Ë©]t(‚©ÖCŸð"5'¿a¹~Ï¡2o%p±‚ÃÛwßPX¡¤Whx‹á¿GYzžâÐèÍ˜ÂÒ{la½½·ï<¯óŒ~*¿”5žÒê¾Êoê>)ßz#Æ—·bñ$)§èFZ@3®ñ±ñêoß=m½}Ga¨âA¬}oAðÏVP$"ýdwtšîÆƒ¸ˆUòB¨[ö„÷”×E)µ¶ÜÛh¿ÎÜJ ¼7(µµg\°ÞhnÎ÷Ü1{ö5o¨Ž.£¬{©<¸T}­è”Nxðæáh0ÕQ©úZ(2U´ öü	¯jÀW}[·¦N\,¯;4°=Š»½´ˆUê‚Õ„¸Ž©Ô¥·©£Ómá§U—¬æhyšØSÕ7óÝ$êRÿ]Ù˜÷G«Ùk–ôdüïOrÇì÷ž×xÒƒqõí‡x*¿½£Ìn¼ã;Ï3¸ò/öÈ-ëk”xŒ¯M÷»IúµÜ"•…9Hû|vŒ5däGwã­;\Ø*ºtçò2{_1ºž“ë¢ƒUí¯Ó^4°{ÄŸái_õ¥/UnÈ·éÿ4:ìË¸bÍ×|š/@›Ÿö1M`{Ó§žš]þKo2`ÑV\Ìù§-õ”µhø´šßmù­žÄ£Ý¶ž?p.V¿òx‚Å.&Žœ‹õËŒOÄî›«›¸„ÕÄA™êhKr• úÅûÓì¼ü#(d`œüºMÅRq=8cöü`µÎYÔc¾¥ˆ}ú´u}cv€¿ƒqÓ¼Ù]õÕzsU,…/Ý€1{üªŠµ¯v…² .ƒ¹´5 Õ½óshËJ¹ÇPæoí 1e½—hD‹dìÿÛOª)Cãigþ¸’•ìÿ¼ëo“8›¶ÄÉ–íÁVšÑ_‰ÎÿŠ›lnƒõð|Úš+’!–àŽçà>0gºøë &EkueeAKjËžjÀ>Y5‡È5¬}Š|Ÿÿéãººˆ3®²!Ô“'ð/ôu‹Q£;å“3¨t£h+T´~[d­¾Xˆ	& _±‚jN@ÆðJqÉßÚ¨—¶ÛxG»ÂÍÂ‚Ê	ò-µÞ|+¼¶â,³ºÇÁÂ:·ázšµæöð?ì<.ºè„ ¹b8W:ÉCŽÝ‚™ÀÆw.þ+ã´i4I¼F,®ÄÐ}Km_E}w§ýÁW‹ÞXïbÄ:Î§£.³Ñ-Šlj ]ÐÖÙ¤6¹ñçôvÙ·Þè-ßë/XP»“¹·c´F¼0ß‚@ ¼ÏˆBòûÀû€\[8ã1ßSE³Æ“ñ`ª·&D&Ÿá<qž/¨¢+½.-óå¾*†ÖFŽY,Ìa´b,mà³ýâÂ¼Ñå½¶ù&Ð3£^÷±ºbo][ï^ÚZBˆ3Cs`”€“»ŠOýÿêÐgxËH3Î1¡u~gš ô1‰nµma™L²÷ˆw-@nŒ¶âqwR”+ï$ÒaÊ$s›ñ¦›st5}šòÊÄªnÂÍH<7Ž‹©¹x0sYÑš{“Ú<S0Œ
ÕÙöœAñ¾W2Ù_h&Ý{LÖ¤·™3$³˜».äÈ„Äâ>'*|Â¨â:})Z°n¤L¯'GË`ï{<BçÄ•QÌê¢Ý#S]ÞÙÎâsã¨tïö8–·X˜x©öx’_´¬nºéå«ÉŽX³wUã0ßUÏæµþüÆ§ˆÅ?ÃX8E:Lò¸†XK<¬ï 
z2¡hŒà˜2>s=öÝ5Í<²ªA`X±~@dÖ~¯” cñ²¡ØÄê²AÐ/xÙ4,’ŠdÈ;œSRšô`jj'5d]GÔ7—àSp-âC24‹e÷•¾¨ípy©$Ûåz†Ä«î.£AÒc¢UÙCÍÉØ»æŽ»Ñír-§-¼Æ­9îŸâ‰…Ü¬‹uÓãËÐÑ3àAV›enç8>‡×†ÄÅÞKQ¶„!ßçfY´ž¿_djfä³¹‹íP£æ²Ö8‹/qâð¿Rü’~ú›½’TÝ‹K6‡îç²6è¨1áÒ£<ë)¢4µµdÌûE;)-£1áIo•&À$HfÈ!’Ž.<_ Ûá®t1¯ü+o‹°&3Ò€òÉy‰ Ã™$€¤båÅ+ÖZ,õŒ‹,Þ/V«Z_ì®ÁŠnßÛbb[òtö®ëˆZŠ<2¾ÅžÐ/p‰º¯uÔÞZC8p=þ¾…Ãý…ˆ£õK|"ù ,”rrf#,¯W<Lbß¶ˆÈPS¢¡
¶£ÿQM{˜Ù¹WjÔíÞ1
÷»±,2¬®ÔÍ¼Ô¢Eœhxî»klæfÎ¢“÷·à3’NnÁcÊgwd5jgÝçêŠFg]Z¿oM"žÈsˆögÉ#ó‚p¢ÜAÂRE•Ëc­¾ÌÒÉX,’PÊæMËÆp”ð\ÿ
\;X~3T¯ìÑ$ü½oÊ}ËÆ+úç‚×ßµ%üü½
¹mw+z4XWÍt.èš·SîÝhßtGÉù¦|eµ“,Ÿv'š®{º‡yáþøï!ŠRO»DÅ0;$ÆÅ7Å‚ãŒ(»õ€&±þ64,	×r^ŸóÅœ‹o*éAà¾ìŸJ·R…Þ†ö8BË\üç0#óQá`6;eÒN-ðý§z±/£ŸÆe\S=gÂ¤2¼
¶‡Ç´ºäùÈØUÎùæóÎŸ> ã‡ ÆäñÁ9'íážMRlÁ;tîïIøi'„Â·Ö?©[\“DyŽ‡Rï¿»¦ïŽóF\œŸ¿aâú ².¿õQb4šVQ¡_·Ó‹á8Ùý*€æVw¤LÑ¶E'@…–Á³îÚ+µBJßß,Îz}B{ìi‰ëÝõByÔj|)kDªä2ûI·¾ýÓ^Pákrmƒjó:¦–b#ÑñwÄ®€;Õ‰¶Xˆ§rXRT)pÓ©ãý“q_i†á¿ö›ÀêB4bÄ?Ç{’#âÑžPìaè¤Gm=H1âÃ¼÷ÈÜÜ‚Ø"í"¥[v¢<–ïBÂK?­Š«Jw¹øj„>9¾0[¿†‹"£Œ÷ÿ„<”íÂ¼V;&qÈà4…Ê³g 4>G‡å±u‚aO²i÷qa­gl=Îøj¸øêŒÇ\$é{ÃõnÙ×†Ò}:NR‘C¡“$3B©æiv5j&%ÊzDLN.¶à	Î¸—¯áËô`‹- ¡Ì©ò6ÎÜôÔKú}ÎãTöj¿ùìúêÚªùÀdôa”^I›9ß!bÄ^¡ßHä’ôÔX¢'ƒÈ¾UkÑ¾ˆò–ý¤bßZDÜÅ›ÉŒ³gL³H[™®Ÿ¯[è>®w¬zþ4ãÀ	,3òä‘9»%Zg‡ú§N)Ñ’ÚF÷Oi·›*çÙð|ÝÂ~žÁz¶f‹ßm©ü ‰º‹Ùïý²•JËß3ƒöÓN{ÜM[à¦ü™¿"¾˜ÃÊE ûÑåX¥Ô~,ý‚ç^3çŽÿ¦Æ…/ìŒ
tœ†hŽ'Õ„jX:C LÃYnªaMéýGlXÍƒ"+f){;ÈY6²œ3¯1üú"¬“ùÕX"õvßFüH“È‘?gÌˆœ¹ÚÐ‘o!6wÌ³ÍÒØÑ2°tóW;pt†`Í¹°}‡ÍXF…ÛCõQt„¢Êæ£ŠÆëI‰+›W4ßü¨,ÆqeG±·#µ³ÊCÄÅ(pÈâ‡7ŠëµäÉg€·	"’É6+­À Ç¶Ø°tìÞŠhÔÓsÆÛ}†Ï·%>õ;!³Ÿ¤ã½=‘G\º	vOöx¬#=ëŽt,5êD;†“î?žÂ9oÀk û‡#<äBð¤3Þf€Ø¸ÜœPÂîøGa,ü-Âð)ïÑ	ÁÏ?$ÂåÒ¿Õw‘Mè¯$=ò5y)Þ˜üÚP|NŸ/óJ{oeväÅ<ü—Þs¾¶qŸÇÑ	µù»0Š>¥¯LÏ²üy/;™°9Ýºv ‚§D(Y€¾ŒyRâ¼ñ¶eçÌ„ÏyÝv­0ÞOD¼#éaõ)ZAÙN¿¶y-yX.ˆ†‡LË—kÃ²ââòÁø%÷™%Ý«¸lÅŠò`MßÓ0–¿»v‡qó¾’ÉSÚ0½T°>Ç°­‹ö‹4î!d¼1íq\ÛÏ£É °§:•¶”Aää³†Ül|~ø«‰@ßTckb¢¯Y/ÉÇƒhÊÏNÌ\Cå²{u²×=N»’žtŸ@r§¡JÚˆ¨óáó]“Îï
Ç{x"8|Ë›¡©-ÏÿñN³ÇPž=Ý¯‡hoW˜AÁ™Z&
Åãú['…¾ÍOR¸ßôWúÃb™{£nŠ+EÉñ½çÑã²–U!ÌÇ»qÔÃ¡â»Í'×öwDŽBÁ[ÂR)!à®Þ
wÃƒ€kÁ9Ì„ü»h‚Ó6‚VO” oëÑk7môÚ|h ×VÀøz°@ª`6¸‘†Mà ¥ªaÃ3˜Ö¦@Giq5Ö«;VªCÏÊ\U|È~µ éc¬„ƒª
ñô'×>NSa©
FÖ12ˆÎâAy¶óÀlª9
]®½1÷ôX¡°ÇËÔYs<Ö \åð7X}B#?ÂäpÄG“ýÓyÜMsÜÖÚ™¼(†ÂOæL±F)sŸf–w¹,%R«šád4ž¾

ýà®÷Öb:£÷ÿºÛvÙš¿jj:Ú!­óÉu+–hÑ&ø˜Ëømj2PüÞ¼_ uÄ8ãí~›ýÛ$±Ý˜Dl'›ü»”eœUÅ¿BˆV>R‚Õë‚–Šæ*rýEWJ\^]?ØðÊ¸šN
”CTÜÇ­B@ÞCfg¼³F¼÷¿'Â¿ÀÞ=¿6…lö_ôá†…Pã^¸gœšøÏ¾7(Š»*¡,œq-­+Ö°f†ƒ2ÖÝªÿ ÂÓY2s9}/J/âöôî*eù|xÝ+ÏšùaÇë§='ÑâiåöM06·êF%ŠYfN¦‚¨4JyÏ0ÁF™ñIj¹³¢&{KÖÔ’u¿j‹LÌ´t/ñ­ÉìDPH³%-µöë7bÉ¢ ¶¢ÐÏ–ò1Š“å§TPºq^šÏ—ûÂÒûðÂP©G
³ÕÕ^,»àQËH›3k©ŸC5®)¦©á™GIlRÄ‡«~ÛYLÕÿò‰øpq¨I#Ï@&Ð5ƒÁ{Hev-«Ï0àq´¬c8…ÎÆ x^	é VRáGž±ùWw½ux–ÛÖÓ)w¬ê<?ã%(#ž‘Ðk/¥Z†°òÀ@Êp|3È´*`”íðÊ
>~kÔ¶q}ÁõÀ\RÃë‘þH¼ãFúÛõu¬açŒ¸ÌË¼Â)ÈzjgÏò£Ì<_¢¦ªž-¼ðÀ'­îažty(ñIôŽBh¶9äoÛhËÕá–qh\×?-§vMd¨¢lŠ, l„©¯äwæÁ~|šE¹§4Ÿ¬?<.’â“ÀŸJºÐ¢3y‚øRµJãâ1-£ jÀ'£`D&`0»º€‰d<0&g½”êØÆ1¯ M‡iÛl>íïý²w|²ÿü`ïsqùŠsÉ¯ì¾vÝ¨ßÙ9¾ØmËÇ+Ÿç‹þggúöÆüäÌßDì˜•ñwnÅø7?=ã¹ÿ¾
„°@ BžpÏ}V™@[Jpl	ç‹áçt›¯¼¼)/·ÁþL]0Wš€OÊÏýˆªÄÕ[n<&¶ÈuR“ÿanAÿä<ñÈ 3½CåYqˆj(î®Í”"A³D¯R‚sTN1ó$žéÆÍ´GëhZÌðï$ûJ?Kòi‡g…äs«­—XáõòìGg?,»»ÓJ_q¸Uûn¹ÒÉzW±g,M«ø«˜ø¥ºSCd–j˜n½‘ü"KF–Bõ“š8¯*JwK<+bøD?,~Ñï–ÆäðÖÌØì¡º˜^¡|ÕþÆéÔÜÓ #r}„óxqþ†À0QÄRxE &Æ,…/*„’O²ûÁ¦&AJU‹ñ`uÚêÒ³RÄ¬mzDŒÿè@Õ¢­©qû{Ø®yšñp°!Ko6*=ìÙDØ7	®ýÑyêé½º^–Y¨ãÝÞÄ:šþþta"k5‡Y]±Ë=Ø[®e)(µlÇØ½\³ð›&»íYH¼7µ»Q¶]´VPÖþŒ±¼e
ågZi¨x`þÙ¼wïTr=7"ì*ÌbËå‹ôÄ:LÐ-ôE³¥0Ë6žY‰hxÎ´Â¥{špKÙ;^Ák5©-»G3X¸½Z	ò^%éQã"Ra’¥À‚@E]ïøÂ”ˆÑàþhq033Ã/?€LCù3Ê íl*.Q0`^"ù˜_¹¸.iÒæŸ™ôæ'q¡3¿øÂS¸Dÿ9ZµÅàï’9Ý¶Ý3|èµMò=ùu>ÐýMhXŽ­Çe£%&£t€ƒž:÷¾ÍO§1^sa†÷l¶z0ðí,‹¦íó,¶ì,´ó4+Z­h‘EœµaFƒx'¢sº-„ú!$Ý˜L…,%5Ú+Åþ«å<ëeÝ¼Añ¾U]`ÚjPHïMÊG’¥éS5¨4ÉÑYÔ#c­É¼yE`¼ú!yz(³®~ÕpÁ¹Ð¢û—BLª¹”ï1m@ØÓí’\ÚÁec¸b[rÐÄip'¨~Ë¶nyzM‚mÞu“jòlº7ÅË†1#OMvóE’\–v÷ñ•y›OßQTG&ÁJCò6=ž1[×õ;EÌ‡xúä:ŸZÑ;uQª¨¿º%æU!M¡X]Ô2ó¥ÿ›(L-ü/P@GeA¶ê ,+¼{±öF\¯-ö­^×š'n*h”nð+"ò¯Zë¾°½<œ¯–Ê-{L<â¦ƒø<7Ëÿª–¶©›$T·×hG–ˆ¨l×n#­¢8ªhÙUZ«ÃœTx-Œ	«ëÏ¶¦<ÞÈà9/¤¾j­ƒ†Þ›Zâw¸MßWÓI•êZÿþ\AwŒëpÀ˜ž•pk¥QÊRDüÆÝ1·z”øê*ÎrŽs:ï‰=œ}
kjìÒ-Î.pTžw1_†ôx{â"¾ÌÒÑÏc‹ÞáÅä/»HHæoÕï[û&áÀ]ýWñ“9|ë ×ÛWÉƒ³.ÅPáõèr't]Émc4hIÅNb'·¶µ2¸àµÆÊ£¬§óf\Me~ÒYÛ gÛ’™N†ãaœEƒmYÓûãIüñ¶Ü¤è3]–=ªJý˜{Zžäàæ½Y¨)-†X¿åð/Ì#È’-TM‚Áùh`µt^Xk·Ì=Åú=rš$ 5V2#kƒk©lŠ 1æ‡<bM^-àY $Ï{§˜ÌaO4jÃR?	Åñ¦z³”Õ›5›î—ºùUò·Î
ýh¬Œ:™Ê¾²oân«ÖTµÉ74‘ñj%¿¼Œ®OÀXh¸ÁÍg¹]Iq†ƒ3Ì=¥å%ùfº‰Ó{1Y}Úq	Òù2£žÑ úøñ ¾Œ7ìû3˜ÅŸØ¶Ë%7ÚbÆ°š1£ÛÞ^¡ž9„aD F”:Ùª¢—A¿™ÃõV‚•Dé2)Ì0}¼[5XÛV£vfRI¤ó¤Eˆ¬˜kƒ‰6MµKw*Ôq’Gyj°ÌŸW1ò?©þ"úi¬¾¨¹'÷®À,™/[ƒ‘3õGQaÜI&¦Î3iÿÝ›Ÿ2Ðì¥jSÛ°ìï¿Ó²ô=š²ÊmÀû™oÚ~­kÐýÓºŽj²Ý,ñOÎ;Þ¼¿§¶Y?Ý“w+È»—BœÅU`’„ú3“ŠQ«û	©eÕGÄV uÎ9—ÖL‘ëkDwR_û´ªQ­¶ãÏâ½/eÇeô³ê¨3½mCpó¥é0µ·TtRùìLg¾7¾|å*, ç*jZ/Ò´hLXãz*JÎ|nÐÏüõq‰¶…0"U§ëühï'‹©iîÐ$CÞÉ~×'A2 ™XVw’åi¶4N:¨-½„D‰ý…*•y~†„ñêÈev¸å$¢èòÕŸ!ÿˆéŠëøÔƒ1fÅy- ºáš[Aºë2.îáÆÅY€Vf ¯{Þg(’ek7Úë´B±»Í#wqÈõJ„5…eãæö»MÂv	<Å«³lðÈüÛ†õ®‡ÿNãlˆpÕá¼³yym‘êœ|ZŽ‘ Ã¾gƒ6À[ažè—ñ»é(-Ép£oBb‡ð=âß3^ç/gGÑ(4Mò_œ-G3Œ&¹8`q³7T×Žº¯Ó%Æ[æ´ER kb®õy"*€×Kd•™"ž šÖÒ(ºLú´\ì¹'®Ä>ƒ@¡VÁ%,N¨ùØUïžg…«Ê£ÓO£³Ö<ÏÎ}Ñ¤zÔ×ïb•BÔ±ÄhÙ¬J_Gä
ÞóÏl˜#ç‡Ïrô^Ýë›×‰†gÓ—:‚>éç¼ßÃö©ÔŸp´<5º6½ãÕTÊC-Ÿ„{HwÑ O³$¢:âL´œÏH÷’Ú¯êƒŠ s¿5 ‰þÞŠ’ÿ äÄÇ^AL>AéHH‡ñ¹$õ*AàÑé~75!(¬gBÙ…ì”G[×‘Ì54œ‡Ÿ‰Èt‘¸?*ç2ß ‚àŒÃpƒâÌ«’ääµ/šæh’bÚ„à0Îw`ª,êÞƒââóQ×:îF¢T×“¼ÌW¨ ¯hxô`S—¾&i‹_ù¢)k'7¢ª]cbêÊ¾êWqÆOÆq79Oº*¡Þ?jd)ŠDl7‡K²”àå&tÙ&b§lW¹¾¢
½É›º¬ÿÂ5ö"OAQ~ì@[Ê¬³Wwkƒ"{å1¥fP¸¯x‹
ÐÆN¾Õ½| S­¥TÁß£¬lùmé ¡T!Ê.ÝRÑ¡Yo-2ªºX…\¾ª»‹v&Š›Yõ]¬’.ßŽ«;7ìÈ©	¨øbyù6®î:nÖ5•t‘öôMB:ò2u)4VÁ¸fÕ×J+*k™Á£ª ²t£TI+ýý!Ï8Ìx ?J“GI£Œ|aB 5ÏÔ-Òf
I0BKF¬dZR0DøÌ+Ù’<á#ç 
v+ÓÁþcÜ›{zzð`£kÀ¡¯ÎâA
_
3_F")°â"*ØUœÅ›±‡Ù3ã4Ïã<’É²É¸ Oh/éÂò³£l2Â¦‹‹xÈ®Ê»ŸÊö¼[?C'õØyòQ*cmD5íf1n-V§b{~¹¶I¸ò½,nVWÌ#IÊÑ‹òLÒp½†+6x8‰»Ý;IÖëÔ]33 søQH¸³¥5ç¾Ö©ˆs¯€)wÝúš>™ ØFlW.Í/q†2š$Å9`£ôRL¥ièGF?F£t`•y‰¼6û5d¡äˆÓƒÕ ¶LGÝ‹,ÁlôÂáÁã§p¬Aˆ³øàêùßu‰+>«Œv.1¤€»¾*çÆ.¬N¸)öš­©cwŸoÍVÁtæµ0;Ëæ´KEé­Òt¡\…^ °±'F¥_0Ù­Õ:=¾õjó%ŠÌ/=øñ_3DüÌ˜¾àT7‰Ëú²*Õq¿ ×/.nÙ
ØÙß½}ryÛÇ…Œä` hx»ËyO}‹pOVwŽÝ`µgioZ›H ix¦Øg¤¤PÐs€(Ê‰[@'Ëkžä­f1xEÏv7’…´”5"£WŠÚmRÕ<?Å±6ŠhÞ42æß,oÏß¥/g+Z•9DF(ð];¤Ú …Ê  ßŸãoáÊÖI‚žlÎRýµ8!-2¹R‚GðÏVsx¸ ­<rµuÒLâDYrJý²æœ	˜~ºf–¦ô?MUª¡ù'N®P¥Œyˆ¡R%„Ñ¬¥ÆqÇ#QxHÖdŠäLé{›Ð`=s«}†6êXÜ‚r6|Ku8O ŸØ¥c$~ÕÊ’Ž5v§ë«†tg‰Oè5¤×	X¦`ÍJ}ë.ª’
=<å•NÿZ“'Úz­iÆðã/R£ÒñÀŸD£*M
¨T¬%wá“*WÐµ¨Ú« 2çßàéšòêÜ}¿§ÞÕâ¸È|þ&Ý+§I1T0¾µ¿ª`Õmü~*XÉ)ÿU+é`bŽ¢;ŽB†”1wâ¾jcwÕÆDI/HÛê§ÙôO¡…i‚F5,›Q	ËþŽ«¬à?Å›O§ke¿—¦•µ»‚\M³?¶^%i²…äõ§R¤”•‘Èùª@U·ñû)PFÃWÕ©¤:a0Œ‚A­IÏÖW}éŸO_Ú"êŸB[BBþª'5êãËÒ“þñŸÿ}GD©G,ÆY?*ü«Fc.X¾êFÕmü~ºQ9žó«ŽTÖ‘ø,ÁYS¥òÔ}U˜þÙ¦?”ÂcäŸCñ±€àñÂ´’ßOú=M5¤§,2÷]ÿ\ÇcJu‰Õ¼|Õ^ªÛøäÚËLÏ4òÀY82òÏ—RÆs§ýZÒçÈpñ .Z9.6²‘„[137CY0Q™!c TçÈìG’ˆúq³ï™Îµ>)²8Î–¯`0éÝé(ÂR0<×[õÎrB9áƒ8K¸¶Èº¨ÐÉRñYÜ“qÁ.Ó¤_1Ÿ¥‹…Vûl˜öT&E0‰¥’‚K©ãu
v-ƒW,UoP[Wþõ’·aïÉõž@œªúgl05n3øú%e:|}Ã}bórÏ7SpË ³Z…˜v˜•¦Ó†øµv»MUx]kü1X šMW²óürõœ15Lš.uì('¯ÇÆŒjX•zBhÛ8³jKlë|œŒ,†°QY’Üh4ŒÕÈV *½ì>]°{U>½.ý‹x»„£Òþ’²ÑLh?wÜül¹hÄ‡ß¤ÂDâà9þ§û!îÝO"Ú¶YÏ=îõa:AkÃÚï£6;Š³ó«cƒLË3LTã8W@Hðf¡v*F²èSš#1œ¤XC³å£udÆûÚF“’¦lœU 4Â->Ä»kP¡«¯Â–=Á÷oÉvQ4£P². !Žzy•­ñŒÒäw¡Å–ÿÙØêÊÊ
/¹%íN¨nak¡¢M˜R{`¡NÊ­"“Æd”
ÌÎàðu5¢.ŽÃ1—i:èeûF›Ð~t9x­¬(inÈ×k˜­!úP–ë7Ý[¥„6¬Yv¨™f(¾Ùz°¡Ð­:Fžu]xl%ZÊˆ8ÖétÌ}
‡/k±Æpø¨\ØËÊ	aWÁ{¶a5†F(³Auz­Tƒ§¨ÈÎ› "×@ {Þvîéóé_Š1gâqï¹®—Ë
çoXË½E‡,s&ÿWQïq¾¼{Ýª¥3ý§~ïÑ¯{»Ê1¢[!¶PK±û»bš’Þ³v>9ãe`[+‹lsá4œš®#žš)	²ÕøñÍôf¹‰05›YîO¿Yî«ætgì	ëªÆ´ÞAx…`@JaéólXPm[ŸL†Ã(Ãœ}ªHp¦#¥€éÙg‚Ip 	¸t«ˆ–JÃÐö$5,‡÷IAÜE¶O mvi@€A¦yr	w!ûYÒcøZ=ùÒ*Ë‡[úë—´Î[Þo¸çXAü^ã×/W×5sXÙ¿X[WäV×·wpnÔ¿{Œ ×¹ôo>¬²1ª˜M5ÞXÂè=â=ñãÓm%á8îõÅP7½Rpxz¦™sŽ,¸ÛƒÛ,T]VÙAá		“øN˜^T¿†à~÷O›Ñ4_q]—:wšÄ.¸wúD¾ClYžýäôõÏF«„À@÷O¥ª‚îG§a&ªÆLeoOiñIé´+º»BþÐ@¡(ÑïZ~Í:8kÆaTEC.×Jõ°6Ž%/,§z8PfLåÀ4,¨à«ž”×}PuUò†Œ•w½Ýz1ô¨Äû.i­²mƒv‰èh~·C‡ü&Ò¡’Õü¹™O}>ñdœR®Û	„¸·	0Å€hZî®/s$òoqÃí¦Ã(@šëæDã5ÛAqÝdˆõŠ*¢~óržÁr´¯FqFá _ætñbiÆŽ£Ñö
æ+ÊºÓÛM’TÓlÖã+;\È™¾,Ä·¦P}Œ;xL á˜ØåeöèƒIlÝØÀÿÈÑ]… ‹Œ>
]Êçêh³âQîéÚõdÄš»
†É¤·ZQ·KùëÁÁé–?ÄShDà.nÁü‡za”.Éüþ%ñËüÍû—'9g­oao¡ùwL~‚žÞ¾=#oj'ùfá}HÂÿxëH-²ëå"Ã÷1w|-Êéûîé‚ŠTyÈå2méSh2Kb«õ.Fè¤BÂ¶¶Þþ•V%·ÅÞÊQE#œ Äü…ôÁÿj°1<¾iáDU´Õºfê†E–ä<€k/¶“Qw ,;oy—tÝ,ø§ÇCÏRªÜ‚žÅ£~zöƒßÚÄ]Lf"îbbåAãµß—Æá%î—ÆÓ·\½2}§}“ }Ã³Òw¨-EßpÃ}Ñwå¡Þl±Z¾'š9†•ñ8“[˜ú«ÒýµZƒK¬ö¶$ÞšA×ðÌ&ÚŒ˜Ä°J ¸]+2ÍÛìÃ-å²²ádP$ãÂ
‹¡±ô\W§¥e cï¯ µzSüI#©þEÇ"v|cvc ºòí²ÝðÈ,ŽË[¨*ƒ[åë m£$wìÐ5J;·yÙàÏhB~2èã¹}Jøã@ŸÈ¦¢xoXÇ4ŒÊØÊúÊ³ãó¿0iÖ& ù;þÔi@þ^?[2Ð®æâ_hoXÞ{œ×gWƒ$&µ²°÷q¡Y6‡£O5Éç@fåÅ–¸ÚdêW‚‹Ã†ì,¥ K6²O&Ö'LY×4Ítœþvå·—GÿNìÂVi¶Œ&	(QVã‡(¿ãLÅ˜Ýñe×rÆÌ3"u0CþéP!½ÚðNyÈ¶ONö_¾ÙÛe'{;§û‡oÄ '{¯³²¶ØwÎÌ+Å½\ç>&k–[?Q¢žÙ¦~óñÖf¡`'±Ï¡Ô»$ò5ãÊÖ[9Laî©Ô6'âU77ðfUSwËî3ZnGcÜÛ$SSºIîŸþ3ÙÐLXf—ëœCv~þŒ@s,=wÍj@4g€¨ìÆÝÔ&Læà24­=³yn`ýhfÉ4Z›-_Pÿ}HMý÷ÇËÔ"Pð‚[¶œéÍÚØ¬ëËnŸQh41Cn¡ùÔl¤=Ÿ¬Ï<´ÚmÎ%k³Í[©õmÐP¤ÿ]ý_ÍµsÍ mMâÌ5ÙÐWs­Q·÷i®n4' ·´Ú´û«Õ6ƒÕ&à«ÕöÕj«kîàøk%çxÚ³ðÕtóü™¼ˆL·br{Ó­˜üÁL7>àOdºAãƒl$M3¤Äq–^Âfš¡¨A}—_š}f »ðé¥“Õ¯–ÚWK­Éý_-µP#–Úý"Ù8×<ð4¡Jí¯Ó^4`/Òuö&ÅÙeIû²­á‚ÄY6B<ê’‚ƒlÍa[y\œ\¤W˜Â¾›Dƒ´ß:¹¯žNL	•;xÃ#Ê\‹±lRÎŽ-ÈR&f6LF˜Ü¿NÁÖÝI–§ÙÒ8MsÇy¥òšï¦£ØGï~/ÑŒsÁúª‰æñ(r£Wx|½_9èðìÕ‡8Õ™ÒRÄx®SV¤ã¥öïÀÍ½ÙÍÒÌí/5)JJGÏaálŠ±è»£©du¥¤ðtl*Ù4·‚"ÇY”‹ø2KGhfÌ“‡Åû–³œ¤ñøbµ–0ð»A™¹WA0Æ–½ŽFQ?FñÿxùbÕé Ù³án‘jô•c#VÚsO·»]^J|T€ÖAJä+biø(Æõ«¾_·Üxa«+³¼1et5ÿmü÷×1v;ˆƒ /s8Y9fxÛmÜšçèr¹ž¢Ì‹l—1Ê\ÆXÿ6¸‡×‰]Î²(÷€"¸RrÐ&ögqKÅ,*ùfIÐœÆ4â®B«âñï¿$ñ7±ï™@Ì}>ž Ï­¡ŽÆ…¡HÙö`àÃÕÒ\ˆWƒÁ¾»f]PŸåhÝ¸À²¿­tu“bº´a*Û›ŸnÕîa}­¹ò‡Ã=öj\
§JÓE ±j. †sªÙý|TÀ!ø¸Ô@ h+0Ô†v1 IÀìp4gpxÆuSKêgVO<^õA±èÇ˜`c‹Ù‡mtµ´	ô!ün"°BüÏà9ŒlØÛ¢ÏYzU«8­a4*% Q.æÍã“3^,:8ËÓÁ¡ @j#È(/«Ë¶DNŒjJ—…\«ÍÒZ=NFãIá²‰b:’ÖUÇƒ¨_ÀŒ³'sb€<a¼Ývï½Œ“«ã]Èø\æÜøPîiÅJ¿Vw·âveý¸hSC%%»ì7u4Ä27Lóñ`iuñªÖ¥n~žv'ùn`UÆ ƒd/ÒQìòjÏÃrµZøNÕj£e€)CÃÝÔú6·/,„TËë÷µZC¾÷ÂT­dÅƒ /ýÎU(œQ•M«gl^#Al*4%óŠÎ©/?¿EÏ[APCv”‡•y«9û$ÀÙ Ï1[ìŸ2( gr×îÛÂËá:al¹¸LˆŒÇñ%Jõãø·Iœù¼ I 0ˆ„r«NÚÑ€Ñà¤ˆŠIÎÕÆ±hy¡æpÕ=V¹~?â÷Cý,méúïÕä¼«ìr±F|I¤ˆ·„7VÍ-³ü[¿ªË|óhm„²èpuxO²D3fâ9zöçõ»=¨§dü9‡Ú{°‚P{.´ž+êÏŽÄ€;6çqÙéQ:rLbïñP•#t4îÙŽÕ°îùÉÇ¥M$ÒuI—«nµÊ#"Ë]Žñ:h¹·ÎŽÁšûä¿ùä}È4åà9ÚýõDüwcvlKH_—>7ràŸ–y¹ìqèvi*?(¶Dë.×k&<ö»´é4'œ ³{r½á :®vÊºeñmŸÜq4<íÏB½ó»å}³†æD™³—]<,›îEœeò	Óú"ñþ¹9tœxæ¢5iƒÍ
)¥>#tÍ«8Û—i-è<Ýœ}ÇB Y@1ÆFÞªA{ƒlto­5ò40QYÿ³w½àñøT/žP`õ\ug¹Z¦7èKäEÚ”/i÷^FÈ¯ÏN»Å>Œ¨
ZðºíüØÕÚ¥ÆžÈp˜m8NáZœ#.œNÊ8ZšDä9)XÍ©SÐE§Ô%Ø)A÷P <sŒ·8#—/:Ôzšó¡pà9i”qwzg1åŽRÎý8yâ¶˜bÚ]7ƒÈ’¨A‚æL?ÍÆ—Ë[€sjŠœèh@_R;ßòÝhÄ½õ°Û«üÙ!þZúkÎÒèÇok”þt?mÚ¿ŠÇÖ“|{4QeÛ½Ë·î”—öùÁœ1O¿¾ëes’ù`#ûš¯Â  Zegƒ‰¶ÊèZe‹¦¾aÃ-êßS±õøy/Ä ï<ºŒŠ(ÛÁ! ™ÐPÞm±_k~W 3›Œ~\l;W[B^{ç]4ÄWL"Ò‘ŽÁ?J¾Søü·-îV	ssí"K†­[LÒúÉÞ«nœ9×_EFMÚ'0ªäÉ Rh>—Œk‡­6Åu†¤ÞÝX• Â«+4”[¸~‚ðþ?›sÎ¬LÀ×‰ƒ?öÝµA—^„ñwmé— =XßÛÝ‹(Û.Zÿ3jÑ‚*¶¤º£"ª£. Ã7ÕK«tpqU[íAgM%ê$lÔ™MFEŽ¡ÖÔ8õáë€¬f±ã‚é.k8ùµÜ‡ÄTÿ“€ï£~t–þkŸ¯F:$&k²aþÈ·•ÔŠglþwûHL-Muå¨j¦ªòGù%É'ëÀxmznbç`„f<»?au ¸Õ¯)µÚr¸¥é\„…v™²ñsé ÛûÎÜW;«eÇ7ˆbuýz¸†­Iƒx.ó§@ï¾×ŽÞP¿IEKxzqŒ=g×«<CMoå	]>ü—w–ø}ÀãY:ÜE»+t(ïZÍ¼4Hˆqò¹¥Á™<u½ˆOËÃÊ1•³’ ¢M‚Nì íõ>Ñ åÖu€2åMÃ¤ˆfaŠµIO“€Z÷©w”{FYÑ¨RÊ`iíšâ†i[¾áhó÷*‹Æž]×4%È_Üàa{CmV¸E•J>HRæÓlº5KúLi–(^¨Z¯ÃãßAétÔ¼dD‡Œ>>º± ¬m„ê‡¥‚%ò—U)ñM¾GÅÍ¾cÿßÿý?ÿ_F/BpMç`†9o¶Û4´¶¾­ëŠmùÏ¹Ðß›Ï¸Ü92²øÃuì?Æ‡»Gše¯£q,½–/U;\*)ÐìAtxÛ ª½g­ï4.¼Ç3KÒÿ× æ’ýglrn	û|Ém‰ç£÷Ä üÖ|yû
Êw?îÿÿúßLÃw^Ëyož®1[úbC2zq»¾¦Ñ,ÿvW:Cé³›ò¾RXšÎ¬€Ì@²?ÐäP(Ní,¦è¢Öü_ÑïÄæ*ëG}Ê×ö¥áêT°0ì<½‹LÞúÇßÿ—?ÀãK}U@kb#FÖ©<<©’åH³–Û­Iã“¢ãdþùÏ¸øµ¸7/ÂfBÊzSÙÖÌÍgñß­R6ï½©lxÞ¨$af¹ãƒÁÇj\g×¥Ñ"Éó¾0¬Áö¾OØ$	²>þ¾”YÔ,·òº|XÁÝÿMüQèÂR'05Šh³‚:µ³¼œßÚ´ÝÜíSïMsü>]
åÝâñ”îu6·»Û´OÆØ’fÕè²3Ùï€éÆwvµló÷º/OEÕÏõÔÌäs®§êõë©m7×ZaÉÏå=¦×ü«ÛÌÁZ›äþå1¹ÌOÓ½^R´Â˜áÖx/>…kÖ*ŸÔ[s¥"÷ÏÉœ“…V¬C[JwY|‘¤ïJ‘Õ÷×ú"©`¼qéöF$s+šP+ÎÓÏ8Ú/FxÞÃBˆlù{X
;Ñå~£®fihŽo¡ý„òâ=»îÆMß.Ã›ïIz¯Êí}¼Œi8ü›úFsóÍ7ç“‡ìÁe{9­{€‘3)_Ž<¾KMH¦•ô¶@Ž€B•#Äþ‹@Í/Šßˆ&0òfßcU:û†ßbO.’„YÂLÞÑ‹ón–Œ±ï-YÜk"`é ¾Œ9%Ž³ä2Äý8Wmw9€½tÓ »”ôŽÛƒÑ¿|C	Ÿ>&¡¸áåÓU™Ê¡uß6ÿþ@ÑŒ%:ýÎÁöÉ	kí`e†h@UUFžÎÀ$àéÍ€ˆæ3´ÀöPÁ„Y‘¥YÚLäÝ&9Ãr
t0ÙG€ðõgS†‹´ôì¯ž¼sGdè¶ŽŸoï,àâQ>ÉbY¼ƒf=êN©Ä5g’Ü(«rz9Þ_ÙA¡¢ÈÆ€À.Œ
g|±^ZÞÎ£r6c^•¶|<³ô`Ø¤L)_l[­M3ØÅdìlä‹õZ:âc÷Å¨²
V?‘N`(çIFñH£ó¤‹‡d%*5‰pó\•W¢•”?Š§ò§– ÓÍØY|Ž„iˆ,£$9ÚEðì´zm&o§¨<ètd•^Pü$ÊYœÀÏ@Ðü\‡*8Ÿ¶n¤¸€eïób0ƒX.8g@ü“¶ yæ¼=Gð	|6Õ8‹a9¦ü©÷„ü:Â¢®ì ×/£¤„!œ­‹¥iTåhXBÎ¯É³¨:º¯Ø¥zÃÃžQo¸ã¯7¨1ÎYup«²AÜÆ¯°hÄ…[EØ[3SsêC_C!¯ìz4˜ä!x„ÀËÍ¿Q$¨Ñ†TÈP°N" R’æ`[nxšö–ž°=~Xñü<ÆH ¢tÀ÷@t%JêÅÂZ»ºˆ‰ü§é„ßfô"3G·ˆ{CŒË¢Ä´ØU‚'ÿ½hŒÝñx×1¦ºÃ~óe`Ú~?RªðËÝ1=OÓ‡cÌûäÄ$Å3—ºw¡¡Íhã‘·À—"&¤m¼8ê-¥îow.*£sñO'šÝL‰?Ò3Äãø¯˜$®jf¾Žìo»(°„*Bü] L³’„÷M_%Òý÷f±¬K
þº4ì‹’&©¶D,quÉrIq¿*)§
ôºsÐsØh/ØêÊ"½ï)Z?°ïC›l¢Z* ð.âr’s]S¬¡ƒ%ŽÄËK‰ÜŠöº>†ŒÌbTX“a”M9r—«B…*[y± <9È
ì¢¬.5r‘®ñâ@M¸Š¹
])©ê8ÊÜSWqînŒBó»çãÞ^jY‡ÏÂàŒ‘÷¦õœˆË¤7fŠre’£DB²›{>|`ûÃ1°‘9vGðª_Dl£‚5I`&‹TT+_FßJ¸–Y‡È“0ø8Ìu#Ñ —å³8g!÷h r‹q0œE¶›¥ ›÷Øá¤XT;3ó]ØyŒ)§ d’¨<ÊÒaZøJ*Éäo¾Ò8Ø, wtî•Âåª°Q7`aèïm%û’;HNŒ@Õ…†Ë:AMJIëRvˆ&Ô)ìNYtŽ¼ÒÈ!)Œ&ø>Q®w~îÊÚ"M­h-`—"®zat`3¸Å2^/)&¼~Õ¥ËÁ–…K›oõ“•!£-+Ž#¹2wƒ{$x¡¡@”ò°t_D—Iš•äº¡`|Ïž»w	Ñî­uï—î» jëW#ÙÞ¢kÏl'RdëòqbòÃï"éOq|l„‘ÄRëÂ’p9Ž3ÁsE‘)÷èuÀ€¾
?à{`~CÔEºé¡,ãÛÌ æocnØã}˜³(Ù!oŒËû|ÜÔ,Kh9i8Åh:,q'ÇjK!9:£¥IYD¬)ðNÝ	93xKÀih©¹m×•ôÎñÂ°4eü®pü"$½h
_&E:„-ÞEAÞ`ÿS¬ãP4Ná6{…­üvëÜÛ
nó	£°.:rSÐÇÓóó¤‹ZŽæp (õ‚$xƒ"#ÌKlùm’däðÍ€ƒÉvŽQAÀ°ùCÍxð}®îyØîKøásf~¦µ|c¢šµ!.}okz,ºâ¢¸¬èS4ì:ÛÇ{=ˆÙ_‹Ô`ÂúnøÅÖvñAe†½ ”RÈ;°õ=î˜û’³B†,	%§,dÓÞ•¯Ž—¤ò Føg¹[yÑ8ŒlíeÆñ+N.â¸ø}„+y}q}F Å´8}ñÕîd •"<á"fJ¥‡å$7å½ØÎžcŽËPé+Ø:óðlÔÍŠ*;uuîéj[×%ýžý%Æ€)ôvnÞFûÆš
ç8¿Høx„Ë‹î‹+Þ,Mû_²9$ûK
[x‘:Îi”È¥f\Û $Î'ÈúË·äŽ¾©6]Œ–ò®“-[Ò³Ýi³x‡NJÄ¶»ýLó:Øœ9Áš&èãÃŸÁÎmó3?¡+æHúùO¦ÓP¨–(ˆ¢ÁR‘„ÞpR{ÁØgtÄüË5m³ý‚ÛïBÆ†bX7ðA­Œ3¤|26žü»t4¼ÆbÌGšhNhÃ¶^,ˆÑq?ŒÑ[ ÿåžM¹¿¡›€^5Uì	Í­Övïˆ‹ÿçðëŠú¶“ŽFhðáç]®6Óç=X5`ýÛ)‚8Œ\á>é£4úî‘UÌ'3ŽAïJˆú¬““áZÛæÉ·§Â—bÑIÅ&r®¤ßÕ†WÊ‚è8ç’»ŠÃ2É{’¹Ë©ñfž´££ÆÎ	«7‹Õ)Ü8KFÕ¤[úž¹å¼ÔÇˆ²óYØÕß³—ÖïB|¾ŠcÛ²¨ üˆß÷ãgŒ|›¢=ŸM¸WâVrÓÂ¡Âˆ»•Êð†«¥ÅtVìƒ[CØ¸ÕÄËó²¾¯Y/×”Ös®ßQˆç”0ì¨§úd&«N`h|êwÓîE(oŸÊWÂÓðˆaO£Ø¯&Ä"dÛÑàŠì5¾ôxxž¥C~¤-H‹Ÿhÿ%&‡ª¾=AÿH)\JgÊÎ£a2HŸÆtÇƒsîÂ&+»ˆuhï›†{š@VZÚGü:ìrÔÒœ•<6`î$ª½MNd’.ÏC“	\æ
¶Cþ^$ÀÃ(;ÑäÃã%Ü´€brQÉ-P|Û6{ÇÜD@H
´…W‘li²FLÅÄÈlyAAè™DB:Ïâø[¯ß\9uq2ëœÙ.È®œ	 SÊÂl |YÂ¸	¤øð½må•ìº²uÂóªh€®zLgEHDÌ«6ztÁm %f"‘Ò'€MlŽ–,á­ç®QACÁšÑ`~‘á.~á«+ø~#£øÇþ÷Æ£Gó’¹ø›xM{N´±ºÂþñ÷ÿb³ÕÅÕÚV²Z4ÒÙ¤FV	HIµÒY\o0–~¤F²
ïÁÞ1[Y_|D­”yÇ¡¼²ôj‘%ÁÂž
b(©†j\Y-˜h>¡¹†1¶á}+ªšU§ï¸ùm2ÛÝÈªÖù²ƒJRÝÅ§F¾+ú„Å	¾‹?·œÕ>cœm³µÑµ%«]V«p½Œµ2ÏD»÷×^å˜Op_Éçªe, ÷çÓ¯T¤ËÛ•v'Ú*nz¬CD?íIËŽ¼Çµ:N(nžž…
§Î 	žGâµ$f\± z±Ö(ÇÍÍV°ƒCÄ-lÖ‘ßI
Åe(0_y:N>c°c§t ×Â(ž—;Q~A±µ‘.=;œŠdIl"6àoà/ô›6GÁ ô†y£²`z{Y:F°ºõÚ°² ÀÈe‡ÞÖ•[É¡j¶­DÐ*À)í5}Í==sùf‚æ®ÒÉÓ§k0”‚•G+«Í‡F=ÉÚ<¿IûâC‘ZS
cÍ==”§D"þìLŸËážœÉ£¸ÛKaÛ…½ÉòF'\qé¸ö5X9Q?>ùm‚*p½þ/}¡Åô'nRä‹ =O€øä©ùž"at°èTÇm¡<:£û{â–ƒNçÜ?èYúžê·¾@/ðÃ²Ê(E¿à™_"–ÁºC'é0ÆÌ½$æ"tZE7 ÉÀôŽ`Mx-yÀÎifN&àOzAU]â¡Í/r'Ž‡¼	ƒVa´0:xpœÁâ±å>píÃÚX^»»6lw×—Ùï%g~ZõfÕt±¨ÿ#Ž	~«%øBÎF½¨[ùrÆ¬‰OÆ½Ak`=áæ@ggüu›EUÇÎ#’Ñ¡øüx„ÇH) âbù8î&À¡ˆrˆŒr–Ï	J4hìdiÊ“‡m@iä¾@$=˜×$cƒ1Pd,`ž¢3ýµÓl‡ç@cY÷3
Î¤ªeC>ãWîPÉÛÎj|Ü¿ŸXkß>ù”×«m,Ôf2×æ‘ûeèË;÷¼"vW¨ÓÅKEèÝ^=môAïåèn¥DÊÄVGØ!2˜/ˆýB›CìØ×q†,¶©•	•ìÙ`Ò(«)‚’ÚæSýgÏ(Gþ|Jªì´Aô
ìÛ7Åí'¦Ííñ4’ÞB¢"ÎCù/iª·ûíE[ØKòî„çŒ,
M€ÎÆÁ‘ªXæHo‚®?‚ÀûbŒ¢äîk²c†q$’ñc‚êÜ£‚°Ì¾ Â¬‰y©!S/ÆË=èö ÎŠÓ4…þg!Ñµ6½
]zWêÒ' K/ 2ý‰)õyÜ&¹VYNPieÝ(Ë¦B¢ËÔ^L2EJDµM’"×þ1rNÄ‘GCWdI¿ÏÕ–ÀN¸„Ïä®§p•lÈÕ‚äŠÄ8#>N‡3I«ÀŒ…Ê?—,ÙTŸž£#ZÜíH»qÿrœvžˆý–kê'ÀŽô®mûÚ;öà	|Ü’ÎoWÞµ“Þ‚ÑTü7íkŠR;Mv_Àc&"¿´E¸>Š¯Øßr¸§%ÍD˜yT†§DÐR%:g2JÐ—:ª+ó×¢unt#±ÙyGcÐþ’ô°bvÚ¦i¡ÙÆNð@¥tCK$Ñëç^QdBÕƒüûÉa„§þðTgÅ¼,ŒG9=®%ÖüÀ:¢% B‰jý+Ü¼¾"Þiy™áÁ'–J[‚ì¡†@E&W¬£^æõVˆ‡jíbSLË"7úñãÌ6t„¯…Ö+®×(Žõð·Ûb#òƒX¨"Fõƒ_ÙÌ¼Ÿ=5'o‰u.`$8•0Dì­e /Ûyø¾çq$È~†ûªqSâù=¾½sëa{c8„Ï=:á?‹Gq¤ÞŽNò4ÓÖQ/‹®°×çÄÐ·G0Z¼Q‚»mo,ê	<ä4­Ëi:f—»[á—£•âøâ¹'Ã#P‹å°p6à5_$ƒØ·VÙêêÚ"ët,Ð4 èÙq:…vŸ&±ñ 
cA:ðTgÑ"±E¶Ò~¸Èæ_hD=VñêúTDJ³oa]WhéÖà¯¤aëziÍ]ÄƒËÃƒçÙ'ª~ŒûpŸ´´7Üß°gþÂ«kë0xþÏ#ó•_fÑÔxeAkŽœŸn°üý±“_ON÷^³Ã£½ãíÓýÃ7'xrüóîþ){µýf÷ùááÿ€ñ©9rGÂ=Þ;ØÛ>Ùc¿tÚ+s‹ÖÖ4]d×–°œ‰æ5³¡i}k‚ðX
ýÒ»@Lü¥;k°ZâŸîÜ@+œ!­´×¬‘rô‚?ÂyÇúH½f™š_¤iá!`~Cfýq¸Áäz˜™¦Èô¸[ôðœnÔû7gW‚›ø'øÏã'F‹páÇ]N ¯Kœ 1Xú 3ú<-ŠtÈq“ã¸ÔMkÍÄz¦Öb_«ý³ìÜdV	o”J«Á\ylÞÍR¿]¼“v@ZN7OåqWÊ3Î«a±¥fD1C@v´7ñ(K‹T`c»Ù3Ô	Œvw:Š02–
ÅÃGÊ#}”Â¾ÃãMÐŸ¾»Ö¤uó¾Éuû—wcs×ÒÒÛ9üeï˜m¿ÜcûoöO÷·öÿOb3¬u”ÅCôÔž`;¹ ÕtŸúÆ\VÅØ;°[å?œÏ¡AƒY ßàVG7]F¹j‚X<È„ãÍ÷’^zûRÝ‚Qpœ”GgQ†Q$Š n)uJ2g¦t¹ÐÚš;#Û2 ¬æ#Ä8ú¹YÇiáÿXHÏÏ…5†––1
n›ƒY‡—Ø€ÿoŠ1Ñ?Zü5^áÝXÚ‰Öœ}cQê\I*©]ºÒl}½Ý1¦ë?î0Îµ‡¡avÁáÿk«bbe½ñz®NÁW Ik½)÷°öÉäl©h0t›í¹ƒ_ÝÞÇínÏ¹œ·y°ê¼Ín"Ý.¥Î¶«0Õ˜ËQG4 Êì¾>:Øß~³³WÖgø[<\1ÈHòÒŒnNÉÞTjH#ié‘”ëÆO–”|ÔñsÝG&a¤üd(KE˜öÔ&¶ÛÐË£ðô®®Ò¶¤äM\µ¡1Âû„Ím;È=éXx `Â°v£P]#~ç¾aD<é9”Š›/ª#îm-áe“ÑHF¥ÕUÀf‘@™ §‹²¹¤{³Âpä E’p:ÉÙæÑëÜã¾8„ÀL]žddŽñØ|GO· ÌF4=?dIW¦ÛïŠCF÷”géƒ8â’·çÌÙÅâã¸·OÍíåÞˆVæ4¥US`Û)î60[24÷“¨¸HIÙ.ÚÚâ«hp¾`ŽmÐ²\}°aSTHU
Þœkmm “Z£ÿ‚ðvüãá­ØÇîáÎÏ¯÷Þœ²“½Ÿ÷OeÇ{/÷ON59ÆC9~üìÓ`¨ôò:0kXó³§›ÕUŸ€öM¶Û-å]\Y‰ˆt¤KlÁöýùôÕá1¼Öe„_ÿp•Ù¿µÀ±•ÙÑÅn{NÇãéGONnïª‡õiªf2¥A«·Þ¶@7Ü±¿CÌZµ¼#¡ü Þ•%ºw|b6Š†)k•·¦ˆ‘ÈÙÞGÜñqoaN(²ïÊÈiK:˜Äü¶Aì·jµÐ½¼Èo=–!þŠ[H/Øø§E·³˜lvf'Ae£èÐ¦y²©™¦¯[w_ÚYnß°¦ä]Ñ]ã½7¶å°½»‹ñðÍ.7^ƒ0sŠÔ´WXÙ¶÷Û)Ïê=SªTÊ›
;·ÓŒ®dî°à\$
ž–eù/ñ¦ÜÝ}Ê ¡:s«mv|x°‡jŠb9{oàEwöˆáëÂ DªGÇQØ_ä[ªaü›£ øYQ®9fúh5â-"¼-kq'‡)HWçÀßÆó°€(%%Þc¨Õ”MÆÊ˜
ÜOò–ª?HÏ0É gpv±8MÕ½=gF
Ïq$Ó¡awGh¸QÒÛ²øÇßÿ/(È{ž¥QÏMÈ» à´AHŽ„º€'À<EUÀ7JX'‘h€nv:¡L|†T#™±G	Z“¡[¡>s"‚&{,Ô¶›Â;ŽR¢¯d<!ëC<Ô—Ù†"ÁPÕ8l{^Û ®Ó¯½“¦ˆ@Ù`¤Àá’L(oX¾qÎƒ‡)ç?FÈJ8VPŽç˜Y®òKùpÐÉ\ã0zFck|[l4ž`ŽÂ%½<%‡Ï»ž(|EïŠ¶Ä0.H‡Ä˜óUiBàÂ•Hq½â)®tpe¤¹ÒÉ*‡
³b¨<[T(¬[ìH¬xJÇX0’¶€?ÓÛ@Ãºð±		S½Ôºc:)àÍsFØpÓÉ‹ŽÄ(X©7rh.z"»]vfçµ5Èó;éžYò¡N›œþ¼‹,Gj<À’ŽŽ_ìì±ƒý{;¿îì5aC‚í \Ëú)?7!À4Ž—¦CçyÒ¾ÖUˆ>éÆBIÏ9OÅ2àqŠ”ÖvÂ¸<ô$fCcxmé°)ü«#FXƒÜgé1·ä>%d?˜Ú'D&„Æ•/êºæ³Oõ#—<.%j`\½ËKgÚPQxMœWm1¡$±G$”÷û‰p2ä¡@NâhNcñÔ”p4.×ÞbÂêá5`Æô%¤`´ /)?éeß>.ƒ&m	ÁAG¼gS;›B&9ƒS¹Æv¡qñ@Ê$)Á·6‹£Yf"ôµ6Û>b—ü'¯ööNùqÇéáëíÓ=P8v^ ®ñšuX¶àBª/á0&bþèbiK0|u˜ëI—nè%ÂnGÀšQí2Ê=ä­1O^qœvò!Ãx,`’Ù 4,Ç{\Í¢FJQJ¢×pŽcÄŠœÁâðQë¶Ê0Ge_ä¬Ã€^á!Ø9Éëbjæ¯.)‚
¾ä°¿¦˜H÷Û.&±Í$ò¸Ï©ƒ<×”lÞG­=SÇ³0³ãTÈFµ_¹…‚üãÿ\dž™(hÄðþË}<<Û~³·³{ˆŸ¾gû —ÿ=Û¯ßìŸï¿yÉ_6ÖÞTž1¢KÅ¹õ8D@+§®lÓ·SžŠ
DÅw—!JG°T$’<Dv¨B4ßD™Ð€HèG“d€ -Y:µ¿“ÚF”%
ŽBaFÄ*Ü~ˆ§vä)Ï+0=¬Pqy:òHyÇHŽ"7á6e€Š—a"<ŒÍŠñ¢„X¢MŽÈ`FaKÎ	!âo â¥`ê¢XÆšÇd©@ìaNDÔvS¡¡¾-bµ0KäÉ;±Ýjiàwä¼@Íš#Ž' ‚^-s@P`ØŒ'\×©ÇCê4hëx>MÑhZ‹0âvÐˆH¬hIˆõa: öŽ¸-t÷	¬,Ë’üÃŒ*É´üj, ã=¶½³½»÷z‡½<†èÁ+éåþ›F
ÉáD‘ú-4G=ÓK¥ UXC€À@èh„@üÜ.!©žºpžsjµuŠÄ‹¬¯H¦‚‘i€±H¨….Ì.2,Î§¨ö5#X%—S•:<2HxWCmX}
yI]Yº//Ó [Brj¤Î¿ÊÆÉIëî Š%“ÅŸfa €*WƒÁ„Q´1¸'LÁÌ92gã³ÑÈ&§‘Ý½#[rŸ°“Ÿ÷O÷P|£ûäÅCüg½‘$7ŽfDáÎ4F)D’JÈd…MœfK˜®ÒL´ÓØ§¨˜h«+|°†‚7Œ@T£…:?òjaÐa,*½OrKžŒFLP¯4{|ˆ>„þväåìùë}`khŽ€hæç ¤5LY[ØÙ•89í¡Õ…:.®àÊ£	4ÀCŸÑ\Â€k!õ“!¦C@OUV)n·ƒ{©pl¤Q$j¸$P±ØZý*2Ä7ÃŒ´…Ù¨êA,ž½7'{ìõö›í—Üó½Œ“9:ÞßÉÞT¨x‚:˜|=7!Bé}Pw›q`óT¦5XP>¢ÂŒo˜Ë_åç1îÏG*åŸãIßî ÜÏø–m eB·Êú®j†R¾e+Ml…'nZÍPÚwõhú‘Ë*hCïwÚ¡ÄïP;ƒÐ>D­<"}6L¸‰dç…RzŸJ
ovÉ¯osïÈ32|„fù’Ç v#[tCáð a™`â¹—’Ã¤‰@R|v†¹uÒÇl ¶:›Êk9¡‰ÈŸãsè •¾R×ó\V§çŠ”©PPqÒ£ûs{5wèþ;:q6˜Äˆ—O"â/–â^?&ÏÏ”JHá½A .ã¬"Ðs§½Â‡êäm£ùVWnçDGBiÓèìlsQd›ê¼Y¯½
3}ÂV7iÀòÃàÐ1Xë"Ø2— ˜ª»jK{¤åçŒsfD-öHË,òÌZqIu/§H*ƒs?ŠJçmÍNß®¼ûÉ¹[œmâš8‰ö”ª6½¥ÆÄ”öÓ¾,oÿ[ooà‘ÍŠÑÆ]bÔUÇ¨=X]d1gÅ½Í<á•£Ô‡¼r¡}aÁ°ö5o÷ÐÀ<H-#Z9‹A×T„÷úÆO¡Y5oü„‰w!ìƒf—5Ùo‚féUi†+¤åYýi´ùÛ|·WF{Û³å­ ®ØîlŸî½<´¢×ãßR'üñÓ½íW{xtö3ž(mmïìŸZ­ln4hfûÍ›Ÿ·Ø1ŒÂßœÑTÆ
Ë‰ñ®°ÖÑèCwßÃ¹q”†fŽ«<¤6Í8Ìœ‚º™Ð0sBëYf¿‚ú4g£ÌÈv„Þc6$•³®øT¶ÄU³!¥ÿ˜-qÝ§fL ýØ#R¸7fS\ýQMi-Ä3ß8•Zù Dœl¿÷±TñÅ þÀþ…u¨°öê‚SÕ¡‰2ÿc«Ê›­m‡kînºî¦c–î|—ÅóÊLèáÆáÌµÍž`-¢Ñqˆ¾-ù«ÕF¹¿Ü£Ž4å ÆîB6ç#^o?œ}Ìe×Xˆ9ÃÂÁÌ)mÞeKwcp^«P=#„Mfxz€5ìÎ4ê	{ ÷²F#–AtôÐ/eÔ"£E?À“ŒèrØh—ÿ¤dv§”ÙÖ­a-nó‹lL^!q,B¸ÝõÆ5VÓp:®üö˜r$.O±^ÄŽ0+½Ó'“ñ~JÓâUêÕÛ;§û¿ðøø£ãÃ=;€xS¿%~›íê•Ò‡Uo€q÷¸%š<FçåE]â¥zBu	jiŽú˜(ê7¬eaUìÀO¦°˜7´ÿ   ÿÿ *-@xœì}ÛrG²à»¾¢Ìp@ ð"‰&Å¥(jÌ²¤#R3Ç¡áZMtèQ£ÓÝàÅ4"æììÓ¾oÄùƒý¥ù‚ý„Í¬[×­Jk¼FØ"ºQ•U•™••™••U“g»¤ÿ¸¿=Øî<>$íW——Ñ(
b2¢I‘ÁßŒÎÒ<*Òì¾Ž£¼ ÙzœL§4Œ‚‚’8º¢d>á{Þ[ûîŸQšä¹Î‚ÙŒ†GiR£‚ì“0õòYgô¦8KO£Ÿi{Ä}%´ƒõ
húÏQXLH—†ë%L¬\@½¶	¶C¦A6Žò-Ù A§óâGxzÛZõ²oó,ƒ6 È¾,þ=Æ“ëôe…¡qNÉª–ÓQÑ›Y0†æ'yï2ÍŽƒÑ¤Ýžá`ÖÉþ­°Ä@”?Ç1Å±³b½"‹¦íõ^^Y‘ÿ9*&íµüý¿Ö´~]’¶¬¸n •`³àGï@_äð5·ëâÝwžÚ£4N““ðª@½(	éÍ«ËöÚîšUÅxÀž©Ú_íï“îÀî l8eª5Pv­ß); ·š“Õ/ÒðÖ[½¶®”`—§¢±1/—·*z˜PÒPpÎ>yØëC—´¶z1MÆ â²ÕÂOÛ½þ²îNèèÃë`LOgÁˆ¶õšô‚±ÌÐÉãKªmlg€br4Ï‹tJžÆs*€Q”bj•gÈ£Åó(Ž€s0Øìáð¡ÓE,Ì¡´ÕÝî¨N~K†=¬ÞvHëykÙ¡«b*1Îhi’<ÑÓ}ÜïWôˆÙ^›ÐøŠÑ(Xë5¬f3¹Qž±ÄcCveqøè‡aäðÿ¦Ë‰JXao{ Fc$)L/èÁÚº&³›yÔ ?¤ t/‚œÆ 3¡¥ë„)a"…Ðh)	Š(MøºC~¦YJ V3›s¤4Ü×úñp)¯–ä`­èÍ¢,)6¦H’fÓ n@“åy8èGÀdƒ¾Ÿ|úú“Ô$„ÄÅÒÙV3ø·í‘  DÖ•Ø±Që,4¢]vá +d—®Üê7“[Z¶ÄÚü$Ö§9LÚ49_Çb­jÑá¼Šm¿­%û°·mq¨öäåV§E„A’æ£,š¨*m‰\ÄéèƒGÝ@å¯†Çg|à:‡{?kKàú8·aœ[6{›³¶§#Q~:¿øž!Íl&¡ÐûU«’ßtpb#»Ul¸|)ã
¦‚éªpÍWº
éµ›/ª‘ió¿¤¤œ•ÛÃéU\°ir{Ù›Å2ÛùYÿµâòœ"ÇƒµDr`ÐVÉ-®)MH]^R¬	|Ì@'Èèía[ìŸIÓ¹LS,EÆqz6Ê-	FYšç¾MgQLC˜_cÊ…°<gUÚ¨g Äi’tF3¶8ƒI7žG!×ë‘‚+PKŽ^žžþtÓ+›eQNz›Óì§‚dÄ½YxÉYlÁ g´˜g	i3{atEFqç/ƒ)Ý_»w¯'†Ó(éNºïÀ¾µýþÕ¤»³5»Y?'—1½Y{"F·ñ9…î—ÁU4æêÃ7’{I` ¿î>êƒº‘Ëv3ù…+€ÐÉ'` |èö‰·]Ô~.ãôº{Ûæ .˜ÊÛa•ÆñE±Ž±º`bYw4ªhôát« …‘ñ¦¶ûÛ}5Óè™Ýt·´BXn2Ð‹!_wob tRt/@;ü@Ø+¥Ð0ÀG€‰º“g¬€ÚiÞEëDÁ8˜u‡ð*ˆ£á@ã(…f«„ )	'¥ùƒÝñk 6ÿ³t\Ø½„µ‡ú\4NaÜ}$Ñ»7›ÇØÐÞ€0¹1˜/fÎ ßú³›s}´[ šãUz5’×À# V§Ew°öäO°ÔmïmÌ4ð~T’„QuÀ&%úÝ¡aŒ—÷¦Á¬-ÐšoèÚ»˜EšXrî½Ý— zQ¸°~N“# Í‡ý»6ó€D<áÊxÊkœ„í²îº]¹ÀÝûkN1ÐfÆx‹Ìn»›ŠTÈG%{pK ¹cQ˜ä6ÑEÑÎ¹èå_ÛR›€”1ºGöÁÆ/»h+ø9 -5éóI ÖH7Ëo‚u`"Âœ3VNÜò·–î.iMpÎîêèBaã©3¢eAY¼71jÍ›KÉð¯bÚý$Gty+•ØÑPN
Þ«#˜cSŒw… Î’zìƒ»¬™e"¬”—Œ™ºÉ¬ŠÖ¬þ›K/Ñ6naZ½¡0ÖÞ(NzÓ) «dvÐ’H^„ý+ŠtÈÉAiÙ%Ã>¬Šö”pŽKG.dbzY”2…`“’YÑí÷¶mI,)u÷ž#pªÉ¤"›'#tx~}·œ‚¦g´Ñ^mûP_–ö"³”R½"*bjã13k6,!}ÙÐÐ‹;Ÿ’´ÀrA§BªMg 2}<Ýå²ac`«Á0•‘&ëáŒ½.²õ·ëKÙ«*#ÿ>qMþ %îõ³çäøf–‚0›cLM7ñ¬ûE÷rØŽMæ”ƒiº±Ãƒ¡Z‰6•ô0˜Ò·Ö·3Ô¯ØkÆ/j‘¡¬¯|©?K¡÷&æŒ¥Þ»œè¢¶RZ[,ï”ïŒ²J|‰ç‡ªœ&ÔV‘´Lß¥ÝZÓ¸&•ëš”0…9³îæ ÂüÚF>O³î,HV—ƒ7‘Ê¦ÙþšÒ ‹	%P,Ê(y%•éœüui”dc–KÐÊu0?*`(áöï[²aÆHžÿÇëWoÎÈ‡/ß¾ g¯öÞûIg{û´­ÇUÊ–5û37`Th(AÖXâò4ÁáSóU:BVºe9›À2 WåôcŽr¤—…hºÄèîX$”!ó,*ny¡(HF¸¿”yôÎ˜lU´¯/£±ÐbòžW#”`H¨‰ŽÓüˆ{ÈaFÝà˜QâQmÛA­´ "‡$ï_ÖšÁM÷º»u›³ükÓ¯3šSì4qnQaá|ošr¡]ùôOK Ûò2J`®ñþÝ`ÌÒâv—ô;ä–¯±vi¡â¥¬´§0½‰
Ü®p9k±†TD¡Jo³C(¨û»ä]¿7„h^¢£îÜ³líGãkèYà½&kMmkéÒU !fjÌ“Ûæ«lLY4S‡87ËgT© 1;ž1VÔÜ›±°]mznÛ¦' §´07¥Ô ’=>÷º4¬.a|íœY@¨! Â`ñìúA•bƒ&åÐ7(WÔ•úWÇh0néÂî“t´V5i¨›8¾Ù*GŠ§Ç+vWxM¨Ò{¥œ1WKRUÊY”ŸüIý°þÝƒÅƒ— >3Ö}¥¸Jþ)¢×í;2Ïi&Þt@yË	ðÛSà?ükmr6Óà‡4„•b±KŒJ»Ì»á@Ø%í™ñ³¾¯Ò(”° ˆñÒlÈøìæßä®Ýwùh’¦1.WÅ)ûzNö±O§´¼Ç_‘_H«â“6þË|g¢r”‡ “1«"ŸtíË Î©^	X·xžfSVçX<U¸Fù,n‘vu,õ´È/¿V«ÃÊó‘œ„faù¶,¹Ð;ƒ
ŒìÿþÝÛ{¨ïŽ//Ûm-<‚Ã¹¤Åh"\›ß&#Ò6‚(ÐIý•¯cëÂ)Ý³Ev«ùŸ9ø¿Ð¿Íiv‹ñ1Ÿíð¢CZJÞZïë	Íh»%á¶à×ý}ø×Û¨ææMäI0Ã®ãzMÀ8x–Žòöß´bl XªG§³âÖô²+îYX9Ð–òwýó²d¯×3Þ_€ j›¼¦Ö”Ç_6 xP”•žgíhBÚ43v pt)Œ^§Y{íÿpr¡C›ãcVl¨¥be¸›?j”åá'‹yçCé9çŽÍ	¨x1=®¨—JfkƒžIEË:å9ŠŠ¦ Ô"Ò3ð,'”ì2TäµíÿGvÁª¹Å°ú÷”3æ„­OºŽ*ZN9UN¾’¸TX•Ò¬mJý®MhTQÖ¤kI¾˜-	Ûb¸+Kd`›m ç|î2ÕX)¾dzÃUgiù>R¾dÐ¸/A³Ç¿y±/ÝË,‚ÖU ‡~«tZ2ýH.6K:i=Š=K?78k~ˆ¹©º©”%¥V¹é×žüp+9ÛîSY¦†-f©1Âßk%¹Mç`Ž/2‹	í!Î7 Ý_â. â§Új¬ÿšžqgýýÃyÅ«}š·Â^íþ®èì°Ü“1ÜÊÝ¢£ó<†Aö¡, ÞXÊ÷Zm„/Ý$èÐ½Ž`¹'„/~°|>¿ìPuS]2Ñèh˜¯°ªÑGÌ=Û‡Ó4§L9:ÍÐQŽ(Û'!½§·9P€‚%dÌ8ÿaÔË]ßD…óma2*b•,e+Èß`½ûq‹ãXáºµÍX`»Šr:°ÁR—T=¡ÿ˜b¨×÷é”®†mß<u7§Êå„-²•îÃû·.l—áÃ~=2?5"-ÞÄQN8ÂÞ±]ëc³Ýƒ|§”{r ñtå¹4®.U<8ƒ…²°\<wL?’Õ€,eû"ìU½‹ƒ»ûÒy…s ‡Õåƒnî²¼ã4$Ç`Æ{¬1§Õ«¢9§´«ÍÉªÝ-¥”ƒ{íÉ®ÇQìÕÂ1Ø}–q5ê&Å4=n:‡²öyúŒk•áV!4JfóÂÝSB·“N!¾tcçÜß®‚xSÆ§áºŽ. Ó¡|›Jù"m×ö®…w,ºWØS=ÖœgÐ·“¡&UÕDò±c4Ïw1¬œ¹‰ÔC¹,núâsoWÌt^°½²$M¨-¤*”ºGöBNœ ›ùÜ>MŽÉ_{¾{u3Kê»;Ô<î²U½ô†>ó³pBkÌ­Ú-¡;Ð7¿*8G#ßŽáÖXÊ^‰,nÐ9Å¦?`-¸ˆi¸'<+õï#Ô¼b‹eÜÅ)õK{{%U-ðš`«d™Ž/Ÿ>°å’8­PèÕÆ°¯pº+ö%ph¶»¸”:È¡_ù$ ˆï¬§ž‚r@öÐÄ¦ÙPê!;†Ê.ã|%¨‘ã:sŽp¡š·KYÀ6 õÇu€÷Y5”G·Y°„¡	)Ü‰C]~ÌÚ!‡#¤Dí{p‘§ñUx“—¡Å¯»;[#ýˆ,dÆ²ÅóŒE²ÅNŸt§ütÑÔ†ÁpÕ±K¯ '9Ÿ¯O–E—³w'£C$r˜/Óp·|2ÆÂ˜"‰Ÿá©‘÷È£À-WÃÝø×Cc"ŠØ¢Äú@¼

2.ä<t·³=l¨÷ÉÑÕ¥ÞäÓ™GˆëBžø?¸_w¸ÜÕ­j/S0ft]F4l¹Úcå˜m6ú8šVRU)Æ–/i™ž¼œÖ?€¶ü«ÓšY¤4-šÓ=Wƒ® }…ðk“ør>šäQ ˆ,ŸW›ºO³ˆ^²uú×¦)"oÒx…I,‰YEH2
fl§úgjÑ4C¸<×ú	7}Hk}u"{^Õ
ëre„åAÌÂØŽè9íÂï£¹(˜^@Ë’‡øÓŠ4bÔf†¿:‰Ä“gŸŽƒ,¶1,”/} Sšq¨ˆ+ŸïGÞ/…º«-óK%„Œ`É“ùˆÍ	|ÐKô…þ‘õY	\Æê¯²Æ¸-Wø·•tŒì_Ìg¯qÇíž¤u]0þfV¦6:º6×ž¼HGü4ÐIr™V½^ŠæÁ‚¯4K´Â¬1øØ­úñ‡_jáÖ•ŽêŒµ}·ð2éTÄº+ÆÎX#œµ7+˜º†ìŸkðÏ¢«(ÿüÃE3 ½/Ài]Üün›¸Rú]ÉPƒ9Ì‰1*>;æx3ƒ¹*Q²š‚UùÂtnpÿAUÚa8¾¤ä"íQ!gÔOÔJÙ3?‚yJô4æVøt’^?§4¼ÀJð&Êånjó2GqšS½ŒÛ#ûäÝùË¦Z6ãÑÌ^XQnN—vIÜº3`:Ü]8ðõÖ®){-‰ÐB€',.×ââr#0zøîüIûÝù*Ád*ÖG…Ï†a=Çêƒç¢üíLoæ¤|®¯8gÅNç£Íù°Þêoê+'ôú´Œ|)ŸÌ =’0zlÒ-ŽOPM^]ò*üÞü»”dò‰ÏNÎ‹tœŠ_éì8,ùÏ§Ñ8	0TŸ¿eÃ‹3Ø—?KŸQÚ×h+_Ù$®|,h0šÐìVÞ‚cóLcÀyCG =÷xÂŸ DÛäÉ“öÝby\aeàß‹äZSakhb.‡ý}üWôoMÆù‰p²$Ÿ_ D˜WI0Ë'iÑþ[‡´10ÏØ=‘y•p(»ÄßFSñf*´O¥‘‚s?†ÃÄ°?‘G šñ…øNŒ4PaoÞ%Ímÿ Üûë˜!Ã)¨‡œd°d€XG„œY˜©Ž&XÏEg1«O€â™\`Þ%F˜¡ì…>cÍ0•a†FHá˜u~¡bµŸÑ"ˆâœa äxN$`[Ô/£„‚ôÕyuW¯ƒ)n¢Œæ‡Å¬å04 `ˆå=gi• á1¦SÛ'­ÓiÇ­ò·KŠ‹Û‹ü<ÛÂØÛ'µH¾
D‡ÀPÆÃB8Ãm? Øf¥i0¨5è÷ý°^à®j¸eòwbXõ š¬÷@a
V²ŒÒC&ˆ¡¿%¥˜ùð`Ÿ˜ƒ£ÕÒç5gû#É˜~F}zô&Xµ½Þ+Ò“ÓW§<õ˜!D,ÕU²QÅìÔR,EJê%nÒ¨·ê‹Öî:Kó‚öGdú½±öžMêu™Â‡ó­¯˜Š8òMºoO[x:w
ºãVŠ8MÆ¸À·ð s„Â"Ï·Ð¤ö¢Ìl!Â¾£,/°[ÇI¨£M•#ÖJ®0NßQþ:ˆBüqèŒ’<1ZàÕ,¶úJ€qj%_=ž¦N6swJž–_õÆÊwªAùjh¤/0Îc—¼ÿÇÿø?_ßE#É™‹÷²¼C`>wÊü7Ï@ÉÀÕ×`Ð¯¿?Ðij,ª,†ÝÒ6{,^8ú™7" È |}.Š7
k&œ
0{Úì“bÝ¬x^§àü¯Ö„’ªVy&ÎJEû€y‡Ù9šVÎÂbËQ©o”s—Ü*ÕCÖVê‡Û9q°¸‡>RêàíRÓ`é->D3–ÛâÏÀƒÐ*:ü¾ˆÂÅúº¾â{cÁ=K=)xŽÂ«H3z,ãÌ; ,@Imé‡/–o°Ök8óœ$xÎ™‹Æ±À„÷\2Àu”„éu,Í¦íÖaF1Üšäsñå:€õ®H‰`XÊ’ðˆ¡´Ö×}óÚ)ÿ	•¢é‰¢‚>ÅàM»ð•~˜ÛÑ:üxIÄˆèVhçqbMôøéòDƒ¤A‡ÃƒDƒ±‹©¨pãOŠÄÏLðFFétºv
Â)+ ™%ª€2˜·Ó!IL†½’ªÎ£Ô°Ã—¯KøË’†¢ Ï-ß¾¡PP€)sÍÑ›“³“£ÃäÏ‡o^ž¼üã.‘|%°d…Ñ’¶YêùáÑÙ«7?’7Ç§Çgú!óP´@Î&QN®#ÀãŒfÓ  )dæ9|ñ‚h–7·Òùyifï 6oFtVðó\·FLƒ[ïqÐw‹¾|ùêÈƒšpšÐ¯tÆ–ê-+wÌçrÌ²t:+Úkg·3JZÆ€Z8DQ«W¦)ãJ¤3ÉZ5uà¬´&ÈCð"*ÒéùÏÌ“a.¨™—¸t0Ž:j¼–Ž%º\2c­	Î§ÄSQÉwÂM!Ckõ	é»éØêgÿ,ëÿT“ü»ÎXä’–Ÿ¥G1è'èÃR+.râgüÌÃ¨ø)NÇâ¾l¯k`Aª1à°1;€Û„…‡šSwÖŠëæÈµæBlL-Š®9’ùìj‡½Œ^Ú8,Qøí·ÖO6-ÁzÙròÎjü`QOÃ¼x6‰OŒYº74Èö ,ßÈMoƒãk š»EEð9ûWÐ]#xNÆÁEúßÆø2hëË@«75áÆA½[ÈB<h†ÎS*Q8äbó5OGO¾‘ÈEGÂr)ÿãóˆÆ!ªUq–8ïèt§·”zŠ³lëÌ·güàÀþ“¸°¶’Xâ¥\fë&9>zlmzvxv«kÎ—ýëhf,ùD®!±Øît¢‹µýI”‚KÞ¯ŸØzñ‘ªH¨Kj¥Õ5ÊÃ§§¯^¼=;~ñ£«	Œ˜Teš¥ÑÎbM/àf‰Ð
ØÈpg+.ú³SPÒœUáe˜úW0ÒÞ}µÕ‘C¿/°&ã™¬&¥s¶4ñ5ÕìccMÞèò$ÙbÆ(5‡Ü*¥ëÿÆ0«DÏ}äÎÂ‹ˆ¥ËÕÒÕª\¬JoZq$åxÊ\-ï'~ï-}‰QšY9ßªâ	š˜€ùdƒfHÃ”°•Gÿ™«öÓT|ŽöJÍÒ^ë»hfÎ7oÀHs—Vp
>^šÛná‘å&zAÃ½©¿¯roZ±^ëõ¬þifW[Že-Kn×QrèSCÏ£³e™EAÛÓTÃÑ¶EÊd
ðæ©H]ki…ª’.hv…¿¿Ù?•m]¯g©à-C 24a56ý­fùrá%CG°ìo¶Èmë8“¾ƒüEïW‰”{¸pl!!t)¾ë\-'ÌëêYÏéÅ¹´‚õLPÈv:AÌmp=ÇÊÊ(à½ ¼o|}ç4¾x_+=YPRŒÇ(à&'ÝùUù‘¡c<Ò²÷ýÙ/Nðx¨È·ú¤ÃN|îb/@7o‘_$%øWIó–›À‡çWQ§5ñ9?è½ëŸ—®užzÉ”´™ÌŠ²Q(ÊÏ¡Üö¾§¼\/MÔxp ë¾=òh:6áLƒ15¶Ê§cRÅ]M£ ¹
r¾ÙÎ’
ù/³×¶xóÚ^uÜ<‹ðº£Í¾¡ó1—]È±ÏúÀ¾Û&ò¾,Á¾Ó#H¹E@žˆ²¶.£—à]î7û²{¼/ß©.ñ÷ß-¿ààô8½ÑýrLÞ&ôÑq¤öd—‰ß@‰ ‡zÞg%JC²7@µahQ¬¸9èa¾|Î%€ô¦-„ÿXÛ‰c·	Þo³¸l¦HÑMüöÍ‹v+B`3¶'Úg·øXÄiÆw–øL³ihy0ã®Ô6>2Yôca:¹´ú²-}¯Öž#ôk[½ìÚÁè¶’B#Ì<¡ÔAY $F¶æó¸@Çe¨•Õ’%øç0—$Ór)Ù25‰ZNÿt†Î®Ì¹ÁF)ËÖ´õQ§:/Ø¹O¥òÄ£};D¾â7¾ÿ%Wè	{0@W
‚?¾á_¿ÎTpýÁps«Cþ-$äY
¿<zÓÁTÿQÀÏ ¡ðEœ^‰ù¾¶ß‰|+š<GSH¬8‰6FùU¹Æ‘M@¤’¯.þ
:"¡Eƒ™ÈÉô&`ƒá6tË7’¿!ÖÆŸ
Aö‰T°Ù=nxÛGM"°Û|„Çžå’`VÈè4½¢f°júAtL»ÃÜlŒ©Zx…fÒlù½×²ú_W¥nó@L9-²QwèØ‹†r©µÜla¶—e9Zgq–· ²K}šÍW^Ã rDuSð›€ÚÉþ’l¬#6ðŠvï´…Å¹kî.%=â‰A’÷½ì‘¡.-|ÙùnÑ[ü’ÒPÎtt±ŽâAtæ‚ÈÒk¥Ë‹/Pï0ÏÉÈÂ3tí’O#%l‰iq–‚åÀ¬µwç,¼ØÄ)ï>b•áó	bÉ5ÍŽ‚-ZŽçV§µÎÃxNQŽZ…$Z!üIœe#=Á{$Û¬>éEÉ(ž‡4o·°p«$Ô¶°qý(tjc­Æõ±ˆ¬£Æ ¸%å€ £ª1i€y€ä+ á<ÐZ/5àµ“KEâ ÃËwòœ…ž¢ÉÓg	•‡x-_4¢¹IÄœï‚’OöIÑÄãné¾ôÂÂœh¢(Ø-cFiNÄ`´¢òq—UÇ™Ç…óa¨áwðgèsÞ|û­š²Àé¦9:/ç,Bb9cr iÍ;˜üû<-¨7(Q%b¹gxØ ú]õw4	2œ¯ÐS­b;Ûø#S¾Ö¥Kkû+ù½B‡+ÁtXø‘*oÃäCîÍæù¤­÷ÞrXzæ´{W]ïÊ…U¹,t¦Tã`t¢œÍÀ#CŸƒ—ùúöÐwÉÉù:¹»ñß×~Yûzx„¾ç®[]:âH´:Ý¯Rš¬HœÀÚ—’GL¿\ó€´\ÈêpÓ¾I&lþò¾°ÅñŸ})©lØycØÖTaôÞö°«XÎÙZ/¬Q±±3V|>Î'ëkº¡kV|ôÅœÏ¡;'WÂ”û­Ä û‹é4xYžçrò-I¿¡vdÐ-T:£u¾‚Ò×hœ$sú=¯atï+~*£Ôlu™Í@®<æf ¹óÙ4RÏ¢[eÀžŒø,½aÖNXç/¶Y‹ïYg¶0¦M$OËö5ÛÀØ%Î¢)Mç2Ì¶Âœèí~_¿Twƒ¦™+ÝµC!Oç1¦b{µË~¤™ïù·V·rÈ•ËÝÂ°b¸C o…,½2ó»s`Wš)WTŠã.Áò¶C'’ZdëgôF‰‚Âpï8¥8&v"/|$	XOÔ%%2VZübÂÜ¿3ŸµƒÝ–SÙÌ¼êQð.˜(4wûäçî»Á ¾<‰–qàúq¿¿±Õ'x 0ÌÒY—å_Ê§µ¹œÜS7ü.F‘ç'”ÆDS"«®}î|o²¹Z*€Ì›'0Â	q°·1Ù´ .½lº vÖžTF{¢7Yb]ë5	jÔ‰\µ+€KÁB$ß=pÓXVå	Üts‹øSîúRÄúö=j4Z9ä†+åÙ³P1U\$uÓó:—•ÙÙÜÜÈžtzU	õš ÉØ¥Z-ãnóÝ›X¯Xí‡ý{¡w¸V=Š-…<ºû¯$v™b§L7èŠßd³Ð›#àÒÂF¹GzÕä+‘àÝ Ç;øXFãS±•Ú7`_>.\W2·Ô·/ý/²#Mnô2ã®sûâŽwîx’ü‡L›Ò÷¤Mi8k¬€ª²E-Oæ§Äºÿê©êŒnêgži¸i–¶lU’¥"±¿Ë×Ý¦k˜ùê4™f.aO@(8ÆR©`¼*#¥¸ÑÊÎï»Ñp«!‡ðÏ]H¤Øâvužö}¿/ÜÄ:€)ö'e]¼Î	o©›uk$ˆ‹ýµ’
k0ÆKPœiö:…I|»¿–¤]ùJ¤õÞ–ª_Él\ýÇlÎ½žË®8yy¾iž9š]È"RgÐ5¾+úÍš›Ú¶Ð¦µ=j¦C•y?åÊ 3xöí¤ï¾<F¬“+f&ùÌ3Gˆìß§ÎÒ©S®s§,pŸÉ£â71{DðÎo|ú°3µüÿ>ƒÌ …­Úi¤J}Ä\R0~ªŒ ùUçT³Ì‚UwÈ²Þæ>r>zÛd#yŒD•s²ê~
üˆ+&Ìpo?¥KRá›ÐL3\9ñ\,á»W?Þ»%joÑ¯— ù¡ße$­×.˜VÜ61¬¾mÂwé5µÞ1°}˜	P‹fûkÇlþˆcm‰÷Òç
F¦fÙýYÿÉ¶ˆÃ‚˜	¶nQ¨aAJ«¶Jä¬ÀŠ¥ÜŒÿÕRÜ|’&©Ÿ5-æ<yF^²üJþÒ^Éù+¨%ÉPNÏOÉdº³ä0šé{ùm2[#ÃÝZâ¿ì?«°ØýDâf…×]VýÜ,+³Ë.gU‡'õàÅ*Ü'ý|ß}Ûä.sÉ_ ˜(“ÚÞëæ~úJx/}ªÿÿb^&Å½æõ …1/ý×_æý¶Ã?Ã"àuð|d,øæžv·æðÌŸ_Š;”,c†|:eÀëYký]ÿœE'}´•¡í?Xñzv?ã+ˆ‰÷ã7a˜ÔëMÍ
£wé>lõífú•^}ª¸áÍ„ÚÍJ¾‹Ï´Ý^vÉšF2{ãoZyóÙÀ¥„q¡Ú»~ïñ£s÷f´M–ð{kù1;CË‡ý9÷‰÷’À¿1+ïÂsÙM÷bn»Æ)'·`áiôáV\ösw«_Þ]fÝ¾üBÓÈõ2eí¥ÅÆ½+]f­ß÷À˜Ì¤|ÍÍ·Gz•¥ÉzYTmbzï’s3²{®L_å–ta§óTÉ¹}Sz“ˆ¹‰[6+¯”ùìUF7Ü.¯¦à‰bÎRX14uÛ”I¬Õ¤âž»¯§)Kƒƒ ­Y%@ß Þ¿»“žÆ]íg³¾õ»·]ŠK*UeàV 7Q±Jæ<­»uF*0í²çxl’±¹ŽI¯ÇÝsc£³€ Ãƒâ¢ßõl•à®^ZÂ«$„^Á¼Áü+'‰ªKP»¹;=Õg™m´L3Ú¶*x`°—Uk ~¬uÐ—×p©ŽE@¤‡º0Â¬K09Ë–vÍñÔÝ¹¨¢'™fðOy£¤ÉØƒÇî%ºø©Ðô1MÊYË«Î¼÷Ý°ò,šÎLËøì©ï†{Q¾"VlUyL5"’ó‚5"“®]¬F¥ÏMžhÜX¹1öœ†-»©Véf–­U5ÁhPI¾ü5åÁ““GQ6ZF1Ad*Ü
yffO> -=	*²},üÄ¬"ä?WzzŽ/‘3e£ûÍj,szi'ÿ€æC£Ïä9iÙÍf¦ª[ÓÆ
Ö	:Ç_ð¹Ð`ï­VŠÈ^6¤e.z}¹¢ˆÜYÆÓè•…4¼ˆ;«J–Þû`y•Ã¾´fµ‹nü…+ÈZíi4ITd¸
egHš,]+ØÅŸ\*Æ+-_¯ãyÞtÕ*m?ËBeÐ~4Ì“½°£ÕÃã4ŒÙùH„4ï€Í&cœoºÁ¼HkÌ`Ë¯v6áÛV˜‹ÏÌv[Pµx_X''ÝwûW“s˜úy‘NñÜMÇ=ù÷
œ?‚¯è0ž·
f9uckôîñ¦¿`Ów‰Û^‘YX²¼r>§…eÍûÑ£õË ßMwgÃÑ2uW›U¦°±;^L>kK<ä37"o‰üìéúçço¬Šy^ÕŒßêüDóâwÑŽ„ºqÅ9¼Î\µM wZaž¯$ÁýªvoååsæÁXÛ@™ô(yn_øë“Ÿ‚ÆõÑBÛÙutgaJÆÁÐˆ;[ºåªM:óY”÷Z(¼½^ä`ÈNÜgAåUTwûŸ‚w†}5·¡òÖHD¡/¶’	ã¥q“S)ú/*¢ˆX³ž»‰ýîÂM`¥•ðÐ½9\éùGÈ±/SIfòÇ¼·1V€otž°(wÐ 1ìvg‘æ,)<áÂ4ìU]“»¿¹Œ%9På…¹ó4"=±‡ùõ ËÎº~W	F„¢–·e¶ÕÍ™¿ü‚—¼É<@ðš+Ÿ£r·gH^>bvõ3ï(;ê$p.»1	r­f§´äÕ ‚X•W÷«`f®J~  Ó+¼CH™~ÁKu[QÎ1«7d\ƒ¨óuÈÎAÀ>ÆñgûƒúÎz»‡Y§yçÉÜðÊ¬ÐŠÐÇ 
¹ÅXs_nz»Ê
„¸Gm­I§¶+åŠÉ"KÁ®m5àAÜ2$°ZÉgÍz'ß½‡qŸ=û£:/ÎTø‰¬ZT¡â¹qÒ¾áÏ5uîGdÿ[Aâ•ñõJ#^,^ÓM¿àªCœì¦¾N-]š–b`ªõ›%Æé–µŽv*KU¥zÑÈ¨rH<,o,MužZ¨bÊt¹µ'Ù¢æZj_SRÓ²ÃIÔuÔæÖûèKÐTûó§ž´Þ;¸­[·mù¢EÞýãïÿ«æÊíŠLDnñô*²lAØƒv‚Eèý?þþ_äkíåâ}]“ŸCwmÏ½ÖGä”W+÷	¿Ë­‹l}ë¤	ˆß£ç¿"¶÷´ç¼I¼c¡¼K ~íÚ©Tqnƒ±ú2¡a/eQÂby\ùå\%ï»ïÝˆ; j‘ZýrŸ¶R`/ë'.5ó‹ž¼sAÚw—À}’Ž ‹p{@Ü*ÌöÄ÷¼µX_†‰Úµ·
×Fr¿×tlÆ…¡Ë–RÑ›å Y1¯¾¢ï$±ÃË,(©*}¯Z0h0*þù¿ÿûþ'y,Åfv]c³®7¢JÝ0ß=VÇ¿J#ÛrÌgì.§–s5jÝJyŸñ¸Î[÷³\W°>šg½šMc‘!¯¼‡TvÍï'g?‘üÛz­}^v"äu–NSBQ.~S­†™Z®Ø€û–Zª^6Ñ@«—ÇÅz»²ŸZ©pMâz	í0¶K¯t{gÛÞY^=K(w}U{|U—ñÄ2áá‚×8Ùù”Ýó—vþ>„odeÀª`Ã³½Ä@ª·°¥QƒhõÓee>dÝàûƒKç³Ú†­¼þ¬âã¹¦î}eê²y¢®>þZZwï×Ý{Ôü;­bÝ§Á@þk‹Yj"÷žÄÊOÓÜŽuËu§2?rç]Ó!W^ï&à¶:Üø	Ý¼d™1ÓãòlJxü4¹Z¯²»M™†]…ö^ñ&ËÓ¹ºY»­äå°÷¾aOª.J«ÿÜëâê%iPjy'Ž×ýØ*T€gtÍHþjÛŒíµ¬L°«Vj*?Ëõ™·ŠšKõšêð¥òÓD9ÿ²Dó—/˜=÷É×}~ryÅ1ÿ.–ÉïByu¡\Wü+f |Ìï-öž³?…t=¦jÃËçr9­¤—½^/o6sàÈeu–òB¿ÇPû¹ø``
Ò%ž„&ôÖƒ¾xÔ÷WnŒy/ÑÊ+wUÖã¼?¦q0tÅŽ{Åƒë®§¶þøy½w–ùdXw¢Ê©òñ³zén^µ¡®/þ…wç¦³áÙ`nV<êHmz po£tù“úz³ø   ÿÿ U__