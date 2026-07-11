'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { StudentDashboardData } from '@/lib/services/student-workspace';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';
type StageKey = 'concept' | 'proposal' | 'development' | 'mock-defense' | 'final-defense' | 'completion';
type StageStatus = 'completed' | 'in-review' | 'needs-revision' | 'rejected' | 'pending' | 'locked';
type CheckpointStatus = 'completed' | 'in-review' | 'needs-revision' | 'rejected' | 'pending' | 'locked';
type ReviewStatus = 'approved' | 'in-review' | 'needs-revision' | 'rejected' | 'pending' | 'not-required';

type CheckpointBlueprint = {
  id: string;
  label: string;
  kind:
    | 'title-submitted'
    | 'concept-paper'
    | 'adviser-approval'
    | 'concept-presentation-scheduled'
    | 'concept-panel-approval'
    | 'chapters-uploaded'
    | 'adviser-review'
    | 'proposal-defense-scheduled'
    | 'panel-evaluation'
    | 'final-approval'
    | 'prototype-uploaded'
    | 'progress-report'
    | 'testing-evidence'
    | 'monitoring-approval'
    | 'presentation-uploaded'
    | 'mock-defense-scheduled'
    | 'panel-comments'
    | 'revisions-completed'
    | 'final-manuscript'
    | 'final-defense-scheduled'
    | 'panel-approval'
    | 'final-revisions'
    | 'approved-manuscript'
    | 'approval-sheet'
    | 'repository-submission'
    | 'archive-confirmation';
};

type StageBlueprint = {
  key: StageKey;
  title: string;
  summary: string;
  defaultTarget: string;
  route: string;
  actionLabel: string;
  icon: string;
  evidenceCategories: string[];
  evidenceKeywords: string[];
  scheduleKeywords: string[];
  feedbackKeywords: string[];
  checkpoints: CheckpointBlueprint[];
};

type StageEvidence = {
  id: string;
  fileName: string;
  fileType: string;
  sizeLabel: string;
  uploadDateLabel: string;
  reviewStatus: string;
};

type StageFeedback = {
  id: string;
  title: string;
  content: string;
  facultyName: string;
  mode: string;
  status: string;
  dateLabel: string;
};

type SavedCheckpoint = StudentDashboardData['milestoneCheckpoints'][number];

type BuiltCheckpoint = CheckpointBlueprint & {
  status: CheckpointStatus;
  note: string;
  recordId?: string;
  studentStartDate?: string;
  studentTargetDate?: string;
  completedAt?: string;
  submittedAt?: string;
  reviewedAt?: string;
};

type BuiltStage = {
  id: string;
  key: StageKey;
  index: number;
  title: string;
  summary: string;
  targetDate: string;
  route: string;
  actionLabel: string;
  icon: string;
  status: StageStatus;
  progress: number;
  isOverdue?: boolean;
  completedCheckpoints: number;
  checkpoints: BuiltCheckpoint[];
  evidence: StageEvidence[];
  adviserReview: ReviewStatus;
  panelReview: ReviewStatus;
  latestFeedback: StageFeedback | null;
};

const SCHEDULE_CHECKPOINT_KINDS = new Set<CheckpointBlueprint['kind']>([
  'concept-presentation-scheduled',
  'proposal-defense-scheduled',
  'mock-defense-scheduled',
  'final-defense-scheduled'
]);

const STUDENT_TASK_KINDS = new Set<CheckpointBlueprint['kind']>([
  'title-submitted',
  'concept-paper',
  'chapters-uploaded',
  'prototype-uploaded',
  'progress-report',
  'testing-evidence',
  'presentation-uploaded',
  'revisions-completed',
  'final-manuscript',
  'final-revisions',
  'approved-manuscript',
  'approval-sheet',
  'repository-submission'
]);

const STAGE_BLUEPRINTS: StageBlueprint[] = [
  {
    key: 'concept',
    title: 'Concept',
    summary: 'Define the research topic, problem scope, and initial capstone direction.',
    defaultTarget: 'Target set by adviser',
    route: '/students/title-submission',
    actionLabel: 'Open Title Submission',
    icon: 'fa-lightbulb',
    evidenceCategories: ['concept', 'title', 'title-submission', 'title-proposal', 'title proposal', 'concept-paper', 'concept paper', 'concept proposal'],
    evidenceKeywords: ['concept', 'title'],
    scheduleKeywords: ['concept', 'title', 'presentation', 'defense'],
    feedbackKeywords: ['concept', 'title'],
    checkpoints: [
      { id: 'concept-title', label: 'Title submitted', kind: 'title-submitted' },
      { id: 'concept-paper', label: 'Concept paper uploaded', kind: 'concept-paper' },
      { id: 'concept-adviser-approval', label: 'Adviser idea approval', kind: 'adviser-approval' },
      { id: 'concept-presentation-scheduled', label: 'Concept presentation scheduled', kind: 'concept-presentation-scheduled' },
      { id: 'concept-panel-approval', label: 'Panel concept approval', kind: 'concept-panel-approval' }
    ]
  },
  {
    key: 'proposal',
    title: 'Proposal',
    summary: 'Submit the formal project proposal for adviser and panel evaluation and approval.',
    defaultTarget: 'Proposal target pending',
    route: '/students/project-files',
    actionLabel: 'Upload Requirement',
    icon: 'fa-file-lines',
    evidenceCategories: ['proposal', 'chapters-1-3', 'manuscript', 'chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5'],
    evidenceKeywords: ['proposal', 'chapter 1', 'chapter 2', 'chapter 3', 'chapters 1-3'],
    scheduleKeywords: ['proposal', 'defense'],
    feedbackKeywords: ['proposal', 'chapter'],
    checkpoints: [
      { id: 'proposal-chapters', label: 'Chapters 1-3 uploaded', kind: 'chapters-uploaded' },
      { id: 'proposal-adviser-review', label: 'Adviser initial review', kind: 'adviser-review' },
      { id: 'proposal-defense-scheduled', label: 'Proposal defense scheduled', kind: 'proposal-defense-scheduled' },
      { id: 'proposal-panel-evaluation', label: 'Panel evaluation', kind: 'panel-evaluation' },
      { id: 'proposal-final-approval', label: 'Final approval', kind: 'final-approval' }
    ]
  },
  {
    key: 'development',
    title: 'Development',
    summary: 'Build the system, submit progress reports, and provide implementation evidence.',
    defaultTarget: 'Development target pending',
    route: '/students/project-overview',
    actionLabel: 'View Project',
    icon: 'fa-laptop-code',
    evidenceCategories: ['system-files', 'prototype', 'testing', 'development', 'progress-report'],
    evidenceKeywords: ['prototype', 'testing', 'test', 'system', 'development', 'progress report'],
    scheduleKeywords: ['development', 'monitoring', 'consultation'],
    feedbackKeywords: ['development', 'prototype', 'testing', 'progress'],
    checkpoints: [
      { id: 'development-prototype', label: 'Prototype uploaded', kind: 'prototype-uploaded' },
      { id: 'development-progress-report', label: 'Progress report submitted', kind: 'progress-report' },
      { id: 'development-testing-evidence', label: 'Testing evidence uploaded', kind: 'testing-evidence' },
      { id: 'development-adviser-monitoring', label: 'Adviser monitoring approval', kind: 'monitoring-approval' }
    ]
  },
  {
    key: 'mock-defense',
    title: 'Pre-Final Defense',
    summary: 'Present a practice defense, gather early feedback, and complete revisions.',
    defaultTarget: 'Pre-final defense target pending',
    route: '/students/schedule',
    actionLabel: 'Open Schedule',
    icon: 'fa-microphone-lines',
    evidenceCategories: ['presentation-files', 'mock-defense', 'pre-final-defense', 'revisions'],
    evidenceKeywords: ['presentation', 'mock', 'pre-final', 'defense', 'revision'],
    scheduleKeywords: ['mock', 'pre-final', 'practice', 'dry run', 'defense'],
    feedbackKeywords: ['mock', 'pre-final', 'defense', 'revision', 'panel'],
    checkpoints: [
      { id: 'mock-presentation', label: 'Presentation uploaded', kind: 'presentation-uploaded' },
      { id: 'mock-defense-scheduled', label: 'Pre-final defense scheduled', kind: 'mock-defense-scheduled' },
      { id: 'mock-panel-comments', label: 'Panel comments received', kind: 'panel-comments' },
      { id: 'mock-revisions-completed', label: 'Revisions completed', kind: 'revisions-completed' }
    ]
  },
  {
    key: 'final-defense',
    title: 'Final Defense',
    summary: 'Defend the completed project before the panel and submit final revisions.',
    defaultTarget: 'Final defense target pending',
    route: '/students/faculty-feedback',
    actionLabel: 'View Feedback',
    icon: 'fa-landmark',
    evidenceCategories: ['final-manuscript', 'presentation-files', 'final-defense', 'revisions'],
    evidenceKeywords: ['final manuscript', 'final defense', 'presentation', 'final revision'],
    scheduleKeywords: ['final', 'defense'],
    feedbackKeywords: ['final', 'defense', 'panel', 'revision'],
    checkpoints: [
      { id: 'final-manuscript', label: 'Final manuscript uploaded', kind: 'final-manuscript' },
      { id: 'final-defense-scheduled', label: 'Final defense scheduled', kind: 'final-defense-scheduled' },
      { id: 'final-panel-approval', label: 'Panel approval', kind: 'panel-approval' },
      { id: 'final-revisions-submitted', label: 'Final revisions submitted', kind: 'final-revisions' }
    ]
  },
  {
    key: 'completion',
    title: 'Completion',
    summary: 'Finalize approved deliverables, repository submission, and archive confirmation.',
    defaultTarget: 'Completion target pending',
    route: '/students/repository',
    actionLabel: 'Open Repository',
    icon: 'fa-graduation-cap',
    evidenceCategories: ['approved-manuscript', 'approval-sheet', 'repository', 'archive'],
    evidenceKeywords: ['approved manuscript', 'approval sheet', 'repository', 'archive'],
    scheduleKeywords: ['completion', 'archive'],
    feedbackKeywords: ['completion', 'approved', 'repository', 'archive'],
    checkpoints: [
      { id: 'completion-approved-manuscript', label: 'Approved manuscript uploaded', kind: 'approved-manuscript' },
      { id: 'completion-approval-sheet', label: 'Approval sheet uploaded', kind: 'approval-sheet' },
      { id: 'completion-repository-submission', label: 'Repository submission completed', kind: 'repository-submission' },
      { id: 'completion-archive-confirmation', label: 'Archive confirmation', kind: 'archive-confirmation' }
    ]
  }
];

