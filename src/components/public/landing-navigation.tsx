'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BrandName } from '@/components/branding/brand-copy';
import { LogoIcon } from '@/components/branding/logo-icon';
import { useBranding } from '@/components/branding/branding-provider';
import styles from '@/app/page.module.css';

export function LandingNavigation() {
  const { branding } = useBranding();
  const [isOpen, setIsOpen] = useState(false);
  const [activeHref, setActiveHref] = useState('/#home');
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const navigation = branding.navigation;
  const visibleLinks = useMemo(
    () => navigation.links.filter((link) => link.visible),
    [navigation.links]
  );

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('thesistrackLandingTheme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const nextDarkMode = storedTheme ? storedTheme === 'dark' : Boolean(prefersDark);

    setDarkMode(nextDarkMode);
    document.documentElement.dataset.landingTheme = nextDarkMode ? 'dark' : 'light';
  }, []);

  useEffect(() => {
    document.documentElement.dataset.landingTheme = darkMode ? 'dark' : 'light';
    window.localStorage.setItem('thesistrackLandingTheme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (pathname !== '/') {
      setActiveHref(pathname);
      return;
    }

    const sectionLinks = visibleLinks
      .map((link) => {
        const hashIndex = link.href.indexOf('#');
        const id = hashIndex >= 0 ? link.href.slice(hashIndex + 1) : '';
        const section = id ? document.getElementById(id) : null;

        return section ? { href: link.href, section } : null;
      })
      .filter((item): item is { href: string; section: HTMLElement } => Boolean(item));

    if (!sectionLinks.length) {
      setActiveHref('/#home');
      return;
    }

    let frame = 0;

    const updateActiveHref = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const activationLine = window.scrollY + 140;
        const activeSection = sectionLinks.reduce((current, item) => (
          item.section.offsetTop <= activationLine ? item : current
        ), sectionLinks[0]);

        setActiveHref(activeSection.href);
      });
    };

    updateActiveHref();
    window.addEventListener('scroll', updateActiveHref, { passive: true });
    window.addEventListener('resize', updateActiveHref);
    window.addEventListener('hashchange', updateActiveHref);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener('scroll', updateActiveHref);
      window.removeEventListener('resize', updateActiveHref);
      window.removeEventListener('hashchange', updateActiveHref);
    };
  }, [pathname, visibleLinks]);

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
    const isSectionLink = pathname === '/' && href === activeHref;

    return `${styles.navLink} ${isAboutLink || isSectionLink ? styles.navLinkActive : ''}`;
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
              <p>{navigation.subtitle}</p>
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
          <div className={styles.navLinkList}>
            {visibleLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={getActiveClassName(link.href)}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className={styles.navActions}>

            {navigation.showLogin ? (
              <Link href="/login" className={`${styles.buttonPrimary} ${styles.navActionButton}`}>
                <span className={styles.buttonText}>{navigation.loginLabel}</span>
                <span className={styles.buttonIcon} aria-hidden="true">
                  <i className="fas fa-right-to-bracket" />
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
