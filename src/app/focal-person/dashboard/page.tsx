'use client';

import { FocalDashboard } from '@/components/focal-person/focal-dashboard';
import { FocalPersonShell } from '@/components/focal-person/focal-person-shell';

export default function Page() {
  return <FocalPersonShell activeNav="dashboard">{() => <FocalDashboard />}</FocalPersonShell>;
}
