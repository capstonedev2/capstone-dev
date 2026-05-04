'use client';

import { useState } from 'react';
import {
  LIBRARY_NOTIFICATIONS,
  type LibraryNotification,
  getNotificationToneClass
} from '@/components/library/library-data';
import { LibraryStatCard } from '@/components/library/library-primitives';
import { LibraryShell } from '@/components/library/library-shell';

export function LibraryNotifications() {
  const [activeFilter, setActiveFilter] = useState<'all' | LibraryNotification['category']>('all');
  const [notifications, setNotifications] = useState([...LIBRARY_NOTIFICATIONS]);

  const visibleNotifications = notifications.filter((notification) =>
    activeFilter === 'all' ? true : notification.category === activeFilter
  );

  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const thisWeekCount = notifications.length;
  const savedStudyAlerts = notifications.filter(
    (notification) => notification.category === 'Saved Study Alerts'
  ).length;

  return (
    <LibraryShell
      activeNav="notifications"
      notificationCount={unreadCount}
      title="Notifications"
      description="Optional read-only updates for saved studies, new publications, and repository digests."
    >
      <section className="library-section-card">
        <div className="library-section-body">
          <div className="library-card-actions">
            <div className="library-filter-field library-filter-field-inline">
              <label htmlFor="library-notification-filter">Filter</label>
              <select
                id="library-notification-filter"
                value={activeFilter}
                onChange={(event) =>
                  setActiveFilter(
                    event.target.value as 'all' | LibraryNotification['category']
                  )
                }
              >
                <option value="all">All Notifications</option>
                <option value="New Publications">New Publications</option>
                <option value="Repository Updates">Repository Updates</option>
                <option value="Saved Study Alerts">Saved Study Alerts</option>
                <option value="Research Insights Digest">Research Insights Digest</option>
              </select>
            </div>

            <button
              className="library-btn is-outline"
              type="button"
              onClick={() =>
                setNotifications((current) =>
                  current.map((notification) => ({ ...notification, unread: false }))
                )
              }
            >
              Mark All as Read
            </button>
          </div>
        </div>
      </section>

      <div className="library-stat-grid">
        <LibraryStatCard title="Unread" value={unreadCount} />
        <LibraryStatCard title="This Week" value={thisWeekCount} />
        <LibraryStatCard title="Saved Study Alerts" value={savedStudyAlerts} />
      </div>

      <p className="library-note">
        E-Library users only receive repository updates and saved-study notices. These alerts are
        optional and read-only.
      </p>

      <section className="library-section-card">
        <div className="library-section-body">
          <div className="library-timeline">
            {visibleNotifications.map((notification) => (
              <article
                className={`library-notification-item${notification.unread ? ' is-unread' : ''}`}
                key={notification.id}
              >
                <div className="library-notification-row">
                  <span
                    className={`library-notification-icon ${getNotificationToneClass(notification.tone)}`}
                  >
                    <i className={`fas ${notification.icon}`} aria-hidden="true" />
                  </span>

                  <div className="library-notification-copy">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <small>{notification.timeLabel}</small>
                  </div>

                  {notification.unread ? (
                    <button
                      className="library-btn is-outline is-small"
                      type="button"
                      onClick={() =>
                        setNotifications((current) =>
                          current.map((item) =>
                            item.id === notification.id ? { ...item, unread: false } : item
                          )
                        )
                      }
                    >
                      Mark Read
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </LibraryShell>
  );
}
