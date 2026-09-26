'use client';

import { FocalPersonShell } from '@/components/focal-person/focal-person-shell';
import { FocalReports } from '@/components/focal-person/focal-reports';

export default function Page() {
  return <FocalPersonShell activeNav="reports">{() => <FocalReports />}</FocalPersonShell>;
}
