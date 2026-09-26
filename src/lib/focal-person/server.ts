import { UserRole } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { cleanDepartment, resolveDepartment } from '@/lib/department-scope';
import { HttpError } from '@/lib/utils';
import type { FocalDepartment } from './types';

/**
 * Shared by the /api/focal-person/* routes: the signed-in user must be a Research Focal Person, and
 * their department is ALWAYS the one on their own account. These routes take no department parameter.
 */
export async function requireFocalDepartment(request: Request) {
  const user = await requireAuthenticatedUser(request, [UserRole.FOCAL_PERSON]);
  const departmentText = cleanDepartment(user.department);

  if (!departmentText) {
    throw new HttpError('Your account is not linked to a department yet. Ask the System Administrator to set it.', 409);
  }

  const known = resolveDepartment(departmentText);
  const department: FocalDepartment = known
    ? { id: known.code, shortName: known.code, name: known.name }
    : { id: departmentText, shortName: departmentText, name: departmentText };

  return { user, department, departmentText };
}

type Person = { name: string; displayName: string | null; firstName: string | null; lastName: string | null } | null | undefined;

export function personName(person: Person) {
  if (!person) return '';
  return person.displayName || [person.firstName, person.lastName].filter(Boolean).join(' ') || person.name;
}
