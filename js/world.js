// La maison, la lampe, la chose. Tout est construit en géométrie simple avec
// des textures dessinées à la volée : pas d'asset à charger.
import * as THREE from 'three';

const EYE = 1.6;
export const GROUND = 0, CAVE = -2.8, UP = 2.9;

// ---------- textures procédurales ----------
function canvasTex(w, h, draw, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function noiseOver(ctx, w, h, n, a) { for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(0,0,0,${Math.random() * a})`; ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3); } }
const TEX = {};
function textures() {
  TEX.wallpaper = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#4a4336'; c.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { c.fillStyle = x % 64 ? '#453d31' : '#4f473a'; c.fillRect(x, 0, 32, h); }
    c.strokeStyle = 'rgba(40,32,24,.35)'; c.lineWidth = 2;
    for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { c.beginPath(); c.arc(x + 32, y + 32, 10, 0, 6.3); c.stroke(); c.beginPath(); c.moveTo(x + 32, y + 10); c.lineTo(x + 32, y + 54); c.moveTo(x + 10, y + 32); c.lineTo(x + 54, y + 32); c.stroke(); }
    noiseOver(c, w, h, 2500, .35);
    for (let i = 0; i < 6; i++) { const sx = Math.random() * w, sy = Math.random() * h; const g = c.createRadialGradient(sx, sy, 5, sx, sy, 120 + Math.random() * 120); g.addColorStop(0, 'rgba(30,22,14,.55)'); g.addColorStop(1, 'rgba(30,22,14,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  }, [2, 1]);
  TEX.plaster = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#4f4a40'; c.fillRect(0, 0, w, h); noiseOver(c, w, h, 3000, .3); }, [2, 2]);
  TEX.floor = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#3a2a1c'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 64) { const off = (y / 64) % 2 ? 128 : 0; for (let x = -128; x < w; x += 256) { const l = 22 + Math.random() * 14; c.fillStyle = `hsl(26,38%,${l}%)`; c.fillRect(x + off, y, 254, 62); } }
    c.strokeStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < h; y += 64) for (let i = 0; i < 40; i++) { c.beginPath(); const x0 = Math.random() * w; c.moveTo(x0, y + Math.random() * 64); c.lineTo(x0 + 40 + Math.random() * 120, y + Math.random() * 64); c.stroke(); }
    noiseOver(c, w, h, 3000, .4);
  }, [2, 2]);
  TEX.concrete = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#3b3b39'; c.fillRect(0, 0, w, h); noiseOver(c, w, h, 6000, .5); for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(20,20,20,.3)'; c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 30, 1); } }, [3, 3]);
  TEX.ceiling = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#4e4a42'; c.fillRect(0, 0, w, h); noiseOver(c, w, h, 2500, .4); for (let i = 0; i < 4; i++) { const sx = Math.random() * w, sy = Math.random() * h; const g = c.createRadialGradient(sx, sy, 5, sx, sy, 80); g.addColorStop(0, 'rgba(60,40,20,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); } }, [2, 2]);
  TEX.wood = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#2e2016'; c.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(${60 + Math.random() * 40},${35 + Math.random() * 25},${15},.5)`; c.fillRect(0, Math.random() * h, w, 1 + Math.random() * 3); } noiseOver(c, w, h, 1500, .3); });
  TEX.fabric = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#3b3a2f'; c.fillRect(0, 0, w, h); noiseOver(c, w, h, 3000, .4); }, [4, 4]);
  TEX.portrait = canvasTex(256, 320, (c, w, h) => {
    c.fillStyle = '#c9b89a'; c.fillRect(0, 0, w, h); const g = c.createRadialGradient(128, 130, 20, 128, 160, 200); g.addColorStop(0, '#b8a284'); g.addColorStop(1, '#4e4030'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2d2620'; c.beginPath(); c.ellipse(128, 250, 80, 90, 0, Math.PI, 0); c.fill();   // épaules
    c.fillStyle = '#a58f74'; c.beginPath(); c.ellipse(128, 140, 46, 60, 0, 0, 6.3); c.fill();          // visage
    c.fillStyle = '#1d1712'; c.beginPath(); c.ellipse(128, 100, 52, 40, 0, Math.PI, 0); c.fill();     // cheveux
    c.fillStyle = '#1a1410'; c.beginPath(); c.ellipse(110, 135, 5, 4, 0, 0, 6.3); c.ellipse(146, 135, 5, 4, 0, 0, 6.3); c.fill();
    c.strokeStyle = '#4a3a2c'; c.lineWidth = 2; c.beginPath(); c.moveTo(114, 168); c.quadraticCurveTo(128, 172, 142, 168); c.stroke();
    noiseOver(c, w, h, 3000, .5);
  });
}

