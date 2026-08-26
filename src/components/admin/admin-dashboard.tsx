'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { AdminChartCard } from '@/components/admin/admin-chart-card';
import { ChartResponsiveContainer } from '@/components/shared/chart-responsive-container';
import {
  ADVISER_LOADS,
  AXIS_TICK,
  BASE_MONTHLY_TRENDS,
  CHART_COLORS,
  DEPARTMENTS,
  TOOLTIP_STYLE,
  YEAR_LABELS
} from '@/components/admin/admin-dashboard-data';
import { AdminShell } from '@/components/admin/admin-shell';

const formatAcademicYear = (year: keyof typeof YEAR_LABELS) => YEAR_LABELS[year];

export function AdminDashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [deptFilter, setDeptFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState<keyof typeof YEAR_LABELS>('2024');
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' = 'info') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const selectedDepartment = DEPARTMENTS.find((department) => department.id === deptFilter) ?? null;
  const filteredDepartments = selectedDepartment ? [selectedDepartment] : DEPARTMENTS;
  const adviserLoadData = (
    selectedDepartment
      ? ADVISER_LOADS.filter((adviser) => adviser.department === selectedDepartment.id)
      : ADVISER_LOADS
  )
    .slice()
    .sort((left, right) => right.projects - left.projects)
    .slice(0, 6);

  const totalProjects = DEPARTMENTS.reduce((sum, department) => sum + department.totalProjects, 0);
  const totalStudents = DEPARTMENTS.reduce((sum, department) => sum + department.students, 0);
  const totalAdvisers = DEPARTMENTS.reduce((sum, department) => sum + department.advisers, 0);
  const totalUsers = DEPARTMENTS.reduce((sum, department) => sum + department.students + department.advisers, 0);
  const totalCompleted = DEPARTMENTS.reduce((sum, department) => sum + department.completed, 0);
  const totalActiveProjects = DEPARTMENTS.reduce((sum, department) => sum + department.inProgress, 0);
  const totalDeployed = DEPARTMENTS.reduce((sum, department) => sum + department.deployed, 0);
  const totalPendingReview = DEPARTMENTS.reduce((sum, department) => sum + department.pendingReview, 0);
  const totalDelayed = DEPARTMENTS.reduce((sum, department) => sum + department.delayed, 0);
  const scopeLabel = selectedDepartment ? `${selectedDepartment.name} Department` : 'All Departments';
  const scopeShare = selectedDepartment ? selectedDepartment.totalProjects / totalProjects : 1;
  const scopedTotalProjects = selectedDepartment ? selectedDepartment.totalProjects : totalProjects;
  const scopedCompleted = selectedDepartment ? selectedDepartment.completed : totalCompleted;
  const scopedActiveProjects = selectedDepartment ? selectedDepartment.inProgress : totalActiveProjects;
  const scopedDeployed = selectedDepartment ? selectedDepartment.deployed : totalDeployed;
  const scopedPendingReview = selectedDepartment ? selectedDepartment.pendingReview : totalPendingReview;
  const scopedDelayed = selectedDepartment ? selectedDepartment.delayed : totalDelayed;
  const scopedStudents = selectedDepartment ? selectedDepartment.students : totalStudents;
  const scopedAdvisers = selectedDepartment ? selectedDepartment.advisers : totalAdvisers;
  const scopedPeople = selectedDepartment ? selectedDepartment.students + selectedDepartment.advisers : totalUsers;
  const completionRate = Math.round((scopedCompleted / Math.max(scopedTotalProjects, 1)) * 100);
  const deploymentRate = Math.round((scopedDeployed / Math.max(scopedTotalProjects, 1)) * 100);
  const reviewLoad = scopedPendingReview + scopedDelayed;
  const reviewPressureRate = Math.round((reviewLoad / Math.max(scopedActiveProjects, 1)) * 100);
  const leadingDepartment = DEPARTMENTS.slice().sort((left, right) => right.successRate - left.successRate)[0];
  const flaggedDepartment = DEPARTMENTS.slice().sort(
    (left, right) => right.pendingReview + right.delayed - (left.pendingReview + left.delayed)
  )[0];

  const statusOverviewData = selectedDepartment
    ? [
        { name: 'Completed', value: selectedDepartment.completed, color: CHART_COLORS.primary },
        {
          name: 'In Progress',
          value: Math.max(selectedDepartment.inProgress - selectedDepartment.pendingReview - selectedDepartment.delayed, 0),
          color: CHART_COLORS.secondary
        },
        { name: 'Pending Review', value: selectedDepartment.pendingReview, color: CHART_COLORS.gold },
        { name: 'Delayed', value: selectedDepartment.delayed, color: CHART_COLORS.neutral }
      ]
    : [
        { name: 'Completed', value: totalCompleted, color: CHART_COLORS.primary },
        {
          name: 'In Progress',
          value: Math.max(totalActiveProjects - totalPendingReview - totalDelayed, 0),
          color: CHART_COLORS.secondary
        },
        { name: 'Pending Review', value: totalPendingReview, color: CHART_COLORS.gold },
        { name: 'Delayed', value: totalDelayed, color: CHART_COLORS.neutral }
      ];

  const monthlyTrendData = BASE_MONTHLY_TRENDS[yearFilter].map((entry) => ({
    month: entry.month,
    submissions: Math.max(2, Math.round(entry.submissions * scopeShare)),
    approvals: Math.max(1, Math.round(entry.approvals * scopeShare)),
    completions: Math.max(1, Math.round(entry.completions * scopeShare))
  }));

  const departmentComparisonData = DEPARTMENTS.map((department) => ({
    id: department.id,
    name: department.shortLabel,
    totalProjects: department.totalProjects,
    completed: department.completed,
    successRate: department.successRate,
    isSelected: selectedDepartment ? department.id === selectedDepartment.id : true
  }));

  const approvalQueueData = [
    { label: 'Pending', value: selectedDepartment ? selectedDepartment.pendingReview : 18, color: CHART_COLORS.gold },
    { label: 'Approved', value: Math.max(2, Math.round(42 * scopeShare)), color: CHART_COLORS.primary },
    { label: 'Needs Revision', value: Math.max(1, Math.round(11 * scopeShare)), color: CHART_COLORS.secondary },
    { label: 'Rejected', value: Math.max(1, Math.round(4 * scopeShare)), color: CHART_COLORS.neutral }
  ];

  const totalTrackedStatus = statusOverviewData.reduce((sum, item) => sum + item.value, 0);
  const pendingApprovals = approvalQueueData[0].value;
  const commandMetrics = [
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      detail: `${scopedCompleted} of ${scopedTotalProjects} records completed`,
      icon: 'fa-circle-check',
      tone: 'is-success'
    },
    {
      label: 'Review Pressure',
      value: `${reviewPressureRate}%`,
      detail: `${reviewLoad} records need movement`,
      icon: 'fa-triangle-exclamation',
      tone: reviewPressureRate >= 25 ? 'is-warning' : 'is-info'
    },
    {
      label: 'Deployment Rate',
      value: `${deploymentRate}%`,
      detail: `${scopedDeployed} projects transfer-ready`,
      icon: 'fa-handshake-angle',
      tone: 'is-info'
    }
  ];
  const priorityQueue = [
    {
      label: 'Pending Approvals',
      value: scopedPendingReview,
      detail: 'Research head endorsement',
      icon: 'fa-clock',
      tone: 'is-warning'
    },
    {
      label: 'Delayed Records',
      value: scopedDelayed,
      detail: 'Needs escalation path',
      icon: 'fa-triangle-exclamation',
      tone: scopedDelayed > 0 ? 'is-critical' : 'is-success'
    },
    {
      label: 'Transfer Ready',
      value: scopedDeployed,
      detail: 'Partner coordination pool',
      icon: 'fa-rocket',
      tone: 'is-info'
    }
  ];
  const departmentHealthCards = DEPARTMENTS.map((department) => ({
    ...department,
    completionRate: Math.round((department.completed / department.totalProjects) * 100),
    reviewLoad: department.pendingReview + department.delayed,
    isFocused: deptFilter === 'all' || deptFilter === department.id
  }));
  const kpiCards = [
    {
      title: 'Active Projects',
      value: scopedActiveProjects.toString(),
      subtitle: 'Institutional projects still moving through review, defense, or deployment.',
      trend: `${scopedCompleted} completed records`,
      icon: 'fa-diagram-project'
    },

    {
      title: 'Pending Approvals',
      value: pendingApprovals.toString(),
      subtitle: 'Approval items requiring research head review or institutional clearance.',
      trend: '6 due within 48 hours',
      icon: 'fa-clock'
    },
    {
      title: 'People Monitored',
      value: scopedPeople.toString(),
      subtitle: `${scopedStudents} students and ${scopedAdvisers} advisers currently represented in this scope.`,
      trend: `${scopedAdvisers} advisers`,
      icon: 'fa-users-line'
    }
  ];

  return (
    <>
      <AdminShell
        activeNav="dashboard"
        title="Research Head Dashboard"
        description="Monitor academic project performance, review pipeline health, and manage institutional reporting from one official oversight workspace."
      >
        <div className="admin-page-stack">
          <section className="dashboard-command-panel" aria-label="Research head operational snapshot" style={{ background: 'linear-gradient(135deg, #003A8F, #1A1851)', color: 'white', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0, 58, 143, 0.15)', position: 'relative', overflow: 'hidden', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(circle at top right, rgba(246, 190, 0, 0.15), transparent 70%)', pointerEvents: 'none' }}></div>
            
            <div className="dashboard-command-main" style={{ position: 'relative', zIndex: 1, flex: '1 1 500px' }}>
              <span className="kicker" style={{ color: '#F6BE00', background: 'rgba(246, 190, 0, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                <i className="fas fa-building-columns" aria-hidden="true"></i>
                Oversight Snapshot
              </span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.1, color: 'white' }}>{scopeLabel}</h2>
              <p style={{ color: '#DBEAFE', fontSize: '1.05rem', maxWidth: '600px', lineHeight: 1.6, marginBottom: '2rem' }}>
                {formatAcademicYear(yearFilter)} shows <strong>{scopedTotalProjects}</strong> project records, <strong>{reviewLoad}</strong> review flags,
                and <strong>{scopedDeployed}</strong> deployment-ready outputs across the current research oversight scope.
              </p>
              <div className="dashboard-scope-pills" aria-label="Department scope" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  aria-pressed={deptFilter === 'all'}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 700, border: '1px solid', transition: 'all 0.2s', cursor: 'pointer', ...(deptFilter === 'all' ? { background: '#F6BE00', color: '#1A1851', borderColor: '#F6BE00' } : { background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }) }}
                  type="button"
                  onClick={() => {
                    setDeptFilter('all');
                    showToast('All departments scope applied.');
                  }}
                >
                  All
                </button>
                {DEPARTMENTS.map((department) => (
                  <button
                    key={department.id}
                    aria-pressed={deptFilter === department.id}
                    style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 700, border: '1px solid', transition: 'all 0.2s', cursor: 'pointer', ...(deptFilter === department.id ? { background: '#F6BE00', color: '#1A1851', borderColor: '#F6BE00' } : { background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }) }}
                    type="button"
                    onClick={() => {
                      setDeptFilter(department.id);
                      showToast(`${department.name} scope applied.`);
                    }}
                  >
                    {department.shortLabel}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="dashboard-command-aside" style={{ position: 'relative', zIndex: 1, flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="dashboard-command-actions" aria-label="Primary dashboard actions" style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn" type="button" onClick={() => setModalOpen(true)} style={{ flex: 1, background: '#F6BE00', color: '#1A1851', border: 'none', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(246, 190, 0, 0.3)', cursor: 'pointer' }}>
                  <i className="fas fa-chart-line" aria-hidden="true"></i>
                  Generate Report
                </button>
                <Link className="btn" href="/admin/approvals" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backdropFilter: 'blur(10px)', textDecoration: 'none' }}>
                  <i className="fas fa-list-check" aria-hidden="true"></i>
                  Review Queue
                </Link>
              </div>
              <div className="dashboard-command-metrics" aria-label="Scope health metrics" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {commandMetrics.map((metric) => (
                  <article key={metric.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: metric.tone === 'is-warning' ? '#F6BE00' : metric.tone === 'is-success' ? '#4ADE80' : '#60A5FA', fontSize: '1.25rem' }}>
                      <i className={`fas ${metric.icon}`} aria-hidden="true"></i>
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.8rem', color: '#DBEAFE', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{metric.label}</span>
                      <strong style={{ fontSize: '1.25rem', color: 'white', lineHeight: 1.2 }}>{metric.value}</strong>
                      <small style={{ fontSize: '0.75rem', color: '#93C5FD' }}>{metric.detail}</small>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="dashboard-kpi-grid admin-grid-3" aria-label="Research head summary metrics" style={{ gap: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {kpiCards.map((card) => (
              <article key={card.title} className="stat-card dashboard-kpi-card" style={{ background: 'linear-gradient(135deg, #ffffff, #f8fafc)', border: '1px solid rgba(0, 58, 143, 0.1)', boxShadow: '0 12px 24px rgba(0, 58, 143, 0.04)', borderRadius: '1.25rem', overflow: 'hidden', padding: 0 }}>
                <div className="stat-card-head" style={{ padding: '1.5rem 1.5rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stat-card-title">
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>{card.title}</span>
                  </div>
                  <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', background: 'rgba(0, 58, 143, 0.05)', color: '#003A8F', borderRadius: '1rem', fontSize: '1.25rem' }}>
                    <i className={`fas ${card.icon}`}></i>
                  </div>
                </div>
                <div className="stat-card-value" style={{ padding: '0 1.5rem', fontSize: '3rem', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{card.value}</div>
                <div className="stat-card-footer" style={{ padding: '1rem 1.5rem 1.5rem', marginTop: '0.5rem' }}>
                  <span className="stat-card-subtitle" style={{ display: 'block', fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5, marginBottom: '0.75rem' }}>{card.subtitle}</span>
                  <span className="trend-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', background: '#F0FDF4', color: '#16A34A', fontSize: '0.8rem', fontWeight: 700, borderRadius: '2rem' }}>
                    <i className="fas fa-arrow-trend-up"></i> {card.trend}
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className="dashboard-department-strip" aria-label="Department health overview">
            <div className="dashboard-strip-head">
              <div>
                <span className="kicker">
                  <i className="fas fa-chart-simple" aria-hidden="true"></i>
                  Department Pulse
                </span>
                <h3>Performance by department</h3>
                <p>
                  {leadingDepartment.shortLabel} leads success rate at {leadingDepartment.successRate}%; {flaggedDepartment.shortLabel} has the largest review load.
                </p>
              </div>
              <span className="admin-inline-badge">{scopeLabel}</span>
            </div>
            <div className="dashboard-department-grid">
              {departmentHealthCards.map((department) => (
                <button
                  key={department.id}
                  aria-pressed={deptFilter === department.id}
                  className={`dashboard-department-card${department.isFocused ? ' is-focused' : ''}`}
                  type="button"
                  onClick={() => {
                    setDeptFilter(department.id);
                    showToast(`${department.name} Department selected.`);
                  }}
                >
                  <span className="dashboard-department-card-top">
                    <strong>{department.shortLabel}</strong>
                    <span>{department.completionRate}%</span>
                  </span>
                  <span className="dashboard-department-name">{department.name}</span>
                  <span className="dashboard-department-track" aria-hidden="true">
                    <i style={{ width: `${department.completionRate}%` }}></i>
                  </span>
                  <span className="dashboard-department-card-meta">
                    <span>{department.totalProjects} projects</span>
                    <span>{department.reviewLoad} flags</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="dashboard-analytics-grid dashboard-analytics-grid-top">
            <AdminChartCard badge={scopeLabel} description="Current project mix by lifecycle stage for the selected dashboard scope." title="Project Status Overview">
              <div className="dashboard-donut-layout">
                <div className="dashboard-donut-card">
                  <div className="dashboard-chart-frame dashboard-chart-frame-donut">
                    <ChartResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusOverviewData} dataKey="value" innerRadius={72} outerRadius={102} paddingAngle={3} stroke="none">
                          {statusOverviewData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ChartResponsiveContainer>
                    <div className="dashboard-donut-center">
                      <span>Total Tracked</span>
                      <strong>{totalTrackedStatus}</strong>
                    </div>
                  </div>
                </div>
                <div className="dashboard-insight-list">
                  {statusOverviewData.map((entry) => (
                    <div key={entry.name} className="dashboard-insight-item">
                      <div className="dashboard-insight-title">
                        <span className="dashboard-insight-dot" style={{ backgroundColor: entry.color }}></span>
                        <strong>{entry.name}</strong>
                      </div>
                      <div className="dashboard-insight-meta">
                        <span>{entry.value} records</span>
                        <span>{Math.round((entry.value / totalTrackedStatus) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AdminChartCard>

            <AdminChartCard badge={formatAcademicYear(yearFilter)} description="Monthly submission, approval, and completion movement for the selected academic year." title="Monthly Submission and Completion Trend">
              <div className="dashboard-chart-frame dashboard-chart-frame-large">
                <ChartResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                    <XAxis axisLine={false} dataKey="month" tick={AXIS_TICK} tickLine={false} />
                    <YAxis allowDecimals={false} axisLine={false} tick={AXIS_TICK} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line dataKey="submissions" dot={{ r: 3 }} stroke={CHART_COLORS.primary} strokeWidth={3} type="monotone" />
                    <Line dataKey="approvals" dot={{ r: 3 }} stroke={CHART_COLORS.secondary} strokeWidth={3} type="monotone" />
                    <Line dataKey="completions" dot={{ r: 3 }} stroke={CHART_COLORS.hover} strokeWidth={3} type="monotone" />
                  </LineChart>
                </ChartResponsiveContainer>
              </div>
              <div className="dashboard-chart-legend">
                <span><i className="fas fa-circle" style={{ color: CHART_COLORS.primary }}></i> Submissions</span>
                <span><i className="fas fa-circle" style={{ color: CHART_COLORS.secondary }}></i> Approvals</span>
                <span><i className="fas fa-circle" style={{ color: CHART_COLORS.hover }}></i> Completions</span>
              </div>
            </AdminChartCard>
          </section>

          <section className="dashboard-analytics-grid">
            <AdminChartCard badge={`${DEPARTMENTS.length} departments`} description="Compare volume, completions, and success rate across academic departments." title="Department Performance Comparison">
              <div className="dashboard-chart-frame dashboard-chart-frame-large">
                <ChartResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={departmentComparisonData}>
                    <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                    <XAxis axisLine={false} dataKey="name" tick={AXIS_TICK} tickLine={false} />
                    <YAxis allowDecimals={false} axisLine={false} tick={AXIS_TICK} tickLine={false} yAxisId="left" />
                    <YAxis allowDecimals={false} axisLine={false} orientation="right" tick={AXIS_TICK} tickFormatter={(value: number) => `${value}%`} tickLine={false} yAxisId="right" />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar barSize={18} dataKey="totalProjects" radius={[6, 6, 0, 0]} yAxisId="left">
                      {departmentComparisonData.map((entry) => (
                        <Cell key={`total-${entry.id}`} fill={selectedDepartment && !entry.isSelected ? '#DBEAFE' : CHART_COLORS.secondary} />
                      ))}
                    </Bar>
                    <Bar barSize={18} dataKey="completed" radius={[6, 6, 0, 0]} yAxisId="left">
                      {departmentComparisonData.map((entry) => (
                        <Cell key={`completed-${entry.id}`} fill={selectedDepartment && !entry.isSelected ? CHART_COLORS.neutral : CHART_COLORS.primary} />
                      ))}
                    </Bar>
                    <Line dataKey="successRate" dot={{ fill: CHART_COLORS.gold, r: 4 }} stroke={CHART_COLORS.gold} strokeWidth={3} type="monotone" yAxisId="right" />
                  </ComposedChart>
                </ChartResponsiveContainer>
              </div>
            </AdminChartCard>

            <AdminChartCard badge={`${adviserLoadData.length} advisers shown`} description="Current adviser supervision load based on projects under active research head monitoring." title="Adviser Load Distribution">
              <div className="dashboard-chart-frame dashboard-chart-frame-large">
                <ChartResponsiveContainer width="100%" height="100%">
                  <BarChart data={adviserLoadData} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" horizontal={false} />
                    <XAxis allowDecimals={false} axisLine={false} tick={AXIS_TICK} tickLine={false} type="number" />
                    <YAxis axisLine={false} dataKey="name" tick={AXIS_TICK} tickLine={false} type="category" width={116} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="projects" radius={[0, 8, 8, 0]}>
                      {adviserLoadData.map((adviser, index) => (
                        <Cell key={adviser.name} fill={index === 0 ? CHART_COLORS.primary : CHART_COLORS.secondary} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartResponsiveContainer>
              </div>
            </AdminChartCard>
          </section>

          <section className="dashboard-control-grid">
            <AdminChartCard badge={`${scopeLabel} | ${formatAcademicYear(yearFilter)}`} className="dashboard-control-card" description="Adjust the reporting scope, generate official outputs, and jump directly to high-frequency administrative actions." title="Dashboard Controls">
              <div className="dashboard-control-layout">
                <div className="dashboard-filter-grid">
                  <div className="field-group">
                    <label htmlFor="research-head-dashboard-department">Department</label>
                    <select className="toolbar-select" id="research-head-dashboard-department" value={deptFilter} onChange={(event) => { setDeptFilter(event.target.value); showToast('Department scope updated.'); }}>
                      <option value="all">All Departments</option>
                      {DEPARTMENTS.map((department) => (
                        <option key={department.id} value={department.id}>{department.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="research-head-dashboard-year">Academic Year</label>
                    <select className="toolbar-select" id="research-head-dashboard-year" value={yearFilter} onChange={(event) => { setYearFilter(event.target.value as keyof typeof YEAR_LABELS); showToast('Academic year filter applied.'); }}>
                      <option value="2024">Academic Year: 2023-2024</option>
                      <option value="2023">Academic Year: 2022-2023</option>
                      <option value="2022">Academic Year: 2021-2022</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Primary Action</label>
                    <button className="btn btn-primary" type="button" onClick={() => setModalOpen(true)}>
                      <i className="fas fa-chart-line"></i>
                      Generate Report
                    </button>
                  </div>
                  <div className="field-group">
                    <label>Export Action</label>
                    <button className="btn btn-outline" type="button" onClick={() => showToast('Data exported successfully.', 'success')}>
                      <i className="fas fa-download"></i>
                      Export Data
                    </button>
                  </div>
                </div>
                <div className="dashboard-quick-actions">
                  <Link className="btn btn-outline" href="/admin/reports"><i className="fas fa-chart-bar"></i> Open Reports</Link>
                  <Link className="btn btn-outline" href="/admin/projects"><i className="fas fa-folder-open"></i> Project Inventory</Link>
                  <Link className="btn btn-outline" href="/admin/announcements"><i className="fas fa-bullhorn"></i> Announcements</Link>
                  <Link className="btn btn-outline" href="/admin/approvals"><i className="fas fa-list-check"></i> Approval Queue</Link>
                </div>
              </div>
            </AdminChartCard>

            <AdminChartCard badge={`${pendingApprovals} pending`} description="Compact view of queue outcomes currently passing through the approval workflow." title="Approval Queue Analytics">
              <div className="dashboard-priority-grid" aria-label="Research head priority queue">
                {priorityQueue.map((item) => (
                  <article key={item.label} className={`dashboard-priority-card ${item.tone}`}>
                    <span>
                      <i className={`fas ${item.icon}`} aria-hidden="true"></i>
                    </span>
                    <div>
                      <strong>{item.value}</strong>
                      <small>{item.label}</small>
                      <p>{item.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="dashboard-chart-frame dashboard-chart-frame-compact">
                <ChartResponsiveContainer width="100%" height="100%">
                  <BarChart data={approvalQueueData}>
                    <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                    <XAxis axisLine={false} dataKey="label" tick={AXIS_TICK} tickLine={false} />
                    <YAxis allowDecimals={false} axisLine={false} tick={AXIS_TICK} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {approvalQueueData.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartResponsiveContainer>
              </div>
              <div className="dashboard-inline-metrics">
                {approvalQueueData.map((entry) => (
                  <div key={entry.label} className="dashboard-inline-metric">
                    <span>{entry.label}</span>
                    <strong>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </AdminChartCard>
          </section>

          <section className="dashboard-detail-grid">
            <section className="panel-card dashboard-table-card">
              <div className="panel-head">
                <div>
                  <span className="kicker"><i className="fas fa-chart-column"></i> Department Performance Table</span>
                  <h3>Department Performance Overview</h3>
                  <p>Detailed monitoring view for throughput, academic load, and departmental success rate.</p>
                </div>
                <div className="status-badge status-approved">{filteredDepartments.length} {filteredDepartments.length === 1 ? 'Department' : 'Departments'}</div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Department</th><th>Total Projects</th><th>Completed</th><th>In Progress</th><th>Pending Review</th><th>Delayed</th><th>Students Enrolled</th><th>Advisers</th><th>Success Rate</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map((department) => (
                      <tr key={department.id}>
                        <td><span className="dept-badge">{department.shortLabel}</span><span className="table-subtitle">{department.name}</span></td>
                        <td><span className="table-title">{department.totalProjects}</span><span className="table-subtitle">Registered capstone records</span></td>
                        <td>{department.completed}</td><td>{department.inProgress}</td><td>{department.pendingReview}</td><td>{department.delayed}</td><td>{department.students}</td><td>{department.advisers}</td>
                        <td><div className="progress-cluster"><div className="progress-container"><div className="progress-fill" style={{ width: `${department.successRate}%` }}></div></div><strong>{department.successRate}%</strong></div></td>
                        <td><button className="btn btn-outline small" type="button" onClick={() => showToast(`Viewing ${department.name} Department.`)}><i className="fas fa-eye"></i> Details</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </div>
      </AdminShell>

      {modalOpen ? (
        <div className="modal show" onClick={(event) => event.target === event.currentTarget && setModalOpen(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <div><h3><i className="fas fa-chart-line"></i> Generate Department Report</h3><p>Prepare an official department-focused output for review, endorsement, and executive monitoring.</p></div>
              <button className="close-modal" type="button" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label htmlFor="research-head-report-department">Department</label><select defaultValue={deptFilter} id="research-head-report-department"><option value="all">All Departments</option>{DEPARTMENTS.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div>
              <div className="form-group"><label htmlFor="research-head-report-year">Academic Year</label><select defaultValue={yearFilter} id="research-head-report-year"><option value="2024">Academic Year: 2023-2024</option><option value="2023">Academic Year: 2022-2023</option><option value="2022">Academic Year: 2021-2022</option></select></div>
              <div className="form-group"><label htmlFor="research-head-report-format">Output Format</label><select id="research-head-report-format"><option>PDF Document</option><option>Excel Workbook</option><option>Executive Briefing Pack</option></select></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" type="button" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" type="button" onClick={() => { setModalOpen(false); showToast('Report generated successfully.', 'success'); }}>Generate Report</button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="notification-toast" role="status">
          <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'info-circle'}`} style={{ color: toast.type === 'success' ? CHART_COLORS.green : CHART_COLORS.primary }}></i>
          <span>{toast.message}</span>
        </div>
      ) : null}
    </>
  );
}
