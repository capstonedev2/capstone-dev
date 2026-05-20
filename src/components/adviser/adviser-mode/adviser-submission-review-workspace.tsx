'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { DocumentFileSummary } from '@/components/documents/document-file-controls';
import { DOCUMENT_STORAGE_BUCKETS } from '@/lib/storage/upload-config';
import {
  REVIEW_WORKFLOW_STEPS,
  formatSubmissionDate,
  formatSubmissionDateTime,
  getDeadlineLabel,
  getSubmissionStatusMeta,
  toAdviserSubmissionRecord,
  type AdviserSubmissionRecord,
  type CommentCategory
} from '@/components/adviser/adviser-mode/data/submission-workspace-data';

type ReviewPatchStatus = 'accepted' | 'approved' | 'needs_revision' | 'comment';
type ReviewInfoTab = 'notes' | 'history' | 'details';

const COMMENT_CATEGORIES: CommentCategory[] = [
  'General',
  'Formatting',
  'Technical',
  'Methodology',
  'Approved Remark'
];

type ParsedCommentBody = {
  area: string;
  text: string;
};

type ActionNotice = {
  tone: 'success' | 'error';
  message: string;
};

const REVIEW_INFO_TABS: Array<{ id: ReviewInfoTab; label: string }> = [
  { id: 'notes', label: 'Adviser Notes' },
  { id: 'history', label: 'Version History' },
  { id: 'details', label: 'Document Details' }
];

function getFilePreviewLabel(submission: AdviserSubmissionRecord) {
  const extension = submission.fileExtension.toUpperCase();
  return extension ? `${extension} Preview` : 'Document Preview';
}

function getWorkspaceFileIcon(submission: AdviserSubmissionRecord) {
  const extension = submission.fileExtension.toLowerCase();

  if (extension === 'pdf') return 'fa-file-pdf';
  if (['ppt', 'pptx'].includes(extension)) return 'fa-file-powerpoint';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'fa-file-excel';
  if (['doc', 'docx'].includes(extension)) return 'fa-file-word';

  return 'fa-file-lines';
}

