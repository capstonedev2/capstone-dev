
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';
import { UserRole } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request, [UserRole.ADVISER, UserRole.PANEL]);
    const userId = user.id;

    const evaluations = await prisma.evaluation.findMany({
      where: {
        evaluatorId: userId,
      },
      include: {
        project: {
          include: {
            group: {
              include: {
                groupMembers: {
                  include: { user: true }
                }
              }
            },
            department: true
          }
        },
        defenseSchedule: true
      }
    });

    const formattedEvaluations = evaluations.map(ev => {
      const students = ev.project.group?.groupMembers.map(gm => gm.user.name) || [];
      return {
        id: ev.id,
        projectTitle: ev.project.title,
        groupId: ev.project.group?.code || 'No Group',
        department: ev.project.department?.name || 'IT',
        students,
        defenseDate: ev.defenseSchedule?.scheduledAt?.toISOString() || new Date().toISOString(),
        status: ev.submittedAt ? 'completed' : 'pending',
        score: ev.score,
        recommendation: ev.recommendation,
        evaluatorId: ev.evaluatorId,
        overallComments: ev.remarks || '',
        rubric: ev.rubricData ? (typeof ev.rubricData === 'string' ? JSON.parse(ev.rubricData) : ev.rubricData) : [],
        studentEvaluations: ev.studentEvaluations ? (typeof ev.studentEvaluations === 'string' ? JSON.parse(ev.studentEvaluations) : ev.studentEvaluations) : [],
        submittedAt: ev.submittedAt?.toISOString() || null
      }
    });

    return NextResponse.json({ evaluations: formattedEvaluations });

  } catch (error) {
    console.error('[EVALUATIONS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request, [UserRole.ADVISER, UserRole.PANEL]);

    const data = await request.json();
    
    // Validate we have the Evaluation ID
    if (!data.id || data.id.startsWith('eval-')) {
      return NextResponse.json({ error: 'Invalid Evaluation Record. Please wait for a real assigned project.' }, { status: 400 });
    }

    const updated = await prisma.evaluation.update({
      where: { id: data.id },
      data: {
        score: data.score,
        recommendation: data.recommendation,
        remarks: data.overallComments,
        rubricData: data.rubric,
        studentEvaluations: data.studentEvaluations,
        submittedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, evaluation: updated });

  } catch (error) {
    console.error('[EVALUATIONS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
