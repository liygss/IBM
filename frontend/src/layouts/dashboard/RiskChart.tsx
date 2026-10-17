import React from "react";
import type { Alert } from "@/lib/trailguardApi";

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

export default function RiskChart({ alerts }: Props) {
  const bars = buildBars(alerts);
  if (bars.length === 0) return null;

  const W = 720;
  const H = 180;
  const pad = { top: 12, right: 8, bottom: 26, left: 30 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const gap = 4;
  const bw = Math.max(6, innerW / bars.length - gap);

  const y = (risk: number) => pad.top + innerH * (1 - risk);
  const tick = (risk: number) => ({
    y: y(risk),
    label: risk.toFixed(2),
  });
  const ticks = [tick(0), tick(0.6), tick(0.85), tick(1)];

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Skor risiko maksimum per hari"
        className="min-w-120"
      >
        {ticks.map((t) => (
          <g key={t.label}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={t.y}
              y2={t.y}
              stroke="var(--color-border)"
              strokeWidth="1"
              strokeDasharray={t.label === "0.00" ? "0" : "4 4"}
            />
            <text
              x={pad.left - 6}
              y={t.y + 3}
              textAnchor="end"
              fontSize="9"
              fill="var(--color-text-dark)"
            >
              {t.label}
            </text>
          </g>
        ))}

        {bars.map((b, i) => {
          const x = pad.left + i * (innerW / bars.length) + gap / 2;
          const barH = innerH * b.maxRisk;
          const fill =
            b.maxRisk >= 0.85
              ? "var(--color-secondary)"
              : b.maxRisk >= 0.6
                ? "#fbbf24"
                : "var(--color-primary)";
          return (
            <g key={b.day}>
              <rect
                x={x}
                y={pad.top + innerH - barH}
                width={bw}
                height={barH}
                rx="3"
                fill={fill}
                opacity="0.85"
              />
              <title>
                {b.day}: risiko maks {b.maxRisk.toFixed(2)} · {b.count} alert
              </title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
