/* Scenes for Video 3.1. Each draws its slide's state for a step; a forward click animates. */
(function(){
  var S = EngsAnim.scenes, u = EngsAnim.u;

  /* where are we: the fish drop onto the lightness axis */
  S.where = async function(sl, s, prev, X){
    var dots = u.qa(sl, 'dot');
    var set = function(t){ dots.forEach(function(d, i){ var y = +d.dataset.y, k = Math.min(1, Math.max(0, t * 1.6 - i * 0.6 / dots.length)); d.setAttribute('cy', u.lerp(-20, y, k)); }); };
    if(u.fwd(s, prev, X) && s === 1){ set(0); await X.sleep(150); await X.frames(1500, set); } else set(1);
  };

  /* long-run fraction: the die is rolled; the line grows with a moving tip and a live count */
  S.longrun = async function(sl, s, prev, X){
    var g = JSON.parse(u.q(sl, 'geo').dataset.geo), path = u.q(sl, 'run'), tip = u.q(sl, 'tip'), rn = u.q(sl, 'rn'), rf = u.q(sl, 'rf');
    var L = path.getTotalLength(), marks = u.qa(sl, 'mk');
    path.style.strokeDasharray = L;
    var nOf = function(x){ return Math.pow(10, 1 + (x - g.lx0) / g.lw * 3); };
    function at(t){
      path.style.strokeDashoffset = L * (1 - t);
      var p = path.getPointAtLength(L * t), n = nOf(p.x);
      tip.setAttribute('cx', p.x); tip.setAttribute('cy', p.y);
      rn.textContent = Math.round(n).toLocaleString('en-US'); rf.textContent = ((g.ly0 + g.lh - p.y) / g.lh * g.ymax).toFixed(3);
      marks.forEach(function(m){ m.style.opacity = n >= +m.dataset.n * 0.995 ? 1 : 0; });
    }
    var done = function(){ at(1); rn.textContent = '10,000'; rf.textContent = '0.169'; };
    if(s === 0){ at(0); tip.style.opacity = 0; return; }
    tip.style.opacity = 1;
    if(u.fwd(s, prev, X) && s === 1){ at(0); await X.sleep(200);
      // linear in time: early rolls move fast, later ones slow, like a real long run
      await new Promise(function(res){ var t0 = performance.now(), D = 3200;
        (function f(now){ if(!X.alive()) return res(); var t = Math.min(1, (now - t0) / D); at(t); t < 1 ? requestAnimationFrame(f) : res(); })(t0); });
      if(X.alive()) done(); }
    else done();
  };

  /* a day's catch: the 100 fish move into the table, the counts count up */
  S.catch = async function(sl, s, prev, X){
    var ic = u.qa(sl, 'ic'), cn = u.qa(sl, 'cn');
    function place(t){ ic.forEach(function(e, i){ var k = Math.min(1, Math.max(0, t * 1.5 - (i % 37) / 37 * 0.5));
      e.setAttribute('x', u.lerp(+e.dataset.sx, +e.dataset.tx, k)); e.setAttribute('y', u.lerp(+e.dataset.sy, +e.dataset.ty, k)); }); }
    function counts(t){ cn.forEach(function(e){ e.textContent = Math.round(+e.dataset.v * t); }); }
    var box = sl.querySelector('.opbox[data-k="3"]');
    if(!u.fwd(s, prev, X)){ place(s >= 1 ? 1 : 0); counts(s >= 1 ? 1 : 0); u.settle(sl); return; }
    u.settle(sl);
    if(s === 1){ place(0); counts(0); await X.sleep(350); await X.frames(2200, function(t){ place(t); counts(t); }); }
    else if(s === 3){ place(1); counts(1); await X.sleep(500); await u.calc(X, box, [[cn[0], 0], [u.q(sl, 'n100'), 1]]); }
    else { place(1); counts(1); }
  };

  /* table helper: fade rows / cells, mark hot cells */
  function tab(sl, a, fade, hot){
    sl.querySelectorAll('[data-a^="' + a + '-"]').forEach(function(e){ var k = e.dataset.a.slice(a.length + 1);
      e.classList.toggle('fade', fade.indexOf(k) >= 0); e.classList.toggle('hot', hot.indexOf(k) >= 0); });
  }
  var COND = { 0: [[], []], 1: [['rs', 'rt'], ['bl', 'b']], 2: [['bd', 'sd', 'd', 'b', 's', 'n'], ['bl', 'l']], 3: [[], []], 4: [[], []] };
  S.cond = async function(sl, s, prev, X){
    var c = COND[s] || [[], []]; tab(sl, 't', c[0], c[1]); u.settle(sl);
    if(!u.fwd(s, prev, X) || (s !== 1 && s !== 2)) return;
    var box = sl.querySelector('.opbox[data-k="' + s + '"]');
    await X.sleep(500);
    await u.calc(X, box, [[u.q(sl, 't-bl'), 0], [u.q(sl, s === 1 ? 't-b' : 't-l'), 1]]);
  };

  var TURN = { 0: [[], []], 1: [[], ['d', 'n']], 2: [['bl', 'bd', 'sl', 'b', 's', 'n', 'l'], ['sd', 'd']], 3: [['rb', 'rt'], ['sd', 's']], 4: [[], []] };
  S.turn31 = function(sl, s){ var c = TURN[s] || [[], []]; tab(sl, 'z', c[0], c[1]); };

  /* independence: the area model grows; the two grids fill */
  S.indep = async function(sl, s, prev, X){
    var ar = u.q(sl, 'ar'), art = u.q(sl, 'art'), grids = u.qa(sl, 'g100'), SQ = 240;
    function area(t){ var w = SQ * 0.6 * t; ar.setAttribute('width', w); ar.setAttribute('height', w); art.textContent = (0.36 * t * t).toFixed(2); art.style.opacity = t > 0.5 ? 1 : 0; }
    function fill(t){ grids.forEach(function(g){ var n = +g.dataset.n, m = Math.round(n * t);
      g.querySelectorAll('use').forEach(function(f, i){ var on = i < m; f.setAttribute('fill', on ? 'var(--bass)' : 'var(--paper)'); f.setAttribute('stroke', on ? 'var(--bass)' : 'var(--bar)'); }); }); }
    area(s >= 1 ? 1 : 0); fill(s >= 2 ? 1 : 0);
    if(!u.fwd(s, prev, X)) return;
    if(s === 1){ area(0); await X.sleep(400); await X.frames(1200, area); }
    if(s === 2){ fill(0); await X.sleep(400); await X.frames(1800, fill); }
  };
})();
