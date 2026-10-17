import React, { useMemo, useState } from "react";
import type { Alert } from "@/lib/trailguardApi";
import { byDay, explainCounts, tierCounts, topUsers } from "./aggregate";
import AreaChart from "./charts/AreaChart";
import BarChart from "./charts/BarChart";
import DonutChart from "./charts/DonutChart";
import Icon from "./Icon";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  RiskRing,
  Skeleton,
  StatCard,
  toast,
} from "./primitives";
import { decisionKey, useDashboardData } from "./useDashboardData";
import {
  cn,
  explainTone,
  fmtDate,
  fmtNum,
  fmtPct,
  RISK_COLOR,
  riskBand,
  riskPct,
  shortUser,
  tierStyle,
} from "./ui";

function RiskBar({ risk, className }: { risk: number; className?: string }) {
  const color = RISK_COLOR[riskBand(risk)];
  return (
    <span
      className={cn(
        "relative inline-block h-1.5 w-16 overflow-hidden rounded-full bg-white/10 align-middle",
        className,
      )}
    >
      <span
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${riskPct(risk)}%`, background: color }}
      />
    </span>
  );
}

function QueueRow({
  alert,
  onDecide,
}: {
  alert: Alert;
  onDecide: (a: Alert, d: "approve" | "reject") => Promise<void>;
}) {
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const s = tierStyle(alert.tier);

  const run = async (d: "approve" | "reject") => {
    setBusy(d);
    await onDecide(alert, d);
    setBusy(null);
  };

  return (
    <div className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.02]">
      <RiskRing risk={alert.risk} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-text-light">
            user {shortUser(alert.user)}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[0.64rem] font-semibold ${s.badge}`}>
            tier {alert.tier}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-text-dark">
          {fmtDate(alert.day)} · {alert.action}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="ok"
          icon="check"
          disabled={busy !== null}
          onClick={() => run("approve")}
        >
          {busy === "approve" ? "…" : "Setujui"}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon="x"
          disabled={busy !== null}
          onClick={() => run("reject")}
        >
          Tolak
        </Button>
      </div>
    </div>
  );
}

