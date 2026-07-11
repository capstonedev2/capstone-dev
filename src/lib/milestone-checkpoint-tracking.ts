import {
  MilestoneCheckpointReviewStatus,
  MilestoneCheckpointStatus,
  MilestoneStatus,
  ProjectStatus,
  SubmissionStatus,
  UserRole
} from '@/generated/prisma/client';

type DbClient = {
  project: any;
  milestone: any;
  milestoneCheckpoint: any;
  submission: any;
  uploadedFile: any;
};

type WorkflowStage = {
  key: string;
  title: string;
  description: string;
  sequence: number;
  checkpoints: Array<{
    key: string;
    title: string;
    description: string;
    sequence: number;
    panelRequired?: boolean;
  }>;
};

const APPROVED_PROJECT_STATUSES = new Set<ProjectStatus>([
  ProjectStatus.APPROVED,
  ProjectStatus.DEFENSE_SCHEDULED,
  ProjectStatus.COMPLETED
]);

const REVIEWED_SUBMISSION_STATUSES = new Set<SubmissionStatus>([
  SubmissionStatus.UNDER_REVIEW,
  SubmissionStatus.APPROVED,
  SubmissionStatus.NEEDS_REVISION,
  SubmissionStatus.REJECTED
]);

export const THESIS_MILESTONE_WORKFLOW: WorkflowStage[] = [
  {
    key: 'concept',
    title: 'Concept',
    description: 'Define the research topic, problem scope, and initial capstone direction.',
    sequence: 1,
    checkpoints: [
      { key: 'concept-title', title: 'Title submitted', description: 'Official project title has been submitted.', sequence: 1, panelRequired: false },
      { key: 'concept-paper', title: 'Concept paper uploaded', description: 'Concept paper or title proposal evidence is uploaded.', sequence: 2, panelRequired: false },
      { key: 'concept-adviser-approval', title: 'Adviser idea approval', description: 'Adviser cleared the idea for concept presentation.', sequence: 3, panelRequired: false },
      { key: 'concept-presentation-scheduled', title: 'Concept presentation scheduled', description: 'Concept presentation schedule is recorded after adviser clearance.', sequence: 4, panelRequired: false },
      { key: 'concept-panel-approval', title: 'Panel concept approval', description: 'Panel approved the concept after presentation.', sequence: 5 }
    ]
  },
  {
    key: 'proposal',
    title: 'Proposal',
    description: 'Submit the formal project proposal for adviser and panel evaluation and approval.',
    sequence: 2,
    checkpoints: [
      { key: 'proposal-chapters', title: 'Chapters 1-3 uploaded', description: 'Proposal manuscript or Chapters 1-3 were submitted.', sequence: 1, panelRequired: false },
      { key: 'proposal-adviser-review', title: 'Adviser initial review', description: 'Adviser completed the first proposal review.', sequence: 2, panelRequired: false },
      { key: 'proposal-defense-scheduled', title: 'Proposal defense scheduled', description: 'Proposal defense schedule is recorded.', sequence: 3, panelRequired: false },
      { key: 'proposal-panel-evaluation', title: 'Panel evaluation', description: 'Panel evaluation is recorded for proposal defense.', sequence: 4 },
      { key: 'proposal-final-approval', title: 'Final approval', description: 'Proposal stage received final clearance.', sequence: 5 }
    ]
  },
  {
    key: 'development',
    title: 'Development',
    description: 'Build the system, submit progress reports, and provide implementation evidence.',
    sequence: 3,
    checkpoints: [
      { key: 'development-prototype', title: 'Prototype uploaded', description: 'Prototype or system build evidence was uploaded.', sequence: 1, panelRequired: false },
      { key: 'development-progress-report', title: 'Progress report submitted', description: 'Development progress report was submitted.', sequence: 2, panelRequired: false },
      { key: 'development-testing-evidence', title: 'Testing evidence uploaded', description: 'Testing or validation evidence was uploaded.', sequence: 3, panelRequired: false },
      { key: 'development-adviser-monitoring', title: 'Adviser monitoring approval', description: 'Adviser cleared the development monitoring checkpoint.', sequence: 4, panelRequired: false }
    ]
  },
  {
    key: 'mock-defense',
    title: 'Pre-Final Defense',
    description: 'Present a practice defense, gather early feedback, and complete revisions.',
    sequence: 4,
    checkpoints: [
      { key: 'mock-presentation', title: 'Presentation uploaded', description: 'Pre-final defense presentation file was uploaded.', sequence: 1, panelRequired: false },
      { key: 'mock-defense-scheduled', title: 'Pre-final defense scheduled', description: 'Pre-final defense schedule is recorded.', sequence: 2, panelRequired: false },
      { key: 'mock-panel-comments', title: 'Panel comments received', description: 'Panel comments were received after pre-final defense.', sequence: 3 },
      { key: 'mock-revisions-completed', title: 'Revisions completed', description: 'Pre-final defense revisions were submitted and cleared.', sequence: 4 }
    ]
  },
  {
    key: 'final-defense',
    title: 'Final Defense',
    description: 'Defend the completed project before the panel and submit final revisions.',
    sequence: 5,
    checkpoints: [
      { key: 'final-manuscript', title: 'Final manuscript uploaded', description: 'Final manuscript was uploaded for review.', sequence: 1, panelRequired: false },
      { key: 'final-defense-scheduled', title: 'Final defense scheduled', description: 'Final defense schedule is recorded.', sequence: 2, panelRequired: false },
      { key: 'final-panel-approval', title: 'Panel approval', description: 'Panel approval is recorded after final defense.', sequence: 3 },
      { key: 'final-revisions-submitted', title: 'Final revisions submitted', description: 'Final revisions were submitted and cleared.', sequence: 4 }
    ]
  },
  {
    key: 'completion',
    title: 'Completion',
    description: 'Finalize approved deliverables, repository submission, and archive confirmation.',
    sequence: 6,
    checkpoints: [
      { key: 'completion-approved-manuscript', title: 'Approved manuscript uploaded', description: 'Approved manuscript copy was uploaded.', sequence: 1 },
      { key: 'completion-approval-sheet', title: 'Approval sheet uploaded', description: 'Signed approval sheet was uploaded.', sequence: 2 },
      { key: 'completion-repository-submission', title: 'Repository submission completed', description: 'Repository submission was completed.', sequence: 3 },
      { key: 'completion-archive-confirmation', title: 'Archive confirmation', description: 'Archive confirmation is recorded.', sequence: 4 }
    ]
  }
];

