import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    const whereClause: any = { role: 'STUDENT' };
    if (department) {
      whereClause.department = {
        contains: department,
        mode: 'insensitive'
      };
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
