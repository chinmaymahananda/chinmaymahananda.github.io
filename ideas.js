/* Preview build: five ideas layered on the existing site. Every figure shown is read from the page itself. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const rm = () => html.classList.contains('rm');
  const go = (t, instant) => (window.__go ? window.__go(t, instant) : document.querySelector(t)?.scrollIntoView());
  const nav = $('.nav');

  /* ---------- 1. section bus: labelled lane under the nav; highlights where you are, click to jump ---------- */
  const SECTIONS = [['about', 'ABOUT', '#23262D'], ['ring', 'INDEX', '#23262D'], ['mxgold', 'MXGOLD', '#B45309'], ['rv32i', 'RV32I', '#1D4ED8'],
    ['systolic', 'SYSTOLIC', '#047857'], ['pokemon', 'SCANNER', '#6D28D9'], ['record', 'BACKGROUND', '#23262D'], ['contact', 'CONTACT', '#23262D']]
    .filter(([id]) => document.getElementById(id));
  if (nav && SECTIONS.length > 1) {
    const bus = document.createElement('div'); bus.className = 'simbus'; bus.setAttribute('aria-hidden', 'true');
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), cur = document.createElement('span');
    cur.className = 'cur'; bus.append(svg, cur); nav.appendChild(bus);
    let tops = [], start = 0, span = 1, W = 0, segs = [], active = -1;
    const layout = () => {
      W = bus.clientWidth; if (!W) return;
      tops = SECTIONS.map(([id]) => document.getElementById(id).getBoundingClientRect().top + scrollY);
      start = tops[0]; span = Math.max(1, document.documentElement.scrollHeight - start);
      svg.setAttribute('viewBox', `0 0 ${W} 22`); svg.textContent = ''; segs = [];
      SECTIONS.forEach(([id, label, c], i) => {
        const x0 = (tops[i] - start) / span * W, x1 = (i + 1 < tops.length ? (tops[i + 1] - start) / span : 1) * W - 2;
        const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'seg'); g.style.setProperty('--c', c);
        const p = document.createElementNS(NS, 'path'), k = Math.min(4, (x1 - x0) / 3);
        p.setAttribute('d', `M${x0 + k} 3H${x1 - k}L${x1} 11L${x1 - k} 19H${x0 + k}L${x0} 11Z`); g.appendChild(p);
        if (x1 - x0 > label.length * 6.6 + 14) { const t = document.createElementNS(NS, 'text'); t.setAttribute('x', (x0 + x1) / 2); t.setAttribute('y', 14.5); t.setAttribute('text-anchor', 'middle'); t.textContent = label; g.appendChild(t); }
        g.addEventListener('click', () => go('#' + id));
        svg.appendChild(g); segs.push(g);
      });
      active = -1; update();
    };
    const update = () => {
      if (!W) return;
      const t = scrollY + 72, x = Math.min(W, Math.max(0, (t - start) / span * W));
      cur.style.transform = `translateX(${x}px)`;
      let a = -1; tops.forEach((y, i) => { if (t >= y - 2) a = i; });
      if (a !== active) { segs.forEach((g, i) => g.classList.toggle('on', i === a)); active = a; }
    };
    let q = false; addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; update(); }); } }, { passive: true });
    addEventListener('resize', () => requestAnimationFrame(layout));
    addEventListener('load', layout); setTimeout(layout, 1500); layout();
  }

  /* ---------- 2. command palette: Ctrl/Cmd+K or "/" ---------- */
  const stat = id => ($(`.rc[href="#${id}"] .rc__s`)?.textContent || '').replace(/\s+/g, ' ').trim();
  const hrefOf = sel => $(sel)?.getAttribute('href');
  const CMDS = [
    ['cd about', 'About', '#about'],
    ['make test mxgold', 'MXGOLD · ' + stat('mxgold'), '#mxgold'],
    ['make signoff rv32i', 'RV32I core · ' + stat('rv32i'), '#rv32i'],
    ['make sim systolic', 'INT8 systolic · ' + stat('systolic'), '#systolic'],
    ['open scanner', 'Card scanner · team project', '#pokemon'],
    ['cd background', 'Education and experience', '#record'],
    ['cd contact', 'Contact', '#contact'],
    ['cat resume.pdf', 'Resume (PDF)', hrefOf('a[href$="Resume.pdf"]')],
    ['git remote -v', 'GitHub profile', 'https://github.com/chinmaymahananda'],
    ['open linkedin', 'LinkedIn', hrefOf('a[href*="linkedin.com"]')],
    ['mail chinmay', (hrefOf('a[href^="mailto:"]') || '').replace('mailto:', ''), hrefOf('a[href^="mailto:"]')]
  ].filter(c => c[2]);
  const box = document.createElement('div'); box.className = 'cmdk'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Command palette');
  box.innerHTML = '<div class="cmdk__panel"><label class="cmdk__in"><span aria-hidden="true">$</span><input type="text" placeholder="make test mxgold" aria-label="Type a command" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="cmdkList"></label><ul class="cmdk__list" id="cmdkList" role="listbox"></ul><div class="cmdk__foot"><span>↑ ↓ to move</span><span>Enter to run</span><span>Esc to close</span></div></div>';
  document.body.appendChild(box);
  const inp = $('input', box), list = $('.cmdk__list', box), btn = $('#cmdkBtn');
  let shown = [], sel = 0, lastFocus = null;
  const render = () => {
    const words = inp.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    shown = CMDS.filter(([c, d]) => words.every(w => (c + ' ' + d).toLowerCase().includes(w)));
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = shown.length ? shown.map(([c, d], i) => `<li role="option" id="cmdk-${i}" aria-selected="${i === sel}"><code>${c}</code><span>${d}</span></li>`).join('') : '<li class="cmdk__empty" role="option" aria-disabled="true">No match. Try "mx", "rv32i" or "resume".</li>';
    inp.setAttribute('aria-activedescendant', shown.length ? 'cmdk-' + sel : '');
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  };
  const open = () => { lastFocus = document.activeElement; inp.value = ''; sel = 0; render(); box.classList.add('open'); setTimeout(() => inp.focus(), 20); };
  const close = () => { box.classList.remove('open'); (lastFocus && lastFocus.focus) ? lastFocus.focus() : null; };
  const run = i => {
    const c = shown[i]; if (!c) return; close(); const t = c[2];
    if (t.startsWith('#')) setTimeout(() => go(t), 60);
    else if (t.startsWith('mailto:')) location.href = t;
    else window.open(t, '_blank', 'noopener');
  };
  inp.addEventListener('input', () => { sel = 0; render(); });
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, shown.length); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(1, shown.length); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') e.preventDefault();
  });
  list.addEventListener('click', e => { const li = e.target.closest('li[id]'); if (li) run(+li.id.split('-')[1]); });
  list.addEventListener('mousemove', e => { const li = e.target.closest('li[id]'); if (li) { const i = +li.id.split('-')[1]; if (i !== sel) { sel = i; render(); } } });
  box.addEventListener('mousedown', e => { if (e.target === box) close(); });
  btn?.addEventListener('click', open);
  addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); box.classList.contains('open') ? close() : open(); }
    else if (e.key === '/' && !typing && !box.classList.contains('open')) { e.preventDefault(); open(); }
  });
  if (btn && /Mac|iPhone|iPad/.test(navigator.platform)) { const k = btn.querySelector('kbd'); if (k) k.textContent = '⌘K'; btn.setAttribute('aria-label', 'Open command palette (Command K)'); }

  /* ---------- 3. probe: hover a diagram block, read its own labels (fine pointers only) ---------- */
  if (matchMedia('(pointer: fine)').matches) {
    html.classList.add('probing');
    const tip = document.createElement('div'); tip.className = 'probe'; tip.setAttribute('aria-hidden', 'true'); document.body.appendChild(tip);
    let node = null, px = 0, py = 0, q = false;
    const place = () => { q = false; const r = tip.getBoundingClientRect(); const x = Math.min(px + 16, innerWidth - r.width - 8), y = py + 20 + r.height > innerHeight ? py - r.height - 12 : py + 20; tip.style.transform = `translate(${x}px, ${y}px)`; };
    document.addEventListener('pointermove', e => {
      const n = e.target.closest && e.target.closest('.dg .node');
      if (n !== node) {
        node?.classList.remove('probed'); node = n;
        if (n) {
          const t = n.querySelector('.t')?.textContent || '', f = n.querySelector('.f')?.textContent || '', s = $$('.s', n).map(x => x.textContent).join(' · ');
          const acc = getComputedStyle(n.closest('.nt-proj') || html).getPropertyValue('--n-red').trim();
          tip.style.setProperty('--acc', acc || '#FFB547');
          tip.innerHTML = `<b>probe ▸</b> ${[t, f].filter(Boolean).join('  ')}${s ? '<br>' + s : ''}`;
          n.classList.add('probed'); tip.classList.add('on');
        } else tip.classList.remove('on');
      }
      if (node) { px = e.clientX; py = e.clientY; if (!q) { q = true; requestAnimationFrame(place); } }
    }, { passive: true });
    addEventListener('scroll', () => { if (node) { node.classList.remove('probed'); node = null; tip.classList.remove('on'); } }, { passive: true });
  }

  /* ---------- 5. ring card grows into its project (View Transitions; plain smooth scroll where unsupported) ---------- */
  if (document.startViewTransition) document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('.rc');
    if (!a || rm() || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href'), dest = document.querySelector(id + ' .dots') || document.querySelector(id); if (!dest) return;
    e.preventDefault(); e.stopPropagation();
    a.style.viewTransitionName = 'morph';
    const vt = document.startViewTransition(() => { a.style.viewTransitionName = ''; dest.style.viewTransitionName = 'morph'; go(id, true); });
    vt.finished.finally(() => { dest.style.viewTransitionName = ''; });
  }, true);
})();

