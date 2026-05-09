import { type UploadedFile } from '@/generated/prisma/client';

type DocumentFilePayloadInput = UploadedFile & {
  user?: {
    id: string;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  };
  project?: {
    id: string;
    title: string;
    group?: {
      code: string;
      title: string;
      projectTitle: string;
      currentMilestone: string;
      leader?: string | null;
      students?: string[];
      groupMembers?: Array<{
        role?: string | null;
        user?: {
          id: string;
          name: string;
          firstName?: string | null;
          lastName?: string | null;
          displayName?: string | null;
        } | null;
      }>;
    } | null;
  } | null;
  submission?: {
    id: string;
    status: string;
    version: number;
    submittedAt: Date;
    reviewedAt?: Date | null;
    comments?: Array<{
      id: string;
      body: string;
      decision: string;
      createdAt: Date;
      author?: {
        id: string;
        name: string;
        firstName?: string | null;
        lastName?: string | null;
        displayName?: string | null;
      } | null;
    }>;
  } | null;
};

function getUploaderName(file: DocumentFilePayloadInput) {
  if (!file.user) {
    return file.userId;
  }

  return file.user.displayName || file.user.name || [file.user.firstName, file.user.lastName].filter(Boolean).join(' ') || file.userId;
}

function getPersonName(person?: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
} | null) {
  if (!person) {
    return '';
  }

  return person.displayName || person.name || [person.firstName, person.lastName].filter(Boolean).join(' ');
}

function getGroupMembers(file: DocumentFilePayloadInput) {
  const group = file.project?.group;

  if (!group) {
    return [];
  }

  const leaderName = String(group.leader || '').trim();
  const membersFromRelations = (group.groupMembers || [])
    .map((member) => {
      const name = getPersonName(member.user);

      if (!name) {
        return null;
      }

      const isLeader = String(member.role || '').toLowerCase() === 'leader'
        || (leaderName && name.trim().toLowerCase() === leaderName.toLowerCase());

      return {
        name,
        role: isLeader ? 'Leader' : 'Member',
        isLeader
      };
    })
    .filter((member): member is { name: string; role: string; isLeader: boolean } => Boolean(member));

  if (membersFromRelations.length) {
    return membersFromRelations.sort((left, right) => Number(right.isLeader) - Number(left.isLeader));
  }

  return (group.students || []).map((student) => {
    const isLeader = leaderName
      ? student.trim().toLowerCase() === leaderName.toLowerCase()
      : false;

    return {
      name: student,
      role: isLeader ? 'Leader' : 'Member',
      isLeader
    };
  }).sort((left, right) => Number(right.isLeader) - Number(left.isLeader));
}

export function toDocumentFilePayload(file: DocumentFilePayloadInput) {
  const latestComment = file.submission?.comments?.[0] ?? null;

  return {
    id: file.id,
    fileName: file.fileName,
    filePath: file.filePath,
    bucketName: file.bucketName,
    fileType: file.fileType,
    fileSize: file.size,
    uploadedBy: file.userId,
    uploadedByName: getUploaderName(file),
    projectId: file.projectId,
    projectTitle: file.project?.title ?? file.project?.group?.projectTitle ?? null,
    groupCode: file.project?.group?.code ?? null,
    groupTitle: file.project?.group?.title ?? null,
    groupMembers: getGroupMembers(file),
    milestone: file.project?.group?.currentMilestone ?? null,
    submissionId: file.submissionId,
    submissionStatus: file.submission?.status ?? null,
    submissionVersion: file.submission?.version ?? null,
    submittedAt: file.submission?.submittedAt ?? null,
    reviewedAt: file.submission?.reviewedAt ?? null,
    latestReviewComment: latestComment
      ? {
          id: latestComment.id,
          body: latestComment.body,
          decision: latestComment.decision,
          createdAt: latestComment.createdAt,
          authorName: getPersonName(latestComment.author) || null
        }
      : null,
    documentCategory: file.documentCategory,
    visibility: file.visibility,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt
  };
}
