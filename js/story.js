// Le scénario. Chaque chapitre est une fonction async qui reçoit l'API G
// (voir main.js). Une mort relance le chapitre en cours.
import { GROUND, CAVE, UP } from './world.js';

const FUSE = [-8.9, CAVE + 1.5, -6.5];

// Craquements aléatoires en fond, tant que `on()` est vrai.
function creaks(G, on, every = [4000, 11000]) {
  const gen = G.gen;
  const tick = () => { if (!on() || G.gen !== gen) return; G.sfx.creak(Math.random() * 1.6 - .8, .2 + Math.random() * .2); setTimeout(tick, every[0] + Math.random() * (every[1] - every[0])); };
  setTimeout(tick, 2500);
}

// ---------------------------------------------------------------- 1
async function ch1(G) {
  const W = G.world;
  G.setCam(0, 2.6, GROUND, 0); G.torch(false); W.hideEntity(); G.power(false); G.tension(0);
  G.door('front', 0, true); G.door('cave', 0, true); G.door('kitchen', .2, true); G.door('bedroom', 1.3, true); G.door('wardrobe', 0, true);
  G.sfx.ambience(true);
  await G.ready();
  await G.chapter('Un', 'La maison', 'La maison de mamie. Tu n\'y es pas revenue depuis l\'enterrement. Ce soir il faut trier ses affaires, et la tempête a coupé le courant.', 7000);
  let alive = true; creaks(G, () => alive);
  await G.wait(1500);
  G.sfx.slam(.5);                                    // la porte d'entrée claque derrière toi (le vent)
  await G.wait(2200);
  // Maëlle appelle.
  G.vibrate([500, 300, 500, 300, 500]);
  let r = await G.call('Maëlle', 25000);
  while (r !== 'answer') { await G.wait(1500); G.vibrate([500, 300, 500]); r = await G.call('Maëlle', 25000); }
  await G.wait(600);
  await G.say('maelle', 'Lou ? T\'es rentrée ? Il y a de la lumière chez mamie ?');
  await G.say('lou', 'Non. Tout est coupé. Je vois rien du tout.');
  await G.say('maelle', 'Allume la lampe de ton téléphone.');
  G.phoneUI('torchOn', 'Allumer la lampe'); G.hint('Allume la lampe sur ton téléphone');
  await G.waitTorch(true); G.phoneUI('idle'); G.hint('');
  await G.wait(800);
  G.hint('Oriente ton téléphone pour diriger la lampe'); await G.wait(3500); G.hint('');
  await G.say('maelle', 'Le tableau électrique est à la cave. Tu te souviens ? Au bout du couloir, la porte à gauche.');
  await G.say('lou', 'Je me souviens.');
  G.hint('Éclaire le couloir, puis touche l\'écran pour avancer');
  W.hotspot('corridor', 0, 1.3, -1.5, .9);
  await G.lookAndTap('corridor'); G.hint('');
  await G.walk([[0, .3, GROUND], [0, -3, GROUND]]);
  await G.say('maelle', 'Ça va ? Tu me dis si ça va pas, hein. Je reste avec toi.');
  G.sfx.creak(.6, .4);
  await G.wait(700);
  W.hotspot('cavedoor', -1, 1.2, -6.4, .8);
  await G.lookAndTap('cavedoor');
  await G.walk([[-.25, -6.4, GROUND]]);
  G.sfx.creak(-.5, .5); G.door('cave', 1.5);
  await G.wait(1800);
  alive = false;
}

