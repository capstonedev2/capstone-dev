'use client';

import { useMemo, useState } from 'react';
import {
  PARTNER_REQUESTS,
  getPartnerRequest,
  getPartnerStatusTone
} from '@/components/partner/partner-data';
import {
  PartnerButton,
  PartnerDepartmentBadge,
  PartnerModal,
  PartnerStatCard,
  PartnerStatusBadge
} from '@/components/partner/partner-primitives';
import { PartnerShell } from '@/components/partner/partner-shell';

export function PartnerRequests() {
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [search, setSearch] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState('');

  const filteredRequests = useMemo(() => {
    return PARTNER_REQUESTS.filter((request) => {
      const matchesDepartment =
        departmentFilter === 'All Departments' || request.department === departmentFilter;
      const matchesStatus = statusFilter === 'All Statuses' || request.status === statusFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term || request.projectTitle.toLowerCase().includes(term) || request.id.toLowerCase().includes(term);

      return matchesDepartment && matchesStatus && matchesSearch;
    });
  }, [departmentFilter, search, statusFilter]);

  const selectedRequest = getPartnerRequest(selectedRequestId || null);

  return (
    <PartnerShell
      activeNav="requests"
      title="My Adoption Requests"
      description="Track and manage your technology adoption requests"
      notificationCount={1}
    >
      <div className="filter-bar">
        <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
          <option>All Departments</option>
          <option>IT</option>
          <option>MET</option>
          <option>TCM</option>
          <option>ESM</option>
          <option>NAME</option>
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All Statuses</option>
          <option>Pending</option>
          <option>Under Review</option>
          <option>Approved</option>
          <option>Negotiation</option>
          <option>Completed</option>
        </select>
        <input
          placeholder="Search by project title..."
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="stats-grid">
        <PartnerStatCard title="Total Requests" value={PARTNER_REQUESTS.length} />
        <PartnerStatCard title="Pending Review" value={PARTNER_REQUESTS.filter((item) => item.status === 'Pending').length} />
        <PartnerStatCard title="Approved" value={PARTNER_REQUESTS.filter((item) => item.status === 'Approved').length} />
        <PartnerStatCard title="In Negotiation" value={PARTNER_REQUESTS.filter((item) => item.status === 'Negotiation').length} />
      </div>

      <section className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Project Title</th>
                <th>Department</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>
                    <strong>{request.projectTitle}</strong>
                  </td>
                  <td>
                    <PartnerDepartmentBadge>{request.department}</PartnerDepartmentBadge>
                  </td>
                  <td>{request.requestDate}</td>
                  <td>
                    <PartnerStatusBadge tone={getPartnerStatusTone(request.status)}>
                      {request.status}
                    </PartnerStatusBadge>
                  </td>
                  <td>{request.lastUpdate}</td>
                  <td>
                    <div className="table-actions">
                      <PartnerButton small onClick={() => setSelectedRequestId(request.id)}>
                        View
                      </PartnerButton>
                      {request.status === 'Approved' ? (
                        <PartnerButton small variant="primary">Proceed to MOA</PartnerButton>
                      ) : request.status === 'Pending' ? (
                        <PartnerButton small variant="danger">Cancel</PartnerButton>
                      ) : (
                        <PartnerButton small>Continue</PartnerButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="pagination">
        <button className="active" type="button">1</button>
        <button type="button">2</button>
        <button type="button">Next</button>
      </div>

      <PartnerModal
        open={Boolean(selectedRequestId)}
        title={`Request Details - ${selectedRequest.id}`}
        onClose={() => setSelectedRequestId('')}
        footer={
          <>
            <PartnerButton onClick={() => setSelectedRequestId('')}>Close</PartnerButton>
            <PartnerButton variant="primary" onClick={() => setSelectedRequestId('')}>
              Download MOA Draft
            </PartnerButton>
          </>
        }
      >
        <p><strong>Project:</strong> {selectedRequest.projectTitle}</p>
        <p><strong>Department:</strong> {selectedRequest.department}</p>
        <p><strong>Request Date:</strong> {selectedRequest.requestDate}</p>
        <p>
          <strong>Status:</strong>{' '}
          <PartnerStatusBadge tone={getPartnerStatusTone(selectedRequest.status)}>
            {selectedRequest.status}
          </PartnerStatusBadge>
        </p>
        <p><strong>Implementation Plan:</strong> {selectedRequest.implementationPlan}</p>
        <p><strong>Timeline:</strong> {selectedRequest.timeline}</p>
        <p><strong>Budget Range:</strong> {selectedRequest.budgetRange}</p>
        <p><strong>TTO Comments:</strong> {selectedRequest.comments}</p>
      </PartnerModal>
    </PartnerShell>
  );
}
