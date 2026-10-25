/* Step engine for ENGS 3302 decks.
   A slide counts its click-steps with hidden <span class="fragment marker"></span> elements.
   [data-show="n"]  visible from step n on;  [data-only="n"] visible only at step n (also "a-b" for a range, "1,4" for a list);
   .draw elements are drawn when shown; rail items .st[data-n] become current/done as steps pass.
   The step number is also written to the slide as data-step. In print (PDF) every slide shows its last step. */
(function(){
  function stepOf(slide){ return slide.querySelectorAll('.fragment.marker.visible').length; }
  function maxOf(slide){ return slide.querySelectorAll('.fragment.marker').length; }
  function inRange(spec, s){ return String(spec).split(',').some(function(r){ var p=r.split('-'); var a=+p[0], b=p.length>1?+p[1]:a; return s>=a && s<=b; }); }
  function apply(slide, s){
    if(!slide) return;
    slide.dataset.step = s;
    slide.querySelectorAll('[data-show]').forEach(function(el){ el.classList.toggle('on', s >= +el.dataset.show); });
    slide.querySelectorAll('[data-only]').forEach(function(el){ el.classList.toggle('on', inRange(el.dataset.only, s)); });
    slide.querySelectorAll('[data-mark]').forEach(function(el){ el.classList.toggle('mark', s >= +el.dataset.mark); });
    slide.querySelectorAll('.rail .st[data-n]').forEach(function(el){ var n=+el.dataset.n;
      var next=el.nextElementSibling && el.nextElementSibling.dataset ? +el.nextElementSibling.dataset.n : Infinity;
      el.classList.toggle('done', s >= next); el.classList.toggle('cur', s >= n && s < next); });
  }
  var last = {slide:null, step:0};
  function update(){ var sl=Reveal.getCurrentSlide(), s=stepOf(sl); apply(sl, s);
    var prev = (last.slide === sl) ? last.step : (s === 0 ? -1 : s + 1);
    if(window.EngsAnim) EngsAnim.run(sl, s, prev, last.slide !== sl && s > 0);
    last = {slide: sl, step: s}; }
  window.EngsSteps = { init: function(){
    var print = /print-pdf/.test(location.search);
    document.querySelectorAll('.reveal .slides section').forEach(function(sl){ var m = print ? maxOf(sl) : 0; apply(sl, m); if(print && window.EngsAnim) EngsAnim.run(sl, m, m, true); });
    if(print) return;
    ['ready','slidechanged','fragmentshown','fragmenthidden'].forEach(function(e){ Reveal.on(e, update); });
    update();
  }};
})();
