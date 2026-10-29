# Ringkasan Kandidat — Keputusan Akhir

> Diperbarui: 29 Oktober 2026.
> Keputusan: **K1 dan K3 diambil**; K2 dan K4 tidak dipakai dan berkasnya dihapus.
> Fokus tahap ini: **lapisan model**. Sistem ditunda ke tahap terpisah.
> Rancangan lengkap: `outline-model/main.tex`.

## Kandidat yang dipakai

| Kandidat | Isi | Peran dalam penelitian |
|---|---|---|
| **K3** | Komparasi generasi model 2026 pada data dan metrik yang sama | Tahap A — menghasilkan tabel perbandingan dan memilih model terbaik |
| **K1** | Verifikasi kontekstual empat lapis | Tahap B — diterapkan pada model terpilih untuk menekan kesalahan senyap |

Keduanya bukan dua penelitian terpisah, melainkan dua tahap berurutan dengan satu
kumpulan data uji dan satu skrip metrik.

## Kandidat yang tidak dipakai

| Kandidat | Alasan tidak diambil |
|---|---|
| K2 — dekoding CTC terbimbing geometri | Risiko nol hasil paling tinggi; bentuknya juga tidak diakui sebagai bentuk tersendiri dalam Pedoman TA |
| K4 — distilasi VLM ke model ringan | Butuh API berbayar dan GPU; hasil negatif cukup mungkin dalam waktu tersedia |

Berkas `kandidat-K2-*.md` dan `kandidat-K4-*.md` dihapus dari repo. Riwayatnya tetap
tersimpan di Git bila suatu saat diperlukan.

## Batas tahap ini

Dikerjakan: data, model, komparasi, verifikasi, metrik, dan analisis.

Ditunda: antarmuka, basis data, log audit, sinkronisasi, uji penerimaan operator, dan
penerapan pada perangkat berdaya rendah.

Alasan penundaan: seluruh bagian itu bertumpu pada satu asumsi, yaitu lapisan model
sudah terbukti bekerja. Membangunnya lebih dahulu berisiko menghasilkan sistem rapi
yang bertumpu pada asumsi yang belum diuji.

## Enam model pembanding

| # | Model | Tahun | Peran |
|---|---|---|---|
| 1 | PP-OCRv6 *tiny/small/medium* | 2026 | Kandidat utama; tiga tingkat dibandingkan |
| 2 | PP-OCRv5 | 2026 | Pembanding generasi |
| 3 | CRNN-CTC | 2017 | Pembanding deep learning khusus |
| 4 | DBNet + PARSeq | 2024 | Pembanding pipeline dua tahap |
| 5 | ssocr | t.t. | Pembanding klasik non-*machine learning* |
| 6 | Model bahasa-visi | 2026 | Pembanding biaya |

Rincian alasan dan peran setiap model ada pada Bab IV `outline-model/main.tex`.
