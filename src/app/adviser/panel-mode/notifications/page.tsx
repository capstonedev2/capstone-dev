import { AdviserNotifications } from '@/components/adviser/shared/components/adviser-notifications';
import { getAdviserDashboardData } from '@/lib/mock/adviser-dashboard';

export const metadata = {
  title: 'Notifications - Panel Portal'
};

export default async function Page() {
  const { data } = await getAdviserDashboardData();
  return <AdviserNotifications data={data} />;
}
