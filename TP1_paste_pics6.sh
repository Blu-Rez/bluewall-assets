mkdir -p /root/bw_art/tp1/v2 && cat > /root/bw_art/tp1_pics6.py <<'BWEOF'
# TP1_pics6.py - ALL SIX sisters: FRONT + BACK + SIDE pictures for Tripo (A-pose, empty hands, simple clean costume, hip-length cloak with her element emblem on the back)
# + CARD = the waist-up portrait for the player-pick card (4:5), same costume/face as the front picture.
# Runs on blue18: cd /root/bluebot_v2 && ./.venv/bin/python /root/bw_art/tp1_pics6.py
# Env: ONLY=elina,aylar (default all six) | VIEWS=back,side,card (default front,back,side,card; front is reused from disk when not listed)
#      FIX="extra sentence" (added to every prompt of this run) | DRY=1 (no network) | SIS_PAR=3 (sisters at once)
import asyncio, base64, os, sys, time

BOTDIR = os.getenv("BWROOT", "/root/bluebot_v2")
OUT = os.getenv("TP1_OUT", "/root/bw_art/tp1/v2")
SHEETS = os.getenv("SHEETS", "/root/bw_art")
MODEL = os.getenv("IMG_MODEL", "gpt-image-2.5-sunburst")
QUALITY = os.getenv("IMG_QUALITY", "high")
ALL = ["elina", "elika", "melika", "mobina", "aylin", "aylar"]
ONLY = [x for x in os.getenv("ONLY", "").split(",") if x] or ALL
VIEWS = [x for x in os.getenv("VIEWS", "").split(",") if x] or ["front", "back", "side", "card"]
VIEW_ORDER = ("front", "back", "side", "card")
CARD_SIZES = ["1024x1280", "1024x1536"]   # 4:5 first (the card is 4:5); falls back to 2:3 and then it is cropped later
FIX = os.getenv("FIX", "").strip()
SIS_PAR = int(os.getenv("SIS_PAR", "3"))
PRICE = {"text_in": 5.0, "image_in": 8.0, "image_out": 30.0}
TOT = {"text_in": 0, "image_in": 0, "image_out": 0, "images": 0}

# face = copied from the sheet's FACE close-up; hair; dress = the simple game costume; cloak = colour + the element emblem on the back
S = {
    "elina": dict(name="Elina", face="strong dark eyebrows, golden-brown eyes, a proud calm look",
        hair="long wavy black hair with dark red highlights, in one simple side braid",
        dress="a crimson leather jerkin with one small plain gold pomegranate emblem (6 cm) on the chest, over a cream linen shirt with full sleeves, brown leather forearm gauntlets, a plain wide brown belt, dark brown trousers, tall plain brown leather boots",
        cloak="a crimson cloak whose bottom edge is slightly frayed and charred dark like real burnt fabric (no glow, no flames, no embers)",
        emblem="a bold gold-orange stylised flame (a flame shape with an inner swirl)"),
    "elika": dict(name="Elika", face="grey-green eyes, light freckles, a calm neutral mouth (no smile)",
        hair="short messy chestnut-brown hair",
        dress="a cream linen shirt with rolled sleeves, a plain brown leather vest, a plain brown belt, loose olive-khaki trousers tucked into brown leather boots, brown fingerless leather gloves",
        cloak="a mint-green wool cloak",
        emblem="a silver wind swirl (three curling wind streaks)"),
    "melika": dict(name="Melika", face="light brown-green eyes, young smooth clear skin, a calm gentle look",
        hair="dark brown curly hair with a few small white flowers",
        dress="a green robe with two layers ending just above the ankles with no train and a little narrow so the brown leather boots show, a plain brown leather belt with two small pouches, leather vambraces",
        cloak="a brown cloak, hood down on the shoulders",
        emblem="a green vine sprout (a vine winding upward with small leaves)"),
    "mobina": dict(name="Mobina", face="large amber eyes, soft smooth skin, a gentle calm look",
        hair="long wavy chestnut-brown hair worn loose with one thin braid",
        dress="a brown velvet dress with a fitted bodice and fitted long sleeves, a plain honey-amber skirt in one layer ending at mid-calf, a thin copper waistband, brown ankle boots",
        cloak="a warm earth-brown cloak",
        emblem="three copper-orange mountain peaks (simple triangles)"),
    "aylin": dict(name="Aylin", face="warm dark eyes, light freckles, a calm gentle look",
        hair="long black curly hair",
        dress="a navy-blue linen dress with fitted sleeves ending at mid-calf with one pale wave band along the hem, a plain brown sash belt, brown lace-up boots",
        cloak="a cornflower-blue cloak with no fringe, hood down on the shoulders",
        emblem="a cream-white water drop above three wavy lines"),
    "aylar": dict(name="Aylar", face="pale blue eyes, a cool calm neutral look",
        hair="silver-grey hair in a high ponytail with one white streak",
        dress="a fitted navy-blue coat ending at mid-thigh with plain silver trim, dark trousers, dark leather gloves, plain dark brown boots with a thin fur top",
        cloak="a navy cloak with a white fur collar",
        emblem="a silver snowflake"),
}

