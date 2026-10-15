#!/usr/bin/env python3
# TP1 — Tripo multi-view test (front + back [+ left]) -> rig -> idle/walk/run/jump.  Runs on blue18 inside /root/bluebot_v2 (./.venv/bin/python).
# Never prints the key. Hard cap: ONE generation per run (RUN=G1, G2, ...). A rejected field is printed in full and the run STOPS (no loop, no credit).
# Env: CHAR=melika RUN=G1 FILES=front,back[,left] MODEL=P1-20260311 FACE=20000 RIG_SPEC=tripo ANIMS=idle,walk,run,jump  FRONT= BACK= LEFT= (picture paths)  DRY=1  NOPUSH=1
import asyncio, glob, json, os, struct, subprocess, sys, time, shutil
OUT = os.getenv("BW_ART", "/root/bw_art"); CHAR = os.getenv("CHAR", "melika"); RUN = os.getenv("RUN", "G1")
BASE = os.getenv("TRIPO_BASE", "https://api.tripo3d.ai/v2/openapi")
MODEL = os.getenv("MODEL", "P1-20260311"); FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "v3.0-20250812"); FACE = int(os.getenv("FACE", "20000"))
RIG_SPEC = os.getenv("RIG_SPEC", "tripo"); ANIMS = [a for a in os.getenv("ANIMS", "idle,walk,run,jump").split(",") if a]
FILES = [f for f in os.getenv("FILES", "front,back").split(",") if f]
DRY = bool(os.getenv("DRY")); NOPUSH = bool(os.getenv("NOPUSH")); D = "%s/tp1/%s_%s" % (OUT, CHAR, RUN)
REPO = os.getenv("REPO_URL", "git@github.com:Blu-Rez/bluewall-assets.git")
LOG = []
def say(*a):
    s = " ".join(str(x) for x in a); print(s, flush=True); LOG.append(s)
class TErr(Exception):
    def __init__(s, code, msg): super().__init__("Tripo %s: %s" % (code, msg)); s.code, s.msg = code, msg
def read_key():
    for l in open(OUT + "/keys.env", encoding="utf-8").read().splitlines():
        l = l.strip()
        if l.startswith("TRIPO_API_KEY="): return l.split("=", 1)[1].strip().strip('"').strip("'")
    return ""
def glb_info(b):
    ln = struct.unpack_from("<I", b, 12)[0]; js = json.loads(b[20:20 + ln]); acc = js["accessors"]; tris = 0
    for m in js.get("meshes", []):
        for p in m["primitives"]:
            if p.get("mode", 4) == 4: tris += (acc[p["indices"]]["count"] if "indices" in p else acc[p["attributes"]["POSITION"]]["count"]) // 3
    sk = js.get("skins", []); jn = [js["nodes"][j].get("name", "") for j in sk[0]["joints"]] if sk else []
    return {"tris": tris, "kb": len(b) // 1024, "joints": len(jn), "joint_names": jn, "clips": [a.get("name") for a in js.get("animations", [])], "materials": len(js.get("materials", [])),
            "images": len(js.get("images", [])), "pelvis_style": ("tripo-biped" if "Pelvis" in jn else "mixamo" if any(n.startswith("mixamorig") for n in jn) else "other" if jn else "no-skin")}
def find_pics():
    pics = {}
    for v in FILES:
        p = os.getenv(v.upper())
        if p: pics[v] = p; continue
        cand = [f for f in glob.glob(OUT + "/**/*", recursive=True) if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")) and CHAR in os.path.basename(f).lower() + os.path.dirname(f).lower()
                and v in os.path.basename(f).lower() and "old" not in os.path.basename(f).lower() and "/tp1/" not in f and os.path.getmtime(f) > time.time() - 12 * 3600]
        cand.sort(key=os.path.getmtime, reverse=True)
        if cand: pics[v] = cand[0]
    miss = [v for v in FILES if v not in pics]
    if miss:
        allc = sorted([f for f in glob.glob(OUT + "/**/*%s*" % CHAR, recursive=True) if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))], key=os.path.getmtime, reverse=True)[:12]
        raise SystemExit("picture(s) not found for: %s\nnewest candidates:\n%s\nset them explicitly, e.g.  FRONT=/path/a.png BACK=/path/b.png" % (",".join(miss), "\n".join(allc)))
    return pics
