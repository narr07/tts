---
name: obscura-windows
description: Drive the Obscura headless browser (github.com/h4ckf0r0day/obscura) on Windows for web scraping and browser automation - fetching rendered pages, extracting text/links/markdown, taking screenshots, exporting PDFs, running Puppeteer/Playwright scripts against it over CDP, or exposing its browser_* tools to an MCP client. Use this skill whenever the user wants to scrape a website, render JavaScript-heavy pages, screenshot a page, convert a page to markdown/text, automate a browser (click/fill/login) from an agent, run something "headless", or mentions Obscura, obscura.exe, CDP port 9222, or "obscura mcp". Covers Windows-specific setup (no Chromium/Node required, PowerShell quoting, firewall, running as a background service) with stealth/anti-detection mode on by default.
metadata:
  author: narr07
  version: "1.0.0"
  date: 2026-09-19
  repository: https://github.com/narr07/skills
  license: MIT
  upstream: https://github.com/h4ckf0r0day/obscura
license: MIT
---

# Obscura on Windows

Obscura is a single-binary headless browser engine (Rust + V8) from
github.com/h4ckf0r0day/obscura, Apache-2.0. It is a drop-in CDP replacement
for headless Chrome: Puppeteer/Playwright scripts can `connect()` to it
instead of launching Chrome. It also ships its own CLI (`obscura fetch`,
`obscura scrape`) and an MCP server that exposes browser tools directly to
an AI agent - so there are three ways to use it, covered below.

No Chromium, Node.js, or other runtime is required for the CLI/CDP server
itself; Node is only needed if you're driving it *from* a Puppeteer/Playwright
Node script.

## Stealth is ON by default (owner's standing preference)

The owner of this setup uses Obscura for personal use and has decided that
**stealth mode must always be on**. So:

- Add `--stealth` to every `obscura` command that supports it (fetch, serve,
  mcp, and the global form for scrape) without asking each time.
- Install the stealth build (`setup_windows.ps1` does this by default).
- Only turn stealth off if the user explicitly says so for a specific task
  (use `-Plain` at setup / `-NoStealth` for the server script).
- Do not lecture or re-confirm about stealth on each task. One short line in
  the final report saying it was on is enough.

What stealth does: per-session fingerprint randomization (GPU, screen,
canvas, audio, battery), realistic `navigator.userAgentData`,
`navigator.webdriver = undefined`, native-function masking, and tracker
blocking (about 3,500 domains, so some analytics/ad scripts will simply not
load - expected, not a bug).

The one judgment call that stays: stealth is a fingerprinting/tracking
feature, not permission to get into accounts or data the user has no right
to. If a request is plainly about accessing someone else's account, or
defeating a paywall/login the user hasn't paid for or owns, say so and ask
before doing it. Everything ordinary (scraping public pages, testing their
own sites, automating their own accounts) just proceeds.

## Which mode do I need?

| The user wants to... | Use |
|---|---|
| One-off: get a page's text/links/markdown/screenshot from the terminal | `obscura fetch` (CLI) |
| Many URLs, in parallel, dump to JSON | `obscura scrape` (CLI) |
| Drive it from an existing Puppeteer/Playwright Node.js script (click, fill, multi-step flows) | `obscura serve` + connect over CDP |
| Let an MCP-capable agent (Claude Desktop, Cursor, this session if configured) browse and click directly | `obscura mcp` |

## Setup on Windows

0. **Check for an existing install first**: `Get-Command obscura` (or
   `obscura --version`) - if it resolves, skip straight to step 2. Obscura
   may already be on PATH from a different install location than this
   script uses (e.g. `%USERPROFILE%\.obscura` instead of
   `%LOCALAPPDATA%\obscura`); either is fine, `run-server.ps1` resolves from
   PATH first and only falls back to the `%LOCALAPPDATA%` path.

