import { LiveDefenseView } from '@/components/adviser/panel-mode/live-defense';
import { getAdviserDashboardData } from '@/lib/mock/adviser-dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Defense Mode | Panel | ThesisTrack',
};

export default async function LiveDefensePage() {
  const { data } = await getAdviserDashboardData();
  return <LiveDefenseView data={data} />;
}
