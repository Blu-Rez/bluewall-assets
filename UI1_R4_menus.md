# UI1_R4 — menu census (landscape: 844×390, 800×360, 932×430, Telegram margins on)

Every menu / sheet / dialog is opened **by its real button** (or the real tap on the building) in the real game, headless Chromium (software GL, **not a phone**), at the three sizes with the Telegram insets (`--tg-content-safe-area-inset-top` 52 px, sides 47 px, bottom 21 px) and the two Telegram buttons drawn on top. The pass rule is `dev/ui1r4_rules.py` + the probe `dev/ui1r4_probe.js`: opens · fits the screen · the page never scrolls · the close button is ≥ 44 px, reachable and not under a Telegram button · no target < 44 px · nothing under the notch / rounded corner / home bar · no clipped text or unreachable content · a scrolling list shows ≥ 45 % of the screen height.

**BEFORE** = the kit as started (kit 0574fdc, page built before any edit). **AFTER** = the real build with this round's changes (proof run of `dev/ui1_menus_test.sh`). ✅ passes · ❌ fails · – not opened (see the end) · · not measured on that side.

## 1. Summary — menu × size

| menu | BEFORE 844 | 800 | 932 | AFTER 844 | 800 | 932 | what fixed it |
|---|---|---|---|---|---|---|---|
| hub | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | compact rows at <= 400 px high, centred inside the safe box (it ran under the home bar at 800×360) |
| kingdom_owned | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: rail (3 builder pips + 4 tabs as 2×2) + the list at full height; category chips 44 px; compact cards |
| kingdom_owned_mixed | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: rail (3 builder pips + 4 tabs as 2×2) + the list at full height; category chips 44 px; compact cards |
| kingdom_town | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: rail (3 builder pips + 4 tabs as 2×2) + the list at full height; category chips 44 px; compact cards |
| kingdom_reserve | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: rail (3 builder pips + 4 tabs as 2×2) + the list at full height; category chips 44 px; compact cards |
| kingdom_buy | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: rail (3 builder pips + 4 tabs as 2×2) + the list at full height; category chips 44 px; compact cards |
| kingdom_new | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: rail (3 builder pips + 4 tabs as 2×2) + the list at full height; category chips 44 px; compact cards |
| army_troops | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: rail (housing, tabs, Find a target) + the list at full height |
| army_spells | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: rail (housing, tabs, Find a target) + the list at full height |
| army_queue | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: rail (housing, tabs, Find a target) + the list at full height |
| army_unit_info_common | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| army_unit_info_mythic | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| army_spell_info | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| army_emblem_picker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| shop_boosts | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | two panes: rail (tabs) + the list at full height |
| shop_defense | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | two panes: rail (tabs) + the list at full height |
| shop_gems | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | two panes: rail (tabs) + the list at full height |
| rank_leaderboard | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: rail (page + tabs) + list |
| rank_leagues | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: rail (page + tabs) + list |
| rank_invite | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: rail (page + tabs) + list |
| clan_join | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | two panes |
| clan_create | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | two panes |
| clan_mine | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | two panes |
| friends | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | two panes |
| battle_log | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | two panes |
| settings_sound | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: date / time + 4 tabs in the rail, the settings list at full height |
| settings_graphics | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: date / time + 4 tabs in the rail, the settings list at full height |
| settings_controls | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: date / time + 4 tabs in the rail, the settings list at full height |
| settings_about | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: date / time + 4 tabs in the rail, the settings list at full height |
| settings_graphics_owner_tools | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | two panes: date / time + 4 tabs in the rail, the settings list at full height |
| hero_picker | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | cards and the close button inside the side margins; close 44 px under the Telegram Close pill |
| old_info_card | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| welcome_card | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_keep | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_wall | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_tower | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_barracks | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | queue chips wrap (the «+N» chip was cut off sideways); no more self-scroll of the sheet |
| sheet_forge | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_training | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | queue chips wrap |
| sheet_stable | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | queue chips wrap + the sheet no longer scrolls its title / Train button out of view |
| sheet_workshop | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | queue chips wrap |
| sheet_lair | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | queue chips wrap |
| sheet_archer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_vault_ruby | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_vault_emerald | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_vault_turq | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_mine_ruby | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_mine_emerald | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_mine_turq | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_ws_farm | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_ws_sawmill_00 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_ws_smelter_00 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_ws_mint_00 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_confirm_dialog | · | · | · | ✅ | ✅ | ✅ |  |
| sheet_confirm_rush | · | · | · | ✅ | ✅ | ✅ |  |

**BEFORE: 73 of 159 measured cells pass, 86 fail.   AFTER: 165 of 165 measured cells pass, 0 fail.**

## 2. AFTER — full table (real build)

