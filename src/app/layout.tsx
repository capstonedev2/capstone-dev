import type { Metadata } from 'next';
import { Inter, Playfair_Display, Poppins } from 'next/font/google';
import { SessionSuspensionWatcher } from '@/components/auth/session-suspension-watcher';
import { BrandingProvider } from '@/components/branding/branding-provider';
import { SYSTEM_LOGO_SRC } from '@/lib/branding';
import './globals.css';
import '../styles/portal-shell-menus.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans'
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif'
});

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-student'
});

export const metadata: Metadata = {
  title: 'ThesisTrack',
  description: 'Higher Education Institutions',
  icons: {
    icon: SYSTEM_LOGO_SRC
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${inter.variable} ${playfairDisplay.variable} ${poppins.variable}`} lang="en" data-scroll-behavior="smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body suppressHydrationWarning>
        <BrandingProvider>
          {children}
          <SessionSuspensionWatcher />
        </BrandingProvider>
      </body>
    </html>
  );
}
