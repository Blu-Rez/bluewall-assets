"""Display names of the kingdoms a player attacks (shown on the attack screen).

Source of truth: the player names of the bot's game section (the BotPersona table of the BlueBot MySQL, renamed to realistic names in migration 0094).
`python -m bluewall.names --export` (run by the installer, read-only, harmless when the table is not found) copies those names into
data/names.json; this module reloads that file when it changes.  FALLBACK is used until then, so the screen never shows a placeholder.
Nothing here ever prints a connection string or a secret.
"""
from __future__ import annotations

import json
import os
import random
import re
import sys
import time
from typing import List, Optional

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.environ.get("BLUEWALL_NAMES_FILE") or os.path.join(HERE, "data", "names.json")

FALLBACK: List[str] = [
    "Arman", "Kian", "Parsa", "Sina", "Mehrad", "Dariush", "Babak", "Farhad", "Kaveh", "Bardia", "Ramin", "Shahab", "Navid", "Omid", "Pouya", "Amir",
    "Nima", "Soroush", "Tirdad", "Arash", "Behnam", "Kasra", "Siavash", "Yashar", "Reza", "Hamed", "Saeed", "Milad", "Payam", "Keyvan",
    "نیلوفر", "ستاره", "بهار", "مهسا", "سارا", "آیدا", "نازنین", "یلدا", "پریسا", "رها", "الهام", "شیرین", "ماهان", "آرش", "کیارش", "سهیل", "آرمین", "بردیا",
    "Sara_M", "Kian.R", "Ario", "Bahman", "Nasim", "Roxana", "Leila", "Mina", "Niloo", "Shadi", "Taraneh", "Yasi", "Setareh", "Delaram", "Ava", "Nika",
    "Dara", "Xerxes", "Cyrus", "Rostam", "Sohrab", "Zal", "Mani", "Tahmineh", "Anahita", "Mithra", "Sepehr", "Kourosh", "Bijan", "Manouchehr",
]
_BAD = re.compile(r"bot|ربات|robot|test|admin|\d{5,}|@|http|\.com", re.I)

_cache: dict = {"t": 0.0, "m": -1.0, "names": None}


def _clean(names) -> List[str]:
    out, seen = [], set()
    for n in names or []:
        s = str(n or "").strip()
        if not (2 <= len(s) <= 20) or _BAD.search(s) or s.isdigit():
            continue
        k = s.lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(s)
    return out


def pool() -> List[str]:
    """The current name list (the exported file when present and big enough, else the built-in one); the file is re-read when it changes."""
    now = time.time()
    if _cache["names"] is not None and now - _cache["t"] < 60:
        return _cache["names"]
    _cache["t"] = now
    try:
        m = os.path.getmtime(FILE)
    except OSError:
        m = -1.0
    if m != _cache["m"] or _cache["names"] is None:
        _cache["m"] = m
        names: List[str] = []
        if m >= 0:
            try:
                with open(FILE, "r", encoding="utf-8") as f:
                    names = _clean(json.load(f).get("names") or [])
            except Exception:  # noqa: BLE001
                names = []
        _cache["names"] = names if len(names) >= 12 else list(FALLBACK)
    return _cache["names"]


def pick(rng: Optional[random.Random] = None) -> str:
    return (rng or random).choice(pool())


# ---------------------------------------------------------------------------------------------------- export (read-only)
_NAME_COLS = ("display_name", "name", "first_name", "full_name", "nickname", "title", "username")


def _db_urls() -> List[str]:
    urls = []
    for k, v in os.environ.items():
        if re.search(r"(DATABASE|DB|SQLALCHEMY|MYSQL).*(URL|URI|DSN)", k, re.I) and "://" in str(v):
            urls.append(str(v))
    envf = os.environ.get("BLUEBOT_ENV") or "/root/bluebot_v2/.env"
    try:
        for line in open(envf, "r", encoding="utf-8", errors="ignore"):
            line = line.strip()
            if "=" not in line or line.startswith("#"):
                continue
            k, v = line.split("=", 1)
            v = v.strip().strip("'\"")
            if re.search(r"(DATABASE|DB|SQLALCHEMY|MYSQL).*(URL|URI|DSN)", k, re.I) and "://" in v and v not in urls:
                urls.append(v)
    except OSError:
        pass
    return urls


async def _export_async() -> str:
    from sqlalchemy import inspect, text  # type: ignore
    from sqlalchemy.ext.asyncio import create_async_engine  # type: ignore
    urls = _db_urls()
    if not urls:
        return "no database url found"
    last = "no persona table found"
    for url in urls:
        if url.startswith("mysql://") or url.startswith("mysql+pymysql://"):
            url = "mysql+aiomysql://" + url.split("://", 1)[1]
        try:
            eng = create_async_engine(url, pool_pre_ping=True)
        except Exception as e:  # noqa: BLE001
            last = "engine: " + type(e).__name__
            continue
        try:
            async with eng.connect() as conn:
                def reflect(sc):
                    insp = inspect(sc)
                    res = []
                    for t in insp.get_table_names():
                        if "persona" in t.lower():
                            cols = [c["name"] for c in insp.get_columns(t)]
                            res.append((t, cols))
                    return res
                tabs = await conn.run_sync(reflect)
                names: List[str] = []
                for t, cols in tabs:
                    use = [c for c in _NAME_COLS if c in cols][:2]
                    for c in use:
                        rows = await conn.execute(text("SELECT DISTINCT `%s` FROM `%s` WHERE `%s` IS NOT NULL LIMIT 1500" % (c, t, c)))
                        names += [r[0] for r in rows.fetchall()]
                names = _clean(names)
                if names:
                    os.makedirs(os.path.dirname(FILE), exist_ok=True)
                    tmp = FILE + ".tmp"
                    with open(tmp, "w", encoding="utf-8") as f:
                        json.dump({"names": names, "t": int(time.time())}, f, ensure_ascii=False)
                    os.replace(tmp, FILE)
                    return "exported %d names" % len(names)
                last = "persona tables had no usable names"
        except Exception as e:  # noqa: BLE001
            last = "query: " + type(e).__name__
        finally:
            try:
                await eng.dispose()
            except Exception:  # noqa: BLE001
                pass
    return last


def export() -> str:
    import asyncio
    try:
        return asyncio.run(_export_async())
    except Exception as e:  # noqa: BLE001
        return "export failed: " + type(e).__name__


if __name__ == "__main__":
    if "--export" in sys.argv:
        print("names:", export(), "| in use:", len(pool()))
    else:
        print(len(pool()), "names;", ", ".join(pool()[:8]))
