mkdir -p /root/bw_art/cp1 && cat > /root/bw_art/cp1/fix.py <<'BWEOF'
import asyncio, base64, os, sys, time

DRY = bool(os.getenv("DRY"))
MODEL = os.getenv("IMG_MODEL", "gpt-image-2.5-sunburst")
QUALITY = os.getenv("IMG_QUALITY", "high")
PAR = int(os.getenv("IMG_PARALLEL", "3"))
ONLY = [x for x in os.getenv("ONLY", "").split(",") if x]
OUT = "/root/bw_art/cp1"
IN = os.getenv("CP1_IN", "/root/bw_art/cp1_in") + "/photos_CP1"

# key: (hem text, cloak description). Hem = right under the buttocks (rig-derived, ~48-51% of body height).
SIS = {
    "elina":  (51, "her deep-red short cape (now it has a ragged, torn hem)"),
    "elika":  (48, "her blue-grey cloak with the soft scarf-like collar"),
    "melika": (48, "her brown hooded cloak (the hood stays down on the back, as it is)"),
    "aylin":  (50, "her blue hooded cloak (the hood stays down on the back, as it is)"),
    "mobina": (51, "her brown cloak"),
    "aylar":  (50, "her dark-navy cloak with the white fur collar (keep the fur collar and the silver trim)"),
}

LOOK = ("Photorealistic full-body character image of a real young woman in her real costume (real fabric, leather and skin textures), in exactly the same visual style, "
        "lighting and level of realism as the reference image. NOT anime, NOT illustration, NOT painting. Plain light-grey studio background, soft even light, no floor shadow, "
        "no text, no captions, no frame, no panels, only ONE view. The whole body from head to boots is in frame, centred, with space around it.")

CLOAK = ("CLOAK: {cloak}. Make it SHORTER: the hem ends at hip height, just below the buttocks (about {hem}% of the body height above the soles), clearly above the middle of the thighs. "
         "It hangs freely and loosely behind the body with a small gap of air between the cloak and her back and hips; it does NOT stick to the body, is NOT tight, NOT billowing, "
         "NOT wider than her shoulders. Thick, opaque, matte fabric with a clean straight hem: no ragged or torn edge, no long trailing parts, no loose strips. "
         "It is attached only at the neck and shoulders.")
ARMS = ("ARMS: held away from the body in a relaxed A-pose: each arm about 35 degrees away from the torso, hands open with the palms toward the thighs, "
        "a clear gap of air between each arm and the body and the cloak. Legs slightly apart, standing straight, facing {face}.")


def front_prompt(k):
    hem, cloak = SIS[k]
    return ("Edit the reference image. Keep EXACTLY the same character: same face, hair, outfit, colours, materials and boots; the same person. Change ONLY these two things:\n1) "
            + CLOAK.format(cloak=cloak, hem=hem) + " Seen from the front the cloak shows only at the shoulders and as a short edge beside the arms.\n2) "
            + ARMS.format(face="the camera") + "\n" + LOOK + " FRONT VIEW.")


def back_prompt(k):
    hem, cloak = SIS[k]
    return ("There are three reference images. Image 1 = the character's current BACK view. Image 2 = her corrected FRONT view (match this identity, outfit and pose). "
            "Image 3 = the Blue Wall crown emblem. Create the matching BACK view of the exact same character: same face shape, hair, outfit, colours, materials and boots as in the references. "
            "Change ONLY these three things:\n1) " + CLOAK.format(cloak=cloak, hem=hem) + "\n2) " + ARMS.format(face="away from the camera") +
            "\n3) EMBLEM: put the Blue Wall crown emblem (the blue crown of image 3) on the back of the cloak, centred on the spine, between the shoulder blades, "
            "about 10% of the body height below the shoulders, upright, flat, sharp and fully visible, about 12% of the body height wide, replacing any old symbol on the cloak.\n"
            + LOOK + " BACK VIEW, seen from behind.")


def ref(name):
    p = IN + "/" + name
    return open(p, "rb").read() if os.path.exists(p) else None


async def openai_conn():
    from config import settings
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
    from aiogram import Bot
    from config import settings
    base = getattr(settings, "TG_LOCAL_API_BASE", "") or ""
    if base:
        from aiogram.client.session.aiohttp import AiohttpSession
        from aiogram.client.telegram import TelegramAPIServer
        return Bot(token=settings.BOT_TOKEN, session=AiohttpSession(api=TelegramAPIServer.from_base(base.rstrip("/"), is_local=True)))
    return Bot(token=settings.BOT_TOKEN)


async def edit(client, url, key, prompt, refs):
    last = ""
    for attempt in (1, 2, 3):
        try:
            r = await client.post(url + "/images/edits", headers={"Authorization": "Bearer " + key},
                                  data={"model": MODEL, "prompt": prompt, "size": "1024x1536", "quality": QUALITY, "n": "1"},
                                  files=[("image[]", ("ref%d.png" % i, b, "image/png")) for i, b in enumerate(refs)])
            if r.status_code == 200:
                return base64.b64decode(r.json()["data"][0]["b64_json"])
            last = "OpenAI %s: %s" % (r.status_code, r.text[:300])
        except Exception as e:
            last = repr(e)[:300]
        print("retry", attempt, last, flush=True)
        await asyncio.sleep(5)
    raise RuntimeError(last)


