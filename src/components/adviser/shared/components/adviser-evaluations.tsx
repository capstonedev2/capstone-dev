'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AdviserPageHeader } from '@/components/adviser/shared/components/adviser-page-header';
import { AdviserShellActions } from '@/components/adviser/shared/components/adviser-shell-actions';
import {
  NAV_ITEMS,
  WORKSPACE_META,
  isNavItemActive,
  getShortName,
  getToastIcon
} from '@/components/adviser/shared/config/dashboard-utils';
import type { WorkspaceMode } from '@/components/adviser/shared/config/dashboard-utils';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';
import {
  ADVISER_EVALUATION_RECORDS,
  EVALUATION_DATE_FILTER_OPTIONS,
  EVALUATION_STATUS_FILTER_OPTIONS,
  PANEL_EVALUATION_RECORDS,
  calculateEvaluationScore,
  cloneEvaluationRecord,
  cloneEvaluationRecords,
  deriveStudentEvaluationRecommendation,
  matchesEvaluationDateFilter,
  type EvaluationDateFilter,
  type EvaluationRecommendation,
  type EvaluationRecord,
  type EvaluationStatus,
  type StudentEvaluationRecommendation
} from '@/components/adviser/shared/data/evaluation-workspace-data';
import {
  EvaluationFilters,
  EvaluationModal,
  EvaluationSummaryCards,
  EvaluationTable,
  type EvaluationSummaryMetric
} from '@/components/adviser/shared/data/evaluation-workspace-sections';
import type { AdviserDashboardData } from '@/lib/mock/adviser-dashboard';

type ToastType = 'success' | 'error' | 'info';

const PAGE_CONTENT = {
  adviser: {
    title: 'Evaluations',
    description: 'Track IT defense scoring status and adviser-side evaluation records in one workspace.'
  },
  panel: {
    title: 'Evaluation Queue',
    description: 'Score defense sessions and submit formal panel recommendation rubrics.'
  }
} as const;

function clampScore(value: number, maxScore: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(maxScore, Math.max(0, Math.round(value)));
}

function clampRubricMaxScore(value: number) {
  if (Number.isNaN(value)) {
    return 1;
  }

  return Math.min(50, Math.max(1, Math.round(value)));
}

