import React, { useMemo } from 'react';
import { Printer, Download } from 'lucide-react';
import { Student, Section } from '../types';
import { formatStudentName } from '../utils';

interface AttendanceMonthlySummaryProps {
  mode: 'present' | 'absent';
  students: Student[];
  calendar: any[];
  schoolYear?: string;
  section?: Section;
}

const MONTH_ORDER = [
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
  'April',
  'May',
];

const DEFAULT_SUMMARY_MONTHS = [
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
  'April',
];

const MONTH_INDICES: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

const MONTH_ABBR: Record<string, string> = {
  June: 'JUN',
  July: 'JUL',
  August: 'AUG',
  September: 'SEP',
  October: 'OCT',
  November: 'NOV',
  December: 'DEC',
  January: 'JAN',
  February: 'FEB',
  March: 'MAR',
  April: 'APR',
  May: 'MAY',
};

const PHILIPPINE_HOLIDAYS = [
  '01-01',
  '04-09',
  '05-01',
  '06-12',
  '08-21',
  '11-01',
  '11-30',
  '12-25',
  '12-30',
];

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

const parseAttendanceNumericValue = (value: any): number => {
  if (value === true || value === 1 || value === '1' || value === 'present' || value === 'P') {
    return 1;
  }
  if (value === 'half' || value === '0.5' || value === 0.5) {
    return 0.5;
  }
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 0;
};

const formatCountValue = (value: number | null): string => {
  if (value === null) return '';
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(1)));
};

