/* Presenter mode for ENGS 3302 decks (instructor recording aid). Does nothing unless the address has ?present or ?mirror.
   Two windows of the same deck, because a transparent always-on-top window is not possible under GNOME Wayland:
     Video_5.k.html?present      the PRESENTER window: the instructor looks at it and drives it. The slide, and over it a draggable,
                                 semi-transparent panel with the Arabic recording script for the current slide and click (or the
                                 current step of an open D / C window), the next paragraph dimmed below.
     Video_5.k.html?rec&mirror   the OUTPUT window, opened by the presenter as a popup (name "engs_out"): only the clean slide in
                                 recording mode. OBS captures this window. It takes no keys and no clicks; it follows the presenter.
   Mirrored (postMessage, '*' because file:// pages have opaque origins; e.source is checked): the reveal position (slide and
   fragment, so the animations run in step, also backwards and on jumps), the D and C windows (open, close, step), the pen layer and
   the whiteboard (mode, every stroke live, eraser, undo, clear, laser, tray), the sliders of a live page (bounds.html), and the video:
   ] [ H in the presenter move both windows. The output says hello to its opener every 400 ms; the presenter answers with the whole
   state, so the link survives a reload or a new video in either window.
   The script is NOT in this folder: it is loaded at run time from ../../W05_Instructor_only/W05_script_data.js (window.ENGS_SCRIPT).
   Without that file ?present shows a short notice and the deck behaves normally.
   Panel keys: Q (ض on an Arabic keyboard) hides or shows it (also while a pen is on). Grip: drag. Slider: opacity. A− A+: text size.
   The dot is green while the output window is linked. Position, size, opacity and text size are remembered on this computer. */