function normalizeText(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function includesAny(value: string, keywords: string[]) {
  const normalized = normalizeText(value);
  return keywords.some((keyword) => normalized.includes(keyword));
}

function normalizeEvidenceText(value: unknown) {
  return normalizeText(value).replace(/[-_]+/g, ' ');
}

function isConceptStageEvidenceDocument(document: StudentDashboardData['documents'][number]) {
  const category = normalizeEvidenceText(document.category);
  const fileName = normalizeEvidenceText(document.fileName);

  return category === 'title' ||
    category.includes('title proposal') ||
    category.includes('title submission') ||
    category.includes('concept paper') ||
    category.includes('concept proposal') ||
    fileName.includes('title proposal') ||
    fileName.includes('title submission') ||
    fileName.includes('concept paper') ||
    fileName.includes('concept proposal');
}

function isConceptStageFeedback(feedback: StageFeedback) {
  const haystack = normalizeEvidenceText(`${feedback.title} ${feedback.content} ${feedback.mode}`);

  return haystack.includes('title proposal') ||
    haystack.includes('title submission') ||
    haystack.includes('concept paper') ||
    haystack.includes('concept proposal');
}

function isApprovedStatus(value?: string) {
  const normalized = normalizeText(value);
  return normalized.includes('approved') || normalized.includes('completed') || normalized.includes('complete') || normalized.includes('accepted');
}

function isRevisionStatus(value?: string) {
  const normalized = normalizeText(value);
  return normalized.includes('needs revision') || normalized.includes('revision') || normalized.includes('rejected') || normalized.includes('delayed');
}

function isReviewStatus(value?: string) {
  const normalized = normalizeText(value);
  return normalized.includes('review') || normalized.includes('ongoing') || normalized.includes('current') || normalized.includes('active');
}

function normalizeStageStatus(value?: string): StageStatus | null {
  if (!value) return null;
  const normalized = normalizeText(value);
  if (isApprovedStatus(value)) return 'completed';
  if (isRevisionStatus(value)) return 'needs-revision';
  if (normalized.includes('in_progress') || normalized.includes('submitted') || normalized.includes('under_review')) return 'in-review';
  if (isReviewStatus(value)) return 'in-review';
  if (normalized.includes('pending')) return 'pending';
  return null;
}

function formatStageStatus(status: StageStatus) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in-review':
      return 'In Review';
    case 'needs-revision':
      return 'Needs Revision';
    case 'rejected':
      return 'Rejected';
    case 'locked':
      return 'Locked';
    default:
      return 'Pending';
  }
}

function getStatusTone(status: StageStatus | CheckpointStatus | ReviewStatus): BadgeTone {
  if (status === 'completed' || status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'needs-revision' || status === 'in-review' || status === 'pending') return 'warning';
  return 'neutral';
}

function getReviewLabel(status: ReviewStatus) {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'in-review':
      return 'In Review';
    case 'needs-revision':
      return 'Needs Revision';
    case 'rejected':
      return 'Rejected';
    case 'pending':
      return 'Pending';
    case 'not-required':
      return 'Not Required';
    default:
      return 'Pending';
  }
}

function getCheckpointLabel(status: CheckpointStatus) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in-review':
      return 'In Review';
    case 'needs-revision':
      return 'Needs Revision';
    case 'rejected':
      return 'Rejected';
    case 'locked':
      return 'Locked';
    default:
      return 'Pending';
  }
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getStageDocuments(stage: StageBlueprint, data: StudentDashboardData): StageEvidence[] {
  const documents = data.documents.filter((document) => {
    if (isConceptStageEvidenceDocument(document)) {
      return stage.key === 'concept';
    }

    const category = normalizeEvidenceText(document.category);
    
    // Exact category match
    if (stage.evidenceCategories.some((item) => category === normalizeEvidenceText(item))) {
      return true;
    }

    // Prevent fuzzy matching if it strictly belongs to another stage
    const matchesOtherStageCategory = STAGE_BLUEPRINTS.some(otherStage => 
      otherStage.key !== stage.key && otherStage.evidenceCategories.some(item => category === normalizeEvidenceText(item))
    );
    if (matchesOtherStageCategory) {
      return false;
    }

    const haystack = `${document.fileName} ${document.fileType} ${document.category}`;
    return includesAny(haystack, stage.evidenceKeywords);
  });

  const titleAttachments =
    stage.key === 'concept'
      ? data.titleRegistration.attachments.map((attachment) => ({
          id: attachment.id,
          fileName: attachment.fileName,
          fileType: attachment.fileType,
          sizeLabel: attachment.sizeLabel,
          uploadDateLabel: attachment.uploadedAtLabel,
          reviewStatus: attachment.status
        }))
      : [];

  return [...titleAttachments, ...documents].map((item) => ({
    id: item.id,
    fileName: item.fileName,
    fileType: item.fileType,
    sizeLabel: item.sizeLabel,
    uploadDateLabel: item.uploadDateLabel,
    reviewStatus: item.reviewStatus
  }));
}

function getStageSchedules(stage: StageBlueprint, data: StudentDashboardData) {
  return data.schedules.filter((schedule) => {
    const haystack = `${schedule.title} ${schedule.type} ${schedule.description}`;
    return includesAny(haystack, stage.scheduleKeywords);
  });
}

function getStageFeedback(stage: StageBlueprint, data: StudentDashboardData): StageFeedback[] {
  return data.feedback.filter((feedback) => {
    if (isConceptStageFeedback(feedback)) {
      return stage.key === 'concept';
    }

    const haystack = `${feedback.title} ${feedback.content} ${feedback.submissionTitle ?? ''} ${feedback.mode}`;
    return includesAny(haystack, stage.feedbackKeywords);
  });
}

function hasApprovedDocument(evidence: StageEvidence[]) {
  return evidence.some((item) => isApprovedStatus(item.reviewStatus));
}

function hasSubmittedTitle(data: StudentDashboardData) {
  return Boolean(
    data.titleRegistration.proposedTitle ||
      data.titleRegistration.submissions?.length ||
      data.titleRegistration.status?.toLowerCase() === 'submitted'
  );
}

function hasRepositorySubmission(data: StudentDashboardData) {
  const status = normalizeText(data.project.repositoryStatus);
  return Boolean(status && status !== 'n/a' && status !== 'not submitted' && status !== 'draft');
}

function formatSavedDate(value?: string) {
  if (!value) return '';

  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch {
    return '';
  }
}

function mapSavedCheckpointStatus(status?: string): CheckpointStatus {
  const normalized = normalizeText(status).replace(/_/g, '-');
  if (normalized.includes('completed') || normalized.includes('approved')) return 'completed';
  if (normalized.includes('rejected')) return 'rejected';
  if (normalized.includes('needs-revision')) return 'needs-revision';
  if (normalized.includes('in-review') || normalized.includes('submitted') || normalized.includes('under-review')) return 'in-review';
  if (normalized.includes('locked')) return 'locked';
  return 'pending';
}

function mapSavedReviewStatus(status?: string): ReviewStatus {
  const normalized = normalizeText(status).replace(/_/g, '-');
  if (normalized.includes('not-required')) return 'not-required';
  if (normalized.includes('approved') || normalized.includes('completed')) return 'approved';
  if (normalized.includes('rejected')) return 'rejected';
  if (normalized.includes('needs-revision')) return 'needs-revision';
  if (normalized.includes('in-review') || normalized.includes('submitted') || normalized.includes('under-review')) return 'in-review';
  return 'pending';
}

function isPendingCheckpointFeedback(value?: string) {
  const normalized = normalizeText(value);

  return normalized.includes('pending adviser review') ||
    normalized.includes('waiting for review') ||
    normalized.includes('review is in progress');
}

