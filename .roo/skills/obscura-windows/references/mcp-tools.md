# Obscura MCP tools reference

Source: a live `tools/list` call against `obscura mcp --http` on the
installed v0.2.2 binary (2026-09-19), not just the README - the server
exposes **38** `browser_*` tools, well beyond what a skim of the docs
suggests. If a future Obscura version adds/removes tools, re-run
`tools/list` rather than trusting this file blindly.

## Typical flow

1. `browser_navigate` to the target URL.
2. Read the page with `browser_snapshot` (title/URL/text) and, before any
   click/fill on a page with several controls, `browser_interactive_elements`
   (clickable/typeable elements with a stable `ref`). Refs go stale after
   DOM changes - re-call after a navigation or a click that changes the page.
3. Act (`browser_click`, `browser_fill`, `browser_fill_form`, `browser_type`,
   `browser_press_key`, `browser_select_option`, `browser_scroll`) and/or
   read (`browser_evaluate`, `browser_extract`, `browser_markdown`,
   `browser_screenshot`, `browser_pdf`, `browser_network_requests`,
   `browser_console_messages`).
4. To persist a login across runs, use `browser_storage_state` to export
   cookies + localStorage + sessionStorage after logging in, and
   `browser_set_storage_state` to restore it next time instead of
   re-submitting the login form.
5. `browser_close` when the task is done, to reset state for the next task.

## Tools by group

### Read the page
| Tool | Parameters | Notes |
|---|---|---|
| `browser_snapshot` | optional `max_chars` (default 4000) | Title, URL, readable body text |
| `browser_markdown` | optional `max_chars` (default 4000) | Page as Markdown (headings/lists/links/code) - more token-dense than snapshot for structured content |
| `browser_links` | optional `limit` (default 100), `internal_only` | One `{text, href}` JSON object per line |
| `browser_interactive_elements` | optional `limit` (default 100) | Every clickable/typeable element with a stable `ref` like `e3` - call before clicking/filling instead of guessing a selector |
| `browser_search` | `query`, optional `case_sensitive`, `limit` (10), `context_chars` (80) | Substring search in visible text with surrounding context |
| `browser_count` | `selector` | Count elements matching a CSS selector - cheap existence/pagination probe |
| `browser_get_attribute` | `attribute`, `ref` or `selector` | Read an attribute (href, src, value, data-*, ...) |
| `browser_extract` | `schema` ({field: css_selector}, `@attr` suffix for an attribute, `[]` suffix on the field name for an array) | Pull a structured JSON object in one call instead of many `browser_evaluate` round-trips |
| `browser_detect_forms` | — | Every `<form>` with action/method and each input's description |
| `browser_network_requests` | — | Requests made by the current page |
| `browser_console_messages` | — | Console log/warn/error output |

### Act
| Tool | Parameters | Notes |
|---|---|---|
| `browser_navigate` | `url`, optional `waitUntil` (`load`/`domcontentloaded`/`networkidle0`) | Start here for any new task |
| `browser_click` | `ref` (preferred) or `selector` | |
| `browser_fill` | `ref`/`selector`, `value` (required) | Sets value, fires input/change |
| `browser_fill_form` | `fields` (array of `{ref?, selector?, value, type?}`, `type` = text/check/uncheck/select), optional `submit_ref`/`submit_selector` | Fill several inputs (and optionally submit) in one call instead of N `browser_fill` calls |
| `browser_type` | `ref`/`selector`, `text` (required) | Appends to existing value |
| `browser_press_key` | `key` (required), optional `selector` | Real keyboard event, e.g. Enter-to-submit |
| `browser_select_option` | `selector` (required), `value` (required) | For `<select>` elements |
| `browser_scroll` | optional `direction` (top/bottom/up/down/left/right, default down), `amount` (px), `ref`/`selector` | `bottom` triggers infinite-scroll loaders |
| `browser_wait_for` | `selector` (required), optional `timeout` (30s) | Wait for a CSS selector |
| `browser_wait_for_text` | `text` (required), optional `timeout` (30s) | Wait for a substring anywhere in rendered text (e.g. a success toast) |
| `browser_back` / `browser_forward` / `browser_reload` | — | History navigation |

### Session / cookies
| Tool | Parameters | Notes |
|---|---|---|
| `browser_get_cookies` | optional `domain` | All cookies, or filtered |
| `browser_set_cookie` | `name`, `value`, `domain` (required), optional `path`, `secure`, `http_only` | Add/replace a cookie - can skip a login flow if you already have a session token |
| `browser_clear_cookies` | — | Wipe the jar |
| `browser_storage_state` | — | Export cookies + localStorage + sessionStorage as one JSON object |
| `browser_set_storage_state` | `state` (required, `{cookies, origins}`) | Restore a previously exported state - the reliable way to reuse an authenticated session |

### Tabs
| Tool | Parameters | Notes |
|---|---|---|
| `browser_tab_new` | optional `url` | Opens a new isolated page; later calls target the most-recently-opened/switched tab |
| `browser_tab_list` | — | ID, URL, title, active flag for every open tab |
| `browser_tab_switch` | `tab_id` (required) | Make a tab active for subsequent calls |
| `browser_tab_close` | optional `tab_id` (default: active) | Closing the active tab activates the next remaining one |

### Other
| Tool | Parameters | Notes |
|---|---|---|
| `browser_evaluate` | `expression` (required) | Arbitrary JS in the page context, returns the result |
| `browser_screenshot` | optional `width`, `height` (CSS px, max 32768) | PNG of the current viewport, render build only |
| `browser_pdf` | optional `landscape`, `print_background`, `scale` (0.1-2.0), `paper_width`/`paper_height` (in, max 200), margins (in) | Paginated PDF, render build only |
| `browser_close` | — | Closes the page and resets state |

## Practical notes

- If `browser_click`/`browser_fill` fail with a stale-reference error, call
  `browser_interactive_elements` or `browser_snapshot` again and use the
  fresh reference - don't retry the same stale one.
- `browser_screenshot`/`browser_pdf` require a rendering-enabled Obscura
  build (default and `-stealth` suffixes; not `-no-render*`).
- Prefer `browser_extract` over several `browser_evaluate` calls when
  pulling a list of similar items (search results, table rows) - one call,
  one JSON object, and the selector map documents what you extracted.
- For scripted, multi-step automation with real control flow (loops,
  conditionals across many pages), prefer the CDP server + a
  Puppeteer/Playwright script over chaining many individual MCP tool calls -
  it's both faster and easier to get right.
- `browser_evaluate` executes in the page's own context - do not use it to
  read cookies or storage from a domain other than the one currently
  loaded; navigate there first, or use `browser_get_cookies`/
  `browser_storage_state` which work across the jar directly.
