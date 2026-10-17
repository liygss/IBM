import React, { useMemo, useState } from "react";
import type { Alert } from "@/lib/trailguardApi";
import { RISK_COLOR, riskBand } from "./ui";

interface Props {
  alerts: Alert[];
}

interface DayBar {
  day: string;
  maxRisk: number;
  count: number;
}

function buildBars(alerts: Alert[]): DayBar[] {
  const map = new Map<string, DayBar>();
  for (const a of alerts) {
    const cur = map.get(a.day);
    if (cur) {
      cur.maxRisk = Math.max(cur.maxRisk, a.risk);
      cur.count += 1;
    } else {
      map.set(a.day, { day: a.day, maxRisk: a.risk, count: 1 });
    }
  }
  return [...map.values()].sort((x, y) => x.day.localeCompare(y.day));
}

const W = 760;
const H = 220;
const pad = { top: 16, right: 44, bottom: 34, left: 34 };

export default function RiskChart({ alerts }: Props) {
  const bars = useMemo(() => buildBars(alerts), [alerts]);
  const [hover, setHover] = useState<number | null>(null);

  if (bars.length === 0) return null;

  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const step = innerW / bars.length;
  const bw = Math.max(6, Math.min(46, step - 6));

  const y = (risk: number) => pad.top + innerH * (1 - risk);
  const ticks = [0, 0.6, 0.85, 1];

  const labelEvery = Math.ceil(bars.length / 7);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Skor risiko maksimum per hari"
        className="min-w-140"
      >
        <defs>
          {(["high", "mid", "low"] as const).map((b) => (
            <linearGradient key={b} id={`g-${b}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={RISK_COLOR[b]} stopOpacity="1" />
              <stop offset="100%" stopColor={RISK_COLOR[b]} stopOpacity="0.55" />
            </linearGradient>
          ))}
        </defs>

        {/* grid + y labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--color-border)"
              strokeWidth="1"
              strokeDasharray={t === 0 ? "0" : "4 5"}
            />
            <text
              x={pad.left - 8}
              y={y(t) + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--color-text-dark)"
            >
              {t.toFixed(2)}
            </text>
          </g>
        ))}

        {/* threshold labels */}
        {[
          { r: 0.85, c: "#FF5353", lbl: "tiket" },
          { r: 0.6, c: "#fbbf24", lbl: "step-up" },
        ].map((th) => (
          <text
            key={th.lbl}
            x={W - pad.right + 6}
            y={y(th.r) + 3}
            fontSize="9"
            fill={th.c}
          >
            {th.lbl}
          </text>
        ))}

        {/* bars */}
        {bars.map((b, i) => {
          const x = pad.left + i * step + (step - bw) / 2;
          const barH = innerH * b.maxRisk;
          const band = riskBand(b.maxRisk);
          const active = hover === i;
          return (
            <g
              key={b.day}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <rect
                x={pad.left + i * step}
                y={pad.top}
                width={step}
                height={innerH}
                fill="transparent"
              />
              <rect
                x={x}
                y={pad.top + innerH - barH}
                width={bw}
                height={barH}
                rx="4"
                fill={`url(#g-${band})`}
                opacity={hover === null || active ? 1 : 0.5}
              />
              <title>
                {b.day}: risiko maks {b.maxRisk.toFixed(2)} · {b.count} alert
              </title>
            </g>
          );
        })}

        {/* x labels */}
        {bars.map((b, i) =>
          i % labelEvery === 0 ? (
            <text
              key={`x-${b.day}`}
              x={pad.left + i * step + step / 2}
              y={H - 12}
              textAnchor="middle"
              fontSize="9.5"
              fill="var(--color-text-dark)"
            >
              {b.day.slice(5)}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
