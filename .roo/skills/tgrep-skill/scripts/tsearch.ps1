<#
.SYNOPSIS
    Satu perintah untuk semua kebutuhan pencarian tgrep: otomatis memastikan
    index/server sudah siap, lalu langsung menjalankan pencarian.

.DESCRIPTION
    Dibuat supaya agent AI tidak perlu mikir "apakah server sudah jalan?",
    "apakah harus index dulu?", dll. — cukup panggil script ini dengan pola
    dan path, semua penanganan server/index terjadi otomatis di baliknya.
    Ini SATU-SATUNYA cara yang perlu dipakai untuk mencari teks/kode di
    project ini; jangan pakai grep/ripgrep/findstr/Select-String sebagai
    pengganti.

    Alur:
      1. Pastikan 'tgrep' ada di PATH. Kalau tidak, keluar dengan pesan
         jelas (jangan diam-diam fallback ke grep).
      2. Cek 'tgrep status' untuk folder target.
         - Server sudah jalan  -> langsung lanjut ke pencarian.
         - Server belum jalan  -> nyalakan 'tgrep serve' di background,
           tunggu sebentar supaya index awal mulai terbentuk.
      3. Jalankan pencarian dengan '--' sebelum pola (mencegah salah baca
         subcommand), lalu kembalikan stdout + stderr + exit code apa
         adanya ke pemanggil.

.PARAMETER Pattern
    Pola pencarian (regex, atau string literal jika -Literal dipakai).

.PARAMETER Path
    Folder yang dicari. Default: direktori saat ini.

.PARAMETER Literal
    Kalau diset, pola diperlakukan sebagai string literal (setara -F),
    bukan regex. Pakai ini kalau yang dicari adalah nama fungsi/variabel
    apa adanya, supaya tidak perlu escape karakter regex secara manual.

.PARAMETER Flags
    Flag tambahan apa pun untuk diteruskan ke tgrep, misalnya
    @("-t","rust"), @("-g","src/**"), @("-C","3"), @("-l"), @("--json").

.EXAMPLE
    # Cari literal nama fungsi di seluruh repo
    .\tsearch.ps1 -Pattern "parseConfig" -Path C:\repos\myapp -Literal

.EXAMPLE
    # Regex, hanya file TypeScript, dengan 2 baris konteks
    .\tsearch.ps1 -Pattern "TODO|FIXME" -Path . -Flags @("-t","ts","-C","2")

.EXAMPLE
    # Hanya daftar nama file yang cocok (query luas dulu)
    .\tsearch.ps1 -Pattern "impl .* for Server" -Path . -Flags @("-l")
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Pattern,

    [string]$Path = ".",

    [switch]$Literal,

    [string[]]$Flags = @()
)

$ErrorActionPreference = "Stop"

# --- 1. Pastikan tgrep ada ---
if (-not (Get-Command tgrep -ErrorAction SilentlyContinue)) {
    Write-Error @"
tgrep tidak ditemukan di PATH.
JANGAN fallback ke grep/findstr/Select-String — perbaiki dulu instalasi tgrep:
  powershell -ExecutionPolicy Bypass -File scripts\install-tgrep.ps1
Lalu jalankan ulang perintah ini.
"@
    exit 2
}

$resolved = (Resolve-Path -Path $Path -ErrorAction SilentlyContinue)
if (-not $resolved) {
    Write-Error "Path tidak ditemukan: $Path"
    exit 2
}
$resolved = $resolved.Path

# --- 2. Pastikan server/index siap (tanpa berisik kalau sudah siap) ---
# `tgrep status` selalu exit 0 (untuk "no index", "index tanpa server", MAUPUN
# "server jalan") -- jadi exit code TIDAK BISA dipakai membedakan ketiganya.
# Header "Server status for" HANYA muncul saat server benar-benar jalan;
# state lain memakai header "No index found"/"Index status for" + baris
# "Server:     not running". Diverifikasi langsung lewat `tgrep status` di
# ketiga kondisi -- jangan cari substring "No server", itu tidak pernah ada.
$statusOutput = & tgrep status $resolved 2>&1
$serverReady = ($LASTEXITCODE -eq 0) -and ($statusOutput -match "Server status for")

if (-not $serverReady) {
    # Jangan biarkan .tgrep/ (index) diam-diam masuk ke commit git -- upstream
    # (AGENTS.md microsoft/tgrep) bilang tegas: "Do not commit .tgrep/".
    $gitignore = Join-Path $resolved ".gitignore"
    $ignoreLine = ".tgrep/"
    if (Test-Path $gitignore) {
        $content = Get-Content $gitignore -Raw
        if ($content -notmatch [regex]::Escape($ignoreLine)) {
            Add-Content -Path $gitignore -Value "`n$ignoreLine"
            Write-Host "[tsearch] Menambahkan '$ignoreLine' ke .gitignore" -ForegroundColor DarkGray
        }
    }

    Write-Host "[tsearch] Belum ada server untuk '$resolved', menyalakan tgrep serve di background..." -ForegroundColor DarkCyan
    Start-Process -FilePath "tgrep" -ArgumentList @("serve", $resolved) -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "[tsearch] Index awal mungkin masih dibangun di background; hasil pertama bisa saja kosong/parsial." -ForegroundColor DarkCyan
}

# --- 3. Jalankan pencarian ---
$searchArgs = @()
if ($Literal) { $searchArgs += "-F" }
$searchArgs += $Flags
$searchArgs += "--"
$searchArgs += $Pattern
$searchArgs += $resolved

Write-Host "[tsearch] tgrep $($searchArgs -join ' ')" -ForegroundColor DarkGray

& tgrep @searchArgs
$exitCode = $LASTEXITCODE

switch ($exitCode) {
    0 { }  # ada match, tidak perlu pesan tambahan
    1 { Write-Host "[tsearch] Tidak ada match." -ForegroundColor Yellow }
    2 { Write-Host "[tsearch] Terjadi error (lihat stderr di atas — path tidak terbaca, regex salah, dll.)." -ForegroundColor Red }
}

exit $exitCode
