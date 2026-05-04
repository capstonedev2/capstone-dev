import { AuthLayout } from '@/components/layouts/auth-layout';
import { LoginPage } from '@/components/auth/login-page';

export const metadata = {
  title: 'Login - ThesisTrack'
};

export default function Page() {
  return (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  );
}