// ---------------------------------------------------------------- 2
async function ch2(G) {
  const W = G.world;
  G.setCam(-.25, -6.4, GROUND, -90); G.torch(true); W.hideEntity(); G.power(false); G.tension(.1);
  G.door('cave', 1.5, true); G.callActive('Maëlle');
  await G.chapter('Deux', 'La cave', '', 3000);
  let alive = true; creaks(G, () => alive, [6000, 14000]);
  await G.say('maelle', 'Fais attention aux marches. Elles sont raides.');
  await G.walk([[-1.5, -6.4, GROUND], [-3.6, -6.4, -1.4], [-5.5, -6.4, CAVE], [-7.2, -6.5, CAVE]], .75);
  G.tension(.2);
  await G.say('maelle', 'Tu y es ? Le tableau est sur le mur du fond. Remonte le gros disjoncteur.');
  G.hint('Éclaire le tableau électrique');
  await G.lookAndTap('fuse', .8, 'Remonter le disjoncteur'); G.hint('');
  G.sfx.breaker(true); G.power(true); G.flashTV(60);
  await G.wait(1400);
  G.sfx.breaker(false); G.power(false); G.sfx.slam(1);        // BANG à l'étage
  G.vibrate([250]);
  await G.wait(1200);
  await G.say('maelle', 'C\'était quoi, ça ?');
  await G.say('lou', 'Ça venait d\'en haut.');
  await G.say('maelle', 'Lou… tu es sûre que tu es seule dans la maison ?');
  G.tension(.4);
  // La lampe faiblit ; en haut de l'escalier, quelqu'un.
  G.flicker(2.5); await G.wait(700);
  W.showEntity(-2.7, -.47, -6.4); G.sfx.breath(3, .3, .4);
  G.hint('Regarde l\'escalier');
  await G.until(() => W.isLit(W.entity.position.clone().setY(1.5), 20, 14) || false);
  G.hint('');
  await G.wait(900); G.vibrate([80, 60, 80, 60, 300]);
  G.flicker(1.2); await G.wait(600); W.hideEntity(); G.sfx.stinger(.35);
  await G.wait(1500);
  await G.say('lou', 'Il y a quelqu\'un. En haut de l\'escalier.');
  await G.say('maelle', 'Non. Non non non. Écoute-moi. C\'est la maison, elle a deux cents ans, elle bouge.');
  await G.say('maelle', 'Remonte, et va chercher la lampe à pétrole dans la chambre de mamie. Elle est toujours sur sa table de nuit.');
  await G.say('lou', 'Je veux pas monter.');
  await G.say('maelle', 'Tu y vas et tu redescends. Je ne raccroche pas. Promis.');
  G.tension(.25);
  W.hotspot('stairs', -3, -.8, -6.4, 1.2); G.hint('Éclaire l\'escalier, puis touche l\'écran');
  await G.lookAndTap('stairs', .8, 'Remonter'); G.hint('');
  await G.walk([[-5.5, -6.4, CAVE], [-3.6, -6.4, -1.4], [-1.5, -6.4, GROUND], [-.25, -6.4, GROUND]], .8);
  alive = false;
}

// ---------------------------------------------------------------- 3
async function ch3(G) {
  const W = G.world;
  G.setCam(-.25, -6.4, GROUND, 0); G.torch(true); W.hideEntity(); G.power(false); G.tension(.25);
  G.door('cave', 1.5, true); G.door('kitchen', .2, true); G.callActive('Maëlle');
  let alive = true; creaks(G, () => alive, [5000, 12000]);
  await G.wait(800);
  G.door('cave', 0); G.sfx.creak(-.8, .5); await G.wait(1200); G.sfx.slam(.9); G.vibrate([120]);   // la porte de la cave claque
  await G.wait(1000);
  G.door('kitchen', 1.4);   // la porte de la cuisine, elle, est ouverte maintenant
  await G.say('maelle', 'L\'escalier est au bout du couloir. Vas-y doucement.');
  W.hotspot('upstairs', 0, 1.6, -9.5, 1.2); G.hint('Éclaire l\'escalier du fond');
  await G.lookAndTap('upstairs', .8, 'Monter'); G.hint('');
  const walking = G.walk([[0, -7.6, GROUND], [0, -9.6, 1.16]], .7);
  await G.wait(4200);
  // Ça coupe.
  G.sfx.click(.2); G.hangup('Appel terminé'); G.vibrate([60, 40, 60]);
  await walking;
  G.tension(.35);
  await G.say('lou', 'Maëlle ? … Maëlle ?!');
  await G.wait(2500);
  // Un autre appel.
  G.vibrate([700, 400, 700, 400, 700, 400, 700]);
  G.sub('lou', '…'); await G.wait(600); G.subClear();
  const r = await G.call('Maman', 14000);
  if (r === 'answer') {
    G.sfx.breath(4, .5, 0); await G.wait(4200);
    G.sfx.breath(3, .45, -.3); await G.wait(2600);
    await G.say('thing', 'Lou… tu m\'as laissée toute seule.', { hold: 1200 });
    G.flashPhone(180, '#fff'); G.hangup('Appel terminé');
  } else {
    await G.wait(1500);
    G.sms('Maman', 'pourquoi tu réponds pas');
    await G.wait(3500);
  }
  G.vibrate([3000]); G.sub('lou', 'Le téléphone vibre dans ta main. Sans raison.'); await G.wait(3600); G.subClear();
  await G.wait(1500);
  G.vibrate([500, 300, 500]);
  let r2 = await G.call('Maëlle', 20000);
  while (r2 !== 'answer') { await G.wait(1200); G.vibrate([500, 300, 500]); r2 = await G.call('Maëlle', 20000); }
  await G.say('maelle', 'Désolée, ça a coupé, le réseau est pourri chez moi. T\'es où ?');
  await G.say('lou', 'Dans l\'escalier. Maëlle… j\'ai eu un appel.');
  await G.say('maelle', 'Quel appel ?');
  await G.say('lou', 'C\'était marqué « Maman ».');
  await G.wait(2500);
  await G.say('maelle', 'Lou. Écoute-moi bien. Tu ne réponds à personne d\'autre que moi. Personne. Promis ?');
  await G.say('lou', 'Promis.');
  G.tension(.3);
  await G.walk([[0, -12.4, UP], [1.5, -13, UP]], .7);
  alive = false;
}

