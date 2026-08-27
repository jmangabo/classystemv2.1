import { RoleSelectionView, PendingApprovalView, StudentPortal, StudentLinkingView, AdminUsersView, AdminSchoolsView, SubjectsView, DashboardView, GradebookView, AddLearnerView, UserGuideView, EnrollAllConfirmationModal, MATATAGReportCardModal, ProfileView } from "./components/LegacyViews";
import { SummarySheetView } from "./components/SummarySheetView";
import { TransferFacilityView } from "./components/TransferFacilityView";
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
                    xœ¤VmoÚ0þÞ_q‹&5‘H@•ÚIŒvêÔuBZ_4¶OU¥:ñÞŒÙN¡kùï;'P¨
$ÝøÄÝù¹{îÎ¾Àò7>îÁŽß|‡Õcw˜Ûm¸6:Ck)S#BÊ\6F»0ÔÂL+ëàÆbÖç-Âº[ÐC¸JaæTÎ´áÈè"GEð¸Ó%@å¯ŒÇ›Ï^yZS(£'Äê£ó™Qhàø¤6æ2*×ÙwRXúC‰II)­(t[	6hÁ"ÙÀº‚S†6ˆj©A•RbÑ…U˜VZ ŠM°‹\/ÁÓA«Vµ‚’Ðiq¶B’P"/˜ÄFèT7æÌ­V5çÀFkx<²Ó˜3CMùZ0Ã[«ÀK}s"t7ËÜe1IÑ¬Ü½P¿!-Î½µµÔ*Es¾ŒWÃsa¬;ug*[+ÕF³÷®p
gd£Äéþàj@OSH²¹.Üÿ±Ýtn›0PÚáZ¥ø†z$üÔu·RªõR7›œ`S&“†š9™PþcÊúGãúög.5ã”Ä³ãTÓ]‡LZ¬ñLØÁXO¸9š3ùf×Ôm
ý­ê‹]áonÄ/c#ï“Ú+°oÒ€ÆVÝ£ñ`\ŠÌ/“a!åˆI®9…å¨|Ôx¡u´<Eî/3‡{Á@«b¹k·kÕAV.Ž©[5~äk‰	Õ¦4Jïœ	I”œ&v¾ÕÏl“ºÌþý~l¿wÛ,óm†L2k/iù,>‚ü!>H!Å‚ú>ÒñQ§c}O“n¥û@:‡3OÇþã€v¹âÈã™¤O åâTK^Ùg¾g9šŒYgXö›2§‚Ó„Ì
cµ‰s-”#‘¬Ê
×c&%Ø1ãzËÑòß"ô…æÂ²”ŠÞÕ9Ë„{ˆ;ÁÆôN¶$ý(6Ô>AÐ/¯'i“$	 w•–oÂ÷vË»H¬øƒóèns¥{í´pN«M”zm.î_6ª{í‰öEJ^Ù^VLzíS%&ôv®iµ Íÿå¹5Pyãæ{{  ÿÿ h€‹