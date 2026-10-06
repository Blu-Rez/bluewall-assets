// Baked card impostors (p22 "scatter"): a model is rendered once at load into an atlas (side views + one top view) and drawn on a few
// crossed alpha-tested quads plus one horizontal canopy card. Every card fades out as it turns edge-on to the camera, so from above a far
// tree is its round crown (not a flat star / cross) and from the side the canopy card disappears. Used by the far forest (trees.js) and the
// countryside bushes (sc_bush.js). Cost: the same single draw call per kind, 2 more triangles per instance.
import * as THREE from 'three';

// sets: [{ parts: [{ geometry, material, skip }], half, top, views }] — each model spans x,z within +-half and y in [0, top];
// views: [{ yaw, rect }] (side, looking at the model from that direction) or [{ top: true, rect }]; rect = [x, y, w, h] in pixels of the
// W x H target (y from the bottom). Returns the atlas texture (mipmapped).
const ATLASES = [];           // (p37: every atlas that was ever baked, so that a GPU that lost its context can paint them again into the very same targets)
export function bakeAtlas(renderer, sets, W, H, light = 1) {
  const rt = new THREE.WebGLRenderTarget(W, H, { samples: 0, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  paintAtlas(renderer, rt, sets, W, H, light);
  ATLASES.push({ rt, sets, W, H, light });
  return rt.texture;
}
export function rebakeAtlases(renderer) { for (const a of ATLASES) paintAtlas(renderer, a.rt, a.sets, a.W, a.H, a.light); }
function paintAtlas(renderer, rt, sets, W, H, light) {
  const prevT = renderer.getRenderTarget(), prevC = renderer.getClearColor(new THREE.Color()), prevA = renderer.getClearAlpha();
  const prevSM = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
  rt.scissorTest = false; renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear();
  for (const set of sets) {
    const { half, top } = set, sc = new THREE.Scene();
    const amb = new THREE.AmbientLight(0xffffff, 2.0 * light); sc.add(amb);
    const d = new THREE.DirectionalLight(0xffffff, 1.3 * light); d.position.set(0.35, 1, 0.8); sc.add(d);
    for (const p of set.parts) { if (p.skip) continue; const m = p.material.clone(); m.onBeforeCompile = p.onBake || (() => {}); m.customProgramCacheKey = () => 'scbake' + (p.onBake ? 'x' : ''); sc.add(new THREE.Mesh(p.geometry, m)); }
    for (const v of set.views) {
      const [x, y, w, h] = v.rect;
      let cam;
      if (v.top) { cam = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, top + 400); cam.position.set(0, top + 200, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0); }
      else { cam = new THREE.OrthographicCamera(-half, half, top, 0, 0.1, 400); cam.position.set(Math.sin(v.yaw) * 120, 0, Math.cos(v.yaw) * 120); cam.lookAt(0, 0, 0); }
      const k = (v.light ?? (v.top ? 0.8 : 1)) * light; amb.intensity = 2.0 * k; d.intensity = 1.3 * k;      // (seen from above the crown takes the full sun in game: bake it a little darker)
      rt.viewport.set(x, y, w, h); rt.scissor.set(x, y, w, h); rt.scissorTest = true;
      renderer.setRenderTarget(rt); renderer.render(sc, cam);
    }
    sc.traverse((o) => { if (o.isMesh) o.material.dispose(); });
  }
  rt.scissorTest = false; rt.viewport.set(0, 0, W, H); rt.scissor.set(0, 0, W, H);
  renderer.setRenderTarget(prevT); renderer.setClearColor(prevC, prevA); renderer.shadowMap.autoUpdate = prevSM;
}

// cards: { yaw, rect, half, top } (vertical, standing on y=0, rect in uv [u0,v0,u1,v1]) or { y, rect, half, h: true } (horizontal at height y).
// normals: 'up' (all up: lit like the canopy top) or a [cx, cy, cz] centre (spherical normals: a soft round bush).
export function cardGeometry(cards, normals = 'up') {
  const pos = [], uv = [], nor = [], qn = [], idx = [];
  const C = Array.isArray(normals) ? new THREE.Vector3(...normals) : null, t = new THREE.Vector3();
  const vert = (x, y, z, u, v, nx, ny, nz) => {
    pos.push(x, y, z); uv.push(u, v); qn.push(nx, ny, nz);
    if (C) { t.set(x - C.x, (y - C.y) * 1.3, z - C.z).normalize(); t.y = t.y * 0.75 + 0.35; t.normalize(); nor.push(t.x, t.y, t.z); } else nor.push(0, 1, 0);
  };
  for (const c of cards) {
    const b = pos.length / 3, [u0, v0, u1, v1] = c.rect;
    if (c.h) {
      const s = c.half;
      vert(-s, c.y, s, u0, v0, 0, 1, 0); vert(s, c.y, s, u1, v0, 0, 1, 0); vert(s, c.y, -s, u1, v1, 0, 1, 0); vert(-s, c.y, -s, u0, v1, 0, 1, 0);
    } else {
      const cx = Math.cos(c.yaw), sx = -Math.sin(c.yaw), nx = Math.sin(c.yaw), nz = Math.cos(c.yaw), s = c.half, y0 = c.y0 || 0;
      vert(-s * cx, y0, -s * sx, u0, v0, nx, 0, nz); vert(s * cx, y0, s * sx, u1, v0, nx, 0, nz); vert(s * cx, y0 + c.top, s * sx, u1, v1, nx, 0, nz); vert(-s * cx, y0 + c.top, -s * sx, u0, v1, nx, 0, nz);
    }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aQn', new THREE.Float32BufferAttribute(qn, 3));
  g.setIndex(idx); g.computeBoundingSphere();
  return g;
}

// shader chunks for the facing fade (to be spliced into a material's onBeforeCompile after its own edits)
export function cardFadeShader(sh, lo = 0.1, hi = 0.42) {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aQn; varying float vFace;')
    .replace('#include <project_vertex>', `#include <project_vertex>
  {
  #ifdef USE_INSTANCING
    vec4 cw = modelMatrix * instanceMatrix * vec4(transformed, 1.0); vec3 cn = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * aQn);
  #else
    vec4 cw = modelMatrix * vec4(transformed, 1.0); vec3 cn = normalize(mat3(modelMatrix) * aQn);
  #endif
    vFace = abs(dot(cn, normalize(cameraPosition - cw.xyz)));
  }`);
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFace;')
    .replace('#include <alphatest_fragment>', `diffuseColor.a *= smoothstep(${lo.toFixed(3)}, ${hi.toFixed(3)}, vFace);\n#include <alphatest_fragment>`);
}
