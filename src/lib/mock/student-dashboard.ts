import { cookies } from 'next/headers';

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


function getEmptyDashboardData(): StudentDashboardData {
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

export async function getStudentDashboardData() {
  const data = getEmptyDashboardData();

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
              status: 'APPROVED'
            },
            orderBy: { updatedAt: 'desc' }
          });

          data.project = {
            ...data.project,
            projectCode: group.code || data.project.projectCode,
            title: approvedTitleProject?.title || group.projectTitle || data.project.title,
            description: approvedTitleProject?.abstract || data.project.description,
            groupName: group.title || data.project.groupName,
            adviser: data.profile.adviser || data.project.adviser,
          };
          data.titleRegistration.proposedTitle = approvedTitleProject?.title || data.titleRegistration.proposedTitle;
          data.titleRegistration.registrationStatus = approvedTitleProject ? 'Approved' : 'Pending';
        }
      } catch (err) {
        console.error('Failed to overlay db user profile:', err);
      }
    }
  } catch (err) {
    console.error('Failed to get authenticated user:', err);
  }

  return { data };
}
