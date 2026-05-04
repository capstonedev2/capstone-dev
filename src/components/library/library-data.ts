export type LibraryDepartment = 'IT' | 'MET' | 'TCM' | 'ESM' | 'NAME';
export type LibraryProjectType =
  | 'Web-Based'
  | 'Mobile Application'
  | 'IoT System'
  | 'AI/ML System';
export type LibraryDocumentType =
  | 'Manuscript'
  | 'Presentation'
  | 'Technical Report'
  | 'Certificate'
  | 'Supporting Data';
export type LibraryNotificationCategory =
  | 'New Publications'
  | 'Repository Updates'
  | 'Saved Study Alerts'
  | 'Research Insights Digest';

export type LibraryProject = {
  id: number;
  title: string;
  detailTitle?: string;
  authors: string[];
  department: LibraryDepartment;
  year: number;
  adviser: string;
  type: LibraryProjectType;
  keywords: string[];
  abstract: string;
  views: number;
  savedByDefault?: boolean;
  authorsShort?: string;
  statusLabel?: string;
  technologies?: string[];
  achievements?: string[];
  transfer?: {
    partner: string;
    status: string;
    impact: string;
  };
  relatedStudyIds?: number[];
};

export type LibraryDocument = {
  id: string;
  fileName: string;
  projectId: number;
  projectTitle: string;
  department: LibraryDepartment;
  type: LibraryDocumentType;
  size: string;
  dateLabel: string;
  categoryLabel: string;
};

export type LibraryNotification = {
  id: string;
  category: LibraryNotificationCategory;
  title: string;
  message: string;
  timeLabel: string;
  unread: boolean;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'muted';
};

export type LibraryDepartmentSummary = {
  department: LibraryDepartment;
  label: string;
  count: number;
};

