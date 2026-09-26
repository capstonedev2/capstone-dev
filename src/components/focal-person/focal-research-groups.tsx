'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState, SectionCard, StatusPill } from '@/components/system-admin/ui';
import { getResearchGroups } from '@/lib/focal-person/service';
import { STAGE_LABELS } from '@/lib/focal-person/terms';
import type { DepartmentReportRow, ProjectStage, ReportRowStatus } from '@/lib/focal-person/types';
import styles from './focal-person.module.css';

const STATUS_LABELS: Record<ReportRowStatus, string> = { on_track: 'On track', delayed: 'Delayed', completed: 'Completed' };

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Read-only list of the department's research groups; the server limits the rows to the account's department. */
export function FocalResearchGroups() {
  const [groups, setGroups] = useState<DepartmentReportRow[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<ProjectStage | 'ALL'>('ALL');
  const [status, setStatus] = useState<ReportRowStatus | 'ALL'>('ALL');

  useEffect(() => {
    let cancelled = false;
    getResearchGroups()
      .then((rows) => {
        if (!cancelled) setGroups(rows);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load research groups.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (groups ?? []).filter(
      (group) =>
        (stage === 'ALL' || group.stage === stage) &&
        (status === 'ALL' || group.status === status) &&
        (!needle ||
          [group.groupCode, group.projectTitle, group.adviserName, ...group.members].some((value) => value.toLowerCase().includes(needle)))
    );
  }, [groups, query, stage, status]);

  const counts = useMemo(() => {
    const list = groups ?? [];
    return {
      total: list.length,
      onTrack: list.filter((group) => group.status === 'on_track').length,
      delayed: list.filter((group) => group.status === 'delayed').length,
      completed: list.filter((group) => group.status === 'completed').length
    };
  }, [groups]);

  return (
    <SectionCard
      title="Research groups"
      description="Every research group in the department, with its current stage and progress."
      icon="fa-users"
      titleId="focal-groups"
    >
      <div className={styles.filters} role="group" aria-label="Research group filters">
        <label className={styles.field}>
          <span>Search</span>
          <input type="search" placeholder="Group, title, adviser, or member" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Stage</span>
          <select value={stage} onChange={(event) => setStage(event.target.value as ProjectStage | 'ALL')}>
            <option value="ALL">All stages</option>
            {(Object.keys(STAGE_LABELS) as ProjectStage[]).map((item) => (
              <option key={item} value={item}>
                {STAGE_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as ReportRowStatus | 'ALL')}>
            <option value="ALL">All statuses</option>
            {(Object.keys(STATUS_LABELS) as ReportRowStatus[]).map((item) => (
              <option key={item} value={item}>
                {STATUS_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {groups ? (
        <ul className={styles.summaryChips} aria-label="Research group summary">
          <li>
            <strong>{counts.total}</strong> groups
          </li>
          <li>
            <strong>{counts.onTrack}</strong> on track
          </li>
          <li className={counts.delayed ? styles.chipAlert : undefined}>
            <strong>{counts.delayed}</strong> delayed
          </li>
          <li>
            <strong>{counts.completed}</strong> completed
          </li>
        </ul>
      ) : null}

      {error ? (
        <EmptyState icon="fa-triangle-exclamation" message={error} />
      ) : !groups ? (
        <div className={styles.loading} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          Loading research groups…
        </div>
      ) : filtered.length ? (
        <div className={styles.tableScroll} tabIndex={0} aria-label="Research groups, scrolls horizontally">
          <table className={styles.table}>
            <caption className={styles.srOnly}>Research groups in the department</caption>
            <thead>
              <tr>
                <th scope="col">Research group</th>
                <th scope="col">Research title</th>
                <th scope="col">Members</th>
                <th scope="col">Adviser</th>
                <th scope="col">Current stage</th>
                <th scope="col">Status</th>
                <th scope="col">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((group) => (
                <tr key={group.id}>
                  <th scope="row">{group.groupCode}</th>
                  <td>
                    <span className={styles.cellTitle}>{group.projectTitle}</span>
                    <span className={styles.subtle}>{group.lastMilestone}</span>
                  </td>
                  <td>
                    {group.members.length ? (
                      group.members.map((member) => (
                        <span key={member} className={styles.subtle}>
                          {member}
                        </span>
                      ))
                    ) : (
                      <span className={styles.subtle}>No members listed</span>
                    )}
                  </td>
                  <td>{group.adviserName}</td>
                  <td>
                    {STAGE_LABELS[group.stage]}
                    <span className={styles.subtle}>{group.progress}% of checkpoints</span>
                  </td>
                  <td>
                    <StatusPill tone={group.status === 'delayed' ? 'error' : group.status === 'completed' ? 'success' : 'neutral'}>
                      {STATUS_LABELS[group.status]}
                    </StatusPill>
                  </td>
                  <td className={styles.nowrap}>{formatUpdated(group.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={groups.length ? 'fa-filter-circle-xmark' : 'fa-users'}
          message={groups.length ? 'No research groups match these filters.' : 'No research groups in this department yet.'}
        />
      )}
    </SectionCard>
  );
}
