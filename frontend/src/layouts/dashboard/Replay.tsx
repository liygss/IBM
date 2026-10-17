import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchReplay, type ReplayEvent, type Source } from "@/lib/trailguardApi";
import Icon from "./Icon";

const EVENT_TONE: Record<string, string> = {
  logon: "text-emerald-300",
  logoff: "text-emerald-300/70",
  connect: "text-amber-300",
  disconnect: "text-amber-300/70",
  file_op: "text-primary",
  visit: "text-sky-300",
  email_ext: "text-secondary",
  email_int: "text-text-light",
};

const SPEEDS = [
  { label: "0.5×", ms: 700 },
  { label: "1×", ms: 350 },
  { label: "2×", ms: 175 },
  { label: "4×", ms: 90 },
];

export default function Replay() {
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [source, setSource] = useState<Source>("sample");
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetchReplay(200).then((res) => {
      if (!alive) return;
      setEvents(res.data.events);
      setAvailable(res.data.available);
      setSource(res.source);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setIndex((i) => {
        if (i >= events.length) {
          stop();
          return i;
        }
        return i + 1;
      });
    }, SPEEDS[speed].ms);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, events.length, stop, speed]);

  const visible = useMemo(() => events.slice(0, index), [events, index]);
  const done = index >= events.length && events.length > 0;

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of events) m.set(e.source, (m.get(e.source) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [events]);

  const play = () => {
    if (done) setIndex(0);
    setPlaying(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-border bg-light p-8">
        <div
          className="absolute -right-16 -top-20 size-64 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-secondary) 40%, transparent) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-end gap-5">
          <div className="mr-auto">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              <Icon name="play" className="size-4" />
              Simulasi aliran event
            </p>
            <h1 className="font-secondary text-h3 font-bold text-white">Replay</h1>
            <p className="mt-2 max-w-xl text-sm text-text">
              Pemutaran ulang log historis — bukan streaming nyata.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
              REPLAY
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                source === "live"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-300"
              }`}
            >
              {source === "live" ? "Live · Flask API" : "Pratinjau · data contoh"}
            </span>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/20"
            >
              ← Dashboard
            </a>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-3xl border border-border bg-light">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          <button
            type="button"
            onClick={playing ? stop : play}
            disabled={loading || events.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-body transition hover:brightness-110 disabled:opacity-40"
          >
            <Icon name={playing ? "x" : "play"} className="size-4" />
            {playing ? "Jeda" : done ? "Ulang" : "Putar"}
          </button>
          <button
            type="button"
            onClick={() => {
              stop();
              setIndex(events.length);
            }}
            disabled={loading || events.length === 0}
            className="rounded-full border border-border px-4 py-1.5 text-sm text-text transition hover:text-white disabled:opacity-40"
          >
            Lompat ke akhir
          </button>

          <div className="flex rounded-full border border-border bg-body/40 p-0.5">
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setSpeed(i)}
                className={`rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition ${
                  speed === i ? "bg-primary/20 text-primary" : "text-text-dark hover:text-text"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <span className="ml-auto font-mono text-xs text-text-dark">
            {index}/{events.length} event
          </span>
        </div>

        {/* Progress */}
        <div className="h-1 w-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-200"
            style={{
              width: `${events.length ? (index / events.length) * 100 : 0}%`,
            }}
          />
        </div>

        {/* Source counters */}
        {!loading && events.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
            {counts.map(([src, n]) => (
              <span
                key={src}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-body/40 px-3 py-1 text-[0.7rem] text-text-dark"
              >
                <span className="text-text-light">{src}</span>
                <span className="font-mono">{n}</span>
              </span>
            ))}
          </div>
        )}

        {/* Feed */}
        <div className="p-5">
          {loading ? (
            <div className="animate-pulse space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-11 rounded-xl bg-body/60" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-border bg-body/40 p-10 text-center">
              <Icon name="route" className="mx-auto mb-3 size-10 text-primary/60" />
              <p className="text-text">Belum ada event untuk diputar.</p>
              <code className="mt-3 inline-block rounded-lg bg-body px-4 py-2 font-mono text-sm text-primary">
                make toy
              </code>
            </div>
          ) : (
            <ol className="space-y-1.5">
              {visible
                .slice()
                .reverse()
                .map((e, i) => {
                  const idx = visible.length - 1 - i;
                  const prev = idx > 0 ? visible[idx - 1] : null;
                  const showDay = !prev || prev.ts.slice(0, 10) !== e.ts.slice(0, 10);
                  return (
                    <React.Fragment key={`${e.ts}-${idx}`}>
                      {showDay && (
                        <li className="pt-3 pb-1 text-[0.68rem] font-semibold uppercase tracking-wide text-text-dark">
                          {e.ts.slice(0, 10)}
                        </li>
                      )}
                      <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-body/40 px-4 py-2.5 text-sm">
                        <span className="font-mono text-xs text-text-dark">
                          {e.ts.slice(11)}
                        </span>
                        <span className="font-mono text-xs text-text-light">
                          user {e.user.slice(0, 8)}
                        </span>
                        <span
                          className={`font-mono text-xs font-semibold ${
                            EVENT_TONE[e.action] ?? "text-text"
                          }`}
                        >
                          {e.source}/{e.action}
                        </span>
                        {e.target && (
                          <span className="font-mono text-xs text-text-dark">
                            → {e.target}
                          </span>
                        )}
                        {e.size && e.size !== "0" && (
                          <span className="ml-auto font-mono text-[0.68rem] text-text-dark">
                            {Number(e.size).toLocaleString("id-ID")} bytes
                          </span>
                        )}
                      </li>
                    </React.Fragment>
                  );
                })}
            </ol>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-2 text-xs text-text-dark">
        <p>Event ter-pseudonim (Kontrak #1). ID asli tidak pernah ditampilkan.</p>
        {!available && !loading && (
          <p>
            Data event asli belum ada — ini contoh. Untuk data nyata:{" "}
            <code className="font-mono text-text">
              python -m trailguard.pipeline ingest
            </code>{" "}
            lalu muat ulang.
          </p>
        )}
      </div>
    </div>
  );
}
