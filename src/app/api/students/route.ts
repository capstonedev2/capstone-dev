import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const departmentAliases: Record<string, string[]> = {
  ict: ['ICT', 'IT', 'BSIT', 'Information Technology'],
  it: ['ICT', 'IT', 'BSIT', 'Information Technology'],
  bsit: ['ICT', 'IT', 'BSIT', 'Information Technology'],
  'information technology': ['ICT', 'IT', 'BSIT', 'Information Technology'],
  met: ['MET', 'BSMET', 'Mechanical Engineering Technology', 'Manufacturing Eng. Tech.'],
  bsmet: ['MET', 'BSMET', 'Mechanical Engineering Technology', 'Manufacturing Eng. Tech.'],
  tcm: ['TCM', 'BSTCM', 'Technology Communication Management'],
  bstcm: ['TCM', 'BSTCM', 'Technology Communication Management'],
  esm: ['ESM', 'BSESM', 'Environmental and Safety Management', 'Energy Systems & Mgmt.'],
  bsesm: ['ESM', 'BSESM', 'Environmental and Safety Management', 'Energy Systems & Mgmt.'],
  name: ['NAME', 'BSNAME', 'Naval Architecture and Marine Engineering'],
  bsname: ['NAME', 'BSNAME', 'Naval Architecture and Marine Engineering']
};

function getDepartmentSearchTerms(value: string | null) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return [];
  }

  const key = normalized.toLowerCase();
  return Array.from(new Set([normalized, ...(departmentAliases[key] || [])]));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const departmentTerms = getDepartmentSearchTerms(department);

    const whereClause: any = { role: 'STUDENT' };
    if (departmentTerms.length) {
      whereClause.OR = departmentTerms.map((term) => ({
        department: {
          contains: term,
          mode: 'insensitive'
        }
      }));
    }

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
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