// ---------- matériaux ----------
const MAT = {};
function materials() {
  MAT.wall = new THREE.MeshStandardMaterial({ map: TEX.wallpaper, roughness: .95 });
  MAT.plaster = new THREE.MeshStandardMaterial({ map: TEX.plaster, roughness: .95 });
  MAT.floor = new THREE.MeshStandardMaterial({ map: TEX.floor, roughness: .7, metalness: .05 });
  MAT.concrete = new THREE.MeshStandardMaterial({ map: TEX.concrete, roughness: 1 });
  MAT.ceiling = new THREE.MeshStandardMaterial({ map: TEX.ceiling, roughness: 1 });
  MAT.wood = new THREE.MeshStandardMaterial({ map: TEX.wood, roughness: .6 });
  MAT.fabric = new THREE.MeshStandardMaterial({ map: TEX.fabric, roughness: 1 });
  MAT.metal = new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: .4, metalness: .8 });
  MAT.glass = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: .05, metalness: .9, transparent: true, opacity: .55 });
  MAT.black = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 });
  MAT.frame = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: .8 });
  MAT.portrait = new THREE.MeshStandardMaterial({ map: TEX.portrait, roughness: .9 });
  MAT.sheet = new THREE.MeshStandardMaterial({ color: 0x8d8778, roughness: 1 });
}

