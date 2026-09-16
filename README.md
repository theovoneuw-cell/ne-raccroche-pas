# Ne raccroche pas

Jeu d'horreur narratif d'une demi-heure. L'écran (télé, ordinateur) montre la
maison ; le téléphone dans ta main est la lampe torche, et c'est lui qui sonne,
vibre et parle.

**Jouer :** ouvrir `index.html` en ligne sur un grand écran, scanner le QR code
avec le téléphone, autoriser les capteurs, pointer le téléphone vers l'écran et
toucher pour caler. Baisser la lumière, monter le son.

- Bouger le téléphone oriente la lampe ; pointer vers les bords fait pivoter la vue.
- Éclairer un endroit puis toucher l'écran du téléphone pour avancer.
- Le bouton rond allume ou éteint la lampe. Il y a des moments où il faut l'éteindre.
- Répondre — ou non — aux appels.

Sans téléphone : « Jouer sans téléphone » en bas à droite (souris = lampe,
clic = toucher, T = lampe, R/E = répondre/refuser, 1/2 = choix).

## Technique

Pages statiques, aucun serveur : Three.js pour la maison, WebAudio pour les
sons (tout est synthétisé, voir `assets/sfx/README.md` pour brancher de vrais
sons), PeerJS pour relier écran et téléphone en pair-à-pair, voix des appels par
la synthèse vocale du téléphone.

- `index.html` + `js/main.js` : écran principal, boucle de rendu, API du scénario.
- `js/story.js` : les six chapitres.
- `js/world.js` : la maison, la lampe, la chose.
- `js/audio.js` : moteur sonore.
- `phone.html` + `js/phone.js` : le contrôleur.
- `build/serve.py 8123` : prévisualisation locale (le téléphone exige HTTPS, donc GitHub Pages).

Limites connues : pas de vibration sur iPhone (Safari ne l'expose pas ; l'écran
pulse à la place). Sans gyroscope, on glisse le doigt pour orienter la lampe.
