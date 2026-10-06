// Weather: clear / fog / drizzle / rain+thunder / thunder / storm / lightning.
// Auto mode follows the wall clock (same for every player), transitions blend
// over ~20 s. Drives clouds, fog, light dimming, rain streaks + ground
// splashes, wind (shared uniform for grass/wheat/trees/flags), lightning bolts
// and sky flashes, and emits thunder events for the audio engine.
import * as THREE from 'three';

export const WIND = { value: 0.35, gust: { value: 0 }, dir: new THREE.Vector2(0.8, 0.6).normalize() };

// cover, grey, fog x, precipitation, snow share, wind, lightning/min, bolt share (vs sheet flashes), turbidity
const KINDS = {
  clear:     { cover: 0.18, grey: 0.0,  fog: 1.0, rain: 0,    snow: 0, wind: 0.28, lpm: 0,  bolt: 0,    turb: 0.0, icon: null },
  cloudy:    { cover: 0.78, grey: 0.38, fog: 1.35, rain: 0,   snow: 0, wind: 0.42, lpm: 0,  bolt: 0,    turb: 0.5, icon: '☁️' },
  fog:       { cover: 0.6,  grey: 0.5,  fog: 4.6, rain: 0,    snow: 0, wind: 0.08, lpm: 0,  bolt: 0,    turb: 1.0, icon: '🌫️' },
  drizzle:   { cover: 0.82, grey: 0.45, fog: 1.9, rain: 0.22, snow: 0, wind: 0.32, lpm: 0,  bolt: 0,    turb: 0.6, icon: '🌦️' },
  rain:      { cover: 0.92, grey: 0.6,  fog: 2.3, rain: 0.72, snow: 0, wind: 0.55, lpm: 2,  bolt: 0.5,  turb: 0.8, icon: '🌧️' },
  thunder:   { cover: 0.95, grey: 0.66, fog: 2.0, rain: 0.5,  snow: 0, wind: 0.62, lpm: 7,  bolt: 0.45, turb: 0.8, icon: '⛈️' },
  storm:     { cover: 1.0,  grey: 0.78, fog: 2.9, rain: 1.0,  snow: 0, wind: 1.0,  lpm: 4,  bolt: 0.6,  turb: 1.0, icon: '⛈️' },
  lightning: { cover: 0.94, grey: 0.62, fog: 1.7, rain: 0.28, snow: 0, wind: 0.5,  lpm: 15, bolt: 0.8,  turb: 0.8, icon: '🌩️' },
  snow:      { cover: 0.9,  grey: 0.55, fog: 2.4, rain: 0.55, snow: 1, wind: 0.25, lpm: 0,  bolt: 0,    turb: 0.8, icon: '🌨️' },
  blizzard:  { cover: 1.0,  grey: 0.72, fog: 4.0, rain: 1.0,  snow: 1, wind: 1.0,  lpm: 0,  bolt: 0,    turb: 1.0, icon: '❄️' },
};
export const WEATHER_KINDS = Object.keys(KINDS);
// season -> chance of each weather peak (spring, summer, autumn, winter)
const SEASON_W = [
  { clear: 40, cloudy: 16, drizzle: 12, rain: 12, thunder: 9, lightning: 3, storm: 4, fog: 4 },
  { clear: 70, cloudy: 10, thunder: 8, lightning: 5, drizzle: 3, rain: 2, storm: 1, fog: 1 },
  { clear: 32, cloudy: 18, fog: 14, drizzle: 14, rain: 12, storm: 6, thunder: 3, lightning: 1 },
  { clear: 28, cloudy: 20, fog: 10, snow: 24, blizzard: 7, drizzle: 6, rain: 5 },
];
// how a weather front builds up and clears: [lead-in, peak, peak, tail, after]
const LEAD = (k) => (KINDS[k].rain > 0 || k === 'lightning' ? 'cloudy' : k);
const TAIL = { storm: 'rain', thunder: 'drizzle', rain: 'drizzle', lightning: 'cloudy', blizzard: 'snow', snow: 'cloudy', drizzle: 'cloudy', fog: 'clear', cloudy: 'clear', clear: 'clear' };
const EPISODE_MIN = 30, PHASES = 5;
const hash = (n) => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };

