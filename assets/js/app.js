/* ============================================================
   Amereida — reader app (vanilla, no build step, no network)
   ============================================================ */
(function () {
'use strict';

var B = window.BOOK;
var SPREADS = B.spreads;
var CH = B.chapters;

/* ---------------- tiny helpers ---------------- */
function $(id) { return document.getElementById(id); }
function el(tag, cls, txt) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
}
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function imgPath(which, img) { return 'assets/img/' + which + '/p' + pad2(img) + '.jpg'; }
function byImg(img) { return SPREADS[img - 1]; }
function chapterById(id) {
  for (var i = 0; i < CH.length; i++) if (CH[i].id === id) return CH[i];
  return null;
}
function chapterLabel(s) {
  var c = chapterById(s.chapter);
  if (!c) return { zh: '书前 / Front matter', la: '' };
  return { zh: c.zh || c.es, la: c.en || '' };
}
function escRe(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function hasText(t) { return !!(t && /\S/.test(t)); }

/* ---------------- state ---------------- */
var state = { view: 'shelf', img: 5, lang: 'both', cardIdx: -1 };

/* ============================================================
   SHELF
   ============================================================ */
function renderShelf() {
  var m = B.meta;
  $('heroTitleZh').textContent = m.titleZh;
  $('heroTitleEs').textContent = m.titleEs;
  $('heroTitleEn').textContent = m.titleEn;

  var col = $('heroColophon');
  col.innerHTML = '';
  [
    ['编者', m.editors],
    ['出版社', m.publisher + ' · ' + m.year],
    ['ISBN', m.isbn],
    ['副题', m.subtitleEs],
    ['图版', m.scans + ' 张跨页扫描（含封面、封底）']
  ].forEach(function (r) {
    col.appendChild(el('dt', null, r[0]));
    col.appendChild(el('dd', null, r[1]));
  });

  var stats = { text: 0, photo: 0, units: 0, matched: 0, loose: 0 };
  SPREADS.forEach(function (s) {
    if (s.photoOnly) { stats.photo++; return; }
    stats.text++;
    s.units.forEach(function (u) {
      var o = hasText(u.es) || hasText(u.en), z = hasText(u.zh);
      if (o || z) stats.units++;
      if (o && z) stats.matched++;
    });
    stats.loose += s.loose.length;
  });
  $('statline').innerHTML =
    '<span><b>' + CH.length + '</b>章节</span>' +
    '<span><b>' + SPREADS.length + '</b>跨页图版</span>' +
    '<span><b>' + stats.text + '</b>含正文跨页</span>' +
    '<span><b>' + stats.units + '</b>段落单元</span>' +
    '<span><b>' + Math.round(100 * stats.matched / stats.units) + '%</b>逐段译配率</span>' +
    '<span><b>' + B.photoIndex.length + '</b>条图片索引</span>' +
    '<span><b>' + B.placeNames.length + '</b>条地名词表</span>';

  var grid = $('chapterGrid');
  grid.innerHTML = '';
  CH.forEach(function (c, i) {
    var card = el('button', 'ch-card');
    card.type = 'button';
    card.appendChild(el('div', 'ch-num', 'CH ' + pad2(i + 1) + ' · P. ' + c.page + '–' + c.endPage));
    card.appendChild(el('div', 'ch-zh', c.zh || '—'));
    var la = el('div', 'ch-la');
    la.textContent = c.es + (c.en && c.en !== c.es ? '  ·  ' + c.en : '');
    card.appendChild(la);
    if (c.authorZh || c.authorEs) {
      card.appendChild(el('div', 'ch-au', (c.authorZh || '') + (c.authorEs ? '  ·  ' + c.authorEs : '')));
    }
    var n = c.endImg - c.img + 1;
    var txt = 0;
    for (var k = c.img; k <= c.endImg; k++) if (byImg(k) && !byImg(k).photoOnly) txt++;
    var meta = el('div', 'ch-meta');
    meta.innerHTML = '<span>跨页 <i>' + n + '</i></span><span>文本 <i>' + txt + '</i></span><span>图版 <i>' + (n - txt) + '</i></span>';
    card.appendChild(meta);
    card.addEventListener('click', function () { go('#/read/' + c.img); });
    grid.appendChild(card);
  });

  $('footLeft').innerHTML = '<em>' + esc(m.titleEs) + '</em> — 西语原文 · 英语译文 · 中文译文 三语对照';
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

/* ============================================================
   READER
   ============================================================ */
function cardsOf(s) {
  var zhMode = state.lang === 'zh';
  var out = [];
  s.units.forEach(function (u, i) {
    var o = hasText(u.es) || hasText(u.en);
    if (zhMode ? (o || hasText(u.zh)) : o) out.push({ kind: 'unit', i: i, es: u.es, en: u.en, zh: u.zh });
  });
  s.loose.forEach(function (L, i) {
    out.push({ kind: 'loose', i: i, orig: L.text, lang: L.lang });
  });
  return out;
}

function renderReader() {
  var s = byImg(state.img);
  if (!s) return;
  var lab = chapterLabel(s);
  var c = chapterById(s.chapter);

  var coverish = /^(封面|封底)$/.test(s.pages);
  $('rtChapter').textContent = lab.zh;
  $('rtPages').textContent = '跨页 ' + s.img + ' / ' + SPREADS.length +
    ' · ' + (coverish ? s.pages : '书页 ' + s.pages) + (c ? ' · ' + c.es : '');

  $('plateImage').src = imgPath('full', s.img);
  $('plateImage').alt = '第 ' + s.pages + ' 页跨页扫描';
  $('capText').innerHTML = /^(封面|封底)$/.test(s.pages)
    ? '扫描 <span class="cap-hl">p' + pad2(s.img) + '</span> · ' + esc(s.pages)
    : '扫描 <span class="cap-hl">p' + pad2(s.img) + '</span> · 书页 ' + esc(s.pages) +
      (s.photoOnly ? ' · 图版页' : '');
  $('capHiRes').href = imgPath('full', s.img);

  $('prevSpread').disabled = state.img <= 1;
  $('nextSpread').disabled = state.img >= SPREADS.length;

  var sec = s.section;
  var sn = $('secName');
  sn.innerHTML = '';
  if (sec && (sec.zh || sec.en || sec.es)) {
    if (sec.zh) sn.appendChild(el('b', null, sec.zh));
    sn.appendChild(el('span', null, [sec.es, sec.en].filter(Boolean).join('  ·  ')));
  } else if (c) {
    sn.appendChild(el('b', null, c.zh));
    sn.appendChild(el('span', null, c.es + (c.en !== c.es ? ' · ' + c.en : '')));
  }

  renderParas(s);
  renderStrip(s);
}

function renderParas(s) {
  var box = $('paras');
  box.innerHTML = '';
  var cards = cardsOf(s);

  if (!cards.length) {
    var note = el('div', 'empty-note');
    var isCover = /^(封面|封底)$/.test(s.pages);
    note.appendChild(el('b', null, isCover ? s.pages : (s.photoOnly ? '此跨页为图版页' : '此跨页无正文')));
    note.appendChild(el('div', null, isCover
      ? '原书外观扫描，无正文文本。'
      : (s.photoOnly
        ? '该跨页在文字稿中没有对应文本，请直接查看图版扫描。'
        : '该跨页在文字稿中没有对应文本。')));
    if (s.photoOnly && B.photoIndex.length) {
      var a = el('a', null, '查看图片索引 →');
      a.href = '#/index';
      note.appendChild(el('p', null, ''));
      note.appendChild(a);
    }
    box.appendChild(note);
    return;
  }

  var zhMode = state.lang === 'zh';
  var firstGroup = true;
  cards.forEach(function (cd, idx) {
    if (cd.kind === 'loose' && firstGroup) {
      box.appendChild(el('div', 'group-head',
        zhMode ? '无逐段译文的段落 / SIN TRADUCCIÓN' : '未逐段配译的原文 / SIN PAREO'));
      firstGroup = false;
    }
    var p = el('article', 'para' + (cd.kind === 'loose' ? ' dim' : '') + (zhMode ? ' zhmode' : ''));
    p.tabIndex = 0;
    p.setAttribute('role', 'button');
    var body = el('div', 'body');

    if (zhMode) {
      var z = el('p', 'zh-part');
      z.appendChild(el('span', 'lang zh', '中'));
      if (cd.kind === 'loose') {
        z.appendChild(el('span', 'none', '此段无逐段译文 — 点击查看整跨页对照'));
        body.appendChild(z);
        body.appendChild(el('p', 'ref', cd.lang === 'es' ? 'ES  ' + cd.orig
          : (cd.lang === 'en' ? 'EN  ' + cd.orig : '原文  ' + cd.orig)));
      } else if (hasText(cd.zh)) {
        z.appendChild(document.createTextNode(cd.zh));
        body.appendChild(z);
      } else {
        z.appendChild(el('span', 'none', '此段无逐段译文 — 点击查看整跨页对照'));
        body.appendChild(z);
        if (hasText(cd.es)) body.appendChild(el('p', 'ref', 'ES  ' + cd.es));
      }
    } else if (cd.kind === 'loose') {
      var l = el('p', null);
      l.appendChild(el('span', 'lang ' + (cd.lang === 'en' || cd.lang === 'orig' ? 'en' : ''),
        cd.lang === 'es' ? 'ES' : (cd.lang === 'en' ? 'EN' : '原文')));
      l.appendChild(document.createTextNode(cd.orig));
      body.appendChild(l);
    } else {
      if (state.lang !== 'en' && hasText(cd.es)) {
        var e = el('p', 'es');
        e.appendChild(el('span', 'lang', 'ES'));
        e.appendChild(document.createTextNode(cd.es));
        body.appendChild(e);
      }
      if (state.lang !== 'es' && hasText(cd.en)) {
        var n = el('p', 'en');
        n.appendChild(el('span', 'lang en', s.two ? 'EN' : '原文'));
        n.appendChild(document.createTextNode(cd.en));
        body.appendChild(n);
      }
      if (!hasText(cd.es) && !hasText(cd.en)) return;
    }

    p.appendChild(body);
    p.appendChild(el('span', 'cue',
      zhMode ? '点击查看原文对照 ↗' : (cd.kind === 'loose' ? '查看整跨页对照 ↗' : '点击查看中文 ↗')));
    p.addEventListener('click', function () { openOverlay(idx); });
    p.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openOverlay(idx); }
    });
    box.appendChild(p);
  });
}

