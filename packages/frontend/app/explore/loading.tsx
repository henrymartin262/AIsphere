export default function ExploreLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="rounded-2xl border border-orange-100/60 bg-white/70 p-10 animate-pulse md:p-14">
        <div className="h-6 w-20 rounded-full bg-orange-100" />
        <div className="mt-4 h-9 w-72 rounded-lg bg-orange-100" />
        <div className="mt-3 h-5 w-full max-w-lg rounded-lg bg-orange-50" />
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-orange-100/60 bg-white/70 p-6 animate-pulse">
            <div className="h-12 w-12 rounded-xl bg-orange-50" />
            <div className="mt-3 h-4 w-28 rounded bg-orange-100" />
            <div className="mt-2 h-3 w-full rounded bg-orange-50" />
          </div>
        ))}
      </div>
    </main>
  );
}
