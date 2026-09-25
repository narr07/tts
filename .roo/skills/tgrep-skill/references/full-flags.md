# Referensi lengkap flag CLI tgrep

Dasar: kompatibel dengan `ripgrep` (`rg`). Flag yang tidak dikenal ditolak
dengan error, bukan diabaikan diam-diam. Baca file ini kalau flag yang
dibutuhkan tidak ada di daftar "aturan praktis" pada SKILL.md utama.

## Flag umum

| Flag | Deskripsi |
|---|---|
| `-i, --ignore-case` | Pencarian tidak peka huruf besar/kecil |
| `-s, --case-sensitive` | Paksa peka huruf besar/kecil (override `-S`) |
| `-S, --smart-case` | Tidak peka huruf besar/kecil jika pola semuanya huruf kecil |
| `-F, --fixed-strings` | Perlakukan pola sebagai string literal |
| `-w, --word-regexp` | Hanya cocokkan kata utuh |
| `-v, --invert-match` | Tampilkan baris yang TIDAK cocok |
| `-o, --only-matching` | Cetak hanya bagian yang cocok |
| `-e, --regexp <PAT>` | Pola tambahan (bisa diulang untuk OR) |
| `-f, --file <FILE>` | Baca pola dari file (satu per baris) |
| `-U, --multiline` | Aktifkan pencocokan lintas baris (`.` tetap tidak mencakup `\n`) |
| `--multiline-dotall` | Buat `.` mencocokkan `\n` juga; otomatis mengaktifkan `-U` |
| `-n, --line-number` | Tampilkan nomor baris (default: aktif kalau stdout adalah terminal) |
| `-N, --no-line-number` | Sembunyikan nomor baris |
| `-c, --count` | Cetak jumlah match per file |
| `-l, --files-with-matches` | Cetak hanya nama file |
| `--files-without-match` | File yang TIDAK cocok |
| `-q, --quiet` | Sembunyikan output; hanya exit code |
| `-m, --max-count <N>` | Batasi match per file |
| `-g, --glob <GLOB>` | Filter file dengan pola glob, peka huruf besar/kecil (bisa diulang) |
| `--iglob <GLOB>` | Filter glob tidak peka huruf besar/kecil (bisa diulang) |
| `--glob-case-insensitive` | Perlakukan semua `-g` sebagai tidak peka huruf besar/kecil |
| `-t, --type <TYPE>` | Filter berdasarkan tipe file (`rust`, `py`, `js`, …; bisa diulang) |
| `-T, --type-not <TYPE>` | Kecualikan sebuah tipe file (bisa diulang) |
| `--type-add <SPEC>` | Tambah/perluas tipe, mis. `--type-add 'web:*.html'` |
| `--type-clear <TYPE>` | Hapus definisi sebuah tipe |
| `--type-list` | Cetak semua tipe file yang didukung |
| `--files` | Daftar file yang akan dicari |
| `-A, --after-context <N>` | Baris konteks setelah match |
| `-B, --before-context <N>` | Baris konteks sebelum match |
| `-C, --context <N>` | Baris konteks sebelum & sesudah |
| `--heading` / `--no-heading` | Output berkelompok vs rata |
| `-H, --with-filename` | Tampilkan nama file (default: aktif kecuali satu file disebut langsung) |
| `-I, --no-filename` | Sembunyikan nama file di output |
| `--json` | Stream JSON kompatibel-ripgrep (satu objek per baris) |
| `--vimgrep` | Format `file:line:col:content` kompatibel Vim, satu baris per match |
| `--color auto/always/never` | Kontrol mode warna |
| `-0, --null` | Pemisah nama file byte NUL (untuk `xargs`) |
| `--trim` | Buang spasi di awal/akhir |
| `-., --hidden` | Sertakan file & folder tersembunyi |
| `--no-ignore` | Jangan patuhi `.gitignore` atau `p4ignore.ini` |
| `-a, --text` | Cari file biner seolah teks |
| `--binary` | Cari file biner, laporkan sebagai catatan bukan isinya |
| `-u, --unrestricted` | `-u` = no-ignore, `-uu` = +hidden, `-uuu` = +binary |
| `--max-filesize <SIZE>` | Lewati file lebih besar dari `SIZE` (`K`/`M`/`G`); default 64M |
| `--no-max-filesize` | Tanpa batas ukuran, seperti ripgrep |
| `-L, --follow` | Ikuti symbolic link. **Diam-diam diabaikan saat ada index/server** -- lihat SKILL.md, pasangkan dengan `--no-index` kalau benar-benar dibutuhkan |
| `--no-messages` | Sembunyikan pesan error path yang tak terbaca/hilang |
| `--no-index` | Lewati index, grep semua file langsung |
| `--exclude <DIR>` | Kecualikan folder dari index (bisa diulang); hanya untuk `index`/`serve` |
| `--stats` | Cetak rencana query & statistik kandidat |
| `--index-path <DIR>` | Lokasi folder index kustom |

## Pencocokan pola

| Flag | Deskripsi |
|---|---|
| `-x, --line-regexp` | Pola harus cocok satu baris penuh (mengalahkan `-w`) |
| `-P, --pcre2` | Pakai mesin backtracking (lookaround, backreference) |
| `--engine <auto\|default\|pcre2>` | Pilih mesin regex secara eksplisit |
| `--pcre2-version` | Cetak versi mesin backtracking lalu keluar |
| `--no-unicode` | Nonaktifkan character class sadar-Unicode |
| `--regex-size-limit <SIZE>` | Batasi ukuran regex terkompilasi |
| `--dfa-size-limit <SIZE>` | Batasi ukuran cache DFA regex |
| `-r, --replace <TEXT>` | Ganti setiap match; `$1`/`${name}` untuk capture group |
| `--passthru` | Cetak semua baris, cocok atau tidak |
| `--stop-on-nonmatch` | Hentikan pencarian sebuah file di baris pertama yang tidak cocok |

