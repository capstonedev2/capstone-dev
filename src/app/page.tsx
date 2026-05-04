import Link from 'next/link';

import { LandingFooter } from '@/components/public/landing-footer';
import { LandingNavigation } from '@/components/public/landing-navigation';
import { LandingRevealController } from '@/components/public/landing-reveal-controller';
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
    artifact: 'Topic brief'
  },
  {
    icon: 'fas fa-file-signature',
    title: 'Proposal',
    description: 'Submit the formal proposal for adviser and panel evaluation and approval.',
    artifact: 'Approved proposal'
  },
  {
    icon: 'fas fa-code',
    title: 'Development',
    description: 'Build the system, conduct testing, and track chapter submissions.',
    artifact: 'Working system'
  },
  {
    icon: 'fas fa-chalkboard-user',
    title: 'Mock Defense',
    description: 'Present a practice defense, gather feedback, and refine the study.',
    artifact: 'Panel feedback'
  },
  {
    icon: 'fas fa-user-graduate',
    title: 'Final Defense',
    description: 'Defend the completed project before the panel and submit revisions.',
    artifact: 'Final manuscript'
  },
  {
    icon: 'fas fa-circle-check',
    title: 'Completion',
    description: 'Finalize deliverables, upload evidence, and publish to the repository.',
    artifact: 'Repository record'
  }
];