1. **Check/install** (downloads the official release zip, no Chocolatey/winget needed, nothing installed system-wide):
   ```powershell
   powershell -ExecutionPolicy Bypass -File "<skill_dir>\scripts\setup_windows.ps1" -Check
   powershell -ExecutionPolicy Bypass -File "<skill_dir>\scripts\setup_windows.ps1"          # installs the STEALTH build (default)
   powershell -ExecutionPolicy Bypass -File "<skill_dir>\scripts\setup_windows.ps1" -Plain   # only if the user asks for no stealth
   ```
   This extracts to `%LOCALAPPDATA%\obscura\` and adds that folder to the
   **user** PATH (not machine-wide, so it needs no admin rights). Open a new
   terminal afterwards so PATH picks it up, or use the full path the script
   prints.

2. **Verify**: `obscura --version`. If PowerShell says the command isn't
   recognized, either the new terminal wasn't reopened, or use
   `& "$env:LOCALAPPDATA\obscura\obscura.exe" --version` directly.

3. Stealth is a **build-time** feature plus a runtime flag: the `--stealth`
   flag only does something if the installed binary is a `-stealth` build.
   `setup_windows.ps1 -Check` reports which build is installed. If it says
   "plain build", rerun setup (no flags) to upgrade in place.

## CLI quick start

Always quote URLs and paths in PowerShell; `&` in a URL's query string will
otherwise be parsed by the shell.

```powershell
# Page title via JS eval
obscura fetch "https://example.com" --stealth --eval "document.title"

# Rendered text / links / markdown / html
obscura fetch "https://news.ycombinator.com" --stealth --dump markdown --output page.md
obscura fetch "https://example.com" --stealth --dump links

# Screenshot (render-enabled build only)
obscura fetch "https://example.com" --stealth -s page.png

# Wait for JS-heavy content, bound the navigation time
obscura fetch "https://example.com" --stealth --wait-until networkidle0 --timeout 15

# Raw non-HTML resource (images, JSON, etc.) - binary safe
obscura fetch "https://picsum.photos/200/300" --stealth --dump original --output photo.jpg

# Many URLs in parallel -> JSON (--stealth works either before or after "scrape")
obscura scrape "https://a.example.com" "https://b.example.com" --stealth --concurrency 10 --quiet
```

Verified against the installed v0.2.2 binary: `--stealth`, `--obey-robots`
and `--allow-private-network` are real flags on every subcommand
(`fetch --help`/`scrape --help`/`serve --help`/`mcp --help` all list them
individually), and also work in the global `obscura --stealth scrape ...`
form. Either order is fine; put `--stealth` wherever reads more naturally.

`--dump` accepts `html` (default), `text`, `links`, `markdown`, `cookies`
(JSON array of the cookie jar, including HttpOnly - useful for lifting a
session token after an anti-bot challenge), `assets` (NDJSON of every
sub-resource URL) or `original` (raw response body, binary-safe - use this
for anything that isn't HTML). Full flag reference in
`references/cli-and-cdp.md`.

**SSRF protection is on by default** for `fetch`/`scrape`/`serve`/`mcp`:
requests to loopback, RFC1918 private ranges, and link-local addresses are
refused unless `--allow-private-network` is passed. Only add that flag for
a URL the user explicitly wants fetched against their own localhost/LAN
service - never to work around a refusal on an untrusted target.

**Reading large output**: `--dump markdown`/`text` on a big page can be tens
of thousands of characters. Write to `--output file.md` and read it in
sections rather than dumping straight to the terminal/context.

## CDP server (Puppeteer / Playwright)

```powershell
obscura serve --port 9222 --stealth
```

**Verified security gap (installed v0.2.2, tested against a real CDP
session)**: `serve --help` documents `--allow-file-access` as "Off by
default so a CDP connection cannot read arbitrary local files." In testing,
a plain `page.goto('file:///C:/Windows/System32/drivers/etc/hosts')` over
CDP **succeeded and returned the file's contents even without passing
`--allow-file-access`** - the flag did not gate `Page.navigate` to `file://`
in this build. Treat any CDP client connected to `obscura serve` as able to
read local files regardless of that flag until this is confirmed fixed
upstream: never bind `--host` to anything but `127.0.0.1` (the default),
never let an untrusted script connect to the port, and don't rely on
`--allow-file-access` being off as a security boundary. Re-test this after
any Obscura version upgrade before trusting it.

