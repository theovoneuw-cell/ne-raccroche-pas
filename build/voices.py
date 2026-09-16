#!/usr/bin/env python3
"""Génère les répliques parlées en mp3 : voix neuronales Microsoft via
edge-tts (build/venv), traitées avec ffmpeg (effet téléphone pour Maëlle,
voix déformée pour la chose). Produit assets/voice/*.mp3 et manifest.json.
`--force` régénère tout ; `--say` utilise les voix système du Mac à la place."""
import re, json, hashlib, subprocess, os, sys, tempfile, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
FFMPEG = os.path.expanduser('~/Clipper/bin/ffmpeg')
OUT = ROOT / 'assets' / 'voice'; OUT.mkdir(parents=True, exist_ok=True)

EDGE = ROOT / 'build' / 'venv' / 'bin' / 'edge-tts'
USE_SAY = '--say' in sys.argv or not EDGE.exists()
# Effet ligne téléphonique : bande étroite, grain de codec 8 kHz, compression,
# légère saturation, puis un souffle de ligne mélangé en fond.
PHONE = "highpass=f=320,lowpass=f=3300,aresample=8000,aresample=24000,acompressor=threshold=-24dB:ratio=5:attack=4:release=90:makeup=4,volume=1.6,alimiter=limit=0.85:level=false"
VOICES = {
  # qui : (voix edge-tts, rate, pitch, voix say, débit say, filtre ffmpeg avant l'effet téléphone)
  'maelle':  ('fr-FR-DeniseNeural', '+6%', '+0Hz', 'Amélie', 178, "volume=1.0"),
  'maelle2': ('fr-FR-DeniseNeural', '-4%', '-6Hz', 'Amélie', 170, "asetrate=24000*0.97,aresample=24000,aecho=0.7:0.45:38:0.22"),
  'maman':   ('fr-FR-DeniseNeural', '-28%', '-18Hz', 'Amélie', 150, "asetrate=24000*0.88,aresample=24000,lowpass=f=2400,aecho=0.8:0.6:90:0.35"),
  'thing':   ('fr-FR-HenriNeural', '-32%', '-40Hz', 'Thomas', 140, "asetrate=24000*0.78,aresample=24000,lowpass=f=1700,aecho=0.8:0.75:130:0.42,acompressor=threshold=-20dB:ratio=4,volume=1.4"),
}
HISS = {'maelle': .006, 'maelle2': .008, 'maman': .012, 'thing': .014}

def key(who, text): return hashlib.sha1(f'{who}|{text}'.encode()).hexdigest()[:10]

lines = []
src = (ROOT / 'js' / 'story.js').read_text()
for m in re.finditer(r"G\.say\('([a-z0-9]+)',\s*'((?:[^'\\]|\\.)*)'", src):
    who, text = m.group(1), m.group(2).replace("\\'", "'")
    if who in VOICES: lines.append((who, text))
lines.append(('maelle', "Si tu m'entends, touche l'écran pour caler la visée."))
seen = set(); lines = [l for l in lines if not (l in seen or seen.add(l))]

manifest = {}
for who, text in lines:
    k = key(who, text); mp3 = OUT / f'{k}.mp3'
    manifest[f'{who}|{text}'] = f'{k}.mp3'
    if mp3.exists() and '--force' not in sys.argv: continue
    evoice, erate, epitch, svoice, srate, af = VOICES[who]
    with tempfile.TemporaryDirectory() as td:
        spoken = text.replace('«', '').replace('»', '')
        if USE_SAY:
            raw = os.path.join(td, 'v.aiff')
            subprocess.run(['say', '-v', svoice, '-r', str(srate), '-o', raw, spoken.replace('…', ', ')], check=True)
        else:
            raw = os.path.join(td, 'v.mp3')
            subprocess.run([str(EDGE), '--voice', evoice, '--rate', erate, '--pitch', epitch, '--text', spoken, '--write-media', raw], check=True, capture_output=True)
        fc = f"[0:a]{af},{PHONE}[v];anoisesrc=c=pink:a={HISS[who]}:r=24000[n];[v][n]amix=inputs=2:duration=first:normalize=0,apad=pad_dur=0.25[out]"
        subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', raw, '-filter_complex', fc, '-map', '[out]', '-ac', '1', '-ar', '24000', '-b:a', '48k', str(mp3)], check=True)
    print(f'{who:8} {k}  {text[:60]}')

(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=0))
for f in OUT.glob('*.mp3'):
    if f.name not in manifest.values(): f.unlink()
print(f'{len(manifest)} répliques, {sum(f.stat().st_size for f in OUT.glob("*.mp3"))//1024} Ko')