const EXPECTED_WORKFLOW_MILESTONE_SEQUENCES = THESIS_MILESTONE_WORKFLOW.map((stage) => stage.sequence);
const EXPECTED_WORKFLOW_CHECKPOINT_KEYS = THESIS_MILESTONE_WORKFLOW.flatMap((stage) =>
  stage.checkpoints.map((checkpoint) => checkpoint.key)
);
const NON_PANEL_REVIEW_CHECKPOINT_KEYS = new Set(
  THESIS_MILESTONE_WORKFLOW.flatMap((stage) =>
    stage.checkpoints
      .filter((checkpoint) => checkpoint.panelRequired === false)
      .map((checkpoint) => checkpoint.key)
  )
);

const CHECKPOINT_MATCHERS = [
  { checkpointKey: 'concept-paper', keywords: ['title proposal', 'concept paper', 'concept', 'title'] },
  { checkpointKey: 'concept-presentation-scheduled', keywords: ['concept presentation', 'concept defense', 'concept schedule'] },
  { checkpointKey: 'proposal-chapters', keywords: ['proposal', 'chapter 1', 'chapter 2', 'chapter 3', 'chapters 1-3', 'chapters 1–3', 'manuscript'] },
  { checkpointKey: 'development-progress-report', keywords: ['progress report', 'progress'] },
  { checkpointKey: 'development-testing-evidence', keywords: ['testing', 'test evidence', 'qa', 'validation', 'evaluation evidence'] },
  { checkpointKey: 'development-prototype', keywords: ['prototype', 'system file', 'system-files', 'development', 'source code', 'build'] },
  { checkpointKey: 'mock-presentation', keywords: ['mock presentation', 'pre-final presentation', 'mock defense presentation', 'pre-final defense presentation', 'presentation', 'slides', 'deck'] },
  { checkpointKey: 'mock-revisions-completed', keywords: ['mock revision', 'pre-final revision', 'revised mock', 'revised pre-final', 'mock defense revision', 'pre-final defense revision'] },
  { checkpointKey: 'final-manuscript', keywords: ['final manuscript', 'final paper', 'final document'] },
  { checkpointKey: 'final-revisions-submitted', keywords: ['final revision', 'revised final', 'final revisions'] },
  { checkpointKey: 'completion-approved-manuscript', keywords: ['approved manuscript', 'approved final'] },
  { checkpointKey: 'completion-approval-sheet', keywords: ['approval sheet', 'signature sheet', 'endorsement sheet'] },
  { checkpointKey: 'completion-repository-submission', keywords: ['repository', 'archive submission', 'final repository'] }
];

