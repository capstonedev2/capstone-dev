/**
 * Pure term/date helpers for the focal person module (no data access; used by both the pages and
 * GET /api/focal-person/overview). Semester windows: 1st Sem Aug–Dec, 2nd Sem Jan–May, Summer Jun–Jul.
 * A school year "2026–2027" runs from 1st Sem (Aug 2026) to Summer (Jun–Jul 2027).
 */

import type { ProjectStage, Semester } from './types';

export const SEMESTER_LABELS: Record<Semester, string> = {
  FIRST: '1st Sem',
  SECOND: '2nd Sem',
  SUMMER: 'Summer'
};

export const SEMESTER_ORDER: Semester[] = ['FIRST', 'SECOND', 'SUMMER'];

export const STAGE_LABELS: Record<ProjectStage, string> = {
  concept: 'Concept',
  proposal: 'Proposal',
  development: 'Development',
  pre_final: 'Pre-final defense',
  final: 'Final defense',
  completed: 'Completed'
};

export type Term = { startYear: number; semester: Semester };

const pad = (value: number) => String(value).padStart(2, '0');

/** Local-date `YYYY-MM-DD` (no timezone shift). */
export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function schoolYearLabel(startYear: number) {
  return `${startYear}–${startYear + 1}`;
}

export function schoolYearId(startYear: number) {
  return `ay-${startYear}-${startYear + 1}`;
}

/** "2026–2027" / "ay-2026-2027" → 2026 */
export function startYearFromAcademicYear(labelOrId: string) {
  const match = labelOrId.match(/(\d{4})/);
  return match ? Number(match[1]) : new Date().getFullYear();
}

/** The term a date falls in. Aug–Dec → 1st Sem of that year; Jan–May → 2nd Sem; Jun–Jul → Summer. */
export function termForDate(date: Date): Term {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (month >= 8) return { startYear: year, semester: 'FIRST' };
  if (month <= 5) return { startYear: year - 1, semester: 'SECOND' };
  return { startYear: year - 1, semester: 'SUMMER' };
}

export function termLabel(semester: Semester, academicYearLabel: string) {
  return `${SEMESTER_LABELS[semester]} ${academicYearLabel}`;
}

export function formatDate(dateKey: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Date(`${dateKey.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', options);
}

/** School year id ("ay-2026-2027") that contains `date`. */
export function currentAcademicYearId(date = new Date()) {
  return schoolYearId(termForDate(date).startYear);
}
