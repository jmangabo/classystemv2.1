import { getMysqlPool } from './mysql.ts';

// ---------------------- USERS ----------------------
export async function mysqlUpsertUser(user: {
  id: string;
  email: string;
  displayName?: string;
  role?: string;
  approvalStatus?: string;
  schoolId?: string;
}) {
  const p = getMysqlPool();
  await p.query(
    `INSERT INTO users (id, email, display_name, role, approval_status, school_id)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       email = VALUES(email),
       display_name = COALESCE(NULLIF(VALUES(display_name), ''), display_name),
       role = COALESCE(NULLIF(VALUES(role), ''), role),
       approval_status = COALESCE(NULLIF(VALUES(approval_status), ''), approval_status),
       school_id = COALESCE(NULLIF(VALUES(school_id), ''), school_id)`,
    [
      user.id,
      user.email,
      user.displayName || '',
      user.role || 'teacher',
      user.approvalStatus || 'approved',
      user.schoolId || '',
    ]
  );
  const [rows]: any = await p.query('SELECT * FROM users WHERE id = ?', [user.id]);
  return rows[0];
}

export async function mysqlGetUser(id: string) {
  const p = getMysqlPool();
  const [rows]: any = await p.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function mysqlGetAllUsers() {
  const p = getMysqlPool();
  const [rows]: any = await p.query('SELECT * FROM users ORDER BY created_at DESC');
  return rows;
}

// ---------------------- SCHOOL YEARS ----------------------
export async function mysqlGetSchoolYears() {
  const p = getMysqlPool();
  const [rows]: any = await p.query('SELECT * FROM school_years ORDER BY label ASC');
  return rows;
}

export async function mysqlCreateSchoolYear(id: string, label: string, isActive: boolean = false) {
  const p = getMysqlPool();
  await p.query(
    'INSERT INTO school_years (id, label, is_active) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE label = VALUES(label), is_active = VALUES(is_active)',
    [id, label, isActive]
  );
}

// ---------------------- SECTIONS ----------------------
export async function mysqlGetSections(schoolYear?: string) {
  const p = getMysqlPool();
  let query = 'SELECT * FROM sections';
  const params: any[] = [];
  if (schoolYear) {
    query += ' WHERE school_year = ?';
    params.push(schoolYear);
  }
  query += ' ORDER BY grade_level ASC, name ASC';
  const [rows]: any = await p.query(query, params);
  return rows;
}

export async function mysqlUpsertSection(sec: {
  id: string;
  schoolYear: string;
  name: string;
  gradeLevel: string;
  trackStrand?: string;
  adviserName?: string;
  adviserEmail?: string;
  createdBy?: string;
  isFinalized?: boolean;
}) {
  const p = getMysqlPool();
  await p.query(
    `INSERT INTO sections (id, school_year, name, grade_level, track_strand, adviser_name, adviser_email, created_by, is_finalized)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       school_year = VALUES(school_year),
       name = VALUES(name),
       grade_level = VALUES(grade_level),
       track_strand = VALUES(track_strand),
       adviser_name = VALUES(adviser_name),
       adviser_email = VALUES(adviser_email),
       is_finalized = VALUES(is_finalized)`,
    [
      sec.id,
      sec.schoolYear || 'active',
      sec.name,
      sec.gradeLevel,
      sec.trackStrand || '',
      sec.adviserName || '',
      sec.adviserEmail || '',
      sec.createdBy || '',
      Boolean(sec.isFinalized),
    ]
  );
}

export async function mysqlDeleteSection(sectionId: string) {
  const p = getMysqlPool();
  await p.query('DELETE FROM student_term_grades WHERE section_id = ?', [sectionId]);
  await p.query('DELETE FROM students WHERE section_id = ?', [sectionId]);
  await p.query('DELETE FROM subjects WHERE section_id = ?', [sectionId]);
  await p.query('DELETE FROM sections WHERE id = ?', [sectionId]);
}

// ---------------------- STUDENTS ----------------------
export async function mysqlGetStudents(sectionId: string) {
  const p = getMysqlPool();
  const [rows]: any = await p.query('SELECT * FROM students WHERE section_id = ? ORDER BY sex DESC, last_name ASC, first_name ASC', [sectionId]);
  return rows.map((r: any) => ({
    ...r,
    enrolledSubjectIds: typeof r.enrolled_subject_ids === 'string' ? JSON.parse(r.enrolled_subject_ids) : r.enrolled_subject_ids || [],
  }));
}

export async function mysqlBatchUpsertStudents(sectionId: string, studentList: any[]) {
  if (!studentList || studentList.length === 0) return;
  const p = getMysqlPool();
  
  for (const st of studentList) {
    const enrolledJson = JSON.stringify(st.enrolledSubjectIds || []);
    await p.query(
      `INSERT INTO students (id, section_id, lrn, last_name, first_name, middle_name, name, sex, birthdate, status, dropout_date, enrolled_subject_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         lrn = VALUES(lrn),
         last_name = VALUES(last_name),
         first_name = VALUES(first_name),
         middle_name = VALUES(middle_name),
         name = VALUES(name),
         sex = VALUES(sex),
         birthdate = VALUES(birthdate),
         status = VALUES(status),
         dropout_date = VALUES(dropout_date),
         enrolled_subject_ids = VALUES(enrolled_subject_ids)`,
      [
        st.id,
        sectionId,
        st.lrn || '',
        st.lastName || '',
        st.firstName || '',
        st.middleName || '',
        st.name || `${st.lastName || ''}, ${st.firstName || ''}`,
        st.sex === 'Female' ? 'Female' : 'Male',
        st.birthdate || null,
        st.status || 'Active',
        st.dropoutDate || null,
        enrolledJson,
      ]
    );
  }
}

export async function mysqlDeleteStudent(studentId: string) {
  const p = getMysqlPool();
  await p.query('DELETE FROM student_term_grades WHERE student_id = ?', [studentId]);
  await p.query('DELETE FROM students WHERE id = ?', [studentId]);
}

// ---------------------- SUBJECTS ----------------------
export async function mysqlGetSubjects(sectionId: string) {
  const p = getMysqlPool();
  const [rows]: any = await p.query('SELECT * FROM subjects WHERE section_id = ? ORDER BY name ASC', [sectionId]);
  return rows.map((r: any) => ({
    ...r,
    offeredTerms: typeof r.offered_terms === 'string' ? JSON.parse(r.offered_terms) : r.offered_terms || [1, 2, 3, 4],
  }));
}

export async function mysqlBatchUpsertSubjects(sectionId: string, subjectList: any[]) {
  if (!subjectList || subjectList.length === 0) return;
  const p = getMysqlPool();

  for (const s of subjectList) {
    const termsJson = JSON.stringify(s.offeredTerms || [1, 2, 3, 4]);
    await p.query(
      `INSERT INTO subjects (id, section_id, code, name, grade_level, teacher_name, teacher_email, unit, offered_terms, written_works_weight, performance_tasks_weight, quarterly_assessment_weight, is_tle_specialization)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         code = VALUES(code),
         name = VALUES(name),
         grade_level = VALUES(grade_level),
         teacher_name = VALUES(teacher_name),
         teacher_email = VALUES(teacher_email),
         unit = VALUES(unit),
         offered_terms = VALUES(offered_terms),
         written_works_weight = VALUES(written_works_weight),
         performance_tasks_weight = VALUES(performance_tasks_weight),
         quarterly_assessment_weight = VALUES(quarterly_assessment_weight),
         is_tle_specialization = VALUES(is_tle_specialization)`,
      [
        s.id,
        sectionId,
        s.code || '',
        s.name,
        s.gradeLevel || '',
        s.teacherName || '',
        s.teacherEmail || '',
        s.unit !== undefined ? s.unit : 1.0,
        termsJson,
        s.writtenWorksWeight !== undefined ? s.writtenWorksWeight : 30.0,
        s.performanceTasksWeight !== undefined ? s.performanceTasksWeight : 50.0,
        s.quarterlyAssessmentWeight !== undefined ? s.quarterlyAssessmentWeight : 20.0,
        Boolean(s.isTleSpecialization),
      ]
    );
  }
}

// ---------------------- GRADES ----------------------
export async function mysqlGetTermGrades(sectionId: string, term?: number) {
  const p = getMysqlPool();
  let query = 'SELECT * FROM student_term_grades WHERE section_id = ?';
  const params: any[] = [sectionId];
  if (term) {
    query += ' AND term = ?';
    params.push(term);
  }
  const [rows]: any = await p.query(query, params);
  return rows.map((r: any) => ({
    ...r,
    writtenWorks: typeof r.written_works === 'string' ? JSON.parse(r.written_works) : r.written_works,
    performanceTasks: typeof r.performance_tasks === 'string' ? JSON.parse(r.performance_tasks) : r.performance_tasks,
    quarterlyAssessment: typeof r.quarterly_assessment === 'string' ? JSON.parse(r.quarterly_assessment) : r.quarterly_assessment,
  }));
}

export async function mysqlBatchUpsertGrades(gradesList: any[]) {
  if (!gradesList || gradesList.length === 0) return;
  const p = getMysqlPool();

  for (const g of gradesList) {
    const wwJson = JSON.stringify(g.writtenWorks || []);
    const ptJson = JSON.stringify(g.performanceTasks || []);
    const qaJson = JSON.stringify(g.quarterlyAssessment || {});

    await p.query(
      `INSERT INTO student_term_grades (id, student_id, subject_id, section_id, term, written_works, performance_tasks, quarterly_assessment, initial_grade, quarterly_grade, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         written_works = VALUES(written_works),
         performance_tasks = VALUES(performance_tasks),
         quarterly_assessment = VALUES(quarterly_assessment),
         initial_grade = VALUES(initial_grade),
         quarterly_grade = VALUES(quarterly_grade),
         remarks = VALUES(remarks)`,
      [
        g.id || `${g.studentId}_${g.subjectId}_${g.term}`,
        g.studentId,
        g.subjectId,
        g.sectionId,
        g.term,
        wwJson,
        ptJson,
        qaJson,
        g.initialGrade !== undefined ? g.initialGrade : null,
        g.quarterlyGrade !== undefined ? g.quarterlyGrade : null,
        g.remarks || '',
      ]
    );
  }
}

// ---------------------- ATTENDANCE SCAN LOGS ----------------------
export async function mysqlInsertScanLog(log: {
  id: string;
  studentId?: string;
  sectionId?: string;
  lrn: string;
  studentName: string;
  sectionName?: string;
  scanTimestamp: string | Date;
  scanType?: string;
  syncedBy?: string;
}) {
  const p = getMysqlPool();
  const d = new Date(log.scanTimestamp);
  const formattedDate = d.toISOString().slice(0, 19).replace('T', ' ');

  await p.query(
    `INSERT INTO attendance_scan_logs (id, student_id, section_id, lrn, student_name, section_name, scan_timestamp, scan_type, synced_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.id,
      log.studentId || null,
      log.sectionId || null,
      log.lrn,
      log.studentName,
      log.sectionName || '',
      formattedDate,
      log.scanType || 'IN',
      log.syncedBy || '',
    ]
  );
}

export async function mysqlGetScanLogs(limit: number = 200) {
  const p = getMysqlPool();
  const [rows]: any = await p.query('SELECT * FROM attendance_scan_logs ORDER BY scan_timestamp DESC LIMIT ?', [limit]);
  return rows;
}

export async function mysqlClearScanLogs(logIds?: string[]) {
  const p = getMysqlPool();
  if (logIds && logIds.length > 0) {
    const placeholders = logIds.map(() => '?').join(',');
    await p.query(`DELETE FROM attendance_scan_logs WHERE id IN (${placeholders})`, logIds);
  } else {
    await p.query('DELETE FROM attendance_scan_logs');
  }
}

// ---------------------- SETTINGS ----------------------
export async function mysqlGetSetting(key: string) {
  const p = getMysqlPool();
  const [rows]: any = await p.query('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]);
  if (rows.length === 0) return null;
  return typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
}

export async function mysqlSetSetting(key: string, value: any) {
  const p = getMysqlPool();
  const jsonVal = JSON.stringify(value);
  await p.query(
    'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
    [key, jsonVal]
  );
}

// ---------------------- FULL DATA MIGRATION ENGINE ----------------------
export async function mysqlMigrateAllData(payload: {
  users?: any[];
  sections?: any[];
  studentsBySection?: Record<string, any[]>;
  subjectsBySection?: Record<string, any[]>;
  gradesBySection?: Record<string, any[]>;
  scanLogs?: any[];
  settings?: Record<string, any>;
}) {
  const stats = {
    usersMigrated: 0,
    sectionsMigrated: 0,
    studentsMigrated: 0,
    subjectsMigrated: 0,
    gradesMigrated: 0,
    logsMigrated: 0,
    settingsMigrated: 0,
  };

  // 1. Users
  if (payload.users && payload.users.length > 0) {
    for (const u of payload.users) {
      await mysqlUpsertUser({
        id: u.id || u.uid,
        email: u.email,
        displayName: u.displayName || u.name,
        role: u.role,
        approvalStatus: u.approvalStatus,
        schoolId: u.schoolId,
      });
      stats.usersMigrated++;
    }
  }

  // 2. Sections
  if (payload.sections && payload.sections.length > 0) {
    for (const sec of payload.sections) {
      await mysqlUpsertSection({
        id: sec.id,
        schoolYear: sec.schoolYear || 'active',
        name: sec.name,
        gradeLevel: sec.gradeLevel,
        trackStrand: sec.trackStrand,
        adviserName: sec.adviserName,
        adviserEmail: sec.adviserEmail,
        createdBy: sec.createdBy,
        isFinalized: sec.isFinalized,
      });
      stats.sectionsMigrated++;

      // Students
      const secStudents = payload.studentsBySection?.[sec.id];
      if (secStudents && secStudents.length > 0) {
        await mysqlBatchUpsertStudents(sec.id, secStudents);
        stats.studentsMigrated += secStudents.length;
      }

      // Subjects
      const secSubjects = payload.subjectsBySection?.[sec.id];
      if (secSubjects && secSubjects.length > 0) {
        await mysqlBatchUpsertSubjects(sec.id, secSubjects);
        stats.subjectsMigrated += secSubjects.length;
      }

      // Grades
      const secGrades = payload.gradesBySection?.[sec.id];
      if (secGrades && secGrades.length > 0) {
        await mysqlBatchUpsertGrades(secGrades);
        stats.gradesMigrated += secGrades.length;
      }
    }
  }

  // 3. Scan Logs
  if (payload.scanLogs && payload.scanLogs.length > 0) {
    for (const log of payload.scanLogs) {
      await mysqlInsertScanLog(log);
      stats.logsMigrated++;
    }
  }

  // 4. Settings
  if (payload.settings) {
    for (const [key, val] of Object.entries(payload.settings)) {
      await mysqlSetSetting(key, val);
      stats.settingsMigrated++;
    }
  }

  return stats;
}

export async function mysqlGetTableCounts() {
  const p = getMysqlPool();
  const tables = [
    'users',
    'school_years',
    'sections',
    'students',
    'subjects',
    'student_term_grades',
    'attendance_scan_logs',
    'system_settings',
  ];

  const counts: Record<string, number> = {};
  for (const t of tables) {
    try {
      const [rows]: any = await p.query(`SELECT COUNT(*) as cnt FROM ${t}`);
      counts[t] = rows[0]?.cnt || 0;
    } catch {
      counts[t] = 0;
    }
  }
  return counts;
}
