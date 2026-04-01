export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-120px)] animate-pulse items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
        <p className="text-xs text-gray-400 dark:text-slate-600">Loading chat...</p>
      </div>
    </div>
  );
}
