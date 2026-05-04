import { ProtectedRoute } from '@/components/auth/protected-route';

export function AdviserLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedRoute allowedRole="adviser">{children}</ProtectedRoute>;
}
