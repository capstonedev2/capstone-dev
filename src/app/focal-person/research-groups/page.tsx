'use client';

import { FocalPersonShell } from '@/components/focal-person/focal-person-shell';
import { FocalResearchGroups } from '@/components/focal-person/focal-research-groups';

export default function Page() {
  return <FocalPersonShell activeNav="research-groups">{() => <FocalResearchGroups />}</FocalPersonShell>;
}
