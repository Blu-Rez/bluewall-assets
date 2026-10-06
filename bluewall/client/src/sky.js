// Sky: physically based day sky (Preetham scattering + volumetric-looking
// clouds, three.js Sky) blended with a night dome (moon glow, clouds, stars),
// a real sun disc with lens flare, and lightning flashes. Driven by
// tod.sample() and the weather state every frame.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';
import { rng } from './noise.js';

function flareTex(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (kind === 'core') { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.08, 'rgba(255,250,230,0.95)'); gr.addColorStop(0.25, 'rgba(255,220,160,0.35)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); }
  else if (kind === 'ring') { gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(160,200,255,0.0)'); gr.addColorStop(0.85, 'rgba(170,210,255,0.35)'); gr.addColorStop(1, 'rgba(160,200,255,0)'); }
  else { gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.5, 'rgba(200,220,255,0.18)'); gr.addColorStop(1, 'rgba(200,220,255,0)'); }
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const NOISE_GLSL = `
  vec2 bwGrad(vec2 i){ vec3 p = fract(i.xyx*vec3(0.1031,0.1030,0.0973)); p += dot(p, p.yzx+33.33); return fract((p.xx+p.yz)*p.zy)*2.0-1.0; }
  float bwNoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
    return mix(mix(dot(bwGrad(i),f), dot(bwGrad(i+vec2(1,0)),f-vec2(1,0)),u.x), mix(dot(bwGrad(i+vec2(0,1)),f-vec2(0,1)), dot(bwGrad(i+vec2(1,1)),f-vec2(1,1)),u.x), u.y)*1.6; }
  float bwFbm(vec2 p, float d){ float r=0.0, a=1.0; for(int i=0;i<4;i++){ r+=a*bwNoise(p); a*=0.5; p=p*2.0+d; } return r; }`;

export function buildSky(scene, M, { flare = true, stars: withStars = true, env = false } = {}) {
  const group = new THREE.Group(); group.name = 'sky';

  // ------------------------------------------------ day: three.js Sky (Preetham + clouds)
  const day = new Sky(); day.scale.setScalar(2000); day.renderOrder = -11; day.frustumCulled = false;
  const DU = day.material.uniforms;
  DU.turbidity.value = 4; DU.rayleigh.value = 1.6; DU.mieCoefficient.value = 0.005; DU.mieDirectionalG.value = 0.8;
  DU.cloudScale.value = 0.00022; DU.cloudSpeed.value = 0.00003; DU.cloudCoverage.value = 0.35; DU.cloudDensity.value = 0.55; DU.cloudElevation.value = 0.55;
  day.material.uniforms.uGain = { value: 1.0 }; day.material.uniforms.uFlash = { value: 0 }; day.material.uniforms.uGrey = { value: 0 };
  day.material.fragmentShader = day.material.fragmentShader
    .replace('uniform float time;', 'uniform float time; uniform float uGain; uniform float uFlash; uniform float uGrey;')
    .replace(/gl_FragColor = vec4\(\s*([a-zA-Z]+)\s*,\s*1\.0\s*\);/, (m, v) => `{ vec3 c = ${v} * uGain; float l = dot(c, vec3(0.3,0.55,0.15)); c = mix(c, vec3(l)*vec3(0.92,0.96,1.05), uGrey); c += vec3(0.55,0.65,0.9)*uFlash; gl_FragColor = vec4(c, 1.0); }`);
  group.add(day);

  // ------------------------------------------------ night dome (transparent overlay, alpha = night)
  const U = {
    uZen: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() },
    uMoon: { value: new THREE.Vector3(0, 1, 0) }, uMoonUp: { value: 1 }, uA: { value: 1 },
    uCover: { value: 0.3 }, uTime: { value: 0 }, uFlash: { value: 0 }, uCloudCol: { value: new THREE.Color(0.06, 0.08, 0.14) },
  };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1400, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, transparent: true, uniforms: U,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w; }',
    fragmentShader: `varying vec3 vDir; uniform vec3 uZen, uMid, uHor, uMoon, uCloudCol; uniform float uMoonUp, uA, uCover, uTime, uFlash;
      ${NOISE_GLSL}
      void main(){
        vec3 d = normalize(vDir); float h = clamp(d.y, -0.25, 1.0);
        vec3 c = mix(uHor, uMid, smoothstep(0.0, 0.28, h)); c = mix(c, uZen, smoothstep(0.28, 0.95, h));
        c = mix(c, uHor * 0.45, smoothstep(0.02, -0.25, h));
        float m = max(dot(d, uMoon), 0.0);
        vec3 moonGlow = vec3(0.25, 0.4, 0.7) * (pow(m, 18.0) * 0.5 + pow(m, 4.0) * 0.15) * uMoonUp;
        c += moonGlow;
        // clouds lit by the moon
        if (d.y > 0.0) {
          vec2 uv = d.xz / (d.y * 0.45 + 0.05) * 0.22 + uTime * 0.004;
          float n = clamp(bwFbm(uv, uTime * 0.01) * 0.7 + 0.5, 0.0, 1.0);
          float th = 1.0 - uCover; float mask = smoothstep(th, th + 0.3, n) * smoothstep(0.0, 0.08, d.y);
          vec3 cc = uCloudCol * (0.7 + 0.6 * pow(m, 3.0) * uMoonUp) + vec3(0.6,0.7,1.0) * uFlash * 0.6;
          c = mix(c, cc, mask * 0.92);
        }
        c += vec3(0.5, 0.6, 0.9) * uFlash * 0.35;
        gl_FragColor = vec4(c, uA);
      }`,
  }));
  dome.renderOrder = -10; dome.frustumCulled = false;
  group.add(dome);

  // ------------------------------------------------ stars
  const r = rng(77), NS = 1800, sp = new Float32Array(NS * 3), ss = new Float32Array(NS), sph = new Float32Array(NS);
  for (let i = 0; i < NS; i++) {
    const u = r(), v = 0.06 + r() * 0.94, th = u * Math.PI * 2, y = Math.pow(v, 0.8), rr = Math.sqrt(1 - y * y);
    sp[i * 3] = Math.cos(th) * rr * 1300; sp[i * 3 + 1] = y * 1300; sp[i * 3 + 2] = Math.sin(th) * rr * 1300;
    ss[i] = r() < 0.06 ? 3.2 + r() * 2 : 1.1 + r() * 1.6; sph[i] = r() * 6.28;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setAttribute('size', new THREE.BufferAttribute(ss, 1));
  sg.setAttribute('phase', new THREE.BufferAttribute(sph, 1));
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uA: { value: 1 } },
    vertexShader: `attribute float size; attribute float phase; uniform float uTime; uniform float uPx; varying float vA;
      void main(){ vec4 p = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w*0.9999;
        vA = 0.55 + 0.45*sin(uTime*1.7 + phase*3.0); gl_PointSize = size*uPx; }`,
    fragmentShader: `uniform float uA; varying float vA; void main(){ vec2 d = gl_PointCoord-0.5; float a = smoothstep(0.5,0.0,length(d)); gl_FragColor = vec4(vec3(0.8,0.88,1.0), a*vA*uA); }`,
  });
  const stars = new THREE.Points(sg, starMat); stars.frustumCulled = false; stars.renderOrder = -9; stars.visible = withStars;
  group.add(stars);

  // ------------------------------------------------ moon + halo
  const moonC = document.createElement('canvas'); moonC.width = moonC.height = 256;
  const g = moonC.getContext('2d'), mr = rng(5);
  const gr = g.createRadialGradient(118, 118, 10, 128, 128, 120);
  gr.addColorStop(0, '#fbfdff'); gr.addColorStop(0.8, '#dfe9f7'); gr.addColorStop(1, '#b9c9e2');
  g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 26; i++) {
    const x = 40 + mr() * 176, y = 40 + mr() * 176, rad = 5 + mr() * 20;
    if (Math.hypot(x - 128, y - 128) + rad > 118) continue;
    g.fillStyle = `rgba(140,160,190,${0.18 + mr() * 0.2})`; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  const moonTex = new THREE.CanvasTexture(moonC); moonTex.colorSpace = THREE.SRGBColorSpace;
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, fog: false, depthWrite: false, toneMapped: false, color: 0xe8f0ff, transparent: true }));
  moon.scale.setScalar(64); moon.renderOrder = -8; group.add(moon);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowBlue, fog: false, depthWrite: false, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(360); halo.renderOrder = -8; group.add(halo);

  // ------------------------------------------------ sun: glare sprite + lens flare
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowWhite, fog: false, depthWrite: false, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, color: 0xfff0d0 }));
  sunGlow.scale.setScalar(220); sunGlow.renderOrder = -8; group.add(sunGlow);
  let lens = null;
  if (flare) {
    const sunL = new THREE.Object3D(); // carrier for the flare only (a real light would cost every lit material)
    lens = new Lensflare();
    const tc = flareTex('core'), tr = flareTex('ring'), th = flareTex('hex');
    lens.addElement(new LensflareElement(tc, 420, 0, new THREE.Color(1, 0.95, 0.85)));
    lens.addElement(new LensflareElement(th, 60, 0.45, new THREE.Color(0.6, 0.75, 1)));
    lens.addElement(new LensflareElement(th, 90, 0.65, new THREE.Color(0.7, 0.8, 1)));
    lens.addElement(new LensflareElement(tr, 160, 0.85, new THREE.Color(0.8, 0.9, 1)));
    lens.addElement(new LensflareElement(th, 50, 1.0, new THREE.Color(0.9, 0.85, 1)));
    sunL.add(lens); group.add(sunL); lens.carrier = sunL;
  }
  scene.add(group);

  let lastCover = 0;
  // W: weather sample { cover, grey, flash, turbidity }
  function setTime(P, W = null) {
    const cover = W ? W.cover : 0.3, flash = W ? W.flash : 0, grey = W ? W.grey : 0;
    lastCover = cover;
    DU.sunPosition.value.copy(P.sunDir);
    DU.turbidity.value = 2.2 + (W ? W.turbidity : 0) * 7;
    DU.rayleigh.value = 2.3 + P.night * 0.8 - grey * 1.2;
    DU.cloudCoverage.value = cover; DU.cloudDensity.value = 0.45 + cover * 0.45;
    DU.showSunDisc.value = env ? 0 : 1 - THREE.MathUtils.smoothstep(cover, 0.55, 0.85);
    DU.uGain.value = (env ? 0.17 : 0.34) * (1 - grey * 0.45) * THREE.MathUtils.lerp(1, 0.32, THREE.MathUtils.smoothstep(P.sunDir.y, 0.1, 0.9)); DU.uGrey.value = grey; DU.uFlash.value = flash;
    U.uZen.value.copy(P.zen); U.uMid.value.copy(P.mid); U.uHor.value.copy(P.hor);
    U.uMoon.value.copy(P.moonDir); U.uMoonUp.value = P.moonUp * P.night * (1 - cover * 0.6);
    U.uA.value = THREE.MathUtils.smoothstep(P.night, 0.05, 0.75); U.uCover.value = cover; U.uFlash.value = flash;
    U.uCloudCol.value.setRGB(0.05 + 0.04 * (1 - grey), 0.065 + 0.04 * (1 - grey), 0.11 + 0.04 * (1 - grey));
    dome.visible = U.uA.value > 0.002;
    starMat.uniforms.uA.value = P.stars * (1 - cover * 0.95);
    moon.position.copy(P.moonDir).multiplyScalar(1250); halo.position.copy(moon.position);
    moon.material.opacity = P.moonUp * (1 - cover * 0.8); halo.material.opacity = 0.55 * P.moonUp * P.night * (1 - cover * 0.7);
    sunGlow.position.copy(P.sunDir).multiplyScalar(1250); sunGlow.material.opacity = 0.75 * P.sunUp * (1 - cover * 0.9);
    sunGlow.material.color.copy(P.key);
    if (lens) {
      lens.carrier.position.copy(P.sunDir).multiplyScalar(1200);
      const k = P.sunUp * (1 - THREE.MathUtils.smoothstep(cover, 0.45, 0.8));
      lens.visible = k > 0.03;
      for (const e of lens.elements || []) e.color && e.color.setScalar && 0;
      lens.scale.setScalar(1); lens.userData.k = k;
    }
  }
  return {
    group, moon, starMat, setTime, day,
    update(t, dt, pxRatio, cam) {
      starMat.uniforms.uTime.value = t; starMat.uniforms.uPx.value = pxRatio;
      DU.time.value = t; U.uTime.value = t;
      // keep the sky centred on the camera so clouds/sun never parallax
      if (cam) { day.position.copy(cam.position); dome.position.copy(cam.position); stars.position.copy(cam.position); }
      void lastCover;
    },
  };
}

// lightweight sky scene used to (re)build the PMREM environment map
export function envSky(M) {
  const s = new THREE.Scene();
  const sky = buildSky(s, M, { flare: false, stars: false, env: true });
  return { scene: s, sky };
}
