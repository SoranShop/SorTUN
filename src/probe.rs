//! `sortun probe`: before a tunnel is made, which transports get through between two servers,
//! with no panel. One server listens (`sortun probe listen`) and prints one command with a
//! code in it; the other runs that command (`sortun probe dial CODE`), tries every transport
//! over IPv4 and IPv6 and says which connected, how fast the handshake was and the round
//! trips, and which did not, with why.
//!
//! The test sessions are the web panel's benchmark ones ([`crate::bench`]): the tunnel's own
//! handshake, records and mux, with a token made for the test. Nothing is written to the
//! servers and no tunnel is made. Each transport has a port of its own, so all of them listen
//! at once: TCP on the port itself (`tcpmux`), the next (`ws`) and the one after (`wss`), UDP
//! on the port itself (`kcp`) and the next (`quic`).

use std::io;
use std::net::{IpAddr, SocketAddr, UdpSocket};
use std::path::{Path, PathBuf};
use std::time::Duration;

use base64::Engine;
use serde::{Deserialize, Serialize};
use tokio::task::JoinSet;
use tokio::time::Instant;

use crate::bench;
use crate::config::TransportKind;
use crate::link::Acceptor;
use crate::speedtest::Latency;

/// What starts a code, so a wrong paste is told apart from a broken one.
const PREFIX: &str = "sp1.";
/// How long one transport is given to connect before it counts as not getting through.
pub const DIAL_LIMIT: Duration = Duration::from_secs(8);
/// How long the round trips of one that got through are measured.
const PROBE_FOR: Duration = Duration::from_secs(2);

/// The port a transport is tested on, from the probe's own port.
pub fn port_of(kind: TransportKind, port: u16) -> Option<u16> {
    let offset = match kind {
        TransportKind::Tcpmux | TransportKind::Kcp => 0,
        TransportKind::Ws | TransportKind::Quic => 1,
        TransportKind::Wss => 2,
        _ => return None,
    };
    port.checked_add(offset)
}

/// What the dialing server needs: where the listening one is and the test's token.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Code {
    /// The listening server's addresses (IPv4 and IPv6), without a port.
    #[serde(rename = "a")]
    pub addrs: Vec<String>,
    #[serde(rename = "p")]
    pub port: u16,
    #[serde(rename = "t")]
    pub token: String,
}

impl Code {
    pub fn encode(&self) -> String {
        let json = serde_json::to_vec(self).expect("a code serializes");
        format!(
            "{PREFIX}{}",
            base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(json)
        )
    }

    pub fn decode(text: &str) -> io::Result<Self> {
        let bad = |why: &str| {
            let text = format!("not a probe code ({why}): copy the whole line it was in");
            io::Error::new(io::ErrorKind::InvalidInput, text)
        };
        let body = text.trim().strip_prefix(PREFIX);
        let body = body.ok_or_else(|| bad("it starts with sp1."))?;
        let json = base64::engine::general_purpose::URL_SAFE_NO_PAD
            .decode(body)
            .map_err(|_| bad("it is cut or changed"))?;
        let code: Self = serde_json::from_slice(&json).map_err(|_| bad("it is cut or changed"))?;
        if code.addrs.is_empty() || code.token.len() < 16 {
            return Err(bad("it has no address"));
        }
        Ok(code)
    }
}

/// A new random token for a test.
pub fn new_token() -> io::Result<String> {
    let mut bytes = [0u8; 16];
    getrandom::fill(&mut bytes).map_err(io::Error::other)?;
    Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
}

/// The addresses this server's routes to the internet leave from, IPv4 then IPv6 (found
/// without sending anything). Behind NAT the IPv4 one is private: say the public one with
/// `--host`.
pub fn own_addrs() -> Vec<IpAddr> {
    let mut found = Vec::new();
    for (bind, target) in [("0.0.0.0:0", "192.0.2.1:9"), ("[::]:0", "[2001:db8::1]:9")] {
        let addr = UdpSocket::bind(bind).and_then(|s| {
            s.connect(target)?;
            s.local_addr()
        });
        if let Ok(addr) = addr {
            if !addr.ip().is_unspecified() {
                found.push(addr.ip());
            }
        }
    }
    found
}

