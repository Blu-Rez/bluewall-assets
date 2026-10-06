"""Blue Wall — game 7, a Telegram Mini App (castle / siege strategy).

Layout
  access.py   who may enter (bot button visibility + web hard gate)
  auth.py     Telegram initData validation + short session tokens
  server.py   aiohttp server (127.0.0.1:BLUEWALL_PORT, behind nginx + Cloudflare)
  web/        public loader (index.html, tg.js) + gated game bundle (app/wall.js)
  client/     game source (ES modules) — `client/build.sh` rebuilds web/app/wall.js

Runs as its own systemd unit (bluebot-wall), never inside the bot roles, so a
heavy page load or a future WebSocket burst can't slow the game owner loop.
"""
