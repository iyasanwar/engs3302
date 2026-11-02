/* Derivation window for ENGS 3302 decks ("how we get this", for understanding).
   A slide holds a button  <button class="dvbtn" data-dv="ID">  and a  <template id="dv-ID" data-title="...">  with the lines.
   Inside the template every element with data-s="k" appears at step k. A token <i data-t="name"> with data-from="other"
   flies from the token "other" (in an earlier line) to its place and leaves a dashed trail. data-x="k" strikes a token at step k.
   Lines flow into columns (no scrolling). Click or → / Space / PageDown: next step; ← / PageUp: back; Esc or D (ي): back to the slide,
   which stays at the same slide and step. While the window is open no key reaches the deck. */
(function(){
  var dv, stage, cols, svg, cnt, ttl, cur = null, step = 0, max = 0, busy = 0;
  var NS = 'http://www.w3.org/2000/svg';
  function scale(){ var k = Math.min(innerWidth / 1600, innerHeight / 900); stage.style.transform = 'translate(-50%,-50%) scale(' + k + ')'; return k; }
  function K(){ return stage.getBoundingClientRect().width / 1600; }
  function local(r){ var b = svg.getBoundingClientRect(), k = K(); return {x: (r.left - b.left) / k, y: (r.top - b.top) / k, w: r.width / k, h: r.height / k}; }
  function build(){
    dv = document.createElement('div'); dv.id = 'dv'; dv.hidden = true;
    dv.innerHTML = '<div id="dvStage"><div class="dvpanel"><div class="dvhead"><span class="dvtag">for understanding</span><span class="dvtitle"></span>'
      + '<button class="dvclose" type="button" aria-label="Back to the slide">×</button></div><div class="dvcols"></div>'
      + '<svg class="dvtrail" width="1600" height="900" viewBox="0 0 1600 900" aria-hidden="true"><defs><marker id="dvar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,1 L9,5 L0,9 Z" fill="currentColor"></path></marker></defs></svg>'
      + '<div class="dvside"><div class="dvcount"></div><div class="dvkey"><p><span class="dvk1"></span> a term moves: the dashed line shows where it came from</p>'
      + '<p><span class="dvk2">a</span> cancels: struck out</p><p><span class="dvk3">rule</span> the rule used in that line</p></div>'
      + '<div class="dvhint">click or → next · ← back · Esc: back to the slide</div></div></div></div>';
    document.body.appendChild(dv);
    stage = dv.querySelector('#dvStage'); cols = dv.querySelector('.dvcols'); svg = dv.querySelector('.dvtrail'); cnt = dv.querySelector('.dvcount'); ttl = dv.querySelector('.dvtitle');
    dv.querySelector('.dvclose').addEventListener('click', function(e){ e.stopPropagation(); close(); });
    stage.addEventListener('click', function(e){ e.stopPropagation(); go(step + 1); });
    dv.addEventListener('click', function(e){ e.stopPropagation(); });
    addEventListener('resize', function(){ if(!dv.hidden){ scale(); trails(step, false); } });
  }
  function open(id){
    var t = document.getElementById('dv-' + id); if(!t) return;
    cur = id; ttl.innerHTML = t.dataset.title || ''; cols.innerHTML = t.innerHTML;
    max = 0; cols.querySelectorAll('[data-s]').forEach(function(el){ max = Math.max(max, +el.dataset.s); });
    cols.querySelectorAll('[data-x]').forEach(function(el){ max = Math.max(max, +el.dataset.x); });
    dv.hidden = false; scale(); document.body.classList.add('dv-on'); set(1, true);
  }
  function close(){ dv.hidden = true; cur = null; document.body.classList.remove('dv-on'); }
  function go(k){ if(k < 1 || k > max || busy) return; set(k, k === step + 1); }
  function set(k, anim){
    step = k; cnt.textContent = 'step ' + k + ' of ' + max;
    cols.querySelectorAll('[data-s]').forEach(function(el){ var s = +el.dataset.s; el.classList.toggle('on', s <= k); el.classList.toggle('now', s === k); el.classList.toggle('inst', !anim || s !== k); });
    cols.querySelectorAll('[data-x]').forEach(function(el){ var x = +el.dataset.x; el.classList.toggle('struck', x <= k); el.classList.toggle('inst', !anim || x !== k); });
    var movers = [].filter.call(cols.querySelectorAll('[data-from]'), function(el){ return +sOf(el) === k; });
    if(!anim || !movers.length){ trails(k, false); return; }
    trails(k - 1, false);                     // the old trails stay; the new ones come after the move
    busy++; var k0 = K();
    movers.forEach(function(el, i){
      var src = cols.querySelector('[data-t="' + el.dataset.from + '"]'); if(!src) return;
      var a = src.getBoundingClientRect(), b = el.getBoundingClientRect();
      el.style.transition = 'none'; el.style.transform = 'translate(' + ((a.left - b.left) / k0) + 'px,' + ((a.top - b.top) / k0) + 'px)'; el.style.opacity = '1';
      el.getBoundingClientRect();
      el.style.transition = 'transform 800ms cubic-bezier(.45,.05,.25,1) ' + (i * 140) + 'ms'; el.style.transform = '';
    });
    setTimeout(function(){ movers.forEach(function(el){ el.style.transition = ''; }); busy--; if(step === k) trails(k, true); }, 800 + movers.length * 140 + 60);
  }
  function sOf(el){ var p = el; while(p && p !== cols){ if(p.dataset && p.dataset.s) return p.dataset.s; p = p.parentNode; } return 0; }
  function trails(k, fresh){
    [].slice.call(svg.querySelectorAll('path.tr')).forEach(function(p){ p.remove(); });
    cols.querySelectorAll('[data-from]').forEach(function(el){
      var s = +sOf(el); if(s > k) return;
      var src = cols.querySelector('[data-t="' + el.dataset.from + '"]'); if(!src) return;
      var a = local(src.getBoundingClientRect()), b = local(el.getBoundingClientRect());
      var x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, d;
      if(x2 - x1 > 300 || x1 - x2 > 300){ d = 'M' + x1 + ',' + y1 + ' C' + x1 + ',' + (y1 + 60) + ' ' + x2 + ',' + (y2 - 60) + ' ' + x2 + ',' + (y2 - 3); }
      else d = 'M' + x1 + ',' + y1 + ' C' + x1 + ',' + (y1 + (y2 - y1) * 0.5) + ' ' + x2 + ',' + (y1 + (y2 - y1) * 0.5) + ' ' + x2 + ',' + (y2 - 3);
      var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('class', 'tr' + (s === step ? ' new' : '') + (fresh && s === k ? ' fresh' : ''));
      p.setAttribute('marker-end', 'url(#dvar)'); svg.appendChild(p);
    });
  }
  function init(){
    build();
    document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('.dvbtn'); if(b){ e.preventDefault(); e.stopPropagation(); b.blur(); open(b.dataset.dv); } }, true);
    document.addEventListener('keydown', function(e){
      var t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      var wb = document.getElementById('wb'); if(wb && !wb.hidden) return;                    // the whiteboard has the keys
      var mod = e.ctrlKey || e.metaKey || e.altKey;
      var isD = !mod && (e.key === 'd' || e.key === 'D' || e.key === 'ي' || e.code === 'KeyD');   // ي = D on an Arabic keyboard
      var isW = !mod && (e.key === 'w' || e.key === 'W' || e.key === 'ص' || e.code === 'KeyW');
      if(dv.hidden){
        if(!isD) return;
        var b = Reveal.getCurrentSlide().querySelector('.dvbtn'); if(!b) return;
        e.preventDefault(); e.stopImmediatePropagation(); open(b.dataset.dv); return;
      }
      if(isW) return;                                                                         // let the whiteboard open over the window
      e.preventDefault(); e.stopImmediatePropagation();
      if(isD || e.key === 'Escape') close();
      else if(['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter', 'n'].indexOf(e.key) >= 0) go(step + 1);
      else if(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p'].indexOf(e.key) >= 0) go(step - 1);
    }, true);
    window.EngsDeriv = {open: open, close: close, go: function(k){ go(k); }, set: function(k){ set(k, false); }, state: function(){ return {id: cur, step: step, max: max}; }};
  }
  (function wait(){ if(window.Reveal && Reveal.isReady && Reveal.isReady()) init(); else setTimeout(wait, 50); })();
})();
