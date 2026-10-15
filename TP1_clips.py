#!/usr/bin/env python3
"""TP1_clips.py - the clip library for Tripo Studio "mixamo" rigs (65 joints, mixamorig:*), numpy + scipy only.

  python3 TP1_clips.py lib   SRC.glb  OUT_lib.glb  OUT_manifest.json     # SRC = the model that carries the 54 Studio clips (Aylar)
  python3 TP1_clips.py apply LIB.glb  DEST.glb  OUT.glb [--own-walk-only] [--only=name1,name2,...] [--game-names] # --game-names renames 20 bones to the game's Tripo-native names (Pelvis, Spine02, L_Hand ...), NOT proven in the game. DEST = any new model rigged in Studio (the Walk preset only is enough)
  python3 TP1_clips.py check A.glb B.glb                                  # pose error src->dst, % of hip height

What it does (same method as RP0A, proven there): world-space rotation delta  D = R_src(t) * R_src_rest^-1 ,  R_dst(t) = D * R_dst_rest ;
hip translation scaled by the hip-height ratio ; ground fit (lowest foot point keeps its scaled height) ; root motion per clip mode:
  lock  = the body stays where it started (the game moves it)        loop = drift removed + recentred (walk / sprint)
  keep  = nothing touched (death)                                      (Y is always kept)
Loop clips get the last 0.35 s blended into the first pose (no seam). Keys are reduced (0.15 deg / 0.5 mm).
Only the 65 mixamo joints are animated (rotation) + the hips (translation); no scale / other translation channels.
"""
import sys, json, struct, copy, math
import numpy as np
from scipy.spatial.transform import Rotation as Rot

FPS = 24.0
HIPS = "mixamorig:Hips"
FEET = ["mixamorig:LeftFoot", "mixamorig:RightFoot", "mixamorig:LeftToeBase", "mixamorig:RightToeBase"]

