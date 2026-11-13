/* Step engine for ENGS 3302 decks.
   A slide counts its click-steps with hidden <span class="fragment marker"></span> elements.
   [data-show="n"]  visible from step n on;  [data-only="n"] visible only at step n (also "a-b" for a range, "1,4" for a list);
   [data-mark="n"] class "mark" from step n on; [data-cur="n"] class "cur" only at step n (the row being talked about);
   .draw elements are drawn when shown; rail items .st[data-n] become current/done as steps pass.
   The step number is also written to the slide as data-step. In print (PDF) every slide shows its last step.
   Hidden steps and the slides that are not present are inert (no Tab stops, no clicks).
   Motion (aesthetic review A3/A5), on a forward click by one only: three beats.
     beat 1, 0 ms: the marks (anything inside an SVG chart), siblings 60 ms apart;
     beat 2, +150 ms: values and cards (HTML), siblings 60 ms apart;
     beat 3, +300 ms: the sentence of the takeaway band; the old sentence leaves first (140 ms), so two lines never overprint.
   Going back, jumping, printing and reduced motion: the final state at once (class .inst on the slide).
   Every change sends the event "engs:step" (nav.js shows "step k of n" in the student pill). */
(function(){
  function stepOf(slide){ return slide.querySelectorAll('.fragment.marker.visible').length; }
  function maxOf(slide){ return slide.querySelectorAll('.fragment.marker').length; }
  function inRange(spec, s){ return String(spec).split(',').some(function(r){ var p=r.split('-'); var a=+p[0], b=p.length>1?+p[1]:a; return s>=a && s<=b; }); }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function apply(slide, s, fwd){
    if(!slide) return;
    slide.dataset.step = s;
    fwd = fwd && !reduce;
    slide.classList.toggle('inst', !fwd);
    var fresh = [];
    function set(el, on){ var was = el.classList.contains('on'); if(on && !was) fresh.push(el); el.classList.toggle('on', on); if('inert' in el) el.inert = !on; if(!on) el.style.transitionDelay = ''; }
    // a step that is not shown yet is inert: its buttons and links are no Tab stops and take no clicks
    slide.querySelectorAll('[data-show]').forEach(function(el){ set(el, s >= +el.dataset.show); });
    slide.querySelectorAll('[data-only]').forEach(function(el){ set(el, inRange(el.dataset.only, s)); });
    slide.querySelectorAll('[data-mark]').forEach(function(el){ el.classList.toggle('mark', s >= +el.dataset.mark); });
    slide.querySelectorAll('[data-cur]').forEach(function(el){ el.classList.toggle('cur', inRange(el.dataset.cur, s)); });
    slide.querySelectorAll('.rail .st[data-n]').forEach(function(el){ var n=+el.dataset.n;
      var next=el.nextElementSibling && el.nextElementSibling.dataset ? +el.nextElementSibling.dataset.n : Infinity;
      el.classList.toggle('done', s >= next); el.classList.toggle('cur', s >= n && s < next); });
    if(!fwd){ fresh.forEach(function(el){ el.style.transitionDelay = ''; }); void slide.offsetWidth; return; }
    // the three beats: only the outermost new elements get a delay (their children move with them)
    var top = fresh.filter(function(el){ return !fresh.some(function(o){ return o !== el && o.contains(el); }); });
    var nm = 0, nv = 0;
    top.forEach(function(el){
      if(el.closest('.tlines')){                                   // beat 3: the band sentence enters from below after the old one left
        el.style.transition = 'none'; el.style.transform = 'translateY(8px)'; el.style.opacity = '0'; void el.offsetWidth;
        el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; return; }
      if(el.closest('.where')){ el.style.transitionDelay = '0ms'; return; }
      var d = el.closest('svg') ? Math.min(nm++, 4) * 60 : 150 + Math.min(nv++, 4) * 60;
      el.style.transitionDelay = d + 'ms';
    });
  }
  var last = {slide:null, step:0};
  // only the present slide can take focus: the slides before and after it are inert
  function present(sl){ document.querySelectorAll('.reveal .slides>section').forEach(function(x){ x.inert = x !== sl; }); }
  function update(){ var sl=Reveal.getCurrentSlide(), s=stepOf(sl);
    var prev = (last.slide === sl) ? last.step : (s === 0 ? -1 : s + 1);
    apply(sl, s, last.slide === sl && s === prev + 1); present(sl);
    if(window.EngsAnim) EngsAnim.run(sl, s, prev, last.slide !== sl && s > 0);
    last = {slide: sl, step: s};
    document.dispatchEvent(new CustomEvent('engs:step', {detail: {h: Reveal.getIndices().h, n: Reveal.getTotalSlides(), step: s, max: maxOf(sl)}})); }
  window.EngsSteps = { init: function(){
    var print = /print-pdf/.test(location.search);
    document.querySelectorAll('.reveal .slides section').forEach(function(sl){ var m = print ? maxOf(sl) : 0; apply(sl, m, false); if(print && window.EngsAnim) EngsAnim.run(sl, m, m, true); });
    if(print) return;
    ['ready','slidechanged','fragmentshown','fragmenthidden'].forEach(function(e){ Reveal.on(e, update); });
    update();
  }, maxOf: maxOf, stepOf: stepOf};
})();