// ---------------------------------------------------------------- 4
async function ch4(G) {
  const W = G.world;
  G.setCam(1.5, -13, UP, 90); G.torch(true); W.hideEntity(); G.power(false); G.tension(.3);
  G.door('bedroom', 1.3, true); G.door('wardrobe', 0, true); G.callActive('Maëlle');
  await G.chapter('Trois', 'La chambre', '', 3000);
  let alive = true; creaks(G, () => alive, [4000, 9000]);
  await G.say('maelle', 'La chambre de mamie, c\'est la deuxième porte. Celle qui est ouverte.');
  W.hotspot('bedroomdoor', 4, UP + 1.2, -12, 1); G.hint('Éclaire la porte ouverte');
  await G.lookAndTap('bedroomdoor', .8, 'Entrer'); G.hint('');
  await G.walk([[4, -13, UP], [4, -11.3, UP], [4.8, -9.6, UP]], .75);
  await G.say('maelle', 'La lampe est sur la table de nuit, à côté du lit.');
  // Fenêtre : un visage collé à la vitre, seulement quand on l'éclaire.
  let faceDone = false;
  (async () => {
    await G.lookAt('window', .4);
    if (!alive) return;
    W.showEntity(7.45, UP - 1.05, -9.5, { x: 6, z: -9.5 }); G.sfx.glassTap(3); G.vibrate([60, 80, 60, 80, 60]);
    await G.wait(2400); G.flicker(.8); await G.wait(300); W.hideEntity(); faceDone = true;
  })().catch(() => {});
  G.hint('Éclaire la lampe à pétrole');
  await G.lookAndTap('lamp', .8, 'Prendre la lampe'); G.hint('');
  W.lamp.visible = false;
  await G.say('lou', 'Je l\'ai. … Il n\'y a plus de pétrole dedans.');
  if (!faceDone) { W.showEntity(7.45, UP - 1.05, -9.5, { x: 6, z: -9.5 }); G.sfx.glassTap(3); G.vibrate([60, 80, 60, 80, 60]); await G.wait(2600); G.flicker(.8); await G.wait(300); W.hideEntity(); }
  await G.wait(800);
  G.sfx.creak(-.9, .6); G.door('wardrobe', 1.2);          // l'armoire s'ouvre toute seule
  await G.wait(2200);
  await G.say('maelle', 'Lou, écoute-moi. Je prends la voiture. Je suis là dans trois heures. Tu t\'enfermes dans la chambre et tu m\'attends.');
  G.tension(.5);
  // Des pas dans le couloir.
  for (let i = 0; i < 4; i++) { G.sfx.step(-.6, .5, true); G.vibrate([70]); await G.wait(1300); }
  await G.say('maelle', 'C\'est quoi ce bruit ?', { hold: 200 });
  await G.say('lou', 'Des pas. Dans le couloir.', { hold: 200 });
  await G.say('maelle', 'Éteins ta lampe. Éteins-la MAINTENANT.', { hold: 0 });
  G.phoneUI('torchOff', 'Éteindre la lampe'); G.hint('Éteins la lampe');
  const ok = await G.waitTorch(false, 4000);
  G.hint('');
  if (!ok) { W.showEntity(4, UP, -12.3); G.sfx.step(0, 1); await G.wait(500); W.entityState.chasing = true; W.entityState.speed = 6; await G.wait(1100); await G.gameOver(); }
  G.phoneUI('idle');
  G.tension(.8);
  // Dans le noir : ça passe dans le couloir. Chaque pas vibre dans la main.
  G.setCam(4.8, -9.6, UP, -18);
  W.showEntity(8, UP, -13.4, { x: -2, z: -13.4 });
  const caught = async () => { W.entity.lookAt(W.camera.position.x, UP + 1.2, W.camera.position.z); G.sfx.stinger(1); await G.wait(500); W.entityState.chasing = true; W.entityState.speed = 7; await G.wait(900); await G.gameOver(); };
  const guard = G.every(() => { if (G.torchOn) { clearInterval(guard); caught(); } }, 80);
  for (let x = 8; x >= 6.2; x -= .45) { W.entity.position.x = x; G.sfx.step(.5, .55); G.vibrate([90]); await G.wait(1000); }
  for (let x = 6.2; x >= 4.6; x -= .4) { W.entity.position.x = x; G.sfx.step(.3, .7); G.vibrate([120]); await G.wait(1100); }
  // Il s'arrête devant la porte. Il regarde.
  W.entity.position.x = 4; W.entity.lookAt(W.camera.position.x, UP + 1.2, W.camera.position.z); G.sfx.step(0, .8); G.vibrate([200]);
  G.sfx.breath(3.5, .5, 0); await G.wait(4200);
  G.sfx.breath(3, .4, .1); await G.wait(3600);
  W.entity.lookAt(-2, UP + 1.2, -13.4);
  for (let x = 3.5; x >= 0; x -= .5) { W.entity.position.x = x; G.sfx.step(-.4, .6 - (3.5 - x) * .08, x < 2); G.vibrate([80]); await G.wait(1000); }
  W.hideEntity(); clearInterval(guard);
  G.tension(.4);
  await G.wait(2500);
  await G.say('maelle', 'C\'est parti ? … Lou ?');
  await G.say('lou', 'Ça descend. Je crois que ça descend.');
  await G.say('maelle', 'Alors tu sors. Tu descends et tu sors de cette maison. Maintenant, Lou.');
  G.phoneUI('torchOn', 'Rallumer la lampe'); G.hint('Rallume la lampe');
  await G.waitTorch(true); G.phoneUI('idle'); G.hint('');
  await G.walk([[4, -11.3, UP], [4, -13, UP], [1.5, -13, UP], [0, -12.4, UP]], .8);
  alive = false;
}

