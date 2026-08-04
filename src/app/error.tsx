"use client";

export default function Error({ reset }: { error: unknown; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="card p-6">
        <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-mist-300">
          This page failed while rendering. Try again — if it keeps happening, the upstream air
          quality service is probably having a bad day.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-400/20"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
