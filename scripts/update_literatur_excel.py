import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import csv
import os

# Complete 30 literature data points with direct access links
data_pustaka = [
    # Tier 1 - Acuan Utama Inti (Puncak)
    {
        "no": 1,
        "kode": "LIT-01",
        "kategori": "Mandiri",
        "predikat": "Tier 1 - Acuan Utama Inti (Puncak)",
        "penulis": "Zhang dkk. (2026)",
        "judul": "PP-OCRv6: From 1.5M to 34.5M Parameters, Surpassing Billion-Scale VLMs on OCR Tasks",
        "penerbit": "arXiv:2606.13108 (PaddlePaddle Baidu)",
        "akreditasi": "ArXiv / Top Global AI Report (Baidu)",
        "link": "https://drive.google.com/file/d/1fNJCCjLOcocs4JnAcfwoTwYv4SwvGJJc/view",
        "fokus": "PPLCNetV4 + LightSVTR + kepala CTC (varian tiny 1.5M, small 7.7M, medium 34.5M)",
        "kelemahan": "Klaim akurasi 83,2% dilaporkan sendiri; kemampuan baca 7-segmen belum diuji pihak independen & tanpa filter verifikasi",
        "novelty": "Kandidat model utama Tugas Akhir Hilma untuk diuji secara independen pada 755 citra uji terkunci"
    },
    {
        "no": 2,
        "kode": "LIT-02",
        "kategori": "Mandiri",
        "predikat": "Tier 1 - Acuan Utama Inti (Puncak)",
        "penulis": "Effendi dkk. (2025)",
        "judul": "Unjuk Kerja Real-Time Data Logger Berbasis Model CRNN-CTC untuk Perekaman Data Seven Segment Display",
        "penerbit": "JIIF (Jurnal Ilmu dan Inovasi Fisika), Vol. 9(2): 107-115, UNPAD",
        "akreditasi": "SINTA 3 (Kemdikbudristek, Garuda)",
        "link": "https://drive.google.com/file/d/1dgcrSCs_0zrYdb2q0OqUqNMR4LyLqmHI/view",
        "fokus": "Pipeline YOLOv8 + CRNN-CTC data logger real-time display 7-segmen (FSR 90,37%, CER 3,6%)",
        "kelemahan": "Berhenti pada akurasi dataset sendiri; tanpa filter verifikasi keputusan sehingga membiarkan silent error lolos",
        "novelty": "Baseline pembanding nasional utama model CRNN-CTC; Hilma menambahkan fail-fast 4-lapis verifikasi"
    },
    {
        "no": 3,
        "kode": "LIT-03",
        "kategori": "Rujukan Sitasi Jurnal Zhang dkk. (2026)",
        "predikat": "Tier 1 - Acuan Utama Inti (Puncak)",
        "penulis": "Geifman & El-Yaniv (2017)",
        "judul": "Selective Classification for Deep Neural Networks",
        "penerbit": "NeurIPS 2017 (Advances in NIPS 30, pp. 4878-4887)",
        "akreditasi": "CORE Rank A* / Scopus Q1 (Puncak Konferensi AI Dunia)",
        "link": "https://drive.google.com/file/d/1NrJT3P405UHhlPjSoV7SVciEOh45MYn1/view",
        "fokus": "Teori klasifikasi selektif (opsi tolak), kurva Risk-Coverage, dan formulasi metrik AURC",
        "kelemahan": "Diuji pada klasifikasi citra objek umum, belum diterapkan pada pembacaan multi-digit instrumen timbangan",
        "novelty": "Landasan matematis utama skripsi Hilma untuk mengukur trade-off coverage vs eliminasi silent error hingga 0.0%"
    },
    {
        "no": 4,
        "kode": "LIT-04",
        "kategori": "Rujukan Sitasi Jurnal Zhang dkk. (2026)",
        "predikat": "Tier 1 - Acuan Utama Inti (Puncak)",
        "penulis": "Guo dkk. (2017)",
        "judul": "On Calibration of Modern Neural Networks",
        "penerbit": "ICML 2017 (PMLR 70, pp. 1321-1330)",
        "akreditasi": "CORE Rank A* / Scopus Q1 (Top-2 Konferensi Machine Learning Dunia)",
        "link": "https://drive.google.com/file/d/14gkA7M8p1MjmyDWENE91cFbkO7S522Xc/view",
        "fokus": "Menemukan overconfidence pada neural network; merumuskan Temperature Scaling 1-parameter (T*) & ECE",
        "kelemahan": "Kalibrasi dasar pada klasifikasi label tunggal, belum dikaitkan dengan domain sequence text OCR",
        "novelty": "Dasar matematis Uji Kalibrasi L4 skripsi Hilma untuk menyelaraskan skor keyakinan model dengan realitas"
    },
    {
        "no": 5,
        "kode": "LIT-05",
        "kategori": "Mandiri",
        "predikat": "Tier 1 - Acuan Utama Inti (Puncak)",
        "penulis": "Shi dkk. (2017)",
        "judul": "An End-to-End Trainable Neural Network for Image-based Sequence Recognition and Its Application to Scene Text",
        "penerbit": "IEEE TPAMI, Vol. 39(11): 2298-2304",
        "akreditasi": "Scopus Q1 / IEEE TPAMI / WoS (SCIE), Impact Factor 20.8",
        "link": "https://drive.google.com/file/d/1YI5zfExgPXFw5hRH74-eeoyLgFt5gT6F/view",
        "fokus": "Penemuan arsitektur CRNN (CNN + BiLSTM + CTC) untuk sequence recognition end-to-end tanpa segmentasi",
        "kelemahan": "Model dasar scene text tanpa mekanisme kalibrasi probabilitas atau fail-fast rejection",
        "novelty": "Fondasi arsitektur dari model pembanding CRNN-CTC lokal yang dilatih dari nol di skripsi Hilma"
    },
    {
        "no": 6,
        "kode": "LIT-06",
        "kategori": "Mandiri",
        "predikat": "Tier 1 - Acuan Utama Inti (Puncak)",
        "penulis": "Xiang dkk. (2026)",
        "judul": "Semi-Supervised Seven-Segment LED Display Recognition with an Integrated Data-Acquisition Framework",
        "penerbit": "Sensors (MDPI), Vol. 26(1): 265",
        "akreditasi": "Scopus Q1 / Web of Science (SCIE), Impact Factor 3.9",
        "link": "https://drive.google.com/file/d/14ft9l5jpF7OTtJYgYA2lsGCT2FEyRfdk/view",
        "fokus": "Pengenalan display tabung digital LED 7-segmen industri dengan semi-supervised learning",
        "kelemahan": "Tidak memiliki lapisan verifikasi fisik domain (min-max toleransi) dan tidak mengukur probabilitas kalibrasi",
        "novelty": "Bukti publikasi 2026 bereputasi tinggi Q1 bahwa topik 7-segmen industri sangat aktif; Hilma menambah 4 layer verifikasi"
    },

    # Tier 2 - Acuan Utama Penguat
    {
        "no": 7,
        "kode": "LIT-07",
        "kategori": "Mandiri",
        "predikat": "Tier 2 - Acuan Utama Penguat",
        "penulis": "Cui dkk. (2026)",
        "judul": "PP-OCRv5: A Specialized 5M-Parameter Model Rivaling Billion-Parameter VLMs on OCR Tasks",
        "penerbit": "arXiv:2603.24373 (PaddlePaddle Baidu)",
        "akreditasi": "ArXiv / Top Global AI Report (Baidu)",
        "link": "https://drive.google.com/file/d/1znJUbt3_3iMuMkpvriMILWVhrfvcgzUl/view",
        "fokus": "Arsitektur OCR ringan 5M parameter berbasis PPLCNetV3 + SVTR-LCNet + CTC",
        "kelemahan": "Hanya diuji pada benchmark teks umum; belum pernah diuji pada 7-segmen timbangan industri",
        "novelty": "Model pembanding generasi (PP-OCRv5 vs v6) pada Tahap A komparasi skripsi"
    },
    {
        "no": 8,
        "kode": "LIT-08",
        "kategori": "Mandiri",
        "predikat": "Tier 2 - Acuan Utama Penguat",
        "penulis": "Low dkk. (2024)",
        "judul": "Detecting and recognizing seven segment digits using a deep learning approach",
        "penerbit": "ITM Web of Conferences, Vol. 63: 01007",
        "akreditasi": "Scopus Indexed (Conference Proceedings)",
        "link": "https://drive.google.com/file/d/19wS3MgF6bmHxsq95OZLpXx-JOjPM85nE/view",
        "fokus": "Identifikasi kegagalan pengenalan 7-segmen akibat pantulan cahaya (glare) dan bleeding LED",
        "kelemahan": "Hanya mendokumentasikan kegagalan akibat glare tanpa memberi solusi algoritmik penanganan elektroda pasif",
        "novelty": "Dasar perancangan Uji Struktur L1 (OpenCV Slot Profiler) untuk membedakan unlit segment dari angka aktif"
    },
    {
        "no": 9,
        "kode": "LIT-09",
        "kategori": "Mandiri",
        "predikat": "Tier 2 - Acuan Utama Penguat",
        "penulis": "Bonilla-Rivas dkk. (2023)",
        "judul": "Adapting YOLO to recognition of real numbers in 7-segment digits",
        "penerbit": "2023 IEEE ICCNS (IEEE Xplore)",
        "akreditasi": "IEEE Xplore / Scopus Indexed",
        "link": "https://drive.google.com/file/d/1Q-6drhB1g120h9vKVnbJqH2GSdEEpqLi/view",
        "fokus": "Adaptasi YOLO deteksi digit desimal 7-segmen lab; membuktikan Tesseract & Paddle lama gagal",
        "kelemahan": "Pendekatan per-kotak bounding box rentan salah urut desimal jika urutan box terganggu",
        "novelty": "Memperkuat justifikasi kegagalan OCR standar dokumen pada 7-segmen & urgensi sequence modeling"
    },
    {
        "no": 10,
        "kode": "LIT-10",
        "kategori": "Mandiri",
        "predikat": "Tier 2 - Acuan Utama Penguat",
        "penulis": "Fu dkk. (2026)",
        "judul": "A Two-Level Illumination Correction Network for Digital Meter Reading Recognition in Non-Uniform Low-Light Conditions",
        "penerbit": "Journal of Imaging (MDPI), Vol. 12(4): 146",
        "akreditasi": "Scopus Q2 / Web of Science (ESCI)",
        "link": "https://drive.google.com/file/d/1a8aZYY8QKrmubhFc-wD_JvVkxD2Rtexh/view",
        "fokus": "Jaringan koreksi iluminasi 2-tahap membaca meteran digital kondisi pencahayaan rendah dan bayangan",
        "kelemahan": "Arsitektur komputasi berat, sulit berjalan real-time luring di ponsel edge gudang",
        "novelty": "Mengonfirmasi tantangan non-uniform illumination; Hilma menyelesaikan via pra-pemrosesan ringan + temporal burst"
    },
    {
        "no": 11,
        "kode": "LIT-11",
        "kategori": "Mandiri",
        "predikat": "Tier 2 - Acuan Utama Penguat",
        "penulis": "Yenneti dkk. (2023)",
        "judul": "Lightweight Single Pass Numerical Reading Extraction for Displays in the Wild",
        "penerbit": "Electronic Imaging, Vol. 35(7): 282",
        "akreditasi": "Scopus Indexed (IS&T Electronic Imaging)",
        "link": "https://drive.google.com/file/d/1KQusvC7zNjieG63V6R8n8SnzaXtF-HZN/view",
        "fokus": "Model single-pass ringan membaca display 7-segmen video streaming 30 fps (akurasi 97,8%)",
        "kelemahan": "Hanya evaluasi per frame video independen tanpa integrasi stabilitas multi-frame temporal",
        "novelty": "Dasar perancangan Uji Temporal L3 skripsi Hilma yang memanfaatkan burst 3-5 frame untuk stabilitas timbangan"
    },
    {
        "no": 12,
        "kode": "LIT-12",
        "kategori": "Mandiri",
        "predikat": "Tier 2 - Acuan Utama Penguat",
        "penulis": "Kanagarathinam & Sekar (2019)",
        "judul": "Text detection and recognition in raw image dataset of seven segment digital energy meter display",
        "penerbit": "Energy Reports (Elsevier), Vol. 5: 842-852",
        "akreditasi": "Scopus Q1 / Web of Science (SCIE), Impact Factor 5.2",
        "link": "https://drive.google.com/file/d/1i80GjCgFUZlbQRgAbGJss4TGRhoBLm84/view",
        "fokus": "Deteksi teks dan pengenalan angka 7-segmen pada meter energi listrik dan dataset mentah",
        "kelemahan": "Objek penelitian adalah meter energi statis terkontrol, bukan timbangan dengan pantulan getaran",
        "novelty": "Rujukan utama perbandingan OCR 7-segmen dalam literatur energi dan instrumentasi"
    },
    {
        "no": 13,
        "kode": "LIT-13",
        "kategori": "Rujukan Sitasi Jurnal Cui dkk. (2026)",
        "predikat": "Tier 2 - Acuan Utama Penguat",
        "penulis": "Slossberg dkk. (2020)",
        "judul": "On Calibration of Scene-Text Recognition Models",
        "penerbit": "ACCV 2020 / arXiv:2012.12643 (Amazon AWS AI)",
        "akreditasi": "Scopus Q1 / ACCV (Springer LNCS)",
        "link": "https://drive.google.com/file/d/1FcudqxJZu9E9DOAD8pQgPZHIUQ1H6lT4/view",
        "fokus": "Membuktikan kalibrasi OCR wajib di level deret utuh (sequence-level), bukan per karakter",
        "kelemahan": "Fokus pada kata kamus bahasa Inggris, belum diuji pada digit angka instrumen alat ukur",
        "novelty": "Menjustifikasi perancangan kalibrasi suhu L4 skripsi Hilma pada tingkat string desimal utuh"
    },
    {
        "no": 14,
        "kode": "LIT-14",
        "kategori": "Rujukan Sitasi Jurnal Low dkk. (2024)",
        "predikat": "Tier 2 - Acuan Utama Penguat",
        "penulis": "Finnegan dkk. (2019)",
        "judul": "Automated method for detecting and reading seven-segment digits from images of blood pressure monitors",
        "penerbit": "IEEE Transactions on Instrumentation and Measurement, Vol. 68(9): 3204-3212",
        "akreditasi": "Scopus Q1 / IEEE TIM / WoS (SCIE), Impact Factor 5.6",
        "link": "https://doi.org/10.1109/TIM.2018.2878004", # TERKUNCI IEEE
        "fokus": "Segmentasi & pembacaan otomatis 7-segmen LCD sudut miring memakai analisis geometri segmen fisik",
        "kelemahan": "Domain medis tensimeter, tanpa verifikasi batas fisis beban timbangan",
        "novelty": "Bukti jurnal Q1 bahwa analisis geometri fisik segmen sangat efektif melengkapi model deep learning"
    },
    {
        "no": 15,
        "kode": "LIT-15",
        "kategori": "Rujukan Sitasi Jurnal Fu dkk. (2026)",
        "predikat": "Tier 2 - Acuan Utama Penguat",
        "penulis": "Liao dkk. (2020)",
        "judul": "Real-time Scene Text Detection with Differentiable Binarization (DBNet)",
        "penerbit": "AAAI 2020 (Proceedings of AAAI, 34(07), 11474-11481)",
        "akreditasi": "CORE Rank A* / Scopus Q1",
        "link": "https://drive.google.com/file/d/1zbTTT2vC1_oJJwNFsdRsVPNTrAbB7Ozt/view",
        "fokus": "Deteksi teks real-time dengan binarisasi terdiferensiasi (DBNet) yang cepat dan presisi",
        "kelemahan": "Hanya detektor kotak teks, membutuhkan recognizer terpisah untuk membaca teks",
        "novelty": "Detektor resmi pada model pembanding pipeline dua tahap (DBNet + PARSeq) di skripsi Hilma"
    },
    {
        "no": 16,
        "kode": "LIT-16",
        "kategori": "Mandiri",
        "predikat": "Tier 2 - Acuan Utama Penguat",
        "penulis": "Bautista & Atienza (2022)",
        "judul": "Scene Text Recognition with Permuted Autoregressive Sequence Models (PARSeq)",
        "penerbit": "ECCV 2022 (Springer LNCS Vol 13688: 179-196)",
        "akreditasi": "Scopus Q1 / CORE Rank A*",
        "link": "https://drive.google.com/file/d/1wpdvpuZxCwlF-QQ-Tu96kKjqWzV6pJi2/view",
        "fokus": "Model STR berbasis Permutation Language Modeling yang efisien dan akurat pada arbitrary scene text",
        "kelemahan": "Dirancang untuk teks bahasa alami (kata berkonteks kamus), bukan deret angka desimal acak timbangan",
        "novelty": "Komponen recognizer pada model pembanding ke-4 (DBNet + PARSeq) di skripsi Hilma"
    },
    {
        "no": 17,
        "kode": "LIT-17",
        "kategori": "Mandiri",
        "predikat": "Tier 2 - Acuan Utama Penguat",
        "penulis": "Wei dkk. (2023)",
        "judul": "A Novel Short-Memory Sequence-Based Model for Variable-Length Reading Recognition of Multi-Type Digital Instruments",
        "penerbit": "Algorithms (MDPI), Vol. 16(4): 192",
        "akreditasi": "Scopus Q2 / Web of Science (ESCI)",
        "link": "https://drive.google.com/file/d/1FFcOQjwK8WtJo69a4weynZ33Zj2Qlai_/view",
        "fokus": "Pengenalan instrumen digital multi-tipe industri panjang variabel memakai model sequence short-memory",
        "kelemahan": "Tidak dilengkapi fail-fast rejection jika bacaan keluar dari batas spesifikasi fisis produk",
        "novelty": "Mendukung relevansi sequence-based model untuk membaca angka desimal dinamis alat ukur"
    },

    # Tier 3 - Acuan Pendukung
    {
        "no": 18,
        "kode": "LIT-18",
        "kategori": "Mandiri",
        "predikat": "Tier 3 - Acuan Pendukung",
        "penulis": "Graves dkk. (2006)",
        "judul": "Connectionist Temporal Classification: Labelling Unsegmented Sequence Data with Recurrent Neural Networks",
        "penerbit": "ICML 2006 (ACM, pp. 369-376)",
        "akreditasi": "CORE Rank A* / Scopus Q1 (Disitasi >10.000 kali)",
        "link": "https://drive.google.com/file/d/1vk6m-Q-k_CP0QVMBQh6aoDpARvgnFHsG/view",
        "fokus": "Penemuan loss CTC untuk melatih RNN memprediksi urutan label tanpa segmentasi awal",
        "kelemahan": "Karakteristik collapse duplicate (kecenderungan menghapus satu dari dua digit kembar berdampingan)",
        "novelty": "Landasan teoritis decoding CTC pada PP-OCRv6 dan CRNN-CTC untuk antisipasi galat digit kembar"
    },
    {
        "no": 19,
        "kode": "LIT-19",
        "kategori": "Mandiri",
        "predikat": "Tier 3 - Acuan Pendukung",
        "penulis": "Gushima & Kashima (2023)",
        "judul": "Automatic Generation of Seven-Segment Display Image for Machine-Learning-Based Digital Meter Reading",
        "penerbit": "PHM Society Asia-Pacific Conf. 2023",
        "akreditasi": "Scopus Indexed Conference (Mitsubishi Electric Corp.)",
        "link": "https://drive.google.com/file/d/1Fz2ZvivYQR2YZiS-AqCVI1RFZLehKX4T/view",
        "fokus": "Sintesis citra display LCD 7-segmen dengan variasi font, latar, sudut miring, dan pencahayaan",
        "kelemahan": "Belum menyentuh lapisan verifikasi keputusan luring pada timbangan industri dinamis",
        "novelty": "Rujukan metodologi sintesis citra data latih augmentasi di proyek Hilma"
    },
    {
        "no": 20,
        "kode": "LIT-20",
        "kategori": "Mandiri",
        "predikat": "Tier 3 - Acuan Pendukung",
        "penulis": "Ega dkk. (2026)",
        "judul": "Leveraging vision language models for digit recognition on digital measuring devices: a comparative analysis",
        "penerbit": "Bulletin of EEI, Vol. 15(5): 4239-4252",
        "akreditasi": "Scopus Q3 / SINTA 1 (UI / IAES)",
        "link": "https://drive.google.com/file/d/13nt6Zf3eFV5FMXxPrKX3Q6uwf5MaU2pD/view",
        "fokus": "Analisis komparatif model VLM (GPT-4V, LLaVA, Qwen-VL) untuk membaca digit alat ukur digital",
        "kelemahan": "Membuktikan VLM butuh GPU besar, latensi tinggi, dan tidak andal secara luring di perangkat edge",
        "novelty": "Rujukan akademis mutakhir paling kuat untuk menjustifikasi eliminasi model VLM pada skripsi Hilma"
    },
    {
        "no": 21,
        "kode": "LIT-21",
        "kategori": "Mandiri",
        "predikat": "Tier 3 - Acuan Pendukung",
        "penulis": "Sheng dkk. (2019)",
        "judul": "NRTR: A No-Recurrence Sequence-to-Sequence Model For Scene Text Recognition",
        "penerbit": "ICDAR 2019 (IEEE, pp. 781-786)",
        "akreditasi": "IEEE Xplore / CORE Rank A / Scopus Q1",
        "link": "https://drive.google.com/file/d/12ap5x8tk90V5iB2LFfCDZqhzoQf3bo43/view",
        "fokus": "Model sequence-to-sequence berbasis Transformer tanpa rekurensi untuk scene text",
        "kelemahan": "Komputasi multi-head attention lebih besar dibandingkan decoding CTC saat inferensi",
        "novelty": "Rujukan arsitektur kepala pengenal pada PP-OCRv6 (saat pelatihan NRTR dipakai memperkuat fitur)"
    },
    {
        "no": 22,
        "kode": "LIT-22",
        "kategori": "Mandiri",
        "predikat": "Tier 3 - Acuan Pendukung",
        "penulis": "Laroca dkk. (2019)",
        "judul": "Convolutional Neural Networks for Automatic Meter Reading",
        "penerbit": "Journal of Electronic Imaging (SPIE), Vol. 28(1): 013023",
        "akreditasi": "Scopus Q3 / Web of Science (SCIE)",
        "link": "https://drive.google.com/file/d/1z6AqHJFkhbngQrwMxmhJmOoKMjMUHsTZ/view",
        "fokus": "Pipeline AMR 2-tahap berbasis Fast-YOLO dan CNN untuk meteran utilitas (dataset 2.000 citra)",
        "kelemahan": "Objek meteran memiliki karakter mekanis putar (counter), berbeda dengan dinamika desimal 7-segmen",
        "novelty": "Dasar pembuktian keterbatasan lintas domain (cross-domain) alat ukur pada Bab II skripsi"
    },
    {
        "no": 23,
        "kode": "LIT-23",
        "kategori": "Mandiri",
        "predikat": "Tier 3 - Acuan Pendukung",
        "penulis": "Lin dkk. (2026)",
        "judul": "Do Vision-Language Models Measure Up? Benchmarking Visual Measurement Reading with MeasureBench",
        "penerbit": "arXiv:2602.04944 (BAAI FlagEval)",
        "akreditasi": "ArXiv / Top AI Benchmark (Beijing Academy of Artificial Intelligence)",
        "link": "https://drive.google.com/file/d/1UztNa4qROc3x4Q-ZvkKh3MRwqPHWj4Vn/view",
        "fokus": "Tolok ukur (MeasureBench) membuktikan VLM sering halusinasi dan gagal membaca alat ukur visual",
        "kelemahan": "Merupakan tolok ukur evaluasi VLM, tidak mengusulkan sistem OCR luring khusus timbangan",
        "novelty": "Memperkuat argumen bahwa model AI generatif umum tidak layak untuk pembacaan presisi instrumen"
    },
    {
        "no": 24,
        "kode": "LIT-24",
        "kategori": "Mandiri",
        "predikat": "Tier 3 - Acuan Pendukung",
        "penulis": "Kulkarni dkk. (2021)",
        "judul": "CNN-Based LCD Transcription of Blood Pressure Readings for Low-Resource Settings",
        "penerbit": "Frontiers in Artificial Intelligence, Vol. 4: 543176",
        "akreditasi": "Scopus Q2 / DOAJ, CiteScore 4.0+",
        "link": "https://drive.google.com/file/d/19KgGcGDPn-DTUjzPjSFuBRJ5Y4sIk2Qq/view",
        "fokus": "Transkripsi otomatis angka LCD 7-segmen tensimeter darah menggunakan smartphone daerah miskin",
        "kelemahan": "Menggunakan template bounding box kaku tensimeter; tidak adaptif terhadap timbangan industri",
        "novelty": "Mendukung konsep mobile low-resource; Hilma memperluas ke ranah industri dengan verifikasi fail-fast"
    },
    {
        "no": 25,
        "kode": "LIT-25",
        "kategori": "Rujukan Sitasi Jurnal Xiang dkk. (2026)",
        "predikat": "Tier 3 - Acuan Pendukung",
        "penulis": "Wannachai dkk. (2020)",
        "judul": "Real-time seven segment display detection and recognition online system using CNN",
        "penerbit": "2020 IEEE ECTI-CON",
        "akreditasi": "IEEE Xplore / Scopus Indexed",
        "link": "https://doi.org/10.1109/ECTI-CON49241.2020.9158302", # TERKUNCI IEEE
        "fokus": "Sistem online real-time deteksi dan pengenalan display 7-segmen kamera web berbasis CNN",
        "kelemahan": "Inferensi frame tunggal rentan fluktuasi transien saat angka display sedang berubah",
        "novelty": "Memperkuat urgensi Uji Temporal L3 skripsi Hilma untuk mengunci stabilitas penimbangan"
    },
    {
        "no": 26,
        "kode": "LIT-26",
        "kategori": "Rujukan Sitasi Jurnal Fu dkk. (2026)",
        "predikat": "Tier 3 - Acuan Pendukung",
        "penulis": "Rosyady & Wijaya (2021)",
        "judul": "AI-Powered Monitoring System for Analog and Digital kWh Meters Using Digital Image Processing and OCR",
        "penerbit": "2021 IEEE ICEEI",
        "akreditasi": "IEEE Xplore / Scopus & SINTA Recognized",
        "link": "https://doi.org/10.1109/ICEEI52627.2021.9611884", # TERKUNCI IEEE
        "fokus": "Implementasi pemrosesan citra digital dan OCR untuk pembacaan otomatis kWh meter di Indonesia",
        "kelemahan": "Objek meteran listrik statis tanpa penanganan getaran berat dinamis",
        "novelty": "Memperkaya kajian literatur nasional mengenai otomatisasi pembacaan alat ukur digital di Indonesia"
    },

    # Tier Buku Babon (Standar Teori)
    {
        "no": 27,
        "kode": "LIT-27",
        "kategori": "Buku",
        "predikat": "Tier Buku Babon (Standar Teori)",
        "penulis": "Gonzalez & Woods (2018)",
        "judul": "Digital Image Processing (4th Edition)",
        "penerbit": "Pearson Education, New York (ISBN: 978-0133356724)",
        "akreditasi": "Buku Referensi Standar Internasional (Disitasi >50.000 kali)",
        "link": "https://www.pearson.com/en-us/subject-catalog/p/digital-image-processing/P200000003264", # BUKU
        "fokus": "Teori konvolusi citra, binarisasi thresholding Otsu, morfologi matematika, deteksi tepi Sobel/Canny",
        "kelemahan": "Buku teori umum pemrosesan citra, tidak memuat model deep learning sekuensial modern",
        "novelty": "Dasar matematis implementasi modul OpenCV Slot Profiler dan pra-pemrosesan citra display"
    },
    {
        "no": 28,
        "kode": "LIT-28",
        "kategori": "Buku",
        "predikat": "Tier Buku Babon (Standar Teori)",
        "penulis": "Szeliski (2022)",
        "judul": "Computer Vision: Algorithms and Applications (2nd Edition)",
        "penerbit": "Springer Nature, Cham (ISBN: 978-3030343712)",
        "akreditasi": "Buku Teks Standar Internasional (Springer Texts in CS)",
        "link": "https://szeliski.org/Book/", # BUKU
        "fokus": "Transformasi geometris homografi, koreksi distorsi perspektif, segmentasi citra",
        "kelemahan": "Buku teori visi komputer umum tanpa spesialisasi panel digital instrumen",
        "novelty": "Landasan teori koreksi perspektif citra miring 15-30 derajat pada viewfinder operator timbangan"
    },
    {
        "no": 29,
        "kode": "LIT-29",
        "kategori": "Buku",
        "predikat": "Tier Buku Babon (Standar Teori)",
        "penulis": "Goodfellow dkk. (2016)",
        "judul": "Deep Learning",
        "penerbit": "MIT Press, Cambridge, MA (ISBN: 978-0262035613)",
        "akreditasi": "Buku Referensi Standar Internasional (MIT Press)",
        "link": "https://www.deeplearningbook.org/", # BUKU
        "fokus": "Arsitektur CNN, Recurrent Neural Networks (LSTM/BiLSTM), fungsi loss sekuensial",
        "kelemahan": "Fokus pada pondasi teori deep learning mendasar tanpa studi kasus alat ukur industri",
        "novelty": "Landasan teori arsitektur model komparasi PP-OCRv6 dan CRNN-CTC"
    },
    {
        "no": 30,
        "kode": "LIT-30",
        "kategori": "Buku",
        "predikat": "Tier Buku Babon (Standar Teori)",
        "penulis": "Bishop (2006)",
        "judul": "Pattern Recognition and Machine Learning",
        "penerbit": "Springer, New York (ISBN: 978-0387310732)",
        "akreditasi": "Buku Referensi Standar Internasional (Springer)",
        "link": "https://www.springer.com/gp/book/9780387310732", # BUKU
        "fokus": "Teori keputusan probabilistik Bayesian, loss matrix, kalibrasi ketidakpastian model",
        "kelemahan": "Buku teori dasar pattern recognition klasik",
        "novelty": "Teori dasar perancangan Decision Engine 4 keadaan (TERIMA, TOLAK, KONFIRMASI, BATAL) untuk eliminasi silent error"
    }
]

