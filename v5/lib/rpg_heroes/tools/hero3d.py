# /root/bw_art/hero3d.py  (own name: no other worker's paste overwrites it)
# From the design sheet /root/bw_art/<key>.png make clean A-pose 3D-input pictures: FRONT, then BACK (made from the front + the sheet, so both match).
# env: ONLY=mobina  MODE=game|exact|both (default game)  EXTRA="extra sentence"  IMG_QUALITY=high
import asyncio, base64, os, sys, time
sys.path.insert(0, "/root/bluebot_v2")
os.chdir("/root/bluebot_v2")
import httpx
from aiogram import Bot
from aiogram.types import BufferedInputFile
from config import settings

MODEL = os.getenv("IMG_MODEL", "gpt-image-2.5-sunburst")
QUALITY = os.getenv("IMG_QUALITY", "high")
ONLY = [x for x in os.getenv("ONLY", "mobina").split(",") if x]
MODE = os.getenv("MODE", "game")
EXTRA = os.getenv("EXTRA", "").strip()
SRC = "/root/bw_art"
OUT = "/root/bw_art/hero3d"
PRICE = {"text_in": 5.0, "image_in": 8.0, "image_out": 30.0}
TOT = {"text_in": 0, "image_in": 0, "image_out": 0, "images": 0}
FA = {"elina": "الینا", "elika": "الیکا", "melika": "ملیکا", "mobina": "مبینا", "aylin": "آیلین", "aylar": "آیلار"}
NAME = {k: k.capitalize() for k in FA}

# per-hero look text: exact = as in the sheet, game = made safe for animation
E1 = ("Keep her face exactly as beautiful as in the sheet. Keep the gown exactly: brown velvet bodice, amber and honey silk skirt, "
      "sheer earth-gold veil sleeves and back cape with copper and turquoise mountain embroidery, long wavy chestnut hair with the "
      "copper-bead side braid, river-stone and copper circlet, turquoise chain bracelet.")
E2 = (E1 + " For a game model: the skirt ends just above the ankles with no train and does not touch the floor, a little narrower so the "
      "shoes show; the veil sleeves are shorter and hang close to the arms; the back cape ends at the knees; all fabric opaque, nothing see-through.")
LOOK = {"mobina": {"exact": E1, "game": E2}}

BASE = ("Use the reference sheet only to copy this exact person and costume (face, hair, body, clothes, colours, materials). "
        "Output ONE photorealistic full-body picture of {name} for a 3D scan: {view}, standing straight in an A-pose (arms straight and "
        "angled 45 degrees down away from the body, palms facing down), feet shoulder-width apart and flat on the floor, neutral relaxed "
        "face, mouth closed, {eyes}, camera straight at chest height with no perspective tilt, the whole body from hair to shoes visible "
        "with a margin, centred. Hands empty: no weapon, no shield, no staff, no bow, no companion animal. Long scarves, capes and loose "
        "hair hang down and do not cover the arms. Plain flat light-grey background, soft even studio light, no strong shadows, no floor "
        "texture. NO text, NO labels, NO frame, NO second view. A real person with real skin and real fabric. NOT anime, NOT illustration, "
        "NOT painting. {look}")
BACK_REF = ("Picture 1 is the FRONT view of this character, already approved. Picture 2 is her design sheet, which also shows the BACK view. "
            "Make the BACK view of exactly the same character and outfit as picture 1: same colours, same skirt length, same sleeve and cape "
            "length, same hair, seen from directly behind in the same A-pose; copy the back details (hair, braid, cape embroidery) from "
            "the back view in the sheet. ")


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


def add_usage(u):
    if not u:
        return
    d = u.get("input_tokens_details") or {}
    TOT["text_in"] += d.get("text_tokens", 0) if d else u.get("input_tokens", 0)
    TOT["image_in"] += d.get("image_tokens", 0)
    TOT["image_out"] += u.get("output_tokens", 0)


def cost():
    return (TOT["text_in"] * PRICE["text_in"] + TOT["image_in"] * PRICE["image_in"] + TOT["image_out"] * PRICE["image_out"]) / 1e6


