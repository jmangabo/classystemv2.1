import { computeBMI, EncodingClosedBanner, DeadlineBanner, SectionYearEndBadge, SectionStatsDisplay, SectionForm } from "../App";
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
} from "../firebase";
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
} from "../types";
import {
  formatStudentName,
  capitalizeName,
  capitalizeFirst,
  getSubjectSortScore,
  printHTMLContent,
  isTleSubject,
  getTleDisplayName,
} from "../utils";
import { INITIAL_STUDENTS, DEFAULT_TERM_DATA } from "../constants";
import {
  ThemeCustomizerModal,
  DEFAULT_THEME_SETTINGS,
  SystemThemeSettings,
} from "./ThemeCustomizerModal";
import { SystemDocumentationView } from "./SystemDocumentationView";
import { SF8View } from "./SF8View";
import { ManualSiblingSelector } from "./ManualSiblingSelector";
import { PhotoCropModal } from "./PhotoCropModal";
import { SF10ReportModal } from "./SF10ReportModal";
import { AralProgram } from "./AralProgram";
import { AralMasterData } from "./AralMasterData";
import { MysqlManagerView } from "./MysqlManagerView";
import {
  DEFAULT_SCHOOL_INFO,
  DEFAULT_COMPETENCIES,
  AralSchoolInfo,
  AralCompetency,
  AralRole,
} from "./AralData";
import { AttendanceCard } from "./AttendanceCard";
import { RoleSelectionView } from "./RoleSelectionView";
import { PendingApprovalView } from "./PendingApprovalView";
import { StudentPortal } from "./StudentPortal";
import { StudentLinkingView } from "./StudentLinkingView";
import { AdminUsersView } from "./AdminUsersView";
import { AdminSchoolsView } from "./AdminSchoolsView";
import { SubjectsView } from "./SubjectsView";
import { DashboardView } from "./DashboardView";
import { GradebookView } from "./GradebookView";
import { SummarySheetView } from "./SummarySheetView";
import { TransferFacilityView } from "./TransferFacilityView";
import { AddLearnerView } from "./AddLearnerView";
import { EnrollAllConfirmationModal } from "./EnrollAllConfirmationModal";
import { MATATAGReportCardModal } from "./MATATAGReportCardModal";
import { ProfileView } from "./ProfileView";
import { SF2ReportView } from "./SF2ReportView";
import { SF4ReportView } from "./SF4ReportView";
import { SF7ReportView } from "./SF7ReportView";
import { SF10View } from "./SF10View";
import { DailyAttendanceTracker } from "./DailyAttendanceTracker";
import { ObservedValuesTracker } from "./ObservedValuesTracker";
import {
  AnecdotalRecordsView,
  getOffensePenalty,
} from "./AnecdotalRecordsView";
import { UserGuideView } from "./UserGuideView";
import { AdminSchoolYearView } from "./AdminSchoolYearView";
import { AdminSchoolCalendarView } from "../AdminSchoolCalendarView";
import { AdminStudentListView } from "./AdminStudentListView";
import { AdminFeedbackDashboard } from "./AdminFeedbackDashboard";
import { PTAFeesManagementView } from "./PTAFeesManagementView";
import { TleDashboardView } from "./TleDashboardView";
import { FeedbackModal } from "./FeedbackModal";
import { PrintAllSF2Button } from "./PrintAllSF2Button";
import { ClassRecordReportModal } from "./ClassRecordReportModal";