function renderStrip(s) {
  var sel = $('chapterSelect');
  if (!sel.options.length) {
    var f = el('option', null, '书前 / Front matter');
    f.value = 'front';
    sel.appendChild(f);
    CH.forEach(function (c) {
      var o = el('option', null, c.zh + '  ·  ' + c.es);
      o.value = c.id;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      var c = chapterById(sel.value);
      go('#/read/' + (c ? c.img : 2));
    });
  }
  sel.value = s.chapter || 'front';

  var lo, hi, title;
  if (s.chapter && s.chapter !== 'front') {
    var c = chapterById(s.chapter);
    lo = c.img; hi = c.endImg;
    title = c.zh + '（书页 ' + c.page + '–' + c.endPage + '）内的跨页';
  } else {
    lo = 1; hi = Math.min(4, SPREADS.length);
    title = '书前页 / Front matter';
  }
  $('stripTitle').textContent = title;

  var strip = $('strip');
  strip.innerHTML = '';
  for (var i = lo; i <= hi; i++) {
    (function (n) {
      var t = el('button', 'th' + (n === state.img ? ' on' : '') + (byImg(n) && byImg(n).photoOnly ? ' photo' : ''));
      t.type = 'button';
      t.title = '扫描 p' + pad2(n) + (byImg(n) ? ' · 书页 ' + byImg(n).pages : '');
      var im = el('img');
      im.loading = 'lazy';
      im.decoding = 'async';
      im.src = imgPath('thumb', n);
      im.alt = t.title;
      t.appendChild(im);
      t.appendChild(el('i', null, byImg(n) ? byImg(n).pages : 'p' + n));
      t.addEventListener('click', function () { go('#/read/' + n); });
      strip.appendChild(t);
    })(i);
  }
  var cur = strip.querySelector('.th.on');
  if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
}

