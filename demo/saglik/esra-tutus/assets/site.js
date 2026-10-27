/* Calisqa demo sitesi - ortak etkileşim ve hareket katmanı */
(() => {
const SITE = window.SITE || {};
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const hasGsap = !!window.gsap && !reduce;
const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

/* ---------- menü */
$$('.burger, .burger-g').forEach(burger => burger.addEventListener('click', () => { const o = document.body.classList.toggle('menu'); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Menüyü kapat' : 'Menüyü aç'); }));
$$('.sheet a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu')));
addEventListener('keydown', e => { if (e.key === 'Escape') { document.body.classList.remove('menu'); kapatLb(); } });

/* ---------- açık / koyu tema */
const root = document.documentElement;
const sistemKoyu = () => matchMedia('(prefers-color-scheme: dark)').matches;
const aktifTema = () => root.dataset.theme || (root.dataset.varsayilan || (sistemKoyu() ? 'dark' : 'light'));
const temaIkon = () => $$('.tema-b').forEach(b => { const k = aktifTema() === 'dark';
  b.innerHTML = `<i class="ph-light ph-${k ? 'sun' : 'moon'}"></i>`; b.setAttribute('aria-label', k ? 'Açık temaya geç' : 'Koyu temaya geç'); b.title = b.getAttribute('aria-label'); });
$$('.tema-b').forEach(b => b.addEventListener('click', () => {
  const yeni = aktifTema() === 'dark' ? 'light' : 'dark';
  root.classList.add('tema-gecis'); root.dataset.theme = yeni;
  try { localStorage.setItem('cq-tema', yeni); } catch (e) {}
  temaIkon(); setTimeout(() => root.classList.remove('tema-gecis'), 500);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = getComputedStyle(document.body).backgroundColor;
}));
temaIkon();

/* ---------- üst bar: sayfa başından ayrılınca arka plan kazanır, hiç gizlenmez */
(function () {
  const nav = $('.nav-x') || $('.nav'); if (!nav) return;
  const s = document.createElement('div'); s.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:40px;pointer-events:none';
  document.body.prepend(s);
  new IntersectionObserver(([e]) => nav.classList.toggle('scrolled', !e.isIntersecting)).observe(s);
})();

/* ---------- SSS */
$$('.q button').forEach(b => b.addEventListener('click', () => { const q = b.parentElement, o = !q.classList.contains('open'); q.classList.toggle('open', o); b.setAttribute('aria-expanded', o); }));

/* ---------- şu an açık mı */
(function () {
  const s = SITE.saatler; if (!s || !s.length) return;
  const now = new Date(), idx = (now.getDay() + 6) % 7;
  $$(`.hours [data-day="${idx}"]`).forEach(r => r.classList.add('today'));
  const t = s[idx] && s[idx][1], mins = now.getHours() * 60 + now.getMinutes();
  const m = t && t.match(/(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})/);
  $$('[data-open]').forEach((b, i) => {
    const sub = $$('[data-open-sub]')[i];
    if (m) {
      const a = +m[1] * 60 + +m[2], z = +m[3] * 60 + +m[4];
      if (mins >= a && mins < z) { b.innerHTML = '<i class="live"></i>Şu an açık'; if (sub) sub.textContent = `Bugün ${m[3]}:${m[4]}'a kadar`; }
      else { b.innerHTML = '<i class="live off"></i>Şu an kapalı'; if (sub) sub.textContent = mins < a ? `Bugün ${m[1]}:${m[2]}'da açılıyor` : 'Yarın yeniden açık'; }
    } else if (t && /kapal/i.test(t)) { b.innerHTML = '<i class="live off"></i>Bugün kapalı'; }
  });
})();

/* ---------- randevu formu → WhatsApp / telefon */
const rf = $('#rf');
if (rf) {
  const k = new URLSearchParams(location.search).get('konu');
  if (k) [...rf.konu.options].forEach(o => { if (o.text === k) o.selected = true; });
  rf.addEventListener('submit', e => {
    e.preventDefault();
    const ad = rf.ad.value.trim(), tel = rf.tel.value.trim(), td = tel.replace(/\D/g, '');
    const set = (n, m) => { const el = rf.querySelector(`[data-for="${n}"]`); if (el) el.textContent = m; };
    set('ad', ad.length < 3 ? 'Lütfen adınızı ve soyadınızı yazın.' : '');
    set('tel', td.length < 10 ? 'Geçerli bir telefon numarası yazın.' : '');
    if (ad.length < 3 || td.length < 10) return;
    const msg = `Merhaba, ${SITE.ad} için randevu almak istiyorum.\nAd soyad: ${ad}\nTelefon: ${tel}\nTercih ettiğim gün: ${rf.gun.value}\nKonu: ${rf.konu.value}` + (rf.not.value.trim() ? `\nNot: ${rf.not.value.trim()}` : '');
    if (SITE.whatsapp) window.open(SITE.whatsapp + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    else if (SITE.tel) location.href = 'tel:' + SITE.tel;
    else if (SITE.randevu) window.open(SITE.randevu, '_blank', 'noopener');
  });
}

/* ---------- ışık kutusu */
const lb = $('.lb'); let lbList = [], lbI = 0;
function acLb(i) { if (!lb) return; lbI = (i + lbList.length) % lbList.length; $('img', lb).src = lbList[lbI]; lb.classList.add('on'); }
function kapatLb() { if (lb) lb.classList.remove('on'); }
$$('[data-lb]').forEach(g => { const imgs = $$('img', g); lbList = imgs.map(i => i.src); imgs.forEach((im, i) => im.closest('figure').addEventListener('click', () => acLb(i))); });
if (lb) { $('.x', lb).onclick = kapatLb; $('.pv', lb).onclick = () => acLb(lbI - 1); $('.nx', lb).onclick = () => acLb(lbI + 1); lb.addEventListener('click', e => { if (e.target === lb) kapatLb(); }); }

/* ---------- araç: VKİ */
const vki = $('[data-tool="vki"]');
if (vki) {
  const b = $('#vb', vki), k = $('#vk', vki), o = n => $(`[data-o="${n}"]`, vki);
  const hesap = () => {
    const h = +b.value / 100, w = +k.value;
    if (!(h > 1.2 && h < 2.3 && w > 30 && w < 260)) { o('v').textContent = '-'; o('d').textContent = 'Boy ve kilonuzu girin.'; o('su').textContent = ''; return; }
    const v = w / (h * h);
    const d = v < 18.5 ? 'Zayıf aralıkta' : v < 25 ? 'Normal aralıkta' : v < 30 ? 'Fazla kilolu aralıkta' : 'Obezite aralığında';
    if (window.gsap && !reduce) { const obj = { x: parseFloat(o('v').textContent) || 0 }; gsap.to(obj, { x: v, duration: .8, ease: 'expo.out', onUpdate: () => o('v').textContent = obj.x.toFixed(1) }); }
    else o('v').textContent = v.toFixed(1);
    o('d').textContent = d; o('su').textContent = `Günlük yaklaşık su ihtiyacı: ${(w * 0.033).toFixed(1)} litre`;
  };
  b.addEventListener('input', hesap); k.addEventListener('input', hesap);
}

/* ---------- araç: nefes */
const nf = $('[data-tool="nefes"]');
if (nf) {
  const daire = $('.breath', nf), yazi = $('[data-nefes-yazi]', nf), btn = $('[data-nefes]', nf);
  const fazlar = [['Nefes al', 1], ['Tut', 1], ['Nefes ver', .55], ['Bekle', .55]];
  let tm = null, n = 0, tur = 0;
  const dur = () => { clearTimeout(tm); tm = null; btn.firstChild.textContent = 'Başlat'; daire.style.setProperty('--s', .55); yazi.innerHTML = 'Tebrikler<small>istediğinizde tekrar başlatın</small>'; };
  const adim = () => {
    const [ad, s] = fazlar[n % 4]; daire.style.setProperty('--d', reduce ? '0s' : '4s'); daire.style.setProperty('--s', s);
    let k = 4; yazi.innerHTML = `${ad}<small>${k}</small>`;
    const say = () => { k--; if (k > 0) { yazi.innerHTML = `${ad}<small>${k}</small>`; tm = setTimeout(say, 1000); } else { n++; if (n % 4 === 0) tur++; if (tur >= 4) return dur(); adim(); } };
    tm = setTimeout(say, 1000);
  };
  btn.addEventListener('click', () => { if (tm) return dur(); n = 0; tur = 0; btn.firstChild.textContent = 'Durdur'; adim(); });
}

/* ---------- araç: seçici (şikayet / ağrı bölgesi) */
const sc = $('[data-tool="secici"]');
if (sc) {
  const veri = JSON.parse(($('#secici-veri') || {}).textContent || '[]'), o = n => $(`[data-s="${n}"]`, sc);
  $$('.chips2 button', sc).forEach(b => b.addEventListener('click', () => {
    $$('.chips2 button', sc).forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true');
    const s = veri[+b.dataset.i]; o('l').textContent = 'Size uygun olabilecek'; o('h').textContent = s.hizmet_ad; o('m').textContent = s.metin;
    const a = o('a'); a.href = s.hizmet_url; a.firstChild.textContent = 'Ayrıntılı bilgi ';
    if (window.gsap && !reduce) gsap.fromTo([o('h'), o('m')], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .06, ease: 'expo.out' });
  }));
}

/* ---------- sayfa geçiş perdesi */
const cur = $('.curtain');
const icLink = a => a && a.href && a.origin === location.origin && !a.target && !a.hasAttribute('download') && /\.html($|\?)/.test(a.getAttribute('href') || '') && !(a.getAttribute('href') || '').startsWith('#');
if (hasGsap && cur) {
  const cubuk = $$('i', cur), yazi = $('b', cur);
  if (store.get('cq-gecis')) {
    store.set('cq-gecis', '');
    gsap.set(cubuk, { scaleY: 1 });
    gsap.timeline().to(yazi, { opacity: 0, duration: .2 }).set(cubuk, { transformOrigin: 'top' })
      .to(cubuk, { scaleY: 0, duration: .75, ease: 'expo.inOut', stagger: .05 }, .05);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!icLink(a) || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (a.pathname === location.pathname && !a.search) return;
    e.preventDefault(); store.set('cq-gecis', '1'); document.body.classList.remove('menu');
    gsap.set(cubuk, { transformOrigin: 'bottom' });
    gsap.timeline({ onComplete: () => location.href = a.href })
      .to(cubuk, { scaleY: 1, duration: .6, ease: 'expo.inOut', stagger: .05 })
      .to(yazi, { opacity: 1, duration: .25 }, '-=.25');
  });
  addEventListener('pageshow', e => { if (e.persisted) gsap.set(cubuk, { scaleY: 0 }); });
}

/* ---------- hareket */
if (!hasGsap) { document.documentElement.classList.remove('js'); return; }
gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis({ lerp: .1 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);

// başlıkları kelimelere böl
$$('[data-split]').forEach(h => {
  const walk = n => [...n.childNodes].forEach(c => {
    if (c.nodeType === 3) { const fr = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(p => { if (!p) return; if (/^\s+$/.test(p)) fr.append(p); else { const w = document.createElement('span'); w.className = 'w'; const i = document.createElement('span'); i.textContent = p; w.append(i); fr.append(w); } });
      c.replaceWith(fr);
    } else if (c.nodeType === 1 && !c.classList.contains('w')) walk(c); });
  walk(h);
});
const ilk = $('.hero, .phero');
const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: store.get('cq-gecis') === '' ? .35 : .1 });
tl.to('[data-split] .w>span', { y: 0, duration: 1.3, stagger: .045 }, 0)
  .fromTo('[data-clip]', { clipPath: 'inset(12% 8% 12% 8% round 28px)', scale: 1.04 }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', scale: 1, duration: 1.6 }, 0)
  .to(ilk ? $$('[data-r]', ilk) : [], { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, stagger: .07 }, .3)
  .from('[data-chip]', { opacity: 0, y: 24, scale: .96, duration: 1, stagger: .12 }, .8);

// çizgi sanatı kendini çizer
$$('.art').forEach(svg => $$('path,circle,ellipse,line,rect', svg).forEach((p, i) => {
  const L = p.getTotalLength ? p.getTotalLength() : 600; gsap.set(p, { strokeDasharray: L, strokeDashoffset: L });
  gsap.to(p, { strokeDashoffset: 0, duration: 2.6, delay: .4 + i * .12, ease: 'power2.inOut', scrollTrigger: { trigger: svg, start: 'top 95%', once: true } });
}));

// bölüm girişleri
const kalan = $$('[data-r]').filter(el => !ilk || !ilk.contains(el));
ScrollTrigger.batch(kalan, { start: 'top 90%', once: true, onEnter: els => gsap.to(els, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, stagger: .07, ease: 'expo.out' }) });

