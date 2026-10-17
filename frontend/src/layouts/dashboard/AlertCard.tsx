import React from "react";
import type { Alert, Decision, Source } from "@/lib/trailguardApi";
import { explainTone, shortUser, tierStyle } from "./ui";

interface Props {
  alert: Alert;
  decision?: Decision;
  source: Source;
  onDecide: (alert: Alert, decision: "approve" | "reject") => void;
}

export default function AlertCard({
  alert,
  decision,
  source,
  onDecide,
}: Props) {
  const s = tierStyle(alert.tier);
  const canAct = alert.requires_human_approval;

  return (
    <article
      className={`rounded-xl border border-border border-l-4 bg-body/40 p-4 ${s.bar}`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-mono text-text-light">
          user {shortUser(alert.user)}
        </span>
        <span className="text-text-dark">{alert.day}</span>
        <span className="font-mono text-white">
          risiko {alert.risk.toFixed(2)}
        </span>
        <span className={`rounded px-2 py-0.5 font-semibold ${s.badge}`}>
          tier {alert.tier} · {alert.action}
        </span>
        {alert.requires_human_approval && (
          <span className="font-semibold text-secondary">
            ⚠ butuh persetujuan
          </span>
        )}
        <span
          className={`ml-auto rounded px-2 py-0.5 font-mono ${explainTone(alert.explain_method)}`}
        >
          explain: {alert.explain_method}
        </span>
      </div>

      <p className="text-sm leading-6 text-text">{alert.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {alert.reasons.map((r, i) => (
          <span
            key={`${r.feature}-${i}`}
            className="rounded-md border border-border bg-light px-2 py-1 text-[0.68rem] text-text"
          >
            <span className="text-text-light">{r.label}</span>
            <span className="text-text-dark">
              {" · "}
              {typeof r.contribution === "number"
                ? `kontribusi ${r.contribution >= 0 ? "+" : ""}${r.contribution.toFixed(2)}`
                : typeof r.z === "number"
                  ? `${r.z >= 0 ? "+" : ""}${r.z.toFixed(1)} SD`
                  : `nilai ${r.value}`}
            </span>
          </span>
        ))}
      </div>

      {canAct && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3">
          {decision ? (
            <span
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                decision.decision === "approve"
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "bg-secondary/15 text-secondary"
              }`}
            >
              {decision.decision === "approve" ? "✓ Disetujui" : "✕ Ditolak"}
              <span className="font-normal text-text-dark">
                tercatat {decision.ts.slice(0, 16).replace("T", " ")}
              </span>
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onDecide(alert, "approve")}
                className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                Setujui
              </button>
              <button
                type="button"
                onClick={() => onDecide(alert, "reject")}
                className="rounded-lg border border-secondary/40 bg-secondary/10 px-3.5 py-1.5 text-xs font-semibold text-secondary transition hover:bg-secondary/20"
              >
                Tolak
              </button>
              <span className="text-[0.68rem] text-text-dark">
                {source === "live"
                  ? "keputusan disimpan ke outputs/decisions.jsonl"
                  : "mode pratinjau — keputusan tidak tersimpan"}
              </span>
            </>
          )}
        </div>
      )}
    </article>
  );
}