function StatementOfAccountView({
  activeSchool,
  teacherCount,
  onBack,
  onRenew,
  userProfile,
}: {
  activeSchool: any;
  teacherCount: number;
  onBack: () => void;
  onRenew?: (yearIndex: number) => Promise<void>;
  userProfile?: any;
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
      : new Date(
          new Date(createdDate).setFullYear(createdDate.getFullYear() + 1),
        );

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

      const periodStr = `${start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

      const count = teacherCount || 0;
      let category = "Small";
      let fee = 599;

      if (count <= 9) {
        category = "Small";
        fee = 599;
      } else if (count <= 25) {
        category = "Medium";
        fee = 1199;
      } else if (count <= 100) {
        category = "Large";
        fee = 2499;
      } else {
        category = "Mega";
        fee = 4999;
      }

      const isFirstYear = yearIndex === 1;
      const discount = isFirstYear ? fee : 0;
      const netFee = isFirstYear ? 0 : fee;

      // The year is Paid/Settled if it is Year 1 OR if its end date is <= the expirationDate
      const isPaid =
        isFirstYear ||
        end.getTime() <= expirationDate.getTime() + 10000 ||
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
        isPaid,
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
      expirationDate,
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
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const cellStyle = {
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const boldCellStyle = {
      font: { bold: true },
      border: cellStyle.border,
    };

    ws_data.push([
      { v: "Statement of Account", s: { font: { bold: true, sz: 16 } } },
    ]);
    ws_data.push([
      {
        v: `SOA Reference: CLASS-SOA-${activeSchool?.schoolId || "NEW"}-${new Date().getFullYear()}`,
      },
    ]);
    ws_data.push([{ v: `School: ${activeSchool?.name || "N/A"}` }]);
    ws_data.push([{ v: `School ID: ${activeSchool?.schoolId || "N/A"}` }]);
    ws_data.push([{ v: `Date Issued: ${new Date().toLocaleDateString()}` }]);
    ws_data.push([]);

    ws_data.push([
      { v: "Coverage Period", s: headerStyle },
      { v: "Licensing Tier", s: headerStyle },
      { v: "Teachers Count", s: headerStyle },
      { v: "Base Rate", s: headerStyle },
      { v: "Promos / Discounts", s: headerStyle },
      { v: "Net Subscription Fee", s: headerStyle },
      { v: "Payment Status", s: headerStyle },
    ]);

    ledger.rows.forEach((row) => {
      ws_data.push([
        {
          v: `Year ${row.yearIndex} (${row.schoolYearStr})\n${row.periodStr}`,
          s: cellStyle,
        },
        { v: row.category, s: cellStyle },
        { v: teacherCount, s: cellStyle },
        { v: row.fee, t: "n", z: "P#,##0.00", s: cellStyle },
        {
          v: row.discount > 0 ? -row.discount : 0,
          t: "n",
          z: "P#,##0.00",
          s: cellStyle,
        },
        { v: row.netFee, t: "n", z: "P#,##0.00", s: cellStyle },
        { v: row.isPaid ? "PAID" : "UNPAID", s: cellStyle },
      ]);
    });

    ws_data.push([]);
    ws_data.push([
      "",
      "",
      "",
      "",
      { v: "Total Subscription Price:", s: boldCellStyle },
      { v: ledger.netTotal, t: "n", z: "P#,##0.00", s: boldCellStyle },
    ]);
    ws_data.push([
      "",
      "",
      "",
      "",
      { v: "Amount Paid:", s: boldCellStyle },
      { v: ledger.amountPaid, t: "n", z: "P#,##0.00", s: boldCellStyle },
    ]);
    ws_data.push([
      "",
      "",
      "",
      "",
      { v: "Action Required / Balance due:", s: boldCellStyle },
      { v: ledger.currentBalance, t: "n", z: "P#,##0.00", s: boldCellStyle },
    ]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    ws["!cols"] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statement of Account");

    XLSX.writeFile(
      wb,
      `SOA_${activeSchool?.schoolId || "NEW"}_${new Date().getFullYear()}.xlsx`,
    );
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
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    CLASS Enterprise Solution
                  </h2>
                  <p className="text-[10px] text-indigo-600 font-black tracking-widest uppercase">
                    Class Record Solutions
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Real-Time Cloud Ledger & Continuous Gradebook Integration
                Service
              </p>
            </div>

            <div className="md:text-right space-y-1 font-mono text-xs text-slate-500">
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider block w-fit md:ml-auto mb-2 print:border print:border-indigo-100 print:text-indigo-900">
                Statement of Account
              </span>
              <p>
                <span className="font-semibold text-slate-800">
                  SOA Reference:
                </span>{" "}
                CLASS-SOA-{activeSchool?.schoolId || "NEW"}-
                {new Date().getFullYear()}
              </p>
              <p>
                <span className="font-semibold text-slate-800">
                  Date Issued:
                </span>{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p>
                <span className="font-semibold text-slate-800">
                  Valid Until:
                </span>{" "}
                {ledger.expirationDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Status:</span>
                {ledger.isExpired ? (
                  <span className="text-rose-600 font-extrabold uppercase ml-1 bg-rose-50 px-1 rounded">
                    Expired Account
                  </span>
                ) : (
                  <span className="text-emerald-700 font-extrabold uppercase ml-1">
                    Active Account
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 print:bg-white print:border-slate-200">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Statement For:
              </h3>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  {activeSchool?.name || "Authorized DepEd School"}
                </p>
                <p className="text-xs text-slate-500 font-semibold">
                  School ID:{" "}
                  <span className="font-mono">
                    {activeSchool?.schoolId || "N/A"}
                  </span>
                </p>
                {activeSchool?.headOfSchool && (
                  <p className="text-xs text-slate-500">
                    Head of School:{" "}
                    <span className="font-semibold">
                      {activeSchool.headOfSchool}
                    </span>
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  {activeSchool?.division} Division{" "}
                  {activeSchool?.district && ` ${activeSchool.district}`}{" "}
                  {activeSchool?.region || "DepEd"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Issued By:
              </h3>
              <div className="space-y-1 text-slate-600 text-xs">
                <p className="text-sm font-bold text-slate-900">
                  CLASS Enterprise Solution
                </p>
                <p>Support & Accounts Desk</p>
                <p>
                  Email:{" "}
                  <span className="font-mono">jessiemangabo@gmail.com</span>
                </p>
                <p>
                  Hotline: <span className="font-mono">0905 152 6827</span>
                </p>
                <p className="text-[10px] text-slate-400 italic">
                  Enterprise Cloud Invoicing Division
                </p>
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
                    <th className="px-6 py-4 text-right print:hidden">
                      Status / Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {ledger.rows.map((row) => (
                    <tr
                      key={row.yearIndex}
                      className={
                        row.yearIndex === 2
                          ? "bg-indigo-50/25 border-l-2 border-indigo-500"
                          : ""
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">
                            Year {row.yearIndex} Subscription
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono">
                            SY {row.schoolYearStr}
                          </p>
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
                        {row.count} active{" "}
                        {row.count === 1 ? "teacher" : "teachers"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-500">
                        P{row.fee.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-600">
                        {row.isFirstYear ? (
                          <span>
                            -P{row.discount.toLocaleString()} (100% Promo)
                          </span>
                        ) : (
                          <span className="text-slate-400">P0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold font-mono text-slate-900">
                        {row.isFirstYear ? (
                          <span className="text-emerald-600 font-extrabold">
                            P0 (Free Promo)
                          </span>
                        ) : (
                          <span>P{row.netFee.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right print:hidden">
                        {row.isPaid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-750 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-150 text-[10px] font-extrabold uppercase">
                            <CheckCircle
                              size={12}
                              className="text-emerald-600"
                            />{" "}
                            Paid & Settled
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
                              <svg
                                className="animate-spin -ml-0.5 mr-1 h-3 w-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
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
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                Account Settlement Policy
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Subscription Year 1 (First 12 Months) introductory access is
                100% sponsored under the trial program promotion.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Subsequent renewals (Year 2 onwards) are calculated in real-time
                according to total registered educator profiles active on the
                roster. No credit check or upfront collateral required.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full md:w-80 space-y-3 font-mono text-xs print:bg-white">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 font-sans">
                Payment Summary
              </h4>

              <div className="flex justify-between text-slate-500">
                <span>Total Base Value:</span>
                <span>P{ledger.grossTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Promo Discounts:</span>
                <span>-P{ledger.promoDiscountTotal.toLocaleString()}</span>
              </div>

              <div className="w-full h-px bg-slate-200 my-2"></div>

              <div className="flex justify-between text-slate-900 font-bold text-sm">
                <span className="font-sans">Total Subscription Price:</span>
                <span>P{ledger.netTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-indigo-600 font-bold">
                <span>Amount Paid:</span>
                <span>-P{ledger.amountPaid.toLocaleString()}</span>
              </div>

              <div className="w-full h-px bg-slate-200 my-2"></div>

              <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-dashed border-slate-300">
                <span className="font-sans">Current Balance:</span>
                <span className="text-indigo-600">
                  P{ledger.currentBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment execution details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                Option 1: GCash Transfer
              </span>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Send payment to GCash Merchant ID:{" "}
                <strong className="font-mono text-slate-800">
                  0905 152 6827
                </strong>
                <br />
                Quote reference:{" "}
                <strong className="font-mono text-slate-800">
                  {activeSchool?.schoolId}
                </strong>
                .
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                Option 2: Bank transfer
              </span>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Land Bank of the Philippines (LBP)
                <br />
                Account Name:{" "}
                <strong className="text-slate-800">Jessie J. Mangabo</strong>
                <br />
                Account Number:{" "}
                <strong className="font-mono text-slate-800">
                  107 640 6444
                </strong>
              </p>
            </div>
          </div>

          {/* Final signatures */}
          <div className="flex justify-between items-end pt-12 border-t border-slate-100 text-xs">
            <div className="space-y-1">
              <p className="text-slate-400 font-medium">Prepared by:</p>
              <div className="w-40 h-px bg-slate-300 my-2"></div>
              <p className="font-bold text-slate-800">
                Enterprise Billing Desk
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                ID: CLASS-78904
              </p>
            </div>

            <div className="space-y-1 text-right">
              <p className="text-slate-400 font-medium">
                Verified For Authorization:
              </p>
              <div className="w-40 h-px bg-slate-300 my-2 ml-auto"></div>
              <p className="font-bold text-slate-800">
                {activeSchool?.headOfSchool || "School Administrator"}
              </p>
              <p className="text-[10px] text-slate-400">
                Head / Principal Representative
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { StatementOfAccountView };
