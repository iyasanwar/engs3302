/* Pen layer and whiteboard for ENGS 3302 decks (ported from the approved prototype wbtrial/wb_trial.src.html).
   Two modes, each opened from the slide and closed by Esc, which returns to the same slide and click:
     P (ح)  pen over the current slide;        W (ص)  a white sheet over the slide (the whiteboard), also drawable.
   P in sheet mode goes back to the pen over the slide; W in pen mode opens the sheet; P / W again (in its own mode) closes.
   Strokes are kept per slide (reveal index h/v) and per mode, so going to another slide and back keeps them;
   only X (clear this layer) or a reload removes them. Strokes show while their mode is open.
   Tools (only while a mode is open): 1 2 3 navy / coral / ink pen, 4 highlighter, L (م) laser with a fading trail, E (ث) stroke eraser,
   Z (ئ) or Ctrl+Z undo, X (ء) clear this layer, T (ف) hide or show the tray and the mode label (for recording); three widths in the tray.
   While a mode is open every other key is blocked (the deck stays on its click) and clicks draw instead of advancing.
   Pressure-aware strokes from coalesced pointer events, on a devicePixelRatio canvas at the 1600 x 900 stage scale; the stage is laid
   exactly over the reveal slide, so pointer positions map through the reveal scale. The tray sits bottom left, away from the camera. */
