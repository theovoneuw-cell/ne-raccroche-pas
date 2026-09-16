// Écran principal : rendu, entrées (téléphone ou souris), interface, et
// exécution du scénario chapitre par chapitre.
import * as THREE from 'three';
import { World, loadTextures } from './world.js';
import { Sfx } from './audio.js';
import { Host, makeCode, phoneUrl } from './net.js';
import { chapters } from './story.js';

const $ = id => document.getElementById(id);
const RESTART = Symbol('restart');

// ---------- rendu ----------
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
let world = null;
const worldReady = loadTextures().catch(() => {}).then(() => { world = new World(renderer); });
let VOICES = {}; fetch('assets/voice/manifest.json').then(r => r.json()).then(m => { VOICES = m; }).catch(() => {});
const hostVoice = new Audio();
const sfx = new Sfx();
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); world && world.resize(); });

// Grain animé + neige (parasites) sur canvas 2D.
const grain = $('grain'), gctx = grain.getContext('2d');
const stat = $('static'), sctx = stat.getContext('2d');
function drawGrain() {
  const w = grain.width = 160, h = grain.height = 90;
  const img = gctx.createImageData(w, h); const d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = 90 + Math.random() * 80; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  gctx.putImageData(img, 0, 0);
}
function drawStatic() {
  const w = stat.width = 320, h = stat.height = 180;
  const img = sctx.createImageData(w, h); const d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  sctx.putImageData(img, 0, 0);
}

// ---------- entrées ----------
const input = { offYaw: 0, offPitch: 0, solo: false, ready: false };
let phoneInfo = { vib: false };
const listeners = { tap: [], torch: [], answer: [], decline: [], choice: [], said: [], ready: [] };
function emit(k, v) { const l = listeners[k]; listeners[k] = []; l.forEach(f => f(v)); }
function once(k) { return new Promise(r => listeners[k].push(r)); }

function onPhoneMessage(m) {
  switch (m.t) {
    case 'o': input.offYaw = THREE.MathUtils.degToRad(m.y); input.offPitch = THREE.MathUtils.degToRad(m.p); break;
    case 'hello': phoneInfo = m; break;
    case 'ready': input.ready = true; emit('ready'); break;
    case 'tap': emit('tap'); break;
    case 'torch': setTorch(!!m.on, false); emit('torch', !!m.on); break;
    case 'answer': emit('answer'); break;
    case 'decline': emit('decline'); break;
    case 'choice': emit('choice', m.id); break;
    case 'said': emit('said', m.id); break;
  }
}
function setTorch(on, tell = true) {
  if (!world) return;
  if (world.torchOn !== on) { sfx.ctx && sfx.click(.35); }
  world.torchOn = on; if (tell) send({ t: 'ui', torch: on });
}

// Mode sans téléphone : souris = lampe, clic = toucher, T = torche, R/E = répondre/refuser, 1/2 = choix.
function enableSolo() {
  input.solo = true; $('title').classList.add('hide');
  addEventListener('mousemove', e => { input.offYaw = (e.clientX / innerWidth - .5) * 1.4; input.offPitch = -(e.clientY / innerHeight - .5) * 1.5; });
  addEventListener('click', () => emit('tap'));
  addEventListener('keydown', e => {
    if (e.key === 't' || e.key === 'T') { setTorch(!world.torchOn); emit('torch', world.torchOn); }
    if (e.key === 'r' || e.key === 'R') emit('answer'); if (e.key === 'e' || e.key === 'E') emit('decline');
    if (e.key === '1') emit('choice', G._choices[0]); if (e.key === '2') emit('choice', G._choices[1]);
  });
  startGame();
}

// ---------- liaison téléphone ----------
const code = makeCode();
let host = null;
function send(m) { if (host) host.send(m); }
function startHost() {
  host = new Host(code, {
    onOpen() {
      $('status').textContent = 'En attente du téléphone';
      $('qr').classList.add('show'); new QRCode($('qr'), { text: phoneUrl(code), width: Math.min(260, innerHeight * .34), height: Math.min(260, innerHeight * .34), correctLevel: QRCode.CorrectLevel.M });
      $('code').textContent = code;
    },
    onPhone() {
      $('status').textContent = 'Téléphone connecté'; $('disc').classList.remove('show');
      send({ t: 'ui', torch: world ? world.torchOn : false });
      if (!started) { $('title').classList.add('hide'); startGame(); }
    },
    onMessage: onPhoneMessage,
    onLost() { $('disc').classList.add('show'); },
    onError(e) { $('status').textContent = 'Erreur réseau : ' + e.type; }
  });
}
$('solo').addEventListener('click', enableSolo);
startHost();

