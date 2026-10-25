/* Scenes for the Video 3.4 deck. Each scene draws the state of its slide for a step:
   on a forward click it animates from the previous step; otherwise (ctx.instant) it jumps to the final state. */
(function(){
  var S = EngsAnim.scenes;
  function pdf(x, m, s){ var z = (x - m) / s; return Math.exp(-z * z / 2) / (s * Math.sqrt(2 * Math.PI)); }
  function erf(x){ var t = 1 / (1 + 0.3275911 * Math.abs(x));
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
  function cdf(x, m, s){ return 0.5 * (1 + erf((x - m) / (s * Math.SQRT2))); }
  function q(sl, k){ return sl.querySelector('[data-a="' + k + '"]'); }
  function qa(sl, k){ return Array.prototype.slice.call(sl.querySelectorAll('[data-a="' + k + '"]')); }
  function fwd(s, prev, X){ return !X.instant && prev >= 0 && s === prev + 1; }

  /* opener: the bars rise once */
  S.opener = function(sl, s, prev, X){
    var bars = qa(sl, 'ob'), base = 540;
    var set = function(t){ bars.forEach(function(r, i){ var h = +r.dataset.h, u = Math.min(1, Math.max(0, t * 1.5 - i * 0.04)); r.setAttribute('y', base - h * u); r.setAttribute('height', h * u); }); };
    if(X.instant || prev >= 0){ set(1); return; }
    X.frames(1300, set);
  };

  /* from counts to density: each number travels from where it comes from into the operation box */
  S.density = async function(sl, s, prev, X){
    var lab = q(sl, 'lab'), fill = q(sl, 'fill'), FW = +fill.dataset.w;
    var LAB = [[62, 0], [12.4, 1], [0.0363, 4]], TK = [[0, 20, 40, 60], [0, 4, 8, 12]];
    var m = function(k){ return Math.min(k, 2); };
    function state(k){
      lab.textContent = LAB[m(k)][0].toFixed(LAB[m(k)][1]);
      qa(sl, 'tk').forEach(function(el, i){ el.textContent = TK[Math.min(k, 1)][i]; });
      fill.setAttribute('width', k >= 4 ? FW : 0);
      sl.querySelectorAll('.opbox [data-final]').forEach(function(e){ e.textContent = e.dataset.final; e.style.opacity = 1; });
    }
    if(!fwd(s, prev, X)){ state(s); return; }
    state(prev);
    var box = sl.querySelector('.opbox[data-k="' + s + '"]');
    if(!box){ state(s); return; }
    var a = box.querySelector('[data-a="a"]'), b = box.querySelector('[data-a="b"]'), r = box.querySelector('[data-a="r"]');
    [a, b, r].forEach(function(e){ e.style.opacity = 0; });
    var later = function(ms, f){ return X.sleep(ms).then(f); };
    if(s === 1){
      await X.sleep(450);
      await Promise.all([X.fly(q(sl, 'hnum'), a, '62'), later(250, function(){ return X.fly(q(sl, 'wnum'), b, '5'); })]);
    } else if(s === 2){
      qa(sl, 'bar').forEach(function(e){ e.classList.remove('flash'); e.getBBox(); e.classList.add('flash'); });
      await X.sleep(600);
      await Promise.all([X.fly(lab, a, '12.4'), later(250, function(){ return X.fly(q(sl, 'allnum'), b, '342'); })]);
    } else if(s === 4){
      await X.sleep(450);
      await Promise.all([X.fly(lab, a, '0.0363'), later(250, function(){ return X.fly(q(sl, 'wnum'), b, '5'); })]);
    }
    if(!X.alive()) return;
    var fin = +r.dataset.final, dec = (r.dataset.final.split('.')[1] || '').length;
    r.textContent = (0).toFixed(dec); r.style.opacity = 1;
    if(s === 4){ await X.frames(1000, function(t){ fill.setAttribute('width', FW * t); r.textContent = (fin * t).toFixed(dec); }); return; }
    await X.tween(r, 0, fin, 900, dec);
    if(!X.alive()) return;
    await X.sleep(200);
    var A = LAB[m(prev)], B = LAB[m(s)], ks = s === 1 ? qa(sl, 'tk') : [];   // at step 2 the probability ticks fade in instead
    await X.frames(900, function(t){
      lab.textContent = (A[0] + (B[0] - A[0]) * t).toFixed(B[1]);
      ks.forEach(function(el, i){ el.textContent = Math.round(TK[0][i] + (TK[1][i] - TK[0][i]) * t); });
    });
  };

  /* shared geometry of the sea bass curve slides */
  function geo(sl){
    var g = JSON.parse(q(sl, 'geo').dataset.geo);
    g.X = function(x){ return g.px0 + (x - g.xa) / (g.xb - g.xa) * g.pw; };
    g.Y = function(y){ return g.py0 + g.ph - y / g.ymx * g.ph; };
    g.p = function(x){ return pdf(x, g.mu, g.sd); };
    g.P = function(x){ return cdf(x, g.mu, g.sd); };
    return g;
  }

  /* probability is an area: the curve is drawn, then a height grows, then an area fills */
  S.curve = async function(sl, s, prev, X){
    var g = geo(sl), path = q(sl, 'curve'), L = path.getTotalLength(), dot = q(sl, 'dot'), rx = q(sl, 'rx'), ry = q(sl, 'ry');
    var hl = q(sl, 'hl'), hc = q(sl, 'hc'), ht = q(sl, 'ht'), clip = q(sl, 'clip'), at = q(sl, 'at');
    var h = g.p(g.a), W = g.X(g.b) - g.X(g.a);
    path.style.strokeDasharray = L;
    var draw = function(t){ path.style.strokeDashoffset = L * (1 - t); };
    var at_x = function(x){ dot.setAttribute('cx', g.X(x)); dot.setAttribute('cy', g.Y(g.p(x))); rx.textContent = x.toFixed(2); ry.textContent = g.p(x).toFixed(3); };
    var height = function(t){ var y = g.Y(h * t); hl.setAttribute('y2', y); hc.setAttribute('cy', y); ht.setAttribute('y', y - 14); ht.textContent = (h * t).toFixed(3); };
    var area = function(t){ clip.setAttribute('width', W * t); at.textContent = (g.P(g.a + (g.b - g.a) * t) - g.P(g.a)).toFixed(3); };
    function state(k){ draw(k >= 1 ? 1 : 0); dot.style.opacity = k >= 1 ? 1 : 0; at_x(g.mu); height(k >= 2 ? 1 : 0); area(k >= 3 ? 1 : 0); }
    if(!fwd(s, prev, X)){ state(s); return; }
    state(prev);
    if(s === 1){
      dot.style.opacity = 1;
      await X.frames(1800, function(t){ draw(t); var pt = path.getPointAtLength(L * t);
        var x = g.xa + (pt.x - g.px0) / g.pw * (g.xb - g.xa); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); rx.textContent = x.toFixed(2); ry.textContent = g.p(x).toFixed(3); });
      if(!X.alive()) return;
      await X.sleep(250);
      await X.frames(900, function(t){ at_x(g.xb + (g.mu - g.xb) * t); });
    } else if(s === 2){ await X.sleep(300); await X.frames(1000, height); }
    else if(s === 3){ await X.sleep(300); await X.frames(1400, area); }
  };

  /* exactly 6: a strip around 6 gets thinner; its height stays, its area goes to 0 */
  S.strip = async function(sl, s, prev, X){
    var g = geo(sl), strip = q(sl, 'strip'), rw = q(sl, 'rw'), ra = q(sl, 'ra'), WS = [1, 0.1, 0.01, 0];
    var fw = function(w){ return w <= 0 ? '0' : String(+w.toPrecision(2)); };
    var fa = function(v){ return v < 1e-9 ? '0' : String(+v.toPrecision(3)); };
    function set(w){
      var lo = g.a - w / 2, hi = g.a + w / 2, d = '';
      if(w > 0){ d = 'M' + g.X(lo).toFixed(2) + ',' + g.Y(0);
        for(var i = 0; i <= 40; i++){ var x = lo + (hi - lo) * i / 40; d += ' L' + g.X(x).toFixed(2) + ',' + g.Y(g.p(x)).toFixed(2); }
        d += ' L' + g.X(hi).toFixed(2) + ',' + g.Y(0) + ' Z'; }
      strip.setAttribute('d', d || 'M0,0');
      strip.style.opacity = w > 0 ? 1 : 0;
      rw.textContent = fw(w); ra.textContent = fa(g.P(hi) - g.P(lo));
    }
    var k = Math.min(s, 3);
    if(!fwd(s, prev, X) || s > 3){ set(WS[k]); return; }
    var w0 = WS[prev], w1 = WS[s];
    set(w0); await X.sleep(350);
    await X.frames(1200, function(t){ set(w1 > 0 ? Math.exp(Math.log(w0) + (Math.log(w1) - Math.log(w0)) * t) : w0 * (1 - t)); });
  };

  /* why can a density be larger than 1: squeeze the axis, then the curve must grow */
  S.morph = async function(sl, s, prev, X){
    var path = q(sl, 'mp'), pk = q(sl, 'pk'), ar = q(sl, 'ar'), mu = 0.7, sd = 0.1, x0 = 0.3, x1 = 1.1;
    function set(k){
      var d = '';
      for(var i = 0; i <= 200; i++){ var x = x0 + (x1 - x0) * i / 200; d += (i ? ' L' : 'M') + ((x - x0) / (x1 - x0) * 520).toFixed(1) + ',' + (340 - k * pdf(x, mu, sd) / 4.5 * 340).toFixed(2); }
      path.setAttribute('d', d + ' Z'); pk.textContent = (k * pdf(mu, mu, sd)).toFixed(k < 0.5 ? 3 : 2); ar.textContent = k.toFixed(3);
    }
    if(!fwd(s, prev, X) || s !== 1){ set(1); return; }
    set(0.1); await X.sleep(1100);
    await X.frames(1400, function(t){ set(0.1 + 0.9 * t); });
  };
})();
