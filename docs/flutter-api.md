# Catatan API untuk Aplikasi Flutter

Panduan memakai API Petualangan Kata SD dari aplikasi Flutter. Spesifikasi lengkapnya selalu ada di `/_openapi.json`. Catatan ini merangkum hal yang tidak terlihat dari spesifikasi: alur login, cara menyusun grid, dan hal yang perlu diputuskan.

## Alamat

| Lingkungan | Base URL |
|---|---|
| Dev, dari emulator Android | `http://10.0.2.2:3000` |
| Dev, dari HP di jaringan yang sama | `http://<IP laptop>:3000` (jalankan `bun run dev --host`) |
| Produksi | domain hasil deploy |

Dokumentasi interaktif saat dev server jalan:

- `/_openapi.json`: spesifikasi OpenAPI 3.1, untuk generator client
- `/_scalar` dan `/_swagger`: bisa mencoba endpoint langsung dari browser

Ketiganya hanya aktif saat dev. Untuk membukanya di produksi, tambahkan `production: 'prerender'` di `nitro.openAPI` pada `nuxt.config.ts`.

## Login dan token

Versi web memakai cookie. Aplikasi Flutter memakai token Bearer dari sesi yang sama.

1. Login lewat salah satu endpoint di bawah. Responsnya berisi `token`, `expiresAt`, dan `user`.

   | Pengguna | Endpoint | Body |
   |---|---|---|
   | Siswa | `POST /api/auth/student-login` | `{ "nisn": "0012345674", "birthDate": "2014-11-25" }` |
   | Siswa baru | `POST /api/auth/student-register` | `{ "nisn", "name", "birthDate", "grade", "schoolName" }` |
   | Guru atau admin | `POST /api/auth/teacher-login` | `{ "email", "password" }` |

2. Simpan `token` di penyimpanan aman, misalnya `flutter_secure_storage`. Jangan di `SharedPreferences`.
3. Kirim di setiap permintaan yang butuh login:

   ```
   Authorization: Bearer <token>
   ```

4. Saat aplikasi dibuka, panggil `GET /api/user/me`. Kalau 200, token masih berlaku dan respons berisi XP serta bintang terbaru. Kalau 401, hapus token dan tampilkan layar login.
5. Logout: `POST /api/auth/sign-out` dengan header Bearer dan body `{}`. Setelah itu token langsung ditolak.

Token berlaku 7 hari (lihat `expiresAt`). Mengganti sandi atau peran dari halaman admin juga membuat token lama tidak berlaku.

## Mengambil soal

Soal bisa diambil tanpa login.

| Kebutuhan | Endpoint |
|---|---|
| Semua teka-teki | `GET /api/puzzles` |
| Per kelas atau mata pelajaran | `GET /api/puzzles?grade=4&subject=IPAS` |
| Satu teka-teki | `GET /api/puzzles/{id}` |

Setiap teka-teki membawa `questions`:

```json
{
  "id": "q_puz_k1_1_0",
  "clue": "Hewan berkaki empat bersuara meong",
  "answer": "KUCING",
  "direction": "across",
  "row": 0,
  "col": 2,
  "number": 1
}
```

### Menyusun grid

- `row` dan `col` adalah posisi huruf pertama, mulai dari 0.
- `direction`: `across` berarti mendatar (kolom bertambah), `down` berarti menurun (baris bertambah).
- Lewati soal dengan `direction: null`, karena soal itu belum diletakkan di grid.
- Ukuran grid tidak dikirim. Hitung sendiri:
  - lebar = nilai terbesar dari `col + panjang answer` untuk soal mendatar, dan `col + 1` untuk soal menurun
  - tinggi = nilai terbesar dari `row + panjang answer` untuk soal menurun, dan `row + 1` untuk soal mendatar
- Kotak yang tidak dilewati soal mana pun adalah kotak hitam.
- `number` ditampilkan kecil di pojok kiri atas kotak pertama setiap soal.

Contoh di Dart:

```dart
int width = 0, height = 0;
for (final q in puzzle.questions.where((q) => q.direction != null)) {
  final len = q.answer.length;
  final across = q.direction == 'across';
  width = max(width, q.col + (across ? len : 1));
  height = max(height, q.row + (across ? 1 : len));
}
```

## Mengirim hasil

Setelah semua kotak terisi benar, kirim jawaban siswa (bukan kunci jawabannya):

```
POST /api/progress/submit
Authorization: Bearer <token>

{
  "puzzleId": "puz_k1_1",
  "answers": { "q_puz_k1_1_0": "KUCING", "q_puz_k1_1_1": "AYAM" },
  "timeSeconds": 45
}
```

- Server memeriksa ulang setiap jawaban. Kalau ada yang kosong atau salah, responsnya 422.
- Bintang dihitung di server dari `timeSeconds`: di bawah 60 detik dapat 3, di bawah 180 detik dapat 2, selebihnya 1.
- `xpAdded` adalah XP yang benar-benar masuk ke akun. Mengulang teka-teki yang sama hanya menambah XP kalau bintangnya lebih banyak dari sebelumnya, jadi `xpAdded` bisa 0.
- Hanya akun siswa yang bisa mengirim. Guru dan admin mendapat 403.

Endpoint lain yang berguna:

- `GET /api/progress/student`: daftar teka-teki yang sudah diselesaikan siswa beserta bintangnya
- `GET /api/leaderboard?grade=4`: 30 siswa teratas

## Error

Semua error berbentuk:

```json
{ "statusCode": 401, "statusMessage": "Email atau kata sandi salah." }
```

`statusMessage` berbahasa Indonesia dan aman ditampilkan langsung ke pengguna.

| Kode | Arti | Yang perlu dilakukan aplikasi |
|---|---|---|
| 400 | Input kurang atau tidak valid | tampilkan `statusMessage` di form |
| 401 | Belum login atau token tidak berlaku | hapus token, kembali ke layar login |
| 403 | Peran akun tidak diizinkan | sembunyikan fitur itu untuk peran tersebut |
| 404 | Data tidak ditemukan | segarkan daftar |
| 409 | NISN sudah terdaftar (saat daftar) | arahkan ke login |
| 422 | Jawaban belum benar semua (saat submit) | biarkan siswa memeriksa lagi |

## Generate client Dart

Contoh dengan openapi-generator:

```bash
openapi-generator-cli generate -i http://localhost:3000/_openapi.json -g dart-dio -o lib/api
```

Langkah ini belum dicoba. Spesifikasinya memakai OpenAPI 3.1 (field nullable ditulis `type: ['string', 'null']`), dan dukungan 3.1 di sebagian generator Dart belum lengkap. Kalau hasilnya bermasalah, menulis model dan client sendiri dengan `dio` atau `http` juga cukup, karena endpoint-nya hanya 16.

## Belum diputuskan

- **Kunci jawaban ikut terkirim.** Field `answer` ada di respons `/api/puzzles`, supaya pemeriksaan per kotak bisa dilakukan di HP, termasuk saat offline. Siswa yang paham teknis bisa membacanya dari lalu lintas data. XP tetap aman karena server memeriksa ulang. Kalau ingin ditutup, API bisa mengirim panjang jawaban saja dan pemeriksaan dilakukan di server, dengan konsekuensi aplikasi harus online saat bermain.
- **CORS** belum diatur. Aplikasi Android dan iOS tidak membutuhkannya. Perlu diatur kalau nanti ada Flutter Web di domain lain.
- **Batas percobaan login** belum ada. Login siswa memakai NISN dan tanggal lahir, yang bisa diketahui teman sekelas.