// ---------- API du scénario ----------
let started = false, dead = null, deadP = null;
const G = {
  get world() { return world; }, sfx, send, input, RESTART, _choices: [], gen: 0, _timers: [],
  every(fn, ms) { const id = setInterval(fn, ms); G._timers.push(id); return id; },
  clearTimers() { G._timers.forEach(clearInterval); G._timers = []; },
  get solo() { return input.solo; },
  _race(p) { return Promise.race([p, deadP]); },
  wait(ms) { return G._race(new Promise(r => setTimeout(r, ms))); },
  until(fn, every = 60) { return G._race(new Promise(r => { const i = setInterval(() => { if (fn()) { clearInterval(i); r(); } }, every); })); },
  tap() { return G._race(once('tap')); },
  ready() { return (input.solo || input.ready) ? Promise.resolve() : G._race(once('ready')); },
  hint(t) { const h = $('hint'); h.textContent = t; h.classList.toggle('show', !!t); },
  sub(who, text) {
    const s = $('sub'); s.className = 'show s-' + who; s.querySelector('.who').textContent = { maelle: 'Maëlle', maelle2: 'Maëlle', lou: 'Lou', thing: '…', maman: 'Maman' }[who] || ''; s.querySelector('.txt').textContent = text;
  },
  subClear() { $('sub').classList.remove('show'); },
  async say(who, text, { hold = 600, sub = true } = {}) {
    if (sub) G.sub(who, text);
    const dur = 900 + text.length * 62;
    const file = VOICES[who + '|' + text]; const url = file ? new URL('assets/voice/' + file, location.href).href : null;
    if (who === 'lou') { await G.wait(dur); }
    else if (input.solo) {
      await G._race(new Promise(r => {
        const done = () => r(); setTimeout(done, dur + 2500);
        if (url) { hostVoice.src = url; hostVoice.onended = done; hostVoice.onerror = done; hostVoice.play().catch(done); }
        else if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; u.rate = who === 'thing' ? .7 : 1; u.pitch = who === 'thing' ? .1 : 1.05; u.onend = done; u.onerror = done; speechSynthesis.speak(u); }
        else done();
      }));
    } else {
      const id = Math.random().toString(36).slice(2);
      send({ t: 'say', id, voice: who, text, url });
      await G._race(new Promise(r => { const f = v => { if (v === id) r(); else listeners.said.push(f); }; listeners.said.push(f); setTimeout(r, dur + 2500); }));
    }
    await G.wait(hold); if (sub) G.subClear();
  },
  async chapter(n, title, text, ms = 5200) {
    const c = $('chapter'); c.querySelector('.n').textContent = n; c.querySelector('.t').textContent = title; c.querySelector('.txt').textContent = text || '';
    c.classList.add('show'); await G.wait(ms); c.classList.remove('show'); await G.wait(1200);
  },
  vibrate(p) { send({ t: 'vib', p }); },
  flashPhone(ms = 120, color = '#fff') { send({ t: 'flash', ms, color }); },
  phoneUI(mode, label = '') { send({ t: 'ui', mode, label }); },
  async call(from, timeoutMs = 20000) {
    send({ t: 'call', from, mode: 'incoming' });
    const r = await G._race(new Promise(res => { listeners.answer.push(() => res('answer')); listeners.decline.push(() => res('decline')); setTimeout(() => res('timeout'), timeoutMs); }));
    if (r === 'answer') send({ t: 'call', from, mode: 'active' }); else send({ t: 'call', from, mode: 'ended', reason: r });
    return r;
  },
  callActive(from) { send({ t: 'call', from, mode: 'active' }); },
  hangup(reason = 'Appel terminé') { send({ t: 'call', mode: 'ended', reason }); },
  sms(from, text) { send({ t: 'sms', from, text }); },
  async choice(opts) {
    G._choices = opts.map(o => o.id); send({ t: 'choice', opts });
    G.hint(input.solo ? opts.map((o, i) => `${i + 1} : ${o.label}`).join('     ') : '');
    const id = await G._race(once('choice')); send({ t: 'choice', opts: null }); G.hint(''); return id;
  },
  prompt(show) { $('prompt').classList.toggle('show', show); },
  async lookAt(name, secs = 1) { await G.until(() => world.hotspots[name].lit >= secs); },
  // Après `patience` ms sans trouver le point, on débloque quand même (jamais de blocage).
  async lookAndTap(name, secs = .9, label = 'Avancer', patience = 18000) {
    await Promise.race([G.lookAt(name, secs), G.wait(patience)]); G.prompt(true); G.vibrate([40]); G.phoneUI('prompt', label);
    await G.tap(); G.prompt(false); G.phoneUI('idle');
  },
  async turnTo(x, y, z, speed = 1.2) { await G._race(world.turnTo(new THREE.Vector3(x, y, z), speed)); input.offYaw = 0; input.offPitch = 0; send({ t: 'recal' }); },
  setCam(x, z, y, yawDeg) { world.setCamera(x, z, y, THREE.MathUtils.degToRad(yawDeg)); input.offYaw = 0; input.offPitch = 0; send({ t: 'recal' }); },
  // Marche le long d'un chemin [[x,z,y],...] à `speed` m/s ; pas et balancement.
  walk(path, speed = 1.05) {
    return G._race(new Promise(res => {
      const pts = [new THREE.Vector3(world.camera.position.x, world.floorY, world.camera.position.z), ...path.map(p => new THREE.Vector3(p[0], p[2], p[1]))];
      let seg = 0, s = 0, odo = 0, nextStep = .35;
      G._walker = dt => {
        const a = pts[seg], b = pts[seg + 1]; const len = a.distanceTo(b);
        s += speed * dt; odo += speed * dt;
        if (odo > nextStep) { nextStep += .62; sfx.step(0, .35 + Math.random() * .15); }
        const k = Math.min(1, s / len); const p = a.clone().lerp(b, k);
        world.floorY = p.y; world.camera.position.set(p.x, p.y + 1.6 + Math.sin(odo * Math.PI / .62) * .025, p.z);
        if (k >= 1) { seg++; s = 0; if (seg >= pts.length - 1) { G._walker = null; res(); } }
      };
    }));
  },
  torch(on) { setTorch(on); },
  get torchOn() { return world.torchOn; },
  waitTorch(on, timeoutMs = 1e9) { return world.torchOn === on ? Promise.resolve(true) : G._race(new Promise(r => { const f = v => { if (v === on) r(true); else listeners.torch.push(f); }; listeners.torch.push(f); setTimeout(() => r(false), timeoutMs); })); },
  door(name, open) { world.setDoor(name, open); },
  flicker(secs) { world.flicker = secs; },
  tension(v) { sfx.setTension(v); },
  power(on) { world.housePower(on); },
  flashTV(ms = 90) { const f = $('flash'); f.style.opacity = .9; setTimeout(() => f.style.opacity = 0, ms); },
  async staticTV(ms = 400) { $('static').classList.add('show'); G._static = true; await new Promise(r => setTimeout(r, ms)); $('static').classList.remove('show'); G._static = false; },
  gameOver() { if (dead) dead(RESTART); return deadP; },
  showLog(rows, title = 'Récents') { const l = $('log'); l.innerHTML = `<h3>${title}</h3>` + rows.map(r => `<div class="row${r.x ? ' x' : ''}"><div>${r.name}<small>${r.sub || ''}</small></div><div class="r">${r.right || ''}</div></div>`).join(''); l.classList.add('show'); send({ t: 'log', rows, title }); },
  fin() { $('fin').classList.add('show'); setTimeout(() => G.hint('Recharge la page pour rejouer'), 6000); }
};

// ---------- boucle ----------
let last = performance.now(), frame = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!world) return;
  if (G._walker) G._walker(dt);
  world.update(dt, input);
  renderer.render(world.scene, world.camera);
  if ((frame++ & 1) === 0) drawGrain();
  if (G._static) drawStatic();
}
requestAnimationFrame(loop);

// ---------- scénario ----------
async function startGame() {
  if (started) return; started = true;
  await worldReady; await sfx.start();
  let i = 0;
  while (i < chapters.length) {
    deadP = new Promise((_, rej) => { dead = rej; }); deadP.catch(() => {});
    G.gen++;
    try {
      await chapters[i](G);
      G.clearTimers(); i++;
    } catch (e) {
      if (e !== RESTART) { console.error(e); i++; continue; }
      // Mort : parasites, écran noir, on reprend le chapitre.
      G.clearTimers(); G.gen++; G._walker = null; G.prompt(false); G.subClear(); G.hint(''); send({ t: 'reset' });
      sfx.stinger(1); await G.staticTV(700);
      $('over').classList.add('show'); await new Promise(r => setTimeout(r, 3800)); $('over').classList.remove('show');
      world.hideEntity(); sfx.setTension(0);
    }
  }
}
window.G = G;
