#!/usr/bin/env bash
# mother_pull.sh <ID> [dest]  — the mother takes a worker result from git:  branch inbox/<ID>  ->  /home/claude/inbox/<ID>/
set -euo pipefail
ID=${1:?usage: mother_pull.sh <ID> [dest]}; DEST=${2:-/home/claude/inbox/$ID}; rm -rf "$DEST"; mkdir -p "$(dirname "$DEST")"
git clone -q --depth 1 --branch "inbox/$ID" https://github.com/Blu-Rez/bluewall-assets.git "$DEST" && rm -rf "$DEST/.git" && ls -la "$DEST"
