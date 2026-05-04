import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const newGroup = await prisma.group.create({
      data: {
        userId,
        code,
        title,
        projectTitle,
        dept,
        department,
        students,
        members: students.length,
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
    const { id, students, title } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing group id' }, { status: 400 });
    }

    const updateData: any = {};
    if (students) {
      updateData.students = students;
      updateData.members = students.length;
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
