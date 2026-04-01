export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-6 py-8">
      <div className="card mb-6 flex items-center gap-4 p-6">
        <div className="h-14 w-14 rounded-2xl bg-gray-100 dark:bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-48 rounded-lg bg-gray-100 dark:bg-white/10" />
          <div className="h-3 w-32 rounded bg-gray-50 dark:bg-white/5" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {[0,1,2,3].map(i => <div key={i} className="card h-32 p-4" />)}
      </div>
    </div>
  );
}
