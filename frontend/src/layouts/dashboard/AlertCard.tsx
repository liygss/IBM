import React, { useState } from "react";
import type { Alert, Decision, Source } from "@/lib/trailguardApi";
import Icon from "./Icon";
import { explainTone, riskBand, RISK_COLOR, shortUser, tierStyle } from "./ui";

interface Props {
  alert: Alert;
  decision?: Decision;
  source: Source;
  onDecide: (alert: Alert, decision: "approve" | "reject") => void;
}

function RiskRing({ risk }: { risk: number }) {
  const band = riskBand(risk);
  const color = RISK_COLOR[band];
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, risk));
  return (
    <div className="relative grid size-14 shrink-0 place-items-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-border)" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <span className="font-mono text-sm font-bold" style={{ color }}>
        {risk.toFixed(2)}
      </span>
    </div>
  );
}

export default function AlertCard({ alert, decision, source, onDecide }: Props) {
  const s = tierStyle(alert.tier);
  const [open, setOpen] = useState(false);
  const canAct = alert.requires_human_approval;

  return (
    <article
      className={`rounded-2xl border border-border border-l-4 bg-light/70 p-4 transition hover:border-primary/30 ${s.bar}`}
    >
      <div className="flex gap-4">
        <RiskRing risk={alert.risk} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="font-mono text-sm text-text-light">
              user {shortUser(alert.user)}
            </span>
            <span className="text-xs text-text-dark">{alert.day}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold ${s.badge}`}>
              tier {alert.tier} · {alert.action}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 font-mono text-[0.68rem] ${explainTone(alert.explain_method)}`}
            >
              explain: {alert.explain_method}
            </span>
            {canAct && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-[0.68rem] font-semibold text-secondary">
                <Icon name="alert" className="size-3.5" /> butuh persetujuan
              </span>
            )}
          </div>

          <p className="mt-2 text-sm leading-6 text-text">{alert.summary}</p>

          {/* reasons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {alert.reasons.map((r, i) => {
              const contrib =
                typeof r.contribution === "number" ? r.contribution : undefined;
              const width = contrib
                ? Math.min(100, Math.abs(contrib) * 220)
                : typeof r.z === "number"
                  ? Math.min(100, Math.abs(r.z) * 30)
                  : 40;
              return (
                <span
                  key={`${r.feature}-${i}`}
                  className="group inline-flex items-center gap-2 rounded-lg border border-border bg-body/50 px-2.5 py-1 text-[0.7rem] text-text"
                >
                  <span className="text-text-light">{r.label}</span>
                  <span className="relative h-1 w-10 overflow-hidden rounded-full bg-white/10">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-primary"
                      style={{ width: `${width}%` }}
                    />
                  </span>
                  <span className="font-mono text-text-dark">
                    {contrib !== undefined
                      ? `+${contrib.toFixed(2)}`
                      : typeof r.z === "number"
                        ? `${r.z >= 0 ? "+" : ""}${r.z.toFixed(1)} SD`
                        : `= ${r.value}`}
                  </span>
                </span>
              );
            })}
          </div>

          {/* actions */}
          {canAct && (
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/70 pt-3">
              {decision ? (
                <span
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    decision.decision === "approve"
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-secondary/15 text-secondary"
                  }`}
                >
                  {decision.decision === "approve" ? (
                    <Icon name="check" className="size-4" />
                  ) : (
                    <Icon name="x" className="size-4" />
                  )}
                  {decision.decision === "approve" ? "Disetujui" : "Ditolak"}
                  <span className="font-normal text-text-dark">
                    {decision.ts.slice(0, 16).replace("T", " ")}
                  </span>
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onDecide(alert, "approve")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                  >
                    <Icon name="check" className="size-4" /> Setujui
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecide(alert, "reject")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/40 bg-secondary/10 px-3.5 py-1.5 text-xs font-semibold text-secondary transition hover:bg-secondary/20"
                  >
                    <Icon name="x" className="size-4" /> Tolak
                  </button>
                  <span className="text-[0.68rem] text-text-dark">
                    {source === "live"
                      ? "tersimpan ke outputs/decisions.jsonl"
                      : "pratinjau — tidak tersimpan"}
                  </span>
                </>
              )}
            </div>
          )}

          {/* detail toggle */}
          {alert.reasons.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="mt-3 inline-flex items-center gap-1 text-[0.7rem] font-medium text-text-dark transition hover:text-text"
            >
              <Icon
                name="chevron"
                className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              />
              {open ? "Sembunyikan detail" : "Detail fitur"}
            </button>
          )}
          {open && (
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-[0.72rem]">
                <thead className="bg-body/60 text-text-dark">
                  <tr>
                    <th className="px-3 py-2 font-medium">fitur</th>
                    <th className="px-3 py-2 font-medium">nilai</th>
                    <th className="px-3 py-2 font-medium">kontribusi</th>
                  </tr>
                </thead>
                <tbody>
                  {alert.reasons.map((r, i) => (
                    <tr key={`d-${r.feature}-${i}`} className="border-t border-border/60">
                      <td className="px-3 py-1.5 font-mono text-text-light">{r.feature}</td>
                      <td className="px-3 py-1.5 font-mono text-text">{r.value}</td>
                      <td className="px-3 py-1.5 font-mono text-text-dark">
                        {typeof r.contribution === "number"
                          ? `+${r.contribution.toFixed(4)}`
                          : typeof r.z === "number"
                            ? `${r.z.toFixed(2)} SD`
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {alert.note && (
                <p className="border-t border-border/60 px-3 py-2 text-[0.7rem] text-text-dark">
                  {alert.note}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
