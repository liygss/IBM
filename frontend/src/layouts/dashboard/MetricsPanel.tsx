import React from "react";
import type { Metrics, Source } from "@/lib/trailguardApi";
import { fmtNum, fmtPct } from "./ui";

interface Props {
  metrics: Metrics;
  source: Source;
}

interface Card {
  label: string;
  value: string;
  hint?: string;
}

export default function MetricsPanel({ metrics, source }: Props) {
  const cards: Card[] = [
    {
      label: "Precision @ budget",
      value: fmtPct(metrics.precision_at_budget),
      hint: "dari alert yang ditampilkan",
    },
    {
      label: "Recall @ budget",
      value: fmtPct(metrics.recall_at_budget),
      hint: "dari user-hari jahat",
    },
    {
      label: "Insider terdeteksi",
      value:
        typeof metrics.insiders_detected === "number"
          ? `${metrics.insiders_detected} / ${metrics.insiders_in_test ?? "?"}`
          : "—",
      hint: "di set uji",
    },
    {
      label: "Median days-to-detection",
      value:
        typeof metrics.median_days_to_detection === "number"
          ? `${metrics.median_days_to_detection} hari`
          : "—",
      hint: "sejak aktivitas pertama",
    },
    {
      label: "Alert ditampilkan",
      value: fmtNum(metrics.n_alerts),
      hint:
        typeof metrics.alert_budget_per_day === "number"
          ? `budget ${metrics.alert_budget_per_day}/hari`
          : undefined,
    },
    {
      label: "User-hari jahat",
      value: fmtNum(metrics.n_malicious_user_days),
      hint: "label uji (hanya evaluasi)",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-border bg-light p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-text-dark">
            {c.label}
          </p>
          <p className="mt-2 font-secondary text-h5 font-bold text-white">
            {c.value}
          </p>
          {c.hint && <p className="mt-1 text-xs text-text-dark">{c.hint}</p>}
        </div>
      ))}
      {source === "sample" && (
        <p className="sm:col-span-2 lg:col-span-3 text-xs text-text-dark">
          Angka contoh (pratinjau) — bukan hasil nyata. Isi sebenarnya dari{" "}
          <code className="font-mono text-text">outputs/metrics.json</code>.
        </p>
      )}
    </div>
  );
}
