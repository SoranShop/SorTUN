# SorTUN panel design system

The visual language of the web panel: servers and the links between them, at night and at dawn. This document is the reference for
building it.
The tokens are in [tokens.css](tokens.css); the interactive prototype is in
[prototype/](prototype/).

## 1. The picture, applied

| Thing in SorTUN | On screen |
|---|---|
| A server | A node: a ring in its state's colour, a small server (two drive bays) inside |
| A tunnel | A link between two nodes, curved away from the middle of the map |
| Traffic | Light moving along the link; speed and density follow throughput |
| A healthy tunnel | A turquoise link with light moving |
| A stopped tunnel | An empty link, a dashed outline |
| A failing tunnel | A link that stops at the break, with a red pulse where it fails |
| The page | Quiet surfaces on a faint grid of dots: navigation and titles above, content in bands below |
| The logo | Two gold server rings joined by an S-shaped turquoise link |

## 2. Colour

Components use semantic tokens only. Raw brand colours (`--navy-*`, `--gold-*`,
`--water-*`) are for the scene art (the map, the login, the loader).

| Role | Token | Use | Do not use for |
|---|---|---|---|
| Accent | `--accent` | primary buttons, focus ring, selection, active navigation | status |
| Water | `--water` | live traffic, "connected", healthy | buttons, links |
| Warning | `--warn` | degraded, restarting, a certificate close to expiry | |
| Danger | `--danger` | down, errors, destructive actions | |
| Lines | `--line`, `--line-strong` | the hairline between strata, borders of fields | text |

Status never relies on colour alone: every state also has an icon and a word.

Contrast (WCAG ratio on `--bg` / `--stratum-1` / `--stratum-2`):

| Night | | Dawn | |
|---|---|---|---|
| `--text` #eef2f7 | 15.6 / 14.6 / 12.9 | `--text` #0b1f34 | 14.6 / 13.0 / 11.4 |
| `--text-2` #a9b8cc | 8.7 / 8.2 / 7.2 | `--text-2` #3a4f66 | 7.4 / 6.6 / 5.8 |
| `--text-3` #7f92ab | 5.5 / 5.2 / 4.6 | `--text-3` #4f6175 | 5.9 / 5.2 / 4.6 |
| `--accent` #e9c46a | 10.5 / 9.8 / 8.7 | `--accent` #7a4e00 | 6.3 / 5.6 / 4.9 |
| `--water` #34d0c3 | 9.2 / 8.6 / 7.6 | `--water` #0a6e65 | 5.4 / 4.8 / 4.2 (large text and icons on `--stratum-2`) |
| `--danger` #ff7a7a | 6.9 / 6.5 / 5.8 | `--danger` #b42318 | 5.8 / 5.1 / 4.5 |

`--on-accent` on `--accent`: 11.0 (Night), 8.2 (Dawn, with the fill #d9a441 for large
buttons) or white text on #7a4e00.

## 3. Type

| Font | Role | Why |
|---|---|---|
| Space Grotesk | UI text, headings, numbers | geometric and technical, with character; a variable font (22 KB, Latin) |
| Estedad | Persian text | a modern Persian sans with even stroke weight that sits well next to Space Grotesk; variable (125 KB) |
| IBM Plex Mono | addresses, ports, tokens, logs, config | clear `0`/`O` and `1`/`l`, calm in long logs |

Estedad is limited to Arabic script with `unicode-range`, so mixed lines like
«تانل روی 203.0.113.5:3080» set the address in Latin type. Digits follow a setting
(Persian or Latin); addresses, ports and versions are always Latin.

Scale: 12 / 14 / 16 / 20 / 28 / 40 / 64 px. Body 16 px with line height 1.55. Key numbers
use tabular figures (`font-variant-numeric: tabular-nums`) so they do not jump while they
update.

## 4. Space, shape, surfaces

- A 4 px grid: 4, 8, 12, 16, 24, 32, 48, 64.
- **Strata, not cards.** A page is a stack of full-width bands (`--stratum-1`, `-2`,
  `-3`, deeper is darker in Night and darker sand in Dawn), divided by a 1 px gold
  hairline. Within a band, content is laid out in columns, without boxes around each item.
- Small radii: 4 (chips), 8 (buttons, fields), 14 (dialogs). Bands have none.
- A faint grain (an SVG noise, `--grain-opacity`) over the earth, never over text-heavy
  areas at more than 7 %.
- Shadows only on things that float: dialogs, the command palette, menus.

## 5. Layout

- **Desktop:** a side rail (icons with labels, 76 px; 240 px when expanded) on the
  start side, mirrored in RTL. The strip across the top holds the page title,
  search (`Ctrl+K`) and the account. Content below the horizon.
- **Mobile (below 768 px):** the rail becomes a bottom bar of at most five items; the map
  becomes a vertical list of channels.
- Breakpoints 375, 768, 1024, 1440. No horizontal scroll at 375 px.

