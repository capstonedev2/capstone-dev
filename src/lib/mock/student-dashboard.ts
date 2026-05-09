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

function formatMockDateLabel(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...options
  }).format(new Date(value));
}

function createTitleAttachment({
  id,
  fileName,
  fileType,
  sizeLabel,
  uploadedAt,
  uploadedBy,
  status = 'Uploaded'
}: {
  id: string;
  fileName: string;
  fileType: string;
  sizeLabel: string;
  uploadedAt: string;
  uploadedBy: string;
  status?: string;
}): StudentTitleAttachment {
  return {
    id,
    fileName,
    fileType,
    sizeLabel,
    uploadedAt,
    uploadedAtLabel: formatMockDateLabel(uploadedAt, {
      hour: 'numeric',
      minute: '2-digit'
    }),
    uploadedBy,
    status
  };
}

const studentDashboardData: StudentDashboardData = {
  profile: {
    id: 'profile-student-001',
    user_id: 'user-student-001',
    project_id: 'project-it-001',
    status: 'active',
    created_at: now,
    updated_at: now,
    fullName: 'Maria Concepcion Santos',
    studentId: '2024-0001',
    groupRole: 'Group Leader',
    email: 'maria.santos@university.edu.ph',
    contactNumber: '+63 912 345 6789',
    address: '123 University Avenue, Diliman, Quezon City',
    program: 'BS Information Technology',
    department: 'College of Computer Studies',
    yearLevel: '4th Year',
    section: 'IT-4A',
    adviser: 'Dr. Ricardo Cruz',
    accountSummary: 'Regular standing, cleared for graduation upon capstone completion.',
    birthDate: '2004-05-15',
    profileImage: ''
  },
  group: {
    id: 'group-cap-it-2026-014',
    user_id: 'user-student-001',
    project_id: 'project-it-001',
    status: 'active',
    created_at: now,
    updated_at: now,
    groupName: 'Cluster A - Predictive Systems',
    groupCode: 'GRP-IT-2026-014',
    leaderName: 'Maria Concepcion Santos',
    memberCount: 4,
    members: [
      {
        id: 'member-001',
        user_id: 'user-student-001',
        project_id: 'project-it-001',
        status: 'active',
        created_at: now,
        updated_at: now,
        fullName: 'Maria Concepcion Santos',
        studentId: '2024-0001',
        email: 'maria.santos@university.edu.ph',
        isLeader: true,
        isCurrent: true
      },
      {
        id: 'member-002',
        user_id: 'user-student-002',
        project_id: 'project-it-001',
        status: 'active',
        created_at: now,
        updated_at: now,
        fullName: 'Daniel Reyes',
        studentId: '2024-0002',
        email: 'daniel.reyes@university.edu.ph',
        isLeader: false,
        isCurrent: false
      },
      {
        id: 'member-003',
        user_id: 'user-student-003',
        project_id: 'project-it-001',
        status: 'active',
        created_at: now,
        updated_at: now,
        fullName: 'Alyssa Mendoza',
        studentId: '2024-0003',
        email: 'alyssa.mendoza@university.edu.ph',
        isLeader: false,
        isCurrent: false
      },
      {
        id: 'member-004',
        user_id: 'user-student-004',
        project_id: 'project-it-001',
        status: 'active',
        created_at: now,
        updated_at: now,
        fullName: 'John Carlo Lim',
        studentId: '2024-0004',
        email: 'john.lim@university.edu.ph',
        isLeader: false,
        isCurrent: false
      }
    ]
  },
  project: {
    id: 'project-it-001',
    user_id: 'user-student-001',
    project_id: 'project-it-001',
    status: 'In Development',
    created_at: now,
    updated_at: now,
    title: 'AI-Powered Learning Management System with Predictive Analytics',
    description:
      'An academic monitoring portal that consolidates title registration, manuscript review, progress tracking, and transfer-readiness documentation in one structured workflow.',
    projectCode: 'CAP-IT-2026-014',
    groupName: 'Cluster A - Predictive Systems',
    adviser: 'Dr. Ricardo Cruz',
    progressPercentage: 63,
    currentMilestone: 'Development',
    repositoryStatus: 'Ready for final library endorsement',
    upcomingDeadline: 'Adviser Consultation Schedule | Apr 8, 2026 | 2:00 PM - 3:00 PM',
    program: 'BS Information Technology',
    department: 'College of Computer Studies',
    academicYear: '2025-2026',
    category: 'Software Development',
    pilotTestingStatus: 'Pending',
    technologyTransferStatus: 'Under Review',
    implementationLocation: 'University Library',
    keywords: ['AI', 'LMS', 'Predictive Analytics'],
    panelMembers: ['Prof. Elena Villanueva', 'Prof. Mark Alforque'],
    transferabilityNote: 'The system architecture supports broader university deployment, but pilot testing results will determine final transferability.',
    abstract: 'This project introduces an AI-powered Learning Management System aimed at predicting student performance and providing early interventions. By analyzing historical data and current engagement metrics, the system identifies at-risk students and suggests personalized learning paths.'
  },
  dashboard: {
    snapshotAt: now,
    workflow: [
      {
        id: 'workflow-001',
        key: 'concept',
        title: 'Concept',
        summary: 'Research topic, problem scope, and initial ideas were defined and documented.',
        status: 'completed',
        dateLabel: 'Nov 15, 2025',
        route: '/students/title-submission',
        actionLabel: 'Open title submission'
      },
      {
        id: 'workflow-002',
        key: 'proposal',
        title: 'Proposal',
        summary: 'Title registration, scope alignment, and proposal endorsement were completed.',
        status: 'completed',
        dateLabel: 'Dec 1, 2025',
        route: '/students/project-files',
        actionLabel: 'Open project files'
      },
      {
        id: 'workflow-003',
        key: 'development',
        title: 'Development',
        summary: 'System building, chapter submissions, and milestone progress tracking are underway.',
        status: 'current',
        dateLabel: 'Apr 8, 2026',
        route: '/students/project-overview',
        actionLabel: 'Open project overview'
      },
      {
        id: 'workflow-004',
        key: 'mock-defense',
        title: 'Mock Defense',
        summary: 'Practice defense presentation to gather early feedback and identify gaps.',
        status: 'pending',
        dateLabel: 'Apr 21, 2026',
        route: '/students/schedule',
        actionLabel: 'Review schedule'
      },
      {
        id: 'workflow-005',
        key: 'final-defense',
        title: 'Final Defense',
        summary: 'Formal defense before the panel with submission of final revisions.',
        status: 'pending',
        dateLabel: 'May 12, 2026',
        route: '/students/schedule',
        actionLabel: 'View defense schedule'
      },
      {
        id: 'workflow-006',
        key: 'completion',
        title: 'Completion',
        summary: 'Finalize deliverables, upload evidence, and publish to the repository.',
        status: 'pending',
        dateLabel: 'Jun 2, 2026',
        route: '/students/project-overview',
        actionLabel: 'Open project overview'
      }
    ],
    quickLinks: [
      {
        id: 'project-overview',
        label: 'View Project',
        href: '/students/project-overview',
        icon: 'fa-folder-open'
      },
      {
        id: 'project-files',
        label: 'Open Files',
        href: '/students/project-files',
        icon: 'fa-file-arrow-up'
      },
      {
        id: 'faculty-feedback',
        label: 'Open Feedback',
        href: '/students/faculty-feedback',
        icon: 'fa-comments'
      },
      {
        id: 'schedule',
        label: 'Open Schedule',
        href: '/students/schedule',
        icon: 'fa-calendar-check'
      }
    ]
  },
  documents: [
    {
      id: 'document-001',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'approved',
      created_at: '2026-01-05T13:15:00.000Z',
      updated_at: '2026-01-05T13:15:00.000Z',
      category: 'proposal',
      fileName: 'Proposal-AI-Learning-System.pdf',
      fileType: 'PDF',
      sizeLabel: '2.4 MB',
      uploadDateLabel: 'Jan 5, 2026, 1:15 PM',
      uploadedBy: 'Maria Concepcion Santos',
      reviewStatus: 'Approved'
    },
    {
      id: 'document-002',
      user_id: 'user-student-002',
      project_id: 'project-it-001',
      status: 'approved',
      created_at: '2026-02-14T16:40:00.000Z',
      updated_at: '2026-02-14T16:40:00.000Z',
      category: 'chapter-1',
      fileName: 'Chapter-1-Introduction.pdf',
      fileType: 'PDF',
      sizeLabel: '1.8 MB',
      uploadDateLabel: 'Feb 14, 2026, 4:40 PM',
      uploadedBy: 'Daniel Reyes',
      reviewStatus: 'Approved'
    },
    {
      id: 'document-003',
      user_id: 'user-student-003',
      project_id: 'project-it-001',
      status: 'approved',
      created_at: '2026-03-02T11:10:00.000Z',
      updated_at: '2026-03-02T11:10:00.000Z',
      category: 'chapter-2',
      fileName: 'Chapter-2-Review-of-Literature.pdf',
      fileType: 'PDF',
      sizeLabel: '3.1 MB',
      uploadDateLabel: 'Mar 2, 2026, 11:10 AM',
      uploadedBy: 'Alyssa Mendoza',
      reviewStatus: 'Approved'
    },
    {
      id: 'document-004',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'needs-revision',
      created_at: '2026-03-26T10:20:00.000Z',
      updated_at: '2026-03-26T10:20:00.000Z',
      category: 'chapter-3',
      fileName: 'Chapter-3-Methodology-Revision.pdf',
      fileType: 'PDF',
      sizeLabel: '2.7 MB',
      uploadDateLabel: 'Mar 26, 2026, 10:20 AM',
      uploadedBy: 'Maria Concepcion Santos',
      reviewStatus: 'Needs Revision'
    },
    {
      id: 'document-005',
      user_id: 'user-student-004',
      project_id: 'project-it-001',
      status: 'pending-review',
      created_at: '2026-04-02T15:10:00.000Z',
      updated_at: '2026-04-02T15:10:00.000Z',
      category: 'system-files',
      fileName: 'System-Prototype-v0.9.zip',
      fileType: 'ZIP',
      sizeLabel: '18.6 MB',
      uploadDateLabel: 'Apr 2, 2026, 3:10 PM',
      uploadedBy: 'John Carlo Lim',
      reviewStatus: 'Pending Review'
    },
    {
      id: 'document-006',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'approved',
      created_at: '2026-03-14T09:00:00.000Z',
      updated_at: '2026-03-14T09:00:00.000Z',
      category: 'supporting-documents',
      fileName: 'Ethics-Clearance.pdf',
      fileType: 'PDF',
      sizeLabel: '1.1 MB',
      uploadDateLabel: 'Mar 14, 2026, 9:00 AM',
      uploadedBy: 'Maria Concepcion Santos',
      reviewStatus: 'Approved'
    },
    {
      id: 'document-007',
      user_id: 'user-student-002',
      project_id: 'project-it-001',
      status: 'approved',
      created_at: '2026-03-31T14:00:00.000Z',
      updated_at: '2026-03-31T14:00:00.000Z',
      category: 'presentation-files',
      fileName: 'Midterm-Presentation-Deck.pptx',
      fileType: 'PPTX',
      sizeLabel: '9.4 MB',
      uploadDateLabel: 'Mar 31, 2026, 2:00 PM',
      uploadedBy: 'Daniel Reyes',
      reviewStatus: 'Approved'
    },
    {
      id: 'document-008',
      user_id: 'user-student-003',
      project_id: 'project-it-001',
      status: 'pending-review',
      created_at: '2026-04-04T08:45:00.000Z',
      updated_at: '2026-04-04T08:45:00.000Z',
      category: 'certificates',
      fileName: 'Research-Symposium-Certificate.pdf',
      fileType: 'PDF',
      sizeLabel: '856 KB',
      uploadDateLabel: 'Apr 4, 2026, 8:45 AM',
      uploadedBy: 'Alyssa Mendoza',
      reviewStatus: 'Pending Review'
    }
  ],
  feedback: [
    {
      id: 'feedback-001',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'pending',
      created_at: '2026-03-28T14:05:00.000Z',
      updated_at: '2026-03-28T14:05:00.000Z',
      title: 'Clarify Validation Metrics in Chapter 3',
      content:
        'Expand the usability and performance metrics so the evaluation checklist clearly connects to your predictive analytics dashboard outputs.',
      facultyName: 'Dr. Ricardo Cruz',
      mode: 'Adviser',
      dateLabel: 'Mar 28, 2026, 2:05 PM',
      unread: true
    },
    {
      id: 'feedback-002',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'revised',
      created_at: '2026-03-30T16:25:00.000Z',
      updated_at: '2026-03-30T16:25:00.000Z',
      title: 'Refine Midterm Presentation Flow',
      content:
        'The project rationale is clear, but the slide flow should show the beneficiary problem first before introducing the prototype features.',
      facultyName: 'Prof. Elena Villanueva',
      mode: 'Panel',
      dateLabel: 'Mar 30, 2026, 4:25 PM',
      unread: true
    },
    {
      id: 'feedback-003',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'pending',
      created_at: '2026-04-03T09:10:00.000Z',
      updated_at: '2026-04-03T09:10:00.000Z',
      title: 'Confirm Pilot Testing Beneficiary',
      content:
        'The beneficiary office is appropriate, but the implementation note should specify whether the pilot will run in a single office or across multiple support units.',
      facultyName: 'Dr. Ricardo Cruz',
      mode: 'Adviser',
      dateLabel: 'Apr 3, 2026, 9:10 AM',
      unread: true
    },
    {
      id: 'feedback-004',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'resolved',
      created_at: '2026-03-19T11:45:00.000Z',
      updated_at: '2026-03-21T17:10:00.000Z',
      title: 'Update System Architecture Diagram',
      content:
        'Use clearer labels for data sources, adviser review checkpoints, and notification triggers in the architecture overview.',
      facultyName: 'Prof. Mark Alforque',
      mode: 'Panel',
      dateLabel: 'Mar 19, 2026, 11:45 AM',
      unread: false
    }
  ],
  milestones: [
    {
      id: 'milestone-001',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'completed',
      created_at: '2025-11-15T10:00:00.000Z',
      updated_at: '2025-11-15T10:00:00.000Z',
      title: 'Concept',
      dateLabel: 'Nov 15, 2025',
      summary: 'Research topic defined, problem scope identified, and initial ideas documented.',
      route: '/students/title-submission',
      dueDate: '2025-11-15T17:00:00.000Z',
      assignedTo: 'Maria Concepcion Santos',
      notes: 'Define the research topic, identify the problem scope, and draft initial ideas for the capstone study.',
      relatedPhase: 'Concept',
      consultationDate: '2025-11-13T10:00:00.000Z',
      isCompleted: true,
      priority: 'medium'
    },
    {
      id: 'milestone-002',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'completed',
      created_at: '2025-12-01T10:00:00.000Z',
      updated_at: '2026-01-05T13:15:00.000Z',
      title: 'Proposal',
      dateLabel: 'Jan 5, 2026',
      summary: 'Formal project proposal submitted and approved by adviser and panel.',
      route: '/students/project-files',
      dueDate: '2026-01-05T13:15:00.000Z',
      assignedTo: 'Maria Concepcion Santos',
      notes: 'Submit the formal project proposal for adviser and panel evaluation and approval.',
      relatedPhase: 'Proposal',
      eventDate: '2026-01-05T13:15:00.000Z',
      isCompleted: true,
      priority: 'medium'
    },
    {
      id: 'milestone-003',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'ongoing',
      created_at: '2026-01-10T09:00:00.000Z',
      updated_at: '2026-04-08T09:00:00.000Z',
      title: 'Development',
      dateLabel: 'Apr 8, 2026',
      summary: 'System building, chapter submissions, and milestone progress tracking are underway.',
      route: '/students/project-overview',
      actionLabel: 'Open Project',
      dueDate: '2026-04-24T17:00:00.000Z',
      assignedTo: 'Cluster A - Predictive Systems',
      notes: 'Build the system, conduct testing, and track chapter submissions and milestone progress.',
      relatedPhase: 'Development',
      consultationDate: '2026-04-08T14:00:00.000Z',
      priority: 'high'
    },
    {
      id: 'milestone-004',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'pending',
      created_at: '2026-04-21T09:00:00.000Z',
      updated_at: '2026-04-21T09:00:00.000Z',
      title: 'Mock Defense',
      dateLabel: 'Apr 21, 2026',
      summary: 'Practice defense to gather early feedback, identify gaps, and refine the study.',
      route: '/students/schedule',
      actionLabel: 'Open Schedule',
      dueDate: '2026-04-21T13:30:00.000Z',
      assignedTo: 'Cluster A - Predictive Systems',
      notes: 'Present a practice defense to gather early feedback, identify gaps, and refine the study.',
      relatedPhase: 'Mock Defense',
      consultationDate: '2026-04-16T10:00:00.000Z',
      priority: 'high'
    },
    {
      id: 'milestone-005',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'pending',
      created_at: '2026-05-12T09:00:00.000Z',
      updated_at: '2026-05-12T09:00:00.000Z',
      title: 'Final Defense',
      dateLabel: 'May 12, 2026',
      summary: 'Formal defense before the panel and submission of final revisions.',
      route: '/students/faculty-feedback',
      actionLabel: 'View Feedback',
      dueDate: '2026-05-12T09:00:00.000Z',
      assignedTo: 'Cluster A - Predictive Systems',
      notes: 'Defend the completed project before the panel and submit final revisions.',
      relatedPhase: 'Final Defense',
      eventDate: '2026-05-12T13:00:00.000Z',
      priority: 'high'
    },
    {
      id: 'milestone-006',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'pending',
      created_at: '2026-06-02T09:00:00.000Z',
      updated_at: '2026-06-02T09:00:00.000Z',
      title: 'Completion',
      dateLabel: 'Jun 2, 2026',
      summary: 'Finalize deliverables, upload evidence, and publish to the repository.',
      route: '/students/project-overview',
      actionLabel: 'Open Project Overview',
      dueDate: '2026-06-02T17:00:00.000Z',
      assignedTo: 'Maria Concepcion Santos',
      notes: 'Finalize deliverables, upload evidence, and publish to the repository.',
      relatedPhase: 'Completion',
      priority: 'medium'
    }
  ],
  schedules: [
    {
      id: 'schedule-001',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'Confirmed',
      created_at: '2026-04-08T14:00:00.000Z',
      updated_at: '2026-04-08T14:00:00.000Z',
      title: 'Adviser Consultation Schedule',
      type: 'Consultation',
      startDate: '2026-04-08T14:00:00.000Z',
      endDate: '2026-04-08T15:00:00.000Z',
      startDateLabel: 'Apr 8, 2026',
      time: '2:00 PM - 3:00 PM',
      location: 'Adviser Office / Online',
      description: 'Review the latest methodology revision and confirm the next upload package.',
      mode: 'Hybrid',
      milestoneId: 'milestone-004',
      priority: 'high',
      isCompleted: false
    },
    {
      id: 'schedule-002',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'Upcoming',
      created_at: '2026-04-11T17:00:00.000Z',
      updated_at: '2026-04-11T17:00:00.000Z',
      title: 'Chapter 3 Revision Deadline',
      type: 'Submission Deadline',
      startDate: '2026-04-11T17:00:00.000Z',
      endDate: '2026-04-11T17:00:00.000Z',
      startDateLabel: 'Apr 11, 2026',
      time: 'Until 5:00 PM',
      location: 'Student Upload Portal',
      description: 'Submit the revised methodology document and updated validation checklist.',
      mode: 'Online',
      milestoneId: 'milestone-003',
      priority: 'high',
      isCompleted: false
    },
    {
      id: 'schedule-003',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'Confirmed',
      created_at: '2026-04-16T10:00:00.000Z',
      updated_at: '2026-04-16T10:00:00.000Z',
      title: 'Pilot Testing Planning Meeting',
      type: 'Adviser Meeting',
      startDate: '2026-04-16T10:00:00.000Z',
      endDate: '2026-04-16T11:30:00.000Z',
      startDateLabel: 'Apr 16, 2026',
      time: '10:00 AM - 11:30 AM',
      location: 'Computing Laboratory',
      description: 'Review user testing flow, participant list, and deployment evidence needs.',
      mode: 'On Site',
      milestoneId: 'milestone-005',
      priority: 'high',
      isCompleted: false
    },
    {
      id: 'schedule-004',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'Upcoming',
      created_at: '2026-04-21T13:30:00.000Z',
      updated_at: '2026-04-21T13:30:00.000Z',
      title: 'Midterm Defense Simulation',
      type: 'Defense Schedule',
      startDate: '2026-04-21T13:30:00.000Z',
      endDate: '2026-04-21T15:00:00.000Z',
      startDateLabel: 'Apr 21, 2026',
      time: '1:30 PM - 3:00 PM',
      location: 'Department Conference Room',
      description: 'Internal rehearsal for the defense presentation and demo walkthrough.',
      mode: 'On Site',
      milestoneId: 'milestone-derived-defense',
      priority: 'high',
      isCompleted: false
    },
    {
      id: 'schedule-005',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'Upcoming',
      created_at: '2026-04-29T09:00:00.000Z',
      updated_at: '2026-04-29T09:00:00.000Z',
      title: 'Research Innovation Event',
      type: 'Event Schedule',
      startDate: '2026-04-29T09:00:00.000Z',
      endDate: '2026-04-29T12:00:00.000Z',
      startDateLabel: 'Apr 29, 2026',
      time: '9:00 AM - 12:00 PM',
      location: 'University Gymnasium',
      description: 'Institutional event where recognized projects submit updated evidence and certificates.',
      mode: 'On Site',
      priority: 'medium',
      isCompleted: false
    }
  ],
  notifications: [
    {
      id: 'notification-001',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'unread',
      created_at: '2026-04-05T09:35:00.000Z',
      updated_at: '2026-04-05T09:35:00.000Z',
      type: 'feedback',
      title: 'New Adviser Feedback on Chapter 3',
      message: 'Review the latest adviser note about your validation metrics before the revision deadline.',
      dateLabel: 'Apr 5, 2026, 9:35 AM',
      priority: 'high',
      read: false
    },
    {
      id: 'notification-002',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'unread',
      created_at: '2026-04-06T08:00:00.000Z',
      updated_at: '2026-04-06T08:00:00.000Z',
      type: 'deadline',
      title: 'Chapter 3 Revision Deadline is Approaching',
      message: 'Complete the revised methodology package and upload it before the submission window closes.',
      dateLabel: 'Apr 6, 2026, 8:00 AM',
      priority: 'high',
      read: false
    },
    {
      id: 'notification-003',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'read',
      created_at: '2026-04-02T14:20:00.000Z',
      updated_at: '2026-04-02T14:20:00.000Z',
      type: 'approval',
      title: 'Midterm Presentation Deck Approved',
      message: 'The uploaded presentation file was cleared for the next consultation cycle.',
      dateLabel: 'Apr 2, 2026, 2:20 PM',
      priority: 'normal',
      read: true
    },
    {
      id: 'notification-004',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'unread',
      created_at: '2026-04-04T16:10:00.000Z',
      updated_at: '2026-04-04T16:10:00.000Z',
      type: 'schedule',
      title: 'Adviser Consultation Added to Your Schedule',
      message: 'A confirmed consultation slot is now reflected in your student calendar.',
      dateLabel: 'Apr 4, 2026, 4:10 PM',
      priority: 'normal',
      read: false
    },
    {
      id: 'notification-005',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'unread',
      created_at: '2026-04-03T10:15:00.000Z',
      updated_at: '2026-04-03T10:15:00.000Z',
      type: 'general',
      title: 'Implementation Review Notes Updated',
      message: 'The project record was updated with clearer implementation notes before the next review cycle.',
      dateLabel: 'Apr 3, 2026, 10:15 AM',
      priority: 'normal',
      read: false
    }
  ],
  progressReports: [
    {
      id: 'report-001',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'Reviewed',
      created_at: '2026-03-09T17:00:00.000Z',
      updated_at: '2026-03-09T17:00:00.000Z',
      title: 'Weekly Development Report 01',
      date: '2026-03-09T17:00:00.000Z',
      dateLabel: 'March 9, 2026',
      progressDescription: 'Completed database schema refinement, corrected adviser comments on objectives, and aligned the dashboard workflow with the approved project scope.',
      accomplishments: ['Finalized database schema', 'Completed Chapter 2 revisions', 'Prepared interface wireframes'],
      problemsEncountered: 'Needed additional clarification on data validation metrics for the testing phase.',
      nextSteps: 'Finalize Chapter 3, validate prototype screens.',
      percentageCompleted: 58,
      statusDisplay: 'Reviewed'
    }
  ],
  titleRegistration: {
    id: 'title-001',
    user_id: 'user-student-001',
    project_id: 'project-it-001',
    status: 'active',
    created_at: '2025-12-01T10:00:00.000Z',
    updated_at: '2025-12-23T14:15:00.000Z',
    proposedTitle: 'AI-Powered Learning Management System with Predictive Analytics',
    briefDescription: 'A decision-support portal that helps advisers monitor at-risk students through analytics-driven alerts, consultations, and intervention records.',
    background:
      'Academic advisers still rely on fragmented spreadsheets, informal follow-ups, and delayed manual reports when monitoring students who need intervention. The group proposes a digital platform that centralizes progress indicators, consultation records, and predictive alerts so advisers can respond earlier and document interventions more consistently.',
    statementOfProblem:
      'The current advising workflow lacks a unified system for identifying at-risk students, tracking intervention history, and surfacing actionable analytics. Because of that gap, monitoring is delayed, coordination is inconsistent, and students who need support may not receive timely academic intervention.',
    objectives: [
      'Develop a centralized learning management and adviser support portal for tracking student performance indicators.',
      'Design a predictive analytics workflow that flags at-risk students based on academic and engagement signals.',
      'Provide consultation, intervention, and follow-up records that support faster adviser decision-making.'
    ],
    category: 'Web-Based Decision Support System',
    keywords: ['AI', 'Predictive Analytics', 'Student Support', 'Web Portal'],
    groupMembers: ['Maria Concepcion Santos', 'Daniel Reyes', 'Alyssa Mendoza', 'John Carlo Lim'],
    adviser: 'Dr. Ricardo Cruz',
    registrationStatus: 'Approved',
    lastReviewedAt: '2025-12-23T14:15:00.000Z',
    statusNote: 'The latest revision was accepted and carried into the project record.',
    reviewSummary: {
      latestAction: 'Approved and recorded as the official project title',
      nextStep:
        'Keep the approved title aligned across project files and only reopen this record if your adviser requests a scope change.',
      lastReviewedBy: 'Dr. Ricardo Cruz',
      accessRole: 'Group leader access',
      accessNote: 'Only the current group leader can submit official title updates for adviser review.'
    },
    workflow: [
      {
        id: 'title-workflow-001',
        title: 'Draft',
        status: 'completed',
        date: '2025-11-29T16:00:00.000Z',
        dateLabel: 'Nov 29, 2025',
        note: 'Initial title draft and scope notes were prepared by the group.'
      },
      {
        id: 'title-workflow-002',
        title: 'Submitted',
        status: 'completed',
        date: '2025-12-01T10:00:00.000Z',
        dateLabel: 'Dec 1, 2025',
        note: 'The proposed title was submitted to the adviser queue for validation.'
      },
      {
        id: 'title-workflow-003',
        title: 'Under Review',
        status: 'completed',
        date: '2025-12-12T13:30:00.000Z',
        dateLabel: 'Dec 12, 2025',
        note: 'Similarity and scope review were completed with revision notes.'
      },
      {
        id: 'title-workflow-004',
        title: 'Approved',
        status: 'current',
        date: '2025-12-23T14:15:00.000Z',
        dateLabel: 'Dec 23, 2025',
        note: 'The revised title was approved and moved into the official project record.'
      },
      {
        id: 'title-workflow-005',
        title: 'Archived',
        status: 'pending',
        note: 'This record will move to archive status once the final manuscript package is endorsed.'
      }
    ],
    revisionHistory: [
      {
        id: 'title-log-004',
        status: 'Approved',
        date: '2025-12-23T14:15:00.000Z',
        dateLabel: 'December 23, 2025',
        note: 'Final wording was approved after clarifying the predictive analytics scope and project audience.',
        reviewedBy: 'Dr. Ricardo Cruz'
      },
      {
        id: 'title-log-003',
        status: 'Resubmitted',
        date: '2025-12-18T09:10:00.000Z',
        dateLabel: 'December 18, 2025',
        note: 'The group updated the title and description to reflect the approved intervention workflow and monitoring scope.',
        reviewedBy: 'Student Group'
      },
      {
        id: 'title-log-002',
        status: 'Needs Revision',
        date: '2025-12-12T13:30:00.000Z',
        dateLabel: 'December 12, 2025',
        note: 'Reviewer requested a clearer learning support focus and stronger distinction from a generic LMS title.',
        reviewedBy: 'Dr. Ricardo Cruz'
      },
      {
        id: 'title-log-001',
        status: 'Submitted',
        date: '2025-12-01T10:00:00.000Z',
        dateLabel: 'December 1, 2025',
        note: 'Initial project title proposal was submitted for title similarity checking.',
        reviewedBy: 'Student Group'
      }
    ],
    reviewerFeedback: [
      {
        id: 'title-feedback-001',
        author: 'Dr. Ricardo Cruz',
        role: 'Adviser',
        status: 'Approved',
        date: '2025-12-23T14:15:00.000Z',
        dateLabel: 'Dec 23, 2025, 2:15 PM',
        note: 'Approved. The revised title is now specific to adviser monitoring and predictive intervention, which matches the approved project scope.',
        route: '/students/project-overview',
        actionLabel: 'Open project overview'
      },
      {
        id: 'title-feedback-002',
        author: 'Dr. Ricardo Cruz',
        role: 'Adviser',
        status: 'Needs Revision',
        date: '2025-12-12T13:30:00.000Z',
        dateLabel: 'Dec 12, 2025, 1:30 PM',
        note: 'Revise the wording so the title emphasizes academic intervention and not a general-purpose learning platform.',
        route: '#title-submission-form',
        actionLabel: 'Review submitted title'
      }
    ],
    validation: {
      status: 'Similarity Cleared',
      checkedAt: '2025-12-10T11:20:00.000Z',
      checkedAtLabel: 'Dec 10, 2025',
      note: 'No blocking match was found in the internal title bank. Keep the final wording aligned with the approved scope to avoid reopening validation.',
      matchedTitles: [
        {
          id: 'title-match-001',
          title: 'Student Risk Monitoring Platform with Predictive Alerts',
          matchLabel: 'Low similarity'
        },
        {
          id: 'title-match-002',
          title: 'Academic Analytics Portal for Adviser Intervention Tracking',
          matchLabel: 'Related concept'
        }
      ]
    },
    attachments: [
      createTitleAttachment({
        id: 'title-attachment-001',
        fileName: 'Title-Proposal-AI-Adviser-Analytics.docx',
        fileType: 'DOCX',
        sizeLabel: '1.2 MB',
        uploadedAt: '2025-12-18T09:10:00.000Z',
        uploadedBy: 'Maria Concepcion Santos'
      }),
      createTitleAttachment({
        id: 'title-attachment-002',
        fileName: 'Title-Proposal-Supporting-Background.pdf',
        fileType: 'PDF',
        sizeLabel: '824 KB',
        uploadedAt: '2025-12-18T09:14:00.000Z',
        uploadedBy: 'Maria Concepcion Santos'
      })
    ]
  },
  technologyTransfer: {
    id: 'tech-001',
    user_id: 'user-student-001',
    project_id: 'project-it-001',
    status: 'active',
    created_at: now,
    updated_at: now,
    transferabilityStatus: 'Proposed',
    deploymentStatus: 'Pilot deployment planning',
    beneficiary: 'University Guidance and Academic Support Office',
    location: 'College of Computing Laboratory and Guidance Office',
    dateDeployed: '',
    extensionStatus: 'For evaluation',
    adoptionStatus: 'Initial interest confirmed',
    implementationNotes: 'Initial meeting completed with guidance counselors. Need to prepare manual before installation.',
    impactSummary: 'The system is expected to cut manual tracking time by 40% and provide proactive alerts for early intervention.'
  },
  presentations: [
    {
      id: 'pres-001',
      user_id: 'user-student-001',
      project_id: 'project-it-001',
      status: 'active',
      created_at: now,
      updated_at: now,
      eventName: 'CCS Capstone Symposium',
      eventType: 'Presentation',
      date: '2026-03-15T09:00:00.000Z',
      dateLabel: 'March 15, 2026',
      venue: 'University Auditorium',
      description: 'Presented the first iteration of the AI-powered learning management predictive module.',
      achievement: 'Best Presentation Award',
      scope: 'Local',
      certificateFile: 'Symposium-Certificate.pdf',
      photoCount: 4
    }
  ]
};

