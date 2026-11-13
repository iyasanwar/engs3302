/* Derivation window for ENGS 3302 decks ("how we get this", for understanding). Layout: design review move D.
   A slide holds a button  <button class="dvbtn" data-dv="ID">  and a  <template id="dv-ID" data-title="..." data-idea="..." data-so="...">
   with the lines. Inside the template every element with data-s="k" appears at step k. A token <i data-t="name"> with data-from="other"
   flies from the token "other" (in an earlier line) to its place and leaves a dashed trail. data-x="k" strikes a token at step k.
   The lines flow in two columns of 680 px: column 1 (x 64-744) down to the So band, column 2 (x 792-1472) only down to y 540,
   because below that it would reach the camera keep-out. If the lines do not fit, the equations get smaller (32 px down to 24 px).
   "The idea" shows at step 1 and fades to 40 % after it; "So", a new sentence, comes at the last step.
   Click or → / Space / PageDown: next step, and at the last step back to the slide;
   ← / PageUp: back (at step 1: back to the slide); Esc or D (ي): back to the slide, which stays at the same slide and step.
   While the window is open no key reaches the deck. D opens the window only while its button is visible.
   A click during a term flight is never dropped: the flight jumps to its end and the next step starts at once.
   Open: the backdrop fades in (180 ms), the panel scales from .985 (220 ms); close: the reverse in 160 ms. Step 1 shows at once.
   ?cam draws the camera guide above the window. */
