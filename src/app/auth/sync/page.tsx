import { Suspense } from 'react';
import LandingPage from '../../page';
import { AuthSyncPage } from '@/components/auth/auth-sync-page';

export const metadata = {
  title: 'Signing In - ThesisTrack'
};

// Google sign-in hand-off: the landing page with the sync card on top (same style as the auth modal).
export default function Page() {
  return (
    <>
      <LandingPage />
      <Suspense fallback={null}>
        <AuthSyncPage />
      </Suspense>
    </>
  );
}