# ---- the table: Studio clip index (in Aylar's file, by prompt) -> game clip name, root mode, loop, verdict
# verdict: ok = looks right | weak = plays but the motion is small / not what the prompt says | seat = rider clip, legs stand (no seated legs) | reject = not exported
CLIPS = [
    (53, "walk",              "loop", True,  "ok",     "Walk preset; root motion removed (it walked 4.3 m)"),
    (32, "sprint",            "loop", True,  "ok",     "Sprinting, in place"),
    (45, "jump_stand",        "lock", False, "ok",     "standing jump"),
    (38, "land_soft",         "lock", False, "ok",     "landing from a jump"),
    (31, None,                "lock", False, "reject", "'falling through the air' lies down flat on the ground, not a fall; keep the existing fall"),
    (14, "climb_wall",        "lock", True,  "ok",     "wall climb, hand over hand, 5 s loop"),
    (52, "climb_ledge",       "lock", False, "ok",     "over the ledge at the top of the wall"),
    (25, "stairs_up",         "lock", True,  "ok",     "walking up stairs, 5 s loop"),
    (13, "swim_breast",       "lock", True,  "weak",   "breaststroke, body flat; the arms move little"),
    (35, None,                "lock", False, "reject", "treading water: figure lies flat below the ground, no upright pose"),
    (12, "get_up",            "lock", False, "ok",     "from lying on the ground to standing"),
    (48, "wave",              "lock", False, "ok",     "friendly wave"),
    (2,  "cast_ground",       "lock", False, "ok",     "earth spell: crouch + palm slam"),
    (4,  "shoot_bow",         "lock", False, "weak",   "bow: small arm motion"),
    (5,  "spear_thrust",      "lock", False, "ok",     "step + thrust"),
    (42, "dagger_stab",       "lock", False, "ok",     "two quick dagger strikes"),
    (44, "staff_cast",        "lock", False, "ok",     "staff raised overhead + cast"),
    (23, "guard_hold",        "lock", True,  "ok",     "defensive guard stance, loop"),
    (34, "greatsword_swing",  "lock", False, "ok",     "two-handed horizontal swing"),
    (0,  "greatsword_overhead", "lock", False, "weak", "stays in a wide stance for 6 s, the lift is at the end"),
    (11, "hammer_smash",      "lock", False, "ok",     "hammer over the shoulder, smash"),
    (27, "spear_sweep",       "lock", False, "ok",     "wide spear sweep"),
    (22, "staff_slam",        "lock", False, "ok",     "staff overhead, slam on the ground"),
    (41, "staff_slam_b",      "lock", False, "ok",     "second take of staff_slam"),
    (51, "sword_shield_slash", "lock", False, "ok",    "slash with the shield held close"),
    (29, "shield_bash",       "lock", False, "ok",     "shield ram"),
    (30, "battle_idle",       "lock", True,  "ok",     "ready battle stance, loop"),
    (33, "war_cry",           "lock", False, "ok",     "weapon arm up + shout"),
    (40, "rally_banner",      "lock", False, "ok",     "banner up, plant"),
    (1,  "victory",           "lock", False, "ok",     "celebration, arm up"),
    (7,  "crossbow_shoot",    "lock", False, "ok",     "crossbow to the shoulder + fire"),
    (19, "crossbow_reload",   "lock", False, "ok",     "crank + load"),
    (18, "cast_projectile",   "lock", False, "ok",     "one palm thrust (magic bolt)"),
    (47, "cast_channel",      "lock", True,  "ok",     "both palms forward, continuous channel, loop"),
    (10, "cast_summon",       "lock", False, "ok",     "both arms up high"),
    (43, "cast_buff",         "lock", False, "weak",   "hands over chest then open; very small motion"),
    (24, "hit_back",          "lock", False, "ok",     "struck from behind, stumble"),
    (49, "hit_heavy",         "lock", False, "ok",     "hit hard in the chest, stagger"),
    (9,  "stun_dizzy",        "lock", True,  "weak",   "dazed sway, very small motion"),
    (39, "death_forward",     "keep", False, "ok",     "falls forward on the knees then flat"),
    (3,  "giant_swing",       "lock", False, "ok",     "creature: wide backhand arm swing"),
    (15, "giant_smash",       "lock", False, "ok",     "creature: both fists up, slam"),
    (6,  "roar",              "lock", False, "ok",     "creature: roar, arms open"),
    (20, "beast_leap",        "lock", False, "ok",     "crouch, leap forward, land (in place)"),
    (46, "ride_idle",         "lock", True,  "seat",   "RIDER: legs stand straight, not seated"),
    (17, "ride_walk",         "lock", True,  "seat",   "RIDER: upper body only"),
    (36, "ride_gallop",       "lock", True,  "seat",   "RIDER: upper body only"),
    (50, "mount",             "lock", False, "seat",   "RIDER: mounting from the left, no horse"),
    (37, "dismount",          "lock", False, "seat",   "RIDER: dismounting to the left, no horse"),
    (16, "ride_slash",        "lock", False, "seat",   "RIDER: sideways sword slash, upper body"),
    (8,  "ride_lance",        "lock", False, "seat",   "RIDER: lance thrust, upper body"),
    (26, "ride_shoot",        "lock", False, "seat",   "RIDER: bow to the side"),
    (28, "ride_shoot_b",      "lock", False, "seat",   "RIDER: second take of ride_shoot"),
    (21, "ride_hit",          "lock", False, "seat",   "RIDER: hit reaction, upper body"),
]
# the model's own presets (Walk / Idle / Run / Jump from Studio) -> clip name, root mode, loop
OWN = {"walking": ("walk", "loop", True), "walk": ("walk", "loop", True), "idle": ("idle", "lock", True),
       "running": ("run", "loop", True), "run": ("run", "loop", True), "jump": ("jump", "lock", False)}


# ------------------------------------------------------------------ GLB io
def load_glb(path):
    b = open(path, "rb").read()
    assert b[:4] == b"glTF"
    off = 12; js = None; binb = b""
    while off < len(b):
        cl, ct = struct.unpack("<II", b[off:off + 8])
        if ct == 0x4E4F534A: js = json.loads(b[off + 8:off + 8 + cl])
        elif ct == 0x004E4942: binb = b[off + 8:off + 8 + cl]
        off += 8 + cl
    return js, binb


def read_acc(js, binb, i):
    a = js["accessors"][i]; assert a["componentType"] == 5126
    bv = js["bufferViews"][a["bufferView"]]
    n = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}[a["type"]]
    o = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    return np.frombuffer(binb, dtype="<f4", count=a["count"] * n, offset=o).reshape(a["count"], n).astype(np.float64)