/// Whether `ip` is an address other servers can reach as it is.
pub fn is_public(ip: &IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            // 100.64.0.0/10 is carrier NAT's.
            let carrier = v4.octets()[0] == 100 && (v4.octets()[1] & 0xc0) == 64;
            !(v4.is_private() || v4.is_loopback() || v4.is_link_local() || carrier)
        }
        IpAddr::V6(v6) => {
            let first = v6.segments()[0];
            !(v6.is_loopback() || (first & 0xfe00) == 0xfc00 || (first & 0xffc0) == 0xfe80)
        }
    }
}

/// `addr` with `port`, IPv6 in brackets.
pub fn with_port(addr: &str, port: u16) -> String {
    match addr.parse::<IpAddr>() {
        Ok(IpAddr::V6(_)) => format!("[{addr}]:{port}"),
        _ => format!("{addr}:{port}"),
    }
}

/// The listening end: every transport listens on its port until `wait` has passed, and
/// answers each test session that comes (the dialing end makes one per transport and
/// address). `on_listen` hears, for each transport, where it listens or why it cannot.
/// `tls` is the certificate and key the `wss` listener serves; without it, `wss` is left out.
pub async fn serve(
    port: u16,
    token: &str,
    profile: &str,
    wait: Duration,
    tls: Option<(&Path, &Path)>,
    on_listen: impl Fn(TransportKind, io::Result<SocketAddr>),
) -> io::Result<()> {
    let deadline = Instant::now() + wait;
    let mut tasks = JoinSet::new();
    for kind in bench::TRANSPORTS {
        let Some(at) = port_of(kind, port) else {
            continue;
        };
        let cert = match kind {
            TransportKind::Wss => match tls {
                Some((c, k)) => Some((c.to_path_buf(), k.to_path_buf())),
                None => continue,
            },
            _ => None,
        };
        // Every address, both families where the system allows it.
        let acceptor = match listen_any(at, token, kind, profile, &cert).await {
            Ok((acceptor, addr)) => {
                on_listen(kind, Ok(addr));
                acceptor
            }
            Err(e) => {
                on_listen(kind, Err(e));
                continue;
            }
        };
        let (token, profile) = (token.to_owned(), profile.to_owned());
        tasks.spawn(async move {
            let mut acceptor = Some(acceptor);
            // One session per listener: listen again for the next one, until the deadline.
            while let Some(left) = deadline.checked_duration_since(Instant::now()) {
                let current = match acceptor.take() {
                    Some(a) => a,
                    None => match listen_any(at, &token, kind, &profile, &cert).await {
                        Ok((a, _)) => a,
                        Err(_) => {
                            tokio::time::sleep(Duration::from_millis(200)).await;
                            continue;
                        }
                    },
                };
                if bench::answer(current, left).await.is_err() {
                    break;
                }
            }
        });
    }
    if tasks.is_empty() {
        return Err(io::Error::other("no transport could listen"));
    }
    while tasks.join_next().await.is_some() {}
    Ok(())
}

async fn listen_any(
    port: u16,
    token: &str,
    kind: TransportKind,
    profile: &str,
    cert: &Option<(PathBuf, PathBuf)>,
) -> io::Result<(Acceptor, SocketAddr)> {
    let tls = cert.as_ref().map(|(c, k)| (c.as_path(), k.as_path()));
    let acceptor = match bench::listen(&format!("[::]:{port}"), token, kind, profile, tls).await {
        Ok(a) => a,
        // A system without IPv6: IPv4 alone.
        Err(_) => bench::listen(&format!("0.0.0.0:{port}"), token, kind, profile, tls).await?,
    };
    let addr = acceptor.local_addr()?;
    Ok((acceptor, addr))
}

/// What one transport over one address did.
#[derive(Debug, Clone, PartialEq)]
pub struct Outcome {
    pub kind: TransportKind,
    /// The address it dialed (with the port).
    pub addr: String,
    pub result: Result<Reached, String>,
}

/// A transport that got through.
#[derive(Debug, Clone, PartialEq)]
pub struct Reached {
    /// The connection and the handshake, in milliseconds.
    pub handshake_ms: f64,
    pub latency: Latency,
    /// Mbit/s each way, when the speed was measured.
    pub download_mbps: Option<f64>,
    pub upload_mbps: Option<f64>,
}

