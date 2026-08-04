import Link from "next/link";

export function DataError({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="card p-6">
        <h1 className="text-xl font-bold tracking-tight">Could not load air quality data</h1>
        <p className="mt-2 text-sm leading-relaxed text-mist-300">
          The upstream forecast service did not answer. This is usually temporary — reload in a
          moment, or try a different location.
        </p>
        <p className="mt-3 rounded-lg border border-ink-700/70 bg-ink-850/60 p-3 font-mono text-[11px] text-mist-400">
          {message}
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-400/20"
        >
          Back to start
        </Link>
      </div>
    </div>
  );
}
