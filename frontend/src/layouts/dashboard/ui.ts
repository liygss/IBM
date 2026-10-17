export interface TierStyle {
  bar: string;
  badge: string;
  text: string;
}

export const TIER_STYLE: Record<number, TierStyle> = {
  1: {
    bar: "border-l-zinc-500",
    badge: "bg-zinc-500/15 text-zinc-300",
    text: "text-zinc-300",
  },
  2: {
    bar: "border-l-amber-400",
    badge: "bg-amber-400/15 text-amber-300",
    text: "text-amber-300",
  },
  3: {
    bar: "border-l-secondary",
    badge: "bg-secondary/15 text-secondary",
    text: "text-secondary",
  },
};

export function tierStyle(tier: number): TierStyle {
  return TIER_STYLE[tier] ?? TIER_STYLE[1];
}

export const EXPLAIN_TONE: Record<string, string> = {
  shap: "bg-emerald-400/15 text-emerald-300",
  shapley: "bg-primary/15 text-primary",
  deviation: "bg-amber-400/15 text-amber-300",
};

export function explainTone(method: string): string {
  return EXPLAIN_TONE[method] ?? "bg-white/5 text-text";
}

export function shortUser(user: string): string {
  return user.slice(0, 8);
}

export function fmtPct(v: number | undefined | null): string {
  return typeof v === "number" ? `${Math.round(v * 100)}%` : "—";
}

export function fmtNum(v: number | undefined | null): string {
  return typeof v === "number" ? v.toLocaleString("id-ID") : "—";
}
