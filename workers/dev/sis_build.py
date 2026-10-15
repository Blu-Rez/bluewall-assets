#!/usr/bin/env python3
"""sis_build.py (Mother 2, 16 Oct 2026) — put the game's own 33 hero clips on a Tripo Studio «mixamo» model (65 joints) and give it the game's bone names.

  python3 sis_build.py SRC_HERO.glb  NEW_MODEL.glb  OUT.glb      SRC = a current game hero (Tripo-native rig, 33 clips), NEW = Studio-rigged model

Method = the RP0A / TP1 one: world-space rotation delta  D = R_src(t) R_src_rest^-1 ,  R_dst(t) = D R_dst_rest ; hip translation scaled by the hip-height ratio ;
the lowest foot keeps its (scaled) height.  New here: the source is the game rig (BoneRoot > Hip > Pelvis / Waist ...), so the whole forward kinematics is general (no «hips are the root» shortcut).
Then the destination joints are renamed to the game's names (Hip, Waist, Spine01, Spine02, Head, L_Hand ... ) and a `Pelvis` joint (identity child of `Hip`) is added (carry.js mounts on it).
"""
import sys, json, copy, math, struct, os
sys.path.insert(0, os.environ.get('TP1_DIR', '/home/claude/inbox/TP1'))   # the folder with TP1_clips.py (branch inbox/TP1)
import numpy as np
import TP1_clips as T
from scipy.spatial.transform import Rotation as Rot

FPS = 30.0
# game (Tripo-native) joint -> Studio mixamo joint: the bones that CARRY motion across
SRC2MIX = {'Hip': 'mixamorig:Hips', 'Waist': 'mixamorig:Spine', 'Spine01': 'mixamorig:Spine1', 'Spine02': 'mixamorig:Spine2', 'NeckTwist01': 'mixamorig:Neck', 'Head': 'mixamorig:Head'}
for s, m in (('L', 'Left'), ('R', 'Right')):
    SRC2MIX.update({s + '_Clavicle': 'mixamorig:%sShoulder' % m, s + '_Upperarm': 'mixamorig:%sArm' % m, s + '_Forearm': 'mixamorig:%sForeArm' % m, s + '_Hand': 'mixamorig:%sHand' % m,
                    s + '_Thigh': 'mixamorig:%sUpLeg' % m, s + '_Calf': 'mixamorig:%sLeg' % m, s + '_Foot': 'mixamorig:%sFoot' % m, s + '_ToeBase': 'mixamorig:%sToeBase' % m})
    for g, mx in (('Index', 'Index'), ('Mid', 'Middle'), ('Ring', 'Ring'), ('Pinky', 'Pinky'), ('Thumb', 'Thumb')):
        for k in (1, 2, 3): SRC2MIX['%s_%s%d' % (s, g, k)] = 'mixamorig:%sHand%s%d' % (m, mx, k)
MIX2GAME = {v: k for k, v in SRC2MIX.items() if k != 'NeckTwist01'}      # the game has no «Neck» joint: ours keeps its mixamo name «Neck»
MIX2GAME['mixamorig:Neck'] = 'Neck'
MIX2GAME['mixamorig:Hips'] = 'Hip'
# the game mounts quivers / blades on `Spine02` (native y 0.68 m, the mixamo chest `Spine1` is at 0.71, `Spine2` at 0.77): the NAME goes to the bone at the same height (the retarget pairs above are unchanged)
MIX2GAME['mixamorig:Spine'] = 'Spine01'; MIX2GAME['mixamorig:Spine1'] = 'Spine02'; MIX2GAME['mixamorig:Spine2'] = 'Spine03'
# every other mixamo joint: strip the prefix, keep unique
FEET_S = ['L_Foot', 'R_Foot', 'L_ToeBase', 'R_ToeBase']
FEET_D = ['mixamorig:LeftFoot', 'mixamorig:RightFoot', 'mixamorig:LeftToeBase', 'mixamorig:RightToeBase']


