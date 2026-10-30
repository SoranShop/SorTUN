#!/usr/bin/env bash
# A server set up before 3.0 (the Kariz names) moves to SorTUN's: its tunnels, panel and agent
# settings, data and certificates go to the new places, the paths in them follow, certbot's
# renewal settings name the new manager, the old programs and units go, and what ran runs
# again under the new names. systemctl and the install are stand-ins; everything is in a
# temporary directory.
# Usage: bash tests/migrate.sh (no root, nothing on the system is touched).
set -euo pipefail

# shellcheck source=scripts/sortun.sh
source "$(dirname "$0")/../scripts/sortun.sh"
set +e

root=$(mktemp -d)
trap 'rm -rf "$root"' EXIT
BIN=$root/bin/sortun
PANEL_BIN=$root/bin/sortun-panel
MANAGER=$root/bin/sortun-manager
CONF_DIR=$root/etc/sortun
PANEL_DIR=$root/etc/sortun-panel
PANEL_DATA=$root/lib/sortun-panel
PANEL_CONF=$PANEL_DIR/panel.toml
AGENT_CONF=$PANEL_DIR/agent.toml
SSL_DIR=$root/ssl/sortun
LE_RENEWAL=$root/letsencrypt/renewal
CERTBOT_VENV=$root/opt/sortun-certbot
UNIT=$root/systemd/sortun@.service
PANEL_UNIT=$root/systemd/sortun-panel.service
AGENT_UNIT=$root/systemd/sortun-agent.service
HEAL_SERVICE=$root/systemd/sortun-panel-heal.service
HEAL_TIMER=$root/systemd/sortun-panel-heal.timer
RENEW_SERVICE=$root/systemd/sortun-cert-renew.service
RENEW_TIMER=$root/systemd/sortun-cert-renew.timer

fail() {
    echo "FAILED: $*" >&2
    exit 1
}

# The old install: two tunnels (one running, one only enabled), the panel and the agent
# running, the renewal timer on, a tunnel certificate and certbot's environment.
mkdir -p "$root/bin" "$root/etc/kariz" "$root/etc/kariz-panel" "$root/lib/kariz-panel" \
    "$root/ssl/kariz" "$LE_RENEWAL" "$root/opt/kariz-certbot/bin" "$root/systemd"
for f in kariz kariz-panel kariz-manager; do
    printf '#!/bin/sh\n' >"$root/bin/$f" && chmod +x "$root/bin/$f"
done
cat >"$root/etc/kariz/web.toml" <<EOF
role = "exit"
[tunnel]
tls = { cert = "$root/ssl/kariz/web.crt", key = "$root/ssl/kariz/web.key" }
[control]
socket = "$root/etc/kariz/web.sock"
EOF
echo 'role = "entry"' >"$root/etc/kariz/game.toml"
cat >"$root/etc/kariz-panel/panel.toml" <<EOF
data_dir = "$root/lib/kariz-panel"
kariz_dir = "$root/etc/kariz"
cert = "/etc/letsencrypt/live/kariz-panel-1-2-3-4/fullchain.pem"
EOF
echo "kariz_dir = \"$root/etc/kariz\"" >"$root/etc/kariz-panel/agent.toml"
echo "data" >"$root/lib/kariz-panel/panel.db"
echo "cert" >"$root/ssl/kariz/web.crt"
cat >"$LE_RENEWAL/kariz-panel-1-2-3-4.conf" <<EOF
pre_hook = $root/bin/kariz-manager panel cert-hook pre
EOF
for u in kariz@.service kariz-panel.service kariz-agent.service kariz-cert-renew.timer; do
    touch "$root/systemd/$u"
done

