import '@/styles/library-portal.css';
import { LibraryLayout } from '@/components/layouts/library-layout';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LibraryLayout>{children}</LibraryLayout>;
}
