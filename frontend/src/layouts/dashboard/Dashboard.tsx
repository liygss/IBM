import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAlerts,
  fetchConfig,
  fetchDecisions,
  fetchMetrics,
  postDecision,
  type Alert,
  type ConfigInfo,
  type Decision,
  type Metrics,
  type Source,
} from "@/lib/trailguardApi";
import AlertCard from "./AlertCard";
import Icon from "./Icon";
import MetricsPanel from "./MetricsPanel";
import RiskChart from "./RiskChart";

type TierFilter = "all" | 1 | 2 | 3;
type SortKey = "risk" | "day-desc" | "day-asc";

function decisionKey(a: { user: string; day: string }): string {
  return `${a.user}|${a.day}`;
}

function SourceBadge({ source }: { source: Source }) {
  const live = source === "live";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
        live
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border-amber-400/30 bg-amber-400/10 text-amber-300"
      }`}
    >
      <span className={`size-1.5 rounded-full ${live ? "bg-emerald-400" : "bg-amber-400"} ${live ? "animate-pulse" : ""}`} />
      {live ? "Live · Flask API" : "Pratinjau · data contoh"}
    </span>
  );
}

const TIER_TABS: { key: TierFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: 3, label: "Tier 3" },
  { key: 2, label: "Tier 2" },
  { key: 1, label: "Tier 1" },
];

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-light" />
        ))}
      </div>
      <div className="h-56 rounded-2xl bg-light" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-light" />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({});
  const [config, setConfig] = useState<ConfigInfo | null>(null);
  const [source, setSource] = useState<Source>("sample");
  const [decisions, setDecisions] = useState<Decision[]>([]);

  const [tier, setTier] = useState<TierFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("risk");

  useEffect(() => {
    let alive = true;
    Promise.all([fetchAlerts(), fetchMetrics(), fetchConfig(), fetchDecisions()])
      .then(([aRes, mRes, cRes, dRes]) => {
        if (!alive) return;
        setAlerts(aRes.data);
        setMetrics(mRes.data);
        setConfig(cRes.data);
        setSource(aRes.source);
        setDecisions(dRes.data);
        setLoading(false);
        setRefreshing(false);
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const decisionMap = useMemo(() => {
    const m = new Map<string, Decision>();
    for (const d of decisions) m.set(decisionKey(d), d);
    return m;
  }, [decisions]);

  const tierCounts = useMemo(
    () => ({
      1: alerts.filter((a) => a.tier === 1).length,
      2: alerts.filter((a) => a.tier === 2).length,
      3: alerts.filter((a) => a.tier === 3).length,
    }),
    [alerts],
  );

  const pending = useMemo(
    () =>
      alerts.filter(
        (a) =>
          a.requires_human_approval && !decisionMap.has(decisionKey(a)),
      ),
    [alerts, decisionMap],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = alerts.filter((a) => {
      if (tier !== "all" && a.tier !== tier) return false;
      if (!q) return true;
      return a.user.toLowerCase().includes(q) || a.day.includes(q);
    });
    const sorted = [...rows];
    if (sort === "risk") sorted.sort((a, b) => b.risk - a.risk);
    else if (sort === "day-desc") sorted.sort((a, b) => b.day.localeCompare(a.day));
    else sorted.sort((a, b) => a.day.localeCompare(b.day));
    return sorted;
  }, [alerts, tier, query, sort]);

  const handleDecide = useCallback(
    async (alert: Alert, decision: "approve" | "reject") => {
      const row: Decision = {
        ts: new Date().toISOString(),
        user: alert.user,
        day: alert.day,
        decision,
        risk: alert.risk,
        tier: alert.tier,
      };
      setDecisions((prev) => [...prev, row]);
      await postDecision({
        user: alert.user,
        day: alert.day,
        decision,
        risk: alert.risk,
        tier: alert.tier,
      });
    },
    [],
  );

  const refresh = () => {
    setRefreshing(true);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <header className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-light p-8">
        <div
          className="absolute -right-16 -top-24 size-72 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 45%, transparent) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-end gap-6">
          <div className="mr-auto">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Icon name="shieldAlert" className="size-4" />
              TrailGuard · Dashboard
            </p>
            <h1 className="font-secondary text-h3 font-bold text-white">
              Pusat Alert
            </h1>
            <p className="mt-2 max-w-xl text-sm text-text">
              Skor risiko yang bisa dijelaskan, tier respons, dan keputusan
              akhir di tangan manusia.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SourceBadge source={source} />
            {config && (
              <span className="rounded-full border border-border bg-body/50 px-3 py-1 font-mono text-xs text-text-light">
                dataset: {config.dataset}
              </span>
            )}
            <a
              href="/replay"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/20"
            >
              <Icon name="play" className="size-4" /> Replay
            </a>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-body/50 px-4 py-1.5 text-sm text-text transition hover:text-white disabled:opacity-50"
            >
              <Icon
                name="refresh"
                className={`size-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Muat ulang
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <Skeleton />
      ) : (
        <div className="space-y-10">
          {/* Metrics */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-secondary text-h6 font-bold text-white">
              <Icon name="gauge" className="size-5 text-primary" /> Metrik evaluasi
            </h2>
            <MetricsPanel metrics={metrics} source={source} tierCounts={tierCounts} />
          </section>

          {/* Chart + approval queue */}
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-4 flex items-center gap-2 font-secondary text-h6 font-bold text-white">
                <Icon name="chart" className="size-5 text-primary" /> Skor risiko
                harian
                <span className="text-sm font-normal text-text-dark">
                  (maksimum per hari)
                </span>
              </h2>
              <div className="rounded-2xl border border-border bg-light p-5">
                <RiskChart alerts={alerts} />
              </div>
            </div>

            <div>
              <h2 className="mb-4 flex items-center gap-2 font-secondary text-h6 font-bold text-white">
                <Icon name="alert" className="size-5 text-secondary" /> Menunggu
                persetujuan
                <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary">
                  {pending.length}
                </span>
              </h2>
              <div className="rounded-2xl border border-border bg-light p-4">
                {pending.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-dark">
                    Tidak ada alert yang menunggu keputusan. ✓
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {pending.slice(0, 5).map((a) => (
                      <li
                        key={decisionKey(a)}
                        className="rounded-xl border border-border bg-body/40 p-3"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono text-text-light">
                            user {a.user.slice(0, 8)}
                          </span>
                          <span className="font-mono text-secondary">
                            {a.risk.toFixed(2)}
                          </span>
                        </div>
                        <p className="mt-1 text-[0.7rem] text-text-dark">
                          {a.day} · {a.action}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDecide(a, "approve")}
                            className="flex-1 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[0.7rem] font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecide(a, "reject")}
                            className="flex-1 rounded-lg border border-secondary/40 bg-secondary/10 px-2 py-1 text-[0.7rem] font-semibold text-secondary transition hover:bg-secondary/20"
                          >
                            Tolak
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {pending.length > 5 && (
                  <p className="mt-3 text-center text-[0.7rem] text-text-dark">
                    +{pending.length - 5} lainnya di daftar bawah
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Alerts */}
          <section>
            <div className="sticky top-16 z-20 -mx-2 mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-body/85 px-3 py-3 backdrop-blur">
              <h2 className="flex items-center gap-2 font-secondary text-h6 font-bold text-white">
                <Icon name="alert" className="size-5 text-primary" /> Alert
                <span className="text-text-dark">
                  ({filtered.length}/{alerts.length})
                </span>
              </h2>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <div className="flex rounded-full border border-border bg-light p-0.5">
                  {TIER_TABS.map((t) => (
                    <button
                      key={String(t.key)}
                      type="button"
                      onClick={() => setTier(t.key)}
                      className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
                        tier === t.key
                          ? "bg-primary/20 text-primary"
                          : "text-text-dark hover:text-text"
                      }`}
                    >
                      {t.label}
                      {t.key !== "all" && (
                        <span className="ml-1 text-text-dark">
                          {tierCounts[t.key as 1 | 2 | 3]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Icon
                    name="search"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-dark"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari user / tanggal…"
                    className="w-44 rounded-full border border-border bg-light py-1.5 pl-9 pr-3 text-xs text-text placeholder:text-text-dark focus:border-primary focus:outline-none"
                  />
                </div>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-full border border-border bg-light px-3 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
                >
                  <option value="risk">Urut: risiko tertinggi</option>
                  <option value="day-desc">Urut: tanggal terbaru</option>
                  <option value="day-asc">Urut: tanggal terlama</option>
                </select>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="rounded-2xl border border-border bg-light p-10 text-center">
                <Icon
                  name="shield"
                  className="mx-auto mb-3 size-10 text-primary/60"
                />
                <p className="text-text">Belum ada alert. Jalankan pipeline dulu:</p>
                <code className="mt-3 inline-block rounded-lg bg-body px-4 py-2 font-mono text-sm text-primary">
                  make toy
                </code>
                <p className="mt-3 text-xs text-text-dark">
                  Lalu buka dashboard via{" "}
                  <code className="font-mono">make api</code> (Flask :8000).
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="rounded-2xl border border-border bg-light p-6 text-sm text-text-dark">
                Tidak ada alert yang cocok dengan filter/pencarian.
              </p>
            ) : (
              <div className="space-y-3">
                {filtered.map((a) => (
                  <AlertCard
                    key={decisionKey(a)}
                    alert={a}
                    decision={decisionMap.get(decisionKey(a))}
                    source={source}
                    onDecide={handleDecide}
                  />
                ))}
              </div>
            )}

            <p className="mt-4 text-xs text-text-dark">
              Tier 3 (risiko ≥ 0.85) wajib persetujuan manusia — sistem tidak
              pernah memblokir akun otomatis. Angka & tier mengikuti Kontrak #3.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