type MockStudentSession = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  department?: string;
  yearLevel?: string;
};

type DepartmentDemoConfig = {
  email: string;
  fullName: string;
  studentId: string;
  departmentCode: string;
  departmentName: string;
  program: string;
  section: string;
  projectId: string;
  projectCode: string;
  groupName: string;
  groupCode: string;
  groupMembers: string[];
  adviser: string;
  title: string;
  description: string;
  category: string;
  currentMilestone: string;
  activePhase: string;
  validationPhase: string;
  developmentSummary: string;
  validationSummary: string;
  evidenceFileName: string;
  evidenceFileType: string;
  evidenceSizeLabel: string;
  progressPercentage: number;
  implementationLocation: string;
  beneficiary: string;
  keywords: string[];
  panelMembers: string[];
  transferabilityNote: string;
  abstract: string;
  presentationEvent: string;
  presentationDescription: string;
  achievement: string;
};

const MOCK_AUTH_COOKIE_KEY = 'capstoneMockAuthUser';

const departmentDemoByEmail: Record<string, DepartmentDemoConfig> = {
  'rafael.dizon@university.edu.ph': {
    email: 'rafael.dizon@university.edu.ph',
    fullName: 'Rafael Dizon',
    studentId: '2024-MET-0101',
    departmentCode: 'MET',
    departmentName: 'Mechanical Engineering Technology',
    program: 'BS Mechanical Engineering Technology',
    section: 'MET-4A',
    projectId: 'project-met-001',
    projectCode: 'CAP-MET-2026-008',
    groupName: 'ThermoDrive Fabrication Team',
    groupCode: 'GRP-MET-2026-008',
    groupMembers: ['Rafael Dizon', 'Mikaela Torres', 'Paolo Fernandez', 'Jasper Ong'],
    adviser: 'Prof. Andres Ramos',
    title: 'Solar-Powered Grain Dryer with Automated Temperature and Moisture Control',
    description:
      'A mechanical prototype thesis focused on fabrication, thermal efficiency testing, and controlled drying performance for small farming communities.',
    category: 'Machine Design and Prototype Development',
    currentMilestone: 'Prototype Fabrication',
    activePhase: 'Prototype Fabrication',
    validationPhase: 'Performance and Safety Testing',
    developmentSummary:
      'Fabrication of the drying chamber, airflow mechanism, sensor mounting, and solar heating assembly is in progress.',
    validationSummary:
      'Thermal efficiency, moisture reduction, safety, and durability tests are being prepared for adviser validation.',
    evidenceFileName: 'Grain-Dryer-Fabrication-Drawings-and-Test-Plan.pdf',
    evidenceFileType: 'PDF',
    evidenceSizeLabel: '4.8 MB',
    progressPercentage: 58,
    implementationLocation: 'MET Fabrication Laboratory',
    beneficiary: 'Community Farmer Cooperative',
    keywords: ['Solar Dryer', 'Thermal Control', 'Fabrication', 'Moisture Monitoring'],
    panelMembers: ['Engr. Marissa Lopez', 'Engr. Noel Bautista'],
    transferabilityNote:
      'The prototype can be transferred to partner farming communities after durability testing and safety validation.',
    abstract:
      'This study designs and fabricates a solar-powered grain dryer with automated temperature and moisture control. It evaluates drying consistency, thermal efficiency, and usability for small-scale agricultural operations.',
    presentationEvent: 'MET Design and Fabrication Expo',
    presentationDescription: 'Presented the fabricated drying chamber, airflow design, and early thermal testing results.',
    achievement: 'Best Prototype Design'
  },
  'bianca.navarro@university.edu.ph': {
    email: 'bianca.navarro@university.edu.ph',
    fullName: 'Bianca Navarro',
    studentId: '2024-TCM-0101',
    departmentCode: 'TCM',
    departmentName: 'Technology Communication Management',
    program: 'BS Technology Communication Management',
    section: 'TCM-4A',
    projectId: 'project-tcm-001',
    projectCode: 'CAP-TCM-2026-006',
    groupName: 'HarborLink Communication Group',
    groupCode: 'GRP-TCM-2026-006',
    groupMembers: ['Bianca Navarro', 'Lorenzo Mercado', 'Camille Robles', 'Anne Villareal'],
    adviser: 'Dr. Clarissa Mendoza',
    title: 'Community-Based Maritime Safety Communication Campaign for Coastal Barangays',
    description:
      'A communication research thesis focused on campaign planning, message testing, and public awareness materials for coastal safety practices.',
    category: 'Communication Campaign Research',
    currentMilestone: 'Campaign Material Validation',
    activePhase: 'Campaign Material Development',
    validationPhase: 'Audience Message Testing',
    developmentSummary:
      'Campaign storyboards, message frames, poster drafts, and coastal safety scripts are being refined for community review.',
    validationSummary:
      'Audience recall, message clarity, and preparedness intent testing are being prepared with coastal barangay participants.',
    evidenceFileName: 'Maritime-Safety-Campaign-Materials-and-FGD-Guide.pdf',
    evidenceFileType: 'PDF',
    evidenceSizeLabel: '3.6 MB',
    progressPercentage: 61,
    implementationLocation: 'Partner Coastal Barangay',
    beneficiary: 'Coastal Disaster Risk Reduction Committee',
    keywords: ['Maritime Safety', 'Communication Campaign', 'Coastal Community', 'Risk Awareness'],
    panelMembers: ['Dr. Helena Reyes', 'Prof. Marco Villanueva'],
    transferabilityNote:
      'The campaign toolkit can be adopted by coastal barangays after focus-group validation and language localization.',
    abstract:
      'This study develops and evaluates a maritime safety communication campaign for coastal barangays. It measures message clarity, audience recall, and preparedness intent across selected community participants.',
    presentationEvent: 'TCM Communication Research Colloquium',
    presentationDescription: 'Presented campaign storyboards, audience testing results, and revised safety message frames.',
    achievement: 'Best Campaign Concept'
  },
  'cedric.alvarez@university.edu.ph': {
    email: 'cedric.alvarez@university.edu.ph',
    fullName: 'Cedric Alvarez',
    studentId: '2024-ESM-0101',
    departmentCode: 'ESM',
    departmentName: 'Engineering and Sustainability Management',
    program: 'BS Engineering and Sustainability Management',
    section: 'ESM-4A',
    projectId: 'project-esm-001',
    projectCode: 'CAP-ESM-2026-011',
    groupName: 'EcoLoop Assessment Team',
    groupCode: 'GRP-ESM-2026-011',
    groupMembers: ['Cedric Alvarez', 'Nina Bautista', 'Miguel Santos', 'Erika Dela Pena'],
    adviser: 'Dr. Samuel Villarin',
    title: 'Sustainable Campus Waste Segregation and Energy Recovery Feasibility Study',
    description:
      'A sustainability management thesis focused on waste audit data, feasibility analysis, and implementation planning for campus resource recovery.',
    category: 'Sustainability Feasibility Study',
    currentMilestone: 'Field Data Collection',
    activePhase: 'Field Data Collection and Feasibility Modeling',
    validationPhase: 'Cost-Benefit and Stakeholder Validation',
    developmentSummary:
      'Waste audit sheets, recovery scenarios, stakeholder interview data, and feasibility assumptions are being consolidated.',
    validationSummary:
      'Cost-benefit results, sustainability indicators, and implementation assumptions are being prepared for stakeholder validation.',
    evidenceFileName: 'Campus-Waste-Audit-and-Feasibility-Matrix.xlsx',
    evidenceFileType: 'XLSX',
    evidenceSizeLabel: '2.9 MB',
    progressPercentage: 55,
    implementationLocation: 'University Facilities Management Office',
    beneficiary: 'Campus Sustainability Committee',
    keywords: ['Waste Audit', 'Sustainability', 'Energy Recovery', 'Feasibility Study'],
    panelMembers: ['Dr. Andrea Lim', 'Engr. Patrick Gomez'],
    transferabilityNote:
      'The framework can support campus-wide sustainability planning once the cost-benefit model is validated.',
    abstract:
      'This study evaluates the feasibility of a campus waste segregation and energy recovery program. It uses field waste audits, stakeholder interviews, and cost-benefit analysis to recommend a sustainable implementation model.',
    presentationEvent: 'ESM Sustainability Research Forum',
    presentationDescription: 'Presented waste audit findings, recovery scenarios, and preliminary feasibility indicators.',
    achievement: 'Sustainability Impact Citation'
  },
  'isabela.cortez@university.edu.ph': {
    email: 'isabela.cortez@university.edu.ph',
    fullName: 'Isabela Cortez',
    studentId: '2024-NAME-0101',
    departmentCode: 'NAME',
    departmentName: 'Naval Architecture and Marine Engineering',
    program: 'BS Naval Architecture and Marine Engineering',
    section: 'NAME-4A',
    projectId: 'project-name-001',
    projectCode: 'CAP-NAME-2026-005',
    groupName: 'BlueHull Design Group',
    groupCode: 'GRP-NAME-2026-005',
    groupMembers: ['Isabela Cortez', 'Gabriel Tan', 'Sophia Ramos', 'Kenji Uy'],
    adviser: 'Engr. Victor Salcedo',
    title: 'Hull Form Optimization for a Low-Emission Coastal Patrol Vessel',
    description:
      'A naval architecture thesis focused on hull design comparison, resistance estimation, and performance validation for coastal patrol operations.',
    category: 'Naval Architecture Design Study',
    currentMilestone: 'Design Validation',
    activePhase: 'Hull Form Design and Resistance Analysis',
    validationPhase: 'Stability and Resistance Review',
    developmentSummary:
      'Hull alternatives, resistance estimates, stability checks, and operating requirement comparisons are being refined.',
    validationSummary:
      'Resistance calculations, stability criteria, and design assumptions are being prepared for panel review.',
    evidenceFileName: 'Coastal-Patrol-Vessel-Hull-Lines-and-Resistance-Report.pdf',
    evidenceFileType: 'PDF',
    evidenceSizeLabel: '5.2 MB',
    progressPercentage: 60,
    implementationLocation: 'NAME Design Studio and Model Testing Facility',
    beneficiary: 'Coastal Safety and Patrol Unit',
    keywords: ['Hull Design', 'Resistance Analysis', 'Coastal Vessel', 'Marine Engineering'],
    panelMembers: ['Engr. Liza Navarro', 'Capt. Ramon Estrella'],
    transferabilityNote:
      'The optimized design can move to scale-model testing after final resistance calculations and stability review.',
    abstract:
      'This study compares hull form alternatives for a low-emission coastal patrol vessel. It analyzes resistance, stability, and operating requirements to recommend a design suited for nearshore patrol conditions.',
    presentationEvent: 'NAME Design Review Forum',
    presentationDescription: 'Presented hull alternatives, resistance estimates, and early stability review findings.',
    achievement: 'Best Design Study'
  }
};

