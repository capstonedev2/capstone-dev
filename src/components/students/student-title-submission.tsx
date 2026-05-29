'use client';

import Link from 'next/link';
import { type CSSProperties, type ChangeEvent, type FormEvent, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { formatFileSizeLabel } from '@/components/students/student-project-files.shared';
import type {
  StudentDashboardData,
  StudentTitleAttachment,
  StudentTitleSubmissionRecord,
  StudentTitleWorkflowStep
} from '@/lib/services/student-workspace';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
type NoticeTone = 'success' | 'warning' | 'danger' | 'info';
type NoticeState = {
  tone: NoticeTone;
  message: string;
} | null;

function sortByDateDesc<T extends { date: string }>(items: T[]) {
  return [...items].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

function formatDateLabel(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(parsedDate);
}

function formatDateTimeLabel(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(parsedDate);
}

function formatShortDateLabel(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsedDate);
}

function formatTimeLabel(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(parsedDate);
}

function getStatusTone(status: string): BadgeTone {
  const normalized = status.toLowerCase();

  if (
    ['approved', 'completed', 'resolved', 'similarity cleared', 'cleared', 'ready'].includes(normalized)
  ) {
    return 'success';
  }

  if (['under review', 'current', 'ongoing', 'in progress', 'group leader access'].includes(normalized)) {
    return 'info';
  }

  if (['pending', 'pending review', 'submitted', 'resubmitted'].includes(normalized)) {
    return 'warning';
  }

  if (['needs revision', 'returned for revision', 'revision requested'].includes(normalized)) {
    return 'accent';
  }

  if (['rejected', 'overdue'].includes(normalized)) {
    return 'danger';
  }

  if (['archived', 'member view', 'draft'].includes(normalized)) {
    return 'neutral';
  }

  return 'neutral';
}

function getWorkflowStatusLabel(status: StudentTitleWorkflowStep['status']) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'current':
      return 'Current';
    case 'needs_revision':
      return 'Needs Revision';
    case 'rejected':
      return 'Rejected';
    case 'archived':
      return 'Archived';
    case 'pending':
    default:
      return 'Pending';
  }
}

function getWorkflowStatusTone(status: StudentTitleWorkflowStep['status']): BadgeTone {
  switch (status) {
    case 'completed':
      return 'success';
    case 'current':
      return 'info';
    case 'needs_revision':
      return 'accent';
    case 'rejected':
      return 'danger';
    case 'archived':
      return 'neutral';
    case 'pending':
    default:
      return 'warning';
  }
}

function formatProposalLabel(proposalNumber: number) {
  return `Proposal ${String(proposalNumber).padStart(2, '0')}`;
}

function deriveTitleFromFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createSubmissionFromRegistration(
  title: StudentDashboardData['titleRegistration']
): StudentTitleSubmissionRecord {
  return {
    id: title.registrationStatus.toLowerCase() === 'draft' ? `title-local-${title.id}` : title.id,
    proposalNumber: 1,
    proposalLabel: formatProposalLabel(1),
    isCurrent: true,
    user_id: title.user_id,
    project_id: title.project_id,
    status: title.status,
    created_at: title.created_at,
    updated_at: title.updated_at,
    proposedTitle: title.proposedTitle,
    briefDescription: title.briefDescription,
    background: title.background,
    statementOfProblem: title.statementOfProblem,
    objectives: title.objectives,
    category: title.category,
    keywords: title.keywords,
    groupMembers: title.groupMembers,
    adviser: title.adviser,
    registrationStatus: title.registrationStatus,
    lastReviewedAt: title.lastReviewedAt,
    statusNote: title.statusNote,
    reviewSummary: title.reviewSummary,
    workflow: title.workflow,
    revisionHistory: title.revisionHistory,
    reviewerFeedback: title.reviewerFeedback,
    validation: title.validation,
    attachments: title.attachments
  };
}

function buildInitialSubmissions(data: StudentDashboardData): StudentTitleSubmissionRecord[] {
  const seed = data.titleRegistration.submissions?.length ? data.titleRegistration.submissions : [createSubmissionFromRegistration(data.titleRegistration)];

  return [...seed].sort((left, right) => {
    if (left.isCurrent && !right.isCurrent) {
      return -1;
    }

    if (!left.isCurrent && right.isCurrent) {
      return 1;
    }

    return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
  });
}

function buildFallbackWorkflow(title: StudentTitleSubmissionRecord): StudentTitleWorkflowStep[] {
  const normalizedStatus = title.registrationStatus.toLowerCase();

  const draftStatus = normalizedStatus === 'draft' ? 'current' : 'completed';
  const submittedStatus = ['draft'].includes(normalizedStatus) ? 'pending' : 'completed';

  let reviewStatus: StudentTitleWorkflowStep['status'] = 'pending';
  let approvedStatus: StudentTitleWorkflowStep['status'] = 'pending';
  let archivedStatus: StudentTitleWorkflowStep['status'] = 'pending';

  if (['pending review', 'submitted', 'resubmitted', 'under review'].includes(normalizedStatus)) {
    reviewStatus = 'current';
  } else if (normalizedStatus === 'needs revision') {
    reviewStatus = 'needs_revision';
  } else if (normalizedStatus === 'rejected') {
    reviewStatus = 'rejected';
  } else if (normalizedStatus === 'approved') {
    reviewStatus = 'completed';
    approvedStatus = 'current';
  } else if (normalizedStatus === 'archived') {
    reviewStatus = 'completed';
    approvedStatus = 'completed';
    archivedStatus = 'current';
  }

  return [
    {
      id: `${title.id}-workflow-draft`,
      title: 'Draft',
      status: draftStatus,
      date: title.created_at,
      dateLabel: formatDateLabel(title.created_at),
      note: 'The proposal is being prepared with the required title sections and supporting files.'
    },
    {
      id: `${title.id}-workflow-submitted`,
      title: 'Submitted',
      status: submittedStatus,
      date: title.revisionHistory.length ? title.revisionHistory[title.revisionHistory.length - 1]?.date : undefined,
      dateLabel: title.revisionHistory.length
        ? formatDateLabel(title.revisionHistory[title.revisionHistory.length - 1]?.date || title.created_at)
        : undefined,
      note: 'The proposal package was forwarded to the adviser review queue.'
    },
    {
      id: `${title.id}-workflow-review`,
      title: 'Under Review',
      status: reviewStatus,
      date: title.lastReviewedAt,
      dateLabel: formatDateLabel(title.lastReviewedAt),
      note: 'Background, problem statement, objectives, and attachments are being checked for title validation.'
    },
    {
      id: `${title.id}-workflow-approved`,
      title: 'Approved',
      status: approvedStatus,
      date: normalizedStatus === 'approved' || normalizedStatus === 'archived' ? title.lastReviewedAt : undefined,
      dateLabel:
        normalizedStatus === 'approved' || normalizedStatus === 'archived'
          ? formatDateLabel(title.lastReviewedAt)
          : undefined,
      note: 'Approved titles move into the official project record.'
    },
    {
      id: `${title.id}-workflow-archived`,
      title: 'Archived',
      status: archivedStatus,
      note: 'The final title package is preserved for record-keeping once the study is finalized.'
    }
  ];
}

function createDraftSubmission(
  data: StudentDashboardData,
  proposalNumber: number,
  isLeader: boolean
): StudentTitleSubmissionRecord {
  const timestamp = new Date().toISOString();

  return {
    id: `title-local-${proposalNumber}-${Date.now()}`,
    proposalNumber,
    proposalLabel: formatProposalLabel(proposalNumber),
    isCurrent: true,
    user_id: data.profile.user_id,
    project_id: data.profile.project_id,
    status: 'active',
    created_at: timestamp,
    updated_at: timestamp,
    proposedTitle: '',
    briefDescription: '',
    background: '',
    statementOfProblem: '',
    objectives: [''],
    category: data.titleRegistration.category,
    keywords: [...data.titleRegistration.keywords],
    groupMembers: [...data.group.members.map((member) => member.fullName)],
    adviser: data.titleRegistration.adviser,
    registrationStatus: 'Draft',
    lastReviewedAt: timestamp,
    statusNote: 'Draft proposal is being prepared. Upload the title proposal document file for adviser review.',
    reviewSummary: {
      latestAction: 'Draft created',
      nextStep: 'Upload at least one title proposal document before submitting this record for adviser review.',
      lastReviewedBy: 'Not yet reviewed',
      accessRole: isLeader ? 'Group leader access' : 'Member view',
      accessNote: isLeader
        ? 'Only the group leader can send the proposal package for adviser review.'
        : `Coordinate with ${data.group.leaderName} for official title submission.`
    },
    revisionHistory: [],
    reviewerFeedback: [],
    validation: {
      status: 'Pending validation',
      checkedAt: timestamp,
      checkedAtLabel: 'Awaiting validation',
      note: 'Similarity checking will start after the title proposal package is submitted.',
      matchedTitles: []
    },
    attachments: []
  };
}

function isEmptyLocalDraftSubmission(submission: StudentTitleSubmissionRecord) {
  return canDeleteDraftSubmission(submission) &&
    submission.attachments.length === 0 &&
    !submission.proposedTitle.trim() &&
    !submission.briefDescription.trim();
}

function isDraftSubmission(submission: StudentTitleSubmissionRecord) {
  return submission.registrationStatus.trim().toLowerCase() === 'draft';
}