REAL = ("A photograph of a real woman wearing a real handmade costume in a photo studio: real skin with natural pores, matte real fabrics and leather, "
        "no glow, no magic effects, no airbrushing, not a video-game render, not CGI, NOT anime, NOT illustration, NOT painting. ")
POSE = ("A-pose: arms straight, angled about 40 degrees away from the body, hands open and empty with relaxed slightly spread fingers; feet shoulder-width apart and flat on the floor. "
        "Camera straight at chest height, no perspective tilt, the whole body from hair to boots visible with a small margin, centred. ")
END = ("NO weapon of any kind, nothing in her hands, no companion animal, no bag. Plain flat light-grey background, soft even studio light, no cast shadow, no floor texture. "
       "NO text, NO labels, NO frame, NO second view.")


def costume(d, emblem=True):
    tail = ("the middle of the upper back carries %s, large and clear, about 25 cm tall. " % d["emblem"]) if emblem else \
           ("the cloak is completely plain in this view: NO emblem, NO symbol, NO drawing, NO embroidery, NO pattern on it and none on her arms or sleeves (the emblem exists only on the middle of the back and cannot be seen from here). ")
    return ("Costume for a game model, simple and clean: large clear shapes, only the items listed, no beads, tassels, chains, dangling parts or small ornaments, all fabric opaque. "
            "Hair: %s. She wears %s. " % (d["hair"], d["dress"])
            + ("On her back: %s, hanging straight from the shoulders close to the body and ending just below the hips, so it covers the hips and buttocks (upper-thigh length, not shorter and not longer), "
               "one clean piece of fabric, not billowing, hanging behind her arms without covering them; " % d["cloak"]) + tail)


def prompt(view, k, has_front=True):
    d = S[k]; n = d["name"]
    face = ("The face is the most important part: copy it exactly from the sheet's FACE close-up (%s), natural and beautiful, sharp fine detail, eyes open and looking at the camera, "
            "calm neutral expression, hair behind the ears and not covering the face. " % d["face"])
    if view == "front":
        return ("Use the attached character sheet to copy this exact person: face, hair, body type and colours. The costume below is a simplified game version: follow the text below where the sheet differs. "
                "Output ONE full-body picture of %s for a 3D scan: FRONT view, facing the camera, seen from the front only the edges of the cloak at her shoulders and sides are visible. " % n
                + REAL + POSE + face + costume(d, False) + END)
    same = ("Use the attached character sheet and the attached FRONT picture to copy this exact person: the same face, hair, body, clothes, colours and materials, the same pose, "
            "the same camera height and the same scale and framing as the front picture. ") if has_front else \
           ("Use the attached character sheet to copy this exact person: face, hair, body type and colours. The costume below is a simplified game version: follow the text below where the sheet differs. ")
    if view == "card":
        return (("Use the attached character sheet and the attached FRONT picture to copy this exact person: the same face, hair, clothes, colours and materials. " if has_front else
                 "Use the attached character sheet to copy this exact person: face, hair and colours. The costume below is a simplified game version: follow the text below where the sheet differs. ")
                + "Output ONE waist-up portrait of %s for the player-selection card of a fantasy game, a 4:5 portrait frame: she faces the camera with square relaxed shoulders, arms relaxed down, "
                  "nothing in her hands (the hands may be outside the frame); the top of her head is about 5%% below the top edge and the picture ends at her waist (belt line), so her face is large, about a quarter of the picture height, centred. " % n
                + REAL + face
                + "Same simple costume as the front picture, only what is visible in a waist-up view. Hair: %s. She wears %s. " % (d["hair"], d["dress"])
                + "Behind her: %s, lying on both shoulders and hanging down behind her arms so its edges are visible on both sides of her. " % d["cloak"]
                + "A calm confident look, lips closed or the faintest natural smile. Plain soft light-grey studio background, soft light from the front-left with a faint rim light, no cast shadow. "
                  "NO weapon, no companion animal, no bag, no glow or magic effect. NO text, NO labels, NO frame or border, NO second view.")
    if view == "back":
        return (same + "Output ONE full-body picture of %s for a 3D scan: BACK view, seen exactly from behind (she faces away from the camera), the whole cloak and its emblem clearly visible. " % n
                + REAL + POSE + costume(d) + END)
    return (same + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view (exactly 90 degrees), her LEFT side toward the camera, she faces the LEFT edge of the picture, the cloak hanging straight down behind her, seen edge-on, with its outer side completely plain. " % n
            + REAL + POSE + costume(d, False) + END)


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
        print(k, [len(prompt(v, k)) for v in VIEW_ORDER])
    if os.getenv("SHOW"):
        print(prompt(os.getenv("SHOW"), os.getenv("WHO", "elina")))
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