class Tripo:
    def __init__(s, key, c): s.key, s.c, s.last = key, c, 0.0
    async def req(s, method, path, **kw):
        w = s.last + 0.5 - time.time()
        if w > 0: await asyncio.sleep(w)
        s.last = time.time()
        for i in range(5):
            r = await s.c.request(method, BASE + path, headers={"Authorization": "Bearer " + s.key}, **kw)
            if r.status_code != 429 and r.status_code < 500: break
            await asyncio.sleep(5 * (i + 1))
        try: js = r.json()
        except Exception: raise TErr(r.status_code, r.text[:300])
        code = js.get("code", 0 if r.status_code < 400 else r.status_code)
        if r.status_code >= 400 or code != 0: raise TErr(code, json.dumps(js)[:600].replace(s.key, "***"))
        return js.get("data") or {}
    async def balance(s):
        d = await s.req("GET", "/user/balance"); return float(d.get("balance") or 0), float(d.get("frozen") or 0)
    async def upload(s, path):
        ext = path.rsplit(".", 1)[-1].lower(); ext = "jpeg" if ext == "jpg" else ext
        d = await s.req("POST", "/upload", files={"file": (os.path.basename(path), open(path, "rb").read(), "image/" + ext)}); return d["image_token"], ("jpeg" if ext == "jpeg" else ext)
    async def create(s, body): return (await s.req("POST", "/task", json=body))["task_id"]
    async def wait(s, tid, timeout=1500):
        t0 = time.time()
        while True:
            d = await s.req("GET", "/task/" + tid); st = d.get("status")
            if st == "success": return d
            if st in ("failed", "cancelled", "banned", "expired", "unknown"): raise TErr(d.get("error_code") or st, d.get("error_msg") or st)
            if time.time() - t0 > timeout: raise TErr("timeout", "task %s still %s" % (tid, st))
            await asyncio.sleep(3)
    async def get(s, url):
        r = await s.c.get(url, follow_redirects=True)
        if r.status_code != 200: raise TErr(r.status_code, "download failed")
        return r.content
def out_url(o, keys=("model", "pbr_model", "base_model")):
    for k in keys:
        v = (o or {}).get(k)
        if isinstance(v, dict): v = v.get("url")
        if isinstance(v, str) and v.startswith("http"): return v
    for v in (o or {}).values():
        if isinstance(v, str) and v.startswith("http") and ".glb" in v.split("?")[0]: return v
    return None
def mv_body(toks, model):
    # Tripo v2 multiview: files = [front, left, back, right]; an unused view is an empty object
    order = {"front": 0, "left": 1, "back": 2, "right": 3}; files = [{}, {}, {}, {}]
    for v, (tok, ext) in toks.items(): files[order[v]] = {"type": ext, "file_token": tok}
    return {"type": "multiview_to_model", "files": files, "model_version": model, "face_limit": FACE, "texture": True, "pbr": False}
