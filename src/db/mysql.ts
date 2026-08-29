import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getMysqlConfig() {
  const host = process.env.MYSQL_HOST || process.env.SQL_HOST || '127.0.0.1';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER || process.env.SQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.SQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.SQL_DB_NAME || 'class_record_db';
  const uri = process.env.MYSQL_URI;

  return { host, port, user, password, database, uri };
}

export function getMysqlPool(): mysql.Pool {
  if (!pool) {
    const config = getMysqlConfig();
    
    if (config.uri) {
      pool = mysql.createPool({
        uri: config.uri,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
    } else {
      pool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
    }
  }
  return pool;
}

export async function testMysqlConnection(): Promise<{ connected: boolean; message: string; database?: string; host?: string }> {
  try {
    const p = getMysqlPool();
    const [rows]: any = await p.query('SELECT 1 as connected, DATABASE() as db, NOW() as serverTime');
    const config = getMysqlConfig();
    return {
      connected: true,
      message: `Successfully connected to MySQL database at ${config.host}:${config.port}`,
      database: rows[0]?.db || config.database,
      host: `${config.host}:${config.port}`
    };
  } catch (error: any) {
    return {
      connected: false,
      message: error?.message || 'Failed to connect to MySQL database',
    };
  }
}

export async function initMysqlSchema(): Promise<{ success: boolean; tablesCreated: string[]; error?: string }> {
  const p = getMysqlPool();
  const tablesCreated: string[] = [];

  try {
    // 1. Users Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(191) NOT NULL UNIQUE,
        display_name VARCHAR(191) NOT NULL DEFAULT '',
        role VARCHAR(50) NOT NULL DEFAULT 'teacher',
        approval_status VARCHAR(50) NOT NULL DEFAULT 'approved',
        school_id VARCHAR(64) NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tablesCreated.push('users');

    // 2. School Years Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS school_years (
        id VARCHAR(64) PRIMARY KEY,
        label VARCHAR(32) NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tablesCreated.push('school_years');

    // 3. Sections Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id VARCHAR(64) PRIMARY KEY,
        school_year VARCHAR(32) NOT NULL DEFAULT 'active',
        name VARCHAR(100) NOT NULL,
        grade_level VARCHAR(20) NOT NULL,
        track_strand VARCHAR(100) NULL DEFAULT '',
        adviser_name VARCHAR(191) NULL DEFAULT '',
        adviser_email VARCHAR(191) NULL DEFAULT '',
        created_by VARCHAR(64) NULL DEFAULT '',
        is_finalized BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sy (school_year),
        INDEX idx_adviser (adviser_email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tablesCreated.push('sections');

    // 4. Students Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(64) PRIMARY KEY,
        section_id VARCHAR(64) NOT NULL,
        lrn VARCHAR(30) NOT NULL,
        last_name VARCHAR(100) NOT NULL DEFAULT '',
        first_name VARCHAR(100) NOT NULL DEFAULT '',
        middle_name VARCHAR(100) NULL DEFAULT '',
        name VARCHAR(255) NOT NULL DEFAULT '',
        sex ENUM('Male', 'Female') NOT NULL DEFAULT 'Male',
        birthdate VARCHAR(30) NULL,
        status VARCHAR(50) DEFAULT 'Active',
        dropout_date VARCHAR(50) NULL,
        enrolled_subject_ids JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sec (section_id),
        INDEX idx_lrn (lrn)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tablesCreated.push('students');

    // 5. Subjects Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id VARCHAR(64) PRIMARY KEY,
        section_id VARCHAR(64) NOT NULL,
        code VARCHAR(50) NULL DEFAULT '',
        name VARCHAR(150) NOT NULL,
        grade_level VARCHAR(20) NULL DEFAULT '',
        teacher_name VARCHAR(191) NULL DEFAULT '',
        teacher_email VARCHAR(191) NULL DEFAULT '',
        unit DECIMAL(4,2) DEFAULT 1.0,
        offered_terms JSON NULL,
        written_works_weight DECIMAL(5,2) DEFAULT 30.0,
        performance_tasks_weight DECIMAL(5,2) DEFAULT 50.0,
        quarterly_assessment_weight DECIMAL(5,2) DEFAULT 20.0,
        is_tle_specialization BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sec_sub (section_id),
        INDEX idx_teacher (teacher_email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tablesCreated.push('subjects');

    // 6. Student Term Grades & Raw Scores
    await p.query(`
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_st_sub_term (student_id, subject_id, term),
        INDEX idx_sec_term (section_id, term),
        INDEX idx_sub_term (subject_id, term)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tablesCreated.push('student_term_grades');

    // 7. Attendance Scan Logs Table
    await p.query(`
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_time (scan_timestamp),
        INDEX idx_st (student_id),
        INDEX idx_sec (section_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tablesCreated.push('attendance_scan_logs');

    // 8. System Settings Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tablesCreated.push('system_settings');

    return { success: true, tablesCreated };
  } catch (error: any) {
    console.error('Failed to initialize MySQL schema:', error);
    return { success: false, tablesCreated, error: error?.message || 'Database error during initialization' };
  }
}
