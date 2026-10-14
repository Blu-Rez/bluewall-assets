from PIL import Image
import base64, io
out = {}
for k, name in [('shield', 'shieldmaiden'), ('rally', 'lord')]:
    a = Image.open(f'/home/claude/dev/s33/abil/{k}.png').convert('RGBA'); bb = a.getbbox(); a = a.crop(bb)
    w, h = a.size; m = max(w, h); sq = Image.new('RGBA', (m, m), (0, 0, 0, 0)); sq.paste(a, ((m - w) // 2, (m - h) // 2))
    sq = sq.resize((120, 120), Image.LANCZOS)
    buf = io.BytesIO(); sq.save(buf, 'WEBP', quality=90, method=6); out[name] = base64.b64encode(buf.getvalue()).decode()
    print(name, bb, len(buf.getvalue()))
js = "// Ability emblems (owner 5 Oct: \"more attractive and realistic\"): 120 px WebP stills rendered from the game's own 3D assets (shield_heater.glb; the banner cloth on a lance)\n// with dev/s33/abil_lab.js - repainted navy / steel / royal blue.  Re-render + re-bake with `bash dev/s33/abil.sh && python3 dev/s33/abil_bake.py`.\nexport const ABIL_ART = {\n" + ",\n".join(f"  {k}: 'data:image/webp;base64,{v}'" for k, v in out.items()) + ",\n};\n"
open('/home/claude/bot/bluebot_v2/bluewall/client/src/abilart.js', 'w').write(js)
