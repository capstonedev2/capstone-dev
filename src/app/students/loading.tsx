import '@/styles/student-workspace.css';

export default function Loading() {
  return (
    <div className="student-shell student-workspace-shell">
      <main className="student-global-main">
        <div className="student-global-content">
          <div className="page-body student-dashboard-page">
            <div className="mb-5 flex flex-col gap-3 pt-1">
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
              <div className="h-9 w-80 max-w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-[34rem] max-w-full animate-pulse rounded bg-slate-100" />
            </div>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2" />
              <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
            </section>
            <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
              ))}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
