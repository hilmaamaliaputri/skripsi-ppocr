<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.agents/skills/antislop/SKILL.md`
- UI / visual: `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
- Copy & text: `antislop-copywriting`: `.agents/skills/antislop-copywriting/SKILL.md`
- People: `antislop-human`: `.agents/skills/antislop-human/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `antislop-code`: `.agents/skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->

---

# Pedoman Pengembangan Sistem & Agen (AGENTS.md)

## 1. Aturan Penggunaan Skill & Anti-Slop (Wajib Dipatuhi)
1. **Pemeriksaan Skill Relevan:** Setiap kali prompt atau tugas berkaitan dengan salah satu domain di bawah, agen **wajib membaca dan mematuhi instruksi skill** sebelum menghasilkan kode atau desain:
   - **UI / Visual Web & Komponen:** Wajib membaca `antislop-ui` (`.agents/skills/antislop-ui/SKILL.md`) dan `frontend-design-deslop`. Dilarang memunculkan elemen generik AI slop (kartu mengambang berlebihan, gradien ungu-biru mengambang, pendaran/glow tanpa fungsi, font generik tanpa hierarki).
   - **Teks, Headline, & Copywriting:** Wajib membaca `antislop-copywriting` (`.agents/skills/antislop-copywriting/SKILL.md`). Hindari kata-kata kosong AI (*elevate, seamless, game-changer, unlock*).
   - **Aksesibilitas & Interaksi Manusia:** Wajib membaca `antislop-human` (`.agents/skills/antislop-human/SKILL.md`) untuk memastikan kontras teks, penanganan fokus keyboard, dan keterbacaan operator.
   - **Tata Letak Seluler & Responsif:** Wajib membaca `antislop-layoutmobile` (`.agents/skills/antislop-layoutmobile/SKILL.md`) untuk memastikan kesesuaian viewport ponsel di lapangan.
   - **Komentar Kode:** Wajib membaca `antislop-code` (`.agents/skills/antislop-code/SKILL.md`). Dilarang menulis komentar AI berulang/trivia (*e.g.* `// set variable x to 1`).
   - **Pencarian Keahlian Tambahan:** Gunakan `find-skills` (`.agents/skills/find-skills/SKILL.md`) jika membutuhkan package skill eksternal tambahan.

## 2. Standar Arsitektur: Modular & Anti-Monolith (Scalable by Design)
1. **Dilarang Berkas Monolitik:** Setiap berkas kode dilarang melebihi ~300 baris kode jika mencampurkan beberapa tanggung jawab.
2. **Pemisahan Tanggung Jawab (*Single Responsibility Principle*):**
   - **Visi Komputer (`src/vision/`):** Khusus ekstraksi ROI, pra-pemrosesan citra, binarisasi, dan profiling slot OpenCV. Tidak boleh memuat logika bisnis keputusan.
   - **Model Inferensi (`src/models/`):** Khusus pemanggilan model OCR (PP-OCRv6 ONNX). Hanya menerima citra crop dan mengembalikan string mentah + skor keyakinan.
   - **Verifikasi Lapis Mandiri (`src/verification/`):** Setiap lapis verifikasi berdiri sendiri dalam berkas terpisah:
     - `v_temporal.py` (L3: stabilitas multi-frame)
     - `v_structural.py` (L1: kecocokan slot fisik dan posisi titik desimal)
     - `v_physical.py` (L2: batas produk min-max dan toleransi riwayat)
     - `v_calibration.py` (L4: penskalaan suhu dan gerbang ambang batas)
   - **Engine Keputusan (`src/engine/`):** Menggabungkan hasil verifikasi untuk menentukan status akhir (`TERIMA`, `TOLAK`, `KONFIRMASI`, `BATAL`) dan mencatat jejak audit (`audit_logger.py`).
   - **Frontend:** Memisahkan state management/hooks, komponen tampilan atomik, dan wrapper API.

## 3. Disiplin Dokumentasi & Riset
- Seluruh riset teknis, analisis kebutuhan, dan catatan arsitektur wajib disimpan di folder `docs/` dengan penamaan terstruktur (`01-...`, `02-...`).
- Setiap keputusan desain atau perubahan arsitektur harus tercatat di dokumen terkait sebelum dieksekusi.

## 4. Disiplin Evaluasi Akademik (Tugas Akhir)
- Data uji terkunci (`sistem/data/locked_test_set` dan `sistem/data/test`) **dilarang keras** dipakai untuk memilih ambang keyakinan, hyperparameter, atau aturan pra-pemrosesan.
- Ambang verifikasi hanya boleh diperoleh dari dataset kalibrasi (`sistem/data/calib`).
- Setiap pelaporan akurasi/metrik wajib menyertakan jumlah sampel ($n$) dan interval kepercayaan 95% (*bootstrap*).

## 5. Katalog Skill Terpasang (Global di `~/.agents/skills/`)
Seluruh keahlian di bawah **telah terpasang secara global**. Agen **wajib membaca berkas SKILL.md terkait** sebelum memulai pengerjaan pada domain tersebut:

### A. Frontend, React & Desain Anti-Slop
1. **`frontend-design`** (`~/.agents/skills/frontend-design/SKILL.md`)
   - *Fungsi:* Pembuatan antarmuka web berkualitas tinggi, bernilai guna tinggi, dan berestetika khas.
2. **`vercel-react-best-practices`** (`~/.agents/skills/vercel-react-best-practices/SKILL.md`)
   - *Fungsi:* Pola arsitektur React, efisiensi rendering, dan state management modern.
3. **`tailwind-css-patterns`** (`~/.agents/skills/tailwind-css-patterns/SKILL.md`)
   - *Fungsi:* Pola utility-first Tailwind yang bersih, bebas duplikasi, dan maintainable.
4. **`frontend-design-deslop`** (`~/.agents/skills/frontend-design-deslop/SKILL.md`)
   - *Fungsi:* Eliminasi boilerplate dan artefak AI slop pada komponen web.

### B. Backend API, Python & FastAPI
1. **`fastapi`** (`~/.agents/skills/fastapi/SKILL.md`)
   - *Fungsi:* Konvensi resmi FastAPI, penanganan dependency injection, dan skema Pydantic.
2. **`fastapi-templates`** (`~/.agents/skills/fastapi-templates/SKILL.md`)
   - *Fungsi:* Template arsitektur REST API modular, router terpisah, dan middleware jejak audit.
3. **`fastapi-patterns`** (`~/.agents/skills/fastapi-patterns/SKILL.md`)
   - *Fungsi:* Pola async, error handling terstruktur, dan validasi data.

### C. Pengujian, Visi Komputer & Metrik
1. **`computer-vision-opencv`** (`~/.agents/skills/computer-vision-opencv/SKILL.md`)
   - *Fungsi:* Praktik pemrosesan citra OpenCV, deteksi kontur, dan manipulasi ROI.
2. **`python-testing-patterns`** (`~/.agents/skills/python-testing-patterns/SKILL.md`)
   - *Fungsi:* Praktik pengujian unit dan integrasi Python, fixture modular, dan harness metrik.
3. **`pytest-coverage`** (`~/.agents/skills/pytest-coverage/SKILL.md`)
   - *Fungsi:* Standar pengukuran cakupan kode (*test coverage*) pada pipeline backend.
4. **`academic-paper`** (`~/.agents/skills/academic-paper/SKILL.md`)
   - *Fungsi:* Standar penyusunan laporan, penulisan tabel metrik, dan validasi statistik ilmiah.