function getSavedCheckpointNote(record: SavedCheckpoint, status: CheckpointStatus) {
  if (record.latestFeedback && !(status === 'completed' && isPendingCheckpointFeedback(record.latestFeedback))) {
    return record.latestFeedback;
  }

  if (status === 'completed') {
    return record.completedAt
      ? `Completed on ${formatSavedDate(record.completedAt)}.`
      : 'Completed and saved in checkpoint tracking.';
  }

  if (status === 'needs-revision') {
    return record.reviewedAt
      ? `Revision requested on ${formatSavedDate(record.reviewedAt)}.`
      : 'Revision requested by faculty.';
  }

  if (status === 'in-review') {
    return record.submittedAt
      ? `Submitted on ${formatSavedDate(record.submittedAt)} and waiting for review.`
      : 'Submitted and waiting for review.';
  }

  return 'Waiting for requirement submission.';
}

function buildCheckpointRecordMap(data: StudentDashboardData) {
  return new Map(data.milestoneCheckpoints.map((checkpoint) => [checkpoint.key, checkpoint]));
}

function getPersistedStageReviewStatus(records: SavedCheckpoint[], reviewKey: 'adviserReviewStatus' | 'panelReviewStatus') {
  if (!records.length) return null;
  const statuses = records.map((record) => mapSavedReviewStatus(record[reviewKey]));
  if (statuses.includes('needs-revision')) return 'needs-revision';
  if (statuses.includes('in-review')) return 'in-review';
  const requiredStatuses = statuses.filter((status) => status !== 'not-required');
  if (!requiredStatuses.length) return 'not-required';
  if (requiredStatuses.every((status) => status === 'approved')) return 'approved';
  if (requiredStatuses.some((status) => status === 'approved')) return 'in-review';
  return 'pending';
}

function getCheckpointStatus(
  checkpoint: CheckpointBlueprint,
  stage: StageBlueprint,
  data: StudentDashboardData,
  evidence: StageEvidence[],
  schedules: StudentDashboardData['schedules'],
  feedback: StageFeedback[],
  rawStageStatus: StageStatus | null,
  record?: SavedCheckpoint
): BuiltCheckpoint {
  if (record) {
    const savedStatus = mapSavedCheckpointStatus(record.status);
    const status = checkpoint.kind === 'concept-paper' && hasApprovedDocument(evidence)
      ? 'completed'
      : savedStatus;

    return {
      ...checkpoint,
      status,
      note: getSavedCheckpointNote(record, status),
      recordId: record.id,
      studentStartDate: record.studentStartDate,
      studentTargetDate: record.studentTargetDate,
      completedAt: record.completedAt,
      submittedAt: record.submittedAt,
      reviewedAt: record.reviewedAt
    };
  }

  if (rawStageStatus === 'completed') {
    return { ...checkpoint, status: 'completed', note: 'Cleared for this stage.' };
  }

  const hasEvidence = evidence.length > 0;
  const adviserFeedback = feedback.find((item) => normalizeText(item.mode).includes('adviser'));
  const panelFeedback = feedback.find((item) => normalizeText(item.mode).includes('panel'));
  const revisionFeedback = feedback.find((item) => isRevisionStatus(item.status) || isRevisionStatus(item.content));
  const approvedFeedback = feedback.find((item) => isApprovedStatus(item.status));

  switch (checkpoint.kind) {
    case 'title-submitted':
      return hasSubmittedTitle(data)
        ? { ...checkpoint, status: 'completed', note: 'Project title has been submitted.' }
        : { ...checkpoint, status: 'pending', note: 'Waiting for title submission.' };
    case 'concept-paper':
      return hasEvidence
        ? { ...checkpoint, status: hasApprovedDocument(evidence) ? 'completed' : 'in-review', note: 'Concept evidence is attached.' }
        : { ...checkpoint, status: 'pending', note: 'Upload the concept paper.' };
    case 'adviser-approval':
      if (isApprovedStatus(data.titleRegistration.registrationStatus)) {
        return { ...checkpoint, status: 'completed', note: 'Adviser cleared the idea for concept presentation.' };
      }
      return hasSubmittedTitle(data)
        ? { ...checkpoint, status: 'in-review', note: 'Adviser review is in progress.' }
        : { ...checkpoint, status: 'pending', note: 'Requires title and concept evidence first.' };
    case 'concept-presentation-scheduled':
      return schedules.length
        ? { ...checkpoint, status: 'completed', note: schedules[0].startDateLabel }
        : isApprovedStatus(data.titleRegistration.registrationStatus)
          ? { ...checkpoint, status: 'pending', note: 'Ready to request or wait for concept presentation schedule.' }
          : { ...checkpoint, status: 'locked', note: 'Adviser idea approval is required first.' };
    case 'concept-panel-approval':
      if (feedback.some((item) => normalizeText(item.mode).includes('panel') && isApprovedStatus(item.status))) {
        return { ...checkpoint, status: 'completed', note: 'Panel approved the concept after presentation.' };
      }
      if (feedback.some((item) => normalizeText(item.mode).includes('panel') && isRevisionStatus(item.status))) {
        return { ...checkpoint, status: 'needs-revision', note: 'Panel requested concept revisions.' };
      }
      return schedules.length
        ? { ...checkpoint, status: 'in-review', note: 'Waiting for panel concept approval.' }
        : { ...checkpoint, status: 'pending', note: 'Requires concept presentation first.' };
    case 'chapters-uploaded':
      return hasEvidence
        ? { ...checkpoint, status: 'completed', note: `${evidence.length} proposal file${evidence.length === 1 ? '' : 's'} submitted.` }
        : { ...checkpoint, status: 'pending', note: 'Upload Chapters 1-3.' };
    case 'adviser-review':
      if (revisionFeedback) return { ...checkpoint, status: 'needs-revision', note: 'Adviser feedback requires revision.' };
      if (adviserFeedback || approvedFeedback) return { ...checkpoint, status: 'completed', note: 'Adviser review has been logged.' };
      return hasEvidence
        ? { ...checkpoint, status: 'in-review', note: 'Waiting for adviser review.' }
        : { ...checkpoint, status: 'pending', note: 'Submit proposal files first.' };
    case 'proposal-defense-scheduled':
      return schedules.length
        ? { ...checkpoint, status: 'completed', note: schedules[0].startDateLabel }
        : { ...checkpoint, status: 'pending', note: 'No proposal defense schedule yet.' };
    case 'panel-evaluation':
      if (panelFeedback) return { ...checkpoint, status: isRevisionStatus(panelFeedback.status) ? 'needs-revision' : 'completed', note: 'Panel evaluation is recorded.' };
      return schedules.length
        ? { ...checkpoint, status: 'in-review', note: 'Panel evaluation pending after schedule.' }
        : { ...checkpoint, status: 'pending', note: 'Requires scheduled defense.' };
    case 'final-approval':
      if (approvedFeedback || hasApprovedDocument(evidence)) return { ...checkpoint, status: 'completed', note: 'Final proposal approval is recorded.' };
      return panelFeedback
        ? { ...checkpoint, status: 'in-review', note: 'Final approval is being evaluated.' }
        : { ...checkpoint, status: 'pending', note: 'Requires panel evaluation.' };
    case 'prototype-uploaded':
      return hasEvidence
        ? { ...checkpoint, status: 'completed', note: 'Prototype evidence is available.' }
        : { ...checkpoint, status: 'pending', note: 'Upload prototype evidence.' };
    case 'progress-report':
      return data.progressReports.length
        ? { ...checkpoint, status: 'completed', note: `${data.progressReports.length} progress report${data.progressReports.length === 1 ? '' : 's'} submitted.` }
        : { ...checkpoint, status: 'pending', note: 'Submit a progress report.' };
    case 'testing-evidence':
      return evidence.some((item) => includesAny(item.fileName, ['test', 'testing', 'qa', 'evaluation']))
        ? { ...checkpoint, status: 'completed', note: 'Testing evidence is attached.' }
        : hasEvidence
          ? { ...checkpoint, status: 'in-review', note: 'Development evidence is under review.' }
          : { ...checkpoint, status: 'pending', note: 'Upload testing evidence.' };
    case 'monitoring-approval':
      if (adviserFeedback && isRevisionStatus(adviserFeedback.status)) return { ...checkpoint, status: 'needs-revision', note: 'Adviser monitoring needs revision.' };
      return adviserFeedback || hasApprovedDocument(evidence)
        ? { ...checkpoint, status: 'completed', note: 'Adviser monitoring is cleared.' }
        : data.progressReports.length
          ? { ...checkpoint, status: 'in-review', note: 'Monitoring approval is pending.' }
          : { ...checkpoint, status: 'pending', note: 'Requires progress evidence.' };
    case 'presentation-uploaded':
      return hasEvidence
        ? { ...checkpoint, status: 'completed', note: 'Presentation file is uploaded.' }
        : { ...checkpoint, status: 'pending', note: 'Upload the presentation deck.' };
    case 'mock-defense-scheduled':
      return schedules.length
        ? { ...checkpoint, status: 'completed', note: schedules[0].startDateLabel }
        : { ...checkpoint, status: 'pending', note: 'Pre-final defense is not scheduled.' };
    case 'panel-comments':
      return panelFeedback
        ? { ...checkpoint, status: 'completed', note: 'Panel comments have been received.' }
        : schedules.length
          ? { ...checkpoint, status: 'in-review', note: 'Waiting for panel comments.' }
          : { ...checkpoint, status: 'pending', note: 'Requires pre-final defense schedule.' };
    case 'revisions-completed':
      if (revisionFeedback) return { ...checkpoint, status: 'needs-revision', note: 'Revisions are still open.' };
      return approvedFeedback
        ? { ...checkpoint, status: 'completed', note: 'Revisions are marked complete.' }
        : panelFeedback
          ? { ...checkpoint, status: 'in-review', note: 'Revision completion is being checked.' }
          : { ...checkpoint, status: 'pending', note: 'Waiting for panel comments.' };
    case 'final-manuscript':
      return hasEvidence
        ? { ...checkpoint, status: 'completed', note: 'Final manuscript is uploaded.' }
        : { ...checkpoint, status: 'pending', note: 'Upload the final manuscript.' };
    case 'final-defense-scheduled':
      return schedules.length
        ? { ...checkpoint, status: 'completed', note: schedules[0].startDateLabel }
        : { ...checkpoint, status: 'pending', note: 'Final defense is not scheduled.' };
    case 'panel-approval':
      if (panelFeedback && isApprovedStatus(panelFeedback.status)) return { ...checkpoint, status: 'completed', note: 'Panel approval is recorded.' };
      if (panelFeedback && isRevisionStatus(panelFeedback.status)) return { ...checkpoint, status: 'needs-revision', note: 'Panel requires revision.' };
      return schedules.length
        ? { ...checkpoint, status: 'in-review', note: 'Panel approval pending.' }
        : { ...checkpoint, status: 'pending', note: 'Requires final defense schedule.' };
    case 'final-revisions':
      if (revisionFeedback) return { ...checkpoint, status: 'needs-revision', note: 'Final revisions are still open.' };
      return approvedFeedback || hasApprovedDocument(evidence)
        ? { ...checkpoint, status: 'completed', note: 'Final revisions are submitted.' }
        : panelFeedback
          ? { ...checkpoint, status: 'in-review', note: 'Final revisions are being validated.' }
          : { ...checkpoint, status: 'pending', note: 'Requires panel decision first.' };
    case 'approved-manuscript':
      return evidence.some((item) => includesAny(item.fileName, ['approved', 'manuscript']) || isApprovedStatus(item.reviewStatus))
        ? { ...checkpoint, status: 'completed', note: 'Approved manuscript is attached.' }
        : { ...checkpoint, status: 'pending', note: 'Upload approved manuscript.' };
    case 'approval-sheet':
      return evidence.some((item) => includesAny(item.fileName, ['approval sheet', 'approval']))
        ? { ...checkpoint, status: 'completed', note: 'Approval sheet is attached.' }
        : { ...checkpoint, status: 'pending', note: 'Upload approval sheet.' };
    case 'repository-submission':
      return hasRepositorySubmission(data)
        ? { ...checkpoint, status: 'completed', note: data.project.repositoryStatus }
        : { ...checkpoint, status: 'pending', note: 'Repository submission is not complete.' };
    case 'archive-confirmation':
      return isApprovedStatus(data.project.repositoryStatus)
        ? { ...checkpoint, status: 'completed', note: 'Archive confirmation is recorded.' }
        : hasRepositorySubmission(data)
          ? { ...checkpoint, status: 'in-review', note: 'Archive confirmation is pending.' }
          : { ...checkpoint, status: 'pending', note: 'Requires repository submission.' };
    default:
      return { ...checkpoint, status: 'pending', note: 'Waiting for requirement update.' };
  }
}

