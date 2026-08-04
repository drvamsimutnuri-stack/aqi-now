export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6" aria-busy="true">
      <div className="h-12 animate-pulse rounded-xl bg-ink-850/70" />
      <div className="h-8 w-72 animate-pulse rounded-lg bg-ink-850/70" />
      <div className="card grid gap-6 p-6 lg:grid-cols-[auto_1fr]">
        <div className="mx-auto h-64 w-64 animate-pulse rounded-full bg-ink-850/70" />
        <div className="space-y-3">
          {[90, 70, 100, 80, 60].map((width, i) => (
            <div
              key={i}
              className="h-5 animate-pulse rounded bg-ink-850/70"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-36 animate-pulse bg-ink-850/40" />
        ))}
      </div>
      <p className="text-center text-sm text-mist-400">Fetching the latest hour from CAMS…</p>
    </div>
  );
}
