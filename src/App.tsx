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
            xœÔ½ëzÛ8²(ú{÷SÐ\7C²äK.T¾ÆnÇ—Øqì´âq(	²˜H¤BR¾ë¼Ê9pžàüÜûÅvU AŠ²Ý½g­Y§gb·B¡P(€BÁ0Šÿµ¼¤Ý«Æ<±:aûˆw™qÿÛD¦Â1o'~ìtüÜé°'KÞ€;FŸ{QÀ£*†ž.Ó÷âd?WNÅ†i>¡ëGEiÔsaüN§Ïó@²¸çBá7	b Y$z.Œ8uxì-iD‰Â†—ðj^[v5	“È.-ûDŽ‚¨g4eàù}­|n¼K âÐ‹b¾$–±6B¨= åGI¯MÍH£žMG~“•†ÀÓ%®¹ÙK²B"üL”{…Â½¿R¸5ðµ–ügFÀ 8D½þqâ%£X{Å$y?~&’ø »…ãg5ÖíxA[ë†Òäçv‰Ž¼ îò(â#	¯ëõãgHb‹aßkY…âžÍ°NÄc|2â¹å‡‘?ð¢Ûõ0H¼¶Æùx‚Öõ’ž#Õ(cA¬¥qÏ–ká$”,î¹P.G^Ôñ½ Gý«ŽxßCöŒ{þp¢žú\ÈmAä¢ÜÌE?[Ž÷ýK¿å÷ýäVYäsÓeäu8°Õsòò 
û}Þ9µ~ÀÄ»ÓrÍógÖñ‘_qMZgqÏ—–4×ç;X‹pž 3¶æx*Ý»öüDª*íp0ðëÑãGÒ@Õ9î…×Ç£vòš@ƒ6¼¸×
Å¬$ñGACñÏþ€‡£Ä²lÃ}ÿ<’V63–kµÚSp	ïÚî…¯_„ó€C»0ï½g¥›çO]õ„7jÓ|„×çQb™«ý¾b’ØˆIº£~ÿÖû!ð^ÇðøÇþe $4@äø‘Buˆ¿âŠãâ™ÇjmäÃ‚™Á~Te…q‡}^…ŒaDÙŸÑŽMÌltF¨F- Ä¿jBóbn´{¼ý3…ý8¦]&[ ÁcXBìÄ'TTùü~ŸÆéåñãòè6(Ö1f÷þ{·Ïo?áƒ¸ÒmDã¥7¬,Ã›Ê+cx[Y¨.­ËŠœvV^ÕjF/¼¹šÅ½†¸´ÛÊuàQ8
 ß+7}£"·Ò
û‘~U‡<j#A“Èkÿ„¦W®ýTÚEqU†¡O8$¨ÚRRqÏë„×•AG}eèÌ/ÔÉ‰ÛÐ›•·Ë!aÞ¯€†yCãÅ½_Bm”e1@T6:>pošVý;n¸®kÔŒÃÈûÊrM¡„	â^ó« ¸i8 ÇßË(ÿ¾´7ÊQ[1¬)]ý®%}Ä1-ˆ¼{__k}mz(!	¯ÄC?0ùGÀ í‚÷›4RÕjõÝ<EMÃh
,hñwZqóh\ÖŽ'ÑÝ
{C = ^6¬ûG{wlÿÍf•õí»ùÖ(IÂ`ïæ;þU1º$r"ª!«McAJŒûm~Þ¨T*Æoã°^µ¦Ì!°"P`ƒAºó íó˜$ñÖ(ÒKývåE†ï†uŽÓ+¶ÜõºúÞm»|`mÉÐÑ…ûG”æÛô]ë¾Ýóû NÂÚ£8	g~ £Öë;‘;Sca°yã'ë€MŸÃ.`Cû€_ív¡[âÞ-Ì«NŒya‡;žkÆ·AÛ„Œ0à.qÝº3uÓS/ŒÎœ¾köy71eÄW§íšI84Y†‰³:¶Ý÷÷(£“æˆuÏÝÍ˜[¡ÍnÜ­ê(æ{|Âî¾ßûb%6k&ç6k¹áììÌh¥yîÜTÞÐZÿa³}‘ÿˆw­™šÍ®³àÍÖÜÃ=‚ðkcÏÚl=KÇ¸cŽÀ7ØÑ¹ˆÇUÇ’Í¶]ˆkü	$E`÷ûU+@Ë›{n]˜Ä€zÆŽ[kì¼»¨öyp™ô;ss¶hª±é®ÿ°.š;0ç·ª~Ðî@Õ´6ík­ÚáHy°u3‹³µê%OàkÆ….˜]£}¡M6S·ÇcÄ·%«ƒ ™-³bÚP¨7ànó¼áU ø†}/°l‚´¸9OÑÞ´73´73´?¹ÍÍsvˆØÊ¡~h?<X;ÕxØ‡1èÔØ'›¼:Å=Èj#žŒ¢Àð@:›¨)š³³,ª˜µvÜ T°múyÇ¶Ù? ¥dLßjmè-‘s2‚3˜¢¬ƒ=»!¡ûÕñåW·"ï¥	Ëøý‚XeG1›è›}’Ü4Swn ·‹‡‡\‡@[©¯dYoô<L²E¥HÍ5•åE(O»4Kj‚!!A6ÖªÐ¶M¯Ý³v¡š] "DC_ÚìåÄu‘
'R'e2›ÖVW¥v- Y …ßq×œÁluH£8q>¥£}&eß‡‡hå*ô;FÍFNÅÂ”/G½¾EyñIA:Ì@6òYÚ;c¶	„ÿ	á4
Ü‹knu8Û¹æRbÔÜ ¶LR`"7ÙÞ²J:êŠ$Ð¯+B¾|Jo´Ä·rL¶¦^xœ’[¼ß7ÙnÒÑaø³‚6ÙišökY–‰|ÞE]Èd_ÓÄí‘6‚¶¡v´`²³4ñ¸–K4ÙiÒ~HI¨6™ìÏ,iS&xä™Œï«„¸.z^”€îRñn8(a4 |“4[0’Ù`BI›ÆvUüUz(@P,È’—sÉ‚®qš|w‘K–”õÒôÖB.}BÞO7;"ÑÚ ñ‘o²0MÞ
õdB¼Òò^ý,ËPÏòkÄcR6^m\M³í-éÙnLÖI“v¶DRß’JQ‘¥9ŽWeŽã{iüåˆ‰›lÆ_ís™0þleý$	³»ŸTÚP—Én3Bö)ÉJ¤Éö32I€¸õÁš¤Ú`²žfX¬Ñõû¨FÜëÄ=Î–ŸÓ,ŸÂ,ŠH“meðµâØA?3º	”qûaD8€6dØI3lêõ`í 72®,ÞóApD@…iÊÉ¥øI£4å‹`%?è†&;H£×ÚMËÐ¨"ºFvF8Iì9H·³fß¤i&û’F÷dôe˜É^¤)¥$Àíqiü×}?¬ ÞÍN3þø)S"`ƒ_ídô? -•D@FòžH„u¶w	ökäEÐª?ÓG
Íª8_Oi"zlCÖý0¤Ò”CYôa˜[* UÉ!¦YNEã‰R«i¬/ÄÃ°?‚VtÒèÑ‚†Ešr,†Þ/èþ00Ò”mAôˆwaºèUÚ× ¦‰×W”{WPæ2E=10R»£&M¸À`i6Ó”/*ÅçýtØ§É_´d“ýÈ—UAHô9´ögÖZÁ¶¢;*D¡‹4ñJ L¼2àQFòu.@4dªp#Ád'iR ¦Xy M{iÊ§¾Lñ½à2“‰Ûi†=Ù¿Éí¸Kãw[-¶;€ÕÓ„_kPŽ"E£Õ¯²DÑó/2TdM”MÀÔÝŒºëZ*ÔÓ¬q4†C}ÒO£ÐYÿCŒž+Nü‘Æ_
è?Ó¸dITz‡Bˆ/¥“À\átÒ°ï»ƒ%Zãtå2ÉX÷`­p‰œE./ì^t9B•0nÖÎAéôÍ\Ñ£j
Ü,ª~Îb-¸pÎ<-¸xÎBÐ¦Yß¥É­¿b«®yƒ†t²ÆußJ\P­îaõ…´/J¯UCP#‚„„,T˜TG “=<P[‚ê ¬øb¨,ÁTÔÃâ‡‡ìû°Ó}xð˜5‚tPÐ¢Û!‚òP/.ð*¡’zq|F7|x0Õ*L@¹,¹°ÌCÅ±c<	Ý‰˜‡‡&,ËúŠÒ	¥Ÿ@“ ÝmÝ›+{^Ò«z­ØÊRm§Î’*´¨í#@\¨Ž€:wµruÓ“Ã²¬m·˜jCGàŠ©ëúÉ!Ô{0%J:Tg,â÷a°ê®Hfj+Ms«¼Í€Ü¹kÐÀÅƒ(P®ešsVÁCÓÆÓÛá5ÖAÎCNë"Æ£ä èßžÄ¼³k êô{?†%ë=‰T/.@Ä^AmÃ:J‹©ŽZÇ£–{ü‚ ï»f½ºhÂŠ6ŸÀ_ Ð0Wñ¾eßKí¿6./Ðæöý¾ÛæcªmÍ½÷jNsañÍbõí[\|]«.¾¾¯;Íú+ˆ|ý†ÉDˆ\€ÈúÛZuy™ÉDˆ\tšo–êÕ7o™Lƒ¸%§¹üv¹ºð†‰$ˆZvšKõ·ÕåE&R êTüöuõÕ)õ¢jo«¯_1‘Qo Ò¥×Õ%& æ-ÄÔ–ªoÞ0J@l¡¯&âÏYõfq©új™-ÕjoªuÀ¡UGè£ö–ÉDˆÄF-Õ_W˜L„ÈE¬¢V«¾Zd2"¡U¯Ô«WL¦A6ëí›ê[&R Zµ¸¼T]\d” 1Ø¨¥·Õ¥e& 
õz¹úz™‰ˆÂV-,U_/0‘‚øB+Þ¼®¾vQÊ9kc»–ß¾­.¾f‹¯^¿ª.CóÛØYo_Uß 8‘‘Ø®À`J‹Dˆ„v½­¿©.A³DÄA³^õE&’ 
[µü¶ºPg"¢°Y‹Õ:Ð“R 
Ûµð¶úªÎD
Da»^Õ«Ë¯™H(lW}¸Š‰Ä»‹Ú RÎY§àëÀ*P#ÀzM%í'Üêìõ[ˆ0/q÷,@a\‰&°°ÊëåW˜ýå†Þ0€”£
%Èœ‹¯j˜³s‰€ëK2Îú _)(ÑPZ×ä!/ðí¦8ÈpT‚Ž·E2<.–kbœ­—Œæ´\~pª‚Í6‡êbÄŠé-™fÃ5qRð@k8rM¯s…gB \¸t:Ü†ÚPÎ«¨†}ˆ¼aÏoÇb7Ëf7œ6Àxbm$¬ÿ«Ðo¯oÙ/7ÝNeÎ4ÚžOPÄƒ²jQÄ¥aÏCIœQ£rÆ)&W¨À4k…	lÄ
ØI‹(	šÚòNõ$·}¾œ=%chìèæwáf <Ë€y÷¿¤oß|x(¦€L‘2‹,à'^ßo—P)vÒ‹ÂkiHçQ–¹\AJÇX'liÞ1`VÄsi“‚{ºŒ±fºyuÆq:ãnŠ~¤­´)$«]QŽJwÎøŒûºVCôf®ˆ÷ŒÃBiE$CèVs®Ía3œZUÅI«‡;yfÄn€Ê†Ž÷vµíõûÄ
À!BÀªMUP 2–¸VDpÌ“UÁÎÕ{¤×›ƒò¼Š·KëõãÕ²6§Ãjcw‡mæ‘N» *MðB›Ã ñc#­Àð®`•‰Ë	ÃŒß…7 >·ÔªÆ×p…Å‰+âhhÝ`ÙÂR®jÚcö	Ù}S­§0V&’‹ÃƒvÂ—#›á¦ï{ûØœ‡ñy‘ØÓ™[iÁÆtEñøpck¢ÞŒ½Û„É–Ã;$ ùXóµ¹óÌ„f5v ½a·ÐŒQ«)”ÅHñÿHCžŸBm{ì´q¼ÅÜìøÏ®¿¯ÔggÛü]}¥þÊY†Êÿs+¬¿²/±»ŠCÄ¿²úîB¡ö`á_Å:ÿµu.ê\„:w¡N:o.Ô-âþ•ÕÄ— ÀaFuHÀ·#V0cæóÒù~×²Òè3ž“C+8=WÎ¸v–³	ß2Í_¹`®j9ÌRãOä”š:Z™R%#µ8;æ®Y{â?“MP5¿Ïw:%R÷˜Y8Ñ]“4º4ç©âü?›^¥»ZÙªUÞžß/.Œ_ÌWÐ>°Ì
É¤´oK9ç˜ÓV‚¦4t`4“¹º¶¾±¹U«/,.-¿zýæ­YÅÍøÕÄ¢%.,ECê¯^R(‚©>X6PÉ–§q0ÇŽ²5ú q‘¯v¯­‰U5Ë/Ø‹‹u 7L_Ç4]?N‘c(é£wh úsX¤z;@ÛNÐàÄûÆ~”ÎÑ@ÓKauü ÛÅ0›Á\sÆßæ1:KÅd»‰«,Ý8ãó¯€©X'rµ¸@‹·y‘°Ö.h—æï&|u"ú:Oi+G\ÓÜpL&0ÙJå^8|°DÔ(_=ÐhëYÔ) Yx;E±±ç#à=ê˜Q:c¶>…x’lŸÃ©ÄÓW5µâ$²Ø’)X’+cJ®Ô‘¤%ÞÈHÒ’äzM¥}ËÒTz«<}I¦+a‡üLÔ<ã€2 l(Îj@›?'GózÄIMžF•†TåµMîªjPe*NPSáEqHIâz:sEi>3ÿÏÇZ¨5k•…ó&Ê‚‡…Ú"|¼>¨¿m¾†Šµ­šH­SNÛÒ
`öz>‚ŸÅ,¶Y¯,@éQßædä·9,¿tþP‘•º ÿ{I±ßW4©õwæ£<‘aœÐ@U‡ò-\tŒÙÁ¤d~ªkÜÏô;Ô—~ÄTô$®s«…RêLI©éà$?‹¢êÉ2ëŒ}(´`èu:eÅ,³fÎiÜlÛÕ˜,*¨œðâø%8Ûüf
(€…,I³‰Z.#D1BÚÊÌ ¯r·Æ®ÐƒíÓßFxô9 ¿#ŽÖ$›ÜÝç“Óø:ÍŒ’á(ÙÀãO±¾Ì£…jAmêýäÅ°&¢ô	UüŸ®EÔ!±uÜIŽÊ÷1Št
Ì¹)‰æ¨0AFØ®LŠ¯#
/Üp+Ýž— 'ë+¹
Õ(òn«Ã(LBTxHn‹5aZ˜™†	s6[+QV¨øÚ¨ÛåQ	4ŸÉæ@i„s!&x­js(ª1úÄ’7”†k"”•JÃÞMšgüa b±KCP. PªM&c¶¼Ò4·yÿŠ'~Û3™ÙÓ¾årŸ™§~°Ä>mjãqÇ9Ó
UÖpÉŸ/ÙQ—;hõý_#^(*7$žSi9 ¬ûQ ë0'ûxÐd¶Ó¯G›*¨†f¥i¦*“á˜{v…æë| ªLqå(xäH0ôTEÙ<Uâ‘Æ‰ü;
UâhaåžlÒŸÞ°»–—`þ;v² jêÂ˜ûøv !!V¹ç“{­Ç0ëw¼H·”è³[R:Ýq:Xû“õW“¢Uí^ŠR*3wr#
äÊ<¬è`DÕ´¤d…“A¿,ƒ^XßÝqçW‹0a$€ùÑÂG<KšD¾øQ†*Wè±	¤DéËBi­¬Ü«NØN±IPåŸa8Øá4±pžÿ§µâ|ëÌ}«~ë¼|€ø1sö?t5få¤0ŠË-·FS¨zÔñÌÄÛ	×~'é™â[\Ï“¡w‰-ŒüK:z?¯úA‡ß ÎˆG¯•ú„Âôûàn`šÕÇ €_òÈ°@©¯ ÌžïxB{É/^Äeâb­öÛ##ÅˆBâña†B§j˜¿ÏµùÜï´„‰Kïð2€ÞïT·D„1a{bm]rº0Iõ´¿¶%³r¶[²fÆó…ÒþÊÓú$æûhO_ ôý€Æ:„>÷Fƒ~ã’ê¸q©]Fl¬˜v8SŠ|Ü—U1C«‰¢"$¢‘Uõ%×Wl^—œ«L¡Øºäðv	{sÇgï¨ÁÚ0D‹3öÑ’Eäu(LqðKÊáçs&ª.%YV3D]ÌUÑÕô¥y9¥ÊšœÒê%iÃ‡}ï–Š´ŠùgÐ„RX;$ X;ºGåG“¡‡‰{ŸøIŸ;¦Ébq£?½QÒ#üúÉoq$Æï6®(º¤Ia›4ºÃ(„!ÜNôåA¯ÀØ:Lì§eÇÓ‹­’j³­ÀÃ„Îñ&…q¡ˆÏËæ³Ã¤¬&KÊM¾|ø±òú+žP 1ÉÒùà:PÍÀîÂmjÔOa…w¨UüI[X6ÙLÖ~[`QgÄeKß§z¿ÄxÇ	ÛH˜—°³„Gl7BÛ	þõ"Z­ÑwDñwôýãßÍ„6ôØu«¹µ³úBÃ?~aµlv€F?½0éú7œÌeX—`„ô7° ÏÖK°HšÜ=!
ÍÐ¹•¾ß3¦¶óRZ²!&Wê=\—×m–žñ@¬Qj*f—bvµ˜N„1(+YžÅ´(†Îw/,·nÜæ2çã†ìæï‚ÄOy‹'ÙšéÉîaX8“ƒ@¯ Yƒ±ëÙh;Ÿ¥Ý:á9ÕönŸWoýÉzë­Þg¶wáÉzþR½Ïlîâ“Õ.þ•j“g¶véÉj—þRµÏlíò“Õ.ÿ•j½+·þ-ŒÜþ·°qçßÂÅüßÂÄÝÃmN­\œÖÀ¬´ ‚@¢IS¡ûÙÒMÏo_‡ÓMI<­Ç¬PÁ_‚ÿõ/Ã¿}.|?ÞAï?þSr&Æ›fõÙYI¨[ÕÒÐºÕ2&zJB…1ÚË,ÛhÊz™ª’:IF$2œÜž‹ûròØ·Šó5FýÄöo§Æ7/esêÝ¾Lk¼Hrz·ù·¸;J1yÐFr$ˆ('¸é›d æTc[ù|NšñVæ»ÕÏ¶xR¢aˆ“2‘®ÃÓJ“»ª'ÎÔ'tP$mÛ®ú¾Åf*D¡AÄ™[ü+ÂuÔKXéñ—¸’Ú\ˆ˜w¡—É¦Ò÷nÒ¸H*.  ¿
/|‘Ê{ª»H°ØnRy#˜wOeA+ÄOû”†¬ô-Îâ*¤Â»  PÙ@’¸¨™ÝÓr$ÝðþwJ? )¢Ã 4ºVéuJ®²ÚŒdNš(V‘X|Qùø'¿Ö‹B½/ÂæºCmþ—n‘YÅÙ­a;ÒÇs[XOü'õc};zHŠk` PÈÝ‚qðõ!v+7Š±[A707dƒt¤Ù‰*â—À–•S
Œ0Pl—7„¡û9<D×ÓFpnð”Œ1ŒóCçÑ‘s‹‘3™#¯t¦!‚§£M[Šà¹Y"‡8]£! a×³s§ÔÇàSÅ¬b×Uo*„¯[üº-âÙî‡ÁÆˆ.t¨Ú.IŒËé=± â‰0ü`M/æñ=Ä‹éÔD2•ÓB„ÿŒÜÂXÃñÒhÑYE«êËYLFüŒ¨Îë¨lÍ>E¸†N
­³ÜqüQkÅ<î™Þ›˜Ë-ð{°ÀW‡~š1Z Ú~Ç
ØøÕKš	®Ôaa]ŽZ}?îY¦×ézhùz	àCW)Ž{ä•CÆ»G- Þg¿¯Eµš¸v
9§Ðp“ªÉçµlÓf×‘Ì™î¯·ø¥äëÊ±ò&^:.f!X~ˆìÚBãIHYQ×g…˜úDÌÂyåÉR‹yÁ<ÄZ<èLEš(xóÖÐOqqoàxóLZÀ|ÿí»N½»Š@¨ÓXT‡áÐ²•Q¸2AŠ#6ˆ
³À¼‚‡J†á:œ’ö­?ðÒ=4³½âþn
fƒ·ueÇ|nŽ]ñæ*0àdjãaþ˜}.îsjcO™­ž	Ûñ°Ï½€ÌÇ,òu“Eò–Â5#lý6Øìâ> ¼ÚéH¯€Sipv:’‚á^1^ùÇQå}A;[ÇZNÕØ‰üýU¬™_ûaT6…jêž°šƒ­uÎÔù÷Œë. …10Ú¡_Róeàƒiëù–)ß%ýùD`M¸¡–¦U±,n¿_‹ç6_õ’¸…\œ™çÒH
*:kÙÂ›c–€Š61h`&þÆjK$¸ù&JïZ£½[„?ssön2ç’!‰fÈ¶°¼ü2¹Ûº|{¥Ûš¨ŽÙMÆìE‘ø<xñ©Ñ{v«Qhe÷í^Ý^ÔÄlQR»n÷¤Ýî-J}¹Ý[’ñ°Ó¥z?p4ëéDÞµ¹Ò„>cæþÙ5Ï&ô'Ð	ÿü4É«ˆÄå"ÑqùTZHÖðv"RàÊíäú´ÿÅ7‚jøÓ†Òð‘„ÛüÆ²ÓóÁ™ùÒQâ
üU§ˆe&ê¿«-á6â'! ÒþnNìO·ú»=žÖ„ùþb­V¶¼J÷ü~q¬a 6P¡UP0böwAû»(ÿ¦w…ÿJ‡/ˆuªßA•ñ¦Ü Üƒ.þþ}ýÕ,°ö/†ÞP º~fOl¤(#º‡èòÌ¢ÑÕsv–²t";“^:¦+@Kãs­ ¯Ë"Ÿ¤†Ä0ÐWqY ÕÙZ¦_“qiŸj(<<\÷qcY»+KêEÌÎÎ¨mçªÔÆ\ûÚÊÔ³^Lÿ@õóóL¡oLiI3U°Š%&ÛÕLÆq$¿:‘øš ÐLÍ~¥ùMÍ/ŽŸÄ“VšÀOO£*Ð(â_\LM%$‚9ü[–3»o3f_ÊlÄUÚ’I2„¦X`8JŽ…ÎP6“3:º5Þj=º‚,DWzc÷ÎTBˆy}ôq»
Ú¿Ï;[*Gó\Š6PÜ>ÒüR§»¸ÀoéŒ#](ýuâÒ+Eh”UŽ’1J¦Ìd»•ñìäqÔ„–ÛfR'm·ÑEû¿Ïìî6Y3
TéÍn K–³¶Z®ß4ZÑùJžÂÅe‘ïC,›/†]~Kv‚8°’´ ÒºW]=ÜÁº€Ü r¯ÝJ¦ô+d’«9ç{Ê@Äiµ¼ÞóüÀižQ¥Ëbæ,ayçÇÂâøne7Ñ8šý$’ý4 .È”ló‡X(1÷°ŒpLÑ¿&»Âæ9ùc2z¤*+UWÅ¢`lÛ@–´¢š+µfÞTk•JÝuëv˜ ‡‚5ŠÇRÑx,—Ù4çFñœynBn¥fxèž÷îƒBsPàò!nzÞ9®œPBnZvèEƒØÌnïðñ–Œ[þ(¡¿¬%¡ß	,Mä>`D”¶6ÓC.â~—õ5bJ¬ùî™5æ 9àZc@£¶1ß¼9 8µ‡æµ50Ïû÷ 	—ö?¦Še‡I÷W7Å'6…q™¡Òñ²\‰B›iš¬¸ë"…B•²†4k¥2	Õ:>À¸,6@BãbCaµ&c+šðŽ¶¼jYEÇY>UíE·‚”ÿ#•ùˆÇá(‚á&óËà£eöxÇ÷`ug4¥]³Ð?wpY9i°
L’pð‘w“3[ÌÇÏÈúUfÍ§'áðmMÎKüJ¼Kj;
‡”
9Bz]D"Î@fÊá™ŸLýZ’Z†X1MÃ«Õç¼3ØšŒM1SÙ¦ V’üµ,¹¹‰D;…ƒ	ä>‹È7™i
j“©_KRË+¦ixyQ2Ö*Å¥X‰,SšHü:™X†R!Ia”.J< ½J=C§)„î‰Œc,õI’Û¯’ÂdrY£­û¤ãAgì_(J:.‡9CÎE2–ãr]J
¨ÖŒú%'Å­ûiâå"É6Rô„Gdt1ç~ÿíÓw›Ð…Îib‰D©$9¤#)ÝÆéDã|U×›­)‚1žÜW’è:²K×šÝz£Íß¹×	ü€L_#3!!ÅF‚ŒÉÉI±AS
à"‘Ž"¡)¢ßÐª–5 ­&:@¯ˆå€;e52%‘Tª
3)ÒR"ÈÔXTñ*ÌäXPñ2È?ªXbŠ—T´
³Áïœ¢ÖT*ßXºÛ8¹œòòÉ%–<ƒ»ó»~'†ÁGô=Ã©÷Œ¿òžq¹QqAÌ*8Ð0qŠ…X=’OG4?]'S¸3?0Â89”Ü‚g&ÝÂ!Ba¡½3"4ÀÆ~E7’7œ¥›pÎ b©zìœâØ!	j¢Ðî¡¢„w¤»S+ÕÙÅs‘¥H£Ú"(D•Ê˜5/&·h§×[pÜŽü!=4#‡ùãQ+¡Â¢ž“,\ÚµëËv*£Þ¶–OB$í EÆâ‚Âæ£'£`58M Qo
÷KÊZÞzŒÌ3®k›ŸÉe˜Ô5çÏ¡A×dùl²ÁYNô@2™møZ×\›$olF¿·òWœ¶ U´J C²¶Ï
c±
qÖ W’nRçœÂœmh¡¸EG]šÈLå!¬œKV@(¤SÉX iALŽÙÖä™ÇÛ‘õâA…ÙmaX²mjçÏðÄª«>Új¥.¤ ¬ÀjÓà]þÌ¹£8]Uœ´øQÁ:-Ék öè.-.Nîåjá^D95F»]ŽÈGßãF+¨ŽðŽnbyímA2D*õ?X ïRxõ^®@™0»³ÓRXvÀJu~6J ]£DSüG	º–mU”œC›ßtX¤x4l\ MW#—UkE¸b­¬Fö¼U(†‘ìc 
ŠŒK s
iZëp..““
ËªWZ‘ýò#Òl®½äîçwjç¦©«"õgYPEŠEÔ=Ì[¡tY6]äˆÇtFÒAóÓF'Ê-(%³å†zÍ¤E¯žo#xèÄR¬ZµfÔ«µóÉœx'E0y˜%ÙÖü$>äÑ±‡>Óüo&3yÁ%Ÿ¨Ø(ü–Ô Ö·Ï+™÷ÝòáZRé6‘Óõx}gg›ßÈúÎ3Ájpéü÷ÈÄcÌËãAšyLaC2äéÔŠ{Ìø²1¿Á¯ü6?ú°–©{˜mÙ…æ¬-Èˆ0ÙR)Á¥éu™ÞÓN ªŠSò/<oÒÿÃò¥/=‘¾|.&dDA-9ÄT ç\1YLjúUÕ¸;Ÿ_1oâÛn£‰¯Éøç|Ú\<f§“Ó€ý{r3’&ãtFS*]|à#+I¶ÂÀ®Ônr¬´+õËy~Wç¦F&är×Ë²ùAòT&qDûT®¢J?dÎis~ÆÙqÂ‡
ˆP!0ÆžÈøu"ãmyÆtëDeN{}œã¢|©¿¢{dò¦­N¿§‰gkWSoãMŒÇ5^È_ûI»G^bÈ5¹|÷ÄtˆÏÛ0ÿ¡%oiØ ü³Aýð'¯äó¯¯æò§	^°m ÷ªÎøÚ¢%Ý‹Âö1OŒæüáÆhÙ°Š6æw Ã­Éßuù»ƒ£Q÷¾’§‰Ü¨ÑðÝÈÞJ/« |w¦þðÐ•ûÀ7%Ùl)VÄŒÍß°ñ9²+á‘nNÂÇ°p%³oy_+E_Î¢»W~Ý¦G·œIŠÌ!ø7GóÍ(É•6£°DËÛ·àRT“†ãB[K®ë”·ö"I[+!?ÒZ:Kv>ZkÆ;*ÇdÓKâßIë
$‰<¹,É5$¹zK(’ŽKàõG9á.Gyl/Öé)y`6ú@^ È]9;Ü=«çKrMk¦¨ö‰/e`¹ªw#»[>»“ƒ©ã’\Ó0>™Š(ÛÖÔù{« ¬~àÎ]ÇÕÿ¹[ãù#+Ä© yž$ï~gÌâ¸ ¤v{¢£A¿»‡YßÜ2óÆo °¦¿±üÎî—(påš¢€j…Úk@Õ×õËð0ýÐ‰ç€'MVèfX½’7 Ó7g¢€©¡çQŠÖf@[Ï]HÜ
è„˜"Æl5.n vº›qÛ#ßQÙw¹}TÆ[D1A®ÔSnÔêyì®A«W-v…Síª˜hÔîËÃƒyøbÕpŠV´è€xE¥3(ZõFI(ì>Èxwœà¶  ÒD¬~ÏK#Ómq\ûX6s¤0´b§i±lËˆ²nUqºwÉc‘OÁÅ€Ú–‚$Ýæ‡r6Oƒs<8³ÅÅè¨El@ ùÌraÞ‰ÞE0f²<Ï=šÒXGz6>·WÔF„´“éFá`]æÁÛQ.²vÂÓBøÕÕl4H™%tjd°ò!Îf!¢€\†dËlS:ü5ì"j•z(4¯RA>™ÅêFäEBrš½„k{øjTsay‰- cêG)‚bÜºs‘0TÁšéß„	 RÆkã{x^bÀXöåòƒvÿ¡ÏDw¿‹éwƒß´9‡Õ_ýU–ÕUcÝðÆv‹ÌB|ŒTöÐ8Y?®,k› µïÐâÓó*ÖÝ»wo²­„’¾FÒ–¼¼þ!»8$3gœß¾Í_2óügê±–ˆµr‘¶ˆ´QÀ¾(Š²s<fðæÜÜurŽì¸–4ñKž­Ô
ûùµl]ÌVßVûít×6Ý«§ÚÐ§€Ú­§@zp¯Exíð	Béi“ª­ÍÅHSGMZ<,·ñ†oáfùOn‘ñ+!*Nj•(f„†ÔÓ#·#Vn¸CcNßtó6Ë›N\¨[º0âjÄÆdu6‘¯Íe>jÍËDœ_CVtî\¼òKX´¡€ó}}‰w"ñ…ù~õ«×z½Z5pï•Ï@m¾í†ä\ñ<d‰×ïãË=H#†êÔª0Ã3úþ Ø5hçx^>½,Oè¬J\Q€´ 8œ.RY,K‚Žˆ}Î"e$Wcu[®Œú&LŒïÑÎÍ‚Œ0Ûì&ç¹ÑÐ„¹ô}'Êe¿ˆ­4œÀ
"Ò,Ö<›mÆÂ‚›1í? ÓØOãbâŠÇ&d®Nç‰Ú™áu2F¨qq³ÿ}<Âº×ˆí€«§ÕÐ3ž¯åÃ×I¥ÂÎÞSÞ3÷:ÉÜtc…Öž'pÿÑ*ÎÈðÄ¤…—Àô +N[“Q“¦_žnÙ~ñ‚9ƒGWØ‘B$eþ­€›Ikç|y¢ÓT9c*¯\œi9Îr9HO’Ö¹á„ºt¬æ%TD šÄ²h‡ÔÁBˆ(+"£AC«vü]>ŸÂˆ¡³#˜ŒggÓ!t?hàõ~âóµäÜè{-Þfbü·#`ª`ø…ÚòïUãíÖ± ô&ôÑte2?Óäc¼jâXyx¸À	pÆcËkÿ|x°Õ*yr¢…~j}¦%T…ÿ%0f7EÓ ]íÝ°Ä
v(Î4Ñ¿›Ôí&ãF~y¨Y¾A™œåÞô²K6:£6:ì1çVÑÍ2…,1çÖ½ê•xà7ñŠB©Ÿ‡´ÔÖ‡º¼È»…Ó-na\§²®†´iÉfÑ¢@hÊ
%)¡î:¨’ý°Üä^7”,9Wý–«ùfê	©„ŸÙ(]’ÉÑO7J·ñ¬k›»š&Œ”Ò4‹;GC¬ŠíÖæ"3ÏoùÉ¶AÞ»ÌœœÕ¼8=VöË´²äôé±’…2©w¨©eÎ¾þI•‰?õ¬¼|HÆ‘¾¦9·ÍC¤ª#¨£hš÷œÄuWN@®ùz­–*íÛ\7Ny:¸!·ÍÅÆöXvë!öÍ!wuDÀïªs´X'í^éYhþ @Ëw|30¿(¼Mæ?¦aÐ¦@‡FŽú"G“e?_‡¢.Tµ&ŠG”–"íZ½žHb)NxÞ¾>i°“gê’‘6(iŸ#™º?Gû%"Ú,<'ƒ>±V9¬Þ•ÑBˆ[åùS”"k…D‡HåM§6…Àƒ| ý`&)€Ø0šÆ;sî@¿Ï>ôãŠ1ûYÒªmŽ¯èõ•sn_”þÇÿüÿþ×ÿý?ÿßÿõÿ £âu+Ül©¦DÄkž¾É˜Ä¼‰xWbT+Ð&Ëj¼Z^^\6º†f'ŠþhÐXÅ]åÂZEŽ“+Ú€vµ—V Þ”)Vv¦^#ÒRZ‹Ù¼œ+8½XÙ,eÌ®&8ø §ò,4I yz%ï®ÂÑ«pú*<½¯]Áb¿pU.èú@³VRÜrÎó~ñ‚X¬‘ü€Øzç)Å¸È•DÇ™L˜²Jû*¹}¿›(£ªÂH*1*A€¶åÚÔì²íD¡”îß‹EÎ“û÷xEfv¶›X ùád<±s)ª!BˆÚJ7W©¶«ÈºKÊ¡ä.Ýí$7‘Õ-E$Sy	•]‚Sº.d=Ò=óWi·"m;Éí…ÙÙS•Ž
¶XßOÈìˆŒNÄÔëÃ<°
G—'\;º*uoõìâxukóbgÿóæ‡Í£q©i˜^KÎß=Ê·2£-q*SÜÅTñ_„T¼RbV#<Ay8HÄm1¹‰
ÁØJòÏ”ç9Ðó
°‡Ó¬±@ûŒ“ ³¸ê¥Ž¯°1ƒ@¶ú#J4aˆú”µÿØ<Ø2µ™Ù¬v¼É•×Z?l•z-À'L´škäèüœÑëŽ‰›<~›TÐùa§kââ2ñ'Ït¥†ŒÓ@Ò4l:¼„WœÂV.å_©› e%/å£‰4¸Ùç+¶öz0É½¶VØI/½ãÚDnþ‘'?.KÑ;³ZþãÆô„@ŒVùQ …¬B!=Y(
ð©Ÿ.9ÁîaãZc²¸|’ÉÎ•N³áyå>îzš½dÐgVfÜèwáa	k¼Mú~7‚E*ä -Ù1@üGÃz¯
µÂ5‡c“Þ=ÈU¼s¯è‰[þX%^W³[œ¬Å&÷¤ëmŒ´âI«©;Š)Ö¢Õ³|¢2½p‘÷x=)'cøWUaWû~x0/y€/+òîöã{B÷4äà²‡¯b5B¿Äw`=Dfi rJ¡‡;W-r•m*ÀãE‚iß§Im¯˜4Š|©”Š(ýxzàWOŽ>jëw©fˆxÙÁbÖ‚°®v¨Íd‘sv¶¼„¥±ä~FºÎ—x(oœñh8# ›Ñº5@ÝŒø6Nø Š·½°þôÂ­(¼ŽA0çuk<‡ JÈ^u´¸¾ŠKW48n©—’èö7 _à4)ÒîÉð(àtšc‰]é“£|ò=pÔ@Þtã™êp
B¨‘ò9WR^ç„9³ÑT_-1\’ËM¹NWÌB ô®}É×Ô£ò<mÒÍ‹pæÞòi=ÖES*xnªƒ&Æp2Œùùv'ø£sQ§Û÷"´BÌ{?¼›ù¾ßŠçÓÚçªõj=ãÖcõGl¢P›9£;Ó²·¢~ƒ$T·zsñbúh²îWñùjË'[r†L/F_¡³<ÆÁ³5þ'„šx@®D§A5ŽÚ.¢ÑyP_½ŒüäÖÅG•—ë•¥;>ï½_úñk4—œ½Ü~ýñõøêökgyïÕ¯Ñ`~q{¸þ1š›ÿãW·vÝk/¾þrÒú9Üÿ°}ôzþÍð8Xßº^zý¹Þì¯×¾¼>¹=î-¢U4^ÖjGaÐZÛ5½ nbY
i!=u®kÊ­ 
kÙ”‹Ú¼
ée˜Õ&ÿ¨0'#OƒôÔ£Œ'd>÷¸Ò-Kc’‘ŒxQ–¡?c±“-S…W~Òã’8°þˆÿu<8Š%wüg€8å7dQ£q0Öü5oÍ_ùüÆ6Î7&ó¼<ßx^Žoîm<ÏÆ;€wS¹FLJ@ÐîŽâÔÇª¹b
'«+ðå˜³fCr@Co,Øú/„Œ‰14£¹ær­6¼¡1«¹æRƒ¬8Šç`µŠÃÛUÏÝï?K ˆIžñ¼¬aä#XŸ’°ˆ\«R#	¤W3‰$¨qšš&p“ün’¿nyÊ_ž÷iò—xKrû_å®™2îzÅb=ÏE’6É³ß(É±ßj„ü7‚eb+rW£'f+â:©Èz5m‘í3€šè“(r£äV~r–½®ùïÍQ:›’’Ù2?O¦:´:­©J.êŽÿîéæ¡ÒÚX ºÅ,»rç8ñÊ<q$jið¥Žåtœ.#Û¤¾ÂjwóM³ñ¡EŠËxölJçlšsŠÅÃ=µˆ1‰AhA›Ê¦pY‚÷	dqXª¡¥¼é1muÀãØ»¤Ç™f€@0îâ°Ï'˜©%W¹ŒÄ*ƒxzó~v–~,rá$©Smy‘G2d³íòçdòç‘-·	"Ý{ôûJ}¬¶Ã¹A
3§³‘¸uŠ{½0¿°\]ÒSÚYJu9—â2%wŽxC‘Û@¶áÍ:Á£I£©¾^vÞ¾š/äoKÖã¢žz.•h¯
;Ò™·ÐÔ–òtÙèâû.° , 'vÂquãO¼.¨Þ2ß+î%J/útÚÓÊ…ŠîÔµWDÛüu¼«ò·¨«
Rï÷% µCÔ6/ÞÌD/ëc¶YÜÑÔ`¯‰£’ÿô6Èzr[ž8äÖ¼Ø¿–Zê*.žÁŠNVnUÉÚrÌ>•4d}á­ò|×#'Žf3Jž•òlâ†ëùX¼ÜÉ[s¤#0ŠËåUêMB—åþ”¢?µg}™Ü,I_êb|JoÂ´Dwç(±µä18nkˆsp¦?/¦¢§[mˆ—çÞc^óWQa±$ø+íO2ªht"ÈØ@+${@nŸ\ú©ÔÉÔÃôáÆ@ìmC¢ûÝÝ¤p`Ï¥WBàÝSû&Xs@Fø;7‡D! A †égî¹úwxŸ'|JWþzŠtÞEÞn¥Ÿ'Ì'ËŒAÍCå5gØµf{\eb±;jÓ½±eš–øÜyx˜°¶‘^˜F¸¿Õ §,y‹ÀíQ‚ÊFÚäæ¢¾+Ënmm³Kç¸°ËÂËçìºff:ÝÌJÓ‡U¥Äx£Äø½ØB¦h!"'3eÙÈg*ßÃºø2v0Ï¨¤ßeàœ¢ßÇÚ*&ùs–à² ƒá~.€Çn¶lfßè—òê]µ0i©‚›réÚëÓâÑuBâo¼û€µ
gtmž½§¼F\^4DeÕ4ñ¡¤Æ.èx~À·i=³åµ“0Òž.IuŽ¼oxÀiµá£?äõV¤6RÍê³o­ÇÙÛ3±»žú—ù¦¼*£<ãT?{­<xxx«Ý¡U8os¦P/<‚ª$Á¶Ç†>B…F€žg/»¡;ôÕÉÏnˆïÌÉMÀmSÄ=Q[ßô|a\¸í©7óÔ€€
ñÛÓÞØ{xØöÐS|¶¿á…,lkàÐ°ÎQÁ&…•fT&{JÄó³v¶l:àBqèkÃH™bmCë·‰$º£±	ô3‚y>Ð†íôs4;‘fwmw§¯hv×Öh4…”š†ª‘Ç¦†æë†ØTy>zô×Ç'ô•DŠÀß:ý]@{^	·¹bü­Ó_¤–Ý€6Ÿ†J\}ÒìnB4üMú %¢"f©M¡=ÄEó`(Þe­@yÀÄ!k…îE¨ˆÔ"ÆRÛË)IQifª|ýf4ùˆíË²"Ÿaêv°Mú(iá'=ÿ‘U‹8©.ioFr©ðÄÛHS½)Ša°~˜o~‹V¾çóô|´Àóß¢oÁÃ·èá[0i;ä—äË­ïÞñù)¢m†î­ÿÒúHWÂåòÆ>n€¢‘a¨j:èÂ{3ÌÙO„CŒž(•|J5íñÊÔ…—ùôßé ¥‡Hž_€âHZ4¥ÞÍ)îï<<Ôl´,ãh<Š<j?ž‹|Ñ*gñQl;Oì\ˆ}Òê™óŒÐG¯ìèTüTr*v,©äÔ
s½i|Oš,àuƒ÷'né:&í…Äxmb0‚dç>½­à¬‚|…Z¯È_Ä.¿uŽºt¹#-+sî8,1r‡Ÿ>€ŽÒ%“¼˜C“¢€¦#òÏÓi„[P„]¥	fA£¨3à=€tTÐ\¯x÷ÁKaûz¸3_ƒæ°Uõ<Ã†ìœg€51—W6 	å?F†…Û_@i‡±…ye8†éóÜrå+z×‡DVðEÖIhlÐe…<æP”Ãâ ±=<Ü¢™Dý„Y^â£)=Ý‡A@[Xé»Î­ïïB>Ûžûn|nÿö=UK×U)ñ¾Ä¥c#§ü;ß#ÿºÈëãX+© ^«½¼£
îÐY1ÎéÐD”µØ­ÔÙNˆ€`ÕáÈ´hn”“SÐo¸IÉN¼œ0¹³ìª¶¾Rc~'”g5Ú˜©‹½€®ßï›`TÓ†®!gDVy…“ré;ÆBT³à8Ë¦ï,‹ŽÜÃ¸òc¿Õ9õK Õ ³Š÷…¢õ¾?’xÜúfˆ±¬c%òOË,ëe^•¡*Ê~ËJ¿ÒK¿¥½i™_Ólùî‰‡žx:GåZ–êTê54ó®ÔWqÖbd™è·ïNäS¬d¨ï5Šµ™ÌÑeà ¼-ï&‘öüð`’Éñ]ÒfQæŠ—ö£ã"d7ÈN$–AAétäå¡FÉbRµy)’AM†º­ûì.”3Sct7>Æ8HÛ2b»ŠÐEßÕdqöô6o°bÑ¦_ ÂZ\&ëtXŠ–«·n&6Y'ÜådíÌÔÇöK˜#yDŽ6ÿÖÄ!4•=ŽÚ	èÃ¸Æ?Å#5A_œ¿Ún+ ;é}éIó+g[hE^&¦°DDÿ.7iOêØxPpR(©âó‹~MÞµBøëí¯è‘Öy_¹û1¦Sû=î~!£XAì®µ•T ì×äœÒ*Q›Ìo„V×
0N{ 9 b"kº PÄ'IiHqœ_xËýU'b™à¦$zK‰fÛóå˜BZSˆ)`J„Ç+SqÛGÜö	·}ÄMÕ ìCåxxJáwo¡/;Í“kªw*Û¥ÕáPÑM•Qìüh§Õ_n…è'‡wM :h°˜<W]h>´VE
²9×£bé9çG€¤ÅHº08NjàCs‹žY	Ûì$v'Ò)‰ObÚf7Ì”ÊˆlŠù$ýïÝIê^ç‡§ùv<8Ü?¼J€ÌQàÜ®¨xÐ‹^òhîG å\7…R¡gÒS Ûñ.`
Ñ„™HÄ*îŽ7¥ó´MaŸ5–Ù@¸šìÜ{êÜ­s'5ú“ ÓÎš´Ù*´'†—‰ÁjÌPƒ¾ÄHF•?ª½ô<÷‡L0ÅýóX¢FRå…7Ù³)Ùžç¾ðÞÃ Ô8å…çÈê ¶Û‚T¨íy À:*¦–ƒ}Çã±•m]àSÎÙc+"ÆYMÔ¹iØ´Ù–×®ÙÐOßŠÊö%ÌÔƒ¯e§×5Eîóñ¿A½FÛÂGôëÕ?©NX\nóz5ûeË/^¶mlá>ñjùì¬ˆWfˆih±Ï ØãÑ(”ÍHÄzé(öYÐfBöÉsó«aòáe¯Ô[qkêEè–T(ö. ½‘®ûóšøŠ5ôµ=-ñ²N¶‘µA:+<#Z¶‰¥)Xsº– ðÅ|ñžf£§¡¯y€Ýi Z’ƒ›'H%éÀbRT}Ï³ÐÇáç¿ËfŒÐÇQ(UeA’OžT˜ëÎ‡ÐµV£óé˜Ô‚ƒÃ?G	JÑï!¯Ýûúƒ2^sÚ%	¹[ –—×2Q…œU¦ãí¶¶úØnc!}9­‘HkT!¡ù(TÔX_ç^„–`–[nÏ}mç“WÌ’ÆÖÉÛé´’c`Á¬°°<5>ÿøíóKã;‰ù,ê;ò+h¶ôM#hÇw¿¯}þmþ»â·Î=N5î8âß…ÄÈ‹ÔXêÕ2îÌ›û.?[ý Äà~™›ŸÑVG'ˆ(v ãýU<ñjƒZQôSvòCÏ¨ N +;sÅ<}	}sjªÇ¥EáMH>è”=ùò+²ÒÂvñÐ¢ãƒ‹h9Xè¡I@hî˜ú›ÖÅ3U?þ‚;ØtG±ô†H.)TrÏ›ÌÜÀ7Øñÿla¨‹ÿ^ÂŸ5ü‡…§ÙÕÂ×Ð˜ªøX6¾“,Î•±MC4ìÄ}„ÖÔ”²>8äãU7=i£ö÷JÎ”EÛ[ÙgVÕ"YY—BëÅ’ïØtÐ„áØÔ7¶¶Dd7©ŠlÈäµ\rW¦ÅÇšú}IÙÛ\í­âÄ„…Çý´Žïiü&ÂS2›Ùñ®~K)zÒSØÖæòN0q±ÈËÉ2Çd
EÖ¦•xª®5½.êí“É7¤®û(µC­•3z@ 
:4raÀ­˜Š†³8õ’“Å¨Cp¸÷('ìqvÚÒŠ§9d¡g²¬3y^¨»-cxñ˜"ÉÛUAr7&¶¢.É_Ý©‡Ëâ!­hò1,±cEßÊÜ/ð¾xaŠWñè¹›ss­Dê5½õ <¬Ð¶ÅÙ4.½Œ†¾dè8Xx5jÐ/ù××Èßþ/qáÈ#gW¸Ä˜¥Ñ-< Yi´$g™4£=PW&¤K¥¸'#>™Ùc=y,Ú©Ñí¤¶Ðë“ñvæš­f;‘þnLzxÀ=Dh{+›Ð­‚…7Ï˜r$Ç”£8ìþ*ziÒ¨‘¹¤jÇÅ6µó™dR—;>¡Ï$väå¸(º”¤Ù’¿213OÀl¤RHE¾Lc×2¡—–8Vi¹Ç& r‰çëhßð9œà Lá2£ÍS_Œ>5CƒT2ù8ãaÄßÔOm“ØE%(åÞ:Ô 6X–‚d…Û"j7‘Qt+„¢èª‡Ù6ÏõsS%Žõ	%Û6Ý!oT~JzÑ€ÕÌˆÊß8¯F<Ìœ¿÷’˜[MàøÌ*½zŽ{Sˆh³Îêç$Šp2qž—ß–³’5¡âPQI“©Ž­¨“„X›b™ÁF¸c­hª)†ÕÂ?¬`HFÒ¦C4„5ÚÑÏÔ§ØÌLœYNÄéÝ’ZƒFh/§ÖÈ·³ÔåÊË$5gÄ½]Ü8¤g\ñ„V<Ã£6¨µ«Ôråûùí£÷%zÜ•|7e‡ê+”ávÐËV0GTÅ zo	æ€Â~dQ$îÞy^.ç].ã-šzÃªF&’åwsQ¥ŠJ–ò•,«ÔíÀ*vmöŒ*Þ3ø¯¾­âr•T†9½8ïÓRø¦Oé".ýªyM¸”ÉÚJ÷ƒïp(eèÀt.ñÎ	ƒ“×]—ÃË>ÑÔÔ¶élº¡>t¬›š¶f\4}Ò	°Á‰r0þûäFDO¥åä†ðæSÙvŸ¢»BˆšÏ‹ÌB‡æÌ·"_ì&´²ÏéÂŸÇþ«ôŸ4dÕÛo’J ìoYI<3JM••môðíÙ ‚iAÍª@;Îx%

r ®¥J™µ<ÿ¼¢…þ›JCUZýƒ0[š_|)|š:ú¼€Ö
éíÍÌ4¢ºLÏXGAí‚Ø]å‘H£øÂK(Q#zã»ä5A 3†èÒðtrÊo‘V"úÙv‚«(x˜ZI‹à'Ah¢kk,­2ET¯êè9êö§ûš÷ûþ0ÆÑ ¾þˆ‰Jæf|²_âuÒÒ„ÝDõï%ºå¥˜.bli ÒÂ'áç€`ðMz¸ø™*ZBE+PÑ!‰ÀœH s
Ò\
iNK˜Ó
(œSm?j“’e½ò¼.Á~Ø-ykôý ê.ˆÙ9"i,ûßeþ²R÷XbçDª6;NÜ}õlø}Þã¯jóO%Û0T_+ýšÜ«Øšû‰œ5[šmïyQ¥ÖœQe )4íE¡û±<–AƒødÿcÂN^™»Ü2}ÆcájË?¥®gE^±!ŠQRŽÅàå¤.ì4'˜¹çµÂhQÚQ$›8W8Om5_zÌTmÒåŒ…ÑHW=Öy^Y¹ÓÔ=‘¾UmÇšA}ÚNZiÃÚA?D|r° r…­«4"¨.Ôjµ…e¶]rá£Ê&º=N2SY·È…qD\
B÷~©ýãláym–¯ó$°/î©/šö
:™“Ó-à=yu¾¦¯L&—#Gbh˜dbC óþDÔV¼TçÆš±0bˆñgêq£¦p#w®<|urûÓ%nÿ>¦†ÎY·Êðd¿Þñ—ÇA‰@ø;@è€¬ˆP¬—•vÙ­ÒØÒk!Â$Uv`½Z_¶sÒã Û°f)YRwYìd›°AÃØÒíÆÅ¤ü±„äÛ©í=
âRÚž]±cú¥Ó/ ÿüö“hG}*Š›@“7V
	šÃÔŠ¬þò™MÏ—·žH/CsÇú‹½]?«±z]SSËkúÈšÖ<WÙôÑë- #kÆs’»³<¢ÆÈ»Á’ã%òZTSâ"”¸JNiQn1<÷·ä;ï¬Ý[À#øvoáÛ½%z¯P{ÈÝÏ¸³ôÅhgaœú3ÍDÁl<îþgM¿,iú–Ê!§ú4XÚð¥×aÄ¥0Êšýá¯6›)'›ý!×ì3l6šèÍf‡%Ny>«L¢åY°´ågÐòÉ)I‡—Â(kùÙ_m9Ý‚ÑZ¾˜ÓW}W3d«%mMmlåíÂ48ÙVí}ÕGƒÜ’fëàâRpÅK˜ãî¥8›B¡±ÐÆ¬ñ›dW[]÷†ÀœI±{_CÏÐ£$?ðwàƒ2 ¿u§Îhq¬~9~	õ>œ sˆ'[¨v§øŠ¼ˆÃG‹_ñ>0ßä8ÀiÉæ3”†ð¥K€>9ò™þ(9Â3ÚÞÐ çFxABy”-¹asŽ–S\¼Ž”¯ÎJíšÍŠ^  qFæMôj!NF¤WäŒä±O$/i<Ö‘µžBÿÒæ£Zô_Ó~h£ÖþfùÚT6t™ë#ºÀžTvrieùóyŠHj:JAýÛ#)_mÖÎ¼ò½§µSœ“¹?2íØ,bWv§ä.i~ ;®çÎ~l	ÇîPA•ÃêÇÖ&.Æ-yRG/p@Õ—xz·™÷jâ²ýÉCSôQ€Ô˜ÐÓÝæ™zjµ«\BÞIï€ä’ïŽ\ë)dP±ÆK¹3Ò:ïÏ€¼(ò‰7à•³¡Ç…@²GaŠ/€4îÄma:A×+hœ.@Ump)mÂ¿¸ ¶pœqÆÕÕíÉ>ÐðöåQ¹veÛ»â"oØóÛq¡hÎ‚R=ý)­ã„ÅÒÄ[¼ yæ3°AGžY#Kÿ9Z)Ë“³9<ï½n- &S¢z*¹@øÿÏnžËûŸÕÕT2]wP§•y+ípwø™/kþ2¦.ó§áÓðlHžèð.´”ßhnÞ˜ìžÃ…G¸¥ƒvú0;“]û±ž‚GtÚ~0îh³3‘ŽÇéÛÁgOâqûL<vŸÂcw*8F†Ij	ñ6âÁÚg!„~Ë'ê•hÖÅã”C½)ê×áÄö‰ÜÎ¦×M:ƒQÍ@’ÇÉyýw±o¥äl9¡¶œíbFÎ( cÔÚsèÙ{&:Qð:Pé$:’´/|} íð^‹{-ý´³{RîKÓc_> w½r÷]DËT.¾ƒK½q=	ñÖ=“_Â|Ä=ŽDP¸®úÜ·Îdéºj+‹}6@\á¢Ý6…êHž°L™I”Ì¼ðµ{+RÖé­¾NÜ´ìÌ-¶›­iéª…lÀµHæÉ,7ìL~Ý²ãÈÕšÉ>ùÖ™ÖP›½è«ù3Ûäny3…Èò§hØ÷|úµˆ>><áž¹5Ä½£PCÌ È1î-²±Õ¤Âçvæö¿ƒ–ÊFK¼ƒNîœ^©z¸*,¦¤btµr@“ÏMI} ¤÷ÆllÎ1ª¿,;›·AjŠfâq´yfðîÔ7¼Ð=<0
à(jÁ¯n„JžýO¼¿¥ð6ÉŠ`£±tä›:â§-\ º0"MªQ˜¯I5}Ì¨K¨Uaf×•ÖL[úåd–úD½÷x/ øõn™ð„z&È1éõLùc‚‰1B|•:2My‘znÑ©æÛ´*r‚Ôø19	ËE}I1’n˜¯XŸ[©[Oaá(tÖÏ­êHx¦ÓÜ„’cP\Êûkv6û¶Òìm½.Èi;È[²º‰ÇÐÐ˜œO
84þE8\Ð;VÒ©N‹»8!+¯^Èsc&öÆm¹E^P‰;èÉ þ*‹ë$†êeV–£cÅ*çQù*’|üë,{0¦A/~Ño¥b“‘*ÄÂ¤CêxDK0´#¿¥·‚
è}GyA<½þs#ÑÙ²ý„åp¶V³ãŸËcü´5}]Ý“¾¨&6NÏ*Åíá©Ì¡ÈiIŽ©€ ­sÏ‚µõ,Ä¾>‚Ø×Ø‹þSˆ}}±¯d»ºÛÏ|…M?É!’Ò>³ç7@üÙwS—QÅ+E8|ÂjÌzZ5Ås­ž­b=]­žÉrT‘"U¤Äh+½˜ëæ¯5)+v§0yôé|J?éBS’0}ÍYõ˜¾èR8;Sp6bVrÈàtMr¶#vÁÝI8›²Ãî|$P“âÎVÜ!w.§ä—Éq€¼¾p6;÷c¼J$æga ø€óÏòlàûEï8{ÉdäêÎgj‹z¬ýKÂð•Z2ªvN&F«ÃWs¨ál$LÝ–vîÕué²…
ªz¤Ír Çüì?ac¢¥èˆI½D1Y»)øP2=î)ò^ÜH‹sÄ›êÉ#§Œy•ý•ÉÇ‘œœ^“]S3¡Ü9·+>×åøÔ·ô~[¬?ÙE…œÎºÎ!ë.:¿˜æÇÎÙô tkçlR?Î'ŠE÷«â=&çš†0rœÃ˜¡q‘p$uì1±wxÂ`~Ù“.¶a|–¯XZ“×âa=Eo±û)‹Ò´£¦us~ñSG×¿©0¬`þ*òM£i¸ô¦àÒ}6.V¾œfT‰æ[šQå»‹D3­Äçýò‹XTLÅ-wúª§_çlK|-ž£ÑS£+ß-³nH…Å¨Ôë„¢.ŒVL»±X÷ôÒ}öpm'Âš²·k!\?G·¥ãü3"Ò$#–ïÑÒ¥ÐNú²•óŸÊ³¥ó[@’L_Ì­ºÉ¢ØŠY”ßó?^·uA…m£{ß#7qß'+Iþ…/Ç4”~ès•FèéÒÂc`jÉIJ¿öª\
V­Dß‹‰ ³³‰xN+Í,aÎd°šÌÒzG×<2@ÛÐ8~ÎñDØÍZfËÚI¡%VR•îù'’ÁtšÿZÂüi&‘NÑfêtÓšÜ-GM~è•¢Ýu@l˜Ÿ?nš°êÏEm®oï|<øðÕXÝß0>î|Ùü¸³}p°QÌ¸~°wxòyóèØ8þzüys~7¾ì¬ïì˜Ìz°»yôµ½v´¹ºAµ®žLß8Ú<>Þ[Ý-¸úáhgýäãç“£ÕÅ´íƒ£Ï2Z7Î¨õç H-ó3o÷˜·/o/èý+Þ÷{aØ16;#á$Ø°€J¶ÙèsAÔôñÔBü·øeþÍûŒz*ò¡]®gNkúÏA]ð7«i} î›µòðOøƒØ+xJUšþf¿˜×°`<ßýx!»{v–¯|n³ŠñâžíïÎ_ ”¤g8€rÔ6ê|1åÎ¦ùæ=¥iqz¹^B†!âµoñZ¤ß÷‡~Âç&Ì5 Èj+éqÜnÇ2?Çm&UN?½–Ä|¯Fä³×8ô 4
<@qõÐ.MÁÈCøóÆY£°îÎè§ßBcJ\½!T’x¡amÆnjL‹ì‡½£uüA‚íy¬scj-éâÆz@}0çü2?+/æ‚N×0¤6'^ÏCjx	†.b£žw‹äÙ<:<|v!$úêá&ZÌíb¿MÈ¬F8˜‡½ÛuO{LÝæ^Ÿú
PLÉŽ‘ˆ¿,qÎ"’kšÈVü¸è9<èÐ¥<+tß££”°ð/ž4´0U<HŽŒ‹ÅïE|¿#½6‘‰œ>Ìh9ÎAŽ%dï¯BÆM…#~¹y3´¾ûÖzqáç;´”Ç‰¨L"
oÿoß¾u¼±6/ðKKº÷”ÜjäÄQ¶§ðÍQ¢
Rà›îáp/ÿMÜ”•iüÃ†9‹I‹üU˜è»0†‡°ÈH×ÈT(zE‡²Dh±1ni©nØÅÅÚîÇã€˜ñ¦V#ˆ )<ÖØ¬‘î{jéÊãM]ùïÝVêàH¸ 'ô®ªü›0v.Z}/øiª"tT&=¹‹§m´üF«¶òŸwñáÄŽc²ÐÆsÑÈ&è™}Z®Z ÀéÏHNV(\Ç›[Ï¨	~`í%p¡JEkHù’Íx¬@Ü³Ì|îÒèº¸Ë§š¨/0º+_Ê­V«’L›bŠ6ñšÁÚíNÇ2£°5Š“
®¤Ïà0Z¡iÏpt¦P‚ábP—«êy×„Õh³iB$ÞÜ¨e1b&%ŸêÐbÔ[¹røU.êŽ„ŽkV@D¼5YÚ‰Ç¼À+a àPo,/‹TÈ×†WäCQÙ›v#^±bùÆ‹3>‰U_2Ñ-b4,S
1U/(åñDlíý–aDØÎu.ZSþ.+aœ/ˆ;‰ËÛ $ÙÅ[ËÌvA`´I£Àbýþóöš-ÅvàÆaµ…¹ù.a*‘|»´$Ÿ,{5¨‘Î²{LŠ•¹ÙxÈEìÕtûŽuUwö¿¬~ÜÙ¸X=úp²·¹ÿ&å›!à
C…™ÝŒ¡¬ 6 Üâ†º…Š¤§QMb­ú6Ä!¿åG=—â/\˜Š+˜v/†äj’ø¥”Sˆ€K#.%‡Ö1/FØ1²O<XÐ0 u¡[>Dáh}“Å~‡:I{0cÞ´ßçüüO¡àwe2£AÛÙ0~GM÷wÍ|&s[œÇT¨P4ŽjÑ
	™Óóã÷ùß«ßsº×QÜÉöì¦4æè^"Uù`˜Ü¢“dvÜÝFcÖŒZÃ)lœÚ¢kþœaq÷ì¢
ÀAÂÙ‚¨0JÿÏ™ü*íßÍ~ÊäÚ‰Qü×0;4äßÌåy*h\^hè
½¾zÅ#´B,ÒJëÛÃU+ÇwkÐ]ä°ËçýNn-ÛŽ5>S[ó¼‘sAûñõì¬<éEFB~ã‰J¤oAyªËC×SûVÛ}ßÖAy·¶:'eýGòý¹œæC}8|_xÑûpÿý3¦²eû4âÑmÕ8íÁœ>¢	¾¯KÅ¨)ˆšc†ÏæmXHÁ Cr »‘ÀÅ•W*	ú´‡Fí6qÜ±“$ “Ž€éÒME
œÜÜãCJñV+ÙþnÄhéD“§±EÆ…ôÐ—c´ÑO37¾ÿB¬-úËŒë°dÀqô €YóÙzYVû{•^Ý¤Ç;11£Ùc`'n\½×Ÿ³+iklÖˆ²±ÌYìz -QU&ËŠý¹\½:³ Šè`púâ®éÅmSŠ T@ HÕX»Õ]í¤À
 Öj–fùrËì“!"f_ÖÒRi,zFÒË_õU‹ä±ÙÏF,FhcïKÔ÷vÇÒ•e ÁÜ"EÕöÌ> ÙlíX3Ñ\å"Œ~4M‹™VXîÛX­í„fKæ<lW`8®ç:Â?=0ŽÏ ë¸kÂ/Šj¨°¥%Hrô\wTÿðîÑíÊÏ×Ø˜Ñ°ÔÔÛƒ˜¶³5-¦Ñ}`€fXÞB~ãÇIlÍÔ
­¼^Õº ”´©IÃ}ù	rýÑ*€b²@‹3_Y×JÂiô.ŽT{µ9x¤‹ÑÐ@£@0A:"^™X¤¸¹¹ùOìuèqy:¾ÊF¬Û´\¥ÝË=ƒ=žxøÔØ:	Ø™©3ñÖ²cÊ—¡Ì1Cÿòô›7ô¨/Ý.=<l-XE[.|ÍÍg¼5­’tÇ¢ ªŽªâƒœøªT¯Ü`50ÃÀ×Zuo@«¸I
k€Õj´1ëø©‰OÔ¸Ö2Òš¯s”Ë¹ 9»Å<Nw…Ì]•yŒDôXÈúä•$¯_ØaßôÝ/ŠûÈ¡rË=¢îÜÀº[3;‹­ƒ×V’ç—„±#ÚÀRŽÀt,l‹Qh`{»AµßLÔ~S½ Y/;§EÖHuX7"ûyD0Ã1,šY‹Ý°ý'Ña­UŽ¤Zì±¨¦í~jcÊ¾f‡[mÖ¦÷t~ÝëkãWÊ(Äúi”ˆÇg„Í@ö¼‡¡„Cùyûgâö–ÄI‰ßíLY¾¨­'ÞÐ^Äó®=¤õ¢•¤ö*¤¿ì(5X™‘OŒë»ùí¾
Ÿ³_W8Øyxˆªèô­VFwåù}<\3m­¾Ü.Aªèi``òMT¶qVF“5=ŸìƒbÑ½ /¨E­Ìã È”\Díù‰ôQ[…šÅÞÊGÞÀÇ¥Å¼†r®Š:3«ÆC…qàã^ˆ:²{!—E AèÙ^ZO™ßqÐŒE¼ë ¢ðÎ=6r±Á£Éžrò¸uŠktCã±|3Kûwà=Ò¿îÿßú—†ÒR4`ç_Ñ¡æDRt¾ÿ Wc§yÎ(öÞ×@Ù„TgþÝîK;íHª„ò¥ÏT/ÜT¶«'1L¥0sQ“>ùð —> Bå4’n¥á[}0 "æ’YÜƒít+ÈKï :ò;Ð§Ø•#œ:Ñ%Á0> ª•ä§x,º‚Ìö…G~×çeàsé¶t5µª..) ¥ŠìÃ(¼ÂUµc2¿JÞ€. ûÛžûÞºOu¯šXÇ‡}ï–ÎÌ½ªÂÓ\ÙfO -NÏñµñ&¾ÐW¼ÛóÇñÁ~U({~UC]x§Þã{ºÓ‰a‡˜Ï¡obeÓ1ÙÁÇÉ ²Šúyþ‘î³Åi6QÛ4–|Ò„éöÜÝÂ·„ó¼æ9èum¶š‹Õˆ5Aß™Œ¼a­\$zŸnî³ë‰œk"–êtkÈnPp³ÛœÄ6!NÿÛxYGÚ“h¢Úp˜‰Prhï„Ù÷«¨µ’œ<‚Ò{„Ú&ôc*¸.ëgÂ¾+ÒÍ¿¸ß:žåâïÐQ¸Ç€Cd²‡(dAç;¬â ¥­MEA,®‚Ä›t¨Ï.3ºoV³ 2Ûq>Ò¦´ŠV'vc{vÖê[;øªnv²URE¥ =™Ø^/Âv9¤Ò©j¿o¨V€’lcàûó/yý
=Œ„Va&;±THuŒÑnÙfDc <ÈÖŒðÍ€b×dËF=ZS‚evv&ý®ÊÝ±²T/ºäx#ëšêQ×%Ô5¨ëè²”< U°eâpåøü´É¶%Fiîˆ£ŸÄÇ
Œé5!©…­NÛƒR„}¨64¶Ý÷	Úy¤ÓÓ6ÞÏ~ÕZ½Q('™jÛýpŠ7µdSÐ.83˜è–‡‡|”   ÀgÆö{w»hÒ±ãÞ”}Òó½;ÅÜ›.BÔÍH´’ì¥öÑ5ßdâ¡H”ö-e9~QŽÔä¥$Kz—4kë´óS>x˜þÒƒh½Ü$œ,ò¹bØn²êÝC½E’…¸)=~ów›0B¶MM92(ÓrÃÒø¾;!'B:³µ>¹ï?É®ÃÑ9¬¸éz°;ÉÏ'ÕTPÿlÂÞQúÏŽ–¨fãO¸À-
 Mú –©tzÖ'¦‹þ€g–@ÑjÓámc/BZ
g¡†Öx(­ñ0W#ÒóÎÇ°Ä±vÝ÷»$}àw_1úÊ=äña*Êáé¨ôí’ô&Å0ÂZ î”>.îbžÐŽžg©ŒódÝœðþ-‰¶1t Ä[ìr’oìBc«”c5ˆOÜ÷'3ØÏïü—ðË_á|ºt:k°R¾»ÿ1Ôãx×ý¥H(ø7Y4Î3Ô.öqgÕCb¥_îû_:#ý*òÑ/r©€NE[áŒJX@ñ§ù‰æ”¿ÃPJòùÕñ¬p:þ•ÉîÛ NcRÌÇ+·•%“–gkŒ`†tšO–©W—Í’ü°øàý|	¼yV¹Á	?H*­°ß¡7+ÀŽþeXy]«#´£Ç’Èkÿ„ÆU®A‰…Îëöùý©\GÞÐ€ÅÅ ®ˆÇYŒKoXŠ…uÒÇ.ýßä}ëzÚÈ²èÿõŠöŒG$Ž#GñÂ6±½’øš¬dÆÇ_" ¹L I›ïÛÏrí<É©ê‹Ô’Z€3™Ù³÷žo¤V_«««ª«««`ÿR©µç}`?Ë éÙ]Í{Õ`¾á@¾@~E`ÿaX&9fÁ¼‘uÄU¤|])Oæ7|¨.ÚK·a¤ä»c¼D<,²¡Bwˆ&HQ_LK†Ä³þ ×ÇA#cf;Ièû Ð!(à¸¦é¡ÅýbÀÌ‚ÐPûÛê)Ú;Å
ô—}’	;0™«Æä¶X.Õá¹¢Ø…5-fwÓg¸ãq´8™È—YQþ‹(ír6àÁÙ¨Œn6 ~¢V«årvŠ'§TÎq™¤A/K"À£fd§Ðµw›šÙù‹À~ÕøwóÐØ0®~==€‡“Sã²Ùx]|{ò¦	ÅnØÿ¤½±q Hø{¹ëEôª!Wû†ØµÂV‡e@GD’ìà÷ÛrìUuìr„Ád0N,±ízyÙx_{ÜæQÒ•!®h©ÂjgGi™-¾W"|‡“‰@qÄ1ž£^NÍ9O®@ºÄ­ùÐ˜·ÔUqê<´OšùRÐí†ë·ûl‡á…¸j†À,8ÁÎVY>#§-Æ•™¼ž<ÿ)¶½a 3ŒìøµÊ§RéÜãÀ¿€"ªT±EÃEÃ§žœ·zy3!ñ	×fv¾­fPUa]ÂÝR˜ZÑ‚ÓÑïL‡Gƒqqë'¦Ä0ö,Næ‘Á\ºÿºúS<¦8?ˆ‚Å`<í)u³]ƒ†\§qï¢ž¾z>ñQˆ„LÍ1nEö>½¾<µŸîØÛâC:H2‰iü¿ÿü¿†IøØ•)%¶BÌWhâ›ö'¦Õ`u([ëOPCÊ—”ý¸ )è0íîBætI¾zãX;Ÿ™&î#ßª‹éx„¾°Å%q`ÔI¯Kž•%²ÌH*4a0‚˜xÑ4ášºd{ÜÄ²S ÈGÑD,oYÜ,ßÀ*#Õ!›O¡‡¸´#)c-e¸™^G‰E‹Œå­¿‚-*Ü-É\ÙE¥Y‚ ù´´Õ¿€¡†:g0¼T_-NäôEíÉÙxxkqw,D	f®O:ôXÜÖ5gIÅL^·í4dÄ4„-c~&C RYr8ñØM¨"¿“WDÍk
ädó¦	d“ Œ'Ó0ZGÂyâöV€ý&ñÍ„Ø\üHqÐ6–;2AòÍðíy¬ÔÄÝY ×•Øw¶/ë%Ú²UÊ’Ô5:ã’Ò*öO‚ý‹ÏŒ‰_¬¡l€äY Ú¨Œ…4å%&x›•²øäõä*GfàMC<¤Pà,)v$ ;!V®ETÈ‚,ÇfsŠÈàk‘!ŸjñD=ÙÒCY(,?ÝØ˜õÞL1£‘æ£ò7 
õòÏç¬&AkL¦à½ð4rçÅ~±¶cà˜º°"L0žT1 qX¸Å[ù	FÊ05’Y¦Ó€3[(Ô8TôpM 7•ÓQJâ’JYæÍL	U•D9ê0-ÿ¬.—Yf& Ëº…ÔBÈ5‹–OvîWËW=nÂù Ñ³ºÇ`6ëFŽÜÃ;ý´¬ˆ=¬+E«ýARÒ0—…–Šá\êYƒ[ü¤¡Ì¤DÓmO•Í¬¦	Ù8Øå¤ ”+eøÎ â;Õ¬ÿ+‡dïžZw°;ëÑ+¿ÍOÈ|obS|@»‘¡íG§\¨bVO¤ðèÊ%^"øÊõ´3i2ÍœfuãÓ¬»¹]&·6^ýÍœ†±“.rêTke2s¶Ê;ò,>d@íþ\h÷ï¸ï•Séte¶àŠ_‘Þ”égNÎÓÍùâ47/˜šîÅy¬œ›í&*œ=þ"‹¾â¡€£œ§d@¡¢/É¯döEêõü¦@ÒÇ*–È»Ï¯/<Ë2ûâöÂã1‚dŸŒã³•qgÃ²šä‚œ“/ñ1Ë+Ç:/ž6«Ø!ëKq±ƒš(XpçPAñUÀÿ·š¤8 ùa@åÉPæDKž¢0[]Ä¡ÝfÉãÞZ»•@Bp‡ïUw8Q*w-€‡ÍRà·ÚuGh²ÁCË%Cr ¼ëHO»žÕ,Í`ÃÏ-ŒÉ9ŒÎ´.&ÔÑ,M|&Â‰hVL™<Ô•‡pÀªYâV 4òùW¦	o
|k|Û•Jè¨H1ª©„WÒow×hMÔüÅqŸ\WÎðÉ9Në¡õ…¼ÒŽ}@ùàáGÌ'aÊ¥1£½i»OSFðZˆœxï]í^&ùWœ¹w1`îïÓ­€üRÉ‚+[rÙ¶–qýÿAÐž8ká¿jÞå¨¶;þê¢_Ïsg«^2T«—w/ÄM¦sr!o0}Ù•Ëû‚y'æ>Ó,³Ú1ÙÉÆ«ÂÝ«'â#ÏCÃì^sŒ¶6Œ4›þt1u‡ƒðÖ1QqkÂg#“šÿÑeÿÉTtaaaC¤2¢ §óÍSÒ¢ND´(¹ÂwI³0ªbÔ¢H<F®Øó„:CúÄÅ,Ôñè“!<î¾*¡ÓnD JüM@­²Ùß`ì¡‡ö%ï._Ã
snþ>¡=“”žv©õ’)I?º}9^0Ò~Åf`Ò7KD4¹i5bóÏ`;³S7w€gÂ&|ê£²Xj;» M +O3g<	ê’Ýo.dMÇ5JèXÔˆÄtqÇOHòU¨b¹jL×È·q;W“í´²®¥)”’ðf=«$NK®ý-ŠÆ®×rì,Ñ %vU0=Æ9T:ñüÐ8ï{¡§(6ô:ãrž°ºLŸxšQÜ™‡¾ÛC½
ê¦ˆ™~Þ¿yÞÈ|ˆ‚ÍOîDvŒ>ü%:V!ð:ÛÖÔf¦’ÝšÑ<¿("KTlÛ‹Uzµ	 [K—v_Å«ê2¼Ò(îÒË$ª7ÂÇ«FV-!\7ÉÃž×7R¼WUä¦xìR©-äžO?Ý.&óORâ÷¾£:æÚÞz³±})ßÞ@möGùönbËç×Ô…Oøú™Æ~h©|gßÉ·æ¸YcØÌå|0jy0Aß†ba 84 3S«áÔ‡é`4ú¯ìpóLZ²R–ŒûfÛ¬—6I[ñ$=ÛŸØ#ÎŒÕv‡m&ágã	lÐ\(] F2qˆ‰…Oqù3€nµLŽ1æbÉJJë³Œ°‰ÚÒ˜Žç]ëœsÕQ7È–D5¡\Ý¥$ÑgL0_«‹TÕ\¿‰9*Ñç\Á“l¬ã}`’ÉTc³VNR]gÖ^Ó)2+U ¼¦Ä³R¯ã«@x\¤ç ;BNÁwÒÚñ¡VçG…:OÁ†7Ÿ²ãä
žX%”º¯]1Ñé¶©q pp”œ>b¨X>¬{¾9ÃÝŠ5\?¥Ò°<1"ÿðm-eY`üí+¤Y,U
Çz“ª'™”¢ÑèQòÓKœýØ8›†™u}æÒ5÷>jÝM2BrS_wn›5Äg
ÈZ.•+RG?ŽuôM„”â>º™ÔÖ' Æ–O`†ˆóce¤ÀˆÐCë£ª†/¼äP·@U g>è<O™ÕÁØª‘æ“ÿ&³z’‘»¥XmåŠÌ¨¤ÕƒÜï=l»6¯Ð‰£m˜«Ž•éRŠ³y`à°ÆaÉˆù³y#uzËÅ¬X¬ÏœñÃ‡ˆø.„Ñ˜‡“‰„üÊ4ÿxn´\+¨òcŒ¥šø¥²«ÉõªÖŠñœ¤ÆS×‡!Kî1?Ë+×[¶žjOkF‘Q¼‹ÌÕ¬Èžca„% bVÇê²!\dÜ0x»:F¾…¸ôv¾;ý»Ap6
˜6Ý™àu~"ƒ·a†ÃæØ÷†Cæ‹hcÐî{Þð VFŸ´ƒªN°²9i‘ÓÈCTòæYûÎEVm©:\ÛUnHð›¼½}ô€Æ«ñåò~¹\huìmˆyZÀoELÙUÔàS|tâK‡ê‰cqGâXÜ‘8w$…Âî¾8ÉDVfP­}y³á`ÕÍYÙ]½¬”‘üÄ&™âCÁB}iÈôÌåzp¨×F„z¥& 5søpöŒ·ŒCk¿è4*`„,©‰ÄÒŒÔ°Å ÒÎN¨5Wªõ’:Ã™}(Ð?ÜñÛ7¯É~®3§ÝýèFÊÓ§â¿çýp4|½bu;j$1¦òg¼æ¶Z¿Æ9ŒÌã¥¼FÛíÐÑ m\Ò6%î0°üÂâù&/š¬Ž	»É4Ãøç`Ä4ShýÒÃI`on2Ï ¥žçõ†Ô`o´Ù‚ê^×†·Î	®W{bò?í¥ÜÊ±”bwþž•Ëâj•ÌÜÉ/…Ýt³èÐÕ¸K¥[íFÈ3tÊ´M4`[èã.Ë¨”G£ô×Eêý11Û-ÚÅ¿ðÄœw@ÅçEh	ïÓDº&o¾›)Ž~˜4dÔ•CÂ6~a°ø…à‰ í+xß-Ûu~âÈ†ˆJžlÑÇø2 1óµ}= Í@ei>h4…'n§ÃÆ«ùVœÑÖçtÅúPt;Èumt¤ÑGKÜ±f>¾§TÐ%Y	»„s”i†ïÑ nåŸuŸ—dH7×¯£_…¿-ø«c8ÃN…U¦hêuó1zKDvúx3=¦>ÿp'ì“†ƒTÏ9à®h®È‰Ùî<³‰*Šl5CE*þÔ° K˜ñýª«n—·k4böŸmrY‹@ºSí•3ím¯hO"óÖÖ–¦¡ [)™a|ª¡mýÀDïq7.:³øGv24ð®¨±ïÍ5Ó2€O¸Ü58Æi|mÐÉY‰‚ìèq
Î•z6S¬Sx¿ôÎ„ÓfrÓnl¤gøofkÚidõ¡ÌavÑçÀdÝI7Â“å€"Âì¡ùS^µšI{–™³§k"G­VÛMõpÉˆØNu%bî¬h;"ùb‚’³­,ÞfñÂ‰K=ñÒÌX\ÕÕàŸÏ2…¸¦ÁBiÐ `YT<¼Ñi’m¸xYi%¦‰æ%qÊTœÄŒÌçhgÍýüÙBi$N_²ù˜%ˆß
ÎVéÖ»Ï4™Ö\œ©ÙEÍÄ’¼­îJ>A·LŽ|ô[1A©×ù-x ; @Ïxî$@/Xâi%±ÊŒ$Ý½°OŒ°ó#hgMX«|èìd{¬ëm„qEI‰h•îtËKE?qÚÃN)¶ìKŠ˜¤£®™¥k1î4q¢•ÚÔÿ _”JäÑ+Ö–sþPÚ“ à‰:‘L,©ZýglYaçÛy°X¤rÚ=¶[YÊ®TJ`ˆ³‹¥µú^Z˜Ì²ï´ÈUÕ0¾ç›™-åóÍô>ö9n¢R;ÑÎà«ÁôWŽ™üÍôþO-SBéôÎ¶í&aºhäÍ™ù—I:sÎn<õÎ3ù¢j…Û,–i‡Ð™b ;ÜÂ&žÿŸÍì¸žo&Á	ðV	Ÿ
d?ãí¹À†Ånþ™+j®Õè²«÷ÞM) ŠgY3²v³H•ÄÕc¿‚LÍ]0÷<ôÀM\ŸZûyù
6©T¿Ï¦œ5I[ŽËƒÑÁØV1FgÊ]å¤nQ®o"£œÇWÓÖ2µÈŒýúYùkÿ&u™2XÏ0&×$¦úP“˜?r²·ÎÍ–Y±RÆS£òÒ;³ÛIòƒÏ¾/¥•Gµ‘-±ì©jÎ9†=½Ö'f¬n‚½…ú¸Â
žäÖº´ßÉÞ"XC¯g®>bÉ¹N«›ìè\Až$LÓÇ~º{¹ñ‰‰2­‰³™øTÎurÅ ´öT‘ÙýÚ×0­“©bÚCÌsæÓÓ8?|iêì˜äøhòB`Uo‡”°ÈÉ˜&©' 8’´5|¾GÐÖûâ°5M¹&ÅC5…Ê%Uè¦ÀU‡É)Ñ5 2žF&ñÁ|d»¥œæäœpEF8o/¹ÒÓŒ”ž±¶ÓáÈM”JTS‰|:Ã÷ ²2ÑåC”ºt.)‹CÕÆ£¼òÞÇx4"vã—
™W>ô@…,‰'¢_IyqˆTR‰%Úl\ž6/¹2Î›—o§ÍÓ·Fã qØ|sr`\6Î.c¢°t™Fš'ÅÎo-‚,µCëgÆ5¼ÖíœX£“³ÒÏ°ìf¬“Q
ûªk¢âZ0ùƒ½}É¼wwU?IIß°øcßßá8~YÜãÕFíâ(Ôs…?‰.O×ž`ÞØ[bÃà‡XÉâU4 ûMÃ¾c–ZX9ÿU]¾¢óïêh@çk<j²«•¼8ðã³¬¹ã—h\GÊ}ñ¼„èÏRÜpý[ãŠmhŒáÍW^‹µ¬ÖÒºZðŽxaìR!v<óçÌ8ké»&]DªÓr¨§K‡zZêÑqãkïÏâ—hç’wWµXê®sUXµÆB74eé¯%%ß±?ã“Eˆò\ë..3ï*]fµ öÜÜ°ãNZªHÇ”öal}q¹pfä£s©¸>c¦*ÍÈÿ ÕtøMÒ 5[Íëw¥A'
T²w]!U²Ej¸õQô€ÆêÂ;Hqû…)ñ(™ÐÈyÝÉõETÅùÆ†ÿ½r¬/Î93oéø½çN7ý¥ÀÐ3=z%€ÏŒ4^”1†‘Õ¢z#;/M@F'Pã6}ë™*Ñ®ÎÕTŠw®°Ò`:1sü·ÀVÒE¯rªjªô°640iÎÝQ*¿'êÁkó<	á4YRb"K`tÀ‹G•wGì”ñæ\y¥Ã²äÒš7”C µïÈh]ƒ	$£,b×À·û\wi&u—ê.áP(‘rä°d¥\1ùšó£¦3±Ý=2NX§N:KäPâ7½7ä± Æó]»×Ëó®—÷`óCÇÊ%óCÝ%óCvþæu?ÜB‘\í;ÓB=DtÖñuj!Ñ¤™+è¬]MÝ¨•V»Æ5hÔÖð©(ÌˆÕ[_VKM)q1Åð‡·Æ¥&ýÙ,m¹RM¶ü­åZG=YÇ%…Yü¤Õ°$«ÛIÖVIwciîêƒro=(w-»&CT'ÆõQÃç“C—‰e*Ÿf<è	)@º$“ZíííD×€û³õÖ‰Í 9ÕÅpYžo`Œpƒã»qÈUbw5ìL,xÝà=q'ÖyG*è(04eJU¦\È”-™r.Sj2å‹s}BØ¥ý›¤ãÏåAo F/Ê{Š©÷—’O;Ó6µ,&0ÿÊ…MY `Gê†’²ŽŸ8¯€o=y²Ï::­,…½Kxùeä×èí‰mšyß›ð½¹äû|¿Xòý¾Ÿk¾+š;©AVú`Ø{µn©½zá<­ïq`Tg«Ú­vU¤bUóLç,ži‹`&kðfAPÎC•ø˜âl$f@Rãèèû@ nw§ëvÛY]jEÔ3+‚ìè®¦Fç½—òFU’} tjcðá§G×™p€£zÄS0öxsLëÔ’í*Ÿƒt]«¦DŸ?=;k]”ðkIpÑaö:§2ñáuâhÃG)^³Kì«õ¥ƒAoev°¬ 6nªÑù:€vno)ÆÇðWéC~Àð •0ÞúSÊ[x>ÐàðÏ­‰Ð0(üÁ¸=˜¸C`Ó—®^`!bwƒÙ%Èk¤„`oñâ» ˆX|…§æ3|U9ûöžâo—Ë	†tö¶io‘íÀÿ®Ü ßb-Aâ˜sÔÙTžûp*| Ê»<ÍÇªó²lmæú¼(ÁÂ‰M¥ï¸Üþ—‰åóKº…ö"Ü\È³é°$û»%ÓÓçÝ%•Ž]Bá+C|E]Ä0(%¼ó€óÞÛâV½ÃœÀàaI”ÂÀØÞÂq§Ôâ›2"~2HWŽïŽeûÑs¼ëZ.~¼ÂÞË”oJe®lÁ[;]äß—”øï¬;È¥éž³Ää±“¥×Õ("Æ™sÞ7`nN¿Q ÷‹£½Y3h»úïí{sè?8‡*Åq¹íÅiM#?ÚC"mqÚ„K§°µµ,Ä‹ÈÚà­L‰×í4´»dâÞ¢IÆ»ñàËþ­='2ø²Ý"èÇèáÀ¥S2è[y-{«cÏšÁÂªcnCÐ=7»D„:“>R3û„À—zÔ·/‰ˆÖÆÂ,Û	3ìÚÇÄ¶BÎ˜¼sŽ†ºƒÑÜ>:Ž9f»+sOØù‚Yö2Ï;kra^²íFõ“Æ‰®œà,‘ëwä\«&9¹)ì2mŽóî„€8òXmhâ0š,^üÂ—WüjáXÔi¹Ö)Hs¿Sø%çPéI¡Pó66h¤Ø³@3¢ÄU¢zV.»‰WÑ‡ýd‰!u¨'r>c'Ô±|'ØÛ{·îÇ­ûJïú€’ßnœÓµ®‡¨`º)3çãI!ÜÌ½µyþÝÞ7jaKW”œ‘/•éƒs¼·çQ$)x+÷÷MùpÎæ.XèÈÒ½½7ÿÚÐû{ëÈyó¯ill	AD×#g}:’ò1Žö”òÛ±ÒG?$–úƒôQùþ~,}ë3k€ÇœÜÂÚâÝ¤Ô9ŠäjÒ Î»Yð?LÀ&tAîÄB°ã^ö™D—‰D9ßm2ò!µ¯ð[›Ðl¾voç.€Î}¥Nš`øç@cþÀòÖ­ã¸É^aÀ+1 J•Õþ°ÕýUô°™^çxª¸‚ô3 ±›XÀnìßXãlu¿ô½pªI`?zt¼ ³o\¯Ac£¤4ˆ^–^‚ì‰<RòåG‘×g}¥ä"öÆFºä—c nD~Bàùá`ÂÂÜ° \ç)øÄ³=à³ºH„ŒzYµãÃ$¾3ÄŸ±3d¤ pö§üˆÃhøëWxgÑhnƒ	KóÂücK¸‰"·<ño!1ô&„s–Î¹ðžx€ï	fÊ²Þ¼'Ÿ “p¥ÍÎœÄ¹äV<ydsœ€WÙ•M	^s|?ûoíÏ DßóßÐäoøo\\ð õ9hG	­…Sçõ>CÒÓ„µø/«ILÖ°I\¾HöŸnù'?1›71C~§øÃŠßv!C œ $»qÍ\À÷(¡çßßŸ¼¢ärÅý×ç;„|wq¦s¼ß [µ‹„0Hì§õè:u)wÔ‚E”èarÔ8væèšUÄ\£ß°;6l{/B}Ž!ƒöñÞÜÞ/±çEAÐU1C@£Iò÷ö"=^ã½Ge»dlËjø¾{‹QÙð—EX1—ßúÞ¶X¾¬œÑšò€ (Bñ„ÎkSÆ½ƒnhÞ˜E+Ý.PßK·wdd3 ;È‚ìÓÚØhI8G^{Cl¦BìÝ^Ëž=bïò v [†V\'Zh °>:'Qä®4é:ì“»oœ¹%þ° éLf/sj ¢NÛ¨Ùî¸ˆ~ÿÍlÉßq 7¨P8žMÜ6žáò$ñF°À4áß[ä I‹)Øû˜É¿]2Í}†æ~káDºut6Sä£Z$³.5Þªä´Í"ÈEÄ²ÔÕõR[Wºššd€×ócàô#¼&=ybýiïÂ>×eòÁ¯@©ÊT¤ŒÒ_'Òé„j·méþþVFF‡sÏáõ`LðÕ”bíÛ4óã¢aã¡¦ôwÎ*Y¦¸?xen	zîlqÍ`Cœ£‡Ñ‡÷ÿ¢êÜ©Gö?Ä³Ñ+"_	u_hˆŽ`avµä3jûÝ©˜UøÛ‚¿üÕMØ¯§O$ÿ¼–’Ç”švªËÛ©æµuË#HQ«]Žj°Ë2 ìÙÝ(`tÖq‡‹n™;…w,29ÚSJw	>‰Ïk e:èIß0aì„Òu®ÍMÑGüoá§1íMÑ´Ç¼¢“²1ÏÚ¡ÇŸN½¯2ñ¶åã¿0°‰Å_Ò–/ß Ê`0dï·æñR®nÓ¡'÷®oìñž/ý®ó¢«=±è`0¸kŸ¹$¦+³y÷÷žê’€\{ÒG­µPiïœR?E¦°õgZ~Öî¨G¿P6ø]2‡Ân‰‰ˆg]«[(Æ/ó‚hJÆ‘Ö<ì:w‹8Ú¡ÒºQÁk-kNZ2jç©8²ÛzáììÁã–iÃc7;àMt¯Oo`Ë„?ººÀî bŽj¬nÁ†ÉzçQ?ZŽ5g§Þ÷÷P= »éÂn÷ºÅklÉ[7q˜²¹ Êý=Kç-‰4hïŒ§”>ÓÛ À“h¸{=—€l¨²¥wcÇœ¤± 76ôca5o´ À~úé®µøˆù>ÁØg7PªãÞØÑ…iº8/]§Læð×Š­ ÔÁ·|¬10XygG&Ì¢žî;Ì ï9pÂë}˜‚:s7‚Zœ2q[üa±Û}â”Ä2Çþ´ž8V˜ßG…»²ð;êYZæ×£AÚ7r÷õöÐãü¸PÚ›IÃdîÕF˜-sç€h•³¾#Gå,oå²9&oe$|ÑZ	ÏiÑiúW£æ£á8°Mô°aonÎf³Òl«äù½Íj¹\ÞdyÄçV5vA‡ÏrCl–²Q­Áÿ&§lSºAô½Ï¨”æîIØ¡ŽLåêNd2üwÛ€(Ç‚(©¿{èJL$+ÃNÛˆÂ~Š’ôçZçÿtÆÚ±Í7ÕŠ±Sªÿ»îVª=/«ÅêqâÝ¨~­Ôâø­ö·Õ›qu•mÈ\ÓÛÉý4‚^T+Åz±®ÿŒµVŒ¼Ïo¶ŒJ¹_Ù‘úîÈl\ç(6ºN{èÊõ¿²c3@—jÊ\ì(!=©¡t÷LRögÁH\BJ¢]›oûÔhD]ª÷Ûîxì±PzâÞ%zL\Çk{òZÎ=F\ïzS_d/ó(–:µcIz%ûÊ³H¥fI½Æ‘?Ø(4‡ð“;
aÆ@Î÷º˜8úRÌÌ®¶CãÖ›úF£3Œ1nÊDœ·•„
Rf® ©ž”snUln—Ù5Œ8Î_tûƒßÖX‡4­Žð8¶³Î·UqÌô¾‘å=¼ÌEªQ×ãùÉtÌ æ:Ÿ4¡Í–:Ä».—ªtÄ°Es%ï_oEFã†î`˜\òªÕQ6pQò®½.„áSM°Æ5ì•–ÝZî:74TÂÆG½Õ’±pØýsey|›õ¨`Ã«²è"ÄL‰c±D"äÛx¬Š!Aûº{#õ1ÚNÈød)‚ªxLÝNŒÊ¼ –û›n!e–•¬\kþ”KQc@çº#_²·*d·@Pl\	@+|ž`.kBÀMÎÙSµƒóR0m\$-“-}Aœ£<Ø]|*,\ºöÔÚ0f9®ÀÏL¹‚¡ ¹Ä¸+îŸ>(”þ¦kzÆõQ²f# ƒºžÜ<KÝå¢ðƒf•))ÑÛ`òÒ´¶9ótÖìåRÏ¼1Hº¸7Ñ‚=‚‚#l·0¿É\yâí¤)]Ò[­8M.iñjÁ5Ÿª5Ç^laGC“©¥ÔELQÊ$‘;ÀYÒÑ-Zr'ÝÈVÊ	ÈbÄ¤Ä£KÃR‰>WÑ‡¢K˜C»¿ÄZ\rí—2H ï¹Í=—ÆS«ËÖ)Í’6,S	üå$ó¨¶æèFë;WÐêõ³4Ü›¾;k¯¾õe‹à“©ãwF=°µd*È{ôçÌ_Z_*”00éïVXHº·ÁwqÀÌíVrn³h#5½å\Îø]ó·•š¿eK11L‡²–á µ:'ØÜû$éxy³^^Ç%û:Û”LöT•šâ}¿öcTåaÊôÀÛ¿Í…ÿ9ZçCŽ[þëÃêÔœIÄ0Þ
ÿ|‹¿Û&™WÅ;ÿ]šGfg.Ü±DFýðÀ˜1í×ˆ‚Û€m'=´<¯ïûÞxðY~à=XFM`‹†|¢c@ZžV€•(E¢ÛB1Eë}ÓúgžÔ`¨?á—‰õ÷Hìï7úgÝwÐ’yäy0¿ÓÁ!˜%WŽvd’ÛŒrqšù{—b°8ÈwÜ«£/éùD¤` ¼.™'[zèPôQE: FŸ”øÊ®œû³á÷0É§hšàãØý:èqƒxC—ÌWÂ²a+ (&[é»ýimM{04æ3‹›QÇO)í'£‰+¨¡…Oh˜ÙÜáËhtl3²ŸÇà3í¼ñVl×‚ÞiÁ[Ç~T&³þíeôÎkÃ x™™»$3®²_µÓæuÌ;väµÉhZæ¡ÙÂÓœGað…9ÍFOÙÂÅõ·‘5až±Í.Œ¸Åö~iŠá'%:a`ö<,f{Ìù4÷d}‘ãÉºÝ§\+ «3è/Ès&¹ˆÝX·¹ëE“ù±öIÐ;|"<&üß£G~áî0Æ×aÞ0È.–“ŽÍ^ÙÊaTÀ/	ž¸>× úx;ò¦Éò\ÂÈ Z,Ÿ]$
ì‘e!Ùì.3½‘èmÏ?î4B»× èœ|dËŒ(>³Ø„}d³àŠÅÌd‹n­‚0ìIGƒ0TaÌ€K.ë‚˜Ìm¶I>Éo›?Ý±‘£`%Á(ÀÖ0×fsÞ¦Ã!“ÿÅbE|<?<÷€9ÜwÎõ¶SXß™M$@ë0mAx.I-¢Lïæ^lã¬ˆ¯2»BL¢WÌÐÚ¸šÀ 6Ï•²$7Q‰†HÀÎ ÕðGÂu‰( éQT@.afåþRÌkåéUTâŒ'l8ðúÊútCN$„‹J¼Æ7ƒ&ªY!mñxyšÚsã×™ã§H`T”ßUD#EHÝT2È‚‚PF.ù»!¬iT Å„4Ê}%m¾¡ã©Ñ`v”Q‰˜ØF%ðôÛài¶—4@}EÝÄMrÃÑ(š¼pÉ­ø¬ó³òº ³ÂÉt+ÿ+¹Œ˜»CûNè~lb…ç³8­² @ÃD&­›¤l((ÕëÚvVå­œSä÷ˆ,IéYÜ¢c$ME–
‹Ç›îl¦¼.ÔZÂpÓGŠIßm™Ðly^Ö¸“£B	]fí Ç€íu´¥Œüh¡òG¼µipEÛaEc€Î±/WqÀ¹d„Ø»'à	üïgÅR6}l=Wmºƒ>™`©fâîÏëÆÕ•±Oañ6Qé“ôüôhV©ƒÌïÜíPbœ>ŸžÏô1#¯‚Ò	ž‹9@M=Ów\TQ+‰<àÖ¹mÓå?õ‹X4õäQv6Þ÷OwÍçÎxÏTÕJx%.Ây<äX|Zfê{m·lù¡!£Hb±Ÿ6¾8ê9Ù€§
Ò'ó~ùQ
G^Çf6¹“ˆË¤ÛdsŸŽO™OG«¶6,joTùÛÃ ÙêŒó-Ð©ÞRë…š+(Sq%c…ŸtÓ«öÎ¦?LpÄONVŸÌªÇÐ9Ê=~å™)–%"J%±e´ÝG—KáUY¶s)¼2Ì‰³•	”à.€u.j°QŒQCÓfÛ)¶Á3k\öYÍNz²j§±¶“°6¨i ŽN3×8Žx)·-°+£À;kÏ#½­8ü¯fV!uñ&F9/4j³¿zS£ï3v‡hx+¥|{ØI{rî™ó¾’ê¸(ï)Æ–ƒ­å ½p±2xTï€Œ@©Gº@rZÂÂ4c’WÕPvÑ¡GÆOeö0;å"r'â*Ázî\þ[àqÜU[Çè»dÜŽ;š f¡RMc{O‹î´þi”Ë
·‚×Õ5;fêÆ•Ä­¿·ßöÝñgDI†ºèar€—{Ù#¯.+ÂG„Ñ¿"GZ„Ù  Ù§Ã‰1ŒÖê6\\8ï4Ú‹±ðÆÔ­7–·n#Õ*M†õ|üÜQ£^P[Šàžª=ÈõØqœJ´WY"ºÏóö¹Äe3ÛkÉ®“VÌŸ4Ñ¾GCð•ƒ:yþ|S˜#=hÄÂïpå›±'†Ex¡šá1 JS#Õ)'‚Ñ<—Ìå’‡.,ë»„X§­,µ•0Tä"õ0`ý qÃ^£|ÞŠÎ€b¿¾Iï¹­¡xŸšÏf‰U¹dèx½ÄÀ>0Ž´_cXˆ‹H¾]#°èÔ:ÇÐw rœ“ë&ž:ÝàõIuµ|b¾ŽÓÎ‹“"“Ž‹ºkˆ*ae]ì¥vXÉxÆÛI»>Vì`3gÎÚP¦Éz·òBœ‚|CîbA.¸¨NX‡…ØN$TÿW‘„—ªÔxËIö¥
W,J;#RuÇXÈ,Y€ØC ¯XE
Rë¡bŒ:vüZÍìüOÒdbå1ÇÕÄ–ÇE´<]ˆ§Ô2Y­ÚH¾LR‹'¶<ûé®+Z‚µ“Y-	ÉDEîg|/šÙèÈe´lÕÄk+^êBÉ÷X©õhþúö	7Þýôæ{u8ã$ô0ëé©‹ºSl>X=èí->éd:|5q¤ºµÈ¡[
ÕØù›RvZb4Çm˜;˜••èÃHÆ±/ü DÝ³;¾…Úý1ÞŠ3:ƒnwÐ1o@ƒ’¹ÂBà$XÁÈµ†%ÑãóÎ¬W‹©y3liP	u”Ö´(+ã‘R°·ÌsO¤-KD³xT&*iMÙ¤òT!•ò¶©!‘@¨ÓE
Å 9ô¤ñ§»VITK¬¹—T2'&áÙŸ'O$ÈtâW˜xcÁD2ßt’Ô êò’c‰.º{$ù’fe-èŒqW o†rT®úƒ‚@]h[+¶JÉcõØ±™D€Ôé{3atˆH1ÂˆûÐm€°É³¶ø.!‰À1vÓêÅ’¶ŠŒEè¹j64Ll|XÕ["¢9ÿœó´‘"‚ØggU±¡IrÓœ2RKiHÖ$PYâñ·ÃqÖj(ö
þ$_±*iöÚ*åXcäbTžõFµ4"#¶”šò¿ SŽÉ•ñ†ÈTƒRRûnˆº“¡1€…Á=²¯‹Oÿ%ÙÀÀv¿!ÌlÖD‘¬UN.vhxþg#FX=^ V·P¿t4OÂýS@éžêhQŠ¥µÿUb©´ëªÿ*”rWÄaß›öúa€ª¬Xß©hº~°8ú_º–ß#ñé±“¡ÚÈÂ½eÃ¬YÌ%ï¾²xc›ºµÖìzì^ðèuYtbuæ-áïããÿ5œyÊs0íõP‰Ã, –M“jË˜;S	ƒÇÿY“õ÷Ýç½g‘pÉEö¥‚Ì ¡÷ðrò_¹ÍSÑ!¶wýá½Y)ª<Úê©±öÄL¨I?t»'+®>h¿·-0&ºpA‰ ækŠ^³’j¼œKÎ·Ö¶RúÊ$=ø öýíQ‰›&%0ñ‹.76¡ÆpÉþ†³—äŠa–`h¯©çÙ¨­±Ç/*{5.V
6Mžq°·W-ÀèÈWgn]§Ô……Ì=óg§¨{æõaì«r×j¥;Z‡Ÿ×pLO`LÇV³° A€û 5ÀJG¸õ}–yñ=5QämâzYÁØFz)=ß¢Þ¿¶“vx°—4eˆdoßÃ;öÖv9i» £öÚìºììÊf™àq«ÍnÒ ·¹M3tQ`3UßPå£(ðïºš˜vC NxmÏäGïêQ2ÐH€´ö{fzYqÏmÓ7Žp²¢ÃÛ!Fc©š{”£ÐÕ4˜P1n}oÄƒdÓ€YtÑ¼ÕªôDŒ«éhÄ¯æœ3>$¡’Ø§]êã7ž(p~åµa«c¼§Ã.d3±=oÂ¢bž¡™š6¶]Ýê>.¢¹Îh|,Íy{8åÏqg·Ì=õƒèø{î…šŸø0L[ÝÉö1jlÙ@Ã¾Oa¤[|¤Ðµ¡brfóQèho	kõ =—±#9Ú¹âÁ9ì±pkû–ú#;ˆ?Gµ.wÌÐ^ÞöbÿáÌbÝ¢c:æ)­½nÏ—@„s)t¯Çü“ë)é&®¿Xnò6©[BÏg]~K²Àbj“ë9i­(GPâe²«]«»^s­5ê'®t‹ìF’Ä-.ãÌiVßbáß(pŒ–³"§ILÀ)¢-ìŽ\ë¬P¼[xw}(ÑÑ$¼•õ90Âyp]¾)¡½¾UØ=Jôc£k%S
äˆ…ÙØhYü©°XJübÊá +s3¥K…/qÑ­Ãƒp¤;@ÞJl“|ÀÕ½ ×9 ;é¥Ï~]%:Õ»(;s"/vÞ5dÀ¶#ÇjP‡Ö‡Bêºrƒ–@‚ó¤àÉ/5á
?ô=µ:ÆHI÷÷êæ¤I‹ø*/?˜@Aö^×>£¸sT´Nx7Ž"Ì”¦BÉ70h‡øz7BÃµ³ô°ŽÄgËBè<5¦#K_{3ê¸,ê=vkBFÜ¥?®N^ÖŠW¤ÎpÞýôñ–šæ§œ„aøä«œ”3çúfpÈb~÷0¼Û)}^‡ž<‘(Þ§ŽîÝ‚¾¶“j/‹¶÷¡ù„Låú°	])¸Ô±¾R†LÑCª‡‰Ãõ“NnPVy2ñk„d#
XÊâN©€ÌgJæ”„”ìSòRÂ¦	z	ûðÂßþ>SgJõA?Óë1F5Lô¤×A:-¤ËFµŸüï%–DÚfäŸÓÜØÓÔ¤…eÀ_«O1B KïïYìÏ3îºð”FnxÏâ0Kg60@ž6Fe Ðc²ÿ¢ÐŠ‹?V4ñß•VŒìo‚NªC§¥±52-mà¿1*-×_ˆH	Ì9ÔaÎQ„.1*d¦)'ÆéQ„l²?HÀS	ø¯”œRÒ§€Rj(#R êa Dšñ¯zˆŸj Þ§y]t¬%TT)¨6T%è´îïO»14ÉÀóÒ™EôÎ@Z”…•ÕòÄ’` è@»„å.0J¯?°VXr|töÿxGVP¿µ;sìüñÎ,]?kwã(Dóký¶6^ÿ–ÄëwÎñ“1%'Îß»œ©>¢…pË,;ì2	ÝÏÔàa‚{Ù<tY¨8‘‚1óPR&£	ær;_àxY£LZtÜîc<Oþ
ëeŒ»TöÒáû{þ‚
Ýt¿öÞ¿ç¿çoùïE~}oØ×7±ê>8gL=þR.ÌvHÎCr’Ã¸!ù Ï>yå“ßáÕ'è”ß'ßBrDI3$³ì‡¢¦oÔB5¸`ªaò¬sØ”·CçeÎ*n‡ÚU|â*¾¿ÇWPe]…ÎñRiî*”Tóþþú†»„Î1½ƒ; k°ÚYm+Púp½Âˆ4~€Ê]VõRuC=ÿ3g(u×ùÊw¬+eW~NÀmÿºÂë<¹ùï¬9Øý»è+ôŠ:á““ðÉ¹\Q´r˜e6£ö7Jf3á>t˜1/~¶e¹¾óæl–¾Ï±f³ó ²öCmÖ~Xš"ß{Ìçë«ôýÒŒç›„¢'žeO¾±ê'aªØ·PéÉ$d=9¢Ú¬GTöd²ž4õU6CÙ“@öäú „	½!`Í½îŸSòÅå¯ð‘5<c†nªÂY‚/.kx_Ÿo?jXØ9‰É)‰wüÄœgDØ&÷Ý€i± M<.`£‹›c±sFÂð2úÈô2ÄîòRùâf0.fAæüº4gyc#‘ð\)yŠb ˆ»ºIéãJ¹4¬/ÒŽ"vùÅ± O¾©5aàZ
D•ÅWé¢ŒB`™LñŸ&þóÅß£È{:#ƒ=Ktj÷éYyÏ1ÙÆçòÞH>?­ïMåóv}¯‰ÏÖ7&„)ÀÛØøRÃ3_1±œä@L]ž_ }”E~ˆŒK²2É·(•Œ¶‚s}¥	Öò.ê"æåÒ$÷Q•}M©Ê¿š4f` ˜s6§‚……Tð0Õû°XfJp=±NK¨­)kþÀD²öÆ×Ëæäš–—?F¹Ï5¹]¦Êe¿Q¾/©|c)CŽÆ²¸§ÍÀjcÃòä¯D1©Î#v)I"¿öóžå%IÇµ÷÷ÙŠ¿ íwÞ«û{S(È¸ÕþþF2zN—‡…•åtSäzL<âÞ`€ê•…¹NVš51ÄáT×dZÕ«C!ÎÒ?ÙÂø‡ûñÛ˜¡|³÷*v¹ ©u¶ž´è“+údHác!
¥û£FIœ90ÚLEJ,˜ÝñÛ7¯aôéù£Ã³ƒ·¿ž7~8¾øÇsùý|ñÃxÂ!}¡*¢îÇ(?ÝyÜlxQè!-X<ßä¥°ü¯§bHŸ€†Ž9»ÅÓØdŸX$Z|2ŒF¬Î©?´~A~½¹‰ÇŠA©çy½!u'ƒ ÔöF›í ¨îuÝÑ`xë0ïHö¬×ÿY+—wëð·Oáoþž•Ë3œ`æN~)ìòÆ&nwìÙ0Ø!œÑ¨CwÜa±wÅ×6vF#cþÄ/ÿ¼`ÿ>&Æc»E»HÏàÉí"dÍ-o^„Ú‘®D¶yÞ\-Ž^†£ìì•Ì6~acû…8)1wáÝ]5;ïüÎd.SyŒ^ãHË¤87¤w»Ýôð¢Œ"†¶’RœÑÖçAXÄ{Ü!÷ÐQt;xÄn \ÀzÄ'Î‡Q-kçå0(ñ"cî©Ñ Îûs¦ÃúÂPë`ÿl>Ì,3ÞE™Æƒá¾ïb”+~‹[2oêÚ}~£ÖÙ­mÞf‘¦Ò?"Pj>r\È­™¡;çÎÍC"S	‹s6Ø·ìÖz\,¾þÏÄø™§ùhÀì­+Å›Â|1_#Ùf”Û.Õ's56yÌl(ü“â¹pw#Xˆ•ÓÑ8M+“œÞ;Q7"¸UXý•lo¹“W™SV	Pe³	‹Í§îç"&äà\Œ/#¹@o ~›vø´F¿?Ûn!ã‡6£ÃØÀð&á`„§ßŠnfÍŠÛÿ}ÊþÝaÿVªü§Æ~ªeøAË¼YñºRCÓ<|g®®+ÛÌT/µr¦„ÕÁsèPmÇèÒÀØ­SoâÔ! £À€^×hO9òxÝn4ÌÐŸb„@@"Cö-CŠÌôBÙNI§6¶<t€ðËæa†$qÆöp0Y1—ÈYaŽ6Œ7Àq:Ìò—éJÜ¥[±ÏóÝ©¹,ºÁMU’‹Hvz#ÀÈê$A»SõMÐí}‘ñ½$EçëåYL¢YêŒ{Ÿ5¶c:=d~ôøˆ‹Ä·(Q}`Çvji²_{Z¯o?Ë’‰²½—t]Ûÿ~µÔ¡“0h]©Â³ü!”q?xånåiÕÕ¢¶jXD0gùƒ¨¯ÄÚý¬ÐJ«ÖÊa§
r–PBÖ¯Hœ }¼!ˆŒz†]”Muwºn·½ŒÑlCUŠB^å‹ˆlv½[&²»Ý!M˜a• ×¶ÁíŸ, Y•®_ˆ2#Åöâ%¡Çõ…2|4‹ÆõíÄ¢Ð®µ…lL#[³æÔMîÓRÞì>+!º]{ZÛi­9çjóÌ3Ù¼lf'ÛL—×j†·5¤=
ÐrýåP‹®lCGPI&Ì¦…ù£ÌÅ›ƒ Mæ"ª%1H‡…•n½ûl‰D£às»Õ©ÓŠNX]g–Rè»Ä(ü¢SsB±§ÕkDT!± KÌÌ	 8*2w÷9ü*ìz^˜W¿­*ŸØ4¤Êƒ ²¼°¯ˆZ=@&)Ÿt`¬.Û½j¦w\8	qn9‹0¯Ê„½jŠUh™²Œ]+¿ŽÎîþ¹cŠÇó€5‘‡Úë‘šþ$ÀÉ\Ú2ínµŸ®j9¢I¢â€“W©$€Âúšäe}¡UºÓÕ	 K™¬˜CtÈ‘Â	æ¤CY÷kpeý~øcD¢B¶Û_UßÒLrNøGûøýÏ]®¥Ø!Ê]fJ;/5¿ÏB­%ð4M‰Ø6ü.‰˜–ÊÅ"pÝeq&‘kä=™IjK0ñ½]eGƒFÁ®k¡/›¢Qv¡£uËåî à¹Y ñ,ue©YHçˆM ,±?MPlÊÝÔC/?ËG‚V0‰â²«°Dˆáí›vhG¡Ç™Ãl£Ñö½ `ãsT¤©ú„R +*æòçïÑˆäpòP¬Ör Èi‡tù¯€tZÁÂ}sçð- 5\5ZŠî)²ìU“)ÍiZùj°ºfZ%q``[ývlGÛ½4çÔd‘|gk«V©×ó†¨cù(#åÀ¬YhÊˆQ‘¢ß$<ÓHÝ>¥Ukß1¤HÝ,t	ù+Ÿ-SfÆ ZB¾¤v–eÊÑY=’¹{ù5g{)òpeÉA®žØBõ„šçÿ  ÿÿì½{vÛ¸Ò/úÿ7
†'Ÿ7ÕdI~Ë­øÈ¶œ¸“øïdoŸ˜’`K‰THÊØZëŒàþsp×:¸s:#¸C¸UxàC’í¤;Ý_öÃ
…B¨úÕ£:ÜaGj;‘ÌþšûÙÏÜ°_çÅUÍ¯óü^èWÜƒ°;<4g§¥uÛ8O·ù½Îó»}^”ãw>·†gâ½]ò½¾;ªºŠÀââË™8òGF®VS³øù¾Y‘,Â`º(ëé·™—còÅœo§+$¨dgÖÌä¨ƒ(¹„%9añŸ_ÿÇ¼¤È¯óœ¨@c¼‚;_§—ÎÇÂ˜lÑº³_V‰Ý>Ö{½Ò(êõÃRË÷?òèµƒÆ3(­ßã¢;ðxU‹èÆ†m“¨†~þ{½.c%nØèÚ* ý¬=õ;ä»ÚÇœÙ”MÂ¯ÌPôëýýAå­öì<ã/Â™ð.¸laöto—Ùìñ˜0c2w]¥M`Q–E%þ°\tj*ùé=°iíYyLÄÊw‡+÷ãÉšu1vˆÖí»BbÍR”m8f)È4ÝYJBY¤ÏåÜœƒ4E;”>örË Vë-_vèM\ð÷•Ccˆf.§gëÊhO!ýˆG­~¯òLýêöú½á°ça„–;>&e§J™“\‘q\8Ã
ãª¶=bîyPY³3j‹&F5•iÕp_ù£æÖþÑ6üs°ôÞrOGï›GoÿeŸ¼{×8úW!Qm5Q-i]Öìfµ¹ºSN|ÂüÜ9¿D¯X¹Éºs7ýÆ ‹ÍŽÅ_A?sÕñq'­Žd½Öî6VWïnk-êUoÿ‹ºÁ¤÷1k¨–«KEø³œ®‰‡¥™“:xÍâ	Yu2K¸·hÅÂ|äÆì:>]Ì“NtÆ·deÁ©ñv§ªl-¾ÖŸH3yá?o1WFÃ  Ù/ahUIe
S
Ì|“ÛJåŸv³oÏ/iL…ü³SÙYÚYã“á¶ÿZÈÙ%Ó}²ßíM¨õüÃÑîû÷Í=ëÃþÑ›cËA:]_`ºÆø?çæ›Û›ÍÆNß,•J'Ô÷ÖyçF]¼ésÊDš}+…“Eç/lÈ‡LlÖ¹¹³½ÉëäeŽ§ø0©ÀùAóhgÿè]co«i½oË>£Ü>míl5W&õi3¿Oï³û´¹³²]M†2é>%
¤û¤8…H¦æññ»æÞ{Þ­ÈÍëÖNsgakb·’V8Ý;ldvog»¹¼Ú­‡2©î%¤ºgØå¦•\0Lšr:N-xDÑH.Ì+¯@WTùˆÂÄ~“øîšÙ+ƒnñ§Ê˜Î}QçMöñ©LŽ“XØœƒçy%¡y›zó€rš'9<¿y:;f5OçFs:%›§JBó¶ôæç5Oq*{g{E!ZT'GO;«žåuÄà«ŒŽèùçæJ¶J•4¹"æ=Å;].¿ñ[¼¡eÕ†×»¯^7¡ëûÇÇ»›o›Ö1¨MËy}p\HwßËáÅTÍk2gîu%‹•ë‡p¾zˆGÌ&ÍuýØ¡§‘p:Ëj:@yå¥(Y^\‰Ç¤„ k¹%bÖ/Eþ)9ÕB^qc
<†Ó½ŸFŠOO#…œf³‘bëI¤˜æM÷BÈyíÑœ2bNŸ<\r2Ï@®Ü
õÉ[™œ]ÌËŒeDWÉ—Š½,nd5E5JDlR =œ©2­WÆçbGüšÉŸ¯ [Ù&ë•CC¶=ãW.@½2¢+ªq©R?ðØV€UË—HpÓnD”!óD’î*§Qt†þ;ŠÃ «»ÑƒdÎn”Ë_?À¼„^–cvÞ‡Ým+º¿oDèÒÕDÓY·XæŽ2û‡ñC-ö"Ø(×ôAL¼zÊ÷B£ä‡Œ²TÙ™ecA•OOét33=§¯ïDSáÁû+ƒf£):É÷¦Ñ„dÙ\šnM£iøPšN”‚ß”¢R&Ê+Ç&ÞëØÏ)M[%/å»Âý„¿)¢fô›’ïMô’e³Ç$.«ûOñwô”ÉïêþLÆs~?ŒwÜUÇH*ï‰£-xSœk%ÞG×${qaau«‘ÊZ…¬Êöbs{5•µ²î¬,/7SYËµ¹¸´P^K·ÕÞ\«lU¶ìø”M[?^#¶ËxÝ¥Îù»ho›£½æÛÔ6KÌ½h;¿f	­y™ƒ%Á²;ÍTéÃ¸ô¡V:çTÊ§\ÖþŽ¬ÅÒwÖsÖ»Ô¦/wå2×Üˆ^úÁí¤Ý[ÓÃ(:,¿Ì{æJ5©Äs±šTb‡¹^M«ÏRÛ½PÂš·ˆ|™»+MáÂà˜Œ,†SL„GÄªGî1Fî8ïÚ•¥ÕòÂ¶¹˜7KÜ™Lœe:GÆÑ\Í´™¨ïD…ƒa˜¥L¥ú³Ã}Ì×š=:œ¥G‡3öèpÖÎÜ£-Ðêy´“} ¢W^9²—ùdÇóKHZd” &}Ä’.^´’4:˜F-Ë¡WbKž/H˜ôØÝ{e5ŽšëÕQcŽ·P>ÍYÛÍã­£Ýƒ÷ûGÖöîñû£ÝÍ“÷»ûÉË™$‹Œá“&+¬ÿ4`1`¦"má°N*ðŸÖq×fòéÈ™ZˆäZÃk]+[ÿçýßß{$¯*Ø(—ÐÄ¡3Ž1g5XVôró2~j8+°,ÂÈfjï¦ækšn²Xy“Wy“W×òZ¬û­Ni´^ôQíÞR>±éV‹å™·ze‰µz%·Õ±wí”6ÇÕâmå·›n±Ðx‹—E‹óZ{ Oiq\ðQ-n
ßâŒöjBÇæl±œÛ\é¢<±–TÛå[³´<¯Þ<¥®d´®ŽÊ«„ý¼èû~àTñéüB¡€Žïñ±ºOÅÑ9C©d»¼÷déë#zZ9«£:Á"8ÃšÒº­i¤3vçá×ÚÚk?PöÒ^_ôà­-?@G‚i¯ÊÎŒhü{¶–bÔ¦»Ö]ûä?A	îLj ¼e÷¸ÐÆ¦ì^>ðMÙ£¦:Yù<sk?ËH9KßAõ«©‹aòYB®«sÎ›²™Ÿ©Q L\ßýùŸÂ.¥b"­›ÆhmâuDöG„Õ:?Ä+ÈOÌeùwY>/xÏTèèPî\ÏþÄ=š?©‹ÏO¬ŠÒM?¼9/(Ëˆh#ž™óõ¼FÅ²õµxZ©–Ï¦Ç×¬pPC ey~¥Ìl¬;?,¶ú£ •“‘àeèôžg]ÀâŒÿJàb¬ž@(ÎBÖV(àXBjÎ³wÆ8És
¬qî¨¸rÃu‹§kUVo™Vîö:êåb‘óë©«Qa³‘ÁsbžäÖ«µ‘{8N
)Épýìq“P³¶3{!”<õêuqÍêÂÿÍè	@¿RŽ›$ÓÖ–ÊóË¨[GðgåŒÔEIŽI,jŽš†ÜoÐW¦¯fD¢ßjJ k-,wL¦TLš…ñ²bÑ¬Ò ì1ô±$=…[ ¦Ï©&þ’Âr7b[3™AlXÀÿ·²‚ !,R¸	‡M¦šp@ùbf9eÃÇz ¯¥ƒ"„íQøoQçY%‰u¿PZB,ø
kŸ%3VÒHöŠ9éËftˆ•WËÙQA²§õ²&¯’”ã8 1¢<ÓoÂˆzì£xPG{„~Pú=¾°&¹õk?]šä#mò!Ë!–9í[ÎÇ·Ç¶>†¹ãPþ9ß`TãØ(lö]ï³5ûXibµÐå«¢®L\É—ðÍ(jÁ4ÊìŽe°ûbÞ:v¯¨u°½ckA S}7»Î><KDÙ¼¤Ñ`F&]1ÃaÂävš÷ä²g¬8ºÈÌÑ"˜¶œÒ±ÒÍ‹•¤%¾xq`L©Ð‹ZC'¡Äw¨òØ–ƒõ•TðhÔÁ°E¬a«úò/†~ÐÉ›™°ò0ÓTfÂ»Ã¤ì|8=–E¾
cºÙ³†
–´f	Ðc#ˆÀ;åŒPMfÈ-¹ÃË¥%3üN¾]l<òÝªÙ&îÀƒÃÝÐŒÖd7f•7ÆœcW«5£b6C,P*ŒÞÄ§µ@äºž“¶Ã”K$b½W‘éâÇE¹Ç™mX²ØnÇRz²6È3iÈ
! ƒ“ÒáÐ5€¬˜‚‰HN­¾ÃÉZ´j6HîTyµãT–Ä'¹ç?ûÔ¸æ‡´zg3NÎâe®<ÃØýyôÚÝ~,µ”§VëT{ëšÌêûqÔ˜6ã?&5’–ëßp6¹ÂÁØ1!Öñ†ý¦‡aë/qÏ…«ö¾[’íÁçø¶Qä‡å,ÃßrÄ\áÉ45cç^?&=Ð¿ tV±µ®éø§òÖ©­mØ§í­ÿ4IcžÀ~Ë¹õåí²²ù-;üfúŠ†¼óÐÓB¦&U1c•mÍD–æ´ w‰§kF(Ê',f©ãÉÀrxe?ô=£lò|â:)P7yÜ©B±1EËùð¡PƒYÛ$û?½uNÝÙg‡§öAl±g1“=Ë9x/>!m}gü„‹ËGêbæ÷o­‚ý…LsâÒ@V|c"Ë$ô¯0“Kšé`ÕÊWÂÛ–ƒö-<íBT±¸¡Ïâ@Á*³l	Hž³ÃúxB®þž9ï1Ô£ôy-æ©[…˜å»¥xò'ŽuåÍUŠq£.î¤ýëcÙZUßMçõcÓîÚˆøÍœÅbò¸*c¤¶1µnÇNgOý"¢DÕíéS•U
£Ê*mÑYk…áa³YîÒØÃÚä©˜Õæ‘™ÑŽã‡´CÎü¥ÄuE²5’ !&´¨ÿqA!ÛÃŸ’­É	‰QÐÖ;ü•ª¥Ç…ÕyÁtû®Ÿ2É¾Á§s?%]Ñ¢-OÀ¨ƒ†Ñv6]¦p3ý}’›3Ê¬_ÑæÎü’Þðý•19G	Y¼¾."æÁyÁ¤ÓÌYU©Hµ)k¿(ºÆßù+ÇßýØ'6Ÿ>2±4ÉœaôG¿|ý®ã3Û‡ž:D³}…Ò–1Já£†IŠXsNíã÷ çÀXÉÁ
ãÁÚáÁÕÁìr¯É'QŽWüÝÙ`–Ï<•	fùc)rYÕƒ&,úaºÒ-»i¼»¥dë²TÁÎÌýÒÛ]ÔI3{šÂwD¯7Û[õqKµW­T2˜¢´AzRÝß%Úë>óäÁY;ãåïq4×XFqèó«:?}Çº¹´Îäßú§éòæŸ0ØOˆËj¸ZR¿ã |ú«xò¸bëOðGGN5†;Ô†[[•Õ^~Çq=ù«óLâøé»væ‘+äQ¿¸Æ14DRË2.Lª, ÇúÞ4G…É:W6YAœ=ø³ž=HË¦n˜v†’œðT´‰t„ã‚h,Îüµx y]1†S4ëEÕÐí–B=Ðƒ{móPÎÂ#M«ÏOÍB+ —½^¥CB¨‰¾0»t¸ÕÙOx‘æ*£:„rÂ¦HäŸ9>Jœ}„}æ7Q4¹-Œ­bÄ„Ñ¾FC …-xÂôbhÊâÅüÂ~
í@é¥¯â}ú£Hµã!¼:Ã˜âú3äJWl»l³ùMÎ\³|eìÝ,J²¹g8 ‚úÑ–'ª÷û,a?+á	)Í¨ßú ¿•òAWŠçÓGS¡1ˆÑÔžsF“©ßf4sÏ}4ôõû{¨@jØÏjøÖ*ö³€”bùôNÐ0Ð§ê…û¼ƒöôÏdŸìã¡}&BýþÌ# %ö³%¾5óHŠý,DŠ'.!Æwpû“Ð,¾…f¨®VÀû	\ŒÜÏžÏÆ8°	J¡`èÖ5x×l¶¡a˜—éµ¤6#
DÔígX–âûìd?y~à‡ÌtÚ6n¦Ñme|žK"wÕÐ®
R³&±"Ðë4ý×¥S¸69LjÓ‡%mš›LÐ§SúôOíù¿„ö|ñS{þiÏ?µç¿—ö|ñS{þ©=ÿÔžÿ+hÏÓI(dƒ½¯Lï¬Š5èÔtg­l‹ß	þõ‹¦«ºñqÒéÌôÊC7S¯g¦s9Ãnšl%ŸýŸÐ~›;@aüf×³àó@4Œ/Æ¤‡å¼Cèï`ñ*ŒÇ¦™¡&Ì_g²~Í°zÏ3q}¨¶kË»'ðQ6 †QŒD|rMsðqV)ìÂ%Tá*fó;Q«€7|r·cÄ'Wõî@ÜL¿ØR|ø„½XÖFÊhb>uÅV0œO­†ƒY=U1øÌtˆ’ ’ßäjEÑëç¨„OºENø‰äaU>ù
ÙüNé2Ë*ì;2¢€Ï|*~V<üþ¬xøYñð;°bÈè7fÅ$DéŒŠKúiäÓŽ°¦š	ní¿ÛÜÝkn[ï÷ß7Þ>™m¾Û<‰m'0ëÁ“˜5EžÄ¢úç!»>1óa’ˆ°ÒP%{ð£jê ª›É¸ÃÁ‡ã6ž7ÏY1š¬µÝ£ ×˜ß\Yÿž
ú,þhOQÖ5èÝ'«ˆI€Þ'WÈa|Ÿ\ûý#Õ×Ä:§$h‹q…Ÿ0ÕÅ•LÖéHü¾Xñb¤âG®×9üý88äçØo>”ÎÇ&àòwË©ù{¥Žßü=Gó8ÑÄ€ª:Cò($êï4œ1„õ÷ÎÚú{æÌ ÚÄPfyÖëÝßi,cpïï5–1è÷÷Ë™¡Åÿˆ±Ì:Sàåßi êù7Ç	»	‡þô15?’½	~{<Òé½B¦ö.=7´È2FsT\µ†Q‘ìùMiÛñž"Ãl%©­åªÔñ²."’¾.Væ«F«’Ö.!¼ùÃ<	,Ø»„Qè¸|8 ¹HÜì6GB„6“;ãcü2nÐx? 5Oâæ‹íÀt¼Ã¸Qöiµj Bf‹Ž/›¥ã2",§‰#-Î34™7J3Æ†0È}&,"”©YŸrþ“t,ý0LF¤“mzô»óMÜÿÍ?l¯)þajèÈ6^ÿt²£Œ)I´@Aý8‚¶^:Ñý½½bƒ$z§@<™N!ý]ã=ü÷•Ê•ŽzÈí·þµŒÄP¯×Ï/E¨ö`|¾qþ*~¨%Ê–€>ýQ‡†ŽþJaÃ«io±hîÞøZ1ò˜a¥õuÙ)ÜéŽ‚9˜þlQRèÎZVWKKÓ1ß9î½00õìlÿ’E7(—Ï ¨ô¹XN±2û>ŒgÂÃŸóÂqCbó.§šÙ‹æÖ9Ðé´R™~vZ.Uéà,ÃXrú@âW˜¾´Gs™(œÖñmd²z¡µ5‚IîEý[kÿâ¢ß„Ðî{¾Õh£O¥¥AZ;Ökõ<ëUßo¹PP[×.Cg$2q<üÿ\vî.Y²ÂZ4.pf>¥$8«ï”F!=Ž`ÐXì¼xùl­tI£]èðLTìÂ§–;‰àS§zìRùV÷µë½œ Ïœèó›‹¸yCï+»§ß•
rF@!½Ã«ãçï†`žhE8½D4aLB¬ç¾“óu9Ã_eÉ¿ÈÔ°Úgþ¸Oœ#ù¨gO›$§¶$2Ô L­Qßêº¡ÅùÑj:dòÏ‚…à<=#w(ßµ= Þh`“¨7IaWb°u ¤Ê†^¹§¿å¶B¿?Bàuô¢…!Ž«Á³pŸ\€o'QÆ±Á6v›sfJAŽaÆ—Å’31ÔŠ¼zÊf¾YY/†ÿžÊlüƒËOá6…çñPvK©ë7a4—Õ¬'±Öll•îàãø*Pù.Œ5f:Ì«v=Rê­G·CŠ€ç ³CF{ö0!ÝéûnäD…Z¤` í{-`øWan×`¿Ðªn“ýBó¹-öíä¶mØúÛBuzUý†ŸUðêóúI®jI|¨š*éÇ¼‰o.”rëÖ3ÐèžQ±0Ýµ½Z™´…TÍÞ›oÀkR¤ó0h óEóNðKPXïÓÈ
ëöbcôm¥îýZY--m@ÆT‚Ž]ó^Ö«KssÞ¯eLÞ‡A¿fþú,k¡<7ç`r‹†°’ÖJž¶í/ÄmÇ¢?‡ÖFÄ!9 _ÈÒ£¤EÉ1%}J|J†”lQòïxÝuêÎa=â ÇI,‡ÃSZêuÎ’Ñ˜ODxøíx¯Äšè°Ÿ|lAþ8‡ÕS¼ÒÀõFnGY9BÿSi/Ë’ð××µ»ˆ™—É0„?×øö.µò˜£	™‘;!S˜ÃÖÒŸ&LEÈÊ†ÇâOÐ*¬Á×¯êÞéþÙýý]ÈLµ1d´‚Ä€‡1¡°xUâ¹,p) QT­.%.²^—¾!³]Ê¢[“27Ã÷T]yõŠÖámô:*×(oP<1"{´~Eq>"ãJýGP‹R$×EzíQF°‰[±­ÃûØ„*šñ1;	ƒE$nIôë]äMÝùR÷&Ã‰|tJ$¿9-3,ÒVµµ€:=:­¾ÍÅ'iQYiCUÚ‡J§VzL³[ÙÇÀw¬Æ‘ªq5úSkôó›9T•^¨J·°BXÙE–(¿%Ç^¹Q¯ü;ÿ«o³wZˆ Ã8§?ßæ|S‰”Æüˆ¥\×oDÊÅü¦0é·Y/“­zy½ý…ØæfdÿþÒ*Q*q¯@ndâ"K\,ÿr-ùm×û//.ÈQ½ýbôâ†|ªoŠOnÍo’×õO¿8TA0Ž&­»¥ëð…^““úí &-Ý:ˆ¯ðß4ð7A©è+„o’HÁRµÒ„÷/Ë÷÷¾üq¤Í£XrQüøš˜ÙÆyó	§Ík6kŽ41#ÅJsc„”$M)ª›_ë§v¹R,W`ãR^,–×ðß%ñ¼\¬TñßÕbŸ+¢ü»€G½•j±ºÄÿ…ç3^ãM§~÷J0XÊd‡¶ö³BÞ¹A»[«’Æ0èõkð|[[$¿<Z[‚ú·µeÒ]‚ÚX[5bÊ$pMm•ì·#­‘=ÐNXb¥L¶i[ü®ˆ¾vÄ²bie	îªÔ
ëY¼ºF°>¸A~èE]Pw‘"v¡pÂú/è<æà²-Üî ö~ën©úw¸šSÏ«Û®ç{·¢Æ-ù,Œ¾qD.ô‘	z¨¢Ç-u¬û/ûþKXvœ~]öþ/tÞG1Ãß@¶¯gû¿ó}aäÊv½ã·G¸×‡QX}›}ŠOŽÝv½+7„ío›½î“¶øz]noõ6n¦AGA-Ï±«¾]nî¥Nà^³Þ:.)Ã}Ò—_ÁºÂ£Ýuæÿ'£˜sú?×Ï^Öç F#5Û^Ü‡÷°–ù!(9÷÷ZÂ5mÍX¤í6hÈ˜'GoíÕB-#ã÷!½´‰W(Œ)Û¿Â ÙÐ ð>21@éÖÿ#>ˆˆ*Ô¹Ãµ¢Áî>ÚÁ_TžD€J•hF¸Õë÷¢[XQÇÀMÈ;ðV©TþŠsk˜øªOh3w
t·†éPd^Ö >ÄËæ>¥Û´xkÞª›‰d¬A~i†Ê°Nìir‚u¥ï9;~þv$öÆ1ãbR±ýQómóÝüo¯ç_Lqä[;Ãš,®y’Lò¤½S13ze3ØÿÌma9q
‘8õe›h¿‡M:Š l=ˆív7¤´›ø6‹PJ¸Eaa×u½KZþóœ;L¯ÁžÒ`þ–Xé±cOÚ¤iÎÎY÷z,³›¾ÚÄ/@/Û£°†Š3¤hÚ¸Â"'rD•Zž¾Wt¡þ(Â­1¿óà÷§lÃ+ãUeƒ?d¦w’@ƒN/Ä{AÚ9>íú>üÖWÅ\¦mƒ“5	‰;â´3ýÆxB±üÊ_ƒ„Xmvü
aUìÁ„™ZïÄrùÕ4Þ[ÌÅ¨MOÎ¹ñöØjXsV3£†T^~5ûQ]l´—yŠåôÃ’u<¤mØ¾bx4>1pá˜4HÂÿ4tz¥À½ÄrY{?pxE=œBV6á°¾i$ëyÃ
6ñÙ'm2„ïÐ®ßï``Zº,Y«K%´Òã’z«Ë,ùÁsþVdš?âŸ6¨[½ˆ6;½«±÷¯Âƒ‡uSëµï±#79¸mQmÖðÊ¼ŸüG0VÈ|?“²hÊ@Ë‘„Ep¬bêe§Yâç¨þ£ª">xw;“Çp·ó_iÍÎŸ7žü†8Q9;E“Wúû°©we«™?5®Ÿ×0¨h=óV9Ã¼àQ3€ñÔ!~÷n~{{þ_ðŸxˆ»a\~(k°“e~û©‡=H¼wÃÉª—žÿsä…ZŽÔ„e:Qäï7žæ"=ñHèçZýs­þõ»®Õ¿Ï²X§
ýøvµþ}ÚrýûÏõú¯²^ÿ>Ã‚,ó÷QsÅÖ¯]þz4ký‘›ð}žÄC:ŒøY£çþýÆýGœÉr-F£,Ëæ;ù[øÏƒn,²ÖaÈ¼åWæýý†ØœÚ©ûÐ¿ÞüŽ»ð IîöÃü9®2ÿ~ãÿ#Nq¬p^[±Ñú¶¸·åÌÊËïz~Î Æþ~kNla½ ¦ó{’gU1Ë˜ûì]ñRÖ˜þ–cŽî+Êvð÷A”¶š»W@.$ ÷ké…Üµòø_µå°æáÉ}ÕÃš_?=#¡|ê³'ˆ¤Ö–¿ÂZÓ}ï}Ð»¼¤Áæ¨ÿùdˆö¦µ‘ò ¼ 7†¥mÈi‹ì‰Ï*xM6D1ð6ÁžÃ¿0l[<ÿøÌ³?7×QD^–7ú¥‹^¦¹sRyRÜíÀ¬pRa;4ºæk/Sðîâñ½bÐmS$§Þ×JAÓûÄ'í³Ùæí;¢‡œ#òÉèO~]?F¿'’3¡%èÅH@#|n¼)Œ]wë©¤ÉlwàñˆÅˆYoJ³ßCáær°îÔÅ‹éyzP¹;êGssŸ™)’
cŒxµ5Biäº[ 'Æ4ªÃ0«òðÖk;ÒGèâþþB8u£8²w›r$™¬Îƒ>Eù p<ëíÑžùVHÑÆZš;ï1o×ÍnX‚[a{Ro‡Îó‘ó9"2ÆJ|öÄ_?ðlbCKˆlVMÞÝk·Y×9a6Æ»%:F·…ì¶îù2úÌHtB¾F˜¨ëFØlŒ³Ž¿¢1Íún©ã·qhJhì°/¸ssn)ôÔA9Äè%@ž&þ[È#Ñûn/T†ŸnGähÆÑ¤ÑÄœÅí4áY°|I#Ÿ4y1yŸ?™Ø¼è*Cýf9ƒ^§Ó§"+~`yÐ<ê¡û1d©ß,úSkŠØ,6iõ‚¨‹~…¦~ón¯oã¿,eØõ#ññ_–‚…÷/v°Ut±é ƒ™éìæHÙf‰ÿ€´#z9ê»@RîEöéó%äªßì%n†þ©=€õ›WGo°.zƒˆŽKÜKl üåÐ,®›Iëì±Æµá¨Ý¦è‘Èö­ÎL%¥µ5ô‡#\hsÑ›W…ƒXœ¡q›Ù¸ŸpÁê÷i‰1‹c7ñ1qðÁ1èçy¢µÁ`­†g±gËo·Ñ¿cuF¸j‰jØ™{FÿönÅóØ4"wF^	r'Ý9î|Ð#å1nÜqZeÓ‹ŒBÚ
|{ÀÌ°pËÊÿvªãî1xäª½«ì2¬Ü mtˆàv³äÕœMx;©.„è[+­-ÕNr[«ê=âE*ª@…°ÎðÞå¿/Á¦È@ÝKvÀìÚtˆ»·$‹ qHå£
¿…·2þD·Ø‹><taŠR“ÿ :{½[<]+_uÓèžYÊá°¸œrxÖp=±r9-]Sø¢1Fš•…S1•µš¡hBÿ¨1™Pª°ƒ°ö`	ó*!…WfWŠÀe6íõHD³\K¬8¸|E(²…ž¶íÊöl0bN„ss£X“WÔ|BËGÉ\#2µò*Ž€ð\VNÕqÚŠéEŸ NuÐ´á„;Ó»L×¬±™Q\[²@Ø„~Pú=Ö&Q0nÑ|5Û¤Ù”ž‹i“º´O‹«Ÿ–³uüÏ‚á¬>ÅûI“È¦+ül*&X%Ãÿ<ÏßD€Â(–íI±ƒšÈ·vhX\MÖ<€:>ëhê:ÉØÈ¯Î4ÕãaOmyDzE#Êš–¼mbz¢Åè±<~-ØUµú>l+gvþñGšk?±­c¶ŒYM¹ŠÊ·u‹Ûd¿öQ†
‘±%žzàØdÍ¬T‹ÐÓ×K%¹q½ˆ·©°Ü8¦B]HN`4Íçbæ =xSª<½'³fÝ’fa;d‹&Æî2-’Éƒ3ˆ#èÞ2ïžÖg=:¡ÆG³‹$Õ0±he«µaKÍ
²&…p¹.aûbm®7ç°œ,È»ÖÒl¶Æ›Ïï®ÕIWØôàIËqð$y‚°œŸtšz_ÈÐŽ6Aj)9Õ•©”„ˆ™)1•be¤Sc¿1ú%sŽ4`.¯¨/cy“ZS§vÍ¥hÅ%€Ÿ+Ÿ2\E	øwqãÙC«˜±.å#¶|‹o¡U€ªˆ;}ë ÷Evr‘3Ì‘ˆ'BOwNêÛ¥6‡×J¸´Ÿ”ÚøŽS0´ðK˜TC…g“\©“j¦¾,*(ÁŽvò1y|&¦wJÜ1PÍi;aÀ»¥/V+P„M!ØÜ1¿ãš]ÁÁ‘›>x\¬Àã8¦{Ä7 îjÂmºý^Â„A[¾EÜ~¤½êQ\›:mìò|v¾}»2=/SŒ¯Ðqä.)¹ñ‘Â«l±q,rZËÔŠ)ÔEòC©+pwR,>”HH6t®¤'Ð^3ße—},±Nó´ÄuT‡æcDMèeæ¯ZU]LµŠÓ|aÉ$³®Û,e©†¨ÓTg€ß[3‰šÐ8öÉ|«OÂCXVú®&M^cWTx·˜*yû§g[Â§ªúAd­ÍI5åŸMzQÛŽ¨×Äm·éæ÷¾ÿÅ˜g\La/ÄÔTá?§¨*(H)³ƒ³q,…ç…7¤‚†ÄKõ1èXV1rž)øLuO¢´Ykí®c}I¤¡†TE©¢äó cnZðŠá©j0T4SœD±î>ÈÙÔ\9åmÚ—g]NßºÀùXáƒ5·aI´¶‚ÑW©ÅGæª®Ò§Ž[¯GI%ÿ¹}úÖŠþLJá<¤ìøqcúÛešNóà;k<ãcòŸúýô»exÜˆ‚š2MiâÂ"kLµŽŸƒúý•YÖ6o¢ÒÃ'i@¬ÝÝÝxPÍ«¦¬1/¦~éw\Kö¦&K{çcXkÓBýíË¨pÀc°Õa™Ç.Ûµe6Èi¼h<ùÌ:þ+Œï¦¼ªÍe–©ÆI]í#u—²X`å^³á-*»z—W‡1*õn¨'öÂ—ú‚ƒíÀ˜"¸S(šÏÂ>â/÷úß•…ÄÃºóæ×òýýÊCãÈa+üzÿ.ÌÍ})I³þ¥ù· nÑãûì]~<6ÏPþBL7ëAßÌzM´°„I`.û1«Ä’q {I·o¹ì¦Ý%ÔÊ¡Ì2WfŒð·—&Oyÿ§3Gcª›Ý´uhö½þmjBŸ«Z_\þÀŠ â ˜î™¼ƒbà!œÃvñac´»a(Nj=?Bîð¯Y¼õqnÓ›	ðr‘ah“Ej4ÇùkNRÈãh¦”;Œ3`ÎqÊhÛ%3^w²¸è­o˜eˆïäBXü¤»µœÏ—ùVÄRÃ#:Ä¸`•¬}Çâ6\r%7Ë];xö_”/³øðÇ”¯Åà¶OÜÊR9Ûîä±íþ-ÇvâðFu³ÕS­¿f¿"Íã‡Ù=GF ›cÇ13öœ~c‘@«¤"µ0s¾7aqNâ€»ãú›GÏ ÄÃ7Ò»*]Õ9yYÞ8~wÂ£QíŽÏ™¯›kízm‡ }q
³OÄÉˆ½i›ï~&ë_X±eîŒ›ÈL«ÞÌi™mü7›¥µ\ö°~€ô7DZoÌ‹R•r–]ƒ9Lí.mnù7 ]wjv/|Ý¹ h5¼ëáÛÚuTJdÝß?«dŽ_¢\<r¢ªäØ-YÝblnØ¿äD=@ÎÔFDõ¾œèiÕˆE#ù¿ú;~Õ­¼™QóÊ¤¹‘²xdJoêêõmlå¯µ$Âü;¼°ÛjLúgž±EöÁ§»ï\¯×w‡H¬Xîzùïþ…t.@§Åd¯DõQïÆ›è,l}3-pþ–²<Ë7{Ýæ†K,ÌðD³ ?æDçA&¾3ðX¦"9AwŒ•½:ÿZxìk^f·1ßÐ2!–5£¦©ë!ÆGñmâq}9èÜà8]_	E*†²pÛc^°¦k\ÏíL8Û›Åk²°É÷‚™Sz«Ù“ISÇmÒØ§ì¤9úÔIöÄbJ±øE­vÎ<ù]ù)»¸‰õÎÿËN¬ÿ€‰%
ÿu&oðd3ÿçÄúa'Ö«‘tz®÷—œZ—¢ñ3N.Uü‡š^»–çGÖÐ˜S¸šY²µç–^èçìú¶r¾XGÌÁ÷Ânoøà­ecäE=šk½Ò©c®®ôèßnðg>]Ä½ÈÉb®[[Ö¼%Ä‹Å8Ì
åµJuaqiyeu-æ‡6¯“W™ËF©Ÿ[RÜ¦x×rÔ è2Ñ‚ï^îvB¼ÊU˜5û67.2.h˜2Dx-	7šÝN—dê+¼R›ˆÊr¯¿u,Á`2^êuDaÍ!ª@Ò±øH{®’r{èq|žSüÔHz‰	¶&=ô3ãf
.F³—ï•¯ß,Žžˆ•«»ÒÂÎç9ß'®{¦k¬öxBÊ€MpðzíQ4°$÷°— (×=œvTGD)=Ø
&¤ÎLpÂÒ²•tË†9ùƒbØÆ/¶\ô!2<›¶JwèèæoNT’íTÓ¢Pêyí>0ykpa2LcZÀžkÃË¼&ÕÑÿBÆQÿó»Ý,/oÍ{ØÖ'&ûë	ø”"špµ¸ÏÓ«FúÆ1*–Ki™’{	!5ÖÝXª4µ¹!(ŒùD_o&®6ñ\’Aí°Ô¡xvÉ‰²KÕUk{[Bs!ç°²\´ºðÿ<Ý7SÆ[iJÒŒœ¤gÖ$›$ ¤óóÈÒ¨~RÂÍÁäÉ+¼þX·EÊsy2>ÄüØîïOJbR¿ça%·öšR3!Œüˆø%à½¸Ñf)H»JbáÍrE]H,Ã0NšóhšgcöŽr(Œûk?iÀº½Ë^ø`0R&áÄ‚
[ð,¶¨Ù1ŒÄäK|ŒÐjlY©×‘‚-Ê8žîÀo€e?|™ÈoKºO¦dŠÃ‘Öé{åDC€¡Çáó	_oÒfb°¼»‹‘	.5Iz¼}Ôz |û—ò«·šÖËø‡‹,•}ååÞìž	qÈ~
Öâˆ¶Ãí°@Žäl9Y!wÌCò8h×ŽpDÈì³©³+Üw…›ã	z9~â uã5wý2•W#¾GäA€Ê2ŒÒ8pñi@<D09‰k –ëì±yqœï¨xÕýú³ò:C˜³Ô'ÛNÌfèiwý¹9!ª$äY×˜Ž×R £®£OÏÖa6:¼¦4i1X7i®Þªßõ:µSgùF@½É^ý¦Ð‹?qÿ ¡ûž|óZ|éë Ò0çºÄà¾B§ ‹l²Ê¯Eå×ªòíº£ZyéñŽ	ÅÙ&¬¸-ÅŠ](Xƒ™Br„#U‰*d•…Â:´uvaÀã¦Ä…|ë·Ý~­ã@n#ÙîxÎE	t ©Ò‚ÁrZp±2ˆt´ÊÇ­U¡ÔÇZ(^
)œ›¼r0lè¬‘tvA#Žs&a—@\Fh”c7Éã±P¦€Yç¦ú³ÊxLNÙxŸI¿îÀ&A€ön~mÃ,‚DÞ%D@0ië‰òúµ½þN2¿—07HÆæöÐ¨—1ËR3l—€%›.PçB©<7õÓ
©’²xÆFºUyØ€N]À¸”†[AÂ\BVëe™±Ü‚ÍŒùY‹íŽ,Üµ©ã\“M Îõ‹MR.ÌË·
Àå¥‘×‹žÕë|#57§8º$|YÞà?j•õÆ‹zë—=2zQßCt¼äiŸlÌ
/ë+K°ÿ÷~D;6:,G.lfág?Æôã ¦öŠHWùöˆtôG@¤ë×_öƒH· !ÒV:8{0(ÝêÒC@é…¥¸:›.st¤©¢v>óp´™¬7&cÖ%‘_Ö²µD»sdBg”¶Ø´Mz£
ä ×¶^sAi _MÚ>„ðV–J—lQÄ¶Ä¶±šÂý½‰]°ÍûMâ°%P/4°„øq*VÛÀÙÇ…ÉGbûM=0ñ9÷èÄ
7fc·Éræ¶XIÒ)Í"›mÑÃ…ªNb!9`¿Ôó—dÑž¼éKqƒ¬`8ê‡¦›Ï¶––+N¬Ìˆ›Å1Zm7÷½‘³™KÎ›ÅU(HËÄ°Ì<…?÷˜ª«$v{bòY;È¦SInú5ÀqÔïxÿ€½$Ìm€[AÚÈw+`Êhõ{Þg<k(”™XAãÌæ0%B*EÜúY*†S1ÅŠáÅ¸Þ'7uß‘‹Ó\Zu\9$LYEŽ‹L€—-×ïÔŸÔJ“Ô¿DRR•ÚàßPà(1 
Ö^3ÞAJ”M_“fœâ¡_€–Ë_`;:U\îí	ð$j_Œ8VM³5ãÖêMó*	š¶˜cÏ¡´1_Äš¦Ý‹¾à=Ä®^Á´&Ö9­Ò†¹8ñ>{þµgÿËð›ì>0ë
%PÜ	p÷ò†ý&.vÔ³kçü°åù^r|K[Ñ‚í[ç´•bü·lYÜù+] ƒ(âVZEF²š´LåÙ…§0ñàûU|Ävà{F1H^¤1ì^#%•­`Ò™¤x‚IñT*ÙºÃìÅ*U.Á3FÍ+‡©$çâ‹•àSþ©_Ïc·pŒ
Ã<£ç—©šûó»–Ýx#ÎVÎ`+R`‡,É³–ÉQT4ÒšØ „ðc›g×\B!…]¸Õ|Âa¾ßS¨ °GqšÞV?¬Ž<"¶.¿ê¡/«|ëPíB^Ü12ÝxN×ZPòdˆÎš—Æž(±H
j×2ò°uamJø——}Ê‡¥¶	ÿìÑë#Špa7û®÷Y¤©wF­~/ì²yÖ>Åéìæ¸wéA¢‡ÉEÍ£ò’ð$Ä{^Q}Ã£íŽ¹ý°¶Kz¡8mt®zXªYVI†Ì8Ä`#O]ÈÑ8àA28ýý¾8´k_âõó`#¬õ(<ŽÏñMÀO*N[”ÓTÔŒ>M„Ä8mË;“;þß#éÒqƒúïÌÙ6é¥Èë_Ó`Ú)°øÂaTœõü7PzÕêÄ¤âýýùó»ßMd¬1±Xš¯4>/ˆ8$êÐ˜øuøzÒr^—ÚC7Jœ0žžzgâgê\Ð¿6}†3Ò§‰ã2 Ž½Ê¤|È l€<“Œ47ÇþêtÛ¢õ>{òïº¯~Ÿî“©9ú*†RÒHÏåÓ+JöhF¸˜Ó.%nfl»G4}¼Þ¤äsFý7”D‰jøm)ämR²CÓ‘z¾Rò:óËQDQú[Ù²ÊPò&«¢6ŒõIŸ–r°ö;Ã<z—nËÿï—˜^jû Îd½–²×ÂÛ4ŒOngÐó`û0¡¤,ÒŽÈvT?ˆîïŸ=kâgSÆÉÙ,qÌècµ¶ææž9Î› ¾iÖ»É\aÙ‰‡*àÎ› ¾ñO½™úûˆGåË-õÂY}¸@€»°SfhÏõ"Qcc	­÷Zå¾¢¤A‘Wô…#2›èxy2ÿTR.0ÿU˜?"wŸ-OÜä)Ä)éjñVî`úN®yÐá‡õÊ¿FüœyàÞ8eÒ…[2|Hê’çù[¢‰~¨ýÂVgûxšC$/ºí¼wÇº³oñÔþÎ0‘àUà–ŽmÔRÆYZ2?J QZMÏÑç3ä½®‹«Vþoœ‰åôwú±vò4Wõ^‚kk=ýÝÀOÖ!’×1’…tŸYax
Å\‡æåÊ9ïÐâRù|ºÙÄìnµYañrv	X­QxòËV¬ìë¥û{#+uÌa³DÔ…Ñ¼ì&ýšÖ¤¿°ãÈýœ2£˜…8åìºÌAhµ3ØÜà¾fÈ¯³¥ÅKÖæÖhE²…É^?®•
NW?z@“­à­LÜÖ=®ib¿•8{d§{Çró:p‡³ß.äo€ã“ïù:“/N¼Þ0Y´xœ²™®ü±åäfhWvH“â+HÑ×OËÀa¿XM«í© 	å	Í=ãyLgyDÓ&TˆàÄh¨·Çvlõq§BœÇ
P,°/ð‚?b°wjµšbO¥·@Ü˜iòF$› òÉ6fŒMlŒŠfv^{<¢nè{ç—#™Œ0ÇœçÞàõãcßYy/ÿìsºtÉ§öv=Î¦Ÿ®N­ÙÕ7°ú¯2~Èï…±Ç@É½ðù¦„söËŠEòt„2ê£‚fÄóm
:æÔÞ|·‹ysá(RE‰B©5èñûÒ¼j&¾@eVð3ÿM’ùisÀ©Ç¯³×¢RÑî!çÌ3G	IW~‚†–_!ÿô6ybŸ±»°õ`gŒ¨!h–Àwü ¶8&jOÔŒ^T
ìVíç)×ò<¥	›¸kvž2Ô.'+×Ñé+zfš»¤/Ò™•ÆrE¥CàóÏàû$êE}3q0já™/H·WtÌ;pNŒ}ÃŠn·ÌycÈ´’t€‰Î(`æ"lÇƒÁ\arA\f,ÏïšÑ†~¸$MÏµëÖóÄ¥Bãi¶(ÐÐ³¡ê²‹7ÊõfÇ‰¹-çíŒM4‡1à’öŒíDcïWtŠÑÀuqxÃh©)LsøØ[“?Ž»7#ÒÓ|“3¸yßô˜Ñm‚Ó7§˜Noê´èÍ<-î®a!zÿ3çÆXLŽëhãœ·GŸª©çù³'´Ø)"^ºS^A¨ÞÒ'VMH€É®‹§«8JæÃ°‰ƒ†Ì®Äv]Ý4«Y§-Zéøqš¡s<xt´JÅ˜¥1t©v{¸y•‡–¥Ž‚(mµc1ä´¾“Æ1UµUñHÆ½e­JŠÙÖp#DS0µ	ÂúÏÍ!<×Mc1oÇœéÓþ ]Sˆšæî§[JŸq*ÅÝlÒ¡1ôv$…¿¢iƒ¾x6N9j¶éðú–˜;lÞÄF÷Û‘Îç¨µåÇ‹*âÞBêx$Ý0¹¡×˜8Ž“báØ_ÂÈ¢“œòÜdhã¤%Æ.R†~ŒüÉÅÊ”Q4á¡(;RTgE’ëá×-ê‹º§ñ„¹R-3lŸÿP^0>iœ ¥Lâ…¸Øc¹AÁË™ücÌé.‡'Ìžeñƒ^"É‡.5øeÒv:Ì•ÁY|@¶a4Mÿ5)˜™:¥œ™ce•v¬Y6IÁÉ<5b0¬<‰ðœ¶ ›wòÖñŽµ–¦ƒoN‹£ÇÐà(S=º'[¦~:0Û‡lj|í›ÔØ}5vó¨áâÕNš<YQƒ?®èÔàIß…óþ[™k_¨´Áo³û é™I•×4,Sâ(+ÂLˆuû}%eû¤Š²‡Tqš÷÷QáQL!yH#Bo®ï0•V³(”á£¼:ÉÅpÂ=/²dÏÝíÍNöMšmGS”·ÃRè¨+íËørÔ4Eé5·8ÕËîï7ÜsüÛT87×Œ¤?ÖnÞÊ*ßë
êì.ÅØ†;¬%Åo2¦ËóÇD·ÌGL›•Y§MV Ùå¥GqE~¬fÅ/Ü°+F@˜ ¨°`Dk·§3„ÚLžÁÏZ´ËŽ!òÂ<‰—”<1‘'»¤þ”ÎüÁ3íS³õCõ©r/WîÏ@µI™qGñ”þs»Ì¼^ROŒ…ÉÇ¨ÎÝk•±WhÆ^3‡€	‡5y§å3ô(|ær·ñW Ò`&AëÊm®a¤ýëÒTtDAëÝ¨ä{}ßíˆf|•Í =íÉ¡½úWÙŽDh¯ÐpÔ@*û½È™ÿÁÆÿðæù©T/¬¿ì…Â¶KyBnú~Ÿº^OšNÏ˜ÃÂfT/“^T¯ý ^%A}øA}‘x^}‰Ð¨¾L¶ƒú
ùÔWÉuP/VHÈþ‚úy/–É{Z¯TÈoð·J>ÀßrÉø»DžÃßeòO(¹B>ÀßUr×H+ªWËäþVÈ|»JvXÅØß+ö—zøw‡ýCüÛ`Ÿ³¿þäúÖ›‘“/áÜü1íòb$ÍâÐ\À†•eR±À›R‚W¢Ü—è‚ª{QÝ¶ÉWVaîÔ˜yõòzäý
õñExxñ¢Àü½^ýKxygëð«^ÿ‡ý¹9–ð¢rÆŸ7œ½èþ ì­š,·¹ñø³Mì¹9xÚ€ñçÞÍ{‘à„'a-,Ô°Ò7žZØÊ ×ÀÍþ…NAä=‡Š,à(=‹Gžyf¦"–Ë¨Ã°Â&Š°ìÉù<"–òÍ<6”ÈÒÆ,XV™\OVÑÎ kÛ¬Æ½ÄÄÏfbHo ñÚLdÚFŸ¡WpÂ˜/0Í2f~Ô¿`Œ-Î Ø;³üÚìÓçKž%¨‘YI³SÏàWmŸÚ›e‰·3áÛ¿™´ß»ìµz onêø`¸„¾Â–˜éí^äŠ^IV	Z³ÿ¬ñ</¿×ÜF9¹E›dÒa„§Ê6ë0'Æºeæ¸ýP½t‘ÊâJQÏ»ð!ûÆF†L†CÚî]ÜBöŽ™[’øP¬‡ù¤£ËP
pÜÑ+5ÅT‘ŠP£ÃeN ¼aëÌ|X,FD®1}-¯aæIü@9†Ù¹ŽoX@nðo”hSo*æÆUŠ‰ñŒ“/â×®„hX`B@<ãŠÆæ¿xÆÅM|ñŒë›íâ—<6ÑÅ3®~8ÇŸñçÿØpªüªTó±RML±Ê›P"ÌE6D®Klæˆ\F—Ù„	¸¢®°"pq]e“B$à:»Æ¦€¬—YÆ÷"áW\Æî"â*crI=HX`l-py^dŒ,àWu‰1®ü
$,'²ºÂ¸O’Ø«WW»É: añ˜H€_eÆX"~-T/ÉÞBB•±H€_…BÍˆµä8”“ãPIŽC59ÉqXLŽÃRr–“ã°’)cp¤Ìq('Ç¡’‡jr’ã°˜‡¥ä8,'Ça%18RÆ8àH™ãPNŽC„ìˆ%T¨  dÄ–Ù7LÎgTœo¼ûû½ˆ#\97Þ%ëþ~B¡©M*¡–‚T×y³@+:hP ³}6t¶£ t¶£àW¨YèlGÔÙ®Âúwzœ­_…Rgc	šÎ6ð¸ÎÆÞªÉrø‘Ïæ:ÛgÐÙ"+aOêí„µ	•½õ«pTË(É¶½™&ˆíŽ¼ÓÍèŒÁ|Âwà©'žÚ.>íü)êáÓ…xºŠðÉO·¬ÏãO¯YµØÓ¶(ùÎÃ§Ïì‰Çëk²w"ÿ=½ï~aOï)ÚgïþÆŸØHt¡×MX×aE@Tî`Éø½¾Ÿ?Ð¸ Û…¬â yðÞ:€Í+¼R›ð
,çâÆÛc«aÍYÍY^ã ê`^|uŸ-ú¶ÜøýÛ«sÀ®®G@%j\]Ö “D—¥2„i'"™cå‹9_R9»LžJG0óŸ‚ÆH‡#¦¿°k©hý‡i‡"ºlÅ‰[LÅÙ3.DWnŽ¹rƒ7|ˆÇä„ãŽñM¯~’O»[â„P"
F”Á9R±I‹1ñQýGötÄLsäÖäOÆ­"”Db³~ä>‹ƒRÌÍñGŽ/ž7,Ô©ª{Éø~GÌ‰ãä03„Q !žÙÓsñtÌžY2¨£ p®Â´ÎDŸ£«f&LÇ³äf½ô»ßóÛ²šô<
ææ®`›{´Xm^¬m;LFk;’qÚ¾<BÒoÖùÔíxõw‰áYw:^‰93‡zQ”E!H‹‡í²ôS‰Âï]{üŒÈ‰ÇƒK:ªÕŽ¢Ô@>¾gdO@µÅ«E=Žêþ:`!Ñ¯d4ãÛ„¿¢»ú5ZËº¿ëEÎ€‡­ÃðªÃ0'ºZ3‘.Ótì¦289‰‰øÀ¹¦G`kÁÁÒ7ÔòB‘çÅaþ„70ï–6´DÛˆÕþí¥‚‹mzzØ¨V¨b}“öG®¥äÒ­ÐL0ø×^6Pø¡—À>öfb	¹£?¢Î5ç)<xäÈR[€?°¦}fØxò‘¹×ÅGqÌ%«ŽÒ¦•0ªq#|Lá¸AaLŽƒz»Ð
‚úù[ÁVdGòy§ŠàŸæMDÞí€›¨ È¤q‰~Ç7$Æ]&ÂšlgFìû 7åäµÜ`“f<FöI^±…€l	éOš†È×w;Úƒî—3.¨ÙOfÄ–H‚_±À&ûº”&»&s8|Á`Wê_ÅäâòJcõ óÙÒá?¶!ËÚ
F_Éo#×#ä·€(hòr¥J~‡TŸuÛPæ¿SééHªåJ¹X®+KPž `"+¤Ùƒ‘¥=r«Åòr±¼D¡ÀR™LÐÈêR	JrÔûêö-,)Êˆ¦öŸ=Ÿðàl˜jñ²Ç‘ŒØ&æë…¥:e%x+è¹qT¥Á¯ÿÇ±ëE~È‘W„¬­®,/-.T+åµU2ÀÔRÈŠ˜¯ËÅj™T*„‹Ë¼îWIeq•hºN‰w‡¬–Kð>­B9¤#üç_4$‡#úÕ÷,àÂ[ Þ²%žW´dn‰ÙOh'ð-½ñò»§úpŽž»›÷[ÎiœéÐôóíðj½ÝE	ÕGÑEqu¯}^ÑzÇop¼Jm˜Å£º˜›ˆúÉÑ[‘Ã}1áÙù˜AÅiôZ#tÖíôÂFƒ’Êêø×ì„Xœý‰ƒà—>E¸ê/AmþvtÛ§¥«^(¦lÝæŽ6QmùÛFµö:[xÙà¼¢ìÕ6^¥ÀbcèÀ¿¢qAìT@¯üÏZ§Ð”hš¨ô”¸EekØ*V²,d§!ò$äªÂ«Œw“K x&…¿Vðò^O7§Œ€,·Väœàâì *©ú³"1dÐ	zÒÅ?æMi†iÂXM³(MRi âÉË&ÿJÓÍä‡Ù­<C/aÄ9ƒ›¬¸
E†´¶0ØL7®ÆeòR“Yíš>{œ=§AAc§ô‹Úý‹‹^»çöÞ|™È`Ê$ÍÀAšŒ¾ˆ7IõSPq=Ð%„pÈ §mr£ð5%µ*œÑ('ü•Ós5Ã™¤Ù#w¿ƒ<ê—µ§-é†æü>ˆÒÁ$Ì»¦D‹'`æ&Ç”ƒÆšhÅ<”AÞ—ãÕ¶#'	Ý¢!±èÀ0""É½ËK ÎÉ*·-ß‚–¾ï¨?èÅx‡ù{´Ž ¯JaFÜ\2ÿ<!*Ç¸hPAôeÿßÎÔÿ€_J«n7H|U‚á¤kº·~6O;á1p{L²=œVÐ™+5šŸ°7‚ô|3C¹ï7´Ï¡sŒ^®sÅlMðº=€Z%`Ã!+ÿË¾bO\…}ñçã¿";ýže½3–µÇÀäÔà–i™‘¹¼Uqy«ÆnÞKºµÅ’fF± õ&á U\–­!Ýe]ó•ô*§L*ÍU.¶úXHX«…òaPº çÖ ³»”™ôûh¯kö‰-è]zÌåuc:à«¹ª$€d+ðÊ
g4Ä%»PëÖYáHü¸ýÍ˜;²…SÜ4Ò.ÅzýZ÷äom¨wl†‡ž±ô‚·«Çˆá ™òö¹fz@-ïÒº¤h±¸+!RÎz];ïzI®E-`-‘ÒDo`©«&ÂÍäÅäÍq\ŠE…¶ÔÞê§RNY«`’™6cºOwBSÈ@Ö¦k¿¡TÐ–í~uá8ú(Âðqã7€.ÌÂ¸Jìgô5ËÕãIÝÌžíÜ3@Ð@ø@•—R6ùQ+ÄœlH»;®55ÿzëÕŸ¸4M]yoLñÇ®C3bÿ	 ãé]åŒ»¾*îúªÓw}ÕY–Å‡lû¾T8íiQ‹¾%rº>ÿŽèš½ËMý¸íÔdïY}(Ú:t´ÅÕÍ$­ÿó¿þ7n§h	©¹<*Õ‚´<Ô0ù)[ÜŠ¯‚ÀUíÛÐÀÞjÚ©3`§ÎqÇLü0dé\œeüËYP†=œÁ9LÂÑb&wÎ46i³:r™ÓßâúÑqü0eéúÌ7w	Óß)ARè³3cÑ—Ç3ø—W-¹2N:ÕÊ–Pü”êk±2»@Â(y2 è"x¹0Í³X±ãé>ßa×V¼}µœÆpØÇ35ëXL­BntPfØ–6&ÕÝVß–NaÃiÃŸåå…áÌ‰é¦±ý‚p|`¯Êh¤›4Žc‡›±46OFšûã34ãzM@—OGq[LB™¿?…
1’SÅ^tazw>ŽþÏR-‡Qå9>p&lQ¾1Ã²g½´†ÕëHýœZ[ÇÿŒÃ¡qÂ^d+íwJ(à¯¨EÃˆqÀYH¼Ãj+ÙÓ‚:²%:àrŸê&ëô ’ƒN:¨¤VORìš³Ïæ†ý<ŠìZ@«ù®âmßü!á	AX1˜!üÄ»Å®é¶Ü2Ô0?N+¥êÓ£„NÈæDðG-Ú£õWÙ®ÇFžÔ€’“00@ &À .[ˆ¼ð³î4ÎI^¯LÕ*	”&qn¬P²:qš0ŠaÃ(ð?Ó½ÃÙÈÝpËîW§‡5Dá–=2Éÿ³¨•ÓqI¦Æ-˜«€IP]]Xc|aºfÃ>B}’¸û
éÁPó	Ü»lá9“¢ª0ð&èò¨Ê[™:†Þ©hõ³ëlÜåž²ðÌöEŒ‹ð W£"ÏÄ’ƒ¯rÔ¯ØÖƒ!‰3–ÙÀ-ž@„	 ÚjgD`ª@Zà2–ÔeÕüjŽ?"‚Õ˜¼ö °‚ÞeÏcø®Æ‰3a›Q&bª¾Z¸P¦\Âà^5åg›‡zê¾5cndë±†§ãž*ÏéP¤Ô­ðm.ÙýÆž£ˆ|À•`Ë’ÕÄ€ˆ¨ ¼=Ú•®1bwÒ#p”fÞ=ehü"”èbæ´øáZÂÍyâñZ"ªÖf…œoxÊ÷÷ûêdŸ¹Ó©8š Z‚Î!ê@ð’.Ú	9¿™-Ý&›Ãûªß#u:ÇÂƒBñl«°MÄ6ïãh‚ÌùoƒpòH•#îÎì˜’—dÜE,Ñné¿GÂ|‡á‹PÀù‰XhæÄ ¶û·wy¼Ç¤£q¼Ešá(äÉÇ‡ñ7’ˆ O•«gSÎÓ8(KZ`Z…}'ÉÃÉÜˆïíoˆpœY¥’];.ËÏåIÁX˜œëÎ¡h¥½é„Ìs…é•8‘›Åbò\FÄµlÓdl¤äIÝ”s¶¼ÉÛe
ˆa¬¢äœäPÍ"Ô¶5‹P4<-BÑZY„¢Ù¤HD‹PÌc¡hÌ|É’ÑÒSX§gÏk(#¬=m[šw¢‘oÂ¶òYE»s®Ý³Â¤¿1‚I(ÇâÏ¾Œð ÑßŸ9ÎL˜ çÖîïg-Z)0èð2iâº“Ç?¦)¤Š<$ÒøÐ*¾qLj	“î(nú	ÿï„àwåa„q™f…ó)åžäZe†Ã£E#DÊ^|0Ên®tîË8Á™‰)d¹„Ê´’KŽ‡wÞ±IyšØ–&V²"$6›:‘Ú´Z‚ÑÞÃâ–³uüÏ¬c&Plj¯?lÂã_˜jí6Â¬afu:‹I¹§N}>F1„Ö¾€qš$Žƒsl¿o2ôŠ‰”‘<ë\šq'Nz bÐ¢åiÑL·…1#;ëy/l9¶„®ñ4Cë³ãÛ3a»‰ËÖ›y-‡Ì«ÓEƒ6ïÓ#¾Ð«Ì b&æßwX»Û¡’‰iÏ¥»ß}á²p4”¬3Mr%ê,|9B#I 4ƒ(¾Ø/—4íèQç¬ºžF^nT³”¡¾[ê[š©¾…vú¸)‚_ÌRßŠMõ­Æ%U±VãšÜÅ½£1Ú{þe4¹1orãÜ›ø7YÚÔc¤ß4@yöPêÌ‚mÌžÐƒ&Ì—«®áH2qG[maÿŒçþC‰V¥£M|6;i²Ž\8°r2\iB62îåŒ“=Ä°ÍÅ‹ß¦ÜÆF^ £N»èâNòWÔ@)_ÎÐÑý‘ñžÛ‚­â¦+¼@gÐîº2_µŠ1’ó-KHÄR!)eÀ¼FÂâ6aþ"] >6œhôJ\ìôÍ{vêZ'ã>j*¤ÆÃ>³¸$»¤¥v#µ˜}=…KEÞ}ìÑYÜv²ŸEdÏblnÉû±ƒ¹¹ƒŒE&kÃ9~Pß‹5£¾4*×ô††ƒxï¿§îÐ2n!µSUÃÝé°•qõ3l_q5}Œ)ï3g¸X3çPi^«)Í+Æl4C~gºÆƒÛCØä ÷]Ù°åÞ£f«JÀöå‚Ø2Zf¸ˆ’9)RZÇ—<èÙê%ny2t$B¥JÂ=ÌÄã™àjMÏKQRªß„¹£•3ë)ý:=¬ÇÆš—·³Ç@†R“2?ÈRmaæñ$K<*"s†Õ¨i¾ú¾‹´AzéË‚ÕÅ‹ÝÎ)·Ó‘áÌ©ÅúYÀ,8VlÖ‰&™ºi'^(cn¯=ê–´U/Y}DQ·˜Ù½ûDï]&æ^†ê?R0ÿ`Ö¦Ð<´œç÷Ï½ #µ!­5ûoÇ¡gØ0c´ég¶xè½ÔÂy¸×;¾hùþgLò€_X„[«í°dO:KÝAƒÐÒï û—ÚãBê¸ë@L’ÀYË“!áô
—œ‰¦”ˆ6o}y¥©­ÐLÒS9ˆ•²Ü¥†Ã”¡æŽÄÒÕ¼Æã×‘gKz# ÂUáe¢1+@³!ŠúwoïÍ79˜·ùÂ­š kÌŠzD–™åq½ü4‰[U3J½4¢e<Ùµ?Î+LQ%sZÆ>°]œf5q:Ä°ÛˆQþUam_ÇùVF
¿[¸XáKÞúV
ÄL†Ÿ™|ywéVz*²óì´áçƒgä$ÛOÃ0MzíYºs¡ &H¯¢³ZU¨áH$çÜègEYŠ/¥â“UâÉéL†­öÔ¡(Ú¢g³ º7]¶Øídn °„â=Ùz}UŸ"Kå	ÚdkQßiÍ29«‹•e}‚èßc¶é®E7Ü®,¡þ$æN5­|+Ë‹§›S«‰Åê\3/å÷|ë!3Gñ¦rS=4#I²+t×U;4¯óaÖƒÌªÕ ’š+L¯oý£OM­ÅqÑÙPŠlc‹mm™ø-âÜó[(THÕì3Ù‰Åï?ÊBÁQ$þKEÖã—
ÝêKÅ¿Ÿ¾Rüû/rŠL\(L¶~ÊB!kúÆÅïŠØ$ïÛ-¬ÎôBñ°™£xs¦¥‚Cc}×ÅÂŸ¾X\ŒÚÝ°ç¦Öäjås:ë)åüÂ$¦3vÍ9	R*Ea¶Õ„aæÕD6ûZKâÖ%ãÕ$5v†ÙkHæb³s|^*H3"¶¾âÎ¿`	72Ç&š£qaê}Åì¾{VšÌ¶/g¯qÒ¬;7ö/kÌ‘Åå(0/Øômz‹Âv¡I§ç ú÷Ë¬ðùýé =éìU:à­ï(v7Ÿpþ0á&X?—PÖ5iƒ™'JdÓ8÷B?µÈ»ü˜pi¼h^'½þ²­Üfp4™ Þ†ÓÅ›¸?Ío_•“ò{±£ö•ù'õaØ˜¿ŽQ8"a1Ã}ÖÞD˜•a@¥?`ÄÚV¤ƒ†l¡­oXÛ8$[10I/lt=¯ví¸C
:ÄÛ:€xªÛz/Ì^¼‘nõ3b›pì•ãQo1øå7kk5êÎ]¯S‹â1W/.B
õhûº/¦ƒ•¼C$œP›$."ï2ü­š_¿ƒN)›¹~=8EäÑ»æ(7Êu§AFXÂs.àÌi	s:´Û½ ðJÞpç¦~‰Ð7¥†{ùbTâí,Ý@ÝPº•UºUºM”¾EdCÛJ½M^w÷²ö¬Lðßw>ª½£úÞ6¤4=˜²¢³ØZŸð	\³-Ì&_w½¶T&‘Ërƒ†÷‘¶vû~Së³V÷¡5$žª5qgñÎÓ&-˜Ïm
´“Uk¥ŠáõüÎ«KÏªúÕqÃ.F"¦k_ì3PIYŸ¨ËkÝCJH•™Â]«[ì"Þ_/€tdŽÜ"iÓ|º¬v)Êß0í¨`¸1ÆžÖ‰å$–‰Â`«H¯pBó.|Å»/½OÊÛarÕÿïÿù¿þ_Ø# Z%»Awì"ÞÿÙLøÐ”J§ó…ŠÜ\;W7øÎó;÷ñð†Xøë~ÎõuµYˆLzãÏ¬›@H9±Š²„”B3‚i›Q^RDa¨%\\%¯üú³Ê¸À&e#$ÏC„äKHhJp`ÙÓ>iŸÕwJ£"¶)eñtCºù"ÒY¡&Ÿ#iH»þÙ³½¨4ìú‘?7'	P\„îµ¹µ+–Üã‚¾@@8íEäÆ‹EJäÕ÷¢—õJëøµ^©nØÿµ¨Sã±­JÅ*Z•ª]3“W0µlèr"~‡HÇLÞßFÀebUËÕ›0]¢yc¦;ðê7žÔP@œñ‰Ö;-ŸŒW—ÈQ`dT0ã³÷¢².0Ç+eDðÎn[¢_¯¦‹Ëbø——õQ¾ÌËçW_¨a &87
<¿Û‹Æç"9êÕß¹QÆâÆ)“«°¸YzõTü(€¬?¯£:£Ã_(#qÃ¹¹Pó«ÀRû^=”lÐõê/»@IÜ;g|sß‹/Þl_+}O«Mx•zõSñYø§ÿ4F—#ÜßÛÇtºÆŸ ö~;òù¯=Í"q›¶åÏß\oäbtA{‡¶ñóZÆ` ûìùÖ>CpìS˜ÔûÞY	d}ä8ÐÆLù1ŒG}Ó+AOKøÈÓ[¡J—kÏÇøþÈÝ8r‹ÃZ×S±4 ì D]·PÔ¡bž8.ˆHI'^áÆàDdÜßs²ˆÜÔxŠ´a®ƒ0@×tî7ãÍÍmz@V»Motg*zÓ
oa˜ Õ·ÂvßtN_GgKëîÜ‹õA{!ïE…”¥KÊ Êtn*F3ø£LÑì5ðîaPo0Qîï›<®ÂÆmP»ŠÖ2 ÖÒ×FöDcÏ‡Áø\‚¶;“Ó¹0$º‚îb$Ú(˜{(
ì‘k£ WáN7É–‘[JHÝ&G‰Ú€ÛÄ„ÌOäµ™y°åÖÁ"l:¢^›T¿“tCwI3xHÒ‰_È›tb’5?Ï'1~ñ˜’~"“¹Üãý¿ÿÂŠ[”QsX¼y´Œ˜uí#xª‡DãFÿè›=ZnÄ\ô£Þ€†%k÷t”6n²h‡XCn!¦“´ºà¸¸¢±h=¸&–°>…­±ÙÎòÚÇÖÇü–Ù¢äßfLÝ'D$É+B•	èb´Kn÷†|4”\Ñ,Ø£¤›™áR2HT|D‡£laS»x JBo8ÝãŽ(i&ÞØ¦0…#vhï4;£¶Œßtú™’šîbDÉ¦™Œ¡HNw(l²Œä…UH~Ma+eVÂ÷Ç¬ÏÙ23—KKÈƒlwÌ—”Ú†ï½¡¤¥yvQÇ‰oíÊOÁnÝM¼¬ÓðJ`$ßñì!Íy·ŒGÏB3y’ƒ€|M$³qj'“1ý:"›Ñ„Þõ"²d¼w?‘Ž\N=ÐÄwªØã€|31rQ«ëØ…u–Ü¼¸ M#z>e‹y°­'ˆ1ŸlGè«˜,èÄ¾—°:ÏØ.jn.‹õn§€î‘*Ì¥ç|ŽˆÈ… ˜µCçÆ#¯C)vÉc¤h•°¨(ÜÉrà:‘ÇÃ€>…ŸcêÙÀ+1ŒŒ$ÂïŽßa½+œv‚¾N¡®e¶BÿÆMáßù:pŽ‚ÂúUX¢è :É *‡^ic³|öXj©KÝÎþŸÊss”&ÓPù_yë_u¯X‘8E+pÜ»ô\M°¿ïj¥T2+ÚëH‚ ÆÈX?
J(Lßwé êj9úsàƒÿØ„µà’m›@±àà¹¹k'#?ó¥}n'¨½»•õ®(Æªðƒâ¶sù#ÇLa%úî-ìCAnîµc$°|hâ w›þöñ¦“ÎÖ_Ù„¥ßïPí'•Ë^¸vQõrƒÏ|ÄZÔI&²bxÒtI½öíž{Â¹¹>+g¦rÂé ùssCVÎHdÅp»ºãzýÛ¹¹ãÈ1Rø9pº8aB“Je³Ø)ÌŠ²mƒâÐ³Ï*Ž³â’<ÞVÔ‹ò¼¸ì&;¢?r;½Q¨½A#'«DüÞq×êÃô9þËb%Ñ&mÈsÜûª—ýU®g²Ò]ˆ5£|—•7³Ù¹½~˜ñÊWöJ"_à1žè\©’å¨¶c$‹÷rÏªµj·‘¡5þ-,ß­âuÌ¼DÙªÞˆDÙªV6ŽI¡½p£½ÐÞ:p;húú/íMí™­·	¦M’’z³D¶öF£/¬¤çæ"m˜T²Þ‰Q‹ÅÎ®-íÕd1­†ÄxhMË‘ã®ÍÖ>ÖÖ?&²akÃ]üaçšpñ·›øuA!ï)„.ŠËL#Êâ‘/ÂgŸ‰€ÄjÝ:“ûðë n¬ÈÏ2×äÂð ìHñ¦S¨Ÿ»ÛÕôá“e°[z-q%n÷Ö÷ææöä&{©üK¥\]„•²Ä*½ãì‘Õr™ý¿´Rà6h {t}$Ñžºa\P/ßxÚË”,Â›‹òmuŒ“Ò Lƒˆ¦kŸ5bÀV™ú]¼XÖîÔÒX»!ÉÅ«†' ÙZm“h‹Wm›Ä+UíI,Dµ]b.4µCb¬(¿n.5Ø'™qv`C¯x[`Š~ô²Mˆø(X±¯N©Iê¨’)1\óÄLÔÖ@}Ô…iTbSXÖ8Ã”…5Ð„•À«þ›k5P~5ÉUs©öX­ä£"í³L“¢¥©—„è¨íÈ%"j¯UU‰©_kÈ&˜-Û•ÉrúÖÞÐ1Ñ5ºÚ«*×™N(TQ¡—J9AãÄ7¥r^……‚R8<ù³ÉÀ®"f-ÌUÉ¶l®òIËçqÈonøÌ3›k¾VQrÕÇºîä×5Â‘ä3ûþ^Ë-•JGÁxrðd'»BôE½”èÛ–áoóØ/z%2´
F,”_>?ñØa@RLÕ¬÷ñ.þºuQ¢ÙÏïâ.Œm¨†Ü),á÷PÎ¶`»Å½Õ»ã³RÌAöbìþØ÷´Fºz3ñh!è(·‹û™r€pí\Ï5Ø«
ôO¥àÌZÐ‹a^”ÎAÜkûàžÏñ~& ëOç
¹íE9K¼‘Z0N—üN<b‰°_@…x(¡ç `]{Qi ßF@Žão¨ïk<ÆÙlCùŽ|G­X[´ f„Ø‡Ue‹&ÂÒÉ"òŒ—7Sòâîað7Œ:Êýl3××M€Yˆn³]æ…„ó¬Ï°„ø}ÃýýX»Ô%Æ75.)êì’¢€g%¤O¾œ±8µ{‘#UÞ{ôëÐ:^uaãÆ“h‡ð²…¡â8´Q…ct[ŽšèÄ÷&É«1†¼M•Ê¼]Iß£Œ1<®ù2¤Ðú 8Ý?»¿‡ÊðÛ‚ãêþ…ÖmÌRRÑÆˆ¹*ÝÆp¹>]?¡<¢î	-éÁæîï!!ŽLÇãÐt0h9õkÕèqÉ`¸ú6làÌ®õnØ<Ø™]‹Û‰¡€KfÔ¼ºGÒ¬Wt%Na+Ô2«R1(Í¶ˆªâV•h`NUZüÊA3©<‘b:	`¬ œ¡}@Äé§˜¤"Î+!_-=
¢Ï°Äo¦vFÐ“ê¨qøq§&:–q¼Ô^ÔˆœåØ½º´…AU4·ÏÀ{#’ÓåòžY]ñ¯ÏlŠ¬K=àF§ñøý^û¯Ü‹2	­Ío…Wø-´—BUÎ.[e«ºÿC´¢~_Ü×XËšŒÇ°…@g“Ú”e|Ãî…c|Ì
éÔìw•ªU­†«ÅEkµX)ÿs©_\-.W­…«•vÙZ¶V­J™ýùÊL$×ù D.pv"ÞØwïŠ4ÿj÷‚6‚ÄÜµojx/y‹ƒZ¥lÀV4ûÊIï/”ÊkÖr©ºü¶ZµÖJÕ•~qÉZ,­®X•RerVWßBÁÊJi²–1m¡T]zù‹¥
ô¿´\Z«+¥rW¿r[KN.tHüóÈ•ÛûªµÐ]v­E?^¯*‹î‚µÀÊÀ¯YO¦²ŠuãÊÊÅDe*ë®dá@û»Ö¡î¦Ù_{f€òqeY	¼f±;4G$Ëûû8!ÀÍ’½¡f£»üT×k»Æ«`õmdšu³ðºY/W¸™{UT“nE\õ5¿þæCËµ—Å5î¶õvdÑGÿ˜Öu½¨ …Ö9[ÿJ"8b«AÐÖL¬$E¾/ÓùæœÙUæ%!ü»Õë™ÐÛ4Kù}|~w•Z®¿7/ñ"7òÆçÒTËÜfù–ó½?ÄkßˆŽ‡7ç2qÓ"€éÊb‘°Ÿì¬À‰è/¥EP©à•±2”ûé–rÀŒš©ìØ§Û+»)ûQZâ( 	ü–p“¡«A­pÃL[Ø)—2·ýy¾ãº3i¶ý_‹å,[ª™ì=±]ÃkCB…ðÆT„åÔš7ÊúQS4­œ›K~³2ù,oÞñªnµ. •Ÿß¥9Ÿ¿ƒ(†Þ;f£k&¨€7v8Ï˜A•0ž¢†äšaŸÙçwÏ€	wcê$í¯pFà-ÍRN†QÔf;/F7¢_œWÈeÆÏ$JœœŒã†¸è0>úA3¢ù^‰@›ñ§e“xºs€ yr]x{pß™Œ¦¹ÁÌMûŒZoÎé.;rµ¤	ü÷Òz-Ç1&¹€åL×¿o„ú= °VJ}æN
:ÁÝÄ-äh~^„§a&<9zKð<~NUèž|Th‹½Qy~•ùÙÀö"³Š–‹JôÏaïÄNç5‚xþ·……ÅÊÒ¢îãÅµH^\YZZ^³Çc®§ º2Î¿¬KL-å#weô[f2<ÅÌžÇ¯£ŒÑý<L°µ
ÈüêÒD”—éB+EƒòâÊêÒŠ¢0LÔ½Í£ÂUÏ‡ÝzLñœI‘—OáE„ÃŸ$ª×øÌaDvu2,¶+µ4¬´\ÚQýoÃ+!†»Ëê¾tø2¢(ftåäw\…LLô:£qm){È9êßäñ^]­,,¬¤úK+•Îâªê¯ç÷‚ìÎjñ¥²£ç|íym>-SÁ{3{ïÑˆÌ>‡=×zÏªS“ž=¥1"YrµœÍ,sŠ$(³ÿ¤¨RY…ÿ¶U.Ö&[ðE°¾h+¶bô·[Šþ4q ,ñ\É$‘òXÊ!S\ÙübB<²&ÄâQ¶(“&¢šåÉT©´+k•^q[å˜Wü6usfFûÖõ[3¨Â²Ë‰=eS„eåÏQOŠ,]ÎÙŽLZ°ÌUÆ<ùü±
kÅbZJ.·–;‹Šáã	f“ÂÍ…U1D¦bñœM‘™O’¸¶$QTŽñ™<Âˆì)¤Y\ª¸å…i.ÖV*Ë± ½EÛÙLÊð9É$r[L.¯™”™}}ÍX\”hI~(KÖä©Zf>/­ÁÓ+îÂbga-Ö:®`Ãã^Òl’q)¡ó’é¶ºj:†V'ˆšÕ\Z©ü$)çÓù%ã3y±È²g³Qgme¥³Qøù6G ¾ezg
âóm2ÖP†>Ê_ÎÓF!7CÀ`²ì?þÎ›Eâõ‰±°¼æVÒ±Úê\Är6t?7»ûCÜ€fõŸe¨éÃž2u–“¿ì°ì…4D…Zíyd5L¢C‹VV—:iQ²¸RmÅ<€°_ínàr&‡Ô$V3È!ó¦²„,˜Ï²Dr›"ÓÕJ,òÖb£¢|âT—ñ¿iEuÿ«ˆc˜ý'ŽVM2É¨Qæ®dª0<oq‚É§“Â¢›_6	•ã›Ç?q¡‰­´Ó²UIföDn‚z¥¸‰Ûh²Ô÷6îZÊgw€·Ê7ÁËòÆ9ú,ºAAÑÇ	.[®S]Z"òÿÏïnÐ€ÁÊÉ€œQÐwžßíçµóø7‰¿Çvö6´ä?-üc1Äl’H	ÖB¾Ùä*'Í$Ò›è’&®¢‹Å¢öIò’šaá­§,·Ðõ‰Ý´ø®yq
	úÅ)ÞºO»8ež]y§F}ñÅ©QoæÅé:Þ(ç_œšõ:¼+ÚÅ)4*¾8Í¬J]œšmUi§X•º8Í¬J»8MtnÎISy"Åtð!n»Xzòõ©<ë¾ñ6òF{"zö‚bõÛÔ€jÉ=4ßBÏUf7#O=2BFÕ‰‰Ç“zœ êë9§ä¥Ri'ÐŽ¶N÷2j÷ä9­¨bèWfu¤mî»V&üô”Íº8BâG»;½ˆ…¢ ²H(r..Ä9t“CËK¨QHFU¦ïëòÔcØCáô0&è.’Kyý3Ã=‹Ä'ùÿÙ»¢Þ¦a üWBP³%!éTú6‚*´!¶‡iš6V•†­B´Pÿ;9Û±/Û	eöÔ)šøî|9û;¥láÔ5üâ´´ ›‚ŠÕ…è)P¡Ñ[ïÝôo˜‚SãÖëõ¨;6¥ù„Âú´!Ö… ‰CËoXi!‡|cÖaqLwÄ|×æo_^.àÄ»oÁf¤Û>ó$Å!.{h¬S¸3Ó†•¦œ!”JS'É[]i¢·Ñ,QT–X–üÂÜZ_fL ÊÁ=Â|z_3ïûJ|(Pæ ¼ž.Œ`:·Z–²÷Kk8È‰Eµ&É 6æþSKÊËŸBÎÕ•R¬¥]?ËüŽÑÙBò¯¼±`£ñóPý]Tá²vâ½<è°hij7ÓdÅÂ³ƒ|ª7$š¸]î?Í¿€Ià)EÊjf2NbsÓ·\¹MJ?îLÛÿmÒO8&Ö‚r®Y|µº,÷«Q@y¹$M;ü6užÄéÔŠµ8+¤= ¾¸Æ©Nœ|Æ‰=„85îà¡æýfÃ(˜ÂÃ'aYî¤qš+T, édÍ0oMúÐÚiU6Ç©OûÐœÑÎ4g,ZEçYöåþývy¿ašËL”\:”µVRL$ #÷Mý3kÉ•AÅ7NPñ®*²>aC¶K;‚íLÑ`	=^ˆ#å@‹ÍE0­‹Ùÿ¾˜ÔS2~ÈŽ­…ËŸgÙ¿k+A¢åÁßœ&»VÈ{Ö
8!>®àòµŒÄ2ÛôþpØž7ÀÕ®çfn‡¶\#¼S™ÃÀ‡—B@Ñêºß¾2h…²F~

M¦5Où8¼…Ð©h¤M¥æ0ô¤®r…ãÄ®¸Nd%\M>”õXì†ˆœå=õ^¥ §ê%/žîbü¾m”Y4"_/BÙ„n~ûdó¥8ù;4!Þg`=®jwõÍo¾Ç²ã&Õé¾Hn™b’œt{åÊ¦{ ´TWËÞZJ€l›NG¿°;š¨Y¨–‡I‹ZÕŸyû'3ïí+ov8;~=;:8ëå¢NÉm±këAsêGÑ­Xª==?¹æÔ-¡ÑSÀ²8!E	f"Ãâã-Bà¾ý6LJQ•ø¿   ÿÿì½ksÛÚ–øýþ
×-“× ER¤$Ó¦ÕÔËÖ9¶¤£Çy\ÇeC$Hâšx Ð’,±*’ù03•žêNM×L’º•T*•äK¦¦*©ÎÌ|šþ'ý¦Â¬µÀÞÀÊ’ü8Ò9–H`cc?Ö{­½VÆÌ4" ;³Ò¼£LWx ¤Ä¶SU¨c*aÚlÊ)°/'Šb;fãc¼íº¦k=) YRUÚÒc.¯«5²Ø±ÑÒ)"÷Q'Ä\ôLòË–µšÙª^¸zÏQÕXPØ?LßRz]ZîZý7òÒ‘ãÈ¤á§2TÖa»ŸgEg¥ZZ­rñˆ˜”Ô?ÇŸÏxÙjÃSÍ2(bReœH&pÊVºæ&ñ•
Ç™›j¹NVpfÓp5=«*´³$ÇæúGRj'N`‘üµÉ(W¡Š9q;É÷ÑÝ"6X5Òâd¡çtÌ¨P[Ñ‹e–¦mFÕÆ¬™c¸„žo39JÞTùÉu9üíná
§­Î.žTÕ·¶¶·`š+5±ÀZ¢\ÞþÎÎîænû¥ÖÞÜÜ>:Òg¦tÈµ¶ÐºÈäIn$ çA~A”§îÚ–‚°‹Ï`2È »×µ:!ƒÒëåµ!†ÊWÅGÊõÏï7ešôp	Ö8·ùŒºß”B}ïˆËvÄ}‹>¶›ñ°Ý;Ïîg÷Î³{çÙ½ólFçuM´Og‹¨ü?ÚJ
\×]"øqfÚ—VÕÅ¸nBÈå–ŽêZå7*ïÞ»âîÜ§ |7èûMé¿a§[}íÞéöí;Ý–ÑéVýr\ni¦Ã{ÿÛ×è»÷ºÝ{Ýî½n¿=¯Û½ÃíÞá9ÜxzŸwÜ%¸Ð¦†åÐL²v¯@Ž·J¹E‘0­PMÌù–ž&‰’'ã¡kbÉDbVöIÉ\^&Öx*°DaŠcú„ÆŒKü9h	ôa`Á?Ü>'™uÃÚÚOð&wh$úÃr”UØË±=²àuÝœî¸geòNLz_Cc±óÌ4Ì÷ËóZcÙ³mš»}ãb·[ˆ¼±yï-Á M½Èëòy!Í°Ö)ÝÌÚÒ’Y@Kè/¬ ñê€$´ñXñ‹ãW/1™ß»ß=]ØÚß<þå`[£á³ß=å -žýNÓž’|éÏÈ;¡ßÝ-mÓôº¾VmöZ)«ž.Ñ±ï‘˜Zw
Zú$è•Ötm‰Üû^ ?oéƒ ûÍ¥%Äa¿ÜwÝ>lÎØöAË-u|¿¶NÃ[[¤ÀSóHê_7|Ò€+ðhä`<O@;Yd-¿³‚ÄÿÑ+ò¢GVY³®í‡æEË?3Ç:JG-híÀ(¬@'ô;ž=4u¢vºN“à#ÃÀp€ú³§ÿd‰¶ÃšÆ›âÑžÝ×ZÚ%¹®¡Ú„2üªi@×,§+^Ñ4bäðåkšæÓlÜòEM¥¥©=ü}ç´Û°ªØÝ:½û¸n.Ÿ®%î6èÝ•új}í4qw…Þ¥‰¸wW+¼K³wÅîN§úÌ?Ñ¿ø;¶‚¸tOÝîE8ÓÈT¢6ví÷½j¯Ñ{ü„5™^ßvšZ…_`É…+B°4ŒšÀÓCCóAH+ù–g÷žü.ùõ{a±,°œpLáPæÆq^¢ÖGÀ¡-’!Ótº Ž-}]¯=^ô¦^«Vàï4>xìHC©þIbÚMZ—6¼áž—¨Y£‰I]ñ¹*ˆ(Zi~‘SðƒüW®hQ‡Ë+x¿ž¼õIsWQ_V]f….jFUN‹L§É¦7•i$kÄåZ÷œ/3ùSÉbß2Ã—–¡hS#Wì–=4€÷Œ—K<;=BÄdäÀ=kl™A!9ÂzsyjhåòãµÑ¨¨è0”ú F°¨„ÆÄÅ«MP6«µÑHƒ®÷Ùæ“DÉ»ê%Q4á™ÀC¢AbùÂˆšä!+ù¢3v¹9¨©ÑULŸ[=EkòŠ²‚ÏÌ^ÌÉh$ búë §™èêÃFBø.
ÖŒ~¦¶1£^n(»äöÔ¦ÆªŠžtŒš(“-Çf”PÞ—h-Ì¦fV¬è4W«Ð_µ?>á&É«!íI6*Y§ïí€ƒ(N¸dv×šÀôÌN fî¶é8…„}>d¨®6Êµ;Ä†Œ÷	èÞê‹Â‡{$ø4$OQ^Ê`KÜµ@Kœ¸Ù ›Ö… °©MpM}“ ¬imBÃZS#†·B¥¼ÖPqõ°aÉõlÂNwL|­™ :Þ=ºcäÉÉØ©úÎÏlŸŽ’5'@­®¥ƒÂÍTê›€JksPwP¡L¤T9ï]L¼'r _Î³4tD¹à³„kÑ•ˆ3CqÈ¯bÈÎ‘¦FåÉf•R¢&®Ô6K¤ð½z^<òE-ðÎáƒ™8@‘§†	ÅÆ¦í«=êÊþ‡~¸é´V3
jÀâÚ¡Bê;Æšû/ç¼ý/‰>ÙTDË<ª‰¨ªîF¦Åmn*;nI€h)ÐÌŸa˜I¨êaŠ6””Î˜Ë¬…XXê²íýSšä}Kß1¾p‰µ°N$¢Ek×Ñ¨3MÎJaêAIŸY{ðcí=/üƒð²ë@ú|%²*¦€|Y‰‚y˜+—˜‰òéµ¢?E4"¶Ë…RI£æ{ÌBèaåÇú¢R‰4èÚ4â)kéÒ8BL£ÂìÇtCÇç¥Œ6¨Ç¼ýþ¨+‚Ï’#¾Ç}i}UçÑP#ô|Ø÷$‘Æ•êÔò*4é¡Ã^–YËØ¤0UWÝŽ™]y@Ä°/&y}®ûS¤Øç£¡ãS;{siéìì¬|¶\v½þR­R©,aù)þ‚,ÃYiEGâ>lÑPLU¦j	•©4ZDª%W£Š^/ÆjS¬Y	ýý ÞXð†«‹—ÿ¬8~`lK¯éZ·¥¿ZtT×^­jÕÆ :ªkðmTZÕêƒjWÝª,—–\¿‘z^+ÂWmùCtþ~dŽ6V\ƒp½—`ÁÅÅÚª|¡¨«t¤¥EÌ×´þìèÂ‡ÕÿÏÒ‡ç@¥¸ÀxUè,uÏ‚¯,:v£ˆ°´À&ú›°)Ò´‘I‹áE¹\Ö
îx2ö5‹‚íŸ.>Î¯èž•æqî+çà[#›Ì#DJŒo Ñ>÷#Dû p«"„Ð{-u¬uà _O’`þâ0j<¸–‘*O‘Ð`£hþ8òðÛé$\GûwÎ°¹¥3kgèb…T=jÁ^&M‡F¯$ëÅDkA[´(\Ëí4,O—§&/\¾KgCŠgËö±o8S:¹Øf³œÒ¡·Î×~b¼_ ±v—Ó×˜€À¶ƒÔ“;wl]‡x^[Zoâ£`¡(è,¬‰Ù£´[n¨ÉÛðD¹kølÏíLüøc‚Ç<»;Cƒýûñ$ó¹“'ø$åhøGðÀÁÒnˆO<ÅØæÝ«EÕ§€Â±«è6qÊ°¬Æ¥íØ˜úºyÉµŒÊÔ`£kÕ©aÛÔHæ²ÏIQeþü#ofÇì ;u›cà"G]Z­a©ëÃ;N<¤‰Ó·‰0NÂïuã²‹5 ¨ýáÅ‘ìrO{óòí[\¬æ»œÿ’Ê$çôÃÜîýIÐƒ¥HópsïöÈ)=Óöm1™ÅÌ¡Ažªø\ÅX!¿ñ¹*^áOÁ[ž{Xyþ½üžÕ¨Õ¦í|´†I¯9¿m~°Ì@º-9Ôd…QNKQeh³ÛhÈÕ
©b®†ã\­vó´Ôó5kHÎzÉm;Ë³ÕRï4ZD¥ ‹?D{&‰Øø3K–¥ÝGŸ¯ŒLIë”†EÎî5®iàOŠ¶?ÇZ¤qàÇÑÃkŠ;96‡§2ý¹q×2ýÉoýaÃ˜áf¦?³”GüÉm”w"ÅñœµæI´4Êt?ý™é²eÌã>ãsÉáD‹zÍ;€<îeú“ËÝDr8ËXŸù}b æi;°Ìã4Ÿ˜é:dç0IÑÉá£?×3FõŸó‰¸’t­ÐŸ9‘&Ý±Ë–æÖ±fær¹¡ÙßãÍ-àÍ×,	Ÿ6ý™á"¤?³<ÊlEf;%ùÒÍtMF=æ|w¿7ýÉí¬Œ5Ïã²d›–Ç_ÆzOs_ÒŸt'&ýÉ¨sâÖ¬3¨{>¨Ms[ÓŸÛ…ÚïÎá\§?÷Pû@mÒ;OfùèéÏ,O=½ð%®»ÞÝ*0÷sÎS.Y2Ð€%? fÐŸY¡ô'_ ý™WÍŒ@ò„$ÐŸÌÀú3#<þÜ9Ä¤,Ð5zÍ¼@ò‡0ÜõZ¤`DÂ¯z×£Šz‡YAß–; ÊÖ>2,HÇHñ°µúh–tÂ™ª¤U“˜ÀCqÛƒý)÷<wT¸¤'Õhî±Žeáéµ%ß/N‹å‘9.ÐŠQ¹ÀÀiA3hw¬Â¹óß7ÈïGð„d\çcæ	p@¡Ù@¥^ˆ¦nÏ NÑT‡4%3™hó~Kêù‘š$©g˜žsq1pÈàGNëÙþUÌÄX4Þ.¤>Sˆõ§_]	W\gx¡U=W®Ý3i—Þ1¹R¤Ç.aÈIÖðÄÚSÃƒ­	7AÀfùqÃ¸hV‚/ƒÞ¨ÄyA½ñ¶B&š0)‰ìÓºšú‚8Ý˜‹S½ÉÿXÀDšÊÉºÂgR«¼	q„&3q¤ÂÎÓü
(ÉÑs²M}Ômò^×Ês«¥¤NÁÊÃÐœö´Š¹éè—AéõãÚ‡Á}ú.O¾TLˆ»lhÑ.õøj#+xP¤uIBšç8Gòž1qx¦Eoð¥Äíd;;ì'2Íœì³¼…µŠê€u"¹HMqj|ØÇEä9âÎ9•K,@8}OcXØ™×èPèQ0éÚ®>+Û
‡!9×y°~j"ÙÇuN£ºöÿôßiºaU­¬“òFâfÔ‹Nh§ŸuWƒLM2Ô£OcÌºÉ¾ºÎ&zíI
Ž^aa"%¥ÄpañVeo|´“!I‰yó³Òžr˜ÄÔ2!RÏ	ãø†ÆàŠô¹¯äðoˆÐ6AmÖÔÎˆøqBeÙ>ƒŽÉ¢»ÂrMÖÙZÛåÏì#YNÂþ¡i1T©®¤$ñ\­T23I2‚‰1S$Û‡þ±±ÓãúÍãzµ›ÃÂdGCŠ:š\fPÕU@µrÓ@Å!Cß4Ž…	».s‚öm¾„k,EãLüK¤$ö£ ¸ÙÞý´üÐËYéñJhwM²äUaÿ4.vø"s±Z"¯˜j2üÙº*cØ²‚ÔrTœALc»=›f¥å±¨–	'ÀèÆžÝgòŠO“ -¸,›jfB:ï¥ÕF|è”$ÖpM—…È¡OÜ#†šÑö%N"ÌÉL/ S‚ž¢ÌoböžX³äzÿRSbr˜ƒSâ
cW³™öX‘«("¤3¶¾oË¯×hNšÑ©œð­Ýý`ƒ®a"'m‰Æö•öQ ÎNçÃP¿‹R¨€š*f³ÓcµZ;JßæzÚÀôµ®Õ”~`û4HÑ(LÍÌ Á=ìeØ×:¦Ã¶)Jí”‚h*†d$õð`E<›¦õ K¹]ù0œu’/Fú†ÖyZàüàŒŒæyHæ’KÇF3š§Ö0Wú%e¿F½’žL'(†ImAà‚ÙÃ7`I¸EétQN¢T¹™¡ÍÎr>l1ÃÒªÄRÊïI¼bNÜ“)h<WÖZ<'±´C‡@©
|w ¦KÕâ¬Ä\c¡²¹$á¤üp¹¼¼ÚÐµ¿ÿ[­V®ÖTÂE»,^"†Wm4z/é‘’dJÈE¨¢B˜Í‘§Î†MÂ<‹æ°îÿ¾šøZ£Ë¹IŽã©Û’µîfpCôv\fŽÙW˜ROÈi7‚Â4U0e–Çø:í(˜ˆÆüõÄü$ˆf=7º¶Ob ›.JrŒ>lbž¤SÌ’\®oeÒXTÞE4²É‚ «ñ˜æš–+€ž’lx,WÔ&ë*ÄY©®6M[#ltgâù®WbVdíÁ¥»®ƒeÓç-7@QÑ=†œ´à	|ÎÓ±êcà6&n²e®ôþ«õÿýÝ_i»d|ÚsœEá@h,âj¼Ó‘xn¬·ÿ{Û„Áj¯¬ Fhw´Â+l—ÕQÏE6%÷ô?ÿŸÚ6®OÿB{N´¢Âi•Õìi0¸ˆ÷ô×ÿB;t/€Ÿ¶ùíô:ž=ò]'6”ÿ®mL¼>€À…ö£5ü`Za“6ÌãÚžÜÑÿúïµ=¸¨á¡´2îÇ’üýÃ¿þÚËÉùÄ» ›”ñ¤Û±ÌøþGmË²ÆÚ+„K+ìc“¬¡û´ˆÅ:ùçÚ¹¬=¸ËZÃ‹SÃÿáÿ·Úžå:Ú6%u°zØ$k  Ì¾%à?ÿWmq`ªÝ1»Öè‹5¶ÍÌ©¼¿ˆÍãße½¿Ð6 aVæ{ßcü¶9°<v}Ä¦Âi–‰/®ãv …ÅæõŸþ›v„¤F{e£™t¢! MØ¸8»è”Š¦§2 à“w"§±è×¸È}BÉm„naA: ÂŠ)â2ÚÎx„úzÏÆør³Ó±ÆAS‡åê[KÐe¢îió$Ì3W0kçØ…_”ÍXóºòÓËav9úÜÈi9Ö™¶­éZÞ“‘Ã:XN·eúN§ù%Þ;-¸˜=Æ¡×2ÏL:Ù)¼wÈ¿òjñÉYáÐ+NÒÖì¶ý-30O_â‹§R<?]>±<…Â>ƒkŽ<<ë†Ÿ_¢ŸÎù5w‘ï¡=›|™~‘uÚZ”7£'¡“š<bÑð!33ÜÐ½µw„i¤;@–ˆ®tÓeî„ZÜGŽB´Q¥Z,šò~Ò¹3áòt&¦k›TyŠ‚XúA]”ÅnÅÈ ã
Iã^ÇäÚüÑöíS{|[¼â	?7ý/t™ÉØé!êè·M½ÍsRI‚j2žnö&¨§'d´¢"3¢¼ç%u…MO4ŸÁ‹FÈ$T"©ceýB°ð‘»+a	?ú¼ÈIãGð„@ÐBz}cb8ÕÕoWIíû“ 6Ôi<Ç“&„ÇÆC7÷mºþâ^
'r®Â9+ˆÿe“˜‰Ý,´ëZI;Æø«|ÔÐ6Xü)[¦D¹z¥üÍ?£=i‹¤Ä'ÓCÑ²ú3;$®byÄÿ1éóµð˜ñ,ÞOäq–ÇõoØx„.nT‘u=¨uß*Q 9¼½3“Tã¢Kµ•ŽN‡÷èD”Z×ƒ÷Ú1=åoþí€Ý ~)iËZ‡8gñ¬çže!Ptf)ÞùË0ì{¾•´z²û/Öp*ðþŸÂ ª—nßÕ3ÔrŒù‚MöZFÝfôµžôçÒêÌÁLæ¦«§ïbõ¶…ê.kñú!Ñë¼@|Ø†*€¨ÀáUÖâÔuß‡-¾wÜ3@èf/OßèDŸlG`ëBqâÔ*|ã®“,Å/ÑŸGí…Ôåa’X )æG~pi[­V‹¼`]—ñ‹9ClÃâTé¹õu^¥RÀô¸{2^ÂEvièÓŽ6T89;Yá ÈJ)¡/LŠlÉÔ ëWÌ‰ËÑ¸“fye)ÈFDR{_Ó§U½|"j&êyéIÂyÎ—,L)'’˜6<§Z4îZ—we#x\#Ì¨ÙÉÕÃFE2˜óu£z3ÒÄƒ˜ñu£çÁ§ñ¹ž—°f)B‰Ò;J„œÁ©.G‘°nÙ#0Ûuˆ•Ï
ü¹ªbÓ/=#Ì'´”`pëßÿmµ¶VÔ³&Öâ€*ºfxðÛð	±dî0Cèàï@0ñ}rÜ¾ö÷[ƒ^j¤—
í¥F{©@/kØÉ˜5–:¡ßK”>àùjž¯³QTø|Œ¢N:àZìà_þWmÓö:(ßÒIT*â$*øúFïfòþJÛtGck-¬á»+òðyu¥¯¦Ï…\zöÏÿA;úu‚^Q7¾¸Ê^\%/®VÂ‡}ÒìÓyÆå>ÑmÏŠ†K>Š†à¯h¼'WüâTæ'¤z|
GQ(9ç‘ä'å'g‹‹=~Ìä,kYœEptªyLhºQDÁÄãzò±˜t>B>åf%URB%??ˆ[T’…»ÅÊd1R±RQ†P&«§ü„E´‚n yŸõk„Ï©èÛl ½º²ƒ§­•Š¬V[ÏÂJ»p{/(ÕâÆ¬[ÙK~Åö»–ØoÊ³³‘àf&«õX\S©òq¾Ù>kUW3¦k;¼¿<ú"çû(áH7»­„v·ÕÐî –ªLâ:|‚.iæ½&_þÌÈø‚œÇBlDãŽ±±ç%°Ñýv±±ç=kÁ¨Ò§‹eè+ß6Ö"+8 X*6º÷ØˆØ¸é’púCÜ8V´tœZfò±ø¡:·ï'ÂòçY«ÞX§ñÂT*Õá"ÏZ×¦7f"#H*‡Šô9Ý+á¾ÃR÷ÅÂßw7,ú›#¢eUÅQTE½%ÕjÈ©‘6!I«ºè‚¶„a)½*ì~œ)à”­mÿòŸ¡zj±
b4Îþ²jgy»v-;Bh„¸‹BJÞ¤j¸+Øv¸§m˜^ÇíŠa¹ªÓÖ%„ÖY.LË×&Žýë|pá“ý@GÉiG|‰/£Ðœ:ÕAaá‡˜½û1a
Rð-jÓŠ$SöƒËÖu!RiS3Jø¸|M-%EÕ‡QÖa”õ±~I-†(–¸¯ÃPÄï0ÄwÓbvlHx
n|.ñÍÌ@Ù¯†Û½ž}ÎèÃtb€ØÐhƒO€ãv·ëkR1TŸVEäàLÊ~ovoŒw¿|0Þ½ãl0Î®ù‰Ð¼å’z˜4'âîe¹¨ãRƒæ‚mž¿/,üz3ðüëLx¾58ý57œââ®‰G;#º)”ETý[>"A#“v·¨‡ÆYÃÃ™ˆói²Ó¼ÓMëyõÚ·œÎ…ö`*›²„ÒüÌ1|d¥ËðC+_^–ÙŽ™!oBrè™ÞxrF±T­Ç&Iq#é„o¨|"]jPè¿S¯KÞ<±ÖßmhTƒÒ
.O¬rÏöü _tußðòô¡¯x.†*ßbðRcMq$\yƒW@7$Wm' Ï]]Áº–1ŽäPûÿü³öóÏô—ÈþO¬ÅEbHü¨FÂUÃ8Õø`<*>VðH°êâ¢G¨wqIÃKß›…±Sxï|ZŒÏ_zp‰¦K¬R³ÿÎ€q£ÛúR|óÜRÖ1ƒÎ °˜Wwh•-ÏPßÆ?°ö]“äžçeŸYšCûÐxtjñü‹E"XÓžnóm¼|Ðöóà’­üúœÀÞÔ9¼çõ5.£
[O©ã^S›>nõ¬ê,aGáŽ¸a/Hà3hÜ¾Ý'AL‘M!ÓE;ô)#‘~ÄÊÝñUÌ«ÏßM\@zdÎ¼„/‹6 ‹J*fTQh7ÂÙØÆMNÉar­ðO~TÓãê)­Ã(yx”ú™lo¤`{I´Êý²vh'§xÈíaMolí¡=ÃK|=h Ü½h¤Ñ‹5B/îœ3fHín¤6'€Ô8€L2 d;€la(j€É"D¶»“œ¼%pÐ¨:knBX ö«¸ YžHÄaRHyŸ)ç3 åZ‰m>üXi¹„>	ˆæ7‘`Ê)­\ 8Ÿzz“„ˆ?XÔÚ˜žÉ@æˆc‘SËŸà~•ÌAPÐ©ô¤Ëž´Š	ZSz¹’õÖ…âÉ{'FÁSB:¶Å›Rä °ñ44qÀMâHÆ}ÓâG³®¿Zä8Ì-­éû‹X©—8’OZ'dF¸¥…¢+uH†òiK…Iß`ˆ^Bƒ®YbéÄ(ÿâñ×}ë‡ñ‚›öH¶Ó]{)w«kù#. ¬#YS˜·ÎEó©Œ3£)>'v©ä¼x¿×Ã< ó†˜Aaa+ N¦ú“•„Hð4@Û
ÖÅ$Y*È
"8ÅÂPóÀS-Oøêüó¿ø/Ú–göûhciW0AÃÿ¤íx–En‘|R³ìÊàïO57ä†4Ás”5yìE/\ÏþˆFÁ¡Vø¹(¢G"¨§Phû­Ÿƒ×ì@P‰jú›ØIü¶_>Y¾‚Ñ>¹ÏƒvÆÂmðƒXã¦^•)#Õ>
…yñ€BÎ+jÕ±:OŽ<L5@Œ–ø²\.Ž{eóò¼yî0¤‘Ó
œYC9åÒt:UFá|±`7S?ò*…_fA”—g3=Ÿ®ÜmAÔ¯yñ+ÄíBT~`¢ð}~€O‚¨ÛWJo48q§Ì
OŒ^–‡¾æü”E/i´::3ÖÇÖÓÖšÄ¦7,9ÄxMaúÑ¿¢ãÀzÖªgLÖv
õ5e|ñ—0Ûyâ‹×‘ª¯q"šdƒC®ÆÝ‡×æ<†3§3ëv¥ã£{¦I‡—¯«—u@<þ>°F oî`™ï­˜žu»Á_Ë0Êå9ƒjpˆy£¿¾·rÑ|µ¨¡$ŠXÀÎÝ³€`U™,~Œñ€ê·Ãv€	¬ÔÓgL nL Ê¹ÀJ=Áv2¸ÀÇ[à7Í²|cw€óŸŠòÇÄ¹ºCÓãPÄ7£óeópøZ¸·$Ë-óËg%ÜÆ‘’ouŸB?¸´Uí`®­ªó“—ª­jgœÁÜ¼Ó­šÒZ‰·-`[í¦9¶sh”Ó&¥ÍB¢Ñc)—DdªÎŠÃŠÀC7ô9~!yL>5À2Ùç#Ø>•öÎG’AôôDÿz”Å<žx#*."¥©o¨ÊV¬ÅL›{Ø»°ëz{cSg—……ë§èß„ßx¿ÅCÏwÜldô¬  ¢±-Ò¢BŠÆ9Ü…? ÉÔêEXÙòZÑÜ·€U+åFÑ BX].°Âü`S@¯#zò´€6•½@eS©jUÓ¢l$‘Âç>÷–È—(WÓ’)?‚ªc
«Idø‡ÿáÿbçå¤°=mQ;`EùÑ9_OlÚ6~!58˜¶†«‹pkaÌëqs™)´ °”Rbqn$Gº0Z¥¢cM›“#'1HÊ‘žÇŽ f†¯ë_XZ9]B†ù­MLíì™ÐŠ­Üv‰Ï˜YÜÚ-»dV‚Ôo(2 3ù‡YÖo8r–‘ãšycer•Y³G}x·ïuš{–T¿Æ­¹§Âln$àßv&ŸŒaUE$5‡ Ÿ!<kcÏú`[gºáY=Ëó,ïÀöÉòKüÒl5_”# i~%(¹F†_¶n£Øt–èWÄÎÛ<ð…0Ñv÷Ö!ëâÑíˆUÊÉB¿‚~!'gXÿI©a?1±_Tªïº™ýŽ/Ænß3Çƒx¸*û¥g÷{nú_ÐB÷Ÿ”×oÎ-½‘tdwÌ‘=¼ É,;k¶4*‚dŽ‚œi~sÇ/S‘¬…|Ý¼XvSÙ~}’’3Ôâ‰gž:Öòì]d_+{f—$¦E'„-* #žÜ÷á±=‚ö@®9tG¦óÐÐÈCóñÒéY\pL3K^]ˆ=˜•Aø¹åz}ÛTôù“éx‡¬UfG ÎÊtM1îDçQb\öötÖÍ‹žiƒÆhû V_@ÇéÃß†Uw=,P·=´úÈ´ï ó-›¶óÑfö}£ê.ô‰øÉ0` <–dèÀ,ußÍ!)v3*Ú8'$q¬ðcwpxØ­$ C!'y.kâ»ˆ	i½…ý°Ÿìjò@æR¾„…®<3x˜Öñ¢3¬4Vi"U˜ÂG2{ÞŸ=;½W6J–I+Ðæ™=!ÉÖž{n`ùï³‡{luZAz ³ëcÏ:tV ½:JíùÅP…ÔÔ›gõû£åuMÇD@u¬©€ðÒêÛ˜¦¡O+°‡f+Vö!l€“á[šµéN<(*`?L•}3´ïM2¥‚¸|æÙ©lé¸€HÑÃ™úlx ïûä¹‡iÝÃ69$BkÓ¥-òs™È@’·š™ JZŽßœY 4¥â(Æ.ˆz<$µ«èóÙtÆ%ôw…€ÅÃMóƒE0Y†k
ýÊ5Ð—ŒL'ê¡8Ÿÿe&=b§·ÉQ.îÛøþîÓ~ï=mUå¼
bþçŠÁ<!p½TnË»cŸ[ÝBµXü“Îë•þ“®¥¯æ>\ÖàÑW°sùªÃ„ˆk
'Ù÷þÌ?}!þÌÏž¨”Øö©cYáS¾+d6½x<á HÄ~Ó¨l"*×Ò— Q¹ö£r™PûJ#>3&oYi}ÔQhZ?ÄgïîñÙ|^•£¥bø¼úã³ø\]I_L¾òãó*_YQà³—Ï¿|¾tNÇæý˜°nHóæPÓ+îb31pæŽ"Z¸×Ã“'á6<ÏÊ³ñy¶!-ZèVË¬UF‚¯¾è1½FÎ ®¢Ÿln¶¶É²1dB=*€‘wÒFBLÔªíkÛ¸šV—µ¢å‘>5®hƒØ†¡ÃÄyr´ðVãD†ý”³YrŒ‘èüzpyÆ*ˆÀ[fÉQ5„%eV‰Íœq´Wª‚ñ‰µ@n^ÇÌMÕrHÓüóßük-fÖñHä°tc'GÄå´jÐ'úm@˜¿à¯þ]dí$ÆÎ¨ÿl›iÔùŠÔy­Ü»'è©å—|…ñ§ÚŒÓúþ×ÿ7µ(¾"§°Ï,#WÔmCò§×¢þ:Š¢A”þ2	RÃ=á+å`3©.Ð¼µw>¡Ž,œèúáØ	öáŽ~óÅ Â’Pë¸N¤ºëHQ­í€æ¤z'Æî}ž,ôçÏB/Çe§»¦¬À~½HÝÛó¯ßp@”Â5ó,K)‹iäâ+Œ·xõéyéÉ™üEmÌÃ w·H©NÍZZúi	éÙ®™ûXÜ™(ÑÁ]íºNÂdbÞ³]@öIPQù½uá~ŠeßÑ9$VíÜ1~Â¹P8wðTõ^?º|ŽG—Z­ÊÕU#Ú”<,¦ÅyÒ‘W¸œª„åëA(h1	M#q‘Éz¡2MN+	1f*ŠLvˆi‰1JKIîÒ°´\<€˜cÊVÂ&L'UH\•Èr,–M½ rVƒÒBÛ~|ËiêâfúÏvÞ—*H€QµM¤y¸Í(ƒ6´ß[r8™^îeÑ(Añ80øL’§Ã_’´i• 1Žæ ÖœZZó…€Vßµ=@€á…DÞY<ò³‹û¦ÑÒêe ¥¦“­Ð5ó)¡é\ ½akX+·üPæ=3 üÌS öcÒrÛ:à¤'õ¡
g$‘	Ü"VÈpÎÀuÔrrûÏ>„ÛË£™¸v>?¼{lÆ8R=ôëÍâß 3Èl|Ôm’Ïì.Î¾t¶4°»ÝÌŠÉÅï6ÏJ+aL ‚WK+±WÇ^'Ê~KUdîÄo9×ðècû02W:LS+kG$¾Ic.GÍ#¯<´œ~0ÀÒ­X„ Ùèõl›@ÆðÕùMœø¥W¶©,
J4Ç-­(t*YjY%Z?N—…ÂOdö‹{TK9Üõöp˜?Zö»ì%ˆèt8ò*IríÓW@`ó,9«‡aØ°úB¬ %ÈQ91ü
ïÇëjÌX»Ÿ¤µãÁlå¤ÚÚó…ã]hëÆ/Í´îy¼zHA7w"µ6O}w8E@’.`ëRM+EÒà¹Ò}¦^gb‘Žzü0AÎx“èÊå2·ŒnZ²5ô7~šeXZúE´„Ñ“	ÖöÉ[²óé0¼MSîD0d%s2ŸìÒj…¤¾,b´XrÉïxîpxjŠj¡Ï‰7©‰—6*Iƒ¾ ¦ãê¥"æÒŽdÖuµ–$j”aApÜú¥L–¦_ EåAsh-,à‚ù‹‹üS9ðìQu<-8rZ¿...„j†&#€¨¼
x×‚–”Fµ° I6†¡±àXa\Žœu1LVdìk±TuhEHT˜%8IŸ—•ôºÍ­Ñ}
aS„ëf(”bô÷,93‰.åiÊ™$3Òû-§píxJ¿s‡+ˆÎ„KUÃ<÷½E
47ë¹Äëˆ³Í;i]ÙòN^7q:0g¶ˆ1½|Fx%i^G¥çêêÝƒKbj§µT¦†F¾‡ÅUP½7 ŸfV…XÍã’'kÌÄ’J™è4•c¸¹ôëšà(UH¼HF’ÚÒ-Gá±„„œKE”-0Î‘`ªlzÎÕ•¾·OŠ(înqo«AIÇt–S‚Ka@1Aƒ‘¥ý8<(HzýK¥ÔM¨«#ç¯Ñ‘œyæøš]3òx»‡›âŠˆ¾\Ö¶. ~íNhÀ`Ï°lW+,Ûu
Ý–>°tƒBý®¦¢ÂŒäÓýij‹tf¶í(Hœ/”…r´Î+H*uk4QÉÚ±ÖõC7@â1“|¾htÀ“šZ—F­‚¸¤Au­òÿþ´<"*wÈº{°}¨ä+«¤!û’nþ±7Ö;ô¶3´ÇŒÂÑ
xÀ9(ò³@¡úø¬šatš}À-o0Ì>J:Ò^ÿ,ÇÁJÜUÙ©>–•4qRéãŒYÉ§m,°#¾má¹ØPO„*‚-$Ç0‰Xª
+éOÉ› ³R†°Ùûª ù»=M0ÌanßÖ
+US7Æv
b³½àÑ×²EßJ[4#¡fÂ …Ôy¦õn©O]xõ‰µÎ@Á.ïxf­¢×'•Tˆ|¯ku?`økä_ªåó¤íŠ‘ÁYõà²”‘hlïÓ;µRy•ß¼vTëÁ–ÆÃ“u îxÓ|ö8aàËk5‚ê7'ä<úêOxÏ^(	G¬éQhÞþ’û¢"åY7lÇ·‚fÅ8#r§$þ/tc@Ò‡òoôXöŽ C¸@áª¹±¦Yl@Û61&¾åQK	¿òqöä¼Y™æ<‡X°Á¥H‰Ž’qÎ„OþŽ<ýb©à¢4­fç%B}‚ïÄGrL=R.ò¦jxH@‚b^v·D˜XéPÝ™Þ{-´mÝ)eÕYc_9ªÃðØ~”,²!ÌË'h}KÉ)ô=ó‚†üSPˆ÷i›(er‰V#i]ÏZXQ_'ëÈƒÂ{„D®gv-44rti‰õï’lð~óçÀ€¿ûìì²íã™@ôÓ6·‚<øY—Î‰+2Ž‹*î©¶†TxÒNQõè€êÌíccŠÑ˜q)r‚ZdÓñù;ŽŸp¡ç‘ôÝ‡ 1L|¼ì8xy§úmàS&$‚«T«ôO˜™árÜlž›»©)¯+wyN"Ñ@Ñ¸¥ec—7ÑÐDÞ€Ž:kkæ°z/¬óGz½®'VØé2¾…ã¯ág;0z^ñååF2wD”YD…À‘‘†®pfìéŒLÓ"ˆŽ„-A°'£D¾™wÕcÓŽmênÊ~t²wÂ@a¡O˜>ÙÛ´vÓjED‰BÁ²[–_8Á2^b.}Ë.w¦×
•"Öú*‰e)Tì%$Ü MhÞlPótÌ,}N.¨Õ‡Šèz*öcÉ·™H8ÇcÃ@+Ù¸ð±´œIOÔë¸D”£Q©ÐÔÔè^¯PÚ\"ò)¥ÐÍä3L€ºPžµÏ´ÚÄ¬j‚Ûþ<fœ
ýïÿVš-Þ3Î–Õ­€›ØÚ"›Xz÷‚²¸ã&Ö'1¾…¢±ïahH¤­TŒs§Teg‹¬HÂ®)ôèÁ”$L´&‹þt¿£™gDÜÿ”ãØ›ü®óI“Çó«8ûG_Ðìåž}¸õ4A~žé»_øÞ¿¸ÆÞ_söÈÍ*_Øæ¿Hž6I–¸i[^WÊÕš5é%J±¬0ÍY"’[—&ÈÒ¶Cün,Í,#ÌÍ–³YD‡œ“vô¼?TËÕÆ
Ï-ÔÅŠÅ˜ØlZ‹K¥’d˜Ž‹óN<‘ "7Ú‰˜ÖÇ µÕ˜´¶S½¶^b>¿ÏÍµuÅ6
ÂHÄåÔœ³î“-‚nF, ¨ª‹º_Õï½p‰Ðo8F¾Ùs½QóLTåbBƒdqŸ¥¸]U!éà1«ó:ïz¦ìª@aPÚG”òf2GWZ<Q<·éå¨ÖW+Ùù»Þ]ß’°M<B¾ˆ0ízv`1<a‚V`‘KÕ5Vqý·iO	eUŒ›¨eÈ©´PDM¦‚JENÚõºxJ }Eõv"®^ Í(²ÉC•â—30ºÍ°5fXˆäCN¿!kÑ¯^‰=¨xËŒô‘¸d5#oëÜÖ B,N,d¨iQa#2Ö¤›sN_Ú÷ÎŸx˜ÝV*aœQ}ÍÂâbžé²¨Ü–l/ò<G 0ÜWð,+N’JKH¶ ŒfaØs‡ù2¢Ç¹ÕD:b-D)Kxù‘K·ÛƒVL=6a•EÍ Áa ûDjÍ.H¶PJ¯`Ø@€ÑÈêÚðòáE9Q‚Ã$°W¯o9šh4–§O`ÓyyÍ£="¢âu-–i›<_˜É,ºÖ¨¤è»{1Õöw´íWÛ‡Ï·÷6™µ¯Õjlâ7*t'£q`ZâÂ#Fð«%`@.0Âé¨íQ1)/Õ9  {H`ÅØã¦¦¬Ya‚[’¨éK0Ó¼LaTé1¦cHLJÒ$R]œ?J¤‚2¼’Øì2hî˜Šq²k@òžµž”™bi~3 y]­‘ååü-‘‘©ÔG È:Æ²ÅŸxŽÙ˜6®ËKÉ4žS æ<@8Ú		Ž¯KË]«ÿFÞ3:r™4ü€«1£˜t*+l$lõóÌ‡µ5`§I©‹ûÃr÷§cõó/‹›ôÖRmÌ2Q“p:äŠTæazú‘¬sS÷J…ãÅì@B:Õdq†ØáôÔ(´,¾<ÃhJÿj¬ÌÈæÐîj'N`‘àµ/V¤´’\×z‰â	¨³ ÔÊ÷Aœ‘¬É(?þÅ2=4×*µ`@mE/–»°€G7ã¬KÖŽÌ±r9Ø¼Íä!IxË™æŽÂßî®pÚêìvqm¶¶¶·`š+5]a­
Azggws·ýRkonn‰É ñ±B,JB¿º®à±½˜7^‚©Ù‰ó—_BàÄ·£€¦°Ð	¤ÓÓÿœÃþÖ4Ðûx…ûx…OŽWÀã§7±ðÄÆ]÷÷éÔï…$`6Ûo©clÿ>vá>vá>vá>váËÝûûØ…ûØ…ûØ…o>v!ÍdAy|=‹ûø€ßT|Àm`ÃÍZ€æ	;¸·ÝÇ#5¿Q»G¸G¸Ûx„û„¯<Aé|½F¸F¸F¸F¸Føí#ÌP‘¤ãùLŽä6S—?¿W¤ñZ”[®çx*ì3ë-ŸÇª®‚2êª|­t¢¿lò:ÙËµGJ^$sa´:q#m=R×uˆÉI{®ÆÓ™PÅ“jgR6^}^J%%	ÓT‚Å+ø$÷1•¥ÅßÑ[§î9ênÈdPÄ–5´´!Ö3ø°†(ûÂý1æÁÄìÃî$O‚(Ï*Ïuî3¡7åÆBþo<Ò’dóŠyÓsãÂç‰¦¨òž7½Tø"²¾h	™£–en±‰YuÓÓN¥Eò÷jûtå70¡žµÌ±:…×º¦aa€jvÊ­”‰û	Ž-ð˜4ê%&æ= Æ'dè×È˜#YP„A”Ø°,éœò¤„—AŒ¶®ÅØUA70ãÜ0 •ZÏÄ¼‹‹…žêñê*–ô±E’>£Iº#; Ümj ¾“†Å(	ô¼¹ˆ¯‘„ØŒ¹:ˆ_`Y‘3K“ÓŸ5T)ŠVÊ£‘ð)§ƒAÛ´XÍ§YÙÄÃ„F#11h8Å'6Ç:G Ô­ÍaWtÝ Xzvø}„œð-¢=0™L©!¹´Óíïcë¹¼Ù§pˆ˜L;™1fæ}ŠÅÒB3—ÙþÈ©ískX‚±õ^Ã
Ø(0w”÷IZwB¶—|–°ü`kGë`µñ¡¢Bôöç‚Õf9ÇZÕæc#˜}@ŸR’íëí¨•¾£Ü×Po¨½î3íg4ÀÞÎ-žÇM¿©\y$Pù€œ÷ó-–'ûïL@õ„¯g0,ô{yÔWÛ×Ý‰´­ôMÚ6¦[«¿‘£PiÂI4þžNì!áÔ0tÂï{ ”;ØÛQP¸d²ÙÌ ÷Øuz¶7j’äÉ¦Ó±†MoZ¼³ã&Nh¢qi;°Xæ°yÉ} •©Áð¢kÕ©aÛÔH¤¥X,14FDsRåÍlŠI&Q0&¨…Íïzîurä.ä ë%Ô£Ä4Ë¡C§b\4kâŒh“jØ jÉÐÙ¥?Ïá´ž9
G¸ÏÆíË¼ ‘|A$…+Áq7µç‹—Ì%YKkyª)ž•ª+èµYÁÍ ª%ÇXö¥"[±fÇ.ž–V6sÇÅ{Ñ4¨©äì¡Z€L‹ˆd}V›IòëúÓ#lDŒÑÆ,Ö’Òö,íÂhþ„}83–4s„µ;ôQª	$òcH€p¸#JP°¢¬kÇÛ'0½c:Ž`Ý,âXe}–ˆÃ 0QwN­xWnö" ¡ a€Â™:W=YKD)Ç¤TË+>QZ¦Šh	ùZÞÑÐ–*†›8‚_°.Ì!ÙüPÝÉñ.’cV´`&H¥Ç†íéX¾À×tî”<ƒ,~#äyÔÈ³šA¾:í·žù×¡Ó ¼|t:TÁílåf(õÑDeˆqÖu—ïmGo†_Oá•KÏMÕ•hU¤}ÛÁÊZþ1òîÏIßWÒ<’¾5²cÆåjoÑ <™Añc;!Ï5AïAuÀañ
'¿J^áö€Ø¨ÚšòÐ'2¦Ý™'#ñ ÀBdÙI¨1•çC¢¯PBJC¦„{+lÑ~ÃŽê¸ÞÈf,ø?þù¯ÿ­°¢ç:ý.*î€Bèd	ƒ<³‡ZÔ–‰Ø7°F¤ôFãqž/(`¾Û±‰zFJÊÀ6{L‡Ðˆõ[#¾{É%<ŒÚ *^}t;Ãn‘ÎáuM‹Ïºî{àG;5Â»YÙ0Ï»^@ëbªr¿LF¾*fŽšIò4íJüTóq¥®—Ÿ·çÉ9‹é_sjBØi\¿Í=¹œeÖrÌÔÉÎÝší>ÄpD$ËÍVTÏO70ÐG®!$n¸çM½¢U´ZþW@PÇö:ð#zb+QC·;3Gz}Aÿz]§³"MéÅäÄŒ.•ÞÐë¢™ÝÄ8sÕ;V|ÐrWÝ¦þª®Ukæš¶Ã¯T×Jk?V6ååÕeü®ñOÕÚ þqTƒïµÇÕöjùñJM£¿ñ)ìâE¥SÑ–Ë•zM«–«ËhºË±ŒÍ–×†Ë¥Zy¥¾úQWÇØì(Ö-0Š¦D|ŒØše…È-A§§ò#Zó ÌûC÷Ô1ZÖôZ¯ßœ²jŠß(ÏhúðVÈ;štPÄlš _’;¯]cø¦µSžøÖz·A™r7«ËúÝíúWW¯ß×£-5]¨ÂÅ‰Ñ“.bžó+QïË1_t(¶Z­ÇWWùV+Æ)}É+µ˜ÞY\txÉ€ÊºÃMÇ‡­g‡e6ëÝ.<šìÚî‹MOx€á0öÒCƒù;†gø°:{±ñ
/pË¶ÓÂþùð|½ñúÔpá¡³Œ‡X	¤·­…øã¼¬ÑùúÛÅÅ…÷.\%Ç‘šo§´gãúÞPôítUÃY\Œú‡¶Ù2ý§£áHÚ……JÑèáÞ>	¼PhíE+\ó“Ö³“kNßOã«Ê{‚Dpˆ ±âÊWŠOì^aáƒSí¤Õw
ïã{‘¿ôàû.qˆW|ò¢…1óÌ´í;x+~hD›Öäû*n¤AÎ*aðÛÛYà{tHo†b–ÎÑê˜U7÷·u#œ1™ŸÁ½ð¼ºÒu#°ÌÎÀò¶G¦=Ä€•³³Ÿhðq­aŒö¹Q13º>Í•dÍÇc0ŽåYÝcËùÍ×U£f,u E|óMñ6§2¥ÛìX-W€+¶ù»-½Û­gÛ0€–Ž»WWˆ»€§Å'ÃÂk ½Že¼€¦ Ê zAáÝžu¦¿ÜÖŽÆH|Cû#Ô\Num`‚`‚îJŸ’H¹.4³KÎž¸’N$9Ÿ¹ˆIMJ2‘C—ß§tÞRÈu‡VÙò<×+èÛøGÃS5DvÄ±°5Çð·Ãv`iéáÕ´‰4Ü²ŒÁv@˜½@´¬§ScK@ÕÃ2V›…°Êå äÆ±—Ó•q>±ªžïâ|{B±éÃ°ðÖ¸Lò†¦;5.I@es¡ôÇ,ÌZ€É¸K€wJãªe na}5æR‡™h ÈÛªyr‡–íÚÍ[¶­/ÁbBéü“:¨“×2™àãƒÒëÇµƒ79Í$+)Qpaéx(‚´GâAñÌªZ‰@ÝylÔk²É’{ ËX¹Šo³ì\cázsBa‰EìÅ¼fâìhÑ7P–@àÙç¢.GÍðqËfUPgÕt%ËSLsÌ²©Òô¹{ `2¦ÓHIÐö`íF Ì[ŠŠ·ñjÉË¨†IÁÂ“ŒºSÌtÂMÂ²‘„\k×…†ä¸y%OÕ3/Í?©ðó,ÕX›	.ÐyÆr”¬Ål	"æâq—0o­ªŽü5JÄÅmzÆÍ9;TSœ žëºãÉÐ·òÆ)Ò9‰€žxÐö91=Ö5š+wÜÑtg'Ð–b™31‡”gYž¬,ÎŽ"S¸ R-fú‰Ó¥.mËowÃ ¡|íƒé‘ªô&BXÄvGJ,\e^Ôîð	‡nbˆ	bÙYlÚ§ WYÛwHûÐö•|+:ªÐKÅ¹}93l*fäªbt™hó"hK
ÚçÄÌB`´öz]ÄT\à+`tþbjB-à<”YoÓ5äªOÖ—kc=u†#ZŠyvl¬|ƒµ_ãü^•J'Hñ¢¼¹ÖOñž©{JÏâj©?ª›ˆ=ß`‡jsD»“Ïb|R¾ÀDL'Ú9& «ÒÝÒçá›¨‡_©‘‚)9o[ÏÞ.´ZDEŽ“_
sæ#;(“‡OèåFœÍæ‰ICTu¬“åXE/hê‘P„VMAõÂM¡d4Î½&ÛùUúÛ6£+³ŠóBØËŠB¥é²ÞÐB£)ô¸ÎÌshO<mPm\ŒÐ#^ÿº‡ûP’EÑoŠ„“ªŸ:?wXØ-.œˆù!,—.š”¥šéhhyËí,/"ýtñg¡õ…)à»­g»Tw¬P?¡øILa¼}ƒúiÒ•1WEösÜ2¼{B¦Ø=\Þšø%"ÀKµJjv©˜{R$H¯í­ rî˜Ðl¾/º¸Ç¥’Æ¶9d°Âþj$é‚!š ³©Œ—øþÇÞƒv<a0‡\Ä×Ã2Z`Öß\ÒSí~ûÅw0¸7Sƒ$g…Ž¤ºšðl†*Hö®ðfßÓÚ ¡,r+z$ªÈRHòäÄ’·‹‹›€')ðœá;Z•Ê™Ç`ž ØØ$1ƒù ž@¼³±Šó*z&½+!VyÚb­•‹A5]O²ò1ÙÙ±(h¿Öq_ 	ö÷¿ß>üE7Âï¯NŽ·µ£_ŽŽ·_iGÛ‡?înîî=›oo¾ØÛÝl¿Ô¶Û;Çâ­Ãíö–ÖÞÛÒÚGÇ‡¿h‡û['›Ç»û{Q›íöÉñ/ÚfšìÚÖáöÑÑ«ö÷b_Û/·7É{v÷ŽŽÛ/_¶±Òû«öîÞñö^{o3ê£ýŸ¼<>9„'6÷ŽToßÙßßÂëxžßöFBæ$.çØ€T•à0ºý4q{…çg©Ñb¯Ð„Ùjê+ä;~®Ð1ÅnÆÍ> &«ÝÏ>	’Gƒ]‰k°u’Â¤ÁÇÍ“ÆË»^K¥ØxI%Í­&çÔ)@D?C9Î,Ê'Ç«9ýò\MZ"ì%Õ'ñ´ˆú°»0¡ÐÀÂ/È%šÅ5Û‹Î‚0=Ïá…ÕÄLËçwpf§¦G@Wã‚dM~gŒA_€˜•)[aM*«>?\Óäj3‚gkrlY”
]~xæG7ÕÇ²CUXØLðë„TàíŠJÅ‹‹á”•gŸ|ŠÀ1”41#T”êK4x"ñ‰…š±½Ò%ÉG HfèÝ^×Q$Ó›ä3Å*5ÚÇ7¨Ð¢ßÛŒ¯®Ë‚”âœW½Ü˜jË\Þ’9•$JDÚJ1æÂ§„MU©”¦ËUz„jsü¤HDºÙùªÑRÃúžÒcØ«ËÔHÍ¤icO8c“a”ãøíÆyŠ'hã±X)©cm…4<›C­±ÔÎ^Ÿ7e@¦ *{jgEŠzNØ–ÏÕ†©#VÉHrFêÌ¬I4kóƒiÉùGÛŽÞñIÁs¸Qö˜Ù§E%S­½—OµûÖ’v¸Ù7+‘°)„	ûž.œEòÈK<É|ûÒÈÙÍI#‚‹4L"‘Z¶25…NŒ‡õâÖ•{Ùä“MÛ-‹&é_eÙÍ’.áÒoŠ1[;ËàÊ¬íQØ¯*)­8»UU6Zµ brOxÞ¬^~â®*<³q&”cÐ@žZˆ	2Ðíð<j5#²:âl‘K:g_Œ¤³ã&aQÔ†oEÖIÈà"Ú!!dÛŸGì9D9FØ¡Á'ºb§KdAH{2™Ô8(5ÒO Èá7–Ó¥Ù"¨eÉæO¯`©Ò+„6Ò´c‡Jâ¸B5£‘ÆŠ2Ðú$E8bßQ¥¯It%ÍL<ã°|rŽ©3àtaOˆÝˆŸ›¯à¹yaÂuýÈüÀâ×›øÙb@Lh‡ búKR'ÙI¾¸—oÄÇ›^tÐÑ1Ì  €Ào[f`’Ðô	´ÚáL¢ƒÅ³:M×ˆ’L5‡†íS›ÎÑ/°Î± ø¶ ?à{ü“ß<‡ëaøû©±'‡¯Ÿš¾ÝÑ“¡Ù“ÅÅIo>u\9ö¹'{âz4Þ¼-<À¢sßªãÍÏËñæ£mô¢ðîC«WÀæpgÓØ’¦B/¶à—Jý–»3`$–u»ðºò¦HýyO¸'0ÑÀp¬Zùwàû!"Ë{âXe×ºf·…áº@,Ý}RØm°G‹LžÙ-{–?‹‹[~“]*N¡_ølvÛ>‚ÄÉáËÂ‹¢ñVr¿´týNã:o!có%ÄuR€ýq•/<®Óÿ¤ÀÎ×:&Åˆ•4Lg„¢þlóA˜J¥X'·!-Ú‹ÈTÔÙ»0^Dz)é,.Oi2xìb÷›$¼ZžþRÂÃ›!?•ê´èØ™¶ëôÜ¬“ylðø´ýÜÐ4"”H¼—˜ŒóÙ‚`³ê…¯ârq¿ÓÂh¥DÜª°’cyë|1yé™ä¨·‘"³Ä?©¨Ì©[PÔât¬Û<£‹J¡Ü$Œi74+‚XøÂÜ)P}ürª0£åK£6GÈƒ!xÄ$z ÞÈ“µR/R¸²ä·Œs‚ô±QfÇ'cÕ«Þ–;øLAŽo êw”ô>h'ü"H©ã–ˆô‘Feb™‚F"'¿*)*‘¡ÌëX^¬™^Å­jBÔ«ðUHÅˆµÿ2ãŠ©¡|ž°o¶U%jVÒËâ‰¤ÿqADYˆK*Á%¬,»<ïê
jI"O`ªÎLã@PØÛÃÚa4ô$Ã>Acx>-ï©2ç_8ªZ=#©¸Ìj¨H=µFdU!JØ‰ðçyáü	/Y¬ZœÄä®Ä–L#-Ç×ËÖúèŽäFÀ;rSÀ*g<	B…)IüÝÜ·³Ó±Æ€k '÷­¥?H8Æ)Ð#CË°,D³¡…J[áÔá·­cºH1Yž1aÕ“š©ø òtÆˆ^Ê‰“Èyº”ˆÒqFòÔH²1'ßá<N‰<Cu-¥E–ìPU„å*Ã3mð+yéKÌÃ‹êiP†½êÆ6Ò¸˜q¯©[å~YÛf¨mz“ºAãµ‚2Ž$Û“nß"ä ÔoÐ<›dµ\O8+Ö),X§ù…Ø×ºø…tºHa°*ŠA’Î$cb™Ù	lLFy£­ïx[wlïºûúÝéßÒv”¹§a‹ûM½åM}EÓa_kWAPF+3ßVšY;s_£&÷{Ë‹}iÛçAy~dõmww7ÚXhgÁŠ¸Nê¾†-¾µm½‰ß|šûçâÕ‡{Z[Ö±¸‹åt€{yqìk¤XîLF–‡©6=ë×‰íYÝæB%âá^:èÀ½¦1_5À|qt`Ãö‚Aò¹	Á+Ó±‡fDNÃ®Rw3jò­Q‚\«Ú—P‰K+6wkÛüÂrßîÂßŸg£7ÝÑ˜$õåÏ†»mÒ©[Íî{È«Øbi[Ó<óT'o ñ¥ži]Ê¢þÃˆÒ§“aY¤}3XÞC_ÃHY>T1=,~„*²h)"C¬gvm1ê ÅGÑ„Z÷Àf^“t“Ö$ÅyÉØ°¥–
·ró&o,®T› ®rì„b†µìÈB{$yQÂÙ1'Q64¢nÐå‰7[{
›ü&‰ð—‹S¯Ü¯§Fî8Å-8E‡›­¹º÷8õEâÔó‰éumÓù:±ªÏFŸ¯Âæ_fíö4¬•@	ò#k&Z‰îë–uŽ*šXºwn­°=qÛJî³ØéÌý–ŠØÖW°ñü$à’œëÑ±/a ¹MLùtKT.î\EÐ6´%‘ fšh*«µåzceuíq9¬B8í2d¤VßŒ¶ùÅb'ÂHáÔ½%7ec^JlÜe"Ä•æøÀÌÆŽÕ
ÊfŸ¤ÅÒcÜëÆÕ¾(»á7òÄvk·} oÇ(åB±t"gµ?Ðv¯`¼ûò¤ðÃÓÊÕÕôiF^V|z}...n—J„»]Ü£ w¾PœJ†-œnó…ão: {)ÙJ¾|à›ƒêÜ%’ÜÇ3X¶ŠÑDî‘¬Áî`5“ä\Ø ÝA’/+$æÛv\´û³Ú³¼)ñsÂ&:!é§ñ\sD#Óh?]¢Eâ0%“ÌÍ ¡Y;Ïå~ÊRÜ³üéÛîx¬óŒÌQAÙ·Îa™_™¨ª«–î…ÈjÂÒ˜†A§#ïìLRtUÓ~ð!Þ|H›ü »r/çW@hŽ|­ð¾ŸîÃt¨(kø5nê•r5Bð3òx*ŽÓÛ_!ì}=ºê¶Ñµ6p½ƒon³Ï“ŠG©bg3gžùÉ†Ÿ¶é¹#ð÷& vãÄAr£™`gÇÆ†'6£¨ÐÐ–(ÿINR­ãòtd7ß˜B ïzÍÓÖ÷½ÂØô|kgèšASâÕÈâõAx=,óöYeýÝƒË·S­¤=¸|1}×Ôñ´¶ët˜ƒfR˜UŒì³ö¹=M:¡“G	Äoû=ò|ôl*Ö)[KH8ã0ZÂä¼Ì9º®5f"O–µR¡“·‰Øœ±‚µawAeêÚÁ®ŒSêYˆ¿»Žh–¶å[WWUåþÅÚE;ÇºŠïæ˜oHépáØ,hN­pGÂ¨Äf[“²Ùp£áŽë¥MmvºÖ{F¾@‰˜;@ªc.„P±è)Û×„q ê/½Âð]gFpAz8É3ûÑ^Û¤vý)–BÃB1 ,‡_°¢˜Z^ŽÚc5«èÐ¶ÁŽ-15z— E÷ê
Ï0ñ{Ï£
H™Ç¨å§ŽÂ"GÊ³Û´±p!¨Â¼â'Ýán/#ÿExB.#e¬dÖq»äiUUÖ¤´ùÑYÅù¸\UCØžÚéÇs„ê‚S¬Å™L9w!„DêušË‹”ÅNÖ@¥EšXUZT¨; a© y-þ(aqXf'š+924ÉGœhZ&Ñü˜^n/ªÑöV¬ù–î2|'l/9<’ïe¹€™òÜ$r6é‰ò	iÇöBÏ‚>ÍÈEL’RDäé]’?¨’ŒTÊIÊ’ÊH8¿xÑ)‰9Zm¬ }Õ1Ì0ÖO0ÊŒnBó¤Ü%ååéW#´É%«bµ=Ï¼(£q¦pRL˜aë¤.§äƒ(˜kÉµ.&A9Oþª,!å¯Öýíœe"­>9²¶½åŸÞ¦f|z35ÈòO•Ù‡²"ãª1aEu&5æóÚ©	Ec.B–S ®h5¡ 	c,K[ÒhaÂÖ„ê¡³2÷ÔÓòó(«Ì<$'Ÿ„ÞÌ›“'&$çÎÉ“Lÿ•HÊ³••'ÔÆÂñðäQFžpË•ü9yØ±c+Ù'Òo-)¼ÓÓ¬¥ä-4‰[îŒÎD,E“öP
Ès¶áXqÑ¤Ç˜û#bRSñH	xˆ°&&áÉ(ð!ž¹c…ÉX¶È£÷k]TEÃüœeJÝ69RŸ¬—ä\ç‘×in"àyî˜8ò¬Âv8ó;œùÏfnÑô7Ó(ñªÕüj<yÑ!©°Ë¡XG‹;†¦2"WÙµ¦gðB‰ ÿ|Ý:úd!7&Ã÷ábòûüa× I™°
fs·ñãXèõ,yQ›%:Ú›ŒhÙÌ	ÛŽM¾G=|ƒCÊ à.m;]šqöC’àÕüâ)¾Íí÷‡ÖkÎEÆ²Ç¥âàñŒgX²,Wá77¦E’Pà(0¶ÃŒŸãÈ3¾÷Œ?ÁWÏ†çæðÜl´lÈsàÂÏ-Z8Ä‘Z¾Œ¼…ßÀ,C[±ÜK$}Ñ&ËN¤ñüDðp{q‘eMj‹òý³jÅØZïÝÂ&-ŸÁ¥§çÀI¶ƒ¨ZðYÀ$l<CÂFÐ:S‰±t	A$ mRnÔt¦X¸ml¾Á´K±)„c.Îä®Î¨Ç”k)–ÏàûÒ=ã¥pùð>n˜Ü3øU²¦?KûÜTxg0´·±¡%Çƒ…ËŠ­–Îú××*ÍÃ0û•ñúÌ8„Ž@|U?Ú]\\xËb'ÉÚÑ»ÆvòâÆt±Ð–ßÑ.Ð)Ö;"@Wí	i¿ÝëÁ^…sëQ£Í3TµÃº½Åh·:~ÖÖéMžxŽ ÖT7t˜¬!<[|22°a–CvŠ€ï6:vÇÁï@.uÝæÕB#•	û|H#\\<(Ä.§Ób™ÖW%]++¬ö,¸åeè 4ì€„<ºîû¦‚$ "±H|*Fæò½aQ¯5¾Oî¢m§–|¹—,ch)²”½v-c,ß¸ÄŠ!›–ñÇdçûÆÏñ‹JØ´„ä8“¨»yÈ¿~¤yÆ~q'Ú ùçÄÁâ³]–"±C¹)æM¼p'ž¶‰LO;´: =–µ¶gáeÛØ‡3Ó	0ë&HÔ¬u=ö–¥Ï€ºg¨blã¨^Ú>pDÀpýÔ‚³&$µšn <8+ÖÜ#÷g=›»iñ}ÒžÇI¾íð!<%ªHqŽÒ=
Ùœn”0”ð±" [ò¾ís&„†–­²ïŽ,B•ì}b]GZr j”üP¿º’®Zi;p‰Û–±a´*Y–jžÏ­pž ›ò86£yþ›!2.>Ã!Îc¡Š+k 
íÄÛD^µPekklB,}½¸(rÊ×£ÙENýE=ÛžÚÀJÅÇŽÂ¯Ë…4ÄÊòÄ™°OÖšcSø šÂ– YÁ„‚EÜ¹Ñ¶¸/¬ê<^X°ÐóúBW—»ù¡W±<0I2@ºµd¤Of3¾ÝÑ€/1þ¶¡"ðh×ÛÞGý~KÛ	Ûí'ífßãóÞŒ}/šùââYðèÑ”ls«Å'7¥+ÀÎÉëÄÆÉ7…,øƒ¾Ø…üb7š‰ñª…&x,‰DéYÐñäpOŸ³­8·.„ia}CþÀHZHÚåÆ.D3ŒÝP`˜Í§¸ïq\*à>mñIráaß‹¦g#vŸlá+Ér'þ Ô2ˆ¶´ÍJ1dÑyž[DR{ž\›p5.«MÐÈjøkÕá×4enh]D˜Æ…±ƒ'¸JébËäæêê¹õz#xÃVÁî¾Ñ5ÔËIµÍ˜”Kô6¾Ho0*» oŸKJF!Aâ1+¨=Kq_œ: ^v¶hEÜÚ…Â&Ÿt¬‘È5ŒAœÌb.ò­7äpðú-F€PþÞ-wÈþ$Ð	E·D7ÞÚ÷1ñ¨;!á¢œ V"$7(ûã¡ôÈÏðâm®ÐûrüaÀyâ^Þuhˆ©bXI—ªoŠ¥ª ‘t¢°nƒ_e„v½«¨­„A¬°eCá+rYÀy–­"ê|X€’¯õï&èë‚?ÃøÓžô'è¹Ð¬q`Ñà}¿¸ôÓÈMìâ–Õá¿Ã’Í>¾czìã+Óë°Ç±‡ÁœðýBc¸ðJØ8@Ùw=5·<ã½‡¶¯|r¬Þ{úi=\v«X
¯°&Å&¡ ¼û=l5Â`àbI¸øž_,’ô»N´æ.ëÂ°‚Öy÷µË†Ì¨ìSÇA‰	‹u:‹‹ 2XHxÙ¸Ÿ[¨„dåŒ€âÓ!qƒF²+¼ç³ €~#X}/X‡¿ Y]4aP¢éYˆïÍRµ‰©äSI¾b3!e ç¨¯>Ù
É,î³K˜	‘¸TíâP~o]ø…ðrD`9ž]*Û¼vjYœjùž1òŒWql1 WV¶²%uòÚ
Þ\]]NŸàÇ÷poÏ<ÍV?¹Þû8“ó=xA÷‹Ô‡CÄÙï¬0åówP„…éklyèIDÕ±é'úåïïU€ýù“ÑÈ¤†%?ˆ÷ö*ÈÛÛ±…!¢nŸ›£X7Çí¦_„¶ìÖ3ÆtI)t"âÕºÊ
›þÊpi¶±å‹”¬ÂrAq=A¯@ZŸ©v„”d[AIP/áŸÇôÔ$Eð#e£×XÀ¾AiO^Âa|:™zcô˜®Ã]ÀdpJ@(C‚\p1Á
žnWWR‡@hÇyÚ²AÁ•êy¡PP$h
ï‚kÀj&« x‚{Özn"\iÂ¬:hêÕðuÑ¸­HläÆm|Üï%¤”ÇýÞ{†ã~ï±qoyÏpØ’#×¦Q4Âñ¹Q‡Ã-Ù¡g´- K£8YXGNêÈÈ…­ó¤,™Üˆ	Œ¯¯ „“[|SÏ’ßµã]g€ng)o;Ô–Èm,TC'ˆå‚bïAÈ
­žñƒgüêûŽ1pŒ?:Æ‰cl8Æ©oüì‡¦ÑÛ3^8ÆŽqä<!:4H4m9#½¨Ã9ë{Ëçùê½VaËo¸åxÅØ<¶|ÎÕzNËñÕO±®®¤[q‹Oþ…ü¯çLÑtD„ç˜„Çg=ö.:¼¶PûäÝ‰Uû±=%ái0—B¡ë´^¨é:ŠGø {lÈ–¿/å»´Žü¸I×&Æ­áâB‚QÏÜ1øe€ÍËé‰á9Úd	J
üª@ŽIy ô:ÞÓüzô(,îñ:…`?¶=@Ò„"˜ÁA·‘iœQ6%ßúÁ{íxoH¨#®æ þíÃ¿_ç}Å¯jâ—÷Ò½|qàp¸Ý@A–	ÛH7ø¥oüÈ76êoq)ðeøÆøÒoÁýøfŒñ¥ÏYµ|ýG‡¯°X Ö°sÈj{ çm¡ÖÒ2Q°`—§¡ˆlGŠèº4QN2ÏVžÀþè¨Öy† óG'u;Oi;h?…×yÍ†£ÜÒS_±¥?û·¸¥3ÆyÝmæÛVÊ‘ÃmíyM¦(¶µ–¶­} ü‡¦j½3åÈC3uSû´©?À¿ðÏVâhæKl5–¾Paé·‰¥™£¼î†:N|CA,âc9R¢@Š4~aYv©ø
„,²çD,ò¯'¦ßC6[éT ç0)ŸO6+À	nyÀCA3ÎˆŒÇEG‰?öØ/Î³ DÃÑ çëá"d‘È^:iÙò_¿`«?5*EÃ'JÝuÇ0§çè|°8×G& Î1
¢)®[A³jpkä=}´À}NN-?Y¸`á×«nê#ÐöÖ«ÍJ®ÿ
Úû£ï¬G?YN¬G5ãÕúÕ*Uƒ–m—'=ôËèm|š çO(??ß§@zÈ´.§‘&Šá;niW+<<kpù¡éxëë 0×uÝÑ›º¯OÀòKŒ¼i^Ò¬&›æÐ>õlÝð?"cHh"sšp	?ôÔ½@?OøÝw0­óràzöG<Ó?ÄNÈP‹ñ½,¬©±’':O¼ÀiªÉïXIòØ:š•éô	<N’2€RRŽ”~o]zýÓ&¿0ANwôßƒÆ§£,†#í³§ìá°u9Æ`Ï9¦áMîÐîêF¯¿‰7yg§ýDO¡V¤Mo¯à‚ [¦±oÇ‹D`è$n|}ì³ë°9MáKàŽ›—´v‚lŒb^ßu@X<uƒÀÍh„K—Òäÿ  ÿÿì½ûvÛ8²/ü*4OÆ#íÐŠ$_â(íø8¾$'±%ãÌxyµi	¶Ô–D5IEvÛZk¯óçŸóß+í'ùªp# ‚e;¤'Ó{ÇE‚@¡PU(TýJÜBñæß3¶¨D`dïDSï¶ï îÎâ°È2ªá},\ðÐ0›–MŸ‘„TW`aK‡{{ûÛû[oœ­í­Ý·ûÛÎ«ð¡å|ØÝ>ü°ã”è×—‡‡eúÒ>ÍÙeaX+ÞÙEÃ­UŸn¯ÔDßÝ=ú?—±šd˜mØD ÷F–zÑ/‰Ñ$MËå“çG| WaÙÓUS…Ÿk0&Ë-uå¶IîKë°|—ÖËö'ä]Ïð®§e[°Êà·µY-ÔjxÛª½‰ümyf«x[ÝÞÄþV›ÙÄS¸Mm@ÿ½p#™ßÅlÐHÁûÚó6]Ï÷B0»6pžØ¹Ã¢àfÀ¹Û]Ãÿ,³O×éÓÂcÅqˆÞ=Ù‚&øíTÐ°›ÍYÐÞ¼¿3Ï{SÓ¡õc¿cö"ãa>ZGhŒàºBçDë¶•Ý±öR¡®,„º}!Ô•…P/´êÙ¡^l!ÔsB½ØB¨ç,„z±…PÏ\uc!^Gr!| ³X”Ž’5Ò'³øÿ(‹ÿwz_zÑœ¯Ìbÿo«H'tæßéE°A ´»ôBåüo)³|2B1M_Â>«Õ\‹b·Ÿë›n}ØaŸ—7Ýå>»+q×5Ôà²²P–íeYY(Ë…ÊröBY.¶P–sÊr±…²œ³P–‹-”åÌ…²l,2,ºPÈP,º¿(‚ù3´ÀVÌ)káÑüÊ²{·X¾ÆiŠyàá-Â#“çè…}±ÛÜë+‡ÆßéµÉª9}tó%œ:ØÔiŽ¢ CsŠWþ_±óÿŠÂÿ+¦¥PxÞ÷ä¼³ÀÁ­H2‡¢J9é³GóŒ©‡Éçb5G¿¦è)ýœ"Ð¥»?ÿƒdÜ{Eí6Ø8fß‰?7Ã.Ó~?®_¥ôkÆÚmÉDF3ùE¢,…èL¦Æ°ßUÓ>5SÈŽGÌoáPÇ…S::*Óe¹]™LŽ8ìÃruú·Ó»½AÛ-ÈS®*ìâAŒåíhßš‰?Ã¡§Ôü(ú7ŠEÿV¾G…ú×~Ž?ìÐuí 'Ê)µ¶DWc_tµþð]ýT¤«î>«ÛËâªïÎ..=!g£¼GS'Þçb³·8ÌÃ.t¾Kæ6Ãðq­œÿ²g+;ËËé—±Žb¿oˆ°ÚÚÚêòÊì=/>ßlÝãá£»>Ô~RC]C•§­°ÀÓ«*“Ðæe¸y,Ô;]»3˜:£­“õþ¨Äµ®FÛÅÄ­E‰ÎÞŠ„‚zÄ—öëýW¯wa‚š‡­ÖþË7»N3cÒëf«lôzTßÞ–}\¦ÿ“}¦‚.¨3úuè…“^ªœ”^‡3üò¯³OpÏ“#?kGMê1RMBóîÝÕgÏ2h]«V+Õ²H42bã$ß*q°‡5áKÕ2è–†»”jsçÙšÍNÓeKArÎ8bxp’F_—¤Âˆ`$ßîCRE@$iîiÉÃ4voãb	¡ö‘|Õy›ñíÎó ;1O/ÜZáÛøÄž`‡Ñ†ë>ßMBÚ%ÐØíz•æŒ¯ÁÇ0*ß„<ÌÆú¤=Ì†o†ð|`ã¾Ýz³ë6Ø%µéîí²ËîáÇ×»\ï¥¿q$Â1WÌK_ÙjÑ/tƒ"u2X4|ì:ov·>¼Ûý`ª¤g»[;ËRÜ×–Ÿî.ïºü8¢jûù'¼9<qgÔ°²Þoá±&èà?;LÆó9ì‹.JíEùì}ö½¦ïmõ¼-ŸèØ„?û3Ìçìðƒ¦Å±»÷
ZÛÂÿïmœçFÛlõì§ø[´9EÌ¼ôoo_ùÀ8ì†ÅEúÅu7_ù››U¶”²”Ø‹ê&ˆÉ
ý
$žõÃšÑW¥Þ$[CÏö¶ö^º©ÆG‘òQ®ôZY}ƒ‹r$y‹­õå½•½µtë“Hù([¯§ZŸÑüîêîÓÝ—º¶œƒ7fhË;òÇŒVÿ‰8¡G±Ê#âÛ=yDi\ðýø0<¢´>‰”Ä#\ýÏÁ#¹êÿŽ’Ûæ×æÄÈ€ÿ½‰6²#‚ÞDZDÅ§N0„ŒGþ)"zd·6K¥‹(ç‰øTÞÜ,™ŒY¶"1zƒÄ¾ÊæâÛ=Ù\i\°9ýø0l®´>‰”ÁæÐ|òèâ"¦0ï{ÿ¢¾i&a˜em›fí±–éÇ¢qëB¶°ñtuSlbÁfØ]^­¾ÔL¹(Iìø=Úh’Ò€”=ÒÃOcøÔ£×^‘òóyýÔsÞ/rÿâLì]¬`ô‹vTR61wûÍV«ÅbBœÖ§·o·>üËYtš÷öqcþqëã~ëãþ¶j¨1k¬Æ|{+»O×³|Å5K KYfü_3Çz5TœöôËrÚcN¯¯¨7­eÜôT½)E5Þ¸ðaI,KÞî~ü°¿í<qößíìoo}<ü`:bvëÏ–_Î""4Xã¢9>OÉnYap«þÎÍ<å'_‡·Þ8%ÊF¦ó¦hk‚!ãaÙ;¾¡°€­TA¬\~˜I(F×4~iå_ÂUï¼AzâsÜè‰ëS/«™¦E¤ã”^l8OWË¼±½ÈãŸicìsÒX“„Økÿ‚`›Ø"””þVÖ:Å0Š±ÙvÌ^§Hn±]U:ÎîÇWçÜ¯ŽÝßËm?éó[â¥ãT©:¥·ÍVXrë	áªÙø<E¦ ÖûŸ-÷èýìÙÚIú&g¥7ÄÃD°[‘žôØ)=«"¤¨ ­/~f½H¾ÒÊ¯ö¶_’a»;ðÃK¥ùõêÒú3Ñú™r{v…¾C½bÍv0âAxò’§«KOåKÚògö
å;}AòÝÞü¶Œà÷'»^(ïùEaæŽ¼í1|#üNöJå7ø&£¯W~ë%ÏMOtÇ…ÜEgIå×¡"•é‹T¦×WÔ›,R™^ªÞ”%•ÏKås!•‡a…’8µÕ?bîXÎáÏ……ßÏí¿?¿ÇYæˆ"ôÎ‡åéüÜw3.eê}7”¤ `q±4¿d/óž,”.~¿õçÍ4Ö…6Û>õC§úþõ»¬ß%Þúp>r°®Æ_bF%˜-{_¢÷x›
!…÷±˜Á×ˆPõ<‚$á9OÛgIÂçý ÁîyRÍÙK‡ëp‡Ó{©5—‰)·×àakŒ½-î©©q_â¢«ãK,LŒfH0±®ãœ]«á"æ\wÅy6ÎƒÆâÁóó4·„¡¢3O›‚í¿Ä÷	¹>®k”~\/Hkz£BíÇfÄáuáˆÃëÓûÈŠà¬²•’½±Qšá”þÝ§AÑëT,*ŒrY§ÖrQj-Ô2ÃÎ^æÎ×’;S+“á†>+4Ê×	_f®ÜyÚT{‹!”Ü?ðƒ_£.!qénÄÇî*WD5Ýx/2˜ß7Žo&íncvoÚ~é‚&ôç§ævê(ÿçOÚÏëð3ýP«Oå‡Ö'Ä‡½zzâRvøþ{ƒØs“0„ûÑ3Möz}‚wÐ£¼÷ëûG7ýé¯»WX'®rÕ®NËS<éHAÝ-ÅEl(,!DE¥ôŽ‰{áIÙK 43‘»¬”Åö\GŸˆÁáu]+|!oë©º	¾¯M9™i©¶f¯“t7¯—ƒ+Ï>8ÓÀDûúz
Ñž½p¥ Öv·nÂEJXÑ×S`¸&MaŽø¬T•°"y'@ùþÕÒdiÐIÆk(ÁîV§£àäÎúÔ¦ˆ†²"ëõGÙ¸/cÐ:Þaè‡	€ Â+aúx	A¡8Gk1wc3³÷ÑçúÖá»
E~(ÑË™,½¯—eÎây¸X\9¦`Ofc‡!}ƒ°ÁÎCh{ñ'1=ná]ðÓ´1‰§^L6üèzØ–È‘å›ÏˆXù<¯Ü­ã«FƒC³ÐŠ"Lb‘l”ÀWÃOŒ%3}®BÖÀ½²I
;êÅ'ô1ö‘>ãéÏàõä¹Ãdsq.³{C„ ÃÏCµ=üŠmz”&âÊ”ãjqD;íq ŠLÆ~•Ç%â÷b¡N=:ûý²7b¨ÿ¦(~åïÑ*—¸`¯«	\H9ôƒqgÁ-—ü	X
yS`nvHL‘+nyÊÀO_qhÏû!2y[C‡^s‚6E3î8Xß‹ÌÎF…mQfÿç5ðÔ{I600³÷2Ù™ã‰s;LÒC/ž Ù'!ÃC&¢Vôb²âe>£ßuÕä%+ÙD]ðW~8	7©Ç”nƒýªMÁæAfBj'.‚T!ö(/F°nJ—’A³€áœw3Y4;2â2<žÄôhÛåyš‡Jž&¢à½ˆÂÅE<*ß°É8¥´gE1ÌDÄ\(nÃiëÑÐ€¦À
þòÃëfŽàçŠæ‚–óÀ"îg„ñOåTH„i’B|cƒY <ýœÈ#ŠÓ!¿!$Ð‰'¿â¸6@¢ÿN’¥ôš„ ,Øb„QxŒœÎ¾$ôe/ô¾°AbÃG%NèáóüÁgútƒ=æÁs`ËMÙŠÁäÜ=Á}‚ïÁtÉtˆy5êL71˜Ž"w¥™n—1]/–ÌÑ“‚Š ì(cÀÅ¬SŸ ÔŽ–>@&Oøàeü‚Ä‹‹˜>“P¸äð‰çæXUœ&ÊPnoß×å6†‚í9L:Å“tå¤ï`^»2éÖòŽœtÑ^ã<T'~8L&žÄêÄï°‰Ÿ„ÚÄÿ¡N¼‚ÍægÀœE¦f6¸–C°·µ*‚½½@¿Ÿ ºË‰ÎE`!ÙD½µ*®ÆWÒpDÈ£v 49(–ˆBŽ€‘ãP’ÃÄûBÝªLI–žF–CF–@'Ëë´4–ÝzEòä&ûun¹	Ü¡§óD°EqÛ:`“°€:sJ”HÌÅX—›®ÄøfXC%7ŸJžç*Jó4—eÀHòQÊ4¤‘Të(ÃhYiþLŸ–°[øËy¨%ˆáÀy[Nð4Ý‚Ùáƒ÷pô(è<qëÆeè±…Á°âÕDØ°TbfC*h”éÑ¿b TÜá<è¬xE¡q–7iý?—Ì˜îÿ¹ì?°\³ì{†€dŒÖ—ê9êKiò¡‡Ê¡nÙp”¶iÿ· ÿûqÂÖ.5âÝ„·_Æ
È[ˆ¶Ä }¨[Î4|¹ãp*aº^j˜ÀTŽðML¯²úˆv`ÙÉÄ¡QýMÙâuüð2©…»˜'Ií¨³ônÝ®^Õ7>bOwð•A¿5ò‡úªºƒ½\ûòÚAÏÖRUN¬;ZÙ¼ˆz¶â’ôýúfNtÒ²7M÷KÀÌþð°º—…Éu^¨.rJ®'çÁsË.­=‚—Áå\JïÄ;"T­SHŽ',¶31ÉeY®'ÆfO…µ6Ìph7¨àg(Í{VÔu|=+î:
™ÃðöVU•··€AaÂ,	T™ï·à|.*s¢ñ¬0•Ÿ˜ÊO	è%Ã©œ¹%ð*´÷2DóE[;Ò14ÅñçsÁ3ŸK´—*}	Ê¾ÿ‹O²ð5ÍBqÆZ>5*.	–6.sÆVŠÑsèÈ¡Õ¹œG7;á¦Œüv/¾†u–·DVi!¹9ÄÔRŽ‰ˆ,¹ KÕé¯Ç¢f´ÏK·þ] ‹:‘6¢˜Už¼Y·È›úäÍ 7\š,×ëXOÍ"+í•[¥Ã+DU­ÕySå‰I¼éÒš±qÈpÑuIiŽf•†3²½P<“eèÓ‚%Î²ž±²r[Fùäta¹Œ¾±×Q¨ÕÂô·MÑ€HJu~çj†6˜5
5¹ëâ`ÔíÍSØÔ¤Ù’þ;òClFüÆ“Ò˜Üñn(6*p}7cê<m¸´¢æùWP_$A8+à)»ßïj^\]µ&ÑiS4ççy›ÂÚx»f“Ô‘¼Ø˜w\õž>ÕüŸ„Cõ,öÎcï*ôöBï(ô¾ˆ=ÿïX+êlÅ³xc;7"þ,ÎNg‰?–ÎòÛÛ7JWáŒö®ìØ{{!oËuâëwP7ˆéµðÏ˜¿½¥Dàÿ·‚|=ºùD×¦n³4ü‹UÇ]¸òÏxó”&­áåß	å§ô. ÛþˆÄePš*KÉÿÓ‘¬çXL´®ë‡Î<—µët¢Ý¼#›î-ÿç·/Ýô_ªñHw»š5ü¤nª;Ð7OVtýe­YŠ…×Þ<ãb!xYpð(æ5ÌK¥/0kG³ÀÇB{ò6m<bƒuAo¶ÃÁadªëÅ½¸Oïã¤j*n¼xI5liä.ÛûD<2Ôj¡«å´Oy)t•ÈšÒäe@AŸÖP³Öô’å:¡S{
õ7­ºR#µ€f2ê.RN„¨4fª¢‚í0ˆñŽ`‚k˜Z<‚»7Ýô-Å4'ð–o9L–pmLO“ªÒ)öž¹ëÈ$3µKæ5:&xÈÆWÃÚŠ¡-²ˆi,gþÎ>ó
ÀK´ÚVÄ*’S
$+c’dÀü¤ƒ¤^€µªI§Õ?•Ï,Ô¨=5´ úPŸ36‰wR¡3Ú|5ÚüøS>¸1s_O•ª.éŸêôÔé(þ©N™àÉ‚?éðSjÔ°©SC‘‚ ¹¥¨SU‘‚&*QEšë=ÊV£ï55Jµh¿…GÄÔzß^_ž} }5Û[—¸fñàÍ­ýþ™h?nÍrpŸÅvÝÇÍ ”îCb1Ý'UèXEåÉ·Q…wþÅŽÿOUx°|f:®žt˜2¿•Ã
Î3ñÁM—…$‘ËÕ¿aâV½Âë²Â%‰¿ÂmãY<v•a_IÓ¸Z~ò;ù¯åjY“á'TÛG´ý‰!$ž­Y„Ä¼R8©D,d,—®Ÿ¸tÝÎÌç~kA7ˆºÿ	¥'HÑ…ßSÒ…ª˜¶Ú3šëœ¶y„ûÍÆO>‘ÿZ©6ªæ)Ò·bˆ*Ä²‡tË¤tCHýžRÀ¦/ö„ºú«I¥ßçJ	óÜW2ýþM$ÓJ¶d:ŠS¤\úß%¬…Ÿtø¹KÐ¨aî²´ë•¿yÀ1×ëÒ*_/8æœYY’¤A7r‰¢‡
pÚÙ@¥¬Ì˜Œè#v¡2<$}ŒKƒž°èùlwF4W²[C&äX}jÄtDáfVÂä¬¼KdÓú¼Lxö-:d]ÒWŸeël¬#1á¼ïšQÀ4=ŠÃBR¾(JŸ§81‹‚Ú\5sÎ•ÜÄbqî¤·g- ´Â×³Æ,HÔ©-M,t-ü!L¬OÄ0±¤y‡6®\»¿e\Í ‘Yàò!ðRØCXä”-ŒÐèg]r]mý
”›I‚r³„Gÿ4½¯rƒÒÌk¬Ô¦^	ö§¿0ÔK˜N)ü#ö—ÁÝòe°–™…‘óê“©GÉ!v3MžYÅ*¿'Áš··2_ï†!B4ªƒÔÀ¼>Fø“q€Ï*ØÖ6’Ðð%*€/§ QjEâqØ—`¿ß‚?4p¯,Rñò¥„¢%Ce]e“®TWþszŽqØ/ãšØPÅà`šWSÅxÆªŠy™ÄtOè•ÎËóIøbãYuóeüøq?¯c‘LþùéêæaÈ?¯­nžãç þ‘‰qÃ¡¬Ëi#‘DQb&<™Äÿ|…’ðˆ(ô`¸Ëð±à6¿QXp‡
IL©¸*d|ëtìÅ*!C•’çaBJ¾÷ˆ€hjÇ¢©I?íÈÐÂ×™²[ßªŠõSw)j‡˜x0Zû¦Ó€Mz½HxKnÄLJ‘ÝÈ·dRªghÔ'ëIªè2<ŽéªQ×ï“¥h Ig©tPmƒü\êö:è*lCjÕ"yªþYôÇÐ—8ªæQ‰´Žüí.ÕÀ,8“~æ”zYQÕåŠK*iw'h·ó$Â®4ãMÖ˜uŸÉöHÍ3xY±Šl7ì2Ãqè³ê%ËXŽÏ8­{%“k§ŠéÔ]¶ìe¢,5Y=;Æ´ü¶‡!à†·Ü½#…Ü~¿Qí
Ã[VC±«¸ñÀv±ã¼	Ú—³3kf°œxr
˜‚”†êKŽf%õÚðÓu0v:MRêúÀSþðÚA¸£‹!üè·A£`<×é~‡BÔÄÝ^äÐŽ„A0pxÈbsŸBBŒx4/J&ðˆ–P$DÑ€ƒ¶vhîã0î_;Œ™+NF4DÙ5îÇ,ëw$2÷ tXÕ-ÇïÀzÅ2D~cX÷>ÃuÚ‚ßnwÄISÛ"î©ù“æQW­+aýªÔ°­ëšžg^$Ì•%‘Ó¦“=-‡\°9
E…5òãvMøS2æ¤×VZâ(Ñ3¾·SL†môgìðdW™„EA?\¶iÿÌÁEDZNHõý>RoXCX1ð@QÐÏa0‘òLd°1FŠÀ®Œñ¾_­¤†™IÃô³BË@Ã*7‹Ð$7•öUMrK
ò+x\´œ-Ìû³eyÔ…u{¹”"méK]ÈÜªµ ƒuîA¨º….V,„,(}#ÅXN—ïÊ88Æ\KÔxßª¦P´‹	’ù{"êû 6Eç$Ÿ/¥wÜó¾­ä*ÓÜ+÷ æ-àTX|YºK½]¨'3g,Eÿej¤XþmMè.I)*öÒl³ÓO¶uzò+c{÷¼™ªSÕ‘Ž`(~ˆ¡/y®qúÓ(dÂ š™w¡í§­1s>˜«+ÌÂü$ô¾0ˆ,éQòš+Ã²—ÃVR¤óîÆkl#©“m¡¤ ˆçç˜È0˜WTÚÖÏ5ôø®¢Ì¶‰3îÝÞ_cfe*7ÈØÏB—åž|a7ÖÚ”ò‚ô‹¨/H¿h=×¡7.ŒŸžA”Þ!tÈ:…ÙotE±›ç\^Õê³{š™Ð5jW×žÔÆ3t*®é‹+/5³+æÌ²YTÖ›U–®@–/'"¡ž	OC(JañŠ,ZÜè\;ó ¬Ý%íË³à
o$hÃ6¶+½èß$^‚$ë LADB}¡‹‹A‰¦¦Þ¤ïm$Ë–7:ÕÖ¬+ÜPó»Çlnûê“î®d‘xDÂÏg‰ÙR²²Ò\	‘xZ•D¸ìã5&:TCiºt†Du8U¥åvr'^Ÿmy@cgã8¦‹¦vD—<a>ÀÄyO·ª–©ûø-ËckI~SÆoË¢]ÖÛqhZÚÞ}!ìW…ˆXjºÉU)k%Æ®ð:N°šB$© .Êƒf‘d7a»9Fœl°g}{W»ºùû@,Ÿ—ä/Çô5’0€´ÙìðÉÂ+
3(¦‚$¿ö}°Âû@7îaë3¤C;ELïÜ wX`+¦@Ð¬Û1Ô{Úö[¬‹:;8Híôt¼gE72bÇIxÈršV{’Vk)X7eÕ«º[¨˜T/¢8@¨«?¹ÜÄéƒµCO*àU
åA—cûQ˜Û„jôÓ`ii0®œ`×‘g£
Ÿ:ïÝââÂ«$ÓÊ¿}Rºá˜ýNƒjtŒƒËüœ÷ ±P›Ú¥¿¶…N×ˆñÔ&kV³ù+÷‘Æ’êÓPtÝíêì[€§
oþO‘Ïvå,ŸµÓË](hê™†Ç`#ÇbF…I,ö]â²¯ëÔ5¼×ª¹¡;´døm±¾'_¤4Hq¸LVuAjXUrsƒøÄ±×è¾T °I×!þVÎ³ý+&¼v|ôÛ¸­¬8[`® £Àr¥Ža¾ÆÃ!FXp~ƒ(sŸj[,±²9Äƒ4UžªRß²*T¡>ëK(®FŒÕ¢œÌ×t&X©Úã·T¾8älñ²meáàŒF½aÂ
árl¡·š#“â4}A”ŠR‰¢%	8¥°‰*)üÎ¨#Ûá«žr„Dž*"ßªúöä«Oæ<ÓAço‹Ò˜æÅž®ñ…¦QæhÖCxUÕ³Šã-.Cìz}¦¾®¨ø«yðb!jó‰;Gž­Ì<¥±M¸ˆ7
É—^0†™G]Ý‹èÌ5‰÷‘ŽçD;v‘Ð§x_ŸžqYU 0Éª¬èÛ,zÑÐd…ïîÔ6täÃÚ[F×bo)ÓÙb$÷YÅ,Ï¹¢!ß¢b‚uÒgÑùŒzíÈ¡%ÆÃk
>q}t÷ý¸uod8*“)ñ@L˜ „è÷Ì^¦'E¸«ky»jj‹ívz±„fªÛU¼cÖá‘ÒBXXÀ	£Ò åvY¯ÎåIšm„ö@¦¿Æ0¢†Ûê<hó{ýÈM¤(I”]zE£åyö:ô|m/tÉ×e: oñV<eœ^æ§änƒR×»+·f-“§›v<)Ïà$Û©NÚ	7až±…>ëIêpW½{Ä $
\hI©eÏý[ÙÍóÃÂkÛèì­ wS{mdŒç#XKäê|h”—Ù	n=
”)ðLu~s‡öñsŠ;+Üõ^²
;ÄI¬aøeˆ+û!iF6†3ÌuŒ¦Çc«¬KvÄÊú0îuŽ\ïy\ó`½áôNâÛÛS.¯ÁÄÂß¦§'Ù»‘ÝøEus7¦e0pî´O.È°³DÑ3^± «üþþŠŠR”Z+Í$GÜ¡Ùél½ˆ:Úßßz™‘M—53£É¿òºi~´¬$Â}ÖM‘ÿ±×Œ=tÇå®PùD×Š¨u®¯ÛÔßu±$	ÔÅ×InNä]VInƒå5Ò²­‘– Æ}J¤,¯T*µòR3[zjf‹¯Ü€´hõyÇ‡ }!Ê»8™®¹÷cŒe	û×N²úÜ‚—vò(¹“PR?<ÍSt¾¿¾ê'Ç1©Àªì`ž1ºMqÆ‚–ÙËaÃÐ÷G4wVö˜çûÔà³*ç?ÆJkVÄT¡üéÙŠ»„ø%]˜GÚÉ>Ð/]9Kd‹Ä­îÙœ>þmÊXUó€lV&í¾FGx¥K©?#&[Y‹¼¾¥ƒÃP²ÌŠ­qý.ýÍíWö<±¹¬ÑáisF+ÚÒ¡¬k›…¢ûÃt|sÙô?Î×4¥,õ/š#ôÈ““¢¸Ï3Ën´…S³h‘‘†j“Jö5¹Ï2F™‡ÞÍáÊ½F˜“ˆœí­±!é¢©UûÐ’ºuÆ)žEÌg)•5Uh¾·ðúèky‚læµ´Õ]—D+êÊ„…ño#™,%1OŠi($@›%džª¢YXÖnvc†E¸3,B‰B8‰§å{Â 1O¶Õkƒqý,3à;c‡jõV)RÉ†S"–4ãâfðdØ]ò/7^¼&¥7×¥œ‚/ðiD…)q?"ÉÊqr;ÒmFopž°ƒg‡Dí°G£xOg@–ÌÀ!éøQ·x˜§†T’,[ýrÐïaÚ< ›¦4«’`öŽ£RÉ–Øœñûª~VÀ°QäÔYÓ¦dÊª„59á˜½]eg˜±+ ¬0ºÂŠHíÈÝø‘£¾ßž7[Eº}'}x—êé~[þµÜ@:‚¯é_SÍö®> 6*ŽÀUL™¦ô_W'	OðCê$€öŽz	!‰ê¥ïD/âŸzé§^º§^zè“Œ9õÑ¬sŒïXN¿¬.j}]¤ ÃÞQµ~j¢ïAežÐ°1˜xnYpTêl(ÀºG¬±½‹¸´T	tØ”:´¸S¿V1½nê`ÑX]@®^×ôË¡5QÆœv˜®/|vMFæQ)‘7FÅ«e"Š¨EDçIcK®ÿIÊQ%¿¬E“ï(³,Y¡ƒ]{×´Ü•g«i–yHs%AÿÉ°Wfxžs–õ<ä§ö£ÃY%(sÞNÏ[Í£ÃâôšK]çK#C¥ýëÞEœf±,6j¹ÖÒvÒŽ•»ÁšÌGõŸÛ@3QWSÆZšsÃN›&L	Ñí°Øw¾/7;gÂL`†â60æT…]<L¹Ÿ“Òäh`æXKî<à×òÜðû‚¿Î7`f›"Z­¶î(²ì°;½á³ã†Î»(è™bJ¸j`ý%Çù*Ç±:Ç°Pàš€Õ-PÿwiÉú²W¥|˜C¢ûªˆ¯Ýö ›á	¾›,{€x`›<Ó]—?eÚ}
fýådÚç"œ÷ù?W®eK4îçûÆrí›É“’¹þÉ»ÉÈ{Ç‚«ÒæPÓåc¾Sí§|T«˜”Ö5D…gûf‹zÈrª¢¼õ¯]Ç·fÊæ~k8ËÕJUu“Ñ °ìu·×°ì[a^Ä2ãÊ²>È{ä T“Ôe‹Ò8ŽSÐ‰?×fîÚü-/à·¬ŒŒo»öV’µ÷—°¶üÙ²Ñïfk=ÕËJÝ¼‰îýƒ›hÖ¶¿ü°m²<?ŸëÂÁÀ ø{²t->Ü¯]5"z÷ã,,<ÏÅ´s·ìáÅ=2 —Çp‘?áò®¨«² ïù4ô9ð¶?z.ub»BM;Àà(ì)(€õ¢P gz‘ƒã
Úà½b?ŽÄ£(—çƒÎjbÃßº”Ð¨ºEb¤¬‰v,š ÄPŸÿÍþ<U,hÊ˜¨×šøÔW›H¶™*üÁ2³FK«JvÖ}Pª1uç£žÒz¦ØÍ	%ÏÒ%§Tâ¢=U¡dœ'‡ê/ L”  ¸Ž”VVQáÌÛLõK¿ªlÇX\çÝssáÉ… š›|¹[‚£Ì/HÔ
ï#Uo~b;ªsv‡aÐïç•vÈÈ8È(ääjsDWI…Uc)ó-è°%jÀ8¥gUByZÌ  ±QCÖœù^	òR©ƒã”Ö«KëÏæ!‰
æ•¼I\]±E­½ó½Òe[ÖrJOW—žÎE
ò¢“„^Ê GR{è{¥ÆŽ¬‡ä”Ö€+óPCB-Ú)lôHª/}¯ôØå¡œRuim.bP¬u~ÝB
Qzj†Ý]à”ŠeÛ$°«09ßjá¶æ&wvaŒ\Å4é¥;Eò¼'Y³kw{Jf~+öê›tzÃˆÄ4i|µ:»6‰£®4V qï†×ÔlÜð0²FuêqtÊäZmê‘«^¬Ý¤¢YŠâ ¢_ª…ùd¾ûíËNŒP2…Ô2tq+©ˆewÎ‹Ú`f7*ÏV=è–µ¯ü–šG»iô;õ|1+YA$Àm„†7;è$õÊþÀR3³ ¯-h\ç8Úì8YiXd³ŽH-u½¬ÒìŠdh“?ºi‘Š eT1T-õÎ¥”B:«‹ÚdÖI˜“ÙL"ÁUTNµ›Œ ¡*EÑ³¾rmFÑ3±òç±îfªÜÒhg „nŒeyqªfž`{³þ™Ú‹Ó­‚¿:Ñ˜˜øÃË…ÉžÐ˜E:ïèÞ™n
mÔ:“pÎ¦Iä^4êû×Xý,"ª3ªœ6²_3f¾èt¦Æe¥lÁYX?š›
ÏhŒEi×gÕšÛeQ?È­Ù/—|ºo~-‹m<9U£í˜¿ïß•€¦®×ãö>({RÎªl•.t$LÎ ­xO†ÔÈ@^Våv‹…Í\ërYiËI­òû]:šJ‡êZmÍÔj`”TçÞÐ9‡U;¼Ó€A½‹§&Š3·†a
ko*¬»tü¬ú¥{bè³ô¦2¸?‚` —ž­f/Û+¤9>³æ<÷–‘Ó§3©ª†_¶òK@díÕæÌšJðn®-,¶cø½6ák•þdXõsYòÇ¬öœç:ÿóßÿ× R0UY@À5M=L–Öa‚×çš,Cß·ˆQR.É…Ät^Ÿ	”ŒFª\À×¬Ì¬ð®Á‹¢VpÔFÝ™Ïê+Ø0‰3B–õr¬³ÑùTëFrIkDÚ@LZD•žÛQãÂ×L³µÊ ”B‡øí.«n VqZ$¦~èÀ-ìè@D›è³@Ýñ`Xq‹,ˆùq»Íò¶Y^cA¸¹q¿ðÑQ™.*÷ÉÕL³±ÿÔß?ëesÓuÍZ}©Á›çOun¹j3‡çÙfâªÝJ\Ÿa%fò.Ü¹„<;ù­fáÖŒÃø¹-Î¢õgmWUT—>’=]Óú½^,ööëBÂœ²|Æ©\Tœ÷ãÞ"Å´|ª«“$.ýˆm:òB=f÷ja#w±JAéW4Òß8Ö®Ýµl–f«¡ìrî54‰E0Ð$wÒï”gNpj•(¾HTQ.P„ÇÃ1óLž‚ŽßŸÍû¯®2çEo~L4§‚&ø§jÎïŸæ§}(ª`Ð|ôN 6šUAƒ~jÑF‹æ¥ÿüÔ¤ IçÄøÿ«kÒ‚õ„òT°iUå™[3àkøsat~*Í‡Rš­ïMiÞiGS™É‚ù©88Åù Ya]µ©Uüø+Ê½?Iì¹ƒèA$^Fõƒ€L(,äAì©Ú;k½’ÿéP*…yùi¡5¥í¼ä›?â‡Kiûë	–•kF÷h$ÃNzÑ;y%ëŽ3¡cXÊ'ë–¼µ²uê|QÖÒÉ>itw0ŽïW$Á®±wÓ‹GpÇ>Ý"BG³KGÅãï¥ã‘N‹…¢4¶=V‰ü#+-fy<-º‚É§0ñÚ~¿=FÓØ¨Æû-/$ç;~ì7¶cÖ§óñ>êâÒ|sìñà—¨A<ž%5ÂãíCï¢œù}~l5"Î;ÿKïc}›èÁ¿ˆî; .&Q&âj_¼¤Ñ†ß±~)¥Û=h;†§QœÁèzÑÖ8î!–7Þö£n‹Æâ”‚Hçp§ÈVçK;z7!Íø:>Ã¯ÁÅEŸˆØþ,¥ë;x~w÷BÒjwƒ /îé Ec<0%á6°PÜx¹QåóÁnllS9âEôøØ;H6õ¨#ÙB_y·ùØó¶?Üßiü:-ßÐ=ÔñkoHN6ö*ãˆÐ‘SŽ8þäíkY<Öñ®÷^»ì’á—^©ô‡ß›Þï¶Ç¼žþ×-?§_ß’APBN,Ýœû˜û@¥ð.¢,ìž”=óÜé…Ö0GÙ‡Ì½ã“2ßž‘ý‰c÷cL,…?ýkø³5¾#—Û"#˜dLTóÜÃv°Oï`ò‹;¤->þÃŽ±¼±çî‘³|ë‡í.¶8
{}úýÚ=Á®x-³;··;<iŽj„ã“F{ÎÜâb»Â&ss§rÞëÃŠ.€Ü? ÊOðœzg¹ë?.•0Õ-¦•ƒ+H«Ãs¸T€pé–—”‹í˜_,Ã?ÞñÚºR›öÎ`ïêõÍA0nqšdãf*vµÔ„»À ´Ãü–6ì¢Xü(³š[®ÄA+anKe¯oˆz­xãôÑM3žþúè¦OO½x¶7ÙÆØÂ5Ôóõ‹1h
d
a­{ŸõÚ Ü’–ñŽVˆ/Æï¿FPÿ:ÂZï Ü’‰ƒ·–vb¯tÕ9nÆ'˜þú¸æUËP¸ô·²÷[Kê9¶Ô'±ú¿ö<Ù8áÏãÇ|)9 ­ÕöXs^ò–®¡¡]:fþ¦Ç5•6•‘ßÕÓZ÷Üª[ž‚ÆDÎ§è±€—O‰‚×¼—ñÆî0ïí>HÖŸ/LâÅÅ…—ðÏoqe4Žº`À”§¬ËÀY~¼°±Q»½ýŒ—k‹‹ô‡Ú¥ï—`*à34À9hð"_ÀÓ‹‹HŠÏð"Ò'üLCþè½ÐËÎÐÉf,Ø—b¦àÂ–8aF˜AµòRrù¥r¹ìý¡Ì8°?í(¿J'ˆ½;Á9ô¢]··þËq¶ÞêÈþGâœ…Ä¿L<M*“ñlY?g´‰ÀL ˜å§MrÜŠO6nØêÀäTú°‡ÌÝ &Áþ`º)%¦*ÞðcOaçÆçMÐ^‡6Ô=£­p
Â°I¦Þq—p@6JMâQë×0£‰ïÉáù^/ŒâD9uÐŠaÂ¢;ÙÈº³ú½¸fg™úçX‚9]‡ÀÖí˜²Ëù¥ßÞ S¶€EJŸã_vâ%Êfp	?..6ã_ü¸\fÒD9ÎU“¥`Œ#¸ËÝ	ƒÑˆtœC°ØooµŸ>¢ytNÀ4`?—¡9è0< æ'RË> ä÷‚Ãxaã…e¸”qðµ©7"ðVFø…&áwp–‚Fq5;ˆwñâ ¬ôÃ!®RÆ7/ÀöÑBÂ7\ib~vù`Pœ¾ùðÎáI¦Î0@p	°0ÞÐ‰»=0™-R9–]…=0GDâ½
P™¾Ïõó2Y.s™>•2\H2Ù >@‚íÁÍ¨!@Œ¤>.®½ûká“cÖ‡·¸LJåTì
“ÐTÀœà€1p¢8¤¦Vå’\G ¿ËB\ƒPï“ãƒÎ4¬Þk¦g›LP
iµÃ¾Ê…—ÈVœóx'ˆJ**¦ÈÀ óæíc ‹Õ)=ºÙ‰§0>˜ÅLN¢ïÐ—8LZ8xQâ´¹e§Ìè)6ŸÐ¥€ Ðäë œÛ½G700`½)v
ÌPjl:AH;HxJ°ã îÐ™°‚> üìu`Ag¼…jÙSºÛmèŠµC˜
ï…$bx*áÜý(O½mnØ| ç¥áVèîù90³s¶Á„`;ŽÊÒv(Ø×}Œ/5…±ôI…R°ä¢]Õ#wñkÃõð&ÍÆéÃUFQÆ8d â'` d8><Ì6-TÜçT\/.¢§¸tÊÊn9±µ ]tASñx	Ò„:`Í–’â%´4ÞØIø®—6Ê/XjñC¡ý!Ë®7A+õ¢„Èh#ó×‘üu©CFá'Ã¥ÜÌÚuËÆoÉÃ©Ÿxcæe>™ºkÊ›H¶mJ%'iÎa#³RoéTœýsšÉâ‡Ä£eòÑ0} ×!tuG}é´;1Ù±T™6nù¿ã¦—á;¸á£öwÇYÈk0Z
)DLÚ
Î#O#ŸÔŠÛßCa­Stž…Ûì?ƒ%Ö–…ÌTð§(6øÛ9­Þ‰ï@#|Ó²Oˆ]Aù)ô{Cs²ýG—6Øâ~ Ñ,²¨c_ü^Yºâ4)ãðÚ‰&½¸ÝÅ)` E¹p€ªR.‘)µÀ`¨ÌQCØ`~“­³Ù°Í†m;¶ÿ‚lHé<ýÊTº_µÈ6”:Mç%ŠpÃqõ¤ú“RWäTÙ~ÿ{CØÃÞá†xÜ;þì½ÒÐ½‰aãNˆ·•v>|)²÷ÌÚz†Ì¤óà…³×Æ4³ˆö;Lì²](M}{ƒùã¸Uï9^ƒÉÐESG¸q¸ŸÇN¦å¶QÒÐ½€Mq¶,±Ðyqwò:ß"°v©Oô4ÿ
–n¤oìøDkCdŒEl[‡SÊw Äajß™”T-¡/D3|ù–ŒîàÎ&Y‚¿ÞñPÏ³¦ã%î•„k(þÌÁê³gÏ›ä—g›¥ÔåþR_e?½¥Žiú[­&~¬U«ì×7èó¦?ÖWðGþÈ…O¯Á¥gr:j8‡®Ë9¦¡´­ëßíJŒ4Y[ˆ%÷é¨÷[‡ÒAáÇêžnR‘«Q¬­=ŸãMù Ø~ùE~ðq¿«˜Ï¾aM?†=ísè}+¤Â=|ŽwÉ%Ã¥O-×»a;D·O‹ÊƒÝ£œUÐÍ¤ü:ëQõo@'žÃcF?žKË¸¾8(¦Hàß€ßEk¿´Bï¦.‚ðñ–Î	A>íE{!![TÔà^¶5ý^[¯7~‹=Ø´ÉŠ—tú?ÿçÿC¯±˜€é©GÉKsŽ8­x
<½í½ô†BØw‰ç‹³q`ò|)åì‚n
+°lÛƒ¡‚OÛa6Ã`ÄÌ¸Q¯ 1Ó„°:`~‚X™KúK€a_Àp'4(fq>véÇ²Ç÷#p‚Ógu»Ý¸‰©|äGÐT›J£Ô»ÇÚõ’f+bz°ËìA°¹H~G‹.Ý¡!ö`ÒZì‰;4–<¬4xÖý]ÚÂçd3È-1LÌÙ`óA¥Ù¨"±«(<ªh"WQfTQfWqÝWq±WÑêŽoíí-Q¾ñ-üÿå¢QõF¨†ø©ëGô˜äztègÖT<¨¢¯±ŠnDxSÒJLt,ÕXFz“h5ô¯Ñ¨§W„/Ê?@¦½"]®oÌ¨£Wä8AáÑÝìÀbª¬ÿ#.Km.Ì§Ýxãý¼ÖC´îDùZ/£Q~].{=åë
“º‡8¢óQl¦…‘ ´âyøxc7f	¿Þaøø1è$åÊyüßg<1ÑžhÇÊ•fŒO¼4Ÿx©=ÑŠ•+;ô‰žùDO{Â•+Ÿé‡!§¨ÊÉ„çá“ÃðyžB/_l<]]\<À~ƒ‡¦SzÔFYâ·øEu³>ù-V¸ƒ^<À‹ÿªMa?T˜åfHidÍõhî,zx´IžÄÂPo©‹[šØz;~ÒŒÍ[–Å-;´Wñ“Ô-+â–Ïx‹?ùŒ·œˆÕ‡<	üFoºÀ@ACÆdãŠT`´ÞKú‰ÓÛ£ßøØ¼?è71<Ó‚(²Æ`‘¤Å¨8‘Ò˜&«ÑòrYª-µÕÍ…Ê°ÒÂkf3"£(H›”M\‹ðo%8?'!é ­ðÈ@ô—y3 9^À²Þ•²}<pFÙ£{(ÑÄ•AR[f?E7Q'á>^íµÌÕrao?4RýEiJ…JS^À¡6“Ü|ö !YÔ­e;^GË=5ÅH¯èóêøÏ2þ³B%¡Ýn§G:Úè²Fw=:mÞp|­øy‰ÙôÆÈÄ±[KS3¦4ª™}Óë4˜“ŠÛ×Ô*?`Žq"»;€mnƒt%ßà%7Áå¾èuÊ$)u+/sOMØ”‡w¦ÇFK¯É¦Ô•‚[Ôe7¼öš”q~`³ðçs+NÖYSÝÁ)|‡‘+‘ÙØ„cÓ.EÓœJ½¾ýmŸ£õýxãßK[ñÒvœèUeEeF$ñX€\eø¢<8Ã¦ÃÆlHð ‰ý0ZZGøÒ¶•¨i4èðð<ýÂÞŽ»E†'µ^$¸MB<¡Ã êP—Á‚Ð®­8]üGFÐP‡(:bN$…
¥–)ƒ?1þáq(K d†qÄ°œs¢ud_Î‚óØ«¢â×diaVªJ²s‘¾ôÙaip†òú’;{úI tr¨º$µävk–4ìLý¼Ÿ2Q,¦Ž‘L+ÈFúmØŠ ïfûÍVkÎY[(Q„øûÑ z"
âP¯ˆVÊî_Á8t0",dBïÑí'Ê˜ÖÏ$¢kØGœîø}°î`
?I;g×üx Ý[×Øì9:g~Üî¢sŠ·áè´Sª4îqj’ØPÖÂW¡0¨=…Xî.¯Qˆ5Nâ)C©ãB©¯hAsó¡s™ÁŸ–øºšwA¢¯¬Â©[X¥®3¤{§òÃ»Ày#æI À:ÿ"qaN”jb¢PBHþÌæÄ¿¿
cÇ=pØ?Ã«gä¢7tü>ëð³à>°J;ivú»0Øzöö–kØl›[ä¡ÿŒ®¸
¸¢2é[Â¯×Vž©Š 1?Í\
Ñ`–Þˆèz…ûR·i˜Á,6‹æ‚¶„¥g,ÂQ‘‹:Ð —„è’ö×Ëÿµè´XWóŸAk·3nûq‚iÄ£ ·|\5ÄÐNGÆV¢kµþ£kƒ9óƒ0¯û&ÖF/¥Åcš•ÃOc…$­ÌœÎf–˜P^RÇPúp{ûk9²´C—ýº¸økIC$ËÉzÓðÃg"Œ¥àÌà
[¥a·ÑÜ,•ÁCfAñO
$“9øì¨Z¾Þ[#¶ÝœÓ§í÷œý^]ÕÂŽ Xip¸Ëê¯~´ìaóî¤ø×.HP¸q³•37[w›$[>™q­–RYâ	$%.¬WSÅ3æ1¸?9ñ£šœÏ\T
Ø´›3[2ê×‘a¿]6FSJÆ'öã:W„t |ìëqºƒõQ|ÛUjd’|gÁ§‹ú=úaé<Kûz‚éf©bk›2Ì+ŠY]	ò§æD¦l1U‹©†¨ªÑ`ÖaäÄßÎ‚“[®V×˜‹ºaox	f‚˜”Ñ¸¯Á¨q™1–€n)MÄ_!l+kVà9³ä°Võ7HÙí?ÚtÞÐSk§”’Ì0ÿl‰O
R¤ZZ@±Ôœ®i‡;_ñ¢Š³ÕÇÀ§ØwpOrí™ÖžGw#ÌÿÏã¦ˆ*ÅÉR0ì_+{Š‡‘¾â–+»ýÅÅ…‰\¤)ÑÛWç9"ýóÄà¢ß–›àQÁº®3ã“Õ´JÄÈ,€AFøFƒÔŠÔU%¬H‘Ò%mÓ¨Šï>´c-¼õ7ØIöàëðÂ?þ÷^¯€uçnª`ºâ\½á~ ¿‘uMhP˜Ì”Žj\ÂÂB°¸xÅ&da¡	÷^$ü~ìø3’ÊßJ´"Ãö€¡•%Øc{Šª…‹1ñûiÉ+ìêW½ª²þ6²Wµ,î&|ç·jù	^|LÌú¼½Mþl),:dˆá=sIÌ/|EË†ôýW0vÐ:•‹NÝ8£ …U9BÇ½Áñ±¤Ñ¡KÓT©ufÇ(}ÙÉ‰,Þœ”„æ•ÒlT˜FÛ4(ãµ‹Hsqwé˜ÞR(=zR[5vÅs[%ëÖV<‹`ŠF g½(¾î“Æ»ˆ’Ë£†»¹þŸæžMxÆ±"=3Wøý¤aÖRÑRRmµ¾>\˜›’þÛ™Ž÷-MOæ‘[<V*Ï5ªB<™|­;ý‹TQ2¿%ŽiDU3‰Hcç÷=¿ÃcÄy(¨rñã“ÖìC<ãÀkZž	M¢g,«&ãXWK6Õƒk˜/ZíéåjªÈ%_\ËsÁrÒYLØX»W¨)V³ÏÊðkÝ ,úV÷—< |à¢(Éº“æù…|5püÌRw3Yi™âŒiBmÀÖ	_8ÉŽ˜p3Ó‘ÕÒ”oJfÖZ´v4L”u‚ì
ÕUÅu@0×™~	½JÓ`Ô'1­h–‹pÏ0”$9öu}uþA°'©ÍŸ±Át›dH=â{š™œ)Ûôå‰üN;'5‰Ó¹óOÖ5>× ¥òcž°¤IÅáÐŒœ$*ÓŸ-ª|]TÍT§³a¶ØP•4|NëTaÝ˜–>PŒsƒ§j¢ò<Jß¨eŽ3 ê==§4/¯×){gâÊ•Òf¥‡´%Açð
$4­P¬ð•js‚(Sô0LÓ²bä2Îä<qåah'öÿ(«óI†ŸÑå2M–’ÐW–Qj‚:¦”È«Ð<N“ªÐÕS^½¤Oåšé8K4ÑcÚPo3—XênËT›>Æc÷#&äàÒÜt(½*ØtapIŽz¸ÛX®¬fî[V©ŸHTÅ¹Êh õ¸,ÑÁÅæ³½Ëv_|ÆUý9®D`â5Ã`ä_PE‹‘Ñ¤t#+”4(¿²ìÕfì‰õÜX¨MõÓ E9›Ö56MXEïi–ÞÊÄÃ°N¿É'Àl¦‡Ÿ±Æ©â†Hæ^™Z³J‰G(z„9˜@	LÖnê®‚Hmï¢ÞÝÅ1Û>ËjQ]f°IB;¬<äÐ¼úê·ÙB’[xŽøªÊ´-RZ ¤lA¤@)+³ëh‡ì¾j¥§ÕœmBšQ(waŒ‰²{˜qØ3G%\ÍzÊñ|¤
TäVæšåI¹>>ôÔ¢ÂwôcX6eb×–©4Ä¡>‡û™g{&<ÎÂäÜSœvŽ8Cáÿà*Î8U]"Ù°}MÛ.Ã^„Žê<ä®Ð~aáØ‚zm‡öƒDîLp"Ã&¡½%–®¥ÐTÚJI-ìÌ…JD!µ³ºÂœAšçƒèÕE¥¾…šÚšP©z~,¿QõlUù.;ÚJÕ ´=›Œ¨q#övJ]Ó$†Kã5Ùª¨¸KœÙ©ÌwÄ²‘g‰Rp‘ãzPšÄAºS
yÄròOqÃþ…7É	æ¨‘øm	~Á²±å>cæØñ&u%©`Fh+Ä{ü¼{„µ*œÂCÜöø!)µB”
­xã3F)—’Áòˆ•…Õ U½’ o¥ØôÉÚªO—–Ê)8?ëwT:7¯h(6§$Oáj‘3¸ÄèüØ÷&\êÜªWqûáw:ê%³ô§•6[‘±8ÃVõ¢£i€ib‹.>´VJow31Ël¾.j³å)Zxl“›ØxÜÒÐêêEAeDÅäÈõ™;¶Ww±ÒøTvß™Œ»ªñaS&µºòIdqmÓMŽ­ø'½
üýÔAí.ê ÈéIzFZbg’h‰¤g¢MVŠiŽÄJù~U‡K+Ôý¡¡É¸º0aby¦””0Öì ‚Î(Zª  ôˆ—ÙŸs¯vÛ³Ár©5]³,³ëŠù´RË½ÀàÄRiÌŒŒSÐµ®+­´Vt¡~ò”%Yîæ*Õ†Pr=|³H¿–B\)Ï©“†A'ï¤áª¯|]I<¨}Aþœ00MQ6N ŒÉ	„ñƒrq@›1RKÞ°a¦Wä1ËlÈóbç
‰x+v¬`?>¸Š€ÆÁxd=u°<ÄÑÁ¬“ƒìr}ÅÖs>ÇÆ¿0çM,àM‹s#>•½ï T4{¨CÎã†®¬uD·BÊå¿	t7~.áì0iñsœïaî*æßf{˜•>cE®Á'&%írNùŒi€)n‹©–\¾¦2^wó7êŸôÃì\©L÷s±^+<f¸Ôý¤Ë¯K/Å•Jƒ¤¥g%°—ãé¤Öa8ÓÓù9–žÎßŠ{:Ó‡=™<uÕŸfh%Ã­‰F¢¹¿HÃŸgz:Ëõtæ”eOh¢Te§-ÇVÌ“ú›êI¥”FOêç8Ã“ŠI¶Sñ¹Iøç™åTgëkº—i×tVÐ]¶¦í‹³”Yâw5›Õ$¸$_ëu—–‹Vk(×zH:+iÕª­iƒŒÔ÷#‚UÈ$¢Äw'³˜°ú­b™%Œe‰•©ôP©Ï˜öŸ³cŸt$Ì‡ÞÃÏÎáÏÙ™sv¶XÀC=‰Éä¼=øÉÙ#›1z÷zW¤Sª•îÿü÷ÿuÎØœ3ÖdØÎ4¿åÌ$&ÉƒNhÈ—êœMÿvÚp«+?›ÒÚîòŽ
o½Øg6]ä)/f¦3çÖ¶§‡˜jåê]Í%T·Ïî¡?êöÚQnºx1o^"¥16ÞJñ
îÌ%íRh‡ÈD^eÔ[–é¤EÓ’[—2ÔZÝïÙÖOfö1†ÁiÇ‡­¼i+ž?öÙZæ-Ã‹È]$?ötüö'LÇöCMÇž ðÀ	ÙsÃ~ìiÙ}ýiÙ¨i9Œ» ”SwD(Á:qÃôÊSOÝ=ÀLð,Râ‚°Ö–˜¡!®Ö´Ã~55g‡U>gëÕüÐsƒy
©Z*¬…òSîïª5x‡qÒ±ó|×qt÷Ì>žF£ÅOˆxŽdÀðK­½õ²!v­¾ Zr£óu·œò®ØºCqb’läÚz‘£1êTJ(ÙÑ	=£Öž£¿¥s¡ÅeÍ·öÆÛ]Øn~x-O;®Ôã4¾ÐvI¶çÍ mU¶^=uVkÜ%g;°˜fŸY93-î‚&vaÅ(g°m!“z—TXkù²Ìn¸“Ah¾¨Òøà0ˆÔØ_úµHdpUg1fjûÔFD£ßôÚÕµ$Ä6¡±æä€¡YT>MS9óeOÍ—=3^&Ÿ+2	f(Ÿ
é9ÕÜªßédè½7ÂsógDKwV2ßZdj’‡MÂ°ò™	B,}¦Ðž_ø^çFtÞÁûZ`^(ðìÜSb{Y¡éÀg†Èˆ@ôšÌÓ¶tÔÜ}dö©0¨÷±Á(@A§Îøöïé)÷àgÇû5¾–UIÚ°ï–ë)ƒõ™™ûõY°W–òšJËyùvŸ´ýQ<©ped÷/’*©uç+˜Ü”´9ËÆU¢‚3è•†ƒ’;öM9ËLÎæzµ:,T³	´@ý?la£á„ï‰ Úô„t—VÖ¹›)µD~«nBs0\xùß\OÄ2±oft ï¢ñIÍÂÞ*p(ÍêØñaÃÑÞ—Ðæ/îµY¸»£áþ¯óÚùêù³„Y/WYÓAâ¡ç®ç_õ¢7½!¡ Õ`v«Ÿ7H¤Ï&ÁÏG¬ë ý¼ó^¿¯x¶â/Ÿ­Óc>\|G0ð{Ðéªc<ñ€§«ÈÈny¡Å2 q–·Ì¦èL,û©ÕGW®Ç®A?iÀãYpÕ¢lÛp«c;µUøgiþ	/ÎJUÿ{âT+µ²Ò›æk:†AL›’ ðÅnB®•ó•5²êy3 nÜ„1bÛ]ªF“ vØÍkù7óPˆ<¹¦pÔ˜†(ÔÀY"3PPq¥do*l;àŠ\§UÎíOI£±÷I§úz†<^)
‘cÃ>,}ÈÄ8Æ<\“˜‡˜J“`ÖRâ&r&À+Xô…`Ä
	A£äaP
¤c"'ÌÎv°ÃJËù]Ñ¼£Ä:o›-M"~±(²Ñ'ø”ÏuIŽÛî)°¼A×ÌÐñzõd6XqDR1¤¶ÐÑT°¨r“Íw$º&ytF·#ä –	\¢X³‰¢y*x™‰„³;çÑLÉFåÙªwÑ)–¾ò[jí¦ÑïÔó6ÿ›X‚Ë4_‚HNßö¸¶SÀ­‚4ŽLúœ,sŸ2þ'(ºøO
§&W" àÃ£›n’¼©D¤Ë,j(«áže$Y¯Æ²Ú(×ª´û’<Ê¾rmÆI$4Ü°^¨¹h{‚É±è| ¬¬¾araÓUÃnô_æ VÍ+je#®ª=<Ýi„ª¢1ÿ0ñ‡RËê2Lÿ)+¿GácX0Á¦¼ÂãP*éB>T„ˆáø›ˆï
W8~/nÈcEþ9Û8>gÛ;è:|VöP 4BÄ™-‘wõã¾Âµj™!Ðˆ’ßßêWNÙã§¡²Gv:Ó¬¢iZ–‹Ýç)
Ö¡;f´, CãúìÊšmÇd½²‰¶$›Y"ÅÀÔª«ÍžÄþnqñ]	¨'#æ<NJOa1TÇ$§™Ó.l&ŸÌ=¾LìO6ð%ú;:‹ËãùìÚåli”…Rª‹"P]SÚsIdLÞƒOe‰/÷_Â”–"ðú‹´' Ø_Qê™¬lƒ(ê÷F½!aîîð¢ß‹º´F+¬CjGX”µÝ#ˆ†å¹[ˆ
Ë©éá©ñ¬„ÒV³¿ÐÚo‘Ãpt1ÿÅs?’vw<tqM—ä m¿×‚Nr—Súøf;Ž`%ãm[aŒïlv¯#ÜÖ(÷â¯¯‰ß»î‰g}§/Èè9\”ý¾Øƒ~³ê¢¨ƒ·ƒÁ`<ìÉûÞúg=Ø›^8^¿ô£kzýbL¬£N\M	¢’ 0íó9ìb/AðÒ^ùÀk>ÞŒû‘ÿçcÜH©”ä<ñ®°›‡x»ÙÃLÐWáÙsÕîb›@dð2ê]:‘ïÁoxý`ÜÇ¡ö2Ú·3è{î"ƒlîa7÷Ïüÿùïÿã_øö‘\F §?Ž‡6©¾©×€£·A1ŒÃkˆ½*[j•fß¯$í<^;
BŒZw·qS:!žÊ$7RfLZø@.h>—G«Ôù´•ý!µL&}kãYZ/Âi¢w5Ãàf¶OÝ]?Œ»ÊÉÙ“¬“\ÚÂI ²‰‘Q0ê^‹¯Ç Q7FtŽòç²á÷,QŒ(¤6ÈÏ(öÂÅ6*â9­ z³…Ð`:ó©,yòü|<d}ýW˜ÄLGlæ­N‡Ç6|Ýíôbñ=ô“/Å•¡ñŠ¢"7(òxÁÉOˆNß»èMû-#FÀ/Rî}¯ñ/[/=|¢%ùC¢[[Ç'ðêO#¬k.^4†+/A¥4Î§e–LÀn_yg©Ú”Çï¼‰¥èÜñKo[»ìbu¸ïƒv«mþºQŠôÓÎH©Y¾½}é½6«É!ºÎ;Ž§s|"RÈÆ;VhÚö/ÜM²Ò ¢.˜ÛèñØ¼ÚãW¢î\u7/öñ
VÈãÉ­¿ÊÔ‡œ{v{KÿÖª›¾¬*3&/.ø‹¹±XØæ÷ë	Ö£!Þ'}ÌÒ¾ãàAû6L_¯=îHŠ}o7EË÷%óà· j¨×´<–	Kš}'»Åû}ãýííÂB)Ð¡A…Ù-
¸µË‹‹%°p6½± I2InNJu<¤Ô“©wÐ—(ø¥jBï`ãw,6z{ÛRöˆw¦>¼¡±·õº<$2À×shH‡ƒ?Hz·Ï´¬ê!µ:]/aÀF.w.ll°Ë›êel/ýÔ·}øa×Õë$eÍ4­V=™p‡c}Õ	çãjÕ‹ýäº‘–vâŠ¬5°P[ÄëÛÊAÄé?¸š ¿lïß¶õ'ù„-Æ€, ÁÍ`ú²•äƒNüz@ÊI93xt[>*Êð%«q›”)–OŒºcæ•„¯JóSþ’$0ñ¶±ªSªü.J!KåÝ¼²”I÷«òû·HI<BÂÂÔ‡¤äJsÃ·ßÇ‚œéžÈ9}Ê7¯p¢¬¼$d;*]K—±çÂ‹a3Sö^c2´Ð6"å²Ríß>kwŠ~]ÐÏw“
eWÉo1Ù¸÷:+
{T©Tà:˜Kåéó˜P©²@+TS|Tà‹KÂj‰Å´&/|c WX?+€áóIQŠÛ[øN’‚]:tClÜ«÷–½W¥K¬Ã¼k©JOKy;ç„—Þæ«ÔáK3j¸ðT‚‰s4&XÎá8s~¼ÌÉ±Mx´¸xFèº)Ý Ñ|¢ŠU†à6Þ*K¦}ÁÎ~J7`Ÿ¾f»¨8§X×lïaÛ	þÖÛ!ç>˜r¥²·°ÐcÀ‘å8¼¾i‘Mâ÷b',¨ìÐåô+)ÁgïÎzK5¡H±sQäQxXîœNgæNfÔÕQÏÿY‰¦¨›™ô‘¤-ÖÀ€¾²UW£ÕF×I‰Y€ÇŒIŸ]ióuzáµ5å„õÑM´éâàòšG%þ±´‚~ ­¾˜;5O`-ßOí¶¢ñŒ>[\¯2ºóœr%çùåJX}Ãå©„ûeÐQ±ŸQ®Ó‹OÂ+ÉsÜ ¸³Kí˜ä(ˆVÃy¬­ä‚ÍåXÏÄèM86C]æ‚ÕWfŸ¹Ï^6Ã–s«éåCgŠ%›PÃóÞ±”€±¬åy]-2è]Ì:mÍÆÐÈªòäŠí­3[°ø¯÷§… ¾õ‡˜QI•yÁ]äíÝ=Ÿ9ÐÛ	Ý@Dý Zåª8¤eç3ºñÔ\yj‰”Ê¥:	T£Š>äŠ‚VüÈñ@än÷*{¡n…ÿÀ0æ†³¦Å©Õ63/ÎµéÝ†‚N­ê™Üäüœeª¤ôQ\Ó™‰pk3‰S½Ž¨Ue”­L¯e¾ºzc]mu$º«\Ù)õI«úPö;Xù„’®ú'¨¤kQó*Î“™Ùçé’}jé¨ºY:Jí‰ZÆvq±”Ãóåœ³øìJ—ó+T]Ä&á­aQÜ StfÈú&“Y(D"Z¡'[Ùf“Øtžá±/xPÐx‰çÿ]Ðl µ½¶6(øWè6¨SÚ<3ÌŠA´^õeBÝz˜Ë€â(Àm]ý"í<@â?èZU„
0g™Ÿ`Ä¼ý|Ä°gí¦Ö'ÆBUSOt°Ñ³S\§[;¤=‚1¼ oÕ[óžzëÞ3¯k^­Î@Ã‘„ö·úJœOr}2=Ò}üìÅwœ%£¥ãôÅÆSéüùµüËF-Éa³ª«Yp†’âW··¿ëè†èôøµ|ã÷I—0PI”lNóŠÓdgíì‚ã[æˆÕã­¸Òkò)Ça«ø˜ÅÑmìs/±Ï½ÄdÅê%&+Ï?”Ž)è€š”¤ºh¡È·}­øª'GÜ©âf¾¹¡JF”œe³”$ÏC[|·\§Éíšå¯Öõ™@Y¢ºJMiK•KïjæËcž§†S’Z9£h 'Xdëbî{ìƒ6Q,	PxJÇ_ñ˜ —m}¢ôj;bÄwFñ
™ck4g,uþÆæíÖGøïÕL,d˜Çî¡@Ñp|¡a„0^,áÄƒý¬üI/î:Àrxäø!k^è÷$Ìæõr±]ÈÅ¦åºôm@ÐúA$]RÐ °¨SŠC|;Y—ª
b)r'i§" eü›È»¦ÿÍäÝ;ÍW”yÑÂ¡pz…ð£åÀUQGAä£¯V³¸1Dáç1áuµÇ„—øs%M›þAÄÏ
/,³DJø·X"Ýžª~'Q%³ímƒý&Bj.wõƒÊ(±æ¾†€ja\BãKïl©¶ª`[…Z-1)u!¤dús…OÏýAÄ”L».,¨’¼ìo'ªÌdñtÎøÄU’Æ1èo"²$ ßŸ/²âú“	-ˆúºõ5DóÒÕjNò2ˆ"ÂÚÀ°­2RËÞÍ•YVýv™eªÜœ¤:æÏ6›;±¬~ÏÄ²ºžX&Å“–HÆð«Óg\WÅãÓ_Wðš¦ëÑÿ*µòI
æI;_(t"1ÊMóžú˜t=+8á!óJsrÙÿ»p¨‹òW¯( Ö¬ƒß<Ð3õôØÇàÄq==^Xø”TÇ¯AœØ8F$qZ’è{6¥‚Q	ÁzÒhY:I©x=¢E‰šÁmEÑ¦*Lª…dFJ\ô4p·Üs.$Îá’5qÍ3†a•u—Ž×ª_º'`îEq0Àx¨ ß?ó‹§mÛ ÙKnß?#ý9áŒÂñ™jœ•‰~Xö©ÈaÙè
ë°èuSŠ˜Í>Ë<3O’íëééü'gsÇ(¦w©G-%«ÉÖ½ÙÜ½Íè i-[£fSôÚ$êöFž³&
›IÂ	Ëp_xöÞ¹ÍòsÀœ¾áCžÓBx8øËRTXré÷‡$Š²‰c}tÑö`~>ˆøa»›<@;°C°€É¤ŸõÄƒ‹êcù=Àt3 {öPÓ7ä7x„—Îþ`@ÂÈÒiã×ì¦²Ž•ö²n‘Æ\T á«È¨-^€ÆáipœŸ“Ê6‹ƒØÿB"+ï"ûì_ƒÄ°SU;É,Gù,þYy›o„°Ë[\K)ÉoX7	¿Ž{²Z¢7céÄ 7»4×&]`ÄáÙÿ›\ùXçs…œÒâƒˆ;ëûÃKÐ6Dì{Ùõþ38@%’aÌ1Ã‚É[½wcÇ€Ðy+P÷ìþ¦Žf’G˜„¹Õéh6Ï¬ Òì^[)ÃÎ‘=Ë9FW»£”ãN¹,;;§l¦< }ý|'‰4óEùéÍ˜eÓ`>8ŸœØêÝ(æS¸ÙaÚÙ±±Å[‹¬:Ku:É5§˜BŠ×‚.hyÆ[ý¾+Ù¿äCñÍ*ûdFaœ4Û,¯âfÀÜ)˜›Ç¾,_§dtá0ígND¤…¬fÂÍeEá¤=jfn;w’<7Ÿ”0œ–˜:Æ¬+k°_Ùy¼Çyµ lÍ*l1“
MEãê&}dvÕ€Ð)¡ZuS…ÜBB…ˆpLJM¬èxf*šMVuÅLOÂÓª(R—QŽÖ§”4o6Œ¡â¾ICM¦7ôv¼ââŽ#9_HØ€UlQÈ©bÅfž,ÕžhU% [˜5MãÒeñ;BAFÞ9y>I"Õ«åç˜ÇÅnß5ùû9XA%ÖÆ.A<‘îEÓÇ˜²Ü!W‡ç¥]R~.2ÄxìîiJÝ®–Å÷ëímmf‚ì
J„ØR;Y¢Ü™r-ð×ýRmó’4ž={¼ÎÎªN16ÔêärYL©ÝµÅ*êÛšJ×–ãwh‰ãqö¿jòëÊ©H¤§éXœ²C¿5\MK~È¶T€–@ÀC“²ý†ã>†9@ãþ)Oi¾yÿú†&.L§Ú!ž¢µª6L¡ÌÀü"AøÖàýÔÐ,>.1-‰\¶ó1yk„a£h&Iéh`:6ãÞpŒp8˜Ô »ˆÄ&*k‰$ö#†ýíˆáù+ž,¬\õÿƒ¢ûŸ-d¥Kfœ9·ÞQ]z¯Sf½‚¸g	´˜q¿¯pïEf5\\¢ïÈDÍ=º3²r
_39ãa\ƒ@eŽ=‘ñÆPÌ£Š›¡/³ûÁŠèÐ€ìX¨³“ÆAQ·Èââ˜æŒK¢\Ÿ5 Sù£ŠqõööfŠ0'1ëDS¤^=ýœ¦œK ‡üÌó1öÐÜs‡¢å ÃP®¡ç¬ë²ßfêZcgª¿—uéz|,!%I†8Û­ã†¬Hd
ÌîZZÏ9òImäRÅä îR$s]™àµÁ™0Àö¹ ãÚÝÄì‘YYù¶2îŒ0šBV%yž•Üh1œz¡ Sú+‹R%Ç–nrn©h.Vô–‰Þ¢%Ù•å–:AnÑ6eÀs©RÒo”5S|…V<˜k€b Ú‰eôäRÕ²1™]8Å*ºwVnûò,¸ÂáeÅGŠÛî›±ôò[`w¾Ë÷ß»¸ÿZPÏ^Ü•[vØb¼¸d[v$–¾æPªƒm€¹ð+YÙï–-òÌðcdëU¶@´]nºé/ «'{­HÊc°âV)£Ú¦¥‡cPfÿ–Y¶h¶tZ×ð£ÓYR!ïSôà˜
‰Ñ*º#`__Qá¬JtÐ³à!×SÆÃ…9/z—“fw‡<@
×@/µ0©Fœ-Ñ%	O'õ¾Ö	—Œ™ëœË¢“õcÚÅÛ#úÆÝ8
™ÚÎBæÌr•ç&÷Ëi5,&Ë©W&£>{¨“0ƒª ¬?W¢`À(˜ HÎ1ðJ%š]$1îÔE?ÀŠ(o`»nûX(¸†Kèâ4^a<66›JÏ 9£!e±ë?üåøþ³X?§ÀJöIàì*€éX]_1i8‡à¶Å»³.6cÒdÌs†þ—Þ…OÃ™U• ÏÞvz!üÂk¾gË—üCfˆi»Ñ6‡œ>v?²`x¦Ë¨
STì¾x^QN“÷ÿeœÈJ‘’ßÇ@š/y<Ñ—Çèa\wÝMíRÃ\7ÉbPîJ¬í\|ªpßíšx uŠà/xE«‡d»S>*‹”-+ÅüEï³sF¸ß½ÕˆvÁaxåW)1GTÁ×¶ŸŠF1ö¸¥ž¥%ØiÈ©þ¬¥ šøÐ‘’~¯Ñ’…šýsÃ)3ý3*sžýÏªü¶aßø¤2@ÝTÇÇ]O5I@¢á2¹%™ ó b+À|¤ÝSñï¥üE·K–ø¥gÐ?¦ô½¯qŽˆÃH] ~¯c!±œº-,XA7miˆ§.$.qN3ÿnoYNû&K÷Xªe¿‘ü¯œ(~Ï,CE	ùvñ¿|[îÐÍÛO§ÈO§ÈO§ÈO§È=åî·W½Q•{dføµëº_{%3Lº@xpÂéð.mâO)l!UâDµá&Ìú4qytÓ“Äð-Eß£†R®š‘”2€/]Ž+¨•Æ™gŠ!S‡hzoäáî¤Û}³»ýqÿŸ
ùä»6“Zd	ÙwIÀT]²¥Ÿ0¸„†[Íæ›ýÝ?ƒ„âU”‚)ô'yERQ\øZt„íc¿G:BÆVsw{ëÍþ¿ÿRª¯£äa0KBKúU’~ûZTä»¬¬ó­7X‡¬ìƒCë>¨v~f•It“Ñ@‘IèÔqGã‰%Hm~½ ÌñIY‹&7£ŠçŽ0cÌlý90Ý€lr¾ÓŠ[Œe0 `ñûÓ†í^Ü‡Œi4?«žb8œ•ê‘Hš\sg–MNja±šÌ\û:lyìÒ:¤h²Àz2HC§1wRñF¯~2Í(MZ³SZËÊ-?mŸ³¶¸á¤žEÎš¾²°<`‹€-LäÔœE§^¾«àÔiƒ«ì‡¦MVÌ•´YÚ¬”¿µ(TËf¹æe\H¦^\Û•zæº‘Fd[Ž´~ðÍýÝ÷¶™H7¢Mžv.…_…½lÛhU(Šx !¿-“ÊÃ…OÃ^9OÐßéÅQ¦stHn®Åd4«Ô\oÐRê¥Ý¡Ë•ª²=Ç
PúI.¿B]ükúüVj}ƒ³Ÿ'ëƒ>8à‹ûLè‚Øë~Œa¸?ÊÁîöõ2ÐÏÌ±æÄyÉk£ns¸‹Åßžõƒö¥)1à™å=9;½({ ¤h!â¿•çñ,óøRÚV,ÝZ®¢9Ö³T`J4UvÞ/%—¨’+sÑ’»Ìäâ™dY*Bfše*‚ÛÛêCèµ¤ƒš –ÁjF–™é_dýhH5E…ä÷1½MÒ²ÊxTxŠE‚`ÖËÂïgŠU0ç‚sœx~ôIÞŠ"E´ötá9‰Ÿ™®iÿ»›ãd“Xp†åŽÓ>¿yØ°ï[µ%]J²ÿÿ   ÿÿ Cæòxœì½éZãÈ²(úÿ<…Ð®E[»dc›¡@”á0»( êf‹ÓÈvkaKnIf(ð÷Ý?÷îïûh÷InDRJJy`¨îÞ»{¨²¦ÌÈÈ˜32ÒµœÒ¿ƒû  ·[Ý|lõì 8´ûÄºÜ—´ÁC±ªùÞÐm“vñ¾§uzä^sBÒŠ-â†Ä×®í¼Òôü6\]»íÝƒ¾ú¶8¡ã¹E»×ÓÞ=:¤tw÷+q®»á{ø=ãß¡Í~×jµJ¹¼©7¯‹¤O|»×..—yÓÑxC·ðßˆôœ^âÃÑ•Ùê:½¶O\ë‚ŽN1¸;€¹+­3|eÍv¾’â`ØH@„hd˜ÏÁÀv“°„ä>,^T*ƒûK­ã¹a±éõÚÚp0 ~Ë¢²uã¸×Å;§M‚p60iãÐwôîC]ú™Ú=KÓÍ)º0õL÷â…e~^/|üM¢Áå?ýrdÀôú·™G‹ú ¸"æ9?‚âZÒ ×ì¨(Òä¢ž%ƒæ0=Ä~ø0€VÅ¥çn÷œÖuKL©Ï»bea‘2@i»¸ëÝk]ï–ø–Ü#'ýTU€Š¢™]®À%Ù€ô:»K¥8%b!	~}Ûv[¤§K(J%6ûN¨›m'°›=Ò¶îççƒùù¹S²9÷»U&éé©l¼/H3ÝÓ…7Ø”==Íý.£‘[¬H8qÜ¶síÑñEˆá÷€¶´š_‹òÝÖÐ<¿èz!ŽÜ»#m†4†é\„å
™¬pú7Ð›ÓyHÈ*™. =Œ4Ü¡ù8ß‰UYL&ùž	¯ê§ö-Ñ¶»¶{M¢˜ß;%=Ò
þÓaóßðžêõvtÉ)ýRAê<v¼¤DÐ#j£®Â°óèLE0c8iYë·-‰¡šÙ&£þ)Fé¬·¼~GûÞþVbºIÂ;B\ŠjP÷Å•©ÀRëg>½+®‚(_pÕ»–(3ÃŸü>Š‰äB‰1&q	ËmUÈŠJ|¥!ï.¦ÆÉzIT¬¡ä?DvLÈÏí8×C_¦4ÑqA$Ûçz¥ŒzEêaI£qjÆOô:ô}§5ìûÚ¾{¸ñü]Ðr¾ÐNOÐ‰‡!=}¶ºødŠ™Ÿžjª
ªÉh]†û@SÎjtÊð]‹€„ºóíŒ’=ßnC#	FF }ÜÚ½!±<‚j…Š
Ë&µ)Ø(býk–è+†™äø‰
EÀWT5U@JaoöGá¢TmËÇy®Ê¿”ªeþ É2ËŒ2eËøÀsù
´{.ÜRtøHÆbÚ ˜”©8ýÌwúg †ø×¶‚Œ)|6Æ|WÉÌ—Vóz5ûzuÌë‹Ù×Ç¼¾”}}iÌëËÙ×—Ç¼¾’}}eÌë²¯óújöõÕ1¯¯e__7MeÅ<•Ç} šØŠöÿý?ÿ÷¸Ó[©ò¦dˆ˜9#~œ”ÙNI™o¥A<Ž“1•4Ò§ôí©%}{jAAß^JQèd*ë"O»òÜË+ÍwId(”µÍXA÷¨Ô#îuØ×3ä?7¯Þ=Šß#:—WÜ;ŠîyM~å´ëÝ¹Wég8}xÅû¢==­oß»Å‹åÛî%LzýbÐò½^¯iûi»Ø(D$mFÒ Zt"7l—ž= û¨ï¸Å»âÅj*†]b·“m‚5ÙºyÐBoP,kßÁùILCìÇˆ_åËcöS^B®ýžœ{%¬)¯ ìt¤ˆ%MFä‡ ¾™L±Âá‰çîÍº:Ç÷Gô³,2x«ŽrX‰i¨ÝéW×aþD0?ÿ#û=#v«·~ÈpC'ìA‹¿úNˆ6ä¯žh,ð!Ãôë¯?œcgžßÇ0vfJŽÏ~(HTùÔƒ€Až( :«#@¿¿%±øé>ë4\è‰8
tÝôÚÉÞAi@³ÅÿHÄ©NSë®ò¦hÓ—½xq“Šx¯w
:Øú}3Ø¬”­5+Ø\³VMÅÐvç”žò¸Ä ¸*ëPcbDm;è’vŽzà¢æ¼+öÛZŸ©Òi".ó(VV´L˜ŠjÐ<3bb¸¥/”y(FÕbðœ8<êR]2Ó&PáÐ§
ÈTVTïZmä®ŽÌzQ@F‹ƒ4b3ÁL:ý°˜0E1†è’;-m{¾f·oZÇéÒ0.à§ÛÖZqh¨ÇkÚ$´^PÒãÐãÈ°.J¥ÒÑe	Ìê° ƒÙ'Fm]:gÿ-úÒ•QêÛƒ:y¶H:ú¤¹˜°ä°=€öš*S…AÒÎ™éÏ³~™
ùÕ¤v`œ.|—Óv?™{Ñ5DÃZÄ¸l?TŒ7w¨œ\@ªHY2ÕYÁXu„…
ö3N'´Šžžôí£“†n€4c¿èrUM6³±Q4@­d£ØVã ±}¶ÿoÏî7á#Ñ»’Zc7ò«ì7vôôz_bÅJjOZ ¤-âgÇ½‰¾¡Òôš¿-¯r©‘Ä€Ðé`!ê/ÎÏ§np±QæOµš§gæ1IšVËùªP¦ªˆ\“Kƒóop‰º©é©e…×`'y=²OÚÎ0-«’Eùz*rŒÀé\Û,$+)}&¦’pµ$ÖQ©§Jb8‡Cœ£Xáä–ôjèŸuëjïÝcâ®î¾õ¸UBíCz†`¾ÏÕj·žÓÖÊ”xùÔò&¿´ô"Ó’ÿª _TStŠü¡Û‚no\T–)ƒ8.5{^ëFê¡P }ôèt
sÎbÞA£ŠÌðI8ô]m<±(J"Ï	ížÓ±¬”úæNZ¼ÎµKu÷:èTÐ´}R;/¡Ž-A>ÞÚ¾Ö æYgÀ
R’¡ rl³I° ¾wàÝ¸¼` 
7¤–Wò³›ôg yŸl‚fn;Á g?à˜Ÿžú¼o+ÕèÈ(/&Í|7=m^Øñò³©ÿCŸNTý¨ÄøŸ*)Á‚Cõû´ÌJý%ÈüÚ-öv»G¦¶`”¦9Ë’Z4š7°[N–³áŠÌâwéz*ÆsA…]ÇM>@Û(Ú¾(?=µžžææ
ö%~Xœ‡æççÒŒ=,…¾Ó/Iþ ®J½¯|Íˆõv”>!r?¨Äiâ"aöèZÓ6ÌFa®lŒŽ]—S.ÒVUÖ&N)jl½kþrf‘ZÒ\³ØDEâùñÁ¦Þh;Â}´!éÀ‚¢DÈ.c¤þ-o/Ž‹='ŒÕÊØõŒI°0/Å¤¤1q²\>I3MM{JLN2lâÔˆ4³—OŒ~BúæŽäáßu^ÿúé‘HÎàåÈdX4¹Xø“)¿ã~X»Ð`v¶B³_¼~ìÐåtÙBÿb7Àv¯µÏÞ¿±ƒ¸¹Þ}¯h'_
A8l&¬Ðäé.1…Kkù4ÿ
Ðj¹fË»mûV`:Á)ûê‡ÜYvm®b^÷¼¦ÝóŒYÄ¼³Õ³Ý«OGÆ#…ø¢eÖ/k»¥a@NC €Â\Å0‡ìÆÀ8³-P‰Û„+øCRC7¸–2ødŒâÅ;qäøºÙ%5 €ì»aá”|¹E
ÿ§\\»\¸6uÝˆÔv—lÔ*óó]ò±¶82/äž.³S;–EW˜Z„£½9Wkº
Kƒa³ç]¶^ž¯K.É%Àx0ïk €3+†Ú[ÝÔÑ‹DnÚå™K;ŽÛêÁ< „±9ÁÏæ—ÈÄ‡†§Õ¡íØz*úÔÓ
ÖwÞ¡!@³Fî{ºÎEç²§À¼±(‡d£¼ÙšŸNhYé©ÈP¦á½ Þ m[€ç¼ Út™GÑˆ"‰q f2ô´zûÖ	VùÏ÷Bf”i¬Çl¦)¬jO˜ÑÞ:ÚØÁÓS …?ÅÃÅ˜;ÿéb‹ ø.ê[¿o`xHÐÖ;ìÂ›÷…R©¸Ý_¦~qhÞ%˜Ò{zZ4Öé&[pMô­ï
Mü²yÉð‹-s;ñ10–¹ÃnœNÉÅ0ORMks®b¥Àë“2plÐêz^ïŸÄöá¹|i ØòÁo“š¿¸„æYPîY|RLÔoÙi¹Ðÿkè‚Qõà¯úðzˆñý”€ šHúQ+ôØ¯CÐ0üæi‰Ÿÿe»CÛÇÏwIÓç?¿Ø~«‹-|§§_Ò)‚ƒ 74pôŠ.fû Zgd£¶¶‰O–t/VèÅ"»XœŸG§I¯ê½^•.ÅÍÇ>pV“‰TeÑ¿z€ËQä…NÔØñútÇ8Póo"XIÕÈ5TpDÅJ÷íø~ìÄW>DO®8$ +J˜Õt„²±Da¥›¶¸92">,p„‰Ú Ÿ*º!i,ŠÍ«wâõÑoôwô.Æ0ç~3]’¦Åh
Gb¿IÑ°ßJÏo€%GaCÊÂ?í:¶ûõCžÏeî¶íà­²	wÄû—OOùRzÍ 
Wv€ük­ÐÛ|YaÉÆÕ½6®§âGæ~ôÄk‚à¼%í_0á"`OµˆçdÕ:»"F Sêþþ„3ðiBÌ¼‡Ô'Ÿrc '¯O@ÿ¡AßÄu©ç¡E6š¢…0¤wœÎI-Ÿ7¶÷ëûßžÑúýÄÖ£@ð¬M‡ÀÅÀObÂŸ7ôÏ{rinÑŠÔ%˜LV‡aÜhÚçƒf“þaî’®—œ’Ðü]	Ö¶ˆD®¸‹í’’Ýnã„¢!‚­t<µXŽ€là°¶¥·À
.Â[ºéRžc ƒ‡£6Íö°ß°æÊà½ ’<ô~`m`Cs˜„îÀëÚïé)^ Üà'¶²¾J+ßÉH¿0Ž¡}"ø„Øm-ší¶µ0e|»EeªÓsŽëÁÏ†{ö*•¦aœ÷Ðiü
evË!ÀôÆÝÊFìƒ)ÍÛ.44tmW+Ôå¼yŒµ‡«Z`Ããë=€CÛÓ
àØÀ53Æë¼9.¹_á³ ÛÝó¼6LŸëâ2Žó„W¶=š	µÂÞ—“m„ÿ†¿ÆõAÁí®²C¼º†A»öGã;<#­®ëõ¼ëŽVAN¡ˆÕ
gcºwñ­ƒ"¸~Üø¤_¢Çr¡N‹~S÷CœãîÜ±{R'øô±{t¢ètr^Ç›Øÿârm›r_¤%9SF¶CLœC®1†T°0P…ÌåÔm@$mÜGbà+®›Db€EŸÑø=gdYJbÉçèq“h<%cR·žž”oÆ®Júø‡ËÈ{4nbm
2¯KŸö>*úÂ÷1P|ŸŠôL4fú§îOùæ¸þbÉ[ÜY²^h€Ž¼‰Å0ànQ7…oƒÜnbÂÀãÅ„Úc%3v@¥3½ŸÏŒBÔB÷…îˆô’¡ºN›œnn¸ìœÃ_J¼3xS¾ã-ýüÃð6WáÌÄyã‰VÁwæ«TéEªµ§§œ'Dy/Ì…%âbr$ióàÓ~l)åíT6zº(iã11uÜ
nƒƒ»ùÈ”=…oýèþ&kÝž ‚pbFhÞùa!8yÈ`Š'ú
TÁ{ÏÄRãùXâñYäHRnŠ‹aŒ‹a„‹ád\ÜS\ àªŽù3ñp›ÄiÈ-3ñ¥žð.±è›{ø&Ã°Î¥+lk=Ùã.ƒ·3LÌÁ±mŸ|œ©TßC‚})Ü†ËøÞœÁ²a²hO@¯¾×ÀñÉ{  ²´ †Þ0\IÞw<’eòMŒ‰M=r‹F.hDx}A5\c„d—îæXñO@×„ÓÑPÄ_Ê±ãÛØ‚Áoüš¼/fO›ªTÄ ZÈ¦VVè^l.vo£óÒ §bZŒ<µÎœ}ÅïäûåÍÔ«²Þ%ïAfþg½ê÷À#”ÂáMi>ºd<nÐuñ»ù9bŸ‡˜M¢zpJÌžâA6ìT #ÍmÅ Ìì·Ðàø4^»…›ÐÔÙÃ@GPk-ŒMšŸpå†‚)5Â(ûÎvÀ²qiK0Ò„’‰»^+¸(_šlI¹öhÁ€iäbÅÜF	ŠyæGSÚ<F¢q®Jm2h´¼ko~þsA¾¦O,ìq“w@®€G}w‹×Ð|ßózÿÒ:¸Mmoö‘†`Y:%fºÆŒñl1Ú(hçsD>Ý˜cÈDLÊë¾o?”:¾×/<2j¶Gfr
©DRÀ£W	B}=“ŠY½´Ø½ªÛSCp‹æÒ¥àœ.•Gk‡š¹4Ìo9À°èÖîÁý¸‹C_Ò/-ùÎe4üD¢*)€d0ø>ÉapJB”øi´æ(ge3Ãúßr8ÿëÞy¸|z¢?EÐåqà“ n ™&û1Z?¤<[âLÆÂ%öœ²±KâæÊÀÑ”•ÙhHÏ¼øjºÄüÀŸKŠŒ¯ÉDeŒŒ¥V'Ç­N+V)£œ%;¹¤°ùs½š¬ö	Š™=¶<ÚËHRN@n&—Å~]"CK4ÐURd7E‘Àâˆ"SMS
^t¹5’‹ÐŸÐvWÖOOÉo)ÒãT–ö2¹)r#ƒ·þ1ê'­À†`4
°GÔ‡¨Ù$6b?” Ž•UÂ0¶h"Ž¼¿A+a!†ç’¦bQŽs¶ÐõõíXÚ!ÇÁgŸC{Ö:pÛ0OýÚy¸Y(|ökûIì_Øáe
-Ÿ}´0Qž®ZúÁÑöçÆŽNÙåêiÑ?C_Â‡@ÂRBpµF[--Âu 11XfG­ëÒgøa[|ÈÖ¢-­2¸×@\ ÿQ¦ÿ¬k°ÈATC‹ðlZakVw¼a\»Z×švëæšâ’ååZÚtV;v§µÎ“1ÄÒØbÔºvç´Ak«”vKüýñË2`é~wv8ú¸¶_{EÙ[èÖ5ó»G˜ÿµ%{±¹ª2x|÷xêg ‚k?¾¾‚ÉB€Ÿ	¦nˆðXŒž#ùØáÅyHóe­ ]ÐÂ•‘AEdLÛÎ­Fk¢úC‘®ïéE}Û¿và¦7 4-ÓÔÏÎ‡;õÃí†vÒØ>:Ùù¸ ÍÄà¤;ÚD³¨ ‹l[bÄt‹Zzf"rTQE¥³ÜYSÑPŠ8iã³LñÎ®Ll¸ç."µJ…MÜTD0QÝtoï˜!	j&@ve1¶@‚³r•ú€ãÂEÞšþŽÍÚåHÐ‚C¾–:K+d9f†sÊè¯ž»«£WF£€H1™¤JV;åÇKŒ²ÎŽÎêY “Ü‘¢”™DÊÛPŠ¾¡&‹o(àp‹òxœIèÐl‘­l.ÉØäŸoîUXKÏ4¾‘éöª9d'v&)¿¤ÖNúÆ¡WÂ}ÁÌÃÑvì‡ «Q&Ïõì°äÌ5Ø³çadÏª@;§¯Ç´ZœÉk„ú¨¨±Š­ßxqµcæ.LšH®gÁöú#þÌú$b)úêípŒˆ¤S§¾px" ‹áÏ7ëØ£ÒàÏ4õõæ+Í|ìƒ¾îÄË³ÌúøKL²=Å$ÃuRtÃ´eÃ—>´a£b£
„ñmªYŒÑvÇÚ[Ìâç(¤M[|—‡¸'yW	C„+—mžpªz¡´q>öµÓÊYZèØ$L&Fw/v
<ÊV‚ã°é…¡×‡áVq¸2b—“^ 7òy‹ÂT.—ÿ±®	|bù•õté
K¿²}fMÙ!Í÷Få¡Ñý±‰¹úh:ÙÖ1©Ixs}ÊŒ¼ø}óê£Ó¿Ö¿…Füï±ý¹|´} »ð¨«€[&nh;îº®-l\Y?ÉS$ÌæŽ«83Ëévÿ]×ø¦+±«)éÕÂvÇíàhïˆÐO£4çûÎ¹þRÑøä¥xvHÑùëaútûÓÑÑÁô¨NÊÎŒ ÌÀZî èlÑ½XÚÁŠw{l'„¦s·PI‚¹­w1qf ƒ	ÆHM©ÛÊb¦×UžùFB³b/®,£’Þ!Ûiq #Êç˜€µ™GmU˜ÁPÞ5t
²õp¡®´ùæ°×[§’7Ò³)1S™3ôQ›´<Ÿ" ža•9$­$ÐHWY4ÆJ‚íÇS;êò,ŒÀûŽ)~%VŒõµñ#î‘0Äí¯¸K¿ÇÞïÇÙéaGe—í¶3˜u“# 0]âÿ„¦¿w¶s Ñ{>¨YÛok…ÓÝ5C­Kù…B‰ª0Aªk‹MÙh(Çr/rpôŸ7WºãM‘<hº:5©pw>OSÈV'’‚‚¬ÄPªå¬¢ˆâY–—WÐè<89´Æª¦):Lv‘¡jšDþ
K=¤@Xâ‰XîpZQŸÖýÃ°;Ÿ‡õ/WFènÏàš
­ QôÕ÷^{J…%ûšü•Éì´qþSð,¹ÿ+£pï¤¾ÓÐæµSÌx?zm)8+:s²Ö°4…T«TÐ§hš$*UhEzÖ¿yî|¼)Á2›ýŸúÉ`ð”wÏ·Ü‚„ár…û~TÎÿTá	¥k®QÿFx\•Òâ²d‰1ÓG¶UcVh°Ì>ëÜÂrÙX@Ì‹-|tl_;¦;¡ÍUg©vøºR×	4ŸY|-´ø‚®wPgÇn‚³²Äõ0¼¡¯ÑÝŒZ× 6 _ÇW¦6€‹ÒCƒ’n9ð	¼ ÿÝ‘^ÿ†ž°tØïD£uTƒÒt ®rP‰Hm‚&[^ŸPpâ!€ƒ?Û$p ñÐÓn\¬~=ÙMoJpƒ©+F#wŸ2g_/†Ãboe)h‘Îrj*W“6çTœ-1›ˆ2¬d T…µTköi™‘1êUÒ]Ä,bâ«jzÀÉ|ŠÊJ6ŸÃÌ`¦;i%×-½Š—
$Ü:%§'AM{½SÊ|É0û6FeÅþßi aÍ­$›[Yú°´ŠÍNaŽìpôŒeÀYÃ2ËmñadšÏÈÆ¬¦I„.9Nøè¿!am==e25ÿüÄÅ£âŸ nmÒBËØ½?–Ìd©_YË**6˜Î
~‚ìA9€“Ÿ´ŽdÈá•|•:¯¦ã
SÈàwÛ,s.ÊS;{¨’KÞŠµ¨|>âã{÷ˆÅñ¶EÂÜèReQEÖ³1—`‘jU•ÈÅ>ÌöA™ç<¬ß f*Îß<1ó.™–_Ä§#i‰ê>²œª\MÞåì—1ñjy¥'—9ßŒ=eZ\\ª,K9E4Á.Ë)!«^¸œ–•„t~ïešU½ÂÙm'¸ãÐ"o^G;ãÓ1Û<K,m|®*åS½ÝÇ²Ím4ÄØ,ÚGLèz‘È+”DÔKúÆ¼Ûë°·í”—±y½ÞW§ï}:Óve*„6€}¸à‰Ø0àþèåqÆÙGøËŸ’éœÑŠ/\•MerÖØ9…Ió
FMš"ë%µgÿ<Ç0žV@&ì„—­eÃãq!…é-ØÿŽþ,ƒõO1écÍÔgs&éCU
ÌjÊ¸ËW”ªäÄÊ˜ 'ÏÛM»&…çÏæ—Ùc›ùqi—JytÑþÆºÙùƒô¢¶¶Ç+výáÏ¦°Ò*ý5õÕrªéÄýîo±—ÿ¯'öØÅÝÓ µb…n Ç5Wp®ÜÈ&ä&ÈC­ÈŠ§;¾à³'Xi Ô†Þ0D®œŸÄðí°Þ-$ÞaÅZ±l¯Z¥·IÇöð´3VìJïyî5j?õk«ÐðÙ¯m|öYŠ( që§>­,à:õE¥©²nˆº–÷b3ß’µˆU‰p×;HJy¹wÓSHôÍ¨­ÄÂ–‡²Òõ¢°–zëv¸i‡©ÍôóópKlvÚø ®$´ÉÊFYÒ+ŠúRzÂXË£í³Có<œˆ½Ÿ€“2Î]HÎÿÖ¶xÕ†iûøëÔß(o6.NýbåÒb{¢ÿ·mD|^‰v©ÛáûÊûÂyz ›p'³EÞ*ï?û#Ü«`|ÇTæ'ºŸªí˜bÐŠíž[¡é„æ‘ovü$Ä…Óé^iÏØ>Á3lÖukú6†ß£P×=?qž ¾QzNâ<^ö’\‹¾x: -‡ívÌ¼w€o6z¼Â“üÚœ¨öˆ“ûÅ¥eÓbÄóÍï©mé=&8#Ç¨\–ö6Ý“÷Õ±;›2ùC¸Š¶š³[pÒê
7Åþœ,”(p]7-JâJ!³˜p¢,ñŸ‘’*†ù™ÿ¬&9ý¹Héœ±7½±dXe³ËŸF|&¢¶1WÀÝ§óóž¿QkÃüÖ€âL×D•-*°sg•"a¦†jÌÂê¹Ðø¦^Ô­ýåù¢é^º6€®¤Ú}–´›td6()nœqëžuþ£ÊVÇlÛ‚~×)•JTùî±Ž²KW&ñ56ŒÍ›ÄðW„ÛxûÊäû¯±ÄÀÓS¼«ù~¡bl>ÂœßQ± r ¬öYÁ%«ORˆ:ô½;Á˜»˜F›`Ôbƒ¼¯Ì¶q5/+>'½7'ñ­Ò©ÆVE“Tª‹­IFU¼p^Ø¢!ZªüS;¡·Âô.¸¦¿°‘°Ê'äÿºxZOaòDUö,zh¤d<lN²)ð*æ(ºÐ/5qBìÀs7u
*»°4ý}ê9…#ƒ'Ý0&Ð]õMèî³Ò.AwÕÿ1tçäÒó?î°Î§»Å7¡»£jMÐÝâÿº;òóèîÈÿ›îî¨½ÅÈoéMÈÏöÁäÇ{£T¸ô?†
;¹TØùŸD…|«Ý]˜W3JØïh_¿¯F	¼sÿ¡€æ>Ø×´þÖ]Þ8%ÓŸ^k#ç»õfÉÓ‘üduCaù¿&¿¨è)S¡âÝ#8Ý0b¨·@U” Õiw,ÝP†ã93ÂÃ•?™lf×œYÑö:Ý*‹åÍÃ¸&\Ö>,¯ÿ 9|÷èùX÷féÃêò¬{Ó\«´*-}D1‰ÏŽë§§à-Zún}ÿ ÝF¾—™‚ÿRÓaêÔ;×Muˆ+¥.£0r"ÇŸëÖÎ‘aÁ—ÿšþ_~Çg?Á—¿ñk6zÈôšºòw~­øfC^à+§¼ïÔØë†÷¹×¿ÙëÀëò¼îuŽ2Uá&Y’¦Yý§g¹Å˜z£ÜË™Ìl	"ñ§Ø<8˜Î;¦Î±¬7g…4G_ßù zc÷xœ£Dý¤·„±§4Îv¡&óÛ€°ãÇFóæµžÞ’É~2ÌçˆEYÎ¾J\Ž`­yQï8¬X¹bìx.GÇ‹@r§pJ:žÅÞTîðýÔíc«6Hjÿ9 kšÛadKÀ¸'f¾‘]1Æêå&G¨Øtö# »“jiµæœPqC|ªV¬rÚõ#‘¯D6Y"+½®Uš•¦r*ë¿ûT<‹ÿ'2ÛÛppbMhüRØõœÞÇ<aM</ðö{ÃÆIý@«ÿí5R™ÝÉe«X7nZã°8lé…wõp-kÇëG¢8ËçÔþ,uæøIãøèäL;:Ôõ“ÃýÃ=íøähï¤qzªÕw4¤¼ÓÓ/Ã3Uù¸ŒÙ
Œo2ÏÑŠ\Î¤¤ø}¦ªs™š<¬ÉôÀƒ.;¹ê>±³éÞ=JVÒæíOu¿%ße•w•v™I@+íFÉôéµ×—b!•[¿”WN!)‰ò©)ŒäÖ—{e¨—g†z×Riü†æ+ª¾.„+åY!<!}Û¿	Òe2b’Œ™­xøîñ;I$ÒË/¤2j®ÌVl|ì†ýžvßï¹åÕ~ú®´ð<¤ ØwZ¾x†Ñ·ÀiuZ„ÿõ“–@#ûünŠÏï Ëªk?uÃp`-,ÜÝÝ•îKž½pv²pÒØ."€KåŸ¢Á¤PÑ'¡­µº˜ù0ìW"…æÆéîZ¢¾Çí¶ƒ–=@’ /ÄÌ‹NG»ÆÓàO[»”ž¨‰Yº³~…ñìx­!–©I‘Ö…gÃÒD¨ðã¿J¿òÍóú•r_ ¿Ó/ìx‡^x4>Ï]ÏßÂÈ1ŠNPK  œ» nÛé\‹ÒMÊ r{ÿ{`_í1
“ÝÕµý¾V­”ûýõÄc@U¿*z¾ðB5=æÔË¼L¹´ä¸Ù?å—G°øæ†ÊŸ>P¶¥è°k+=¯äÙÔ‡Tovì¾Ó{°´Ÿ¶Aì4}ç'Sû©î;v~ B‹@N'9!i¸So=$s©ûù•i¯ÆoÞ8aq€ÏÞ,Úm<:ÖÒÈ½Ý
ó†M…¨>Ç-^û w“S“`å¦¥*^ã™žš }{ôDjø Ì{ÅW¿2naz(ù ¨Q/7^BC«F–XSµ(êÚUSU¯y=Ó&žÑ5‹ÎØs4¯<¶(U`üÐYm­¶µ9§‚Üvs'¢”°˜U%ªZ¥ç;k¹&ç[­JÞãylªÑIxSYoJTÊû}¬œ¨ zíH<T—4ÊC**–ûºÎ¾š(GX6—š–ÒðfÛ³Ì]Ê‡Å•tÇŠz]ce@ì]½‘0Ë©ãÆC·’M0XÄgWÕg~A­—:•U{¦LùSÂ\Ÿ§Çc,OÎOÀØTãYL'gA?kå½A“Áä‹73¿j–m$awši†Oo"™8”\±þ<Úy
ÉHv	«­f{™T”XKl—ÇÃ´§6`+‘öq!aÛ\}§©ÒËRÄIªÉÍ;àiÇõ½†VÑ
gõ­ƒ†v´«Uµí£ƒ¯_OMv*Òñ¦È*ŠÂf²(ÌÄ|²•¿¥Î»g–v´uÚ8ù¥±£ýR?øÚ8Õæ5©ÂsÖf[À",©4(ªzÀ`½L·;h\ÈNµ%U6>kÔ·?5N ‡_0`w
ï—úÉçSåž11¼1»¸¦ª³œªþ ÷˜=”Eš¦1ÁA±/pBöPz‹XªóY¢3+êØŸ¼U²T_¼jŸúÆ6;m)Ð´œÔev+¸Ÿ‡|Õ‘âŸw‡D±‹![l]z¬%·ÔÍ´Ä"Úc¸ódï°çöÑ/@×ôÞNãtïp<OF>ÆX¦Œ<
õÉK<õ»~ÎSwÒuëÅ)è½fÄ4ÐÐô‰}SlÐ@çvïÎ~Öa¸Äöi}‘î:õ.Ùkô\UMHzVúø_Jù[}mù›ÜÏ§<ÝkŒD®r‰¼Ó¨ãŒŸ€ 3ùßÎ|ýìëIãÔÔ¶'gû»ûÛõ3
ùÙIýðtˆäÖï‡³’vUv}»¾Óø²¿/»°Ùø“øç—x|#Q9]Æm\>f[(·z^³p¡ÿk¸ÛØÝÕß·ÂK“lã.4VÌ{¡`Dx]ÄoYø÷P†µ¯'¥pBHØaZp]8s'¬µy “?oô^t[7ÖwÂR×'Úio–ÚÞÛóìvíŠ—”-ùdÐ³[¤°ð¯àýÂµ©ÿ¦£ßNw×~ûR?ƒ÷ðÓ+3êGZˆ‰ÛÞÆ2z…
B©C¸)©}Ò÷nIü"ŽÁ'·Þ4†ÓÐàGšf4Å0®Ö¸§‘jz¼©¥›‡x’©Yç‡âž¯¯Äü˜ïˆùKhþš?‡f3ŒÏãuœÒ0tz€äÝüsQÀCÞj—&=öË@Òã
ûö}mCû`­˜ßø>É÷Uzºn¡š÷~íq	¿ë‹}¨°VÓ]ZìS7…·n­N¸¹©ëfhíú›º«[z Ì[x„ÊÞzdóø¥nß­{¿„&ÀÓS¥l¢Y`ÍÍÁ-üeò:ôû=2) ¢­Ç®ç;ß±R¡žž
Ø/³Þ¡säÝ0Yâ‰yçÛƒ3P×xÌú3mïñdD°X6oño$)¼ª=ú×MK<‹hFÿÝÄU.Kñ²Îl5ãz~¾€/9½^íq`cœÅ=c‡g£%¡›ëmj(‰Žš×™^€(FçÏº„-­cìP7nÅ}<ðO:žà&ÏüW_—ÞA¹þÈÒô°ë¸ºÙŠ;'.P·³ýµ½!†?Ùs}S´Ân'Ú‰0šÐ_ã_a}ì;#±	øW ¤Ú­t82oá"Õ‚æ-¬wBqè½¿nÀ=È¼XÖÍGi¬ÃìÈˆúì„0•$>ã÷a_à‡'ã¯[ ÿQ‰}jhÇŸöö÷§´M¤å²Ií[ m&¿#l^[únewywúº\¿!… GÒƒP)h!Á£›ùyëŒ×º'f‹]I±2ŠrÒ¶d w9;ÐÀgèT ˜¯ v÷3 VT 6ªÕÝ² p7	ànÀ-À­,€ßIíŠæ*4N~:µ&OdØ®Ÿì°‚ûZQyªMÌ¿ÂÉÒ\„t˜ßIz<U:€ÊîRãÃª }—þ£§†*ð&ñ¦‡÷IÞ§ìðêLáÑT <Fžr=;Ì›.èè	°cNt}Q*•ê¡8£ZÛ¥ï³ë1i‘vi>é¸ÕµÅ­Ì¸9-ŽP²˜LlÇÈP-{3â‰Ï°ÿ3 Ë-¤ €‘Nß~rúö3Ó·ÂŒUøôÑ‹ÅÑHùÒ²üS‘Ž[X1qºx¾9‹6Î±zcãp§qòœá
_IV Oí–ùJ’ÓcD(HNÖ™šYÝxU“¬žøAã—ÆÁ³hK*7±™SåÛJwL§ñ8)dŽ‰'EÅ\Ðâ\Àq?—
…ßIM>%5¿O9ÏåQ­ýY ¿CÐÝ,Ðï&M1ÝJ2L+Ã0Ÿ‰Ä0ôbQ"~>;û¿ìŸ>{¿„µø Ô8~	§CþIcïÙýÿŠý³£}R½ÿ:eïœ÷wžÀÏaDûí?O±Lr"Ñ7ÊÑ$§²&Ù	#3fÊ<B…Ñ€#­–?¬,¥GÊÛI·“¡²ÓPÒªô"©UmYá!põ“F}*\#hûa’>x*°?ÖáÏ÷ï;6 ¯Î'_@:w5]³Æºô¹¾»X?Ð¨ÀLƒµ²²¼¨@ŒaÊßóPï”C2À¶Å´B©X€yNw"DµG^¯XÐg¿Ü ß®“ÝIÕ™\,¨3¹XT|»z—ìÔ›×vÝÚgîÓ=‘»î-¡Dëì`H%Ug^–ëìàÙ:;ì¥Dºà¡¬³Ã^Žëìà›Š:;°¨ÎŽÜï˜:;0g»®0 JêA“‚pË²ÃÀ¸oM¦o? úö ï÷Uø(¼$]Ùß03ëïú]K†È­if}HÌJ/ ?àUQñæÞÏÛëºëšA ðÏè—n…1w±(NGªuó+ÒYŠÀ0x€Xé$+ª(×_}DÓ¯þ¦ªÅD)CÜ¯”­µÒ2"îÞ‹=	ØhLÅâÙ@8×%ˆ8 8½ÀxRJrûAboŸ1??×™Tl±‡hÎŠ0iY—,;6˜M«C¿Þu7Êr0¬ñhÁOå.™L~o8ÌÀ+—ZkKõÅ­Õ|À#!OÜItÓ)0¢áû§€%7v]c}Ž¸¸‡J	à¡)¡ÄQîú)úI©ÜØÞÝÙ]–´x(¡@±'ŠöÕÛDâ^Œâ½h#ÊÖZe»²K%Àä·~BSÜú†©áòfØŽr3,¢œËã€	*½úû]WÉ‘1ž³âªŽâªŽâ
þaõI¡sœq fãé³©;IÖ	‚±¬3nÒ÷¼`j¤V@º=ÆØ‚Ì\Ê·få¤ýl“¦âÖÕò;HÿM7"b%±a0qJÄô¹õÆèT¦vÀÌdÌ2‰šgjuÃŒ"Ê7¬æ°¸Ÿ½Y?z.C3•ÙØ]Üþ@§Y 1¬ãFEŽ‡Iœìî6–+Ñ·kk•­Ê–ÀI%Õá¿söƒ¥]¼—atÚXúVa–QÍ†Na¾/™@ŽÝ¤ñÙÍXô¾/	ôâ-9>ÉwÙ'Ùã!•¼|ˆçx {ÉˆÂ^&lù]ö@¾g=†á]( <ù2¥ÉnªF„	3þt,wIÜßepßƒ\y,yìùYnRðì04·Ñ Ûõ7…fXÛOš8û˜Ãä½&Õ¸8ƒ®j\™@˜pW|÷PÖÓÚ]Ý­ïng³ˆ:°^„Ã±:èe¡Eç±h¥˜R(¾T4Ý—0E/8¦F9„º%“ÃÉ sšüs(ÔIÎª“™Õ-™B·²zÄð«9:<û”õ¥qv²¿=5a}Kº^G±%– -Z‹¶+ses17j<VžÀlJ-ëgGgõƒ©fÀÒQrF|1úý¡WÂ2âüt û!Ð•T¦r'Ì%@Ù¥òpùôTæ~“øÇ ½zT
Ræaµ±»S w’ w"€½$À©vì“ ¨>†XeÄ©_céO:Gpñ8`­ ­¬{1œ½M`FpxøS:.6˜ôKG¥Á¸yÉyÑˆ\7;¢z39 	S0ypvSŒÍu3ccÕS–~ý¨d¥ë&FéºYÝ•§ÌH"ÀÆ§ùø×à;ÚÖ?µÂöAãj;¿ìŸ6N9h˜¶—Íg…”Ç=„òS$OŽ~á Ÿìnï×f‡…ø’T±“µD_ô¢š]y!lEFziyŒÕpã×Tg`Í¼ZéfÀæãÆÏ_)»R(×ž‡»× €b>Hb>P`þ}5{z©Ä>}²˜|q9V1}NÌ‰³K@ÕðP–vF€“è´D±*²^›¬sŽƒ{&(±ý$bû*Ä.&»˜‹ØÅ$b“ˆýÆ‰:¶gÿz¿]BÂB—ë_Â}®Oükè—5›ðoÎ0G¶èÊhÑÅV:5ìàÎâæ™ ¦;¸·ªK#ðv±aêúð`Kû iø!õ]Y|·šú®*œ‚è¥?¾‹[aª‘•øÝ÷•èíèçüL}­g a8ÁÝ¯€‘3‘ÿ¢ù/ñò]«k-.+¬Þ!È.Áˆªn&¾©DB+õ¼Sà`y ç¿ˆ™Lºb	c|B‰ù%4uÜƒLk ÿH{‘uA¿’Zn†Ú:4ç;!Ùuz¼ÂŒ5ÖÊoØÊoï%£Ò}/¸¿2Fæ-O‹rÂžwP]]èŠÓIþ¹	÷äåç&„Dœ›°Ej[$:7á8{ÖˆÏM‰âÜš ¨8?l”é úé"ÿ7Ä„&#ô@¿?ã½Š§#ÐŸUièÏE,F•k‡´ÆÛ'þ4
aca(‚åÚ»´\û1Ù ‹À0ëa—¶?fnEåÚ[aí†dÊµ·2åÚã—rÂ`Ð8/‡¿ ç¸pÜ11¬c’[®}Ÿ‚ðÂrí÷dÊríýÄ¡‰ºíû©ºíª£cÆƒi¿Ü(ë4äj—°ª<n\®÷"W„Ûœ¡|R>XÙ
haˆeàëH×@ˆ–êDú×í­J{ÛBZWö–>dR…,÷†Y¤ î"æ äÝ#cÌñµèfìv‰vûrzÔméëW É_k¸Ó$ó½žFE^):Lá`¥èZr)ºÏ ®@``ØUHë“,<>ðøDÒãÌ?.ùµÆ=ñô¡ñ‡L½º…ãŸŸ§¨Ø«r,ð(.ØÀ¤ÍÑ¤ïÚ ŒÛúX%Ê<™a;?·k.¨J£ü§sT! Z!û	Úé˜ÿ\¤©òŒ	èªvÂÚM¡êgÎqQ×	eg¼MKj3Î:žÞ"þ¯J§Z&Ëfê‡¾{<&jÙœ'Žòù9ÀŽ/±(ÁÉìÏcdö[CÀäx+Ì“ã”òO)Ïß|&ãÃ|Ï€}ŽœŸ&÷OÃ±r?o˜ÊÞR!g'”ÄöNhX;¡òˆè,jØ/çÒwÂ¤ Î‘ÁêÑ¦79]IË©CBëºö§®q¨ÜÞºü§ÜÝ:²W&Ù°{<I»§ÕA…Ù×$]jp
ñ83<ÙC_ÜD’—¦J¯ ¶'ãpŽië§ØÉA<sšU&‘T§FOÂ?”-µ!Ø(Ã¤¥–-eùr¦ãáÕ`‡d
Þ•ÁŽùUÈlH2çvŽ¶ÏþyÜÐäÝ‡“©¢yÊRpEïekÁe+£±ÚCÚÐïhÅºÀZXÀ±¥kÏ»î{àhÐ-´‚ ºÉ
wÕö}Öˆˆÿ½bþ_ÿ?Àÿ«ð?Hy~Žk-¸³?r5‡üblõ¥‰Ìòjiüg¦È=Îþ¨ŽEn%Ž‰uÊè€±8ÙC’~qè˜Zw}’"»“_¶,–´–v×uBue%F±“‡œ_Ólb±²œ2SÐâŒ_$Sa@P]ˆ–®Kv%ˆUÔ³‹Æ¥zí>·;HxbóyÑòøIòqt®p§GR…G®íª[ÔP§çÝYZ×i·‰›ÊVsÏ'xòóm~Åšl¡1„ºœB¼Sl;>ÛNOë^û®·ÙRLã’¬Gƒâð>Ð“Ò„göµ Ÿ|mMýZ„iòÅJEýfï:õÞbæ=ú­/ñfÒ"S¼‹l•~™Ú4‰w#±¯ŽQ	Y˜™_¥”Kâõ»bgØ2HÌJ¾’ªnïŽ©w’­ßäSðEº&tvMåíÉ5¤BoºªW´$IVZÇ¡ÖtY8<H<âR5§¸PÎðÆÕeZ{VÑ°”t¸¥Ê	±3UÙ­<¹™vªÎÕ¸JTàÕ‡>)"®”`(ê@)&0’ð3–-{~‰¯qT”)8©ô—\6d\‘¹™j¾Âë#>³R–9ýÔhœa%,Vö&Y}%Q

U~¶«Ú2{-+¹i¹šˆ@çÚã>zŽê;Õë.Š¦%}‰t]8¤³_ð/ð•V^ŸÄÊÊ–ãêau³¡¹À,…ÆÖ¸IET•ñStÉŸ
=“ÖÏdÁ›SûJªB•£R×,Ql\¹Œ1¾ÈÕØÆ_TËJ]É*·ŽU~«wÛ„î¿!â,v±âOj¸M—‹ïÉf‹39ª7$£ºEÔ9ª|56ôŒçœãJÈêåÂ‰?i'EK™>²Ó#VL³¤’‚l²òw”)$ªÝ£¤+OtÅx\Y(:2fBçÕÑð¸v—’F
ïÃñ€å•G£¼œ“øw*òRÕî¢÷Q*gÒzUEÔ¥ù^*;©Ü|™ôÌ@¯›È\6QDùÇJÔ\I’[0'€ª†Æ	CÞSV¨ÓO¾`’È¸Š~ôÈ)DÊãHy‰“QïQÒÜ‹{–WrY+HOOeã}3™YÊÀyP•@Q•ùÀ®NéÌÚÄe|VÌØà¹8û’óë=agmÈÇk¡+p4IÊ°ÐJTÁ›Ë	/´{ck#ærbv]qÒ¢Åä‰4§ß"q5~ä<ÝC•ÐžÅð3±;Ü|Ä©ñ8¾Ê£²&Ÿü°G0úÍÏv\ž*?^¤Üž€`—€Òéóâ¿©Ð:®eåØ»Ç£RðL•ñ|´ñDýé‘gÆ}QCªÒö¹ò,t°\x"åù‹#UßlÄ®>lwÁ«ÎB¼¿`ªI1í>øQ·Ÿ‰ðÜâ¯cÊ¿^YJ#PÅZ/E™^L¢¥…'-pqËpª´åðêaHÜ¶í¶¦ ÚÚ¡jÛžÛq®‡˜å
:>[YL]#WiÜ]e—Sïñ9^þ”5qó|ûÔq»è»k¸ðàtÀÃlõjô|’b“„w„¸
ß^j[
Æ*kSçºÆÒÔ'ÃïYpÄ,ÓÕ‚%ÉÒZ:ç”(Š`ô‰Ã”.áï›Wþµø-´­~Í*áR¬,Ëþ1½ð¨ÁVì8t\ZY÷ÊúIN:‚¯:ÎrªüSãÆŽvp´wÄˆâ'¡½{tHr8ù“Ž‡W:; ¼zåÑÅ«±HW@KFÒ“T( 'd0l‚PÀf`5iÇ]§çŽK‚YúWºbË$Ñu4 EvDJ²^2›u2°ýã^£=dnŸ‡/-)¹³ÊÝfQÀJTHÔþ¿ÿëÿ¥"NÔÕž‚Oñ!ÎmÒò|~ŽøÄÇPøzæ0i\imPc¡œÚ±¦kf“é{Uö¿«Ì¯p<{6Ne™ôÇ”ªàóñe/§ã£¬nI#F^IÓÌäx'uúóàçUYýÊ99ÀO›	´ÜPB&C…u›QªÏ@W¤äÒÄ>¬G™o7=¯ët®–ÃÀ,Zµìz÷˜[Ü27é1ßžû¸U`Ùø‡¡sü.Ž(qç/„¾úõÃ£;Víó/Gf§äþOBe´Fë_…¬ ë¼8xòONeQX–…—ŸíÿçE1ß„ŒåäjU‰ìÙ—ãöçy¶©KÕbx•/†W_¶þŒ$lf~ÊC^qEüy^uÂ MF/2ŽM2µfqY¢ ºø£´ÐÙ`˜èÔõÂ"ß×®…þ¤è%½8Ï¨½Û×ŽmÆh~\(ûL˜‘ÉÏÏºN ±õ!­…I´A×»¨Sf7Á)héËï]û$´oèk-<CëÚ@Àqµ¶C÷³‚ËÔg®HðüwGz=üzZèø‹}ÞÚ½!	J3@Œ(à ƒËxšny}BÁBÈ‡ þl“ÀNBO»q½;­=ÚMoJðÿD£RƒñöuÂ©ZV…RÆœßõ\á(Ö†V2€ª‚y“©8Ë0“9'&­%W„«YHWÑSE‹òO	¼Ùò"‰ŠczJkˆCÌÒ“‘ÝÚðßi2U%]þ¸	Í©7òŒ© ‘§‚`hld5LŸFPQÈ6LW?áCøØv?i§"rüy…tl!›MtO&æýäl*~á{÷C[ØÕXFÿ8)W@K<%'El²:¾Mš÷pOKˆi
¢2÷¸\{™Œ@Ë/âÓ‘Jº/&¸SÃ;röÀ˜¸tvkž4îq¼«0¯rÈ‡4ËV2©Oã¤D®´¢÷ÛZ•x4ÃÙxòBŽ”ù;áDRUìTS-e—åž“Œ¤–"Û˜CÖÁ³ßFÉE!š<é¡´è%G)uúF½ÝwÂ´Ñ~£>¦¥}Ä4œiÙ*AÍÑê–ãR“½Ùóà}cÞmƒõØðFäV?«£åé;šÁÞ]ÎÁN$–ƒ²—BU®¼W,Sçcxscyåmíbeš•Ú¿/óÕ´77¥V¦Tõíâ¬€X)e×Í&m÷þóÆ¡Ù|%Ãøµfômáôí|Šy¯ô”;zäÝÁþÞþÖþÁþÙ?gÑ¢ª×¼¸ÌKÕëk™èŒ·1ý¥×£K²tšŠ|9ÿ,e»4IÙ:ÏÔ~fP³XFîy½¬¼TÇÎðB77'ÙUniŒQQ¾¬jãO)U~°LÉ£ä1kè™ã¶¢5ûÆY}ÿàôùZ™]Å³î¾š$M²ÁÞU¾— ›±@Ï°—j<%Ktå¦
LbXûÏÚ¾%ö}Ï¼KKf´©jÎL³K±3ê@„­ë>±óÀñ‡	ÉêB,.f÷îL‘©>]ãKlÄ»X»’9 SíÓ"ßÌóãö‡õ3§šç&¹*l‰I‹ZAËw¡üÅã¶½»’GO×jZgèRç¯`¤ksðÌéorß‰š£Å$
FrÏêÈÔ—Ë‰›£øâã¿’ÐåŸÆ~µN®bD»]œÒ¿ƒû 0t1GÌ|t\'tìžõèa²Jø€em×é£¾îáQ	÷N˜x‰2-MÑ;Î=5`ØÅ²ö½xQ-—/µæu1 K„—Ë‘ä+>í!"ÈÕL[b¥ÆˆÀ¢L¾±¯VËe^g£ïµí^‘”°–3]…ñ‰k]ðÁ€b¾ÕÍG	$PÌ­´y¢ŠÑ´M»¢{`´ kÃDï{Úà¾¸ªŠK){×ýí{wø›¦ªŠRp-¾Fˆ	¯Ð„ÐÏâíl¡Â‡e1 ÃÕM±<Õ°Pe¾(èÝjò}QwB­L|¸FüKh\xhÒ¹öŠKe Z·øKýþq/VôäÆ#Ã@ Ü'¦—òû!fTÊƒÑy‰dKÓM>0´Ïí²ùSf.Æí±!ÃÔivd:â•ú¨$¾5ùñ¬#ã’þgN1¥x.½– -¤£Åé	è;¢1^!IzËµH›•Ö âõ;®Š·
zsæ%âÅs·{ÀTÝFwWX4Ì)Ð*]†,®€‡‘‡*¥TwRÄ^¬î/óèÑ×¨Ò¦c@ßôx¹®Åùù¸:Ø¦#æ»¢bi]žÂ…•²ÖEAdÅ÷ðLñ˜Ê5ZU9"æüÁ/ý!ƒ_zËÁ/eŸ!²»"†]”l‚Ðªe­ÏEzÿ¾X™sX‡îaN*|÷Ê(«àY«¤?ý¨±ŒÝ5­›÷Ê£®â¦tÔ(×†óóB(õì&é)ÄRF¤á`[C?ðüâ ,Y¼-‹.Ö}|gY)Ì€ô’ÂLÂd
³â2ƒ ¬TtÜÁË×c)_KouIë#G&ýEÚVË
èÚî5±Áà¯I)¿Œ„%þŠ![P|$b„iÔÀz¤¡
z»U‹¨5[ÃÀâ²¾Æ‰½tA_ ªÛ!Ì@tn‰~9†¥‘›)[Ëèæ–I¿mÑ0‰>Q}½â	ÌT'2Î^uðÒÇ:šmjš¤É?Cåå‘y–r¾÷Ä‰fUj’4î[À4²…6y»a7{CòãÇü+ÐÆXªœ^Ñ¨ðuûvø²1_ÿí¶?L"ã`¡.[’¯ÀÊ¼¹)´-	´Aƒ¾*d¢aÒ;’úDßh'ÓF”rñË…A>’ÒØ´é	ÜV€§Š×8¼v8Üî¼Ú±}M8Ç¡’šã•”˜€Jx|õñ´šñq#o³H¢£žŸ˜ ~‰.*û5Á§¿Ng.`Êƒ÷IÇÚ1#?žbÄ*­­š‘³n‚¿,¹õì•JôBÅÌxô‰‘#ð«ü]–ã¿£ÓWÁ3ÒùïÈ½Nê†j¹¼°ëòÞ5h‡jLÃËQgì£rið*í|@Ó“¦ò–¢	¸+^Ðš›— m.h‰ÍKèþ´“ã^
À« ¹PÐ\j¢ÐH†Ý£xcÞ¿z.y“/ìN¿XN¯d‹ú¢èXOëüeÈ¡¨FµÑ’`ü,€¯XT8Ð¸ïrŠ„¯õ›1ÌÍÌM¢"X’^ìWCœÅ S:‰JµôT©¨@–w=bÓu€×<£aO5uªàòs9£ÌÆJ[ìÁ¶¦T/Š1"qQÕ
üQN¬KÈS¥43µ«PÏ–!cnˆÔB“Ý°íå¡7Ð˜åQùC‘Ø%©@)Çy†7Âô¬©š‹'¥¹‘b¤(é¤¬‚W" F— tóHZkF "|²Â?lSÃÀ',ì$È+ób0Äáò2RP„<	<ÌØ,àQ\™ªk‡™ªk]¹êÚøPÃÅ"èK¶ŸAžúCOk‰Ù÷|ÍgÓ·pÀí‚5^neÍŠTP2Ë
?ßËFD
ø´:­ù ZQ^Ž`ÊöË˜œ=œŽ:³ñpÏ'ˆÑ×ÜòDeE†aÏÄq‚ÌhXg«q_›P#sÃÅ9Èmšâ`Øˆbþ"Ï£ŒF Ò˜>n>kuEUÝ”7SqëðdóÕÕjr#}’•öÑŠŠzv3˜œ&ä?†þ§ÙYº«K8ã…äáƒªrk]º‡ä¢•[“.”åÖ“åÖ°©×;î´h;—æDÀ1!ËãTHE%ƒ¡ÝüaÐBl³i¶JZö#<ƒxŽ²¢eÓ“ò#Mñv†W›D	Z`gõ[¤-_0ò;ð&Bèb°ÔËaN}6¡8ûÆ[`[Ï,ÐDD;f;•®hª	R[®Dò”}¨Í0—\ÆeÙ²Øœ½qõVdSÐè[ ,qlzc\ât±Ö×a\ëëp\Å5íµ1AuuÅØÚgµß¦íë°ýHäóÞgÅ}ºÎÚP¯Àw\ŠííÑmÉq9ÎðT÷²’U:ñÊ8“ÿ	7NVüùÊ<¶xw¼Û˜0Œ3›VÌ´FM24Ð RÕ\«ßÚNæu…`ÛF—º&›Êúš¸fž	xzŠ¡äš›`)¯ÌnqË&hÛXJ U¡‚!îêxYÕ%…i›êFŠ9Iö]~øæ÷M±HÕ¿†N¿eýnfM×.û‹oÚâé5ºi÷ðÜ8Ó'ôthÿØb|ÀÒ‹âVäi©ü8%Ëèq=4]vÖ$V’E‹Cþ`¼HuÕô„‡¨N£I8d‰íŸjË>Óß˜òiRœ¦[Q¥ðô&¸4Â•ÓoNe´IiC\ü)ÇO?Lº´¢(OøAé"Ê¡IøU¦Jõ®ÕƒŒŠ›agKêAÊÎ&MãÒdí¢\ª’þ%v¸ÊDÌ„Øóà!‘+¤/;¦?c$Åyº-å+"˜Ù¸D=L™ç„áðÙ$é ŠE!osL	‚ŠeÇ$7ù®¸XUÆž±¨˜ž¥zm&ÓÆ²Š›![IUãJ†W’2T±¦gÆ•”w—Æ’Ê‡ä¹~%Ä`-°gÐšXìkò×=Vøz	Uäà! ÷-<¤ÓReÕø6¬rÁDI"mÕ¨ÕjåMý³ƒúîT6˜PÖ•²\×¨×"U®˜è:Ébÿ“a[®Øõª2IaÐ:ÓÜ¥™ìÚüOXš¦ËÏ²A›^}zÎÒ4zrÑ\k4}Eö¤%ªáfŒ‚ú*›æ¨ã‚J\g+×Ê+jé¹& ´µ˜q"ÚûÇÖÊ|,Ì¯^YklÖáµï´5üé)€¹¡®x5VÃyœk?ÑC“†¯‰8Awgñ`j‘ù"$¹aÿ¿¾ÖµÆA]Û>ùú-¦¤|¶©–ÐƒÊ¡éÄFýI=~P,áÑ1«8ÏeL®¢zBT
°Ô7	Ø¡6yÿ
3©ÚV‹³YÿÁÓí¨ýsLåXUˆ¬ÀßVqqw)/¾’Hj;P±›%ÉYaVGV(mI¿ðÜ¾{jñ€W^Ž3O¥PUÂÙß;¬Ÿ}=iÐ êqýó˜h­¯àªï×á"~gœß®Œ¸©ÿ~ÀLØûÄ˜&§¿ŒÏâËð	¼‰Ó§	ƒªY³ óhÜDÞË·h‚J¢òU:1…f«ðÄ9.˜¨‚ïˆàŸLœXK)"œl×3N—IsrÜ®ªRh”‰]‰¢DVÊx«=
6¤ù¬±mÕT²Å,Yá™ÔØ™ØWdçÄ»2œ•U_êjSc‘ª°Ô)¥‘¶•Âc1/õCÏª·1G}Ý£ÁƒIßrI*@¦ÚÛ8c«—ù¡ÚY?±ÕÌPs/Àž›ÆpDªÿÇ237f[úxÃqúü!¶w÷5LÇ•ÿV¦ãkÎå+˜Ž¯4¡S?f2§X(æ³ÆérB¥U_UŸ•c}¦ÜeÙ†ùK'´0@29SŸ²œÓTÚ¬úæºÌyŽÂÉÝ/„ŠŒšœ»âR9Ì¤l Ì¸¤‹L•}pW\ÎÎÈßRè/%…¦’Cy	+ÏÛ…ƒ®ì«çpÚ•nll'LÂh•7è«­syÓŸCv0Âã¯¤yã„•ÛXªÞFj´tro·B}$§+L]lŠfã")LV€;ß…lÄ4££a¨³%TñtÇ÷ ì‰g¦'ÉèjÙ²8K
‰´†r.›RÕ
='^{>n§wä½öúéøü§(ÈD«ð£Ð{ÃEÜüü•ÖØÝmlŸíÿÒÀòÓ.¹£Åò
‰×°€Û‡¹ïxuÊ’k™l>>ÐUwØ'>æÓ\=ÜàùàC¶í‡øPûUÜÿ	±ÏENõÓ£C‹Ž=ñpt•Î®}LzJÑYKÜšn«UªLÐb9Nµ[Mnmö¦ªÉef&ð¼dîÜã yh Í·YT½`WWRA¡ëŸÈxËQ®‹K’<=Åµ6â°Êsúí;nñ®x±XMÊh£òÇt[Íé–õx»nÇwËëÂ¼UïK²mù<
ª,åo‚Ôiù¹ÈJk"`ƒä@çs»N&¿M»cp<C±-=B÷µ+ëN§ð|Õ“’æÁ“¨oHm’(çb\o“Ž=ìa5.º{ž{óvOjA©ã¸íBHj!OÃ nˆ±~½aÜw`ûÙwÃÂ=Ûxv]Y7ŒÃ&5Ja›KÖ¢Ù'5¬wŽˆœ	 cb»5ôÍ¨­DNÁF­R±ä;xÃ’Z£(¶H¡Ð æxbÞ2â¬,Ž-P—°{Dbß®>?·‚!Ûä´ñn,rZ€ué!ÿûŒ¾}tÒ ULÿ²ô£³OÝÜ%µ{²QÞl\Ü“båÒÂP±ùÔvÉæn¶çÝq=ïÎÔ3íi}‹ÌÕjßqR`ðcÄÃðò¾ò¾úæÝU9 #Ý~Ú„U6Þ‡dd–ÄoÐè>C¯!„þ3Þ«fÈVs‹ÿ\4lÖé%Ã*#"è…Þ¡k˜ŸàD—MŠ‡ #¼†µÓ°¶1WÀûóó§á¼a˜õð©f;¬5²“ÑÈŸë†rJ€Øécs?ò¢“Oþ1©í‡›ûa¦¿ýpbÒ+ŠþXûŸI­ÎÏo‡0óÇÄl…µê{IÒoZlªÖ¢±ŽlqáÂù)k2ÐÅD^à«úññÁ~cGßÄëƒAÏA½k±—NÛûõƒýoâÅÓi9vÏù®x¹qÀLKöf‹:8·$ñÚœ k ]¹_LRP6)”Ï­Ò®o_cZ°‹ûLb}–·²R–Ê? <à´û-6}ðM­pâ†@©VLlyÉ9Jë/aœ–£Å›Ô"Ìq˜XüIíJ].åÝc†Ü7'aÍ[èOÞ4Â^·é›ËÔÕ˜ÕbmQ}ÜEi·]ÜÄ.K˜Î·èÂ°P‘,¬mº=gVÌ¸{œ“Cì­‚êóß’=ùÞ¥ž!0('¤OdŠ¥é½ýÉyb÷ÄJé¸myA »x½aH¢º«ST«ICiŠÔÕÄ\õ
®×qÊ­2Ê}=?X´S•²—Æ‡Ù29)NïÐwêgt¶ßØ‹¾”"Üè	C¡aˆ¬(ZæÃÃx.LÃòø$ºðÚõ4,"Wq<KV_%C0@T,Yý›%ÿfÉ¿YrKòH °äâë±ä8*–\ü›%ÿfÉ¿Yr:–äÁ9àÌ¥×ãÌ]ðÈÓœÉú¡ºô7ƒþÍ 3¨Ì Ïg<éQ2¢´
%2W÷#Jßëy<îpdvBÓÚF§`‡ï+†Q/Ü€Ûµ¤‚Í·¥K¥Æy¦÷,ûRÂÕ"-¾`}ÇxUk~~(öµç¤“J¢g*É*3Ô^«ðSF¡S<ËõµPšÎXX{-”êº…˜™Ÿ§Hš?òÐ«ÑÐ7j–ÓÅi	Ð*iG“÷Ú®íôØk:ç u<S
îb«<zÃ<‡kŒÞÚügÕ0ÏùÏEÃ<õyô–ÞÀè­ˆîÁüRiW,›zÎ1i W\Uðú‡D¤îôm@>­J0ð³%cù™©¸u$V1OÃ7s‚Ÿ	–sÖËg‚ut7¬—CÏ„îÔƒ‰A÷b±…²áEíP¦hJN›ˆL¬]à¢ÍÌ/ÈÐv</”…HOÌ¸W$üŒ§¿mtx15«‰ÅÚ=âbE~­¢‹v§‘ÎmØÄjIu’=Õ¹Šª¢`S_ed–‰£ˆ9ºÌ&fŸP]Ö'’.³ImÃ&†Ù%µã‚XÎ›;$±½0¾†ê’È^á:>[T°~g;!&rœ°­h%<«û“"i-t©Êì2k¡03ë-fñ1¸Rø•Ðô,T'Ì†Ã×0è&ë™ú1&«íèmZß­ïà•@Ïäú°´ðLn‘ØlºòÌÙÓNñü`lî±r·Å’dìÑ©V‘@œ]8UFd´egöZ^¢znîÈËªr+<%ª%ø­}k»-d¸¼?ìo¼v1?Ñ1ÆV PŽZ+S	=ÍÙb?z [Ämu1Ó†u`÷á_øü9ã\-W×þ”ÃÜö\WÃÙ Ãa8t¯½çñÃrñÃÚÛaÿ4¾ƒyÞ šøáÐíÙíç e2q3×2ÆFŸàñºt„8ýaÏ~ÎËÅ•¥Ô>–è?ö‡8:TûÚ¼þS`…&·‹˜ìœÒ;þ|³5ô±êÃ×€ø–k²¢¢þ¢˜ž{æ]_÷ÈéîÚŽwGO2µìø.ëä”†©,îÿâ;vÐ£Õã—[=Û½á÷Z#‘ U¯í–†9!&·æÅÐì\²›Ø)ÌÇzÏn|!}éoÜt< ë¬©
à
ûÉº~²Büh Î³ÇCX†gU›ž”ÓÖÃZp@=),\üŸrqíráÚÔu#Jò@;WðX½µÅ‘y1¦ãKÃl¦w:…¹àéIä_aÔÕà/ÆCb<€µÁå±\;‹\P¾ØaÞ¼/”JÐ-||@¯‡æ]àâ_l™Û‰{ì(Bs'!fõrO˜´ˆh	8¶¢ãòàÃ‹ŠY½´¶„7?_À›‹æÒe©ãô`t\ˆ¾CÃ0{d„ànÔ'µáêŽ]Çœ¾Iž&^rÜVÈ8üKý¸ñ	f‡¿Î.9",äÙüW¡ôŸÿ2Øl–‚AÏ	a†ÿ˜¥ÿµ0ù~Á nÇ•i¿Õ¶	~Þ‰Î£¢ä˜ÅÃ£Ût¤ô§ç‹_wNØ¿¬\(>Œ§MHùFes@.Ê—©’ÖIàH!è6¾mD<§Î]_§³Ûèt€ÛÙü61Óî®ÐDbiÚÜÕ[úçÜ§§9ÿ»C}ÛémÎUÀ–†ÙrK¯SÖKaKD%H>@\Ó¿4ø´ý¦bx !Ìù‚YèeÄ¤©1<ï¥y¾¬ÓlA!‰€Rˆ˜üóÚFá\•gDÙ˜¼¢|áÜÜøÎi4ªÔ£ññm¯§
öØa®†¹lú<Þ)ðfióÛø&åt½Yš=ßl”Ø7C›œŽ.@@ˆ	nÓ?¿áG—£ø)¹äÂkÛRâé·Úyî±æ B¸ÚæW2#m~+Yü½,ÛÑÁº@h	Íü¤"±£Xþ^\&©­—&·£qÔv4žØÎk¿	4÷á	Ôfî%¿H~ "“Iï&¨Ã¬O|?žvó0sµ‡³GèDÖÉ%.ò_èLÂàŠ¸3t^®ÕÔ¿ØM' §Eûìáý;x€û—§8—{>„ž½>)t"b€¦%‹aÚ,ëý”„‚ºB˜¢ +À•8<¢OÝvDmÄ¹Ó¦ê§4Ý?•“EÓck©KL§m±\Ýkp0ºéR-g¸Ú‚¦îã2	@S]ó>£Î­>í›Ê:åHA[Ï0Ï“Á°ºvÀ‡õôô’¶a–ß®mP÷‘Ä½Ð OCÕ™ú	[¬£)ÀÐ„Ýz€Û»XlØq=øÙp¯{NÐ¥vAï„N+àWð×iË/’Ð7vÓv~×}»‡ÍÛ.44tmW+Ôå¼yŒµ‡lÖ´ÀÆãÿà–ÜØ¡íi…F@¿Í}ŸØÆ/´2šT¶ØÔ÷¾œlã_ž×"ÁL:ÚÌßÞåÆ)l¡Ýµj;Ä«kÙ°k?à0Ç–cìïŒ´º®×ó®8A*9]ì*A+œ4ŒéÞÅ·ˆKjO]¢»Ð¿§E¿©û!¢þ¸û wìžÔ	>ýDìúÅuÎëx»á_\‚fK1ó &Æsfž£Pâf—¨{Tq¹íBÎd‡l1ÆVà¯ÌŒ[™ŸŸûF)¼Î…‘T6¶˜x<?¿ÍÕm¢3I*•@ö÷©¼ºM=yzRÙ³éà®ë3¾ÜfƒÞwÛäž†$' cÏ
Lúƒ—3ÝÞÎÚ­úƒ1Ý
b8$Å.È‘õÂÞÓ‰¥<ÌIaìl*Ù÷p’`
#²ÁdêÓ	}ÐlB–í¡(ÛÛÄ6-ýÖñÃ¡Ý+ò÷©lÃgL#0Zeºž(çëT^ÖcyY—äüˆô¢EÔHbj$œñÇ8ôŸ§±¯~?Âþy– Åp°÷G†JÖ{“™±:6íÆð›ßúÑo‹ÄcF&xž÷|:ísŽžËýÇÝñŸÖyB!Q£ÐüÌB—Ù7áÓÓÅ¥°GÁ¯ö$¾CO!€›FMÔÌÀ1ÔÎâ k”bï_AÜ‰¹í‘ØÕa_Q¯{•?“ò°€Ž{t™jÿ5íÑlCÝ¬9xFËs\ ßÂ ç«ê«žŸklnX<"aÁÃdøóó¼XqÂPß¨”AÇ UxI'æãéé²ÓÀB\ßëõH›ï?Úoà+ïÇ|ã1á²Y¬âp=ZIµbŒ%nHæé\úQÔŒj³nöQÍ£—m‰¢/"OóóGÉ×®ÇaŸà½Ç5A OÆnUE¯d›¼v¸?U¬Ò½ißj;Øüè*À'²,ÌÅ!¨­¾ÉïR
©GÄ
²9‹Ø$¢L–’ßøá–×…ÂN6Âî~æsÈ`²ðöâ°hõ˜ð&ðÑ…-Ðkbç+Õ:Î&!ïAw”…œîß“lÁð+²…„¸€s …Ë‡ß¬'¿`ÊÎÀvòi&&näeT'6 ëß`d!.RÝ¦vÙŸës1Õç5e¿©Ù>á8b©¹2¤Œ‡EX£”c£§HçœÎÁ†cAZ€¶âFäÐ.›ù£hæyÀåýÎzc” 3›R{Øï?Œ™w±{Hè³$1ÆÓÏq²ÿÄó-R%œxŽ¦"I{ñ|Ë3EóQL9pëH’"ßb)’mZ–!ß"J:2ÏavÞŸçPH’ii)M!9D¥{>1LÓcŠRPùÈ•A (çñ<K— Ü?IüEýÅì[‚(Á ”–1U€u$ugÑm¢DèÔŠ‹pmIäÚŠG]æÛŠË~äDOh€¾Ã?FÕË•0Gû\e=rÇ(ó.Uæ$eìBSÝésÂ­¹
šîIõMrÔ÷&Ë¼bÕ 6wØ4ÛT%æhq†›n_fxÃš+sr›/aÎ_AÀœ§äË¹ÄÒçJérž.ua†ÜFfÈ-™J¾ÜJ¦scQÂŒ(u~S¬%
‹äˆ[$çh+IØÿLÕ‘aýÎÔ’‡¡zÊðñ;q¸úHpÔ^mcO’;çi{hµ¨1{húÀïIÂH¡m¶if…_¬ áj¦#º\†}¤í©|ÛH|:™MR³ƒ·­Ãæê%¾öK\†úÑ ¢¶íÂ£ç;ð‚ÍŽXééæÐuBKï÷uœÔ¾¿mLC¿!@Š4pA9jzÝÆ´9h±Ôû=\@}>ï5íÖ%ÖëÑ|Œ|—N6Œf¡tMøùMGcûfßX‡nÌ|®¬ûXÛ&ëßÞ¿7èB…øNá›a²«]ÏOÁº-¬Š;gäž%d*Ëez3«
WøöîñÛkF¾{Ü&£+Sc Ï±%„çW§vFq±œûÊ'‚AMxgÙXÇŽí[R¸:­aû¿v		{÷è3/¼4hw®Œ‘	Ï®×ºX6é¿—&nb ¸÷š¥¦éæ½U6àÿ;„Àª®~€_nÛ»£Y•jp?já)Ýè¡S„zÈ]¾Öwvµkš#JÅk‡¦Õ[º	¯uœ‚®„!Ö}â!Ç)C§”šžwóFNòÅ¥9 Â¬-ƒîÁ=»xru¬ð¾Gp¶€¹p+L÷I|‚·n­-²¹©ëfh}'›º«[z °(Ê#&€X,²´JÓwt3øna™ÀñÓÈvL8±ææàþ2Y¾&»Á~LøóÚÅbÖcèø;Öïa#ôÁÓSûåYÆxZG'¤«<~ˆªÈOÌ;ß å qPNìân ¢Í0,!¨ìªöè_7-ñ,
¹êÿ¡cÀud)^ÖËô5ãKÙ„ÈÝ½ÚãÀ‘²ÎXœÇë9mà¸kJ¼–è¨yéedÐ¦h&ÏY—ô©D£•)hšÝÇ£Å%1TÇ$+ø¯¾.½zë‘å3ëaË´·âÎë!J/½þ„—«^¡ùÌãß	³êP@-€FæQ­ò¾ð‰K¸÷ã?;ñ…y^»øVÐ·Oöq×Ž¶wRßÁ’ˆ§Ÿ3­¨íîîãb Vß®ï4¾ìoóóþtó‘QWÙdŒ–Ì&pa¥Q][Ü°é»ôQYD-#ã2Q@ò•õ-òñþ uÎbw v7ºlÝã½s*•XŒ/€ñ»·Ð¯%â÷Q±“yÜWòÁLJé%M{Ò´ô9Yš8œJ¶F€H$ÑÏµ¨YËÉ
Ù‡uÜ«Jð¼cL0¢À]…ân·²»¼»áN rjÜ’FoQFhÜö*ö*iìÕéJw=n™.zXÿÒH ;kT«»å4¼l„k¸ ·âK§Zr4ÅmñïY¡›èkyÐUôt=;èÕÝúî¶.¾ÉÂ¾¿órÈ÷ÛypûZ@ðÏFýäå0 ýNÎ!·ÅŽÖÓX‹E¡Å¡L1õÅTJ*œbð÷bL/·”^ï·q'½ý£ÃY|+˜½VM"ÒúÎþ/û§/ìTœï:S·§g'ûÛg/ë“ºZáÝž6¾4NÏ3ÓTÜDœŸ‡‚ ì“€ªü(Koÿ”è»X`ipê»•©ïvê»%FìÆ¢ÁM³G4ÒÑcY¡¬TÓ4x5Ø¥v™M)¶ƒÄ¸M‹8&©Ë¥åô óÕÞˆ&Ÿäk´[mIo“÷L0X•¶>ÊúOÑª×ú‰1Ð[ªíìk3‚IÜ]¬›¸K>
Ë~ƒàíŽØºb` 4ÅÈèÕûÈï2Ìh`»<Ÿ„·}E†¾{ÜEw#9žUõx—*ËËŠñŒ“Ák„NÕäÒ‡åå•5ÕìÂ0j±AÅRxD{ "4œ~¿ö¤¤ìjwi¥¡‚^ÖeÔÑll©gƒ·ô²ÙØRÏÆÖÔ³±´¸¸º]Ÿ4[Ñ~;ý±up íîÖ@ÊÑÆoL×k¥QÙZR²£]ÿ¶	c±!böâ±g7IWë1½%Jÿ:2Å“ÝFêÙ~üŒ—ýŒ5FQN3âøT<ŠãºIl3Ù´KMFx¶›K:L'H²^6¿£ÈøŽæáw$‘Ý‰DßÄÒq7£ì=!¹‹²¡˜¼ËLFSÓ÷xLàÐÉ?ª,£™ÏId®¡O#&nŒOé<I§}"‘0Ã¡Æq?ÞË~L€'£ýíL;õÑ%•jnŠ8/..Ÿúµ¸®f*¨vê'"‹ÆüüœTƒSt<EVTc.Qè'"hsm©¾¸µªG”Ö~˜û!î.F°m¬™Y¬¼ Íó°f‡n´Ã–£5ÞÜÄð”ºÁó§©±ÔXÑãÆñæÖZe»²­Ç®9rógRûÌ 7°èèçÿŸ¼«ímÛÂß÷+Xš-òlÙŽAç:ñZtÃ²¶À€E¢Èt-øE†%ÏJƒü÷ñŽER”-w^üaZ×²$Ç·ãÝó \ë;Ê
<¾N.>½„¯ÞQ^XÉz(…²G.Î˜­\õ—ƒŽ"D ‘ÝÔhwO;]U(Ø©£!×ëõkÊ¤8ÒÆ6ÝbBš	Ï*rÂ_ƒðò%Ÿ^ÂUŽ+;˜F~Â¾³ùv¦tøÒ=:Ò´¸ä€"¬>ïh^ŸÚÕÕÀ…í0¯ü$UÙê¶½–´u!Ï¥óK'arûÉE´—è"ÂUUÄ^²UÄ¼oõAõý^§ÇT]ëw/ÝÁU&*ütvÖ|Ý|]“£«:œ&Lo+6È<åRO—˜ù·Itƒ[œòçzS{9O4®}¾©:)õ×8îžÔÎn·Í`šZðx“éï\¿ÒDÑvy‡[xÇ)³”O™Üi&w‚kÈ$»y¼H½Ö	àØ¨WÜváJcû•fñžâ›]KÕæT«›þ Óoƒe´†š$ôX÷_úl9Š›"6$'¢“Í²ô ìnX_/Ã„Â)…;ïÔÛnùmÒ•«YÆ?A”åmíè©žNãôîèiG’HŠàæÇN,iE¶ƒ0Ïìã¯tŒ;žAsc'J‰?Å9 °«±ÏµsÒî×6È.R½Ø•ÈLæ¤ÓÕÒi¥S-ü Lœ“qfK§		|,"ô©;€½›ÄŽØãl \tNÈlè-œS	‹]Äÿ/<yèY±²HH³>€‚ã[bt}eRUÏ -0.u2žI&C¢TËÈ0†Tu3‘>ÓmZ÷SÏ/ijÆ`É–ç¾¬%èèÛYáÆ®%µ¨×­($g ½ q
•‚WÕÄ)
ÁS”-|F9P~McbÉTµriËæÈ <bÁD@“TÈ¸E3„S—iqØWàtRM%•0öRd·?£bzÃÛM,d‚O ·-‡±ƒ³dLÆ€UçéÖã!Ä™pY_¥k¸$X-ãhéˆ>oéá|±(ïŒi0¹R¸‘ý½Õq4ï<Îƒ¨Lž,é³¹7©‹[ŽŽµnÕF~¯ŒUÓI«Qì`£(XÅ$3)W7&/« "UìM1ÕM4f™­ÔÐTxšŸO»ZBi€¿ciˆûU’@ÆÂ#Ó÷4&¬[ÖZ« ¢éÛ:“`úe7@5ÐNn‡lÍ¶ç ŠÔze@o)–uIeÙ”T+Ü¸È-‰°Ö"¸Rš¾D#íCh¤} ´¥F¶€Ïm˜ý,¿[oŠÖÜŠ¯çÙ›ã¯q4¥Üg½ÅF™ríÊánøgWŽðûWÐb¯B3üâÙ5#>Œ^\ÐÎ½}[63]u€Ä­wx/á#Ï;¸2h‹´˜ÎBsØ•R·G†6s=ù˜¡êÅwâœ±e8Â1aæ¬ÆŠƒÉŸQ)Ú>6§t„¬íðÉ‚ijõõá¡¯¯Ór}ÑÀÑ¥Ê®Ò€­
‹,Ä›¶tM×²¼ä·/éÈë—ïzKç¦¹L‰°…}£ tk²É)'J„Í­F™;QqE¼J¹’½Ò • 9ÛÂ¤ÂJ•ÝO>Ðä-Lko>þþ›÷x{áqÞÝwDùóËŒCŸ—@µŸØqF	êŸôÚdêÏ‡¬ñôœˆ`2ÒlÌfçäÉxòGö”³FˆBßÍ—øŽÏQ
	¢’á küyrNªÝe–ƒÔ•¬,ƒ¨Ò#’²R}šGµ1‘?h×ñ-ÎÔˆV¬TÜ!©?ó—³ç)Á}ùžºôtÔØ,ÚXÊµíÑ…?„­¨G:ì¶û«þˆ}oá~ÁþWø•·Ï©ñ`A ¡] QsÔÙj—	$Š¬w¶
üž¬Üa/˜‚=¡k¸ÊÚ3þ7?¿dƒ:÷KêOØt³Ž5ž0lz²>aÖyéØÊŸR¿Ý=mDþ»gz3Ðù¸iÙµ•9( &µŒþx›«`‡EF‹>ô²±Ý˜Îõ¡¾†ºàÂøc4
UŒ )°2Ó%FïÎJz“s„TUZÎç˜Ç€é>2ÊÂ¤„b ¬Ú¶¼[|k|Ò£µÛ([Þó©¹“xôÜÛKç¨]èÏó‰EpU[±o3RÊÖ¢­Ç©¤xMÍ}hà=F¢ú2îéÛ*ßÙCå/EÔ!ª¯D`R<ë0
±`†¬þpô’ŽÆÆÃ EM(Ötþ¾Þ=ü¶C"´ô›Ìf/Ã¦>˜ôHäoë>îþ¬ƒ¯f"TöpÖ`F˜kšˆŸC7j,;+Ûa¥óCÙí›MIÁ#xCä¹_…-¸Ü<[¶©¸–¶bÆ~HEw¶ ¢Ë5®Ö„Û$&â$ö«Ó²®¥J)a³óDÉ„¦ñŒ
Iƒ‹eC“(`ßëÂ©³E…YìêÜ¯ÊÑäî‘êÉD¯ˆµ¼ØÂ_Ë–ÅP10Þ7açIª2ý<&RUÇÂ‚n©¹Ý°m´.¤¼ÌãÑ½iâ=Ÿq´@ ·A¸ U $[(£#kÇÒ•fg½Ù_ûÿJçuÒûûK]¥9(5|­šÅ¶©VËç«Ü{
Ðâæ1MÅAAžßtÁ›PáDSÛl©”ÀúRþæƒáL9A§š®`3kÝPÖbÊ¬U”}SûpÊŸŸ0¥Xï:ÿ¢.eª‹õl£Ê?   ÿÿì½ûZÛH¶7üÿwB;›±;Â±Í¡‰iÂ0™h Ý=ÍÎ„]`¶å–ä !<Ï~Þ[xï`ßÁ{Ks%ßZuRU©t0tOïÌ¡ËrIµjÕªuü­¤·ÂÓ1ÑÎÞ>ëÃ"¤Â¶¹²³ÄåÐ‚€ú2¬¢±˜(O½jCBgWvÕ(Ùå„šia7£ˆãMŸ¾Äâ)AI¬Ízó–yîˆ5ÕåÂyÐ»Õ'Ž†j,Ü:ü¹†êN§þf‹ŒU™)Fz›QÖ©ÕtÊDþç)Ì’V¬©†8ËŽËeËhóÕŸnc½õ‡Äá òK6~ÇJ~ÒÈ!L0—j¢NUÐÿÌ<CcÎrãA<Ó‡9~ŸÝMˆ)ÌjU¤ë2
CYH?îÍñCû<¶:}Éc+lŸ†©P>áúä&\f6,fAAâ'þ¬dßDËì³I¡“¯·Ã Ø^´àÆd!îÃ
]öÃ®k¹Ê³ÖÅ	Ìy–ÜñYÉPßsu–‡P-žjØYô2í®…v H[ †4¹F=L—ÄùjÕŠaD›uæžµ÷w:GGm×œ˜J¥Ò“â­KÅ´äGsbü‹/8µí£ƒÃC:­÷IrWÂäK|¥mˆB±O¶ÅÿÎ>Uù‘¡¯1TÈE«Pú"]œõíÓ×ïPh+œ…5)DÕ^“Ò'©š”äÞl°;„æF`Ü…&Âqÿ‚‡Ð/J5ˆ]r±ž‹–¾Yô )!užÝµÉ†q®™}G[Õ[ÒšÏRÒ‚¯µÏn…)&»þ–³„´t[t²×|˜«k‡˜êñd²çºÀæƒµ»òàÚt~þH^ØÌ°’ä|´Nh¿`°_°3É½Gq3:¡¬_²J¬¤~ŠÂÂPn*¹rìYcŒ¨ÝÖ«Ù_&)Ž–+·—ü€ÎìkNoÑ–xÕ\â¥'^b1kº¾lQ6`Iª­t12`‹#0q#@/Â	È”_q†¿>vêzB©]yMR“Íî)‰Éè÷+Òï×jˆ±ñ«R°„õJHÊœNeùÛH¥×¬Å¯jH±3õ\8}ýJµ¥F©¡]0©43^fÒç{Ib%nAwÊ-²®¿²àpF­âfˆ6Ÿëë&ÃEnmY'gäWIã¼k"¥è-Ä¶P-}Ögñž“žµZäf?¢+³óæ@¡ÀÍ†¥·÷ÍÒûfé}³ô¾Yzß,½o–Þ7Kï›¥÷ÍÒûfé}³ô¾YzK¯óÍÒ{¥÷nÓ\ŽA»Ô­½Î7kïeí}³Ñ¾Ùh_ÍFûf¡}³Ð¾Yhß,´oÚ7í›…öÍB{¼…öžkò¢ŽóvWî$Loìã“àòrHŽ©nÕdüÓ€\³‚ßVÈ?nýñ¿6¾y¢õX€üúë¯ü\%×ÏÐÞLMæÉÐ~ˆ „¢ö‡cþ!bÚŒµàS¬Âêi¡3wEé(S…°$è`SâPÕ_æe3š
õ¸Yo“yx)þ¢#6í6Ærzr•O73€F³¢®¦Qí¤[TI'¹Þ™wÅƒiììøÝÁpßæV¼]&¶Tbp­0óc‘f•ë@™éã…Ceû:ráZ"·ç
€È©¼m9pà(»›õ4ö†IGãußÖÏ8«ûòçÏ•ÊÐú“¡í'®l)ë¹ž³ó„oÃÛ$Ïö>êûT]½lp|Im™Žò&u§‚ûÖ#˜¶<¤7c[¤ë~àôý„¹s¸´¦sù?3Ž`êsÊ”#Rêh9MSÖCŽ&•q=?ê›¨‹i9)ÕD ¹¦¦0ê›§P6 _É–7KõšQ¢¢©ï/ZØ"–èƒð\™c?pöÆxInÌÙPMÂ×¿Y NŠö¥<ä/'}°ÔþÏ{òoqðÖ‡Áªø‘“:Ó t´£¼öÊu™Gãeûÿ¼PöK>6á¥òq‘~k¢ãËª¢éq°…ÿ™«[Ÿt])ÀJkHX¬DÐÀM•š+‹ú>ËÃ•˜'=cHP‘ÂØdÀYA…—Jl”³ä8ŸéÜ6KoŸŸÝQ!ŠR’%21¤ºL\bæ¿>NOý°b Ïa“Ój­Û÷Ãv\©—66\æFSÝÔúy›ö‹«X×x9å•r{L’%N‰NS÷ÍÑ>‚~mŽñìñk=¦blÃpÜ:Û‹H·n>Þq†æCËG1h*MÓQ
ÌA¥i~Ü—Xzu°jÃàŠ°>•‹01ìu„sªh3¬ÒCáçðÓqŒ¨»v`{w·ca<KkÐu½L´ßr£>By=ÿ6ù®ÂÜ™˜Jƒ±v¦M³áZå’ÅíîfÊæ\ƒ[-­À%$UvHþË)Wà}T9]€1‰ALrqëâQ3'BÃXNx+v&èlÔ2ß•/ŸBSÆŸ”á”ÍÎ!4ué]$ø\/ÄØaçxÇy™Ò|ÈªŒóI2Î ‰­ù©’Œö´ô Þ;UÈÍN³Ò„èŠ8Š€AÏsÛTÒW]ŽÒ×Jm_Ú-ÒÇ“l5}Þ•©=Â²{#a1
åž„Ø0ÁáÓÊói5uÊó#:p¦Øx7[Áh2$1iá•9½ñûõÜ‚>RCÀï‚š<<_ÿ/‚•¾ØõÚÚÅ¹\œzÚEÚ…Î;½ñÎÍ{×èÇÎÅéÆªGîZo4Z8U„mõj}±zw^™«W×’†ÓÛëâ.ïh½U.Ç•«ØsÀvâØE«šã¥¹žÒÐÛ®z›õJƒµî®°6Ó#¿rT­ÖÈhßÎÏ‡sîº`?ø½Ñ`ìŠkt¤P¥zwQqAEv$œº¦C„i/ hË±Cnð¢ƒ±Ã5v{äÜ’¸æ‚2,F!çñç¡2¨Ð]ì<Üù7ô…œ6¾B`ùÀ5é#»‡É„ëæ{oÜ®BälÒàÕ0@zÅNP.!Û® ÛÆ[ò¥=fÓ†]£½¶3ˆùn„q‹­.`ªq¾““¯9c°6Ø1ýû!à=g‚®"z?Am^~®8™zÕŠue>Þ»õ1©õ‚.o?¿'´³¾Wëù±_D¯tjH«Ù?N¾H_Q¹¯ƒf<âÿ$Q4€OãKÿ<øë%^®uƒ‘[ŸïÔüÉ$>úÃcy®³+p„ßW×àé*x|îyCïíT?oFHÆqôR‹ÒBüŽ:Ã‡·¸Ó0
ÒÕßy›úeüÆüÅ°E"sÃ6š¶k_P]ùÂˆaØu}Ú‚+åÔ-¹-8òóg¾CA?Öö¦Â…phÝÀ›×ƒ¸ïøcGŒíð™9~·§E²[Aüƒ,g›‡V6jÇh–È‘YôÇ_˜Ô7©~ïm­cÛùÁˆ€ŽËdä56î“1û4ýüyýú÷œ?’á›.šçâ‡[ð=ˆðÐ‹ÞËŽ¡Ê¢£lsM¼ß0¸CÉ÷†ä=G P)…Û¸„‚AÖ„¬‚¥èÜ5•†œ>ìŒó•ÝÌiHY•°ÃVY©}m—Ú[b±«Vù÷ùshî¸*ûíßzéÇÞ‰g¶®½1Õ÷ùžÝ]£ù	,ŒÒŽ[ÒAÓcïø€ÛUoâzˆ«µNï=r3„$R€ÿ¨XÌç‹+Ëß5—¾[©ãÿdÑ65j:e’F=I|õAöõ£+õ9ÇŒÉeçbFqjé²·}ÑYóØŽ|f9wóÎÄ.v'Æ¾è.?3&|Ïfu´jïÃúÝtÐkÅ5ø§GooñŸa.„‡'@ëhƒŸ	­ÐãÆTokÊ'tAoŠGNèÍÜ6ˆ+î_Ýêiý}†~ÑÖÂ	ûêDm‰P°96ºƒÙAÆˆæzµZ-cÍ7î`U[’æ­»ûû5¶D‡•‰Ê¥IÕûàÝÑw´ŸŸG*„¤ÜJIJE	Q¹…rˆªxÁ	ºÔ3	û`Š›ÆW¿‘Û©æKÛÖ»Ï+[µ,l‹ÏŸùî±‘Ý6º…ÁFNÔL±B]‹,ÿl„%Ð!> ƒÏ°”§ô_¢=Ú’½!ZqŒR{HãÅoÔ†]/œ.3¤û¾ü+1¥u[Ë66¬xÂ92(øÃÖéVÝ»Ånž?Œ€¼Éø®§!™{x™ä™R\~º¨kþÝÄg+¼¼Â[‹aØ,ïìÍÜÔL„¯.?]Asu¥œß£”7vÄa)ÑalL/Y°?¼½àèbS‹WdEHäøbùm:ð9³PC¶qgaÄší“!§
[C¦;»
;eð]a"#&aB,Ú9Ë‹1V-n-}jÉÒÖÈæV(?cX­Ïî¨ÔÜpõõ_ayFÙü–D×$òªâÐ$Øm	,n|¾!Þ•x}6®-A¼Ñùá©ø•{Â'^Ð¢†¯‹8Ü¾ÚºˆÊuQ²œœÌÃ¯¹4ãÞ—Y^áPviTõý«-¦qbM¦!,±Bü“X åË¯µ>Gƒ/´>ÌÚØÅ>/Ì'ì&þ°äz]‚¦‡=">ôV´Àû½e³<[®žŒåeg¾Úºn‘/³p¯ùôm9ý’{L÷ó}éÕ‚£n\Àc;ÏäO±ûÔ×‘èÎáŸ|Ù±„ÉW_kÿÑüB{Oqx–èËR·n–35‘Œ˜¸¥Ýªúv³–Íz9ºW4U¥/3Ô3VÿÅwŠ–'Ú´‚¥:%­ iÊz½þênX¹=Yé÷‰“Òb	Ð|(+Ý-˜Æ4ŠO[±ž­º’ÄºçÈ^®Kc×ekr€’šD»{÷’ÀXn‡nÝÕÏ·¨ac[K}Ö@Ên1ñ/]Ú9ú>m…|ùåOiçÊÜßíg²A¤³ÿ{²Ò.“Ô{Ê3B£¹ ì3ˆes¥#‚•Q(»÷§(Ì’½?-Ã·-°èJÙÎÔ$œ0‰c0£|ÏìÎL%!)mÞ¾]²ä¨‹tÑ(\f±°pçj¾ÝGþ½bö©ù’ÓMõ¢Ö!Mõn’[Ç/[›]vF¥¶ƒ­Yâ2¯,gç³.Òfz£"HDnÅe¤‰iwº[…/0œ—ôxðÜ-& ÷‹i¬;:ÿ£?€=N3Œkµš«¤µ¤t€}tDbß‰^«ûùóÍçÏspJq4Áå¹©eÏeÅØiz3ÐnÐp$öÇ¨§'×/õÆ’§õÚËÕ÷¦Ú!_[ø½€•“©°&áã ^AÃ™#ó]‘è:°Q2‚nvušºB
‡»{l×>Ájñ%±ú@Þaý]Öç·ÐèþØH0I,Êx\b–c(Ãüc/Ò‚î1f†¡ºêú^
Þ• P`ìºëãZH¨èª¼ø¯èù‹KÆ)ðòÞÁôb}ÃÝ{ÃáÛõh$@¸}»¦Û·›8fƒ’ŽYµÖ#íœ-¥•þ{{i›ì1ÜI»$´KÒI+•åL­ÃD%Ý-Žùe}¶°ß¿ÏVõÀæûo‹\±YÆS9bÙˆ6?ìÎd6?ì|¯G¤oáì±³ƒóyˆï•y?sŽ`÷gÆL‡½ñ_b¶u†ÞDçÈ½Â`T3¤/J‚ŠhKÁ0h®Áu*A†w÷¢é$ˆ¥

hSIs–Lw=í!dÍ¬þÚVR–.èT`ÚÕLyœhÌÝõWQ¥k(Ìÿ¾æR¢%í—o1*08léî)åg˜(?>¨8c»†£øÅÿd*Žÿ”*Î100ÝÌR¿9" K8¨­`,9G	3Šgd[®ðªÚzÔ§9KóA\@Ò8méw^8LqR3¿¥ë“R
WÄ›Ô#YD´ –«^¸&d|ÒcðmÐƒ2âáø-XÚqÏ[¾KÔ‡Áp8¢¶èî`¯”\n„‹ýàz‡Þ9ŽV×Dâ>¢ÕÆÍ>“HÞ2õhÎç…Çët0 u#^ö¨'‹z÷AGT±>N¯½M=Á“6ÄÃœÓ-o;æyä}H_ÜõÆ$}õ·gËíx?j—OßÃÅCï·ôÅ¿{cØ:\='Þ1±L’Ò£LË =Ì¯Þ>qlu×ñ^[®§sVi:J<G33æçcšËÕµ-úž)å“užãI·Äþð;øÈS²^	æç	šµÐR¦M²þjQmèºáà­Sü×ûª¨tÄ;ææ6	MŒ™¥6¯z°©o5‘…ç0’u¸9‚G*uo(qE0aÇ',ëŠ=¦]áÖîjuÌç†Ð™òIÅdýW¿rE¼Í8b‡¬oò¼IœÁ'ø¦r7èµ>aÝ9æÀ,{òÆÜ—B å'x°‚kÇëv#¡Ës÷Ä}ŽWâmÚY¯·@_‚Ëø/Yâ¹›úÅ®ýÕÚVŠ ÕÆu%ŽQ½zíA¯ûdRJ2J‡&œªéÈ¤!Úrmr¾²\¥‰Z®‡+“XQ;YDÆd'Æ<k7”¨;Äû”u—¬Rˆ
ÔaDcNTø#!ê® j{íˆZiÇ	aRSO¾¢$ØMH ¬3 ŠIˆØ(uœß¦ûhkp¹žBÀ{5!ñÓä¼2?Üß{”Á­zö=EÄž"²ÓµÜYûÎšÄþ‡B¥ÖH#´žC¨¨|ùzÆx‰ß¢'¥ñjºoa­FÄ‹“µ¶‰•µÚ`Gl€uü;x-ž•×`®ÎHSä‘ŽF†‰KOWlìN9RØX²‘pe¹(x0%~CJx¾ùD1kF1–Æ†SÆ†Œ“ékÓñ˜ˆM`°(‡¾%£ áOñ*aË‹	SútÒÀˆ¯`ŸEdoÃ‡ÈìQõóg™¬ë¼õã>ÜySz ¿.b®®»¢m>Ö|$(©êKoÌ5°ÜSÕáá¯|õ;¸]çéS_›ð{
»…?»‹¨&CÀŽ³Å='}ÿã ‰½ñ¯ëÙ”ß åzç—-7åJ¶ÁP¨“êíu÷~>OX…æÓÚÂZTŸ‡CIy¿ ŸÇ?kO”?’Ï¤Y¡©ùÓ«/:£ Õ'c–¢8U`màGùTúI{&¿=™e£6–]jžò‡™æò‘ÒaºT¿„öTñ|l\øÓal<í îƒ)°j5¡M0…;džj“zº‹©ëû&ÿÂ>è„m¢_çxkA‘3›%¨¡ ÄÕú«°(Ó]a;ûò3ˆ+šÿ»KË‰%?QØýógûá©¿òý:×¸çT~/3?‚s\á-\D3ªUþêýâÆ¾yD¶¨4QMé€´Eq1…„æ3˜£ª¹†úèa»YXÍ1EÁ¹ŒÒØmèòåæ‹r¨r¾·U0¨Wk[©.4mË<³Åv’3ƒk‰ÒñF¦7ì¥	‚'mÓl·›ððÒÃk6§›Z¬¢&¾Åq‹Ó	2p²ÒÊûŒŸ£Q+‹/$z+OÁq`J¯ÝUŽ“Ð‰»b8»Õ®«åX)¡¿eúF†\£™©b =Q|Zf”½F??Éü¼Ó1Š.î]?m4ò-÷$ªÄUZ ¢Ä¢€4Ó%™àÊÊòX3iÌR³Þz9U+«¯²õÔ2q”$sîóâYmÌÓf¨Æ9&1F)ov,›ß2óîpærªÂñƒžno Xýý;%Ð¢w|3ÈÐé—#Ã8Ã'·¤Ï[Æ÷ÓŽ]êkäïÍÝmæË›ÚËjäÌŒ*Vß-OÏ[`éÂFxêh¡†eEñÙY"Ç¶Ü
¦ÃóXH·*ÝêôÔ½…foô£‚ÁÙ!a‰š—ø•QœÀS÷1øaÕ7lçÞ¢’ó¿$ãN7DÇD3ä“™çá©»K†ÃÀs\¢
S±$ê›<·zÚxŸ†æÕc Ý©w;´Jeì#ùw[s?Ìð]¯%®0v~iÈ]Y8Ï§õZ“ŒÞÛ¨›)ùR?åÜc¦Ù:h{c]¢"²Óã\3èƒŒ³æ2&?WžõG7ñŸèaég±ÈV…Ô¨ÇùùH°Ðáìÿ2„—@m2v[g¯ñ{çÙzçýYV‹›ü—ØŠ`q¥°úfTš†“¡¶¼X1bïT'çP‘²W “–t?I$‰fJ‚'q8š>ôV3HOX	6hžšh‘y3nÕ)©šP’.îFN>Vé`dÓ„ìz”•‚i`eŽTJBÓ¤ÎÃúlf‡±Ê¦ý­&!y=×R„”œÝâˆÜÎfk€lKãòò*_¤š!¸ÖD¤VtÅ#3ìNÄœLmÂ€;²}â0:P±ø6·¶Ÿyc•!Þ‹!¹ëaJÿó7 —’:’ð\Å™V¿5›~ˆN4-ƒž;M‹yc(…J>oa±DÅÀ³»©ŠAÿÒtÏè©wnZ³±zqEµDÂ»Á6gÚ(Y“½©º1&h÷²1~Ö’!„yÓŽŒ§#*™ÂFüŒQPö°±þOûëœ)›¦‘Xcib43ðß³‰ÁÊÁÝwã«qp=æYãÅ}Dt®X©ä&9U*KÀgãlOò‹òd®‰ÇÏ ãTÉžu†rZ"2li·Ö=¹©¶õ¹¬ïÌ›@è{øÙÝ5­DbÏKºó˜:q>Ü$Î·™æ•tÚƒ	Žè¾fÎ1ë8Ex¹ü×#‰xà×§‰R`Ü&ùèk@ÅKÿÕh£<óë“'	>”`Lºð-&—|=éýú4ÚÒž_L&™ðyH>òw`!ùlv ©20GãÏ0ªÊWÔ³tžâ¥ÁÕT‹«5WÒÛÅ†(\)•ÇXŒTêÄ ‡$ÁšŽÎ³q+Ç;:Å÷âZtñrË{ïÆ˜1Jz_ˆDÃ”).}9ú%‘”~\‰„”{YuUMÈ:ÓíÍ4Ç¯ûÕæÊ:l“MkKn7ašk©Î*£OÖC®v%:ƒuÈzåŠ€)Äžd¸æ®Èém§÷ÂLêÓ†×ô½¥÷2çŒ*ËV¸Ãof=y»Ä£™KÞVìíÅI®Y‡œÞ9*bWà?;ð2,Óä:àös^™ï„It°µRïº#2æhNÆ«:.Uv	&Ÿáˆ wÑ¹Ž'â‰¥Fý”1ê®mÔv¼Ž‰[16Ah=Â	Èpó·ql³§ÇÜ¢ÃaJIçÆ?Øâa¼›]BzíåýdOüäÕ:Âi·æ÷4ÐîKªK)÷2uz'±éÚýÌFlp¸‹–¢Å’ÕK)—M‚®P/Dï–hIô~ª£÷œcžK\`æ‚1|4Ìÿ†ö&›€:ü?GŒs=ÀšAÐ#hÒoHœ 3L8&Lä0Ÿö$`XlW×Ø	¾&S3€BÒ›Âî‘€)¡RZ\áÞTdL¸H>ÉŽJäôŠ¼¾e¬cn*û³6™Fý
ŒŸï½;™±å°nU.UÀÐeÎ›Súï«é?[Ä-ñ¢+kpÃVH£¹ó³êhXG¢˜eå$Y.ôÅŒ¬:`îÈ˜’|¯Å[´fC`äÉf„»ù®ºGöf Á¥»JÒAðÛ‘ùLO…Â™áî7â•O­Û•Ø£yÇ˜=ö‡³R<bà§óá ê¿¶O;ät“¼¿¿×R¨á|à#ÌÏ‹³â¨pêÜ$+›&ëÑEcKîzp¡¶OžïðßzõêùÃj«nxEHÅ!Ù¥ºÄÝmkaé>·AE¶Ðt&`M$*½V_2JiF…Ì“¶¥(—'d¦<MB«ç½´÷ûe])H1+ÑxzÉ:4À0#ÝStÅÂheüáK³åÞ¤#~W(Îù[l²y¢-é9PÖ>Ê[çŠD=Ï+Š1s¢VŒœ"i°”È»%t~‡Q‰}¾+”KÔçv‹6ñ.ÝÄ˜"¥÷™Ÿ7.(}ÈçÌ¯dãÙÍT»\>cÕh˜ûçü¯rÇ«Z4á9dº×Ì{£¿Û„õ‹XÔ UO²‡žÝ}"®¨øZÄÕõoi•˜c)ùJ§¸ ì6\=S&1]xíš%Ë¤iÆ˜ïÞòL¥Íòx8…XÎNƒ+9§–¯ƒûF²7¥´¦…›T{pÎCâ_ƒ³¹3fÛdŒ5eê¥¹Y•Ó×DWÖNÝ±–wÌ¥D("ý¼E½;#¶dÄIÏÖÐã}Êh©ó0§ÇRùjx¥>Ý¨°±´‡—±bmÙe_)7†|6Áb{3‘FnŠž8žÝÅ¬Ëfº›¦Šbºª²u±”¤—YÎ+Hµ¢­qûã¥%óÁxÐ9Õ…Æ©ü<yš°²¬g'ý Ê_»yz\9¦Å½Qä%ÝtÇïk’Óg>}Z­¨ÎxÏÊ²@¤jM´VQ¤…ü‰R,T
õq½0—Lü«ìlŠ—Y›8¿˜þ%îÉ%(×ŒM*ÂòÒÔ)cËaì‚â—FrtVâ>™€ÔÄ¥¦Bí·˜n²uüÃú¥tÚwæ!î‹C¼C<é$‹Óø³øÒ8Ð;äÔ‡}*<KÉ,ÓÞ%?qeÌíl¢¤ý&Î†T+ÁÔy;"&>ªÙS|¹nÊw¨g¢<¯5ÉSÆsRúˆËi!]xÂi«ë¢Näœ¸žO¹)Énî(ñ4ì¶Cž`™è,Hb¥Xžª”ý…f^É‚8°2qZ^ÂèÞ+
»­)ñüaÜ:“léœ`´—IOoê«p%¶…ÊÝ
:AÁ—,A øv‚³æ…Iáuœ^þrƒ™%ÁöõÄ¿ô‘	iiZmR˜mV±×®.Áux1G÷ˆŒìé‰Ê“Ü'nµŠ…¦‘çÊˆ<¢üÓù°U’¨Å}w§gÉ^«1¼o¶+IùgLªwGpÂÏN°XÔõÎÄ°/0!oÐ»!Æ…8ðýVØÙ°j¬¦é,0Dñ¦£Ô{ä5.×™3ÁTP¶6k~„Ò0¦884à…—uŽÃó”9™%‡¤Øér ¸æ•Æ–YctmÙ:Kõ™Û•&ÞÍfj?·z7Ôé\Q£;9ÙyHûÓ¨rEÙ,ÇbnD<ÕâJE½ ;Å,¶ë¾Ñü$ P°hº†[nÝ¥á}ÜE~·K&ñ:lyÿ’¼øŽ^Æ]
²ž*Rå@)øëè´þÞ›¤šTmcç¾wàž#š_ÕëÁëQp–óIœƒ±ˆZ`(!Ž±x›=!íì‡]»|íé¶î.‘·ÓÛŽgÞ¸;èÝò{íhÛýwGoh•ò=Ò°‹«SÑPÏ¸`4sÛ,îTëy›—î°¦ºæì´¥ªG©’åL7±•¾qä7Žü8òÝWM0¤|'Ó“¬¢xÕ"Š-íZMìÕ7Ôâœß:m“Å­PúŠs…Ga×@™Äæ«<Ì;4úT#0'>ÛÂ+4ïVgLõ.]ê’Ï“Xº?$wþ¦Â}²‚ý0	*«EÙ¢êÝN¥ØMÑSÏÀuð_CXtà_>îû•ÎÞû¤Tè‹Þ¿œ_ÇÀÒ„OŸÂŽé3×ž$AÂtÔÚ­×0FIr w2µ!ÛÎ½’Ò”HÌ™¸ÈUÓguƒúèFh s]«žÄ pä+Œ8%9Ö¨S'‰:]~UüÙóoê(ñ¦ddœÛHYæo0‚´*JpÞŒð«çS:°üö&ÛÜ^¥I]P…¾­GX§hÐu×:Å¼{ûîMûdï§Žóú°]°¼Æ gZ•æ!'lø¼}`Þ[Ö}%Ú_·à,où½ô›dy0J°QS…'êëKzûôº«#6ÀÁBåyñòØ¤›²$‰Îo®ÛìÐ1`‰œƒKP"XMæ(‰à2ÎÈY#<”eCXCý%E\|~Dh"ªfÉ:)…S +ËUÐ¦5¥á!Ð ¼4¼Äùd…æ»Ñà+HKšáø¯ÿþµŽ±è<Jõ`Âµº]X¡ÿ¾É:çW¯<JL…©3^Ç³\L‡¢5[éòU§Äân4‘çÉ¦ö5Ÿ¿+QÚ—Åª[ijœÆ5ÐÉ¸’eèf_uzÇäæ	Ù8"7)ñ¯”9H;§T–*»÷ t”»d4	áAÉzÝþŽš˜Ìpó0àLtã–¦(£…‰-§)J¹xW½â LV­DçŒà[üwoR¯5Ç1ãøSzéçžøÂ¨(få°ËJ“QU,~ ›¬Ö‚as©Õ¾öÆè9,îL#+œoÒÀF)&£Ì7‡~nÜUeÚm2éôœJ&Š¦? (ZÁØ9<i‹.+¸Êðíp(™lž:ÐÔ²€¨ë6¨i,¸À;Ï9mÞw‹÷+ð2UGc)îv"øÜÁDûî»Áp:Žýðö»ïjâ½ÁRÿ¶Häá£éAJde¯ç¼mŸÀ_#Ü5è[´Ú7$X÷cëÃ¸Obh!âË§;Á…Œ†,·¼ëcÆ(M.gy£ß}·ßù©sôÝwÎ9¡sûdØóœLþ–À»G½(´+Ò;cšg”Ì³V¢‹Q*$r“
swO~	¹!ÌÙOoÝ$èß*ëü$ÞÙ!Ä9¡î9•CótXÌ"À<7azX"à³h šz¨épÿú?ÿÏõ:ÒNÔ‡,»€C¶]²‡uÒ#V>Wºè5#½ÍÛãXÉãËê†OZ>yŽÅÜþ1˜1£MÅº|_¤zrâ›	Ñh6*[W{ÿ`Tœ 3fáÀeám7b›PØ£¬søß›ÃhNø	…¨Íªc›…ÉLàƒ‡2]šËS\¦1Ì¡?èå2ÍñŒ{ÒÇÒ"ìµŽ¹Ð$¤†>*ØåOÈ-`«‘Á$Žò’ôÅ$jVV*,?+“ò-üôë}pq1@ØO,œ`sÉ%—I¶"‚]”8Éa"qS
¹húÍs«÷-ìõXÐ‘6«ªÊ…*Øa²Ur%»^æ²d:TÖÕñ‘”ç¥À‹p±þ¾‘Ë¾f/ [ÝáÍ~›ÓA“†è–ód_Èûj«£z]³ÞÃ(j¤Ãõ³PÌÈ'Ä‚#~âár¨ pùoS,Fƒ[RaÇÒK„—ÍtÉL+…° ·ÿ#qG*5 I¶˜ÌãÚs€KíÁgÚÃ•E{À±CÝonþlÎö;›ãspR'ŠGÁñ_á`B=‘" ×³É­À³¢lä•MÀ}¨MŠTK[®%5×âz„#4]5raÉ"2K143Ï—µ¸D‘Ôta­”Hgú(ÆÎ±”<J Ôf.bO¾-´¯'à"9ÀY‰ŽRªèÕx«gùnüó{9ÎÊ°u)o;Û<MA„”;	M¹ZÂÄ¦˜4#‚§![Hx¿n§$HühµÒé6ÁþÑV†zPlP2¼€û´ÛÇ-E?Ó¼'cï•bÒTgÊè(lU2[Ê®ŒiQ/Í[€’ÊÞ—UÆXÊª›].ÝÊOÚ°èX C£cAF)P7ä_ÊS[ì.+`˜v”$¥¦_l0¦…^±kÜmM¶ÛÙ]Ûe¿ªK'{WÆ%+¨ëx‰THsËN RÑgæ:ÆŽ¦½’:O7IÅ˜òa=všb¬Ró¹˜ÎNW©=vŠv¾§˜ 
¹«åøcëCç˜Ù‚JöØcg’Uö÷ØyØJë_Ó!÷XO.Qnâ+å&ç«0Ò
4%/k/B%ÌRªožµVíœ"pÞ
üDitJC”:r1[Íg0°cDŽ‡¯bÛ(’^5mdÚ˜ÄþpÐM§èþ+§ïƒƒE„#Œúã[r ´âÀÙ¾âo×=í6»þ×ÜËFV¤0ÇÆ¨…™étOjÌ‘x#Z·zÊÉaÃ²û [·05¤ÙÔð’W2
“1ÒØlî6¦o&Û ÔoŽ’¶æ3ýŠÝîtˆ¾æG˜u„6U8tõ©äOyÀ((õÖ™i1È‚fQV|ônKÒê*¯KÍ7¦eI6J-q/õþ‹•çL8„WÔ•tÞ_	^™‚m önÁ8ÈH<Y6Ôÿ dlQfX‹Å©vAÈ¾ŸöGƒÎë\´¯ú	lªrÖ322¨¯ÛÜ¥¾tÞ;›¼ef¯«	ëÇÄ€¡uU­#GµP´‰Œlha°Z²¢MÀ	eÝŸ.˜û˜Eµ0S=ô´–1 å¾f>Ñ.­ºaéø;¿_CÞ+~Wúåþñ£ï[X¢†qTž^O¬‘Õ¼£ô
;8ÇX6;œàÓDêŒ"Üø¤#Çòœ¤“™s)ÞŒ†ºYŒœ>6‚‘(o8.Y|ûO`¹ð;FÀYÎöÝw]eÒƒ˜FíOúý;,Ç‘€ÕQ4À:Ý`<¼Å9†åyÉÃƒk0†Ô/§ðr`2ñ÷ëVY/À•9Úñ:#úÜ[ú4°A	<¤‡	SÁ…6íOÙ£_&ñüi„§ 4(–@S¦>w	Ó„x¼È@V¤9ðvP‘E Œ#M=>Ê¿ô´Qþå?ZT…_Á„x\ÔÕvö=0œ6$OO“&–Uy?j:ÝT(}Pœ±^ðñ±Ó?Ü*'ïQ«,‘+žb‘•ö{J‹;<\•.Õ¯Âx6 |L"jŸ"‚þ‡ã‘ÿ(à+¿<ÈÞ›_‡:½i×ç½5#éMûÓñ ï#jÅÖžh'Ñ‡³‚¾.™Œq*z¢zj¦îû0KáœêWâÙ‡u+P¯Pó²Sô	Rµ–ìló˜ZÅò7’v–¶4Ü•Ï¾Náª•ÞûkD­RlŸdchÑ*Ú;La‹Z¿bu5­€n!ß cñÊgzCÕ D”>ò"ŸóðRk.iqÊJ
ç¹î4jÓ˜zìi‰!»âêÅ"cWu›2µÚµÅBý€:%hßYÃ‚QèGÅvú·µ‹0U°ôû˜Ä•@ºz¬­S€K¸@üqµZeítª)‘ñ>>Ñòj°‚ÂÐ¢²R¥£¿'ã©æ—Q9ø‹Î¯¿q à@N¼ceþNÑ‹´ßÔ#…º‘¯0™?'Sê„•'DÞ3“ÓL}ªíl6`¯lÑÔæÙj‘£·OÔIÁwV÷­&ÚÍz¤€J ûqD‰ÍÛ½žÒEb¡ÏÚx-L€b·ZM5ÀŒÇ$Ü=yû¦š´¶º·î$´0Y›\RÈåîl^#s¿6%óóSR“oBï¯œýNÑ~èÇ£á«âûðNâ÷JÝ	÷R0žW2"'Jê6ç­ÍDqá‚ó_Ïîh‰}|Ì¼¸{+ÜSQ½ÿá´äDñmé›úÎÛ×þh0¼m9ÙÃãü/žÑî´Óüé#PyÂÁÅš3ñ{è`i9¸[×ŠÎÚrþ£Aš/Ï×~mŸ ×·å€,YsîË¾MM»ÝñªáàrÜrØÅYÆ’ñ§;™S OZNsrãDÁXð?H“¬^Ô0,‡d“cS²·vy–ñ&v'ˆ*ß±±‚´-?BwÃ0#8@–Ê™.Í6ÊD}—Ù_B=pî(èÆ%=_\¬^øÝÙÉ-éïô˜ÅSêåÊ¡»%§Ñœm²IÐÈØ?x:²×¸¥€~o“ÊfžYA|ük¾§^.Ï4çDá;JŒµ=eæM
ºÁÝc¦'ê2õA0h.ú 32­¡ºÝIörÉ_<_}àPËÚP+Kß/­žÏ<”îKÆZºXZ!3IUÝ^5¸	Ÿ--ã|?Û8Ô«~‡Å}“¡›?¯17;œ9JCt°Ãz^„øÿ5´/g_ÝÄ6Æ³À>·œ:$x€|yîWêžÃÿW«/Wg½1•š\ôÆÁÞ’6`Ô‡˜QrSù”üŸq$ ùÊùÎyÿ×ßiÖãD&$Ã	èdJ¥´(Ç {Õ/´¨Ïð?¼(¯ýð¢´–÷êLeµ1 €Cßbuôâ>Ý+ÉÌÑQ²f;âºç½eÒPt®Åeü¥yt­°‹*{ÃR9pÙYÀÑ8‡ÓÿÖÕ5·´‚º)ÕÝ©á0Ž£Ò´‡™—VYi.uéWâ8r9ÎYw.¦ã.Ã#uîÊŽ¡Œâ_€bIçhŒ%n¡&GEÂÚ†§&¯9rDâ“Áˆ€ù\É¢ç¬Öë3>:cðòÈ·§T÷(ÿSxáe|á²¿(;¯þëÅ\òÃ‹’{¶}3ÐD‡µt”{™î(·jM@)Ýe­GxÚ“#Îô½Z}ÓÜ§²79Ï‹´«Ý Ò^}\:Ç}Bb‘á>ÉXÖ½ÎÆ[j30l9¥-èH¥kÚVX«E‘x²Z0•S˜V*«äøvÜÅÌ•ŠQ­Æ“Zû$•yúôÉr’•Ûšl&øÞTÄçÇÀ‚Ü;[=ØŒ]Ìtd¬'”í>ULäìàgK‘^ÝÌ°U€µ›Ëüõ.:³ú³9ÌxÁäšS‚•¬ŸTÌFÊ‡,õ†:‚ás“+©+™©À6VØ'–ªÆD‘aÍb€¨=ÚîðÆè4Ÿ¸ï÷z´ü{.j~½©ÕÁ}Ö’kCB[±ÕyË¾¬ ‚a›ý~6–îE-¥ü8?g‡P·4®€á›„vc½v0I´‚¿¢ð¸½6y@¿&ž¤•ê‚¼g3óžªwEÛo!Ýö`ÙnÄkd­gõyã¾¨á#ê´æ8Éþ5»wÎ^°ý$5¢²mJÙÊˆ‡Ä­ícQê¢”:*)òJôÇš‚ÊVîÙÝ¹ß»$µóËûRñükzš÷µÆòG‘ÂâžzÖ¨KÏe„áL¼öe’Ì&Í‰†¢bÚ[I`OP ¶__ol¸(v[ôCsÃm‚De7ÜÅ>œ=»»"÷qÿÌsƒ‹2Žˆ›_»WœÑÚ`­f-¾|ªPÕZ[ ôD´©JF•~‡’Eë…¯™G|­×YÖ~VŽ••²ïžzMÞà‹†>Õ·{ t®ž¶g–uYˆVX¤±/Kìi=L­¬eÙúÖ(ÄÔvBÿ’âG¥‹rñBFVÿúïÿINúãv¹—ÂWQ#fÌ_6+Ó—È“MîŒã0'[Ù¨+32”Ó$Õ nÉÊÎjk%8”úŒIHÒŠÞÃ›­”H£WãÖB”Áû6lïK¿Ô_×vr¯TR¯,Egvð?c·¥YäÇ¡µWYòœeÚ Õã‰ì‡!­G?‡uc…;Î,”ô‡ñ­û>Ÿèh/—ëæi&™¹>}‹j›X"ÞI×â¿aFW¤š+Û‘fxÍ“À2ÔJX^§îŽ<¸°=.µwC~¢/·èn¸'ýAØc0¡Î‚ÓY“¡%ßöß4á7ÇaãäŽI8¦‘Ûrw!¬­¸þv0BgÎí[¬S}/›BžøWd<3?N‚ðc1?+Å^ò"íX^=ìÌ;$PÔ‡åñ–RFR(^äAÿbÉ¶_•ó~q6£}æ³ÐTqsÀ)&qÒ®Ëh8·l­ß±t:.r6¤9¸°«0<7ºp8ØŠû/Ú
Vf¥ñr}Y{ƒÔÂF®<&ã0_–€XY5Þ¸ý´yËß“ëXZ‹³´ÛXµA¯•™d¢
ÌTg­r½ÔM(¨g²Y°ÿŽ}µÉb-n*«Àõ¸×^Ünz×c^ù«%¼†oÓD—·"¸·lúYúgìwl÷°L›ýò9ðD¾Â‰Œ»J{$ÿ#ƒ¼@LˆtyPÓõÀ‡7>FèŸñ%âbàÔ	`l9ÐE”ôeÂ7ƒÉL05YË:¿¼õÊ;ê³qY\þë–›×¢:¯úEãû¦¯M`»sØ>:yÛÙ?qvœÎö»­öÉÞŠžÝoØY.³PM–óÞ~iÆ·_ÕÞ¾Y_i|Ï¾ÿ™Åf]¬»Q§#àÍ•š·Ä5–¤'ñ÷2n1³05ÉÙÎž›xcÐÖß˜æŒ+S„Ug I¬µ¸|‹&ô\QÊ9BógäË_ZD§é ®‡ÿ<áÁé-ŒM»<6_ù±¿yÏME7¥<wÊ™-N
–#Æ8bá=6{›ÜH	‰lîYqTWUÁôs‚¥°r%kôRåB–;‘Ç¿’¶@HŸž1;÷M§}´ß9röÛo;­Ü.µù0_ÑÈ²ïTÆû¾^OI•¥¸¶ÎJeQÖ 8úŸdiŽ:;£ÎþVÇÙ÷v.TÞíWK,VNá½
x¢Ìj‡eZ¹2ÓJeÖP™m]Àõ%Û‚iì$˜¤ÅÑŸd%·ÞáwÜÙÂÓ­å+VtË¶Z±,‰J@¸ç¹N…5Q@DÌ¤‰‚çVí Çÿk–¦óKûíÞ~gÛ9Øw¶Û'”Yù@ìâ7¶%ÀÇ1æöW\2^xwO‡­÷[îÚ=œ×x:3„­I>*H	Eq«•ôAŒ6ìeøçö ä¶/?ù!lŒ<à%‘™“4s3êÕ™!êuÅÚEM¡KD½¬áÍž@6ÆXÈŒ‰T$’[11
¾­ç©º¥›E[nóò|±Œ¦cï¡‘œmªXÅ…Õil¨Ž¦þ•¯ýZÅ½ªLÚuÇÓyÞðÜšC+…®Pè°þ>SV>‡OÚò1	Ç«è4“(ä&pÉf^r³Lr“x;Z2;Â˜D!w²£¼[\lÄ"ùËj±H¥ÇZ¦×5¦ìåTÜçÎdqžã·‹8Ïþ6ÿ€qž£mç‰ÉýÉîYõ¹ÖÒNgÿ¸S¥p°ÕJ°F+,pJÚê¦(·ê*óX¬®+¢	î_gw,¶Î|úøZ%ª±˜Â¶sGºI’cöMûøX;dÝ,÷ü&‰èÀb|vŽßmþ~ßJ¦£Ü!f•m™v7Ts(Æø°K™vŠiÐd›>ÙM™cÛ~Øš&nÎikžË)ŸE}3Ê'öÖ.(º›Ç£Ÿ¨GÀysðÚ0™MG‹!™ä«±ú×£M|3\(áÒ¼×<h¶¸I9÷²âYÍZí§]S›‘»|±xq!~.®öz½•ò5x`¥×\í½|"ØÛ?µ­ÞiÓM}ìœ´ÿÞ1›«•e„¥n£÷r¹#8·•c”{9Wj•fl‰3¸eñóGÚ¬/Uá¼ÏõsWðmpýÁ
‡c…>oÚkußÛÜ;¥4…f«õdgÐM3c[SÑ
5V/´|M–4î6©ŽWÎU¬-?¯Ås1uÜ½ÏƒsÈ²Á¥<í;Ñ}àŠ+oøÀ—ÌMû}þ¦Íñªlà½å8(Fü^†|QøˆÃ7ªpáõ /„¿öXt+/BùÆF¥ÙÈ=ÞÚ=8xã¼~··ÝFï¨¬{[\ûúßŸ³°†<‘ûb?ˆY`Ö,£û­®wª÷rK€è½E¡œÚŠ=®Ä¶ˆÇUÒ¨"h¬ÛÞ®Ì5ªj{ÃAÄù![suïrœûÃýéè„„`gL:zàÓ>Ìþ4¸esè¯h[EoW<øp…xwƒè`“ßÕž1&ô!É[ùÃaG6¼‹Zïà¸%ßBõ\~’Ã¶å°So
`ëî:'Ù='/ØÓŒ#/ÔµbL‹Ku½ÿ´pÚ\®¿/NâF5Q	ßf	æ®ª©ª¢6fM/E*!~%ŸÄX[Ð0?ÁÈDÅ4Ñnn-­3ÞÒŠ:¹Y 	KvíA£— ·,Ÿ´ªÿœª7¶¾%—Ù¨š	”uc¥L1ƒ=ßSKVô"+¢¸~ª8ï²`\Ñ1VMå.%r’å*+ÔW²”© ŒL†«\DRÔj!Ú;6ØNª)4RI	˜EÀË0Öée
ÁóR)Î& •“É¶¼[Ü’of†ó3O!7}Ð¶ÑÉ¿ Œ×öññÁÖ3^+ÇØï³(ªmôêÐ:rg†è3RŒèa»×~ãu¶:{‡'áæÜ§œÜ;f;©"eÊÚÎ{)3;kÖš–ÜÜ¸¹©,6ÔòâÐ›¥ñŠ£å/g&&GÙmÎÎU¬ìr™³vÐè/F,Þ%Á1àág‰©¨³Õ0ÇÞ
*<h‡î©djÎÄ~Åç™½4£É$•Þ µTÖufñœ\-u„}³Mb0ŒJèÞùz«*I¿&Ë^æäÕ.	Ñ”É,êÑT@åzFÏ»T‘Øí…4H¶iv]‡Æç28Q"mæ‹NóÍÑþì´¥	˜ó†ãüÐb
Ì™e$n6Y^'²Ò(N2rY°l}øá4âF¢}“ðTÏ²t[µï@ƒ’ˆCbÿ(eêòÒ$˜E^©O Ò5sdT¶·/ÝL¤XQ2×M9+DW›ˆJlk­uGa ¦X8gWqg35CÜ&2t†0šQÌèü £ŽÊLG¼Ýâe¯x[ï›V„["c™J‚Œì.ëÄx[Œóì¶EG5?‡“,õ•ìŠ4›U?°3šêdèºµe÷Š´úåLu×ÑüJ	ôÁÉÞV§åütðæÝþIûè¬µêÁþÉÑÞæ;#£µHÿ¶åô:8ÁfF\Er°¯Qš1õ¾ÁŽI>íó:)° m†D¤SÅslD[04EOôÀLcÞx€Cý{0l4¥Ù®ð]—ÀV¦å"$z%Ú!)E+¼Û5ñQÎÉ˜\b¼coƒ.©9û`«ŠÙD}¬­Å×I4Æˆ?Ÿ°2ü]où½>Ìó’ˆ†
C®ù¢™ÂÑH¡ö–BLgD"t¹b»w9ÀNãàzHz´êNdn'¥µ¡§}dŽDšàl+éáçAŒ½-=§¶®$ÂTƒ¨·ú1½_ì^ Œ&Óa„yÈ@šn \Nz…$y©l£”I©EQ-÷I¬Ã±îáÄ‘_(£ÐÞ¬Äê€îõý æ4='ª9Íz³Y¦}„q–q“]áhˆ³ŒÕKg:™fp»p×‡VÒLƒ•,¦;6¥ëq£‚™håå*1©+SM"´ƒŠ²„ß‚û9b¸Ÿ£4î'Å¨&ˆŸ*þ’†Ñ×þP‡µTð™`þ3Ï$. %õ‘”‚€¥‹’;‰þ£Ûí®¥€ 5,íbˆSjâ¦á¶áÂ®9,¢°ñ‚ÓT‘=WVVÖr ÝW¼‚çJ°Y#¦îÌ³T„
•õÖ«©·~‰hs*2…ÅÊ{GéÓänÌ‡¾K3ƒ‚‚X‹‹‹3¾YÊ!•ÿjùß–aK	º‡Âa-ñýóÀ·£¾í¼ç˜$)bÆ\Œ¥\nÕ¸ÐBøÜE®°b<²Ô;èO)ƒð¹DéðìNõz²Ùl¨Šê +ÀqûbdUf¥,'˜ê8{Í¿?,8|½^OákØ@øV³ätj¯(È¸ˆ‰ûÿû¤Ò¼¤à6ß–gPDß/S¦7<xNåÙîS›…Ï'Ÿ–¤N’‰=L¥•û*qÀýðï*?ÎŒ[ˆ2½êŽ+|Þ×£`£H»È%!:÷D¼,éjèèû=)–cªíöe	ZCe––ä M0—^ Î‚#/Ÿ}YÅN¡¬.ú˜3n&Ú°Ú"ZRô…éÃž„TJª˜ž€V¿×Ég;ê„§·å0WïãŒãlE½üº‡G¡ØçJxRKˆÂâ“$C>‚&¶{èÐÇY›eþ”
ª®×4.–A¯ÉÐš¬’sÆµ£bbºÊ¥}=Ã±UF“ÊÛã¬5æ‘p}1·ÿƒN>¸>mæ&6çKç_%]žXì:ùþâÂP•	¹hÒ‹q”°ºT¯iì‰ÎÎ^º°¡Œnab49yeÝºº9êºé¤¡ñ}NÂËdˆµU*ÖŠÝÿ…›}’ ™çXGwê¸!¾¹÷Ë»÷x1y¡ÿÝœ÷.á~aé%ãzéoû~±î/æîºÿWè˜Ñ¿ÿp‰˜÷ÝÙšŸjYå²†T¬Ù”ÙF
W„»-Ç}®8˜ž»¢?ïüô×	òßÃˆÕ^v0³1ôqâÐn,FkÎ½hþ$%g]ñyÃ÷¢ïÀú¸ÏGžÉÁØó ø†°ÿôÀùE¿ ÷»~“ÀÍs(yï@ðÖèJ1üƒ"+åáEþ4nBKbC‚üÞLßEr¯Œ…ËP›–õÿ®l.ú§…ÓF³lªù¨×Â„Ý„‚Ëõ«éüõtÊÍtŒ=F¼»Áx€ýì[wžñm«îE˜óßª½\önrÜãDInið[p|OnqÞïmiî™ùíK7ì¯þÂéËúÇþûTZŒ«Ìráí”ÖÜæÉ9OkÎ¬{`v:ò‘-ã/>>ê5“rU2òCfV…{˜—„ˆÄðæ’­6°ˆ|ÒxØ†A£ç8‹°:ÃbHö†(Âfž‘ä=²‘WMdÝ\@LöÆ\oÚƒx ¶Ç +ˆb¼É©Ëü‡Àt˜ƒgb`…‹ãzïj@è‘‘õ’ÝK‡”'ZkÒÎ€5ÄXv!€-§ÖHýgÍò2ü¸H6ªW(R:3p¬€R¼ ´Ís_Í©È.—Sâu¢CÜ5 þ±]‰=¹ÌœŽˆÇ½^©pü˜9|¢ª‰ˆš°Ç ÷¾jB‡œòE©~þücÓŽbË–¶å'=!’‹éöÏw´ímËýTPÃŸƒð*r=Ñn·v}]»ŽÓÒãÊZ2ÅëkV˜÷ÜýOYØüAû	A?|O‹ÅU†=ñ#í¡“¸è¡“ØúP00BØ“ÏŸõGÓ½ÑŽ"E¨–)Žý¢Ç¾õÁ>*hò±ì}è{I#d-ó™Úè;£å‡L‘‡‰&\Õ\Äå¨Ñ·»?› )W0±J"~tÂÍ&ÇðXJä’à«z+ùòIÇ†×d¶þ6tiKÀ³¹‹‰­h›Í}á`‰f1ƒ„,…Í-OÏß‹¬¶Ä²«ó„€µ‘CBp#³NB¯Ö)‡\ÝÄ•¶Õ1Y›€¦°è$B@o,CaPtySi]}~¥R¹"ë#B­*ŠŽdÛ+ŒL`Çƒ¬=}_Õ÷"þqìµco+ööb.üwPÄ·ãõJŒÇ0àÍ1{€þU;>Ý$(áiÏ“Í©W¹¨Çûø³>Á³öàQ[EÚbš†yy>ÆÛ%ëŸÈüü'`á`T©Î­¯»îÆÙÏ??»Û$Ï÷ó‰ÜŸµÎT²;üÛ³Â3¨.yÂÖÛ·Y~S§»dIjÆ6§¶pkWi	¿K¾°ÜÉ¨ÕÄNi£kH)¡³CTi“›µÃ
ç—'§ñJR¥Ÿ±¦zç%Ye5cðÈ4½H”Bsõ˜r2ÑŽk8”mÕìš(8™šV©(Wo¨\$ÃÑÑÙsóxÙZð„§–¯{Œ=<IÉXs¾ÉÙÿ¥rVlÖ?ƒ¨“,WÔ–’4+¿Ÿ´UÐ
ƒÎ"fó±@Ê–±Èuù+äçñ><^'P•

µ*¡£éhkû‘œÀÌM¹µ#å³~ý9­SÉ	¬£$®ì¶K2eqóå[({†Á[¶€ªlQ¸aÈÂ¬rö5sŽÜY…œ)˜ŸxVÏìCefŽWSdA>cøÍNos†–r"tS4 ›eÌltÍË¬yD‚,÷±8±\æ©;)Û:•ÅúÒˆ±€Öæðó1bÜób“|·X¯JY×¨*	ûE÷gã©÷gãO²?›ãÞ·ýùmÎ²?ÕÉv%:ß;7þ(c?&[ïSÞíŸ’7ËÞ*îr™¯Ó—Þ]ÅH9éíE5œë`ìk ÿ®;,iút[LEèúr{ì{mqPž²›¬™³É–Jo²¥ìMV¤ð#†Æ
­¸Í²|ÒÁÐ‹eÃá\¹¢ü›áóÊòûË¥W¨°ëÜêqw¶‚¬&ÓØ7À=¬P`3D©S[øˆ%®Ñ“’6}HcXkåR$~$¢S¶mgŸãlž›uÝ4AÄ¡qñb•,2¯˜½ìxâ‰šf›¾^˜ÜÈŒ‰„éyVÐŠCu–ÅvýBä”R=).éh
"¤˜˜+’šÀ8á±©=>m`àA2‹?A>/¥(zøì_"ÉËùiWî‚ñ›à2˜",ç êÜL!éµãóˆ`ì>„Þ8h÷àxÛ¡iÆc
½y€œŒîy‰ù©ïï×wjðÍqŒæUÚÀ~¸î^„Áˆ{h:G¸	`.ëYàåTKhvêBíuFÒoxÞÃ"¦jM×ÝC2ÆÔ§=™„ÁG„Y¹XwÿLCšÖ8ey·Ýiˆ¹¦Ã[çÚ —‡f×ú8ÅAäñ æÀ¯ëÁp|@³#Iaþê-ŽÊ` Ý–˜WŠc8±`~@"vK•üÕ\¡íŠ ‹èU‹TýqQøwJóÜ4ID›^çþfÐÅ¦á_D·Ú
•'‘ž|éiÏ!Iè_Üe<®jd»d½Í‰+x&!{H.MY&íoSÜC}?rÎñT
ùý"µV[ƒšCóxGþ-Üìô¦4kx0†;ÛÀ_ÔaL†›ŽýiÜBx­_¥šsÈ²¡1×‡ŸÐõÐ×ypWáÃùOÀ'Âÿ|g·øW¤dÏÏK:&¨T@IUè­ëÝÌ«d¨„¤Çuƒ¤ûs|ÁãÐ½çÐÍGéz„âˆ{Ûôí©°ƒiË,ä[‚DþHy²}xxtðSg[®æ´õáG / ™ÙzÑÑ0mlHK›øž“Ô‡b†`Ñ[x‘&l+xØ?ÛFv–Hþ—H¥?_:Ü…t”­çæ)KƒñBs”Ñ’æwN²G*³rEËÿ0S¢˜¿ä8fÕ3ã¹D2‘Ã)&±“„˜¹ÀtOžýØgÿØÊ†EÀ|@C3Q|þn”zRãÅ«¤]/œ×á‘Ö—ñ­Þ0¼³M¥o‚££5~Â¦!Ð¬|ºÊ3"÷‰ú“ ›™KÓaUV¤)­£žXd™þŠÉt4§®‘¼Îâ’Î*s6™^¤L\%c3a*WvÄùõS¹t·³m°äELÓ \	žÎ³»áýY®ñb[~Ý'úø™²^G7lŽ´é³»®š¡Õ~:£ ÇWã
Sšläx”ã€Ç‚ÌNÞ0¢jwEØA*¢’÷•„î;(¥|¤ž„ C~¢ãyIØ©ž®xl²ñ°è#uQ ¡àYäšKÞé9KÖÇÎknëq£#ª'‡<IéC±5.Ç¯²µŸ„vùé¸±‘ƒ^¶ÚÀ×‰ý0¹]XL<–t]¾…aû³§ðÏÃK›Ï|%åÑÄ}¹ªâU†.¶«p¦1¬‰øÓ™Šj‰oü˜!“ùù4Ó$~kVrP™«k9ÉØÁHÊ§”JÝŽcV˜2o-Hzƒé(A,SrÑ4éŸdD›°ßy ç\¤D¢:c%>†±s°èÊAY´~fzñ†/Š7²OÛªÐK`Reõ²eZ¿‚¥Õ{$U¶)ˆÔT¬?Ë«ðX¤XÌ«z•GrÀ¡–ç—½ðƒbfòy>·fø¥²öDCÛÚ9¸Âu‹•ÂüûøÛžÜ<¯é3€÷³þYOKôdü5))IIMRîÝ¯Sˆ¢á˜§ä@>Vb42M¸‘…¸dœAÍãC£¾ç€I£Û;8á8ˆ¹éÅo¸’gyJÆ-˜vè©…, ‰’” ·*ùñ\\ w1Ã<kÎÔQa™m?Ç`[ô O#¸ÇÍvˆYÎb-!H«V° îÃ9¬­˜‡Ô²Ü¡æ«x‹D?ÉóEšzvA`·ÉÞÉÅÌb,XL,&æ¦dbB]×Ùc±i6„fa²Zâ° EÛÞ6´mÍ¸oê8r§ª<»œ¶xÔDÙq¥~ŽÅÆ°X.1šõçíñxê‘!ÊáîaÕÕÊ6qfX¹ª< 
ôÂ­ÃÿÈÙKÊ$?Ni9`ÍÙ°—ñòK¤jTù,§ªp<}ÕÕ1^Âf?'ÀÛ¥Æ±ðRrR¨Ãþëÿü¿å—/ÐÉïD¦·ô†GÒ	÷ý÷ÿušËON§†×ø£Pê^’Gª¹B	Õ`ª÷“Rªé-ýQ(õ–\úæ¨ì=ÿ<øXŽä³PjÉ{)(õÞv¹¸ËYÇU‹³+²òP)Ó,åSNw?”5øœÝàÝ á•Kâ·2d»*V²]zB QBLÑt‚A"û9¾¥/l²¯·ü¨ï¼p¶—XÄì°‡ÌàJLDÆ=‚â,Råô®àõ´1Àhå“Bw—§òjg6Cçgamf3£j=Ïv¡~‰z9ÛexYh»d›(¬‰Z‘‰RØ„+¯»œMÖõ/Î©NUÆ3[¿XŒ¢TŽ{ýe}Ùi,7•Õæ÷iÅ>¹†¥±¯¶Çlm'´/¨/ƒq¨çLÞåÈ8Ãx=ÀÇEB~ÚûOPîdä/AÎþõrä†µn0b2ÂÂ†cÈ6Ì—)#iÌâŸðY53UßBÍBè›>ó?²]ÿ[Sb½=¾åp“¼cs+4[]ŽyÍcc$:jE^0>î× ·öÐáC[rŠ´f º`Ê[†¢ÏgÔê®Ÿ¾—Qù¶7Õ¢ò§ï«Þé…w£‡êëpñÜÛ×.2PƒÓkoÓvyËÛÖ.».\<ò>˜) Þé®7&é[ßy{é[;Þé—=ô~K_ü»7 é«çÄ;¶\/°\žoËrùWï ýf¿x¯Ó	ñÚ$}ù#ñöá¤"'Þ'žoyêˆxSËX`!}ù†x±åò&ÁŠËjÑtkí‹;Ø	§´ÐL¿,¸hƒùˆñÂC»â³h+.ÜW×èÏ;ðK–C:¸¨ÌÂËÊÖ¦”¿h*H?Æª3Rƒ!Iù³«ýx½U.Ç•«Øs'±ÿÁŸöñ‡ap‰„Û­ƒŽ4!¸Ö¤’²³—7ëÐ8«Õ52Œovð)^ÈÊ{½ÏŸ]w­`hÌ5ä·ÃÈðbÞ§¸ð‰÷ìaa¸þ«_éÇð˜ºO*Ÿb®Šh]ßk²þªr7èµ^c[v¯V«Á=?ö1§Zõ¦táîÙoq< L„aVÜþË¹ 1H5Wô|ã$U…ã3µØûòÁª<É—"áA”Q‚xŒþÀtWñ£Ûq—~‡·w¸€0Ù„Ž‚U\¤>s.£Hž;?_Éø¹m’ßÖäºú4Q`äÃPU¨Û®]†pÀT:@ÁNœpc[·ºÖŽM¦†ÂãÝ`mXàìË¸o²ø˜_™ßõa1ðÑöµB„/\ªÞÀ¿ ctèmŠý]~uOó°˜ÜðÆ,ŸØV¼ÎÈL·Ê½·•´¿bû—€ÝËÌUxPB¥~\Å†52šÄ·Õ;˜ZW0³Dã§)žÆCa 1çâŠ	žÅÅøá^.Âé{º›üo‡ðUˆ__ƒ‡P¾îìø@¦käidw7øXÉÞûü9þ`}Ì"à	XÉ4êÃVÁz4ˆ+Uº²ÊÐ¨„ubÌ¶ÞÌf{#8_kþpXÁÝÀfzv<¥Ž>ô­Ý:ìUzÎ³;xYä{NDRbÔÎÄ2íìË<™" œº#ayûò‘îŒE(=ñNÂ†uAcÀì¼áíFÜû{ïðÕ!\Â÷!rpoüÑGÄOŽ¥âpvvPÀÀb}àWã)Uw›N˜¥4±3ˆ$Ã€B

5Q6€qƒ%žPî:çRìþ…h ~†Ó]ct¿nSrÿHeÝkbìÇAdÜ,‰s`¾EdY ¤[„OY‹@ïÄUˆàC’š—‰©%aO ÙÔj¯îï|	poQò—"$ü£Û£·a3›¢°'E]ù›•ÓÕi‰rí·
žÀëœ–œ²Ù´äOQ/SReR¿a+‹|ŒhÝø!DC Fa¯– Ê7a7[H5 ¿­”™”!×a\v›?n{@Õ*ö!;Ÿ–~L,[}®B7û:}~þæãíá%˜£e!”÷{‚mŸŒ–¿óÙZÛÖÂ î§n"Yøº¸”D®FÕ3+U'MÆÀFÆ|‰)øâ	„$ª©ÒÚ=Sä×çDé–¡&J€ŽòlÊ¨À—ìR;ùÄÎ÷D™IGøÅµ¢õuà›¦ú#ÅÜ<PnÞ„›Bõ=8SãŠ–t [7ÈÐl½ñ8¹1€‰úx¦£Òû¶•	S»æ`¹.Í¨r®¿&‰u…¼àîDTÛÂõ(ä‚÷´Â‚@qª1pdþ/£¦î_´6à'`mÈ-Øz£é1
A]û±rE˜ëX‘JòC¸W¾5S@ÊÊßÎçr®_„¿Ïd•¦1­QHÑI>>{vÓ$æ}zÁuïzmè+—Î8NIB1x×!Ý°ãqyšm‘ÊvXúö¢œ˜Ã¡b_Ð3‚íâ{VÄ‰ÛwgãialÇÌÊKFAEi)·b’à["JºR‡CøU%yŒ¼4Êqd0p¬G?^ïÇr ¸„)R°Ê	X‹ƒ7Á5	·|Š7Ì‡ÃŽxŸ¸Þ€6 Ï'ï §.{”9z˜°¡æ9Îj*Hž]AØlÇµK˜ö-Ý«xy<·¸Õ	ORLPñÄ{þGý¾Ú:}ïý¢jyvš")\ƒcFgÉ1¿Áéðòz$àÛ·Œƒ’¤Ý„ÄW™ÄµK6¬ù"¯IµÊí76>€OäY—ëø,¡ÎÆP³ïƒ˜U(ÖBqYm9@.WTAmy6ÊŠŸ@ ¼Bå§_£H<ü'â~¶1·-^Ž¿ÓEXtâ€ÈO^î"œ0‚³”‡+ìÆ^ƒäcW*yˆ•<ƒë¬³q¤>ýÚ:ÿ/µ8pÀÁÄ.ÏBñ×X8až_Ék#ñnß·1E²RüÓ1âûsx!‹‹ã€á¯Ó8…¸ƒãoÒñ3Y¯¯‚Ð¾¦'éAˆÿñŸW!;)ÞK¹I	ô7éø`dÁ1ž?Ç„ãÎ1êËø›êËÐ‰ŽŸiI´õæ´ãã„ÐsŠ¾`°<¯ž©~8Ëv­¢oÿ™àšùy+UQ—xàYoZøËãÿÒæ¢<AÝBoã{É8¡-W•ðÑð”Ö˜/Ë;Dïn9îs³ƒcD>.:Öœ¼#xCÿ’´°9üø[M¼H
ÿ¢A2âkê@ÌRÚ×2NËí¨ÂÚÎ^ÙV2?¼áÔ³‡Â›ù0‰{¶ð!¶á„R£»Þ§Ï»êp÷¦ÂOõ³Åó~Áo=w8ˆb7yé›LwºT«þšv¤fÝ‰:6®L£˜‰ksÞe:éaÔe¢N˜¥¯Ze¦ÝâŠ»SQù[³1\ïŒþìwöûû3ä‹š>ørÒJ³mráO‡0¤77w]½û µöÌ+ßx­köVw¼U®·ðŒgA&Å/†–»ï%xøãÞ{Ï=
Þò¼š¼ØËú‹œÓ©zûÚƒûŒ"°.¼ÊƒÏ%A
áF2‹
eîº–.¡†ºç*Ñ=íæç£«ü8–í=«¢°àÓŠw'Cù?Á3ø‹'ó,-$ª%X~ªÞym#Ê¬èÑH)°¦Ù2Âòy=)I½à9
©òzD-Ÿ´W—yú©l$%1S:=v@Ã)EhF–‰ƒÅË´Báxz›»õÏx&Lk{¾v¢
ÏÁµL/b
%ê†ƒê%åÃÔš+Î²ÏEÕ,JR3:)Ln€0Fðuà‹X³ï³ˆ„½lv¤žÀb6¾2­vsS‹þÄÜf–ñKB¼Áx2…ã	}¶—Šo'ü}.ÿ&‰€Jÿm”ý1&zÆÝ½êÁcº¤DÇ1R»¬9›úcg›8o|g+œ~ÒæjÖ¶fåsÙVÃ¡­ŠZ¨ÇàVK>$0/uþ…^E‚ÙêÁ4¦ç°6:ÕóÇž·‰;_™_RaæzXe´CŸ„6GQU•YX˜²Ìˆ‘_|T‹Ž6ÓíADO$I’õxIæ“Bc­Æðå²I•t®‡ØÎAÿl)·…Š§ºOYET<¹ù3¸TÓïÌÒÊÜ¸PLãUðœf˜¡R‹ÉÿJÞêE³îÈù‹ú{PXÁ¨Òîóç¹-á&”d<âEÂ›]k²ªè8MˆaÔrœíÏÈÈØ=ÿƒœÿÖ”áGâ_ì×0Ùxô¥ä†[Ñ˜.C6V·Š³Mù×>K¸U¢@"¸<kîâª–»x^S4ìÏŸ+çìôB;++«ÓlèMs97m¸»¬ˆ©rp=&aÕmñ‘‘ãÜ†´â³S×#†È9K¶ÛªV"ƒ¸PDªBq¿ŒPÔàŸôô~C8~¯	Gq(g½öZnV—é0àti	‘"J‰I13?,šÞI¦ƒ¾·IÌ'˜HR‡ÎÿâOGA˜5I¶m\Eýò'Fi„7/Ž LZ%o1R…Þ €=g<HËï)Uûu„äº œwÌ[m©êEb²œ”¤~/È’ñhæ¤­ðLéÈµ©ð×1xN›ç¦ÀŸ‡'íªsÝòñ¦±‘ÓXóÕ›6"ßŽ‚èBþÚ;:êüÔ9:ÞÛ|Ó©£tÎ$Ò^›ÅåöK\(Ð8+¯|=‘ÆŸŸ'Ót.WeÛù"Í:5á¶òÕ„Û`Óÿ›…Þ!ÍÊäîo‚Ë¯/÷(_s©d& ~U™Åþ\BkïÏ!´XšC¹U•Y› ³ŒŽM®þcjAWÍ„ÄDiŸÕdV€y‘›¿AÓü˜f”«>ôÁ©	ÍÄ9#4MŒµR%‘(ŸíÈ
Ý•ù"×ïðøÞÄé
ÎL™oTRÎ‚úbV]Fýp0¾ZH£¾¼æBÛ”òÀª•9²ñ_ÚÔ„p'ƒË1Kµ(ðÀ–7 ÅÙ¨R6 f´»èvp=—–„`wuÛIª	sû	ï[CáFðÍ*ÊG!ògqE—?$+…Íu ï‹ØÄ²@xZ)…ðTŠÑÕ@€ZYl¤›à1
QRh¬ÃHjØòòü2g¸úôÜ(Ü@
Û2ÍBƒÛWyjCÿXëöý°W(Ôü;…‰éV?ÆÌ¬oÝ\yázÁF[Éq2Oc3šòW1§˜ÅF2§ˆÛ†çMÐí“¯”¥÷¦x Â4ÕµJ?ÎCàFT§Ú2XÔ‹Ì¢2)Dð‚"îl¶X­—@)Úd¹¦xÈŒý©â]ÕàÌç©„XŽeVbù½¦ýF2(­Püø.
f,¤PÅ†Ý”y“×JÞ$UÖø¸›ñüüfîØk2³†þm±”1í°a\‘½ÍÃ%qVÀÄüÛ¾¨J•£#rÃ0Û+”SçŽ¥ôá[²o´°)¬€ò˜fFÁÈ¡zHÔþ`‚Õ Áû=2ÂôÜƒáøôäaÉ?1Sòiy EÉìÄ4oE§:."Óæ.0ø"Ì&0P(…	ðI1þˆ„b	q}	y‚KÎÏEO¸§¹›ŸÈéuü~n}}®Q˜QQ´EùmâlIHm´ÖÓón—0baòÏEèá‹¶æÂûjõÞÍ,Ó:rÉdž4˜eú\Íð*¯ÅYì¸ý ÍìVŒ‡ Šû8d¯¿ÏQ«¬³»ÆL•c6’S™Êm)ŸœgwÀS*¬pnwÄLµM•YÊÛÓM™d:qmÍõ,ß§76ÜÈm¹n„6¤ŽE#>pÞçM(”(¹‡Ê5ö¤ƒ0AzµwGÊl“`Ñå¡ÝX•ðž ‘Kv§jr4‹:òæ£˜Ð*D`n“K=¢'¤1÷:;eé=·*Vzó	Ïœ¦Ž#œê'<=DƒË‡c„Il
m¨.—l\¼É”™3¬|FƒÝdU_¬šù:â;9_ÕMi§Á~%,3LÞ&ƒ7WQ%5_„ê'Óadë–WÌæY’Uré²Â¥*¼5+V*·´uß[J>ui[ÇõàˆëNÞd2ï_ÿý?Î>Àá 5i+5W$„Tüg(…Yã­††ÇTFŸ¶rDjËR·ÎóA‹ÌÓXÚƒQù¾{ üS²›ž@üñÑ"ý„v
âo`ƒ?œø/üDòoÈ¿b]kƒ‚pãìÙ]À·êY+Ñr8W>]¿rÉ$iiš †=D˜–1³È/ÁfO&¾”,¯\éÅIÛ*Ì­1œÉ¾P†g•pöÔ¶/)à“3ÜFeÜýýCãHÌj¯&ÙcØ€J¿¯L5µPoL9ª‡’±ªHÏìÇä¨–ü.ÛŸAãÇd‰Ë$Ú{5`^(3v§!Øî¼<Æ,ƒŸ)6€+ÀßXÇT2Sôø©1@þïÍ È(Eþ\géËºÞxÆ&s‘ØZ€déf(¸«ËèÀÕ!"•à‰i¸+'@ÙS5;f²Z/$ÑÉeÁ|ý
Aš»lÏË,È÷Ð Ê’A2KÑ¥”aÛÛ$»«„Ëyg;A¸*é¦M&ä$x•¦P´>™5';€o(H$>žAbDÎ¡?¦¡àA•v*ÒméJ’8¯m!=ª˜N¡REö’¥2$;¸Â2_{½]‚r3g«h{>Ù±×¡?É0²|hûdaòg–—Œ®kÝb,JD¦À6¤4ßKÏî>ÒúBñ.JSDeÏ%—šj¯DÜ<Âý¸@ÀrÅ
£fMëyäª§øîúQÄ5KieBr°DpÙJ°¾êbg.MùC, {J~›Ð3¤)Á¾ð"ÖS‹¥WáÔE¼¦6Í¶9¡Ù6`ðô‰Åà)ZÞï±8êûÐ%R\kÊ©WÅ"‰k_a•Ò«dÙ*ô0ÅÇÙ%þ0î—Ý+½)ü®ëDÉ?Àª¨/´¡¶¸U%¹&–D¶ÉýÒòqŸ”Y‘muÅÕR¨Íñ”+3êÏ5Êešnò¤ªqMMÓTö“ O™jÈâõWƒXÅMÑ¿ÈÃJ	Ãõ¡ÄÀûç”|þ<×g ê(41ª“úMb£	Œõ*ƒe9œýWxýï³ÿê:^?OO«ðg, Éc!ŸdTD"¥>—áØç´£Ð÷Q&a·cÐÏ¡Ø­ÃäOÙYìä'|3—LgHœB{ÈÚú©Vß\†žõâ w*"é¸Z*Åt)·ƒmà”`û³œyláb5-@~œ¸ïÇÎ5	‰D>EøÒ€ö{r°‰òtS+µ7èì•NÇ8tÜUŸ6¼íBáœ&ÙÂÄ.ÃA|K±ÒÁÊMsŸ€vÝ€éˆl¯´'ÎC»ÐhÔµ>¼|]¥¶Ûó£>¶ˆ6U^Å²M¯òŽ%TªF”†¢‹<^J;/—(V6½É.ê8ô˜z>v¶õ~¢mÁ™49¿Åì>¶˜°º"8äƒ‘?Ääú†ö0•eŒ05ñA°?Åí¸Ûƒ1vãK–íY°6)“b±jfÊPWÑæP0ê„Jzõãd5«ß•4øä‘o¤3-fK-k-ÑñEª—’,\½Lš×ä÷ÿÂÀºcá‚Ekêšlfz…X‹œÿ  ÿÿì}[wÛH’æ{ÿ
˜§FM–!š¤.–©fi(Šº´mI%Ê].kµ6D¦D´I‚€’e[çôÎØ}˜9û:çÌë>Í_ª_0?a#"/ÈÄ -»ª¦êtËE@"/‘‘qù"™r»^±Lu_›™ÌYLíVÂäh¡Æ²Üç=%K5„_ù·¶)¤íÈ×¤e*¨ÒaòvXl¥ed-@úô%#J`F­ª…š¬Dùõ¦ÙžšI< êuS}N;ÜRcŠÙŽ†´ø¨WÒHÎtDsôƒÙlä¥,Ðb|íòLA½°Lú¡-æ hËMÓ4g¸QVãi26ÝàfêÊJÌ¡«èô›‘0ºŠ"”ÉEq¸[ø—Ò²l¸"¿"ë“Ø\Vž[©ophÝãù>üƒCgòZÐ¾‡~îˆ6¬¢jaÕÊý%
>~®ý>ü½rmÍ‹lÛ*‹…«ÜAºbèud(òªE8û1‹8{ÌoÿëfñE
qú7ß| A£w8>î»7šPçö?D@[Un8á°¯(öØ² ‹3ËZÑ_O)|O2`ýÆd€†oþÛ}±˜QFÁ}³þ§‚õÿÚ9½gÖ!ù$]¾û‡.¯×`9–eU‡wÿÐçE<¼=Æô¦¯ÀÁ»¿5-þ«sðà³XøÖ–¦ø`‡–ôØqç÷ÌÁûáoŒƒÀþObá7°p9]ªÜ$æòñ›?øø/ÌÇï…/ßü†ù²–ýŸé_FÓ^ÈþF-!)Ý>…ÁJ´œrÅÖ#Ørxí—ˆKHÉñ1"ÌÈzÐ¬Ç*}z
GŒ;kñ·E£(ðÖBŸãÞ/YQ ]/ô™3.Ó`ðÛ‰ƒIñ°Ö!U,^‚÷äÂà7Ûê£d˜€²:<Ö’¯@µú®¬±7Pnut0L˜»RöJ'Œ`}»,–©°B©ÚY£Ð¤ØYK‹6wEÊîÑC¾’9]‹'6hsÜe[„qOU«Õ’<ÃÐm15c–‹q»Ü0ƒ1baf.@‘ zDDÖÞ #!Ä¹f€ÂÍ	ŽÐa¿³Ól[6¨¨ÓÜ‚µÀU¡è—^Á Öôµþ¥BWb;õÐRž‡ËøŸþ[Ãhÿiq+mñŽ®`Ê€ñ#:Þ¤jƒ6ë!ìYT\•Çµðü¾0ÚéŠM0!€ª+S5f\yq47°!£WÖŠ YSßŸr‹!UÁRXïÃ¨$¢ìËªñKKú7”ÄÞdlaÄât¾œvõÛ:[áàkˆ‚"jÿ °Otkz)‘C~nHlÚX:VRäGjYz.ôÀ¢Âjf^ž®º»x&x2ÃO‰Hf€hò2m"¯©LÖ¾åf‚`ñ8ÌãéíÕÍgG{ÚæÊÊIÔ²'5¦¬ÔÏt„2ß7Rd²ÅõJ&ÈôvÀBääw¦ôÐ8nßbJ'%âûž¶%Ï8BµrüéR”E¬8ŒN)%ˆ?õc]º¿ÆÑ›ê<ÍSÃÉÚÆèvptXçrHê©YkPÎ.¾WközÅ.¡ðáyœü™”ô/ ÉæÕ†YT“MCëø¼ [-õ °FÚÁPTL©å
L4Š„U¦ŠºÞl<v|´€….N±£„“^n•o 1ëPie^œ"Š¬$R$À°<`ŠŽ©G$àµ
š¬3º\¥¹f®Õ•„ƒÿ ê,×­`ÜŒ¾®pv[Ðâ³·e¦†êé£éw5J«ýb)”q®œÿË©œLÉç%Sæ°»ˆ†Síb .Cè5“^P‘³|"n¤ "ósGL×j¶HÞÆ¯ƒ Rs—
¦0ÝM;ì‹…fÈ¦ŠŽŠè—AÅ÷E¡²
äW¿úHI¢*KuO”àk¿nÑ2€c!¨õF^xŸ„Ñ­›”±q¬d‡V²¢YÂÒ-‹)sýAh˜Y²Óx	¡Hð¨´—ÔŽÌ³Ižm/ûì?´$$Û\R³öc®VÐ7¼ÉU¦Ô0^ØÕåÄ×Ò)…aõDùéÏF¨øñ~ÝáÈìÐ	´Q¸Ó;œZ&•"cÒa%ãØÄôû=*ªŠ:ýCæÐžo8“·Ö>ŒÙñûÃÛ"•ÂÛÜ½iÐ¸‘)Ðñrµ#’ž­šÈíVAÃšõY¹Ü)G‡Z}ƒH”<ºöãGú¬ûM&Þ²Z]–aøwo"XÚ³íðüãÇ2ÿÐ:;Ç üÈ«v#0k7¼£Â¯¾ß:¢-[…ùö]†%kU*jùŒ:v=‹<Äõ
›´kåoÙm¾âù±yÚnÀÝ©áNú#Ø°úi±E«lî\è1
_tJöX|JÞÆ”`¡å…§äI[U
Ë=©#u§pâªØ.Le¬ˆ:äó4ŠONXu(5„¹1æ–Ü±˜J•OäbYãÙ(t§#¦j£–wÁ¿ÃÉˆ7bÖª@-ÜÄ1°eqE,¹/¾aõ¨u ‚–{d6<I‚oÊ£ºÊðCÁÒÒÞ/é2øä»êìýÄÖ¯§³m=qJKmµ®`œÓ€Çéˆ,H%TæÌYZ¿ážPÖ þ”yá,· ¦Sr6ÓÆ‚ŠºÜž{V;'5&¦4Ï3OÐˆiììiÅv£ùVü°² uš2‰âQˆÊ­˜†kG¹³#ýÌØžGV»×;Ø;ìîX½nçôàèÁ8ßDGMë›Ú$)eñ¿¿|ŒWF4×Jâ˜Ÿ¤[¬Ï‰÷JÛëiXúA¸$¥ò¼¨-ã¡"It+÷~KŠ;ûõZ)ŒµM)S9AW+Ù¤µ­rÛv(¹»j;'ß-7¸+crƒ»X™ºÐä¿þà.AJ!×í8
éÚ6BºPœü‘ÆÉzÌ¬–¿fˆd‘Þô{Ép$ifïU2Cóÿ}$³œ«?$ó•ÌÏN­²{‰eŠ+_I<#™þ~ÄóÈŸp	Œ3=õ½k ülóOÃáïXGÖù0ã
Û9LJ•xVEg<Ì•·) ¿iXãµµ9¨¿+©rú ÆÓãÆhAbïxaŽ+.<q²Jž¦ïàbÚÀÉX+€¨¯··VèM	º|µ–ã­-•—´œ¦¬dGh^ üp^±K3BZøù×Ò®§Y­FéºÜÝ›¨DŠ1Ösgâ\±13Ü]ÊO‹}ö“UJí~ŸÿMBßQ =zQ„qs¬‰qG—¹‡}*2ÊÃ˜J?Fø/•-¼h|ff17‰÷xÍ,ã6Ýõó
X'üõŸµýñ}ÆÞÊdrA
öYs&Zëß\v#AÚÍ‚÷™èè=?JxµðÔÊbñ¦DÃ©VzS§ï†·Ëkº [ÿrS­z°èL¿’{·ºë;W¸!’| “Ä:è“¥'5¤ñr_dfé¼wb9¿i¹êÖÑdt+5ÃXüú¡ãrzC”~X×ŠesA!–?¾€ÌÌñ IŸ}ï¦ˆ0Hk]Jä;çˆÂÉMáÍÌÌ’‹ÀÍ0) "x¬þ¨aqeÚ·ôC\ïLKt'Ó°ìáíT°á’=…s¹¡—zÜÖ£õp-íkg4cÍ}¶p«+ÖÄä€	Ðwü+VéŽJJÊ˜øN²M»›Ž–ëuLGX•ªÍ¥×ŸM¤)Ø‘Ú3|Ò›…TÞvâMX|ûWO¨íƒòƒ‹¡kk%ŸP9Õ%˜L4ÏDÒ~¡#Î¯×âpóf9žRRÊT<Ó ²_;E ²¡½!wpƒÎ
ÿ-a<ç52âöÓŒ<:«-ÚHù?Ås‰3ê…œÍPœNÅã•dÞZâÜÿft™Ž…Òu~*§‘fF…ÆiS&Y¸Áœ	Y¼ïs+¦ù¼ê°É£Aâ=êÙwùãTò4{C‹‡è;&+:Ó Yª6ÕÔS²;ôŠ³Ùª~ŒÖó"-QfdURP=JLÌ;%”Û(ŸgÜ¸‡W€"ú…_ñìäð¿¡¤í}¼‡6ëxI†ª­B–Ó­S)¼ v/4¸|+?(½]k÷RÚBùæˆínØñF=`˜Íµ˜¦‘LkMŠ"Ó.[¤˜¢Ê'}!•¯É4)KpÙdƒ··µtÁ}dŸp¬*—÷¦	ÚŠ%AÅò…ö%øÝ0¿*W¢°¦}óB¥‚Íu)ëˆ¡7*ÖP7\¨¡jhäObÍÜ,ÒLÆqCô¶©}UPÁ|Évñ—`XÛƒ?æ
(èåûKKïÃ»J"^gqÂ’¥™Ò8xú‰8={:Q
nC§×âqòÚ‘w-f™ú®Å­&­ƒi0YµÓhˆ-dKi¤Ø9dQ²´½¸‘ÈM¦Ífíâè³Ÿ`é?:êà9ÜX¨Ñé‹&`¨ÚÄã:><ÂuØå·oÔ÷a}×©–"S(íyò´CÛ÷£ˆJ Ë¸Ñ$gC ùâ•¹W’­H_óÒ’¯î¤Ö¹ß«´é^–ÓîÖ_'n­ˆ=‚ûP0*àMgÈ§/à£tEú‚º¢m†22\ÔeE¦zR:Çš&{ìÌ÷ÿI90Ï±b‰–ÿÂ
}½€	¢›8¼^±ô·ƒîúî¸\1ùŒVµ“}W" 4®z%N”vn‰«dõ¹þÓ„Å…YŠž…]´–á›`1Cø[ŒGÄÌ6˜¼!f„Í‘œ‰úùÁk[æ×jèøí°\Ã%yò–/IS®ZÖóâÜá€„ ›ÔO‹¤Í`<ŠmÈHW^&1ôgX]HW÷Í¥‚]}ÄyLM
nâ¿³ páÛäÊ¹ðþùŠÏ•7†MÍøMrnÚ*íóÓ”ÌPM£õw;Â'ûøQ+ÓŒ½Y5_‡¡aã€¡42²ÀðìªåÉÁ?1øLjºhŠ•·ÎÃx¦n3À'xåÆ?%kgTôísÓ€˜{ÀÊ¨ .\‚5À£ôŒ#³ÑRÒÚ£h´AXÏ¼Á&){>Å…l'«4i™òš¨ˆ„B‘õOÚ Cš<…à Ä¬>/Û…€ïbÕ+“”Shª9mmT×u±´ÒÁ¦ÆŸ}€j£¼ñüÛ&®ÄvÙ,ÙwB6·êÏ6ßy°fšëFB^©KN¥ï¦8ŒãýûÿùVIV¾ˆp³Šcþ*—O`­‹†8'´¯#UÍ=‰…vé·Žü­7Vù›G²vù›f)™r¯K›®(%VchÖõ_ÿo´®0®ùÀðq¨´ÌØˆ,]$T%·ázËðÔÆ¬•Ù4ïªúŒlóåÒk„)Uîm8i¡`QàJv.¯ÙGòó?þ­ô‹v,ÑEK$üŒþÍ9åÆÙB¦Q[‡äùdú@÷•‚šjà¿°A¼RªÉeñ`ÒL}Þg§Ô%£qÌtÞÔ«}êÑ‰q»zâ°ÒPqWŒŠsÃ–
øãá6é&Žžtpœ«d¢eáð C‚$¦è¾ˆÙÀ~„	¶7;º»’°Zhë)Qè €ÉcOº†˜…+µyJ\ÛJGÑT¡á¨»“Ã‰De<FÌ ¤ÚûÝ	õ§”a@‘Ût0Ø)'ÎH%3 C‘`ê`4ÏŸN$Oó»,áºˆ>‡Ö£Ä~9ÐKÏÏaüœ“ßïìE(Ôg¼—Úë(8`U…ŠI©Y„!ÅÜ]Â©’¿‡å
™¦Û±=aë	[gÜA³„>À,Ù¨¾ ÓÃKzê‚Ï‰ÎüØÐ2ìú¾;Åw5žœÂ(i„…ÝŠAšúîµ;bWÉŠ§¡.˜¥—~ˆ“lÑ¿|YÄ‘àIn™v4—.ëHo‰¥»fˆÖÒlÉìÓÎ³v¯g•;˜àìŒiJÂ8·©+žÖh6„;ˆÏVÅê"[„‚q{~èŒª–ãÂ²A¡ïR¢ãR¦§^ÜZ¸>ËÛN@(tgG|•O¶Û
v‰M‚™Ï,að£pú¼¤+fRZrÑ«©Ö\Ãs£ä\V~3îŒ5sœs#
‡«)KÁ[{’Œ
ò‚à.2­)(õb(HÉÒp=kLÏ¦yÅðn¦™’	Òg%ãhHóf#,«ëÃ>äà¶¸NHA¥$˜BÌ…H¾½-bÞÍ
`ªd•EŠXP±.Ø%‚«ÑhDm’Àê;¸ ›#UKÞN–qèÔÄÈ²Ve‡Àbnˆ…¾ÚÜDKÉÚ²œœj$I\ñ¼m˜[DS,Ø³ª ~+6;ØÁ>ð„oõô"À¡ÜùtþÜA-ë4É' zM8gèA·ïøobtÕ8Äà|”¶ñ@Cik,ŽÒ–(Qe4-„ªtƒYèÃ8[ÜzŸ÷™á>Jsy×)q¶°É×róy¢8Úq–GpH"C’žæyÆ1#«‰ôsyÉ|$‘7Ñ·sZ,FX&”rdæÍißz3~›A¬¶¥÷ÎFºýCtFäÍ+k;gŠ¯ãþ$`_c„‚×ð«T‘s>ú|º8qï—.¤@åròsÈ¡íÅm ñµëXB>2„$wËÞ$°ùrïÈ2<íú˜‰B$pKlŒž!ÖÃ¯bÄ¦Ât’5é+µÃÑ¸0ÃH@¦G.GÔålRÕÃZ_C¥¨E\Ošëªš}hªjr0 9]‚f UïZõÇ\?E-õ’ùŸ«­S·2Ô+>&Z˜‘{	²à¶õ/•J#E°Ú`².z$t|†ª¡;v…w}5Îk1 J|IñÂãvÌØ²Ÿ‘Z±"0=ŠìnÓãžËüçíìlf*Ôâ›:m?w£JóAŒÇóôõ+zÃ[D>þÚÌ@æß"ûžQÕÒÀ¶g£·ÖÁA]KÖ%ƒã»Ï„¶tø9*k°Ñm‚ 5
ä&²€“ (˜ƒ)#@\N nm5âŒ	6Ã¹ïÖŸ¦M‹£‰ÙÖŽïÒ;°Žf¡­ö¤ŸöÃÈ¡ŒÇ=$Ò±ï½º7s%Íï”Šß¿»7*–+aí:}w„‚K1=tÞ‰b.M'
:–³Ñ-·&à‹ã,tT¥°Gäx{N1ñC¢<PÚ;™áœ Ú/@ÞWpWPPiÿT5}äyèÆ”Y5 ¡c³¸±|Žå†3ŽñDØM„·ÜÔ¹r'rY¯0“¨F"•|CÈ:J/_°¡síz¾’µš˜^²¶ÕUMÜØ¡¦¸ÝE3z7	Û†µ¢`rÇ“;÷Ñ	yõö½TÂš /\*,š†ÏãóghXpD¶¨^ËÐ§qqhÿñ¦8ª|¹{Ÿ§©õûÒ›ƒÕÔ,D2T*¾V»ži’à´‘[iŽ@LÄ–$—Ò¹ q:>¬lUQ]gF‡rn F@ÊÏ1$ÖÂ(Ün{¿p¥uèÜs_f¡‡°ì}”¦6¿Áú>¶@âü·‹ELŸµ:m>y ÁE±d\ âz——nÕˆˆ!F.LøS& ½ÀbŽF.±ïŸf®O–JxœW.ÑU¼‘?Dìî‹­nWØ©ËèìKOüüJë´³k®S&kýœ%;¢R±9ßáf-MT­Z;lÚXTÌào˜F¸dt7\1µE|P1…Ä¥ŽD[vmv*”üyYHþHZÅNš† RÇò¾0áqË¤­™®ÇØóy$|oÈXøËJ)2â<N@è3šÄ+è±®þl©èô ~E€”rfŒ½q§Âµì*që5Ó‡8†Í<eŠ†ë¹{G´%6á\¯Fp~KÖý½‹™ÐÖc&4véNø‰mñ°êx@¿áÓôÿà»È°¬<Øf¶¬ôDìëÔ	ÞRåÆ©g[°W%:g1ûXf1Í‘eëæY6–6ÑªÅ:dU—›mQußPï9D*ç$°¸.›p×±P«Ü]$4¯ é?ØÔ­WBQC¡àŒ–±r?&Œg¡¶!´rA~$ø &_.hÕ:ùaUâÒ„ý%_X>ˆ@Ô^‘§ìç zQPvqùùq¯"zG¥äùS‡5å¸¸å‡í¾úÌ­%YžBÊíÁ5P©×Ûpuˆ¼ž¾u¼ÉÏAøy‡+¥ô¹kŠ…Å*¦E ©qìŒ¸:{Éè£<Íw¤“¦
ÑÜYF³8Q®TMVý9OVbC­ÀòÑ®(±u3DŒ	‰›‹ó-Ù­p¬H6äNàœçX¸ ðÀ•è_€ý£Æ€¿ ±ûLyl¦¾;ÑÔÓ"ÊÏ}ËW3—&Qq\²öøïšÜÛfÊ=îGÅÞÙhÊ½E|CáÓŸ‰L·Ä‘‰†!i1ê)v¬>‰ÿ‘uŸœâ³ž0|¨IX­eG—ab©¾Ú´z‘"yk‘}Á˜H)±´E>Ñ;^†ò x'Š£'wÿx‚eÀ9)%«- SuF7tjáË®ŸKßs¥ îŸü‘U5Ç H¤.¦¤¥Ù³.±;r©²Y¡6ºŒ°ª5×þˆDÌR”,h®!ÇÒÊäÒw ^2ò©ÐI8¸Ì6é»}t”bÁ*êò„ÝÀfõ¬>KQËcE5µ3RÕx|Äî¥êºãxy\Z1š8â§,lÕÚeŒëÌ¢\,êq“	ñëª&‹Òƒ(u½ -~³´KÎx4Œ!‰\úŒ=0íÐÙ9ç"_}žÙ´Á9?OÉ_8]2gLE/–zžÈÆÊdMV`¥TÒ?fæTáLóÏn‡‹x½‚D¡Ç½*žSÂsR“¹ËD>HXÒ—‹d-Ÿ} ½8& *xÃØÅ lÜ”ìKüü/ÿ¹öäI	v>Ýø\lÔÔkÖÏÿøW«±ÝY·ëÚ½Ï^„nm¬Ó­ôjyoÃ^5Ú½rD«uèsq‰êÞUû	Þ{Î³Gv¿’˜Hˆû48@µlé£*ŒAG£ÌŠ‡G'8Ï¨:Aã²$mK	·M¸8*	2+£÷0Í˜×¯TbT•X•‚“TZp»˜Œ­Ãò¤c±ò$B¸/afÉ«(™ÐMÓô©—•åuV«6ØØLÌjpÖ@Ð<„ëV/dSm“Wæk"BáHy³P=”o…€râ!Bî2‹‹S6G‰gp¨Ôã±!a0>Ï³•vPsŒÈ3RÈ­À"¤k‘ì²R²UÆð„½Ž)ÌÏ‘Ý¥g©žÆ² wkÄG0÷4=§ÜwÃÒmƒT”&tà{SLöQ÷Ê
’F"Nš7é˜S¹ÅÔæ'J¹Q”>ÿÇbögx`Z°”ZŽêZ{R[«¯5Ö7sëúª8ìÈÆš„‰ýìœI½GÒVLD¡%«kVB8þ°WÒL(¯ˆÒß¦C«;ÌT6¥žô.@Ãæªj`Su/P‚é€½DAOðv˜ùÆ7£Ò8— û_ßÃ5¯Œ´µ|ûm4+KÖQ4:aÞ^Ðo¿•°³ä¹GWÉ@¯7?fý¡|ˆÈIå³…•üiæÀ¹6äÐgÒÕHÅémånÅKÑlZ”‰zcšgd¢0íÔÁ¸6è-ôœz@GQ)½H`ïÚ£Õl›Åši³ø­ÄùF¤Ë}»0W¨ï‰%|ÊeÞ–¥¡ž/[X™ç˜û›e­ŽhJ:éÇ š­8ô¢	Š½Ãc€„è£îºT£ [nÉ&zÐ‰f¬`ÊúX„ÇâµÆ:lËéD4¨mT­Ì1Ð²3ÐÊ.!EyŽ$ujÛžÂ`yÍ4hE£hF3–`úçˆ¨•WSÄxªåX¥d~°þ„²È¿ó€[EÞ÷XY¯"¤¨Îìæy
’ˆ9ìÛ•»æšäZmÐQ&o#úU†Â²GG<m‚ïÁ½+²ñƒŠ j"aAÕ°ñDE/¹	H¥ryŒU_KÊÆ‰‘²š~?!¹*Úàž(§Qµdik*¡ªDÔ}ÒO{:ÑIâMˆ¼‘Ã¹‘& åº—Yõªj«¢ôg<îÚ¢’‚ *K% uy01ôêN®,§ƒ§¸Aôì1sD>Ú‚g¨÷Œ1ä/„3Ä—$ž9Îõy¤”š½úùDôýè~‰h¥Šþ ¡)îHM±šâò3Rï‘–¶Yß™‘Ö+‰z—Õw|ÿVH/™³†SH+¨€HbáŠ,ÆÌˆ°"C£gBß½ºâ¢ÚrV¯á37É›î¹è{Ìñ"¡9õ‰’AÚp-n„a yÄpEÉØtÐBÏâÄÂÎí3fûç­Ý*Œq¬b½wP±'-­Vê¨5a7VÇ)€wH«;P*¼ï¸aÉžMÜ°Yû".|vVqú­Q•zÜ¹:u®X-´W,üÁ„ÃrÅngÝ°OŽE¸cÖjÔìËVyömcfÓz×Z­‰ÔÄ‹Ö>ôñÝÃýïÚË¥¥ò¨êÇÐ<ø®ÕØ°Ë8ØòÁŒª êìº£QíQåš]¯¯ØÆãŠ=ª"³(ÏìzÃ¾´«vi·„¿âý@—@­ltÍ0p	Ñ«Ð"¬]Å.—W×ÄO§@]üõ•U›ÿ=ÁkHvå7mœ¶ŸY?ÿãß¬Þ½Óîsëè¸{ÒÆZ,=4è¿Ø98µöÛ‡;ÛGGOa~íºxoä¤û¬Ûîu­¿5ª5Ät_æ7Ø@n]ÁÊpæèÑŽïÜð5V6ÿ{,®=²à‹Q]ÁŸLpž@kÔ,|€¼ÑÉa__4X+~P>ºÄ‰Ê•M 2®Ô„µ›ö—Ö>üûða…^H«3aŸÞµör}ƒº†2ITèùôeZ05Swßt¢ƒÝ±ï…ðd\BèoC½àÎƒõÍ‡	»ÃýûÍ‡}Dà£j$Öñn3F»µ5[ü)ê­Ù5»o·uÚÍ¥õµ†]‡U^YI}¢±
­Ó†‹þèjÍ^«Ùëô<þÝËv1úÈW!±7`®ÀWW«ÅÞ¸²‘xaã‰ÿ_©Ç6'¾cÍ^Ïn?ƒ¶êë_†´x×o½‘2ÅÉ§qŸÎÑóãgíÃNWgAÐ‡ÚbÛvUÛ¶ODÞOžÖ'i[¶ŽÄ‚k!:À”Øvt×©G–Ú±¬Po*d3ˆNÄq´(@óàƒÅVŒž¡ Š^A.Öü4‘È]õg“‰ŒX^dg“äVwÔ)
Sª†Í‰] éLoqõÞ,°.0Á$
×¿Gafç‰¹ZÄ'ã‘17tr!„	¡p4™‡²#,Xq[Ãò[aîà*ƒ}YÙäÒAITkÈ9ßiÕ¯%XSãØñº¶j¯Ø+‹óŒB½sÔyñ¼{xŠ¥Í^œœþht÷z§'?"oØ;7’D…þ$k²‡¯×‘—ùG9'­³#ç‚àüñâtÿè„* 4K%$ë¯UL»C4Û:îTÑ'nïÂkŸìˆ"SDµ26'’+ÚóëžìthóŠ6²Sþ‰x5MYµ¢ŠîI/jµ«œ¤aÿ¬î;$@6¨”îÎ7c«U±Oª@•]Ø"åò¾"_)/Z0wNØ·›( ŸŸîWi´¸/
QTùìcYäu5h‹ô§¤BiŸ}ñ:œgžu‘g*jëîtºD‚£ÃS¸$
œ%Ø‡Óa #Õ/€Åb5¼Eøo\xp.Æ#Ø(f{3ó€Ð‰÷@Qèc¸µfS˜ÍæOÂéî'¦CŽ¨«‘w±#1uG˜L"¶D „ô(¸¿ã8JqGÏƒ]úùÿ‘š6Ô´¶}ÏÄ‚AøyÎ%ÁÑ ÃCxR‚Lèñ!xL¡SÅ¦â3$	d0#Å«‘!4jA˜Í)JÒgˆ#¹£µãÁÀ&^ˆqöîtF°"â¡+ˆ)b/…mSÄXµäðh¬ÏÃ¼Šˆ#!…3>£ j9Ì€»©)æ‘L¬Ø "Q+:al‘ŒÍä½æ †[ º`Š²¦u€¥N–	ED>ñŽ¦ƒoæí£™N×!	G40‡±KC‡nDïò¥³²èK‡i”z
8"Þ?++Äoôi¾ —áõU‘ÏÑs”ÇÅ;$UtaIBoÂp‹2 à¦ÞnCfJØ"4JÎ8MÀ@áË—éþ,Œ÷´%khT­Þé‹äRþ —8>9Ú=xÖµžìv;?vžucœAÕoE™é_y ç1þsšyJsTÁ³¤ƒX%çyè)î°¦e¶…-ÍLœàˆÁD™µÍÈ“€	{ 1?ÌNŠEUÃ…Þ‘Â"wåÆ+gW0Åäx½éRÎ,L°ÑæYïÂfGU…U…[¤ÌÊÛˆ6"UI¥UröÑ´TÞ£ÌH’ùDºÒ­‚HÀâV²Ô E…R0¢”Ùe¼EÏuÇßÜ	åàŠP3èâÔ¹¢œw…SWc3¬¥26«&›ÏÅ­éâ'7 g4Ê²£Ñ5u†;G’bDJ	ßxsLÎÒ)r¥jµOO» l bßÛïvO¹©áôèyûkÁvöŽžY ¾ž[«[¡#Ïú€+†O}aR‰–^8˜ªYŸn¸Bñž:À! ½ø0-¤Ã(ÃiŸgŒY½·î4hš)fÒ ë›édV€÷ªÄ3;Ê‹R|^æ¡ñ­Yg/`ÁÞ*²j«ÀuT¸D(<ôbøÍò%IµðV‹§¬W»‚Óˆ:¾L@ý·'øÓ~t™¹ovÅW4DÅŠbÖ¯P£òùÎçs8õ„\Q»‰k‰È¬Ð±•H¬ÓV}$ÔÁÞ›Ú‡ÝÎÎ~Z²O»'îÊžõüèðàôèäàpÏzv´—¦­¨ðf^lAA^¤œ"„Ó”S„ocL7/‡„„Ài;æœ$*¡‡´,PâÜ’0Ž”KðÐñ…ðé ÌÜæXùÞtº+œ´Žïª\ez;™N5)²)ë-»5=ÜÑÄ+t)Sä@2Âí:‘½tŒ	i$Ž6=ÆÁC‡_‡¨ÒçÉº_²% X‡w[¸`’œ·ÎÍÝÊ‰?fLh,ÂmÛ÷„Z€š¤pc {B„ÉÇâÔ"Àudk@•ˆóLgÀÔUÆ4-¨ÎzÑHb‰ÇIZÍI;ås{ˆ¼3‘,Õ¬ä¨»†m\ÒÙ|£8èv~ªèÖÐòÝà­)˜×àÁý.¨æ']«ÝiïtŸt¬½ø€vPß÷ãbùh&ê¤-
õGd’<)\TÖts(Šê"W˜IÌyñÄIá§F§HeÈ÷d: 	çFK¤’Ù}˜dœ”¹Ei‹qŽÀßr¬ÑÚN”c¼HjßPÕ8BŸ @‰AI¼–“±$-¹†H‹€Èxù„
M3$Q¯f\»'
æ	¡;NÉ1t84Öu¯ëN÷Øe=«÷âà´‹ò!kz»øÏj\´iæ[-.GXUü(M¼\Y:ÿÀ¾ñüeWQA‘¦ijú”\¯ñÎT4-eì€ìBU•Mä~âHH‹i+åE²"Œ*³©é¯ÙÀ·lÀK:²ëµýü x*¿ «n'ÎXÈÎ™Èf!…ßÀÉ·&ªó.·$Ÿ›Ì îGåñBºcŒe7%Ž8Ô£UìÑ*ôhO%‰I½[¤}q†ªœó‘ºú*›|ºÿXæW©å\¥ºÓ=ìu­çíÃö?€/IïÊñÉAä[Šh©Le““</Ð$¨g7»¬jñ< Ý ³âŒŒÌ µúçS6­SÜOT 1ÞÌÃ½£4ñû–ÝÀƒµø“þx–ÂÀå£u|”žÏR8xÊ{¯œè­uTñÇ{˜âÃ‡£DÊŸH»–sI…fc—+ÙfÜ*#ª Ucø°þ{›Ÿ~›–?YÁµ?Wæ%ô^”ëÒ7a­wXàfËä„Ù—6pˆü¯¨žià3›2ëµ"¦("m2¼OØÃu´¦¿{Øª¯ÛâJTû*úK•Š²·íW#Â?«Û)Öòhè½(ØÿoW«kUG?Ë\ÿ¸no¬ÁDEÌ{f¿£ñ¯Û°/Ê«kÊªÿ=,äœUäKñ=¬Þ'¸m‹Ù”…8éÀ1iïˆ’Wíï®é.ÙÓn»³ß=ÅâZþÚÇíÎÁ)Ýº¾¿·}xøÔðhœ·Ë¢µ„ßÞÇ­ïnlê)#œå$ŽX¬ÅòG´Ç$/‰%‘ÄŸãL$zLñ‘XBIò}À@ô·ee—¨£Í\š÷ÈXì±j´Z­:9öcîOØ¨ô×Ðhàhà1ÑÀ§{—>&?ü÷PlZ˜"Ÿã‡«Õ¢îë¼MNji+œàò[O7†'ý¯Ð6¬– Pj2apü°õøãÇ@¤|Ó>m5ÀHžÊMì²´]\Ã,ØÆb©ŽØÜÉk2jõÓûs!¥¸%/mwNþFž´ÜuºÜ7¼]x¸¾(_LºŸ×ÖlX©åCê±4f¤f"ÝcäÁ±}—©ÂSâL+5·… è¨¦Ð„!O­²Êá„x¸ƒ%m •ªu 5<Ð›@oŸMéÄŒ>BnnÂ“ÓT¯ãŒ›
¢äÌÒE‘Úô/`»ƒÀ~!«±QÒQðè×eÔH"QÖmE÷Ì.¸7¤\—UÜìï[Ý*EG]–KÍRµ€ï´ZËuÙÀ1Ü=YÆÛó'ãGúéiÊbü$_£itýøáÓH~5®Ù»L.èE
ÝÔÖwýþýŠkö{ˆáÅi:Mà&ÏqT•Rhdöð	½ÙÄ»|z¼¨ /ÀœžÒkÞÉ7<,ËÙ‚õ 	['šPK“œò.ÎuWèXŸè˜èŸ*Šßžf ÃêüyþŒÓˆŸ>lÕ}nT×îôáv3t0"bM)Z…±~/ÇzÑ?žˆøABOÊñ'šf®ºv¼•E?Í¹î*MÎèô
–~Æbé7ez¯sÍDŒÍëè¼ý“î_?'”ªêtpYªÜÅë-e—ÇŠ~Ãå3<ƒR]».¯¯NßUÎ)V5-Æâ$Á#X}J ­ªe˜ú•Ú}ËAâÄ-3]óaŒBßfÉB9	ˆÝAµ:RS†õ´×<ô3c-P+ž)i¤ìl_ÁRfë´2„?#wÍ¬z§
ÝÍF›î*òýL4Šù%`Å¼ò8Êü4~QCRÕ³ÓžçEÆFQvtj´X­Õ*‰DÇ+˜“)­)æý­dÄ\GÕ<Wã%3n… äØo>`ù>|×V´QDøèJ~Š’QåÔN,i™ÝUâê·JrJÊÀóEâËÕfLä–ÇO¾ÎŸ„†¬Ò¤e[F•ƒO«¶œ^F¿–œT}Šžö«}PæXwDV-¤àô)!óiÌ@!=Xq‰)•›
ùFf¦iá÷¢Ê¨1¥±$ü²Jb.¢{õÁŽ¸å"k[¿I¤ñÆ²19¢R{ðÔKëå“‚¾.kñŽ¯&z§å¯‰(y›ölî" 3ÙÀù^W»!çñhUÜc%ªã™ÂÅûo§(íÄWÉL&¶ÁVSYÈ‚•Q“…”`túT>6Ëñm³ÈN&¡B%m>–‚
e·[Ÿ¬Åë®jJQ¡$ïf2ÂÈ!øHšlôã Ÿéxg×Â ƒäŽy?Ò
*Å³¶•é¾Ä~´¾¡eçô, Ážd	°ô4d'ê)Ä"«ºGÐG\º¥Åš^Ã¿a°*&Õ»TåS(\T7iS—Åƒi®ôŸ
w„ RB2F¦™Èñw’*QãJ”âÃS,^?ºj©$eÒö!a)¬Ðh"Òµ?`ìJW‰ƒdÌ&UhÍþàN\ôH6?x°Ma¼Íš}‹<ØŠIt¡àwöÎÍ»—ñöˆª›¤hnVWlºHó¬ÚX±ëvuÎ!ˆþQLåKÅJ-Œ¤cƒ)åÝrt¥‹U3…ý¬m¨uì×Þ<´¦‘Å°‘²/Ö²UÖµ¸Ê
ƒL ˆÉmsV«>9×:_Zaõº†Êrv¬Riµ°¶ýÖµç¬Z3ÈRqÑ'Á@¬f$t—¯uÒ'&÷Rö
¼Â«
’l¬¢ÊÀE5àžŽÃòŒ:<æAWÍÄÎ2ó4|Ü†©oúðØèät:ËsôÆ7¡ÇüX{ØŽ‘R†¨Øgž=2~~P‡ûvÛøñƒV°™¨hËò¤M£R)Ò×ÙÌ¾Œ7¿I_»——h7¤ô¥²ÜNúôÑ½,GTBÿVÊ[ý |5)¿íR êhUì},ú+n.Ù¥V$Lô4œo[rkì”+›7U6ž†·[{Ó)#²ÆMXnÀóëìjµ}Çx¬_×Çx8há¡eUò-—K]üuÉD´qÉ>¬À´Ï¢ÎœKCÁ»V4ØËòƒZe3äEët Ä^ôï6y×ß:å)öŒ*‚Ù¼\ m,I__’h9úêõ°¬|‡}\ 1ž‹øx.€Þ¼qt‹=ƒûæøñä<4I"(>¯°¥Vµ¡NîÄº¡DQz#—>,c,$0½Oè«Ñ‘ií“«TÄð’ACJ;¦c./Œ‘>¯(˜’kò?£Î­%öí|O]Íˆ±´Äñc‡da*è@tÜíNxø$Gbœ””OúÌM¢±‹¨ÁYv3RÖ0ËP#PÇÀñßF7¨_b>–¿kOcûRýnh‹“ù.ˆ«½BÇ…16wSÿõqÈùvWª®k	øNM³†¢©ê|’£ôÊX}¿Ž/ª]L!øÙ%lý‚«—8’?Î8’7’Ì‹Ú®e-IÀÆne™{ô0”p}/ûÞ˜é€:©ö rå‚³nÏˆß×ò|ÏƒTfÔÉµKUÔ•lHe›ÛÞÖ|s®Žl—µÆˆxu6ˆô“ðÙã¼š²‹æ‚×ÅÎpÙêôâY³až)I`8¥u±`vAnÒ°¶C´=0Da¥áÀ°jRAïT–ž5IÃp<Úõüf	äJ(h {]JðŸ{ž¾®—Xô²hê\Ìf)qd³D—¸XÁWS¾Û,®ßÀf%ŒæEë»vU¦¾­kCU(\¥‡ï*)f™\ FÆÀÄôgA}‘t¤P_"öŒÈzü‚i¨AÎíÍB²dal—gý:¥Íƒ+'þ”¡•Qæ»ýé*=W!ãüq¹®¹2&5×6‰6Ûq.›(}K¸ê’;hÎtœF”xú>MLÁ»üÞg±õù †¾>’4)°Àè$3bVqè‚1ª±3r”bö=}Þ>~|`l.éIWÓ9Û:K_±é³'û`ê¢–	º‡sÍ,¾?E»Ùè€÷ b6,´ÂQ¼rÌÚ^Ä<â\À	h†ªyþ(~f¡.×W-ô'Zq‹é'CðLì²\„õšµ<öÑ²ŒÚzM^-ópxN·Ÿ‹’†î9ä÷i ôy2vã3,ViŽ‹”3áj1ä4’”0·óv'ékYMóµA’”¢,MÇ*ÅÄSjk9'¿ØÁ,ÎN½Pâ£±AQ†þY“o‡G'Èb¸UKòÌa_sMHÝ²"ýkÎúŒ®²[N]£H‹úÂ‹q9ë×QË!¿Þ?­}Õ‰§°Ì/8ãY³µVÉðûžï£ÉIÅ=½.ÁÙ¤TÑ °æ×qÚ@®(ÑN“ÔŒ©QQ¾øùë«pUi¢21…Övÿõ×\Z©ø™Kk¬§¦ ~}NWh1wzµ_`
È›¹»K:S‚ÉìÊô¥ÄÜ&h´"ç§d±…‰â[’@oo#ùóö6s=âäÄ›ýñ0ŸãÅt±¥ç,T¿þ™ÇS¨¬ƒÉ¥·ˆÚ&Ðlcdþ¤2ôÜü³E×å	eb¦eclI"Ïø&R|ÔN·IÑí¸×nðUÆ7oÊaôÚÃT9a*)qOSƒ¡Õý…Å>jø›Œ©Iýäóü}žÂµÚý™ql¨œ4™ÍÑmz"›<Ÿ½¡w³ËØ +4'¶È/èmäŸð¦nql	jÒôZgçÊQ:²û†Ëòì¼bŸµí™éÇ¬Á—ö»¤ïôÂ>Lþxco'ìØ;¦—uBS®_à3Ö:ºäb¿ó=„Ÿ$µñÏ|z£§ŸyW]Ádù…_êÉüTü©ï3Ìžmã£è°=±_§¹‰(Êìì]Š#WÀ’2ÍYË½–ÜU‹ŠŸpÓ–Dbæy¬õÊÁô¢)SmtXëÃÝæ”‘3V¥#¼R×Z¯„vóH) KKå;‹¾Ÿ·bß?~¬UÖQžL\ªÜE¯ÌvëªìJŽöCXK
BôšV	Ú€…«§ÁcäüU.ß-ž;…7êôàlX£T²W-Ysè¨µöäÉf‡ý¥õd«û¹ÒÄßktA–:jÕëòè¾tM”:j5Vñ¿+
µà‡'<}íeëAÝÞk•J¢—ŒµFÐ!D”ÝÁ®TCï wÔã¹»ÍZêcûšµ¦lKýckª/êC›U(¬ˆóÉà;“ª¯¸•Í½Ö5ƒ—¡°1|L¼³Ä&Ë/z%Œš„ÃfiDE*Îm³4™šçöK6¦õF_ïä”j…>l²yÝtæ»C&=ß0KC¶´$ûË5£T:*|Õ|EIsGÈj|Æ8nLó%|=vÜ¶ÜhaÕÓèá¹½ùù_þó›Gj°rrïÞØìÝÔåžo1Í½»;û€o¹çlìÑó_]Zò«äªwßóG€I á0ZŽôë•¿Èš°øgþyÊFÚ0v°
·¨l–™É×å*-ØÑ<¥é5íŒlD&{Ê¢€LLm9-C{®"W'Æ)Ê’?`˜7l¨ïÈÐa‚3Øî ¶EÕÜAöŒÛ­éÉ“ µK+WÒ»ÁïIÙËLmænËV¹q'ï¦*p0Ê¥¶Oe|,Ç7‡wËÁx1MþÆ-ÌŸšÅ‚@`†ž`z0uDò=QÚeM4‡-`X<ÏKˆÈqØx'†ˆh·7ðeT‚ùŽÞxì"3¡¹¯Q·¬¡CMØDõzP-É°Xoœ?X„¢ˆ1}ïøÞÙßçÏRçäàô Ó~fýÐ>9<8ÜkZrÞÜ	¤{AØ±)ÜmwNN8²×=ÕCGq¹±Œ×Ç¹qa,ªjÍè–™0«ýì™¢­ Íx¨$I)«ÌÞõÙT$õq/0Þ*Ö„ƒÍXöááÑ)L‚yö 2çÔ÷ÆSÌ=¾2ëÏF·ÿ,À6p`N ¥×K•bA°Ú	ÏòÎ…p_}6ÑBò¼‹(÷,ÐH©[’2ÑBxì»lANSÔS(Šk@ï¯Zg5•äTÁGB y@ô;×¾Jç-ÍßøW_É¬¾½( ‹ïù—•Šv3cx÷mâ
nfZ(/pT¸ÄÞ<|ÿ|×Z]ƒŽó–:¸!¥k\*•xŽø^
ÆÀM8÷'Ð1Ç ýç+ü§¥´UŽzó2¿3 _§j'Ò½pr•
Üq3¬ü	ÿÀÆÓ‘wË˜¼@™œ¨Áá·»œWlFŸíyœytD”p•ˆ|§}Ú†Mð=|ãN‰llA#q¨…®bvYnlolOÛØ—ü%¯‰µí}\Œ	¶·{GÏ^œvŸý˜ÜÌˆ£åËÊÂZuYXlm.VÄÆ¦nÈÂ¯ŠŽazK eÃ:ŠJ§3ØLº¹ç¤Ñá+BP©L3™ö+Î³I`èãœD„&Ì£‘Ä«¸h¬¼R4/†žG½xÅ	Ö|ë‚¤ØN,b$@‚-x§5Ÿ#KèžžÞšFw?™t÷ ü CÖ­áCd†„/ú±©R1¿SUgžu×Ó4Hèæ¦gj^¦9EÅÞl³;¸¼ÚáíðS­Á”Ým
™Eú‹UDC­Úx’ÑX‹4Ï[üë ©Šacïè€ºók8‘Ñ:îì§&aœÐŠó1Þ´³vB¹Cök~¸M¾Ï}É~#žxôÍ|äî¾Êe­
ãxX‡E+Z(ì<‚!-A,Ö¤µs$80‰õzE”&˜è.<s3ÌüÍWU²dZGâM{âE/õÆÎÛ|)ïÕÎáp¢“Ù$‚äe2[	Ô‰kWNu+5~…ÝËêBoØ‡ø‘ÃNmÒqhþmÃ9¨|È¾mµÙ#8Áíp²jŠ×üÂ!Ã‡á‚Bœƒó~æ­µYtÐb´‡:¼8T¹Ô€j3'Œ‡ÀÀ|ç††W~ic…kl\î3‡=Ø¡Î‹“gå’‹w>šâ±ºQÙÜA­D<”¶Æòx0f:ì®Òä÷)Ô.óÞ8ÒÉTk =½¬~¿UÞk	Bˆ‘Àð\,]zVÑWÛZîìÖ2­)o4¯¡MØÖ¾(ûF¥ÏégÛâÆ\Û’fOüÄ·âŸÞ W{Ó}ç ²@¸™ê©z­ÞXYµ­¿zÃ	b'ÛÖaçÄÆäawäÀeD•š™ræ¸=ò.Êg#öÐcç2×òQ?¸Fcl• =)F	fi:@¯ªCK­ƒˆ\±–Ü¿¯CÔ£à‘*¾ÆVí`Éçª3²É ƒ†Èò+xMµ?ÀÏÍÛ|†peê6ì¥Ï®½·Z/É<ÔbW!¶Û½…vûà\mß<$ãá6¥B(Æ‘Î@N‹mÍ{ñJtâ³Cfo3{—Ùï™½_CÅÊåwpLN'½wLÐ^…C”ýëLU°÷!óËí°õ];Q@¨!s¬Ž—Cà/Ê‡Cê¹8ƒH5ÿì6yë%¦M qã†ù8•åk€]Wè”n´Oì61æÇ :ˆ¼!h¡ Báõ¼ÝÞv8ï6*³7çÝÈ¥ÞêÌ»UŠ=¼y<ÿfarG“rÊïZµ­6kÖì.™žàÛ5kÖí·x%~;dÍ†*ÝÍÕ7Ûá_äzÀç‡•ZÂ´Ãsâæ!®É1C+ßS†f>ÙFŸr;a¥ßûséÏ[x×1kÒwX©¥%ø¶U>«ÓY0,?…íJ-TšOÙÃV?D‚Ð/ÂgÞ›ïZÙh«²ÖAx6cç1"#ïÿ£ÿYúXúæÑBŸÈÐ³cxt›í&ÝÎ´îÒ£oîæ?º¶†4ßå÷ÔÀ0ÑÀûÜPsqÂ–ÃÛØ§6œDûsÛx¶Æ¼0Ä6ÆÉéç´ëÓ5ÿ8”«Ñó[™ŠîSíZÏ¯l>õE¾f(º[pÑTt÷8Up½±Fzãqhê½P8‚¤ú¸RÜ©R!ù]¨‘/ù÷H9ìùšJû÷4Å»;øž¤Åš¦õÃ¶§¹=eSƒÝ"E,ìP“æNØ¸0@ë6ìe<ƒ_Õo›x9B±¸cæÍ¸	•X»½ÆV¤jÙ©cÛÉ>›R4ýÔ,ÙpÛ1W;*Â{—BY@Ô<¬ÏÏÎâ(,p’Â“˜¦¢ÝÇø ¬™šyÔ*_9¤‚ŠLy¿nP®Ã¿Á—¸[.ž¨\“dûŽã¶2¹|¿|V¯×Îç±Žõ'µÚ£Õx9s£`gñØÓw
F–9§|64i@iQ©ÕìsC7bewø9Oî–cP ½kK^˜9Ùè‹h)žB«û˜K§½ï„Îß˜_²U*¤¾’2‹©Aêâx–«ÝX(Ò<6˜±ZvX®d‚R¿B_´ù!æOó»}òŒ˜ê&=ý¸6§›œ¶´ròöåol3n˜›1Š…OÙŒ™TË5‡ß?yû:'Xk¢C'”mÅwu©YjdÝ <¢¡Sß¯Éö’ÈŠR˜2ës¨‘úÊ5 t
E{&ÃÎrÌg&‘ñL¦¢áb1^Žpï8½¹±b7ËuÌ-¨›‘ÚÚ67¹ÚÀ	†¯çqs·flÅ²²$FM,Å5nfuÎŸuªŠÀ¶d¦×ø
Føý¦v1%#kÈÿÃ«Ì/#‚ãNjÔêQhÌ­Í«"0ÿØƒmƒÑ Þ²ü©$“M²P™tp²À–¤–¥d«q‡£A'ÄúÅ­Nß–¢¬44¸LÑödˆ0•o"9­Ì©Å:³‚4¿,ëÒïšˆ#ž™FÅÑÕO c}z;t,-~S„L¶Q%Ü~ç´¬æ!› Õ-ŸNÕÑlÿ†H[õù3©»*óUu“zuÍÌ‰KÏ?³Ç³­¹OÕœ­Ze“R3OdeXç&ºëIÖ°Ãtˆ#VK³ndä\7²s®Ópìð<Bæ³!Ll)^cF¢¦LøÌä®fz°ÿ¯diÜžøÂÊ³Dúâª“Æo}E>½7ñbK}°cÎ0A«XöÁY'é´Kœã‹¥öÒÌ8þÖ-¶Thr–|j{mÈ•CÓW^èDZM|ùéìÚ©Ë+N÷_faW¸)JNþ/·Ròsâ%ÙS¥Ìÿí'+‘±“œ,~KÞd	ûÐ×›¬_j¾xú8¬'W¦ÎˆápoFÛÒ>Kgöi©rV;ofM¯veÌï–Qf\ˆùäx*Îo‹{k"7Ž0›°sþ
àKŸŠ$6²µ¢ÙÕðöçÌ8k¥ž¯á‚@¦çI,–JŠ[5Ô3Œ‰T2_Yäå¦H@ˆA-_¤à¡¼C„ëÛåµœ£§4zõÞÃÉ1BRùŒ4ù4ÚÄr‡úú-þ§§ÓÂ›«‘°/¯åB´|ü4ŒG¡~‹ú·ó2*M?ždn*](‘hYÚ©¨PúT™^ ñ“ÓðêFá?æ 2Ó¦hVŸ¤"3ó‹õ$:sô”Iþy©ýRÌÔ58½ÑU¨×Ïä“²‰zª¹&Ck23€ô¸íÈßùà@Í‹[Ýõ*†ªO‘ÂÀ™•{»\¢Ä&ú>69Xëü±¾}ð‡ßSÇóÓÐÝÆ)XýY‡cÁò“9¹Øƒ'ix—ß+¨öÔJ3½gg;¦e%fä8>#Ò£šâ%-4'º@XlJ>uÈJ‚Àøy3â=±cƒïfìcüòÇ_f
v½ÄÉ98+É5sþäf1Ò	·J‘#•
¶ò1GŸ²ÃRfô‚ÅÅT¶Ç3Gõ0Ç)ÆÙx	„SÍšeªÀAL”¥èÉ_ª·s1F»]­El±<fWëºDjSštEÚáÅœ]€ówq¸ÖÅTÃ{ß£´½àÎŠ°#J ‹]®£$xxÄ:h.2^‚Cp(Ï°fÜQ‘¦Bf½G=+ÀÁ±ËÃå³Çµëáy¢@WJÄHˆ$‘†ý"þ±ÚŽè;,ÑÈ™)ECJ! ›¶yS3^I@áËýÄ¤ÅNbiúyLÍV¸±_±E}·¼Žt¹j	—H]ázäÕÐòç„¿Ä{bÎ„/ñ
	Äó…_£Ká/ýªÐ	gtLP*äý½ˆßîÇ(í¾¦^hÃÃ”ˆ¦€vµ[¾•Ô¹Mk·-Š|—ÄAHÛÍõ€Û5¶Öšë¦œ­7Oß\cO.±I3„%Õ…jkßÜaéD!C-§çÁÜ®‹ÅiÔÌGó!²Pà¸Ó¼ÍÄÑæz’e……XþBÑ,#€k…p…ç{ÉTÜˆÁgzr–­]0¶Àé£XÃ4³”Rñ/]?¥ƒF}Åà¢’a.© fXV*öAÈx¬å›‘óÉHfÌd*{?ž«˜—­ï^*S,c¾Œ¼‚ÏÂ52™¦LÅœ/-Á’î–·£!0Tì#lË€pxáŽË™D\ê£´ÐÔ„‡\h*”6¼4©pÁq’=#[Le”ÜŠÜøÑ^M/Â£Í¯Á”Švìíêµéa>Æe
rÀ‚Þè7ô,­´‹ÈQšÁ'ÇGÈ7êœc.³˜ÓŸº©©¬Ôr0ëëŸ€‘˜ÇE0J	šä!"Ìs
–Mˆ¹â–²3LÊ)Ø"—‡½ÐíÍŠqfO”ãïçüÛ¼sl«¦}³üežg	Ðô;w––Þüüÿ°¾ù ýv÷Æ<L²Žìõ²µ¦íWÄÓ²÷Z/Ð¡œöKì…JÍ©ÌÍR‘±1iu1ƒ4¶ãNÈ•‘¤û^nQ¦®EfÄì=õm¯*1 `ÖË%2NþKõ­Ò©@6kÊOˆ•RÑk«¥ó+UŽ8UÒ^¿WÕ§dùŽ\kGïÖ­Fô6øÑw¢Y“
g*;5öýûÿþ_Ö¬
JF{gñî•Rl?ñx¯9Õô–.',Ä]Û«&@³L¸ù|kFo4ÛAö”˜Ä!|<²“Œ–;¥ƒQ¥û˜Œcß{C²ÍñOyAùz´•I>šuQÉ„¹1±S¶Wx‹œ˜”Þ¤	ÈÔŽ¥Šµõ/Ó©c˜|¸Àµiý$—5½éG³4)ÜVøŒ;,ÔŠ%Ley€=o2sÆf…[F‚„DñÖ›Š†¯‘‚J2JÃ«+p¾—2te™¹{‡ÆQ¸S{éíÝ!âŽ¦{ó½Œc›½‰ºN An(ø/ª&ë úF¦n¾$P—é¨#ñ½A+½]aƒë«dÑ§|“±÷ªú¨m‚{Zë{[éÚ=¯tí¾Wús×9×Ùrok­ü"]…U0ŒG¡PT2'»Ÿï¸ŸÎcúv51òA12oP¯§¸{&ÃXØ5£§ä&ÎBWó+é*v‚úE~øÓŸ¯£;r¯Üwä†·»ž?¶ZVXg›t©=<}aÂ|ªæØ²þ>ù•^8 Ëo÷è€ý}ÐáAá¤²®pÛ©¼mÇ	†žãÄó»òÂ6vo÷‰|âmÔ0š¹»E^|-/v'h‚oFÎ0H™wÄúÖ›ÑÉ—?ƒz–¼q'>ˆ0y…Y³òŽgòŽ=¬R}áyoEÿOÔ£³ñØño{CÆBqí(ºF/Äï?úb6Ÿ·Oá{'lêùa&E¾îä¹x0šùS{ (æc?@’]#t»-¿o<Erú®Ó§u×ŸËëX/£„CÌF\ü>6ÏÜ	jâê~ìê1t™:ö^^ÊE{:õ½kg$žû›¼ÜÆƒxØröäü‘*:‹ßèD­59Oæ„O<÷^û(•Ð5kÀ.Ù(Ä²’›úÿ   ÿÿ  Ÿ‘