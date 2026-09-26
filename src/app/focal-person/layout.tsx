import '@/styles/student-workspace.css';
import '@/styles/admin-dashboard.css';
import '@/styles/admin-portal-pages.css';
import { ProtectedRoute } from '@/components/auth/protected-route';

// Research Focal Person workspace: accounts with the focal_person role (created by the System Admin).
// Every API behind it checks the role and the account's department again on the server.
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ProtectedRoute allowedRole="focal_person">{children}</ProtectedRoute>;
}