## Format output

| Flag | Deskripsi |
|---|---|
| `--column` / `--no-column` | Tampilkan kolom (1-based) dari match pertama |
| `-b, --byte-offset` | Tampilkan offset byte dari baris (atau match, dengan `-o`) |
| `-M, --max-columns <N>` | Lewati baris lebih panjang dari `N` byte |
| `--max-columns-preview` | Tampilkan preview terpotong alih-alih dilewati |
| `--count-matches` | Hitung jumlah match, bukan baris yang cocok |
| `--include-zero` | Dengan `-c`, tampilkan juga file dengan jumlah `0` |
| `-p, --pretty` | Alias untuk `--color always --heading -n` |
| `--context-separator <SEP>` | Pemisah antar grup konteks (default `--`) |
| `--no-context-separator` | Tidak ada pemisah antar grup konteks |
| `--field-match-separator <SEP>` | Pemisah antar field match (default `:`) |
| `--field-context-separator <SEP>` | Pemisah antar field konteks (default `-`) |
| `--path-separator <SEP>` | Tulis ulang pemisah pada path yang dicetak |
| `--sort <KEY>` / `--sortr <KEY>` | Urutkan berdasarkan `path`/`modified`/`accessed`/`created`/`none` |
| `--sort-files` | Singkatan untuk `--sort path` |
| `--line-buffered` / `--block-buffered` | Paksa stdout line-buffered atau block-buffered |

## Encoding

| Flag | Deskripsi |
|---|---|
| `-E, --encoding <LABEL>` | Decode file sebagai `LABEL` (mis. `utf-16le`, `latin1`, `sjis`), atau `none` untuk byte mentah |
| `--no-encoding` | Kembalikan ke auto-deteksi BOM |

## Penelusuran file

| Flag | Deskripsi |
|---|---|
| `--max-depth <N>` | Batasi kedalaman rekursi folder |
| `--one-file-system` | Jangan lintasi batas filesystem. **Diam-diam diabaikan saat ada index/server** -- lihat SKILL.md |
| `--ignore-file <FILE>` | Baca aturan ignore tambahan dari `FILE` (bisa diulang). **Diam-diam diabaikan saat ada index/server** -- lihat SKILL.md |
| `--ignore-file-case-insensitive` | Cocokkan aturan ignore tanpa peka huruf besar/kecil |
| `--no-ignore-dot` | Abaikan file `.ignore` |
| `--no-ignore-exclude` | Abaikan `.git/info/exclude` |
| `--no-ignore-files` | Abaikan argumen `--ignore-file` |
| `--no-ignore-global` | Abaikan gitignore global |
| `--no-ignore-parent` | Abaikan aturan dari folder induk |
| `--no-ignore-vcs` | Abaikan file `.gitignore` |
| `--no-ignore-messages` | Sembunyikan error file ignore yang salah format |
| `--no-require-git` | Terapkan aturan git-ignore di luar repo git |
| `-j, --threads <N>` | Jumlah thread pencarian |

## Diterima demi kompatibilitas (tidak berefek)

`--mmap`/`--no-mmap`, `--crlf`/`--no-crlf`, `--no-config`, `--colors <SPEC>` —
diterima dan diabaikan supaya command line ripgrep tetap jalan tanpa error.
`--debug`/`--trace` otomatis mengaktifkan `--stats`.

`-z/--search-zip` **tidak** didukung — keluar dengan kode `2`.

## Exit code

| Kode | Arti |
|---|---|
| `0` | Ada minimal satu match |
| `1` | Tidak ada match |
| `2` | Terjadi error (mis. path tidak terbaca) |

Match + error → `2`, kecuali `-q` dipakai → `0`.

## Output JSON (`--json`)

Satu objek JSON per baris, format sama seperti `rg --json`. Tipe record:
`begin`, `match`, `context`, `end`, `summary`.

```
tgrep --json -F -- "fn main" src/main.rs
```

```json
{"data":{"path":{"text":"src/main.rs"}},"type":"begin"}
{"data":{"absolute_offset":400,"line_number":11,"lines":{"text":"fn main() {\n"},"path":{"text":"src/main.rs"},"submatches":[{"end":7,"match":{"text":"fn main"},"start":0}]},"type":"match"}
{"data":{"binary_offset":null,"path":{"text":"src/main.rs"},"stats":{"bytes_printed":260,"bytes_searched":1775,"elapsed":{"human":"0.000010s","nanos":9709,"secs":0},"matched_lines":1,"matches":1,"searches":1,"searches_with_match":1}},"type":"end"}
{"data":{"elapsed_total":{"human":"0.000470s","nanos":469542,"secs":0},"stats":{"bytes_printed":515,"bytes_searched":1775,"elapsed":{"human":"0.000470s","nanos":469542,"secs":0},"matched_lines":1,"matches":1,"searches":1,"searches_with_match":1}},"type":"summary"}
```

Beda dengan ripgrep: pada baris yang bukan UTF-8 valid, ripgrep mengeluarkan
`lines.bytes` dalam base64, sedangkan tgrep selalu mengeluarkan `lines.text`
dengan setiap byte rusak diganti `U+FFFD`.

Sumber lengkap: https://github.com/microsoft/tgrep (README.md & AGENTS.md).
