/* Prompter link for ENGS 3302 decks (instructor recording aid).
   When this deck was opened by the instructor's prompter page (W05_Prompter.html, in the instructor-only folder),
   it sends its position to that page: video, slide, clicks done, and the step of an open derivation or calculation window.
   Nothing is drawn on the slide, nothing is sent anywhere else, and opened normally (no opener) it does nothing. */
(function(){
  var target = window.opener;
  if(!target || /[?&]mirror\b/.test(location.search)) return;          // the recording window (present.js) talks to its presenter instead
  var vid = (location.pathname.match(/Video_([\d.]+)\.html/) || [])[1] || '';
  var last = '';
  function state(){
    var i = Reveal.getIndices(), s = {engs: 'cue', video: vid, h: i.h, clicks: (typeof i.f === 'number' ? i.f + 1 : 0), win: null};
    var dv = document.getElementById('dv'), cw = document.getElementById('cw');
    if(dv && !dv.hidden && window.EngsDeriv){ var d = EngsDeriv.state(); s.win = {kind: 'dv', id: d.id, step: d.step, max: d.max}; }
    else if(cw && !cw.hidden && window.EngsCalc){ var c = EngsCalc.state(); s.win = {kind: 'cw', id: c.id, step: c.step, max: c.max}; }
    return s;
  }
  function tick(){
    if(target.closed) return;
    var s = state(), k = JSON.stringify(s);
    if(k !== last){ last = k; try { target.postMessage(s, '*'); } catch(e){} }
  }
  addEventListener('message', function(e){
    var m = e.data;                                            // the prompter may ask the deck to go to a slide
    if(e.source === target && m && m.engs === 'goto' && typeof m.h === 'number'){ Reveal.slide(m.h, 0, -1); }
  });
  (function wait(){ if(window.Reveal && Reveal.isReady && Reveal.isReady()){ setInterval(tick, 150); tick(); } else setTimeout(wait, 50); })();
})();
