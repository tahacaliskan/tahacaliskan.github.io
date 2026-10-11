/* Calisqa Software: nav, reveal, hero demo switcher, contact form -> WhatsApp / e-posta. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '905013466560', MAIL = 'taha@calisqa.com';

  const burger = $('.burger');
  const setMenu = open => { document.body.classList.toggle('menu-open', open); burger && burger.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : ''; };
  burger && burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('.overlay a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* hero: rotate through the demo sites (desktop + phone + url), or pick one */
  const stage = $('[data-stage]');
  if (stage) {
    const btns = $$('[data-show]'), url = $('.url span', stage);
    let i = 0, timer = null;
    const show = k => {
      i = k;
      $$('.browser .shot img', stage).forEach((im, n) => im.classList.toggle('on', n === k));
      $$('.phone .core img', stage).forEach((im, n) => im.classList.toggle('on', n === k));
      btns.forEach((b, n) => b.setAttribute('aria-pressed', String(n === k)));
      url.textContent = btns[k].dataset.url;
    };
    const loop = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => show((i + 1) % btns.length), 4200); };
    btns.forEach((b, n) => b.addEventListener('click', () => { show(n); loop(); }));
    show(0); loop();
    document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(timer) : loop());
  }

  /* contact form */
  const form = $('form[data-contact]');
  if (form) {
    const build = () => {
      const v = id => ($('#' + id, form).value || '').trim();
      const need = $$('input[name=need]:checked', form).map(i => i.value);
      return ['Merhaba Calisqa, web sitesi / yazılım için görüşmek istiyorum.', '', `Ad soyad: ${v('c-name')}`, `İşletme: ${v('c-biz')}`, `Telefon: ${v('c-tel')}`,
        need.length ? `İhtiyaç: ${need.join(', ')}` : '', v('c-site') ? `Mevcut site / Instagram: ${v('c-site')}` : '', '', v('c-msg')].filter((l, k, a) => l !== '' || (a[k - 1] && a[k - 1] !== '')).join('\n').trim();
    };
    const valid = () => {
      let ok = true;
      $$('[required]', form).forEach(el => {
        const f = el.closest('.fld');
        const bad = !el.value.trim() || (el.type === 'tel' && el.value.replace(/\D/g, '').length < 10);
        f.classList.toggle('invalid', bad); if (bad && ok) { el.focus(); ok = false; }
      });
      return ok;
    };
    const done = how => { const o = $('.ok', form); o.textContent = how === 'wa' ? 'Mesajınız WhatsApp\'ta hazır. Göndermeniz yeterli; en kısa sürede dönüş yapacağız.' : 'E-posta taslağınız açıldı. Göndermeniz yeterli; en kısa sürede dönüş yapacağız.'; o.classList.add('show'); };
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!valid()) return;
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(build()), '_blank', 'noopener');
      done('wa');
    });
    $('[data-mail]', form).addEventListener('click', () => {
      if (!valid()) return;
      location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Web sitesi talebi: ' + ($('#c-biz', form).value || '').trim()) + '&body=' + encodeURIComponent(build());
      done('mail');
    });
    $$('input,textarea', form).forEach(el => el.addEventListener('input', () => el.closest('.fld') && el.closest('.fld').classList.remove('invalid')));
  }

  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
