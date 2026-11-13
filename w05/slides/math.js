/* Maths typesetting for ENGS 3302 decks (aesthetic review A8): inside formulas (.m, .formula, .cwf, .dl .ex) every single-letter
   variable (Latin or Greek, with its hat) is set in Literata italic; operators, digits and words stay in Fira Sans.
   Σ (a sum or the covariance matrix) stays upright. Words such as ln, log, score, constant are never touched.
   Runs once on the slides and on every <template> (the derivation and calculation windows), before the step engine starts. */
(function(){
  var SEL = '.m, .formula, .cwf, .dl .ex, .cwsyms td:first-child';
  var SKIP = 'small, .src, .rule, .note, code, pre, .cwbtn, .dvbtn, svg';
  var L = 'A-Za-zα-ωΑ-ΡΤ-Ωϕϑ';
  var RE = new RegExp('(^|[^' + L + '])([A-Za-zα-ωΑ-ΡΤ-Ωϕϑ][\\u0302\\u0304]?)(?![' + L + '])', 'g');
  function typeset(root){
    root.querySelectorAll(SEL).forEach(function(el){
      if(el.dataset.typeset) return; el.dataset.typeset = 1;
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [], n;
      while((n = w.nextNode())){ var p = n.parentElement; if(p && p.closest(SKIP) && el.contains(p.closest(SKIP))) continue; if(p && p.classList.contains('v')) continue; nodes.push(n); }
      nodes.forEach(function(t){
        var s = t.textContent; RE.lastIndex = 0; if(!RE.test(s)) return; RE.lastIndex = 0;
        var f = document.createDocumentFragment(), last = 0, m;
        while((m = RE.exec(s))){
          var at = m.index + m[1].length;
          if(at > last) f.appendChild(document.createTextNode(s.slice(last, at)));
          var i = document.createElement('i'); i.className = 'v'; i.textContent = m[2]; f.appendChild(i); last = at + m[2].length; RE.lastIndex = last;
        }
        if(last < s.length) f.appendChild(document.createTextNode(s.slice(last)));
        t.parentNode.replaceChild(f, t);
      });
    });
  }
  function all(){ typeset(document); document.querySelectorAll('template').forEach(function(t){ typeset(t.content); }); }
  window.EngsMath = {typeset: typeset};
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
})();
