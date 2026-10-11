/* Shared behaviour for every demo site. Reads window.SITE (config) and window.MENU (optional). */
(() => {
  const S = window.SITE || {};
  const MENU = window.MENU || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const waLink = (text, num = S.wa) => `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  const parsePrice = p => { const m = String(p).replace(/\s|TL|₺/g, '').replace(/\./g, '').replace(',', '.'); const n = parseFloat(m); return isNaN(n) ? 0 : n; };
  const fmt = n => n.toLocaleString('tr-TR', {minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2}) + ' TL';

  /* mobile nav */
  const mnav = $('#mobile-nav');
  const setNav = open => { if (!mnav) return; mnav.classList.toggle('open', open); $$('[data-nav-toggle]').forEach(b => b.setAttribute('aria-expanded', open)); document.body.style.overflow = open ? 'hidden' : ''; if (open) mnav.querySelector('a,button')?.focus(); };
  $$('[data-nav-toggle]').forEach(b => b.addEventListener('click', () => setNav(!mnav.classList.contains('open'))));
  mnav && mnav.addEventListener('click', e => { if (e.target.closest('a')) setNav(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { setNav(false); setDrawer(false); } });

  /* opening hours: S.hours = {0:['10:00','22:00'] | null, ...}, 0 = Sunday */
  const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const now = new Date(new Date().toLocaleString('en-US', {timeZone: 'Europe/Istanbul'}));
  const toH = t => { const [h, m] = t.split(':').map(Number); return h + m / 60; };
  // Turkish suffix for a clock time, by the last spoken number word (22:00'ye, 23:30'a, 08:00'de)
  const W = {1:'bir',2:'iki',3:'üç',4:'dört',5:'beş',6:'altı',7:'yedi',8:'sekiz',9:'dokuz',10:'on',20:'yirmi',30:'otuz',40:'kırk',50:'elli'};
  const DAT = {bir:'e',iki:'ye',üç:'e',dört:'e',beş:'e',altı:'ya',yedi:'ye',sekiz:'e',dokuz:'a',on:'a',yirmi:'ye',otuz:'a',kırk:'a',elli:'ye'};
  const LOC = {bir:'de',iki:'de',üç:'te',dört:'te',beş:'te',altı:'da',yedi:'de',sekiz:'de',dokuz:'da',on:'da',yirmi:'de',otuz:'da',kırk:'ta',elli:'de'};
  const lastWord = t => { const [h, m] = t.split(':').map(Number); const n = m || h; return W[n % 10] || W[n - n % 10] || 'on'; };
  const suf = (t, tbl) => `${t}'${tbl[lastWord(t)]}`;
  if (S.hours) {
    const d = now.getDay(), h = now.getHours() + now.getMinutes() / 60, today = S.hours[d];
    const open = !!today && h >= toH(today[0]) && h < toH(today[1]);
    let next = '';
    if (!open) {
      for (let k = 0; k < 7; k++) {
        const dd = (d + k) % 7, sl = S.hours[dd];
        if (sl && (k > 0 || h < toH(sl[0]))) { next = (k === 0 ? 'bugün ' : k === 1 ? 'yarın ' : DAYS[dd] + ' ') + sl[0]; break; }
      }
    }
    $$('[data-status]').forEach(el => {
      el.classList.toggle('closed', !open);
      const t = el.querySelector('span:not(.dot)'); if (t) t.textContent = open ? `Şu an açık, ${suf(today[1], DAT)} kadar` : `Şu an kapalı, ${next.replace(/(\d\d:\d\d)$/, x => suf(x, LOC))} açılıyor`;
    });
    $$('[data-hours]').forEach(el => {
      el.innerHTML = [1, 2, 3, 4, 5, 6, 0].map(k => `<div class="${k === d ? 'today' : ''}"><span>${DAYS[k]}</span><span>${S.hours[k] ? S.hours[k][0] + ' - ' + S.hours[k][1] : 'Kapalı'}</span></div>`).join('');
    });
  }

  /* cart (persists across pages of the same site) */
  const CK = 'cart:' + (S.slug || location.pathname);
  let cart = store.get(CK, {});
  const byName = Object.fromEntries(MENU.map(m => [m.name, m]));
  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const fab = $('#cart-fab');
  const setDrawer = open => document.body.classList.toggle('drawer-open', !!open);
  function renderCart() {
    store.set(CK, cart);
    const n = cartCount();
    if (fab) { fab.classList.toggle('show', n > 0); fab.querySelector('.n').textContent = n; }
    $$('[data-qty-for]').forEach(el => paintAdd(el));
    const box = $('#cart-items'); if (!box) return;
    const lines = Object.entries(cart).filter(([, q]) => q > 0);
    box.innerHTML = lines.length ? lines.map(([name, q]) => {
      const it = byName[name] || {price: ''};
      return `<div class="line"><div><h3>${esc(name)}</h3><small>${esc(it.price)}</small></div><div class="qty"><button type="button" aria-label="${esc(name)} azalt" data-cq="${esc(name)}" data-d="-1"><i class="ph ph-minus"></i></button><span>${q}</span><button type="button" aria-label="${esc(name)} artır" data-cq="${esc(name)}" data-d="1"><i class="ph ph-plus"></i></button></div></div>`;
    }).join('') : `<div class="empty"><i class="ph ph-basket"></i>Siparişiniz boş. Menüden ürün ekleyin.</div>`;
    const total = lines.reduce((a, [name, q]) => a + parsePrice((byName[name] || {}).price) * q, 0);
    const t = $('#cart-total'); if (t) t.textContent = total ? fmt(total) : '-';
  }
  function setQty(name, d) { cart[name] = Math.max(0, (cart[name] || 0) + d); if (!cart[name]) delete cart[name]; renderCart(); }
  function paintAdd(el) {
    const name = el.dataset.qtyFor, q = cart[name] || 0;
    el.innerHTML = q ? `<span class="qty"><button type="button" aria-label="Azalt" data-d="-1"><i class="ph ph-minus"></i></button><span>${q}</span><button type="button" aria-label="Artır" data-d="1"><i class="ph ph-plus"></i></button></span>`
      : `<button type="button" class="add" data-d="1"><i class="ph ph-plus"></i>Ekle</button>`;
  }
  document.addEventListener('click', e => {
    const qb = e.target.closest('[data-qty-for] [data-d]');
    if (qb) { setQty(qb.closest('[data-qty-for]').dataset.qtyFor, +qb.dataset.d); return; }
    const cb = e.target.closest('[data-cq]');
    if (cb) { setQty(cb.dataset.cq, +cb.dataset.d); return; }
    if (e.target.closest('[data-cart-open]')) setDrawer(true);
    if (e.target.closest('[data-cart-close]')) setDrawer(false);
  });
  const sendBtn = $('#cart-send');
  sendBtn && sendBtn.addEventListener('click', () => {
    const lines = Object.entries(cart).filter(([, q]) => q > 0);
    const err = $('#cart-err');
    if (!lines.length) { err.textContent = 'Önce menüden ürün ekleyin.'; err.style.display = 'block'; return; }
    const name = $('#c-name').value.trim(), addr = $('#c-addr').value.trim(), mode = $('#c-mode').value, needAddr = !!$('#c-mode').selectedOptions[0].dataset.addr;
    if (!name || (needAddr && !addr)) { err.textContent = needAddr ? 'Ad ve adres gerekli.' : 'Adınızı yazın.'; err.style.display = 'block'; return; }
    err.style.display = 'none';
    const total = lines.reduce((a, [n, q]) => a + parsePrice((byName[n] || {}).price) * q, 0);
    const msg = `Merhaba ${S.name}, sipariş vermek istiyorum:\n` + lines.map(([n, q]) => `• ${q} x ${n}`).join('\n') +
      (total ? `\nTahmini toplam: ${fmt(total)}` : '') + `\n\n${mode}\nAd: ${name}` + (addr ? `\nAdres: ${addr}` : '') + (($('#c-note').value || '').trim() ? `\nNot: ${$('#c-note').value.trim()}` : '');
    window.open(waLink(msg), '_blank', 'noopener');
  });
  const modeSel = $('#c-mode');
  const syncAddr = () => { if (modeSel) $('#c-addr-field').style.display = modeSel.selectedOptions[0].dataset.addr ? '' : 'none'; };
  modeSel && modeSel.addEventListener('change', syncAddr); syncAddr();

  /* product card */
  const card = (m, opts = {}) => `<article class="pcard${opts.cls ? ' ' + opts.cls : ''}">${m.img ? `<div class="pimg"><img src="img/menu/${esc(m.img)}" alt="${esc(m.name)}" loading="lazy" width="560" height="560"></div>` : ''}<div class="pbody"><h3>${esc(m.name)}</h3>${m.desc ? `<p>${esc(m.desc)}</p>` : ''}<div class="pfoot"><span class="price">${esc(m.price)}</span>${S.cart === false ? '' : `<span data-qty-for="${esc(m.name)}"></span>`}</div></div></article>`;
  const row = m => `<div class="mrow${m.img ? '' : ' ni'}">${m.img ? `<img src="img/menu/${esc(m.img)}" alt="" loading="lazy" width="64" height="64">` : ''}<div><h3>${esc(m.name)}</h3>${m.desc ? `<p>${esc(m.desc)}</p>` : ''}</div><div class="side"><span class="price">${esc(m.price)}</span>${S.cart === false ? '' : `<span data-qty-for="${esc(m.name)}"></span>`}</div></div>`;

  /* home rails built from MENU: <div data-rail-items data-match="regex" data-limit="8"> */
  $$('[data-rail-items]').forEach(el => {
    const re = new RegExp(el.dataset.match || '.', 'i'), lim = +(el.dataset.limit || 10);
    const pick = MENU.filter(m => m.img && (re.test(m.name) || re.test(m.cat))).slice(0, lim);
    el.innerHTML = pick.map(m => card(m)).join('');
  });
  $$('[data-rail-btn]').forEach(b => b.addEventListener('click', () => { const r = document.getElementById(b.dataset.railBtn); r.scrollBy({left: +b.dataset.dir * r.clientWidth * .8, behavior: reduce ? 'auto' : 'smooth'}); }));

  /* menu page */
  const app = $('#menu-app');
  if (app && MENU.length) {
    const cats = [...new Set(MENU.map(m => m.cat))];
    const chips = $('#menu-chips'), q = $('#menu-q');
    chips.innerHTML = `<button class="chip" aria-pressed="true" data-cat="">Tümü</button>` + cats.map(c => `<button class="chip" aria-pressed="false" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    let cur = new URLSearchParams(location.search).get('k') || '';
    const draw = () => {
      const term = (q.value || '').trim().toLocaleLowerCase('tr');
      const list = MENU.filter(m => (!cur || m.cat === cur) && (!term || (m.name + ' ' + m.desc + ' ' + m.cat).toLocaleLowerCase('tr').includes(term)));
      const groups = cats.filter(c => list.some(m => m.cat === c));
      app.innerHTML = groups.length ? groups.map(c => {
        const items = list.filter(m => m.cat === c);
        const useGrid = S.menuLayout === 'grid' || (S.menuLayout === 'auto' && items.every(m => m.img));
        return `<section class="mcat fade-in" id="k-${esc(c).replace(/\s+/g, '-')}"><h2>${esc(c)} <small>${items.length} ürün</small></h2>${useGrid ? `<div class="mgrid">${items.map(m => card(m)).join('')}</div>` : `<div class="mlist">${items.map(row).join('')}</div>`}</section>`;
      }).join('') : `<div class="empty"><i class="ph ph-magnifying-glass"></i>“${esc(q.value)}” için sonuç bulunamadı.</div>`;
      $$('.chip', chips).forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === cur));
      renderCart();
    };
    chips.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; cur = b.dataset.cat; draw(); scrollTo({top: app.offsetTop - 160, behavior: reduce ? 'auto' : 'smooth'}); });
    q.addEventListener('input', draw);
    draw();
  }

  /* WhatsApp forms: <form data-wa-form data-title="..."> with .field > label + input[name] */
  $$('form[data-wa-form]').forEach(f => {
    const today = new Date().toISOString().slice(0, 10);
    $$('input[type=date]', f).forEach(i => i.min = today);
    f.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      $$('.field', f).forEach(fl => {
        const inp = fl.querySelector('input,select,textarea'); if (!inp) return;
        const bad = (inp.required && !inp.value.trim()) || (inp.type === 'tel' && inp.value && inp.value.replace(/\D/g, '').length < 10);
        fl.classList.toggle('invalid', bad); if (bad) ok = false;
      });
      if (!ok) { f.querySelector('.invalid input,.invalid select,.invalid textarea')?.focus(); return; }
      const lines = $$('.field', f).map(fl => { const inp = fl.querySelector('input,select,textarea'); const lab = fl.querySelector('label'); return inp && inp.value.trim() ? `${lab.textContent.replace(/\s*\*$/, '')}: ${inp.value.trim()}` : null; }).filter(Boolean);
      const url = waLink(`Merhaba ${S.name}, ${f.dataset.title}:\n` + lines.join('\n'));
      const okBox = f.querySelector('.form-ok');
      if (okBox) { okBox.innerHTML = `Talebiniz WhatsApp'ta hazırlandı. Pencere açılmadıysa <a class="link-arrow" href="${url}" target="_blank" rel="noopener">buradan gönderin <i class="ph ph-arrow-up-right"></i></a>`; okBox.classList.add('show'); }
      window.open(url, '_blank', 'noopener');
    });
    $$('input,select,textarea', f).forEach(i => i.addEventListener('input', () => i.closest('.field')?.classList.remove('invalid')));
  });

  /* rotating quotes */
  $$('[data-quotes]').forEach(box => {
    const qs = $$('.quote', box), nav = box.parentElement.querySelector('[data-qnav]');
    if (!qs.length || !nav) return;
    nav.innerHTML = qs.map((_, i) => `<button type="button" aria-label="Yorum ${i + 1}">${i + 1}</button>`).join('');
    let qi = 0, timer;
    const set = i => { qi = i; qs.forEach((q, k) => q.classList.toggle('on', k === i)); [...nav.children].forEach((b, k) => b.setAttribute('aria-current', k === i)); };
    [...nav.children].forEach((b, i) => b.addEventListener('click', () => { set(i); clearInterval(timer); }));
    set(0);
    if (!reduce) timer = setInterval(() => set((qi + 1) % qs.length), 7000);
  });

  /* simple tabs: [data-tabs] buttons[data-tab] + panels[data-panel] */
  $$('[data-tabs]').forEach(t => {
    const btns = $$('[data-tab]', t), panels = $$('[data-panel]', t.closest('[data-tabs-root]') || document);
    btns.forEach(b => b.addEventListener('click', () => { btns.forEach(x => x.setAttribute('aria-selected', x === b)); panels.forEach(p => p.hidden = p.dataset.panel !== b.dataset.tab); }));
  });

  /* reveal */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold: .1, rootMargin: '0px 0px -40px 0px'}) : null;
  $$('.rv').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  $$('[data-year]').forEach(el => el.textContent = now.getFullYear());
  renderCart();
})();
