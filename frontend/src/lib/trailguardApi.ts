/**
 * Klien API dashboard TrailGuard.
 * Ambil dari Flask (/api/...) bila tersedia; jika tidak, pakai data contoh (fallback)
 * dan tandai sumbernya 'live' | 'sample' supaya dashboard tetap jujur.
 */

const API_BASE: string =
  (import.meta.env.PUBLIC_API_URL as string | undefined) ?? "";

export interface Reason {
  feature: string;
  label: string;
  value: number;
  contribution?: number;
  z?: number;
}

export interface Alert {
  user: string;
  day: string;
  risk: number;
  label?: number;
  reasons: Reason[];
  explain_method: "shap" | "shapley" | "deviation" | string;
  tier: number;
  action: string;
  requires_human_approval: boolean;
  note?: string;
  summary: string;
}

export interface Metrics {
  alert_budget_per_day?: number;
  n_alerts?: number;
  n_malicious_user_days?: number;
  true_positive_alerts?: number;
  precision_at_budget?: number;
  recall_at_budget?: number;
  insiders_in_test?: number;
  insiders_detected?: number;
  median_days_to_detection?: number | null;
}

export interface Decision {
  ts: string;
  user: string;
  day: string;
  decision: "approve" | "reject";
  note?: string;
  risk?: number;
  tier?: number;
}

export interface ConfigInfo {
  dataset: string;
  explain_method_target?: string;
  policy: { step_up_threshold: number; ticket_threshold: number };
  alert_budget_per_day: number;
  has_alerts: boolean;
  has_metrics: boolean;
}

export interface ReplayEvent {
  ts: string;
  user: string;
  host: string;
  source: string;
  action: string;
  target: string;
  size: string;
}

export type Source = "live" | "sample";

