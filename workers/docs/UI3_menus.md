# UI3 — menu census, BEFORE (kit e35e072 as started) vs AFTER (look 1) — landscape 844×390, 800×360, 932×430, Telegram margins on

Every menu is opened **by its real button** in the **real game** (non-sheet rows), headless Chromium (software GL, **not a phone**), at the three sizes with the Telegram insets (`--tg-content-safe-area-inset-top` 52 px, sides 47 px, bottom 21 px) and the two Telegram buttons drawn on top. **Building sheets (`sheet_*`) and their two confirmation dialogs are measured in the LIGHT RIG** (`dev/ui3_rig*.js`: the real `bsheet.js` + real Econ, opened by `__bw.sheets.open(id)` instead of a camera + tap, on a photo of the map, with every training queue filled to 7 — the same state that made the barracks sheet 83 % high in the real game; the numbers matched to the pixel: 322 / 292 px). The real-game sheet frames are in the photos as `real_sheet_*` (AFTER only). The pass rule is `dev/ui1r4_rules.py` + the probe `dev/ui1r4_probe.js`: opens · fits the screen · the page never scrolls · the close button is ≥ 40 px (owner rule: buttons 40–48 px), reachable and not under a Telegram button · no target < 40 px · nothing under the notch / rounded corner / home bar · no clipped text or unreachable content · a scrolling list shows ≥ 45 % of the screen height.

**BEFORE** = the kit as started (kit e35e072, built before any edit; measured under the UI3 rules: panel <= 70 % x 75 %, targets >= 40 px). **AFTER** = the real build with this round's changes (UI3 build, look 1). ✅ passes · ❌ fails · – not opened (see the end) · · not measured on that side.

## 1. Summary — menu × size

