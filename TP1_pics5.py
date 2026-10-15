# TP1_pics5.py - FRONT + BACK + SIDE pictures (A-pose, empty hands, game-length costume) for the other sisters, sent to the owner's bot private chat.
# Runs on blue18: cd /root/bluebot_v2 && ./.venv/bin/python /root/bw_art/tp1_pics5.py
# Env: ONLY=elika,mobina (default: elina,elika,mobina,aylin,aylar) | VIEWS=back,side (default front,back,side; front is reused from disk when not listed)
#      FIX="extra sentence" (added to every prompt of this run) | DRY=1 (no network, prints prompt sizes) | SIS_PAR=2 (sisters at once)
import asyncio, base64, os, sys, time

BOTDIR = os.getenv("BWROOT", "/root/bluebot_v2")
OUT = os.getenv("TP1_OUT", "/root/bw_art/tp1")
SHEETS = os.getenv("SHEETS", "/root/bw_art")
MODEL = os.getenv("IMG_MODEL", "gpt-image-2.5-sunburst")
QUALITY = os.getenv("IMG_QUALITY", "high")
ALL = ["elina", "elika", "mobina", "aylin", "aylar"]
ONLY = [x for x in os.getenv("ONLY", "").split(",") if x] or ALL
VIEWS = [x for x in os.getenv("VIEWS", "").split(",") if x] or ["front", "back", "side"]
FIX = os.getenv("FIX", "").strip()
SIS_PAR = int(os.getenv("SIS_PAR", "2"))
PRICE = {"text_in": 5.0, "image_in": 8.0, "image_out": 30.0}
TOT = {"text_in": 0, "image_in": 0, "image_out": 0, "images": 0}

# name, costume for a game model (what to keep, what to shorten), face line
S = {
    "elina": dict(name="Elina", fa="Elina", face="Keep her face exactly as in the sheet's FACE close-up: strong dark eyebrows, golden-brown eyes, a proud calm look.",
        dress=("long wavy black hair with red streaks and a partial braid held by a gold hair clasp; glossy crimson leather corset armour with gold filigree and a gold pomegranate emblem on the chest; "
               "cream linen blouse with full sleeves; brown leather gauntlets with gold engraving on both forearms; wide brown leather belts with a turquoise bead chain and a red tassel; dark brown trousers; "
               "knee-high brown leather boots with gold knee plates; a crimson cloak with a small gold emblem on its back. "
               "For a game model: the cloak ends at the hips, hangs close to the body and its hem is only slightly torn, with no flames or embers; no sword and no scabbard.")),
    "elika": dict(name="Elika", fa="Elika", face="Keep her face exactly as in the sheet's FACE close-up: grey-green eyes, light freckles, a calm neutral mouth (no smile).",
        dress=("short messy chestnut-brown hair with a small braid at the nape tied with a turquoise bead; cream linen shirt with rolled sleeves; worn brown leather vest with buckled straps and pockets; "
               "a mint-green gauze scarf around the neck; leather belt with small pouches; baggy olive-khaki trousers gathered at the ankles; wrapped brown leather boots; fingerless leather gloves. "
               "For a game model: the scarf ends are short and tucked at the chest, they do not hang over the arms; no daggers and no sling anywhere on her body; no griffin.")),
    "mobina": dict(name="Mobina", fa="Mobina", face="Keep her face exactly as in the sheet's FACE close-up: large amber eyes, soft smooth skin, a gentle calm look.",
        dress=("long wavy chestnut-brown hair with one thin braid down the back threaded with copper beads; a circlet of copper and polished turquoise-amber stones on the brow; "
               "brown velvet bodice with copper-and-turquoise geometric embroidery; fitted long sleeves; a layered honey-amber and gold skirt; a turquoise chain bracelet on the left wrist. "
               "For a game model: the skirt ends just above the ankles with no train, a little narrower so her ankle boots show; the sheer sleeves and the sheer cape are replaced by fitted opaque sleeves "
               "and a short amber-gold half-cape that ends at the elbows; all fabric opaque, nothing see-through; no stone creature.")),
    "aylin": dict(name="Aylin", fa="Aylin", face="Keep her face exactly as in the sheet's FACE close-up: warm dark eyes, light freckles, a calm gentle look.",
        dress=("long black curly hair with a small shell hair ornament; a large blue embroidered shawl-poncho with a fringed hem, the hood is DOWN on her shoulders; navy-blue linen dress with shell-and-wave embroidery on the hem; "
               "a woven brown sash belt with a small leather medicine pouch and glass beads; a shell pendant necklace; a leather bracelet with a blue stone; loose trousers under the dress; lace-up brown boots. "
               "For a game model: the dress hem ends just above the ankles so the trousers and boots show; the poncho ends at the hips and hangs close to the body; no shell staff and no otter.")),
    "aylar": dict(name="Aylar", fa="Aylar", face="Keep her face exactly as in the sheet's FACE close-up: pale blue eyes, a cool calm neutral look.",
        dress=("silver-grey hair pulled into a high ponytail with one white streak; a large white fur collar; a long navy-blue embroidered coat-cloak with silver borders and a silver snowflake emblem on the back, "
               "over a grey scarf and a light grey tunic; layered leather belts with a small leather pouch; dark leather gloves; fur-trimmed brown leather boots. "
               "For a game model: the coat ends just above the ankles and the cloak part ends at the thighs, both hang close to the body; no ice spear, no chess piece, no bird.")),
}

