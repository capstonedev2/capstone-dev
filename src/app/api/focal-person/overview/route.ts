import { DefenseChairDecision, DefenseStatus, MilestoneCheckpointStatus, MilestoneStatus, ProjectStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { handleApiError, successResponse } from '@/lib/utils';
import { withApiLogging } from '@/lib/api-logging';
import { groupDepartmentWhere, projectDepartmentWhere } from '@/lib/department-scope';
import { personName, requireFocalDepartment } from '@/lib/focal-person/server';
import { THESIS_MILESTONE_WORKFLOW, TOTAL_WORKFLOW_CHECKPOINTS } from '@/lib/milestone-checkpoint-tracking';
import { schoolYearId, schoolYearLabel, startYearFromAcademicYear, termForDate, toDateKey } from '@/lib/focal-person/terms';
import type {
  AcademicYearSummary,
  DefenseResult,
  DelayedGroup,
  DepartmentReportRow,
  FocalOverview,
  ProjectStage,
  RecentSubmission,
  Semester,
  UpcomingDefense
} from '@/lib/focal-person/types';

export const runtime = 'nodejs';

const DAY_MS = 86_400_000;
const STAGE_ORDER: ProjectStage[] = ['concept', 'proposal', 'development', 'pre_final', 'final', 'completed'];

/**
 * Workflow stage → focal person stage. The post-defense "Completion" paperwork (approved manuscript,
 * repository submission) still counts as the final stage until every checkpoint is done.
 */
const STAGE_BY_WORKFLOW_KEY: Record<string, ProjectStage> = {
  concept: 'concept',
  proposal: 'proposal',
  development: 'development',
  'mock-defense': 'pre_final',
  'final-defense': 'final',
  completion: 'final'
};

const WORKFLOW_CHECKPOINT_TITLES = new Map(
  THESIS_MILESTONE_WORKFLOW.flatMap((stage) => stage.checkpoints.map((checkpoint) => [checkpoint.key, checkpoint.title] as const))
);

const PASS_RECOMMENDATIONS = new Set(['PASSED', 'PASSED_MINOR', 'PASSED_MAJOR']);
const FAIL_RECOMMENDATIONS = new Set(['REDEFENSE', 'FAILED']);

function stageFor(completedKeys: Set<string>, completed: boolean): ProjectStage {
  if (completed) return 'completed';
  const active = THESIS_MILESTONE_WORKFLOW.find((stage) => stage.checkpoints.some((checkpoint) => !completedKeys.has(checkpoint.key)));
  return active ? STAGE_BY_WORKFLOW_KEY[active.key] ?? 'concept' : 'completed';
}

/** Same vote rule as the defense flow: unanimous Yes passes; otherwise the chair's decision decides. */
function defenseResultFor(
  schedule: { chairDecision: DefenseChairDecision | null; evaluations: { recommendation: string }[] } | undefined
): DefenseResult {
  if (!schedule) return 'pending';
  const votes = schedule.evaluations.map((evaluation) => evaluation.recommendation);
  const noVotes = votes.filter((vote) => FAIL_RECOMMENDATIONS.has(vote)).length;
  const passed = noVotes === 0 || schedule.chairDecision === DefenseChairDecision.APPROVED;

  if (passed && votes.some((vote) => PASS_RECOMMENDATIONS.has(vote))) {
    if (votes.includes('PASSED_MAJOR')) return 'passed_major';
    if (votes.includes('PASSED_MINOR')) return 'passed_minor';
    return 'passed';
  }
  if (!passed && (schedule.chairDecision === DefenseChairDecision.REDEFENSE || schedule.chairDecision === DefenseChairDecision.NEW_TITLE)) {
    return 'redefense';
  }
  return 'pending';
}

function termOf(project: { createdAt: Date; academicYear: { label: string } | null }): { academicYearId: string; semester: Semester } {
  const term = termForDate(project.createdAt);
  const startYear = project.academicYear ? startYearFromAcademicYear(project.academicYear.label) : term.startYear;
  return { academicYearId: schoolYearId(startYear), semester: term.semester };
}

async function handleGET(request: Request) {
  try {
    // Only Research Focal Persons, and only the department on their own account.
    const { department, departmentText: ownDepartment } = await requireFocalDepartment(request);

    const now = new Date();
    const startOfToday = new Date(`${toDateKey(now)}T00:00:00`);
    const currentTerm = termForDate(now);
    const projectScope = projectDepartmentWhere(ownDepartment);

    const [groups, projects, upcoming, submissions] = await Promise.all([
      prisma.group.findMany({
        where: groupDepartmentWhere(ownDepartment),
        select: {
          id: true,
          code: true,
          title: true,
          projectTitle: true,
          projectId: true,
          userId: true,
          lifecycleStatus: true,
          completedAt: true,
          currentMilestone: true,
          students: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { code: 'asc' }
      }),
      prisma.project.findMany({
        where: { AND: [projectScope, { status: { not: ProjectStatus.ARCHIVED } }] },
        select: {
          id: true,
          title: true,
          status: true,
          groupId: true,
          isPublished: true,
          repositoryPublishedAt: true,
          createdAt: true,
          updatedAt: true,
          academicYear: { select: { label: true } },
          adviser: { select: { name: true, displayName: true, firstName: true, lastName: true } },
          milestoneCheckpoints: { select: { key: true, title: true, status: true, completedAt: true } },
          milestones: { select: { title: true, status: true, dueAt: true } },
          defenseSchedules: {
            where: { status: DefenseStatus.COMPLETED },
            orderBy: { scheduledAt: 'desc' },
            take: 1,
            select: { chairDecision: true, evaluations: { select: { recommendation: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.defenseSchedule.findMany({
        where: {
          project: projectScope,
          status: { in: [DefenseStatus.SCHEDULED, DefenseStatus.RESCHEDULED] },
          scheduledAt: { gte: startOfToday }
        },
        orderBy: { scheduledAt: 'asc' },
        take: 8,
        select: {
          id: true,
          title: true,
          scheduledAt: true,
          location: true,
          project: { select: { title: true, group: { select: { code: true } } } },
          evaluations: {
            where: { panelRole: 'CHAIR' },
            select: { evaluator: { select: { name: true, displayName: true, firstName: true, lastName: true } } }
          }
        }
      }),
      prisma.submission.findMany({
        where: { project: projectScope },
        orderBy: { submittedAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          submittedAt: true,
          checkpoint: { select: { title: true } },
          submittedBy: { select: { name: true, displayName: true, firstName: true, lastName: true } },
          project: { select: { title: true, group: { select: { code: true } } } }
        }
      })
    ]);

    // Advisers named on groups whose project has no adviser yet.
    const adviserIds = Array.from(new Set(groups.map((group) => group.userId).filter(Boolean)));
    const groupAdvisers = new Map(
      (
        await prisma.user.findMany({
          where: { id: { in: adviserIds } },
          select: { id: true, name: true, displayName: true, firstName: true, lastName: true }
        })
      ).map((adviser) => [adviser.id, personName(adviser)])
    );

    const projectById = new Map(projects.map((project) => [project.id, project]));
    const usedProjectIds = new Set<string>();

    // One row per research group, using the group's current project; projects in the department
    // that aren't linked to one of its groups get a row of their own.
    type Entry = { group: (typeof groups)[number] | null; project: (typeof projects)[number] | undefined };
    const entries: Entry[] = groups.map((group) => {
      const project =
        (group.projectId ? projectById.get(group.projectId) : undefined) ?? projects.find((item) => item.groupId === group.id);
      if (project) usedProjectIds.add(project.id);
      return { group, project };
    });
    projects.filter((project) => !usedProjectIds.has(project.id)).forEach((project) => entries.push({ group: null, project }));

    const rows: DepartmentReportRow[] = [];
    const delayedGroups: DelayedGroup[] = [];

    for (const { group, project } of entries) {
      const completedCheckpoints = (project?.milestoneCheckpoints ?? []).filter((checkpoint) => checkpoint.status === MilestoneCheckpointStatus.COMPLETED);
      const completedKeys = new Set(completedCheckpoints.map((checkpoint) => checkpoint.key));
      const completed =
        project?.status === ProjectStatus.COMPLETED || group?.lifecycleStatus === 'COMPLETED' || Boolean(group?.completedAt);
      const stage = project ? stageFor(completedKeys, completed) : completed ? 'completed' : 'concept';

      const overdue = completed
        ? []
        : (project?.milestones ?? [])
            .filter(
              (milestone) =>
                milestone.dueAt &&
                milestone.dueAt < startOfToday &&
                milestone.status !== MilestoneStatus.COMPLETED &&
                milestone.status !== MilestoneStatus.APPROVED
            )
            .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());

      const groupCode = group?.code ?? '—';
      const projectTitle = project?.title || group?.projectTitle || group?.title || 'Untitled project';
      const adviserName = personName(project?.adviser) || (group?.userId ? groupAdvisers.get(group.userId) : '') || 'Unassigned';

      if (overdue.length) {
        const first = overdue[0];
        delayedGroups.push({
          groupId: group?.id ?? project?.id ?? groupCode,
          groupCode,
          projectTitle,
          stage,
          milestone: first.title,
          dueOn: toDateKey(first.dueAt!),
          daysOverdue: Math.max(1, Math.floor((startOfToday.getTime() - first.dueAt!.getTime()) / DAY_MS)),
          adviserName
        });
      }

      const lastCompleted = [...completedCheckpoints].sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))[0];
      const term = termOf(project ?? { createdAt: group!.createdAt, academicYear: null });

      const updatedAt = [group?.updatedAt, project?.updatedAt]
        .filter((date): date is Date => Boolean(date))
        .reduce((latest, date) => (date > latest ? date : latest), new Date(0));

      rows.push({
        id: group?.id ?? project?.id ?? groupCode,
        groupCode,
        projectTitle,
        adviserName,
        stage,
        status: completed || stage === 'completed' ? 'completed' : overdue.length ? 'delayed' : 'on_track',
        lastMilestone: lastCompleted
          ? WORKFLOW_CHECKPOINT_TITLES.get(lastCompleted.key) ?? lastCompleted.title
          : group?.currentMilestone || 'No milestone completed yet',
        defenseResult: defenseResultFor(project?.defenseSchedules[0]),
        published: Boolean(project?.isPublished || project?.repositoryPublishedAt),
        academicYearId: term.academicYearId,
        semester: term.semester,
        members: group?.students ?? [],
        progress: completed ? 100 : Math.round((completedKeys.size / TOTAL_WORKFLOW_CHECKPOINTS) * 100),
        updatedAt: updatedAt.toISOString()
      });
    }

    const completedCount = rows.filter((row) => row.status === 'completed').length;
    const activeCount = rows.length - completedCount;

    const upcomingDefenses: UpcomingDefense[] = upcoming.map((schedule) => ({
      id: schedule.id,
      groupCode: schedule.project.group?.code ?? '—',
      projectTitle: schedule.project.title,
      typeLabel: schedule.title,
      scheduledAt: schedule.scheduledAt.toISOString(),
      venue: schedule.location || 'Venue to be announced',
      panelChair: personName(schedule.evaluations[0]?.evaluator) || 'Not assigned'
    }));

    const recentSubmissions: RecentSubmission[] = submissions.map((submission) => ({
      id: submission.id,
      groupCode: submission.project.group?.code ?? '—',
      projectTitle: submission.project.title,
      title: submission.title,
      checkpoint: submission.checkpoint?.title ?? null,
      status: submission.status.toLowerCase() as RecentSubmission['status'],
      submittedAt: submission.submittedAt.toISOString(),
      submittedBy: personName(submission.submittedBy) || 'Group member'
    }));

    const yearIds = new Set([schoolYearId(currentTerm.startYear), ...rows.map((row) => row.academicYearId)]);
    const academicYears: AcademicYearSummary[] = Array.from(yearIds)
      .map((id) => startYearFromAcademicYear(id))
      .sort((a, b) => b - a)
      .map((startYear) => ({ id: schoolYearId(startYear), label: schoolYearLabel(startYear) }));

    const overview: FocalOverview = {
      department,
      academicYear: { id: schoolYearId(currentTerm.startYear), label: schoolYearLabel(currentTerm.startYear) },
      semester: currentTerm.semester,
      generatedAt: now.toISOString(),
      totals: {
        researchGroups: groups.length,
        activeProjects: activeCount,
        completedProjects: completedCount,
        completionRate: rows.length ? Math.round((completedCount / rows.length) * 100) : 0,
        delayedGroups: delayedGroups.length,
        upcomingDefenses: upcomingDefenses.length
      },
      projectsByStage: STAGE_ORDER.map((stage) => ({ stage, count: rows.filter((row) => row.stage === stage).length })),
      delayedGroups: delayedGroups.sort((a, b) => b.daysOverdue - a.daysOverdue),
      upcomingDefenses,
      recentSubmissions,
      rows,
      academicYears
    };

    return successResponse({ overview });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withApiLogging('GET', '/api/focal-person/overview', handleGET);
