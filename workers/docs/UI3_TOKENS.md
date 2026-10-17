# UI3 — the interface tokens (colour · font · icons · sizes)

*Owner: UI3 (strategic-mode UI).  Written for UI2 (hero HUD / `rp_marker.js`) and anyone who touches a panel.  Generated from `bluewall/client/src/ui_tokens.js` — **that file is the only source of truth**; change a value there, never copy a hex into another file.*

## 1. The idea in one paragraph
The game's identity is **blue** (Blue Wall): dark navy panels, ice-blue accents, silver metal, light frost cards.  Gold is only a *small accent* (stars, a premium mark) — never a surface.  Three looks exist (1 Glacier, 2 Midnight, 3 Royal); **the default is 1**.  The look is chosen once at start-up (`?look=N` in the URL, remembered in `localStorage.bw_ui_look_v1`, or `__bwLook(N)` in the console, which reloads the page).  Nothing is animated by the tokens; the game is landscape only.

## 2. How to use it
### In a JS module that builds CSS (recommended)
```js
import { T, G, A, mix, FONT, DISPLAY, NUM, GEM } from './ui_tokens.js';
const CSS = `.my-panel{background:${G.panel};color:${T.ink};border:1px solid ${T.line};font-family:${FONT}}
.my-btn{background:${G.accent};color:${T.inkOn};min-height:44px}
.my-dim{color:${A('ice',.6)}}   /* ice at 60 % */
.my-hot{color:${mix('bad','#ffffff',.4)}}`;
```
* `T.<token>` — a hex string of the active look.
* `A('ice', .4)` / `A('#ffffff', .2)` → `rgba(...)`; `mix('blue','#ffffff',.3)` → a hex between two colours.
* `G.<name>` — ready gradients/shadows (list in §5).
* `FONT` text · `DISPLAY` headings (same family, 700) · `NUM` digits.

### In plain CSS / index.html / rpg.js (no JS interpolation)
`ui_tokens.js` writes these on `:root` at start-up and sets `<html data-look="1|2|3">`:
`--ui-n0 --ui-n1 --ui-n2 --ui-n3 --ui-line --ui-ice --ui-ice2 --ui-blue --ui-blue2 --ui-blue3 --ui-silver --ui-silver2 --ui-silver3 --ui-ink --ui-mute --ui-inkOn --ui-card0 --ui-card1 --ui-cardInk --ui-cardMute --ui-cardAcc --ui-cardLine --ui-gold --ui-gold2 --ui-goldInk --ui-ok --ui-warn --ui-bad --ui-badInk --ui-badBg` and `--ui-font`, `--ui-num`, `--ui-lh`.
```css
.rp-hud-chip{background:var(--ui-n1);color:var(--ui-ink);border:1px solid var(--ui-line);font-family:var(--ui-font)}
```

## 3. Palette (all three looks)

### Dark surfaces (panels, plates, wells)
`n0` is the deepest (wells, scrims, text on a light accent); `n3` the lightest raised dark surface.

| token | 1 Glacier | 2 Midnight | 3 Royal |
|---|---|---|---|
| `n0` | `#050d20` | `#02060f` | `#050f33` |
| `n1` | `#0b1d40` | `#071530` | `#0b2168` |
| `n2` | `#12315f` | `#0c2447` | `#123287` |
| `n3` | `#1b4584` | `#14386b` | `#1c47ad` |

### Lines and accents
`line` = 1 px borders; `ice`/`ice2` = active text, tab fill, glow; `blue`/`blue2`/`blue3` = the loudest buttons (`G.war`) and bars.

| token | 1 Glacier | 2 Midnight | 3 Royal |
|---|---|---|---|
| `line` | `#4b86cf` | `#1fb3e6` | `#8fb2ff` |
| `ice` | `#c9eaff` | `#bff4ff` | `#e0eaff` |
| `ice2` | `#8fd0ff` | `#6fe0ff` | `#aac4ff` |
| `blue` | `#4aa8ff` | `#2fd0ff` | `#7aa2ff` |
| `blue2` | `#2b72e6` | `#0f95d9` | `#4468e8` |
| `blue3` | `#1b4fb8` | `#0a5fa8` | `#2a47b8` |

### Silver (metal, bezels, secondary text on dark)

| token | 1 Glacier | 2 Midnight | 3 Royal |
|---|---|---|---|
| `silver` | `#e6eefa` | `#dbe8f4` | `#f3f6fc` |
| `silver2` | `#a9bcd8` | `#9db8d2` | `#bfcbe4` |
| `silver3` | `#6c83a8` | `#5f7e9c` | `#7f8fb8` |

