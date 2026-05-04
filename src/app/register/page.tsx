import { AuthLayout } from '@/components/layouts/auth-layout';
import { RegisterPage } from '@/components/auth/register-page';

export const metadata = {
  title: 'Register - ThesisTrack'
};

export default function Page() {
  return (
    <AuthLayout>
      <RegisterPage />
    </AuthLayout>
  );
}