async def edit(client, url, key, images, prompt):
    files = [("image[]", ("ref%d.png" % i, png, "image/png")) for i, png in enumerate(images)]
    last = ""
    for attempt in (1, 2):
        try:
            r = await client.post(url + "/images/edits", headers={"Authorization": "Bearer " + key},
                                  data={"model": MODEL, "prompt": prompt, "size": "1024x1536", "quality": QUALITY},
                                  files=files)
            if r.status_code == 200:
                js = r.json()
                add_usage(js.get("usage"))
                TOT["images"] += 1
                return base64.b64decode(js["data"][0]["b64_json"])
            last = "OpenAI %s: %s" % (r.status_code, r.text[:300])
        except Exception as e:
            last = str(e)[:300]
        await asyncio.sleep(5)
    raise RuntimeError(last)


async def send(bot, uid, png, name, caption):
    try:
        await bot.send_photo(uid, BufferedInputFile(png, name), caption=caption)
        await bot.send_document(uid, BufferedInputFile(png, name), caption=caption + " (فایل کامل برای Tripo)")
    except Exception as e:
        print("telegram failed", name, str(e)[:200], flush=True)


async def main():
    os.makedirs(OUT, exist_ok=True)
    bot = make_bot()
    uid = settings.SUPER_ADMIN_UID
    t0 = time.time()
    fails = []
    try:
        url, key = await openai_conn()
        if not key:
            raise RuntimeError("OPENAI_API_KEY not found (.env or panel)")
        tags = ["exact", "game"] if MODE == "both" else [MODE]
        await bot.send_message(uid, "hero3d: %s | %s | front+back، حدود %d عکس" % (",".join(ONLY), ",".join(tags), 2 * len(tags) * len(ONLY)))
        async with httpx.AsyncClient(timeout=600) as client:
            for k in ONLY:
                sheet_path = "%s/%s.png" % (SRC, k)
                if not os.path.exists(sheet_path):
                    fails.append("%s: sheet %s not found" % (k, sheet_path))
                    continue
                sheet = open(sheet_path, "rb").read()
                for tag in tags:
                    look = (LOOK.get(k, {}).get(tag, "") + " " + EXTRA).strip()
                    fa = FA.get(k, k)
                    try:
                        pf = BASE.format(name=NAME.get(k, k), view="front view", eyes="eyes open looking at the camera", look=look)
                        front = await edit(client, url, key, [sheet], pf)
                        open("%s/%s_front_%s.png" % (OUT, k, tag), "wb").write(front)
                        await send(bot, uid, front, "%s_front_%s.png" % (k, tag), "%s · جلو · %s" % (fa, tag))
                        pb = BASE.format(name=NAME.get(k, k), view="back view, seen exactly from behind",
                                         eyes="head facing away from the camera so the face is not visible", look=look)
                        try:
                            back = await edit(client, url, key, [front, sheet], BACK_REF + pb)
                        except Exception as e:
                            print("2-image edit failed, using the sheet only:", str(e)[:200], flush=True)
                            back = await edit(client, url, key, [sheet], pb)
                        open("%s/%s_back_%s.png" % (OUT, k, tag), "wb").write(back)
                        await send(bot, uid, back, "%s_back_%s.png" % (k, tag), "%s · پشت · %s" % (fa, tag))
                    except Exception as e:
                        print("FAIL", k, tag, str(e)[:300], flush=True)
                        fails.append("%s %s: %s" % (k, tag, str(e)[:200]))
        summary = "hero3d تموم شد (%d دقیقه) | %d عکس ساخته شد | حدود %.2f دلار | پوشه %s" % ((time.time() - t0) / 60, TOT["images"], cost(), OUT)
        if fails:
            summary += "\nخطا:\n" + "\n".join(fails)
        print(summary, flush=True)
        await bot.send_message(uid, summary[:4000])
    except Exception as e:
        print("ERROR:", str(e)[:300], flush=True)
        try:
            await bot.send_message(uid, "hero3d failed: %s" % str(e)[:3500])
        except Exception as e2:
            print("telegram send failed:", str(e2)[:200], flush=True)
    finally:
        await bot.session.close()

asyncio.run(main())
