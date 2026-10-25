/* Scenes for Video 3.3. */
(function(){
  var S = EngsAnim.scenes, u = EngsAnim.u;

  /* the net: one order, all orders by value, then the PMF bars */
  S.net = async function(sl, s, prev, X){
    var ords = u.qa(sl, 'ord'), bars = u.qa(sl, 'pbar'), vals = u.qa(sl, 'pval'), cols = u.qa(sl, 'col2');
    var first = sl.querySelector('[data-first="1"]');
    function bar(t){ bars.forEach(function(b, i){ var h = +b.dataset.h * t, base = +b.getAttribute('y') + +b.getAttribute('height');
      b.setAttribute('y', base - h); b.setAttribute('height', h); vals[i].style.opacity = t; vals[i].setAttribute('y', base - h - 12); vals[i].textContent = (+vals[i].dataset.v * t).toFixed(3); }); }
    function state(k){
      ords.forEach(function(o){ o.style.transition = 'opacity 400ms'; o.style.opacity = k === 0 ? 0 : k === 1 ? (o === first ? 1 : 0) : k === 2 ? 1 : 0.12; });
      cols.forEach(function(c, i){ c.setAttribute('opacity', k === 2 && i === 2 ? 1 : 0); });
      bar(k >= 3 ? 1 : 0); u.settle(sl);
    }
    state(s);
    if(!u.fwd(s, prev, X)) return;
    if(s === 1){ await X.sleep(500); await u.calc(X, sl.querySelector('.opbox[data-k="1"]'), [[u.q(sl, 'l0'), 0], [u.q(sl, 'l1'), 1], [u.q(sl, 'l2'), 2]]); }
    if(s === 2){ await X.sleep(500); await u.calc(X, sl.querySelector('.opbox[data-k="2"]'), [[null, 0], [first.querySelector('[data-a="ordp"]'), 1]]); }
    if(s === 3){ bar(0); await X.sleep(450); await X.frames(1300, bar); }
  };

  /* stack the PMF to 1, then the mistake to 0.52 */
  function stackAnim(sl, a, sumEl, total){
    var r = u.qa(sl, a).sort(function(x, y){ return +x.dataset.k - +y.dataset.k; }), tx = u.qa(sl, a + 't');
    r.forEach(function(e){ if(!e.dataset.y){ e.dataset.y = e.getAttribute('y'); e.dataset.hh = e.getAttribute('height'); } });
    return function(t){ var n = r.length, acc = 0;
      r.forEach(function(e, i){ var lt = Math.min(1, Math.max(0, t * n - i)), h = +e.dataset.hh, y = +e.dataset.y;
        e.setAttribute('height', h * lt); e.setAttribute('y', y + h * (1 - lt)); tx[i].style.opacity = lt >= 1 ? 1 : 0; acc += lt; });
      sumEl.textContent = (total * Math.min(1, t)).toFixed(3); };
  }
  S.stack = async function(sl, s, prev, X){
    var a = stackAnim(sl, 'st', u.q(sl, 'sum1'), 1), b = stackAnim(sl, 'wr', u.q(sl, 'sum2'), 0.52);
    a(s >= 1 ? 1 : 0); b(s >= 2 ? 1 : 0);
    if(!u.fwd(s, prev, X)) return;
    if(s === 1){ a(0); await X.sleep(300); await X.frames(1800, a); }
    if(s === 2){ b(0); await X.sleep(300); await X.frames(1800, b); }
  };

  /* expected value: products add up; the balance point; many nets */
  S.ev = async function(sl, s, prev, X){
    var ful = u.q(sl, 'fulcrum'), path = u.q(sl, 'simp'), L = path.getTotalLength(), sn = u.q(sl, 'sn'), sv = u.q(sl, 'sv');
    path.style.strokeDasharray = L;
    function slide(t){ ful.setAttribute('transform', 'translate(' + (-360 * (1 - t)) + ',0)'); }
    function sim(t){ path.style.strokeDashoffset = L * (1 - t); var p = path.getPointAtLength(L * t);
      sn.textContent = Math.round(Math.pow(10, (p.x - 70) / 360 * 5)).toLocaleString('en-US'); sv.textContent = (1 + (16 + 170 - p.y) / 170 * 2).toFixed(3); }
    slide(1); sim(1); sn.textContent = '100,000'; sv.textContent = '1.798'; u.settle(sl);
    if(!u.fwd(s, prev, X)) return;
    if(s === 1){ await X.sleep(600); var pr = u.qa(sl, 'prod'); await u.calc(X, sl.querySelector('.opbox[data-k="1"]'), [[pr[0], 0], [pr[1], 1], [pr[2], 2], [pr[3], 3]]); }
    if(s === 2){ slide(0); await X.sleep(300); await X.frames(1400, slide); }
    if(s === 3){ sim(0); await X.sleep(300); await X.frames(2600, sim); if(X.alive()){ sn.textContent = '100,000'; sv.textContent = '1.798'; } }
  };
})();
