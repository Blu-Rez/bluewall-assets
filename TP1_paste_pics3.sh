mkdir -p /root/bw_art/tp1 && cat > /root/bw_art/tp1_pics.py <<'BWEOF'
# TP1_pics.py - Melika: FRONT + BACK + SIDE pictures for Tripo, sent to the owner's bot private chat.
# Runs on blue18: cd /root/bluebot_v2 && ./.venv/bin/python /root/bw_art/tp1_pics.py
# Env: ONLY=front,back,side (default all) | FIX="extra sentence" | DRY=1 (no network, prints sizes)
import asyncio, base64, os, sys, time

BOTDIR = os.getenv("BWROOT", "/root/bluebot_v2")
OUT = os.getenv("TP1_OUT", "/root/bw_art/tp1")
SHEET = os.getenv("SHEET", "/root/bw_art/melika.png")
MODEL = os.getenv("IMG_MODEL", "gpt-image-2.5-sunburst")
QUALITY = os.getenv("IMG_QUALITY", "high")
ONLY = [x for x in os.getenv("ONLY", "").split(",") if x] or ["front", "back", "side"]
FIX = os.getenv("FIX", "").strip()
PRICE = {"text_in": 5.0, "image_in": 8.0, "image_out": 30.0}
TOT = {"text_in": 0, "image_in": 0, "image_out": 0, "images": 0}

COMMON_END = (
    "NO bow, NO quiver, NO arrows, NO dagger, NO cheetah, nothing in her hands. "
    "Plain flat light-grey background, soft even studio light, no cast shadow, no floor texture. "
    "NO text, NO labels, NO frame, NO second view. "
    "Real skin and real fabric, like a still from a high-end live-action fantasy film. "
    "NOT anime, NOT illustration, NOT painting."
)

P_FRONT = (
    "Use the attached character sheet only to copy this exact person: face, hair, body, clothes, colours, materials. "
    "Output ONE photorealistic full-body picture of Melika for a 3D scan: FRONT view, facing the camera. "
    "A-pose: arms straight, angled about 45 degrees away from the body, hands open and empty with relaxed slightly "
    "spread fingers and palms toward the thighs; feet shoulder-width apart and flat on the floor; neutral calm face, "
    "mouth closed, eyes open looking at the camera. "
    "Camera straight at chest height, no perspective tilt, the whole body from hair to boots visible with a small "
    "margin, centred. "
    "Costume for a game model: green layered robe ending just above the ankles (no train, not touching the floor, "
    "a little narrower so the boots show), brown hooded cloak ending at the hips and hanging close to the body, "
    "dark brown curly hair with small white flowers, brown leather herb belt with pouches and glass vials, leather "
    "vambraces, brown boots; all fabric opaque, nothing see-through. "
    "Keep her face exactly as beautiful as in the sheet: young, smooth clear skin, light brown-green eyes. "
) + COMMON_END

P_BACK = (
    "Use the attached character sheet and the attached FRONT picture only to copy this exact person: the same face "
    "shape, hair, body, clothes, colours and materials, the same pose, the same camera height and the same scale and "
    "framing as the front picture. "
    "Output ONE photorealistic full-body picture of Melika for a 3D scan: BACK view, seen exactly from behind "
    "(she faces away from the camera). "
    "A-pose: arms straight, angled about 45 degrees away from the body, hands open and empty with relaxed slightly "
    "spread fingers; feet shoulder-width apart and flat on the floor. "
    "Camera straight at chest height, no perspective tilt, the whole body from hair to boots visible with a small "
    "margin, centred. "
    "Show the back of the green layered robe ending just above the ankles, the brown hooded cloak ending at the "
    "hips, the long dark brown curly hair with small white flowers hanging down her back, the back of the belt and "
    "the boots. "
) + COMMON_END

P_SIDE = (
    "Use the attached character sheet and the attached FRONT picture only to copy this exact person: the same face, "
    "hair, body, clothes, colours and materials, the same pose, the same camera height and the same scale and "
    "framing as the front picture. "
    "Output ONE photorealistic full-body picture of Melika for a 3D scan: pure SIDE view (exactly 90 degrees), her "
    "LEFT side toward the camera, she faces the LEFT edge of the picture. "
    "A-pose: arms straight, angled about 45 degrees away from the body so both arms stay visible, hands open and "
    "empty with relaxed fingers; feet shoulder-width apart and flat on the floor. "
    "Camera straight at chest height, no perspective tilt, the whole body from hair to boots visible with a small "
    "margin, centred. "
    "Costume as in the front picture: green layered robe ending just above the ankles, brown hooded cloak ending at "
    "the hips, dark brown curly hair with small white flowers, herb belt with pouches and vials, vambraces, boots. "
) + COMMON_END

FA = {"front": "Melika 1 - FRONT", "back": "Melika 2 - BACK", "side": "Melika 3 - SIDE"}
PROMPTS = {"front": P_FRONT, "back": P_BACK, "side": P_SIDE}


def add_usage(u):
    if not u:
        return
    d = u.get("input_tokens_details") or {}
    TOT["text_in"] += d.get("text_tokens", 0) if d else u.get("input_tokens", 0)
    TOT["image_in"] += d.get("image_tokens", 0)
    TOT["image_out"] += u.get("output_tokens", 0)


