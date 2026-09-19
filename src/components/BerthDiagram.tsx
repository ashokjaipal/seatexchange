import type { BerthType, TravelClass } from "@/lib/types";
import { isSittingClass } from "@/lib/rail";

/**
 * A tiny cross-section of one bay, highlighting the berth in question.
 * Gives instant spatial understanding ("oh, side upper") without words.
 */
export function BerthDiagram({
  cls,
  berth,
  size = 64,
  className = "",
}: {
  cls: TravelClass;
  berth: BerthType;
  size?: number;
  className?: string;
}) {
  const hi = "#2a48c2";
  const lo = "#c9d0df";
  const bg = "#f6f7fb";

  if (isSittingClass(cls)) {
    // 3 seats: window | middle | aisle
    const cols: BerthType[] = ["WS", "MS", "AS"];
    return (
      <svg viewBox="0 0 64 40" width={size} height={(size * 40) / 64} className={className} aria-label={`${berth} seat`}>
        <rect x="0" y="0" width="64" height="40" rx="6" fill={bg} />
        <rect x="2" y="4" width="3" height="32" rx="1.5" fill="#b9c3d6" />
        {cols.map((c, i) => (
          <g key={c}>
            <rect x={10 + i * 17} y="10" width="13" height="16" rx="3" fill={c === berth ? hi : lo} />
            <rect x={10 + i * 17} y="26" width="13" height="4" rx="1.5" fill={c === berth ? hi : lo} opacity="0.7" />
          </g>
        ))}
      </svg>
    );
  }

  const tiers = cls === "2A" || cls === "1A" ? 2 : 3;
  const hasSide = cls !== "1A";
  const sideTiers = cls === "3E" ? 3 : 2;
  const H = 40;
  const top = 6;
  const bottom = 34;
  const ys = (n: number) => Array.from({ length: n }, (_, i) => bottom - (i * (bottom - top)) / (n - 1));
  const mainY = ys(tiers);
  const sideY = ys(sideTiers);
  const mainOrder: BerthType[] = tiers === 3 ? ["LB", "MB", "UB"] : ["LB", "UB"];
  const sideOrder: BerthType[] = sideTiers === 3 ? ["SL", "SM", "SU"] : ["SL", "SU"];

  return (
    <svg viewBox={`0 0 64 ${H}`} width={size} height={(size * H) / 64} className={className} aria-label={`${berth} position`}>
      <rect x="0" y="0" width="64" height={H} rx="6" fill={bg} />
      {/* two facing berth stacks */}
      {[4, 22].map((x) =>
        mainOrder.map((b, i) => (
          <rect key={`${x}-${b}`} x={x} y={mainY[i] - 2} width="16" height="4" rx="2" fill={b === berth ? hi : lo} />
        )),
      )}
      {/* aisle */}
      <rect x="41" y="3" width="1.5" height={H - 6} rx="0.75" fill="#c7cddb" />
      {hasSide &&
        sideOrder.map((b, i) => (
          <rect key={b} x="45" y={sideY[i] - 2} width="15" height="4" rx="2" fill={b === berth ? hi : lo} />
        ))}
    </svg>
  );
}
