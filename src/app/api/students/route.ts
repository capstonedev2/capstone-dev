import { NextResponse } from 'next/server';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerAuthenticatedUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-logging';
import { resolveDepartmentScope, userDepartmentWhere } from '@/lib/department-scope';

const DEFAULT_STUDENT_LIMIT = 100;
const MAX_STUDENT_LIMIT = 200;

function parsePositiveInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(max, Math.floor(parsed));
}

async function handleGET(request: Request) {
  try {
    const user = await getServerAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedDepartment = searchParams.get('department');
    // The department boundary comes from the signed-in user, never from ?department=.
    const scope = resolveDepartmentScope(user, requestedDepartment);
    if (scope.deny) {
      return NextResponse.json([]);
    }
    const limit = parsePositiveInteger(searchParams.get('limit'), DEFAULT_STUDENT_LIMIT, MAX_STUDENT_LIMIT);
    const page = parsePositiveInteger(searchParams.get('page'), 1, Number.MAX_SAFE_INTEGER);
    const availableOnly = searchParams.get('availableOnly') === 'true';

    const whereClause: Prisma.UserWhereInput = {
      role: 'STUDENT',
      ...(scope.department ? userDepartmentWhere(scope.department) : {})
    };

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        studentId: true,
        department: true
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    if (availableOnly) {
      const allGroups = await prisma.group.findMany({
        select: { students: true }
      });
      
      const assignedNames = new Set(allGroups.flatMap(g => g.students.map(s => s.trim().toLowerCase())));
      
      const filtered = students.filter(student => !assignedNames.has(student.name.trim().toLowerCase()));
      return NextResponse.json(filtered);
    }
    
    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export const GET = withApiLogging('GET', '/api/students', handleGET);
