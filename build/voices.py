#!/usr/bin/env python3
"""Génère les répliques parlées en mp3 avec les voix système du Mac (`say`),
puis les traite avec ffmpeg (effet téléphone pour Maëlle, voix déformée pour
la chose). Produit assets/voice/*.mp3 et assets/voice/manifest.json."""
import re, json, hashlib, subprocess, os, sys, tempfile, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
FFMPEG = os.path.expanduser('~/Clipper/bin/ffmpeg')
OUT = ROOT / 'assets' / 'voice'; OUT.mkdir(parents=True, exist_ok=True)

VOICES = {
  # qui : (voix say, débit, filtre ffmpeg)
  'maelle':  ('Amélie', 178, "highpass=f=280,lowpass=f=3600,acompressor=threshold=-18dB:ratio=3,volume=1.4"),
  'maelle2': ('Amélie', 170, "asetrate=22050*0.95,aresample=22050,atempo=1.03,highpass=f=280,lowpass=f=3300,aecho=0.7:0.45:38:0.22,acompressor=threshold=-18dB:ratio=3,volume=1.3"),
  'maman':   ('Amélie', 150, "asetrate=22050*0.84,aresample=22050,highpass=f=250,lowpass=f=2400,aecho=0.8:0.6:90:0.35,volume=1.2"),
  'thing':   ('Thomas', 140, "asetrate=22050*0.7,aresample=22050,atempo=0.92,lowpass=f=1700,aecho=0.8:0.75:130:0.42,acompressor=threshold=-20dB:ratio=4,volume=1.6"),
}

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
    voice, rate, af = VOICES[who]
    with tempfile.TemporaryDirectory() as td:
        aiff = os.path.join(td, 'v.aiff')
        spoken = text.replace('…', ', ').replace('«', '').replace('»', '')
        subprocess.run(['say', '-v', voice, '-r', str(rate), '-o', aiff, spoken], check=True)
        subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', aiff, '-ac', '1', '-ar', '22050', '-af', af, '-b:a', '48k', str(mp3)], check=True)
    print(f'{who:8} {k}  {text[:60]}')

(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=0))
for f in OUT.glob('*.mp3'):
    if f.name not in manifest.values(): f.unlink()
print(f'{len(manifest)} répliques, {sum(f.stat().st_size for f in OUT.glob("*.mp3"))//1024} Ko')