COMMON_END = ("NO weapon of any kind, nothing in her hands, no companion animal. "
              "Plain flat light-grey background, soft even studio light, no cast shadow, no floor texture. "
              "NO text, NO labels, NO frame, NO second view. "
              "Real skin and real fabric, like a still from a high-end live-action fantasy film. NOT anime, NOT illustration, NOT painting.")
POSE = ("A-pose: arms straight, angled about 45 degrees away from the body so both arms stay visible, hands open and empty with relaxed slightly spread fingers; "
        "feet shoulder-width apart and flat on the floor; neutral calm face, mouth closed, eyes open looking at the camera. "
        "Camera straight at chest height, no perspective tilt, the whole body from hair to boots visible with a small margin, centred. ")


def prompt(view, k):
    d = S[k]; n = d["name"]
    dress = "Costume for a game model, copied from the sheet: " + d["dress"] + " All fabric opaque, nothing see-through. "
    if view == "front":
        return ("Use the attached character sheet only to copy this exact person: face, hair, body, clothes, colours, materials. "
                "Output ONE photorealistic full-body picture of %s for a 3D scan: FRONT view, facing the camera. " % n + POSE + dress + d["face"] + " " + COMMON_END)
    same = ("Use the attached character sheet and the attached FRONT picture only to copy this exact person: the same face, hair, body, clothes, colours and materials, "
            "the same pose, the same camera height and the same scale and framing as the front picture. ")
    if view == "back":
        return (same + "Output ONE photorealistic full-body picture of %s for a 3D scan: BACK view, seen exactly from behind (she faces away from the camera). " % n
                + POSE.replace("neutral calm face, mouth closed, eyes open looking at the camera. ", "") + dress + COMMON_END)
    return (same + "Output ONE photorealistic full-body picture of %s for a 3D scan: pure SIDE view (exactly 90 degrees), her LEFT side toward the camera, she faces the LEFT edge of the picture. " % n
            + POSE.replace("neutral calm face, mouth closed, eyes open looking at the camera. ", "") + dress + COMMON_END)


def add_usage(u):
    if not u:
        return
    d = u.get("input_tokens_details") or {}
    TOT["text_in"] += d.get("text_tokens", 0) if d else u.get("input_tokens", 0)
    TOT["image_in"] += d.get("image_tokens", 0)
    TOT["image_out"] += u.get("output_tokens", 0)


def cost():
    return (TOT["text_in"] * PRICE["text_in"] + TOT["image_in"] * PRICE["image_in"] + TOT["image_out"] * PRICE["image_out"]) / 1e6


if os.getenv("DRY"):
    for k in ALL:
        print(k, [len(prompt(v, k)) for v in ("front", "back", "side")])
    sys.exit(0)

if os.path.isdir(BOTDIR):
    sys.path.insert(0, BOTDIR)
    os.chdir(BOTDIR)
import httpx
from aiogram import Bot
from aiogram.types import BufferedInputFile, InputMediaDocument
from config import settings


async def openai_conn():
    url = (settings.OPENAI_BASE_URL or "https://api.openai.com/v1").rstrip("/")
    key = settings.OPENAI_API_KEY or ""
    if not key:
        from modules.wallet.services.ai_receipt_config import get_cfg, provider_conn
        purl, key, _ = provider_conn(await get_cfg(fresh=True), "openai")
        url = (purl or url).rstrip("/")
        try:
            from core.db_engine import dispose_engine
            await dispose_engine()
        except Exception:
            pass
    return url, key


def make_bot():
    base = getattr(settings, "TG_LOCAL_API_BASE", "") or ""
    if base:
        from aiogram.client.session.aiohttp import AiohttpSession
        from aiogram.client.telegram import TelegramAPIServer
        return Bot(token=settings.BOT_TOKEN,
                   session=AiohttpSession(api=TelegramAPIServer.from_base(base.rstrip("/"), is_local=True)))
    return Bot(token=settings.BOT_TOKEN)


