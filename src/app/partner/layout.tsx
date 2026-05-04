import '@/styles/role-portal-shared.css';
import { PartnerLayout } from '@/components/layouts/partner-layout';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PartnerLayout>{children}</PartnerLayout>;
}