// paralaks
$$('[data-par]').forEach(img => gsap.fromTo(img, { yPercent: 0, scale: 1.12 }, { yPercent: +img.dataset.par, scale: 1.12, ease: 'none',
  scrollTrigger: { trigger: img.closest('.bezel') || img, start: 'top bottom', end: 'bottom top', scrub: true } }));

// süreç çizgisi
$$('.steps').forEach(s => { const f = $('[data-fill]', s); if (f) gsap.to(f, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: s, start: 'top 70%', end: 'bottom 60%', scrub: true } }); });
$$('[data-hfill]').forEach(f => gsap.to(f, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: f.closest('section'), start: 'top 70%', end: 'bottom 70%', scrub: true } }));

// sayaçlar (yalnızca gerçek veriler için kullanılır)
$$('[data-say]').forEach(el => { const hedef = +el.dataset.say, o = { v: 0 };
  gsap.to(o, { v: hedef, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => el.textContent = Math.round(o.v) + (el.dataset.ek || '') }); });

// yapışkan kart yığını
$$('[data-stack]').forEach(w => { const kartlar = $$('.stack-card', w);
  kartlar.forEach((c, i) => { if (i === kartlar.length - 1) return;
    gsap.to($('.sc-in', c) || c, { scale: .92, opacity: .45, ease: 'none', scrollTrigger: { trigger: kartlar[i + 1], start: 'top bottom', end: 'top 15%', scrub: true } }); }); });

