// Le téléphone : lampe torche (gyroscope), vibreur, voix des appels, choix.
(function () {
  const $ = id => document.getElementById(id);
  const code = new URLSearchParams(location.search).get('r');
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const canVib = typeof navigator.vibrate === 'function' && !isIOS;
  let conn = null, peer = null, calibrated = false, a0 = 0, b0 = 0, lastSend = 0, lastY = 999, lastP = 999, wantRecal = false, sensorsDenied = false, gotOrient = false, dragMode = false, dy = 0, dp = 0;
  let audio = null, ringer = null, callTimer = null, callStart = 0, voices = [];

  if (!code) { $('err').textContent = 'Ouvre cette page en scannant le code affiché sur l\'écran.'; $('go').disabled = true; }

  // ---------- capteurs ----------
  function onOrient(e) {
    if (e.alpha == null || dragMode) return; gotOrient = true;
    if (wantRecal || !calibrated) { a0 = e.alpha; b0 = e.beta; calibrated = true; wantRecal = false; }
    let y = -(e.alpha - a0); y = ((y + 540) % 360) - 180;
    const p = Math.max(-80, Math.min(70, e.beta - b0));
    const now = performance.now();
    if (now - lastSend < 33) return;
    if (Math.abs(y - lastY) < .25 && Math.abs(p - lastP) < .25) return;
    lastSend = now; lastY = y; lastP = p;
    send({ t: 'o', y: +y.toFixed(1), p: +p.toFixed(1) });
  }
  async function enableSensors() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      let r = 'denied'; try { r = await DeviceOrientationEvent.requestPermission(); } catch (_) {}
      if (r !== 'granted') sensorsDenied = true;
    }
    addEventListener('deviceorientation', onOrient, true);
  }
  async function wakeLock() {
    try { if ('wakeLock' in navigator) { await navigator.wakeLock.request('screen'); } } catch (_) {}
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { wakeLock(); if (!conn || !conn.open) connect(); } });

  // ---------- son du téléphone ----------
  function audioInit() {
    const C = window.AudioContext || window.webkitAudioContext; audio = new C();
    const b = audio.createBuffer(1, 1, 22050); const s = audio.createBufferSource(); s.buffer = b; s.connect(audio.destination); s.start();
  }
  function tone(freqs, dur, gain = .25, when = 0) {
    if (!audio) return; const t = audio.currentTime + when;
    freqs.forEach(f => { const o = audio.createOscillator(); o.frequency.value = f; const g = audio.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .02); g.gain.setValueAtTime(gain, t + dur - .03); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(g).connect(audio.destination); o.start(t); o.stop(t + dur + .05); });
  }
  function ringStart() {
    ringStop(); const tick = () => { tone([440, 480], 1.1, .35); tone([440, 480], .9, .3, 1.35); vib([500, 250, 500]); };
    tick(); ringer = setInterval(tick, 3200);
  }
  function ringStop() { if (ringer) { clearInterval(ringer); ringer = null; } }
  function ding() { tone([1318], .12, .3); tone([1760], .25, .3, .12); }

  // ---------- vibreur (ou flash à défaut) ----------
  function vib(p) {
    if (canVib) { try { navigator.vibrate(p); } catch (_) {} }
    else { const el = $('pulse'); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
  }

  // ---------- voix ----------
  function loadVoices() { voices = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('fr')); }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function pickVoice(kind) {
    if (!voices.length) return null;
    const fr = voices.filter(v => v.lang.toLowerCase() === 'fr-fr'); const pool = fr.length ? fr : voices;
    const fem = pool.find(v => /am[eé]lie|audrey|aurelie|marie|c[eé]line|julie|female|femme/i.test(v.name));
    const male = pool.find(v => /thomas|nicolas|daniel|male|homme/i.test(v.name));
    if (kind === 'thing' || kind === 'maman') return male || fem || pool[0];
    return fem || pool[0];
  }
  let speakSeq = 0;
  function speak(text, voice, onDone) {
    if (!('speechSynthesis' in window)) { onDone && onDone(false); return; }
    const seq = ++speakSeq;
    const go = () => {
      if (seq !== speakSeq) return;
      const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; const v = pickVoice(voice); if (v) u.voice = v;
      const P = { maelle: [1.02, 1.05], maelle2: [.95, .88], thing: [.62, .1], maman: [.8, .5] }[voice] || [1, 1];
      u.rate = P[0]; u.pitch = P[1]; u.volume = 1;
      let ended = false, started = false;
      const fin = ok => { if (!ended) { ended = true; onDone && onDone(ok); } };
      u.onstart = () => { started = true; };
      u.onend = () => fin(true); u.onerror = () => fin(false);
      setTimeout(() => { if (!started) fin(false); }, 2500);
      setTimeout(() => fin(started), 1500 + text.length * 90);
      speechSynthesis.speak(u);
    };
    // Chrome Android avale la phrase lancée juste après un cancel() : on laisse respirer.
    if (speechSynthesis.speaking || speechSynthesis.pending) { try { speechSynthesis.cancel(); } catch (_) {} setTimeout(go, 120); } else go();
  }
  // Les répliques sont des fichiers audio (voix générées) ; la synthèse vocale
  // n'est qu'un secours. Un seul élément <audio>, débloqué au premier geste.
  const voiceEl = new Audio(); voiceEl.setAttribute('playsinline', ''); voiceEl.preload = 'auto';
  let VOICES = {}; fetch('assets/voice/manifest.json').then(r => r.json()).then(m => { VOICES = m; }).catch(() => {});
  let sayTimer = null;
  function playVoice(url, onDone) {
    let ended = false; const fin = ok => { if (!ended) { ended = true; clearTimeout(sayTimer); onDone && onDone(ok); } };
    voiceEl.onended = () => fin(true); voiceEl.onerror = () => fin(false);
    voiceEl.src = url; const pr = voiceEl.play();
    if (pr && pr.catch) pr.catch(() => fin(false));
    voiceEl.onloadedmetadata = () => { clearTimeout(sayTimer); sayTimer = setTimeout(() => fin(true), (voiceEl.duration || 6) * 1000 + 800); };
    sayTimer = setTimeout(() => fin(true), 9000);
  }
  function say(id, voice, text, url) {
    $('call').querySelector('.line').textContent = text;
    const done = () => send({ t: 'said', id });
    if (url) playVoice(url, ok => { if (ok) done(); else speak(text, voice, () => done()); });
    else speak(text, voice, () => done());
  }

  // ---------- interface ----------
  const torchEl = $('torch'), msg = $('msg'), call = $('call');
  let torch = false, mode = 'idle';
  function setTorch(on) { torch = on; torchEl.classList.toggle('on', on); $('torchl').textContent = on ? 'Allumée' : 'Lampe'; }
  torchEl.addEventListener('pointerdown', e => { e.stopPropagation(); setTorch(!torch); tone([torch ? 900 : 600], .04, .15); send({ t: 'torch', on: torch }); });
  function setMode(m, label) {
    mode = m; torchEl.classList.toggle('hl', m === 'torchOn' || m === 'torchOff');
    if (m === 'prompt') { msg.textContent = label || 'Touche l\'écran'; msg.classList.add('show'); }
    else msg.classList.remove('show');
    if (m === 'torchOn' || m === 'torchOff') $('torchl').textContent = label; else $('torchl').textContent = torch ? 'Allumée' : 'Lampe';
  }
  // Sans gyroscope (capteurs refusés, ordinateur…) : on glisse le doigt pour orienter la lampe.
  let drag = null;
  $('game').addEventListener('pointerdown', e => { if (e.target.closest('button') || e.target === torchEl) return; drag = { x: e.clientX, y: e.clientY, moved: false }; });
  $('game').addEventListener('pointermove', e => {
    if (!drag || !dragMode) return;
    const mx = e.clientX - drag.x, my = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(mx, my) < 8) return; drag.moved = true;
    dy += mx * .45; dp -= my * .3; dy = ((dy + 540) % 360) - 180; dp = Math.max(-80, Math.min(70, dp)); drag.x = e.clientX; drag.y = e.clientY;
    const now = performance.now(); if (now - lastSend < 33) return; lastSend = now; send({ t: 'o', y: +dy.toFixed(1), p: +dp.toFixed(1) });
  });
  $('game').addEventListener('pointerup', e => { if (!drag) return; const d = drag; drag = null; if (dragMode && d.moved) { dy = 0; dp = 0; send({ t: 'o', y: 0, p: 0 }); } if (e.target.closest('button') || e.target === torchEl) return; if (!d.moved) send({ t: 'tap' }); });
  $('game').addEventListener('pointercancel', () => { drag = null; if (dragMode) { dy = 0; dp = 0; send({ t: 'o', y: 0, p: 0 }); } });
  function enableDrag() { dragMode = true; $('topt').textContent = 'Glisse pour orienter'; }
  function fmt(s) { return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  function showCall(from, m, reason) {
    const st = call.querySelector('.st'), line = call.querySelector('.line');
    if (m === 'incoming') { call.querySelector('.name').textContent = from; st.textContent = 'Appel entrant…'; line.textContent = ''; call.className = 'show ring'; ringStart(); }
    else if (m === 'active') { if (from) call.querySelector('.name').textContent = from; ringStop(); call.className = 'show active'; callStart = Date.now(); clearInterval(callTimer); callTimer = setInterval(() => st.textContent = fmt(Math.floor((Date.now() - callStart) / 1000)), 1000); st.textContent = '00:00'; }
    else { ringStop(); clearInterval(callTimer); speakSeq++; try { speechSynthesis.cancel(); voiceEl.pause(); } catch (_) {} st.textContent = reason || 'Appel terminé'; line.textContent = ''; call.className = 'show ended'; tone([480], .25, .2); tone([480], .25, .2, .4); setTimeout(() => { if (call.classList.contains('ended')) call.className = ''; }, 2600); }
  }
  $('ans').addEventListener('pointerdown', e => { e.stopPropagation(); ringStop(); send({ t: 'answer' }); });
  $('decl').addEventListener('pointerdown', e => { e.stopPropagation(); ringStop(); send({ t: 'decline' }); });
  function showChoice(opts) {
    const c = $('choice'); c.innerHTML = '';
    if (!opts) { c.classList.remove('show'); return; }
    opts.forEach(o => { const b = document.createElement('button'); b.textContent = o.label; b.addEventListener('pointerdown', e => { e.stopPropagation(); send({ t: 'choice', id: o.id }); c.classList.remove('show'); }); c.appendChild(b); });
    c.classList.add('show'); vib([60]);
  }
  let smsT = null;
  function showSms(from, text) {
    const s = $('sms'); s.querySelector('.from').textContent = from; s.querySelector('.txt').textContent = text; s.classList.add('show'); ding(); vib([120, 80, 120]);
    clearTimeout(smsT); smsT = setTimeout(() => s.classList.remove('show'), 9000);
  }
  $('sms').addEventListener('pointerdown', e => { e.stopPropagation(); $('sms').classList.remove('show'); });
  function flash(ms, color) { const f = $('flash'); f.style.background = color || '#fff'; f.style.opacity = 1; setTimeout(() => f.style.opacity = 0, ms || 120); }
  function showLog(rows, title) {
    const l = $('log'); l.innerHTML = `<h3>${title || 'Récents'}</h3>` + rows.map(r => `<div class="row${r.x ? ' x' : ''}"><div>${r.name}<small>${r.sub || ''}</small></div><div class="r">${r.right || ''}</div></div>`).join('') + '<div class="fin">Fin</div>';
    l.classList.add('show');
  }

  // ---------- réseau ----------
  function send(m) { if (conn && conn.open) { try { conn.send(m); } catch (_) {} } }
  function onMsg(m) {
    switch (m.t) {
      case 'ui': if ('torch' in m) setTorch(!!m.torch); if (m.mode) setMode(m.mode, m.label); break;
      case 'say': say(m.id, m.voice, m.text, m.url); break;
      case 'call': showCall(m.from, m.mode, m.reason); break;
      case 'sms': showSms(m.from, m.text); break;
      case 'vib': vib(m.p); break;
      case 'flash': flash(m.ms, m.color); break;
      case 'choice': showChoice(m.opts); break;
      case 'recal': wantRecal = true; dy = 0; dp = 0; break;
      case 'log': showLog(m.rows, m.title); break;
      case 'reset': showChoice(null); setMode('idle'); call.className = ''; ringStop(); break;
    }
  }
  let retry = null;
  function connect() {
    if (!code) return;
    if (!peer || peer.destroyed) {
      peer = new Peer({ debug: 0 });
      peer.on('open', () => dial());
      peer.on('error', e => { if (e.type !== 'peer-unavailable') $('disc').classList.add('show'); schedule(); });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (_) {} });
      return;
    }
    if (peer.open) dial();
  }
  function dial() {
    if (conn && conn.open) return;
    const c = peer.connect('nrp-' + code, { reliable: true });
    c.on('open', () => { conn = c; $('disc').classList.remove('show'); $('dot').classList.add('on'); send({ t: 'hello', vib: canVib, ios: isIOS }); if (calibrated) send({ t: 'ready' }); });
    c.on('data', onMsg);
    const lost = () => { if (conn === c) conn = null; $('dot').classList.remove('on'); $('disc').classList.add('show'); schedule(); };
    c.on('close', lost); c.on('error', lost);
  }
  function schedule() { clearTimeout(retry); retry = setTimeout(() => { if (!conn || !conn.open) connect(); }, 3000); }

  // ---------- démarrage ----------
  $('go').addEventListener('click', async () => {
    try {
      audioInit(); await enableSensors(); wakeLock();
      // Test vocal : si on n'entend rien ici, on le saura avant de commencer.
      const test = "Si tu m'entends, touche l'écran pour caler la visée.";
      const tf = VOICES['maelle|' + test];
      const fail = () => { $('calibnote').textContent = 'La voix ne sort pas. Vérifie le volume, puis recharge la page.'; };
      if (tf) playVoice('assets/voice/' + tf, ok => { if (!ok) speak(test, 'maelle', ok2 => { if (!ok2) fail(); }); });
      else speak(test, 'maelle', ok => { if (!ok) fail(); });
      if (canVib) navigator.vibrate(30);
      if (peer) { try { peer.destroy(); } catch (_) {} peer = null; }
      connect();
      $('setup').classList.remove('show'); $('calib').classList.add('show');
    } catch (e) { $('err').textContent = e.message || String(e); }
  });
  $('calib').addEventListener('pointerdown', () => {
    wantRecal = true; $('calib').classList.remove('show'); $('game').classList.add('show'); send({ t: 'ready' });
    if (sensorsDenied) enableDrag(); else setTimeout(() => { if (!gotOrient) enableDrag(); }, 2500);
  });

})();
