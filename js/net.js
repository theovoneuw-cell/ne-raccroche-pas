// Liaison pair-à-pair entre l'écran (hôte) et le téléphone (contrôleur).
// Aucun serveur à nous : PeerJS ne sert qu'à la mise en relation, ensuite
// les messages passent en direct (WebRTC DataChannel).

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeCode() {
  let s = '';
  const a = new Uint32Array(4); crypto.getRandomValues(a);
  for (let i = 0; i < 4; i++) s += ALPHABET[a[i] % ALPHABET.length];
  return s;
}

export function phoneUrl(code) {
  const u = new URL('phone.html', location.href);
  u.searchParams.set('r', code);
  return u.href;
}

export class Host {
  constructor(code, handlers) {
    this.code = code;
    this.h = handlers;           // { onOpen, onPhone, onMessage, onLost, onError }
    this.conn = null;
    this.peer = new Peer('nrp-' + code, { debug: 0 });
    this.peer.on('open', () => this.h.onOpen && this.h.onOpen());
    this.peer.on('error', e => {
      if (e.type === 'unavailable-id') { location.reload(); return; }
      this.h.onError && this.h.onError(e);
    });
    this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch (_) {} });
    this.peer.on('connection', c => this._accept(c));
  }
  _accept(c) {
    if (this.conn && this.conn.open) { try { this.conn.close(); } catch (_) {} }
    this.conn = c;
    c.on('open', () => this.h.onPhone && this.h.onPhone(c));
    c.on('data', d => this.h.onMessage && this.h.onMessage(d));
    const lost = () => { if (this.conn === c) { this.conn = null; this.h.onLost && this.h.onLost(); } };
    c.on('close', lost); c.on('error', lost);
  }
  get connected() { return !!(this.conn && this.conn.open); }
  send(msg) { if (this.connected) { try { this.conn.send(msg); } catch (_) {} } }
}