// same for every player: derived from the wall clock, the real season and the game hour
function autoKind(now = Date.now(), seasonIdx = 2, hour = 12) {
  const ep = Math.floor(now / (EPISODE_MIN * 60000)), ph = Math.floor((now / 60000 % EPISODE_MIN) / (EPISODE_MIN / PHASES));
  const W = SEASON_W[seasonIdx] || SEASON_W[2], tot = Object.values(W).reduce((a, b) => a + b, 0);
  let x = hash(ep * 7 + seasonIdx) * tot, peak = 'clear';
  for (const [k, w] of Object.entries(W)) { if ((x -= w) < 0) { peak = k; break; } }
  let k = [LEAD(peak), peak, peak, TAIL[peak] || 'clear', hash(ep * 13 + 5) < 0.6 ? 'clear' : 'cloudy'][ph];
  // fog is a morning thing: it burns off by late morning and doesn't form in the afternoon
  if (k === 'fog' && !(hour > 3.5 && hour < 10.5)) k = 'cloudy';
  return k;
}

export function buildWeather(scene, { height, quality = 'high', onThunder, season = () => 2, hour = () => 12 } = {}) {
  const cur = { ...KINDS.clear }, W = { cover: 0.22, grey: 0, fog: 1, rain: 0, snow: 0, wind: 0.3, flash: 0, flashSoft: 0, turbidity: 0, kind: 'clear' };
  let mode = 'auto', target = 'clear', flash = 0, nextStrike = 5;

  // ------------------------------------------------ rain streaks: camera-facing thin quads, positions in the shader
  const N = quality === 'low' ? 2500 : quality === 'medium' ? 5000 : 8000;
  const BOX = new THREE.Vector3(120, 80, 120);
  const quad = new THREE.InstancedBufferGeometry();
  quad.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  quad.setIndex([0, 1, 2, 0, 2, 3]);
  const ip = new Float32Array(N * 4);
  // (p28: in rain only the drops with aP.z <= 0.4 are ever visible (the shader zeroes the others), so they are sorted first and rain draws only those; snow draws all of them)
  const drops = []; for (let i = 0; i < N; i++) drops.push([Math.random(), Math.random(), Math.random(), Math.random()]);
  drops.sort((a, b) => (a[2] > 0.4) - (b[2] > 0.4));
  const NVIS = drops.reduce((n, d) => n + (d[2] <= 0.4 ? 1 : 0), 0);
  drops.forEach((d, i) => ip.set(d, i * 4));
  quad.setAttribute('aP', new THREE.InstancedBufferAttribute(ip, 4));
  quad.instanceCount = N;
  const RU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uBox: { value: BOX }, uAmount: { value: 0 }, uWind: { value: new THREE.Vector2() },
    uCol: { value: new THREE.Color(0.7, 0.75, 0.85) }, uFlash: { value: 0 }, uSnow: { value: 0 } }]);
  const rain = new THREE.Mesh(quad, new THREE.ShaderMaterial({
    uniforms: RU, transparent: true, depthWrite: false, fog: true,
    vertexShader: `attribute vec4 aP; uniform float uTime, uAmount, uSnow; uniform vec3 uCenter, uBox; uniform vec2 uWind; varying float vA; varying float vY; varying vec2 vQ;
      #include <fog_pars_vertex>
      void main(){
        float speed = mix(48.0 + aP.w * 22.0, 2.2 + aP.w * 1.8, uSnow);
        vec3 vel = vec3(uWind.x * mix(16.0, 7.0, uSnow), -speed, uWind.y * mix(16.0, 7.0, uSnow));
        float y = mod(aP.y * uBox.y - uTime * speed, uBox.y) - uBox.y * 0.4;
        vec2 xz = aP.xz * uBox.xz - uBox.xz * 0.5 + vel.xz * (y / speed) * -1.0;
        xz += vec2(sin(uTime * 1.3 + aP.x * 40.0), cos(uTime * 1.1 + aP.z * 40.0)) * 0.9 * uSnow;
        xz = mod(xz - uCenter.xz + uBox.xz * 0.5, uBox.xz) - uBox.xz * 0.5;
        vec3 w = vec3(uCenter.x + xz.x, uCenter.y + y, uCenter.z + xz.y);
        vec3 dir = normalize(vel);
        vec3 view = normalize(cameraPosition - w);
        vec3 side = normalize(cross(dir, view));
        float len = mix(1.5 + aP.w * 1.2, 0.32 + 0.1 * aP.w, uSnow), wid = mix(0.03 + 0.015 * aP.w, 0.16 + 0.06 * aP.w, uSnow);
        w += side * position.x * wid - dir * position.y * len;
        float dc = distance(cameraPosition, w); float rf = smoothstep(18.0, 70.0, dc) * step(aP.z, 0.4);
        vA = step(aP.w, uAmount) * mix((0.30 - 0.18 * position.y) * rf, 0.95, uSnow); vY = position.y; vQ = vec2(position.x, position.y * 2.0 - 1.0);
        vec4 mvPosition = viewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform vec3 uCol; uniform float uFlash, uSnow; varying float vA; varying float vY; varying vec2 vQ;
      #include <fog_pars_fragment>
      void main(){ float a = vA * mix(1.0, smoothstep(1.0, 0.25, length(vQ)), uSnow); if (a < 0.01) discard;
        gl_FragColor = vec4(mix(uCol, uCol * 1.9 + 0.12, uSnow) + vec3(0.6,0.7,1.0) * uFlash, a);
        #include <fog_fragment>
      }`,
  }));
  rain.frustumCulled = false; rain.renderOrder = 5; scene.add(rain);

  // screen-space rain sheets (two scrolling layers) for heavy rain
  const sheetTex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
    for (let i = 0; i < 220; i++) { const x = Math.random() * 256, y = Math.random() * 256, l = 14 + Math.random() * 30; g.strokeStyle = `rgba(210,225,255,${0.12 + Math.random() * 0.3})`; g.lineWidth = 1 + Math.random(); g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * 0.18, y + l); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  })();
  const SH = { uTime: { value: 0 }, uA: { value: 0 }, uTex: { value: sheetTex }, uAspect: { value: 1 }, uLight: { value: 1 } };
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: SH, transparent: true, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D uTex; uniform float uTime, uA, uAspect, uLight; varying vec2 vUv;
      void main(){ vec2 u = vUv * vec2(uAspect, 1.0);
        float a = texture2D(uTex, u * 1.6 + vec2(uTime * 0.25, uTime * 2.6)).a + texture2D(uTex, u * 2.7 + vec2(uTime * 0.4, uTime * 3.7)).a * 0.7;
        gl_FragColor = vec4(vec3(0.8, 0.86, 1.0) * uLight, a * uA); }`,
  }));
  sheet.frustumCulled = false; sheet.renderOrder = 999; scene.add(sheet);

  // ground splashes (points that pop and fade)
  const NS = quality === 'low' ? 300 : 900, spPos = new Float32Array(NS * 3), spPh = new Float32Array(NS);
  for (let i = 0; i < NS; i++) { spPh[i] = Math.random(); }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  sg.setAttribute('aPh', new THREE.BufferAttribute(spPh, 1));
  const SU = { uTime: { value: 0 }, uAmount: { value: 0 }, uPx: { value: 300 }, uCol: { value: new THREE.Color() } };
  const splash = new THREE.Points(sg, new THREE.ShaderMaterial({
    uniforms: SU, transparent: true, depthWrite: false,
    vertexShader: `attribute float aPh; uniform float uTime, uAmount, uPx; varying float vA;
      void main(){ float t = fract(uTime * 2.2 + aPh); vA = (1.0 - t) * step(aPh, uAmount);
        vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = (0.25 + t * 0.5) * uPx / -mv.z; }`,
    fragmentShader: `uniform vec3 uCol; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); float a = smoothstep(0.5, 0.35, r) * smoothstep(0.15, 0.32, r) * vA * 0.7; if (a < 0.01) discard; gl_FragColor = vec4(uCol, a); }`,
  }));
  splash.frustumCulled = false; scene.add(splash);
  let spAcc = 0;

  // ------------------------------------------------ lightning bolts
  const boltMat = new THREE.LineBasicMaterial({ color: new THREE.Color(2.2, 2.6, 4.0), transparent: true, opacity: 1, toneMapped: false, fog: false });
  const bolts = [];
  const strikeLight = new THREE.PointLight(0xbcd2ff, 0, 260, 1.4); scene.add(strikeLight);
  function makeBolt(x, z) {
    const gy = height(x, z), top = new THREE.Vector3(x + (Math.random() - 0.5) * 60, 170 + Math.random() * 40, z + (Math.random() - 0.5) * 60);
    const pts = [];
    const seg = (a, b, depth, rough, branch) => {
      if (depth === 0) { pts.push(a.x, a.y, a.z, b.x, b.y, b.z); return; }
      const m = a.clone().lerp(b, 0.5); const len = a.distanceTo(b);
      m.x += (Math.random() - 0.5) * len * rough; m.z += (Math.random() - 0.5) * len * rough; m.y += (Math.random() - 0.5) * len * rough * 0.3;
      seg(a, m, depth - 1, rough, branch); seg(m, b, depth - 1, rough, branch);
      if (branch && depth > 3 && Math.random() < 0.35) {
        const d = b.clone().sub(m).applyAxisAngle(new THREE.Vector3(0, 1, 0), (Math.random() - 0.5) * 2).multiplyScalar(0.45 + Math.random() * 0.3);
        d.x += (Math.random() - 0.5) * len * 0.3; seg(m, m.clone().add(d), depth - 2, rough, false);
      }
    };
    seg(top, new THREE.Vector3(x, gy, z), 7, 0.42, true);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const line = new THREE.LineSegments(g, boltMat.clone()); line.frustumCulled = false; scene.add(line);
    bolts.push({ line, t: 0, life: 0.32 + Math.random() * 0.2 });
    strikeLight.position.set(x, gy + 30, z); strikeLight.intensity = 9000;
    return new THREE.Vector3(x, gy, z);
  }

  function strike(camera, k) {
    const isBolt = Math.random() < k.bolt;
    flash = isBolt ? 1 : 0.35 + Math.random() * 0.4;
    let where;
    if (isBolt) {
      const a = Math.random() * 6.28, d = 50 + Math.random() * 220;
      where = makeBolt(Math.cos(a) * d, Math.sin(a) * d);
    } else {
      where = new THREE.Vector3((Math.random() - 0.5) * 600, 150, (Math.random() - 0.5) * 600);
    }
    const dist = camera ? camera.position.distanceTo(where) : 300;
    onThunder && onThunder({ delay: Math.min(6, dist / 340 + 0.15), power: isBolt ? Math.max(0.25, 1 - dist / 600) : 0.35 + Math.random() * 0.25, close: isBolt && dist < 200 });
  }

  let kindAt = -1, kindNow = 'clear';
  const look = new THREE.Vector3();
  function update(t, dt, camera) {
    if (t - kindAt > 1 || kindAt < 0) { kindAt = t; kindNow = mode === 'auto' ? autoKind(Date.now(), season(), hour()) : mode; }
    const kind = kindNow;
    if (kind !== target) target = kind;
    const k = KINDS[target];
    const a = 1 - Math.exp(-dt / 6);                                        // ~20 s blend
    for (const key of ['cover', 'grey', 'fog', 'rain', 'snow', 'wind', 'turb']) cur[key] += (k[key] - cur[key]) * a;
    // gusts
    const gust = Math.max(0, Math.sin(t * 0.37) * Math.sin(t * 1.13 + 1.7)) * cur.wind;
    WIND.value = cur.wind; WIND.gust.value = gust;
    // lightning schedule
    if (k.lpm > 0 && cur.cover > 0.6) {
      nextStrike -= dt;
      if (nextStrike <= 0) { strike(camera, k); nextStrike = (60 / k.lpm) * (0.4 + Math.random() * 1.2); if (Math.random() < 0.3) nextStrike = 0.25 + Math.random() * 0.4; }
    }
    flash = Math.max(0, flash - dt * 3.2);
    const flick = flash > 0.05 ? flash * (0.65 + 0.35 * Math.sin(t * 90)) : 0;
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i]; b.t += dt;
      b.line.material.opacity = Math.max(0, 1 - b.t / b.life) * (0.6 + 0.4 * Math.sin(b.t * 70));
      if (b.t > b.life) { scene.remove(b.line); b.line.geometry.dispose(); b.line.material.dispose(); bolts.splice(i, 1); }
    }
    strikeLight.intensity *= Math.pow(0.0001, dt);
    // rain
    const wet = cur.rain * (1 - cur.snow);
    RU.uTime.value = t; RU.uAmount.value = cur.rain; RU.uFlash.value = flick; RU.uSnow.value = cur.snow;
    SH.uTime.value = t; SH.uA.value = 0; sheet.visible = false;      // (p27, owner: the downpour painted on the screen itself is gone; ground splashes + lightning stay)
    if (camera) SH.uAspect.value = camera.aspect || 1;
    RU.uWind.value.set(WIND.dir.x * cur.wind, WIND.dir.y * cur.wind);
    rain.visible = cur.rain > 0.01; quad.instanceCount = cur.snow > 0.02 ? N : NVIS;
    if (camera) {
      // rain box hangs between the camera and the ground it looks at
      camera.getWorldDirection(look);
      RU.uCenter.value.copy(camera.position).addScaledVector(look, 70); RU.uCenter.value.y = Math.max(RU.uCenter.value.y, height(RU.uCenter.value.x, RU.uCenter.value.z) + 30);
    }
    // splashes around the view centre
    splash.visible = wet > 0.05;
    if (splash.visible && camera) {
      spAcc += dt;
      if (spAcc > 0.25) {
        spAcc = 0;
        camera.getWorldDirection(look);
        const cx = camera.position.x + look.x * 120, cz = camera.position.z + look.z * 120;
        const p = sg.attributes.position;
        for (let i = 0; i < NS; i++) {
          if (Math.random() > 0.15) continue;
          const x = cx + (Math.random() - 0.5) * 160, z = cz + (Math.random() - 0.5) * 160;
          p.setXYZ(i, x, height(x, z) + 0.15, z);
        }
        p.needsUpdate = true;
      }
      SU.uTime.value = t; SU.uAmount.value = wet;
    }
    W.cover = cur.cover; W.grey = cur.grey; W.fog = cur.fog; W.rain = wet; W.snow = cur.rain * cur.snow; W.wind = cur.wind; W.flash = flick; W.flashSoft = flash > 0.05 ? flash : 0; W.turbidity = cur.turb; W.kind = target; W.gust = gust;
    return W;
  }
  function setMode(m, snap = false) {
    mode = m === 'auto' || KINDS[m] ? m : 'auto'; if (mode !== 'auto') nextStrike = 2;
    if (snap) { target = mode === 'auto' ? autoKind(Date.now(), season(), hour()) : mode; Object.assign(cur, KINDS[target]); }
  }
  function setLight(P) {
    const l = 0.25 + 0.75 * (1 - P.night * 0.85);
    RU.uCol.value.setRGB(0.55 * l, 0.6 * l, 0.7 * l); SH.uLight.value = l;
    SU.uCol.value.setRGB(0.7 * l, 0.75 * l, 0.85 * l);
  }
  return { W, update, setMode, setLight, icon: () => KINDS[target].icon, get kind() { return target; }, setPx(px) { SU.uPx.value = px; } };
}
