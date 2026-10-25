/* Scenes for Video 3.5. */
(function(){
  var S = EngsAnim.scenes, u = EngsAnim.u;
  function geo(sl){ var g = JSON.parse(u.q(sl, 'geo').dataset.geo);
    g.X = function(x){ return g.px0 + (x - g.xa) / (g.xb - g.xa) * g.pw; }; g.Y = function(y){ return g.py0 + g.ph - y / g.ymx * g.ph; }; return g; }
  function curveD(g, m, s, a, b, close){ a = a === undefined ? g.xa : a; b = b === undefined ? g.xb : b; var d = '';
    for(var i = 0; i <= 240; i++){ var x = a + (b - a) * i / 240; d += (i ? ' L' : 'M') + g.X(x).toFixed(1) + ',' + g.Y(u.pdf(x, m, s)).toFixed(1); }
    return close ? d + ' L' + g.X(b).toFixed(1) + ',' + g.Y(0) + ' L' + g.X(a).toFixed(1) + ',' + g.Y(0) + ' Z' : d; }

  /* centre and spread: mu moves the curve, sigma widens and lowers it; then the 68 / 95 areas */
  S.ms = async function(sl, s, prev, X){
    var g = geo(sl), nc = u.q(sl, 'nc'), mul = u.q(sl, 'mul'), b1 = u.q(sl, 'b1'), b2 = u.q(sl, 'b2'), b1t = u.q(sl, 'b1t'), b2t = u.q(sl, 'b2t');
    var rm = u.q(sl, 'rm'), rs = u.q(sl, 'rs'), rp = u.q(sl, 'rp'), ra = u.q(sl, 'ra');
    function set(m, sd){ nc.setAttribute('d', curveD(g, m, sd)); mul.setAttribute('x1', g.X(m)); mul.setAttribute('x2', g.X(m)); mul.setAttribute('y2', g.Y(u.pdf(m, m, sd)));
      rm.textContent = m.toFixed(1); rs.textContent = sd.toFixed(1); rp.textContent = u.pdf(m, m, sd).toFixed(3); ra.textContent = '1.000'; }
    function bands(t1, t2){
      b1.setAttribute('d', t1 > 0 ? curveD(g, 7, 1, 7 - t1, 7 + t1, true) : ''); b1.setAttribute('opacity', t1 > 0 ? 1 : 0);
      b2.setAttribute('d', t2 > 0 ? curveD(g, 7, 1, 7 - 2 * t2, 7 + 2 * t2, true) : ''); b2.setAttribute('opacity', t2 > 0 ? 1 : 0);
      b1t.style.opacity = t1 >= 1 ? 1 : 0; b2t.style.opacity = t2 >= 1 ? 1 : 0;
      if(t1 > 0) b1t.textContent = (u.cdf(7 + t1, 7, 1) - u.cdf(7 - t1, 7, 1)).toFixed(3); }
    set(7, 1); bands(s >= 4 ? 1 : 0, s >= 4 ? 1 : 0);
    if(!u.fwd(s, prev, X)) return;
    if(s === 1){ await X.sleep(300); await X.frames(1100, function(t){ set(7 - 3 * t, 1); }); if(!X.alive()) return; await X.sleep(500);
      await X.frames(1100, function(t){ set(4 + 3 * t, 1); }); }
    if(s === 2){ var seq = [[1, 2], [2, 0.5], [0.5, 1]];
      for(var i = 0; i < seq.length; i++){ await X.sleep(i ? 500 : 300); if(!X.alive()) return; var a = seq[i][0], b = seq[i][1];
        await X.frames(1000, function(t){ set(7, a + (b - a) * t); }); } }
    if(s === 4){ bands(0, 0); await X.sleep(300); await X.frames(1000, function(t){ bands(t, 0); }); if(!X.alive()) return; await X.sleep(300); await X.frames(1000, function(t){ bands(1, t); }); }
  };

  /* a fish at 6: the two heights are computed, then compared */
  S.fish6 = async function(sl, s, prev, X){
    var hb = u.q(sl, 'hb'), hs = u.q(sl, 'hs'), hbt = u.q(sl, 'hbt'), hst = u.q(sl, 'hst');
    var lines = [[hb, hbt], [hs, hst]].map(function(p){ var l = p[0]; if(!l.dataset.y2){ l.dataset.y1 = l.getAttribute('y1'); l.dataset.y2 = l.getAttribute('y2'); }
      return function(t){ l.setAttribute('y2', u.lerp(+l.dataset.y1, +l.dataset.y2, t)); l.style.opacity = t > 0 ? 1 : 0; p[1].style.opacity = t >= 1 ? 1 : 0; }; });
    lines[0](s >= 1 ? 1 : 0); lines[1](s >= 2 ? 1 : 0); u.settle(sl);
    if(!u.fwd(s, prev, X)) return;
    if(s === 1 || s === 2){ lines[s - 1](0); await X.sleep(400); await u.calc(X, sl.querySelector('.opbox[data-k="' + s + '"]'), [[null, 0], [null, 1]]);
      if(!X.alive()) return; await X.frames(900, lines[s - 1]); }
    if(s === 3){ await X.sleep(400); await u.calc(X, sl.querySelector('.opbox[data-k="3"]'), [[hbt, 0], [hst, 1]]); }
  };

  /* fitting: the curve is drawn from mu and sigma; then the interval is compared */
  S.fit = async function(sl, s, prev, X){
    var c = u.q(sl, 'gfit'), L = c.getTotalLength(), gm = u.q(sl, 'gm'), gd = u.q(sl, 'gd');
    c.style.strokeDasharray = L; var draw = function(t){ c.style.strokeDashoffset = L * (1 - t); };
    var fm = +gm.textContent || 0.579, fd = +gd.textContent || 0.602; gm.dataset.v = gm.dataset.v || fm; gd.dataset.v = gd.dataset.v || fd;
    draw(s >= 1 ? 1 : 0); gm.textContent = (+gm.dataset.v).toFixed(3); gd.textContent = (+gd.dataset.v).toFixed(3);
    if(!u.fwd(s, prev, X)) return;
    if(s === 1){ draw(0); await X.sleep(500); await X.frames(1500, draw); }
    if(s === 2){ await X.sleep(400); await X.frames(1000, function(t){ gm.textContent = (+gm.dataset.v * t).toFixed(3); gd.textContent = (+gd.dataset.v * t).toFixed(3); }); }
  };

  /* compare densities: strips around 6 under both curves get thinner */
  S.cmp = async function(sl, s, prev, X){
    var g = geo(sl), sb = u.q(sl, 'sb'), ss = u.q(sl, 'ss'), w6 = u.q(sl, 'w6'), WS = [1, 0.1, 0.01];
    function set(w){ sb.setAttribute('d', curveD(g, 7, 1, 6 - w / 2, 6 + w / 2, true)); ss.setAttribute('d', curveD(g, 4, 1, 6 - w / 2, 6 + w / 2, true)); w6.textContent = String(+w.toPrecision(2)); }
    var k = Math.min(s, 2); set(WS[k]);
    if(!u.fwd(s, prev, X) || s > 2) return;
    var w0 = WS[prev], w1 = WS[s]; await X.sleep(300);
    await X.frames(1200, function(t){ set(Math.exp(Math.log(w0) + (Math.log(w1) - Math.log(w0)) * t)); });
  };
})();
