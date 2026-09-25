# Obscura: CLI, CDP and environment reference

Source: https://github.com/h4ckf0r0day/obscura (README, docs/). Apache-2.0.

## Contents
- `obscura fetch` full flags
- `obscura scrape` full flags
- `obscura serve` full flags
- CDP domain coverage
- Streaming large responses
- Environment variables / timeout model
- Release asset matrix

## `obscura fetch <URL>`

Fetch and render a single page.

Flags below are confirmed against `obscura fetch --help`/`scrape --help`/
`serve --help`/`mcp --help` on the installed v0.2.2 binary (2026-09-19) -
the tables were previously written from the README alone and missed several
real flags, corrected here.

| Flag | Default | Description |
|---|---|---|
| `--dump` | `html` | `html`, `text`, `links`, `markdown`, `cookies` (JSON array of the cookie jar incl. HttpOnly), `assets` (NDJSON of sub-resource URLs), `original` (raw response body, binary-safe) |
| `--eval`, `-e` | — | JavaScript expression to evaluate, result printed |
| `--wait-until` | `load` | `load`, `domcontentloaded`, `networkidle0` |
| `--timeout` | `30` | Max navigation time, seconds |
| `--wait` | adaptive, up to `5` | Post-load settling delay; a number fixes it |
| `--selector` | — | Wait for a CSS selector before continuing |
| `-s`, `--screenshot` | — | Write PNG screenshot (render build only) |
| `--stealth` | off | Anti-detection + tracker blocking. **This skill always passes it.** Requires a `-stealth` build. Confirmed as its own flag on `fetch` (not just the global form) |
| `--obey-robots` | off | Respect robots.txt before navigating |
| `--allow-private-network` | off | Permit loopback/RFC1918/link-local targets; default is to refuse them (SSRF guard) |
| `--file <path>` | — | Batch mode: fetch every URL in a newline-delimited file (`-` for stdin) with `--dump original`, one JSON status line per URL. Use `scrape` instead for rendered/DOM output |
| `--concurrency` | `1` | Parallel fetches, only used with `--file` |
| `--user-agent` | — | Override UA string |
| `--storage-dir` | — | Persist cookies/localStorage across runs |
| `--output`, `-o` | — | Write dump/eval output to a file instead of stdout |
| `--quiet`, `-q` | off | Suppress the "Fetching.../Page loaded" progress lines (they go to stderr already, so this mainly matters for scripts that capture stderr too) |
| `--proxy` | — | HTTP or SOCKS5 proxy URL |
| `-v`, `--verbose` | off | Debug-level logging |

## `obscura scrape <URL...>`

Multiple URLs in parallel via worker processes (`obscura-worker.exe` must sit
next to `obscura.exe`). `--stealth`, `--obey-robots` and
`--allow-private-network` are real per-subcommand flags here too (verified:
`obscura scrape <urls> --stealth` works directly, not only the global
`obscura --stealth scrape ...` form).

| Flag | Default | Description |
|---|---|---|
| `--concurrency` | `10` | Parallel workers |
| `--eval`, `-e` | — | JS expression run on every page |
| `--format` | `json` | Output format |
| `--quiet`, `-q` | off | Suppress progress on stderr (script-friendly) |
| `--timeout` | `60` | Per-URL timeout, seconds |
| `--proxy` | — | Applied to every worker |
| `--stealth` / `--obey-robots` / `--allow-private-network` | off | Same meaning as on `fetch` |

## `obscura serve`

Starts a CDP WebSocket server.

| Flag | Default | Description |
|---|---|---|
| `--port`, `-p` | `9222` | WebSocket port |
| `--host` | `127.0.0.1` | Bind address - only change this to expose beyond localhost, and only when that's actually intended |
| `--proxy` | — | HTTP/SOCKS5 proxy URL |
| `--stealth` | off | Anti-detection + tracker blocking. **This skill always passes it** |
| `--workers` | `1` | Parallel worker processes |
| `--max-connections` | `128` | Live CDP connection cap; over the limit gets a 503 |
| `--allow-file-access` | off | Docs say this gates whether a CDP client can navigate to `file://` URLs. **Testing on the installed v0.2.2 build shows `file://` navigation succeeds over CDP even without this flag** - do not rely on it as a security boundary; keep `--host 127.0.0.1` and don't let untrusted clients connect, regardless of this flag |
| `--obey-robots` | off | Respect robots.txt |
| `--allow-private-network` | off | Same SSRF guard as `fetch` |
| `--quiet` | off | Suppress logs |
| `--storage-dir` | — | Persist cookies/localStorage across restarts |

