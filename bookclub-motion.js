(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var view = document.getElementById('view-bookclub');

  // ticker of the season's books, placed right under the hero
  var BOOKS = [
    ['小妇人', '1868'], ['玩偶之家', '1879'], ['一间自己的房间', '1929'], ['呼兰河传', '1940'], ['红玫瑰与白玫瑰', '1944'],
    ['女性的奥秘', '1963'], ['为什么没有伟大的女艺术家？', '1971'], ['使女的故事', '1985'], ['激情的政治', '2000'],
    ['我的天才女友', '2011'], ['爱说教的男人', '2014'], ['82年生的金智英', '2016'], ['你当像鸟飞往你的山', '2018'],
    ['看不见的女性', '2019'], ['乳与卵', '2019'], ['始于极限', '2021']
  ];
  var ticker = document.createElement('div');
  ticker.className = 'bc-ticker';
  ticker.setAttribute('aria-hidden', 'true');
  var items = BOOKS.map(function (b) { return '<span class="bc-ticker-item"><b>《' + b[0] + '》</b>' + b[1] + ' 年</span>'; }).join('');
  ticker.innerHTML = '<div class="bc-ticker-track">' + items + items + '</div>';
  view.querySelector('.bc-hero').after(ticker);

  // key phrase in the introduction
  var intro = view.querySelector('#bc-intro .bc-head p');
  intro.innerHTML = intro.innerHTML.replace('问题换了样子，却从未真正消失', '<span class="mark">问题换了样子，却从未真正消失</span>');

  // reveal on scroll, staggered within each group
  var groups = ['.bc-head', '.bc-act', '.bc-cards', '.bc-profile', '.bc-syllabus', '.bc-extra', '.bc-flow', '.bc-plans', '.bc-pay', '.bc-policy', '.bc-faq'];
  var targets = [];
  groups.forEach(function (sel) {
    Array.prototype.forEach.call(view.querySelectorAll(sel), function (g) {
      var kids = sel === '.bc-head' || sel === '.bc-act' ? [g] :Array.prototype.filter.call(g.children, function (c) { return c.tagName !== 'LEGEND' && !c.classList.contains('bc-head'); });
      kids.forEach(function (k, i) { k.classList.add('rv'); k.style.setProperty('--d', Math.min(i, 6) * 0.09 + 's'); targets.push(k); });
    });
  });
  targets.push(view.querySelector('.mark'), view.querySelector('.bc-mentor'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('on'); });
  }

  // syllabus tour: the marker eases from session to session; a click holds it there
  var rows = Array.prototype.slice.call(view.querySelectorAll('.bc-syllabus li'));
  var held = -1, cur = 0;
  function lightRow(i) { rows.forEach(function (r, k) { r.classList.toggle('lit', k === i); r.classList.toggle('held', k === i && held === i); }); }
  rows.forEach(function (r, i) {
    r.addEventListener('click', function () { held = held === i ? -1 : i; cur = i; lightRow(i); });
  });
  lightRow(0);

  // bookshelf: one book leans out at a time with its session date; pointing at a book takes over, clicking it jumps to that session
  var spines = Array.prototype.slice.call(view.querySelectorAll('.bc-shelf .spine'));
  var shelf = view.querySelector('.bc-shelf');
  shelf.removeAttribute('aria-hidden');
  var lean = 0, shelfHover = false;
  spines.forEach(function (s, n) {
    var i = s.dataset.row ? parseInt(s.dataset.row, 10) : n;
    var meta = rows[i] ? rows[i].querySelector('.bc-session-meta') : null;
    var no = meta ? meta.querySelector('.no').textContent : '';
    var date = meta ? meta.querySelector('.date').textContent : '';
    s.dataset.tip = no + ' · ' + date;
    s.setAttribute('role', 'button');
    s.setAttribute('tabindex', '0');
    s.setAttribute('aria-label', s.textContent + '，' + no + '，' + date);
    s.addEventListener('mouseenter', function () { shelfHover = true; leanTo(n); });
    s.addEventListener('mouseleave', function () { shelfHover = false; });
    s.addEventListener('focus', function () { leanTo(n); });
    var go = function () {
      held = i; cur = i; lightRow(i);
      rows[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    };
    s.addEventListener('click', go);
    s.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  function leanTo(i) { lean = i; spines.forEach(function (s, k) { s.classList.toggle('lean', k === i); }); }

  // session flow: each step warms in turn while the thread advances
  var steps = Array.prototype.slice.call(view.querySelectorAll('.bc-flow > div'));
  var flow = view.querySelector('.bc-flow');
  var step = 0;
  function lightStep(i) { steps.forEach(function (s, k) { s.classList.toggle('lit', k === i); }); flow.style.setProperty('--p', (i + 1) / steps.length); }
  lightStep(0);

  if (!reduce) {
    setTimeout(function () { leanTo(0); }, 1400);
    setInterval(function () { if (!shelfHover) leanTo((lean + 1) % spines.length); }, 2800);
    setInterval(function () { if (held < 0) { cur = (cur + 1) % rows.length; lightRow(cur); } }, 3400);
    setInterval(function () { step = (step + 1) % steps.length; lightStep(step); }, 2600);
  }

  // price eases to the new amount when the plan changes
  var total = document.getElementById('bc-total');
  var shown = parseInt(total.textContent.replace(/\D/g, ''), 10) || 0;
  document.getElementById('bc-form').addEventListener('change', function () {
    var target = parseInt(total.textContent.replace(/\D/g, ''), 10) || 0;
    if (reduce || target === shown) { shown = target; return; }
    var from = shown, t0 = performance.now(), dur = 600;
    shown = target;
    (function frame(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      total.textContent = '¥' + Math.round(from + (target - from) * e);
      if (k < 1) requestAnimationFrame(frame);
    })(t0);
  });
})();
