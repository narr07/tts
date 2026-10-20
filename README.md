# 🧩 Petualangan Kata SD - Teka-Teki Silang Edukasi SD

Platform pembelajaran interaktif berbasis web (PWA/Mobile-First) yang menyajikan teka-teki silang tematik berjenjang untuk siswa Sekolah Dasar (Kelas 1 hingga Kelas 6 SD) sesuai Kurikulum Merdeka.

---

## 🌟 Fitur Utama

- **Peta Petualangan Belajar (Leveling Kelas 1-6 SD):**
  - Mengelompokkan materi ke dalam Fase Kurikulum SD (Fase A: Kelas 1-2, Fase B: Kelas 3-4, Fase C: Kelas 5-6).
  - Filter mata pelajaran dinamis berdasarkan ketersediaan soal yang dibuat guru.
- **Arena Teka-Teki Silang Mobile-First:**
  - Kotak TTS persegi proporsional di seluruh resolusi smartphone.
  - Modal soal interaktif saat kotak ditekan untuk memudahkan pengisian di layar sentuh.
  - Selebrasi partikel konfeti (`canvas-confetti`) saat berhasil menyelesaikan level 100%.
- **Sistem Autentikasi Multi-Role (@nuxtjs/better-auth):**
  - **Siswa:** Masuk mudah menggunakan NISN dan Tanggal Lahir, tanpa kata sandi rumit. Mendukung pendaftaran siswa dari sekolah manapun.
  - **Guru:** Masuk menggunakan Email dan Kata Sandi/PIN untuk membuat soal TTS tematik.
  - **Super Admin (`dinarpermadi07@gmail.com`):** Hak akses penuh untuk mengelola guru, siswa, dan bank soal.
- **Papan Peringkat (Leaderboard):**
  - Peringkat XP dan bintang dengan podium Juara 1, 2, dan 3 per tingkatan kelas.
- **Studio Soal Guru:**
  - Pembuat TTS otomatis dengan generator penempatan kata (mendatar/menurun) dan ukuran grid dinamis.
- **Edit Profil Mandiri & Kelola Pengguna:**
  - Siswa dan guru dapat menyesuaikan nama, sekolah, kelas, dan PIN. Admin dapat menyunting data dan capaian siswa.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

