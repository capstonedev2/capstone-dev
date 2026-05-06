'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
type ManagedAdviserGroup = AdviserGroup & { leader?: string };
type LifecycleGroup = ManagedAdviserGroup & { status: AdviserGroupLifecycleStatus };
type GroupFilterStatus = 'all' | 'attention' | AdviserGroupLifecycleStatus;
type GroupDraft = {
  code: string;
  title: string;
  students: string[];
  leader: string;
};

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
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</h2>
          <p className="text-sm text-slate-500">{helper}</p>
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
  description,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
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
        <p className="mt-1 text-sm text-slate-500">Try adjusting the filters or add a group to get started.</p>
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
  onApproveTitle
}: {
  group: LifecycleGroup | null;
  open: boolean;
  onClose: () => void;
  onAssignLeader: (groupId: string, leader: string) => void;
  onOpenAddStudent: (groupId: string) => void;
  onApproveTitle?: (groupId: string, projectTitle: string) => void;
}) {
  if (!open || !group) return null;

  const completed = group.status === 'completed';

  return (
    <div
      className="modal show"
      aria-hidden="false"
      aria-modal="true"
      role="dialog"
      style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.52)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-content !max-w-3xl">
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

        {group.title === 'Awaiting Adviser Approval' && onApproveTitle && (
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
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Members</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{group.members}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Final Score</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {group.finalScore !== null ? `${group.finalScore}%` : 'N/A'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Completed Date</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{formatCompletedDate(group.completedAt)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
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
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Members</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{group.members}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Progress</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{group.progress}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Milestone</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{group.milestone}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Leader</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{group.leader ?? 'Not assigned'}</p>
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5">
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

          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5">
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

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {group.students.map((student) => (
                <div key={student} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700">
                  <span>{student}</span>
                  <div className="flex items-center gap-2">
                    {group.leader === student ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                        Leader
                      </span>
                    ) : completed ? null : (
                      <button
                        type="button"
                        onClick={() => onAssignLeader(group.id, student)}
                        className="inline-flex min-h-[32px] items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                      >
                        <i className="fas fa-crown text-[10px]"></i>
                        Set as Leader
                      </button>
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
    </div>
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

  if (!open || !group) return null;

  const filteredStudents = availableStudents.filter(
    (student) =>
      !group.students.includes(student) &&
      student.toLowerCase().includes(studentSearch.trim().toLowerCase())
  );

  return (
    <div
      className="modal show"
      aria-hidden="false"
      aria-modal="true"
      role="dialog"
      style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.52)' }}
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
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const filteredStudents = availableStudents.filter(
    (student) =>
      !draft.students.includes(student) &&
      student.toLowerCase().includes(studentSearch.trim().toLowerCase())
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

  const readinessChecks = [
    { label: 'Group code added', done: draft.code.trim().length > 0 },
    { label: 'At least one member selected', done: draft.students.length > 0 },
    { label: 'Leader assigned', done: Boolean(draft.leader) }
  ];

  const completedChecks = readinessChecks.filter((item) => item.done).length;
  const missingChecks = readinessChecks.filter((item) => !item.done);
  const isReadyToCreate = readinessChecks.every((item) => item.done);
  const readinessPercent = Math.round((completedChecks / readinessChecks.length) * 100);
  const hasSearchQuery = studentSearch.trim().length > 0;

  if (!open) return null;

  return (
    <div
      className="modal show"
      aria-hidden="false"
      aria-modal="true"
      role="dialog"
      aria-labelledby="create-group-modal-title"
      aria-describedby="create-group-modal-description"
      style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.62)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-content !max-w-5xl flex max-h-[92vh] flex-col overflow-hidden border-0 shadow-[0_32px_120px_rgba(15,23,42,0.28)]">
        <div className="modal-header !items-start gap-4 border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(0,58,143,0.06),rgba(255,255,255,0.96))]">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg shadow-sm"
                style={{ background: 'rgba(0, 58, 143, 0.1)', color: 'var(--primary)' }}
              >
                <i className="fas fa-users-medical"></i>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Adviser Workspace</p>
                <h3 id="create-group-modal-title">Create Group</h3>
                <p id="create-group-modal-description" className="mt-1 max-w-2xl text-sm text-slate-500">
                  Set the group identity, build the roster, and assign the student leader before the new supervision record goes live.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.15rem] border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Department</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{department}</p>
                <p className="mt-1 text-xs text-slate-500">Locked to your current adviser workspace.</p>
              </div>
              <div className="rounded-[1.15rem] border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Roster</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {draft.students.length} {draft.students.length === 1 ? 'member' : 'members'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {draft.leader ? `${draft.leader} is the current leader.` : 'Select a leader after adding the roster.'}
                </p>
              </div>
              <div className="rounded-[1.15rem] border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Setup Progress</p>
                  <span className="text-sm font-semibold text-slate-900">{readinessPercent}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isReadyToCreate ? 'bg-emerald-500' : 'bg-[var(--primary)]'
                    }`}
                    style={{ width: `${readinessPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {missingChecks.length ? `${missingChecks.length} required item${missingChecks.length === 1 ? '' : 's'} left.` : 'Everything required is in place.'}
                </p>
              </div>
            </div>
          </div>

          <button type="button" className="close-modal shrink-0" onClick={onClose} aria-label="Close create group modal">
            &times;
          </button>
        </div>

        <div className="modal-body flex-1 overflow-y-auto bg-slate-50/70">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.95fr)]">
            <div className="space-y-5">
              <section className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-indigo-50/80 blur-3xl"></div>
                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
                      <span className="text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold tracking-tight text-slate-900">Group Basics</h4>
                      <p className="mt-1 text-sm text-slate-500">Establish the group identity and configuration.</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-semibold text-slate-700">{completedChecks}/3 Ready</span>
                  </div>
                </div>

                <div className="relative mt-6 grid gap-5 md:grid-cols-2">
                  <div className="flex flex-col">
                    <label htmlFor="group-code" className="mb-2 text-sm font-semibold text-slate-700">Group Code</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <i className="fas fa-hashtag"></i>
                      </div>
                      <input
                        id="group-code"
                        ref={groupCodeInputRef}
                        type="text"
                        placeholder="e.g. IT-2024-05"
                        value={draft.code}
                        onChange={(event) => onDraftChange({ ...draft, code: event.target.value })}
                        className="block w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 pl-10 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500"><i className="fas fa-info-circle mr-1"></i> A short, recognizable identifier.</p>
                  </div>

                  <div className="flex flex-col justify-center rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                        <i className="fas fa-building text-xs"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department Context</p>
                        <p className="text-sm font-bold text-slate-800">{department}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                    <div className="mt-0.5 text-amber-500">
                      <i className="fas fa-lightbulb"></i>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-700/70">Project Title</p>
                      <p className="mt-1 text-sm font-medium text-amber-900">Pending Student Submission</p>
                      <p className="mt-1.5 text-xs text-amber-700/70">Students will set the working title upon invitation acceptance.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <div className="mt-0.5 text-blue-500">
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-700/70">Tracking & Progress</p>
                      <p className="mt-1 text-sm font-medium text-blue-900">Automated after creation</p>
                      <p className="mt-1.5 text-xs text-blue-700/70">Milestones and status shift based on supervision activity.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="absolute left-0 top-0 h-32 w-32 -translate-x-8 -translate-y-8 rounded-full bg-emerald-50/80 blur-3xl"></div>
                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                      <span className="text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold tracking-tight text-slate-900">Build the Roster</h4>
                      <p className="mt-1 text-sm text-slate-500">Select students and designate a group leader.</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                    <div className="flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {draft.students.length}
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Members Selected</span>
                  </div>
                </div>

                <div className="relative mt-6 rounded-[1.25rem] bg-slate-50 p-2 shadow-inner border border-slate-200/60">
                  <div className="relative flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative min-w-0 flex-1">
                      <i className="fas fa-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      <input
                        id="group-student-search"
                        type="text"
                        placeholder="Search students by name..."
                        value={studentSearch}
                        onChange={(event) => setStudentSearch(event.target.value)}
                        className="block w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 px-2 md:px-0">
                      {hasSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setStudentSearch('')}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-200/50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                        >
                          <i className="fas fa-times"></i>
                          Clear
                        </button>
                      )}
                      <span className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200">
                        {hasSearchQuery ? `${filteredStudents.length} Found` : `${filteredStudents.length} Available`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative mt-5 grid gap-6 lg:grid-cols-2">
                  <div className="flex flex-col overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-users text-slate-400"></i>
                          <h5 className="text-sm font-bold text-slate-800">Selected Team</h5>
                        </div>
                        {draft.leader && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                            <i className="fas fa-crown"></i> {draft.leader}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto bg-slate-50/30 p-3 max-h-[300px] min-h-[250px]">
                      {draft.students.length > 0 ? (
                        <div className="space-y-2.5">
                          {draft.students.map((student) => {
                            const isLeader = draft.leader === student;
                            const initials = student.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                            return (
                              <div
                                key={student}
                                className={`group relative flex items-center justify-between gap-3 rounded-xl border p-3 transition-all hover:shadow-md ${
                                  isLeader ? 'border-amber-200 bg-amber-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                                    isLeader ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="truncate text-sm font-bold text-slate-900">{student}</p>
                                      {isLeader && (
                                        <span className="shrink-0 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                                          Leader
                                        </span>
                                      )}
                                    </div>
                                    <p className="truncate text-xs text-slate-500">
                                      {isLeader ? 'Primary group contact' : 'Group member'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  {!isLeader && (
                                    <button
                                      type="button"
                                      onClick={() => assignLeader(student)}
                                      title="Make Leader"
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                    >
                                      <i className="fas fa-crown"></i>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeStudentFromDraft(student)}
                                    title="Remove Student"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  >
                                    <i className="fas fa-user-minus"></i>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <i className="fas fa-user-friends text-lg"></i>
                          </div>
                          <p className="mt-3 text-sm font-bold text-slate-700">Empty Roster</p>
                          <p className="mt-1 text-xs text-slate-500 max-w-[200px]">Add students from the available list to build this group.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-user-plus text-slate-400"></i>
                          <h5 className="text-sm font-bold text-slate-800">Available Roster</h5>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 max-h-[300px] min-h-[250px]">
                      {filteredStudents.length > 0 ? (
                        <div className="space-y-1">
                          {filteredStudents.map((student) => {
                            const initials = student.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                            return (
                              <div key={student} className="group flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">
                                    {initials}
                                  </div>
                                  <span className="truncate text-sm font-medium text-slate-700">{student}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => addStudentToDraft(student)}
                                  className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-indigo-50 hover:ring-indigo-200"
                                >
                                  Add
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                          <p className="text-sm font-bold text-slate-500">
                            {studentSearch.trim() ? 'No matching students found' : 'All students added'}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {studentSearch.trim() ? 'Try modifying your search query.' : 'There are no more available students.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-0 xl:self-start">
              <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Readiness</p>
                <h4 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">Before You Create</h4>
                <p className="mt-1 text-sm text-slate-500">The group can be created once each required item is in place.</p>

                <div className="mt-5 rounded-[1.15rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">Completion</p>
                    <span className="text-sm font-semibold text-slate-900">{completedChecks}/3</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isReadyToCreate ? 'bg-emerald-500' : 'bg-[var(--primary)]'
                      }`}
                      style={{ width: `${readinessPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {missingChecks.length
                      ? `Still needed: ${missingChecks.map((item) => item.label.replace(' added', '').replace(' selected', '')).join(', ')}.`
                      : 'All required setup items are complete.'}
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  {readinessChecks.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                        item.done ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-slate-50/80'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                          item.done ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'
                        }`}
                      >
                        <i className={`fas ${item.done ? 'fa-check' : 'fa-circle'}`}></i>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${item.done ? 'text-emerald-800' : 'text-slate-700'}`}>{item.label}</p>
                        <p className="text-xs text-slate-500">{item.done ? 'Complete' : 'Required before saving'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Preview</p>
                <h4 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">Group Snapshot</h4>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-500">Code</dt>
                    <dd className="text-right font-semibold text-slate-900">{draft.code.trim() || 'Not set'}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-500">Title</dt>
                    <dd className="max-w-[14rem] text-right font-semibold text-slate-900">Pending Submission</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-500">Department</dt>
                    <dd className="text-right font-semibold text-slate-900">{department}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-500">Members</dt>
                    <dd className="text-right font-semibold text-slate-900">{draft.students.length}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-500">Leader</dt>
                    <dd className="text-right font-semibold text-slate-900">{draft.leader || 'Not assigned'}</dd>
                  </div>
                </dl>

                <div
                  className={`mt-5 rounded-[1.15rem] border px-4 py-4 ${
                    isReadyToCreate ? 'border-emerald-200 bg-emerald-50/80' : 'border-amber-200 bg-amber-50/70'
                  }`}
                >
                  <p className={`text-sm font-semibold ${isReadyToCreate ? 'text-emerald-900' : 'text-amber-900'}`}>
                    {isReadyToCreate ? 'Ready to create' : 'Waiting for required details'}
                  </p>
                  <p className={`mt-1 text-xs ${isReadyToCreate ? 'text-emerald-700' : 'text-amber-800'}`}>
                    {isReadyToCreate
                      ? 'The group record has enough information to be saved now.'
                      : 'Finish the checklist to create a complete group record.'}
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </div>

        <div className="modal-footer flex-col gap-3 border-t border-slate-200/80 bg-white sm:flex-row sm:items-center">
          <div
            className={`w-full rounded-[1.15rem] border px-4 py-3 text-left sm:mr-auto sm:max-w-md ${
              isReadyToCreate ? 'border-emerald-200 bg-emerald-50/80' : 'border-amber-200 bg-amber-50/70'
            }`}
          >
            <p className={`text-sm font-semibold ${isReadyToCreate ? 'text-emerald-900' : 'text-amber-900'}`}>
              {isReadyToCreate ? 'Ready to create this group' : 'Finish the required setup first'}
            </p>
            <p className={`mt-1 text-xs ${isReadyToCreate ? 'text-emerald-700' : 'text-amber-800'}`}>
              {isReadyToCreate
                ? 'The current draft is complete and can be saved now.'
                : 'Create becomes available once the code, members, and leader are all set.'}
            </p>
          </div>

          <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
            <button type="button" className="btn btn-outline w-full sm:w-auto" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary w-full sm:w-auto"
              onClick={onSubmit}
              disabled={!isReadyToCreate}
              style={!isReadyToCreate ? { opacity: 0.65, cursor: 'not-allowed' } : undefined}
            >
              <i className="fas fa-folder-plus"></i>
              Create Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdviserGroups({ data }: { data: AdviserDashboardData }) {
  const adviserDepartment = data.profile.department?.replace(' Department', '') || 'IT';
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const [groups, setGroups] = useState<ManagedAdviserGroup[]>(
    () => data.groups.filter((group) => group.user_id === data.profile.user_id)
  );
  
  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await fetch(`/api/groups?userId=${data.profile.user_id}`);
        if (response.ok) {
          const realGroups = await response.json();
          setGroups(current => {
             const mockGroups = data.groups.filter(g => g.user_id === data.profile.user_id);
             // Format real groups to match ManagedAdviserGroup
             const formattedRealGroups = realGroups.map((g: any) => ({
               ...g,
               user_id: g.userId,
               project_id: g.projectId,
               created_at: g.createdAt,
               updated_at: g.updatedAt
             }));
             const realGroupIds = new Set(formattedRealGroups.map((g: any) => g.id));
             const uniqueMockGroups = mockGroups.filter(g => !realGroupIds.has(g.id));
             return [...formattedRealGroups, ...uniqueMockGroups];
          });
        }
      } catch (e) {
         console.error('Failed to fetch groups', e);
      }
    }
    fetchGroups();
  }, [data.profile.user_id, adviserDepartment, data.groups]);
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

  useEffect(() => {
    async function fetchStudents() {
      try {
        const response = await fetch(`/api/students?department=${adviserDepartment}`);
        if (response.ok) {
          const students = await response.json();
          setAvailableDbStudents(students.map((s: any) => s.name));
        }
      } catch (e) {
        console.error('Failed to fetch students', e);
      }
    }
    
    if (addStudentModalOpen || createGroupModalOpen) {
      fetchStudents();
    }
  }, [addStudentModalOpen, createGroupModalOpen, adviserDepartment]);

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
  const availableStudents = useMemo(
    () => {
      return [...availableDbStudents].sort((left, right) => left.localeCompare(right));
    },
    [availableDbStudents]
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

    const nextStudents = [...targetGroup.students, student];

    setGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        return {
          ...group,
          students: nextStudents,
          members: group.members + 1
        };
      })
    );
    setAddStudentModalOpen(false);

    try {
      await fetch('/api/groups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: groupId, students: nextStudents })
      });
    } catch (e) {
      console.error('Failed to update group students on server', e);
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
          finalRecommendation: newDbGroup.finalRecommendation
        };

        setGroups((currentGroups) => [nextGroup, ...currentGroups]);
        setSelectedGroupId(nextGroup.id);
        setGroupDraft(createEmptyGroupDraft());
        setCreateGroupModalOpen(false);
      } else {
        alert('Failed to create group. Please check if the group code is unique.');
      }
    } catch (e) {
      console.error('Error creating group:', e);
      alert('An error occurred while creating the group.');
    }
  };

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">{meta.headerLabel}</span>
            <div className="brand-mark">
              <i aria-hidden="true" className={`fas ${workspaceMode === 'adviser' ? 'fa-chalkboard-user' : 'fa-scale-balanced'}`} />
              <span>{workspaceMode === 'adviser' ? 'Adviser' : 'Panel'}</span>
              <strong>Workspace</strong>
            </div>
            <p>Track project groups, manage members, and monitor supervision progress.</p>
          </div>
          <span className="user-badge">
            <i aria-hidden="true" className={`fas ${meta.badgeIcon}`} />
            <span>{meta.badgeLabel}</span>
          </span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS[workspaceMode].map((item) => (
            <Link key={item.href} href={item.href} className={isNavItemActive(pathname, item.href) ? 'active' : ''}>
              <i className={`fas ${item.icon}`}></i> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-content">
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
              description="Track active supervision work, then move into the completed archive automatically when final requirements are satisfied."
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
              description={
                activeTab === 'completed'
                  ? viewMode === 'table'
                    ? 'Completed groups stay in a read-only archive with final outcomes and closure details.'
                    : 'Card mode gives each completed record enough space for final recommendation and archive context.'
                  : viewMode === 'table'
                    ? 'Table mode prioritizes milestones, progress, and next actions for active IT groups.'
                    : 'Card mode gives each active group more room for milestone review and adviser actions.'
              }
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
      </main>
    </div>
  );
}