// ---------------------------------------------------------------- 5
async function ch5(G) {
  const W = G.world;
  G.setCam(0, -12.4, UP, 180); G.torch(true); W.hideEntity(); G.power(false); G.tension(.45);
  G.door('kitchen', 1.4, true); G.door('cave', 0, true); G.door('front', 0, true); G.callActive('Maëlle');
  await G.say('maelle', 'Doucement dans l\'escalier. Et tu ne t\'arrêtes pas.');
  await G.walk([[0, -9.6, 1.16], [0, -7.6, GROUND], [0, -5.5, GROUND]], .8);
  // Derrière toi. Il descend.
  G.sfx.step(0, .9, true); await G.wait(700); G.sfx.step(0, 1, true); G.vibrate([150]);
  await G.say('maelle', 'Lou ? Qu\'est-ce que c\'est ?', { hold: 0 });
  W.showEntity(0, 1.0, -9.6); W.entityState.chasing = true; W.entityState.speed = .9; W.entityState.floorY = GROUND;
  G.tension(.9); G.hint('Ne le quitte pas des yeux — garde la lampe sur lui');
  const walking = G.walk([[0, -2, GROUND], [0, .5, GROUND], [0, 3.0, GROUND]], .45);
  let flick = false;
  const watch = G.every(() => {
    const d = W.entityDist();
    if (d < 1.15) { clearInterval(watch); G.gameOver(); return; }
    if (d < 4 && Math.random() < .5) G.vibrate([d < 2 ? 220 : 90]);
    if (!flick && d > 3 && Math.random() < .04) { flick = true; G.flicker(1.6); }
  }, 350);
  await walking; clearInterval(watch); G.hint('');
  await G.say('lou', 'La porte. Maëlle, la porte est fermée à clé !', { hold: 0 });
  await G.say('maelle', 'La clé est sur le clou, à côté de la porte. Comme toujours !', { hold: 0 });
  G.hint('Éclaire la clé');
  const watch2 = G.every(() => { const d = W.entityDist(); if (d < 1.15) { clearInterval(watch2); G.gameOver(); } else if (d < 3) G.vibrate([d < 2 ? 220 : 90]); }, 350);
  await G.lookAndTap('key', .6, 'Prendre la clé'); G.hint(''); W.key.visible = false;
  clearInterval(watch2);
  G.sfx.click(.5); await G.wait(400); G.sfx.click(.4);
  await G.wait(300);
  W.hideEntity(); G.tension(.3);
}

