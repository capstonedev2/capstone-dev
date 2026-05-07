import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizeStudentName(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLowerCase() : '';
}

function parseStudentNames(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const students: string[] = [];

  value.forEach((entry) => {
    if (typeof entry !== 'string') {
      return;
    }

    const student = entry.trim().replace(/\s+/g, ' ');
    const key = normalizeStudentName(student);
    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    students.push(student);
  });

  return students;
}

async function findAssignedStudents(students: string[], excludeGroupId?: string) {
  const requestedStudentKeys = new Set(students.map(normalizeStudentName).filter(Boolean));
  if (requestedStudentKeys.size === 0) {
    return [];
  }

  const groups = await prisma.group.findMany({
    where: excludeGroupId ? { id: { not: excludeGroupId } } : undefined,
    select: { students: true }
  });

  const assignedStudentKeys = new Set<string>();
  groups.forEach((group) => {
    group.students.forEach((student) => {
      const key = normalizeStudentName(student);
      if (requestedStudentKeys.has(key)) {
        assignedStudentKeys.add(key);
      }
    });
  });

  return students.filter((student) => assignedStudentKeys.has(normalizeStudentName(student)));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const studentName = searchParams.get('studentName');
    const department = searchParams.get('department');
    
    let groups;
    if (userId) {
      groups = await prisma.group.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } else if (studentName) {
      groups = await prisma.group.findMany({
        where: {
          students: {
            has: studentName
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (department) {
      groups = await prisma.group.findMany({
        where: { department },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      groups = await prisma.group.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      code,
      title,
      projectTitle,
      dept,
      department,
      students,
      leader,
      statusLabel,
      statusClass,
      projectId
    } = body;

    const parsedStudents = parseStudentNames(students);
    if (parsedStudents.length === 0) {
      return NextResponse.json({ error: 'Select at least one student before creating a group.' }, { status: 400 });
    }

    const assignedStudents = await findAssignedStudents(parsedStudents);
    if (assignedStudents.length > 0) {
      return NextResponse.json(
        { error: 'One or more selected students already belong to a group.', students: assignedStudents },
        { status: 409 }
      );
    }

    const newGroup = await prisma.group.create({
      data: {
        userId,
        code,
        title,
        projectTitle,
        dept,
        department,
        students: parsedStudents,
        members: parsedStudents.length,
        leader,
        statusLabel,
        statusClass,
        projectId
      }
    });
    
    return NextResponse.json(newGroup, { status: 201 });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, students } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing group id' }, { status: 400 });
    }

    const updateData: {
      students?: string[];
      members?: number;
      title?: string;
      projectTitle?: string;
      allowMemberSubmission?: boolean;
    } = {};
    if (Object.prototype.hasOwnProperty.call(body, 'students')) {
      const parsedStudents = parseStudentNames(students);
      const assignedStudents = await findAssignedStudents(parsedStudents, id);

      if (assignedStudents.length > 0) {
        return NextResponse.json(
          { error: 'One or more selected students already belong to a group.', students: assignedStudents },
          { status: 409 }
        );
      }

      updateData.students = parsedStudents;
      updateData.members = parsedStudents.length;
    }
    if (body.title !== undefined) {
      updateData.title = body.title;
    }
    if (body.projectTitle !== undefined) {
      updateData.projectTitle = body.projectTitle;
    }
    if (body.allowMemberSubmission !== undefined) {
      updateData.allowMemberSubmission = body.allowMemberSubmission;
    }

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}