class G:
    """a general skeleton: every joint of skin 0, any hierarchy"""
    def __init__(self, js):
        nodes = js['nodes']; n = len(nodes); self.js = js
        self.par = [-1] * n
        for i, nd in enumerate(nodes):
            for c in nd.get('children', []): self.par[c] = i
        self.names = [nd.get('name') for nd in nodes]; self.idx = {nm: i for i, nm in enumerate(self.names)}
        self.joints = list(js['skins'][0]['joints']); jset = set(self.joints)
        order = []; seen = set()
        def visit(i):
            if i in seen: return
            if self.par[i] in jset: visit(self.par[i])
            seen.add(i); order.append(i)
        for i in self.joints: visit(i)
        self.order = order
        self.q = {i: np.array(nodes[i].get('rotation', [0, 0, 0, 1]), float) for i in range(n)}
        self.t = {i: np.array(nodes[i].get('translation', [0, 0, 0]), float) for i in range(n)}
        self.Rl = {i: Rot.from_quat(self.q[i]).as_matrix() for i in range(n)}
        self.baseR = {}; self.baseP = {}
        for j in order:
            if self.par[j] in jset: continue
            chain = []; p = self.par[j]
            while p != -1: chain.append(p); p = self.par[p]
            R = np.eye(3); P = np.zeros(3)
            for a in reversed(chain): P = P + R @ self.t[a]; R = R @ self.Rl[a]
            self.baseR[j] = R; self.baseP[j] = P
        Rs, Ps = self.fk({}, {}, 1)
        self.Rw = {j: Rs[j][0] for j in order}; self.Pw = {j: Ps[j][0] for j in order}

    def fk(self, rot, trans, N):
        Rs = {}; Ps = {}
        for j in self.order:
            q = rot.get(j); Rl = Rot.from_quat(q).as_matrix() if q is not None else np.broadcast_to(self.Rl[j], (N, 3, 3))
            tl = trans.get(j); tl = tl if tl is not None else np.broadcast_to(self.t[j], (N, 3))
            pr = self.par[j]
            if pr in Rs: Rp, Pp = Rs[pr], Ps[pr]
            else: Rp = np.broadcast_to(self.baseR[j], (N, 3, 3)); Pp = np.broadcast_to(self.baseP[j], (N, 3))
            Rs[j] = Rp @ Rl; Ps[j] = Pp + (Rp @ tl[..., None])[..., 0]
        return Rs, Ps


def read_game_clips(js, binb, S):
    """every animation -> dict(name, times (N,), rot {joint idx: (N,4)}, trans {joint idx: (N,3)}) on a uniform grid (exact duration)"""
    out = []
    for a in js['animations']:
        raw = {}; tmax = 0
        for ch in a['channels']:
            s = a['samplers'][ch['sampler']]; tt = T.read_acc(js, binb, s['input'])[:, 0]; vv = T.read_acc(js, binb, s['output'])
            raw[(ch['target']['node'], ch['target']['path'])] = (tt, vv); tmax = max(tmax, tt[-1])
        N = max(2, int(round(tmax * FPS)) + 1); times = np.linspace(0, tmax, N)
        rot = {}; trans = {}
        for (nd, p), (tt, vv) in raw.items():
            if nd not in S.order: continue
            if p == 'rotation': rot[nd] = T.resample(tt, vv, times, True)
            elif p == 'translation': trans[nd] = T.resample(tt, vv, times, False)
        out.append(dict(name=a['name'], times=times, rot=rot, trans=trans))
    return out