const featureItems = [
  {
    icon: 'fas fa-shield-halved',
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security to protect your data.'
  },
  {
    icon: 'fas fa-diagram-project',
    title: 'Integrated Workflow',
    description: 'Streamlined processes from proposal to archive.'
  },
  {
    icon: 'fas fa-users',
    title: 'Collaborative',
    description: 'Empower teams and strengthen coordination.'
  },
  {
    icon: 'fas fa-globe',
    title: 'Accessible Anywhere',
    description: 'Web-based access for anytime, anywhere.'
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

const systemMetrics = [
  { value: '5', label: 'Programs' },
  { value: '8+', label: 'User Roles' },
  { value: '1', label: 'Repository' }
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
              <div className={styles.heroContent} data-reveal="fade-up">
                <span className={styles.heroBadge}>
                  <i className="fas fa-graduation-cap" aria-hidden="true" />
                  Built for Higher Education
                </span>
                <h1>
                  <span className={styles.heroTitleLine}>Thesis and Capstone</span>
                  <span className={styles.heroTitleLine}>Project</span>
                  <span className={`${styles.heroTitleLine} ${styles.heroTitleAccent}`}>
                    Management System
                  </span>
                </h1>
                <p>
                  Manage the full lifecycle of thesis and capstone outputs, from title
                  registration and milestone tracking to repository access, deployment,
                  adoption, and accreditation evidence.
                </p>
              </div>

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
              {featureItems.map(feature => (
                <article key={feature.title} className={styles.featureItem} data-reveal="fade-up">
                  <div className={styles.featureIcon} aria-hidden="true">
                    <i className={feature.icon} />
                  </div>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="university" className={styles.institutionSection}>
            <div className={styles.container}>
              <div className={styles.institutionHeader}>
                <div className={`${styles.sectionIntro} ${styles.institutionIntro}`} data-reveal="fade-up">
                  <span className={styles.sectionKicker}>Our Institution</span>
                  <h2>
                    University <span>Vision &amp; Mission</span>
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
                  <h3>University Vision</h3>
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
                  <h3>University Mission</h3>
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

              <ol className={styles.workflowTimeline}>
                {workflowSteps.map((step, index) => (
                  <li key={step.title} className={styles.workflowStep} data-reveal="fade-up">
                    <div className={styles.workflowIconWrap}>
                      <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
                      <div className={styles.workflowIcon}>
                        <i className={step.icon} />
                      </div>
                    </div>
                    <div className={styles.workflowStepBody}>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                      <span className={styles.workflowArtifact}>{step.artifact}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section id="about" className="relative py-24 sm:py-32 overflow-hidden bg-[#f7fbff]">
            {/* Premium Ambient Backgrounds */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(0,58,143,0.06),transparent_70%)] pointer-events-none" />
            <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(246,190,0,0.05),transparent_60%)] pointer-events-none blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(65,139,255,0.06),transparent_60%)] pointer-events-none blur-3xl" />

            <div className="relative z-10 w-[min(1680px,calc(100%-3rem))] mx-auto">
              
              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 mb-8">
                {/* Left Card: Premium Light Glassmorphism */}
                <article className="relative overflow-hidden bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(15,43,89,0.05)] rounded-[2rem] p-10 sm:p-14 transition-all duration-500 hover:shadow-[0_30px_70px_rgba(15,43,89,0.08)] group" data-reveal="fade-right">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/20 to-blue-50/30 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-[0.7rem] font-black uppercase tracking-widest text-[#003a8f] bg-[#ebf5ff]/80 backdrop-blur-md border border-[#dbe9fb] rounded-full shadow-sm ring-1 ring-white">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#003a8f]"></span>
                      </span>
                      About the System
                    </div>
                    
                    <h2 className="font-serif text-[clamp(2.2rem,4vw,3.2rem)] font-black text-[#003a8f] leading-[1.1] mb-6 tracking-tight">
                      Connected <span className="text-[#f6be00]">capstone management</span> in one workspace
                    </h2>
                    
                    <p className="text-[1.05rem] text-[#536982] leading-[1.75] mb-10 max-w-xl font-medium">
                      ThesisTrack centralizes capstone registration, submissions, reviews, evaluations, and archived outputs into a brilliantly unified platform.
                    </p>

                    <div className="grid grid-cols-3 gap-5" aria-label="System scope">
                      {systemMetrics.map(metric => (
                        <div key={metric.label} className="bg-white/90 backdrop-blur-sm border border-[#e2eaf5] shadow-[0_8px_20px_rgba(15,43,89,0.03)] rounded-[1.2rem] p-5 text-center group-hover:border-[#c6d7ef] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(15,43,89,0.08)] transition-all duration-300">
                          <strong className="block text-[1.8rem] font-black text-[#003a8f] mb-1">{metric.value}</strong>
                          <span className="text-[0.7rem] font-bold text-[#66758a] uppercase tracking-wider">{metric.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>

                {/* Right Card: Dynamic Workflow Display */}
                <aside className="relative overflow-hidden bg-gradient-to-br from-white/90 to-[#f2f7ff]/90 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(15,43,89,0.05)] rounded-[2rem] p-10 sm:p-14 flex flex-col justify-center transition-all duration-500 hover:shadow-[0_30px_70px_rgba(15,43,89,0.08)]" aria-label="System workflow preview" data-reveal="fade-left">
                  
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#f6be00]/20 to-transparent pointer-events-none rounded-bl-[100px]" />
                  
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-14">
                      <span className="text-[0.8rem] font-extrabold uppercase text-[#003a8f] flex items-center gap-2">
                        <i className="fas fa-route text-[#f6be00]" />
                        System Flow
                      </span>
                      <strong className="text-[0.85rem] font-bold text-[#4b6380] bg-white px-3 py-1 rounded-full border border-[#e2eaf5] shadow-sm">From idea to archived output</strong>
                    </div>
                    
                    <div className="relative px-2">
                      {/* Animated Connecting Line */}
                      <div className="absolute top-1/2 left-4 right-4 h-1 bg-[#e2eaf5] -translate-y-1/2 rounded-full overflow-hidden shadow-inner">
                        <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#003a8f] to-transparent animate-[shimmer_2.5s_infinite]" />
                      </div>
                      
                      <div className="relative flex justify-between gap-2">
                        {systemFlowItems.map((item, index) => (
                          <div key={item.title} className="flex flex-col items-center gap-4 relative z-10 group/item">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1rem] bg-white text-[#003a8f] flex items-center justify-center text-xl sm:text-2xl shadow-[0_8px_20px_rgba(15,43,89,0.08)] border border-white ring-1 ring-[#e2eaf5] group-hover/item:scale-110 group-hover/item:bg-[#003a8f] group-hover/item:text-white transition-all duration-400">
                              <i className={item.icon} />
                            </div>
                            <strong className="text-[0.7rem] sm:text-[0.75rem] font-black uppercase tracking-wider text-[#102033] bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-md">{item.title}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </aside>
              </div>

              {/* Bottom 3 Cards: Feature Showcase */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {systemOutcomes.map((outcome, index) => (
                  <article 
                    key={outcome.title} 
                    className="group relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/80 rounded-[1.5rem] p-8 shadow-[0_12px_30px_rgba(15,43,89,0.03)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_50px_rgba(15,43,89,0.08)] hover:bg-white" 
                    data-reveal="fade-up"
                    style={{ '--reveal-delay': `${index * 0.1}s` } as any}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#f0f5ff]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className="relative z-10">
                      <div className="inline-flex h-[4rem] w-[4rem] items-center justify-center rounded-[1rem] bg-gradient-to-br from-[#ffffff] to-[#eaf3ff] text-[#003a8f] text-[1.5rem] mb-6 shadow-[0_4px_15px_rgba(15,43,89,0.05)] border border-white ring-1 ring-[#dfeaf8] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        <i className={outcome.icon} />
                      </div>
                      <h3 className="text-[1.15rem] font-black text-[#14243a] mb-3">{outcome.title}</h3>
                      <p className="text-[0.95rem] text-[#536982] leading-[1.65] font-medium">{outcome.description}</p>
                    </div>
                  </article>
                ))}
              </div>

              {/* Action Banner: Highly polished call to action */}
              <div className="relative overflow-hidden rounded-[2rem] bg-white border border-[#e2eaf5] shadow-[0_20px_60px_rgba(15,43,89,0.08)] p-1.5" data-reveal="fade-up" style={{ '--reveal-delay': '0.3s' } as any}>
                <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#f8fbff] to-[#fffdf5] rounded-[1.6rem] py-8 px-8 sm:px-12">
                  
                  <div className="text-center sm:text-left max-w-lg">
                    <h3 className="text-xl font-black text-[#102033] mb-2">Ready to explore ThesisTrack?</h3>
                    <p className="text-sm text-[#66758a] font-medium">Discover how our unified workflow transforms academic project management.</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link href="/about#system-model" className="group relative isolation-isolate inline-flex min-h-[3.2rem] items-center justify-center gap-3 overflow-hidden rounded-full border border-[#0d61cf]/20 bg-gradient-to-br from-[#0d61cf] via-[#003a8f] to-[#082a67] px-8 py-3 text-[0.95rem] font-black text-white shadow-[0_12px_25px_rgba(0,58,143,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(0,58,143,0.35)]">
                      <span>Explore the System</span>
                      <i className="fas fa-arrow-right transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                    
                    <Link href="/about#capstone-team" className="group relative isolation-isolate inline-flex min-h-[3.2rem] items-center justify-center gap-3 overflow-hidden rounded-full border border-[#f6be00]/40 bg-gradient-to-br from-[#ffe98b] to-[#f6be00] px-8 py-3 text-[0.95rem] font-black text-[#5b4200] shadow-[0_12px_25px_rgba(246,190,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(246,190,0,0.3)]">
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