function cloneStudentDashboardData() {
  return JSON.parse(JSON.stringify(studentDashboardData)) as StudentDashboardData;
}

async function getMockStudentSession() {
  try {
    const cookieStore = await cookies();
    const rawValue = cookieStore.get(MOCK_AUTH_COOKIE_KEY)?.value;
    return rawValue ? (JSON.parse(decodeURIComponent(rawValue)) as MockStudentSession) : null;
  } catch {
    return null;
  }
}

function createDepartmentDashboardData(config: DepartmentDemoConfig): StudentDashboardData {
  const data = cloneStudentDashboardData();
  const userId = `user-${config.departmentCode.toLowerCase()}-student-001`;

  data.profile = {
    ...data.profile,
    id: `profile-${config.departmentCode.toLowerCase()}-student-001`,
    user_id: userId,
    project_id: config.projectId,
    fullName: config.fullName,
    studentId: config.studentId,
    groupRole: 'Group Leader',
    email: config.email,
    program: config.program,
    department: config.departmentName,
    yearLevel: '4th Year',
    section: config.section,
    adviser: config.adviser,
    accountSummary: `${config.departmentCode} capstone standing, active thesis workspace.`
  };

  data.group = {
    ...data.group,
    id: `group-${config.departmentCode.toLowerCase()}-2026-001`,
    user_id: userId,
    project_id: config.projectId,
    groupName: config.groupName,
    groupCode: config.groupCode,
    leaderName: config.fullName,
    memberCount: config.groupMembers.length,
    members: config.groupMembers.map((member, index) => ({
      id: `member-${config.departmentCode.toLowerCase()}-${String(index + 1).padStart(3, '0')}`,
      user_id: index === 0 ? userId : `user-${config.departmentCode.toLowerCase()}-student-${String(index + 1).padStart(3, '0')}`,
      project_id: config.projectId,
      status: 'active',
      created_at: now,
      updated_at: now,
      fullName: member,
      studentId: index === 0 ? config.studentId : `2024-${config.departmentCode}-${String(101 + index).padStart(4, '0')}`,
      email: index === 0 ? config.email : `${member.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.+|\.+$/g, '')}@university.edu.ph`,
      isLeader: index === 0,
      isCurrent: index === 0
    }))
  };

  data.project = {
    ...data.project,
    id: config.projectId,
    user_id: userId,
    project_id: config.projectId,
    title: config.title,
    description: config.description,
    projectCode: config.projectCode,
    groupName: config.groupName,
    adviser: config.adviser,
    progressPercentage: config.progressPercentage,
    currentMilestone: config.activePhase,
    program: config.program,
    department: config.departmentName,
    category: config.category,
    implementationLocation: config.implementationLocation,
    keywords: config.keywords,
    panelMembers: config.panelMembers,
    transferabilityNote: config.transferabilityNote,
    abstract: config.abstract
  };

  if (data.dashboard?.workflow) {
    data.dashboard.workflow = data.dashboard.workflow.map((step) =>
      step.key === 'development'
        ? {
            ...step,
            title: config.activePhase,
            summary: config.developmentSummary,
            dateLabel: 'Apr 8, 2026'
          }
        : step.key === 'testing'
          ? {
              ...step,
              title: config.validationPhase,
              summary: config.validationSummary
            }
          : step
    );
  }

  data.documents = data.documents.map((document, index) => ({
    ...document,
    user_id: index === 0 ? userId : `user-${config.departmentCode.toLowerCase()}-student-${String((index % config.groupMembers.length) + 1).padStart(3, '0')}`,
    project_id: config.projectId,
    category: document.category === 'system-files' ? 'supporting-documents' : document.category,
    fileName:
      document.category === 'system-files'
        ? config.evidenceFileName
        : document.fileName
            .replace('AI-Learning-System', config.departmentCode)
            .replace('Midterm-Presentation', `${config.departmentCode}-Presentation`),
    fileType: document.category === 'system-files' ? config.evidenceFileType : document.fileType,
    sizeLabel: document.category === 'system-files' ? config.evidenceSizeLabel : document.sizeLabel,
    uploadedBy: config.groupMembers[index % config.groupMembers.length]
  }));

  data.feedback = data.feedback.map((feedback, index) => ({
    ...feedback,
    user_id: userId,
    project_id: config.projectId,
    facultyName: index % 2 === 0 ? config.adviser : config.panelMembers[0],
    title:
      index === 0
        ? `Clarify ${config.category} Methodology`
        : index === 1
          ? 'Refine Presentation Flow'
        : index === 2
          ? `Confirm ${config.validationPhase} Scope`
          : 'Update Evidence Documentation',
    content:
      index === 0
        ? `Strengthen the methodology so it clearly matches ${config.title}.`
        : feedback.content
  }));

  data.milestones = data.milestones.map((milestone) => ({
    ...milestone,
    user_id: userId,
    project_id: config.projectId,
    title:
      milestone.title === 'Development'
        ? config.activePhase
        : milestone.title === 'Mock Defense'
          ? config.validationPhase
          : milestone.title,
    assignedTo: milestone.assignedTo === 'Cluster A - Predictive Systems' ? config.groupName : config.fullName,
    summary:
      milestone.title === 'Development'
        ? config.developmentSummary
        : milestone.title === 'Mock Defense'
          ? config.validationSummary
          : milestone.summary.replace('prototype', 'project evidence'),
    notes:
      milestone.title === 'Development'
        ? config.developmentSummary
        : milestone.title === 'Mock Defense'
          ? config.validationSummary
          : milestone.notes,
    relatedPhase:
      milestone.title === 'Development'
        ? config.activePhase
        : milestone.title === 'Mock Defense'
          ? config.validationPhase
          : milestone.relatedPhase
  }));

  data.schedules = data.schedules.map((schedule) => ({
    ...schedule,
    user_id: userId,
    project_id: config.projectId,
    title:
      schedule.title === 'Pilot Testing Planning Meeting'
        ? `${config.validationPhase} Planning Meeting`
        : schedule.title,
    location: schedule.location === 'Computing Laboratory' ? config.implementationLocation : schedule.location,
    description:
      schedule.title === 'Pilot Testing Planning Meeting'
        ? config.validationSummary
        : schedule.description.replace('prototype', 'project evidence')
  }));

  data.notifications = data.notifications.map((notification) => {
    const isDeadline = notification.title.includes('Chapter 3 Revision Deadline');

    return {
      ...notification,
      user_id: userId,
      project_id: config.projectId,
      title:
        notification.title === 'Implementation Review Notes Updated'
          ? `${config.activePhase} Notes Updated`
          : notification.title === 'Adviser Consultation Added to Your Schedule'
            ? `${config.validationPhase} Consultation Added`
            : isDeadline
              ? `${config.category} Revision Deadline is Approaching`
              : notification.title,
      message:
        notification.title === 'Implementation Review Notes Updated'
          ? config.developmentSummary
          : isDeadline
            ? `Complete the revised ${config.category.toLowerCase()} package before the submission window closes.`
            : notification.message
    };
  });

  data.progressReports = data.progressReports.map((report) => ({
    ...report,
    user_id: userId,
    project_id: config.projectId,
    title: `${config.departmentCode} Progress Report 01`,
    progressDescription: `Completed adviser revisions, updated ${config.category.toLowerCase()} evidence, and aligned ${config.validationPhase.toLowerCase()} with ${config.adviser}.`,
    accomplishments: [
      `Updated ${config.category.toLowerCase()} documentation`,
      'Prepared adviser revision responses',
      'Organized validation evidence'
    ],
    nextSteps: `Continue ${config.activePhase.toLowerCase()} and prepare the next adviser review package.`,
    percentageCompleted: config.progressPercentage
  }));

  const generatedTitleBackground = `${config.description} ${config.abstract}`;
  const generatedProblemStatement = `The current workflow for ${config.beneficiary.toLowerCase()} lacks a focused ${config.category.toLowerCase()} record that clearly defines the project scope, supporting context, and review objectives. A structured title proposal package is needed so ${config.adviser} and the review panel can evaluate the study direction before the team proceeds to ${config.activePhase.toLowerCase()}.`;
  const generatedObjectives = [
    `Present a clear title proposal for "${config.title}" that aligns with the ${config.departmentCode} capstone scope.`,
    `Summarize the background and study problem that justify the proposed ${config.category.toLowerCase()}.`,
    `Define the working objectives that guide ${config.activePhase.toLowerCase()} and the next adviser review cycle.`
  ];
  const generatedTitleAttachments = [
    createTitleAttachment({
      id: `title-${config.departmentCode.toLowerCase()}-attachment-001`,
      fileName: `${config.departmentCode}-Title-Proposal-Package.${config.evidenceFileType.toLowerCase()}`,
      fileType: config.evidenceFileType,
      sizeLabel: config.evidenceSizeLabel,
      uploadedAt: '2026-03-18T09:20:00.000Z',
      uploadedBy: config.fullName
    })
  ];

  data.titleRegistration = {
    ...data.titleRegistration,
    id: `title-${config.departmentCode.toLowerCase()}-001`,
    user_id: userId,
    project_id: config.projectId,
    proposedTitle: config.title,
    briefDescription: config.description,
    background: generatedTitleBackground,
    statementOfProblem: generatedProblemStatement,
    objectives: generatedObjectives,
    category: config.category,
    keywords: config.keywords,
    groupMembers: config.groupMembers,
    adviser: config.adviser,
    attachments: generatedTitleAttachments,
    reviewSummary: data.titleRegistration.reviewSummary
      ? {
          ...data.titleRegistration.reviewSummary,
          lastReviewedBy: config.adviser
        }
      : undefined,
    reviewerFeedback: data.titleRegistration.reviewerFeedback?.map((item, index) => ({
      ...item,
      author: index === 0 ? config.adviser : config.panelMembers[0],
      note:
        index === 0
          ? `Approved. The title matches the expected ${config.departmentCode} thesis direction and project scope.`
          : `Revise the wording so it clearly reflects ${config.category.toLowerCase()}.`
    }))
  };

  data.technologyTransfer = {
    ...data.technologyTransfer,
    user_id: userId,
    project_id: config.projectId,
    beneficiary: config.beneficiary,
    location: config.implementationLocation,
    implementationNotes: config.transferabilityNote,
    impactSummary: config.abstract
  };

  data.presentations = data.presentations.map((presentation) => ({
    ...presentation,
    user_id: userId,
    project_id: config.projectId,
    eventName: config.presentationEvent,
    description: config.presentationDescription,
    achievement: config.achievement
  }));

  return data;
}

