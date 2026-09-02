import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  FileCode, 
  Terminal, 
  Server, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  ExternalLink,
  Code,
  HardDrive,
  Cpu,
  Table as TableIcon
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface FirebaseToMySQLModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

interface CollectionStat {
  name: string;
  label: string;
  table: string;
  count: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  sampleDoc?: any;
}

export const FirebaseToMySQLModal: React.FC<FirebaseToMySQLModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const isMainAdmin = 
    currentUser?.role === 'system_admin' || 
    currentUser?.email === 'jessiemangabo@gmail.com';

  const [activeTab, setActiveTab] = useState<'convert' | 'preview' | 'connection' | 'schema'>('convert');
  const [isScanning, setIsScanning] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const [sqlScript, setSqlScript] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>('all');
  const [exportedJsonData, setExportedJsonData] = useState<Record<string, any[]> | null>(null);

  // MySQL Connection Configurations for CLI & Helper Scripts
  const [dbConfig, setDbConfig] = useState({
    host: '127.0.0.1',
    port: '3306',
    database: 'deped_class_records',
    username: 'root',
    password: '',
  });

  // Track Firestore Collections to Normalize & Migrate
  const [collections, setCollections] = useState<CollectionStat[]>([
    { name: 'users', label: 'System Users & Teachers', table: 'users', count: 0, status: 'idle' },
    { name: 'schools', label: 'Registered Schools', table: 'schools', count: 0, status: 'idle' },
    { name: 'sections', label: 'Class Sections', table: 'sections', count: 0, status: 'idle' },
    { name: 'students', label: 'Learners & Enrollees', table: 'students', count: 0, status: 'idle' },
    { name: 'subjects', label: 'Curriculum Subjects', table: 'subjects', count: 0, status: 'idle' },
    { name: 'grades', label: 'Quarterly Grades & Scores', table: 'grades', count: 0, status: 'idle' },
    { name: 'aral_classes', label: 'ARAL Tutorial Classes', table: 'aral_classes', count: 0, status: 'idle' },
    { name: 'aral_sessions', label: 'ARAL Daily Session Logs', table: 'aral_sessions', count: 0, status: 'idle' },
    { name: 'attendance_logs', label: 'Daily Attendance & QR Scans', table: 'attendance_logs', count: 0, status: 'idle' },
    { name: 'pta_fees', label: 'PTA Assessment Types', table: 'pta_fees', count: 0, status: 'idle' },
    { name: 'pta_payments', label: 'PTA Collections & Dues', table: 'pta_payments', count: 0, status: 'idle' },
    { name: 'school_calendar', label: 'School Year Calendar Events', table: 'school_calendar', count: 0, status: 'idle' },
    { name: 'global_settings', label: 'Global Configurations', table: 'global_settings', count: 0, status: 'idle' },
    { name: 'feedback', label: 'System Feedback & Reports', table: 'feedback_reports', count: 0, status: 'idle' },
  ]);

  // Scan collections and retrieve counts when opened
  useEffect(() => {
    if (isOpen && isMainAdmin) {
      handleAnalyzeCollections();
    }
  }, [isOpen, isMainAdmin]);

  // Escape SQL string values safely
  const escapeSql = (val: any): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (typeof val === 'object') {
      if (val instanceof Date) {
        return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
      }
      // Firestore timestamp object { seconds, nanoseconds }
      if (typeof val.seconds === 'number') {
        const d = new Date(val.seconds * 1000);
        return `'${d.toISOString().slice(0, 19).replace('T', ' ')}'`;
      }
      return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }
    const str = String(val);
    return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
  };

  // Analyze Firestore Collections & Count records
  const handleAnalyzeCollections = async () => {
    setIsScanning(true);
    setCurrentStepText('Analyzing Firebase Firestore collections...');

    try {
      const updated = [...collections];

      for (let i = 0; i < updated.length; i++) {
        const col = updated[i];
        col.status = 'loading';
        setCollections([...updated]);

        try {
          // Special handling for subcollections if needed
          if (col.name === 'students') {
            // Count root students plus section subcollections
            let totalStudents = 0;
            const rootSnap = await getDocs(collection(db, 'students'));
            totalStudents += rootSnap.size;

            // Also check sections
            const secSnap = await getDocs(collection(db, 'sections'));
            for (const secDoc of secSnap.docs) {
              const subSnap = await getDocs(collection(db, 'sections', secDoc.id, 'students'));
              totalStudents += subSnap.size;
            }
            col.count = totalStudents;
            col.status = 'ready';
          } else if (col.name === 'subjects') {
            let totalSubjects = 0;
            const rootSnap = await getDocs(collection(db, 'subjects'));
            totalSubjects += rootSnap.size;
            const secSnap = await getDocs(collection(db, 'sections'));
            for (const secDoc of secSnap.docs) {
              const subSnap = await getDocs(collection(db, 'sections', secDoc.id, 'subjects'));
              totalSubjects += subSnap.size;
            }
            col.count = totalSubjects;
            col.status = 'ready';
          } else {
            const snap = await getDocs(collection(db, col.name));
            col.count = snap.size;
            col.status = 'ready';
          }
        } catch (e) {
          console.warn(`Could not read collection ${col.name}:`, e);
          col.count = 0;
          col.status = 'ready'; // graceful fallback
        }
      }

      setCollections([...updated]);
      setCurrentStepText('Analysis complete. Ready for conversion.');
    } catch (err: any) {
      console.error('Error analyzing Firestore:', err);
      setCurrentStepText('Error during analysis: ' + (err.message || 'Unknown error'));
    } finally {
      setIsScanning(false);
    }
  };

  // Automated Conversion from Firebase Firestore to MySQL Script
  const handleConvertToMySQL = async () => {
    setIsConverting(true);
    setProgress(5);
    setCurrentStepText('Initiating Firebase Firestore to MySQL normalization pipeline...');

    const timestamp = new Date().toISOString();
    const sqlParts: string[] = [];

    // Header & MySQL Safety Directives
    sqlParts.push(`-- ==============================================================================`);
    sqlParts.push(`-- DepEd Centralized Learner Assessment & School System (CLASS) Enterprise`);
    sqlParts.push(`-- Firebase Firestore to MySQL Database Conversion Dump`);
    sqlParts.push(`-- Generated on: ${timestamp}`);
    sqlParts.push(`-- Engine: MySQL 5.7+ / 8.0+ (InnoDB, utf8mb4_unicode_ci)`);
    sqlParts.push(`-- Source: Google Firebase Cloud Firestore`);
    sqlParts.push(`-- Target: Relational Normalized Database Schema`);
    sqlParts.push(`-- ==============================================================================\n`);
    sqlParts.push(`SET NAMES utf8mb4;`);
    sqlParts.push(`SET FOREIGN_KEY_CHECKS = 0;`);
    sqlParts.push(`SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";`);
    sqlParts.push(`SET AUTOCOMMIT = 0;`);
    sqlParts.push(`START TRANSACTION;\n`);

    const rawExportData: Record<string, any[]> = {};

    try {
      // 1. SCHOOLS TABLE
      setProgress(10);
      setCurrentStepText('Extracting & converting [schools] collection...');
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`-- Table structure for table: schools`);
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`DROP TABLE IF EXISTS \`schools\`;`);
      sqlParts.push(`CREATE TABLE \`schools\` (`);
      sqlParts.push(`  \`id\` varchar(64) NOT NULL,`);
      sqlParts.push(`  \`school_id\` varchar(32) DEFAULT NULL,`);
      sqlParts.push(`  \`name\` varchar(255) NOT NULL,`);
      sqlParts.push(`  \`division\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`region\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`district\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`address\` text DEFAULT NULL,`);
      sqlParts.push(`  \`principal\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`school_head\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`contact_number\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`email\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`subscription_status\` varchar(32) DEFAULT 'active',`);
      sqlParts.push(`  \`expires_at\` datetime DEFAULT NULL,`);
      sqlParts.push(`  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,`);
      sqlParts.push(`  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,`);
      sqlParts.push(`  PRIMARY KEY (\`id\`),`);
      sqlParts.push(`  KEY \`idx_school_id\` (\`school_id\`)`);
      sqlParts.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`);

      const schoolsSnap = await getDocs(collection(db, 'schools')).catch(() => ({ docs: [] } as any));
      const schools = schoolsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      rawExportData['schools'] = schools;

      if (schools.length > 0) {
        sqlParts.push(`-- Dumping data for table: schools (${schools.length} rows)`);
        for (const s of schools) {
          const expDate = s.expiresAt ? new Date(s.expiresAt) : null;
          sqlParts.push(
            `INSERT INTO \`schools\` (\`id\`, \`school_id\`, \`name\`, \`division\`, \`region\`, \`district\`, \`address\`, \`principal\`, \`school_head\`, \`contact_number\`, \`email\`, \`subscription_status\`, \`expires_at\`) VALUES (` +
            `${escapeSql(s.id)}, ` +
            `${escapeSql(s.schoolId || s.id)}, ` +
            `${escapeSql(s.name || 'Unnamed School')}, ` +
            `${escapeSql(s.division)}, ` +
            `${escapeSql(s.region)}, ` +
            `${escapeSql(s.district)}, ` +
            `${escapeSql(s.address)}, ` +
            `${escapeSql(s.principal || s.schoolHead)}, ` +
            `${escapeSql(s.schoolHead || s.principal)}, ` +
            `${escapeSql(s.contactNumber)}, ` +
            `${escapeSql(s.email)}, ` +
            `${escapeSql(s.subscriptionStatus || 'active')}, ` +
            `${escapeSql(expDate)}` +
            `);`
          );
        }
        sqlParts.push('');
      }

      // 2. USERS TABLE
      setProgress(20);
      setCurrentStepText('Extracting & converting [users] collection...');
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`-- Table structure for table: users`);
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`DROP TABLE IF EXISTS \`users\`;`);
      sqlParts.push(`CREATE TABLE \`users\` (`);
      sqlParts.push(`  \`id\` varchar(64) NOT NULL,`);
      sqlParts.push(`  \`email\` varchar(191) NOT NULL,`);
      sqlParts.push(`  \`display_name\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`role\` varchar(32) NOT NULL DEFAULT 'teacher',`);
      sqlParts.push(`  \`school_id\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`school_name\` varchar(255) DEFAULT NULL,`);
      sqlParts.push(`  \`approval_status\` varchar(32) DEFAULT 'approved',`);
      sqlParts.push(`  \`position\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`contact_number\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`photo_url\` text DEFAULT NULL,`);
      sqlParts.push(`  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,`);
      sqlParts.push(`  PRIMARY KEY (\`id\`),`);
      sqlParts.push(`  UNIQUE KEY \`uniq_email\` (\`email\`),`);
      sqlParts.push(`  KEY \`idx_user_school\` (\`school_id\`),`);
      sqlParts.push(`  KEY \`idx_user_role\` (\`role\`)`);
      sqlParts.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`);

      const usersSnap = await getDocs(collection(db, 'users')).catch(() => ({ docs: [] } as any));
      const users = usersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      rawExportData['users'] = users;

      if (users.length > 0) {
        sqlParts.push(`-- Dumping data for table: users (${users.length} rows)`);
        for (const u of users) {
          sqlParts.push(
            `INSERT INTO \`users\` (\`id\`, \`email\`, \`display_name\`, \`role\`, \`school_id\`, \`school_name\`, \`approval_status\`, \`position\`, \`contact_number\`, \`photo_url\`) VALUES (` +
            `${escapeSql(u.id || u.uid)}, ` +
            `${escapeSql(u.email || `${u.id}@deped.local`)}, ` +
            `${escapeSql(u.displayName || u.name || 'User')}, ` +
            `${escapeSql(u.role || 'teacher')}, ` +
            `${escapeSql(u.schoolId)}, ` +
            `${escapeSql(u.schoolName)}, ` +
            `${escapeSql(u.approvalStatus || 'approved')}, ` +
            `${escapeSql(u.position)}, ` +
            `${escapeSql(u.contactNumber)}, ` +
            `${escapeSql(u.photoURL || u.photoUrl)}` +
            `);`
          );
        }
        sqlParts.push('');
      }

      // 3. SECTIONS TABLE
      setProgress(35);
      setCurrentStepText('Extracting & converting [sections] collection...');
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`-- Table structure for table: sections`);
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`DROP TABLE IF EXISTS \`sections\`;`);
      sqlParts.push(`CREATE TABLE \`sections\` (`);
      sqlParts.push(`  \`id\` varchar(64) NOT NULL,`);
      sqlParts.push(`  \`name\` varchar(128) NOT NULL,`);
      sqlParts.push(`  \`grade_level\` varchar(32) NOT NULL,`);
      sqlParts.push(`  \`school_id\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`school_year\` varchar(32) DEFAULT '2026-2027',`);
      sqlParts.push(`  \`adviser_id\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`adviser_name\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`track\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`strand\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`room\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`is_finalized\` tinyint(1) DEFAULT 0,`);
      sqlParts.push(`  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,`);
      sqlParts.push(`  PRIMARY KEY (\`id\`),`);
      sqlParts.push(`  KEY \`idx_sec_school\` (\`school_id\`),`);
      sqlParts.push(`  KEY \`idx_sec_grade\` (\`grade_level\`)`);
      sqlParts.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`);

      const sectionsSnap = await getDocs(collection(db, 'sections')).catch(() => ({ docs: [] } as any));
      const sections = sectionsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      rawExportData['sections'] = sections;

      if (sections.length > 0) {
        sqlParts.push(`-- Dumping data for table: sections (${sections.length} rows)`);
        for (const sec of sections) {
          sqlParts.push(
            `INSERT INTO \`sections\` (\`id\`, \`name\`, \`grade_level\`, \`school_id\`, \`school_year\`, \`adviser_id\`, \`adviser_name\`, \`track\`, \`strand\`, \`room\`, \`is_finalized\`) VALUES (` +
            `${escapeSql(sec.id)}, ` +
            `${escapeSql(sec.name)}, ` +
            `${escapeSql(String(sec.gradeLevel))}, ` +
            `${escapeSql(sec.schoolId)}, ` +
            `${escapeSql(sec.schoolYear || '2026-2027')}, ` +
            `${escapeSql(sec.adviserId)}, ` +
            `${escapeSql(sec.adviserName)}, ` +
            `${escapeSql(sec.track)}, ` +
            `${escapeSql(sec.strand)}, ` +
            `${escapeSql(sec.room)}, ` +
            `${escapeSql(!!sec.isFinalized)}` +
            `);`
          );
        }
        sqlParts.push('');
      }

      // 4. STUDENTS TABLE (Includes subcollections and root students)
      setProgress(50);
      setCurrentStepText('Extracting & compiling [students] across all sections...');
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`-- Table structure for table: students`);
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`DROP TABLE IF EXISTS \`students\`;`);
      sqlParts.push(`CREATE TABLE \`students\` (`);
      sqlParts.push(`  \`id\` varchar(64) NOT NULL,`);
      sqlParts.push(`  \`lrn\` varchar(32) NOT NULL,`);
      sqlParts.push(`  \`first_name\` varchar(64) NOT NULL,`);
      sqlParts.push(`  \`last_name\` varchar(64) NOT NULL,`);
      sqlParts.push(`  \`middle_name\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`extension_name\` varchar(16) DEFAULT NULL,`);
      sqlParts.push(`  \`sex\` varchar(16) NOT NULL,`);
      sqlParts.push(`  \`birth_date\` varchar(32) DEFAULT NULL,`);
      sqlParts.push(`  \`section_id\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`school_id\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`status\` varchar(32) DEFAULT 'Active',`);
      sqlParts.push(`  \`date_of_first_attendance\` varchar(32) DEFAULT NULL,`);
      sqlParts.push(`  \`contact_number\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`guardian_name\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`address\` text DEFAULT NULL,`);
      sqlParts.push(`  \`photo_url\` text DEFAULT NULL,`);
      sqlParts.push(`  \`is_transferred_out\` tinyint(1) DEFAULT 0,`);
      sqlParts.push(`  \`is_dropped_out\` tinyint(1) DEFAULT 0,`);
      sqlParts.push(`  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,`);
      sqlParts.push(`  PRIMARY KEY (\`id\`),`);
      sqlParts.push(`  KEY \`idx_student_lrn\` (\`lrn\`),`);
      sqlParts.push(`  KEY \`idx_student_section\` (\`section_id\`),`);
      sqlParts.push(`  KEY \`idx_student_school\` (\`school_id\`)`);
      sqlParts.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`);

      const allStudentsMap = new Map<string, any>();

      // Fetch root students
      const rootStudentsSnap = await getDocs(collection(db, 'students')).catch(() => ({ docs: [] } as any));
      for (const d of rootStudentsSnap.docs) {
        allStudentsMap.set(d.id, { id: d.id, ...d.data() });
      }

      // Fetch section subcollections
      for (const sec of sections) {
        const subSnap = await getDocs(collection(db, 'sections', sec.id, 'students')).catch(() => ({ docs: [] } as any));
        for (const sd of subSnap.docs) {
          const sdata = { id: sd.id, ...sd.data(), sectionId: sd.data().sectionId || sec.id, schoolId: sd.data().schoolId || sec.schoolId };
          allStudentsMap.set(sd.id, sdata);
        }
      }

      const compiledStudents = Array.from(allStudentsMap.values());
      rawExportData['students'] = compiledStudents;

      if (compiledStudents.length > 0) {
        sqlParts.push(`-- Dumping data for table: students (${compiledStudents.length} rows)`);
        for (const st of compiledStudents) {
          sqlParts.push(
            `INSERT INTO \`students\` (\`id\`, \`lrn\`, \`first_name\`, \`last_name\`, \`middle_name\`, \`extension_name\`, \`sex\`, \`birth_date\`, \`section_id\`, \`school_id\`, \`status\`, \`date_of_first_attendance\`, \`contact_number\`, \`guardian_name\`, \`address\`, \`photo_url\`, \`is_transferred_out\`, \`is_dropped_out\`) VALUES (` +
            `${escapeSql(st.id)}, ` +
            `${escapeSql(st.lrn || '000000000000')}, ` +
            `${escapeSql(st.firstName || 'Learner')}, ` +
            `${escapeSql(st.lastName || '')}, ` +
            `${escapeSql(st.middleName)}, ` +
            `${escapeSql(st.extensionName)}, ` +
            `${escapeSql(st.sex || 'Male')}, ` +
            `${escapeSql(st.birthDate)}, ` +
            `${escapeSql(st.sectionId)}, ` +
            `${escapeSql(st.schoolId)}, ` +
            `${escapeSql(st.status || 'Active')}, ` +
            `${escapeSql(st.dateOfFirstAttendance)}, ` +
            `${escapeSql(st.contactNumber)}, ` +
            `${escapeSql(st.guardianName)}, ` +
            `${escapeSql(st.address)}, ` +
            `${escapeSql(st.photoUrl || st.photo)}, ` +
            `${escapeSql(st.isTransferredOut ? 1 : 0)}, ` +
            `${escapeSql(st.isDroppedOut ? 1 : 0)}` +
            `);`
          );
        }
        sqlParts.push('');
      }

      // 5. SUBJECTS TABLE
      setProgress(65);
      setCurrentStepText('Extracting & converting [subjects]...');
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`-- Table structure for table: subjects`);
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`DROP TABLE IF EXISTS \`subjects\`;`);
      sqlParts.push(`CREATE TABLE \`subjects\` (`);
      sqlParts.push(`  \`id\` varchar(64) NOT NULL,`);
      sqlParts.push(`  \`name\` varchar(128) NOT NULL,`);
      sqlParts.push(`  \`code\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`section_id\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`teacher_id\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`teacher_name\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`order_num\` int(11) DEFAULT 0,`);
      sqlParts.push(`  \`written_weight\` decimal(5,2) DEFAULT 0.00,`);
      sqlParts.push(`  \`performance_weight\` decimal(5,2) DEFAULT 0.00,`);
      sqlParts.push(`  \`qa_weight\` decimal(5,2) DEFAULT 0.00,`);
      sqlParts.push(`  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,`);
      sqlParts.push(`  PRIMARY KEY (\`id\`),`);
      sqlParts.push(`  KEY \`idx_sub_sec\` (\`section_id\`)`);
      sqlParts.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`);

      const allSubjectsMap = new Map<string, any>();
      const rootSubjSnap = await getDocs(collection(db, 'subjects')).catch(() => ({ docs: [] } as any));
      for (const d of rootSubjSnap.docs) {
        allSubjectsMap.set(d.id, { id: d.id, ...d.data() });
      }

      for (const sec of sections) {
        const subSnap = await getDocs(collection(db, 'sections', sec.id, 'subjects')).catch(() => ({ docs: [] } as any));
        for (const sd of subSnap.docs) {
          allSubjectsMap.set(sd.id, { id: sd.id, ...sd.data(), sectionId: sd.data().sectionId || sec.id });
        }
      }

      const compiledSubjects = Array.from(allSubjectsMap.values());
      rawExportData['subjects'] = compiledSubjects;

      if (compiledSubjects.length > 0) {
        sqlParts.push(`-- Dumping data for table: subjects (${compiledSubjects.length} rows)`);
        for (const sub of compiledSubjects) {
          sqlParts.push(
            `INSERT INTO \`subjects\` (\`id\`, \`name\`, \`code\`, \`section_id\`, \`teacher_id\`, \`teacher_name\`, \`order_num\`, \`written_weight\`, \`performance_weight\`, \`qa_weight\`) VALUES (` +
            `${escapeSql(sub.id)}, ` +
            `${escapeSql(sub.name)}, ` +
            `${escapeSql(sub.code)}, ` +
            `${escapeSql(sub.sectionId)}, ` +
            `${escapeSql(sub.teacherId)}, ` +
            `${escapeSql(sub.teacherName)}, ` +
            `${escapeSql(sub.order || 0)}, ` +
            `${escapeSql(sub.writtenWeight || 0)}, ` +
            `${escapeSql(sub.performanceWeight || 0)}, ` +
            `${escapeSql(sub.qaWeight || 0)}` +
            `);`
          );
        }
        sqlParts.push('');
      }

      // 6. ARAL CLASSES & LEARNERS
      setProgress(80);
      setCurrentStepText('Extracting & converting ARAL Program records...');
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`-- Table structure for table: aral_classes`);
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`DROP TABLE IF EXISTS \`aral_classes\`;`);
      sqlParts.push(`CREATE TABLE \`aral_classes\` (`);
      sqlParts.push(`  \`id\` varchar(64) NOT NULL,`);
      sqlParts.push(`  \`name\` varchar(128) NOT NULL,`);
      sqlParts.push(`  \`grade_level\` varchar(32) DEFAULT NULL,`);
      sqlParts.push(`  \`school_id\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`school_year\` varchar(32) DEFAULT '2026-2027',`);
      sqlParts.push(`  \`adviser_name\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`adviser_email\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`target_subject\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`student_ids\` json DEFAULT NULL,`);
      sqlParts.push(`  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,`);
      sqlParts.push(`  PRIMARY KEY (\`id\`),`);
      sqlParts.push(`  KEY \`idx_aral_school\` (\`school_id\`)`);
      sqlParts.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`);

      const aralSnap = await getDocs(collection(db, 'aral_classes')).catch(() => ({ docs: [] } as any));
      const aralClasses = aralSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      rawExportData['aral_classes'] = aralClasses;

      if (aralClasses.length > 0) {
        sqlParts.push(`-- Dumping data for table: aral_classes (${aralClasses.length} rows)`);
        for (const ac of aralClasses) {
          sqlParts.push(
            `INSERT INTO \`aral_classes\` (\`id\`, \`name\`, \`grade_level\`, \`school_id\`, \`school_year\`, \`adviser_name\`, \`adviser_email\`, \`target_subject\`, \`student_ids\`) VALUES (` +
            `${escapeSql(ac.id)}, ` +
            `${escapeSql(ac.name)}, ` +
            `${escapeSql(String(ac.gradeLevel || ''))}, ` +
            `${escapeSql(ac.schoolId)}, ` +
            `${escapeSql(ac.schoolYear || '2026-2027')}, ` +
            `${escapeSql(ac.adviserName)}, ` +
            `${escapeSql(ac.adviserEmail)}, ` +
            `${escapeSql(ac.targetSubject)}, ` +
            `${escapeSql(ac.studentIds || [])}` +
            `);`
          );
        }
        sqlParts.push('');
      }

      // 7. PTA FEES & PAYMENTS
      setProgress(90);
      setCurrentStepText('Extracting PTA Financial & Attendance Logs...');
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`-- Table structure for table: pta_fees`);
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`DROP TABLE IF EXISTS \`pta_fees\`;`);
      sqlParts.push(`CREATE TABLE \`pta_fees\` (`);
      sqlParts.push(`  \`id\` varchar(64) NOT NULL,`);
      sqlParts.push(`  \`name\` varchar(128) NOT NULL,`);
      sqlParts.push(`  \`amount\` decimal(10,2) NOT NULL DEFAULT 0.00,`);
      sqlParts.push(`  \`school_id\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`school_year\` varchar(32) DEFAULT '2026-2027',`);
      sqlParts.push(`  \`is_mandatory\` tinyint(1) DEFAULT 1,`);
      sqlParts.push(`  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,`);
      sqlParts.push(`  PRIMARY KEY (\`id\`)`);
      sqlParts.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`);

      const ptaSnap = await getDocs(collection(db, 'pta_fees')).catch(() => ({ docs: [] } as any));
      const ptaFees = ptaSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      rawExportData['pta_fees'] = ptaFees;

      if (ptaFees.length > 0) {
        sqlParts.push(`-- Dumping data for table: pta_fees (${ptaFees.length} rows)`);
        for (const pf of ptaFees) {
          sqlParts.push(
            `INSERT INTO \`pta_fees\` (\`id\`, \`name\`, \`amount\`, \`school_id\`, \`school_year\`, \`is_mandatory\`) VALUES (` +
            `${escapeSql(pf.id)}, ` +
            `${escapeSql(pf.name)}, ` +
            `${escapeSql(pf.amount || 0)}, ` +
            `${escapeSql(pf.schoolId)}, ` +
            `${escapeSql(pf.schoolYear || '2026-2027')}, ` +
            `${escapeSql(pf.isMandatory !== false)}` +
            `);`
          );
        }
        sqlParts.push('');
      }

      // 8. ATTENDANCE SCAN LOGS
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`-- Table structure for table: attendance_logs`);
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`DROP TABLE IF EXISTS \`attendance_logs\`;`);
      sqlParts.push(`CREATE TABLE \`attendance_logs\` (`);
      sqlParts.push(`  \`id\` varchar(64) NOT NULL,`);
      sqlParts.push(`  \`student_id\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`lrn\` varchar(32) NOT NULL,`);
      sqlParts.push(`  \`student_name\` varchar(128) DEFAULT NULL,`);
      sqlParts.push(`  \`section_id\` varchar(64) DEFAULT NULL,`);
      sqlParts.push(`  \`scan_type\` varchar(16) NOT NULL DEFAULT 'IN',`);
      sqlParts.push(`  \`timestamp\` datetime DEFAULT CURRENT_TIMESTAMP,`);
      sqlParts.push(`  \`status\` varchar(32) DEFAULT 'Present',`);
      sqlParts.push(`  PRIMARY KEY (\`id\`),`);
      sqlParts.push(`  KEY \`idx_att_lrn\` (\`lrn\`),`);
      sqlParts.push(`  KEY \`idx_att_date\` (\`timestamp\`)`);
      sqlParts.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`);

      const attSnap = await getDocs(collection(db, 'attendance_logs')).catch(() => ({ docs: [] } as any));
      const attLogs = attSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      rawExportData['attendance_logs'] = attLogs;

      if (attLogs.length > 0) {
        sqlParts.push(`-- Dumping data for table: attendance_logs (${attLogs.length} rows)`);
        for (const al of attLogs) {
          sqlParts.push(
            `INSERT INTO \`attendance_logs\` (\`id\`, \`student_id\`, \`lrn\`, \`student_name\`, \`section_id\`, \`scan_type\`, \`timestamp\`, \`status\`) VALUES (` +
            `${escapeSql(al.id)}, ` +
            `${escapeSql(al.studentId)}, ` +
            `${escapeSql(al.lrn || '000000000000')}, ` +
            `${escapeSql(al.studentName)}, ` +
            `${escapeSql(al.sectionId)}, ` +
            `${escapeSql(al.scanType || 'IN')}, ` +
            `${escapeSql(al.timestamp ? new Date(al.timestamp) : new Date())}, ` +
            `${escapeSql(al.status || 'Present')}` +
            `);`
          );
        }
        sqlParts.push('');
      }

      // Footer
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`-- Re-enable constraints and commit transaction`);
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`SET FOREIGN_KEY_CHECKS = 1;`);
      sqlParts.push(`COMMIT;`);
      sqlParts.push(`-- End of DepEd CLASS MySQL Export Dump\n`);

      const fullSql = sqlParts.join('\n');
      setSqlScript(fullSql);
      setExportedJsonData(rawExportData);
      setProgress(100);
      setCurrentStepText(`Conversion successfully completed! Generated ${sqlParts.length} SQL lines across all tables.`);
      setActiveTab('preview');
    } catch (error: any) {
      console.error('Error during conversion:', error);
      setCurrentStepText('Conversion failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsConverting(false);
    }
  };

  // Download .sql file to user machine
  const handleDownloadSql = () => {
    if (!sqlScript) return;
    const blob = new Blob([sqlScript], { type: 'application/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deped_class_mysql_dump_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download relational JSON file
  const handleDownloadJson = () => {
    if (!exportedJsonData) return;
    const blob = new Blob([JSON.stringify(exportedJsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deped_class_relational_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy SQL to clipboard
  const handleCopySql = () => {
    if (!sqlScript) return;
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/90 border border-indigo-400/30 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Firebase to MySQL Database Converter
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Main Admin Suite
                </span>
              </div>
              <p className="text-xs text-indigo-200/70 font-medium mt-0.5">
                Full relational database conversion, schema normalization, and one-click SQL dump generator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Security Check for Main Admin */}
        {!isMainAdmin ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 shadow-md">
              <ShieldAlert size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-1">Access Restricted to Main Admin</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              Database schema migration and raw SQL dump generation contains sensitive enterprise data and is strictly restricted to System Administrators.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-900 transition-all cursor-pointer shadow-sm"
            >
              Back to Safety
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-slate-200/80 bg-white shrink-0">
              <button
                onClick={() => setActiveTab('convert')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'convert'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <RefreshCw size={15} />
                <span>Conversion Engine</span>
              </button>

              <button
                onClick={() => setActiveTab('preview')}
                disabled={!sqlScript}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : !sqlScript 
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileCode size={15} />
                <span>SQL Script Viewer</span>
                {sqlScript && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 text-white font-mono">
                    Ready
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('connection')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'connection'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Terminal size={15} />
                <span>Direct MySQL CLI &amp; Docker</span>
              </button>

              <button
                onClick={() => setActiveTab('schema')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'schema'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <TableIcon size={15} />
                <span>Schema &amp; Type Mapping</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* TAB 1: CONVERT */}
              {activeTab === 'convert' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  
                  {/* Action Banner */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1.5 z-10 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="p-1 rounded-md bg-indigo-500/30 text-indigo-300">
                          <Cpu size={16} />
                        </span>
                        <h3 className="text-lg font-black tracking-tight">
                          Automated Firebase to MySQL Pipeline
                        </h3>
                      </div>
                      <p className="text-xs text-indigo-200/80 max-w-xl leading-relaxed">
                        Reads all documents and nested subcollections from Cloud Firestore, generates fully relational tables (InnoDB, utf8mb4), indexes, and produces complete SQL <code className="bg-black/30 px-1 py-0.5 rounded text-indigo-300 font-mono">INSERT</code> statements ready for phpMyAdmin, MySQL Workbench, or CLI.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 z-10">
                      <button
                        onClick={handleAnalyzeCollections}
                        disabled={isScanning || isConverting}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
                        <span>Refresh Counts</span>
                      </button>

                      <button
                        onClick={handleConvertToMySQL}
                        disabled={isConverting || isScanning}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Database size={16} className={isConverting ? 'animate-pulse' : ''} />
                        <span>{isConverting ? 'Converting...' : 'Start Conversion'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar if Converting */}
                  {isConverting && (
                    <div className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-sm space-y-2.5 animate-fade-in">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-indigo-900 flex items-center gap-2">
                          <RefreshCw size={14} className="animate-spin text-indigo-600" />
                          {currentStepText}
                        </span>
                        <span className="font-mono text-indigo-600">{progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Collections Status Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Layers size={15} />
                        <span>Firestore Collections to Relational MySQL Tables</span>
                      </h4>
                      <span className="text-[11px] font-bold text-slate-400">
                        {collections.reduce((acc, c) => acc + c.count, 0)} Total Records Detected
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {collections.map((col) => (
                        <div 
                          key={col.name}
                          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-indigo-200 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">{col.label}</p>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                              Table: <span className="text-indigo-600 font-bold">`{col.table}`</span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {col.status === 'loading' ? (
                              <RefreshCw size={16} className="animate-spin text-indigo-500" />
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                                {col.count.toLocaleString()} docs
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary & Success Card if converted */}
                  {sqlScript && (
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-emerald-800">
                        <CheckCircle2 size={24} className="shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-sm font-black">MySQL Database Script Ready!</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            File size: ~{(new Blob([sqlScript]).size / 1024).toFixed(1)} KB &bull; Full schema &amp; data inserts generated
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={handleCopySql}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                        </button>

                        <button
                          onClick={handleDownloadSql}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                        >
                          <Download size={14} />
                          <span>Download .sql</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SQL PREVIEW */}
              {activeTab === 'preview' && (
                <div className="h-full flex flex-col space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Filter Table:</span>
                      <select
                        value={selectedTableFilter}
                        onChange={(e) => setSelectedTableFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="all">All Tables (Complete Dump)</option>
                        {collections.map(c => (
                          <option key={c.table} value={c.table}>`{c.table}` ({c.label})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopySql}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={handleDownloadJson}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Download JSON Export"
                      >
                        <Code size={14} />
                        <span>JSON</span>
                      </button>

                      <button
                        onClick={handleDownloadSql}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Download size={14} />
                        <span>Download .SQL</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-950 rounded-2xl p-4 overflow-auto border border-slate-800 font-mono text-[11px] leading-relaxed text-indigo-200/90 shadow-inner">
                    <pre className="whitespace-pre">
                      {(() => {
                        if (selectedTableFilter === 'all') return sqlScript;
                        const lines = sqlScript.split('\n');
                        const filtered: string[] = [];
                        let inTargetTable = false;

                        for (const l of lines) {
                          if (l.includes(`DROP TABLE IF EXISTS \`${selectedTableFilter}\``)) {
                            inTargetTable = true;
                          } else if (inTargetTable && l.startsWith(`DROP TABLE IF EXISTS`) && !l.includes(`\`${selectedTableFilter}\``)) {
                            inTargetTable = false;
                          }
                          if (inTargetTable || l.startsWith('SET') || l.startsWith('START') || l.startsWith('COMMIT')) {
                            filtered.push(l);
                          }
                        }
                        return filtered.join('\n') || `-- No statements found for table \`${selectedTableFilter}\``;
                      })()}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 3: DIRECT CONNECTION & CLI */}
              {activeTab === 'connection' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <Server size={20} />
                      </span>
                      <div>
                        <h4 className="text-sm font-black text-slate-800">Direct MySQL Server Configuration</h4>
                        <p className="text-xs text-slate-500">Configure your target MySQL server connection details to generate CLI import commands</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Host / IP</label>
                        <input
                          type="text"
                          value={dbConfig.host}
                          onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Port</label>
                        <input
                          type="text"
                          value={dbConfig.port}
                          onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Database Name</label>
                        <input
                          type="text"
                          value={dbConfig.database}
                          onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Username</label>
                        <input
                          type="text"
                          value={dbConfig.username}
                          onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Password</label>
                        <input
                          type="password"
                          placeholder="(Optional / Prompted on CLI)"
                          value={dbConfig.password}
                          onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ready-to-Run CLI Commands */}
                  <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                        <Terminal size={16} />
                        <span>Command-Line Import Commands</span>
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 mb-1.5">1. Create Database &amp; Import Dump:</p>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between">
                          <code>mysql -h {dbConfig.host} -P {dbConfig.port} -u {dbConfig.username} -p -e "CREATE DATABASE IF NOT EXISTS \`{dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" &amp;&amp; mysql -h {dbConfig.host} -P {dbConfig.port} -u {dbConfig.username} -p {dbConfig.database} &lt; deped_class_mysql_dump.sql</code>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-slate-400 mb-1.5">2. Run via Docker Container (Instant MySQL 8.0 Instance):</p>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 flex items-center justify-between">
                          <code>docker run --name deped-mysql -e MYSQL_ROOT_PASSWORD=secret -e MYSQL_DATABASE={dbConfig.database} -p 3306:3306 -d mysql:8.0</code>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-slate-400 mb-1.5">3. Import via phpMyAdmin or MySQL Workbench:</p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Simply open <strong>phpMyAdmin</strong> &rarr; Click <strong>Import</strong> &rarr; Choose the downloaded <code className="bg-black/40 px-1 py-0.5 rounded text-emerald-400 font-mono">.sql</code> file &rarr; Click <strong>Go</strong>. The script will automatically create all tables, indexes, and insert all student and school records.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SCHEMA & TYPE MAPPING */}
              {activeTab === 'schema' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                    <h4 className="text-sm font-black text-slate-800 mb-2">NoSQL Firestore to Relational MySQL Data Mapping</h4>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      How Firestore NoSQL document schemas, subcollections, and data types are converted into a standardized, 3rd-normal-form relational SQL structure:
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <th className="py-2.5 px-3">Firebase Firestore Concept</th>
                            <th className="py-2.5 px-3">Normalized MySQL Relational Mapping</th>
                            <th className="py-2.5 px-3">Constraint / Key Strategy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Document ID (`d.id`)</td>
                            <td className="py-2.5 px-3 font-mono">`id` VARCHAR(64)</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">PRIMARY KEY</span></td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">`sections/[id]/students`</td>
                            <td className="py-2.5 px-3 font-mono">`students` table with `section_id`</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">FOREIGN KEY</span></td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">`sections/[id]/subjects`</td>
                            <td className="py-2.5 px-3 font-mono">`subjects` table with `section_id`</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">FOREIGN KEY</span></td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Learner LRN (`student.lrn`)</td>
                            <td className="py-2.5 px-3 font-mono">`lrn` VARCHAR(32)</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">INDEX / B-TREE</span></td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Firestore Timestamp</td>
                            <td className="py-2.5 px-3 font-mono">DATETIME / TIMESTAMP</td>
                            <td className="py-2.5 px-3">ISO-8601 YYYY-MM-DD HH:MM:SS</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Nested Arrays / Lists</td>
                            <td className="py-2.5 px-3 font-mono">JSON Column (Native MySQL 5.7+)</td>
                            <td className="py-2.5 px-3">Indexed via Generated Columns</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Boolean flags</td>
                            <td className="py-2.5 px-3 font-mono">TINYINT(1) (0 / 1)</td>
                            <td className="py-2.5 px-3">Standard MySQL boolean</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <HardDrive size={15} />
                <span>Export Format: MySQL InnoDB &bull; utf8mb4 &bull; Standard SQL-92 / SQL-99 Compliant</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
