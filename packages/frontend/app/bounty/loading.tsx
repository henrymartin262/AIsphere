export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-6 py-10">
      <div className="mb-8 h-8 w-48 rounded-xl bg-gray-100 dark:bg-white/10" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0,1,2,3,4,5].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/8 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gray-100 dark:bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded-lg bg-gray-100 dark:bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-gray-50 dark:bg-white/5" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[0,1,2].map((j) => <div key={j} className="h-12 rounded-xl bg-gray-50 dark:bg-white/5" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