// ---------------------------------------------------------------- 6
async function ch6(G) {
  const W = G.world;
  G.setCam(0, 3.2, GROUND, 180); G.torch(true); W.hideEntity(); G.power(false); G.tension(.3); W.key.visible = false;
  G.door('front', 0, true); G.callActive('Maëlle');
  await G.say('lou', 'J\'ai la clé. Je sors.', { hold: 200 });
  await G.wait(1200);
  // On frappe.
  G.sfx.knock(3, 1); G.vibrate([150, 250, 150, 250, 150]);
  await G.wait(2600);
  await G.say('lou', '…', { hold: 300 });
  await G.say('maelle2', 'Lou ! Ouvre ! Je suis devant la porte !');
  await G.say('lou', 'Tu… tu as dit trois heures.');
  await G.say('maelle2', 'J\'ai roulé vite. Ouvre-moi, Lou, il fait froid.');
  G.sfx.knock(3, 1, 300); G.vibrate([150, 250, 150, 250, 150]);
  await G.wait(2000);
  // Le SMS de Maëlle. La vraie.
  G.sms('Maëlle', 'Je viens de passer Mâcon. Encore 1h30. Tu tiens le coup ? ❤️');
  G.sub('lou', 'Ton téléphone vibre. Un message de Maëlle.'); await G.wait(4500); G.subClear();
  await G.wait(800);
  await G.say('maelle2', 'Lou. Ouvre la porte.', { hold: 400 });
  G.sfx.knock(5, 1, 220); G.vibrate([100, 100, 100, 100, 100, 100, 100]);
  G.tension(.7);
  const c = await G.choice([{ id: 'open', label: 'Ouvrir la porte' }, { id: 'hang', label: 'Raccrocher' }]);
  if (c === 'open') {
    G.sfx.click(.5); G.door('front', 1.4); G.sfx.creak(0, .6);
    await G.wait(2500);
    G.sub('lou', 'Personne. La pluie.'); await G.wait(3000); G.subClear();
    await G.wait(1500);
    G.sfx.breath(2, .7, 0); await G.wait(1200);
    W.showEntity(0, GROUND, 1.6); G.flicker(3); G.vibrate([2000]);
    await G.wait(900); G.sfx.stinger(1); await G.staticTV(900);
    G.torch(false); G.tension(0); G.sfx.ambience(false);
    await G.wait(2500);
    G.hangup('Appel terminé · 47:12');
    G.showLog([{ name: 'Maëlle', sub: 'Appel entrant', right: '21:14' }, { name: 'Maman', sub: 'Appel entrant', right: '00:23' }, { name: 'Inconnu', sub: 'Appel entrant · en cours', right: '47:12', x: true }]);
    await G.wait(9000); G.fin();
    return;
  }
  // On raccroche.
  G.hangup('Appel terminé'); G.sfx.click(.3);
  await G.wait(1500);
  G.sub('thing', 'Lou. Ouvre la porte.'); await G.wait(2500); G.subClear();
  G.sub('thing', 'Lou.'); await G.wait(2000); G.subClear();
  await G.wait(1500);
  G.sfx.laugh(); await G.wait(4000);
  G.tension(.5); await G.wait(4000);
  G.sub('lou', 'Tu recules. Tu t\'assois contre le mur. Tu attends.'); await G.wait(4000); G.subClear();
  G.tension(.2);
  // L'aube.
  const t0 = performance.now();
  const dawn = G.every(() => { const k = Math.min(1, (performance.now() - t0) / 14000); W.hemi.intensity = k * 1.4; W.ambient.intensity = .06 + k * .3; if (k >= 1) clearInterval(dawn); }, 100);
  await G.wait(5000); G.sfx.birds(); G.sfx.ambience(false);
  await G.wait(9000);
  G.vibrate([500, 300, 500]);
  let r = await G.call('Maëlle', 30000);
  while (r !== 'answer') { await G.wait(1200); G.vibrate([500, 300, 500]); r = await G.call('Maëlle', 30000); }
  await G.say('maelle', 'Lou ? Je suis devant. Ouvre-moi.');
  await G.wait(800);
  G.sfx.knock(2, .5, 500);
  await G.choice([{ id: 'open', label: 'Ouvrir la porte' }]);
  G.sfx.click(.5); G.door('front', 1.4); G.sfx.creak(0, .4);
  await G.wait(3000);
  G.sub('lou', 'Tu as tenu jusqu\'au matin.'); await G.wait(3500); G.subClear();
  G.hangup('Appel terminé · 00:41');
  await G.wait(1500);
  G.showLog([{ name: 'Maëlle', sub: 'Appel entrant', right: '00:41' }, { name: 'Maëlle', sub: 'Appel entrant', right: '21:14' }, { name: 'Maman', sub: 'Appel entrant', right: '00:23' }, { name: 'Inconnu', sub: 'Appel entrant', right: '47:12', x: true }]);
  await G.wait(9000); G.fin();
}

export const chapters = [ch1, ch2, ch3, ch4, ch5, ch6];