### Text
`ink` = text on dark panels; `mute` = secondary text; `inkOn` = text **on** an accent button (ice / blue fill).

| token | 1 Glacier | 2 Midnight | 3 Royal |
|---|---|---|---|
| `ink` | `#eef5ff` | `#e9f6ff` | `#f2f6ff` |
| `mute` | `#9db4d6` | `#8fb3d6` | `#aebdea` |
| `inkOn` | `#06224f` | `#021a33` | `#0a1c55` |

### Cards (list cards; light frost in 1 and 3, dark in 2)
Text on a card is always `cardInk` / `cardMute`, never `ink`.

| token | 1 Glacier | 2 Midnight | 3 Royal |
|---|---|---|---|
| `card0` | `#eaf2fc` | `#10294f` | `#f7f9fd` |
| `card1` | `#cfe0f5` | `#0a1d3e` | `#dde5f4` |
| `cardInk` | `#0b2147` | `#e6f4ff` | `#0b1f55` |
| `cardMute` | `#4a6490` | `#8fb3d9` | `#52609a` |
| `cardAcc` | `#1b4fb8` | `#6fe0ff` | `#2a47b8` |
| `cardLine` | `#8aaedd` | `#1c5a8a` | `#9fb3e0` |

### Accent and state
`gold` / `gold2` only as a small accent (stars, a premium badge, a hairline).  `bad` = danger / not enough; `ok` = done / ready.

| token | 1 Glacier | 2 Midnight | 3 Royal |
|---|---|---|---|
| `gold` | `#f2c75c` | `#ffd36b` | `#ffd166` |
| `gold2` | `#ffe08a` | `#ffe9a6` | `#ffe6a0` |
| `goldInk` | `#4a3300` | `#4a3300` | `#4a3300` |
| `ok` | `#5fdc92` | `#4be394` | `#5fdc92` |
| `warn` | `#ffb454` | `#ffb454` | `#ffb454` |
| `bad` | `#ff5a6e` | `#ff5a6e` | `#ff5a6e` |
| `badInk` | `#8a1226` | `#ffd0d6` | `#8a1226` |
| `badBg` | `#ffd9de` | `#5a1424` | `#ffd9de` |

### The five gems (identical in every look — currency identity, see `GEM` and `gemSvg()`)
| gem | light | mid | dark | glow |
|---|---|---|---|---|
| ruby | `#ff9aab` | `#ee2a4c` | `#8e0a26` | `#ff5a76` |
| emerald | `#9cf7c6` | `#19c46c` | `#05703a` | `#3fe592` |
| turquoise | `#d4fbff` | `#35d6ff` | `#0a7fb8` | `#6fe8ff` |
| sapphire | `#a9c2ff` | `#2d5fe6` | `#10236f` | `#6f96ff` |
| onyx | `#a9b4c8` | `#3a4358` | `#06080f` | `#c6d2ea` |

Game-art colours that are NOT chrome and stay as they are: the gems above, rarity colours, unit tier colours (wood · stone · iron · gold · diamond · crystal), the medals (1st = gold, 2nd = silver, 3rd = bronze) and the red of danger (`bad`).

## 4. Fonts
| look | Latin family | files (in `web/pub/`, no CDN) | Persian |
|---|---|---|---|
| 1 Glacier | Barlow Semi Condensed 400 / 700 | `ui-barlowsc-400.woff2`, `ui-barlowsc-700.woff2` | Vazirmatn 400 / 700 / 900 (already in `/pub`) |
| 2 Midnight | Saira Semi Condensed 400 / 700 | `ui-sairasc-400.woff2`, `ui-sairasc-700.woff2` | Vazirmatn |
| 3 Royal | Inter 400 / 700 | `ui-inter-400.woff2`, `ui-inter-700.woff2` | Vazirmatn |

