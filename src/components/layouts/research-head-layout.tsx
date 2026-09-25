import { ProtectedRoute } from '@/components/auth/protected-route';

export function ResearchHeadLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedRoute allowedRole={['research_head', 'admin']}>{children}</ProtectedRoute>;
}
