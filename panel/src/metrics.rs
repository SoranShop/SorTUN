//! `/metrics`: the servers and tunnels in the Prometheus text format, for Prometheus,
//! VictoriaMetrics or Grafana Agent to scrape.
//!
//! Off until the admin turns it on in *Settings*, which makes a token for it: a scrape sends
//! it as `Authorization: Bearer <token>`. Only its hash is kept, like a session's. While it
//! is off, and without the right token, the address answers like any unknown one.

use std::fmt::Write as _;

use anyhow::Result;
use axum::http::{header, HeaderMap};

use crate::auth;
use crate::db::Db;
use crate::hub::{ServerView, TunnelView};

/// The hash of the scrape token; empty or missing while `/metrics` is off.
const TOKEN_KEY: &str = "metrics_token";
/// What every metric's name starts with.
const PREFIX: &str = "sortun";

pub fn enabled(db: &Db) -> Result<bool> {
    Ok(db.meta(TOKEN_KEY)?.is_some_and(|h| !h.is_empty()))
}

/// Turns `/metrics` on with a new token (a token made before stops working), and gives it
/// back: it is shown once.
pub fn enable(db: &Db) -> Result<String> {
    let token = auth::new_token()?;
    db.set_meta(TOKEN_KEY, &auth::hash_token(&token))?;
    Ok(token)
}

pub fn disable(db: &Db) -> Result<()> {
    db.set_meta(TOKEN_KEY, "")
}

/// Whether a scrape with these headers may read the metrics.
pub fn allowed(db: &Db, headers: &HeaderMap) -> bool {
    let Some(sent) = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
    else {
        return false;
    };
    // Hashes are compared, so the time it takes says nothing about the token.
    db.meta(TOKEN_KEY)
        .ok()
        .flatten()
        .is_some_and(|stored| !stored.is_empty() && stored == auth::hash_token(sent.trim()))
}

/// One metric and its samples, written together as the format wants.
struct Family {
    name: &'static str,
    help: &'static str,
    kind: &'static str,
    samples: Vec<(String, f64)>,
}

impl Family {
    fn new(name: &'static str, kind: &'static str, help: &'static str) -> Self {
        Self {
            name,
            help,
            kind,
            samples: Vec::new(),
        }
    }

    fn add(&mut self, labels: &str, value: impl Into<Option<f64>>) {
        if let Some(value) = value.into() {
            self.samples.push((labels.to_owned(), value));
        }
    }
}

/// A label value as the format quotes it.
fn escape(value: &str) -> String {
    value
        .replace('\\', r"\\")
        .replace('"', "\\\"")
        .replace('\n', r"\n")
}

fn bool_value(b: bool) -> f64 {
    if b {
        1.0
    } else {
        0.0
    }
}