export interface Result<T> {
  data: T;
  source: Source;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

// ─── Data contoh (fallback) ─────────────────────────────────────────────────

const SAMPLE_ALERTS: Alert[] = [
  {
    user: "7f3ce1b2c497fb5c",
    day: "2010-03-03",
    risk: 0.92,
    label: 1,
    explain_method: "shap",
    tier: 3,
    action: "analyst_ticket",
    requires_human_approval: true,
    note: "Buat tiket analis; tindakan lanjutan wajib disetujui manusia.",
    reasons: [
      { feature: "n_new_domain", label: "domain web baru", value: 7, contribution: 0.31 },
      { feature: "n_usb_connect", label: "pemakaian USB", value: 3, contribution: 0.24 },
      { feature: "n_offhours_logon", label: "logon di luar jam kerja", value: 5, contribution: 0.18 },
    ],
    summary:
      "Pengguna 7f3ce1b2… pada 2010-03-03 berisiko 0.92 (tier 3: analyst_ticket). Penyebab utama: domain web baru (nilai 7, menambah risiko +0.31); pemakaian USB (nilai 3, menambah risiko +0.24); logon di luar jam kerja (nilai 5, menambah risiko +0.18). Perlu persetujuan analis.",
  },
  {
    user: "a91b0d7e6c2f4410",
    day: "2010-03-04",
    risk: 0.71,
    label: 0,
    explain_method: "shapley",
    tier: 2,
    action: "step_up_verification",
    requires_human_approval: false,
    note: "Minta verifikasi tambahan saat sesi berikutnya.",
    reasons: [
      { feature: "email_ext_bytes", label: "volume email ke luar", value: 1400000, contribution: 0.33 },
      { feature: "n_new_host", label: "komputer yang belum pernah dipakai", value: 2, contribution: 0.19 },
    ],
    summary:
      "Pengguna a91b0d7e… pada 2010-03-04 berisiko 0.71 (tier 2: step_up_verification). Penyebab utama: volume email ke luar (nilai 1400000, menambah risiko +0.33); komputer yang belum pernah dipakai (nilai 2, menambah risiko +0.19).",
  },
  {
    user: "0c48be1fa7d93e55",
    day: "2010-03-05",
    risk: 0.48,
    label: 0,
    explain_method: "deviation",
    tier: 1,
    action: "log_only",
    requires_human_approval: false,
    note: "Catat saja.",
    reasons: [
      { feature: "n_http", label: "kunjungan web", value: 42, z: 2.1 },
      { feature: "n_file_ops", label: "operasi file", value: 130, z: 1.3 },
    ],
    summary:
      "Pengguna 0c48be1f… pada 2010-03-05 berisiko 0.48 (tier 1: log_only). Penyebab utama: kunjungan web (42, +2.1 SD dari kebiasaan); operasi file (130, +1.3 SD dari kebiasaan).",
  },
];

const SAMPLE_METRICS: Metrics = {
  alert_budget_per_day: 5,
  n_alerts: 45,
  n_malicious_user_days: 18,
  true_positive_alerts: 12,
  precision_at_budget: 0.27,
  recall_at_budget: 0.67,
  insiders_in_test: 4,
  insiders_detected: 3,
  median_days_to_detection: 2,
};

const SAMPLE_CONFIG: ConfigInfo = {
  dataset: "cert",
  explain_method_target: "shap",
  policy: { step_up_threshold: 0.6, ticket_threshold: 0.85 },
  alert_budget_per_day: 5,
  has_alerts: false,
  has_metrics: false,
};

const SAMPLE_EVENTS: ReplayEvent[] = [
  { ts: "2010-03-03 02:14", user: "7f3ce1b2c497fb5c", host: "9c2a1e77", source: "logon", action: "logon", target: "", size: "0" },
  { ts: "2010-03-03 02:19", user: "7f3ce1b2c497fb5c", host: "9c2a1e77", source: "device", action: "connect", target: "usb", size: "0" },
  { ts: "2010-03-03 02:31", user: "7f3ce1b2c497fb5c", host: "9c2a1e77", source: "file", action: "file_op", target: ".zip", size: "0" },
  { ts: "2010-03-03 02:44", user: "7f3ce1b2c497fb5c", host: "9c2a1e77", source: "http", action: "visit", target: "dyn-dns.example", size: "0" },
  { ts: "2010-03-03 03:02", user: "7f3ce1b2c497fb5c", host: "9c2a1e77", source: "email", action: "email_ext", target: "gmail.com", size: "4200000" },
  { ts: "2010-03-04 09:12", user: "a91b0d7e6c2f4410", host: "1f0b77aa", source: "logon", action: "logon", target: "", size: "0" },
  { ts: "2010-03-04 09:40", user: "a91b0d7e6c2f4410", host: "1f0b77aa", source: "email", action: "email_ext", target: "dropbox.com", size: "1400000" },
];

// ─── API publik ─────────────────────────────────────────────────────────────

export async function fetchAlerts(): Promise<Result<Alert[]>> {
  try {
    const data = await getJson<Alert[]>("/api/alerts?limit=100");
    if (Array.isArray(data) && data.length > 0) return { data, source: "live" };
    return { data: SAMPLE_ALERTS, source: "sample" };
  } catch {
    return { data: SAMPLE_ALERTS, source: "sample" };
  }
}

export async function fetchMetrics(): Promise<Result<Metrics>> {
  try {
    const data = await getJson<Metrics>("/api/metrics");
    if (data && Object.keys(data).length > 0) return { data, source: "live" };
    return { data: SAMPLE_METRICS, source: "sample" };
  } catch {
    return { data: SAMPLE_METRICS, source: "sample" };
  }
}

export async function fetchConfig(): Promise<Result<ConfigInfo>> {
  try {
    const data = await getJson<ConfigInfo>("/api/config");
    if (data && data.dataset) return { data, source: "live" };
    return { data: SAMPLE_CONFIG, source: "sample" };
  } catch {
    return { data: SAMPLE_CONFIG, source: "sample" };
  }
}

export async function fetchDecisions(): Promise<Result<Decision[]>> {
  try {
    const data = await getJson<Decision[]>("/api/decisions");
    return { data: Array.isArray(data) ? data : [], source: "live" };
  } catch {
    return { data: [], source: "sample" };
  }
}

export async function fetchReplay(
  limit = 200,
): Promise<Result<{ events: ReplayEvent[]; available: boolean }>> {
  try {
    const data = await getJson<{ events: ReplayEvent[]; available: boolean }>(
      `/api/replay?limit=${limit}`,
    );
    if (data.available && data.events.length > 0) return { data, source: "live" };
    return { data: { events: SAMPLE_EVENTS, available: false }, source: "sample" };
  } catch {
    return { data: { events: SAMPLE_EVENTS, available: false }, source: "sample" };
  }
}

export async function postDecision(
  body: Pick<Decision, "user" | "day" | "decision"> &
    Partial<Pick<Decision, "note" | "risk" | "tier">>,
): Promise<{ ok: boolean; offline?: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok?: boolean };
    return { ok: Boolean(data.ok) };
  } catch {
    return { ok: false, offline: true };
  }
}
