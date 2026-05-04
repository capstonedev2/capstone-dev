export const STUDENT_NAV_SECTIONS = [
  { key: 'workspace', label: 'Workspace' },
  { key: 'submissions', label: 'Submissions' }
] as const;

export const STUDENT_NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/students/dashboard', icon: 'fa-gauge-high', section: 'workspace' },
  { key: 'project-overview', label: 'Project Overview', href: '/students/project-overview', icon: 'fa-folder-open', section: 'workspace' },
  { key: 'milestones', label: 'Milestones', href: '/students/milestones', icon: 'fa-timeline', section: 'workspace' },
  { key: 'schedule', label: 'Schedule', href: '/students/schedule', icon: 'fa-calendar-check', section: 'workspace' },
  { key: 'title-submission', label: 'Title Submission', href: '/students/title-submission', icon: 'fa-pen-to-square', section: 'submissions' },
  { key: 'project-files', label: 'Project Files', href: '/students/project-files', icon: 'fa-book-open-reader', section: 'submissions' },
  { key: 'repository', label: 'Repository', href: '/students/repository', icon: 'fa-book', section: 'submissions' },
  { key: 'progress-reports', label: 'Progress Reports', href: '/students/progress-reports', icon: 'fa-clipboard-list', section: 'submissions' },
  { key: 'faculty-feedback', label: 'Faculty Feedback', href: '/students/faculty-feedback', icon: 'fa-comments', section: 'submissions' }
] as const;

export type StudentNavKey = (typeof STUDENT_NAV_ITEMS)[number]['key'];
export type StudentNavSectionKey = (typeof STUDENT_NAV_SECTIONS)[number]['key'];
