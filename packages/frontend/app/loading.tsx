export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
        </div>
        <p className="text-sm text-gray-400 dark:text-slate-500">Loading...</p>
      </div>
    </div>
  );
}