* Stack: `<family>, Vazirmatn, 'Noto Sans Tai Viet', system-ui, sans-serif` (`FONT`).  `Noto Sans Tai Viet` is only there for the one fancy letter in the owner's name; it is never the main font.
* Two weights only: **400** for text, **700** for headings / numbers / buttons (an ask for 800 / 900 falls to 700).  Headings use `letter-spacing:.6–1.6px` + `text-transform:uppercase`.
* The loader (`web/index.html`) and the battle HUD (`bhud.js`) use the same family (look 1's Barlow is declared in `index.html`; `bhud.js` takes `FONT`).  The loader's gate glow and the battle HUD's stars / loot / damage colours are game art, not chrome.
* Sizes: body 12–13 px, small labels ≥ 11 px, panel titles 15–17 px, big numbers 17–20 px.
* All three Latin fonts and Vazirmatn are open licence (SIL OFL 1.1); see `web/pub/UI3_FONTS_LICENSE.txt`.

## 5. Gradients and shadows (`G`)
| name | use |
|---|---|
| `G.panel` | the dark panel / sheet background |
| `G.panel2` | a raised dark block: HUD plates, the name plate |
| `G.scrim` | the fade at the top of the screen behind the HUD |
| `G.card` | a list card (frost in 1 / 3, dark in 2) |
| `G.accent` | primary button, active tab, the ring of an icon button (text `T.inkOn`) |
| `G.accent2` | the loudest light button (e.g. Rush) |
| `G.war` | the loudest call to action on a dark panel, white text: Train / Battle |
| `G.btn` | a secondary button on a dark panel |
| `G.core` | the dark round core of an icon button / a picture well |
| `G.well` | an inset dark well (bars, tracks) |
| `G.plate` · `G.cap` | the thin inner frame of a panel / of a small capsule (box-shadow) |
| `G.emb` | the emboss of an accent button |
| `G.ring` | a silver bezel (conic-gradient) |
| `G.glow` | the steady glow of "something is waiting" |
| `G.bar` | a progress-bar fill |
| `G.shadow` | the big drop shadow of a panel |

## 6. Icons (`ui_icons.js`)
ONE SVG set: 24 × 24 grid, no fill, `currentColor` stroke; the stroke width and joins come from the look (1: 1.8 round, 2: 2 mitred, 3: 1.7 round + an 18 % duotone fill).  No new shader, no model.
```js
import { ico, icoUrl, gemSvg, badgeSvg, gearSvg } from './ui_icons.js';
el.innerHTML = ico('sword', 18);              // inline <svg class="k-ic"> — takes the text colour
const url = icoUrl('shield', '#ffffff', 24);   // a CSS url("data:image/svg+xml,…") for background / mask
gemSvg('ruby', 28);                            // the five currencies: ruby emerald turq sap onyx
```
The Arrange editor's toolbar (`layout_ui.js`, TR2-S5) keeps its own markup (letters in `<i>`); `ui_theme_r3.js` hides the letters and draws `check / undo / home / rotl / rotr / x` from this set by `[data-a=…]`.
Names (61): `arrange` · `arrow` · `assist` · `axe` · `back` · `bag` · `barracks` · `bolt` · `box` · `check` · `chev` · `civic` · `clan` · `clock` · `collect` · `copy` · `crown` · `cup` · `drop` · `edit` · `eye` · `fish` · `flag` · `forge` · `friends` · `gear` · `grid` · `hammer` · `heart` · `helm` · `home` · `info` · `keep` · `lair` · `list` · `lock` · `log` · `mine` · `minus` · `move` · `people` · `plus` · `rotl` · `rotr` · `search` · `share` · `shield` · `stable` · `star` · `sword` · `swords` · `towers` · `train` · `training` · `undo` · `up` · `vault` · `wall` · `wheat` · `workshop` · `x`

## 7. Sizes and layout rules (what the CSS enforces)
* Every list panel (Kingdom, Army, Shop, Rank, Clan, Friends, Log, Settings, unit page) is a centred card: **height ≤ 68 %**, **width ≤ 74 % (max 640 px)** of the screen, inside the Telegram safe box — two CSS variables `--r4h:68%` and `--r4w:min(74%,640px)` (in `ui_theme_r4.js`) are the only numbers that size them.  Inside: a left rail (status + tabs, 158 px) and a right pane with the list; the list scrolls inside the panel, never the page.
* Buttons / tap targets **40–48 px**; nothing under the notch / Telegram header (`--st --sb --sl --sr` safe insets).
* No text may be cut: long text wraps or is hidden on purpose; `dev/ui1r4_census.py` checks it at 844 × 390, 800 × 360 and 932 × 430.
* Layered CSS order: `ui.js` → `ui_theme.js` → `ui_theme_r2.js` → `ui_theme_r3.js` → `ui_theme_r4.js` (landscape panel layout; all its rules start with `.bw-ui.bw-ui`, no `transition`, `animation`, `backdrop-filter` or `!important`).

## 8. For UI2 (hero mode)
* Import `T, G, A, mix, FONT` from `./ui_tokens.js` (or use `var(--ui-*)` in plain CSS) instead of any gold / brown hex.
* Use `ico()` for every glyph; do not add a second icon source.
* Panels: reuse `--r4h` / `--r4w`; hero-HUD chips use `G.panel2` + `T.line` borders + `T.ink` text; the one loud button per screen uses `G.war` (blue) or `G.accent` (ice).
* Shared lines in files UI3 does not own are marked `// UI3:`.
