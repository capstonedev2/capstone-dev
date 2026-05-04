import '@/styles/student-workspace.css';
import { StudentProjectFiles } from '@/components/students/student-project-files';
import { getStudentDashboardData } from '@/lib/mock/student-dashboard';

export const metadata = {
  title: 'ThesisTrack | Project Files'
};

export default async function Page() {
  const { data } = await getStudentDashboardData();

  return <StudentProjectFiles data={data} />;
}
