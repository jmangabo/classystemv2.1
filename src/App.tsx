import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Award, 
  FileText, 
  Activity, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  LogOut, 
  LogIn, 
  Search, 
  Plus, 
  Layers, 
  Building2, 
  GraduationCap, 
  HelpCircle, 
  Printer, 
  Download, 
  ChevronRight, 
  Palette, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  School as SchoolIcon, 
  UserCheck, 
  FileSpreadsheet, 
  Edit, 
  Trash2, 
  Sparkles,
  RefreshCw,
  FolderOpen,
  Filter,
  UserPlus
} from 'lucide-react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { db, auth, handleFirestoreError } from './firebase';
import { 
  Student, 
  Subject, 
  Section, 
  School, 
  UserProfile, 
  TermNumber, 
  DEFAULT_DEPED_SUBJECTS, 
  DEFAULT_OBSERVED_VALUES 
} from './types';
import { formatStudentName, printHTMLContent } from './utils';

// Subcomponents
import { SectionsView } from './components/SectionsView';
import { GradebookView } from './components/GradebookView';
import { SummarySheetView } from './components/SummarySheetView';
import { SF2ReportView } from './components/SF2ReportView';
import { SF4ReportView } from './components/SF4ReportView';
import { SF7ReportView } from './components/SF7ReportView';
import { SF8View } from './components/SF8View';
import { SF9Modal } from './components/SF9Modal';
import { BatchSF9Modal } from './components/BatchSF9Modal';
import { SF10View } from './components/SF10View';
import { ClassRecordReportModal } from './components/ClassRecordReportModal';
import { DailyAttendanceTracker } from './components/DailyAttendanceTracker';
import { ObservedValuesTracker } from './components/ObservedValuesTracker';
import { AnecdotalRecordsView } from './components/AnecdotalRecordsView';
import { PTAFeesManagementView } from './components/PTAFeesManagementView';
import { AralProgram } from './components/AralProgram';
import { TleDashboardView } from './components/TleDashboardView';
import { AdminUsersView } from './components/AdminUsersView';
import { AdminSchoolsView } from './components/AdminSchoolsView';
import { AdminSchoolYearView } from './components/AdminSchoolYearView';
import { AdminSchoolCalendarView } from './AdminSchoolCalendarView';
import { AdminFeedbackDashboard } from './components/AdminFeedbackDashboard';
import { FeedbackModal } from './components/FeedbackModal';
import { ThemeCustomizerModal, SystemThemeSettings, DEFAULT_THEME_SETTINGS } from './components/ThemeCustomizerModal';
import { SystemDocumentationView } from './components/SystemDocumentationView';
import { StudentPortal } from './components/StudentPortal';
import { AddLearnerModal } from './components/AddLearnerModal';
import { StatusChangeModal } from './components/StatusChangeModal';
import { StudentSubjectEnrollmentModal } from './components/StudentSubjectEnrollmentModal';
import { StudentAcademicHistoryModal } from './components/StudentAcademicHistoryModal';

// Initial Mock Datasets for instant fallback & preview
const INITIAL_SCHOOL: School = {
  id: 'school_1',
  schoolId: '301234',
  name: 'Laguna National High School',
  headOfSchool: 'Dr. Maria Corazon Santos, PhD',
  region: 'Region IV-A CALABARZON',
  division: 'Division of Laguna',
  district: 'District of Sta. Cruz'
};

const INITIAL_SECTIONS: Section[] = [
  {
    id: 'sec_7_diamond',
    name: 'Diamond',
    gradeLevel: 7,
    adviserName: 'Analee R. Lumaday, LPT',
    adviserEmail: 'analee.lumaday@deped.gov.ph',
    schoolYear: '2025-2026',
    schoolName: 'Laguna National High School',
    schoolId: '301234',
    region: 'Region IV-A CALABARZON',
    division: 'Division of Laguna',
    district: 'District of Sta. Cruz',
    createdBy: 'admin'
  },
  {
    id: 'sec_8_emerald',
    name: 'Emerald',
    gradeLevel: 8,
    adviserName: 'Roberto M. Reyes, LPT',
    adviserEmail: 'roberto.reyes@deped.gov.ph',
    schoolYear: '2025-2026',
    schoolName: 'Laguna National High School',
    schoolId: '301234',
    region: 'Region IV-A CALABARZON',
    division: 'Division of Laguna',
    district: 'District of Sta. Cruz',
    createdBy: 'admin'
  }
];