(function(){
  var dv, stage, panel, cols, c1, c2, svg, cnt, ttl, idea, so, cur = null, step = 0, max = 0, flight = null, closeT = null;
  var NS = 'http://www.w3.org/2000/svg', H1 = 594, H2 = 370, W = 666;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function scale(){ var k = Math.min(innerWidth / 1600, innerHeight / 900); stage.style.transform = 'translate(-50%,-50%) scale(' + k + ')'; return k; }
  function K(){ return stage.getBoundingClientRect().width / 1600; }
  function local(r){ var b = svg.getBoundingClientRect(), k = K(); return {x: (r.left - b.left) / k, y: (r.top - b.top) / k, w: r.width / k, h: r.height / k}; }
  function build(){
    dv = document.createElement('div'); dv.id = 'dv'; dv.hidden = true;
    dv.innerHTML = '<div id="dvStage"><div class="dvpanel"><div class="dvhead"><span class="dvtag">for understanding</span><span class="dvtitle"></span></div>'
      + '<div class="dvcount"></div><button class="dvclose" type="button" aria-label="Back to the slide">×</button>'
      + '<p class="dvidea" hidden></p><div class="dvcols"><div class="dvcol c1"></div><div class="dvcol c2"></div></div><p class="dvso" hidden></p>'
      + '<svg class="dvtrail" width="1552" height="852" viewBox="0 0 1552 852" aria-hidden="true"><defs><marker id="dvar" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,1 L9,5 L0,9 Z" fill="currentColor"></path></marker></defs></svg>'
      + '<div class="dvfoot"><span><span class="dvk1"></span>a term moves</span><span><span class="dvk2">a</span> cancels</span><span><span class="dvk3">rule</span>the rule used</span><span>click or → next · ← back · Esc: back to the slide</span></div></div>'
      + (/[?&]cam/.test(location.search) ? '<div class="camguide dvcam"></div>' : '') + '</div>';
    document.body.appendChild(dv);
    stage = dv.querySelector('#dvStage'); panel = dv.querySelector('.dvpanel'); cols = dv.querySelector('.dvcols'); c1 = cols.querySelector('.c1'); c2 = cols.querySelector('.c2');
    svg = dv.querySelector('.dvtrail'); cnt = dv.querySelector('.dvcount'); ttl = dv.querySelector('.dvtitle'); idea = dv.querySelector('.dvidea'); so = dv.querySelector('.dvso');
    dv.querySelector('.dvclose').addEventListener('click', function(e){ e.stopPropagation(); close(); });
    stage.addEventListener('click', function(e){ e.stopPropagation(); if(isOpen()) go(step + 1); });
    dv.addEventListener('click', function(e){ e.stopPropagation(); });
    addEventListener('resize', function(){ if(!dv.hidden){ scale(); trails(step, false); } });
  }
  function isOpen(){ return !dv.hidden && !dv.classList.contains('closing'); }
  // the lines flow into column 1, then column 2 (a .dvbreak forces the split); the split puts as much as fits (H2) into column 2,
  // so the two columns are balanced; smaller equations until everything fits
  function layout(items){
    var brk = items.findIndex(function(el){ return el.classList.contains('dvbreak'); });
    var lines = items.filter(function(el){ return !el.classList.contains('dvbreak'); });
    for(var f = 32; f >= 24; f -= 2){
      cols.style.setProperty('--dvf', f + 'px'); c1.innerHTML = ''; c2.innerHTML = '';
      lines.forEach(function(el){ c1.appendChild(el); });
      var h = lines.map(function(el){ return el.offsetHeight; }), n = lines.length, G = 22, cut = n;
      var sum = function(a, b){ var t = 0; for(var j = a; j < b; j++) t += h[j]; return t + G * Math.max(0, b - a - 1); };
      if(brk >= 0) cut = brk; else for(var i = 1; i <= n; i++){ if(sum(0, i) <= H1 && sum(i, n) <= H2){ cut = i; break; } }
      lines.slice(cut).forEach(function(el){ c2.appendChild(el); });
      var wide = [].some.call(cols.querySelectorAll('.ex'), function(x){ return x.offsetWidth > W; });
      if(!wide && c1.offsetHeight <= H1 && c2.offsetHeight <= H2) return;
    }
  }
  function open(id){
    var t = document.getElementById('dv-' + id); if(!t) return;
    clearTimeout(closeT); dv.classList.remove('closing', 'open');
    cur = id; ttl.innerHTML = t.dataset.title || '';
    var holder = document.createElement('div'); holder.innerHTML = t.innerHTML;
    var I = t.dataset.idea || '', S = t.dataset.so || '';
    idea.innerHTML = I ? '<b>The idea:</b> ' + I : ''; idea.hidden = !I;
    so.innerHTML = S ? '<i class="ri">So.</i>' + S : ''; so.hidden = true;
    dv.hidden = false; scale(); document.body.classList.add('dv-on');
    layout([].slice.call(holder.children));
    max = 0; cols.querySelectorAll('[data-s]').forEach(function(el){ max = Math.max(max, +el.dataset.s); });
    cols.querySelectorAll('[data-x]').forEach(function(el){ max = Math.max(max, +el.dataset.x); });
    set(1, false);
    void dv.offsetWidth; dv.classList.add('open');
  }
  function close(){ if(dv.hidden) return; finish(); cur = null; document.body.classList.remove('dv-on');
    if(reduce){ dv.hidden = true; dv.classList.remove('open'); return; }
    dv.classList.add('closing'); dv.classList.remove('open');
    closeT = setTimeout(function(){ dv.hidden = true; dv.classList.remove('closing'); }, 160); }
  // the next key at the last step and the back key at step 1 leave the window; a running flight is finished first, never dropped
  function go(k){ finish(); if(k > max || k < 1){ close(); return; } set(k, k === step + 1 && !reduce); }
  function finish(){ if(!flight) return; var f = flight; flight = null; clearTimeout(f.timer);
    f.movers.forEach(function(el){ el.style.transition = 'none'; el.style.transform = ''; });
    void cols.offsetWidth; f.movers.forEach(function(el){ el.style.transition = ''; });
    if(step === f.k) trails(f.k, false); }
  function set(k, anim){
    step = k; cnt.innerHTML = 'step ' + k + ' of ' + max + (k === max ? '<span class="dvback">→ back to the slide</span>' : '');
    so.hidden = !so.innerHTML || k !== max; idea.classList.toggle('past', k > 1);
    var movers = [].filter.call(cols.querySelectorAll('[data-from]'), function(el){ return +sOf(el) === k; });
    cols.querySelectorAll('[data-s]').forEach(function(el){ var s = +el.dataset.s; el.classList.toggle('on', s <= k); el.classList.toggle('now', s === k); el.classList.toggle('inst', !anim || s !== k);
      el.classList.toggle('fly', s === k && el.classList.contains('dl') && movers.length > 0); });
    cols.querySelectorAll('[data-x]').forEach(function(el){ var x = +el.dataset.x; el.classList.toggle('struck', x <= k); el.classList.toggle('inst', !anim || x !== k); });
    if(!anim || !movers.length){ trails(k, false); return; }
    trails(k - 1, false);                     // the old trails stay; the new ones come after the move
    var k0 = K();
    movers.forEach(function(el, i){
      var src = cols.querySelector('[data-t="' + el.dataset.from + '"]'); if(!src) return;
      var a = src.getBoundingClientRect(), b = el.getBoundingClientRect();
      el.style.transition = 'none'; el.style.transform = 'translate(' + ((a.left - b.left) / k0) + 'px,' + ((a.top - b.top) / k0) + 'px)'; el.style.opacity = '1';
      el.getBoundingClientRect();
      el.style.transition = 'transform 800ms cubic-bezier(.45,.05,.25,1) ' + (i * 140) + 'ms'; el.style.transform = '';
    });
    flight = {k: k, movers: movers};
    flight.timer = setTimeout(function(){ flight = null; movers.forEach(function(el){ el.style.transition = ''; }); if(step === k) trails(k, true); }, 800 + movers.length * 140 + 60);
  }
  function sOf(el){ var p = el; while(p && p !== cols){ if(p.dataset && p.dataset.s) return p.dataset.s; p = p.parentNode; } return 0; }
  function trails(k, fresh){
    [].slice.call(svg.querySelectorAll('path.tr')).forEach(function(p){ p.remove(); });
    cols.querySelectorAll('[data-from]').forEach(function(el){
      var s = +sOf(el); if(s > k) return;
      var src = cols.querySelector('[data-t="' + el.dataset.from + '"]'); if(!src) return;
      var a = local(src.getBoundingClientRect()), b = local(el.getBoundingClientRect());
      var x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, d;
      if(Math.abs(x2 - x1) > 300){ d = 'M' + x1 + ',' + y1 + ' C' + x1 + ',' + (y1 + 60) + ' ' + x2 + ',' + (y2 - 60) + ' ' + x2 + ',' + (y2 - 3); }
      else d = 'M' + x1 + ',' + y1 + ' C' + x1 + ',' + (y1 + (y2 - y1) * 0.5) + ' ' + x2 + ',' + (y1 + (y2 - y1) * 0.5) + ' ' + x2 + ',' + (y2 - 3);
      var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('class', 'tr' + (s === step ? ' new' : '') + (fresh && s === k ? ' fresh' : ''));
      p.setAttribute('marker-end', 'url(#dvar)'); svg.appendChild(p);
    });
  }
  // a button counts only while it can be seen at the current click (the same rule as calc.js)
  function shown(b){ if(b.closest('[data-show]:not(.on),[data-only]:not(.on),[inert]')) return false;
    return b.checkVisibility ? b.checkVisibility({opacityProperty: true, visibilityProperty: true}) : b.offsetParent !== null; }
  function init(){
    build();
    document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('.dvbtn'); if(b && shown(b)){ e.preventDefault(); e.stopPropagation(); b.blur(); open(b.dataset.dv); } }, true);
    document.addEventListener('keydown', function(e){
      var t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      var wb = document.getElementById('wb'); if(wb && !wb.hidden) return;                    // the whiteboard has the keys
      var cw = document.getElementById('cw'); if(cw && !cw.hidden) return;                    // so does the calculation window
      var mod = e.ctrlKey || e.metaKey || e.altKey;
      var isD = !mod && (e.key === 'd' || e.key === 'D' || e.key === 'ي' || e.code === 'KeyD');   // ي = D on an Arabic keyboard
      var isW = !mod && (e.key === 'w' || e.key === 'W' || e.key === 'ص' || e.code === 'KeyW');
      if(!isOpen()){
        if(!isD || !dv.hidden) return;
        var b = [].filter.call(Reveal.getCurrentSlide().querySelectorAll('.dvbtn'), shown)[0]; if(!b) return;
        e.preventDefault(); e.stopImmediatePropagation(); open(b.dataset.dv); return;
      }
      if(isW) return;                                                                         // let the whiteboard open over the window
      e.preventDefault(); e.stopImmediatePropagation();
      if(isD || e.key === 'Escape') close();
      else if(['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter', 'n'].indexOf(e.key) >= 0) go(step + 1);
      else if(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p'].indexOf(e.key) >= 0) go(step - 1);
    }, true);
    window.EngsDeriv = {open: open, close: close, shown: shown, go: function(k){ go(k); }, set: function(k){ finish(); set(k, false); }, state: function(){ return {id: cur, step: step, max: max}; }};
  }
  (function wait(){ if(window.Reveal && Reveal.isReady && Reveal.isReady()) init(); else setTimeout(wait, 50); })();
})();
