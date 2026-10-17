import React from "react";
import { RISK_COLOR, fmtDate, fmtShortDate, type RiskBand } from "../ui";

export interface BarDatum {
  day: string;
  count: number;
  band: RiskBand;
}

interface Props {
  data: BarDatum[];
  height?: number;
}

/** Bar chart: jumlah alert per hari, warna menurut band risiko maksimum. */
export default function BarChart({ data, height = 176 }: Props) {
  if (!data || data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-dark">
        Belum ada data harian.
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const labelEvery = Math.max(1, Math.ceil(data.length / 12));

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d) => {
          const color = RISK_COLOR[d.band];
          const h = Math.max(4, (d.count / max) * 100);
          return (
            <div
              key={d.day}
              className="group relative flex h-full flex-1 items-end"
            >
              <div
                className="w-full rounded-t-md transition-all duration-200 group-hover:brightness-125"
                style={{
                  height: `${h}%`,
                  background: `linear-gradient(to top, color-mix(in srgb, ${color} 55%, transparent), ${color})`,
                }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-body/95 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur group-hover:block">
                <span className="text-white">{fmtDate(d.day)}</span>
                <span className="ml-2 font-mono text-text-dark">
                  {d.count} alert
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <span
            key={`l-${d.day}`}
            className="flex-1 truncate text-center font-mono text-[0.6rem] text-text-dark"
          >
            {i % labelEvery === 0 ? fmtShortDate(d.day) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
