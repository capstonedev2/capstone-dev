'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState, SectionCard, StatusPill } from '@/components/system-admin/ui';
import { getDefenseSchedules } from '@/lib/focal-person/service';
import type { DefenseScheduleStatus, DepartmentDefenseSchedule } from '@/lib/focal-person/types';
import styles from './focal-person.module.css';

type WhenFilter = 'upcoming' | 'past' | 'all';

const STATUS_LABELS: Record<DefenseScheduleStatus, string> = {
  scheduled: 'Scheduled',
  rescheduled: 'Rescheduled',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const STATUS_TONES: Record<DefenseScheduleStatus, 'success' | 'error' | 'neutral'> = {
  scheduled: 'neutral',
  rescheduled: 'neutral',
  completed: 'success',
  cancelled: 'error'
};

/** Same date/time wording as the dashboard's upcoming defenses. */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Read-only list of the department's defense schedules; the server limits them to the account's department. */
export function FocalDefenseSchedules() {
  const [schedules, setSchedules] = useState<DepartmentDefenseSchedule[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('ALL');
  const [when, setWhen] = useState<WhenFilter>('all');
  const [status, setStatus] = useState<DefenseScheduleStatus | 'ALL'>('ALL');

  useEffect(() => {
    let cancelled = false;
    getDefenseSchedules()
      .then((rows) => {
        if (!cancelled) setSchedules(rows);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load defense schedules.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const types = useMemo(() => Array.from(new Set((schedules ?? []).map((item) => item.typeLabel))).sort(), [schedules]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const needle = query.trim().toLowerCase();
    const list = (schedules ?? []).filter((item) => {
      const time = new Date(item.scheduledAt).getTime();
      if (when === 'upcoming' && time < now) return false;
      if (when === 'past' && time >= now) return false;
      if (type !== 'ALL' && item.typeLabel !== type) return false;
      if (status !== 'ALL' && item.status !== status) return false;
      if (!needle) return true;
      return [item.groupCode, item.projectTitle, item.venue, item.panelChair ?? '', ...item.panelMembers].some((value) =>
        value.toLowerCase().includes(needle)
      );
    });
    // Upcoming: soonest first. Past / all: most recent first (the API's order).
    return when === 'upcoming' ? [...list].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)) : list;
  }, [query, schedules, status, type, when]);

  const counts = useMemo(() => {
    const now = Date.now();
    const list = schedules ?? [];
    return {
      upcoming: list.filter((item) => new Date(item.scheduledAt).getTime() >= now && item.status !== 'cancelled').length,
      completed: list.filter((item) => item.status === 'completed').length,
      total: list.length
    };
  }, [schedules]);

  return (
    <SectionCard
      title="Defense schedules"
      description="Concept, proposal, pre-final, and final defenses scheduled for groups in the department."
      icon="fa-calendar-days"
      accent="accent"
      titleId="focal-schedules"
    >
      <div className={styles.filters} role="group" aria-label="Defense schedule filters">
        <label className={styles.field}>
          <span>Search</span>
          <input type="search" placeholder="Group, title, venue, or panel" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Defense type</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="ALL">All types</option>
            {types.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Date</span>
          <select value={when} onChange={(event) => setWhen(event.target.value as WhenFilter)}>
            <option value="all">All dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as DefenseScheduleStatus | 'ALL')}>
            <option value="ALL">All statuses</option>
            {(Object.keys(STATUS_LABELS) as DefenseScheduleStatus[]).map((item) => (
              <option key={item} value={item}>
                {STATUS_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {schedules ? (
        <ul className={styles.summaryChips} aria-label="Defense schedule summary">
          <li>
            <strong>{counts.upcoming}</strong> upcoming
          </li>
          <li>
            <strong>{counts.completed}</strong> completed
          </li>
          <li>
            <strong>{counts.total}</strong> in total
          </li>
        </ul>
      ) : null}

      {error ? (
        <EmptyState icon="fa-triangle-exclamation" message={error} />
      ) : !schedules ? (
        <div className={styles.loading} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          Loading defense schedules…
        </div>
      ) : filtered.length ? (
        <div className={styles.tableScroll} tabIndex={0} aria-label="Defense schedules, scrolls horizontally">
          <table className={styles.table}>
            <caption className={styles.srOnly}>Defense schedules in the department</caption>
            <thead>
              <tr>
                <th scope="col">Research group</th>
                <th scope="col">Research title</th>
                <th scope="col">Defense type</th>
                <th scope="col">Date</th>
                <th scope="col">Time</th>
                <th scope="col">Venue</th>
                <th scope="col">Panel</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <th scope="row">{item.groupCode}</th>
                  <td>
                    <span className={styles.cellTitle}>{item.projectTitle}</span>
                  </td>
                  <td className={styles.nowrap}>{item.typeLabel}</td>
                  <td className={styles.nowrap}>{formatDate(item.scheduledAt)}</td>
                  <td className={styles.nowrap}>{formatTime(item.scheduledAt)}</td>
                  <td>{item.venue}</td>
                  <td>
                    {item.panelChair ? <span className={styles.subtle}>Chair: {item.panelChair}</span> : null}
                    {item.panelMembers.map((member) => (
                      <span key={member} className={styles.subtle}>
                        {member}
                      </span>
                    ))}
                    {!item.panelChair && !item.panelMembers.length ? <span className={styles.subtle}>Not assigned</span> : null}
                  </td>
                  <td>
                    <StatusPill tone={STATUS_TONES[item.status]}>{STATUS_LABELS[item.status]}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={schedules.length ? 'fa-filter-circle-xmark' : 'fa-calendar'}
          message={schedules.length ? 'No defenses match these filters.' : 'No defenses have been scheduled in this department yet.'}
        />
      )}
    </SectionCard>
  );
}
