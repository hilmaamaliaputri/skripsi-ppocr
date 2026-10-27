# Kebaruan Dibandingkan Penelitian Terdahulu

> Status: DOKUMEN PENDUKUNG (bukan kandidat). Berlaku untuk K1–K4.
> Basis: `docs/research/sintesis-gap.md` + 24 sumber ber-ID.
> Dipakai untuk: menjawab pertanyaan "apa bedanya dengan penelitian yang sudah ada" saat bimbingan dan sidang.

## A. Tujuan dokumen

Dokumen ini memisahkan tiga hal yang sering tercampur saat presentasi:

1. Apa yang **sudah** dikerjakan penelitian terdahulu.
2. Apa yang **hanya berbeda secara rekayasa** (bukan kebaruan).
3. Apa yang **benar-benar baru** dan bisa dipertanggungjawabkan.

Pembanding utama adalah S01, karena S01 adalah penelitian terdekat: objek sama (display tujuh segmen), masalah sama (pencatatan manual rawan kesalahan), dan metode sekeluarga (CRNN + CTC).

## B. Yang sudah dikerjakan S01

Dari abstrak S01, masalah yang diselesaikan ada tiga: alat ukur digital lama tidak menyimpan hasil pengukuran, pencatatan manual meningkatkan peluang kesalahan manusia, dan modifikasi alat terlalu rumit. Solusinya berupa sistem pencatat data *real-time* berbasis OCR untuk display tujuh segmen, memakai CRNN dan CTC untuk menghindari kebutuhan segmentasi karakter. Hasil yang dilaporkan: **CER 3,6%** dan data yang tercatat sesuai dengan yang ditampilkan display [S01].

Angka `exact match 90,37% (197/218)` dan `input 200×100` berasal dari catatan ledger, **bukan dari abstrak** yang berhasil dibuka. Keduanya bertanda `[PERLU CEK]` sampai PDF lengkap diperiksa.

Pemakaian YOLOv8 oleh S01 bersifat **inferensi** dari daftar pustakanya (Ultralytics YOLOv8 dirujuk [S01]), bukan pernyataan eksplisit di abstrak. Bertanda `[PERLU CEK]`.

## C. Pergeseran posisi penelitian

| | S01 | Skripsi ini |
|---|---|---|
| Pertanyaan | Bisakah display tujuh segmen dibaca dan dicatat otomatis? | Kapan bacaan itu tidak layak dipercaya, dan bagaimana sistem tahu? |
| Titik henti | Setelah sistem berhasil membaca | Setelah sistem memutuskan menerima atau menolak |
| Kesimpulan yang dihasilkan | "Sistem berfungsi" | "Pada coverage X%, akurasi Y%" |

S01 berhenti tepat di titik ketika sistem berhasil membaca. Penelitian ini mulai tepat di titik itu.

## D. Empat sumbu kebaruan

### D1. Objek yang diukur: akurasi menjadi keandalan

S01 melaporkan CER 3,6% dan *exact match* 90,37% [S01]. Artinya sekitar satu dari sepuluh bacaan salah. Mekanisme yang menandai bacaan mana yang salah tidak dilaporkan dalam abstrak [S01] `[PERLU CEK]`.

Celahnya: kesalahan itu masuk ke catatan tanpa peringatan. Dalam konteks penimbangan, bagian itulah yang paling mahal — bacaan salah baru diketahui setelah transaksi selesai.

Angka CER yang baik **tidak** menjawab pertanyaan ini. CER mengukur rata-rata kesalahan karakter, bukan kemampuan sistem memberi tahu bahwa dirinya sedang salah. Pada 24 sumber yang ditelusuri (S01–S24), tidak ditemukan pelaporan *silent error rate*, kurva risk–coverage, maupun *selective accuracy* untuk display tujuh segmen.

### D2. Sumber informasi: dari dalam gambar ke luar gambar

Sistem pada S01 mengambil keputusan dari citra saja (deteksi area display, lalu pengenalan) [S01].

Lapisan verifikasi pada K1 memakai informasi yang tidak ada di dalam citra: rentang berat produk dari basis data, toleransi penimbangan, konsistensi antar bingkai, dan keyakinan yang sudah dikalibrasi. Ini jenis informasi yang berbeda, bukan informasi yang lebih banyak dari gambar yang sama.

Konsekuensi: kontribusinya tidak dapat direduksi menjadi "model yang lebih baik". Bila PP-OCRv6 [S14] diganti model lain, lapisan verifikasi tetap berlaku.

### D3. Keluaran: string menjadi keputusan

S01 menghasilkan teks angka [S01]. Penelitian ini menghasilkan teks disertai keputusan terima, tolak, atau minta konfirmasi, beserta alasannya.

Perubahan ini mengubah fungsi sistem dari *pembaca* menjadi *penjaga gerbang*, dan itulah yang membuat sistem dapat dinilai pada hal yang tidak dapat dinilai pada sistem S01.

### D4. Metrik: akurasi menjadi trade-off

| S01 [S01] | Penelitian ini |
|---|---|
| CER | Silent error rate |
| Exact match | Coverage |
| — | Selective accuracy |
| — | AURC (area under risk–coverage curve) |
| — | Tingkat koreksi operator |

Ini bukan penambahan metrik, melainkan kerangka penilaian yang berbeda. Akurasi menjawab "seberapa sering benar"; risk–coverage menjawab "bila hanya bacaan yang diyakini diterima, berapa yang harus ditolak dan seberapa benar sisanya".

