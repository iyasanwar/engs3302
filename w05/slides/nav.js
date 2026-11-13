/* Student mode and recording mode for ENGS 3302 decks (aesthetic review U5, U11; design review F7).
   THE RULE: recording mode is on when the address has ?rec (or ?cam, the camera check), or after the R key (ق on an Arabic keyboard);
   R again turns it off. The choice is remembered on this computer (localStorage), so the instructor sets it once for all videos.
   In recording mode nothing but the slide is drawn: no step pill, no video buttons, no whiteboard button, no coach mark
   (html.rec, set in <head> before the first paint, so no control flashes into a recording).
   Student mode (any other address): a pill at the bottom left, "‹  slide 3/5 · step 2 of 4  ›", with 44 px buttons; a tap or click
   on the right 40 % of the slide goes on, on the left 20 % goes back; the controls fade after 2.5 s without the mouse and come back
   when it moves. A one-time hint names the keys. The pill is bottom left and never near the camera circle (bottom right).
   Each deck also writes "last video" and "seen" for the week page (index.html: Continue, ✓). Storage errors are ignored. */
(function(){
  var html = document.documentElement, vid = document.body.dataset.video || '', wk = document.body.dataset.week || '';
  function store(k, v){ try { if(v === undefined) return localStorage.getItem(k); if(v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){ return null; } }
  var forced = /[?&](rec|cam)\b/.test(location.search);
  function rec(){ return html.classList.contains('rec'); }
  if(vid){ store('engs-w' + wk + '-last', vid); var seen = {}; try { seen = JSON.parse(store('engs-w' + wk + '-seen') || '{}') || {}; } catch(e){} seen[vid] = 1; store('engs-w' + wk + '-seen', JSON.stringify(seen)); }
  var pill, txt, bp, bn, coach, toast, idleT;
  function build(){
    pill = document.createElement('div'); pill.id = 'pill'; pill.setAttribute('role', 'navigation'); pill.setAttribute('aria-label', 'Steps');
    pill.innerHTML = '<button type="button" class="pp" aria-label="Back one step" title="Back (←)">‹</button><span class="pc" aria-live="polite"></span><button type="button" class="pn" aria-label="Next step" title="Next (→ or Space)">›</button>';
    document.body.appendChild(pill); txt = pill.querySelector('.pc'); bp = pill.querySelector('.pp'); bn = pill.querySelector('.pn');
    bp.addEventListener('click', function(e){ e.stopPropagation(); bp.blur(); Reveal.prev(); });
    bn.addEventListener('click', function(e){ e.stopPropagation(); bn.blur(); Reveal.next(); });
    if(!store('engs-coach') && !rec()){
      coach = document.createElement('div'); coach.id = 'coach';
      coach.innerHTML = '<kbd>→</kbd> or tap the right side: next step · <kbd>←</kbd> back · <kbd>P</kbd> pen · <kbd>W</kbd> whiteboard · <kbd>D</kbd> <kbd>C</kbd> explain, where a button shows · <kbd>?</kbd> all keys';
      document.body.appendChild(coach); store('engs-coach', '1');
      setTimeout(function(){ coach.style.opacity = 0; setTimeout(function(){ coach.remove(); }, 500); }, 5000);
    }
  }
  function show(d){ if(!pill) return; var h = d.h + 1, n = d.n;
    txt.innerHTML = '<small>slide ' + h + '/' + n + '</small>' + (d.max ? 'step ' + d.step + ' of ' + d.max : (d.h === n - 1 ? 'end' : '—'));
    bp.disabled = Reveal.isFirstSlide() && !Reveal.availableFragments().prev; bn.disabled = Reveal.isLastSlide() && !Reveal.availableFragments().next; }
  function wake(){ html.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(function(){ if(!document.querySelector('#pill:hover,#vnav:hover,#pill :focus,#vnav :focus')) html.classList.add('idle'); }, 2500); }
  function note(t){ if(!toast){ toast = document.createElement('div'); toast.id = 'toast'; document.body.appendChild(toast); }
    toast.textContent = t; toast.style.opacity = 1; clearTimeout(toast._t); toast._t = setTimeout(function(){ toast.style.opacity = 0; }, 1600); }
  function layerOpen(){ return ['wb', 'dv', 'cw', 'keyhelp'].some(function(id){ var x = document.getElementById(id); return x && !x.hidden; }); }
  function init(){
    build();
    document.addEventListener('engs:step', function(e){ show(e.detail); });
    var s = Reveal.getCurrentSlide(); show({h: Reveal.getIndices().h, n: Reveal.getTotalSlides(), step: EngsSteps.stepOf(s), max: EngsSteps.maxOf(s)});
    ['mousemove', 'touchstart', 'keydown'].forEach(function(ev){ addEventListener(ev, wake, {passive: true}); }); wake();
    // tap zones (student mode only): right 40 % next, left 20 % back; never on a button, a link, a live page or a window
    document.querySelector('.reveal').addEventListener('click', function(e){
      if(rec() || layerOpen()) return;
      if(e.target.closest('a,button,input,select,textarea,iframe,label,[contenteditable],#pill,#vnav')) return;
      var sl = document.querySelector('.reveal .slides').getBoundingClientRect(), x = (e.clientX - sl.left) / sl.width;
      if(Reveal.getCurrentSlide().querySelector('.live')) return;
      if(x >= 0.6) Reveal.next(); else if(x <= 0.2) Reveal.prev();
    });
    document.addEventListener('keydown', function(e){
      var t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if(e.ctrlKey || e.metaKey || e.altKey || layerOpen()) return;
      if(e.code === 'KeyR' || e.key === 'r' || e.key === 'R' || e.key === 'ق'){
        e.preventDefault(); e.stopImmediatePropagation();
        if(forced){ note('Recording mode (from the address: ?rec)'); return; }
        var on = !rec(); html.classList.toggle('rec', on); store('engs-rec', on ? '1' : null);
        note(on ? 'Recording mode: no controls on screen (R to undo)' : 'Student mode: step pill and buttons shown');
      }
    }, true);
  }
  (function wait(){ if(window.Reveal && Reveal.isReady && Reveal.isReady() && window.EngsSteps) init(); else setTimeout(wait, 50); })();
})();
