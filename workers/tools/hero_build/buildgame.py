"""Build the game copy of a Tripo hero GLB.
usage: python3 buildgame.py in.glb out.glb spec.json
spec.json = {"clips": [{"src": "walk", "name": "walk", "mode": "loop|detrend|lock|keep", "loop": true}, ...],
             "face_plus_z": true, "rot_tol_deg": 0.15, "pos_tol": 0.0005}
modes (horizontal root motion of the Hip, world XZ; Y is always kept):
  loop    linear drift removed + recentred on the bind position (walk / run / idle)
  detrend linear drift removed (clip ends where it started), not recentred
  lock    XZ locked to the bind position (dodge / landing: the game moves the body)
  keep    nothing touched (death / knock-down: the body ends where it fell)
(mother, 15 Oct 2026: rebuilt verbatim from claude/RP0A_tools.md + the max_tex patch of RP0A_tools2.md)
"""
import sys, json, copy, struct
import numpy as np
from pose import *

def qnorm(q): return q / np.linalg.norm(q, axis=-1, keepdims=True)

def cont(q):
    q = q.copy()
    for i in range(1, len(q)):
        if np.dot(q[i], q[i-1]) < 0: q[i] = -q[i]
    return q

def reduce_keys(t, v, tol, is_rot):
    n = len(t)
    if n <= 2: return np.arange(n)
    keep = {0, n - 1}; stack = [(0, n - 1)]
    while stack:
        a, b = stack.pop()
        if b - a < 2: continue
        idx = np.arange(a + 1, b)
        f = ((t[idx] - t[a]) / (t[b] - t[a]))[:, None]
        if is_rot:
            d = float(np.dot(v[a], v[b]))
            q1 = v[b] if d >= 0 else -v[b]
            est = qnorm(v[a][None] * (1 - f) + q1[None] * f)
            err = 2 * np.arccos(np.clip(np.abs((est * v[idx]).sum(1)), 0, 1))
        else:
            est = v[a][None] * (1 - f) + v[b][None] * f
            err = np.linalg.norm(est - v[idx], axis=1)
        k = int(err.argmax())
        if err[k] > tol:
            m = int(idx[k]); keep.add(m); stack.append((a, m)); stack.append((m, b))
    return np.array(sorted(keep))

