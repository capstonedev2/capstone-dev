/**
 * Data for System Admin → Roles & Permissions (/system-admin/roles).
 *
 * Shaped like a future API response. The permission grants below MIRROR what the code enforces today
 * (portal layouts via ProtectedRoute, API routes via requireAuthenticatedUser(..., roles) and in-handler
 * checks); each capability names the route that enforces it so this stays auditable. Only the per-role
 * user counts are mock numbers. See PLACEHOLDERS.md.
 */

export type RoleKey =
  | 'system_admin'
  | 'research_head'
  | 'program_head'
  | 'adviser'
  | 'panel'
  | 'focal_person'
  | 'student'
  | 'library'
  | 'partner'
  | 'tech_transfer';

export type RoleTier = 'technical' | 'oversight' | 'academic' | 'learner' | 'external';

/** Who issues accounts for this role. */
export type RoleOrigin = 'system_admin' | 'program_head' | 'self_register';

export type RoleSummary = {
  key: RoleKey;
  label: string;
  /** Column header in the matrix. */
  shortLabel: string;
  icon: string;
  tier: RoleTier;
  description: string;
  /** Where this role lands after signing in. */
  portalPath: string;
  /** How far this role's data access reaches. */
  scope: string;
  origin: RoleOrigin;
  /** MOCK: number of accounts with this role. */
  userCount: number;
};

export type CapabilityArea = 'accounts' | 'research' | 'defense' | 'repository' | 'system';

/** 'scoped' = allowed, but only within a limit that the code enforces (see the note). */
export type PermissionGrant = { level: 'allowed' } | { level: 'scoped'; note: string };

export type Capability = {
  id: string;
  area: CapabilityArea;
  label: string;
  description: string;
  /** Roles not listed have no access. */
  grants: Partial<Record<RoleKey, PermissionGrant>>;
  /** Where the rule is enforced, e.g. "POST /api/users". */
  enforcedBy: string;
};

export type ProvisioningRule = {
  id: string;
  issuer: 'system_admin' | 'program_head' | 'self_register';
  creates: RoleKey[];
  condition: string;
};

export type RolesAndPermissionsData = {
  roles: RoleSummary[];
  capabilities: Capability[];
  provisioning: ProvisioningRule[];
  notes: string[];
};

const allowed: PermissionGrant = { level: 'allowed' };
const scoped = (note: string): PermissionGrant => ({ level: 'scoped', note });

