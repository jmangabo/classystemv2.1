import * as LucideIcons from "lucide-react";
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Scanner } from "@yudiel/react-qr-scanner";
import { QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import {
  Database,
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
  Palette,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser,
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
  arrayUnion,
  runTransaction,
  increment,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import {
  auth,
  db,
  handleFirestoreError,
  safeGetDoc as getDoc,
  safeGetDocs as getDocs,
} from "./firebase";
import {
  Subject,
  Student,
  Course,
  TermNumber,
  RatedValue,
  Section,
  UserProfile,
  School,
  Eligibility,
  AnecdotalRecord,
  AralClass,
  AttendanceScanLog,
} from "./types";
import {
  formatStudentName,
  capitalizeName,
  capitalizeFirst,
  getSubjectSortScore,
  printHTMLContent,
  isTleSubject,
  getTleDisplayName,
} from "./utils";
import { INITIAL_STUDENTS, DEFAULT_TERM_DATA } from "./constants";
import {
  ThemeCustomizerModal,
  DEFAULT_THEME_SETTINGS,
  SystemThemeSettings,
} from "./components/ThemeCustomizerModal";
import { SystemDocumentationView } from "./components/SystemDocumentationView";
import { SF8View } from "./components/SF8View";
import { ManualSiblingSelector } from "./components/ManualSiblingSelector";
import { PhotoCropModal } from "./components/PhotoCropModal";
import { SF10ReportModal } from "./components/SF10ReportModal";
import { AralProgram } from "./components/AralProgram";
import { AralMasterData } from "./components/AralMasterData";
import { MysqlManagerView } from "./components/MysqlManagerView";
import {
  DEFAULT_SCHOOL_INFO,
  DEFAULT_COMPETENCIES,
  AralSchoolInfo,
  AralCompetency,
  AralRole,
} from "./components/AralData";
import { AttendanceCard } from "./components/AttendanceCard";
import { RoleSelectionView } from "./components/RoleSelectionView";
import { PendingApprovalView } from "./components/PendingApprovalView";
import { StudentPortal } from "./components/StudentPortal";
import { StudentLinkingView } from "./components/StudentLinkingView";
import { AdminUsersView } from "./components/AdminUsersView";
import { AdminSchoolsView } from "./components/AdminSchoolsView";
import { SubjectsView } from "./components/SubjectsView";
import { DashboardView } from "./components/DashboardView";
import { GradebookView } from "./components/GradebookView";
import { SummarySheetView } from "./components/SummarySheetView";
import { TransferFacilityView } from "./components/TransferFacilityView";
import { AddLearnerView } from "./components/AddLearnerView";
import { EnrollAllConfirmationModal } from "./components/EnrollAllConfirmationModal";
import { MATATAGReportCardModal } from "./components/MATATAGReportCardModal";
import { ProfileView } from "./components/ProfileView";
import { SF2ReportView } from "./components/SF2ReportView";
import { SF4ReportView } from "./components/SF4ReportView";
import { SF7ReportView } from "./components/SF7ReportView";
import { SF10View } from "./components/SF10View";
import { DailyAttendanceTracker } from "./components/DailyAttendanceTracker";
import { ObservedValuesTracker } from "./components/ObservedValuesTracker";
import {
  AnecdotalRecordsView,
  getOffensePenalty,
} from "./components/AnecdotalRecordsView";
import { UserGuideView } from "./components/UserGuideView";
import { AdminSchoolYearView } from "./components/AdminSchoolYearView";
import { AdminSchoolCalendarView } from "./AdminSchoolCalendarView";
import { AdminStudentListView } from "./components/AdminStudentListView";
import { AdminFeedbackDashboard } from "./components/AdminFeedbackDashboard";
import { PTAFeesManagementView } from "./components/PTAFeesManagementView";
import { TleDashboardView } from "./components/TleDashboardView";
import { FeedbackModal } from "./components/FeedbackModal";
import { PrintAllSF2Button } from "./components/PrintAllSF2Button";
import { ClassRecordReportModal } from "./components/ClassRecordReportModal";
import { SectionsView } from "./components/SectionsView";
import { StatementOfAccountView } from "./components/StatementOfAccountView";

export const formatGradeSection = (
  gradeLevel?: string | number,
  sectionName?: string,
) => {
  const g = String(gradeLevel || "7").trim();
  const s = String(sectionName || "MATATAG").trim();

  if (s.toLowerCase() === `grade ${g}`) return `Grade ${g}`;
  if (s.toLowerCase().includes(`grade ${g}`)) return s;

  return `Grade ${g} - ${s}`;
};

export function EncodingClosedBanner() {
  return (
    <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-center gap-3 animate-pulse shadow-lg z-[100] shrink-0 border-b border-rose-500/50">
      <Clock size={16} className="text-rose-100" />
      <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">
        Centralized Learner Assessment & School System is Currently Offline
        &bull; No Active School Year Found in Global Settings
      </span>
      <Clock size={16} className="text-rose-100" />
    </div>
  );
}

export function DeadlineBanner({ globalSettings }: { globalSettings?: any }) {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("deadline_banner_dismissed") === "true",
  );

  if (dismissed || !globalSettings?.finalizationDeadline) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("deadline_banner_dismissed", "true");
  };

  const deadline = new Date(globalSettings.finalizationDeadline);
  const now = new Date();

  if (deadline < now) {
    return (
      <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-center gap-3 animate-pulse shadow-lg z-[100] shrink-0 border-b border-rose-500/50 relative">
        <Clock size={16} className="text-rose-100" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">
          Deadline for Finalization has passed (
          {deadline.toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          )
        </span>
        <Clock size={16} className="text-rose-100" />
        <button
          onClick={handleDismiss}
          className="absolute right-4 text-rose-200 hover:text-white transition-colors"
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    );
  }
  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-md z-[100] shrink-0 border-b border-amber-600/50 relative">
      <Clock size={16} className="text-amber-100" />
      <span className="text-[11px] font-bold uppercase tracking-widest">
        Deadline for Finalization:{" "}
        {deadline.toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </span>
      <Clock size={16} className="text-amber-100" />
      <button
        onClick={handleDismiss}
        className="absolute right-4 text-amber-100 hover:text-white transition-colors"
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function SectionYearEndBadge({
  sectionId,
  schoolYear,
  globalSettings,
  isSectionFinalized,
}: {
  sectionId: string;
  schoolYear?: string;
  globalSettings?: any;
  isSectionFinalized?: boolean;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (!sectionId) return;
    const qStudents = collection(db, `sections/${sectionId}/students`);
    const unsubscribeStudents = onSnapshot(
      qStudents,
      (snap) => {
        setStudents(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Student),
        );
      },
      (err) => {
        console.error("Error checking students:", err);
      },
    );

    const qSubjects = collection(db, `sections/${sectionId}/subjects`);
    const unsubscribeSubjects = onSnapshot(
      qSubjects,
      (snap) => {
        setSubjects(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Subject),
        );
      },
      (err) => {
        console.error("Error checking subjects:", err);
      },
    );

    return () => {
      unsubscribeStudents();
      unsubscribeSubjects();
    };
  }, [sectionId]);

  const isFinalized = useMemo(() => {
    const isGlobalFinalized =
      globalSettings?.finalizedSchoolYears?.includes(schoolYear);
    return (
      isGlobalFinalized ||
      isSectionFinalized ||
      students.some((s) => s.status === "Promoted" || s.status === "Retained")
    );
  }, [students, globalSettings, schoolYear, isSectionFinalized]);

  const isYearEndReady = useMemo(() => {
    if (students.length === 0 || subjects.length === 0) return false;
    const activeStudents = students.filter(
      (s) => s.status === "Active" || !s.status,
    );
    if (activeStudents.length === 0) return false;

    // Check if ALL active students have completed ALL subjects
    return activeStudents.every((student) => {
      let validCount = 0;
      subjects.forEach((subj) => {
        const termsCompleted = (subj.offeredTerms || [1, 2, 3, 4]).every(
          (t) => {
            const g = calculateGrade(student, subj, t as TermNumber);
            return g.hasData;
          },
        );
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

export function SectionStatsDisplay({
  sectionId,
  schoolYear,
  schoolCalendar,
}: {
  sectionId: string;
  schoolYear: string;
  schoolCalendar: any[];
}) {
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
    lateEnrolleesF: 0,
  });
  const [isYearEnd, setIsYearEnd] = useState(false);

  useEffect(() => {
    if (!schoolYear || !schoolCalendar || schoolCalendar.length === 0) return;

    // Determine if it's year end based on the calendar
    const entries = schoolCalendar.filter((c) => c.schoolYear === schoolYear);
    if (entries.length === 0) return;

    const monthOrder = [
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
      "January",
      "February",
      "March",
      "April",
      "May",
    ];

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
      const currentMonth = now.toLocaleString("en-US", { month: "long" });

      const currentMonthIdx = monthOrder.indexOf(currentMonth);
      const lastMonthIdx = monthOrder.indexOf(lastEntry.month);

      const lastTerm = lastEntry.term;
      const currentMonthEntry = entries.find(
        (e) =>
          e.month === currentMonth &&
          e.year.toString() === currentYear.toString(),
      );

      if (currentMonthEntry && currentMonthEntry.term === lastTerm) {
        setIsYearEnd(true);
      } else if (
        currentMonthIdx >= lastMonthIdx &&
        currentYear >= parseInt(lastEntry.year)
      ) {
        setIsYearEnd(true);
      } else {
        setIsYearEnd(false);
      }
    }
  }, [schoolYear, schoolCalendar]);

  useEffect(() => {
    const q = collection(db, `sections/${sectionId}/students`);
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => d.data() as Student);

        const retained = docs.filter((s) => s.status === "Retained");
        const promoted = docs.filter((s) => s.status === "Promoted");
        const transferredOut = docs.filter(
          (s) => s.status === "Transferred Out",
        );
        const droppedOut = docs.filter((s) => s.status === "Dropped Out");
        const transferredIn = docs.filter((s) => s.isTransferredIn);

        // Identify the first month of the school year and calculate all school days
        const syCal = schoolCalendar.filter((c) => c.schoolYear === schoolYear);
        const monthOrder = [
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
          "January",
          "February",
          "March",
          "April",
          "May",
        ];
        const sortedCal = [...syCal].sort(
          (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month),
        );

        // Calculate All School Days of the Year for 80% cut-off
        const yearDays: string[] = [];
        sortedCal.forEach((m) => {
          const monthIndex = MONTH_INDICES[m.month];
          const yearNum = parseInt(m.year);
          const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();

          const openingDate = parseInt(m.openingDate || "1");
          const closingDate = parseInt(m.closingDate || "31");
          const monthNum = (monthIndex + 1).toString().padStart(2, "0");

          for (let d = 1; d <= daysInMonth; d++) {
            if (d < openingDate || d > closingDate) continue;
            const date = new Date(yearNum, monthIndex, d);
            const dayOfWeek = date.getDay();
            const dateId = `${monthNum}-${d.toString().padStart(2, "0")}`;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday =
              PHILIPPINE_HOLIDAYS.includes(dateId) ||
              m.localHolidays?.includes(d);

            if (!isWeekend && !isHoliday) {
              yearDays.push(
                `${yearNum}-${monthNum}-${d.toString().padStart(2, "0")}`,
              );
            }
          }
        });

        const lateEnrollees = docs.filter((s) => {
          if (s.isTransferredIn || !s.dateOfFirstAttendance) return false;

          // 80% yearly cut-off logic
          if (yearDays.length === 0) return false;
          const firstAttendIndex = yearDays.findIndex(
            (d) => d >= s.dateOfFirstAttendance!,
          );
          if (firstAttendIndex === -1) return true;

          const remainingDays = yearDays.length - firstAttendIndex;
          return remainingDays / yearDays.length < 0.8;
        });

        setStats({
          retained: retained.length,
          retainedM: retained.filter((s) => s.sex === "Male").length,
          retainedF: retained.filter((s) => s.sex === "Female").length,
          promoted: promoted.length,
          promotedM: promoted.filter((s) => s.sex === "Male").length,
          promotedF: promoted.filter((s) => s.sex === "Female").length,
          transferredOut: transferredOut.length,
          transferredOutM: transferredOut.filter((s) => s.sex === "Male")
            .length,
          transferredOutF: transferredOut.filter((s) => s.sex === "Female")
            .length,
          droppedOut: droppedOut.length,
          droppedOutM: droppedOut.filter((s) => s.sex === "Male").length,
          droppedOutF: droppedOut.filter((s) => s.sex === "Female").length,
          transferredIn: transferredIn.length,
          transferredInM: transferredIn.filter((s) => s.sex === "Male").length,
          transferredInF: transferredIn.filter((s) => s.sex === "Female")
            .length,
          lateEnrollees: lateEnrollees.length,
          lateEnrolleesM: lateEnrollees.filter((s) => s.sex === "Male").length,
          lateEnrolleesF: lateEnrollees.filter((s) => s.sex === "Female")
            .length,
        });
      },
      (err) => {
        console.error("Error fetching section stats:", err);
      },
    );

    return unsubscribe;
  }, [sectionId, schoolCalendar, schoolYear]);

  return (
    <div className="w-full">
      {(isYearEnd || stats.retained > 0 || stats.promoted > 0) && (
        <div className="mt-5 pt-4 border-t border-slate-100 relative z-10 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={12} className="text-indigo-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Year-End Summary
            </span>
          </div>
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl hover:bg-emerald-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-sm font-black">P</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-emerald-900 leading-none">
                    Promoted
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tight mt-1">
                    Total learners promoted
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-emerald-700 leading-none">
                  {stats.promoted}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-[9px] font-bold text-slate-500">
                      M: {stats.promotedM}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    <span className="text-[9px] font-bold text-slate-500">
                      F: {stats.promotedF}
                    </span>
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
                  <span className="text-sm font-black text-indigo-900 leading-none">
                    Retained
                  </span>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tight mt-1">
                    Total learners retained
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-indigo-700 leading-none">
                  {stats.retained}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-[9px] font-bold text-slate-500">
                      M: {stats.retainedM}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    <span className="text-[9px] font-bold text-slate-500">
                      F: {stats.retainedF}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-xl border border-slate-100 group/stat">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1 group-hover/stat:text-rose-500 transition-colors">
            Trans. Out
          </span>
          <span className="text-sm font-black text-slate-700">
            {stats.transferredOut}
          </span>
          <div className="flex gap-2 mt-1 opacity-60 group-hover/stat:opacity-100 transition-opacity">
            <span className="text-[8px] font-bold text-blue-600">
              M:{stats.transferredOutM}
            </span>
            <span className="text-[8px] font-bold text-rose-600">
              F:{stats.transferredOutF}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-xl border border-slate-100 group/stat">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1 group-hover/stat:text-amber-500 transition-colors">
            Dropped
          </span>
          <span className="text-sm font-black text-slate-700">
            {stats.droppedOut}
          </span>
          <div className="flex gap-2 mt-1 opacity-60 group-hover/stat:opacity-100 transition-opacity">
            <span className="text-[8px] font-bold text-blue-600">
              M:{stats.droppedOutM}
            </span>
            <span className="text-[8px] font-bold text-rose-600">
              F:{stats.droppedOutF}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-xl border border-slate-100 group/stat">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1 group-hover/stat:text-indigo-500 transition-colors">
            Trans. In
          </span>
          <span className="text-sm font-black text-slate-700">
            {stats.transferredIn}
          </span>
          <div className="flex gap-2 mt-1 opacity-60 group-hover/stat:opacity-100 transition-opacity">
            <span className="text-[8px] font-bold text-blue-600">
              M:{stats.transferredInM}
            </span>
            <span className="text-[8px] font-bold text-rose-600">
              F:{stats.transferredInF}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-xl border border-slate-100 group/stat">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1 group-hover/stat:text-emerald-500 transition-colors text-center">
            Late Enr.
          </span>
          <span className="text-sm font-black text-slate-700">
            {stats.lateEnrollees}
          </span>
          <div className="flex gap-2 mt-1 opacity-60 group-hover/stat:opacity-100 transition-opacity">
            <span className="text-[8px] font-bold text-blue-600">
              M:{stats.lateEnrolleesM}
            </span>
            <span className="text-[8px] font-bold text-rose-600">
              F:{stats.lateEnrolleesF}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const transmuteGrade = (initial: number): number => {
  if (initial >= 99.5) return 100;
  if (initial >= 97.5) return 99;
  if (initial >= 96.0) return 98;
  if (initial >= 95.0) return 97;
  if (initial >= 94.0) return 96;
  if (initial >= 93.0) return 95;
  if (initial >= 92.0) return 94;
  if (initial >= 91.0) return 93;
  if (initial >= 90.0) return 92;
  if (initial >= 89.0) return 91;
  if (initial >= 88.0) return 90;
  if (initial >= 87.0) return 89;
  if (initial >= 86.0) return 88;
  if (initial >= 85.0) return 87;
  if (initial >= 84.0) return 86;
  if (initial >= 83.0) return 85;
  if (initial >= 82.0) return 84;
  if (initial >= 81.0) return 83;
  if (initial >= 80.0) return 82;
  if (initial >= 79.0) return 81;
  if (initial >= 78.0) return 80;
  if (initial >= 77.0) return 79;
  if (initial >= 76.0) return 78;
  if (initial >= 75.0) return 77;
  if (initial >= 73.0) return 76;
  if (initial >= 70.0) return 75;
  if (initial >= 68.0) return 74;
  if (initial >= 66.0) return 73;
  if (initial >= 64.0) return 72;
  if (initial >= 62.0) return 71;
  if (initial >= 60.0) return 70;
  if (initial >= 58.0) return 69;
  if (initial >= 56.0) return 68;
  if (initial >= 54.0) return 67;
  if (initial >= 52.0) return 66;
  if (initial >= 50.0) return 65;
  if (initial >= 48.0) return 64;
  if (initial >= 46.0) return 63;
  if (initial >= 43.0) return 62;
  if (initial >= 40.0) return 61;
  return 60;
};

const getDescriptiveGrade = (grade: number | string): string => {
  const numericGrade = typeof grade === "string" ? parseFloat(grade) : grade;
  if (isNaN(numericGrade)) return "";
  if (numericGrade >= 90) return "Advancing";
  if (numericGrade >= 80) return "Benchmarking";
  if (numericGrade >= 75) return "Connecting";
  if (numericGrade >= 65) return "Developing";
  return "Emerging";
};

const getDescriptiveRemark = (grade: number | string): string => {
  const numericGrade = typeof grade === "string" ? parseFloat(grade) : grade;
  if (isNaN(numericGrade)) return "";
  if (numericGrade >= 90) return "Advancing";
  if (numericGrade >= 80) return "Benchmarking";
  if (numericGrade >= 75) return "Connecting";
  if (numericGrade >= 65) return "Developing";
  return "Emerging";
};

export const computeBMI = (weightKg: number, heightCm: number) => {
  if (!weightKg || !heightCm) return { bmi: 0, category: "N/A" };
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let category = "Normal";
  if (bmi < 18.5) category = "Wasted";
  else if (bmi >= 25 && bmi < 30) category = "Overweight";
  else if (bmi >= 30) category = "Obese";
  return { bmi: parseFloat(bmi.toFixed(1)), category };
};

const calculateGrade = (
  student: Student,
  subject: Subject,
  term: TermNumber,
) => {
  const data =
    student.grades?.[subject.id]?.[term] ||
    JSON.parse(JSON.stringify(DEFAULT_TERM_DATA));

  if (data.manualFinalGrade && data.manualFinalGrade > 0) {
    return {
      ww: { total: 0, ps: 0, ws: 0, max: 0 },
      pt: { total: 0, ps: 0, ws: 0, max: 0 },
      ta: { total: 0, ps: 0, ws: 0, max: 0 },
      initial: data.manualFinalGrade,
      final: data.manualFinalGrade,
      hasData: true,
    };
  }

  const calc = (cat: string, weight: number) => {
    const component = (data[cat as keyof typeof data] || {
      scores: [],
      maxScores: [],
    }) as any;
    const total = (component.scores || []).reduce(
      (a: number, b: any) => a + (Number(b) || 0),
      0,
    );
    const max = (component.maxScores || []).reduce(
      (a: number, b: any) => a + (Number(b) || 0),
      0,
    );
    const ps = max === 0 ? 0 : (total / max) * 100;
    const ws = ps * (weight / 100);
    return { total, ps, ws, max };
  };

  const ww = calc("writtenWorks", subject.wwWeight);
  const pt = calc("performanceTasks", subject.ptWeight);

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
  const taPs = totalActiveWeight === 0 ? 0 : weightedPsSum / totalActiveWeight;
  const taWs = taPs * (subject.taWeight / 100);

  const rawGrade = ww.ws + pt.ws + taWs;
  const transmutedGrade = transmuteGrade(rawGrade);
  const computedFinal = subject.isZeroBasedGrading
    ? Math.round(rawGrade)
    : transmutedGrade;
  const hasData = ww.max > 0 || pt.max > 0 || taMax > 0;

  return {
    ww,
    pt,
    ta: { total: taTotal, ps: taPs, ws: taWs, max: taMax },
    initial: rawGrade,
    final: hasData ? computedFinal : 0,
    hasData,
  };
};

const PHILIPPINE_HOLIDAYS = [
  "01-01",
  "04-09",
  "05-01",
  "06-12",
  "08-21",
  "11-01",
  "11-30",
  "12-25",
  "12-30",
];

const MONTH_INDICES: { [key: string]: number } = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

export async function fetchSubjectsForSection(
  secId: string,
  gradeLevel: number,
  globalIds: string[] = [],
  globalSubjectsList: Subject[] = [],
) {
  try {
    const { collection } = await import("firebase/firestore");
    const secSubjectsSnap = await getDocs(
      collection(db, `sections/${secId}/subjects`),
    );
    const secSubjs = secSubjectsSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Subject,
    );

    const matchedGlobals = globalSubjectsList.filter(
      (s) =>
        Number(s.gradeLevel) === Number(gradeLevel) || globalIds.includes(s.id),
    );

    return [...matchedGlobals, ...secSubjs];
  } catch (error) {
    console.error(
      "Error fetching subjects dynamically in global helper:",
      error,
    );
    return globalSubjectsList.filter(
      (s) =>
        Number(s.gradeLevel) === Number(gradeLevel) || globalIds.includes(s.id),
    );
  }
}

const compressImage = (
  dataUrl: string,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.75,
): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:")) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
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

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);

        // Detect original MIME type from data URL to check for transparent formats (PNG, WebP, GIF)
        const match = dataUrl.match(/^data:([^;]+);/);
        const originalMime = match ? match[1] : "";
        const isTransparentFormat =
          originalMime === "image/png" ||
          originalMime === "image/webp" ||
          originalMime === "image/gif";

        if (isTransparentFormat) {
          // Keep transparent background by exporting to PNG
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(canvas.toDataURL("image/jpeg", quality));
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
  const setSections = React.useCallback(
    (val: Section[] | ((prev: Section[]) => Section[])) => {
      const sortFn = (list: Section[]) => {
        return [...list].sort((a, b) => {
          const valA = Number(a.gradeLevel) || 0;
          const valB = Number(b.gradeLevel) || 0;
          if (valA !== valB) {
            return valA - valB;
          }
          return (a.name || "").localeCompare(b.name || "");
        });
      };
      if (typeof val === "function") {
        setSectionsRaw((prev) => sortFn(val(prev)));
      } else {
        setSectionsRaw(sortFn(val));
      }
    },
    [],
  );
  const [expiredSchoolIds, setExpiredSchoolIds] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedAralClassId, setSelectedAralClassId] = useState<string | null>(
    null,
  );
  const [schoolCalendar, setSchoolCalendar] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [isAuthorizedCashier, setIsAuthorizedCashier] = useState(false);
  const [confirmYearEndUnfinalize, setConfirmYearEndUnfinalize] =
    useState(false);
  const [confirmFinalizeSection, setConfirmFinalizeSection] = useState(false);

  // ARAL Master Data States
  const [aralSchoolInfo, setAralSchoolInfo] = useState<AralSchoolInfo>(() => {
    try {
      const saved = localStorage.getItem("aral_v2_school_info");
      return saved ? JSON.parse(saved) : DEFAULT_SCHOOL_INFO;
    } catch {
      return DEFAULT_SCHOOL_INFO;
    }
  });

  const [aralCompetencies, setAralCompetencies] = useState<AralCompetency[]>(
    () => {
      try {
        const saved = localStorage.getItem("aral_v2_competencies");
        return saved ? JSON.parse(saved) : DEFAULT_COMPETENCIES;
      } catch {
        return DEFAULT_COMPETENCIES;
      }
    },
  );

  const [isMasterDataOpen, setIsMasterDataOpen] = useState(true);

  // Helper for per-user storage key
  const activeUserId =
    currentUser?.uid ||
    userProfile?.uid ||
    (userProfile?.email ? userProfile.email.toLowerCase().trim() : null);

  // System Theme Settings State & Live Dynamic Engine (Per-User Preferences)
  const [systemThemeSettings, setSystemThemeSettings] =
    useState<SystemThemeSettings>(() => {
      try {
        const saved = activeUserId
          ? localStorage.getItem(
              `class_enterprise_system_theme_${activeUserId}`,
            )
          : null;
        if (saved) return JSON.parse(saved);
        const legacySaved = localStorage.getItem(
          "class_enterprise_system_theme",
        );
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
        const userKey = activeUserId
          ? `class_enterprise_system_theme_${activeUserId}`
          : "class_enterprise_system_theme_guest";
        const saved = localStorage.getItem(userKey);
        if (saved) {
          setSystemThemeSettings(JSON.parse(saved));
        } else if (!activeUserId) {
          setSystemThemeSettings(DEFAULT_THEME_SETTINGS);
        }
      }
    } catch (err) {
      console.error("Error loading per-user theme:", err);
    }
  }, [activeUserId, userProfile?.themeSettings]);

  const handleUpdateThemeSettings = async (
    newSettings: SystemThemeSettings,
  ) => {
    setSystemThemeSettings(newSettings);
    if (
      userProfile &&
      userProfile.uid &&
      !userProfile.uid.startsWith("demo-")
    ) {
      try {
        await updateDoc(doc(db, "users", userProfile.uid), {
          themeSettings: newSettings,
        });
        setUserProfile((prev) =>
          prev ? { ...prev, themeSettings: newSettings } : null,
        );
      } catch (err) {
        console.error("Failed to save theme settings to firestore:", err);
      }
    }
  };

  useEffect(() => {
    try {
      const userKey = activeUserId
        ? `class_enterprise_system_theme_${activeUserId}`
        : "class_enterprise_system_theme_guest";
      localStorage.setItem(userKey, JSON.stringify(systemThemeSettings));
    } catch (err) {
      console.error("Failed to save system theme settings:", err);
    }

    const root = document.documentElement;
    if (systemThemeSettings.mode === "dark") {
      root.classList.add("dark");
    } else if (systemThemeSettings.mode === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    root.setAttribute("data-theme-color", systemThemeSettings.color);
    root.setAttribute("data-theme-density", systemThemeSettings.density);
    root.setAttribute("data-theme-font", systemThemeSettings.font);
    root.setAttribute("data-theme-radius", systemThemeSettings.radius);
  }, [systemThemeSettings, activeUserId]);

  const mapUserRoleToAralRole = (role?: string, email?: string): AralRole => {
    if (
      email &&
      aralSchoolInfo?.coordinatorEmails?.some(
        (e) => e.trim().toLowerCase() === email.trim().toLowerCase(),
      )
    ) {
      return "ARAL Coordinator";
    }
    if (!role) return "Teacher";
    switch (role) {
      case "system_admin":
      case "admin":
      case "school_head":
        return "ARAL Coordinator";
      case "teacher":
        return "Teacher";
      default:
        return "Teacher";
    }
  };

  const handleUpdateAralSchool = (info: AralSchoolInfo) => {
    setAralSchoolInfo(info);
    localStorage.setItem("aral_v2_school_info", JSON.stringify(info));
  };

  const handleAddAralCompetency = (comp: AralCompetency) => {
    const updated = [...aralCompetencies, comp];
    setAralCompetencies(updated);
    localStorage.setItem("aral_v2_competencies", JSON.stringify(updated));
  };

  const handleDeleteAralCompetency = (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this learning competency?",
      )
    ) {
      const updated = aralCompetencies.filter((c) => c.id !== id);
      setAralCompetencies(updated);
      localStorage.setItem("aral_v2_competencies", JSON.stringify(updated));
    }
  };

  const handleCreateAralClass = async (
    gradeLevelNum: number,
    name: string,
    tutorName: string,
    tutorEmail: string,
    studentIds: string[],
    targetSubject?: string,
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
        targetSubject: targetSubject || "Mathematics & Reading",
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
    gradeLevel?: number,
  ) => {
    try {
      const docRef = doc(db, "aral_classes", classId);
      const updateData: any = {
        adviserName: tutorName,
        adviserEmail: tutorEmail,
        studentIds: studentIds,
        targetSubject: targetSubject || "Mathematics & Reading",
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
    if (userProfile.role === "admin" || userProfile.role === "system_admin") {
      setIsAuthorizedCashier(true);
      return;
    }
    const unsub = onSnapshot(
      query(
        collection(db, "settings"),
        where("id", "==", `pta_config_${userProfile.schoolId}`),
      ),
      (snap) => {
        if (!snap.empty) {
          const configData = snap.docs[0].data();
          const emails = configData.cashierEmails || [];
          setIsAuthorizedCashier(
            emails
              .map((e: string) => e.toLowerCase())
              .includes(currentUser.email?.toLowerCase() || ""),
          );
        } else {
          setIsAuthorizedCashier(false);
        }
      },
      (err) => {
        console.error("Error loading cashier settings:", err);
      },
    );
    return unsub;
  }, [currentUser, userProfile]);

  // Run once-per-app-session database cleanup to clear defaulted JHS section subjects where adviser was assigned by default
  useEffect(() => {
    if (!currentUser || !currentUser.email || !userProfile) return;

    const hasRun = localStorage.getItem("jhs_tle_teacher_cleanup_v2");
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

          const adviserEmailNorm = (sec.adviserEmail || "")
            .trim()
            .toLowerCase();

          // Get the subjects sub-collection
          const subsSnap = await getDocs(
            collection(db, "sections", sec.id, "subjects"),
          );
          for (const subDoc of subsSnap.docs) {
            const sub = subDoc.data();
            const teacherEmailNorm = (sub.teacherEmail || "")
              .trim()
              .toLowerCase();

            // Clear defaulted adviser email from CORE or TLE subjects
            if (adviserEmailNorm && teacherEmailNorm === adviserEmailNorm) {
              await updateDoc(
                doc(db, "sections", sec.id, "subjects", subDoc.id),
                {
                  teacherEmail: "",
                },
              );
              clearedCount++;
            }
          }
        }
        console.log(
          `Database JHS sections teacher cleanup finished. Cleared ${clearedCount} default assignments.`,
        );
        localStorage.setItem("jhs_tle_teacher_cleanup_v2", "true");
      } catch (err: any) {
        console.warn(
          "Note: Automatic JHS sections teacher cleanup did not complete entirely:",
          err.message || err,
        );
      }
    };

    runCleanup();
  }, [currentUser, userProfile]);

  useEffect(() => {
    if (!currentUser) {
      setGlobalSettings(null);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "settings", "general"),
      (docSnap) => {
        if (docSnap.exists()) {
          setGlobalSettings(docSnap.data());
        } else {
          setGlobalSettings({ schoolYears: [], activeSchoolYear: null });
        }
      },
      (err) => {
        handleFirestoreError(err, "get", "settings/general");
      },
    );
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setSchoolCalendar([]);
      return;
    }
    const q = query(collection(db, "school_calendar"), orderBy("year", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setSchoolCalendar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        handleFirestoreError(error, "list", "school_calendar");
      },
    );
    return () => unsub();
  }, [currentUser]);

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sectionSubjects, setSectionSubjects] = useState<Subject[]>([]);
  const [globalSubjects, setGlobalSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, "global_subjects"), (snap) => {
      setGlobalSubjects(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Subject),
      );
    });
    return () => unsub();
  }, [currentUser]);
  const [activeSchool, setActiveSchool] = useState<School | null>(null);
  const [teacherCount, setTeacherCount] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "gradebook"
    | "enroll"
    | "subjects"
    | "summary"
    | "guide"
    | "sys-docs"
    | "attendance"
    | "sf2"
    | "observed-values"
    | "sf10"
    | "transfers"
    | "sf8"
    | "sf4"
    | "sf7"
    | "anecdotes"
    | "pta"
    | "tle-dashboard"
    | "mysql"
  >("dashboard");
  const [ptaInitialTab, setPtaInitialTab] = useState<
    "collection" | "setup" | "reports" | "audit"
  >("collection");
  const [preselectedStudentForAnecdotal, setPreselectedStudentForAnecdotal] =
    useState<Student | null>(null);
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
  const [studentViewMatched, setStudentViewMatched] = useState<{
    student: Student;
    section: Section;
  } | null>(null);
  const [allStudentEnrollments, setAllStudentEnrollments] = useState<
    { student: Student; section: Section }[]
  >([]);
  const [noApprovedAdminFound, setNoApprovedAdminFound] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null,
  );
  const [combinedTleStudents, setCombinedTleStudents] = useState<Student[]>([]);
  const [selectedStudentForReport, setSelectedStudentForReport] =
    useState<Student | null>(null);
  const [selectedStudentForBlankReport, setSelectedStudentForBlankReport] =
    useState<Student | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    student: Student;
    newStatus:
      "Active" | "Transferred Out" | "Dropped Out" | "Retained" | "Promoted";
  } | null>(null);
  const [statusChangeDate, setStatusChangeDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [statusChangeReason, setStatusChangeReason] = useState("");

  const [scanLogs, setScanLogs] = useState<AttendanceScanLog[]>([]);
  const [showGlobalScanner, setShowGlobalScanner] = useState(false);
  const [isScannerFullScreen, setIsScannerFullScreen] = useState(false);
  const [globalScannerFacingMode, setGlobalScannerFacingMode] = useState<
    "user" | "environment"
  >("environment");
  const [globalRecentScan, setGlobalRecentScan] = useState<{
    status: "success" | "error";
    message: string;
    student?: Student | null;
    section?: Section | null;
    scanType?: "IN" | "OUT";
    scanTime?: string;
  } | null>(null);
  const [globalScannerError, setGlobalScannerError] = useState<string | null>(
    null,
  );
  const [globalManualLrnInput, setGlobalManualLrnInput] = useState("");
  const [scannerViewMode, setScannerViewMode] = useState<
    "scanner" | "all_logs"
  >("scanner");
  const [allLogsSearchQuery, setAllLogsSearchQuery] = useState("");

  const openGlobalScanner = useCallback(() => {
    setIsScannerFullScreen(false);
    setShowGlobalScanner(true);
    setGlobalRecentScan(null);
    setGlobalScannerError(null);
  }, []);

  // Sync scan logs from Firestore
  useEffect(() => {
    if (!db || !currentUser) return;
    const q = query(collection(db, "attendance_scan_logs"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const logs: AttendanceScanLog[] = [];
        snapshot.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...docSnap.data() } as AttendanceScanLog);
        });
        logs.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        setScanLogs(logs);
      },
      (err) => {
        console.error("Error fetching attendance_scan_logs:", err);
        handleFirestoreError(err, "list", "attendance_scan_logs");
      },
    );
    return () => unsub();
  }, [currentUser]);

  const handleAddScanLog = async (logData: Omit<AttendanceScanLog, "id">) => {
    try {
      const docRef = doc(collection(db, "attendance_scan_logs"));
      const newLog: AttendanceScanLog = {
        id: docRef.id,
        ...logData,
      };
      await setDoc(docRef, newLog);
    } catch (err) {
      console.error("Error saving scan log:", err);
      handleFirestoreError(err, "write", "attendance_scan_logs");
    }
  };

  const handleDeleteScanLog = async (logId: string) => {
    try {
      await deleteDoc(doc(db, "attendance_scan_logs", logId));
    } catch (err) {
      console.error("Error deleting scan log:", err);
      handleFirestoreError(err, "delete", `attendance_scan_logs/${logId}`);
    }
  };

  const handleClearScanLogs = async (logIds?: string[]) => {
    try {
      if (logIds && logIds.length > 0) {
        const batchOps = logIds.map((id) =>
          deleteDoc(doc(db, "attendance_scan_logs", id)),
        );
        await Promise.all(batchOps);
      } else {
        const snap = await getDocs(collection(db, "attendance_scan_logs"));
        const batchOps = snap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(batchOps);
      }
    } catch (err) {
      console.error("Error clearing scan logs:", err);
      handleFirestoreError(err, "delete", "attendance_scan_logs");
    }
  };

  const globalScannerConstraints = useMemo(
    () => ({
      facingMode: globalScannerFacingMode,
    }),
    [globalScannerFacingMode],
  );

  const globalScannerComponents = useMemo(
    () => ({
      audio: false,
      finder: true,
    }),
    [],
  );

  const handleGlobalScan = async (scannedLrn: string) => {
    if (!scannedLrn) return;

    let targetSection = selectedSection;
    let student = students.find((s) => s.lrn === scannedLrn);

    if (!targetSection) {
      // Find the student across all sections of active school year
      try {
        const q = query(
          collectionGroup(db, "students"),
          where("lrn", "==", scannedLrn),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const pathParts = docSnap.ref.path.split("/");
          const sectionId = pathParts[1];
          const sect = sections.find((s) => s.id === sectionId);
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
        status: "error",
        message: targetSection
          ? `LRN "${scannedLrn}" was not found in the selected section (${targetSection.name}).`
          : `LRN "${scannedLrn}" was not found in any registered section.`,
        student: null,
        section: null,
      });
      return;
    }

    // Now, check for today's validity
    const today = new Date();
    const currentYear = today.getFullYear();
    const JS_MONTHS = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const currentMonthStr = JS_MONTHS[today.getMonth()];
    const currentDay = today.getDate();

    const monthVal = String(today.getMonth() + 1).padStart(2, "0");
    const dayVal = String(today.getDate()).padStart(2, "0");
    const scanDate = `${currentYear}-${monthVal}-${dayVal}`;
    const scanTime = today.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Determine scanType (IN vs OUT)
    const studentTodayLogs = scanLogs
      .filter(
        (l) =>
          l.scanDate === scanDate &&
          (l.studentId === student.id || l.lrn === student.lrn),
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    let scanType: "IN" | "OUT" = "IN";
    if (studentTodayLogs.length > 0) {
      const lastLog = studentTodayLogs[studentTodayLogs.length - 1];
      scanType = lastLog.scanType === "IN" ? "OUT" : "IN";
    } else {
      scanType = "IN";
    }

    // Record scan log to database
    handleAddScanLog({
      studentId: student.id,
      studentName: formatStudentName(student),
      lrn: student.lrn || "",
      sectionId: targetSection.id,
      sectionName: targetSection.name,
      gradeLevel: targetSection.gradeLevel,
      schoolId: targetSection.schoolId || userProfile?.schoolId || "",
      schoolYear: targetSection.schoolYear || "",
      scanDate,
      scanTime,
      scanType,
      timestamp: today.toISOString(),
      scannedBy: currentUser?.email || "ID Scanner",
      status: "On Time",
    });

    // Reconstruct filtered calendar entries for this section's school year
    const sectionCal = schoolCalendar.filter(
      (c) => c.schoolYear === targetSection.schoolYear,
    );
    const monthOrder = [
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
      "January",
      "February",
      "March",
      "April",
      "May",
    ];
    const sortedCal = [...sectionCal].sort(
      (a, b) =>
        monthOrder.indexOf(a.month as string) -
        monthOrder.indexOf(b.month as string),
    );

    // Construct the calendar map
    const localCalendarMap: { [key: string]: any } = {};
    sortedCal.forEach((c) => {
      const term = (c.term || "1").toString();
      const month = c.month as string;
      const key = `${month}_${term}`;
      const year = parseInt(c.year);
      const openingDate = parseInt(c.openingDate || "1");
      const closingDate = parseInt(c.closingDate || "31");
      const localHolidays = c.localHolidays || [];
      const daysInMonth = new Date(
        year,
        (MONTH_INDICES[month] || 0) + 1,
        0,
      ).getDate();

      const allSchoolDays: number[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, MONTH_INDICES[month], d);
        const dayOfWeek = date.getDay();
        const dateStr = `${(MONTH_INDICES[month] + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = PHILIPPINE_HOLIDAYS.includes(dateStr);
        if (!isWeekend && !isHoliday) {
          allSchoolDays.push(d);
        }
      }

      const hasManualCoverage =
        openingDate !== 1 ||
        (closingDate !== 31 && closingDate !== daysInMonth);
      let validDays: number[] = [];

      if (hasManualCoverage) {
        validDays = allSchoolDays.filter(
          (d) => d >= openingDate && d <= closingDate,
        );
      } else {
        const allEntriesForMonth = sortedCal
          .filter((entry) => entry.month === month)
          .sort(
            (a, b) =>
              (parseInt(a.term || "1") || 1) - (parseInt(b.term || "1") || 1),
          );

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
        localHolidays,
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
    const isDayDisabled = (
      stud: Student,
      year: number,
      month: string,
      day: number,
    ) => {
      if (stud.dateOfFirstAttendance) {
        const [fYear, fMonth, fDay] = stud.dateOfFirstAttendance
          .split("-")
          .map(Number);
        const currentMonthIdx = MONTH_INDICES[month];
        if (year < fYear) return true;
        if (year === fYear) {
          if (currentMonthIdx < fMonth - 1) return true;
          if (currentMonthIdx === fMonth - 1 && day < fDay) return true;
        }
      }
      if (stud.status === "Dropped Out" || stud.status === "Transferred Out") {
        if (stud.dropoutDate) {
          const [dYear, dMonth, dDay] = stud.dropoutDate.split("-").map(Number);
          const currentMonthIdx = MONTH_INDICES[month];
          if (year > dYear) return true;
          if (year === dYear) {
            if (currentMonthIdx > dMonth - 1) return true;
            if (currentMonthIdx === dMonth - 1 && day >= dDay) return true;
          }
        }
      }
      return false;
    };

    const isDisabled = isDayDisabled(
      student,
      currentYear,
      currentMonthStr,
      currentDay,
    );
    if (isDisabled) {
      setGlobalRecentScan({
        status: "error",
        message: `${formatStudentName(student)} logged TIME ${scanType} at ${scanTime}, but is marked inactive/dropped out today.`,
        student,
        section: targetSection,
        scanType,
        scanTime,
      });
      return;
    }

    if (!termKeyToUpdate) {
      setGlobalRecentScan({
        status: "success",
        message: `${formatStudentName(student)} logged TIME ${scanType} at ${scanTime} (Section ${targetSection.name}). Note: Today (${currentMonthStr} ${currentDay}) is not a scheduled school day in calendar.`,
        student,
        section: targetSection,
        scanType,
        scanTime,
      });
      return;
    }

    // Attempt to update attendance
    try {
      const dailyAttendance = {
        ...(student.dailyAttendance || {}),
        [termKeyToUpdate]: {
          ...(student.dailyAttendance?.[termKeyToUpdate] || {}),
          [currentDay]: true,
        },
      };

      // Calculate monthly present count
      const monthDaily = dailyAttendance[termKeyToUpdate];
      let presentCount = 0;
      Object.values(monthDaily).forEach((val) => {
        if (val) presentCount++;
      });

      const calendarForMonth =
        schoolCalendar.find(
          (c) =>
            c.schoolYear === targetSection.schoolYear &&
            (`${c.month}_${c.term || "1"}` === termKeyToUpdate ||
              c.month === termKeyToUpdate),
        )?.days || 0;
      const absentCount = Math.max(0, calendarForMonth - presentCount);

      const attendance = {
        ...(student.attendance || {}),
        [termKeyToUpdate]: {
          present: presentCount,
          absent: absentCount,
        },
      };

      await setDoc(
        doc(db, `sections/${targetSection.id}/students`, student.id),
        {
          dailyAttendance,
          attendance,
        },
        { merge: true },
      );

      setGlobalRecentScan({
        status: "success",
        message: `${formatStudentName(student)} logged TIME ${scanType} at ${scanTime} (Section ${targetSection.name}).`,
        student,
        section: targetSection,
        scanType,
        scanTime,
      });
    } catch (err) {
      console.error(err);
      setGlobalRecentScan({
        status: "error",
        message: `Logged TIME ${scanType} at ${scanTime}, but failed to update daily matrix: ${err instanceof Error ? err.message : String(err)}`,
        student,
        section: targetSection,
        scanType,
        scanTime,
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

    if (err && typeof err === "object") {
      const errName = err.name || err.kind || "";
      const errMsgStr = (err.message || "").toLowerCase();

      const isPermissionDenied =
        errName === "NotAllowedError" ||
        errName === "PermissionDeniedError" ||
        errName === "permission-denied" ||
        errMsgStr.includes("not allowed") ||
        errMsgStr.includes("permission") ||
        errMsgStr.includes("denied") ||
        errMsgStr.includes("current context");

      if (isPermissionDenied) {
        errMsg =
          "Camera permission denied or blocked. If you are using this app inside the preview frame, please click 'Open in New Tab' at the top-right of the preview to allow camera access.";
      } else if (
        errName === "NotFoundError" ||
        errName === "DevicesNotFoundError" ||
        errName === "no-camera" ||
        errMsgStr.includes("notfound") ||
        errMsgStr.includes("no camera")
      ) {
        errMsg = "No camera device found.";
      } else if (
        errName === "OverconstrainedError" ||
        errName === "overconstrained"
      ) {
        errMsg =
          "Selected camera type is not available. Please try switching cameras.";
      } else if (err.message) {
        errMsg = err.message;
      }
    } else if (typeof err === "string") {
      const lowerErr = err.toLowerCase();
      if (
        lowerErr.includes("not allowed") ||
        lowerErr.includes("permission") ||
        lowerErr.includes("denied") ||
        lowerErr.includes("current context")
      ) {
        errMsg =
          "Camera permission denied or blocked. If you are using this app inside the preview frame, please click 'Open in New Tab' at the top-right of the preview to allow camera access.";
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
    termWeight: { written: 30, performance: 40, summative: 20, exam: 10 },
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
      type: "Elementary School Completer",
      genAvg: "",
      citation: "",
      elemSchoolName: "",
      elemSchoolId: "",
      elemSchoolAddress: "",
      peptRating: "",
      peptDate: "",
      alsRating: "",
      alsCenterInfo: "",
      othersSpecify: "",
    } as Eligibility,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTerm, setActiveTerm] = useState<TermNumber>(1);

  useEffect(() => {
    if (
      userProfile &&
      userProfile.role !== "system_admin" &&
      userProfile.role !== "admin" &&
      userProfile.approvalStatus !== "approved" &&
      userProfile.email !== "jessiemangabo@gmail.com"
    ) {
      const q = query(
        collection(db, "users"),
        where("role", "==", "system_admin"),
        where("schoolId", "==", userProfile.schoolId),
        where("approvalStatus", "==", "approved"),
        limit(1),
      );
      getDocs(q)
        .then((snap) => {
          setNoApprovedAdminFound(snap.empty);
        })
        .catch((err) => {
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
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          setActiveSchool({ id: docSnap.id, ...docSnap.data() } as School);
        } else {
          setActiveSchool(null);
        }
      },
      (err) => {
        console.error("Error listening to active school:", err);
      },
    );
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
      where("schoolId", "==", sId),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTeacherCount(snap.size);
      },
      (err) => {
        console.error("Error listening to teachers count:", err);
      },
    );
    return () => unsub();
  }, [userProfile?.schoolId]);

  const isAnySectionAdviser = useMemo(() => {
    if (!userProfile || userProfile.role !== "teacher") return false;
    const authEmail = (currentUser?.email || "").trim().toLowerCase();
    const profileEmail = (userProfile?.email || "").trim().toLowerCase();
    const uid = currentUser?.uid || "";
    return sections.some((s) => {
      const advEmail = (s.adviserEmail || "").trim().toLowerCase();
      return (
        (advEmail && (advEmail === authEmail || advEmail === profileEmail)) ||
        (uid && s.createdBy === uid)
      );
    });
  }, [currentUser, userProfile, sections]);

  const isSectionAdviser = useMemo(() => {
    if (!selectedSection) return false;
    const authEmail = (currentUser?.email || "").trim().toLowerCase();
    const profileEmail = (userProfile?.email || "").trim().toLowerCase();
    const adviserEmailStr = (selectedSection.adviserEmail || "")
      .trim()
      .toLowerCase();
    const isAdviser =
      adviserEmailStr &&
      (adviserEmailStr === authEmail || adviserEmailStr === profileEmail);
    return !!isAdviser;
  }, [currentUser, userProfile, selectedSection]);

  const isEntireSchoolFinalized = useMemo(() => {
    const activeYear = globalSettings?.activeSchoolYear;
    if (!activeYear) return false;
    const activeSections = sections.filter((s) => s.schoolYear === activeYear);
    if (activeSections.length === 0) return false;
    return activeSections.every((s) => s.isFinalized);
  }, [sections, globalSettings?.activeSchoolYear]);

  const editableSubjects = useMemo(() => {
    const email = (currentUser?.email || userProfile?.email || "")
      .trim()
      .toLowerCase();
    if (!email) return [];
    return subjects.filter((sub) => {
      const subjEmail = (sub.teacherEmail || "").trim().toLowerCase();
      return subjEmail === email;
    });
  }, [subjects, currentUser, userProfile]);

  const globalNumTerms = useMemo(() => {
    if (!schoolCalendar || schoolCalendar.length === 0) return 4;
    const terms = schoolCalendar.map((c) => parseInt(c.term) || 0);
    return Math.max(...terms, 4);
  }, [schoolCalendar]);

  const activeTermsInfo = useMemo(() => {
    const years = Array.from(
      new Set(schoolCalendar.map((c) => c.schoolYear).filter(Boolean)),
    ) as string[];
    const latest = years.sort((a, b) => b.localeCompare(a))[0] || "";
    const filtered = schoolCalendar.filter((c) => c.schoolYear === latest);
    const terms = Array.from(
      new Set(filtered.map((c) => (c.term || "1").toString())),
    ).sort();

    return terms.map((term) => {
      const termEntries = filtered.filter(
        (c) => (c.term || "1").toString() === term,
      );
      const totalDays = termEntries.reduce(
        (sum, c) => sum + (parseInt(c.days) || 0),
        0,
      );
      return { term, days: totalDays, schoolYear: latest };
    });
  }, [schoolCalendar]);

  const hasCalendarMatch = useMemo(() => {
    if (!globalSettings?.activeSchoolYear) return false;
    if (
      !schoolCalendar ||
      schoolCalendar.length === 0 ||
      !selectedSection?.schoolYear
    )
      return false;
    return schoolCalendar.some(
      (c) => c.schoolYear === selectedSection.schoolYear,
    );
  }, [
    schoolCalendar,
    selectedSection?.schoolYear,
    globalSettings?.activeSchoolYear,
  ]);

  // Pending Users Listener
  useEffect(() => {
    if (
      !currentUser ||
      !userProfile ||
      (userProfile.role !== "admin" &&
        userProfile.role !== "system_admin" &&
        !isAnySectionAdviser)
    ) {
      setPendingUsersCount(0);
      return;
    }

    let q;
    if (userProfile.role === "admin") {
      q = query(
        collection(db, "users"),
        where("approvalStatus", "==", "pending"),
      );
    } else if (userProfile.role === "system_admin") {
      q = query(
        collection(db, "users"),
        where("approvalStatus", "==", "pending"),
        where("schoolId", "==", userProfile.schoolId),
      );
    } else {
      // For section advisers (teachers), only show pending students in their school
      q = query(
        collection(db, "users"),
        where("approvalStatus", "==", "pending"),
        where("role", "==", "student"),
        where("schoolId", "==", userProfile.schoolId),
      );
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        setPendingUsersCount(snap.docs.length);
      },
      (error) => {
        handleFirestoreError(error, "list", "users");
      },
    );

    return () => unsub();
  }, [currentUser, userProfile, isAnySectionAdviser]);

  // Auth Listener
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          setCurrentUser(user);
          if (user) {
            try {
              const userDoc = await getDoc(doc(db, "users", user.uid));
              if (userDoc.exists()) {
                const profile = userDoc.data() as UserProfile;
                let updatedProfile = { ...profile };
                let syncNeeded = false;

                // Sync name from Google Auth if it was changed
                if (
                  user.displayName &&
                  profile.displayName !== user.displayName
                ) {
                  updatedProfile.displayName = user.displayName;
                  syncNeeded = true;
                }

                // Bootstrap Admin
                if (
                  user.email === "jessiemangabo@gmail.com" &&
                  (profile.role !== "admin" ||
                    profile.approvalStatus !== "approved")
                ) {
                  updatedProfile = {
                    ...updatedProfile,
                    role: "admin",
                    approvalStatus: "approved",
                  };
                  syncNeeded = true;
                }

                if (syncNeeded) {
                  await setDoc(doc(db, "users", user.uid), updatedProfile, {
                    merge: true,
                  });
                  setUserProfile(updatedProfile);
                } else {
                  setUserProfile(profile);
                }

                if (updatedProfile.role === "student") {
                  // Look for student in all sections
                  const identifiers: { val: string; type: "email" | "lrn" }[] =
                    [];
                  if (updatedProfile.email)
                    identifiers.push({
                      val: updatedProfile.email,
                      type: "email",
                    });
                  if (updatedProfile.lrn)
                    identifiers.push({ val: updatedProfile.lrn, type: "lrn" });

                  if (identifiers.length > 0) {
                    await findStudentEnrollments(identifiers);
                  }
                }
              } else {
                // Check if this is the bootstrap admin
                const isAdmin = user.email === "jessiemangabo@gmail.com";
                const newProfile: UserProfile = {
                  uid: user.uid,
                  email: user.email || "",
                  role: isAdmin ? "admin" : "teacher",
                  displayName: user.displayName || "",
                  approvalStatus: isAdmin ? "approved" : "pending",
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
        },
        (error) => {
          console.error("Auth state change error:", error);
          setAuthLoading(false);
        },
      );
      return unsubscribe;
    } catch (error) {
      console.error("Auth Listener Error:", error);
      setAuthLoading(false);
    }
  }, []);

  const findStudentEnrollments = async (
    identifiers: { val: string; type: "email" | "lrn" }[],
  ): Promise<boolean> => {
    try {
      const sectionsSnap = await getDocs(collection(db, "sections"));
      const matchesMap = new Map<
        string,
        { student: Student; section: Section }
      >();

      for (const sectionDoc of sectionsSnap.docs) {
        for (const idObj of identifiers) {
          const studentQuery = query(
            collection(db, `sections/${sectionDoc.id}/students`),
            where(idObj.type, "==", idObj.val),
          );
          const studentSnap = await getDocs(studentQuery);
          studentSnap.forEach((sDoc) => {
            const combinedId = `${sectionDoc.id}_${sDoc.id}`;
            if (!matchesMap.has(combinedId)) {
              matchesMap.set(combinedId, {
                student: { id: sDoc.id, ...sDoc.data() } as Student,
                section: { id: sectionDoc.id, ...sectionDoc.data() } as Section,
              });
            }
          });
        }
      }

      const matches = Array.from(matchesMap.values());

      if (matches.length > 0) {
        // Persist LRN to user profile for security rules affinity if we have a match
        const firstWithLrn = matches.find((m) => m.student.lrn) || matches[0];
        if (userProfile && !userProfile.lrn && firstWithLrn.student.lrn) {
          try {
            await updateDoc(doc(db, "users", currentUser!.uid), {
              lrn: firstWithLrn.student.lrn,
            });
            setUserProfile({ ...userProfile, lrn: firstWithLrn.student.lrn });
          } catch (err) {
            console.error("Failed to persist LRN:", err);
          }
        }

        const sorted = [...matches].sort((a, b) =>
          (b.section.schoolYear || "").localeCompare(
            a.section.schoolYear || "",
          ),
        );
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

    if (userProfile.role === "admin") {
      q = query(collection(db, "sections"));
    } else if (
      userProfile.role === "system_admin" ||
      userProfile.role === "school_head" ||
      userProfile.role === "guidance_designate"
    ) {
      const userEmail = (currentUser.email || "").toLowerCase();
      q = query(
        collection(db, "sections"),
        or(
          where("schoolId", "==", userProfile.schoolId || ""),
          where("adviserEmail", "==", userEmail),
        ),
      );
    }

    if (
      userProfile.role === "admin" ||
      userProfile.role === "system_admin" ||
      userProfile.role === "school_head" ||
      userProfile.role === "guidance_designate"
    ) {
      unsubscribeSections = onSnapshot(
        q!,
        (snapshot) => {
          if (!isSubscribed) return;
          setSections(
            snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Section),
          );
        },
        (err) => {
          handleFirestoreError(err, "list", "sections");
        },
      );
    } else if (userProfile.role === "teacher") {
      const userEmailLower = (currentUser.email || "").toLowerCase();
      // 1. Get all sections for their school to check subjectTeachers dynamically
      const baseQuery = userProfile.schoolId
        ? query(
            collection(db, "sections"),
            where("schoolId", "==", userProfile.schoolId),
          )
        : query(collection(db, "sections"));

      const processSections = async (snapshotDocs: any[]) => {
        try {
          const allSections = snapshotDocs.map(
            (d) => ({ id: d.id, ...d.data() }) as Section,
          );
          let subDocs: any[] = [];

          if (userEmailLower) {
            const subjectsQuery = query(
              collectionGroup(db, "subjects"),
              where("teacherEmail", "==", userEmailLower),
            );
            const subjectsSnap = await getDocs(subjectsQuery).catch(() => ({
              docs: [],
            }));
            subDocs = subjectsSnap.docs;
          }

          const teacherSections: Section[] = [];

          for (const sec of allSections) {
            let isRelevant = false;
            const teacherSubjectNames = new Set<string>();

            // Check custom subjects via collectionGroup
            for (const subjDoc of subDocs) {
              const pathParts = subjDoc.ref.path.split("/");
              const sectionId = pathParts[1];
              if (sectionId === sec.id) {
                isRelevant = true;
                teacherSubjectNames.add((subjDoc.data() as Subject).name);
              }
            }

            // Check global subjects via subjectTeachers map
            if (sec.subjectTeachers) {
              for (const [subjId, tEmail] of Object.entries(
                sec.subjectTeachers,
              )) {
                if (
                  tEmail &&
                  typeof tEmail === "string" &&
                  tEmail.toLowerCase() === userEmailLower
                ) {
                  isRelevant = true;
                  const gSubj = globalSubjects.find((g) => g.id === subjId);
                  if (gSubj) {
                    teacherSubjectNames.add(gSubj.name);
                  }
                }
              }
            }

            if ((sec.adviserEmail || "").toLowerCase() === userEmailLower) {
              isRelevant = true;
            }

            if (isRelevant) {
              teacherSections.push({
                ...sec,
                teacherSubjects: Array.from(teacherSubjectNames),
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

      const unsubBase = onSnapshot(
        baseQuery,
        (snap) => processSections(snap.docs),
        (err) => {
          handleFirestoreError(err, "list", "sections");
        },
      );

      let unsubSubjectsGroup = () => {};
      if (userEmailLower) {
        const subjectsQuery = query(
          collectionGroup(db, "subjects"),
          where("teacherEmail", "==", userEmailLower),
        );
        unsubSubjectsGroup = onSnapshot(
          subjectsQuery,
          async () => {
            const snap = await getDocs(baseQuery);
            processSections(snap.docs);
          },
          (err) => {
            handleFirestoreError(err, "list", "subjects");
          },
        );
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
      where("schoolId", "==", userProfile.schoolId),
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setAralClasses(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AralClass),
        );
      },
      (err) => {
        console.error("Failed to load aral classes", err);
      },
    );
    return () => unsub();
  }, [currentUser, userProfile?.schoolId]);

  // Students & Subjects Listener for Selected Section
  useEffect(() => {
    if (!selectedSection) {
      setStudents([]);
      if (
        userProfile?.role === "admin" ||
        userProfile?.role === "system_admin" ||
        userProfile?.role === "teacher"
      ) {
        // Fetch all subjects for the school (admin/system_admin) or the teacher (teacher) to show on section cards
        let q;
        if (
          userProfile.role === "admin" ||
          userProfile.role === "system_admin"
        ) {
          // Administrators view all subjects across the school
          q = query(collectionGroup(db, "subjects"));
        } else {
          // Teacher: Fetch subjects where they are the teacher
          q = query(
            collectionGroup(db, "subjects"),
            where("teacherEmail", "==", userProfile.email || ""),
          );
        }

        const unsub = onSnapshot(
          q,
          (snapshot) => {
            let list = snapshot.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Subject,
            );
            if (
              (userProfile?.role === "system_admin" ||
                userProfile?.role === "admin") &&
              userProfile.schoolId
            ) {
              const schoolSectionIds = new Set(sections.map((s) => s.id));
              list = list.filter((sub) => {
                return (
                  sub.schoolId === userProfile.schoolId ||
                  (sub.sectionId && schoolSectionIds.has(sub.sectionId))
                );
              });
            }
            setSubjects(list);
          },
          (err) => {
            console.error(
              "Error fetching all subjects for directory view:",
              err,
            );
          },
        );
        return () => unsub();
      } else {
        setSubjects([]);
      }
      return;
    }

    const studentsUnsub = onSnapshot(
      collection(db, `sections/${selectedSection.id}/students`),
      (snapshot) => {
        const list = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Student,
        );
        setStudents(list);

        // Sync studentViewMatched for student portal reactivity
        if (userProfile?.role === "student" && userProfile.lrn) {
          const me = list.find((s) => s.lrn === userProfile.lrn);
          if (me) {
            setStudentViewMatched((prev) =>
              prev ? { ...prev, student: me } : null,
            );
          }
        }
      },
      (err) =>
        handleFirestoreError(
          err,
          "list",
          `sections/${selectedSection.id}/students`,
        ),
    );

    const sectionSubjectsUnsub = onSnapshot(
      collection(db, `sections/${selectedSection.id}/subjects`),
      (snapshot) => {
        const list = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Subject,
        );
        setSectionSubjects(list);
      },
      (err) =>
        handleFirestoreError(
          err,
          "list",
          `sections/${selectedSection.id}/subjects`,
        ),
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
    const enrolledIds = new Set(
      students.flatMap((s) => s.enrolledSubjectIds || []),
    );

    // Map of section subjects by ID for overrides
    const secSubjMap = new Map();
    sectionSubjects.forEach((s) => secSubjMap.set(s.id, s));

    const list = [
      ...globalSubjects
        .filter(
          (s) =>
            Number(s.gradeLevel) === Number(selectedSection.gradeLevel) ||
            globalIds.includes(s.id) ||
            enrolledIds.has(s.id),
        )
        .map((s) => {
          const override = secSubjMap.get(s.id);
          if (override) {
            secSubjMap.delete(s.id); // Remove so it's not rendered twice
            return {
              ...s,
              ...override,
              sectionId: selectedSection.id,
              teacherEmail: secTeachers[s.id] || override.teacherEmail || "",
            };
          }
          return {
            ...s,
            sectionId: selectedSection.id,
            teacherEmail: secTeachers[s.id] || "",
          };
        }),
      ...Array.from(secSubjMap.values()).map((s) => ({
        ...s,
        teacherEmail: secTeachers[s.id] || s.teacherEmail,
      })),
    ];
    setSubjects(list as Subject[]);
  }, [selectedSection, globalSubjects, students, sectionSubjects]);

  useEffect(() => {
    if (!selectedSection) return;

    // Wait until subjects are loaded for the current selected section
    const subjectsForSection = subjects.filter(
      (s) => s.sectionId === selectedSection.id,
    );
    if (subjectsForSection.length === 0) return;

    if (subjects.length > 0) {
      // If a subject was selected (maybe via navigation or persistence), check if it exists in the section's subjects
      // We check against both ID and Name to support direct navigation from section cards
      const matchedSubject = subjects.find(
        (s) =>
          (selectedSubjectId && s.id === selectedSubjectId) ||
          (selectedSubjectId &&
            s.name === selectedSubjectId &&
            s.sectionId === selectedSection.id),
      );

      if (!selectedSubjectId || !matchedSubject) {
        const mySubjects = subjectsForSection.filter(
          (s) =>
            (s.teacherEmail || "").toLowerCase() ===
            (currentUser?.email || "").toLowerCase(),
        );
        if (mySubjects.length > 0 && userProfile?.role === "teacher") {
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
    if (activeTab !== "gradebook" && activeTab !== "summary") return;
    if (!selectedSection || !selectedSubjectId) {
      setCombinedTleStudents([]);
      return;
    }

    const isGrade910 =
      Number(selectedSection.gradeLevel) === 9 ||
      Number(selectedSection.gradeLevel) === 10;
    const matchedSubject = subjects.find(
      (s) => s.id === selectedSubjectId || s.name === selectedSubjectId,
    );
    const isTle = matchedSubject?.name?.toLowerCase().includes("tle") || false;
    const activeYear = globalSettings?.activeSchoolYear;

    if (isGrade910 && isTle && activeYear) {
      const qGroup = query(collectionGroup(db, "students"));
      const unsub = onSnapshot(qGroup, (snap) => {
        const list = snap.docs
          .map((d) => {
            const data = d.data() as Student;
            const refPath = d.ref.path.split("/");
            const secId = refPath[refPath.length - 3];
            const sec = sections.find((s) => s.id === secId);
            return {
              id: d.id,
              ...data,
              sectionId: secId,
              sectionName: sec
                ? `Grade ${sec.gradeLevel} - ${sec.name}`
                : data.sectionName,
            };
          })
          .filter((s) => {
            if (
              !s.enrolledSubjectIds ||
              !s.enrolledSubjectIds.includes(selectedSubjectId)
            )
              return false;
            const studentSection = sections.find(
              (sec) => sec.id === s.sectionId,
            );
            return studentSection && studentSection.schoolYear === activeYear;
          });
        setCombinedTleStudents(list);
      });
      return () => unsub();
    } else {
      setCombinedTleStudents([]);
    }
  }, [
    selectedSection?.id,
    selectedSubjectId,
    activeTab,
    subjects,
    globalSettings?.activeSchoolYear,
    sections,
  ]);

  // Persistence for dropdowns
  useEffect(() => {
    if (currentUser) {
      const savedSectionId = localStorage.getItem(
        `selectedSectionId_${currentUser.uid}`,
      );
      if (savedSectionId && sections.length > 0) {
        const section = sections.find((s) => s.id === savedSectionId);
        if (section) setSelectedSection(section);
      }

      const savedTerm = localStorage.getItem(`activeTerm_${currentUser.uid}`);
      if (savedTerm) setActiveTerm(parseInt(savedTerm) as TermNumber);

      const savedSubjectId = localStorage.getItem(
        `selectedSubjectId_${currentUser.uid}`,
      );
      if (savedSubjectId) setSelectedSubjectId(savedSubjectId);
    }
  }, [currentUser, sections.length]);

  useEffect(() => {
    if (currentUser && selectedSection) {
      localStorage.setItem(
        `selectedSectionId_${currentUser.uid}`,
        selectedSection.id,
      );
    }
  }, [selectedSection, currentUser]);

  useEffect(() => {
    if (currentUser && activeTerm) {
      localStorage.setItem(
        `activeTerm_${currentUser.uid}`,
        activeTerm.toString(),
      );
    }
  }, [activeTerm, currentUser]);

  useEffect(() => {
    if (currentUser && selectedSubjectId) {
      localStorage.setItem(
        `selectedSubjectId_${currentUser.uid}`,
        selectedSubjectId,
      );
    }
  }, [selectedSubjectId, currentUser]);

  // Reactivity for the selected section document itself
  useEffect(() => {
    if (!selectedSection?.id) return;

    const unsub = onSnapshot(
      doc(db, "sections", selectedSection.id),
      (snap) => {
        if (snap.exists()) {
          setSelectedSection({ id: snap.id, ...snap.data() } as Section);
        }
      },
      (err) => {
        handleFirestoreError(err, "get", `sections/${selectedSection.id}`);
      },
    );

    return () => unsub();
  }, [selectedSection?.id]);

  useEffect(() => {
    if (userProfile?.role === "admin") {
      const unsub = onSnapshot(
        collection(db, "schools"),
        (snap) => {
          const expiredIds: string[] = [];
          snap.forEach((d) => {
            const school = d.data();
            const now = new Date();
            const fallbackDate = new Date(
              school.createdAt || now.toISOString(),
            );
            fallbackDate.setFullYear(fallbackDate.getFullYear() + 1);
            const expirationDate = school.expiresAt
              ? new Date(school.expiresAt)
              : fallbackDate;
            if (expirationDate < now) {
              expiredIds.push(school.schoolId);
            }
          });
          setExpiredSchoolIds(expiredIds);
        },
        (err) => console.error("Admin schools snapshot error:", err),
      );
      return () => unsub();
    } else {
      setExpiredSchoolIds([]);
    }
  }, [userProfile?.role]);

  useEffect(() => {
    const isExpired = activeSchool?.expiresAt
      ? new Date(activeSchool.expiresAt) < new Date()
      : false;
    if (
      isExpired &&
      selectedSection !== null &&
      userProfile?.email !== "jessiemangabo@gmail.com"
    ) {
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
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/user-cancelled" ||
        error.code === "auth/cancelled-popup-request";
      if (isCancelled) {
        setLoginError(
          "Login popup was closed before signing in. Please try again.",
        );
      } else if (error.code === "auth/popup-blocked") {
        setLoginError(
          "Pop-up window was blocked by your browser. Please allow popups for this site or use Quick Access / Demo Login below.",
        );
      } else if (error.code === "auth/unauthorized-domain") {
        setLoginError(
          "This domain is not authorized for Google Sign-In in Firebase. You can use Quick Access / Demo Login below.",
        );
      } else {
        setLoginError(
          `Authentication failed: ${error.message || "Please check your connection and try again."}`,
        );
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = async (
    demoRole: "admin" | "system_admin" | "school_head" | "teacher" | "student",
  ) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      let email = "jessiemangabo@gmail.com";
      let name = "Dr. Jessie J. Mangabo (System Admin)";
      let uid = "demo-root-admin";
      let schoolId = "10101";
      let lrn = "";

      if (demoRole === "system_admin") {
        email = "sysadmin@school.edu.ph";
        name = "System Administrator";
        uid = "demo-sysadmin";
      } else if (demoRole === "school_head") {
        email = "principal@school.edu.ph";
        name = "Maria Santos, PhD (School Head)";
        uid = "demo-schoolhead";
      } else if (demoRole === "teacher") {
        email = "teacher@school.edu.ph";
        name = "Juan Dela Cruz (Teacher)";
        uid = "demo-teacher";
      } else if (demoRole === "student") {
        email = "student@school.edu.ph";
        name = "Mark Reyes (Student)";
        uid = "demo-student";
        lrn = "123456789012";
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
        role: demoRole === "admin" ? "admin" : demoRole,
        approvalStatus: "approved",
        schoolId,
        ...(lrn ? { lrn } : {}),
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
      setLoginError(
        "Failed to initialize Demo session: " + (err.message || String(err)),
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("home_filters");
    if (currentUser) {
      localStorage.removeItem(`selectedSectionId_${currentUser.uid}`);
      localStorage.removeItem(`activeTerm_${currentUser.uid}`);
      localStorage.removeItem(`selectedSubjectId_${currentUser.uid}`);
      localStorage.removeItem(
        `dailyAttendance_selectedMonth_${currentUser.uid}`,
      );
      localStorage.removeItem(
        `dailyAttendance_selectedTerm_${currentUser.uid}`,
      );
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
        const schoolCreatedAt =
          activeSchool.createdAt || new Date().toISOString();
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
        expiresAt: newExpiresAt,
      });

      // 3. Commit atomic batch in Firestore
      await batch.commit();
      console.log(
        `Successfully renewed subscription for Year ${yearIndex} until ${newExpiresAt}`,
      );
    } catch (err) {
      console.error("Error during renewal transaction: ", err);
      handleFirestoreError(err, "update", "subscription renewal");
    }
  };

  const handleCreateSection = async (sectionData: any) => {
    if (!currentUser) return;
    try {
      const newSection = {
        ...sectionData,
        createdBy: currentUser.uid,
        adviserEmail: (sectionData.adviserEmail || "").trim().toLowerCase(),
      };
      await addDoc(collection(db, "sections"), newSection);
    } catch (error) {
      handleFirestoreError(error, "create", "sections");
    }
  };

  const handleUpdateSection = async (id: string, sectionData: any) => {
    const isCriticalUpdate =
      "name" in sectionData ||
      "gradeLevel" in sectionData ||
      "schoolId" in sectionData ||
      "schoolYear" in sectionData ||
      "adviserEmail" in sectionData;

    const sec = sections.find((s) => s.id === id);
    const adviserEmail = (sec?.adviserEmail || "").trim().toLowerCase();
    const profEmail = (userProfile?.email || "").trim().toLowerCase();
    const isSecAdviser = adviserEmail && adviserEmail === profEmail;

    const isOnlyUpdatingSubjectTeachers =
      Object.keys(sectionData).length === 1 && "subjectTeachers" in sectionData;

    if (
      userProfile?.role === "teacher" &&
      !isSecAdviser &&
      !isOnlyUpdatingSubjectTeachers
    ) {
      alert(
        "Teachers are not authorized to edit section details. Please contact the System Administrator.",
      );
      return;
    }
    if (userProfile?.role === "teacher" && isSecAdviser && isCriticalUpdate) {
      alert(
        "Section Advisers are not authorized to edit core section metadata. Please contact the System Administrator.",
      );
      return;
    }
    try {
      const updatedData = {
        ...sectionData,
      };
      if (updatedData.adviserEmail !== undefined) {
        updatedData.adviserEmail = (updatedData.adviserEmail || "")
          .trim()
          .toLowerCase();
      }
      await setDoc(doc(db, "sections", id), updatedData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, "update", `sections/${id}`);
    }
  };

  const cascadeDeleteSection = async (id: string) => {
    try {
      const batch = writeBatch(db);

      const studentsSnap = await getDocs(
        collection(db, `sections/${id}/students`),
      );
      studentsSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      const subjectsSnap = await getDocs(
        collection(db, `sections/${id}/subjects`),
      );
      subjectsSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      batch.delete(doc(db, "sections", id));

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, "delete", `sections/${id}`);
      throw error;
    }
  };

  const handleDeleteSection = async (
    id: string,
    action?: "approve" | "disapprove" | "cancel" | "request" | "delete",
    reason?: string,
  ) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;

    if (userProfile?.role === "teacher") {
      if (action === "cancel") {
        try {
          await updateDoc(doc(db, "sections", id), {
            deletionStatus: "none",
            deletionRequestedBy: deleteField(),
            disapprovalReason: deleteField(),
            deletionReason: deleteField(),
          });
        } catch (error) {
          handleFirestoreError(error, "update", `sections/${id}`);
        }
      } else if (action === "request") {
        try {
          await updateDoc(doc(db, "sections", id), {
            deletionStatus: "pending",
            deletionRequestedBy: userProfile?.email || "",
            disapprovalReason: deleteField(),
            deletionReason: reason || "No reason provided.",
          });
        } catch (error) {
          handleFirestoreError(error, "update", `sections/${id}`);
        }
      } else if (action === "delete") {
        try {
          await cascadeDeleteSection(id);
        } catch (error) {
          handleFirestoreError(error, "delete", `sections/${id}`);
        }
      }
    } else if (userProfile?.role === "system_admin") {
      if (
        action === "delete" ||
        (!action && section?.deletionStatus === "approved")
      ) {
        try {
          await cascadeDeleteSection(id);
        } catch (error) {
          handleFirestoreError(error, "delete", `sections/${id}`);
        }
      } else if (action === "approve") {
        try {
          await updateDoc(doc(db, "sections", id), {
            deletionStatus: "approved",
            disapprovalReason: deleteField(),
          });
        } catch (error) {
          handleFirestoreError(error, "update", `sections/${id}`);
        }
      } else if (action === "disapprove") {
        try {
          await updateDoc(doc(db, "sections", id), {
            deletionStatus: "rejected",
            disapprovalReason: reason || "No reason provided.",
          });
        } catch (error) {
          handleFirestoreError(error, "update", `sections/${id}`);
        }
      }
    } else if (userProfile?.role === "admin") {
      if (
        action === "delete" ||
        (!action && section?.deletionStatus === "approved")
      ) {
        await cascadeDeleteSection(id);
      } else if (action === "request") {
        try {
          await updateDoc(doc(db, "sections", id), {
            deletionStatus: "pending",
            deletionRequestedBy: userProfile?.email || "",
            disapprovalReason: deleteField(),
            deletionReason: reason || "No reason provided.",
          });
        } catch (error) {
          handleFirestoreError(error, "update", `sections/${id}`);
        }
      }
    }
  };

  const updateStudentGrades = async (
    studentId: string,
    updates: any,
    subjectId: string,
    term: number,
  ) => {
    const targetStudent = combinedTleStudents.find((s) => s.id === studentId);
    const secId = targetStudent?.sectionId || selectedSection?.id;
    if (!secId) return;
    try {
      const studentDocRef = doc(db, `sections/${secId}/students`, studentId);
      const studentDoc = await getDoc(studentDocRef);
      if (!studentDoc.exists()) return;

      const currentGrades = (studentDoc.data() as Student).grades || {};
      const subjectGrades = currentGrades[subjectId] || {};
      const termGrades =
        subjectGrades[term] || JSON.parse(JSON.stringify(DEFAULT_TERM_DATA));

      const updatedTermGrades = { ...termGrades, ...updates };

      await setDoc(
        studentDocRef,
        {
          grades: {
            ...currentGrades,
            [subjectId]: {
              ...subjectGrades,
              [term]: updatedTermGrades,
            },
          },
        },
        { merge: true },
      );
    } catch (error) {
      handleFirestoreError(
        error,
        "update",
        `sections/${secId}/students/${studentId}`,
      );
    }
  };

  const updateSubjectConfig = async (subjectId: string, updates: any) => {
    if (!selectedSection) return;
    try {
      const subject = subjects.find((s) => s.id === subjectId);
      const mergedUpdates = { ...updates };
      if (subject) {
        if (subject.teacherEmail)
          mergedUpdates.teacherEmail = subject.teacherEmail;
        if (subject.name) mergedUpdates.name = subject.name;
        if (subject.schoolId) mergedUpdates.schoolId = subject.schoolId;
        if (subject.sectionId) mergedUpdates.sectionId = subject.sectionId;
      }
      const subjRef = doc(
        db,
        `sections/${selectedSection.id}/subjects`,
        subjectId,
      );
      await setDoc(subjRef, mergedUpdates, { merge: true });
    } catch (err) {
      handleFirestoreError(
        err,
        "update",
        `sections/${selectedSection.id}/subjects/${subjectId}`,
      );
    }
  };

  const handleBulkUpdate = async (
    updatedStudents: Student[],
    subjectId: string,
    term: number,
  ) => {
    const defaultSecId = selectedSection?.id;
    if (
      !defaultSecId &&
      updatedStudents.length > 0 &&
      !updatedStudents[0].sectionId
    )
      return;
    const batch = writeBatch(db);
    try {
      updatedStudents.forEach((s) => {
        const targetStudent = combinedTleStudents.find((st) => st.id === s.id);
        const secId = targetStudent?.sectionId || s.sectionId || defaultSecId;
        if (secId) {
          batch.set(doc(db, `sections/${secId}/students`, s.id), s, {
            merge: true,
          });
        }
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, "write", `sections/bulkUpdate/students`);
    }
  };

  const handleSaveLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection) return;

    // Check for duplicate LRN in current section
    const isDuplicate = students.some(
      (s) => s.lrn === learnerForm.lrn && s.id !== editingId,
    );
    if (isDuplicate) {
      alert("A learner with this LRN already exists in this section.");
      return;
    }

    // Auto-generate full name for display convenience
    const nameParts = [
      learnerForm.lastName + (learnerForm.firstName ? "," : ""),
      learnerForm.firstName,
      learnerForm.middleName,
      learnerForm.extension,
    ].filter(Boolean);
    const fullName = nameParts.join(" ").trim();

    try {
      if (editingId) {
        const oldStudent = students.find((s) => s.id === editingId);
        const { bmi, category } = computeBMI(
          parseFloat(learnerForm.weight) || 0,
          parseFloat(learnerForm.height) || 0,
        );

        await setDoc(
          doc(db, `sections/${selectedSection.id}/students`, editingId),
          {
            ...learnerForm,
            name: fullName,
            age: parseInt(learnerForm.age) || 0,
            weight: parseFloat(learnerForm.weight) || 0,
            height: parseFloat(learnerForm.height) || 0,
            bmi: bmi,
            nutritionalStatus: {
              ...learnerForm.nutritionalStatus,
              bmiCategory: category,
            },
            studentNumber: learnerForm.lrn,
          },
          { merge: true },
        );

        setEditingId(null);
      } else {
        const { bmi, category } = computeBMI(
          parseFloat(learnerForm.weight) || 0,
          parseFloat(learnerForm.height) || 0,
        );

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
            bmiCategory: category,
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
          siblingIds: learnerForm.siblingIds || [],
        };
        const docRef = await addDoc(
          collection(db, `sections/${selectedSection.id}/students`),
          newLearner,
        );
        const newStudentId = docRef.id;

        // Bidirectional update for new student
        try {
          const sibs = learnerForm.siblingIds || [];
          for (const sId of sibs) {
            const snaps = await Promise.all(
              sections.map((sec) =>
                getDoc(doc(db, `sections/${sec.id}/students`, sId)),
              ),
            );
            const snap = snaps.find((s) => s.exists());
            if (snap) {
              const sRef = snap.ref;
              const sibList = snap.data().siblingIds || [];
              if (!sibList.includes(newStudentId)) {
                await updateDoc(sRef, {
                  siblingIds: [...sibList, newStudentId],
                });
              }
            }
          }
        } catch (e) {
          console.error(
            "Error creating manual bidirectional links for new student:",
            e,
          );
        }
      }
      setLearnerForm({
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
        sex: "Male",
        weight: "",
        height: "",
        attendance: {},
        birthplace: "",
        address: "",
        fatherName: "",
        motherName: "",
        guardianName: "",
        guardianRelationship: "",
        primaryContact: "guardian",
        contactNumber: "",
        nutritionalStatus: {},
        isTransferredIn: false,
        siblingIds: [],
        enrolledSubjectIds: [],
        eligibility: { type: "Elementary School Completer" } as Eligibility,
      });
    } catch (error) {
      handleFirestoreError(
        error,
        "write",
        `sections/${selectedSection.id}/students`,
      );
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
      await updateDoc(
        doc(db, `sections/${selectedSection.id}/students`, studentId),
        {
          sf9CardUnlocked: value,
        },
      );
    } catch (error) {
      handleFirestoreError(
        error,
        "write",
        `sections/${selectedSection.id}/students/${studentId}`,
      );
    }
  };

  const handleToggleStudentStatus = async (
    studentId: string,
    status:
      "Active" | "Transferred Out" | "Dropped Out" | "Retained" | "Promoted",
  ) => {
    if (!selectedSection) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    if (status === "Active") {
      try {
        const updateData: any = {
          status: status,
          dropoutDate: deleteField(),
          dropoutReason: deleteField(),
        };
        await updateDoc(
          doc(db, `sections/${selectedSection.id}/students`, studentId),
          updateData,
        );
      } catch (error) {
        handleFirestoreError(
          error,
          "write",
          `sections/${selectedSection.id}/students/${studentId}`,
        );
      }
    } else {
      // Trigger modal
      setStatusChangeDate(new Date().toISOString().split("T")[0]);
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
        dropoutDate: statusChangeDate || new Date().toISOString().split("T")[0],
      };
      if (statusChangeReason.trim()) {
        updateData.dropoutReason = statusChangeReason.trim();
      } else {
        updateData.dropoutReason = deleteField();
      }
      await updateDoc(
        doc(db, `sections/${selectedSection.id}/students`, student.id),
        updateData,
      );
      setStatusChangeTarget(null);
    } catch (error) {
      handleFirestoreError(
        error,
        "write",
        `sections/${selectedSection.id}/students/${student.id}`,
      );
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
      const activeStudents = students.filter(
        (s) => s.status === "Active" || !s.status,
      );
      const updatePromises = activeStudents.map((student) => {
        let totalWeightedFinals = 0;
        let totalUnits = 0;
        editableSubjects.forEach((subj) => {
          const termsPassed = (subj.offeredTerms || [1, 2, 3, 4])
            .map((t) => calculateGrade(student, subj, t as TermNumber).final)
            .filter((f) => f > 0);
          if (termsPassed.length > 0) {
            const finalRating = Math.round(
              termsPassed.reduce((a, b) => a + b, 0) / termsPassed.length,
            );
            const u =
              subj.unit !== undefined && subj.unit !== null && subj.unit > 0
                ? subj.unit
                : 1.0;
            totalWeightedFinals += finalRating * u;
            totalUnits += u;
          }
        });

        let finalStatus = "Retained";
        if (totalUnits > 0) {
          const genAvg = Math.round(totalWeightedFinals / totalUnits);
          finalStatus = genAvg >= 75 ? "Promoted" : "Retained";
        }
        return updateDoc(
          doc(db, `sections/${selectedSection.id}/students`, student.id),
          {
            status: finalStatus,
          },
        );
      });
      await Promise.all(updatePromises);
      await updateDoc(doc(db, "sections", selectedSection.id), {
        isFinalized: true,
      });
    } catch (error) {
      console.error(error);
      handleFirestoreError(
        error,
        "write",
        `sections/${selectedSection.id}/students`,
      );
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
      if (
        userProfile?.role === "system_admin" ||
        userProfile?.email === "jessiemangabo@gmail.com"
      ) {
        const finalizedStudents = students.filter(
          (s) => s.status === "Promoted" || s.status === "Retained",
        );
        const updatePromises = finalizedStudents.map((student) => {
          return updateDoc(
            doc(db, `sections/${selectedSection.id}/students`, student.id),
            {
              status: "Active",
            },
          );
        });
        await Promise.all(updatePromises);
        await updateDoc(doc(db, "sections", selectedSection.id), {
          isFinalized: false,
        });
        alert("Section successfully unfinalized.");
      } else {
        const docRef = doc(db, "settings", "general");
        await updateDoc(docRef, {
          unfinalizeRequests: arrayUnion({
            schoolYear: selectedSection.schoolYear || "active",
            sectionId: selectedSection.id,
            sectionName: selectedSection.name,
            requestedBy: userProfile?.email,
            timestamp: new Date().toISOString(),
          }),
        });
        alert(
          "Unfinalize Section request sent successfully. A System Admin will review your request.",
        );
      }
    } catch (error) {
      console.error(error);
      const isTeacher = !(
        userProfile?.role === "system_admin" ||
        userProfile?.email === "jessiemangabo@gmail.com"
      );
      handleFirestoreError(
        error,
        "write",
        isTeacher ? "settings/general" : `sections/${selectedSection.id}`,
      );
    }
  };

  const handleToggleFinalizeSubjectTerm = async (
    subjectId: string,
    term: TermNumber,
    finalize: boolean,
  ) => {
    if (!selectedSection) return;

    try {
      const subjectDocRef = doc(
        db,
        `sections/${selectedSection.id}/subjects`,
        subjectId,
      );
      const subjectDoc = await getDoc(subjectDocRef);
      if (!subjectDoc.exists()) return;

      const currentFinalized =
        (subjectDoc.data() as Subject).finalizedTerms || [];
      let updatedFinalized: TermNumber[] = [];
      if (finalize) {
        if (!currentFinalized.includes(term)) {
          updatedFinalized = [...currentFinalized, term];
        } else {
          updatedFinalized = currentFinalized;
        }
      } else {
        updatedFinalized = currentFinalized.filter((t) => t !== term);
      }

      await updateDoc(subjectDocRef, {
        finalizedTerms: updatedFinalized,
      });
    } catch (error) {
      console.error(error);
      handleFirestoreError(
        error,
        "write",
        `sections/${selectedSection.id}/subjects/${subjectId}`,
      );
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
      eligibility:
        student.eligibility ||
        ({ type: "Elementary School Completer" } as Eligibility),
    });
  };

  const handleMarkAllPresent = async (studentId: string, monthKey: string) => {
    if (!selectedSection) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const monthName = monthKey.includes("_")
      ? monthKey.split("_")[0]
      : monthKey;
    const calendarData = sectionSchoolCalendar.find(
      (c) => `${c.month}_${c.term || "1"}` === monthKey || c.month === monthKey,
    );
    const year = parseInt(
      calendarData?.year || new Date().getFullYear().toString(),
    );

    // Get term coverage
    const openingDate = parseInt(calendarData?.openingDate || "1");
    const closingDate = parseInt(calendarData?.closingDate || "31");
    const daysInMonth = new Date(
      year,
      (MONTH_INDICES[monthName] || 0) + 1,
      0,
    ).getDate();
    const hasManualCoverage =
      openingDate !== 1 || (closingDate !== 31 && closingDate !== daysInMonth);

    // Collect school days for the month
    const schoolDays: number[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, MONTH_INDICES[monthName], day);
      const dayOfWeek = date.getDay();
      const dateStr = `${(MONTH_INDICES[monthName] + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isLocalHoliday = calendarData?.localHolidays?.includes(day);
      const isHoliday =
        [
          "01-01",
          "04-09",
          "05-01",
          "06-12",
          "08-21",
          "08-25",
          "11-01",
          "11-30",
          "12-25",
          "12-30",
        ].includes(dateStr) || isLocalHoliday;
      if (!isWeekend && !isHoliday) {
        schoolDays.push(day);
      }
    }

    let targetDays: number[] = [];
    if (hasManualCoverage) {
      targetDays = schoolDays.filter(
        (day) => day >= openingDate && day <= closingDate,
      );
    } else {
      // Dynamic split fallback
      const allEntriesForMonth = sectionSchoolCalendar
        .filter((c) => c.month === monthName)
        .sort((a, b) => (parseInt(a.term) || 1) - (parseInt(b.term) || 1));

      const currentTerm = parseInt(calendarData?.term || "1");
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
      const [fYear, fMonth, fDay] = student.dateOfFirstAttendance
        .split("-")
        .map(Number);
      const currentMonthIdx = MONTH_INDICES[monthName];
      targetDays = targetDays.filter((day) => {
        if (year < fYear) return false;
        if (year === fYear) {
          if (currentMonthIdx < fMonth - 1) return false;
          if (currentMonthIdx === fMonth - 1 && day < fDay) return false;
        }
        return true;
      });
    }

    if (
      (student.status === "Dropped Out" ||
        student.status === "Transferred Out") &&
      student.dropoutDate
    ) {
      const [dYear, dMonth, dDay] = student.dropoutDate.split("-").map(Number);
      const currentMonthIdx = MONTH_INDICES[monthName];
      targetDays = targetDays.filter((day) => {
        if (year > dYear) return false;
        if (year === dYear) {
          if (currentMonthIdx > dMonth - 1) return false;
          if (currentMonthIdx === dMonth - 1 && day >= dDay) return false;
        }
        return true;
      });
    }

    const dailyAttendance = {
      ...(student.dailyAttendance || {}),
      [monthKey]: {
        ...(student.dailyAttendance?.[monthKey] || {}),
      },
    };

    targetDays.forEach((day) => {
      dailyAttendance[monthKey][day] = true;
    });

    // Calculate monthly present count
    const monthDaily = dailyAttendance[monthKey];
    let presentCount = 0;
    Object.values(monthDaily).forEach((val) => {
      if (val) presentCount++;
    });

    const attendance = {
      ...(student.attendance || {}),
      [monthKey]: {
        present: presentCount,
        absent: Math.max(0, (calendarData?.days || 0) - presentCount),
      },
    };

    try {
      await setDoc(
        doc(db, `sections/${selectedSection.id}/students`, studentId),
        {
          dailyAttendance,
          attendance,
        },
        { merge: true },
      );
    } catch (error) {
      handleFirestoreError(
        error,
        "update",
        `sections/${selectedSection.id}/students/${studentId}`,
      );
    }
  };

  const handleUpdateDailyAttendance = async (
    studentId: string,
    monthKey: string,
    day: number,
    present: boolean,
  ) => {
    if (!selectedSection) return;

    // Find the student
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const dailyAttendance = {
      ...(student.dailyAttendance || {}),
      [monthKey]: {
        ...(student.dailyAttendance?.[monthKey] || {}),
        [day]: present,
      },
    };

    // Calculate monthly present count
    const monthDaily = dailyAttendance[monthKey];
    let presentCount = 0;
    Object.values(monthDaily).forEach((val) => {
      if (val) presentCount++;
    });

    const calendarForMonth =
      sectionSchoolCalendar.find(
        (c) =>
          `${c.month}_${c.term || "1"}` === monthKey || c.month === monthKey,
      )?.days || 0;
    const absentCount = Math.max(0, calendarForMonth - presentCount);

    const attendance = {
      ...(student.attendance || {}),
      [monthKey]: {
        present: presentCount,
        absent: absentCount,
      },
    };

    try {
      await setDoc(
        doc(db, `sections/${selectedSection.id}/students`, studentId),
        {
          dailyAttendance,
          attendance,
        },
        { merge: true },
      );
    } catch (error) {
      handleFirestoreError(
        error,
        "update",
        `sections/${selectedSection.id}/students/${studentId}`,
      );
    }
  };

  const handleUpdateObservedValue = async (
    studentId: string,
    term: number,
    statementId: string,
    value: RatedValue,
  ) => {
    if (!selectedSection) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const observedValues = {
      ...(student.observedValues || {}),
      [term]: {
        ...(student.observedValues?.[term] || {}),
        [statementId]: value,
      },
    };

    try {
      await setDoc(
        doc(db, `sections/${selectedSection.id}/students`, studentId),
        {
          observedValues,
        },
        { merge: true },
      );
    } catch (error) {
      handleFirestoreError(
        error,
        "update",
        `sections/${selectedSection.id}/students/${studentId}`,
      );
    }
  };

  const handleUpdateAttendance = (
    month: string,
    field: "present" | "absent",
    value: number,
  ) => {
    setLearnerForm((prev) => {
      const calendarForMonth =
        schoolCalendar.find((c) => c.month === month)?.days || 0;
      const newPresent =
        field === "present" ? value : prev.attendance?.[month]?.present || 0;

      // Auto-calculate absent based on school days
      const newAbsent = calendarForMonth - newPresent;

      return {
        ...prev,
        attendance: {
          ...prev.attendance,
          [month]: {
            present: newPresent,
            absent: Math.max(0, newAbsent),
          },
        },
      };
    });
  };

  const handleTogglePublishGrades = async (
    studentId: string,
    term: number,
    val: boolean,
  ) => {
    if (!selectedSection) return;
    try {
      const updates: any = {
        [`publishGrades.${term}`]: val,
        [`parentSignatureEnabled.${term}`]: val,
      };
      await updateDoc(
        doc(db, `sections/${selectedSection.id}/students`, studentId),
        updates,
      );
    } catch (e) {
      handleFirestoreError(
        e,
        "update",
        `sections/${selectedSection.id}/students/${studentId}`,
      );
    }
  };

  const handleToggleParentSignature = async (
    studentId: string,
    term: number,
    val: boolean,
  ) => {
    if (!selectedSection) return;
    try {
      await updateDoc(
        doc(db, `sections/${selectedSection.id}/students`, studentId),
        { [`parentSignatureEnabled.${term}`]: val },
      );
    } catch (e) {
      handleFirestoreError(
        e,
        "update",
        `sections/${selectedSection.id}/students/${studentId}`,
      );
    }
  };

  const handleDeleteLearner = async (studentId: string) => {
    if (!selectedSection) return;
    try {
      await deleteDoc(
        doc(db, `sections/${selectedSection.id}/students`, studentId),
      );
    } catch (error) {
      handleFirestoreError(
        error,
        "delete",
        `sections/${selectedSection.id}/students/${studentId}`,
      );
    }
  };

  const handleDeleteManyLearners = async (studentIds: string[]) => {
    if (!selectedSection) return;
    const batch = writeBatch(db);
    try {
      studentIds.forEach((id) => {
        batch.delete(doc(db, `sections/${selectedSection.id}/students`, id));
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(
        error,
        "delete",
        `sections/${selectedSection.id}/students`,
      );
    }
  };

  const handleBulkEnroll = async (studentsList: any[]) => {
    if (!selectedSection) return;

    // Check for duplicates
    const existingLrns = new Set(students.map((s) => s.lrn).filter(Boolean));
    const uniqueNewStudents = studentsList.filter((learner) => {
      if (!learner.lrn) return true; // Allow if no LRN (though template says it has)
      return !existingLrns.has(learner.lrn);
    });

    if (uniqueNewStudents.length === 0) {
      alert(
        "All learners in the list already exist in this section (based on LRN).",
      );
      return;
    }

    if (uniqueNewStudents.length < studentsList.length) {
      alert(
        `${studentsList.length - uniqueNewStudents.length} learners were skipped because their LRN already exists in this section.`,
      );
    }

    // Firestore batches have a 500 operation limit
    const CHUNK_SIZE = 450;

    const processBatch = async (chunk: any[]) => {
      const batch = writeBatch(db);
      chunk.forEach((learner) => {
        const docRef = doc(
          collection(db, `sections/${selectedSection.id}/students`),
        );
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
          enrolledSubjectIds: subjects
            .filter((s) => {
              const isTle = isTleSubject(s.name);
              const isJHS =
                Number(selectedSection?.gradeLevel) === 9 ||
                Number(selectedSection?.gradeLevel) === 10;
              if (isJHS && isTle) return false;
              return true;
            })
            .map((s) => s.id),
          gradeLevel: learner.gradeLevel || selectedSection.gradeLevel || "",
          sectionName: learner.section || selectedSection.name || "",
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
      handleFirestoreError(
        error,
        "write",
        `sections/${selectedSection.id}/students`,
      );
    }
  };

  const sectionSchoolCalendar = useMemo(() => {
    if (!selectedSection?.schoolYear) return schoolCalendar;
    return schoolCalendar.filter(
      (c) => c.schoolYear === selectedSection.schoolYear,
    );
  }, [schoolCalendar, selectedSection?.schoolYear]);

  const studentPortalSchoolCalendar = useMemo(() => {
    if (!studentViewMatched?.section?.schoolYear) return schoolCalendar;
    return schoolCalendar.filter(
      (c) => c.schoolYear === studentViewMatched.section.schoolYear,
    );
  }, [schoolCalendar, studentViewMatched?.section?.schoolYear]);

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.status !== "Dropped Out" &&
        s.status !== "Transferred Out" &&
        s.enrolledSubjectIds &&
        s.enrolledSubjectIds.length > 0 &&
        (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.lrn?.includes(searchTerm)),
    );
  }, [students, searchTerm]);

  const enrolledStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.status !== "Dropped Out" &&
        s.status !== "Transferred Out" &&
        s.enrolledSubjectIds &&
        s.enrolledSubjectIds.length > 0,
    );
  }, [students]);

  const unenrolledStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.status !== "Dropped Out" &&
        s.status !== "Transferred Out" &&
        (!s.enrolledSubjectIds || s.enrolledSubjectIds.length === 0),
    );
  }, [students]);

  const globalScannerModal = (
    <>
      {/* Render Global Scanner if open */}
      <AnimatePresence>
        {showGlobalScanner && (
          <div
            className={`fixed inset-0 z-[150] ${isScannerFullScreen ? "p-0 bg-white" : "p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center"}`}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
                isScannerFullScreen
                  ? "w-screen h-screen rounded-none border-0"
                  : "rounded-2xl sm:rounded-3xl w-full max-w-[95vw] lg:max-w-6xl xl:max-w-7xl h-auto max-h-[98vh] animate-in zoom-in-95"
              }`}
            >
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 tracking-tight text-sm sm:text-base">
                      Scan ID Card
                    </h3>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">
                      Attendance & Learner Validity (Full Screen Window)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScannerFullScreen(!isScannerFullScreen)}
                    className="p-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 text-xs font-extrabold shadow-xs cursor-pointer"
                    title={
                      isScannerFullScreen
                        ? "Exit Fullscreen Window"
                        : "Expand to Fullscreen"
                    }
                  >
                    {isScannerFullScreen ? (
                      <>
                        <Minimize2 size={16} className="text-slate-700" />
                        <span className="hidden sm:inline">
                          Exit Fullscreen
                        </span>
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
                  onClick={() => setScannerViewMode("scanner")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${scannerViewMode === "scanner" ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80"}`}
                >
                  <span> Camera Scanner & Verify</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScannerViewMode("all_logs")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${scannerViewMode === "all_logs" ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80"}`}
                >
                  <span> All Scanned QR IDs ({scanLogs.length})</span>
                </button>
              </div>

              {scannerViewMode === "all_logs" ? (
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-black">
                        {scanLogs.length}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800">
                          All Scanned QR IDs & Attendance Logs
                        </h4>
                        <p className="text-xs text-slate-500">
                          Real-time scan logs across all sections and students
                        </p>
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
                            if (
                              window.confirm(
                                "Are you sure you want to clear all scan logs?",
                              )
                            ) {
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
                    {scanLogs.filter((log) => {
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
                        <p className="text-sm font-bold text-slate-700">
                          No scan logs found
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Scan student ID QR codes or type an LRN to start
                          recording attendance.
                        </p>
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
                            {scanLogs
                              .filter((log) => {
                                if (!allLogsSearchQuery) return true;
                                const q = allLogsSearchQuery.toLowerCase();
                                return (
                                  log.studentName?.toLowerCase().includes(q) ||
                                  log.lrn?.toLowerCase().includes(q) ||
                                  log.sectionName?.toLowerCase().includes(q) ||
                                  log.scanDate?.toLowerCase().includes(q)
                                );
                              })
                              .map((log) => (
                                <tr
                                  key={log.id}
                                  className="hover:bg-slate-50/80 transition-colors"
                                >
                                  <td className="p-3.5">
                                    <p className="font-extrabold text-slate-900">
                                      {log.studentName}
                                    </p>
                                    <p className="text-[11px] text-slate-500 font-mono">
                                      LRN: {log.lrn}
                                    </p>
                                  </td>
                                  <td className="p-3.5">
                                    <p className="font-bold uppercase text-slate-800">
                                      {Number(log.gradeLevel) === 0
                                        ? `Kindergarten  ${log.sectionName}`
                                        : `Grade ${log.gradeLevel}  ${log.sectionName}`}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      SY: {log.schoolYear}
                                    </p>
                                  </td>
                                  <td className="p-3.5">
                                    <span
                                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        log.scanType === "IN"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {log.scanType || "IN"}
                                    </span>
                                  </td>
                                  <td className="p-3.5">
                                    <p className="font-bold text-slate-800">
                                      {log.scanDate}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                      {log.scanTime}
                                    </p>
                                  </td>
                                  <td className="p-3.5 text-slate-500 text-[11px]">
                                    {log.scannedBy || "ID Scanner"}
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteScanLog(log.id)
                                      }
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
                        onClick={() =>
                          setGlobalScannerFacingMode("environment")
                        }
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${globalScannerFacingMode === "environment" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        <Camera size={14} />
                        <span>Back Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGlobalScannerFacingMode("user")}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${globalScannerFacingMode === "user" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
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
                          <p className="text-sm font-bold text-white mb-1">
                            Camera Access Issue
                          </p>
                          <p className="text-xs text-slate-300 leading-normal max-w-[280px] mb-3">
                            {globalScannerError}
                          </p>
                          <div className="bg-white/10 p-3 rounded-lg text-[10px] text-slate-300 text-left max-w-sm border border-white/5 space-y-1">
                            <p className="font-bold text-indigo-300">
                              {" "}
                              Troubleshooting Guide:
                            </p>
                            <p>
                              1. Check if another application is using your
                              camera.
                            </p>
                            <p>
                              2. Click the camera or lock icon in your browser's
                              address bar, choose <b>"Allow"</b>, and refresh.
                            </p>
                            <p>
                              3. If you're on mobile, verify camera permissions
                              are enabled in system settings.
                            </p>
                            <p className="pt-1 border-t border-white/10 text-indigo-200 font-semibold">
                              <b>Backup Option:</b> Use the <b>Manual Entry</b>{" "}
                              section below!
                            </p>
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
                        Type a student LRN or scan with a hardware barcode
                        scanner to verify status and record attendance
                        automatically.
                      </p>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type Student LRN..."
                          value={globalManualLrnInput}
                          onChange={(e) =>
                            setGlobalManualLrnInput(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (globalManualLrnInput.trim()) {
                                handleGlobalScan(globalManualLrnInput.trim());
                                setGlobalManualLrnInput("");
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
                              setGlobalManualLrnInput("");
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
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 10px center",
                            backgroundSize: "14px",
                            paddingRight: "30px",
                          }}
                        >
                          <option value="">
                            -- Or Select Student from Enrolled List --
                          </option>
                          {enrolledStudents.map((s) => (
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
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">
                      Scan Status & Learner Info
                    </h4>
                    {globalRecentScan ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Scan Status Banner */}
                        <div
                          className={`p-4 rounded-xl flex items-center gap-3 border ${globalRecentScan.status === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}
                        >
                          {globalRecentScan.status === "success" ? (
                            <CheckCircle
                              size={24}
                              className="text-emerald-600 shrink-0"
                            />
                          ) : (
                            <AlertCircle
                              size={24}
                              className="text-rose-600 shrink-0"
                            />
                          )}
                          <span className="text-xs font-bold leading-relaxed">
                            {globalRecentScan.message}
                          </span>
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
                                  alt={formatStudentName(
                                    globalRecentScan.student,
                                  )}
                                  className="w-32 h-32 rounded-3xl object-cover border border-slate-200 shadow-sm"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div
                                  className={`w-32 h-32 rounded-3xl flex items-center justify-center font-black text-5xl text-white shadow-sm ${globalRecentScan.student.sex === "Female" ? "bg-rose-500 shadow-rose-100" : "bg-indigo-500 shadow-indigo-100"}`}
                                >
                                  {formatStudentName(
                                    globalRecentScan.student,
                                  ).charAt(0)}
                                </div>
                              )}

                              <div className="space-y-1.5 min-w-0 flex-1">
                                {/* Status Badge */}
                                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                                  {globalRecentScan.scanType && (
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                        globalRecentScan.scanType === "IN"
                                          ? "bg-emerald-600 text-white shadow-xs"
                                          : "bg-amber-600 text-white shadow-xs"
                                      }`}
                                    >
                                      LOGGED TIME {globalRecentScan.scanType}
                                    </span>
                                  )}
                                  <span
                                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                      globalRecentScan.student.status ===
                                      "Dropped Out"
                                        ? "bg-orange-50 border-orange-200 text-orange-600"
                                        : globalRecentScan.student.status ===
                                            "Transferred Out"
                                          ? "bg-rose-50 border-rose-200 text-rose-600"
                                          : "bg-emerald-50 border-emerald-200 text-emerald-600"
                                    }`}
                                  >
                                    {globalRecentScan.student.status ||
                                      "Active / Enrolled"}
                                  </span>
                                  {globalRecentScan.student.sex && (
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                        globalRecentScan.student.sex ===
                                        "Female"
                                          ? "bg-pink-50 border-pink-200 text-pink-600"
                                          : "bg-blue-50 border-blue-200 text-blue-600"
                                      }`}
                                    >
                                      {globalRecentScan.student.sex}
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-base font-black text-slate-800 tracking-tight truncate">
                                  {formatStudentName(globalRecentScan.student)}
                                </h4>

                                <p className="text-xs font-bold text-slate-500">
                                  LRN:{" "}
                                  <span className="text-slate-800 font-mono font-bold">
                                    {globalRecentScan.student.lrn}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* Secondary Fields Grid */}
                            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200/60 text-xs relative z-10">
                              <div>
                                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                  Grade & Section
                                </p>
                                <p className="text-slate-700 font-bold uppercase mt-1">
                                  {(() => {
                                    const activeSec =
                                      globalRecentScan?.section ||
                                      selectedSection;
                                    if (!activeSec) return "Unknown Section";
                                    return Number(activeSec.gradeLevel) === 0
                                      ? `Kindergarten  ${activeSec.name}`
                                      : `Grade ${activeSec.gradeLevel}  ${activeSec.name}`;
                                  })()}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                  Contact Number
                                </p>
                                <p className="text-slate-700 font-bold mt-1">
                                  {globalRecentScan.student.contactNumber ||
                                    "No registered contact"}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                  First Attendance
                                </p>
                                <p className="text-slate-700 font-bold mt-1">
                                  {globalRecentScan.student
                                    .dateOfFirstAttendance || "Not specified"}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                  Guardian Name
                                </p>
                                <p className="text-slate-700 font-bold mt-1 truncate">
                                  {globalRecentScan.student.guardianName ||
                                    "None"}
                                </p>
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
                          <p className="text-sm font-black text-slate-700">
                            Waiting for scan...
                          </p>
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
          <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">
            Syncing System...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginView
        onLogin={handleLogin}
        isLoading={isLoggingIn}
        loginError={loginError}
        onDemoLogin={handleDemoLogin}
      />
    );
  }

  if (isCompletingProfile) {
    return (
      <RoleSelectionView
        user={currentUser}
        onComplete={(profile) => {
          setUserProfile(profile);
          setIsCompletingProfile(false);
        }}
      />
    );
  }

  const isExpired = activeSchool?.expiresAt
    ? new Date(activeSchool.expiresAt) < new Date()
    : false;

  if (
    userProfile &&
    userProfile.approvalStatus !== "approved" &&
    userProfile.email !== "jessiemangabo@gmail.com"
  ) {
    return (
      <PendingApprovalView
        onLogout={handleLogout}
        isExpired={false}
        isRejected={userProfile.approvalStatus === "rejected"}
        noAdminFound={noApprovedAdminFound}
        userRole={userProfile.role}
      />
    );
  }

  if (userProfile?.role === "student") {
    if (studentViewMatched) {
      return (
        <StudentPortal
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
        />
      );
    } else {
      return (
        <StudentLinkingView
          userProfile={userProfile}
          onLinked={(id, type) => {
            findStudentEnrollments([{ val: id, type }]);
          }}
          onLogout={handleLogout}
        />
      );
    }
  }

  if (
    showAdminUsers &&
    (userProfile?.role === "admin" ||
      userProfile?.role === "system_admin" ||
      isAnySectionAdviser)
  ) {
    return (
      <AdminUsersView
        onBack={() => setShowAdminUsers(false)}
        currentUser={userProfile!}
        isAnySectionAdviser={isAnySectionAdviser}
        schoolCalendar={schoolCalendar}
        globalSettings={globalSettings}
        onShowFeedback={() => setShowFeedbackModal(true)}
        isFeedbackOpen={showFeedbackModal}
        onCloseFeedback={() => setShowFeedbackModal(false)}
        sections={sections}
      />
    );
  }

  if (
    showAdminSF4 &&
    (userProfile?.role === "system_admin" ||
      userProfile?.role === "school_head")
  ) {
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
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                Monthly Learner Movement and Attendance Report
              </p>
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

  if (
    showAdminSF7 &&
    (userProfile?.role === "system_admin" || userProfile?.role === "admin")
  ) {
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
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                School Staff Assignment and List of Personnel
              </p>
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

  if (
    showAdminPTA &&
    (userProfile?.role === "system_admin" ||
      userProfile?.role === "school_head" ||
      isAuthorizedCashier)
  ) {
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
              <p className="text-xs font-bold text-slate-500">
                PTA Fees & Contributions (School Year Wide)
              </p>
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

  if (
    showAdminStudentList &&
    (userProfile?.role === "admin" || userProfile?.role === "system_admin")
  ) {
    return (
      <AdminStudentListView
        onBack={() => setShowAdminStudentList(false)}
        sections={sections}
        onNavigateToSection={(sectionId) => {
          const sec = sections.find((s) => s.id === sectionId);
          if (sec) {
            setSelectedSection(sec);
            setShowAdminStudentList(false);
            setActiveTab(
              userProfile?.role === "school_head"
                ? "sf8"
                : userProfile?.role === "guidance_designate"
                  ? "anecdotes"
                  : "dashboard",
            );
          }
        }}
        onViewAnecdotals={async (studentLrn, sectionId) => {
          const sec = sections.find((s) => s.id === sectionId);
          if (sec) {
            setSelectedSection(sec);
            setShowAdminStudentList(false);
            setActiveTab("anecdotes");

            try {
              const tempSnap = await getDocs(
                collection(db, "sections", sectionId, "students"),
              );
              const foundStudent = tempSnap.docs
                .map((d) => ({ id: d.id, ...d.data() }) as Student)
                .find((s) => s.lrn === studentLrn);
              if (foundStudent) {
                setPreselectedStudentForAnecdotal(foundStudent);
              }
            } catch (e) {
              console.error("Failed to preload target student:", e);
            }
          }
        }}
      />
    );
  }

  if (
    showAdminSchools &&
    (userProfile?.role === "admin" || userProfile?.role === "system_admin")
  ) {
    return (
      <AdminSchoolsView
        onBack={() => setShowAdminSchools(false)}
        currentUser={userProfile}
        globalSettings={globalSettings}
        onShowFeedback={() => setShowFeedbackModal(true)}
        isFeedbackOpen={showFeedbackModal}
        onCloseFeedback={() => setShowFeedbackModal(false)}
        sections={sections}
      />
    );
  }

  if (showAdminSchoolYear && userProfile?.role === "admin") {
    return (
      <AdminSchoolYearView
        onBack={() => setShowAdminSchoolYear(false)}
        currentUser={userProfile}
        onShowFeedback={() => setShowFeedbackModal(true)}
        isFeedbackOpen={showFeedbackModal}
        onCloseFeedback={() => setShowFeedbackModal(false)}
      />
    );
  }

  if (showAdminSchoolCalendar && userProfile?.role === "admin") {
    return (
      <AdminSchoolCalendarView
        onBack={() => setShowAdminSchoolCalendar(false)}
        onShowFeedback={() => setShowFeedbackModal(true)}
        isFeedbackOpen={showFeedbackModal}
        onCloseFeedback={() => setShowFeedbackModal(false)}
      />
    );
  }

  if (showAdminFeedback && userProfile?.role === "admin") {
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
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                Summary & Insights for Administrators
              </p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <AdminFeedbackDashboard />
        </div>
      </div>
    );
  }

  const handleAddSubjectGlobal = async (s: Omit<Subject, "id">) => {
    if (s.gradeLevel === undefined || s.gradeLevel === null) {
      alert("Target Grade Level is missing.");
      return;
    }
    const grade = parseInt(String(s.gradeLevel));
    if (isNaN(grade) || grade < 0 || grade > 12) {
      alert(
        "Subjects in the Global Subjects Directory can only be added for Kindergarten (0) to Grade 12.",
      );
      return;
    }

    // Clean undefined fields to prevent Firestore errors
    const cleanS = { ...s } as any;
    Object.keys(cleanS).forEach((key) => {
      if (cleanS[key] === undefined) {
        delete cleanS[key];
      }
    });

    try {
      const docRef = await addDoc(collection(db, `global_subjects`), {
        ...cleanS,
        teacherEmail: s.teacherEmail ? s.teacherEmail.trim().toLowerCase() : "",
      });

      if (grade >= 0 && grade <= 10) {
        const relevantSections = sections.filter(
          (sec) => parseInt(String(sec.gradeLevel)) === grade,
        );
        for (const sec of relevantSections) {
          await addDoc(collection(db, `sections/${sec.id}/subjects`), {
            ...cleanS,
            sectionId: sec.id,
            schoolId: sec.schoolId || userProfile?.schoolId || "",
            teacherEmail: s.teacherEmail
              ? s.teacherEmail.trim().toLowerCase()
              : "",
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, "create", `global_subjects`);
    }
  };

  const handleEditSubjectGlobal = async (
    id: string,
    s: Omit<Subject, "id">,
  ) => {
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
      handleFirestoreError(error, "update", `global_subjects`);
    }
  };

  const handleDeleteSubjectGlobal = async (id: string) => {
    try {
      await deleteDoc(doc(db, `global_subjects`, id));
    } catch (error) {
      handleFirestoreError(error, "delete", `global_subjects`);
    }
  };

  if (!selectedSection) {
    if (activeTab === "subjects") {
      return (
        <div className="flex-1 bg-slate-50 min-h-screen">
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-[50] shadow-sm">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={24} className="text-indigo-600" />
              Global Subjects Directory
            </h1>
            <button
              onClick={() => setActiveTab("dashboard")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold px-4 py-2 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
            >
              Back to Dashboard
            </button>
          </div>
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-amber-50 text-amber-800 px-5 py-4 rounded-xl mb-6 text-sm font-medium border border-amber-200/50 flex flex-col gap-1">
                <p className="font-bold">Global Curriculum View</p>
                <p className="opacity-90">
                  You are viewing the global subject curriculum for all grade
                  levels. Changes made here will affect the available subjects
                  for student enrollment across the curriculum.
                </p>
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

    if (activeTab === "tle-dashboard") {
      return (
        <TleDashboardView
          sections={sections}
          subjects={subjects}
          currentUser={userProfile}
          onBack={() => setActiveTab("dashboard")}
        />
      );
    }

    if (activeTab === "aral") {
      return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
          <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-50">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-[#002060] rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                  <GraduationCap className="text-indigo-600" size={24} />
                  ARAL Program Module
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                  Academic Remediation and Achievement Learning
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("dashboard")}
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
        <SectionsView
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onCreateAralClass={handleCreateAralClass}
          onUpdateAralClass={handleUpdateAralClass}
          onDeleteAralClass={handleDeleteAralClass}
          aralClasses={aralClasses}
          selectedAralClassId={selectedAralClassId}
          onSelectAralClassId={setSelectedAralClassId}
          onScanID={openGlobalScanner}
          sections={sections}
          expiredSchoolIds={expiredSchoolIds}
          globalSettings={globalSettings}
          onSelect={(s) => {
            setSelectedSection(s);
            setActiveTab(
              userProfile?.role === "school_head"
                ? "sf8"
                : userProfile?.role === "guidance_designate"
                  ? "anecdotes"
                  : "dashboard",
            );
          }}
          onSelectSubject={setSelectedSubjectId}
          onSetActiveTab={setActiveTab}
          onNavigateToSubject={(section, subjName) => {
            setSelectedSection(section);
            setActiveTab("gradebook");
            let subjectObj = subjects.find(
              (s) => s.name === subjName && s.sectionId === section.id,
            );
            if (!subjectObj) {
              subjectObj = subjects.find(
                (s) =>
                  getTleDisplayName(s.name) === subjName &&
                  s.sectionId === section.id,
              );
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
          onResetSettings={() =>
            handleUpdateThemeSettings(DEFAULT_THEME_SETTINGS)
          }
        />
      </>
    );
  }

  const handleAddSubject = async (s: Omit<Subject, "id">) => {
    if (!selectedSection) return;
    const adviserEmail = (selectedSection.adviserEmail || "")
      .trim()
      .toLowerCase();
    const authEmail = (currentUser?.email || "").trim().toLowerCase();
    const profEmail = (userProfile?.email || "").trim().toLowerCase();
    const isSectionAdviser =
      adviserEmail &&
      (adviserEmail === authEmail || adviserEmail === profEmail);
    const isAdmin =
      userProfile?.role === "system_admin" || userProfile?.role === "admin";

    if (!isAdmin && !isSectionAdviser) {
      alert(
        "Only Administrators and Section Advisers can modify subjects for this section.",
      );
      return;
    }

    // Clean undefined fields to prevent Firestore errors
    const cleanS = { ...s } as any;
    Object.keys(cleanS).forEach((key) => {
      if (cleanS[key] === undefined) {
        delete cleanS[key];
      }
    });

    try {
      await addDoc(collection(db, `sections/${selectedSection.id}/subjects`), {
        ...cleanS,
        sectionId: selectedSection.id,
        schoolId: selectedSection.schoolId || userProfile?.schoolId || "",
        teacherEmail: s.teacherEmail ? s.teacherEmail.trim().toLowerCase() : "",
      });
    } catch (error) {
      handleFirestoreError(
        error,
        "create",
        `sections/${selectedSection.id}/subjects`,
      );
    }
  };

  const handleEditSubject = async (id: string, s: Omit<Subject, "id">) => {
    if (!selectedSection) return;
    const adviserEmail = (selectedSection.adviserEmail || "")
      .trim()
      .toLowerCase();
    const authEmail = (currentUser?.email || "").trim().toLowerCase();
    const profEmail = (userProfile?.email || "").trim().toLowerCase();
    const isSectionAdviser =
      adviserEmail &&
      (adviserEmail === authEmail || adviserEmail === profEmail);
    const isAdmin =
      userProfile?.role === "system_admin" || userProfile?.role === "admin";

    // Allow the assigned Subject Teacher to edit weights and details of their own subject
    const existingSubject = subjects.find((sub) => sub.id === id);
    const existingTeacher =
      existingSubject?.teacherEmail ||
      selectedSection.subjectTeachers?.[id] ||
      "";
    const isAssignedTeacher =
      existingTeacher &&
      (existingTeacher.trim().toLowerCase() === authEmail ||
        existingTeacher.trim().toLowerCase() === profEmail);

    if (!isAdmin && !isSectionAdviser && !isAssignedTeacher) {
      alert(
        "Only Administrators, Section Advisers, and the assigned Subject Teacher can modify subjects for this section.",
      );
      return;
    }

    // Clean undefined fields to prevent Firestore errors
    const cleanS = { ...s } as any;
    Object.keys(cleanS).forEach((key) => {
      if (cleanS[key] === undefined) {
        delete cleanS[key];
      }
    });

    try {
      await setDoc(
        doc(db, `sections/${selectedSection.id}/subjects`, id),
        {
          ...cleanS,
          schoolId: selectedSection.schoolId || userProfile?.schoolId || "",
          teacherEmail: s.teacherEmail
            ? s.teacherEmail.trim().toLowerCase()
            : "",
        },
        { merge: true },
      );
    } catch (error) {
      handleFirestoreError(
        error,
        "update",
        `sections/${selectedSection.id}/subjects/${id}`,
      );
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!selectedSection) return;
    const adviserEmail = (selectedSection.adviserEmail || "")
      .trim()
      .toLowerCase();
    const authEmail = (currentUser?.email || "").trim().toLowerCase();
    const profEmail = (userProfile?.email || "").trim().toLowerCase();
    const isSectionAdviser =
      adviserEmail &&
      (adviserEmail === authEmail || adviserEmail === profEmail);
    const isAdmin =
      userProfile?.role === "system_admin" || userProfile?.role === "admin";

    if (!isAdmin && !isSectionAdviser) {
      alert(
        "Only Administrators and Section Advisers can modify subjects for this section.",
      );
      return;
    }
    try {
      await deleteDoc(doc(db, `sections/${selectedSection.id}/subjects`, id));

      // If this subject is part of the global subjects chosen for this section, remove it
      if (selectedSection.globalSubjectIds?.includes(id)) {
        await updateDoc(doc(db, "sections", selectedSection.id), {
          globalSubjectIds: selectedSection.globalSubjectIds.filter(
            (gid) => gid !== id,
          ),
        });
      }
    } catch (error) {
      handleFirestoreError(
        error,
        "delete",
        `sections/${selectedSection.id}/subjects/${id}`,
      );
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
              <span className="text-[7px] sm:text-[8px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-0.5 hidden xs:inline">
                Enterprise Portal
              </span>
            </div>
          </div>

          {/* Quick Section Switcher Dropdown (Responsive for Mobile, Tablet, and Wide Screen) */}
          {selectedSection && (
            <div className="relative z-[110]">
              <button
                onClick={() => setIsSectionSwitcherOpen(!isSectionSwitcherOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/60 rounded-xl text-xs font-bold text-indigo-900 transition-all cursor-pointer shadow-2xs max-w-[140px] sm:max-w-[200px] md:max-w-[260px] truncate ${isSectionSwitcherOpen ? "ring-2 ring-indigo-400/40 bg-indigo-100" : ""}`}
                title="Click to switch section"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></div>
                <div className="flex flex-col items-start truncate min-w-0">
                  <span className="text-[11px] sm:text-xs font-black tracking-tight truncate w-full text-indigo-950">
                    {selectedSection.name}
                  </span>
                  <span className="text-[9px] font-semibold text-indigo-600/80 uppercase tracking-wider hidden sm:block truncate w-full">
                    {Number(selectedSection.gradeLevel) === 0
                      ? "Kindergarten"
                      : `Grade ${selectedSection.gradeLevel}`}{" "}
                    {selectedSection.schoolYear}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-indigo-500 shrink-0 transition-transform duration-200 ml-auto ${isSectionSwitcherOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isSectionSwitcherOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSectionSwitcherOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 shadow-xl rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Quick Switch Section
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {
                          sections.filter(
                            (s) =>
                              !globalSettings?.activeSchoolYear ||
                              s.schoolYear === globalSettings.activeSchoolYear,
                          ).length
                        }{" "}
                        Sections
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                      {sections
                        .filter(
                          (s) =>
                            !globalSettings?.activeSchoolYear ||
                            s.schoolYear === globalSettings.activeSchoolYear,
                        )
                        .map((sec) => {
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
                                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                                  : "hover:bg-slate-50 text-slate-700 font-medium"
                              }`}
                            >
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="font-bold truncate">
                                  {sec.name}
                                </span>
                                <span
                                  className={`text-[10px] ${isCurrent ? "text-indigo-100" : "text-slate-400"}`}
                                >
                                  {Number(sec.gradeLevel) === 0
                                    ? "Kindergarten"
                                    : `Grade ${sec.gradeLevel}`}{" "}
                                  Adviser: {sec.adviserName || "Unassigned"}
                                </span>
                              </div>
                              {isCurrent && (
                                <Check size={14} className="shrink-0" />
                              )}
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
                {
                  id: "dashboard",
                  label: "Dashboard",
                  shortLabel: "Dashboard",
                  icon: <LayoutDashboard size={14} />,
                },
                {
                  id: "enroll",
                  label: "Learner",
                  shortLabel: "Learner",
                  icon: <UserPlus size={14} />,
                },
                {
                  id: "subjects",
                  label: "Subjects",
                  shortLabel: "Subjects",
                  icon: <BookOpen size={14} />,
                },
                {
                  id: "gradebook",
                  label: "eClass Records",
                  shortLabel: "eClass Records",
                  icon: <TableIcon size={14} />,
                },
                {
                  id: "summary",
                  label: "Grading Sheet",
                  shortLabel: "Grading Sheet",
                  icon: <ClipboardCheck size={14} />,
                },
                {
                  id: "transfers",
                  label: "Transfer Facility",
                  shortLabel: "Transfers",
                  icon: <Share2 size={14} />,
                },
                {
                  id: "pta",
                  label: "PTA Fees",
                  shortLabel: "PTA Fees",
                  icon: <CreditCard size={14} />,
                },
                {
                  id: "sf2",
                  label: "School Form 2",
                  shortLabel: "SF2 Report",
                  icon: <FileText size={14} />,
                },
                {
                  id: "sf10",
                  label: "Learners Records",
                  shortLabel: "SF10 Record",
                  icon: <HistoryIcon size={14} />,
                },
                {
                  id: "attendance",
                  label: "Daily Attendance",
                  shortLabel: "Attendance",
                  icon: <Calendar size={14} />,
                },
                {
                  id: "observed-values",
                  label: "Teacher Comments/Remarks",
                  shortLabel: "Remarks",
                  icon: <Heart size={14} />,
                },
                {
                  id: "anecdotes",
                  label: "Anecdotal Records",
                  shortLabel: "Anecdotes",
                  icon: <MessageSquare size={14} />,
                },
                {
                  id: "sf8",
                  label: "School Form 8",
                  shortLabel: "SF8 Health",
                  icon: <Activity size={14} />,
                },
                {
                  id: "sf4",
                  label: "School Form 4",
                  shortLabel: "SF4 Report",
                  icon: <FileText size={14} />,
                },
                {
                  id: "sf7",
                  label: "School Form 7",
                  shortLabel: "SF7 Profile",
                  icon: <FileText size={14} />,
                },
                {
                  id: "guide",
                  label: "Guide",
                  shortLabel: "Guide",
                  icon: <HelpCircle size={14} />,
                },
                {
                  id: "sys-docs",
                  label: "System Documentation",
                  shortLabel: "Docs",
                  icon: <Terminal size={14} />,
                },
                {
                  id: "mysql",
                  label: "MySQL Database",
                  shortLabel: "Database",
                  icon: <Database size={14} />,
                },
                ...(currentUser?.email === "jessiemangabo@gmail.com"
                  ? [
                      {
                        id: "logs",
                        label: "VIEW LOGS & UNKNOWNS",
                        shortLabel: "Logs",
                        icon: <Terminal size={14} />,
                      },
                      {
                        id: "logs-clear",
                        label: "CLEAR UNKNOWN ONLY",
                        shortLabel: "Clear",
                        icon: <Trash2 size={14} />,
                      },
                    ]
                  : []),
              ];

              const allowedTabs = allTabs.filter((tab) => {
                if (
                  tab.id === "subjects" &&
                  userProfile?.role !== "system_admin" &&
                  userProfile?.role !== "admin" &&
                  !isSectionAdviser
                )
                  return false;
                if (tab.id === "logs" || tab.id === "logs-clear")
                  return currentUser?.email === "jessiemangabo@gmail.com";
                if (tab.id === "summary" && !isSectionAdviser) return false;
                if (
                  tab.id === "pta" &&
                  !(userProfile?.role === "teacher" && isSectionAdviser)
                )
                  return false;
                if (
                  tab.id === "gradebook" &&
                  (!editableSubjects || editableSubjects.length === 0) &&
                  !isSectionAdviser
                )
                  return false;
                if (
                  (tab.id === "attendance" || tab.id === "sf2") &&
                  !hasCalendarMatch
                )
                  return false;
                if (
                  tab.id === "sf4" &&
                  userProfile?.role !== "system_admin" &&
                  userProfile?.role !== "school_head" &&
                  !isAuthorizedCashier
                )
                  return false;
                if (
                  tab.id === "sf7" &&
                  userProfile?.role !== "system_admin" &&
                  userProfile?.role !== "admin"
                )
                  return false;

                if (
                  userProfile?.role === "system_admin" ||
                  userProfile?.role === "admin" ||
                  isAuthorizedCashier
                ) {
                  const allowedTabsList = [
                    "dashboard",
                    "enroll",
                    "subjects",
                    "pta",
                    "sf8",
                    "guide",
                    "sys-docs",
                    "gradebook",
                    "summary",
                    "attendance",
                    "observed-values",
                    "sf2",
                    "transfers",
                    "sf10",
                    "sf4",
                    "sf7",
                    "anecdotes",
                    "logs",
                    "logs-clear",
                    "aral",
                    "mysql",
                  ];
                  if (userProfile?.role === "system_admin") {
                    return allowedTabsList
                      .filter((id) => {
                        if (id === "summary" && !isSectionAdviser) return false;
                        if (
                          id === "gradebook" &&
                          !isSectionAdviser &&
                          (!editableSubjects || editableSubjects.length === 0)
                        )
                          return false;
                        return true;
                      })
                      .includes(tab.id);
                  }
                  if (isAuthorizedCashier)
                    return allowedTabsList.includes(tab.id);
                  return allowedTabsList
                    .filter((id) => id !== "sf4")
                    .includes(tab.id);
                }
                if (userProfile?.role === "school_head") {
                  return ["sf8", "sf4", "sf10", "anecdotes", "aral"].includes(
                    tab.id,
                  );
                }
                if (userProfile?.role === "guidance_designate") {
                  return ["anecdotes", "aral"].includes(tab.id);
                }
                if (userProfile?.role === "teacher") {
                  if (isSectionAdviser) {
                    return [
                      "dashboard",
                      "enroll",
                      "subjects",
                      "pta",
                      "sf8",
                      "sf10",
                      "attendance",
                      "observed-values",
                      "sf2",
                      "transfers",
                      "anecdotes",
                      "guide",
                      "gradebook",
                      "summary",
                      "aral",
                      "mysql",
                    ].includes(tab.id);
                  }
                  return (
                    tab.id === "gradebook" ||
                    tab.id === "dashboard" ||
                    tab.id === "anecdotes" ||
                    tab.id === "pta" ||
                    tab.id === "aral"
                  );
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
                      ? "text-indigo-600 bg-indigo-50/50 font-extrabold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {tab.icon}
                  <span className="uppercase tracking-wide">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="minimal-nav-active"
                      className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-indigo-600"
                    />
                  )}
                </button>
              );

              const mgmtTabs = allowedTabs.filter((t) =>
                ["enroll", "transfers", "sf8", "pta"].includes(t.id),
              );
              const attTabs = allowedTabs.filter((t) =>
                ["attendance", "sf2", "observed-values", "anecdotes"].includes(
                  t.id,
                ),
              );
              const academicTabs = allowedTabs.filter((t) =>
                [
                  "subjects",
                  "gradebook",
                  "summary",
                  "sf10",
                  "sf4",
                  "sf7",
                ].includes(t.id),
              );
              const supportTabsGroup = allowedTabs.filter((t) =>
                ["guide", "sys-docs", "mysql"].includes(t.id),
              );

              const renderDropdown = (
                id: string,
                label: string,
                icon: React.ReactNode,
                tabs: any[],
              ) => {
                if (tabs.length === 0) return null;
                const isOpen = openDropdown === id;
                const setIsOpen = (val: boolean) =>
                  setOpenDropdown(val ? id : null);

                return (
                  <div className="relative z-50">
                    <button
                      onClick={() => {
                        setIsOpen(!isOpen);
                        setIsSettingsDropdownOpen(false);
                      }}
                      className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all relative ${
                        tabs.some((t) => t.id === activeTab)
                          ? "text-indigo-600 bg-indigo-50/50"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      {icon}
                      <span className="uppercase tracking-wide">{label}</span>
                      <ChevronDown
                        size={14}
                        className={`opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                      {tabs.some((t) => t.id === activeTab) && (
                        <motion.div
                          layoutId="minimal-nav-active"
                          className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-indigo-600"
                        />
                      )}
                    </button>
                    {isOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute block top-full pt-4 left-0 w-56 z-50">
                          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex flex-col gap-1">
                            {tabs.map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => {
                                  setActiveTab(tab.id as any);
                                  setIsOpen(false);
                                }}
                                className={`flex shrink-0 items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all text-left ${
                                  activeTab === tab.id
                                    ? "text-indigo-600 bg-indigo-50/70 font-extrabold"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {tab.icon}
                                  <span className="uppercase tracking-wider">
                                    {tab.label}
                                  </span>
                                </div>
                                {activeTab === tab.id && (
                                  <ChevronRight
                                    size={14}
                                    className="text-indigo-600"
                                  />
                                )}
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
                  {allowedTabs.find((t) => t.id === "dashboard") &&
                    renderButton(allowedTabs.find((t) => t.id === "dashboard"))}

                  {renderDropdown(
                    "student-mgmt",
                    "Student Management",
                    <Users size={14} />,
                    mgmtTabs,
                  )}
                  {renderDropdown(
                    "attendance",
                    "Attendance & Behavior",
                    <Calendar size={14} />,
                    attTabs,
                  )}

                  {renderDropdown(
                    "academic",
                    "Academic Records",
                    <BookOpen size={14} />,
                    academicTabs,
                  )}
                  {renderDropdown(
                    "support",
                    "Support",
                    <HelpCircle size={14} />,
                    supportTabsGroup,
                  )}

                  {/* Settings Menu Submenu */}
                  {(userProfile?.role === "admin" ||
                    userProfile?.role === "system_admin") && (
                    <div className="relative z-50 ml-2 border-l border-slate-100 pl-2">
                      <button
                        onClick={() => {
                          setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
                          setOpenDropdown(null);
                        }}
                        className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all relative ${
                          isSettingsDropdownOpen
                            ? "text-indigo-600 bg-indigo-50/50"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Settings size={14} />
                        <span className="uppercase tracking-wide">
                          Settings Menu
                        </span>
                        <ChevronDown
                          size={14}
                          className={`opacity-50 transition-transform ${isSettingsDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isSettingsDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsSettingsDropdownOpen(false)}
                          />
                          <div className="absolute block top-full pt-4 left-0 w-56 z-50">
                            <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-2 flex flex-col gap-1">
                              <button
                                onClick={() => {
                                  setShowAdminUsers(true);
                                  setIsSettingsDropdownOpen(false);
                                }}
                              >
                                <Users size={14} />{" "}
                                <span className="uppercase tracking-wider">
                                  Manage Users
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveTab("mysql");
                                  setIsSettingsDropdownOpen(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-50 w-full text-left cursor-pointer"
                              >
                                <Database
                                  size={14}
                                  className="text-indigo-600"
                                />{" "}
                                <span className="uppercase tracking-wider">
                                  MySQL Database & Migration
                                </span>
                              </button>
                              <button
                                style={{ display: "none" }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-50 w-full text-left cursor-pointer"
                              >
                                <Users size={14} />{" "}
                                <span className="uppercase tracking-wider">
                                  Manage Users
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  openGlobalScanner();
                                  setIsSettingsDropdownOpen(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-indigo-50 hover:text-indigo-700 border-b border-slate-50 w-full text-left cursor-pointer"
                              >
                                <QrCode size={14} />{" "}
                                <span className="uppercase tracking-wider">
                                  Scan ID
                                </span>
                              </button>
                              {userProfile?.role === "system_admin" && (
                                <button
                                  onClick={() => {
                                    setActiveTab("subjects");
                                    setIsSettingsDropdownOpen(false);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-50 w-full text-left"
                                >
                                  <BookOpen size={14} />{" "}
                                  <span className="uppercase tracking-wider">
                                    Subject Menu
                                  </span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setShowAdminSchools(true);
                                  setIsSettingsDropdownOpen(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-50 w-full text-left"
                              >
                                <Building size={14} />{" "}
                                <span className="uppercase tracking-wider">
                                  Manage School
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setShowAdminSchoolYear(true);
                                  setIsSettingsDropdownOpen(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-50 w-full text-left"
                              >
                                <Calendar size={14} />{" "}
                                <span className="uppercase tracking-wider">
                                  School Year
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setShowAdminSchoolCalendar(true);
                                  setIsSettingsDropdownOpen(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-50 w-full text-left"
                              >
                                <Calendar size={14} />{" "}
                                <span className="uppercase tracking-wider">
                                  School Calendar
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setShowAdminFeedback(true);
                                  setIsSettingsDropdownOpen(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 w-full text-left"
                              >
                                <Sparkles size={14} />{" "}
                                <span className="uppercase tracking-wider">
                                  Feedback Dashboard
                                </span>
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
            <span className="hidden sm:inline uppercase tracking-wider text-[11px]">
              Section Menu
            </span>
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
            {
              id: "dashboard",
              label: "Dashboard",
              icon: <LayoutDashboard size={14} />,
            },
            { id: "enroll", label: "Learner", icon: <UserPlus size={14} /> },
            { id: "subjects", label: "Subjects", icon: <BookOpen size={14} /> },
            {
              id: "gradebook",
              label: "eClass Records",
              icon: <TableIcon size={14} />,
            },
            {
              id: "summary",
              label: "Grading Sheet",
              icon: <ClipboardCheck size={14} />,
            },
            { id: "sf8", label: "SF8 Health", icon: <Activity size={14} /> },
            { id: "transfers", label: "Transfers", icon: <Share2 size={14} /> },
            {
              id: "attendance",
              label: "Attendance",
              icon: <Calendar size={14} />,
            },
            { id: "sf2", label: "SF2 Report", icon: <FileText size={14} /> },
            {
              id: "observed-values",
              label: "Remarks",
              icon: <Heart size={14} />,
            },
            {
              id: "anecdotes",
              label: "Anecdotes",
              icon: <MessageSquare size={14} />,
            },
            {
              id: "sf10",
              label: "SF10 Record",
              icon: <HistoryIcon size={14} />,
            },
            { id: "pta", label: "PTA Fees", icon: <CreditCard size={14} /> },
            { id: "guide", label: "Guide", icon: <HelpCircle size={14} /> },
          ];

          return allTabs
            .filter((tab) => {
              if (
                tab.id === "subjects" &&
                userProfile?.role !== "system_admin" &&
                userProfile?.role !== "admin" &&
                !isSectionAdviser
              )
                return false;
              if (tab.id === "summary" && !isSectionAdviser) return false;
              if (
                tab.id === "pta" &&
                !(userProfile?.role === "teacher" && isSectionAdviser)
              )
                return false;
              if (
                tab.id === "gradebook" &&
                (!editableSubjects || editableSubjects.length === 0) &&
                !isSectionAdviser
              )
                return false;
              if (
                (tab.id === "attendance" || tab.id === "sf2") &&
                !hasCalendarMatch
              )
                return false;

              if (
                userProfile?.role === "system_admin" ||
                userProfile?.role === "admin"
              )
                return true;
              if (userProfile?.role === "school_head")
                return ["sf8", "sf10", "anecdotes"].includes(tab.id);
              if (userProfile?.role === "guidance_designate")
                return ["anecdotes"].includes(tab.id);
              if (userProfile?.role === "teacher") {
                if (isSectionAdviser) return true;
                return ["gradebook", "dashboard", "anecdotes", "pta"].includes(
                  tab.id,
                );
              }
              return true;
            })
            .map((tab) => (
              <button
                key={"sub-bar-" + tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 shrink-0 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 snap-start ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
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
                    <h2 className="text-base font-black text-slate-900 dark:text-white truncate">
                      Section Navigation
                    </h2>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-500 truncate">
                      {selectedSection?.name} Grade{" "}
                      {selectedSection?.gradeLevel}
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
                      icon: (
                        <LayoutDashboard
                          size={16}
                          className="text-indigo-600"
                        />
                      ),
                      tabs: [
                        {
                          id: "dashboard",
                          label: "Section Dashboard",
                          desc: "Overview & key metrics",
                          icon: <LayoutDashboard size={18} />,
                        },
                      ],
                    },
                    {
                      name: "Student Management",
                      icon: <Users size={16} className="text-emerald-600" />,
                      tabs: [
                        {
                          id: "enroll",
                          label: "Learner Roster",
                          desc: "Enrolled students & profiles",
                          icon: <UserPlus size={18} />,
                        },
                        {
                          id: "transfers",
                          label: "Transfer Facility",
                          desc: "Process learner transfers",
                          icon: <Share2 size={18} />,
                        },
                        {
                          id: "sf8",
                          label: "School Form 8 (Health)",
                          desc: "BMI & physical assessment",
                          icon: <Activity size={18} />,
                        },
                        {
                          id: "pta",
                          label: "PTA Fees",
                          desc: "PTA collection & records",
                          icon: <CreditCard size={18} />,
                        },
                      ],
                    },
                    {
                      name: "Attendance & Behavior",
                      icon: <Calendar size={16} className="text-amber-600" />,
                      tabs: [
                        {
                          id: "attendance",
                          label: "Daily Attendance",
                          desc: "Track daily attendance",
                          icon: <Calendar size={18} />,
                        },
                        {
                          id: "sf2",
                          label: "School Form 2 (SF2)",
                          desc: "Monthly attendance summary",
                          icon: <FileText size={18} />,
                        },
                        {
                          id: "observed-values",
                          label: "Teacher Remarks",
                          desc: "Core values & character",
                          icon: <Heart size={18} />,
                        },
                        {
                          id: "anecdotes",
                          label: "Anecdotal Records",
                          desc: "Behavioral logs & notes",
                          icon: <MessageSquare size={18} />,
                        },
                      ],
                    },
                    {
                      name: "Academic Records",
                      icon: <BookOpen size={16} className="text-sky-600" />,
                      tabs: [
                        {
                          id: "subjects",
                          label: "Section Subjects",
                          desc: "Subject assignments",
                          icon: <BookOpen size={18} />,
                        },
                        {
                          id: "gradebook",
                          label: "eClass Records",
                          desc: "Input grades & exam scores",
                          icon: <TableIcon size={18} />,
                        },
                        {
                          id: "summary",
                          label: "Grading Sheet",
                          desc: "Quarterly summary sheet",
                          icon: <ClipboardCheck size={18} />,
                        },
                        {
                          id: "sf10",
                          label: "Learner Record (SF10)",
                          desc: "Permanent transcript",
                          icon: <HistoryIcon size={18} />,
                        },
                        {
                          id: "sf4",
                          label: "School Form 4 (SF4)",
                          desc: "Monthly movement summary",
                          icon: <FileText size={18} />,
                        },
                        {
                          id: "sf7",
                          label: "School Form 7 (SF7)",
                          desc: "Personnel assignments",
                          icon: <FileText size={18} />,
                        },
                        {
                          id: "aral",
                          label: "ARAL Program",
                          desc: "Intervention program",
                          icon: <Sparkles size={18} />,
                        },
                      ],
                    },
                    {
                      name: "Support & Help",
                      icon: (
                        <HelpCircle size={16} className="text-purple-600" />
                      ),
                      tabs: [
                        {
                          id: "guide",
                          label: "User Guide",
                          desc: "Help & instructions",
                          icon: <HelpCircle size={18} />,
                        },
                        {
                          id: "sys-docs",
                          label: "System Documentation",
                          desc: "Features & specs",
                          icon: <Terminal size={18} />,
                        },
                        {
                          id: "mysql",
                          label: "MySQL Database & Migration",
                          desc: "Manage SQL tables & migrate data",
                          icon: <Database size={18} />,
                        },
                      ],
                    },
                  ];

                  // Filter allowed tabs for mobile
                  const filterAllowed = (tabId: string) => {
                    if (
                      tabId === "subjects" &&
                      userProfile?.role !== "system_admin" &&
                      userProfile?.role !== "admin" &&
                      !isSectionAdviser
                    )
                      return false;
                    if (tabId === "summary" && !isSectionAdviser) return false;
                    if (
                      tabId === "pta" &&
                      !(userProfile?.role === "teacher" && isSectionAdviser)
                    )
                      return false;
                    if (
                      tabId === "gradebook" &&
                      (!editableSubjects || editableSubjects.length === 0) &&
                      !isSectionAdviser
                    )
                      return false;
                    if (
                      (tabId === "attendance" || tabId === "sf2") &&
                      !hasCalendarMatch
                    )
                      return false;
                    if (
                      tabId === "sf4" &&
                      userProfile?.role !== "system_admin" &&
                      userProfile?.role !== "school_head" &&
                      !isAuthorizedCashier
                    )
                      return false;
                    if (
                      tabId === "sf7" &&
                      userProfile?.role !== "system_admin" &&
                      userProfile?.role !== "admin"
                    )
                      return false;

                    if (
                      userProfile?.role === "system_admin" ||
                      userProfile?.role === "admin" ||
                      isAuthorizedCashier
                    )
                      return true;
                    if (userProfile?.role === "school_head")
                      return [
                        "sf8",
                        "sf4",
                        "sf10",
                        "anecdotes",
                        "aral",
                      ].includes(tabId);
                    if (userProfile?.role === "guidance_designate")
                      return ["anecdotes", "aral"].includes(tabId);
                    if (userProfile?.role === "teacher") {
                      if (isSectionAdviser) return true;
                      return [
                        "gradebook",
                        "dashboard",
                        "anecdotes",
                        "pta",
                        "aral",
                      ].includes(tabId);
                    }
                    return true;
                  };

                  return (
                    <>
                      {categories.map((cat) => {
                        const validTabs = cat.tabs.filter((t) =>
                          filterAllowed(t.id),
                        );
                        if (validTabs.length === 0) return null;

                        return (
                          <div key={cat.name} className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                              {cat.icon}
                              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                                {cat.name}
                              </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {validTabs.map((t) => {
                                const isActive = activeTab === t.id;
                                return (
                                  <button
                                    key={"drawer-tab-" + t.id}
                                    onClick={() => {
                                      setActiveTab(t.id as any);
                                      setIsMobileNavOpen(false);
                                    }}
                                    className={`flex items-start gap-3 p-3 rounded-2xl transition-all text-left border cursor-pointer ${
                                      isActive
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                        : "bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-slate-700/60"
                                    }`}
                                  >
                                    <div
                                      className={`p-2 rounded-xl shrink-0 ${
                                        isActive
                                          ? "bg-white/20 text-white"
                                          : "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-500 shadow-2xs"
                                      }`}
                                    >
                                      {t.icon}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span className="text-xs font-bold leading-snug truncate">
                                        {t.label}
                                      </span>
                                      <span
                                        className={`text-[10px] mt-0.5 truncate ${isActive ? "text-indigo-100" : "text-slate-400 dark:text-slate-400"}`}
                                      >
                                        {t.desc}
                                      </span>
                                    </div>
                                    {isActive && (
                                      <CheckCircle
                                        size={16}
                                        className="text-white shrink-0 mt-0.5"
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Admin Settings Section inside Mobile/Tablet Drawer */}
                      {(userProfile?.role === "admin" ||
                        userProfile?.role === "system_admin") && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 px-1">
                            <Settings size={16} className="text-slate-500" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                              Settings Menu
                            </h3>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <button
                              onClick={() => {
                                setActiveTab("mysql");
                                setIsMobileNavOpen(false);
                              }}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-900/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/60 dark:border-indigo-700/60 col-span-2 sm:col-span-3"
                            >
                              <Database
                                size={14}
                                className="text-indigo-600 dark:text-indigo-400"
                              />
                              <span className="truncate">
                                MySQL Database & Migration Engine
                              </span>
                            </button>
                            <button
                              onClick={() => {
                                setShowAdminUsers(true);
                                setIsMobileNavOpen(false);
                              }}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/60 dark:border-slate-700"
                            >
                              <Users size={14} className="text-slate-400" />
                              <span className="truncate">Manage Users</span>
                            </button>
                            <button
                              onClick={() => {
                                openGlobalScanner();
                                setIsMobileNavOpen(false);
                              }}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/60 dark:border-slate-700"
                            >
                              <QrCode size={14} className="text-indigo-600" />
                              <span className="truncate">Scan ID</span>
                            </button>
                            {userProfile?.role === "system_admin" && (
                              <button
                                onClick={() => {
                                  setActiveTab("subjects");
                                  setIsMobileNavOpen(false);
                                }}
                                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/60 dark:border-slate-700"
                              >
                                <BookOpen
                                  size={14}
                                  className="text-slate-400"
                                />
                                <span className="truncate">Subject Menu</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setShowAdminSchools(true);
                                setIsMobileNavOpen(false);
                              }}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/60 dark:border-slate-700"
                            >
                              <Building size={14} className="text-slate-400" />
                              <span className="truncate">Manage School</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowAdminSchoolYear(true);
                                setIsMobileNavOpen(false);
                              }}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/60 dark:border-slate-700"
                            >
                              <Calendar size={14} className="text-slate-400" />
                              <span className="truncate">School Year</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowAdminSchoolCalendar(true);
                                setIsMobileNavOpen(false);
                              }}
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
      <main
        className={`flex-1 overflow-auto bg-[#fcfdfe] scroll-smooth custom-scrollbar ${["gradebook", "summary", "dashboard", "subjects", "enroll", "guide", "sf8", "transfers", "sf10", "observed-values", "pta", "tle-dashboard"].includes(activeTab) ? "p-0" : "p-6 md:p-12"}`}
      >
        <div
          className={`${["gradebook", "summary", "dashboard", "subjects", "enroll", "guide", "sf8", "transfers", "sf10", "observed-values", "pta", "tle-dashboard"].includes(activeTab) ? "w-full" : "max-w-full 2xl:max-w-[1600px] mx-auto w-full"}`}
        >
          <AnimatePresence mode="wait">
            {activeTab === "tle-dashboard" && (
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
                  onBack={() => setActiveTab("dashboard")}
                />
              </motion.div>
            )}

            {activeTab === "dashboard" && (
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
                    setActiveTab("gradebook");
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
            {activeTab === "gradebook" && (
              <motion.div
                key="gradebook"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <GradebookView
                  subjects={
                    userProfile?.role === "system_admin" ||
                    userProfile?.role === "admin" ||
                    userProfile?.role === "school_head" ||
                    isSectionAdviser
                      ? subjects
                      : editableSubjects
                  }
                  selectedSubjectId={selectedSubjectId}
                  onSelectSubject={setSelectedSubjectId}
                  students={
                    combinedTleStudents.length > 0
                      ? combinedTleStudents
                      : enrolledStudents
                  }
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
            {activeTab === "summary" && (
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
            {activeTab === "transfers" && (
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
            {activeTab === "enroll" && (
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
                      sex: "Male",
                      weight: "",
                      height: "",
                      attendance: {},
                      birthplace: "",
                      address: "",
                      fatherName: "",
                      motherName: "",
                      guardianName: "",
                      guardianRelationship: "",
                      primaryContact: "guardian",
                      contactNumber: "",
                      nutritionalStatus: {},
                      isTransferredIn: false,
                      siblingIds: [],
                      enrolledSubjectIds: [],
                      eligibility: {
                        type: "Elementary School Completer",
                      } as any,
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
                    setActiveTab("anecdotes");
                  }}
                  globalSubjects={globalSubjects}
                  subjects={subjects}
                />
              </motion.div>
            )}
            {activeTab === "subjects" && (
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
                  onBack={() => setActiveTab("dashboard")}
                />
              </motion.div>
            )}
            {(activeTab === "attendance" || activeTab === "sf2") &&
              selectedSection && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                        {activeTab === "sf2"
                          ? "School Form 2 Report"
                          : "Daily Attendance"}
                      </h2>
                      <p className="text-sm text-slate-500 font-medium">
                        {activeTab === "sf2"
                          ? "Summary report of learner attendance."
                          : "Record and manage learner daily attendance."}
                      </p>
                    </div>
                    {userProfile?.role === "system_admin" && (
                      <PrintAllSF2Button
                        sections={sections}
                        schoolYear={globalSettings?.activeSchoolYear || ""}
                        currentUser={currentUser}
                        schoolCalendar={schoolCalendar}
                      />
                    )}
                  </div>
                  {activeTab === "sf2" ? (
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
                      schoolName={
                        selectedSection?.schoolName || activeSchool?.name
                      }
                      schoolId={
                        selectedSection?.schoolId || activeSchool?.schoolId
                      }
                      division={
                        selectedSection?.division || activeSchool?.division
                      }
                      region={selectedSection?.region || activeSchool?.region}
                      onScanID={openGlobalScanner}
                    />
                  )}
                </motion.div>
              )}
            {activeTab === "observed-values" && selectedSection && (
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
            {activeTab === "anecdotes" && (
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
                  onClearPreselectedStudent={() =>
                    setPreselectedStudentForAnecdotal(null)
                  }
                />
              </motion.div>
            )}
            {activeTab === "pta" && (
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
            {activeTab === "guide" && (
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
            {activeTab === "sys-docs" && (
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

            {activeTab === "sf8" && (
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
            {activeTab === "sf10" && (
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

            {activeTab === "sf4" &&
              (userProfile?.role === "system_admin" ||
                userProfile?.role === "school_head") &&
              userProfile?.schoolId && (
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

            {activeTab === "sf7" && userProfile?.schoolId && (
              <motion.div
                key="sf7"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SF7ReportView
                  schoolId={userProfile.schoolId}
                  activeSchoolYear={
                    selectedSection?.schoolYear ||
                    globalSettings?.activeSchoolYear ||
                    "2026-2027"
                  }
                  userProfile={userProfile}
                />
              </motion.div>
            )}

            {activeTab === "mysql" && (
              <motion.div
                key="mysql"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <MysqlManagerView currentUser={userProfile} />
              </motion.div>
            )}
            {activeTab === "aral" && (
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
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
          {" "}
          2024 Centralized Learner Assessment & School System Professional
          Edition
        </p>
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
                  globalSubjects,
                );
                const allSubjectIds = connectedSubjects.map((s) => s.id);

                if (allSubjectIds.length === 0) {
                  setEnrollAllErrorMsg(
                    "This section does not have any curriculum subjects configured. Please configure or add subjects first.",
                  );
                  setEnrollAllProcessing(false);
                  return;
                }

                const batch = writeBatch(db);
                unenrolledStudents.forEach((student) => {
                  batch.set(
                    doc(
                      db,
                      `sections/${selectedSection!.id}/students`,
                      student.id,
                    ),
                    { enrolledSubjectIds: allSubjectIds },
                    { merge: true },
                  );
                });
                await batch.commit();
                setEnrollAllSuccessMsg(
                  `Successfully enrolled all ${unenrolledStudents.length} pending learner(s) in ${allSubjectIds.length} subjects!`,
                );
                setEnrollAllModalOpen(false);
              } catch (error: any) {
                console.error("Enroll All Learners Error:", error);
                setEnrollAllErrorMsg(
                  error?.message || "Failed to complete enrollment batch.",
                );
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
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">
                Enrollment Completed
              </h2>
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
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">
                Enrollment Failed
              </h2>
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
            subjects={subjects
              .slice()
              .sort((a, b) => (a.order || 0) - (b.order || 0))}
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

              <h3 className="text-xl font-black text-slate-900 mb-2">
                Finalize Section?
              </h3>

              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Are you sure you want to finalize this section? This will lock
                all student records, compute final averages, and set statuses.
                This action is irreversible without requesting unfinalization.
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

              <h3 className="text-xl font-black text-slate-900 mb-2">
                {userProfile?.role === "system_admin"
                  ? "Unfinalize Section?"
                  : "Request Unfinalize Section?"}
              </h3>

              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                {userProfile?.role === "system_admin"
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
        onResetSettings={() =>
          handleUpdateThemeSettings(DEFAULT_THEME_SETTINGS)
        }
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
  onReasonChange,
}: {
  student: Student;
  newStatus: "Transferred Out" | "Dropped Out" | "Retained" | "Promoted";
  onConfirm: () => void;
  onCancel: () => void;
  date: string;
  onDateChange: (d: string) => void;
  reason: string;
  onReasonChange: (r: string) => void;
}) {
  const isTransfer = newStatus === "Transferred Out";
  const isDrop = newStatus === "Dropped Out";
  const isPromoted = newStatus === "Promoted";
  const label = isTransfer
    ? "Transfer Out"
    : isDrop
      ? "Drop Out"
      : isPromoted
        ? "Mark as Promoted"
        : "Mark as Retained";
  const color = isTransfer
    ? "rose"
    : isDrop
      ? "orange"
      : isPromoted
        ? "emerald"
        : "indigo";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
      >
        <div
          className={`bg-${color}-50 px-8 py-6 border-b border-${color}-100 flex items-center gap-4`}
        >
          <div className={`p-3 bg-${color}-100 text-${color}-600 rounded-2xl`}>
            {isTransfer ? <Share2 size={24} /> : <UserMinus size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Confirm {label}
            </h3>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
              {formatStudentName(student)}
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
              "Are you sure you want to mark this learner as{" "}
              <span className={`font-bold text-${color}-600`}>{newStatus}</span>
              ? This will affect monthly enrollment reports and the Learner
              Permanent Record."
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                Date of {isTransfer ? "Transfer" : "Last Attendance"}
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium ml-1">
                This date determines which month the learner is counted as{" "}
                {isTransfer ? "transferred" : "dropped"} in the SF4 report.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                Reason for {isTransfer ? "Transfer/School" : "Dropping Out"}{" "}
                (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={
                    isTransfer
                      ? "School transferred to..."
                      : "Reason for dropping out..."
                  }
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

export function SectionForm({
  initialData,
  onSubmit,
  buttonLabel,
  user,
  globalSubjects = [],
}: {
  initialData?: any;
  onSubmit: (data: any) => void;
  buttonLabel: string;
  user?: UserProfile | null;
  globalSubjects?: Subject[];
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
    schoolId:
      initialData?.schoolId ||
      (user?.role === "system_admin" ? user?.schoolId || "" : ""),
    schoolYear: initialData?.schoolYear || "",
    globalSubjectIds: initialData?.globalSubjectIds || [],
    subjectTeachers: initialData?.subjectTeachers || {},
  });

  const [availableSchools, setAvailableSchools] = useState<any[]>([]);
  const [availableSchoolYears, setAvailableSchoolYears] = useState<string[]>(
    [],
  );
  const [activeSchoolYear, setActiveSchoolYear] = useState<string | null>(null);
  const [advisoryCandidates, setAdvisoryCandidates] = useState<UserProfile[]>(
    [],
  );

  useEffect(() => {
    if (!form.schoolId) {
      setAdvisoryCandidates([]);
      return;
    }
    const q = query(
      collection(db, "users"),
      where("schoolId", "==", form.schoolId),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const candidates: UserProfile[] = [];
        snap.forEach((docSnap) => {
          const u = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
          if (u.role !== "student") {
            candidates.push(u);
          }
        });
        candidates.sort((a, b) =>
          (a.displayName || a.email || "").localeCompare(
            b.displayName || b.email || "",
          ),
        );
        setAdvisoryCandidates(candidates);
      },
      (err) => {
        console.error("Error fetching advisory candidates:", err);
      },
    );
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
    const unsub = onSnapshot(
      doc(db, "settings", "general"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const activeYears = (data.schoolYears || []).filter(
            (sy: string) => !(data.closedSchoolYears || []).includes(sy),
          );
          setAvailableSchoolYears(activeYears);
          setActiveSchoolYear(data.activeSchoolYear || null);
          const defaultYear =
            data.activeSchoolYear ||
            (activeYears.length > 0 ? activeYears[0] : "");
          if (defaultYear && !form.schoolYear) {
            setForm((prev) => ({ ...prev, schoolYear: defaultYear }));
          }
        }
      },
      (err) => {
        handleFirestoreError(err, "get", "settings/general");
      },
    );
    return unsub;
  }, [form.schoolYear, user]);

  useEffect(() => {
    // Both admins and system admins can see the full school list to pick from.
    if (user?.role === "admin" || user?.role === "system_admin") {
      const q = query(collection(db, "schools"));
      getDocs(q)
        .then((snap) => {
          setAvailableSchools(
            snap.docs.map((d) => ({ ...d.data(), id: d.id })),
          );
        })
        .catch((err) =>
          console.error("Error fetching available schools:", err),
        );
    }
  }, [user]);

  useEffect(() => {
    if (
      !initialData &&
      user?.role === "system_admin" &&
      user?.schoolId &&
      !form.schoolId
    ) {
      setForm((prev) => ({ ...prev, schoolId: user.schoolId || "" }));
    }
  }, [user, form.schoolId, initialData]);

  useEffect(() => {
    const fetchSchoolDetails = async () => {
      if (!form.schoolId) return;

      try {
        const q = query(
          collection(db, "schools"),
          where("schoolId", "==", form.schoolId),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const schoolData = snap.docs[0].data();
          setForm((prev) => ({
            ...prev,
            schoolName: schoolData.name || prev.schoolName,
            region: schoolData.region || prev.region,
            division: schoolData.division || prev.division,
            district: schoolData.district || prev.district,
            headOfSchool: schoolData.headOfSchool || prev.headOfSchool,
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
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
            Section Name
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all"
            placeholder="e.g. Einstein"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
            Grade Level
          </label>
          <select
            value={form.grade}
            onChange={(e) =>
              setForm({
                ...form,
                grade: e.target.value === "" ? "" : parseInt(e.target.value),
              })
            }
            className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all"
          >
            <option value="" disabled>
              Select Grade Level
            </option>
            <option value="0">Kindergarten</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <option key={n} value={n}>
                Grade {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
            Adviser Name
          </label>
          {advisoryCandidates.length > 0 ? (
            <select
              value={form.adviserEmail || ""}
              onChange={(e) => {
                const val = e.target.value;
                const matched = advisoryCandidates.find((c) => c.email === val);
                setForm((prev) => ({
                  ...prev,
                  adviserName: matched
                    ? matched.displayName || matched.email
                    : val,
                  adviserEmail: val,
                }));
              }}
              className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all text-slate-800"
            >
              <option value="" disabled>
                Select Class Adviser...
              </option>
              {form.adviserEmail &&
                !advisoryCandidates.some(
                  (c) => c.email === form.adviserEmail,
                ) && (
                  <option value={form.adviserEmail}>
                    {form.adviserName || form.adviserEmail}
                  </option>
                )}
              {advisoryCandidates.map((c) => {
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
              onChange={(e) =>
                setForm({ ...form, adviserName: e.target.value })
              }
              className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all text-slate-800"
              placeholder="No registered users found. Type manually..."
            />
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
            Adviser Email
          </label>
          <input
            value={form.adviserEmail}
            onChange={(e) => setForm({ ...form, adviserEmail: e.target.value })}
            readOnly={
              !!form.adviserEmail &&
              advisoryCandidates.some((c) => c.email === form.adviserEmail)
            }
            className={`w-full h-11 px-4 border border-slate-200 rounded-lg outline-none font-semibold text-sm transition-all ${
              form.adviserEmail &&
              advisoryCandidates.some((c) => c.email === form.adviserEmail)
                ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                : "bg-slate-50/50 focus:border-indigo-500 text-slate-850"
            }`}
            placeholder="Enter Teacher's Email"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
            Select School ID <span className="text-rose-500">*</span>
          </label>
          {user?.role === "admin" || user?.role === "system_admin" ? (
            <select
              value={form.schoolId}
              required
              onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
              className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all"
            >
              <option value="" disabled>
                Select a School
              </option>
              {availableSchools.map((s) => (
                <option key={s.id} value={s.schoolId}>
                  {s.schoolId} - {s.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={form.schoolId}
              required
              onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all"
              placeholder="School ID"
            />
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
            School Name
          </label>
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
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
            Region
          </label>
          <input
            value={form.region}
            readOnly
            className="w-full h-11 px-4 bg-slate-100/50 border border-slate-200 rounded-lg outline-none font-semibold text-sm text-slate-500 cursor-not-allowed transition-all"
            placeholder="Auto-filled Region"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
            Division
          </label>
          <input
            value={form.division}
            readOnly
            className="w-full h-11 px-4 bg-slate-100/50 border border-slate-200 rounded-lg outline-none font-semibold text-sm text-slate-500 cursor-not-allowed transition-all"
            placeholder="Auto-filled Division"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
            District
          </label>
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
            onChange={(e) => setForm({ ...form, schoolYear: e.target.value })}
            className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all"
          >
            {schoolYearsToDisplay.map((sy) => (
              <option key={sy} value={sy}>
                {sy}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={form.schoolYear}
            onChange={(e) => setForm({ ...form, schoolYear: e.target.value })}
            className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-sm transition-all"
            placeholder="e.g. 2023-2024"
          />
        )}
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={() => {
            if (!form.schoolYear || !form.schoolId) {
              if (!form.schoolId) alert("School ID is required.");
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
              schoolYear: form.schoolYear,
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
  onDemoLogin,
}: {
  onLogin: () => void;
  isLoading?: boolean;
  loginError?: string | null;
  onDemoLogin?: (
    role: "admin" | "system_admin" | "school_head" | "teacher" | "student",
  ) => void;
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
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                Official DepEd Portal
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug text-center mt-1">
                Centralized Learner Assessment <br />
                &amp; School System
              </h1>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Class Record &amp; Enterprise School Management
            </p>
          </div>
        </div>

        {loginError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-left flex items-start gap-3 shadow-sm"
          >
            <AlertTriangle
              className="text-amber-600 shrink-0 mt-0.5"
              size={20}
            />
            <div className="text-xs text-amber-900 leading-relaxed font-medium">
              <p className="font-bold text-amber-950 mb-1">
                Authentication Alert
              </p>
              <p>{loginError}</p>
              <p className="mt-2 text-[11px] text-amber-700 font-semibold">
                Tip: You can use{" "}
                <button
                  type="button"
                  onClick={() => setShowDemoOptions(true)}
                  className="underline font-bold text-indigo-700 hover:text-indigo-800"
                >
                  Quick Access / Demo Login
                </button>{" "}
                below to test any role directly.
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
              <span className="text-sm font-bold">
                Secure Log In with Google
              </span>
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </>
          )}
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            or direct portal access
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowDemoOptions(!showDemoOptions)}
          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 h-12 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors mb-3"
        >
          <Sparkles size={16} className="text-indigo-600" />
          {showDemoOptions
            ? "Hide Demo / Quick Access Portals"
            : "Quick Access / Demo Login"}
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
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                  Select Role to Login Instantly
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => onDemoLogin?.("admin")}
                    className="p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-indigo-300 flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                      <Shield size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                        System Admin
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Dr. Jessie J. Mangabo
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => onDemoLogin?.("school_head")}
                    className="p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-purple-300 flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600">
                        School Head
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Principal / Administrator
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => onDemoLogin?.("teacher")}
                    className="p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-emerald-300 flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">
                        Teacher / Adviser
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Subject / Class Teacher
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => onDemoLogin?.("student")}
                    className="p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-amber-300 flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                      <User size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600">
                        Student Portal
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Learner Class Card &amp; SF9
                      </div>
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
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Pricing &amp; Payment
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Flexible pricing based on your school's size
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                The Centralized Learner Assessment & School System offers
                flexible pricing based on your school's size. Fees are collected
                per year of use.{" "}
                <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Free for First year of access.
                </span>
              </p>

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
                      <td className="px-5 py-3 font-medium text-slate-700">
                        Small
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        9 &amp; below
                      </td>
                      <td className="px-5 py-3 font-semibold text-indigo-600">
                        P599
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">
                        Medium
                      </td>
                      <td className="px-5 py-3 text-slate-500">10 25</td>
                      <td className="px-5 py-3 font-semibold text-indigo-600">
                        P1,199
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">
                        Large
                      </td>
                      <td className="px-5 py-3 text-slate-500">26 100</td>
                      <td className="px-5 py-3 font-semibold text-indigo-600">
                        P2,499
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">
                        Mega
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        101 &amp; above
                      </td>
                      <td className="px-5 py-3 font-semibold text-indigo-600">
                        P4,999
                      </td>
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
                    We currently support payments via{" "}
                    <strong>GCash / Digital Transfer</strong>. Please send your
                    payment to the following number:
                  </p>
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-fit">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        GCash Number
                      </p>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">
                        0905 152 6827
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs italic">
                    *After payment, please contact the administrator with your
                    proof of payment and School ID to activate your license.
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
  selectedFilterSchoolYear,
}: {
  sections: Section[];
  subjects: Subject[];
  user: UserProfile | null;
  activeSchoolYear?: string;
  selectedFilterSchoolYear?: string;
}) {
  const [processing, setProcessing] = useState(false);
  const [isAnySectionFinalized, setIsAnySectionFinalized] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirmFinalizePrompt, setConfirmFinalizePrompt] = useState(false);
  const [confirmUnfinalizePrompt, setConfirmUnfinalizePrompt] = useState(false);
  const [requestUnfinalizePrompt, setRequestUnfinalizePrompt] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isMainAdmin = user?.email === "jessiemangabo@gmail.com";
  const isSystemAdmin = user?.role === "system_admin";

  const targetSchoolYear = selectedFilterSchoolYear || activeSchoolYear;

  // Active sections for the targeted school year
  const targetSections = useMemo(() => {
    return sections.filter((section) => {
      const effectiveYear = targetSchoolYear;
      if (effectiveYear && effectiveYear !== "all") {
        if (effectiveYear === "No School Year") {
          return !section.schoolYear || section.schoolYear.trim() === "";
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
            limit(1),
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
    const targetSectionIds = new Set(targetSections.map((s) => s.id));
    return subjects.filter((sub) => targetSectionIds.has(sub.sectionId));
  }, [targetSections, subjects]);

  const isAllSubjectsTermsFinalized = useMemo(() => {
    if (targetSections.length === 0 || relevantSubjects.length === 0)
      return false;
    return relevantSubjects.every((subj) => {
      const offered =
        subj.offeredTerms && subj.offeredTerms.length > 0
          ? subj.offeredTerms
          : ([1, 2, 3, 4] as TermNumber[]);
      return offered.every((t) => subj.finalizedTerms?.includes(t));
    });
  }, [targetSections, relevantSubjects]);

  const unfinalizedSectionsSubjectsAndTerms = useMemo(() => {
    if (isAnySectionFinalized) return [];
    const sectionMap = new Map<string, string>(
      targetSections.map((s) => [s.id, s.name] as [string, string]),
    );

    const list: {
      sectionName: string;
      subjectName: string;
      terms: TermNumber[];
    }[] = [];
    relevantSubjects.forEach((subj) => {
      const offered =
        subj.offeredTerms && subj.offeredTerms.length > 0
          ? subj.offeredTerms
          : ([1, 2, 3, 4] as TermNumber[]);
      const pending = offered.filter((t) => !subj.finalizedTerms?.includes(t));
      if (pending.length > 0) {
        list.push({
          sectionName: sectionMap.get(subj.sectionId) || "Unknown",
          subjectName: subj.name,
          terms: pending,
        });
      }
    });
    return list;
  }, [targetSections, relevantSubjects, isAnySectionFinalized]);

  const pendingByTerm = useMemo(() => {
    const termGroups: Record<
      number,
      {
        id: string;
        sectionName: string;
        subjectName: string;
        teacherEmail?: string;
      }[]
    > = {
      1: [],
      2: [],
      3: [],
      4: [],
    };

    if (isAnySectionFinalized) return termGroups;
    const sectionMap = new Map<string, string>(
      targetSections.map((s) => [s.id, s.name] as [string, string]),
    );

    relevantSubjects.forEach((subj) => {
      const offered =
        subj.offeredTerms && subj.offeredTerms.length > 0
          ? subj.offeredTerms
          : ([1, 2, 3, 4] as TermNumber[]);
      offered.forEach((t) => {
        if (!subj.finalizedTerms?.includes(t)) {
          termGroups[t].push({
            id: subj.id,
            sectionName: sectionMap.get(subj.sectionId) || "Unknown",
            subjectName: subj.name,
            teacherEmail: subj.teacherEmail,
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
        const sectionSubjects = subjects.filter(
          (s) => s.sectionId === section.id,
        );
        const studentSnap = await getDocs(
          collection(db, `sections/${section.id}/students`),
        );
        const sectionStudents = studentSnap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Student,
        );

        const activeStudents = sectionStudents.filter(
          (s) => s.status === "Active" || !s.status,
        );
        const updatePromises = activeStudents.map((student) => {
          let totalWeightedFinals = 0;
          let totalUnits = 0;
          sectionSubjects.forEach((subj) => {
            const termsPassed = (subj.offeredTerms || [1, 2, 3, 4])
              .map((t) => calculateGrade(student, subj, t as TermNumber).final)
              .filter((f) => f > 0);
            if (termsPassed.length > 0) {
              const finalRating = Math.round(
                termsPassed.reduce((a, b) => a + b, 0) / termsPassed.length,
              );
              const u =
                subj.unit !== undefined && subj.unit !== null && subj.unit > 0
                  ? subj.unit
                  : 1.0;
              totalWeightedFinals += finalRating * u;
              totalUnits += u;
            }
          });

          let finalStatus = "Retained";
          if (totalUnits > 0) {
            const genAvg = Math.round(totalWeightedFinals / totalUnits);
            finalStatus = genAvg >= 75 ? "Promoted" : "Retained";
          }
          return updateDoc(
            doc(db, `sections/${section.id}/students`, student.id),
            {
              status: finalStatus,
            },
          );
        });

        await Promise.all(updatePromises);
        await updateDoc(doc(db, "sections", section.id), { isFinalized: true });
      }
      setIsAnySectionFinalized(true);
      setSuccessMessage(
        "Successfully finalized the school grading system for all sections in this school year!",
      );
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
      const docRef = doc(db, "settings", "general");
      const syToRequest = targetSchoolYear || "active";
      await updateDoc(docRef, {
        unfinalizeRequests: arrayUnion({
          schoolYear: syToRequest,
          requestedBy: user?.email,
          timestamp: new Date().toISOString(),
        }),
      });
      setSuccessMessage(
        "Your request to unfinalize the school year has been sent to the Main Admin for approval.",
      );
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
        const studentSnap = await getDocs(
          collection(db, `sections/${section.id}/students`),
        );
        const sectionStudents = studentSnap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Student,
        );

        const updatePromises = sectionStudents.map((student) => {
          if (student.status === "Promoted" || student.status === "Retained") {
            return updateDoc(
              doc(db, `sections/${section.id}/students`, student.id),
              {
                status: deleteField(),
              },
            );
          }
          return Promise.resolve();
        });

        await Promise.all(updatePromises);
        await updateDoc(doc(db, "sections", section.id), {
          isFinalized: false,
        });
      }
      setIsAnySectionFinalized(false);
      setSuccessMessage(
        "Successfully unfinalized school grading system for all sections in this school year.",
      );
    } catch (error) {
      console.error("Error unfinalising all sections:", error);
      setSuccessMessage("An error occurred during unfinalization.");
    } finally {
      setProcessing(false);
    }
  };

  if (user?.role !== "system_admin" && user?.role !== "admin") return null;
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
              <h4 className="font-bold text-indigo-950 text-base leading-tight">
                School Year Finalized ({targetSchoolYear})
              </h4>
              <p className="text-xs font-semibold text-indigo-700/80 mt-1 max-w-2xl leading-relaxed">
                The school year grading system is currently finalized. All
                learner promotion/retention statuses and final end-of-year
                grades have been successfully calculated and set to read-only.
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

                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Unfinalize Grades?
                </h3>

                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Are you sure you want to revert finalization for all sections
                  under {targetSchoolYear || "active"} school year? This will
                  reset the promotion and retention statuses for all learners.
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

                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Request School Year Unfinalization?
                </h3>

                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  You do not have direct permission to unfinalize school years.
                  Clicking "Send Request" will notify the Main Admin
                  (jessiemangabo@gmail.com) to unfinalize the{" "}
                  {targetSchoolYear || "active"} school year.
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
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="ml-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-1 rounded-md transition-colors"
                >
                  <X size={14} />
                </button>
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
            <Sparkles
              size={20}
              className="text-emerald-600 mt-0.5 animate-bounce"
            />
          </div>
          <div>
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-1 text-emerald-900">
              Finalize School Year
            </h4>
            <p className="text-xs font-medium text-emerald-700">
              You can finalize the entire active school year to lock all student
              records, stop edits and deletes, and finalize all statuses.
            </p>
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

              <h3 className="text-xl font-black text-slate-900 mb-2">
                Finalize All Sections?
              </h3>

              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Are you sure you want to finalize all sections for{" "}
                {targetSchoolYear || "active"} school year? This will compute
                all status automatically and prevent any edits or deletions.
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


