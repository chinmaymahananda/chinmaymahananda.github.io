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

/* ---------- 2b. live CI status: shields.io workflow badges (live, short 'CI' label, no cookies, no API limits on visitors) ---------- */
(() => {
  const WF = { 'mx-conformance': 'conformance.yml', 'riscv-pipelined-core': 'test.yml', 'systolic-mac-array': 'test.yml' };
  document.querySelectorAll('.nt-proj .nt-meta').forEach(m => {
    const repo = m.querySelector('code')?.textContent.trim(), wf = WF[repo]; if (!wf) return;
    const base = `https://github.com/chinmaymahananda/${repo}/actions/workflows/${wf}`;
    const a = document.createElement('a'); a.className = 'ci'; a.href = base; a.target = '_blank'; a.rel = 'noopener';
    const img = new Image(); img.src = `https://img.shields.io/github/actions/workflow/status/chinmaymahananda/${repo}/${wf}?branch=main&label=CI`; img.alt = `CI status for ${repo}`; img.height = 20; img.decoding = 'async'; img.loading = 'lazy';
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
