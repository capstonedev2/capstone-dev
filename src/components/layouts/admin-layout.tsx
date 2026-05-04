import { ProtectedRoute } from '@/components/auth/protected-route';

export function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedRoute allowedRole={['research_head', 'admin']}>{children}</ProtectedRoute>;
}
