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
Z*•.J÷“x:Ík‚ðT›Äã˜Q›®Êâµ£æI8 žÉÿ  ÿÿì½évW’ üßO‘Â¨
` 	p1EsZ¢lui+‘.?+	$‰H	ˆb¡yÎœïæE¾Wê'ù"âî[f¤dÙfV·EdÞýÆýFjŠÏCžè³Ûs—Œ>?·¡g#'{/Ô*5!çH¿ÄÀìæª“Oék#èßmâÏiÁx¸bñM|%îF0ÊçQÛy ×È•¼Å	ò¦Å„bA‘G…¬>Ooþ8AŸ§/;ÚÎßÿ.Ú3>³¯¬{‹òAvÅ´Skýìj¤Á¾½ÏF¤(Ò²îFùu>M.³+)ôN„²VçõÀÉÈ€{så…££óùûAö1™ì8HÕzÍQëž¢Ž¿Ed4gƒÈ«#ìk6Ž{éôp~ºÞ\£(šRªúÍû»¹
Q(èîjN«óGÐ<½X ïGèžÈ‹¢{íÍrÊ·í¡|Ý%(ße:j]µN»Ýµñ§w…s}0M?Ð‹xÜZko:µ ^ŽÉW4 HØÖ!`ÃÖt +s1ˆ,2nOpsín…u …»Lúéì²~³?ÓË›ÝU¬;	Ý<¶Kdÿwã$„æË<2O;¸¨&ÅF;Â1=«I£ih<6¢$}X7¾!¦µâž;´ï–ÓÜ°e—Ó ¼à£Ã…\û>@M6›>AÝàAôÍ]ÉU„?ž"ì ÐÃñ"2ôº£_ÂB ‚ ™N¦unVðú½~û%ÔX¡ßcù£õG\:É"-½pxG<ö-@¼Ý,[<1€[ÏD²¥KÏ$F®Àš{W:Ñùmfaù³³WºÐB]ý+Fð³Ñx"Ð¬šíÍO×šQ§‰WÚÖ›ÑÆ;<H||öÒÁß{±K±þVH*[¨ÕüMÈØ”Üï/g>Í1Ù$ÊTôHo¡_/³é«óóDJœ!G.ŒØ®ôßâ¾‚SøA—ô{Épx’N)0Ùû·oEú¶sgg|'bßðƒùpÎß(	 W *5^f¤“É“é
°@vŸÖC0GÄ ¾¿ºjÁ €{2ø¿q«³#²m^‰®âœÉ6dµe¾á0PgÃ¸÷9‚ržuéZíÚì!ph«œC¼hç‰·kGS—ä3M°ýœ>@Ø®y¿SÕY
f€‰Òž¿\ŸqIüoN˜Fwo^û#yú‘raÁ’°’ÉdOÁF}Ù³à¯3ExÛ›KÐó—ÊFLC½7o$$.9Þ±%-4•½­¥ÍÝL@ôm3¥´¿À®Ø…fŽ™1~ÈLw­îD@åˆÑÄk€‘¹õŽVKÿvžõf¹ ÖtÔO/2ÂÃ8PM®Á˜€mŒ'¾Aa’4÷Á¯;J0ZÃˆy6IN±Ëì*é×½o`4KUÁJó¶îöR•oÇSæÐªG€ph¿l¤MBÂ‰)«Íß—jó‚pCRÖ¢"ÔÞJãØjkÃâåBÐQ€Ð¢T–ý=ÎRf+ùˆZA‚_¹”ûsîË.‚ÆßèËv¿*Vüúj«ÓY³—ç»µ/º6<kÓùkcækÃù;7¾ÃãUáî||]¥À÷¶úËâêÜ6Âœ]O÷%¹9÷úä³ñq^åàÝÆÓ?+ïæçÚÂüZ9§V…GÓ¹³Â”~m1Þ¬Œ+[”Ó—ªðd>n,Ì‡…8°y¯¯†ë2ø-“ÓR7ðî¹+A+E’{îÊZ•{î*¼6%Ü•Ê«ò-Ë¨`®*óTr§|Q!‹’ÿyY”BËZA×FPQ©§ª¨¦ª©¥t¦§ ñNH)µ¨BjQ¶F©¢¢éÏÇÖ+˜ÂÊ¥…K_{ãQ(	ÐòZe6™Gm·Ì$Ã½mZ,ÎãÎk,o¬º¬·¾ö7tŠÎË+^;Î¼Ñhè¾!§Š»ïF«ˆÂW¢ÿˆÖ×Vt’ìQ«ùÌ@VAÇ´0‹xzC èG[%º:y–S˜Q»Øã»†Ì·õ½[±Àbôe­EfF4Ÿ—Ñp3²mh<ò].<È%BæyÎ$œm`j.£ª×Vôg$rž¼iŸ‘°©‹Ý]»§cÖó¹éØ2‡ò¯C×6*Ñ5ŽW>2ò+6YrŒHy©]¤Z¼¹_ßÚ„5%kô×ÐkØ))M½†‰€¢tï|!º])¿oW\ˆ‚­Ú¾«u²±3_67i¦Ïª¬¢éÌÓŠ#
Ë
²¸øÂ^6N’!ÓH‘—ò*s_žZ0©²k^i¹ƒÞ¯ßùÜ¹Ñ×õŸ?ðQM‹g•ËR]Öï”·Ëè§ßÃäÒXl[Ÿcù¶Ü)s_×½ûºUmi-Ðás2x?ÆÐ¡+(œaí‡ÆÛñ ¼Œq$’s<ü H¸´Ýù—bŒÊN±Ë”ùD&gï\„ ~.äHâ×ýáCãÝéÑ“Uf *gÒØP"ý•&i?ñú¡ù}J£ÝlL™UÙJÕj’IpõW°à­Vh«hwNÅÛç“ì²1Ø]¹hƒí7~mF)­*nsþ&5øÃ•î{ýjÍ±’òJßˆýÅ¿÷é¿%£Zñï°¥tŒ}ŽJŽ¿,´‚7­¢ÕÖ­Œõ-cIˆÞ~^J4a[Ð„N§L~çDÁ‹Ý=öàuIc™wõ[²~iË­YlçYu¥óÈ±«}žDÑÚÈœà»Z2€lB…u âéžÙeŽ‘M·qþrƒÊà¡ñ'O]¯à[¿Të”PºÎábfßã¥WKµ»¥ÚûÑWj™52Ér{pô
›pw+ Só÷ììÑax8§Ý$®šÆM €tI–=öá7ï;zÙ]RÀk=¨„ž˜5ÄBiwÙ­áôÙ¸`ŽD(7<šG,×äN´ÖŒXÖQö§H¼I¿.Ç¬€LøH¿ôœ‹ôB%?¤Ÿ*!ýY)‰´ÀBÞ‹ec§{Ô8)ûšlñÙqÿëÊüïF¨žWSL=]Eÿãß{ù¿ïÑ08J¶¹'¹øÚH|i|ÑRQïµäÆ{™µ‘Þ~£ŸVŸüÂ@ØlIÙIÞ	åå™`Aƒ$Þ[Qãÿö[YˆBí%·¡¤>¥ÂÂßm®h³,,ºEÕÄí¢bêâ½•½‰gãÕð¹húpˆâ•˜àáå-­rBÍ<ÐG½xüñâ©XRÖçY/i4â^¯±ø1ðgô­èºÉJ¬E#€„€\¶Ìr€½ipk­±:¸*Xe€ªc,hó†êÝw	–š¾­|¯—fùDCåÙW³Ï4ª¢²¨ Éxïã)ª˜DÅ4{èì2Qƒ0‰oÜÚŠ.û;ãV§[…%÷À""»×ïKÙ1À×­n«t)ëP3µäƒáV~i°ŠRäEÁúd³Ö íÃJ J¸cEõ°FŸåÙpƒ˜fcàù}é	ª‹áßA«\éÙ…Æ®Ô,o4«=’Š\4–b§Ô>jlžhf‘D0[Özñ&;LÇ©(¥—¸’gÐO/©Eùô0çüˆOfª¶¾ž×£ÛãGË/cyá9‰cÖ¶Tæ!NÂb”g˜0­#¦¢Ô|hRéá™kMqõa+â>þ"Áæ½né+
_½Iz°rc€ƒõ²4—ö%VÑ'Ô'@T¸ÜV·oŒB›öàëu6‹ú¥Ä }ñ£ÍaUø÷ {aÆ,¾0fqŸrOiÎÆ2É²Ëˆ_‹n›Ö “È%@x’&…2'‹!‰D³ˆÎòü’ºÄ“D$ñ^GìXí¾†)Â’#&™§,‡ÎX$(‹0,Ë]÷á¨§9ìÉ£e|bÖlà=µ  lÚ6Ö\tNÒim\ÀÇ;ú]-¤ŽŽ}|ˆ¢cæl²vË—()µªî¨9™Ä±A,_³X…·a5PW°-ú*íå’„7G÷2‹ ‰luÑbõ„§œ°ØkÛöd'w*Í‚d‚êdÀò"³ƒœ–Ý`AŠå#5Ù èl!èlXIÀ€RÑß˜HZ`WS–A`Žù
±œ…4ÄÄ‚ÎAƒW„½mØtIQœ5ƒtÈµâoÐeo=LM†åÄ$ÀÿÐrÁ/Ú=AÞ3Àï¯Ý8gÀsáºpªÅèpq€/J‡'9Y(7™©‹a`gR˜Ú¾?£žºŒ÷]~ô­lDÎ@Ñ¸X1,´bhÑæ{p¾a~¬©÷LYíW„@wÕþ9' çpL£è=Ó³º¹UuŸ*Úoõöª«íö:±jþÐ,!û‹ºæH3üŽ\Õª%Oôsç¡{±F<fåÉd©Ï1Ê	Ë_]ŒèËpe<oÒ£nÃç¦üö1¦¢Œ'xU¦ÈE†>'{®cúËvÂ,[6nr&¹ÚW¥ªòÄÌ	Ä	XIñh¼êû‹ava/psS•Ÿ‚ŒÙaŠüßÊ÷=ãsÙs”Mmþõ¡§;÷p”WÅ¥uÎ0¶ùo&d ¥ H‚x£ÄoÒ$)Ï>o¹ä¿Ñ$:¸¿œ,[ìMßtG}õfß¬OèM}c:¨ßÐT"Ù"¯€LÄaf¥( Í¢Ønb_ÎÏ×ž6§À·Çƒäã¤)4Ð2ªÙéšþÿRÈdre‡„ÍÎj7bÇàùš^x¬õ…‡eÃ=,ü`ø/©{täbG—3Îd]­®C´¾C¦¬rŠ²œ, ôm¢?š/zÑÃ<,gÙ§š¿}&¸¶o;ÍÿŸd’ý $œ"Ø¿%™@µL6bQm­Ü¶þv¢O)Ö‘;Êe·å³³’êJ¥”¥&Œé‹ù}Rd«’F{…û-*sÐè3
{€¾
ëæX
j¥Ñ8elÔÂ†EñÄBÂýka’Ô~ÄwÐ‡¼Q‘vWé@U`È<¾òôbañ¦[*ÞœÍ¦S #Ö˜àœÓÞ8&tJòdz<È®‘	K§×/²~<d©ÂxQÄ['ß@!WOÐBmg|qx×M1Êçrìr2•ñ–1g£ŽúéTîf‰•­d|‹U'¥Ó)½I0mx¥•‡¹ñµ‡ÕÕm­rÉÅKéRÈÄ¯ÐâªÓ·Àò*EçBYÕÇ“$îSöÂ5×Unl}î`ÊÏ~’}êlõW‚qdPmX´æ,{}`™—t´„¦“ëŸ` U€|CqM’‘Îß}¥ ~­2êói<*‡ç

Eþk¸c »,:¦!TÕà_¬^Cí€©ùø¥ËìTÔD3¶â£ªz1¡ä›V¢§h0\=%ÿ{œNz˜Ë—í†FÞöVqôÍœwñi£¦ r\ì3!ISaDråÛÀ,°BO¯€æIB fCø˜æ)Èsphà=¼¼mwïa8<\Å<dÃDô®Þõxæ¿$ñähÔW€á¹ÂÏ´3[÷P=T`ÆÈ#ÈõÜ<A9Ï<Œ2Þ…ÚÑ¼&šÌ~-ìD”9Ù+ÿù°²2lìçw>ŠØñªC–C°>MÇîÏ€b¥ÕåPGüóHÌÚÙmE3V¤!˜^„ÁÃ^á º:w»9¼³¹®ŸnŽ!BêEÓJFi¨f_ÜØyÀ‘Ý©Ö#’Øï® ì'êvê3‡BÝò­Kæµ*½®ëD8w{í£)R!ÝH73D60—õ´ Ã@Þ¾êüsÕùÑÛÂÈˆßÚ¤ž`Zæ)pt™ÁŸì¶£Cà\‚øN¦hŽ¤f£@íº/Öµ‹~
À$(¼„ÔÆ¶B¡ œÔáp¨et†î
ÍÒ²“š³‚NEß
Ä\£ó‹ ßEÅr˜Ç‡Á}ufÈD]þËŽºsmÇÿµJ·°ƒîÔ& KìØ¤ë?Âô›Ó‘8ÖirNGQ	'ç`d\q@‡’½Iäia	uÔµ!@u¨¥WµD©†ímª¡xZNíX3³¿qì£3òWÏo-¤p2ÓõWçôy(>Ê~¥˜Oóõ;NÏñô¯éÁ­Ï{Ø™\D®·Nºg9];G	æã—}Ò<
¼ç.ÄÇXW
9™=öÑ‹8EdG=…,ŸhBºçÐ\¿c_ãržíR·—®&Û²*
tv(è‡bx~y¶ÀïK¥„Ú>&îÆ$±i6Ëéb®oô”ºN¦òÂùÌ3æE¨ä,Ë>`¹!-SÛr!²wÌb7µÅ†=c6âzÅÐÓß£“lœörºT„iÛ¢çÉERÞaZÉß®Ìm¥jÈ=,îSbñÈw%¤þ kþjœŒ
$T‰D|ò©×àãs²@r¯ªÜ·¥lríÑ‹›N€(
½ZÒI%H–—Ö{GÎJÚ
»²û4›‡#øMÐz"B¶©E¸¡t*ˆžº á<©£ÜÜõÔFÝÌ½ì²²Þx;ïVnÜ¶<ë\Á¤o…cÚ^[È6¤Ö{aÉîÎmæ?áíI4•ã² aœsÇlPe—ÛŠ|½:ÜªƒTQ	p1Iûôœz¾ìï¨ŸëŽ@F±¨¸$k9~GfrÔxa\µaôŽú. NG×äÀqòù°yÌ‘WLÉ/ôÍt›ÌöKõ ^|Ì¤&ÇëêŠ…>¹ùÛŠ9n”»[Á`{èÐ­ÆÒï¡V9¥
{î$±ŠÞTÅô*þ&HPó;Q¤ÊÄ\•úSâfCËÌbFéØ´|™IÙñ{«]âg]8fïÉl„!oÐÉËšª*iŽCKuÞ¾¥Èß;R·\Ð‹»ó^ ˆˆÅÝmÂncNûs³þ…÷½ª"£aïáÇÇ+¤úôÀ~ÿF'ÒÛ?ªÑóMUÀ6nˆ}ãŒ§
Œ³`È·¹ÂÿÿÞ˜ÇWÿ«Ã<¯O–Á<¸Ö÷Xç+Ã:þ›7œs¨Ýor±Í4þJ°ÍRHf¡ØncŠ±[ûzŒ/*öW‡`Ž—B0*.úËàM’² ²4¬@žÈ€Æ¤hÑÜE	¯»¨„Üà¥á"¸@âŸ3¼R3^kø*¸[…{É€ ¼…°„„éJá+­-›-|áoQÍé§¡ò‹*ÔŸŠ[B¶štJj|ƒ6±Ëè¬Ç^6Æc¼®µpÌ!¦ˆ1û²SC÷ƒ$öåéf·Ïÿô¶\Û¼Ì%Iù nü_iŽ¶~JÐýˆ×¨Ð<jçBå#žXZ
ÉëW]ñBle¢‹+Y˜î¼`”ÿ†VåcÛµ¬,ª»1‘—ñQ¨Ì ¾:†£»7ïÞì?Oâ	š‘pø»«Ó—2ç(e-3äÂ¡…7‹mh‡fhl\ƒ<±Ùl.ÝF7…¨åO¹(·¡ÿð³XÅH!ûJî‰äû@Éfcü?ûUZÁ@@Xê4ÑÆ3™•Ù½«ÏrãV³,ˆ6ßuØ4­X¬NP?sz´ãÎmý÷ÚA;¤`ÉÜX ½Ü?132šš¬M|Cœ>ºm°Ø~uLË¯þ}qZâ*ÜÌê¼àRª¹Š|‚t½¡;±*”‰¿ ¡"×øÀ#÷ª\#U¹J7ý“ÑQdV|¯ÓÛ¨,C§••³àï91˜	™ÌÅÅ"x8Î¿7’B@3UØ	ðÌVQ4‰<*¼Y*ž²´êâÑÝBíôŽw|0iCÑ|dLÚéÂ‚ÁpÀyÎî›6´Œçu:c¤>žT¤Fi?‹—H‚ò[¿‘´±ä³«Ìá#’qI³QÂŸ’¼"%ÉBúq>¨~½ÕH'¢®ù:¦VmRëx¼Ü?F__­SñÀ÷MÓ÷€%0iÜ*C©CD&“ÍÂ|êâñ*€ÙS ã
³{é¿,Î¢2‡ºfwGÙ„.ô³`TäŠ¾¶±¿>^tàK±œÝ;¹7Ì|mÿmp~èõÉ—â‡I-î6vgvÏÊ|ÑxZÌUÏÁV‘3²…î{î(Š¸=õž;ò=¸#3ÿøç^ŸÜsH÷’þÜsH÷ÒWÁ!ø¡ãêüÐrlPØÿaQ&hi¿ŒÊ,Pþ¥Y K½~Ï EÇ÷Pø©À é™Ê¿8ûs|ÏþÜ³?Öcc"¶TvºÅP’$}Óµ²Vú)â.ÌŠŽÄ®€ßúk°c¶uO_C4Ê0°C2R¯íK“oÁò•í3s/5‰‚L¤¤Q¢]^ÃPÄÅû¼Ç†)-ÜÔ´Û_ˆoÓ·G_óeøæ¯u2‹0ÒÂYŸ{÷^n¡\mºàt—Ü´ÊQ¦pô›Š‘ÃþéÙ?›ýúÕññ³žEÇ_½9ŠÞ¼zëå¶ríZÄJü]€÷23ÿ-è³µîúlU_õ¥™E?®±íýÁ(ïµýŸÒ‹2Ü¯³œÅÚ"A¢§ô}ï¹˜ò…Éo]Øi¥çw ŒØù£Á$ìµ[ÂEWá ©‰Y
Žf—É$í…Ë~nN›sÙ•Ü˜óýˆ§Í ªgB­VÀW/fÚ•/È½œ{+¼Ø%üµq¡]ú”ÑhâwF¸„×¿<µv¾mú2Œo9KZÆ˜á
ñgŠµpòíÕKþ,Í‹"rérhe ƒÌËÎîÎé»•Jn'Qüft¶ƒi›XV¹èÛHdÓ8[aW(¹8XxÿRÛ‹z[«ÙžÂ6ÍÏA‚ÆÓ{ôYIP©U×O†ªƒoKŠ,;Ú=9º'GrTp~îIÒ‘¤ãr’´ %ÊJTÝžbFv+ºÝXj¦¨f¤X„Â}	ƒ†EåJÌv~Wnë+¤p‹›J–¥pÕiÜ=•û|T®Ð1_ ªÊ®S³'`­jÔ`šl]Ó-,Âµñ§ˆ]¡b*©k)ß‰Ö×Úk·°—»HÙöá°¶iá¨jÐ¸5Îþ“Ë#ž~ììE°ŒÌ­ ó”Š÷rÅãñímVàó•àWÂ®EØµ· xa3ÃŸCü*§Â·”¾¾¹]Ë ð/)¨}†ž¬ÛÒŸ³'›à¾ž¬ûÃ¡®|ö^´'±Sxwz–õ¯+^Ôö“ÖµøÃ:éÆ[vï×5:‚iQ‘FýE<D'ŸÎú­‚¸ƒÑLëüdÖ}š\šµÙ¨iN½õEÉW°‘4—#|£íŸG°éÅ(ékíS-hž,ùnû°À¸”v$Šc„)"?Õß*¤<*ÿúX„­ŽŽz`Æ]#yÎ_šs·«Î=kuLÿ›ù©1™yD)#öÊ}‹§ùNt9æ;G‰á3‰Òj/íD»/âI®E_Ýnš¦µm‹Í|È¶ÿ•ŒfUÇ8îÀf­ówªyÆ©~ÎgôZûLUÔ Ôâ+®ÂH…6£mÊMÅ·Ø¥ïqkS‹zäe\%ÏÍåúLœ©[–Ç"1¶lfiþžˆúC¾´ä7–{™õ˜¦÷7ûünI0œUÕ¨…Aö–~^ÖöÍ­:Æ<Cèy’ûÂVÊ`/"ºÁô—	‚&bExiŒ'Ï‚ä=½¡’È—+:M²!Hsvo³p<]t°¾žtæ@Šú çéÆÛQ€ûü½—è°ÿ1õ0àUãÑNie¹e*‰¸o-T,zýC­ÕÉ¨7À°%´\Ûk­íGK®–žOFu%Þn8ëu¦õü‡Z²ÇÙh„”ì»ÍÖwË.E7W‹^¹KÕ“=þ¡êIò1fy®±µ±äBÉ„v>w_k©ú²Ï?ÔRÁ1¹ …Zkm-»NÈH[ËD¯ÜUJxw­Qé¢-•Ê¡ZÑªËìKœR²ô/Ð¡¸ÂrS=L2ë» T–ûÚžfOÓOI¿Ñ]Y`ñ+í4¢vrÙB°2ù‚tÂ³­QŽ–ˆ’Óè	¯Y¢¼×“$4­	Dóž/K›­‚sŽN9JGy2¥ ˜›k)BÅõ;?h´{™áhÛØ¸µ@)‹š¶7Ÿ‹û&; ':IÞxþ?£XÇ-–|J§eMi³‹Ïòl8‰@LP
V7àwÜûÐŸdcÄïdY­¶ªf¿Å€Í– »z»%ÉªÂüÕ~´ÙŒp9ª.›¬Ú¡zžjî2Vë®š°¥ŒEqØHûzÙDxX€6èƒ‡”UYd+ÊhvÝ•ß˜@‰tÖƒNc¥wèèå'‚$=OAï‘l‹lfZO‘AÛæmU	„ÙM?Ç[ç©ej\yVW,ì†$Í¶º‰o£¦Ñ§åI'ÈrÙaZÏCÌhy2IãÑ…õÕÕy0®]Æ“îLÐ‚EdVØB-+ŸkÝJˆx@{¡ò<Ë×îìÜiv‘Ù!yãl¶–˜‡ÔDï'”s4Êgü«x4¦™Ì%ÑÕ±‡ÖQAs òF"+u•Â¡âÙÐ)Úh?ÍÇÃø:š€ª±|„yû½g4;£™cóòÐü*z–Ó‘á8ŸR"˜*ö6´…=ÖPØýînQìÐ
6××Ö<Œš‘^Uæ$µp´õþ;ÓÐÉ²¬¹V\÷Ýö†ÌŸ¡n‘eö5À|Y€ƒÙy‹R7üà'“æ6ä2vÆ9ñKn+>·T¿~Ãd1œy¯Àßü½}/Œ3(#7Ÿ?oìL•œÙþÌØQdPS£®¼àêËàë3¤{o”U'*1qˆHøPx%Å„XR$²Ù]u¤MN1¯ÿçM‘ôïäj.F¶BöÑMîH019ü-›Ã)TdOGÑ9Ðü·Ï3b:yOÈ©àfIX˜¥eò:´ ±ÌƒÖé£µƒwÃ‹ðx>„^i¿r¹6«gÙ%üÛz´ž˜GEÐÚ\ÔLQ°!þD¹UM'U´ûW(<ð?ía™×]ÆZÃB¥@eî!oÄ^þ:£YÏÏÚ]óæg-Py[4ÙÞåL4gÀÕöå96³ÃúØSêÙ«Û©¢ÏqÉS,”è¿ÿÏÿeÛ\¥Š¿¦€¨’
ø<æ%¹€¯ZÛ |Û’Åª;Yi¿3ù¨°Ë§–‹f©Ýý_ÂöºíÀÂ4´%˜cK¡£ëV<^\Øé¶`”ùðQÞC³ØY<a(ÌBä½íŠÂê™Áv½ZÃãqÒƒý@)ƒyŠ‘ìá¿%NA˜V€…™DIÜD1‡vtœLÉÂˆÎÑINÍæT6hv9j{à×—?™]97RxøÜÔÂUT›¡jJ5çG^¦5XlÌÂ¹ìIcçñ¬”©w¿ÈWÏJŠòöí
áž‚ä(¾Õðg¶«f¼	ïî0wæï ÿà ØVõu—ˆlý©wm?›.³èA‹°TºéJ·½BiÁõk¡B!úÎ/wä¯e¢ª-l‰Î†™©„Ú/ÍoW0)4Ë-c–ÛÅ³üd»ãxýó÷,¤Z#i_´£ÎÒó¨+•#ªÕtOx@×c¦*rn/ó›4å—÷~/Úùec¬€ð†Â‹eS•‡°yhkû¹ñË†.\ì^à=Y*Á)¿Z‚-ïð¤-›o‘û|E‡ÊÁßiªÓ©êÉÓÈÜW|¿pÆe
Šá¤t»g”«æ™/ä•=¹ò^Ÿøe•3ïÈ/ÑwÈ7{ÇßóÍUùfž‚ážoþÓer0yg-åÈ=ïü|Ï;ÿ%xç;Š÷„Ï=ÿžïˆ6SÜsÏ÷,êáó<ÉóK¼êèg˜UåßƒaþÊ3|Ü!œßóÈ·á‘ïyä¯G¾ód&‡¬°Õ=Ÿ|Ï'{Ÿ¿Ÿ|G1ãî¹ä¯…Kö±YÖYþ:Ø‚[³Ÿ‘`©aÂxg´1ó þi™îAÁ<LxLp:µýÎâ	Ìex­Q½»žÒmiÁÒûHvØHv~ŒYŒ›æ—€»•k¾s<oyK:õ]ÇFæWéüŽ<QÇŸ0â¿÷£¹8k÷0ô;:5ZÏÍ¿)wk`\Ôóô	@³Cî¦ÁÆOE×éÖ4.Iô&ÓÝ‡ÆÙd5ž$ã£~tü´»züt#Æ× Ó+îjªËª²šTBöšæ¯ÆÉhn08EÕæà†fybm¨SÁÙTkO†ÕÒ¾™š£=[•¤J*ßé=ÝÚm‰iø´–ØUvE7ŒÖ´7×~h%âao†'€®6B!ã·*Çñ¯ÄØâ?úr7oƒ½<Ÿ˜òñIœÎ²xÒÿWš\5æH¿ÄÊ`<*~ŠýÍê¥ÓwøB/þ¼fgñ»ìRlô2þ˜^À`Ù¯Çbìœ@±·êÆöšwÆJàÞ"ÉõRè`
 3ßÒüp6d¤ea*)
