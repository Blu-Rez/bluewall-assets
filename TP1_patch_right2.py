# TP1_patch_right2.py - patches /root/bw_art/tp1_pics6.py (idempotent per stage, safe to run on any earlier state).
#  A) SIDE (left) picture: ONE arm / ONE hand only                        (marker SIDE_POSE)
#  B) view "right" = the RIGHT side picture                               (marker RIGHT_POSE)
#  C) the right picture is made WITH the left picture as a reference (a mirrored copy of it, so it already faces right) -> same person, framing, scale, light as the left;
#     also saved: right_flip.png = the plain mirror of the left; Telegram: LEFT | RIGHT | MIRROR pair picture + an album of the files   (marker LEFT_REF; works with or without Pillow)
import sys
p = sys.argv[1]
s = open(p).read()
done = []

PNGTOOLS = r'''def _png_read(b):
    import zlib, struct
    if b[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a png")
    i = 8
    idat = []
    w = h = bd = ct = il = 0
    while i < len(b):
        n, t = struct.unpack(">I4s", b[i:i + 8])
        d = b[i + 8:i + 8 + n]
        i += 12 + n
        if t == b"IHDR":
            w, h, bd, ct, _c, _f, il = struct.unpack(">IIBBBBB", d)
        elif t == b"IDAT":
            idat.append(d)
        elif t == b"IEND":
            break
    if bd != 8 or ct not in (2, 6) or il != 0:
        raise ValueError("unsupported png (need 8-bit RGB/RGBA, not interlaced)")
    bpp = 3 if ct == 2 else 4
    raw = zlib.decompress(b"".join(idat))
    stride = w * bpp
    rows = []
    prev = bytearray(stride)
    pos = 0
    for y in range(h):
        f = raw[pos]
        cur = bytearray(raw[pos + 1:pos + 1 + stride])
        pos += 1 + stride
        if f == 1:
            for x in range(bpp, stride):
                cur[x] = (cur[x] + cur[x - bpp]) & 255
        elif f == 2:
            for x in range(stride):
                cur[x] = (cur[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                a = cur[x - bpp] if x >= bpp else 0
                cur[x] = (cur[x] + ((a + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a = cur[x - bpp] if x >= bpp else 0
                c = prev[x - bpp] if x >= bpp else 0
                bb = prev[x]
                p = a + bb - c
                pa = abs(p - a); pb = abs(p - bb); pc = abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (bb if pb <= pc else c)
                cur[x] = (cur[x] + pr) & 255
        elif f != 0:
            raise ValueError("bad png filter")
        rows.append(cur)
        prev = cur
    return w, h, bpp, rows


def _png_write(w, h, bpp, rows):
    import zlib, struct

    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    raw = b"".join(b"\x00" + bytes(r) for r in rows)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2 if bpp == 3 else 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b""))


def flip_png(b):
    try:
        import io
        from PIL import Image, ImageOps
        im = Image.open(io.BytesIO(b)).convert("RGB")
        o = io.BytesIO()
        ImageOps.mirror(im).save(o, "PNG")
        return o.getvalue()
    except ImportError:
        pass
    except Exception as e:
        print("mirror (PIL) failed:", e, flush=True)
    try:
        w, h, bpp, rows = _png_read(b)
        out = [b"".join([r[i:i + bpp] for i in range(w * bpp - bpp, -1, -bpp)]) for r in rows]
        return _png_write(w, h, bpp, out)
    except Exception as e:
        print("mirror failed:", e, flush=True)
        return None


def pair_png(lst):
    lst = [x for x in lst if x]
    try:
        import io
        from PIL import Image
        ims = [Image.open(io.BytesIO(x)).convert("RGB") for x in lst]
        hh = 1024
        ims = [im.resize((max(1, int(im.width * hh / im.height)), hh)) for im in ims]
        W = sum(im.width for im in ims) + 10 * (len(ims) - 1)
        sheet = Image.new("RGB", (W, hh), (255, 255, 255))
        x0 = 0
        for im in ims:
            sheet.paste(im, (x0, 0))
            x0 += im.width + 10
        o = io.BytesIO()
        sheet.save(o, "PNG")
        return o.getvalue()
    except ImportError:
        pass
    except Exception as e:
        print("pair picture (PIL) failed:", e, flush=True)
    try:
        ims = [_png_read(x) for x in lst]
        h0, bpp0 = ims[0][1], ims[0][2]
        if any(im[1] != h0 or im[2] != bpp0 for im in ims):
            raise ValueError("pictures differ in height/format")
        gap = b"\xff" * (bpp0 * 10)
        rows = []
        for y in range(h0):
            rows.append(gap.join([bytes(im[3][y]) for im in ims]))
        return _png_write(sum(im[0] for im in ims) + 10 * (len(ims) - 1), h0, bpp0, rows)
    except Exception as e:
        print("pair picture failed:", e, flush=True)
        return None
'''


def rep(old, new):
    global s
    assert s.count(old) == 1, ("not found / not unique", old[:70], s.count(old))
    s = s.replace(old, new)


if "SIDE_POSE" not in s:
    rep('END = ("NO weapon', '''SIDE_POSE = ("Standing straight and relaxed, seen exactly edge-on from her left side. Her arms hang straight down along the body, NOT forward and NOT backward: "
             "seen edge-on the two arms overlap, so only ONE arm and ONE hand are visible, her near LEFT arm hanging beside the hip with the open hand at upper-thigh level; "
             "her right arm is completely hidden behind her body and torso, with no second hand, no second sleeve and no second arm anywhere in the picture. "
             "Feet flat on the floor, both pointing to the left edge of the picture. "
             "Camera straight at chest height, no perspective tilt, the whole body from hair to boots visible with a small margin, centred. ")
END = ("NO weapon''')
    rep('+ REAL + POSE + costume(d, False) + END)', '+ REAL + SIDE_POSE + costume(d, False) + END)')
    rep('    return (same + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view', '    return (same.replace("the same pose, ", "") + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view')
    done.append("A")