function getReviewStatus(stage: StageBlueprint, feedback: StageFeedback[], evidence: StageEvidence[], kind: 'adviser' | 'panel'): ReviewStatus {
  const reviewerFeedback = feedback.find((item) => normalizeText(item.mode).includes(kind));
  if (reviewerFeedback) {
    if (isRevisionStatus(reviewerFeedback.status) || isRevisionStatus(reviewerFeedback.content)) return 'needs-revision';
    if (isApprovedStatus(reviewerFeedback.status)) return 'approved';
    return 'in-review';
  }

  if (hasApprovedDocument(evidence)) return 'approved';
  if (evidence.length) return 'in-review';
  return 'pending';
}

function buildStages(data: StudentDashboardData): BuiltStage[] {
  const milestoneMap = new Map(data.milestones.map((item) => [normalizeText(item.title), item]));
  const workflowMap = new Map(data.dashboard?.workflow.map((item) => [normalizeText(item.title), item]) ?? []);
  const checkpointRecordMap = buildCheckpointRecordMap(data);
  const activeMilestone = normalizeText(data.project.currentMilestone);

  const rawStages = STAGE_BLUEPRINTS.map((stage, index) => {
    const milestone = milestoneMap.get(normalizeText(stage.title));
    const workflowStep = workflowMap.get(normalizeText(stage.title));
    const rawStatus =
      normalizeStageStatus(milestone?.status) ||
      normalizeStageStatus(workflowStep?.status) ||
      (activeMilestone && activeMilestone === normalizeText(stage.title) ? 'in-review' : null);
    const evidence = getStageDocuments(stage, data);
    const schedules = getStageSchedules(stage, data);
    const feedback = getStageFeedback(stage, data);
    const checkpointRecords = stage.checkpoints
      .map((checkpoint) => checkpointRecordMap.get(checkpoint.id))
      .filter((checkpoint): checkpoint is SavedCheckpoint => Boolean(checkpoint));
    const checkpoints = stage.checkpoints.map((checkpoint) =>
      getCheckpointStatus(checkpoint, stage, data, evidence, schedules, feedback, rawStatus, checkpointRecordMap.get(checkpoint.id))
    );
    const completedCheckpoints = checkpoints.filter((checkpoint) => checkpoint.status === 'completed').length;

    return {
      blueprint: stage,
      index,
      milestone,
      workflowStep,
      rawStatus,
      evidence,
      schedules,
      feedback,
      checkpointRecords,
      checkpoints,
      completedCheckpoints
    };
  });

  const explicitActiveIndex = rawStages.findIndex((stage) => stage.rawStatus === 'in-review' || stage.rawStatus === 'needs-revision');
  const currentIndex =
    explicitActiveIndex >= 0
      ? explicitActiveIndex
      : Math.max(
          0,
          rawStages.findIndex((stage) => stage.completedCheckpoints < stage.checkpoints.length && stage.rawStatus !== 'completed')
        );

  return rawStages.map((stage) => {
    const allCheckpointsComplete = stage.completedCheckpoints === stage.checkpoints.length;
    const hasRevision = stage.checkpoints.some((checkpoint) => checkpoint.status === 'needs-revision');
    const hasRejection = stage.checkpoints.some((checkpoint) => checkpoint.status === 'rejected');
    const hasReview = stage.checkpoints.some((checkpoint) => checkpoint.status === 'in-review');
    let status: StageStatus;

    if (stage.rawStatus === 'completed' || (stage.index < currentIndex && !hasRevision && !hasRejection)) {
      status = 'completed';
    } else if (stage.index > currentIndex) {
      status = 'locked';
    } else if (stage.rawStatus === 'rejected' || hasRejection) {
      status = 'rejected';
    } else if (stage.rawStatus === 'needs-revision' || hasRevision) {
      status = 'needs-revision';
    } else if (allCheckpointsComplete) {
      status = 'completed';
    } else if (stage.rawStatus === 'in-review' || hasReview || stage.completedCheckpoints > 0) {
      status = 'in-review';
    } else {
      status = 'pending';
    }

    const progress = allCheckpointsComplete
      ? 100
      : clampPercent((stage.completedCheckpoints / Math.max(stage.checkpoints.length, 1)) * 100);
    const latestCheckpointFeedback = [...stage.checkpointRecords]
      .filter((checkpoint) => checkpoint.latestFeedback)
      .sort((left, right) => new Date(right.latestFeedbackAt || right.reviewedAt || right.submittedAt || 0).getTime() - new Date(left.latestFeedbackAt || left.reviewedAt || left.submittedAt || 0).getTime())[0];

    const targetDateStr = stage.milestone?.dateLabel || stage.workflowStep?.dateLabel || stage.blueprint.defaultTarget;
    // Basic date parsing to check if overdue, ignoring placeholder text
    const parsedDate = new Date(targetDateStr);
    const isOverdue = status !== 'completed' && 
                      status !== 'locked' && 
                      !isNaN(parsedDate.getTime()) && 
                      parsedDate.getTime() < Date.now();

    return {
      id: stage.milestone?.id || stage.workflowStep?.id || `stage-${stage.blueprint.key}`,
      key: stage.blueprint.key,
      index: stage.index,
      title: stage.blueprint.title,
      summary: stage.milestone?.summary || stage.workflowStep?.summary || stage.blueprint.summary,
      targetDate: stage.milestone?.dateLabel || stage.workflowStep?.dateLabel || stage.blueprint.defaultTarget,
      route: stage.milestone?.route || stage.workflowStep?.route || stage.blueprint.route,
      actionLabel: stage.milestone?.actionLabel || stage.workflowStep?.actionLabel || stage.blueprint.actionLabel,
      icon: stage.blueprint.icon,
      status,
      progress,
      isOverdue,
      completedCheckpoints: stage.completedCheckpoints,
      checkpoints: status === 'locked'
        ? stage.checkpoints.map((checkpoint) => ({ ...checkpoint, status: 'locked' as const, note: 'Complete the previous stage to unlock this requirement.' }))
        : stage.checkpoints,
      evidence: stage.evidence,
      adviserReview: status === 'completed'
        ? 'approved'
        : getPersistedStageReviewStatus(stage.checkpointRecords, 'adviserReviewStatus') || getReviewStatus(stage.blueprint, stage.feedback, stage.evidence, 'adviser'),
      panelReview: status === 'completed'
        ? 'approved'
        : getPersistedStageReviewStatus(stage.checkpointRecords, 'panelReviewStatus') || getReviewStatus(stage.blueprint, stage.feedback, stage.evidence, 'panel'),
      latestFeedback: latestCheckpointFeedback
        ? {
            id: latestCheckpointFeedback.id,
            title: `Feedback on ${latestCheckpointFeedback.title}`,
            content: latestCheckpointFeedback.latestFeedback || '',
            facultyName: latestCheckpointFeedback.latestFeedbackBy || 'Faculty',
            mode: 'Checkpoint Review',
            status: latestCheckpointFeedback.status,
            dateLabel: formatSavedDate(latestCheckpointFeedback.latestFeedbackAt || latestCheckpointFeedback.reviewedAt)
          }
        : stage.feedback[0] || null
    };
  });
}

