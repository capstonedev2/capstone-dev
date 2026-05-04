import '@/styles/student-workspace.css';
import { StudentTitleSubmission } from '@/components/students/student-title-submission';
import { getStudentDashboardData } from '@/lib/mock/student-dashboard';

export const metadata = {
  title: 'ThesisTrack | Title Submission'
};

export default async function Page() {
  const { data } = await getStudentDashboardData();

  return <StudentTitleSubmission data={data} />;
}