/// The dialing end: every transport to every address of `code`, one after another (so they
/// do not slow each other). `speed_secs` > 0 also moves data each way that long over the ones
/// that got through. `on_outcome` hears of each as it is done.
pub async fn run(
    code: &Code,
    profile: &str,
    speed_secs: u64,
    on_outcome: impl Fn(&Outcome),
) -> Vec<Outcome> {
    let mut all = Vec::new();
    for host in &code.addrs {
        for kind in bench::TRANSPORTS {
            let Some(port) = port_of(kind, code.port) else {
                continue;
            };
            let addr = with_port(host, port);
            let result = try_one(&addr, &code.token, kind, profile, speed_secs)
                .await
                .map_err(|e| why(&e));
            let outcome = Outcome { kind, addr, result };
            on_outcome(&outcome);
            all.push(outcome);
        }
    }
    all
}

async fn try_one(
    addr: &str,
    token: &str,
    kind: TransportKind,
    profile: &str,
    speed_secs: u64,
) -> io::Result<Reached> {
    let (session, handshake_ms) = bench::dial(addr, token, kind, profile, None, DIAL_LIMIT).await?;
    let latency = bench::probe(&session, PROBE_FOR).await?;
    let (mut download_mbps, mut upload_mbps) = (None, None);
    if speed_secs > 0 {
        if let Ok(speed) = bench::speed(&session, speed_secs, 4).await {
            download_mbps = Some(speed.download.mbps);
            upload_mbps = Some(speed.upload.mbps);
        }
    }
    session.close();
    Ok(Reached {
        handshake_ms,
        latency,
        download_mbps,
        upload_mbps,
    })
}

/// Why a transport did not get through, in a few words.
fn why(e: &io::Error) -> String {
    use io::ErrorKind::*;
    let text = match e.kind() {
        TimedOut => "no answer in time (filtered, or closed on the way)",
        ConnectionRefused => "refused (nothing listens there, or a firewall says no)",
        ConnectionReset | BrokenPipe | UnexpectedEof => "cut off in the handshake (a filter?)",
        PermissionDenied => "the other end refused the token (another test's code?)",
        _ => return e.to_string(),
    };
    text.to_owned()
}

/// The one that got through best: the lowest round trips, then the fastest handshake.
pub fn best(outcomes: &[Outcome]) -> Option<&Outcome> {
    outcomes
        .iter()
        .filter(|o| o.result.as_ref().is_ok_and(|r| r.latency.received > 0))
        .min_by(|a, b| {
            let (a, b) = (a.result.as_ref().unwrap(), b.result.as_ref().unwrap());
            (a.latency.p50_ms, a.handshake_ms)
                .partial_cmp(&(b.latency.p50_ms, b.handshake_ms))
                .unwrap_or(std::cmp::Ordering::Equal)
        })
}

/// A throwaway certificate for the `wss` listener, in `dir` (the dialing end checks no
/// certificate: the token handshake inside proves who is there). An error in a build without
/// the certificate maker.
#[cfg(feature = "quic")]
pub fn self_signed(dir: &Path) -> io::Result<(PathBuf, PathBuf)> {
    let made = rcgen::generate_simple_self_signed(vec!["probe.invalid".to_owned()])
        .map_err(io::Error::other)?;
    let (cert, key) = (dir.join("probe.crt"), dir.join("probe.key"));
    // As PEM by hand: rcgen writes PEM only with a feature this crate does not turn on.
    std::fs::write(&cert, pem("CERTIFICATE", made.cert.der()))?;
    let private = pem("PRIVATE KEY", &made.signing_key.serialize_der());
    write_private(&key, private.as_bytes())?;
    Ok((cert, key))
}

/// `der` in a PEM block with `label`, 64 characters to a line.
#[cfg(feature = "quic")]
fn pem(label: &str, der: &[u8]) -> String {
    let text = base64::engine::general_purpose::STANDARD.encode(der);
    let mut out = format!("-----BEGIN {label}-----\n");
    for line in text.as_bytes().chunks(64) {
        out.push_str(std::str::from_utf8(line).expect("base64 is ASCII"));
        out.push('\n');
    }
    out.push_str(&format!("-----END {label}-----\n"));
    out
}

