'use client';

import Link from 'next/link';
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
    id: title.id,
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

function buildInitialSubmissions(
  data: StudentDashboardData,
  isLeader: boolean
): StudentTitleSubmissionRecord[] {
  const seed = data.titleRegistration.submissions?.length ? data.titleRegistration.submissions : [createSubmissionFromRegistration(data.titleRegistration)];

  const sorted = [...seed].sort((left, right) => {
    if (left.isCurrent && !right.isCurrent) {
      return -1;
    }

    if (!left.isCurrent && right.isCurrent) {
      return 1;
    }

    return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
  });

  const active = sorted.find(s => s.isCurrent) || sorted[0];
  if (active && ['rejected', 'needs-revision', 'needs revision'].includes(active.registrationStatus.toLowerCase())) {
    const nextProposalNumber = sorted.reduce((highest, submission) => Math.max(highest, submission.proposalNumber), 0) + 1;
    const autoDraft = createDraftSubmission(data, nextProposalNumber, isLeader);
    return [autoDraft, ...sorted.map(s => ({ ...s, isCurrent: false }))];
  }

  return sorted;
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
    attachments: []
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
    () => buildInitialSubmissions(data, isLeader),
    [data, isLeader]
  );
  const [submissions, setSubmissions] = useState<StudentTitleSubmissionRecord[]>(initialSubmissions);
  const [activeSubmissionId, setActiveSubmissionId] = useState(
    initialSubmissions.find((item) => item.isCurrent)?.id ?? initialSubmissions[0]?.id ?? ''
  );
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingTitles, setIsLoadingTitles] = useState(true);
  const [isSubmittingTitle, setIsSubmittingTitle] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createdObjectUrlsRef = useRef(new Set<string>());
  const suppressAutoDraftRef = useRef(false);

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
        const response = await fetch('/api/title-submissions', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || 'Unable to load title submissions.');
        }

        const realSubmissions = (payload?.titles || []).map((title: any, index: number) =>
          mapApiTitleToSubmission(title, index, data)
        );

        if (!cancelled) {
          const nextSubmissions: StudentTitleSubmissionRecord[] = realSubmissions.length ? realSubmissions : initialSubmissions;
          
          setSubmissions((currentSubmissions) => {
            const localSubmissions = currentSubmissions.filter((s) => s.id.startsWith('title-local-'));
            
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

            // Auto-create a draft if ALL real submissions are terminal (rejected/approved) and no local draft exists
            const allTerminal = mergedReal.length > 0 && mergedReal.every((s) =>
              ['rejected', 'approved', 'needs revision'].includes(s.registrationStatus.toLowerCase())
            );
            if (allTerminal && localSubmissions.length === 0 && !suppressAutoDraftRef.current) {
              const nextNum = mergedReal.reduce((h, s) => Math.max(h, s.proposalNumber), 0) + 1;
              const autoDraft = createDraftSubmission(data, nextNum, isLeader);
              return [autoDraft, ...mergedReal.map(s => ({ ...s, isCurrent: false }))];
            }
            
            return [...localSubmissions, ...mergedReal];
          });

          if (!isBackground) {
            setActiveSubmissionId((currentId) => {
              if (currentId.startsWith('title-local-')) return currentId;
              // If all real submissions are terminal, the merge created an auto-draft — switch to it
              const allTerminal = nextSubmissions.length > 0 && nextSubmissions.every((s) =>
                ['rejected', 'approved', 'needs revision'].includes(s.registrationStatus.toLowerCase())
              );
              if (allTerminal) {
                // The auto-draft ID will be set by the next render since it's at index 0
                return currentId; // keep current, the submissions state update will handle it
              }
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
    
    // Poll for real-time updates every 5 seconds
    pollInterval = setInterval(() => {
      loadRealTitleSubmissions(true);
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
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

  const activeSubmission =
    submissions.find((submission) => submission.id === activeSubmissionId) ?? submissions[0] ?? null;

  // Auto-sync activeSubmissionId to the auto-created draft when the current ID is stale
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
  const latestUpdatedSubmission = [...submissions].sort(
    (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  )[0];

  // Find the most recent rejected/needs-revision submission for the status banner
  const latestRejectedSubmission = submissions.find(
    (s) => ['rejected', 'needs revision'].includes(s.registrationStatus.toLowerCase())
  );
  const latestApprovedSubmission = submissions.find(
    (s) => s.registrationStatus.toLowerCase() === 'approved'
  );
  const isViewingDraft = activeSubmission?.registrationStatus === 'Draft';
  const showRejectionBanner = !!latestRejectedSubmission && isViewingDraft;
  const showApprovalBanner = !!latestApprovedSubmission && isViewingDraft && !latestRejectedSubmission;

  if (!activeSubmission) {
    return null;
  }

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
      value: `${submissions.length}`,
      note:
        submissions.length > 1
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
      note: latestUpdatedSubmission
        ? `${latestUpdatedSubmission.proposalLabel} was last updated ${formatDateTimeLabel(latestUpdatedSubmission.updated_at)}.`
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

    const nextProposalNumber =
      submissions.reduce((highest, submission) => Math.max(highest, submission.proposalNumber), 0) + 1;
    const draftSubmission = createDraftSubmission(data, nextProposalNumber, isLeader);

    suppressAutoDraftRef.current = false;
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

  const handleDeleteDraftSubmission = () => {
    if (!activeSubmission || activeSubmission.registrationStatus !== 'Draft') {
      setNotice({
        tone: 'warning',
        message: 'Only draft title proposals can be deleted.'
      });
      return;
    }

    const shouldDelete = window.confirm(`Delete ${activeSubmission.proposalLabel}? Attached files in this draft will be removed from this session.`);
    if (!shouldDelete) {
      return;
    }

    activeSubmission.attachments.forEach((attachment) => {
      if (attachment.downloadUrl) {
        URL.revokeObjectURL(attachment.downloadUrl);
        createdObjectUrlsRef.current.delete(attachment.downloadUrl);
      }
    });

    const remainingSubmissions = submissions.filter((submission) => submission.id !== activeSubmission.id);

    if (!remainingSubmissions.length) {
      const draftSubmission = createDraftSubmission(data, 1, isLeader);
      suppressAutoDraftRef.current = false;
      setSubmissions([draftSubmission]);
      setActiveSubmissionId(draftSubmission.id);
      setNotice({
        tone: 'info',
        message: `${activeSubmission.proposalLabel} was deleted. A new draft is ready.`
      });
      return;
    }

    suppressAutoDraftRef.current = true;
    const nextActiveSubmission = remainingSubmissions[0];
    setSubmissions(
      remainingSubmissions.map((submission) => ({
        ...submission,
        isCurrent: submission.id === nextActiveSubmission.id
      }))
    );
    setActiveSubmissionId(nextActiveSubmission.id);
    setNotice({
      tone: 'success',
      message: `${activeSubmission.proposalLabel} draft was deleted.`
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
    if (status === 'archived') return 5;
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
    { id: 4, label: 'Approved', icon: 'fa-check-circle' },
    { id: 5, label: 'Archived', icon: 'fa-box-archive' },
  ];

  return (
    <div className="student-title-submission-page">
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
            <p>Upload your title proposal document using the required concept paper format.</p>
          </div>
        </div>
      </header>

      <div className="page-body p-6 lg:p-8">
        
        {notice && (
          <div className={`mb-6 rounded-xl border p-4 flex items-center gap-3 ${
            notice.tone === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            notice.tone === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            notice.tone === 'danger' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <i className={`fas ${
                notice.tone === 'success' ? 'fa-circle-check' :
                notice.tone === 'warning' ? 'fa-triangle-exclamation' :
                notice.tone === 'danger' ? 'fa-circle-exclamation' :
                'fa-circle-info'
              } text-lg`} aria-hidden="true" />
            <span className="text-sm font-medium">{notice.message}</span>
          </div>
        )}

        {/* Compact Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <i className="fas fa-paper-plane text-xl" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Submitted</p>
                <p className="text-2xl font-bold text-slate-900">{submissions.filter(s => s.registrationStatus !== 'Draft').length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <i className="fas fa-clock text-xl" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Review</p>
                <p className="text-2xl font-bold text-slate-900">{pendingReviewCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <i className="fas fa-check-circle text-xl" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Approved</p>
                <p className="text-2xl font-bold text-slate-900">{approvedCount}</p>
              </div>
            </div>
          </div>
          <div className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${rejectedCount > 0 ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${rejectedCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                <i className="fas fa-ban text-xl" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Rejected</p>
                <p className={`text-2xl font-bold ${rejectedCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{rejectedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Status Banner */}
        {showRejectionBanner && latestRejectedSubmission && (
          <div className="mb-6 rounded-[1.25rem] border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-inner">
                <i className="fas fa-circle-exclamation text-xl" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-rose-800 flex items-center gap-2">
                  <span>Previous Title Rejected</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10">
                    <i className="fas fa-ban text-[10px]" /> Rejected
                  </span>
                </h3>
                <p className="mt-1.5 text-sm text-rose-700/80 font-medium">
                  <strong>&ldquo;{latestRejectedSubmission.proposedTitle}&rdquo;</strong> was rejected by your adviser.
                </p>
                {latestRejectedSubmission.statusNote && (
                  <div className="mt-3 rounded-xl bg-white/70 border border-rose-100 p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      <i className="fas fa-comment-dots mr-1" /> Adviser Remarks
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{latestRejectedSubmission.statusNote}</p>
                  </div>
                )}
                <p className="mt-3 text-sm text-rose-600 font-semibold">
                  <i className="fas fa-arrow-down mr-1" /> Use the form below to upload a new title proposal directly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Approval Banner — prompt to upload another if viewing draft */}
        {showApprovalBanner && latestApprovedSubmission && (
          <div className="mb-6 rounded-[1.25rem] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
                <i className="fas fa-circle-check text-xl" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-emerald-800 flex items-center gap-2">
                  <span>Title Approved</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                    <i className="fas fa-check text-[10px]" /> Approved
                  </span>
                </h3>
                <p className="mt-1.5 text-sm text-emerald-700/80 font-medium">
                  <strong>&ldquo;{latestApprovedSubmission.proposedTitle}&rdquo;</strong> has been approved by your adviser.
                </p>
                <p className="mt-3 text-sm text-emerald-600 font-semibold">
                  <i className="fas fa-arrow-down mr-1" /> You may submit another title proposal below if needed.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Upload Section & Timeline */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Upload Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-sm flex flex-col h-full transition-shadow duration-300 hover:shadow-md">
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                    <i className="fas fa-file-signature text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Upload Proposal</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">Prepare and submit your concept paper package</p>
                  </div>
                </div>

                <div className="flex max-w-full flex-col sm:flex-row sm:flex-wrap items-center justify-end gap-3 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100/80">
                  <div className="flex items-center gap-2">
                     <div className="relative inline-block w-[190px] sm:w-[220px]">
                       <select 
                         className="appearance-none cursor-pointer w-full rounded-xl bg-white pl-9 pr-8 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-inset ring-slate-200/80 hover:bg-slate-50 hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-sm text-ellipsis overflow-hidden"
                         value={activeSubmissionId}
                         onChange={(e) => handleSelectSubmission(e.target.value)}
                       >
                         {submissions.map((sub) => (
                           <option key={sub.id} value={sub.id}>
                             {sub.proposalLabel} {sub.registrationStatus === 'Draft' ? '(Draft)' : ''} - {sub.registrationStatus}
                           </option>
                         ))}
                       </select>
                       <i className="fas fa-layer-group absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" aria-hidden="true" />
                       <i className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" aria-hidden="true" />
                     </div>
                     <Badge label={activeSubmission.registrationStatus} tone={titleStatusTone} />
                  </div>
                  
                  <div className="hidden sm:block w-px h-8 bg-slate-200/60 mx-1"></div>
                  
                  <button 
                    type="button" 
                    onClick={handleCreateSubmission}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-600 ring-1 ring-inset ring-slate-200/80 shadow-sm transition hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200 active:scale-95 w-full sm:w-auto"
                  >
                    <i className="fas fa-plus text-blue-500" aria-hidden="true" /> Upload Another
                  </button>

                  {activeSubmission.registrationStatus === 'Draft' ? (
                    <button
                      type="button"
                      onClick={handleDeleteDraftSubmission}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-4 text-sm font-bold text-rose-600 ring-1 ring-inset ring-rose-200/80 shadow-sm transition hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-200 active:scale-95 sm:w-10 sm:px-0"
                      aria-label={`Delete ${activeSubmission.proposalLabel} draft`}
                      title="Delete Draft"
                    >
                      <i className="fas fa-trash-can text-rose-500" aria-hidden="true" />
                      <span className="sm:sr-only">Delete Draft</span>
                    </button>
                  ) : null}
                </div>
              </div>
              
              <div className="p-8 flex-grow flex flex-col">
                <div className="mb-8">
                  <label htmlFor="proposedTitle" className="block text-sm font-bold text-slate-700 mb-2.5 ml-1">
                    Proposed Title <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <i className="fas fa-heading"></i>
                    </div>
                    <input
                      id="proposedTitle"
                      type="text"
                      value={activeSubmission.proposedTitle === 'basag' || activeSubmission.proposedTitle === 'No active project' ? '' : activeSubmission.proposedTitle}
                      onChange={(e) => updateActiveSubmission(sub => ({ ...sub, proposedTitle: e.target.value }))}
                      placeholder="Enter the official, finalized title of your study"
                      className="block w-full rounded-2xl border-0 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      disabled={!canUpload}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 ml-1 font-medium">
                    <i className="fas fa-magic text-amber-500 mr-1"></i> If left blank, the title will be automatically extracted from your filename.
                  </p>
                </div>

                <div className="mb-8">
                  <label htmlFor="briefDescription" className="block text-sm font-bold text-slate-700 mb-2.5 ml-1">
                    Note to Your Adviser <span className="text-slate-400 font-medium text-xs uppercase tracking-wider ml-1 px-2 py-0.5 bg-slate-100 rounded-md">Optional</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute top-4 left-0 flex items-start pl-4 pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <i className="fas fa-comment-dots"></i>
                    </div>
                    <textarea
                      id="briefDescription"
                      value={
                        activeSubmission.briefDescription === 'Title proposal document uploaded for adviser review. The required contents are expected inside the attached file.' || 
                        activeSubmission.briefDescription === 'Title proposal submitted for adviser validation.' ||
                        activeSubmission.briefDescription === 'Title proposal submitted for adviser validation.dsfsdfsdfs'
                        ? '' : activeSubmission.briefDescription
                      }
                      onChange={(e) => updateActiveSubmission(sub => ({ ...sub, briefDescription: e.target.value }))}
                      placeholder="Add specific questions, context, or areas you want your adviser to focus on..."
                      className="block w-full rounded-2xl border-0 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 min-h-[120px] resize-y"
                      disabled={!canUpload}
                    />
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  hidden
                  multiple
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleAttachmentInputChange}
                />
                
                {/* Drag and Drop Area */}
                <div className="mb-2 ml-1 flex items-center justify-between">
                  <span className="block text-sm font-bold text-slate-700">Concept Paper Document <span className="text-rose-500">*</span></span>
                </div>
                <button 
                  type="button"
                  onClick={handleBrowseAttachments}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  disabled={!canUpload}
                  className={`group relative flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed py-14 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50/50 shadow-inner scale-[1.01]' 
                      : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-sm disabled:hover:border-slate-300 disabled:hover:bg-slate-50'
                  }`}
                >
                  <div className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md mb-6 transition-all duration-500 ${isDragging ? 'scale-110 shadow-blue-200' : 'group-hover:scale-110 group-hover:shadow-blue-100'}`}>
                    <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping opacity-0 group-hover:opacity-100 duration-1000"></div>
                    <i className={`fas fa-cloud-arrow-up text-3xl transition-colors duration-300 ${isDragging ? 'text-blue-600' : 'text-blue-500 group-hover:text-blue-600'}`} aria-hidden="true"></i>
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-700 group-hover:text-blue-700 transition-colors">Drag and drop your file here</h4>
                  <p className="mt-2 text-sm text-slate-500 font-medium">or click to browse from your computer</p>
                  
                  <div className="mt-6 flex gap-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm"><i className="fas fa-file-pdf text-rose-500 text-sm"></i> PDF</span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm"><i className="fas fa-file-word text-blue-600 text-sm"></i> DOCX</span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm"><i className="fas fa-weight-hanging text-slate-400 text-sm"></i> 10MB Max</span>
                  </div>
                </button>

                {/* Uploaded Files Display */}
                <div className="mt-6">
                  {activeSubmission.attachments.length > 0 ? (
                    <div className="space-y-3">
                      {activeSubmission.attachments.map(att => (
                        <div key={att.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/50 to-white p-4 transition-all hover:shadow-md hover:border-emerald-300">
                          <div className="flex items-start sm:items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white border border-emerald-100 text-emerald-600 shadow-sm transition-transform group-hover:scale-105">
                              <i className={`fas fa-file-${att.fileType.toLowerCase() === 'pdf' ? 'pdf text-rose-500' : 'word text-blue-600'} text-2xl`} aria-hidden="true"></i>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate" title={att.fileName}>{att.fileName}</p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5 font-semibold">
                                <span className="flex items-center gap-1.5"><i className="fas fa-calendar-check text-emerald-500"></i> {att.uploadedAtLabel}</span>
                                <span className="flex items-center gap-1.5"><i className="fas fa-hard-drive text-slate-400"></i> {att.sizeLabel}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button onClick={() => handleOpenAttachment(att)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm" title="Preview">
                              <i className="fas fa-expand" aria-hidden="true"></i>
                            </button>
                            <button onClick={() => handleRemoveAttachment(att.id)} disabled={!canUpload} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" title="Remove">
                              <i className="fas fa-trash-can" aria-hidden="true"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-6 text-amber-800 shadow-inner">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                         <i className="fas fa-asterisk text-sm" aria-hidden="true"></i>
                      </div>
                      <p className="text-sm font-semibold">No proposal document attached. Upload a file to proceed.</p>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="mt-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 mt-8">
                  <div className="flex items-center gap-3 hidden sm:flex">
                    <div className={`h-2.5 w-2.5 rounded-full ${activeSubmission.attachments.length === 0 || !activeSubmission.proposedTitle.trim() ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {activeSubmission.attachments.length === 0 ? 'Awaiting File' : !activeSubmission.proposedTitle.trim() ? 'Awaiting Title' : 'Ready to Submit'}
                    </span>
                  </div>
                  <form onSubmit={handleSubmitProposal} className="w-full sm:w-auto">
                    <button 
                      type="submit"
                      disabled={!canUpload || isSubmittingTitle || activeSubmission.attachments.length === 0 || !activeSubmission.proposedTitle.trim()}
                      className="group flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span>{isSubmittingTitle ? 'Submitting...' : 'Submit for Adviser Review'}</span>
                      <i className={`fas fa-paper-plane transition-transform ${isSubmittingTitle ? 'animate-bounce' : 'group-hover:translate-x-1 group-hover:-translate-y-1'}`} aria-hidden="true"></i>
                    </button>
                  </form>
                </div>
              </div>
            </div>


          </div>

          {/* Right Column: Requirements Checklist & Meta */}
          <div className="space-y-6">
            
            {/* Requirements Checklist Card */}
            <div className="rounded-[1.25rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#003A8F] to-[#1E40AF] p-6 text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <i className="fas fa-list-check" aria-hidden="true"></i> Document Requirements
                </h3>
                <p className="text-sm text-blue-100 mt-2 font-medium opacity-90 leading-relaxed">
                  Ensure your concept paper includes these sections before uploading.
                </p>
              </div>
              <div className="p-6 bg-slate-50/50">
                <ul className="space-y-3.5">
                  {[
                    'Title',
                    'Background of the study',
                    'Statement of the problem',
                    'Objectives of the study',
                    'Comparison of related studies',
                    'Proposed solution',
                    'Process of Addressing the Problems',
                    'References'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3.5 text-sm font-semibold text-slate-700">
                      <i className="fas fa-check text-emerald-500 mt-0.5 text-base" aria-hidden="true"></i>
                      {item}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6 rounded-xl border border-[#F6BE00]/40 bg-[#F6BE00]/10 p-4 flex items-start gap-3 shadow-sm">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F6BE00]/20 text-[#D97706]">
                    <i className="fas fa-triangle-exclamation text-xs" aria-hidden="true"></i>
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-relaxed">
                    Your uploaded file must follow the required concept paper format. Missing sections may delay the adviser review.
                  </p>
                </div>
              </div>
            </div>

            {/* Submission Info */}
            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-5">Submission Details</h3>
              <div className="space-y-5">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 mb-1">Adviser</span>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <i className="fas fa-user-tie text-blue-600" aria-hidden="true"></i>
                    {activeSubmission.adviser}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 mb-1">Group Members</span>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {activeSubmission.groupMembers.map((member, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                         <i className="fas fa-user text-slate-400 text-xs" aria-hidden="true"></i> {member}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 mb-1">Latest Action</span>
                  <div className="mt-1">
                    <Badge label={latestAction} tone={titleStatusTone} />
                    {activeSubmission.statusNote && (
                      <p className="text-sm font-medium text-slate-700 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 mt-2 leading-relaxed">
                        {activeSubmission.statusNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
