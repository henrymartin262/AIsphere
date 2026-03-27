export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="h-7 w-40 animate-pulse rounded-lg bg-orange-100" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded-lg bg-orange-50" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-full bg-orange-100" />
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-orange-100/60 bg-white/70 p-6 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-orange-50" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 rounded-lg bg-orange-50" />
                <div className="h-3 w-20 rounded-lg bg-orange-50/50" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((j) => (
                <div key={j} className="rounded-xl bg-orange-50/50 p-3">
                  <div className="mx-auto h-5 w-8 rounded bg-orange-100/50" />
                  <div className="mx-auto mt-1 h-2 w-12 rounded bg-orange-50" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