def write_glb(path, js, binb):
    js = copy.deepcopy(js)
    js["buffers"] = [{"byteLength": len(binb)}]
    j = json.dumps(js, separators=(",", ":")).encode()
    j += b" " * ((4 - len(j) % 4) % 4)
    binb = binb + b"\0" * ((4 - len(binb) % 4) % 4)
    total = 12 + 8 + len(j) + 8 + len(binb)
    with open(path, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total))
        f.write(struct.pack("<II", len(j), 0x4E4F534A)); f.write(j)
        f.write(struct.pack("<II", len(binb), 0x004E4942)); f.write(binb)


def compact_and_add(js, binb, clips, keep_meshes=True):
    """drop every old animation, garbage-collect unused accessors / bufferViews, then add `clips` (list of dict name,times,rot{joint:(N,4)},hips(N,3))."""
    js = copy.deepcopy(js)
    js.pop("animations", None)
    used = set()
    for m in js.get("meshes", []):
        for pr in m["primitives"]:
            used.update(pr["attributes"].values())
            if "indices" in pr: used.add(pr["indices"])
            for t in pr.get("targets", []): used.update(t.values())
    for sk in js.get("skins", []):
        if "inverseBindMatrices" in sk: used.add(sk["inverseBindMatrices"])
    amap = {}; new_acc = []
    for i, a in enumerate(js["accessors"]):
        if i in used: amap[i] = len(new_acc); new_acc.append(a)
    bv_used = sorted({a["bufferView"] for a in new_acc if "bufferView" in a} | {im["bufferView"] for im in js.get("images", []) if "bufferView" in im})
    out = bytearray(); bvmap = {}; new_bv = []
    for i in bv_used:
        bv = copy.deepcopy(js["bufferViews"][i])
        while len(out) % 4: out += b"\0"
        o = bv.get("byteOffset", 0)
        bvmap[i] = len(new_bv); bv["byteOffset"] = len(out); bv["buffer"] = 0
        out += binb[o:o + bv["byteLength"]]; new_bv.append(bv)
    for a in new_acc:
        if "bufferView" in a: a["bufferView"] = bvmap[a["bufferView"]]
    for m in js.get("meshes", []):
        for pr in m["primitives"]:
            pr["attributes"] = {k: amap[v] for k, v in pr["attributes"].items()}
            if "indices" in pr: pr["indices"] = amap[pr["indices"]]
            for t in pr.get("targets", []):
                for k in list(t): t[k] = amap[t[k]]
    for sk in js.get("skins", []):
        if "inverseBindMatrices" in sk: sk["inverseBindMatrices"] = amap[sk["inverseBindMatrices"]]
    for im in js.get("images", []):
        if "bufferView" in im: im["bufferView"] = bvmap[im["bufferView"]]
    js["accessors"] = new_acc; js["bufferViews"] = new_bv
    nodes = js["nodes"]; idx = {n.get("name"): i for i, n in enumerate(nodes)}
    anims = []

    def add(arr, typ, mn_mx=False):
        arr = np.ascontiguousarray(arr, dtype="<f4")
        while len(out) % 4: out.extend(b"\0")
        bvi = len(js["bufferViews"]); js["bufferViews"].append({"buffer": 0, "byteOffset": len(out), "byteLength": arr.nbytes})
        out.extend(arr.tobytes())
        a = {"bufferView": bvi, "componentType": 5126, "count": int(arr.shape[0]), "type": typ}
        if mn_mx: a["min"] = [float(arr.min())]; a["max"] = [float(arr.max())]
        js["accessors"].append(a); return len(js["accessors"]) - 1
    for c in clips:
        an = {"name": c["name"], "samplers": [], "channels": []}
        for jn, q in c["rot"].items():
            t, qq = reduce_track(c["times"], q, True)
            si = len(an["samplers"]); an["samplers"].append({"input": add(t, "SCALAR", True), "output": add(qq, "VEC4"), "interpolation": "LINEAR"})
            an["channels"].append({"sampler": si, "target": {"node": idx[jn], "path": "rotation"}})
        t, pp = reduce_track(c["times"], c["hips"], False)
        si = len(an["samplers"]); an["samplers"].append({"input": add(t, "SCALAR", True), "output": add(pp, "VEC3"), "interpolation": "LINEAR"})
        an["channels"].append({"sampler": si, "target": {"node": idx[HIPS], "path": "translation"}})
        anims.append(an)
    if anims: js["animations"] = anims
    return js, bytes(out)


