<!-- graft:start -->

## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->

<!-- antislop:start -->

## antislop

For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:

- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`
  Before starting, ask the user when antislop applies: during the work, or after it is done.

<!-- antislop:end -->

## Panduan & Standar Komponen Nuxt UI

### 1. Aturan Umum Komponen
- **Utamakan Komponen Nuxt UI**: Selalu gunakan komponen Nuxt UI (`UButton`, `UCard`, `UBadge`, `UIcon`, `UAvatar`, `UEmpty`, `UModal`, `UInput`, `UAlert`, `UTable`, dll.) daripada elemen HTML mentah (`<button>`, `<div>` dengan border/shadow manual, dll.) kecuali untuk layout struktural sederhana (`div`, `section`).
- **Cek Komponen Bawaan Sebelum Membuat Baru**: Sebelum membuat UI baru, cek dulu apakah sudah ada komponen Nuxt UI yang cocok (misal: butuh *"state kosong"* pakai `UEmpty`, bukan bikin `div` kustom; butuh *"badge status"* pakai `UBadge`, bukan `<span>` dengan warna manual).
- **Hindari Hardcode Warna Literal**: Jangan hardcode warna Tailwind literal (`bg-emerald-600`, `text-amber-900`, dst.) untuk elemen interaktif/status. Gunakan prop `color` bawaan komponen Nuxt UI (`primary`, `secondary`, `success`, `error`, `warning`, `info`, `neutral`, atau nama warna kustom yang didefinisikan di `app.config.ts`).
- **Gunakan Token Warna Semantik**: Untuk teks, border, dan latar belakang netral, gunakan token semantik Nuxt UI (`text-default`, `text-muted`, `text-dimmed`, `bg-default`, `bg-muted`, `border-default`) — bukan `text-neutral-500 dark:text-neutral-400` manual. Ini otomatis mendukung dark mode tanpa perlu redundansi.

### 2. Konsistensi Visual
- **Konsistensi Radius & Shadow**: Radius, spacing, dan shadow harus konsisten — jangan mencampur `rounded-2xl` manual di satu tempat dan default Nuxt UI di tempat lain. Jika butuh radius kustom global, atur lewat `app.config.ts` (`ui.button.slots`, dst.) atau CSS variable `--ui-radius`, bukan override per komponen.
- **Warna Tematik Terpusat**: Semua warna tematik/dinamis (misal warna per kategori/level) harus didefinisikan sebagai nama warna resmi Nuxt UI (`emerald`, `sky`, `amber`, dst.) di satu objek/config terpusat, lalu di-pass sebagai prop `color`/`variant`, bukan sebagai string class Tailwind gabungan (karena class dinamis via interpolasi tidak terdeteksi Tailwind JIT).
- **Gunakan Variant Bawaan**: Gunakan variant bawaan (`solid`, `soft`, `subtle`, `outline`, `ghost`, `link`) untuk status aktif/non-aktif, jangan membuat ulang dengan class kustom.

### 3. Kenyamanan & Aksesibilitas
- **Tiga State Wajib**: Selalu sediakan state: **Loading** (`USkeleton` / spinner `UIcon animate-spin`), **Empty** (`UEmpty`), dan **Error** (`UAlert color="error"`) untuk setiap pemanggilan data async.
- **Ukuran Target Sentuh (Touch Target)**: Pastikan target klik (button, card interaktif) berukuran minimal cukup besar (padding wajar, tidak terlalu rapat) dan memiliki umpan balik visual hover/active (sudah dihandle otomatis oleh Nuxt UI via variant).
- **Tooltips untuk Icon-Only**: Gunakan `UTooltip` untuk elemen tombol yang hanya menampilkan ikon tanpa label teks agar fungsinya jelas bagi pengguna.
- **Kontras Mode Terang/Gelap**: Perhatikan kontras light/dark mode — andalkan token semantik Nuxt UI, jangan melakukan override manual per mode kecuali benar-benar diperlukan.

### 4. Struktur Kode
- **Hindari Duplikasi Styling**: Jika ada styling berulang di banyak file, pindahkan ke `app.config.ts` (theme override per komponen) daripada copy-paste class panjang di setiap file.
- **Manfaatkan Props & Slots Resmi**: Cek dokumentasi/props resmi komponen sebelum menambah class override manual — banyak kebutuhan (padding, icon size, rounded) sudah dapat diatur lewat prop `size`, `ui`, atau slot resmi komponen Nuxt UI.

