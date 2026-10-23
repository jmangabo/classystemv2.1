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
  Code,
  HardDrive,
  Cpu,
  Table as TableIcon,
  Search,
  Eye,
  Columns,
  FileSpreadsheet,
  Info,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface FirebaseToMySQLModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export interface FieldMetadata {
  name: string;
  sqlType: string;
  sampleValue: any;
  nonNullCount: number;
  totalDocs: number;
  inferredFrom: 'actual_data' | 'schema_blueprint';
}

export interface CollectionStat {
  name: string;
  label: string;
  table: string;
  count: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  fields: FieldMetadata[];
  records: any[];
  error?: string;
}

// Predefined schemas as baseline fallback when 0 documents exist in Firestore
const BLUEPRINT_FALLBACK_FIELDS: Record<string, { name: string; sqlType: string }[]> = {
  schools: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'schoolId', sqlType: 'VARCHAR(32)' },
    { name: 'name', sqlType: 'VARCHAR(255) NOT NULL' },
    { name: 'division', sqlType: 'VARCHAR(128)' },
    { name: 'region', sqlType: 'VARCHAR(64)' },
    { name: 'district', sqlType: 'VARCHAR(128)' },
    { name: 'address', sqlType: 'TEXT' },
    { name: 'principal', sqlType: 'VARCHAR(128)' },
    { name: 'schoolHead', sqlType: 'VARCHAR(128)' },
    { name: 'contactNumber', sqlType: 'VARCHAR(64)' },
    { name: 'email', sqlType: 'VARCHAR(128)' },
    { name: 'subscriptionStatus', sqlType: 'VARCHAR(32)' },
    { name: 'expiresAt', sqlType: 'DATETIME' },
    { name: 'principalSignature', sqlType: 'LONGTEXT' },
    { name: 'logo', sqlType: 'LONGTEXT' },
    { name: 'idTemplate', sqlType: 'JSON' },
    { name: 'created_at', sqlType: 'DATETIME' },
    { name: 'updated_at', sqlType: 'DATETIME' }
  ],
  users: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'uid', sqlType: 'VARCHAR(64)' },
    { name: 'email', sqlType: 'VARCHAR(191) NOT NULL' },
    { name: 'displayName', sqlType: 'VARCHAR(128)' },
    { name: 'role', sqlType: 'VARCHAR(32) NOT NULL' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'schoolName', sqlType: 'VARCHAR(255)' },
    { name: 'approvalStatus', sqlType: 'VARCHAR(32)' },
    { name: 'position', sqlType: 'VARCHAR(128)' },
    { name: 'contactNumber', sqlType: 'VARCHAR(64)' },
    { name: 'photoURL', sqlType: 'LONGTEXT' },
    { name: 'expiresAt', sqlType: 'DATETIME' },
    { name: 'assignedSections', sqlType: 'JSON' },
    { name: 'assignedSubjects', sqlType: 'JSON' },
    { name: 'created_at', sqlType: 'DATETIME' }
  ],
  sections: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'name', sqlType: 'VARCHAR(128) NOT NULL' },
    { name: 'gradeLevel', sqlType: 'VARCHAR(32) NOT NULL' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'schoolName', sqlType: 'VARCHAR(255)' },
    { name: 'schoolYear', sqlType: 'VARCHAR(32)' },
    { name: 'adviserId', sqlType: 'VARCHAR(64)' },
    { name: 'adviserName', sqlType: 'VARCHAR(128)' },
    { name: 'adviserEmail', sqlType: 'VARCHAR(128)' },
    { name: 'createdBy', sqlType: 'VARCHAR(64)' },
    { name: 'region', sqlType: 'VARCHAR(64)' },
    { name: 'division', sqlType: 'VARCHAR(128)' },
    { name: 'district', sqlType: 'VARCHAR(128)' },
    { name: 'track', sqlType: 'VARCHAR(64)' },
    { name: 'strand', sqlType: 'VARCHAR(64)' },
    { name: 'room', sqlType: 'VARCHAR(64)' },
    { name: 'isFinalized', sqlType: 'TINYINT(1)' },
    { name: 'signatureEnabled', sqlType: 'JSON' },
    { name: 'deletionStatus', sqlType: 'VARCHAR(32)' },
    { name: 'deletionRequestedBy', sqlType: 'VARCHAR(64)' },
    { name: 'disapprovalReason', sqlType: 'TEXT' },
    { name: 'deletionReason', sqlType: 'TEXT' },
    { name: 'created_at', sqlType: 'DATETIME' }
  ],
  students: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'lrn', sqlType: 'VARCHAR(32) NOT NULL' },
    { name: 'name', sqlType: 'VARCHAR(191)' },
    { name: 'firstName', sqlType: 'VARCHAR(64)' },
    { name: 'lastName', sqlType: 'VARCHAR(64)' },
    { name: 'middleName', sqlType: 'VARCHAR(64)' },
    { name: 'extensionName', sqlType: 'VARCHAR(16)' },
    { name: 'sex', sqlType: 'VARCHAR(16)' },
    { name: 'birthdate', sqlType: 'VARCHAR(32)' },
    { name: 'birthDate', sqlType: 'VARCHAR(32)' },
    { name: 'birthplace', sqlType: 'TEXT' },
    { name: 'age', sqlType: 'INT' },
    { name: 'sectionId', sqlType: 'VARCHAR(64)' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'status', sqlType: 'VARCHAR(32)' },
    { name: 'dateOfFirstAttendance', sqlType: 'VARCHAR(32)' },
    { name: 'contactNumber', sqlType: 'VARCHAR(64)' },
    { name: 'address', sqlType: 'TEXT' },
    { name: 'fatherName', sqlType: 'VARCHAR(128)' },
    { name: 'fatherOccupation', sqlType: 'VARCHAR(128)' },
    { name: 'motherName', sqlType: 'VARCHAR(128)' },
    { name: 'motherOccupation', sqlType: 'VARCHAR(128)' },
    { name: 'guardianName', sqlType: 'VARCHAR(128)' },
    { name: 'guardianRelationship', sqlType: 'VARCHAR(64)' },
    { name: 'dropoutDate', sqlType: 'VARCHAR(32)' },
    { name: 'dropoutReason', sqlType: 'TEXT' },
    { name: 'transferredOutDate', sqlType: 'VARCHAR(32)' },
    { name: 'transferredOutSchool', sqlType: 'TEXT' },
    { name: 'eligibility', sqlType: 'JSON' },
    { name: 'data', sqlType: 'JSON' },
    { name: 'signatures', sqlType: 'JSON' },
    { name: 'adviserSignature', sqlType: 'LONGTEXT' },
    { name: 'photo', sqlType: 'LONGTEXT' },
    { name: 'photoUrl', sqlType: 'LONGTEXT' },
    { name: 'isTransferredOut', sqlType: 'TINYINT(1)' },
    { name: 'isDroppedOut', sqlType: 'TINYINT(1)' },
    { name: 'created_at', sqlType: 'DATETIME' }
  ],
  subjects: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'name', sqlType: 'VARCHAR(128) NOT NULL' },
    { name: 'code', sqlType: 'VARCHAR(64)' },
    { name: 'group', sqlType: 'VARCHAR(64)' },
    { name: 'sectionId', sqlType: 'VARCHAR(64)' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'teacherId', sqlType: 'VARCHAR(64)' },
    { name: 'teacherName', sqlType: 'VARCHAR(128)' },
    { name: 'teacherEmail', sqlType: 'VARCHAR(128)' },
    { name: 'gradeLevel', sqlType: 'VARCHAR(32)' },
    { name: 'subjectType', sqlType: 'VARCHAR(32)' },
    { name: 'order', sqlType: 'INT' },
    { name: 'orderNum', sqlType: 'INT' },
    { name: 'wwWeight', sqlType: 'DECIMAL(5,2)' },
    { name: 'writtenWeight', sqlType: 'DECIMAL(5,2)' },
    { name: 'ptWeight', sqlType: 'DECIMAL(5,2)' },
    { name: 'performanceWeight', sqlType: 'DECIMAL(5,2)' },
    { name: 'qaWeight', sqlType: 'DECIMAL(5,2)' },
    { name: 'taWeight', sqlType: 'DECIMAL(5,2)' },
    { name: 'created_at', sqlType: 'DATETIME' }
  ],
  global_subjects: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'name', sqlType: 'VARCHAR(128) NOT NULL' },
    { name: 'code', sqlType: 'VARCHAR(64)' },
    { name: 'group', sqlType: 'VARCHAR(64)' },
    { name: 'gradeLevel', sqlType: 'VARCHAR(32)' },
    { name: 'subjectType', sqlType: 'VARCHAR(32)' },
    { name: 'wwWeight', sqlType: 'DECIMAL(5,2)' },
    { name: 'ptWeight', sqlType: 'DECIMAL(5,2)' },
    { name: 'qaWeight', sqlType: 'DECIMAL(5,2)' },
    { name: 'created_at', sqlType: 'DATETIME' }
  ],
  aral_classes: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'name', sqlType: 'VARCHAR(128) NOT NULL' },
    { name: 'gradeLevel', sqlType: 'VARCHAR(32)' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'schoolYear', sqlType: 'VARCHAR(32)' },
    { name: 'adviserName', sqlType: 'VARCHAR(128)' },
    { name: 'adviserEmail', sqlType: 'VARCHAR(128)' },
    { name: 'targetSubject', sqlType: 'VARCHAR(128)' },
    { name: 'studentIds', sqlType: 'JSON' },
    { name: 'created_at', sqlType: 'DATETIME' }
  ],
  aral_sessions: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'classId', sqlType: 'VARCHAR(64)' },
    { name: 'sessionDate', sqlType: 'VARCHAR(32)' },
    { name: 'lessonTitle', sqlType: 'VARCHAR(255)' },
    { name: 'attendance', sqlType: 'JSON' },
    { name: 'notes', sqlType: 'TEXT' },
    { name: 'conductedBy', sqlType: 'VARCHAR(128)' },
    { name: 'created_at', sqlType: 'DATETIME' }
  ],
  attendance_logs: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'studentId', sqlType: 'VARCHAR(64)' },
    { name: 'lrn', sqlType: 'VARCHAR(32) NOT NULL' },
    { name: 'studentName', sqlType: 'VARCHAR(128)' },
    { name: 'sectionId', sqlType: 'VARCHAR(64)' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'scanType', sqlType: 'VARCHAR(16)' },
    { name: 'status', sqlType: 'VARCHAR(32)' },
    { name: 'timestamp', sqlType: 'DATETIME' },
    { name: 'date', sqlType: 'VARCHAR(32)' },
    { name: 'remarks', sqlType: 'TEXT' },
    { name: 'created_at', sqlType: 'DATETIME' }
  ],
  attendance_scan_logs: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'studentId', sqlType: 'VARCHAR(64)' },
    { name: 'studentName', sqlType: 'VARCHAR(128)' },
    { name: 'lrn', sqlType: 'VARCHAR(32) NOT NULL' },
    { name: 'sectionId', sqlType: 'VARCHAR(64)' },
    { name: 'sectionName', sqlType: 'VARCHAR(128)' },
    { name: 'gradeLevel', sqlType: 'VARCHAR(32)' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'schoolYear', sqlType: 'VARCHAR(32)' },
    { name: 'scanDate', sqlType: 'VARCHAR(32)' },
    { name: 'scanTime', sqlType: 'VARCHAR(32)' },
    { name: 'scanType', sqlType: 'VARCHAR(16)' },
    { name: 'timestamp', sqlType: 'DATETIME' },
    { name: 'scannedBy', sqlType: 'VARCHAR(128)' },
    { name: 'status', sqlType: 'VARCHAR(32)' },
    { name: 'created_at', sqlType: 'DATETIME' }
  ],
  pta_fees: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'name', sqlType: 'VARCHAR(128) NOT NULL' },
    { name: 'amount', sqlType: 'DECIMAL(10,2) NOT NULL' },
    { name: 'description', sqlType: 'TEXT' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'schoolYear', sqlType: 'VARCHAR(32)' },
    { name: 'semester', sqlType: 'VARCHAR(32)' },
    { name: 'status', sqlType: 'VARCHAR(32)' },
    { name: 'isVoluntary', sqlType: 'TINYINT(1)' },
    { name: 'isMandatory', sqlType: 'TINYINT(1)' },
    { name: 'allowSiblingCoverage', sqlType: 'TINYINT(1)' },
    { name: 'createdBy', sqlType: 'VARCHAR(64)' },
    { name: 'createdAt', sqlType: 'DATETIME' },
    { name: 'updatedAt', sqlType: 'DATETIME' }
  ],
  pta_payments: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'studentId', sqlType: 'VARCHAR(64)' },
    { name: 'studentName', sqlType: 'VARCHAR(128)' },
    { name: 'lrn', sqlType: 'VARCHAR(32)' },
    { name: 'sectionId', sqlType: 'VARCHAR(64)' },
    { name: 'sectionName', sqlType: 'VARCHAR(128)' },
    { name: 'gradeLevel', sqlType: 'VARCHAR(32)' },
    { name: 'feeId', sqlType: 'VARCHAR(64)' },
    { name: 'feeName', sqlType: 'VARCHAR(128)' },
    { name: 'amountPaid', sqlType: 'DECIMAL(10,2) NOT NULL' },
    { name: 'paymentDate', sqlType: 'VARCHAR(32)' },
    { name: 'orNumber', sqlType: 'VARCHAR(64)' },
    { name: 'collectorName', sqlType: 'VARCHAR(128)' },
    { name: 'collectorEmail', sqlType: 'VARCHAR(128)' },
    { name: 'schoolYear', sqlType: 'VARCHAR(32)' },
    { name: 'remarks', sqlType: 'TEXT' },
    { name: 'coveredBySibling', sqlType: 'TINYINT(1)' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'createdAt', sqlType: 'DATETIME' }
  ],
  pta_audit_logs: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'actionType', sqlType: 'VARCHAR(64) NOT NULL' },
    { name: 'details', sqlType: 'TEXT' },
    { name: 'performedByEmail', sqlType: 'VARCHAR(128)' },
    { name: 'performedByName', sqlType: 'VARCHAR(128)' },
    { name: 'timestamp', sqlType: 'DATETIME' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'createdAt', sqlType: 'DATETIME' }
  ],
  school_calendar: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'title', sqlType: 'VARCHAR(255) NOT NULL' },
    { name: 'description', sqlType: 'TEXT' },
    { name: 'startDate', sqlType: 'VARCHAR(32)' },
    { name: 'endDate', sqlType: 'VARCHAR(32)' },
    { name: 'type', sqlType: 'VARCHAR(64)' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'schoolYear', sqlType: 'VARCHAR(32)' },
    { name: 'createdBy', sqlType: 'VARCHAR(64)' },
    { name: 'createdAt', sqlType: 'DATETIME' }
  ],
  settings: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'schoolYears', sqlType: 'JSON' },
    { name: 'activeSchoolYear', sqlType: 'VARCHAR(32)' },
    { name: 'closedSchoolYears', sqlType: 'JSON' },
    { name: 'finalizedSchoolYears', sqlType: 'JSON' },
    { name: 'numTerms', sqlType: 'INT' },
    { name: 'cashierEmails', sqlType: 'JSON' },
    { name: 'unfinalizeRequests', sqlType: 'JSON' },
    { name: 'updated_at', sqlType: 'DATETIME' }
  ],
  feedback: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'userId', sqlType: 'VARCHAR(64)' },
    { name: 'userName', sqlType: 'VARCHAR(128)' },
    { name: 'userRole', sqlType: 'VARCHAR(32)' },
    { name: 'ratings', sqlType: 'JSON' },
    { name: 'functionality', sqlType: 'JSON' },
    { name: 'issues', sqlType: 'JSON' },
    { name: 'overall', sqlType: 'JSON' },
    { name: 'createdAt', sqlType: 'DATETIME' }
  ],
  anecdotal_records: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'studentId', sqlType: 'VARCHAR(64)' },
    { name: 'studentName', sqlType: 'VARCHAR(128)' },
    { name: 'sectionId', sqlType: 'VARCHAR(64)' },
    { name: 'sectionName', sqlType: 'VARCHAR(128)' },
    { name: 'subjectId', sqlType: 'VARCHAR(64)' },
    { name: 'subjectName', sqlType: 'VARCHAR(128)' },
    { name: 'date', sqlType: 'VARCHAR(32)' },
    { name: 'time', sqlType: 'VARCHAR(32)' },
    { name: 'category', sqlType: 'VARCHAR(64)' },
    { name: 'observation', sqlType: 'TEXT' },
    { name: 'actionTaken', sqlType: 'TEXT' },
    { name: 'createdBy', sqlType: 'VARCHAR(64)' },
    { name: 'createdByName', sqlType: 'VARCHAR(128)' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'createdAt', sqlType: 'DATETIME' }
  ],
  guidance_appointments: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'studentId', sqlType: 'VARCHAR(64)' },
    { name: 'studentName', sqlType: 'VARCHAR(128)' },
    { name: 'date', sqlType: 'VARCHAR(32)' },
    { name: 'time', sqlType: 'VARCHAR(32)' },
    { name: 'mode', sqlType: 'VARCHAR(64)' },
    { name: 'reason', sqlType: 'TEXT' },
    { name: 'status', sqlType: 'VARCHAR(32)' },
    { name: 'requestedByRole', sqlType: 'VARCHAR(64)' },
    { name: 'requestedByName', sqlType: 'VARCHAR(128)' },
    { name: 'createdAt', sqlType: 'DATETIME' }
  ],
  guidance_concerns: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'category', sqlType: 'VARCHAR(64)' },
    { name: 'details', sqlType: 'TEXT' },
    { name: 'isAnonymous', sqlType: 'TINYINT(1)' },
    { name: 'contactInfo', sqlType: 'VARCHAR(128)' },
    { name: 'byUser', sqlType: 'VARCHAR(64)' },
    { name: 'status', sqlType: 'VARCHAR(32)' },
    { name: 'createdAt', sqlType: 'DATETIME' }
  ],
  guidance_referrals: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'studentId', sqlType: 'VARCHAR(64)' },
    { name: 'studentName', sqlType: 'VARCHAR(128)' },
    { name: 'referredBy', sqlType: 'VARCHAR(128)' },
    { name: 'referrerRole', sqlType: 'VARCHAR(64)' },
    { name: 'reason', sqlType: 'TEXT' },
    { name: 'urgency', sqlType: 'VARCHAR(32)' },
    { name: 'status', sqlType: 'VARCHAR(32)' },
    { name: 'createdAt', sqlType: 'DATETIME' }
  ],
  guidance_messages: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'senderId', sqlType: 'VARCHAR(64)' },
    { name: 'senderName', sqlType: 'VARCHAR(128)' },
    { name: 'senderRole', sqlType: 'VARCHAR(64)' },
    { name: 'text', sqlType: 'TEXT' },
    { name: 'channel', sqlType: 'VARCHAR(128)' },
    { name: 'timestamp', sqlType: 'DATETIME' }
  ],
  guidance_assessments: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'studentId', sqlType: 'VARCHAR(64)' },
    { name: 'studentName', sqlType: 'VARCHAR(128)' },
    { name: 'assessmentTitle', sqlType: 'VARCHAR(255)' },
    { name: 'result', sqlType: 'TEXT' },
    { name: 'date', sqlType: 'DATETIME' }
  ],
  sf7_records: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'schoolYear', sqlType: 'VARCHAR(32)' },
    { name: 'personnelList', sqlType: 'JSON' },
    { name: 'summary', sqlType: 'JSON' },
    { name: 'createdBy', sqlType: 'VARCHAR(64)' },
    { name: 'createdAt', sqlType: 'DATETIME' }
  ],
  conversations: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'participants', sqlType: 'JSON' },
    { name: 'studentId', sqlType: 'VARCHAR(64)' },
    { name: 'studentName', sqlType: 'VARCHAR(128)' },
    { name: 'sectionId', sqlType: 'VARCHAR(64)' },
    { name: 'teacherId', sqlType: 'VARCHAR(64)' },
    { name: 'lastMessage', sqlType: 'TEXT' },
    { name: 'lastMessageAt', sqlType: 'DATETIME' },
    { name: 'schoolId', sqlType: 'VARCHAR(64)' },
    { name: 'createdAt', sqlType: 'DATETIME' }
  ],
  chat_messages: [
    { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY' },
    { name: 'conversationId', sqlType: 'VARCHAR(64)' },
    { name: 'senderId', sqlType: 'VARCHAR(64)' },
    { name: 'senderName', sqlType: 'VARCHAR(128)' },
    { name: 'text', sqlType: 'TEXT' },
    { name: 'timestamp', sqlType: 'DATETIME' },
    { name: 'read', sqlType: 'TINYINT(1)' },
    { name: 'createdAt', sqlType: 'DATETIME' }
  ]
};