/// The metrics of these servers and their tunnels, in the Prometheus text format.
pub fn render(servers: &[ServerView]) -> String {
    let mut up = Family::new(
        "server_up",
        "gauge",
        "1 while the server's agent is connected.",
    );
    let mut cpu = Family::new(
        "server_cpu_percent",
        "gauge",
        "Busy share of all CPUs, 0-100.",
    );
    let mut mem_used = Family::new("server_memory_used_bytes", "gauge", "Memory in use.");
    let mut mem_total = Family::new("server_memory_total_bytes", "gauge", "Memory in all.");
    let mut rx = Family::new(
        "server_network_receive_bytes_per_second",
        "gauge",
        "Bytes per second the network cards received.",
    );
    let mut tx = Family::new(
        "server_network_transmit_bytes_per_second",
        "gauge",
        "Bytes per second the network cards sent.",
    );
    let mut load = Family::new("server_load1", "gauge", "Load average over one minute.");
    let mut server_uptime = Family::new(
        "server_uptime_seconds",
        "gauge",
        "Seconds since the server started.",
    );
    let mut active = Family::new(
        "tunnel_active",
        "gauge",
        "1 while the tunnel's service runs.",
    );
    let mut connected = Family::new(
        "tunnel_connected",
        "gauge",
        "1 while the tunnel is connected to its other side.",
    );
    let mut sessions = Family::new("tunnel_sessions", "gauge", "Live sessions (with mux).");
    let mut rtt = Family::new(
        "tunnel_rtt_seconds",
        "gauge",
        "Round-trip time to the other side.",
    );
    let mut bytes_up = Family::new(
        "tunnel_sent_bytes_total",
        "counter",
        "Bytes of users' data towards the targets since the tunnel started.",
    );
    let mut bytes_down = Family::new(
        "tunnel_received_bytes_total",
        "counter",
        "Bytes of users' data back to the users since the tunnel started.",
    );
    let mut tcp_open = Family::new("tunnel_tcp_connections", "gauge", "Open TCP connections.");
    let mut udp_flows = Family::new("tunnel_udp_flows", "gauge", "Open UDP flows.");
    let mut failed = Family::new(
        "tunnel_handshakes_failed_total",
        "counter",
        "Failed attempts to connect to or authenticate the other side.",
    );
    let mut streams = Family::new("tunnel_streams", "gauge", "Open streams over all sessions.");
    let mut tunnel_uptime = Family::new(
        "tunnel_uptime_seconds",
        "gauge",
        "Seconds since the tunnel's process started.",
    );
    let mut on_fallback = Family::new(
        "tunnel_on_fallback",
        "gauge",
        "With tunnel.fallback: 1 while the tunnel uses a fallback address, not tunnel.remote.",
    );

    for server in servers {
        let labels = format!(
            r#"server="{}",server_id="{}""#,
            escape(&server.name),
            escape(&server.id)
        );
        up.add(&labels, bool_value(server.online));
        if let Some(h) = server.health.as_ref().filter(|_| server.online) {
            cpu.add(&labels, h.cpu_pct);
            mem_used.add(&labels, h.mem_used.map(|v| v as f64));
            mem_total.add(&labels, h.mem_total.map(|v| v as f64));
            rx.add(&labels, h.rx_bps);
            tx.add(&labels, h.tx_bps);
            load.add(&labels, h.load1);
            server_uptime.add(&labels, h.uptime_secs.map(|v| v as f64));
        }
        for tunnel in &server.tunnels {
            let labels = tunnel_labels(&labels, tunnel);
            let info = &tunnel.info;
            active.add(&labels, info.active.map(bool_value));
            let Some(status) = &info.status else {
                continue;
            };
            let peer = &status.peer;
            connected.add(&labels, bool_value(peer.connected));
            sessions.add(&labels, peer.sessions.map(|v| v as f64));
            rtt.add(&labels, peer.rtt_ms.map(|ms| ms / 1000.0));
            streams.add(&labels, peer.streams.map(|v| v as f64));
            failed.add(&labels, peer.handshakes_failed as f64);
            bytes_up.add(&labels, status.totals.bytes_up as f64);
            bytes_down.add(&labels, status.totals.bytes_down as f64);
            tcp_open.add(&labels, status.totals.tcp_open as f64);
            udp_flows.add(&labels, status.totals.udp_flows as f64);
            tunnel_uptime.add(&labels, status.uptime_secs as f64);
            if let Some(remote) = &peer.remote {
                on_fallback.add(
                    &labels,
                    bool_value(info.remote.as_deref() != Some(remote.as_str())),
                );
            }
        }
    }

    let mut out = String::new();
    for family in [
        up,
        cpu,
        mem_used,
        mem_total,
        rx,
        tx,
        load,
        server_uptime,
        active,
        connected,
        sessions,
        rtt,
        bytes_up,
        bytes_down,
        tcp_open,
        udp_flows,
        failed,
        streams,
        tunnel_uptime,
        on_fallback,
    ] {
        if family.samples.is_empty() {
            continue;
        }
        let name = format!("{PREFIX}_{}", family.name);
        let _ = writeln!(out, "# HELP {name} {}", family.help);
        let _ = writeln!(out, "# TYPE {name} {}", family.kind);
        for (labels, value) in &family.samples {
            let _ = writeln!(out, "{name}{{{labels}}} {value}");
        }
    }
    out
}

