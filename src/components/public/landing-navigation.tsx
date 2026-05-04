'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BrandName } from '@/components/branding/brand-copy';
import { LogoIcon } from '@/components/branding/logo-icon';
import styles from '@/app/page.module.css';

const navigationLinks = [
  { href: '/#home', label: 'Home' },
  { href: '/#modules', label: 'Modules' },
  { href: '/#workflow', label: 'Workflow' },
  { href: '/about', label: 'About' }
];

export function LandingNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const getActiveClassName = (href: string) => {
    const isAboutLink = href === '/about' && pathname === '/about';
    const isHomeLink = href === '/#home' && pathname === '/';

    return `${styles.navLink} ${isAboutLink || isHomeLink ? styles.navLinkActive : ''}`;
  };

  return (
    <nav className={styles.navbar} aria-label="Primary navigation">
      <div className={`${styles.container} ${styles.navbarInner}`}>
        <Link href="/#home" className={styles.brand} aria-label="Go to ThesisTrack home">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <LogoIcon style={{ height: '44px', width: 'auto' }} />
            <div>
              <h2>
                <BrandName />
              </h2>
              <p>Higher Education Institutions</p>
            </div>
          </div>
        </Link>

        <button
          type="button"
          className={styles.mobileMenuButton}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-controls="landing-navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(current => !current)}
        >
          <span className={styles.mobileMenuIcon} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <div
          id="landing-navigation"
          className={`${styles.navLinks} ${isOpen ? styles.navLinksOpen : ''}`}
        >
          {navigationLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={getActiveClassName(link.href)}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className={styles.navActions}>
            <Link href="/login" className={`${styles.buttonPrimary} ${styles.navActionButton}`}>
              <span className={styles.buttonText}>Login</span>
              <span className={styles.buttonIcon} aria-hidden="true">
                <i className="fas fa-right-to-bracket" />
              </span>
            </Link>
            <Link href="/register" className={`${styles.buttonSecondary} ${styles.navActionButton}`}>
              <span className={styles.buttonText}>Sign Up</span>
              <span className={styles.buttonIcon} aria-hidden="true">
                <i className="fas fa-user-plus" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
