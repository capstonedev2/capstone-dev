import { cache } from 'react';
import { ensureProjectMilestoneWorkflow } from '@/lib/milestone-checkpoint-tracking';

const now = '2026-04-06T00:00:00.000Z';

export type StudentTitleReviewSummary = {
  latestAction: string;
  nextStep: string;
  lastReviewedBy: string;
  accessRole: string;
  accessNote: string;
};

export type StudentTitleWorkflowStep = {
  id: string;
  title: string;
  status: 'completed' | 'current' | 'pending' | 'archived' | 'needs_revision' | 'rejected';
  date?: string;
  dateLabel?: string;
  note: string;
};

export type StudentTitleRevisionHistoryEntry = {
  id: string;
  status: string;
  date: string;
  dateLabel: string;
  note: string;
  reviewedBy: string;
};

export type StudentTitleReviewerFeedbackEntry = {
  id: string;
  author: string;
  role: string;
  status: string;
  date: string;
  dateLabel: string;
  note: string;
  route?: string;
  actionLabel?: string;
};

export type StudentTitleValidationMatch = {
  id: string;
  title: string;
  matchLabel: string;
};

export type StudentTitleValidation = {
  status: string;
  checkedAt: string;
  checkedAtLabel: string;
  note: string;
  matchedTitles: StudentTitleValidationMatch[];
};

export type StudentTitleAttachment = {
  id: string;
  fileName: string;
  fileType: string;
  sizeLabel: string;
  uploadedAt: string;
  uploadedAtLabel: string;
  uploadedBy: string;
  status: string;
  downloadUrl?: string;
  previewUrl?: string;
  file?: File;
};

export type StudentTitleSubmissionRecord = {
  id: string;
  proposalNumber: number;
  proposalLabel: string;
  isCurrent?: boolean;
  user_id: string;
  project_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  proposedTitle: string;
  briefDescription: string;
  background: string;
  statementOfProblem: string;
  objectives: string[];
  category: string;
  keywords: string[];
  groupMembers: string[];
  adviser: string;
  registrationStatus: string;
  lastReviewedAt: string;
  statusNote: string;
  reviewSummary?: StudentTitleReviewSummary;
  workflow?: StudentTitleWorkflowStep[];
  revisionHistory: StudentTitleRevisionHistoryEntry[];
  reviewerFeedback?: StudentTitleReviewerFeedbackEntry[];
  validation?: StudentTitleValidation;
  attachments: StudentTitleAttachment[];
};

export type StudentTitleRegistration = {
  id: string;
  user_id: string;
  project_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  proposedTitle: string;
  briefDescription: string;
  background: string;
  statementOfProblem: string;
  objectives: string[];
  category: string;
  keywords: string[];
  groupMembers: string[];
  adviser: string;
  registrationStatus: string;
  lastReviewedAt: string;
  statusNote: string;
  reviewSummary?: StudentTitleReviewSummary;
  workflow?: StudentTitleWorkflowStep[];
  revisionHistory: StudentTitleRevisionHistoryEntry[];
  reviewerFeedback?: StudentTitleReviewerFeedbackEntry[];
  validation?: StudentTitleValidation;
  attachments: StudentTitleAttachment[];
  submissions?: StudentTitleSubmissionRecord[];
};