def format_literatur_sheet(ws):
    # Palette colors
    blue_header = "1E3A8A"     # #1E3A8A Dark Navy Header
    banner_bg1 = "1E3A8A"      # Title banner
    banner_bg2 = "DBEAFE"      # Subtitle banner
    banner_bg3 = "EFF6FF"      # Summary banner
    
    tier1_bg = "E0F2FE"        # Very light ice blue
    tier1_fg = "0369A1"        # Deep ocean blue
    
    tier2_bg = "F0F9FF"        # Light sky blue
    tier2_fg = "0284C7"        # Sky blue
    
    tier3_bg = "F8FAFC"        # Crisp clean slate
    tier3_fg = "334155"        # Slate dark
    
    tier_book_bg = "EEF2FF"    # Subtle indigo blue
    tier_book_fg = "4338CA"    # Deep indigo
    
    border_slate = Side(style='thin', color='CBD5E1')
    border_cell = Border(left=border_slate, right=border_slate, top=border_slate, bottom=border_slate)
    border_header_bot = Side(style='medium', color='1E3A8A')
    border_header = Border(left=border_slate, right=border_slate, top=border_slate, bottom=border_header_bot)

    # 1. Clear any existing content and merge ranges in Literatur sheet
    for merge in list(ws.merged_cells):
        ws.unmerge_cells(str(merge))
    
    # 2. Set Row Dimensions
    ws.row_dimensions[1].height = 14
    ws.row_dimensions[2].height = 34  # Title
    ws.row_dimensions[3].height = 24  # Drive URL Subtitle
    ws.row_dimensions[4].height = 24  # Summary Pill
    ws.row_dimensions[5].height = 12  # Space
    ws.row_dimensions[6].height = 36  # Header Row

    # 3. Setup Banners (Cols B to M -> Cols 2 to 13)
    # Title Row 2
    ws.merge_cells("B2:M2")
    c_title = ws.cell(row=2, column=2, value="PUSTAKA ACUAN RESMI SKRIPSI: 19 JURNAL KOLEKSI + 7 JURNAL BARU + 4 BUKU TEKS BABON")
    c_title.font = Font(name="Calibri", size=13, bold=True, color="FFFFFF")
    c_title.fill = PatternFill(start_color=banner_bg1, end_color=banner_bg1, fill_type="solid")
    c_title.alignment = Alignment(horizontal="center", vertical="center")

    # Subtitle Row 3
    ws.merge_cells("B3:M3")
    c_sub = ws.cell(row=3, column=2, value="📁 Folder Google Drive Koleksi: https://drive.google.com/drive/folders/1j1fDDoQguCMx6-iaTYqIlzpg8T0I-ZBU?usp=sharing  |  Total: 30 Pustaka")
    c_sub.font = Font(name="Calibri", size=10, bold=True, color="1E3A8A")
    c_sub.fill = PatternFill(start_color=banner_bg2, end_color=banner_bg2, fill_type="solid")
    c_sub.alignment = Alignment(horizontal="center", vertical="center")
    c_sub.hyperlink = "https://drive.google.com/drive/folders/1j1fDDoQguCMx6-iaTYqIlzpg8T0I-ZBU?usp=sharing"

    # Breakdown Row 4
    ws.merge_cells("B4:M4")
    c_stat = ws.cell(row=4, column=2, value="Tautan Akses: 23 Tautan Langsung Berkas PDF di Drive  •  3 Tautan Akses DOI IEEE (Terkunci)  •  4 Tautan Resmi Web Buku Babon")
    c_stat.font = Font(name="Calibri", size=9, bold=True, color="1E40AF")
    c_stat.fill = PatternFill(start_color=banner_bg3, end_color=banner_bg3, fill_type="solid")
    c_stat.alignment = Alignment(horizontal="center", vertical="center")

    # 4. Headers Row 6
    headers = [
        ("No", 6),
        ("Kode", 10),
        ("Kategori Sumber", 30),
        ("Predikat Hierarki Acuan", 24),
        ("Penulis & Tahun", 22),
        ("Judul Lengkap Makalah / Buku", 38),
        ("Nama Jurnal / Konferensi / Penerbit", 30),
        ("Indeks & Akreditasi Resmi", 26),
        ("Tautan Akses Langsung Berkas / Web", 38),
        ("Fokus & Metode Utama", 38),
        ("Kelemahan Literatur & Celah yang Diperbaiki", 38),
        ("Kontribusi & Novelty Skripsi Hilma", 40)
    ]

    ws.column_dimensions["A"].width = 3 # Margin

    for idx, (head_text, col_width) in enumerate(headers, start=2):
        col_letter = get_column_letter(idx)
        ws.column_dimensions[col_letter].width = col_width
        
        cell = ws.cell(row=6, column=idx, value=head_text)
        cell.font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color=blue_header, end_color=blue_header, fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = border_header

    # 5. Populate Data Rows
    for row_idx, item in enumerate(data_pustaka, start=7):
        ws.row_dimensions[row_idx].height = 56

        # Determine Tier colors
        if "Tier 1" in item["predikat"]:
            bg_color = tier1_bg
            pred_fg = tier1_fg
            pred_bold = True
        elif "Tier 2" in item["predikat"]:
            bg_color = tier2_bg
            pred_fg = tier2_fg
            pred_bold = True
        elif "Tier 3" in item["predikat"]:
            bg_color = tier3_bg
            pred_fg = tier3_fg
            pred_bold = False
        else: # Buku
            bg_color = tier_book_bg
            pred_fg = tier_book_fg
            pred_bold = True

        # Values mapping
        row_values = [
            (item["no"], "center", Font(name="Calibri", size=10, bold=True, color="1E293B")),
            (item["kode"], "center", Font(name="Calibri", size=10, bold=True, color="1E3A8A")),
            (item["kategori"], "left", Font(name="Calibri", size=9.5, italic=("Rujukan" in item["kategori"]), color="0F172A")),
            (item["predikat"], "center", Font(name="Calibri", size=9.5, bold=pred_bold, color=pred_fg)),
            (item["penulis"], "left", Font(name="Calibri", size=9.5, bold=True, color="0F172A")),
            (item["judul"], "left", Font(name="Calibri", size=9.5, color="0F172A")),
            (item["penerbit"], "left", Font(name="Calibri", size=9.5, color="334155")),
            (item["akreditasi"], "center", Font(name="Calibri", size=9.5, bold=True, color="1E3A8A")),
            # Link cell offset 8 (Col J / col_num 10) handled below
            None,
            (item["fokus"], "left", Font(name="Calibri", size=9, color="1E293B")),
            (item["kelemahan"], "left", Font(name="Calibri", size=9, color="475569")),
            (item["novelty"], "left", Font(name="Calibri", size=9, bold=True, color="0F172A"))
        ]

        # Fill cols 2 to 13
        for c_offset, r_data in enumerate(row_values):
            col_num = c_offset + 2
            cell = ws.cell(row=row_idx, column=col_num)
            cell.border = border_cell
            
            # If link column (Col J -> col_num 10)
            if col_num == 10:
                link_url = item["link"]
                cell.value = link_url
                cell.hyperlink = link_url
                cell.font = Font(name="Calibri", size=9, bold=True, color="1D4ED8", underline="single")
                cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
                cell.fill = PatternFill(start_color="EFF6FF", end_color="EFF6FF", fill_type="solid")
            else:
                val, horiz, f_style = r_data
                cell.value = val
                cell.font = f_style
                cell.alignment = Alignment(horizontal=horiz, vertical="center", wrap_text=True)
                cell.fill = PatternFill(start_color=bg_color, end_color=bg_color, fill_type="solid")

    # Add auto-filter to row 6
    ws.auto_filter.ref = f"B6:M{len(data_pustaka) + 6}"
    ws.views.sheetView[0].showGridLines = True
    print("Formatting completed successfully.")

