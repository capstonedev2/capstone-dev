import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';
import { handleApiError } from '@/lib/utils';
import { UserRole } from '@/generated/prisma/client';

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req, [UserRole.STUDENT]);

    const { checkpointId, targetDate, startDate } = await req.json();

    if (!checkpointId) {
      return NextResponse.json({ error: 'Missing checkpointId' }, { status: 400 });
    }

    const updateData: any = {};
    if (targetDate !== undefined) {
      updateData.studentTargetDate = targetDate ? new Date(targetDate) : null;
    }
    if (startDate !== undefined) {
      updateData.studentStartDate = startDate ? new Date(startDate) : null;
    }

    const updated = await prisma.milestoneCheckpoint.update({
      where: { id: checkpointId },
      data: updateData,
    });

    return NextResponse.json({ success: true, checkpoint: updated });
  } catch (error) {
    console.error('Error updating checkpoint target date:', error);
    return handleApiError(error);
  }
}