def reduce_track(t, v, is_rot, rtol=math.radians(0.15), ptol=0.0005):
    n = len(t)
    if n <= 2: return t, v
    keep = {0, n - 1}; stack = [(0, n - 1)]
    while stack:
        a, b = stack.pop()
        if b - a < 2: continue
        ii = np.arange(a + 1, b)
        f = ((t[ii] - t[a]) / (t[b] - t[a]))[:, None]
        if is_rot:
            q1 = v[b] if np.dot(v[a], v[b]) >= 0 else -v[b]
            est = v[a][None] * (1 - f) + q1[None] * f
            est /= np.linalg.norm(est, axis=1, keepdims=True)
            err = 2 * np.arccos(np.clip(np.abs((est * v[ii]).sum(1)), 0, 1)); tol = rtol
        else:
            est = v[a][None] * (1 - f) + v[b][None] * f
            err = np.linalg.norm(est - v[ii], axis=1); tol = ptol
        k = int(err.argmax())
        if err[k] > tol:
            m = int(ii[k]); keep.add(m); stack += [(a, m), (m, b)]
    ks = np.array(sorted(keep))
    return t[ks], v[ks]


# ------------------------------------------------------------------ skeleton
class Skel:
    def __init__(self, js):
        self.js = js; nodes = js["nodes"]; n = len(nodes)
        self.par = [-1] * n
        for i, nd in enumerate(nodes):
            for c in nd.get("children", []): self.par[c] = i
        self.names = [nd.get("name") for nd in nodes]
        self.idx = {nm: i for i, nm in enumerate(self.names)}
        self.joints = [i for i, nm in enumerate(self.names) if nm and nm.startswith("mixamorig:")]
        # parents first
        order = []; seen = set()
        def visit(i):
            if i in seen: return
            if self.par[i] in self.joints: visit(self.par[i])
            seen.add(i); order.append(i)
        for i in self.joints: visit(i)
        self.order = order
        self.q_rest = {i: np.array(nodes[i].get("rotation", [0, 0, 0, 1]), dtype=float) for i in range(n)}
        self.t_rest = {i: np.array(nodes[i].get("translation", [0, 0, 0]), dtype=float) for i in range(n)}
        # static (non-joint) ancestors of the hips: the Armature
        h = self.idx[HIPS]; chain = []; p = self.par[h]
        while p != -1: chain.append(p); p = self.par[p]
        R = np.eye(3); P = np.zeros(3)
        for a in reversed(chain):
            P = P + R @ self.t_rest[a]; R = R @ Rot.from_quat(self.q_rest[a]).as_matrix()
        self.Rarm, self.Parm = R, P
        # rest world
        self.Rw = {}; self.Pw = {}
        for i in order:
            pr = self.par[i]
            Rp, Pp = (self.Rw[pr], self.Pw[pr]) if pr in self.Rw else (self.Rarm, self.Parm)
            self.Rw[i] = Rp @ Rot.from_quat(self.q_rest[i]).as_matrix()
            self.Pw[i] = Pp + Rp @ self.t_rest[i]
        self.hip_h = self.Pw[h][1]
        self.feet = [self.idx[f] for f in FEET if f in self.idx]
        self.foot_rest = min(self.Pw[f][1] for f in self.feet)


def qcont(q):
    q = q.copy()
    d = (q[1:] * q[:-1]).sum(1)
    s = np.cumprod(np.where(d < 0, -1.0, 1.0))
    q[1:] *= s[:, None]
    return q


def resample(t_src, v, t_new, is_rot):
    if len(t_src) == len(t_new) and np.allclose(t_src, t_new): return v
    if is_rot: v = qcont(v)
    out = np.stack([np.interp(t_new, t_src, v[:, k]) for k in range(v.shape[1])], 1)
    if is_rot: out /= np.linalg.norm(out, axis=1, keepdims=True)
    return out


def read_clips(js, binb, S):
    """every animation of a GLB -> dict(name, times (uniform 24 fps), rot {joint name: (N,4)}, hips (N,3))"""
    res = []
    for a in js.get("animations", []):
        raw = {}
        tmax = 0
        for ch in a["channels"]:
            s = a["samplers"][ch["sampler"]]; tt = read_acc(js, binb, s["input"])[:, 0]; vv = read_acc(js, binb, s["output"])
            nm = S.names[ch["target"]["node"]]; raw[(nm, ch["target"]["path"])] = (tt, vv); tmax = max(tmax, tt[-1])
        N = int(round(tmax * FPS)) + 1
        times = np.arange(N) / FPS
        rot = {}
        for (nm, p), (tt, vv) in raw.items():
            if p == "rotation" and nm and nm.startswith("mixamorig:"): rot[nm] = resample(tt, vv, times, True)
        if (HIPS, "translation") in raw:
            tt, vv = raw[(HIPS, "translation")]; hips = resample(tt, vv, times, False)
        else:
            hips = np.tile(S.t_rest[S.idx[HIPS]], (N, 1))
        res.append(dict(name=a.get("name", ""), times=times, rot=rot, hips=hips))
    return res