(function(){
  var wb, stage, cv, ctx, sheet, modeEl, tray, btn;
  var mode = null, layers = {}, tool = 'pen', color = '#1d5c8c', width = 7, drawing = null, laser = [], dpr = 1;
  var hook = null;                                   // present.js: every change is also sent to the recording window
  function emit(m){ if(hook) try { hook(m); } catch(x){} }
  var NAMES = {slide: 'Pen over the slide · Esc: back', sheet: 'Whiteboard · Esc: back'};
  function key(){ var i = Reveal.getIndices(); return mode + ':' + i.h + '/' + (i.v || 0); }
  function L(){ var k = key(); return layers[k] || (layers[k] = []); }
  function fit(){
    var r = document.querySelector('.reveal .slides').getBoundingClientRect(), k = r.width / 1600;
    stage.style.transform = 'translate(' + r.left + 'px,' + r.top + 'px) scale(' + k + ')';
    var d = Math.min(Math.max((window.devicePixelRatio || 1) * k, 1), 3);
    if(d !== dpr || cv.width !== Math.round(1600 * d)){ dpr = d; cv.width = Math.round(1600 * d); cv.height = Math.round(900 * d); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); redraw();
  }
  function build(){
    wb = document.getElementById('wb'); btn = document.getElementById('wbBtn');
    wb.innerHTML = '<div id="wbStage" role="application" aria-label="Pen layer"><div id="wbSheet" hidden></div><canvas id="wbCv" width="1600" height="900"></canvas>'
      + '<div id="wbMode"></div>'
      + '<div id="wbTray" role="toolbar" aria-label="Pens">'
      + '<button type="button" data-tool="pen" data-color="#1d5c8c" aria-pressed="true" aria-label="Navy pen (1)" title="Navy pen (1)"><span class="dot" style="background:#1d5c8c"></span></button>'
      + '<button type="button" data-tool="pen" data-color="#e4734f" aria-pressed="false" aria-label="Coral pen (2)" title="Coral pen (2)"><span class="dot" style="background:#e4734f"></span></button>'
      + '<button type="button" data-tool="pen" data-color="#14233b" aria-pressed="false" aria-label="Ink pen (3)" title="Ink pen (3)"><span class="dot" style="background:#14233b"></span></button>'
      + '<button type="button" data-tool="hl" data-color="#f0c94a" aria-pressed="false" aria-label="Highlighter (4)" title="Highlighter (4)"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h7" stroke="#e0b52e" stroke-width="5" stroke-linecap="round"/><path d="M13 4l6 6-8 8H5v-6z" fill="none" stroke="#14233b" stroke-width="1.8" stroke-linejoin="round"/></svg></button>'
      + '<span class="sep" aria-hidden="true"></span>'
      + '<button type="button" data-tool="laser" aria-pressed="false" aria-label="Laser pointer (L)" title="Laser pointer (L)"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="#e4734f"/><circle cx="12" cy="12" r="9" fill="none" stroke="#e4734f" stroke-width="1.5" opacity=".5"/></svg></button>'
      + '<button type="button" data-tool="eraser" aria-pressed="false" aria-label="Eraser (E)" title="Eraser (E)"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16l8-8 6 6-6 6H8z" fill="#e9edf2" stroke="#14233b" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 20h8" stroke="#14233b" stroke-width="1.8" stroke-linecap="round"/></svg></button>'
      + '<span class="sep" aria-hidden="true"></span>'
      + '<span class="wbsize" role="group" aria-label="Line width">'
      + '<button type="button" data-size="4" aria-pressed="false" aria-label="Thin line"><span class="bar" style="height:3px"></span></button>'
      + '<button type="button" data-size="7" aria-pressed="true" aria-label="Medium line"><span class="bar" style="height:6px"></span></button>'
      + '<button type="button" data-size="12" aria-pressed="false" aria-label="Thick line"><span class="bar" style="height:10px"></span></button></span>'
      + '<span class="sep" aria-hidden="true"></span>'
      + '<button type="button" data-act="undo" aria-label="Undo (Z)" title="Undo (Z)"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7H4V2M4 7a8 8 0 1 1-1 7" fill="none" stroke="#14233b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
      + '<button type="button" data-act="clear" aria-label="Clear this layer (X)" title="Clear this layer (X)"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" fill="none" stroke="#14233b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
      + '<button type="button" data-act="sheet" aria-pressed="false" aria-label="Whiteboard sheet (W)" title="Whiteboard sheet (W)"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="1.5" fill="#fff" stroke="#14233b" stroke-width="2"/><path d="M8 21l4-4 4 4" fill="none" stroke="#14233b" stroke-width="2" stroke-linecap="round"/></svg></button>'
      + '<button type="button" data-act="close" aria-label="Back to the slide (Esc)" title="Back to the slide (Esc)"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#14233b" stroke-width="2.2" stroke-linecap="round"/></svg></button>'
      + '</div></div>';
    stage = wb.querySelector('#wbStage'); cv = wb.querySelector('#wbCv'); ctx = cv.getContext('2d'); sheet = wb.querySelector('#wbSheet');
    modeEl = wb.querySelector('#wbMode'); tray = wb.querySelector('#wbTray');
  }
  function local(e){ var b = stage.getBoundingClientRect(), k = b.width / 1600; return {x: (e.clientX - b.left) / k, y: (e.clientY - b.top) / k, p: e.pressure || 0.5}; }
  function strokePath(s){
    var p = s.pts; if(!p.length) return;
    ctx.save();
    if(s.tool === 'hl'){ ctx.globalAlpha = 0.38; ctx.globalCompositeOperation = 'multiply'; }
    ctx.strokeStyle = s.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if(p.length < 3){ ctx.beginPath(); ctx.arc(p[0].x, p[0].y, s.w / 2, 0, 7); ctx.fillStyle = s.color; ctx.fill(); ctx.restore(); return; }
    if(s.tool === 'hl'){
      ctx.lineWidth = s.w; ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y);
      for(var i = 1; i < p.length - 1; i++){ var mx = (p[i].x + p[i+1].x) / 2, my = (p[i].y + p[i+1].y) / 2; ctx.quadraticCurveTo(p[i].x, p[i].y, mx, my); }
      ctx.stroke();
    } else {
      for(var j = 1; j < p.length - 1; j++){            // pressure-aware width per segment, smoothed with mid-points
        var a = j === 1 ? p[0] : {x: (p[j-1].x + p[j].x) / 2, y: (p[j-1].y + p[j].y) / 2};
        var c = {x: (p[j].x + p[j+1].x) / 2, y: (p[j].y + p[j+1].y) / 2};
        ctx.lineWidth = s.w * (0.6 + 0.8 * (p[j].p || 0.5));
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(p[j].x, p[j].y, c.x, c.y); ctx.stroke();
      }
    }
    ctx.restore();
  }
  function redraw(){
    if(!ctx) return;
    ctx.clearRect(0, 0, 1600, 900);
    if(!mode) return;
    L().forEach(strokePath);
    if(drawing) strokePath(drawing);
    var now = performance.now();
    laser = laser.filter(function(d){ return now - d.t < 600; });
    laser.forEach(function(d){ var age = (now - d.t) / 600; ctx.beginPath(); ctx.arc(d.x, d.y, 9 * (1 - age) + 3, 0, 7); ctx.fillStyle = 'rgba(228,115,79,' + (0.85 * (1 - age)) + ')'; ctx.fill(); });
    if(laser.length) requestAnimationFrame(redraw);
  }
  function eraseAt(pt){
    var S = L(), r = 18, hit = -1;
    for(var i = S.length - 1; i >= 0 && hit < 0; i--) for(var k = 0; k < S[i].pts.length; k++){ var q = S[i].pts[k]; if((q.x - pt.x) * (q.x - pt.x) + (q.y - pt.y) * (q.y - pt.y) < r * r){ hit = i; break; } }
    if(hit >= 0){ S.splice(hit, 1); emit({op: 'erase', i: hit}); redraw(); }
  }
  function press(sel, el){ tray.querySelectorAll(sel).forEach(function(b){ b.setAttribute('aria-pressed', b === el ? 'true' : 'false'); }); }
  function setTool(b){ tool = b.dataset.tool; if(b.dataset.color) color = b.dataset.color; press('[data-tool]', b); cv.style.cursor = tool === 'laser' ? 'none' : tool === 'eraser' ? 'cell' : 'crosshair'; emit({op: 'tool', i: [].indexOf.call(tray.querySelectorAll('[data-tool]'), b)}); }
  function setSize(b){ width = +b.dataset.size; press('[data-size]', b); emit({op: 'size', i: [].indexOf.call(tray.querySelectorAll('[data-size]'), b)}); }
  function undo(){ L().pop(); emit({op: 'undo'}); redraw(); }
  function clearAll(){ layers[key()] = []; emit({op: 'clear'}); redraw(); }
  function trayHide(hide){ tray.hidden = hide; modeEl.hidden = hide; emit({op: 'tray', hide: hide}); }
  // open a mode (null closes): the slide and its click stay exactly where they were
  function setMode(m){
    if(drawing) end();
    mode = m; var on = !!m; emit({op: 'mode', m: m || null});
    wb.hidden = !on; wb.dataset.mode = m || ''; sheet.hidden = m !== 'sheet';
    document.body.classList.toggle('wb-on', on);
    if(btn){ btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.classList.toggle('on', on); btn.blur(); }
    tray.querySelector('[data-act="sheet"]').setAttribute('aria-pressed', m === 'sheet' ? 'true' : 'false');
    modeEl.textContent = NAMES[m] || '';
    laser = [];
    if(on){ fit(); if(document.activeElement && document.activeElement.tagName === 'IFRAME') document.activeElement.blur(); } else redraw();
  }
  function end(){ if(drawing){ L().push(drawing); drawing = null; emit({op: 'end'}); redraw(); } }
  function init(){
    build();
    cv.addEventListener('pointerdown', function(e){
      e.preventDefault(); e.stopPropagation(); try { cv.setPointerCapture(e.pointerId); } catch(x){} var pt = local(e);
      if(tool === 'laser'){ laser.push({x: pt.x, y: pt.y, t: performance.now()}); emit({op: 'laser', x: pt.x, y: pt.y}); redraw(); return; }
      if(tool === 'eraser'){ eraseAt(pt); return; }
      drawing = {tool: tool, color: color, w: tool === 'hl' ? width * 3.2 : width, pts: [pt]};
      emit({op: 'start', s: {tool: drawing.tool, color: drawing.color, w: drawing.w, pts: [pt]}});
    });
    cv.addEventListener('pointermove', function(e){
      var pt = local(e);
      if(tool === 'laser'){ if(e.buttons || e.pointerType === 'mouse'){ laser.push({x: pt.x, y: pt.y, t: performance.now()}); emit({op: 'laser', x: pt.x, y: pt.y}); if(laser.length < 3) redraw(); } return; }
      if(tool === 'eraser' && e.buttons){ eraseAt(pt); return; }
      if(!drawing) return;
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; if(!evs.length) evs = [e];
      var add = evs.map(local); add.forEach(function(q){ drawing.pts.push(q); }); emit({op: 'pts', pts: add});
      redraw();
    });
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    wb.addEventListener('click', function(e){ e.stopPropagation(); });
    tray.querySelectorAll('[data-tool]').forEach(function(b){ b.addEventListener('click', function(){ setTool(b); b.blur(); }); });
    tray.querySelectorAll('[data-size]').forEach(function(b){ b.addEventListener('click', function(){ setSize(b); b.blur(); }); });
    tray.querySelector('[data-act="undo"]').addEventListener('click', function(e){ undo(); e.currentTarget.blur(); });
    tray.querySelector('[data-act="clear"]').addEventListener('click', function(e){ clearAll(); e.currentTarget.blur(); });
    tray.querySelector('[data-act="sheet"]').addEventListener('click', function(e){ setMode(mode === 'sheet' ? 'slide' : 'sheet'); });
    tray.querySelector('[data-act="close"]').addEventListener('click', function(){ setMode(null); });
    if(btn) btn.addEventListener('click', function(e){ e.stopPropagation(); setMode(mode ? null : 'sheet'); });
    addEventListener('resize', function(){ if(mode) fit(); });
    Reveal.on('slidechanged', function(){ if(drawing) end(); laser = []; redraw(); });   // each slide keeps its own ink
    var byKey = {'1': 0, '2': 1, '3': 2, '4': 3}, toolBtns = tray.querySelectorAll('[data-tool]');
    document.addEventListener('keydown', function(e){
      var t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      var k = e.key, c = e.code, mod = e.ctrlKey || e.metaKey || e.altKey;
      var isP = !mod && (c === 'KeyP' || k === 'p' || k === 'P' || k === 'ح'), isW = !mod && (c === 'KeyW' || k === 'w' || k === 'W' || k === 'ص');
      if(!mode){                                                     // no mode open: only P and W do something here
        if(isP || isW){ e.preventDefault(); e.stopImmediatePropagation(); setMode(isP ? 'slide' : 'sheet'); }
        return;
      }
      if(!mod && /^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|PageUp|PageDown)$/.test(k)){ if(drawing) end(); return; }   // the arrows still move the deck while a pen is on
      e.preventDefault(); e.stopImmediatePropagation();               // a mode is open: no other key reaches the deck
      if((e.ctrlKey || e.metaKey) && (c === 'KeyZ' || k === 'z' || k === 'Z')){ undo(); return; }
      if(mod) return;
      if(k === 'Escape') setMode(null);
      else if(isP){ if(mode === 'slide') setMode(null); else { setMode('slide'); if(tool === 'laser' || tool === 'eraser') setTool(toolBtns[0]); } }
      else if(isW){ setMode(mode === 'sheet' ? null : 'sheet'); }
      else if(k in byKey) setTool(toolBtns[byKey[k]]);
      else if(c === 'KeyL' || k === 'م') setTool(tray.querySelector('[data-tool="laser"]'));
      else if(c === 'KeyE' || k === 'ث') setTool(tray.querySelector('[data-tool="eraser"]'));
      else if(c === 'KeyZ' || k === 'ئ') undo();
      else if(c === 'KeyX' || k === 'ء') clearAll();
      else if(c === 'KeyT' || k === 'ف') trayHide(!tray.hidden);
    }, true);
    // the mirror API (present.js): hook(f) receives every change; remote(op) replays one in the recording window; snap/load copy the whole state
    function remote(o){
      if(o.op === 'mode') setMode(o.m);
      else if(o.op === 'start') drawing = {tool: o.s.tool, color: o.s.color, w: o.s.w, pts: o.s.pts.slice()};
      else if(o.op === 'pts'){ if(drawing){ o.pts.forEach(function(q){ drawing.pts.push(q); }); redraw(); } }
      else if(o.op === 'end') end();
      else if(o.op === 'erase'){ L().splice(o.i, 1); redraw(); }
      else if(o.op === 'undo') undo();
      else if(o.op === 'clear') clearAll();
      else if(o.op === 'tray') trayHide(!!o.hide);
      else if(o.op === 'tool'){ var tb = tray.querySelectorAll('[data-tool]')[o.i]; if(tb) setTool(tb); }
      else if(o.op === 'size'){ var sb = tray.querySelectorAll('[data-size]')[o.i]; if(sb) setSize(sb); }
      else if(o.op === 'laser'){ if(!mode) return; laser.push({x: o.x, y: o.y, t: performance.now()}); if(laser.length < 3) redraw(); }
    }
    function idx(sel){ return [].findIndex.call(tray.querySelectorAll(sel), function(x){ return x.getAttribute('aria-pressed') === 'true'; }); }
    function snap(){ return {mode: mode, tray: tray.hidden, tool: idx('[data-tool]'), size: idx('[data-size]'), layers: JSON.parse(JSON.stringify(layers))}; }
    function load(x){ drawing = null; layers = x.layers || {}; if(mode !== (x.mode || null)) setMode(x.mode || null); trayHide(!!x.tray); if(x.tool >= 0) remote({op: 'tool', i: x.tool}); if(x.size >= 0) remote({op: 'size', i: x.size}); redraw(); }
    window.EngsPen = {mode: function(){ return mode; }, open: setMode, close: function(){ setMode(null); }, strokes: function(){ return mode ? L().length : 0; }, all: function(){ return layers; },
      hook: function(f){ hook = f; }, remote: remote, snap: snap, load: load, tray: function(){ return tray.hidden; }};
  }
  (function wait(){ if(window.Reveal && Reveal.isReady && Reveal.isReady()) init(); else setTimeout(wait, 50); })();
})();