export function AdviserEvaluations({ data }: { data: AdviserDashboardData }) {
  const { workspaceMode, switchWorkspace, pathname, basePath } = useWorkspaceMode();
  const [statusFilter, setStatusFilter] = useState<EvaluationStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<EvaluationDateFilter>('all');
  const [searchValue, setSearchValue] = useState('');
  const [adviserRecords, setAdviserRecords] = useState<EvaluationRecord[]>(() =>
    cloneEvaluationRecords(ADVISER_EVALUATION_RECORDS)
  );
  const [panelRecords, setPanelRecords] = useState<EvaluationRecord[]>(() =>
    cloneEvaluationRecords(PANEL_EVALUATION_RECORDS)
  );
  const [draftRecord, setDraftRecord] = useState<EvaluationRecord | null>(null);
  const [readOnlyModal, setReadOnlyModal] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string; type: ToastType } | null>(null);


  useEffect(() => {
    document.body.style.overflow = draftRecord ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [draftRecord]);

  useEffect(() => {
    closeModal();
  }, [workspaceMode]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const meta = WORKSPACE_META[workspaceMode];
  const pageContent = PAGE_CONTENT[workspaceMode];
  const records = workspaceMode === 'adviser' ? adviserRecords : panelRecords;

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return records.filter((record) => {
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesDate = matchesEvaluationDateFilter(record, dateFilter);
      const matchesSearch =
        !normalizedSearch ||
        [
          record.projectTitle,
          record.groupId,
          record.department,
          record.evaluatorId,
          record.overallComments,
          record.students.join(' ')
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [dateFilter, records, searchValue, statusFilter]);

  const summaryMetrics = useMemo<EvaluationSummaryMetric[]>(() => {
    const openCount = records.filter((record) => record.status !== 'completed').length;
    const completedCount = records.filter((record) => record.status === 'completed').length;
    const overdueCount = records.filter((record) => record.status === 'overdue').length;

    if (workspaceMode === 'adviser') {
      return [
        {
          id: 'assigned-evaluations',
          label: 'Assigned Evaluations',
          value: records.length,
          helperText: 'IT defense records currently tracked for adviser-side follow-up and review.',
          icon: 'fa-clipboard-list',
          iconClassName: 'bg-blue-50 text-blue-600'
        },
        {
          id: 'open-reviews',
          label: 'Open Reviews',
          value: openCount,
          helperText: 'Evaluation records still waiting for scoring confirmation or submission.',
          icon: 'fa-hourglass-half',
          iconClassName: 'bg-amber-50 text-amber-600'
        },
        {
          id: 'completed-reviews',
          label: 'Completed',
          value: completedCount,
          helperText: 'Evaluations already submitted and ready for archive or consolidation.',
          icon: 'fa-circle-check',
          iconClassName: 'bg-emerald-50 text-emerald-600'
        },
        {
          id: 'overdue-reviews',
          label: 'Overdue',
          value: overdueCount,
          helperText: 'Records that need immediate follow-up before the defense cycle slips further.',
          icon: 'fa-triangle-exclamation',
          iconClassName: 'bg-rose-50 text-rose-600'
        }
      ];
    }

    return [
      {
        id: 'panel-queue',
        label: 'Panel Queue',
        value: records.length,
        helperText: 'Assigned defense packets currently routed to your panel workload.',
        icon: 'fa-clipboard-check',
        iconClassName: 'bg-blue-50 text-blue-600'
      },
      {
        id: 'pending-scoring',
        label: 'Pending Scoring',
        value: records.filter((record) => record.status === 'pending' || record.status === 'overdue').length,
        helperText: 'Evaluation packets that still need a formal recommendation from you.',
        icon: 'fa-pen-to-square',
        iconClassName: 'bg-amber-50 text-amber-600'
      },
      {
        id: 'scheduled-defenses',
        label: 'Scheduled',
        value: records.filter((record) => record.status === 'scheduled').length,
        helperText: 'Assigned defenses already lined up for the current scoring cycle.',
        icon: 'fa-calendar-day',
        iconClassName: 'bg-sky-50 text-sky-600'
      },
      {
        id: 'completed-scoring',
        label: 'Completed',
        value: completedCount,
        helperText: 'Panel reviews already submitted and ready for records consolidation.',
        icon: 'fa-circle-check',
        iconClassName: 'bg-emerald-50 text-emerald-600'
      }
    ];
  }, [records, workspaceMode]);

  function showToast(message: string, type: ToastType = 'info') {
    const id = Date.now();
    setToast({ id, message, type });

    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3200);
  }

  function setRecordsForActiveMode(updater: (current: EvaluationRecord[]) => EvaluationRecord[]) {
    if (workspaceMode === 'adviser') {
      setAdviserRecords(updater);
      return;
    }

    setPanelRecords(updater);
  }

  function openEvaluation(record: EvaluationRecord, readOnly: boolean) {
    setDraftRecord(cloneEvaluationRecord(record));
    setReadOnlyModal(readOnly);
  }

  function closeModal() {
    setDraftRecord(null);
    setReadOnlyModal(false);
  }

  function handleCriterionScoreChange(criterionId: string, value: number) {
    setDraftRecord((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        rubric: current.rubric.map((criterion) =>
          criterion.id === criterionId
            ? { ...criterion, score: clampScore(value, criterion.maxScore) }
            : criterion
        )
      };
    });
  }

  function handleCriterionCommentChange(criterionId: string, value: string) {
    setDraftRecord((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        rubric: current.rubric.map((criterion) =>
          criterion.id === criterionId ? { ...criterion, comment: value } : criterion
        )
      };
    });
  }

  function handleCriterionLabelChange(criterionId: string, value: string) {
    setDraftRecord((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        rubric: current.rubric.map((criterion) =>
          criterion.id === criterionId ? { ...criterion, label: value } : criterion
        )
      };
    });
  }

  function handleCriterionMaxScoreChange(criterionId: string, value: number) {
    setDraftRecord((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        rubric: current.rubric.map((criterion) => {
          if (criterion.id !== criterionId) {
            return criterion;
          }

          const maxScore = clampRubricMaxScore(value);

          return {
            ...criterion,
            maxScore,
            score: clampScore(criterion.score, maxScore)
          };
        })
      };
    });
  }

  function handleAddCriterion() {
    setDraftRecord((current) => {
      if (!current) {
        return current;
      }

      const nextCriterionNumber = current.rubric.length + 1;

      return {
        ...current,
        rubric: [
          ...current.rubric,
          {
            id: `criterion-${Date.now()}-${nextCriterionNumber}`,
            label: `New Criterion ${nextCriterionNumber}`,
            maxScore: 10,
            score: 0,
            comment: ''
          }
        ]
      };
    });
  }

  function handleStudentCriterionScoreChange(studentId: string, criterionId: string, value: number) {
    setDraftRecord((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        studentEvaluations: current.studentEvaluations.map((studentEvaluation) =>
          studentEvaluation.id === studentId
            ? {
                ...studentEvaluation,
                rubric: studentEvaluation.rubric.map((criterion) =>
                  criterion.id === criterionId
                    ? { ...criterion, score: clampScore(value, criterion.maxScore) }
                    : criterion
                )
              }
            : studentEvaluation
        )
      };
    });
  }

  function handleStudentCommentChange(studentId: string, value: string) {
    setDraftRecord((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        studentEvaluations: current.studentEvaluations.map((studentEvaluation) =>
          studentEvaluation.id === studentId ? { ...studentEvaluation, comment: value } : studentEvaluation
        )
      };
    });
  }

  function handleStudentRecommendationChange(studentId: string, value: StudentEvaluationRecommendation) {
    setDraftRecord((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        studentEvaluations: current.studentEvaluations.map((studentEvaluation) =>
          studentEvaluation.id === studentId ? { ...studentEvaluation, recommendation: value } : studentEvaluation
        )
      };
    });
  }

  function handleOverallCommentsChange(value: string) {
    setDraftRecord((current) => (current ? { ...current, overallComments: value } : current));
  }

  function handleRecommendationChange(value: EvaluationRecommendation) {
    setDraftRecord((current) => (current ? { ...current, recommendation: value } : current));
  }

  function submitEvaluation() {
    if (!draftRecord) {
      return;
    }

    if (!draftRecord.overallComments.trim()) {
      showToast('Add overall comments before submitting the evaluation.', 'error');
      return;
    }

    const normalizedRubric = draftRecord.rubric.map((criterion, index) => {
      const maxScore = clampRubricMaxScore(criterion.maxScore);

      return {
        ...criterion,
        label: criterion.label.trim() || `Criterion ${index + 1}`,
        maxScore,
        score: clampScore(criterion.score, maxScore),
        comment: criterion.comment.trim()
      };
    });

    const submittedAt = new Date().toISOString();
    const finalizedStudentEvaluations = draftRecord.studentEvaluations.map((studentEvaluation) => {
      const score = calculateEvaluationScore(studentEvaluation.rubric);

      return {
        ...studentEvaluation,
        score,
        recommendation: studentEvaluation.recommendation ?? deriveStudentEvaluationRecommendation(score)
      };
    });

    const finalizedRecord: EvaluationRecord = {
      ...draftRecord,
      rubric: normalizedRubric,
      score: calculateEvaluationScore(normalizedRubric),
      recommendation: draftRecord.recommendation ?? 'With Revision',
      studentEvaluations: finalizedStudentEvaluations,
      status: 'completed',
      submittedAt
    };

    setRecordsForActiveMode((current) =>
      current.map((record) => (record.id === finalizedRecord.id ? finalizedRecord : record))
    );

    closeModal();
    showToast(
      `Evaluation submitted for ${finalizedRecord.groupId} with ${finalizedStudentEvaluations.length} student reviews.`,
      'success'
    );
  }

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
            <p>{pageContent.description}</p>
          </div>
          <span className="user-badge">
            <i aria-hidden="true" className={`fas ${meta.badgeIcon}`} />
            <span>{meta.badgeLabel}</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS[workspaceMode].map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
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
          title={pageContent.title}
          description={pageContent.description}
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
          <EvaluationSummaryCards metrics={summaryMetrics} />

          <div className="space-y-6">
              <EvaluationFilters
                dateFilter={dateFilter}
                dateOptions={EVALUATION_DATE_FILTER_OPTIONS}
                onDateChange={setDateFilter}
                onSearchChange={setSearchValue}
                onStatusChange={setStatusFilter}
                searchValue={searchValue}
                statusFilter={statusFilter}
                statusOptions={EVALUATION_STATUS_FILTER_OPTIONS}
                workspaceMode={workspaceMode}
              />

              <EvaluationTable
                onEvaluate={(record) => openEvaluation(record, false)}
                onViewScore={(record) => openEvaluation(record, true)}
                records={filteredRecords}
                workspaceMode={workspaceMode}
              />
          </div>
        </div>

        <EvaluationModal
          draft={draftRecord}
          readOnly={readOnlyModal}
          workspaceMode={workspaceMode}
          onAddCriterion={handleAddCriterion}
          onClose={closeModal}
          onCriterionCommentChange={handleCriterionCommentChange}
          onCriterionLabelChange={handleCriterionLabelChange}
          onCriterionMaxScoreChange={handleCriterionMaxScoreChange}
          onCriterionScoreChange={handleCriterionScoreChange}
          onStudentCommentChange={handleStudentCommentChange}
          onStudentCriterionScoreChange={handleStudentCriterionScoreChange}
          onStudentRecommendationChange={handleStudentRecommendationChange}
          onOverallCommentsChange={handleOverallCommentsChange}
          onRecommendationChange={handleRecommendationChange}
          onSubmit={submitEvaluation}
        />

        {toast ? (
          <div className="notification">
            <i
              className={`fas ${getToastIcon(toast.type)}`}
              style={{
                color:
                  toast.type === 'success'
                    ? 'var(--success)'
                    : toast.type === 'error'
                      ? 'var(--danger)'
                      : 'var(--primary)'
              }}
            />
            <span>{toast.message}</span>
          </div>
        ) : null}
      </main>
    </div>
  );
}