# systemd as the old install left it; what it is asked goes to a file.
systemctl() {
    echo "$*" >>"$root/systemctl"
    case "$1 ${2:-}" in
        "list-units --type=service") printf '%s\n' kariz@web.service kariz-panel.service kariz-agent.service ;;
        "list-unit-files --state=enabled") printf '%s\n' kariz@web.service kariz@game.service ;;
        "is-enabled --quiet") [[ "${3:-}" == kariz-cert-renew.timer ]] ;;
        *) return 0 ;;
    esac
}
need_root() { :; }
need_systemd() { :; }
# The install puts the new programs in place; the timer and the unit files are only noted.
cmd_install() {
    echo "install $*" >>"$root/systemctl"
    for f in "$BIN" "$PANEL_BIN" "$MANAGER"; do
        printf '#!/bin/sh\n' >"$f" && chmod +x "$f"
    done
}
install_renew_timer() { echo "renew timer" >>"$root/systemctl"; }
install_heal_timer() { echo "heal timer" >>"$root/systemctl"; }

has_old_install || fail "the old install was not seen"
migrate_old_install install --binary /tmp/sortun >"$root/out" 2>&1 || fail "the move failed: $(cat "$root/out")"

# The files are where SorTUN keeps them, and name each other there.
[[ -f "$CONF_DIR/web.toml" && -f "$CONF_DIR/game.toml" ]] || fail "the tunnels did not move"
[[ -f "$PANEL_DATA/panel.db" ]] || fail "the panel's data did not move"
[[ -f "$SSL_DIR/web.crt" ]] || fail "the tunnel's certificate did not move"
for d in etc/kariz etc/kariz-panel lib/kariz-panel ssl/kariz; do
    [[ ! -e "$root/$d" ]] || fail "$d is still there"
done
grep -q "cert = \"$SSL_DIR/web.crt\"" "$CONF_DIR/web.toml" || fail "the certificate path: $(cat "$CONF_DIR/web.toml")"
grep -q "socket = \"$CONF_DIR/web.sock\"" "$CONF_DIR/web.toml" || fail "the socket path: $(cat "$CONF_DIR/web.toml")"
grep -q "^sortun_dir = \"$CONF_DIR\"" "$PANEL_CONF" || fail "the panel's tunnel directory: $(cat "$PANEL_CONF")"
grep -q "^data_dir = \"$PANEL_DATA\"" "$PANEL_CONF" || fail "the panel's data directory: $(cat "$PANEL_CONF")"
grep -q "^sortun_dir = \"$CONF_DIR\"" "$AGENT_CONF" || fail "the agent's tunnel directory: $(cat "$AGENT_CONF")"
# Let's Encrypt's certificates stay where certbot keeps them.
grep -q 'live/kariz-panel-1-2-3-4/fullchain.pem' "$PANEL_CONF" || fail "the Let's Encrypt path was changed"
grep -q "pre_hook = $MANAGER panel cert-hook pre" "$LE_RENEWAL/kariz-panel-1-2-3-4.conf" ||
    fail "certbot's hook: $(cat "$LE_RENEWAL/kariz-panel-1-2-3-4.conf")"
[[ -L "$CERTBOT_VENV" ]] || fail "certbot's environment has no new name"

# The old programs and units are gone, the new ones are installed from the given files.
for f in bin/kariz bin/kariz-panel bin/kariz-manager systemd/kariz@.service systemd/kariz-panel.service \
    systemd/kariz-agent.service systemd/kariz-cert-renew.timer; do
    [[ ! -e "$root/$f" ]] || fail "$f is still there"
done
grep -qx "install --binary /tmp/sortun" "$root/systemctl" || fail "the install did not get its files"

# What ran runs again, and what was enabled is enabled, under the new names.
for u in sortun@web.service sortun-panel.service sortun-agent.service sortun@game.service; do
    grep -qx "enable --now $u" "$root/systemctl" || fail "$u was not started"
done
grep -qx "disable --now kariz@web.service" "$root/systemctl" || fail "the old tunnel was not stopped"
grep -qx "renew timer" "$root/systemctl" || fail "the renewal timer was not set up again"
! grep -qx "heal timer" "$root/systemctl" || fail "a heal timer that was not there was set up"

# A second run has nothing to do.
has_old_install && fail "the old install is still seen"
echo "migrate: ok"
