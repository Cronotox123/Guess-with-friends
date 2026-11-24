/* ================= Partymodus: Tablet als Spielleiter, Handys als Controller =================
   Verbindung per WebRTC über PeerJS. Das Tablet ist "Host" mit der Peer-ID "punktlandung-<CODE>".
   Handys öffnen ?join=<CODE>, melden sich mit Name und fester Spieler-ID und verbinden sich neu, falls die Verbindung abreißt. */
const PARTY = {
  available: () => typeof window.Peer === 'function',
  prefix: 'punktlandung-v1-',
  // STUN reicht nur, wenn beide im selben WLAN sind. Für Mobilfunk/fremde Netze braucht es TURN-Relais (öffentliche, kostenlose Server).
  peerOpts: { debug: 0, config: { iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] },
    { urls: ['turn:freestun.net:3478', 'turn:freestun.net:3478?transport=tcp'], username: 'free', credential: 'free' },
    { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp', 'turns:openrelay.metered.ca:443'], username: 'openrelayproject', credential: 'openrelayproject' },
  ] } },
};
if(window.__peerOverride) Object.assign(PARTY.peerOpts, window.__peerOverride);
function partyCode(){ const a='ABCDEFGHJKLMNPQRSTUVWXYZ'; let s=''; for(let i=0;i<4;i++) s+=a[Math.floor(Math.random()*a.length)]; return s; }
function joinUrl(code){ return location.origin + location.pathname + '?join=' + code; }
function qrSvg(text){
  if(typeof window.qrcode !== 'function') return '';
  const q = qrcode(0,'M'); q.addData(text); q.make();
  return q.createSvgTag({cellSize:6, margin:2, scalable:true});
}
function wakeLock(){ try{ navigator.wakeLock && navigator.wakeLock.request('screen').catch(()=>{}); }catch(e){} }
function ptsLabel(mode){ return mode === 'kreis' ? 'Treffer' : 'Punkte'; }


/* ---------- Ersatzweg: Nachrichten über öffentliche MQTT-Server ----------
   Klappt die direkte Handy-zu-Handy-Verbindung (WebRTC) nicht, z. B. im Mobilfunk,
   schicken Spieler und Gastgeber ihre Nachrichten über einen öffentlichen Nachrichten-Server. */
