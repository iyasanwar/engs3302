/* Scenes for Video 3.2. */
(function(){
  var S = EngsAnim.scenes, u = EngsAnim.u;

  /* the tree grows; total probability and Bayes are computed from its branches */
  S.tree = async function(sl, s, prev, X){
    var g = u.q(sl, 'tr'), edges = u.qa(sl, 'tr-e'), labs = sl.querySelectorAll('[data-a="tr"] text[data-a^="tr-p"]');
    var leaves = [0, 1, 2, 3].map(function(i){ return u.q(sl, 'tr-leaf' + i); });
    function grow(t){ g.style.opacity = t > 0 ? 1 : 0;
      edges.forEach(function(e, i){ var k = Math.min(1, Math.max(0, t * 1.4 - (i < 2 ? 0 : 0.4))); e.style.strokeDasharray = 1; e.style.strokeDashoffset = 1 - k; });
      labs.forEach(function(l){ l.style.opacity = t >= 1 ? 1 : 0; }); }
    function mark(on){ [0, 2].forEach(function(i){ leaves[i].setAttribute('stroke', on ? 'var(--warn)' : 'var(--line)'); leaves[i].setAttribute('stroke-width', on ? 4 : 1); }); }
    grow(s >= 1 ? 1 : 0); mark(s >= 2); u.settle(sl);
    if(!u.fwd(s, prev, X)) return;
    if(s === 1){ grow(0); await X.sleep(200); await X.frames(1600, grow); grow(1); }
    else if(s === 2){ await X.sleep(450);
      await u.calc(X, sl.querySelector('.opbox[data-k="2"]'), [[u.q(sl, 'tr-plb'), 0], [u.q(sl, 'tr-pb'), 1], [u.q(sl, 'tr-pls'), 2], [u.q(sl, 'tr-ps'), 3]]); }
    else if(s === 3){ await X.sleep(450);
      await u.calc(X, sl.querySelector('.opbox[data-k="3"]'), [[leaves[0], 0], [leaves[2], 1]]); }
  };

  /* 1000 fish: light ones stay bright, then they are grouped */
  S.rare = async function(sl, s, prev, X){
    var d = u.qa(sl, 'd');
    function state(k, t){ d.forEach(function(e){ var l = e.dataset.l === '1';
      e.style.opacity = (k >= 1 && !l) ? 0.13 : 1;
      var m = (k >= 2 && l) ? (t === undefined ? 1 : t) : 0;
      e.setAttribute('cx', u.lerp(+e.dataset.x, +e.dataset.tx, m)); e.setAttribute('cy', u.lerp(+e.dataset.y, +e.dataset.ty, m)); }); }
    state(s); u.settle(sl);
    if(!u.fwd(s, prev, X)) return;
    if(s === 2){ state(2, 0); await X.sleep(250); await X.frames(1600, function(t){ state(2, t); }); }
    if(s === 3){ await X.sleep(300); await u.calc(X, sl.querySelector('.opbox[data-k="3"]'), [[null, 0], [null, 1]]); }
  };

  /* answers: the three catches as bars */
  S.ans32 = async function(sl, s, prev, X){
    var bars = u.qa(sl, 'pb'), tx = u.qa(sl, 'pt');
    function set(t){ bars.forEach(function(b, i){ var w = +b.dataset.w * t; b.setAttribute('width', w); tx[i].setAttribute('x', 200 + w); tx[i].textContent = (+tx[i].dataset.v * t).toFixed(3); }); }
    set(s >= 3 ? 1 : 0);
    if(u.fwd(s, prev, X) && s === 3){ set(0); await X.sleep(400); await X.frames(1400, set); }
  };
})();