// Initial list of all 22 collections across DepEd CLASS
const INITIAL_COLLECTIONS: { name: string; label: string; table: string }[] = [
  { name: 'schools', label: 'Registered Schools & DepEd Profiles', table: 'schools' },
  { name: 'users', label: 'Users, Teachers & Staff Accounts', table: 'users' },
  { name: 'sections', label: 'Class Sections & Advisory Info', table: 'sections' },
  { name: 'students', label: 'Learners & SF10 Academic Records', table: 'students' },
  { name: 'subjects', label: 'Curriculum Subjects & Weights', table: 'subjects' },
  { name: 'global_subjects', label: 'Global Standard Subject Master', table: 'global_subjects' },
  { name: 'aral_classes', label: 'ARAL Remedial Tutorial Classes', table: 'aral_classes' },
  { name: 'aral_sessions', label: 'ARAL Daily Session Logs', table: 'aral_sessions' },
  { name: 'attendance_logs', label: 'Daily Attendance & SF2 Tracking', table: 'attendance_logs' },
  { name: 'attendance_scan_logs', label: 'Barcode/QR Scan Logs (Time-In/Out)', table: 'attendance_scan_logs' },
  { name: 'pta_fees', label: 'PTA Fees & Contribution Types', table: 'pta_fees' },
  { name: 'pta_payments', label: 'PTA Payment Receipts & Dues', table: 'pta_payments' },
  { name: 'pta_audit_logs', label: 'PTA Financial Audit Trails', table: 'pta_audit_logs' },
  { name: 'school_calendar', label: 'School Calendar Events & Activities', table: 'school_calendar' },
  { name: 'settings', label: 'Global System & School Settings', table: 'settings' },
  { name: 'feedback', label: 'Beta Feedback & System Bug Reports', table: 'feedback' },
  { name: 'anecdotal_records', label: 'Learner Anecdotal Observations', table: 'anecdotal_records' },
  { name: 'guidance_appointments', label: 'Guidance Counseling Appointments', table: 'guidance_appointments' },
  { name: 'guidance_concerns', label: 'Guidance Welfare Concern Reports', table: 'guidance_concerns' },
  { name: 'guidance_referrals', label: 'Teacher Guidance Referrals', table: 'guidance_referrals' },
  { name: 'guidance_messages', label: 'Guidance Direct Communications', table: 'guidance_messages' },
  { name: 'guidance_assessments', label: 'Mental & Career Self-Assessments', table: 'guidance_assessments' },
  { name: 'sf7_records', label: 'SF7 School Personnel Assignment Lists', table: 'sf7_records' },
  { name: 'conversations', label: 'Chat Conversations & Sessions', table: 'conversations' },
  { name: 'chat_messages', label: 'Chat Messages Log', table: 'chat_messages' },
];

