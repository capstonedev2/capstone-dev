import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_GROUP_LIMIT = 100;
const MAX_GROUP_LIMIT = 200;

const groupListSelect = {
  id: true,
  userId: true,
  projectId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  code: true,
  title: true,
  projectTitle: true,
  dept: true,
  department: true,
  members: true,
  students: true,
  progress: true,
  statusLabel: true,
  statusClass: true,
  lifecycleStatus: true,
  milestone: true,
  currentMilestone: true,
  leader: true,
  finalDefenseResult: true,
  finalManuscriptApproved: true,
  allRequiredMilestonesCompleted: true,
  completedAt: true,
  finalScore: true,
  finalRecommendation: true,
  allowMemberSubmission: true
} as const;

function parsePositiveInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(max, Math.floor(parsed));
}

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
    const fields = searchParams.get('fields');
    const limit = parsePositiveInteger(searchParams.get('limit'), DEFAULT_GROUP_LIMIT, MAX_GROUP_LIMIT);
    const page = parsePositiveInteger(searchParams.get('page'), 1, Number.MAX_SAFE_INTEGER);
    const skip = (page - 1) * limit;

    const select = fields === 'students' ? { students: true } : groupListSelect;
    
    let groups;
    if (userId) {
      groups = await prisma.group.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select
      });
    } else if (studentName) {
      groups = await prisma.group.findMany({
        where: {
          students: {
            has: studentName
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select
      });
    } else if (department) {
      groups = await prisma.group.findMany({
        where: { department },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select
      });
    } else {
      groups = await prisma.group.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select
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

    const matchedUsers = await prisma.user.findMany({
      where: { 
        role: 'STUDENT',
        groupMembers: { none: {} } 
      },
      select: { id: true, name: true, displayName: true, firstName: true, lastName: true }
    });

    const membersToCreate: any[] = [];
    for (const studentName of parsedStudents) {
      const normalizedQuery = normalizeStudentName(studentName);
      const matchedUser = matchedUsers.find(u => {
        const candidateNames = [
          u.name,
          u.displayName,
          [u.firstName, u.lastName].filter(Boolean).join(' ')
        ].map(normalizeStudentName).filter(Boolean);
        return candidateNames.includes(normalizedQuery);
      });

      if (matchedUser) {
        membersToCreate.push({
          userId: matchedUser.id,
          isActive: true,
          role: normalizeStudentName(leader) === normalizedQuery ? 'LEADER' : 'MEMBER'
        });
      }
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
        projectId,
        ...(membersToCreate.length > 0 && {
          groupMembers: {
            create: membersToCreate
          }
        })
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
      leader?: string;
    } = {};
    if (body.leader !== undefined) {
      updateData.leader = body.leader;
    }
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

    if (updateData.students) {
      const matchedUsers = await prisma.user.findMany({
        where: { 
          role: 'STUDENT',
          groupMembers: { none: { groupId: { not: id } } }
        },
        select: { id: true, name: true, displayName: true, firstName: true, lastName: true }
      });

      const leaderQuery = normalizeStudentName(updateData.leader || body.leader || '');
      
      const newMembers = updateData.students.map(studentName => {
        const normalizedQuery = normalizeStudentName(studentName);
        const matchedUser = matchedUsers.find(u => {
          const candidateNames = [
            u.name,
            u.displayName,
            [u.firstName, u.lastName].filter(Boolean).join(' ')
          ].map(normalizeStudentName).filter(Boolean);
          return candidateNames.includes(normalizedQuery);
        });

        if (matchedUser) {
          return {
            userId: matchedUser.id,
            isActive: true,
            role: leaderQuery === normalizedQuery ? 'LEADER' : 'MEMBER'
          };
        }
        return null;
      }).filter(Boolean);

      const updatedGroup = await prisma.$transaction(async (tx) => {
        await tx.groupMember.deleteMany({ where: { groupId: id } });
        
        return tx.group.update({
          where: { id },
          data: {
            ...updateData,
            ...(newMembers.length > 0 && {
              groupMembers: {
                create: newMembers
              }
            })
          }
        });
      });
      return NextResponse.json(updatedGroup);
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
