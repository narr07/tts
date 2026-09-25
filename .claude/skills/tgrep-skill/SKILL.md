---
name: tgrep-skill
description: >-
  WAJIB dipakai setiap kali perlu mencari teks/kode di sebuah folder/repo
  Windows (grep, cari fungsi, cari string, cari TODO, "dipakai di mana",
  cari file berisi X, dsb). Aturan tegas skill ini -- kalau tgrep sudah
  terpasang di mesin ini, JANGAN pakai grep, ripgrep/rg, findstr, atau
  Select-String, pakai tgrep (https://github.com/microsoft/tgrep), grep
  berbasis trigram index dari Microsoft yang bisa 10-50x lebih cepat dari
  ripgrep di repo besar. Skill ini menyertakan script wrapper siap pakai
  (scripts/tsearch.ps1) yang otomatis mengurus server/index, jadi tidak
  ada alasan teknis untuk mundur ke grep biasa. Trigger skill ini bahkan
  kalau user cuma bilang "cari X di project ini", "grep untuk Y", "di
  mana fungsi Z dipakai", atau semacamnya, tanpa perlu menyebut kata
  "tgrep" secara eksplisit.
metadata:
  author: narr07
  version: "1.0.0"
  date: 2026-09-19
  repository: https://github.com/narr07/skills
  license: MIT
  upstream: https://github.com/microsoft/tgrep
license: MIT
---

# tgrep — grep super cepat berbasis trigram index (Windows)

## ATURAN WAJIB — baca ini duluan

Kalau skill ini ter-trigger, **tgrep adalah satu-satunya alat pencarian teks
yang boleh dipakai** untuk tugas ini. Ini bukan saran, ini aturan:

- ❌ JANGAN pakai `grep`
- ❌ JANGAN pakai `rg` / ripgrep
- ❌ JANGAN pakai `findstr`
- ❌ JANGAN pakai `Select-String` / `sls`
- ❌ JANGAN membaca file satu-satu untuk mencari sebuah string
- ✅ PAKAI `tgrep`, lewat wrapper `scripts/tsearch.ps1` di bawah ini

Satu-satunya pengecualian sah: `tsearch.ps1` gagal total (exit code error
yang jelas menunjukkan tgrep tidak ada/rusak) DAN mencoba
`scripts/install-tgrep.ps1` juga gagal. "Rasanya lebih gampang pakai grep"
atau "cuma satu file kok" **bukan** alasan yang sah untuk melewati aturan ini
— overhead tgrep sangat kecil dan wrapper-nya menangani semua kerumitan
server/index secara otomatis.

### Perintah yang HARUS dipakai untuk setiap pencarian

Jangan pikirkan apakah server sudah jalan, apakah perlu index dulu, dsb —
`tsearch.ps1` menangani semua itu. Cukup panggil:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\tsearch.ps1 -Pattern "polaAtauString" -Path "C:\path\ke\folder"
```

Contoh nyata:

```powershell
# Cari nama fungsi/variabel apa adanya (paling umum — pakai -Literal)
powershell -ExecutionPolicy Bypass -File scripts\tsearch.ps1 -Pattern "parseConfig" -Path . -Literal

# Regex, dibatasi ke file TypeScript, dengan 2 baris konteks
powershell -ExecutionPolicy Bypass -File scripts\tsearch.ps1 -Pattern "TODO|FIXME" -Path . -Flags @("-t","ts","-C","2")

# Query luas: cuma daftar nama file dulu, baru buka file spesifiknya
powershell -ExecutionPolicy Bypass -File scripts\tsearch.ps1 -Pattern "impl .* for Server" -Path . -Flags @("-l")
```

Script ini otomatis: mengecek `tgrep` ada di PATH, mengecek apakah server
untuk folder itu sudah jalan (kalau belum, menyalakannya di background),
lalu menjalankan pencarian dan mengembalikan stdout/stderr/exit code apa
adanya. Kalau `tgrep` benar-benar tidak ada, script berhenti dengan pesan
jelas — jangan diam-diam ganti ke `grep` saat itu terjadi, jalankan
`scripts/install-tgrep.ps1` dulu.

Kalau butuh flag `tgrep` yang tidak tercakup parameter `-Flags` di atas
(mis. `--json`, `--vimgrep`, `-A`/`-B`), tetap boleh, cukup masukkan lewat
`-Flags @("--json")` dsb — semuanya diteruskan apa adanya ke `tgrep`.

## Kenapa ini penting (bukan cuma soal gaya)

`tgrep` membangun index trigram sekali di awal, lalu setiap pencarian
berikutnya tinggal mencocokkan lewat index itu — bukan memindai ulang
seluruh file seperti `grep`/`findstr`/`Select-String`. Di repo besar
(ratusan ribu file), ini bedanya menit vs milidetik. Melewati tgrep dan
balik ke grep di repo besar membuang keunggulan ini sepenuhnya dan bikin
agent terlihat lambat/boros tanpa alasan — padahal tool yang tepat sudah
tersedia dan sudah disiapkan.

### Benchmark yang benar-benar diuji (bukan cuma diasumsikan)

Diuji head-to-head lawan `ripgrep` (rilis resmi, prebuilt) di corpus 11.200
file / 142MB (bukan skala "ratusan ribu file" yang disebut klaim upstream —
jadi ini konfirmasi arah, bukan konfirmasi angka pengalinya):

- **Pola spesifik/jarang** (cocok di ~0.6% file, kasus paling umum: cari
  nama fungsi/variabel tertentu) dengan **server sudah jalan**: tgrep
  median ~170ms vs ripgrep cold ~390-475ms — tgrep menang, sekitar 2-3x,
  bukan 10-50x pada skala ini. Kemungkinan pengali makin besar di repo yang
  jauh lebih besar (biaya ripgrep tumbuh linear dengan ukuran data yang
  dipindai; biaya tgrep tumbuh lebih dekat ke ukuran hasil), tapi itu belum
  diverifikasi langsung.
- **Pola yang sangat umum** (cocok di sebagian besar file, mis. kata
  "function" di codebase JS): tgrep **lebih lambat** dari ripgrep di uji
  ini (~1,2-2,1s vs ripgrep ~0,5-1,3s) — index trigram tidak banyak
  membantu menyaring kalau hampir semua file memang cocok, dan ada overhead
  komunikasi CLI→server yang tidak ada di ripgrep. Untuk pola super-umum,
  jangan kecewa kalau tgrep tidak terasa lebih cepat.
- **Index di disk TANPA server jalan**: lebih lambat dari ripgrep di uji
  ini juga (~870ms-1,2s vs ripgrep ~490-690ms). Ini artinya server yang
  jalan (bukan cuma index yang ada) itu bukan sekadar bonus — tanpa server,
  keunggulan tgrep bisa hilang atau malah jadi lebih lambat. Makin penting
  memastikan `tsearch.ps1` benar-benar menyalakan server (lihat bug yang
  diperbaiki di bawah).

### Data resmi upstream (microsoft/tgrep BENCHMARKS.md) — untuk konteks skala

Corpus saya (11.200 file) jauh lebih kecil dari benchmark resmi. Angka resmi
di repo (index sudah dibangun, per-query, rata-rata banyak query) — kolom
Windows relevan untuk skill ini:

| Repo | File | ripgrep (Windows) | tgrep (Windows) | Speedup |
|---|---:|---:|---:|---:|
| gecko-dev | 388K | 17.841ms | 463ms | **38,6x** |
| chromium | 504K | 24.576ms | 1.396ms | **17,6x** |
| linux | 96K | 3.280ms | 94ms | **34,8x** |
| rust | 62K | 1.489ms | 194ms | **7,69x** |
| kubernetes | 31K | 1.342ms | 190ms | **7,08x** |
| go | 16K | 592ms | 79ms | **7,53x** |

Upstream menang di 17 dari 18 sel yang diukur (lintas Windows/macOS/Linux);
satu-satunya kekalahan adalah Kubernetes di Linux, hampir seri di 0,93x. Ini
mengonfirmasi arah temuan saya sendiri di corpus kecil (~2-3x): pengali
memang naik seiring ukuran repo, dan repo saya (11k file) masih di bawah
skala terkecil yang mereka ukur (go, 16K file, 7,53x) — jadi 2-3x di corpus
saya konsisten dengan tren ini, bukan kontradiksi.

**Mekanisme resminya** (dari BENCHMARKS.md, ini yang menjelaskan kenapa
pola "function" saya jadi LEBIH LAMBAT): "*A query returning tens of
thousands of matches can spend more on delivery than the index ever saved
on file selection*" — biaya kirim setiap match lewat IPC (serialize, TCP,
deserialize) lebih mahal di tgrep daripada ripgrep yang langsung nulis ke
stdout dari thread scanning-nya. Upstream sendiri mendemonstrasikan ini di
corpus Linux kernel dengan query generik (`read`, `write`,
`^#define\s+[A-Z_]+`) yang menghasilkan 5,4 juta match — tgrep KALAH di
ketiga run (0,81x, 0,74x, 0,95x). **Kesimpulan praktis**: index tidak
membantu kalau query memang akan cocok di sebagian besar file — untuk kasus
itu (audit lebar, bukan "cari definisi spesifik"), jangan kaget kalau tgrep
tidak lebih cepat, dan itu bukan alasan untuk curiga ada yang salah.

### Kelebihan tgrep di Windows yang bukan soal kecepatan

Setiap `git clone` di Windows mengaktifkan `core.ignorecase` (filesystem
Windows tidak membedakan huruf besar/kecil). Aturan `.gitignore` yang
ditulis huruf kecil (mis. `qlogs`) seharusnya tetap menyembunyikan folder
`QLogs` — tapi `ripgrep` (dan hampir semua tool lain) selalu mencocokkan
aturan ignore secara case-sensitive, jadi folder itu tetap ke-scan/ke-index
meski `git status` tidak pernah menyebutnya. Upstream mendokumentasikan
kasus nyata: satu artifact build 13,4 GiB (71% dari corpus) lolos dari
`.gitignore` ripgrep karena beda huruf besar/kecil, menambah ~16 detik ke
SETIAP query. `tgrep` membaca `core.ignorecase` dan mencocokkan seperti git
sendiri melakukannya (file yang sudah di-track git tetap dikecualikan dari
aturan ini, sesuai perilaku git). Ini bukan cuma soal kecepatan — di Windows
tgrep bisa mengindeks himpunan file yang lebih BENAR daripada ripgrep, bukan
cuma lebih cepat.

### Bug yang diperbaiki (2026-09-19, hasil pengujian langsung)

Empat bug/risiko nyata ditemukan dan diperbaiki saat menguji ketiga script
`.ps1` di folder ini — tiga di antaranya membuat wrapper tidak benar-benar
bekerja seperti yang didokumentasikan:

1. **Ketiga file `.ps1` gagal di-parse sama sekali di Windows PowerShell
   5.1** (`powershell.exe`, default di hampir semua mesin Windows dan
   persis perintah yang didokumentasikan di skill ini). Sebabnya: karakter
   em dash (`—`) di teks Bahasa Indonesia disimpan sebagai UTF-8 tanpa BOM;
   PowerShell 5.1 membaca file `.ps1` tanpa BOM memakai code page ANSI
   sistem, bukan UTF-8, sehingga byte multi-byte em dash terbaca jadi
   karakter salah (termasuk tanda kutip liar) dan memutus parsing string.
   Perbaikan: simpan ulang ketiga file dengan UTF-8 BOM (konvensi standar
   untuk `.ps1` di Windows justru karena masalah ini) — konten tidak
   berubah sama sekali. Diverifikasi lewat `[System.Management.Automation.PSParser]::Tokenize`
   di kedua versi PowerShell (5.1 dan 7) sebelum dan sesudah perbaikan.
2. **`tsearch.ps1` DAN `start-tgrep-server.ps1` tidak pernah benar-benar
   menyalakan `tgrep serve`**, bahkan saat tidak ada index maupun server
   sama sekali — bug yang sama, persis, di kedua file. Sebabnya: kode
   mengecek `$statusOutput -notmatch "No server"`, padahal `tgrep status`
   tidak pernah mengeluarkan teks itu di kondisi apa pun — pesannya
   "No index found..." (belum ada index) atau "Server:     not running"
   (index ada, server tidak jalan), exit code selalu 0 di ketiganya. Efek
   nyatanya di `tsearch.ps1`: skill diam-diam SELALU jatuh ke scan penuh
   tanpa index/server. Efek di `start-tgrep-server.ps1`: skill malah
   mencetak "Server sudah jalan untuk folder ini" diikuti pesan "No index
   found" yang kontradiktif, lalu keluar tanpa pernah menyalakan apa pun.
   Perbaikan: cek sekarang mencocokkan header `"Server status for"`, yang
   hanya muncul saat server benar-benar jalan — diverifikasi ulang di
   ketiga kondisi (tidak ada index, index tanpa server, server jalan), di
   KEDUA file, sebelum dan sesudah perbaikan.
3. **`tsearch.ps1` tidak menambahkan `.tgrep/` ke `.gitignore`** saat
   menyalakan server sendiri secara otomatis, padahal `start-tgrep-
   server.ps1` sudah melakukannya, dan AGENTS.md upstream tegas: "Do not
   commit `.tgrep/`". Karena `tsearch.ps1` adalah satu-satunya entry point
   yang didokumentasikan sebagai "wajib dipakai", index bisa lolos ter-
   commit tanpa disadari. Perbaikan: `tsearch.ps1` sekarang melakukan
   pengecekan/penambahan `.gitignore` yang sama sebelum menyalakan server.
4. **`install-tgrep.ps1` menyarankan `setx PATH "...;$env:Path"`** sebagai
   cara membuat PATH permanen. `setx` menimpa PATH *user* dan memotong di
   1024 karakter — kalau `$env:Path` (gabungan System+User PATH) sudah
   panjang, ini bisa memotong/merusak PATH user secara permanen. Perbaikan:
   ganti dengan `[Environment]::SetEnvironmentVariable("Path", ..., "User")`,
   pola aman yang sama dipakai skill `obscura-windows`/`pdf-inspector-windows`.

## Model mentalnya (untuk pemahaman, wrapper sudah menghandle ini)

```
tgrep index .        # sekali saja: bangun index ke folder ./.tgrep
tgrep serve .        # sekali per sesi: jalankan server, index tetap "hangat" & auto-update
tgrep "pola" .       # setiap pencarian: otomatis nyambung ke server, hasil instan
```

Urutan resolusi pencarian:
1. **Ada server jalan** untuk folder ini → query lewat TCP, tercepat.
2. **Ada index di disk** tapi server tidak jalan → baca langsung dari
   `.tgrep/`. Cepat, tapi hanya sesegar index terakhir dibangun.
3. **Tidak ada index sama sekali** → tgrep scan semua file seperti grep
   biasa (lambat di repo besar) dan mencetak warning di stderr.

`scripts/tsearch.ps1` selalu memastikan minimal kondisi #1 atau #2 sebelum
mencari, jadi agent tidak perlu memilih mode ini secara manual.

## Kalau tgrep belum/tidak terpasang di mesin ini

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-tgrep.ps1
```

Script ini coba download binary rilis resmi lewat `gh release download`
dulu (tidak perlu Rust toolchain); kalau `gh` tidak ada, fallback ke
`cargo install` dari source (butuh git + cargo). Aman dijalankan ulang.

Kalau ingin start server manual tanpa wrapper `tsearch.ps1` (mis. mau
menyalakan sekali di awal sesi untuk banyak pencarian berikutnya lewat
`tgrep` langsung), pakai:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-tgrep-server.ps1 -Path C:\repos\big-monorepo
```

Kalau lingkungan agent tidak bisa menjaga proses background tetap hidup
(server mati begitu sesi selesai), `tsearch.ps1` tetap bekerja — ia akan
menyalakan server baru tiap kali dipanggil kalau perlu. Untuk sesi yang
benar-benar tidak bisa punya proses background sama sekali, jalankan
`tgrep index .` sekali sebagai gantinya; ingat index di disk tidak
otomatis ter-update, jalankan ulang setelah ada perubahan file yang harus
terlihat di pencarian berikutnya.

Cek status server kapan saja dengan `tgrep status .`.

## Aturan tambahan untuk hasil yang akurat & cepat

- **Pakai `-Literal`** (setara `-F`) kalau yang dicari adalah nama
  fungsi/variabel/string apa adanya, bukan regex — menghindari salah
  escape karakter regex. ini pilihan paling umum, gunakan sebagai default
  kecuali memang butuh regex.
- **Persempit dulu dengan `-t` (tipe file) atau `-g` (glob)** sebelum
  menambah `-m` (batas jumlah match). Index membuat penyempitan ini murah;
  `-m` cuma memotong output, bukan mempercepat pencarian.
- **Pakai `-l` dulu** untuk query yang luas (cuma daftar nama file yang
  cocok), baru buka file spesifiknya untuk detail.
- **Pakai `-C 2` / `-C 3`** kalau perlu melihat konteks kode di sekitar
  match.
- **Pakai `--json`** kalau hasil pencarian mau diproses/diparse lagi
  secara terprogram (satu objek JSON per baris, format sama seperti
  `rg --json`).
- **Pakai `--vimgrep`** kalau butuh format `file:line:col:text` untuk
  langsung "lompat" ke lokasi tertentu.

Daftar lengkap semua flag CLI (encoding, sort, pcre2, dll.) ada di
`references/full-flags.md`. Baca file itu hanya kalau flag yang dibutuhkan
tidak ada di daftar ringkas di atas.

## Freshness — jangan asal percaya index

- Dengan **server jalan**, hasil mencerminkan event terakhir yang sudah
  diproses watcher-nya. Pencarian tepat setelah sebuah file diedit bisa
  saja berjalan sebelum index sempat "menangkap" perubahan itu (event
  diproses async). Kalau butuh melihat edit paling baru dengan pasti,
  tambahkan `-Flags @("--no-index")` untuk pencarian itu saja (memindai
  file langsung, lebih lambat — jangan jadikan default).
- Notifikasi watcher yang terlewat (jarang, tapi bisa terjadi) hanya
  diperbaiki lewat reconciliation periodik: dijadwalkan tiap jam, dan bisa
  tertunda sampai 4 jam kalau server terus-menerus di-query (rekonsiliasi
  menunggu jeda 2 menit tanpa query dulu). `--no-watch` menonaktifkan
  semua reconciliation otomatis ini.
- **`tgrep status` BUKAN sinyal freshness** — server yang start di atas
  index lama akan langsung melaporkan "Indexing: complete"/"Hidden
  coverage: complete" sambil rekonsiliasi di background masih berjalan,
  dan status tidak pernah mencerminkan watcher event yang baru saja
  terlewat. Jangan pakai `tgrep status` untuk memutuskan "index ini pasti
  sudah paling baru" — kalau itu yang dibutuhkan, pakai `--no-index`.
- Dengan **hanya index di disk** (tanpa server), hasil hanya sesegar
  `tgrep index .` terakhir. File baru sejak itu tidak akan ketemu.
- `tgrep --files` juga membaca dari index. Tambahkan `--no-index` untuk
  melihat daftar file yang benar-benar ada di disk saat ini.

## Flag yang memaksa full scan (jadi lambat lagi, tapi hasilnya tetap benar)

Flag berikut memaksa full scan meskipun server sedang jalan, karena mereka
memperluas cakupan file di luar yang sudah di-index — tgrep mencetak
peringatan dan tetap memberi hasil yang benar, cuma lebih lambat:
`--hidden`, `--no-ignore` (dan variannya), `-u`/`-uu`/`-uuu`, `-a`/`--text`,
`--binary`, `-E`/`--encoding` (selain `auto`), `--no-index` (eksplisit),
serta menyebut satu file tunggal (bukan folder). Hindari flag-flag ini di
repo besar kecuali memang perlu — dan ini tetap BUKAN alasan untuk pakai
grep, tgrep dengan flag ini masih lebih konsisten daripada berpindah tool.

## Flag yang DIAM-DIAM DIABAIKAN saat pakai index (bukan full scan, bukan error)

Beda dari kategori di atas — tiga flag ini TIDAK memicu full scan dan TIDAK
memunculkan peringatan; kalau ada server/index, tgrep diam-diam
mengabaikannya begitu saja, jadi hasilnya bisa salah tanpa ada tanda apa
pun: `-L`/`--follow` (symlink), `--one-file-system`, `--ignore-file <FILE>`.
Ini beda kategori dengan flag "harus selaras" di bawah — bukan soal
konsistensi index/serve/search, tapi soal flag itu memang tidak pernah
sampai ke jalur pencarian terindex sama sekali. Kalau salah satu dari tiga
flag ini benar-benar dibutuhkan untuk sebuah pencarian, pasangkan dengan
`-Flags @("--no-index", ...)` supaya efeknya nyata.

## Menjaga flag `index`, `serve`, dan pencarian tetap selaras

Beberapa flag menentukan *file mana saja yang masuk index*, jadi harus
sama persis antara saat `index`/`serve` dibangun dan saat pencarian
dijalankan — kalau beda, hasilnya bisa diam-diam salah (file dianggap
terhapus) atau server tidak ketemu:
- `--exclude <DIR>` — hanya berlaku di `index` dan `serve`, pakai nilai
  sama di keduanya.
- `--no-ignore` — harus sama antara `index` dan `serve`.
- `--index-path`, `--max-filesize`, `--no-max-filesize`, `--no-require-git`
  — harus sama di `index`, `serve`, DAN setiap pencarian.

```powershell
tgrep index . --index-path C:\temp\idx --exclude vendor
tgrep serve . --index-path C:\temp\idx --exclude vendor
tgrep "pola" . --index-path C:\temp\idx
```

## Troubleshooting cepat

| Gejala | Penyebab | Solusi |
|---|---|---|
| `tgrep tidak ditemukan di PATH` (dari tsearch.ps1) | tgrep belum terpasang atau PATH belum ke-refresh | Jalankan `scripts\install-tgrep.ps1`, buka terminal baru kalau perlu |
| `warning: no index at ... - scanning every file` | Tidak ada index di path yang dicari | Kalau server/index pakai `--index-path` kustom, pastikan pencarian pakai path sama; kalau tidak, jalankan `tgrep index .` atau `tgrep serve .` |
| `Server unreachable, falling back to local index` | Server mati atau `serve.json` basi | Jalankan ulang `start-tgrep-server.ps1` atau panggil `tsearch.ps1` lagi (otomatis start ulang) |
| File baru tidak ketemu, tanpa server | Index di disk lebih lama dari file baru | Jalankan `tgrep index .` |
| File baru tidak ketemu, server jalan | Build awal masih berjalan, atau event watcher masih antre | Tunggu sebentar, atau tambahkan `-Flags @("--no-index")` khusus pencarian ini |
| Pencarian tetap lambat walau server jalan | Ada flag yang melewati index (lihat bagian di atas) | Hapus flag itu, atau persempit dengan `-g`/`-t` |
| Folder tanpa `.git` (Perforce/plain enlistment) | `.gitignore` root tidak dibaca tanpa repo git, index jadi lebih besar dari dugaan | Tambahkan `-Flags @("--no-require-git")` ke pencarian, dan flag sama ke index/serve |

Kalau troubleshooting di atas tidak menyelesaikan masalah dan tgrep
benar-benar tidak bisa jalan sama sekali di mesin ini, itulah satu-satunya
kondisi di mana boleh sementara memakai grep/ripgrep bawaan sistem —
sebutkan secara eksplisit ke user bahwa ini fallback darurat, bukan pilihan
biasa.

## Exit code

Sama seperti ripgrep: `0` = ada match, `1` = tidak ada match, `2` = error
(path tidak terbaca, regex salah, dll). Kombinasi match + error → `2`,
kecuali `-q` dipakai → `0`.