- **Framework:** [Nuxt 4](https://nuxt.com/) (Vue 3 + Vite)
- **UI & Komponen:** [@nuxt/ui v4](https://ui.nuxt.com/) & Tailwind CSS v4
- **Tipografi:** Google Fonts *Baloo 2* (Heading) & *Fredoka* (Body Sans)
- **Autentikasi:** [@nuxtjs/better-auth](https://better-auth.nuxt.dev/) & [Better Auth](https://www.better-auth.com/)
- **Database & ORM:** [NuxtHub](https://hub.nuxt.com/) (SQLite / Cloudflare D1) & [Drizzle ORM](https://orm.drizzle.team/)
- **State Management:** [Pinia](https://pinia.vuejs.org/) & [@vueuse/core](https://vueuse.org/)

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### 1. Prasyarat
Pastikan telah menginstal [Bun](https://bun.sh/) (disarankan) atau Node.js 18+.

### 2. Instalasi Dependensi
```bash
bun install
```

### 3. Konfigurasi Environment
Salin file `.env.example` ke `.env`:
```bash
cp .env.example .env
```

### 4. Inisialisasi & Seeding Database
Jalankan skrip untuk membuat tabel dan mengisi data awal (Admin, Guru, Siswa, dan 12 Soal TTS):
```bash
# Inisialisasi tabel Better Auth
bun run scripts/init_auth_db.ts

# Seed akun Admin, Guru, dan Siswa
bun run scripts/seed_edu.ts

# Seed bank soal TTS Kelas 1-6 SD
bun run scripts/seed_puzzles.ts
```

### 5. Jalankan Development Server
```bash
bunx nuxt dev
```
Buka peramban di `http://localhost:3000`.

---

## 🔐 Akun Default untuk Pengujian

- **Super Admin:**
  - Email: `dinarpermadi07@gmail.com`
  - PIN / Sandi: isi `SEED_ADMIN_PASSWORD` sebelum menjalankan `seed_edu.ts`, atau pakai sandi acak yang dicetak skrip itu
- **Guru Pembimbing:**
  - Email: `guru.budi@sdn01.sch.id`
  - PIN / Sandi: `guru123`
- **Siswa (Contoh Kelas 4 SD):**
  - NISN: `0012345674`
  - Tanggal Lahir: `2014-11-25`

---

## ☁️ Deploy ke Cloudflare Pages

Build untuk Cloudflare memakai preset `cloudflare_pages`. NuxtHub otomatis mengganti database SQLite lokal dengan **Cloudflare D1** lewat binding `DB`, jadi kode API tidak perlu diubah. Hasil build ada di `dist/`.

### Sekali saja: siapkan Cloudflare
```bash
# 1. Masuk ke akun Cloudflare (membuka browser)
bunx wrangler login

# 2. Buat database D1, lalu salin database_id dari output ke .env sebagai NUXT_HUB_D1_DATABASE_ID
bunx wrangler d1 create petualangan-kata-sd

# 3. Buat proyek Pages (nama harus sama dengan `name` di nuxt.config.ts)
bunx wrangler pages project create petualangan-kata-sd --production-branch main

# 4. Build sekali supaya config wrangler (berisi binding D1 dan folder migrasi) terbentuk
bun run build:pages

# 5. Buat tabel di D1 dari folder server/db/migrations
bun run db:migrate:d1

# 6. Pindahkan data akun dan bank soal dari SQLite lokal ke D1.
#    SEED_ADMIN_PASSWORD mengganti sandi admin di file SQL, supaya sandi lama tidak ikut ke produksi.
SEED_ADMIN_PASSWORD='sandi-admin-yang-kuat' bun run db:export:d1
bunx wrangler d1 execute petualangan-kata-sd --remote --file .data/d1-data.sql --config dist/_worker.js/wrangler.json

# 7. Secret auth untuk produksi. Pakai nilai BARU, jangan nilai dari .env lokal.
bunx wrangler pages secret put NUXT_BETTER_AUTH_SECRET --project-name petualangan-kata-sd
```
Di PowerShell, langkah 6 ditulis `$env:SEED_ADMIN_PASSWORD='sandi-admin-yang-kuat'; bun run db:export:d1`.

### Setiap kali deploy
```bash
bun run deploy:pages
```
Kalau ada migrasi baru di `server/db/migrations/sqlite`, jalankan `bun run db:migrate:d1` setelah build dan sebelum deploy.

### Mencoba versi Cloudflare di komputer sendiri
```bash
bun run build:pages
bunx wrangler d1 migrations apply DB --local --config dist/_worker.js/wrangler.json
bunx wrangler d1 execute DB --local --file .data/d1-data.sql --config dist/_worker.js/wrangler.json
bun run preview:pages   # build ulang lalu buka http://localhost:8788
```
Perintah `wrangler d1` sengaja diberi `--config dist/_worker.js/wrangler.json`. Build membuat file pengalih `.wrangler/deploy/config.json`, tetapi `nuxt dev` menghapusnya, jadi tanpa `--config` perintah D1 bisa gagal mencari config.

### Catatan penting
- **Batas CPU paket gratis.** Paket gratis memberi sekitar 10 ms CPU per request. Login siswa (NISN + tanggal lahir) aman, tetapi login guru/admin, pendaftaran siswa, dan ganti sandi menjalankan hashing sandi (scrypt, sekitar 50 ms CPU) dan bisa gagal dengan *Error 1102*. Paket Workers Paid tidak punya masalah ini.
- **Sesi tidak ikut dipindah.** Semua pengguna perlu masuk ulang setelah pindah ke D1.
- **Secret dari `.env` ikut terbawa saat build lokal.** Secret Pages dari langkah 7 menimpanya saat runtime, jadi pastikan langkah itu sudah dijalankan.

---

## 📄 Lisensi
MIT License © 2026 Petualangan Kata SD.
