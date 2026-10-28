# Laporan Word (.docx)

Versi Microsoft Word dari draft usulan penelitian. Isinya **dibangun otomatis**
dari berkas LaTeX di `../laporan-latex/bab/`, jadi teks hanya perlu diperbaiki
di satu tempat.

## Cara membangun

```bash
cd "C:/Tugas Akhir/rencana baru/skripsi-ppocrv6-main/laporan-word"
"C:/Users/hilma/AppData/Local/Programs/Python/Python313/python.exe" build_docx.py
```

Hasil: `draft-usulan-penelitian.docx`.

Kebutuhan: Python 3.10+ dengan `python-docx`
(`python -m pip install python-docx`). Gambar diagram diambil dari
`../laporan-latex/gambar/alur.png`; kalau belum ada, kompilasi dulu
`../laporan-latex/gambar/alur.tex` dengan Tectonic lalu ubah ke PNG.

## Format yang sudah diterapkan

| Ketentuan pedoman | Status |
|---|---|
| A4, margin kiri 4 cm, atas 4 cm, kanan 3 cm, bawah 3 cm | Ya |
| Times New Roman 12 pt | Ya |
| Spasi 2, rata kiri-kanan, indentasi alinea 1,27 cm | Ya |
| BAB angka Romawi, judul kapital, rata tengah | Ya |
| Subbab 1.1 dan subsubbab 1.1.1 | Ya |
| Nomor halaman isi `I-1`, `II-1` (kanan atas) | Ya, memakai field PAGE per bagian |
| Halaman pertama tiap bab: nomor di bawah tengah | Ya |
| Bagian awal: angka Romawi kecil (i, ii, iii) bawah tengah | Ya |
| Daftar isi otomatis | Ya, field TOC |
| Daftar poin huruf/angka | Ya |
| Sitasi (Nama, Tahun) | Ya, dikonversi dari `\parencite`/`\textcite` |
| Tabel: garis horizontal saja, kepala berulang antar halaman | Ya |
| Gambar dengan keterangan di bawah | Ya |

## Yang perlu diperbarui saat pertama dibuka

Tekan **Ctrl+A** lalu **F9** (atau klik kanan pada daftar isi → *Update Field*)
agar daftar isi dan nomor halaman terisi. Dokumen sudah ditandai agar Word
menawarkan pembaruan otomatis saat dibuka.

## Batasan yang perlu diketahui

1. **Nomor halaman pada daftar isi tampil sebagai angka saja** (`1`, `4`, `5`),
   bukan `I-1`, `II-4`. Ini akibat skema penomoran per bab: field PAGE dimulai
   ulang setiap bagian, sehingga daftar isi hanya membaca angka terakhir.
   Bila ingin persis, ketik awalan bab secara manual di daftar isi setelah
   naskah final.
2. Penanda `[belum diisi: ...]` berasal dari `\isian{}` di LaTeX dan harus
   diganti setelah eksperimen selesai.
3. NPM, nama pembimbing, dan bulan pada sampul ada di bagian atas
   `build_docx.py` (`NPM`, `PEMBIMBING_1`, `PEMBIMBING_2`, `BULAN_TAHUN`).

## Memeriksa hasil seperti Word asli

Berkas `preview-word.pdf` dibuat dengan mengekspor dokumen memakai Microsoft
Word (COM), bukan konverter pihak ketiga, sehingga tampilannya identik dengan
yang akan dilihat pembimbing.