## 6. Motion

| Token | ms | For |
|---|---|---|
| `--dur-micro` | 120 | hover, press |
| `--dur-short` | 200 | toggles, chips, tooltips |
| `--dur-mid` | 320 | drawers, panels, list changes |
| `--dur-long` | 560 | page transitions |
| `--dur-scene` | 1200 | the login descent |

- Enter with `--ease-out`, leave with `--ease-in` and about 30 % faster.
- Water uses `--ease-water` and constant speed along a path.
- Only `transform` and `opacity` are animated; particles are drawn on a canvas.
- Everything moving has a meaning (traffic, a state change, where something went).
- `prefers-reduced-motion` and the low-power switch: particles stop (the channel shows
  a still gradient whose brightness follows throughput), transitions become short fades,
  the loader shows a static logo with a progress line.
- Animation pauses in a hidden tab and for parts of the map off screen.

## 7. Signature pieces

- **Loader:** two nodes; the link between them fills with light, and the far node lights up
  as it arrives, in a loop of about 1.6 s. Used at start-up (after the logo draws itself)
  and for long waits; short waits use a thin line under the top strip instead of a spinner.
- **Login:** a quiet network of servers drifting slowly, light moving along the links. The
  form sits in the middle. Success: the view zooms into the network (1.1 s) and the
  dashboard follows. Failure: the field shakes once and a red ring goes out from the middle.
  A one-time link signs in by itself, showing the zoom.
- **The map:** nodes around an ellipse, links between them, moving light for traffic. Hover
  a link for its numbers; click it to open the tunnel.
- **Odometer numbers:** counters roll digit by digit when they change.

## 8. Accessibility

- Keyboard reaches everything; the focus ring is `--focus-ring` and always visible.
- Touch targets at least 44 x 44 px.
- The map has a text alternative: a list of tunnels with their state and throughput.
- Live numbers update politely (`aria-live="polite"`, at most every few seconds).
- Labels above fields, errors under the field that caused them.

## 9. Screens

The prototype has every screen of the panel. What each one settles:

| Screen | Pattern |
|---|---|
| **Map** (home) | The live network; key numbers; the tunnel table with switches. |
| **Servers** | One row per server: a server mark whose side bar is its CPU load, name, location, role, architecture and version, IP and how it is linked to the panel, CPU / memory / network meters (a bar filling), its tunnels. The row opens a dialog with details and actions (restart the agent; remove, only when it carries no tunnels). |
| **Add a server** | A dialog: an optional name, who dials (the server dials the panel, recommended; or the panel dials the server), then the one-line command with a join code that works once and counts down from 10 minutes. The dialog waits with the link loader and turns to water when the server connects. |
| **Tunnels** | Filter chips with counts (all, flowing, broken, stopped), search over names, servers and ports, and a table with transport, profile, mode, port count, state, live rate and a switch. |
| **Tunnel detail** | The tunnel as one link between its two servers, with the actions (speed test, restart, stop/start, edit, delete). A broken tunnel gets a diagnosis band first: what fails, the likely cause, the steps, and a button that fixes the common case. Then key facts, the traffic chart (5 min live, 1 h, 24 h) with a hover read-out, forwarded ports, the speed test (water rising in a well), both configs as the panel writes them, and events. Delete asks for the tunnel's name. |
| **The wizard** | Full screen, five steps drawn as dots on a line that fills as you go: servers and who dials, transport and profile (tiles with four traits: hidden, speed, games, CDN), connection (the port checked against the listening server, IPv4 and IPv6 or IPv4 only, the address the dialer uses, the WebSocket path), ports (rules in the manager's syntax, parsed live into chips, with conflicts named: the tunnel or service that holds a port), and review with both configs. Creating digs the channel from both ends while a checklist runs (check, write both files, start both sides, handshake, first stream), then the water runs through. The same wizard edits a tunnel. |
| **Logs** | A live tail of both servers: filter by tunnel and level, search with highlighting, pause, clear. It follows new lines while you are at the bottom; scrolled up, it counts them on a "jump to the latest" button. |
| **Settings** | A section list on the side (a scrolling strip on phones) and rows of title, explanation and control: password (with a strength meter), one-time login links with a countdown, two-step sign-in (TOTP), active sessions with revoke, lockout; the panel address with its secret path, TLS (self-signed with its fingerprint, or Let's Encrypt for a domain); language, theme, digits, motion; updates per server; encrypted backup; the audit log. |

Everywhere: `Ctrl+K` opens commands (new tunnel, add a server, open any tunnel, make a login link); `N` starts a new tunnel; `Esc` closes a dialog or the wizard. Addresses, paths and ports are isolated as left-to-right text inside Persian sentences.

## 10. Fonts and licences

`fonts/` holds the three fonts (SIL Open Font License 1.1, texts next to them):
Estedad by Amin Abedi, Space Grotesk by Florian Karsten, IBM Plex Mono by IBM.
