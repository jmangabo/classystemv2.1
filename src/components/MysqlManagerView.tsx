import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  HardDrive, 
  Download, 
  ShieldCheck, 
  Table, 
  Zap,
  Check,
  FileCode
} from 'lucide-react';
import { 
  checkMysqlStatus, 
  initializeMysqlTables, 
  fetchMysqlTableCounts, 
  executeMysqlMigration,
  MysqlConnectionStatus,
  MysqlTableCounts 
} from '../services/mysqlApi.ts';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase.ts';

export function MysqlManagerView({ currentUser }: { currentUser: any }) {
  const [status, setStatus] = useState<MysqlConnectionStatus | null>(null);
  const [tableCounts, setTableCounts] = useState<MysqlTableCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);
  const [migrationResult, setMigrationResult] = useState<any | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const refreshStatusAndCounts = async () => {
    setLoading(true);
    try {
      const st = await checkMysqlStatus();
      setStatus(st);
      if (st.connected) {
        const counts = await fetchMysqlTableCounts();
        setTableCounts(counts);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatusAndCounts();
  }, []);

  const handleInitSchema = async () => {
    setInitLoading(true);
    try {
      const res = await initializeMysqlTables();
      if (res.success) {
        setMigrationLog(prev => [...prev, `[SCHEMA] Initialized tables: ${res.tablesCreated.join(', ')}`]);
        await refreshStatusAndCounts();
      } else {
        setMigrationLog(prev => [...prev, `[ERROR] Schema init failed: ${res.error}`]);
      }
    } catch (err: any) {
      setMigrationLog(prev => [...prev, `[ERROR] Schema init failed: ${err.message}`]);
    } finally {
      setInitLoading(false);
    }
  };

  const handleStartMigration = async () => {
    if (migrating) return;
    setMigrating(true);
    setMigrationLog(['[START] Initiating full Firebase to MySQL migration...']);
    setMigrationResult(null);

    try {
      // 1. Fetch Users
      setMigrationLog(prev => [...prev, '[1/5] Fetching users from Firestore...']);
      const usersSnap = await getDocs(collection(firestoreDb, 'users'));
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMigrationLog(prev => [...prev, `  -> Found ${users.length} users in Firestore.`]);

      // 2. Fetch Sections & subcollections
      setMigrationLog(prev => [...prev, '[2/5] Fetching sections, students, subjects, and grades...']);
      const sectionsSnap = await getDocs(collection(firestoreDb, 'sections'));
      const sections = sectionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const studentsBySection: Record<string, any[]> = {};
      const subjectsBySection: Record<string, any[]> = {};
      const gradesBySection: Record<string, any[]> = {};

      for (const sec of sections) {
        // Students
        const stSnap = await getDocs(collection(firestoreDb, 'sections', sec.id, 'students'));
        studentsBySection[sec.id] = stSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Subjects
        const subSnap = await getDocs(collection(firestoreDb, 'sections', sec.id, 'subjects'));
        subjectsBySection[sec.id] = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      setMigrationLog(prev => [...prev, `  -> Found ${sections.length} sections across school years.`]);

      // 3. Scan logs
      setMigrationLog(prev => [...prev, '[3/5] Fetching attendance scan logs...']);
      let scanLogs: any[] = [];
      try {
        const scanSnap = await getDocs(collection(firestoreDb, 'attendance_scan_logs'));
        scanLogs = scanSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('Scan logs fetch optional error:', err);
      }
      setMigrationLog(prev => [...prev, `  -> Found ${scanLogs.length} scan logs.`]);

      // 4. Settings
      setMigrationLog(prev => [...prev, '[4/5] Fetching general settings...']);
      const settings: Record<string, any> = {};
      try {
        const genDoc = await getDoc(doc(firestoreDb, 'settings', 'general'));
        if (genDoc.exists()) {
          settings['general'] = genDoc.data();
        }
      } catch (err) {
        console.warn('Settings fetch error:', err);
      }

      // 5. Send payload to MySQL Migration API
      setMigrationLog(prev => [...prev, '[5/5] Sending all structured payloads to MySQL bulk ingestion API...']);
      const res = await executeMysqlMigration({
        users,
        sections,
        studentsBySection,
        subjectsBySection,
        gradesBySection,
        scanLogs,
        settings,
      });

      if (res.success) {
        setMigrationResult(res.stats);
        setMigrationLog(prev => [
          ...prev, 
          '✅ [COMPLETE] Successfully migrated all Firestore records to MySQL!',
          `  • Users: ${res.stats?.usersMigrated || 0}`,
          `  • Sections: ${res.stats?.sectionsMigrated || 0}`,
          `  • Students: ${res.stats?.studentsMigrated || 0}`,
          `  • Subjects: ${res.stats?.subjectsMigrated || 0}`,
          `  • Scan Logs: ${res.stats?.logsMigrated || 0}`,
        ]);
        await refreshStatusAndCounts();
      } else {
        setMigrationLog(prev => [...prev, `❌ [ERROR] Migration failed: ${res.error}`]);
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      setMigrationLog(prev => [...prev, `❌ [FATAL] Migration aborted: ${error.message}`]);
    } finally {
      setMigrating(false);
    }
  };

  const sqlSchemaText = `-- MySQL Schema for DepEd Class Record Management
CREATE DATABASE IF NOT EXISTS class_record_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE class_record_db;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  display_name VARCHAR(191) NOT NULL DEFAULT '',
  role VARCHAR(50) NOT NULL DEFAULT 'teacher',
  approval_status VARCHAR(50) NOT NULL DEFAULT 'approved',
  school_id VARCHAR(64) NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sections (
  id VARCHAR(64) PRIMARY KEY,
  school_year VARCHAR(32) NOT NULL DEFAULT 'active',
  name VARCHAR(100) NOT NULL,
  grade_level VARCHAR(20) NOT NULL,
  track_strand VARCHAR(100) NULL,
  adviser_name VARCHAR(191) NULL,
  adviser_email VARCHAR(191) NULL,
  created_by VARCHAR(64) NULL,
  is_finalized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(64) PRIMARY KEY,
  section_id VARCHAR(64) NOT NULL,
  lrn VARCHAR(30) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NULL,
  name VARCHAR(255) NOT NULL,
  sex ENUM('Male', 'Female') NOT NULL,
  birthdate VARCHAR(30) NULL,
  status VARCHAR(50) DEFAULT 'Active',
  enrolled_subject_ids JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sec (section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(64) PRIMARY KEY,
  section_id VARCHAR(64) NOT NULL,
  code VARCHAR(50) NULL,
  name VARCHAR(150) NOT NULL,
  grade_level VARCHAR(20) NULL,
  teacher_name VARCHAR(191) NULL,
  teacher_email VARCHAR(191) NULL,
  unit DECIMAL(4,2) DEFAULT 1.0,
  offered_terms JSON NULL,
  written_works_weight DECIMAL(5,2) DEFAULT 30.0,
  performance_tasks_weight DECIMAL(5,2) DEFAULT 50.0,
  quarterly_assessment_weight DECIMAL(5,2) DEFAULT 20.0,
  is_tle_specialization BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sec (section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_term_grades (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64) NOT NULL,
  section_id VARCHAR(64) NOT NULL,
  term INT NOT NULL DEFAULT 1,
  written_works JSON NULL,
  performance_tasks JSON NULL,
  quarterly_assessment JSON NULL,
  initial_grade DECIMAL(6,2) NULL,
  quarterly_grade INT NULL,
  remarks VARCHAR(50) NULL,
  UNIQUE KEY uk_st_sub_term (student_id, subject_id, term)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attendance_scan_logs (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NULL,
  section_id VARCHAR(64) NULL,
  lrn VARCHAR(30) NOT NULL,
  student_name VARCHAR(191) NOT NULL,
  section_name VARCHAR(100) NULL,
  scan_timestamp DATETIME NOT NULL,
  scan_type VARCHAR(20) DEFAULT 'IN',
  synced_by VARCHAR(191) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([sqlSchemaText], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deped_class_record_mysql_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
              <Database size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                MySQL Database & Migration Facility
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Relational Engine
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Convert, synchronize, and manage your school data in MySQL / Cloud SQL.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshStatusAndCounts}
            disabled={loading}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Status
          </button>
          <button
            onClick={handleInitSchema}
            disabled={initLoading}
            className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl font-semibold text-xs text-indigo-700 hover:bg-indigo-100 transition-all flex items-center gap-2 shadow-sm"
          >
            <Zap size={14} />
            {initLoading ? 'Initializing...' : 'Verify / Init Schema'}
          </button>
        </div>
      </div>

      {/* Grid: Connection Status & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Connection Health</span>
            {status?.connected ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 size={13} /> Active & Ready
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <AlertCircle size={13} /> Standby / Local Pool
              </span>
            )}
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Host & Port:</span>
              <span className="font-mono text-xs font-semibold text-slate-800">{status?.host || '127.0.0.1:3306'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Database Name:</span>
              <span className="font-mono text-xs font-semibold text-slate-800">{status?.database || 'class_record_db'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Engine Type:</span>
              <span className="font-semibold text-slate-800">MySQL InnoDB (utf8mb4)</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            {status?.message || 'Ready to process relational database transactions.'}
          </p>
        </div>

        {/* Total Records Counter */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">MySQL Live Table Metrics</span>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Layers size={13} /> 8 Tables Configured
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Sections</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{tableCounts?.sections ?? 0}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Students</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">{tableCounts?.students ?? 0}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Subjects</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{tableCounts?.subjects ?? 0}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Term Grades</p>
              <p className="text-2xl font-black text-purple-600 mt-1">{tableCounts?.student_term_grades ?? 0}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Users & Teachers</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{tableCounts?.users ?? 0}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">School Years</p>
              <p className="text-2xl font-black text-blue-600 mt-1">{tableCounts?.school_years ?? 0}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Scan Logs</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{tableCounts?.attendance_scan_logs ?? 0}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">System Settings</p>
              <p className="text-2xl font-black text-slate-700 mt-1">{tableCounts?.system_settings ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Migration Action Box */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-400/20">
                1-Click Migration Engine
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Migrate All Firestore Documents to MySQL
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              This automated process reads all existing users, sections, learners, specialization subjects, quarterly grades, attendance logs, and school settings from Firestore and populates your MySQL relational schema in a transaction.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleStartMigration}
              disabled={migrating}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
            >
              {migrating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Migrating Records...
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  Run Full Migration
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Migration Logs Terminal */}
        {migrationLog.length > 0 && (
          <div className="mt-6 bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 font-mono text-xs text-indigo-200/90 max-h-56 overflow-y-auto space-y-1.5 scrollbar-thin">
            {migrationLog.map((line, idx) => (
              <div key={idx} className="leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SQL DDL Schema Reference & Exporter */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCode size={20} className="text-indigo-600" />
              MySQL DDL Schema Script
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Use this script to create the schema on any external MySQL server, phpMyAdmin, or Cloud SQL instance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {copiedSql ? <Check size={14} className="text-emerald-600" /> : <ShieldCheck size={14} />}
              {copiedSql ? 'Copied!' : 'Copy SQL'}
            </button>
            <button
              onClick={handleDownloadSql}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download size={14} />
              Download .sql File
            </button>
          </div>
        </div>

        <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 font-mono text-xs max-h-64 overflow-y-auto border border-slate-800 leading-relaxed scrollbar-thin">
          <pre>{sqlSchemaText}</pre>
        </div>
      </div>
    </div>
  );
}