(function(){
  var SEARCH = location.search, PRESENT = /[?&]present\b/.test(SEARCH), MIRROR = /[?&]mirror\b/.test(SEARCH);
  if(!PRESENT && !MIRROR) return;
  var PAGE = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
  var VID = (PAGE.match(/^Video_([\d.]+)\.html$/) || [])[1] || '';
  var DECK = !!document.querySelector('.reveal');
  var DATA_URL = '../../W05_Instructor_only/W05_script_data.js';
  function store(k, v){ try { if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }
  function sstore(k, v){ try { if(v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch(e){ return null; } }
  function whenReady(cb){ (function w(){ if(!DECK || (window.Reveal && Reveal.isReady && Reveal.isReady() && window.EngsSteps && window.EngsPen && window.EngsDeriv && window.EngsCalc)) cb(); else setTimeout(w, 40); })(); }
  function pos(){ var i = Reveal.getIndices(); return {h: i.h, v: i.v || 0, f: typeof i.f === 'number' ? i.f : -1}; }
  function win(){
    var d = EngsDeriv.state(), c = EngsCalc.state();
    if(d.id) return {kind: 'dv', id: d.id, step: d.step, max: d.max};
    if(c.id) return {kind: 'cw', id: c.id, step: c.step, max: c.max};
    return null;
  }
  function isVideoLink(h){ return /^(Video_[\d.]+|index)\.html$/.test(h || ''); }

  /* ======================= OUTPUT (recording) window ======================= */
  if(MIRROR){
    document.documentElement.classList.add('rec', 'mirror');
    var P = window.opener, ready = false, need = true, live = {};
    function hello(){ if(P && !P.closed) try { P.postMessage({engs: 'out', t: 'hello', page: PAGE, need: ready && need}, '*'); } catch(e){} }
    hello(); setInterval(hello, 400);
    // nothing but the presenter moves this window: keys and pointer input are swallowed here (F, full screen, is kept)
    ['keydown', 'keyup', 'keypress'].forEach(function(t){ addEventListener(t, function(e){
      if(t === 'keydown' && (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) return;
      e.preventDefault(); e.stopImmediatePropagation(); }, true); });
    ['click', 'dblclick', 'pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'contextmenu', 'wheel'].forEach(function(t){
      addEventListener(t, function(e){ if(t !== 'pointermove' && t !== 'wheel') e.preventDefault(); e.stopImmediatePropagation(); }, {capture: true, passive: false}); });
    // the presenter's mouse pointer, drawn here at the same place on the 1600x900 stage (the real pointer stays hidden in this window)
    var cur = null;
    function ptr(m){
      if(!cur){ cur = document.createElement('div'); cur.id = 'engsPtr'; cur.setAttribute('aria-hidden', 'true');
        // course pointer: a navy arrowhead with a white edge, a soft sand halo at the tip; a coral ring marks each click
        cur.innerHTML = '<span class="halo"></span><svg width="34" height="34" viewBox="0 0 30 30"><path d="M3 2.5 Q2.6 2 3.2 2.3 L25.5 12.6 Q26.4 13.1 25.4 13.5 L16.4 16.4 L13.5 25.4 Q13.1 26.4 12.6 25.5 Z" fill="#1d5c8c" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/><circle cx="15.2" cy="15.2" r="2.1" fill="#f3e3b5"/></svg>';
        var st = document.createElement('style');
        st.textContent = '#engsPtr{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;will-change:transform;display:none;filter:drop-shadow(0 1px 2px rgba(20,35,59,.28))}'
          + '#engsPtr svg{position:absolute;left:0;top:0}'
          + '#engsPtr .halo{position:absolute;left:-15px;top:-15px;width:36px;height:36px;border-radius:50%;background:radial-gradient(circle,rgba(29,92,140,.22) 0,rgba(29,92,140,.10) 45%,rgba(29,92,140,0) 70%)}'
          + '.engsRipple{position:fixed;left:0;top:0;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;border:3px solid #e4734f;pointer-events:none;z-index:2147483646;animation:engsRip .5s cubic-bezier(.2,.8,.2,1) forwards}'
          + '@keyframes engsRip{from{transform:var(--p) scale(1);opacity:.95}to{transform:var(--p) scale(5);opacity:0}}'
          + '@media (prefers-reduced-motion:reduce){.engsRipple{animation-duration:.01s}}';
        document.head.appendChild(st); document.body.appendChild(cur); }
      if(!m.on){ cur.style.display = 'none'; return; }
      var W = innerWidth, H = innerHeight, k = Math.min(W / 1600, H / 900), ox = (W - 1600 * k) / 2, oy = (H - 900 * k) / 2;
      var X = ox + m.x * k, Y = oy + m.y * k;
      cur.style.display = 'block'; cur.style.transform = 'translate(' + (X - 3) + 'px,' + (Y - 2) + 'px)';
      if(m.click){ var r = document.createElement('div'); r.className = 'engsRipple'; r.style.setProperty('--p', 'translate(' + X + 'px,' + Y + 'px)'); r.style.transform = 'translate(' + X + 'px,' + Y + 'px)';
        document.body.appendChild(r); setTimeout(function(){ r.remove(); }, 600); }
    }
    function frames(){ return [].slice.call(document.querySelectorAll('.reveal iframe')); }
    function liveSend(fr){ var w = fr && fr.contentWindow; if(!w) return; Object.keys(live).forEach(function(id){ try { w.postMessage({engsLiveSet: {id: id, value: live[id]}}, '*'); } catch(e){} }); }
    function goPos(p){ var c = pos(); if(c.h !== p.h || c.v !== p.v || c.f !== p.f) Reveal.slide(p.h, p.v, p.f); }
    function goWin(w){
      var ds = EngsDeriv.state(), cs = EngsCalc.state();
      if((!w || w.kind !== 'dv') && ds.id) EngsDeriv.close();
      if((!w || w.kind !== 'cw') && cs.id) EngsCalc.close();
      if(!w) return;
      var X = w.kind === 'dv' ? EngsDeriv : EngsCalc, s = X.state();
      if(s.id !== w.id){ X.open(w.id); s = X.state(); }
      if(w.step !== s.step){ if(w.step === s.step + 1) X.go(w.step); else X.set(w.step); }
    }
    addEventListener('message', function(e){
      var m = e.data;
      if(e.source !== P){                                         // a live page in this window: its keys and reveal calls are not obeyed
        if(m && typeof m === 'object' && m.engsLive && m.engsLive.ready) frames().forEach(function(fr){ if(fr.contentWindow === e.source) liveSend(fr); });
        e.stopImmediatePropagation(); return;
      }
      if(!m || m.engs !== 'mirror') return;
      e.stopImmediatePropagation();
      if(m.t === 'nav'){ location.href = m.href + '?rec&mirror'; return; }
      if(m.t === 'snap' && m.page !== PAGE){ location.href = m.page + '?rec&mirror'; return; }
      if(!DECK){ if(m.t === 'snap') need = false; return; }
      if(!ready) return;                                          // the hello after ready asks for the whole state again
      if(m.t === 'snap'){ live = m.live || {}; goPos(m.pos); EngsPen.load(m.pen); goWin(m.win); frames().forEach(liveSend); need = false; }
      else if(m.t === 'pos') goPos(m.pos);
      else if(m.t === 'win') goWin(m.win);
      else if(m.t === 'pen') EngsPen.remote(m.op);
      else if(m.t === 'ptr') ptr(m);
      else if(m.t === 'live'){ live[m.id] = m.value; frames().forEach(function(fr){ var w = fr.contentWindow; if(w) try { w.postMessage({engsLiveSet: {id: m.id, value: m.value}}, '*'); } catch(x){} }); }
    }, true);
    whenReady(function(){ ready = true; hello(); });
    window.EngsMirror = {linked: function(){ return !!(P && !P.closed); }, need: function(){ return need; }};
    return;
  }

  /* ======================= PRESENTER window ======================= */
  var out = null, lastHello = 0, lastKey = {}, liveVals = {}, panel, nowEl, nextEl, whereEl, dot, openBtn, S = null;
  var cfg = {x: 16, y: null, w: 640, h: 300, a: 0.55, fs: 26, hidden: false};
  try { var sv = JSON.parse(store('engs-present') || 'null'); if(sv) for(var k in sv) cfg[k] = sv[k]; } catch(e){}
  function save(){ store('engs-present', JSON.stringify(cfg)); }
  function linked(){ return out && !out.closed && Date.now() - lastHello < 1500; }
  function send(m){ m.engs = 'mirror'; if(out && !out.closed) try { out.postMessage(m, '*'); } catch(e){} }
  function outUrl(page){ return (page || PAGE) + '?rec&mirror'; }
  function openOut(){
    var w = null; try { w = window.open(outUrl(), 'engs_out', 'popup,width=1600,height=900'); } catch(e){}
    if(w){ out = w; sstore('engs-out', '1'); } return !!w;
  }
  function notice(t, ms){
    var n = document.createElement('div'); n.className = 'engs-present-note'; n.textContent = t; document.body.appendChild(n);
    setTimeout(function(){ n.style.opacity = 0; setTimeout(function(){ n.remove(); }, 500); }, ms || 6000);
  }
  var CSS = '#engsPanel{position:fixed;z-index:5000;color:#f4f6f9;border-radius:14px;box-shadow:0 6px 28px rgba(0,0,0,.35);overflow:auto;resize:both;min-width:280px;min-height:120px;'
    + 'font-family:"Noto Naskh Arabic","Noto Sans Arabic",Cairo,"DejaVu Sans",system-ui,sans-serif;direction:rtl;text-shadow:0 1px 3px rgba(0,0,0,.85);display:flex;flex-direction:column}'
    + '#engsPanel[hidden]{display:none}'
    + '#engsPanel .ph{flex:none;display:flex;align-items:center;gap:8px;padding:6px 10px;direction:ltr;font:600 13px "Fira Sans",system-ui,sans-serif;color:#c7d2e0;text-shadow:none;position:sticky;top:0;background:rgba(13,24,40,.55);border-radius:14px 14px 0 0}'
    + '#engsPanel .grip{cursor:move;user-select:none;font-size:18px;line-height:1;padding:0 4px;color:#f4f6f9;touch-action:none}'
    + '#engsPanel .dot{width:11px;height:11px;border-radius:50%;background:#c0472a;flex:none}#engsPanel .dot.on{background:#33a36b}'
    + '#engsPanel .wh{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}'
    + '#engsPanel button{font:600 13px "Fira Sans",system-ui,sans-serif;color:#f4f6f9;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:2px 9px;cursor:pointer}'
    + '#engsPanel button:hover{background:rgba(255,255,255,.22)}#engsPanel input[type=range]{width:80px}'
    + '#engsPanel .pb{padding:4px 16px 14px;line-height:1.6}#engsPanel .now p{margin:0 0 .45em}'
    + '#engsPanel .nx{margin-top:10px;padding-top:8px;border-top:1px dashed rgba(255,255,255,.35);opacity:.5;font-size:.72em;line-height:1.5}'
    + '#engsPanel .nx p{margin:0 0 .35em}'
    + '#engsPanel .cue{font-size:.62em;font-weight:700;color:#9cc3e6;border:1px solid #9cc3e6;border-radius:6px;padding:0 6px;margin-inline-end:6px;white-space:nowrap}'
    + '#engsPanel .win{font-size:.6em;font-weight:700;color:#f3e3b5;margin-bottom:4px}'
    + '#engsPanel .openout{display:none;margin:6px 16px 0;direction:rtl}#engsPanel.unlinked .openout{display:block}'
    + '.engs-present-note{position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:5001;background:#14233b;color:#fff;border-radius:999px;padding:10px 20px;font:600 17px/1.3 "Fira Sans",system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.3);transition:opacity .4s;max-width:90vw}';
  function build(){
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    panel = document.createElement('div'); panel.id = 'engsPanel'; panel.setAttribute('role', 'complementary'); panel.setAttribute('aria-label', 'Recording script');
    panel.innerHTML = '<div class="ph"><span class="grip" title="Drag">⠿</span><span class="dot" title="Recording window linked"></span><span class="wh"></span>'
      + '<input type="range" min="20" max="90" step="5" title="Opacity" aria-label="Opacity"><button type="button" data-a="-" title="Smaller text">A−</button><button type="button" data-a="+" title="Larger text">A+</button>'
      + '<button type="button" data-a="hide" title="Hide (Q or ض)">Q</button></div>'
      + '<button type="button" class="openout">افتح نافذة التسجيل (أو اضغط أي مفتاح)</button><div class="pb"><div class="now"></div><div class="nx"></div></div>';
    document.body.appendChild(panel);
    nowEl = panel.querySelector('.now'); nextEl = panel.querySelector('.nx'); whereEl = panel.querySelector('.wh'); dot = panel.querySelector('.dot'); openBtn = panel.querySelector('.openout');
    var rg = panel.querySelector('input'); rg.value = Math.round(cfg.a * 100);
    rg.addEventListener('input', function(){ cfg.a = +rg.value / 100; look(); save(); });
    rg.addEventListener('change', function(){ rg.blur(); });
    panel.querySelector('[data-a="-"]').addEventListener('click', function(e){ cfg.fs = Math.max(16, cfg.fs - 2); look(); save(); e.currentTarget.blur(); });
    panel.querySelector('[data-a="+"]').addEventListener('click', function(e){ cfg.fs = Math.min(60, cfg.fs + 2); look(); save(); e.currentTarget.blur(); });
    panel.querySelector('[data-a="hide"]').addEventListener('click', function(e){ toggle(); e.currentTarget.blur(); });
    openBtn.addEventListener('click', function(e){ openOut(); e.currentTarget.blur(); });
    ['click', 'pointerdown', 'mousedown', 'touchstart', 'wheel'].forEach(function(t){ panel.addEventListener(t, function(e){ e.stopPropagation(); }, {passive: true}); });
    var g = panel.querySelector('.grip'), drag = null;
    g.addEventListener('pointerdown', function(e){ e.preventDefault(); var r = panel.getBoundingClientRect(); drag = {dx: e.clientX - r.left, dy: e.clientY - r.top}; try { g.setPointerCapture(e.pointerId); } catch(x){} });
    g.addEventListener('pointermove', function(e){ if(!drag) return; cfg.x = Math.max(0, Math.min(innerWidth - 60, e.clientX - drag.dx)); cfg.y = Math.max(0, Math.min(innerHeight - 30, e.clientY - drag.dy)); look(); });
    g.addEventListener('pointerup', function(){ if(drag){ drag = null; save(); } });
    if(window.ResizeObserver) new ResizeObserver(function(){ if(panel.hidden) return; var w = panel.offsetWidth, h = panel.offsetHeight; if(w && h && (Math.abs(w - cfg.w) > 2 || Math.abs(h - cfg.h) > 2)){ cfg.w = w; cfg.h = h; save(); } }).observe(panel);
    look();
  }
  function look(){
    if(cfg.y === null || cfg.y === undefined) cfg.y = Math.max(0, innerHeight - cfg.h - 104);   // above the pen tray
    panel.style.left = Math.min(cfg.x, Math.max(0, innerWidth - 60)) + 'px'; panel.style.top = Math.min(cfg.y, Math.max(0, innerHeight - 30)) + 'px';
    panel.style.width = cfg.w + 'px'; panel.style.height = cfg.h + 'px';
    panel.style.background = 'rgba(13,24,40,' + cfg.a + ')'; panel.querySelector('.pb').style.fontSize = cfg.fs + 'px';
    panel.hidden = !!cfg.hidden;
  }
  function toggle(){ cfg.hidden = !cfg.hidden; look(); save(); }
  // the script paragraph for this point: slide h (from 0), clicks = fragment index + 1, or the step of an open window
  function render(){
    if(!panel) return;
    var V = S[VID];
    if(!DECK){ whereEl.textContent = 'Week page · presenter'; nowEl.innerHTML = '<p>اختر فيديو: يفتح هنا وفي نافذة التسجيل معًا.</p>'; nextEl.innerHTML = ''; return; }
    if(!V){ whereEl.textContent = VID + ' · no script'; nowEl.innerHTML = '<p>لا يوجد نص لهذا الفيديو.</p>'; nextEl.innerHTML = ''; return; }
    var p = pos(), clicks = p.f + 1, w = win(), Sl = V.slides[p.h];
    if(!Sl){ whereEl.textContent = VID + ' · credits'; nowEl.innerHTML = '<p>شريحة المصادر: لا تُقرأ.</p>'; nextEl.innerHTML = ''; return; }
    whereEl.textContent = VID + ' · slide ' + (p.h + 1) + '/' + V.slides.length + ' · click ' + clicks + '/' + (Sl.segs.length - 1) + (w ? ' · ' + (w.kind === 'dv' ? 'D' : 'C') + ' ' + w.step + '/' + w.max : '');
    var W = w && Sl.wins[clicks];
    if(w && (!W || W.kind !== w.kind)){ W = null; for(var c in Sl.wins){ if(Sl.wins[c].kind === w.kind){ W = Sl.wins[c]; break; } } }
    if(w && W){
      var st = Math.min(w.step || 1, W.steps.length);
      nowEl.innerHTML = '<div class="win">' + (W.kind === 'dv' ? 'نافذة الاشتقاق' : 'نافذة الحساب') + ' · الخطوة ' + st + ' من ' + W.steps.length + '</div><p>' + W.steps[st - 1] + '</p>';
      nextEl.innerHTML = st < W.steps.length ? '<p>' + W.steps[st] + '</p>' : (W.end ? '<p>' + W.end + '</p>' : '');
      return;
    }
    nowEl.innerHTML = Sl.segs[clicks] || '<p>—</p>';
    var n = Sl.segs[clicks + 1], nx = V.slides[p.h + 1];
    nextEl.innerHTML = n ? n : (nx ? '<p><b>الشريحة التالية:</b> ' + nx.t + '</p>' : '<p>نهاية الفيديو.</p>');
    if(Sl.wins[clicks]) nextEl.innerHTML = '<p><span class="cue">' + (Sl.wins[clicks].kind === 'dv' ? 'D' : 'C') + '</span> نافذة متاحة هنا</p>' + nextEl.innerHTML;
  }
  function snap(){ return DECK ? {t: 'snap', page: PAGE, pos: pos(), win: win(), pen: EngsPen.snap(), live: liveVals} : {t: 'snap', page: PAGE}; }
  // position and windows: sent on every change (reveal events, and a 60 ms check for the D / C windows and their steps)
  function sync(force){
    if(!DECK) return;
    var p = pos(), w = win(), kp = JSON.stringify(p), kw = JSON.stringify(w && {k: w.kind, i: w.id, s: w.step});
    if(force || kp !== lastKey.p){ lastKey.p = kp; send({t: 'pos', pos: p}); }
    if(force || kw !== lastKey.w){ lastKey.w = kw; send({t: 'win', win: w}); }
    render();
  }
  function go(href){ send({t: 'nav', href: href}); location.href = href + '?present'; }
  function start(){
    build();
    addEventListener('message', function(e){
      var m = e.data;
      if(m && typeof m === 'object' && m.engs === 'out' && m.t === 'hello'){
        if(e.source !== out){ out = e.source; }
        var first = !linked(); lastHello = Date.now(); sstore('engs-out', '1');
        if(m.page !== PAGE) send({t: 'nav', href: PAGE});
        else if(m.need || first) send(snap());
        return;
      }
      if(m && typeof m === 'object' && m.engsLive && m.engsLive.id){       // a slider moved in the live page here
        var ok = [].some.call(document.querySelectorAll('.reveal iframe'), function(f){ return f.contentWindow === e.source; });
        if(ok){ liveVals[m.engsLive.id] = m.engsLive.value; send({t: 'live', id: m.engsLive.id, value: m.engsLive.value}); }
      }
    });
    setInterval(function(){ var on = linked(); dot.classList.toggle('on', on); panel.classList.toggle('unlinked', !on); dot.title = on ? 'Recording window linked' : 'Recording window not linked'; }, 300);
    // the recording window: a reload or a new video finds the one that is already open (it says hello); otherwise open it
    var wait = sstore('engs-out') ? 2500 : 700;
    setTimeout(function(){ if(!linked()) openOut(); }, wait);
    ['keydown', 'pointerdown'].forEach(function(t){ addEventListener(t, function(){ if(!linked() && (!out || out.closed) && Date.now() > t0 + wait) openOut(); }, true); });
    // Q (ض): the panel; ] [ H: both windows go to the other video (the same rules as the deck's own keys)
    addEventListener('keydown', function(e){
      var t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if(e.ctrlKey || e.metaKey || e.altKey) return;
      if(e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q' || e.key === 'ض'){ e.preventDefault(); e.stopImmediatePropagation(); toggle(); return; }
      if(!DECK) return;
      var lay = ['wb', 'dv', 'cw', 'keyhelp'].some(function(id){ var x = document.getElementById(id); return x && !x.hidden; }); if(lay) return;
      var k = e.code === 'BracketRight' || e.key === ']' ? ']' : e.code === 'BracketLeft' || e.key === '[' ? '[' : (e.code === 'KeyH' || e.key === 'h' || e.key === 'H' || e.key === 'ا') ? 'h' : null;
      if(!k) return;
      var a = document.querySelector('#vnav [data-key="' + k + '"]'); if(!a) return;
      e.preventDefault(); e.stopImmediatePropagation(); go(a.getAttribute('href'));
    }, true);
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a[href]'); if(!a || !isVideoLink(a.getAttribute('href'))) return;
      e.preventDefault(); e.stopImmediatePropagation(); go(a.getAttribute('href'));
    }, true);
    if(!DECK){ render(); return; }
    document.documentElement.classList.add('rec', 'presenter');         // the slide as it is recorded, but the buttons stay for you
    EngsPen.hook(function(op){ sync(); send({t: 'pen', op: op}); });
    ['slidechanged', 'fragmentshown', 'fragmenthidden'].forEach(function(ev){ Reveal.on(ev, function(){ sync(); }); });
    setInterval(sync, 60); sync(true);
    window.EngsPresent = {linked: linked, out: function(){ return out; }, render: render};
    // send the mouse pointer to the recording window (stage coordinates, so both windows agree whatever their size)
    var pq = null, pt = 0;
    function pstage(e){ var W = innerWidth, H = innerHeight, k = Math.min(W / 1600, H / 900); return {x: (e.clientX - (W - 1600 * k) / 2) / k, y: (e.clientY - (H - 900 * k) / 2) / k}; }
    function pflush(){ pt = 0; if(pq){ send(pq); pq = null; } }
    addEventListener('pointermove', function(e){ var q = pstage(e), panel = document.getElementById('engsPanel');
      var over = panel && panel.contains(e.target);                     // pointing at the script panel: not on the slide, hide it there
      pq = {t: 'ptr', x: q.x, y: q.y, on: !over && q.x >= 0 && q.y >= 0 && q.x <= 1600 && q.y <= 900}; if(!pt) pt = setTimeout(pflush, 16); }, true);
    addEventListener('pointerdown', function(e){ var q = pstage(e), panel = document.getElementById('engsPanel'); if(panel && panel.contains(e.target)) return;
      if(pt){ clearTimeout(pt); pt = 0; } pq = null; send({t: 'ptr', x: q.x, y: q.y, on: true, click: !document.body.classList.contains('wb-on')}); }, true);   // no ring while drawing
    document.addEventListener('mouseout', function(e){ if(!e.relatedTarget){ pq = {t: 'ptr', on: false}; pflush(); } });
    addEventListener('blur', function(){ pq = {t: 'ptr', on: false}; pflush(); });
  }
  var t0 = Date.now();
  if(!PRESENT) return;
  var sc = document.createElement('script'); sc.src = DATA_URL;
  sc.onload = function(){ if(!window.ENGS_SCRIPT){ sc.onerror(); return; } S = window.ENGS_SCRIPT; whenReady(start); };
  sc.onerror = function(){ whenReady(function(){ notice('Presenter mode needs the instructor folder (W05_Instructor_only) next to this one. Showing the normal deck.'); }); };
  document.head.appendChild(sc);
})();
