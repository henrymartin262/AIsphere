export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-6 py-10">
      <div className="mb-6 h-8 w-64 rounded-xl bg-gray-100 dark:bg-white/10" />
      <div className="card p-8 space-y-4">
        <div className="h-6 w-3/4 rounded-lg bg-gray-100 dark:bg-white/10" />
        <div className="h-4 w-full rounded bg-gray-50 dark:bg-white/5" />
        <div className="h-4 w-5/6 rounded bg-gray-50 dark:bg-white/5" />
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[0,1,2].map(i => <div key={i} className="h-20 rounded-xl bg-gray-50 dark:bg-white/5" />)}
        </div>
      </div>
    </div>
  );
}