export const LIBRARY_NAV_ITEMS = [
  { key: 'dashboard', href: '/library/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
  { key: 'browse', href: '/library/browse', label: 'Browse Projects', icon: 'fa-search' },
  { key: 'repository', href: '/library/repository', label: 'Repository', icon: 'fa-folder-open' },
  { key: 'insights', href: '/library/insights', label: 'Research Insights', icon: 'fa-chart-line' },
  { key: 'saved', href: '/library/saved', label: 'Saved Projects', icon: 'fa-bookmark' },
  { key: 'notifications', href: '/library/notifications', label: 'Notifications', icon: 'fa-bell' },
  { key: 'profile', href: '/library/profile', label: 'Profile', icon: 'fa-user' }
] as const;

export type LibraryNavKey = (typeof LIBRARY_NAV_ITEMS)[number]['key'];

export const LIBRARY_DEPARTMENT_SUMMARY: readonly LibraryDepartmentSummary[] = [
  { department: 'IT', label: 'Information Technology', count: 98 },
  { department: 'MET', label: 'Mechanical Engineering Tech', count: 67 },
  { department: 'TCM', label: 'Tech Communication Management', count: 45 },
  { department: 'ESM', label: 'Engineering & Sustainability', count: 72 },
  { department: 'NAME', label: 'Naval Architecture & Marine Eng', count: 60 }
] as const;

export const LIBRARY_PROJECTS: readonly LibraryProject[] = [
  {
    id: 1,
    title: 'AI-Powered Learning Management System',
    detailTitle: 'AI-Powered Learning Management System with Predictive Analytics',
    authors: ['Maria Santos', 'John Reyes', 'Anna Cruz'],
    authorsShort: 'Santos, M. et al.',
    department: 'IT',
    year: 2024,
    adviser: 'Dr. Ricardo Cruz',
    type: 'AI/ML System',
    keywords: ['Artificial Intelligence', 'Machine Learning', 'Education Technology', 'Predictive Analytics', 'Learning Management System'],
    abstract:
      'This study develops an AI-powered Learning Management System that utilizes machine learning algorithms to predict student performance and provide personalized learning recommendations. The system was tested with 200 students and showed a 25% improvement in learning outcomes through real-time analytics, personalized learning paths, and early warning support for at-risk students.',
    views: 1234,
    savedByDefault: true,
    statusLabel: 'Published | Completed 2024',
    technologies: ['Python', 'Django', 'React', 'PostgreSQL', 'TensorFlow', 'Scikit-learn', 'Docker', 'AWS'],
    achievements: [
      'Best Research Paper - National Research Symposium 2024',
      'Published in International Journal of Educational Technology',
      'Featured in University Research Showcase'
    ],
    transfer: {
      partner: 'TechCorp Inc.',
      status: 'Deployed & Operational',
      impact: '40% reduction in stockouts in pilot implementation'
    },
    relatedStudyIds: [6, 8]
  },
  {
    id: 2,
    title: 'Smart Solar Energy Monitoring System',
    authors: ['Ramon Carlos', 'Lisa Tan'],
    authorsShort: 'Carlos, R. et al.',
    department: 'MET',
    year: 2024,
    adviser: 'Prof. Maria Ramos',
    type: 'IoT System',
    keywords: ['Solar', 'IoT', 'Energy', 'Monitoring'],
    abstract: 'Real-time solar panel efficiency monitoring system with campus-level deployment insights.',
    views: 876,
    savedByDefault: true,
    relatedStudyIds: [7, 4]
  },
  {
    id: 3,
    title: 'Herbal Medicine Database System',
    authors: ['Anna Cruz', 'Maria Santos'],
    authorsShort: 'Cruz, A. et al.',
    department: 'TCM',
    year: 2023,
    adviser: 'Dr. Anna Reyes',
    type: 'Web-Based',
    keywords: ['Database', 'Medicine', 'Herbal'],
    abstract: 'Digital repository of traditional herbal medicines and evidence-based formulation data.',
    views: 642
  },
  {
    id: 4,
    title: 'Sustainable Agriculture IoT System',
    authors: ['Mark Tan', 'Sarah Lim'],
    authorsShort: 'Tan, M. et al.',
    department: 'ESM',
    year: 2024,
    adviser: 'Prof. Jose Lopez',
    type: 'IoT System',
    keywords: ['Agriculture', 'IoT', 'Sustainability'],
    abstract: 'Automated irrigation and soil monitoring system for resource-efficient agriculture.',
    views: 591
  },
  {
    id: 5,
    title: 'Marine Pollution Detection Drone',
    authors: ['Sarah Lim', 'Mark Rivera'],
    authorsShort: 'Lim, S. et al.',
    department: 'NAME',
    year: 2023,
    adviser: 'Dr. Elena Aquino',
    type: 'AI/ML System',
    keywords: ['Drone', 'Marine', 'Pollution'],
    abstract: 'Autonomous drone system for marine pollution detection and coastal mapping.',
    views: 784,
    savedByDefault: true
  },
  {
    id: 6,
    title: 'Blockchain-Based Grade Management',
    authors: ['John Reyes', 'Maria Santos'],
    authorsShort: 'Reyes, J. et al.',
    department: 'IT',
    year: 2023,
    adviser: 'Dr. Ricardo Cruz',
    type: 'Web-Based',
    keywords: ['Blockchain', 'Grades', 'Security'],
    abstract: 'Secure academic records and grade verification using distributed ledger technology.',
    views: 534
  },
  {
    id: 7,
    title: 'Electric Vehicle Charging Station',
    authors: ['Ramon Carlos', 'Mark Tan'],
    authorsShort: 'Carlos, R. et al.',
    department: 'MET',
    year: 2024,
    adviser: 'Prof. Maria Ramos',
    type: 'IoT System',
    keywords: ['EV', 'Charging', 'Smart Grid'],
    abstract: 'Smart EV charging station with load balancing and usage analytics.',
    views: 488
  },
  {
    id: 8,
    title: 'Digital Marketing Analytics Platform',
    authors: ['Anna Cruz', 'Sarah Lim'],
    authorsShort: 'Cruz, A. et al.',
    department: 'TCM',
    year: 2023,
    adviser: 'Dr. Anna Reyes',
    type: 'Web-Based',
    keywords: ['Marketing', 'Analytics', 'Digital'],
    abstract: 'Analytics platform for campaign monitoring, attribution, and digital engagement analysis.',
    views: 452
  }
] as const;

export const LIBRARY_RECENT_STUDIES = [
  { title: 'AI-Powered Learning Management System', department: 'IT', authors: 'Santos, M. et al.', year: 2024, projectId: 1 },
  { title: 'Smart Solar Energy Monitor', department: 'MET', authors: 'Carlos, R. et al.', year: 2024, projectId: 2 },
  { title: 'Herbal Medicine Database System', department: 'TCM', authors: 'Cruz, A. et al.', year: 2023, projectId: 3 },
  { title: 'Sustainable Agriculture IoT System', department: 'ESM', authors: 'Tan, M. et al.', year: 2024, projectId: 4 }
] as const;

export const LIBRARY_DOCUMENTS: readonly LibraryDocument[] = [
  {
    id: 'doc-1',
    fileName: 'AI_Learning_System_Manuscript.pdf',
    projectId: 1,
    projectTitle: 'AI-Powered Learning System',
    department: 'IT',
    type: 'Manuscript',
    size: '2.4 MB',
    dateLabel: 'Feb 2024',
    categoryLabel: 'Full Manuscripts'
  },
  {
    id: 'doc-2',
    fileName: 'Smart_Energy_Monitor_Presentation.pptx',
    projectId: 2,
    projectTitle: 'Smart Solar Energy Monitor',
    department: 'MET',
    type: 'Presentation',
    size: '5.1 MB',
    dateLabel: 'Jan 2024',
    categoryLabel: 'Presentations'
  },
  {
    id: 'doc-3',
    fileName: 'Marine_Detector_Technical_Report.pdf',
    projectId: 5,
    projectTitle: 'Marine Pollution Detector',
    department: 'NAME',
    type: 'Technical Report',
    size: '1.8 MB',
    dateLabel: 'Dec 2023',
    categoryLabel: 'Technical Reports'
  },
  {
    id: 'doc-4',
    fileName: 'Blockchain_Grade_Management_Certificate.pdf',
    projectId: 6,
    projectTitle: 'Blockchain-Based Grade Management',
    department: 'IT',
    type: 'Certificate',
    size: '0.9 MB',
    dateLabel: 'Nov 2023',
    categoryLabel: 'Certificates'
  },
  {
    id: 'doc-5',
    fileName: 'Sustainable_Agri_IoT_Dataset.zip',
    projectId: 4,
    projectTitle: 'Sustainable Agriculture IoT System',
    department: 'ESM',
    type: 'Supporting Data',
    size: '14.2 MB',
    dateLabel: 'Feb 2024',
    categoryLabel: 'Supporting Data'
  }
] as const;

export const LIBRARY_NOTIFICATIONS: readonly LibraryNotification[] = [
  {
    id: 'notif-1',
    category: 'New Publications',
    title: 'New Publication Added',
    message: '"Blockchain-Based Supply Chain System" from IT Department has been published in the repository.',
    timeLabel: '2 hours ago',
    unread: true,
    icon: 'fa-file-alt',
    tone: 'success'
  },
  {
    id: 'notif-2',
    category: 'Saved Study Alerts',
    title: 'Saved Study Update',
    message: 'New version of "AI-Powered Learning System" is now available with additional chapters.',
    timeLabel: '1 day ago',
    unread: true,
    icon: 'fa-bookmark',
    tone: 'warning'
  },
  {
    id: 'notif-3',
    category: 'Research Insights Digest',
    title: 'Research Insights Digest',
    message: 'The weekly repository trend digest is ready, with AI in Education still leading.',
    timeLabel: '2 days ago',
    unread: false,
    icon: 'fa-chart-line',
    tone: 'primary'
  },
  {
    id: 'notif-4',
    category: 'Repository Updates',
    title: 'Weekly Repository Digest',
    message: '4 new projects were added this week. Most viewed: Smart Solar Energy Monitor.',
    timeLabel: '3 days ago',
    unread: false,
    icon: 'fa-users',
    tone: 'muted'
  }
] as const;

export const LIBRARY_KEYWORD_TRENDS = [
  { label: 'Artificial Intelligence', count: 45 },
  { label: 'Machine Learning', count: 38 },
  { label: 'IoT', count: 42 },
  { label: 'Sustainability', count: 28 },
  { label: 'Blockchain', count: 15 },
  { label: 'Data Analytics', count: 52 },
  { label: 'Mobile Applications', count: 35 }
] as const;

export const LIBRARY_YEAR_COUNTS = [
  { year: '2024', count: 85, tone: 'success' },
  { year: '2023', count: 112, tone: 'primary' },
  { year: '2022', count: 98, tone: 'primary' },
  { year: '2021', count: 47, tone: 'muted' }
] as const;

export const LIBRARY_EMERGING_TOPICS = [
  { label: 'AI in Education', growth: '+156% growth' },
  { label: 'Sustainable Energy Solutions', growth: '+89%' },
  { label: 'Marine Technology', growth: '+67%' },
  { label: 'Digital Transformation', growth: '+45%' }
] as const;

export const LIBRARY_RECOMMENDED_READING = [
  {
    title: 'AI in Higher Education',
    description: 'Comprehensive review of AI applications in academic settings.',
    department: 'IT',
    projectId: 1
  },
  {
    title: 'Sustainable Manufacturing Practices',
    description: 'Case studies on green manufacturing technologies.',
    department: 'MET',
    projectId: 2
  },
  {
    title: 'Marine Ecosystem Monitoring',
    description: 'Advanced technologies for ocean conservation.',
    department: 'NAME',
    projectId: 5
  }
] as const;

export const LIBRARY_PROFILE = {
  displayName: 'Sarah Rivera',
  fullName: 'Sarah Marie Rivera',
  email: 'sarah.rivera@university.edu.ph',
  departmentInterest: 'Information Technology',
  roleLabel: 'E-Library Access',
  roleDescription: 'E-Library Access (Read-Only Repository, Optional Notifications)',
  accountStatus: 'Active',
  memberSince: 'January 2024',
  savedProjects: 3,
  documentsViewed: 24,
  downloads: 12,
  lastActive: 'Today'
} as const;

export const LIBRARY_PROFILE_ACTIVITY = [
  'Viewed: AI-Powered Learning System - Feb 12, 2024',
  'Saved: Smart Solar Energy Monitor - Feb 10, 2024',
  'Downloaded: Marine Pollution Detector Manuscript - Feb 8, 2024',
  'Searched: "machine learning education" - Feb 5, 2024'
] as const;

export const LIBRARY_DOCUMENT_CATEGORY_COUNTS = [
  { label: 'Full Manuscripts', count: 342 },
  { label: 'Defense Presentations', count: 156 },
  { label: 'Technical Reports', count: 48 },
  { label: 'Certificates & Awards', count: 89 },
  { label: 'Supporting Data', count: 23 }
] as const;

export function getDepartmentLabel(department: LibraryDepartment) {
  return LIBRARY_DEPARTMENT_SUMMARY.find((item) => item.department === department)?.label ?? department;
}

export function getProjectById(projectId: number) {
  return LIBRARY_PROJECTS.find((project) => project.id === projectId) ?? LIBRARY_PROJECTS[0];
}

export function getProjectIcon(projectType: LibraryProjectType) {
  switch (projectType) {
    case 'AI/ML System':
      return 'fa-brain';
    case 'IoT System':
      return 'fa-microchip';
    case 'Mobile Application':
      return 'fa-mobile-screen-button';
    case 'Web-Based':
    default:
      return 'fa-globe';
  }
}

export function getNotificationToneClass(tone: LibraryNotification['tone']) {
  switch (tone) {
    case 'success':
      return 'is-success';
    case 'warning':
      return 'is-warning';
    case 'muted':
      return 'is-muted';
    case 'primary':
    default:
      return 'is-primary';
  }
}