def activity(c):
    Q = np.stack([qcont(q) for q in c["rot"].values()], 1)
    d = np.abs((Q[1:] * Q[:-1]).sum(2)).clip(0, 1)
    act = np.degrees(2 * np.arccos(d)).sum(1)
    thr = max(0.4, 0.05 * act.max()); ii = np.where(act > thr)[0]
    return (float(ii.min() / FPS), float((ii.max() + 1) / FPS)) if len(ii) else (0.0, 0.0), float(act.mean())


# ------------------------------------------------------------------ retarget
def retarget(S, D, c, mode, loop, close=0.35):
    N = len(c["times"]); h = S.idx[HIPS]
    # --- source world rotations over time
    Rs = {}
    for j in S.order:
        nm = S.names[j]
        q = c["rot"].get(nm); Rl = Rot.from_quat(q if q is not None else np.tile(S.q_rest[j], (N, 1))).as_matrix()
        pr = S.par[j]; Rp = Rs[pr] if pr in Rs else S.Rarm
        Rs[j] = Rp @ Rl
    # --- source hips world position + root mode (on world XZ of the Armature frame)
    ps = S.Parm + c["hips"] @ S.Rarm.T
    ps0 = S.Pw[h]
    xz = ps[:, [0, 2]].copy(); xz0 = ps0[[0, 2]]
    if mode == "lock":
        xz[:] = xz0
    elif mode == "loop":
        ramp = np.linspace(0, 1, N)[:, None]
        xz = xz - (xz[-1] - xz[0]) * ramp
        xz = xz - xz.mean(0) + xz0
    ps[:, 0] = xz[:, 0]; ps[:, 2] = xz[:, 1]
    # --- destination world rotations and local rotations
    Rd = {}; loc = {}
    for j in D.order:
        nm = D.names[j]; sj = S.idx.get(nm)
        if sj is not None and sj in Rs:
            Rd[j] = (Rs[sj] @ S.Rw[sj].T) @ D.Rw[j]
        else:
            pr = D.par[j]; Rp = Rd[pr] if pr in Rd else D.Rarm
            Rd[j] = np.broadcast_to(Rp @ Rot.from_quat(D.q_rest[j]).as_matrix(), (N, 3, 3)) if Rp.ndim == 2 else Rp @ Rot.from_quat(D.q_rest[j]).as_matrix()
    for j in D.order:
        pr = D.par[j]; Rp = Rd[pr] if pr in Rd else D.Rarm
        L = np.swapaxes(Rp, -1, -2) @ Rd[j] if Rp.ndim == 3 else Rp.T @ Rd[j]
        loc[D.names[j]] = Rot.from_matrix(L).as_quat()
    # --- hips translation: scaled by the hip-height ratio, then the ground fit
    s = D.hip_h / S.hip_h
    pd = D.Pw[D.idx[HIPS]][None] + s * (ps - ps0[None])
    Pd = {}
    for j in D.order:
        pr = D.par[j]
        if j == D.idx[HIPS]: Pd[j] = pd
        else:
            Rp = Rd[pr]; Pd[j] = Pd[pr] + (Rp @ D.t_rest[j][:, None])[..., 0] if Rp.ndim == 3 else Pd[pr] + Rp @ D.t_rest[j]
    Ps = {}
    for j in S.order:
        pr = S.par[j]
        if j == h: Ps[j] = ps
        else: Ps[j] = Ps[pr] + (Rs[pr] @ S.t_rest[j][:, None])[..., 0]
    fs = np.min([Ps[S.idx[n]][:, 1] for n in FEET], 0); fd = np.min([Pd[D.idx[n]][:, 1] for n in FEET], 0)
    dy = s * (fs - S.foot_rest) - (fd - D.foot_rest)
    dy = np.clip(dy, -0.12 * D.hip_h, 0.12 * D.hip_h)
    pd[:, 1] += dy
    hips_local = (pd - D.Parm) @ D.Rarm      # Rarm^T applied to row vectors
    rot = {nm: qcont(q) for nm, q in loc.items()}
    out = dict(name=c["name"], times=c["times"].copy(), rot=rot, hips=hips_local)
    if loop and N > 12:
        Nc = int(round(close * FPS))
        for nm, q in out["rot"].items():
            q0 = q[0]
            for i in range(N - Nc, N):
                w = (i - (N - Nc) + 1) / (Nc + 1); w = w * w * (3 - 2 * w)
                q1 = q[i] if np.dot(q[i], q0) >= 0 else -q[i]
                m = q1 * (1 - w) + q0 * w; q[i] = m / np.linalg.norm(m)
        for i in range(N - Nc, N):
            w = (i - (N - Nc) + 1) / (Nc + 1); w = w * w * (3 - 2 * w)
            out["hips"][i] = out["hips"][i] * (1 - w) + out["hips"][0] * w
    return out


