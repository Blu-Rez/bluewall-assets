"""Cups, leagues and invites — pure rules (state.py applies them, server.py exposes them).

Cups: a battle that takes at least one star wins cups (18 / 28 / 40 for 1 / 2 / 3 stars, scaled by how strong the enemy was
compared to you); a battle without a star costs 10.  A kingdom under 60 cups never loses any (the first fights are free).
The defender of a real player's base loses half of what the attacker won, or gains 5 when the attack failed.

Leagues are steps of cups: Steel -> Azure -> Sapphire -> Cobalt -> Obsidian -> Blue Crown.
Invites: a friend who opens the game from your link and reaches Castle 3 pays you 1,000 turquoise (at most 50 times).
"""
from __future__ import annotations

from typing import Any, Dict, List, Tuple

# id, name, from cups, colour (light blue / navy / black / steel family; the strongest league is the bluest)
LEAGUES: List[Tuple[str, str, int, str]] = [
    ("steel", "Steel", 0, "#a9b8cc"),
    ("azure", "Azure", 300, "#7cc8ff"),
    ("sapphire", "Sapphire", 700, "#3f8cff"),
    ("cobalt", "Cobalt", 1200, "#5f86ff"),
    ("obsidian", "Obsidian", 1900, "#9fd8ff"),
    ("crown", "Blue Crown", 2800, "#43e0ff"),
]
FREE_UNTIL = 60                 # below this many cups a defeat costs nothing
WIN_FULL = 40                  # the cups a 3-star win pays (before the strength scale); 1 star pays a third of it, 2 stars two thirds (owner 5 Oct 18:34: the cup shows like a gem, 0 of N)
LOSS = 10
INVITE_PAY = 1000               # turquoise to the inviter
INVITE_AT_KEEP = 3              # ... when the invited friend's castle reaches this level
INVITE_MAX = 50                 # rewards per inviter, ever


def league_index(tro: int) -> int:
    i = 0
    for k, (_, _, lo, _) in enumerate(LEAGUES):
        if tro >= lo:
            i = k
    return i


def league(tro: int) -> Dict[str, Any]:
    i = league_index(int(tro))
    lid, name, lo, col = LEAGUES[i]
    nxt = LEAGUES[i + 1][2] if i + 1 < len(LEAGUES) else None
    return {"i": i, "id": lid, "name": name, "from": lo, "to": nxt, "color": col}


def _scale(ratio: float) -> float:
    return max(0.75, min(1.35, float(ratio or 1.0)))


def attacker_delta(tro: int, stars: int, ratio: float) -> int:
    """cups gained (+) or lost (-) by the attacker."""
    if stars >= 1:
        return int(round(WIN_FULL * _scale(ratio) * min(3, stars) / 3.0))
    if tro < FREE_UNTIL:
        return 0
    return -int(round(LOSS / _scale(ratio)))


def defender_delta(att_delta: int, stars: int) -> int:
    """the defender of a real base: loses half of the attacker's win, gains 5 for a failed attack."""
    return -int(round(att_delta * 0.5)) if stars >= 1 else 5


def apply(tro: int, d: int) -> int:
    return max(0, int(tro) + int(d))
