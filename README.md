# TrailGuard

**Privacy-Preserving, Explainable Insider-Threat Detection on IBM LinuxONE**
IBM Z Datathon 2026 · event code `SSF2026` · tema *AI Secured — Innovation Without Exposure*

Repositori ini dipisah menjadi dua bagian:

| Folder | Isi | Stack |
|---|---|---|
| [`frontend/`](frontend/) | Landing page statis (satu halaman) untuk mempresentasikan proyek | Astro + Tailwind CSS |
| [`backend/`](backend/) | Pipeline deteksi insider-threat: ingest → pseudonimisasi → fitur → model → skor → explain → policy → API + dashboard | Python (pandas, scikit-learn, Flask) |

```
IBM/
├── frontend/   # landing (Astro) — build statis untuk di-serve nginx di LinuxONE
└── backend/    # sistem TrailGuard (Python) — berjalan penuh di LinuxONE (s390x)
```

## Menjalankan

### Frontend (landing)
```bash
cd frontend
npm install
npm run dev       # http://localhost:4321
npm run build     # hasil statis -> frontend/dist
```

### Backend (pipeline)
```bash
cd backend
cat README.md     # prasyarat & perintah lengkap (make toy, make run, make api, ...)
```

## Di mana LinuxONE dipakai
Seluruh pipeline backend **berjalan di LinuxONE (s390x)**. Frontend hanyalah berkas
statis yang disajikan nginx di VM yang sama. Detail deployment ada di
[`backend/docs/`](backend/docs/) dan [`frontend/README.md`](frontend/README.md).

## Status
- **Frontend:** landing selesai; bagian model/metrik sengaja masih placeholder.
- **Backend:** kerangka (skeleton) — bagian `TODO` dikerjakan selama datathon.