def seam(c):
    q0 = np.stack([q[0] for q in c["rot"].values()]); q1 = np.stack([q[-1] for q in c["rot"].values()])
    return float(np.degrees(2 * np.arccos(np.abs((q0 * q1).sum(1)).clip(0, 1))).mean())


# ------------------------------------------------------------------ commands
def cmd_lib(src, out_glb, out_json):
    js, binb = load_glb(src); S = Skel(js); clips = read_clips(js, binb, S)
    nodes_empty = copy.deepcopy(js)
    for nd in nodes_empty["nodes"]:
        nd.pop("mesh", None); nd.pop("skin", None)
    for k in ("meshes", "skins", "materials", "textures", "images", "samplers"):
        nodes_empty.pop(k, None)
    nodes_empty["accessors"] = []; nodes_empty["bufferViews"] = []
    _j0, _b0 = compact_and_add(nodes_empty, b"", []); base_kb = (len(json.dumps(_j0, separators=(',', ':'))) + len(_b0)) / 1024
    outc = []; man = []
    for (i, name, mode, loop, verdict, note) in CLIPS:
        c = clips[i]; (a, b), mean = activity(c)
        row = dict(src_index=i, src_prompt=c["name"], name=name, mode=mode, loop=loop, verdict=verdict, note=note,
                   duration=round(float(c["times"][-1]), 2), active=[round(a, 2), round(b, 2)], mean_deg_per_frame=round(mean, 1))
        if name is None or verdict == "reject":
            man.append(row); continue
        r = retarget(S, S, c, mode, loop); r["name"] = name
        row["seam_deg"] = round(seam(r), 2)
        _j, _b = compact_and_add(nodes_empty, b"", [r]); row["kb"] = round((len(json.dumps(_j, separators=(',', ':'))) + len(_b)) / 1024 - base_kb, 1)
        outc.append(r); man.append(row)
    nodes_only = copy.deepcopy(js)
    for nd in nodes_only["nodes"]:
        nd.pop("mesh", None); nd.pop("skin", None)
    for k in ("meshes", "skins", "materials", "textures", "images", "samplers"):
        nodes_only.pop(k, None)
    nodes_only["accessors"] = []; nodes_only["bufferViews"] = []
    js2, b2 = compact_and_add(nodes_only, b"", outc)
    write_glb(out_glb, js2, b2)
    json.dump(dict(rig="Tripo Studio mixamo, 65 joints (mixamorig:*)", fps=FPS, source=src.split("/")[-1], clips=man), open(out_json, "w"), indent=1)
    print("library:", len(outc), "clips,", len(b2), "bytes ->", out_glb)


GAME_NAMES = {"mixamorig:Hips": "Pelvis", "mixamorig:Spine1": "Spine01", "mixamorig:Spine2": "Spine02", "mixamorig:Head": "Head",
              "mixamorig:LeftShoulder": "L_Clavicle", "mixamorig:RightShoulder": "R_Clavicle", "mixamorig:LeftArm": "L_Upperarm", "mixamorig:RightArm": "R_Upperarm",
              "mixamorig:LeftForeArm": "L_Forearm", "mixamorig:RightForeArm": "R_Forearm", "mixamorig:LeftHand": "L_Hand", "mixamorig:RightHand": "R_Hand",
              "mixamorig:LeftUpLeg": "L_Thigh", "mixamorig:RightUpLeg": "R_Thigh", "mixamorig:LeftLeg": "L_Calf", "mixamorig:RightLeg": "R_Calf",
              "mixamorig:LeftFoot": "L_Foot", "mixamorig:RightFoot": "R_Foot", "mixamorig:LeftToeBase": "L_ToeBase", "mixamorig:RightToeBase": "R_ToeBase"}


