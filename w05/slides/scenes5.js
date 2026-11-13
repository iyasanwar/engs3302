/* Week 5 scenes (from Week 4). "gen" is the default for every content slide:
   - a forward click runs the operation boxes of that step (.opbox[data-k=step]); data-src lists the data-a keys whose numbers fly into the slots (empty = no source);
   - CSS transitions (.grow, .wipe, data-show) only play on a forward click: otherwise the slide gets .inst and jumps to the final state.
   - [data-wait] on a data-show / data-only item: on a forward click it appears only after the step's boxes are worked out.
   Custom scenes call gen first, then add their own motion. */
(function(){
  var S = EngsAnim.scenes, u = EngsAnim.u;
  u.geo = function(sl, key){ var el = u.q(sl, key || 'geo'); var g = JSON.parse(el.dataset.geo);
    g.X = function(x){ return g.px0 + (x - g.xa) / (g.xb - g.xa) * g.pw; };
    g.Y = function(y){ return g.py0 + g.ph - Math.min(y, g.ymx * 1.04) / g.ymx * g.ph; };
    g.iX = function(px){ return g.xa + (px - g.px0) / g.pw * (g.xb - g.xa); }; return g; };
  // path of f from a to b; close = area down to the axis
  u.fpath = function(g, f, a, b, close, n){ n = n || 160; var d = '';
    for(var i = 0; i <= n; i++){ var x = a + (b - a) * i / n; d += (i ? ' L' : 'M') + g.X(x).toFixed(1) + ',' + g.Y(f(x)).toFixed(1); }
    return close ? d + ' L' + g.X(b).toFixed(1) + ',' + g.Y(0).toFixed(1) + ' L' + g.X(a).toFixed(1) + ',' + g.Y(0).toFixed(1) + ' Z' : d; };
  u.sb = function(P){ return function(x){ return u.pdf(x, 7, 1) * P; }; };      // sea bass score
  u.ss = function(P){ return function(x){ return u.pdf(x, 4, 1) * (1 - P); }; }; // salmon score
  // total mistakes (per fish) of the rule "sea bass when x > t"
  u.errAt = function(t, P){ return P * u.cdf(t, 7, 1) + (1 - P) * (1 - u.cdf(t, 4, 1)); };

  S.gen = async function(sl, s, prev, X){
    var f = u.fwd(s, prev, X);
    sl.classList.toggle('inst', !f);
    if(!f){ void sl.offsetWidth; }
    u.settle(sl);
    if(!f) return;
    var boxes = sl.querySelectorAll('.opbox[data-k="' + s + '"]');
    // every box of this step waits empty for its turn (settle() above wrote all final values: a later box would show its result,
    // then reset and count again); a [data-wait] item of this step (the sentence or bar that states the result) comes after the last box
    boxes.forEach(function(b){ b.querySelectorAll('.slot,.res').forEach(function(e){ e.style.opacity = 0; }); });
    var late = boxes.length ? [].filter.call(sl.querySelectorAll('[data-wait].on'), function(el){ return u.first(el) === s; }) : [];
    late.forEach(function(el){ el.classList.remove('on'); });
    for(var i = 0; i < boxes.length; i++){
      var b = boxes[i], keys = (b.dataset.src || '').split(','), pairs = [];
      b.querySelectorAll('.slot').forEach(function(_, j){ var k = (keys[j] || '').trim(); pairs.push([k ? u.q(sl, k) : null, j]); });
      await X.sleep(+(b.dataset.delay || 350)); if(!X.alive()) return;
      await u.calc(X, b, pairs); if(!X.alive()) return;
    }
    if(late.length){ await X.sleep(250); if(X.alive()) late.forEach(function(el){ el.classList.add('on'); }); }
  };
  // the first step at which an element is shown (data-show="n", data-only="n", "a-b" or "1,4")
  u.first = function(el){ return el.dataset.show !== undefined ? +el.dataset.show : +String(el.dataset.only).split(/[-,]/)[0]; };

  // 5.8: on the QDA click the LDA lines bend into the QDA curves (aesthetic review A5: the bend is the lesson).
  // Each path.morph holds both polylines with the same number of points (data-p0 LDA, data-p1 QDA); 700 ms, one easing.
  S.morph = async function(sl, s, prev, X){
    S.gen(sl, s, prev, X);
    var paths = [].slice.call(sl.querySelectorAll('path.morph'));
    function pts(a){ var v = a.split(',').map(Number), o = []; for(var i = 0; i < v.length; i += 2) o.push([v[i], v[i + 1]]); return o; }
    function d(P){ return 'M' + P.map(function(p){ return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L'); }
    var A = paths.map(function(p){ return pts(p.dataset.p0); }), B = paths.map(function(p){ return pts(p.dataset.p1); });
    paths.forEach(function(p, i){ p.setAttribute('d', d(B[i])); });
    if(!(u.fwd(s, prev, X) && s === 2)) return;
    paths.forEach(function(p, i){ p.setAttribute('d', d(A[i])); });
    await X.sleep(150); if(!X.alive()) return;
    await X.frames(700, function(t){ paths.forEach(function(p, i){ p.setAttribute('d', d(A[i].map(function(a, j){ var b = B[i][j]; return [u.lerp(a[0], b[0], t), u.lerp(a[1], b[1], t)]; }))); }); });
  };
})();

/* 5.7 (decision 57, for your information): whitening. Step 0 the z-score cloud, 1 turned by −45° onto its eigen-axes,
   2 each axis divided by √λ: the cloud is round and the ruler distance is the Mahalanobis distance. 3.5 s per step, slow on purpose. */
(function(){
  var S = EngsAnim.scenes, u = EngsAnim.u, R2 = Math.SQRT1_2;
  S.whiten = async function(sl, s, prev, X){
    S.gen(sl, s, prev, X);
    var sv = sl.querySelector('svg.whiten'); if(!sv) return;
    var C = JSON.parse(sv.dataset.wz), L1 = C.l1, L2 = C.l2;
    var q = function(c){ return sv.querySelector('.' + c); };
    var PX = function(x){ return C.cx + x * C.u; }, PY = function(y){ return C.cy - y * C.u; };
    var ST = [{p: 0, sx: 1, sy: 1}, {p: -Math.PI / 4, sx: 1, sy: 1}, {p: -Math.PI / 4, sx: 1 / Math.sqrt(L1), sy: 1 / Math.sqrt(L2)}];
    var dots = [].map.call(sv.querySelectorAll('.wd'), function(e){ return [e, e.dataset.z.split(',').map(Number)]; });
    var T = []; for(var i = 0; i < 120; i++) T.push(2 * Math.PI * i / 120);
    var E = [1, 2].map(function(r){ return T.map(function(t){ var a = Math.sqrt(L1) * r * Math.cos(t), b = Math.sqrt(L2) * r * Math.sin(t); return [R2 * (a + b), R2 * (a - b)]; }); });
    var trail = {A: [], B: []};
    function at(st, v){ var c = Math.cos(st.p), si = Math.sin(st.p); return [st.sx * (c * v[0] - si * v[1]), st.sy * (si * v[0] + c * v[1])]; }
    function set(e, a){ for(var k in a) e.setAttribute(k, typeof a[k] === 'number' ? a[k].toFixed(1) : a[k]); }
    function draw(st, keep){
      dots.forEach(function(d){ var p = at(st, d[1]); set(d[0], {cx: PX(p[0]), cy: PY(p[1])}); });
      ['we1', 'we2'].forEach(function(c, k){ q(c).setAttribute('d', 'M' + E[k].map(function(v){ var p = at(st, v); return PX(p[0]).toFixed(1) + ',' + PY(p[1]).toFixed(1); }).join(' L') + 'Z'); });
      var e1 = at(st, [2 * R2 * Math.sqrt(L1), 2 * R2 * Math.sqrt(L1)]), e2 = at(st, [-2 * R2 * Math.sqrt(L2), 2 * R2 * Math.sqrt(L2)]);
      if(e2[1] < 0) e2 = [-e2[0], -e2[1]];
      set(q('wa1'), {x1: PX(-e1[0]), y1: PY(-e1[1]), x2: PX(e1[0]), y2: PY(e1[1])}); set(q('wa2'), {x1: PX(-e2[0]), y1: PY(-e2[1]), x2: PX(e2[0]), y2: PY(e2[1])});
      var flat = e1[1] < 0.3;
      set(q('wl1'), {x: PX(e1[0]) + (flat ? 0 : 10), y: PY(e1[1]) + (flat ? 34 : -14), 'text-anchor': flat ? 'end' : 'start'});
      set(q('wl2'), {x: PX(e2[0]) - 10, y: PY(e2[1]) - 8});
      q('wl1').textContent = st.sx < 0.999 ? 'λ₁ axis ×' + st.sx.toFixed(2) : 'λ₁ = ' + L1.toFixed(2);
      q('wl2').textContent = st.sy > 1.001 ? 'λ₂ axis ×' + st.sy.toFixed(2) : 'λ₂ = ' + L2.toFixed(2);
      var a = at(st, [1, 1]), b = at(st, [1, -1]);
      set(q('wpA'), {cx: PX(a[0]), cy: PY(a[1])}); set(q('wpB'), {cx: PX(b[0]), cy: PY(b[1])});
      set(q('wtxA'), {x: PX(a[0]) + 16, y: PY(a[1]) - 12}); set(q('wtxB'), {x: PX(b[0]) + 16, y: PY(b[1]) + 30});
      set(q('wrA'), {x1: C.cx, y1: C.cy, x2: PX(a[0]), y2: PY(a[1])}); set(q('wrB'), {x1: C.cx, y1: C.cy, x2: PX(b[0]), y2: PY(b[1])});
      if(keep){ trail.A.push([PX(a[0]), PY(a[1])]); trail.B.push([PX(b[0]), PY(b[1])]); }
      q('wtA').setAttribute('d', trail.A.length ? 'M' + trail.A.join(' L') : ''); q('wtB').setAttribute('d', trail.B.length ? 'M' + trail.B.join(' L') : '');
      var da = Math.hypot(a[0], a[1]), db = Math.hypot(b[0], b[1]);
      sl.querySelector('.wdA').textContent = da.toFixed(2); sl.querySelector('.wsA').textContent = (da * da).toFixed(2);
      sl.querySelector('.wdB').textContent = db.toFixed(2); sl.querySelector('.wsB').textContent = (db * db).toFixed(2);
      q('wruler').setAttribute('opacity', ((1 - st.sx) / (1 - 1 / Math.sqrt(L1))).toFixed(2));
      q('wx').textContent = st.p ? (st.sx < 0.999 ? 'along ÷ √' + L1.toFixed(2) : 'along the tilt') : 'flipper z₁';
      q('wy').textContent = st.p ? (st.sx < 0.999 ? 'across ÷ √' + L2.toFixed(2) : 'across the tilt') : 'mass z₂';
    }
    var k = Math.min(Math.max(s, 0), 2), kp = Math.min(Math.max(prev == null ? 0 : prev, 0), 2);
    if(!(u.fwd(s, prev, X) && k !== kp)){ draw(ST[k]); return; }
    var A = ST[kp], B = ST[k];
    draw(A); await X.sleep(250); if(!X.alive()) return;
    await X.frames(3500, function(t){ draw({p: u.lerp(A.p, B.p, t), sx: u.lerp(A.sx, B.sx, t), sy: u.lerp(A.sy, B.sy, t)}, true); });
  };
})();
