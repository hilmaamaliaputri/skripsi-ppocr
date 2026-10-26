# Protokol Review

Jenis: **rapid review**, bukan SLR penuh. Alasan: waktu menuju bimbingan terbatas, dan tujuannya memetakan celah, bukan melakukan sintesis sistematis seluruh literatur.

## Pertanyaan review
1. Metode apa yang sudah dipakai untuk mengenali angka display 7-segmen?
2. Dataset apa yang dipakai, dan apakah publik?
3. Metrik apa yang dilaporkan?
4. Keterbatasan apa yang diakui penulis?
5. Apakah ada yang melaporkan keandalan (kapan model salah, penolakan, kalibrasi)?

## Sumber pencarian
Crossref, arXiv, Google Scholar, OpenAlex, GitHub, Hugging Face, dan halaman penerbit.

## Kriteria inklusi
- Membahas pengenalan angka display 7-segmen / digital meter / alat ukur digital, **atau**
- Membahas komponen yang dipakai (CRNN, CTC, SVTR, PP-OCR, VLM untuk OCR), **atau**
- Menyediakan dataset publik yang relevan.
- Terbit 2019–2026; yang lebih lama hanya untuk metode dasar (CTC, CRNN).

## Kriteria eksklusi
- OCR dokumen umum tanpa kaitan ke display/instrumen.
- Pointer meter / dial meter (kecuali untuk pembanding metode).
- Paper yang tidak bisa diakses judul/abstraknya.
- Klaim tanpa angka atau tanpa dataset.

## Field ekstraksi
`ID | sitasi | tahun | venue | DOI/URL | metode | dataset | metrik | keterbatasan`

## Keterbatasan review
- Sebagian besar paper hanya dibaca abstrak + bagian metode, bukan seluruh isi.
- Angka akurasi tidak dapat dibandingkan langsung karena dataset berbeda.
- Pencarian berhenti saat pola sumber berulang (saturasi), bukan pada jumlah tertentu.
