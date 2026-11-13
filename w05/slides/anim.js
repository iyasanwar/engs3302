/* Animation helpers for ENGS 3302 decks (used by steps.js).
   Generic: an element with data-count="v" (and data-dec, data-delay) fades in with a 4 px rise when it is shown on a forward step;
   with data-from="p" (a running sum: the previous partial result) it counts from p to v over at most 600 ms instead.
   Results of operation boxes never count up from 0 (aesthetic review A4): the final value fades in and rises 4 px in 220 ms.
   Custom: a slide with data-anim="name" runs EngsAnim.scenes[name](slide, step, prev, ctx) on every step change.
   Going backwards, jumping, printing or reduced motion: every scene draws its final state at once (ctx.instant). */
(function(){
  var CALC = 600, FLY = 700, EASE = 'cubic-bezier(.2,.8,.2,1)';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ease = function(t){ return 1 - Math.pow(1 - t, 3); };
  function rise(el){ if(reduce || !el.animate) return; el.animate([{opacity: 0, transform: 'translateY(4px)'}, {opacity: 1, transform: 'none'}], {duration: 220, easing: EASE}); }
  function fmt(v, dec){ return (+v).toFixed(dec); }
  // slides are 1600 units wide; whatever reveal does to scale them, this ratio maps screen pixels back to slide units
  function relRect(el, slide){ var r = el.getBoundingClientRect(), s = slide.getBoundingClientRect(), k = (s.width / 1600) || 1;
    return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k }; }
  function makeCtx(slide, id, instant){
    var alive = function(){ return slide._animId === id; };
    var ctx = {
      instant: instant, alive: alive,
      sleep: function(ms){ return new Promise(function(r){ setTimeout(r, instant ? 0 : ms); }); },
      // run f(t) for t in 0..1 over ms; instant: f(1)
      frames: function(ms, f){ return new Promise(function(res){
        if(instant){ f(1); return res(); }
        var t0 = performance.now();
        (function step(now){ if(!alive()){ return res(); } var t = Math.max(0, Math.min(1, (now - t0) / ms)); /* the first frame can be timed before t0: never below 0 */ f(ease(t)); t < 1 ? requestAnimationFrame(step) : res(); })(t0);
      }); },
      tween: function(el, from, to, ms, dec, suffix){ suffix = suffix || '';
        return ctx.frames(ms || CALC, function(t){ el.textContent = fmt(from + (to - from) * t, dec) + suffix; }); },
      // a copy of src's text travels to dst; dst then shows that text
      fly: function(src, dst, text, ms){ if(!alive()) return Promise.resolve();
        if(instant){ dst.textContent = text; dst.style.opacity = 1; return Promise.resolve(); }
        var a = relRect(src, slide), b = relRect(dst, slide), cs = getComputedStyle(dst);
        var c = document.createElement('span'); c.className = 'flyer'; c.textContent = text;
        c.style.cssText = 'position:absolute;z-index:50;pointer-events:none;white-space:nowrap;font-family:var(--font-text);font-weight:600;font-feature-settings:"tnum" 1;color:var(--ink);' +
          'font-size:' + cs.fontSize + ';left:' + a.x + 'px;top:' + a.y + 'px;transition:left ' + (ms||FLY) + 'ms ' + EASE + ',top ' + (ms||FLY) + 'ms ' + EASE;
        slide.appendChild(c);
        return new Promise(function(res){ requestAnimationFrame(function(){ requestAnimationFrame(function(){ c.style.left = b.x + 'px'; c.style.top = b.y + 'px'; }); });
          setTimeout(function(){ c.remove(); if(alive()){ dst.textContent = text; dst.style.opacity = 1; } res(); }, (ms||FLY) + 40); });
      }
    };
    return ctx;
  }
  window.EngsAnim = {
    scenes: {}, rise: rise, EASE: EASE,
    run: function(slide, step, prev, instant){
      if(!slide) return;
      instant = instant || reduce || step < prev || Math.abs(step - prev) > 1;
      var id = (slide._animId || 0) + 1; slide._animId = id;
      slide.querySelectorAll('.flyer').forEach(function(f){ f.remove(); });
      var ctx = makeCtx(slide, id, instant);
      // generic count-ups for elements that became visible at this step
      slide.querySelectorAll('[data-count]').forEach(function(el){
        var host = el.closest('[data-show]'), show = host ? +host.dataset.show : 0, dec = +(el.dataset.dec || 0), to = +el.dataset.count; el.style.opacity = '';
        if(show === step && !instant && el.dataset.from !== undefined){ var from = +el.dataset.from; el.textContent = fmt(from, dec);
          ctx.sleep(+(el.dataset.delay || 0)).then(function(){ if(ctx.alive()) ctx.tween(el, from, to, CALC, dec); }); }
        else { el.textContent = fmt(to, dec); if(show === step && !instant){ el.style.opacity = 0; ctx.sleep(+(el.dataset.delay || 0)).then(function(){ if(ctx.alive()){ el.style.opacity = ''; rise(el); } }); } }
      });
      var name = slide.dataset.anim; if(name && this.scenes[name]) this.scenes[name](slide, step, prev, ctx);
    }
  };
})();
/* shared helpers for scene files */
(function(){
  function pdf(x, m, s){ var z = (x - m) / s; return Math.exp(-z * z / 2) / (s * Math.sqrt(2 * Math.PI)); }
  function erf(x){ var t = 1 / (1 + 0.3275911 * Math.abs(x));
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
  EngsAnim.u = {
    pdf: pdf, cdf: function(x, m, s){ return 0.5 * (1 + erf((x - m) / (s * Math.SQRT2))); },
    q: function(sl, k){ return sl.querySelector('[data-a="' + k + '"]'); },
    qa: function(sl, k){ return Array.prototype.slice.call(sl.querySelectorAll('[data-a="' + k + '"]')); },
    // a forward click by one step (animate); anything else draws the final state
    fwd: function(s, prev, X){ return !X.instant && prev >= 0 && s === prev + 1; },
    lerp: function(a, b, t){ return a + (b - a) * t; },
    // fill an opbox's slots and results with their final text
    settle: function(sl){ sl.querySelectorAll('.opbox [data-final]').forEach(function(e){ e.textContent = e.dataset.final; e.style.opacity = 1; }); },
    // animate an opbox: fly each [src element, slot index] pair, then count the result up
    calc: async function(X, box, pairs, resDec){
      var u = EngsAnim.u, slots = box.querySelectorAll('.slot'), res = box.querySelector('.res');
      slots.forEach(function(e){ e.style.opacity = 0; }); if(res) res.style.opacity = 0;
      for(var i = 0; i < pairs.length; i++){
        var src = pairs[i][0], slot = slots[pairs[i][1]];
        if(src) await X.fly(src, slot, slot.dataset.final, 650); else { slot.textContent = slot.dataset.final; slot.style.opacity = 1; await X.sleep(250); }
        if(!X.alive()) return;
      }
      slots.forEach(function(e){ e.style.opacity = 1; e.textContent = e.dataset.final; });
      if(res){ res.textContent = res.dataset.final; res.style.opacity = 1; EngsAnim.rise(res); await X.sleep(220); }
    }
  };
})();