| menu | group | size | opens | fits | scrolls inside | close | clipped | targets <44 / under notch | cols | list px | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| hub | Hub | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 5 | – | ✅ OK |
| hub | Hub | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 5 | – | ✅ OK |
| hub | Hub | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 5 | – | ✅ OK |
| kingdom_owned | Kingdom | 844x390 | ✅ | ✅ | 196 / 1575 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 196 | ✅ OK |
| kingdom_owned | Kingdom | 800x360 | ✅ | ✅ | 166 / 1773 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 166 | ✅ OK |
| kingdom_owned | Kingdom | 932x430 | ✅ | ✅ | 236 / 1564 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 236 | ✅ OK |
| kingdom_owned_mixed | Kingdom | 844x390 | ✅ | ✅ | 196 / 1771 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 196 | ✅ OK |
| kingdom_owned_mixed | Kingdom | 800x360 | ✅ | ✅ | 166 / 1874 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 166 | ✅ OK |
| kingdom_owned_mixed | Kingdom | 932x430 | ✅ | ✅ | 236 / 1762 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 236 | ✅ OK |
| kingdom_town | Kingdom | 844x390 | ✅ | ✅ | no (fits) | ✅ 46×46 | ✅ | 0 / 0 | 3 | – | ✅ OK |
| kingdom_town | Kingdom | 800x360 | ✅ | ✅ | 166 / 205 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 166 | ✅ OK |
| kingdom_town | Kingdom | 932x430 | ✅ | ✅ | no (fits) | ✅ 46×46 | ✅ | 0 / 0 | 3 | – | ✅ OK |
| kingdom_reserve | Kingdom | 844x390 | ✅ | ✅ | 196 / 589 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 196 | ✅ OK |
| kingdom_reserve | Kingdom | 800x360 | ✅ | ✅ | 166 / 589 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 166 | ✅ OK |
| kingdom_reserve | Kingdom | 932x430 | ✅ | ✅ | 236 / 589 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 236 | ✅ OK |
| kingdom_buy | Kingdom | 844x390 | ✅ | ✅ | 196 / 334 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 196 | ✅ OK |
| kingdom_buy | Kingdom | 800x360 | ✅ | ✅ | 166 / 360 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 166 | ✅ OK |
| kingdom_buy | Kingdom | 932x430 | ✅ | ✅ | 236 / 321 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 236 | ✅ OK |
| kingdom_new | Kingdom | 844x390 | ✅ | ✅ | 196 / 536 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 196 | ✅ OK |
| kingdom_new | Kingdom | 800x360 | ✅ | ✅ | 166 / 536 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 166 | ✅ OK |
| kingdom_new | Kingdom | 932x430 | ✅ | ✅ | 236 / 536 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 236 | ✅ OK |
| army_troops | Army | 844x390 | ✅ | ✅ | 253 / 2388 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 253 | ✅ OK |
| army_troops | Army | 800x360 | ✅ | ✅ | 223 / 2458 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 223 | ✅ OK |
| army_troops | Army | 932x430 | ✅ | ✅ | 293 / 2580 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 293 | ✅ OK |
| army_spells | Army | 844x390 | ✅ | ✅ | 253 / 259 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 253 | ✅ OK |
| army_spells | Army | 800x360 | ✅ | ✅ | 223 / 251 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 223 | ✅ OK |
| army_spells | Army | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| army_queue | Army | 844x390 | ✅ | ✅ | 253 / 2534 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 253 | ✅ OK |
| army_queue | Army | 800x360 | ✅ | ✅ | 223 / 2458 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 223 | ✅ OK |
| army_queue | Army | 932x430 | ✅ | ✅ | 293 / 2580 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 293 | ✅ OK |
| army_unit_info_common | Army | 844x390 | ✅ | ✅ | 277 / 1460 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 277 | ✅ OK |
| army_unit_info_common | Army | 800x360 | ✅ | ✅ | 247 / 1460 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 247 | ✅ OK |
| army_unit_info_common | Army | 932x430 | ✅ | ✅ | 317 / 1460 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 317 | ✅ OK |
| army_unit_info_mythic | Army | 844x390 | ✅ | ✅ | 277 / 1546 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 277 | ✅ OK |
| army_unit_info_mythic | Army | 800x360 | ✅ | ✅ | 247 / 1546 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 247 | ✅ OK |
| army_unit_info_mythic | Army | 932x430 | ✅ | ✅ | 317 / 1546 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 317 | ✅ OK |
| army_spell_info | Army | 844x390 | ✅ | ✅ | 277 / 309 | tap outside | ✅ | 0 / 0 | 4 | 277 | ✅ OK |
| army_spell_info | Army | 800x360 | ✅ | ✅ | 247 / 309 | tap outside | ✅ | 0 / 0 | 4 | 247 | ✅ OK |
| army_spell_info | Army | 932x430 | ✅ | ✅ | no (fits) | tap outside | ✅ | 0 / 0 | 4 | – | ✅ OK |
| army_emblem_picker | Army | 844x390 | ✅ | ✅ | 277 / 589 | ✅ 72×72 | ✅ | 0 / 0 | 4 | 277 | ✅ OK |
| army_emblem_picker | Army | 800x360 | ✅ | ✅ | 247 / 589 | ✅ 72×72 | ✅ | 0 / 0 | 4 | 247 | ✅ OK |
| army_emblem_picker | Army | 932x430 | ✅ | ✅ | 317 / 589 | ✅ 72×72 | ✅ | 0 / 0 | 4 | 317 | ✅ OK |
| shop_boosts | Shop | 844x390 | ✅ | ✅ | 260 / 858 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 260 | ✅ OK |
| shop_boosts | Shop | 800x360 | ✅ | ✅ | 230 / 858 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 230 | ✅ OK |
| shop_boosts | Shop | 932x430 | ✅ | ✅ | 300 / 858 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 300 | ✅ OK |
| shop_defense | Shop | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| shop_defense | Shop | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| shop_defense | Shop | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| shop_gems | Shop | 844x390 | ✅ | ✅ | 260 / 537 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 260 | ✅ OK |
| shop_gems | Shop | 800x360 | ✅ | ✅ | 230 / 537 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 230 | ✅ OK |
| shop_gems | Shop | 932x430 | ✅ | ✅ | 300 / 537 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 300 | ✅ OK |
| rank_leaderboard | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 723 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ✅ OK |
| rank_leaderboard | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 723 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ✅ OK |
| rank_leaderboard | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 723 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ✅ OK |
| rank_leagues | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 605 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ✅ OK |
| rank_leagues | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 605 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ✅ OK |
| rank_leagues | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 584 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ✅ OK |
| rank_invite | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 509 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ✅ OK |
| rank_invite | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 509 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ✅ OK |
| rank_invite | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 509 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ✅ OK |
| clan_join | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ✅ OK |
| clan_join | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ✅ OK |
| clan_join | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ✅ OK |
| clan_create | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ✅ OK |
| clan_create | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ✅ OK |
| clan_create | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ✅ OK |
| clan_mine | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 665 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ✅ OK |
| clan_mine | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 665 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ✅ OK |
| clan_mine | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 665 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ✅ OK |
| friends | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 466 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ✅ OK |
| friends | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 466 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ✅ OK |
| friends | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 451 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ✅ OK |
| battle_log | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 645 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ✅ OK |
| battle_log | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 645 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ✅ OK |
| battle_log | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 645 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ✅ OK |
| settings_sound | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 255 / 1015 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 255 | ✅ OK |
| settings_sound | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 225 / 1015 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 225 | ✅ OK |
| settings_sound | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 295 / 1015 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 295 | ✅ OK |
| settings_graphics | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 255 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 255 | ✅ OK |
| settings_graphics | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 225 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 225 | ✅ OK |
| settings_graphics | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 295 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 295 | ✅ OK |
| settings_controls | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 255 / 742 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 255 | ✅ OK |
| settings_controls | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 225 / 742 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 225 | ✅ OK |
| settings_controls | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 295 / 742 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 295 | ✅ OK |
| settings_about | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 255 / 4429 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 255 | ✅ OK |
| settings_about | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 225 / 4633 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 225 | ✅ OK |
| settings_about | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 295 / 4164 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 295 | ✅ OK |
| settings_graphics_owner_tools | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 255 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 255 | ✅ OK |
| settings_graphics_owner_tools | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 225 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 225 | ✅ OK |
| settings_graphics_owner_tools | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 295 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 295 | ✅ OK |
| hero_picker | Hero | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 5 | – | ✅ OK |
| hero_picker | Hero | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 6 | – | ✅ OK |
| hero_picker | Hero | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 5 | – | ✅ OK |
| old_info_card | Info card (ui.js) | 844x390 | ✅ | ✅ | no (fits) | ✅ 46×46 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| old_info_card | Info card (ui.js) | 800x360 | ✅ | ✅ | no (fits) | ✅ 46×46 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| old_info_card | Info card (ui.js) | 932x430 | ✅ | ✅ | no (fits) | ✅ 46×46 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| welcome_card | Welcome card | 844x390 | ✅ | ✅ | no (fits) | tap outside | ✅ | 0 / 0 | 1 | – | ✅ OK |
| welcome_card | Welcome card | 800x360 | ✅ | ✅ | no (fits) | tap outside | ✅ | 0 / 0 | 1 | – | ✅ OK |
| welcome_card | Welcome card | 932x430 | ✅ | ✅ | no (fits) | tap outside | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_keep | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_keep | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_keep | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_wall | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_wall | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_wall | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_tower | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_tower | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_tower | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_barracks | Building sheets | 844x390 | ✅ | ✅ | 320 / 344 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 320 | ✅ OK |
| sheet_barracks | Building sheets | 800x360 | ✅ | ✅ | 290 / 344 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 290 | ✅ OK |
| sheet_barracks | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_forge | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_forge | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_forge | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_training | Building sheets | 844x390 | ✅ | ✅ | 320 / 326 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 320 | ✅ OK |
| sheet_training | Building sheets | 800x360 | ✅ | ✅ | 290 / 326 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 290 | ✅ OK |
| sheet_training | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_stable | Building sheets | 844x390 | ✅ | ✅ | 320 / 363 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 320 | ✅ OK |
| sheet_stable | Building sheets | 800x360 | ✅ | ✅ | 290 / 363 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 290 | ✅ OK |
| sheet_stable | Building sheets | 932x430 | ✅ | ✅ | 360 / 363 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 360 | ✅ OK |
| sheet_workshop | Building sheets | 844x390 | ✅ | ✅ | 320 / 363 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 320 | ✅ OK |
| sheet_workshop | Building sheets | 800x360 | ✅ | ✅ | 290 / 363 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 290 | ✅ OK |
| sheet_workshop | Building sheets | 932x430 | ✅ | ✅ | 360 / 363 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 360 | ✅ OK |
| sheet_lair | Building sheets | 844x390 | ✅ | ✅ | 320 / 344 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 320 | ✅ OK |
| sheet_lair | Building sheets | 800x360 | ✅ | ✅ | 290 / 344 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 290 | ✅ OK |
| sheet_lair | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_archer | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_archer | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_archer | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_ruby | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_ruby | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_ruby | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_emerald | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_emerald | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_emerald | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_turq | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_turq | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_turq | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_ruby | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_ruby | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_ruby | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_emerald | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_emerald | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_emerald | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_turq | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_turq | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_turq | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_farm | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_farm | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_farm | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_sawmill_00 | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_sawmill_00 | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_sawmill_00 | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_smelter_00 | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_smelter_00 | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_smelter_00 | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_mint_00 | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_mint_00 | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_mint_00 | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_confirm_dialog | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 166×48 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_confirm_dialog | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 166×48 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_confirm_dialog | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 166×48 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_confirm_rush | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 166×52 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_confirm_rush | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 166×52 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_confirm_rush | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 166×52 | ✅ | 0 / 0 | 1 | – | ✅ OK |