## `obscura mcp`

| Flag | Default | Description |
|---|---|---|
| (none) | stdio | Default transport - for Claude Desktop and similar |
| `--http` | — | Switch to HTTP transport, endpoint `http://<host>:<port>/mcp` |
| `--port` | `3000` | HTTP port (only used with `--http`) |
| `--host` | `127.0.0.1` | HTTP bind address |
| `--proxy <url>` | — | HTTP/SOCKS5 proxy |
| `--user-agent <ua>` | — | Custom User-Agent |
| `--stealth` | off | Anti-detection mode (this skill always passes it) |
| `--obey-robots` | off | Respect robots.txt |
| `--allow-private-network` | off | Same SSRF guard as `fetch` |
| `-v`, `--verbose` | off | Debug-level logging |

## CDP domain coverage

Puppeteer/Playwright compatibility surface:

| Domain | Methods |
|---|---|
| Target | createTarget, closeTarget, attachToTarget, createBrowserContext, disposeBrowserContext |
| Page | navigate, getFrameTree, lifecycleEvents, captureScreenshot, start/stopScreencast, printToPDF |
| Runtime | evaluate, callFunctionOn, getProperties, addBinding |
| DOM | getDocument, querySelector, querySelectorAll, getOuterHTML, resolveNode |
| Network | enable, setCookies, getCookies, setExtraHTTPHeaders, setUserAgentOverride |
| Fetch | enable, continueRequest, fulfillRequest, failRequest (live interception), takeResponseBodyAsStream |
| IO | read, close (chunked read of a large response body) |
| Storage | getCookies, setCookies, deleteCookies |
| Input | dispatchMouseEvent, dispatchKeyEvent |
| LP (custom) | getMarkdown - DOM-to-Markdown conversion |

Use CDP directly (not the MCP server) when a workflow needs the streaming
`Page.startScreencast` protocol - the MCP server only returns still
screenshots and PDFs.

## Streaming large responses

`Network.getResponseBody` buffers the whole body in memory; bodies over
`OBSCURA_NETWORK_BODY_BUFFER_BYTES` (default 2 MiB) are not retained at all
and that call will fail for them. For large downloads (big JSON payloads,
files) call `Fetch.takeResponseBodyAsStream` and read the stream in chunks
with `IO.read` / `IO.close`, or raise the buffer limit if you specifically
want the whole-body call to keep working for bigger responses.

## Environment variables / timeout model

| Variable | Default | Purpose |
|---|---|---|
| `OBSCURA_SCRIPT_DEADLINE_MS` | `30000` | Cap on a page's script-execution phase; pages finishing sooner return immediately. Raise for heavy React/Vue/Angular SPAs that need longer to boot before firing data requests. Pair with a matching navigation timeout in the CDP client. |
| `OBSCURA_MODULE_BUDGET_MS` | `3000` | Per-module budget for scripts that enhance an already-rendered page (e.g. a Vite HMR client). Raise only for a specific long-running module you know about. |
| `OBSCURA_FETCH_TIMEOUT_MS` | — | Controls a module's network request time, not its evaluation time - separate from the two budgets above. |
| `OBSCURA_NETWORK_BODY_BUFFER_BYTES` | `2097152` (2 MiB) | Response bodies larger than this aren't retained for `Network.getResponseBody`; stream instead or raise this. |

An unmounted SPA shell already gets the full `OBSCURA_SCRIPT_DEADLINE_MS`
budget for its app modules - the module budget only applies once something
is attached to an already-loaded page.

Set on Windows for one process:
```powershell
$env:OBSCURA_SCRIPT_DEADLINE_MS = "60000"
obscura serve --port 9222
```

## Release asset matrix (Windows)

Only `x86_64` Windows binaries are published. Suffix selects the build:

| Suffix | Rendering (screenshots/PDF/layout) | Stealth transport |
|---|---|---|
| (none) | Yes | No |
| `-stealth` | Yes | Yes |
| `-no-render` | No | No |
| `-no-render-stealth` | No | Yes |

`obscura-x86_64-windows<suffix>.zip` from
https://github.com/h4ckf0r0day/obscura/releases/latest - `setup_windows.ps1`
builds this URL from the `-Plain`/`-NoRender` switches (stealth is the default, so a normal install fetches the `-stealth` asset). If the asset name
has changed in a newer release, check the releases page directly.
