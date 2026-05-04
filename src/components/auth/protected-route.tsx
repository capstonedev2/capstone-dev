'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getRoleRedirectPath, getStoredUser, logout, type UserRole } from '@/lib/mock/auth';

type ProtectedRouteProps = Readonly<{
  allowedRole: UserRole | UserRole[];
  children: React.ReactNode;
}>;

type AuthMeResponse = {
  success?: boolean;
  user?: {
    role?: UserRole;
  };
};

export function ProtectedRoute({ allowedRole, children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
  const allowedRoleKey = allowedRoles.join('|');

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      const storedUser = getStoredUser();

      if (!storedUser || !storedUser.role) {
        logout();

        if (!cancelled) {
          setIsAuthorized(false);
          router.replace('/login');
        }
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'same-origin'
        });
        const payload = response.headers.get('content-type')?.includes('application/json')
          ? ((await response.json()) as AuthMeResponse)
          : null;

        if (!response.ok || !payload?.success || !payload.user?.role) {
          logout();

          if (!cancelled) {
            setIsAuthorized(false);
            router.replace('/login');
          }
          return;
        }

        if (!allowedRoles.includes(payload.user.role)) {
          if (!cancelled) {
            setIsAuthorized(false);
            router.replace(getRoleRedirectPath(payload.user.role));
          }
          return;
        }

        if (!cancelled) {
          setIsAuthorized(true);
        }
      } catch {
        logout();

        if (!cancelled) {
          setIsAuthorized(false);
          router.replace('/login');
        }
      }
    }

    void verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [allowedRoleKey, pathname, router]);

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
