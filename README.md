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
  - PIN / Sandi: `admin123`
- **Guru Pembimbing:**
  - Email: `guru.budi@sdn01.sch.id`
  - PIN / Sandi: `guru123`
- **Siswa (Contoh Kelas 4 SD):**
  - NISN: `0012345674`
  - Tanggal Lahir: `2014-11-25`

---

## 📄 Lisensi
MIT License © 2026 Petualangan Kata SD.
