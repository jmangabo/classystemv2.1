import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Search,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Student, Section, AttendanceScanLog } from '../types';
import { formatStudentName } from '../utils';

interface DailyAttendanceDashboardProps {
  students: Student[];
  calendar: any[];
  schoolYear?: string;
  section?: Section;
  scanLogs?: AttendanceScanLog[];
  onUpdateAttendance?: (
    studentId: string,
    monthKey: string,
    day: number,
    present: boolean
  ) => void;
  onScanID?: () => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const PHILIPPINE_HOLIDAYS: Record<string, string> = {
  '01-01': "New Year's Day",
  '04-09': 'Araw ng Kagitingan',
  '05-01': 'Labor Day',
  '06-12': 'Independence Day',
  '08-21': 'Ninoy Aquino Day',
  '11-01': "All Saints' Day",
  '11-30': 'Bonifacio Day',
  '12-25': 'Christmas Day',
  '12-30': 'Rizal Day',
};

const getTodayDateString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const normalizeDateKey = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      return `${match[1]}-${String(Number(match[2])).padStart(2, '0')}-${String(Number(match[3])).padStart(2, '0')}`;
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    }
  }
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate();
    if (parsed && !Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    }
  }
  if (value?.seconds != null) {
    const parsed = new Date(Number(value.seconds) * 1000);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    }
  }
  return null;
};