export class World {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, .11);
    this.camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, .05, 60);
    this.hotspots = {};
    this.doors = {};
    this.lights = [];
    textures(); materials();
    this.build();
    this.buildTorch();
    this.buildEntity();
    this.ambient = new THREE.AmbientLight(0x1b1f2a, .06); this.scene.add(this.ambient);
    this.hemi = new THREE.HemisphereLight(0x3a4a66, 0x100c08, 0); this.scene.add(this.hemi);
    this.t = 0;
  }

  // ----- primitives -----
  box(w, h, d, mat, x, y, z, ry = 0, shadow = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry;
    m.castShadow = shadow; m.receiveShadow = true; this.scene.add(m); return m;
  }
  wall(x1, z1, x2, z2, y0, h, mat = MAT.wall, th = .16) {
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
    const m = this.box(len, h, th, mat, (x1 + x2) / 2, y0 + h / 2, (z1 + z2) / 2, -Math.atan2(dz, dx), false);
    if (mat.map) { m.material = mat.clone(); m.material.map = mat.map.clone(); m.material.map.repeat.set(len / 2, h / 2.7); m.material.map.needsUpdate = true; }
    return m;
  }
  slab(x1, z1, x2, z2, y, mat, up = true) {
    const w = Math.abs(x2 - x1), d = Math.abs(z2 - z1);
    const g = new THREE.PlaneGeometry(w, d); const m = new THREE.Mesh(g, mat.clone());
    m.material.map = mat.map.clone(); m.material.map.repeat.set(w / 2, d / 2); m.material.map.needsUpdate = true;
    m.rotation.x = up ? -Math.PI / 2 : Math.PI / 2; m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); m.receiveShadow = true; this.scene.add(m); return m;
  }
  room(x1, z1, x2, z2, y, h, floorMat = MAT.floor, ceilMat = MAT.ceiling) {
    this.slab(x1, z1, x2, z2, y + .001, floorMat, true);
    this.slab(x1, z1, x2, z2, y + h - .001, ceilMat, false);
  }
  door(name, x, z, ry, y0 = GROUND, w = 1, h = 2.05, open = 0) {
    // Charnière à l'origine du groupe ; la porte pivote autour.
    const g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.y = ry;
    const panel = this.box(w, h, .05, MAT.wood, w / 2, h / 2, 0); g.add(panel);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), MAT.metal); knob.position.set(w - .12, h / 2 - .05, .04); g.add(knob);
    g.userData.open = open; g.userData.target = open; panel.rotation.y = 0; g.userData.panel = panel;
    this.scene.add(g); this.doors[name] = g; this.setDoor(name, open, true); return g;
  }
  setDoor(name, v, instant = false) { const d = this.doors[name]; d.userData.target = v; if (instant) { d.userData.open = v; d.userData.panel.rotation.y = -v; } }
  frame(x, z, ry, y0, w = 1, h = 2.05) {
    const g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.y = ry;
    const a = new THREE.Mesh(new THREE.BoxGeometry(.08, h + .08, .22), MAT.frame); a.position.set(-w / 2 - .04, (h + .08) / 2, 0);
    const b = a.clone(); b.position.x = w / 2 + .04;
    const c = new THREE.Mesh(new THREE.BoxGeometry(w + .16, .08, .22), MAT.frame); c.position.set(0, h + .04, 0);
    g.add(a, b, c); this.scene.add(g); return g;
  }
  window(x, z, ry, y0, w = 1.2, h = 1.4) {
    const g = new THREE.Group(); g.position.set(x, y0 + 1, z); g.rotation.y = ry;
    const fr = new THREE.Mesh(new THREE.BoxGeometry(w + .12, h + .12, .1), MAT.frame); g.add(fr);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), MAT.glass); gl.position.z = .062; g.add(gl);
    const gl2 = gl.clone(); gl2.rotation.y = Math.PI; gl2.position.z = -.062; g.add(gl2);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(.04, h, .12), MAT.frame); g.add(cross);
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(w, .04, .12), MAT.frame); g.add(cross2);
    this.scene.add(g); return g;
  }
  portrait(x, z, ry, y = 1.6) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(.7, .86, .04), MAT.frame));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(.58, .74), MAT.portrait); p.position.z = .025; g.add(p);
    this.scene.add(g); return g;
  }
  hotspot(name, x, y, z, r = .55) { this.hotspots[name] = { p: new THREE.Vector3(x, y, z), r, lit: 0 }; }

  // ----- la maison -----
  build() {
    const H = 2.7, Y = GROUND;
    // Rez-de-chaussée : hall, salon, couloir, cuisine.
    this.room(-2, 0, 2, 4, Y, H);
    this.room(-8, -1, -2, 4, Y, H);
    this.room(-1, -8, 1, 0, Y, H);
    this.room(1, -6, 6, -1, Y, H);
    // Hall
    this.wall(-2, 4, -.55, 4, Y, H); this.wall(.55, 4, 2, 4, Y, H); this.wall(-.55, 4, .55, 4, Y + 2.05, .65);
    this.frame(0, 4, 0, Y, 1.1); this.door('front', -.55, 4.02, 0, Y, 1.1);
    this.wall(2, 4, 2, 0, Y, H); this.wall(2, 0, .6, 0, Y, H); this.wall(-.6, 0, -2, 0, Y, H); this.wall(-.6, 0, .6, 0, Y + 2.05, .65); this.frame(0, 0, 0, Y, 1.2);
    this.wall(-2, 0, -2, 1, Y, H); this.wall(-2, 2.6, -2, 4, Y, H); this.wall(-2, 1, -2, 2.6, Y + 2.1, .6);
    // Salon
    this.wall(-8, -1, -8, 4, Y, H); this.wall(-8, 4, -2, 4, Y, H); this.wall(-8, -1, -2, -1, Y, H);
    this.window(-7.92, 1.5, Math.PI / 2, Y); this.window(-5, 3.92, 0, Y);
    this.box(2, .45, .9, MAT.fabric, -5, Y + .3, 2.8, 0); this.box(2, .5, .3, MAT.fabric, -5, Y + .75, 3.2, 0);
    this.box(1.1, .4, .6, MAT.wood, -5, Y + .2, 1.2);
    this.box(.8, .5, .8, MAT.fabric, -7, Y + .3, 0, .4); this.box(.8, .6, .2, MAT.fabric, -7.3, Y + .85, -.3, .4);
    this.box(1.4, 1.1, .5, MAT.plaster, -3.5, Y + .55, -.7); this.box(.9, .7, .3, MAT.black, -3.5, Y + .4, -.65);  // cheminée
    this.portrait(-3.5, -.9, 0, 1.75); this.portrait(-6.4, 3.9, Math.PI, 1.7); this.portrait(-2.1, 3.3, -Math.PI / 2, 1.7);
    this.box(1.6, 2.1, .4, MAT.wood, -3, Y + 1.05, 3.75);   // bibliothèque
    this.box(.7, .9, .7, MAT.wood, -7.2, Y + .45, 3.3, -.5); // fauteuil à bascule
    this.hotspot('salon', -5, Y + 1.2, 2, 1.2);
    // Couloir
    this.wall(-1, 0, -1, -5.9, Y, H); this.wall(-1, -6.9, -1, -8, Y, H); this.wall(-1, -5.9, -1, -6.9, Y + 2.05, .65);
    this.wall(1, 0, 1, -3.2, Y, H); this.wall(1, -4.2, 1, -8, Y, H); this.wall(1, -3.2, 1, -4.2, Y + 2.05, .65);
    this.frame(-1, -6.4, Math.PI / 2, Y); this.door('cave', -1.02, -6.9, -Math.PI / 2, Y, 1, 2.05, 0);
    this.frame(1, -3.7, Math.PI / 2, Y); this.door('kitchen', 1.02, -3.2, Math.PI / 2, Y, 1, 2.05, .2);
    this.box(.35, .9, .35, MAT.wood, -.75, Y + .45, -2, 0); this.box(.22, .4, .22, MAT.plaster, -.75, Y + 1.1, -2, .3); // guéridon + vase
    this.portrait(.95, -1.5, -Math.PI / 2, 1.7); this.portrait(-.95, -4.5, Math.PI / 2, 1.7);
    this.box(.06, .06, .02, MAT.metal, .9, Y + 1.5, 3.9); this.hotspot('key', .9, Y + 1.5, 3.9, .35);
    // clé accrochée à son clou
    this.key = new THREE.Mesh(new THREE.BoxGeometry(.03, .12, .01), MAT.metal); this.key.position.set(.9, Y + 1.42, 3.89); this.scene.add(this.key);
    // Cuisine
    this.wall(1, -1, 6, -1, Y, H); this.wall(6, -1, 6, -6, Y, H); this.wall(1, -6, 6, -6, Y, H);
    this.box(2.4, .9, .6, MAT.plaster, 4.6, Y + .45, -5.6); this.box(.7, 1.8, .7, MAT.metal, 5.5, Y + .9, -1.5);
    this.box(1.2, .75, .8, MAT.wood, 3.2, Y + .38, -3); this.box(.4, .9, .4, MAT.wood, 2.4, Y + .45, -3); this.box(.4, .9, .4, MAT.wood, 4, Y + .45, -3, .3);
    this.window(5.92, -3.5, -Math.PI / 2, Y);
    // Escalier de cave : palier puis marches descendantes vers l'ouest.
    this.room(-2, -7, -1, -5.8, Y, H, MAT.concrete, MAT.ceiling);
    this.wall(-1, -5.8, -2, -5.8, Y, H, MAT.plaster); this.wall(-1, -7, -5.2, -7, CAVE, H + 2.8, MAT.plaster); this.wall(-2, -5.8, -5.2, -5.8, CAVE, H + 2.8, MAT.plaster);
    for (let i = 0; i < 12; i++) { const x = -2 - i * .27, y = Y - i * .235; this.box(.28, .235, 1.2, MAT.concrete, x - .14, y - .1175, -6.4, 0, false); }
    this.box(3.3, .1, 1.2, MAT.concrete, -3.65, CAVE - .05, -6.4, 0, false);
    this.slab(-2, -7, -5.2, -5.8, Y + H - .001, MAT.ceiling, false);
    // Cave
    this.room(-9, -9, -5.2, -4, CAVE, 2.2, MAT.concrete, MAT.concrete);
    this.wall(-9, -9, -9, -4, CAVE, 2.2, MAT.concrete); this.wall(-9, -4, -5.2, -4, CAVE, 2.2, MAT.concrete); this.wall(-9, -9, -5.2, -9, CAVE, 2.2, MAT.concrete);
    this.wall(-5.2, -4, -5.2, -5.8, CAVE, 2.2, MAT.concrete); this.wall(-5.2, -7, -5.2, -9, CAVE, 2.2, MAT.concrete);
    this.box(.4, .6, .12, MAT.metal, -8.9, CAVE + 1.5, -6.5); this.hotspot('fuse', -8.9, CAVE + 1.5, -6.5, .5);
    this.box(1.6, 1, .8, MAT.wood, -7, CAVE + .5, -8.4); this.box(.5, .7, .5, MAT.metal, -6, CAVE + .35, -4.5);
    for (let i = 0; i < 5; i++) this.box(.3 + Math.random() * .3, .3 + Math.random() * .4, .3, MAT.wood, -8.3 + i * .55, CAVE + .2, -4.4, Math.random());
    this.box(.6, .9, .4, MAT.fabric, -5.7, CAVE + .45, -8.6, .3);   // sac / silhouette au sol
    // Escalier montant au bout du couloir (z de -8 à -12) puis palier.
    this.wall(-1, -8, -1, -13, Y, 5.6, MAT.plaster); this.wall(1, -8, 1, -13, Y, UP, MAT.plaster); this.wall(-1, -13, 1, -13, Y, 5.6, MAT.plaster);
    for (let i = 0; i < 16; i++) { const z = -8 - i * .25, y = Y + i * .181; this.box(2, .181, .26, MAT.wood, 0, y + .09, z - .13, 0, false); }
    this.slab(-1, -12, 1, -13, UP + .001, MAT.floor, true);
    this.slab(-1, -8, 1, -13, Y + 5.6 - .001, MAT.ceiling, false);
    this.box(.05, .9, 4, MAT.wood, .9, Y + 1.9, -10, 0, false); // rampe
    // Étage : couloir vers l'est, chambre.
    this.room(1, -14, 7, -12, UP, 2.6);
    this.wall(1, -14, 7, -14, UP, 2.6); this.wall(7, -14, 7, -12, UP, 2.6);
    this.wall(1, -12, 3.5, -12, UP, 2.6); this.wall(4.5, -12, 7, -12, UP, 2.6); this.wall(3.5, -12, 4.5, -12, UP + 2.05, .55);
    this.wall(1, -13, 1, -14, UP, 2.6);
    this.frame(4, -12, 0, UP); this.door('bedroom', 4.5, -12.02, Math.PI, UP, 1, 2.05, 1.55);
    this.portrait(2, -13.9, 0, UP + 1.6); this.portrait(5.5, -13.9, 0, UP + 1.6);
    this.box(.35, .9, .35, MAT.wood, 6.6, UP + .45, -13.5);
    this.room(1, -12, 7, -7, UP, 2.6);
    this.wall(1, -12, 1, -7, UP, 2.6); this.wall(1, -7, 7, -7, UP, 2.6); this.wall(7, -7, 7, -12, UP, 2.6);
    this.window(6.92, -9.5, -Math.PI / 2, UP);
    this.box(1.5, .5, 2, MAT.wood, 5.9, UP + .25, -8.2); this.box(1.4, .25, 1.9, MAT.sheet, 5.9, UP + .62, -8.2); this.box(.5, .15, 1.3, MAT.sheet, 5.9, UP + .8, -7.6);
    this.box(.5, .6, .5, MAT.wood, 6.6, UP + .3, -9.6);
    this.lamp = new THREE.Group(); this.lamp.position.set(6.6, UP + .6, -9.6);
    const lb = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, .18, 10), MAT.metal); lb.position.y = .09; this.lamp.add(lb);
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .04, .22, 10), MAT.glass); lg.position.y = .3; this.lamp.add(lg);
    this.scene.add(this.lamp); this.hotspot('lamp', 6.6, UP + .9, -9.6, .45);
    this.box(.6, 2.2, 1, MAT.wood, 1.3, UP + 1.1, -9.5); this.door('wardrobe', 1.62, -9, Math.PI / 2, UP, 1, 2.1, 0);
    this.box(.6, .9, .6, MAT.fabric, 2.2, UP + .45, -7.7, .6);
    this.portrait(4, -7.1, Math.PI, UP + 1.7);
    this.hotspot('window', 6.9, UP + 1.5, -9.5, .8);
    this.hotspot('wardrobe', 1.6, UP + 1.2, -9.5, .8);
    // Lumières de la maison (allumées une seconde quand le disjoncteur remonte)
    [[0, Y + 2.5, 2], [-5, Y + 2.5, 1.5], [0, Y + 2.5, -4], [3.5, Y + 2.5, -3.5], [-7, CAVE + 2, -6.5], [4, UP + 2.4, -13], [4, UP + 2.4, -9.5], [0, UP + 2.4, -12.5]].forEach(([x, y, z]) => {
      const l = new THREE.PointLight(0xffd9a0, 0, 9, 1.6); l.position.set(x, y, z); this.scene.add(l); this.lights.push(l);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x000000 })); bulb.position.set(x, y + .1, z); this.scene.add(bulb); l.userData.bulb = bulb;
    });
    this.housePower(false);
  }
  housePower(on) { this.lights.forEach(l => { l.intensity = on ? 18 : 0; l.userData.bulb.material.emissive.setHex(on ? 0xffd9a0 : 0); }); }

  // ----- lampe torche -----
  buildTorch() {
    this.torch = new THREE.SpotLight(0xfff0d6, 0, 22, .5, .75, 1.4);
    this.torch.castShadow = true; this.torch.shadow.mapSize.set(1024, 1024); this.torch.shadow.bias = -.0015; this.torch.shadow.camera.near = .2; this.torch.shadow.camera.far = 25;
    this.torchTarget = new THREE.Object3D(); this.scene.add(this.torchTarget); this.torch.target = this.torchTarget;
    this.scene.add(this.torch);
    this.fill = new THREE.PointLight(0xfff0d6, 0, 3, 2); this.scene.add(this.fill);
    this.torchOn = false; this.torchPower = 1; this.flicker = 0; this.ray = new THREE.Raycaster(); this.ray.far = 12; this.expo = 1;
  }

  // ----- la chose -----
  buildEntity() {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.2, 1.6, 4, 10), m); body.position.y = 1.2; body.scale.set(.85, 1, .7); body.castShadow = true; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 10), m); head.position.y = 2.2; head.scale.set(.85, 1.25, .9); head.rotation.z = .25; head.castShadow = true; g.add(head);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.045, 1.1, 3, 6), m); arm.position.set(-.28, 1.25, 0); arm.rotation.z = .08; g.add(arm);
    const arm2 = arm.clone(); arm2.position.x = .28; arm2.rotation.z = -.08; g.add(arm2);
    const em = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xd8d0c0, emissiveIntensity: .35, roughness: .2 });
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), em); e1.position.set(-.05, 2.24, .12); g.add(e1);
    const e2 = e1.clone(); e2.position.x = .05; g.add(e2);
    g.visible = false; g.userData.eyes = em; this.scene.add(g); this.entity = g;
    this.entityState = { visible: false, chasing: false, speed: .9, target: null };
  }
  showEntity(x, y, z, faceTo = null) {
    this.entity.position.set(x, y, z); this.entity.visible = true; this.entityState.visible = true;
    if (faceTo) this.entity.lookAt(faceTo.x, y + 1.2, faceTo.z); else this.entity.lookAt(this.camera.position.x, y + 1.2, this.camera.position.z);
  }
  hideEntity() { this.entity.visible = false; this.entityState.visible = false; this.entityState.chasing = false; this.entityState.floorY = null; }
  entityDist() { return this.entity.position.distanceTo(new THREE.Vector3(this.camera.position.x, this.entity.position.y, this.camera.position.z)); }

  // ----- vue -----
  setCamera(x, z, floorY, yaw) {
    this.camera.position.set(x, floorY + EYE, z); this.camYaw = yaw; this.camPitch = 0; this.beamYaw = yaw; this.beamPitch = 0; this.floorY = floorY;
  }
  beamDir() {
    const y = this.beamYaw, p = this.beamPitch;
    return new THREE.Vector3(Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p));
  }
  // Angle (deg) entre le faisceau et un point ; Infinity si hors portée.
  beamAngleTo(p, maxDist = 14) {
    const v = p.clone().sub(this.camera.position); const d = v.length(); if (d > maxDist) return Infinity;
    return THREE.MathUtils.radToDeg(this.beamDir().angleTo(v.normalize()));
  }
  isLit(p, deg = 14, maxDist = 12) { return this.torchOn && this.torchPower > .3 && this.beamAngleTo(p, maxDist) < deg; }

  update(dt, input) {
    this.t += dt;
    // Le téléphone donne un décalage (offYaw/offPitch) par rapport au calage.
    // La lampe se déplace dans le champ de vision ; au-delà de 22°, la vue
    // pivote comme avec un joystick, et la lampe reste au bord.
    const sway = Math.sin(this.t * 1.7) * .006 + Math.sin(this.t * 4.3) * .003;
    const off = input.offYaw, dz = THREE.MathUtils.degToRad(22), maxRel = THREE.MathUtils.degToRad(32);
    if (Math.abs(off) > dz) {
      const over = Math.abs(off) - dz;
      const rate = Math.min(THREE.MathUtils.degToRad(130), over / THREE.MathUtils.degToRad(18) * THREE.MathUtils.degToRad(90));
      this.camYaw += Math.sign(off) * rate * dt;
    }
    this.beamYaw = this.camYaw + THREE.MathUtils.clamp(off, -maxRel, maxRel);
    this.beamPitch = THREE.MathUtils.clamp(input.offPitch, -1.1, .8);
    const pt = THREE.MathUtils.clamp(this.beamPitch * .55, -.45, .4);
    this.camPitch += (pt - this.camPitch) * Math.min(1, dt * 4);
    this.camera.rotation.set(0, 0, 0); this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = -this.camYaw + sway * 2; this.camera.rotation.x = this.camPitch + sway;
    // Torche
    const dir = this.beamDir();
    this.torch.position.copy(this.camera.position).add(new THREE.Vector3(0, -.15, 0));
    this.torchTarget.position.copy(this.camera.position).add(dir.multiplyScalar(6));
    // Auto-exposition : une surface proche renvoie moins de lumière, sinon tout crame.
    if ((this._rayTick = (this._rayTick || 0) + 1) % 3 === 0) {
      this.ray.set(this.camera.position, this.beamDir());
      const hit = this.ray.intersectObjects(this.scene.children, true).find(h => h.object.visible && h.object !== this.entity && !this.entity.children.includes(h.object));
      const d = hit ? hit.distance : 12;
      this.expoTarget = THREE.MathUtils.clamp(Math.pow(d / 3.2, .9), .12, 1);
    }
    this.expo += ((this.expoTarget || 1) - this.expo) * Math.min(1, dt * 6);
    let pw = (this.torchOn ? this.torchPower : 0) * this.expo;
    if (this.flicker > 0) { this.flicker -= dt; pw *= Math.random() < .55 ? (Math.random() * .7) : 1; }
    this.torch.intensity = 62 * pw; this.fill.intensity = 1.0 * pw; this.fill.position.copy(this.camera.position);
    // Portes
    for (const d of Object.values(this.doors)) { const u = d.userData; u.open += (u.target - u.open) * Math.min(1, dt * 2.2); u.panel.rotation.y = -u.open; }
    // Hotspots : temps d'éclairage cumulé
    for (const h of Object.values(this.hotspots)) { if (this.isLit(h.p, 13, 8)) h.lit += dt; else h.lit = Math.max(0, h.lit - dt * 2); }
    // La chose
    const E = this.entityState;
    if (this.entity.visible) {
      const lit = this.isLit(this.entity.position.clone().setY(this.entity.position.y + 1.6), 15, 14);
      this.entity.userData.eyes.emissiveIntensity = lit ? 2.5 : .35 + Math.sin(this.t * 3) * .1;
      E.lit = lit; E.litTime = lit ? (E.litTime || 0) + dt : 0; E.darkTime = lit ? 0 : (E.darkTime || 0) + dt;
      this.entity.position.y += Math.sin(this.t * 2.1) * .0015;
      if (E.chasing) {
        const to = new THREE.Vector3(this.camera.position.x, this.entity.position.y, this.camera.position.z).sub(this.entity.position);
        const d = to.length(); to.normalize();
        if (!lit && E.darkTime > .5) this.entity.position.add(to.multiplyScalar(E.speed * dt));
        else if (lit && E.litTime > 1.5 && d < 6) this.entity.position.add(to.multiplyScalar(-.25 * dt));
        if (E.floorY != null) this.entity.position.y += (E.floorY - this.entity.position.y) * Math.min(1, dt * 1.5);
        this.entity.lookAt(this.camera.position.x, this.entity.position.y + 1.2, this.camera.position.z);
      }
    }
  }
  resize() { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); }
}
