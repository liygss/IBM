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
import MetricsPanel from "./MetricsPanel";
import RiskChart from "./RiskChart";

type TierFilter = "all" | 1 | 2 | 3;

function decisionKey(a: { user: string; day: string }): string {
  return `${a.user}|${a.day}`;
}

function SourceBadge({ source }: { source: Source }) {
  const live = source === "live";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        live
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border-amber-400/30 bg-amber-400/10 text-amber-300"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${live ? "bg-emerald-400" : "bg-amber-400"}`}
      />
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

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({});
  const [config, setConfig] = useState<ConfigInfo | null>(null);
  const [source, setSource] = useState<Source>("sample");
  const [decisions, setDecisions] = useState<Decision[]>([]);

  const [tier, setTier] = useState<TierFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      fetchAlerts(),
      fetchMetrics(),
      fetchConfig(),
      fetchDecisions(),
    ]).then(([aRes, mRes, cRes, dRes]) => {
      if (!alive) return;
      setAlerts(aRes.data);
      setMetrics(mRes.data);
      setConfig(cRes.data);
      setSource(aRes.source);
      setDecisions(dRes.data);
      setLoading(false);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alerts.filter((a) => {
      if (tier !== "all" && a.tier !== tier) return false;
      if (!q) return true;
      return a.user.toLowerCase().includes(q) || a.day.includes(q);
    });
  }, [alerts, tier, query]);

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

  const tierCounts = useMemo(() => {
    return {
      1: alerts.filter((a) => a.tier === 1).length,
      2: alerts.filter((a) => a.tier === 2).length,
      3: alerts.filter((a) => a.tier === 3).length,
    };
  }, [alerts]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="mr-auto">
          <h1 className="font-secondary text-h3 font-bold text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-dark">
            Alert + alasan + tier — keputusan akhir di tangan manusia
          </p>
        </div>
        <SourceBadge source={source} />
        {config && (
          <span className="rounded-full border border-border bg-light px-3 py-1 font-mono text-xs text-text-light">
            dataset: {config.dataset}
          </span>
        )}
        <a
          href="/replay"
          className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/20"
        >
          ▶ Replay
        </a>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="rounded-full border border-border bg-light px-4 py-1.5 text-sm text-text transition hover:text-white"
        >
          ⟳ Muat ulang
        </button>
      </div>

      {loading ? (
        <p className="text-text-dark">Memuat…</p>
      ) : (
        <div className="space-y-10">
          {/* Metrics */}
          <section>
            <h2 className="mb-4 font-secondary text-h6 font-bold text-white">
              Metrik evaluasi
            </h2>
            <MetricsPanel metrics={metrics} source={source} />
          </section>

          {/* Chart */}
          <section>
            <h2 className="mb-4 font-secondary text-h6 font-bold text-white">
              Skor risiko harian{" "}
              <span className="text-sm font-normal text-text-dark">
                (maksimum per hari)
              </span>
            </h2>
            <div className="rounded-2xl border border-border bg-light p-5">
              <RiskChart alerts={alerts} />
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-dark">
                <span className="inline-flex items-center gap-2">
                  <span className="size-2.5 rounded-sm bg-primary" /> &lt; 0.60
                  (log)
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="size-2.5 rounded-sm bg-amber-400" /> 0.60–0.85
                  (step-up)
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="size-2.5 rounded-sm bg-secondary" /> ≥ 0.85
                  (tiket)
                </span>
              </div>
            </div>
          </section>

          {/* Alerts */}
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="font-secondary text-h6 font-bold text-white">
                Alert{" "}
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
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari user / tanggal…"
                  className="rounded-full border border-border bg-light px-4 py-1.5 text-xs text-text placeholder:text-text-dark focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="rounded-2xl border border-border bg-light p-8 text-center">
                <p className="text-text">
                  Belum ada alert. Jalankan pipeline dulu:
                </p>
                <code className="mt-3 inline-block rounded-lg bg-body px-4 py-2 font-mono text-sm text-primary">
                  make toy
                </code>
                <p className="mt-3 text-xs text-text-dark">
                  Lalu buka dashboard ini via{" "}
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
              pernah memblokir akun otomatis. Ringkasan “(tier 3)” dsb. berasal
              dari field <code className="font-mono">summary</code> (Kontrak #3).
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