export const DailyAttendanceDashboard: React.FC<DailyAttendanceDashboardProps> = ({
  students,
  calendar,
  schoolYear,
  section,
  scanLogs = [],
  onUpdateAttendance,
  onScanID,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'present' | 'absent' | 'unmarked'
  >('all');

  const effectiveSchoolYear = schoolYear || section?.schoolYear;

  const filteredCalendar = useMemo(() => {
    if (!calendar || calendar.length === 0) return [];
    if (!effectiveSchoolYear) return calendar;
    return calendar.filter((c) => c.schoolYear === effectiveSchoolYear);
  }, [calendar, effectiveSchoolYear]);

  const selectedDateInfo = useMemo(() => {
    const [yStr, mStr, dStr] = selectedDate.split('-');
    const year = Number(yStr) || new Date().getFullYear();
    const monthIndex = (Number(mStr) || 1) - 1;
    const day = Number(dStr) || 1;
    const monthName = MONTH_NAMES[monthIndex] || 'June';
    const dateObj = new Date(year, monthIndex, day);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const mmdd = `${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const nationalHoliday = PHILIPPINE_HOLIDAYS[mmdd] || null;

    // Resolve matching calendar entry / monthKey
    const monthEntries = filteredCalendar
      .filter((c) => c.month === monthName && Number(c.year) === year)
      .sort((a, b) => (parseInt(a.term, 10) || 1) - (parseInt(b.term, 10) || 1));

    let matchedMonthKey: string | null = null;
    let isLocalHoliday = false;
    let isSchoolDay = false;
    let termLabel: string | null = null;

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const allSchoolDays: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, monthIndex, d);
      const dow = dt.getDay();
      const dId = `${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (dow !== 0 && dow !== 6 && !PHILIPPINE_HOLIDAYS[dId]) {
        allSchoolDays.push(d);
      }
    }

    for (const entry of monthEntries) {
      const term = (entry.term || '1').toString();
      const openingDate = parseInt(entry.openingDate || '1', 10) || 1;
      const closingDate = parseInt(entry.closingDate || '31', 10) || 31;
      const localHolidays: number[] = Array.isArray(entry.localHolidays)
        ? entry.localHolidays.map(Number)
        : [];
      const hasManualCoverage =
        openingDate !== 1 || (closingDate !== 31 && closingDate !== daysInMonth);

      let validDays: number[] = [];
      if (hasManualCoverage) {
        validDays = allSchoolDays.filter((d) => d >= openingDate && d <= closingDate);
      } else {
        const currentTermNum = parseInt(term, 10) || 1;
        let startIndex = 0;
        for (const e of monthEntries) {
          if ((parseInt(e.term, 10) || 1) < currentTermNum) {
            startIndex += parseInt(e.days, 10) || 0;
          } else {
            break;
          }
        }
        const daysToTake = parseInt(entry.days, 10) || allSchoolDays.length;
        validDays = allSchoolDays.slice(startIndex, startIndex + daysToTake);
      }

      if (localHolidays.includes(day)) {
        isLocalHoliday = true;
      }

      if (validDays.includes(day) && !localHolidays.includes(day)) {
        matchedMonthKey = `${monthName}_${term}`;
        isSchoolDay = true;
        termLabel = `Term ${term}`;
        break;
      }
    }

    if (!matchedMonthKey && monthEntries.length > 0) {
      const firstTerm = (monthEntries[0].term || '1').toString();
      matchedMonthKey = `${monthName}_${firstTerm}`;
    }

    const formattedLabel = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      dateKey: selectedDate,
      year,
      monthIndex,
      monthName,
      day,
      isWeekend,
      nationalHoliday,
      isLocalHoliday,
      isSchoolDay,
      matchedMonthKey,
      termLabel,
      formattedLabel,
      hasCalendarEntries: monthEntries.length > 0,
    };
  }, [selectedDate, filteredCalendar]);

  const sortedStudents = useMemo(() => {
    const activeList = students.filter((s) => s.status !== 'Dropped Out');
    const male = activeList
      .filter((s) => s.sex?.toLowerCase() === 'male')
      .sort((a, b) => formatStudentName(a).localeCompare(formatStudentName(b)));
    const female = activeList
      .filter((s) => s.sex?.toLowerCase() === 'female')
      .sort((a, b) => formatStudentName(a).localeCompare(formatStudentName(b)));
    const other = activeList
      .filter(
        (s) =>
          s.sex?.toLowerCase() !== 'male' && s.sex?.toLowerCase() !== 'female'
      )
      .sort((a, b) => formatStudentName(a).localeCompare(formatStudentName(b)));
    return [...male, ...female, ...other];
  }, [students]);

  const scanLogsByStudent = useMemo(() => {
    const map: Record<string, { firstIn?: string; lastOut?: string; scanCount: number }> = {};
    const dateLogs = scanLogs
      .filter(
        (l) =>
          l.scanDate === selectedDate &&
          (!section?.id || !l.sectionId || l.sectionId === section.id)
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    dateLogs.forEach((log) => {
      const key = log.studentId || log.lrn;
      if (!key) return;
      if (!map[key]) {
        map[key] = { scanCount: 0 };
      }
      map[key].scanCount += 1;
      if (log.scanType === 'IN' && !map[key].firstIn) {
        map[key].firstIn = log.scanTime;
      }
      if (log.scanType === 'OUT') {
        map[key].lastOut = log.scanTime;
      }
    });
    return map;
  }, [scanLogs, selectedDate, section?.id]);

  const studentRows = useMemo(() => {
    const { monthName, day, matchedMonthKey, dateKey } = selectedDateInfo;

    return sortedStudents.map((student) => {
      const firstAttendance = normalizeDateKey(
        (student as any).dateOfFirstAttendance ?? (student as any).transferInDate
      );
      const exitDate = normalizeDateKey((student as any).dropoutDate);
      const isExited =
        student.status === 'Dropped Out' || student.status === 'Transferred Out';

      const isEnrolledOnDate =
        (!firstAttendance || dateKey >= firstAttendance) &&
        (!isExited || !exitDate || dateKey < exitDate);

      const rawDaily = (student as any).dailyAttendance || {};
      let rawVal: any = undefined;

      if (matchedMonthKey && rawDaily[matchedMonthKey]?.[day] !== undefined) {
        rawVal = rawDaily[matchedMonthKey][day];
      } else if (rawDaily[monthName]?.[day] !== undefined) {
        rawVal = rawDaily[monthName][day];
      } else {
        const matchingKey = Object.keys(rawDaily).find(
          (k) =>
            k.startsWith(`${monthName}_`) &&
            rawDaily[k] &&
            rawDaily[k][day] !== undefined
        );
        if (matchingKey) {
          rawVal = rawDaily[matchingKey][day];
        }
      }

      let status: 'present' | 'absent' | 'unmarked' | 'inactive' = 'unmarked';
      if (!isEnrolledOnDate) {
        status = 'inactive';
      } else if (
        rawVal === true ||
        rawVal === 1 ||
        rawVal === '1' ||
        rawVal === 'present' ||
        rawVal === 'P' ||
        rawVal === 0.5 ||
        rawVal === '0.5' ||
        rawVal === 'half'
      ) {
        status = 'present';
      } else if (rawVal === false || rawVal === 0 || rawVal === '0' || rawVal === 'absent' || rawVal === 'A') {
        status = 'absent';
      } else {
        status = 'unmarked';
      }

      const scanInfo =
        scanLogsByStudent[student.id] ||
        (student.lrn ? scanLogsByStudent[student.lrn] : undefined);

      return {
        student,
        displayName: formatStudentName(student),
        status,
        scanInfo,
      };
    });
  }, [sortedStudents, selectedDateInfo, scanLogsByStudent]);

  const stats = useMemo(() => {
    const enrolledRows = studentRows.filter((r) => r.status !== 'inactive');
    const presentRows = enrolledRows.filter((r) => r.status === 'present');
    const absentRows = enrolledRows.filter((r) => r.status === 'absent');
    const unmarkedRows = enrolledRows.filter((r) => r.status === 'unmarked');

    const countSex = (rows: typeof enrolledRows) => ({
      total: rows.length,
      male: rows.filter((r) => r.student.sex?.toLowerCase() === 'male').length,
      female: rows.filter((r) => r.student.sex?.toLowerCase() === 'female').length,
    });

    const totalStats = countSex(enrolledRows);
    const presentStats = countSex(presentRows);
    const absentStats = countSex([...absentRows, ...unmarkedRows]);
    const explicitAbsentStats = countSex(absentRows);
    const unmarkedStats = countSex(unmarkedRows);

    const attendanceRate =
      totalStats.total > 0
        ? Math.round((presentStats.total / totalStats.total) * 1000) / 10
        : 0;

    const scansToday = (
      Object.values(scanLogsByStudent) as Array<{
        firstIn?: string;
        lastOut?: string;
        scanCount: number;
      }>
    ).reduce((sum, item) => sum + item.scanCount, 0);

    return {
      totalStats,
      presentStats,
      absentStats,
      explicitAbsentStats,
      unmarkedStats,
      attendanceRate,
      scansToday,
    };
  }, [studentRows, scanLogsByStudent]);

  const filteredRows = useMemo(() => {
    return studentRows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = row.displayName.toLowerCase().includes(q);
        const matchLrn = (row.student.lrn || '').toLowerCase().includes(q);
        if (!matchName && !matchLrn) return false;
      }
      return true;
    });
  }, [studentRows, statusFilter, searchQuery]);

  const handleToggleStudent = (studentId: string, currentlyPresent: boolean) => {
    if (!onUpdateAttendance || !selectedDateInfo.matchedMonthKey) return;
    onUpdateAttendance(
      studentId,
      selectedDateInfo.matchedMonthKey,
      selectedDateInfo.day,
      !currentlyPresent
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Calendar size={15} className="text-indigo-600 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || getTodayDateString())}
              className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(getTodayDateString())}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="font-bold text-slate-800">{selectedDateInfo.formattedLabel}</span>
            {selectedDateInfo.nationalHoliday ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                Holiday: {selectedDateInfo.nationalHoliday}
              </span>
            ) : selectedDateInfo.isLocalHoliday ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                Local Holiday / Suspension
              </span>
            ) : selectedDateInfo.isWeekend ? (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
                Weekend
              </span>
            ) : selectedDateInfo.isSchoolDay ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                School Day{selectedDateInfo.termLabel ? ` • ${selectedDateInfo.termLabel}` : ''}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 font-semibold">
                Not in School Calendar
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onScanID && (
            <button
              type="button"
              onClick={onScanID}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <QrCode size={14} />
              <span>Scan Learner ID</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Enrolled
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 tabular-nums">
            {stats.totalStats.total}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            M: <span className="font-semibold text-slate-700">{stats.totalStats.male}</span>
            {' • '}
            F: <span className="font-semibold text-slate-700">{stats.totalStats.female}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Present
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tabular-nums">
            {stats.presentStats.total}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            M: <span className="font-semibold text-slate-700">{stats.presentStats.male}</span>
            {' • '}
            F: <span className="font-semibold text-slate-700">{stats.presentStats.female}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Absent / Unmarked
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tabular-nums">
            {stats.absentStats.total}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            M: <span className="font-semibold text-slate-700">{stats.absentStats.male}</span>
            {' • '}
            F: <span className="font-semibold text-slate-700">{stats.absentStats.female}</span>
            {stats.unmarkedStats.total > 0 && (
              <span className="ml-1 text-slate-400">
                ({stats.unmarkedStats.total} unmarked)
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Attendance Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800 tabular-nums">
              {stats.attendanceRate}%
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {stats.scansToday} QR {stats.scansToday === 1 ? 'scan' : 'scans'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, stats.attendanceRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Learner Daily Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Daily Learner Status
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              ({filteredRows.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search learner or LRN..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
              />
            </div>

            <div className="flex items-center border border-slate-200 rounded-lg bg-white p-0.5 text-xs font-semibold">
              {(['all', 'present', 'absent', 'unmarked'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                    statusFilter === key
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-[13px] text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="px-4 py-2.5 text-left font-bold w-12">#</th>
                <th className="px-4 py-2.5 text-left font-bold">Learner&apos;s Name</th>
                <th className="px-4 py-2.5 text-center font-bold w-24">Sex</th>
                <th className="px-4 py-2.5 text-center font-bold w-32">Status</th>
                <th className="px-4 py-2.5 text-center font-bold w-32">QR Time In</th>
                <th className="px-4 py-2.5 text-center font-bold w-32">QR Time Out</th>
                {onUpdateAttendance && (
                  <th className="px-4 py-2.5 text-center font-bold w-32">Quick Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={onUpdateAttendance ? 7 : 6}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No learners match the current filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const canToggle =
                    Boolean(onUpdateAttendance) &&
                    selectedDateInfo.isSchoolDay &&
                    Boolean(selectedDateInfo.matchedMonthKey) &&
                    row.status !== 'inactive';

                  return (
                    <tr
                      key={row.student.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-slate-400 font-semibold tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                        <div>{row.displayName}</div>
                        {row.student.lrn && (
                          <div className="text-[11px] font-normal text-slate-400">
                            LRN: {row.student.lrn}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-600">
                        {row.student.sex || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {row.status === 'present' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle2 size={12} />
                            Present
                          </span>
                        ) : row.status === 'absent' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[11px]">
                            <XCircle size={12} />
                            Absent
                          </span>
                        ) : row.status === 'inactive' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 font-semibold text-[11px]">
                            Not Enrolled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-[11px]">
                            <Clock size={12} />
                            Unmarked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center tabular-nums text-slate-600">
                        {row.scanInfo?.firstIn ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <LogIn size={12} />
                            {row.scanInfo.firstIn}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center tabular-nums text-slate-600">
                        {row.scanInfo?.lastOut ? (
                          <span className="inline-flex items-center gap-1 text-sky-700 font-medium">
                            <LogOut size={12} />
                            {row.scanInfo.lastOut}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      {onUpdateAttendance && (
                        <td className="px-4 py-2.5 text-center">
                          {canToggle ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStudent(
                                  row.student.id,
                                  row.status === 'present'
                                )
                              }
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                                row.status === 'present'
                                  ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {row.status === 'present' ? 'Mark Absent' : 'Mark Present'}
                            </button>
                          ) : (
                            <span className="text-slate-300 text-[11px]">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
