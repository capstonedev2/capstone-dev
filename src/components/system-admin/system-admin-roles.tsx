'use client';

import { useId, useMemo, useState } from 'react';
import { SystemAdminShell } from '@/components/system-admin/system-admin-shell';
import {
  ActionLink,
  AdminPage,
  EmptyState,
  IconTile,
  type IconTone,
  KpiCard,
  PageHeader,
  SectionCard
} from '@/components/system-admin/ui';
import {
  getRolesAndPermissionsData,
  type Capability,
  type CapabilityArea,
  type PermissionGrant,
  type RoleKey,
  type RoleOrigin,
  type RoleSummary,
  type RoleTier
} from '@/mocks/system-admin/roles';
import styles from './system-admin-roles.module.css';

const numberFormat = new Intl.NumberFormat('en-US');

const AREA_LABELS: Record<CapabilityArea, string> = {
  accounts: 'Accounts',
  research: 'Research workflow',
  defense: 'Defense',
  repository: 'Repository & transfer',
  system: 'System configuration'
};

const AREA_ICONS: Record<CapabilityArea, string> = {
  accounts: 'fa-users-gear',
  research: 'fa-book-open',
  defense: 'fa-gavel',
  repository: 'fa-box-archive',
  system: 'fa-sliders'
};

const TIER_LABELS: Record<RoleTier, string> = {
  technical: 'Technical',
  oversight: 'Oversight',
  academic: 'Academic',
  learner: 'Student',
  external: 'Support & external'
};

const TIER_TONES: Record<RoleTier, IconTone> = {
  technical: 'primary',
  oversight: 'primary',
  academic: 'success',
  learner: 'accent',
  external: 'accent'
};

const ORIGIN_LABELS: Record<RoleOrigin, string> = {
  system_admin: 'Issued by System Admin',
  program_head: 'Issued by Program Head',
  self_register: 'Self-registers'
};

const ISSUER_LABELS = {
  system_admin: { label: 'System Administrator', icon: 'fa-server' },
  program_head: { label: 'Program Head', icon: 'fa-user-tie' },
  self_register: { label: 'Public sign-up', icon: 'fa-user-plus' }
} as const;

type AreaFilter = 'all' | CapabilityArea;

function grantText(grant: PermissionGrant | undefined) {
  if (!grant) return 'Not allowed';
  return grant.level === 'scoped' ? `Limited: ${grant.note}` : 'Allowed';
}

function PermissionMark({ grant, roleLabel }: { grant: PermissionGrant | undefined; roleLabel: string }) {
  const text = grantText(grant);
  const kind = !grant ? 'none' : grant.level;

  return (
    <span className={`${styles.mark} ${styles[`mark_${kind}`]}`} title={`${roleLabel}: ${text}`}>
      <i
        className={`fas ${kind === 'allowed' ? 'fa-check' : kind === 'scoped' ? 'fa-circle-half-stroke' : 'fa-minus'}`}
        aria-hidden="true"
      />
      <span className={styles.srOnly}>{text}</span>
    </span>
  );
}