const INITIAL_STUDENTS_LIST: Student[] = [
  {
    id: 'stu_1',
    name: 'AGUILA, GABRIEL SANTOS JR.',
    lastName: 'AGUILA',
    firstName: 'GABRIEL',
    middleName: 'SANTOS',
    extension: 'JR.',
    studentNumber: '109283746511',
    lrn: '109283746511',
    sex: 'Male',
    birthdate: '2012-04-15',
    age: 13,
    status: 'Active',
    sectionId: 'sec_7_diamond',
    sectionName: 'Diamond',
    gradeLevel: 7,
    height: 152,
    weight: 43,
    fatherName: 'Gabriel Aguila Sr.',
    motherName: 'Elena Santos',
    address: 'Poblacion, Sta. Cruz, Laguna',
    contactNumber: '0917-111-2233',
    grades: {}
  },
  {
    id: 'stu_2',
    name: 'BAUTISTA, JOHN CARLO RAMOS',
    lastName: 'BAUTISTA',
    firstName: 'JOHN CARLO',
    middleName: 'RAMOS',
    studentNumber: '109283746512',
    lrn: '109283746512',
    sex: 'Male',
    birthdate: '2012-08-20',
    age: 13,
    status: 'Active',
    sectionId: 'sec_7_diamond',
    sectionName: 'Diamond',
    gradeLevel: 7,
    height: 148,
    weight: 39,
    fatherName: 'Carlos Bautista',
    motherName: 'Rosa Ramos',
    address: 'Brgy. Santisima Cruz, Sta. Cruz, Laguna',
    contactNumber: '0918-222-3344',
    grades: {}
  },
  {
    id: 'stu_3',
    name: 'CASTRO, KRISTINE JOY MERCADO',
    lastName: 'CASTRO',
    firstName: 'KRISTINE JOY',
    middleName: 'MERCADO',
    studentNumber: '109283746513',
    lrn: '109283746513',
    sex: 'Female',
    birthdate: '2012-01-10',
    age: 13,
    status: 'Active',
    sectionId: 'sec_7_diamond',
    sectionName: 'Diamond',
    gradeLevel: 7,
    height: 150,
    weight: 41,
    fatherName: 'Mario Castro',
    motherName: 'Lourdes Mercado',
    address: 'Brgy. Bagumbayan, Sta. Cruz, Laguna',
    contactNumber: '0919-333-4455',
    grades: {}
  },
  {
    id: 'stu_4',
    name: 'DELA CRUZ, ANGELICA VALDEZ',
    lastName: 'DELA CRUZ',
    firstName: 'ANGELICA',
    middleName: 'VALDEZ',
    studentNumber: '109283746514',
    lrn: '109283746514',
    sex: 'Female',
    birthdate: '2012-05-24',
    age: 13,
    status: 'Active',
    sectionId: 'sec_7_diamond',
    sectionName: 'Diamond',
    gradeLevel: 7,
    height: 145,
    weight: 38,
    fatherName: 'Eduardo Dela Cruz',
    motherName: 'Carmen Valdez',
    address: 'Brgy. Pagsawitan, Sta. Cruz, Laguna',
    contactNumber: '0920-444-5566',
    grades: {}
  }
];