export const AttendanceMonthlySummary: React.FC<AttendanceMonthlySummaryProps> = ({
  mode,
  students,
  calendar,
  schoolYear,
  section,
}) => {
  const effectiveSchoolYear = schoolYear || section?.schoolYear;

  const filteredCalendar = useMemo(() => {
    if (!calendar || calendar.length === 0) return [];
    if (!effectiveSchoolYear) return calendar;
    return calendar.filter((c) => c.schoolYear === effectiveSchoolYear);
  }, [calendar, effectiveSchoolYear]);

  const displayMonths = useMemo(() => {
    const monthSet = new Set<string>(DEFAULT_SUMMARY_MONTHS);
    filteredCalendar.forEach((c) => {
      const month = String(c.month || '').trim();
      if (month && MONTH_INDICES[month] !== undefined) {
        monthSet.add(month);
      }
    });
    return Array.from(monthSet).sort(
      (a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)
    );
  }, [filteredCalendar]);

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

  const monthDefinitions = useMemo(() => {
    const defs: Record<
      string,
      {
        year: number;
        monthIndex: number;
        validDays: { day: number; dateKey: string }[];
        hasRecordedAttendance: boolean;
        hasDailyRecords: boolean;
        hasFallbackAttendance: boolean;
      }
    > = {};

    displayMonths.forEach((month) => {
      const monthEntries = filteredCalendar
        .filter((c) => String(c.month || '').trim() === month)
        .sort((a, b) => (parseInt(a.term, 10) || 1) - (parseInt(b.term, 10) || 1));

      const monthIndex = MONTH_INDICES[month];
      const year =
        monthEntries.length > 0
          ? parseInt(monthEntries[0].year, 10) || new Date().getFullYear()
          : new Date().getFullYear();

      const validDays: { day: number; dateKey: string }[] = [];

      if (monthEntries.length > 0 && monthIndex !== undefined) {
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const allWeekdaysNoNationalHoliday: number[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, monthIndex, day);
          const dayOfWeek = date.getDay();
          const monthNum = String(monthIndex + 1).padStart(2, '0');
          const dayNum = String(day).padStart(2, '0');
          const dateId = `${monthNum}-${dayNum}`;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isHoliday = PHILIPPINE_HOLIDAYS.includes(dateId);
          if (!isWeekend && !isHoliday) {
            allWeekdaysNoNationalHoliday.push(day);
          }
        }

        const unionDays = new Set<number>();
        monthEntries.forEach((entry) => {
          const term = (entry.term || '1').toString();
          const openingDate = parseInt(entry.openingDate || '1', 10) || 1;
          const closingDate = parseInt(entry.closingDate || '31', 10) || 31;
          const localHolidays = new Set<number>(
            Array.isArray(entry.localHolidays)
              ? entry.localHolidays.map(Number).filter(Number.isFinite)
              : []
          );
          const hasManualCoverage =
            openingDate !== 1 || (closingDate !== 31 && closingDate !== daysInMonth);

          let entryValidDays: number[] = [];
          if (hasManualCoverage) {
            entryValidDays = allWeekdaysNoNationalHoliday.filter(
              (d) => d >= openingDate && d <= closingDate
            );
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
            const daysToTake =
              parseInt(entry.days, 10) || allWeekdaysNoNationalHoliday.length;
            entryValidDays = allWeekdaysNoNationalHoliday.slice(
              startIndex,
              startIndex + daysToTake
            );
          }

          entryValidDays
            .filter((d) => !localHolidays.has(d))
            .forEach((d) => unionDays.add(d));
        });

        const monthNum = String(monthIndex + 1).padStart(2, '0');
        Array.from(unionDays)
          .sort((a, b) => a - b)
          .forEach((day) => {
            const dayNum = String(day).padStart(2, '0');
            validDays.push({
              day,
              dateKey: `${year}-${monthNum}-${dayNum}`,
            });
          });
      }

      // Determine if ANY student has recorded attendance for this month
      let hasDailyRecords = false;
      let hasFallbackAttendance = false;

      for (const student of sortedStudents) {
        const rawDaily = (student as any).dailyAttendance || {};
        const mergedDaily: Record<string, any> = {};
        if (rawDaily[month] && typeof rawDaily[month] === 'object') {
          Object.assign(mergedDaily, rawDaily[month]);
        }
        Object.keys(rawDaily).forEach((key) => {
          if (
            key.startsWith(`${month}_`) &&
            rawDaily[key] &&
            typeof rawDaily[key] === 'object'
          ) {
            Object.assign(mergedDaily, rawDaily[key]);
          }
        });

        if (
          Object.values(mergedDaily).some(
            (val) => parseAttendanceNumericValue(val) > 0
          )
        ) {
          hasDailyRecords = true;
        }

        const rawAtt = student.attendance || {};
        const matchingAttKeys = Object.keys(rawAtt).filter(
          (k) => k === month || k.startsWith(`${month}_`)
        );
        for (const k of matchingAttKeys) {
          const entry = rawAtt[k];
          if (entry && ((Number(entry.present) || 0) > 0 || (Number(entry.absent) || 0) > 0)) {
            hasFallbackAttendance = true;
          }
        }

        if (hasDailyRecords && hasFallbackAttendance) break;
      }

      defs[month] = {
        year,
        monthIndex,
        validDays,
        hasRecordedAttendance: hasDailyRecords || hasFallbackAttendance,
        hasDailyRecords,
        hasFallbackAttendance,
      };
    });

    return defs;
  }, [displayMonths, filteredCalendar, sortedStudents]);

  const tableRows = useMemo(() => {
    return sortedStudents.map((student) => {
      const firstAttendance = normalizeDateKey(
        (student as any).dateOfFirstAttendance ?? (student as any).transferInDate
      );
      const exitDate = normalizeDateKey((student as any).dropoutDate);
      const isExited =
        student.status === 'Dropped Out' || student.status === 'Transferred Out';

      const valuesByMonth: Record<string, number | null> = {};

      displayMonths.forEach((month) => {
        const def = monthDefinitions[month];
        if (!def || !def.hasRecordedAttendance) {
          valuesByMonth[month] = null;
          return;
        }

        const rawDaily = (student as any).dailyAttendance || {};
        const mergedDaily: Record<string, any> = {};
        if (rawDaily[month] && typeof rawDaily[month] === 'object') {
          Object.assign(mergedDaily, rawDaily[month]);
        }
        Object.keys(rawDaily).forEach((key) => {
          if (
            key.startsWith(`${month}_`) &&
            rawDaily[key] &&
            typeof rawDaily[key] === 'object'
          ) {
            Object.assign(mergedDaily, rawDaily[key]);
          }
        });

        if (def.validDays.length > 0 && def.hasDailyRecords) {
          // Check which valid school days apply to this learner
          const activeDaysForStudent = def.validDays.filter(({ dateKey }) => {
            if (firstAttendance && dateKey < firstAttendance) return false;
            if (isExited && exitDate && dateKey >= exitDate) return false;
            return true;
          });

          if (activeDaysForStudent.length === 0) {
            valuesByMonth[month] = null;
            return;
          }

          let presentCount = 0;
          activeDaysForStudent.forEach(({ day }) => {
            presentCount += parseAttendanceNumericValue(mergedDaily[day]);
          });

          if (mode === 'present') {
            valuesByMonth[month] = presentCount;
          } else {
            valuesByMonth[month] = Math.max(
              0,
              activeDaysForStudent.length - presentCount
            );
          }
          return;
        }

        if (def.hasDailyRecords) {
          let presentCount = 0;
          Object.values(mergedDaily).forEach((val) => {
            presentCount += parseAttendanceNumericValue(val);
          });
          if (mode === 'present') {
            valuesByMonth[month] = presentCount;
          } else {
            valuesByMonth[month] = 0;
          }
          return;
        }

        // Fallback to student.attendance totals if dailyAttendance wasn't used
        const rawAtt = student.attendance || {};
        const matchingKeys = Object.keys(rawAtt).filter(
          (k) => k === month || k.startsWith(`${month}_`)
        );
        if (matchingKeys.length === 0) {
          valuesByMonth[month] = null;
          return;
        }

        let presentSum = 0;
        let absentSum = 0;
        matchingKeys.forEach((k) => {
          presentSum += Number(rawAtt[k]?.present) || 0;
          absentSum += Number(rawAtt[k]?.absent) || 0;
        });
        valuesByMonth[month] = mode === 'present' ? presentSum : absentSum;
      });

      return {
        student,
        displayName: formatStudentName(student),
        valuesByMonth,
      };
    });
  }, [sortedStudents, displayMonths, monthDefinitions, mode]);

  const handleExportCSV = () => {
    const headers = [
      "Learner's Name",
      ...displayMonths.map((m) => MONTH_ABBR[m] || m.slice(0, 3).toUpperCase()),
    ];
    const csvRows = [
      headers.join(','),
      ...tableRows.map((row) => {
        const escapedName = `"${row.displayName.replace(/"/g, '""')}"`;
        const cells = displayMonths.map((m) =>
          formatCountValue(row.valuesByMonth[m])
        );
        return [escapedName, ...cells].join(',');
      }),
    ];
    const blob = new Blob([csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const secName = (section?.name || 'Section').replace(/\s+/g, '_');
    link.download = `Attendance_Summary_${mode === 'present' ? 'Present' : 'Absent'}_${secName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <div className="relative flex items-center justify-center mb-6">
        <h3 className="text-center text-sm sm:text-base font-extrabold tracking-wide text-slate-800 uppercase">
          {mode === 'present' ? 'NUMBER OF DAYS PRESENT' : 'NUMBER OF DAYS ABSENT'}
        </h3>
        <div className="absolute right-0 flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handleExportCSV}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
            title="Print Summary"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {sortedStudents.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">
          No enrolled learners found for this section.
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-xs sm:text-[13px] text-slate-800">
            <thead>
              <tr className="bg-slate-50/90">
                <th className="border border-slate-300 px-3 py-2.5 text-left font-bold text-slate-700 min-w-[210px] sm:w-[240px]" />
                {displayMonths.map((month) => (
                  <th
                    key={month}
                    className="border border-slate-300 px-2 py-2.5 text-center font-bold uppercase tracking-wider text-slate-700 min-w-[54px]"
                  >
                    {MONTH_ABBR[month] || month.slice(0, 3).toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr
                  key={row.student.id}
                  className="bg-white hover:bg-slate-50/60 transition-colors"
                >
                  <td className="border border-slate-300 px-3 py-2 text-left font-medium text-slate-800 whitespace-nowrap">
                    {row.displayName}
                  </td>
                  {displayMonths.map((month) => {
                    const value = row.valuesByMonth[month];
                    return (
                      <td
                        key={`${row.student.id}-${month}`}
                        className="border border-slate-300 px-2 py-2 text-center text-slate-700 tabular-nums"
                      >
                        {formatCountValue(value)}
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
  );
};