def main(src, dst, spec):
    m = Model(src); js = copy.deepcopy(m.js); b = m.b
    nodes = js["nodes"]
    names = {n.get("name"): i for i, n in enumerate(nodes)}
    HIP, BR, ARM = names["Hip"], names["BoneRoot"], names["Armature"]
    rtol = np.deg2rad(spec.get("rot_tol_deg", 0.15)); ptol = spec.get("pos_tol", 0.0005)
    bind = world_positions(js)
    bind_hip = bind[HIP][:3, 3].copy()

    S = Model(spec["borrow_from"]) if spec.get("borrow_from") else None
    def qmul_(a, b):
        ax, ay, az, aw = a; bx, by, bz, bw = b
        return np.array([aw*bx + ax*bw + ay*bz - az*by, aw*by - ax*bz + ay*bw + az*bx, aw*bz + ax*by - ay*bx + az*bw, aw*bw - ax*bx - ay*by - az*bz])
    def qinv_(q): return np.array([-q[0], -q[1], -q[2], q[3]]) / np.dot(q, q)
    def R3_(M4):
        R = M4[:3, :3].copy()
        for i in range(3): R[:, i] /= np.linalg.norm(R[:, i])
        return R
    def qfromR_(R):
        t = np.trace(R)
        if t > 0:
            s_ = np.sqrt(t + 1) * 2; q = [(R[2, 1] - R[1, 2]) / s_, (R[0, 2] - R[2, 0]) / s_, (R[1, 0] - R[0, 1]) / s_, 0.25 * s_]
        elif R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]:
            s_ = np.sqrt(1 + R[0, 0] - R[1, 1] - R[2, 2]) * 2; q = [0.25 * s_, (R[0, 1] + R[1, 0]) / s_, (R[0, 2] + R[2, 0]) / s_, (R[2, 1] - R[1, 2]) / s_]
        elif R[1, 1] > R[2, 2]:
            s_ = np.sqrt(1 + R[1, 1] - R[0, 0] - R[2, 2]) * 2; q = [(R[0, 1] + R[1, 0]) / s_, 0.25 * s_, (R[1, 2] + R[2, 1]) / s_, (R[0, 2] - R[2, 0]) / s_]
        else:
            s_ = np.sqrt(1 + R[2, 2] - R[0, 0] - R[1, 1]) * 2; q = [(R[0, 2] + R[2, 0]) / s_, (R[1, 2] + R[2, 1]) / s_, 0.25 * s_, (R[1, 0] - R[0, 1]) / s_]
        q = np.array(q); return q / np.linalg.norm(q)
    topo = []
    def _visit(i):
        topo.append(i)
        for c_ in nodes[i].get("children", []): _visit(c_)
    for r_ in [i for i in range(len(nodes)) if i not in m.par]: _visit(r_)
    def borrow(src_name, damp=None):
        """clip of another Tripo rig (same bone names): rest-relative rotation delta, hip travel in world space scaled by hip height"""
        chS = S.sample(src_name); sN = {n.get("name"): i for i, n in enumerate(S.nodes)}
        sHIP, sBR = sN["Hip"], sN["BoneRoot"]
        sbind = world_positions(S.js); sb = sbind[sHIP][:3, 3]
        scale = bind_hip[1] / sb[1]
        out = {}
        for (ni, p), (t, v) in chS.items():
            name = S.nodes[ni].get("name")
            if name not in names or name not in m.names: continue
            kn = names[name]
            if p == "rotation":
                continue                                    # done below, in world space
            elif p == "translation":
                out[(kn, p)] = (t, np.tile(rest(kn, "translation"), (len(t), 1)))
            else:
                out[(kn, p)] = (t, np.tile(rest(kn, "scale"), (len(t), 1)))
        t_h, Ts = chS[(sHIP, "translation")]
        # world-space delta retarget of every rotation: D = R_src(t) · R_src_rest⁻¹ ;  R_dst(t) = D · R_dst_rest
        restS = S.pose({}, 0); restM = m.pose({}, 0)
        common_ = {names[n]: sN[n] for n in names if n in sN and n in m.names}
        acc_q = {kn: [] for kn in common_}
        for tt in t_h:
            wS = S.pose(chS, tt); Wd = {}
            for i in topo:
                pi = m.par.get(i)
                if i in common_:
                    Rw = (R3_(wS[common_[i]]) @ R3_(restS[common_[i]]).T) @ R3_(restM[i])
                else:
                    Rw = (Wd[pi] if pi is not None else np.eye(3)) @ quat_to_R(np.array(nodes[i].get("rotation", [0, 0, 0, 1.0])))
                Wd[i] = Rw
                if i in common_: acc_q[i].append(qfromR_((Wd[pi].T if pi is not None else np.eye(3)) @ Rw))
        import re as _re
        for kn, qs in acc_q.items():
            q = np.array(qs)
            for j in range(1, len(q)):
                if np.dot(q[j], q[j - 1]) < 0: q[j] = -q[j]
            if damp:   # mother 15 Oct: long-gown bodies stretch on leg-heavy clips -> pull the local rotation of matching joints toward rest by factor f
                nm_ = nodes[kn].get("name", ""); f_ = None
                for pat_, fv_ in damp.items():
                    if _re.search(pat_, nm_): f_ = fv_; break
                if f_ is not None and f_ < 1.0:
                    rq = np.array(rest(kn, "rotation"), dtype=np.float64)
                    q = np.array([slerp(rq if np.dot(rq, qq) >= 0 else -rq, qq, f_) for qq in q])
            out[(kn, "rotation")] = (np.array(t_h), q)
        Wp = np.array([(S.pose(chS, tt)[sBR] @ np.r_[Ts[i], 1])[:3] for i, tt in enumerate(t_h)])
        Wk = bind_hip[None] + scale * (Wp - sb[None])
        Tk = np.array([(np.linalg.inv(m.pose(out, tt)[BR]) @ np.r_[Wk[i], 1])[:3] for i, tt in enumerate(t_h)])
        out[(HIP, "translation")] = (t_h, Tk)
        # keep ground contact: lowest vertex of this body = lowest vertex of the source body, frame by frame
        dy = np.array([float(S.skin(S.pose(chS, tt))[:, 1].min() - m.skin(m.pose(out, tt))[:, 1].min()) for tt in t_h])
        dy = np.clip(dy, -0.15, 0.15)
        Wk[:, 1] += dy
        out[(HIP, "translation")] = (t_h, np.array([(np.linalg.inv(m.pose(out, tt)[BR]) @ np.r_[Wk[i], 1])[:3] for i, tt in enumerate(t_h)]))
        return out

    def rest(i, path):
        n = nodes[i]
        return np.array(n.get(path, {"translation": [0, 0, 0], "rotation": [0, 0, 0, 1], "scale": [1, 1, 1]}[path]), dtype=np.float64)

    out_anims = []
    report = []
    pool = bytearray(); new_acc = []; new_bv_off = 0
    def add_acc(arr, typ, minmax=False):
        nonlocal pool
        while len(pool) % 4: pool += b"\0"
        off = len(pool); pool += np.ascontiguousarray(arr, dtype=np.float32).tobytes()
        a = {"bufferView": "ANIM", "byteOffset": off, "componentType": 5126, "count": int(len(arr)), "type": typ}
        if minmax: a["min"] = [float(arr.min())]; a["max"] = [float(arr.max())]
        new_acc.append(a); return ("A", len(new_acc) - 1)

    for c in spec["clips"]:
        ch = borrow(c["src"], c.get("damp")) if c.get("borrow") else m.sample(c["src"])
        if c.get("trim"):
            ta, tb = c["trim"]; ch2 = {}
            for key, (t, v) in ch.items():
                inner = (t > ta + 1e-6) & (t < tb - 1e-6)
                def at(x):
                    k = int(np.clip(np.searchsorted(t, x) - 1, 0, len(t) - 2)); f = 0 if t[k+1] == t[k] else (x - t[k]) / (t[k+1] - t[k])
                    if key[1] == "rotation": return slerp(v[k], v[k+1], f)
                    return v[k] * (1 - f) + v[k+1] * f
                nt = np.concatenate([[ta], t[inner], [tb]]) - ta
                nv = np.vstack([at(ta)[None], v[inner], at(tb)[None]])
                ch2[key] = (nt, nv)
            ch = ch2
        dur = max(v[0][-1] for v in ch.values())
        # --- horizontal root motion of the Hip, in WORLD space (BoneRoot rotates in many clips)
        mode = c.get("mode", "keep")
        t_h, T = ch[(HIP, "translation")]
        if mode != "keep":
            BRs = np.stack([m.pose(ch, t)[BR] for t in t_h])           # (N,4,4) BoneRoot world at each Hip key
            Wp = np.einsum("nij,nj->ni", BRs, np.c_[T, np.ones(len(T))])[:, :3]
            net = Wp[-1] - Wp[0]
            s_ = ((t_h - t_h[0]) / (t_h[-1] - t_h[0]))[:, None]
            W2 = Wp.copy()
            if mode in ("loop", "detrend"):
                W2[:, [0, 2]] = Wp[:, [0, 2]] - s_ * net[[0, 2]]
                if mode == "loop":
                    W2[:, [0, 2]] += bind_hip[[0, 2]] - W2[:, [0, 2]].mean(0)
            elif mode == "lock":
                W2[:, [0, 2]] = bind_hip[[0, 2]]
            T2 = np.einsum("nij,nj->ni", np.linalg.inv(BRs), np.c_[W2, np.ones(len(W2))])[:, :3]
            ch[(HIP, "translation")] = (t_h, T2)
        if c.get("rebase_y"):
            t_h, T = ch[(HIP, "translation")]
            BRs = np.stack([m.pose(ch, t)[BR] for t in t_h])
            Wp = np.einsum("nij,nj->ni", BRs, np.c_[T, np.ones(len(T))])[:, :3]
            W2 = Wp.copy(); W2[:, 1] -= (Wp[0, 1] - bind_hip[1])
            ch[(HIP, "translation")] = (t_h, np.einsum("nij,nj->ni", np.linalg.inv(BRs), np.c_[W2, np.ones(len(W2))])[:, :3])
        # --- loop seam: is the last key a copy of the first?
        seam = 0.0
        if c.get("loop"):
            for (n, p), (t, v) in ch.items():
                if p == "rotation": seam = max(seam, 2 * np.arccos(min(1, abs(float(np.dot(v[0], v[-1]))))))
        # --- build channels
        samplers = []; channels = []; nkeys = 0
        W_close = c.get("close", 0.0)
        for (n, p), (t, v) in ch.items():
            if W_close and c.get("loop"):
                # close the loop: blend the last W seconds into the first pose (end == start)
                u = np.clip((t - (t[-1] - W_close)) / W_close, 0, 1); u = (u * u * (3 - 2 * u))[:, None]
                if p == "rotation":
                    v = cont(qnorm(v.copy())); v0 = v[0]
                    v1 = np.where(((v * v0).sum(1) < 0)[:, None], -v0[None], v0[None])
                    v = qnorm(v * (1 - u) + v1 * u)
                else:
                    v = v * (1 - u) + v[0][None] * u
            r = rest(n, p)
            if p == "rotation":
                v = cont(qnorm(v.copy()))
                dev = 2 * np.arccos(np.clip(np.abs(v @ r), 0, 1)).max()
                if dev < 1e-4: continue
                if np.ptp(v, axis=0).max() < 1e-5:  # constant, not rest
                    t2, v2 = np.array([t[0], t[-1]]), v[[0, -1]]
                else:
                    ix = reduce_keys(t, v, rtol, True); t2, v2 = t[ix], v[ix]
            else:
                dev = np.abs(v - r).max()
                if dev < 1e-4 + (2e-4 if p == "scale" else 0): continue
                if np.ptp(v, axis=0).max() < 1e-5:
                    t2, v2 = np.array([t[0], t[-1]]), v[[0, -1]]
                else:
                    ix = reduce_keys(t, v, ptol, False); t2, v2 = t[ix], v[ix]
            nkeys += len(t2)
            si = len(samplers)
            samplers.append({"input": add_acc(t2.reshape(-1, 1), "SCALAR", True), "output": add_acc(v2, "VEC4" if p == "rotation" else "VEC3"), "interpolation": "LINEAR"})
            channels.append({"sampler": si, "target": {"node": n, "path": p}})
        out_anims.append({"name": c["name"], "samplers": samplers, "channels": channels})
        report.append((c["name"], c["src"], mode, dur, len(channels), nkeys, seam))

    # ---- turn the model to face +Z (baked into data: vertices, normals, inverse-bind matrices, root joints, root-joint keys)
    if spec.get("face_plus_z", True):
        RR = np.diag([-1.0, 1, -1, 1]); qR = np.array([0, 1.0, 0, 0])
        def qmul(a, b):
            ax, ay, az, aw = a.T; bx, by, bz, bw = b.T
            return np.stack([aw*bx + ax*bw + ay*bz - az*by, aw*by - ax*bz + ay*bw + az*bx, aw*bz + ax*by - ay*bx + az*bw, aw*bw - ax*bx - ay*by - az*bz], 1)
        def wr(ai, arr, minmax=False):
            a = js["accessors"][ai]; v = js["bufferViews"][a["bufferView"]]; assert "byteStride" not in v
            o = v.get("byteOffset", 0) + a.get("byteOffset", 0); data = np.ascontiguousarray(arr, dtype="<f4").tobytes()
            b[o:o + len(data)] = data
            if minmax: a["min"] = [float(x) for x in arr.min(0)]; a["max"] = [float(x) for x in arr.max(0)]
        at = js["meshes"][0]["primitives"][0]["attributes"]
        wr(at["POSITION"], acc(js, b, at["POSITION"]).astype(np.float64) * RR[[0, 1, 2], [0, 1, 2]], True)
        wr(at["NORMAL"], acc(js, b, at["NORMAL"]).astype(np.float64) * RR[[0, 1, 2], [0, 1, 2]])
        ia = js["skins"][0]["inverseBindMatrices"]
        ibm = acc(js, b, ia).astype(np.float64).reshape(-1, 4, 4).transpose(0, 2, 1)      # row-major math matrices
        wr(ia, np.einsum("kij,jl->kil", ibm, RR).transpose(0, 2, 1).reshape(-1, 16))
        for ni in [BR] + ([names["neutral_bone"]] if "neutral_bone" in names else []):
            n = nodes[ni]
            if "translation" in n: n["translation"] = [float(x) for x in np.array(n["translation"]) * RR[[0, 1, 2], [0, 1, 2]]]
            n["rotation"] = [float(x) for x in qmul(qR[None], np.array(n.get("rotation", [0, 0, 0, 1.0]))[None])[0]]
        # keys: the accessors for new_acc live in `pool`; patch them by re-building the pool entries of BoneRoot channels
        for a_ in out_anims:
            for ch_ in a_["channels"]:
                if ch_["target"]["node"] != BR: continue
                smp = a_["samplers"][ch_["sampler"]]; ref = smp["output"][1]; acc_ = new_acc[ref]
                cnt = acc_["count"]; off = acc_["byteOffset"]
                if ch_["target"]["path"] == "rotation":
                    q = np.frombuffer(bytes(pool[off:off + cnt * 16]), dtype="<f4").reshape(cnt, 4).astype(np.float64)
                    q = qmul(np.repeat(qR[None], cnt, 0), q)
                    pool[off:off + cnt * 16] = np.ascontiguousarray(q, dtype="<f4").tobytes()
                elif ch_["target"]["path"] == "translation":
                    tv = np.frombuffer(bytes(pool[off:off + cnt * 12]), dtype="<f4").reshape(cnt, 3).astype(np.float64) * RR[[0, 1, 2], [0, 1, 2]]
                    pool[off:off + cnt * 12] = np.ascontiguousarray(tv, dtype="<f4").tobytes()
    # ---- assemble the new file
    old_anim_acc = set()
    for a in js["animations"]:
        for s in a["samplers"]: old_anim_acc.add(s["input"]); old_anim_acc.add(s["output"])
    keep_acc = [i for i in range(len(js["accessors"])) if i not in old_anim_acc]
    amap = {o: k for k, o in enumerate(keep_acc)}
    used_bv = sorted({js["accessors"][i]["bufferView"] for i in keep_acc} | {im["bufferView"] for im in js.get("images", []) if "bufferView" in im})
    bvmap = {o: k for k, o in enumerate(used_bv)}
    out = bytearray(); new_bvs = []
    for o in used_bv:
        bv = js["bufferViews"][o]; data = bytes(b[bv.get("byteOffset", 0): bv.get("byteOffset", 0) + bv["byteLength"]])
        if (spec.get("jpeg_quality") or spec.get("max_tex")) and o in {im["bufferView"] for im in js.get("images", []) if "bufferView" in im}:
            import io
            from PIL import Image
            im_ = Image.open(io.BytesIO(data)).convert("RGB")
            if spec.get("max_tex") and max(im_.size) > spec["max_tex"]:
                im_ = im_.resize((spec["max_tex"], spec["max_tex"]) if im_.size[0] == im_.size[1] else (int(im_.size[0]*spec["max_tex"]/max(im_.size)), int(im_.size[1]*spec["max_tex"]/max(im_.size))), Image.LANCZOS)
            buf = io.BytesIO(); im_.save(buf, "JPEG", quality=spec.get("jpeg_quality", 88), optimize=True, subsampling="4:2:0"); data = buf.getvalue()
        while len(out) % 4: out.append(0)
        nb = {k: v for k, v in bv.items() if k not in ("byteOffset", "byteLength")}
        nb["buffer"] = 0; nb["byteOffset"] = len(out); nb["byteLength"] = len(data); new_bvs.append(nb); out += data
    while len(out) % 4: out.append(0)
    anim_bv = len(new_bvs)
    new_bvs.append({"buffer": 0, "byteOffset": len(out), "byteLength": len(pool)}); out += pool
    while len(out) % 4: out.append(0)
    accs = []
    for i in keep_acc:
        a = dict(js["accessors"][i]); a["bufferView"] = bvmap[a["bufferView"]]; accs.append(a)
    base = len(accs)
    for a in new_acc:
        a = dict(a); a["bufferView"] = anim_bv; accs.append(a)
    def fix(ref): return base + ref[1]
    for a in out_anims:
        for s in a["samplers"]: s["input"] = fix(s["input"]); s["output"] = fix(s["output"])
    js["animations"] = out_anims
    js["accessors"] = accs; js["bufferViews"] = new_bvs
    js["buffers"] = [{"byteLength": len(out)}]
    for mesh in js["meshes"]:
        for pr in mesh["primitives"]:
            pr["attributes"] = {k: amap[v] for k, v in pr["attributes"].items()}
            if "indices" in pr: pr["indices"] = amap[pr["indices"]]
    for sk in js["skins"]:
        if "inverseBindMatrices" in sk: sk["inverseBindMatrices"] = amap[sk["inverseBindMatrices"]]
    for im in js.get("images", []):
        if "bufferView" in im: im["bufferView"] = bvmap[im["bufferView"]]
    js["asset"] = {"version": "2.0", "generator": "bluewall RP0A game copy (Tripo source)"}
    j = json.dumps(js, separators=(",", ":")).encode(); j += b" " * (-len(j) % 4)
    body = struct.pack("<II", len(j), 0x4E4F534A) + j + struct.pack("<II", len(out), 0x004E4942) + bytes(out)
    open(dst, "wb").write(b"glTF" + struct.pack("<II", 2, 12 + len(body)) + body)
    print("wrote", dst, 12 + len(body), "bytes; anim data", len(pool), "bytes")
    print(f"{'clip':16s} {'src':16s} {'mode':8s} {'dur':>6s} {'chan':>5s} {'keys':>6s} {'seam°':>6s}")
    for r in report: print(f"{r[0]:16s} {r[1]:16s} {r[2]:8s} {r[3]:6.2f} {r[4]:5d} {r[5]:6d} {np.degrees(r[6]):6.2f}")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], json.load(open(sys.argv[3])))