T¡ç;ÇJòÅ?ìLsQ÷þ;tÁŒ5q4š¦“ä¸7È²¡¤¡øiŠŽËÉä1œþ)¬Ï¾cÁ
Ã;¼òE3£°€Àâ‰\LX’ˆÑã¦f>‘^<zöä››ÈØœè˜ýÅj‹}‚×ì/þšoÙÁŽÐ6;;w@q ÝýSïÕ.Â»Æ4>ÛQL ½YÚ÷ï.–¶Š8[í”á#VŽþK®\œF<PeÎ`Ù“xäl@^ôÎÎ†»9G´FðkG»Sh­BÈ¼ãhFvsMyXŽÂ¬NÍ1ë{ Ã‚Z`«€À„Zö>¸4ú4.ÔÏ~|­¢‘ŽéÒÛÔ?qŒ}þæ†]eZïS¤Xj„­qrÀ¿ƒ36ËN¾W'	rwX”ê½‘?õj»sŠ½\YTÏg½ˆ3u Ìz2™d“:L^Ä‰šŸþ<¦Œ£þÇ¾ºÊrcØ,äþi OåOc uøkÂú}L'Ù@}¿aüÔ›aŽ
[‰#.µþÜ~ktÂfée<šÅÃç“Ñ3”W¨½Æ+cÅë8YYÎc|3‰S´ÝP…ÉeÖ`[Ü`æµ(;Úßß ¦¡©/Ù»p—càˆ
ºˆgý4ÃÖ0XF8]Àwî [6£7Ô—Ñò+âõíVOkÿ9%µfÿ¯ñßÃÙ°¬ø×q2Œ ?^õ¦ÿó%ð„âõ @ñ÷âªN¨‘§ÉÙDüý"žôÔòx’Ù›ëÚ;{çépŠ2¡FjÌ¡²ùãuìQ‰Í|#âŽ’Ì·"ŒC§ï¾×šà˜»Íj"‚—ÍÆX%s08«Gö¥ÑÃ‘ö´Fi¼3½/Ö*ïP4ÛÎ‘lÄÍèŒ¦¬6®›üéÕy#nÓK¼.ËWîÌ)G]ÞÀ²›#oFž¥hjM»Ôãµ^ÄãÀq‹ÇÈœ~H®šy‡/XOâë\aÓkèPýbä#€…3à¶áàU£¼µóäî´¯÷èŸµŸ0•·ñÐÜÌf~ó=?P&$¶Ï³É¶¹Â0ÊæI7ò÷¢FÝÍH¬wê+íivL#nH½£v¡|ÏÞ³¬zÿpN¥n~}8§ÈïÍR×^Ñ8žäÉ³ÑÆp­ KÒVÌ,«àÃ6kjËjÖÔ?`Íu§ª±Î4]óÅù6«àûg£|}FÉU„í7®	/^½<ùé×g/Ÿ<{|t|J«"Òu|‹~žk+í‹dJ5´ª†ãáðØºÓwÄÉŠ!à]¾Æ0QÀëÎ÷ðÏîž>"xóí·z¤1fZk°¾±ÿ i åŒ_¿M’ÑµÄfpÝðœqš0ˆð/,‚tíqÜr¸¤ÛŒêkõ•›ÖÃy¿°À{»×4Ç±Á áÉ¡’VÞ|µåÖæ›µ_ÿôìù³×¯Ÿ½<úõ§WÏŸ=9üåÐToœFÞà“Ó&MèYõþ÷¿Gdkf´ckÛãY>hèË,dÊ qÎèÿcÔm CÔÃ˜O§ØÐß®wp4ö[NdçKÄî5Qg0úePÏœ+§6}DHýhßœ Œ‘ X¨ØM” ãà@2´Lø$Mò§ÙDB²^=™\cÏôÇdô×Š¶A6=kH,Â4¯ˆ¿ƒL}9Ó¿h»i˜Ë„\ÌÐUWõp+rõgHQÚUßèÜ³öØ¤²sÏR˜@‡»¦FË–@ŸË®54;@Œ6–oµQ³†–XJÝ^ål>g“$þ`”r _Ç­'ÙIüÁBä²7¸óô}0Ì‡i/i¨5Ùiý*øÀ2x$æjouö€¯©>2ô*â¢k?	øTPrí@¨—Ú‰hºÓS¯j%FÎ¦pcrn0ÁVÙÇÅà›ÒzxÂ  XBÎÚ“²§”½l†(,ˆZl1o¨(õÕùÓt’O•”»b1.§çŒÏ;'‡a|¸…´óñ06ê-`qÐSŒë,¾?µû¬'ÎG²D?³¼8J5ßÛ…ÙðbêPàW»ïÝ¨Á&(°‰¯QEìA¯JH¨Ù.-”·!vê8€ëûÁdqj²þd’Ç ?¼šMë$·xÊœ ~ý„u^NMÒØeh)›Ïãr&§}¶»}¾»}{wUå’=]nW5t-7(Upg­½íÛ{ëß$ (ýÒÝ-Øß¾»¿@Jû¡Ö9
m«…‡9áíØ3Ó 
÷tÒIÈï?ŸŒ­!ØŠb¬sM²Ê%æÊUŒÕoädYha($rª–t©—UQKkèšÞÈÑ½þæeôp®Ú½‰F¦ºš0S4¤¹tßKÒW$I€‚OÒË ¯!­!ÚH{ÓŒÖ×ÖÖd}%ø¢sé+c¦äÀWtaï9“ÂYYä±ŸBøÎ,üŸÇ¿@#¶˜*ƒ”'w¢Dyç>Á(cÿåOådèkcÅWñ	-,iGÈ!ýüGr}’1…¨ I¡úc& .+>	ESà’^1weø•74ÀŠMf å@U„¨¾ŽÑ±H[}}ÓèLNcÃ´ÖÄFÿTZÒs%d¨Y1±Šµ0RŽ;,.Ë‹ èdY--uÂNœçÖ4o"ù
¦p³Ü½˜ñ.œk"üE1‘ë­ÄÏt±á\,^€Ë4«©ïnÓÞÌ¦¸ÎR,µ¦çt¯eÊ‡‚–q1œ•\ÈtÄLÀ8.jÂ³tð“óE–´Íj–î7IüÓ~Ó†]}ùšD·ôáú—Kª/æ~€µáBw¹N7ý”ºñ7É9Ó7ÂEU©¼=:?tdè!õªm¾4Ð„ª+øvõÆàØÙkÇòÀF<þÃ6 q*5Ò€fÃ¤MÀØ¨ñÚUß|ïÚ|Á‘„ß|úˆ–á×‹üº©ý<B°Çøµ1mœj¼°Ý®i<ÂÔ@T‰.[€™ñ±‘¡èº‘áûKvþ¢»|íÀFB¯þ½]FÄHv¦½NÊÎçÙU2yç‰R^-¤ùk Ö4Ï7xr!‰TåˆpÔ/³é!KRIëEL²¿¤ÝdYù±,ßêS,«e“TT£N8–¦¾b7ì”VíW(ÌGP^P@.,$zèÔ]C’öjètNÔc‚ H5bAäGŽI¿=;§àÉñ$PGŽ€X»x<Æ˜›i?!
àc
l×ùšlFc±¹‡~KQb½„'ñY=Š§,´Z6nM(ù& ªÞ
Â8.4qðmyÙ‡k@8´ÐòPµ÷Æç'Ð:4TRj”µX·â“ˆÏeûå/Á‡^_ñ¯üKQ VÅçòbê´ž°<&¡)df©ºÇÜ¯GŒ1†ä%>ÆéñM;zÍöõaùU:íX•à–œàíXûn	Ëª{1fÔÁ^xóV½¨›åŠN³§Œ}†=Eô“ëùìœ×?åAôo²­	‘HÊgÂo°šÒ*YB|¹mÐ^`BfÃ)wî°DiöeÄ¿´T”jG|<¯yºö®=‰¯þEî»sbtŠ©Ý8¯”ëB¹Ò¢ê¹ãä:O{ÀÆã<é³ô M—Ûxgø?'Ó]¦Üßo (/+ºDš“#P6¹Ft‚€A?ó~ò:¡Èö(=NÒ
ÁTxM±ä§Âÿ9f|jÌw;<r‚rÅ1>K—+Ä};–ñTûò©î“…^®çˆ¢®ZPÒãæáoôzÒ./\Ë°H$ LUHn¤©™µå¤’Z*/mõB/&+GVcÄ ÍFFÙÕ¨î©Áù@-«X²ºa¤RSÑ‘™9:YÄ3ÈÈêP+Œü§c šŽ.ïÌÎí¯š¿¼)e%­j±?6½ð×ô‚Úé;bÎhûoK¸#K'üxIhu¸&’µ"ðªô‰•@hà/´Ðq¬B=ºŽGs½m]ïc¡C}l[þâ¨I\oÕ44;{’L	„+¹¸ïªáÊªgå=@^š*£úñ%æ¤UßÎÄÍG¾W²8krw/z¤q6"½†!$+#ÛénúzA—5¬–:¢¦0!¦·­çxÍÄjª»a5åÄElÕƒj¢žR¦ùÓI’2	tO©¹¹´úiœ²¨àO¤—‚ù~2o£Ißû‡¸e†Ëf»'¿Àî)E.°vÏŽ_™^4|çY…'–ó…Õ8Âokp¬I~8eÃ4‡‘ˆzWæìÈ$n·s Fà|\‰vÔWù‡6~8&š>Zû`ê©É½CLÈ·âæ;âŠQÈà
Ö“Qëçãz3š{b}˜Íí‰u~«.Œò…Â.b%'ù”»CëË¯ÏŠ+µ’ÌS_kã”ŒA]g–ÀÉé=p…¡	¬ô0§„‚¯h×jÏB¢ö‘iª“"þÔ;Sïd‡âÕ–1yÎ²c¿ÿïÿ÷ÿ{8‡6ä	¿y/Ê;ü$ˆ;u°mè¯©;Ê8õÔ›U¤Løb;‡œ¼G!o×qøµ§Î}¿BŠ#½a¹õ‚’ÑÎ3ÔP2–J7£¾žd—Ù”©y¬OoÀœ,©¤¸E"ú3Öo4ƒiã[æÆ_L™¸:Ù°Ï‘ßãxApÌÛúÛ€y’$z2œ1HNfŸÇVe¨±€—
¸zç°;¢a}P½ìr<›&?¼xÖã{Ð”Ã{°ÒV„:®±–j+|p¢ƒ—¨7ÞE¬%§äXå»èDµævt–äÉôYÍßØ0ÇAmu5z©àŒR¢¼R&h®>{øË1ž€Ñ(§´iöCå,%µ¼qUJqWøý${Â³ªí9 ý½vP“";EëBŸ˜¢ÿl¼òMtÈ]é^¼>F®-0Kz¬PÙ®¼Æ‰e(ïµø­sLŽ]kMøS^UR¬Ço]õ½ëû¾®¾¯û¾o¨ïÚwyÔ,Q^ù>Z¢»8âÔ‰C¨»ñÇJ¤9F9kÄþÄ9^|®ü¦_ûrúN¼ÎGJ¥B\<ÞÄºó™¨Éñž<Ó¦JGx-9÷ã´¯0ªÃÞtÆ›µ>&ýJ¬&¤_á $`Ÿ„Œ/ÌÀR@˜›%öÃ}¯1iÎÍKäWÀúXåíÈ&¤È€oå…•Œ5zÐ2HÜš„O[lÔ”¬Ë7ÆÇ¯ICÛfæÖn;*³'o©)Ù£f·JÍ®¯æz•šë¾šUjn(_jdpFÏFnÔ×\CµÊÓN›Cû
^€Bß‚àÖaYÍ¾×ÚüöÛïù±7
ðã_oì¦»¾¦»¦»ÇvŽ9¼M¯ûš^4½~làHÇÛô†¯é@ÓÇvŽ¯XÓVÛÚ9 yÎ·í-eùqÕØáÇÒ.]F«ÚðÌz&:úvÏmÂ,¯áX­—ý½è»M{Ø‘Ð`ÞÆ×w‚3K»^²75Š!okîS0	sÊ«n±v¹V›A°­†³Ý¶V¢ÿ@5€Þ¤¤!Ö¶Šï)‘ÓžSø>ð(±V§Þd™‰v$‘e£aÇpU¾¥dÑÍ@+]­•®ÑJ—·Ò­ÐÊºÖÊºÑÊ:oe½B+Z+F+¼•O+ïL—ú6ËÖ„HãÙt-gZ¼ÌLCÓ½ôÐžYÂ|ò1;ì+ßò7L»À
ðwªßeY€ÿVzƒx25Šˆ÷É]o’¸`–a{lÿGSò™FLyHÌ(ÆEBÛñEó2›,ýGç2Ÿ?$£ÌÇ5ˆ?&ÄÖÉ‹ˆ‰êØÀê:í¾ö±>’HZ¬W€)29"u§,,G´ÇØ”vÆbæ0ÔŽ7¨:Íns½¹ñn…Æb¯¤¦„Ôƒ0oæ”5ø¡SÖ¡ÎÄ›bsÌa¯h« 0°ªÃÛÕ—jÏk•,)´œì‡ÒÄFëT¦cÐxÀrp
	QžÃ€µ‹üÚpÄ¦dîJþöK»TåÖÙ‰§Z>sÃÈ"i,+¯«µ)5¬Õe·ž®¬8‹í[b.y¾NF}ÀQ?\Ÿ°ûamBÅÜÈbì
­Ñ<J¥Fé{±¬†]O¨·Ž.ão÷sÕ›Ówûš5¦³ÃƒRàÓÕ¬ë?6¤ñ¥È÷í¥ØD1:ë|3‡î²]uÜ]ÙfœNß13’ÉgÑ†`“,”zÌÝ™qËYFß,^H¥3a¾[z6L¹01Ð uC!Å*Å†P¤`-õ« vÙð¸´a¿!íêåõ!7ŸjæýàÝus ÎåtÉZÉLÌø¯±¨Eã&LfuçZÍæÄâa"ÈXˆx'Ÿ<½Ö±j}Åñm8OnÑ&«ìi5›jÁlL‡Œ–6‰–Þ=M3Èî¬X ÃaÔÍ4L‘ØDhíµh|†á!Y­x¤‡r´«N’!‹®.G[ÛÑegŒ-„cãÚÙÍÜÏPŸþždWNxuh¯Ôb”A3 ¢=ºø,Ï†³)sZ‹ÈUþ½jmmDü‘YYQ2mÌTÁª¤Ók,ÐºœÀàáŸ)þÃƒƒµ€8ÁºS9ŒšnÇ÷
é,›bÚØ5`µÎÙ 60ÝóÆš–û³Ê†˜!ºuy†ÿTRÁèävþ› ±Îww?íÛƒŽÈGHoÀßF,¶ý$î} Ê×š’é@‹¢÷È“äöm2~–‡??<>6;^t¬¡¸Y›U PdPŒóBóIÁ‡ Jà°pöŸ7ÀÝ/Ùl¡»÷„saPa‚¾Ð±Š,‰vù†ü:€ëÒuÚ}Lª‹7J£³kî˜ôÿ›%ã_tO{tbã-ç8kã*’5ûqÕrî³ioá.}b¹ŒÍÃW”áù2a¾ö-Ê×®Gi”éÏ#€¼î†ÑÑ òE“Lû‚?vÜ\ðHíržzÃÎí=´6 wðêšÀmÄ‰¬í¿Ì¢çb3ÄeŒ_’)@nwÈe»uÙ—›…ÈGÂ³¹?fr’¨&z¯EÓøßž%)H€}¬!o9Lˆ™uámÓ~0Â¬‹2/âttØ¸‰ö"¿BñÃ!Já÷è">Ëþç~hÃÑgÞ[íZšrÙ¹úÄéÕ'B ×XÂ[aúU@Ù†}<^ùem£ËçXÎ‰©»áœ®%Ñ±/ÝÈ#SÃÐn_“Ñqµéò•§¡¶?7¹Ó>³Ô½ä÷4êGýY/žf`ƒøÅÝ¨¾rºöÎ›‹aAdO'D'ëLCz|¢aÆX‹3j,LÌàÌÄx…>FàïEðu ÉŒbXÈnö—;WbÖçžûX¸ê"¤]¶sŒð(®n,e+Œ«­ÑÆ‡]‹¿††=7…¡^K‘?–¶âÀzc»ªØ°6†¾Ä#¿IeÛ›’öÀÁÐâÁ¢Í—ƒÌËÿâÍ£îÚ^ÿ…ãÅîþý~Â	RgëÆ,˜ sŸ<Æÿù&zöÄ
ÛgÖ
©kF FüÆãU~C“¾2TŽX›_@oê,°µì‘ *-r9ˆµvG@¤‡* ï:o!¾t|‰ÛI,ePÞ9Óå@ôC<yŒ:ó®G6"ƒ„“R™\âH®ñÒÐVUe—+d›sB´HÀyí°Ÿ§˜ØøÓ;±|œæÖds£–‹Ž€6J/‘’¤¨4íÓ¿ù0¥?ZçØP–ìFýsnÃŒ\&úõÆÜÖåL¬øû®šœË 	°›‰ F!Ò©¨4›–'8s9oÅ+Ü®þGÍ¶³¶({Ÿ&éèprbÆ³ažør	ìãÉ‡a"ØúîšýŠLø€ßpÝŸÎÎÞÆüø h6'“»kÆÙ§+ ˜œK¸§P”Ð]!™WÜíxNw¥¢†Ò–4çãË}¡hamÿDãëÑ
‚ j\DOíèp8d(zSÓ–š$Ür×²3Q9yá|ÛÊFÃk[d.±ïÝ­	”*`GætÉ‰‚ÌC²ù¢öúÈUÁ2H–Ó‘/k‚žÑ.ž+žŸ~O!O Ã; >¬ÕM—÷A,Â8ÑÝr[6mxÐH•N–D
“<@Ûáp|ä	6u©=­ FxÛG,³¼íí Oìo3<zêsÝ—CÒGÅ,¦©bdþ~c›ãÐŠ‚ ÷ÀÙïm -Î¬ÀáÂzÂ<®áLbf‹ÏLéB¤QE
û	´&5¥±ZðršÄC—Jkó3BYÒÂå‰a15Ô™ÊåÈ¡?¡h
¨ñ(¯7*öýFÒKü\a8g…Ì¦· b¸DŸZ<@«ÒDÑ6Å_²Y„’•D"ºöéw‘f¢˜9ç|÷CD¬»Jæ,Lãt–'¹— VNçRM>²qI¡dT…ÒH™E[CÊÖVÑOjl±{y*ãÊàÚˆV;›–ØLDU.IY©³qãC”ù8Õ`{¯‡PfÎÏ¢[Ž!ülåõèÆ+ÍÛÀ\I°ªFƒD¦cæœü<‹ûÂíþ9ºë©ŽCäÊ5þZ„Kç†>!)HìÑ®#ÂØhgÇŽÏZšØ_\¿ù‚ò¤ñ;Ã|â.–)Ë¤‡§IýìFÃíç:ÓÙ9|îYr¼yjÝÂVÇ‹ÃçÄQìÃ±œ‡=™Ö/½]g)@ìuØ©à¯£?Î‹‚¬ÈZFä‡sì*ích÷þxÝJ’¬Ù«×uåÎ;"–äB|œbMŽ&Úëf²)Mí³¸ÐsxäAézÌ¢~ÔPCðÞ†Ó³:V8ºW¶CTl9DNé$ö$æž^Ö¢)fèÝ£¢$ÂûêO8[E»äþô²–iPa aˆáw²ÉÔ_Ú-P˜Dw8Á´Þ‘''b:¢Ôt´¯lŠÛ8ÅJ¬•Åq:ü/ê×ÚDè×4å$QYÎ5Ÿ…	~#é6Y0Ñâ¼¾x×ø.SŒˆN-û¹½¹ø±š$~—é­ÔÃÝ%k°üªù3Àiu¤"QbZ“)P¼`ÁÕí0ŒÌ‹©‘?–‰Âofb A¯$%TG‘3vºýðÐü¼ÏýÓ¢nu_ÜbÚV<ˆà‡j'Eõ(¡†¶gó÷a‘R¶ZÎDÊz8×'{ÕM‹‰…`ëIÿ¢;vØ°4¸ð@SIšO‹¤]ÁÌ<Ön0V¡`{TU-ËX»lSÙã1ršOñ~Éƒö	X´‚èøG›-’¤rÖÆZR“-Ä=,_O0JËF:¶ü­Ü•}¢q®øFqVÖ¹z…žwxÏ;ó~Î—Í*ì­B¾…!”õ]R‚ó;æ™zOŽç</N¤¾´"‚pÔC £ÂûhÇ*j“§FñpŠO¡°
ž°ÎJˆ¬™¡/Þ»ÏÂ%îµt‹Ï>$oÓþt°7_oo†•Y›c¦ù”ðbhz	ŽÂƒŠ9ÕAñ.ÔÐÖSøÑXu²sóúmöÂ&ûQX˜åžW©EI;Ÿfã×“l_”ÓXù¾ZÍP˜†Úƒ0{“çÕP!=èŒá²~J8>~v×@Ú
Õ™àO‚9‰½¨ÉÆa€,‹}Q|GMï5“ŠŽlJQ[):ÁG5^
ƒ•ŽEáÙ*–Ð¢ Ü,ÊI>8Ø—åv”{\1-¢îÑV}yeCú¶UÑúU²Ï…YE:A	õ¡ììº…Ç¾ €þò¬µ…Rú¶ÅÄØúC?ÚÂh¬0úf7;¹?†$J
¾÷¤¸n©"sùFG0å:ß,Ï´’ª¾[+PwºXƒP^,Ð´ Exa9;XU',aÛÑ þ_8twÇß²Ä&æ7…ýe(Ll±KÝØµ<êh¡¯ràÂOodTRL‹ó.SO5ë®<ãØÃ¸Ä`yÊê&²°žŽ_§¶ÿ"¥Ólévfnêb’åøOÜO.Óë=Éokÿ² ÉRïQ!°Œudt£\â|æþ³ü-r¯'ègk@°œâË“ìÊ„Fax&­HŸùú)•^S¾‚^¥°i<Ü›WãÕ¡aû½Z.3òøÇÕö “ìjxÐªµ¦¸‚DÁ|$“kÁôZ5rÌÓªvüU“OétÁÞÔ>bÅ¾4Ç­µ»þ
TY´§šg‹ëø°UQQ/ü}>ì™;±LI1¦Ç©›‡X)äŠiÖ´š+<
ÂATû¥[¾ˆ¡«QÅKÞáá\•Ö“iš½ˆ¬ÏF"(„
UýZÒÈ³>Þ35™­;AX}ú	à–øP‹SÌ[8ßµµ8·þpëþÖ~ð´v¶`kB½ˆƒcdT”Ç“¤A]øÜäLo2†6Þ¨1ãictƒ†»ëfü#cPÅ65,ÞNÐÕ““K»¬ƒmW·6µ….Ïb¡ðMdzB‡ªPMXÄõ‰§²
ÑZÞÀ óezGA@±xtQfŽåOTLcÐ>®P‹í~‚FÿF‡§ºT?î÷­,`ª‡‹……ë @í2Íå¬2»ci1uŽ·7Ëw²Ù”,CÄqå¤ýe÷a½	áâÛðÁ²Ûfe^_±}f,*gÜÂÜ*˜¥J©¸üô)/´?Í±ËÒeÊ?ÿõ©v³T_Í,sºAI*U4[\ËlÛ(çŠìpiöÆóŽèd5×ºo)ÿ;÷x”V[®BµÄ-ØÝÎ2ìnçÃr0šëéÀËünXŒ±b™7|lq…Å*Öù«,ÈBËù=Ð'X¨BÕé"¿?-ž[ðÕâY‚¿ÏÂ|¶xÂü¶d	6È°VWV=ÔäC¥RI”™%/*YÌžJ\P¬8®`µÅGñV²áŸxÀ=0é´£ò(žy¬Ú½÷àÊiZ…–<ØßOÂ:bPû3?‡º-?u|8ß	P.¥Ô1§RÛŸs Ñ™ÿŠ¶1Zªê%ý$u9§Š«ÒP³3u½7Rù»r‡“,ÑÏ‹gaXv<3/ûEž™Ÿ†ÚÏ€£¦ïqW«ÐuÓ÷|wN–SªŠÍKE:£°L"Ç'PSýe°wÒ{¶^­‹J…*¢Rñ|fPÅ>Uó õ{z~Ê™ŠÄë ZêWçÎ÷]?+tÁ½AÙä;5µ€Ÿèöû‰úÆRÁu”âñîÅ•3„“vT`Xú¯"ïQß°ª¡Ã%‹ß²¼þÈ,ãè{æÂ}¯šûŸï¹kß<ß³ VOØUO[^¼ËV¨òÇÂuÝsÜí–å‹ŒA{Ù:_Ð©Á(ÖS B‹8¹ÏÂ.Fž™Ub~;…
Âöx7Ë|¨ß®RËPmßq—™Z®Æ²+ŠÏü¶>C¡¥¨îJä–t0ò?Ë»ùŸ/çŒä*¹(ùŸ ã’ëñôr×Ž,KŸLby)¡¾ÊÖßÚö€*ŽKþçÖîLg¹ã…Ouß§ÀSÍ%*ô”¸!†º\ˆÉ}UrºôtWq*ñWXmŸ;Ä.‹^¢%–g¡ÓòD»õX(\ÍW²Â@+õY¡Pá€Š²»ªt³¡.‚®–æø³º^…Fï4W0Ö ‡!ùR"ˆQ}‚ŽƒüË¢_mÓ§è~á Œ­-ÃŠ’À•_ %e3ú¢®‹‹êƒÖº){¹BpF7
é¦{›ÙðÒŒHxBùïDˆNG\4â•vÊã•Ö½q½ˆ“B+8Qëkæ÷Ûæl›º)no›í…øùvŽá~ç*îœÈìGVwãð5KPô8ÎÝYpdJö4{š~JúòNõÿþ?ÿ·~¿«wõ5K2aæ!wS‰ù3l¦Ñ›¶³ïÎµŒHÚþÞüorÕ×þfxlvq¼D‡æ—þ"¡ÿ1A¿¿èIŠIH@¨@/^ýª@pmW.?Ìø\·}A?(0{PÛÄCl‰hÊé§0ÈzmÿIr™]Lâñ í¹>Ê•BÞÀR¥Ñ£ô éAÕ¹'pTGuï&Fú&[²uz-áî‹x¢—ZÀ£Þ=»ÁpéÂpÇpP€*e’¿:½bÔ'»¼€=MUw>ÿCïå¿’Ñì÷ÛL-gÉ]mçSj²ê†Îµô*žûK·Øõ¯{ßat?%ÃñãtÒ&ÅÛ_tÏí@@m@È>¶8¼Â6«ß3©áÑ —žTÖã§Û+ZBë—Goï–‚jW>E:ÛiŠlÉÅa‡¹oÐA[æaí´Û'ÞvGAþÖ¥u”ã¾pÚv@ÊÝ€øCfÉ&Z_FÚ=ˆÛËðµ}wûýw®‹ÊËc1úqÉÜ—°Q)hëmÚO¢7É8ƒå!HÔ=SÍ¾¸§‰_Å\ èõ1½€q´õü|»îQ¢UYÊw¤ÂªwÛUÜVÉB¦Âe0×9;…ÒðBY!è›á]¼.ø<žz‰v'“ìêe5Ò][µöhñm¬ƒ ðÀÊoïØ:‹-õEdhKÏÜããb¬£½Þu£ °3²ÎS×C´L|sùË,úáÅ3Šº§³	Z6mu!ÖcsXäÚU‰XÕ-òó {å»¨¶Üc3*•’ƒ¦èÅÉåËl<SwŠ¯ÉB}†	©mÖAÐÿ%¬ã·’|¹Ì¦ßÆ9æ‘e¾ogh’åz˜!úY-Q`kJw"¾ÈX·ù{ß^”LˆªÐ¶øÌÍ£àI¬JÕýãÐ7°ò(¾sGñˆÂßÄgÙt¼PxEŽêÚÆKË³a–þ#m½;-38HhÿU½;…Âá, ªÏgIžhpM0*—¶ÏüÅ
ô9Q>‰"(À:w ¡Q,²ùØÆ¢û^a1Ü“~}Ä{aúXð*<;™Žp-ßfÞì¸›A`ÑaÅ°Òù=W*K¿ÆI“Z=Â/»ÜýDO¤êxiJ0¼Eòîðbø¦úa°”w-ý–k‘KBG—É”Z„Ž 0¸¹ò¤ÆƒýÒü •ËB]×öƒËïÊ óÊúà¤Ù²ögÐÚØŽôË¶ÕäØ>ýn¶•£!xåPS -Âƒ£äAõ› ëÐT6(Ï±±³gu·CbÎF(wÖ¢ÑdÜ¢e)DÐÎzs‡ò–Cé·dQŒ¥¤2ˆv8tåÑU
´Æ“hLà°! ±œIÿv)|¾`Ðè‹7I>Ì
X ì4N1ëîÅæ«Dü­Æo1ò_Þµy•h£½È…Í½y¿ã*û0l@«úcgäi<"¯6ðIèk2‰¯÷jëÑz-Ä5M{ê–)/¶WûçóÍóGÁ‚»ÿëðSš‡TqÐÿH ¼Q•Š¡œ¼ì<PFø¡j9¼÷‰ {Ln¬µ&ýzË¯’¸¡—ë¨Zý<Úˆ×Ï¶)‚·ÁÐÌ¡™÷³KØí½ù)´{ûî& U::;MÇ¡¡÷`€ŽEê†§Þ Æžå0ÖNwü©Þäoá7j­é÷§c¢Fh³ÐÁ=êlÂZëðŸÉÅYc-Âÿ­FkíÎJ=ä’2.yp©)„Åe6Ê¦³ r8®ábè6Î7¶’Í’r*ôe¨×ŒîÃBm¨ÝfM×›z#…÷‰YØÙ'²­­¥Û
X2ä¹÷!0^©‚ÐLóAq˜-¾êjAéD¾HâQôâõ±Á œL’‘)þ¸ Ç}ÔY´®Y?j¼›}'^óèù|ÛËbþ£›C”Žò-ÿ†Õè®½+§Ò®)½ $•v}¾èÖºvO¾è^¼¸_Ô”Ï¦"æ(Ù`1æEîO²1ª’'˜`ÊjË:è¿D€¡È-Uúêí–Â»ú6›.GÕe“U;TÏSÍ]ÆjÝù¬d‚Ã[§hBÒÕCæA—RÂ×:ÀÜLa®§×§£(1üÏß_!:Àÿ8IÉ
yOLQã‰¥í=Yò¦×lhyG,Ã‘Plx3l¹a±½!×ýÇ[ó2ŒÆh`q<‡ÀÖœL€õ¹°¾VqçÜGôù]I¶˜R8X‚Y–™T]FËþ{ô&-ç7C/|@kkßßÜ©é^[þ™e)÷DH@‚$:àÓ%fê!‡ÑûC`î¯³Y”ÏøWñˆ2xÚ·dü­³ë‹˜1eJã¡ôÅ4ôÂ#YbÂ³¡ñ¬ïPÕK<ƒh:ÂßÂ÷¹žGq"`§ûh¸|´ÒD’ô“«Š’oX–5,ÑY[aÉÖ„"·û?$É´ýÞ3ý‚éÏœkB-€£”ñˆL%2á=³»Oª{tq¢Âk(hKÅmFx!K¨´„ÖOÞX¦ŒÑT¬ž(î}ùØ»ÇÈ=Œ]èžTõõó_=f)îƒ%W‚7–*5ü€&ï6Ä‚.IÙSB%d.Îøùéb òµTc“%¹`e<[Šü€5`àÕ¢ï`ì.#Opa¼e¹X³âcm#[¢–w—S•Zí5´¨y£AuÏ’·'Ë`s¾½ñh½~'åäóÌéÒP"›ôm™¤»‹\xr¯0‰÷Ž$óSCþ	 |óÍ7,fÀ‹Ãøß¿ÿüÃ=>9Žö¢S(R{šÓq:Â¸Zøó84ð_/b `(Sõrþæ¸—b·ü×áÖ èÑëx­ÌF È5_¯ð¯ÿŠ‡3 ƒGýYÄ²Zßž$½ÁàÅ5‘¶ç ±Ãte}U0jœ<?­¼˜å@±èád*†ñzp£ºI«ƒ%~JâátPûæÝ÷bÚ/_½üõ=uÙ_ÁäùwúÇ'oŽ^þxòÓÑË£'¿ÿtì¬ÁÑùyBXSš]ÎF©>ÞñYšïý#ÃOâüZ|ú1á¥þÈX&ýƒ\-|	,O‚	xhÒçItü(^áug=Æ*ØQœÇ×ð°šñÊÒÂÂ"‹Ò§³yüêÍ‘3¥WØ–g6o»I£x‹În£öAŸv[ãáþ§¢<ŽÞÂ7|ÿÙp:›ã38ƒq³ªù¯'óì,®Oñ¿ð÷Iò!ìd6ºÈ°M½ÖJ·“z¬àlr3Ò£_e•&>òõ {…n“œæ€ïÞf“aŸ¯1jþ.ÇÙÍVª,ÕÈ›äƒ¾ñýf<¦¶žHóBÈúî]³2è˜æ¸¿Tðõ$;¨¢§$}?Š'Ó¶³ú¶K@5Þ>M'@®È?,æ–åÙxpeçôæ§0ÆÈçbÿŠÏ<+BÅ¡Èôš1¿!ûò3^É§1K&ô˜v2iFÇŒlÊŽãëfåÀ±à}ç³‘±>ÿWš\5(dƒˆ‘E§3œ‹„§üÅQ?™¹šôâ	Å·Õ^±ø­IŸ3üøJK]?ÍlèøX¯:	Ö÷X­²H¡æÈÏc´çj½f£€+i~s³SÛÓ†šö,w¢|u™Nwå¼ëi¿¾OÜ&@Î%Œg÷c–ö÷›öz@ÝÃHL1ëK3Z¬c–ü5¬UÞ‘òÕQj<kÕw"ü/4rž­ˆ•—~CYûq ›fmï|?Ë2à-FîîèKínÒµb¨!§!Ð”qªj±¬|ýÍcá=Å úx&ˆ¡€…æéAÔ«w &³<A<4’ˆ3æÕÇTæŸ³d–PÝ×ê·^q·GþwQ‡D«CKÿçƒV>ÈÙßƒ¼…:þ:_é}ÅŒó.Ù2±ŽTìxêýGï'c l½öõº;còËÙŸ<mž¾Ûoðt²áDW5
½iÀßA[yÿ_ÿù'¨FËûjL ÆÆñ"¹ÌºTG™µÍ‘¹OyxOÖy†ïEZA–GîÎË8~#w§–Ú»y.¨'öÿ €a‘Õ},>§áG-%€g¸`‡+DEapÙÅÎš’qù¢á2€0ÂH‘ìq¤ùÉP z+‹3f]«Š¯ošÖañŒì$Yû?âõµ×(
”Q§u Éú›qM?ú^xxx-íÍ†³KþÓœL&x£›£ ù»ðüC½8lv™Ž0H¿že)¡(Š´¿ÿ;Éó~.â³ì^à‡v/»¬ëíxÛej‚Ý
”cŒ†i‘¶õÑBÌÂóà…ÈÛLŒf.M˜L
­A¬¨]R†]S…õàke¯¨–”`fžÔ–¼`oÒókŒk³DË•XM˜£MqôMG–vû)üa@‘‡öî7Ø™ ¸Â‹?“=I"…,éŠ|¥Ì<2ÏëMªÇ*ó_
ííâÄ°³¨å¦xhVY½èNT«±Æ9Çrr=Æñ^õ(Ÿ;>˜¥š¬ìÕ•°øw7Ù›±ôØ\ãíÅv=VéNtÚyÇ^ƒ…äD¾yøv 3Žp‚Ú0Ø“#ñËCi‚¤Q,¡”§„¯¨±c÷½Ÿ(ïR÷5ˆSñ´§^6'Ûc(TQÑç YGŸ2ì,Ç¾VäYDâžIÄ°Þ5u%ædÃ•éÙb°¼øä6·b*=ùÐ*%¡PÑÜx†¦ÖÉ?2–´œ‘3U]SJ…w"ãì:/ÍhØ‹—»Ô´x©édÆ1Fò–kl“ Ñaã”ŸËÇ(£!£ËØ¯û­ig®±_=ÑŽ»FAõ×^à!6f(ÎT'×åÖSËìí]¯Á+(>×Uûþ®¨wáÈË³¾Ï”ßl*>(ÖèxeŒÞÙ†t™†Î±ýCùm–L®…K&óaCjôÏšQm†1€j+Mþù
Ýó51€”ØÛ«5åÌX|îç›1`þëQ<ÎÙ´ñ[Îü0L’„òá²Ýé;’ˆÅt°rhäL¹Ñèg½c»5Ù;Ô›G3Çx1Š…Øn·ÅO”Î`«nðäi=š§yÆøÂ9s…®›GT¼=žåƒÆlÅsPå;­´•Xª·¹Å’¢_4Ä
Äkµ+yÓ™]úÌ(-;ôˆ… kØ˜d2qöæÞ†÷Ù¤Q;Â¢ódÚ ¹ãˆEPî|€[ÐŠ[K@4j
„¦ÿž3³óC‚ì”ÌÔ˜#à¯f¿£ó07+°Êh“Ð	ö0¨RŒCŒëv|›Í¹}fÞ­€{ãüÛÿ  ÿÿ h¿Lxœì}ÛBI²à»¿"­ÓÓÓ’@l,Ûxemf0°@÷ÌÖÛ.I…TÇ’J®*†Çý‡ý¾ý’ÈKU^«J\l÷«g°T•—ÈÈÈˆÈÈÈ?êM½`Ò!ƒEù³ä×Ø^5}|Fþõ/R­Öú¹¸ø›ŒÆI‡´7Å³y"žm®‰g‰g–ÏÏýÈžúÑ4î³Öñb1 àb6ôÏƒ™?¤OoVžÓc?éƒ$˜ö†µÙb2ÉžïÅïÃ¡79œû³Ú¹7‰}úêæù#ø;gqBÆÞl8ñOýi—Ä‹¯fRó;äØ÷IóMM{_`¸+äå6¹¦íúÍyäã³]ÿÜ[L’ï/8'µÇçP¡9ó¦þ
‰üdÍØ;ú'‰®x¬°/ ^Iâ]x I8Ã!Xÿå’¬``û¼?ñaL–ÊÝáPÔU+ð#ƒc°ß—Æ S…Q")œøMú¸Véá?$ö¾ 4$f=t*uÂjñ¦R3}üb|!ƒ‰Ç€—•‹Æ9L‰çÞÀo\5ÖÈ¼ßhµIÔˆ'^â76×È4˜5Æxùþ¬²Í!ÒÚ¹þ5.ÆAâ“~ý¨Ñ_X;í5hú²±EæWðg:ìÀè¿\5Zkä|â_Ò?A8ÁÇô{^ÿZÄIp~ÕèûÉ@@ iÜˆ/J°ûéÏ†däÍOH<ö†áE#ž’Ÿ®c˜ñ‡'ð7gä©B[ƒOW$	ç0Ö66Öª¤Cª‘@_|xÒZ«Þð‹O ™q0ú³7ÛéÜêôú037k2Âµÿ^4žl1þÄ³a0
—Qˆ‹gÈÞŸ,¢Æúå„„€ý ¹Âi¸‚üg³pHé<nÌÂ™_Ù~±
 ¸R1)c´A”±V²v¹g¯½Á'òóÏœXÒ.ú‹$ü)MÌv&€Í—¼ÞöZ‡‰2ðqD–6IüË$%´52F¼wèCŽ²'ðô<œA!ôÃÉU¹ŒaC—@ÿ‹`èã¯Yà$ã¨Ã(®(Àlk ½èÂJ¹Ø÷Ïÿòm=¹!«Û‡¡Ž|•]n`E¨û:Ò7+* æ"l!±´4bÑ!ˆ§$cbT¬þ“­>±y+-h%[ ñ8
fŸk=¯ÃðrkŽöbGCŒB„bTFKnôH„°N¦Àu0 ú¸%×¦¡£G’ÈÈQÐ3\J	®CK‹„ì€à‹ÉbJvÂÙy0ZDŽÙùê¸e	XåÌ ê¬µ6¿ü±MD´ÚÆýÚÈýÖš›éLN‡Ú<eÌr1ŸûÑÀ‹}•ÒAV*ë¡²}â'(•â«™1æ<ÁÃ¹1€l²ŸS2õ.Ë‰‰ï½™7ò…è‰ëdyCFƒ&7
¼:NuŽê9•u1
N@a…XØ
ÃS}ÉW¶uFþŠŠvªï$ã ƒ>®Þ hÓÛMóúÕ¹ªú3ýr=ðf ÌÀBã’=ÖÙåµ£ëÇº°Ó¾Õ´7MÄ¢¿Ì~²B^VVMˆKÌ¸&éHêÇ¥¡¥öbÐ\ Ø4Ie³–Ít»$ZØÊÝè’A‘°.6q]´a]dìïI*²gOu2EC•bIwÈ8œ$¼I	¦É¤×‰@¹¸hx‹$TEfÆ6µQYxÅÑd«K8å$jŠ6 žÜ3°Y=´ÇÉØ$ÆIØ÷&üõÞ0Fº=ûP’d%ÕUPàdb¸NÏ'Þˆr€dì“)’ÍšZš¦4ÙÌéŠM'9Â©$áÊ‘˜¢ÏHr>}Á™¡]õ¯0Añ4½dc£Š~ªã3_ì0¶$yr½úg²óëññÞÎ¯û¿¾'GÇ½“Þé	ùójÑµ1Í‰?%còòåK²FyîëŠÁ´µ1	hŸhnª²O³m|·R…ØÆPeÜÔ¼ÆmC,^Æv}g#OK¨lKz[” !ŒÛz‡¦xÌ ]ó_†t³£Aì"§œº­Š×Ö“å!_¼Éˆ™ñîÛtÎÌ¥Ž`vco6‚Z5Ÿ²;¬c­_ó› Šü¤I»Y±·çÛÁÉ[[SW“øü:å<©Eçnêƒ~,âN„ÓÔ–¤:ÿÚj{¿P5wÔÌÂE2	f>ÛZÆ`C: =œÓye(®TÈ0ˆ½þÄnsžÁpCU8ŸLaÍfóÅ*«foóúl­NZuÒ®“õ:Ù¨“Í:yR'Oëd«NžÁ+|ï[íÍ©7¯p~L2Rüä_Ü¤´p³}=âËý©üáG#ØRù³
Åt~a“?ºùx“íŠuÆAW¤ã·°X›Î¬µáØÿÈT4Š‚!Á?ÈâF9bö³M&#éç:¹œH?7üáš38ÿüèÿ­ÄÙ¶_’§¸^óÊ¼x	“ãXÔÖEëÒ5ð“\Íaœ¬„ IJk/¯EA@^ýQøNþá\áEê~¨ÁÏ:XWÎ’Zå {"Ø`“M|d¨ìñ,ëƒœQœ4+Veˆ}d«£ù±WÖÎ˜Ô{œe^«û_‚Ø’¿¢ ÍøzÕÙ?3ªN¾LÈË<jÈ¯~L4C5Ú,Åg8qâGkmVæûî)ü÷ö÷“__ÿ¥·szÒdõjt‹ÓÓ|JM»ÔJm²¨ÔêÕ\°¸Ö3`SF»^ªÔÿŸá×ªS/ÿF.ÜYôJŠ‘<†.ÚÑYZf 9ƒ+¥
Ã_O•U®zN‡ºê9BêH—XG²"RÙ3AóVªfj&Í%äGYƒçz›ŒñlÃZ•lžý	«ªñRàº:ÞZ£ULsžnõÌƒÐnd2™©«þj­cnÏÌq.‹š<Æ2–9Ý¬gÇ„þFÚ¤Øq[ò²Î€_‘û!p‚HQ8½Y0E
çHYÙúKöÅzså™‹åÌ•ÝL(½o˜v¡iyƒg+ ênätbÚ¿ÎZ-4ài¶°iBÍu sx¶U¶Ä ß™I Ìò"€½	õ Œ|âE A“S)ü8_e{·Rúû”Ò'ïNÈNÿIj=LÆ°àñEw pMƒéMâïCzü~K	n«úµ¤8lß½$÷§~äM†lQ.±„,U¾?ažF›Mä¥Å¹¨o‘ç®Wßƒ@ß÷®ÂEò½ËôÀËWë§x†…“àMp§ÕN|<ŸÉƒ‰sóÅô°¤ ÕrlñÝzB‘–p¡”†°¼~ðÀÚAžn`_$«ä‹Phë÷Ãã^*‰]²T—¤ñ@gïÖ*D¿¢íOþ×—ŸÖ{ÙI¡_BpÒò·šw“™¹“A›9Ð¥e%­l”Öçw“’÷!#­¾0vP Ö8åÇå£`0yÂñn¢ñ$ñfC/R–%yuÔZ›©ÈŠSBæAë—l\RÒMÎAøßMž÷Þž¾ëôvG©¸´@ŒÇŠß§<#<òüãJDÿ2‘×ø¾¤b:mU`—–Œ¼ºE6:Þ|{éˆüiAý'wJ‡¿•ˆL"ê>âÏ|*ÄNT²ci;Y—èy…Às§_CFæÖÖd"õE—Í3¥…ÙÀ—¼tæ{,ò›9.ÁÁÊSÿú3X
Š©ß\†/¦!õÜÁöµ!3 soòòúZ8ÎwÈšÉ™9Ý*ÅZf1ÿ2HŠšÒä¶&1¨'eŽó{ÊZR/a ÔÕø´:Œ€iÒñTe¿ºãõ’ˆ©“x 
|k>Û¬xÔ.‹¬´j‹Ö³T3‘W®;	;©rÔ›l2Ê„¤`£ë™ÞÙÚïèpýûþ‰FýÚZþ×l­|Ð…™zµ¤à^€FÎTX[ï³ ƒ7mØ~=E8á§cp^ºÈ:¶®~›?Xiÿ÷”5±‹#Üß‡«K„je6Ÿ0Ú±ÅE\õe2™a«²-<ê}•k *žž¼ã5nÎ“@šURãÖê£½$×ÚhAÙÓ+>’±z“nZ¬üØÅrùž¡7Ð4‡5ÔôÛ?Ò«rêAæö'Ieîe0Õ2‚ÍÕ^ü]ˆï5ã¶ÃŠ]âX±Ub]¥.–Ù‚½bî£ÈÆ³'k_Æ`·'á¯Ÿ…“Iß‹‹Çæ¼Ùjêoxù‰×‡}OY?Ë§k€0mÑÐrœí'±Ü³mnìŠ<}…Ð”]•êÛH¼xùUiÇùecCr”.íæXìÈèôbÔý§í,åé}ù;.¹éÌ¬)F³p¾Û¡7´Õ»œ‡1ðÈ:éFILºó9Þä~<æu²ùLV€Î8\°=Þ¦Ù›ÍÂ/TÕf@–h¬Ð‘Ó#6S''óþûÎ÷&É˜öÿ72™ùq¬#ËZágKñ¥A9j÷¢Á8k‚²ëÇÁÈŽ³F]ÿY*¼4$§þ`Ó¡Ýx¼tÃ£Odo:õ£8„úl©&ž‚•mÇ‹¼ÆdçÆ…[«ímy†};–ÝqÞaÌ§¾7€œÃµô„Úª
†ÐFzá`›ú;—óø=~žÏ!¡Wø]­n¾/×.çÓŽŸ?0Ó—ßm­—cÄ'ç@Xó}ß>‰Iyë?Ú@§öAžS»Ü;ul4Á0un°7îNiÇØæÅó‰wuÀï;Šz¤–6±’AáØì¾ñ¬®kùÓz–{iiÍ`6_ä,	fa§Ð»¦”õÀÃºö#\ìtþ‡éMç¿9§¤¶ï{ $ûoö‰^*›…„—[q7ûc9Þa9JsÒÑv$åVªe[Çýë.ËÞ}`3çîäñ‚º[:•²4·Ý>K·Ù(›ù˜À¾©;æÊ¸âËëîØ¶Ûë”z3sü£óÜ˜æÖ³.}oÒ£,7—²ÜzïÜ¶æ<‡Ù2.³¥ý^…?&×³ÎÂ/¹ýâ2çØíŸê|‡„¹ˆ£V©Oþ8ÏÛ6÷dÍíši‰³TË°G‘àÌíÇñÆáéI\„ÎHv‚¡NJ q‡b(¼Œë¾U†¯ãújÒ;Ë­t}MFÖ›!mužóSŠBâÅ+R…½ã3ÝÉ„šÑN²Ÿ®—c[Þ!‡Æ@eÛX™K—A„Ö7Ñh¤[”t#)Þq\«(A…¯Æ­†4®TÞFÕú¤7Åb=£“ô©ÄoÑ(î@Fv=Ýu—È<„U‡QƒÇª”gh¹ì'˜&X
²òÙN{À_þ+üÒcª†‘Ç@·J'nÎQŠG•¹~¯Ë=çñ¬<®•³oÑ£k]46É¸‘’Béð?ƒúÉÅ
¬³†@½¤’Õ%vez0F¡@Õ›¹›å ûùgòbgìçA6@QH¢ð“ÿ·`˜Œ_^¯ç¹283»Ô$÷ùÇS~¼›±K~à’7^™3äÀéÖnrGáºòì8K¶ÅâËŸ%æ	™qÆA¹œÍ„ïÖÇnqøŠw4|A¬EmrÑŽWl¾)ä¢ÑZ]/çL³ãÍ¾%ÇM¼ÆxÅvÎtSTwS¥”âÕÎÐXiqvvb0›—‚'ZVï‡RWÎHDîÀ2–- ~äÈŽØÃE4ð%Ü~B©_l*:4ü¯)njK^¬BÃG^×
ÏÕùÉ“¼¬[/%Ô41ÔÂåá9»êå–m–0—yò•:.	¬ÈgXõœJBÞû,²K‡Xœ&ÑfÖÊ«Ï‘u
+ ÄÎ`5¯x"Ù|:D7w¿Z‘l¢f;G°V´¢Us;´…qµ}l¡]­°„{µ}(Ut8q ¦ÕÀhdìg‡<{ö,g7èÅäp$/ø×I5V·„äÌ­õãO×Œ=9\PíÈ
8¤"·ó Þ¯x1øqŒ¦«æG×ÕC)Œk‡žÇæ²%)²+÷Ä£¿xDW'Þ¸Ûï & v9 a
n‡TÈ/X½9p½‘kßó`ª¡›q.Î>™Öýyžuñ~u­„.P¬;X™˜_ÖXa†Wl‡\û¶„:µyâ¦ÏøVl&¨¦‡HhbGWR€A3tÐ£!æjf5óÐ`	÷Ž«™Z¾o¡xnøŠ7n§Ã ‹÷ßÜé0ýÃÇð^}7.'?œéó»9º‚;«Î‡v#[RÏ18i[rBÓaÊØwÅq7«°’]×PÀ¨"â\…*ÈPü‹ô™}ký@~”âòÐO@Ð3m÷‚ªrqó6^ŒyûF'ÇÁÏ÷íÙXJXÞ««ãí¸cÉÒM·ïØu»ÒÈ4¯Z\i2*…áì×9ú"ð÷vÓ½!^]%'x|Î74 ³£WÄà/î‘Ykj±6ƒaÝ­KòÝë”T÷~±ÙlMkÕQU¼¾YqocÎRŒ}èÐ”ÍDÛ˜U\§{vFqãÐz›ÝIbJsÅÖ`Ï0ÆM_®t	Oá%`Ñ[Atc8\Ã:ÎÂ,ú K&9S±L’
õcdž0¸.ý¹rT¨kÆŠÍY!î)ÚsWhÏÌ'¸b´}¬Ëz¼ü"KE´–î±¬,ô¶‹C·Üqì‚l²¢­`Š]lâ–Q™œ¡¥fîþnÌã­,›;šÛÂ£¹îÛ¨aðàÆVŽ¸q¢Çv|V=ãzYÒXq:ü¹MÜñh€ffžöæ¥5vÖ
Ê,·ÔAC<#Çp%2ÀðcdŽ¹'Âs"ÇÇ·ë	#k—º¤ª«Ã’
wr­P}üJ9á±œ•èÍ¸ù/ò¼Â¢ÎÆEç˜ÜÄb•¥Va÷AÔ¾sOüÔŒ;Î÷úaao±Q×	±œ½ÿ_jõ!h'Ich4Ö,§êé¯íbm>ô©›ó•ài\?¼¬úÙuoÌ`Íù±ôCs3	·:ÞêÊRg´«ù§³üC‡—;…†øþ¢u”E‰žT>‰Ê>lJ1ùË†+Ý‹q”Zq¹ÑÉs“{¾™Sx“{ÃÇ˜Veé-ò7yœÄÕ|š¹GÝðH{!Ö='(ÕCÁ1./“ëG?yóv“ãËù€üËˆvŸ;JS„n14k&‚‹zÉý*u©NeÓ@l[‡B­eÙeY…'Vì’´~]@ÂÀM®¬bM¾{ân°Ëåðlš½d(pš$Š>Äf.cÉêŸ9âXÜ¡ºðœ.rx°ÿáÕ®$QPZÉÝYº5Ÿ\'[†Ò@o…?×»ÜãH¯­–¹ÍAzËÌ¢[øá®äÖ}eÕá'>¦O9ÕÔ¯1&|©kªwy.K"6ó%3¤îèwËW ™m,7;œœå™Û‡?œá^n}àÇ2¹¸Q0)+§>»Â¯e¼j&á~x…b¿Æø¾Ñ˜VÈÈJR<8À›mË³r£- «Û^ƒ‘¡¾õU
À]¯ÃPHÊ¡"ùWchýœë1´…‚+2ø)uM?tU??xÜxœ›·åÜ¤É›½?]¥´pÌ7ŠŒ2ñ;ä4¤
Õß¤`oÂž™Z„{ÇÌûŒ<øIÖùÒ«)»Aÿ†ÑUžR—çÌ˜w×,G°¥6Ê]”ßHÁ9e1Ù˜nÇÜ–ì¨Qs¥ûÏÜ3´P*¡ÉDþçÌë†~d6)étç›&ƒFìÚ
T* lé/:ð8ok¼£Ðm[ã,²W˜¨]ÐË÷ÙÎƒíÀzî¢^åIÆÂdRÞRy¤Øç^³I©p>XN)öÉSŠ•k ±5{ ±°	‰é’‹ ¦-áS/	Ô«ïs5tÃôe>Oá&¶<3·äÄŽ;?wfœ’…¶_òš>çSÎ,ø)Ôk¸£«52Kž^óïÍXÊßÒ·2@i)vò`á_ìnÐ×S¦±[ä~bÅØ+Ü
 ûˆã®q+î'tŒ£ñ»†±4{Ÿ!dhó¹r0GØ,+jD¸`ù"ÙR*ÜvàÖ¹
upL2õ²ÂÎ&ÂÞ^2z†ß5aÍùƒ weƒ =m#dPI8Ë½V(±ú2û?‚ ¼×M½sCÿ}ƒhb±`hN{Îž·EÞU}j3tYô“ß é[°ýËvaF¤yE¬Y%ê$7Ä6èÐXM¿¼DkÙn5}à'õ0²¥‚é@ùT§§ßó,#9n–sy“ýe	ÛÂmxÖ--	üð‡šÔ~œ8?Fóã„äÇ	É’'$ÿÎ<î»8!É·w}»¼ž\´Éw9i«.'ÉÒ{"9¸.$?f Ê-w°ó‰[ŽŒ‚4Ê¢åHarÌ¦W;5Jä«à'¶v% Ø=a
‡eS€’Œnˆ¦7Õ€(šÃ¯±öMŒ˜r+=Z¯r¬ÒîðL¼Ä·šøÞ>l	ö~û.&?……€‡[(iþÙïtúÙÏïbö…=éHÝ££ý½Þî÷@ >ÿFâØôIJâÁwAÝù|ä˜“¾c"89êíìu÷÷þóû Ns¼j˜Qý™’ýõ]Ð ·øÿ¼{ÊÞ›~Dn§"žŸÓ4ç§~4‹½­¡ZE”Fz‡è"òæù~Ò×gÙa5;‘N ó·,·M˜Y.dƒ cÀÃÙ‡•ìÂ	mÜ‹é™-¯èžA¹û'eÖ8ÿÐM)Â‘¿å Ÿ²l–ˆ:˜~”ˆª„›L–¸÷!nŠ)
T˜~L.&÷ßÀ‰	Ž-¡þ0ˆÆ÷“ôS*jai˜¤P«ubRÕ‡fFI­4lÅ…rÝhøGfâ"jó !‡oÍÍ¥U¦ªpJìE{òµ¸6ÿ”¸Aƒ³CÊ­¼b‘N?ù“›+p‹n\äòVæ`˜×w)n´w)Ô;´ÕLýC‘UÅdèŠE2‰U‰7ŒÄêˆ$lÄé)ÄÁê¦›p³¶òm%Eô×{âOI±Ôù™´sm‡¥(ð[Ï2Ú?f9ý´gCy–×a–7î:Ë¹Œâ¾õÆÛ(’«íý:Ž¥÷×nh®D4T]È^
wÚ
z+Î½(ö÷f‰éÚúïzÂþ ®e
%,é)„${–H$2¦]_¯oÔ7ëOêOë[õgõÖZ½Õª×ÖÒ„r4Kf7œná[Ú×-Ó·|‹0u¦ûu$1YE'µamâÊ¹ÛÌ¨JëfŒqâÏa›-w‘i0Ã9v¾7}lÖ›9ÅeF±€;¼çÓWWxÎÓ‡ù>óKxÌ³íÀ['•wäé†&§B¨:¬Á˜²ñpþôfzIÊän+r6
lŽUœ2Çß‘}GY9‰¢­×–sâ€ÛÞèÉ“¼øÞ®t8ÖG.FÀbŸô'áàÌ ˆ©%»AœDèÈkZq§ÏÎ?ýZçÑ3øë>æâ}Ë;êðœáÚnUÕíÜ™E(>ä;ü•í¿EABÅLÑ•ŸÂ“s…Eæ”y–ˆD¼Äµ“edáŒ]ÚšnÖÊÚ}oÉXf%Bý½F¥rÄX=gVnR”Â”}Ün€¹ŠôwL«G~„ŽAí¿½ŠˆØw¢×,¬öƒ^Å!Ô›mý·¦ØnûqŒ¿ÁŠÐìw"Ø,¾ûƒ`3ËkIrMÍ¸K¬y¯4*ž&M[ð²JÆõÇTKUÒ;:ÂêòÈ2>9~qM~!
;¿¡PÝC†tCaç÷E	ú³U”ãÇ’Ó¨MÆÒ˜)¡Ýôk"Ütc¾˜Ä¾95ÏYL¿}ýÑà:y¦>`1wˆîN@Ï.€?-Î¦t&Þ¤C–áæOKV ÛT„ö®ÕÚû2Vüi%ÇññÖ9rv>wÝ¹6D”íˆäçŸ,¶~—‹Ô¬Çj^]7² ™qïšIãF9i\v;G*¤|Ës	„Æ4v©¡Y6
].BÔ¹ ^‘ÇÐuÒ:ù‡»X‡Ôj5u=¢ä^UXS—¥ú8]ì1_£TìKýÚMü…T”†˜)5lé2Ò)‰­¯åç½(“˜Ã)û
£3¯×Ò¤¨Æ§W2ÎmÝðôG“E¬<,cžfª\Œì½y‰Zé±¶¸ œÆ¨ñé6g&1{ú7$&õé=æý ÕœŸj*Œ+[˜ïRâ®&³Þdq„]éÚŒgsbSC;ô{^àw+I‰d<0ë¥¸¯\Rh]<èµ.[ $m)9@Md3érÉÀûRvƒNqîB‘]¡õÄP™lÉalÄ4^/gT€lêN_ÒûÅêxÝè¾Lœ!Ôrpm0e’öfØ?Œ® æx3+ù¤ôO3úA‚#Ã²Ã›¥‰¬l¾r{T"—m•pº¶Ø62Ï:z†Õ±kü´ÕÀ±¸êÉYmâõ¬2YjX
è+U4NM†î˜ï€Ñï¥Ðü­$Üã…–àW E¨Ç›ÐDe»íP¬åÄ'È?%µ¿®”®Ûgó­ÒUÚ¢J»t•uQe½t•Qe£t•MQe³t•'¢Ê“ÒUžŠ*OKWÙU¶JWy&ª<+?•©ŸEk­|¥Œ ZäÿýßÿS¾bJ­v^Eû±¸mÿ÷M™$:ãÜGb·a‘Y½²4‡äÎçå™õë\ŠÇÑK±8Zc)Gk8ÜK'	L<a|—<j%ú‘‰C¢YËG5ìk£¸fÙYpšñV
·.¢lˆgÞ^‘?]k¥n˜Éí£Yºƒ¥sú¼Áðl–öNÆáÅì£ÖÜ†z?hz¥öÓ¹SJ³w\²ä*<aËÓµ/ãF¦u““à&Ár`ÀÌýþyj&ÃTFÞêi0k\4Î¶ÖP×Ódì{Cåˆ(	Ÿ®HÎijÇu•R2C€ø&¨bÕ’xäE),Ë¹)TiÓ–²èBM0þ	vƒÈVb·mX1l¤·|_¬&ã‡îŠ]$~ø~xL¾‡îH]éTþíN©óš½S[Œ˜‡$Û X,ÜÕ/I‚d-rï},æþ;•í¿ýí+Ï‡ Gr@ §^,ttú@¢Ò5;fN:í:ÈG²?åD¬ÿ.j%xéòžòho÷Ãá•Hè·qEøå”Äž‹¤P2Ûc½Ð!AŽ„“/eL¾2S+¾‚
&5§!IÌ—ÏàñÖÊù-×•–|ëM~Vâ-YÄá… ·AtèÅc=CP*Àxƒ,ÙítH¦Lº—÷}þ	3öÄÌ‘Ë<ÚX¡Ýq*”tû³Ùq¸ô,¯f–×,8È\Sr@°dÈ5}[CæA˜ECÏl˜®œ±¼Ï¢¼qYd`4þc´·4Ooˆx'lMÅøöAr†3´û-£çœ¿&C£5xŠ+^X´1~S±æÕIŸî_k^“‘#;ójZ_~™£ÁTÁ˜P;Áå°œžM?Þ‚µ¹nËOCÕºØB2´òp÷š´î¤DT0›ã^“ØNÇÀ“u¹OÜíSt;Xsyž¸(¥´Ë[ó.ÿíª½P­I[E`u°		ÄÎ6WÎnT¡\üÇÐM4üËJ^(ÝAÔ8ƒÞgs9½Û:Ï?¢9M)÷WÓ.oÓ£;à…áXh:v+‡MÈÂ$HÑß¼%g;^/×¹sy[©]åŠ9ÑZžË!‹òMX·LãêO§}u+Ç¹± Ç¿iSó¿Â`V«Ö‰ý¹,¾nië>ù­™ë–#“]Š‘ð>Ùf®Q*ta83Á~¢éz‚¶+‰ÄmZ›û"~®E¶Â7j2C–HeOøéÚ,å¾ÿÝá×&NŸæ#GŒ×~¡ËxËït)Ï;¤Úp2§Ûáh©à´wÁ§{±­kÇëÌÃw1`ž ¶%9kmRNÌ¨uŸß Êãïµ21B0 Çca9€âŠˆ‹b‡9ª*1"x N)¨./ÂìŠ©|–òÃf°[wÉ€¼$f˜PÔÍ££Ú¥HÍ‡# €xôX¡	ïHÒÖUnÂœ•Z~*”\—O»Ò<É2t­§¡þô8ØÝÁOïÅü1ÁÏ¼•oÉU«ÚíØ"µœà£Yc‡“¼ÌºÅÉÂBâÃî“H8÷Aû¶l°Í§xJý»ð„T¾dÌÔ¥‚X]SÃi0Ã…±r¨ è1ÅÝ5×?æ±‚~…'¯8g@W+sÅ7RyV¼™DÁ´¶R’•YK—	ùœëû›}–Ž4%n×p`K„E‚=áæYËìåjîÅïÃ¡7AKWD¥_X«0¼’â™µgþnŒªô}¬ièÐÔFjó˜{4ø/l¸J:g¡.#y!`ÆÄŒé††J(bžÕ1š Ò¨™²WÜ‚”›w®8(Ól«-\"×so‘ð:ÇSÌ-›ûG!¹Übüã.ÞÖ±2Å!~r÷Ž¹|ç®õp¶M|N$Ë,Þû\†ô‚²Õ»V…KPÜÅzèX9ö§á—4KV~¥Âryñø¡›à¯@åá–ÒvmÆr¾¯ÛÏuÏz §º†PW‡súö2§é]úÖÁÍ£Gl³søþý¯{;ÝÓ½Ãƒßá×ÑáAïàôö6g•žÈ*CvÂéö¸–n«N*ï½~{³ùkˆ/>yñ¼øðüÑ£sØRFÆSÄû˜#lÇ‹†T(Ö®qÅÇÉbHƒâw/ûž¦j{Ä–>,‚:|xP©¼¿¯aµüŒéMX¡ÍV{°˜R+úšæà…ÝtˆÜ}‡œ˜pÀC@±>Î>È°ucK_Â`(Ãùªƒ)¡¬/¼è‡áÄ÷f&ÄðŽ]4–@ÏÊ?ºa!-Ù¼-b×Q0i@W©£öñ«íÍÀT9I€UÕ(2(7qL©ÃEë4\gÅÞKP¶è¬M8y’DPˆ#K2áþÞA_5zE©Ry.U…A­ô&³h©ù4®Jmõì¯5ž}X…!T*bóË7¹Xs¡LÁï/^’u,pS'g& ²42Äì1ð/fQZ?$K£c‘C)¾SÓêmÏÓ·•I´â8a5ç‹þ$ˆÇÌßúUóì³ DgŽCä 0ZoÇŸ`\ŸZJ4Ügö‹Óç«”>†U­fƒukøc«I9/Œmm5×2c¹ QÙn(F—çòäÑn-•Þ“É·eÒl©OÇ~8ø„ðW„«0•íøLˆ²5eŒ…ê€ŠãHsçÁŒlf+ûþ·.'ÛÙIƒ•,_ì6ž¨Š®ð±•‡à0$† ÄÑÍ…OÚxhÇé¼ë‘Ÿhú¶•Íòv£b„’G¥óþI—ÐtT¨ß{—ÔQÇÎÑ(Zö›®õ±Äw§éxøwÅ­%mb]æ}	]W/³*i*¡”š”ºÙ!·ÂQÞ{É*\ÖšMZDãúŠà~©XÔ`VxàÙLHD”iI ¼`Üd[CB³ÎZ‚’L0p¨c›™Ô^ …]{®‚Æ õÞùÞ}’þTÀŽ©¸Ù®ÄÈ„Ù 4cÿœ•ƒ//Þ¾ßß¾ô&>:km×Ðt/w6öâŽG@ö`œC0KP@ÊÝÓ™LËË	´Ø@ÿáC“ÔšÂÅYöØ2×f!yÂÏBê~Æ#‚pëƒáa±n8'ožýÞ==íìvvz¿ƒrz¼×;É”>~m<‚±Öaõ˜Õ8¦
ï_3µÛ¿,&Wøow1áßNü9È?IÈ¿ÀÖI<Þõé÷¿x³…ÑFÞøýH|	jiËó(˜TÒÀæ«)4”EÔ¦u/µ}/l}XÈï—¤Úªf[ZºXét¬jôÕÕ,½”3eãfIH6“êõþ×–êQ-bx‰Ø³•´ç©gÂb›KŸd×s®gÛRAK´ô\ð×øÆºø­²0m8`J¿¥_ø¬É`R¨:dZ—ž1ÿÊO?ùWP.k>•|+²œcTÊ,ß‚Bé“«Šºøeo.±ÊO.uáè»òÀË$^ë¹Qôµ\´o)ŠóÅÚ‘ø_gZ9}Þ`OµF1ÙÄK—‡ç /ÔÇ˜,A3µHß(Â§gEÊ(ÆÊg ×óÎ(K{êÐÒª®Hû&QŽÒÆÇŸ®yC7¿ãW©ÎÍGCÊNõé¨“™M¤‚nž»Óƒ¡uÈ±? \p)[ç[Žm¨w}“)E.n«(›F¡ó0êyƒ1C_¶~°A>f•y1¨ -Ð{.^ä…ƒ8ƒ*¨2šCïŠ*4kÏU¦ÒÄ!4ìÏIß‹ƒ›BÚ&)>é{ƒOKyŒM³üa…ØŸ» ¸±.yN©Ð”kr•)å[Î.úì©—üËtÛG^Á\á!0ß–zi!ºšØ<*ÍöaëóÅþ†WÉâœ¦B¥`ÚÜ#Æ©ýyoH¤4ãm±=%˜Öx6¢ªÙGÁ ÓÛÙ¶ìŠýËÄ	M¿Y9ñgüó.	SI-½kú3iñàötofØXZd] JGÄ¥—·¸ZÓåû®¨<ÌcY›\-Æn¯½zÔõ³9	qíî„S´WÂ‡+Z¯q–'h‰žå¼Hwé=Lðü'-‹—  u‘¼Kï¾Ô1Ê'>4aµ„ú[…4UÂ4‚˜N±Çp”Jwo@!ÊHÒeì²¡rEÀ†MGbžŸÚ1)ovÅ
Õ<
~‹joˆ0ñÄàéFHÃ	&Äæ†HÄÊ‡çâr'å³Ê ­l›hXPÙ¶KÓsCÙo»oÎñ¸&³ò„%öæ«u\ÒÇþoâú–rÞöÓÈVÞl8áImpBkn0„ÆÌÐÈ *RÕW¶k²J¬¦k¨8\L§ vÑ¦\W>!'O‡æeôÂ›rî±‚?Ø„›Aü)rOB¡@{µža!&rHnYªð¯éâø^ â2[¢OWwOýé-^H¹¼Ve¦má@OŽ}f´!û@-‘7¸ÊÞ¾	&Á<˜…Ù“Þl„†ÙìÚWü)ÐÆ Vf¿NÆ<’_òúÞ,ö²GÝÈC%GÞº\Ì¼©uVò
HïŽ$ ‡F‘$ö ðhîÍ¡·ÄI­­à….›¡¤8)¬,‰¥ÎÞ†áÖÃl†K…ÇÔf'œAÛ	Õ÷Ç;Òðgö«t¸‰+ðá%øk¨[Œ½+yü½#	¦S0ž…“ptÅ'dv0F@ÓžHít¿·²T©ð~OšÉîQï;òÜ1eÿ|£…3–‰ðýõDì¨%Ñ¯à…7‘àÄBï|o"S­.ÓE~Ò;	nÞ¨8LŽŸ)]Þ\ÃÊ!ô²SÖ‘ðÔÙPâ"lK&¿Ã\ÃªLá;¨zÂl(´..EçxI\òö¨­Ý2 ‰m=×:<ÇctE¢[õ‰×åw€ X…%.ûgù²¦=ÕÒV8;=ÐkHÇÇ†òdîŸ¼=ÜÔR]FOßqˆ½e ¶Îƒø¹W¿,\ýeà².—°Ç1ÀBI¤I¥!š’5ð©çP±Ôz+¶eJµ+QBwdÑ{±ëhZcºªFdR¶ëmºæ¦¼J%¿<~®œÑGšvFWqžÎ¥j]Ú¥rV=C·òÝ‘‹Ùès‘ÏW,~¹—)!ø1c€î¥/3Êe™€»®2£ÜP‘‚£Cn€Ä§šþ›ºO±Ý–9Ð þË;4Ã‹[%ÆF›ôŽ§ LkM‡›5NO"&t&{,,þã—(b#¢º_g˜c3¨§uMèÉ²øøA°Ú¶kùÅæ2N¥âÜ2ô3±à;_4ÅÐmí¢/ÔÈO änv@*}Ãn<·¯ð-^ÆºÐ	,ëÞ_ŽÐcx†º®Xkôm¶ðl[ub_xú‚.G¯J­_™V>GLŸ|
ædÎ¢‚P€r«b]¥c7‘¥4•CQ2=YwùËÓ’FAÚ¶ï¢H–N ©7K¢+æUƒ¶AR}WøÅdnä_¤J½0ªÚù ­ÔLRó“€ÖpÃ`§@X„µ8ø\½ÁGÌƒ5(|ËIG*…àX
1h«¯<&nUÇVfPl½Q¶2)ÞŒêô´q@¹¢)Áe‘0p|À+)ª\ß®_¬Zf×V(uï±U@ÖL-Kó©¬/²¡5#¶M>èÀ™ƒT_éÃ#¿`škãžò+xùAkÔ~|œ2-eb›T¡YùÊ¤P­å|Au&¡þÄtÈ«&%°Ájëóû©rB²Æ}R:æ5£·þo´w¿Àß=Ñ½VÌ³»ÛÃš¼ƒ¦’`ˆ<( ëÈÖ
§m:JÕ
ÓbÏëgÚNi1õÓä”îøŒVÇî
ð¨¸/•`‰Óçj?B §0«G#çéìAùÃQÍÏ‹”E‹¹Äå¥R‘ýº­£½tkM9ß+Û›i5Ó5aÃÖ//å!þ™,”ÂsPf!Î}¥	ÄŸÜ¦×¨¥ufëqUªk@²äÄv6Ä#´ýpR¨]ñËâÿ‚“:6iNTi'éÏåÙ{²+ý]¢™G.×1NZèš·è%´çÅW³Qïz°{ÀŠ—¦eàÊ˜, ]cÇGËÆÌÃ²6jCþ²b¨ŠŸ¡ðç…]Õ²úur1ö#¿VÝ£cÄË—Ý{iÏbx¢mÌ¼y<ñDÓ»ðªÌ ãÚgM=VŠ7a«—\ÙÎÂ‡á 	XÓ
ð<>[ûðÜ¨Ëhæµ›CøYS¤ˆ:Å5QPÛ­(>yµ¬é&F;<ç‡²ÔÜØ“J¥S"_QˆÜ^$§ŒÒWTJw²ÙÔ÷¯æG‘®B…¿	Ã¨Véá?Œlé‡±ØZÀºšfË~jt^KÝ6têÑ¼ ý)º›³uÇ¾+k®êM@Ò¢çCœÐÛ³au»FËQç¨Ó‘:¼>„í^ãýUó<
§ Ð3ÔIIèÚïu°`M¨S­Í9g~¦ Œfygg­:iPVë›Ì3Kii4Tcéàõ–R]óá½Ä«b(6"ÝxÔU¯Y†z¥_‚8èOüÌë"Ó
\øåyQ¸ƒQ}õ@hœU[°¥ÖñÏFõõñ‡RØÕºJ›X
³Z#µ³*«©ŸÖåJ~í¾œ†Î$÷œmˆùÆˆÞ“do02‡TæCcýæMÚœ*Mlþ²¯’*å"„"­jÈ±á½sÆ†Iý–ÐèxO]Œ>0+ëœ&eMöZx}þ5s(œ£ö‚Ý5yAñÂK_°Zâ9Uw$O1¤5UNd½×ñè7en:ìu¹Õºu´M¿¾?@bÌ.d™;ÿ‚+0kÒ²\}É¹ôbÞÔh´èvõ ;¯F’qS$ògLþ¥³ñµ´í´âj$®23âïàî¦›«-ÛÑ]Uzç.æ[*¾‰²mÛTŒ—Ã/®ÿrî‹Pôvž‡ü¿N¬¼yí.¨÷Ê„«’ÇøŒz¬	bB•CY±+¸X6ï: ÊoGÂŽåÆK”´â°*)Mî,¥’]o	ÀÜD¾"©ö¦`/ˆ^R}WnB…6­„ïÀ.è zÍ±ÖÄ˜FÜ0¥ßÊ¡¥e4Zñ«lY•ÔB•º¸	‹Zc¬ƒÎö‡²U
EÃ(ù,|Íº!ïƒ€{¼^“!^Âu¯ÄðÔ¹^L¤Ðø³zìO½è“0ãV½<ß%S¼‘(nvY±LåÝgõHM˜ß¥;˜Ú½¾ÏÆŽiÀ ¢EÓzî×æ£Š·+?ÀŸ*¯U¥BªZEÄU÷wþÚÛ•¼ø-a'GçÇè¡qr57Ññþ_‡l57çÉs2æ)y1ÞÕs#äýPTdWø;¤5¿$°} Âú5úyÚÍ-Â»'Ð
»,wÁÆKsÏ	º(Ù°X¤òç[çÞùà9ˆñj:„Ýh|N.‚!*é[ùâG	ºˆB,ªÍsžâ§ëÏ7æÅõ[€Þ²v–„óç„ƒüÓµ2{UÞMr÷Ï6¼õþVõÆ@éO×|0Õô©§·äU–Ò»ä‘ºDÖ™h´óNXzU
MÄ¦³»¨ÌM¯mñ~¡—W^_RÕ¥ÐÑ?ÅŠ¦~–-wræSÍ·5ës‘z²•õ(a–è(SMv÷e…ïhôZmEPð•Q Ã9PÖ&èLm'Ç½Ãã]=å…”âeÕÔ}¢e­°…0O°mµÎ7ÏŸÙV%ËÄx™U±B^ž˜4#]œ­£oz¿Ë&þ§ëCfµ=;Væˆ{ö°'ÌÐ¾­°¬\%^£}YùéZ™e:Ç7•;GpÉó'þfÆX°ÛÈ>®ðp¤f0Ò»¢XÀd™h¿ío¯¥øß`TwzxÚÝ7´DÇ×Ä@Yý0TTÙ¶“Œ“) ©¤;O;­ÜÞ‘]KûQ4¼3&V[ÃkÊªÿÞ÷G6¬ê”`É’ðÂÉbÍ]°¤PÝ°ë¦²‰™…¸Mu×»Šm‘gîBËÃé …£Eë(˜ý{ª¬vÅ¤ŽA75c›ÂdãL 8ó„%àMîB×< EŠHŒøð=ÔÇ‡›bœÇìÞZ•æe–-`LÛaóúQðæ;$Jm0Î¿'íöÿ $j1”>…:É‘ñoG^	j4›aÍ²žîÏûõ÷"Ø¨Õ<k‰kÚn®öÌ6Àù´éP-žIvE©äŠ@ÞÄR:m¼<wòLDhÄÕ`²7Ê•Qf76Ô;™[ŒpG­l–'á(Äs`?â»i12Úl¸à3Ñ“$„mp«H“§gSµ²ð-!oQl¬ÖÖþôœˆYÁÌ¢ÏõL…"¾™}†yû(7ê¶öÈC£ñ„³MÇÖŸR¢`¡†i¨ð:m6ÿLÃ1yå‹`:"q4Àí^ú"Ûå¥–Ú#‰ýéVs« nf‰ÌžcÂ¥ý_ž6‰Ÿ2˜[˜ÜÇkáÏ…‹TG‰¯š’`˜»½£Þ.Ù?|{ÈHRË4k°rî¸äã›»â>s Ð‘Ÿ½ù#bÿdçÝáá~yô«¬ÜGiÀ3ç èÒÐ¦˜è¯“%DØŽ}Jo€ÊlÄÈÑ¯tÎa0q–ºm­½n!«vwš²è–·þd•›]îE	5IéÕ¼r <[zÔ
ls«¨àæ‘?Â›…ÈÉV»•òs1™<—ø=æé‹•2%1ÕZSôÕ­—‰^|’š:¤3­ºˆÙ¬@B¿¶Ìá0d+áI&z› ù#Ÿø ƒDŒKKëcï—yz“>|!£0èÞ"fÚ™ÂsöA`Ïü¨Š{¾pû<éÅC‚±TIíäÍ³»$W9»t	¿ýl½/«.kT ³Ž~\hç+D.‰-ZLe}6j¿Å@.©"kÍH
²Ci¯™B%µ‘>ÝÜ|‚JóþñA'WŒ•èPíÂd­vš¤ëŒß7™D3iÔäÿŠûÿ¢ùkò¹ý7Ãv~ºï{÷ŒàœÕoà‘L³Ô&<L,»1Ã¾¯üAqÚ}{ß(µâ-N4òÿØ4xÒûû7&Átaû—lT¾=îîöÈÏä#Þ7ë\­µ‚ôêAå¯2.¦èÏX5ê:•i9J*5ÒÞðäž·›©%i¶5øG¯{üUXÕdQ}°ˆµ]ˆ¢}4ŽÙ´AÇ:OHí=èVð»N0˜—,@×¢‘;…»‡P¶x0š±×ìÎ†§¼lŽ¤”¥ÇjŸ tó&6”­æú¦¤N2ýMV¸æ9—³0i°ÎÙ­{£ÃÌÂ›m_pSqDÇ\WRgiíðãVt†Œ˜ÚŠyI</bº“óú°“KXÄ–¹Ðp¯ÂEDcœ¢±l°€‚ìc©·ÛCÐƒVLþD>€ÿ]`˜tøzZÅTn4’ÛêÞÓ,êÕþüÐä Ä¨/ B¼ pðëÐh<	É§YxA¦Ø“×‰7èëb4r÷šN~†,fÆ\“,g)éljS¹¥*Î¥ø‰´Ä…Yå‰¥Í¶góÒ9•±3±Ia[µ³0îˆZm}ÀªÓVë‰é´…v”¯{,ò»²Õ±5Ëˆ‘ÄXñ*ÈúÖ¾¤,âÖcÑ3`±¾4¬¹'jsO6žnlasµÁ	5øEÌæÐðFóG6heK'zâ^Péß‘ÀÒ»RtûÅÉÍ¸+õýÓ–Žd•’Ç ˜{“oKy²&ê² ¶m3qWa o ›ÀI•¤p¨&•{6bØ$}[·›”`ÏÌëJ¸àâêgÓÉÃrNè^V|l?]cê©UÅÃ—9;ÞüI2­Û~¹e'O»ms(eÍ>¨=^ìvRµúÆy£º‘Ž/SÕªÍåèeCöËµ×WŒ¿Ö¤Q´Låµ´¾¾ÑÚ”üñ>ë&Tså8<pÊ.(¡ Ãô^Ê”k+ÂÝÎïy@“‡çD¨Íº…Ú¥ªéÚé–•KaZº¹hjoYö–²ä.²@œàP±¬T¶žõãùsžËD$’ºÇÞ·Ê÷^N÷}R
¡=XŒè¶A—»1=`x ôrkêò#|ˆCbI·6dãÏŒe]Çê´˜{FiÑuîAÛÑÉ UkŒ³	ö¹‹æ\–M*ZÃÝNÑLëF¡öœgñ(¯âþ[Nü=i´ßäê±·0;‰J›'Ò–¦ý¹e¨ívb%Ç`Ë]áõíLËb5`S¾ƒÎUÀi[<ó¦€l€ë?°Ø¾‘È$» –Üc×O¿7Y¦Kûûe›Tå8!­÷ƒ’KNÈ~XðÝèÓ`YKÉ)¥uÉ»oê£p.èÍ]ò¯Û+Vø Þ›y,ÊêÜŒØå±+æUÁ¨Ð1òpARþe-·ÝÌyù&ŸÔ^áæ59PÈ-äÛ€æ5¿á.`A¶ñkÍÒ‚qûuÊcÇÒÊ4¾+vÀSU‡þ¹·˜`lÅk‘n¨:	g£ª¡3‡¦ß^daoåX"]âv­$¨AˆÔyÉòòÂYRžµª-ÚŽ2‹4ÖN8±FØ€=öº>ë,;e+ŒZí±?À¿0•%ßòHÑ‡aéRXm§y47Æ·t¤QÉn–¿ÂÅ\H©ÅàÎ"è¥×Ø1F–Šk{ìG3äÞTÇ÷YÞ‹,Á+MG“5Ë«õ­élRï_ñÅœ¤c<¼±Ç½K/¶uÂÃÂÙ“×©«°B%[lú¼j‘z9U/¢ˆFgd(×&áPMõ.âßû_\•hê7ºÍ2¶3|Û -ŒH‘†G#2ä
H©.íkEnË\Y¤ñÁ /ßÂÿ]DðÊ¬àÍ]ÞQ:,Ì¥ÄK=Ásq‹Ï4”S¢ —¦_Òìªü­5Ô!¿x\sN÷ƒÎªñòô8Ï,"¼Ü÷úÈ€îñOŒ©ª]½0ÚWó4©-uyÂ'WciÜ³E%ÿ’Úê‰”Ðé-g‰•ÔfEê£%Û|œe»²rË€¬ÍŠJtr—Z=“€µØôSêþ·E—£º©t:K¿vîÝiÃ› ¶±ŠÜ P­³Üÿ5Á¥Ö1º.IlÖb»FÔ+G7Åã¶œñ?[fÐÃ¶³pÛ,¼î,¼nÞ°©	öÚè@eqG6it›MµJè¿ ¢²å“ggVR“¶YxáÏ¨IHÏÝ	ì1ç`¦!¾	#‘8þ‹7QÓÆ,¦¹Ð*J‚%-¼ªD¸ãdA?® û•FEâ-ç{^k,¾Kn“€3åÆ-óŸË}Ûr™C_ªŒ"76°¡˜”ôÓ¼c%oòƒø=ªì,3í­+:éGáÅëÑrDcGnBàù¸T råË§û'Òæ‘µ­±¨	ôæËG%Þˆ•×K¼ý§ël7¦›‹ÄÕ\MÝÇÍ×ÜË+"8‚X1™›ßGi¤F42Õó_$'ÀcZOfGµ–±NîoèŽk­VæSûÜB™`¹Ñ*EžTv˜V.< K õ¼ (€´¶
ò†²o}{¹([®KŽ;dŽ­óvfzéû­öú Èeqñ¥Ö‹Wzˆ~´º­Ø/®ÍÐi}b±¥ù;ÒI»løx•oÕHøK°:</§ÎœF“ÇÀïÃ=ºÇ!°ŸÀ`’ì%éÉ{j<5èÌ¢ÅÜß:k7ë¬êÔrë¬ýcýXgß~©±†íëlý»Ygë¸Yn­ÿXg?ÖÙC¯³ÒhQÝ3­½ïfímÀ>¾`íiæ ¬¾7~¬Æ«ñ!Vcúuu•Ð€ÙÌ%Ž û„¶ë†å)EÁ]"Ï‚faYVšþLRòK|Ñ³ˆÈ}Qƒ¿—Š|A¥þ]ÖeÂÝT¶™GÇ³´¾ÑTgM›zÎÃØ²ÒŒ€™”ÕÆ#d›ûÆc°QœÏÙp täúT>ÙUŒª.JÔZ]ßÓ± €ò…éïÈ‹/¡¥^’§›Ï¿ÚÂvÓ9ÆãÑ¨ÏO·6Ÿ²¨Ïýg­AkP½áQÄ²RGÝ““Þ.-ô¦»·_zúf4äèRd3š”]œ&8^êl?;×U'Û8õM]ñ™ÍÕ #‘8³1³2B]õÜF®ÕÎ­ÕvÔZÏ­µî¨…Ç9ð‡¾»«ohg8ø±´à, æÈÔ‚¥BÄ|a·æˆñ´øä?öÓFhf×eOAä–-'!®æ'"âõíNE$XÊŒØ +qBb«f9)¡Å”×%ŽÚ¬®®h1ï…áE*k°2Cufn£Ê_Š§ýALîm iÝ‚Ã†ûE†{“¨.ðÚÀyÚ`ÒÊÍ"Ä´
3„¸ÌÂ÷ƒÓtgGˆi¾ûfqÙïÊ ä¾l,v$™v–o†$—¡Å†¤‡á€¦öíšçú4h›#«’|äíQ—ðÔÃDä¦^M1¨9/Çô¼ä¤Ôý2bÎ¹¶¼Å™à£Þ{_F8[Ž„%_Å¶°Ô®I…÷kr£K¶†Û€”×´J\Ò&NšlMïº¾¥¡V¡æ¯gÇÈ±?ºL"Ì˜h_ôŸ®å©À³{‹ZÛÖk+²`Cûm&Ö:‘þ†ÿDZnÏZýVß‰QÆÅY½Q—ÿ½òÃBæóÀí‘"rpWz2÷f»Áˆ%—7%Œ‹–Ši‹–ryóýw‡Ï|zÂQpyK¿Øö¼½ÞözÇÝ}ÒýþyÛÓb”h¾Å
îÊœé—é~º–JìÝ«\ºzïÅÐez&MÆ»üôšÎ œ(SËçì]zuÁ6µ)(¯–Ò7XÊè´rÇ’ÂS$¥)@‹’pf×„mÑûd¶xlöp0Ç½£ÃãSrx@ö{Ýãƒ½ƒ·äèøðíqïä„tv	r““÷½ƒS[d˜¼4ef’²|!yõ »%î+æÑ§Æ•—J®d¤3`‘ÖËŠ—ˆÜÖ|ÏÌ»ôÓµJti²³ƒ…5ßÙ] Å»Ùp…ovŽGÊz Z’[9“Ý3è›KƒNÏ)éI(UË,I°îÂ'kËBÈmtÈŒ+§êÂ2s—ÔEæF.¯Ý`Uøç›ÅdÂ¶rxd1íO®(û¤ùWÃ(€áÒ«ò
#º€—Øán89Ð9Òåt2‹;áËê"šuâÁ†7 Ê(ŒÃóð3í„ççÁÀçÿTU[7«~Q¢:a«ü²:N’yguõââ¢y±Þ£Ñêéñêqo§ n¬US´h8žú‰Gc¼E™¼¬,’óÆ–Âë›nŸ¼y¦D+ß÷fÃxàÍ‘Öh¬ÂãFã¶A£Ä'Ó8$Ï>Hï Teú/:ˆq@èƒñk4{ÑA)B¯0'/Vù/½È†át»µ¶†èw½Ànx&‡°g™W}F¯ÑÄ‡¥¢¡«
È/Ÿù³apþ¡ÑÒ•%·÷?æh)P­@Œ©·Ÿ=NI»µ6ªF@Uk5$ê®,Ð¬æqí×šÁÌüëº€ÀÀâAŒZß| …›è°ëN
º«\ýZE*PÏ½i0¹}øY?
ªuRíF7/1ÈÖDp®g1Æ™£}|Ï5 9ÿÔž»ãì+Å@è
’Æ	ž•lxÃÿZÄ ø—Þ q›²9¯Á¬1Š€¡«£L¨`9cLXŠñ°MÐ¾¨s"kóÄU$²ÉG¢ÅŠõrãMÔpp°vô`r[‹"ËO[{m_áê™6q‹®Ù±Ñ’=§óÊ¤¬VOÏ·[Cò8˜"#÷fÎ‰h*ª´mE‰ú|›*­òÚ­ÎZ×¿‡iÁS»µiE¥ðÓ²”•ÐÁ¶÷iHå¥=Aƒ©¨1X.tm¦ñ(ä#ìº•}-lèðç¡ËÌ¦ãåañ‰Þ±%ûH.È¶]ÄÌLí7o<4d\Y€AÕ.œ][Ÿn»].·ž¶½¥fPÛ\–$Ë>`ù51Ÿ/ÀX©ñ¬ëãqxßºV­è«L~ª¿ñK šËÆBÞy__ðzD¨Â¡8Ùúíhç^(ÄàìVýá¦ß²bM‰}–·†´kaV­H{±ªèö/Vå½Ó-ß¥dŠŠª‰vFä¨û¶GZ¤vÚ}½ß#‡oH›ìîÿúþàd…È›
Ý•jE©iQf…†1ÈÌ+u¾ß{sÚ!‡¯OzÇ¿õvÉoÝý_{'äg"eÍTAam,B“ÒA±eGí¥\¨¯<[ž-¾ËóxÚëî¼ëß£%ï6¼ï»Ç=±†ÞÊ1îå„d+•uR‹õ,÷¨Û
•iÊ±Š ®þz¼7­óeÌ>OìFA9î3“Ù¿ßkŸ•íp:¥Ž—©Ã¯»SKñÜ…|[Êwñùé:ìÃ†ð‹?üfPLJóöFŒŠYËj¦[3`žä¬Üã½·ï`éîþ4OŸíöNöÞä¯×tÿ‘»`ÓÝ†u½í*ìÁôÔL²öájOô¤ÂJ°jú¬Ÿ®jèG¾÷©Ñ÷A¶Àzð&ÞUü†î{7>~Nw¡¬ºë¦ÑÀØ3ùû‘•O·ï›O«ûŒTµœ»Í9÷n¯‹³¯Îÿ%HÝÓ_{'u²Ó;>Ý{³·Ó=¥ŸwNÞ Á|¦þÓu^f%@[,€îNw·÷~o';Ñaóô.óëK!{ ¤ˆT-ßhóµ¾wÃ‹Ù$ô0R0ùÃ,ÜýIØçÑ_Ã×ÚYõ-Îýóó*ùE¶~¨Kº#[QUCF±4ª«Ó?6ejR®ò
™ÓëráqÞ¯ÇûÍ,ÆÄ?¤Îâð»†Àh…1WüÛhyùÞÄÇ_µª—Å%ôšãÈ?‡²Ðxöl(Fþ’|ÌKî×ŒüùÄøµÕÿÿ²:ª“êïÕ•›ßOÞ<ûý}÷þ{MÒCôœ€& øû&ªy@@Î§ÌÿK­ùÓð‹¯WBœDþ—ð“„C4dÍ¤8•ˆ¦6Wð0ŒjzœÑ»¤fû>êTê+ð6	Ÿj†^Ÿ–ì]h°šäIŸ€|ê‡!FgüûþÉß›‹$˜ÄM|ò;Œ”	ºžÐÐûg ÊÙùýÔF>¼¥{³‘ŸzÄIu'œ,¦³k´ÐL"}ê¤ÎÒÃb©ÁÜ “O	hJ÷Þ%/ûÞKÆMøYK¨Ì·k­›
kŒ(øi€¾_è•	©9F‹"NŸzKF_ç¿Ã9®s¶xP{…R
&Í“ìâÌñÍö†ò¢W#8P•ü‹TÙŽ‹~¥N
ÔAI)ó9bôÉ¶= Ó%cÌsUýjZš¾1+à¹*œì}ZÕÏWâÒ…Ô%å§cX•¥ˆnŠÐ¡Õ–~†´3å9S	¨»f|Q¹Ã!.GÑsc¯<P÷ÖUåx5Å>¶šB÷¥“ÖÄÀè÷+~c¦ãó`F¯/U0Ý¼¨§Ù3^A—Ôu(N9šæ¯À}õ®…eÏŽýRág•ºô*þgGK€¶ÖäH9òø±(…¿å÷"'\V‚=I‹ÜÔUšBv¤Â7£àŸ˜e’C‹"45Ž
£?ÄÕ!*+2B†vÒròÛ‹È›Ÿ‚îÏR×e ˜¥N—J†²ÿ$ExñËÞ!ÚI4êgPÓÇ)_š¦^]É£¾]î&+lS‘*Û€ì,”=È(žã~ šRZ¡{$Aç,VGPdM†¿|Ð²Ê—®K\VŽ.J'ž¸Ú@K¤èÇÜ}‚ÿU(ûØAÞ¬~,¦ {W¼¨³'ièTE¾«©’Œƒ¯‚Ž¬ã™ž	ûrç˜UdœõÄ^}eÿÝ2¦8Þ¶6×¿—©žCœM6clû*3‚òûWü=W2ÁüÎŸÌa¾’•fQÊâOçÉ­§†Á"j¨ŠÁßàýÊKh«	uÙÙL¿Ìw
’OK9ü‚—‰_Ïñ¸–ÉäZ¥‚Ñµ%" Ì!ÕÃd®¬dhQíXŽ[YòÚ›Í8óð{k{‰"Uz8|Ï•"¨ÝÈ0÷Ž~}½{Ü¢½ë‘£w{û{GG{½.rxdŒu"ŽÛê„ïERn
2~½i½Ù|ó‡Ã•,Éµjr•‡7•â*Zã™ZÆ•Q’ê°ñ•uÈ:ÿùÆc¡N5HiNUŽ¢V1vZ:vv{°±=E›â§·û+ìf÷\˜i¹0Ók÷¶Þ¬å`¦U€™V>fZvÌ´Ja¦O		% nJ¨›bï¸z’íj¹ãN÷x—Ô`²íœüƒ¸ëÒ¤7Ì¶‹‘ßÖŸåÀv›#·õf£÷t+ã?•7ôS1&ÃþvúÛùèoÛÑß.@?¬åtGP1{Â÷¿Ô¶&@£²»Fc…S?F¶7ZŽÃ¨;k6›¼ÇTïýÄÃ‚¸ÿ|’¹f‰U4B€Ó‡·t9	./A™‘ØA÷}¯c¬&:«»Ïz­7íJÆu`u³±œ´eÆÅËì­æ!òŠïÜmÔ"¼Ì$š©¹'¨ÔJ—báÐí‹BšÇüÕ!Ì]&óŒµäu"=_gËƒ¯ŒÍÓY®ÅMG‹lcÌjOêò2\Ñ:‚yd¥á¶ƒ†OzÇŸ½ƒÝÞñýÌeì_j‘‘”, ØîÛ;.$:ç-ÑïÛãînì÷~ëíß±37Æ«üd÷¸×sBYDÓ_*¨
Ëy´¾\wQÏÎ»ÃÃý{`ªÆårzX¦w‚YïÊøøxgËŽ´ˆÖËÒÃz[wð¸uãÙœ(«³Ñ†ƒˆv÷~Û;¹7Œ´7†³;ÐÏqïí½ù£»Ã—ØÞî}.°½á½ÝFY¢Û°«Œ¥”¹,'ß8B‰ÎÄ©{¹7úÜMT8¥î;æv²äu§œ=ŸöÚúÓ'¦VïTâ¸ò«Í]Ïì˜Š¾«Pî®K­ç©ÊˆÅîqÏÔädBÖ‰æ5¼áÿ™æ‚¤ëmðó—_2{…‹a¹øxÚ;~Os?, A:Ó)n¶òfï »O¨
aÛÎ“ÞÚë©áÂ&¹çMªVrIˆ·^ŽˆxaëŠÃÒô©HƒDµh‚,–)£3¡‘8ûš9È¬ÈÒ³8G²‚$d’‚lÙdÂ~VœqÊšcf”à	e²MÑZfÊ)gÂ©”V´P.Ëä›ºÇlS•kêþ3M=hž)e&´íL2ÅÈƒÝ“ž 1{Q ca)l:‡iCãW!<Ÿg“Ûý  ‘+ð4Y“
ü“Bí2h«¦_¦ÙN©[ ÞK—SüM4Þ›v£s]…ù

ÿ¨|:mXmÏaÊsˆxé¹Œ1.Öj1>³4PË…Ð±§â¡tD*Í5¥\ò)¹FÙL?J%!útR–hÃLQcÚã¤é`t® SWÞ´·xæ+ˆ®“›+Ç×tMèµ@=§¡©Ó‚é’ùŽ’ÏW&F¶4„Üãƒ¦*Åà¿È©S09dq-Èåè1åàm³d,œ0$/*Â28ì1h­ë»A¸õH£ÌdÈçZJä"#e¤G¡Ì‹¥´Â¦2I±wx¶Ñ]½u ±–òaeL\#î;ARU)‡¾EW‚—¡0¾¿ `%©E–¦ËQŽrD›G9(nÝ—ôvÞì¾ÙTmzw%G‹ãTŽ“ïŸzwÁF©ÂÂ!QÿÉ˜0>#J-Œ‰Özý¬µÓÚQT¡{F¡c³hUYì[E¦„,±-²Go¾Mìf¾A÷6ýS>þ®ÀÒLÃ¾š‚[]*VÝSQ=—±E(à~ÎýüÙvêPá»täåÏZ»"|³K”²¾)‚K‹ÒÒLÇXlºýl‰øé„æÖ4$˜.k hƒÏ™Õô™³åÒƒÒÖ-oä‘ýû2­,SVc¼ª}O£2	^T–ÀšWì8 UºËÄýjB]îíËHeCÊ‘¢ñ¬¤ù¾¹y'((o‡ë°q.!W]}Ü‹‚"½7ë;O•ez›¡u´š·ÎÚ›7½ÞÉ¨ÿìYëuëu6­[¢)–Wl•mZ„óŒHEÑèçDg¬¤œ#i]k¡å,Û´Lþ¹ˆèÖr¢¼Ê˜†Ëï©Ô!Ö!¿IØeHƒGfyý¸ô”µž^¹îñÞûY•  D©Ü™PÇmN‡å}î¹TZ>.ôsÈŠ:89•;´Òë©ó€×oËëÈüßÄy©s¬\9¼ÇÖóµëËH©4ÍvÎÔd¦'Ižº¢Z–Þ>‘k¼"ÂèP¹„üªyöùü¡ç3ð¶úž³Ti’4&Ç,—`b—‘ð#vè:W|³õ¦ûfÇêÈY·µ‡—e¤søLd>ÎÆ–.Re¸™DÑu3Ë û¢kw8¸¢Í-”¾s˜3†©P‘ôÜ$&nËQ³ke†—§—$å½’ÄÊJ¥(Ç½ÃcS ßù¼Ÿ÷\ Ëx©|i¦Ø"ÒÌ÷ùgûÙýzær¡!çýáÁé;`jï{§Ç{;E<ßyPìþ©Y@Þ÷ë`š3$LÃY2FË2;I®­aV‹|ïY‡r"é‹ú­œžv÷Kù›Ó®4^8ýJiYa~W»ÞUŒëLš>æëƒ/ø&Eý l’ð\®mç]w™?s÷ìM°¡è½7?cùÉ¿¢üx-;–KÐ¦(¿ék§x5nÆv³e»÷f·ëž*¥“üyRŠJ“Dgç(òc´Z«³4„Wü{šäúÚ<Ýef²ÛÅôÒ•”Yum:\ïéº£%®ÉœHùN&Fä“Ä¯'Þì“¸(ZChš¼J+²uâ&Eû2„0¿!¨æS‚ZV'…nßA	ìE!°B¶^ï*¼¾•(Ò±–£	ÖJJœa©úðnMiŸÅä‘½Å†²´~t§GïûëêQŒN/âÄ–£AAêÈá6uã³Þ.yýRÛÙï¢—äîo{'½ãÓmÕju¯?œÃö’ÅaÇ†ú?Fð:::>üêèxï`gï¨»?#²ë‚¦äLV0W#”æØTõ—²H¹æÖóšÛ”ÊbZå*çø•¡9¿É'ý¤7©·²L¥èwÌ½‰\—ŠcT™XR2ÖzÒžsÍ'kJ¥xl%vR¼f¾–iX@³ÝwBôîd@Nš¸.¤yQ°,‘¢oS.Ý§–¢ý´–‹þÓ›æ¦
Š‡ÔÞÁLw0Àé2
ƒÝ?5$§>HkŠnËi&ix×}ôUá‹®ÄUr$ÈÍ=–ÿ  ÿÿì}ëZI²àÿ~Š²¦gÝtÃÆì‘A¸Ùƒ/Ð3gŽÇÛ.¤Bª±¤’U%ÃÑ÷í³ì£í“lDdfU^«J€±»ši#Uå%222"222bÉ±8I‹£º²x¹%( UDX­V«ˆ°Z&a¡˜Ì·ð)]º™b¬@p‘¾V"ù‘ÿ[ýFoª/à´ÊûÊ#|ã
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
9xz8/0?çççççççvªy8/x8/x8/°}þÇü   ÿÿì½ývÛ8² þÿ<Z·o[î±eIþèÄ±ë8Nw~›8Û™¾srs&´DÛÜ–D5IÅñh|Îïì£ìì+í“lU  AÙNÒwÂžq$ŠÄG¡P¨ïúf/øf/Àë›½ ¿¾Ùäå´/c&&³Ne'] ôFþ:¿ýÓŸ.fÊÀÊ¤šìE0€s/»¡Cs´\¬LWðK<9‹//ÑgõF+tåâ‹ïÏFÁä7~óO·ÛLkh[ªÈß½·´ùx6ñäËá6Ã\Ò“ËÆU°<ûT	e‰ýÓ¦‰4”Xðý$Ì‚héËqã¾Ð~Å:æ¨÷|€–Ç”‰Ñ³OËÿé–o4ÁMxí–Üº³›¢s€VµSªëT¯du«W¿¢âÄX-X¦ã…y±XqEâ©šuŽ‹û÷ZØIæ©\_¸ŸW"-pž4ÃO*6û>Õ€HG—òµØ·«›7-™ØvN¯‚$ìÞRÀÊ¥€íÀ\·ªñÙ1<žeL’¤Ò³åìÕ—…æ½PÏoqÝò:eýÓ\—yGJ[ì6;–ë.YIþÜÜõÂz+ël¤¬ýzÛò˜AÂOO]z_‡ÉùÜûµ$I‚ë`´DŸ+ìÅâ]ñ©šÎ.ŠÎ–Ë«dUÁß­ 4–Fš«K@“µëu0ÁBIÁdÈÁ„Éþ×W1»
>†Üò(H- [ãÚÐ¶“ÖAEíå­\È’gÛd*'ÌzI«¾ICë‹Ži«‡AzeV'Öj×Á>V
íkò°¾ñjIœ[5äl£[.b¦Hp”îj½Ô@¹ b!DÂ˜z­½£˜½–ïfÀæu£íZ\NÇl|Z¥ònŠäÒÚ;»
@Yøÿ`X9ÉF7l˜‹Ü6,È–-ƒMh±8a-…3huìE{äWdx«°ë2‰†ÿ ¥@={‹¯}6ºT¾®óÃ·TÏÜÄnÔJ	È–¯vX4Q8¥ì8Ã+•n›Î¥êwÌVMeÊ^^°¯`t´ºèJY½Š9˜E»-ÉYmˆÉÞð-|`’Ù·ˆ³¥Òé»árÒßž(xšFÌ‹Y vÖ÷…Ý^¦£ã…8_¸šMÔ	•š¶¢l()ÛàóÑ¬0*Ó—-®kvšbÝP“ý¬Ýuæ­wšm<Rþ›NUœÔDõIÑ™•²/Œê:Ñªñ’0)‘22g51s­
KCýûêäh»p(%“ÛÒª,‡|nÈ™»çÐOµ¯ÿ s_ŒÊ1÷Ì(¥/¼;€aì›Î€ÁäŒPíDs ø<‰,µÙEpÿþŠ5wçë%&Ü Ñ$¼f—¶VËÄ~aPüvJÂqGwBî
Ú7XÙ†-Mfã0‰K+l`º‚;éÈ¬ð}ˆÕöòß+m`ÙtÏ¸0É„|O%U¢±ÐÐ—Ür²a÷F!Ò!d€GÞ"@.ªã=låT•é­ÉÌí@,È±‚¶5Íà”§U¦ŸnRæ¦òBöÒªšÄ½ee¬ùe³VÛ,h˜ã]=û«:/Ô
?M\çn‚Js
™e­õ3¾î44yeQ6‚ùPR÷Óì±ý9'A7‹-o9i‹«ì8^öò%}×ý.ºÒð"+o«]q_ë^´ö9– ±Èâ›5ïqñÅ‚Z+­¦¦½í´6|%×Ö:VÖàQä_iÛugw_ÛGe.½–Ÿå¤Ñ2ÌOÂ‹$L¯®•šÛŽõ9!Æ ïe1ã ³Ò~×ZO…µBŒÒÓ}kLPþæa28‰aÕ©[Ä·t{Îfi˜¬ ŠÄãé(„5#å?ÞÝf/¢$<‡Åyk<"è4‰/€”m3üí˜ÉõéLÓ§¿K Û–†öÿžíbëˆ|áÎRžI×/Ð¾IaaÿÇÑ„ß B|ÇÂôýr±äíßY¢Ë	4¶´×Î›#;èø[êüU2Qûn/iOÉ’®ôè©øRñ<ncnæ€–ùgíé‹`”†êÀ3Ä	=~ˆŸ40p“	Lk2öÚøW}• pp~{¥ôºoÞµö­À½Ã‹,ú¥Z=yÛ|ŸZBßôf2`ºi–6æ¸½œ‡²ì²uÕ@iS;Kf¡b5Ë’Í¤ÉGíŽÃ¡;\ô.Ÿ”^áüý}&7m,îÇñº=<_a-þ{ÚZ^a×¨i·d“-øuwþ½Â“£heíÞ²³¿ÓI0E@]QF6ûx
ðü…[^ÜðN8žf7xã^`ß‘³ª†âúO
²›&`‰@íÖÙUÈò"Èì&ž1"{Àã0e“8cá§ˆZLhUùã)ˆY‡B$¼„øz¢´'8ïKÆó_h°ŒÖ«Å@ý:-ÃÊÍYê½[$4ÇÝÒôÍIÂ|uRi.6R+\jã1ï…·¿‡cÍßi©ã-w%1G§ÛO,“Jm(dúh!¨¾KsÄ)»X°?á«ŒD]%¥,%€B78§5.`e³+ø-_ë{3Ý0,æ^~_ÃKS´lÑó¥5¿e!÷ørZ¦¼ò§š××ÖØ&'æéŠbÐVvÆ
“gÀW„:º÷…üÑ« ÝŸÂ‰û1JZMÈ1„W:i<ÛC›;yd¼0ìà‡vÉƒAÚ ñ×Žc{¢-ÉøÝùƒ~P‹ŸÃqøïÿ3LÓ¾O.ƒóø?.ñ‡Î 	 H4Õ`tªÈâ˜¾áéq«]Av‚ý·¿+A:2O"»½.ü‡ÞT& !Oã‹Œ]É÷ 'V­]£j‚ûwÜ.ùç[6²Ák_±\:Ra5:¡ 4eNäéÖ6 1¾¤öâêÿ–‘_ÓH?´­}ÁðèC-ÍØÞüV,§Âœ ÛVÁš(x'¹GX]`ùÊ¼J¯?ÌŠƒ´xAV`|9E)ÆjVßÅy$w„Ù…å$²±3õÄ§æÒùW'G¢> 0Æ,=;d×,E0arì’°³`0 I±àI@ô9Ž³Ø´ÂŽ¤ 2ÆIfDll·r[Üò[°:‹ÆpœîbCgð1že†7bÁ“þfWá¤ä­HKC£^Î7IAÙoÅ§ÛR³ø"É<µ4@Ë¤ìœÆCOÁŠÄ¥6@Ï÷œÈÊ£h2!Íð¶])a<Š/Û-åÙA€Á,rÍ
™IÝr6ÂÐH> °˜'t¶a’q%A pBN)#Ô×VåqùêªTâsÊ&ä’kL‘dÙÀª
À~Äë[ÊcØÙQŠÚþ@l'C:0ÇAhG!ŠVñõ¢´Ã'‡0‘*ð$I@kÛŸN!±ðõ6û –ýû¹ñðíýñ1 ^ûÙ6Ëí<hÔyyúFXs
<¢áß`ƒ¥Ûì]ï½þ[øi%aª5†:“øº	Ö·6Ù¬¿¶ºòO¯ûXïR¥}Í*ñ÷!0Â¢*ª4HLQú Adq.s MR“\;·—¹ÅhN91mpð«xYqn{œÚþgöB'vé¼V`Á½Y÷·z\éÚÎë	>ÈÓúûy1‹ÛEÏë÷¸ª2é$Ž3)åàrø:M´é&¡± 7nó¶g‘B¨£mµS {­Vñ "Ý¶6Ä§¹$´ÍÌüÙa”NGÁÍjR¹ƒÝ<íÀ€Kÿ±´ü®ûžzÅ¡+={6íÊÃ”:5&ófKÓp‚½¤àr§Ó©Ý–ÐÎ¿n«÷n¡Áyî‡x+SüÃ‘>%¤oñÿÅF]ÉWqyE.;šÔ£¹V³P!…[ª¯%§¤ðŒÛÿ³¬è
Ó¨°4V®Q×Ëà'È)ˆìŒ´¼¢kh™Æ¤g›µ€òcç1 8Ò]XAé±õå|œ&GêØr¸¹në]Ì¥¹fž«5« çÐ&)t /¢gáCîtLÎ 3´ÌÅÓÕ®LürÍ½¯ø?ñ4DÙÍêF—Mã{]?¢huOÂ
Ït­ñÞÚKÐ›™>]¯¾Ûì’Ñé*ÿT˜Œ{]Ãßñ|4KÐJEaöª\FmÞop.fQ0Âp41—mÖ]að·ße·…´L"`ŠBí¹=§=¦¹jÒð¸#âè²È˜ƒNùÜUµ«9ÊÎoÒ]Nº½¡ß¾Ëq._VL¸#mhn¸«\ãóÕG•Žú×«½-´nù9xù®?­"‡I.vÆ¤Š6½`1äjàêÀùÊ~ë}ÃèWö&v¸ÖðéóºËÍþqÉÍ¾µ—›ÝÄ9ezYûy¥fèÂ-{œ5#:Œ>ÔH²£aÈïÂfGšˆ™jŽB¦;JS©Õ‹tÝ²î6'Ã-¬‚ŠéN7<ë1ÃªEY¬²Í*ìåDMæaLW•ŸY¹5”4äÙâ©ndÍ]Q¹SÉÁT_¸r^+‹cê:÷“TÀa /òiE¤ˆlaK™Õëå³rof…r€Í Ýh%Oð%×8çKŠ5V"YE†/¹Ì÷¿ÊÂõ!VYU|É•6øWõé,Š+[|“k­üø%–úYÿöXëXn.÷ÿÀ`¨¤‰&ƒhŒ`ù-ž_,ÃQ!÷àvù£~48.ï~€`Ï% bïkVýÏ¼ìÀ•Àƒ«8)ø¦|Ô¨‚&ð˜ŒÏá¯@þEâBñÓ—@†Ó«(€"(Æ~L¨cyŒåÍê¦] 0=
ÎÃ‘%N ·HvY`õGñà7
÷ê@ÿ#Œú*4?î¬QwÆ¢Ét–™°ƒÑà,õ-¦$àýz¢ïÎC2z¨Þbí°“Ée˜u¨‘å'¦EC•èÌ-ÑÊàžH·kp—Ã·•ýÏ2
8Aé 7˜¥Û:ÿºI¹½ð>*0¤¢ø¢<RŽc)"¡OG°ÜW°Fa²Û:¤]¨ûé/ØD*åŽA+9/«’¶CÀ¾
Q¬âÒ³K¸–Ï,¡À¸–<19…À¦@íÕÉ‘I]hš#*Fï”~³a)š›#èç@Ñ‚ßvã¨úL$5Ð´×_T2ÊNBL½‡‡âÑ‰¼ù~)"Õî¢«t&jÏ¹ÐÀegÄ¤[o„jcy<•GÆ*’†dÊWO²<Ž\¸ªû¶Œ5YW#[îcë?¢d€jN3‹ŒùJ¯`e[íÊ°4étý¨|Â•u ÔÊOŠ
D2…¤]EÖ§ÓÒ"˜QnöÕ\V|ç%ÏÛÒB‡  wÃ®Ög%*¢Ò%Á¼ºµÛ°7J‘à
1—qC«´a¦&ë:N@À&E“Rø5M§,l´œqbÁÇ BEù:Ž[Q¦ÒÂCæd¡RWQv¥˜/gN@þŸÿdåå€›ßÉ³š¼½ìçšÆ–éaî6¡öT&p®h |¥cÇ’‡zðñè’ñ¨êíƒWßu;½7Y^9ím©‡Í™ßÌ’4N€‚f«Ò3³i„ºÄ9dŸšAB;¥…x˜hŠO{œ»®—œªEÿ€Þtœ!´ÑH)2Ö¦RtI¥¯:_ZÞÄ®à¡ðxD†¡D?K»Q<Á1(>Å—˜É$†8¶Ø‹7¶Y›ŒZ2÷¦$†yÀ=
V +Ÿ’Â(o[8ÏX‚&\aÊ`0tWd_] 2áOºKÏÛé#{mN=vw‹ßK€ëüpÈ}öÐÂ—„t ·×þ+ýóŒi©H‘Vo×“Óäæ½9µõâ W;½­2þñ¥j«/¬ð5²˜]ÀÂØwßÆ85«SÙ ç%ÿ,s}Þ¼0Ìmä†¹Ü0—ËàN³ã'ÁéÛ´Ûéø—¯ÀZGÂYëTó[CËfŒsé=îËÇ[,%òú%M»h5Â™ù{šä¶²ÝN¸KÚQœ±83Ýèækrã¯2·©ÌìW4óÏFÃÉ¥ñ’3Í NÒq4Žqc¤9x“ ÈýNb’m!:èºRb|]
Ñ	†£”²x #Vƒ‚MG¢Âý:Ñ'þ€­iIVò”6.ÁŒµaâË6Ù*;…cC2¶ËÅÆ;\%Cø=9Òž+o4'v”+Ôl4°øªŒ†c+·ÿ]iù¬¬ºb„ýïÅ«›"õçã×OaMªaÖ»~"/(k-Fs{‚äŒo™kåê¢
þrY•$ EîàÒ¶qCúô:B>pŸ{9²5ÆÇä£—_J%Çq’#-}+eZM¹s*ÿÌk–ˆ®|Hü3šÏ®Âqø:#¼Çeb™Øï òšcŠ¤£÷ø<‹ÛâîU|ý"‡ç@¬ñN”ÊoØæ`§¡ú…‘£HÁ ½_Åø©?Åg¦—Íó±ª3†›–©Ã]þéÝ{
ªeƒÈSó<äòÇ[Ô¡„ã,Ò!»•£1á	Ý†Ê¿ÆŒ™¨«aNC_™m8}@P	lKd¾ÉãûUÿX|n,!AF]Ç|œ|Ê–Á”K—â('¤gÁ9Z—ßô4 —TFˆdeáIŸƒ,Ã6€¾"»“D°ñp$üI8Æ°s0ø_4¢EõðxÆ’ƒ ±ýÚ­ê˜}|]Éz¢µaÜ¯oèôE¯›¿_j^!o.^šè9¦Dñ—K·5HÎåVÉwÊ
YÚfø‚à¥nÍLE¯Ó, ”I©«cþYkŸ6Ê^ûÝ{u¨ðÒqp3ºô¢ü^ÿ²8Ôbùö+å†¢\÷ »%šÉ×sFÓŒwnÞ5‡àž|ŽM\>àÃÙ7njÍ?:g'žµæ7+g)bDÉJ «K¹mÉ(›Ú’­¹xê2Nn,Mê?U6û'Wv	<ÈiÂÓN4\ÎýÿRUµ$
_r€ƒ(€e¾Œ@|­þ.kÉPàµ5ös€%7‘˜Ò•]OMEÎ^>OËKâ4Å˜•D¯œT³«Ó»Ü°66ùÙRr¦”TpYežùó„ëÇ%ò×î(U`§ðÔ|sm’lvŠ¼<Ò7~èB~ó½V¢K4<USŒLfŽ(Lü»ï Á"bÎxQKe«EÏ™;A¢ºkA«çäJ½Âè4,‹–Ä¼3<¿Î:iPˆ‹/ØzW™0Åòð™šSH—Û@m×»6Œú‹	T`šŒfqy²MŒß‰0 HöÊWDâÜ(ÌØl¤÷¬¦8o‹wYèÿQGD/	xÂÏ1ðÀi‘µåXWx@»!Êã‚0TKÍ€¨C+|$F¸)£ðð2öŸ×71Ö±ˆ(ÿP´{BQ`pžx ãò-,©‰)=s4–¡ï8”NŠ‰ÁÚÁ
;7ÂUó<!¾²cnj†âk0ì­uF!AŸ ÛÝîv·ËÃfP”lí¶vnoíÜ£5¡’Í›ëŒ(W#Z À€|ÐZtmÅž@HxïŠÛ¡k6ÖV	8!ó<“’Ÿ$büèc9”l†£`&‘sq‡Q2ñ‚È’'.r¯ZŠ&õ xQ¡RôQÚXöÍåÚ`&W&zZHœ¶Ëô“ *?Ÿš[§´}Ô'ïg¹6„Ž¦¢iÂŒª«Æ2L“˜+>ICÇÅ¡$o Ÿ;Àm†CÄ1z¯h¹¾w/÷Ž.»WiaÍNUsÔE_Öq@>y›G°+Ùìô³õ}=ÇÂø§iSvò-Äžª<f)È+¸Å€#þûðÎEºaDÇØãµhÈ¹	~ÙåDÀ×¬,Ï’ltI;ÓðNiß‰FôÓlINj	ÛÝ]Ê…Ïb¶ÖÅt¼‚?•^¢øÃü…¥@$ÔLåôCÃØÈ8¥û=÷–Uš,uÝ•ÃÚÐu|«ð¤:rL…|¤ H® È®T ˆ|Ù&ò	UäÝº(Þe$A/Þ(úBèåÂ)bê¸“ÏñañGvî:ï9y¸Ï³1LNÎuêî·žæÒfÈÓ€[¦®ÆúÛ–L]s-yÈd6æE˜I¤|Žc	ÖTsTÅD»cÈ'bVëZºÑ‡ñb^ÓÜ4|9ÉÚƒ>JŽAFž”× AÂŸÚ€ÔÈFŽÙ®‘%•÷_Ó{_3åžNåÝ!LK®MÁhŒÒ„ÑôÊûÔ¸¥YûTm‹­M‹”íÁ³`xžbMFäÐßÞ1ªc	×³ã¯Š¿Z
[çáUð1Š“`ÔÚ6™õ9ÏÆ»ÍZÏò§PE»âüî–m5†°.Þ
ð·™öB·UÄŸóHsmÕ0ö¥IWŒCeâF>ñÝJþZy0”™¡"§ôÄÚ!·?”à"«1È
[ø5}3#^°À%×ÍVB&ŠqÎNKîl`:¨ÞÆpä;êx†áE0e£xCê ¤˜y[‡H©È¨5œÃFn~Ê‡Q8ù¶Œ4.á0gˆ”@ÖO48|©±j€RÞ³²VRØµ€ám•SŸ„%ÕT½Úáä#iš&;rc£ŠâÝÊ»/‡
³/Ô^7Ðfø´S&DÈJwõT%ð6·<=+r…¨3×µ”Åì)“*ý@<¢õ¥¿§ÂªªgñòûÅ±ÊIdYklSÙºô®†YÎM`LäëÍ¹ŸXaÀßÁPI€¥Ö0wª+%HÎèÏôiõQ…¡[ÅÉ}¿-.^¥pÖó&ÌÒeÿ¦GìŠ×+´äÀâQufyÅ«ÀUO‹:6‚7m¦u[âo{eš«žÃèýX½KÞ¦›“t¦á&‘µ«ž¥ŸZg'µvKu·¤µ7×ñ[µ—©+Ðæ]ÉÒ§ãm>åõyU™R4Lµa÷ñ±áB		ÑÇnËpe¼T6Kãš8ï^	ï™ù,Ü˜è‚{QÖ3š¬^»ú´Uý©uà®y³	Òiá"ù®×§„+¢ÞBEÝ$îøìªçRQoÉ6v[Õë^µÝ³W^P<Ztg„Ò ´rƒ}á¬ñ¤fæ	³øÉf©P‚Ž·j4ˆªdÂÞKÂÃ·U%ŠaˆRš;3ÌA[àzÒD–…•dÒZ9ÁU´Dµê-ñ ´²r
¨*µEÃ]©8ÿ;?²Q/H/üƒ¨~^óDS§¿Ï°láÂKañÛ²':Xó(°²3#úÀI8ð6m~y3Ë\ß¾p ð
ÇqMLò·Ú+x§îÙ< Ò‘çŠQ	T20õÜSM¨§Œ[˜aHxVÃYµEgU—x®h¤£R®Th¶—,TNÇG6Š_™J¤BBGb{í5³®$QÚÈý¹y¹8½:±qˆHlÁ÷XöK8ÅÒvË2ßÊÒò»Þû§2Cœ5U	Å;Œgï³Î±3_¬‚ÿÂ3Î¬Ñ„¦¿ýp[Þáe&9C£•ß¥£×Â¶½ëvúáø½f¥Ü:à1ç÷ZËù¾	çøl„]m^ó*BæhÝRVokïôol^–›>÷(æmî^Õ–C!´WáÇp´,µ•OYë õ“KX§pÒbÛì&!±r^éµÛUs°—úsUí«¦zåÛÃÉÐYõÛÙf9îÕ`¨\ôÚ–éC"¥`Èëä’š
€îò"»Å”*³‰ñ…÷½û+f-Â¡PuÙaæZë}[	d‡ìTqYYÖú“i;J4~¾ö#+TìáÅã„ý¸fPº¹Ë×©g­CWsNºC)úfõß;”Ô¥W]]K5ð¾oÃŠŠ£;”/q•®À¹àÆ +:²ÔµµÉaŠ¸&LJa.yUZœA²ò¬HQ¨†M4‰~Ä²z<q!W¢¹ë˜Þ¹^©Bú®“`ZIáJ8]vé°+@mÎ'—É4¥¸Š¯ ‹ÿ©ä¶¢_2]²tFulÞ€©ÎU¾ÂVTŸËuü¹üëgÇš"ÒqÕ”—Õ ‡™ºËÙÒU*_hºÙ+«(Ë¡¦—­%Oß¢ã1;%*ŽT ïztø|?W€Wµ-¸R€é©d•[M0°Á³:kTéroY~iwþAcs*aNP%x=Q­WßóTÚ{nAEí—ŽÖö—ªêN[‡ÙÒÒ}ä£Ä"Ñ­‚³tÞ«lØ²fã.ÀKõ¬s¥WxûeðnÔ‚W&_z;ùm_OD:¦zHWåW©r”¸ìå¨½ù-O¨’U*\\+mH×·B7ê¸¦f–²ŠÞµŽT£!eóJä*wâbq…Q¦8wÌ,/bUÔ³œy/©)B`êŠ·ñÛÔ‰ß§Qc¾Ú$“ßÏóh‘|QÄõ<U¨!»ç\œj}Û>(Çøm9I¢§i¯§VÔuo…Å—FÆ5}5k“Z}‹#¢Ò®Î¼ä~sO°õ¥TÂÒ<
`®õTƒå¾ì’ºyÂÄ!/Võzí¨Ç~5›Òqü·æ:ÄÏF>‹HÏ¯f­Š!}•ë”4Z#‡í:ØôÕS3èÒ+6¥Í2¢–ûã×“d×xrc_Í¯ÙþäÍŸ4y®dK,	R2Ud¬ÄËE?mª#w‘z8FÃdh:É„J’µLË‰/ €T¤1Þùí“·„C÷	{W, êõvl0¢³«¯¦ÈQ’Îå­‡E¼ªä¸ç ôQ€—vàE€b#ÄÇvÔ –kÄ…ë!×©Â~ÿ[)¥ûXª
rY¾ôlÙÁ®”â[v1/F5/á•Ž}E>
¥—mZÝŠÞZÍ•BéÓÎ»”ÇcW´@.ÿüy»“«õ’ÊÖw½Ö_aë+lã=ÙÞ½_.âe€Å2w÷ÇÈ…Ú©ÓÃ¨>Âwøfõ|”Ñe´ší¬sDÈàÿ'¿¥C'a¢ Œ|§<­YØ.²©ƒ0p¤/¤³ñ˜2ÛwVÿ8NáðS0’0îð‹hÂ­ò#{¨té¹øu[ñsÕo¸ü::í« ]©sgÕ.ä%R¸òz¨«*Îew—×˜ò£©6_…]·ä•öÌ&è´Ó•eÖQéÖÐÖüÅ
[›þ nZÓÔÒ67GLr×Ú;Š¹Öi(“³¤Õ¶5¥¿²Î'ÃÚÆí¼¨dæ0kíýM1©±ëS>ƒ¸$ðà4 ¸BÕž0 }G¦qŠn|‚t|Ýµ0«Ú2ª¥Ýñlªoc%ápÄ¯+’°×œ
L£çÅy èøÕ †ân=‡Q¼£çß/³â3tñ®ššÏv¦³ôª-'âs8À» ^as
WçÀÎ„•"Ö^‘ÏÀÙÃžÿ0mk"Ì—ï
8­pÈÊÞs[i¥ùÉÙ;‹ØùhkI-I¨æåÊÊsSj›YÎi‡ÝÑhÝ@só!V¹µ«¡iK³c5½ðˆ¼Z~Ò!c6KZŸ©®<ØC¯•šB„>‹Âæ‚‹-WC:8áL­ˆ3mÌUÆò»ˆFþÃÁ3Ùfƒ`4˜!°iÛE´¸Ìòõûr‡òQ¯°pÂSPæ\êtv>ŠÒ«Ÿ%³úû{h®„`Œ	¸ñ©EÎ4	V)˜­ ÓqV€¥ä?$¥ [Bü¶úŒ¤èÀï­0NËá#û³ì{Q|ÍÒ,&£ìVÊý‹å,ÚQ¾ˆ’ÉS%*U2/`ÉFá/(žbji,ö±a+Å¢_6×©rI­r¤Öê¦¢“ÔÒžŽK2®‘ïé¾[ÚÅ«vëYuBvdÎxó}fËfÀÛ4iÀ@zzN=î*¡ÅË=‘ÓÉì’Q¶_hfL†Þ„‹¬ãÇj\„„hå¾¾ó‚ßõqf axóÆv¯9›0°¡‡âÑxV…ÚêÕç˜rZ×…„ÞÖ½
	VmH=°Œo£`66Ðw„³õƒœ7WäO­º€_Ò_?'ÄnÅ¡S«NÐ›=Š³7˜|¨pè1¿ÃO^8Žl÷ÕCk¿XŸ‰&ƒ4mÿ^Íc—ßSž’z~íxœ&êE'Ëï·M^1”®ßi  é+ˆ@µ¥mÏ^ƒgýÝáúãºTB¸MëšZBÕ^ØÝòÐ}J™ËS¶$Sq¯#Ín(}7³äâ.‡h¡®­ƒÚÓá
²H2n‰êê›žÒMÎ2
%q¸e@Ë>zq‰ˆI"-Áã2è—‰Àá"¶l“nºPf". Ÿ'að0$H´¸ Á­?-ð¤ÊtÙbI›'œqŒ¸í¸\÷òØ5ž'¼LXzojç,ŒBeºZ¬µ·Úp€Èðš«wƒt¸Šÿà-Œ4…8N¨éü[Í¢RÊ†;6ë˜Q¢+lŽŠÚyqj“¾\–¼üw`“¦½Eò¿4ÿ0Åò*’&–}7ë3L|?Gáso—ý´™;Ö*ýÂãBz&ÇZîÏ§ràù¾q>‘˜·›iÿãee šGçç¤¦’Š-ØŸ0õêè·ÒU?b¯zi\N”©G“úAÔ<á2ÚÜ.·KîÅüš&U|IÛ9×JGï)ÕÇž%¡$«ÿü'›ß
£¥Ìù¸\áøPÙäŠ”-ã¹Z
ƒµF—¼bT!Àå²Fç:†âÎ£þ*Ü©7Ê¥mÖ “Åt‚iXìç¢­|Ó1©ÏWÉÃŠR/CKÝðˆŒùpœÄaÃ²4ï‰WWšNCBÌ 	Í%”#®ÎZRƒÄ•?{ºØTëK7,ùvôë¡ÄF)ÔYäDëŽ«E*ùšÒ`±XµTüä§Ì­¿ßêÇ—’ë¥°°UZ‡Az–´m(Î(²G9-‡.5•kÐÏ¨òE.ùœsvd‹‡-L×Y"¬–y|ETcg¾|½í¤À?†ÙH^c«Dý˜*ç±0ÕUuÍ­²ü…š–ÔAW«ýª\[’Ëu¬m4¾di2Ø-€uË‚QØoVvö=¬Éñ>­^©UyÙH:mW©`¥Ö°sþ,«_Èa~a…VX[¶ç•+RD‰Ô°ÞÎ¬]XÑ!žÂ¡2.JØë«{¢—§	UÚ|ÎÓ6yMÓ×€HñuVà"JÆíÖI8Ô¹‡å‚>m-×x¢—žÞçâe_gTN«ü*‹k´V”pU¼/jé¹áWvËØ»ÅÉÐ!¼}¿Í†!Ö~9 Ú•±ÒUåìcyÚZZÖïâeóòš‡²í
[â`\Za$ôÖŠDÑðvMoçÀ»ýÐlìÞÏú>YkÛ’—­~ì*í³Õ5ø $ø“²œÍ­“ÈP-µ,
 *g3}D_5i.£¢€=àÃµ*»ZÉÕºK¤8û0§©~¯{Sñÿôu/UÞ©õôUŸõ"Ð¾zRæ
§/G4#´zÃp»hä‹VåµnìíTqóõvEkvøU*L+9.ôJã²T8¼_K ‡fê8µ&l@Qvô»œóö#M†MÅ— 1ˆ*ÖîæÅU:ƒ$„u9äUÚKôû’7¦Ç;ÈÐ@›KÓÙìÕ`0§8 ¥h\†k?6|?ž¨¨.ºÂ„T2°!c”§LÆ&òb¼ø=}×õµ2Îçà[ÍNXYŠrßî²IxÍ³ôÚ:¡ûM¸-&Ú¸ÐÆße‚_Lš2ŒÅèPÅ·µÁ01³ ÏÓðÀ¢ŒÎ«7á"œÛäÝÜ‡JÃ¶š1nwcÝ¾<óÖ„}cENuŸK`9þ³Ÿ>²àíÉ+¾ýü[ñæ›Q¤gß=ëÉªú!ÕšÉc,N¦ÕžKÓH³+_F·Bã+SÇ8Yš²¹.SŒ¸üX“ªŠÇàÅ+ø2“Þ<â·þÛ	ÿí„¯¿¾ð¾Ï;áí×·þ_ñ„úŠû?àë‡¨œÒh_·©5YÔy6ñÂŽ4ÎPEóŠç(8¿aûÃQ&¨á¸»7Bý#•Q¢®¸[uÿâpopÙšÐÙóÄ“xŠµô!@ÏÕÓ "C¯Û ÖyàQMÂVÛ°›åmØB3ó½c`Ž0Lº½å…÷`^áë¸ˆZ®ñ:pº¨A¥š£ƒ-«5Ã¿#@h  ÀÊU¨ì*‘Ô/7G¯2xq3±Ýi3Ïùn	³8GÓ<¾bOB\>¶éúŒÅEuªì±ÚÂ9 Õíhµ¤Ý—ðVà­‰•ÓP Zcßûß–		ÞÛŸ=˜Ã?Ë½-L_V§ŸiáaZò¥^Þl¡ã÷—ÄØ24îawYg™¤ÖnM@œ|*r–‰‡ögv®ÂéÖ…Â)@‘
>Ò”ðßI5ÛEïïº™¤kŽÙl%ìcXîdñ‹èS8l÷ë'Ì	«žðñ¹¬÷mè ƒ6P"Ž­½ƒ·¯ß¾Ú?{ù×Cöóñ~íhê¸˜²ImúÉbRñup>óaTÚ·…¹ò—k€g;µè êlzZåæ@)û+ë++›ï‰Fˆ*…'WtkÈå²Àä³]¶!8ü¢:€Îº÷¸W1À£oê9ÎŠJ:_£ Ja4±†Ÿ¦œyæ¼FÁá$ñ%È²éÝÐ§1/ë•Ø™ÃÔ+P“ä'Ä‹„Žd~,ÔfµÏ¬Ål¥âxÕÅ‚ûi’1Å³^a1¥ZÜº½Zœ{‰´‰Trå–tì^‰®¨èV“X ²BAÉíøSZNIó~8‡Mÿ¤TãfÆ»"¢Æ“·OÈt³ºEÿ~ªp‹¨[ˆ{óÎL„lôêä¨Úq`¡#ÉVŽ’Éb°þ à±q”]ã@ò0†þ  Ý¯”u©Ä2à	¹d]Qyä+Èiøé’†ŸîDâ|n×ïjJëûH¸SäŸ¦4ŠöÉ½¢Ê{·À‘¢–9Å¹‚°ãÉ[Òûç¦Cxrm¡™i5žŒn(†DjþíMDsèœ4?2©¹«ËB?´kÕÙßB½þÐîÓnZYTÏÊ±µ+iäµn¶˜,˜DcDÑS&éßá,!jw¢:¬_…ÅwF-Ùþ(L2všA;TÜ¨T¾Ê>%åo©v™üÁ¨^ÆëSm²\8Y—ÌäšºßY|J-MfnäbLE)`YeÉÃÓÐê¼ÖÚ§Š4:]!z¯$AeÌckïy8=²7@e]â	;>ÛuJˆÃ¯£‘°—UQ8Ë8TFNÍÔ,Õ†·Ò~7¼ò0[=ã©ñØ~šÆƒˆÐµa°ËLCgFTáû ƒÍýããÑl’ÉÍ?vä¼€ÃþÂt‡B¼¥Zíéõþü÷3ƒÉ€àEè™„X‹ŠÉc¼>È,!¼	`Ú1ŒÒ¼w_äAh	Ï;0Û¥ˆå9ÿ~üñèð¯‡'?þÈÎC¸“]]^­ ï{pÂh&4$#V8„­bM®	eT)æÙq®CóZ]UŒ0îÛ×!‚3e?#ì¹SK¡oéØ?7Xãbtf„—‡¤ußš.Ãsfà¯çØ‹0dgä?P'ÁWÈ¯hvÇìER·R)>Z§Õ7ê·jÒ]kïÿþ¯ÿ3ŸfÖÈ÷uá›»1JO£ó4£’;nd‘6§ØÎ´s†/ym³QýlÚð·žÝ@0ËK¯,‹ZO)#Ù¶ÈKÖ¾ècÀ…Œç ­híµ‘ŠÎ±.J»Z1äæ)ÍÄ ¨#Tdkïìù|¸.ôV(’5âÆ¦¨
Æõùþ{î+J z†Uôº÷·µÌ’wÝjùÞÊ·ƒ¶¿¦J>½öTàíq9î~-øyv…iéoâg–a±àdÃ3NðÍÿêxyÂhš¥ìU|y‰÷‹ŽJ¦Œ»ã£†Œ‚Ö|)¼zsq+7Â¤È€Ix	ìT‘	K’> Gó
)«JBØK€?;†á¦ä‘«äæ•~½ËÝÖgY©¬®ç,ªÊJN~¥iy9 MT@Ñá8'ëÔê´7Lm°ºýZ{j¯öjã¢9úZA/ˆiUŒSeâÌ"Ç{ÇÆ«=ú4U¼®Ó)ˆÕêaDÕ®…,Y=Xµ[Ñ­ó\UÙdªFû^¥•Ïy²œ£Xò=ˆKÚMÂßgXj ‡=E'—.ŠW¦ü¨ƒ‹7 à+ààêŠ¬Ë€ÈÙ;ÊÎ|ðÃqÖa¸ oÍ;œûéÀ¥­Ëjs®ô]¨Òw–1Õ4Ú”aò˜"Ìl6Ýœ†YÆ½fŒ9ïñ!b„º•í{ˆ.5Q…í›CÍHe‚9×Ý%X«R÷Âs%sè¯y«ŠRKE:,²Ÿ{eârj°|ârï^˜Jmìj£t”9ó£^À,“ oxõÁW&-¤|DlŒe¸ÌñšL°Ú•èÜ¦Qò¯ùÙ«øÜÚ}ÓOÄ8¢t‹:¸&÷êŸ]/Ÿ¤çt¼“§y¦Ê›ß#\§³d:
ÀŠï_²‚ü19·ç"8ê‹ Ú7ºÝ‹Ù7y7·švpš!òüžé)é õ ‰‡kz¯W–ADÊÛ·>>è‹¦¶S2ÂÑPe8WH—é;å20ø"ä³H`-«>E^äsœ‡£…ÓØ¥äÖž¦­ax^ï¬QO~ƒ²
¶yÜ‡[¥©ê)õ[‘¾µ‡úìÙ<SÑ›’R+lÅS…ÇPÆ†g.=Þ`”žèYk/.s‹RÝhBi÷þìHRûœ¤öXA 7uúœWT•5Ö|LÔ%ò‚ôûè2öDÉ`Ê¼-dÅ3I÷ýSlÊ$¬ñ¨Ÿk	ójÉnw×EmÝÓ*H³eö ð7E‚j!ÙèênkKüšà>V H_ç¿ Ç < Žî”«}ØŸ®®šw…j³}t²Ãq8AÓWÌõù<u§²sU9‰+µ6vmµêW¨2È’/ôölcy˜´‰ÊgSû~^¥n®‘796®ÿAÇ=+våß_Ãx_´3%ª! 7óø¤ïe¼zÞ¢F§¯Q×[°’÷¥ê5L=÷ î53Ê‚Q4(ÇbWAãoñŒ]Cªƒ1F‡Ø`r#JcÂŠó,Äè€“{úè>>6å/üÉ*¼bîIù›'pýT[ýg'£¤ÔZ8#Ú®¨ Åv®Â`XG€³Äj¸E7SÐãr•!±×€cjµ)ŒØç„ê9t¹³–]Ý¡‰7'Œ;]ß±bi0–1‘æª;6¸ÏE:.ØÞ©%ámßmŠF,nöà‘¤×êQq';‡7^öÒ…:DÓ¬ØdR™Ö—5åÃK¸v}ŠºuÙ: ^gtøó“|_'ÁÍê)â9ˆîYÝŽu5Î¡ObG8Îf—z‹¾îÜ•E;N\„áW‹/Ü¾áLSö‹Q8ºzfñ.“Ùd ÓÑbïz}dëiB¹µîeZM”j’a©®Ò0;±+^Å×‚ad÷Lä¢]†*$EÈqdK‘šoKÖ³`e±Þ>Ãõ”žþ…×’u÷¿]/¤¨%“X¥r} $’U¼Ã1‹q~Ub‘ÏíúHI8¢ÞçŒ˜\DèkÂI”Ý,ðó,â B5q‡¨‚BåbU˜xÇˆçß9¤ ðúøcE¨ëT,ÐìYü~'p÷Í9úßs¶þ8Zws‡¸‚‚{hUã0…ÔWØy1ÆK9rrßç~ÿ4Œ$ŽÇ,Vf0Š/yÌÁ8ˆ¨œPFôêgyŠôèÈ‹‘gW!šyÄ4o Ó¦i„2&e1…äy6àK”Ù(Å0Ë.ŠËÇ7yÊ6€‹òY˜o)NRê÷†z›Î PÀ“aäa<ÅíŒ¨ü±ˆQ˜¥hãŒæSÃ˜

o˜Â#‡‚ Ò•<æ±–â*`t±T%H'Q.Þ¥ìÈ…{\Øüš<Y¹sõ+ÀéûvbU˜ËŠcÏÏ…5ß»'¥¾k®NS”'R‰A„Ï· Žr Éçóþª0ª ü÷Q²¾ÄC ”ðdKO:(P\ÆÉç~ŠcbiùkÂ<<m±Œmq8}Fü¯
çdö”ûÆ8XõQ˜}	œÄŒ¾.Œ;Î„hxÊsü_ãNQQ=Z+"ÚïõÎG³{!vúbVë/ªQôÝiçGK+Zj€÷E1÷‰—s´­y¿„æµU Þ8tdžGÄÝ;oú‚`É­Z\E›²gAro6Hôîµî»¤m­Bí¢~´lœ_gÂÝ_×˜RZéÁAæ‚Põ0`ª•{çžßY(ÂTêÞv`ß‡ƒJ•ÕÇÝ•û2Äv9L*ÕMñä€òÅïÎE‘¼4ÌöKM´óDðÔKµKGÄÜ±¢Î>ºDŸŒuRBª«@lÍÁ,ÝŽg¹yPšQ~ó¯ƒh¦|Q&ü®®Á¡½MH%¼A*a÷ôªí1÷:åKÑ
F€V¨OP–¨¨šºî'IpÓ¹HâqsàŸ†YZ;Ì3pÃFˆ†N²fŒSž*òÜƒÉò2–DN²6Ï&šÞxØCädÈ"’ÞÜJƒ{§cø¯×\*õ@Ø	±ëH{Õö?ÜÐŽ¨Ú.9‹‡ ²í;Ò½™o4A^ÑÌ(ô£F3…œ©KÑÍ[’Òƒ*5o…³{9¯›óJ(gaL
ÓÜ¼¥8»Bíóü‡¼– o<Úñ%JU¿9üŠ€\~âöî§ä$VsNÁÃ¡Ü}Zâª`aRtÏ¯IÁ÷[&# ¢zY©–Û_”ÊyvórØnåRÁêU„E6nVéÕÖòS`ý'aòËÙëW•Ar˜…Xë­¶Ì‡2Â_©TŒožp>_'Àbn³öU6m‹-4sz	‡$:£'–W€ZÅ)¾ ’‚±ÛÚšù°ù<j“(OwrpÒHÛ<Œ‘8RÏ ·z¡üYªtZ8úå6õ ú…/¬L¹¹Êþëûê”Ÿ¼QÏ¤Ù÷ÃŒ‘;Éœ Á8Ýl³¥—(H€ä™Þ¤ Y¬Î"øLRê’èâ	›C´Gl3$ëO }Fq²Íþ­ö¯Ÿ?atr\…hÁßfpè<ñ/ÚÒQýáæ"@o]N¶¿Ù¤­ÜKkžÇîÇ°­ÇÛ¬?ýÄÒxÙ¿…ýðÑEwfEYû¼mû6ã·›´7Åúæs	Ô|Œ½-„­3ÀmA3c`(àÐÍgºÑ¬•©:–æƒP9“9ß¸$FdUâÈÅ£‹àbÐÜ9œaLwY<%·p¾rh]î…õúÍ&[¸ûï‘Mø‰Ð…Dÿ ÌÀˆ¹ÆÍs­’hÿZì©Ç›æ\ðÐbGå5ž·þºñ&&r~—éÉz#ë4,®ÞHC¤5DŽyNÐoëçljSkjkã§Gç›R¼»Š¶6.6¶ÂFTU×ÈØ7GKK;?5k‡ÁsÌï7°iðûnÎD¢²	Ãz^$øÿ'¨Ùj¾º…b7ü§Uþ}8@$$x€°ty`Åñ¿Nws¹éÍˆj
Ò›ÅŒšèM4¤Ü(—éÃF
W¢=ö#û3ü_SÓã$wN-šD—C©LÊå1È»#þB@·Á @
ñæ…vÖ¼¹¼ï2íYT—Ð(v[ä3³+Ú+ÅÌQEûÄvÄÎ‡›aOá¹Ö7ñMóèÚâ7Uô†¥bp›­bkÃé¿Noù‰,ð¦š4á{ß`XdY)^Ü{H¢že^òb6!Q°Ý¨ aÞJpŒ%ÍÑhK>BÂLIBƒ‚‚yó¤1[NÃì,‡ñ,kW÷¸Âu»»v4îß@>z‚J£j¡0àÍ®w™ ÿRˆ°—ý‘dgÍs‹Â®÷‘=ŠTZ…Q¹ŒÕ/Wî¨Š«*=êžÉ¼¶£ærló/.y!—Ê@ªåÛ4_äºBÒÜZÇ¦…J±ºæU¥q:ÆÈk{ôÖ«"»£§éüU|ÉN¯ÂÐ©®ñr^(V2WK±W‰9ÙÃKj‡^KÖo»ÃÍ*•õæ
i«‡øÒeÞ‘˜ë®º1|M2±!¯;Æ`éˆû¨r%Ù+\YÐ*|lOo&ô³TÑ"ít:Õ¶óŠz•l›9uu¡‚5‘‚êêø”ø©Œµtyñˆz,=¼{]AÚÌµd`\ØãÀJÕgÐ‡/våXgå™=ËZZsl·TQ9‰£XîhÝ;e/D54}b{ø<îÆáH%4€ÆCØ)ÔÔwè¨Œ>Ñ	Æˆ*ÎÚ%×ë<h9áÓ¤Ù‡[µÝÇ|m*’-XT«*¢ÔµØUho±PÌŸ{­‚_–4RÉøË0“F¾gxëyÑTá°SÅðöÆX¥;öj,¼®Û¯/€bšìˆ§ý‰»/‡¢E»ÜëS‹iSö•ïVõPñÓ(ÌÐ—=œ¤áEyîV×rD3Í²ßh¯+&|ž LNX)ya¥IG¨á_ê€Íoþð>äJ5ïcà^í`…×qD_ŒqlAb¸Á¾HµŽ–"d€•_-;w?VÓ·u
bÔKØèŸŠéëÁvø3ëU5\ÅÍVüä•¾±ÈÞ˜ç¶‘×–;s„`‡ÕÖË!w>äDª“õºKVÉõÅ3×ÎîNæ—Ró$!âWåH¢Çàáæ¼3Ï(¹•èÅ©ÄzÉ±ã¿¾ŸÕîœ_údátõšÄš+ú«$oÈ¯ŒéÕƒx‰L~^ÀóNZã¹„o8]h´‚s˜Ô™×µËÃo˜l F*±Ï/ó8;RøU…¬˜¿&™ë¥æ˜+ýØÇû“¡õÇuüq=¡?|¯µ|›]R`ûAÊ{¥½â—=ÑAÍ~—MíÚãq fZ.\ØR^Pk:G¼ò¤(—žñü¦ÉÆó£dxaf„Ç6ˆZs×yÒ)rÃ–/ýÁ ãSÙ¶ÍÍOE|¯èì›£Ñ/‡¨Vgf1³ YãL.8YéNê¬zž‡aÄžügÄð¦|-‹!¡/^TÕn^§Ô¡ÿÿÿng[< H†0ÊÇ²§N¸IjRÀ©ûEN¯‡²•BÏ‹Vô4Þw‹ÔÑp'zàúäúvÖ*~TŽ77´ÏŠ>jm“cØaO¯&­$–™&á*O-Ó`Ë(ÚŸE¯M·ì·äó:q×o{`NÎNT{6¨Ò:Pý(]¾I†svÎíùí ÙžG×¥±8K¢`rYä<íß–( Ñmùž¢á8¡ô×ç¡Œ;bk˜…2e>IÞ}³ä[ö÷ñf×”{äâ6Èà \óË0Lª˜…T¿H¤êÊ¨{Xá§ÞÒŠÆ{ñ¢~¹É]²ÂcK$ZAÇx ¡[ëï†ì3ºˆx@fÁõè@ IPX_BÎÿì*J†¼D6[e‡°$á8DY æí>½}b¥ÊüõÓ0‰âYJe#^D	lùËëhsŽ	a^K÷)5z]¥Œ6¥K‚‹§–<~'÷Fµî‡å;EÕÁ'j¨q)OÎ,/¦*rÃ-¼§•„7µb.\­mØh·"c­ßË©h]Õ{Ûì÷„xÍË|UT]˜bt«ô_Ò9MŸìÄ%òUk”líá½?ÐéŽÐ¿“$‰¤÷hmÉ›¹µÃ–½v³»ÙÚãe÷Øùú–'ñä²¶/¯.ù®Ÿ~v“VÛû˜6'LhÜÔîžß<P£ö‘
Ý¸;]r…IÊŽˆ¨?ù%­Êès¢Ï7ñ,“9ƒ0û*¹'¬?Á.ÃIÈ3xU†.GÃ]gäˆº\W4ß0cÕæ¬RÞ\M¾ëèyÞNnséà÷L8 .•|í?Îlù3è¾·¹;\ñæÝÅAìó€%>–%vëV×î\õmvÔ&rÍ»n§¿Žß+“Ê=õøxÎ
ê¥¼+örJNÈKèw„Óî’ð ^Â¢ØÌáë@¡?ßïŒætNgç˜î7¾ SëñU4Š¦Óh‚!nWýFsvÙª«s¶Ìp‰»ÄÂKþs]×çÚ½èýÔhJÏ÷OÎ^±7/Øáó·ûg/ßÕL§W.¹réªG²Y3ŸæóÈ˜O¿»ÕûI<ó«ðw^zŒUG`Š¯D•s%[áPÄúðüW½&Y¤€™å3Ï0Q3ß|ÜgÜœ´gLŸædT}9=ï%ù9~Þ„ØÅ·DaK(žE²xÅ4sñ%lgi…<ÆeeÑò_ãø#zŒKò"½k—JnÇIRžÎƒW$yðJÞÒ‰p¾åP³“¯JJU}F5(£Ú¶HÚÑt
•.@¨¬÷cÏyÀCÍ>)V€ú*O\ÎûÕáþÉÑá	;Ú}¸]{´W0Gõ’äÍ¶ë5ôþ©ÛµP%á‹3Æ>_Ú•ÁywÉ«ò/‚'‡/OÙÑÛ×ÏàFûÕÉÑò¢8Q‘½Y)¶ Ïö…mÌc³LZè‹,œ:òåïŒ’‰7û]
&1?‹§*MþoŒ(oONE8=<@îà©…‹6lY—[;ú&xè±öÏ	VPÈïb2Î4/·ËßV|á?üÏý×/Ÿ³7GìùþÙ},yîNµÜÉâWñ …øõ”ÝÛKádõí)¼;ÇÐNŒßY¸ŠÓ¥©Nfã0‰1ÀJÊ”%ï€#Øª<tËÊ,¡Þ‰üó<J¤6a	€1OrF©–e©v•\Áµá§:É{v˜üÜþ’î.éþÅÇIÎê#gçDfh­Då5KŒjfLÿRðÆå·0ìÖ«|`†*®
W…bNÄÁ}ŽáBOPb€—¨ËóÓä1	‰Õžoˆ]eI¤N–tqš(fÊ]õêÓ9_?³Þm‡‰,Rì‡óÙhôDóBöGt`Òí¼-rq|^ï×‡öp³,âÄ*·“}u;¶=e-Önaôá vz†{a`x†=×ïr—°“çÂ%Œ~¸=ûåŽ©ÅÞ¼xqxtz¸Ü‚_[­'p€´ëhžzß*×-DÆÎ˜
-Áxb­ê¬¢û <eþ%U7¼6ú½LÜÇ’àA¹¬œWÔkýüÈW‚¼Ú?=U9a~»Zõou1È²²Ó·Ïþ?hl[±ê«åj/O“À›Ê¡óQu<Ùê†ª9®P¹”õ3UÚœ*7-—w›?.©«ä2;]ÖwQÜ€—>;Ü?ø¤ê7ÏNOþJúUöêÍÏ¾dajUs›§“2tžèîéGŽOIã!ç¨-.3õv?/4[Ô–lEÏ:”|´³+7/Ö/.òFòûÃápë"ô$³…¬[Ãþ£áã{AÖ—Gg€¤ ì#–þÀö‰Ì²³ýÿqxä_’»1ÎnzÃÇ›^8«š³}lÕ>L­¥Z?cT›•Â²£Ñý<¹}w;7ðæ±ëÃ4‘Z]ÙÖ+Œ¼kÂ%B1öÞõÔ®{Â-Ã9-¼nÌuÝeZ¹RÍ‡Àa¶ð•nÔå~ÔUh¿Õ7S„ršŸùÁaìU.–,õûÝE¬±&bË´pK˜Æ„Þ¬[Æ’ØèRüæFi›]À0J+Ä;GlÓ(½Q¦˜?ÕRL«-­Ò|ð& ÝÅM¦ÒÏîSÑç<T¼å 4„‰ Æš´žRm¥YR›Ù¿^¥ú¥¥O~yóæûùíËçûhÖ±õåÁá¿*2cŠÝŽ½µ£8ãŽRäís\®­{às[;æôvÖ° ZqÔíìó|Ç¢,ƒÚÒ<¥Ú˜è¿p$Ã2³½ózÿþû¹xæu<F¦T-ˆÞ®´ž™‡°lw¥©¥ô;—ZSx@|2ŸÀ´¼q*Å=Oµ¡·/‚QZÎ³=q8Ð0ége\Žù\”
²…52wçY2+…:]Žâó`t4Ÿ…ÉF:Ÿôç4‡rm8ëg£`òÛàÆø¿¨cS44[#5Krú¢g‰iÝÁÛ|¢´ ¥îÞLC¯hÀzø¤duª<vçú÷RkØ«—ÁžµÝÈz†C”sK¨)Á¥òü®ö—F|Ï©ÏÌ@ªØãßüîZÑû|jVõ5V¯tcudM`V»Z¦,IÅÎ‡I<ÅBA	úžücõ]³û¾>ájòªö7–œ-u•gÔ”2e%]Êàfü)ïƒ{xÚJÁþ#ŽÇfIX³ZÍÍê#Ó9Ô2@káâé§UŠ¾Þ°ËDdÑÕ²#j½Ã6”>Ù“ìÄ°†.?ú2óˆŸ-{ ¡3Ÿ”=]çM”0ÚÜß%¼$:Ÿ‘¯ÀEc`?ÚÝõ­}jYO alâ®ÛÀ3a(«äÀ ¶*-åg³Áñ?% ­ù»ùÔ¬xYq÷(÷FÞâ¸Û3½ÏÉ!:á0Xå´@xC×bœÕé¹”sC¤ÿ.%Ah+bZ\t-!p¦²“-nIüx=gV¥xÿôôÍÁK®nŸŸí/;\mmN¶:šçƒÉPVpúkÁ0$¼ÜÅN_Ÿ9^ÝÅÜXgˆÎRÛf6¥CµSSž¶ÏËrU…5L/VÂæá£NB€ù„·s&"F­ó\É“º«|½ª¤p kP>o;qÂ‡èö€q	9NŠQDÇ‡„îqpC$h~n`›C’<SÞÉóÊè}Ç‰à‡ËuI(’n¢“î7ÁøúãÞž°¨ÏÉe¯³Ùd1kR:æëÝÊýòŸ‡YªJ.×¢-‹ìŽ^‘o&‡bŸ‡¤ [—¾ðºûÞ°¿98µˆÙÖÞä2ñ¡*¯¼ªöçíÙr÷ ZÙÀR(H¿R¸¼:©tMõ‚ˆÍ{ÙQ2¹; J×)¡—#Œ±Ï£¯ÇYdû­Kïà«PbùBV(õÔÍ+"+UhUí?²;âUîšNˆ?0‘6E»\Bl@£U"/ëÁõ+è²Û¬UJºäæP{NØ$‹³Us¬ÞO{ûcò:¢á7ÃÔK:­É†T…ñ–0sE´¢áE
tÆ‹7Ñ So4=aU9`ŽÙè†}ŒG Í ¹aÓ A&šÂŠs$ž^PžÚÆ ’×tï¨°ø¿ÿëÿXÀÐºã²w²øªgÚý
wêF»›eA6£Ø¼XÊêÃ(…9Dc{	L‡Sw¿åÎk¦×
Ö¹¬QxaegíBRgÓ¶ÿd¢€M§œÄTcØÞÑ›³—‡Ûì¯o^½=:Û?ù#!êÍÑÙÉËgoy„¦Íó¡Fp³ÅÿTN^`ßWgWQÊ[ÌàcZÆY¬æ¿LbÀ[–„¿Ï¢„JçQÐt˜«:WXQq…M“˜S\W`$ ™øBh?…ógºÍ¦3ŠÞ„ß!'Jö¦k˜79á-A'B§€O“ÙÊy8	/¢@§hvØQ<Y•³I¯0{(;	ÓÙ¦7¡×§<¥
¾¸?0ÏKX«˜âG‚ƒ…Ÿùn]»œÉ0
&–¤Ë_hÁ$@pÞaŠ&Hb°ò6ô›Ä×£pxIPQÍÅrTÝ5ô‘ÛÏ(øÖ{¿GYŽ.VØ0ùê‡iœ¢ô
2z^kì0ˆÇÓÙ(¥žÀ7ØáðN€{¬l>#ÁŽ’©CU !3eÞKâ!Ýu”]‰Boˆ‚ÅÖ[_ai‡õ»ý¾ç°mDÐK§fðB‘kg{’?àÙh+t¹­¹º?½¸E¿\Üb]OˆøSáÏo"ÕâZþ_Å',<ÕÍ d©ù‚µ;}+vò!
:ýÁ:ÕrIZI½ýÎg½
¥RN	0òßËÕ”òº”½^E½#µKB
£Þ¤¥t¤ÐýþÛ`0xRªÛ¨Õ¬ÒnVVÇ6'.JÙQcZ™5ÄÕ'Âca5•.}µçÖÖÖ“ŠJÀòSë˜Î”Õ<[‘Â	JÕ±‡#‹eÔJ£~ŒÅáÔB^TÅªjŒ¹%·™,6–¾‚XëëëGfÑ7W:%Uþêƒ–¹Ï	Ò»'……Qúj®ƒvÜc&Hê±Úõ²
[5,´ ¾rÑ½vã1è½øäÜ 8|_­»®ÁºX©RÒa×Ta{0(ëúí»Ú?]¹}Þ}÷XŠê‡C¥¢^ÏVQï‘‹Š—v’âÌnã÷Jë=Éº9ZÞžq|9€ÿ¾I[ÂÐœ³ö÷órëm£ãán4l³†bé‘-bžÚlk;÷•m'x)µóÎ?@{uI%DkôànXº²I©T† :ê–j»ˆÿèÚú€oâ¯¨Êhµ	rky1îŸq·Ã±„x
JÚñÀPâ=}oËrwˆ}©“Òv4J£Ä6ãV‰»‰<ÆYÜ„Yý¼ÇLía'^…jß'`¹ærPRàë~9f¶ÞjÒ•‘Ü#÷«sI½‹Mà’<˜•Æ6\Y"%«Ï!dùç_VEÎ(ùß‰TirÖBG¦ZÓ¾,Rç:Ž°w¾qþùpãN¤èžiTØº¸0øð0¼èÓMí*°µ9õ´âí…
@œHÛtÊDxAuªdP¯³©.	FIß“$`]ì
YÀÔ‘ÙHŸ“Tp4ðÑ@ûPÍÞ—!º­B/×ÅÖY÷Ç7[¿­§:ÙÐ4MÍ„=4?|#=æXŸ«ú~Zïë•»€öÿm†šÅ)bÕoìAÌÖjã¤èo/íPIó«0îíP* B—Šë%ã!VÙû3së¾àÇ¥5ÞÀ{ï?¦ˆ°sÆ¡»¿Io'A”Ê÷Þæxü„Ý2,ÀÎ”ü	]E?¿c8¶¸³ÆÇIõÚq<ª™  ª¾‹zôñ«_³]¦ÖµgùÁ¬%ÁÆñˆ,ÈÎnŸo]  Só…”çŠgY»º¡öëÝc‹5ïÐÀÄ;›â¼¬½(Y/
Ò;ë†6.3o1 ÙêÆ×Õê+Æ/dPó¯/ãYZ„^FAø¾=Þƒ‚¸ïi¶+oXóŽþ]IþPg)*+cìW½YBÎ*ã–þ±ú®×÷K·1”¢XãÍîÚ£r¬“Å®ËØÅ‚sÑÖ7a\nŒüGvCÉ9RøCNäñæ
»AÑŠ‰r¥µ×{ùë=z×ñjø)ÊíÖ‚åŒ½ÚøÄ?]­¾{Üýxõ¾ä£g”{åqZŸ¼ÈÖx—é¹u©,^á›×ß^AÉá†mmA+_”u4c6T Öâ¤ÓwÊ³†çÎ³8¦PBY6~ã®eã«»³ˆ§y:3ëñ4ÒÅ“,¶ö,›_¦é’
·æõãíå+«Ž`àÆavX­ «øór×1 ;ºRº{ž|n£aXÛqu"E¹#·ë¿Ên&§¥á9ýLø¥íÃ¾êè¿Y:rsÆQç³+Eì£ps•2È®ßu£z¥ï‰3ád W`„²RmqŽ ä*ð3 ™ÎÊZy&J':p‡R"_]…³POæNÊîÜ1Öß+òº
/•àúy˜JR¤øæÃxÚyW±A£á{ûØç{ÌƒôüðÅþÛWg?;<yý÷çûgûî8ðÎþjª¯ODå»Aƒ]>ÉRv:Qþ«¯ö[q R|]ç!u>%¦æïêŸÁÇØ(8GÛléW€2 ÿ¿ÆÉoéÒ
ûŒfpöó%ì\_w®SEËµÂ¤àX±´××<U

#ÿ®$MüQ˜zôå'J‡µÒpÔ*-=RËÈA*k>òiæy8“`4Ì/¿/6~"üûi¦)Š#¥ÑgÁ£Ïçè”Nó±óo|äõÏóU£Úa…ED‡<àeZåH-9ÿ€œ´Bô]eHu†PcƒTQL;žvh¶ÞEéYM`@åÏ#×Çpä	á÷ø8h‰Íe•Üæ9tÓF;«fh0\‡%'AØØtu0• ÛÂºÆxG­ƒË§Ò]³G—ks{–ž…#ïK1_E)÷}ðkãIG#ñ~¥è]g¢×ÄìA=<"Î£Â–gõÚ>n;ß1n‚@òØ:+Î¥‚EÁÕ»Š-\Œ=Ó¯ÄeƒâŠ¶]ó¶àÓHç	C¥‘>í¤ƒ8–ø­wï—9¥§[’ÔW%(]²¬À'àí½Áo§Ô!ð~qyÝŠ¬þ¥Ý§©ùÝ]Ö]–ÜJ#MZáÃDÆg×PQ‚äÃlÞ¶0¼ž¡"SÆ‹®~øA~ìdI4žþ;Ì›Ž•k?üúë÷óˆRÔoÃ‰(™¦?¨¸ÅäS-·ýòaƒË—ãüö(:å»ÊR£¬Ñù%†Q™^ÆcœkŒ”ò»suen÷ô¯Í;N÷~x×Ì¿¢V!jFp“-<!g§Ö¨I:ÌaW.?ÿÓ|ñwªÊ“è—»˜iy¦Ú1Ä¯–-¤Ÿ­"ce©:.é“îßóæh[{'Aßî‹íSQp²)§ªhsûï_žùócíg§J²ç7–ÊÆRóâ\U	Ô_7g5-†K£}xîªÜãWÍa•‡û™¹¬ã3'—eâÚ7Në§õÓúïÀiÉ“è_ÙÂ¸²¯”ÙòzÈCÙFF—,ú*úô”ýÀm«‡Ÿ‚ñú·¢0¤Ï|>cæË$V0dÒ° ;f˜,<X1O>l[Øº'<téùqêÌÇàj\¢B 
¿“Ê®Ï`isvØnCÎÌÆû™«œ_Óö`[êJ—ÕxšÒÖô"ži*Ûˆ9°¥z Ó;|ÊUCÀÆ˜§w‰Z„7û¬O…kœ1ˆŽ¼¼#Çûm¶´Z[Ò»êÊ[þl‘7SQÌ~¾ÈoCŽ_ôëÇC˜.bšÿ˜žSSæœu9†Iö¼ÅMÅð$ÑÖ^ïþ;¹öËêÁ‹¡\¿žn#ùä(±†4k™ýÈÖ»Ë9Òógû4`-ˆXM{kŒÍ^ðd½ª˜Ò¥Ÿqý¯æŒë=ð×´ýÍ3®?~;ãDóßÎ¸ogÜ·3Ž÷óÇ;ãšôâ­û9áÐ#ûgÛÝOµ¢Ayž}©“¬ØbµYX›k”}Ï²ú‚ò0ËQ š®ªÍàÐø<û   ÿÿì½ÝrI’.x_OE«)‚U$H‚?’XúŠ¤$Î¡DÉªÞZ­¬•’`¶ $*3A
Ã¡YÛ¼À¹˜cçvÍöv¯æ•ú	öÖÝã?2"3AR*U—hÝ* ‘áááþù}wöä™˜ß_‚@3ª
ý™$ÚK¢‰B!MEZ§B¤­Z‘¶þû‰´n™vÏNðiŠ®bžh4»¿lðnè„¤=ìmÑç,½ª>¢DWªÖdTf7ôV	üíkîb£á&­4¦TvÅx¿ É3 œI!DÐÅFÓñ”ËYÍü&¤ß1H©&BU¥®›Í4Jz\m|Ñ`A+*y›lT­(|¼â¬·¨ŒKK»Ïspù&šõ˜l&Ór“$±8¢©¿3Âéžg8 +%¤Ž?ª„T½ÍE:.,¯íÔô€¨ª’ôç]_¥ÕÚL¥Œ‡ž÷²º›jy=¥ßäÙ³éK~N,„ë`Ö%TÅfÔÅ>Å™ëíï‰ÈLÕŸÐ¹òö¥û+«ªZOÀÐn¾ùFBL°£x„‰ÄÛãq–^F,“Ûºféè í§“Ñnö>Ž“,îáÇãøo”rµÈFévl¨­-R9Õãt³Ä—KðË4é=C¬¸9™MšWÍÆÍë²›g‰æ“LZnZ¾ÅR¹žvQÄßßÑ	cÙŽXÔÇý	Õ‰A\0‰³Ìš‚»æÏ³t(Žˆ)ù9ÕçÅó?‰Gèñyï¤”m¬¸†$¿¾ê4M<>ÀÉSq×hBÞPˆx®y±HL®’jbç9¢ªÀ=¿¦“Œ0g&©;Éh0eWQ‚ñ}áÄ&0{QßD{mO³«d0 ±–t4ŒàBSl•Ã¼ÀºvcýÁ6Ø%©'qÎoéq°×ö<Í*ÆÎ©õ–Ðî¾iÎÒœg›À,ÓçM1?ÌžbqŸ(á'²'˜.¯ªçÕä$ÀzAŠáÐÏ7,ã”$X9Ð¸§Æ÷‚ÃŒuZ¤|Â$\]µF
ø?v’¬£u‰Àx‹m±²r°¢— ²¸ÏW—.ý6AQpåìÐL<,˜,jhó’Ãh
7³Þ„À¥’˜A<Ÿ((†‰™Œ¢Iq‘f0âž —6;â YÔÁ#D6ÅÁŒÃUè`Ä—Ðöÿ‹Øn‰>ÄmwyL^Pµ@º0,‘R.|‹¤å»SQ,PMËY«ç“d@›±b±Þ¤ìdšƒ¶ÈhðŒF_^±SX¦¿¿KóB:L¨‚Áš"Š.ißmþ²·kµÝfÛv_C0:p9%Pk†Æ·:|9O2ºáÍÛ‚£÷çt‹HZÖý-Å¶}Ê‘Ìþ¯ùÜ\ZAÈjˆÏ u%á«Š¬ÁòØ•¬¯d´t  1¯T¦Ž—*`KØ4›VN¬‹9À8AýAˆ7:
R*™;šè,OD'JÇKXÕæQr”ËÿÌä\_.IAK@×0‰ðB‹èkÅÑÅ©¹è>–ï¥r«Ëëà–>]-½ºE…ðB}\hÕ	nb„ÇFß
Èsõ‡P¹Ìvÿƒ*§k8¬{‡Ã3CjW¶Âe 0*Š\|"swzÐ°'IP!!€áh¬ê·Zûh )¹Ë%?·B"öE	–h(¶Ð¿cÆ­ ž$gi®ß×lŸU‡‚z‚…DP²²ï®Þ~óÞÂ%)17c¤4‚+xUè©3#”Ðð#Ï!Â&}wÍ…G)Ÿž®›º|I'¿£›û/E÷]“Œ±»µÆGƒå<s¼AÀŸ£ÎžSÈGäñ_]+õs%æs’F%á0ï$yÆæ~Õ‚äMû8K@Ò„²†*KÌÇ^’B¨¹ðN±ó’NE`¹@Û¯„ˆšœqd<Ü>\œ­;z1Å®Rph yÂUhEsŽÁçÕ”xÜý®P7jÆ 1æ\2ö $)`$iè™ûÊ‚ÕãÿùÒ*†’WŒ§KkúdÀŽ$¸pFÞ‹ø>ècúp²-‚qCÿå£‡ï49<µ·Š!çO’þˆNŠytEÈ/ì{Ð¾I{9€WÈæoŒ9“(IßÊ½÷ý÷¬j‡8‡/^X*•¶m[E6‰·‚íÒ^W"#P0ÖvÉqW˜1ß¼ gÜK&C]ƒ³	øbÇ]w{ea3?¹¦`’›ûÖñ~ìÀ´&ÅN”õ$@ãæM`Ëàùšë·C'b7"º1,ª˜F‹§º¨W†`údäÅ 0ãµá“(­t	Ñ«B¸Àƒ^ýÁ½©ŒièÞQ‰¹ÒÒÜêËëÈðZ†á i°pÃ/cÍŠÆ|Ïž¡Æ=TA=¢Ò…Ê˜÷¨Õ/þJ»ò#@
Ë…C«Þ¸tdÓ•A¬»jÆÂee‡eHßú÷f-^lªÃCîaéè•Â÷Ö¬ã.n×ìðgDCÿŽp—wA»ô/”Ùe Ü2àÔYÞÃrî©bÁÑpü“dÃ!¨JŸR4t]8Cª˜ú¦/9i;`ŒIhÝt`€Ò‡“áœñN„ÿz–„©ÚWØôÏE/ÑLLÈÙ&ëké$aÂ$TÒôü:ç3ÌC›½ˆãœE*¹Ž¬ÆÆÐÍºÃÀ
PaÚRÝ¶âf%Zpqã°¥í8PÚ`½²8&¯ÑòMÉ…þ,N¼U»÷\¶&N¹ÃÇÌ¹z5rìcÄ§í}ÎÙ”¹®§ô´uCutkŽµÇré¬ôÁcÆÇE>µ‚Y‘q¢”ïšªù¹#‚k/·iaïaaEÍÐü¶ÍlF“h€ËZG¯ŽªÚßoŒO!||`qƒÞè,Í¥)êÛa®ÍJšðòFUPüã¢ç}}2.Ða†`Á‹Þª²]›¶æž>|ù,†ýsË6=Ô«%ÞÜÓüço<zTÕvxù~—ù}M—ïi‚WWØ?þþ_¬³ñÉ&wuqõ5½QÖïiv;›4»°A?Ùôv×ÿPÓû:îG÷F»«‚=Dgéåm×¬~Š×ÝvŠáªŠá“ÝË$¼ƒŠ_­ZaJêAæPuÈ¸/a^ûÇüN1ô
Ï˜¯Î,;MÝ%ìUz…®LÐÉ½ÓçOgŸØ)èçÜû9ƒ{â/±òOÆ´ ‹Dåì2‰@y-²tÔúr'Ê/Ø2ÛMúˆQÏ(êËF‹”»7G=!\8¢ÞÒ9¨ÈéªÔ#*w³ À@P¾×ÀTÇ›ÕiýMSãt¨c¸Ó°N‚Ç²%gáJ3ËvÐ¯µl+ãã<~¿‡Ÿ²Jƒ/mÃ›¥h·fx¤“sÂ“5Ê+6ì®9SOGiÛZ`ª¬<ZÙ`«¶ù°óàÖõj~ôÍÏj9eO–‚ÀHÐÞÏÉk(ã´ÆÆVU¾Îh"kÁ¶ó›žÞ€Ò¿Ù˜ÄÃhÔáô¯ý!BƒwÓ¡0$Y4€MÎkrñs‚Qâ¡f…7phZB.”
‡‚}Éñç¿n8¥gŠù£«Ÿs°ÀD¸ß7è|´ˆÅè{’o¦¢Nðvï2‘×¹ÿ`'`=~©?HÏ¢ÁI\`ÀY¾Hí¢CLµú„©9ùË­ð{v°•y“(‹Þ¾û†Â
Õ í¸B{À[ÿ=ÊÒód‡FoÆ–Þcëí½}çygôSù¥¬ñ”^P÷U~S÷IùÖÐ“1¾¼ãˆ'I9E7ÒšqWûîiëí;
Cbí3xzô€¶‚"éé'»£Ót7ÄE¬ú“BÝ²ÿ „¼§¼.J©µ=àÞF[øuæ–Pà}¸A©­=ã‚õFss¾çŒyØ³¯yƒDutieÝL=àÁ¥êkE§túÃƒ7Gƒ©ŽJÕ×B‘©¢°çOxU¾êÛú»5uâbyÝ¡íQÜí¥E¬ZP¬&ÄÕhpL¥.½Mn?­jÌ¸d5GÛÈÓÄžª¾™ï&Q”‚üïÊÆ¼?ZÍ^³¤'ã’;f¿÷Ì¸ÆãØŒ«o?ÄSùíídvãŸØyžÁ•±—@nY_£Äc|mº?ØMÒ¯å©Ô(¼ÈAÚçë°c\¨!c ?ºoÝáÂVÑ¥ûCˆ8——Ù›øŠÑõœ\·ø¬‚lö¢Ý#þï8Hûª/}©zÀpC¾Mçø§Ñ™`_Æk¾æÓl|Úü<°ùhÛ›>õÔìò_z“ñ ‹¶âbÎ?m©§¬EÃ§ÕünËoõ$.í¶õüs±ú•Ç,vé4qä\¬_f|"v—Ø¼XÝÄ%¬&vÊTD[’«ÐÐ/ÞŸfçåA!Ëàä×m*–ŠëÁ³ç«uÎ¢óí¼(EìÓ§­ë³\øŒ›æÍîª¯Ö›ó¨b)|éŒÙãWEP¬}µ+”uùÌí ­­îŸC[VÊ=†2ko‰)û“è½D#Z$ó`ÿß~RMO;óÇ•,¨dÿßà]›ÄÙ´%Nv°´h¶ÒÜ¸ˆþJtþWÜdsX¸¬‡çÓÖ\‘±ïp<÷9ÓÅ_É0)Z«++bX"P[ö$Pö±Èª9D®aíSäëüüO·×ÕEœp•á ž<¡¯[Œú=ØÉ(ŸœÁ@@¥EcX¡¢õÛ"kåðÅBL0y ýŠTs2†T
ˆK&øÖF½´ÝÆ;Ú½¨ˆ€nTNo©õæcXáµg™Õ=Ö¹×Ó¬5·‡ÿaçqÑ½@'ÍÃ¹ÒI¢pìÌ6Ö¸sñ_§M£ Iâ5bap%†î[jû*Òè»;í¾ZôÆz#Öq>u™nQdSé‚¶Èæ µÉ?§—(°Ë¾õFoù^Á‚ÚhØ}˜Ì½]£5â…ùå}F’ßÞäÚÂùž*zœ5f˜Œ7 S½5!0ùç‰ó|A]éui™/ïðU1´6:pÌba£ciŸíæ.ïµÍ7ñ€žõº7ˆÐ½{ëÚz÷ÒÖBœš£œÜÝP|êoøW‡>Ã[FšqŽ	m¬ó;Ó í¤7ˆIt«mËd’½G¼krc´Œ»“¢ÜXy'y”S&™ÛŒ7Ýœ£«éÓ”W&VunFâ¹ñp\LÍÅƒ™ËŠÖÜ›Ôæ˜Â€aT¨Î¶çŠ÷½’ÉþB3éÞc²&½ýøËœ!™ÅÜu!ï@&$÷9QáF×éLÑ‚u#ez=Ñ88ZÞ {ß‹à	:'®ŒbVí™êòÎvŸ/@}üø£ÃðxÇ°Ç±Ä¸ÅÂÄKµÇ“ü¢euÓM‡(_MvÄš½«‡ù®z6o¬õç7>E,þÆÂ)
ôÐa’Çm0ÄZâa}QÐû“	E›`Ç”ñ™ë±ï®iæ‘UÝÃŠõ"³ö{¥ù‹—­ÅÞ V—‚~ÁË¦a‘T$CÞáœêÒ¤SS;©!ë:¢¾q¸Ÿ‚hq’y¤Y„(³¸¯ìðEm‡ËK%Ù.oÐ3$^ut’­Ê¦jNÆÞ5wÜn—k9má5nÍqÿO,äf]¬›ÇXÖ€Žˆž²Ú,s3Ø8Çñ9¼6| .ö^Š²e ù>7Ë¢õüý"S3ã ŸÍ]l‡5—Åðè´ÆY|‰‡ÿ•â—ôÓ§Ø4è•¤‚è^\²9tß8÷µAG	—åYH¥©­%cÞ·(ÚIi	Oz«4&A2kD‘ttáùØw¥‹yÕà_yƒX„5™‘”OÎK^È$$+/^)°Öb©g\dñ~±ZåÐúbwVôètûÞÛ’§³w]GÔRä‘ñ-–Ðð„~‹hLÔ}­£öÖÂëñ÷-î_(Dm¬_âÉaÙ |“3ay½âaû¶ED†zœêU°å¨øjÚÃ”hÌÎ½R£n÷¾ˆQ¸ß}Œe‘au¥†læ½ -âDÃsß]c37s¼¿Ÿ‘trS>ƒ¸#«Q;ë>WW4:ëÒú}ChñD>˜C´?K!˜„mä–*ª\kõe–NÆb‘„R6oZ6†£„7àúWàjØÁò›¡Êxíd&áï}{Tî[6^Ñ?¼þ®-áçïUÈm»[¸XÑ£Áºj¦[pÉ@×¼rïFû¦;JÎ7m˜à+«}˜dù´;ÑtÝÓ8Ì÷ÇQ”zÚ%*þƒÙ!1.¾)gDÙ­4‰õ·¡aI¸–óú„œ/68°à\|SI÷eÿTºÍ*Ìð6´ÇZæâ?Ï€™
³Ù)“tj‡Dè?Õ‹}ýì0.ã˜ê9&•áU°=<¦Õ%'ÈGÆ®rÎ7Ÿwþô€¿80&Î9i_X÷lê”bÞ¡sOÂ/H;É ¾µþ‰HÅØâš$Ês<”zÿÝ5}'pœ7ââüü×‘uù½¨§Øˆ£Ñ´Š
ýº^ÇÉîW4·º#eŠ¶-:	*´žu×^©êTúþfqÖës0ÚcOK\ï®Êƒ¤VëàKY#Rý —ÙOºôí‡œö‚
_“kT›×ñ0µ‰ˆŽ¿#vÜ©N´ÅB<•Ã’¢Jy€ó˜N‡èŸŒüJ3ÿ]°ßîP§¢k˜ fø9~Ü“ð„bC'=j³`øëAŠæý¸GææÄi)Ý²å±|^úiU\UºËÅW#ôÉñ…Ùú5\e¼ÿ'ä¡læµÚ1‰C§)Tž=5¨ ñy<`8,­k{bM»k=cûëÑpÆWÃÅWgì8æú#Iß›®wË¾6”î›Ðq’Š
$™J5§H³«Q3)QÖ#brr±OpÆ½|_¦[lE`N•·qæ¦§^Òïs§b°WûÍg×WgÐVÍ&££ôJÚÌ¹ø¦#ö
ýF"Ÿ”¤§¦À=Dö­Z‹öE”·ì'ûÖ"â.†ÜLfœ=cšEÚÊtý|ÝB÷q½cÕó§N`™i”'ÌÈÙ-Ñ:;Ô?uJ‰–Ô6ºJ»ÝT9Ï†çëöóÖ³5[ünKåÿMÔ]Ì~×è—­TZþž´ŸvÚûãnÚ7åÏüñÅV.`Ø.Ç*ý öcé¤8÷š9wü75.|agT ƒ¬øã4Ds<	¬&TÃÒanÈrÃPkJï?bÃjY13H¹ØØAÎ²‘mä¬˜yÍˆá×aÌ¯Æ©×°û6âGšDŽü9cFäÌÕ†Ž|£±¹c^˜m–ÆŽ–¥û˜¿Ú£3hÎ…í;lÆ2*Üª¢#¼U6U4^wHJ\x\Ùü¸¢ùæGe1^ˆ+;Š½©U".FC?¼Q\¯%H8¼M‘Lþ°Yim=¶Åæ€¥c'ôVD£nœž3Þî3|¾-ñ©·Ø	™ý4 ïí‰<ªàÒMx´{²ÇcéXÏp¤c©Q'Ú1|˜tÿôÎyÛ ^íÜ?áÉ ‚'ñ6ÄÆÕàæ„vÇh<
cáo†OyN~þ!.G†øE¨¾‹lB§Àx%é‘¯ÑÈKñÆä×†âsú|‘˜WÚ;x(³ƒ$/æá¿ôžóµû<ŽN¨}È·Ø…Qô)}ebx\x–åÏcxùØÉ„ÍéÖ-°ë<%BÉ‚ ôeÌ“ç·-;g&ÔxÎèž°k…ñ~":àI«OÑ
ÊvúµÍ{hÉÃrA4<dZ¾\–—Æ/¹Ï,é^Åe+V”÷ kúž†±üÝµ;Œ›÷•|L¦˜‚Ô†qè¥‚õ9†m]´_¤Ùp!ãiÛ(¨àÚn|M…å8Õ©´¥"'Ÿ5äfãóÃ_Mø¦[}ÍzI>DS~vbæà*—•Ø«“½îqÚåô¤û’;UÒFD}ˆ˜ŸïÒ˜t~W8ÞÃÁá›XÞMmyîøwš=>€òìé~=D{»Â
ÎÔ‚0Q(×ß:)ôm~’Âý¦¿"ÐËÜuS\)JŽï=F—µ¬
a>Þ£Ö¿Øm>¹¶¿ˆ ršxlÞ–J	wõV¸\Îa&äßEœ¶°z¢x[^»i£×æC½¶Æ×ƒêT³Á4lŠ )UžÁ´6:zL‹«±^Ý±°ReÀzVæªâCö«• Ic%TUˆ§?¹öqú›ÒCàHU0²^ˆ‘AtÊ³f;PÍQ€Ôè²pí¹§Çºh€=^¦Îšã±á*8€¿Áê©hü&‡#>šìŸÎãnšã¶ÖÎäE1€~2gŠ5ÂH™û4³¼Ëe)‘ZÕ'£ñ¤ðUPÀèßp½·Ó±½ÿwÐÝ&°kÌÖüUSÓÑiO®[±D‹6Á7À\.À¯hS“â¯ðæÝø¨#Æo÷Ûìß&ÑˆíÆì b;Ùäßý£,ã¬*þB´ò‘¬^´T4W‘»è/ºRâòêŠøÁ†WFÀÕtR ¢â>n‚ ò2;ã5â½ÿ=þûöîùµ)d³ÿ¢7,„'ðÂ=càÔÄö½APÜU	}dáŒkiÕX±†54”±îVýžÎ’™Ëé{Pz'°§w‡P)ËïàÛÀ;è^xÖÌ;^?í9‰ßH+'°o‚±¹U7*QÌ2s2D¥QÊ{†	6ÊtˆOzTË5Ù[²¦–¬ûU[db¦¥Ãx‰oMf'‚Bš-i©µgX¿K°…~¶”Qœ,?¥‚"XÐóÒ|¾Üo–Þ‡†ªH=R˜õ¨®öbÙ_ˆj\FÚœYKýª)pM1mHÏ<Jb“">\õÛÎbªþ—OÄ‡«ˆCMy2®ÞC*³kY}†[ eýóÀ)t6ÀóJH±

?òŒÍ¿â¸ë­Ã+°Ü°žN¹cUçù/AñŒ„.X{)Õ2„•R†ã›A¦ÍP£l‡WVÀðñ[£†´ëë®–à’fXô×@âÕ07Òß®¯c;gÄe^æNAÖS;{–eæù5Uõlá…>iuó¤ËC‰O¢wB³Í!ÛFsX®·ÜˆCûàºþi9µk"ƒ@eSd`« L}%¿3öðãÓ,Ê=¥ùdýá¹p‘ŸþTÒ…ÉÄÏ `è|B¨UÑhéQ{>é#2ƒ™ØÕL$ã19ë¥TÇ6þˆyÑh:L³Øfóðiÿøxï—½ã“ýç{Ÿ‹ËWœK~e÷µÓèFýÎÎñÅn3X>^ù|<_ô?;Ó·7æ'gþ&bÇ¬Œ¿s+Æ¿ùéÈý÷U „‚¬ð„{î³ÊÚR‚c»H8_?÷ Û|ååMy¹ögbè‚¹Ò|R~îGT%®Þrã1y´E®“šüsú'ç¹ˆG™é*ÌŠC¤PCqwm¦9š%z•œ£rŠ™'ñL7n¦=ZGÓb†'Ù×PúY’O;<+$Ÿ[m½Ä
¯—`¯¨8:ûaÙÝî Púú‹Ã­ÚçpË•NÖ³¸¸Š=ciZ…Ä_ÅÄ/Õ"³TÃtëäY2ú°ªŸDÐÄyUaPº+Xâ!XÃ'úañ›ˆ~·4&‡·fÆfÕÅô
}à«Žð7N§æž‘ë#œÇ‹ó7†‰"–Â+51f)|Q!”|’Ý6Ýè0iRªZŒ«ÓV—ž•"fmÓ#büGªm hMÛßÃ@pÌÓŒÈ€ƒYzx³QéaÏ&Â¾IpíÎSOïÕõ²ÌzDïö&ÖÑÐDð÷§YË¨9ÌêŠ]¦èÁ†Ø"p-‹HA©e;Æîåšu€ß4ÙmÏBâÝ¸©Ý½ˆ²í¢µ‚²ögì\ˆå-S(?ÓJCÅóÏæ½{§’ë¹aWa[._¤'Öa‚n¡/â€˜-…Y¶ñÌJDÃs¦.ÝÓ„[ÊÞ± ð
†l\«I­hÙ=šÁjÄíÐJè”Ç€ð*I‘
“,*êzÇ¦DŒ÷Gkˆƒ™™~ùd
ÌŸQ hlgSYp‰‚›ðÉÇüÊÅuI“6ÿÌ¤oì0?‰ù-ÀžÚÀ%úÏÑª](—Ìé´íž‘àC¯m’ïÉ¯óîoBÃr”h=.-!0µ ô$Ð¹÷õhFx:ñš3¼g³ÕƒogY4mŸgé°ed¡§YÑjE‹ìŒ(â¬0Ä;éÓ­h!Ô!AèÆd*d)©ÑþóX)ö_-çY/ëæŠ÷­êkÔVƒBzoR>’,M‡œªA¥¹HÆˆŽÈ¢.ChMæÍ+ãÕÉÓC™uíð«†Î…Ý¿bRÍÕ |iÂžn—¬àÒ.ÃÛ’ƒ&Nƒ;Aõ[¶uË{Ôhló®›T“gÓ½)^6Ô`ˆyj²›/’ä²´¼¯üËÛ|úŽ¢
82	V’·¡°èñ„ˆÙº®ß™(b>ÄÓ'×ùÔŠÞ©‹REýÕ-1¯
iªÅê¢–Á˜/ýçØDajá:*²U× aYáÝ‹µ7âzm±oõºÖ<q³PA£tƒ_‘å8ÐZ÷…íåá|µTnÙcâ7Äç¸YþWµ´MÝ$¡º½F;²DDE`»v{‘hÅQEË®ÒZæü ÂkaLX]¯x¶5åñFÏÁx!õUk…4ôÞÔ¿Ãmú¾šNªT×ú÷ç
ºcX‡ÆôÌ¨„[sàˆ(ºP–"â7îŽ¹Õ£ÄWWq–sœÓyOìáìSXSc—nqv£òÔ¸ëŒù2¤Ç3Øñe–Ž~[ô/&ÙEB2«~ßÚ7	îê¿ŠŸÌá[¹Þ¾Jœu)†
¯G—;¡ëJn£A{L*v;¹µ­•Á¯5Ve=7ã‚h*ó“ÎÚ=Û–œÈt2ã,ôhËšÞOâ·å&EŸé²ìèQUêÇÜÓò$7ïÍBMYh1Äú-‡aA–l¡jÎG«¥cðÂZ»eî)Öï‘Ó$©±’Y\KeSˆi4?äkòjÏ%é4xÞ;Ådž{¢Q–úI(Ž7Õ›¥¬Þ¬Ùt¿üÐÍ¯’¿uVèGceÔÉTÞð•}w[µ¦ªM¾¡ŒŒW+ùåetýxÆBÃnv8Ëý3èJŠ3lœaî)-/AÈ7ÓMœÞƒŒÉêÓŽKþË—õŒÐÇñe<¸aßŸÁ,þÄv°]&(¹Ñ3†ÕŒÝöö
õÌ!#Ê 52 ÐÉV½úÍ®·Ú¬$Jg˜YHa†é[$àÝªÁÚ¶µ3“J"'-BdÅ\L´iª•XºS¡Ž“<ÊSƒeþ¼
Œ‘oøIõÑOcõE-ÈuØ8¹w&`É|ÙŒœ©?Š
ãN2é0užIûïÞü”f(U›Ú†eÿ–¥ïÑ”UnÞÏ|Óök]ƒîŸÖÕpT“íf‰rÞñæýíô8µýËjœøéž´¸[©@Þ½â,®ú“$ÔŸ™TŒZÝÇHH-«>‚$¶©sÎ¹´fŠ\_#º“úÚ§Ujµï});.£ŸUGém2€›/M‡©½¥¢“Êgg:ó½Yðå+Wa8WQÓz‘¦EÃ`Â×S)˜Pr¶xäsƒ~¶à¯K´-„©‚<]çÿC{?YLMs‡&òNö»>	’ÉÄ²º“,O³¥qšÐAmé%|$BÈHì/T©Ì³ð3$ŒWG.°Ã-'E—¯þù‡@LÜP\Ç§Œ1{d(ÎkÕ×Ü
Ò]ÿ8qq70.Î´2xÝó>C‘,[¸Ñ^§½hŠÝm¹‹C®W"¬)Ü(7·Üm¶Kà)^eƒGæß6¬w=øwgCD€«çÈÈk‹TçäËÐrŒö=Ó´Á Þ
óD¿¼ˆßMGiI†}
;„ïxøžñ:9;ŠFñ 9h’ÿâlÙ8ša4ÉÅ‹+È˜½¡ºvÔ}u˜.1Þ2§-’b ]s­ÏQ¼^"«Ì	ðÐ´–FÑeÒ§åbÏ=p%þð
µ
.aqBÍÇ®²h|÷<+\U~µæy®pî‹&Õ£¾~ð«¢Ž%FËfEPú:"Wðžï|fëÀ9?|–£÷ê^ÏØ¼N448›¾ÔôI€<çý.°O¥þ„£å©ÑµAè¯¦Rjù$ÜCºÛˆ}š%Õég¢å|Fº—Ô~UT™û­Mô÷FP”\ø%'>ö
bò	JGB:ŒÿË%©W	N÷»é¨	Aa=Ê.d§”8ÚºŽd®¡á<üLD¦‹ÄýQ9—ùg†g^•$'¯}Ñ4G“Ó&‡q¾ƒSeQ÷Ÿº&Ðq7¥ºþ˜äe¾B}EÃ3 ›ºô5I[üÊMY;é¸UíSGPöU¿"ˆ3~2Ž»ÉyÒU	]ðþQ#KQ$b»9\ÂÝ /7¡Ë6;e»ÊõUèMÞÔeý®±y
ŠòcÚRf½º[Ù+)5ƒÂ}Å[T€6vò­î…àj-¥‚þhð`eËoK	¥
Qvé–ŠÍzk‘QÕÅ*äòmTÝ]Ô°3QÜÌªïb•tùv\ÝÑ¸aGNM°@Å«ÈË·qu×q³®©¤‹´§ŸhÒ‘—©{Lù£±
Æ5«¾VZQYËüU‘¥¥JZéïyÆ‰`ÆýQš<Jeä©y >h‘6SH‚Z2b%Ó’‚!Âg^ñÈ–Dà	9ÑP°[™nˆöãÞÜÓÓ„§ ÅX}uRøR˜ù2IQÁ®â,ØŒ=Ìž§yç9L–MÆyB{I–Ÿe“6]\ÄCv•€PØýT¶ïŒ`àÝú*8Ñ¨ÇÎ“úPk‹ ªi7‹Aèth±:ÛóËµMÂ•gèeq³ºb&IÊPŽˆ^”_`’†ë0\±ÁÃIŒØí~ØI².X§îš™ÃBÂ-­É8÷µNEœ{L¹ëÖ×ôèÌÀ6b»ri~‰3”Ñ$ù+Î¥—bb(…8Hk@?2ú1¥Ãh «ÌKäµÙ¯é$3%Gœ¬n4 µe:ê^déf£/?…cBœÅWÏÿ®K\ñ)ÐXe´s‰!ÜõU97pauÂM‰°×l•H»û|k¶
î¤3¯…ÙY6§]*J÷h•¦màº(ô=‰0*ý‚yÈn­6Ðé1ð¥¨W›/Qd~éÁÿš!âgÆô§ºI\Ð—}P©Žû¸~qqËVxÀÎþîí› ËÛ>.d$@ÃÛ]Î{ê[„{²ºsì«ý¸8K{ÓÚDMÃ3Å>#%…‚žDQNÜ:Y^ó$o5‹Á+zî´»‘,¤¥¬É`½RÔn“ªæù)ŽµQDó¦‘1ÿfy{þ.}9[ÑªÌ!ú3BïÚ‘ Õ-T øþW¶Nôds–*è¯Å	i‘É•j<‚¶šÃÃhå‘«­»f'Ê’Sê—5çLÀô[Ð5³4Å ïøiªRÍ?qr…*eÌC•*!4ˆf-5Ž;‰ÂC²Ö ³P<Ø gJßÛ„ë™[}ì3´QÇÚà”³á[ªÃyùìÄ.#ñ«†TÖt¬±;]_5¤;kH|Bï¨!½NÀ2kVê[wQ•Tèá)¯túçÐš<ÑÖ3hM3†‘•Žþ$UiR@¥b-A¸ŸT¹‚®EÕ^•9ÿÇH×”Wçîcø=õ®'ÀEæ‹ðÿ3é^9MŠ¡‚ñ­ýU«nã÷SÁJNù¯:XIsØqŒ2¤Œ¹÷U»«6&Jj|AÚØ¼P?Í¦
-L4ªaÙŒJXöGp\eí¼˜ ÿ)Þ|:]+û½4­¬Ýäj"˜ý±õ*I“-$¯?•"¥4¨ŒDÎWªºßO2"¾ªN%Õ	ƒadjMz¶¾êKÿ|úÒöÁPÿÚòW=©Q_–žôÿüoè;"J=Š`1þÈúPáŸX5sÁòU7ªnã÷ÓÊñœ_u¤²ŽÄg	>Èš¢¨(•§î«ÂôÏ¦0ý¡“ ÿŠî¤•ü~ªÐï© hª!=e‘¹ïúç:SªK¬æå«öRÝÆ'×^fz¦)ØÆÈÂ‘‘¾”2ž;í×’>G†‹uÑÊq±‘$ÜŠ™¹Ê‚©XˆÊý£:G†`?’¼@ÔË˜}Ït®õI‘ÅÑp¶|ƒIïNG–‚¹à¹Þªw–Ê	ÄY2ÀµEÖE…N–ŠÏânœŒv™&=øŠù,],´ÚgÃ´§2)‚I,•\J¯S°k¼béÀ¨zƒÚZ¸ò¯—ä¸{O®ÇðâTÕ?cƒy¬p›Á×7()Óáë>è›—{x¾™‚[Æ Ð*Ä´Ã\¨4-˜6|Ä¯µÛmªBÀëZãÁzÕlºªç—k¬ŸàŒ©a
Ôt©cç@9y=6fTÃr¨ÔBÛÆ™Uƒ\b[çãdd1„Ê’äF£a¬F^´Pém`?ðé‚Ý«òéuéoXÄÛ%•vð—”fB[ø¹ãægËE#>ü&&ÏÈñ?Ýqï~Ñ¶Ízîq¯Ó	ZÖ~µÙQœ§XdÊXži`¢Ç¹B‚ï0ýx„°S1’EŸÒaˆá$Åò˜-­#3Þ×6š”4eã¬¥Ù.hñ!Þ]ƒ
]=xu¶ì	¾»H†°‹¢á…’utÔË«lg”&¿-¶üÏþÀVWVVxÉm,iwBu[mÂ”ÚuRn™4&£T`vh€¯«uqŽ¹LÓAo,Û7Ú„ö£ËÁkeEIsC†¼^“ÀlÑ‡²\_¸éÞ*%”°aÍ²CeÈ4CyôÍÖƒ…nÐ	4ò¬ëÂk`+ÑRFÄ±N§cîS88|Y[pˆ5†Ã@å À†XVN»
¶Ø³«14B™ªÓk¥Ü8E½¸@vÞ¹Ùó¶sOŸO·øRŒ9{Ïu½\T8ÃZî-:d™3ù¿ŠzóàÝ›`èV-é?õ{6xÝÛUŽylÝ
±…ZŠÝßÓ”ôžµóÉ/ÛZYd›7 áÔ¼pñÔLI­†Àïl¦73ÈM„©ÙÌrzøíÌr_5§;cOXW5¦õÂ3( R
KŸgÃj4€jÛúd2Fæì3PE‚3)LÏ>L‚IÀ [E´T€¶'©a9¼O
â.²}hó°KÂ òh0Í“[ H¸ÙÏ’ÃÐêÉ—VY>ÜÒ_×¸¤­pŽØò~Ã=Ç
â÷š¿~¹º®!˜ÃÊþ}ÀÚº"·º¾½ƒsÛ þÝc½Î¥óa•QÅlªñþÃFïï‰¯˜n+	Çq¨/Î€ºiì•‚ÃÓ3ÍœsdÁÝÜf¡‚ìê°Ê
OH˜Ä¿pÂô¢ú5÷»Ú<ˆ¦é¤øòˆÓðèºÔ¹£Ð|$vÁ½Ó'2ðbËòì'§¯6Zõ 6 
¼*Ut¿8:3Q5f*{{2H‹OJ§]ÑÝ}jð‡
E‰~×‚ôkÖÁY3k¤*r¹Vª‡µq,ya9ÕÃ2c*¦aé@m” _ð¤¼îƒª3¨’ç0´€d´¨¼ëínÔ‹ñ G%ÞwyLk•mó´KDGóë¸:ä7‘•¬æÏÍ|êó‰'ã”rÝNx$Ä½M€)DÓrw}™Ó ‘p¨@ ðx‹†l7FÉ( Ò\7'B¯ÙŠëî$C¬WTmô›—ƒô–£ux5Š3
ù2§‹[H3v>°W0_QÖ½˜Þn’¤šf³_Ù	äBÎôeé ¾í4…êcÜÁ{`×ÀÄ./³@LbëÆþGŽî*	XdôQèR>W·@›rO×ö¨'#ÖlØU0L&Ý¸ÕŠº]Ê_N·ü!žB#wpþã?|Ð£tIæ÷/‰_æoÞ‡¼<É9k}£xÍ¿[`òôôö]èyS{<É/0?èCþwxÀ[Gj‘]ß°(¾¹ãkQNÿÛwO¼P¤âÈC.—l{HŸÚ@“YX­w1B'¶µõö¯´*ù»-öVŽ*á!æ/ü þWƒáñM'ª¢­Ö5S7,²$ç\[x±Œº`ÙyË»¤ìfÁ?=z–Råô,õÓ³üÖ&îb2q+‚h¯ý¾4/q¿4Ð˜¾åê•é;°8Íè»˜è~˜•¾Cm)ú†î‹¾+õf‹Õò=ÑÌ1¬ŒÇ™ÜÂÔ_•î¯-Ð\bµ·% ñ>Ðº†g6ÑfÄ$Žp¸€UÅèZ‘iÞf§n)—•'ƒ"VX¥çº:-(-{• ­Ð›âOy¸Hõ/‚8±ã«+°Ð•o—í†Gfq\ÞBUÜ*_h%¹c‡€®QÚ¹ÍËÖ@êð“A‡ÈíSÂú¬€@6Å{Ã:¦aTFÀVÖWž÷˜ÿ…I³6Èßñ§Nò÷úÙ’v5ç0ÿB“xÃúðÞã¼>#(¸$1©…½Í²9ÌxªI>2ó(/¶ÄÕ&«P¿\64`g)]²‘}2±>aÊú»¦i¦ãô·+ï¸½8úwbFx°
L³e4¡H@‰²?Dùg*ÆìÎˆ/»–»0fž©ƒòO‡
éÕ†?pÊC¶}r²ÿòÍÞ.;ÙÛ9Ý?|#& 8Ù{•µÅ¾sf^)îå:8÷1Y³Üú‰õÌ0õ+˜·6;‰}¥Þ%‘¯W¶ÞÊa
sO¥¶Ù8¯º¹™€7«šº[vŸÑrƒ<ãÞ&™šzÐMrÿôŸÉ†fÂê4»”Xç²óógšcé¹kV¢9\@e7î¦6a2_ ¡i5è™ÍsëG3K– ÑÚlù‚úïó@jê¿?^ö þy„‚‡Ü²åLoÖÆf]_vûŒB£‰rÍ§f#íYød}æ¡Õns.Y›hÞÚH]¨hƒ†Â üï:è'øj®Õ˜khChï`®É†¾škº½Os­˜p£Á8¸¥Õ¦Ø_­¶¬6¹ _­¶¯V[]sÇoX+9ÇÓž…¯¦›çÏäEdº“Û›nÅäfºñ"Ód#iš!%Ž³ô6ÓEê»üÒì3Ù…O/¬~µÔ¾ZjMîÿj©…©°ÔîÉÆ¹æ§	Ujö¢{‘¦¨³7)Î.KÚ—m$Î²âQ/dkÛÊãâä"½ÂöÝ$¤ýÖy4È}åðìtbJ¨ìØéÄQæZŒe“rvl‘@–21³a2Âäþu
¶îN²<Í–ÆiB˜;Î+•×|7Åî<z÷{‰fœÖWM4G‘½ÂãëýÊA‡g¯>Ä©Þ¨Èl–"Æs}˜²"/­°nîÍÆh–fn‡àx©IQR:zgSŒEßM%«+%…§cSÉ¦!p¸í9Î¢ì\Ä—Y::@3C`ž¬8,Þ·œå$Ç«å°„ßòÈÌÅ(¸
‚1¶ìu4Šú1ŠÿÇË«N¡Èžw‹T£¯d±ÒÞ˜{ºÝíòRâ£´‚PÂ _KÃG1®§XõýºåÆóX]™å)£ó¨Áøoã¿/¸Ž±ÛAx™ÃÉÊ1‹ÀÛÌhãÖ<G—Ë}ðeFXd“¸ŒQæ2Æú·Á=¼Nìr–mð@¹Á•’ƒîÄ0±?‹[*fQÉ7K‚æ4Î wZÿ%‰¯¼‰}Ïjdîóñxnp4.EÊ¶®–FàB¼~ôÝ5ë‚
ø,GëÆ–ým¥ã¨›Ó¥SÙÞüt¬FpëkÍ•?î±WãR8Uš.ˆUs5œSÍŽèŸà£ÁÇ¥A[¡6´ŒIf‡£A8ƒÃ3®›ZRw8³zâñ2¨ŠE?Æ[Ì>$h£«¥M áw€âxÏÙ`dÃÞ}ÎÒ«ZÅÀi£Q)ˆp1oŸÄ˜ñbÑÁYž&RAv@yY]î°%"pbTSºà¸,äZm–Öêq2O
—MÓ±´®8DÝøö`œ=™ä	ãí¶{ïe4˜ÄX…ïBÆç2àFÀ‡úpO+Vúµº»·‹(ëÇE›*)Ùe¿©£!–9¸ašK««ˆWµ.uóó´;É·pó «2¾Ø€é¤$£xi”Žb—¯ˆ(P{–+¨ÕÂwªV-äLî¦Ö·¹}a!¤Z^¿¯åÐò…¼¦j%+xéw®BáŒªlZ=có	bS¡)™WtNí|ùù-zÞ²‚²£<l¬Ì[ÍÙ'ÎyŽÁØbÿ”A9“»vß^×	cËÅeBd<Ž/QªÇ¿Mâ¼Èç½ I€A$4[uÒŽÆèŒ'ETLr®6ŽEË5‡«î±Êõû!¿êgihK×ï|¯&ç]e—‹5âK"E¼%¼±jn™åßúU]^à›Gk#”E‡«Ã{’%š1ÏÑ³?¯ßíA=%ãÏ9ÔÞƒ„Ús¡õ\áPv$ŒØ±Ñ8ËNÒác{‡B¨ü¡£qÏv¬†=pÏO>.m"‘®Kº\Õp«UaXîrŒŸÐAË½uvÖÜ'ïäàøÍ'ïC¦)ÏÑî¯'ÚàŸ¸ë´c[B’øºô¹‘§hü´ÌË-`C·KSùAY°%Z—p¹^3á±ß¥M§9éà˜Ý“ëÐqµS†Ð-‹oûä>ˆÃ áiêß-ï›54'Êœ½ìràÙ€`Ùt/â\(“O˜Ö‰÷ÏÍ¡ãÄ3­IlFPH)Eð¡k^ÅÙ¼LkA§àéæì;Í‚Š16òVúÛd£{k­‘§	”€‰ÊúŸ½ëÇ§zñ„‚ «çª£8ËÕ2½A_"/Ò¦xI»÷2B~}vÚ-ö™`DPÐ‚×mçÇ®vÐvÐ(5vðŒ @†ÃlÃq
×âü)pátRÆÑÒ„ì "gÈIÁjNj €.:¥.ÁN	2¸‡á™c¼½Ày¼|Ñ©è ÖÓœ…Û ?ÈI£Œ»Ó‹8‹)‡t”rîÇÉ·ÅÓîº¬@–D4gúi6¾\ÞœSSDàDGú’Úù–ïF#î­‡Ý^åÏñ×Ò_s–F?~[û£ô§û9hÓþeP<¶žäÛ£©ˆ*Ûî]&¸t§|¸<°ÏæŒyúõ½X/(›“ÌoÙ×tx(¡ Ð*;L´UF_Ð*[4ðnQÿ®˜Š­ÇÏ{!xçÑeTDÙÉ„†òh‹ý‹ø"Xó»
˜ ™Ùl `ôãbÛ¹ÚòÚ;ï¢!¾b‘ŽtþQ*(ðÂ—à¿mq·J˜›[hY2l-Øb’ÖOö^uãÌ¹þ*2jÒž8Q%O•Bó¹d\;lµa(®0$õîÆÒ¨^]¡¡ÜÂõû+„ðÿÙ„˜s>€`e¾Nü±ï®ºôz$Œ¿kK¿íÁúÞî^DÙvÑ"°øŸQ‹T±%ÈÐQu¾©^Z¥ƒ‹«ÚØj:C@h*Q'aè¤Èl2Â(rÄµ¦Æ©_dÝ0‹LwYÃÉ¯å>$¦ú·˜|õ£³ô_û|5Ò!1Y“óG¾­|¤V„<có¯¸ÛGbji¨+GU3U•?bèÌ/I>‰ÀXç ÆÀkÓsã;#4ãÙýÉ«Á­n|M©Õ–Ã-Mç",´Ë”ŸKØÞwæ~¸ÚY-;¾ñ@«Ëè×Ã5lMÄs™'8z÷½Žpô†èüM*úXÂÓ‹cì9»^åùjz+GpHèòá¿¼³ÄïÏÒá.ÚÕpX¡s@ix×jæ¥ABŒÏ-Èä©ëE|ZVŽ©œ•m<(pòÀ€di¯ð‰-·®”ùcˆ(o&E4S¬MzšÔºO½£Ü3Ê‚ˆF•ÒPKƒhßÐ7LÛòG›¿WY4öìº¦)AþâÛj³Â…,ª,øSòA’2ŸfÓ­YÒgJ³DðB…lÔ‚|ÿJ§£æ%#:dð©ðÑam#T?,,‘¿¬J‰oò=*nÞð]ûÿþïÿùÿ2z‚£h:3Ìy³°Ý¦¡µõm]WlËÎ­€þÞ|Æ}àÎ‘‘Å®ëdÿ	0>Ü=Ò,{Û`éµ|©ÚáRIf¢³xÀÛUí=k}§étá=žYz<þ¿5—ì?c“tKØçK>hK<½'à·æËÛßPPî¸ûqÿÿ×ÿf¾óZÎ{ótÙÒ’A¨Ð‹Ûõý0fáø·{¼Ò1J—˜Ý”÷•ÂÒtfd‚ø&ç€Bqjg1EµæÿŠ~'6¿PY?êS¾¶/W§‚…açé]dòÖ?þþ¿ü_ê¨Z1ú³¾HåáI,Gº˜µÜnM¢˜å'óÏÆÅ¯Å½y6RÎÐ›Ê¶fn>‹ÿFh•²yèMeÃóF%	3Ë>Vã:».ÉHž÷…Y`¶÷}²À&Iõñ÷¥Ì¢f¹•×åÃ
îþoâB–:©QD›eÔ©ååüÖ¦íænŸzošã÷éR€(ï§t¯³¹}ÜÝ¦}2Æ–4«F—É~ŒH7¾³«e›¿×}y*ª~¬§f&Ÿs=U¯·XOmË¸y¸Ö
K®ø{.ï1½æçXÝfÖÚt ÷/Ée~šîõ’¢Æ·žÀ{ñ)\³VùÌ Þš+%¹Næ\˜,Œ°bEÚRºËâ‹$m|WŠ4¨¾¿ÖIíãK·7"™[Ñ„Zqž~ÞÀÑÞx1Â{ôBdËßÃRØ‰.÷³u5KCs|í'”ïÙu7núviÞdxOÒ{UnïãeLÃáßÔ0š›o¾9ŸŒ8d.ÛË	hÝxÜ„ˆœIùräñý[jB2­¤·rª!ö'Xj~QüF4‘÷ø3û«ÒÙ7$Ðø{|r‘Ä ÌfòŽ^œw³dŒ}oÉâ¾X3Hñe<È)tœ%—É îÇ¹j»ËìÍ ›f Ø¥¤wÜŒþåJøô1	Å/Ÿ®ÊTm¬;pø¶ù÷—x Šf,Ñéw¶ONXk+3Dªª*0Êðt&OghDä0Ÿ¡¶‡
&Ì
Œü(ÍŠhÐf"ï6É–S ƒÉ>r „¯?›2\¤¥ç`õä;"C·uü|{g‡òIËâ4ëQwJý#®9“àFY•“ÐËñþÊ
E@6† va„P8ûã‹õÒZðv•³óª´å³à™¥ËÀ&eJùbÛºhmšÁ&(&cg#_¬×Ò»/>@•U°úÁø‹tC9O2ŠG'}\<$+Q©I„›çª¼­¤üQ8•?µ˜n¾ÀÎâs, LCd ÉÑ.‚`o mÔk3y;EåA§#«ô‚â'QÎâ~‚æç:TÁAø´u#Å,{Ÿs€ÄrÁ9âŸ´É3çíq8‚Oà3°©ÆY£È1åO½¿ ä×ueð¸~a%%áœðh],M£*×@ëÀr~MžEÕÑ}Å(ÕöŒzÃ½á@ÁpîÌªƒÛX•â6~…E#.Ü*ÂnØš™šSú
y¥`×£Á$Á#&Xnþ
$A†0¤B†‚u”’4ÛrÃÓ´·ô„íñÃÚˆçç1Fº ¥¾¢Ë(PâP/îÐúØÕELä?M'ü6‹ ™9ºEÜb|X%¦-À®<ùïEcìŽÇ»Ž1Õö›‡(Óöû‘R…_îžˆéyš~8cnØ''&)ž¹Ô½hF£Ø¼¾1!mãEàÀQo)Åp»sQ‹wx:ÉÐŒèfJü‘ž!ÇÅ$qU3óXðudÛE%Tâïxdš•$¼oú*‘fè¿7‹e]Rð×¥aX”4IÍ°%b‰«K–KŠûUI9U ×ƒæ˜ÃF{ÁVWé}OÑú|Úd•ÐR…w—{œƒèšb,q$^^J\àV´×…ô1dd£Âš£lÊ»\r(TÙÊ‹åÉy@V`eu©‘‹tjÂUìÈU˜èJIUÇQæžºbˆktwcšGhØ=ŸðöRË:|gŒ¼7­¿àD\&½	(0S”+“%’ÝÜóÉàÛŽÌ±ó8*€ÏPý"b]4¨I3Y¤¢Zù¢0ÂøVbÀ­°Ìj„8D@ž\€ÁÇa®‰¹,ŸÅ9›¹Gëý“[Œƒá,²Ý,Ý¼Ç'Å¢Ú™™ïÂ>ÈcL9%“DåQ–ÓÂWRI& ó•ÆÁf½£s¯.W…½ˆºÉ Co+ÙŸÜAr’`ª.ä0\Ö	jRJZ—²C4¡NawÊ¢sÜà•FId4Á÷‰r½“€ðûpWÞÐij}@k»qpÕ£›Á-–ñ*xI1áõë¨.]¶,ì\Ú|ã¨ŸŒ¨mÑXq)È•¹Ü#Áz¤”‡¥³ø"ºLÒ¬$×ã{öÜ½Kˆvo­{¿tßU[¿ÉöŽí\{f;é"[—c“~IŠãc#Œ$–Z–„CÈqœ	ž+ŠL¹G¯,ðUøßó¢.ÒMÝ`éßf1s3ÀïÃD˜EÉyc\Þçã¦fYBËIÃ)FÓa‰;y8Vƒ\
¹ÈÑ-HÊ"Ê`MpzìNÈ™Á[NCKÍm»®¤wŽ†¥)ãp…ëäé éESø2)Ò!lñ.
ò»øŸb_€¢q
·Ù‹(lå°ƒXçÞVp›O0(ýx„uÑ‘›‚>žžŸ']Ôr4‡A¬$Á„a~Xbƒ„dÈo“$#‡oŒL¶sŒ
†ÍjÆƒïsõpÏÃv_ÂÀŸ3ó3­å«Õ¬…qé{[Óc!ÐÅeEŸ¢!`×Ùn<ÞëÁ @Ìþ‚0X¤ ÖwÃ/¶¶‹*3\è ”’@Þ­ïqÇÜ—œ2dI(9e!ë˜ö®|u¼$•1Â?ËÝÊ‹Æa„`k/3Ž_qrÇÅï#\Éë‹ë3(¦ÅéÃ¨ˆ¯v'­á	1S*=,')¸)ïÅvÞðs˜p\†JXÁÖ™‡g£nVlTÑØ©«sOWÛº.é÷ì/1L¡·só6Ú7ÖT8ÇùEÂÇ#X^t_\ñfiÚÿ’%È!Ù_RØÂ‹ìÈÐqN£üC.53àÚ!q>	|@Ö_¾%wôMµéb´<wlÙ’žíN›Å;tR"¶Ýígš×ÁæÌ	Ö4An´øvn›Ÿù	]1GÒÏ2†BµDA–Šd( ô†“ÂØÆÞ8£Ã@ø æ_®i›íÜ~ò06”Ãº¯jeœ!å“!°ñäß¥£á5c>ÒDsB¶õúèdAŒ¦ˆû©x`ŒÞø/ïðlÊýÝôª©bOhnµ¶{—@\¤ø?‡_/PtÐ·t4Bƒ?ïrµ™>ïÁª“è/ØN$Àa4à
÷yL¥ÑwÄ¨b>™qzWBÔgœ×Ú6O¾=¾‹N(.0¹s%ý®.0¼RDÇ9—ÜU–IÞ“ŒÀÈXN…(ˆ7ó¤E5vNX½Y¬NáÆY2j¨&ÝÒ÷Ì-ç¥>Æ@”ÏÂ®þž½´~âóU<Û–E… åGìø¾ð?cäÛíùlÂ½·’›FÜ­T†7\-uð(¦³bgÜÂÆ­&^ž—õ•xÍz	¼¦¼°žsýŽB<§„aG=Õ'ûÈ0\mtCãS¿›v'(zD9xûT¾ž†G„{Å–x5!ö± ÛŽWd¯ñ¥ÇƒÀó,ò#mAZüDû/19œPõí	úGJá²P:ûSv“A‚ü4¦ƒ€<œs6iD€\ÜE¬C{ß4ÜÐ²ÒÒn8â×a7£–æ¬ä±s')Pímr"“tñxš$Hxà2W°ý{Bð÷Ò y În@Ù‰&/á~ “cˆJnâÛ¶Ù‹8æ&Â@R -¼ÚˆdK;5b*&FfË
â@Ï$ÒyÇßŠxýæÊ©‹“YçÌîpDvåL ˜Rf fàËÆM Å‡ïm(¯d×•­ËÆ˜àPEìpÕc:+B"b^µÑ; Ãn±(1‰\>lbs´D`	o=¯p

FÐŒó‹wñ#`g X]Á÷óÅ?þó¿7=š—ÌÅßÄkÚs¢Õö¿ÿël˜m¬.®Ö¶r€Õ¢‘Î&5²J@Jª•Îâzƒ±ô#5’UxŸèöŽÙÊúâ#j¥ÔÈ;å•¥W‹,	öTCI5¼PãÊjÁD›ð	Í5Œ±ï[QÕ¬:}ÇÍo“ùkØîèFVµÎï”T’ê.>5ò]Ñ',Nð]üÁ¸å¬öãl+˜­®-Yí°Z…3èe¬•x&Ú½¿ö*Ç|‚ûJž8W-c¸?Ÿ~¥Š …ðXÞ®´;ñÐ†PépÓc"úiOŠx\tä=®ÕitBqóô,T8uHÈð<G¨%1ãŠpÐ‹µF±8nn¶‚‚$Æ ØlaÃ°Ž¬øNRÀ(.CùÊÓqòƒ;¥¸Fñ¼Ü‰òŠ­äpéÙádP$Kb±x¡ÿØ´9
¦ ¡7|ÈË•ÓÛËÒ1‚Õe¨×†•F.ë8ô¶®ÜJU³m%‚VþHi¯ékîé‘˜Ë74wýNž>]ƒ¡d¬<ZÙXÝèl>ì<4êIÖæùMÚ
ŒÔšRëhîé¡<] ñggú\÷äLÅÝ^
Û.ìM–w0:áŠKÇµ¯ÁÊ‰úñÉoTëõyì-¦g`8q“"_íyÄ? OÍ÷Ù£ƒE§:–håÑ9hÝßã·|pj8ç~øAÏÒ÷ìP¿•ðŠx~UF)úÏüz±Ö:I‡1fî%ù0¡Ó*ºH¦wkÂk™Èv6Hû0s20Ò³Èªê-h~‘;q<,àM´
£…ÑÁƒã-gðkÖÆòzØÝµa»»¾üÈ~/9óÓª0{¨¦‹EýqLð[-y|Ä²Xp6ê}DýÛÊ—3fM|2îeZë	7:;ã¨Û,
¬:v!ŒÅçÇ#D8FJËÇq7E”Cd”‹°|NP¢Ac'KSž<\hbH#÷"éÁ¼$Œ"s`óè¯¥˜f;<g û€ÈºŸQp U-ò¿r‡JÞvVãkàþýÄZûöÉ§¸^mc¡6“¹6Ü/C_–Ø¹ç±»B.^’(Bïö"èi£zg(Gw+%R&¶:Â‘YÄÀ|AìÚb¿À¾ˆ3d±½H­Lx¨d×È“î@YM”„xàÐ6Ÿê?{@9òçSRe§Ò ŸP`ß¾)n?1mnÇ ô}qjÈIS­¸Ýo/ªØÂ^’w'<gdQht6¦ˆTÅr0Gztý” Þc%w_“3Œ#‘$ˆ§Tç†\€eöfMÌK™z1^î‰@·qVœf )ô?‰®µñèUèÒ»R—>]zé •éOL©Ïãn4ÉµÊ
t‚J+ëFY6]¦öb’)R"ªm’¹ö‘s"Fˆˆ<Âº"Kú}®¾°vÂ%|&w=…«dC®Ž$¯P$Æñq:œIz\`è(<Pø¹dÉ¦úÌðÑânGÚŒ3ø—ã´óDì·\S?‘ v¤wmÛ×Þ±'XX Oàã–Œp~»ò®ôŒ¦â¸i_S”Úiz´û3)ø] -ÂõQ|Åþ–Ã=-i&Â”È£2<%‚–²(Ñé8“Q‚¾ÔáP]¡˜¼­sp£‰ÍÎ;ƒÖð—¤‡C°Ó6M3Í6þp‚*ý¸ Z"‰^?÷Š"ªäwØO#<õ‡§:+æea<Ê±èq-±–xäÖ-JTë_áæõñNËË>±P
Üd5*Â0)¸bõz4¯—°B<Thk˜bZ¹‘ÐgæÐ°¡#|-´^q½Fq¬‡¿Ý‘ÄB1ªüÊ~dæýì©9yK¬ópÁ #Á©„!bo-µÀxÙÎÃŸð=c Aö+h4ÜW›ÏïñÝè[ÛÃ!|îÑ	ÿY<Š#õvtú§™¶ŽzYt…½>'†¾=‚ÑâzÜm{cQOà!‡¤i]NÓ1»äØÝbg¸­|ÇÏ=FÙ€ê\,‡…³¯ù"À¾µ²ÈVW×Y§ó`¦EoÌŽÓ)´û|0‰QÒ§:‹‰-²•öÃE6ÿB#²è±Š· P×× "Rš}ëºBK°n%[w°ÐKkî"\Æ<·Èæè8QõcÜ‡û¤õ ½áþ†=ó^][‡Áó™¯ü2‹¦ÆC(Zsüàôèðøtû€ýãïÿ‹üzrº÷šíoŸî¾9Á“ãŸw÷OÙ«í7»ÏÿŒOÍ‘;ÞèñÞÁÞöÉû¥Ó^Ù˜[´¶¦ùè"»f°„}äLt0¯™MëŒX„Ç2Phì—Þbâ/ÝYƒÕÿ<pçæ Zái¥½fýˆ”£üŽÈ;ÖGê5ËÔü"Mó
4ëˆcÀ&×ÃÌ”h4]@¦ÇÝ¢‡çt£Þ?¸9[È¸ÜÄ?Á?1Z„?þèrx]â‰Á
Ô˜ÑçiQ¤C~”ˆ›gÀm nZk&Ö3µûZ}èŸeç&³"Hx£ŒPZæÊcón–úíâ´Òrºéx*»R~˜q^X‹-5#
ˆ²£½‰GYZ¤ ÛÍž¡N`´»ÓQ„‘±\ÈP(>Ré{¤öo‚þôÝµ&­›÷M–¨Ø¿¼›ûÃ¸–––ØÎá/{ÇìhûåÛ³º¿}°ÿ›a­£,¢§ö£ÐØÉ©¦øÔ7æ²*ÆÞÙ€Ý*ÿá|îœÈù·:ºÑè2ÊUÄâA&¬/h¾—dðrÐÛgèêŒ‚ã¤<:‹2Œ"QpK©S’90¥«È…ÖÖÜÉØ–a5!–ÀiÔÌÍ:NÿÇ@z~.¬1´´ŒQpÓèØÌ:¼ÄüSŒ‰þÑâ¯™ð
ïÆÒN´æì‹RçJRIí
Ð•Öp`ëëíŽ1]§xüq‡q®=³ó†ÿ_[+ëŸèÐsu
î¼IZsØ0èM¹‡å°O&gKEƒ¡ÛlÏüêfhð>nw{Îå¼ÍƒUçmvéÞp)u¶ÅXí„©Æ\Ž:¢UfçðõÑÁþö›½²>ÃßâáŠAF’—^`tsJö¦RCIK¤\7~²¤ä£ŽŸë>2	û å'CY*Â´§6±Ý†^…§wu•¶%ý#oâªÞ'lnÛAîIÇÂ †µó…êñ³8§ð#âIÏ¡TÜ|Qipok	_(›ŒF2*]¨®6‹üêÈ=]”Í%Ý[˜†C  õ(’„ÓIÎÎ0^ç÷Å!fêrð$#sŒÇæË8zºe6¢éÉÐhø!Kº2Ý~W2º§<KÄùŸ¼=gÎ.?Ç½}Zhn/çðF´2§)­šZ ÛNq·Ù’¡¹¯˜DÅ} @JÊv¡`Ð–Ð_Eƒócphƒ–åêƒ›¢B¨RÐðæ\kk˜ÔýÏ„·ãoÅ>vw~~½÷æ”ìíü|¼ú+;Þ{¹rzü«É1Êñãgg˜k@¥—ÿÓé„YÃšŸ58Ý¬®úø|°o²Ý6h)ïâÊJd@¤#]b¶ïÏ§¯áµ.#üúo„«Ìþ­ .ˆ­¼ÈŽ.vÛs:O?zr
ltûxW=¬OS5;)Z½õ¶ºáþ‹ýbÖª½0àqåõ¶¨,Ñ½ã³Q4LY«¼5EŒDÎö>âŽ{sB‘}W¦@N[ÒÁ$æ·b¸U«…îåE~xë±ñWÜBzÁÀ?-ºýÀd³3;	ê,Eß8€6Í“MÍ40m|ÝºûÒÎrû†•0%ïŠîï½Y°-‡íÝ]Üˆ‡ov¹ùðâð„ù›SÜ ¦à¸ÂÊn°m4X¸ßNy¾Pï™R5( RÞTØ¹¥˜ft%s‡ç"Qð´,Ë‰7åîîS™Õ™[m³ãÃƒ=TSËÙ{/º³G|_n %R=:Ž²ÄÎø"ßRãßÅÏjˆ‚tÍ1Ó§@«oám	<X‹;9LAº:þ6ž‡D)1()ðC­¦l2¾@PÆ„P8à~’·´PýAz†I8ƒc°‹Åiª–èí93RxŽ#™žý»;Ò@kÀ’Þ–ýÀ?þþÿxAA¶Øó,znlBÞ§Br$Ô<æ)ª¾QÂ:‰Dt³Óaå`â3¤ÉŒ=JÐ¢˜Ý‚õ!˜ü3!Øc¡.°ÝÞq”}%ã	Yâ¡¾Ì6	†ªÆaÛóÚp~í4EüÊ#—dByÃòs<L9ø1BVÂ±‚r<ÇÌr•_Ê_€ƒNæ‡Ñ3[ãÛbû£ñs.Áèå)9|ÞõDá+â xW´%†qA:$FÀ˜¯J®DŠëOq¥ƒ+#Í•N¶P9T˜CåÙ¢BaÝbGbÅS:Æ‚‘´ü™ÞÖ…MÀH˜ê¥ÖÓIož3Â€›N^t$FÁ¢H½‘ë@sÑÙí²338¯­AžßI÷ÌbuÚìäôç]d9Rã–tt|øbÿ`ì¿ØÛùuç`¯	lhäZÖOù¹	¦q¼4:Ï“öe°®BôIÏ0JzÎy*–S¤´¶~Àå¡'1ÃkK‡M!àX1Â„à¶8K¹ ÷)!û©À|ŒÐ~<!2!4®|Q×5ç˜}â¨Á¸äq)Q‹ ã’è]^:Ó†ŠÂkâ¼j‹)%‰="¡”¸ßO„“!rG{t‹§¦„“ q¹–ðV¯3F /‘ £yI	øÉH'(ûöq4iK:â=›ÚñØ2Éœ:È5¶‹R$I	¾µYåˆÈ2¡¯µÙö)h»ä8yµ·wÊ;N_oŸîÂ±óêðð u×¬ÃZ°šP}	‡1óGoKX‚Áà«Ã\OºtC/vó8Ö„Œ
h”Qî!oyòŠãÌ°“ÉÆcÓÈpÌ¡a9Þ«àj5RŠP½†s#VäÿƒZ·U†9*û"gô
ÁÎI^S3p¹H¡ÌP@ðð%‡ý5ÅDºß&p1‰m&‘Ç}Nä¹¦dó>jí™:ž…™§B6ªýÊ-ä§ÿç"óÌDAë †÷_îãáÙö›½ÝCüô=Û½ôø` èÙ~}øfÿôðxÿÍKvpø²±ö¦òŒ]*Î¨Ç¡ Z9ue‹˜¾òTT *¾»œQ¢8zÈ€¥"‘ä!²C¢ù&Ê„$@@?š$hÉÒ¨ý}œDÐ6¢,Qpl4
Û0"VéàöC<µ#Oyx^éa…ŠËÓ‘Ï@’È;Fr¹	·)T¼ÌáalVŒ%ÄmrD3
[rNØ/S}À2Ö<&KbãXhp"¢¶›
Ýõm«…1X"OÞ‰íVK¿#çj^Ðq<¤ðâh™‚Ãf<áB¸Nå8R§A[ÇóiŠFÓZ„·ƒFDbEëHB¬ÓµwÄíh¡»O`eY–äfTI6 åW{`ï±ííÝ½×û;ìå1|@.XI/÷ß4RH'"0ˆÔo¡9
è™^*¨ÂÚb BG#âçv	IõÔ…ÛðlœS«­S$^dÍxu@2ŒLŒEB-tav‘aq>Eµ¯Á*¹œªÔá‘AÂ»jÃêSÈKêÊÒ}y™AØ’S#uþU6NNZpQ,™¼(&ø4ƒœP¹&Üˆ¢Á­8a¢fÎa9ŸF69ìîÙ’û„ü¼º‡âýØ'/â?ë$¹q4k$zp¦1ŠH!’TB&+lâ4[Âp•f¢Æ>EÕÀD[]áƒ]0¼a¢í,Ôù‘WƒžcQé}’[ò„d4b‚z¥ÙãCìð!ô·#_(gÏ_ï[CsD3?!­a"ð0ÈÚÂÎ®ÄÉi­.ÔépqWM úŒæ\©Ÿ1zª²Jipë8¸uÜK…c#"TÃ%ŠÅÖêW‘) ¾!f¤-ÌFUÚ`ñìì½9Ùc¯·ßl¿ä®˜ïeœÌÑñþHö¦B} ÀÔÁ„äë¹	JïC€¢¸ûÛŒ˜§*0­ÑÀ‚ðf|Ã\Fø*?q>R)¿øOúÖpå&xÆ·l(Úèl¸PÖwU3”ò-[élb+<qÓj†Ò¾«GÓôXVÑ@bx¿Ó%~‡ÚÑ8„ö!jå±è¼ é³aÂM$;/”ÒûTR(ˆøx+°K~}›{G¶˜‘‘¸à#4Ë—l8µÛÙ¢
‡	ËÏ½”&M’Êà³3Ì­“>f+ ±ÕÙT>XË	MDþŸC©ô•ºžçª°‚<=/P¤L€‚Š“ÝŸ{Üƒ¬¹CÿóGØñÐ‰³Á$F¼|±÷ú1y†x¦TB
oèqgq€Ö˜;í>TÏ oÍ·ºr;':J›Fg`›‹ú#ÛTçÍzíU˜é¶ºIÓ –‡ŽÁZÁ–¹< ÀÀTÝU[Ú#-?gœ[0#Òèh±GZŽ@`‘gÖŠKª{9ERœ#øQT:okvúvåÝOÎÝâlÐÄI´ï Tµé=(5&¦´oœöeyûØz{lVŒ6î£ö¨:FíÁê"{ˆ8+îmæ	¯¥>ä•í†µ¯y»‡F žàAjéÔÊYº¦"¼×7~
Íªyã L¼a4»¬ÉŽx0K¯J3\y -oÌêO£Èßæ»½ê4Ú»Øž-oµpÅvgûtïå¡}½nÿn”:áŸîmï¼ÚÃ£³ŸñDiûh{gÿÔjes£A3ÛoÞü¼}ÀŽaÞø^øàŒ¦2VÐXNŒw……´ŽFºûnÈ£4ü¨0s\å!µiŽÀaæÔÍœ€†™ZÏ2ûÔ§9eF¶#ô³!©ü˜ípÅ§²%®ú˜)ýÇl‰ë>5cíÇ‘Â½1›âêjJk!žùÆ©ÔÊ!âdû½¥Š§(ðö/¬C…µWœŠ¨žM”éü3XUÞlm;\swÓ=p7³°|pçë¸,žWfB7g®hökþˆCô…lÉ_­6Êý5àuü£)1v¯€²9‡ñzûáìc.¸ÆBÌfNió.[ºËƒóZ€ê!l²0ÃÓ¬awÖ ùSOØý»—5±¢£‡~y(£1Ð-úžì`D—ÃF»ü'%³; Ì¶nlq›_d{dò
‰cÂíÞ¨7®±2˜†Óqå·ÇÔ#qyŠõ"v„Yé>™Œ÷Sš¯R¯ÞÞ9Ýÿ…ÇÇîìÙÄ›ú-ñÛloP¯”>¬zŒ»Ç-ùÐä1://ê/ÅÐÐ²¨KPKƒtÔÇDQ¿a-«Š`~2…Åô„¡Íþ   ÿÿ Jû?Øxœì}ÛrG²à»¾¢Ìp@ ð"‰&Å¥(jÌ²¤#R3Ç¡áZMtèQ£ÓÝàÅ4"æììÓ¾oÄùƒý¥ù‚ý„Í¬[×­Jk¼FØ"ºQ•U•™••™••uòl—ô÷·ÛÃGÃ‡¤ýêò2EALF4)2ø›ÑYšGEšÝÂ×q”4[ï‘“é”†QPPGW”Ìg!|Ï{kß= â3J“¼ ×Y0›Ñð(MŠ`T}¦£^>‹£âŒÞgéiô3mø¯/¢„v°^Mÿ9
‹	é’Áp½„‰•¨×6ÁvÈ4ÈÆQB¾%;  ˆãt^üOƒAo[«^ömžeÐÙ—Å¿§ÑxR`¾¬° 4Î)¹SÕr:*z³ ÆÐü$ï]¦Ùq0š´Û3Ì:Ù¢–ˆò§ó8¦8vV¬WdÑ´½ÞË‹ +ò?GÅ¤½ö¿ÿ×šÖOB¢KÒ–× l\ãè¨ó‹¾&ãö`]¼ûÎS{”ÆirÞ@u¨%!½yuÙ^Û]³ªØ3Uû«ý}ÒØ” §LµÊ®õ;e áVs²úEÞz«×Öõ‚ìò”Cô± 6&ðå²àVEJC
ÎÙ'{}è’ÖV/¦É@|C¶zCøi»×_ÖÝ	}xŒéé,Ñ¶Þ@³‘^0–ùz#y|IµòPLŽæy‘NÉÓxN2Š²QL­òy´xÅñÐ!Cb›2>tºˆ…9”¶š¡ÛÕÉoÉ°‡Õ{Ãi=o-!tUL%ÆY í"C’Ç zºûýŠž1Ûk_Ñ"k²†Õl&7Ê3–xlÈ£2ýð1Œþßt9Q	+ìmÄhŒ$…é=X[×dÖc#àá‡„îEÓd&´t"%L¤z-%A¥	ŸC× cÈÏ4K	ÔÊâ`fsŽ”†ûZ?.åÕ’¬½Y”%0…ÂÆIÒlÄh²œ"ò˜lÐ÷“O_?p’š„¸X:Û*pÿ¶= „Èº;6j…F´¡Ë.`…ìÒ•[ýfrKkÁ–X›_‚Äú´"‡I›¦"ç‹ãX¬U-:\‚W±í·µdö¶-Õž¼Ü
Âà´’0ÈBÒ|”E³C¥-‘‹8}ð¨"¢¨üÕðøŒ\çp¯bãgm	\ç6ŒsËfobcÖöt$ÊOçßÓ ¤™­£Ñ$zŸ£jUò›î@¬`d·Š—/e\ÁT0]®ùJW!½V`óE52mþ—””s Rb{8½Š6Mn/{³Xf; ÿ ë¿V\žSäx°–HLÚ*¹ Å5¥		£ËKŠ5¯‚èù½=l‹}á3i:#—iŠ¥È8N/ÀF¹%Á(KóœÀwà±é,ŠiókL9 –ç¬J[õTƒ8B’ÎhÆg0éÆó(äz#RpjÉÑ‹ÃÓÓŸŽaze³,ÊéOosšýôCÌƒ¸7/9‹-äŒó,!mb/Œ®È(òüe0¥ûkãîõ$Ãp%ÝI÷ØW£ö ß¿štw¶f7ëçä2¦7kOÄèï6¾!§Ðò2¸ŠÆ\}øfCÒ`/	à×ÝG}P72`Ùn&¿pš ù„Ý>ñ¶‹ÚÏeœ^wo»ÁÔ¥Sy» ¬Ò8¾2Ö1öOL2ëî€F>Ü‚n5 02ÞÔvc»¯Fà¢`z½!³›î–VËMz1äëîM„NŠîh‡{¥Zøè0Q·`òŒõP;Í»hƒ(³î^q4#h<¥Ðl•$%á¤4°;~À&ð–ÎAƒ»—°¶à°AŸ‹Æ)Œ»O‚$šb÷fóÚÛ æ 7&óÅÌô»Avs®v@s< J¯FRbàxÄê´èÖžü	–ºí½™FÞJ’0ªØ¤¤@ÿ¢;4ìñòÞ4˜µÅZóm]{ó¢HKÎ} ·û@/
ÖÏir´ù°×fþˆ‡#\Oy“°]Ö]·+—¸{Í©1ÚÌo‘ÙmwS‘
ù¨dn	 wl!
“<Â&º(:Â9—Ý! ük[j2F÷È>Øøem…?¤¥&}>	ÀéÆcùM°LD˜3bÆÊ‰[þÖòÁÝ%­	ÎÙ]](l| uaF´,(‹÷&F­yas	"y€ÂþñãUL»¿‚äˆ.oå£;ªÑIÂ{uslŠñî ÀYRÝ!bpW#ƒ5³L„•ò’1S—#™UÑšÕséå"ÚÆ-L«7ÆÚÅiBc:d•ÌZ	rÂ‹°E‘¹#9(-»dØ‡UÑž®ÀqéÈ…LL/‹RæO¢lR2+ºýÞ¶- ‰%¥îÞsN5™Tdód„Ï¯ï–SÐ”ãŒ6Ú«mêËÒ^d–RªWDELm¼ ffÍ†%¤/zqçSƒX®3èTèBµéD¦§" \6ll5¦2#Ò¤Ñ`=œ±·ÁE¶þv]c){Õ@eäßç ®ÉŸ  Ä½~öœßÌR¦`sŒi¡é&žu¿è>BÛQ¢Éœr0M7v˜b0T+Ñ¦’SúÖšâv†úûaÍøE-2”õ•/õg)ôÞÄœ±Ô{—]ÔVJkb‹åòQV‰/ñüP•Ó„Ú*’–é; ´[k×¤r]“¦0gÖÝB˜_Û¨ÀçiÖ¥Éêrð&RÙ4Û_St1¡ŠE%¯¤2“?¢.’,`Ìr	Z¹ÆâG%ÜþÝ`kA6¬"ÀÉ“ãÿxýêÍùáðåÛÃäìÂÞÛ`?éLâaoŸ¶õ¸JÙ²fFãàŒ
%ÈK\þ‘&8|Šc¾  JGÈJ· ,góX áªœ>`bÌQ®“ô’¡M—˜Ý‹¤ƒ2džEÅ-/É÷—ò"ï€Þ³‚­Šöõe4ZLÞ3ðáj„ò	5ÑqšqO9Ìh Ó J<Š£m;¨•DäÄã]àËZ“ ¸é^w·nbs–rmúuFsŠƒ¦!ÎÍ *,œïMS.£+Ÿþi	d[^F	Ì• Þ¿»¬ƒYZÜî’~‡Üò5Ö.-T|£ô€•ö¦7QáÛõ.g-ÖŠ(Témvu—¼ë÷†ð ÍÁKtÔÛ`–­ýh|=¼×$p­©Mb-]º
 ÄLyraÛ|•Íƒ)‹fêç¦abùŒ*õ$æbÇ3ÆŠš{“¡#¶«MÏmÛôä”ƒæ¦”@²ÇçþA—†Õ%Œ¯35T,ž]?¨RlÐ¤úåŠºR¿â*àÆ-]Ø}’ŽÖª&uÇ7[åHñôxÅî
¯iUzo£”3æJcIªJ9‹ò“?©Ö¿{°xðàÔgÆº¯³WÉ?Eôº}Gæ9ÍÄ›è1oY ~{
ü‡a­MÎ&`ü†°R,v‰Qi—y7»¤=3~bÖ÷U…ö1^š?ƒÂü›Üµû.MÒ4Æåª8e_ÏÉ>öé´€–÷ø+òI`U|ÒÆ™ïLTŽòãd`2fõOä“¢}Ä9Õ+ëÏÓlÊê‹£
·3Ã(ŸÅÁ-2Ð®Ž¥žöùåÒjuXy>’“Ð,,ß–%zgP‘ýÁ¿{{5àÝñå%°b»­…Gp8—´M²€kóÛdDÚF:©¿òul]¸ ¥{¶Èn5ÿ3ÿ7 ú·9Ín1^ æ³¡^tH‹CÉ[ër=¡m·$Üüº¿ÿzÕ¼Á¼‰<	fØu\¯	ÏÒQÞþ›VŒ KõètVÜš^vÅ=0"  +ÚRþ®ÞC–ìõzÆ;àë ´@m“×ÔšòxáËŠ²ÒóLÀ MH›fÆ Ž.…‘Ãë4k¯ãN.ths|¬ÁŠµT¬wbóG²<üdÑ!ï|(=ç\Â±9/¦§Áõ²CÉlmÐ3©hY§<ÃC‘BÑ€ºCDbžå„’]&‚Š¼6²âÿÈ.X5·xV_àžcÆ¼“°õI×QEË)§ÊÉW—
«RšµÍA©ßu¢	*Êšt-É· ³%a[w%`‰ll³- ôœOÃ]¦+Å—Lo¸ê,-ßGÊ—÷%höø7#ö¥{™¥SÐº
ôÐo•NK¦ÉÅf©B'­G±céçÆçqÍ±Ó!7U7•²¤Á*7ýÚ“nå"g;Ã}*ËÔ°Å,5Fø»a­$·éÌ1àEf1¡=Äù´ûKÜDüT[@õ_Ó3î¬¿øC#¯xµ¯BóVØÀ«Ýß–{2†[B¹[tt>‚Ç0È>”Ô«âCù^«ð¥›=º×Â1,÷„ðEÀ–ïÁç—ªnêo¡K&óu V5úˆ¹ga{ápšæ”)G§:Êeû$¤Wâô6
C°‚Œç Œz¹ë›¨p¾-LæBE¬’¥lYã¬w?nqüã+üãC—¡¶lW±@N§Q6Xê’ª'ôSõú>ÒÕ°í›§îæT¹œ°E¶Ò}XƒaÿÖ…í2|Ø¯Gæ§F¤Å›8JÃ	GØ!¶k}l–Á£{ï”rO4ž®Ü"—ƒÆÕ¥Šg°P––‹çŽéG²¥l_„½ê±wqpAcw_:¯p ó°ÚÂ¢|Ð2À]–7"`œ†äÃxoƒ5æt¡zU4ç”6cµ9Yµ»¥±”rp¯=¹Óõ8Š½Z8»Ï2®FÝ¤˜Æ Çí¯¡B' ãPÖ>RŸq­’ Ü*„FÉl^¸{ªQèvÒ)Ä—nìœûÛUÏaÊø4\×Òtú1”oS)_¤íÚ¾ÓµðŽ¥@÷Š {ªÇšólúv2Ô¤ªšH>v rŒæù.†•37‘z(—ÅA_ü`îmàŠ™Î¶W–¤	µ…T…R÷È^È‰³`3ŸûÂ§É1ùkÏw¯nfI}w‡Ú “Ç]¶ª—Á‚ÞÐç`~Nhcù£U[¢%túæWçhäÛ1ÂKÙ+‘Å:§Øô¬1÷ï„g¥Þá}„šWl±Œ»ø/¥~io¯„£ª^l’,ÓñåÓVÀ¡\§¡
½ÚöNwÅ¾®Ív—R9ô+ŸñõÔSPÈšØ4J=dÇPÙ¥qœÏ¢5rÜAgÎ.TóÖb)Ø þ¸ð>«†òˆàv"¶‚04!…;q¨ËY;äp„”¨Ýc.ò4ž£
Ïbò2´¸áïuwg‹`¤±ƒ…ÌX¶xž±±H¶Øé“î4Ã€Ÿ.šÚ0®:véô$çóõÉ²è²qáîdbˆDóeî–CÆXS$ò3<5Rày¸åj¸ßâzhLDÛ@”XCˆ7@AAfÁ…œƒ‡îv¶‡õ>y!ºÚ Ô›|Ú óq]ÈÿâWãËá—»ºUíe
¦ÃŒŽ¢Ëˆ†-W{¬³ÍFGÓJª*ÅØò%-Ó“—ÓúÐ–uZ3K‚”¦EsºÇãjÐ´¯0~m_ÎG“<
‘åójS÷iÑK¶NÿÚ4eBäM¯0‰%1«IFÁŒíTÿL-šfè—çñZ?á¦i­¯NdÏ«Za]®Œ°<ˆY»Ó=ç±½@øà}4ÓhYòZ‘ƒæQŒÚÌðWç ±‘xòìÓqÅ6†…ò¥¯tJ³ qåóýÈû¥Pwµe~©„,y2±9z‰¾Ð_"²>+ËXýUÖø·å
ÿá¶’®‚‘ý‹ùì5î¸Ý“´®ÆßÌÊÔFG×æÚ“éˆŸ:I.Ó*¢×ëáCqÂ<¸Cð•f‰V˜5æ»Uÿ/þðK-Üº’ÁQ±¶ï–^æ#ŠXwÅØk„³öÆaS×ýsþYtåŸø¡hæã ÷8­‹›_Àm³w@*C¿+êc0‡91FÅgÇoæc0W%JVS°*_˜Îî?¨Š@;§QÂ—”\„¡= *äì:ã‰Z){æG0OižÆ¼Ã
ŸNÒëç”†X	ÞD¹|ÂMm^æ(Nsª’q{dŸ¼;ÀbÙTËf<šÙ+ÊÍéÒÁ.	’[·cL§“»À£ ¾ÞÚ5eÏ¡%Zˆð„ÅåZ\\nÆAß?i¿;_%˜LÅú¨ð¹Ã0,£çøC}ð\”¿éÍœ”Ïõç¬Øé|4¢9Ö[ýM}å„^Ÿ–q‚/å“´GæCoRºÅñiªÉ«K^…¿áÂ›—’L>ñÙ©Ãy‘ŽSñ+‡å#ÿù4'†êó—£ŒbxÑ!aûñògé3ŠAûmå+›Ä•FšÁÊ[plžéo8oè¤çOøÓ€h›<yÒ¾[,+¬ü[c‘\k*ìoAÌå°¿ÿŠþ­É8?N–äó€ó*	fù$-Úë6æ»'2¯e—øûÁh*ÞL…ö©4Rð`îÇp˜ö'²"ð@3¾ßi‘f*ìÍ;£¢¹íÿ„{3dx"õ3ƒl–ëˆ33ÕÑ„ë¹è,fõ	P<“+Ì»Ä3”½Ág¬F 2ÌÐ)³Î/T¬ö3ZQœ3”Ï‰l‹áe”P¾:¯î
òu0ÅM”Ñü°8µæc£€t ±¼ç,­4<Ætjû¤u:â¸UþvI1bqûñcq‚ŸgÛB{ûä±ÉWƒèÊxX¨g¸íôÛ¬´ u ý¾ÖÜÀµ@·,PþNŒ«T“õ(LÁJ–QzÈ1”aâ·Ä#£3žìÓsp´Zú¼æl$Ù ÓÏ¨ï@/Þ«¶×{Ezrúê”§3Dƒ¨€Å ºªaA6ª˜ý‚ZŠ¥ÈA	A½ÄMõV}ÑÚ]gi>@ÐþHƒLÿ¡7ÖÞ³I½.³Bøpc¾ƒ!£õSQ GÞ¢I÷íiOçNAwœÀJ§É˜à`ŽPX„àùšÔ^”™-DØw”åvë8	u´é£aÄZÉÆ©ã;Ê_Qˆ?Q’'F¼šÅV_é 0N­ä²gÁ“ÃÒÉfîNÉÓò«ÞXùN5(_Í ôÆyì’÷ÿøÿçë;€¡h$9sñ^–wÌçN™¿Câæ(¸£úÌòõ÷:ME•Å°[ÚfÅG?óF”¯ÏEñFaÍ„SfO›}R¬›Ïë´ œÿÕ:€PRÕ*ÏÄY©h0ï0;GÓÊY¸ãOl9j!õrî’Û Q¥zÈÚJýÐ`;'÷ÐGJ¼]j,½Å‡hÆr[ÜáùxZE‡BÀQ¸X_×W|o,¸g©ç!ÏQxiFeœy„(©-ýðÅ2ðÖzgž“Ï9sÑÃ8˜ðž+@¸Ž’0½î±“¥Ù´Ý:Ì(†[“|.¾\°Þ)KY1”ƒÖúº/p^;¥à?¡rÁBô1=QTÐ§ø Ü¢iw¾Òs;Z‡/éÝ
í<N¬‰?=Pžh4è°Ccxh0v1ÕµnüI‘ø™	ÞÈ(N£B×NA8e ³DPób:$‰É°W²BÕy”¶b¸óòÕb	YÒP´à¹åÛ7j 
0Åbc®9zsrvrtø‚üùðÍË“—Ü%’¢–¬0ºÀCÒ6K=?<:{õæGòæøôøL?dŠöÈÙ$ÊÉuxœÑl$P  …Ìü"‡/^ÍòæV:?/ÍìÀæÍˆÎ
~~€ëÖÁˆipë=:àn‘£Ã—/_yPNú•ÎØR½ecåŽYà\ŽY–NgE{íìvFIËP‡(jõÊ4e\‰Ô`a&Y«¦Îœ•ÖyBDE¡b`!=ÿ™y2ÌÃ5ó—ÆQGB×ÒÃ±D—Kf¬5Áù”x**ùN¸)dh­>!}7[ýLãŸe½ãŸªñc’÷À‹\Òò³ô(ý}XjeÃENüŒßƒy?ÅéXüÂ—íµs,H5Æ6fp›°ðPsêÎZqáqÝ¹Ö\ˆ©EÑÁ5G2Ÿ]í°—ÑK‡%
¿ýÖúÉ¦%X/Û@NÞY,êi˜·Ï&ñiƒ1K÷†Ù´‚å¹émp|Ds7°¨>gÿ
ºkÏÉ8¸HÿÛ@m}hõ¦&ÜØ ¨wYˆÍÐyŠB%
ç\¬`¾æé(bâÉ7¹¨âHXÎ"å¿ãc|Ñ8Dµ*ÎçÎâô–ROq–mùöŒÜ ØÖVK¼”ËlÝ$G"ÃG­MÏÏauÍù²ÍŒ%ŸÈ5$Û}€Nt±¶?‰RpÉûõ[/>R5`	uIÍ¡´ºFyøôôÕ‹·gÇ/~t5“ªL³4ÚÀY¬éÜ,Z®àÌ`ÅE–a
Jš³*¼,ƒ Sÿ
FÚ»¯¶ú1rè÷Öd<sÕ¤tÎ–&¾¦š}l¬É½Qž$[Ì¥fÂã[¥týßf•è¹ÜYx±t¹ZºZ•‹UéM«3Ž¤¯B™#€«åïýÄï½¥ï¡#1J3+ç[U<A0ŸÌâbÐiø‘¶òè?³sÕ~šŠÏÑ^é±YÚk}ÍÌáæi®àÂ
NaÃÇKsÛ-<²ÂD/h¸7õ÷UîM«1Ök½žÕ?Íìj«Á±¬eÉí:J}jèyr¶±,³(h{šj8Ú¶H™L>Â<©r­1­PUÒÍ®ð÷·#û§±²­ë•"â,¼e c@†&¬Æ¦¿UÃ,_.œ¡aˆã¨q –ýñÍ¹£mgÒw¿è]ã*‘rŽ-$„.Åw«å„¹a]=ë9½8—V°ž	
ÙN'ˆ¹®çXY¼€ƒ÷¢ñ¯ïœÆïk¥'jAŠñÜä¤»"¿*?2tŒGZö¾?ûáÅ	ùVŸtØ‰Ï]ìèæ-ò‹¤ÿ*iÞrøðü*ê´&>ç½wýóÒµÎS/™’6“YñQ6
Eù9”{ÃÞ—â”—ë¥‰`Ý·GMÇ&¼“i0¦ÆVùt¬Aª¸«i$WAÎ7ÛYÒB!ÿeöÚ/`^Á«Nƒ›g^w´Ù7t>¦ñ²9öYØw»ÀDÞW€%øÃwz)·(ÈQÖÖeô¼+PBÂýf_voƒ÷å;Õ%þþ»å<`œÞ‡£7 º_ŽÉÛ„>:ŽÔžì’ƒ!ñ»(äP¯Àû¬Di`H–âñ¨6-Š7=Ì—Ï¹ÞÁ´…ðk»#qì6Âûm—Í)º‰ß¾yÑnElcÆöDûì‹‚8ÍøÎŸi6!fÜ•Ú¦ÁC&‹~,L'—¶C_¶¥OàÕÚs„~m«÷];ÝVRh„ù‘g#”:(„äÁÈÖ|¨ ð¸µ²Z²ÿæ’dZ.%[¦†"QëÑéŸÎÐYÃ•97Øh"eÙš¢Þ!ê4B‡à2÷©Tžx´o‡ÈÀWüÆWã¿$â
=aèJAðÇ7üë÷À™
Î ?nnuÈ¿¥“„<K¡á—Go:˜ê?Šø T ¾ˆÓ!1ŸÂ×ö;1oE“çh
‰u'ÑÆ(¿*×x¡!²‰ ˆRòÕÅ_AçAÄ"t£hP#S99ƒÞl0Ü†ÎbùFÒã7ÄÚøS!ÒÃ>ñ‚
6»ÇoûHÂ£Iv[ €ðØ³\Ì
¦WÔ¬€ãVM?hã‚Ži×`˜›1U¯ÐLš-¿÷ZV¿âëªÔmˆ)§E6ê;pÑP.µ–›-Ìö²,Gë,Îò@v©O³ùÊ«`@Î‚¨n
~P{ã/ÙÁ_’uÄ^qÂî=ƒ¶ð¯8wÍýÑ¥¤G<1Hò¾—=2ÔE …/;€À-z‹_RÊ™Ž.¶ À£#ÐQ<ˆÎ\Yz­tyñêæ90Bx†®]òi¤„-1-ÎR°˜µöîœ…›8åÝG¬2œ`>AŒ ¹¦ÙQ£EËñÜê´Öy˜ Ï)ÊQ«Ðb€D+„ß!)€³l¤'xd{‚Õ'½(Åóæín•€„Ú6®…Nm¬Õ¸>q €uÔ ·¤`T5!0| œZë¥†¼vr©HdxùNž³ÐS4yú,¡ò¯å‹F47‰x‚ó]PòÉ>éc šxÜ-Ý—‚^X˜Må»eÌ¨ Í‰ŒVT>î’¡ê8óø±p>5üþì}ÎÂ›o¿µSS8Ý#GçåœEH,gL.4­¹ b“Ÿ§µâå¯"ªäO,÷T¿«þŽ&A†ózbªUlgdÊ×š£tim%¿Wèp%˜?Råm˜|È½Ù<Ÿ´õÞ[KÏÀœvïªkà]¹Ð£*—eƒÎ”jŒN”²xdèsð2_ß¾ ú.99?P'w7þûÚ/k_o ƒÐ÷Üu«KG¼£B‰V¢ûUJ@“Õ‰XûRòˆ©! ò—K€b–YnÚ—"É„Í_Þ¶8þ³/%•;oÛš*Œ¾ÀÛþ vÕË9[ë…5*6vÆŠÏÇùd}M7tÍŠ¾˜ó9tç¤ñJ˜ò`¿•t1½‚/Ëó\N¾%é7ÔŽº…J‡¢q´ÎWPú“dnA¿çU#Œî}ÅOe”š­Ž!³È•‚ÇÜ4w>›FêYt«ØS Ÿ¥£7ÌÚ	ëüÅ6kñ=+àÌ¶Æ´‰ãiÙ¾¦cÁ¢ÄY4¥é\†ÙV˜²Ýïë7ênÐ4s¥»v(äé<Æ´QÌ¢`¯vùÁ4Óá=0ÿÖ*ðV¹r¹[Vwà­¥7 A†c~·aìJ#åŠJñcÜ%XÞvèDR‹lýŒÞ(QPî'£ÇÄNä…Oƒ$Ëcã‰º¤DÆJ‹_L˜ûwæ³v°Ûr*›™W#êÞ%€ænŸüÜ}7ôÏ—'Ñ2\?î÷7¶ú†Y:ë²üKù´6÷‘“{ê†ßÅ(òüñ„Ò˜hJdÕµÏïM6WKpyóF8!ö6&›Ô¥—M@— ÔÎÚ“ÊèaOô&K¬k`½&A:‘«vp)Xˆä»nËª<›nnÊ]_ŠXß¾Gm‚F+‡Üp¥<{*¦Š+€¤nz^ç²2;››{ Ù“N¯*¡^4»T+¢eÜÍ`¾{ë5B«ý°/4ð7BÃªG±¥ð‘Gwÿ•ÄÎ#Sì”é]±ã›lVzs\ZØ(÷H¯š|e ¼äxËh|*¶ò@ûìËÇ…+àJæ¶óƒúö¥ÿEv¤ÉÂMƒ^fÜun_ÜñÎOÒ‚ÿiSúž´)guPU¶¨åÉü”X÷_=U±ÃMýÌ37ÍÒÂ–M 
A²T¤"öwùº;Àt3_&ÓÌ%"ò	gÁX*,‚We¤× ZÙù}7n5äþ¹+‰ûbâOÜ®Î³Ñ¾ï÷…›X0Åþ¤l#¢‹×9á-u³î`q±¿VRaÆx	Š3Í^§0‰o÷×’´+_‰4¢ÞÛRõ+™«ÿ¸‚Í¹×sÙ'/Ï7Í3G³+YDêºÆwE¿Ys³A{ÃÚ´£¶GÍt¨2ï§\dÏ¾ôÝ—ÇˆurÅÌ$Ÿyæ‘ýûÔY:uÊ• bî”î3y4Bü&fÞùO¶a¦–ÿßgPƒ¤°U;T©˜K
ÆocB•4¿êœj–Y°êîYÖÛÜGÎÇAo›Lc$‘¨±rNVÝOqÅ„îí§tIC*|šIb†+'ž‹%|÷JàÇ{·Dím#úõ ?ô{¢Œ¤õÚÃŠÛ&†Õ·Mø.½£Ö;¶3jÑlí˜Íq¬-ñ^úáÜBÁÈÔ,û£?ëâ?ÙqX3ÁÖ-
5,èaBiÕV‰œX±4›±ã¿CŠ›OÒ$õ³¦Åœ'ÏÈK–_É_Ú+9•£ä/ªÃéù)™Lw–|F3}/¿MfkÄb¸[Kü—ág»ŸHÜ¬ðºËªŸ›eevÙå¬êð¤¾¼X…û¤ŸÏá»OÂa›Üe.¹àeRÛ{`ÝÜO_	ï¥Oõÿ_ÌË¤¸÷Â¼ °"æ¥ÿúËÃ¼ßvøgXü¢žŒßÜÓ.àÖžùóKq‡’eÌÐï@§x=k­¿ëŸ³è¤¶2´ý+þ@Ïîgüb1ñ~ü&“z=°©¹Qaô.Ý‡­¾ÝL¿Òë£O7¼™P»YÉwñ™¶ÛË.YÓHfoüM+o>¸”0.T{×ï=~tîÞŒ¶É~o-ß"fghù°?ç>ñ^ø7fã]xn »é>BÌm×8åä,<>ÜŠëÃ~înõË»Ë¬ûÁ—_Èa¹^¦¬½´Ø¸×a¥Ë¬õû“™”¯¹ùöhB¯²4yA/‹ªMLï]rnFvÏ•é«Ü’.ìtž*9·oJoq#×!qËfåµƒ2Ÿ½Êè†ÛåÕ´Q<QÌY
+†¦Žc›2‰u£º‘TÜs÷õ4eip´5Ë¢èÄûwwÒÓ¸‹¡ýlvÃ·Þc÷¶Kq‰ Qe ªÜ
ô&*ViÀœ§u·ÎHf ]öMB2¶1×1	bàõ¸{nlt`xP\ô»ž­ÜÕKCKx•„Ð+˜7˜å$Qu	j7w§§ú,³–iFÛVö²jÄµúò.Õ10¢ˆôPFøâ‘µb© &gÙÒ®9žº;Uô$Óþ)o”4{ðØ½D?šþ!¦I9Ë"PâbyÕÙà‘÷¾VžEÓ™iŸ=õÝp/ÊWÄŠ­J#o‚©FD’Acž@°FdÒµ‹Õ¨ô¹©Àb‚+÷!ÆžÓ£e7Õ*ÝÌ²µj &*É—¿¡<øarò(ÊFËÈ#&ˆL…[!ÏÌìÉ¤¥G¢!AE¶…Ÿ˜U„üçJOÏ1ð¥3r¦lt_ Y%`nB/áäÐ\bhô™<'-»¹ÂÌTukbÚXÁ:Açø>ì½ÕŠAñÙË†´ÌE¯o!W‘;Ëx½²†qrUÉÒÛ`,¯rØ—Ö¬vÑ¿pY«ý1&‰ŠWA¢ìI“¥k»ø“KÅx¥åëu<Ï›®Ze ígY¨ÌÚ†y²·v´z˜bœ†1;‰æ°ÙdŒóM7˜ilÙâÕÎ&¼bÛ
sñ™Ùnªïëä¤ûîaÿjrS?/Ò)ž»Iãø"°'ÿ^Áãág@ÐâÆóVÁ,§nlmÞ#žÂôlú.qÛ+2K–WÎç´°¬y?z´~ä»éîàlØ""Zf îŠcÓ¡Ê6vÇ‹Égm‰Ç€|æFä-‘Ÿ½!]ÿüüA1Ï«šñ[Ÿ¨q^<ã.šÃ‘P·¡#®8‡×™«¶±	äN+Ì³â•$¸_Òî­ü¢<`Î<¸k(“%Ïíb2ðSÂ¸>Zh; Û Žî,LÉ8qgK·<Pµ©@g^ ‹ò^…·×ë’ùÑ‰ûâ,¨<°Šênÿ3£@ðÎ°¯#¢æ6TC^Â‰(ôÅV2a¼4nr*EÿEEkÖs7±ß]¸	¬´r º7‡+] ÿ9öe*ÉLžã˜÷6&Ã
ðÎå †ÝàÀî,’Á\€¥1…'¼B˜†½ªkrWâ7—±$ª¼0wžFD¢'¶ãð#¿`ÙY×ï*ÁˆPÔò¶Ì¶º9ó—_ð’7™^såsTîÖàÉËGÌ. ~æ=ƒeGÎe7&A®õÁì”v€¼@«òê~ÌŒ¢ÁUÉ`z…wi#Ó/x©n+Ê9fõ†ŒËau¾Ù9ØÇ8þlPßù@o÷ï0ë´1ïœ#™¾S™ZúxT!·kîË-BïbWY÷¨­5éÔv¥\1Yr)Øµ­<ˆ[†V+ù¬Yïä»÷0î³ç`TçÅ™
?‘U‹*T<7NZ`À7¼bá¹¦ÎýˆLà+H¼2¾^iÄKƒÅkºé\uˆ“ÝÔ×©¥KÓ’ALµ~Ó£Ä8Ý²Ö±ÁN¥q©ªT/ZU®‰‡%ð¥©nÁSUL™Ž#·ö$[Ô\KíkJjZv8‰ºŽÚÜz_}	šjþÔ“Ö{·uë¶-_´È»üýÕ\¹]Ñ‚‰È-ž>@E–-{ÁN°½ÿÇßÿ‹|­½\¼¯kòcè®í¹·Áúˆ|‚òjã>áw¹u‘­o4ñ{ôüWÄ¶óž–àœ7‰w,”w	ÔÁ¯];’*Îm0V_&4ì¥,JX,+¿œ«ä}÷½q@­!R«_îÓV
ìeýÄ¥f~Ñ“W`.HûŽã¸OÒt±nˆ[…Ùþ€øž·ëË0Q»öVáÚHÎâ7ðšŽÍ¸0tÙR*z³4+æÕWô$Öax™%U¥¡ïUFÅ?ÿ÷ÿÏÿ$¯€¥˜ÂÌ®KâclÖõFT©æ»ÇêøWid²á@ŽùŒÝåÔr®F­[)ï3×yë~–ë*ÖÇ Pó¬W³Ic,2ä•÷Ð‚ŠÂ®ùýäÌà'’[¯¢µÏËN„¼ÎÒiJ(ÊÅcªÕ0S«Ó• pß2@KÕË&hõò¸XoWváS+®I\/¡æÑvé•nïlÛ;Ë«g	å®¯j¯êá2žX&<|Cð';Ÿ²û¯a>ÀãÒÎß‡ðM‚¬XŒbx¶—Hõ¶4
aÐ"­~º¬Ì‡¬|pé|VÛ°•×ŸU|<×Ô½¯L]6OÔÕÇ_Këîàýº{šÿc§U¬û4¸Èm1KMäÞ“XùišÛ±îc¹îTæGî¼k:äÊëÝÜV‡û?Á ›—,3fz\žM	Ÿ&WëUv·)Ó°«ÐÞ+ÞdyÚ£"W7"kw¢•¼öÞ7ìIÕEiõŸ{]\½¤#J-/ãÄñº[…
ðŒ®©Á_m›±½–•	vÕêAMåg¹>óVQs©^S¾T~š(ç_–hþò³ç>ùºÏoB.¯8æßÅ2ù](¯.”kãŠeÁ¬„ù½ÅÞ“cö§¡®ÇTmØbù±ó\.'¢•ô²×ëåÍf®¹¬ÎR^¨ñ÷xj?,ãLAºÄ“Ð„ÞzÐ÷úþÊ1oà%Zyå®Êzœ7ðÇ4†®8Àq¯xpý#cÃõÔÖ?¯÷Î² ŸëNT9U>~V/ÝÍ«v TÀõÅ¿°âîÜt¶!Ü£#,ÂÍŠGÝ`©Mîm`”.R?@oÿ  ÿÿ )qË