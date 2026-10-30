//! `tunnel.fallback`: other addresses of the other side, for when `remote` is down.
//!
//! The dialing side tries `remote` first, then each fallback in turn, and stays on the one
//! that got through. While it is on a fallback, its sessions are renewed every
//! [`FAILBACK_EVERY`] (the replacement is connected first and the old session keeps its
//! streams until they end), and each renewal tries `remote` again, so the tunnel goes back
//! to it once it is up. A tunnel without fallbacks dials exactly as before.

use std::future::Future;
use std::io;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Duration;

use tokio::time::timeout;
use tracing::{debug, info, warn};

use crate::stats::Peer;

/// How long a session made over a fallback lives before `remote` is tried again.
pub const FAILBACK_EVERY: Duration = Duration::from_secs(60);
/// The time `remote` gets when it is tried again from a fallback: the tunnel still works
/// meanwhile, so a `remote` that is still down should not hold the renewal up for long.
const RETRY_REMOTE: Duration = Duration::from_secs(5);

/// The addresses of the other side, each with what dials it, in the order they are tried.
pub struct Failover<T> {
    targets: Vec<(String, T)>,
    /// The one that connected last.
    active: AtomicUsize,
    peer: Arc<Peer>,
}

impl<T> Failover<T> {
    /// `remote` and the fallbacks, from `tunnel.remote` and `tunnel.fallback`; `make` builds
    /// what dials one address.
    pub fn new<E>(
        remote: &str,
        fallback: &[String],
        peer: Arc<Peer>,
        mut make: impl FnMut(&str) -> Result<T, E>,
    ) -> Result<Self, E> {
        let mut targets = Vec::with_capacity(1 + fallback.len());
        for addr in std::iter::once(remote).chain(fallback.iter().map(String::as_str)) {
            targets.push((addr.to_owned(), make(addr)?));
        }
        if targets.len() > 1 {
            peer.set_remote(remote);
        }
        Ok(Self {
            targets,
            active: AtomicUsize::new(0),
            peer,
        })
    }

    /// The address in use now (the one that connected last).
    #[cfg(test)]
    fn active(&self) -> &str {
        &self.targets[self.active.load(Ordering::Relaxed)].0
    }

    /// How long a new session may live: `lifetime`, but at most [`FAILBACK_EVERY`] while the
    /// tunnel is on a fallback.
    pub fn lifetime(&self, lifetime: Option<Duration>) -> Option<Duration> {
        if self.active.load(Ordering::Relaxed) == 0 {
            lifetime
        } else {
            Some(lifetime.map_or(FAILBACK_EVERY, |l| l.min(FAILBACK_EVERY)))
        }
    }

