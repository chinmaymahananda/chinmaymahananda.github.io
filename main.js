/* v5 page motion. chip.js (the v4 hero) owns smooth scrolling, anchor links and the Motion switch. */
(() => {
  const reduce = (() => { try { return localStorage.getItem('motion') === 'off'; } catch (e) { return false; } })();
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ?tour: a slow hands-free scroll through the page (wheel, click or any key stops it)
  if (!reduce && /[?&]tour\b/.test(location.search)) {
    setTimeout(() => {
      const L = window.__lenis; if (!L) return;
      L.scrollTo(document.documentElement.scrollHeight, { duration: 170, easing: t => t });
      const stop = () => { L.stop(); L.start(); ['wheel', 'keydown', 'mousedown', 'touchstart'].forEach(ev => removeEventListener(ev, stop)); };
      ['wheel', 'keydown', 'mousedown', 'touchstart'].forEach(ev => addEventListener(ev, stop, { passive: true }));
    }, 2500);
  }

  /* ---------- fade-in only ---------- */
  const rv = document.querySelectorAll('.chap__head, .bighead, .about__grid, .bg__grid, .rules__intro');
  if (!reduce) {
    rv.forEach(el => el.classList.add('rv'));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
    rv.forEach(el => io.observe(el));
  }

  /* ---------- "Say hello." letters rise in ---------- */
  const big = document.querySelector('.contact__big span');
  if (big) {
    big.innerHTML = [...big.textContent].map((c, i) => `<i style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</i>`).join('');
    const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io2.disconnect(); } }), { threshold: .35 });
    io2.observe(big.parentElement);
  }

  /* ---------- rules: one line lit, a card beside it ---------- */
  const list = document.getElementById('rulesList'), items = [...list.children], panel = list.parentElement;
  const card = document.getElementById('ruleCard'), cImg = document.getElementById('cardImg'), cCap = document.getElementById('cardCap');
  const term = (lines) => `<div class="card__term">${lines}</div>`;
  const cards = {
    mx: { html: term('$ python tests/\n  test_conformance.py\n\nmxgold v0.1.0\nconformance\n\n<span class="ok">43 passed, 0 failed</span>\n\nAll conformance\nchecks passed.'), cap: 'mx-conformance<br>// 43 passed, 0 failed' },
    dijkstra: { img: 'assets/img/dijkstra.webp', alt: 'Edsger W. Dijkstra', cap: 'E.W. Dijkstra<br>// (1930–2002) · 1970' },
    rv: { html: term('$ iverilog ... \\\n  tb_riscv_core.v\n$ vvp sim.out\n\n<span class="ok">*** PASS: all 15\nwritten registers\nbit-exact match\ngolden model ***</span>'), cap: 'riscv-pipelined-core<br>// golden-model match' },
    feynman: { img: 'assets/img/feynman.webp', alt: 'Richard Feynman, 1939', cap: 'R. Feynman<br>// (1918–1988) · 1974' },
    gh: { html: term('github.com/\nchinmaymahananda\n\n<span class="hl">■</span> mx-conformance\n<span class="hl">■</span> riscv-pipelined-\n  core\n<span class="hl">■</span> systolic-mac-\n  array\n<span class="hl">■</span> pokemon-card-\n  scanner (fork)'), cap: 'GitHub<br>// chinmaymahananda' },
    fork: { html: term('pokemon-card-\nscanner\n\nforked from\n<span class="hl">jeffreygoodgood/\npokemon-card-\nscanner</span>\n\nmy part:\nmodel → app\nintegration'), cap: 'Team project<br>// credited fork' },
    newton: { img: 'assets/img/newton.webp', alt: 'Isaac Newton by Godfrey Kneller, 1689', cap: 'I. Newton<br>// (1643–1727) · 1676' },
    me: { img: 'assets/img/chinmay-card.webp', alt: 'Chinmay Mahananda', cap: 'C. Mahananda<br>// (2026)' }
  };
  // every card face is built once and kept in the DOM; switching only flips visibility, so image and line change on the same frame
  const faces = {};
  for (const [k, c] of Object.entries(cards)) {
    const f = document.createElement('div'); f.className = 'card__face';
    f.innerHTML = c.img ? `<img src="${c.img}" alt="${c.alt}" decoding="sync">` : c.html;
    cImg.appendChild(f); faces[k] = f;
  }

  let active = -1, ptr = null, cx = 0, cy = 0, tx = 0, ty = 0, placed = false;
  const setActive = i => {
    if (i === active) return;
    if (active >= 0) { items[active].classList.remove('is-on'); faces[items[active].dataset.card].classList.remove('on'); }
    active = i;
    if (i < 0) { card.classList.remove('is-on'); placed = false; return; }
    const k = items[i].dataset.card;
    items[i].classList.add('is-on'); faces[k].classList.add('on'); cCap.innerHTML = cards[k].cap;
    card.classList.add('is-on');
  };
  // pointer mode (desktop): the line under the cursor lights and the card follows the cursor
  panel.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { const r = panel.getBoundingClientRect(); ptr = { x: e.clientX - r.left, y: e.clientY - r.top }; } });
  panel.addEventListener('pointerleave', () => { ptr = null; });

  /* ---------- other scroll-driven pieces ---------- */
  const ba = document.querySelector('.ba'), baImg = document.querySelector('.ba__img');
  const faq = document.querySelector('.faq__inner');
  const track = document.querySelector('.marquee__track');
  let mqX = 0, lastY = scrollY, vel = 0, lastT = 0, mqW = 0;
  const measure = () => { mqW = track ? track.scrollWidth / 2 : 0; };
  measure(); addEventListener('resize', measure); addEventListener('load', measure);

  const frame = (t) => {
    const dt = lastT ? Math.min(64, t - lastT) : 16; lastT = t;
    const y = scrollY, VH = innerHeight;
    vel += ((y - lastY) / dt - vel) * 0.15; lastY = y;

    if (!reduce) {
      if (track && mqW) { const r = track.getBoundingClientRect(); if (r.bottom > 0 && r.top < VH) { mqX -= (0.6 + Math.min(14, Math.abs(vel) * 9)) * dt / 16; if (mqX <= -mqW) mqX += mqW; track.style.transform = `translate3d(${mqX.toFixed(1)}px, 0, 0)`; } }
      const fr = faq ? faq.getBoundingClientRect() : { top: 1e9, bottom: -1 };
      if (fr.top < VH && fr.bottom > 0) faq.style.transform = `scale(${(0.9 + clamp((VH - fr.top) / (VH * 0.8)) * 0.1).toFixed(4)})`;
    }

    const b = ba ? ba.getBoundingClientRect() : { top: 1e9, bottom: -1 };
    if (b.top < VH && b.bottom > 0) {
      const p = clamp(-b.top / (b.height - VH));
      ba.classList.toggle('is-after', p > 0.5);
      if (!reduce) baImg.style.transform = `translate3d(${((0.5 - p) * 24).toFixed(2)}%, 0, 0) scale(1.35)`;
    }

    // rules
    const pr = panel.getBoundingClientRect();
    if (pr.bottom < 0 || pr.top > VH) { setActive(-1); }
    else {
      let i = -1;
      const ref = ptr ? pr.top + ptr.y : VH * 0.48;
      let bd = Infinity;
      for (let k = 0; k < items.length; k++) { const r = items[k].getBoundingClientRect(); const d = ref < r.top ? r.top - ref : ref > r.bottom ? ref - r.bottom : 0; if (d < bd) { bd = d; i = k; } }
      if (!ptr && (list.getBoundingClientRect().bottom < VH * 0.15 || list.getBoundingClientRect().top > VH * 0.85)) i = -1;
      setActive(i);
      if (i >= 0) {
        const r = items[i].getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight;
        if (ptr) { tx = clamp(ptr.x + 24, 0, pr.width - cw - 8); ty = r.top - pr.top - ch - 6; }   // above the lit line, so the line stays readable
        else { tx = innerWidth < 900 ? pr.width - cw - 8 : Math.min(pr.width * 0.64, pr.width - cw - 220); ty = r.top - pr.top + r.height / 2 - ch * (innerWidth < 900 ? 0.5 : 0.55); }
        if (!placed || reduce) { cx = tx; cy = ty; placed = true; }
        else { const k = 1 - Math.exp(-dt / 70); cx = lerp(cx, tx, k); cy = lerp(cy, ty, k); }   // frame-rate independent follow
        card.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