async def main():
    os.makedirs(D, exist_ok=True); pics = find_pics(); say("pictures:", {k: v for k, v in pics.items()})
    if DRY:
        toks = {v: ("TOKEN_" + v, "png") for v in pics}; say("DRY multiview body:", json.dumps(mv_body(toks, MODEL)))
        say("DRY rig:", json.dumps({"type": "animate_rig", "original_model_task_id": "<gen>", "out_format": "glb", "rig_type": "biped", "spec": RIG_SPEC}))
        for a in ANIMS: say("DRY anim:", json.dumps({"type": "animate_retarget", "original_model_task_id": "<rig>", "animation": "preset:" + a, "out_format": "glb", "bake_animation": True}))
        return
    import httpx
    key = read_key()
    if not key.startswith("tsk_"): raise SystemExit("TRIPO_API_KEY not found in %s/keys.env" % OUT)
    steps = []; meta = {"char": CHAR, "run": RUN, "model": MODEL, "face_limit": FACE, "files": FILES, "rig_spec": RIG_SPEC, "steps": steps}
    async with httpx.AsyncClient(timeout=180) as c:
        tr = Tripo(key, c); b0, fr0 = await tr.balance(); say("balance before: %.2f (frozen %.2f)" % (b0, fr0)); meta["balance_before"] = b0
        if b0 <= 0: raise SystemExit("API balance is 0 -> top up the API (Studio credit does not count for the API). Stopped, nothing spent.")
        last = [b0]
        async def mark(name, task=None):
            b, _ = await tr.balance(); steps.append({"step": name, "task": task, "credits": round(last[0] - b, 2)}); last[0] = b; say("  %-16s credits %.2f (balance %.2f)" % (name, steps[-1]["credits"], b))
        toks = {}
        for v, p in pics.items(): toks[v] = await tr.upload(p)
        gid = None
        for model in (MODEL, FALLBACK_MODEL):
            try: gid = await tr.create(mv_body(toks, model)); meta["model_used"] = model; break
            except TErr as e:
                if e.code == 2010: raise
                say("create rejected with model", model, "->", e)          # printed in full; a rejection costs nothing
        if not gid: raise SystemExit("multiview request rejected by both model versions (see above). Stopped, nothing spent.")
        say("generation task", gid); g = await tr.wait(gid); go = g.get("output") or {}; u = out_url(go)
        if not u: raise TErr("no_output", "no model url in output keys=%s" % ",".join(go.keys()))
        glb = await tr.get(u); open(D + "/model.glb", "wb").write(glb); gi = glb_info(glb); meta["generated"] = {k: v for k, v in gi.items() if k != "joint_names"}; say("generated:", meta["generated"])
        pv = go.get("rendered_image"); pv = pv.get("url") if isinstance(pv, dict) else pv
        if isinstance(pv, str) and pv.startswith("http"):
            try: open(D + "/preview.webp", "wb").write(await tr.get(pv))
            except Exception as e: say("preview download failed", e)
        await mark("generate", gid)
        rig_id = None
        try:
            ck = await tr.create({"type": "animate_prerigcheck", "original_model_task_id": gid}); cd = await tr.wait(ck); co = cd.get("output") or {}; say("rig check:", co); await mark("rig_check", ck)
            if co.get("riggable"):
                rig_id = await tr.create({"type": "animate_rig", "original_model_task_id": gid, "out_format": "glb", "rig_type": co.get("rig_type") or "biped", "spec": RIG_SPEC})
                rd = await tr.wait(rig_id); ru = out_url(rd.get("output"), ("model", "rigged_model", "pbr_model", "base_model"))
                rglb = await tr.get(ru); open(D + "/rigged.glb", "wb").write(rglb); ri = glb_info(rglb); meta["rigged"] = ri; say("rigged:", {k: v for k, v in ri.items() if k != "joint_names"}); await mark("rig", rig_id)
        except TErr as e:
            if e.code == 2010: raise
            say("rig stage stopped:", e)
        if rig_id:
            for a in ANIMS:
                try:
                    tid = await tr.create({"type": "animate_retarget", "original_model_task_id": rig_id, "animation": "preset:" + a, "out_format": "glb", "bake_animation": True})
                    ad = await tr.wait(tid); au = out_url(ad.get("output"), ("model", "rigged_model", "base_model"))
                    open(D + "/anim_%s.glb" % a, "wb").write(await tr.get(au)); await mark("anim_" + a, tid)
                except TErr as e:
                    if e.code == 2010: raise
                    say("anim", a, "stopped:", e); break
        b1, _ = await tr.balance(); meta["balance_after"] = b1; meta["credits_total"] = round(b0 - b1, 2); say("balance after: %.2f  -> spent %.2f credits this run" % (b1, b0 - b1))
    json.dump(meta, open(D + "/task.json", "w"), indent=1); open(D + "/run.log", "w").write("\n".join(LOG))
    await tell(meta)
    if not NOPUSH: push()
