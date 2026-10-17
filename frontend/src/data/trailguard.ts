/**
 * Sumber tunggal konten landing TrailGuard.
 * Disusun dari repo nyata `trailguard/` + Rencana Proyek v3.1.
 * Model & angka hasil sengaja ditandai "diisi tim" — belum ada hasil nyata.
 */

export interface Meta {
  name: string;
  subtitle: string;
  event: string;
  eventCode: string;
  theme: string;
  tagline: string;
  goal: string;
  flow: string[];
}

export const meta: Meta = {
  name: "TrailGuard",
  subtitle: "Privacy-Preserving, Explainable Insider-Threat Detection on IBM LinuxONE",
  event: "IBM Z Datathon 2026",
  eventCode: "SSF2026",
  theme: "AI Secured — Innovation Without Exposure",
  tagline:
    "Deteksi insider-threat yang menjaga privasi & bisa dijelaskan — berjalan penuh di IBM LinuxONE.",
  goal:
    "Bangun pipeline deteksi insider-threat yang berjalan penuh di LinuxONE, dengan skor risiko yang bisa dijelaskan, ID pengguna ter-pseudonim, dan keputusan akhir di tangan manusia.",
  flow: [
    "logs",
    "pseudonymize",
    "features",
    "hybrid models",
    "risk + reasons",
    "policy tier",
    "analyst",
  ],
};

export interface PipelineStep {
  id: string;
  cmd: string;
  title: string;
  desc: string;
  output: string;
  icon: string;
}

export const pipelineSteps: PipelineStep[] = [
  {
    id: "ingest",
    cmd: "ingest",
    title: "Ingest & pseudonymize",
    desc: "Loader CERT/LANL memuat log multi-sumber; identitas langsung di-hash (HMAC-SHA256) saat masuk.",
    output: "data/interim/events.csv.gz · Kontrak #1",
    icon: "lock",
  },
  {
    id: "features",
    cmd: "features",
    title: "Fitur perilaku harian",
    desc: "Agregasi per user × hari + deviasi (z-score) terhadap baseline pribadi 14 hari — bebas leakage.",
    output: "data/processed/features.csv.gz · Kontrak #2",
    icon: "chart",
  },
  {
    id: "train",
    cmd: "train",
    title: "Latih model hibrida",
    desc: "Split TEMPORAL: supervised (HistGradientBoosting) + Isolation Forest untuk perilaku baru.",
    output: "models/bundle.joblib · Kontrak #4",
    icon: "brain",
  },
  {
    id: "evaluate",
    cmd: "evaluate",
    title: "Evaluasi alert-budget",
    desc: "Metrik realistis untuk data langka: precision/recall @ budget + time-to-detection.",
    output: "outputs/metrics.json · Kontrak #5",
    icon: "gauge",
  },
  {
    id: "score",
    cmd: "score",
    title: "Skor, jelaskan, putuskan",
    desc: "Skor risiko 0–1, penjelasan tiap alert (SHAP/Shapley/deviation), lalu dipetakan ke policy 3 tier.",
    output: "outputs/alerts.jsonl · Kontrak #3",
    icon: "alert",
  },
];

export interface ModuleItem {
  title: string;
  path: string;
  desc: string;
  icon: string;
}

export const modules: ModuleItem[] = [
  {
    title: "Pseudonimisasi",
    path: "ingest/pseudonymize.py",
    desc: "Keyed hash HMAC-SHA256 (16 hex). Kunci di `.env`, tidak pernah keluar instance.",
    icon: "lock",
  },
  {
    title: "Replay stream",
    path: "ingest/replay.py",
    desc: "Memutar ulang log sebagai aliran event — dinyatakan jujur sebagai replay, bukan real-time.",
    icon: "play",
  },
  {
    title: "Penjelasan",
    path: "models/explain.py",
    desc: "shap → shapley (sampling sendiri, efficiency eksak) → deviation. Metode dicatat apa adanya.",
    icon: "explain",
  },
  {
    title: "Policy",
    path: "policy/policy.py",
    desc: "Skor → 3 tier respons. Sistem TIDAK pernah memblokir akun otomatis.",
    icon: "shield",
  },
  {
    title: "Ringkasan kasus",
    path: "llm/summarizer.py",
    desc: "Template bahasa manusia (default). Hanya menerima field ter-pseudonim.",
    icon: "doc",
  },
  {
    title: "API + dashboard",
    path: "api/app.py",
    desc: "Flask :8000 — /health, /api/alerts, /api/metrics, POST /api/score, halaman alert.",
    icon: "server",
  },
  {
    title: "Container",
    path: "deploy/Dockerfile",
    desc: "python:3.11-slim (fallback ubi9/python-311). Data & kunci di-mount, tidak ikut ke image.",
    icon: "box",
  },
  {
    title: "Pipeline CLI",
    path: "src/trailguard/pipeline.py",
    desc: "`python -m trailguard.pipeline all` — ingest → features → train → evaluate → score.",
    icon: "code",
  },
];

