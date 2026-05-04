import { AdviserDashboard } from '@/components/adviser/shared/components/adviser-dashboard';
import { getAdviserDashboardData } from '@/lib/mock/adviser-dashboard';

export const metadata = {
  title: 'Dashboard - Panel Portal'
};

export default async function Page() {
  const { data } = await getAdviserDashboardData();
  return <AdviserDashboard data={data} />;
}

