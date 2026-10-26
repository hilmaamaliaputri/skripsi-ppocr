# Outline Skripsi — Pembacaan Display Tujuh Segmen dengan PP-OCRv6

Informatika, Fakultas Teknik, Universitas Siliwangi.
Topik: OCR display 7-segmen untuk pencatatan timbangan digital.

## Status
- Fase: **P2 — 4 kandidat outline siap dibawa bimbingan** (Selasa, 27 Oktober 2026).
- Alur: rapid review -> peta gap -> kandidat -> approval pembimbing -> proposal -> eksperimen -> naskah.
- Belum ada eksperimen yang dijalankan. Semua angka di repo ini berasal dari sumber lain dan ditandai ID-nya.

## Kenapa topik ini
- OCR generik gagal pada display 7-segmen: Tesseract 0/12 exact match pada citra timbangan nyata [S25].
- PP-OCRv6 (Juni 2026) adalah model terbaru yang secara eksplisit menyasar digital display, 1,5M–34,5M parameter, tersedia di Paddle, Transformers, dan ONNX Runtime.
- Literatur 2023–2026 sudah memenuhi ruang "arsitektur baru". Yang masih kosong: **keandalan** (kapan model salah) dan **verifikasi kontekstual**.

## Peta dokumen
- `docs/00-project-brief.md` — identitas, objek, batasan awal
- `docs/01-pre-plan.md` — fase kerja, gate, timeline 16 minggu
- `docs/PROGRESS.md` — log progres
- `docs/research/slr-protocol.md` — protokol review (rapid review, bukan SLR penuh)
- `docs/research/source-ledger.md` — 25 sumber ber-ID (S01–S25)
- `docs/research/sintesis-gap.md` — apa yang sudah diambil, 6 gap yang tersisa
- `docs/outline/00-ringkasan-kandidat.md` — **mulai dari sini saat bimbingan**
- `docs/outline/kandidat-K1..K4` — empat opsi lengkap
- `docs/outline/varian-bentuk-ta.md` — padanan bentuk TA menurut pedoman
- `docs/bimbingan/2026-10-27-agenda.md` — agenda + 7 pertanyaan untuk pembimbing
- `references/references.bib` — BibTeX sumber kunci
- `scripts/check_refs.py` — validasi ID sumber sebelum commit

## Cara pakai saat bimbingan
1. Buka `docs/outline/00-ringkasan-kandidat.md`.
2. Tunjukkan 1–2 kandidat yang paling menarik.
3. Minta keputusan pada 7 pertanyaan di `docs/bimbingan/2026-10-27-agenda.md`.

## Aturan kerja
Lihat `AGENTS.md`. Inti: klaim wajib punya ID sumber, dilarang mengarang sitasi, jalankan validator sebelum commit.

```bash
python3 scripts/check_refs.py   # harus exit 0
```
