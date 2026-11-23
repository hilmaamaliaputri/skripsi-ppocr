# Dataset Latih Terpadu (`01_latih` — Clean & Zero Leakage)

Dataset latih ini memuat **2.268 citra unik** hasil pembersihan total tanpa duplikat maupun kebocoran uji ($D_{\text{train}} \cap D_{\text{test}} = \emptyset$):

1. **`scale_train_synthetic` (`400` citra):** `scale_train_0001..0400.jpg` (`seed=20261122`, seluruh tema LCD/LED & 6 kondisi lapangan).
2. **`scale_train_warehouse` (`200` citra):** `scale_wh_0001..0200.jpg` (`seed=20261123`, simulasi margin bezel gudang, nama indikator atas, LCD oranye, goresan/debu).
3. **`crnn_synthetic_corpus` (`1.200` citra):** `crnn_synth_0000..1199.png` (`32x128` fokus 7-segmen).
4. **`sachaizadi_real` (`468` citra riil):** Foto riil SachaIZADI train split dengan lokalisasi kotak jendela LCD (`roi_bbox`).