function formatFileSize(size?: number | null) {
  if (!size) {
    return 'Size unavailable';
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isOfficeDocument(submission: AdviserSubmissionRecord) {
  return ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(submission.fileExtension.toLowerCase());
}

function getPreviewUrl(submission: AdviserSubmissionRecord, signedUrl: string) {
  if (isOfficeDocument(submission) && signedUrl) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(signedUrl)}`;
  }

  return `/api/document-files/${submission.id}/preview`;
}

function getRecipientIds(submission: AdviserSubmissionRecord, file?: DocumentFileSummary | null) {
  const groupMembers = file?.groupMembers || submission.groupMembers || [];

  return Array.from(new Set([
    ...groupMembers
      .map((member) => member.userId)
      .filter((userId): userId is string => Boolean(userId)),
    ...(file?.uploadedBy || submission.uploadedBy ? [file?.uploadedBy || submission.uploadedBy || ''] : [])
  ].filter(Boolean)));
}

function getTimelineEvent(submission: AdviserSubmissionRecord, eventId: string) {
  return submission.timeline.find((event) => event.id === eventId) || null;
}

function getReviewStartedAt(submission: AdviserSubmissionRecord) {
  return getTimelineEvent(submission, 'under-review')?.occurredAt || submission.reviewedAt || submission.submittedAt;
}

function getApprovedAt(submission: AdviserSubmissionRecord) {
  return submission.approvedAt || getTimelineEvent(submission, 'approved')?.occurredAt || submission.reviewedAt || new Date().toISOString();
}

function getReviewDurationLabel(startedAt: string, endedAt: string) {
  const durationInMinutes = Math.max(1, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000));

  if (durationInMinutes < 60) {
    return `${durationInMinutes} min`;
  }

  const durationInHours = Math.round(durationInMinutes / 60);

  if (durationInHours < 24) {
    return `${durationInHours} hr${durationInHours === 1 ? '' : 's'}`;
  }

  const durationInDays = Math.round(durationInHours / 24);
  return `${durationInDays} day${durationInDays === 1 ? '' : 's'}`;
}

function getFinalAdviserRemarks(submission: AdviserSubmissionRecord) {
  return submission.comments.find((comment) => comment.category === 'Approved Remark')?.body
    || submission.latestReviewComment?.body
    || 'The document is well-structured and meets the required standards. Approved for student notification.';
}

function getApprovalActor(submission: AdviserSubmissionRecord) {
  return submission.comments.find((comment) => comment.authorName)?.authorName
    || submission.latestReviewComment?.authorName
    || 'Adviser';
}

function isSystemReviewComment(body: string) {
  const normalized = body.trim().toLowerCase();

  return normalized === 'adviser started the formal document review.'
    || normalized === 'adviser started the formal document review. student tracker now shows under adviser review.';
}

function parseCommentBody(body: string): ParsedCommentBody {
  const trimmedBody = body.trim();
  const match = trimmedBody.match(/^Area:\s*(.+?)\n\n([\s\S]*)$/i);

  if (!match) {
    return {
      area: '',
      text: trimmedBody
    };
  }

  return {
    area: match[1]?.trim() || '',
    text: match[2]?.trim() || ''
  };
}

function buildCommentBody(area: string, text: string) {
  const cleanArea = area.trim();
  const cleanText = text.trim();

  if (!cleanText) {
    return '';
  }

  return cleanArea ? `Area: ${cleanArea}\n\n${cleanText}` : cleanText;
}

async function getResponseMessage(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  return payload?.message || payload?.error || fallback;
}

export function AdviserSubmissionReviewWorkspace({ fileId }: { fileId: string }) {
  const [files, setFiles] = useState<DocumentFileSummary[]>([]);
  const [signedUrl, setSignedUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<'reminder' | null>(null);
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);
  const [activeInfoTab, setActiveInfoTab] = useState<ReviewInfoTab>('notes');
  const [notes, setNotes] = useState('');
  const [commentArea, setCommentArea] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentArea, setEditCommentArea] = useState('');
  const [editCommentText, setEditCommentText] = useState('');

  const file = useMemo(() => files.find((item) => item.id === fileId) || null, [fileId, files]);
  const submission = useMemo(
    () => file ? toAdviserSubmissionRecord(file, files.findIndex((item) => item.id === file.id)) : null,
    [file, files]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/document-files?bucketName=${DOCUMENT_STORAGE_BUCKETS.THESIS_DOCUMENTS}`, {
          cache: 'no-store'
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || 'Unable to load review workspace.');
        }

        const nextFiles: DocumentFileSummary[] = payload?.files || [];
        const selectedFile = nextFiles.find((item) => item.id === fileId) || null;

        if (!selectedFile) {
          throw new Error('The selected submission was not found in your assigned review queue.');
        }

        const signedResponse = await fetch(`/api/document-files/${fileId}/signed-url`, { method: 'POST' });
        const signedPayload = await signedResponse.json().catch(() => null);

        if (!signedResponse.ok) {
          throw new Error(signedPayload?.message || 'Unable to open the document preview.');
        }

        if (!cancelled) {
          setFiles(nextFiles);
          setSignedUrl(signedPayload.signedUrl || '');
          const parsedComment = selectedFile.latestReviewComment?.body
            ? parseCommentBody(selectedFile.latestReviewComment.body)
            : null;
          setNotes(parsedComment?.text || '');
          setCommentArea(parsedComment?.area || '');
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load review workspace.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  async function sendSubmissionNotification({
    targetSubmission,
    targetFile,
    title,
    message,
    type,
    entityType = 'uploaded_file'
  }: {
    targetSubmission: AdviserSubmissionRecord;
    targetFile?: DocumentFileSummary | null;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info';
    entityType?: string;
  }) {
    const recipientIds = getRecipientIds(targetSubmission, targetFile);

    if (!recipientIds.length) {
      throw new Error('No student recipients were found for this reminder.');
    }

    await Promise.all(recipientIds.map(async (userId) => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title,
          message,
          type,
          entityType,
          entityId: targetSubmission.id
        })
      });

      if (!response.ok) {
        throw new Error(await getResponseMessage(response, 'Unable to send one or more reminders.'));
      }
    }));

    return recipientIds.length;
  }

  async function updateReviewStatus(
    status: ReviewPatchStatus,
    fallbackNotes: string,
    useFallbackNotes = false
  ) {
    if (!submission || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setActionNotice(null);

    const bodyNotes = !useFallbackNotes && notes.trim()
      ? buildCommentBody(commentArea, notes)
      : fallbackNotes;

    try {
      const response = await fetch(`/api/document-files/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: bodyNotes
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to update the review status.');
      }

      setFiles((current) => current.map((item) => (
        item.id === submission.id ? { ...item, ...payload.file } : item
      )));

      if (status === 'comment') {
        setNotes('');
        setCommentArea('');
      }

      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update the review status.');
    } finally {
      setIsSaving(false);
    }
  }

  function approveAndNotifyStudent() {
    const confirmed = window.confirm(
      'Approve this submission and notify the student? If the document still needs changes, choose Request Revision instead.'
    );

    if (!confirmed) {
      return;
    }

    void updateReviewStatus(
      'approved',
      'Approved by adviser. The student can now view the adviser remarks and approval status.'
    );
  }

  function saveAdviserComment() {
    if (!notes.trim()) {
      setError('Write an adviser comment before saving.');
      return;
    }

    void updateReviewStatus('comment', '');
  }

  function startEditingComment(comment: AdviserSubmissionRecord['comments'][number]) {
    const parsedComment = parseCommentBody(comment.body);

    setEditingCommentId(comment.id);
    setEditCommentArea(parsedComment.area);
    setEditCommentText(parsedComment.text);
    setError(null);
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditCommentArea('');
    setEditCommentText('');
  }

  function replaceSavedComment(commentId: string, nextBody: string) {
    setFiles((current) => current.map((item) => {
      if (item.id !== submission?.id) {
        return item;
      }

      const reviewComments = (item.reviewComments || []).map((comment) => (
        comment.id === commentId ? { ...comment, body: nextBody } : comment
      ));

      return {
        ...item,
        reviewComments,
        latestReviewComment: item.latestReviewComment?.id === commentId
          ? { ...item.latestReviewComment, body: nextBody }
          : item.latestReviewComment
      };
    }));
  }

  function removeSavedComment(commentId: string) {
    setFiles((current) => current.map((item) => {
      if (item.id !== submission?.id) {
        return item;
      }

      const reviewComments = (item.reviewComments || []).filter((comment) => comment.id !== commentId);

      return {
        ...item,
        reviewComments,
        latestReviewComment: item.latestReviewComment?.id === commentId
          ? reviewComments[0] || null
          : item.latestReviewComment
      };
    }));
  }

  async function updateSavedComment(commentId: string) {
    const nextBody = buildCommentBody(editCommentArea, editCommentText);

    if (!nextBody) {
      setError('Write an adviser comment before saving.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setActionNotice(null);

    try {
      const response = await fetch('/api/review-comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          body: nextBody
        })
      });

      if (!response.ok) {
        throw new Error(await getResponseMessage(response, 'Unable to update this comment.'));
      }

      replaceSavedComment(commentId, nextBody);
      cancelEditingComment();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update this comment.');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSavedComment(commentId: string) {
    const confirmed = window.confirm('Delete this adviser comment? This cannot be undone.');

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setActionNotice(null);

    try {
      const response = await fetch('/api/review-comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      });

      if (!response.ok) {
        throw new Error(await getResponseMessage(response, 'Unable to delete this comment.'));
      }

      removeSavedComment(commentId);

      if (editingCommentId === commentId) {
        cancelEditingComment();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this comment.');
    } finally {
      setIsSaving(false);
    }
  }

  function requestRevision() {
    const pendingCommentCount = adviserComments.length + (notes.trim() ? 1 : 0);

    if (!pendingCommentCount) {
      const confirmed = window.confirm(
        'Request revision without saved adviser comments? Students learn what to fix faster when comments are attached.'
      );

      if (!confirmed) {
        return;
      }
    }

    void updateReviewStatus(
      'needs_revision',
      pendingCommentCount ? '' : 'Revision requested. Please address adviser feedback and upload a new version.',
      !notes.trim()
    );
  }

  function reopenApprovedAsRevision() {
    const confirmed = window.confirm(
      'Change this approved submission back to Needs Revision? This will notify the student that a revised version is required.'
    );

    if (!confirmed) {
      return;
    }

    void updateReviewStatus(
      'needs_revision',
      'Approval reopened: revision is required. Please address adviser feedback and upload a revised version.',
      true
    );
  }

  async function sendReminder() {
    if (!submission || isSaving) {
      return;
    }

    setIsSaving(true);
    setActiveQuickAction('reminder');
    setError(null);
    setActionNotice(null);

    try {
      const recipientCount = await sendSubmissionNotification({
        targetSubmission: submission,
        targetFile: file,
        title: 'Submission Review Reminder',
        message: `Reminder from your adviser: please check "${submission.submissionTitle}" and the latest review instructions.`,
        type: 'info'
      });
      setActionNotice({
        tone: 'success',
        message: `Reminder sent to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}.`
      });
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    } catch (reminderError) {
      setActionNotice({
        tone: 'error',
        message: reminderError instanceof Error ? reminderError.message : 'Unable to send reminder.'
      });
    } finally {
      setIsSaving(false);
      setActiveQuickAction(null);
    }
  }

  if (isLoading) {
    return (
      <div className="adviser-review-workspace px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1700px] space-y-4">
          <div className="h-12 w-44 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-[640px] animate-pulse rounded-2xl border border-slate-100 bg-white" />
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="adviser-review-workspace px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[900px] rounded-2xl border border-red-100 bg-white p-8 text-center shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <i className="fas fa-circle-exclamation text-lg" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-black text-slate-950">Review workspace unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">{error || 'The selected submission could not be loaded.'}</p>
          <Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#003A8F] px-4 text-sm font-black text-white" href="/adviser/adviser-mode/submissions">
            <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
            Back to Submissions
          </Link>
        </div>
      </div>
    );
  }

  const statusMeta = getSubmissionStatusMeta(submission.status);
  const previewUrl = getPreviewUrl(submission, signedUrl);
  const isUnderReview = submission.status === 'under-review';
  const isApproved = submission.status === 'approved';
  const reviewStartedAt = getReviewStartedAt(submission);
  const approvedAt = getApprovedAt(submission);
  const approvalActor = getApprovalActor(submission);
  const finalAdviserRemarks = getFinalAdviserRemarks(submission);
  const reviewDuration = getReviewDurationLabel(reviewStartedAt, approvedAt);
  const adviserComments = submission.comments.filter((comment) => !isSystemReviewComment(comment.body));
  const latestComment = adviserComments[0] || null;
  const quickActionsSection = (
    <section id="adviser-quick-actions" className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Quick Actions</p>
      <div className="mt-4 grid gap-2">
        {isUnderReview ? (
          <>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:opacity-60" type="button" disabled={isSaving} onClick={requestRevision}>
              <i className="fas fa-rotate-left text-xs" aria-hidden="true" />
              Request Revision
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 text-sm font-black text-orange-600 transition hover:bg-orange-50 disabled:opacity-60" type="button" disabled={isSaving} onClick={sendReminder}>
              <i className={`fas ${activeQuickAction === 'reminder' ? 'fa-spinner fa-spin' : 'fa-bell'} text-xs`} aria-hidden="true" />
              {activeQuickAction === 'reminder' ? 'Sending Reminder...' : 'Send Reminder'}
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60" type="button" disabled={isSaving} onClick={approveAndNotifyStudent}>
              <i className="fas fa-circle-check text-xs" aria-hidden="true" />
              Approve & Notify Student
            </button>
          </>
        ) : isApproved ? (
          <>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 text-sm font-black text-[#003A8F] transition hover:bg-blue-100" type="button" onClick={() => document.getElementById('adviser-approval-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              <i className="fas fa-file-circle-check text-xs" aria-hidden="true" />
              View Review Summary
            </button>
            <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-[#003A8F] transition hover:bg-blue-50" href={`/api/document-files/${submission.id}/download`} target="_blank" rel="noreferrer">
              <i className="fas fa-download text-xs" aria-hidden="true" />
              Download
            </a>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:opacity-60" type="button" disabled={isSaving} onClick={reopenApprovedAsRevision}>
              <i className="fas fa-rotate-left text-xs" aria-hidden="true" />
              Reopen as Revision
            </button>
          </>
        ) : (
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#003A8F] px-4 text-sm font-black text-white transition hover:bg-[#002C6B] disabled:opacity-60" type="button" disabled={isSaving} onClick={() => updateReviewStatus('accepted', '')}>
            <i className="fas fa-play text-xs" aria-hidden="true" />
            Still Reviewing
          </button>
        )}
      </div>
      {actionNotice ? (
        <div
          className={`mt-3 rounded-2xl border px-4 py-3 text-xs font-bold leading-5 ${
            actionNotice.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
          role={actionNotice.tone === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <i
            className={`fas ${actionNotice.tone === 'success' ? 'fa-circle-check text-emerald-600' : 'fa-circle-exclamation text-red-500'} mr-2`}
            aria-hidden="true"
          />
          {actionNotice.message}
        </div>
      ) : null}
    </section>
  );

  return (
    <div className="adviser-review-workspace px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1800px] space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-[#003A8F] shadow-sm transition hover:bg-blue-50" href="/adviser/adviser-mode/submissions">
            <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
            Back to Submissions
          </Link>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-black ${statusMeta.badgeClassName}`}>{statusMeta.label}</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#003A8F] ring-1 ring-inset ring-blue-100">{submission.version}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ring-inset ${submission.deadline ? 'bg-orange-50 text-orange-700 ring-orange-100' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{getDeadlineLabel(submission.deadline)}</span>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
          <div className="bg-[linear-gradient(135deg,#003A8F,#1E40AF)] p-6 text-white">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-blue-50 ring-1 ring-inset ring-white/15">
                  <i className="fas fa-file-pen text-[#F6BE00]" aria-hidden="true" />
                  Review Workspace
                </span>
                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span className="inline-flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-inset ring-white/20">
                    <i className={`fas ${getWorkspaceFileIcon(submission)} text-xl`} aria-hidden="true" />
                    <span className="mt-1 text-[9px] font-black uppercase">{submission.fileExtension || 'doc'}</span>
                  </span>
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-black tracking-[-0.04em] sm:text-3xl">{submission.submissionTitle}</h1>
                    <p className="mt-2 text-sm leading-6 text-blue-100">
                      {submission.groupId} | {submission.projectTitle} | Submitted by {submission.submittedBy || 'Project Member'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-inset ring-white/15">
                    <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Chapter</p>
                    <p className="mt-1 text-sm font-black">{submission.milestone}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-inset ring-white/15">
                    <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Version</p>
                    <p className="mt-1 text-sm font-black">{submission.version}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-inset ring-white/15">
                    <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Submitted</p>
                    <p className="mt-1 text-sm font-black">{formatSubmissionDate(submission.submittedAt)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-inset ring-white/15">
                    <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">Due Date</p>
                    <p className="mt-1 text-sm font-black">{submission.deadline ? formatSubmissionDate(submission.deadline) : 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
                <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15" href={`/api/document-files/${submission.id}/download`} target="_blank" rel="noreferrer">
                  <i className="fas fa-download text-xs" aria-hidden="true" />
                  Download
                </a>
                <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15" type="button" onClick={() => document.getElementById('adviser-quick-actions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <i className="fas fa-list-check text-xs" aria-hidden="true" />
                  Quick Actions
                </button>
              </div>
            </div>
          </div>
        </section>

        {isUnderReview ? (
          <section className="adviser-under-review-glow rounded-2xl border border-orange-200 bg-orange-50/90 p-4 shadow-[0_18px_42px_rgba(249,115,22,0.12)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
                  <span className="absolute inset-0 rounded-2xl bg-orange-400 opacity-30 animate-ping" />
                  <i className="fas fa-magnifying-glass relative text-sm" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-black text-orange-900">Review session active</p>
                  <p className="mt-1 text-sm text-orange-800">Adviser currently reviewing this document. Student tracker now shows Under Adviser Review.</p>
                </div>
              </div>
              <span className="rounded-2xl bg-white px-4 py-2 text-xs font-black text-orange-700 ring-1 ring-inset ring-orange-200">
                Review started on {formatSubmissionDateTime(reviewStartedAt)}
              </span>
            </div>
          </section>
        ) : null}

        {isApproved ? (
          <section className="adviser-approval-success-glow rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-[0_18px_42px_rgba(16,185,129,0.12)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                  <i className="fas fa-circle-check text-lg" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-black text-emerald-900">Approved by Adviser</p>
                  <p className="mt-1 text-sm text-emerald-800">Workspace is now read-only. The student can view the approval status and final adviser remarks.</p>
                </div>
              </div>
              <span className="rounded-2xl bg-white px-4 py-2 text-xs font-black text-emerald-700 ring-1 ring-inset ring-emerald-200">
                Approved on {formatSubmissionDateTime(approvedAt)}
              </span>
            </div>
          </section>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#003A8F]">{getFilePreviewLabel(submission)}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">Document Preview</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <a className="inline-flex min-h-9 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-[#003A8F]" href={`/api/document-files/${submission.id}/download`} target="_blank" rel="noreferrer">
                  <i className="fas fa-download text-[10px]" aria-hidden="true" />
                  Download
                </a>
              </div>
            </div>

            <div className="bg-slate-100 p-3 sm:p-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#003A8F] ring-1 ring-inset ring-blue-100">
                      <i className={`fas ${getWorkspaceFileIcon(submission)} text-sm`} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{submission.submissionTitle}</p>
                      <p className="text-xs font-bold text-slate-500">{submission.version} | {submission.fileExtension.toUpperCase()} live preview</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[#003A8F] transition hover:bg-blue-50" href={previewUrl || `/api/document-files/${submission.id}/preview`} target="_blank" rel="noreferrer">
                      <i className="fas fa-up-right-from-square text-[10px]" aria-hidden="true" />
                      Open
                    </a>
                    <a className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[#003A8F] transition hover:bg-blue-50" href={`/api/document-files/${submission.id}/download`} target="_blank" rel="noreferrer">
                      <i className="fas fa-download text-[10px]" aria-hidden="true" />
                      Download
                    </a>
                  </div>
                </div>

                <div className="bg-white p-3 sm:p-4">
                  {previewUrl ? (
                    <iframe
                      className="block h-[clamp(760px,82vh,1040px)] w-full rounded-xl border border-slate-200 bg-white"
                      src={previewUrl}
                      title={`${submission.submissionTitle} preview`}
                    />
                  ) : (
                    <div className="flex h-[clamp(760px,82vh,1040px)] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-500">
                      Preview unavailable
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-white p-4">
              <div className="grid gap-4">
                <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap gap-5 border-b border-slate-100">
                    {REVIEW_INFO_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        className={`pb-3 text-xs font-black uppercase tracking-[0.12em] ${activeInfoTab === tab.id ? 'border-b-2 border-[#003A8F] text-[#003A8F]' : 'text-slate-500 transition hover:text-slate-800'}`}
                        type="button"
                        aria-selected={activeInfoTab === tab.id}
                        onClick={() => setActiveInfoTab(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeInfoTab === 'notes' ? (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{isApproved ? 'Final Adviser Remarks' : 'Saved Adviser Comment'}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {isApproved ? parseCommentBody(finalAdviserRemarks).text : latestComment ? parseCommentBody(latestComment.body).text : 'No saved adviser comments yet.'}
                      </p>
                      {!isApproved && latestComment && parseCommentBody(latestComment.body).area ? (
                        <p className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#003A8F] ring-1 ring-inset ring-blue-100">
                          <i className="fas fa-location-dot mr-2 text-[10px]" aria-hidden="true" />
                          {parseCommentBody(latestComment.body).area}
                        </p>
                      ) : null}
                      {isApproved || latestComment ? (
                        <p className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-500">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#003A8F] text-[10px] font-black text-white">RC</span>
                          {isApproved ? approvalActor : latestComment?.authorName || 'Adviser'} <span aria-hidden="true">|</span> {formatSubmissionDateTime(isApproved ? approvedAt : latestComment?.createdAt || reviewStartedAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {activeInfoTab === 'history' ? (
                    <div className="mt-4 space-y-3">
                      {submission.versionHistory.map((version) => (
                        <div key={version.id} className="rounded-2xl bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-black text-slate-900">{version.version} {version.label}</p>
                              <p className="mt-1 text-xs text-slate-500">{formatSubmissionDate(version.uploadedAt)} | {version.uploader}</p>
                            </div>
                            {version.isCurrent ? (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 ring-1 ring-inset ring-emerald-100">
                                {isApproved ? 'Current Approved Version' : 'Current'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {activeInfoTab === 'details' ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {[
                        ['File Name', submission.submissionTitle],
                        ['File Type', submission.fileExtension ? submission.fileExtension.toUpperCase() : 'Document'],
                        ['File Size', formatFileSize(file?.fileSize)],
                        ['Category', submission.documentCategory],
                        ['Current Version', submission.version],
                        ['Status', statusMeta.label],
                        ['Submitted By', submission.submittedBy || 'Project Member'],
                        ['Submitted On', formatSubmissionDateTime(submission.submittedAt)],
                        ['Review Due Date', submission.deadline ? formatSubmissionDateTime(submission.deadline) : 'Not set'],
                        ['Project', submission.projectTitle],
                        ['Group', submission.groupId],
                        ['Storage Bucket', file?.bucketName || 'Private storage']
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">{label}</p>
                          <p className="mt-1 break-words text-sm font-black text-slate-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section id={isApproved ? 'adviser-approval-summary' : undefined} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
              {isApproved ? (
                <>
                  <div className="text-center">
                    <div className="adviser-approval-success-glow mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-500/25">
                      <i className="fas fa-check text-3xl" aria-hidden="true" />
                    </div>
                    <p className="mt-4 text-[11px] font-black uppercase tracking-[0.15em] text-emerald-700">Approval Summary</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">Approved by Adviser</h2>
                  </div>

                  <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800 ring-1 ring-inset ring-emerald-100">
                    <i className="fas fa-circle-check mr-2 text-emerald-600" aria-hidden="true" />
                    This submission has been approved. The student has been notified and can view the approval status and adviser remarks.
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Approved by</p>
                      <p className="mt-1 text-sm font-black text-slate-950">{approvalActor}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Date Approved</p>
                      <p className="mt-1 text-sm font-black text-slate-950">{formatSubmissionDateTime(approvedAt)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Approved Version</p>
                      <p className="mt-1 text-sm font-black text-slate-950">{submission.version} Current Approved Version</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Review Duration</p>
                      <p className="mt-1 text-sm font-black text-slate-950">{reviewDuration}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-700">Final Adviser Remarks</p>
                    {parseCommentBody(finalAdviserRemarks).area ? (
                      <p className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#003A8F] ring-1 ring-inset ring-blue-100">
                        <i className="fas fa-location-dot mr-2 text-[10px]" aria-hidden="true" />
                        {parseCommentBody(finalAdviserRemarks).area}
                      </p>
                    ) : null}
                    <p className="mt-3 text-sm leading-6 text-slate-700">{parseCommentBody(finalAdviserRemarks).text}</p>
                    <p className="mt-3 text-xs font-bold text-slate-500">{approvalActor} | {formatSubmissionDateTime(approvedAt)}</p>
                  </div>

                  <div className="mt-5 grid gap-2">
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 text-sm font-black text-[#003A8F] transition hover:bg-blue-100" type="button" onClick={() => document.getElementById('adviser-approval-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                      <i className="fas fa-file-circle-check text-xs" aria-hidden="true" />
                      View Review Summary
                    </button>
                    <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-[#003A8F] transition hover:bg-blue-50" href={`/api/document-files/${submission.id}/download`} target="_blank" rel="noreferrer">
                      <i className="fas fa-download text-xs" aria-hidden="true" />
                      Download
                    </a>
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      type="button"
                      disabled={isSaving}
                      onClick={reopenApprovedAsRevision}
                    >
                      <i className="fas fa-rotate-left text-xs" aria-hidden="true" />
                      Reopen as Revision
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs font-bold leading-5 text-slate-500">
                    <i className="fas fa-lock mr-2 text-emerald-600" aria-hidden="true" />
                    This workspace is read-only after approval. Annotation tools, comment editing, and revision requests are locked until it is reopened as a revision.
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#003A8F]">Adviser Comments ({adviserComments.length})</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                      Edit or delete saved comments while this review is still active.
                    </p>
                  </div>

                  {adviserComments.length ? (
                    <div className="mt-4 space-y-4">
                      {adviserComments.map((comment, index) => {
                        const parsedComment = parseCommentBody(comment.body);

                        return (
                          <article key={comment.id} className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <span className={`absolute -left-3 top-5 inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black text-white shadow-sm ${index === 0 ? 'bg-[#F6BE00]' : 'bg-blue-600'}`}>
                              {index + 1}
                            </span>
                            <div className="flex items-start gap-3">
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#003A8F] text-xs font-black text-white">RC</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-black text-slate-950">{comment.authorName}</p>
                                    <p className="text-xs text-slate-500">Adviser | {formatSubmissionDateTime(comment.createdAt)}</p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1">
                                    <button
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#003A8F] disabled:opacity-50"
                                      type="button"
                                      aria-label="Edit comment"
                                      title="Edit comment"
                                      disabled={isSaving}
                                      onClick={() => startEditingComment(comment)}
                                    >
                                      <i className="fas fa-pen text-[11px]" aria-hidden="true" />
                                    </button>
                                    <button
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                                      type="button"
                                      aria-label="Delete comment"
                                      title="Delete comment"
                                      disabled={isSaving}
                                      onClick={() => deleteSavedComment(comment.id)}
                                    >
                                      <i className="fas fa-trash-can text-[11px]" aria-hidden="true" />
                                    </button>
                                  </div>
                                </div>
                                {editingCommentId === comment.id ? (
                                  <div className="mt-4 space-y-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                                    <label className="block">
                                      <span className="mb-1.5 block text-xs font-black text-slate-700">Where is this comment?</span>
                                      <input
                                        className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#003A8F] focus:ring-4 focus:ring-blue-900/10"
                                        value={editCommentArea}
                                        onChange={(event) => setEditCommentArea(event.target.value)}
                                        placeholder="Example: Page 2, Methodology section"
                                      />
                                    </label>
                                    <label className="block">
                                      <span className="mb-1.5 block text-xs font-black text-slate-700">Adviser comment</span>
                                      <textarea
                                        className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#003A8F] focus:ring-4 focus:ring-blue-900/10"
                                        value={editCommentText}
                                        onChange={(event) => setEditCommentText(event.target.value)}
                                        placeholder="Update your feedback..."
                                      />
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-[#003A8F] px-3 text-xs font-black text-white transition hover:bg-[#002C6B] disabled:opacity-60"
                                        type="button"
                                        disabled={isSaving || !editCommentText.trim()}
                                        onClick={() => updateSavedComment(comment.id)}
                                      >
                                        <i className="fas fa-floppy-disk text-[10px]" aria-hidden="true" />
                                        Save Edit
                                      </button>
                                      <button
                                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                                        type="button"
                                        disabled={isSaving}
                                        onClick={cancelEditingComment}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {parsedComment.area ? (
                                      <p className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#003A8F] ring-1 ring-inset ring-blue-100">
                                        <i className="fas fa-location-dot mr-2 text-[10px]" aria-hidden="true" />
                                        {parsedComment.area}
                                      </p>
                                    ) : null}
                                    <p className="mt-3 text-sm leading-6 text-slate-700">{parsedComment.text}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500">
                      No comments have been added for this version yet.
                    </div>
                  )}

                  <button className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 text-sm font-black text-[#003A8F] transition hover:bg-blue-100" type="button" onClick={() => { cancelEditingComment(); document.getElementById('adviser-review-note')?.focus(); }}>
                    <i className="fas fa-plus text-xs" aria-hidden="true" />
                    Add New Comment
                  </button>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-black text-slate-800">Where is this comment?</span>
                    <input
                      className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#003A8F] focus:ring-4 focus:ring-blue-900/10"
                      value={commentArea}
                      onChange={(event) => setCommentArea(event.target.value)}
                      placeholder="Example: Page 2, Methodology section, paragraph 3"
                    />
                  </label>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-black text-slate-800">Adviser comment</span>
                    <textarea
                      id="adviser-review-note"
                      className="min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#003A8F] focus:ring-4 focus:ring-blue-900/10"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Write your feedback for this version..."
                    />
                  </label>

                  <button
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#003A8F] px-4 text-sm font-black text-white transition hover:bg-[#002C6B] disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    disabled={isSaving || !notes.trim()}
                    onClick={saveAdviserComment}
                  >
                    <i className="fas fa-floppy-disk text-xs" aria-hidden="true" />
                    Save Comment to Review
                  </button>

                </>
              )}
            </section>

            {quickActionsSection}

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#003A8F]">Review Progress</p>
              <div className="mt-4 space-y-3">
                {REVIEW_WORKFLOW_STEPS.map((step) => {
                  const event = getTimelineEvent(submission, step.id);
                  const isCurrentUnderReview = isUnderReview && step.id === 'under-review';
                  const isCurrentRevision = submission.status === 'needs-revision' && step.id === 'revision-requested';
                  const isCurrentApproved = isApproved && step.id === 'approved';
                  const isComplete = step.id === 'submitted'
                    || Boolean(event?.isComplete)
                    || (isApproved && ['under-review', 'approved'].includes(step.id));
                  const isCurrent = isCurrentUnderReview || isCurrentRevision || isCurrentApproved;
                  const dotClassName = isCurrentUnderReview
                    ? 'adviser-under-review-glow bg-orange-500 text-white ring-4 ring-orange-100'
                    : isCurrentRevision
                      ? 'bg-red-500 text-white ring-4 ring-red-100'
                    : isCurrentApproved
                      ? 'adviser-approval-success-glow bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : isComplete
                        ? isApproved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-400';
                  const statusText = isCurrentUnderReview
                    ? 'Active now'
                    : isCurrentApproved
                      ? `Approved ${formatSubmissionDateTime(approvedAt)}`
                      : isComplete && event?.isComplete
                        ? formatSubmissionDateTime(event.occurredAt)
                        : isComplete
                          ? 'Completed'
                          : 'Pending';

                  return (
                    <div key={step.id} className="flex items-start gap-3">
                      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs transition-all duration-500 ${dotClassName}`}>
                        <i className={`fas ${isComplete && !isCurrent ? 'fa-check' : step.icon}`} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-black text-slate-900">{step.label}</p>
                        <p className={`text-xs ${isCurrentUnderReview ? 'font-black text-orange-700' : isCurrentRevision ? 'font-black text-red-700' : isCurrentApproved ? 'font-black text-emerald-700' : 'text-slate-500'}`}>
                          {statusText}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