/* ---------- 4. real waveform viewer: tb_systolic.v test 1, extracted from the VCD (assets/wave_systolic.json) ---------- */
(() => {
  const fig = document.getElementById('realwave'); if (!fig) return;
  const box = fig.querySelector('.wf'), svg = fig.querySelector('.wf__svg'), range = fig.querySelector('input'), out = fig.querySelector('.wf__t');
  const LW = 92, LH = 28, PAD = 8;
  let D = null, W = 0;
  const sgn = (v, b) => v == null ? null : (b > 1 && v >= 2 ** (b - 1) ? v - 2 ** b : v);
  const at = (L, t) => { let v = L.init; for (const [tt, vv] of L.ch) { if (tt <= t) v = vv; else break; } return sgn(v, L.bits); };
  const X = t => LW + (W - LW - 8) * t / (D.t1 - D.t0);
  function draw() {
    if (!D) return; W = box.clientWidth; if (!W) return;
    const T = D.t1 - D.t0, H = PAD * 2 + D.lanes.length * LH;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H);
    let s = '';
    for (let t = D.period / 2; t <= T; t += D.period) s += `<line x1="${X(t)}" x2="${X(t)}" y1="${PAD}" y2="${H - PAD}" class="wf__grid"/>`;
    D.lanes.forEach((L, i) => {
      const y = PAD + i * LH, hi = y + 5, lo = y + LH - 7, mid = (hi + lo) / 2;
      s += `<text x="0" y="${mid + 4}" class="wf__n">${L.name}</text>`;
      if (L.bits === 1) {
        let d = `M${X(0)} ${L.init ? hi : lo}`;
        for (const [t, v] of L.ch) d += ` H${X(t)} V${v ? hi : lo}`;
        s += `<path d="${d} H${X(T)}" class="wf__bit"/>`;
      } else {
        const seg = []; let st = 0, v = L.init;
        for (const [t, vv] of L.ch) { seg.push([st, t, v]); st = t; v = vv; }
        seg.push([st, T, v]);
        for (const [a, b, val] of seg) {
          const x0 = X(a), x1 = X(b), k = Math.min(4, (x1 - x0) / 2), txt = String(sgn(val, L.bits));
          s += `<path d="M${x0} ${mid}L${x0 + k} ${hi}H${x1 - k}L${x1} ${mid}L${x1 - k} ${lo}H${x0 + k}Z" class="wf__bus${val === 0 ? ' z' : ''}"/>`;
          if (x1 - x0 > txt.length * 7 + 12) s += `<text x="${(x0 + x1) / 2}" y="${mid + 4}" text-anchor="middle" class="wf__v">${txt}</text>`;
        }
      }
    });
    s += `<line class="wf__cur" x1="0" x2="0" y1="${PAD - 4}" y2="${H - PAD + 4}"/>`;
    svg.innerHTML = s; cursor();
  }
  function cursor() {
    if (!D || !W) return;
    const t = (D.t1 - D.t0) * range.value / 1000;
    svg.querySelector('.wf__cur')?.setAttribute('transform', `translate(${X(t)} 0)`);
    out.innerHTML = `<b>${(t / 1000).toFixed(1)} ns</b>&nbsp; ` + D.lanes.filter(L => L.bits > 1).map(L => `${L.name} = ${at(L, t)}`).join(' · ');
  }
  const fromPointer = e => { const r = svg.getBoundingClientRect(), x = e.clientX - r.left; range.value = Math.round(Math.min(1, Math.max(0, (x - LW) / (W - LW - 8))) * 1000); cursor(); };
  svg.addEventListener('pointerdown', e => { fromPointer(e); svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointermove', e => { if (svg.hasPointerCapture(e.pointerId)) fromPointer(e); });
  range.addEventListener('input', cursor);
  addEventListener('resize', () => requestAnimationFrame(draw));
  fetch('assets/wave_systolic.json').then(r => r.json()).then(j => { D = j; draw(); }).catch(() => { fig.hidden = true; });
})();

/* ---------- 2b. live CI status: GitHub's official workflow badges (served by github.com, live, no API limits) ---------- */
(() => {
  const WF = { 'mx-conformance': 'conformance.yml', 'riscv-pipelined-core': 'test.yml', 'systolic-mac-array': 'test.yml' };
  document.querySelectorAll('.nt-proj .nt-meta').forEach(m => {
    const repo = m.querySelector('code')?.textContent.trim(), wf = WF[repo]; if (!wf) return;
    const base = `https://github.com/chinmaymahananda/${repo}/actions/workflows/${wf}`;
    const a = document.createElement('a'); a.className = 'ci'; a.href = base; a.target = '_blank'; a.rel = 'noopener';
    const img = new Image(); img.src = base + '/badge.svg?branch=main'; img.alt = `CI status for ${repo}`; img.height = 20; img.decoding = 'async'; img.loading = 'lazy';
    img.onerror = () => a.remove();
    a.appendChild(img); m.appendChild(a);
  });
})();

/* ---------- 9b. print: counters show their final values (they count up on screen) ---------- */
(() => {
  const fill = () => document.querySelectorAll('[data-count]').forEach(b => {
    const n = +b.dataset.count; b.textContent = b.hasAttribute('data-sep') ? n.toLocaleString('en-US') : String(n);
  });
  addEventListener('beforeprint', fill);
  if (matchMedia) { const mq = matchMedia('print'); mq.addEventListener ? mq.addEventListener('change', e => e.matches && fill()) : mq.addListener(e => e.matches && fill()); }
})();
