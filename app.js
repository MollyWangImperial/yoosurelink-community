(function () {
  var TOKENS = ["home", "join", "foryou", "events", "event", "bookclub", "plans"];
  var LABELS = { home: "首页", join: "免费加入", foryou: "为你推荐", events: "活动站", event: "活动详情", bookclub: "读书会专栏", plans: "会员与合作" };
  var current = null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function viewEl(t) { return document.getElementById('view-' + t); }

  function resolve(hash) {
    var token = (hash || '').replace(/^#/, '');
    if (TOKENS.indexOf(token) >= 0) return { view: token, anchor: null };
    if (token) {
      var el = document.getElementById(token);
      if (el) {
        var sec = el.closest('.view');
        if (sec) return { view: sec.dataset.view, anchor: el };
      }
    }
    return { view: 'home', anchor: null };
  }

  function show(target) {
    var next = viewEl(target.view);
    if (!next) return;
    var scrollTo = function (smooth) {
      if (target.anchor) target.anchor.scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'auto', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'auto' });
    };
    if (current === target.view) { scrollTo(true); return; }
    var prev = current ? viewEl(current) : null;
    document.title = 'yoosurelink · ' + (LABELS[target.view] || '');
    var reveal = function () {
      if (prev) { prev.classList.remove('leaving'); prev.hidden = true; }
      next.hidden = false;
      next.classList.remove('entering');
      void next.offsetWidth;
      if (!reduce) next.classList.add('entering');
      current = target.view;
      scrollTo();
      next.addEventListener('animationend', function h() { next.classList.remove('entering'); next.removeEventListener('animationend', h); });
    };
    if (prev && !reduce) {
      prev.classList.add('leaving');
      var done = false;
      var finish = function () { if (!done) { done = true; reveal(); } };
      prev.addEventListener('animationend', finish, { once: true });
      setTimeout(finish, 240);
    } else {
      reveal();
    }
  }

  function go(hash, push) {
    var target = resolve(hash);
    var id = '#' + (target.anchor ? target.anchor.id : target.view);
    try {
      if (location.hash !== id) {
        if (push) history.pushState(null, '', id); else history.replaceState(null, '', id);
      }
    } catch (e) {}
    show(target);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    go(href, true);
  });
  window.addEventListener('popstate', function () { go(location.hash); });
  window.addEventListener('hashchange', function () { go(location.hash); });

  // ---- small interactions carried over from the prototype ----
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  // pill buttons inside the survey and event filters toggle on and off
  var pills = document.querySelectorAll('#view-join section button, #view-events header button');
  Array.prototype.forEach.call(pills, function (b) {
    b.type = 'button';
    b.classList.add('chip');
    var on = /background: #0F4C5C/.test(b.getAttribute('style') || '');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    var group = chip.closest('#view-events header');
    if (group) {
      Array.prototype.forEach.call(group.querySelectorAll('.chip'), function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
    } else {
      chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    }
  });

  // checkbox and radio cards in the survey highlight when chosen
  var choices = document.querySelectorAll('#view-join label');
  function syncChoices() {
    Array.prototype.forEach.call(choices, function (l) {
      var input = l.querySelector('input[type=checkbox], input[type=radio]');
      if (input) l.classList.toggle('is-on', input.checked);
    });
  }
  Array.prototype.forEach.call(choices, function (l) { if (l.querySelector('input[type=checkbox], input[type=radio]')) l.classList.add('choice'); });
  document.addEventListener('change', function (e) { if (e.target.closest('#view-join')) syncChoices(); });
  syncChoices();

  // buttons that need an account or backend explain themselves instead of doing nothing
  var soon = {
    '中文 · EN': 'English 版正在准备中，敬请期待',
    '加载更多': '更多活动即将上线',
    '关注主理人': '已关注，主理人开新活动时会通知你',
    '加入候补 / 收藏': '已加入候补，有名额空出会通知你',
    '← 上一步': '这是问卷的第 2 步，第 1 步会在正式版开放',
    '清除': '筛选已清除'
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.classList.contains('chip') || b.closest('.bc-form') || b.closest('.pay-dialog')) return;
    var label = b.textContent.trim();
    if (label === '清除') {
      Array.prototype.forEach.call(b.closest('aside').querySelectorAll('input'), function (i) { i.checked = false; });
    }
    if (soon[label]) toast(soon[label]);
  });
  document.addEventListener('submit', function (e) { if (!e.target.closest('.bc-form')) e.preventDefault(); });

  // ---- 读书会 sign-up and payment ----
  var form = document.getElementById('bc-form');
  var PLAN_LABEL = { single: '单期体验', season: '整季 8 期', member: '会员整季' };
  var PAY_LABEL = { wechat: '微信支付', alipay: '支付宝', bank: '银行转账', intl: '海外支付' };

  function selected(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el : null; }

  function updateTotal() {
    var plan = selected('plan');
    document.getElementById('bc-total').textContent = '¥' + plan.dataset.price;
    var note = PLAN_LABEL[plan.value];
    var single = plan.value === 'single';
    document.getElementById('bc-session-field').hidden = !single;
    if (single) note = form.session.options[form.session.selectedIndex].text.split(' · ').slice(0, 2).join(' · ');
    document.getElementById('bc-total-note').textContent = note;
  }
  form.addEventListener('change', updateTotal);
  updateTotal();

  function howTo(pay, amount, no) {
    if (pay === 'wechat' || pay === 'alipay') {
      return '<div class="pay-qr">[' + PAY_LABEL[pay] + '收款码]</div><span>打开' + (pay === 'wechat' ? '微信' : '支付宝') + '扫一扫，付款 ' + amount + '，备注 ' + no + '</span>';
    }
    if (pay === 'bank') {
      return '<dl class="pay-bank"><div><dt>户名</dt><dd>[收款单位名称]</dd></div><div><dt>开户行</dt><dd>[开户银行及支行]</dd></div><div><dt>账号</dt><dd>[银行账号]</dd></div><div><dt>转账备注</dt><dd>' + no + '</dd></div></dl><span>到账确认需要 1 到 3 个工作日，需要对公发票请告诉助教。</span>';
    }
    return '<div class="pay-qr">[PayPal 或信用卡付款链接]</div><span>支持 PayPal 与 Visa / Mastercard，按付款当日汇率结算。付款说明里请填写 ' + no + '</span>';
  }

  var modal = document.getElementById('pay-modal');
  var lastFocus = null;
  function openModal() { lastFocus = document.activeElement; modal.hidden = false; document.getElementById('pay-close').focus(); }
  function closeModal() { modal.hidden = true; if (lastFocus) lastFocus.focus(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = document.getElementById('bc-error');
    var missing = [];
    ['name', 'wechat', 'email'].forEach(function (k) {
      var el = form.elements[k];
      var bad = !el.value.trim() || (k === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad) missing.push(el.closest('.bc-field').querySelector('label').textContent);
    });
    if (missing.length) { err.textContent = '请填写正确的' + missing.join('、'); err.hidden = false; return; }
    if (!document.getElementById('bc-agree').checked) { err.textContent = '请先阅读并同意退款与发票说明'; err.hidden = false; return; }
    err.hidden = true;

    var plan = selected('plan'), pay = selected('pay').value;
    var amount = '¥' + plan.dataset.price;
    var no = 'YSL-BC-' + Date.now().toString(36).toUpperCase().slice(-6);
    var item = document.getElementById('bc-total-note').textContent;
    document.getElementById('pay-no').textContent = no;
    document.getElementById('pay-no-2').textContent = no;
    document.getElementById('pay-item').textContent = item;
    document.getElementById('pay-amount').textContent = amount;
    document.getElementById('pay-channel').textContent = PAY_LABEL[pay];
    document.getElementById('pay-howto').innerHTML = howTo(pay, amount, no);
    document.getElementById('pay-step-1').hidden = false;
    document.getElementById('pay-step-2').hidden = true;
    try {
      var list = JSON.parse(localStorage.getItem('ysl.bookclub.orders') || '[]');
      list.push({ no: no, item: item, amount: amount, pay: pay, at: new Date().toISOString() });
      localStorage.setItem('ysl.bookclub.orders', JSON.stringify(list));
    } catch (x) {}
    openModal();
  });

  document.getElementById('pay-done').addEventListener('click', function () {
    document.getElementById('pay-step-1').hidden = true;
    document.getElementById('pay-step-2').hidden = false;
    document.getElementById('pay-finish').focus();
  });
  document.getElementById('pay-finish').addEventListener('click', closeModal);
  document.getElementById('pay-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  go(location.hash);
})();
