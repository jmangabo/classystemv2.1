import { computeBMI, EncodingClosedBanner, DeadlineBanner, SectionYearEndBadge, SectionStatsDisplay, SectionForm } from "../App";
import { StatementOfAccountView } from "./StatementOfAccountView";
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
  onSelectAralClassId,
}: {
  sections: Section[];
  expiredSchoolIds?: string[];
  onOpenThemeModal?: () => void;
  onSelect: (s: Section) => void;
  onCreate: (data: any) => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (
    id: string,
    action?: "approve" | "disapprove" | "cancel" | "request" | "delete",
    reason?: string,
  ) => void;
  onSelectSubject: (id: string) => void;
  onSetActiveTab: (tab: string) => void;
  onNavigateToSubject: (s: Section, subName: string) => void;
  user: UserProfile | null;
  onUpdateUser?: (p: UserProfile) => void;
  onLogout: () => void;
  onManageUsers?: () => void;
  onScanID?: () => void;
  pendingUsersCount?: number;
  isAnySectionAdviser?: boolean;
  onManageSchools?: () => void;
  onManageSchoolYears?: () => void;
  onManageCalendar?: () => void;
  onManageStudentList?: () => void;
  onShowFinancialStatement?: () => void;
  onShowSF4?: () => void;
  onShowSF7?: () => void;
  isAuthorizedCashier?: boolean;
  onShowFeedback: () => void;
  isFeedbackOpen: boolean;
  onCloseFeedback: () => void;
  onShowFeedbackDashboard?: () => void;
  globalSettings?: any;
  subjects: Subject[];
  globalSubjects?: Subject[];
  schoolCalendar: any[];
  onToggleFinalizeSubjectTerm?: (
    subjectId: string,
    term: TermNumber,
    finalize: boolean,
  ) => void;
  activeSchool?: any;
  teacherCount?: number;
  onRenew?: (yearIndex: number) => Promise<void>;
  aralSchoolInfo: AralSchoolInfo;
  onUpdateAralSchool: (info: AralSchoolInfo) => void;
  aralCompetencies: AralCompetency[];
  onAddAralCompetency: (comp: AralCompetency) => void;
  onDeleteAralCompetency: (id: string) => void;
  mapUserRoleToAralRole: (role?: string, email?: string) => AralRole;
  aralClasses?: AralClass[];
  onCreateAralClass?: (
    gradeLevel: number,
    name: string,
    tutorName: string,
    tutorEmail: string,
    studentIds: string[],
    targetSubject?: string,
  ) => void;
  onUpdateAralClass?: (
    classId: string,
    tutorName: string,
    tutorEmail: string,
    studentIds: string[],
    targetSubject?: string,
    name?: string,
    gradeLevel?: number,
  ) => void;
  onDeleteAralClass?: (classId: string) => void;
  selectedAralClassId?: string | null;
  onSelectAralClassId?: (classId: string | null) => void;
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [confirmFinalizeConfig, setConfirmFinalizeConfig] = useState<{
    subjectId: string;
    term: number;
    finalize: boolean;
  } | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [collapsedAdminGrades, setCollapsedAdminGrades] = useState<Set<number>>(
    new Set(),
  );
  const [openAdminMenu, setOpenAdminMenu] = useState<string | null>(null);

  const hasAssignedSubjects = useMemo(() => {
    return (
      subjects.some(
        (s) =>
          (s.teacherEmail || "").toLowerCase() ===
          (user?.email || "").toLowerCase(),
      ) ||
      sections.some(
        (sec) =>
          sec.teacherSubjects &&
          Object.values(sec.teacherSubjects)
            .map((e: any) => (e || "").toLowerCase())
            .includes((user?.email || "").toLowerCase()),
      )
    );
  }, [subjects, sections, user]);

  const adminGroupedOverview = useMemo(() => {
    const groups: {
      [gradeLevel: number]: {
        [sectionId: string]: {
          sectionName: string;
          sectionObj: Section | undefined;
          subjects: Subject[];
        };
      };
    } = {};

    subjects.forEach((sub) => {
      const sectionObj = sections.find((s) => s.id === sub.sectionId);
      let gradeLevel = sub.gradeLevel;
      let sectionId = sub.sectionId || "unknown";
      let sectionName = "Unassigned Section";

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
          subjects: [],
        };
      }

      groups[gradeLevel][sectionId].subjects.push(sub);
    });

    return groups;
  }, [subjects, sections]);

  const adminSortedGradeLevels = useMemo(() => {
    return Object.keys(adminGroupedOverview)
      .map(Number)
      .sort((a, b) => a - b);
  }, [adminGroupedOverview]);

  const [isListOpen, setIsListOpen] = useState(true);

  const [isSchoolDbFinalized, setIsSchoolDbFinalized] = useState(false);

  const [isUploadingDashboard, setIsUploadingDashboard] = useState(false);

  const downloadDashboardCSVTemplate = () => {
    const headers =
      "LastName,FirstName,MiddleName,NameExt,LRN,Email,Birthdate,Age,Sex,GradeLevel,Section,DateOfFirstAttendance,Weight_kg,Height_cm,EligibilityType,GenAvg,Citation,ElemSchoolName,ElemSchoolId,ElemSchoolAddress,PEPTRating,PEPTDate,ALSRating,ALSCenterInfo,OthersSpecify,IsTransferredIn,Birthplace,HomeAddress,PrimaryContact,FatherName,MotherName,GuardianName,GuardianRelationship,ContactNumber";
    const example1 =
      "Dela Cruz,Juan,,Jr,123456789012,juan.delacruz@email.com,2010-01-15,12,Male,7,Einstein,2023-06-05,45,150,Elementary School Completer,85.50,,,Rizal Elem School,123456,,,,,,No,Manila,123 Rizal St. Manila,father,Juan Dela Cruz Sr.,Maria Dela Cruz,,,09123456789";
    const example2 =
      "Santos,Maria,G,,987654321098,maria.santos@email.com,2011-03-20,11,Female,7,Einstein,2023-06-05,42,148,PEPT Passer.,,,,,,,80.20,2022-05-15,,,,Yes,Quezon City,456 Quezon Ave. QC,mother,Pedro Santos,Maria Santos,,,09876543210";
    const csvContent = `${headers}\n${example1}\n${example2}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_enrollment_dashboard_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const [uploadSuccessDashboard, setUploadSuccessDashboard] = useState(false);
  const [pendingLearnersDashboard, setPendingLearnersDashboard] = useState<
    any[]
  >([]);
  const [showSelectionModalDashboard, setShowSelectionModalDashboard] =
    useState(false);
  const [selectedIndicesDashboard, setSelectedIndicesDashboard] = useState<
    Set<number>
  >(new Set());
  const [
    bulkFirstAttendanceDateDashboard,
    setBulkFirstAttendanceDateDashboard,
  ] = useState("");

  const handleDashboardFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDashboard(true);
    setUploadSuccessDashboard(false);

    const reader = new window.FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
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
      if (
        firstLine &&
        (firstLine.toLowerCase().includes("lastname") ||
          firstLine.toLowerCase().includes("lrn") ||
          firstLine.toLowerCase().includes("name"))
      ) {
        const headerParts: string[] = [];
        let p = "",
          inQuote = false;
        for (let i = 0; i < firstLine.length; i++) {
          let c = firstLine[i];
          if (c === '"' && firstLine[i + 1] === '"') {
            p += '"';
            i++;
          } else if (c === '"') {
            inQuote = !inQuote;
          } else if (c === "," && !inQuote) {
            headerParts.push(p.trim().toLowerCase());
            p = "";
          } else {
            p += c;
          }
        }
        headerParts.push(p.trim().toLowerCase());

        lastNameColIdx = headerParts.indexOf("lastname");
        firstNameColIdx = headerParts.indexOf("firstname");
        middleNameColIdx = headerParts.indexOf("middlename");
        extensionColIdx = headerParts.indexOf("nameext");
        if (extensionColIdx === -1)
          extensionColIdx = headerParts.indexOf("ext");
        if (extensionColIdx === -1)
          extensionColIdx = headerParts.indexOf("extension");
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
        if (homeAddressColIdx === -1)
          homeAddressColIdx = headerParts.indexOf("address");
        primaryContactColIdx = headerParts.indexOf("primarycontact");
        fatherNameColIdx = headerParts.indexOf("fathername");
        motherNameColIdx = headerParts.indexOf("mothername");
        guardianNameColIdx = headerParts.indexOf("guardianname");
        guardianRelationshipColIdx = headerParts.indexOf(
          "guardianrelationship",
        );
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
        if (
          index === 0 &&
          (trimmedLine.toLowerCase().includes("name") ||
            trimmedLine.toLowerCase().includes("lrn") ||
            trimmedLine.toLowerCase().includes("lastname"))
        )
          return;

        const parts: string[] = [];
        let p = "",
          inQuote = false;
        for (let i = 0; i < trimmedLine.length; i++) {
          let c = trimmedLine[i];
          if (c === '"' && trimmedLine[i + 1] === '"') {
            p += '"';
            i++;
          } else if (c === '"') {
            inQuote = !inQuote;
          } else if (c === "," && !inQuote) {
            parts.push(p.trim());
            p = "";
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
          let eligibilityType:
            | "Elementary School Completer"
            | "PEPT Passer"
            | "ALS A & E Passer"
            | "Others" = "Elementary School Completer";
          if (eligibilityTypeRaw.toLowerCase().includes("pept"))
            eligibilityType = "PEPT Passer";
          else if (eligibilityTypeRaw.toLowerCase().includes("als"))
            eligibilityType = "ALS A & E Passer";
          else if (eligibilityTypeRaw.toLowerCase().includes("other"))
            eligibilityType = "Others";

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
            othersSpecify: parts[othersSpecifyColIdx] || "",
          };

          const isTransferredInRaw = parts[isTransferredInColIdx] || "";
          const isTransferredIn =
            isTransferredInRaw.toLowerCase().includes("yes") ||
            isTransferredInRaw.toLowerCase().includes("true") ||
            isTransferredInRaw === "1";
          const birthplace = parts[birthplaceColIdx] || "";
          const address = parts[homeAddressColIdx] || "";
          let primaryContact = (
            parts[primaryContactColIdx] || "father"
          ).toLowerCase();
          if (
            primaryContact !== "father" &&
            primaryContact !== "mother" &&
            primaryContact !== "guardian"
          ) {
            primaryContact = "father";
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
            extension,
          ].filter(Boolean);
          const name = nameParts.join(" ").trim();

          if (lastName && firstName && lrn) {
            const { bmi, category } = computeBMI(
              parseFloat(weight) || 0,
              parseFloat(height) || 0,
            );

            // Robust sex detection
            let finalSex: "Male" | "Female" = "Male";
            const sValue = sexInput.toLowerCase();
            if (
              sValue.startsWith("f") ||
              sValue.includes("girl") ||
              sValue.includes("female")
            ) {
              finalSex = "Female";
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
              gradeLevel:
                gradeLevelColIdx !== -1 ? parts[gradeLevelColIdx] || "" : "",
              section: sectionColIdx !== -1 ? parts[sectionColIdx] || "" : "",
              nutritionalStatus: {
                bmiCategory: category,
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
              contactNumber,
            });
          }
        }
      });

      if (learners.length > 0) {
        setPendingLearnersDashboard(learners);
        // Default select only those matching actual sections in the list
        const validIndices = new Set<number>();
        learners.forEach((l, idx) => {
          const hasSection = sections.some((sec) => {
            const csvSecName = (l.section || "").trim().toLowerCase();
            const dbSecName = (sec.name || "").trim().toLowerCase();
            const csvGrade = (l.gradeLevel || "").trim();
            const dbGrade = String(sec.gradeLevel || "").trim();
            return (
              csvSecName === dbSecName &&
              (csvGrade === "" || csvGrade === dbGrade)
            );
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
    const q = query(
      collection(db, "schools"),
      where("schoolId", "==", user.schoolId),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          setIsSchoolDbFinalized(snap.docs[0].data().isFinalized || false);
        } else {
          setIsSchoolDbFinalized(false);
        }
      },
      (err) => {
        console.error("Error checking school finalized status:", err);
      },
    );
    return () => unsub();
  }, [user?.schoolId]);

  // Real-time listener for behavioral records
  const [behavioralRecords, setBehavioralRecords] = useState<AnecdotalRecord[]>(
    [],
  );
  const [loadingBehavioral, setLoadingBehavioral] = useState(true);

  // States to read, open and fill "Action Taken / Interventions Conducted"
  const [activeBehavioralRecordSection, setActiveBehavioralRecordSection] =
    useState<Section | null>(null);
  const [showBehavioralRecordsPopup, setShowBehavioralRecordsPopup] =
    useState(false);
  const [selectedRecordToFill, setSelectedRecordToFill] =
    useState<AnecdotalRecord | null>(null);
  const [formActionTaken, setFormActionTaken] = useState("");
  const [isSavingAction, setIsSavingAction] = useState(false);

  useEffect(() => {
    if (!db) return;
    setLoadingBehavioral(true);
    const recordsCol = collection(db, "anecdotal_records");
    const q = query(recordsCol, where("category", "==", "behavioral"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as unknown as AnecdotalRecord,
        );
        // Sort newest first
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setBehavioralRecords(list);
        setLoadingBehavioral(false);
      },
      (err) => {
        console.error("Error loading behavioral records in SectionsView:", err);
        setLoadingBehavioral(false);
      },
    );

    return () => unsub();
  }, []);

  const handleSaveActionTaken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordToFill) return;
    setIsSavingAction(true);
    try {
      const recordDocRef = doc(
        db,
        "anecdotal_records",
        selectedRecordToFill.id,
      );
      await updateDoc(recordDocRef, {
        actionTaken: formActionTaken.trim(),
      });
      // Update our selected view
      setSelectedRecordToFill((prev) =>
        prev ? { ...prev, actionTaken: formActionTaken.trim() } : null,
      );
      alert(
        "Action Taken / Interventions Conducted has been documented successfully!",
      );
    } catch (err) {
      console.error("Failed to update action taken:", err);
      alert("Error documenting actions. Please try again.");
    } finally {
      setIsSavingAction(false);
    }
  };

  const isGlobalFinalized = useMemo(() => {
    return globalSettings?.finalizedSchoolYears?.includes(
      globalSettings?.activeSchoolYear,
    );
  }, [globalSettings]);

  const isEntireSchoolFinalized = useMemo(() => {
    const activeYear = globalSettings?.activeSchoolYear;
    if (!activeYear) return false;
    const activeSections = sections.filter((s) => s.schoolYear === activeYear);
    if (activeSections.length === 0) return false;
    return activeSections.every((s) => s.isFinalized);
  }, [sections, globalSettings?.activeSchoolYear]);

  useEffect(() => {
    if (
      sectionToDelete &&
      (user?.role === "system_admin" ||
        user?.role === "admin" ||
        user?.role === "teacher")
    ) {
      const checkEmpty = async () => {
        // Check subjects first (already in state)
        const subjCount = subjects.filter(
          (s) => s.sectionId === sectionToDelete.id,
        ).length;
        if (subjCount > 0) {
          setIsSectionEmpty(false);
          return;
        }

        // Check students subcollection
        try {
          const studentSnap = await getDocs(
            query(
              collection(db, `sections/${sectionToDelete.id}/students`),
              limit(1),
            ),
          );
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
    const saved = localStorage.getItem("home_filters");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved filters", e);
      }
    }
    return {
      schoolYear: "",
      region: "",
      division: "",
      district: "",
      visibility: "all",
      gradeLevel: "",
    };
  });

  useEffect(() => {
    localStorage.setItem("home_filters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    // Automatically set the school year filter to the active school year if none is selected
    // and only if we haven't explicitly set schoolYear before (either in this session or from storage)
    // Actually, if it's empty, and we have an active year, it's better to just set it.
    if (!filters.schoolYear && globalSettings?.activeSchoolYear) {
      setFilters((prev) => ({
        ...prev,
        schoolYear: globalSettings.activeSchoolYear,
      }));
    }
  }, [globalSettings?.activeSchoolYear]);

  const isFiltered =
    filters.schoolYear !== "" ||
    filters.region !== "" ||
    filters.division !== "" ||
    filters.district !== "" ||
    filters.visibility !== "all";

  const subDetails = useMemo(() => {
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

    let isFreeAccess = false;
    let expirationDateStr = "";
    const schoolCreatedAt = activeSchool?.createdAt || new Date().toISOString();
    const createdDate = new Date(schoolCreatedAt);

    const finalExpiresAtStr = activeSchool?.expiresAt;
    const expirationDate = finalExpiresAtStr
      ? new Date(finalExpiresAtStr)
      : new Date(
          new Date(createdDate).setFullYear(createdDate.getFullYear() + 1),
        );

    expirationDateStr = expirationDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const firstYearEnd = new Date(createdDate);
    firstYearEnd.setFullYear(createdDate.getFullYear() + 1);
    const isPaidYear2 = expirationDate > firstYearEnd;
    isFreeAccess = !isPaidYear2 && new Date() < expirationDate;

    return {
      category,
      fee,
      isFreeAccess,
      isPaidYear2,
      priceLabel: `P${fee.toLocaleString()}`,
      expirationDateStr,
      isExpired: new Date() >= expirationDate,
    };
  }, [activeSchool, teacherCount, user]);

  const filteredSections = sections.filter((section) => {
    const effectiveYear =
      filters.schoolYear || globalSettings?.activeSchoolYear;

    if (effectiveYear && effectiveYear !== "all") {
      if (effectiveYear === "No School Year") {
        if (section.schoolYear && section.schoolYear.trim() !== "")
          return false;
      } else {
        if (section.schoolYear !== effectiveYear) return false;
      }
    }

    const isExpired = section.schoolId
      ? expiredSchoolIds.includes(section.schoolId)
      : false;

    if (filters.visibility === "active") {
      if (isExpired) return false;
    } else if (filters.visibility === "expired") {
      if (!isExpired) return false;
    }
    // 'all' shows both

    if (filters.gradeLevel !== "") {
      if (String(section.gradeLevel) !== String(filters.gradeLevel))
        return false;
    }

    if (user?.role === "admin") {
      if (filters.region && section.region !== filters.region) return false;
      if (filters.division && section.division !== filters.division)
        return false;
      if (filters.district && section.district !== filters.district)
        return false;
    }
    return true;
  });

  const renderItems = useMemo(() => {
    type RenderItem =
      | { type: "section"; section: Section }
      | {
          type: "tle-group";
          key: string;
          tleName: string;
          gradeLevels: number[];
          sections: Section[];
          isExpired: boolean;
        }
      | { type: "aral-class"; aralClass: AralClass };
    const items: RenderItem[] = [];
    const tleGroups = new Map<
      string,
      {
        tleName: string;
        gradeLevels: Set<number>;
        sections: Section[];
        isExpired: boolean;
      }
    >();

    filteredSections.forEach((section) => {
      const isExpired = section.schoolId
        ? expiredSchoolIds.includes(section.schoolId)
        : false;

      if (
        user?.role === "teacher" &&
        (section.gradeLevel == 9 || section.gradeLevel == 10)
      ) {
        const isAdviser =
          (section.adviserEmail || "").trim().toLowerCase() ===
          (user?.email || "").trim().toLowerCase();

        const userEmail = (user?.email || "").trim().toLowerCase();
        const sectionSubjects = subjects.filter(
          (s) => s.sectionId === section.id,
        );

        const teacherTleSubjects: string[] = [];
        sectionSubjects.forEach((sub) => {
          if (
            (sub.teacherEmail || "").trim().toLowerCase() === userEmail &&
            isTleSubject(sub.name)
          ) {
            const dName = getTleDisplayName(sub.name);
            if (!teacherTleSubjects.includes(dName))
              teacherTleSubjects.push(dName);
          }
        });

        if (section.subjectTeachers) {
          for (const [subjId, tEmail] of Object.entries(
            section.subjectTeachers,
          )) {
            if (
              typeof tEmail === "string" &&
              tEmail.trim().toLowerCase() === userEmail
            ) {
              const gSubj = globalSubjects.find((g) => g.id === subjId);
              if (gSubj && isTleSubject(gSubj.name)) {
                const dName = getTleDisplayName(gSubj.name);
                if (!teacherTleSubjects.includes(dName))
                  teacherTleSubjects.push(dName);
              }
            }
          }
        }

        if (teacherTleSubjects.length > 0) {
          teacherTleSubjects.forEach((tleName) => {
            const groupKey = tleName;
            if (!tleGroups.has(groupKey)) {
              tleGroups.set(groupKey, {
                tleName,
                gradeLevels: new Set([Number(section.gradeLevel)]),
                sections: [],
                isExpired,
              });
            } else {
              tleGroups
                .get(groupKey)!
                .gradeLevels.add(Number(section.gradeLevel));
              tleGroups.get(groupKey)!.isExpired =
                tleGroups.get(groupKey)!.isExpired || isExpired;
            }
            tleGroups.get(groupKey)!.sections.push(section);
          });

          let teachesNonTle = false;
          sectionSubjects.forEach((sub) => {
            if (
              (sub.teacherEmail || "").trim().toLowerCase() === userEmail &&
              !isTleSubject(sub.name)
            )
              teachesNonTle = true;
          });
          if (section.subjectTeachers) {
            for (const [subjId, tEmail] of Object.entries(
              section.subjectTeachers,
            )) {
              if (
                typeof tEmail === "string" &&
                tEmail.trim().toLowerCase() === userEmail
              ) {
                const gSubj = globalSubjects.find((g) => g.id === subjId);
                if (gSubj && !isTleSubject(gSubj.name)) teachesNonTle = true;
              }
            }
          }

          let teacherSubjectsFromFallback = section.teacherSubjects || [];
          if (teacherSubjectsFromFallback.some((n) => !isTleSubject(n)))
            teachesNonTle = true;

          if (!teachesNonTle && !isAdviser) {
            return;
          }
        }
      }
      items.push({ type: "section", section });
    });

    tleGroups.forEach((group, key) => {
      items.unshift({
        type: "tle-group",
        key,
        tleName: group.tleName,
        gradeLevels: Array.from(group.gradeLevels).sort((a, b) => a - b),
        sections: group.sections,
        isExpired: group.isExpired,
      });
    });

    // Populate and filter ARAL program classes
    const effectiveYear =
      filters.schoolYear || globalSettings?.activeSchoolYear;
    const filteredAral = (aralClasses || []).filter((cls) => {
      if (user?.role === "teacher") {
        const userEmail = (user?.email || "").trim().toLowerCase();
        const adviserEmail = (cls.adviserEmail || "").trim().toLowerCase();
        if (userEmail !== adviserEmail) return false;
      }

      if (effectiveYear && effectiveYear !== "all") {
        if (effectiveYear === "No School Year") {
          if (cls.schoolYear && cls.schoolYear.trim() !== "") return false;
        } else {
          if (cls.schoolYear !== effectiveYear) return false;
        }
      }

      const isExpired = cls.schoolId
        ? expiredSchoolIds.includes(cls.schoolId)
        : false;
      if (filters.visibility === "active") {
        if (isExpired) return false;
      } else if (filters.visibility === "expired") {
        if (!isExpired) return false;
      }

      if (filters.gradeLevel !== "") {
        if (String(cls.gradeLevel) !== String(filters.gradeLevel)) return false;
      }

      return true;
    });

    filteredAral.forEach((cls) => {
      items.push({ type: "aral-class", aralClass: cls });
    });

    return items;
  }, [
    filteredSections,
    user,
    subjects,
    globalSubjects,
    expiredSchoolIds,
    aralClasses,
    filters,
    globalSettings,
  ]);

  const schoolYears = useMemo(() => {
    const list = Array.from(
      new Set(sections.map((s) => s.schoolYear).filter(Boolean)),
    );
    if (
      globalSettings?.activeSchoolYear &&
      !list.includes(globalSettings.activeSchoolYear)
    ) {
      list.push(globalSettings.activeSchoolYear);
    }
    return list.sort();
  }, [sections, globalSettings?.activeSchoolYear]);
  const hasNoSchoolYear = useMemo(
    () => sections.some((s) => !s.schoolYear || s.schoolYear.trim() === ""),
    [sections],
  );
  const regions = useMemo(
    () => Array.from(new Set(sections.map((s) => s.region).filter(Boolean))),
    [sections],
  );
  const divisions = useMemo(
    () => Array.from(new Set(sections.map((s) => s.division).filter(Boolean))),
    [sections],
  );
  const districts = useMemo(
    () => Array.from(new Set(sections.map((s) => s.district).filter(Boolean))),
    [sections],
  );
  const gradeLevels = useMemo(
    () =>
      Array.from(
        new Set(
          sections
            .map((s) => s.gradeLevel)
            .filter((g) => g !== null && g !== undefined),
        ),
      ).sort((a, b) => Number(a) - Number(b)),
    [sections],
  );

  const [showRequestsModal, setShowRequestsModal] = useState(false);

  const isMainAdmin = user?.email === "jessiemangabo@gmail.com";
  const pendingRequests = globalSettings?.unfinalizeRequests || [];

  const handleApproveRequest = async (req: any) => {
    try {
      const docRef = doc(db, "settings", "general");
      const reqs = pendingRequests.filter(
        (r: any) =>
          !(r.schoolYear === req.schoolYear && r.timestamp === req.timestamp),
      );

      const sectionsSnap = await getDocs(collection(db, "sections"));
      const allSections = sectionsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const targetSections = req.sectionId
        ? allSections.filter((s: any) => s.id === req.sectionId)
        : allSections.filter(
            (s: any) =>
              s.schoolYear === req.schoolYear ||
              (!s.schoolYear && req.schoolYear === "No School Year") ||
              (!req.schoolYear && req.schoolYear === "active"),
          );

      const updatePromises = [];
      for (const tsec of targetSections) {
        const snaps = await getDocs(
          collection(db, `sections/${tsec.id}/students`),
        );
        for (const docSnap of snaps.docs) {
          const studentData = docSnap.data();
          if (
            studentData.status === "Promoted" ||
            studentData.status === "Retained" ||
            studentData.status === "Active"
          ) {
            updatePromises.push(
              updateDoc(doc(db, `sections/${tsec.id}/students`, docSnap.id), {
                status: "Active",
              }),
            );
          }
        }
        updatePromises.push(
          updateDoc(doc(db, "sections", tsec.id), { isFinalized: false }),
        );
      }

      await Promise.all(updatePromises);
      await updateDoc(docRef, { unfinalizeRequests: reqs });
      alert(
        `Unfinalize Request Approved${req.sectionName ? " for Section: " + req.sectionName : ""}`,
      );
    } catch (e) {
      console.error(e);
      alert("Failed to approve request.");
    }
  };

  const handleRejectRequest = async (req: any) => {
    try {
      const docRef = doc(db, "settings", "general");
      const reqs = pendingRequests.filter(
        (r: any) =>
          !(r.schoolYear === req.schoolYear && r.timestamp === req.timestamp),
      );
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
    if (
      window.confirm(
        "Are you sure you want to finalize all sections for the current school year? This action cannot be undone.",
      )
    ) {
      try {
        const batch = writeBatch(db);
        let count = 0;
        sections
          .filter(
            (s) =>
              s.schoolYear === globalSettings.activeSchoolYear &&
              !s.isFinalized,
          )
          .forEach((s) => {
            batch.update(doc(db, "sections", s.id), { isFinalized: true });
            count++;
          });

        // Also finalize the school record itself in firestore
        if (user?.schoolId) {
          const q = query(
            collection(db, "schools"),
            where("schoolId", "==", user.schoolId),
          );
          const snap = await getDocs(q);
          snap.forEach((d) => {
            batch.update(doc(db, "schools", d.id), { isFinalized: true });
          });
        }

        if (count > 0 || user?.schoolId) {
          await batch.commit();
          alert(
            `Successfully finalized the school and its ${count} sections for ${globalSettings.activeSchoolYear}.`,
          );
        } else {
          alert(
            "All active sections are already finalized or none exist for the active school year.",
          );
        }
      } catch (err) {
        handleFirestoreError(err, "write", "sections");
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
    }[],
  ) => {
    const visibleItems = items.filter((item) => item.visible);
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
          <ChevronDown
            size={14}
            className={`opacity-50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
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
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${item.textClass || "text-slate-700 hover:bg-slate-50"}`}
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
                    <h3 className="text-xl font-black text-slate-900">
                      Unfinalize Requests
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Approve or reject System Admin requests to unfinalize
                      school years.
                    </p>
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
                    <p className="text-slate-500 font-bold mb-1">
                      All Caught Up
                    </p>
                    <p className="text-slate-400 text-sm">
                      There are no pending requests to unfinalize any sections.
                    </p>
                  </div>
                ) : (
                  pendingRequests.map((req: any, idx: number) => (
                    <div
                      key={idx}
                      className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-slate-200 text-indigo-600">
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            Pending Action
                          </h4>
                          <p className="text-xs text-slate-600">
                            Requested by{" "}
                            <span className="font-semibold text-slate-700">
                              {req.requestedBy}
                            </span>{" "}
                            for{" "}
                            <span className="font-bold text-indigo-600 border border-indigo-100 bg-indigo-50 px-1 rounded">
                              {req.sectionName
                                ? `Section ${req.sectionName} (${req.schoolYear})`
                                : req.schoolYear}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectRequest(req)}
                          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border border-slate-200 rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveRequest(req)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2"
                        >
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
      {subDetails.isExpired && user?.email !== "jessiemangabo@gmail.com" && (
        <div className="bg-rose-500 text-white px-4 py-2.5 text-center text-sm font-semibold flex items-center justify-center gap-2 relative z-50 shadow-sm shrink-0 print:hidden">
          <AlertTriangle size={18} className="animate-pulse" />
          {user?.role === "system_admin" || user?.role === "admin"
            ? "Your school's enterprise license has expired. Please contact the system provider to renew your subscription."
            : "Your school's enterprise license has expired. Please contact your system administrator to restore access."}
          {(user?.role === "system_admin" || user?.role === "admin") &&
            onRenew && (
              <button
                onClick={() => setShowSOA(true)}
                className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded border border-white/30 transition-colors text-xs uppercase tracking-wider"
              >
                Renew Now
              </button>
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
              <span className="hidden md:block">CLASS Enterprise</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                v2.4
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          {/* Theme button hidden from section header per user request */}

          {(isMainAdmin || user?.role === "system_admin") &&
            !!globalSettings?.finalizationDeadline && (
              <button
                onClick={() => setShowRequestsModal(true)}
                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold text-xs px-3 py-2 rounded-lg transition-all shadow-sm relative"
              >
                <AlertTriangle size={14} />{" "}
                <span className="hidden sm:inline">Unfinalize Requests</span>
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
              <QrCode size={14} />{" "}
              <span className="hidden sm:inline">Scan ID</span>
            </button>
          )}

          {user?.role === "system_admin" && onManageUsers && (
            <>
              <button
                onClick={onManageUsers}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-lg transition-all shadow-sm"
              >
                <Users size={14} />{" "}
                <span className="hidden sm:inline">Manage Users</span>
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
                  <Building size={14} />{" "}
                  <span className="hidden sm:inline">Manage School</span>
                </button>
              )}
            </>
          )}

          {user?.role === "system_admin" &&
            !!globalSettings?.finalizationDeadline &&
            !isEntireSchoolFinalized &&
            !isSchoolDbFinalized && (
              <button
                onClick={handleFinalizeEntireSchool}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-all shadow-sm"
              >
                <CheckCircle size={14} />{" "}
                <span className="hidden sm:inline">Finalize Entire School</span>
              </button>
            )}

          {user?.role === "admin" && (
            <div className="relative z-50">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border text-slate-700 font-semibold text-xs px-3 py-2 rounded-lg transition-all shadow-sm ${isSettingsOpen ? "border-indigo-300 ring-2 ring-indigo-50" : "border-slate-200"}`}
              >
                <Settings size={14} />{" "}
                <span className="hidden sm:inline">Settings</span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${isSettingsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isSettingsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSettingsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 py-1 z-50 divide-y divide-slate-50">
                    {onManageUsers && (
                      <button
                        onClick={() => {
                          onManageUsers();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                      >
                        <Users size={14} className="text-slate-400" /> Manage
                        Users
                        {pendingUsersCount > 0 && (
                          <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                            {pendingUsersCount}
                          </span>
                        )}
                      </button>
                    )}
                    {onScanID && (
                      <button
                        onClick={() => {
                          onScanID();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                      >
                        <QrCode size={14} className="text-indigo-600" /> Scan ID
                      </button>
                    )}
                    {onManageSchools && (
                      <button
                        onClick={() => {
                          onManageSchools();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <Building size={14} className="text-slate-400" /> Manage
                        School
                      </button>
                    )}
                    {onManageSchoolYears && (
                      <button
                        onClick={() => {
                          onManageSchoolYears();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <Calendar size={14} className="text-slate-400" /> School
                        Year
                      </button>
                    )}
                    {onManageCalendar && (
                      <button
                        onClick={() => {
                          onManageCalendar();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <Calendar size={14} className="text-slate-400" /> School
                        Calendar
                      </button>
                    )}
                    {onShowFeedbackDashboard && (
                      <button
                        onClick={() => {
                          onShowFeedbackDashboard();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors bg-indigo-50/30"
                      >
                        <Sparkles size={14} className="text-indigo-400" />{" "}
                        Feedback Dashboard
                      </button>
                    )}
                    {onOpenThemeModal && (
                      <button
                        onClick={() => {
                          onOpenThemeModal();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                      >
                        <Palette size={14} className="text-indigo-500" />{" "}
                        Appearance & Themes
                      </button>
                    )}
                    {onSetActiveTab && (
                      <button
                        onClick={() => {
                          onSetActiveTab("mysql");
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                      >
                        <Database size={14} className="text-indigo-600" /> MySQL
                        Database & Migration
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Keep Verify Students button separate for Advisers */}
          {user?.role === "teacher" && isAnySectionAdviser && onManageUsers && (
            <button
              onClick={onManageUsers}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
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
              <p
                className="text-xs font-semibold text-slate-700 leading-tight truncate w-full"
                title={user?.displayName || ""}
              >
                {user?.displayName}
              </p>
              <div className="flex items-center gap-1 mt-0.5 w-full">
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  {user?.role?.replace("_", " ")}
                </p>
              </div>
            </div>
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all"
            title="Sign Out"
          >
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
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Institutional Dashboard
                </span>
              </div>

              {/* Premium Contextual Header for Sections */}
              <div className="relative bg-white rounded-2xl p-8 md:p-10 mb-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl opacity-60 -mr-10 -mt-10 pointer-events-none"></div>

                <div className="relative z-10 space-y-3 max-w-2xl">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                    Welcome back,{" "}
                    <span className="text-indigo-600">
                      {(user?.displayName || "Educator").split(" ")[0]}
                    </span>
                  </h1>
                  <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
                    Overview and manage academic sections. You currently have
                    access to{" "}
                    <strong className="text-slate-800 font-semibold">
                      {sections.length}
                    </strong>{" "}
                    active class records.
                  </p>
                  <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">
                    One System. One Encoding. Everything Connected.
                  </p>
                </div>

                <div className="relative z-10 flex flex-col items-end gap-3 shrink-0 w-full md:w-auto">
                  <div className="flex items-center justify-between w-full md:w-auto gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Current Session
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {user?.role?.replace("_", " ")}
                      </span>
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

              {(sections.some((s) => s.deletionStatus === "pending") ||
                sections.some((s) => s.deletionStatus === "approved") ||
                sections.some((s) => s.deletionStatus === "rejected")) && (
                <div
                  className={`mb-8 p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm transition-all ${
                    sections.some((s) => s.deletionStatus === "pending")
                      ? "bg-amber-50 border-amber-200"
                      : sections.some((s) => s.deletionStatus === "rejected")
                        ? "bg-rose-50 border-rose-200"
                        : "bg-emerald-50 border-emerald-200"
                  }`}
                >
                  <div className="flex items-start md:items-center gap-4 md:gap-5">
                    <div
                      className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center border shadow-sm ${
                        sections.some((s) => s.deletionStatus === "pending")
                          ? "bg-amber-100 text-amber-600 border-amber-200"
                          : sections.some(
                                (s) => s.deletionStatus === "rejected",
                              )
                            ? "bg-rose-100 text-rose-600 border-rose-200"
                            : "bg-emerald-100 text-emerald-600 border-emerald-200"
                      }`}
                    >
                      <ShieldCheck
                        size={28}
                        className={
                          sections.some((s) => s.deletionStatus === "pending")
                            ? "animate-pulse"
                            : ""
                        }
                      />
                    </div>
                    <div>
                      <h4
                        className={`text-base font-bold tracking-tight mb-1 ${
                          sections.some((s) => s.deletionStatus === "pending")
                            ? "text-amber-900"
                            : sections.some(
                                  (s) => s.deletionStatus === "rejected",
                                )
                              ? "text-rose-900"
                              : "text-emerald-900"
                        }`}
                      >
                        {user?.role === "system_admin" || user?.role === "admin"
                          ? sections.some((s) => s.deletionStatus === "pending")
                            ? "Waiting for Approval"
                            : sections.some(
                                  (s) => s.deletionStatus === "rejected",
                                )
                              ? "Deletion Disapproved"
                              : "Ready for Deletion"
                          : sections.some((s) => s.deletionStatus === "pending")
                            ? "Deletion Pending"
                            : sections.some(
                                  (s) => s.deletionStatus === "rejected",
                                )
                              ? "Request Disapproved"
                              : "Ready for Deletion"}
                      </h4>
                      <p
                        className={`text-sm font-medium max-w-xl leading-relaxed ${
                          sections.some((s) => s.deletionStatus === "pending")
                            ? "text-amber-700/80"
                            : sections.some(
                                  (s) => s.deletionStatus === "rejected",
                                )
                              ? "text-rose-700/80"
                              : "text-emerald-700/80"
                        }`}
                      >
                        {user?.role === "system_admin" || user?.role === "admin"
                          ? sections.some((s) => s.deletionStatus === "pending")
                            ? "There are sections awaiting your security authorization. Please review and approve requests before records are permanently removed."
                            : sections.some(
                                  (s) => s.deletionStatus === "rejected",
                                )
                              ? "One or more deletion requests have been disapproved. The Adviser has been notified of the decision and the reason."
                              : "Deletions have been authorized. You can now proceed with the permanent removal of these records."
                          : sections.some((s) => s.deletionStatus === "pending")
                            ? "Your deletion request is currently waiting for authorization from the System Administrator."
                            : sections.some(
                                  (s) => s.deletionStatus === "rejected",
                                )
                              ? "Your deletion request has been disapproved. Please check the section details for the reason provided."
                              : "The System Administrator has authorized your deletion request. It will be permanently removed shortly."}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-end gap-2 shrink-0">
                    {sections.filter((s) => s.deletionStatus === "pending")
                      .length > 0 && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm flex items-center gap-1.5">
                        <Clock size={14} />{" "}
                        {
                          sections.filter((s) => s.deletionStatus === "pending")
                            .length
                        }{" "}
                        Waiting
                      </span>
                    )}
                    {sections.filter((s) => s.deletionStatus === "approved")
                      .length > 0 && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm flex items-center gap-1.5">
                        <CheckCircle size={14} />{" "}
                        {
                          sections.filter(
                            (s) => s.deletionStatus === "approved",
                          ).length
                        }{" "}
                        Ready
                      </span>
                    )}
                    {sections.filter((s) => s.deletionStatus === "rejected")
                      .length > 0 && (
                      <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm flex items-center gap-1.5">
                        <XCircle size={14} />{" "}
                        {
                          sections.filter(
                            (s) => s.deletionStatus === "rejected",
                          ).length
                        }{" "}
                        Disapproved
                      </span>
                    )}
                  </div>
                </div>
              )}

              {(user?.role === "admin" ||
                user?.role === "system_admin" ||
                user?.role === "school_head" ||
                isAuthorizedCashier) && (
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto shrink-0 mt-6 xl:mt-0 mb-8">
                  {renderAdminDropdown(
                    "financials",
                    "Financials",
                    <BarChart2 size={16} className="text-emerald-600" />,
                    [
                      {
                        label: "Financial Statement",
                        icon: (
                          <BarChart2 size={15} className="text-emerald-600" />
                        ),
                        onClick: onShowFinancialStatement,
                        visible: !!(
                          onShowFinancialStatement &&
                          (user?.role === "system_admin" ||
                            user?.role === "school_head" ||
                            isAuthorizedCashier)
                        ),
                        textClass: "text-emerald-700 hover:bg-emerald-50",
                      },
                    ],
                  )}

                  {renderAdminDropdown(
                    "school-forms",
                    "School Forms",
                    <FileText size={16} className="text-amber-600" />,
                    [
                      {
                        label: "School Form 4 (SF4)",
                        icon: <FileText size={15} className="text-amber-600" />,
                        onClick: onShowSF4,
                        visible: !!(
                          onShowSF4 &&
                          (user?.role === "system_admin" ||
                            user?.role === "school_head")
                        ),
                        textClass: "text-amber-700 hover:bg-amber-50",
                      },
                      {
                        label: "School Form 7 (SF7)",
                        icon: (
                          <FileText size={15} className="text-indigo-600" />
                        ),
                        onClick: onShowSF7,
                        visible: !!(
                          onShowSF7 &&
                          (user?.role === "system_admin" ||
                            user?.role === "admin")
                        ),
                        textClass: "text-indigo-700 hover:bg-indigo-50",
                      },
                    ],
                  )}

                  {renderAdminDropdown(
                    "academic-programs",
                    "Academic Programs",
                    <BookOpen size={16} className="text-indigo-600" />,
                    [
                      {
                        label: "Subject Menu",
                        icon: (
                          <BookOpen size={15} className="text-indigo-600" />
                        ),
                        onClick: () => onSetActiveTab("subjects"),
                        visible: user?.role === "system_admin",
                        textClass: "text-slate-700 hover:bg-slate-50",
                      },
                      {
                        label: "G9/G10 TLE Allocation",
                        icon: (
                          <GraduationCap
                            size={15}
                            className="text-indigo-600"
                          />
                        ),
                        onClick: () => onSetActiveTab("tle-dashboard"),
                        visible: !!(
                          user?.role === "admin" ||
                          user?.role === "system_admin" ||
                          (user?.role === "teacher" && hasAssignedSubjects)
                        ),
                        textClass: "text-slate-700 hover:bg-slate-50",
                      },
                      {
                        label: "ARAL Program",
                        icon: (
                          <GraduationCap
                            size={15}
                            className="text-indigo-600"
                          />
                        ),
                        onClick: () => onSetActiveTab("aral"),
                        visible: !!(
                          onSetActiveTab &&
                          (user?.role === "system_admin" ||
                            user?.role === "school_head" ||
                            user?.role === "admin" ||
                            (mapUserRoleToAralRole &&
                              mapUserRoleToAralRole(user?.role, user?.email) ===
                                "ARAL Coordinator"))
                        ),
                        textClass: "text-indigo-700 hover:bg-indigo-50",
                      },
                    ],
                  )}

                  {renderAdminDropdown(
                    "learner-mgmt",
                    "Learner Management",
                    <Users size={16} className="text-indigo-600" />,
                    [
                      {
                        label: "Student List",
                        icon: (
                          <TableIcon size={15} className="text-indigo-600" />
                        ),
                        onClick: onManageStudentList,
                        visible: !!(
                          (user?.role === "admin" ||
                            user?.role === "system_admin") &&
                          onManageStudentList
                        ),
                        textClass: "text-slate-700 hover:bg-slate-50",
                      },
                      {
                        label: "Download CSV Template",
                        icon: (
                          <Download size={15} className="text-indigo-600" />
                        ),
                        onClick: downloadDashboardCSVTemplate,
                        visible: user?.role === "system_admin",
                        textClass: "text-slate-700 hover:bg-slate-50",
                      },
                      {
                        label: "Bulk Upload (for Learner Upload)",
                        icon: <FileUp size={15} className="text-indigo-600" />,
                        visible: user?.role === "system_admin",
                        customRender: (close) => (
                          <label
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer w-full text-indigo-600 hover:bg-indigo-50/50 ${
                              isUploadingDashboard
                                ? "opacity-50 cursor-not-allowed"
                                : ""
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
                        ),
                      },
                    ],
                  )}
                </div>
              )}
              {activeSchool &&
                (user?.role === "system_admin" ||
                  user?.role === "admin" ||
                  user?.role === "school_head") && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 animate-in fade-in duration-200">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3.5 rounded-2xl flex items-center justify-center shrink-0 border ${
                          subDetails.isFreeAccess
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-indigo-50 text-indigo-600 border-indigo-100"
                        }`}
                      >
                        <CreditCard size={24} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">
                            {activeSchool.name} Subscription Status
                          </h4>
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-slate-200">
                            {subDetails.category} Tier ({teacherCount} active{" "}
                            {teacherCount === 1 ? "teacher" : "teachers"})
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Your data subscription tier is calculated in real-time
                          based on the number of registered school teachers.
                        </p>
                        <button
                          onClick={() => setShowSOA(true)}
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer hover:underline mt-1"
                          title="View Ledger"
                        >
                          <Receipt size={14} /> View Statement of Account &
                          Ledger
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-stretch md:self-auto justify-between border-t border-slate-100 pt-4 md:border-0 md:pt-0">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Computed Annual Payment
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          {subDetails.isFreeAccess ? (
                            <>
                              <span className="text-xl font-black text-emerald-600 font-sans">
                                Free Access Mode
                              </span>
                              <span className="text-xs text-slate-400 line-through">
                                {subDetails.priceLabel}
                              </span>
                            </>
                          ) : (
                            <span className="text-xl font-black text-indigo-600 font-sans">
                              {subDetails.priceLabel}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            / year
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        {subDetails.isFreeAccess ? (
                          <div className="bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-4 py-2.5 rounded-xl text-xs space-y-0.5 font-semibold">
                            <p className="font-extrabold flex items-center gap-1.5 uppercase text-[9px] tracking-widest text-emerald-950">
                              One-Year Free Access Active
                            </p>
                            <p className="text-[11px] text-emerald-750 font-medium">
                              Valid until {subDetails.expirationDateStr}
                            </p>
                          </div>
                        ) : subDetails.isPaidYear2 ? (
                          <div className="bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-4 py-2.5 rounded-xl text-xs space-y-0.5 font-semibold">
                            <p className="font-extrabold flex items-center gap-1.5 uppercase text-[9px] tracking-widest text-emerald-950">
                              Paid Subscription (Year 2) Active
                            </p>
                            <p className="text-[11px] text-emerald-750 font-medium">
                              Fully paid. Valid until{" "}
                              {subDetails.expirationDateStr}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                            <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-2.5 rounded-xl text-xs space-y-0.5 font-semibold">
                              <p className="font-extrabold flex items-center gap-1.5 uppercase text-[9px] tracking-widest text-rose-950">
                                Renewal Pending (Year 2)
                              </p>
                              <p className="text-[11px] text-rose-750 font-bold">
                                Unpaid. Click PAID to renew subscription
                              </p>
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
                                <svg
                                  className="animate-spin h-3.5 w-3.5 text-white"
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
                      <div
                        className={`flex items-center bg-white border ${!globalSettings?.activeSchoolYear ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200 hover:border-indigo-300"} rounded-lg px-3 py-2 shadow-sm transition-colors`}
                      >
                        <Calendar
                          size={14}
                          className={
                            !globalSettings?.activeSchoolYear
                              ? "text-rose-500 mr-2"
                              : "text-slate-400 mr-2"
                          }
                        />
                        <select
                          value={filters.schoolYear}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              schoolYear: e.target.value,
                            })
                          }
                          className={`bg-transparent border-none text-xs font-semibold outline-none ${!globalSettings?.activeSchoolYear ? "text-rose-600" : "text-slate-700"} cursor-pointer min-w-[130px]`}
                        >
                          <option value="all">All School Years</option>
                          {schoolYears.map((sy) => (
                            <option key={sy} value={sy}>
                              {sy}
                            </option>
                          ))}
                          {hasNoSchoolYear && (
                            <option value="No School Year">
                              No School Year
                            </option>
                          )}
                        </select>
                      </div>
                      {!globalSettings?.activeSchoolYear && (
                        <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white border border-rose-200 rounded-xl shadow-lg z-50 pointer-events-none transform origin-top transition-all scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100">
                          <div className="flex items-start gap-2">
                            <AlertCircle
                              size={16}
                              className="text-rose-500 shrink-0"
                            />
                            <p className="text-xs font-medium text-slate-700 leading-snug">
                              No active school year. Please set one in{" "}
                              <span className="text-rose-600 font-semibold">
                                Settings &gt; School Years
                              </span>
                              .
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

                    <div
                      className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full"
                      style={{ scrollbarWidth: "none" }}
                    >
                      <button
                        onClick={() =>
                          setFilters({ ...filters, gradeLevel: "" })
                        }
                        className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${!filters.gradeLevel ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        All Grades
                      </button>
                      {gradeLevels.map((g) => (
                        <button
                          key={g}
                          onClick={() =>
                            setFilters({ ...filters, gradeLevel: String(g) })
                          }
                          className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${String(filters.gradeLevel) === String(g) ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          {Number(g) === 0 ? "Kinder" : `G${g}`}
                        </button>
                      ))}
                    </div>

                    {user?.role === "admin" && (
                      <>
                        <div className="w-px h-6 bg-slate-200 mx-1 hidden lg:block"></div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <div className="flex items-center bg-white border border-slate-200 hover:border-indigo-300 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors">
                            <Building
                              size={14}
                              className="text-slate-400 mr-1.5"
                            />
                            <select
                              value={filters.region}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  region: e.target.value,
                                })
                              }
                              className="bg-transparent border-none text-[11px] font-semibold outline-none text-slate-600 cursor-pointer min-w-[70px]"
                            >
                              <option value="">Region</option>
                              {regions.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center bg-white border border-slate-200 hover:border-indigo-300 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors">
                            <Building
                              size={14}
                              className="text-slate-400 mr-1.5"
                            />
                            <select
                              value={filters.division}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  division: e.target.value,
                                })
                              }
                              className="bg-transparent border-none text-[11px] font-semibold outline-none text-slate-600 cursor-pointer min-w-[70px]"
                            >
                              <option value="">Division</option>
                              {divisions.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center bg-white border border-slate-200 hover:border-indigo-300 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors">
                            <Building
                              size={14}
                              className="text-slate-400 mr-1.5"
                            />
                            <select
                              value={filters.district}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  district: e.target.value,
                                })
                              }
                              className="bg-transparent border-none text-[11px] font-semibold outline-none text-slate-600 cursor-pointer min-w-[70px]"
                            >
                              <option value="">District</option>
                              {districts.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-px h-6 bg-slate-200 mx-1 hidden lg:block"></div>
                          <div className="flex items-center bg-white border border-slate-200 hover:border-indigo-300 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors">
                            <select
                              value={filters.visibility ?? "all"}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  visibility: e.target.value,
                                })
                              }
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

              {user?.role === "system_admin" && subjects.length > 0 && (
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
                        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider leading-none font-sans uppercase tracking-tight">
                          Section Subject Finalization Overview
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">
                          Monitor finalization status across academic classes
                        </p>
                      </div>
                    </div>
                    <div className="text-slate-400 p-1 bg-white hover:bg-slate-200 rounded-lg border border-slate-200 transition-all">
                      {isOverviewOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
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
                            {adminSortedGradeLevels.map((gradeLevel) => {
                              const gradeLabel =
                                Number(gradeLevel) === 0
                                  ? "Kindergarten"
                                  : `Grade ${gradeLevel}`;
                              const sectionsInGrade =
                                adminGroupedOverview[gradeLevel];
                              const sectionIds = Object.keys(
                                sectionsInGrade,
                              ).sort((a, b) => {
                                const nameA =
                                  sectionsInGrade[a].sectionName.toLowerCase();
                                const nameB =
                                  sectionsInGrade[b].sectionName.toLowerCase();
                                return nameA.localeCompare(nameB);
                              });
                              const isCollapsed = collapsedAdminGrades.has(
                                Number(gradeLevel),
                              );

                              return (
                                <div
                                  key={gradeLevel}
                                  className="bg-slate-50/40 rounded-2xl p-4 border border-slate-200/65 space-y-3 transition-colors hover:bg-slate-50/70"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCollapsedAdminGrades((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(Number(gradeLevel)))
                                          next.delete(Number(gradeLevel));
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
                                        {sectionIds.length}{" "}
                                        {sectionIds.length === 1
                                          ? "Section"
                                          : "Sections"}
                                      </span>
                                    </div>
                                    <div className="text-slate-400 p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center justify-center shadow-xs">
                                      {isCollapsed ? (
                                        <ChevronDown size={14} />
                                      ) : (
                                        <ChevronUp size={14} />
                                      )}
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
                                        {sectionIds.map((sectionId) => {
                                          const secData =
                                            sectionsInGrade[sectionId];
                                          return (
                                            <div
                                              key={sectionId}
                                              className="space-y-2.5 bg-white/70 p-3.5 rounded-xl border border-slate-100"
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-[11px] text-slate-500 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
                                                  Section:{" "}
                                                  <span className="text-slate-800 font-extrabold">
                                                    {secData.sectionName}
                                                  </span>
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                  ({secData.subjects.length}{" "}
                                                  subjects)
                                                </span>
                                              </div>

                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                {secData.subjects.map((sub) => {
                                                  const offered =
                                                    sub.offeredTerms &&
                                                    sub.offeredTerms.length > 0
                                                      ? sub.offeredTerms
                                                      : ([1, 2, 3, 4] as any[]);
                                                  const teacherName =
                                                    sub.teacherEmail ||
                                                    "No Teacher Assigned";

                                                  return (
                                                    <div
                                                      key={`${sub.id}-${sub.sectionId || ""}`}
                                                      className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between gap-2.5 transition-all shadow-xs group hover:border-indigo-200"
                                                    >
                                                      <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0 flex-1">
                                                          <h6
                                                            className="font-extrabold text-slate-800 text-xs truncate"
                                                            title={sub.name}
                                                          >
                                                            {sub.name}
                                                          </h6>
                                                          <p
                                                            className="text-[9px] text-slate-500 truncate mt-0.5 font-semibold"
                                                            title={teacherName}
                                                          >
                                                            {teacherName}
                                                          </p>
                                                        </div>
                                                      </div>

                                                      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-100/80">
                                                        {offered.map((term) => {
                                                          const isFinalized =
                                                            sub.finalizedTerms?.includes(
                                                              term,
                                                            );
                                                          return (
                                                            <div
                                                              key={term}
                                                              className="flex flex-row items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                                                            >
                                                              <span className="font-semibold text-slate-600 text-[10px] uppercase tracking-wider">
                                                                Term {term}
                                                              </span>
                                                              {isFinalized ? (
                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                                                                    <Check
                                                                      size={10}
                                                                    />{" "}
                                                                    Finalized
                                                                  </span>
                                                                  {onToggleFinalizeSubjectTerm && (
                                                                    <button
                                                                      onClick={(
                                                                        e,
                                                                      ) => {
                                                                        e.stopPropagation();
                                                                        setConfirmFinalizeConfig(
                                                                          {
                                                                            subjectId:
                                                                              sub.id,
                                                                            term,
                                                                            finalize: false,
                                                                          },
                                                                        );
                                                                      }}
                                                                      className="text-[9px] px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 font-bold uppercase hover:bg-amber-100 cursor-pointer transition-colors"
                                                                      title={`Unfinalize Term ${term}`}
                                                                    >
                                                                      Unfinalize
                                                                    </button>
                                                                  )}
                                                                </div>
                                                              ) : (
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                                  Pending
                                                                </span>
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
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                          confirmFinalizeConfig.finalize
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {confirmFinalizeConfig.finalize ? (
                          <CheckCircle size={32} />
                        ) : (
                          <AlertTriangle size={32} />
                        )}
                      </div>

                      <h3 className="text-xl font-black text-slate-900 mb-2">
                        {confirmFinalizeConfig.finalize
                          ? "Finalize & Release Term Grades?"
                          : "Unfinalize Term Grades?"}
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
                              onToggleFinalizeSubjectTerm(
                                confirmFinalizeConfig.subjectId,
                                confirmFinalizeConfig.term as any,
                                confirmFinalizeConfig.finalize,
                              );
                            }
                            setConfirmFinalizeConfig(null);
                          }}
                          className={`flex-1 py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 ${
                            confirmFinalizeConfig.finalize
                              ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                              : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                          }`}
                        >
                          {confirmFinalizeConfig.finalize
                            ? "Yes, Finalize & Release"
                            : "Yes, Unfinalize"}
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
                          <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                            Add New Section
                          </h2>
                          <p className="text-xs font-medium text-slate-500 mt-1.5">
                            Register a new academic group to the system
                          </p>
                        </div>
                        <button
                          onClick={() => setShowAdd(false)}
                          className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-100"
                        >
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsListOpen(!isListOpen);
                  }}
                  className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/70 border-b border-slate-100 transition-colors text-left font-sans cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Users size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider leading-none">
                        Academic Sections List
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">
                        Browse and manage active groups below
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(user?.role === "admin" ||
                      user?.role === "system_admin") &&
                      !isEntireSchoolFinalized && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              user?.email !== "jessiemangabo@gmail.com" &&
                              (!globalSettings?.activeSchoolYear ||
                                isGlobalFinalized)
                            )
                              return;
                            setShowAdd(true);
                          }}
                          disabled={
                            user?.email !== "jessiemangabo@gmail.com" &&
                            (!globalSettings?.activeSchoolYear ||
                              isGlobalFinalized)
                          }
                          className="flex items-center justify-center gap-1.5 bg-indigo-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-sm hover:bg-indigo-700 hover:shadow transition-all cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Add Section</span>
                        </button>
                      )}
                    <div className="text-slate-400 p-1 bg-white hover:bg-slate-200 rounded-lg border border-slate-200 transition-all">
                      {isListOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
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
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                  Selection Required
                                </h2>
                                <p className="text-slate-500 max-w-sm mx-auto mt-1.5 text-sm">
                                  Please use the filters above to browse and
                                  select academic sections.
                                </p>
                              </div>
                            </div>
                          ) : renderItems.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-dashed border-slate-300 text-center shadow-sm">
                              <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-400">
                                <Users size={28} />
                              </div>
                              <div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                  No Sections Found
                                </h2>
                                <p className="text-slate-500 max-w-sm mx-auto mt-1.5 text-sm">
                                  Try adjusting your filters to see more
                                  results.
                                </p>
                              </div>
                            </div>
                          ) : (
                            renderItems.map((item) => {
                              if (item.type === "aral-class") {
                                const { aralClass } = item;
                                const isExpired = aralClass.schoolId
                                  ? expiredSchoolIds.includes(
                                      aralClass.schoolId,
                                    )
                                  : false;
                                return (
                                  <motion.div
                                    key={aralClass.id}
                                    whileHover={isExpired ? {} : { y: -4 }}
                                    onClick={() => {
                                      if (onSelectAralClassId) {
                                        onSelectAralClassId(aralClass.id);
                                      }
                                      if (onSetActiveTab) {
                                        onSetActiveTab("aral");
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
                                              <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-200">
                                                Expired
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight mb-2 group-hover:text-amber-800 transition-colors">
                                      {aralClass.name}
                                    </h3>

                                    <div className="flex-1 space-y-3 mb-5">
                                      {aralClass.schoolYear && (
                                        <p className="text-[12px] text-slate-500 tracking-wide flex items-center gap-1.5">
                                          <Calendar
                                            size={12}
                                            className="text-slate-400"
                                          />
                                          SY {aralClass.schoolYear}
                                        </p>
                                      )}
                                      {aralClass.targetSubject && (
                                        <p className="text-[12px] text-slate-600 font-medium tracking-wide flex items-center gap-1.5">
                                          <BookOpen
                                            size={12}
                                            className="text-slate-400"
                                          />
                                          Subject:{" "}
                                          <span className="font-bold text-slate-800">
                                            {aralClass.targetSubject}
                                          </span>
                                        </p>
                                      )}
                                      {(aralClass.adviserName ||
                                        aralClass.adviserEmail) && (
                                        <p className="text-[12px] text-slate-500 tracking-wide flex items-center gap-1.5">
                                          <User
                                            size={12}
                                            className="text-slate-400"
                                          />
                                          Tutor:{" "}
                                          {aralClass.adviserName ||
                                            aralClass.adviserEmail}
                                        </p>
                                      )}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-dashed border-amber-200 flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                        <Users
                                          size={14}
                                          className="text-amber-600"
                                        />
                                        <span className="font-semibold text-slate-700">
                                          {aralClass.studentIds?.length || 0}{" "}
                                          Learners Enrolled
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-bold text-amber-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        Manage Remediations{" "}
                                        <ArrowRight size={10} />
                                      </span>
                                    </div>
                                  </motion.div>
                                );
                              }

                              if (item.type === "tle-group") {
                                const {
                                  key,
                                  tleName,
                                  gradeLevels,
                                  sections,
                                  isExpired,
                                } = item;
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
                                              {gradeLevels.length === 1
                                                ? `Grade ${gradeLevels[0]}`
                                                : `Grades ${gradeLevels.join(" & ")}`}
                                            </span>
                                            {isExpired && (
                                              <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-200">
                                                Expired
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight mb-4 group-hover:text-indigo-700 transition-colors">
                                      {tleName}
                                    </h3>
                                    <div className="flex-1 space-y-4 mb-5">
                                      <div className="p-3 bg-white border border-indigo-50 rounded-xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                                          Enrolled Sections ({sections.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {sections.map((section) => (
                                            <button
                                              key={section.id}
                                              onClick={() => {
                                                onNavigateToSubject(
                                                  section,
                                                  tleName,
                                                );
                                              }}
                                              className="text-[11px] items-center flex gap-1.5 font-bold bg-indigo-50/50 hover:bg-indigo-600 hover:text-white text-indigo-700 px-3 py-2 rounded-lg border border-indigo-100 transition-colors"
                                            >
                                              {section.name}{" "}
                                              <ArrowRight size={12} />
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
                              const isExpired = section.schoolId
                                ? expiredSchoolIds.includes(section.schoolId)
                                : false;
                              const currentUserEmail = (user?.email || "")
                                .trim()
                                .toLowerCase();
                              const isAdviserOfSection =
                                currentUserEmail.length > 0 &&
                                (section.adviserEmail || "")
                                  .trim()
                                  .toLowerCase() === currentUserEmail;
                              const isSubjectTeacherOfSection =
                                currentUserEmail.length > 0 &&
                                (subjects.some(
                                  (s) =>
                                    s.sectionId === section.id &&
                                    (s.teacherEmail || "")
                                      .trim()
                                      .toLowerCase() === currentUserEmail,
                                ) ||
                                  (section.subjectTeachers &&
                                    Object.values(section.subjectTeachers).some(
                                      (tEmail) =>
                                        typeof tEmail === "string" &&
                                        tEmail.trim().toLowerCase() ===
                                          currentUserEmail,
                                    )));

                              const cardBgClasses = isAdviserOfSection
                                ? "bg-emerald-50/20 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100"
                                : isSubjectTeacherOfSection
                                  ? "bg-indigo-50/20 border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100"
                                  : "bg-white border-slate-200 hover:border-indigo-300";

                              const iconBgClasses = isAdviserOfSection
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600"
                                : isSubjectTeacherOfSection
                                  ? "bg-indigo-100 text-indigo-700 border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600"
                                  : "bg-indigo-50 text-indigo-600 border-indigo-100/50 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600";

                              const cornerGlowClasses = isAdviserOfSection
                                ? "bg-emerald-100/30 group-hover:bg-emerald-200/40"
                                : isSubjectTeacherOfSection
                                  ? "bg-indigo-100/30 group-hover:bg-indigo-200/40"
                                  : "bg-indigo-50/50 group-hover:bg-indigo-100/50";

                              return (
                                <motion.div
                                  key={section.id}
                                  whileHover={isExpired ? {} : { y: -4 }}
                                  onClick={
                                    isExpired && user?.role !== "admin"
                                      ? undefined
                                      : () => onSelect(section)
                                  }
                                  className={`flex flex-col p-6 rounded-2xl border shadow-sm transition-all duration-300 group cursor-pointer relative overflow-hidden ${cardBgClasses} ${isExpired && user?.role !== "admin" ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  <div
                                    className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10 transition-colors ${cornerGlowClasses}`}
                                  ></div>

                                  <div className="flex justify-between items-start mb-5 relative z-10">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors border shrink-0 ${iconBgClasses}`}
                                      >
                                        <Users size={24} />
                                      </div>
                                      <div>
                                        {section.schoolName ? (
                                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">
                                            {section.schoolName}
                                          </p>
                                        ) : null}
                                        <div className="flex items-center flex-wrap gap-1.5">
                                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                                            {Number(section.gradeLevel) === 0
                                              ? "Kindergarten"
                                              : `Grade ${section.gradeLevel}`}
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
                                          <SectionYearEndBadge
                                            sectionId={section.id}
                                            schoolYear={section.schoolYear}
                                            globalSettings={globalSettings}
                                            isSectionFinalized={
                                              section.isFinalized
                                            }
                                          />
                                          {isExpired && (
                                            <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-200">
                                              Expired
                                            </span>
                                          )}
                                          {section.deletionStatus ===
                                            "pending" && (
                                            <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 animate-pulse">
                                              <Clock size={10} /> Pending
                                            </span>
                                          )}
                                          {section.deletionStatus ===
                                            "approved" && (
                                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                                              <CheckCircle size={10} /> Approved
                                            </span>
                                          )}
                                          {section.deletionStatus ===
                                            "rejected" && (
                                            <span className="text-[10px] font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                                              <XCircle size={10} /> Rejected
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex gap-2">
                                      {user?.role === "system_admin" &&
                                        !isEntireSchoolFinalized &&
                                        !section.isFinalized && (
                                          <button
                                            onClick={(e) => {
                                              if (
                                                user?.email !==
                                                  "jessiemangabo@gmail.com" &&
                                                (!globalSettings?.activeSchoolYear ||
                                                  isGlobalFinalized ||
                                                  section.isFinalized)
                                              )
                                                return;
                                              e.stopPropagation();
                                              setSectionToEdit(section);
                                            }}
                                            disabled={
                                              user?.email !==
                                                "jessiemangabo@gmail.com" &&
                                              (!globalSettings?.activeSchoolYear ||
                                                isGlobalFinalized ||
                                                section.isFinalized)
                                            }
                                            className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 rounded-md transition-all border border-transparent hover:border-indigo-100 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 focus:opacity-100"
                                          >
                                            <Edit2 size={14} />
                                          </button>
                                        )}
                                      {(user?.role === "teacher" ||
                                        user?.role === "system_admin" ||
                                        user?.role === "admin") &&
                                        !isEntireSchoolFinalized &&
                                        !section.isFinalized && (
                                          <button
                                            onClick={(e) => {
                                              if (
                                                isGlobalFinalized ||
                                                section.isFinalized
                                              )
                                                return;
                                              if (
                                                user?.email !==
                                                  "jessiemangabo@gmail.com" &&
                                                !globalSettings?.activeSchoolYear
                                              )
                                                return;
                                              e.stopPropagation();
                                              setSectionToDelete(section);
                                            }}
                                            disabled={
                                              isGlobalFinalized ||
                                              section.isFinalized ||
                                              (user?.email !==
                                                "jessiemangabo@gmail.com" &&
                                                !globalSettings?.activeSchoolYear)
                                            }
                                            className={`p-1.5 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed border opacity-0 group-hover:opacity-100 focus:opacity-100 ${
                                              true
                                                ? "bg-white text-slate-400 hover:text-rose-600 border-transparent hover:border-rose-100 hover:bg-rose-50"
                                                : ""
                                            }`}
                                            title={
                                              isGlobalFinalized ||
                                              section.isFinalized
                                                ? "Cannot delete when finalized. Please request unfinalization first."
                                                : user?.email ===
                                                    "jessiemangabo@gmail.com"
                                                  ? "Delete Section"
                                                  : section.deletionStatus ===
                                                      "pending"
                                                    ? user?.role === "admin" ||
                                                      user?.role ===
                                                        "system_admin"
                                                      ? "Approve Deletion Request"
                                                      : "Awaiting Approval"
                                                    : "Delete Section"
                                            }
                                          >
                                            {section.deletionStatus ===
                                              "pending" &&
                                            user?.email !==
                                              "jessiemangabo@gmail.com" ? (
                                              <Clock size={14} />
                                            ) : (
                                              <Trash2 size={14} />
                                            )}
                                          </button>
                                        )}
                                    </div>
                                  </div>

                                  <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight mb-2 group-hover:text-indigo-700 transition-colors">
                                    {section.name}
                                  </h3>
                                  <div className="flex-1 space-y-3 mb-5">
                                    {section.schoolYear && section.division && (
                                      <p className="text-[12px] text-slate-500 tracking-wide flex items-center gap-1">
                                        <Calendar
                                          size={12}
                                          className="text-slate-400"
                                        />
                                        SY {section.schoolYear}{" "}
                                        <span className="opacity-50 mx-1"></span>{" "}
                                        {section.division} Division
                                      </p>
                                    )}
                                  </div>

                                  <SectionStatsDisplay
                                    sectionId={section.id}
                                    schoolYear={section.schoolYear}
                                    schoolCalendar={schoolCalendar}
                                  />

                                  {(() => {
                                    const sectionSubjects = subjects.filter(
                                      (s) => s.sectionId === section.id,
                                    );
                                    const userEmail = (user?.email || "")
                                      .trim()
                                      .toLowerCase();

                                    const localItems = sectionSubjects
                                      .filter(
                                        (sub) =>
                                          (sub.teacherEmail || "")
                                            .trim()
                                            .toLowerCase() === userEmail,
                                      )
                                      .map((s) => s.name);
                                    const globalItems: string[] = [];
                                    if (section.subjectTeachers) {
                                      for (const [
                                        subjId,
                                        tEmail,
                                      ] of Object.entries(
                                        section.subjectTeachers,
                                      )) {
                                        if (
                                          typeof tEmail === "string" &&
                                          tEmail.trim().toLowerCase() ===
                                            userEmail
                                        ) {
                                          const gSubj = globalSubjects.find(
                                            (g) => g.id === subjId,
                                          );
                                          if (
                                            gSubj &&
                                            !globalItems.includes(gSubj.name)
                                          )
                                            globalItems.push(gSubj.name);
                                        }
                                      }
                                    }

                                    let subjectsToDisplayNames =
                                      user?.role === "admin" ||
                                      user?.role === "system_admin" ||
                                      user?.role === "teacher"
                                        ? [
                                            ...new Set([
                                              ...localItems,
                                              ...globalItems,
                                            ]),
                                          ]
                                        : section.teacherSubjects || [];

                                    if (
                                      user?.role === "teacher" &&
                                      subjectsToDisplayNames.length === 0 &&
                                      section.teacherSubjects &&
                                      section.teacherSubjects.length > 0
                                    ) {
                                      subjectsToDisplayNames =
                                        section.teacherSubjects;
                                    }

                                    const isSHS =
                                      section.gradeLevel === 11 ||
                                      section.gradeLevel === 12;
                                    let displayItems: {
                                      label: string;
                                      targetName: string | null;
                                    }[] = [];

                                    const tleNames =
                                      subjectsToDisplayNames.filter((n) =>
                                        isTleSubject(n),
                                      );
                                    const nonTleNames =
                                      subjectsToDisplayNames.filter(
                                        (n) => !isTleSubject(n),
                                      );

                                    nonTleNames.forEach((n) =>
                                      displayItems.push({
                                        label: n,
                                        targetName: n,
                                      }),
                                    );

                                    if (tleNames.length > 0) {
                                      if (tleNames.length === 1) {
                                        displayItems.push({
                                          label: tleNames[0],
                                          targetName: tleNames[0],
                                        });
                                      } else {
                                        const shortNames = tleNames.map((n) => {
                                          let stripped = n
                                            .replace(
                                              /^Technology\s+and\s+Livelihood\s+Education\s*(\(\s*TLE\s*-\s*)?/i,
                                              "",
                                            )
                                            .replace(/^\s*-\s*/, "")
                                            .replace(/\)?$/, "")
                                            .trim();
                                          if (stripped.startsWith("TLE - "))
                                            stripped = stripped
                                              .replace(/^TLE\s*-\s*/i, "")
                                              .trim();
                                          if (stripped.startsWith("TLE"))
                                            stripped = stripped
                                              .replace(/^TLE\s*/i, "")
                                              .trim();
                                          return stripped || "General";
                                        });
                                        displayItems.push({
                                          label: `TLE (${shortNames.join(", ")})`,
                                          targetName: null,
                                        });
                                      }
                                    }

                                    if (isSHS) {
                                      displayItems.sort((a, b) => {
                                        const subA = a.targetName
                                          ? sectionSubjects.find(
                                              (s) => s.name === a.targetName,
                                            )
                                          : null;
                                        const subB = b.targetName
                                          ? sectionSubjects.find(
                                              (s) => s.name === b.targetName,
                                            )
                                          : null;
                                        const typeA =
                                          subA?.subjectType || "ELECTIVE";
                                        const typeB =
                                          subB?.subjectType || "ELECTIVE";
                                        if (
                                          typeA === "CORE" &&
                                          typeB !== "CORE"
                                        )
                                          return -1;
                                        if (
                                          typeA !== "CORE" &&
                                          typeB === "CORE"
                                        )
                                          return 1;
                                        return a.label.localeCompare(b.label);
                                      });
                                    } else {
                                      displayItems.sort((a, b) => {
                                        const scoreA = a.targetName
                                          ? getSubjectSortScore(a.targetName)
                                          : 99;
                                        const scoreB = b.targetName
                                          ? getSubjectSortScore(b.targetName)
                                          : 99;
                                        if (scoreA !== scoreB)
                                          return scoreA - scoreB;
                                        return a.label.localeCompare(b.label);
                                      });
                                    }

                                    const isExpanded = expandedSections.has(
                                      section.id,
                                    );

                                    if (!isExpanded) {
                                      const subjectsToShow = displayItems.slice(
                                        0,
                                        4,
                                      );
                                      return (
                                        <div className="mb-4 mt-4">
                                          <div className="flex flex-wrap gap-2.5">
                                            {subjectsToShow.map((item, idx) => (
                                              <button
                                                key={idx}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (item.targetName) {
                                                    onNavigateToSubject(
                                                      section,
                                                      item.targetName,
                                                    );
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
                                                  const next = new Set(
                                                    expandedSections,
                                                  );
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
                                    const coreItems = displayItems.filter(
                                      (item) => {
                                        if (!item.targetName) return false;
                                        const s = sectionSubjects.find(
                                          (sub) => sub.name === item.targetName,
                                        );
                                        return s?.subjectType === "CORE";
                                      },
                                    );
                                    const appliedItems = displayItems.filter(
                                      (item) => {
                                        if (!item.targetName) return false;
                                        const s = sectionSubjects.find(
                                          (sub) => sub.name === item.targetName,
                                        );
                                        return (
                                          s?.subjectType === "ELECTIVE" ||
                                          s?.subjectType === "APPLIED" ||
                                          s?.subjectType === "SPECIALIZED"
                                        );
                                      },
                                    );
                                    const otherItems = displayItems.filter(
                                      (item) =>
                                        !coreItems.includes(item) &&
                                        !appliedItems.includes(item),
                                    );

                                    return (
                                      <div className="mb-6 mt-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                        {coreItems.length > 0 && (
                                          <div>
                                            <div className="flex items-center gap-2 mb-3">
                                              <div className="h-px flex-1 bg-slate-100" />
                                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                Core Subjects
                                              </span>
                                              <div className="h-px flex-1 bg-slate-100" />
                                            </div>
                                            <div className="flex flex-wrap gap-2.5">
                                              {coreItems.map((item, idx) => (
                                                <button
                                                  key={idx}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (item.targetName) {
                                                      onNavigateToSubject(
                                                        section,
                                                        item.targetName,
                                                      );
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

                                        {(appliedItems.length > 0 ||
                                          otherItems.length > 0) && (
                                          <div>
                                            <div className="flex items-center gap-2 mb-3">
                                              <div className="h-px flex-1 bg-slate-100" />
                                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                Applied & Specialized
                                              </span>
                                              <div className="h-px flex-1 bg-slate-100" />
                                            </div>
                                            <div className="flex flex-wrap gap-2.5">
                                              {[
                                                ...appliedItems,
                                                ...otherItems,
                                              ].map((item, idx) => (
                                                <button
                                                  key={idx}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (item.targetName) {
                                                      onNavigateToSubject(
                                                        section,
                                                        item.targetName,
                                                      );
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
                                            const next = new Set(
                                              expandedSections,
                                            );
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
                                    const sectionBehavioralRecords =
                                      behavioralRecords.filter(
                                        (r) => r.sectionId === section.id,
                                      );
                                    const pendingInterventionCount =
                                      sectionBehavioralRecords.filter(
                                        (r) =>
                                          !r.actionTaken ||
                                          r.actionTaken.trim() === "",
                                      ).length;

                                    const isAdviserOfThisSection =
                                      (section.adviserEmail || "")
                                        .trim()
                                        .toLowerCase() ===
                                      (user?.email || "").trim().toLowerCase();

                                    if (
                                      sectionBehavioralRecords.length > 0 &&
                                      isAdviserOfThisSection
                                    ) {
                                      return (
                                        <div
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveBehavioralRecordSection(
                                              section,
                                            );
                                            setShowBehavioralRecordsPopup(true);
                                          }}
                                          className={`mb-4 p-3 rounded-xl border flex items-center justify-between select-none cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all ${
                                            pendingInterventionCount > 0
                                              ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/70"
                                              : "bg-emerald-50 border-emerald-250 text-emerald-850 hover:bg-emerald-100/70"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <AlertTriangle
                                              size={15}
                                              className={
                                                pendingInterventionCount > 0
                                                  ? "animate-pulse text-rose-500"
                                                  : "text-emerald-500"
                                              }
                                            />
                                            <div className="overflow-hidden">
                                              <p className="text-[10px] font-black uppercase tracking-wider leading-none">
                                                Behavioral Incidents
                                              </p>
                                              <p className="text-[9px] font-bold opacity-85 mt-1 truncate">
                                                {pendingInterventionCount > 0
                                                  ? `${pendingInterventionCount} Pending Intervention`
                                                  : "All Interventions Settled"}
                                              </p>
                                            </div>
                                          </div>
                                          <span
                                            className={`text-[9px] font-bold px-2 py-1 rounded-md shadow-xs uppercase tracking-tight whitespace-nowrap shrink-0 ml-1 ${
                                              pendingInterventionCount > 0
                                                ? "bg-rose-600 text-white"
                                                : "bg-slate-100 text-slate-700"
                                            }`}
                                          >
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
                                        {section.adviserName ||
                                          "No Adviser Assigned"}
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
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
                      Class: {activeBehavioralRecordSection.name} &bull; SY{" "}
                      {activeBehavioralRecordSection.schoolYear}
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
                            DATE LOGGED: {selectedRecordToFill.date}{" "}
                            {selectedRecordToFill.time
                              ? `@ ${selectedRecordToFill.time}`
                              : ""}
                          </p>
                        </div>
                        <span className="text-[8px] font-black bg-rose-100 text-rose-750 px-2 py-0.5 rounded border border-rose-200 uppercase tracking-wider">
                          Behavioral
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">
                          Observation narrative:
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold mt-1 whitespace-pre-wrap">
                          {selectedRecordToFill.observation}
                        </p>
                      </div>

                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        Logged by:{" "}
                        <span className="text-slate-600 font-extrabold">
                          {selectedRecordToFill.createdByName || "Staff Member"}
                        </span>
                      </div>
                    </div>

                    <form
                      onSubmit={handleSaveActionTaken}
                      className="space-y-4 border-t border-slate-150 pt-4"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          Action Taken / Interventions Conducted
                        </label>
                        <span className="text-[9px] text-slate-400 block mb-2 leading-tight">
                          Please fill in the actions, interventions, counseling
                          steps, or solutions conducted for this behavioral
                          issue.
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
                      The following behavioral concerns have been logged for
                      this section. Click{" "}
                      <strong className="text-rose-600">Read & Open</strong> on
                      any incident to fill in or update actions taken and
                      interventions.
                    </p>

                    {behavioralRecords.filter(
                      (r) => r.sectionId === activeBehavioralRecordSection.id,
                    ).length === 0 ? (
                      <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400 flex flex-col items-center justify-center">
                        <CheckCircle
                          size={28}
                          className="text-emerald-400 mb-2"
                        />
                        <p className="text-xs font-extrabold uppercase text-slate-500">
                          Perfect Record!
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          No behavioral incidents found for this section.
                        </p>
                      </div>
                    ) : (
                      behavioralRecords
                        .filter(
                          (r) =>
                            r.sectionId === activeBehavioralRecordSection.id,
                        )
                        .map((r) => {
                          const hasAction =
                            r.actionTaken && r.actionTaken.trim() !== "";
                          return (
                            <div
                              key={r.id}
                              className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                                hasAction
                                  ? "bg-slate-50/50 border-slate-200/60 text-slate-700"
                                  : "bg-rose-50/30 border-rose-150 text-slate-800 shadow-xs"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div>
                                  <h4 className="text-xs font-black uppercase text-slate-800">
                                    {r.studentName}
                                  </h4>
                                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                    {r.date} {r.time ? `@ ${r.time}` : ""}
                                  </p>
                                </div>
                                <span
                                  className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                    hasAction
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-250 font-bold"
                                      : "bg-rose-100 text-rose-700 border-rose-200 font-bold animate-pulse"
                                  }`}
                                >
                                  {hasAction ? "DOCUMENTED" : "PENDING ACTION"}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                                  Observation Notes:
                                </span>
                                <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                                  {r.observation}
                                </p>
                              </div>

                              {hasAction && (
                                <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/55">
                                  <span className="text-[9px] font-bold text-emerald-600 block uppercase tracking-wider">
                                    Resolution Action Taken:
                                  </span>
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
                                    ? "bg-white border border-slate-250 hover:bg-slate-50 text-slate-600"
                                    : "bg-rose-650 hover:bg-rose-700 text-white hover:shadow-md"
                                }`}
                              >
                                <FileText size={12} />
                                <span>
                                  {hasAction
                                    ? "Read & Update Action"
                                    : "Read & Open / Fill"}
                                </span>
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
              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${
                  sectionToDelete.deletionStatus === "approved"
                    ? "bg-rose-50 text-rose-500 shadow-rose-500/10"
                    : sectionToDelete.deletionStatus === "pending"
                      ? "bg-indigo-50 text-indigo-600 shadow-indigo-500/10"
                      : "bg-amber-50 text-amber-500 shadow-amber-500/10"
                }`}
              >
                {sectionToDelete.deletionStatus === "pending" ? (
                  <ShieldCheck size={40} />
                ) : sectionToDelete.deletionStatus === "approved" ? (
                  <AlertCircle size={40} />
                ) : (
                  <Trash2 size={40} />
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">
                {user?.role === "system_admin"
                  ? isSectionEmpty
                    ? "Delete Empty Section"
                    : sectionToDelete.deletionStatus === "approved"
                      ? "Permanent Removal"
                      : sectionToDelete.deletionStatus === "pending"
                        ? "Authorize Deletion"
                        : "Request Deletion Authorization"
                  : sectionToDelete.deletionStatus === "pending"
                    ? "Awaiting Approval"
                    : "Request Deletion"}
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                {user?.role === "system_admin" || user?.role === "admin"
                  ? isSectionEmpty
                    ? `This section ${sectionToDelete.name} has no learners and no subjects saved. You can delete it directly without requiring an adviser's request.`
                    : sectionToDelete.deletionStatus === "approved"
                      ? `This deletion request for ${sectionToDelete.name} has been authorized. Permanent removal will delete all learner records and academic history permanently.`
                      : sectionToDelete.deletionStatus === "pending"
                        ? `The adviser has requested the deletion of ${sectionToDelete.name}. Do you want to authorize it for permanent removal?`
                        : `You are about to request the deletion of ${sectionToDelete.name}. Since this section has active records, it requires authorization from a System Administrator.`
                  : sectionToDelete.deletionStatus === "pending"
                    ? `Your deletion request for ${sectionToDelete.name} is currently waiting for authorization from the System Administrator.`
                    : sectionToDelete.deletionStatus === "rejected"
                      ? `The deletion request for ${sectionToDelete.name} was disapproved. Reason: "${sectionToDelete.disapprovalReason}"`
                      : `Submit a deletion request for ${sectionToDelete.name}? This includes learner records and academic history, and requires System Admin authorization.`}
              </p>

              {sectionToDelete.deletionReason && (
                <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left mb-6">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2">
                    Adviser's Reason for Deletion Request
                  </span>
                  <p className="text-sm font-semibold text-slate-700 italic">
                    "{sectionToDelete.deletionReason}"
                  </p>
                </div>
              )}

              {/* Request Deletion Reason Input field */}
              {(((user?.role === "teacher" || user?.role === "admin") &&
                !(
                  sectionToDelete.deletionStatus === "approved" ||
                  isSectionEmpty
                )) ||
                (user?.role === "system_admin" &&
                  !isSectionEmpty &&
                  sectionToDelete.deletionStatus !== "pending" &&
                  sectionToDelete.deletionStatus !== "approved")) && (
                <div className="w-full text-left mb-6">
                  <label className="text-[11px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
                    Reason for Request for Deletion (Required)
                  </label>
                  <textarea
                    value={requestDeletionReason}
                    onChange={(e) => setRequestDeletionReason(e.target.value)}
                    placeholder="Provide a valid, detailed reason for wishing to delete this section..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all resize-none h-28"
                  />
                </div>
              )}

              {(user?.role === "system_admin" || user?.role === "admin") &&
                sectionToDelete.deletionStatus === "pending" && (
                  <div className="w-full mb-8 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      Reason for Disapproval (Required for Disapprove)
                    </label>
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
                    {sectionToDelete.deletionStatus === "pending" &&
                    user?.role === "teacher"
                      ? "Close"
                      : "Cancel"}
                  </button>
                  {user?.role === "system_admin" ||
                  user?.role === "teacher" ||
                  user?.role === "admin" ? (
                    <button
                      onClick={async () => {
                        let actionToTake:
                          | "approve"
                          | "request"
                          | "disapprove"
                          | "cancel"
                          | "delete" = "request";

                        if (user?.role === "system_admin") {
                          if (
                            isSectionEmpty ||
                            sectionToDelete.deletionStatus === "approved"
                          ) {
                            actionToTake = "delete";
                          } else if (
                            sectionToDelete.deletionStatus === "pending"
                          ) {
                            actionToTake = "approve";
                          }
                        } else if (user?.role === "teacher") {
                          if (
                            sectionToDelete.deletionStatus === "approved" ||
                            isSectionEmpty
                          ) {
                            actionToTake = "delete";
                          } else {
                            actionToTake = "request";
                          }
                        } else if (user?.role === "admin") {
                          if (
                            sectionToDelete.deletionStatus === "approved" ||
                            isSectionEmpty
                          ) {
                            actionToTake = "delete";
                          } else {
                            actionToTake = "request";
                          }
                        }

                        if (
                          actionToTake === "request" &&
                          !requestDeletionReason.trim()
                        ) {
                          alert(
                            "Please specify the reason for the Request for Deletion.",
                          );
                          return;
                        }

                        await onDelete(
                          sectionToDelete.id,
                          actionToTake,
                          actionToTake === "request"
                            ? requestDeletionReason
                            : undefined,
                        );
                        setSectionToDelete(null);
                        setDisapprovalReason("");
                        setRequestDeletionReason("");
                      }}
                      className={`py-4 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all bg-rose-600 shadow-rose-600/20`}
                    >
                      {user?.role === "system_admin"
                        ? isSectionEmpty ||
                          sectionToDelete.deletionStatus === "approved"
                          ? "Yes, Delete Permanently"
                          : sectionToDelete.deletionStatus === "pending"
                            ? "Authorize Deletion"
                            : "Request Authorization"
                        : (user?.role === "teacher" ||
                              user?.role === "admin") &&
                            (sectionToDelete.deletionStatus === "approved" ||
                              isSectionEmpty)
                          ? "Yes, Delete Permanently"
                          : "Request Deletion"}
                    </button>
                  ) : (
                    <div className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center border border-slate-100 opacity-60">
                      <Clock size={12} className="mr-2" />
                      {sectionToDelete.deletionStatus === "pending"
                        ? "Pending"
                        : sectionToDelete.deletionStatus === "approved"
                          ? "Approved"
                          : sectionToDelete.deletionStatus === "rejected"
                            ? "Disapproved"
                            : "Ready"}
                    </div>
                  )}
                </div>

                {user?.role === "teacher" &&
                  (sectionToDelete.deletionStatus === "pending" ||
                    sectionToDelete.deletionStatus === "rejected") && (
                    <button
                      onClick={async () => {
                        await onDelete(sectionToDelete.id, "cancel");
                        setSectionToDelete(null);
                        setRequestDeletionReason("");
                      }}
                      className="w-full py-4 bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-300 transition-colors"
                    >
                      Cancel Request
                    </button>
                  )}

                {(user?.role === "system_admin" || user?.role === "admin") &&
                  sectionToDelete.deletionStatus === "pending" && (
                    <button
                      onClick={async () => {
                        if (!disapprovalReason.trim()) {
                          alert("Please specify the reason for disapproval.");
                          return;
                        }
                        await onDelete(
                          sectionToDelete.id,
                          "disapprove",
                          disapprovalReason,
                        );
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
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                    Edit Section
                  </h2>
                  <p className="text-xs font-medium text-slate-500 mt-1.5">
                    Update administrative details for this section
                  </p>
                </div>
                <button
                  onClick={() => setSectionToEdit(null)}
                  className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-100"
                >
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
                    Matching parsed CSV rows against registered active academic
                    sections
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
                    Selected: {selectedIndicesDashboard.size} of{" "}
                    {pendingLearnersDashboard.length} Row(s)
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const valid = new Set<number>();
                        pendingLearnersDashboard.forEach((l, idx) => {
                          const matchedSec = sections.some((sec) => {
                            const csvSecName = (l.section || "")
                              .trim()
                              .toLowerCase();
                            const dbSecName = (sec.name || "")
                              .trim()
                              .toLowerCase();
                            const csvGrade = (l.gradeLevel || "").trim();
                            const dbGrade = String(sec.gradeLevel || "").trim();
                            return (
                              csvSecName === dbSecName &&
                              (csvGrade === "" || csvGrade === dbGrade)
                            );
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    First Attendance Date:
                  </label>
                  <input
                    type="date"
                    value={bulkFirstAttendanceDateDashboard}
                    onChange={(e) =>
                      setBulkFirstAttendanceDateDashboard(e.target.value)
                    }
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
                      const matchedSection = sections.find((sec) => {
                        const csvSecName = (l.section || "")
                          .trim()
                          .toLowerCase();
                        const dbSecName = (sec.name || "").trim().toLowerCase();
                        const csvGrade = (l.gradeLevel || "").trim();
                        const dbGrade = String(sec.gradeLevel || "").trim();
                        return (
                          csvSecName === dbSecName &&
                          (csvGrade === "" || csvGrade === dbGrade)
                        );
                      });

                      const isSelected = selectedIndicesDashboard.has(index);

                      return (
                        <tr
                          key={index}
                          className={`hover:bg-indigo-50/20 transition-colors ${
                            !matchedSection ? "bg-rose-50/10" : ""
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
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              LRN: {l.lrn}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-semibold">
                            {l.sex} ({l.age || "N/A"} yrs)
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-700">
                              {l.gradeLevel ? `Grade ${l.gradeLevel} - ` : ""}
                              {l.section}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {matchedSection ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-100">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Valid Section Match
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-100"
                                title="Please configure a section with this name and grade level to enroll this student"
                              >
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
              {/* Actions Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between sticky bottom-0 z-10">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[50%] leading-relaxed">
                  Notice: Invalid (Not Found) sections are unselectable. Make
                  sure sections exist before running bulk upload.
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSelectionModalDashboard(false);
                      setPendingLearnersDashboard([]);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      selectedIndicesDashboard.size === 0 ||
                      isUploadingDashboard
                    }
                    onClick={async () => {
                      const toEnroll = pendingLearnersDashboard.filter(
                        (_, idx) => selectedIndicesDashboard.has(idx),
                      );
                      if (toEnroll.length === 0) return;
                      setIsUploadingDashboard(true);
                      try {
                        let enrolledCount = 0;
                        for (const learner of toEnroll) {
                          const matchedSection = sections.find((sec) => {
                            const csvSecName = (learner.section || "")
                              .trim()
                              .toLowerCase();
                            const dbSecName = (sec.name || "")
                              .trim()
                              .toLowerCase();
                            const csvGrade = (learner.gradeLevel || "").trim();
                            const dbGrade = String(sec.gradeLevel || "").trim();
                            return (
                              csvSecName === dbSecName &&
                              (csvGrade === "" || csvGrade === dbGrade)
                            );
                          });
                          if (!matchedSection) continue;
                          const studentRef = doc(
                            collection(
                              db,
                              `sections/${matchedSection.id}/students`,
                            ),
                          );
                          await setDoc(studentRef, {
                            ...learner,
                            id: studentRef.id,
                            sectionId: matchedSection.id,
                            section: matchedSection.name,
                            gradeLevel: matchedSection.gradeLevel,
                            dateOfFirstAttendance:
                              bulkFirstAttendanceDateDashboard ||
                              learner.dateOfFirstAttendance ||
                              new Date().toISOString().split("T")[0],
                            status: "Active",
                            createdAt: new Date().toISOString(),
                          });
                          enrolledCount++;
                        }
                        alert(
                          `Successfully enrolled ${enrolledCount} learner(s) across matching sections!`,
                        );
                        setShowSelectionModalDashboard(false);
                        setPendingLearnersDashboard([]);
                      } catch (err) {
                        console.error("Bulk enroll error:", err);
                        alert("An error occurred during bulk enrollment.");
                      } finally {
                        setIsUploadingDashboard(false);
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isUploadingDashboard ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        Enroll {selectedIndicesDashboard.size} Selected
                        Learner(s)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { SectionsView };
