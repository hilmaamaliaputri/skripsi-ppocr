# Ringkasan Kandidat

> Diperbarui: 30 Oktober 2026.
> Kandidat yang dipakai pada outline terbaru: **K1 dan K2**.
> Struktur outline: judul, ringkasan, state of the art, tema utama, referensi,
> arsitektur. Berkas: `outline-model/main.tex`.

## Kandidat yang dipakai

| Kandidat | Isi | Posisi dalam alur |
|---|---|---|
| **K2** — dekoding CTC terbimbing geometri | Membatasi penguraian keluaran CTC memakai jumlah slot, batas slot, dan posisi titik desimal hasil profil proyeksi | Di dalam model, sebelum string terbentuk |
| **K1** — verifikasi kontekstual | Empat lapis pemeriksaan di luar piksel: struktural, fisik, temporal, kalibrasi | Sesudah model, pada tahap memutuskan |

K2 memperbaiki bentuk keluaran. K1 menentukan apakah keluaran itu layak dipakai.
Urutannya tidak dapat dibalik: verifikasi membandingkan jumlah digit dengan jumlah
slot, dan perbandingan itu baru berguna bila penguraian tidak lagi menghapus digit
kembar.

## Status kandidat lain

| Kandidat | Status |
|---|---|
| K3 — komparasi generasi model | Bukan kandidat utama lagi. Isinya dipakai sebagai protokol pengukuran (model pembanding CRNN-CTC, DBNet+PARSeq, ssocr) dan tetap tersimpan sebagai berkas |
| K4 — distilasi VLM ke model ringan | Dihapus dari repo. Butuh API berbayar dan GPU |

## Batas tahap ini

Dikerjakan: data, model, dekoding, verifikasi, metrik, analisis.

Ditunda ke tahap akhir: antarmuka operator, basis data, jejak audit, sinkronisasi,
pengujian penerimaan. Bagian itu bertumpu pada asumsi bahwa lapisan model dan
verifikasi sudah terbukti menurunkan kesalahan senyap.