fn tunnel_labels(server: &str, tunnel: &TunnelView) -> String {
    let info = &tunnel.info;
    format!(
        r#"{server},tunnel="{}",role="{}",transport="{}""#,
        escape(&info.name),
        escape(&info.role),
        escape(&info.transport)
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderValue;

    fn bearer(token: &str) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert(
            header::AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {token}")).unwrap(),
        );
        headers
    }

    #[test]
    fn a_scrape_needs_the_latest_token() {
        let db = Db::in_memory().unwrap();
        assert!(!enabled(&db).unwrap());
        assert!(!allowed(&db, &bearer("")));
        let first = enable(&db).unwrap();
        assert!(enabled(&db).unwrap());
        assert!(allowed(&db, &bearer(&first)));
        assert!(!allowed(&db, &bearer("not-it")));
        assert!(!allowed(&db, &HeaderMap::new()));
        // A new token replaces the old one.
        let second = enable(&db).unwrap();
        assert!(!allowed(&db, &bearer(&first)));
        assert!(allowed(&db, &bearer(&second)));
        disable(&db).unwrap();
        assert!(!enabled(&db).unwrap());
        assert!(!allowed(&db, &bearer(&second)));
    }

    fn server(tunnel_status: Option<sortun::stats::Status>) -> ServerView {
        use crate::wire::{Health, TunnelInfo};
        ServerView {
            id: "s1".into(),
            name: "Frankfurt \"1\"".into(),
            local: false,
            online: true,
            version: "2.8.0".into(),
            arch: "x86_64".into(),
            hostname: "fra".into(),
            addr: None,
            addr_default: None,
            addr6: None,
            addr6_default: None,
            seen_secs: Some(1),
            link: Some("tcpmux".into()),
            last_seen: None,
            last_error: None,
            gre: None,
            reverse: None,
            agent_port: None,
            health: Some(Health {
                cpu_pct: Some(12.5),
                mem_total: Some(2048),
                mem_used: Some(1024),
                rx_bps: Some(100.0),
                tx_bps: None,
                net: None,
                uptime_secs: Some(60),
                load1: Some(0.5),
                routes: Vec::new(),
                ip4: None,
                ip6: None,
            }),
            ip4: None,
            ip6: None,
            tunnels: vec![TunnelView {
                info: TunnelInfo {
                    name: "web".into(),
                    role: "exit".into(),
                    mode: "reverse".into(),
                    transport: "tcpmux".into(),
                    profile: "balanced".into(),
                    encryption: String::new(),
                    listen: None,
                    remote: Some("203.0.113.1:3080".into()),
                    forwards: Vec::new(),
                    active: Some(true),
                    status: tunnel_status,
                    error: None,
                },
                rate_mbps: None,
            }],
        }
    }

    #[test]
    fn servers_and_tunnels_become_metrics() {
        let mut status = crate::alerts::tests::status(true);
        status.peer.rtt_ms = Some(40.0);
        status.peer.remote = Some("203.0.113.2:3080".into());
        status.totals.bytes_up = 5000;
        let text = render(&[server(Some(status))]);
        let who = r#"server="Frankfurt \"1\"",server_id="s1""#;
        let tunnel = format!(r#"{who},tunnel="web",role="exit",transport="tcpmux""#);
        for line in [
            format!("sortun_server_up{{{who}}} 1"),
            format!("sortun_server_cpu_percent{{{who}}} 12.5"),
            format!("sortun_server_memory_used_bytes{{{who}}} 1024"),
            format!("sortun_tunnel_active{{{tunnel}}} 1"),
            format!("sortun_tunnel_connected{{{tunnel}}} 1"),
            format!("sortun_tunnel_rtt_seconds{{{tunnel}}} 0.04"),
            format!("sortun_tunnel_sent_bytes_total{{{tunnel}}} 5000"),
            // It runs on a fallback: not tunnel.remote.
            format!("sortun_tunnel_on_fallback{{{tunnel}}} 1"),
        ] {
            assert!(text.lines().any(|l| l == line), "{line} not in:\n{text}");
        }
        assert!(text.contains("# TYPE sortun_tunnel_sent_bytes_total counter"));
        // Nothing is said that is not known: no transmit rate, no rows without samples.
        assert!(!text.contains("transmit"));
        assert!(!text.contains("sortun_tunnel_sessions"), "{text}");
        // A tunnel whose daemon does not answer has only its service state.
        let text = render(&[server(None)]);
        assert!(text.contains("sortun_tunnel_active{"));
        assert!(!text.contains("sortun_tunnel_connected"));
    }

    #[test]
    fn label_values_are_quoted() {
        assert_eq!(escape(r#"a"b\c"#), r#"a\"b\\c"#);
        assert_eq!(escape("a\nb"), r"a\nb");
    }
}
