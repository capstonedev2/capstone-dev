'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import {
  ADVISER_GROUP_STATUS_META,
  NAV_ITEMS,
  WORKSPACE_META,
  getComputedGroupStatus,
  getGroupDepartmentLabel,
  getGroupMilestoneLabel,
  getGroupProjectTitle,
  isGroupCompleted,
  isNavItemActive
} from '@/components/adviser/shared/config/dashboard-utils';
import type { AdviserGroupLifecycleStatus } from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

type WorkspaceMode = keyof typeof WORKSPACE_META;
type GroupViewMode = 'table' | 'card';
type GroupLifecycleTab = 'active' | 'completed';
type AdviserGroup = AdviserDashboardData['groups'][number];
type ManagedAdviserGroup = AdviserGroup;
type LifecycleGroup = ManagedAdviserGroup & { status: AdviserGroupLifecycleStatus };
type GroupFilterStatus = 'all' | 'attention' | AdviserGroupLifecycleStatus;
type GroupDraft = {
  code: string;
  title: string;
  students: string[];
  leader: string;
};
type StudentRosterRecord = { name?: string | null };
type GroupRosterRecord = { students?: unknown };

const GROUP_STATUS_META = ADVISER_GROUP_STATUS_META;

function createEmptyGroupDraft(): GroupDraft {
  return {
    code: '',
    title: '',
    students: [],
    leader: ''
  };
}

const DEFAULT_NEW_GROUP_STATUS: AdviserGroupLifecycleStatus = 'pending';
const DEFAULT_NEW_GROUP_PROGRESS = 0;
const DEFAULT_NEW_GROUP_MILESTONE = 'Awaiting initial progress update';

const GROUP_TONE_BY_STATUS: Record<AdviserGroupLifecycleStatus, { borderColor: string; surfaceColor: string }> = {
  active: { borderColor: '#10B981', surfaceColor: '#ECFDF5' },
  pending: { borderColor: '#F59E0B', surfaceColor: '#FFFBEB' },
  'needs-revision': { borderColor: '#EF4444', surfaceColor: '#FEF2F2' },
  'at-risk': { borderColor: '#F97316', surfaceColor: '#FFF7ED' },
  completed: { borderColor: '#10B981', surfaceColor: '#ECFDF5' }
};

function getLifecycleGroup(group: ManagedAdviserGroup): LifecycleGroup {
  const completed = isGroupCompleted(group);
  const status = completed ? 'completed' : getComputedGroupStatus(group);
  const statusMeta = GROUP_STATUS_META[status];
  const projectTitle = getGroupProjectTitle(group);
  const department = getGroupDepartmentLabel(group);
  const milestone = getGroupMilestoneLabel(group);

  return {
    ...group,
    status,
    title: projectTitle,
    projectTitle,
    dept: department,
    department,
    milestone,
    currentMilestone: milestone,
    progress: completed ? 100 : group.progress,
    statusLabel: statusMeta.label,
    statusClass: statusMeta.className,
    completedAt: completed ? group.completedAt ?? group.updated_at : group.completedAt
  };
}

function isAttentionStatus(status: AdviserGroupLifecycleStatus) {
  return status === 'pending' || status === 'needs-revision' || status === 'at-risk';
}

function normalizeStudentRosterName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getGroupStudentKeys(group: GroupRosterRecord) {
  if (!Array.isArray(group.students)) {
    return [];
  }

  return group.students
    .filter((student): student is string => typeof student === 'string')
    .map(normalizeStudentRosterName)
    .filter(Boolean);
}

function mergeStudentKeys(currentKeys: string[], students: string[]) {
  const nextKeys = new Set(currentKeys);

  students.forEach((student) => {
    const key = normalizeStudentRosterName(student);
    if (key) {
      nextKeys.add(key);
    }
  });

  return Array.from(nextKeys);
}

