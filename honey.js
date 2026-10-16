/* v6 Honey-style motion: lit words, service words, stacked cards, swapping headline, live warp, story waves, closing rows. */
(() => {
  const reduce = (() => { try { return localStorage.getItem('motion') === 'off'; } catch (e) { return false; } })();
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const coarse = matchMedia('(pointer: coarse)').matches;
  const DPR = Math.min(coarse ? 1.5 : 2, devicePixelRatio || 1);

  /* ---------- words that light up as you scroll ---------- */
  const lits = $$('[data-lit]').map(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="wd">${w}</span>`).join(' ');
    return { el, w: [...el.querySelectorAll('.wd')], n: -1 };
  });

  /* ---------- the rest ---------- */
  const words = $$('#words li');
  const cards = $$('.stack__card');
  const row1 = $('#row1'), row2 = $('#row2'), swap = $('#swap');
  const ba = $('.ba2'), warp = $('#warp');
  const story = $('.story'), sw = $('#storyWave');
  const sign = $$('.sign__row');

  // warp field: drifting dots before, light-speed streaks after
  const W = { ctx: warp && warp.getContext('2d'), w: 0, h: 0, s: [], speed: .2 };
  const sizeWarp = () => { if (!warp) return; W.w = warp.clientWidth; W.h = warp.clientHeight; warp.width = W.w * DPR; warp.height = W.h * DPR;
    const N = coarse ? 260 : 620; W.s = Array.from({ length: N }, () => ({ x: (Math.random() - .5) * 2, y: (Math.random() - .5) * 2, z: Math.random() })); };
  const drawWarp = (dt, p) => {
    const c = W.ctx; if (!c) return;
    const target = p < .5 ? .15 + p * .5 : 1.2 + (p - .5) * 5;
    W.speed += (target - W.speed) * (1 - Math.exp(-dt / 220));
    c.setTransform(DPR, 0, 0, DPR, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, W.w, W.h);
    const cx = W.w / 2, cy = W.h / 2, f = Math.max(W.w, W.h) * .5, streak = clamp((W.speed - .3) / 2);
    c.lineCap = 'round';
    for (const s of W.s) {
      const z0 = s.z; s.z -= W.speed * dt / 4000; if (s.z <= .02) { s.x = (Math.random() - .5) * 2; s.y = (Math.random() - .5) * 2; s.z = 1; continue; }
      const x = cx + s.x / s.z * f * .5, y = cy + s.y / s.z * f * .5;
      if (x < -50 || x > W.w + 50 || y < -50 || y > W.h + 50) { s.z = 1; continue; }
      const a = clamp(1.2 - s.z), r = Math.max(.6, (1 - s.z) * 2.2);
      if (streak > .02) {
        const zt = Math.min(1, z0 + W.speed * .06), x2 = cx + s.x / zt * f * .5, y2 = cy + s.y / zt * f * .5;
        const hot = Math.hypot(x - cx, y - cy) < f * .35;
        c.strokeStyle = hot ? `rgba(244,72,73,${a})` : `rgba(235,235,235,${a * .9})`; c.lineWidth = r;
        c.beginPath(); c.moveTo(x2, y2); c.lineTo(x, y); c.stroke();
      } else { c.fillStyle = `rgba(210,210,210,${a * .8})`; c.fillRect(x, y, r, r); }
    }
  };

  // story backdrop: slow coral square waves, like a scope screen
  const S = { ctx: sw && sw.getContext('2d'), w: 0, h: 0 };
  const sizeStory = () => { if (!sw) return; S.w = sw.clientWidth; S.h = sw.clientHeight; sw.width = S.w * DPR; sw.height = S.h * DPR; };
  const drawStory = (t) => {
    const c = S.ctx; if (!c) return;
    c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, S.w, S.h);
    const lanes = 7, gap = S.h / (lanes + 1);
    for (let i = 0; i < lanes; i++) {
      const y0 = gap * (i + 1), amp = gap * .22, per = 90 + i * 26, off = (t * (.02 + i * .004)) % (per * 2);
      c.strokeStyle = i === 3 ? 'rgba(244,72,73,.5)' : 'rgba(244,72,73,.12)'; c.lineWidth = i === 3 ? 1.6 : 1;
      c.beginPath(); let hi = false; c.moveTo(-off, y0 + amp);
      for (let x = -off; x < S.w + per; x += per) { c.lineTo(x, hi ? y0 - amp : y0 + amp); hi = !hi; c.lineTo(x, hi ? y0 - amp : y0 + amp); }
      c.stroke();
    }
  };

  const resize = () => { sizeWarp(); sizeStory(); };
  resize(); addEventListener('resize', resize);

  let lastT = 0, signX = 0, lastY = scrollY, vel = 0;
  const frame = t => {
    const dt = lastT ? Math.min(64, t - lastT) : 16; lastT = t;
    const VH = innerHeight, y = scrollY; vel += ((y - lastY) / dt - vel) * .15; lastY = y;

    // lit words
    for (const L of lits) {
      const r = L.el.getBoundingClientRect(); if (r.bottom < -VH || r.top > VH * 2) continue;
      const p = reduce ? 1 : clamp((VH * .82 - r.top) / (r.height + VH * .3));
      const n = Math.round(p * L.w.length);
      if (n !== L.n) { for (let i = 0; i < L.w.length; i++) L.w[i].classList.toggle('on', i < n); L.n = n; }
    }

    // service words: the one nearest the middle is white
    if (words.length && !reduce) {
      let best = -1, bd = Infinity;
      words.forEach((w, i) => { const r = w.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - VH * .5); if (d < bd) { bd = d; best = i; } });
      words.forEach((w, i) => w.classList.toggle('on', i === best && bd < VH * .5));
    }

    // stacked cards: each one settles back as the next slides over it
    if (!reduce) cards.forEach((c, i) => {
      const next = cards[i + 1]; if (!next) { c.style.transform = ''; return; }
      const r = c.getBoundingClientRect(), n = next.getBoundingClientRect();
      const k = clamp(1 - (n.top - r.top) / Math.max(1, r.height));
      c.style.transform = `scale(${(1 - k * .06).toFixed(4)})`; c.style.filter = k > .01 ? `brightness(${(1 - k * .45).toFixed(3)})` : '';
    });

    // spec, meet silicon: the two lines slide past each other
    if (swap && !reduce) {
      const r = swap.getBoundingClientRect();
      if (r.bottom > 0 && r.top < VH) { const p = clamp((VH - r.top) / (VH + r.height)), d = (p - .5) * 46;
        row1.style.transform = `translate3d(${(-d).toFixed(2)}vw,0,0)`; row2.style.transform = `translate3d(${(d - 18).toFixed(2)}vw,0,0)`; }
    }

    // before / after
    if (ba) {
      const r = ba.getBoundingClientRect();
      if (r.top < VH && r.bottom > 0) {
        const p = clamp(-r.top / (r.height - VH));
        ba.classList.toggle('is-before', p > .06 && p <= .5); ba.classList.toggle('is-after', p > .5);
        drawWarp(reduce ? 0 : dt, p);
      }
    }

    // story backdrop
    if (story) { const r = story.getBoundingClientRect(); if (r.top < VH && r.bottom > 0) drawStory(reduce ? 0 : t); }

    // closing rows drift in opposite directions, faster when you scroll
    if (sign.length && !reduce) {
      const r = sign[0].parentElement.getBoundingClientRect();
      if (r.top < VH && r.bottom > 0) { signX += (0.5 + Math.min(10, Math.abs(vel) * 7)) * dt / 16;
        const w = sign[0].scrollWidth / 2 || 1, x = signX % w;
        sign[0].style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`; sign[1].style.transform = `translate3d(${(x - w).toFixed(1)}px,0,0)`; }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