def cmd_apply(lib, dest, out, own_only=False, game_names=False, only=None):
    jl, bl = load_glb(lib); L = Skel(jl); lc = {c["name"]: c for c in read_clips(jl, bl, L)}
    jd, bd = load_glb(dest); D = Skel(jd)
    assert set(L.names[j] for j in L.joints) == set(D.names[j] for j in D.joints), "different joint names: not a Studio mixamo rig"
    outc = []; have = set()
    # the model's own presets first (identity retarget: root motion removed, loop closed)
    for c in read_clips(jd, bd, D):
        key = c["name"].strip().lower()
        if key in OWN:
            name, mode, loop = OWN[key]
            if name in have: continue
            r = retarget(D, D, c, mode, loop); r["name"] = name; outc.append(r); have.add(name)
    if not own_only:
        for (i, name, mode, loop, verdict, note) in CLIPS:
            if name is None or name in have or name not in lc: continue
            if only is not None and name not in only: continue
            r = retarget(L, D, lc[name], "keep", False)   # the library clips already carry their root mode and loop closing
            r["name"] = name; outc.append(r); have.add(name)
    js2, b2 = compact_and_add(jd, bd, outc)
    if game_names:   # NOT proven in the game: only the bone names carry.js / rpg.js look up (Pelvis, Spine02, L_Hand, R_Hand, Head) + the usual limb names
        for nd in js2["nodes"]:
            if nd.get("name") in GAME_NAMES: nd["name"] = GAME_NAMES[nd["name"]]
    write_glb(out, js2, b2)
    print("hero:", len(outc), "clips,", len(b2), "bytes ->", out, "| own:", sorted(have & {v[0] for v in OWN.values()}))


def cmd_check(a, b):
    """pose error: for the clips both files share by name, compare joint positions relative to the hips, normalised by hip height."""
    ja, ba = load_glb(a); A = Skel(ja); jb, bb = load_glb(b); B = Skel(jb)
    ca = {c["name"]: c for c in read_clips(ja, ba, A)}; cb = {c["name"]: c for c in read_clips(jb, bb, B)}
    pick = ["mixamorig:Head", "mixamorig:LeftHand", "mixamorig:RightHand", "mixamorig:LeftFoot", "mixamorig:RightFoot", "mixamorig:LeftLeg", "mixamorig:RightLeg"]

    def pos(S, c):
        N = len(c["times"]); Rw = {}; Pw = {}; h = S.idx[HIPS]
        ps = S.Parm + c["hips"] @ S.Rarm.T
        for j in S.order:
            q = c["rot"].get(S.names[j]); Rl = Rot.from_quat(q if q is not None else np.tile(S.q_rest[j], (N, 1))).as_matrix()
            pr = S.par[j]; Rp = Rw[pr] if pr in Rw else S.Rarm
            Rw[j] = Rp @ Rl
            Pw[j] = ps if j == h else Pw[pr] + (Rw[pr] @ S.t_rest[j][:, None])[..., 0]
        return {n: Pw[S.idx[n]] - Pw[h] for n in pick}
    rows = []
    for n in ca:
        if n not in cb: continue
        pa = pos(A, ca[n]); pb = pos(B, cb[n]); m = min(len(ca[n]["times"]), len(cb[n]["times"]))
        e = np.mean([np.linalg.norm(pa[k][:m] / A.hip_h - pb[k][:m] / B.hip_h, axis=1).mean() for k in pick]) * 100
        rows.append((n, e))
    for n, e in rows: print("%-22s %.2f%%" % (n, e))
    print("mean %.2f%%  max %.2f%%" % (np.mean([e for _, e in rows]), max(e for _, e in rows)))


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(1)
    if a[0] == "lib": cmd_lib(a[1], a[2], a[3])
    elif a[0] == "apply":
        only = None
        for x in a:
            if x.startswith("--only="): only = set(x[7:].split(","))
        cmd_apply(a[1], a[2], a[3], "--own-walk-only" in a, "--game-names" in a, only)
    elif a[0] == "check": cmd_check(a[1], a[2])
    else: print(__doc__)