**165 of 165 menu × size cells are fine, 0 fail.**


## 3. BEFORE — full table (kit as started)

| menu | group | size | opens | fits | scrolls inside | close | clipped | targets <44 / under notch | cols | list px | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| hub | Hub | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 5 | – | ✅ OK |
| hub | Hub | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 4 | 5 | – | ❌ 4 target(s) under notch / Telegram button / home bar |
| hub | Hub | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 5 | – | ✅ OK |
| kingdom_owned | Kingdom | 844x390 | ✅ | ✅ | 56 / 2386 | ✅ 46×46 | ✅ | 5 / 0 | 1 | 56 | ❌ 5 target(s) < 44 px (div.bwu-cat.on«All» 41×26, div.bwu-cat«Town» 59×26, div.bwu-cat«Defense» 73×26); cramped: the list shows only 56 px of 390 |
| kingdom_owned | Kingdom | 800x360 | ✅ | ✅ | 26 / 2386 | ✅ 46×46 | ✅ | 5 / 0 | 1 | 26 | ❌ 5 target(s) < 44 px (div.bwu-cat.on«All» 41×26, div.bwu-cat«Town» 59×26, div.bwu-cat«Defense» 73×26); cramped: the list shows only 26 px of 360 |
| kingdom_owned | Kingdom | 932x430 | ✅ | ✅ | 96 / 2386 | ✅ 46×46 | ✅ | 5 / 0 | 1 | 96 | ❌ 5 target(s) < 44 px (div.bwu-cat.on«All» 41×26, div.bwu-cat«Town» 59×26, div.bwu-cat«Defense» 73×26); cramped: the list shows only 96 px of 430 |
| kingdom_owned_mixed | Kingdom | 844x390 | ✅ | ✅ | 69 / 2142 | ✅ 46×46 | ✅ | 5 / 0 | 1 | 69 | ❌ 5 target(s) < 44 px (div.bwu-cat.on«All» 41×26, div.bwu-cat«Town» 59×26, div.bwu-cat«Defense» 73×26); cramped: the list shows only 69 px of 390 |
| kingdom_owned_mixed | Kingdom | 800x360 | ✅ | ✅ | 39 / 2142 | ✅ 46×46 | ✅ | 5 / 0 | 1 | 39 | ❌ 5 target(s) < 44 px (div.bwu-cat.on«All» 41×26, div.bwu-cat«Town» 59×26, div.bwu-cat«Defense» 73×26); cramped: the list shows only 39 px of 360 |
| kingdom_owned_mixed | Kingdom | 932x430 | ✅ | ✅ | 109 / 2142 | ✅ 46×46 | ✅ | 5 / 0 | 1 | 109 | ❌ 5 target(s) < 44 px (div.bwu-cat.on«All» 41×26, div.bwu-cat«Town» 59×26, div.bwu-cat«Defense» 73×26); cramped: the list shows only 109 px of 430 |
| kingdom_town | Kingdom | 844x390 | ✅ | ✅ | 69 / 220 | ✅ 46×46 | ✅ | 5 / 0 | 1 | 69 | ❌ 5 target(s) < 44 px (div.bwu-cat«All» 41×26, div.bwu-cat.on«Town» 59×26, div.bwu-cat«Defense» 73×26); cramped: the list shows only 69 px of 390 |
| kingdom_town | Kingdom | 800x360 | ✅ | ✅ | 39 / 220 | ✅ 46×46 | ✅ | 5 / 0 | 1 | 39 | ❌ 5 target(s) < 44 px (div.bwu-cat«All» 41×26, div.bwu-cat.on«Town» 59×26, div.bwu-cat«Defense» 73×26); cramped: the list shows only 39 px of 360 |
| kingdom_town | Kingdom | 932x430 | ✅ | ✅ | 109 / 220 | ✅ 46×46 | ✅ | 5 / 0 | 1 | 109 | ❌ 5 target(s) < 44 px (div.bwu-cat«All» 41×26, div.bwu-cat.on«Town» 59×26, div.bwu-cat«Defense» 73×26); cramped: the list shows only 109 px of 430 |
| kingdom_reserve | Kingdom | 844x390 | ✅ | ✅ | 102 / 610 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 102 | ❌ cramped: the list shows only 102 px of 390 |
| kingdom_reserve | Kingdom | 800x360 | ✅ | ✅ | 72 / 610 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 72 | ❌ cramped: the list shows only 72 px of 360 |
| kingdom_reserve | Kingdom | 932x430 | ✅ | ✅ | 142 / 610 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 142 | ❌ cramped: the list shows only 142 px of 430 |
| kingdom_buy | Kingdom | 844x390 | ✅ | ✅ | 102 / 481 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 102 | ❌ cramped: the list shows only 102 px of 390 |
| kingdom_buy | Kingdom | 800x360 | ✅ | ✅ | 72 / 481 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 72 | ❌ cramped: the list shows only 72 px of 360 |
| kingdom_buy | Kingdom | 932x430 | ✅ | ✅ | 142 / 481 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 142 | ❌ cramped: the list shows only 142 px of 430 |
| kingdom_new | Kingdom | 844x390 | ✅ | ✅ | 102 / 536 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 102 | ❌ cramped: the list shows only 102 px of 390 |
| kingdom_new | Kingdom | 800x360 | ✅ | ✅ | 72 / 536 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 72 | ❌ cramped: the list shows only 72 px of 360 |
| kingdom_new | Kingdom | 932x430 | ✅ | ✅ | 142 / 536 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 142 | ❌ cramped: the list shows only 142 px of 430 |
| army_troops | Army | 844x390 | ✅ | ✅ | 52 / 1797 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 52 | ❌ cramped: the list shows only 52 px of 390 |
| army_troops | Army | 800x360 | ✅ | ✅ | 22 / 2405 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 22 | ❌ cramped: the list shows only 22 px of 360 |
| army_troops | Army | 932x430 | ✅ | ✅ | 92 / 2551 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 92 | ❌ cramped: the list shows only 92 px of 430 |
| army_spells | Army | 844x390 | ✅ | ✅ | 52 / 261 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 52 | ❌ cramped: the list shows only 52 px of 390 |
| army_spells | Army | 800x360 | ✅ | ✅ | 22 / 261 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 22 | ❌ cramped: the list shows only 22 px of 360 |
| army_spells | Army | 932x430 | ✅ | ✅ | 92 / 261 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 92 | ❌ cramped: the list shows only 92 px of 430 |
| army_queue | Army | 844x390 | ✅ | ✅ | 52 / 2551 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 52 | ❌ cramped: the list shows only 52 px of 390 |
| army_queue | Army | 800x360 | ✅ | ✅ | 22 / 2551 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 22 | ❌ cramped: the list shows only 22 px of 360 |
| army_queue | Army | 932x430 | ✅ | ✅ | 92 / 2551 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 92 | ❌ cramped: the list shows only 92 px of 430 |
| army_unit_info_common | Army | 844x390 | ✅ | ✅ | 277 / 1460 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 277 | ✅ OK |
| army_unit_info_common | Army | 800x360 | ✅ | ✅ | 247 / 1460 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 247 | ✅ OK |
| army_unit_info_common | Army | 932x430 | ✅ | ✅ | 317 / 1460 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 317 | ✅ OK |
| army_unit_info_mythic | Army | 844x390 | ✅ | ✅ | 277 / 1546 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 277 | ✅ OK |
| army_unit_info_mythic | Army | 800x360 | ✅ | ✅ | 247 / 1546 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 247 | ✅ OK |
| army_unit_info_mythic | Army | 932x430 | ✅ | ✅ | 317 / 1546 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 317 | ✅ OK |
| army_spell_info | Army | 844x390 | ✅ | ✅ | 233 / 309 | tap outside | ✅ | 0 / 0 | 4 | 233 | ✅ OK |
| army_spell_info | Army | 800x360 | ✅ | ✅ | 203 / 309 | tap outside | ✅ | 0 / 0 | 4 | 203 | ✅ OK |
| army_spell_info | Army | 932x430 | ✅ | ✅ | 273 / 309 | tap outside | ✅ | 0 / 0 | 4 | 273 | ✅ OK |
| army_emblem_picker | Army | 844x390 | ✅ | ✅ | 233 / 589 | ✅ 72×72 | ✅ | 0 / 0 | 4 | 233 | ✅ OK |
| army_emblem_picker | Army | 800x360 | ✅ | ✅ | 203 / 589 | ✅ 72×72 | ✅ | 0 / 0 | 4 | 203 | ✅ OK |
| army_emblem_picker | Army | 932x430 | ✅ | ✅ | 273 / 589 | ✅ 72×72 | ✅ | 0 / 0 | 4 | 273 | ✅ OK |
| shop_boosts | Shop | 844x390 | ✅ | ✅ | 172 / 858 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 172 | ❌ cramped: the list shows only 172 px of 390 |
| shop_boosts | Shop | 800x360 | ✅ | ✅ | 142 / 858 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 142 | ❌ cramped: the list shows only 142 px of 360 |
| shop_boosts | Shop | 932x430 | ✅ | ✅ | 212 / 858 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 212 | ✅ OK |
| shop_defense | Shop | 844x390 | ✅ | ✅ | 172 / 212 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 172 | ❌ cramped: the list shows only 172 px of 390 |
| shop_defense | Shop | 800x360 | ✅ | ✅ | 142 / 212 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 142 | ❌ cramped: the list shows only 142 px of 360 |
| shop_defense | Shop | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| shop_gems | Shop | 844x390 | ✅ | ✅ | 172 / 537 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 172 | ❌ cramped: the list shows only 172 px of 390 |
| shop_gems | Shop | 800x360 | ✅ | ✅ | 142 / 537 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 142 | ❌ cramped: the list shows only 142 px of 360 |
| shop_gems | Shop | 932x430 | ✅ | ✅ | 212 / 537 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 212 | ✅ OK |
| rank_leaderboard | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 112 / 723 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 112 | ❌ cramped: the list shows only 112 px of 390 |
| rank_leaderboard | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 82 / 723 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 82 | ❌ cramped: the list shows only 82 px of 360 |
| rank_leaderboard | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 152 / 723 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 152 | ❌ cramped: the list shows only 152 px of 430 |
| rank_leagues | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 112 / 605 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 112 | ❌ cramped: the list shows only 112 px of 390 |
| rank_leagues | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 82 / 605 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 82 | ❌ cramped: the list shows only 82 px of 360 |
| rank_leagues | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 152 / 605 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 152 | ❌ cramped: the list shows only 152 px of 430 |
| rank_invite | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 112 / 509 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 112 | ❌ cramped: the list shows only 112 px of 390 |
| rank_invite | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 82 / 509 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 82 | ❌ cramped: the list shows only 82 px of 360 |
| rank_invite | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 152 / 509 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 152 | ❌ cramped: the list shows only 152 px of 430 |
| clan_join | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 165 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 165 | ❌ cramped: the list shows only 165 px of 390 |
| clan_join | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 135 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 135 | ❌ cramped: the list shows only 135 px of 360 |
| clan_join | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 205 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 205 | ✅ OK |
| clan_create | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 165 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 165 | ❌ cramped: the list shows only 165 px of 390 |
| clan_create | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 135 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 135 | ❌ cramped: the list shows only 135 px of 360 |
| clan_create | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 205 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 205 | ✅ OK |
| clan_mine | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 165 / 665 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 165 | ❌ cramped: the list shows only 165 px of 390 |
| clan_mine | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 135 / 665 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 135 | ❌ cramped: the list shows only 135 px of 360 |
| clan_mine | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 205 / 665 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 205 | ✅ OK |
| friends | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 165 / 466 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 165 | ❌ cramped: the list shows only 165 px of 390 |
| friends | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 135 / 466 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 135 | ❌ cramped: the list shows only 135 px of 360 |
| friends | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 205 / 466 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 205 | ✅ OK |
| battle_log | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 165 / 645 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 165 | ❌ cramped: the list shows only 165 px of 390 |
| battle_log | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 135 / 645 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 135 | ❌ cramped: the list shows only 135 px of 360 |
| battle_log | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 205 / 645 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 205 | ✅ OK |
| settings_sound | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 87 / 1015 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 87 | ❌ cramped: the list shows only 87 px of 390 |
| settings_sound | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 57 / 1015 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 57 | ❌ cramped: the list shows only 57 px of 360 |
| settings_sound | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 127 / 1015 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 127 | ❌ cramped: the list shows only 127 px of 430 |
| settings_graphics | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 87 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 87 | ❌ cramped: the list shows only 87 px of 390 |
| settings_graphics | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 57 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 57 | ❌ cramped: the list shows only 57 px of 360 |
| settings_graphics | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 127 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 127 | ❌ cramped: the list shows only 127 px of 430 |
| settings_controls | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 87 / 742 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 87 | ❌ cramped: the list shows only 87 px of 390 |
| settings_controls | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 57 / 742 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 57 | ❌ cramped: the list shows only 57 px of 360 |
| settings_controls | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 127 / 742 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 127 | ❌ cramped: the list shows only 127 px of 430 |
| settings_about | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 87 / 4286 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 87 | ❌ cramped: the list shows only 87 px of 390 |
| settings_about | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 57 / 4286 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 57 | ❌ cramped: the list shows only 57 px of 360 |
| settings_about | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 127 / 4286 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 127 | ❌ cramped: the list shows only 127 px of 430 |
| settings_graphics_owner_tools | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 87 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 87 | ❌ cramped: the list shows only 87 px of 390 |
| settings_graphics_owner_tools | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 57 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 57 | ❌ cramped: the list shows only 57 px of 360 |
| settings_graphics_owner_tools | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 127 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 127 | ❌ cramped: the list shows only 127 px of 430 |
| hero_picker | Hero | 844x390 | ✅ | ✅ | no (fits) | ❌ 42×42 | ✅ | 1 / 3 | 6 | – | ❌ close button not reachable; 1 target(s) < 44 px (button.rp-x.rp-k 42×42); 3 target(s) under notch / Telegram button / home bar |
| hero_picker | Hero | 800x360 | ✅ | ✅ | no (fits) | ❌ 42×42 | ✅ | 1 / 3 | 6 | – | ❌ close button not reachable; 1 target(s) < 44 px (button.rp-x.rp-k 42×42); 3 target(s) under notch / Telegram button / home bar |
| hero_picker | Hero | 932x430 | ✅ | ✅ | no (fits) | ❌ 42×42 | ✅ | 1 / 1 | 5 | – | ❌ close button not reachable; 1 target(s) < 44 px (button.rp-x.rp-k 42×42); 1 target(s) under notch / Telegram button / home bar |
| old_info_card | Info card (ui.js) | 844x390 | ✅ | ✅ | no (fits) | ✅ 46×46 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| old_info_card | Info card (ui.js) | 800x360 | ✅ | ✅ | no (fits) | ✅ 46×46 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| old_info_card | Info card (ui.js) | 932x430 | ✅ | ✅ | no (fits) | ✅ 46×46 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| welcome_card | Welcome card | 844x390 | ✅ | ✅ | no (fits) | tap outside | ✅ | 0 / 0 | 1 | – | ✅ OK |
| welcome_card | Welcome card | 800x360 | ✅ | ✅ | no (fits) | tap outside | ✅ | 0 / 0 | 1 | – | ✅ OK |
| welcome_card | Welcome card | 932x430 | ✅ | ✅ | no (fits) | tap outside | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_keep | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_keep | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_keep | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_wall | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_wall | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_wall | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_tower | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_tower | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_tower | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_barracks | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ❌ 2+0 | 0 / 0 | 1 | – | ❌ 2 element(s) cut or unreachable (span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [567,581 vs 278,570]; div.qi.more«+3» sideways out of div.bsh-q«×10s×10s×10s×10 |
| sheet_barracks | Building sheets | 800x360 | ✅ | ✅ | 290 / 306 | ✅ 44×44 | ❌ 3+0 | 0 / 0 | 1 | 290 | ❌ 3 element(s) cut or unreachable (b«×1» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [507,518 vs 234,511]; span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [523, |
| sheet_barracks | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ❌ 2+0 | 0 / 0 | 1 | – | ❌ 2 element(s) cut or unreachable (span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [655,669 vs 366,658]; div.qi.more«+3» sideways out of div.bsh-q«×10s×10s×10s×10 |
| sheet_forge | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_forge | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_forge | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_training | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ❌ 1+0 | 0 / 0 | 1 | – | ❌ 1 element(s) cut or unreachable (span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s» [567,581 vs 278,570]) |
| sheet_training | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ❌ 1+0 | 0 / 0 | 1 | – | ❌ 1 element(s) cut or unreachable (span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s» [523,537 vs 234,526]) |
| sheet_training | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ❌ 1+0 | 0 / 0 | 1 | – | ❌ 1 element(s) cut or unreachable (span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s» [655,669 vs 366,658]) |
| sheet_stable | Building sheets | 844x390 | ✅ | ✅ | 320 / 325 | ✅ 44×44 | ❌ 3+0 | 0 / 0 | 1 | 320 | ❌ 3 element(s) cut or unreachable (b«×1» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [551,562 vs 278,555]; span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [567, |
| sheet_stable | Building sheets | 800x360 | ✅ | ✅ | 290 / 325 | ✅ 44×44 | ❌ 3+0 | 0 / 1 | 1 | 290 | ❌ 1 target(s) under notch / Telegram button / home bar; 3 element(s) cut or unreachable (b«×1» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [507,518 vs 234,511]; span.tm«0 |
| sheet_stable | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ❌ 2+0 | 0 / 0 | 1 | – | ❌ 2 element(s) cut or unreachable (span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [655,669 vs 366,658]; div.qi.more«+3» sideways out of div.bsh-q«×10s×10s×10s×10 |
| sheet_workshop | Building sheets | 844x390 | ✅ | ✅ | 320 / 325 | ✅ 44×44 | ❌ 3+0 | 0 / 0 | 1 | 320 | ❌ 3 element(s) cut or unreachable (b«×1» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [551,562 vs 278,555]; span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [567, |
| sheet_workshop | Building sheets | 800x360 | ✅ | ✅ | 290 / 325 | ✅ 44×44 | ❌ 3+0 | 0 / 1 | 1 | 290 | ❌ 1 target(s) under notch / Telegram button / home bar; 3 element(s) cut or unreachable (b«×1» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [507,518 vs 234,511]; span.tm«0 |
| sheet_workshop | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ❌ 2+0 | 0 / 0 | 1 | – | ❌ 2 element(s) cut or unreachable (span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [655,669 vs 366,658]; div.qi.more«+3» sideways out of div.bsh-q«×10s×10s×10s×10 |
| sheet_lair | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ❌ 2+0 | 0 / 0 | 1 | – | ❌ 2 element(s) cut or unreachable (span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [567,581 vs 278,570]; div.qi.more«+3» sideways out of div.bsh-q«×10s×10s×10s×10 |
| sheet_lair | Building sheets | 800x360 | ✅ | ✅ | 290 / 306 | ✅ 44×44 | ❌ 3+0 | 0 / 0 | 1 | 290 | ❌ 3 element(s) cut or unreachable (b«×1» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [507,518 vs 234,511]; span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [523, |
| sheet_lair | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ❌ 2+0 | 0 / 0 | 1 | – | ❌ 2 element(s) cut or unreachable (span.tm«0s» sideways out of div.bsh-q«×10s×10s×10s×10s+3» [655,669 vs 366,658]; div.qi.more«+3» sideways out of div.bsh-q«×10s×10s×10s×10 |
| sheet_archer | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_archer | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_archer | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_ruby | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_ruby | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_ruby | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_emerald | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_emerald | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_emerald | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_turq | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_turq | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_turq | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_ruby | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_ruby | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_ruby | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_emerald | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_emerald | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_emerald | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_turq | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_turq | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_turq | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_farm | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_farm | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_farm | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_sawmill_00 | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_sawmill_00 | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_sawmill_00 | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_smelter_00 | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_smelter_00 | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_smelter_00 | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_mint_00 | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_mint_00 | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_ws_mint_00 | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |

**73 of 159 menu × size cells are fine, 86 fail.**

## 4. What failed BEFORE, what changed, where the frames are

Frames: `photos_UI1_R4.tar.gz` → `pair_<menu>_<size>.jpg` (BEFORE left | AFTER right, full size, one pair for **every cell that failed before** — 86 files) + `pair_toast_home_844x390.jpg`, `pair_43k_gem_pill_hero_844x390.jpg`, `pair_43k_gem_pill_hero_far_844x390.jpg`.

| menu | what was wrong (kit as started, 844×390 unless noted) | fix (file) | list height BEFORE → AFTER (844×390) |
|---|---|---|---|
| Kingdom (owned / town / reserve / buy / new) | header + 3 builder cards + 4 tabs + 5 category chips stacked above the list → the list showed 56–102 px of 390; the chips were 26 px high (< 44) | two panes: a left rail (3 builder pips + 4 tabs as 2×2), the chips (44 px) + the list in the right pane; compact cards (name / description left, cost / action right) — `ui_theme_r4.js` | 56–102 px → 196 px (50 %); 800×360: 72 → 166 px |
| Army (troops / spells / queue) | housing + tabs + «Find a target» stacked → list 52 px | rail: housing, tabs, Find a target; list full height | 52 → 253 px (65 %) |
| Shop (boosts / defense / gems) | list 172 px = 44 % at 844 (rule: ≥ 45 %), 142 px at 800×360 | rail: tabs; list full height | 172 → 260 px |
| Rank (board / leagues / invite) | list 112 px (932×430: 152) | rail: page + tabs; list full height | 112 → 253 px |
| Clan (join / create / mine), Friends, Battle log | list 165 px (800×360: 135) | two panes | 165 → 253 px |
| Settings (4 tabs + owner tools) | date / time + 4 tabs stacked → list 87 px (800×360: 57) | rail: date / time + 4 tabs (2×2); list full height | 87 → 255 px |
| Assist hub | 800×360: the bottom tile row ran under the home bar (4 targets under it) | tiles 68 px high at ≤ 400 px, the panel is centred inside the safe box and scrolls inside if a tiny screen still cannot hold it | — |
| Hero picker (RP1C's, class names only) | close button 42×42 (< 44) and the 6 cards / the button under the notch / Telegram buttons, all 3 sizes | grid inside the side margins, close 44 px under the Telegram Close pill | — |
| Building sheets with unit chips (barracks, training, stable, workshop, lair) | (a) the queue chips were cut off sideways (`overflow:hidden`, no wrap): the «+N» chip and the time of the last chip were not reachable when ≥ 5 units are queued; (b) every re-draw of the sheet ran `scrollIntoView({block:'nearest'})` on the selected unit card, which scrolled the whole sheet up on short phones (800×360, and stable / workshop at 844×390): the title, the close button and the Train button slid under the top edge | (a) the chips wrap (`flex-wrap`); (b) the card is scrolled sideways only — both in `bsheet.js` (own file, lines marked `// UI1_R4:`) | — |

Menus that already passed BEFORE (no change needed): Army unit-info page, spell info, emblem picker, the old one-card info sheet (`ui.js`), the welcome card, the sheets keep / wall / tower / forge / archer / 3 vaults / 3 mines / 4 production lots, the two confirmation dialogs (not measured BEFORE: the code did not change, measured AFTER only).

## 5. The ruby «43K» pill
Two things look like a pill that «sticks» — both are fixed and both have a test:
1. **The toast «+43K ruby — a gift from your games!»** (`main.js showGift` → `ui.toast`). It sat at `--st + 112 px` — at about a third of the screen height (y ≈ 130–165 of 390), i.e. over the hero's head region in the hero mode (frame: `pair_toast_home_844x390.jpg`, home view) — and the text stayed in the element after it faded. Now it sits in the top strip between the two Telegram buttons (never over the hero), is faded after **2.1 s**, its text is **removed** at 2.5 s and the fade is 0.4 s (`ui.js` + `ui_theme_r4.js`). Test `dev/ui1r4_toast.py` (prints `TOAST OK`) measures it in 3 sizes × home / hero inside one `evaluate`: the pill really has a size (width ≥ 150 px, height ≥ 24 px — not an empty box) and its text equals the message; it is inside the screen and the side margins, ends above 34 % of the height, is not in the middle of the view, not over a control and not over the hero's screen rectangle; `on` is removed at 2.0–2.3 s, the text at 2.4–2.65 s, the fade is ≤ 0.45 s.
2. **The 3D gem pill above a mine** (`gems.js gemBadge`, a 12×6 m sprite 37 m above the mine, `mines.js`): in the hero mode it stayed in the view (frames `pair_43k_gem_pill_hero_*.jpg`: «+7834» hanging in the sky). `main.js` now hides every gem badge while the hero is out and shows them again when the hero leaves (2 lines marked `// UI1_R4:`). Test `dev/ui1r4_43k.py` (prints `43K PILL OK`): hero mode → no gem pill visible on screen, none covers the hero or the screen centre; after leaving the hero mode all 3 are visible again. The proof run uses `FAST=1` (the ruby mine at 130 m and 300 m + the hero-mode / restore check of all three pills); the full mode (3 mines × 5 distances + a near, pitched view) was run once earlier on the same two lines of `main.js` (`43k_after`).
**Not proven:** which of the two the owner actually saw (I could not reproduce a pill over the hero's *centre* in the rig; the toast was over the hero's head region and the 3D pill was in the sky).

## 6. Method and what is NOT covered
- **How it was measured:** the real game (`dev/ui1r2_rig_build.sh`), headless Chromium on software GL (SwiftShader), page ≈ 2 min to load; every menu is opened by its real button (hub → tile, tab, the crown button, the building tap through `ctl.onTap`, the Rush hold on the sheet); viewport 844×390, 800×360, 932×430; the Telegram margins are `--tg-content-safe-area-inset-top` 52 px, sides 47 px, bottom 21 px and two mock Telegram pills (Close / ⌄ ⋮) drawn on top; probe `dev/ui1r4_probe.js`, rules `dev/ui1r4_rules.py` (a list pane must show ≥ 45 % of the screen height — a design rule I chose).
- **Building sheets** are opened once by the real tap and then measured at the three sizes (the viewport is resized while the sheet stays open); every probe starts from `scrollTop 0` (a real user opens a sheet at the top).
- **BEFORE** = the kit as started (page built before any edit). The unit-chip sheets were re-measured BEFORE with a long queue (8 queued units, the state in which the chips overflow). Two earlier BEFORE runs had measurement errors that were found and removed (the hero picker left open over the old info card; a browser tab that still held my live-injected CSS) — their results are not used.
- **Probe fix during the round:** a row inside a panel that scrolls itself (a building sheet) is no longer called «under the home bar» when it only needs a scroll to be reached (the unit cards in the stable / workshop sheet at 800×360 are ~20 px cut at the sheet's bottom and reached by scrolling the sheet by 35 px). This was changed after seeing the first run; the proof run and the BEFORE sheet runs use the final probe.
- **Proof run:** `bash dev/ui1_menus_test.sh` (full, ~75 min on 2 cores) printed `UI1 MENUS OK` — 159 cells ok, 0 fail, 0 error, 3 skipped, 53 menus, then `43K PILL OK` and `TOAST OK`. The two confirmation dialogs were added to the scene list after that run (the first version could not open one: «no dialog»); they were run alone on the same build (`confirm/results.json`: 6 cells ok) and are part of the next full run.
- **NOT covered:** the battle panels that need a real opponent from the server (scout / confirm / result / replay); the loading and error screens; menus that only exist for the owner on the real server; any device other than the three emulated sizes; portrait (the game is landscape-only); the on-phone feel — scroll inertia, tap accuracy, how the Telegram WebView really reports its insets. **Nothing here is proven on a phone** — it is software-rendered Chromium with emulated Telegram margins.
- **Found, not fixed:** the welcome card says «+1 more» while rows are hidden — the count and the rows disagree (own file `ui.js`, outside this job's list of failures); Kingdom at 800×360 shows 166 px of list (≈ 1.5 cards at a time) — usable, tight.
