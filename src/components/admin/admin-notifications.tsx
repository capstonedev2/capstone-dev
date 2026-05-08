'use client';

import { useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    category: 'Repository Updates',
    department: 'All',
    icon: 'fa-folder-open',
    iconColor: 'var(--primary)',
    title: 'Repository Publication Queue Updated',
    message: '7 approved manuscripts are ready for library release after final metadata review.',
    time: '20 minutes ago',
    unread: true
  },
  {
    id: 'notif-2',
    category: 'Department Alerts',
    department: 'TCM',
    icon: 'fa-hourglass-half',
    iconColor: 'var(--warning)',
    title: 'Department Escalation: TCM Title Reviews Delayed',
    message: '2 title approvals have exceeded the review window and need research-head follow-up today.',
    time: '1 hour ago',
    unread: true
  },
  {
    id: 'notif-4',
    category: 'Approval Queue',
    department: 'All',
    icon: 'fa-chart-line',
    iconColor: 'var(--warning)',
    title: 'Quarterly Research Summary Ready',
    message: 'The Q1 2026 school research summary is ready for review and endorsement.',
    time: 'Yesterday, 8:15 AM',
    unread: false
  },
  {
    id: 'notif-5',
    category: 'Repository Updates',
    department: 'IT',
    icon: 'fa-tags',
    iconColor: 'var(--primary)',
    title: 'Library Metadata Completion Needed',
    message: '5 published records are missing final keywords or abstract tags before archiving.',
    time: 'Yesterday, 1:30 PM',
    unread: false
  },
  {
    id: 'notif-6',
    category: 'Approval Queue',
    department: 'All',
    icon: 'fa-handshake',
    iconColor: 'var(--success)',
    title: 'Transfer Endorsement Logged',
    message: 'The AI Inventory System endorsement package was forwarded to TTO for partner onboarding.',
    time: '2 days ago',
    unread: false
  }
];

export function AdminNotifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [categoryFilter, setCategoryFilter] = useState('All Notifications');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [modalOpen, setModalOpen] = useState(false);

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((item) => {
        const matchesCategory = categoryFilter === 'All Notifications' || item.category === categoryFilter;
        const matchesDepartment =
          departmentFilter === 'All Departments' || item.department === departmentFilter || item.department === 'All';
        return matchesCategory && matchesDepartment;
      }),
    [categoryFilter, departmentFilter, notifications]
  );

  const markRead = (id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  };

  return (
    <>
      <AdminShell
        activeNav="notifications"
        title="Research Head Notifications"
        description="Review approvals, department backlogs, repository releases, and school-level follow-ups."
      >
        <div className="admin-page-stack">
          <div className="admin-toolbar compact">
            <div className="span-3">
              <select className="admin-toolbar-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option>All Notifications</option>
                <option>Approval Queue</option>
                <option>Department Alerts</option>
                <option>Repository Updates</option>
              </select>
            </div>
            <div className="span-3">
              <select className="admin-toolbar-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                <option>All Departments</option>
                <option>IT</option>
                <option>MET</option>
                <option>TCM</option>
                <option>ESM</option>
                <option>NAME</option>
              </select>
            </div>
            <div className="span-6 admin-toolbar-actions">
              <button className="btn btn-outline" type="button" onClick={markAllAsRead}>
                Mark All as Read
              </button>
              <button className="btn btn-primary" type="button" onClick={() => setModalOpen(true)}>
                <i className="fas fa-paper-plane"></i>
                Send Notification
              </button>
            </div>
          </div>

          <section className="admin-grid-4">
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Unread</span>
              <strong className="admin-kpi-value">3</strong>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Action Required</span>
              <strong className="admin-kpi-value">3</strong>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">This Week</span>
              <strong className="admin-kpi-value">18</strong>
            </article>
            <article className="admin-kpi-card">
              <span className="admin-kpi-label">Pending Review</span>
              <strong className="admin-kpi-value">14</strong>
            </article>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-head">
              <div>
                <h3>Institutional Queue</h3>
                <p>High-signal notifications that affect approvals, repository releases, and operational coordination.</p>
              </div>
            </div>
            <div className="admin-section-body">
              <div className="admin-list">
                {filteredNotifications.map((item) => (
                  <article key={item.id} className={`admin-notification-card ${item.unread ? 'is-unread' : ''}`}>
                    <div className="admin-notification-icon" style={{ color: item.iconColor }}>
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong>{item.title}</strong>
                      <span className="admin-table-meta">{item.message}</span>
                      <span className="admin-note" style={{ display: 'block', marginTop: '0.45rem' }}>
                        {item.time}
                      </span>
                    </div>
                    {item.unread ? (
                      <button className="btn btn-outline small" type="button" onClick={() => markRead(item.id)}>
                        Mark Read
                      </button>
                    ) : null}
                  </article>
                ))}
                {filteredNotifications.length === 0 ? (
                  <div className="admin-empty-state">No notifications match the current filters.</div>
                ) : null}
              </div>
            </div>
          </section>

          <div className="admin-pagination">
            <button className="active" type="button">
              1
            </button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">Next</button>
          </div>
        </div>
      </AdminShell>

      {modalOpen ? (
        <div className="modal show" onClick={(event) => event.target === event.currentTarget && setModalOpen(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3>Send Research Notification</h3>
                <p>Broadcast a message to the selected user group, department, or institutional audience.</p>
              </div>
              <button className="close-modal" type="button" onClick={() => setModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="admin-form-grid">
                <div className="form-group">
                  <label>Recipient</label>
                  <select defaultValue="All Users">
                    <option>All Users</option>
                    <option>All Students</option>
                    <option>All Advisers</option>
                    <option>IT Department</option>
                    <option>MET Department</option>
                    <option>TCM Department</option>
                    <option>ESM Department</option>
                    <option>NAME Department</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select defaultValue="Normal">
                    <option>Normal</option>
                    <option>Important</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input placeholder="Notification title" />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea placeholder="Enter notification content..." rows={5}></textarea>
              </div>
              <label className="admin-check-card">
                <input type="checkbox" />
                <span>
                  <strong>Send email notification as well</strong>
                </span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={() => setModalOpen(false)}>
                Send Notification
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
