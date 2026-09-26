# Placeholders

Screens that currently render **mock data**, and where each section's real data will come from.
When a section is wired up, replace its mock with an API call and remove it from this list.

## System Admin → Dashboard (`/system-admin/dashboard`)

- **Component:** `src/components/system-admin/system-admin-dashboard.tsx`
- **Mock data:** `src/mocks/system-admin/dashboard.ts` (`getSystemAdminDashboardMock()`, typed as `SystemAdminDashboardData`)

| Section | Mock fields | Future data source |
|---|---|---|
| KPI row (Total users, Active accounts, Suspended, Staff accounts) | `kpis` | `users` table (counts by status, role, `createdAt` in the last 7 days, `suspendedUntil` within this week) |
| Users by role | `usersByRole` | `users` table (count grouped by role) |
| Needs attention | `needsAttention` | `users` table (suspensions ending this week, staff still on a temporary password, student registrations today) |
| Recent account activity | `recentActivity` | A future `audit_log` table (account created / suspended / restored, branding changes). Does not exist yet. |
| Status banner (maintenance mode, academic year, student registration, last branding update) | `portalStatus` | System settings and branding (`SystemSetting` rows, e.g. `system.themeBranding` `updatedAt`) |

Notes:
- "Staff haven't changed their temporary password" needs a flag on `users` that doesn't exist yet.
- Maintenance mode, academic year, and registration policy are not persisted anywhere yet (the Settings and Maintenance pages are also placeholders).

## System Admin → Roles & Permissions (`/system-admin/roles`)

- **Component:** `src/components/system-admin/system-admin-roles.tsx`
- **Data:** `src/mocks/system-admin/roles.ts` (`getRolesAndPermissionsData()`, typed as `RolesAndPermissionsData`)

| Section | Fields | Status / future data source |
|---|---|---|
| Role directory, KPIs | `roles[].userCount` | **Mock.** Count of `users` grouped by role. |
| Permission matrix, role profile | `capabilities[].grants` | **Mirrors the code**, not mock: copied from the role checks in the API routes named in `enforcedBy` and the portal layouts' `ProtectedRoute`. Update this file whenever a route's allowed roles change (or generate it from the route guards later). |
| Who issues accounts | `provisioning` | Mirrors `POST /api/users` rules. |
| Good to know | `notes` | Static notes about current behavior. |

