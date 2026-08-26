import Link from 'next/link';

import { LandingFooter } from '@/components/public/landing-footer';
import {
  LandingManagedAboutSummary,
  LandingManagedFeatureRow,
  LandingManagedHero
} from '@/components/public/landing-managed-content';
import { LandingNavigation } from '@/components/public/landing-navigation';
import { LandingRevealController } from '@/components/public/landing-reveal-controller';
import { HallOfExcellence } from '@/components/public/hall-of-excellence';
import { PublicLayout } from '@/components/layouts/public-layout';

import styles from './page.module.css';

export const metadata = {
  title: 'ThesisTrack | Thesis and Capstone Project Management System'
};

const modules = [
  {
    icon: 'fas fa-clipboard-list',
    title: 'Student Module',
    audience: 'Student groups',
    badge: 'Self-service',
    summary: 'A guided workspace for title registration, chapter uploads, milestone status, and faculty feedback.',
    bullets: ['Title registration', 'Chapter uploads', 'Milestone tracker']
  },
  {
    icon: 'fas fa-user-group',
    title: 'Adviser & Panelist',
    audience: 'Faculty reviewers',
    badge: 'Review desk',
    summary: 'Faculty can review submissions, manage advisement, evaluate defenses, and return actionable feedback.',
    bullets: ['Proposal reviews', 'Defense evaluations', 'Feedback records']
  },
  {
    icon: 'fas fa-users-gear',
    title: 'Program Head',
    audience: 'Department leadership',
    badge: 'Operations view',
    summary: 'Program heads monitor cohort progress, coordinate panels, and keep departmental reports current.',
    bullets: ['Adviser assignment', 'Panel coordination', 'Program analytics']
  },
  {
    icon: 'fas fa-people-roof',
    title: 'Research Head',
    audience: 'Institutional oversight',
    badge: 'Executive view',
    summary: 'Research leaders review institutional outputs, track evidence, and approve key research decisions.',
    bullets: ['Output monitoring', 'Evidence review', 'Decision approvals']
  }
];

const workflowSteps = [
  {
    icon: 'fas fa-lightbulb',
    title: 'Concept',
    description: 'Define the research topic, problem scope, and initial capstone study ideas.',
    artifact: 'Topic brief',
    theme: 'blue'
  },
  {
    icon: 'fas fa-file-signature',
    title: 'Proposal',
    description: 'Submit the formal proposal for adviser and panel evaluation and approval.',
    artifact: 'Approved proposal',
    theme: 'blue'
  },
  {
    icon: 'fas fa-code',
    title: 'Development',
    description: 'Build the system, conduct testing, and track chapter submissions.',
    artifact: 'Working system',
    theme: 'green'
  },
  {
    icon: 'fas fa-chalkboard-user',
    title: 'Pre-Final Defense',
    description: 'Present a practice defense, gather feedback, and refine the study.',
    artifact: 'Panel feedback',
    theme: 'gold'
  },
  {
    icon: 'fas fa-user-graduate',
    title: 'Final Defense',
    description: 'Defend the completed project before the panel and submit revisions.',
    artifact: 'Final manuscript',
    theme: 'blue'
  },
  {
    icon: 'fas fa-circle-check',
    title: 'Completion',
    description: 'Finalize deliverables, upload evidence, and publish to the repository.',
    artifact: 'Repository record',
    theme: 'gold'
  }
];

const systemOutcomes = [
  {
    icon: 'fas fa-folder-tree',
    title: 'Centralized Records',
    description: 'Groups, documents, approvals, and repository entries.'
  },
  {
    icon: 'fas fa-route',
    title: 'Guided Progress',
    description: 'Track projects from registration to completion.'
  },
  {
    icon: 'fas fa-chart-line',
    title: 'Decision Visibility',
    description: 'Monitor submissions, reviews, and academic actions.'
  }
];

const systemFlowItems = [
  { title: 'Register', icon: 'fas fa-pen-to-square' },
  { title: 'Submit', icon: 'fas fa-file-arrow-up' },
  { title: 'Review', icon: 'fas fa-comments' },
  { title: 'Archive', icon: 'fas fa-box-archive' }
];