def retarget(S, D, c, dest2src):
    N = len(c['times'])
    Rs, Ps = S.fk(c['rot'], c['trans'], N)
    hs = S.idx['Hip']; hd = D.idx['mixamorig:Hips']
    Rd = {}; loc = {}
    for j in D.order:
        sn = dest2src.get(D.names[j]); sj = S.idx.get(sn) if sn else None
        if sj is not None: Rd[j] = (Rs[sj] @ S.Rw[sj].T) @ D.Rw[j]
        else:
            pr = D.par[j]; Rp = Rd[pr] if pr in Rd else np.broadcast_to(D.baseR[j], (N, 3, 3))
            Rd[j] = Rp @ D.Rl[j]
    for j in D.order:
        pr = D.par[j]; Rp = Rd[pr] if pr in Rd else np.broadcast_to(D.baseR[j], (N, 3, 3))
        loc[j] = T.qcont(Rot.from_matrix(np.swapaxes(Rp, -1, -2) @ Rd[j]).as_quat())
    s = D.Pw[hd][1] / S.Pw[hs][1]
    pd = D.Pw[hd][None] + s * (Ps[hs] - S.Pw[hs][None])
    Pd = {}
    for j in D.order:
        pr = D.par[j]
        if j == hd: Pd[j] = pd
        else: Pd[j] = Pd[pr] + (Rd[pr] @ D.t[j][:, None])[..., 0]
    fs = np.min([Ps[S.idx[n]][:, 1] for n in FEET_S], 0); fd = np.min([Pd[D.idx[n]][:, 1] for n in FEET_D], 0)
    frs = min(S.Pw[S.idx[n]][1] for n in FEET_S); frd = min(D.Pw[D.idx[n]][1] for n in FEET_D)
    dy = s * (fs - frs) - (fd - frd)
    dy = np.clip(dy, -0.12 * D.Pw[hd][1], 0.12 * D.Pw[hd][1]); pd[:, 1] += dy
    hips_local = (pd - D.baseP[hd]) @ D.baseR[hd]
    rot = {}
    for j in D.order:
        q = loc[j]; q0 = D.q[j]
        ang = np.degrees(2 * np.arccos(np.clip(np.abs(q @ q0), 0, 1)))
        if ang.max() > 0.03: rot[D.names[j]] = q
    return dict(name=c['name'], times=c['times'].copy(), rot=rot, hips=hips_local)


def add_pelvis(js, binb):
    """a `Pelvis` joint: identity child of Hip (carry.js mounts belts / scabbards on it)"""
    js = copy.deepcopy(js); nodes = js['nodes']; sk = js['skins'][0]
    hip = next(i for i, n in enumerate(nodes) if n.get('name') == 'Hip')
    nodes.append({'name': 'Pelvis'}); pi = len(nodes) - 1
    nodes[hip].setdefault('children', []).append(pi); sk['joints'].append(pi)
    a = js['accessors'][sk['inverseBindMatrices']]; bv = js['bufferViews'][a['bufferView']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    ibm = np.frombuffer(binb, dtype='<f4', count=a['count'] * 16, offset=off).reshape(a['count'], 16)
    hj = sk['joints'].index(hip)
    new = np.vstack([ibm, ibm[hj][None]]).astype('<f4')
    out = bytearray(binb)
    while len(out) % 4: out += b'\0'
    js['bufferViews'].append({'buffer': 0, 'byteOffset': len(out), 'byteLength': new.nbytes}); out += new.tobytes()
    js['accessors'].append({'bufferView': len(js['bufferViews']) - 1, 'componentType': 5126, 'count': int(new.shape[0]), 'type': 'MAT4'})
    sk['inverseBindMatrices'] = len(js['accessors']) - 1
    return js, bytes(out)


def main(src, dst, out, only=None):
    jsS, bS = T.load_glb(src); S = G(jsS)
    jsD, bD = T.load_glb(dst); D = G(jsD)
    dest2src = {v: k for k, v in SRC2MIX.items()}
    clips = read_game_clips(jsS, bS, S)
    res = []
    for c in clips:
        if only and c['name'] not in only: continue
        res.append(retarget(S, D, c, dest2src))
    T.HIPS = 'mixamorig:Hips'
    js2, b2 = T.compact_and_add(jsD, bD, res)
    # the game names
    used = set()
    for nd in js2['nodes']:
        nm = nd.get('name')
        if nm in MIX2GAME: nd['name'] = MIX2GAME[nm]
        elif nm and nm.startswith('mixamorig:'): nd['name'] = nm[len('mixamorig:'):].replace('Left', 'L_').replace('Right', 'R_')
        if nd.get('name') in used: raise SystemExit('duplicate name ' + nd['name'])
        used.add(nd.get('name'))
    js3, b3 = add_pelvis(js2, b2)
    T.write_glb(out, js3, b3)
    print('%s -> %s: %d clips, %d bytes' % (dst.split('/')[-1], out.split('/')[-1], len(res), len(b3)))


if __name__ == '__main__':
    a = sys.argv[1:]
    only = None
    for x in list(a):
        if x.startswith('--only='): only = set(x[7:].split(',')); a.remove(x)
    main(a[0], a[1], a[2], only)