Then, in a Node.js project (`npm install puppeteer-core` or
`playwright-core` - Obscura itself needs neither):

```javascript
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.connect({ browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser' });
const page = await browser.newPage();
await page.goto('https://example.com');
console.log(await page.title());
await browser.disconnect();
```

Playwright: `chromium.connectOverCDP({ endpointURL: 'ws://127.0.0.1:9222' })`.
Both are true drop-in replacements - existing Puppeteer/Playwright code that
targets Chrome works unmodified against this endpoint. Full CDP domain
coverage (Page, Runtime, DOM, Network, Fetch interception, Input, Storage,
and a custom `LP.getMarkdown`) is in `references/cli-and-cdp.md`.

**Form submission / login**: Obscura handles the POST, redirect and cookie
jar like a real browser -
```javascript
await page.goto('https://example.com/login');
await page.evaluate(() => {
  document.querySelector('#username').value = 'admin';
  document.querySelector('#password').value = 'admin';
  document.querySelector('form').submit();
});
```
Only automate a login the user is authorized to perform, and never hardcode
or log real credentials in a script you leave on disk - read them from an
environment variable at run time instead (`process.env.SITE_PASSWORD`). To
reuse a session across runs instead of logging in every time, export the
cookie jar with `Network.getCookies` (CDP) or `browser_storage_state` (MCP)
after a successful login and restore it with `Network.setCookies` /
`browser_set_storage_state` next time.

**Running as a background service on Windows**: `obscura serve` is a
foreground process. For something that should keep running after the
terminal closes, use `scripts/run-server.ps1 -Start` (launches it detached
with `Start-Process` and **stealth on by default**, logs to a file, writes a
PID file) and `-Stop` to kill it cleanly. Don't set it up as a real Windows Service unless the user
specifically asks - a detached process is enough for local agent use and is
much easier to reason about.

## MCP server (agent drives the browser directly)

```powershell
obscura mcp --stealth                        # stdio, for Claude Desktop / Cursor / similar
obscura mcp --stealth --http --port 8080     # HTTP, endpoint http://127.0.0.1:8080/mcp (default port if omitted: 3000)
```

