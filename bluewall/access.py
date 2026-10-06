"""Who may enter Blue Wall.

Pre-launch: only the owner (SUPER_ADMIN_UID) plus optional testers
(BLUEWALL_ALLOW="111,222" in .env). Launch day: BLUEWALL_PUBLIC=true.
Shared by the bot (the game-home button is shown only to allowed users) and
the web server (hard gate on /api/auth), so both always agree.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Any, FrozenSet


def _settings():
    from config import settings
    return settings


@lru_cache(maxsize=1)
def allowed_uids() -> FrozenSet[int]:
    s = _settings()
    out = set()
    try:
        out.add(int(s.SUPER_ADMIN_UID))
    except Exception:  # noqa: BLE001
        pass
    raw = str(getattr(s, "BLUEWALL_ALLOW", "") or "")
    for part in raw.replace(" ", "").split(","):
        if part.isdigit():
            out.add(int(part))
    return frozenset(u for u in out if u > 0)


def is_public() -> bool:
    return bool(getattr(_settings(), "BLUEWALL_PUBLIC", False))


def can_enter(uid: Any) -> bool:
    try:
        uid = int(uid)
    except (TypeError, ValueError):
        return False
    if uid <= 0:                      # bots / anonymous never enter
        return False
    return is_public() or uid in allowed_uids()


def url() -> str:
    return str(getattr(_settings(), "BLUEWALL_URL", "") or "").strip().rstrip("/")