export interface DataContract {
  id: string;
  file: string;
  maker: string;
  consumer: string;
  note: string;
}

export const contracts: DataContract[] = [
  {
    id: "#1",
    file: "data/interim/events.csv.gz",
    maker: "ingest (loader + pseudonymize)",
    consumer: "features",
    note: "Tidak ada ID asli. user & host = keyed-hash, 16 hex.",
  },
  {
    id: "#2",
    file: "data/processed/features.csv.gz",
    maker: "Grup B",
    consumer: "model · API · benchmark",
    note: "1 baris = 1 user × 1 hari; fitur dasar + deviasi, label 0/1.",
  },
  {
    id: "#3",
    file: "outputs/alerts.jsonl",
    maker: "pipeline (score)",
    consumer: "dashboard",
    note: "risk, reasons, explain_method, tier, requires_human_approval, summary.",
  },
  {
    id: "#4",
    file: "models/bundle.joblib",
    maker: "Grup B",
    consumer: "score · explain · API",
    note: "Dilatih & dimuat di mesin yang sama (pickle s390x).",
  },
  {
    id: "#5",
    file: "outputs/metrics.json · benchmark.json",
    maker: "Grup B · Grup A",
    consumer: "README · video",
    note: "Semua angka yang dipublikasikan harus bisa ditelusuri ke sini.",
  },
];

export interface Principle {
  title: string;
  desc: string;
  icon: string;
}

export const principles: Principle[] = [
  {
    title: "Selalu ada versi yang jalan",
    desc: "`main` harus lolos `make toy` kapan pun. Data tiruan (toy) membuat semua grup bisa bekerja paralel.",
    icon: "check",
  },
  {
    title: "Kontrak data dulu, kode kemudian",
    desc: "Antar-grup hanya berkomunikasi lewat file yang disepakati di Kontrak Data (#1–#5).",
    icon: "layers",
  },
  {
    title: "Klaim hanya yang terbukti jalan",
    desc: "Istilah seperti “SHAP” atau “Parquet” tidak ditulis bila belum terbukti berjalan di LinuxONE.",
    icon: "shield",
  },
  {
    title: "Potong scope lebih awal",
    desc: "Keputusan potong dibuat di Gate, bukan di akhir. MoSCoW memandu prioritas.",
    icon: "scissors",
  },
  {
    title: "Semua orang lulus Linux survival",
    desc: "Setiap anggota (bukan hanya Grup A) melewati checklist dasar Linux & LinuxONE lebih dulu.",
    icon: "terminal",
  },
];

export interface ScopeLevel {
  level: string;
  tone: "must" | "target" | "should" | "could" | "wont" | "deferred";
  items: string[];
  limit: string;
}