#[cfg(not(feature = "quic"))]
pub fn self_signed(_: &Path) -> io::Result<(PathBuf, PathBuf)> {
    Err(io::Error::other(
        "this build cannot make a certificate (the `quic` feature is off)",
    ))
}

#[cfg(feature = "quic")]
fn write_private(path: &Path, data: &[u8]) -> io::Result<()> {
    use std::io::Write;
    let mut options = std::fs::OpenOptions::new();
    options.write(true).create(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    options.open(path)?.write_all(data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_code_goes_there_and_back() {
        let code = Code {
            addrs: vec!["203.0.113.5".into(), "2001:db8::5".into()],
            port: 41000,
            token: "0123456789abcdef0123456789abcdef".into(),
        };
        let text = code.encode();
        assert!(text.starts_with("sp1."));
        assert_eq!(Code::decode(&format!("  {text}\n")).unwrap(), code);
        assert!(Code::decode("kz1_abc")
            .unwrap_err()
            .to_string()
            .contains("sp1."));
        assert!(Code::decode(&text[..text.len() - 6]).is_err());
    }

    #[test]
    fn each_transport_has_its_port_and_addresses_their_brackets() {
        assert_eq!(port_of(TransportKind::Tcpmux, 9000), Some(9000));
        assert_eq!(port_of(TransportKind::Kcp, 9000), Some(9000));
        assert_eq!(port_of(TransportKind::Ws, 9000), Some(9001));
        assert_eq!(port_of(TransportKind::Quic, 9000), Some(9001));
        assert_eq!(port_of(TransportKind::Wss, 9000), Some(9002));
        assert_eq!(port_of(TransportKind::Wss, u16::MAX), None);
        assert_eq!(with_port("2001:db8::1", 80), "[2001:db8::1]:80");
        assert_eq!(with_port("1.2.3.4", 80), "1.2.3.4:80");
        assert!(!is_public(&"10.1.2.3".parse().unwrap()));
        assert!(!is_public(&"100.64.0.1".parse().unwrap()));
        assert!(!is_public(&"fd00::1".parse().unwrap()));
        assert!(is_public(&"203.0.113.5".parse().unwrap()));
    }

    fn free_port() -> u16 {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        listener.local_addr().unwrap().port()
    }

    /// Both ends on this machine: every transport gets through (`wss` when a certificate can
    /// be made).
    #[tokio::test(flavor = "multi_thread")]
    async fn every_transport_gets_through_on_loopback() {
        let port = free_port().min(u16::MAX - 3);
        let token = new_token().unwrap();
        let dir = std::env::temp_dir().join(format!("sortun-probe-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let tls = self_signed(&dir).ok();
        let server = {
            let (token, tls) = (token.clone(), tls.clone());
            tokio::spawn(async move {
                let tls = tls.as_ref().map(|(c, k)| (c.as_path(), k.as_path()));
                let wait = Duration::from_secs(30);
                serve(port, &token, "balanced", wait, tls, |_, _| {}).await
            })
        };
        tokio::time::sleep(Duration::from_millis(300)).await;
        let code = Code {
            addrs: vec!["127.0.0.1".into()],
            port,
            token,
        };
        let outcomes = run(&code, "balanced", 0, |_| {}).await;
        let all = bench::TRANSPORTS.len();
        let expected = if tls.is_some() { all } else { all - 1 };
        let ok = outcomes.iter().filter(|o| o.result.is_ok()).count();
        assert_eq!(ok, expected, "{outcomes:#?}");
        assert!(best(&outcomes).is_some());
        server.abort();
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// A code for a port where nothing listens says so for each transport.
    #[tokio::test]
    async fn nothing_listening_is_said_for_each() {
        let code = Code {
            addrs: vec!["127.0.0.1".into()],
            port: free_port().min(u16::MAX - 3),
            token: new_token().unwrap(),
        };
        let started = std::time::Instant::now();
        let outcomes = run(&code, "balanced", 0, |_| {}).await;
        assert!(outcomes.iter().all(|o| o.result.is_err()), "{outcomes:#?}");
        assert!(best(&outcomes).is_none());
        // UDP has nothing to refuse it: those wait out their limit, TCP is told at once.
        let most = DIAL_LIMIT * (bench::TRANSPORTS.len() as u32 + 1);
        assert!(started.elapsed() < most);
    }
}