export type StudentDashboardData = {
  profile: {
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    fullName: string;
    studentId: string;
    groupRole: string;
    email: string;
    contactNumber?: string;
    address?: string;
    program?: string;
    department?: string;
    yearLevel?: string;
    section?: string;
    adviser?: string;
    accountSummary?: string;
    birthDate?: string;
    profileImage?: string;
  };
  group: {
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    groupName: string;
    groupCode: string;
    leaderName: string;
    memberCount: number;
    allowMemberSubmission?: boolean;
    members: Array<{
      id: string;
      user_id: string;
      project_id: string;
      status: string;
      created_at: string;
      updated_at: string;
      fullName: string;
      studentId: string;
      email: string;
      isLeader: boolean;
      isCurrent: boolean;
    }>;
  };
  project: {
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    title: string;
    description: string;
    projectCode: string;
    groupName: string;
    adviser: string;
    progressPercentage: number;
    currentMilestone: string;
    repositoryStatus: string;
    upcomingDeadline: string;
    program?: string;
    department?: string;
    academicYear?: string;
    category?: string;
    pilotTestingStatus?: string;
    technologyTransferStatus?: string;
    implementationLocation?: string;
    keywords?: string[];
    panelMembers?: string[];
    transferabilityNote?: string;
    abstract?: string;
  };
  dashboard?: {
    snapshotAt: string;
    workflow: Array<{
      id: string;
      key: string;
      title: string;
      summary: string;
      status: 'completed' | 'current' | 'pending' | 'delayed';
      dateLabel: string;
      route: string;
      actionLabel?: string;
    }>;
    quickLinks: Array<{
      id: string;
      label: string;
      href: string;
      icon: string;
    }>;
  };
  documents: Array<{
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    category: string;
    fileName: string;
    fileType: string;
    sizeLabel: string;
    uploadDateLabel: string;
    uploadedBy: string;
    reviewStatus: string;
  }>;
  feedback: Array<{
    id: string;
    user_id: string;
    project_id: string;
    submissionId?: string;
    submissionTitle?: string;
    submissionStatus?: string;
    status: string;
    created_at: string;
    updated_at: string;
    title: string;
    content: string;
    facultyName: string;
    mode: string;
    dateLabel: string;
    unread: boolean;
  }>;
  milestones: Array<{
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    title: string;
    dateLabel: string;
    summary: string;
    route: string;
    actionLabel?: string;
    dueDate?: string;
    assignedTo?: string;
    notes?: string;
    relatedPhase?: string;
    consultationDate?: string;
    revisionDate?: string;
    eventDate?: string;
    isCompleted?: boolean;
    priority?: 'high' | 'medium' | 'low';
  }>;
  milestoneCheckpoints: Array<{
    id: string;
    project_id: string;
    milestone_id: string;
    milestoneTitle: string;
    milestoneSequence: number;
    key: string;
    title: string;
    description?: string;
    sequence: number;
    required: boolean;
    status: string;
    adviserReviewStatus: string;
    panelReviewStatus: string;
    submittedAt?: string;
    reviewedAt?: string;
    completedAt?: string;
    latestFeedback?: string;
    latestFeedbackBy?: string;
    latestFeedbackAt?: string;
    submissions: Array<{
      id: string;
      title: string;
      status: string;
      submittedAt: string;
      reviewedAt?: string;
      files: Array<{
        id: string;
        fileName: string;
        fileType: string;
        sizeLabel: string;
        uploadDateLabel: string;
        reviewStatus: string;
      }>;
      comments: Array<{
        id: string;
        body: string;
        decision: string;
        createdAt: string;
        authorName: string;
      }>;
    }>;
    files: Array<{
      id: string;
      fileName: string;
      fileType: string;
      sizeLabel: string;
      uploadDateLabel: string;
      reviewStatus: string;
    }>;
  }>;
  schedules: Array<{
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    title: string;
    type: string;
    startDate: string;
    endDate?: string;
    startDateLabel: string;
    time: string;
    location: string;
    description: string;
    mode?: string;
    milestoneId?: string;
    priority?: 'high' | 'medium' | 'low';
    isCompleted?: boolean;
  }>;
  notifications: Array<{
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    type: string;
    title: string;
    message: string;
    dateLabel: string;
    priority: string;
    read: boolean;
    route?: string;
    actionLabel?: string;
  }>;
  progressReports: Array<{
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    title: string;
    date: string;
    dateLabel: string;
    progressDescription: string;
    accomplishments: string[];
    problemsEncountered: string;
    nextSteps: string;
    percentageCompleted: number;
    statusDisplay?: string;
  }>;
  titleRegistration: StudentTitleRegistration;
  technologyTransfer: {
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    transferabilityStatus: string;
    deploymentStatus: string;
    beneficiary: string;
    location: string;
    dateDeployed: string;
    extensionStatus: string;
    adoptionStatus: string;
    implementationNotes: string;
    impactSummary: string;
  };
  presentations: Array<{
    id: string;
    user_id: string;
    project_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    eventName: string;
    eventType: string;
    date: string;
    dateLabel: string;
    venue: string;
    description: string;
    achievement: string;
    scope: string;
    certificateFile: string;
    photoCount: number;
  }>;
};


