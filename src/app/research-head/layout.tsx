import '@/styles/student-workspace.css';
import '@/styles/admin-dashboard.css';
import '@/styles/admin-portal-pages.css';
import '@/styles/admin-repository-approval.css';
import { ResearchHeadLayout } from '@/components/layouts/research-head-layout';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ResearchHeadLayout>{children}</ResearchHeadLayout>;
}
