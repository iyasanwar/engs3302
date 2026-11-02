/* Week 4 scenes. "gen" is the default for every content slide:
   - a forward click runs the operation boxes of that step (.opbox[data-k=step]); data-src lists the data-a keys whose numbers fly into the slots (empty = no source);
   - CSS transitions (.grow, .wipe, data-show) only play on a forward click: otherwise the slide gets .inst and jumps to the final state.
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
    for(var i = 0; i < boxes.length; i++){
      var b = boxes[i], keys = (b.dataset.src || '').split(','), pairs = [];
      b.querySelectorAll('.slot').forEach(function(_, j){ var k = (keys[j] || '').trim(); pairs.push([k ? u.q(sl, k) : null, j]); });
      await X.sleep(+(b.dataset.delay || 350)); if(!X.alive()) return;
      await u.calc(X, b, pairs); if(!X.alive()) return;
    }
  };

  /* 4.2: the error of the larger-posterior rule is the lower posterior curve at every x */
  S.why = async function(sl, s, prev, X){
    await S.gen(sl, s, prev, X);
    var g = u.geo(sl), lo = u.q(sl, 'loA'), hi = u.q(sl, 'hiA');
    var P1 = function(x){ var a = u.pdf(x, 7, 1) * 0.6, b = u.pdf(x, 4, 1) * 0.4; return a / (a + b); };
    var low = function(x){ var p = P1(x); return Math.min(p, 1 - p); };
    function setLo(b){ lo.setAttribute('d', b > g.xa ? u.fpath(g, low, g.xa, b, true, 200) : ''); }
    setLo(s >= 2 ? g.xb : g.xa);
    hi.setAttribute('d', s === 3 ? u.fpath(g, P1, 5.365, 6.0, true, 60) : '');
    if(!u.fwd(s, prev, X)) return;
    if(s === 2){ setLo(g.xa); await X.sleep(300); await X.frames(1600, function(t){ setLo(g.xa + (g.xb - g.xa) * t); }); }
  };

  /* 4.3: the two error areas fill in */
  S.areas = async function(sl, s, prev, X){
    await S.gen(sl, s, prev, X);
    var g = u.geo(sl), aB = u.q(sl, 'aB'), aS = u.q(sl, 'aS'), xs = 5.3648, P = 0.6;
    var fb = u.sb(P), fs = u.ss(P);
    function setB(b){ aB.setAttribute('d', b > g.xa ? u.fpath(g, fb, g.xa, b, true) : ''); }
    function setS(a){ aS.setAttribute('d', a < g.xb ? u.fpath(g, fs, a, g.xb, true) : ''); }
    setB(s >= 1 ? xs : g.xa); setS(s >= 2 ? xs : g.xb);
    if(!u.fwd(s, prev, X)) return;
    if(s === 1){ setB(g.xa); await X.sleep(200); await X.frames(1200, function(t){ setB(g.xa + (xs - g.xa) * t); }); }
    if(s === 2){ setS(g.xb); await X.sleep(200); await X.frames(1200, function(t){ setS(g.xb - (g.xb - xs) * t); }); }
  };
  /* 4.3: move the threshold; the areas and the count follow */
  S.sweep = async function(sl, s, prev, X){
    await S.gen(sl, s, prev, X);
    var g = u.geo(sl), aB = u.q(sl, 'aB'), aS = u.q(sl, 'aS'), tl = u.q(sl, 'tl'), tlt = u.q(sl, 'tlt'), cnt = u.q(sl, 'cnt'), P = 0.6;
    var T = [5.3648, 4.5, 5.0, 5.3648, 5.5, 6.0], fb = u.sb(P), fs = u.ss(P);
    function set(t, show){ aB.setAttribute('d', show ? u.fpath(g, fb, g.xa, t, true) : ''); aS.setAttribute('d', show ? u.fpath(g, fs, t, g.xb, true) : '');
      tl.setAttribute('x1', g.X(t)); tl.setAttribute('x2', g.X(t)); tl.style.opacity = show ? 1 : 0; tlt.setAttribute('x', g.X(t)); tlt.textContent = show ? 't = ' + t.toFixed(2) : '';
      cnt.textContent = show ? (1000 * u.errAt(t, P)).toFixed(0) : '–'; }
    set(T[Math.min(s, 5)], s >= 1);
    if(!u.fwd(s, prev, X) || s < 1) return;
    var a = s === 1 ? 8.0 : T[s - 1], b = T[s];
    if(s === 1) set(a, true);
    await X.sleep(250); await X.frames(1100, function(t){ set(a + (b - a) * t, true); });
  };

  /* 4.4: the boundary moves from 5.36 to 5.13 */
  S.riskb = async function(sl, s, prev, X){
    await S.gen(sl, s, prev, X);
    var g = u.geo(sl), rl = u.q(sl, 'rl'), a = 5.3648, b = 5.1338;
    function set(x){ rl.setAttribute('x1', g.X(x)); rl.setAttribute('x2', g.X(x)); }
    set(s >= 2 ? b : a);
    if(u.fwd(s, prev, X) && s === 2){ set(a); await X.sleep(300); await X.frames(1200, function(t){ set(a + (b - a) * t); }); }
  };

  /* 4.1: a fork with two paths; the gate is locked, so every fish takes the path to the sea bass box */
  S.chute = async function(sl, s, prev, X){
    await S.gen(sl, s, prev, X);
    var sv = u.q(sl, 'chute'), pts = sv.dataset.path.split(' ').map(function(p){ return p.split(',').map(Number); });
    var F = u.qa(sl, 'cf');
    function at(el, p){ el.setAttribute('x', p[0].toFixed(1)); el.setAttribute('y', p[1].toFixed(1)); }
    function xy(el, k){ return el.dataset[k].split(',').map(Number); }
    F.forEach(function(el){ at(el, xy(el, s >= 1 ? 'b' : 'h')); });
    if(!(u.fwd(s, prev, X) && s === 1)) return;
    function route(el, t){ var P = [xy(el, 'h')].concat(pts).concat([xy(el, 'b')]), w = [0.22, 0.12, 0.46, 0.2], acc = 0;
      for(var i = 0; i < w.length; i++){ if(t <= acc + w[i] || i === w.length - 1){ var q = Math.max(0, Math.min(1, (t - acc) / w[i]));
        return [u.lerp(P[i][0], P[i + 1][0], q), u.lerp(P[i][1], P[i + 1][1], q)]; } acc += w[i]; } }
    var n = F.length, dur = 3000, each = 1100, gap = (dur - each) / (n - 1), t0 = performance.now();
    await X.frames(dur, function(){ var ms = X.instant ? dur : performance.now() - t0;
      F.forEach(function(el, i){ var t = Math.max(0, Math.min(1, (ms - i * gap) / each)); at(el, t <= 0 ? xy(el, 'h') : route(el, t)); }); });
    F.forEach(function(el){ at(el, xy(el, 'b')); });
  };

  /* 4.3: the camera opens the gate: each fish takes its own path */
  S.gatecam = async function(sl, s, prev, X){
    await S.gen(sl, s, prev, X);
    var sv = u.q(sl, 'chute'), R = sv.dataset.path.split(' ').map(function(p){ return p.split(',').map(Number); }), Lend = sv.dataset.pathl.split(',').map(Number);
    var F = u.qa(sl, 'cf'), gate = u.q(sl, 'gate'), fx = +gate.getAttribute('x1'), fy = +gate.getAttribute('y1');
    function at(el, p){ el.setAttribute('x', p[0].toFixed(1)); el.setAttribute('y', p[1].toFixed(1)); }
    function xy(el, k){ return el.dataset[k].split(',').map(Number); }
    function setGate(side){ var dx = side === 'r' ? -54 : side === 'l' ? 54 : 0; gate.setAttribute('x2', fx + dx); gate.setAttribute('y2', fy + (side ? 20 : 56)); }
    F.forEach(function(el){ at(el, xy(el, s >= 1 ? 'b' : 'h')); });
    setGate(s >= 1 ? null : null);
    if(!(u.fwd(s, prev, X) && s === 1)) return;
    function route(el, t){ var P = [xy(el, 'h'), R[0], R[1], el.dataset.s === 'r' ? R[2] : Lend, xy(el, 'b')], w = [0.22, 0.12, 0.46, 0.2], acc = 0;
      for(var i = 0; i < w.length; i++){ if(t <= acc + w[i] || i === w.length - 1){ var q = Math.max(0, Math.min(1, (t - acc) / w[i]));
        return [u.lerp(P[i][0], P[i + 1][0], q), u.lerp(P[i][1], P[i + 1][1], q)]; } acc += w[i]; } }
    var n = F.length, dur = 3200, each = 900, gap = (dur - each) / (n - 1), t0 = performance.now();
    await X.frames(dur, function(){ var ms = performance.now() - t0, cur = null;
      F.forEach(function(el, i){ var t = Math.max(0, Math.min(1, (ms - i * gap) / each)); at(el, t <= 0 ? xy(el, 'h') : route(el, t));
        if(t > 0.2 && t < 0.4) cur = el.dataset.s; });
      setGate(cur); });
    F.forEach(function(el){ at(el, xy(el, 'b')); }); setGate(null);
  };

  /* 4.1: the camera is on: one fish is photographed, its lightness read, the gate opens; then every fish is sorted */
  S.camon = async function(sl, s, prev, X){
    await S.gen(sl, s, prev, X);
    var sv = u.q(sl, 'chute'), R = sv.dataset.path.split(' ').map(function(p){ return p.split(',').map(Number); }), Lend = sv.dataset.pathl.split(',').map(Number), spot = sv.dataset.spot.split(',').map(Number);
    var F = u.qa(sl, 'cf'), first = F.filter(function(el){ return el.dataset.first; })[0], others = F.filter(function(el){ return !el.dataset.first; });
    var gate = u.q(sl, 'gate'), fx = +gate.getAttribute('x1'), fy = +gate.getAttribute('y1'), flash = u.q(sl, 'flash'), mk = u.q(sl, 'mk');
    function at(el, p){ el.setAttribute('x', p[0].toFixed(1)); el.setAttribute('y', p[1].toFixed(1)); }
    function xy(el, k){ return el.dataset[k].split(',').map(Number); }
    function setGate(side){ var dx = side === 'r' ? -54 : side === 'l' ? 54 : 0; gate.setAttribute('x2', fx + dx); gate.setAttribute('y2', fy + (side ? 20 : 56)); }
    function setMk(x){ mk.setAttribute('transform', 'translate(' + (20 + 22 * x).toFixed(1) + ',0)'); }
    var reds = u.qa(sl, 'red'); function setRed(o){ reds.forEach(function(r){ r.style.opacity = o; }); }
    function route(el, t, fromSpot){ var P = (fromSpot ? [spot] : [xy(el, 'h'), R[0]]).concat([R[1], el.dataset.s === 'r' ? R[2] : Lend, xy(el, 'b')]);
      var w = fromSpot ? [0.2, 0.55, 0.25] : [0.22, 0.12, 0.46, 0.2], acc = 0;
      for(var i = 0; i < w.length; i++){ if(t <= acc + w[i] || i === w.length - 1){ var q = Math.max(0, Math.min(1, (t - acc) / w[i]));
        return [u.lerp(P[i][0], P[i + 1][0], q), u.lerp(P[i][1], P[i + 1][1], q)]; } acc += w[i]; } }
    // final state of this step
    others.forEach(function(el){ at(el, xy(el, s >= 4 ? 'b' : 'h')); });
    at(first, s >= 3 ? xy(first, 'b') : s >= 1 ? spot : xy(first, 'h'));
    setGate(s === 3 ? 'r' : null); setMk(s >= 2 ? 5.4 : 0); flash.setAttribute('opacity', 0); setRed(s >= 4 ? 1 : 0);
    if(!u.fwd(s, prev, X)) return;
    if(s === 1){ var h = xy(first, 'h'); await X.frames(800, function(t){ at(first, [u.lerp(h[0], spot[0], t), u.lerp(h[1], spot[1], t)]); });
      if(!X.alive()) return; await X.frames(500, function(t){ flash.setAttribute('opacity', (1 - t) * 0.95); }); }
    if(s === 2){ setMk(0); await X.sleep(300); await X.frames(1100, function(t){ setMk(5.4 * t); }); }
    if(s === 3){ setGate(null); at(first, spot); await X.sleep(300); await X.frames(400, function(t){ gate.setAttribute('x2', fx - 54 * t); gate.setAttribute('y2', fy + 56 - 36 * t); });
      if(!X.alive()) return; await X.frames(1200, function(t){ at(first, route(first, t, true)); }); }
    if(s === 4){ setGate(null); setRed(0); var n = others.length, dur = 3200, each = 1000, gap = (dur - each) / (n - 1), t0 = performance.now();
      await X.frames(dur, function(){ var ms = performance.now() - t0, cur = null, fl = 0;
        others.forEach(function(el, i){ var t = Math.max(0, Math.min(1, (ms - i * gap) / each)); at(el, t <= 0 ? xy(el, 'h') : route(el, t, false));
          if(t > 0.18 && t < 0.4) cur = el.dataset.s; if(t > 0.14 && t < 0.22) fl = 0.6; });
        setGate(cur); flash.setAttribute('opacity', fl); });
      others.forEach(function(el){ at(el, xy(el, 'b')); }); setGate(null); flash.setAttribute('opacity', 0);
      if(!X.alive()) return; await X.frames(400, function(t){ setRed(t); }); }
  };
})();
