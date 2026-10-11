/* ROLE Medya demo: nav, reveal, autoplay-in-view loops, hover previews, filters, lightbox, brief form. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = window.WORKS || [];
  const byId = Object.fromEntries(W.map(w => [w.id, w]));

  /* mobile menu */
  const burger = $('.burger');
  const setMenu = open => { document.body.classList.toggle('menu-open', open); burger && burger.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : ''; };
  burger && burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('.overlay a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* reveal */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* hero + section loops: play only while visible, never under reduced motion */
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting && !reduce) { v.play().catch(() => {}); } else { v.pause(); }
  }), { threshold: .25 });
  $$('video[data-autoplay]').forEach(v => { v.muted = true; v.playsInline = true; if (!reduce) vio.observe(v); });

  /* work cards: hover (desktop) or in-view (touch) preview loop */
  const touch = matchMedia('(hover: none)').matches;
  const cardIO = new IntersectionObserver(es => es.forEach(e => {
    const c = e.target, v = $('video', c);
    if (!v) return;
    if (e.isIntersecting && e.intersectionRatio > .6) { if (!v.src) v.src = v.dataset.src; v.play().then(() => c.classList.add('playing')).catch(() => {}); }
    else { v.pause(); c.classList.remove('playing'); }
  }), { threshold: [0, .6, 1] });
  $$('.work').forEach(c => {
    const v = $('video', c);
    if (!v || reduce) return;
    if (touch) { cardIO.observe(c); return; }
    c.addEventListener('mouseenter', () => { if (!v.src) v.src = v.dataset.src; v.currentTime = 0; v.play().then(() => c.classList.add('playing')).catch(() => {}); });
    c.addEventListener('mouseleave', () => { v.pause(); c.classList.remove('playing'); });
  });

  /* filters */
  const fbtns = $$('[data-filter]');
  const applyFilter = k => {
    fbtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === k)));
    $$('.grid-works .work').forEach(c => c.classList.toggle('hide', k !== 'all' && c.dataset.sector !== k));
  };
  fbtns.forEach(b => b.addEventListener('click', () => { applyFilter(b.dataset.filter); history.replaceState(null, '', b.dataset.filter === 'all' ? location.pathname : '?s=' + b.dataset.filter); }));
  const qs = new URLSearchParams(location.search).get('s');
  if (fbtns.length && qs && fbtns.some(b => b.dataset.filter === qs)) applyFilter(qs);

  /* lightbox */
  const lb = $('.lb');
  let list = [], idx = 0, lastFocus = null;
  const show = i => {
    idx = (i + list.length) % list.length;
    const w = byId[list[idx]];
    const v = $('video', lb);
    v.poster = 'media/' + w.id + '.webp';
    v.src = 'media/' + w.id + '.mp4';
    v.play().catch(() => {});
    $('.cl', lb).textContent = w.client + ' · ' + w.project;
    $('h2', lb).textContent = w.title;
    $('.ds', lb).textContent = w.desc;
    const a = $('.ig', lb); a.hidden = !w.url; if (w.url) a.href = w.url;
    $('.pr', lb).textContent = (idx + 1) + ' / ' + list.length;
  };
  const openLb = id => {
    if (!lb) return;
    list = $$('.work:not(.hide)').map(c => c.dataset.work).filter((x, i, a) => x && a.indexOf(x) === i);
    if (!list.includes(id)) list = [id];
    lastFocus = document.activeElement;
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    show(list.indexOf(id));
    $('.x', lb).focus();
  };
  const closeLb = () => {
    if (!lb || !lb.classList.contains('open')) return;
    const v = $('video', lb); v.pause(); v.removeAttribute('src'); v.load();
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
    lastFocus && lastFocus.focus();
  };
  $$('.work[data-work]').forEach(c => c.addEventListener('click', () => openLb(c.dataset.work)));
  if (lb) {
    $('.x', lb).addEventListener('click', closeLb);
    $('[data-prev]', lb).addEventListener('click', () => show(idx - 1));
    $('[data-next]', lb).addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'Tab') { const f = $$('button,a[href],video', lb); const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    });
    const hash = location.hash.slice(1); if (byId[hash]) openLb(hash);
  }

  /* post preview */
  const pv = $('.pv');
  if (pv) {
    let back = null;
    const closePv = () => { pv.classList.remove('open'); pv.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; back && back.focus(); };
    $$('[data-post]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); back = a;
      const img = $('img', pv); img.src = a.getAttribute('href'); img.alt = $('img', a).alt;
      pv.classList.add('open'); pv.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; $('.x', pv).focus();
    }));
    $('.x', pv).addEventListener('click', closePv);
    pv.addEventListener('click', e => { if (e.target === pv) closePv(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && pv.classList.contains('open')) closePv(); });
  }

  /* brief form: validate, build text, copy, open Instagram DM */
  const form = $('form[data-brief]');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach(el => {
        const f = el.closest('.fld');
        const bad = !el.value.trim() || (el.type === 'tel' && el.value.replace(/\D/g, '').length < 10);
        f.classList.toggle('invalid', bad); if (bad && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;
      const val = id => ($('#' + id, form).value || '').trim();
      const svc = $$('input[name=svc]:checked', form).map(i => i.value);
      const lines = ['Merhaba ROLE Medya, yeni bir proje için brief:', '', `Ad soyad: ${val('b-name')}`, `Firma: ${val('b-firm')}`, `Telefon: ${val('b-tel')}`, `Sektör: ${val('b-sector')}`,
        svc.length ? `İhtiyaç: ${svc.join(', ')}` : '', val('b-when') ? `Zaman: ${val('b-when')}` : '', val('b-budget') ? `Bütçe: ${val('b-budget')}` : '', '', val('b-msg')].filter((l, i, a) => l !== '' || (a[i - 1] && a[i - 1] !== ''));
      const text = lines.join('\n').trim();
      window.open('https://wa.me/905349579693?text=' + encodeURIComponent(text), '_blank', 'noopener');
      const okEl = $('.ok', form);
      okEl.innerHTML = '<b>Brief hazır.</b> WhatsApp açıldı; mesajı göndermeniz yeterli.';
      okEl.classList.add('show');
    });
    $$('input,select,textarea', form).forEach(el => el.addEventListener('input', () => el.closest('.fld') && el.closest('.fld').classList.remove('invalid')));
  }

  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
