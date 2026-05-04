import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicLayout } from "@/components/layouts/public-layout";
import { LandingRevealController } from "@/components/public/landing-reveal-controller";
import { LandingFooter } from "@/components/public/landing-footer";
import { departmentsData } from "@/lib/landing/departments-data";
import { DepartmentChart } from "@/components/public/department-chart";
import styles from "@/app/page.module.css";

export function generateStaticParams() {
  return departmentsData.map((dept) => ({
    id: dept.id,
  }));
}

export default async function DepartmentPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const requestedDepartmentId = params.id.toUpperCase();
  const department = departmentsData.find((d) => d.id.toUpperCase() === requestedDepartmentId);

  if (!department) {
    notFound();
  }

  return (
    <PublicLayout>
      <div className={`${styles.landingPage} bg-slate-50 selection:bg-brand/20 selection:text-brand`}>
        <LandingRevealController />
        {/* Simplified Navbar */}
        <nav className={`${styles.navbar} !bg-white/80 !backdrop-blur-xl`}>
          <div className={`${styles.container} ${styles.navbarInner}`}>
            <div className={styles.brand}>
              <Link href="/" className="group flex flex-col transition-transform duration-200 hover:scale-[1.02]">
                <h2 className="text-2xl font-bold tracking-tight text-brand">
                  Thesis<span className="text-amber-500">Track</span>
                </h2>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-0.5">
                  Higher Education
                </p>
              </Link>
            </div>
            <div className={styles.navLinks}>
              <Link 
                href="/#about" 
                className="group flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-brand hover:ring-brand/50 transition-all duration-300"
              >
                <i className="fas fa-arrow-left transition-transform group-hover:-translate-x-1" /> 
                Back to Home
              </Link>
            </div>
          </div>
        </nav>

        <main className={`${styles.main} relative overflow-hidden`} style={{ minHeight: 'calc(100vh - 160px)' }}>
          {/* Decorative Background Blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-br from-brand/10 via-transparent to-amber-500/10 blur-[120px] rounded-[100%] pointer-events-none -z-10" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-to-tl from-amber-400/10 via-transparent to-brand/5 blur-[100px] rounded-[100%] pointer-events-none -z-10" />

          {/* ── HERO SECTION ── */}
          <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
            <div className={styles.container}>
              <div className="mb-12 text-center max-w-4xl mx-auto" data-reveal="fade-up">
                {department.logo ? (
                  <div className="mx-auto mb-8 relative w-32 h-32 sm:w-40 sm:h-40 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-2 bg-white/80 backdrop-blur-xl border border-white/60 transition-transform duration-500 hover:scale-105">
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white shadow-inner">
                      <img src={department.logo} alt={`${department.id} Logo`} className="w-[85%] h-[85%] object-contain" />
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto mb-8 inline-flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60 text-brand transition-transform duration-500 hover:scale-105">
                    <i className={`${department.icon} text-4xl sm:text-5xl`} />
                  </div>
                )}
                
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-bold tracking-widest uppercase text-amber-600 bg-amber-50 rounded-full shadow-sm ring-1 ring-amber-500/20 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  {department.id} Department
                </div>
                
                <h1 className="font-serif text-[clamp(2.2rem,4vw,3.5rem)] font-bold text-gray-900 leading-[1.15] mb-6 tracking-tight">
                  <span className="bg-gradient-to-r from-brand via-blue-800 to-brand bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                    {department.name}
                  </span>
                </h1>
              </div>

              {/* ── STATS ROW ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto mb-16" data-reveal="fade-up" style={{ '--reveal-delay': '0.05s' } as any}>
                {department.stats.map((stat, i) => (
                  <div
                    key={stat.label}
                    className="group relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 text-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,58,143,0.08)] transition-all duration-500 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <p className="relative text-3xl sm:text-4xl font-bold tracking-tight text-brand mb-1">{stat.value}</p>
                    <p className="relative text-sm text-gray-500 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* ── ABOUT THE PROGRAM ── */}
              <div className="max-w-5xl mx-auto mb-8 sm:mb-16" data-reveal="fade-up" style={{ '--reveal-delay': '0.08s' } as any}>
                <div className="relative overflow-hidden bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,58,143,0.08)] transition-all duration-500">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-brand/5 to-amber-500/5 blur-3xl rounded-full pointer-events-none -translate-y-1/3 translate-x-1/3" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 blur-3xl rounded-full pointer-events-none translate-y-1/3 -translate-x-1/3" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row gap-8 md:gap-16 items-start">
                    <div className="md:w-1/3 shrink-0">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-brand mb-6 shadow-inner ring-1 ring-blue-100/50">
                        <i className="fas fa-book-open text-xl" />
                      </div>
                      <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-[1.15]">
                        About the <br className="hidden md:block" />Program
                      </h2>
                    </div>
                    <div className="md:w-2/3">
                      <p className="text-lg text-gray-700 leading-relaxed font-medium text-justify sm:text-left">
                        {department.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── MISSION & VISION ── */}
          <section className="pb-16 sm:pb-20">
            <div className={styles.container}>
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto" data-reveal="fade-up" style={{ '--reveal-delay': '0.1s' } as any}>
                {/* Mission Card */}
                <div className="group relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,58,143,0.08)] transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-brand mb-5 shadow-inner ring-1 ring-blue-100/50">
                      <i className="fas fa-crosshairs text-xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-4">Our Mission</h2>
                    <p className="text-gray-600 leading-relaxed text-[0.95rem]">{department.mission}</p>
                  </div>
                </div>

                {/* Vision Card */}
                <div className="group relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,58,143,0.08)] transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500 mb-5 shadow-inner ring-1 ring-amber-100/50">
                      <i className="fas fa-eye text-xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-4">Our Vision</h2>
                    <p className="text-gray-600 leading-relaxed text-[0.95rem]">{department.vision}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── KEY RESEARCH AREAS ── */}
          <section className="pb-16 sm:pb-20">
            <div className={styles.container}>
              <div className="text-center mb-12 max-w-3xl mx-auto" data-reveal="fade-up" style={{ '--reveal-delay': '0.15s' } as any}>
                <h2 className="text-sm font-bold uppercase tracking-widest text-brand mb-3">Areas of Excellence</h2>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Key Research & Focus Areas</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto" data-reveal="fade-up" style={{ '--reveal-delay': '0.2s' } as any}>
                {department.keyAreas.map((area, i) => (
                  <div
                    key={area.title}
                    className="group relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,58,143,0.08)] transition-all duration-500 hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-50/60 to-transparent rounded-bl-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      <div
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl mb-5 shadow-inner ring-1"
                        style={{
                          backgroundColor: `${department.color}10`,
                          color: department.color,
                          borderColor: `${department.color}20`,
                        }}
                      >
                        <i className={`${area.icon} text-lg`} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">{area.title}</h3>
                      <p className="text-gray-600 leading-relaxed text-[0.9rem]">{area.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CHART + SIDEBAR ── */}
          <section className="pb-16 sm:pb-20">
            <div className={styles.container}>
              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-start max-w-6xl mx-auto" data-reveal="fade-up" style={{ '--reveal-delay': '0.25s' } as any}>
                
                {/* Left: Facilities & Program Highlights */}
                <div className="space-y-6">
                  {/* Facilities */}
                  <article className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 sm:p-10 transition-shadow duration-500 hover:shadow-[0_8px_40px_rgb(0,58,143,0.08)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/40 to-white/80 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5 shadow-inner ring-1 ring-emerald-100/50">
                        <i className="fas fa-flask text-xl" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-5">Facilities & Labs</h2>
                      <ul className="space-y-3">
                        {department.facilities.map((facility, i) => (
                          <li key={i} className="flex items-start gap-3 text-gray-600 text-[0.9rem]">
                            <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-emerald-400" />
                            {facility}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>

                  {/* Program Highlights */}
                  <article className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 sm:p-10 transition-shadow duration-500 hover:shadow-[0_8px_40px_rgb(0,58,143,0.08)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/40 to-white/80 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 mb-5 shadow-inner ring-1 ring-violet-100/50">
                        <i className="fas fa-star text-xl" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-5">Program Highlights</h2>
                      <ul className="space-y-3">
                        {department.programHighlights.map((highlight, i) => (
                          <li key={i} className="flex items-start gap-3 text-gray-600 text-[0.9rem]">
                            <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-violet-400" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </div>

                {/* Right: Chart + Department Navigation */}
                <div className="space-y-6">
                  <aside className="w-full rounded-3xl" style={{ height: '500px', '--reveal-delay': '0.3s' } as any} data-reveal="fade-left">
                    <DepartmentChart departmentId={department.id} chartData={department.chartData} />
                  </aside>

                  {/* Department Navigation */}
                  <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 transition-shadow duration-500 hover:shadow-[0_8px_40px_rgb(0,58,143,0.08)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/40 to-white/80 pointer-events-none rounded-3xl" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-brand mb-6 flex items-center gap-2 relative z-10">
                      Explore Other Departments
                    </h3>
                    <div className="flex flex-wrap gap-4 relative z-10">
                      {departmentsData.map(dept => {
                        const isActive = department.id === dept.id;
                        return (
                          <Link
                            key={dept.id}
                            href={`/departments/${dept.id}`}
                            className={`
                              group relative overflow-hidden inline-flex items-center justify-center min-w-[5rem] px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300
                              ${isActive 
                                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-[0_8px_20px_rgb(246,190,0,0.3)] ring-1 ring-amber-400/50 scale-105" 
                                : "bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 hover:text-amber-600 hover:ring-amber-400/50 hover:bg-amber-50/50 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgb(246,190,0,0.2)]"
                              }
                            `}
                          >
                            {isActive && (
                              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                              {dept.id} 
                              {!isActive && <i className="fas fa-arrow-right text-[0.7rem] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA SECTION ── */}
          <section className="pb-20 sm:pb-28">
            <div className={styles.container}>
              <div
                className="relative overflow-hidden max-w-5xl mx-auto bg-gradient-to-br from-brand via-blue-800 to-brand rounded-3xl p-10 sm:p-14 text-center shadow-[0_20px_60px_rgb(0,58,143,0.3)]"
                data-reveal="fade-up"
                style={{ '--reveal-delay': '0.35s' } as any}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(251,191,36,0.08),transparent_50%)] pointer-events-none" />
                <div className="relative z-10">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm text-white mb-6 ring-1 ring-white/20">
                    <i className={`${department.icon} text-2xl`} />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                    Ready to Start Your {department.id} Capstone?
                  </h2>
                  <p className="text-blue-100/90 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
                    ThesisTrack streamlines the entire research lifecycle for the <strong className="text-white">{department.name}</strong> department — from title proposal to final defense.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 bg-white text-brand px-8 py-3.5 rounded-full font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <i className="fas fa-sign-in-alt" />
                      Sign In to ThesisTrack
                    </Link>
                    <Link
                      href="/#about"
                      className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-3.5 rounded-full font-bold text-sm ring-1 ring-white/20 hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <i className="fas fa-info-circle" />
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <LandingFooter />
        
        {/* Global styles for specific animations used above */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient {
            animation: gradient 8s ease infinite;
          }
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}} />
      </div>
    </PublicLayout>
  );
}
