import { getAdviserDashboardData } from '@/lib/mock/adviser-dashboard';
import { AdviserDashboard } from '@/components/adviser/shared/components/adviser-dashboard';

export const metadata = {
  title: 'Dashboard - Adviser Portal'
};

export default async function Page() {
  const { data } = await getAdviserDashboardData();
  return <AdviserDashboard data={data} />;
}

