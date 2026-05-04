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
  RECENT_PROJECTS,
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
  const filteredRecentProjects = selectedDepartment
    ? RECENT_PROJECTS.filter((project) => project.department === selectedDepartment.id)
    : RECENT_PROJECTS;
  const adviserLoadData = (
    selectedDepartment
      ? ADVISER_LOADS.filter((adviser) => adviser.department === selectedDepartment.id)
      : ADVISER_LOADS
  )
    .slice()
    .sort((left, right) => right.projects - left.projects)
    .slice(0, 6);

  const totalProjects = DEPARTMENTS.reduce((sum, department) => sum + department.totalProjects, 0);
  const totalUsers = DEPARTMENTS.reduce((sum, department) => sum + department.students + department.advisers, 0);
  const totalCompleted = DEPARTMENTS.reduce((sum, department) => sum + department.completed, 0);
  const totalActiveProjects = DEPARTMENTS.reduce((sum, department) => sum + department.inProgress, 0);
  const totalDeployed = DEPARTMENTS.reduce((sum, department) => sum + department.deployed, 0);
  const totalPendingReview = DEPARTMENTS.reduce((sum, department) => sum + department.pendingReview, 0);
  const totalDelayed = DEPARTMENTS.reduce((sum, department) => sum + department.delayed, 0);
  const scopeLabel = selectedDepartment ? `${selectedDepartment.name} Department` : 'All Departments';
  const scopeShare = selectedDepartment ? selectedDepartment.totalProjects / totalProjects : 1;

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
  const kpiCards = [
    {
      title: 'Total Users',
      value: totalUsers.toLocaleString(),
      subtitle: 'Student, adviser, and academic leadership accounts currently in scope.',
      trend: '+4.8% this semester',
      icon: 'fa-users'
    },
    {
      title: 'Active Projects',
      value: totalActiveProjects.toString(),
      subtitle: 'Institutional projects still moving through review, defense, or deployment.',
      trend: `${totalCompleted} completed records`,
      icon: 'fa-diagram-project'
    },
    {
      title: 'Technology Transfer',
      value: totalDeployed.toString(),
      subtitle: 'Projects endorsed for pilot use, partner adoption, or deployment support.',
      trend: '5 newly endorsed this term',
      icon: 'fa-rocket'
    },
    {
      title: 'Pending Approvals',
      value: pendingApprovals.toString(),
      subtitle: 'Approval items requiring research head review or institutional clearance.',
      trend: '6 due within 48 hours',
      icon: 'fa-clock'
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
          <section className="dashboard-kpi-grid" aria-label="Research head summary metrics">
            {kpiCards.map((card) => (
              <article key={card.title} className="stat-card dashboard-kpi-card">
                <div className="stat-card-head">
                  <div className="stat-card-title">
                    <span>{card.title}</span>
                  </div>
                  <div className="stat-icon">
                    <i className={`fas ${card.icon}`}></i>
                  </div>
                </div>
                <div className="stat-card-value">{card.value}</div>
                <div className="stat-card-footer">
                  <span className="stat-card-subtitle">{card.subtitle}</span>
                  <span className="trend-up">{card.trend}</span>
                </div>
              </article>
            ))}
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
                    <label>Department</label>
                    <select className="toolbar-select" value={deptFilter} onChange={(event) => { setDeptFilter(event.target.value); showToast('Department scope updated.'); }}>
                      <option value="all">All Departments</option>
                      {DEPARTMENTS.map((department) => (
                        <option key={department.id} value={department.id}>{department.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Academic Year</label>
                    <select className="toolbar-select" value={yearFilter} onChange={(event) => { setYearFilter(event.target.value as keyof typeof YEAR_LABELS); showToast('Academic year filter applied.'); }}>
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
                  <Link className="btn btn-outline" href="/admin/users"><i className="fas fa-users-viewfinder"></i> User Monitoring</Link>
                  <Link className="btn btn-outline" href="/admin/reports"><i className="fas fa-chart-bar"></i> Open Reports</Link>
                  <Link className="btn btn-outline" href="/admin/projects"><i className="fas fa-folder-open"></i> Project Inventory</Link>
                  <Link className="btn btn-outline" href="/admin/technology-transfer"><i className="fas fa-handshake-angle"></i> Technology Transfer</Link>
                  <Link className="btn btn-outline" href="/admin/announcements"><i className="fas fa-bullhorn"></i> Announcements</Link>
                  <Link className="btn btn-outline" href="/admin/approvals"><i className="fas fa-list-check"></i> Approval Queue</Link>
                </div>
              </div>
            </AdminChartCard>

            <AdminChartCard badge={`${pendingApprovals} pending`} description="Compact view of queue outcomes currently passing through the approval workflow." title="Approval Queue Analytics">
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

            <div className="dashboard-side-stack">
              <AdminChartCard badge={`${filteredRecentProjects.length} latest records`} description="Latest submissions and approval-ready records entering the institutional review flow." title="Recent Activity">
                <div className="dashboard-activity-list">
                  {filteredRecentProjects.map((project) => (
                    <article key={project.id} className="dashboard-activity-item">
                      <div>
                        <div className="dashboard-activity-title-row"><strong>{project.title}</strong><span className={`status-badge ${project.statusClass}`}>{project.statusLabel}</span></div>
                        <span className="dashboard-activity-meta">{project.department} | {project.adviser} | {project.date}</span>
                        <p>{project.stage}</p>
                      </div>
                      <button className="btn btn-outline small" type="button" onClick={() => showToast(`Opening ${project.title}.`)}><i className="fas fa-arrow-up-right-from-square"></i> Open</button>
                    </article>
                  ))}
                </div>
              </AdminChartCard>
            </div>
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
              <div className="form-group"><label>Department</label><select defaultValue={deptFilter}><option value="all">All Departments</option>{DEPARTMENTS.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div>
              <div className="form-group"><label>Academic Year</label><select defaultValue={yearFilter}><option value="2024">Academic Year: 2023-2024</option><option value="2023">Academic Year: 2022-2023</option><option value="2022">Academic Year: 2021-2022</option></select></div>
              <div className="form-group"><label>Output Format</label><select><option>PDF Document</option><option>Excel Workbook</option><option>Executive Briefing Pack</option></select></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" type="button" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" type="button" onClick={() => { setModalOpen(false); showToast('Report generated successfully.', 'success'); }}>Generate Report</button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="notification-toast">
          <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'info-circle'}`} style={{ color: toast.type === 'success' ? CHART_COLORS.green : CHART_COLORS.primary }}></i>
          <span>{toast.message}</span>
        </div>
      ) : null}
    </>
  );
}