async def edit(client, url, key, p, images):
    last = ""
    for attempt in (1, 2, 3):
        try:
            files = [("image[]", ("ref%d.png" % i, b, "image/png")) for i, b in enumerate(images)]
            data = {"model": MODEL, "prompt": p, "size": "1024x1536", "quality": QUALITY}
            r = await client.post(url + "/images/edits", headers={"Authorization": "Bearer " + key}, data=data, files=files)
            if r.status_code == 200:
                js = r.json()
                add_usage(js.get("usage"))
                item = js["data"][0]
                if item.get("b64_json"):
                    return base64.b64decode(item["b64_json"])
                if item.get("url"):
                    return (await client.get(item["url"])).content
                last = "no image in answer"
            else:
                last = "OpenAI %s: %s" % (r.status_code, r.text[:300])
        except Exception as e:
            last = "%s: %s" % (type(e).__name__, str(e)[:200])
        print("try", attempt, "failed:", last, flush=True)
        await asyncio.sleep(6)
    raise RuntimeError(last)


async def main():
    bot = make_bot()
    uid = settings.SUPER_ADMIN_UID
    fails = []
    t0 = time.time()

    async def tell(text):
        try:
            await bot.send_message(uid, text[:4000])
        except Exception as e:
            print("telegram text failed:", e, flush=True)

    try:
        url, key = await openai_conn()
        if not key:
            raise RuntimeError("OPENAI key not found (.env or panel)")
        keys = [k for k in ONLY if k in S]
        await tell("TP1: making %s x %s with %s (%s)..." % (",".join(keys), "+".join(VIEWS), MODEL, QUALITY))
        sem = asyncio.Semaphore(SIS_PAR)
        async with httpx.AsyncClient(timeout=600) as client:
            async def sister(k):
                async with sem:
                    sp = "%s/%s.png" % (SHEETS, k)
                    if not os.path.exists(sp):
                        fails.append("%s: sheet not found %s" % (k, sp)); await tell("TP1: sheet not found: %s (ls /root/bw_art/*.png)" % sp); return
                    sheet = open(sp, "rb").read()
                    od = "%s/%s" % (OUT, k); os.makedirs(od, exist_ok=True)
                    got = {}

                    async def one(v, imgs):
                        p = prompt(v, k) + ((" " + FIX) if FIX else "")
                        try:
                            png = await edit(client, url, key, p, imgs)
                        except Exception as e:
                            print("FAIL", k, v, e, flush=True); fails.append("%s %s: %s" % (k, v, str(e)[:160])); return
                        TOT["images"] += 1
                        open("%s/%s.png" % (od, v), "wb").write(png); got[v] = png
                        print("done", k, v, "| cost so far ~$%.3f" % cost(), flush=True)
                        try:
                            await bot.send_photo(uid, BufferedInputFile(png, "%s_%s.png" % (k, v)), caption="%s %d - %s" % (S[k]["fa"], ("front", "back", "side").index(v) + 1, v.upper()))
                        except Exception as e:
                            print("telegram photo failed", k, v, e, flush=True)

                    front = None
                    if "front" in VIEWS:
                        await one("front", [sheet]); front = got.get("front")
                    elif os.path.exists(od + "/front.png"):
                        front = open(od + "/front.png", "rb").read()
                    rest = [v for v in ("back", "side") if v in VIEWS]
                    if rest:
                        if front is None:
                            fails.append("%s: no front picture, back/side need it" % k)
                        else:
                            await asyncio.gather(*(one(v, [sheet, front]) for v in rest))
                    order = [v for v in ("front", "back", "side") if v in got]
                    if len(order) > 1:
                        try:
                            await bot.send_media_group(uid, [InputMediaDocument(media=BufferedInputFile(got[v], "%s_%s.png" % (k, v))) for v in order])
                        except Exception as e:
                            print("album failed", k, e, flush=True)
                            for v in order:
                                try:
                                    await bot.send_document(uid, BufferedInputFile(got[v], "%s_%s.png" % (k, v)))
                                except Exception as e2:
                                    print("doc failed", k, v, e2, flush=True)
                    elif order:
                        try:
                            await bot.send_document(uid, BufferedInputFile(got[order[0]], "%s_%s.png" % (k, order[0])))
                        except Exception as e:
                            print("doc failed", k, e, flush=True)
            await asyncio.gather(*(sister(k) for k in keys))
        n = max(TOT["images"], 1)
        summary = ("TP1 pictures done in %.1f min\nimages: %d ok, %d problems\ncost ~ $%.2f (~$%.3f per picture)\nfiles: %s/<name>/{front,back,side}.png\n"
                   "redo one: ONLY=aylin VIEWS=back FIX='...' (front is reused)" % ((time.time() - t0) / 60, TOT["images"], len(fails), cost(), cost() / n, OUT))
        if fails:
            summary += "\nproblems:\n" + "\n".join(fails)
        print(summary, flush=True)
        await tell(summary)
    except Exception as e:
        print("ERROR:", e, flush=True)
        await tell("TP1 pictures failed: %s" % str(e)[:3500])
    finally:
        await bot.session.close()

asyncio.run(main())
