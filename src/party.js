/* ================= Partymodus: Tablet als Spielleiter, Handys als Controller =================
   Verbindung per WebRTC über PeerJS. Das Tablet ist "Host" mit der Peer-ID "punktlandung-<CODE>".
   Handys öffnen ?join=<CODE>, melden sich mit Name und fester Spieler-ID und verbinden sich neu, falls die Verbindung abreißt. */
const PARTY = {
  available: () => typeof window.Peer === 'function',
  prefix: 'punktlandung-v1-',
  peerOpts: { debug: 0, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] } },
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
function ptsFor(mode, px, r){
  if(mode === 'kreis') return px <= r ? 1 : 0;
  return Math.max(0, Math.round(100 * (1 - px / (4 * r))));   // 100 in der Mitte, 0 ab dem vierfachen Radius
}
function ptsLabel(mode){ return mode === 'kreis' ? 'Treffer' : 'Punkte'; }

/* ---------------- HOST (Tablet) ---------------- */
let H = null;
function startHost(){
  H = { code: partyCode(), peer: null, mode: 'kreis', players: {}, order: [], phase: 'lobby', set: [], q: 0, dots: {}, history: [], status: 'Verbinde …' };
  wakeLock();
  hostPeer();
  renderHost();
}
function hostPeer(){
  const peer = new Peer(PARTY.prefix + H.code, PARTY.peerOpts);
  H.peer = peer;
  peer.on('open', ()=>{ H.status = 'bereit'; renderHost(); });
  peer.on('error', err=>{
    if(err.type === 'unavailable-id'){ H.code = partyCode(); peer.destroy(); hostPeer(); return; }
    if(err.type === 'peer-unavailable') return;
    H.status = 'Verbindungsproblem: ' + err.type; renderHostStatus();
  });
  peer.on('disconnected', ()=>{ H.status = 'Verbindung zum Vermittler weg, verbinde neu …'; renderHostStatus(); setTimeout(()=>{ try{ if(!peer.destroyed) peer.reconnect(); }catch(e){} }, 1500); });
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
    const active = H.order.filter(id=>H.players[id].connected);
    if(active.length && active.every(id=>H.dots[id])) setTimeout(()=>{ if(H.phase==='question') hostReveal(); }, 600);
  }
}
function syncPlayer(pid){
  const p = H.players[pid]; if(!p.conn) return;
  if(H.phase==='lobby') send(p.conn, {t:'lobby', count:H.order.length});
  if(H.phase==='question') send(p.conn, H.dots[pid] ? {t:'wait', num:H.q} : {t:'question', num:H.q, idx:H.set[H.q], total:ROUND});
  if(H.phase==='reveal'){ const r=(H.history[H.q]||[]).find(r=>r.pid===pid); send(p.conn, r ? {t:'result', num:H.q, ...r, mode:H.mode, total:ROUND, score:p.score} : {t:'wait', num:H.q}); }
  if(H.phase==='end') send(p.conn, endMsg(pid));
}
function renderHostStatus(){ const el=document.getElementById('hstatus'); if(el) el.textContent=H.status; }
function hostPlayerList(withState){
  return `<ul class="players">${H.order.map(pid=>{ const p=H.players[pid];
    const st = withState ? (H.dots[pid] ? '<span class="res ok">✓</span>' : '<span class="muted">tippt …</span>') : '';
    return `<li><i class="chip" style="background:${p.color}"></i><span>${esc(p.name)}</span>${p.connected?'':'<span class="muted">getrennt</span>'}${st}</li>`; }).join('')}</ul>`;
}
function renderHostLight(){
  if(!H) return;
  const el = document.getElementById('hplayers');
  if(el) el.innerHTML = hostPlayerList(H.phase==='question');
  const c = document.getElementById('hcount'); if(c) c.textContent = H.order.length + ' Spieler';
}
function renderHost(){
  if(H.phase==='lobby') return renderHostLobby();
  if(H.phase==='question') return renderHostQuestion();
  if(H.phase==='reveal') return renderHostReveal();
  if(H.phase==='end') return renderHostEnd();
}
function renderHostLobby(){
  const url = joinUrl(H.code);
  app.innerHTML = `<div class="screen host">
    <div class="qhead"><span class="label">Partymodus</span><span class="lvl" id="hstatus">${esc(H.status)}</span></div>
    <h1>Punkt&shy;landung<span class="dot"></span></h1>
    <div class="lobby">
      <div class="qrbox">${H.status==='bereit' ? qrSvg(url) : '<p class="muted">Raum wird geöffnet …</p>'}</div>
      <div class="lobbyinfo">
        <p class="muted">Mit dem Handy den QR-Code scannen oder diese Adresse öffnen:</p>
        <p class="joinurl">${esc(url)}</p>
        <p class="label">Raumcode</p><div class="code">${H.code}</div>
      </div>
    </div>
    <p class="label" id="hcount">${H.order.length} Spieler</p>
    <div id="hplayers">${hostPlayerList(false)}</div>
    ${diffPicker()}
    <p class="label">Wertung</p>
    <div class="modes">
      <button class="mode ${H.mode==='kreis'?'on':''}" data-mode="kreis"><b>Treffer im Kreis</b><span>1 Punkt, wenn dein Punkt im Kreis liegt.</span></button>
      <button class="mode ${H.mode==='distanz'?'on':''}" data-mode="distanz"><b>Je näher, desto mehr</b><span>Bis zu 100 Punkte, je nach Abstand zum Ziel.</span></button>
    </div>
    <button class="primary stick" id="hstart" ${H.order.length<1?'disabled':''}>Spiel starten</button>
    <button class="ghost" id="hback">Zurück zum Ein-Handy-Spiel</button>
  </div>`;
  app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{ H.mode=b.dataset.mode; renderHostLobby(); });
  bindDiff(renderHostLobby);
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
  app.innerHTML = `<div class="screen host">
    <div class="qhead"><span class="label">Frage ${H.q+1} / ${ROUND} · Raum ${H.code}</span><span class="lvl ${q.lvl}">${q.lvl}</span></div>
    <div class="riddle">Rätsel lösen, dann auf dem Handy den Ort tippen</div>
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
    const d=H.dots[pid], px=Math.hypot(d.x-q.x,d.y-q.y), p=H.players[pid];
    const pts = ptsFor(H.mode, px, q.r), km = Math.round(px/q.k);
    p.score += pts; p.km += km;
    return {pid, hit: px<=q.r, km, pts};
  });
  H.history[H.q] = res; H.phase='reveal';
  for(const r of res){ const p=H.players[r.pid]; send(p.conn, {t:'result', num:H.q, ...r, mode:H.mode, total:ROUND, score:p.score}); }
  H.order.filter(pid=>!H.dots[pid]).forEach(pid=>send(H.players[pid].conn, {t:'missed', num:H.q}));
  renderHost();
}
function renderHostReveal(){
  const q = DATA.questions[H.set[H.q]], m = DATA.maps[q.map], res = H.history[H.q];
  const last = H.q === ROUND-1;
  const sorted = [...res].sort((a,b)=>b.pts-a.pts || a.km-b.km);
  const board = H.order.map(pid=>H.players[pid]).sort((a,b)=>b.score-a.score || a.km-b.km);
  app.innerHTML = `<div class="screen host">
    <div class="qhead"><span class="label">Auflösung · Frage ${H.q+1} / ${ROUND}</span><span class="lvl ${q.lvl}">${q.lvl}</span></div>
    <div class="qtext">${esc(q.t)}</div>
    <div class="solve"><span class="label">Gemeint war</span><div class="sol">${esc(q.s)} <span class="arrow">→</span> <strong>${esc(q.o)}</strong></div><p class="muted">${esc(q.a)} Kreis: ${q.km} km Radius.</p></div>
    <div class="hostgrid">
      <div class="mapwrap" id="mw" style="aspect-ratio:${m.w}/${Math.max(m.h, m.w*0.62)}">${mapSVG(m)}${zoomButtons}</div>
      <div>
        <ul class="results">${sorted.map(r=>{ const p=H.players[r.pid]; return `<li><span class="res ${r.hit?'ok':'bad'}">${r.hit?'✓':'✗'}</span><i class="chip" style="background:${p.color}"></i><span class="n">${esc(p.name)}</span><span class="km">${r.km} km · +${r.pts}</span></li>`; }).join('') || '<li>Keiner hat einen Punkt gesetzt.</li>'}</ul>
        <p class="label" style="margin-top:14px">Zwischenstand</p>
        <ol class="board">${board.map(p=>`<li><i class="chip" style="background:${p.color}"></i><span>${esc(p.name)}</span><b>${p.score}</b></li>`).join('')}</ol>
      </div>
    </div>
    <button class="primary stick" id="hnext">${last?'Zur Endwertung':'Nächste Frage'}</button>
  </div>`;
  const wrap = document.getElementById('mw'), over = wrap.querySelector('#over');
  let ctl;
  const draw = anim=>{
    const u = ctl.unit();
    let s = `<circle cx="${q.x}" cy="${q.y}" r="${q.r}" fill="rgba(255,210,63,.28)" stroke="#ffd23f" stroke-width="${3*u}" ${anim?'class="pop"':''} style="transform-origin:${q.x}px ${q.y}px"/><circle cx="${q.x}" cy="${q.y}" r="${3*u}" fill="#ffd23f"/>`;
    res.forEach(r=>{ const d=H.dots[r.pid], p=H.players[r.pid]; s += dotMarkup(d.x,d.y,p.color,u,p.name); });
    over.innerHTML = anim ? s : s.replace(/class="pop"/g,'');
  };
  ctl = setupMap(wrap, m, null);
  wrap._onzoom = ()=>draw(false);
  const pts = res.map(r=>H.dots[r.pid]);
  const xs=[q.x-q.r,q.x+q.r,...pts.map(d=>d.x)], ys=[q.y-q.r,q.y+q.r,...pts.map(d=>d.y)];
  const bw = Math.max(Math.max(...xs)-Math.min(...xs),(Math.max(...ys)-Math.min(...ys))*m.w/m.h)*1.4;
  ctl.zoomTo((Math.max(...xs)+Math.min(...xs))/2,(Math.max(...ys)+Math.min(...ys))/2, Math.max(bw, q.r*6));
  draw(true);
  document.getElementById('hnext').onclick = ()=>{
    if(last){ H.phase='end'; H.order.forEach(pid=>send(H.players[pid].conn, endMsg(pid))); renderHost(); }
    else { H.q++; hostQuestion(); }
  };
}
function hostRanking(){ return H.order.map(pid=>({pid,...H.players[pid]})).sort((a,b)=>b.score-a.score || a.km-b.km); }
function endMsg(pid){ const rk=hostRanking(); const i=rk.findIndex(r=>r.pid===pid); return {t:'end', rank:i+1, of:rk.length, score:H.players[pid].score, mode:H.mode, winner:rk[0].name}; }
function renderHostEnd(){
  const rows = hostRanking();
  app.innerHTML = `<div class="screen host">
    <p class="label">Endwertung · ${H.mode==='kreis'?'Treffer im Kreis':'Je näher, desto mehr'}</p>
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
  if(!P.peer || P.peer.destroyed){
    P.peer = new Peer(undefined, PARTY.peerOpts);
    P.peer.on('open', ()=>openConn());
    P.peer.on('disconnected', ()=>{ setTimeout(()=>{ try{ if(!P.peer.destroyed) P.peer.reconnect(); }catch(e){} }, 1000); });
    P.peer.on('error', err=>{
      if(err.type==='peer-unavailable'){ P.online=false; setStatus('Raum '+P.code+' nicht gefunden. Läuft das Spiel auf dem Tablet?'); }
      else setStatus('Verbindungsproblem, versuche es weiter …');
      scheduleRetry();
    });
  } else if(P.peer.open) openConn();
}
function openConn(){
  const conn = P.peer.connect(PARTY.prefix + P.code, {reliable:true});
  P.conn = conn;
  conn.on('open', ()=>{ P.online=true; setStatus(''); send(conn, {t:'hello', pid:P.pid, name:P.name}); });
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
  if(msg.t==='missed'){ P.last=null; P.state='missed'; renderPlayer(); }
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
      <p class="muted">Du spielst mit deinem Handy. Die Rätsel stehen auf dem Tablet und hier.</p>
      <form id="pf" class="row" autocomplete="off"><input type="text" id="pn" maxlength="20" placeholder="Dein Name" aria-label="Dein Name" value="${esc(P.name)}"><button class="primary" style="width:auto" type="submit">Mitspielen</button></form>
      <div class="err" id="perr"></div>`);
    document.getElementById('pf').onsubmit = e=>{ e.preventDefault(); const n=document.getElementById('pn').value.trim(); if(!n){ document.getElementById('perr').textContent='Bitte gib deinen Namen ein.'; return; }
      P.name=n; try{ localStorage.setItem('pl-name', n); localStorage.setItem('pl-code', P.code); }catch(_){}
      P.state='connecting'; renderPlayer(); playerConnect(); };
    return;
  }
  if(P.state==='connecting'){ app.innerHTML = playerShell(`<div class="cover"><h2>Verbinde mit dem Tablet …</h2><p class="muted">Raum ${esc(P.code)}</p></div>`); setStatus(''); return; }
  if(P.state==='lobby'){ app.innerHTML = playerShell(`<div class="cover"><h2>Du bist drin!</h2><p class="muted">Warte, bis das Spiel auf dem Tablet startet.</p></div>`); return; }
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
  if(P.state==='wait'){ app.innerHTML = playerShell(`<div class="cover"><h2>Punkt gesetzt</h2><p class="muted">Warte auf die anderen. Die Auflösung kommt auf dem Tablet.</p></div>`); return; }
  if(P.state==='missed'){ app.innerHTML = playerShell(`<div class="cover"><h2>Zu spät</h2><p class="muted">Diese Runde wurde ohne dich aufgelöst. Gleich geht es weiter.</p></div>`); return; }
  if(P.state==='result'){ const r=P.last;
    app.innerHTML = playerShell(`<div class="cover"><p class="label">Frage ${r.num+1} / ${r.total}</p>
      <div class="bigname" style="color:${r.hit?'var(--ok)':'var(--bad)'}">${r.hit?'Treffer!':'Daneben'}</div>
      <p class="muted">${r.km} km vom Ziel · +${r.pts} ${ptsLabel(r.mode)}</p><h2>Gesamt: ${r.score}</h2><p class="muted">Schau aufs Tablet für die Auflösung.</p></div>`); return; }
  if(P.state==='end'){ const r=P.last;
    app.innerHTML = playerShell(`<div class="cover"><p class="label">Endstand</p><div class="bigname" style="color:${r.rank===1?'var(--accent)':'var(--fg)'}">Platz ${r.rank}</div>
      <p class="muted">von ${r.of} · ${r.score} ${ptsLabel(r.mode)}</p>${r.rank===1?'<h2>Du hast gewonnen!</h2>':`<p class="muted">Gewonnen hat ${esc(r.winner)}.</p>`}</div>`); return; }
}