export async function getStudentDashboardData() {
  const session = await getMockStudentSession();
  const demoData = session?.email ? departmentDemoByEmail[session.email.toLowerCase()] : null;
  const data = demoData ? createDepartmentDashboardData(demoData) : cloneStudentDashboardData();

  // Overlay real DB profile onto mock data so the initial server render uses the correct name
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

      // Check real group assignment from the database
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
            data.group.allowMemberSubmission = group.allowMemberSubmission;
            data.group.groupName = group.title || data.group.groupName;
            data.group.leaderName = group.leader || data.group.leaderName;
          }

          // Fetch real GroupMember records with user details
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
              // Fallback: build members from group.students name array
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
          data.titleRegistration.registrationStatus = approvedTitleProject ? 'Approved' : data.titleRegistration.registrationStatus;
        } else {
          data.profile.groupRole = 'Not assigned';
          data.profile.adviser = 'Not assigned';
          if (data.group) {
            data.group.groupName = 'Not assigned';
            data.group.groupCode = 'N/A';
            data.group.leaderName = 'Not assigned';
            data.group.memberCount = 0;
            data.group.members = [];
          }
          if (data.project) {
            data.project.groupName = 'Not assigned';
            data.project.adviser = 'Not assigned';
            data.project.title = 'No active project';
            data.project.projectCode = 'N/A';
          }
        }
      } catch {
        // Group check failed — keep mock groupRole
      }
    }
  } catch {
    // DB unavailable — continue with mock data
  }

  return { data };
}