def export_to_csv():
    csv_path = r"c:\Tugas Akhir\rencana baru\docs\spreadsheet\Literatur.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["", "PUSTAKA ACUAN RESMI SKRIPSI: 19 JURNAL KOLEKSI + 7 JURNAL BARU + 4 BUKU TEKS BABON"])
        writer.writerow(["", "Akses Koleksi PDF Google Drive: https://drive.google.com/drive/folders/1j1fDDoQguCMx6-iaTYqIlzpg8T0I-ZBU?usp=sharing | Total: 30 Pustaka"])
        writer.writerow(["", "Tautan Akses: 23 Tautan Langsung Berkas PDF di Drive | 3 Tautan Akses DOI IEEE (Terkunci) | 4 Tautan Resmi Web Buku Babon"])
        writer.writerow(["", "No", "Kode", "Kategori Sumber", "Predikat Hierarki Acuan", "Penulis & Tahun", "Judul Lengkap Makalah / Buku", "Nama Jurnal / Konferensi / Penerbit", "Indeks & Akreditasi Resmi", "Tautan Akses Langsung Berkas / Web", "Fokus & Metode Utama", "Kelemahan Literatur & Celah yang Diperbaiki", "Kontribusi & Novelty Skripsi Hilma"])
        
        for item in data_pustaka:
            writer.writerow([
                "",
                item["no"],
                item["kode"],
                item["kategori"],
                item["predikat"],
                item["penulis"],
                item["judul"],
                item["penerbit"],
                item["akreditasi"],
                item["link"],
                item["fokus"],
                item["kelemahan"],
                item["novelty"]
            ])
    print(f"Exported to {csv_path}")

