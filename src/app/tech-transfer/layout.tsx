import '@/styles/role-portal-shared.css';
import { TechTransferLayout } from '@/components/layouts/tech-transfer-layout';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <TechTransferLayout>{children}</TechTransferLayout>;
}