async def main():
    keys = [k for k in SIS if not ONLY or k in ONLY]
    crown = ref("emblem_bluewall_crown.png")
    if DRY:
        print("crown:", None if crown is None else len(crown), "bytes")
        for k in keys:
            f, b = ref("views/%s_front.png" % k), ref("views/%s_back.png" % k)
            print("\n==", k, "front ref:", None if f is None else len(f), "back ref:", None if b is None else len(b))
            print("-- FRONT PROMPT\n" + front_prompt(k) + "\n-- BACK PROMPT\n" + back_prompt(k))
        return
    sys.path.insert(0, "/root/bluebot_v2"); os.chdir("/root/bluebot_v2")
    import httpx
    from aiogram.types import BufferedInputFile
    from config import settings
    bot = make_bot(); uid = settings.SUPER_ADMIN_UID; t0 = time.time(); fails = []; done = []
    try:
        miss = [n for n in ["emblem_bluewall_crown.png"] + ["views/%s_%s.png" % (k, v) for k in keys for v in ("front", "back")] if ref(n) is None]
        if miss:
            raise RuntimeError("reference files missing in %s: %s" % (IN, ", ".join(miss[:5])))
        url, key = await openai_conn()
        if not key:
            raise RuntimeError("OPENAI_API_KEY not found (.env or panel)")
        await bot.send_message(uid, "CP1: making %d sisters (front + back, A-pose, shorter cloak, crown). ~%d min..." % (len(keys), 4 + 2 * len(keys) // PAR))
        sem = asyncio.Semaphore(PAR)
        async with httpx.AsyncClient(timeout=600) as client:
            async def one(k):
                async with sem:
                    try:
                        pf = "%s/%s_front.png" % (OUT, k); pb = "%s/%s_back.png" % (OUT, k)
                        if os.path.exists(pf) and os.path.getsize(pf) > 1000:
                            front = open(pf, "rb").read()
                        else:
                            front = await edit(client, url, key, front_prompt(k), [ref("views/%s_front.png" % k)])
                            open(pf, "wb").write(front)
                        if os.path.exists(pb) and os.path.getsize(pb) > 1000:
                            back = open(pb, "rb").read()
                        else:
                            back = await edit(client, url, key, back_prompt(k), [ref("views/%s_back.png" % k), front, crown])
                            open(pb, "wb").write(back)
                        done.append((k, front, back)); print("ok", k, flush=True)
                        for nm, png in (("FRONT", front), ("BACK", back)):
                            try:
                                await bot.send_photo(uid, BufferedInputFile(png, "%s_%s.png" % (k, nm.lower())), caption="%s · %s" % (k, nm))
                            except Exception as e:
                                print("telegram photo failed", k, nm, e, flush=True)
                    except Exception as e:
                        print("FAIL", k, e, flush=True); fails.append("%s: %s" % (k, str(e)[:200]))
            await asyncio.gather(*[one(k) for k in keys])
        for k, front, back in sorted(done):
            for nm, png in (("front", front), ("back", back)):
                try:
                    await bot.send_document(uid, BufferedInputFile(png, "%s_%s.png" % (k, nm)), caption="%s %s (full file, give this to Tripo Studio > Image to 3D)" % (k, nm))
                except Exception as e:
                    print("telegram doc failed", k, nm, e, flush=True)
        msg = "CP1 done in %.0f min: %d ok, %d failed. Files: %s/<name>_front.png and _back.png" % ((time.time() - t0) / 60, len(done), len(fails), OUT)
        if fails:
            msg += "\n" + "\n".join(fails) + "\n(run the same command again: only the missing ones are made; ONLY=elina,aylar limits it)"
        print(msg, flush=True); await bot.send_message(uid, msg[:4000])
    except Exception as e:
        print("ERROR:", e, flush=True)
        try:
            await bot.send_message(uid, "CP1 failed: %s" % str(e)[:3500])
        except Exception as e2:
            print("telegram send failed:", e2, flush=True)
    finally:
        await bot.session.close()

asyncio.run(main())
BWEOF
IN=/root/bw_art/cp1_in
if [ ! -f $IN/photos_CP1/views/elina_front.png ]; then rm -rf $IN && mkdir -p $IN && git clone -q --depth 1 -b inbox/CP1 https://github.com/Blu-Rez/bluewall-assets.git $IN/repo && tar -xzf $IN/repo/photos_CP1.tar.gz -C $IN || { echo "FAILED to fetch the reference images from GitHub (inbox/CP1)"; exit 1; }; fi
cd /root/bluebot_v2 && ./.venv/bin/python /root/bw_art/cp1/fix.py