## E. Tabel perbandingan

| Dimensi | S01 | Skripsi ini (K1) |
|---|---|---|
| Pertanyaan | Bisakah dibaca dan dicatat? | Kapan bacaan tidak layak dipercaya? |
| Masukan | Citra saja | Citra + konteks luar (produk, toleransi, antar-bingkai, kalibrasi) |
| Keluaran | String angka | String + terima/tolak/konfirmasi + alasan |
| Penanganan bacaan salah | Tidak dilaporkan `[PERLU CEK]` | Diukur sebagai *silent error rate* |
| Dasar keputusan | Keluaran model | Keyakinan terkalibrasi + aturan kontekstual |
| Metrik utama | CER 3,6%; exact match 90,37% | Silent error, coverage, selective accuracy, AURC |
| Bukti yang dihasilkan | "Sistem berfungsi" | "Pada coverage X%, akurasi Y%" |

## F. Yang TIDAK diklaim sebagai kebaruan

Bagian ini sama pentingnya dengan bagian D. Klaim di bawah sering dianggap kebaruan padahal bukan, dan menjadi sumber serangan saat sidang.

| Klaim | Alasan bukan kebaruan | Posisi yang benar |
|---|---|---|
| "PP-OCRv6 belum pernah diuji pada 7-segmen" | *First-to-try*, bukan kontribusi. Bila zero-shot sudah sangat baik, temuannya menjadi "memang bisa" | Pertanyaan pendukung, bukan klaim utama |
| "Sistem berjalan offline-first" | Rekayasa distribusi. Sah untuk Varian B, tidak mengandung kebaruan ilmiah | Bagian implementasi, bukan kontribusi |
| "Dataset timbangan belum ada" | Kontribusi data; nilainya kecil kecuali dipublikasikan dan dipakai pihak lain | Bagian metodologi |
| "Mengganti CRNN dengan PP-OCRv6" | Penggantian model bukan kontribusi, sekaligus menempatkan penelitian ini bersaing langsung dengan S01 | Dihindari |

## G. Posisi tingkat kebaruan

| Tingkat | Contoh | Kandidat |
|---|---|---|
| Model/arsitektur baru | Mengusulkan arsitektur baru | — |
| Metode baru | Constrained decoding, distilasi | K2, K4 |
| **Evaluasi + penerapan baru** | **Mengukur keandalan, lapis verifikasi** | **K1** |
| Aplikasi/rekayasa | Membangun aplikasi offline | — |

Kebaruan skripsi ini berada di tingkat ketiga. Untuk S1 Informatika tingkat itu sah dan memadai. Yang membuatnya bertahan bukan tingginya, melainkan spesifiknya: mengukur sesuatu yang belum pernah diukur pada domain ini, dengan metrik yang sudah mapan di bidang lain tetapi belum dipakai di sini.

## H. Kalimat siap pakai untuk Bab I

> S01 telah membuktikan bahwa display tujuh segmen dapat dibaca otomatis dengan CER 3,6% [S01], sehingga persoalan pembacaan sudah terjawab. Namun penelitian tersebut berhenti pada akurasi dan tidak melaporkan bagaimana sistem bersikap ketika bacaannya salah. Dengan tingkat kesalahan sekitar satu dari sepuluh bacaan, pertanyaan yang belum terjawab adalah berapa banyak kesalahan yang lolos tanpa peringatan, dan informasi apa yang dapat dipakai untuk mencegahnya. Penelitian ini mengambil posisi di titik tersebut: bukan untuk membaca lebih akurat daripada S01, melainkan untuk memastikan bacaan yang salah tidak diterima diam-diam.

## I. Risiko yang harus ditutup

Kebaruan ini runtuh bila pada test set ternyata PP-OCRv6 sudah nyaris sempurna dan *silent error* sudah nol. Bila itu terjadi, lapisan verifikasi tidak memiliki apa pun untuk diperbaiki.

Mitigasi ada pada protokol pengambilan data, bukan pada analisis:

1. Test set wajib memuat kondisi sulit secara sengaja: pantulan cahaya, LCD pasif berkontras rendah, sudut miring, digit terhalang sebagian, dan bacaan 7–8 karakter.
2. Kondisi sulit dicatat sebagai metadata, bukan dipisahkan diam-diam.
3. Bila hasil tetap menunjukkan *silent error* mendekati nol, laporkan apa adanya sebagai temuan.

Alasan kondisi sulit wajib dimasukkan: pada kondisi itulah lapisan verifikasi memiliki pekerjaan, dan pada kondisi itulah sistem tanpa gerbang paling mungkin gagal tanpa memberi tahu. Pola kegagalan pada kondisi pantulan cahaya sudah dilaporkan S04.

## J. Verifikasi yang belum selesai

| Hal | Status | Tindakan |
|---|---|---|
| Angka `exact match 90,37%` dan `197/218` milik S01 | `[PERLU CEK]` | Unduh PDF lewat akun kampus, periksa bagian hasil |
| Ukuran input `200×100` pada S01 | `[PERLU CEK]` | Sama seperti di atas |
| Pemakaian YOLOv8 oleh S01 | `[PERLU CEK]` | Periksa bagian metode |
| Ada tidaknya gerbang keyakinan pada sistem S01 | `[PERLU CEK]` | Periksa bagian metode dan pembahasan |
| Ukuran dataset latih S01 | `[PERLU CEK]` | Menentukan apakah perbandingan 50,0% melawan 90,37% adil |
