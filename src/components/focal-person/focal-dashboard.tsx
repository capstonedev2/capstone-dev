'use client';

import { useEffect, useState } from 'react';
import { EmptyState, KpiCard, SectionCard, StatusPill } from '@/components/system-admin/ui';
import { getDepartmentDashboard } from '@/lib/focal-person/service';
import { formatDate, STAGE_LABELS, termLabel } from '@/lib/focal-person/terms';
import type { DepartmentDashboard, RecentSubmission } from '@/lib/focal-person/types';
import styles from './focal-person.module.css';

const SUBMISSION_STATUS: Record<RecentSubmission['status'], { label: string; tone: 'success' | 'error' | 'neutral' }> = {
  submitted: { label: 'Submitted', tone: 'neutral' },
  under_review: { label: 'Under review', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'success' },
  needs_revision: { label: 'Needs revision', tone: 'error' },
  rejected: { label: 'Rejected', tone: 'error' },
  archived: { label: 'Archived', tone: 'neutral' }
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  return `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })}`;
}

/** Read-only department dashboard; the server decides the department from the signed-in account. */
export function FocalDashboard() {
  const [data, setData] = useState<DepartmentDashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setData(null);

    getDepartmentDashboard()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load the dashboard.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <EmptyState icon="fa-triangle-exclamation" message={error} />;

  if (!data) {
    return (
      <div className={styles.loading} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        Loading department dashboard…
      </div>
    );
  }

  const maxStage = Math.max(1, ...data.projectsByStage.map((item) => item.count));
  const totalProjects = data.totals.activeProjects + data.totals.completedProjects;

  return (
    <>
      <p className={styles.scopeLine}>
        <i className="fas fa-building-columns" aria-hidden="true" />
        {data.department.shortName} · {data.department.name} · {termLabel(data.semester, data.academicYear.label)}
      </p>

      <section className={styles.kpiGrid} aria-label="Department summary">
        <KpiCard label="Active projects" icon="fa-folder-open" value={String(data.totals.activeProjects)} helper={`${data.totals.researchGroups} research groups · ${totalProjects} projects`} />
        <KpiCard
          label="Completion rate"
          icon="fa-flag-checkered"
          iconTone="success"
          value={`${data.totals.completionRate}%`}
          helper={`${data.totals.completedProjects} completed`}
          meter={data.totals.completionRate}
        />
        <KpiCard
          label="Delayed groups"
          icon="fa-triangle-exclamation"
          iconTone="error"
          accent="accent"
          value={String(data.totals.delayedGroups)}
          valueTone={data.totals.delayedGroups ? 'error' : 'default'}
          helper="Past a milestone due date"
        />
        <KpiCard
          label="Upcoming defenses"
          icon="fa-calendar-check"
          iconTone="accent"
          accent="accent"
          value={String(data.totals.upcomingDefenses)}
          helper="Scheduled from today"
        />
      </section>

      <div className={styles.split}>
        <SectionCard title="Projects by stage" description="Every research group in the department." icon="fa-layer-group" titleId="focal-stages">
          <ul className={styles.stageList}>
            {data.projectsByStage.map((item) => (
              <li key={item.stage} className={styles.stageRow}>
                <div className={styles.stageHead}>
                  <span>{STAGE_LABELS[item.stage]}</span>
                  <span className={styles.stageCount}>{item.count}</span>
                </div>
                <span className={styles.progressTrack} aria-hidden="true">
                  <span
                    className={`${styles.progressFill} ${item.stage === 'completed' ? styles.progressFillSuccess : ''}`}
                    style={{ width: `${(item.count / maxStage) * 100}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Upcoming defenses" description="Next scheduled defenses in the department." icon="fa-calendar-days" accent="accent" titleId="focal-defenses">
          {data.upcomingDefenses.length ? (
            <ul className={styles.plainList}>
              {data.upcomingDefenses.map((defense) => (
                <li key={defense.id} className={styles.defenseRow}>
                  <span className={styles.dateTile} aria-hidden="true">
                    <strong>{new Date(defense.scheduledAt).getDate()}</strong>
                    {new Date(defense.scheduledAt).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <div className={styles.defenseBody}>
                    <span className={styles.personName}>
                      {defense.groupCode} · {defense.projectTitle}
                    </span>
                    <span className={styles.subtle}>
                      {formatWhen(defense.scheduledAt)} · {defense.venue}
                    </span>
                    <span className={styles.subtle}>Panel chair: {defense.panelChair}</span>
                  </div>
                  <StatusPill tone="neutral">{defense.typeLabel}</StatusPill>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="fa-calendar" message="No defenses scheduled." />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Delayed groups" description="Groups past a milestone due date, most overdue first." icon="fa-clock" accent="accent" titleId="focal-delayed">
        {data.delayedGroups.length ? (
          <ul className={styles.plainList}>
            {[...data.delayedGroups]
              .sort((a, b) => b.daysOverdue - a.daysOverdue)
              .map((group) => (
                <li key={group.groupId} className={styles.delayedRow}>
                  <div className={styles.defenseBody}>
                    <span className={styles.personName}>
                      {group.groupCode} · {group.projectTitle}
                    </span>
                    <span className={styles.subtle}>
                      {STAGE_LABELS[group.stage]} · {group.milestone} · due {formatDate(group.dueOn)} · Adviser: {group.adviserName}
                    </span>
                  </div>
                  <StatusPill tone="error">
                    {group.daysOverdue} {group.daysOverdue === 1 ? 'day' : 'days'} overdue
                  </StatusPill>
                </li>
              ))}
          </ul>
        ) : (
          <EmptyState icon="fa-circle-check" message="No delayed groups. Every group is on schedule." />
        )}
      </SectionCard>

      <SectionCard title="Recent submissions" description="Latest work submitted by groups in the department." icon="fa-file-arrow-up" titleId="focal-submissions">
        {data.recentSubmissions.length ? (
          <ul className={styles.plainList}>
            {data.recentSubmissions.map((submission) => (
              <li key={submission.id} className={styles.delayedRow}>
                <div className={styles.defenseBody}>
                  <span className={styles.personName}>
                    {submission.groupCode} · {submission.title}
                  </span>
                  <span className={styles.subtle}>
                    {submission.checkpoint ? `${submission.checkpoint} · ` : ''}
                    {submission.submittedBy} · {formatWhen(submission.submittedAt)}
                  </span>
                </div>
                <StatusPill tone={SUBMISSION_STATUS[submission.status].tone}>{SUBMISSION_STATUS[submission.status].label}</StatusPill>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="fa-inbox" message="No submissions from this department yet." />
        )}
      </SectionCard>
    </>
  );
}
