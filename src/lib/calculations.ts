import { Student, Subject, TermNumber } from '../types';
import { DEFAULT_TERM_DATA } from '../constants';

export const transmuteGrade = (initial: number): number => {
 if (initial >= 99.50) return 100;
  if (initial >= 98.32) return 99;
  if (initial >= 97.14) return 98;
  if (initial >= 95.96) return 97;
  if (initial >= 94.78) return 96;
  if (initial >= 93.60) return 95;
  if (initial >= 92.42) return 94;
  if (initial >= 91.24) return 93;
  if (initial >= 90.06) return 92;
  if (initial >= 88.88) return 91;
  if (initial >= 87.70) return 90;
  if (initial >= 86.52) return 89;
  if (initial >= 85.34) return 88;
  if (initial >= 84.16) return 87;
  if (initial >= 82.98) return 86;
  if (initial >= 81.80) return 85;
  if (initial >= 80.62) return 84;
  if (initial >= 79.44) return 83;
  if (initial >= 78.26) return 82;
  if (initial >= 77.08) return 81;
  if (initial >= 75.90) return 80;
  if (initial >= 74.72) return 79;
  if (initial >= 73.54) return 78;
  if (initial >= 72.36) return 77;
  if (initial >= 71.18) return 76;
  if (initial >= 70.00) return 75;
  if (initial >= 65.34) return 74;
  if (initial >= 60.67) return 73;
  if (initial >= 56.01) return 72;
  if (initial >= 51.34) return 71;
  if (initial >= 46.67) return 70;
  if (initial >= 42.01) return 69;
  if (initial >= 37.34) return 68;
  if (initial >= 32.68) return 67;
  if (initial >= 28.01) return 66;
  if (initial >= 23.35) return 65;
  if (initial >= 18.68) return 64;
  if (initial >= 14.01) return 63;
  if (initial >= 9.35) return 62;
  if (initial >= 4.68) return 61;
  return 60;
};

export const calculateGrade = (student: Student, subject: Subject, term: TermNumber, refStudent?: Student) => {
  const data = student.grades?.[subject.id]?.[term] || JSON.parse(JSON.stringify(DEFAULT_TERM_DATA));
  const refData = refStudent?.grades?.[subject.id]?.[term] || data;

  if (data.manualFinalGrade && data.manualFinalGrade > 0) {
     return {
        ww: { total: 0, ps: 0, ws: 0, max: 0 },
        pt: { total: 0, ps: 0, ws: 0, max: 0 },
        ta: { total: 0, ps: 0, ws: 0, max: 0 },
        initial: data.manualFinalGrade,
        final: data.manualFinalGrade,
        hasData: true
     };
  }

  const calc = (cat: string, weight: number) => {
    const component = (data[cat as keyof typeof data] || { scores: [], maxScores: [] }) as any;
    const refComponent = (refData[cat as keyof typeof refData] || { scores: [], maxScores: [] }) as any;

    const compMax = component.maxScores || [];
    const refMax = refComponent.maxScores || [];
    const maxScoresArr: any[] = (compMax.some((x: any) => Number(x) > 0) ? compMax : refMax) || [];
    const scoresArr: any[] = component.scores || [];

    let total = 0;
    let max = 0;
    const len = Math.max(maxScoresArr.length, scoresArr.length);
    for (let i = 0; i < len; i++) {
      const hps = Number(maxScoresArr[i]) || 0;
      if (hps > 0) {
        max += hps;
        total += Number(scoresArr[i]) || 0;
      }
    }

    const ps = max === 0 ? 0 : (total / max) * 100;
    const ws = ps * (weight / 100);
    return { total, ps, ws, max };
  };

  const ww = calc('writtenWorks', subject.wwWeight);
  const pt = calc('performanceTasks', subject.ptWeight);

  const s1 = Number(data.summativeTests?.scores?.[0]) || 0;
  const m1 = Number(refData.summativeTests?.maxScores?.[0]) || Number(data.summativeTests?.maxScores?.[0]) || 30;

  const s2 = Number(data.summativeTests?.scores?.[1]) || 0;
  const m2 = Number(refData.summativeTests?.maxScores?.[1]) || Number(data.summativeTests?.maxScores?.[1]) || 30;

  const se = Number(data.termExam?.score) || 0;
  const me = Number(refData.termExam?.maxScore) || Number(data.termExam?.maxScore) || 60;

  const ws1 = m1 > 0 ? (s1 / m1) * 30 : 0;
  const ws2 = m2 > 0 ? (s2 / m2) * 30 : 0;
  const wse = me > 0 ? (se / me) * 40 : 0;

  const taTotal = s1 + s2 + se;
  const taMax = m1 + m2 + me;
  const taPs = ws1 + ws2 + wse;
  const taWs = taPs * (subject.taWeight / 100);

  const rawGrade = ww.ws + pt.ws + taWs;
  const transmutedGrade = transmuteGrade(rawGrade);
  const computedFinal = subject.isZeroBasedGrading ? Math.round(rawGrade) : transmutedGrade;

  const hasData = ww.max > 0 || pt.max > 0 || taMax > 0;

  return {
    ww,
    pt,
    ta: { total: taTotal, ps: taPs, ws: taWs, max: taMax },
    initial: rawGrade,
    final: hasData ? computedFinal : 0,
    hasData
  };
};
