import '@/styles/adviser-dashboard.css';
import { AdviserLayout } from '@/components/layouts/adviser-layout';
import { AdviserLayoutShell } from '@/components/adviser/shared/components/adviser-layout-shell';
import { getAdviserDashboardData } from '@/lib/mock/adviser-dashboard';

export default async function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data } = await getAdviserDashboardData();

  return (
    <AdviserLayout>
      <AdviserLayoutShell data={data}>
        {children}
      </AdviserLayoutShell>
    </AdviserLayout>
  );
}