def run():
    target_revisi = r"c:\Tugas Akhir\rencana baru\Manajemen_Skripsi_Hilma_Amalia_Putri_Revisi.xlsx"
    target_master = r"c:\Tugas Akhir\rencana baru\Manajemen_Skripsi_Hilma_Amalia_Putri.xlsx"

    # 1. Update Revisi workbook
    wb_rev = openpyxl.load_workbook(target_revisi)
    if "Literatur" in wb_rev.sheetnames:
        wb_rev.remove(wb_rev["Literatur"])
    ws_rev = wb_rev.create_sheet("Literatur")
    format_literatur_sheet(ws_rev)
    wb_rev.save(target_revisi)
    print(f"Successfully saved to {target_revisi}")

    # 2. Update Master workbook
    try:
        wb_mast = openpyxl.load_workbook(target_master)
        if "Literatur" in wb_mast.sheetnames:
            wb_mast.remove(wb_mast["Literatur"])
        ws_mast = wb_mast.create_sheet("Literatur")
        format_literatur_sheet(ws_mast)
        wb_mast.save(target_master)
        print(f"Successfully saved to {target_master}")
    except PermissionError:
        print(f"Notice: {target_master} locked by Excel.")

    # 3. Export CSV
    export_to_csv()

if __name__ == "__main__":
    run()