function normalize(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function getInitialMilestoneStatus(stage: WorkflowStage, projectStatus?: ProjectStatus | null) {
  if (stage.sequence === 1) {
    if (projectStatus && APPROVED_PROJECT_STATUSES.has(projectStatus)) {
      return MilestoneStatus.IN_PROGRESS;
    }

    if (projectStatus === ProjectStatus.NEEDS_REVISION) {
      return MilestoneStatus.NEEDS_REVISION;
    }

    if (projectStatus === ProjectStatus.SUBMITTED || projectStatus === ProjectStatus.UNDER_REVIEW) {
      return MilestoneStatus.IN_PROGRESS;
    }
  }

  return MilestoneStatus.PENDING;
}

function getInitialCheckpointState(stage: WorkflowStage, checkpoint: WorkflowStage['checkpoints'][number], projectStatus?: ProjectStatus | null) {
  const panelReviewStatus = checkpoint.panelRequired === false
    ? MilestoneCheckpointReviewStatus.NOT_REQUIRED
    : MilestoneCheckpointReviewStatus.PENDING;

  if (stage.sequence !== 1) {
    return {
      status: MilestoneCheckpointStatus.PENDING,
      adviserReviewStatus: MilestoneCheckpointReviewStatus.PENDING,
      panelReviewStatus,
      submittedAt: null,
      reviewedAt: null,
      completedAt: null
    };
  }

  if (projectStatus && APPROVED_PROJECT_STATUSES.has(projectStatus)) {
    const isAdviserClearedCheckpoint = checkpoint.key === 'concept-title' ||
      checkpoint.key === 'concept-paper' ||
      checkpoint.key === 'concept-adviser-approval';

    return {
      status: isAdviserClearedCheckpoint ? MilestoneCheckpointStatus.COMPLETED : MilestoneCheckpointStatus.PENDING,
      adviserReviewStatus: isAdviserClearedCheckpoint
        ? MilestoneCheckpointReviewStatus.APPROVED
        : MilestoneCheckpointReviewStatus.PENDING,
      panelReviewStatus,
      submittedAt: isAdviserClearedCheckpoint ? new Date() : null,
      reviewedAt: isAdviserClearedCheckpoint ? new Date() : null,
      completedAt: isAdviserClearedCheckpoint ? new Date() : null
    };
  }

  if (projectStatus === ProjectStatus.NEEDS_REVISION) {
    return {
      status: MilestoneCheckpointStatus.NEEDS_REVISION,
      adviserReviewStatus: MilestoneCheckpointReviewStatus.NEEDS_REVISION,
      panelReviewStatus,
      submittedAt: new Date(),
      reviewedAt: new Date(),
      completedAt: null
    };
  }

  if (projectStatus === ProjectStatus.SUBMITTED || projectStatus === ProjectStatus.UNDER_REVIEW) {
    return {
      status: checkpoint.key === 'concept-title' ? MilestoneCheckpointStatus.SUBMITTED : MilestoneCheckpointStatus.PENDING,
      adviserReviewStatus: checkpoint.key === 'concept-title'
        ? MilestoneCheckpointReviewStatus.IN_REVIEW
        : MilestoneCheckpointReviewStatus.PENDING,
      panelReviewStatus,
      submittedAt: checkpoint.key === 'concept-title' ? new Date() : null,
      reviewedAt: null,
      completedAt: null
    };
  }

  return {
    status: MilestoneCheckpointStatus.PENDING,
    adviserReviewStatus: MilestoneCheckpointReviewStatus.PENDING,
    panelReviewStatus,
    submittedAt: null,
    reviewedAt: null,
    completedAt: null
  };
}

function isCheckpointDone(status: MilestoneCheckpointStatus) {
  return status === MilestoneCheckpointStatus.APPROVED || status === MilestoneCheckpointStatus.COMPLETED;
}

function getMilestoneRollupStatus(statuses: MilestoneCheckpointStatus[]) {
  const hasRevision = statuses.some((status) => status === MilestoneCheckpointStatus.NEEDS_REVISION);
  const hasActivity = statuses.some((status) =>
    status === MilestoneCheckpointStatus.SUBMITTED ||
    status === MilestoneCheckpointStatus.IN_REVIEW ||
    status === MilestoneCheckpointStatus.APPROVED ||
    status === MilestoneCheckpointStatus.COMPLETED
  );
  const allDone = statuses.every(isCheckpointDone);

  if (allDone) {
    return MilestoneStatus.COMPLETED;
  }

  if (hasRevision) {
    return MilestoneStatus.NEEDS_REVISION;
  }

  return hasActivity ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.PENDING;
}

type ExistingCheckpointSummary = {
  id: string;
  key: string;
  milestoneId: string;
  status: MilestoneCheckpointStatus;
  adviserReviewStatus: MilestoneCheckpointReviewStatus;
  panelReviewStatus: MilestoneCheckpointReviewStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  completedAt: Date | null;
  latestFeedback: string | null;
  latestFeedbackBy: string | null;
  latestFeedbackAt: Date | null;
};

const TITLE_REVIEW_APPROVED_CHECKPOINT_KEYS = [
  'concept-title',
  'concept-paper',
  'concept-adviser-approval'
];

function hasCheckpointActivity(checkpoint?: ExistingCheckpointSummary) {
  if (!checkpoint) {
    return false;
  }

  return checkpoint.status !== MilestoneCheckpointStatus.PENDING ||
    Boolean(checkpoint.submittedAt || checkpoint.reviewedAt || checkpoint.completedAt);
}

function hasPendingReviewFeedback(value?: string | null) {
  const normalized = normalize(value);

  return normalized.includes('pending adviser review') ||
    normalized.includes('waiting for review') ||
    normalized.includes('review is in progress');
}

async function repairApprovedConceptTitleReview(
  db: DbClient,
  projectStatus: ProjectStatus | null | undefined,
  existingCheckpoints: ExistingCheckpointSummary[]
) {
  if (!projectStatus || !APPROVED_PROJECT_STATUSES.has(projectStatus)) {
    return;
  }

  const checkpointsByKey = new Map(existingCheckpoints.map((checkpoint) => [checkpoint.key, checkpoint]));
  const hasTitleReviewActivity = TITLE_REVIEW_APPROVED_CHECKPOINT_KEYS.some((key) =>
    hasCheckpointActivity(checkpointsByKey.get(key))
  );

  if (!hasTitleReviewActivity) {
    return;
  }

  const now = new Date();
  const updatedMilestoneIds = new Set<string>();

  for (const key of TITLE_REVIEW_APPROVED_CHECKPOINT_KEYS) {
    const checkpoint = checkpointsByKey.get(key);

    if (!checkpoint) {
      continue;
    }

    if (key === 'concept-paper' && !hasCheckpointActivity(checkpoint)) {
      continue;
    }

    const shouldClearFeedback = hasPendingReviewFeedback(checkpoint.latestFeedback);
    const shouldUpdate =
      checkpoint.status !== MilestoneCheckpointStatus.COMPLETED ||
      checkpoint.adviserReviewStatus !== MilestoneCheckpointReviewStatus.APPROVED ||
      checkpoint.panelReviewStatus !== MilestoneCheckpointReviewStatus.NOT_REQUIRED ||
      !checkpoint.submittedAt ||
      !checkpoint.reviewedAt ||
      !checkpoint.completedAt ||
      shouldClearFeedback;

    if (!shouldUpdate) {
      continue;
    }

    await db.milestoneCheckpoint.update({
      where: { id: checkpoint.id },
      data: {
        status: MilestoneCheckpointStatus.COMPLETED,
        adviserReviewStatus: MilestoneCheckpointReviewStatus.APPROVED,
        panelReviewStatus: MilestoneCheckpointReviewStatus.NOT_REQUIRED,
        submittedAt: checkpoint.submittedAt ?? now,
        reviewedAt: checkpoint.reviewedAt ?? now,
        completedAt: checkpoint.completedAt ?? now,
        ...(shouldClearFeedback
          ? {
              latestFeedback: null,
              latestFeedbackBy: null,
              latestFeedbackAt: null
            }
          : {})
      }
    });

    updatedMilestoneIds.add(checkpoint.milestoneId);
  }

  await Promise.all(Array.from(updatedMilestoneIds).map((milestoneId) =>
    updateMilestoneRollup(db, milestoneId)
  ));
}

export async function ensureProjectMilestoneWorkflow(db: DbClient, projectId: string) {
  const [existingMilestones, existingCheckpoints, project] = await Promise.all([
    db.milestone.findMany({
      where: { projectId },
      select: {
        id: true,
        sequence: true,
        status: true,
        completedAt: true
      }
    }),
    db.milestoneCheckpoint.findMany({
      where: { projectId },
      select: {
        id: true,
        key: true,
        status: true,
        milestoneId: true,
        adviserReviewStatus: true,
        panelReviewStatus: true,
        submittedAt: true,
        reviewedAt: true,
        completedAt: true,
        latestFeedback: true,
        latestFeedbackBy: true,
        latestFeedbackAt: true
      }
    }),
    db.project.findUnique({
      where: { id: projectId },
      select: { status: true }
    })
  ]);

  const existingSequences = new Set(existingMilestones.map((milestone: { sequence: number }) => milestone.sequence));
  const existingKeys = new Set(existingCheckpoints.map((checkpoint: { key: string }) => checkpoint.key));
  const hasAllWorkflowRows =
    EXPECTED_WORKFLOW_MILESTONE_SEQUENCES.every((sequence) => existingSequences.has(sequence)) &&
    EXPECTED_WORKFLOW_CHECKPOINT_KEYS.every((key) => existingKeys.has(key));
  const hasReviewSchemaDrift = existingCheckpoints.some((checkpoint: {
    key: string;
    panelReviewStatus: MilestoneCheckpointReviewStatus;
  }) =>
    NON_PANEL_REVIEW_CHECKPOINT_KEYS.has(checkpoint.key) &&
    checkpoint.panelReviewStatus !== MilestoneCheckpointReviewStatus.NOT_REQUIRED
  );

  if (hasAllWorkflowRows && !hasReviewSchemaDrift) {
    type ExistingMilestoneSummary = {
      id: string;
      status: MilestoneStatus;
      completedAt: Date | null;
    };
    const milestonesById = new Map<string, ExistingMilestoneSummary>(
      (existingMilestones as ExistingMilestoneSummary[]).map((milestone) => [milestone.id, milestone])
    );
    const checkpointStatusesByMilestone = new Map<string, MilestoneCheckpointStatus[]>();

    for (const checkpoint of existingCheckpoints as Array<{
      milestoneId: string;
      status: MilestoneCheckpointStatus;
    }>) {
      const statuses = checkpointStatusesByMilestone.get(checkpoint.milestoneId) ?? [];
      statuses.push(checkpoint.status);
      checkpointStatusesByMilestone.set(checkpoint.milestoneId, statuses);
    }

    const rollupUpdates = Array.from(checkpointStatusesByMilestone.entries())
      .map(([milestoneId, statuses]) => {
        const milestone = milestonesById.get(milestoneId);

        if (!milestone) {
          return null;
        }

        const nextStatus = getMilestoneRollupStatus(statuses);
        const shouldBeCompleted = nextStatus === MilestoneStatus.COMPLETED;

        if (milestone.status === nextStatus && (shouldBeCompleted || !milestone.completedAt)) {
          return null;
        }

        return db.milestone.update({
          where: { id: milestoneId },
          data: {
            status: nextStatus,
            completedAt: shouldBeCompleted ? milestone.completedAt ?? new Date() : null
          }
        });
      })
      .filter(Boolean);

    if (rollupUpdates.length) {
      await Promise.all(rollupUpdates);
    }

    await repairApprovedConceptTitleReview(
      db,
      project?.status,
      existingCheckpoints as ExistingCheckpointSummary[]
    );

    return existingCheckpoints;
  }

  const checkpoints = [];

  for (const stage of THESIS_MILESTONE_WORKFLOW) {
    const milestone = await db.milestone.upsert({
      where: {
        projectId_sequence: {
          projectId,
          sequence: stage.sequence
        }
      },
      update: {
        title: stage.title,
        description: stage.description
      },
      create: {
        projectId,
        title: stage.title,
        description: stage.description,
        sequence: stage.sequence,
        status: getInitialMilestoneStatus(stage, project?.status)
      }
    });

    for (const checkpoint of stage.checkpoints) {
      const initialState = getInitialCheckpointState(stage, checkpoint, project?.status);
      const savedCheckpoint = await db.milestoneCheckpoint.upsert({
        where: {
          projectId_key: {
            projectId,
            key: checkpoint.key
          }
        },
        update: {
          milestoneId: milestone.id,
          title: checkpoint.title,
          description: checkpoint.description,
          sequence: checkpoint.sequence,
          required: true,
          ...(checkpoint.panelRequired === false
            ? { panelReviewStatus: MilestoneCheckpointReviewStatus.NOT_REQUIRED }
            : {})
        },
        create: {
          projectId,
          milestoneId: milestone.id,
          key: checkpoint.key,
          title: checkpoint.title,
          description: checkpoint.description,
          sequence: checkpoint.sequence,
          required: true,
          ...initialState
        }
      });

      checkpoints.push(savedCheckpoint);
    }

    await updateMilestoneRollup(db, milestone.id);
  }

  return checkpoints;
}

function findCheckpointKey({
  checkpointKey,
  documentCategory,
  fileName
}: {
  checkpointKey?: string | null;
  documentCategory?: string | null;
  fileName?: string | null;
}) {
  const requestedKey = normalize(checkpointKey);
  if (requestedKey) {
    const exists = THESIS_MILESTONE_WORKFLOW.some((stage) =>
      stage.checkpoints.some((checkpoint) => checkpoint.key === requestedKey)
    );

    if (exists) {
      return requestedKey;
    }
  }

  const haystack = normalize(`${documentCategory ?? ''} ${fileName ?? ''}`);
  const match = CHECKPOINT_MATCHERS.find((matcher) =>
    matcher.keywords.some((keyword) => haystack.includes(keyword))
  );

  return match?.checkpointKey ?? 'proposal-chapters';
}

export async function resolveMilestoneCheckpointForSubmission(
  db: DbClient,
  {
    projectId,
    checkpointKey,
    documentCategory,
    fileName
  }: {
    projectId: string;
    checkpointKey?: string | null;
    documentCategory?: string | null;
    fileName?: string | null;
  }
) {
  await ensureProjectMilestoneWorkflow(db, projectId);
  const resolvedKey = findCheckpointKey({ checkpointKey, documentCategory, fileName });

  return db.milestoneCheckpoint.findUnique({
    where: {
      projectId_key: {
        projectId,
        key: resolvedKey
      }
    },
    include: {
      milestone: {
        select: {
          id: true,
          sequence: true,
          title: true
        }
      }
    }
  });
}

export async function updateMilestoneRollup(db: DbClient, milestoneId: string) {
  const checkpoints = await db.milestoneCheckpoint.findMany({
    where: { milestoneId },
    select: { status: true }
  });

  if (!checkpoints.length) {
    return;
  }

  const nextStatus = getMilestoneRollupStatus(checkpoints.map((checkpoint: { status: MilestoneCheckpointStatus }) =>
    checkpoint.status
  ));

  await db.milestone.update({
    where: { id: milestoneId },
    data: {
      status: nextStatus,
      completedAt: nextStatus === MilestoneStatus.COMPLETED ? new Date() : null
    }
  });
}

export async function recordCheckpointSubmission(
  db: DbClient,
  {
    projectId,
    checkpointKey,
    documentCategory,
    fileName,
    submissionId,
    fileId
  }: {
    projectId: string;
    checkpointKey?: string | null;
    documentCategory?: string | null;
    fileName?: string | null;
    submissionId?: string | null;
    fileId?: string | null;
  }
) {
  const checkpoint = await resolveMilestoneCheckpointForSubmission(db, {
    projectId,
    checkpointKey,
    documentCategory,
    fileName
  });

  if (!checkpoint) {
    return null;
  }

  if (submissionId) {
    await db.submission.update({
      where: { id: submissionId },
      data: {
        milestoneId: checkpoint.milestoneId,
        checkpointId: checkpoint.id
      }
    });
  }

  if (fileId) {
    await db.uploadedFile.update({
      where: { id: fileId },
      data: {
        checkpointId: checkpoint.id
      }
    });
  }

  await db.milestoneCheckpoint.update({
    where: { id: checkpoint.id },
    data: {
      status: MilestoneCheckpointStatus.SUBMITTED,
      adviserReviewStatus: MilestoneCheckpointReviewStatus.IN_REVIEW,
      submittedAt: new Date(),
      completedAt: null
    }
  });

  await updateMilestoneRollup(db, checkpoint.milestoneId);

  return checkpoint;
}

function getCheckpointKeyForSchedule(title: string) {
  const normalized = normalize(title);

  if (normalized.includes('concept')) {
    return 'concept-presentation-scheduled';
  }

  if (normalized.includes('proposal')) {
    return 'proposal-defense-scheduled';
  }

  if (normalized.includes('mock') || normalized.includes('pre-final') || normalized.includes('practice') || normalized.includes('dry run')) {
    return 'mock-defense-scheduled';
  }

  if (normalized.includes('final')) {
    return 'final-defense-scheduled';
  }

  return null;
}

export async function recordCheckpointSchedule(
  db: DbClient,
  {
    projectId,
    title,
    scheduledAt
  }: {
    projectId: string;
    title: string;
    scheduledAt: Date;
  }
) {
  await ensureProjectMilestoneWorkflow(db, projectId);
  const checkpointKey = getCheckpointKeyForSchedule(title);

  if (!checkpointKey) {
    return null;
  }

  const checkpoint = await db.milestoneCheckpoint.findUnique({
    where: {
      projectId_key: {
        projectId,
        key: checkpointKey
      }
    }
  });

  if (!checkpoint) {
    return null;
  }

  const updatedCheckpoint = await db.milestoneCheckpoint.update({
    where: { id: checkpoint.id },
    data: {
      status: MilestoneCheckpointStatus.COMPLETED,
      adviserReviewStatus: MilestoneCheckpointReviewStatus.NOT_REQUIRED,
      panelReviewStatus: MilestoneCheckpointReviewStatus.NOT_REQUIRED,
      submittedAt: scheduledAt,
      reviewedAt: scheduledAt,
      completedAt: new Date(),
      latestFeedback: `${checkpoint.title} for ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(scheduledAt)}.`,
      latestFeedbackBy: 'Schedule',
      latestFeedbackAt: new Date()
    }
  });

  await updateMilestoneRollup(db, updatedCheckpoint.milestoneId);

  return updatedCheckpoint;
}

function getReviewFieldForRole(role: UserRole) {
  return role === UserRole.PANEL
    ? 'panelReviewStatus'
    : 'adviserReviewStatus';
}

function mapSubmissionStatusToCheckpointStatus(status: SubmissionStatus) {
  if (status === SubmissionStatus.APPROVED) return MilestoneCheckpointStatus.COMPLETED;
  if (status === SubmissionStatus.NEEDS_REVISION || status === SubmissionStatus.REJECTED) return MilestoneCheckpointStatus.NEEDS_REVISION;
  if (status === SubmissionStatus.UNDER_REVIEW) return MilestoneCheckpointStatus.IN_REVIEW;
  return MilestoneCheckpointStatus.SUBMITTED;
}

function mapSubmissionStatusToReviewStatus(status: SubmissionStatus) {
  if (status === SubmissionStatus.APPROVED) return MilestoneCheckpointReviewStatus.APPROVED;
  if (status === SubmissionStatus.NEEDS_REVISION || status === SubmissionStatus.REJECTED) return MilestoneCheckpointReviewStatus.NEEDS_REVISION;
  if (status === SubmissionStatus.UNDER_REVIEW) return MilestoneCheckpointReviewStatus.IN_REVIEW;
  return MilestoneCheckpointReviewStatus.PENDING;
}

function getCompanionReviewCheckpointKeys(sourceKey: string | null | undefined, role: UserRole, nextStatus: SubmissionStatus) {
  const source = sourceKey || '';
  const isApproval = nextStatus === SubmissionStatus.APPROVED;
  const isReviewedConceptTitle =
    source === 'concept-title' &&
    (
      nextStatus === SubmissionStatus.APPROVED ||
      nextStatus === SubmissionStatus.NEEDS_REVISION ||
      nextStatus === SubmissionStatus.REJECTED
    );

  if (role === UserRole.PANEL) {
    if (source.startsWith('concept-')) {
      return ['concept-panel-approval'];
    }

    if (source.startsWith('proposal-')) {
      return isApproval
        ? ['proposal-panel-evaluation', 'proposal-final-approval']
        : ['proposal-panel-evaluation'];
    }

    if (source.startsWith('mock-')) {
      return isApproval
        ? ['mock-panel-comments', 'mock-revisions-completed']
        : ['mock-panel-comments'];
    }

    if (source.startsWith('final-')) {
      return isApproval
        ? ['final-panel-approval', 'final-revisions-submitted']
        : ['final-panel-approval'];
    }

    return [];
  }

  if (isReviewedConceptTitle) {
    return ['concept-paper', 'concept-adviser-approval'];
  }

  if (source.startsWith('concept-')) {
    return ['concept-adviser-approval'];
  }

  if (source.startsWith('proposal-')) {
    return ['proposal-adviser-review'];
  }

  if (source.startsWith('development-')) {
    return ['development-adviser-monitoring'];
  }

  return [];
}

async function syncCompanionReviewCheckpoints(
  db: DbClient,
  {
    projectId,
    sourceKey,
    nextStatus,
    reviewNotes,
    reviewerName,
    reviewerRole
  }: {
    projectId: string;
    sourceKey?: string | null;
    nextStatus: SubmissionStatus;
    reviewNotes?: string | null;
    reviewerName?: string | null;
    reviewerRole: UserRole;
  }
) {
  const companionKeys = getCompanionReviewCheckpointKeys(sourceKey, reviewerRole, nextStatus)
    .filter((key) => key !== sourceKey);

  if (!companionKeys.length) {
    return;
  }

  const nextCheckpointStatus = mapSubmissionStatusToCheckpointStatus(nextStatus);
  const nextReviewStatus = mapSubmissionStatusToReviewStatus(nextStatus);
  const reviewedAt = REVIEWED_SUBMISSION_STATUSES.has(nextStatus) ? new Date() : null;
  const reviewField = getReviewFieldForRole(reviewerRole);
  const feedback = String(reviewNotes ?? '').trim();

  for (const key of companionKeys) {
    const checkpoint = await db.milestoneCheckpoint.findUnique({
      where: {
        projectId_key: {
          projectId,
          key
        }
      }
    });

    if (!checkpoint) {
      continue;
    }

    if (sourceKey === 'concept-title' && key === 'concept-paper' && !hasCheckpointActivity(checkpoint)) {
      continue;
    }

    const updatedCheckpoint = await db.milestoneCheckpoint.update({
      where: { id: checkpoint.id },
      data: {
        status: nextCheckpointStatus,
        [reviewField]: nextReviewStatus,
        reviewedAt,
        completedAt: nextCheckpointStatus === MilestoneCheckpointStatus.COMPLETED ? new Date() : null,
        latestFeedback: feedback || undefined,
        latestFeedbackBy: feedback ? reviewerName || 'Faculty Reviewer' : undefined,
        latestFeedbackAt: feedback ? new Date() : undefined
      }
    });

    await updateMilestoneRollup(db, updatedCheckpoint.milestoneId);
  }
}

export async function syncCheckpointReview(
  db: DbClient,
  {
    submissionId,
    nextStatus,
    reviewNotes,
    reviewerName,
    reviewerRole
  }: {
    submissionId: string;
    nextStatus: SubmissionStatus;
    reviewNotes?: string | null;
    reviewerName?: string | null;
    reviewerRole: UserRole;
  }
) {
  let submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      files: true,
      checkpoint: true
    }
  });

  if (!submission) {
    return null;
  }

  if (!submission.checkpointId) {
    const file = submission.files?.[0] ?? null;
    const checkpoint = await resolveMilestoneCheckpointForSubmission(db, {
      projectId: submission.projectId,
      documentCategory: file?.documentCategory,
      fileName: file?.fileName || submission.title
    });

    if (!checkpoint) {
      return null;
    }

    await db.submission.update({
      where: { id: submission.id },
      data: {
        milestoneId: checkpoint.milestoneId,
        checkpointId: checkpoint.id
      }
    });

    if (file?.id) {
      await db.uploadedFile.update({
        where: { id: file.id },
        data: { checkpointId: checkpoint.id }
      });
    }

    submission = {
      ...submission,
      milestoneId: checkpoint.milestoneId,
      checkpointId: checkpoint.id,
      checkpoint
    };
  }

  const nextCheckpointStatus = mapSubmissionStatusToCheckpointStatus(nextStatus);
  const nextReviewStatus = mapSubmissionStatusToReviewStatus(nextStatus);
  const reviewedAt = REVIEWED_SUBMISSION_STATUSES.has(nextStatus) ? new Date() : null;
  const reviewField = getReviewFieldForRole(reviewerRole);
  const feedback = String(reviewNotes ?? '').trim();

  const updatedCheckpoint = await db.milestoneCheckpoint.update({
    where: { id: submission.checkpointId },
    data: {
      status: nextCheckpointStatus,
      [reviewField]: nextReviewStatus,
      reviewedAt,
      completedAt: nextCheckpointStatus === MilestoneCheckpointStatus.COMPLETED ? new Date() : null,
      latestFeedback: feedback || undefined,
      latestFeedbackBy: feedback ? reviewerName || 'Faculty Reviewer' : undefined,
      latestFeedbackAt: feedback ? new Date() : undefined
    }
  });

  await updateMilestoneRollup(db, updatedCheckpoint.milestoneId);
  await syncCompanionReviewCheckpoints(db, {
    projectId: submission.projectId,
    sourceKey: submission.checkpoint?.key,
    nextStatus,
    reviewNotes,
    reviewerName,
    reviewerRole
  });

  return updatedCheckpoint;
}
