# Laporan LaTeX — Draft Usulan Penelitian TA

Dokumen LaTeX untuk usulan penelitian Tugas Akhir, disusun mengikuti
Pedoman Pelaksanaan TA Jurusan Informatika Universitas Siliwangi
(`FT.IF-AKD-F.A.05`).

## Isi folder

| Berkas | Keterangan |
|---|---|
| `main.tex` | Dokumen utama: pengaturan format, halaman sampul, dan pemanggilan bab |
| `bab/01-pendahuluan.tex` | BAB I — latar belakang, rumusan masalah, tujuan, manfaat, batasan |
| `bab/02-landasan-teori.tex` | BAB II — teori, penelitian terdahulu, posisi penelitian |
| `bab/03-metodologi.tex` | BAB III — rancangan, data, empat lapis verifikasi, eksperimen, metrik, jadwal |
| `bab/abstrak.tex` | Abstrak (angka hasil masih berupa penanda `[belum diisi: ...]`) |
| `bab/kata-pengantar.tex` | Kata pengantar |
| `references.bib` | 24 sumber ber-ID (S01–S24) dalam format BibTeX |
| `build.sh` | Skrip kompilasi |
| `gambar/` | Tempat berkas gambar |
| `fonts/` | **Tidak ada di repo.** Isi sendiri, lihat bagian Font |

## Cara kompilasi

```bash
cd "C:/Tugas Akhir/rencana baru/skripsi-ppocrv6-main/laporan-latex"
bash build.sh
```

Hasil: `main.pdf`. Skrip memilih mesin secara otomatis: Tectonic, lalu
latexmk, lalu pdflatex + bibtex. Setelah selesai, skrip menghitung jumlah
entri daftar pustaka di `.bbl` — kalau angkanya `0`, sitasi belum terpasang
walaupun kompilasi "berhasil".

Kompilasi manual dengan Tectonic:

```bash
"$HOME/tools/tectonic/tectonic.exe" main.tex
```

## Font Times New Roman

Dokumen memakai Times New Roman asli bila folder `fonts/` berisi berkasnya.
Font tidak disertakan dalam repo karena lisensi Microsoft. Salin sekali:

```bash
cd "C:/Tugas Akhir/rencana baru/skripsi-ppocrv6-main/laporan-latex"
mkdir -p fonts
cp /c/Windows/Fonts/times.ttf /c/Windows/Fonts/timesbd.ttf \
   /c/Windows/Fonts/timesi.ttf /c/Windows/Fonts/timesbi.ttf fonts/
```

Bila `fonts/` kosong, dokumen otomatis memakai `mathptmx` (klon Times) dan
tetap dapat dikompilasi. Untuk skripsi yang dicetak, sebaiknya pakai font asli.

## Format yang sudah sesuai pedoman

| Ketentuan | Status |
|---|---|
| Times New Roman 12 pt | Ya, bila `fonts/` terisi; jika tidak, klon Times |
| Spasi 2 | Ya (`\doublespacing`) |
| Margin kiri 4, atas 4, kanan 3, bawah 3 cm | Ya (`geometry`) |
| Rata kiri-kanan | Ya (bawaan LaTeX) |
| Indentasi alinea 7 ketukan | Ya (1,27 cm) |
| Nomor bab angka Romawi, judul kapital, rata tengah | Ya (`titlesec`) |
| Subbab 1.1, subsubbab 1.1.1 | Ya (bawaan kelas `report`) |
| Nomor halaman isi `I-1`, `II-1`, dan seterusnya | Ya |
| Halaman pertama tiap bab: nomor di bawah tengah | Ya |
| Daftar poin memakai huruf/angka, bukan bullets | Ya (`poin`, `urut`) |
| Sitasi bentuk (Nama, Tahun) | Ya (`natbib` + `plainnat`) |
| Tanpa kata ganti orang | Ya, seluruh teks memakai bentuk impersonal |

## Yang perlu diisi

1. `\NPMPenulis`, `\NamaPembimbingSatu`, `\NamaPembimbingDua`, `\BulanTahun`
   di `main.tex`.
2. Semua penanda `[belum diisi: ...]` di `bab/abstrak.tex` setelah eksperimen
   selesai.
3. Lampiran (lembar konsultasi, pernyataan keaslian) belum dibuat.

## Menambah sitasi

```latex
\parencite{effendi2025unjuk}        % (Effendi dkk., 2025) gaya kurung
\textcite{effendi2025unjuk}         % Effendi dkk. (2025) sebagai subjek kalimat
```

Kunci sitasi harus sama persis dengan kunci di `references.bib`. Setelah
menambah, jalankan `bash build.sh` lalu periksa jumlah entri `.bbl`.

Catatan: `plainnat` menulis "et al." untuk penulis lebih dari dua. Pedoman
meminta "dkk.". Penggantian dilakukan saat penyuntingan akhir, atau dengan
menyalin `plainnat.bst` menjadi `plainnat-dkk.bst` dan mengganti teks
`et~al.` menjadi `dkk.`.

## Jebakan yang sudah ditemui

1. **`apalike.bst` tidak tersedia di Tectonic.** Memakainya membuat BibTeX
   gagal dan muncul galat `Bibliography not compatible with author-year
   citations`. Solusi yang dipakai: `\bibliographystyle{plainnat}`.
2. **Jangan menempel argumen pada `\chapter`.** Redefinisi seperti
   `\renewcommand{\chapter}{...\OldChapter\pagestyle{...}}` merusak
   `\chapter*` (ABSTRAK, KATA PENGANTAR) dengan galat
   `Argument of \pagestyle has an extra }`. Reset nomor halaman dilakukan
   dengan `\pretocmd{\chapter}{\setcounter{page}{1}}` dari `etoolbox`.
3. **Jangan memakai `\fancyhf{}` di dalam `\fancypagestyle{plain}`.** Perintah
   itu menghapus definisi kepala halaman untuk seluruh dokumen, sehingga nomor
   halaman hilang dari semua halaman isi. Gaya halaman di dokumen ini dibuat
   manual (`\ps@isita`) agar nomor hanya muncul di kanan atas.
4. **Nomor halaman `I-1` hilang bila `\renewcommand{\thepage}` diletakkan
   sebelum `\pagenumbering{arabic}`.** Urutan yang benar: `\pagenumbering`
   dulu, baru `\renewcommand{\thepage}`.
5. **Tectonic tidak menulis berkas `.log` kecuali dijalankan dengan
   `--keep-logs`.** Tanpa itu, pencarian peringatan `Overfull` akan selalu
   kosong dan menyesatkan.
6. **Tabel lebar harus memakai kolom `p{...}` atau `tabularx`**, bukan `l`/`c`,
   agar tidak melewati margin.

## Memakai Overleaf

1. Unggah seluruh folder (tanpa `fonts/`), atur compiler ke **XeLaTeX**.
2. Tanpa `fonts/`, dokumen otomatis memakai `mathptmx` — hasil tetap rapi.
3. Bila ingin Times New Roman asli, unggah empat berkas TTF ke folder `fonts/`.
