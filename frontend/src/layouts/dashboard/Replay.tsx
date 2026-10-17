import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchReplay, type ReplayEvent, type Source } from "@/lib/trailguardApi";

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

export default function Replay() {
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [source, setSource] = useState<Source>("sample");
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
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
    }, 350);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, events.length, stop]);

  const visible = useMemo(() => events.slice(0, index), [events, index]);
  const done = index >= events.length && events.length > 0;

  const play = () => {
    if (done) setIndex(0);
    setPlaying(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="font-secondary text-h3 font-bold text-white">Replay</h1>
          <p className="mt-1 text-sm text-text-dark">
            Pemutaran ulang log historis sebagai aliran event
          </p>
        </div>
        <span className="rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
          REPLAY · bukan real-time
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
          className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/20"
        >
          ← Dashboard
        </a>
      </div>

      <div className="rounded-3xl border border-border bg-light">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          <button
            type="button"
            onClick={playing ? stop : play}
            disabled={loading || events.length === 0}
            className="rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-body transition hover:brightness-110 disabled:opacity-40"
          >
            {playing ? "❚❚ Jeda" : done ? "↺ Ulang" : "▶ Putar"}
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
          <span className="ml-auto font-mono text-xs text-text-dark">
            {index}/{events.length} event
          </span>
        </div>

        {/* Progress */}
        <div className="h-1 w-full bg-ink-800/60">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-200"
            style={{
              width: `${events.length ? (index / events.length) * 100 : 0}%`,
            }}
          />
        </div>

        {/* Feed */}
        <div className="p-5">
          {loading ? (
            <p className="text-text-dark">Memuat…</p>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-border bg-body/40 p-8 text-center">
              <p className="text-text">Belum ada event untuk diputar.</p>
              <code className="mt-3 inline-block rounded-lg bg-body px-4 py-2 font-mono text-sm text-primary">
                make toy
              </code>
            </div>
          ) : (
            <ol className="space-y-2">
              {visible
                .slice()
                .reverse()
                .map((e, i) => (
                  <li
                    key={`${e.ts}-${events.length - i}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-body/40 px-4 py-2.5 text-sm"
                  >
                    <span className="font-mono text-xs text-text-dark">
                      {e.ts}
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
                ))}
            </ol>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-2 text-xs text-text-dark">
        <p>
          Event ter-pseudonim (Kontrak #1). ID asli tidak pernah ditampilkan.
        </p>
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
