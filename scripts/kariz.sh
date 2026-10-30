#!/usr/bin/env bash
# The manager script's address before 3.0. Servers of those versions still fetch it to update
# themselves: it runs the current one (scripts/sortun.sh), which moves them to SorTUN.
set -euo pipefail
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
curl -fsSL https://raw.githubusercontent.com/soranshop/SorTUN/main/scripts/sortun.sh -o "$tmp"
bash "$tmp" "$@"
