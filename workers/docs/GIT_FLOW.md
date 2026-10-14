# GIT_FLOW — how work moves between chats (no more uploading files from chat to chat)
Written by the mother chat (MOTHER-3), 14 Oct 2026. Repo: `Blu-Rez/bluewall-assets` (public). **Never clone `main`** (4 GB). Clone one branch, `--depth 1`, only.

## خلاصه برای وینگلس
هیچ فایلی بین چت‌ها آپلود نمی‌کنی. هر چت کارگر خودش از گیت می‌خونه و نتیجه‌ش رو توی گیت می‌ذاره؛ مادر هم از گیت برمی‌داره. تو فقط به چت کارگر می‌گی «بخون: claude/<نام>.md از Project» و آخرش به مادر می‌گی «<ID> pushed».

## Branches
| branch | what | who writes |
|---|---|---|
| `kit` | the game tree (client, server, web/assets) + `workers/` (setup, push/pull scripts, dev tests, docs, tools, `pkg/deployed.sha256`, `KIT_VERSION`) | mother only |
| `lib-tripo` | the 226 Tripo GLBs (`lib/tripo/<category>/<key>/…`), `LIB_INDEX.md`, `MANIFEST.json`, `tools/` (TR1 tools + lists) | TR1 / mother |
| `inbox/<ID>` | one worker result (patch, photos, report, sheets). Re-pushing the same ID replaces it | the worker |
| `pkg/<name>` | an install package built by the mother (`bluebot_bluewall_pNN.tar.gz`) | mother only |
| `code-p38` | old kit (p38). Keep until every old-kit worker has finished, then the owner deletes it in GitHub | – |
| `main` | the 4 GB asset library. Do not clone | – |
Branch deletion is blocked by the git proxy: leftovers (`inbox/_selftest`) stay; the owner can delete them in the GitHub UI.

## Worker — start of a chat
1. Get write access: call the `add_repo` tool with owner `Blu-Rez`, repo `bluewall-assets`, access `push`. If the tool is missing or refused, tell the owner in ONE line and use the fallback (he attaches the files).
2. Kit: `git clone --depth 1 --branch kit https://github.com/Blu-Rez/bluewall-assets.git /home/claude/bot/bluebot_v2 && bash /home/claude/bot/bluebot_v2/workers/setup_kit.sh` (installs the game tree, dev tests, docs, tools; builds; runs quick checks; needs ≈ 5 min). Then `bash /home/claude/dev/gate_w.sh` must print `GATE_W: ALL OK`.
3. Model library (only chats that use the Tripo models): `git clone --depth 1 --branch lib-tripo https://github.com/Blu-Rez/bluewall-assets.git /home/claude/lib` (≈ 60 MB; `LIB_INDEX.md` first).
4. `cat /home/claude/bot/bluebot_v2/workers/KIT_VERSION` says which package state the kit is. Say it in your first message.

## Worker — handing the result over
`bash /home/claude/bot/bluebot_v2/workers/push_result.sh <ID> patch_<ID>.tar.gz photos_<ID>.tar.gz report_<ID>.md [TR2_progress.md …]`
- One commit + one push per file; a file over 90 MB is refused (split it); files that look like secrets are refused.
- Then tell the owner ONE line: «<ID> pushed». He pastes that to the mother chat. Nothing else to upload.
- Patches keep the old rules: diff vs the kit you started from, tests in `dev/<id>_*test.sh`, `GATE_W: ALL OK`, photos viewed at full size, no secrets, no touching `web/app/*`, `pkg/`, `dev/gate*.sh`, server `*.py` (server parts = a separate `patch_<ID>_server.tar.gz` + spec).

## Mother — taking a result
`bash workers/mother_pull.sh <ID> [dest]` → `/home/claude/inbox/<ID>/`. Review → merge ONE patch at a time → gate → `mkpkg.sh <name> "<title>"` → push `pkg/<name>` → give the owner the one-line install command. After he says «نصب شد»: `mkpkg.sh --commit <name>`, update `workers/pkg/deployed.sha256` + `KIT_VERSION` in `kit`.

## Owner — installing a package (one line, from the mother)
`cd /root && rm -rf bw_pkg && git clone -q --depth 1 --branch pkg/<name> https://github.com/Blu-Rez/bluewall-assets.git bw_pkg && echo "<sha256>  bw_pkg/<file>.tar.gz" | sha256sum -c && tar xzf bw_pkg/<file>.tar.gz && bash <dir>/install.sh`
(the mother also keeps the file path as a fallback: she can send the .tar.gz as a download.)

## Security notes
- The repo is public: paid models and game code are readable by anyone. Decision for the owner: keep until release, then make it private (workers' deploy keys then need to be replaced by add_repo).
- Reset the two leaked Sketchfab tokens; delete the old GitHub deploy key; never put a token in any file or branch.
