import '@/styles/admin-dashboard.css';
import '@/styles/admin-portal-pages.css';
import { AdminLayout } from '@/components/layouts/admin-layout';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminLayout>{children}</AdminLayout>;
}
