<p align="center">
  <img src="assets/banner.png" alt="SorTUN. Your servers, linked. Your traffic, through." width="100%">
</p>

<p align="center">
  <a href="https://github.com/soranshop/SorTUN/actions/workflows/ci.yml"><img src="https://github.com/soranshop/SorTUN/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/soranshop/SorTUN/releases"><img src="https://img.shields.io/github/v/release/soranshop/SorTUN?label=version&color=34d0c3" alt="Latest release"></a>
  <img src="https://img.shields.io/badge/rust-1.80%2B-e9c46a?logo=rust" alt="Rust 1.80+">
  <img src="https://img.shields.io/badge/platform-linux-12365e?logo=linux&logoColor=white" alt="Linux">
</p>

<p align="center">
  <b>English</b> · <a href="README_FA.md">فارسی</a> ·
  <a href="https://soranshop.github.io/SorTUN/">Website</a> ·
  <a href="https://soranshop.github.io/SorTUN/docs/">Documentation</a> ·
  <a href="https://soranshop.github.io/SorTUN/try/">Live demo</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

---

**SorTUN** joins two servers with a fast, encrypted tunnel. Your users connect to the **entry**,
and SorTUN carries their TCP and UDP traffic to the **exit**, which reaches the real
destinations.

```mermaid
flowchart LR
    U([Users]) -->|TCP / UDP| E[Entry]
    E <==>|"SorTUN tunnel<br/>tcp · tcpmux · ws · wss · quic · kcp"| X[Exit]
    X --> T([Targets])
```

It is one small Rust program (about 8 MiB of memory per side, no garbage collector), and a web panel
to run it: servers, tunnels, charts and logs in a browser.

<p align="center">
  <img src="assets/screens/map-night-en.png" alt="The panel's map: servers as nodes, tunnels as the links between them, with live traffic" width="92%">
</p>

<table align="center">
  <tr>
    <td align="center" width="62%"><img src="assets/screens/tunnels-dawn-en.png" alt="The tunnels page in the light theme" width="100%"></td>
    <td align="center" width="26%"><img src="assets/screens/servers-phone-en.png" alt="The servers page on a phone" width="100%"></td>
  </tr>
</table>

## Install

On the server that will hold the panel, as root:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/soranshop/SorTUN/main/scripts/sortun.sh)
```

The script finds your CPU (x86_64, aarch64 or armv7), downloads the latest release, checks its
signature and opens a menu. Choose **Install the web panel here**: it prints the panel's address and a
one-time login link. From then on you work in the browser. Add your other servers (each runs one command
with a code from the panel), then make a tunnel between any two of them with the wizard.

Want to look first? The [live demo](https://soranshop.github.io/SorTUN/try/) runs the real panel on sample data.

## What you get

- **Six transports.** `tcp`, `tcpmux`, `ws` and `wss` (for CDNs and sites that must look like HTTPS), and
  `quic` and `kcp` over UDP for long or lossy paths. `quic` can be sealed packet by packet, so it does
  not look like QUIC to a network that filters it.
- **Both directions.** The exit can dial the entry (`reverse`) or the other way round (`direct`), with
  automatic reconnects.
- **TCP and UDP.** WireGuard, DNS and games work through it; on `kcp` and `quic` a lost packet delays
  nothing else, and games get FEC and optional packet duplication.
- **A panel that undoes its mistakes.** The tunnel wizard checks both servers first, and if anything fails
  it puts both back as they were. Live map, charts, logs, speed test, backups, private networks and
  updates are in the same place.
- **Real usage.** Every tunnel and server shows what it used today, this week, this month
  and in total, on charts by hour, day or month (Solar Hijri or Gregorian), counted from the kernel's
  own counters with headers and resends, and split into users' data and overhead. A server can have a
  monthly quota that warns before it runs out.
- **Alerts in Telegram.** Your own bot tells you when a server goes offline or a tunnel goes down (and
  when it is back), and answers `/status` with every server and tunnel. It can go through a proxy or a
  tunnel where Telegram is blocked. [Set it up](https://soranshop.github.io/SorTUN/docs/telegram/).
- **Signed releases.** The install script, the panel and its agents verify a release's signature before
  they run anything from it.

## Documentation

Everything else is on the website, in English and Persian:

| | |
|---|---|
| [Getting started](https://soranshop.github.io/SorTUN/docs/getting-started/) | install, the first tunnel, systemd |
| [Using the panel](https://soranshop.github.io/SorTUN/docs/using-the-panel/) · [Guided tour](https://soranshop.github.io/SorTUN/docs/tour/) | the panel, page by page |
| [The manager script](https://soranshop.github.io/SorTUN/docs/manager/) | installing, updating, the menu |
| [Transports](https://soranshop.github.io/SorTUN/docs/transports/) · [Which one?](https://soranshop.github.io/SorTUN/docs/how-it-works/) | choosing and tuning |
| [Configuration reference](https://soranshop.github.io/SorTUN/docs/configuration/) | every setting, default and limit |
| [UDP and games](https://soranshop.github.io/SorTUN/docs/udp-and-games/) · [CDN](https://soranshop.github.io/SorTUN/docs/cdn/) | specific setups |
| [Troubleshooting](https://soranshop.github.io/SorTUN/docs/troubleshooting/) · [Security](https://soranshop.github.io/SorTUN/docs/security/) | when something is wrong |
| [Changelog](https://soranshop.github.io/SorTUN/docs/changelog/) | what changed in each version |

The same pages are the Markdown files in [`docs/`](docs/README.md) (Persian: [`docs/fa/`](docs/fa/README.md)).

## Build from source

```bash
cargo build --release                         # target/release/sortun
cargo test                                    # nginx tests run too when nginx is installed
cargo build --release --no-default-features   # without quic and kcp
```

The panel's web app is in `panel/web` (`npm ci && npm run build`), the website in `site/`. The design and the
protocol are described in [docs/ROADMAP.md](docs/ROADMAP.md).

## Support

SorTUN is made by one person and is free to run on your own servers. If it helps you and you want it to go on,
you can donate; it is never required. Send each coin **only on the network shown next to it**: a coin sent on
another network cannot be recovered. (The same, in [English](docs/support.md) and [Persian](docs/fa/support.md), is on the website.)

| Coin | Network | Address |
|---|---|---|
| USDT | TRON (TRC20) | `TKM87mEXhUpEBzqvNxs1qjM4EddX6VMXmw` |
| Gram | TON | `UQDfjT-h4ENIrt_Sq5-zBy9TvhckniwSLCkS7zIVX4fVSaFw` |
| Bitcoin (BTC) | Bitcoin | `bc1qc4cgy5etuwj2375c5zqma7xmjtk59s5s49rfp5` |

A star on the repository, a report of a problem with its log, and a word to other server operators help just as much.

## License

SorTUN is **source-available, not open source**. You may read the code and run the official releases on your
own servers; using the core (or anything in it) anywhere else, copying it or redistributing it is not allowed.
The full terms are in [LICENSE](LICENSE).

<p align="center"><sub>© ErfanXRay</sub></p>