async def tell(meta):
    try:
        sys.path.insert(0, "/root/bluebot_v2"); os.chdir("/root/bluebot_v2")
        from aiogram import Bot; from aiogram.types import BufferedInputFile; from config import settings
        kw = {}
        try:
            from aiogram.client.session.aiohttp import AiohttpSession; from aiogram.client.telegram import TelegramAPIServer
            if getattr(settings, "TG_LOCAL_API_BASE", ""): kw["session"] = AiohttpSession(api=TelegramAPIServer.from_base(settings.TG_LOCAL_API_BASE))
        except Exception: pass
        bot = Bot(settings.BOT_TOKEN, **kw)
        txt = "TP1 %s %s: %s tris, rig %s, spent %s credits (balance %s)" % (CHAR, RUN, (meta.get("rigged") or meta["generated"])["tris"], (meta.get("rigged") or {}).get("pelvis_style", "-"), meta["credits_total"], meta["balance_after"])
        if os.path.exists(D + "/preview.webp"): await bot.send_photo(settings.SUPER_ADMIN_UID, BufferedInputFile(open(D + "/preview.webp", "rb").read(), "preview.webp"), caption=txt[:900])
        else: await bot.send_message(settings.SUPER_ADMIN_UID, txt)
        await bot.session.close()
    except Exception as e: print("telegram skipped:", e)
def push():
    env = dict(os.environ, GIT_TERMINAL_PROMPT="0", GIT_SSH_COMMAND="ssh -i /root/.ssh/bw_deploy -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new")
    if not os.path.exists("/root/.ssh/bw_deploy"): print("no deploy key: files stay in", D); return
    w = "/root/bw_tp1_repo"; shutil.rmtree(w, ignore_errors=True)
    def g(*a, t=300):
        r = subprocess.run(["git"] + list(a), cwd=w if os.path.isdir(w) else None, env=env, capture_output=True, text=True, timeout=t); return r.returncode, (r.stdout + r.stderr)[-300:]
    rc, o = g("clone", "-q", "--depth", "1", "--filter=blob:none", "--sparse", REPO, w)
    if rc: print("git clone failed:", o); return
    g("sparse-checkout", "set", "v5/lib/tp1"); dst = "%s/v5/lib/tp1/%s_%s" % (w, CHAR, RUN); os.makedirs(dst, exist_ok=True)
    for f in os.listdir(D):
        if os.path.getsize(D + "/" + f) < 90 * 1024 * 1024: shutil.copy(D + "/" + f, dst)
    g("add", "-A"); g("-c", "user.name=bw-tp1", "-c", "user.email=bw-tp1@users.noreply.github.com", "commit", "-q", "-m", "TP1: %s %s Tripo multiview test" % (CHAR, RUN))
    for i in range(4):
        g("pull", "-q", "--rebase", "origin", "main"); rc, o = g("push", "-q", "origin", "HEAD:main")
        if rc == 0: print("pushed to main: v5/lib/tp1/%s_%s" % (CHAR, RUN)); break
        time.sleep(20)
    else: print("git push failed:", o)
    shutil.rmtree(w, ignore_errors=True)
if __name__ == "__main__":
    try: asyncio.run(main())
    except SystemExit as e: print(e); sys.exit(1)
    except Exception as e: print("ERROR:", str(e)[:800]); sys.exit(1)