if "RIGHT_POSE" not in s:
    rep('END = ("NO weapon', '''RIGHT_POSE = ("Standing straight and relaxed, seen exactly edge-on from her right side. Her arms hang straight down along the body, NOT forward and NOT backward: "
              "seen edge-on the two arms overlap, so only ONE arm and ONE hand are visible, her near RIGHT arm hanging beside the hip with the open hand at upper-thigh level; "
              "her left arm is completely hidden behind her body and torso, with no second hand, no second sleeve and no second arm anywhere in the picture. "
              "Feet flat on the floor, both pointing to the right edge of the picture. "
              "Camera straight at chest height, no perspective tilt, the whole body from hair to boots visible with a small margin, centred. ")
END = ("NO weapon''')
    rep('    return (same.replace("the same pose, ", "") + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view',
        '''    if view == "right":
        return (same.replace("the same pose, ", "") + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view (exactly 90 degrees), her RIGHT side toward the camera, she faces the RIGHT edge of the picture, the cloak hanging straight down behind her, seen edge-on, with its outer side completely plain. " % n
                + REAL + RIGHT_POSE + costume(d, False) + END)
    return (same.replace("the same pose, ", "") + "Output ONE full-body picture of %s for a 3D scan: pure SIDE view''')
    rep('VIEW_ORDER = ("front", "back", "side", "card")', 'VIEW_ORDER = ("front", "back", "side", "right", "card")')
    rep('or ["front", "back", "side", "card"]', 'or ["front", "back", "side", "right", "card"]')
    rep('order = [v for v in ("front", "back", "side") if v in got]', 'order = [v for v in ("front", "back", "side", "right") if v in got]')
    rep('v.upper() + (" (player-pick card)" if v == "card" else "")', 'v.upper() + {"card": " (player-pick card)", "side": " (LEFT side)", "right": " (RIGHT side)"}.get(v, "")')
    rep('rest = [v for v in ("back", "side") if v in VIEWS]', 'rest = [v for v in ("back", "side", "right") if v in VIEWS]')
    done.append("B")

if "LEFT_REF" not in s:
    rep('END = ("NO weapon', '''LEFT_REF = ("The third attached picture is the LEFT side view of this same person, mirrored so that it already faces right: use it as the base for the pose, the camera, the framing, the scale, "
            "the lighting, the hair length, the cloak, the clothes and the boots, so that the two side pictures look like one pair. But make every detail truly her RIGHT side as the character sheet and the front picture show it: "
            "a detail that belongs to her left side stays hidden behind her, a detail that belongs to her right side is visible. ")
END = ("NO weapon''')
    rep('def prompt(view, k, has_front=True):', 'def prompt(view, k, has_front=True, has_left=False):')
    rep('+ REAL + RIGHT_POSE + costume(d, False) + END)', '+ (LEFT_REF if has_left else "") + REAL + RIGHT_POSE + costume(d, False) + END)')
    rep('p = prompt(v, k, has_front) + ((" " + FIX) if FIX else "")', 'p = prompt(v, k, has_front, v == "right" and len(imgs) > 2) + ((" " + FIX) if FIX else "")')
    rep('rest = [v for v in ("back", "side", "right") if v in VIEWS]', 'rest = [v for v in ("back", "side") if v in VIEWS]')
    rep('def cost():', PNGTOOLS + "\n\n\ndef cost():")
    rep('''                    if jobs:
                        await asyncio.gather(*jobs)
''', '''                    if jobs:
                        await asyncio.gather(*jobs)
                    if "right" in VIEWS:
                        if front is None:
                            fails.append("%s: no front picture, right needs it" % k)
                        else:
                            left = got.get("side")
                            if left is None and os.path.exists(od + "/side.png"):
                                left = open(od + "/side.png", "rb").read()
                            ref = flip_png(left) if left else None
                            await one("right", [sheet, front] + ([ref] if ref else []))
                            if ref is not None and "right" in got:
                                open(od + "/right_flip.png", "wb").write(ref); got["right_flip"] = ref
                            if left and "right" in got:
                                got["pair"] = pair_png([left, got["right"], ref])
                                if "side" not in got: got["side"] = left
''')
    rep('order = [v for v in ("front", "back", "side", "right") if v in got]', '''order = [v for v in ("front", "back", "side", "right", "right_flip") if v in got]
                    if got.get("pair"):
                        try:
                            await bot.send_photo(uid, BufferedInputFile(got["pair"], "%s_pair.png" % k), caption="%s: LEFT | RIGHT (new) | RIGHT (plain mirror of the left)" % S[k]["name"])
                        except Exception as e:
                            print("pair photo failed", k, e, flush=True)''')
    rep('files: %s/<name>/{front,back,side,card}.png', 'files: %s/<name>/{front,back,side,right,right_flip,pair,card}.png')
    rep('                                got["pair"] = pair_png([left, got["right"], ref])\n', '                                got["pair"] = pair_png([left, got["right"], ref])\n                                if got["pair"]:\n                                    open(od + "/pair.png", "wb").write(got["pair"])\n')
    done.append("C")

if not done:
    print("already patched"); sys.exit(0)
open(p, "w").write(s)
print("patched", p, "stages", "".join(done))