function buildRecentActivities(data: StudentDashboardData, stages: BuiltStage[]) {
  const documentActivities = data.documents.slice(0, 5).map((item) => ({
    id: `document-${item.id}`,
    date: item.created_at,
    label: `${item.fileName} uploaded`,
    meta: item.uploadDateLabel,
    icon: 'fa-file-arrow-up',
    tone: 'info'
  }));

  const feedbackActivities = data.feedback.slice(0, 5).map((item) => ({
    id: `feedback-${item.id}`,
    date: item.created_at,
    label: `${item.facultyName} added feedback`,
    meta: item.dateLabel,
    icon: item.status === 'Needs Revision' ? 'fa-triangle-exclamation' : 'fa-comments',
    tone: item.status === 'Needs Revision' ? 'danger' : 'warning'
  }));

  const milestoneActivities = stages
    .filter((stage) => stage.status === 'completed' || stage.status === 'in-review' || stage.status === 'needs-revision')
    .map((stage) => ({
      id: `stage-${stage.id}`,
      date: '',
      label: `${stage.title} is ${formatStageStatus(stage.status).toLowerCase()}`,
      meta: stage.targetDate,
      icon: stage.status === 'completed' ? 'fa-circle-check' : 'fa-timeline',
      tone: stage.status === 'completed' ? 'success' : 'warning'
    }));

  return [...documentActivities, ...feedbackActivities, ...milestoneActivities]
    .sort((left, right) => {
      const leftTime = left.date ? new Date(left.date).getTime() : 0;
      const rightTime = right.date ? new Date(right.date).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 4);
}

function buildUpcomingDeadlines(data: StudentDashboardData, stages: BuiltStage[]) {
  const scheduleDeadlines = data.schedules
    .filter((schedule) => !schedule.isCompleted)
    .slice(0, 4)
    .map((schedule) => ({
      id: `schedule-${schedule.id}`,
      title: schedule.title,
      date: schedule.startDateLabel,
      meta: schedule.type,
      icon: 'fa-calendar-day',
      tone: schedule.priority === 'high' ? 'danger' : 'warning'
    }));

  const stageDeadlines = stages
    .filter((stage) => stage.status !== 'completed')
    .slice(0, 4)
    .map((stage) => ({
      id: `stage-deadline-${stage.id}`,
      title: `${stage.title} target`,
      date: stage.targetDate,
      meta: formatStageStatus(stage.status),
      icon: stage.status === 'locked' ? 'fa-lock' : 'fa-flag',
      tone: stage.status === 'needs-revision' ? 'danger' : 'warning'
    }));

  return [...scheduleDeadlines, ...stageDeadlines].slice(0, 4);
}

function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: string }) {
  return (
    <span className={`milestone-status-badge is-${tone}`}>
      {icon ? <i className={`fas ${icon}`} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

function CheckpointIcon({ status }: { status: CheckpointStatus }) {
  const iconByStatus: Record<CheckpointStatus, string> = {
    completed: 'fa-check',
    'in-review': 'fa-clock',
    'needs-revision': 'fa-exclamation',
    rejected: 'fa-xmark',
    pending: 'fa-circle',
    locked: 'fa-lock'
  };

  return (
    <span className={`milestone-check-icon is-${status}`} aria-hidden="true">
      <i className={`fas ${iconByStatus[status]}`} />
    </span>
  );
}

function ReviewPill({ label, status }: { label: string; status: ReviewStatus }) {
  return (
    <div className="milestone-review-row">
      <span>{label}</span>
      <Badge label={getReviewLabel(status)} tone={getStatusTone(status)} />
    </div>
  );
}

function StageAction({ stage }: { stage: BuiltStage }) {
  if (stage.status === 'locked') {
    return (
      <button className="milestone-action-button is-disabled" type="button" disabled>
        <i className="fas fa-lock" aria-hidden="true" />
        Locked
      </button>
    );
  }

  const label = stage.status === 'completed' ? 'View Completed Stage' : stage.actionLabel;

  return (
    <Link prefetch={false} className="milestone-action-button" href={stage.route}>
      <i className={`fas ${stage.status === 'completed' ? 'fa-circle-check' : 'fa-arrow-up-right-from-square'}`} aria-hidden="true" />
      {label}
    </Link>
  );
}

function StageDetails({ stage }: { stage: BuiltStage }) {
  return (
    <div className="milestone-stage-details">
      <div className="milestone-stage-column">
        <div className="milestone-stage-column-head">
          <span>Stage Checkpoints</span>
          <strong>{stage.completedCheckpoints}/{stage.checkpoints.length} complete</strong>
        </div>
        <div className="milestone-checklist">
          {stage.checkpoints.map((checkpoint) => (
            <div key={checkpoint.id} className={`milestone-checkpoint-row is-${checkpoint.status}`}>
              <CheckpointIcon status={checkpoint.status} />
              <div>
                <strong>{checkpoint.label}</strong>
                <span>{checkpoint.note}</span>
              </div>
              <small>{getCheckpointLabel(checkpoint.status)}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="milestone-stage-column">
        <div className="milestone-stage-column-head">
          <span>Requirements & Evidence</span>
          <strong>{stage.evidence.length} submitted</strong>
        </div>
        {stage.evidence.length ? (
          <div className="milestone-evidence-list">
            {stage.evidence.slice(0, 3).map((item) => (
              <div key={item.id} className="milestone-evidence-item">
                <span className="milestone-evidence-icon" aria-hidden="true">
                  <i className="fas fa-file-lines" />
                </span>
                <div>
                  <strong>{item.fileName}</strong>
                  <small>{item.uploadDateLabel} · {item.sizeLabel}</small>
                </div>
                <Badge label={item.reviewStatus || 'Submitted'} tone={getStatusTone(isApprovedStatus(item.reviewStatus) ? 'completed' : isRevisionStatus(item.reviewStatus) ? 'needs-revision' : 'in-review')} />
              </div>
            ))}
          </div>
        ) : (
          <div className="milestone-empty-state">
            <i className="fas fa-file-circle-plus" aria-hidden="true" />
            <span>No file or evidence submitted for this stage yet.</span>
          </div>
        )}
      </div>

      <div className="milestone-stage-column">
        <div className="milestone-stage-column-head">
          <span>Review & Feedback</span>
          <strong>{stage.targetDate}</strong>
        </div>
        <div className="milestone-review-panel">
          <ReviewPill label="Adviser review" status={stage.adviserReview} />
          <ReviewPill label="Panel review" status={stage.panelReview} />

          <div className="milestone-latest-feedback">
            <span>Latest feedback</span>
            {stage.latestFeedback ? (
              <>
                <strong>{stage.latestFeedback.title}</strong>
                <p>{stage.latestFeedback.content}</p>
                <small>{stage.latestFeedback.facultyName} · {stage.latestFeedback.dateLabel}</small>
              </>
            ) : (
              <p>No feedback recorded for this stage yet.</p>
            )}
          </div>

          <div className="milestone-stage-gate">
            <div>
              <span>Stage gate</span>
              <strong>{stage.completedCheckpoints}/{stage.checkpoints.length} requirements cleared</strong>
            </div>
            <StageAction stage={stage} />
          </div>
        </div>
      </div>
    </div>
  );
}

function getActiveScheduleAction(stage?: BuiltStage) {
  if (!stage || stage.status === 'locked') {
    return null;
  }

  const scheduleCheckpoint = stage.checkpoints.find((checkpoint) =>
    SCHEDULE_CHECKPOINT_KINDS.has(checkpoint.kind)
  );

  if (!scheduleCheckpoint || scheduleCheckpoint.status === 'locked') {
    return null;
  }

  return {
    label: scheduleCheckpoint.status === 'completed' ? 'Open Schedule' : `Open ${stage.title} Schedule`
  };
}

export function StudentTimeline({ data }: { data: StudentDashboardData }) {
  const stages = useMemo(() => buildStages(data), [data]);
  const activeStage =
    stages.find((stage) => stage.status === 'in-review' || stage.status === 'needs-revision' || stage.status === 'pending') ||
    [...stages].reverse().find((stage) => stage.status === 'completed') ||
    stages[0];
  const activeIndex = activeStage?.index ?? 0;
  const nextStage = stages.find((stage) => stage.index > activeIndex && stage.status !== 'completed') || null;
  const completedStages = stages.filter((stage) => stage.status === 'completed').length;
  const lockedStages = stages.filter((stage) => stage.status === 'locked').length;
  const inReviewStages = stages.filter((stage) => stage.status === 'in-review' || stage.status === 'needs-revision' || stage.status === 'pending').length;
  const overallProgress = data.project.progressPercentage || clampPercent((completedStages / Math.max(stages.length, 1)) * 100);
  const recentActivities = useMemo(() => buildRecentActivities(data, stages), [data, stages]);
  const upcomingDeadlines = useMemo(() => buildUpcomingDeadlines(data, stages), [data, stages]);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(() => new Set(activeStage ? [activeStage.key] : ['concept']));
  const [viewMode, setViewMode] = useState<'roadmap' | 'gantt'>('roadmap');
  const [targetDatesOverrides, setTargetDatesOverrides] = useState<Record<string, string>>({});
  const [startDatesOverrides, setStartDatesOverrides] = useState<Record<string, string>>({});
  const progressStyle = { '--progress': `${activeStage?.progress ?? 0}%` } as CSSProperties;
  const scheduleAction = getActiveScheduleAction(activeStage);

  const handleUpdateTargetDate = async (checkpointId: string, recordId: string | undefined, dateValue: string) => {
    if (!recordId) {
      alert("This checkpoint has not been initialized in the database yet.");
      return;
    }
    
    setTargetDatesOverrides(prev => ({ ...prev, [checkpointId]: dateValue }));
    
    try {
      const res = await fetch('/api/checkpoints/target-date', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpointId: recordId, targetDate: dateValue || null })
      });
      if (!res.ok) throw new Error("Failed to save date");
    } catch (error) {
      alert("Failed to save target date. Please try again.");
    }
  };

  const handleUpdateStartDate = async (checkpointId: string, recordId: string | undefined, dateValue: string) => {
    if (!recordId) {
      alert("This checkpoint has not been initialized in the database yet.");
      return;
    }
    
    setStartDatesOverrides(prev => ({ ...prev, [checkpointId]: dateValue }));
    
    try {
      const res = await fetch('/api/checkpoints/target-date', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpointId: recordId, startDate: dateValue || null })
      });
      if (!res.ok) throw new Error("Failed to save date");
    } catch (error) {
      alert("Failed to save start date. Please try again.");
    }
  };

  const toggleStage = (stageKey: string) => {
    setExpandedStages((current) => {
      const next = new Set(current);
      if (next.has(stageKey)) {
        next.delete(stageKey);
      } else {
        next.add(stageKey);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedStages((current) =>
      current.size === stages.length ? new Set([activeStage?.key ?? 'concept']) : new Set(stages.map((stage) => stage.key))
    );
  };

  // Calculate dynamic target weeks
  const projectStart = new Date(data.project?.created_at || new Date());
  const projectStartMs = projectStart.getTime();
  let maxWeekOffset = 4; // minimum 1 month

  const checkpointSpans: Record<string, { start: number, end: number }> = {};

  stages.forEach((stage, sIndex) => {
    stage.checkpoints.forEach((cp, cpIndex) => {
      let effectiveEndDateStr = targetDatesOverrides[cp.id] !== undefined ? targetDatesOverrides[cp.id] : cp.studentTargetDate;
      let effectiveStartDateStr = startDatesOverrides[cp.id] !== undefined ? startDatesOverrides[cp.id] : (cp as any).studentStartDate;
      
      // Fallback: Use actual action dates if student hasn't explicitly set target dates
      if (!effectiveStartDateStr && cp.submittedAt) {
        effectiveStartDateStr = cp.submittedAt;
      }
      
      if (!effectiveEndDateStr) {
        if (cp.status === 'completed' && cp.completedAt) {
          effectiveEndDateStr = cp.completedAt;
        } else if ((cp.status === 'in-review' || cp.status === 'needs-revision' || cp.status === 'rejected') && cp.reviewedAt) {
          effectiveEndDateStr = cp.reviewedAt;
        } else if (cp.submittedAt) {
          effectiveEndDateStr = cp.submittedAt;
        }
      }
      
      if (!effectiveStartDateStr && effectiveEndDateStr) {
        effectiveStartDateStr = effectiveEndDateStr;
      }
      
      let startWeek = -1;
      let endWeek = -1;

      if (effectiveStartDateStr) {
        startWeek = Math.max(0, Math.ceil((new Date(effectiveStartDateStr).getTime() - projectStartMs) / (1000 * 60 * 60 * 24 * 7)));
      }
      
      if (effectiveEndDateStr) {
        endWeek = Math.max(0, Math.ceil((new Date(effectiveEndDateStr).getTime() - projectStartMs) / (1000 * 60 * 60 * 24 * 7)));
      }
      
      if (startWeek !== -1 || endWeek !== -1) {
        if (startWeek === -1) startWeek = endWeek;
        if (endWeek === -1) endWeek = startWeek;

        if (endWeek > maxWeekOffset) maxWeekOffset = endWeek;
        
        checkpointSpans[cp.id] = {
          start: startWeek,
          end: endWeek
        };
      }
    });
  });

  // Ensure we always have full months (blocks of 4 weeks)
  const totalColumns = Math.ceil((maxWeekOffset + 2) / 4) * 4;
  
  // Calculate current week for the "Today" vertical line
  const currentWeekIndex = Math.max(0, Math.ceil((Date.now() - projectStartMs) / (1000 * 60 * 60 * 24 * 7)));

  return (
    <div className="student-milestones-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .milestones-gantt-container, .milestones-gantt-container * {
            visibility: visible;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .milestones-gantt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .gantt-waterfall-grid {
            border: 2px solid #475569 !important;
            box-shadow: none !important;
            width: 100% !important;
            grid-template-columns: 180px 65px 105px 105px repeat(${totalColumns}, minmax(15px, 1fr)) !important;
          }
          .gantt-waterfall-grid div {
            border-color: #475569 !important;
          }
          .gantt-waterfall-grid div[style*="border-bottom"],
          .gantt-waterfall-grid div[style*="borderBottom"] {
            border-bottom: 1pt solid #475569 !important;
          }
          .gantt-waterfall-grid div[style*="border-right"],
          .gantt-waterfall-grid div[style*="borderRight"] {
            border-right: 1pt solid #475569 !important;
          }
          .gantt-waterfall-grid * {
            font-size: 0.65rem !important;
          }
          .gantt-waterfall-grid .premium-date-picker {
            font-size: 0.55rem !important;
            padding: 0 !important;
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            color: black !important;
          }
          .gantt-waterfall-grid .premium-date-picker::-webkit-calendar-picker-indicator {
            display: none !important;
          }
          .today-highlight-cell {
            background: transparent !important;
            border-left: none !important;
            border-right: 1px dashed #475569 !important;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
        }
        
        /* Premium Gantt Chart Enhancements */
        .gantt-bar-segment {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, filter 0.2s;
        }
        .gantt-bar-segment:hover {
          filter: brightness(1.15);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          z-index: 10;
          position: relative;
        }
        .premium-date-picker {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          padding: 3px 4px;
          color: var(--foreground);
          font-weight: 500;
          transition: all 0.2s ease;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
        }
        .premium-date-picker:hover, .premium-date-picker:focus {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
          outline: none;
        }
        .today-highlight-cell {
          background: linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, rgba(59, 130, 246, 0.06) 100%) !important;
          border-left: 1px solid rgba(59, 130, 246, 0.3) !important;
          border-right: 1px solid rgba(59, 130, 246, 0.3) !important;
        }
      ` }} />
      <div className="milestones-workflow-shell">
        <section className="milestones-overview-grid" aria-label="Milestone progress overview">
          <div className="milestones-academic-panel">
            <span className="milestone-section-kicker">Academic Progression</span>
            <h2>Track every stage before the next gate unlocks</h2>
            <p>
              Milestones now work as a monitored thesis workflow: each stage has required checkpoints,
              submitted evidence, adviser review, panel review, and a clear target before progression.
            </p>

            <div className="milestones-system-note">
              <i className="fas fa-circle-info" aria-hidden="true" />
              <div>
                <strong>Milestones track academic readiness, not just dates.</strong>
                <span>Students move forward after the current stage requirements and reviews are cleared.</span>
              </div>
            </div>

            <div className="milestones-metric-grid">
              <article className="milestones-metric-card">
                <span>Current Stage</span>
                <strong>{activeStage?.title ?? 'Not set'}</strong>
                <small>{activeStage ? formatStageStatus(activeStage.status) : 'No active stage'}</small>
              </article>
              <article className="milestones-metric-card">
                <span>Overall Progress</span>
                <strong>{overallProgress}%</strong>
                <small>{completedStages} of {stages.length} stages completed</small>
              </article>
              <article className="milestones-metric-card">
                <span>Completed</span>
                <strong>{completedStages}</strong>
                <small>Stages cleared</small>
              </article>
              <article className="milestones-metric-card">
                <span>In Workflow</span>
                <strong>{inReviewStages}</strong>
                <small>Pending or under review</small>
              </article>
              <article className="milestones-metric-card">
                <span>Next Stage</span>
                <strong>{nextStage?.title ?? 'Completion'}</strong>
                <small>{nextStage?.status === 'locked' ? 'Locked until gate clears' : 'Ready after current stage'}</small>
              </article>
              <article className="milestones-metric-card">
                <span>Locked</span>
                <strong>{lockedStages}</strong>
                <small>Future stages waiting</small>
              </article>
            </div>
          </div>

          <article className="milestones-spotlight-card">
            <div className="milestones-card-head">
              <div>
                <span className="milestone-section-kicker">Current Stage Spotlight</span>
                <h3>{activeStage?.title ?? 'No active stage yet'}</h3>
              </div>
              {activeStage ? (
                <Badge label={formatStageStatus(activeStage.status)} tone={getStatusTone(activeStage.status)} icon="fa-flag" />
              ) : null}
            </div>

            <p>{activeStage?.summary ?? 'The active milestone will appear once the thesis workflow starts.'}</p>

            <div className="milestones-spotlight-grid">
              <div className="milestone-progress-ring" style={progressStyle}>
                <strong>{activeStage?.progress ?? 0}%</strong>
                <span>Stage progress</span>
              </div>
              <div className="milestones-spotlight-facts">
                <div>
                  <span>Status</span>
                  <strong>{activeStage ? formatStageStatus(activeStage.status) : 'Pending'}</strong>
                </div>
                <div>
                  <span>Target Date</span>
                  <strong>{activeStage?.targetDate ?? 'To be scheduled'}</strong>
                </div>
                <div>
                  <span>Next Stage</span>
                  <strong>{nextStage?.title ?? 'Final requirements'}</strong>
                </div>
              </div>
            </div>

            <div className="milestones-overall-progress">
              <div>
                <span>Overall project progress</span>
                <strong>{overallProgress}%</strong>
              </div>
              <div className="milestones-linear-progress" aria-hidden="true">
                <span style={{ width: `${overallProgress}%` }} />
              </div>
            </div>

            <div className="milestones-quick-button-row">
              <Link prefetch={false} className="milestones-quick-button is-primary" href="/students/schedule">
                <i className="fas fa-calendar-check" aria-hidden="true" />
                Open Schedule
              </Link>
              <Link prefetch={false} className="milestones-quick-button" href="/students/project-overview">
                <i className="fas fa-folder-open" aria-hidden="true" />
                View Project
              </Link>
              <Link prefetch={false} className="milestones-quick-button" href="/students/faculty-feedback">
                <i className="fas fa-comments" aria-hidden="true" />
                View Feedback
              </Link>
            </div>
          </article>
        </section>

        <section className="milestones-roadmap-card" aria-label="Milestone roadmap">
          <div className="milestones-card-head">
            <div>
              <span className="milestone-section-kicker">Milestone Roadmap</span>
              <h3>Academic stages from concept to completion</h3>
              <p>Each stage expands into requirements, submitted evidence, reviews, feedback, and the stage gate.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {viewMode === 'gantt' && (
                <button 
                  type="button" 
                  onClick={() => window.print()}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'white', border: '1px solid var(--border)',
                    padding: '0.5rem 1rem', borderRadius: '6px',
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    color: 'var(--foreground)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <i className="fas fa-file-pdf" aria-hidden="true" style={{ color: 'var(--danger)' }} />
                  Export PDF
                </button>
              )}
              <div className="milestones-view-toggles">
                <button className={viewMode === 'roadmap' ? 'is-active' : ''} type="button" onClick={() => setViewMode('roadmap')}>
                  <i className="fas fa-list-ul" aria-hidden="true" /> List
                </button>
                <button className={viewMode === 'gantt' ? 'is-active' : ''} type="button" onClick={() => setViewMode('gantt')}>
                  <i className="fas fa-chart-gantt" aria-hidden="true" /> Gantt
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'roadmap' ? (
            <div className="milestones-roadmap-list">
              {stages.map((stage) => {
                const expanded = expandedStages.has(stage.key);
                const isActive = stage.index === activeIndex && stage.status !== 'completed';
                return (
                  <article key={stage.key} className={`milestone-roadmap-item is-${stage.status}${isActive ? ' is-active' : ''}`}>
                    <div className="milestone-roadmap-line" aria-hidden="true">
                      <span className="milestone-roadmap-node">
                        <i className={`fas ${stage.status === 'completed' ? 'fa-check' : stage.status === 'locked' ? 'fa-lock' : stage.icon}`} />
                      </span>
                    </div>

                    <div className="milestone-roadmap-panel">
                      <button
                        className="milestone-stage-summary"
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => toggleStage(stage.key)}
                      >
                        <span className="milestone-stage-copy">
                          <span className="milestone-stage-number">Stage {stage.index + 1}</span>
                          <strong>{stage.title}</strong>
                          <small>{stage.summary}</small>
                        </span>
                        <span className="milestone-stage-meta">
                          <Badge
                            label={formatStageStatus(stage.status)}
                            tone={getStatusTone(stage.status)}
                            icon={stage.status === 'locked' ? 'fa-lock' : undefined}
                          />
                          <span className="milestone-stage-target">
                            <span>Target date</span>
                            <strong>{stage.targetDate}</strong>
                          </span>
                          <i className={`fas ${expanded ? 'fa-chevron-up' : 'fa-chevron-down'} milestone-stage-chevron`} aria-hidden="true" />
                        </span>
                      </button>

                      {expanded ? <StageDetails stage={stage} /> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="milestones-gantt-container" style={{ overflowX: 'auto', paddingBottom: '1rem', margin: '0 -1.5rem', padding: '0 1.5rem 1.5rem 1.5rem' }}>
              <div 
                className="gantt-waterfall-grid" 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: `250px 80px 135px 135px repeat(${totalColumns}, minmax(40px, 1fr))`,
                  minWidth: 'max-content',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--card)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}
              >
                {(() => {
                  return (
                    <div style={{ display: 'contents' }}>
                      {/* Left Pane Headers spanning 2 rows */}
                      <div style={{ gridRow: 'span 2', padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)', background: 'var(--surface-alt)', position: 'sticky', left: 0, zIndex: 20, display: 'flex', alignItems: 'center' }}>TASK</div>
                      <div style={{ gridRow: 'span 2', padding: '0.75rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PROGRESS</div>
                      <div style={{ gridRow: 'span 2', padding: '0.75rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center' }}>START DATE</div>
                      <div style={{ gridRow: 'span 2', padding: '0.75rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border)', borderRight: '2px solid var(--border)', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center' }}>TARGET DATE</div>
                      
                      {/* Timeline Headers: Months (Row 1) */}
                      {Array.from({ length: Math.ceil(totalColumns / 4) }).map((_, i) => {
                        const weeksInMonth = Math.min(4, totalColumns - (i * 4));
                        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                        // Anchor the Gantt chart from the month the project actually started
                        const projectStartMonth = new Date(data.project?.created_at || new Date()).getMonth();
                        const displayMonth = monthNames[(projectStartMonth + i) % 12];
                        
                        return (
                          <div key={`month-${i}`} style={{
                            gridColumn: `span ${weeksInMonth}`,
                            padding: '0.5rem',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            borderBottom: '1px solid var(--border)',
                            borderRight: '1px solid var(--border)',
                            background: 'var(--surface-alt)',
                            textAlign: 'center',
                            color: 'var(--foreground)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            {displayMonth}
                          </div>
                        );
                      })}

                      {/* Timeline Headers: Weeks (Row 2) */}
                      {Array.from({ length: totalColumns }).map((_, i) => (
                        <div key={`week-${i}`} style={{
                          padding: '0.5rem 0',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          borderBottom: '2px solid var(--border)',
                          borderRight: '1px dashed var(--border)',
                          background: 'var(--surface-alt)',
                          textAlign: 'center',
                          color: 'var(--muted-foreground)'
                        }}>
                          W{(i % 4) + 1}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {(() => {
                   let currentWeekOffset = 0;
                   
                   return stages.map((stage) => {
                     const stageDuration = stage.checkpoints.length;
                     
                     // Stage Row (Group Header)
                     const stageRow = (
                       <div style={{ display: 'contents' }} key={`row-${stage.id}`}>
                         <div style={{ 
                           padding: '0.6rem 1rem', 
                           fontWeight: 700, 
                           fontSize: '0.85rem',
                           background: 'rgba(59, 130, 246, 0.08)',
                           borderBottom: '1px solid var(--border)',
                           borderRight: '1px solid var(--border)',
                           position: 'sticky',
                           left: 0,
                           zIndex: 10,
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.6rem',
                           color: 'var(--foreground)'
                         }}>
                           <i className={`fas ${stage.icon}`} style={{ color: 'var(--primary)', width: '16px', textAlign: 'center' }} />
                           {stage.title}
                         </div>
                         <div style={{ padding: '0.6rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: 'rgba(59, 130, 246, 0.08)', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                           {stage.progress}%
                         </div>
                         <div style={{ padding: '0.6rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: 'rgba(59, 130, 246, 0.08)' }}></div>
                         <div style={{ padding: '0.6rem', borderBottom: '1px solid var(--border)', borderRight: '2px solid var(--border)', background: 'rgba(59, 130, 246, 0.08)', fontSize: '0.75rem', color: stage.isOverdue ? 'var(--danger)' : 'var(--muted-foreground)', fontWeight: stage.isOverdue ? 700 : 500 }}>
                           {stage.isOverdue ? 'OVERDUE' : stage.targetDate}
                         </div>
                         <div style={{ 
                           gridColumn: `span ${totalColumns}`, 
                           background: 'rgba(59, 130, 246, 0.03)', 
                           borderBottom: '1px solid var(--border)' 
                         }}></div>
                       </div>
                     );

                     const checkpointRows = stage.checkpoints.map((cp) => {
                       const effectiveEndDateStr = targetDatesOverrides[cp.id] !== undefined ? targetDatesOverrides[cp.id] : cp.studentTargetDate;
                       const effectiveStartDateStr = startDatesOverrides[cp.id] !== undefined ? startDatesOverrides[cp.id] : (cp as any).studentStartDate;

                       return (
                         <div style={{ display: 'contents' }} key={`row-cp-${cp.id}`}>
                           <div style={{ 
                             padding: '0.5rem 1rem 0.5rem 2.2rem', 
                             fontSize: '0.8rem',
                             background: 'var(--surface)',
                             borderBottom: '1px solid var(--border)',
                             borderRight: '1px solid var(--border)',
                             position: 'sticky',
                             left: 0,
                             zIndex: 10,
                             display: 'flex',
                             alignItems: 'center',
                             gap: '0.5rem',
                             color: cp.status === 'completed' ? 'var(--foreground)' : 'var(--muted-foreground)'
                           }}>
                             <i className={`fas ${cp.status === 'completed' ? 'fa-check' : cp.status === 'locked' ? 'fa-lock' : 'fa-circle'}`} style={{ fontSize: '0.5rem', opacity: 0.7 }} />
                             {cp.label}
                           </div>
                           <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: 'var(--surface)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                             {cp.status === 'completed' ? '100%' : '0%'}
                           </div>
                           <div style={{ padding: '0.3rem 0.5rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                             <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                               {STUDENT_TASK_KINDS.has(cp.kind) ? (
                                 <input 
                                   type="date" 
                                   className="premium-date-picker"
                                   value={effectiveStartDateStr ? new Date(effectiveStartDateStr).toISOString().split('T')[0] : ''}
                                   onChange={(e) => handleUpdateStartDate(cp.id, cp.recordId, e.target.value)}
                                   style={{ fontSize: '0.65rem', width: '100%', boxSizing: 'border-box' }}
                                   disabled={cp.status === 'completed' || cp.status === 'locked'}
                                 />
                               ) : (
                                 <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', opacity: 0.7, padding: '4px', userSelect: 'none' }}>-</span>
                               )}
                             </div>
                           </div>
                           <div style={{ padding: '0.3rem 0.5rem', borderBottom: '1px solid var(--border)', borderRight: '2px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                             <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                               {STUDENT_TASK_KINDS.has(cp.kind) ? (
                                 <input 
                                   type="date" 
                                   className="premium-date-picker"
                                   value={effectiveEndDateStr ? new Date(effectiveEndDateStr).toISOString().split('T')[0] : ''}
                                   onChange={(e) => handleUpdateTargetDate(cp.id, cp.recordId, e.target.value)}
                                   style={{ fontSize: '0.7rem' }}
                                   disabled={cp.status === 'completed' || cp.status === 'locked'}
                                 />
                               ) : (
                                 <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', opacity: 0.7, padding: '4px', userSelect: 'none' }}>
                                   {effectiveEndDateStr ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(effectiveEndDateStr)) : (SCHEDULE_CHECKPOINT_KINDS.has(cp.kind as any) ? 'Dept. Chair Action' : 'Faculty Action')}
                                 </span>
                               )}
                             </div>
                           </div>
                           {Array.from({ length: totalColumns }).map((_, colIndex) => {
                              const span = checkpointSpans[cp.id];
                              let isTargetCell = false;
                              let isFirstCell = false;
                              let isLastCell = false;
                              
                              if (span) {
                                const blocksToFill = Math.max(1, span.end - span.start);
                                isTargetCell = colIndex >= span.start && colIndex < span.start + blocksToFill;
                                isFirstCell = isTargetCell && colIndex === span.start;
                                isLastCell = isTargetCell && colIndex === span.start + blocksToFill - 1;
                              }
                              
                              const isToday = colIndex === currentWeekIndex;
                              let bgColor = 'var(--primary)';
                              let statusText = 'Pending';
                              
                              if (cp.status === 'completed') {
                                bgColor = 'var(--success)';
                                statusText = 'Completed';
                              } else if (cp.status === 'in-review') {
                                bgColor = 'var(--warning)';
                                statusText = 'In Review';
                              } else if (cp.status === 'needs-revision') {
                                bgColor = '#F97316'; // Orange-500 instead of Red
                                statusText = 'Needs Revision';
                              } else if (cp.status === 'rejected') {
                                bgColor = 'var(--danger)'; // Red for rejected
                                statusText = 'Rejected';
                              } else if (cp.status === 'locked') {
                                statusText = 'Locked';
                              }
                              
                              const tooltipText = `${cp.label}: ${statusText}`;
                              
                              return (
                                <div key={`cell-${colIndex}`} className={isToday ? 'today-highlight-cell' : ''} style={{ 
                                  borderBottom: '1px solid var(--border)', 
                                  borderRight: '1px dashed var(--border)',
                                  background: isToday ? 'transparent' : 'var(--surface)',
                                  padding: '4px 0' // Add padding so it looks like a sleek horizontal bar
                                }}>
                                  {isTargetCell && (
                                    <div className="gantt-bar-segment" title={tooltipText} style={{ 
                                      height: '100%', 
                                      width: '100%', 
                                      background: bgColor,
                                      minHeight: '20px',
                                      opacity: cp.status === 'locked' ? 0.3 : 1,
                                      borderTopLeftRadius: isFirstCell ? '6px' : '0',
                                      borderBottomLeftRadius: isFirstCell ? '6px' : '0',
                                      borderTopRightRadius: isLastCell ? '6px' : '0',
                                      borderBottomRightRadius: isLastCell ? '6px' : '0',
                                      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)'
                                    }} />
                                  )}
                                </div>
                              );
                            })}
                         </div>
                       );
                     });

                     currentWeekOffset += stageDuration;
                     return [stageRow, ...checkpointRows];
                   });
                })()}
              </div>
            </div>
          )}
        </section>

        <section className="milestones-bottom-grid" aria-label="Milestone actions and updates">
          <article className="milestones-bottom-panel">
            <div className="milestones-card-head">
              <div>
                <span className="milestone-section-kicker">Recent Activities</span>
                <h3>Latest workflow movement</h3>
              </div>
            </div>
            <div className="milestone-activity-list">
              {recentActivities.length ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className={`milestone-activity-item is-${activity.tone}`}>
                    <span aria-hidden="true"><i className={`fas ${activity.icon}`} /></span>
                    <div>
                      <strong>{activity.label}</strong>
                      <small>{activity.meta}</small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="milestone-empty-state">
                  <i className="fas fa-clock-rotate-left" aria-hidden="true" />
                  <span>No milestone activity recorded yet.</span>
                </div>
              )}
            </div>
          </article>

          <article className="milestones-bottom-panel">
            <div className="milestones-card-head">
              <div>
                <span className="milestone-section-kicker">Upcoming Deadlines</span>
                <h3>Targets that need attention</h3>
              </div>
            </div>
            <div className="milestone-deadline-list">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className={`milestone-deadline-item is-${deadline.tone}`}>
                  <span aria-hidden="true"><i className={`fas ${deadline.icon}`} /></span>
                  <div>
                    <strong>{deadline.title}</strong>
                    <small>{deadline.date} · {deadline.meta}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="milestones-bottom-panel">
            <div className="milestones-card-head">
              <div>
                <span className="milestone-section-kicker">Quick Actions</span>
                <h3>Move the current stage forward</h3>
              </div>
            </div>
            <div className="milestone-action-list">
              <Link prefetch={false} className="milestones-quick-button is-primary" href="/students/project-files">
                <i className="fas fa-upload" aria-hidden="true" />
                Upload Requirement
              </Link>
              {scheduleAction ? (
                <Link prefetch={false} className="milestones-quick-button" href="/students/schedule">
                  <i className="fas fa-calendar-days" aria-hidden="true" />
                  {scheduleAction.label}
                </Link>
              ) : null}
              <Link prefetch={false} className="milestones-quick-button" href="/students/faculty-feedback">
                <i className="fas fa-comment-dots" aria-hidden="true" />
                View Feedback
              </Link>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