function getDefaultWorkspaceData(): StudentDashboardData {
  const now = new Date().toISOString();
  return {
    profile: {
      id: '', user_id: '', project_id: '', status: 'active', created_at: now, updated_at: now,
      fullName: '', studentId: '', groupRole: 'Not assigned', email: '', adviser: 'Not assigned'
    },
    group: {
      id: '', user_id: '', project_id: '', status: 'active', created_at: now, updated_at: now,
      groupName: 'Not assigned', groupCode: 'N/A', leaderName: 'Not assigned', memberCount: 0, members: []
    },
    project: {
      id: '', user_id: '', project_id: '', status: 'DRAFT', created_at: now, updated_at: now,
      title: 'No active project', description: '', projectCode: 'N/A', groupName: 'Not assigned', adviser: 'Not assigned',
      progressPercentage: 0, currentMilestone: 'Not assigned', repositoryStatus: 'N/A', upcomingDeadline: 'N/A'
    },
    titleRegistration: {
      id: '', user_id: '', project_id: '', status: 'active', created_at: now, updated_at: now,
      proposedTitle: '', briefDescription: '', background: '', statementOfProblem: '', objectives: [],
      category: '', keywords: [], groupMembers: [], adviser: '', registrationStatus: 'Pending',
      lastReviewedAt: '', statusNote: '', revisionHistory: [], attachments: [], submissions: []
    },
    dashboard: { snapshotAt: now, workflow: [], quickLinks: [] },
    documents: [],
    feedback: [],
    milestones: [],
    milestoneCheckpoints: [],
    schedules: [],
    notifications: [],
    progressReports: [],
    presentations: [],
    technologyTransfer: {
      id: '', user_id: '', project_id: '', status: '', created_at: now, updated_at: now,
      transferabilityStatus: '', deploymentStatus: '', beneficiary: '', location: '', dateDeployed: '', extensionStatus: '', adoptionStatus: '', implementationNotes: '', impactSummary: ''
    }
  };
}

function isNextDynamicServerUsageError(error: unknown) {
  return Boolean(
    error
      && typeof error === 'object'
      && 'digest' in error
      && (error as { digest?: unknown }).digest === 'DYNAMIC_SERVER_USAGE'
  );
}