export const scope: ScopeLevel[] = [
  {
    level: "MUST",
    tone: "must",
    items: [
      "Jalan di LinuxONE",
      "Pseudonimisasi",
      "Fitur harian",
      "Isolation Forest + supervised",
      "Skor risiko",
      "Policy 3 tier (human approval)",
      "Dashboard sederhana",
      "Evaluasi alert-budget + time-to-detection",
      "Dua dataset: CERT + LANL (subset)",
      "Penjelasan berbasis nilai Shapley (implementasi sendiri)",
    ],
    limit: "Wajib selesai",
  },
  {
    level: 'TARGET — klaim "SHAP"',
    tone: "target",
    items: ["Library `shap` jalan di s390x", "pyarrow / Parquet"],
    limit: "Go/no-go di Gate 1",
  },
  {
    level: "SHOULD",
    tone: "should",
    items: [
      "Container jalan",
      "Benchmark latensi/throughput",
      "Pembanding baseline di evaluasi",
      "LANL: evaluasi lengkap dengan pembanding",
    ],
    limit: "Gate 2 / Gate 3",
  },
  {
    level: "COULD",
    tone: "could",
    items: [
      "LLM kecil untuk ringkasan",
      "Replay live dengan kecepatan",
      "Tombol approve/reject di dashboard",
    ],
    limit: "Gate 3",
  },
  {
    level: "WON'T",
    tone: "wont",
    items: [
      "LANL penuh (1 miliar baris, ±7 GB gz) di VM",
      "Deep learning",
      "Otentikasi multi-user",
    ],
    limit: "Di luar scope",
  },
  {
    level: "DITUNDA",
    tone: "deferred",
    items: [
      "Screenshot bukti",
      "README final",
      "Bagian Limitations",
      "Video demo",
      "Submission",
    ],
    limit: "Dibagi setelah Gate 3",
  },
];

export interface Decision {
  id: string;
  decision: string;
  reason: string;
}

export const decisions: Decision[] = [
  {
    id: "D1",
    decision: "Flask (bukan FastAPI/Streamlit)",
    reason: "Pure-Python; menghindari pydantic-core/pyarrow yang berisiko di s390x.",
  },
  {
    id: "D2",
    decision: "Data antar-langkah CSV.gz default; Parquet opsional",
    reason: "pyarrow berisiko di s390x; pipeline fallback otomatis dengan peringatan.",
  },
  {
    id: "D3",
    decision: "Supervised = HistGradientBoostingClassifier (sklearn)",
    reason: "Tanpa dependensi tambahan; ringan untuk LinuxONE.",
  },
  {
    id: "D4",
    decision: "Target klaim SHAP. Urutan: shap → shapley → deviation",
    reason: "Klaim wajib sesuai metode yang benar-benar jalan (kolom explain_method).",
  },
  {
    id: "D5",
    decision: "LANL tetap di scope sebagai subset (prefilter streaming)",
    reason: "Data penuh tak layak di VM; pipeline terpisah config_lanl.yaml.",
  },
  {
    id: "D6",
    decision: "Split TEMPORAL + metrik alert-budget & time-to-detection",
    reason: "Data sangat langka; menghindari leakage masa depan.",
  },
  {
    id: "D7",
    decision: "Replay = simulasi stream, dinyatakan jujur",
    reason: "Klaim “real-time” harus bisa dibuktikan dengan angka.",
  },
];

export interface FeatureSet {
  dataset: string;
  file: string;
  base: string[];
  zCount: number;
  note: string;
}

export const featureSets: FeatureSet[] = [
  {
    dataset: "CERT (insider misuse)",
    file: "features/builder.py",
    base: [
      "n_logon",
      "n_offhours_logon",
      "n_weekend_logon",
      "n_distinct_host",
      "n_new_host",
      "n_usb_connect",
      "n_file_ops",
      "n_http",
      "n_new_domain",
      "n_email",
      "n_email_ext",
      "email_ext_bytes",
    ],
    zCount: 12,
    note: "12 fitur dasar + 12 deviasi (z-score baseline 14 hari per user).",
  },
  {
    dataset: "LANL (kredensial curian)",
    file: "features/builder_lanl.py",
    base: [
      "n_auth",
      "n_fail",
      "n_logon",
      "n_network_logon",
      "n_remote",
      "n_distinct_dst",
      "n_new_dst",
      "n_distinct_src",
      "n_new_src",
      "n_night",
    ],
    zCount: 10,
    note: "10 fitur dasar + 10 deviasi. `n_night` hanyalah proxy (waktu LANL anonim).",
  },
];

export interface ModelFact {
  label: string;
  value: string;
  icon: string;
}

export const modelFacts: ModelFact[] = [
  { label: "Split", value: "Temporal (bukan acak) — 65% train / 35% test", icon: "clock" },
  { label: "Supervised", value: "HistGradientBoostingClassifier + bobot kelas", icon: "brain" },
  { label: "Anomali", value: "IsolationForest, dilatih pada perilaku normal", icon: "radar" },
  { label: "Gabungan skor", value: "risk = 0.6 · p_supervised + 0.4 · p_anomali", icon: "merge" },
  { label: "Evaluasi", value: "Alert-budget 5/hari · precision/recall · median days-to-detection", icon: "gauge" },
];