| menu | BEFORE 844 | 800 | 932 | AFTER 844 | 800 | 932 | what fixed it |
|---|---|---|---|---|---|---|---|
| hub | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a 600 px card, <= 68 % high, centred in the safe box; ten tiles with the one icon set |
| kingdom_owned | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card (<= 68 % x 74 %): rail (3 builder chips + 4 tabs) + the list; compact rows, category chips >= 40 px |
| kingdom_owned_mixed | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card (<= 68 % x 74 %): rail (3 builder chips + 4 tabs) + the list; compact rows, category chips >= 40 px |
| kingdom_town | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card (<= 68 % x 74 %): rail (3 builder chips + 4 tabs) + the list; compact rows, category chips >= 40 px |
| kingdom_reserve | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card (<= 68 % x 74 %): rail (3 builder chips + 4 tabs) + the list; compact rows, category chips >= 40 px |
| kingdom_buy | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card (<= 68 % x 74 %): rail (3 builder chips + 4 tabs) + the list; compact rows, category chips >= 40 px |
| kingdom_new | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card (<= 68 % x 74 %): rail (3 builder chips + 4 tabs) + the list; compact rows, category chips >= 40 px |
| army_troops | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card; the unit card is a small horizontal tile (picture left, name / stats / cost right), two per row |
| army_spells | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card; the unit card is a small horizontal tile (picture left, name / stats / cost right), two per row |
| army_queue | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card; the unit card is a small horizontal tile (picture left, name / stats / cost right), two per row |
| army_unit_info_common | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | the unit page is a small card, not the full screen; the design-sheet button no longer collapses |
| army_unit_info_mythic | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | the unit page is a small card, not the full screen; the design-sheet button no longer collapses |
| army_spell_info | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | a small card; the unit card is a small horizontal tile (picture left, name / stats / cost right), two per row |
| army_emblem_picker | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | a small card; the unit card is a small horizontal tile (picture left, name / stats / cost right), two per row |
| shop_boosts | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card; the description above the list is no longer cut |
| shop_defense | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card; the description above the list is no longer cut |
| shop_gems | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card; the description above the list is no longer cut |
| rank_leaderboard | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card, one font |
| rank_leagues | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card, one font |
| rank_invite | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card, one font |
| clan_join | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card, one font |
| clan_create | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card, one font |
| clan_mine | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card, one font |
| friends | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card, one font |
| battle_log | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card, one font |
| settings_sound | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card: date / time + 4 tabs in the rail |
| settings_graphics | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card: date / time + 4 tabs in the rail |
| settings_controls | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card: date / time + 4 tabs in the rail |
| settings_about | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card: date / time + 4 tabs in the rail |
| settings_graphics_owner_tools | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | a small card: date / time + 4 tabs in the rail |
| sheet_keep | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_wall | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_tower | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_barracks | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | blue / silver tokens, one icon set; the unit-training sheets (barracks, training, stable, workshop, lair) were 83 % high with a queue and the mine / vault sheets 75 % at 800x360 — now <= 70 %: compact header, one sideways row of queue chips («+N» first), smaller unit chips |
| sheet_forge | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_training | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | blue / silver tokens, one icon set; the unit-training sheets (barracks, training, stable, workshop, lair) were 83 % high with a queue and the mine / vault sheets 75 % at 800x360 — now <= 70 %: compact header, one sideways row of queue chips («+N» first), smaller unit chips |
| sheet_stable | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | blue / silver tokens, one icon set; the unit-training sheets (barracks, training, stable, workshop, lair) were 83 % high with a queue and the mine / vault sheets 75 % at 800x360 — now <= 70 %: compact header, one sideways row of queue chips («+N» first), smaller unit chips |
| sheet_workshop | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | blue / silver tokens, one icon set; the unit-training sheets (barracks, training, stable, workshop, lair) were 83 % high with a queue and the mine / vault sheets 75 % at 800x360 — now <= 70 %: compact header, one sideways row of queue chips («+N» first), smaller unit chips |
| sheet_lair | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | blue / silver tokens, one icon set; the unit-training sheets (barracks, training, stable, workshop, lair) were 83 % high with a queue and the mine / vault sheets 75 % at 800x360 — now <= 70 %: compact header, one sideways row of queue chips («+N» first), smaller unit chips |
| sheet_archer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_vault_ruby | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | blue / silver tokens, one icon set; the unit-training sheets (barracks, training, stable, workshop, lair) were 83 % high with a queue and the mine / vault sheets 75 % at 800x360 — now <= 70 %: compact header, one sideways row of queue chips («+N» first), smaller unit chips |
| sheet_vault_emerald | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | blue / silver tokens, one icon set; the unit-training sheets (barracks, training, stable, workshop, lair) were 83 % high with a queue and the mine / vault sheets 75 % at 800x360 — now <= 70 %: compact header, one sideways row of queue chips («+N» first), smaller unit chips |
| sheet_vault_turq | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | blue / silver tokens, one icon set; the unit-training sheets (barracks, training, stable, workshop, lair) were 83 % high with a queue and the mine / vault sheets 75 % at 800x360 — now <= 70 %: compact header, one sideways row of queue chips («+N» first), smaller unit chips |
| sheet_mine_ruby | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | blue / silver tokens, one icon set; the unit-training sheets (barracks, training, stable, workshop, lair) were 83 % high with a queue and the mine / vault sheets 75 % at 800x360 — now <= 70 %: compact header, one sideways row of queue chips («+N» first), smaller unit chips |
| sheet_mine_emerald | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | blue / silver tokens, one icon set; the unit-training sheets (barracks, training, stable, workshop, lair) were 83 % high with a queue and the mine / vault sheets 75 % at 800x360 — now <= 70 %: compact header, one sideways row of queue chips («+N» first), smaller unit chips |
| sheet_mine_turq | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | blue / silver tokens, one icon set; the unit-training sheets (barracks, training, stable, workshop, lair) were 83 % high with a queue and the mine / vault sheets 75 % at 800x360 — now <= 70 %: compact header, one sideways row of queue chips («+N» first), smaller unit chips |
| sheet_ws_farm | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_ws_sawmill_00 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_ws_smelter_00 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_ws_mint_00 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_confirm_dialog | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| sheet_confirm_rush | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| hero_picker | ✅ | · | ✅ | ✅ | ✅ | ✅ |  |
| old_info_card | ✅ | · | ✅ | ✅ | ✅ | ✅ |  |
| welcome_card | ✅ | · | ✅ | ✅ | ✅ | ✅ |  |

**BEFORE: 53 of 162 measured cells pass, 109 fail.   AFTER: 165 of 165 measured cells pass, 0 fail.**

## 2. AFTER — full table (real build)

