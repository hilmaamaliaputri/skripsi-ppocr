# Ringkasan 4 Kandidat Opsi Skripsi

> 2026-10-24. Untuk dibawa saat bimbingan Selasa, 27 Oktober 2026.
> Basis: `docs/research/sintesis-gap.md` + 25 sumber ber-ID.

| # | Kandidat | Bentuk TA | Inti pekerjaan | Gap | Risiko |
|---|---|---|---|---|---|
| **K1** | Verifikasi kontekstual hasil OCR | Pembangunan sistem | PP-OCRv6 + 4 lapis verifikasi (struktural, fisik, temporal, statistik) | G1, G3, G4, G6 | Sedang |
| **K2** | Dekoding CTC terbimbing geometri | Pengembangan metode / komparasi | Batasi alignment CTC dengan posisi slot; ablation decoder | G4, G6 | Sedang–tinggi |
| **K3** | Komparasi generasi model 2026 | Studi komparasi | PP-OCRv6 vs CRNN vs klasik vs VLM, lintas dataset | G2, G6 | Rendah–sedang |
| **K4** | Distilasi VLM ke model ringan | Pengembangan metode | Guru VLM -> siswa 1,5M; pseudo-label + filter | G5 | Tinggi |

## Rekomendasi
**K1** sebagai pilihan utama, **K3** sebagai cadangan. K1 punya kontribusi yang bisa dipertahankan (silent error), K3 paling aman dieksekusi. K2 hanya jika pembimbing menghendaki nuansa OCR yang lebih teknis. K4 hanya jika ingin lebih ambisius dan siap dengan hasil negatif.

## Cara pakai saat bimbingan
1. Tunjukkan tabel ini dulu.
2. Buka 1–2 file kandidat yang paling menarik.
3. Minta keputusan pada 7 pertanyaan di `docs/bimbingan/2026-10-27-agenda.md`.

## Catatan
- Keempat kandidat memakai objek yang sama (display 7-segmen) dan model yang sama (PP-OCRv6), jadi keputusan bisa diubah tanpa membuang pekerjaan pengumpulan data.
- Yang membedakan bukan objeknya, tapi **di mana kontribusinya diletakkan**.