export interface ExplainMethod {
  name: string;
  method: string;
  desc: string;
  tone: "ok" | "warn" | "neutral";
}

export const explainMethods: ExplainMethod[] = [
  {
    name: "SHAP library",
    method: "shap",
    desc: "shap.Explainer + model-agnostik. Butuh paket shap (numba/llvmlite) — diuji di s390x dulu.",
    tone: "ok",
  },
  {
    name: "Shapley (implementasi sendiri)",
    method: "shapley",
    desc: "Sampling permutasi, pure NumPy. Efficiency berlaku eksak: Σ kontribusi + base = f(x).",
    tone: "neutral",
  },
  {
    name: "Deviasi",
    method: "deviation",
    desc: "Fallback terakhir: seberapa jauh fitur menyimpang dari kebiasaan user (z-score).",
    tone: "warn",
  },
];

export interface ClaimRule {
  claim: string;
  allowed: string;
  forbidden: string;
}

export const claimRules: ClaimRule[] = [
  {
    claim: "Berjalan di LinuxONE",
    allowed: "Ada screenshot uname/lscpu menunjukkan Architecture: s390x",
    forbidden: "Hanya jalan di laptop",
  },
  {
    claim: '"SHAP"',
    allowed: "explain_method == \"shap\" di alerts + [OK] shap di shap_pyarrow_check.txt",
    forbidden: "explain_method == \"shapley\" → tulis “Shapley-value explanations (implementasi sendiri)”",
  },
  {
    claim: '"Parquet / pyarrow"',
    allowed: "[OK] pyarrow + io.format: parquet benar-benar dipakai",
    forbidden: "pyarrow gagal / fallback ke CSV.gz",
  },
  {
    claim: '"Dua dataset"',
    allowed: "Hasil CERT dan LANL dari metrics.json / lanl_metrics.json",
    forbidden: "Mengklaim LANL penuh (1 miliar baris) diproses",
  },
  {
    claim: "Privacy-preserving",
    allowed: "“Mengurangi eksposur lewat pseudonimisasi”",
    forbidden: "Mengklaim jaminan privasi formal / differential privacy",
  },
  {
    claim: '"Near real-time"',
    allowed: "Ada angka latensi per event + dijelaskan sebagai replay",
    forbidden: "Menulis “real-time” tanpa pengukuran",
  },
];

export interface PolicyTier {
  tier: number;
  action: string;
  range: string;
  desc: string;
  human: boolean;
  tone: "t1" | "t2" | "t3";
}

export const policyTiers: PolicyTier[] = [
  {
    tier: 1,
    action: "log_only",
    range: "risk < 0.60",
    desc: "Catat saja. Tidak ada tindakan otomatis.",
    human: false,
    tone: "t1",
  },
  {
    tier: 2,
    action: "step_up_verification",
    range: "0.60 ≤ risk < 0.85",
    desc: "Minta verifikasi tambahan saat sesi berikutnya.",
    human: false,
    tone: "t2",
  },
  {
    tier: 3,
    action: "analyst_ticket",
    range: "risk ≥ 0.85",
    desc: "Buat tiket analis; tindakan lanjutan WAJIB disetujui manusia.",
    human: true,
    tone: "t3",
  },
];

export interface SampleAlert {
  user: string;
  day: string;
  risk: number;
  tier: number;
  action: string;
  human: boolean;
  explainMethod: string;
  summary: string;
  reasons: { label: string; detail: string }[];
}