export function SystemAdminRoles() {
  const data = useMemo(() => getRolesAndPermissionsData(), []);
  const { roles, capabilities, provisioning, notes } = data;
  const [selectedRole, setSelectedRole] = useState<RoleKey>('system_admin');
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all');
  const [query, setQuery] = useState('');
  const searchId = useId();

  const role = roles.find((item) => item.key === selectedRole) ?? roles[0];
  const roleByKey = useMemo(() => new Map(roles.map((item) => [item.key, item])), [roles]);
  const areas = useMemo(() => Array.from(new Set(capabilities.map((item) => item.area))), [capabilities]);

  const totalUsers = roles.reduce((sum, item) => sum + item.userCount, 0);
  // Adviser and Panelist share the /adviser portal, so count distinct portal roots.
  const portalCount = new Set(roles.map((item) => item.portalPath.split('/')[1])).size;
  const adminIssuedRoles = roles.filter((item) => item.origin === 'system_admin').length;
  const systemOnly = capabilities.filter((item) => Object.keys(item.grants).length === 1 && item.grants.system_admin).length;

  const visibleCapabilities = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return capabilities.filter(
      (item) =>
        (areaFilter === 'all' || item.area === areaFilter) &&
        (!normalized || `${item.label} ${item.description}`.toLowerCase().includes(normalized))
    );
  }, [areaFilter, capabilities, query]);

  const groupedCapabilities = useMemo(
    () =>
      areas
        .map((area) => ({ area, items: visibleCapabilities.filter((item) => item.area === area) }))
        .filter((group) => group.items.length),
    [areas, visibleCapabilities]
  );

  const roleProfile = useMemo(() => {
    const full: Capability[] = [];
    const limited: Capability[] = [];
    const none: Capability[] = [];

    capabilities.forEach((item) => {
      const grant = item.grants[role.key];
      (grant ? (grant.level === 'scoped' ? limited : full) : none).push(item);
    });

    return { full, limited, none };
  }, [capabilities, role.key]);

  const roleCanIssue = provisioning.find((rule) => rule.issuer === role.key);

  return (
    <SystemAdminShell
      activeNav="roles"
      title="Roles & Permissions"
      description="What each role can do, and who issues its accounts."
    >
      <AdminPage>
        <PageHeader
          actions={
            <ActionLink href="/system-admin/users" icon="fa-users-gear" variant="primary">
              Manage accounts
            </ActionLink>
          }
        />

        <aside className={styles.notice} aria-label="How permissions work">
          <IconTile icon="fa-shield-halved" />
          <div className={styles.noticeCopy}>
            <strong>Permissions are enforced by the system, not configured here.</strong>
            <span>
              This page is a read-only reference of what each role can do today. Every rule below names the API route that
              enforces it; changing a rule requires a code change.
            </span>
          </div>
          <span className={styles.readOnly}>
            <i className="fas fa-lock" aria-hidden="true" />
            Read-only
          </span>
        </aside>

        <section className={styles.kpiGrid} aria-label="Access summary">
          <KpiCard label="Roles" icon="fa-id-card-clip" value={numberFormat.format(roles.length)} helper={`Across ${portalCount} portals`} />
          <KpiCard
            label="Capabilities tracked"
            icon="fa-list-check"
            value={numberFormat.format(capabilities.length)}
            helper={`In ${areas.length} areas`}
          />
          <KpiCard
            label="Issued by System Admin"
            icon="fa-user-shield"
            iconTone="accent"
            accent="accent"
            value={numberFormat.format(adminIssuedRoles)}
            helper={`of ${roles.length} roles`}
          />
          <KpiCard
            label="System Admin only"
            icon="fa-lock"
            iconTone="accent"
            accent="accent"
            value={numberFormat.format(systemOnly)}
            helper="Capabilities no other role has"
          />
        </section>

        <div className={styles.split}>
          <SectionCard
            title="Role directory"
            description={`${roles.length} roles · ${numberFormat.format(totalUsers)} accounts`}
            icon="fa-people-group"
            titleId="roles-directory"
          >
            <div className={styles.roleGrid} role="group" aria-label="Choose a role to see its access profile">
              {roles.map((item) => {
                const isSelected = item.key === role.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.roleCard}${isSelected ? ` ${styles.roleCardSelected}` : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedRole(item.key)}
                  >
                    <IconTile icon={item.icon} tone={TIER_TONES[item.tier]} />
                    <span className={styles.roleCardText}>
                      <span className={styles.roleCardName}>{item.label}</span>
                      <span className={styles.roleCardMeta}>
                        {TIER_LABELS[item.tier]} · {numberFormat.format(item.userCount)} {item.userCount === 1 ? 'account' : 'accounts'}
                      </span>
                    </span>
                    {isSelected ? <i className={`fas fa-chevron-right ${styles.roleCardChevron}`} aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title={role.label}
            description={role.description}
            icon={role.icon}
            iconTone={TIER_TONES[role.tier]}
            accent="accent"
            titleId="roles-profile"
          >
            <dl className={styles.facts}>
              <div>
                <dt>Signs in to</dt>
                <dd>
                  <code>{role.portalPath}</code>
                </dd>
              </div>
              <div>
                <dt>Data scope</dt>
                <dd>{role.scope}</dd>
              </div>
              <div>
                <dt>Accounts</dt>
                <dd>{ORIGIN_LABELS[role.origin]}</dd>
              </div>
              <div>
                <dt>Can issue</dt>
                <dd>
                  {roleCanIssue
                    ? roleCanIssue.creates.map((key) => roleByKey.get(key)?.shortLabel ?? key).join(', ')
                    : 'No accounts'}
                </dd>
              </div>
            </dl>

            <div className={styles.profileLists}>
              <div>
                <h3 className={styles.profileHeading}>
                  <i className={`fas fa-check ${styles.headingAllowed}`} aria-hidden="true" />
                  Can do ({roleProfile.full.length})
                </h3>
                {roleProfile.full.length ? (
                  <ul className={styles.profileList}>
                    {roleProfile.full.map((item) => (
                      <li key={item.id}>{item.label}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.profileEmpty}>No unrestricted capabilities.</p>
                )}
              </div>

              {roleProfile.limited.length ? (
                <div>
                  <h3 className={styles.profileHeading}>
                    <i className={`fas fa-circle-half-stroke ${styles.headingScoped}`} aria-hidden="true" />
                    Limited ({roleProfile.limited.length})
                  </h3>
                  <ul className={styles.profileList}>
                    {roleProfile.limited.map((item) => {
                      const grant = item.grants[role.key];

                      return (
                        <li key={item.id}>
                          {item.label}
                          {grant?.level === 'scoped' ? <span className={styles.profileNote}>{grant.note}</span> : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              <p className={styles.profileNone}>
                <i className="fas fa-minus" aria-hidden="true" />
                No access to {roleProfile.none.length} of {capabilities.length} capabilities
              </p>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Permission matrix"
          description="Every capability by role. Select a role above to highlight its column."
          icon="fa-table-cells"
          titleId="roles-matrix"
        >
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <i className="fas fa-magnifying-glass" aria-hidden="true" />
              <label className={styles.srOnly} htmlFor={searchId}>
                Search capabilities
              </label>
              <input
                id={searchId}
                type="search"
                placeholder="Search capabilities"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className={styles.chips} role="group" aria-label="Filter by area">
              {(['all', ...areas] as AreaFilter[]).map((area) => (
                <button
                  key={area}
                  type="button"
                  className={`${styles.chip}${areaFilter === area ? ` ${styles.chipActive}` : ''}`}
                  aria-pressed={areaFilter === area}
                  onClick={() => setAreaFilter(area)}
                >
                  {area === 'all' ? 'All areas' : AREA_LABELS[area]}
                </button>
              ))}
            </div>
          </div>

          <ul className={styles.legend} aria-label="Legend">
            <li>
              <PermissionMark grant={{ level: 'allowed' }} roleLabel="Legend" /> Allowed
            </li>
            <li>
              <PermissionMark grant={{ level: 'scoped', note: '' }} roleLabel="Legend" /> Limited (hover for the limit)
            </li>
            <li>
              <PermissionMark grant={undefined} roleLabel="Legend" /> Not allowed
            </li>
          </ul>

          {groupedCapabilities.length ? (
            <div className={styles.matrixScroll} tabIndex={0} aria-label="Permission matrix, scrolls horizontally">
              <table className={styles.matrix}>
                <caption className={styles.srOnly}>Capabilities by role</caption>
                <thead>
                  <tr>
                    <th scope="col" className={styles.capabilityHead}>
                      Capability
                    </th>
                    {roles.map((item) => (
                      <th
                        key={item.key}
                        scope="col"
                        className={`${styles.roleHead}${item.key === role.key ? ` ${styles.colSelected}` : ''}`}
                      >
                        <button
                          type="button"
                          className={styles.roleHeadButton}
                          aria-pressed={item.key === role.key}
                          onClick={() => setSelectedRole(item.key)}
                        >
                          <i className={`fas ${item.icon}`} aria-hidden="true" />
                          <span>{item.shortLabel}</span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                {groupedCapabilities.map((group) => (
                  <tbody key={group.area}>
                    <tr className={styles.groupRow}>
                      <th scope="colgroup" colSpan={roles.length + 1}>
                        <i className={`fas ${AREA_ICONS[group.area]}`} aria-hidden="true" />
                        {AREA_LABELS[group.area]}
                      </th>
                    </tr>
                    {group.items.map((item) => (
                      <tr key={item.id}>
                        <th scope="row" className={styles.capabilityCell}>
                          <span className={styles.capabilityLabel}>{item.label}</span>
                          <span className={styles.capabilitySource}>{item.enforcedBy}</span>
                        </th>
                        {roles.map((column) => (
                          <td key={column.key} className={column.key === role.key ? styles.colSelected : undefined}>
                            <PermissionMark grant={item.grants[column.key]} roleLabel={column.label} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          ) : (
            <EmptyState icon="fa-magnifying-glass" message="No capabilities match your search." />
          )}
        </SectionCard>

        <div className={styles.split}>
          <SectionCard
            title="Who issues accounts"
            description="How each role gets an account."
            icon="fa-user-plus"
            accent="accent"
            titleId="roles-provisioning"
          >
            <ul className={styles.issueList}>
              {provisioning.map((rule) => {
                const issuer = ISSUER_LABELS[rule.issuer];

                return (
                  <li key={rule.id} className={styles.issueRow}>
                    <IconTile icon={issuer.icon} tone={rule.issuer === 'self_register' ? 'accent' : 'primary'} />
                    <div className={styles.issueBody}>
                      <span className={styles.issueTitle}>{issuer.label}</span>
                      <span className={styles.issueCondition}>{rule.condition}</span>
                      <span className={styles.issueRoles}>
                        {rule.creates.map((key) => {
                          const target: RoleSummary | undefined = roleByKey.get(key);

                          return (
                            <span key={key} className={styles.rolePill}>
                              <i className={`fas ${target?.icon ?? 'fa-user'}`} aria-hidden="true" />
                              {target?.shortLabel ?? key}
                            </span>
                          );
                        })}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <SectionCard title="Good to know" icon="fa-circle-info" titleId="roles-notes">
            <ul className={styles.noteList}>
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </AdminPage>
    </SystemAdminShell>
  );
}
