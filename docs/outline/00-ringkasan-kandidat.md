# Ringkasan Kandidat

> Diperbarui: 30 Oktober 2026.
> Kandidat yang dipakai: **K1 dan K3**, sesuai arahan.
> Struktur outline: judul, ringkasan, state of the art, tema utama, referensi,
> arsitektur. Berkas: `outline-model/main.tex`.

## Kandidat yang dipakai

| Kandidat | Isi | Posisi dalam alur |
|---|---|---|
| **K3** — komparasi generasi model 2026 | Enam pendekatan dijalankan pada satu data uji dengan protokol dan metrik yang sama, disertai tabel biaya | Sebelum verifikasi; menghasilkan model dasar |
| **K1** — verifikasi kontekstual | Empat lapis pemeriksaan di luar piksel: struktural, fisik, temporal, kalibrasi | Sesudah model, pada tahap memutuskan |

K3 memilih model dan mengukur biayanya. K1 menentukan apakah keluaran model itu
layak dipakai. Keduanya memakai satu kumpulan data uji dan satu skrip metrik.

## Kandidat yang tidak dipakai

| Kandidat | Status |
|---|---|
| K2 — dekoding CTC terbimbing geometri | Tidak dipakai. Berkasnya dihapus dari repo; riwayatnya masih ada di Git |
| K4 — distilasi VLM ke model ringan | Tidak dipakai. Butuh API berbayar dan GPU |

## Batas tahap ini

Dikerjakan: data, perbandingan model, verifikasi, metrik, analisis.

Ditunda ke tahap akhir: antarmuka operator, basis data, jejak audit, sinkronisasi,
pengujian penerimaan. Bagian itu bertumpu pada asumsi bahwa model dasar sudah
dipilih dan lapisan verifikasi sudah terbukti menurunkan kesalahan senyap.
