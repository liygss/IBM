import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchReplay, type ReplayEvent, type Source } from "@/lib/trailguardApi";
import Icon from "./Icon";
import { Badge, Button, Card, Segmented } from "./primitives";
import { cn } from "./ui";

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
  { key: "0", label: "0.5×", ms: 700 },
  { key: "1", label: "1×", ms: 350 },
  { key: "2", label: "2×", ms: 175 },
  { key: "3", label: "4×", ms: 90 },
];

export default function Replay() {
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [source, setSource] = useState<Source>("sample");
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState("1");
  const timer = useRef<number | null>(null);

  const load = useCallback(() => {
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

  useEffect(() => {
    const cleanup = load();
    const onRefresh = () => load();
    window.addEventListener("trailguard:refresh", onRefresh);
    return () => {
      cleanup();
      window.removeEventListener("trailguard:refresh", onRefresh);
    };
  }, [load]);

  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setPlaying(false);
  }, []);

  const speedIdx = SPEEDS.findIndex((s) => s.key === speed);

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
    }, SPEEDS[speedIdx].ms);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, events.length, stop, speedIdx]);

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
    <div className="space-y-5">
      <Card className="dr-in overflow-hidden">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          <Badge tone="secondary">REPLAY</Badge>
          <Badge tone={source === "live" ? "emerald" : "amber"}>
            <span
              className={cn(
                "size-1.5 rounded-full",
                source === "live" ? "animate-pulse bg-emerald-400" : "bg-amber-400",
              )}
            />
            {source === "live" ? "Live · Flask API" : "Pratinjau · contoh"}
          </Badge>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              icon={playing ? "x" : "play"}
              disabled={loading || events.length === 0}
              onClick={playing ? stop : play}
            >
              {playing ? "Jeda" : done ? "Ulang" : "Putar"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={loading || events.length === 0}
              onClick={() => {
                stop();
                setIndex(events.length);
              }}
            >
              Lompat ke akhir
            </Button>
            <Segmented
              value={speed}
              onChange={setSpeed}
              options={SPEEDS.map((s) => ({ key: s.key, label: s.label }))}
            />
            <span className="font-mono text-xs text-text-dark">
              {index}/{events.length} event
            </span>
          </div>
        </div>

        {/* progress */}
        <div className="h-1 w-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-200"
            style={{ width: `${events.length ? (index / events.length) * 100 : 0}%` }}
          />
        </div>

        {/* source counters */}
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

        {/* feed */}
        <div className="dr-scroll max-h-[60vh] overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-white/[0.04]" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="mb-4 grid size-14 place-items-center rounded-2xl border border-border bg-body/50 text-primary/70">
                <Icon name="route" className="size-6" />
              </span>
              <p className="font-secondary text-base font-bold text-white">
                Belum ada event untuk diputar
              </p>
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
                      <li className="dr-in flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-body/40 px-4 py-2.5 text-sm">
                        <span className="font-mono text-xs text-text-dark">
                          {e.ts.slice(11)}
                        </span>
                        <span className="font-mono text-xs text-text-light">
                          user {e.user.slice(0, 8)}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-xs font-semibold",
                            EVENT_TONE[e.action] ?? "text-text",
                          )}
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
      </Card>

      <div className="space-y-2 text-xs text-text-dark">
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
