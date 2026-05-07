'use client';

import Link from 'next/link';
import { useBranding } from '@/components/branding/branding-provider';
import styles from '@/app/page.module.css';

export function LandingManagedHero() {
  const { branding } = useBranding();
  const landing = branding.landing;
  const heroStyle = {
    textAlign: landing.textAlignment
  } as const;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] lg:items-center">
      <div className={styles.heroContent} data-reveal="fade-up" style={heroStyle}>
        <span className={styles.heroBadge}>
          <i className="fas fa-graduation-cap" aria-hidden="true" />
          {landing.subtitle}
        </span>
        <h1>
          {landing.heroTitle.split(/\s+/).reduce<string[]>((lines, word) => {
            const current = lines[lines.length - 1] || '';
            if (!current || current.length + word.length < 24) {
              lines[lines.length - 1] = current ? `${current} ${word}` : word;
            } else {
              lines.push(word);
            }
            return lines;
          }, ['']).map((line, index, lines) => (
            <span
              key={`${line}-${index}`}
              className={`${styles.heroTitleLine} ${index === lines.length - 1 ? styles.heroTitleAccent : ''}`}
            >
              {line}
            </span>
          ))}
        </h1>
        <p>{landing.description}</p>
        {landing.showCtaButtons ? (
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={landing.primaryCtaLink} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#003A8F] px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(0,58,143,0.22)] transition hover:-translate-y-0.5">
              {landing.primaryCtaText}
            </Link>
            <Link href={landing.secondaryCtaLink} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F6BE00]/50 bg-white px-6 text-sm font-black text-[#5b4200] shadow-sm transition hover:-translate-y-0.5">
              {landing.secondaryCtaText}
            </Link>
          </div>
        ) : null}
      </div>
      {landing.showHeroImage && landing.heroImage ? (
        <div className="relative min-h-[260px] overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,43,89,0.08)]" data-reveal="fade-left">
          <img alt="" className="h-full min-h-[260px] w-full object-cover" src={landing.heroImage} />
        </div>
      ) : null}
    </div>
  );
}

export function LandingManagedFeatureRow() {
  const { branding } = useBranding();
  const features = branding.landing.features.filter((feature) => feature.visible);

  return (
    <>
      {features.map((feature) => (
        <article key={feature.id} className={styles.featureItem} data-reveal="fade-up">
          <div className={styles.featureIcon} aria-hidden="true">
            <i className={`fas ${feature.icon}`} />
          </div>
          <div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        </article>
      ))}
    </>
  );
}

export function LandingManagedAboutSummary() {
  const { branding } = useBranding();
  const landing = branding.landing;
  const metrics = landing.statistics.filter((item) => item.visible);

  return (
    <>
      <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-[0.7rem] font-black uppercase tracking-widest text-[#003a8f] bg-[#ebf5ff]/80 backdrop-blur-md border border-[#dbe9fb] rounded-full shadow-sm ring-1 ring-white">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#003a8f]"></span>
        </span>
        About the System
      </div>
      <h2 className="font-serif text-[clamp(2.2rem,4vw,3.2rem)] font-black text-[#003a8f] leading-[1.1] mb-6 tracking-tight">
        {landing.aboutTitle}
      </h2>
      <p className="text-[1.05rem] text-[#536982] leading-[1.75] mb-10 max-w-xl font-medium">
        {landing.aboutDescription}
      </p>
      <div className="grid grid-cols-3 gap-5" aria-label="System scope">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-white/90 backdrop-blur-sm border border-[#e2eaf5] shadow-[0_8px_20px_rgba(15,43,89,0.03)] rounded-[1.2rem] p-5 text-center group-hover:border-[#c6d7ef] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(15,43,89,0.08)] transition-all duration-300">
            <strong className="block text-[1.8rem] font-black text-[#003a8f] mb-1">{metric.value}</strong>
            <span className="text-[0.7rem] font-bold text-[#66758a] uppercase tracking-wider">{metric.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