const RELAY = { brokers: ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt', 'wss://test.mosquitto.org:8081'] };
if(window.__relayOverride) RELAY.brokers = window.__relayOverride;
const relayTopic = (code, part) => 'punktlandung/v1/' + code + '/' + part;
function loadMqtt(cb){
  if(window.mqtt) return cb();
  const s = document.createElement('script'); s.src = 'vendor/mqtt.min.js'; s.onload = ()=>cb(); s.onerror = ()=>{}; document.head.appendChild(s);
}
function hostRelay(){
  if(!H || H.relays) return;
  H.relays = []; H.rconns = {};
  loadMqtt(()=>{
    for(const url of RELAY.brokers){
      let c; try{ c = mqtt.connect(url, {reconnectPeriod:4000, connectTimeout:8000, clean:true}); }catch(e){ continue; }
      c._code = null;
      c.on('connect', ()=>{ c._code = H.code; c.subscribe(relayTopic(H.code, 'up')); renderRelayStatus(); });
      c.on('close', ()=>renderRelayStatus());
      c.on('error', ()=>{});
      c.on('message', (topic, buf)=>{
        let m; try{ m = JSON.parse(buf.toString()); }catch(e){ return; }
        if(!m || !m.cid || !m.msg || topic !== relayTopic(H.code, 'up')) return;
        const key = url + '|' + m.cid;
        let conn = H.rconns[key];
        if(!conn){ const code = H.code, cid = String(m.cid).slice(0,40); conn = H.rconns[key] = {open:true, relay:true, send(msg){ try{ c.publish(relayTopic(code, 'down/' + cid), JSON.stringify(msg)); }catch(e){} }, close(){ this.open = false; }}; }
        conn.seen = Date.now(); conn.open = true;
        hostOnData(conn, m.msg);
      });
      H.relays.push(c);
    }
    // Spieler über den Umweg melden sich alle 10 s; wer 35 s still ist, gilt als getrennt
    clearInterval(H.rwatch);
    H.rwatch = setInterval(()=>{ for(const pid of H.order){ const p = H.players[pid]; if(p.conn && p.conn.relay && Date.now() - p.conn.seen > 35000){ p.conn.open = false; p.connected = false; p.conn = null; renderHostLight(); } } }, 10000);
  });
}
function renderRelayStatus(){ const el=document.getElementById('hrelay'); if(el && H && H.relays){ const n=H.relays.filter(c=>c.connected).length; el.textContent = 'Umweg-Server: ' + n + ' von ' + RELAY.brokers.length + ' verbunden'; } }
function hostRelayResub(){ (H.relays||[]).forEach(c=>{ try{ if(c._code) c.unsubscribe(relayTopic(c._code, 'up')); c._code = H.code; c.subscribe(relayTopic(H.code, 'up')); }catch(e){} }); }
function playerRelay(){
  if(P.relay) return;
  P.relay = 'starting';
  setStatus('Direkte Verbindung klappt nicht, nehme den Umweg über einen Server …');
  loadMqtt(()=>{
    const cid = (P.pid + '').slice(0,16) + Math.random().toString(36).slice(2,6);
    let i = 0;
    const next = ()=>{
      const url = RELAY.brokers[i++ % RELAY.brokers.length];
      let c; try{ c = mqtt.connect(url, {reconnectPeriod:0, connectTimeout:7000, clean:true}); }catch(e){ return setTimeout(next, 1000); }
      P.relay = c; let ok = false, done = false;
      const host = url.replace(/^wss?:\/\//,'').replace(/[:/].*$/,'');
      setStatus('Umweg: verbinde mit ' + host + ' …');
      const again = ()=>{ if(done || P.relay !== c) return; done = true; try{ c.end(true); }catch(e){} P.online = false; setTimeout(()=>{ if(P.relay === c) next(); }, ok ? 1500 : 300); };
      c.on('error', ()=>{ if(!ok) again(); });
      c.on('close', ()=>{ if(ok){ setStatus('Verbindung verloren, verbinde neu …'); } again(); });
      c.on('connect', ()=>{
        ok = true;
        c.subscribe(relayTopic(P.code, 'down/' + cid), ()=>{
          const conn = {open:true, relay:true, send(msg){ try{ c.publish(relayTopic(P.code, 'up'), JSON.stringify({cid, msg})); }catch(e){} }};
          P.conn = conn; clearTimeout(P.wait); clearTimeout(P.retry);
          setStatus('Umweg über ' + host + ' steht, warte auf den Gastgeber …');
          conn.send({t:'hello', pid:P.pid, name:P.name});
          // Kommt keine Antwort, Hallo wiederholen (Gastgeber evtl. auf anderem Server)
          clearTimeout(P.hello); P.hello = setTimeout(()=>{ if(P.relay === c && !P.online){ again(); } }, 6000);
        });
      });
      c.on('message', (t, buf)=>{ let m; try{ m = JSON.parse(buf.toString()); }catch(e){ return; } if(P.relay !== c) return; if(!P.online){ P.online = true; setStatus(''); } playerOnData(m); });
    };
    next();
    clearInterval(P.ping); P.ping = setInterval(()=>{ if(P.conn && P.conn.relay && P.online) P.conn.send({t:'ping'}); }, 10000);
  });
}

/* ---------------- HOST (Tablet) ---------------- */
let H = null;
function startHost(play){
  H = { code: partyCode(), peer: null, mode: 'kreis', players: {}, order: [], phase: 'lobby', set: [], q: 0, dots: {}, history: [], status: 'Verbinde …', play: !!play };
  if(H.play){   // Handy-Party: der Gastgeber spielt auf seinem Handy selbst mit
    let n=''; try{ n=localStorage.getItem('pl-name')||''; }catch(e){}
    H.players.host = { name: n || 'Gastgeber', color: color(0), score: 0, km: 0, conn: null, connected: true, joinedAt: 0, me: true };
    H.order.push('host');
  }
  wakeLock();
  hostPeer();
  hostRelay();
  renderHost();
}
function hostPeer(){
  const peer = new Peer(PARTY.prefix + H.code, PARTY.peerOpts);
  H.peer = peer;
  // Antwortet der Vermittlungs-Server nicht, nach 10 s neu versuchen
  const t = setTimeout(()=>{ if(H.peer===peer && !peer.open){ try{ peer.destroy(); }catch(e){} H.status='Server antwortet nicht, neuer Versuch …'; renderHostStatus(); hostPeer(); } }, 10000);
  peer.on('open', ()=>{ clearTimeout(t); if(H.peer!==peer) return; const first = H.status!=='bereit'; H.status = 'bereit'; if(first) renderHost(); else renderHostStatus(); });
  peer.on('error', err=>{
    if(err.type === 'unavailable-id'){ H.code = partyCode(); peer.destroy(); hostPeer(); hostRelayResub(); return; }
    if(err.type === 'peer-unavailable') return;
    if(H.peer!==peer) return;
    H.status = 'Verbindungsproblem: ' + err.type + ', neuer Versuch …'; renderHostStatus();
    if(['network','server-error','socket-error','socket-closed'].includes(err.type)) setTimeout(()=>{ if(H.peer===peer && !peer.open){ try{ peer.destroy(); }catch(e){} hostPeer(); } }, 3000);
  });
  peer.on('disconnected', ()=>{ if(H.peer!==peer) return; H.status = 'Verbindung zum Server weg, verbinde neu …'; renderHostStatus(); setTimeout(()=>{ try{ if(H.peer===peer && !peer.destroyed && peer.disconnected) peer.reconnect(); }catch(e){ try{ peer.destroy(); }catch(_){} hostPeer(); } }, 1500); });
  // Kommt der Gastgeber-Bildschirm zurück (Handy war kurz aus), Verbindung zum Server prüfen
  if(!H.visBound){ H.visBound = true; document.addEventListener('visibilitychange', ()=>{ if(H && document.visibilityState==='visible' && H.peer && (H.peer.destroyed || H.peer.disconnected)){ try{ if(!H.peer.destroyed) H.peer.reconnect(); else hostPeer(); }catch(e){ hostPeer(); } } }); }
  peer.on('connection', conn=>{
    conn.on('data', msg=>hostOnData(conn, msg));
    conn.on('close', ()=>{ for(const pid of H.order){ const p=H.players[pid]; if(p.conn===conn){ p.connected=false; p.conn=null; } } renderHostLight(); });
  });
}
function send(conn, msg){ try{ if(conn && conn.open) conn.send(msg); }catch(e){} }
function broadcast(fn){ for(const pid of H.order){ const p=H.players[pid]; if(p.conn) send(p.conn, fn(pid,p)); } }
function hostOnData(conn, msg){
  if(!msg || typeof msg !== 'object') return;
  if(msg.t === 'hello'){
    const pid = String(msg.pid||'').slice(0,40); let name = String(msg.name||'').trim().slice(0,20) || 'Spieler';
    if(!pid) return;
    let p = H.players[pid];
    if(!p){
      if(H.order.some(id=>H.players[id].name.toLowerCase()===name.toLowerCase())) name += ' ' + (H.order.length+1);
      p = H.players[pid] = { name, color: color(H.order.length), score: 0, km: 0, conn: null, connected: false, joinedAt: H.q };
      H.order.push(pid);
    }
    if(p.conn && p.conn !== conn){ try{ p.conn.close(); }catch(e){} }
    p.conn = conn; p.connected = true;
    send(conn, {t:'welcome', pid, name:p.name, color:p.color, mode:H.mode});
    syncPlayer(pid);
    if(H.phase === 'lobby') renderHost(); else renderHostLight();
  }
  if(msg.t === 'dot'){
    const pid = Object.keys(H.players).find(id=>H.players[id].conn===conn);
    if(!pid || H.phase!=='question' || msg.num!==H.q) return;
    const x = +msg.x, y = +msg.y; if(!isFinite(x)||!isFinite(y)) return;
    H.dots[pid] = {x,y};
    send(conn, {t:'wait', num:H.q});
    renderHostLight();
    checkAllIn();
  }
}
function checkAllIn(){
  const active = H.order.filter(id=>H.players[id].connected);
  if(active.length && active.every(id=>H.dots[id])) setTimeout(()=>{ if(H.phase==='question') hostReveal(); }, 600);
}
function syncPlayer(pid){
  const p = H.players[pid]; if(!p.conn) return;
  if(H.phase==='lobby') send(p.conn, {t:'lobby', count:H.order.length});
  if(H.phase==='question') send(p.conn, H.dots[pid] ? {t:'wait', num:H.q} : {t:'question', num:H.q, idx:H.set[H.q], total:ROUND});
  if(H.phase==='reveal'){ const r=(H.history[H.q]||[]).find(r=>r.pid===pid); send(p.conn, r ? {t:'result', num:H.q, ...r, mode:H.mode, total:ROUND, score:p.score, rev:revPayload()} : {t:'missed', num:H.q, total:ROUND, mode:H.mode, score:p.score, rev:revPayload()}); }
  if(H.phase==='end') send(p.conn, endMsg(pid));
}
function renderHostStatus(){ const el=document.getElementById('hstatus'); if(el) el.textContent=H.status; }
function hostPlayerList(withState){
  return `<ul class="players">${H.order.map(pid=>{ const p=H.players[pid];
    const st = withState ? (H.dots[pid] ? '<span class="res ok">✓</span>' : '<span class="muted">tippt …</span>') : '';
    return `<li><i class="chip" style="background:${p.color}"></i><span>${esc(p.name)}${p.me?' (du)':''}</span>${p.connected?'':'<span class="muted">getrennt</span>'}${st}</li>`; }).join('')}</ul>`;
}
function renderHostLight(){
  if(!H) return;
  const el = document.getElementById('hplayers');
  if(el) el.innerHTML = hostPlayerList(H.phase==='question');
  const c = document.getElementById('hcount'); if(c) c.textContent = H.order.length + ' Spieler';
}
function renderHost(){
  if(H.phase==='lobby'){ renderHostLobby(); renderRelayStatus(); return; }
  if(H.phase==='question') return renderHostQuestion();
  if(H.phase==='reveal') return renderHostReveal();
  if(H.phase==='end') return renderHostEnd();
}
function renderHostLobby(){
  const url = joinUrl(H.code);
  app.innerHTML = `<div class="screen host">
    <div class="qhead"><span class="label">${H.play?'Handy-Party':'Partymodus'}</span><span class="lvl" id="hstatus">${esc(H.status)}</span></div>
    ${H.play?`<p class="label">Dein Name</p><input type="text" id="hname" maxlength="20" value="${esc(H.players.host.name)}" aria-label="Dein Name">`:''}
    <h1>Punkt&shy;landung<span class="dot"></span></h1>
    <div class="lobby">
      <div class="qrbox">${H.status==='bereit' ? qrSvg(url) : '<p class="muted">Raum wird geöffnet …</p>'}</div>
      <div class="lobbyinfo">
        <p class="muted">Mit dem Handy den QR-Code scannen oder diese Adresse öffnen:</p>
        <p class="joinurl">${esc(url)}</p>
        <p class="label">Raumcode</p><div class="code">${H.code}</div>
        <p class="muted small" id="hrelay">Umweg-Server: verbinde …</p>
        <p class="muted small">Am besten klappt es im selben WLAN. Unterwegs: Gastgeber macht einen Hotspot an, die anderen verbinden sich damit. Diesen Bildschirm offen lassen.</p>
      </div>
    </div>
    <p class="label" id="hcount">${H.order.length} Spieler</p>
    <div id="hplayers">${hostPlayerList(false)}</div>
    ${diffPicker()}
    <p class="label">Wertung</p>
    <div class="modes">
      <button class="mode ${H.mode==='kreis'?'on':''}" data-mode="kreis"><b>Treffer im Ziel</b><span>1 Punkt, wenn dein Punkt im Kreis oder in der Zielfläche liegt.</span></button>
      <button class="mode ${H.mode==='distanz'?'on':''}" data-mode="distanz"><b>Je näher, desto mehr</b><span>Bis zu 100 Punkte, je nach Abstand zum Ziel.</span></button>
    </div>
    <button class="primary stick" id="hstart" ${H.order.length<(H.play?2:1)?'disabled':''}>Spiel starten</button>
    ${H.play?'<p class="muted small">Du spielst selbst mit und tippst nach jeder Auflösung auf „Nächste Frage“, wenn alle so weit sind.</p>':''}
    <button class="ghost" id="hback">Zurück zum Ein-Handy-Spiel</button>
  </div>`;
  app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{ H.mode=b.dataset.mode; renderHostLobby(); });
  bindDiff(renderHostLobby);
  const hn = document.getElementById('hname');
  if(hn) hn.onchange = hn.oninput = ()=>{ const v=hn.value.trim().slice(0,20); H.players.host.name = v || 'Gastgeber'; try{ if(v) localStorage.setItem('pl-name', v); }catch(e){} };
  document.getElementById('hstart').onclick = ()=>{
    H.set = drawSet(); H.q = 0; H.history = [];
    H.order.forEach(pid=>{ H.players[pid].score=0; H.players[pid].km=0; });
    broadcast(()=>({t:'mode', mode:H.mode}));
    hostQuestion();
  };
  document.getElementById('hback').onclick = ()=>{ try{ H.peer.destroy(); }catch(e){} H=null; render(); };
}
function hostQuestion(){
  H.phase='question'; H.dots={};
  broadcast(()=>({t:'question', num:H.q, idx:H.set[H.q], total:ROUND}));
  renderHost();
}
function renderHostQuestion(){
  const q = DATA.questions[H.set[H.q]], m = DATA.maps[q.map];
  if(H.play && !H.dots.host){   // Gastgeber setzt seinen eigenen Punkt
    const me = H.players.host; let dot = null;
    app.innerHTML = `<div class="screen fit">
      <div class="qhead"><span class="label">Frage ${H.q+1} / ${ROUND} · Raum ${H.code}</span><span class="lvl ${q.lvl}">${q.lvl}</span></div>
      <div class="qtext">${esc(q.t)}</div>
      <div class="mapwrap" id="mw" style="aspect-ratio:${m.w}/${Math.max(m.h, m.w*0.62)}">${mapSVG(m)}${zoomButtons}<div class="hint">Tippen setzt den Punkt · zwei Finger zoomen</div></div>
      <button class="primary stick" id="ok" disabled>OK, Punkt setzen</button>
    </div>`;
    const wrap=document.getElementById('mw'), over=wrap.querySelector('#over'), ok=document.getElementById('ok');
    let ctl;
    const draw=anim=>{ over.innerHTML = dot ? (anim?dotMarkup(dot.x,dot.y,me.color,ctl.unit()):dotMarkup(dot.x,dot.y,me.color,ctl.unit()).replace('class="pop"','')) : ''; };
    ctl = setupMap(wrap, m, (x,y)=>{ dot={x:+x.toFixed(1),y:+y.toFixed(1)}; ok.disabled=false; const h=wrap.querySelector('.hint'); if(h) h.hidden=true; draw(true); });
    wrap._onzoom = ()=>draw(false);
    ok.onclick = ()=>{ if(!dot || H.phase!=='question') return; H.dots.host = dot; renderHost(); checkAllIn(); };
    return;
  }
  app.innerHTML = `<div class="screen host">
    <div class="qhead"><span class="label">Frage ${H.q+1} / ${ROUND} · Raum ${H.code}</span><span class="lvl ${q.lvl}">${q.lvl}</span></div>
    <div class="riddle">${H.play?'Dein Punkt ist gesetzt. Warte auf die anderen oder löse jetzt auf.':'Rätsel lösen, dann auf dem Handy den Ort tippen'}</div>
    <div class="qtext big">${esc(q.t)}</div>
    <div class="hostgrid">
      <div class="mapwrap" id="mw" style="aspect-ratio:${m.w}/${Math.max(m.h, m.w*0.62)}">${mapSVG(m)}${zoomButtons}</div>
      <div><p class="label" id="hcount">${H.order.length} Spieler</p><div id="hplayers">${hostPlayerList(true)}</div></div>
    </div>
    <button class="ghost stick" id="hnow">Jetzt auflösen</button>
  </div>`;
  setupMap(document.getElementById('mw'), m, null);
  document.getElementById('hnow').onclick = ()=>hostReveal();
}
function hostReveal(){
  const q = DATA.questions[H.set[H.q]];
  const res = H.order.filter(pid=>H.dots[pid]).map(pid=>{
    const d=H.dots[pid], j=judge(q, d.x, d.y), p=H.players[pid];
    const pts = ptsFor(H.mode, j, q), km = j.km;
    p.score += pts; p.km += km;
    return {pid, hit: j.hit, km, pts};
  });
  H.history[H.q] = res; H.phase='reveal';
  const rev = revPayload();
  for(const r of res){ const p=H.players[r.pid]; send(p.conn, {t:'result', num:H.q, ...r, mode:H.mode, total:ROUND, score:p.score, rev}); }
  H.order.filter(pid=>!H.dots[pid]).forEach(pid=>send(H.players[pid].conn, {t:'missed', num:H.q, total:ROUND, mode:H.mode, score:H.players[pid].score, rev}));
  renderHost();
}
/* Auflösung: gemeinsame Teile für Tablet und Handys */
function revealMap(wrap, m, q, dots){
  const over = wrap.querySelector('#over'); let ctl;
  const draw = anim=>{
    const u = ctl.unit();
    let s = targetSVG(q, u, anim);
    dots.forEach(d=>{ s += dotMarkup(d.x,d.y,d.c,u,d.n); });
    over.innerHTML = anim ? s : s.replace(/class="pop"/g,'');
  };
  ctl = setupMap(wrap, m, null);
  wrap._onzoom = ()=>draw(false);
  revealZoom(ctl, m, q, dots);
  draw(true);
}
function revealSolve(q){ return `<div class="solve"><span class="label">Gemeint war</span><div class="sol">${esc(q.s)} <span class="arrow">→</span> <strong>${esc(q.o)}</strong></div><p class="muted">${esc(q.a)} ${targetText(q)}</p></div>`; }
function revealLists(rows, board){
  return `<ul class="results">${rows.map(r=>`<li><span class="res ${r.hit?'ok':'bad'}">${r.hit?'✓':'✗'}</span><i class="chip" style="background:${r.c}"></i><span class="n">${esc(r.n)}</span><span class="km">${r.km} km · +${r.pts}</span></li>`).join('') || '<li>Keiner hat einen Punkt gesetzt.</li>'}</ul>
    <p class="label" style="margin-top:14px">Zwischenstand</p>
    <ol class="board">${board.map(p=>`<li><i class="chip" style="background:${p.c}"></i><span>${esc(p.n)}</span><b>${p.s}</b></li>`).join('')}</ol>`;
}
function revPayload(){
  const res = H.history[H.q] || [];
  const rows = [...res].sort((a,b)=>b.pts-a.pts || a.km-b.km).map(r=>{ const d=H.dots[r.pid], p=H.players[r.pid]; return {n:p.name, c:p.color, x:d.x, y:d.y, hit:r.hit, km:r.km, pts:r.pts}; });
  const board = hostRanking().map(p=>({n:p.name, c:p.color, s:p.score}));
  return {idx:H.set[H.q], rows, board};
}
function renderHostReveal(){
  const q = DATA.questions[H.set[H.q]], m = DATA.maps[q.map], res = H.history[H.q];
  const last = H.q === ROUND-1;
  const rv = revPayload();
  app.innerHTML = `<div class="screen host">
    <div class="qhead"><span class="label">Auflösung · Frage ${H.q+1} / ${ROUND}</span><span class="lvl ${q.lvl}">${q.lvl}</span></div>
    <div class="qtext">${esc(q.t)}</div>
    ${revealSolve(q)}
    <div class="hostgrid">
      <div class="mapwrap" id="mw" style="aspect-ratio:${m.w}/${Math.max(m.h, m.w*0.62)}">${mapSVG(m)}${zoomButtons}</div>
      <div>${revealLists(rv.rows, rv.board)}</div>
    </div>
    <button class="primary stick" id="hnext">${last?'Zur Endwertung':'Nächste Frage'}</button>
  </div>`;
  revealMap(document.getElementById('mw'), m, q, rv.rows);
  document.getElementById('hnext').onclick = ()=>{
    if(last){ H.phase='end'; H.order.forEach(pid=>send(H.players[pid].conn, endMsg(pid))); renderHost(); }
    else { H.q++; hostQuestion(); }
  };
}
function hostRanking(){ return H.order.map(pid=>({pid,...H.players[pid]})).sort((a,b)=>b.score-a.score || a.km-b.km); }
function endMsg(pid){ const rk=hostRanking(); const i=rk.findIndex(r=>r.pid===pid); return {t:'end', rank:i+1, of:rk.length, score:H.players[pid].score, mode:H.mode, winner:rk[0].name, rows:rk.map(r=>({n:r.name, c:r.color, km:r.km, s:r.score}))}; }
function renderHostEnd(){
  const rows = hostRanking();
  app.innerHTML = `<div class="screen host">
    <p class="label">Endwertung · ${H.mode==='kreis'?'Treffer im Ziel':'Je näher, desto mehr'}</p>
    <h1>${esc(rows[0].name)} gewinnt<span class="dot"></span></h1>
    <div class="tablewrap"><table>
      <thead><tr><th>#</th><th>Spieler</th><th>km daneben</th><th class="pts">${ptsLabel(H.mode)}</th></tr></thead>
      <tbody>${rows.map((r,k)=>`<tr class="${k===0?'win':''}"><td>${k+1}</td><td><span class="row"><i class="chip" style="background:${r.color}"></i>${esc(r.name)}</span></td><td>${r.km.toLocaleString('de-DE')}</td><td class="pts">${r.score}</td></tr>`).join('')}</tbody>
    </table></div>
    <button class="primary" id="hagain">Nochmal mit allen</button>
  </div>`;
  document.getElementById('hagain').onclick = ()=>{ H.phase='lobby'; broadcast(()=>({t:'lobby', count:H.order.length})); renderHost(); };
}

/* ---------------- SPIELER (Handy) ---------------- */
let P = null;
function startPlayer(code){
  code = String(code).toUpperCase().replace(/[^A-Z]/g,'').slice(0,4);
  let pid = null, name = '';
  try{ pid = localStorage.getItem('pl-pid'); name = localStorage.getItem('pl-name') || ''; }catch(e){}
  if(!pid){ pid = Math.random().toString(36).slice(2) + Date.now().toString(36); try{ localStorage.setItem('pl-pid', pid); }catch(e){} }
  let lastCode = null; try{ lastCode = localStorage.getItem('pl-code'); }catch(e){}
  P = { code, pid, name, peer:null, conn:null, state:'name', color:'#ffd23f', mode:'kreis', num:-1, idx:null, dot:null, last:null, retry:null, online:false };
  wakeLock();
  if(name && lastCode === code){ P.state='connecting'; renderPlayer(); playerConnect(); }   // Seite neu geladen: automatisch wieder rein
  else renderPlayer();
}
function playerConnect(){
  clearTimeout(P.retry);
  if(P.relay) return;   // Umweg läuft schon
  if(P.peer && !P.peer.destroyed && P.peer.open){ openConn(); return; }
  // Hängt die Verbindung zum Vermittlungs-Server oder ist sie kaputt: alten Peer wegwerfen und frisch anfangen
  if(P.peer){ try{ P.peer.destroy(); }catch(e){} }
  const peer = P.peer = new Peer(PARTY.prefix + 'p-' + Math.random().toString(36).slice(2, 10), PARTY.peerOpts);
  setStatus((P.fails||0)>=2 ? SRVHINT : 'Verbinde mit dem Server …');
  clearTimeout(P.srv);
  P.srv = setTimeout(()=>{ if(P.peer===peer && !peer.open){ P.fails=(P.fails||0)+1; playerRelay(); } }, 10000);
  peer.on('open', ()=>{ if(P.peer!==peer) return; clearTimeout(P.srv); setStatus('Server erreicht, suche das Spiel …'); openConn(); });
  peer.on('disconnected', ()=>{ if(P.peer!==peer) return; setTimeout(()=>{ try{ if(P.peer===peer && !peer.destroyed && peer.disconnected) peer.reconnect(); }catch(e){ scheduleRetry(); } }, 1000); });
  peer.on('error', err=>{
    if(P.peer!==peer) return;
    if(err.type==='peer-unavailable'){ P.online=false; P.fails=(P.fails||0)+1; if(P.fails>=2){ playerRelay(); return; } setStatus('Raum '+P.code+' nicht gefunden. Ist das Spiel beim Gastgeber noch offen (Bildschirm an, Browser im Vordergrund)?'); }
    else { P.fails=(P.fails||0)+1; if(P.fails>=2){ playerRelay(); return; } setStatus('Verbindungsproblem ('+err.type+'), versuche es weiter …'); }
    scheduleRetry();
  });
}
const SRVHINT = 'Der Spiel-Server ist gerade nicht erreichbar. Prüf das Internet (WLAN oder mobile Daten an?). Ich versuche es automatisch weiter …';
const HINT = 'Die Handys finden sich nicht. Tipp: Alle ins gleiche WLAN – oder der Gastgeber macht einen Hotspot an und die anderen verbinden sich damit. Ich versuche es weiter …';
function openConn(){
  const conn = P.peer.connect(PARTY.prefix + P.code, {reliable:true});
  P.conn = conn;
  clearTimeout(P.wait);
  // Ohne Antwort nach 15 s: abbrechen, neu versuchen und ab dem 2. Fehlschlag einen Tipp zeigen
  P.wait = setTimeout(()=>{ if(P.conn===conn && !P.online){ P.fails=(P.fails||0)+1; try{ conn.close(); }catch(e){} playerRelay(); } }, 8000);
  conn.on('open', ()=>{ clearTimeout(P.wait); P.online=true; P.fails=0; setStatus(''); send(conn, {t:'hello', pid:P.pid, name:P.name}); });
  conn.on('data', playerOnData);
  conn.on('close', ()=>{ if(P.conn===conn){ P.online=false; setStatus('Verbindung verloren, verbinde neu …'); scheduleRetry(); } });
  conn.on('error', ()=>scheduleRetry());
}
function scheduleRetry(){ clearTimeout(P.retry); P.retry = setTimeout(()=>{ if(!P.online) playerConnect(); }, 2500); }
document.addEventListener('visibilitychange', ()=>{ if(P && document.visibilityState==='visible' && !P.online && P.state!=='name') playerConnect(); });
function setStatus(t){ const el=document.getElementById('pstatus'); if(el){ el.textContent=t; el.hidden=!t; } }
function playerOnData(msg){
  if(!msg || typeof msg!=='object') return;
  if(msg.t==='welcome'){ P.name=msg.name; P.color=msg.color; P.mode=msg.mode; if(P.state==='name'||P.state==='connecting'){ P.state='lobby'; renderPlayer(); } }
  if(msg.t==='mode'){ P.mode=msg.mode; }
  if(msg.t==='lobby'){ P.state='lobby'; P.count=msg.count; renderPlayer(); }
  if(msg.t==='question'){ if(P.state==='place' && P.num===msg.num) return; P.num=msg.num; P.idx=msg.idx; P.dot=null; P.state='place'; renderPlayer(); }
  if(msg.t==='wait'){ if(P.state==='wait' && P.num===msg.num) return; P.num=msg.num; P.state='wait'; renderPlayer(); }
  if(msg.t==='result'){ P.last=msg; P.state='result'; renderPlayer(); }
  if(msg.t==='missed'){ P.last=msg; P.state='missed'; renderPlayer(); }
  if(msg.t==='end'){ P.last=msg; P.state='end'; renderPlayer(); }
}
function playerShell(inner){
  return `<div class="screen${P.state==='place'?' fit':''}">
    <div class="qhead"><span class="label">Raum ${esc(P.code)}</span>${P.name?`<span class="turn"><i class="chip" style="background:${P.color}"></i>${esc(P.name)}</span>`:''}</div>
    <p class="err" id="pstatus" ${P.online||P.state==='name'?'hidden':''}>Verbinde …</p>
    ${inner}</div>`;
}
function renderPlayer(){
  if(P.state==='name'){
    app.innerHTML = playerShell(`<h1>Punkt&shy;landung<span class="dot"></span></h1>
      <p class="muted">Du spielst mit deinem Handy. Die Rätsel und die Auflösung kommen direkt hierher.</p>
      <form id="pf" class="row" autocomplete="off"><input type="text" id="pn" maxlength="20" placeholder="Dein Name" aria-label="Dein Name" value="${esc(P.name)}"><button class="primary" style="width:auto" type="submit">Mitspielen</button></form>
      <div class="err" id="perr"></div>`);
    document.getElementById('pf').onsubmit = e=>{ e.preventDefault(); const n=document.getElementById('pn').value.trim(); if(!n){ document.getElementById('perr').textContent='Bitte gib deinen Namen ein.'; return; }
      P.name=n; try{ localStorage.setItem('pl-name', n); localStorage.setItem('pl-code', P.code); }catch(_){}
      P.state='connecting'; renderPlayer(); playerConnect(); };
    return;
  }
  if(P.state==='connecting'){ app.innerHTML = playerShell(`<div class="cover"><h2>Verbinde mit dem Tablet …</h2><p class="muted">Raum ${esc(P.code)}</p></div>`); setStatus(''); return; }
  if(P.state==='lobby'){ app.innerHTML = playerShell(`<div class="cover"><h2>Du bist drin!</h2><p class="muted">Warte, bis der Gastgeber das Spiel startet.</p></div>`); return; }
  if(P.state==='place'){
    const q = DATA.questions[P.idx], m = DATA.maps[q.map];
    app.innerHTML = playerShell(`
      <div class="qhead"><span class="label">Frage ${P.num+1} / ${ROUND}</span><span class="lvl ${q.lvl}">${q.lvl}</span></div>
      <div class="qtext">${esc(q.t)}</div>
      <div class="mapwrap" id="mw" style="aspect-ratio:${m.w}/${Math.max(m.h, m.w*0.62)}">${mapSVG(m)}${zoomButtons}<div class="hint">Tippen setzt den Punkt · zwei Finger zoomen</div></div>
      <button class="primary stick" id="ok" disabled>OK, Punkt abschicken</button>`);
    const wrap=document.getElementById('mw'), over=wrap.querySelector('#over'), ok=document.getElementById('ok');
    let ctl;
    const draw=()=>{ over.innerHTML = P.dot ? dotMarkup(P.dot.x,P.dot.y,P.color,ctl.unit()) : ''; };
    ctl = setupMap(wrap, m, (x,y)=>{ P.dot={x:+x.toFixed(1),y:+y.toFixed(1)}; ok.disabled=false; const h=wrap.querySelector('.hint'); if(h) h.hidden=true; draw(); });
    wrap._onzoom = ()=>{ if(P.dot) over.innerHTML = dotMarkup(P.dot.x,P.dot.y,P.color,ctl.unit()).replace('class="pop"',''); };
    ok.onclick = ()=>{ if(!P.dot) return; if(!P.online){ setStatus('Keine Verbindung. Dein Punkt wird gesendet, sobald sie wieder da ist.'); }
      send(P.conn, {t:'dot', num:P.num, x:P.dot.x, y:P.dot.y}); ok.disabled=true; ok.textContent='Gesendet …'; };
    return;
  }
  if(P.state==='wait'){ app.innerHTML = playerShell(`<div class="cover"><h2>Punkt gesetzt</h2><p class="muted">Warte auf die anderen. Die Auflösung kommt gleich auch hier aufs Handy.</p></div>`); return; }
  if(P.state==='result' || P.state==='missed'){ const r=P.last||{};
    const head = P.state==='missed' ? `<div class="bigname" style="color:var(--bad)">Zu spät</div><p class="muted">Diese Runde lief ohne deinen Punkt.</p>`
      : `<div class="bigname" style="color:${r.hit?'var(--ok)':'var(--bad)'}">${r.hit?'Treffer!':'Daneben'}</div><p class="muted">${r.km} km vom Ziel · +${r.pts} ${ptsLabel(r.mode)} · Gesamt: ${r.score}</p>`;
    const rv = r.rev, q = rv && DATA.questions[rv.idx];
    if(!q){ app.innerHTML = playerShell(`<div class="cover">${head}</div>`); return; }
    const m = DATA.maps[q.map];
    app.innerHTML = playerShell(`<div class="qhead"><span class="label">Auflösung · Frage ${(r.num||0)+1} / ${r.total||ROUND}</span><span class="lvl ${q.lvl}">${q.lvl}</span></div>
      <div class="phead">${head}</div>
      <div class="qtext">${esc(q.t)}</div>
      ${revealSolve(q)}
      <div class="mapwrap" id="mw" style="aspect-ratio:${m.w}/${Math.max(m.h, m.w*0.62)}">${mapSVG(m)}${zoomButtons}</div>
      ${revealLists(rv.rows, rv.board)}
      <p class="muted" style="margin-top:12px">Gleich geht es mit der nächsten Frage weiter.</p>`);
    revealMap(document.getElementById('mw'), m, q, rv.rows);
    return; }
  if(P.state==='end'){ const r=P.last;
    app.innerHTML = playerShell(`<div class="cover"><p class="label">Endstand</p><div class="bigname" style="color:${r.rank===1?'var(--accent)':'var(--fg)'}">Platz ${r.rank}</div>
      <p class="muted">von ${r.of} · ${r.score} ${ptsLabel(r.mode)}</p>${r.rank===1?'<h2>Du hast gewonnen!</h2>':`<p class="muted">Gewonnen hat ${esc(r.winner)}.</p>`}</div>
      ${r.rows?`<div class="tablewrap"><table><thead><tr><th>#</th><th>Spieler</th><th>km daneben</th><th class="pts">${ptsLabel(r.mode)}</th></tr></thead>
      <tbody>${r.rows.map((x,k)=>`<tr class="${k===0?'win':''}"><td>${k+1}</td><td><span class="row"><i class="chip" style="background:${x.c}"></i>${esc(x.n)}</span></td><td>${x.km.toLocaleString('de-DE')}</td><td class="pts">${x.s}</td></tr>`).join('')}</tbody></table></div>`:''}`); return; }
}

/* ---------- Verbindungstest: ?test ---------- */
function runDiag(){
  const rows = [];
  const show = ()=>{ app.innerHTML = `<div class="screen"><h2>Verbindungstest</h2><p class="muted">Bitte warten, bis alle Zeilen fertig sind (ca. 20 Sekunden), dann ein Bildschirmfoto schicken.</p>
    <ul class="results">${rows.map(r=>`<li><span class="res ${r.ok===true?'ok':r.ok===false?'bad':''}">${r.ok===true?'✓':r.ok===false?'✗':'…'}</span><span class="n">${esc(r.name)}</span><span class="km">${esc(r.info||'')}</span></li>`).join('')}</ul>
    <p class="muted small">${esc(navigator.userAgent)}</p></div>`; };
  const row = name => { const r = {name, ok:null, info:''}; rows.push(r); show(); return (ok, info)=>{ r.ok = ok; r.info = info; show(); }; };
  const t0 = Date.now(), ms = ()=>(Date.now()-t0)+' ms';
  // 1. Vermittlungs-Server (PeerJS)
  const d1 = row('Vermittlungs-Server');
  try{ const p = new Peer(PARTY.prefix + 'test-' + Math.random().toString(36).slice(2,8), PARTY.peerOpts);
    const to = setTimeout(()=>{ d1(false, 'keine Antwort'); try{p.destroy();}catch(e){} }, 12000);
    p.on('open', ()=>{ clearTimeout(to); d1(true, ms()); setTimeout(()=>{ try{p.destroy();}catch(e){} }, 500); });
    p.on('error', e=>{ clearTimeout(to); d1(false, e.type); });
  }catch(e){ d1(false, String(e.message||e)); }
  // 2. Direktverbindung: welche Wege findet das Handy?
  const d2 = row('Direktverbindung (Wege)');
  try{ const pc = new RTCPeerConnection(PARTY.peerOpts.config); pc.createDataChannel('x'); const seen = {host:0, srflx:0, relay:0};
    pc.onicecandidate = e=>{ if(e.candidate){ const m = / typ (\w+)/.exec(e.candidate.candidate); if(m && m[1] in seen) seen[m[1]]++; } };
    pc.createOffer().then(o=>pc.setLocalDescription(o));
    setTimeout(()=>{ d2(seen.srflx+seen.relay>0, `lokal ${seen.host}, öffentlich ${seen.srflx}, Relais ${seen.relay}`); try{pc.close();}catch(e){} }, 9000);
  }catch(e){ d2(false, String(e.message||e)); }
  // 3. Umweg-Server (MQTT): verbinden, Nachricht an sich selbst schicken
  loadMqtt(()=>{
    for(const url of RELAY.brokers){
      const d = row('Umweg ' + url.replace(/^wss?:\/\//,'').replace(/[:/].*$/,''));
      const t1 = Date.now(), topic = 'punktlandung/v1/test/' + Math.random().toString(36).slice(2);
      let c; try{ c = mqtt.connect(url, {reconnectPeriod:0, connectTimeout:10000}); }catch(e){ d(false, String(e.message||e)); continue; }
      const to = setTimeout(()=>{ d(false, 'keine Antwort'); try{c.end(true);}catch(e){} }, 12000);
      c.on('error', e=>{ clearTimeout(to); d(false, String(e.message||e).slice(0,40)); });
      c.on('connect', ()=>{ c.subscribe(topic, ()=>c.publish(topic, 'ping')); });
      c.on('message', ()=>{ clearTimeout(to); d(true, (Date.now()-t1)+' ms'); try{c.end(true);}catch(e){} });
    }
  });
  if(!window.mqtt) setTimeout(()=>{ if(!window.mqtt){ const d = row('Umweg-Bibliothek'); d(false, 'nicht geladen'); } }, 8000);
}