function canDeleteDraftSubmission(submission: StudentTitleSubmissionRecord) {
  return submission.id.startsWith('title-local-') && isDraftSubmission(submission);
}

function shouldShowProposalSubmission(submission: StudentTitleSubmissionRecord) {
  return !isDraftSubmission(submission) || canDeleteDraftSubmission(submission);
}

function createAttachmentFromFile(file: File, uploadedBy: string, downloadUrl?: string): StudentTitleAttachment {
  const uploadedAt = new Date().toISOString();

  return {
    id: `title-attachment-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name,
    fileType: file.type || file.name.split('.').pop()?.toUpperCase() || 'FILE',
    sizeLabel: formatFileSizeLabel(file.size),
    uploadedAt,
    uploadedAtLabel: formatDateTimeLabel(uploadedAt),
    uploadedBy,
    status: 'Attached',
    downloadUrl,
    file
  };
}

function mapTitleStatusLabel(status: string) {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'needs-revision':
      return 'Needs Revision';
    case 'rejected':
      return 'Rejected';
    case 'draft':
      return 'Draft';
    default:
      return 'Pending Review';
  }
}

function mapApiTitleToSubmission(title: any, index: number, data: StudentDashboardData): StudentTitleSubmissionRecord {
  const statusLabel = mapTitleStatusLabel(title.status);
  const reviewedAt = title.reviewedAt || title.updatedAt || title.submittedAt;
  const latestComment = title.latestReviewComment;

  return {
    id: title.id,
    proposalNumber: index + 1,
    proposalLabel: formatProposalLabel(index + 1),
    isCurrent: index === 0,
    user_id: data.profile.user_id,
    project_id: title.id,
    status: 'active',
    created_at: title.submittedAt,
    updated_at: title.updatedAt || title.submittedAt,
    proposedTitle: title.title,
    briefDescription: title.description,
    background: title.description,
    statementOfProblem: 'Included in the submitted title proposal package.',
    objectives: ['Validate the proposed title with the assigned adviser.'],
    category: `${title.department || data.profile.department || 'IT'} Capstone Title Proposal`,
    keywords: title.keywords || [],
    groupMembers: title.memberPreview || data.group.members.map((member) => member.fullName),
    adviser: data.titleRegistration.adviser,
    registrationStatus: statusLabel,
    lastReviewedAt: reviewedAt,
    statusNote: latestComment?.body || title.adviserAction || 'Submitted for adviser title validation.',
    reviewSummary: {
      latestAction: statusLabel,
      nextStep:
        title.status === 'approved'
          ? 'Use this approved title in dashboard, project overview, documents, and future submissions.'
          : title.status === 'needs-revision'
            ? 'Revise the title based on adviser notes, then submit another proposal.'
            : title.status === 'rejected'
              ? 'Submit a different title proposal for adviser validation.'
              : 'Wait for adviser validation or submit another title option.',
      lastReviewedBy: latestComment?.authorName || data.titleRegistration.adviser,
      accessRole: data.profile.groupRole || 'Student access',
      accessNote: 'Any student in the assigned group can submit title proposals for adviser review.'
    },
    workflow: undefined,
    revisionHistory: [
      {
        id: `${title.id}-history`,
        status: statusLabel,
        date: reviewedAt,
        dateLabel: formatDateLabel(reviewedAt),
        note: latestComment?.body || title.adviserAction || 'Title proposal was submitted for adviser review.',
        reviewedBy: latestComment?.authorName || data.titleRegistration.adviser
      }
    ],
    reviewerFeedback: latestComment
      ? [
          {
            id: latestComment.id,
            author: latestComment.authorName || data.titleRegistration.adviser,
            role: 'Research Adviser',
            status: statusLabel,
            date: String(latestComment.createdAt),
            dateLabel: formatDateLabel(String(latestComment.createdAt)),
            note: latestComment.body,
            route: '#title-submission-form',
            actionLabel: 'Review title notes'
          }
        ]
      : [],
    validation: {
      status: title.similarityScore ? 'Needs validation' : 'Pending validation',
      checkedAt: title.updatedAt || title.submittedAt,
      checkedAtLabel: 'Adviser validation',
      note: 'Similarity checking can be recorded by the adviser during title review.',
      matchedTitles: []
    },
    attachments: (title.uploadedFiles || []).map((file: any) => ({
      id: file.id,
      file: null,
      fileName: file.name,
      fileType: file.name.split('.').pop() || '',
      sizeLabel: `${Math.round(file.size / 1024)} KB`,
      downloadUrl: file.url,
      uploadedAtLabel: formatDateLabel(title.submittedAt)
    }))
  };
}

function Badge({
  label,
  tone = 'neutral',
  icon
}: {
  label: string;
  tone?: BadgeTone;
  icon?: string;
}) {
  return (
    <span className={`ui-badge is-${tone} whitespace-nowrap`}>
      {icon ? <i className={`fas ${icon}`} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

export function StudentTitleSubmission({ data }: { data: StudentDashboardData }) {
  if (!data.group?.id) {
    return (
      <div className="student-title-registration-page">
        <header className="top-nav">
          <div className="top-nav-leading">
            <div className="page-title">
              <div className="page-title-context">
                <span className="page-kicker">Student Workspace</span>
                <span className="page-breadcrumb" aria-hidden="true">
                  <i className="fas fa-angle-right" />
                  <span>Title Submission</span>
                </span>
              </div>
              <h1>Title Submission</h1>
              <p>Submit and track your proposed thesis titles for adviser validation.</p>
            </div>
          </div>
        </header>

        <div className="page-body p-6">
          <div className="mx-auto mt-12 max-w-2xl rounded-[1.25rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 shadow-sm">
              <i className="fas fa-users-slash text-3xl" aria-hidden="true" />
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tight text-slate-800">Group Assignment Required</h3>
            <p className="mx-auto mt-4 max-w-lg text-slate-500 leading-relaxed">
              You must be assigned to a project group before you can access the Title Submission workspace and submit proposals. Please contact your coordinator to be added to a group.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isLeader = Boolean(data.profile.groupRole && data.profile.groupRole.toLowerCase().includes('leader'));
  const canUpload = true;
  const initialSubmissions = useMemo(
    () => buildInitialSubmissions(data),
    [data]
  );
  const [submissions, setSubmissions] = useState<StudentTitleSubmissionRecord[]>(initialSubmissions);
  const [activeSubmissionId, setActiveSubmissionId] = useState(
    initialSubmissions.find((item) => item.isCurrent)?.id ?? initialSubmissions[0]?.id ?? ''
  );
  const [activeTab, setActiveTab] = useState('Details');
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingTitles, setIsLoadingTitles] = useState(true);
  const [isSubmittingTitle, setIsSubmittingTitle] = useState(false);
  const [isFeedbackHighlighted, setIsFeedbackHighlighted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const detailsPanelRef = useRef<HTMLDivElement | null>(null);
  const adviserFeedbackRef = useRef<HTMLDivElement | null>(null);
  const feedbackHighlightTimerRef = useRef<number | null>(null);
  const createdObjectUrlsRef = useRef(new Set<string>());

  const handleRequestPermission = async () => {
    const leader = data.group.members.find((m) => m.isLeader);
    if (!leader?.user_id) {
      setNotice({ tone: 'danger', message: 'Could not identify the group leader.' });
      return;
    }

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: leader.user_id,
          title: 'Upload Permission Request',
          message: `${data.profile.fullName} is requesting permission to upload title proposal files.`,
          type: 'info',
          entityType: 'group',
          entityId: data.group.id
        })
      });

      if (res.ok) {
        setNotice({ tone: 'success', message: `Upload permission request sent to ${data.group.leaderName}.` });
      } else {
        throw new Error('Failed to send request');
      }
    } catch (e) {
      setNotice({ tone: 'danger', message: 'Failed to send upload request.' });
    }
  };

  useEffect(() => {
    let cancelled = false;
    let pollInterval: NodeJS.Timeout;

    const loadRealTitleSubmissions = async (isBackground = false) => {
      if (!isBackground) setIsLoadingTitles(true);

      try {
        const response = await fetch('/api/title-submissions?page=1&limit=20', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || 'Unable to load title submissions.');
        }

        const realSubmissions = (payload?.titles || []).map((title: any, index: number) =>
          mapApiTitleToSubmission(title, index, data)
        );

        if (!cancelled) {
          const nextSubmissions: StudentTitleSubmissionRecord[] = realSubmissions;
          
          setSubmissions((currentSubmissions) => {
            const localSubmissions = currentSubmissions.filter((s) =>
              s.id.startsWith('title-local-') && !isEmptyLocalDraftSubmission(s)
            );
            
            const mergedReal = nextSubmissions.map((nextSub) => {
              const currentSub = currentSubmissions.find((s) => s.id === nextSub.id);
              if (currentSub) {
                const localAttachments = currentSub.attachments.filter((a) => a.id.includes('local-'));
                return {
                  ...nextSub,
                  proposedTitle: currentSub.proposedTitle, // preserve what user is typing
                  briefDescription: currentSub.briefDescription, // preserve what user is typing
                  attachments: [
                    ...nextSub.attachments,
                    ...localAttachments.filter(la => !nextSub.attachments.some(na => na.fileName === la.fileName))
                  ]
                };
              }
              return nextSub;
            });

            if (mergedReal.length === 0 && localSubmissions.length === 0) {
              return currentSubmissions;
            }
            
            return [...localSubmissions, ...mergedReal];
          });

          if (!isBackground) {
            setActiveSubmissionId((currentId) => {
              if (currentId.startsWith('title-local-')) return currentId;
              const stillExists = nextSubmissions.some(s => s.id === currentId);
              return stillExists ? currentId : (nextSubmissions.find(item => item.isCurrent)?.id ?? nextSubmissions[0]?.id ?? '');
            });
          }
        }
      } catch (error) {
        if (!cancelled && !isBackground) {
          setSubmissions(initialSubmissions);
          setActiveSubmissionId((currentId) => {
            if (currentId.startsWith('title-local-')) return currentId;
            return initialSubmissions.find((item) => item.isCurrent)?.id ?? initialSubmissions[0]?.id ?? '';
          });
          setNotice({ tone: 'warning', message: error instanceof Error ? error.message : 'Unable to load title submissions.' });
        }
      } finally {
        if (!cancelled && !isBackground) {
          setIsLoadingTitles(false);
        }
      }
    };

    loadRealTitleSubmissions();
    
    return () => {
      cancelled = true;
    };
  }, [data, initialSubmissions]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(
    () => () => {
      createdObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      createdObjectUrlsRef.current.clear();
    },
    []
  );

  useEffect(
    () => () => {
      if (feedbackHighlightTimerRef.current !== null) {
        window.clearTimeout(feedbackHighlightTimerRef.current);
      }
    },
    []
  );

  const visibleSubmissions = submissions.filter(shouldShowProposalSubmission);
  const activeSubmission =
    visibleSubmissions.find((submission) => submission.id === activeSubmissionId) ??
    visibleSubmissions[0] ??
    submissions.find((submission) => submission.id === activeSubmissionId) ??
    submissions[0] ??
    null;

  // Keep activeSubmissionId aligned when refreshes remove local-only drafts.
  useEffect(() => {
    if (activeSubmission && activeSubmission.id !== activeSubmissionId) {
      setActiveSubmissionId(activeSubmission.id);
    }
  }, [activeSubmission, activeSubmissionId]);

  const revisionHistory = useMemo(
    () => (activeSubmission ? sortByDateDesc(activeSubmission.revisionHistory) : []),
    [activeSubmission]
  );
  const reviewerFeedback = useMemo(
    () => (activeSubmission ? sortByDateDesc(activeSubmission.reviewerFeedback ?? []) : []),
    [activeSubmission]
  );
  const workflow = useMemo(
    () =>
      activeSubmission
        ? activeSubmission.workflow?.length
          ? activeSubmission.workflow
          : buildFallbackWorkflow(activeSubmission)
        : [],
    [activeSubmission]
  );

  const totalAttachments = submissions.reduce((count, submission) => count + submission.attachments.length, 0);
  const pendingReviewCount = submissions.filter((submission) =>
    ['pending review', 'submitted', 'resubmitted', 'under review'].includes(
      submission.registrationStatus.toLowerCase()
    )
  ).length;
  const approvedCount = submissions.filter(
    (submission) => submission.registrationStatus.toLowerCase() === 'approved'
  ).length;
  const rejectedCount = submissions.filter(
    (submission) => submission.registrationStatus.toLowerCase() === 'rejected'
  ).length;
  // Find the most recent rejected/needs-revision submission for the status banner
  const latestRejectedSubmission = submissions.find(
    (s) => ['rejected', 'needs revision'].includes(s.registrationStatus.toLowerCase())
  );
  const latestApprovedSubmission = submissions.find(
    (s) => s.registrationStatus.toLowerCase() === 'approved'
  );
  const isViewingDraft = activeSubmission ? isDraftSubmission(activeSubmission) : false;
  const showRejectionBanner = !!latestRejectedSubmission && isViewingDraft;
  const showApprovalBanner = !!latestApprovedSubmission && isViewingDraft && !latestRejectedSubmission;

  if (!activeSubmission) {
    return null;
  }

  const trackedSubmissions = visibleSubmissions.length ? visibleSubmissions : submissions;
  const latestVisibleUpdatedSubmission = [...trackedSubmissions].sort(
    (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  )[0];

  const titleStatusTone = getStatusTone(activeSubmission.registrationStatus);
  const validation = activeSubmission.validation ?? null;
  const lastReviewedLabel = revisionHistory[0]?.dateLabel ?? formatDateLabel(activeSubmission.lastReviewedAt);
  const latestReviewer =
    activeSubmission.reviewSummary?.lastReviewedBy ??
    reviewerFeedback[0]?.author ??
    revisionHistory[0]?.reviewedBy ??
    'Awaiting review';
  const latestAction =
    activeSubmission.reviewSummary?.latestAction ?? revisionHistory[0]?.status ?? 'Awaiting adviser action';
  const accessRoleLabel =
    activeSubmission.reviewSummary?.accessRole ?? (isLeader ? 'Group leader access' : 'Member view');
  const accessNote =
    activeSubmission.reviewSummary?.accessNote ??
    (isLeader
      ? 'Only the group leader can submit official title packages for review.'
      : `Coordinate with ${data.group.leaderName} for official title updates.`);
  const nextStep =
    activeSubmission.reviewSummary?.nextStep ??
    'Complete the required proposal package and wait for adviser validation once submitted.';
  const currentWorkflowStep =
    workflow.find((step) => ['current', 'needs_revision', 'rejected'].includes(step.status)) ??
    workflow.find((step) => step.status === 'pending') ??
    workflow[workflow.length - 1] ??
    null;
  const nextWorkflowStep =
    workflow.find((step) => step.status === 'pending' || step.status === 'archived') ?? null;
  const latestAttachment = activeSubmission.attachments[0] ?? null;

  const heroStats = [
    {
      id: 'proposals',
      label: 'Tracked title proposals',
      value: `${trackedSubmissions.length}`,
      note:
        trackedSubmissions.length > 1
          ? 'Students can prepare and compare multiple title proposals in one workspace.'
          : 'Add another proposal to compare alternative title directions before adviser review.'
    },
    {
      id: 'pending',
      label: 'Needs review',
      value: pendingReviewCount ? `${pendingReviewCount}` : 'Clear',
      note: pendingReviewCount
        ? `${pendingReviewCount} proposal package${pendingReviewCount === 1 ? '' : 's'} waiting for adviser action.`
        : 'No title package is currently waiting in the review queue.'
    },
    {
      id: 'approved',
      label: 'Approved titles',
      value: `${approvedCount}`,
      note: approvedCount
        ? `${approvedCount} proposal${approvedCount === 1 ? '' : 's'} already cleared for the project record.`
        : 'Approved titles will appear here once adviser validation is completed.'
    },
    {
      id: 'attachments',
      label: 'Proposal files',
      value: `${totalAttachments}`,
      note: latestVisibleUpdatedSubmission
        ? `${latestVisibleUpdatedSubmission.proposalLabel} was last updated ${formatDateTimeLabel(latestVisibleUpdatedSubmission.updated_at)}.`
        : 'Upload the title package so each proposal has a supporting file record.'
    }
  ];

  const hasApprovedTitle = approvedCount > 0;

  const formSummaryItems = [
    {
      id: 'updated',
      label: 'Last updated',
      value: formatDateLabel(activeSubmission.updated_at),
      note: `${activeSubmission.attachments.length} attachment${activeSubmission.attachments.length === 1 ? '' : 's'} linked`
    },
    {
      id: 'workflow',
      label: 'Workflow stage',
      value: currentWorkflowStep?.title ?? activeSubmission.registrationStatus,
      note: currentWorkflowStep?.note ?? 'Workflow state updates will appear here.'
    },
    {
      id: 'active-file',
      label: 'Latest file',
      value: latestAttachment?.fileName ?? 'No file attached yet',
      note: latestAttachment
        ? `${latestAttachment.fileType} | ${latestAttachment.sizeLabel}`
        : 'Upload the title proposal document to prepare this record for submission.'
    }
  ];

  const statusMetaItems = [
    { id: 'reviewer', label: 'Latest reviewer', value: latestReviewer, note: latestAction },
    { id: 'review-date', label: 'Last review date', value: lastReviewedLabel, note: activeSubmission.statusNote },
    {
      id: 'next-step',
      label: 'Next step',
      value: nextWorkflowStep?.title ?? 'Archive-ready monitoring',
      note: nextStep
    },
    { id: 'role', label: 'Access role', value: accessRoleLabel, note: accessNote }
  ];

  const validationSnapshotItems = [
    {
      id: 'validation-status',
      label: 'Validation',
      value: validation?.status ?? 'Pending validation',
      note:
        validation?.note ??
        'Similarity checking notes will appear here when the validation service is connected.'
    },
    {
      id: 'validation-date',
      label: 'Checked at',
      value: validation?.checkedAtLabel ?? 'No validation date yet',
      note: 'Use this checkpoint when finalizing the next revision.'
    },
    {
      id: 'matched-titles',
      label: 'Possible matches',
      value: `${validation?.matchedTitles.length ?? 0}`,
      note:
        validation?.matchedTitles.length
          ? 'Review listed titles before requesting final adviser endorsement.'
          : 'No related titles are currently listed in the validation snapshot.'
    },
    {
      id: 'documents',
      label: 'Proposal files',
      value: `${activeSubmission.attachments.length}`,
      note:
        activeSubmission.attachments.length
          ? 'Each uploaded file is linked to this title record.'
          : 'Upload the proposal document to complete the submission set.'
    }
  ];

  const updateActiveSubmission = (
    updater: (submission: StudentTitleSubmissionRecord) => StudentTitleSubmissionRecord
  ) => {
    setSubmissions((current) =>
      current.map((submission) =>
        submission.id === activeSubmission.id ? updater(submission) : submission
      )
    );
  };

  const handleSelectSubmission = (submissionId: string) => {
    setActiveSubmissionId(submissionId);
    setSubmissions((current) =>
      current.map((submission) => ({
        ...submission,
        isCurrent: submission.id === submissionId
      }))
    );
  };

  const handleCreateSubmission = () => {
    if (!canUpload) {
      setNotice({
        tone: 'warning',
        message: 'Only authorized group members can create a new title proposal.'
      });
      return;
    }

    const hasEmptyDraft = submissions.some(isEmptyLocalDraftSubmission);

    if (hasEmptyDraft) {
      setNotice({
        tone: 'warning',
        message: 'You already have an empty draft proposal. Please use it or delete it first.'
      });
      return;
    }

    const nextProposalNumber =
      submissions.reduce((highest, submission) => Math.max(highest, submission.proposalNumber), 0) + 1;
    const draftSubmission = createDraftSubmission(data, nextProposalNumber, isLeader);

    setSubmissions((current) => [
      draftSubmission,
      ...current.map((submission) => ({
        ...submission,
        isCurrent: false
      }))
    ]);
    setActiveSubmissionId(draftSubmission.id);
    setNotice({
      tone: 'info',
      message: `${draftSubmission.proposalLabel} is ready. Upload the title proposal file to prepare it for review.`
    });
  };

  const handleDeleteDraftSubmission = (submissionIdToDelete?: string) => {
    const targetId = typeof submissionIdToDelete === 'string' ? submissionIdToDelete : activeSubmissionId;
    const targetSubmission = submissions.find(s => s.id === targetId);

    if (!targetSubmission || !canDeleteDraftSubmission(targetSubmission)) {
      setNotice({
        tone: 'warning',
        message: 'Only unsent draft title proposals can be deleted.'
      });
      return;
    }

    const shouldDelete = window.confirm(`Delete ${targetSubmission.proposalLabel}? Attached files in this draft will be removed from this session.`);
    if (!shouldDelete) {
      return;
    }

    targetSubmission.attachments.forEach((attachment) => {
      if (attachment.downloadUrl) {
        URL.revokeObjectURL(attachment.downloadUrl);
        createdObjectUrlsRef.current.delete(attachment.downloadUrl);
      }
    });

    const remainingSubmissions = submissions.filter((submission) => submission.id !== targetSubmission.id);

    if (!remainingSubmissions.length) {
      const draftSubmission = createDraftSubmission(data, 1, isLeader);
      setSubmissions([draftSubmission]);
      setActiveSubmissionId(draftSubmission.id);
      setNotice({
        tone: 'info',
        message: `${targetSubmission.proposalLabel} was deleted. A new draft is ready.`
      });
      return;
    }

    if (targetId === activeSubmissionId) {
      const nextActiveSubmission = remainingSubmissions[0];
      setSubmissions(
        remainingSubmissions.map((submission) => ({
          ...submission,
          isCurrent: submission.id === nextActiveSubmission.id
        }))
      );
      setActiveSubmissionId(nextActiveSubmission.id);
    } else {
      setSubmissions(remainingSubmissions);
    }

    setNotice({
      tone: 'success',
      message: `${targetSubmission.proposalLabel} draft was deleted.`
    });
  };

  const handleBrowseAttachments = () => {
    if (!canUpload) {
      setNotice({
        tone: 'warning',
        message: 'Only authorized users can upload proposal files.'
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const processFiles = (filesList: FileList | File[]) => {
    if (!canUpload) {
      setNotice({
        tone: 'warning',
        message: 'Only authorized users can upload files.'
      });
      return;
    }

    const files = Array.from(filesList);

    if (!files.length) {
      return;
    }

    const attachments = files.map((file) => {
      const downloadUrl = URL.createObjectURL(file);
      createdObjectUrlsRef.current.add(downloadUrl);
      return createAttachmentFromFile(file, data.profile.fullName, downloadUrl);
    });

    updateActiveSubmission((submission) => ({
      ...submission,
      proposedTitle:
        submission.proposedTitle.trim() || deriveTitleFromFileName(files[0]?.name || 'Untitled title proposal'),
      attachments: [...attachments, ...submission.attachments],
      updated_at: new Date().toISOString()
    }));

    setNotice({
      tone: 'success',
      message: `${files.length} proposal file${files.length === 1 ? '' : 's'} attached to ${activeSubmission.proposalLabel}.`
    });
  };

  const handleAttachmentInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(event.target.files);
    }
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (canUpload) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canUpload) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    updateActiveSubmission((submission) => {
      const attachmentToRemove = submission.attachments.find((attachment) => attachment.id === attachmentId);

      if (attachmentToRemove?.downloadUrl) {
        URL.revokeObjectURL(attachmentToRemove.downloadUrl);
        createdObjectUrlsRef.current.delete(attachmentToRemove.downloadUrl);
      }

      return {
        ...submission,
        attachments: submission.attachments.filter((attachment) => attachment.id !== attachmentId),
        updated_at: new Date().toISOString()
      };
    });
  };

  const handleOpenAttachment = (attachment?: StudentTitleAttachment | null) => {
    if (!attachment?.downloadUrl) {
      setNotice({
        tone: 'info',
        message: 'Preview is available for files uploaded in this session.'
      });
      return;
    }

    window.open(attachment.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadAttachment = (attachment?: StudentTitleAttachment | null) => {
    if (!attachment?.downloadUrl) {
      setNotice({
        tone: 'info',
        message: 'Download is available for files uploaded in this session.'
      });
      return;
    }

    const link = document.createElement('a');
    link.href = attachment.downloadUrl;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSubmitProposal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canUpload) {
      setNotice({
        tone: 'warning',
        message: `Only ${data.group.leaderName} can submit the official title proposal package.`
      });
      return;
    }

    if (!activeSubmission.attachments.length) {
      setNotice({
        tone: 'warning',
        message: 'Attach at least one title proposal document before submission.'
      });
      return;
    }

    const submittedAt = new Date().toISOString();
    const revisionLabel = activeSubmission.revisionHistory.length ? 'Resubmitted' : 'Submitted';
    const submittedTitle = activeSubmission.proposedTitle.trim()
      || deriveTitleFromFileName(activeSubmission.attachments[0]?.fileName || '')
      || `${activeSubmission.proposalLabel} Title Proposal`;

    setIsSubmittingTitle(true);

    try {
      const formData = new FormData();
      formData.append('title', submittedTitle);
      formData.append('description', activeSubmission.briefDescription.trim() || 'Title proposal document uploaded for adviser review.');
      formData.append('keywords', JSON.stringify(activeSubmission.keywords));

      activeSubmission.attachments.forEach((fileObj) => {
        if (fileObj.file) {
          formData.append('files', fileObj.file);
        }
      });

      const response = await fetch('/api/title-submissions', {
        method: 'POST',
        body: formData
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to submit the title proposal.');
      }

      const realSubmission = mapApiTitleToSubmission(payload.title, 0, data);
      realSubmission.attachments = activeSubmission.attachments;
      realSubmission.revisionHistory = [
        {
          id: `${realSubmission.id}-submission-${Date.now()}`,
          status: revisionLabel,
          date: submittedAt,
          dateLabel: formatDateLabel(submittedAt),
          note: `${realSubmission.proposalLabel} was submitted with ${activeSubmission.attachments.length} attached proposal file${activeSubmission.attachments.length === 1 ? '' : 's'} for adviser validation.`,
          reviewedBy: 'Student Group'
        },
        ...realSubmission.revisionHistory
      ];

      setSubmissions((current) => [
        realSubmission,
        ...current
          .filter((submission) => submission.id !== activeSubmission.id)
          .map((submission) => ({ ...submission, isCurrent: false }))
      ]);
      setActiveSubmissionId(realSubmission.id);
      setNotice({
        tone: 'success',
        message: `${realSubmission.proposalLabel} was submitted to your adviser.`
      });
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    } catch (error) {
      setNotice({ tone: 'danger', message: error instanceof Error ? error.message : 'Unable to submit the title proposal.' });
    } finally {
      setIsSubmittingTitle(false);
    }
  };

  const computeTimelineStep = (submission: StudentTitleSubmissionRecord) => {
    const status = submission.registrationStatus.toLowerCase();
    if (status === 'archived') return 4;
    if (status === 'approved') return 4;
    if (status === 'under review' || status === 'needs revision' || status === 'rejected') return 3;
    if (['pending review', 'submitted', 'resubmitted'].includes(status)) return 2;
    if (submission.attachments.length > 0) return 1;
    return 0; // Draft
  };

  const currentStepIndex = computeTimelineStep(activeSubmission);

  const TIMELINE_STEPS = [
    { id: 0, label: 'Draft', icon: 'fa-pen-ruler' },
    { id: 1, label: 'Uploaded', icon: 'fa-file-arrow-up' },
    { id: 2, label: 'Submitted', icon: 'fa-paper-plane' },
    { 
      id: 3, 
      label: activeSubmission.registrationStatus.toLowerCase() === 'rejected' ? 'Rejected' : 
             activeSubmission.registrationStatus.toLowerCase() === 'needs revision' ? 'Needs Revision' : 'Under Review', 
      icon: activeSubmission.registrationStatus.toLowerCase() === 'rejected' ? 'fa-ban' : 
            activeSubmission.registrationStatus.toLowerCase() === 'needs revision' ? 'fa-rotate-left' : 'fa-magnifying-glass' 
    },
    { id: 4, label: 'Approved', icon: 'fa-check-circle' }
  ];
  const submissionProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((currentStepIndex / Math.max(1, TIMELINE_STEPS.length - 1)) * 100))
  );
  const normalizedRegistrationStatus = activeSubmission.registrationStatus.toLowerCase();
  const hasFeedbackAction = normalizedRegistrationStatus === 'rejected' || normalizedRegistrationStatus === 'needs revision';
  const primaryProgressPercent = hasFeedbackAction ? Math.min(submissionProgressPercent, 52) : submissionProgressPercent;
  const titleProgressStyle = {
    '--title-progress': `${submissionProgressPercent}%`,
    '--title-primary-progress': `${primaryProgressPercent}%`,
    '--title-accent-start': hasFeedbackAction ? `${primaryProgressPercent}%` : `${submissionProgressPercent}%`,
    '--title-progress-value': submissionProgressPercent
  } as CSSProperties;
  const isApprovedTimeline = normalizedRegistrationStatus === 'approved';
  const getTimelineStateLabel = (stepId: number, isCompleted: boolean, isCurrent: boolean) => {
    if (isCompleted) {
      return 'Complete';
    }

    if (isCurrent) {
      if (normalizedRegistrationStatus === 'needs revision') return 'Needs revision';
      if (normalizedRegistrationStatus === 'rejected') return 'Rejected';
      if (stepId === 0) return 'Preparing';
      if (stepId === 1) return 'File attached';
      if (stepId === 2) return 'Submitted';
      if (stepId === 3) return 'Adviser reviewing';
      return 'Approved';
    }

    if (stepId === 1) return 'Needs file';
    if (stepId === 2) return 'Not submitted';
    if (stepId === 3) return 'Awaiting adviser';
    if (stepId === 4) return 'Decision pending';
    return 'Pending';
  };
  const hasTitle = Boolean(activeSubmission.proposedTitle.trim());
  const hasDocuments = activeSubmission.attachments.length > 0;
  const canSubmitProposal = canUpload && !isSubmittingTitle && hasDocuments && hasTitle;
  const nextActionLabel =
    currentStepIndex === 0
      ? 'Upload concept paper'
      : currentStepIndex === 1
        ? 'Submit for adviser review'
        : currentStepIndex >= 4
          ? 'Title approved'
          : normalizedRegistrationStatus === 'needs revision'
            ? 'Revise and resubmit'
            : normalizedRegistrationStatus === 'rejected'
              ? 'Prepare new title'
              : 'Wait for adviser review';
  const readinessItems = [
    {
      id: 'title',
      label: 'Proposed title',
      detail: hasTitle ? 'Ready for the proposal package' : 'Enter the official title before upload',
      complete: hasTitle
    },
    {
      id: 'documents',
      label: 'Concept paper',
      detail: hasDocuments
        ? `${activeSubmission.attachments.length} file${activeSubmission.attachments.length === 1 ? '' : 's'} attached`
        : 'Attach a PDF or DOCX concept paper',
      complete: hasDocuments
    },
    {
      id: 'submission',
      label: 'Review request',
      detail: normalizedRegistrationStatus === 'draft' ? 'Not yet sent to adviser' : activeSubmission.registrationStatus,
      complete: normalizedRegistrationStatus !== 'draft'
    }
  ];
  const documentChecklistItems = [
    { id: 'title', label: 'Title', complete: hasTitle },
    { id: 'background', label: 'Background of the study', complete: hasDocuments },
    { id: 'problem', label: 'Statement of the problem', complete: hasDocuments },
    { id: 'objectives', label: 'Objectives of the study', complete: hasDocuments },
    { id: 'significance', label: 'Significance of the study', complete: hasDocuments },
    { id: 'scope', label: 'Scope and limitations', complete: hasDocuments },
    { id: 'framework', label: 'Conceptual framework', complete: hasDocuments },
    { id: 'references', label: 'References', complete: hasDocuments }
  ];
  const titleSubmissionTabs = [
    { id: 'Details', icon: 'fa-pen-to-square' },
    { id: 'Documents', icon: 'fa-file-arrow-up' }
  ];
  const timelineDateSource = activeSubmission.lastReviewedAt || activeSubmission.updated_at;
  const timelineDateLabel = formatShortDateLabel(timelineDateSource);
  const timelineTimeLabel = formatTimeLabel(timelineDateSource);
  const reviewProgressLabel = isApprovedTimeline ? 'Completed' : hasFeedbackAction ? 'Action Required' : 'In Progress';
  const reviewProgressTone = isApprovedTimeline ? 'is-complete' : hasFeedbackAction ? 'is-warning' : '';
  const feedbackNote =
    activeSubmission.statusNote?.trim() ||
    'Please review the rejection feedback and update your title proposal accordingly.';
  const scrollIntoView = (targetRef: RefObject<HTMLElement | null>) => {
    window.setTimeout(() => {
      targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };
  const handleViewOverview = () => {
    setActiveTab('Details');
    scrollIntoView(detailsPanelRef);
  };
  const handleViewFeedback = () => {
    setActiveTab('Details');
    scrollIntoView(adviserFeedbackRef);
    window.setTimeout(() => adviserFeedbackRef.current?.focus({ preventScroll: true }), 180);

    if (feedbackHighlightTimerRef.current !== null) {
      window.clearTimeout(feedbackHighlightTimerRef.current);
    }

    setIsFeedbackHighlighted(true);
    feedbackHighlightTimerRef.current = window.setTimeout(() => {
      setIsFeedbackHighlighted(false);
      feedbackHighlightTimerRef.current = null;
    }, 2200);
  };
  return (
    <div className="student-title-submission-page p-4 pt-2 lg:p-6 lg:pt-2 bg-[#F8FAFC] min-h-screen relative">
      {notice && (
        <div className={`fixed bottom-8 right-6 z-[9999] rounded-xl p-4 shadow-xl flex items-start gap-3 w-96 animate-in slide-in-from-right-8 fade-in duration-300 border ${
          notice.tone === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          notice.tone === 'danger' ? 'bg-rose-50 text-rose-800 border-rose-200' :
          notice.tone === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
          'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <div className="mt-0.5 text-lg">
            {notice.tone === 'success' && <i className="fas fa-check-circle text-emerald-500"></i>}
            {notice.tone === 'danger' && <i className="fas fa-exclamation-circle text-rose-500"></i>}
            {notice.tone === 'warning' && <i className="fas fa-triangle-exclamation text-amber-500"></i>}
            {notice.tone === 'info' && <i className="fas fa-info-circle text-blue-500"></i>}
          </div>
          <p className="text-sm font-bold flex-1 leading-snug">{notice.message}</p>
          <button onClick={() => setNotice(null)} className="text-current opacity-50 hover:opacity-100 transition-opacity"><i className="fas fa-times"></i></button>
        </div>
      )}
      
      <section className="title-review-progress-card" style={titleProgressStyle}>
        <header className="title-review-progress-header">
          <div className="title-review-progress-heading">
            <span className="title-review-progress-icon" aria-hidden="true">
              <i className="fas fa-file-shield" />
            </span>
            <div>
              <div className="title-review-progress-kicker">
                <span>{activeSubmission.proposalLabel}</span>
                <Badge label={activeSubmission.registrationStatus} tone={titleStatusTone} />
              </div>
              <h2>Title Review Progress</h2>
              <p>Track your thesis title proposal through upload, adviser validation, and final approval.</p>
            </div>
          </div>

          <div className="title-review-progress-actions">
            <span className={`title-review-progress-pill ${reviewProgressTone}`}>
              <i className="fas fa-circle" aria-hidden="true" />
              {reviewProgressLabel}
            </span>
            <button type="button" className="title-review-overview-button" onClick={handleViewOverview}>
              <i className="fas fa-list-ul" aria-hidden="true" />
              View Overview
            </button>
          </div>
        </header>

        <section className="title-submission-workflow-strip" aria-label="Title submission workflow">
          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || (isApprovedTimeline && idx <= currentStepIndex);
            const isCurrent = idx === currentStepIndex && !isApprovedTimeline;
            const needsAttention = isCurrent && (normalizedRegistrationStatus === 'needs revision' || normalizedRegistrationStatus === 'rejected');
            const stateLabel = getTimelineStateLabel(step.id, isCompleted, isCurrent);
            const isPending = !isCompleted && !isCurrent;
            const showTimelineMeta = isCompleted || isCurrent;

            return (
              <div
                key={step.id}
                className={`${isCompleted ? 'is-complete' : ''} ${isCurrent ? 'is-current' : ''} ${needsAttention ? 'is-attention' : ''} ${isPending ? 'is-pending' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className="title-submission-workflow-icon">
                  <i className={`fas ${step.icon}`} aria-hidden="true" />
                  {isCompleted ? (
                    <span className="title-submission-workflow-check" aria-hidden="true">
                      <i className="fas fa-check" />
                    </span>
                  ) : null}
                </span>
                <div className="title-submission-workflow-copy">
                  <em>{String(idx + 1).padStart(2, '0')}</em>
                  <strong>{step.label}</strong>
                  <small className="title-submission-workflow-pill">
                    <i className={`fas ${isCompleted ? 'fa-check' : needsAttention ? 'fa-circle-exclamation' : 'fa-clock'}`} aria-hidden="true" />
                    {stateLabel}
                  </small>
                  {needsAttention ? (
                    <p>Review adviser feedback and submit a revised title proposal.</p>
                  ) : isPending && step.id === 4 ? (
                    <p>Pending final review and approval.</p>
                  ) : showTimelineMeta ? (
                    <span className="title-submission-workflow-meta">
                      <span><i className="fas fa-calendar-days" aria-hidden="true" /> {timelineDateLabel}</span>
                      {timelineTimeLabel ? <span><i className="fas fa-clock" aria-hidden="true" /> {timelineTimeLabel}</span> : null}
                    </span>
                  ) : null}
                  {needsAttention ? (
                    <button
                      type="button"
                      className="title-submission-workflow-action"
                      onClick={handleViewFeedback}
                    >
                      <i className="fas fa-message" aria-hidden="true" />
                      View Feedback
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>

        {hasFeedbackAction ? (
          <div className="title-review-feedback-panel">
            <div className="title-review-feedback-copy">
              <span className="title-review-feedback-icon" aria-hidden="true">
                <i className="fas fa-message" />
              </span>
              <div>
                <strong>Feedback Available</strong>
                <p>{feedbackNote}</p>
              </div>
            </div>

          </div>
        ) : null}

        <p className="title-review-progress-tip">
          <i className="fas fa-shield-halved" aria-hidden="true" />
          Tip: Address adviser feedback early to move your title to the next stage faster.
        </p>
      </section>

      {/* Hero Banner */}
      <div className="legacy-title-hero hidden bg-gradient-to-br from-[#003A8F] via-[#0b2866] to-[#1E40AF] rounded-[1.5rem] p-8 text-white flex flex-col md:flex-row justify-between relative overflow-hidden shadow-2xl shadow-[#003A8F]/20 mb-8 border border-white/10 group">
        <div className="z-10 flex flex-col justify-between w-full md:w-1/2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-semibold tracking-wide text-blue-100">Proposal {String(activeSubmission.proposalNumber).padStart(2, '0')}</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${titleStatusTone === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/20 text-white'}`}>
                {activeSubmission.registrationStatus}
              </span>
            </div>
            <h2 className="text-3xl font-extrabold mb-8 mt-2 leading-tight">{activeSubmission.proposedTitle || 'Untitled Proposal'}</h2>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-4">
            <div>
              <p className="text-xs text-blue-200 font-medium mb-1.5">Adviser</p>
              <p className="text-sm font-semibold flex items-center gap-2"><i className="fas fa-user text-blue-300"></i> {activeSubmission.adviser}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200 font-medium mb-1.5">Department</p>
              <p className="text-sm font-semibold flex items-center gap-2"><i className="fas fa-building text-blue-300"></i> {data.profile.department || 'Computer Science'}</p>
            </div>
          </div>
        </div>

        <div className="z-10 flex flex-col md:flex-row items-center gap-10 mt-8 md:mt-0">
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
            <div>
              <p className="text-xs text-blue-200 font-medium mb-1.5">Next Step</p>
              <p className="text-sm font-bold flex items-center gap-2 text-white">
                <span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F6BE00] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#F6BE00]"></span></span><i className={`fas ${currentStepIndex === 0 ? 'fa-file-arrow-up' : currentStepIndex === 1 ? 'fa-paper-plane' : currentStepIndex >= 4 ? 'fa-circle-check' : 'fa-magnifying-glass'} text-blue-200 mr-1`}></i> {currentStepIndex === 0 ? 'Upload Concept Paper' : currentStepIndex === 1 ? 'Submit for Adviser Review' : currentStepIndex === 2 ? 'Awaiting Adviser Review' : currentStepIndex === 3 ? 'Under Review' : 'Title Approved'} <i className="fas fa-arrow-right text-xs ml-1 group-hover:translate-x-1 transition-transform"></i>
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-200 font-medium mb-1.5">Last Updated</p>
              <p className="text-sm font-semibold flex items-center gap-2 text-blue-50"><i className="fas fa-calendar text-blue-300"></i> {formatDateTimeLabel(activeSubmission.updated_at)}</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 bottom-0 opacity-[0.15] translate-x-1/4 translate-y-1/4">
          <i className="fas fa-graduation-cap text-[14rem]"></i>
        </div>
      </div>

            {/* Timeline Stepper */}
      <div className="legacy-title-timeline hidden bg-white rounded-[1.25rem] border border-slate-200/80 p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="flex items-center justify-between relative max-w-[90%] mx-auto">
          <div className="absolute left-10 right-10 top-6 -translate-y-1/2 h-1 bg-slate-100 z-0 rounded-full"></div>
          <div className="absolute left-10 top-6 -translate-y-1/2 h-1 bg-blue-600 z-0 rounded-full transition-all duration-1000" style={{ width: `calc(${(currentStepIndex / 5) * 100}% - ${(currentStepIndex / 5) * 80}px)` }}></div>
          
          {TIMELINE_STEPS.map((step, idx) => {
             const isCompleted = idx <= currentStepIndex;
             const isCurrent = idx === currentStepIndex;
             
             let circleClasses = "bg-white border-slate-200 text-slate-300";
             if (isCompleted) circleClasses = "bg-white border-blue-600 text-blue-600";
             if (isCurrent) circleClasses = "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200/50";
             if (step.label === 'Approved' && isCompleted) circleClasses = "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200/50";
             
             return (
               <div key={idx} className="relative z-10 flex flex-col items-center gap-3 bg-white px-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-sm border-2 transition-all ${circleClasses}`}>
                    <i className={`fas ${step.icon}`}></i>
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-bold ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                    {/* Removed hardcoded fake date */}
                    {!isCompleted && step.label === 'Registered' && <p className="text-[10px] font-bold text-slate-300 mt-0.5">-</p>}
                  </div>
               </div>
             )
          })}
        </div>
      </div>

      {/* Modern Pill Tabs */}
      <div className="title-submission-tabs flex items-center gap-2 bg-slate-200/40 p-1.5 rounded-2xl border border-slate-200 mb-8 w-fit shadow-inner">
        {titleSubmissionTabs.map((tab) => {
          const isDisabled = tab.id === 'Documents' && (!activeSubmission.proposedTitle || !activeSubmission.proposedTitle.trim());
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => {
                if (!isDisabled) setActiveTab(tab.id);
              }}
              disabled={isDisabled}
              aria-pressed={isActive}
              className={`px-6 py-2.5 text-[13px] font-extrabold rounded-xl transition-all duration-300 ${isActive ? 'bg-white text-[#003A8F] shadow-[0_4px_12px_-4px_rgba(0,58,143,0.15)] ring-1 ring-slate-100 scale-105' : isDisabled ? 'text-slate-400 cursor-not-allowed opacity-60 bg-slate-100/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/80'}`}
            >
              <div className="flex items-center gap-2">
                <i className={`fas ${isDisabled ? 'fa-lock' : tab.icon} text-[11px]`} aria-hidden="true"></i>
                {tab.id}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="title-submission-main-grid grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        
        {/* Left Column (Documents View) */}
        <div className="title-submission-main-stack flex flex-col gap-6">
          {activeTab === 'Documents' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[400px]">
                  <div className="p-5 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">Upload Concept Paper</h3>
                  </div>
                  <div className="p-6 pt-0 flex-1 flex flex-col">
                    <button 
                      type="button"
                      onClick={handleBrowseAttachments}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      disabled={!canUpload}
                      className={`group relative flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all overflow-hidden ${isDragging ? 'border-[#003A8F] bg-[#003A8F]/5 shadow-inner' : 'border-slate-300 bg-slate-50/50 hover:border-[#003A8F]/50 hover:bg-[#003A8F]/5'}`}
                    >
                      <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 mb-4 group-hover:bg-[#003A8F]/10 group-hover:text-[#003A8F] transition-colors">
                        <i className="fas fa-cloud-arrow-up text-xl"></i>
                      </div>
                      <h4 className="text-[15px] font-bold text-slate-800 mb-1">Drag & drop your file here</h4>
                      <p className="text-sm font-medium text-blue-600">or click to browse</p>
                      <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">Supports: PDF, DOCX - Max size: 10MB</p>
                      <input
                        ref={fileInputRef}
                        hidden
                        multiple
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleAttachmentInputChange}
                      />
                    </button>
                    
                    {/* Active File Box */}
                    {activeSubmission.attachments.length > 0 && (
                      <div className="mt-4 flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                        {activeSubmission.attachments.map((attachment) => (
                          <div key={attachment.id} className="p-3 rounded-lg border border-slate-200 bg-white shadow-sm flex items-center gap-3">
                            <div className="h-9 w-9 bg-slate-100 rounded flex items-center justify-center text-blue-600 shrink-0">
                              <i className={`fas ${attachment.fileName.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-word'} text-base`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{attachment.fileName}</p>
                              <p className="text-[10px] font-bold text-slate-500">{attachment.sizeLabel} - Uploaded</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-slate-500">
                                <i className="fas fa-check text-[9px]"></i>
                                <span className="text-[10px] font-bold">Uploaded</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAttachment(attachment.id);
                                }}
                                disabled={!canUpload}
                                className="h-7 w-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove file"
                              >
                                <i className="fas fa-trash-can text-[11px]"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Preview */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[400px]">
                  <div className="p-5 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">Document Preview</h3>
                  </div>
                  <div className="p-6 pt-0 flex-1 flex flex-col relative">
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 flex-1 flex flex-col p-6 overflow-hidden relative shadow-inner">
                       {activeSubmission.attachments.length > 0 ? (
                         activeSubmission.attachments[0].downloadUrl && activeSubmission.attachments[0].fileName.toLowerCase().endsWith('.pdf') ? (
                           <div className="w-full flex-1 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white relative">
                             <object data={activeSubmission.attachments[0].downloadUrl} type="application/pdf" className="w-full h-full absolute inset-0">
                               <div className="flex flex-col items-center justify-center text-center h-full p-8 bg-white">
                                 <i className="fas fa-file-pdf text-3xl text-slate-300 mb-4"></i>
                                 <p className="text-sm font-bold text-slate-500 mb-1">PDF viewer not available</p>
                                 <p className="text-xs text-slate-400 font-medium">Your browser does not support inline PDFs.</p>
                               </div>
                             </object>
                           </div>
                         ) : (
                           <div className="bg-white rounded-lg shadow-sm border border-slate-200 w-full flex-1 p-8 overflow-hidden flex flex-col items-center justify-center text-center">
                              <i className={`fas ${activeSubmission.attachments[0].fileName.toLowerCase().includes('.doc') ? 'fa-file-word text-blue-500' : 'fa-file text-slate-400'} text-4xl mb-4`}></i>
                              <h4 className="font-extrabold text-slate-800 mb-2 max-w-[200px] truncate">{activeSubmission.attachments[0].fileName}</h4>
                              <p className="text-xs font-medium text-slate-500">Preview is only available for PDF documents.</p>
                           </div>
                         )
                       ) : (
                         <div className="flex-1 flex flex-col items-center justify-center text-center">
                           <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                             <i className="fas fa-file-pdf text-xl"></i>
                           </div>
                           <p className="text-sm font-bold text-slate-500 mb-1">No document uploaded</p>
                           <p className="text-xs text-slate-400 font-medium">Upload a concept paper to see a preview here.</p>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Version History Quick View */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Version History</h3>
                </div>
                <div className="p-2">
                  <table className="w-full text-left">
                    <tbody>
                      {activeSubmission.attachments.map((att, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-700 text-[13px] flex items-center gap-3">
                            <i className="fas fa-file-word text-blue-600 text-lg"></i> {att.fileName}
                            {i === 0 && <span className="bg-[#EFF6FF] text-[#003A8F] text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1"><i className="fas fa-circle text-[5px]"></i> Current</span>}
                          </td>
                          <td className="p-4 text-[12px] font-semibold text-slate-500">{att.uploadedAtLabel}</td>
                          <td className="p-4 text-[12px] font-semibold text-slate-500">{att.sizeLabel}</td>
                          <td className="p-4 text-[12px] font-semibold text-slate-400">{att.uploadedBy || data.group.leaderName || 'Group Member'}</td>
                        </tr>
                      ))}
                      {activeSubmission.attachments.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-sm font-medium text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <i className="fas fa-folder-open text-3xl text-slate-200 mb-2"></i>
                              No document versions yet
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          
          {activeTab === 'Details' && (
            <div ref={detailsPanelRef} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="mb-8 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-[#003A8F] flex items-center justify-center text-xl shadow-sm border border-blue-100"><i className="fas fa-file-signature"></i></div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Proposal Details</h3>
                  <p className="text-[13px] text-slate-500 font-medium mt-1">Provide the official title and a brief note to your adviser.</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label htmlFor="proposedTitle" className="block text-[13px] font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                    Proposed Title <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-[#003A8F] transition-colors">
                      <i className="fas fa-heading"></i>
                    </div>
                    <input
                      id="proposedTitle"
                      type="text"
                      value={activeSubmission.proposedTitle === 'basag' || activeSubmission.proposedTitle === 'No active project' ? '' : activeSubmission.proposedTitle}
                      onChange={(e) => updateActiveSubmission(sub => ({ ...sub, proposedTitle: e.target.value }))}
                      placeholder="Enter the official, finalized title of your study"
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:border-[#003A8F] focus:ring-4 focus:ring-[#003A8F]/15 hover:bg-white hover:border-slate-300 text-sm font-bold outline-none disabled:opacity-60 disabled:bg-slate-100"
                      disabled={!canUpload}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 mt-2.5 flex items-center gap-1.5">
                    <i className="fas fa-exclamation-circle text-rose-400"></i> A proposed title is required before you can proceed to upload documents.
                  </p>
                </div>

                <div>
                  <label htmlFor="briefDescription" className="block text-[13px] font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    Note to Adviser <span className="text-slate-400 font-bold text-[10px] px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">OPTIONAL</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute top-4 left-0 flex items-start pl-4 pointer-events-none text-slate-400 group-focus-within:text-[#003A8F] transition-colors">
                      <i className="fas fa-comment-dots"></i>
                    </div>
                    <textarea
                      id="briefDescription"
                      value={
                        activeSubmission.briefDescription === 'Title proposal document uploaded for adviser review. The required contents are expected inside the attached file.' || 
                        activeSubmission.briefDescription === 'Title proposal submitted for adviser validation.'
                        ? '' : activeSubmission.briefDescription
                      }
                      onChange={(e) => updateActiveSubmission(sub => ({ ...sub, briefDescription: e.target.value }))}
                      placeholder="Add specific questions, context, or areas you want your adviser to focus on..."
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:border-[#003A8F] focus:ring-4 focus:ring-[#003A8F]/15 hover:bg-white hover:border-slate-300 text-sm font-medium outline-none min-h-[160px] resize-y disabled:opacity-60 disabled:bg-slate-100 leading-relaxed"
                      disabled={!canUpload}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`h-2.5 w-2.5 rounded-full ${!activeSubmission.proposedTitle.trim() ? 'bg-[#F6BE00] animate-pulse' : 'bg-[#003A8F]'}`}></div>
                   <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                     {!activeSubmission.proposedTitle.trim() ? 'Awaiting Title' : 'Details Complete'}
                   </span>
                 </div>
                 <button 
                   onClick={() => {
                     if (activeSubmission.proposedTitle && activeSubmission.proposedTitle.trim()) {
                       setActiveTab('Documents');
                     }
                   }}
                   disabled={!activeSubmission.proposedTitle || !activeSubmission.proposedTitle.trim()}
                   className={`text-xs font-extrabold px-6 py-3 rounded-lg shadow-md transition-all flex items-center gap-2 ${(!activeSubmission.proposedTitle || !activeSubmission.proposedTitle.trim()) ? 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none' : 'bg-slate-800 hover:bg-slate-900 text-white hover:shadow-lg hover:-translate-y-0.5'}`}
                 >
                   Continue to Documents <i className="fas fa-arrow-right"></i>
                 </button>
              </div>
            </div>
          )}
          
          {!['Documents', 'Details'].includes(activeTab) && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center text-slate-500 flex flex-col items-center justify-center h-[400px]">
               <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 text-2xl text-slate-300 border border-slate-100">
                 <i className="fas fa-laptop-code"></i>
               </div>
               <h3 className="text-lg font-extrabold text-slate-700 mb-2">Tab Content Pending</h3>
               <p className="text-[13px] font-medium max-w-sm leading-relaxed">The {activeTab} view is currently being implemented. Please use Details and Documents to submit your proposal.</p>
            </div>
          )}


          {/* Action Banner (Proceed to Next Stage) */}
          <div className="title-submission-cta-panel bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10"></div>
            <div className="flex items-center gap-5 z-10">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm relative">
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm border-2 border-white"><i className="fas fa-info text-[10px]"></i></div>
                <i className="fas fa-clipboard-check text-2xl"></i>
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-800 mb-1">
                   {activeSubmission.registrationStatus.toLowerCase() === 'approved' 
                     ? 'Your proposal has been approved!' 
                     : activeSubmission.registrationStatus.toLowerCase() !== 'draft' 
                     ? 'Proposal submitted successfully' 
                     : 'Ready to submit your proposal?'}
                </h4>
                <p className="text-[13px] text-slate-500 font-medium">
                   {activeSubmission.registrationStatus.toLowerCase() === 'approved' 
                     ? 'Please proceed to the official title registration to complete the process.' 
                     : activeSubmission.registrationStatus.toLowerCase() !== 'draft' 
                     ? 'Your adviser has been notified and is currently reviewing your concept paper.' 
                     : 'Ensure your concept paper is fully uploaded before submitting.'}
                </p>
              </div>
            </div>
            
            {activeSubmission.registrationStatus.toLowerCase() === 'approved' ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full sm:w-auto">
                <div className="w-full sm:w-auto bg-[#EFF6FF] text-[#003A8F] text-sm font-extrabold px-6 py-3.5 rounded-xl border-2 border-[#BFDBFE] flex items-center justify-center gap-3 whitespace-nowrap">
                  <i className="fas fa-circle-check"></i> Title Approved
                </div>
                <button 
                  type="button"
                  onClick={handleCreateSubmission}
                  className="w-full sm:w-auto bg-white border-2 border-slate-200 hover:border-[#003A8F] hover:text-[#003A8F] text-slate-600 text-sm font-extrabold px-6 py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <i className="fas fa-plus"></i> Submit Another Title
                </button>
              </div>
            ) : activeSubmission.registrationStatus.toLowerCase() !== 'draft' ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full sm:w-auto">
                <button 
                  disabled
                  className="w-full sm:w-auto bg-slate-100 text-slate-400 text-sm font-extrabold px-6 py-3.5 rounded-xl flex items-center justify-center gap-3 whitespace-nowrap cursor-not-allowed"
                >
                  Proposal Under Review <i className="fas fa-clock text-xs"></i>
                </button>
                <button 
                  type="button"
                  onClick={handleCreateSubmission}
                  className="w-full sm:w-auto bg-white border-2 border-slate-200 hover:border-[#003A8F] hover:text-[#003A8F] text-slate-600 text-sm font-extrabold px-6 py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <i className="fas fa-plus"></i> Submit Another Title
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitProposal} className="w-full sm:w-auto z-10">
                 <button 
                   type="submit"
                   disabled={!canSubmitProposal}
                   className="w-full sm:w-auto bg-[#003A8F] hover:bg-[#1E40AF] text-white text-sm font-extrabold px-6 py-3.5 rounded-xl shadow-lg shadow-[#003A8F]/30 transition-transform active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isSubmittingTitle ? 'Submitting...' : 'Submit for Adviser Review'} <i className="fas fa-paper-plane text-xs"></i>
                 </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column - Made Sticky for Better UX */}
        <div className="title-submission-side-rail flex flex-col gap-6 sticky top-8 h-fit animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 ease-out fill-mode-both">
           <div className="title-submission-side-card title-submission-progress-card bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6" style={titleProgressStyle}>
             <div className="flex items-start justify-between gap-4 mb-5">
               <div>
                 <h3 className="text-[13px] font-extrabold text-slate-800 uppercase tracking-wider">Workflow Progress</h3>
                 <p className="mt-1 text-xs font-semibold text-slate-500">{nextActionLabel}</p>
               </div>
               <div className="title-submission-progress-orb" aria-label={`Workflow progress ${submissionProgressPercent}%`}>
                 <span>{submissionProgressPercent}%</span>
               </div>
             </div>
             <div className="title-submission-progress-track" aria-hidden="true">
               <span style={{ width: `${submissionProgressPercent}%` }} />
             </div>
             <div className="title-submission-side-readiness mt-5">
               {readinessItems.map((item) => (
                 <div key={item.id} className={item.complete ? 'is-complete' : ''}>
                   <i className={`fas ${item.complete ? 'fa-circle-check' : 'fa-circle'}`} aria-hidden="true" />
                   <span>
                     <strong>{item.label}</strong>
                     <small>{item.detail}</small>
                   </span>
                 </div>
               ))}
             </div>
           </div>
           
           {/* Proposal Options Selector */}
           {visibleSubmissions.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden">
               <h3 className="text-[13px] font-extrabold text-slate-800 mb-4 uppercase tracking-wider">Your Proposals</h3>
               <div className="space-y-2">
                 {visibleSubmissions.map((sub) => (
                    <div
                      role="button"
                      tabIndex={0}
                      key={sub.id}
                      onClick={() => handleSelectSubmission(sub.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectSubmission(sub.id);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        activeSubmissionId === sub.id
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate flex-1">{sub.proposalLabel}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] px-2 py-0.5 rounded uppercase tracking-widest ${
                           sub.registrationStatus.toLowerCase() === 'approved' ? 'bg-[#EFF6FF] text-[#003A8F]' :
                           sub.registrationStatus.toLowerCase() === 'draft' ? 'bg-slate-200 text-slate-600' :
                           'bg-[#FFF8E1] text-[#9A6700]'
                        }`}>
                          {sub.registrationStatus}
                        </span>
                        {canDeleteDraftSubmission(sub) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDraftSubmission(sub.id);
                            }}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 ml-1"
                            aria-label={`Delete ${sub.proposalLabel} draft`}
                            title="Delete Draft"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
               </div>
             </div>
           )}
           
           {/* Adviser Review Status */}
           <div
             ref={adviserFeedbackRef}
             tabIndex={-1}
             className={`title-submission-adviser-feedback-card bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden ${isFeedbackHighlighted ? 'is-feedback-focused' : ''}`}
           >
             <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -z-10 translate-x-4 -translate-y-4"></div>
             <h3 className="text-[13px] font-extrabold text-slate-800 mb-6 uppercase tracking-wider">Adviser Review Status</h3>
             <div className="flex items-center gap-4 mb-6 relative z-10">
               <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeSubmission.adviser)}&background=0D8ABC&color=fff`} alt={activeSubmission.adviser} className="h-12 w-12 rounded-full shadow-sm ring-2 ring-white" />
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-extrabold text-slate-800 flex items-center justify-between w-full">
                    <span className="truncate">{activeSubmission.adviser}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 uppercase tracking-widest ${titleStatusTone === 'success' ? 'bg-[#EFF6FF] text-[#003A8F]' : 'bg-[#FFF8E1] text-[#9A6700]'}`}>
                      {activeSubmission.registrationStatus}
                    </span>
                 </p>
                 <p className="text-[11px] text-slate-400 font-bold mt-1.5 uppercase tracking-wide">Reviewed on {formatDateTimeLabel(activeSubmission.lastReviewedAt)}</p>
               </div>
             </div>
             <div className={`p-4 rounded-xl text-[13px] font-semibold leading-relaxed border ${titleStatusTone === 'success' ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#003A8F]' : 'bg-[#FFF8E1] border-[#FDE68A] text-[#9A6700]'}`}>
               {activeSubmission.statusNote || 'Waiting for adviser review. Comments and remarks will appear here.'}
             </div>
           </div>
           
           {/* Document Checklist */}
           <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-[13px] font-extrabold text-slate-800 uppercase tracking-wider">Document Checklist</h3>
               <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shadow-sm border border-slate-100">
                  <i className="fas fa-list-check text-slate-400 text-xs"></i>
               </div>
             </div>
             <ul className="space-y-4">
               {documentChecklistItems.map((item) => (
                 <li key={item.id} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${item.complete ? 'bg-[#EFF6FF] text-[#003A8F]' : 'bg-slate-100 text-slate-400'}`}>
                      <i className={`fas ${item.complete ? 'fa-check' : 'fa-circle'} text-[8px]`}></i>
                    </div>
                    {item.label}
                 </li>
               ))}
               <li className="flex items-center justify-between text-xs font-bold text-slate-500 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0"><i className="fas fa-asterisk text-[8px]"></i></div>
                    Appendices (if applicable)
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Optional</span>
               </li>
             </ul>
           </div>
           
           {/* Submission Analytics */}
           <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
             <h3 className="text-[13px] font-extrabold text-slate-800 mb-5 uppercase tracking-wider">Submission Analytics</h3>
             <div className="grid grid-cols-4 gap-2">
               <div className="flex flex-col items-center text-center p-3 rounded-[1rem] border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                 <div className="h-7 w-7 rounded-lg bg-[#EFF6FF] text-[#003A8F] flex items-center justify-center mb-2 shadow-sm"><i className="fas fa-file-lines text-xs"></i></div>
                 <span className="text-sm font-extrabold text-slate-800">{submissions.filter(s => !['draft', 'pending', 'awaiting title'].includes(s.registrationStatus?.toLowerCase())).length}</span>
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Submits</span>
               </div>
               <div className="flex flex-col items-center text-center p-3 rounded-[1rem] border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                 <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mb-2 shadow-sm"><i className="fas fa-clock text-xs"></i></div>
                  <span className="text-sm font-extrabold text-slate-800">N/A</span>
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg. Days</span>
               </div>
               <div className="flex flex-col items-center text-center p-3 rounded-[1rem] border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                 <div className="h-7 w-7 rounded-lg bg-[#FFF8E1] text-[#9A6700] flex items-center justify-center mb-2 shadow-sm"><i className="fas fa-shield-halved text-xs"></i></div>
                  <span className="text-sm font-extrabold text-slate-800">N/A</span>
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Approval</span>
               </div>
               <div className="flex flex-col items-center text-center p-3 rounded-[1rem] border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                 <div className="h-7 w-7 rounded-lg bg-[#EFF6FF] text-[#003A8F] flex items-center justify-center mb-2 shadow-sm"><i className="fas fa-chart-pie text-xs"></i></div>
                  <span className="text-sm font-extrabold text-slate-800">{submissionProgressPercent}%</span>
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Complete</span>
               </div>
             </div>
           </div>
           
           {/* Recent Activity */}
           <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
             <h3 className="text-[13px] font-extrabold text-slate-800 mb-6 uppercase tracking-wider">Recent Activity</h3>
             <div className="relative border-l-2 border-slate-100 ml-2 space-y-6">
               {activeSubmission.revisionHistory.slice(0, 4).map((hist, i) => (
                 <div key={i} className="relative pl-5">
                   <div className={`absolute -left-[9px] top-0.5 h-4 w-4 rounded-full border-[3px] border-white shadow-sm ${hist.status.toLowerCase().includes('approved') ? 'bg-[#003A8F]' : hist.status.toLowerCase().includes('submitted') ? 'bg-[#F6BE00]' : 'bg-slate-300'}`}></div>
                   <p className="text-xs font-bold text-slate-700 leading-snug">{hist.note}</p>
                   <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wide">{hist.dateLabel}</p>
                 </div>
               ))}
               {activeSubmission.revisionHistory.length === 0 && (
                 <div className="pl-5 text-xs font-medium text-slate-400">No recent activity on this proposal.</div>
               )}
             </div>
           </div>

        </div>
      </div>
    </div>
  );
}