| menu | group | size | opens | fits | scrolls inside | close | clipped | targets <44 / under notch | cols | list px | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| hub | Hub | 844x390 | ✅ | ✅ | no (fits) | ✅ 40×40 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| hub | Hub | 800x360 | ✅ | ✅ | no (fits) | ✅ 40×40 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| hub | Hub | 932x430 | ✅ | ✅ | no (fits) | ✅ 40×40 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| kingdom_owned | Kingdom | 844x390 | ✅ | ✅ | 153 / 1340 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 153 | ✅ OK |
| kingdom_owned | Kingdom | 800x360 | ✅ | ✅ | 133 / 1418 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 133 | ✅ OK |
| kingdom_owned | Kingdom | 932x430 | ✅ | ✅ | 180 / 1340 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 180 | ✅ OK |
| kingdom_owned_mixed | Kingdom | 844x390 | ✅ | ✅ | 153 / 1413 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 153 | ✅ OK |
| kingdom_owned_mixed | Kingdom | 800x360 | ✅ | ✅ | 133 / 1439 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 133 | ✅ OK |
| kingdom_owned_mixed | Kingdom | 932x430 | ✅ | ✅ | 180 / 1413 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 180 | ✅ OK |
| kingdom_town | Kingdom | 844x390 | ✅ | ✅ | no (fits) | ✅ 42×42 | ✅ | 0 / 0 | 3 | – | ✅ OK |
| kingdom_town | Kingdom | 800x360 | ✅ | ✅ | 133 / 136 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 133 | ✅ OK |
| kingdom_town | Kingdom | 932x430 | ✅ | ✅ | no (fits) | ✅ 42×42 | ✅ | 0 / 0 | 3 | – | ✅ OK |
| kingdom_reserve | Kingdom | 844x390 | ✅ | ✅ | 153 / 490 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 153 | ✅ OK |
| kingdom_reserve | Kingdom | 800x360 | ✅ | ✅ | 133 / 490 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 133 | ✅ OK |
| kingdom_reserve | Kingdom | 932x430 | ✅ | ✅ | 180 / 490 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 180 | ✅ OK |
| kingdom_buy | Kingdom | 844x390 | ✅ | ✅ | 153 / 282 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 153 | ✅ OK |
| kingdom_buy | Kingdom | 800x360 | ✅ | ✅ | 133 / 308 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 133 | ✅ OK |
| kingdom_buy | Kingdom | 932x430 | ✅ | ✅ | 180 / 282 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 180 | ✅ OK |
| kingdom_new | Kingdom | 844x390 | ✅ | ✅ | 153 / 536 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 153 | ✅ OK |
| kingdom_new | Kingdom | 800x360 | ✅ | ✅ | 133 / 536 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 133 | ✅ OK |
| kingdom_new | Kingdom | 932x430 | ✅ | ✅ | 180 / 536 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 180 | ✅ OK |
| army_troops | Army | 844x390 | ✅ | ✅ | 203 / 1951 | ✅ 40×40 | ✅ | 0 / 0 | 2 | 203 | ✅ OK |
| army_troops | Army | 800x360 | ✅ | ✅ | 183 / 2554 | ✅ 40×40 | ✅ | 0 / 0 | 2 | 183 | ✅ OK |
| army_troops | Army | 932x430 | ✅ | ✅ | 230 / 2699 | ✅ 40×40 | ✅ | 0 / 0 | 2 | 230 | ✅ OK |
| army_spells | Army | 844x390 | ✅ | ✅ | 203 / 490 | ✅ 40×40 | ✅ | 0 / 0 | 2 | 203 | ✅ OK |
| army_spells | Army | 800x360 | ✅ | ✅ | 183 / 490 | ✅ 40×40 | ✅ | 0 / 0 | 2 | 183 | ✅ OK |
| army_spells | Army | 932x430 | ✅ | ✅ | 230 / 490 | ✅ 40×40 | ✅ | 0 / 0 | 2 | 230 | ✅ OK |
| army_queue | Army | 844x390 | ✅ | ✅ | 203 / 2699 | ✅ 40×40 | ✅ | 0 / 0 | 2 | 203 | ✅ OK |
| army_queue | Army | 800x360 | ✅ | ✅ | 183 / 2699 | ✅ 40×40 | ✅ | 0 / 0 | 2 | 183 | ✅ OK |
| army_queue | Army | 932x430 | ✅ | ✅ | 230 / 2699 | ✅ 40×40 | ✅ | 0 / 0 | 2 | 230 | ✅ OK |
| army_unit_info_common | Army | 844x390 | ✅ | ✅ | 210 / 1238 | ✅ 40×40 | ✅ | 0 / 0 | 3 | 210 | ✅ OK |
| army_unit_info_common | Army | 800x360 | ✅ | ✅ | 190 / 1296 | ✅ 40×40 | ✅ | 0 / 0 | 3 | 190 | ✅ OK |
| army_unit_info_common | Army | 932x430 | ✅ | ✅ | 237 / 1238 | ✅ 40×40 | ✅ | 0 / 0 | 3 | 237 | ✅ OK |
| army_unit_info_mythic | Army | 844x390 | ✅ | ✅ | 210 / 1327 | ✅ 40×40 | ✅ | 0 / 0 | 3 | 210 | ✅ OK |
| army_unit_info_mythic | Army | 800x360 | ✅ | ✅ | 190 / 1365 | ✅ 40×40 | ✅ | 0 / 0 | 3 | 190 | ✅ OK |
| army_unit_info_mythic | Army | 932x430 | ✅ | ✅ | 237 / 1327 | ✅ 40×40 | ✅ | 0 / 0 | 3 | 237 | ✅ OK |
| army_spell_info | Army | 844x390 | ✅ | ✅ | 225 / 307 | tap outside | ✅ | 0 / 0 | 4 | 225 | ✅ OK |
| army_spell_info | Army | 800x360 | ✅ | ✅ | 205 / 307 | tap outside | ✅ | 0 / 0 | 4 | 205 | ✅ OK |
| army_spell_info | Army | 932x430 | ✅ | ✅ | 252 / 307 | tap outside | ✅ | 0 / 0 | 4 | 252 | ✅ OK |
| army_emblem_picker | Army | 844x390 | ✅ | ✅ | 225 / 589 | ✅ 72×72 | ✅ | 0 / 0 | 4 | 225 | ✅ OK |
| army_emblem_picker | Army | 800x360 | ✅ | ✅ | 205 / 589 | ✅ 72×72 | ✅ | 0 / 0 | 4 | 205 | ✅ OK |
| army_emblem_picker | Army | 932x430 | ✅ | ✅ | 252 / 589 | ✅ 72×72 | ✅ | 0 / 0 | 4 | 252 | ✅ OK |
| shop_boosts | Shop | 844x390 | ✅ | ✅ | 215 / 522 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 215 | ✅ OK |
| shop_boosts | Shop | 800x360 | ✅ | ✅ | 195 / 706 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 195 | ✅ OK |
| shop_boosts | Shop | 932x430 | ✅ | ✅ | 242 / 522 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 242 | ✅ OK |
| shop_defense | Shop | 844x390 | ✅ | ✅ | no (fits) | ✅ 40×40 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| shop_defense | Shop | 800x360 | ✅ | ✅ | no (fits) | ✅ 40×40 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| shop_defense | Shop | 932x430 | ✅ | ✅ | no (fits) | ✅ 40×40 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| shop_gems | Shop | 844x390 | ✅ | ✅ | 215 / 470 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 215 | ✅ OK |
| shop_gems | Shop | 800x360 | ✅ | ✅ | 195 / 470 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 195 | ✅ OK |
| shop_gems | Shop | 932x430 | ✅ | ✅ | 242 / 455 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 242 | ✅ OK |
| rank_leaderboard | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 203 / 711 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 203 | ✅ OK |
| rank_leaderboard | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 183 / 711 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 183 | ✅ OK |
| rank_leaderboard | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 230 / 711 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 230 | ✅ OK |
| rank_leagues | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 203 / 584 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 203 | ✅ OK |
| rank_leagues | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 183 / 605 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 183 | ✅ OK |
| rank_leagues | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 230 / 584 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 230 | ✅ OK |
| rank_invite | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 203 / 508 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 203 | ✅ OK |
| rank_invite | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 183 / 508 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 183 | ✅ OK |
| rank_invite | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 230 / 508 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 230 | ✅ OK |
| clan_join | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 203 / 519 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 203 | ✅ OK |
| clan_join | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 183 / 519 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 183 | ✅ OK |
| clan_join | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 230 / 519 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 230 | ✅ OK |
| clan_create | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 203 / 519 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 203 | ✅ OK |
| clan_create | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 183 / 519 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 183 | ✅ OK |
| clan_create | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 230 / 519 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 230 | ✅ OK |
| clan_mine | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 203 / 662 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 203 | ✅ OK |
| clan_mine | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 183 / 662 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 183 | ✅ OK |
| clan_mine | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 230 / 662 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 230 | ✅ OK |
| friends | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 203 / 461 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 203 | ✅ OK |
| friends | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 183 / 461 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 183 | ✅ OK |
| friends | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 230 / 446 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 230 | ✅ OK |
| battle_log | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 203 / 625 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 203 | ✅ OK |
| battle_log | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 183 / 625 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 183 | ✅ OK |
| battle_log | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 230 / 625 | ✅ 40×40 | ✅ | 0 / 0 | 1 | 230 | ✅ OK |
| settings_sound | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 210 / 1004 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 210 | ✅ OK |
| settings_sound | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 190 / 1004 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 190 | ✅ OK |
| settings_sound | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 237 / 1004 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 237 | ✅ OK |
| settings_graphics | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 210 / 1099 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 210 | ✅ OK |
| settings_graphics | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 190 / 1099 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 190 | ✅ OK |
| settings_graphics | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 237 / 1099 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 237 | ✅ OK |
| settings_controls | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 210 / 737 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 210 | ✅ OK |
| settings_controls | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 190 / 737 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 190 | ✅ OK |
| settings_controls | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 237 / 737 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 237 | ✅ OK |
| settings_about | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 210 / 4141 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 210 | ✅ OK |
| settings_about | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 190 / 4346 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 190 | ✅ OK |
| settings_about | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 237 / 4100 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 237 | ✅ OK |
| settings_graphics_owner_tools | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 210 / 1099 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 210 | ✅ OK |
| settings_graphics_owner_tools | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 190 / 1099 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 190 | ✅ OK |
| settings_graphics_owner_tools | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 237 / 1099 | ✅ 42×42 | ✅ | 0 / 0 | 1 | 237 | ✅ OK |
| hero_picker | Hero | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 6 | – | ✅ OK |
| hero_picker | Hero | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 6 | – | ✅ OK |
| hero_picker | Hero | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 6 | – | ✅ OK |
| old_info_card | Info card (ui.js) | 844x390 | ✅ | ✅ | no (fits) | ✅ 42×42 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| old_info_card | Info card (ui.js) | 800x360 | ✅ | ✅ | no (fits) | ✅ 42×42 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| old_info_card | Info card (ui.js) | 932x430 | ✅ | ✅ | no (fits) | ✅ 42×42 | ✅ | 0 / 0 | 1 | – | ✅ OK |
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
| sheet_barracks | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_barracks | Building sheets | 800x360 | ✅ | ✅ | 250 / 252 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 250 | ✅ OK |
| sheet_barracks | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_forge | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_forge | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_forge | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_training | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_training | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_training | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_stable | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_stable | Building sheets | 800x360 | ✅ | ✅ | 250 / 252 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 250 | ✅ OK |
| sheet_stable | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_workshop | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_workshop | Building sheets | 800x360 | ✅ | ✅ | 250 / 252 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 250 | ✅ OK |
| sheet_workshop | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_lair | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_lair | Building sheets | 800x360 | ✅ | ✅ | 250 / 252 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 250 | ✅ OK |
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
| sheet_confirm_dialog | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 166×48 | ✅ | 0 / 0 | 2 | – | ✅ OK |
| sheet_confirm_dialog | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 166×48 | ✅ | 0 / 0 | 2 | – | ✅ OK |
| sheet_confirm_dialog | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 166×48 | ✅ | 0 / 0 | 2 | – | ✅ OK |
| sheet_confirm_rush | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 166×52 | ✅ | 0 / 0 | 2 | – | ✅ OK |
| sheet_confirm_rush | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 166×52 | ✅ | 0 / 0 | 2 | – | ✅ OK |
| sheet_confirm_rush | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 166×52 | ✅ | 0 / 0 | 2 | – | ✅ OK |

