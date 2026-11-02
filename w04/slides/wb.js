/* Whiteboard for ENGS 3302 decks: W or ص (or the button at the top right) covers the slide with a white sheet.
   W or Esc again removes it. While the sheet is on, every other key is ignored, so the slide and step stay exactly where they were. */
(function(){
  function init(){
    var wb = document.getElementById('wb'), btn = document.getElementById('wbBtn');
    if(!wb || !btn) return;
    function setOn(on){ wb.hidden = !on; btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.classList.toggle('on', on); btn.blur(); }
    function toggle(){ setOn(wb.hidden); }
    btn.addEventListener('click', function(e){ e.stopPropagation(); toggle(); });
    wb.addEventListener('click', function(e){ e.stopPropagation(); });
    document.addEventListener('keydown', function(e){
      var t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      var isW = (e.key === 'w' || e.key === 'W' || e.key === 'ص' || e.code === 'KeyW') && !e.ctrlKey && !e.metaKey && !e.altKey;   // ص = W on an Arabic keyboard
      if(!wb.hidden){ e.preventDefault(); e.stopImmediatePropagation(); if(isW || e.key === 'Escape') setOn(false); return; }
      if(isW){ e.preventDefault(); e.stopImmediatePropagation(); setOn(true); }
    }, true);
  }
  (function wait(){ if(window.Reveal && Reveal.isReady && Reveal.isReady()) init(); else setTimeout(wait, 50); })();
})();
