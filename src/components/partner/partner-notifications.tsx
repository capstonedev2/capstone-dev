'use client';

import { useMemo, useState } from 'react';
import { PARTNER_NOTIFICATIONS, getPartnerStatusTone } from '@/components/partner/partner-data';
import { PartnerButton, PartnerModal, PartnerStatusBadge } from '@/components/partner/partner-primitives';
import { PartnerShell } from '@/components/partner/partner-shell';

export function PartnerNotifications() {
  const [filter, setFilter] = useState('All Notifications');
  const [notifications, setNotifications] = useState(() => [...PARTNER_NOTIFICATIONS]);
  const [selectedNotificationId, setSelectedNotificationId] = useState('');

  const visibleNotifications = useMemo(() => {
    if (filter === 'Unread Only') {
      return notifications.filter((item) => item.unread);
    }

    return notifications;
  }, [filter, notifications]);

  const selectedNotification =
    notifications.find((item) => item.id === selectedNotificationId) ?? notifications[0];

  return (
    <PartnerShell
      activeNav="notifications"
      title="Notifications"
      description="Stay updated on request status, MOA activity, and implementation actions"
      notificationCount={notifications.filter((item) => item.unread).length}
    >
      <div className="filter-bar">
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option>All Notifications</option>
          <option>Unread Only</option>
        </select>
        <PartnerButton
          onClick={() =>
            setNotifications((current) => current.map((item) => ({ ...item, unread: false })))
          }
        >
          Mark All as Read
        </PartnerButton>
      </div>

      <div className="notification-list">
        {visibleNotifications.map((notification) => (
          <article className={`notification-item${notification.unread ? ' unread' : ''}`} key={notification.id}>
            <strong>{notification.title}</strong>
            <p>{notification.message}</p>
            <div className="notification-meta">
              <span>{notification.timeLabel}</span>
              <PartnerStatusBadge tone={getPartnerStatusTone(notification.tone)}>
                {notification.tone}
              </PartnerStatusBadge>
            </div>
            <div className="card-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <PartnerButton
                small
                onClick={() => {
                  setSelectedNotificationId(notification.id);
                  setNotifications((current) =>
                    current.map((item) => (item.id === notification.id ? { ...item, unread: false } : item))
                  );
                }}
              >
                Open
              </PartnerButton>
              {notification.actionLabel ? <span className="pill">{notification.actionLabel}</span> : null}
            </div>
          </article>
        ))}
      </div>

      <PartnerModal
        open={Boolean(selectedNotificationId)}
        title={selectedNotification.title}
        onClose={() => setSelectedNotificationId('')}
        footer={<PartnerButton variant="primary" onClick={() => setSelectedNotificationId('')}>Close</PartnerButton>}
      >
        <p>{selectedNotification.message}</p>
        <p className="inline-note">{selectedNotification.timeLabel}</p>
      </PartnerModal>
    </PartnerShell>
  );
}
