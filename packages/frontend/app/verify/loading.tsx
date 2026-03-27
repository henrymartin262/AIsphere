export default function VerifyLoading() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 animate-pulse">
        <div className="h-6 w-20 rounded-full bg-orange-100" />
        <div className="mt-4 h-9 w-60 rounded-lg bg-orange-100" />
        <div className="mt-2 h-5 w-full max-w-md rounded-lg bg-orange-50" />
      </div>
      <div className="rounded-2xl border border-orange-100/60 bg-white/70 p-6 animate-pulse">
        <div className="h-4 w-24 rounded bg-orange-100" />
        <div className="mt-3 flex gap-3">
          <div className="h-12 flex-1 rounded-xl bg-orange-50" />
          <div className="h-12 w-24 rounded-xl bg-orange-100" />
        </div>
      </div>
    </main>
  );
}
