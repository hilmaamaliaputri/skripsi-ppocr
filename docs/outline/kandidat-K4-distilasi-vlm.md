# Kandidat K4 — Distilasi VLM ke Model Ringan (cadangan)

> Status: CADANGAN. Gap anchor: G5.
> Sumber kunci: S02, S13, S14, S23.

## A. Judul (kandidat)
**Distilasi Pengetahuan Vision-Language Model ke Model Ringan untuk Pembacaan Display Tujuh Segmen**

## B. Inti
VLM akurat tetapi berat dan butuh jaringan [S02]. Model kecil cepat tetapi butuh label. Distilasi menjembatani: VLM memberi label pada citra tak berlabel, model kecil dilatih dari situ.

## C. Rumusan masalah
1. Seberapa jauh model 1,5M–5M dapat meniru kemampuan VLM pada tugas ini?
2. Berapa banyak citra tak berlabel yang dibutuhkan untuk mencapai ambang tertentu?
3. Apakah penyaringan pseudo-label (agreement, confidence) lebih penting daripada jumlah data?

## D. Rancangan
| # | Konfigurasi | Yang diukur |
|---|---|---|
| E1 | Supervised saja (500 label) | FSR |
| E2 | + 2.000 pseudo-label | FSR, biaya |
| E3 | + 5.000 pseudo-label | FSR |
| E4 | + filter agreement | presisi pseudo-label |

## E. Risiko
- Biaya API dan kuota.
- Noise guru dapat menurunkan hasil.
- Hasil negatif cukup mungkin; harus diterima sebagai temuan.

## F. Pustaka kunci
S02, S13, S14, S23.

## Catatan
Jangan pilih ini kalau waktu kurang dari 16 minggu atau tidak ada akses API yang stabil.
