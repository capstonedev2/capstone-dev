'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import { NAV_ITEMS, WORKSPACE_META, isNavItemActive, getShortName } from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import {
  EmptyState,
  TitleDetailsDrawer,
  TitleFilters,
  TitleList,
  TitleSummaryCards,
  type TitleSummaryMetric
} from '@/components/adviser/adviser-mode/data/title-workspace-sections';
import {
  TITLE_SORT_OPTIONS,
  TITLE_STATUS_FILTER_OPTIONS,
  getAcademicYearOptions,
  getDefaultActionForStatus,
  sortTitleRecords,
  type AdviserTitleRecord,
  type TitleSortOption,
  type TitleStatus
} from '@/components/adviser/adviser-mode/data/title-workspace-data';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

export function AdviserTitleApproval({ data }: { data: AdviserDashboardData }) {
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const [titleRecords, setTitleRecords] = useState<AdviserTitleRecord[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isLoadingTitles, setIsLoadingTitles] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TitleStatus | 'all'>('all');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState<TitleSortOption>('newest');
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [remarksDraft, setRemarksDraft] = useState('');

  const adviserMeta = WORKSPACE_META[workspaceMode];

  useEffect(() => {
    let cancelled = false;

    const loadTitles = async () => {
      setIsLoadingTitles(true);
      setTitleError(null);

      try {
        const response = await fetch('/api/title-submissions', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || 'Unable to load title submissions.');
        }

        if (!cancelled) {
          setTitleRecords(payload?.titles || []);
        }
      } catch (error) {
        if (!cancelled) {
          setTitleError(error instanceof Error ? error.message : 'Unable to load title submissions.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTitles(false);
        }
      }
    };

    loadTitles();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedTitleId(null);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!selectedTitleId) {
      document.body.style.removeProperty('overflow');
      return;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.removeProperty('overflow');
    };
  }, [selectedTitleId]);

  const academicYearOptions = useMemo(() => getAcademicYearOptions(titleRecords), [titleRecords]);

  const selectedRecord = useMemo(
    () => titleRecords.find((record) => record.id === selectedTitleId) ?? null,
    [selectedTitleId, titleRecords]
  );

  useEffect(() => {
    if (!selectedRecord) {
      setRemarksDraft('');
      return;
    }

    setRemarksDraft(selectedRecord.adviserAction);
  }, [selectedRecord]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    const filtered = titleRecords.filter((record) => {
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesAcademicYear =
        academicYearFilter === 'all' || record.academicYear === academicYearFilter;
      const matchesSearch =
        !normalizedSearch ||
        [
          record.groupId,
          record.title,
          record.description,
          record.keywords.join(' '),
          record.memberPreview.join(' '),
          record.adviserAction
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesAcademicYear && matchesSearch;
    });

    return sortTitleRecords(filtered, sortBy);
  }, [academicYearFilter, searchValue, sortBy, statusFilter, titleRecords]);

  const hasPendingTitles = useMemo(
    () => titleRecords.some((record) => record.status === 'pending'),
    [titleRecords]
  );

  const summaryMetrics = useMemo<TitleSummaryMetric[]>(
    () => [
      {
        id: 'pending-titles',
        label: 'Pending Titles',
        value: titleRecords.filter((record) => record.status === 'pending').length,
        helperText: 'Title proposals still waiting for adviser validation and originality review.',
        icon: 'fa-hourglass-half',
        iconClassName: 'bg-amber-50 text-amber-600'
      },
      {
        id: 'approved-titles',
        label: 'Approved',
        value: titleRecords.filter((record) => record.status === 'approved').length,
        helperText: 'Titles already accepted for the current IT capstone cycle.',
        icon: 'fa-circle-check',
        iconClassName: 'bg-emerald-50 text-emerald-600'
      },
      {
        id: 'needs-revision',
        label: 'Needs Revision',
        value: titleRecords.filter((record) => record.status === 'needs-revision').length,
        helperText: 'Proposals returned for clearer wording, scope adjustment, or refinement.',
        icon: 'fa-rotate-left',
        iconClassName: 'bg-blue-50 text-blue-600'
      },
      {
        id: 'rejected-titles',
        label: 'Rejected',
        value: titleRecords.filter((record) => record.status === 'rejected').length,
        helperText: 'Titles declined due to originality issues or weak alignment with the study scope.',
        icon: 'fa-ban',
        iconClassName: 'bg-rose-50 text-rose-600'
      }
    ],
    [titleRecords]
  );

  const applyDecision = async (
    record: AdviserTitleRecord,
    nextStatus: TitleStatus,
    customRemarks?: string
  ) => {
    const nextRemarks = customRemarks?.trim() || getDefaultActionForStatus(nextStatus);

    try {
      const response = await fetch('/api/title-submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          decision: nextStatus === 'needs-revision' ? 'needs_revision' : nextStatus,
          remarks: nextRemarks
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to update the title decision.');
      }

      setTitleRecords((current) =>
        current.map((item) => (item.id === record.id ? payload.title : item))
      );

      if (selectedTitleId === record.id) {
        setSelectedTitleId(null);
        setRemarksDraft('');
      }
      window.dispatchEvent(new Event('thesistrack:notifications-updated'));
    } catch (error) {
      setTitleError(error instanceof Error ? error.message : 'Unable to update the title decision.');
    }
  };

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-copy">
            <span className="sidebar-context-kicker">{adviserMeta.headerLabel}</span>
            <div className="brand-mark">
              <i aria-hidden="true" className={`fas ${workspaceMode === 'adviser' ? 'fa-chalkboard-user' : 'fa-scale-balanced'}`} />
              <span>{workspaceMode === 'adviser' ? 'Adviser' : 'Panel'}</span>
              <strong>Workspace</strong>
            </div>
            <p>Review, validate, and manage proposed capstone project titles from your assigned IT groups.</p>
          </div>
          <span className="user-badge">
            <i aria-hidden="true" className={`fas ${adviserMeta.badgeIcon}`} />
            <span>{adviserMeta.badgeLabel}</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS[workspaceMode].map((item) => (
            <Link
              key={item.href}
              className={isNavItemActive(pathname, item.href) ? 'active' : ''}
              href={item.href}
            >
              <i className={`fas ${item.icon}`} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <AdviserPageHeader
          title="Title Approvals"
          description="Review, validate, and manage proposed capstone project titles from your assigned IT groups."
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

        <div className="mx-auto max-w-[1600px] space-y-6">
          <TitleSummaryCards metrics={summaryMetrics} />

          <TitleFilters
            academicYearFilter={academicYearFilter}
            academicYearOptions={academicYearOptions}
            onAcademicYearChange={setAcademicYearFilter}
            onSearchChange={setSearchValue}
            onSortChange={setSortBy}
            onStatusChange={setStatusFilter}
            searchValue={searchValue}
            sortBy={sortBy}
            sortOptions={TITLE_SORT_OPTIONS}
            statusFilter={statusFilter}
            statusOptions={TITLE_STATUS_FILTER_OPTIONS}
          />

          {titleError ? (
            <div className="project-files-state is-danger">
              <i className="fas fa-circle-exclamation" aria-hidden="true" />
              <span>{titleError}</span>
            </div>
          ) : null}

          {isLoadingTitles ? (
            <div className="project-files-state">
              <span className="project-files-spinner" aria-hidden="true" />
              <span>Loading title submissions...</span>
            </div>
          ) : titleRecords.length ? (
            <TitleList
              hasPendingTitles={hasPendingTitles}
              onViewApproved={() => {
                setStatusFilter('approved');
                setSearchValue('');
              }}
              onViewDetails={(record) => setSelectedTitleId(record.id)}
              titles={filteredRecords}
            />
          ) : (
            <EmptyState
              hasPendingTitles={hasPendingTitles}
              onViewApproved={() => {
                setStatusFilter('approved');
                setSearchValue('');
              }}
            />
          )}
        </div>
      </main>

      <TitleDetailsDrawer
        record={selectedRecord}
        remarksDraft={remarksDraft}
        onApprove={(record) => applyDecision(record, 'approved', remarksDraft)}
        onClose={() => setSelectedTitleId(null)}
        onReject={(record) => applyDecision(record, 'rejected', remarksDraft)}
        onRemarksChange={setRemarksDraft}
        onRequestRevision={(record) => applyDecision(record, 'needs-revision', remarksDraft)}
      />
    </div>
  );
}
