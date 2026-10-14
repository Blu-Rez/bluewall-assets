(() => { const b = window.__battle; b.cam.intro = 0; b.scene.children[0].visible = false; b.cam.tz = 120; b.cam.dist = 130; b.cam.az = 0;
 const mk = (m, x) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), m); p.position.set(x, 0.8, 90); b.scene.add(p); return p; };
 mk(new THREE.MeshBasicMaterial({ color: 0xff0000 }), -60); mk(new THREE.MeshLambertMaterial({ color: 0x00ff00 }), -15); mk(new THREE.MeshStandardMaterial({ color: 0x0000ff }), 30); mk(new THREE.MeshStandardMaterial({ color: 0xffff00, vertexColors: false, fog: false }), 75);
 return 1; })()
