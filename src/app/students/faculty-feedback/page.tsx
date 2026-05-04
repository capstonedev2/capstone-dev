import '@/styles/student-workspace.css';
import { StudentFacultyFeedback } from '@/components/students/student-faculty-feedback';
import { getStudentDashboardData } from '@/lib/mock/student-dashboard';

export const metadata = {
  title: 'ThesisTrack | Faculty Feedback'
};

export default async function Page() {
  const { data } = await getStudentDashboardData();

  return <StudentFacultyFeedback data={data} />;
}