def cost():
    return (TOT["text_in"] * PRICE["text_in"] + TOT["image_in"] * PRICE["image_in"]
            + TOT["image_out"] * PRICE["image_out"]) / 1e6


if os.getenv("DRY"):
    for k in ("front", "back", "side"):
        print(k, len(PROMPTS[k]), "chars")
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


async def edit(client, url, key, prompt, images):
    last = ""
    for attempt in (1, 2, 3):
        try:
            files = [("image[]", ("ref%d.png" % i, b, "image/png")) for i, b in enumerate(images)]
            data = {"model": MODEL, "prompt": prompt, "size": "1024x1536", "quality": QUALITY}
            r = await client.post(url + "/images/edits", headers={"Authorization": "Bearer " + key},
                                  data=data, files=files)
            if r.status_code == 200:
                js = r.json()
                add_usage(js.get("usage"))
                item = js["data"][0]
                if item.get("b64_json"):
                    return base64.b64decode(item["b64_json"])
                if item.get("url"):
                    rr = await client.get(item["url"])
                    return rr.content
                last = "no image in answer"
            else:
                last = "OpenAI %s: %s" % (r.status_code, r.text[:300])
        except Exception as e:
            last = "%s: %s" % (type(e).__name__, str(e)[:200])
        print("try", attempt, "failed:", last, flush=True)
        await asyncio.sleep(6)
    raise RuntimeError(last)


async def main():
    os.makedirs(OUT, exist_ok=True)
    bot = make_bot()
    uid = settings.SUPER_ADMIN_UID
    got = {}
    fails = []
    t0 = time.time()

    async def tell(text):
        try:
            await bot.send_message(uid, text[:4000])
        except Exception as e:
            print("telegram text failed:", e, flush=True)

    async def show(k, png):
        try:
            await bot.send_photo(uid, BufferedInputFile(png, k + ".png"), caption=FA[k])
        except Exception as e:
            print("telegram photo failed", k, e, flush=True)

    try:
        if not os.path.exists(SHEET):
            raise RuntimeError("sheet not found: %s (ls /root/bw_art/*.png)" % SHEET)
        sheet = open(SHEET, "rb").read()
        url, key = await openai_conn()
        if not key:
            raise RuntimeError("OPENAI key not found (.env or panel)")
        await tell("TP1: making Melika %s with %s (%s)..." % ("+".join(ONLY), MODEL, QUALITY))
        async with httpx.AsyncClient(timeout=600) as client:
            async def one(k, imgs):
                p = PROMPTS[k] + ((" " + FIX) if FIX else "")
                try:
                    png = await edit(client, url, key, p, imgs)
                except Exception as e:
                    print("FAIL", k, e, flush=True)
                    fails.append("%s: %s" % (k, str(e)[:200]))
                    return
                TOT["images"] += 1
                open("%s/%s.png" % (OUT, k), "wb").write(png)
                got[k] = png
                print("done", k, "| cost so far ~$%.3f" % cost(), flush=True)
                await show(k, png)

            front = None
            if "front" in ONLY:
                await one("front", [sheet])
                front = got.get("front")
            elif os.path.exists(OUT + "/front.png"):
                front = open(OUT + "/front.png", "rb").read()
            rest = [k for k in ("back", "side") if k in ONLY]
            if rest:
                if front is None:
                    raise RuntimeError("no front picture, back/side need it")
                await asyncio.gather(*(one(k, [sheet, front]) for k in rest))

        order = [k for k in ("front", "back", "side") if k in got]
        if order:
            media = [InputMediaDocument(media=BufferedInputFile(got[k], k + ".png")) for k in order]
            try:
                if len(media) > 1:
                    await bot.send_media_group(uid, media)
                else:
                    await bot.send_document(uid, BufferedInputFile(got[order[0]], order[0] + ".png"))
            except Exception as e:
                print("album failed", e, flush=True)
                for k in order:
                    try:
                        await bot.send_document(uid, BufferedInputFile(got[k], k + ".png"))
                    except Exception as e2:
                        print("doc failed", k, e2, flush=True)
        n = max(TOT["images"], 1)
        summary = ("TP1 pictures done in %.1f min\nok: %s | failed: %d\ncost ~ $%.2f (~$%.3f per picture)\n"
                   "files: %s/{front,back,side}.png\nredo one: ONLY=back FIX='...' (front is reused)"
                   % ((time.time() - t0) / 60, ",".join(order) or "-", len(fails), cost(), cost() / n, OUT))
        if fails:
            summary += "\nfailed:\n" + "\n".join(fails)
        print(summary, flush=True)
        await tell(summary)
    except Exception as e:
        print("ERROR:", e, flush=True)
        await tell("TP1 pictures failed: %s" % str(e)[:3500])
    finally:
        await bot.session.close()

asyncio.run(main())
BWEOF
cd /root/bluebot_v2 && nohup ./.venv/bin/python /root/bw_art/tp1_pics.py > /root/bw_art/tp1/pics.log 2>&1 &
sleep 5; tail -n 5 /root/bw_art/tp1/pics.log
