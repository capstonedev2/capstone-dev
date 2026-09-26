'use client';

import { FocalDefenseSchedules } from '@/components/focal-person/focal-defense-schedules';
import { FocalPersonShell } from '@/components/focal-person/focal-person-shell';

export default function Page() {
  return <FocalPersonShell activeNav="defense-schedules">{() => <FocalDefenseSchedules />}</FocalPersonShell>;
}
