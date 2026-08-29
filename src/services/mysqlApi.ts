// Client-side API layer for interacting with MySQL backend endpoints

export interface MysqlConnectionStatus {
  connected: boolean;
  message: string;
  database?: string;
  host?: string;
}

export interface MysqlTableCounts {
  users: number;
  school_years: number;
  sections: number;
  students: number;
  subjects: number;
  student_term_grades: number;
  attendance_scan_logs: number;
  system_settings: number;
}

export async function checkMysqlStatus(): Promise<MysqlConnectionStatus> {
  try {
    const res = await fetch('/api/mysql/health');
    return await res.json();
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Network error communicating with MySQL backend',
    };
  }
}

export async function initializeMysqlTables(): Promise<{ success: boolean; tablesCreated: string[]; error?: string }> {
  try {
    const res = await fetch('/api/mysql/init-schema', { method: 'POST' });
    return await res.json();
  } catch (err: any) {
    return { success: false, tablesCreated: [], error: err?.message || 'Failed to trigger schema initialization' };
  }
}

export async function fetchMysqlTableCounts(): Promise<MysqlTableCounts> {
  try {
    const res = await fetch('/api/mysql/counts');
    const data = await res.json();
    return data.counts || {};
  } catch {
    return {
      users: 0,
      school_years: 0,
      sections: 0,
      students: 0,
      subjects: 0,
      student_term_grades: 0,
      attendance_scan_logs: 0,
      system_settings: 0,
    };
  }
}

export async function executeMysqlMigration(payload: any): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    const res = await fetch('/api/mysql/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to migrate data to MySQL' };
  }
}

export async function getMysqlSections(schoolYear?: string) {
  const url = schoolYear ? `/api/mysql/sections?schoolYear=${encodeURIComponent(schoolYear)}` : '/api/mysql/sections';
  const res = await fetch(url);
  return await res.json();
}

export async function getMysqlSectionDetails(sectionId: string) {
  const res = await fetch(`/api/mysql/sections/${sectionId}`);
  return await res.json();
}

export async function postMysqlScanLog(log: any) {
  const res = await fetch('/api/mysql/attendance/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  return await res.json();
}