**165 of 165 menu × size cells are fine, 0 fail.**


## 3. BEFORE — full table (kit as started)

| menu | group | size | opens | fits | scrolls inside | close | clipped | targets <44 / under notch | cols | list px | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| hub | Hub | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 5 | – | ❌ panel too big: 62% x 79% of the screen (the limit is 75% x 70%) |
| hub | Hub | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 5 | – | ❌ panel too big: 65% x 86% of the screen (the limit is 75% x 70%) |
| hub | Hub | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 5 | – | ❌ panel too big: 56% x 83% of the screen (the limit is 75% x 70%) |
| kingdom_owned | Kingdom | 844x390 | ✅ | ✅ | 196 / 1575 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 196 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| kingdom_owned | Kingdom | 800x360 | ✅ | ✅ | 166 / 1773 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 166 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| kingdom_owned | Kingdom | 932x430 | ✅ | ✅ | 236 / 1564 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 236 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| kingdom_owned_mixed | Kingdom | 844x390 | ✅ | ✅ | 196 / 1771 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 196 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| kingdom_owned_mixed | Kingdom | 800x360 | ✅ | ✅ | 166 / 1874 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 166 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| kingdom_owned_mixed | Kingdom | 932x430 | ✅ | ✅ | 236 / 1762 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 236 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| kingdom_town | Kingdom | 844x390 | ✅ | ✅ | no (fits) | ✅ 46×46 | ✅ | 0 / 0 | 3 | – | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| kingdom_town | Kingdom | 800x360 | ✅ | ✅ | 166 / 205 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 166 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| kingdom_town | Kingdom | 932x430 | ✅ | ✅ | no (fits) | ✅ 46×46 | ✅ | 0 / 0 | 3 | – | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| kingdom_reserve | Kingdom | 844x390 | ✅ | ✅ | 196 / 589 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 196 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| kingdom_reserve | Kingdom | 800x360 | ✅ | ✅ | 166 / 589 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 166 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| kingdom_reserve | Kingdom | 932x430 | ✅ | ✅ | 236 / 589 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 236 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| kingdom_buy | Kingdom | 844x390 | ✅ | ✅ | 196 / 334 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 196 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| kingdom_buy | Kingdom | 800x360 | ✅ | ✅ | 166 / 360 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 166 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| kingdom_buy | Kingdom | 932x430 | ✅ | ✅ | 236 / 321 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 236 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| kingdom_new | Kingdom | 844x390 | ✅ | ✅ | 196 / 536 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 196 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| kingdom_new | Kingdom | 800x360 | ✅ | ✅ | 166 / 536 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 166 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| kingdom_new | Kingdom | 932x430 | ✅ | ✅ | 236 / 536 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 236 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| army_troops | Army | 844x390 | ✅ | ✅ | 253 / 1780 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 253 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| army_troops | Army | 800x360 | ✅ | ✅ | 223 / 2312 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 223 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| army_troops | Army | 932x430 | ✅ | ✅ | 293 / 1826 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 293 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| army_spells | Army | 844x390 | ✅ | ✅ | 253 / 259 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 253 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| army_spells | Army | 800x360 | ✅ | ✅ | 223 / 251 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 223 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| army_spells | Army | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| army_queue | Army | 844x390 | ✅ | ✅ | 253 / 2534 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 253 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| army_queue | Army | 800x360 | ✅ | ✅ | 223 / 2458 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 223 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| army_queue | Army | 932x430 | ✅ | ✅ | 293 / 2580 | ✅ 44×44 | ✅ | 0 / 0 | 5 | 293 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| army_unit_info_common | Army | 844x390 | ✅ | ✅ | 277 / 1460 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 277 | ❌ panel too big: 100% x 100% of the screen (the limit is 75% x 70%) |
| army_unit_info_common | Army | 800x360 | ✅ | ✅ | 247 / 1460 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 247 | ❌ panel too big: 100% x 100% of the screen (the limit is 75% x 70%) |
| army_unit_info_common | Army | 932x430 | ✅ | ✅ | 317 / 1460 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 317 | ❌ panel too big: 100% x 100% of the screen (the limit is 75% x 70%) |
| army_unit_info_mythic | Army | 844x390 | ✅ | ✅ | 277 / 1546 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 277 | ❌ panel too big: 100% x 100% of the screen (the limit is 75% x 70%) |
| army_unit_info_mythic | Army | 800x360 | ✅ | ✅ | 247 / 1546 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 247 | ❌ panel too big: 100% x 100% of the screen (the limit is 75% x 70%) |
| army_unit_info_mythic | Army | 932x430 | ✅ | ✅ | 317 / 1546 | ✅ 44×44 | ✅ | 0 / 0 | 3 | 317 | ❌ panel too big: 100% x 100% of the screen (the limit is 75% x 70%) |
| army_spell_info | Army | 844x390 | ✅ | ✅ | 277 / 309 | tap outside | ✅ | 0 / 0 | 4 | 277 | ❌ panel too big: 43% x 72% of the screen (the limit is 75% x 70%) |
| army_spell_info | Army | 800x360 | ✅ | ✅ | 247 / 309 | tap outside | ✅ | 0 / 0 | 4 | 247 | ✅ OK |
| army_spell_info | Army | 932x430 | ✅ | ✅ | no (fits) | tap outside | ✅ | 0 / 0 | 4 | – | ❌ panel too big: 39% x 72% of the screen (the limit is 75% x 70%) |
| army_emblem_picker | Army | 844x390 | ✅ | ✅ | 277 / 589 | ✅ 72×72 | ✅ | 0 / 0 | 4 | 277 | ❌ panel too big: 43% x 72% of the screen (the limit is 75% x 70%) |
| army_emblem_picker | Army | 800x360 | ✅ | ✅ | 247 / 589 | ✅ 72×72 | ✅ | 0 / 0 | 4 | 247 | ✅ OK |
| army_emblem_picker | Army | 932x430 | ✅ | ✅ | 317 / 589 | ✅ 72×72 | ✅ | 0 / 0 | 4 | 317 | ❌ panel too big: 39% x 74% of the screen (the limit is 75% x 70%) |
| shop_boosts | Shop | 844x390 | ✅ | ✅ | 260 / 858 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 260 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| shop_boosts | Shop | 800x360 | ✅ | ✅ | 230 / 858 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 230 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| shop_boosts | Shop | 932x430 | ✅ | ✅ | 300 / 858 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 300 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| shop_defense | Shop | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| shop_defense | Shop | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| shop_defense | Shop | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| shop_gems | Shop | 844x390 | ✅ | ✅ | 260 / 537 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 260 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| shop_gems | Shop | 800x360 | ✅ | ✅ | 230 / 537 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 230 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| shop_gems | Shop | 932x430 | ✅ | ✅ | 300 / 537 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 300 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| rank_leaderboard | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 723 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| rank_leaderboard | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 723 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| rank_leaderboard | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 723 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| rank_leagues | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 605 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| rank_leagues | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 605 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| rank_leagues | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 584 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| rank_invite | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 509 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| rank_invite | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 509 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| rank_invite | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 509 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| clan_join | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| clan_join | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| clan_join | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| clan_create | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| clan_create | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| clan_create | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 521 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| clan_mine | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 665 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| clan_mine | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 665 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| clan_mine | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 665 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| friends | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 466 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| friends | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 466 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| friends | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 451 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| battle_log | Rank / Clan / Friends / Log | 844x390 | ✅ | ✅ | 253 / 645 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 253 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| battle_log | Rank / Clan / Friends / Log | 800x360 | ✅ | ✅ | 223 / 645 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 223 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| battle_log | Rank / Clan / Friends / Log | 932x430 | ✅ | ✅ | 293 / 645 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 293 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| settings_sound | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 255 / 1015 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 255 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| settings_sound | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 225 / 1015 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 225 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| settings_sound | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 295 / 1015 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 295 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| settings_graphics | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 255 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 255 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| settings_graphics | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 225 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 225 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| settings_graphics | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 295 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 295 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| settings_controls | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 255 / 742 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 255 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| settings_controls | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 225 / 742 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 225 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| settings_controls | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 295 / 742 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 295 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| settings_about | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 255 / 4519 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 255 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| settings_about | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 225 / 4723 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 225 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| settings_about | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 295 / 4254 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 295 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| settings_graphics_owner_tools | Settings (+ owner tools) | 844x390 | ✅ | ✅ | 255 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 255 | ❌ panel too big: 86% x 81% of the screen (the limit is 75% x 70%) |
| settings_graphics_owner_tools | Settings (+ owner tools) | 800x360 | ✅ | ✅ | 225 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 225 | ❌ panel too big: 86% x 80% of the screen (the limit is 75% x 70%) |
| settings_graphics_owner_tools | Settings (+ owner tools) | 932x430 | ✅ | ✅ | 295 / 1104 | ✅ 46×46 | ✅ | 0 / 0 | 1 | 295 | ❌ panel too big: 82% x 83% of the screen (the limit is 75% x 70%) |
| sheet_keep | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_keep | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_keep | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_wall | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_wall | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_wall | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_tower | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_tower | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_tower | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_barracks | Building sheets | 844x390 | ✅ | ✅ | 320 / 344 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 320 | ❌ panel too big: 62% x 83% of the screen (the limit is 75% x 70%) |
| sheet_barracks | Building sheets | 800x360 | ✅ | ✅ | 290 / 344 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 290 | ❌ panel too big: 65% x 81% of the screen (the limit is 75% x 70%) |
| sheet_barracks | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 56% x 80% of the screen (the limit is 75% x 70%) |
| sheet_forge | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_forge | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_forge | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_training | Building sheets | 844x390 | ✅ | ✅ | 320 / 326 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 320 | ❌ panel too big: 62% x 83% of the screen (the limit is 75% x 70%) |
| sheet_training | Building sheets | 800x360 | ✅ | ✅ | 290 / 326 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 290 | ❌ panel too big: 65% x 81% of the screen (the limit is 75% x 70%) |
| sheet_training | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 56% x 76% of the screen (the limit is 75% x 70%) |
| sheet_stable | Building sheets | 844x390 | ✅ | ✅ | 320 / 363 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 320 | ❌ panel too big: 62% x 83% of the screen (the limit is 75% x 70%) |
| sheet_stable | Building sheets | 800x360 | ✅ | ✅ | 290 / 363 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 290 | ❌ panel too big: 65% x 81% of the screen (the limit is 75% x 70%) |
| sheet_stable | Building sheets | 932x430 | ✅ | ✅ | 360 / 363 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 360 | ❌ panel too big: 56% x 84% of the screen (the limit is 75% x 70%) |
| sheet_workshop | Building sheets | 844x390 | ✅ | ✅ | 320 / 363 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 320 | ❌ panel too big: 62% x 83% of the screen (the limit is 75% x 70%) |
| sheet_workshop | Building sheets | 800x360 | ✅ | ✅ | 290 / 363 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 290 | ❌ panel too big: 65% x 81% of the screen (the limit is 75% x 70%) |
| sheet_workshop | Building sheets | 932x430 | ✅ | ✅ | 360 / 363 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 360 | ❌ panel too big: 56% x 84% of the screen (the limit is 75% x 70%) |
| sheet_lair | Building sheets | 844x390 | ✅ | ✅ | 320 / 344 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 320 | ❌ panel too big: 62% x 83% of the screen (the limit is 75% x 70%) |
| sheet_lair | Building sheets | 800x360 | ✅ | ✅ | 290 / 344 | ✅ 44×44 | ✅ | 0 / 0 | 1 | 290 | ❌ panel too big: 65% x 81% of the screen (the limit is 75% x 70%) |
| sheet_lair | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 56% x 80% of the screen (the limit is 75% x 70%) |
| sheet_archer | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_archer | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_archer | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_ruby | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_ruby | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 65% x 75% of the screen (the limit is 75% x 70%) |
| sheet_vault_ruby | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_emerald | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_emerald | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 65% x 75% of the screen (the limit is 75% x 70%) |
| sheet_vault_emerald | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_turq | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_vault_turq | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 65% x 75% of the screen (the limit is 75% x 70%) |
| sheet_vault_turq | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_ruby | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_ruby | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 65% x 75% of the screen (the limit is 75% x 70%) |
| sheet_mine_ruby | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_emerald | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_emerald | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 65% x 75% of the screen (the limit is 75% x 70%) |
| sheet_mine_emerald | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_turq | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| sheet_mine_turq | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 1 | – | ❌ panel too big: 65% x 75% of the screen (the limit is 75% x 70%) |
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
| sheet_confirm_dialog | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 166×48 | ✅ | 0 / 0 | 2 | – | ✅ OK |
| sheet_confirm_dialog | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 166×48 | ✅ | 0 / 0 | 2 | – | ✅ OK |
| sheet_confirm_dialog | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 166×48 | ✅ | 0 / 0 | 2 | – | ✅ OK |
| sheet_confirm_rush | Building sheets | 844x390 | ✅ | ✅ | no (fits) | ✅ 166×52 | ✅ | 0 / 0 | 2 | – | ✅ OK |
| sheet_confirm_rush | Building sheets | 800x360 | ✅ | ✅ | no (fits) | ✅ 166×52 | ✅ | 0 / 0 | 2 | – | ✅ OK |
| sheet_confirm_rush | Building sheets | 932x430 | ✅ | ✅ | no (fits) | ✅ 166×52 | ✅ | 0 / 0 | 2 | – | ✅ OK |
| hero_picker | Hero | 844x390 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 6 | – | ✅ OK |
| hero_picker | Hero | 932x430 | ✅ | ✅ | no (fits) | ✅ 44×44 | ✅ | 0 / 0 | 6 | – | ✅ OK |
| old_info_card | Info card (ui.js) | 844x390 | ✅ | ✅ | no (fits) | ✅ 46×46 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| old_info_card | Info card (ui.js) | 932x430 | ✅ | ✅ | no (fits) | ✅ 46×46 | ✅ | 0 / 0 | 1 | – | ✅ OK |
| welcome_card | Welcome card | 844x390 | ✅ | ✅ | no (fits) | tap outside | ✅ | 0 / 0 | 1 | – | ✅ OK |
| welcome_card | Welcome card | 932x430 | ✅ | ✅ | no (fits) | tap outside | ✅ | 0 / 0 | 1 | – | ✅ OK |

**53 of 162 menu × size cells are fine, 109 fail.**