/** Contoh alert (bentuk Kontrak #3) untuk pratinjau dashboard — bukan hasil nyata. */
export const sampleAlerts: SampleAlert[] = [
  {
    user: "7f3ce1b2c497fb5c",
    day: "2010-03-03",
    risk: 0.92,
    tier: 3,
    action: "analyst_ticket",
    human: true,
    explainMethod: "shap",
    summary:
      "Risiko 0.92 (tier 3: analyst_ticket). Perlu persetujuan analis. Pemicu utama: domain web baru, pemakaian USB, logon di luar jam kerja.",
    reasons: [
      { label: "domain web baru", detail: "nilai 7 · +0.31" },
      { label: "pemakaian USB", detail: "nilai 3 · +0.24" },
      { label: "logon di luar jam kerja", detail: "nilai 5 · +0.18" },
    ],
  },
  {
    user: "a91b0d7e6c2f4410",
    day: "2010-03-04",
    risk: 0.71,
    tier: 2,
    action: "step_up_verification",
    human: false,
    explainMethod: "shapley",
    summary:
      "Risiko 0.71 (tier 2: step_up_verification). Pemicu utama: email ke luar organisasi (volume besar), komputer baru.",
    reasons: [
      { label: "volume email ke luar", detail: "nilai 1.4e6 · +0.33" },
      { label: "komputer yang belum pernah dipakai", detail: "nilai 2 · +0.19" },
    ],
  },
  {
    user: "0c48be1fa7d93e55",
    day: "2010-03-05",
    risk: 0.48,
    tier: 1,
    action: "log_only",
    human: false,
    explainMethod: "deviation",
    summary:
      "Risiko 0.48 (tier 1: log_only). Menyimpang dari kebiasaan: kunjungan web (+2.1 SD), operasi file (+1.3 SD).",
    reasons: [
      { label: "kunjungan web", detail: "2.1 SD" },
      { label: "operasi file", detail: "1.3 SD" },
    ],
  },
];

export interface Dataset {
  name: string;
  kind: string;
  detail: string;
  points: string[];
  icon: string;
}

export const datasets: Dataset[] = [
  {
    name: "CMU CERT Insider Threat",
    kind: "Utama · sintetis",
    detail: "Multi-sumber: logon, device, file, http, email (+ LDAP & psychometric).",
    points: [
      "Versi r4.2; folder answers/ menandai insider",
      "Besar (terutama http.csv) — batasi dengan max_rows_per_file",
      "Sintetis → tidak mewakili jaringan produksi (sebut di Limitations)",
    ],
    icon: "database",
  },
  {
    name: "LANL Cyber-Security Events",
    kind: "Kedua · subset",
    detail: "Log autentikasi de-identifikasi (±58 hari) + label red-team.",
    points: [
      "auth.txt.gz ±1 miliar baris / ±7 GB gz — JANGAN dimuat penuh",
      "Prefilter streaming: semua user korban red-team + sampel 2% user lain",
      "Waktu anonim (hanya relatif); label sangat sedikit — laporkan apa adanya",
    ],
    icon: "network",
  },
];

export interface DeployItem {
  title: string;
  desc: string;
  icon: string;
}

export const deploy: DeployItem[] = [
  {
    title: "Platform s390x",
    desc: "LinuxONE Community Cloud. Verifikasi dengan uname/lscpu: Architecture: s390x.",
    icon: "server",
  },
  {
    title: "Container",
    desc: "python:3.11-slim (fallback ubi9/python-311). Data & model di-mount; log mentah & kunci tidak ikut ke image.",
    icon: "box",
  },
  {
    title: "Nginx statis",
    desc: "Landing ini dibangun jadi berkas statis (dist/) dan disajikan nginx — cocok untuk VM LinuxONE.",
    icon: "globe",
  },
  {
    title: "R17 — tooling Node",
    desc: "Bila npm/build bermasalah di s390x: bangun di laptop lalu salin dist/ ke VM, atau sajikan via Flask.",
    icon: "alert",
  },
];

export interface EvidenceItem {
  id: string;
  title: string;
}

export const evidenceItems: EvidenceItem[] = [
  { id: "01", title: "uname -a + lscpu (Architecture: s390x)" },
  { id: "02", title: "free -h, df -h, nproc (sumber daya VM)" },
  { id: "03", title: "make run selesai di VM (log & waktu)" },
  { id: "04", title: "podman/docker ps + curl /health" },
  { id: "05", title: "Dashboard (via tunnel) dengan alert & tier" },
  { id: "06", title: "metrics.json & benchmark.json" },
  { id: "07", title: "top/htop saat benchmark (CPU/memori)" },
  { id: "08", title: "Bukti pseudonimisasi + .env tidak di repo" },
  { id: "09", title: "shap_pyarrow_check.txt (bukti klaim / fallback)" },
  { id: "10", title: "Ukuran subset LANL & log prefilter" },
];

export interface RoleGroup {
  group: string;
  icon: string;
  roles: { name: string; focus: string }[];
}

