import '@/styles/student-workspace.css';
import { StudentSchedule } from '@/components/students/student-schedule';
import { getStudentDashboardData } from '@/lib/mock/student-dashboard';

export const metadata = {
  title: 'ThesisTrack | Schedule'
};

export default async function Page() {
  const { data } = await getStudentDashboardData();

  return <StudentSchedule data={data} />;
}
