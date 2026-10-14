#!/usr/bin/env bash
# push_result.sh <ID> <file>...   — hand a worker result (patch / photos / report / sheets) to the mother THROUGH GIT. The owner uploads nothing.
# Example:  bash push_result.sh TR2_S3 patch_TR2_S3.tar.gz photos_TR2_S3.tar.gz report_TR2_S3.md TR2_progress.md
# Needs write access to Blu-Rez/bluewall-assets: call add_repo (owner Blu-Rez, repo bluewall-assets, access push) first; if the tool is missing or refused, say so to the owner and fall back to attaching the files.
# Result lands on the branch  inbox/<ID>  (orphan, tiny; re-running with the same ID replaces it). One commit + one push per file, so no request is big. A file over 90 MB is refused (GitHub limit 100 MB): split it.
set -euo pipefail
ID=${1:?usage: push_result.sh <ID> <file>...}; shift; [ $# -ge 1 ] || { echo "no files given"; exit 1; }
case "$ID" in *[!A-Za-z0-9_.-]*|"") echo "ID may contain only letters, digits, _ . -"; exit 1;; esac
for f in "$@"; do [ -f "$f" ] || { echo "❌ not a file: $f"; exit 1; }; s=$(stat -c %s "$f"); [ "$s" -le 94371840 ] || { echo "❌ $f is $((s/1048576)) MB (> 90 MB): split it"; exit 1; }; done
if grep -rIlE '(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY)' "$@" 2>/dev/null | grep -q .; then echo "❌ a file looks like it contains a secret/token: remove it first"; exit 1; fi
REPO=${REPO:-https://github.com/Blu-Rez/bluewall-assets.git}; BR="inbox/$ID"
D=$(mktemp -d); cd "$D"; git init -q -b "$BR"; git remote add origin "$REPO"
cm(){ git commit -q -m "$1" 2>/dev/null || git -c commit.gpgsign=false commit -q -m "$1"; }
printf 'result of %s, pushed %s\n' "$ID" "$(date -u +%FT%TZ)" > README.md; git add README.md; cm "inbox/$ID"
push(){ for t in 1 2 3; do git -c push.negotiate=false push -q --force origin "$BR" 2>&1 | grep -vE '^remote:|^$' && true; git ls-remote --heads origin "$BR" | grep -q "$(git rev-parse HEAD)" && return 0; echo "… push retry $t"; sleep 3; done; return 1; }
push || { echo "❌ push failed (no write access? call add_repo with access=push, then run again)"; exit 1; }
n=0; for f in "$@"; do cp -p "$f" "./$(basename "$f")"; git add "$(basename "$f")"; cm "$ID: $(basename "$f")"; push || { echo "❌ push of $(basename "$f") failed (413 = too big: split it)"; exit 1; }; n=$((n+1)); done
git ls-remote --heads origin "$BR" | grep -q "$BR" || { echo "❌ push failed (no write access? call add_repo with access=push, then run again)"; exit 1; }
echo "✅ pushed $n file(s) to branch $BR — tell the mother chat:  «$ID pushed»"