Claude Desktop config (`%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "obscura": {
      "command": "C:\\Users\\<user>\\AppData\\Local\\obscura\\obscura.exe",
      "args": ["mcp", "--stealth"]
    }
  }
}
```
Use the full path (Claude Desktop does not inherit the user PATH the way an
interactive shell does). Restart Claude Desktop after editing the config.

Once connected, the agent gets **38 `browser_*` tools** (verified via a live
`tools/list` call against the installed v0.2.2 server - this is far more
than a quick skim of the README suggests), grouped by job:

- **Read the page**: `browser_snapshot`, `browser_markdown`, `browser_links`,
  `browser_interactive_elements` (list clickable/typeable elements with a
  stable `ref` - call this, not just `browser_snapshot`, before clicking
  when the page has many controls), `browser_search`, `browser_count`,
  `browser_get_attribute`, `browser_extract` (pull a structured JSON object
  from a `{field: css_selector}` map in one call - prefer this over several
  `browser_evaluate` calls when scraping a list of items).
- **Act**: `browser_navigate`, `browser_click`, `browser_fill`,
  `browser_fill_form` (fill + submit a whole form in one call),
  `browser_type`, `browser_press_key`, `browser_select_option`,
  `browser_scroll`, `browser_wait_for`, `browser_wait_for_text`,
  `browser_detect_forms`, `browser_back`/`browser_forward`/`browser_reload`.
- **Session/cookies**: `browser_get_cookies`, `browser_set_cookie`,
  `browser_clear_cookies`, `browser_storage_state` /
  `browser_set_storage_state` (export/import cookies + localStorage +
  sessionStorage together - the right way to skip a login on a later run,
  better than re-submitting a form each time).
- **Tabs**: `browser_tab_new`, `browser_tab_list`, `browser_tab_switch`,
  `browser_tab_close`.
- **Other**: `browser_evaluate`, `browser_screenshot`, `browser_pdf`,
  `browser_network_requests`, `browser_console_messages`, `browser_close`.

Full list with parameters in `references/mcp-tools.md`. `browser_snapshot`
is still the normal first call in any flow: it returns the URL, title and
visible text; pair it with `browser_interactive_elements` before a click/fill
on a page with a lot of controls.

## Windows pitfalls

- **PowerShell URL quoting**: `obscura fetch https://example.com?a=1&b=2`
  breaks because `&` starts a new PowerShell statement. Always quote the
  URL: `obscura fetch "https://example.com?a=1&b=2"`.
- **PATH not picked up**: setup adds to the *user* PATH via the registry;
  processes started before that change (including an already-open terminal
  or IDE) won't see it. Open a new terminal, or call the full exe path.
  Restarting Claude Desktop is required for MCP config changes for the same
  reason.
- **Antivirus/SmartScreen on first run**: a freshly downloaded, unsigned
  `.exe` from a zip can be flagged by Defender SmartScreen the first time
  it's executed. This is expected for a binary fetched directly from GitHub
  releases rather than an installer; if it's blocked, "More info -> Run
  anyway" in the SmartScreen dialog, or note it to the user rather than
  silently disabling Defender.
- **Firewall prompt on `obscura serve`**: binding a port triggers a Windows
  Defender Firewall "Allow this app" prompt the first time. Fine to allow
  for `127.0.0.1`-only use (the default); if `--port` is bound on a
  non-loopback address, that's opening the machine to the network - confirm
  that's intended.
- **Port already in use**: `obscura serve --port 9222` fails immediately if
  something else (often a previous `obscura serve` that wasn't stopped) is
  already listening. `scripts/run-server.ps1 -Stop` first, or pick another
  `--port`.
- **Long-running `obscura serve` blocks the terminal**: use
  `scripts/run-server.ps1 -Start`/`-Stop` (see above) rather than manually
  backgrounding it with `&` in PowerShell, which detaches less reliably.
- **No admin rights needed** for the normal install path (user PATH, no
  service). Only mention admin/service installation if the user explicitly
  wants Obscura to run as a Windows Service across reboots.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `obscura : The term 'obscura' is not recognized` | PATH not refreshed, or install failed | Open a new terminal; or run the full path; rerun setup with `-Check` |
| Page hangs / times out on a heavy SPA | Script execution budget too low for the page | Raise `OBSCURA_SCRIPT_DEADLINE_MS` (default 30000ms), see `references/cli-and-cdp.md` |
| `JavaScript heap out of memory` | V8 heap cap too small for a memory-heavy page | `obscura --v8-flags "--max-old-space-size=4096" fetch ...` |
| `--stealth` accepted but pages still detect automation / no tracker blocking | Plain (non-stealth) build installed | `setup_windows.ps1 -Check` to confirm, then rerun setup without `-Plain` |
| Some scripts/analytics on a page never load | Stealth tracker blocking (about 3,500 domains) is working as designed | Expected; only use `-NoStealth`/plain if the page genuinely needs that script |
| Screenshot/PDF commands fail or are missing | Using a `-no-render` build | Re-run setup without `-NoRender` to get the rendering-enabled build |
| Puppeteer/Playwright `connect()` hangs | `obscura serve` isn't running, or wrong port | Check `scripts/run-server.ps1 -Status`; confirm the port matches |
| MCP tools don't show up in Claude Desktop | Config path wrong, or PATH-relative command, or app not restarted | Use the full `.exe` path in the config; fully quit and reopen Claude Desktop |
| Large download via `Network.getResponseBody` gets truncated | Response exceeds `OBSCURA_NETWORK_BODY_BUFFER_BYTES` (default 2MiB) | Use `Fetch.takeResponseBodyAsStream` + `IO.read`, or raise that env var |
| Login form submit doesn't navigate | Selectors wrong for that page, or JS-driven form (not a plain `<form>` submit) | `browser_snapshot`/`--dump html` first to check the actual selectors; some sites intercept submit with JS and need a click on the submit button instead |

## Reporting back

State what was fetched/automated, where output was written, and note that
stealth was on (one short line, no commentary). Example: "Fetched 3 product
pages with `obscura --stealth scrape`, wrote `results.json` (12 KB). Stealth
on."
