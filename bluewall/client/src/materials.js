// Shared materials (created once; every static piece is batched per material).
import * as THREE from 'three';
import * as T from './textures.js';

export function makeMaterials() {
  const stone = T.stoneTextures(3, [118, 124, 140]);
  const stoneB = T.stoneTextures(4, [96, 104, 124]);
  const roof = T.roofTextures(5);
  const stoneL = T.stoneTextures(6, [184, 190, 202], '#7a7e88', 42);
  const M = {};
  M.stone = new THREE.MeshStandardMaterial({ map: stone.map, normalMap: stone.normalMap, normalScale: new THREE.Vector2(1.1, 1.1), roughness: 0.92, metalness: 0.0, vertexColors: true, envMapIntensity: 0.35 });
  M.stoneDark = new THREE.MeshStandardMaterial({ map: stoneB.map, normalMap: stoneB.normalMap, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.95, vertexColors: true, envMapIntensity: 0.3 });
  M.stoneLight = new THREE.MeshStandardMaterial({ map: stoneL.map, normalMap: stoneL.normalMap, normalScale: new THREE.Vector2(1.3, 1.3), roughness: 0.9, vertexColors: true, envMapIntensity: 0.45 });
  M.roof = new THREE.MeshStandardMaterial({ map: roof.map, normalMap: roof.normalMap, roughness: 0.7, metalness: 0.05, vertexColors: true, envMapIntensity: 0.5 });
  M.plaster = new THREE.MeshStandardMaterial({ map: T.plasterTexture(), roughness: 0.95, vertexColors: true, envMapIntensity: 0.25 });
  M.wood = new THREE.MeshStandardMaterial({ map: T.woodTexture(), roughness: 0.9, vertexColors: true, envMapIntensity: 0.25 });
  M.woodLight = new THREE.MeshStandardMaterial({ map: T.woodTexture(12, [205, 160, 108]), roughness: 0.85, vertexColors: true, envMapIntensity: 0.3 });
  M.metal = new THREE.MeshStandardMaterial({ color: 0x5b6270, roughness: 0.45, metalness: 0.75, vertexColors: true, envMapIntensity: 0.9 });
  M.gold = new THREE.MeshStandardMaterial({ color: 0xffc94a, roughness: 0.3, metalness: 1.0, emissive: 0x6b4300, emissiveIntensity: 0.5, vertexColors: true, envMapIntensity: 1.2 });
  M.fabric = new THREE.MeshStandardMaterial({ map: T.stripeTexture(), roughness: 1, vertexColors: true, side: THREE.DoubleSide, envMapIntensity: 0.2 });
  M.cloth = new THREE.MeshStandardMaterial({ roughness: 1, vertexColors: true, side: THREE.DoubleSide, envMapIntensity: 0.2 });
  M.window = new THREE.MeshStandardMaterial({ color: 0x331a05, emissive: 0xffa040, emissiveIntensity: 2.2, roughness: 1, vertexColors: true });
  M.dark = new THREE.MeshStandardMaterial({ color: 0x14100d, roughness: 1, vertexColors: true });
  M.fire = new THREE.MeshBasicMaterial({ color: 0xffb347, toneMapped: false });
  const rune = T.runeTexture();
  M.rune = new THREE.MeshStandardMaterial({ color: 0x0b1830, emissive: 0x58b4ff, emissiveMap: rune, emissiveIntensity: 2.4, roughness: 0.6, vertexColors: true });
  M.runeTex = rune;
  M.crystal = new THREE.MeshStandardMaterial({ color: 0x7fd0ff, emissive: 0x2a8cff, emissiveIntensity: 2.2, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.92, flatShading: true });
  M.flag = new THREE.MeshStandardMaterial({ map: T.flagTexture(), side: THREE.DoubleSide, roughness: 1, emissive: 0x0d2a5c, emissiveIntensity: 0.35 });
  M.glow = T.glowTexture('rgba(255,190,110,1)');
  M.glowBlue = T.glowTexture('rgba(120,200,255,1)');
  M.glowWhite = T.glowTexture('rgba(255,255,255,1)');
  M.cloud = T.cloudTexture();
  M.detail = T.detailTexture();
  return M;
}
