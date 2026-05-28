export type DashboardTone = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export type AttentionPriority = 'urgent' | 'warning' | 'normal';

export interface DashboardMetric {
  id: string;
  icon: string;
  label: string;
  value: string;
  helperText: string;
  trendLabel?: string;
  tone?: DashboardTone;
}

export interface LiveUpdateItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  groupName: string;
  timestamp: string;
  statusLabel: string;
  tone: DashboardTone;
  isNew?: boolean;
}

export interface RecentSubmissionItem {
  id: string;
  groupCode: string;
  groupName: string;
  fileTitle: string;
  submissionType: string;
  submittedDate: string;
  statusLabel: string;
  tone: DashboardTone;
  actionId: string;
  meta?: string;
  revisionCount?: number;
}

export interface AttentionAlertItem {
  id: string;
  title: string;
  description: string;
  priority: AttentionPriority;
  meta: string;
}

export interface DashboardAction {
  id: string;
  icon: string;
  label: string;
  helperText: string;
  href?: string;
  onClick?: () => void;
}

export interface WeeklyScheduleItem {
  id: string;
  dateLabel: string;
  timeLabel: string;
  groupName: string;
  eventType: string;
  location?: string;
  tone?: DashboardTone;
  scheduleType?: string;
  projectId?: string;
  notes?: string;
}

export interface GroupProgressSnapshotItem {
  id: string;
  groupName: string;
  projectTitle: string;
  progress: number;
  milestone: string;
  statusLabel: string;
  tone: DashboardTone;
}
