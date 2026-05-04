'use client';

import type { ReactNode } from 'react';
import { WORKSPACE_META } from '@/components/adviser/shared/config/dashboard-utils';
import { AdviserShellBrand } from '@/components/adviser/shared/components/adviser-shell-brand';
import { AdviserSidebarToggle } from '@/components/adviser/shared/components/adviser-sidebar-toggle';
import { useWorkspaceMode } from '@/components/adviser/shared/hooks/use-workspace-mode';

type AdviserPageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  titleId?: string;
  descriptionId?: string;
  showPageHeader?: boolean;
};

export function AdviserPageHeader({
  title,
  description,
  actions,
  titleId,
  descriptionId,
  showPageHeader = true
}: AdviserPageHeaderProps) {
  const { workspaceMode } = useWorkspaceMode();
  const workspaceMeta = WORKSPACE_META[workspaceMode];
  const secondaryMetaLabel =
    workspaceMode === 'adviser' ? 'IT supervision flow' : 'Defense evaluation flow';

  return (
    <>
      {showPageHeader ? (
        <div className="adviser-page-header">
          <div className="adviser-page-header-copy">
            <div className="adviser-page-header-context">
              <span className="adviser-page-header-kicker">{workspaceMeta.pillLabel}</span>
              <span className="adviser-page-header-breadcrumb" aria-hidden="true">
                <i className="fas fa-angle-right" />
                <span>{title}</span>
              </span>
            </div>
            <div className="page-title">
              <h1 id={titleId}>{title}</h1>
              <p id={descriptionId}>{description}</p>
            </div>
          </div>
          <div className="adviser-page-header-meta">
            <span className="adviser-page-header-chip adviser-page-header-chip-primary">
              <i className={`fas ${workspaceMeta.badgeIcon}`} />
              {workspaceMeta.badgeLabel}
            </span>
            <span className="adviser-page-header-chip">
              <i className={`fas ${workspaceMode === 'adviser' ? 'fa-users' : 'fa-clipboard-check'}`} />
              {secondaryMetaLabel}
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