const missionItems = [
  {
    icon: 'fas fa-briefcase',
    text: 'Bring the world of work (industry) into the actual higher education and training of students.'
  },
  {
    icon: 'fas fa-lightbulb',
    text: 'Offer entrepreneurs the opportunity to maximize their business potentials through a gamut of services from product conceptualization to commercialization;'
  },
  {
    icon: 'fas fa-shield-heart',
    text: 'Contribute significantly to the National Development Goals of food security and safety; and energy sufficiency and security through technology solutions.'
  }
];


export default function Page() {
  return (
    <PublicLayout>
      <div className={styles.landingPage}>
        <LandingNavigation />

        <main className={styles.main}>
          <section id="home" className={styles.heroSection}>
            <div className={`${styles.container} ${styles.heroGrid}`}>
              <LandingManagedHero />
            </div>

            <div className={`${styles.container} ${styles.heroInfoCard}`} data-reveal="fade-up">
              <div className={styles.heroInfoIcon} aria-hidden="true">
                <i className="fas fa-building-columns" />
              </div>
              <div>
                <h2>For the entire academic community</h2>
                <p>
                  Built for IT, MET, TCM, ESM, and NAME programs with dashboards for
                  students, adviser and panel faculty, department chairs, research heads,
                  partners or beneficiaries, technology transfer staff, and read-only
                  e-library users. Students can self-register, while faculty and staff
                  accounts are issued by the school.
                </p>
              </div>
            </div>

            <div className={`${styles.container} ${styles.featureRow}`} aria-label="System highlights">
              <LandingManagedFeatureRow />
            </div>
          </section>

          <section id="university" className={styles.institutionSection}>
            <div className={styles.container}>
              <div className={styles.institutionHeader}>
                <div className={`${styles.sectionIntro} ${styles.institutionIntro}`} data-reveal="fade-up">
                  <span className={styles.sectionKicker}>Our Institution</span>
                  <h2>
                    USTP <span>Vision &amp; Mission</span>
                  </h2>
                  <p>
                    Guided by a commitment to excellence, innovation, and national development,
                    the institution frames capstone work as a bridge between education,
                    industry, and public value.
                  </p>
                </div>
              </div>

              <div className={styles.visionMissionGrid}>
                <article className={`${styles.institutionCard} ${styles.institutionVisionCard}`} data-reveal="fade-up">
                  <div className={styles.institutionCardHeader}>
                    <div className={styles.institutionIcon} aria-hidden="true">
                      <i className="fas fa-eye" />
                    </div>
                    <span>Vision</span>
                  </div>
                  <h3>USTP Vision</h3>
                  <p>
                    A nationally-recognized S&amp;T university providing the vital link
                    between education and the economy.
                  </p>
                  <div className={styles.institutionVisionNote}>
                    <strong>Vital link</strong>
                    <span>Education, research, and economic contribution working as one academic mission.</span>
                  </div>
                </article>

                <article className={`${styles.institutionCard} ${styles.institutionMissionCard}`} data-reveal="fade-up">
                  <div className={styles.institutionCardHeader}>
                    <div className={styles.institutionIcon} aria-hidden="true">
                      <i className="fas fa-bullseye" />
                    </div>
                    <span>Mission</span>
                  </div>
                  <h3>USTP Mission</h3>
                  <ul className={styles.institutionMissionList}>
                    {missionItems.map(item => (
                      <li key={item.text}>
                        <span aria-hidden="true">
                          <i className={item.icon} />
                        </span>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>
          </section>

          <section id="modules" className={styles.modulesSection}>
            <div className={styles.container}>
              <div className={styles.moduleShowcaseHeader}>
                <div className={`${styles.sectionIntro} ${styles.moduleIntro}`} data-reveal="fade-up">
                  <span className={styles.sectionKicker}>Dedicated Portals</span>
                  <h2>
                    Role-Based <span>Modules</span>
                  </h2>
                  <p>
                    Purpose-built workspaces route each stakeholder to the right academic
                    tasks, records, decisions, and reports.
                  </p>
                </div>
              </div>

              <div className={styles.moduleGrid}>
                {modules.map(module => (
                  <article key={module.title} className={styles.moduleCard} data-reveal="fade-up">
                    <div className={styles.moduleCardHeader}>
                      <div className={styles.moduleIcon} aria-hidden="true">
                        <i className={module.icon} />
                      </div>
                      <span className={styles.moduleBadge}>{module.badge}</span>
                    </div>
                    <div className={styles.moduleCardBody}>
                      <span className={styles.moduleAudience}>{module.audience}</span>
                      <h3>{module.title}</h3>
                      <p>{module.summary}</p>
                    </div>
                    <ul className={styles.moduleCapabilityList}>
                      {module.bullets.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <HallOfExcellence />

          <section id="workflow" className={styles.workflowSection}>
            <div className={styles.container}>
              <div className={styles.workflowHeader}>
                <div className={`${styles.sectionIntro} ${styles.workflowIntro}`} data-reveal="fade-up">
                  <span className={styles.sectionKicker}>Milestone Roadmap</span>
                  <h2>
                    Student <span>Milestone Stages</span>
                  </h2>
                  <p>
                    A guided academic path that moves every group from early topic framing
                    to defense, final evidence, and repository publishing.
                  </p>
                </div>
              </div>

              <div className="relative mt-16 mb-10 w-full pb-8 px-4 sm:px-6 md:overflow-x-auto hide-scrollbar">
                <div className="relative w-full mx-auto md:min-w-[1200px] max-w-6xl md:max-w-none">
                  {/* Desktop Background Rail Line */}
                  <div className="hidden md:block absolute top-[2.75rem] left-[5%] right-[5%] h-2 bg-gradient-to-r from-[#003A8F] via-[#418bff] to-[#f6be00] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] opacity-90" />
                  
                  {/* Mobile Vertical Rail Line */}
                  <div className="md:hidden absolute top-[2.5rem] bottom-[2.5rem] left-[3.15rem] sm:left-[3.65rem] w-1.5 bg-gradient-to-b from-[#003A8F] via-[#418bff] to-[#f6be00] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] opacity-90" />

                  <div className="flex flex-col md:flex-row justify-between relative z-10 gap-8 md:gap-4">
                    {workflowSteps.map((step, index) => {
                      const t = step.theme === 'gold' 
                        ? { icon: 'text-[#f6be00]', ring: 'ring-[#f6be00]/30', groupHoverRing: 'group-hover:ring-[#f6be00]', numBg: 'bg-[#f6be00]', numText: 'text-white', cardBorder: 'border-t-[#f6be00]', cardHover: 'hover:border-[#f6be00] hover:shadow-[0_20px_50px_rgba(246,190,0,0.12)]', badgeBg: 'bg-yellow-50', badgeText: 'text-[#b17800]' }
                        : step.theme === 'green'
                        ? { icon: 'text-emerald-600', ring: 'ring-emerald-600/30', groupHoverRing: 'group-hover:ring-emerald-600', numBg: 'bg-emerald-600', numText: 'text-white', cardBorder: 'border-t-emerald-600', cardHover: 'hover:border-emerald-400 hover:shadow-[0_20px_50px_rgba(5,150,105,0.12)]', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700' }
                        : { icon: 'text-[#003A8F]', ring: 'ring-[#003A8F]/30', groupHoverRing: 'group-hover:ring-[#003A8F]', numBg: 'bg-[#003A8F]', numText: 'text-white', cardBorder: 'border-t-[#003A8F]', cardHover: 'hover:border-blue-300 hover:shadow-[0_20px_50px_rgba(0,58,143,0.12)]', badgeBg: 'bg-blue-50', badgeText: 'text-[#003A8F]' };

                      return (
                      <div key={step.title} className="flex flex-row md:flex-col items-center md:items-start flex-1 gap-6 md:gap-0" data-reveal="fade-up" style={{ animationDelay: `${index * 100}ms` }}>
                        
                        {/* Milestone Circle Marker */}
                        <div className="relative mb-0 md:mb-6 group cursor-default flex-shrink-0">
                          <div className={`w-[4.5rem] h-[4.5rem] sm:w-[5.5rem] sm:h-[5.5rem] rounded-full flex items-center justify-center border-[4px] border-white shadow-[0_8px_20px_rgba(15,43,89,0.06)] ring-1 ${t.ring} ${t.groupHoverRing} transition-all duration-300 group-hover:-translate-y-1 relative z-10 bg-white ${t.icon}`}>
                            <i className={`${step.icon} text-xl sm:text-2xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110`} />
                          </div>
                          
                          {/* Step Number Badge */}
                          <div className={`absolute -bottom-1 -right-1 sm:bottom-0 sm:-right-2 w-7 h-7 rounded-full border-[2px] border-white flex items-center justify-center text-[0.65rem] font-black z-20 shadow-sm ${t.numBg} ${t.numText}`}>
                            {String(index + 1).padStart(2, '0')}
                          </div>
                        </div>
                        
                        {/* Content Card */}
                        <div className={`bg-white rounded-xl p-5 shadow-[0_10px_30px_rgba(15,43,89,0.04)] border border-slate-100 transition-all duration-300 h-full flex flex-col items-start w-[180px] sm:w-[200px] border-t-4 ${t.cardBorder} ${t.cardHover}`}>
                          <h3 className="text-[1.05rem] font-black text-slate-900 mb-2">{step.title}</h3>
                          <p className="text-[0.8rem] text-slate-500 font-medium leading-[1.6] mb-5 flex-grow">{step.description}</p>
                          
                          {/* Artifact Badge */}
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[0.65rem] font-black uppercase tracking-wider mt-auto ${t.badgeBg} ${t.badgeText}`}>
                            <i className="fas fa-file-contract opacity-70" />
                            {step.artifact}
                          </div>
                        </div>
                        
                      </div>
                    )})}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="about" className={`${styles.homeAboutSection} relative py-16 sm:py-20 overflow-hidden bg-[#f7fbff]`}>
            {/* Premium Ambient Backgrounds */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(0,58,143,0.06),transparent_70%)] pointer-events-none" />
            <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(246,190,0,0.05),transparent_60%)] pointer-events-none blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(65,139,255,0.06),transparent_60%)] pointer-events-none blur-3xl" />

            <div className="relative z-10 w-[min(1680px,calc(100%-3rem))] mx-auto">
              
              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-6">
                {/* Left Card: Premium Light Glassmorphism */}
                <article className={`${styles.homeAboutSummaryCard} relative overflow-hidden bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(15,43,89,0.05)] rounded-[2rem] p-6 sm:p-10 transition-shadow duration-200 hover:shadow-[0_24px_54px_rgba(15,43,89,0.07)] group`} data-reveal="fade-right">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/20 to-blue-50/30 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <LandingManagedAboutSummary />
                  </div>
                </article>

                {/* Right Card: Dynamic Workflow Display */}
                <aside className={`${styles.homeAboutFlowCard} relative overflow-hidden bg-gradient-to-br from-white/90 to-[#f2f7ff]/90 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(15,43,89,0.05)] rounded-[2rem] p-6 sm:p-10 flex flex-col justify-center transition-shadow duration-200 hover:shadow-[0_24px_54px_rgba(15,43,89,0.07)]`} aria-label="System workflow preview" data-reveal="fade-left">
                  
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#f6be00]/20 to-transparent pointer-events-none rounded-bl-[100px]" />
                  
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <span className={`${styles.homeAboutFlowKicker} text-[0.8rem] font-extrabold uppercase text-[#003a8f] flex items-center gap-2`}>
                        <i className="fas fa-route text-[#f6be00]" />
                        System Flow
                      </span>
                      <strong className={`${styles.homeAboutFlowBadge} text-[0.85rem] font-bold text-[#4b6380] bg-white px-3 py-1 rounded-full border border-[#e2eaf5] shadow-sm`}>From idea to archived output</strong>
                    </div>
                    
                    <div className="relative px-2">
                      {/* Animated Connecting Line */}
                      <div className={`${styles.homeAboutFlowRail} absolute top-1/2 left-4 right-4 h-1 bg-[#e2eaf5] -translate-y-1/2 rounded-full overflow-hidden shadow-inner`}>
                        <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#003a8f]/60 to-transparent" />
                      </div>
                      
                      <div className="relative flex justify-between gap-2">
                        {systemFlowItems.map((item, index) => (
                          <div key={item.title} className="flex flex-col items-center gap-3 relative z-10 group/item">
                            <div className={`${styles.homeAboutFlowIcon} w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] bg-white text-[#003a8f] flex items-center justify-center text-lg sm:text-xl shadow-[0_8px_20px_rgba(15,43,89,0.08)] border border-white ring-1 ring-[#e2eaf5] group-hover/item:bg-[#003a8f] group-hover/item:text-white transition-colors duration-200`}>
                              <i className={item.icon} />
                            </div>
                            <strong className={`${styles.homeAboutFlowLabel} text-[0.65rem] sm:text-[0.7rem] font-black uppercase tracking-wider text-[#102033] bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-md`}>{item.title}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </aside>
              </div>

              {/* Bottom 3 Cards: Feature Showcase */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {systemOutcomes.map((outcome, index) => (
                  <article 
                    key={outcome.title} 
                    className={`${styles.homeAboutOutcomeCard} group relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/80 rounded-[1.5rem] p-6 shadow-[0_12px_30px_rgba(15,43,89,0.03)] transition-colors duration-200 hover:bg-white`}
                    data-reveal="fade-up"
                    style={{ '--reveal-delay': `${index * 0.1}s` } as any}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#f0f5ff]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    
                    <div className="relative z-10">
                      <div className={`${styles.homeAboutOutcomeIcon} inline-flex h-[3rem] w-[3rem] items-center justify-center rounded-[0.8rem] bg-gradient-to-br from-[#ffffff] to-[#eaf3ff] text-[#003a8f] text-[1.25rem] mb-4 shadow-[0_4px_15px_rgba(15,43,89,0.05)] border border-white ring-1 ring-[#dfeaf8] transition-colors duration-200`}>
                        <i className={outcome.icon} />
                      </div>
                      <h3 className={`${styles.homeAboutOutcomeTitle} text-[1.1rem] font-black text-[#14243a] mb-2`}>{outcome.title}</h3>
                      <p className={`${styles.homeAboutOutcomeText} text-[0.9rem] text-[#536982] leading-[1.6] font-medium`}>{outcome.description}</p>
                    </div>
                  </article>
                ))}
              </div>

              {/* Action Banner: Highly polished call to action */}
              <div className={`${styles.homeAboutCtaShell} relative overflow-hidden rounded-[2rem] bg-white border border-[#e2eaf5] shadow-[0_20px_60px_rgba(15,43,89,0.08)] p-1.5`} data-reveal="fade-up" style={{ '--reveal-delay': '0.3s' } as any}>
                <div className={`${styles.homeAboutCtaBand} relative flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#f8fbff] to-[#fffdf5] rounded-[1.6rem] py-8 px-8 sm:px-12`}>
                  
                  <div className="text-center sm:text-left max-w-lg">
                    <h3 className={`${styles.homeAboutCtaTitle} text-xl font-black text-[#102033] mb-2`}>Ready to explore ThesisTrack?</h3>
                    <p className={`${styles.homeAboutCtaText} text-sm text-[#66758a] font-medium`}>Discover how our unified workflow transforms academic project management.</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link href="/about" className="group relative isolation-isolate inline-flex min-h-[3.2rem] items-center justify-center gap-3 overflow-hidden rounded-full border border-[#0d61cf]/20 bg-gradient-to-br from-[#0d61cf] via-[#003a8f] to-[#082a67] px-8 py-3 text-[0.95rem] font-black text-white shadow-[0_12px_25px_rgba(0,58,143,0.25)] transition-shadow duration-200 hover:shadow-[0_14px_28px_rgba(0,58,143,0.28)]">
                      <span>Explore the System</span>
                      <i className="fas fa-arrow-right" />
                    </Link>
                    
                    <Link href="/about#capstone-team" className={`${styles.homeAboutSecondaryLink} group relative isolation-isolate inline-flex min-h-[3.2rem] items-center justify-center gap-3 overflow-hidden rounded-full border border-[#f6be00]/40 bg-gradient-to-br from-[#ffe98b] to-[#f6be00] px-8 py-3 text-[0.95rem] font-black text-[#5b4200] shadow-[0_12px_25px_rgba(246,190,0,0.2)] transition-shadow duration-200 hover:shadow-[0_14px_28px_rgba(246,190,0,0.24)]`}>
                      <span>Meet the Devs</span>
                      <i className="fas fa-users" />
                    </Link>
                  </div>
                  
                </div>
              </div>

            </div>
          </section>
        </main>

        <LandingFooter />
        <LandingRevealController />
      </div>
    </PublicLayout>
  );
}
