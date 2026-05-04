'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type NotificationTone = 'primary' | 'info' | 'warning' | 'danger' | 'success' | 'neutral';

export type PortalNotificationItem = {
  id: string;
  title: string;
  message: string;
  href: string;
  icon: string;
  meta: string;
  tone?: NotificationTone;
  actionLabel?: string;
  unread?: boolean;
};

export type PortalProfileBadge = {
  label: string;
  icon: string;
  tone?: 'primary' | 'neutral' | 'warning';
};

export type PortalProfileAction = {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
};

type PortalShellActionMenusProps = {
  notificationHref: string;
  notificationCount?: number;
  notificationButtonLabel?: string;
  notificationTitle: string;
  notificationDescription: string;
  notificationItems: PortalNotificationItem[];
  notificationFooterLabel?: string;
  notificationEmptyTitle?: string;
  notificationEmptyMessage?: string;
  profileName: string;
  profileSubtitle: string;
  profileDetail?: string;
  profileBadges?: PortalProfileBadge[];
  extraProfileSection?: ReactNode;
  profileActions: PortalProfileAction[];
};

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getShortName(value: string) {
  return value.split(' ').filter(Boolean).slice(0, 2).join(' ') || value;
}

export function PortalShellActionMenus({
  notificationHref,
  notificationCount = 0,
  notificationButtonLabel = 'Notifications',
  notificationTitle,
  notificationDescription,
  notificationItems,
  notificationFooterLabel = 'See all notifications',
  notificationEmptyTitle = 'All caught up',
  notificationEmptyMessage = 'No notification is waiting right now.',
  profileName,
  profileSubtitle,
  profileDetail,
  profileBadges = [],
  extraProfileSection,
  profileActions
}: PortalShellActionMenusProps) {
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!notificationMenuRef.current?.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
      }

      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadPreviewCount = notificationItems.filter((item) => item.unread !== false).length;
  const urgentPreviewCount = notificationItems.filter((item) => item.tone === 'danger' || item.tone === 'warning').length;

  return (
    <div className="portal-shell-action-menus">
      <div className="portal-shell-notification-shell" ref={notificationMenuRef}>
        <button
          aria-expanded={notificationMenuOpen ? 'true' : 'false'}
          aria-haspopup="menu"
          className={`portal-shell-notification-trigger${notificationMenuOpen ? ' is-open' : ''}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setProfileMenuOpen(false);
            setNotificationMenuOpen((current) => !current);
          }}
        >
          <span className="portal-shell-notification-trigger-icon">
            <i aria-hidden="true" className="fas fa-bell" />
          </span>
          <span className="portal-shell-notification-trigger-copy">
            <strong>{notificationButtonLabel}</strong>
            <small>{notificationCount ? `${notificationCount} unread` : 'All caught up'}</small>
          </span>
          {notificationCount ? <span className="portal-shell-notification-trigger-count">{notificationCount}</span> : null}
        </button>

        <div className={`portal-shell-notification-menu${notificationMenuOpen ? ' is-open' : ''}`}>
          <div className="portal-shell-notification-menu-hero">
            <div className="portal-shell-notification-menu-hero-copy">
              <span className="portal-shell-notification-menu-kicker">Inbox</span>
              <strong>{notificationTitle}</strong>
              <small>{notificationDescription}</small>
            </div>
            <Link
              className="portal-shell-notification-menu-view-all"
              href={notificationHref}
              onClick={() => setNotificationMenuOpen(false)}
            >
              Open center
            </Link>
          </div>

          <div className="portal-shell-notification-menu-summary">
            <span className="portal-shell-notification-summary-pill is-primary">
              <i aria-hidden="true" className="fas fa-envelope-open-text" />
              {notificationCount || unreadPreviewCount ? `${notificationCount || unreadPreviewCount} unread` : '0 unread'}
            </span>
            <span className={`portal-shell-notification-summary-pill${urgentPreviewCount ? ' is-danger' : ''}`}>
              <i aria-hidden="true" className="fas fa-bolt" />
              {urgentPreviewCount ? `${urgentPreviewCount} urgent` : 'No urgent items'}
            </span>
          </div>

          {notificationItems.length ? (
            <div className="portal-shell-notification-menu-list" role="menu" aria-label={`${notificationButtonLabel} preview`}>
              {notificationItems.map((item) => (
                <Link
                  key={item.id}
                  className={`portal-shell-notification-menu-item${item.unread === false ? '' : ' is-unread'}`}
                  href={item.href}
                  onClick={() => setNotificationMenuOpen(false)}
                >
                  <span className={`portal-shell-notification-menu-item-icon is-${item.tone || 'neutral'}`}>
                    <i aria-hidden="true" className={`fas ${item.icon}`} />
                  </span>
                  <span className="portal-shell-notification-menu-item-copy">
                    <span className="portal-shell-notification-menu-item-head">
                      <strong>{item.title}</strong>
                      {item.unread === false ? null : <span aria-hidden="true" className="portal-shell-notification-menu-item-dot" />}
                    </span>
                    <small>{item.message}</small>
                    <span className="portal-shell-notification-menu-item-footer">
                      <span className="portal-shell-notification-menu-item-meta">{item.meta}</span>
                      <span className="portal-shell-notification-menu-item-cta">
                        {item.actionLabel || 'Open'}
                        <i aria-hidden="true" className="fas fa-arrow-right" />
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="portal-shell-notification-menu-empty">
              <strong>{notificationEmptyTitle}</strong>
              <p>{notificationEmptyMessage}</p>
            </div>
          )}

          <div className="portal-shell-notification-menu-footer">
            <Link
              className="portal-shell-notification-menu-footer-link"
              href={notificationHref}
              onClick={() => setNotificationMenuOpen(false)}
            >
              {notificationFooterLabel}
              <i aria-hidden="true" className="fas fa-arrow-up-right-from-square" />
            </Link>
          </div>
        </div>
      </div>

      <div className="portal-shell-profile-shell" ref={profileMenuRef}>
        <div className={`portal-shell-profile-menu${profileMenuOpen ? ' is-open' : ''}`}>
          <button
            aria-expanded={profileMenuOpen ? 'true' : 'false'}
            aria-haspopup="menu"
            className="portal-shell-profile-trigger"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setNotificationMenuOpen(false);
              setProfileMenuOpen((current) => !current);
            }}
          >
            <span className="portal-shell-profile-avatar">{getInitials(profileName)}</span>
            <span className="portal-shell-profile-copy">
              <strong>{getShortName(profileName)}</strong>
              <small>{profileSubtitle}</small>
            </span>
            <i aria-hidden="true" className="fas fa-chevron-down portal-shell-profile-chevron" />
          </button>

          <div className="portal-shell-profile-dropdown" role="menu" aria-label="User menu">
            <div className="portal-shell-profile-dropdown-header">
              <strong>{profileName}</strong>
              <span>{profileDetail || profileSubtitle}</span>
            </div>

            {profileBadges.length ? (
              <div className="portal-shell-profile-dropdown-section">
                <span className="portal-shell-profile-dropdown-label">Workspace</span>
                <div className="portal-shell-profile-badges">
                  {profileBadges.map((badge) => (
                    <span
                      key={`${badge.label}-${badge.icon}`}
                      className={`portal-shell-profile-badge${badge.tone === 'primary' ? ' is-primary' : badge.tone === 'warning' ? ' is-warning' : ''}`}
                    >
                      <i aria-hidden="true" className={`fas ${badge.icon}`} />
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {extraProfileSection ? (
              <>
                <div className="portal-shell-profile-dropdown-divider" />
                <div className="portal-shell-profile-dropdown-section">{extraProfileSection}</div>
              </>
            ) : null}

            <div className="portal-shell-profile-dropdown-divider" />

            <div className="portal-shell-profile-dropdown-links">
              {profileActions.map((action) =>
                action.href ? (
                  <Link
                    key={`${action.label}-${action.href}`}
                    className={`portal-shell-profile-link${action.danger ? ' is-danger' : ''}`}
                    href={action.href}
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <i aria-hidden="true" className={`fas ${action.icon}`} />
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={`${action.label}-${action.icon}`}
                    className={`portal-shell-profile-link${action.danger ? ' is-danger' : ''}`}
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      action.onClick?.();
                    }}
                  >
                    <i aria-hidden="true" className={`fas ${action.icon}`} />
                    {action.label}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
