'use client';

import Link from 'next/link';
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { formatFileSizeLabel } from '@/components/students/student-project-files.shared';
import type {
  StudentDashboardData,
  StudentTitleAttachment,
  StudentTitleSubmissionRecord,
  StudentTitleWorkflowStep
} from '@/lib/mock/student-dashboard';

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
  title: StudentDashboardData['titleRegistration']
): StudentTitleSubmissionRecord[] {
  const seed = title.submissions?.length ? title.submissions : [createSubmissionFromRegistration(title)];

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
    downloadUrl
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
    <span className={`ui-badge is-${tone}`}>
      {icon ? <i className={`fas ${icon}`} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

export function StudentTitleSubmission({ data }: { data: StudentDashboardData }) {
  const isLeader = Boolean(data.profile.groupRole && data.profile.groupRole.toLowerCase().includes('leader'));
  const canUpload = isLeader || data.group?.allowMemberSubmission;
  const initialSubmissions = useMemo(
    () => buildInitialSubmissions(data.titleRegistration),
    [data.titleRegistration]
  );
  const [submissions, setSubmissions] = useState<StudentTitleSubmissionRecord[]>(initialSubmissions);
  const [activeSubmissionId, setActiveSubmissionId] = useState(
    initialSubmissions.find((item) => item.isCurrent)?.id ?? initialSubmissions[0]?.id ?? ''
  );
  const [notice, setNotice] = useState<NoticeState>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
    setSubmissions(initialSubmissions);
    setActiveSubmissionId(
      initialSubmissions.find((item) => item.isCurrent)?.id ?? initialSubmissions[0]?.id ?? ''
    );
  }, [initialSubmissions]);

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
  const latestUpdatedSubmission = [...submissions].sort(
    (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  )[0];

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
        message: 'Only the group leader is authorized to create a new title proposal.'
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

  const handleAttachmentInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!canUpload) {
      setNotice({
        tone: 'warning',
        message: 'Only authorized users can upload files.'
      });
      return;
    }

    const files = Array.from(event.target.files ?? []);

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
      briefDescription:
        submission.briefDescription.trim() ||
        'Title proposal document uploaded for adviser review. The required contents are expected inside the attached file.',
      attachments: [...attachments, ...submission.attachments],
      updated_at: new Date().toISOString()
    }));

    setNotice({
      tone: 'success',
      message: `${files.length} proposal file${files.length === 1 ? '' : 's'} attached to ${activeSubmission.proposalLabel}.`
    });

    event.target.value = '';
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

  const handleSubmitProposal = (event: FormEvent<HTMLFormElement>) => {
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

    setSubmissions((current) =>
      current.map((submission) => {
        if (submission.id !== activeSubmission.id) {
          return {
            ...submission,
            isCurrent: false
          };
        }

        return {
          ...submission,
          isCurrent: true,
          updated_at: submittedAt,
          lastReviewedAt: submittedAt,
          registrationStatus: 'Pending Review',
          statusNote:
            'The title proposal document was submitted for adviser review. The required title, background, statement of the problem, and objectives are expected inside the uploaded file package.',
          reviewSummary: {
            latestAction: 'Submitted for adviser review',
            nextStep: 'Wait for adviser validation, title similarity checking, and revision instructions if needed.',
            lastReviewedBy: activeSubmission.adviser,
            accessRole: 'Group leader access',
            accessNote: 'Only the current group leader can submit official title updates for adviser review.'
          },
          revisionHistory: [
            {
              id: `${submission.id}-submission-${Date.now()}`,
              status: revisionLabel,
              date: submittedAt,
              dateLabel: formatDateLabel(submittedAt),
              note: `${submission.proposalLabel} was submitted with ${submission.attachments.length} attached proposal file${submission.attachments.length === 1 ? '' : 's'} for adviser validation.`,
              reviewedBy: 'Student Group'
            },
            ...submission.revisionHistory
          ]
        };
      })
    );

    setNotice({
      tone: 'success',
      message: `${activeSubmission.proposalLabel} was submitted using the uploaded proposal document.`
    });
  };

  return (
    <div className="register-title-page student-title-submission-page">
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
            <p>
              Prepare multiple title proposals and submit them by uploading the document file instead of filling out the title sections in-page.
            </p>
          </div>
        </div>
      </header>

      <div className="page-body">
        <section className="dashboard-hero title-submission-hero">
          <article className="dashboard-hero-main title-submission-hero-main">
            <div className="student-dashboard-overview-top">
              <span className="section-kicker">Title Workspace</span>
              <div className="chip-row">
                <Badge label={activeSubmission.registrationStatus} tone={titleStatusTone} icon="fa-file-signature" />
                <Badge label={activeSubmission.proposalLabel} tone="neutral" icon="fa-layer-group" />
                <Badge label={accessRoleLabel} tone={getStatusTone(accessRoleLabel)} icon="fa-user-shield" />
              </div>
            </div>

            <div className="title-submission-hero-copy">
              <h2>Manage several title proposals with an upload-first submission flow</h2>
              <p>
                Each proposal now centers on the uploaded title document package, so the required title, background,
                problem statement, and objectives stay inside the file instead of being typed again in the page.
              </p>
            </div>

            <div className="dashboard-callout-grid title-submission-hero-stats">
              {heroStats.map((item) => (
                <article key={item.id} className="dashboard-callout title-submission-hero-stat">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.note}</small>
                </article>
              ))}
            </div>

            <div className="dashboard-action-grid title-submission-hero-actions">
              <button className="dashboard-action-card title-submission-action-card" type="button" onClick={handleCreateSubmission}>
                <span className="dashboard-action-icon">
                  <i className="fas fa-plus" aria-hidden="true" />
                </span>
                <div className="title-submission-action-copy">
                  <span className="title-submission-action-meta">New proposal</span>
                  <strong>Create Another Title</strong>
                  <small>Start a separate title proposal record without overwriting the current one.</small>
                </div>
              </button>

              <button className="dashboard-action-card title-submission-action-card" type="button" onClick={handleBrowseAttachments}>
                <span className="dashboard-action-icon">
                  <i className="fas fa-file-arrow-up" aria-hidden="true" />
                </span>
                <div className="title-submission-action-copy">
                  <span className="title-submission-action-meta">{activeSubmission.attachments.length} attached</span>
                  <strong>Upload Proposal Files</strong>
                  <small>Attach the title package document with the required sections for this proposal.</small>
                </div>
              </button>

              <button className="dashboard-action-card title-submission-action-card" type="button" onClick={() => handleOpenAttachment(latestAttachment)}>
                <span className="dashboard-action-icon">
                  <i className="fas fa-file-lines" aria-hidden="true" />
                </span>
                <div className="title-submission-action-copy">
                  <span className="title-submission-action-meta">{latestAttachment?.fileType ?? 'Waiting for file'}</span>
                  <strong>Open Latest Upload</strong>
                  <small>Preview the uploaded title proposal file instead of relying on a generated fill-up record.</small>
                </div>
              </button>

              <Link className="dashboard-action-card title-submission-action-card" href="#title-revision-history">
                <span className="dashboard-action-icon">
                  <i className="fas fa-clock-rotate-left" aria-hidden="true" />
                </span>
                <div className="title-submission-action-copy">
                  <span className="title-submission-action-meta">
                    {revisionHistory.length} record{revisionHistory.length === 1 ? '' : 's'}
                  </span>
                  <strong>Open Review Log</strong>
                  <small>Review submission history, adviser actions, and revision notes for the active proposal.</small>
                </div>
              </Link>
            </div>

            {notice ? (
              <div className={`title-submission-notice is-${notice.tone}`}>
                <i
                  className={`fas ${
                    notice.tone === 'success'
                      ? 'fa-circle-check'
                      : notice.tone === 'danger'
                        ? 'fa-circle-exclamation'
                        : notice.tone === 'warning'
                          ? 'fa-triangle-exclamation'
                          : 'fa-circle-info'
                  }`}
                  aria-hidden="true"
                />
                <span>{notice.message}</span>
              </div>
            ) : null}
          </article>

          <div className="dashboard-hero-side">
            <article className="dashboard-brief-card title-submission-brief-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Active Proposal</span>
                  <h3>{activeSubmission.proposalLabel}</h3>
                </div>
                <Badge
                  label={currentWorkflowStep ? `Now in ${currentWorkflowStep.title}` : 'Workflow active'}
                  tone={currentWorkflowStep ? getWorkflowStatusTone(currentWorkflowStep.status) : 'info'}
                  icon="fa-diagram-project"
                />
              </div>

              <div className="detail-grid title-submission-snapshot-grid">
                {statusMetaItems.map((item) => (
                  <article key={item.id} className="detail-item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </article>
                ))}
              </div>

              <div className={`workspace-note ${isLeader ? 'is-leader' : 'is-member'}`}>
                <strong>{nextStep}</strong>
                <p>{accessNote}</p>
              </div>
            </article>

            <article className="dashboard-brief-card title-submission-brief-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Validation Snapshot</span>
                  <h3>Similarity and file readiness</h3>
                </div>
                <Badge
                  label={validation?.status ?? 'Pending validation'}
                  tone={getStatusTone(validation?.status ?? 'Pending')}
                  icon="fa-shield-halved"
                />
              </div>

              <div className="detail-grid title-submission-snapshot-grid">
                {validationSnapshotItems.map((item) => (
                  <article key={item.id} className="detail-item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </article>
                ))}
              </div>

              <div className="workspace-note is-member">
                <strong>The uploaded proposal document is now the main submission record.</strong>
                <p>Put the title, background, statement of the problem, and objectives inside that file before sending it for adviser review.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="content-grid two-thirds">
          <div className="stack-section">
            <article className="surface-card title-submission-queue-card">
              <div className="card-heading title-submission-queue-head">
                <div>
                  <span className="section-kicker">Proposal Queue</span>
                  <h3>Switch between title proposals</h3>
                  <p>Each title proposal keeps a separate file list, required sections, and review history.</p>
                </div>
                <button className="btn btn-primary" type="button" onClick={handleCreateSubmission}>
                  <i className="fas fa-plus" aria-hidden="true" /> New title proposal
                </button>
              </div>

              <div className="title-submission-queue-list">
                {submissions.map((submission) => {
                  const isActive = submission.id === activeSubmission.id;

                  return (
                    <button
                      key={submission.id}
                      className={`title-submission-queue-item ${isActive ? 'is-active' : ''}`}
                      type="button"
                      onClick={() => handleSelectSubmission(submission.id)}
                    >
                      <div className="title-submission-queue-item-head">
                        <div>
                          <span>{submission.proposalLabel}</span>
                          <strong>{submission.proposedTitle || submission.attachments[0]?.fileName || 'Untitled title proposal'}</strong>
                        </div>
                        <Badge label={submission.registrationStatus} tone={getStatusTone(submission.registrationStatus)} />
                      </div>
                      <p>
                        {submission.attachments.length
                          ? `Latest file: ${submission.attachments[0]?.fileName}. This uploaded document is treated as the title proposal package for review.`
                          : 'Upload the title proposal document for this record before submitting it for adviser review.'}
                      </p>
                      <div className="title-submission-queue-meta">
                        <small>{submission.attachments.length} file{submission.attachments.length === 1 ? '' : 's'}</small>
                        <small>{submission.registrationStatus}</small>
                        <small>Updated {formatDateLabel(submission.updated_at)}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>

            <article className="surface-card register-title-workflow-card">
              <div className="register-title-workflow-head">
                <div>
                  <span className="section-kicker">Workflow</span>
                  <h3>Review steps for the active proposal</h3>
                </div>
                <Badge
                  label={currentWorkflowStep ? `${currentWorkflowStep.title} active` : 'Workflow active'}
                  tone={currentWorkflowStep ? getWorkflowStatusTone(currentWorkflowStep.status) : 'info'}
                />
              </div>

              <p>Each title proposal follows its own draft, submission, review, approval, and archive trail.</p>

              <div className="register-title-stepper">
                {workflow.map((step, index) => (
                  <article key={step.id} className={`register-title-step is-${step.status}`}>
                    <div className="register-title-step-head">
                      <span className="register-title-step-index">{index + 1}</span>
                      <Badge label={getWorkflowStatusLabel(step.status)} tone={getWorkflowStatusTone(step.status)} />
                    </div>
                    <strong>{step.title}</strong>
                    <small>{step.dateLabel ?? 'Awaiting update'}</small>
                    <p>{step.note}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="surface-card register-title-form-card" id="title-submission-form">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Upload Workflow</span>
                  <h3>Upload the title proposal document</h3>
                  <p>
                    The title submission page now expects the proposal content to live in the uploaded document file instead of a fill-up form.
                  </p>
                </div>
              </div>

              <div className="register-title-form-summary">
                {formSummaryItems.map((item) => (
                  <article key={item.id} className="register-title-form-summary-item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </article>
                ))}
              </div>

              <form className="register-title-form" onSubmit={handleSubmitProposal}>
                <section className="register-title-form-group">
                  <div className="register-title-form-section-head">
                    <strong>Document checklist</strong>
                    <p>Include these sections inside the uploaded proposal document before you submit it.</p>
                  </div>

                  <div className="title-submission-requirement-grid">
                    {[
                      'Title',
                      'Background',
                      'Statement of the Problem',
                      'Objectives'
                    ].map((item) => (
                      <article key={item} className="title-submission-requirement-card">
                        <span>{item}</span>
                        <strong>{item} must be inside the uploaded file</strong>
                        <small>The adviser will review this section from the attached proposal document.</small>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="register-title-form-group register-title-form-group-members">
                  <div className="register-title-form-section-head register-title-form-section-head--compact">
                    <strong>Review ownership</strong>
                    <p>These fields identify the adviser and group roster connected to this proposal package.</p>
                  </div>

                  <div className="form-field">
                    <label htmlFor="title-submission-adviser">Adviser</label>
                    <input
                      id="title-submission-adviser"
                      name="adviser"
                      value={activeSubmission.adviser}
                      disabled
                    />
                    <span className="register-title-field-hint">This reviewer receives the official title proposal package.</span>
                  </div>

                  <div className="form-field">
                    <label htmlFor="title-submission-members">Group members</label>
                    <textarea
                      id="title-submission-members"
                      name="groupMembers"
                      rows={5}
                      value={activeSubmission.groupMembers.join('\n')}
                      disabled
                    />
                    <span className="register-title-field-hint">
                      Membership is read-only and follows the currently registered student group.
                    </span>
                  </div>
                </section>

                <section className="register-title-form-group">
                  <div className="register-title-form-section-head">
                    <div className="flex w-full items-center justify-between gap-4">
                      <div>
                        <strong>Proposal documents</strong>
                        <p>Upload the title proposal file that already contains the title, background, statement of the problem, and objectives.</p>
                      </div>
                      {isLeader && data.group?.id && (
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition hover:bg-slate-50">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            defaultChecked={data.group?.allowMemberSubmission}
                            onChange={async (e) => {
                              const isChecked = e.target.checked;
                              try {
                                const res = await fetch('/api/groups', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: data.group.id, allowMemberSubmission: isChecked })
                                });
                                if (res.ok) {
                                  setNotice({ tone: 'success', message: isChecked ? 'Members are now allowed to upload files.' : 'Member uploads restricted.' });
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          />
                          <span className="text-sm font-medium text-slate-700">Allow Member Uploads</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="title-submission-upload-shell">
                    <div className="register-title-panel-copy">
                      <strong>Attach the title proposal file for this record.</strong>
                      <p>The uploaded document itself is treated as the submission package. No separate in-page fill-up is required.</p>
                    </div>

                    <div className="register-title-panel-actions title-submission-file-actions">
                      {canUpload ? (
                        <button className="btn btn-secondary" type="button" onClick={handleBrowseAttachments}>
                          <i className="fas fa-file-arrow-up" aria-hidden="true" /> Upload proposal file
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-3">
                          <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 shadow-sm">
                            <i className="fas fa-lock" aria-hidden="true" />
                            <span>Only the group leader can upload files.</span>
                          </div>
                          <button 
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 hover:shadow-md" 
                            type="button" 
                            onClick={handleRequestPermission}
                          >
                            <i className="fas fa-paper-plane" aria-hidden="true" /> Request Permission
                          </button>
                        </div>
                      )}
                      <button className="btn btn-primary" type="button" onClick={() => handleOpenAttachment(latestAttachment)} disabled={!latestAttachment}>
                        <i className="fas fa-eye" aria-hidden="true" /> Open latest file
                      </button>
                      <button className="btn btn-ghost" type="button" onClick={() => handleDownloadAttachment(latestAttachment)} disabled={!latestAttachment}>
                        <i className="fas fa-download" aria-hidden="true" /> Download latest file
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      hidden
                      multiple
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                      onChange={handleAttachmentInputChange}
                    />

                    {activeSubmission.attachments.length ? (
                      <div className="title-submission-upload-list">
                        {activeSubmission.attachments.map((attachment) => (
                          <article key={attachment.id} className="title-submission-upload-item">
                            <div className="title-submission-upload-item-head">
                              <div>
                                <strong>{attachment.fileName}</strong>
                                <small>{attachment.fileType} | {attachment.sizeLabel}</small>
                              </div>
                              <Badge label={attachment.status} tone={getStatusTone(attachment.status)} icon="fa-paperclip" />
                            </div>
                            <div className="title-submission-upload-meta">
                              <span>Uploaded {attachment.uploadedAtLabel}</span>
                              <span>{attachment.uploadedBy}</span>
                            </div>
                            <div className="title-submission-upload-actions">
                              {attachment.downloadUrl ? (
                                <>
                                  <button className="btn btn-secondary" type="button" onClick={() => handleOpenAttachment(attachment)}>
                                    <i className="fas fa-eye" aria-hidden="true" /> Open
                                  </button>
                                  <button className="btn btn-ghost" type="button" onClick={() => handleDownloadAttachment(attachment)}>
                                    <i className="fas fa-download" aria-hidden="true" /> Download
                                  </button>
                                </>
                              ) : null}
                              <button
                                className="btn btn-ghost"
                                type="button"
                                onClick={() => handleRemoveAttachment(attachment.id)}
                                disabled={!isLeader}
                              >
                                <i className="fas fa-trash-can" aria-hidden="true" /> Remove
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="register-title-empty-card">
                        <strong>No proposal file attached yet</strong>
                        <p>Upload the title proposal package before sending this record to the adviser review queue.</p>
                      </div>
                    )}
                  </div>
                </section>

                <div className="register-title-form-actions">
                  <div className="register-title-submit-cluster">
                    <button className="btn btn-primary register-title-primary-action" type="submit" disabled={!canUpload}>
                      <i className="fas fa-paper-plane" aria-hidden="true" />
                      {canUpload ? 'Submit Title Proposal for Review' : 'Leader Action Required'}
                    </button>
                    <span className="register-title-submit-note">
                      {canUpload
                        ? 'Submission only requires at least one uploaded title proposal document. The required sections must already be inside that file.'
                        : `This shared form is read-only for members. Coordinate with ${data.group.leaderName} for official title submission.`}
                    </span>
                  </div>

                  <div className="form-helper">
                    <strong>Last workflow update: {lastReviewedLabel}</strong>
                    <p>
                      {latestAction}. {activeSubmission.statusNote}
                    </p>
                  </div>
                </div>
              </form>
            </article>

            <article className="surface-card register-title-history-card" id="title-revision-history">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Revision History</span>
                  <h3>Review log for {activeSubmission.proposalLabel}</h3>
                  <p>Each proposal keeps a separate review trail so title alternatives do not overwrite one another.</p>
                </div>
              </div>

              <div className="register-title-timeline">
                {revisionHistory.length ? (
                  revisionHistory.map((entry, index) => (
                    <article key={entry.id} className={`register-title-timeline-item ${index === 0 ? 'is-latest' : ''}`}>
                      <div className="stack-card-head">
                        <div>
                          <strong>{entry.status}</strong>
                          <small>{entry.reviewedBy}</small>
                        </div>
                        <small>{entry.dateLabel}</small>
                      </div>
                      <Badge label={entry.status} tone={getStatusTone(entry.status)} />
                      <p>{entry.note}</p>
                    </article>
                  ))
                ) : (
                  <div className="register-title-empty-card">
                    <strong>No revision records yet</strong>
                    <p>This proposal has not been submitted for adviser review yet.</p>
                  </div>
                )}
              </div>
            </article>
          </div>

          <aside className="stack-section register-title-page-side">
            <article className="surface-card register-title-side-card">
              <div className="register-title-workflow-head">
                <div>
                  <span className="section-kicker">Approval Status</span>
                  <h3>Current title review state</h3>
                </div>
                <Badge label={activeSubmission.registrationStatus} tone={titleStatusTone} icon="fa-file-signature" />
              </div>

              <div className="register-title-panel-copy">
                <strong>{latestAction}</strong>
                <p>{activeSubmission.statusNote}</p>
              </div>

              <div className="register-title-side-meta">
                {statusMetaItems.map((item) => (
                  <div key={item.id}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </div>
                ))}
              </div>

              <div className="register-title-panel-actions">
                <Link className="btn btn-secondary" href="/students/project-overview">
                  <i className="fas fa-folder-open" aria-hidden="true" /> Project overview
                </Link>
                <Link className="btn btn-ghost" href="/students/faculty-feedback">
                  <i className="fas fa-comments" aria-hidden="true" /> Faculty feedback
                </Link>
              </div>
            </article>

            <article className="surface-card register-title-side-card">
              <div className="register-title-feedback-head">
                <div>
                  <span className="section-kicker">Feedback</span>
                  <h3>Latest notes for the active proposal</h3>
                </div>
                <Badge
                  label={
                    reviewerFeedback.length
                      ? `${reviewerFeedback.length} note${reviewerFeedback.length === 1 ? '' : 's'}`
                      : 'No notes yet'
                  }
                  tone={reviewerFeedback.length ? 'warning' : 'neutral'}
                  icon="fa-comments"
                />
              </div>

              {reviewerFeedback.length ? (
                <div className="register-title-feedback-list">
                  {reviewerFeedback.map((entry) => (
                    <article key={entry.id} className="register-title-feedback-item">
                      <div className="register-title-feedback-head">
                        <div>
                          <strong>{entry.author}</strong>
                          <small>
                            {entry.role} | {entry.dateLabel}
                          </small>
                        </div>
                        <Badge label={entry.status} tone={getStatusTone(entry.status)} />
                      </div>
                      <p>{entry.note}</p>
                      {entry.route && entry.actionLabel ? (
                        <Link className="inline-link" href={entry.route}>
                          {entry.actionLabel}
                        </Link>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="register-title-empty-card">
                  <strong>No reviewer notes yet</strong>
                  <p>Feedback from adviser review will appear here after this proposal is submitted.</p>
                </div>
              )}
            </article>

            <article className="surface-card register-title-side-card">
              <div className="register-title-validation-head">
                <div>
                  <span className="section-kicker">Validation</span>
                  <h3>Similarity and title check</h3>
                </div>
                <Badge
                  label={validation?.status ?? 'Pending validation'}
                  tone={getStatusTone(validation?.status ?? 'Pending')}
                  icon="fa-shield-halved"
                />
              </div>

              <div className="register-title-validation-card">
                <div className="register-title-panel-copy">
                  <strong>{validation?.note ?? 'Similarity checking results will appear here once connected.'}</strong>
                  <p>
                    {validation?.checkedAtLabel
                      ? `Last validation checkpoint: ${validation.checkedAtLabel}.`
                      : 'No validation timestamp has been recorded yet.'}
                  </p>
                </div>

                {(validation?.matchedTitles ?? []).length ? (
                  <div className="register-title-validation-list">
                    {validation?.matchedTitles.map((item) => (
                      <article key={item.id} className="register-title-validation-match">
                        <strong>{item.title}</strong>
                        <small>{item.matchLabel}</small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="register-title-empty-card">
                    <strong>No related title matches</strong>
                    <p>Matched titles will appear here once the validation service returns comparison results.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="surface-card register-title-side-card title-submission-guide-card">
              <div className="register-title-workflow-head">
                <div>
                  <span className="section-kicker">Package Guide</span>
                  <h3>What the uploaded file should contain</h3>
                </div>
                <Badge label="Upload-first" tone="info" icon="fa-file-arrow-up" />
              </div>

              <div className="title-submission-side-highlight">
                <span className="title-submission-guide-icon">
                  <i className="fas fa-file-circle-check" aria-hidden="true" />
                </span>
                <div>
                  <strong>{latestAttachment ? latestAttachment.fileName : 'No active proposal file yet'}</strong>
                  <p>
                    {latestAttachment
                      ? `${latestAttachment.fileType} | ${latestAttachment.sizeLabel} | uploaded ${latestAttachment.uploadedAtLabel}`
                      : 'Upload a DOCX or PDF title proposal package before sending this record to adviser review.'}
                  </p>
                </div>
              </div>

              <div className="title-submission-package-grid">
                {[
                  ['Title', 'The proposed study title should be clear and specific.'],
                  ['Background', 'Explain the context, gap, and reason for the study.'],
                  ['Statement of the Problem', 'State the problem the project intends to address.'],
                  ['Objectives', 'List the general and specific goals of the proposal.']
                ].map(([label, copy]) => (
                  <article key={label} className="title-submission-package-item">
                    <span>{label}</span>
                    <strong>Required inside file</strong>
                    <small>{copy}</small>
                  </article>
                ))}
              </div>

              <div className="title-submission-format-card">
                <span>Accepted files</span>
                <div className="title-submission-format-pills">
                  {['PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'ZIP'].map((format) => (
                    <strong key={format}>{format}</strong>
                  ))}
                </div>
                <p>Use PDF or DOCX for the cleanest adviser review. ZIP is useful only when the proposal package includes supporting files.</p>
              </div>

              <div className="title-submission-review-path">
                {[
                  ['1', 'Upload proposal file', 'Attach the document that already contains the required sections.'],
                  ['2', 'Submit for review', 'The record moves to the adviser queue after at least one file is attached.'],
                  ['3', 'Wait for validation', 'Adviser checks title clarity, similarity, and scope alignment.'],
                  ['4', 'Revise if needed', 'Upload a corrected proposal file if adviser feedback requires changes.']
                ].map(([step, label, copy]) => (
                  <article key={step} className="title-submission-review-step">
                    <span>{step}</span>
                    <div>
                      <strong>{label}</strong>
                      <small>{copy}</small>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </aside>
        </section>
      </div>
    </div>
  );
}
