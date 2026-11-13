/* Calculation window for ENGS 3302 decks ("worked out": how a number on the slide was computed). Layout: design review move C.
   It is NOT the derivation window: the derivation (deriv.js, purple, D) is theory for understanding; this window (amber, C)
   shows the arithmetic behind the FIRST number a method produces, one worked case, with every factor named and its source.
   A slide holds  <button class="cwbtn" data-cw="ID">  and a  <template id="cw-ID" data-title="..." data-so="...">.
   Inside the template every element with data-s="k" appears at step k (class "now" on the newest step).
   Click or → / Space / PageDown: next step, and at the last step back to the slide; ← / PageUp: back (at step 1: back to the slide);
   Esc or C (ؤ on an Arabic keyboard): back to the slide, same slide and step. C opens the window only while its button is visible.
   Camera circle: nothing in the window enters the bottom-right keep-out disc: below y 540 the right column is at most 410 px wide
   (class .cwlow), the So band ends at x 1210 and the source legend at x 760; the key hint is in the header. ?cam draws the guide above.
   Open: the backdrop fades in (180 ms), the panel scales from .985 (220 ms); close: the reverse in 160 ms. Step 1 shows at once. */
(function(){
  var cw, stage, body, cnt, ttl, so, cur = null, step = 0, max = 0, closeT = null;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function scale(){ var k = Math.min(innerWidth / 1600, innerHeight / 900); stage.style.transform = 'translate(-50%,-50%) scale(' + k + ')'; }
  function build(){
    cw = document.createElement('div'); cw.id = 'cw'; cw.hidden = true;
    cw.innerHTML = '<div id="cwStage"><div class="cwpanel"><div class="cwhead"><span class="cwtag"><b>=</b> worked out</span><span class="cwtitle"></span></div>'
      + '<div class="cwcount"></div><button class="cwclose" type="button" aria-label="Back to the slide">×</button>'
      + '<div class="cwbody"></div><p class="cwso" hidden></p>'
      + '<div class="cwfoot"><span class="src data">data</span><span class="src guess">our guess</span><span class="src assume">assumption</span><span class="src const">constant</span></div></div>'
      + (/[?&]cam/.test(location.search) ? '<div class="camguide cwcam"></div>' : '') + '</div>';
    document.body.appendChild(cw);
    stage = cw.querySelector('#cwStage'); body = cw.querySelector('.cwbody'); cnt = cw.querySelector('.cwcount'); ttl = cw.querySelector('.cwtitle'); so = cw.querySelector('.cwso');
    cw.querySelector('.cwclose').addEventListener('click', function(e){ e.stopPropagation(); close(); });
    stage.addEventListener('click', function(e){ e.stopPropagation(); if(isOpen()) go(step + 1); });
    cw.addEventListener('click', function(e){ e.stopPropagation(); });
    addEventListener('resize', function(){ if(!cw.hidden) scale(); });
  }
  function isOpen(){ return !cw.hidden && !cw.classList.contains('closing'); }
  function open(id){
    var t = document.getElementById('cw-' + id); if(!t) return;
    clearTimeout(closeT); cw.classList.remove('closing', 'open');
    cur = id; ttl.innerHTML = t.dataset.title || ''; body.innerHTML = t.innerHTML;
    so.innerHTML = t.dataset.so ? '<i class="ri">So.</i>' + t.dataset.so : ''; so.hidden = true;
    var foot = cw.querySelector('.cwfoot');                // the four kinds always; any other kind the window uses is added
    foot.querySelectorAll('.src.extra').forEach(function(x){ x.remove(); });
    var seen = {data: 1, guess: 1, assume: 1, const: 1};
    body.querySelectorAll('.src').forEach(function(x){ var k = x.classList[1]; if(k && !seen[k]){ seen[k] = 1; var c = x.cloneNode(true); c.classList.add('extra'); foot.appendChild(c); } });
    max = 1; body.querySelectorAll('[data-s]').forEach(function(el){ max = Math.max(max, +el.dataset.s); });
    cw.hidden = false; scale(); document.body.classList.add('cw-on'); set(1, false);
    void cw.offsetWidth; cw.classList.add('open');
  }
  function close(){ if(cw.hidden) return; cur = null; document.body.classList.remove('cw-on');
    if(reduce){ cw.hidden = true; cw.classList.remove('open'); return; }
    cw.classList.add('closing'); cw.classList.remove('open');
    closeT = setTimeout(function(){ cw.hidden = true; cw.classList.remove('closing'); }, 160); }
  // the next key at the last step and the back key at step 1 leave the window: the slide stays at the same slide and click
  function go(k){ if(k > max || k < 1){ close(); return; } set(k, k === step + 1 && !reduce); }
  function set(k, anim){
    step = k; cnt.innerHTML = 'step ' + k + ' of ' + max + (k === max ? '<span class="cwback">→ back to the slide</span>' : '<span class="cwhint">→ next · ← back · Esc</span>'); so.hidden = !so.innerHTML || k !== max;
    body.querySelectorAll('[data-s]').forEach(function(el){ var s = +el.dataset.s; el.classList.toggle('on', s <= k); el.classList.toggle('now', s === k && anim); });
  }
  // a button counts only while it can be seen at the current click: not inside a step that is not shown yet, not transparent
  function shown(b){ if(b.closest('[data-show]:not(.on),[data-only]:not(.on),[inert]')) return false;
    return b.checkVisibility ? b.checkVisibility({opacityProperty: true, visibilityProperty: true}) : b.offsetParent !== null; }
  function init(){
    build();
    document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('.cwbtn'); if(b && shown(b)){ e.preventDefault(); e.stopPropagation(); b.blur(); open(b.dataset.cw); } }, true);
    document.addEventListener('keydown', function(e){
      var t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      var wb = document.getElementById('wb'); if(wb && !wb.hidden) return;                    // the whiteboard has the keys
      var dv = document.getElementById('dv'); if(dv && !dv.hidden) return;                    // so does the derivation window
      var mod = e.ctrlKey || e.metaKey || e.altKey;
      var isC = !mod && (e.key === 'c' || e.key === 'C' || e.key === 'ؤ' || e.code === 'KeyC');
      var isW = !mod && (e.key === 'w' || e.key === 'W' || e.key === 'ص' || e.code === 'KeyW');
      if(!isOpen()){
        if(!isC || !cw.hidden) return;
        var bs = [].filter.call(Reveal.getCurrentSlide().querySelectorAll('.cwbtn'), shown);
        if(!bs.length) return;
        e.preventDefault(); e.stopImmediatePropagation(); open(bs[0].dataset.cw); return;
      }
      if(isW) return;                                                                         // the whiteboard may open over the window
      e.preventDefault(); e.stopImmediatePropagation();
      if(isC || e.key === 'Escape') close();
      else if(['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter', 'n'].indexOf(e.key) >= 0) go(step + 1);
      else if(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p'].indexOf(e.key) >= 0) go(step - 1);
    }, true);
    window.EngsCalc = {open: open, close: close, shown: shown, go: function(k){ go(k); }, set: function(k){ set(k, false); }, state: function(){ return {id: cur, step: step, max: max}; }};
  }
  (function wait(){ if(window.Reveal && Reveal.isReady && Reveal.isReady()) init(); else setTimeout(wait, 50); })();
})();
