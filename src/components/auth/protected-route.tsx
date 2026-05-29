'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const AUTH_CHECK_TTL_MS = 60_000;
let lastVerifiedAuth: { userKey: string; role: UserRole; checkedAt: number } | null = null;

function getAuthUserKey(user: { id?: number; email?: string; role?: UserRole }) {
  return `${user.id ?? 'unknown'}:${user.email ?? 'unknown'}:${user.role ?? 'unknown'}`;
}

function hasFreshRoleVerification(user: { id?: number; email?: string; role?: UserRole }) {
  return Boolean(
    user.role &&
    lastVerifiedAuth?.userKey === getAuthUserKey(user) &&
    lastVerifiedAuth.role === user.role &&
    Date.now() - lastVerifiedAuth.checkedAt < AUTH_CHECK_TTL_MS
  );
}

function rememberVerifiedRole(user: { id?: number; email?: string; role: UserRole }) {
  lastVerifiedAuth = {
    userKey: getAuthUserKey(user),
    role: user.role,
    checkedAt: Date.now()
  };
}

export function ProtectedRoute({ allowedRole, children }: ProtectedRouteProps) {
  const router = useRouter();
  const allowedRoleKey = Array.isArray(allowedRole) ? allowedRole.join('|') : allowedRole;
  const allowedRoles = useMemo(
    () => allowedRoleKey.split('|') as UserRole[],
    [allowedRoleKey]
  );
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      const storedUser = getStoredUser();

      if (!storedUser || !storedUser.role) {
        lastVerifiedAuth = null;
        logout();

        if (!cancelled) {
          setIsAuthorized(false);
          router.replace('/login');
        }
        return;
      }

      if (!allowedRoles.includes(storedUser.role)) {
        if (!cancelled) {
          setIsAuthorized(false);
          router.replace(getRoleRedirectPath(storedUser.role));
        }
        return;
      }

      if (!cancelled) {
        setIsAuthorized(true);
      }

      if (hasFreshRoleVerification(storedUser)) {
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
          lastVerifiedAuth = null;
          logout();

          if (!cancelled) {
            setIsAuthorized(false);
            router.replace('/login');
          }
          return;
        }

        if (!allowedRoles.includes(payload.user.role)) {
          lastVerifiedAuth = null;

          if (!cancelled) {
            setIsAuthorized(false);
            router.replace(getRoleRedirectPath(payload.user.role));
          }
          return;
        }

        rememberVerifiedRole({ ...storedUser, role: payload.user.role });

        if (!cancelled) {
          setIsAuthorized(true);
        }
      } catch {
        lastVerifiedAuth = null;
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
  }, [allowedRoleKey, allowedRoles, router]);

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
