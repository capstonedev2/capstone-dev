import { type Prisma, UserRole } from '@/generated/prisma/client';

/**
 * Department matching and server-side department scoping.
 *
 * Departments are stored as free text (User.department, Group.department / Group.dept,
 * Project.departmentId), and the same program appears under several spellings: "BSIT", "ICT", and
 * "IT" are all one department. Every department check goes through this file so they all agree.
 *
 * Matching is exact (case-insensitive) against a department's known spellings. It used to be a
 * substring match, which let "IT" also match "Naval Arch-it-ecture".
 */

export type DepartmentCode = 'BSIT' | 'BSMET' | 'BSTCM' | 'BSESM' | 'BSNAME';

export type DepartmentInfo = {
  code: DepartmentCode;
  name: string;
  /** Every spelling stored for this department, including the code itself. */
  aliases: string[];
};

export const DEPARTMENTS: DepartmentInfo[] = [
  { code: 'BSIT', name: 'Information Technology', aliases: ['BSIT', 'ICT', 'IT', 'Information Technology'] },
  {
    code: 'BSMET',
    name: 'Manufacturing Engineering Technology',
    aliases: ['BSMET', 'MET', 'Mechanical Engineering Technology', 'Manufacturing Eng. Tech.', 'Manufacturing Engineering Technology']
  },
  { code: 'BSTCM', name: 'Technology Communication Management', aliases: ['BSTCM', 'TCM', 'Technology Communication Management'] },
  {
    code: 'BSESM',
    name: 'Energy Systems & Management',
    aliases: ['BSESM', 'ESM', 'Environmental and Safety Management', 'Energy Systems & Mgmt.', 'Energy Systems & Management']
  },
  { code: 'BSNAME', name: 'Naval Architecture & Marine Engineering', aliases: ['BSNAME', 'NAME', 'Naval Architecture and Marine Engineering'] }
];

/** Roles that see every department. Everyone else is limited to their own department. */
export const GLOBAL_DEPARTMENT_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.SYSTEM_ADMIN,
  UserRole.RESEARCH_HEAD,
  UserRole.TECH_TRANSFER,
  UserRole.LIBRARY
]);

/** Trims and drops a trailing " Department" / " Office" ("BSIT Department" → "BSIT"). */
export function cleanDepartment(value?: string | null) {
  return String(value || '')
    .trim()
    .replace(/\s+(Department|Office)$/i, '')
    .trim();
}

/** The known department for any stored spelling, or null when it isn't one of the programs. */
export function resolveDepartment(value?: string | null): DepartmentInfo | null {
  const key = cleanDepartment(value).toLowerCase();
  if (!key) return null;
  return DEPARTMENTS.find((department) => department.aliases.some((alias) => alias.toLowerCase() === key)) ?? null;
}

/** Every stored spelling that means the same department as `value` (just `value` if unknown). */
export function getDepartmentSearchTerms(value?: string | null): string[] {
  const cleaned = cleanDepartment(value);
  if (!cleaned) return [];
  const known = resolveDepartment(cleaned);
  return Array.from(new Set(known ? [cleaned, ...known.aliases] : [cleaned]));
}

/** True when both values name the same department (alias-aware, case-insensitive). */
export function isSameDepartment(a?: string | null, b?: string | null) {
  const left = cleanDepartment(a);
  const right = cleanDepartment(b);
  if (!left || !right) return false;
  const knownLeft = resolveDepartment(left);
  const knownRight = resolveDepartment(right);
  if (knownLeft || knownRight) return knownLeft?.code === knownRight?.code;
  return left.toLowerCase() === right.toLowerCase();
}

function equalsAny(terms: string[]) {
  // Also accept the "<term> Department" spelling that cleanDepartment strips.
  return terms.flatMap((term) => [term, `${term} Department`]).map((term) => ({ equals: term, mode: 'insensitive' as const }));
}

/** Groups belonging to a department (Group.department or Group.dept). Matches nothing for an empty value. */
export function groupDepartmentWhere(value?: string | null): Prisma.GroupWhereInput {
  const conditions = equalsAny(getDepartmentSearchTerms(value));
  if (!conditions.length) return { id: { in: [] } };
  return { OR: conditions.flatMap((condition) => [{ department: condition }, { dept: condition }]) };
}

/** Projects belonging to a department (Project.departmentId or the project's group). */
export function projectDepartmentWhere(value?: string | null): Prisma.ProjectWhereInput {
  const conditions = equalsAny(getDepartmentSearchTerms(value));
  if (!conditions.length) return { id: { in: [] } };
  return {
    OR: [...conditions.map((condition) => ({ departmentId: condition })), { group: groupDepartmentWhere(value) }]
  };
}

/** Users whose own department is `value` (User.department). */
export function userDepartmentWhere(value?: string | null): Prisma.UserWhereInput {
  const conditions = equalsAny(getDepartmentSearchTerms(value));
  if (!conditions.length) return { id: { in: [] } };
  return { OR: conditions.map((condition) => ({ department: condition })) };
}

/**
 * The department a request is limited to, decided from the signed-in user (never from the query).
 * - Global roles: `requested` (a filter they chose), or null for all departments.
 * - Research Focal Person: always their own department; `deny` when their account has none.
 * - Other roles: their own department. Without one they keep the old behavior of using the
 *   requested filter, so existing accounts that were never given a department aren't cut off.
 */
export function resolveDepartmentScope(
  user: { role: UserRole; department?: string | null },
  requested?: string | null
): { department: string | null; global: boolean; deny: boolean } {
  if (GLOBAL_DEPARTMENT_ROLES.has(user.role)) {
    return { department: cleanDepartment(requested) || null, global: true, deny: false };
  }

  const own = cleanDepartment(user.department);
  if (user.role === UserRole.FOCAL_PERSON) {
    return { department: own || null, global: false, deny: !own };
  }

  return { department: own || cleanDepartment(requested) || null, global: false, deny: false };
}
