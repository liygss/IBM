import React from "react";
import type { Metrics, Source } from "@/lib/trailguardApi";
import Icon from "./Icon";
import { fmtNum, fmtPct } from "./ui";

interface Props {
  metrics: Metrics;
  source: Source;
  tierCounts: { 1: number; 2: number; 3: number };
}

interface Kpi {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  bar?: number; // 0..1
  tone: string;
}

export default function MetricsPanel({ metrics, source, tierCounts }: Props) {
  const kpis: Kpi[] = [
    {
      label: "Precision @ budget",
      value: fmtPct(metrics.precision_at_budget),
      hint: "dari alert yang ditampilkan",
      icon: "target",
      bar: metrics.precision_at_budget,
      tone: "text-emerald-300",
    },
    {
      label: "Recall @ budget",
      value: fmtPct(metrics.recall_at_budget),
      hint: "dari user-hari jahat",
      icon: "gauge",
      bar: metrics.recall_at_budget,
      tone: "text-primary",
    },
    {
      label: "Insider terdeteksi",
      value:
        typeof metrics.insiders_detected === "number"
          ? `${metrics.insiders_detected} / ${metrics.insiders_in_test ?? "?"}`
          : "—",
      hint: "di set uji",
      icon: "user",
      tone: "text-white",
    },
    {
      label: "Median days-to-detection",
      value:
        typeof metrics.median_days_to_detection === "number"
          ? `${metrics.median_days_to_detection} hari`
          : "—",
      hint: "sejak aktivitas pertama",
      icon: "clock",
      tone: "text-white",
    },
    {
      label: "Alert ditampilkan",
      value: fmtNum(metrics.n_alerts),
      hint:
        typeof metrics.alert_budget_per_day === "number"
          ? `budget ${metrics.alert_budget_per_day}/hari`
          : undefined,
      icon: "alert",
      tone: "text-white",
    },
    {
      label: "User-hari jahat",
      value: fmtNum(metrics.n_malicious_user_days),
      hint: "label uji (hanya evaluasi)",
      icon: "layers",
      tone: "text-white",
    },
  ];

  const totalTier = tierCounts[1] + tierCounts[2] + tierCounts[3] || 1;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="group relative overflow-hidden rounded-2xl border border-border bg-light p-5 transition hover:border-primary/40"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-dark">
                {k.label}
              </p>
              <Icon name={k.icon} className="size-5 text-primary/70" />
            </div>
            <p className={`mt-3 font-secondary text-h4 font-bold ${k.tone}`}>
              {k.value}
            </p>
            {typeof k.bar === "number" && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                  style={{ width: `${Math.max(0, Math.min(1, k.bar)) * 100}%` }}
                />
              </div>
            )}
            {k.hint && <p className="mt-1.5 text-xs text-text-dark">{k.hint}</p>}
          </div>
        ))}
      </div>

      {/* Tier distribution */}
      <div className="rounded-2xl border border-border bg-light p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-dark">
            Distribusi alert per tier
          </p>
          <span className="font-mono text-xs text-text-dark">
            {totalTier} alert
          </span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
          <span
            className="bg-secondary"
            style={{ width: `${(tierCounts[3] / totalTier) * 100}%` }}
            title={`tier 3: ${tierCounts[3]}`}
          />
          <span
            className="bg-amber-400"
            style={{ width: `${(tierCounts[2] / totalTier) * 100}%` }}
            title={`tier 2: ${tierCounts[2]}`}
          />
          <span
            className="bg-zinc-500"
            style={{ width: `${(tierCounts[1] / totalTier) * 100}%` }}
            title={`tier 1: ${tierCounts[1]}`}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-2 text-secondary">
            <span className="size-2.5 rounded-sm bg-secondary" /> tier 3 ·{" "}
            {tierCounts[3]}
          </span>
          <span className="inline-flex items-center gap-2 text-amber-300">
            <span className="size-2.5 rounded-sm bg-amber-400" /> tier 2 ·{" "}
            {tierCounts[2]}
          </span>
          <span className="inline-flex items-center gap-2 text-zinc-300">
            <span className="size-2.5 rounded-sm bg-zinc-500" /> tier 1 ·{" "}
            {tierCounts[1]}
          </span>
        </div>
      </div>

      {source === "sample" && (
        <p className="text-xs text-amber-300/80">
          Angka contoh (pratinjau) — bukan hasil nyata. Isi sebenarnya dari{" "}
          <code className="font-mono text-amber-200">outputs/metrics.json</code>.
        </p>
      )}
    </div>
  );
}
