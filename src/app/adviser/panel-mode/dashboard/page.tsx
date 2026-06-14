import { getAdviserDashboardData } from '@/lib/mock/adviser-dashboard';
import { AdviserDashboard } from '@/components/adviser/shared/components/adviser-dashboard';

export const metadata = {
  title: 'Dashboard - Panel Portal'
};

import { requireAuthenticatedUser, buildDisplayName } from '@/lib/auth';

export default async function Page() {
  const user = await requireAuthenticatedUser();
  const { data } = await getAdviserDashboardData();
  data.profile.fullName = buildDisplayName(user) || 'Adviser';
  return <AdviserDashboard data={data} />;
}