export const teamRoles: RoleGroup[] = [
  {
    group: "A — Platform & Deploy",
    icon: "server",
    roles: [
      { name: "A-Platform", focus: "Lingkungan LinuxONE: SSH, Python, paket, data di VM, bukti sistem" },
      { name: "A-Deploy", focus: "Container, benchmark performa, Makefile, bukti keamanan" },
    ],
  },
  {
    group: "B — Data & Model",
    icon: "brain",
    roles: [
      { name: "B-Data", focus: "Loader CERT/LANL, pembentukan fitur, kualitas data" },
      { name: "B-Model", focus: "Model hibrida, tuning, evaluasi jujur, penjelasan alert" },
    ],
  },
  {
    group: "C — Integrasi & Produk",
    icon: "layers",
    roles: [
      { name: "C-Lead (PM)", focus: "Pipeline, pseudonimisasi, policy, API; menjaga Gate & Decision Log" },
      { name: "C-Demo", focus: "Dashboard, replay, ringkasan kasus, README, video & submission" },
    ],
  },
];

export interface Stage {
  tag: string;
  title: string;
  kind: "stage" | "gate" | "checkpoint";
  points: string[];
}

export const stages: Stage[] = [
  {
    tag: "Tahap 0",
    title: "Siaga",
    kind: "stage",
    points: [
      "A1 SSH + make check (catat OS/Python/RAM/disk)",
      "B1 unduh & pahami CERT",
      "C1 repo, .env, kunci HMAC",
    ],
  },
  {
    tag: "Tahap 1",
    title: "Fondasi",
    kind: "stage",
    points: [
      "A2 make setup / make toy / make lanl-toy",
      "A3 go/no-go SHAP & pyarrow",
      "C8 mulai review; baca kontrak data",
    ],
  },
  {
    tag: "Gate 1",
    title: "Fondasi terbukti",
    kind: "gate",
    points: [
      "make toy & make lanl-toy sukses di LinuxONE",
      "Keputusan SHAP & pyarrow dicatat",
      "Tes Node/npm (React) di VM dicatat",
    ],
  },
  {
    tag: "Tahap 2",
    title: "Data nyata + baseline",
    kind: "stage",
    points: [
      "A5 data CERT ke VM · A11 unduh+prefilter LANL",
      "B2/B3 loader & fitur CERT asli",
      "C3a halaman utama (data toy)",
    ],
  },
  {
    tag: "Checkpoint LANL",
    title: "Subset LANL terbentuk",
    kind: "checkpoint",
    points: ["data/raw/lanl_sub/ ada & ukurannya dicatat", "B-Data bisa memakainya"],
  },
  {
    tag: "Gate 2",
    title: "End-to-end",
    kind: "gate",
    points: [
      "CERT (sampel) end-to-end → alert tampil di dashboard",
      "Pipeline LANL end-to-end pada subset",
    ],
  },
  {
    tag: "Tahap 3",
    title: "Perbaiki & hubungkan",
    kind: "stage",
    points: [
      "Container, benchmark, evaluasi + pembanding",
      "Policy final, ringkasan kasus, approve/reject",
    ],
  },
  {
    tag: "Gate 3",
    title: "FEATURE FREEZE",
    kind: "gate",
    points: [
      "Setelah ini hanya bug fix + pekerjaan yang ditunda",
      "Bukti, dokumentasi, video dibagi (§8)",
    ],
  },
];

export interface Risk {
  id: string;
  risk: string;
  impact: string;
  mitigation: string;
  owner: string;
}