export default function Overview() {
  const {
    loading,
    alerts,
    metrics,
    source,
    decisionMap,
    decide,
  } = useDashboardData();

  const days = useMemo(() => byDay(alerts), [alerts]);
  const tiers = useMemo(() => tierCounts(alerts), [alerts]);
  const users = useMemo(() => topUsers(alerts, 5), [alerts]);
  const explains = useMemo(() => explainCounts(alerts), [alerts]);
  const recent = useMemo(
    () => [...alerts].sort((a, b) => b.risk - a.risk).slice(0, 6),
    [alerts],
  );
  const pending = useMemo(
    () =>
      alerts.filter(
        (a) => a.requires_human_approval && !decisionMap.has(decisionKey(a)),
      ),
    [alerts, decisionMap],
  );

  const onDecide = async (a: Alert, d: "approve" | "reject") => {
    const res = await decide(a, d);
    if (res.offline) toast("Keputusan tidak tersimpan (API offline).", "err");
    else toast(d === "approve" ? "Alert disetujui." : "Alert ditolak.", "ok");
  };

  const areaSeries = days.map((d) => ({
    day: d.day,
    value: d.maxRisk,
    count: d.count,
  }));
  const barData = days.map((d) => ({
    day: d.day,
    count: d.count,
    band: d.band,
  }));
  const tierSegments = [
    { label: "tier 3 · tiket", value: tiers[3], color: RISK_COLOR.high },
    { label: "tier 2 · step-up", value: tiers[2], color: RISK_COLOR.mid },
    { label: "tier 1 · log", value: tiers[1], color: "#71717a" },
  ];
  const maxExplain = Math.max(...explains.map((e) => e.count), 1);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {source === "sample" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-sm text-amber-200/90">
          <Icon name="info" className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <p>
            Menampilkan <strong className="text-amber-200">data contoh</strong> —
            bukan hasil nyata. Jalankan pipeline lalu <code className="font-mono">make api</code>{" "}
            untuk data sebenarnya dari <code className="font-mono">outputs/</code>.
          </p>
        </div>
      )}

      {/* KPI */}
      <section className="dr-in grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Precision @ budget"
          value={fmtPct(metrics.precision_at_budget)}
          hint="dari alert yang ditampilkan"
          icon="target"
          accent="text-emerald-300"
          bar={metrics.precision_at_budget}
        />
        <StatCard
          label="Recall @ budget"
          value={fmtPct(metrics.recall_at_budget)}
          hint="dari user-hari jahat"
          icon="gauge"
          accent="text-primary"
          bar={metrics.recall_at_budget}
        />
        <StatCard
          label="Insider terdeteksi"
          value={`${metrics.insiders_detected ?? "—"} / ${metrics.insiders_in_test ?? "?"}`}
          hint="di set uji"
          icon="user"
        />
        <StatCard
          label="Median days-to-detection"
          value={
            typeof metrics.median_days_to_detection === "number"
              ? `${metrics.median_days_to_detection} hari`
              : "—"
          }
          hint="sejak aktivitas pertama"
          icon="clock"
        />
        <StatCard
          label="Alert ditampilkan"
          value={fmtNum(metrics.n_alerts)}
          hint={
            typeof metrics.alert_budget_per_day === "number"
              ? `budget ${metrics.alert_budget_per_day}/hari`
              : undefined
          }
          icon="alert"
          spark={days.map((d) => d.count)}
        />
        <StatCard
          label="User-hari jahat"
          value={fmtNum(metrics.n_malicious_user_days)}
          hint="label uji (hanya evaluasi)"
          icon="layers"
        />
      </section>

      {/* charts */}
      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="dr-in lg:col-span-2">
          <CardHeader
            title="Skor risiko dari waktu ke waktu"
            subtitle="nilai maksimum per hari · ambang 0.60 (step-up) & 0.85 (tiket)"
            icon="chart"
          />
          <div className="p-5">
            <AreaChart series={areaSeries} />
          </div>
        </Card>
        <Card className="dr-in">
          <CardHeader
            title="Distribusi tier"
            subtitle={`${alerts.length} alert · ${pending.length} menunggu`}
            icon="layers"
          />
          <div className="p-5">
            <DonutChart segments={tierSegments} />
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="dr-in lg:col-span-2">
          <CardHeader
            title="Alert per hari"
            subtitle="warna menunjukkan band risiko maksimum"
            icon="calendar"
            action={
              <div className="flex items-center gap-3 text-[0.68rem] text-text-dark">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm" style={{ background: RISK_COLOR.high }} />
                  kritis
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm" style={{ background: RISK_COLOR.mid }} />
                  sedang
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm" style={{ background: RISK_COLOR.low }} />
                  rendah
                </span>
              </div>
            }
          />
          <div className="p-5">
            <BarChart data={barData} />
          </div>
        </Card>
        <Card className="dr-in">
          <CardHeader
            title="Metode penjelasan"
            subtitle="explain_method pada alert"
            icon="spark"
          />
          <div className="space-y-4 p-5">
            {explains.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-dark">—</p>
            ) : (
              explains.map((e) => (
                <div key={e.method}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={`rounded-md px-2 py-0.5 font-mono text-[0.68rem] ${explainTone(e.method)}`}>
                      {e.method}
                    </span>
                    <span className="font-mono text-xs text-text-dark">
                      {e.count} alert
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light"
                      style={{ width: `${(e.count / maxExplain) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* queue + top users */}
      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="dr-in lg:col-span-2">
          <CardHeader
            title="Menunggu persetujuan"
            subtitle="tier 3 — sistem tidak pernah memblokir otomatis"
            icon="alert"
            action={
              <Badge tone={pending.length ? "secondary" : "emerald"}>
                {pending.length} antrian
              </Badge>
            }
          />
          {pending.length === 0 ? (
            <EmptyState
              icon="check"
              title="Tidak ada yang menunggu"
              hint="Semua alert tier 3 sudah diputuskan."
            />
          ) : (
            <div className="divide-y divide-border/60">
              {pending.slice(0, 6).map((a) => (
                <QueueRow key={decisionKey(a)} alert={a} onDecide={onDecide} />
              ))}
            </div>
          )}
        </Card>
        <Card className="dr-in">
          <CardHeader
            title="Pengguna paling berisiko"
            subtitle="maksimum 5"
            icon="users"
          />
          <div className="space-y-3 p-5">
            {users.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-dark">—</p>
            ) : (
              users.map((u, i) => (
                <div key={u.user} className="flex items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white/5 font-mono text-[0.68rem] text-text-dark">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-text-light">
                    {shortUser(u.user)}
                  </span>
                  <span className="text-[0.68rem] text-text-dark">{u.count}×</span>
                  <RiskBar risk={u.maxRisk} />
                  <span className="w-9 text-right font-mono text-xs text-white">
                    {u.maxRisk.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* recent alerts */}
      <Card className="dr-in">
        <CardHeader
          title="Alert terbaru"
          subtitle="risiko tertinggi dari kumpulan saat ini"
          icon="list"
          action={
            <a
              href="/dashboard/alerts"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:border-primary/40 hover:text-white"
            >
              Lihat semua <Icon name="chevronRight" className="size-3.5" />
            </a>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="text-[0.68rem] uppercase tracking-wide text-text-dark">
              <tr className="border-b border-border/60">
                <th className="px-5 py-2.5 font-medium">Pengguna</th>
                <th className="px-4 py-2.5 font-medium">Tanggal</th>
                <th className="px-4 py-2.5 font-medium">Risiko</th>
                <th className="px-4 py-2.5 font-medium">Tier</th>
                <th className="px-4 py-2.5 font-medium">Explain</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((a) => {
                const s = tierStyle(a.tier);
                return (
                  <tr
                    key={decisionKey(a)}
                    className="border-b border-border/40 transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 font-mono text-text-light">
                      user {shortUser(a.user)}
                    </td>
                    <td className="px-4 py-3 text-text-dark">{fmtDate(a.day)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RiskBar risk={a.risk} />
                        <span className="font-mono text-xs text-white">
                          {a.risk.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[0.66rem] font-semibold ${s.badge}`}>
                        tier {a.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 font-mono text-[0.68rem] ${explainTone(a.explain_method)}`}>
                        {a.explain_method}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
