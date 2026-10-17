"""API + dashboard (Flask, pure-Python agar aman di s390x).
Jalankan:  python -m trailguard.api.app   -> http://localhost:8000

Endpoint:
  GET  /health            cek sehat
  GET  /api/config        info dataset & policy (untuk label jujur di dashboard)
  GET  /api/alerts        alert teratas (Kontrak #3)          ?limit=N
  GET  /api/metrics       isi metrics.json (Kontrak #5)
  GET  /api/decisions     keputusan manusia yang sudah tercatat
  POST /api/decision      catat keputusan manusia (approve/reject) -> outputs/decisions.jsonl
  POST /api/score         body {"features": {...}} -> {risk, tier, ...}
  GET  /api/replay        aliran event (Kontrak #1) untuk halaman replay  ?limit=N
"""
import csv
import gzip
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, render_template, request

from ..config import load_config, path_of
from ..models.score import score_frame
from ..models.train import load_bundle
from ..policy.policy import decide

app = Flask(__name__)
CFG = load_config(os.environ.get("TRAILGUARD_CONFIG"))   # mis. TRAILGUARD_CONFIG=configs/config_lanl.yaml


@app.after_request
def _cors(resp):
    """CORS minimal tanpa dependensi tambahan (dashboard statis beda origin)."""
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp


def _read_alerts(limit=None):
    f = path_of(CFG, "alerts")
    if not f.exists():
        return []
    rows = [json.loads(line) for line in f.read_text().splitlines() if line.strip()]
    rows.sort(key=lambda a: a.get("risk", 0), reverse=True)
    return rows if limit is None else rows[:limit]


def _decisions_path() -> Path:
    return path_of(CFG, "alerts").parent / "decisions.jsonl"


def _read_decisions():
    f = _decisions_path()
    if not f.exists():
        return []
    return [json.loads(line) for line in f.read_text().splitlines() if line.strip()]


def _read_metrics():
    f = Path(path_of(CFG, "metrics"))
    return json.loads(f.read_text()) if f.exists() else {}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/config")
def config_info():
    pol = CFG.get("policy", {})
    ev = CFG.get("evaluation", {})
    ex = CFG.get("explain", {})
    return jsonify({
        "dataset": CFG.get("dataset", "cert"),
        "explain_method_target": ex.get("method"),
        "policy": {
            "step_up_threshold": pol.get("step_up_threshold"),
            "ticket_threshold": pol.get("ticket_threshold"),
        },
        "alert_budget_per_day": ev.get("alert_budget_per_day"),
        "has_alerts": path_of(CFG, "alerts").exists(),
        "has_metrics": Path(path_of(CFG, "metrics")).exists(),
    })


@app.get("/api/alerts")
def alerts():
    limit = int(request.args.get("limit", 50))
    return jsonify(_read_alerts(limit))


@app.get("/api/metrics")
def metrics():
    return jsonify(_read_metrics())


@app.get("/api/decisions")
def decisions():
    return jsonify(_read_decisions())


@app.post("/api/decision")
def record_decision():
    """Catat keputusan manusia atas satu alert. Append ke outputs/decisions.jsonl."""
    body = request.get_json(silent=True) or {}
    user, day = body.get("user"), body.get("day")
    decision = body.get("decision")
    if not user or not day or decision not in ("approve", "reject"):
        return jsonify({"ok": False, "error": "butuh user, day, dan decision=approve|reject"}), 400
    row = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "user": user,
        "day": day,
        "decision": decision,
        "note": body.get("note", ""),
        "risk": body.get("risk"),
        "tier": body.get("tier"),
    }
    f = _decisions_path()
    f.parent.mkdir(parents=True, exist_ok=True)
    with open(f, "a") as fh:
        fh.write(json.dumps(row) + "\n")
    return jsonify({"ok": True, "decision": row})


@app.post("/api/score")
def score():
    """Body: {"features": {<semua kolom FEATURE_COLS>}}  -> skor + tier. (Dipakai Grup C/benchmark)"""
    import pandas as pd
    bundle = load_bundle(path_of(CFG, "model"))
    df = pd.DataFrame([request.get_json()["features"]])
    out = score_frame(bundle, df, CFG["model"]["ensemble_weight_supervised"]).iloc[0]
    return jsonify({"risk": float(out.risk), **decide(float(out.risk), CFG)})


@app.get("/api/replay")
def replay_events():
    """Aliran event ter-pseudonim (Kontrak #1) untuk demo replay. Jujur: ini replay, bukan real-time."""
    limit = int(request.args.get("limit", 200))
    f = path_of(CFG, "events")
    if not f.exists():
        return jsonify({"events": [], "available": False})
    opener = gzip.open if f.suffix == ".gz" else open
    events = []
    with opener(f, "rt", newline="") as fh:
        reader = csv.DictReader(fh)
        for i, row in enumerate(reader):
            if i >= limit:
                break
            events.append(row)
    events.sort(key=lambda r: r.get("ts", ""))
    return jsonify({"events": events, "available": True})


@app.get("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
