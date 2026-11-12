# Dataset Latih Terpadu (Unified Training Dataset - Deduplicated)

Dataset latih ini menggabungkan **3 sumber data** representatif yang telah **didupikasi secara ketat** (setiap citra unik, tidak ada repetisi frame burst 5x):

### 1. Sumber 1: Data Timbangan Digital Sintetis (80 citra unik)
- 80 sampel penimbangan (`scale_syn_0001` s.d. `scale_syn_0080`).
- **Aturan Anti-Duplikasi:** Setiap sampel hanya mengambil **1 citra representatif** (`scale_syn_XXXX.jpg`). Tidak menyalin frame 1 s.d. 5 berulang kali sehingga tampilan di Windows Explorer rapi dan setiap baris merupakan angka bobot yang berbeda.
- Variasi tema industri: Mettler Toledo (LCD Backlit), CAS SW (Olive LCD), A&D (Red LED), dsb.

### 2. Sumber 2: Korpus Sintetis Pelatihan CRNN (1200 citra unik)
- Citra crop display 7-segmen dari generator `segment_synth.py` dengan variasi ghost segment, desimal, format float & integer.
- Berkas: `crnn_synth_0000.png` s.d. `crnn_synth_1199.png`.

### 3. Sumber 3: Dataset Riil SachaIZADI (468 citra riil unik)
- Citra meteran / timbangan display 7-segmen riil non-sintetis (High Quality, Medium Quality, Low Quality).
- **Aturan Integritas Uji:** HANYA memuat sampel dari `splits/train.csv` (eksklusif pelatihan). Citra uji (`splits/test.csv`) tidak diizinkan masuk ke folder ini untuk mencegah kebocoran data (*data leakage*).

### Ringkasan Statistik
- **Total Citra Latih:** 1748 file citra (di folder `images/`)
- **Duplikasi Citra:** 0 file duplikat (seluruh file memiliki hash & visual unik)
- **Format Anotasi:** `manifest.json` (JSON) dan `labels.csv` (CSV)