// yatay galeri (masaüstü)
gsap.matchMedia().add('(min-width: 901px)', () => {
  $$('[data-gal]').forEach(pin => { const tr = $('.gal', pin); const d = () => Math.max(0, tr.scrollWidth - innerWidth);
    gsap.to(tr, { x: () => -d(), ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + d(), pin: true, scrub: 1, invalidateOnRefresh: true } }); });
  // eğik kart kaskadı hafifçe düzelir
  $$('[data-tilt]').forEach(c => gsap.fromTo(c, { rotate: +c.dataset.tilt }, { rotate: 0, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'center center', scrub: true } }));
});

// metin karıştırma (grid yönü)
$$('[data-scramble]').forEach(el => { const orj = el.textContent, harf = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ0123456789';
  el.closest('a,button,.card,.svc')?.addEventListener('pointerenter', () => { let f = 0; const id = setInterval(() => {
    el.textContent = orj.split('').map((c, i) => i < f ? orj[i] : (c === ' ' ? ' ' : harf[Math.floor(Math.random() * harf.length)])).join(''); f += 1.5; if (f >= orj.length) { clearInterval(id); el.textContent = orj; } }, 28); }); });

// kart ışığı
$$('[data-spot]').forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }));

// manyetik birincil butonlar
matchMedia('(hover: hover)').matches && $$('.btn-pri').forEach(b => {
  b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .18, y: (e.clientY - r.top - r.height / 2) * .25, duration: .5, ease: 'power3.out' }); });
  b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.4)' }));
});


// sayfa içi bağlantılar yumuşak kaysın
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const id = a.getAttribute('href'); if (id.length < 2) return; const el = $(id); if (!el) return; e.preventDefault(); lenis.scrollTo(el, { offset: -20, duration: 1.4 }); }));
})();

/* imza şeridi görününce demo etiketini gizle */
(() => {
  const cr = document.querySelector('.credit'), ds = document.querySelector('.demo-serit');
  if (!cr || !ds || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => ds.classList.toggle('gizli', e.isIntersecting), { rootMargin: '0px 0px 40px 0px' }).observe(cr);
})();
