'use client';

import { useMemo, useState } from 'react';
import {
  TECH_TRANSFER_DEPLOYMENTS,
  TECH_TRANSFER_TIMELINE,
  getTechTransferStatusTone,
  type TimelineMilestone
} from '@/components/tech-transfer/tech-transfer-data';
import {
  TechTransferButton,
  TechTransferDepartmentBadge,
  TechTransferModal,
  TechTransferStatCard,
  TechTransferStatusBadge
} from '@/components/tech-transfer/tech-transfer-primitives';
import { TechTransferShell } from '@/components/tech-transfer/tech-transfer-shell';

const EMPTY_MILESTONE: TimelineMilestone = {
  id: '',
  title: '',
  description: '',
  date: '',
  status: 'pending'
};

export function TechTransferDeployment() {
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deployments] = useState(() => [...TECH_TRANSFER_DEPLOYMENTS]);
  const [timeline, setTimeline] = useState<TimelineMilestone[]>(() => [...TECH_TRANSFER_TIMELINE]);
  const [editingMilestone, setEditingMilestone] = useState<TimelineMilestone>(EMPTY_MILESTONE);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredDeployments = useMemo(() => {
    return deployments.filter((deployment) => {
      const matchesDepartment = departmentFilter === 'all' || deployment.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || deployment.phase === statusFilter;
      return matchesDepartment && matchesStatus;
    });
  }, [departmentFilter, deployments, statusFilter]);

  return (
    <TechTransferShell
      activeNav="deployment"
      title="Deployment Tracking"
      description="Monitor technology transfer implementations with editable timeline"
      notificationCount={3}
    >
      <div className="filter-bar">
        <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
          <option value="all">All Departments</option>
          <option value="IT">IT</option>
          <option value="MET">MET</option>
          <option value="TCM">TCM</option>
          <option value="ESM">ESM</option>
          <option value="NAME">NAME</option>
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All Statuses</option>
          <option value="Fully Operational">Fully Operational</option>
          <option value="Testing Phase">Testing Phase</option>
          <option value="Planning">Planning</option>
        </select>
        <TechTransferButton
          variant="primary"
          onClick={() => {
            setEditingMilestone(EMPTY_MILESTONE);
            setModalOpen(true);
          }}
        >
          <i aria-hidden="true" className="fas fa-plus" />
          Add Milestone
        </TechTransferButton>
      </div>

      <div className="stats-grid">
        <TechTransferStatCard title="Active Deployments" value={TECH_TRANSFER_DEPLOYMENTS.length} />
        <TechTransferStatCard title="In Testing Phase" value={TECH_TRANSFER_DEPLOYMENTS.filter((item) => item.phase === 'Testing Phase').length} />
        <TechTransferStatCard title="Fully Operational" value={TECH_TRANSFER_DEPLOYMENTS.filter((item) => item.phase === 'Fully Operational').length} />
        <TechTransferStatCard title="Success Rate" value="91%" />
      </div>

      <section className="table-container">
        <div className="table-head">
          <div>
            <h3>Deployment Portfolio</h3>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Department</th>
                <th>Partner Company</th>
                <th>Deployment Date</th>
                <th>Current Phase</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeployments.map((deployment) => (
                <tr key={deployment.id}>
                  <td>{deployment.project}</td>
                  <td><TechTransferDepartmentBadge>{deployment.department}</TechTransferDepartmentBadge></td>
                  <td>{deployment.partner}</td>
                  <td>{deployment.deploymentDate}</td>
                  <td>
                    <TechTransferStatusBadge tone={getTechTransferStatusTone(deployment.phase)}>
                      {deployment.phase}
                    </TechTransferStatusBadge>
                  </td>
                  <td>{deployment.progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="table-container">
        <div className="timeline-header">
          <h3>Deployment Timeline</h3>
          <div className="table-actions">
            <TechTransferButton small onClick={() => setTimeline([...TECH_TRANSFER_TIMELINE])}>
              Reset Default
            </TechTransferButton>
          </div>
        </div>
        <div className="modal-body">
          <div className="timeline">
            {timeline.map((milestone) => (
              <div className={`timeline-item ${milestone.status}`} key={milestone.id}>
                <div className="timeline-content">
                  <h4>{milestone.title}</h4>
                  <p>{milestone.description}</p>
                  <p className="inline-note">{milestone.date}</p>
                  <div className="table-actions mt-2">
                    <TechTransferButton
                      small
                      onClick={() => {
                        setEditingMilestone(milestone);
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </TechTransferButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TechTransferModal
        open={modalOpen}
        title={editingMilestone.id ? 'Edit Milestone' : 'Add Milestone'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <TechTransferButton onClick={() => setModalOpen(false)}>Cancel</TechTransferButton>
            {editingMilestone.id ? (
              <TechTransferButton
                variant="danger"
                onClick={() => {
                  setTimeline((current) => current.filter((item) => item.id !== editingMilestone.id));
                  setModalOpen(false);
                }}
              >
                Delete
              </TechTransferButton>
            ) : null}
            <TechTransferButton
              variant="primary"
              onClick={() => {
                if (!editingMilestone.title.trim()) {
                  return;
                }

                setTimeline((current) => {
                  if (editingMilestone.id) {
                    return current.map((item) => (item.id === editingMilestone.id ? editingMilestone : item));
                  }

                  return [
                    ...current,
                    {
                      ...editingMilestone,
                      id: `milestone-${current.length + 1}`
                    }
                  ];
                });
                setModalOpen(false);
              }}
            >
              Save Milestone
            </TechTransferButton>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="tt-timeline-title">Title</label>
          <input
            id="tt-timeline-title"
            value={editingMilestone.title}
            onChange={(event) => setEditingMilestone((current) => ({ ...current, title: event.target.value }))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="tt-timeline-description">Description</label>
          <textarea
            id="tt-timeline-description"
            rows={3}
            value={editingMilestone.description}
            onChange={(event) =>
              setEditingMilestone((current) => ({ ...current, description: event.target.value }))
            }
          />
        </div>
        <div className="form-group">
          <label htmlFor="tt-timeline-date">Date</label>
          <input
            id="tt-timeline-date"
            type="date"
            value={editingMilestone.date}
            onChange={(event) => setEditingMilestone((current) => ({ ...current, date: event.target.value }))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="tt-timeline-status">Status</label>
          <select
            id="tt-timeline-status"
            value={editingMilestone.status}
            onChange={(event) =>
              setEditingMilestone((current) => ({
                ...current,
                status: event.target.value as TimelineMilestone['status']
              }))
            }
          >
            <option value="completed">Completed</option>
            <option value="current">Current</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </TechTransferModal>
    </TechTransferShell>
  );
}