export const getStudentDashboardData = cache(async function getStudentDashboardData() {
  const data = getDefaultWorkspaceData();

  try {
    const { getAuthenticatedUser } = await import('@/lib/auth');
    const dbUser = await getAuthenticatedUser();

    if (dbUser) {
      const userName = dbUser.name || data.profile.fullName;

      data.profile = {
        ...data.profile,
        user_id: dbUser.id,
        fullName: userName,
        email: dbUser.email || data.profile.email,
        studentId: dbUser.studentId || data.profile.studentId,
        department: dbUser.department || data.profile.department,
        yearLevel: dbUser.yearLevel || data.profile.yearLevel,
        contactNumber: dbUser.contactNumber || data.profile.contactNumber,
        address: dbUser.address || data.profile.address,
        birthDate: dbUser.birthDate || data.profile.birthDate,
        profileImage: dbUser.profileImage || data.profile.profileImage,
        section: dbUser.section || data.profile.section,
        accountSummary: dbUser.accountSummary || data.profile.accountSummary,
      };

      try {
        const { prisma } = await import('@/lib/prisma');
        const { AdviserScheduleItemStatus, SubmissionStatus } = await import('@/generated/prisma/client');
        const groupByMembership = await prisma.group.findFirst({
          where: {
            groupMembers: {
              some: {
                userId: dbUser.id,
                isActive: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        });
        const groups = groupByMembership
          ? [groupByMembership]
          : await prisma.group.findMany({
              where: { students: { has: userName } },
              orderBy: { createdAt: 'desc' }
            });

        if (groups.length > 0) {
          const group = groups[0];
          
          const normalize = (s: string | null | undefined) => (s || '').replace(/\s+/g, '').toLowerCase();
          const isActuallyLeader = normalize(group.leader) === normalize(userName);
          
          data.profile.groupRole = isActuallyLeader ? 'Group Leader' : 'Member';
          
          if (data.group) {
            data.group.id = group.id;
            data.group.allowMemberSubmission = group.allowMemberSubmission ?? false;
            data.group.groupName = group.title || data.group.groupName;
            data.group.groupCode = group.code || data.group.groupCode;
            data.group.leaderName = group.leader || data.group.leaderName;
          }

          try {
            const groupMembers = await prisma.groupMember.findMany({
              where: { groupId: group.id, isActive: true },
              include: { user: true }
            });

            if (groupMembers.length > 0 && data.group) {
              data.group.members = groupMembers.map(gm => ({
                id: gm.id,
                user_id: gm.userId,
                project_id: group.projectId || '',
                status: 'active',
                created_at: gm.createdAt.toISOString(),
                updated_at: gm.updatedAt.toISOString(),
                fullName: gm.user.name || '',
                studentId: gm.user.studentId || '',
                email: gm.user.email || '',
                isLeader: gm.role === 'LEADER',
                isCurrent: gm.user.name === userName,
              }));
              data.group.memberCount = groupMembers.length;
            } else if (group.students && group.students.length > 0 && data.group) {
              const studentUsers = await prisma.user.findMany({
                where: { name: { in: group.students } }
              });

              const studentMap = new Map(studentUsers.map(u => [u.name, u]));

              data.group.members = group.students.map((studentName: string, index: number) => {
                const user = studentMap.get(studentName);
                return {
                  id: user?.id || `fallback-${index}`,
                  user_id: user?.id || `fallback-${index}`,
                  project_id: group.projectId || '',
                  status: 'active',
                  created_at: group.createdAt.toISOString(),
                  updated_at: group.updatedAt.toISOString(),
                  fullName: studentName,
                  studentId: user?.studentId || '',
                  email: user?.email || '',
                  isLeader: studentName === group.leader,
                  isCurrent: studentName === userName,
                };
              });
              data.group.memberCount = group.students.length;
            }
          } catch (memberErr) {
            console.error('Failed to fetch group members:', memberErr);
          }

          const approvedTitleProject = await prisma.project.findFirst({
            where: {
              groupId: group.id,
              status: 'APPROVED',
              submissions: {
                some: {}
              }
            },
            orderBy: { updatedAt: 'desc' }
          });

          let adviserName = 'Not assigned';
          if (group.userId) {
            try {
              const adviserUser = await prisma.user.findUnique({
                where: { id: group.userId }
              });
              if (adviserUser && adviserUser.name) {
                adviserName = adviserUser.name;
              }
            } catch (e) {
              console.error('Failed to fetch adviser name:', e);
            }
          }

          data.project = {
            ...data.project,
            projectCode: group.code || data.project.projectCode,
            title: approvedTitleProject?.title || group.projectTitle || data.project.title,
            description: approvedTitleProject?.abstract || data.project.description,
            groupName: group.title || data.project.groupName,
            adviser: adviserName !== 'Not assigned' ? adviserName : (data.profile.adviser || data.project.adviser),
            program: group.dept || data.project.program,
            department: group.department || data.project.department,
          };
          const activeProject = approvedTitleProject || await prisma.project.findFirst({
            where: { groupId: group.id },
            orderBy: { updatedAt: 'desc' }
          });

          data.titleRegistration.proposedTitle = activeProject?.title || approvedTitleProject?.title || data.titleRegistration.proposedTitle;
          
          if (!activeProject) {
            data.titleRegistration.registrationStatus = 'Draft';
          } else if (activeProject.status === 'APPROVED' || activeProject.status === 'DEFENSE_SCHEDULED') {
            data.titleRegistration.registrationStatus = 'Approved';
          } else if (activeProject.status === 'NEEDS_REVISION') {
            data.titleRegistration.registrationStatus = 'Needs Revision';
          } else if (activeProject.status === 'ARCHIVED') {
            data.titleRegistration.registrationStatus = 'Rejected';
          } else if (activeProject.status === 'UNDER_REVIEW') {
            data.titleRegistration.registrationStatus = 'Under Review';
          } else if (activeProject.status === 'SUBMITTED') {
            data.titleRegistration.registrationStatus = 'Submitted';
          } else {
            data.titleRegistration.registrationStatus = 'Draft';
          }
          
          data.titleRegistration.adviser = data.project.adviser;

          if (activeProject) {
            await ensureProjectMilestoneWorkflow(prisma, activeProject.id);

            const formatDate = (date: Date) =>
              new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
            const getReviewStatusLabel = (status?: string | null) => {
              if (status === SubmissionStatus.APPROVED) return 'Approved';
              if (status === SubmissionStatus.NEEDS_REVISION) return 'Needs Revision';
              if (status === SubmissionStatus.UNDER_REVIEW) return 'In Review';
              return 'Pending Review';
            };
            const toFileSummary = (file: {
              id: string;
              fileName: string;
              fileType: string;
              size: number | null;
              createdAt: Date;
              submission?: { status?: string | null } | null;
            }) => ({
              id: file.id,
              fileName: file.fileName,
              fileType: file.fileType,
              sizeLabel: file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown',
              uploadDateLabel: formatDate(file.createdAt),
              reviewStatus: getReviewStatusLabel(file.submission?.status)
            });

            // Fetch Documents
            const files = await prisma.uploadedFile.findMany({
              where: { projectId: activeProject.id },
              include: {
                user: true,
                submission: {
                  select: {
                    status: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            });
            data.documents = files.map(f => ({
              id: f.id,
              user_id: f.userId,
              project_id: activeProject.id,
              status: f.visibility,
              created_at: f.createdAt.toISOString(),
              updated_at: f.updatedAt.toISOString(),
              category: f.documentCategory || f.category,
              fileName: f.fileName,
              fileType: f.fileType,
              sizeLabel: f.size ? `${Math.round(f.size / 1024)} KB` : 'Unknown',
              uploadDateLabel: formatDate(f.createdAt),
              uploadedBy: f.user?.name || 'Unknown',
              reviewStatus: getReviewStatusLabel(f.submission?.status)
            }));

            // Fetch Milestones
            const milestones = await prisma.milestone.findMany({
              where: { projectId: activeProject.id },
              orderBy: { sequence: 'asc' }
            });
            data.milestones = milestones.map(m => ({
              id: m.id,
              user_id: dbUser.id,
              project_id: activeProject.id,
              status: m.status,
              created_at: m.createdAt.toISOString(),
              updated_at: m.updatedAt.toISOString(),
              title: m.title,
              dateLabel: m.dueAt ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(m.dueAt) : 'No date',
              summary: m.description || '',
              route: '/students/milestones'
            }));

            const checkpointRows = await prisma.milestoneCheckpoint.findMany({
              where: { projectId: activeProject.id },
              include: {
                milestone: {
                  select: {
                    id: true,
                    title: true,
                    sequence: true
                  }
                },
                submissions: {
                  orderBy: { submittedAt: 'desc' },
                  include: {
                    files: {
                      include: {
                        submission: {
                          select: {
                            status: true
                          }
                        }
                      },
                      orderBy: { createdAt: 'desc' }
                    },
                    comments: {
                      orderBy: { createdAt: 'desc' },
                      include: {
                        author: {
                          select: {
                            name: true,
                            role: true
                          }
                        }
                      }
                    }
                  }
                },
                files: {
                  include: {
                    submission: {
                      select: {
                        status: true
                      }
                    }
                  },
                  orderBy: { createdAt: 'desc' }
                }
              }
            });

            data.milestoneCheckpoints = checkpointRows
              .sort((left, right) =>
                left.milestone.sequence - right.milestone.sequence ||
                left.sequence - right.sequence
              )
              .map((checkpoint) => ({
                id: checkpoint.id,
                project_id: checkpoint.projectId,
                milestone_id: checkpoint.milestoneId,
                milestoneTitle: checkpoint.milestone.title,
                milestoneSequence: checkpoint.milestone.sequence,
                key: checkpoint.key,
                title: checkpoint.title,
                description: checkpoint.description || undefined,
                sequence: checkpoint.sequence,
                required: checkpoint.required,
                status: checkpoint.status,
                adviserReviewStatus: checkpoint.adviserReviewStatus,
                panelReviewStatus: checkpoint.panelReviewStatus,
                submittedAt: checkpoint.submittedAt?.toISOString(),
                reviewedAt: checkpoint.reviewedAt?.toISOString(),
                completedAt: checkpoint.completedAt?.toISOString(),
                latestFeedback: checkpoint.latestFeedback || undefined,
                latestFeedbackBy: checkpoint.latestFeedbackBy || undefined,
                latestFeedbackAt: checkpoint.latestFeedbackAt?.toISOString(),
                submissions: checkpoint.submissions.map((submission) => ({
                  id: submission.id,
                  title: submission.title,
                  status: submission.status,
                  submittedAt: submission.submittedAt.toISOString(),
                  reviewedAt: submission.reviewedAt?.toISOString(),
                  files: submission.files.map(toFileSummary),
                  comments: submission.comments.map((comment) => ({
                    id: comment.id,
                    body: comment.body,
                    decision: comment.decision,
                    createdAt: comment.createdAt.toISOString(),
                    authorName: comment.author?.name || 'Faculty'
                  }))
                })),
                files: checkpoint.files.map(toFileSummary)
              }));

            // Fetch Schedules
            const schedules = await prisma.defenseSchedule.findMany({
              where: { projectId: activeProject.id },
              orderBy: { scheduledAt: 'asc' }
            });
            const adviserScheduleDelegate = 'adviserScheduleItem' in prisma ? prisma.adviserScheduleItem : null;
            const adviserScheduleItems = adviserScheduleDelegate
              ? await adviserScheduleDelegate.findMany({
                  where: {
                    projectId: activeProject.id,
                    status: { not: AdviserScheduleItemStatus.CANCELLED }
                  },
                  orderBy: { scheduledAt: 'asc' }
                })
              : [];
            const scheduleTypeLabel = (type: string) => {
              switch (type) {
                case 'CONSULTATION':
                  return 'Consultation';
                case 'DEADLINE':
                  return 'Deadline';
                case 'MEETING':
                  return 'Meeting';
                case 'REMINDER':
                  return 'Reminder';
                case 'EVENT':
                  return 'Event';
                case 'REVIEW':
                  return 'Meeting';
                default:
                  return 'Event';
              }
            };
            data.schedules = [
              ...schedules.map(s => ({
              id: s.id,
              user_id: dbUser.id,
              project_id: activeProject.id,
              status: s.status,
              created_at: s.createdAt.toISOString(),
              updated_at: s.updatedAt.toISOString(),
              title: s.title,
              type: 'Defense',
              startDate: s.scheduledAt.toISOString(),
              startDateLabel: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(s.scheduledAt),
              time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(s.scheduledAt),
              location: s.location || 'TBA',
              description: s.notes || ''
              })),
              ...adviserScheduleItems.map(s => ({
                id: s.id,
                user_id: dbUser.id,
                project_id: activeProject.id,
                status: s.status,
                created_at: s.createdAt.toISOString(),
                updated_at: s.updatedAt.toISOString(),
                title: s.title,
                type: scheduleTypeLabel(s.type),
                startDate: s.scheduledAt.toISOString(),
                endDate: s.endsAt?.toISOString(),
                startDateLabel: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(s.scheduledAt),
                time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(s.scheduledAt),
                location: s.location || 'TBA',
                description: s.notes || '',
                mode: s.location?.toLowerCase().includes('http') ? 'Online' : 'Onsite',
                priority: s.type === 'DEADLINE' ? 'high' as const : 'medium' as const,
                isCompleted: s.status === AdviserScheduleItemStatus.COMPLETED
              }))
            ].sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime());

            // Fetch Feedback (from Submissions)
            const submissions = await prisma.submission.findMany({
              where: {
                projectId: activeProject.id,
                status: { in: [SubmissionStatus.NEEDS_REVISION, SubmissionStatus.APPROVED] }
              },
              include: {
                comments: {
                  include: { author: true },
                  orderBy: { createdAt: 'desc' }
                }
              }
            });
            
            const allFeedback: any[] = [];
            submissions.forEach(sub => {
              sub.comments.forEach(c => {
                allFeedback.push({
                  id: c.id,
                  user_id: dbUser.id,
                  project_id: activeProject.id,
                  submissionId: sub.id,
                  submissionTitle: sub.title,
                  submissionStatus: sub.status,
                  status: sub.status === SubmissionStatus.APPROVED ? 'Approved' : 'Needs Revision',
                  created_at: c.createdAt.toISOString(),
                  updated_at: c.updatedAt.toISOString(),
                  title: `Feedback on ${sub.title}`,
                  content: c.body,
                  facultyName: c.author?.name || 'Faculty',
                  mode: c.author?.role === 'ADVISER' ? 'Adviser' : 'Panel',
                  dateLabel: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(c.createdAt),
                  unread: sub.status === SubmissionStatus.NEEDS_REVISION
                });
              });
            });
            data.feedback = allFeedback.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          }
        }
      } catch (err) {
        console.error('Failed to overlay db user profile:', err);
      }
    }
  } catch (err) {
    if (isNextDynamicServerUsageError(err)) {
      throw err;
    }

    console.error('Failed to get authenticated user:', err);
  }

  return { data };
});