/* ============================================================
   TRANSLATION OVERLAY
   ============================================================ */
function openOverlay(idx) {
  var s = byImg(state.img);
  var cards = cardsOf(s);
  if (!cards.length) return;
  if (idx < 0 || idx >= cards.length) idx = 0;
  state.cardIdx = idx;
  fillOverlay(s, cards, idx);

  $('scrim').hidden = false;
  $('overlay').hidden = false;
  document.body.classList.add('locked');
  $('ovClose').focus();
}

function fillOverlay(s, cards, idx) {
  var cd = cards[idx];
  var c = chapterById(s.chapter);

  $('ovPage').textContent = (/^(封面|封底)$/.test(s.pages) ? s.pages : '书页 ' + s.pages) +
    ' · 扫描 p' + pad2(s.img);
  $('ovSec').textContent = (c ? c.zh + ' / ' + c.es : '') +
    (s.section && s.section.zh ? ' · ' + s.section.zh : '');

  var esBox = $('ovEs'), enBox = $('ovEn');
  esBox.innerHTML = ''; enBox.innerHTML = '';
  var esTxt = cd.kind === 'loose' ? (cd.lang === 'es' ? cd.orig : '') : cd.es;
  var enTxt = cd.kind === 'loose' ? (cd.lang === 'es' ? '' : cd.orig) : cd.en;
  esBox.appendChild(document.createTextNode(esTxt || ''));
  enBox.appendChild(document.createTextNode(enTxt || ''));
  var noOrig = !hasText(esTxt) && !hasText(enTxt);
  esBox.parentNode.hidden = noOrig;
  document.querySelector('.ov-rule').hidden = noOrig;
  document.querySelector('.ov-body').classList.toggle('rev', state.lang === 'zh');

  var zhWrap = $('ovZh').parentNode;
  $('ovZh').innerHTML = '';
  if (hasText(cd.zh)) {
    zhWrap.classList.remove('missing');
    $('ovZh').appendChild(document.createTextNode(cd.zh));
    if (noOrig) { showContext(s, idx); $('ovCtxBtn').textContent = '收起全跨页对照'; }
    else { $('ovContext').hidden = true; $('ovCtxBtn').textContent = '展开全跨页对照'; }
  } else {
    zhWrap.classList.add('missing');
    $('ovZh').textContent = '原稿中这一段没有逐段对应的中文译文。下面是本跨页的中西对照，可按语境定位。';
    showContext(s, idx);
    $('ovCtxBtn').textContent = '收起全跨页对照';
  }

  $('ovIdx').textContent = (idx + 1) + ' / ' + cards.length;
  $('ovPrev').disabled = idx <= 0;
  $('ovNext').disabled = idx >= cards.length - 1;
}

