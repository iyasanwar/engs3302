/* Keys for ENGS 3302 decks (recording safety).
   reveal.js keeps only →/←/↑/↓/Space/PageUp/PageDown/Home/End/F; its overview (Esc/O), pause (B . V /), jump (G), speaker view (S),
   help (? F1) and letter navigation (N P H J K L) are switched off in Reveal.initialize (deckkit.KEYBOARD).
   ? (or ؟) shows this deck's own short key list; any key or a click closes it.
   Live pages (iframes): when the slide changes, or a key the deck needs is pressed inside the page, keyboard focus goes back to the deck.
   The live page sends those keys here with postMessage({engsKey: {key, code, shiftKey}}); they are replayed on the deck. */
(function(){
  var HELP = [['→', 'Space', 'next step'], ['←', '', 'back'], ['P', '', 'pen over the slide (P again or Esc: back)'], ['W', '', 'whiteboard, a white sheet you can draw on (W again or Esc: back)'], ['1 2 3 4', '', 'with P or W: navy, coral, ink pen, highlighter'], ['L E', '', 'with P or W: laser pointer, eraser'], ['Z X T', '', 'with P or W: undo, clear, hide the pen tray'], ['D', '', 'derivation window, when its button is shown'],
    ['C', '', 'calculation window, when its button is shown'], [']', '[', 'next / previous video'], ['H', '', 'week page'], ['F', '', 'full screen (or the button at the top right)'],
    ['Esc', '', 'close a window or the whiteboard'], ['R', '', 'recording mode on / off: hides the step pill and the buttons']];
  var help = null;
  function buildHelp(){
    help = document.createElement('div'); help.id = 'keyhelp'; help.hidden = true; help.setAttribute('role', 'dialog'); help.setAttribute('aria-label', 'Keys');
    help.innerHTML = '<div class="kh"><h2>Keys</h2><dl>' + HELP.map(function(r){ return '<dt><kbd>' + r[0] + '</kbd>' + (r[1] ? '<kbd>' + r[1] + '</kbd>' : '') + '</dt><dd>' + r[2] + '</dd>'; }).join('')
      + '</dl><p class="kf">Arabic keyboard: <bdi>ح</bdi> for P, <bdi>ص</bdi> for W, <bdi>م</bdi> <bdi>ث</bdi> <bdi>ئ</bdi> <bdi>ء</bdi> <bdi>ف</bdi> for L E Z X T, <bdi>ي</bdi> for D, <bdi>ؤ</bdi> for C, <bdi>ا</bdi> for H, <bdi>ق</bdi> for R. On a phone or with the mouse: tap the right side of the slide to go on, the left side to go back. Any key or a click closes this list.</p></div>';
    help.addEventListener('click', function(){ help.hidden = true; });
    document.body.appendChild(help);
  }
  function layerOpen(){ return ['wb', 'dv', 'cw'].some(function(id){ var x = document.getElementById(id); return x && !x.hidden; }); }
  function deckFocus(){ var a = document.activeElement; if(a && a.tagName === 'IFRAME'){ a.blur(); } if(document.activeElement && document.activeElement.tagName === 'IFRAME') window.focus(); }
  document.addEventListener('keydown', function(e){
    if(!help) return;
    if(!help.hidden){ e.preventDefault(); e.stopImmediatePropagation(); help.hidden = true; return; }
    var t = e.target; if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if((e.key === '?' || e.key === '؟') && !e.ctrlKey && !e.metaKey && !e.altKey && !layerOpen()){ e.preventDefault(); e.stopImmediatePropagation(); help.hidden = false; }
  }, true);
  // keys from a live page: give the focus back to the deck, then replay the key here (F: full screen, which reveal reads by keyCode)
  addEventListener('message', function(ev){
    var m = ev.data; if(typeof m === 'string'){ try { m = JSON.parse(m); } catch(x){ return; } }
    if(!m || !m.engsKey) return;
    var k = m.engsKey; deckFocus();
    if(k.code === 'KeyF' || k.key === 'f' || k.key === 'F'){ if(!layerOpen()){ var d = document; d.fullscreenElement ? d.exitFullscreen() : d.documentElement.requestFullscreen && d.documentElement.requestFullscreen().catch(function(){}); } return; }
    if(k.key === 'Escape') return;                                                   // Esc in a live page only leaves the page
    document.dispatchEvent(new KeyboardEvent('keydown', {key: k.key, code: k.code, shiftKey: !!k.shiftKey, bubbles: true, cancelable: true}));
  });
  (function wait(){ if(!(window.Reveal && Reveal.isReady && Reveal.isReady())){ setTimeout(wait, 50); return; }
    buildHelp();
    Reveal.on('slidechanged', deckFocus);
  })();
})();