export const FirebaseToMySQLModal: React.FC<FirebaseToMySQLModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const isMainAdmin = 
    currentUser?.role === 'system_admin' || 
    currentUser?.email === 'jessiemangabo@gmail.com' ||
    currentUser?.email === 'jessie.mangabo@deped.gov.ph';

  const [activeTab, setActiveTab] = useState<'convert' | 'explorer' | 'preview' | 'connection' | 'schema'>('convert');
  const [isScanning, setIsScanning] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const [sqlScript, setSqlScript] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>('all');
  const [exportedJsonData, setExportedJsonData] = useState<Record<string, any[]> | null>(null);

  // Explorer specific state
  const [explorerSelectedCollection, setExplorerSelectedCollection] = useState<string>('students');
  const [explorerViewMode, setExplorerViewMode] = useState<'data' | 'fields'>('data');
  const [explorerSearchQuery, setExplorerSearchQuery] = useState<string>('');
  const [activeJsonModalData, setActiveJsonModalData] = useState<{ title: string; content: any } | null>(null);

  // MySQL Connection Configurations for CLI & Helper Scripts
  const [dbConfig, setDbConfig] = useState({
    host: '127.0.0.1',
    port: '3306',
    database: 'deped_class_records',
    username: 'root',
    password: '',
  });

  // Track Firestore Collections to Normalize & Migrate
  const [collections, setCollections] = useState<CollectionStat[]>(
    INITIAL_COLLECTIONS.map(col => ({
      ...col,
      count: 0,
      status: 'idle',
      fields: BLUEPRINT_FALLBACK_FIELDS[col.name] 
        ? BLUEPRINT_FALLBACK_FIELDS[col.name].map(f => ({
            name: f.name,
            sqlType: f.sqlType,
            sampleValue: null,
            nonNullCount: 0,
            totalDocs: 0,
            inferredFrom: 'schema_blueprint'
          }))
        : [
            { name: 'id', sqlType: 'VARCHAR(64) NOT NULL PRIMARY KEY', sampleValue: 'doc_id', nonNullCount: 0, totalDocs: 0, inferredFrom: 'schema_blueprint' },
            { name: 'created_at', sqlType: 'DATETIME', sampleValue: null, nonNullCount: 0, totalDocs: 0, inferredFrom: 'schema_blueprint' }
          ],
      records: []
    }))
  );

  // Scan collections and retrieve counts when opened
  useEffect(() => {
    if (isOpen && isMainAdmin) {
      handleAnalyzeCollections();
    }
  }, [isOpen, isMainAdmin]);

  // Safe SQL value escaping
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
      const jsonStr = JSON.stringify(val);
      return `'${jsonStr.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }
    const str = String(val);
    return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
  };

  // Helper to infer optimal MySQL column type for any detected field
  const inferColumnType = (fieldName: string, values: any[]): string => {
    if (fieldName === 'id') return 'VARCHAR(64) NOT NULL PRIMARY KEY';

    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    if (nonNullValues.length === 0) {
      // Default to VARCHAR(255) if no values are available to inspect
      if (fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('time')) return 'DATETIME';
      if (fieldName.toLowerCase().includes('id') || fieldName.toLowerCase().includes('lrn')) return 'VARCHAR(64)';
      return 'VARCHAR(255)';
    }

    // Check if boolean
    const allBooleans = nonNullValues.every(v => typeof v === 'boolean');
    if (allBooleans) return 'TINYINT(1)';

    // Check if numbers
    const allNumbers = nonNullValues.every(v => typeof v === 'number');
    if (allNumbers) {
      const hasDecimals = nonNullValues.some(v => !Number.isInteger(v));
      if (hasDecimals) return 'DECIMAL(10,2)';
      const maxVal = Math.max(...nonNullValues);
      if (maxVal > 2147483647) return 'BIGINT';
      return 'INT';
    }

    // Check if objects / arrays
    const hasObjects = nonNullValues.some(v => typeof v === 'object' && !(v instanceof Date) && typeof v.seconds !== 'number');
    if (hasObjects) return 'JSON';

    // Check if timestamps / dates
    const allDates = nonNullValues.every(v => {
      if (v instanceof Date) return true;
      if (typeof v?.seconds === 'number') return true;
      if (typeof v === 'string') {
        // Test standard ISO date string
        return /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}/.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v);
      }
      return false;
    });
    if (allDates) {
      const isDateOnly = nonNullValues.every(v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v));
      return isDateOnly ? 'DATE' : 'DATETIME';
    }

    // Measure string lengths
    const stringLengths = nonNullValues.map(v => String(v).length);
    const maxLen = Math.max(...stringLengths);

    if (maxLen > 2048 || fieldName.toLowerCase().includes('photo') || fieldName.toLowerCase().includes('signature') || fieldName.toLowerCase().includes('base64')) {
      return 'LONGTEXT';
    }
    if (maxLen > 255 || fieldName.toLowerCase().includes('observation') || fieldName.toLowerCase().includes('description') || fieldName.toLowerCase().includes('remarks') || fieldName.toLowerCase().includes('address') || fieldName.toLowerCase().includes('reason')) {
      return 'TEXT';
    }
    if (fieldName.toLowerCase().includes('email')) return 'VARCHAR(191)';
    if (fieldName.toLowerCase().includes('lrn') || fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('contact')) return 'VARCHAR(32)';
    if (fieldName.toLowerCase().includes('id')) return 'VARCHAR(64)';

    return 'VARCHAR(255)';
  };

  // Helper to discover all fields across an array of documents
  const discoverAllFields = (
    collectionName: string, 
    docs: any[]
  ): FieldMetadata[] => {
    const fieldMap = new Map<string, any[]>();

    // Seed with id
    fieldMap.set('id', []);

    // Also seed with known blueprint fields so schema is always structurally complete
    if (BLUEPRINT_FALLBACK_FIELDS[collectionName]) {
      for (const f of BLUEPRINT_FALLBACK_FIELDS[collectionName]) {
        if (!fieldMap.has(f.name)) {
          fieldMap.set(f.name, []);
        }
      }
    }

    // Inspect each actual document
    for (const d of docs) {
      for (const key of Object.keys(d)) {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, []);
        }
        fieldMap.get(key)!.push(d[key]);
      }
    }

    const result: FieldMetadata[] = [];

    for (const [key, values] of fieldMap.entries()) {
      const nonNulls = values.filter(v => v !== null && v !== undefined);
      let sqlType = '';

      if (key === 'id') {
        sqlType = 'VARCHAR(64) NOT NULL PRIMARY KEY';
      } else if (nonNulls.length > 0) {
        sqlType = inferColumnType(key, values);
      } else {
        // Look up fallback from blueprint
        const fallback = BLUEPRINT_FALLBACK_FIELDS[collectionName]?.find(f => f.name === key);
        sqlType = fallback ? fallback.sqlType : inferColumnType(key, []);
      }

      result.push({
        name: key,
        sqlType,
        sampleValue: nonNulls.length > 0 ? nonNulls[0] : null,
        nonNullCount: nonNulls.length,
        totalDocs: docs.length,
        inferredFrom: nonNulls.length > 0 ? 'actual_data' : 'schema_blueprint'
      });
    }

    // Ensure 'id' is first
    result.sort((a, b) => {
      if (a.name === 'id') return -1;
      if (b.name === 'id') return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  };

  // Fetch all documents for a collection, handling subcollections where appropriate
  const fetchAllDocsForCollection = async (colName: string): Promise<any[]> => {
    try {
      if (colName === 'students') {
        const studentMap = new Map<string, any>();
        
        // 1. Root students collection
        try {
          const rootSnap = await getDocs(collection(db, 'students'));
          for (const d of rootSnap.docs) {
            studentMap.set(d.id, { id: d.id, ...d.data() });
          }
        } catch (e) {
          console.warn('Could not read root students collection:', e);
        }

        // 2. Sections subcollections: sections/{id}/students
        try {
          const secSnap = await getDocs(collection(db, 'sections'));
          for (const secDoc of secSnap.docs) {
            const secData = secDoc.data();
            try {
              const subSnap = await getDocs(collection(db, 'sections', secDoc.id, 'students'));
              for (const sd of subSnap.docs) {
                const sdata = {
                  id: sd.id,
                  ...sd.data(),
                  sectionId: sd.data().sectionId || secDoc.id,
                  schoolId: sd.data().schoolId || secData.schoolId || null
                };
                studentMap.set(sd.id, sdata);
              }
            } catch (err) {
              // Ignore single section subcollection error
            }
          }
        } catch (e) {
          console.warn('Could not read sections for student subcollections:', e);
        }

        return Array.from(studentMap.values());
      }

      if (colName === 'subjects') {
        const subjectMap = new Map<string, any>();

        // 1. Root subjects collection
        try {
          const rootSnap = await getDocs(collection(db, 'subjects'));
          for (const d of rootSnap.docs) {
            subjectMap.set(d.id, { id: d.id, ...d.data() });
          }
        } catch (e) {
          console.warn('Could not read root subjects:', e);
        }

        // 2. Sections subcollections: sections/{id}/subjects
        try {
          const secSnap = await getDocs(collection(db, 'sections'));
          for (const secDoc of secSnap.docs) {
            try {
              const subSnap = await getDocs(collection(db, 'sections', secDoc.id, 'subjects'));
              for (const sd of subSnap.docs) {
                const sdata = {
                  id: sd.id,
                  ...sd.data(),
                  sectionId: sd.data().sectionId || secDoc.id
                };
                subjectMap.set(sd.id, sdata);
              }
            } catch (err) {
              // Ignore
            }
          }
        } catch (e) {
          console.warn('Could not read sections for subject subcollections:', e);
        }

        return Array.from(subjectMap.values());
      }

      if (colName === 'chat_messages') {
        const messages: any[] = [];
        try {
          const convSnap = await getDocs(collection(db, 'conversations'));
          for (const convDoc of convSnap.docs) {
            try {
              const msgSnap = await getDocs(collection(db, 'conversations', convDoc.id, 'messages'));
              for (const md of msgSnap.docs) {
                messages.push({
                  id: md.id,
                  conversationId: convDoc.id,
                  ...md.data()
                });
              }
            } catch (err) {
              // Ignore
            }
          }
        } catch (e) {
          console.warn('Could not read conversations messages:', e);
        }
        return messages;
      }

      // Standard single collection
      const snap = await getDocs(collection(db, colName));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn(`Could not read collection ${colName}:`, e.message);
      return [];
    }
  };

  // Analyze Firestore Collections, discover all fields, and count records
  const handleAnalyzeCollections = async () => {
    setIsScanning(true);
    setCurrentStepText('Analyzing all Firestore collections and discovering fields...');

    try {
      const updated = [...collections];

      for (let i = 0; i < updated.length; i++) {
        const col = updated[i];
        col.status = 'loading';
        setCollections([...updated]);

        try {
          const docs = await fetchAllDocsForCollection(col.name);
          col.count = docs.length;
          col.records = docs;
          col.fields = discoverAllFields(col.name, docs);
          col.status = 'ready';
        } catch (e: any) {
          console.warn(`Could not analyze collection ${col.name}:`, e);
          col.count = 0;
          col.records = [];
          col.fields = discoverAllFields(col.name, []);
          col.status = 'ready';
        }
      }

      setCollections([...updated]);
      setCurrentStepText('Analysis complete. All fields across all collections are identified.');
    } catch (err: any) {
      console.error('Error analyzing Firestore:', err);
      setCurrentStepText('Error during analysis: ' + (err.message || 'Unknown error'));
    } finally {
      setIsScanning(false);
    }
  };

  // Convert Firebase Firestore collections, ALL fields, and ALL data to a complete MySQL Dump
  const handleConvertToMySQL = async () => {
    setIsConverting(true);
    setProgress(5);
    setCurrentStepText('Initiating complete Firebase to MySQL conversion for all fields and data...');

    const timestamp = new Date().toISOString();
    const sqlParts: string[] = [];

    // Header & MySQL Safety Directives
    sqlParts.push(`-- ==============================================================================`);
    sqlParts.push(`-- DepEd Centralized Learner Assessment & School System (CLASS) Enterprise`);
    sqlParts.push(`-- Firebase Firestore to MySQL Complete Relational Database Dump`);
    sqlParts.push(`-- Generated on: ${timestamp}`);
    sqlParts.push(`-- Engine: MySQL 5.7+ / 8.0+ (InnoDB, utf8mb4_unicode_ci)`);
    sqlParts.push(`-- Total Collections Included: ${collections.length}`);
    sqlParts.push(`-- Schema Mode: Full Field Discovery (Preserving ALL Database Columns & Data)`);
    sqlParts.push(`-- ==============================================================================\n`);
    sqlParts.push(`SET NAMES utf8mb4;`);
    sqlParts.push(`SET FOREIGN_KEY_CHECKS = 0;`);
    sqlParts.push(`SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";`);
    sqlParts.push(`SET AUTOCOMMIT = 0;`);
    sqlParts.push(`START TRANSACTION;\n`);

    const rawExportData: Record<string, any[]> = {};
    const updatedCollections = [...collections];

    try {
      for (let i = 0; i < updatedCollections.length; i++) {
        const col = updatedCollections[i];
        const stepPercent = Math.round(5 + ((i + 1) / updatedCollections.length) * 90);
        setProgress(stepPercent);
        setCurrentStepText(`Extracting & converting all fields in [${col.name}] (${col.label})...`);

        // Fetch docs if not already fetched or refresh
        let docs = col.records;
        if (!docs || docs.length === 0) {
          docs = await fetchAllDocsForCollection(col.name);
          col.records = docs;
          col.count = docs.length;
        }

        // Discover all fields across docs
        const fields = discoverAllFields(col.name, docs);
        col.fields = fields;
        rawExportData[col.name] = docs;

        // Table definition
        sqlParts.push(`-- ------------------------------------------------------------------------------`);
        sqlParts.push(`-- Table structure for table: \`${col.table}\` (${fields.length} columns)`);
        sqlParts.push(`-- ------------------------------------------------------------------------------`);
        sqlParts.push(`DROP TABLE IF EXISTS \`${col.table}\`;`);
        sqlParts.push(`CREATE TABLE \`${col.table}\` (`);

        const columnDefs: string[] = [];
        const indexDefs: string[] = [];

        for (const f of fields) {
          if (f.name === 'id') {
            columnDefs.push(`  \`id\` varchar(64) NOT NULL`);
          } else {
            columnDefs.push(`  \`${f.name}\` ${f.sqlType.toLowerCase()} DEFAULT NULL`);
          }

          // Add indexes for key fields
          const lowerName = f.name.toLowerCase();
          if (lowerName === 'lrn') {
            indexDefs.push(`  KEY \`idx_${col.table}_lrn\` (\`${f.name}\`)`);
          } else if (lowerName === 'schoolid' || lowerName === 'school_id') {
            indexDefs.push(`  KEY \`idx_${col.table}_school\` (\`${f.name}\`)`);
          } else if (lowerName === 'sectionid' || lowerName === 'section_id') {
            indexDefs.push(`  KEY \`idx_${col.table}_section\` (\`${f.name}\`)`);
          } else if (lowerName === 'email' && col.table === 'users') {
            indexDefs.push(`  UNIQUE KEY \`uniq_${col.table}_email\` (\`${f.name}\`)`);
          } else if (lowerName === 'role') {
            indexDefs.push(`  KEY \`idx_${col.table}_role\` (\`${f.name}\`)`);
          }
        }

        columnDefs.push(`  PRIMARY KEY (\`id\`)`);

        const allTableLines = [...columnDefs, ...indexDefs];
        sqlParts.push(allTableLines.join(',\n'));
        sqlParts.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`);

        // Insert statements with ALL fields
        if (docs.length > 0) {
          sqlParts.push(`-- Dumping data for table: \`${col.table}\` (${docs.length} rows, ${fields.length} fields each)`);
          
          const fieldNames = fields.map(f => f.name);
          const escapedFieldNames = fieldNames.map(f => `\`${f}\``).join(', ');

          // Insert each row
          for (const doc of docs) {
            const values = fieldNames.map(f => escapeSql(doc[f]));
            sqlParts.push(`INSERT INTO \`${col.table}\` (${escapedFieldNames}) VALUES (${values.join(', ')});`);
          }
          sqlParts.push('');
        }
      }

      setCollections(updatedCollections);

      // Footer
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`-- Re-enable constraints and commit transaction`);
      sqlParts.push(`-- ------------------------------------------------------------------------------`);
      sqlParts.push(`SET FOREIGN_KEY_CHECKS = 1;`);
      sqlParts.push(`COMMIT;`);
      sqlParts.push(`-- End of DepEd CLASS Complete MySQL Export Dump (${new Date().toLocaleString()})\n`);

      const fullSql = sqlParts.join('\n');
      setSqlScript(fullSql);
      setExportedJsonData(rawExportData);
      setProgress(100);
      setCurrentStepText(`Conversion successfully completed! Generated ${sqlParts.length} SQL statements covering all fields and data across ${collections.length} tables.`);
      setActiveTab('explorer');
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
    a.download = `deped_class_complete_mysql_dump_${new Date().toISOString().slice(0, 10)}.sql`;
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
    a.download = `deped_class_all_fields_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download single collection CSV with all fields
  const handleDownloadCollectionCsv = (colName: string) => {
    const col = collections.find(c => c.name === colName);
    if (!col || col.records.length === 0) return;

    const fields = col.fields.map(f => f.name);
    const csvRows: string[] = [];

    // Header row
    csvRows.push(fields.map(f => `"${f.replace(/"/g, '""')}"`).join(','));

    // Data rows
    for (const r of col.records) {
      const rowVals = fields.map(f => {
        const val = r[f];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'object') {
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(rowVals.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deped_${col.table}_all_fields_${new Date().toISOString().slice(0, 10)}.csv`;
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

  // Currently selected collection in Explorer
  const currentExplorerCollection = useMemo(() => {
    return collections.find(c => c.name === explorerSelectedCollection) || collections[0];
  }, [collections, explorerSelectedCollection]);

  // Filtered rows for explorer table search
  const filteredExplorerRecords = useMemo(() => {
    if (!currentExplorerCollection?.records) return [];
    if (!explorerSearchQuery.trim()) return currentExplorerCollection.records;

    const q = explorerSearchQuery.toLowerCase();
    return currentExplorerCollection.records.filter(record => {
      return Object.values(record).some(val => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(q);
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [currentExplorerCollection, explorerSearchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-6xl h-[92vh] max-h-[920px] flex flex-col overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/90 border border-indigo-400/30 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Database size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Firebase to MySQL Database Converter
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  All Fields &amp; Data Engine
                </span>
              </div>
              <p className="text-xs text-indigo-200/70 font-medium mt-0.5">
                Extract all collections, discover every field schema, and generate complete relational MySQL SQL &amp; data dumps
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
            <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-200/80 bg-white shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab('convert')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'convert'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <RefreshCw size={15} />
                <span>Conversion Pipeline</span>
              </button>

              <button
                onClick={() => setActiveTab('explorer')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'explorer'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Columns size={15} />
                <span>All Fields &amp; Data Explorer</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-700 font-bold">
                  Live
                </span>
              </button>

              <button
                onClick={() => setActiveTab('preview')}
                disabled={!sqlScript}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
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
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700 font-mono">
                    Ready
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('connection')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'connection'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Terminal size={15} />
                <span>MySQL CLI &amp; Docker</span>
              </button>

              <button
                onClick={() => setActiveTab('schema')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'schema'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <TableIcon size={15} />
                <span>Schema Architecture</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              
              {/* TAB 1: CONVERT */}
              {activeTab === 'convert' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                  
                  {/* Action Banner */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 z-10 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-500/30 text-indigo-300">
                          <Cpu size={18} />
                        </span>
                        <h3 className="text-lg font-black tracking-tight">
                          Full Database &amp; Field Conversion Engine
                        </h3>
                      </div>
                      <p className="text-xs text-indigo-200/80 max-w-2xl leading-relaxed">
                        Extracts <strong>every single field</strong> and document from all <strong>{collections.length} Firestore collections</strong> (including all SF10 student data, grades, attendance, PTA, guidance, and system configs). Discovers dynamic schema attributes and produces valid MySQL 5.7+ / 8.0+ <code className="bg-black/30 px-1 py-0.5 rounded text-indigo-300 font-mono">CREATE TABLE</code> and <code className="bg-black/30 px-1 py-0.5 rounded text-indigo-300 font-mono">INSERT</code> statements without losing any data.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 z-10 w-full md:w-auto">
                      <button
                        onClick={handleAnalyzeCollections}
                        disabled={isScanning || isConverting}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
                        <span>Scan All Fields</span>
                      </button>

                      <button
                        onClick={handleConvertToMySQL}
                        disabled={isConverting || isScanning}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Database size={16} className={isConverting ? 'animate-pulse' : ''} />
                        <span>{isConverting ? 'Extracting...' : 'Extract All Fields & Data'}</span>
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Layers size={15} />
                        <span>Database Collections &amp; Detected Schema ({collections.length} Tables)</span>
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {collections.reduce((acc, c) => acc + c.count, 0)} Total Documents
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          {collections.reduce((acc, c) => acc + c.fields.length, 0)} Total Fields Mapped
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {collections.map((col) => (
                        <div 
                          key={col.name}
                          onClick={() => {
                            setExplorerSelectedCollection(col.name);
                            setActiveTab('explorer');
                          }}
                          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                              {col.label}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-1">
                              <span>`{col.table}`</span>
                              <span>&bull;</span>
                              <span className="text-indigo-600 font-bold">
                                {col.fields.length} fields
                              </span>
                            </div>
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
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3 text-emerald-800">
                        <CheckCircle2 size={24} className="shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-sm font-black">All Fields &amp; Data Successfully Converted!</p>
                          <p className="text-xs text-emerald-700 mt-0.5">
                            File size: ~{(new Blob([sqlScript]).size / 1024).toFixed(1)} KB &bull; {collections.length} tables created &bull; All field data preserved
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setActiveTab('explorer')}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200/70 text-emerald-900 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Columns size={14} />
                          <span>Explore Data</span>
                        </button>

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

              {/* TAB 2: ALL FIELDS & DATA EXPLORER */}
              {activeTab === 'explorer' && (
                <div className="h-full flex flex-col space-y-4 max-w-7xl mx-auto">
                  
                  {/* Explorer Top Controls */}
                  <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <label className="text-xs font-bold text-slate-500">Collection:</label>
                      <select
                        value={explorerSelectedCollection}
                        onChange={(e) => {
                          setExplorerSelectedCollection(e.target.value);
                          setExplorerSearchQuery('');
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {collections.map(c => (
                          <option key={c.name} value={c.name}>
                            {c.label} (`{c.table}`) — {c.count} docs, {c.fields.length} fields
                          </option>
                        ))}
                      </select>

                      {/* View Mode Toggle */}
                      <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                        <button
                          onClick={() => setExplorerViewMode('data')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            explorerViewMode === 'data' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Data Grid ({currentExplorerCollection.records.length})
                        </button>
                        <button
                          onClick={() => setExplorerViewMode('fields')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            explorerViewMode === 'fields' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All Fields Dictionary ({currentExplorerCollection.fields.length})
                        </button>
                      </div>
                    </div>

                    {/* Search and Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {explorerViewMode === 'data' && (
                        <div className="relative flex-1 sm:w-64">
                          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search in all fields..."
                            value={explorerSearchQuery}
                            onChange={(e) => setExplorerSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      )}

                      <button
                        onClick={() => handleDownloadCollectionCsv(currentExplorerCollection.name)}
                        disabled={currentExplorerCollection.records.length === 0}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                        title="Download CSV for this collection"
                      >
                        <FileSpreadsheet size={14} />
                        <span className="hidden sm:inline">CSV</span>
                      </button>

                      <button
                        onClick={handleDownloadJson}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Download complete JSON export"
                      >
                        <Code size={14} />
                        <span className="hidden sm:inline">JSON</span>
                      </button>

                      <button
                        onClick={handleDownloadSql}
                        disabled={!sqlScript}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Download size={14} />
                        <span>Dump .SQL</span>
                      </button>
                    </div>
                  </div>

                  {/* Schema Summary Header Banner */}
                  <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50 border border-indigo-100 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-indigo-950">
                        Table `{currentExplorerCollection.table}`:
                      </span>
                      <span className="text-slate-600 font-mono">
                        {currentExplorerCollection.fields.length} distinct fields &bull; {currentExplorerCollection.records.length} records
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                      <span className="text-slate-400 font-medium">Field Preview:</span>
                      {currentExplorerCollection.fields.slice(0, 6).map(f => (
                        <span key={f.name} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-slate-700">
                          {f.name} <span className="text-indigo-600 text-[10px]">({f.sqlType.split(' ')[0]})</span>
                        </span>
                      ))}
                      {currentExplorerCollection.fields.length > 6 && (
                        <span className="px-1.5 py-0.5 rounded text-indigo-600 font-bold">
                          +{currentExplorerCollection.fields.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* EXPLORER VIEW 1: DATA GRID (ALL FIELDS) */}
                  {explorerViewMode === 'data' && (
                    <div className="flex-1 min-h-[350px] bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-xs">
                      {filteredExplorerRecords.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                          <TableIcon size={36} className="text-slate-300 mb-2" />
                          <p className="text-sm font-bold text-slate-700">
                            {currentExplorerCollection.records.length === 0
                              ? `No records found in Firestore collection "${currentExplorerCollection.name}".`
                              : `No records match "${explorerSearchQuery}".`}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 max-w-md">
                            {currentExplorerCollection.records.length === 0
                              ? 'The table schema with all blueprint fields will still be generated in the SQL dump!'
                              : 'Try adjusting your search query.'}
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10">
                              <tr>
                                <th className="py-2.5 px-3 font-mono text-[11px] font-black uppercase text-slate-500 bg-slate-100 sticky left-0 z-20 border-r border-slate-200">
                                  #
                                </th>
                                {currentExplorerCollection.fields.map(f => (
                                  <th key={f.name} className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap border-r border-slate-200">
                                    <div className="flex items-center gap-1.5">
                                      <span>{f.name}</span>
                                      <span className="text-[10px] font-normal px-1 py-0.2 rounded bg-indigo-50 text-indigo-600">
                                        {f.sqlType.split(' ')[0]}
                                      </span>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                              {filteredExplorerRecords.map((rec, idx) => (
                                <tr key={rec.id || idx} className="hover:bg-indigo-50/40 transition-colors">
                                  <td className="py-2 px-3 text-slate-400 bg-white sticky left-0 border-r border-slate-200 font-mono text-[10px]">
                                    {idx + 1}
                                  </td>
                                  {currentExplorerCollection.fields.map(f => {
                                    const val = rec[f.name];
                                    const isNull = val === null || val === undefined;
                                    const isObj = typeof val === 'object' && val !== null;
                                    const isBool = typeof val === 'boolean';

                                    return (
                                      <td key={f.name} className="py-2 px-3 whitespace-nowrap max-w-xs truncate border-r border-slate-100">
                                        {isNull ? (
                                          <span className="text-slate-300 italic">NULL</span>
                                        ) : isBool ? (
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {val ? 'TRUE (1)' : 'FALSE (0)'}
                                          </span>
                                        ) : isObj ? (
                                          <button
                                            onClick={() => setActiveJsonModalData({
                                              title: `Field \`${f.name}\` for record ${rec.id || idx}`,
                                              content: val
                                            })}
                                            className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                          >
                                            <Eye size={10} />
                                            <span>View JSON ({Array.isArray(val) ? `${val.length} items` : Object.keys(val).length + ' keys'})</span>
                                          </button>
                                        ) : (
                                          <span title={String(val)} className="text-slate-800">
                                            {String(val)}
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* EXPLORER VIEW 2: FIELDS DICTIONARY */}
                  {explorerViewMode === 'fields' && (
                    <div className="flex-1 min-h-[350px] bg-white rounded-2xl border border-slate-200 overflow-auto p-4 shadow-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currentExplorerCollection.fields.map((f) => (
                          <div 
                            key={f.name}
                            className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all flex flex-col justify-between space-y-3"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-black text-slate-800 break-all">
                                  `{f.name}`
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                  f.name === 'id'
                                    ? 'bg-indigo-600 text-white'
                                    : f.sqlType.includes('JSON')
                                      ? 'bg-amber-100 text-amber-800'
                                      : f.sqlType.includes('TEXT')
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-indigo-50 text-indigo-700'
                                }`}>
                                  {f.sqlType}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-2">
                                <span>Present in:</span>
                                <span className="font-bold text-slate-700">
                                  {f.nonNullCount} of {f.totalDocs} records
                                </span>
                                {f.totalDocs > 0 && (
                                  <span className="text-[10px] px-1.5 rounded bg-slate-200/70 text-slate-700 font-mono">
                                    {Math.round((f.nonNullCount / f.totalDocs) * 100)}%
                                  </span>
                                )}
                              </p>
                            </div>

                            {/* Sample Value */}
                            <div className="p-2 rounded-lg bg-white border border-slate-200/60 font-mono text-[10px] text-slate-600 break-all overflow-hidden max-h-16">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Sample Value:</span>
                              {f.sampleValue === null || f.sampleValue === undefined ? (
                                <span className="text-slate-300 italic">No sample data available</span>
                              ) : typeof f.sampleValue === 'object' ? (
                                <span className="text-indigo-600 font-semibold">{JSON.stringify(f.sampleValue).slice(0, 120)}...</span>
                              ) : (
                                <span>{String(f.sampleValue)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: SQL SCRIPT VIEWER */}
              {activeTab === 'preview' && (
                <div className="h-full flex flex-col space-y-3 max-w-7xl mx-auto">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Filter Table:</span>
                      <select
                        value={selectedTableFilter}
                        onChange={(e) => setSelectedTableFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="all">All {collections.length} Tables (Complete Dump)</option>
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
                        <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
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

                  <div className="flex-1 bg-slate-950 rounded-2xl p-4 overflow-auto border border-slate-800 font-mono text-[11px] leading-relaxed text-indigo-200/90 shadow-inner min-h-[350px]">
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

              {/* TAB 4: DIRECT CONNECTION & CLI */}
              {activeTab === 'connection' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <Server size={20} />
                      </span>
                      <div>
                        <h4 className="text-sm font-black text-slate-800">Target MySQL Server Configuration</h4>
                        <p className="text-xs text-slate-500">Configure your target MySQL server connection parameters to automatically generate direct import CLI commands</p>
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
                          placeholder="(Prompted on CLI)"
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
                        <span>Instant Command-Line Import Directives</span>
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 mb-1.5">1. One-Line Database Creation &amp; SQL Import:</p>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 break-all select-all">
                          <code>mysql -h {dbConfig.host} -P {dbConfig.port} -u {dbConfig.username} -p -e "CREATE DATABASE IF NOT EXISTS \`{dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" &amp;&amp; mysql -h {dbConfig.host} -P {dbConfig.port} -u {dbConfig.username} -p {dbConfig.database} &lt; deped_class_complete_mysql_dump.sql</code>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-slate-400 mb-1.5">2. Run via Docker (Spins up isolated MySQL 8.0 instance):</p>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 break-all select-all">
                          <code>docker run --name deped-class-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE={dbConfig.database} -p 3306:3306 -d mysql:8.0</code>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-slate-400 mb-1.5">3. Import via phpMyAdmin, HeidiSQL, or MySQL Workbench:</p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Open <strong>phpMyAdmin</strong> &rarr; Click <strong>Import</strong> tab &rarr; Select the downloaded <code className="bg-black/40 px-1 py-0.5 rounded text-emerald-400 font-mono">.sql</code> dump file &rarr; Click <strong>Go</strong>. All tables, full schemas, indexes, and records will be instantiated atomically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SCHEMA & TYPE MAPPING */}
              {activeTab === 'schema' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                    <h4 className="text-sm font-black text-slate-800 mb-2">Firestore NoSQL to Relational MySQL Architecture</h4>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      How every field in Firebase Firestore documents is automatically normalized into an enterprise relational MySQL 5.7+ / 8.0+ schema:
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <th className="py-2.5 px-3">Firestore Data Field Type</th>
                            <th className="py-2.5 px-3">Relational MySQL Column Type</th>
                            <th className="py-2.5 px-3">Behavior &amp; Preserved Integrity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Document ID (`d.id`)</td>
                            <td className="py-2.5 px-3 font-mono">`id` VARCHAR(64) NOT NULL</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">PRIMARY KEY</span></td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Learner LRN (`student.lrn`)</td>
                            <td className="py-2.5 px-3 font-mono">VARCHAR(32)</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">INDEXED / B-TREE</span></td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Nested SF10 Academic Data (`data`)</td>
                            <td className="py-2.5 px-3 font-mono">JSON</td>
                            <td className="py-2.5 px-3">Quarterly grades, monthly attendance, core values</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Eligibility &amp; Completer Details</td>
                            <td className="py-2.5 px-3 font-mono">JSON</td>
                            <td className="py-2.5 px-3">Elementary completion, PEPT, ALS details preserved</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Digital Signatures / Photos</td>
                            <td className="py-2.5 px-3 font-mono">LONGTEXT</td>
                            <td className="py-2.5 px-3">Supports full base64 data URLs without clipping</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Firestore Timestamps / Dates</td>
                            <td className="py-2.5 px-3 font-mono">DATETIME</td>
                            <td className="py-2.5 px-3">Formatted as ISO YYYY-MM-DD HH:MM:SS</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Boolean flags</td>
                            <td className="py-2.5 px-3 font-mono">TINYINT(1)</td>
                            <td className="py-2.5 px-3">Stored as 1 (True) or 0 (False)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-bold">Arrays (e.g. `studentIds`, `schoolYears`)</td>
                            <td className="py-2.5 px-3 font-mono">JSON</td>
                            <td className="py-2.5 px-3">Preserved as native JSON array</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <HardDrive size={15} />
                <span>Format: MySQL InnoDB &bull; utf8mb4_unicode_ci &bull; All Fields Discovered &bull; ANSI SQL Compliant</span>
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

      {/* JSON Viewer Modal for nested complex fields */}
      {activeJsonModalData && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-indigo-400" />
                <span className="text-xs font-bold font-mono">{activeJsonModalData.title}</span>
              </div>
              <button
                onClick={() => setActiveJsonModalData(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 overflow-auto bg-slate-950 font-mono text-[11px] text-emerald-300 flex-1">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(activeJsonModalData.content, null, 2)}
              </pre>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveJsonModalData(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