export const risks: Risk[] = [
  { id: "R1", risk: "Paket ML gagal terpasang di s390x (big-endian, tak ada wheel)", impact: "Tinggi", mitigation: "Inti pakai paket ringan (sklearn/pandas/flask). Fallback: HistGradientBoosting, Shapley sendiri / deviasi", owner: "A" },
  { id: "R2", risk: "Scope terlalu besar", impact: "Tinggi", mitigation: "MoSCoW; Gate memutuskan potong", owner: "PM" },
  { id: "R3", risk: "VM terbatas (RAM/CPU/disk) vs data besar", impact: "Sedang", mitigation: "Sampel CERT; max_rows_per_file; cek free -h", owner: "A+B" },
  { id: "R4", risk: "Koneksi SSH putus, proses mati", impact: "Sedang", mitigation: "Selalu jalankan di tmux", owner: "A" },
  { id: "R5", risk: "Format label/file CERT asli beda dari toy", impact: "Sedang", mitigation: "B menyesuaikan loader.py di tahap 2", owner: "B" },
  { id: "R6", risk: "Bukti LinuxONE tidak cukup nanti", impact: "Sedang", mitigation: "make evidence berkala sebagai arsip; pembagian screenshot menunggu §8", owner: "A-Deploy" },
  { id: "R7", risk: "Klaim berlebihan (real-time, SHAP, privasi formal)", impact: "Sedang", mitigation: "Aturan klaim §3b; dashboard menampilkan explain_method apa adanya", owner: "C" },
  { id: "R8", risk: "Bug integrasi menit terakhir", impact: "Tinggi", mitigation: "Feature freeze di Gate 3; main selalu hijau", owner: "PM" },
  { id: "R9", risk: "Kunci/token bocor ke GitHub", impact: "Tinggi", mitigation: ".gitignore, .env tak di-commit, cek sebelum push", owner: "C-Lead" },
  { id: "R10", risk: "Pelanggaran aturan orisinalitas", impact: "Fatal", mitigation: "Lihat bagian Integritas di 04_SUBMISSION_CHECKLIST.md", owner: "Semua" },
  { id: "R11", risk: "LANL ±7 GB / 1 miliar baris: disk/RAM/waktu tak cukup", impact: "Tinggi", mitigation: "Prefilter streaming; ukur --max-lines; cek df -h; Checkpoint LANL", owner: "A-Deploy + B-Data" },
  { id: "R12", risk: "shap/numba/llvmlite tak bisa dipasang → klaim SHAP gagal", impact: "Sedang", mitigation: "Go/no-go Gate 1; fallback Shapley sendiri; klaim ikut explain_method", owner: "A-Platform + B-Model" },
  { id: "R13", risk: "LANL: label red-team sedikit & waktu anonim → metrik tidak stabil", impact: "Sedang", mitigation: "Laporkan jumlah positif apa adanya + interval; jangan dibulatkan", owner: "B-Model" },
  { id: "R14", risk: "Bentrok api/templates/", impact: "—", mitigation: "Tidak berlaku lagi — seluruh dashboard dipegang C-Demo", owner: "—" },
  { id: "R17", risk: "Node/npm atau esbuild/rollup bermasalah di s390x, atau registry tak terjangkau", impact: "Sedang", mitigation: "Tes npm install && npm run build di A3b; cadangan: build di laptop, salin dist ke VM", owner: "A-Platform + C-Demo" },
  { id: "R15", risk: "PM adalah AI: tidak memantau Discord/Git/VM sendiri", impact: "Sedang", mitigation: "Relay stand-up tiap Gate (format §8); Decision Log jadi memori", owner: "C-Lead" },
  { id: "R16", risk: "Beban tidak seimbang / salah perkiraan", impact: "Sedang", mitigation: "Periksa ulang di Gate 1; geser tugas lewat PM & catat di Decision Log", owner: "PM" },
];

export const dod: string[] = [
  "make toy dan make lanl-toy berjalan di LinuxONE",
  "Pipeline data CERT (sampel) & subset LANL berjalan end-to-end di LinuxONE",
  "make ui membangun dashboard React di VM",
  "Dashboard menampilkan alert + alasan + tier + status persetujuan; halaman demo menampilkan replay",
  "outputs/metrics.json, lanl_metrics.json & benchmark.json berisi angka nyata dari LinuxONE",
  "docs/06_ARSITEKTUR_KEAMANAN.md selesai",
  "main hijau (make toy + make lanl-toy lulus)",
];

export const deferred: string[] = [
  "Screenshot bukti LinuxONE dan arsip make evidence",
  "Bagian “Limitations” (data sintetis, subset & anonimisasi LANL, kelangkaan label, risiko leakage)",
  "Review klaim akhir (cocokkan dengan explain_method & shap_pyarrow_check.txt)",
  "README final",
  "Video demo",
  "Submission dan dry-run (04_SUBMISSION_CHECKLIST.md)",
];

export const stack: string[] = [
  "pandas",
  "NumPy",
  "scikit-learn",
  "joblib",
  "PyYAML",
  "Flask",
  "pytest",
];
