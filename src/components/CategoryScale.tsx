import { categoryFor, type Standard } from "@/lib/standards";

interface Props {
  standard: Standard;
  value: number | null;
  /** Show each band's numeric range under its label. */
  showRanges?: boolean;
}

/** Horizontal band legend with a marker for the current value. */
export function CategoryScale({ standard, value, showRanges = false }: Props) {
  const active = value === null ? null : categoryFor(standard, value);
  const edges = [0, ...standard.categories.map((c) => c.max)];

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="flex h-2.5 overflow-hidden rounded-full">
          {standard.categories.map((c, i) => (
            <div
              key={c.label}
              style={{
                backgroundColor: c.color,
                flexGrow: edges[i + 1] - edges[i],
                opacity: active === null ? 0.45 : active.label === c.label ? 1 : 0.35,
              }}
              title={`${c.label} (${edges[i]}–${c.max})`}
            />
          ))}
        </div>
        {value !== null && (
          <div
            className="absolute -top-1 h-4.5 w-1 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_2px_#070a12]"
            style={{ left: `${Math.min(100, (value / standard.scaleMax) * 100)}%`, height: "1.125rem" }}
            aria-hidden
          />
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] leading-tight">
        {standard.categories.map((c, i) => {
          const isActive = active?.label === c.label;
          return (
            <span
              key={c.label}
              className={`flex items-center gap-1.5 ${isActive ? "text-mist-100" : "text-mist-400"}`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: c.color, opacity: isActive ? 1 : 0.55 }}
              />
              <span className={isActive ? "font-semibold" : ""}>{c.label}</span>
              {showRanges && (
                <span className="tnum text-mist-400/70">
                  {edges[i]}–{c.max}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
