import '@/styles/student-workspace.css';
import { StudentProjectOverview } from '@/components/students/student-project-overview';
import { getStudentDashboardData } from '@/lib/mock/student-dashboard';

export const metadata = {
  title: 'ThesisTrack | Project Overview'
};

export default async function Page() {
  const { data } = await getStudentDashboardData();

  return <StudentProjectOverview data={data} />;
}
