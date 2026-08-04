import { categoryFor, type Standard } from "@/lib/standards";

const START_ANGLE = 135;
const SWEEP = 270;
/** Degrees trimmed off each segment so the bands read as separate arcs. */
const SEGMENT_GAP = 1.2;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, fromDeg: number, toDeg: number) {
  const start = polar(cx, cy, r, fromDeg);
  const end = polar(cx, cy, r, toDeg);
  const largeArc = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

interface Props {
  standard: Standard;
  value: number | null;
  /** Rendered under the value, e.g. the standard's short name. */
  caption?: string;
  size?: number;
}

/**
 * Radial gauge showing where a value sits across a standard's category bands.
 * Band widths are proportional to index range, so the visual position of the
 * needle is directly comparable to the number.
 */
export function AqiGauge({ standard, value, caption, size = 260 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = size * 0.075;
  const radius = cx - strokeWidth / 2 - size * 0.02;

  const edges = [0, ...standard.categories.map((c) => c.max)];
  const category = value === null ? null : categoryFor(standard, value);
  const fraction = value === null ? 0 : Math.min(1, Math.max(0, value / standard.scaleMax));
  const needleAngle = START_ANGLE + fraction * SWEEP;
  const needle = polar(cx, cy, radius, needleAngle);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={
        value === null
          ? `${standard.shortName} unavailable`
          : `${standard.shortName} ${value}, ${category?.label}`
      }
      className="overflow-visible"
    >
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1f2b47" strokeWidth={strokeWidth * 0.5} strokeDasharray="1 6" opacity={0.5} />

      {standard.categories.map((c, i) => {
        const from = START_ANGLE + (edges[i] / standard.scaleMax) * SWEEP + SEGMENT_GAP;
        const to = START_ANGLE + (edges[i + 1] / standard.scaleMax) * SWEEP - SEGMENT_GAP;
        if (to <= from) return null;
        const active = category?.label === c.label;
        return (
          <path
            key={c.label}
            d={arcPath(cx, cy, radius, from, to)}
            stroke={c.color}
            strokeWidth={active ? strokeWidth : strokeWidth * 0.62}
            strokeLinecap="butt"
            fill="none"
            opacity={value === null ? 0.3 : active ? 1 : 0.28}
          />
        );
      })}

      {value !== null && (
        <>
          <circle
            cx={needle.x}
            cy={needle.y}
            r={strokeWidth * 0.62}
            fill={category?.color ?? "#fff"}
            stroke="#070a12"
            strokeWidth={strokeWidth * 0.2}
          />
          <circle cx={needle.x} cy={needle.y} r={strokeWidth * 0.24} fill="#070a12" />
        </>
      )}

      <text
        x={cx}
        y={cy + size * 0.02}
        textAnchor="middle"
        className="tnum"
        style={{
          fontSize: size * 0.28,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          fill: value === null ? "#8fa1c0" : (category?.color ?? "#fff"),
        }}
      >
        {value === null ? "—" : value}
      </text>
      {caption && (
        <text
          x={cx}
          y={cy + size * 0.16}
          textAnchor="middle"
          style={{ fontSize: size * 0.062, fill: "#8fa1c0", letterSpacing: "0.08em", fontWeight: 600 }}
        >
          {caption.toUpperCase()}
        </text>
      )}
      <text
        x={cx}
        y={cy + size * 0.34}
        textAnchor="middle"
        style={{ fontSize: size * 0.05, fill: "#33405e", letterSpacing: "0.04em" }}
      >
        {`0 – ${standard.scaleMax}`}
      </text>
    </svg>
  );
}