export function getRolesAndPermissionsData(): RolesAndPermissionsData {
  return {
    roles: [
      {
        key: 'system_admin',
        label: 'System Administrator',
        shortLabel: 'System Admin',
        icon: 'fa-server',
        tier: 'technical',
        description: 'Runs the platform: staff accounts, branding, and technical settings.',
        portalPath: '/system-admin',
        scope: 'System-wide',
        origin: 'system_admin',
        userCount: 3
      },
      {
        key: 'research_head',
        label: 'Research Head',
        shortLabel: 'Research Head',
        icon: 'fa-building-columns',
        tier: 'oversight',
        description: 'Oversees research across programs and releases work to the repository.',
        portalPath: '/research-head',
        scope: 'All programs',
        origin: 'system_admin',
        userCount: 4
      },
      {
        key: 'program_head',
        label: 'Program Head',
        shortLabel: 'Program Head',
        icon: 'fa-user-tie',
        tier: 'academic',
        description: 'Manages one department: advisers, defense schedules, and monitoring.',
        portalPath: '/program-head',
        scope: 'Own department',
        origin: 'system_admin',
        userCount: 5
      },
      {
        key: 'adviser',
        label: 'Adviser',
        shortLabel: 'Adviser',
        icon: 'fa-chalkboard-user',
        tier: 'academic',
        description: 'Guides groups, reviews titles and documents, and evaluates defenses.',
        portalPath: '/adviser/adviser-mode',
        scope: 'Advised groups',
        origin: 'program_head',
        userCount: 41
      },
      {
        key: 'panel',
        label: 'Panelist',
        shortLabel: 'Panelist',
        icon: 'fa-clipboard-check',
        tier: 'academic',
        description: 'Reviews and votes on defenses as a panel member.',
        portalPath: '/adviser/panel-mode',
        scope: 'Assigned defenses',
        origin: 'system_admin',
        userCount: 17
      },
      {
        key: 'focal_person',
        label: 'Research Focal Person',
        shortLabel: 'Focal Person',
        icon: 'fa-user-tag',
        tier: 'academic',
        description: "Monitors their department's research progress, delayed groups, defenses, and reports.",
        portalPath: '/focal-person',
        scope: 'Own department',
        origin: 'system_admin',
        userCount: 5
      },
      {
        key: 'student',
        label: 'Student',
        shortLabel: 'Student',
        icon: 'fa-user-graduate',
        tier: 'learner',
        description: 'Registers titles, submits work, and tracks milestones for their group.',
        portalPath: '/students',
        scope: 'Own group',
        origin: 'self_register',
        userCount: 1152
      },
      {
        key: 'library',
        label: 'Library Personnel',
        shortLabel: 'Library',
        icon: 'fa-book-open-reader',
        tier: 'external',
        description: 'Works with the published research repository.',
        portalPath: '/library',
        scope: 'Published research',
        origin: 'system_admin',
        userCount: 28
      },
      {
        key: 'partner',
        label: 'Industry Partner',
        shortLabel: 'Partner',
        icon: 'fa-handshake',
        tier: 'external',
        description: 'External collaborator for matching, feedback, and deployments.',
        portalPath: '/partner',
        scope: 'Published research',
        origin: 'system_admin',
        userCount: 19
      },
      {
        key: 'tech_transfer',
        label: 'Tech Transfer Officer',
        shortLabel: 'Tech Transfer',
        icon: 'fa-arrow-up-right-dots',
        tier: 'external',
        description: 'Tracks deployments and technology transfer of completed projects.',
        portalPath: '/tech-transfer',
        scope: 'Transfer workflow',
        origin: 'system_admin',
        userCount: 15
      }
    ],

    capabilities: [
      // ---- Accounts
      {
        id: 'view-directory',
        area: 'accounts',
        label: 'View the user directory',
        description: 'Browse accounts, roles, and suspension status.',
        grants: {
          system_admin: allowed,
          research_head: allowed,
          program_head: scoped('Students and advisers in their department only')
        },
        enforcedBy: 'GET /api/users'
      },
      {
        id: 'create-accounts',
        area: 'accounts',
        label: 'Create accounts',
        description: 'Issue new accounts with a temporary password.',
        grants: {
          system_admin: scoped('Any staff role; students must self-register'),
          program_head: scoped('Adviser accounts in their department only')
        },
        enforcedBy: 'POST /api/users'
      },
      {
        id: 'edit-accounts',
        area: 'accounts',
        label: 'Edit account details',
        description: "Update another user's profile information.",
        grants: { system_admin: allowed, research_head: allowed, program_head: allowed },
        enforcedBy: 'PATCH /api/users/[id]'
      },
      {
        id: 'suspend-accounts',
        area: 'accounts',
        label: 'Suspend and restore accounts',
        description: 'Temporarily block or restore sign-in.',
        grants: { system_admin: allowed, program_head: allowed },
        enforcedBy: 'PATCH /api/users/[id]/suspension'
      },

      // ---- Research workflow
      {
        id: 'submit-titles',
        area: 'research',
        label: 'Register and submit titles',
        description: 'Draft title proposals and submit them for review.',
        grants: { student: scoped('For their own group') },
        enforcedBy: 'POST /api/title-submissions, /api/title-drafts'
      },
      {
        id: 'review-titles',
        area: 'research',
        label: 'Review title submissions',
        description: 'Approve, return, or reject proposed titles.',
        grants: { system_admin: allowed, research_head: allowed, program_head: allowed, adviser: allowed, panel: allowed },
        enforcedBy: 'PATCH /api/title-submissions'
      },
      {
        id: 'upload-documents',
        area: 'research',
        label: 'Upload project documents',
        description: 'Add chapters, evidence, and other files to a project.',
        grants: {
          system_admin: allowed,
          research_head: allowed,
          program_head: allowed,
          adviser: allowed,
          panel: allowed,
          student: scoped('For their own group')
        },
        enforcedBy: 'POST /api/document-files'
      },
      {
        id: 'review-documents',
        area: 'research',
        label: 'Comment on documents',
        description: 'Leave review comments on submitted files.',
        grants: { system_admin: allowed, research_head: allowed, adviser: allowed, panel: allowed },
        enforcedBy: 'POST /api/review-comments'
      },
      {
        id: 'monitor-department',
        area: 'research',
        label: 'Monitor department research',
        description: "Read a department's groups, documents, progress reports, and defense schedules.",
        grants: {
          system_admin: allowed,
          research_head: allowed,
          program_head: scoped('Their own department'),
          focal_person: scoped('Their own department, read-only')
        },
        enforcedBy: 'GET /api/document-files, /api/defense-schedules, /api/progress-reports, /api/focal-person/overview'
      },
      {
        id: 'progress-reports',
        area: 'research',
        label: 'Submit progress reports',
        description: 'File periodic progress updates.',
        grants: { student: scoped('For their own group') },
        enforcedBy: 'POST /api/progress-reports'
      },

      // ---- Defense
      {
        id: 'schedule-defenses',
        area: 'defense',
        label: 'Schedule defenses',
        description: 'Create defense schedules and assign panels.',
        grants: { system_admin: allowed, program_head: allowed },
        enforcedBy: 'POST /api/defense-schedules'
      },
      {
        id: 'review-evidence',
        area: 'defense',
        label: 'Review defense applications',
        description: 'Accept or return signed defense application evidence.',
        grants: { system_admin: allowed, research_head: allowed, program_head: allowed, adviser: allowed },
        enforcedBy: 'PATCH /api/defense-application-evidence'
      },
      {
        id: 'evaluate-defenses',
        area: 'defense',
        label: 'Evaluate and vote on defenses',
        description: 'Score defenses and submit panel votes.',
        grants: { adviser: allowed, panel: allowed },
        enforcedBy: 'POST /api/advisers/evaluations'
      },

      // ---- Repository & transfer
      {
        id: 'publish-repository',
        area: 'repository',
        label: 'Approve and publish to the repository',
        description: 'Release finished projects to the institutional repository.',
        grants: { system_admin: allowed, research_head: allowed },
        enforcedBy: 'POST /api/repository/publish'
      },
      {
        id: 'manage-deployments',
        area: 'repository',
        label: 'Manage technology deployments',
        description: 'Record deployments and transfer progress.',
        grants: { system_admin: allowed, research_head: allowed, tech_transfer: allowed },
        enforcedBy: '/api/tech-transfer/deployments'
      },
      {
        id: 'document-templates',
        area: 'repository',
        label: 'Publish document templates',
        description: 'Upload the official defense application template.',
        grants: { research_head: allowed },
        enforcedBy: 'POST /api/concept-defense-application-template'
      },

      // ---- System configuration
      {
        id: 'branding',
        area: 'system',
        label: 'Change theme and branding',
        description: 'Edit names, colors, logos, and public page content.',
        grants: { system_admin: allowed },
        enforcedBy: 'PUT /api/branding'
      },
      {
        id: 'branding-media',
        area: 'system',
        label: 'Upload branding media',
        description: 'Upload logos and images used across the portal.',
        grants: { system_admin: allowed },
        enforcedBy: 'POST /api/admin/media/upload'
      }
    ],

    provisioning: [
      {
        id: 'prov-sa',
        issuer: 'system_admin',
        creates: ['system_admin', 'research_head', 'program_head', 'adviser', 'panel', 'focal_person', 'library', 'partner'],
        condition: 'Any department'
      },
      {
        id: 'prov-ph',
        issuer: 'program_head',
        creates: ['adviser'],
        condition: 'Their own department only'
      },
      {
        id: 'prov-self',
        issuer: 'self_register',
        creates: ['student'],
        condition: 'Public sign-up; Google sign-up links a verified email'
      }
    ],

    notes: [
      'Program Heads can also open the Adviser workspace (the adviser portal allows Adviser, Panelist, and Program Head).',
      'The legacy "Admin" role is no longer assigned; existing legacy accounts get Research Head access.',
      'Library and Partner portals have no role-restricted API actions yet; they only read public repository data.',
      'Tech Transfer Officer accounts can\'t be created from User Management yet (the role is missing from its role picker).'
    ]
  };
}
