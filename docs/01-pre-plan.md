# 01 — Pre-Plan: Fase Kerja dan Gate

## Fase

| Fase | Isi | Output | Gate |
|---|---|---|---|
| P0 | Rapid review + peta gap | `docs/research/*` | 20+ sumber ber-ID, 5+ gap |
| P1 | Kandidat outline | `docs/outline/K1–K4` | disetujui pembimbing |
| P2 | Proposal (UP) | Bab I–III | ACC pembimbing |
| P3 | Dataset + baseline | 200 citra uji, angka L0 | test set terkunci |
| P4 | Model + verifikasi | L1, lapis 1–4 | silent error turun terbukti |
| P5 | Sistem + eksperimen | sistem jalan, E1–E6 | semua metrik terukur |
| P6 | Naskah | Bab IV–V | siap sidang |

## Timeline 16 minggu

| Minggu | Kerja | Luaran |
|---|---|---|
| 1–2 | Finalisasi proposal, kunci rumusan masalah | Bab I–III draf |
| 3 | Kumpulkan 200–300 citra nyata (5 merek) | dataset uji |
| 4 | L0 zero-shot + L1 ganti kepala | tabel akurasi awal |
| 5–6 | Verifikasi struktural + fisik | `verify.py` + kurva |
| 7–8 | Sistem: endpoint + UI + DB | alur 1 transaksi jalan |
| 9–10 | E1–E3 (zero-shot, head, struktural) | tabel eksperimen |
| 11–12 | E4–E6 (fisik, temporal, kalibrasi) + black-box | tabel + grafik |
| 13–14 | Analisis error, Bab IV | draf Bab IV |
| 15–16 | Bab V, revisi, latihan sidang | naskah utuh |

## Aturan anti-overclaim
- Tidak ada angka akurasi tanpa ground truth dan jumlah sampel.
- Test set tidak pernah dipakai untuk memilih ambang atau hyperparameter.
- Setiap persentase disertai interval kepercayaan (n=200 -> sekitar ±5%).
- Perbandingan latensi wajib menyebut ukuran model dan perangkat.
- Hasil negatif dilaporkan sebagai hasil, bukan dihapus.