async def edit(client, url, key, p, images, sizes=None):
    sizes = sizes if sizes is not None else ["1024x1536"]   # shared list: a refused size is dropped for every later call
    last = ""
    attempt = 0
    while attempt < 3:
        attempt += 1
        try:
            files = [("image[]", ("ref%d.png" % i, b, "image/png")) for i, b in enumerate(images)]
            data = {"model": MODEL, "prompt": p, "size": sizes[0], "quality": QUALITY}
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
                if r.status_code in (400, 422) and "size" in r.text.lower() and len(sizes) > 1:
                    print("size", sizes[0], "refused, trying", sizes[1], flush=True)
                    sizes.pop(0); attempt -= 1
                    continue
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
        await tell("TP1 v2: making %s x %s with %s (%s)..." % (",".join(keys), "+".join(VIEWS), MODEL, QUALITY))
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

                    async def one(v, imgs, has_front=True):
                        p = prompt(v, k, has_front) + ((" " + FIX) if FIX else "")
                        try:
                            png = await edit(client, url, key, p, imgs, CARD_SIZES if v == "card" else None)
                        except Exception as e:
                            print("FAIL", k, v, e, flush=True); fails.append("%s %s: %s" % (k, v, str(e)[:160])); return
                        TOT["images"] += 1
                        open("%s/%s.png" % (od, v), "wb").write(png); got[v] = png
                        print("done", k, v, "| cost so far ~$%.3f" % cost(), flush=True)
                        try:
                            await bot.send_photo(uid, BufferedInputFile(png, "%s_%s.png" % (k, v)), caption="%s %d - %s" % (S[k]["name"], VIEW_ORDER.index(v) + 1, v.upper() + (" (player-pick card)" if v == "card" else "")))
                        except Exception as e:
                            print("telegram photo failed", k, v, e, flush=True)

                    front = None
                    if "front" in VIEWS:
                        await one("front", [sheet]); front = got.get("front")
                    elif os.path.exists(od + "/front.png"):
                        front = open(od + "/front.png", "rb").read()
                    rest = [v for v in ("back", "side") if v in VIEWS]
                    jobs = []
                    if rest:
                        if front is None:
                            fails.append("%s: no front picture, back/side need it" % k)
                        else:
                            jobs += [one(v, [sheet, front]) for v in rest]
                    if "card" in VIEWS:
                        jobs.append(one("card", [sheet, front] if front is not None else [sheet], front is not None))
                    if jobs:
                        await asyncio.gather(*jobs)
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
                    if "card" in got:
                        try:
                            await bot.send_document(uid, BufferedInputFile(got["card"], "%s_card.png" % k), caption="%s CARD (full quality file)" % S[k]["name"])
                        except Exception as e:
                            print("doc failed", k, "card", e, flush=True)
            await asyncio.gather(*(sister(k) for k in keys))
        n = max(TOT["images"], 1)
        summary = ("TP1 v2 pictures done in %.1f min\nimages: %d ok, %d problems\ncost ~ $%.2f (~$%.3f per picture)\nfiles: %s/<name>/{front,back,side,card}.png\n"
                   "redo one: ONLY=aylin VIEWS=back FIX='...' (front is reused) | cards only: VIEWS=card" % ((time.time() - t0) / 60, TOT["images"], len(fails), cost(), cost() / n, OUT))
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
BWEOF
cd /root/bluebot_v2 && nohup ./.venv/bin/python /root/bw_art/tp1_pics6.py > /root/bw_art/tp1/v2/pics6.log 2>&1 &
sleep 5; tail -n 5 /root/bw_art/tp1/v2/pics6.log
