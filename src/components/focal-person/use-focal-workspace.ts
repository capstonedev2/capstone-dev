'use client';

import { useCallback, useEffect, useState } from 'react';
import { FocalServiceError, getMyDepartment, getMyNotifications } from '@/lib/focal-person/service';
import type { FocalDepartment, FocalNotification } from '@/lib/focal-person/types';

type WorkspaceState = {
  loading: boolean;
  department: FocalDepartment | null;
  /** Why there is no department to show: the account has none (409) or something failed. */
  problem: 'no_department' | 'error' | null;
  message: string;
};

/**
 * The signed-in focal person's department, as the server decides it from their account.
 * (The route layout already only admits FOCAL_PERSON accounts.)
 */
export function useFocalWorkspace(): WorkspaceState {
  const [state, setState] = useState<WorkspaceState>({ loading: true, department: null, problem: null, message: '' });

  useEffect(() => {
    let cancelled = false;

    getMyDepartment()
      .then((department) => {
        if (!cancelled) setState({ loading: false, department, problem: null, message: '' });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const status = error instanceof FocalServiceError ? error.status : 0;
        const message = error instanceof Error ? error.message : 'Could not load your department.';
        setState({ loading: false, department: null, problem: status === 409 ? 'no_department' : 'error', message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** The focal person's own notifications; refreshes when any menu marks notifications read. */
export function useFocalNotifications() {
  const [data, setData] = useState<{ unreadCount: number; notifications: FocalNotification[] }>({ unreadCount: 0, notifications: [] });

  const load = useCallback(() => {
    getMyNotifications()
      .then(setData)
      .catch(() => {
        // The bell just stays empty; the page itself still works.
      });
  }, []);

  useEffect(() => {
    load();
    window.addEventListener('thesistrack:notifications-updated', load);
    return () => window.removeEventListener('thesistrack:notifications-updated', load);
  }, [load]);

  return data;
}
