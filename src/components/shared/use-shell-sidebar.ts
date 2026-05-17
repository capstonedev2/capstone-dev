'use client';

import { useCallback, useEffect, useState } from 'react';

type UseShellSidebarOptions = {
  mobileBreakpoint: number;
  storageKey: string;
};

export function useShellSidebar({
  mobileBreakpoint,
  storageKey
}: UseShellSidebarOptions) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue === 'true') {
      setSidebarCollapsed(true);
    }

    setPreferencesReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !preferencesReady) {
      return;
    }

    window.localStorage.setItem(storageKey, sidebarCollapsed ? 'true' : 'false');
  }, [preferencesReady, sidebarCollapsed, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);

    const handleMediaChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const nextIsMobile = event.matches;
      setIsMobile(nextIsMobile);

      if (!nextIsMobile) {
        setSidebarOpen(false);
      }
    };

    handleMediaChange(mediaQuery);

    const listener = (event: MediaQueryListEvent) => {
      handleMediaChange(event);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }

    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }, [mobileBreakpoint]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen((current) => !current);
      return;
    }

    setSidebarCollapsed((current) => !current);
  }, [isMobile]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleLabel = isMobile
    ? sidebarOpen
      ? 'Close sidebar'
      : 'Open sidebar'
    : sidebarCollapsed
      ? 'Expand sidebar'
      : 'Collapse sidebar';

  const toggleIconClass = isMobile
    ? sidebarOpen
      ? 'fa-xmark'
      : 'fa-bars'
    : sidebarCollapsed
      ? 'fa-chevron-right'
      : 'fa-bars';

  return {
    closeSidebar,
    isMobile,
    sidebarCollapsed,
    sidebarOpen,
    toggleIconClass,
    toggleLabel,
    toggleSidebar
  };
}
