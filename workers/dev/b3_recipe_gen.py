#!/usr/bin/env python3
# b3_recipe_gen.py -> dev/b3_recipe.json : the piece list of kit_civic.glb (real KayKit Medieval Hexagon [CC0] / Quaternius Fantasy Props + Medieval Village MegaKits [CC0] models)
import json, os
KK = "/home/claude/blu-rez/bluewall-assets/kaykit-medieval-hexagon/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings"
FP = "/home/claude/blu-rez/bluewall-assets/fantasy-props-megakit/Exports/glTF"
MK = "/home/claude/blu-rez/bluewall-assets/medieval-village-megakit/Medieval Village MegaKit[Standard]/glTF"
I = []
def kk(name, kind, col, **o): o.setdefault("err", 0.12); I.append(dict(name=name, src=f"$KK/{col}/building_{kind}_{col}.gltf", **o))
def fp(name, src, **o): o.setdefault("err", 0.3); I.append(dict(name=name, src=f"$FP/{src}.gltf", **o))
def mk(name, src, **o): o.setdefault("err", 0.3); I.append(dict(name=name, src=f"$MK/{src}.gltf", **o))
def comp(name, *parts): I.append(dict(name=name, parts=list(parts)))
def P(src, root="FP", **o): o.setdefault("err", 0.3); return dict(src=f"${root}/{src}.gltf", **o)

# ---- buildings (KayKit): blue (deep / light blue roofs) and the gold-roofed twin for the top tiers
for col, suf in (("blue", "b"), ("yellow", "y")):
    kk(f"cv_tavern_{suf}", "tavern", col, w=10.5, tris=2000, err=0.05)
    kk(f"cv_church_{suf}", "church", col, w=13, tris=950)
    kk(f"cv_well_{suf}", "well", col, w=4.0, tris=450)
    kk(f"cv_markethall_{suf}", "market", col, w=12, tris=950, err=0.2)
    kk(f"cv_tower_{suf}", "tower_A", col, h=13, tris=900)
    kk(f"cv_wing_{suf}", "home_B", col, w=8.5, tris=800)
    kk(f"cv_hall_{suf}", "home_A", col, w=8, tris=800)
# ---- single props
fp("cv_stall", "Stall_Empty", s=1.5, tris=420)
fp("cv_barrel", "Barrel", s=1.5, tris=150)
fp("cv_crate", "Crate_Wooden", s=1.4, tris=140)
fp("cv_bag", "Bag", s=1.5, tris=200)
fp("cv_amphora", "Vase_4", s=2.2, tris=150)
fp("cv_bucket", "Bucket_Wooden_1", s=2.0, tris=110)
fp("cv_banner", "Banner_2", s=1.9, tris=160)
fp("cv_bench", "Bench", s=1.5, tris=100)
fp("cv_chest", "Chest_Wood", s=1.3, tris=180)
mk("cv_stairs", "Stairs_Exterior_Straight", s=1.5, tris=62)
# ---- composites (a stack of props = one piece)
comp("cv_lamp", P("Corner_Exterior_Wood", "MK", h=3.3, tris=40), P("Torch_Metal", s=1.7, y=3.3, tris=111))
comp("cv_tableset",
     P("Table_Large", s=1.5, tris=161),
     P("Bench", s=1.5, z=1.5, tris=68), P("Bench", s=1.5, z=-1.5, ry=180, tris=68),
     P("Mug", s=2.0, x=-1.2, y=1.2, z=0.3, tris=49), P("Mug", s=2.0, x=0.2, y=1.2, z=-0.3, ry=60, tris=49), P("Mug", s=2.0, x=1.2, y=1.2, z=0.2, ry=-40, tris=49),
     P("Chalice", s=2.2, x=0.7, y=1.2, z=0.35, tris=55))
comp("cv_counting",
     P("Table_Large", s=1.7, tris=161),
     P("Book_Stack_1", s=2.2, x=-1.6, y=1.38, z=0.1, tris=62), P("Scroll_1", s=2.5, x=-0.7, y=1.38, z=0.3, ry=30, tris=55),
     P("Coin_Pile_2", s=4.0, x=0.6, y=1.38, z=0.2, tris=80), P("Coin_Pile_2", s=4.0, x=1.5, y=1.38, z=-0.35, ry=40, tris=80)
     )
comp("cv_stall_veg",
     P("Stall_Empty", s=1.5, tris=310),
     P("FarmCrate_Apple", s=1.8, x=-0.8, z=1.3, tris=88), P("FarmCrate_Carrot", s=1.8, x=0.7, z=1.4, ry=12, tris=88))
comp("cv_stall_wine",
     P("Stall_Empty", s=1.5, tris=310),
     P("Barrel", s=1.5, x=-1.0, z=1.2, tris=68), P("Barrel", s=1.5, x=0.1, z=1.5, tris=68), P("Barrel_Apples", s=1.5, x=1.1, z=1.1, tris=120))
comp("cv_stall_pots",
     P("Stall_Empty", s=1.5, tris=310),
     P("Vase_2", s=1.8, x=-0.9, z=1.3, tris=60), P("Vase_4", s=2.4, x=0.1, z=1.5, tris=52), P("Bag", s=1.5, x=1.1, z=1.2, tris=68), P("Bucket_Wooden_1", s=2.0, x=-0.1, z=0.9, tris=55))
comp("cv_stall_rich",
     P("Stall_Cart_Empty", s=1.4, tris=496),
     P("Chest_Wood", s=1.2, x=-1.3, z=1.5, ry=15, tris=88), P("Bag", s=1.5, x=0.4, z=1.4, tris=68), P("Bag", s=1.3, x=1.1, z=1.2, ry=50, tris=68))
comp("cv_cross",
     P("Stairs_Exterior_Platform", "MK", s=1.8, tris=32),
     P("Corner_Exterior_Brick", "MK", h=5.4, y=1.8, tris=150), P("Sword_Bronze", s=3.0, y=7.1, tris=120))
json.dump(dict(vars=dict(KK=KK, FP=FP, MK=MK), items=I), open("/home/claude/dev/b3_recipe.json", "w"), indent=0)
print(len(I), "items")