    /// Connects with `attempt`, given each address in turn and `wait` for it: `remote`
    /// first, and from a fallback `remote` (briefly) and then the fallback in use. The last
    /// error comes back if none gets through.
    pub async fn connect<'a, R, F, Fut>(&'a self, wait: Duration, mut attempt: F) -> io::Result<R>
    where
        F: FnMut(&'a T) -> Fut,
        Fut: Future<Output = io::Result<R>>,
    {
        if let [(_, only)] = self.targets.as_slice() {
            return attempt(only).await;
        }
        let count = self.targets.len();
        let active = self.active.load(Ordering::Relaxed);
        let order = std::iter::once(0)
            .chain(active.max(1)..count)
            .chain(1..active.max(1));
        let mut last = None;
        for at in order {
            let (addr, target) = &self.targets[at];
            let wait = if at == 0 && active != 0 {
                wait.min(RETRY_REMOTE)
            } else {
                wait
            };
            let error = match timeout(wait, attempt(target)).await {
                Ok(Ok(connected)) => {
                    self.switched_to(at);
                    return Ok(connected);
                }
                Ok(Err(e)) => io::Error::new(e.kind(), format!("{addr}: {e}")),
                Err(_) => io::Error::new(
                    io::ErrorKind::TimedOut,
                    format!("{addr}: handshake timed out"),
                ),
            };
            debug!(remote = %addr, error = %error, "failover: could not connect");
            last = Some(error);
        }
        Err(last.unwrap_or_else(|| io::Error::other("no address to try")))
    }

    fn switched_to(&self, at: usize) {
        if self.active.swap(at, Ordering::Relaxed) == at {
            return;
        }
        let addr = &self.targets[at].0;
        self.peer.set_remote(addr);
        if at == 0 {
            info!(remote = %addr, "failover: back on the main address");
        } else {
            warn!(remote = %addr, "failover: the main address is down, using a fallback");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    fn failover(count: usize) -> Failover<usize> {
        let fallback: Vec<String> = (1..count).map(|i| format!("10.0.0.{i}:1")).collect();
        let mut next = 0;
        Failover::new("10.0.0.0:1", &fallback, Arc::default(), |_| {
            next += 1;
            Ok::<_, ()>(next - 1)
        })
        .unwrap()
    }

    /// Dials with `up` saying which addresses answer; returns the one used and the tries.
    async fn dial(f: &Failover<usize>, up: &[bool]) -> (io::Result<usize>, Vec<usize>) {
        let tried = Mutex::new(Vec::new());
        let result = f
            .connect(Duration::from_secs(1), |&i| {
                tried.lock().unwrap().push(i);
                let ok = up[i];
                async move {
                    if ok {
                        Ok(i)
                    } else {
                        Err(io::Error::new(io::ErrorKind::ConnectionRefused, "refused"))
                    }
                }
            })
            .await;
        (result, tried.into_inner().unwrap())
    }

    #[tokio::test]
    async fn one_address_is_dialed_as_before() {
        let f = failover(1);
        let (result, tried) = dial(&f, &[false]).await;
        assert_eq!(tried, [0]);
        // The error is the transport's own, without an address in front.
        assert_eq!(result.unwrap_err().to_string(), "refused");
        assert_eq!(f.lifetime(None), None);
    }

    #[tokio::test]
    async fn a_fallback_takes_over_and_remote_gets_it_back() {
        let f = failover(3);
        // remote is down: the first fallback that answers is used, and kept.
        let (result, tried) = dial(&f, &[false, false, true]).await;
        assert_eq!((result.unwrap(), tried), (2, vec![0, 1, 2]));
        assert_eq!(f.active(), "10.0.0.2:1");
        assert_eq!(f.lifetime(None), Some(FAILBACK_EVERY));
        assert_eq!(
            f.lifetime(Some(Duration::from_secs(10))),
            Some(Duration::from_secs(10))
        );
        // Still down: remote first, then straight to the fallback in use.
        let (result, tried) = dial(&f, &[false, true, true]).await;
        assert_eq!((result.unwrap(), tried), (2, vec![0, 2]));
        // remote is back: the tunnel returns to it.
        let (result, tried) = dial(&f, &[true, true, true]).await;
        assert_eq!((result.unwrap(), tried), (0, vec![0]));
        assert_eq!(f.lifetime(None), None);
    }

    #[tokio::test]
    async fn all_down_gives_the_last_error_with_its_address() {
        let f = failover(2);
        let (result, tried) = dial(&f, &[false, false]).await;
        assert_eq!(tried, [0, 1]);
        let e = result.unwrap_err();
        assert_eq!(e.kind(), io::ErrorKind::ConnectionRefused);
        assert_eq!(e.to_string(), "10.0.0.1:1: refused");
    }

    #[tokio::test]
    async fn a_stalled_address_is_given_up_on() {
        let f = failover(2);
        let started = std::time::Instant::now();
        let result = f
            .connect(Duration::from_millis(200), |&i| async move {
                if i == 0 {
                    std::future::pending::<()>().await;
                }
                Ok(i)
            })
            .await;
        assert_eq!(result.unwrap(), 1);
        assert!(started.elapsed() < Duration::from_secs(1));
    }
}