export default function App() {
  // Navigation and active view state
  const [currentView, setCurrentView] = useState<
    'sections' | 'section-detail' | 'gradebook' | 'summary-sheet' | 
    'sf2' | 'sf4' | 'sf7' | 'sf8' | 'sf10' | 
    'anecdotal' | 'pta' | 'aral' | 'tle' | 
    'admin-users' | 'admin-schools' | 'admin-school-years' | 'admin-calendar' | 'admin-feedback' |
    'docs' | 'student-portal'
  >('sections');

  // Active context selections
  const [selectedSection, setSelectedSection] = useState<Section | null>(INITIAL_SECTIONS[0]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(DEFAULT_DEPED_SUBJECTS[0]);
  const [selectedStudentForSF9, setSelectedStudentForSF9] = useState<Student | null>(null);
  const [selectedStudentForSF10, setSelectedStudentForSF10] = useState<Student | null>(null);

  // Modals state
  const [showAddLearnerModal, setShowAddLearnerModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [statusChangeStudent, setStatusChangeStudent] = useState<Student | null>(null);
  const [enrollmentStudent, setEnrollmentStudent] = useState<Student | null>(null);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [showBatchSF9Modal, setShowBatchSF9Modal] = useState(false);
  const [showClassRecordModal, setShowClassRecordModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // App Theme Settings
  const [themeSettings, setThemeSettings] = useState<SystemThemeSettings>(DEFAULT_THEME_SETTINGS);

  // Data Collections
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS_LIST);
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_DEPED_SUBJECTS);
  const [schools, setSchools] = useState<School[]>([INITIAL_SCHOOL]);
  const [schoolCalendar, setSchoolCalendar] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>({
    activeSchoolYear: '2025-2026',
    schoolYears: ['2025-2026', '2024-2025']
  });

  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>({
    uid: 'demo_user',
    email: 'teacher.analee@deped.gov.ph',
    displayName: 'Analee R. Lumaday, LPT',
    role: 'system_admin',
    approvalStatus: 'approved',
    schoolId: '301234'
  });

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authRole, setAuthRole] = useState<UserProfile['role']>('teacher');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Section Detail sub-tabs
  const [sectionDetailTab, setSectionDetailTab] = useState<
    'roster' | 'subjects' | 'summary' | 'attendance' | 'values' | 'sf9' | 'sf10' | 'sf8' | 'anecdotal' | 'pta'
  >('roster');

  // Search and filter inside Section Roster
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterSexFilter, setRosterSexFilter] = useState<'All' | 'Male' | 'Female'>('All');

  // Listen to Auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) {
        // Fetch or subscribe to user profile
        const unsubProfile = onSnapshot(doc(db, "users", user.uid), docSnap => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Default profile for new user
            const newProf: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              role: 'teacher',
              approvalStatus: 'approved',
              schoolId: '301234',
              createdAt: new Date().toISOString()
            };
            setUserProfile(newProf);
            setDoc(doc(db, "users", user.uid), newProf).catch(console.error);
          }
        });
        return () => unsubProfile();
      } else {
        // Fallback demo admin
        setUserProfile({
          uid: 'demo_user',
          email: 'teacher.analee@deped.gov.ph',
          displayName: 'Analee R. Lumaday, LPT',
          role: 'system_admin',
          approvalStatus: 'approved',
          schoolId: '301234'
        });
      }
    });

    return () => unsub();
  }, []);

  // Listen to Firestore Collections
  useEffect(() => {
    // Sections
    const unsubSections = onSnapshot(collection(db, "sections"), snap => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Section));
        setSections(list);
        if (!selectedSection && list.length > 0) {
          setSelectedSection(list[0]);
        }
      }
    }, err => handleFirestoreError(err, 'get', 'sections'));

    // Schools
    const unsubSchools = onSnapshot(collection(db, "schools"), snap => {
      if (!snap.empty) {
        setSchools(snap.docs.map(d => ({ id: d.id, ...d.data() } as School)));
      }
    }, err => handleFirestoreError(err, 'get', 'schools'));

    // Users
    const unsubUsers = onSnapshot(collection(db, "users"), snap => {
      if (!snap.empty) {
        setUsersList(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      }
    }, err => handleFirestoreError(err, 'get', 'users'));

    // Global Settings
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => {
      if (snap.exists()) {
        setGlobalSettings(snap.data());
      }
    }, err => handleFirestoreError(err, 'get', 'settings/general'));

    // School Calendar
    const unsubCalendar = onSnapshot(collection(db, "school_calendar"), snap => {
      if (!snap.empty) {
        setSchoolCalendar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }, err => handleFirestoreError(err, 'get', 'school_calendar'));

    return () => {
      unsubSections();
      unsubSchools();
      unsubUsers();
      unsubSettings();
      unsubCalendar();
    };
  }, []);

  // Sync students when selectedSection changes
  useEffect(() => {
    if (!selectedSection) return;
    const unsubStudents = onSnapshot(collection(db, "sections", selectedSection.id, "students"), snap => {
      if (!snap.empty) {
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
      } else {
        // Fallback to local students if section has diamond or emerald
        const local = INITIAL_STUDENTS_LIST.filter(s => s.sectionId === selectedSection.id);
        if (local.length > 0) {
          setStudents(local);
        }
      }
    }, err => handleFirestoreError(err, 'get', `sections/${selectedSection.id}/students`));

    return () => unsubStudents();
  }, [selectedSection?.id]);

  // Auth Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        const res = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const newProf: UserProfile = {
          uid: res.user.uid,
          email: authEmail,
          displayName: authDisplayName || authEmail.split('@')[0],
          role: authRole,
          approvalStatus: authRole === 'system_admin' ? 'approved' : 'pending',
          schoolId: '301234',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", res.user.uid), newProf);
      }
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Google sign-in failed');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  // Section CRUD Handlers
  const handleAddSection = async (newSec: Section) => {
    setSections(prev => [...prev, newSec]);
    setSelectedSection(newSec);
    try {
      await setDoc(doc(db, "sections", newSec.id), newSec);
    } catch (err) {
      console.warn("Saved to local state:", err);
    }
  };

  const handleUpdateSection = async (id: string, updated: Partial<Section>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    if (selectedSection?.id === id) {
      setSelectedSection(prev => prev ? { ...prev, ...updated } : null);
    }
    try {
      await updateDoc(doc(db, "sections", id), updated);
    } catch (err) {
      console.warn("Updated local state:", err);
    }
  };

  const handleDeleteSection = async (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedSection?.id === id) {
      setSelectedSection(sections.find(s => s.id !== id) || null);
    }
    try {
      await deleteDoc(doc(db, "sections", id));
    } catch (err) {
      console.warn("Deleted from local state:", err);
    }
  };

  // Student CRUD Handlers
  const handleSaveStudent = async (studentData: Partial<Student>) => {
    if (!selectedSection) return;
    const targetId = studentData.id || `stu_${Date.now()}`;
    const fullStudent: Student = {
      ...studentData,
      id: targetId,
      name: studentData.name || 'UNNAMED LEARNER',
      sectionId: selectedSection.id,
      sectionName: selectedSection.name,
      gradeLevel: selectedSection.gradeLevel
    } as Student;

    setStudents(prev => {
      const exists = prev.some(s => s.id === targetId);
      if (exists) {
        return prev.map(s => s.id === targetId ? fullStudent : s);
      }
      return [...prev, fullStudent];
    });

    try {
      await setDoc(doc(db, "sections", selectedSection.id, "students", targetId), fullStudent);
    } catch (err) {
      console.warn("Saved student locally:", err);
    }

    setShowAddLearnerModal(false);
    setEditingStudent(null);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!selectedSection) return;
    if (confirm("Are you sure you want to remove this learner from the section roster?")) {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      try {
        await deleteDoc(doc(db, "sections", selectedSection.id, "students", studentId));
      } catch (err) {
        console.warn("Removed student locally:", err);
      }
    }
  };

  const handleUpdateStudentsList = async (updatedList: Student[]) => {
    setStudents(updatedList);
    if (!selectedSection) return;
    try {
      for (const st of updatedList) {
        await setDoc(doc(db, "sections", selectedSection.id, "students", st.id), st);
      }
    } catch (err) {
      console.warn("Batch updated students locally:", err);
    }
  };

  // Filtered Roster Learners
  const filteredRoster = students
    .filter(s => rosterSexFilter === 'All' || s.sex === rosterSexFilter)
    .filter(s => {
      if (!rosterSearch.trim()) return true;
      const full = formatStudentName(s).toLowerCase();
      const lrn = (s.lrn || s.studentNumber || '').toLowerCase();
      return full.includes(rosterSearch.toLowerCase()) || lrn.includes(rosterSearch.toLowerCase());
    })
    .sort((a, b) => {
      if (a.sex !== b.sex) return (a.sex || '').localeCompare(b.sex || '');
      return (a.lastName || a.name).localeCompare(b.lastName || b.name);
    });

  const userRole = userProfile?.role || 'teacher';
  const isAdminOrHead = userRole === 'admin' || userRole === 'system_admin' || userRole === 'school_head';

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Application Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & School Info */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('sections')}>
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md flex items-center justify-center">
                <SchoolIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black tracking-tight text-lg text-white">CLASS</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                    Enterprise
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                  {selectedSection?.schoolName || 'Laguna National High School'} • S.Y. {globalSettings?.activeSchoolYear || '2025-2026'}
                </p>
              </div>
            </div>

            {/* Main Navigation Items */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
              <button
                onClick={() => setCurrentView('sections')}
                className={`px-3 py-2 rounded-lg transition ${
                  currentView === 'sections' || currentView === 'section-detail'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Sections & Roster
              </button>

              <button
                onClick={() => setCurrentView('sf4')}
                className={`px-3 py-2 rounded-lg transition ${
                  currentView === 'sf4' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                SF4 Movement
              </button>

              <button
                onClick={() => setCurrentView('sf7')}
                className={`px-3 py-2 rounded-lg transition ${
                  currentView === 'sf7' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                SF7 Personnel
              </button>

              <button
                onClick={() => setCurrentView('tle')}
                className={`px-3 py-2 rounded-lg transition ${
                  currentView === 'tle' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                TLE / Specialization
              </button>

              <button
                onClick={() => setCurrentView('aral')}
                className={`px-3 py-2 rounded-lg transition ${
                  currentView === 'aral' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                ARAL Program
              </button>

              <button
                onClick={() => setCurrentView('pta')}
                className={`px-3 py-2 rounded-lg transition ${
                  currentView === 'pta' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                PTA & Financials
              </button>

              {isAdminOrHead && (
                <div className="relative group">
                  <button className="px-3 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 hidden group-hover:block z-50">
                    <button
                      onClick={() => setCurrentView('admin-users')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-700"
                    >
                      User Accounts & Roles
                    </button>
                    <button
                      onClick={() => setCurrentView('admin-schools')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-700"
                    >
                      School Profile Registry
                    </button>
                    <button
                      onClick={() => setCurrentView('admin-school-years')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-700"
                    >
                      School Year & Deadlines
                    </button>
                    <button
                      onClick={() => setCurrentView('admin-calendar')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-700"
                    >
                      School Days Calendar
                    </button>
                    <button
                      onClick={() => setCurrentView('admin-feedback')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-700"
                    >
                      User Feedback Dashboard
                    </button>
                  </div>
                </div>
              )}
            </nav>

            {/* Quick Actions & User Menu */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowThemeModal(true)}
                title="Customize Theme"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <Palette className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowFeedbackModal(true)}
                title="System Feedback"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentView('docs')}
                title="System Documentation"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {currentUser ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-white truncate max-w-[140px]">
                      {userProfile?.displayName || currentUser.email}
                    </p>
                    <p className="text-[10px] text-indigo-300 uppercase font-mono">
                      {userProfile?.role || 'Teacher'}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: SECTIONS LIST */}
        {currentView === 'sections' && (
          <SectionsView
            sections={sections}
            students={students}
            subjects={subjects}
            userRole={userRole}
            userEmail={userProfile?.email}
            onSelectSection={sec => {
              setSelectedSection(sec);
              setCurrentView('section-detail');
            }}
            onAddSection={handleAddSection}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
          />
        )}

        {/* VIEW 2: SECTION DETAIL / DASHBOARD */}
        {currentView === 'section-detail' && selectedSection && (
          <div className="space-y-6">
            {/* Section Header Banner */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-slate-900">
                      Grade {selectedSection.gradeLevel} - {selectedSection.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                      S.Y. {selectedSection.schoolYear}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Class Adviser: <strong>{selectedSection.adviserName}</strong> • {selectedSection.schoolName || 'Laguna National High School'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowBatchSF9Modal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Batch SF9 Cards
                </button>
                <button
                  onClick={() => {
                    setCurrentView('summary-sheet');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <Award className="w-3.5 h-3.5" />
                  Summary Sheet
                </button>
                <button
                  onClick={() => setCurrentView('sections')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Switch Section
                </button>
              </div>
            </div>

            {/* Sub-Navigation Tabs inside Section */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
              <button
                onClick={() => setSectionDetailTab('roster')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
                  sectionDetailTab === 'roster'
                    ? 'bg-white border-t-2 border-indigo-600 text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Users className="w-4 h-4" />
                Learners Masterlist ({students.length})
              </button>

              <button
                onClick={() => setSectionDetailTab('subjects')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
                  sectionDetailTab === 'subjects'
                    ? 'bg-white border-t-2 border-indigo-600 text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Subjects & E-Class Records
              </button>

              <button
                onClick={() => setSectionDetailTab('attendance')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
                  sectionDetailTab === 'attendance'
                    ? 'bg-white border-t-2 border-indigo-600 text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Daily Attendance & SF2
              </button>

              <button
                onClick={() => setSectionDetailTab('values')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
                  sectionDetailTab === 'values'
                    ? 'bg-white border-t-2 border-indigo-600 text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Observed Core Values
              </button>

              <button
                onClick={() => setSectionDetailTab('sf10')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
                  sectionDetailTab === 'sf10'
                    ? 'bg-white border-t-2 border-indigo-600 text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Permanent Record (SF10)
              </button>

              <button
                onClick={() => setSectionDetailTab('sf8')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
                  sectionDetailTab === 'sf8'
                    ? 'bg-white border-t-2 border-indigo-600 text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Activity className="w-4 h-4" />
                Nutritional Status (SF8)
              </button>

              <button
                onClick={() => setSectionDetailTab('anecdotal')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
                  sectionDetailTab === 'anecdotal'
                    ? 'bg-white border-t-2 border-indigo-600 text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Anecdotal Records
              </button>
            </div>

            {/* TAB 1: LEARNERS ROSTER */}
            {sectionDetailTab === 'roster' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search name or 12-digit LRN..."
                      value={rosterSearch}
                      onChange={e => setRosterSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                      {(['All', 'Male', 'Female'] as const).map(sex => (
                        <button
                          key={sex}
                          onClick={() => setRosterSexFilter(sex)}
                          className={`px-3 py-1 rounded-md transition ${
                            rosterSexFilter === sex ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {sex}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setEditingStudent(null);
                        setShowAddLearnerModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add Learner
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-12 text-center">#</th>
                          <th className="p-3">Learner Name</th>
                          <th className="p-3">LRN</th>
                          <th className="p-3 text-center">Sex</th>
                          <th className="p-3 text-center">Age</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRoster.map((student, idx) => (
                          <tr key={student.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-3 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                            <td className="p-3">
                              <p className="font-bold text-slate-900 uppercase">{formatStudentName(student)}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {student.birthdate ? `Born: ${student.birthdate}` : ''} {student.contactNumber ? `• ${student.contactNumber}` : ''}
                              </p>
                            </td>
                            <td className="p-3 font-mono font-semibold text-slate-700">{student.lrn || student.studentNumber}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                student.sex === 'Male' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {student.sex}
                              </span>
                            </td>
                            <td className="p-3 text-center font-semibold">{student.age || '-'}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                student.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {student.status || 'Active'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedStudentForSF9(student)}
                                  title="View Form 9 (SF9)"
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEnrollmentStudent(student)}
                                  title="Enrolled Subjects"
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setStatusChangeStudent(student)}
                                  title="Change Status"
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingStudent(student);
                                    setShowAddLearnerModal(true);
                                  }}
                                  title="Edit Learner Profile"
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(student.id)}
                                  title="Remove Learner"
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SUBJECTS & E-CLASS RECORDS */}
            {sectionDetailTab === 'subjects' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubject(sub);
                        setCurrentView('gradebook');
                      }}
                      className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">
                          {sub.subjectType || 'CORE'}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Weights: WW {sub.wwWeight}% • PT {sub.ptWeight}% • QA {sub.taWeight}%
                      </p>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>Open E-Class Record</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: DAILY ATTENDANCE & SF2 */}
            {sectionDetailTab === 'attendance' && (
              <div className="space-y-6">
                <DailyAttendanceTracker
                  students={students}
                  calendar={schoolCalendar}
                  section={selectedSection}
                  onUpdateAttendance={(studentId, month, day, present) => {
                    setStudents(prev => prev.map(s => {
                      if (s.id !== studentId) return s;
                      const att = s.attendance || {};
                      const mAtt = att[month] || { present: 0, absent: 0, days: {} };
                      const days = { ...(mAtt.days || {}), [day]: present };
                      const presentCount = Object.values(days).filter(Boolean).length;
                      const absentCount = Object.values(days).filter(v => v === false).length;
                      return {
                        ...s,
                        attendance: {
                          ...att,
                          [month]: { present: presentCount, absent: absentCount, days }
                        }
                      };
                    }));
                  }}
                  onMarkAllPresent={(studentId, month) => {
                    // Quick mark all days present
                  }}
                />
              </div>
            )}

            {/* TAB 4: OBSERVED VALUES */}
            {sectionDetailTab === 'values' && (
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
                <ObservedValuesTracker
                  students={students}
                  onUpdateValue={(studentId, period, statementId, val) => {
                    setStudents(prev => prev.map(s => {
                      if (s.id !== studentId) return s;
                      const currentVals = s.observedValues || {};
                      const periodVals = currentVals[period] || {};
                      return {
                        ...s,
                        observedValues: {
                          ...currentVals,
                          [period]: {
                            ...periodVals,
                            [statementId]: val
                          }
                        }
                      };
                    }));
                  }}
                />
              </div>
            )}

            {/* TAB 5: SF10 PERMANENT RECORD */}
            {sectionDetailTab === 'sf10' && (
              <SF10View
                section={selectedSection}
                students={students}
                subjects={subjects}
                schoolCalendar={schoolCalendar}
                userProfile={userProfile}
              />
            )}

            {/* TAB 6: SF8 NUTRITIONAL STATUS */}
            {sectionDetailTab === 'sf8' && (
              <SF8View
                section={selectedSection}
                students={students}
                userProfile={userProfile}
              />
            )}

            {/* TAB 7: ANECDOTAL RECORDS */}
            {sectionDetailTab === 'anecdotal' && (
              <AnecdotalRecordsView
                currentUser={currentUser}
                userProfile={userProfile}
                selectedSection={selectedSection}
                students={students}
                sections={sections}
                preselectedStudent={null}
              />
            )}
          </div>
        )}

        {/* VIEW 3: GRADEBOOK / E-CLASS RECORD */}
        {currentView === 'gradebook' && selectedSection && selectedSubject && (
          <GradebookView
            section={selectedSection}
            subject={selectedSubject}
            students={students}
            onBack={() => setCurrentView('section-detail')}
            onUpdateStudents={handleUpdateStudentsList}
            onOpenClassRecordReport={() => setShowClassRecordModal(true)}
          />
        )}

        {/* VIEW 4: SUMMARY SHEET */}
        {currentView === 'summary-sheet' && selectedSection && (
          <SummarySheetView
            section={selectedSection}
            subjects={subjects}
            students={students}
            onBack={() => setCurrentView('section-detail')}
          />
        )}

        {/* VIEW 5: SF4 MONTHLY REPORT */}
        {currentView === 'sf4' && (
          <SF4ReportView
            schoolId={selectedSection?.schoolId || '301234'}
            calendar={schoolCalendar}
            globalSettings={globalSettings}
          />
        )}

        {/* VIEW 6: SF7 SCHOOL PERSONNEL */}
        {currentView === 'sf7' && (
          <SF7ReportView
            schoolId={selectedSection?.schoolId || '301234'}
            activeSchoolYear={globalSettings?.activeSchoolYear || '2025-2026'}
            userProfile={userProfile}
          />
        )}

        {/* VIEW 7: TLE / TVL SPECIALIZATION */}
        {currentView === 'tle' && (
          <TleDashboardView
            sections={sections}
            subjects={subjects}
            currentUser={currentUser}
            onBack={() => setCurrentView('sections')}
          />
        )}

        {/* VIEW 8: ARAL REMEDIATION PROGRAM */}
        {currentView === 'aral' && (
          <AralProgram
            enrolledStudents={students}
            selectedSection={selectedSection}
            sections={sections}
            userProfile={userProfile}
            globalSettings={globalSettings}
          />
        )}

        {/* VIEW 9: PTA FEES & FINANCIALS */}
        {currentView === 'pta' && (
          <PTAFeesManagementView
            currentUser={currentUser}
            userProfile={userProfile}
            selectedSection={selectedSection}
            sections={sections}
          />
        )}

        {/* ADMIN VIEWS */}
        {currentView === 'admin-users' && (
          <AdminUsersView
            users={usersList}
            schools={schools}
            onUpdateUser={async (uid, data) => {
              setUsersList(prev => prev.map(u => u.uid === uid ? { ...u, ...data } : u));
              try {
                await updateDoc(doc(db, "users", uid), data);
              } catch (err) {
                console.warn("Updated user locally:", err);
              }
            }}
          />
        )}

        {currentView === 'admin-schools' && (
          <AdminSchoolsView
            schools={schools}
            onAddSchool={async s => {
              setSchools(prev => [...prev, s]);
              try {
                await setDoc(doc(db, "schools", s.id), s);
              } catch (err) {
                console.warn("Saved school locally:", err);
              }
            }}
            onUpdateSchool={async (id, s) => {
              setSchools(prev => prev.map(sc => sc.id === id ? { ...sc, ...s } : sc));
              try {
                await updateDoc(doc(db, "schools", id), s);
              } catch (err) {
                console.warn("Updated school locally:", err);
              }
            }}
          />
        )}

        {currentView === 'admin-school-years' && (
          <AdminSchoolYearView
            onBack={() => setCurrentView('sections')}
            currentUser={currentUser}
          />
        )}

        {currentView === 'admin-calendar' && (
          <AdminSchoolCalendarView
            onBack={() => setCurrentView('sections')}
            currentUser={currentUser}
          />
        )}

        {currentView === 'admin-feedback' && (
          <AdminFeedbackDashboard />
        )}

        {/* VIEW: SYSTEM DOCUMENTATION */}
        {currentView === 'docs' && (
          <SystemDocumentationView />
        )}
      </main>

      {/* MODALS */}

      {/* 1. Add / Edit Learner Modal */}
      {showAddLearnerModal && selectedSection && (
        <AddLearnerModal
          section={selectedSection}
          existingStudent={editingStudent}
          onClose={() => {
            setShowAddLearnerModal(false);
            setEditingStudent(null);
          }}
          onSave={handleSaveStudent}
        />
      )}

      {/* 2. Status Change Modal */}
      {statusChangeStudent && (
        <StatusChangeModal
          student={statusChangeStudent}
          onClose={() => setStatusChangeStudent(null)}
          onSave={updated => {
            handleSaveStudent({ ...statusChangeStudent, ...updated });
            setStatusChangeStudent(null);
          }}
        />
      )}

      {/* 3. Subject Enrollment Modal */}
      {enrollmentStudent && selectedSection && (
        <StudentSubjectEnrollmentModal
          student={enrollmentStudent}
          section={selectedSection}
          subjects={subjects}
          onClose={() => setEnrollmentStudent(null)}
          onSave={enrolledSubjectIds => {
            handleSaveStudent({ ...enrollmentStudent, enrolledSubjectIds });
            setEnrollmentStudent(null);
          }}
        />
      )}

      {/* 4. SF9 Progress Report Card (Single) */}
      {selectedStudentForSF9 && selectedSection && (
        <SF9Modal
          student={selectedStudentForSF9}
          section={selectedSection}
          subjects={subjects}
          onClose={() => setSelectedStudentForSF9(null)}
        />
      )}

      {/* 5. Batch SF9 Progress Report Cards */}
      {showBatchSF9Modal && selectedSection && (
        <BatchSF9Modal
          section={selectedSection}
          students={students}
          subjects={subjects}
          onClose={() => setShowBatchSF9Modal(false)}
        />
      )}

      {/* 6. Class Record Report Modal */}
      {showClassRecordModal && selectedSection && selectedSubject && (
        <ClassRecordReportModal
          section={selectedSection}
          subject={selectedSubject}
          students={students}
          term={1}
          onClose={() => setShowClassRecordModal(false)}
        />
      )}

      {/* 7. Theme Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        settings={themeSettings}
        onUpdateSettings={setThemeSettings}
        onResetSettings={() => setThemeSettings(DEFAULT_THEME_SETTINGS)}
      />

      {/* 8. User Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        user={userProfile}
      />

      {/* 9. Sign In / Register Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 text-center bg-slate-900 text-white">
              <div className="inline-flex p-3 bg-indigo-600 rounded-2xl mb-2">
                <SchoolIcon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">
                {authMode === 'login' ? 'Sign In to CLASS Server' : 'Create Teacher / Staff Account'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Centralized Learner Assessment & School System
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
              {authError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                  {authError}
                </div>
              )}

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Analee R. Lumaday"
                    value={authDisplayName}
                    onChange={e => setAuthDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">DepEd Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@deped.gov.ph"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">System Role *</label>
                  <select
                    value={authRole}
                    onChange={e => setAuthRole(e.target.value as UserProfile['role'])}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="teacher">Teacher / Class Adviser</option>
                    <option value="guidance_designate">Guidance Designate</option>
                    <option value="school_head">School Head / Principal</option>
                    <option value="admin">School Admin</option>
                    <option value="system_admin">System Administrator</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-md transition"
              >
                {authLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition"
              >
                Continue with Google
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  {authMode === 'login' ? "Don't have an account? Register" : 'Already registered? Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
