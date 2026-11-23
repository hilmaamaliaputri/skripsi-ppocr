# Dataset Uji Terkunci (Locked Evaluation Dataset)

Dataset uji ini didedikasikan secara eksklusif untuk **evaluasi metrik Bab IV Skripsi** dan **bebas dari kontaminasi proses pelatihan**:

1. **120 Folder Uji Timbangan Digital (600 frame)**:
   - Evaluasi stabilitas multi-frame temporal (burst 5-frame per folder `scale_syn_0001` s.d. `scale_syn_0120`).
   - Menghitung akurasi sekuensial (FSR), Character Error Rate (CER), Selective Risk-Coverage (AURC), dan ECE.
2. **Sampel Uji Riil SachaIZADI (155 citra)**:
   - Pengujian generalisasi domain pada citra 7-segmen riil non-sintetis (`splits/test.csv`).
   - Disjoint 100% dari data latih ($D_{train} \cap D_{test} = \emptyset$).

### Integritas Akademik
Dataset di dalam folder ini **tidak boleh digunakan** untuk melatih bobot model atau menyetel ambang batas keyakinan kalibrasi.