function showContext(s, cardIdx) {
  var box = $('ovContext');
  box.innerHTML = '';
  var cards = cardsOf(s);
  cards.forEach(function (cd, i) {
    var item = el('div', 'ctx-item' + (i === cardIdx ? ' here' : ''));
    item.appendChild(el('div', 'n', pad2(i + 1)));
    var right = el('div');
    if (cd.kind === 'unit') {
      if (hasText(cd.es)) right.appendChild(el('p', 'c-es', 'ES  ' + cd.es));
      if (hasText(cd.en)) right.appendChild(el('p', 'c-en', (s.two ? 'EN  ' : '原文  ') + cd.en));
      right.appendChild(el('p', 'c-zh', hasText(cd.zh) ? cd.zh : '（无逐段译文）'));
    } else {
      right.appendChild(el('p', 'c-es', (cd.lang === 'es' ? 'ES  ' : (cd.lang === 'en' ? 'EN  ' : '原文  ')) + cd.orig));
      right.appendChild(el('p', 'c-zh', '（未配段）'));
    }
    item.appendChild(right);
    box.appendChild(item);
  });
  box.hidden = false;
}

function closeOverlay() {
  $('scrim').hidden = true;
  $('overlay').hidden = true;
  document.body.classList.remove('locked');
}

function stepCard(d) {
  var s = byImg(state.img);
  var cards = cardsOf(s);
  var n = state.cardIdx + d;
  if (n < 0 || n >= cards.length) return;
  state.cardIdx = n;
  fillOverlay(s, cards, n);
  $('overlay').querySelector('.ov-body').scrollTop = 0;
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
function openLightbox() {
  var s = byImg(state.img);
  $('lbImage').src = imgPath('full', s.img);
  $('lbCap').textContent = 'p' + pad2(s.img) + ' · 书页 ' + s.pages + ' · ' + chapterLabel(s).zh;
  $('lightbox').hidden = false;
  $('lbPrev').style.visibility = s.img > 1 ? 'visible' : 'hidden';
  $('lbNext').style.visibility = s.img < SPREADS.length ? 'visible' : 'hidden';
  document.body.classList.add('locked');
}
function closeLightbox() { $('lightbox').hidden = true; document.body.classList.remove('locked'); }
function stepPlate(d) {
  var n = Math.min(SPREADS.length, Math.max(1, state.img + d));
  if (n === state.img) return;
  state.img = n;
  renderReader();
  if (!$('lightbox').hidden) openLightbox();
  if (!$('overlay').hidden) closeOverlay();
  history.replaceState(null, '', '#/read/' + n);
}

/* ============================================================
   PHOTO INDEX / GLOSSARY / SEARCH
   ============================================================ */
function highlight(node, text, q) {
  if (!q) { node.textContent = text; return; }
  var parts = String(text).split(new RegExp('(' + escRe(q) + ')', 'ig'));
  parts.forEach(function (pt) {
    if (!pt) return;
    if (pt.toLowerCase() === q.toLowerCase()) node.appendChild(el('mark', null, pt));
    else node.appendChild(document.createTextNode(pt));
  });
}

function renderIndex(q) {
  q = (q || '').trim();
  var tb = $('idxTable').querySelector('tbody');
  tb.innerHTML = '';
  var shown = 0;
  B.photoIndex.forEach(function (r) {
    var hay = (r.no + ' ' + r.event + ' ' + r.day + ' ' + r.month + ' ' + r.place).toLowerCase();
    if (q && hay.indexOf(q.toLowerCase()) < 0) return;
    var tr = el('tr');
    tr.appendChild(el('td', 'no', r.no));
    var te = el('td'); highlight(te, r.event, q); tr.appendChild(te);
    var mon = (r.month || '').replace(/\s+/g, '');
    tr.appendChild(el('td', 'date', r.day && mon ? mon.replace('月', '') + '月' + parseInt(r.day, 10) + '日' : '—'));
    var tp = el('td', 'place'); highlight(tp, r.place || '—', q); tr.appendChild(tp);
    tb.appendChild(tr);
    shown++;
  });
  $('idxCount').textContent = '共 ' + B.photoIndex.length + ' 条' + (q ? '，匹配 ' + shown + ' 条' : '');
}

function renderGlossary(q) {
  q = (q || '').trim();
  var g = $('glossGrid');
  g.innerHTML = '';
  var shown = 0;
  B.placeNames.forEach(function (r) {
    var hay = (r.es + ' ' + r.zh).toLowerCase();
    if (q && hay.indexOf(q.toLowerCase()) < 0) return;
    var d = el('div', 'gl');
    d.appendChild(el('span', 'gn', r.no));
    d.appendChild(el('span', 'ges', r.es));
    d.appendChild(el('span', 'gzh', r.zh));
    g.appendChild(d);
    shown++;
  });
  $('gloCount').textContent = '共 ' + B.placeNames.length + ' 条' + (q ? '，匹配 ' + shown + ' 条' : '');
}

function runSearch(q) {
  q = (q || '').trim();
  var box = $('results');
  box.innerHTML = '';
  if (q.length < 2) {
    $('searchSum').textContent = '请输入至少 2 个字符。';
    return;
  }
  var re = new RegExp(escRe(q), 'ig');
  var hits = 0;
  for (var si = 0; si < SPREADS.length && hits < 90; si++) {
    var s = SPREADS[si];
    if (s.photoOnly) continue;
    var cards = cardsOf(s);
    for (var ci = 0; ci < cards.length && hits < 90; ci++) {
      var cd = cards[ci];
      var hay = cd.kind === 'loose' ? cd.orig : [cd.es, cd.en, cd.zh].join(' ');
      if (!hay || !re.test(hay)) { re.lastIndex = 0; continue; }
      re.lastIndex = 0;
      var btn = el('button', 'res');
      btn.type = 'button';
      var h = el('div', 'rh');
      h.innerHTML = '<b>p' + pad2(s.img) + '</b><span>书页 ' + s.pages + '</span><span>' +
        esc(chapterLabel(s).zh) + '</span>';
      btn.appendChild(h);
      var snippet = el('div', 'rq');
      var idx = hay.toLowerCase().indexOf(q.toLowerCase());
      var from = Math.max(0, idx - 55);
      var raw = hay.slice(from, from + 200);
      highlight(snippet, (from > 0 ? '…' : '') + raw, q);
      btn.appendChild(snippet);
      (function (img, cardIdx) {
        btn.addEventListener('click', function () {
          state.img = img;
          go('#/read/' + img);
          setTimeout(function () { openOverlay(cardIdx); }, 60);
        });
      })(s.img, ci);
      box.appendChild(btn);
      hits++;
    }
  }
  $('searchSum').textContent = '检索「' + q + '」— 命中 ' + hits + ' 处' + (hits >= 90 ? '（已截断）' : '') + '，点击结果可跳转并打开译文浮层。';
  if (!hits) box.appendChild(el('div', 'empty-note', '没有匹配的段落。'));
}

/* ============================================================
   ROUTER
   ============================================================ */
var VIEWS = ['shelf', 'reader', 'index', 'glossary', 'search'];
function show(view) {
  state.view = view;
  VIEWS.forEach(function (v) {
    $('view-' + v).classList.toggle('on', v === view);
  });
  var map = { shelf: 'shelf', reader: 'reader', index: 'index', glossary: 'index', search: null };
  var active = map[view];
  Array.prototype.forEach.call($('tabs').children, function (b) {
    b.classList.toggle('on', b.dataset.view === active);
  });
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function route() {
  var h = location.hash.replace(/^#\/?/, '');
  var p = h.split('/');
  if (p[0] === 'read') {
    var n = parseInt(p[1], 10);
    if (n >= 1 && n <= SPREADS.length) state.img = n;
    renderReader();
    show('reader');
  } else if (p[0] === 'index') {
    renderIndex($('idxFilter').value);
    show('index');
  } else if (p[0] === 'glossary') {
    renderGlossary($('gloFilter').value);
    show('glossary');
  } else if (p[0] === 'search') {
    runSearch(decodeURIComponent(p.slice(1).join('/').replace(/\+/g, ' ')));
    show('search');
  } else {
    show('shelf');
  }
}

/* ============================================================
   WIRING
   ============================================================ */
function boot() {
  renderShelf();

  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var v = b.dataset.view;
    if (v === 'shelf') go('#/');
    else if (v === 'reader') go('#/read/' + state.img);
    else if (v === 'index') go('#/index');
    else go('#/glossary');
  });
  $('brandBtn').addEventListener('click', function () { go('#/'); });
  $('startReading').addEventListener('click', function () { go('#/read/' + CH[0].img); });

  $('prevSpread').addEventListener('click', function () { stepPlate(-1); });
  $('nextSpread').addEventListener('click', function () { stepPlate(1); });
  $('halfPrev').addEventListener('click', function (e) { e.preventDefault(); stepPlate(-1); });
  $('halfNext').addEventListener('click', function (e) { e.preventDefault(); stepPlate(1); });
  $('zoomBtn').addEventListener('click', openLightbox);
  $('plateImage').addEventListener('click', openLightbox);
  $('jumpText').addEventListener('click', function () {
    var y = document.querySelector('.text-pane').getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.lang-toggle button'), function (b) {
    b.addEventListener('click', function () {
      state.lang = b.dataset.lang;
      document.querySelectorAll('.lang-toggle button').forEach(function (x) { x.classList.toggle('on', x === b); });
      renderParas(byImg(state.img));
    });
  });

  $('allPairsBtn').addEventListener('click', function () {
    var s = byImg(state.img);
    if (!cardsOf(s).length) return;
    openOverlay(0);
    showContext(s, -1);
    $('ovCtxBtn').textContent = '收起全跨页对照';
  });

  $('ovClose').addEventListener('click', closeOverlay);
  $('scrim').addEventListener('click', closeOverlay);
  $('ovPrev').addEventListener('click', function () { stepCard(-1); });
  $('ovNext').addEventListener('click', function () { stepCard(1); });
  $('ovCtxBtn').addEventListener('click', function () {
    var box = $('ovContext');
    if (box.hidden) { showContext(byImg(state.img), state.cardIdx); $('ovCtxBtn').textContent = '收起全跨页对照'; }
    else { box.hidden = true; $('ovCtxBtn').textContent = '展开全跨页对照'; }
  });

  $('lbClose').addEventListener('click', closeLightbox);
  $('lbPrev').addEventListener('click', function () { stepPlate(-1); });
  $('lbNext').addEventListener('click', function () { stepPlate(1); });
  $('lightbox').addEventListener('click', function (e) { if (e.target === $('lightbox')) closeLightbox(); });

  var hero = document.querySelector('.hero-cover img');
  if (hero) hero.addEventListener('click', function () {
    state.img = 1; renderReader(); show('reader'); openLightbox();
  });

  $('idxFilter').addEventListener('input', function () { renderIndex(this.value); });
  $('gloFilter').addEventListener('input', function () { renderGlossary(this.value); });
  $('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = $('searchInput').value.trim();
    if (q) go('#/search/' + encodeURIComponent(q));
  });

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && t.matches && t.matches('input,select,textarea')) return;
    if (!$('lightbox').hidden) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') stepPlate(-1);
      else if (e.key === 'ArrowRight') stepPlate(1);
      return;
    }
    if (!$('overlay').hidden) {
      if (e.key === 'Escape') closeOverlay();
      else if (e.key === 'ArrowLeft') stepCard(-1);
      else if (e.key === 'ArrowRight') stepCard(1);
      return;
    }
    if (state.view !== 'reader') return;
    if (e.key === 'ArrowLeft') stepPlate(-1);
    else if (e.key === 'ArrowRight') stepPlate(1);
  });

  window.addEventListener('hashchange', route);
  route();

  if (!location.hash) state.img = CH[0].img;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