function formatCompletedDate(value: string | null | undefined) {
  if (!value) {
    return 'Pending archive';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
  tone = 'neutral'
}: {
  icon: string;
  label: string;
  value: string | number;
  helper: string;
  tone?: 'neutral' | 'warning' | 'success';
}) {
  const toneStyles =
    tone === 'warning'
      ? { background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning)' }
      : tone === 'success'
        ? { background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)' }
        : { background: 'rgba(0, 58, 143, 0.08)', color: 'var(--primary)' };

  return (
    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg shadow-sm" style={toneStyles}>
          <i className={`fas ${icon}`}></i>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  actions
}: {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

function ViewToggle({
  viewMode,
  onChange
}: {
  viewMode: GroupViewMode;
  onChange: (mode: GroupViewMode) => void;
}) {
  const options: Array<{ mode: GroupViewMode; icon: string; label: string }> = [
    { mode: 'table', icon: 'fa-table', label: 'Table View' },
    { mode: 'card', icon: 'fa-grip', label: 'Card View' }
  ];

  return (
    <div className="inline-flex min-h-[46px] items-center rounded-2xl border border-slate-200 bg-slate-100 p-1 shadow-sm">
      {options.map((option) => {
        const active = viewMode === option.mode;
        return (
          <button
            key={option.mode}
            type="button"
            onClick={() => onChange(option.mode)}
            className={`inline-flex min-h-[38px] items-center gap-2 rounded-[0.9rem] px-4 text-sm font-semibold transition ${
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className={`fas ${option.icon}`}></i>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center px-6 py-12 text-center">
      <div>
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(0, 58, 143, 0.08)', color: 'var(--primary)' }}
        >
          <i className="fas fa-users text-xl"></i>
        </div>
        <p className="text-base font-semibold text-slate-700">{message}</p>
      </div>
    </div>
  );
}

function GroupLifecycleTabs({
  activeTab,
  activeCount,
  completedCount,
  onChange
}: {
  activeTab: GroupLifecycleTab;
  activeCount: number;
  completedCount: number;
  onChange: (tab: GroupLifecycleTab) => void;
}) {
  const tabs: Array<{ id: GroupLifecycleTab; label: string; count: number; icon: string }> = [
    { id: 'active', label: 'Active Groups', count: activeCount, icon: 'fa-users' },
    { id: 'completed', label: 'Completed Groups', count: completedCount, icon: 'fa-box-archive' }
  ];

  return (
    <div className="px-6 pt-5">
      <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1 shadow-sm">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-[0.9rem] px-4 text-sm font-semibold transition ${
                active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className={`fas ${tab.icon} text-xs`}></i>
              <span>{tab.label}</span>
              <span className="inline-flex min-w-[1.75rem] items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GroupTable({
  groups,
  onOpenDetails,
  onOpenAddStudent
}: {
  groups: LifecycleGroup[];
  onOpenDetails: (groupId: string) => void;
  onOpenAddStudent: (groupId: string) => void;
}) {
  if (!groups.length) return <EmptyState message="No groups match the current filters." />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <th className="px-6 py-4">Group</th>
            <th className="px-6 py-4">Project</th>
            <th className="px-6 py-4">Members</th>
            <th className="px-6 py-4">Milestone</th>
            <th className="px-6 py-4">Progress</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.id} className="transition hover:bg-slate-50/80">
              <td className="border-t border-slate-100 px-6 py-5 align-top">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{group.code}</p>
                  <span className="dept-badge">{group.dept}</span>
                </div>
              </td>
              <td className="border-t border-slate-100 px-6 py-5 align-top">
                <p className="font-semibold text-slate-900">{group.title}</p>
                <p className="mt-1 text-sm text-slate-500">Updated milestone monitoring for this group.</p>
              </td>
              <td className="border-t border-slate-100 px-6 py-5 align-top">
                <p className="text-sm font-semibold text-slate-900">{group.members} students</p>
                <p className="mt-1 max-w-xs text-sm text-slate-500">{group.students.join(', ')}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Leader: <span className="tracking-normal text-slate-600">{group.leader ?? 'Not assigned'}</span>
                </p>
              </td>
              <td className="border-t border-slate-100 px-6 py-5 align-top text-sm text-slate-600">{group.milestone}</td>
              <td className="border-t border-slate-100 px-6 py-5 align-top">
                <div className="space-y-2">
                  <div className="progress-container">
                    <div className="progress-fill" style={{ width: `${group.progress}%` }}></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">{group.progress}% complete</span>
                </div>
              </td>
              <td className="border-t border-slate-100 px-6 py-5 align-top">
                <span className={`status-badge ${group.statusClass}`}>{group.statusLabel}</span>
              </td>
              <td className="border-t border-slate-100 px-6 py-5 align-top">
                <div className="flex justify-end">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenAddStudent(group.id)}
                      className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-[rgba(0,58,143,0.16)] bg-[rgba(0,58,143,0.06)] px-3 text-sm font-semibold text-[var(--primary)] shadow-sm transition hover:-translate-y-0.5 hover:border-[rgba(0,58,143,0.24)] hover:bg-[rgba(0,58,143,0.1)]"
                    >
                      <i className="fas fa-user-plus text-xs"></i>
                      Add Student
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenDetails(group.id)}
                      className="inline-flex min-h-[38px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,58,143,0.2)] transition hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
                    >
                      <i className="fas fa-eye text-xs"></i>
                      Details
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupCards({
  groups,
  onOpenDetails,
  onOpenAddStudent
}: {
  groups: LifecycleGroup[];
  onOpenDetails: (groupId: string) => void;
  onOpenAddStudent: (groupId: string) => void;
}) {
  if (!groups.length) return <EmptyState message="No groups match the current filters." />;

  return (
    <div className="grid gap-4 p-6 md:grid-cols-2 2xl:grid-cols-3">
      {groups.map((group) => {
        const tone = GROUP_TONE_BY_STATUS[group.status] ?? GROUP_TONE_BY_STATUS.pending;
        return (
          <article
            key={group.id}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            style={{ borderLeftWidth: '4px', borderLeftColor: tone.borderColor }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">{group.code}</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{group.title}</h3>
              </div>
              <span className={`status-badge ${group.statusClass}`}>{group.statusLabel}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="dept-badge">{group.dept}</span>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-slate-600"
                style={{ background: tone.surfaceColor }}
              >
                {group.members} members
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Current Milestone</p>
                <p className="mt-2 text-sm text-slate-700">{group.milestone}</p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-500">Progress</span>
                  <span className="font-semibold text-slate-700">{group.progress}%</span>
                </div>
                <div className="progress-container">
                  <div className="progress-fill" style={{ width: `${group.progress}%` }}></div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Students</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{group.students.join(', ')}</p>
                <p className="mt-2 text-sm font-medium text-slate-500">Leader: {group.leader ?? 'Not assigned'}</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => onOpenAddStudent(group.id)}
                className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(0,58,143,0.16)] bg-[rgba(0,58,143,0.06)] px-4 text-sm font-semibold text-[var(--primary)] shadow-sm transition hover:-translate-y-0.5 hover:border-[rgba(0,58,143,0.24)] hover:bg-[rgba(0,58,143,0.1)]"
              >
                <i className="fas fa-user-plus text-xs"></i>
                Add Student
              </button>
              <button
                type="button"
                onClick={() => onOpenDetails(group.id)}
                className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,58,143,0.2)] transition hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
              >
                <i className="fas fa-eye text-xs"></i>
                View Details
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CompletedGroupTable({
  groups,
  onOpenDetails
}: {
  groups: LifecycleGroup[];
  onOpenDetails: (groupId: string) => void;
}) {
  if (!groups.length) {
    return <EmptyState message="No completed groups are archived yet." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <th className="px-6 py-4">Group</th>
            <th className="px-6 py-4">Project</th>
            <th className="px-6 py-4">Final Defense</th>
            <th className="px-6 py-4">Completed</th>
            <th className="px-6 py-4">Record</th>
            <th className="px-6 py-4 text-right text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.id} className="transition hover:bg-slate-50/80">
              <td className="border-t border-slate-100 px-6 py-5 align-top">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{group.code}</p>
                  <span className="dept-badge">{group.dept}</span>
                </div>
              </td>
              <td className="border-t border-slate-100 px-6 py-5 align-top">
                <p className="font-semibold text-slate-900">{group.title}</p>
                <p className="mt-1 text-sm text-slate-500">Final recommendation archived for adviser reference.</p>
              </td>
              <td className="border-t border-slate-100 px-6 py-5 align-top">
                <div className="space-y-2">
                  <span className={`status-badge ${group.statusClass}`}>{group.statusLabel}</span>
                  <p className="text-sm font-medium text-slate-700">{group.finalDefenseResult}</p>
                </div>
              </td>
              <td className="border-t border-slate-100 px-6 py-5 align-top text-sm text-slate-600">
                {formatCompletedDate(group.completedAt)}
              </td>
              <td className="border-t border-slate-100 px-6 py-5 align-top">
                <p className="text-sm font-semibold text-slate-900">
                  {group.finalScore !== null ? `${group.finalScore}% final score` : 'Record on file'}
                </p>
                <p className="mt-1 max-w-xs text-sm text-slate-500">
                  {group.finalRecommendation ?? 'Final recommendation archived for future reference.'}
                </p>
              </td>
              <td className="border-t border-slate-100 px-6 py-5 align-top">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenDetails(group.id)}
                    className="inline-flex min-h-[38px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,58,143,0.2)] transition hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
                  >
                    <i className="fas fa-folder-open text-xs"></i>
                    View Record
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompletedGroupCards({
  groups,
  onOpenDetails
}: {
  groups: LifecycleGroup[];
  onOpenDetails: (groupId: string) => void;
}) {
  if (!groups.length) {
    return <EmptyState message="No completed groups are archived yet." />;
  }

  return (
    <div className="grid gap-4 p-6 md:grid-cols-2 2xl:grid-cols-3">
      {groups.map((group) => {
        const tone = GROUP_TONE_BY_STATUS.completed;
        return (
          <article
            key={group.id}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            style={{ borderLeftWidth: '4px', borderLeftColor: tone.borderColor }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">{group.code}</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{group.title}</h3>
              </div>
              <span className={`status-badge ${group.statusClass}`}>{group.statusLabel}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="dept-badge">{group.dept}</span>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-slate-600"
                style={{ background: tone.surfaceColor }}
              >
                {formatCompletedDate(group.completedAt)}
              </span>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Final Defense</p>
                <p className="mt-2 font-semibold text-slate-900">{group.finalDefenseResult}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Final Record</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {group.finalScore !== null ? `${group.finalScore}% final score` : 'Recommendation on file'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {group.finalRecommendation ?? 'Completed archive ready for adviser reference.'}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => onOpenDetails(group.id)}
                className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,58,143,0.2)] transition hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
              >
                <i className="fas fa-folder-open text-xs"></i>
                View Record
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function GroupDetailsModal({
  group,
  open,
  onClose,
  onAssignLeader,
  onOpenAddStudent,
  onRemoveStudent,
  onApproveTitle
}: {
  group: LifecycleGroup | null;
  open: boolean;
  onClose: () => void;
  onAssignLeader: (groupId: string, leader: string) => void;
  onOpenAddStudent: (groupId: string) => void;
  onRemoveStudent?: (groupId: string, student: string) => void;
  onApproveTitle?: (groupId: string, projectTitle: string) => void;
}) {
  if (!open || !group || typeof document === 'undefined') return null;

  const completed = group.status === 'completed';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:p-6"
      aria-hidden="false"
      aria-modal="true"
      role="dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-content !max-w-3xl flex max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="modal-header !items-start">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="dept-badge">{group.dept}</span>
              <span className={`status-badge ${group.statusClass}`}>{group.statusLabel}</span>
            </div>
            <div>
              <h3>{group.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{group.code}</p>
            </div>
          </div>
          <button type="button" className="close-modal" onClick={onClose}>
            &times;
          </button>
        </div>

        {group.title === 'Pending Title Approval' && onApproveTitle && (
          <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex gap-4 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900">Title Submitted for Approval</h4>
                <p className="mt-1 text-sm text-amber-800">
                  The students have proposed the following project title: <br/>
                  <strong className="text-amber-900">"{group.projectTitle}"</strong>
                </p>
                <div className="mt-3 flex gap-2">
                  <button 
                    onClick={() => onApproveTitle(group.id, group.projectTitle)}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
                  >
                    Approve Title
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="modal-body space-y-6">
          {completed ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[var(--border)] bg-white/40 p-4 shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Members</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{group.members}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white/40 p-4 shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Final Score</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {group.finalScore !== null ? `${group.finalScore}%` : 'N/A'}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white/40 p-4 shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Completed Date</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{formatCompletedDate(group.completedAt)}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white/40 p-4 shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Final Defense</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{group.finalDefenseResult}</p>
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Completion Record</p>
                    <p className="mt-1 text-sm text-slate-500">This group already met the final completion requirements and now lives in the archive.</p>
                  </div>
                  <span className={`status-badge ${group.statusClass}`}>{group.statusLabel}</span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Defense Result</p>
                    <p className="mt-2 font-semibold text-slate-900">{group.finalDefenseResult}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Final Manuscript</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {group.finalManuscriptApproved ? 'Approved' : 'Pending'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Required Milestones</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {group.allRequiredMilestonesCompleted ? 'Completed' : 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Final Recommendation</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {group.finalRecommendation ?? 'No final recommendation was attached to this archive record.'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[var(--border)] bg-white/40 p-4 shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Members</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{group.members}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white/40 p-4 shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Progress</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{group.progress}%</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white/40 p-4 shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Milestone</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{group.milestone}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white/40 p-4 shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Leader</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{group.leader ?? 'Not assigned'}</p>
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/40 p-5 shadow-sm backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Progress Track</p>
                    <p className="mt-1 text-sm text-slate-500">Use this view to monitor readiness before review cycles.</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{group.progress}% complete</span>
                </div>
                <div className="progress-container">
                  <div className="progress-fill" style={{ width: `${group.progress}%` }}></div>
                </div>
              </div>
            </>
          )}

          <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/40 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Student Roster</p>
                <p className="mt-1 text-sm text-slate-500">
                  {completed ? 'Archive view is read-only for completed groups.' : 'Assign the lead student and manage the roster from here.'}
                </p>
              </div>
              {completed ? (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Read-only archive
                </span>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 grid-cols-1">
              {group.students.map((student) => (
                <div key={student} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100/80">
                  <span className="truncate flex-1" title={student}>{student}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    {group.leader === student ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700 ring-1 ring-amber-200/50">
                        Leader
                      </span>
                    ) : completed ? null : (
                      <>
                        <button
                          type="button"
                          onClick={() => onAssignLeader(group.id, student)}
                          className="inline-flex min-h-[32px] items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 hover:text-amber-800"
                        >
                          <i className="fas fa-crown text-[10px]"></i>
                          Set as Leader
                        </button>
                        {onRemoveStudent ? (
                          <button
                            type="button"
                            onClick={() => onRemoveStudent(group.id, student)}
                            className="inline-flex min-h-[32px] w-8 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700"
                            title="Remove student from group"
                          >
                            <i className="fas fa-user-minus text-xs"></i>
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          {completed ? null : (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onOpenAddStudent(group.id)}
              >
                <i className="fas fa-user-plus"></i>
                Add Student
              </button>
              <Link className="btn btn-primary" href="/adviser/adviser-mode/submissions">
                Review Submissions
              </Link>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function AddStudentToGroupModal({
  open,
  group,
  availableStudents,
  onClose,
  onAddStudent
}: {
  open: boolean;
  group: LifecycleGroup | null;
  availableStudents: string[];
  onClose: () => void;
  onAddStudent: (groupId: string, student: string) => void;
}) {
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (!open) {
      setStudentSearch('');
    }
  }, [open]);

  if (!open || !group || typeof document === 'undefined') return null;

  const groupStudentKeys = new Set(group.students.map(normalizeStudentRosterName));
  const searchQuery = studentSearch.trim().toLowerCase();
  const filteredStudents = availableStudents.filter(
    (student) =>
      !groupStudentKeys.has(normalizeStudentRosterName(student)) &&
      student.toLowerCase().includes(searchQuery)
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:p-6"
      aria-hidden="false"
      aria-modal="true"
      role="dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-content !max-w-2xl">
        <div className="modal-header !items-start">
          <div>
            <h3>Add Student</h3>
            <p className="mt-1 text-sm text-slate-500">Add a student who needs to catch up or join this group.</p>
          </div>
          <button type="button" className="close-modal" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body space-y-5">
          <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Target Group</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{group.title}</p>
            <p className="mt-1 text-sm text-slate-500">{group.code}</p>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <label htmlFor="existing-group-student-search" className="block text-sm font-semibold text-slate-900">
                  Available Students
                </label>
                <p className="mt-1 text-sm text-slate-500">Search the roster and add a student to the selected group.</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {group.members} current members
              </span>
            </div>

            <div className="relative mt-4">
              <i className="fas fa-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
              <input
                id="existing-group-student-search"
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                className="min-h-[46px] w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {group.students.map((student) => (
                <span
                  key={student}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  {student}
                  {group.leader === student ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                      Leader
                    </span>
                  ) : null}
                </span>
              ))}
            </div>

            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              {filteredStudents.length ? (
                filteredStudents.map((student) => (
                  <div key={student} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{student}</span>
                    <button
                      type="button"
                      onClick={() => onAddStudent(group.id, student)}
                      className="inline-flex min-h-[34px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <i className="fas fa-user-plus text-xs"></i>
                      Add to Group
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center text-sm text-slate-500">
                  No students found for the current search.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateGroupModal({
  open,
  department,
  availableStudents,
  draft,
  onDraftChange,
  onClose,
  onSubmit
}: {
  open: boolean;
  department: string;
  availableStudents: string[];
  draft: GroupDraft;
  onDraftChange: (draft: GroupDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [studentSearch, setStudentSearch] = useState('');
  const groupCodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setStudentSearch('');
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => {
      groupCodeInputRef.current?.focus();
    }, 40);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const draftStudentKeys = new Set(draft.students.map(normalizeStudentRosterName));
  const searchQuery = studentSearch.trim().toLowerCase();
  const filteredStudents = availableStudents.filter(
    (student) =>
      !draftStudentKeys.has(normalizeStudentRosterName(student)) &&
      student.toLowerCase().includes(searchQuery)
  );

  const addStudentToDraft = (student: string) => {
    onDraftChange({
      ...draft,
      students: [...draft.students, student],
      leader: draft.leader || student
    });
  };

  const removeStudentFromDraft = (student: string) => {
    const nextStudents = draft.students.filter((entry) => entry !== student);
    onDraftChange({
      ...draft,
      students: nextStudents,
      leader: draft.leader === student ? (nextStudents[0] ?? '') : draft.leader
    });
  };

  const assignLeader = (student: string) => {
    onDraftChange({ ...draft, leader: student });
  };

  const isReadyToCreate = draft.code.trim().length > 0 && draft.students.length > 0 && Boolean(draft.leader);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:p-6"
      aria-hidden="false"
      aria-modal="true"
      role="dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-content !max-w-[1000px] flex max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-white/20 shadow-[0_32px_120px_rgba(0,0,0,0.3)] bg-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Premium Header */}
        <div className="relative flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-8 py-6">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--student-primary,#0f4c81)] to-sky-400" />
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[var(--student-primary,#0f4c81)] shadow-inner ring-1 ring-inset ring-sky-100/50">
              <i className="fas fa-users-medical text-2xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold tracking-tight text-slate-900">Create New Group</h3>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 ring-1 ring-inset ring-slate-200">
                  {department}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-slate-500 font-medium">Configure group identity and assign student members to start tracking progress.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-95">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            
            {/* Left Column: Config & Search */}
            <div className="flex flex-col space-y-8">
              
              {/* Group Code */}
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <label htmlFor="group-code" className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Group Code</span>
                  <span className="text-[10px] font-medium text-slate-400">Required</span>
                </label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-[var(--student-primary,#0f4c81)] transition-colors">
                    <i className="fas fa-hashtag"></i>
                  </div>
                  <input
                    id="group-code"
                    ref={groupCodeInputRef}
                    type="text"
                    placeholder={`e.g. ${department.replace(/ Office| Department/i, '').trim().toUpperCase()}-2024-05`}
                    value={draft.code}
                    onChange={(event) => onDraftChange({ ...draft, code: event.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400 focus:border-[var(--student-primary,#0f4c81)] focus:bg-white focus:ring-4 focus:ring-[var(--student-primary,#0f4c81)]/10"
                  />
                </div>
              </div>

              {/* Available Students */}
              <div className="flex flex-col flex-1 rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden flex-shrink-0 min-h-[360px]">
                <div className="border-b border-slate-100 p-5 bg-slate-50/30">
                  <label className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Available Roster</span>
                    <span className="text-[10px] font-medium text-slate-400">{filteredStudents.length} Students</span>
                  </label>
                  <div className="relative group">
                    <i className="fas fa-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--student-primary,#0f4c81)] transition-colors text-sm"></i>
                    <input
                      type="text"
                      placeholder="Search students by name..."
                      value={studentSearch}
                      onChange={(event) => setStudentSearch(event.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-[var(--student-primary,#0f4c81)] focus:bg-white focus:ring-4 focus:ring-[var(--student-primary,#0f4c81)]/10"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50">
                  {filteredStudents.length > 0 ? (
                    <div className="space-y-2">
                      {filteredStudents.map((student) => {
                        const initials = student.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                        return (
                          <div key={student} className="group flex items-center justify-between rounded-xl p-2.5 bg-white border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-[11px] font-bold text-[var(--student-primary,#0f4c81)] ring-1 ring-inset ring-sky-100/50 transition-colors group-hover:bg-[var(--student-primary,#0f4c81)] group-hover:text-white">
                                {initials}
                              </div>
                              <span className="truncate text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{student}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => addStudentToDraft(student)}
                              className="shrink-0 rounded-lg bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-[var(--student-primary,#0f4c81)] hover:text-white hover:ring-[var(--student-primary,#0f4c81)] opacity-0 sm:opacity-100 md:opacity-0 group-hover:opacity-100"
                            >
                              Add
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-white m-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-4">
                        <i className="fas fa-user-slash text-xl"></i>
                      </div>
                      <p className="text-sm font-bold text-slate-700">No students found</p>
                      <p className="mt-1.5 text-xs text-slate-500 max-w-[200px] leading-relaxed">Check your spelling or confirm if all matching students are already in the group.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Selected Roster */}
            <div className="flex flex-col h-full rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden min-h-[460px]">
              <div className="border-b border-slate-100 p-5 bg-gradient-to-b from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">Selected Team</h4>
                    <p className="text-sm font-bold text-slate-900">Review & Assign Leader</p>
                  </div>
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--student-primary,#0f4c81)] text-white shadow-sm font-bold text-sm">
                    {draft.students.length}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
                {draft.students.length > 0 ? (
                  <div className="space-y-3">
                    {draft.students.map((student) => {
                      const isLeader = draft.leader === student;
                      const initials = student.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                      return (
                        <div
                          key={student}
                          className={`group flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all duration-300 ${
                            isLeader 
                              ? 'border-[var(--student-primary,#0f4c81)]/30 bg-[var(--student-primary,#0f4c81)]/5 shadow-md shadow-[var(--student-primary,#0f4c81)]/10 ring-1 ring-[var(--student-primary,#0f4c81)]/20' 
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-colors ${
                              isLeader ? 'bg-gradient-to-br from-[var(--student-primary,#0f4c81)] to-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className={`truncate text-sm font-bold ${isLeader ? 'text-slate-900' : 'text-slate-700'}`}>{student}</p>
                              {isLeader ? (
                                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--student-primary,#0f4c81)] flex items-center gap-1.5">
                                  <i className="fas fa-crown text-amber-500"></i> Group Leader
                                </p>
                              ) : (
                                <p className="mt-0.5 text-xs text-slate-400 font-medium">Group Member</p>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {!isLeader && (
                              <button
                                type="button"
                                onClick={() => assignLeader(student)}
                                className="flex h-8 items-center rounded-lg px-3 text-xs font-bold text-slate-500 bg-slate-50 ring-1 ring-inset ring-slate-200 hover:bg-[var(--student-primary,#0f4c81)] hover:text-white hover:ring-[var(--student-primary,#0f4c81)] transition-all opacity-0 sm:opacity-100 md:opacity-0 group-hover:opacity-100"
                              >
                                Make Leader
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeStudentFromDraft(student)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 bg-white ring-1 ring-inset ring-slate-200 hover:bg-red-500 hover:text-white hover:ring-red-500 transition-all shadow-sm"
                              title="Remove"
                            >
                              <i className="fas fa-trash-alt text-[11px]"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-white m-1 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-sky-50 rounded-full blur-3xl opacity-50"></div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300 shadow-sm border border-slate-100 mb-5 relative z-10">
                      <i className="fas fa-user-plus text-2xl"></i>
                    </div>
                    <p className="text-base font-bold text-slate-800 relative z-10">Your roster is empty</p>
                    <p className="mt-2 text-sm text-slate-500 max-w-[220px] leading-relaxed relative z-10">Select students from the available roster to start building this group.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Premium Footer */}
        <div className="flex items-center justify-between border-t border-slate-200/60 bg-white px-8 py-5">
          <div className="flex items-center">
            {isReadyToCreate ? (
              <div className="flex items-center gap-3 rounded-full bg-emerald-50 px-4 py-2 ring-1 ring-inset ring-emerald-200 animate-in slide-in-from-left-4 fade-in">
                <i className="fas fa-check-circle text-emerald-500 text-lg"></i>
                <span className="text-sm font-bold text-emerald-700">Ready to create group</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-full bg-amber-50 px-4 py-2 ring-1 ring-inset ring-amber-200">
                <i className="fas fa-circle-exclamation text-amber-500 text-lg"></i>
                <span className="text-sm font-bold text-amber-700">
                  {!draft.code.trim() ? "Missing group code" : draft.students.length === 0 ? "Add at least one member" : "Leader not assigned"}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!isReadyToCreate}
              className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 ${
                isReadyToCreate 
                  ? 'bg-gradient-to-r from-[var(--student-primary,#0f4c81)] to-sky-600 hover:shadow-xl hover:scale-105 active:scale-95' 
                  : 'bg-slate-300 shadow-none cursor-not-allowed'
              }`}
            >
              <i className="fas fa-folder-plus"></i>
              Create Group
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AdviserGroups({ data }: { data: AdviserDashboardData }) {
  const adviserDepartment = data.profile.department?.replace(' Department', '') || 'IT';
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const initialAdviserGroups = useMemo(
    () => data.groups.filter((group) => group.user_id === data.profile.user_id),
    [data.groups, data.profile.user_id]
  );
  const [groups, setGroups] = useState<ManagedAdviserGroup[]>(() => initialAdviserGroups);
  
  const [activeTab, setActiveTab] = useState<GroupLifecycleTab>('active');
  const [viewMode, setViewMode] = useState<GroupViewMode>('table');
  const [statusFilter, setStatusFilter] = useState<GroupFilterStatus>('all');
  const [search, setSearch] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [studentGroupId, setStudentGroupId] = useState<string | null>(null);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [groupDraft, setGroupDraft] = useState<GroupDraft>(createEmptyGroupDraft());
  const [availableDbStudents, setAvailableDbStudents] = useState<string[]>([]);
  const [assignedStudentKeys, setAssignedStudentKeys] = useState<string[]>([]);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const [studentsResponse, groupsResponse, myGroupsResponse] = await Promise.all([
          fetch(`/api/students?department=${encodeURIComponent(adviserDepartment)}&limit=200&availableOnly=true`),
          fetch(`/api/groups?department=${encodeURIComponent(adviserDepartment)}&fields=students&limit=200`),
          fetch(`/api/groups?userId=${encodeURIComponent(data.profile.user_id)}`)
        ]);

        if (studentsResponse.ok) {
          const students: StudentRosterRecord[] = await studentsResponse.json();
          setAvailableDbStudents(
            students
              .map((student) => student.name?.trim())
              .filter((student): student is string => Boolean(student))
          );
        }

        if (groupsResponse.ok) {
          const departmentGroups: GroupRosterRecord[] = await groupsResponse.json();
          setAssignedStudentKeys(Array.from(new Set(departmentGroups.flatMap(getGroupStudentKeys))));
        } else {
          setAssignedStudentKeys([]);
        }

        if (myGroupsResponse.ok) {
          const myDbGroups = await myGroupsResponse.json();
          // Map DB groups to ManagedAdviserGroup structure
          const mappedGroups = myDbGroups.map((g: any) => ({
            ...g,
            id: g.id,
            user_id: g.userId,
            project_id: g.projectId,
            status: g.status,
            created_at: g.createdAt,
            updated_at: g.updatedAt,
            milestone: g.milestone || 1,
            currentMilestone: g.currentMilestone || 1,
            leader: g.leader || null
          }));
          setGroups(mappedGroups);
        }
      } catch (e) {
        console.error('Failed to fetch students', e);
        setAssignedStudentKeys([]);
      }
    }
    // Always fetch on mount, and re-fetch if modals are opened
    fetchStudents();
  }, [addStudentModalOpen, createGroupModalOpen, adviserDepartment, data.profile.user_id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDetailsOpen(false);
        setAddStudentModalOpen(false);
        setCreateGroupModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const meta = WORKSPACE_META[workspaceMode];
  const lifecycleGroups = useMemo(() => groups.map(getLifecycleGroup), [groups]);
  const activeGroups = useMemo(
    () => lifecycleGroups.filter((group) => group.status !== 'completed'),
    [lifecycleGroups]
  );
  const completedGroups = useMemo(
    () => lifecycleGroups.filter((group) => group.status === 'completed'),
    [lifecycleGroups]
  );
  const tabGroups = activeTab === 'active' ? activeGroups : completedGroups;

  const filteredGroups = useMemo(() => {
    let result = tabGroups;

    if (activeTab === 'active' && statusFilter !== 'all') {
      result =
        statusFilter === 'attention'
          ? result.filter((group) => isAttentionStatus(group.status))
          : result.filter((group) => group.status === statusFilter);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (group) =>
          group.code.toLowerCase().includes(query) ||
          group.title.toLowerCase().includes(query) ||
          group.students.some((student) => student.toLowerCase().includes(query))
      );
    }

    return result;
  }, [activeTab, search, statusFilter, tabGroups]);

  const selectedGroup = useMemo(
    () => lifecycleGroups.find((group) => group.id === selectedGroupId) ?? null,
    [lifecycleGroups, selectedGroupId]
  );
  const studentTargetGroup = useMemo(
    () => activeGroups.find((group) => group.id === studentGroupId) ?? null,
    [activeGroups, studentGroupId]
  );
  const localAssignedStudentKeys = useMemo(
    () => Array.from(new Set(groups.flatMap(getGroupStudentKeys))),
    [groups]
  );
  const assignedStudentKeySet = useMemo(
    () => new Set([...assignedStudentKeys, ...localAssignedStudentKeys]),
    [assignedStudentKeys, localAssignedStudentKeys]
  );
  const availableStudents = useMemo(
    () => {
      return availableDbStudents
        .filter((student) => !assignedStudentKeySet.has(normalizeStudentRosterName(student)))
        .sort((left, right) => left.localeCompare(right));
    },
    [assignedStudentKeySet, availableDbStudents]
  );
  const totalStudents = lifecycleGroups.reduce((sum, group) => sum + group.members, 0);
  const needsAttention = activeGroups.filter((group) => isAttentionStatus(group.status)).length;
  const averageProgress = Math.round(
    activeGroups.reduce((sum, group) => sum + group.progress, 0) / Math.max(1, activeGroups.length)
  );

  const openDetails = (groupId: string) => {
    setSelectedGroupId(groupId);
    setDetailsOpen(true);
  };

  const openAddStudentModal = (groupId: string) => {
    if (!activeGroups.some((group) => group.id === groupId)) {
      return;
    }

    setStudentGroupId(groupId);
    setAddStudentModalOpen(true);
  };

  const openCreateGroupModal = () => {
    setGroupDraft(createEmptyGroupDraft());
    setCreateGroupModalOpen(true);
  };

  const assignLeaderToGroup = (groupId: string, leader: string) => {
    setGroups((currentGroups) =>
      currentGroups.map((group) => (group.id === groupId ? { ...group, leader } : group))
    );
  };

  const handleAddStudentToGroup = async (groupId: string, student: string) => {
    const targetGroup = groups.find((group) => group.id === groupId);
    if (!targetGroup || targetGroup.students.includes(student) || getComputedGroupStatus(targetGroup) === 'completed') {
      return;
    }

    if (assignedStudentKeySet.has(normalizeStudentRosterName(student))) {
      alert('This student already belongs to a group.');
      return;
    }

    const nextStudents = [...targetGroup.students, student];

    try {
      const response = await fetch('/api/groups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: groupId, students: nextStudents })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        alert(error?.error || 'Failed to add student to group.');
        return;
      }

      const updatedGroup = await response.json();
      const updatedStudents = Array.isArray(updatedGroup.students) ? updatedGroup.students : nextStudents;

      setGroups((currentGroups) =>
        currentGroups.map((group) => {
          if (group.id !== groupId) {
            return group;
          }

          return {
            ...group,
            students: updatedStudents,
            members: updatedGroup.members ?? updatedStudents.length
          };
        })
      );
      setAssignedStudentKeys((currentKeys) => mergeStudentKeys(currentKeys, updatedStudents));
      setAddStudentModalOpen(false);
    } catch (e) {
      console.error('Failed to update group students on server', e);
      alert('An error occurred while adding the student.');
    }
  };

  const handleRemoveStudentFromGroup = async (groupId: string, student: string) => {
    const targetGroup = groups.find((group) => group.id === groupId);
    if (!targetGroup || !targetGroup.students.includes(student) || getComputedGroupStatus(targetGroup) === 'completed') {
      return;
    }

    if (!confirm(`Are you sure you want to remove ${student} from this group?`)) {
      return;
    }

    const nextStudents = targetGroup.students.filter((s) => s !== student);
    let nextLeader = targetGroup.leader;
    if (nextLeader === student) {
      nextLeader = nextStudents[0] || '';
    }

    try {
      const response = await fetch('/api/groups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: groupId, students: nextStudents, leader: nextLeader })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        alert(error?.error || 'Failed to remove student from group.');
        return;
      }

      setGroups((currentGroups) =>
        currentGroups.map((group) => {
          if (group.id !== groupId) {
            return group;
          }
          return {
            ...group,
            students: nextStudents,
            leader: nextLeader,
            members: nextStudents.length
          };
        })
      );
      
      const removedKey = normalizeStudentRosterName(student);
      setAssignedStudentKeys((currentKeys) => currentKeys.filter(k => k !== removedKey));
    } catch (e) {
      console.error('Failed to remove group student on server', e);
      alert('An error occurred while removing the student.');
    }
  };

  const handleApproveTitle = async (groupId: string, newTitle: string) => {
    setGroups(groups => groups.map(g => g.id === groupId ? { ...g, title: newTitle } : g));
    try {
      await fetch('/api/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: groupId, title: newTitle })
      });
    } catch (e) {
      console.error('Failed to approve title', e);
    }
  };

  const handleCreateGroup = async () => {
    const code = groupDraft.code.trim();
    if (!code || groupDraft.students.length === 0 || !groupDraft.leader) return;

    const students = groupDraft.students;
    const assignedStudents = students.filter((student) => assignedStudentKeySet.has(normalizeStudentRosterName(student)));
    if (assignedStudents.length > 0) {
      alert('One or more selected students already belong to a group.');
      return;
    }

    const statusMeta = GROUP_STATUS_META[DEFAULT_NEW_GROUP_STATUS];
    const title = "Pending Student Submission";

    const payload = {
      userId: data.profile.user_id,
      code,
      title,
      projectTitle: title,
      dept: adviserDepartment,
      department: adviserDepartment,
      students,
      leader: groupDraft.leader,
      statusLabel: statusMeta.label,
      statusClass: statusMeta.className,
      projectId: `project-${Date.now()}`
    };

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const newDbGroup = await response.json();
        
        const nextGroup: ManagedAdviserGroup = {
          ...newDbGroup,
          id: newDbGroup.id,
          user_id: newDbGroup.userId,
          project_id: newDbGroup.projectId,
          status: newDbGroup.status,
          created_at: newDbGroup.createdAt,
          updated_at: newDbGroup.updatedAt,
          milestone: newDbGroup.milestone,
          currentMilestone: newDbGroup.currentMilestone,
          finalDefenseResult: newDbGroup.finalDefenseResult,
          finalManuscriptApproved: newDbGroup.finalManuscriptApproved,
          allRequiredMilestonesCompleted: newDbGroup.allRequiredMilestonesCompleted,
          completedAt: newDbGroup.completedAt,
          finalScore: newDbGroup.finalScore,
          finalRecommendation: newDbGroup.finalRecommendation,
          leader: newDbGroup.leader ?? null
        };

        setGroups((currentGroups) => [nextGroup, ...currentGroups]);
        setAssignedStudentKeys((currentKeys) => mergeStudentKeys(currentKeys, students));
        setSelectedGroupId(nextGroup.id);
        setGroupDraft(createEmptyGroupDraft());
        setCreateGroupModalOpen(false);
      } else {
        const error = await response.json().catch(() => null);
        alert(error?.error || 'Failed to create group. Please check if the group code is unique.');
      }
    } catch (e) {
      console.error('Error creating group:', e);
      alert('An error occurred while creating the group.');
    }
  };

  return (
    <>
      <AdviserPageHeader
        title="My Groups"
        description="Track project groups, manage members, and monitor supervision progress in one workspace."
        actions={
          <AdviserShellActions
            basePath={basePath}
            fullName={data.profile.fullName}
            notificationCount={data.profile.notificationCount}
            workspaceMode={workspaceMode}
            onSwitchWorkspace={switchWorkspace}
          />
        }
      />

        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard icon="fa-layer-group" label="Total Groups" value={lifecycleGroups.length} helper="All IT groups under adviser supervision" />
            <SummaryCard icon="fa-user-graduate" label="Students" value={totalStudents} helper="Students across active and archived groups" />
            <SummaryCard icon="fa-triangle-exclamation" label="Needs Attention" value={needsAttention} helper="Active groups pending review, revision, or recovery" tone="warning" />
            <SummaryCard icon="fa-chart-line" label="Average Progress" value={`${averageProgress}%`} helper="Average completion across active IT groups" tone="success" />
            <SummaryCard icon="fa-box-archive" label="Completed Groups" value={completedGroups.length} helper="Groups moved into the completed archive" tone="success" />
          </section>

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm">
            <SectionHeader
              eyebrow="Group Management"
              title="Supervision workspace"
              actions={
                <>
                  <ViewToggle viewMode={viewMode} onChange={setViewMode} />
                  <button
                    type="button"
                    onClick={openCreateGroupModal}
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
                  >
                    <i className="fas fa-folder-plus"></i>
                    Create Group
                  </button>
                </>
              }
            />

            <GroupLifecycleTabs
              activeTab={activeTab}
              activeCount={activeGroups.length}
              completedCount={completedGroups.length}
              onChange={(tab) => {
                setActiveTab(tab);
                setStatusFilter(tab === 'completed' ? 'completed' : 'all');
              }}
            />

            <div className="grid gap-3 px-6 py-5 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
              {activeTab === 'active' ? (
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as GroupFilterStatus)}
                  className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="all">All Statuses</option>
                  <option value="attention">Needs Attention</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="needs-revision">Needs Revision</option>
                  <option value="at-risk">At Risk</option>
                </select>
              ) : (
                <select
                  value="completed"
                  disabled
                  className="min-h-[48px] rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 shadow-sm outline-none"
                >
                  <option value="completed">Completed</option>
                </select>
              )}
              <div className="relative">
                <i className="fas fa-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
                <input
                  type="text"
                  placeholder="Search groups or titles..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter(activeTab === 'completed' ? 'completed' : 'all');
                  setSearch('');
                }}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <i className="fas fa-undo text-xs"></i>
                Clear
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm">
            <SectionHeader
              eyebrow="Directory"
              title={`${filteredGroups.length} ${filteredGroups.length === 1 ? (activeTab === 'completed' ? 'record' : 'group') : activeTab === 'completed' ? 'records' : 'groups'} in view`}
            />
            {activeTab === 'active' ? (
              viewMode === 'table' ? (
                <GroupTable groups={filteredGroups} onOpenDetails={openDetails} onOpenAddStudent={openAddStudentModal} />
              ) : (
                <GroupCards groups={filteredGroups} onOpenDetails={openDetails} onOpenAddStudent={openAddStudentModal} />
              )
            ) : (
              viewMode === 'table' ? (
                <CompletedGroupTable groups={filteredGroups} onOpenDetails={openDetails} />
              ) : (
                <CompletedGroupCards groups={filteredGroups} onOpenDetails={openDetails} />
              )
            )}
          </section>
        </div>

        <GroupDetailsModal
          group={selectedGroup}
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          onAssignLeader={assignLeaderToGroup}
          onApproveTitle={handleApproveTitle}
          onRemoveStudent={handleRemoveStudentFromGroup}
          onOpenAddStudent={(groupId) => {
            setDetailsOpen(false);
            openAddStudentModal(groupId);
          }}
        />

        <AddStudentToGroupModal
          open={addStudentModalOpen}
          group={studentTargetGroup}
          availableStudents={availableStudents}
          onClose={() => setAddStudentModalOpen(false)}
          onAddStudent={handleAddStudentToGroup}
        />

        <CreateGroupModal
          open={createGroupModalOpen}
          department={adviserDepartment}
          availableStudents={availableStudents}
          draft={groupDraft}
          onDraftChange={setGroupDraft}
          onClose={() => {
            setGroupDraft(createEmptyGroupDraft());
            setCreateGroupModalOpen(false);
          }}
          onSubmit={handleCreateGroup}
        />
    </>
  );
}
