/* nothing.js: animations for the Nothing-style section below the hero.
   Everything is scroll-scrubbed: progress p in [0,1] per element, recomputed each frame. */
(() => {
  const reduce = (() => { try { return localStorage.getItem('motion') === 'off'; } catch (e) { return false; } })(); // user switch overrides the OS setting
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const smooth = (a, b, v) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const mk = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const lite = matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // scroll progress of an element through the viewport
  const progR = r => clamp((VH * .92 - r.top) / (r.height * .7 + VH * .4));
  const nearR = r => r.bottom > -200 && r.top < VH + 200;
  let VH = innerHeight; addEventListener('resize', () => { VH = innerHeight; });
  const jobs = [];
  const job = (el, fn) => jobs.push({ el, fn });

  /* ---------- 1. dot-matrix headings that assemble from scattered dots ---------- */
  function dotHeading(h) {
    const c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true'); h.appendChild(c);
    const ctx = c.getContext('2d'); h.classList.add('js-dots');
    let pts = [], W = 0, H = 0, dpr = 1, gap = 4, lastP = -1, frameN = 0, builtW = 0;
    function build() {
      const r = h.getBoundingClientRect(); W = Math.ceil(r.width); H = Math.ceil(r.height) + 6; builtW = innerWidth;
      dpr = Math.min(2, devicePixelRatio || 1);
      c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
      const fs = parseFloat(getComputedStyle(h).fontSize);
      gap = Math.max(3, Math.round(fs / 15));
      const off = document.createElement('canvas'); off.width = W; off.height = H; const o = off.getContext('2d');
      o.fillStyle = '#fff'; o.textBaseline = 'middle'; o.textAlign = 'center';
      // draw each character at the exact box the browser laid it out in, so wrapping matches the DOM
      const tn = [...h.childNodes].find(n => n.nodeType === 3); if (!tn) return;
      const range = document.createRange();
      for (let i = 0; i < tn.length; i++) {
        const ch = tn.data[i]; if (ch === ' ') continue;
        range.setStart(tn, i); range.setEnd(tn, i + 1);
        const b = range.getBoundingClientRect(); if (!b.width) continue;
        let f = fs * 1.02; o.font = `700 ${f}px "Space Grotesk", sans-serif`;
        const m = o.measureText(ch).width; if (m > b.width * 1.05) { f *= b.width * 1.05 / m; o.font = `700 ${f}px "Space Grotesk", sans-serif`; }
        o.fillText(ch, b.left - r.left + b.width / 2, b.top - r.top + b.height * .52);
      }
      const img = o.getImageData(0, 0, W, H).data; pts = [];
      for (let y = gap / 2; y < H; y += gap) for (let x = gap / 2; x < W; x += gap) {
        if (img[((y | 0) * W + (x | 0)) * 4 + 3] > 110) {
          const ang = rnd() * 6.283, dist = 120 + rnd() * Math.max(W, 400) * .6;
          pts.push({ x, y, sx: x + Math.cos(ang) * dist, sy: y + Math.sin(ang) * dist * .6, d: rnd(), red: rnd() < .035, tw: rnd() * 6.28 });
        }
      }
      lastP = -1;
    }
    const BK = 8; // alpha buckets
    function draw(p, t) {
      const settled = p >= .999 || reduce;
      // once settled, the twinkle only needs ~30 fps
      frameN++; if (settled && lastP >= .999 && (lite || (frameN & 1))) return;
      lastP = p;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const r = gap * .36, paths = [];
      for (let b = 0; b < BK * 2; b++) paths.push(new Path2D());
      for (const q of pts) {
        const k = reduce ? 1 : ease(clamp(p * 1.7 - q.d * .7));
        const x = q.sx + (q.x - q.sx) * k, y = q.sy + (q.y - q.sy) * k;
        let a = .15 + .85 * k;
        if (k >= 1 && !reduce && !lite) a *= .82 + .18 * Math.sin(t * 2.2 + q.tw);
        const b = Math.min(BK - 1, (a * BK) | 0) + (q.red ? BK : 0);
        paths[b].moveTo(x + r, y); paths[b].arc(x, y, r, 0, 6.283);
      }
      for (let b = 0; b < BK * 2; b++) { ctx.globalAlpha = ((b % BK) + .5) / BK; ctx.fillStyle = b >= BK ? '#D71921' : '#26282D'; ctx.fill(paths[b]); }
      ctx.globalAlpha = 1;
    }
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(() => { build(); job(h, (p, t) => draw(clamp(p * 1.25), t)); });
    let rt; addEventListener('resize', () => { if (innerWidth === builtW) return; clearTimeout(rt); rt = setTimeout(build, 150); });
  }
  $$('[data-dots]').forEach(dotHeading);

  /* ---------- 2. component diagrams that draw themselves ---------- */
  function diagram(svg, spec) {
    const els = [], pkts = [];
    let maxO = 0;
    (spec.frames || []).forEach(f => {
      mk('rect', { x: f.x, y: f.y, width: f.w, height: f.h, rx: 18, class: 'frame' }, svg);
      if (f.t) { const t = mk('text', { x: f.x + 16, y: f.y + f.h - 12, class: 'lbl' }, svg); t.textContent = f.t; }
    });
    (spec.text || []).forEach(s => { const t = mk('text', { x: s.x, y: s.y, class: s.c || 'lbl', 'text-anchor': s.a || 'start' }, svg); t.textContent = s.t; });
    (spec.wires || []).forEach(w => {
      const d = 'M' + w.p.map(q => q.join(' ')).join(' L');
      const path = mk('path', { d, class: 'wire' + (w.red ? ' red' : '') + (w.dash ? ' dash' : '') }, svg);
      const len = path.getTotalLength();
      if (!w.dash) { path.style.strokeDasharray = len; path.style.strokeDashoffset = len; }
      else path.style.opacity = 0;
      const [x2, y2] = w.p[w.p.length - 1], [x1, y1] = w.p[w.p.length - 2];
      const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      const arr = w.noArrow ? null : mk('path', { d: 'M0 0 L-9 -4.5 L-9 4.5 Z', class: 'arrow' + (w.red ? ' red' : ''), transform: `translate(${x2} ${y2}) rotate(${ang})` }, svg);
      if (arr) arr.style.opacity = 0;
      let lbl = null;
      if (w.l) { lbl = mk('text', { x: w.l[0], y: w.l[1], class: 'lbl' + (w.red ? ' red' : ''), 'text-anchor': w.l[3] || 'start' }, svg); lbl.textContent = w.l[2]; lbl.style.opacity = 0; }
      els.push({ kind: 'w', o: w.o, path, len, arr, lbl, dash: w.dash });
      if (!w.dash && w.pkt !== false) { const c = mk('circle', { r: w.red ? 4.5 : 3.6, class: 'pkt' + (w.red ? ' red' : '') }, svg); c.style.opacity = 0; const S = []; for (let i = 0; i <= 96; i++) { const q = path.getPointAtLength(len * i / 96); S.push(q.x, q.y); }
        pkts.push({ c, S, len, o: w.o, ph: rnd(), sp: .32 + rnd() * .25 }); }
      maxO = Math.max(maxO, w.o);
    });
    (spec.nodes || []).forEach(n => {
      const g = mk('g', { class: 'node' + (n.mine ? ' mine' : '') + (n.c ? ' ' + n.c : '') }, svg);
      mk('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: n.r ?? 14 }, g);
      let y = n.y + 27;
      if (n.t) { const t = mk('text', { x: n.x + 16, y, class: 't' }, g); t.textContent = n.t; y += 19; }
      if (n.f) { const t = mk('text', { x: n.x + 16, y, class: 'f' }, g); t.textContent = n.f; y += 19; }
      (n.s || []).forEach(s => { const t = mk('text', { x: n.x + 16, y, class: 's' }, g); t.textContent = s; y += 17; });
      if (n.v) { const t = mk('text', { x: n.x + n.w / 2, y: n.y + n.h / 2 + 5, class: 'lbl', 'text-anchor': 'middle', transform: `rotate(-90 ${n.x + n.w / 2} ${n.y + n.h / 2})` }, g); t.textContent = n.v; }
      els.push({ kind: 'n', o: n.o, g }); maxO = Math.max(maxO, n.o);
    });
    // nodes render above wires
    els.filter(e => e.kind === 'n').forEach(e => svg.appendChild(e.g));
    pkts.forEach(k => svg.appendChild(k.c));
    const steps = maxO + 1.6;
    return (p, t) => {
      const s = (reduce ? 1 : p) * steps;
      for (const e of els) {
        const l = clamp(s - e.o);
        if (e.last === l) continue; e.last = l;
        if (e.kind === 'n') e.g.classList.toggle('on', l > .05);
        else {
          if (e.dash) e.path.style.opacity = l; else e.path.style.strokeDashoffset = e.len * (1 - l);
          if (e.arr) e.arr.style.opacity = l > .95 ? 1 : 0;
          if (e.lbl) e.lbl.style.opacity = l;
        }
      }
      for (const k of pkts) {
        const on = s - k.o >= 1;
        if (k.on !== on) { k.c.style.opacity = on ? 1 : 0; k.on = on; }
        if (on) { const u = reduce ? .5 : (t * k.sp + k.ph) % 1, f = u * 96, i = f | 0, a = f - i, S = k.S, j = Math.min(96, i + 1);
          k.c.setAttribute('cx', (S[i * 2] + (S[j * 2] - S[i * 2]) * a).toFixed(1)); k.c.setAttribute('cy', (S[i * 2 + 1] + (S[j * 2 + 1] - S[i * 2 + 1]) * a).toFixed(1)); }
      }
    };
  }

  // left-middle / right-middle helpers keep the specs readable
  const SPECS = {
    /* mxgold: function names and files verified against the repo */
    mx: {
      nodes: [
        { x: 30, y: 205, w: 180, h: 96, t: 'FP32 block', s: ['16 or 32 values', 'per BlockFormat'], o: 0 },
        { x: 260, y: 110, w: 200, h: 96, t: 'select_scale()', f: 'block.py', s: ['shared block scale'], o: 1 },
        { x: 260, y: 300, w: 200, h: 96, t: 'quantize_block()', f: 'block.py', s: ['element by element'], o: 1 },
        { x: 510, y: 110, w: 200, h: 96, t: 'e8m0_encode()', f: 'formats.py', s: ['8-bit scale bits'], o: 2 },
        { x: 510, y: 300, w: 200, h: 96, t: 'encode()', f: 'formats.py', s: ['E4M3 E5M2 E2M1 INT8'], o: 2 },
        { x: 760, y: 205, w: 180, h: 96, t: 'bit patterns', s: ['raw ints, not floats', '−0.0 ≠ +0.0'], o: 3 },
        { x: 990, y: 110, w: 180, h: 96, t: 'dot_product()', f: 'block.py', s: ['clamped accumulator'], o: 4 },
        { x: 990, y: 300, w: 180, h: 96, t: 'conformance', f: 'test_conformance.py', s: ['43 / 43 pass'], o: 5 },
        { x: 30, y: 438, w: 1100, h: 58, t: 'Policy', s: ['policy.py: overflow, rounding, subnormals, accumulation order, scale selection'], o: 6, c: 'pol' }
      ],
      wires: [
        { p: [[210, 240], [235, 240], [235, 158], [260, 158]], o: 1 },
        { p: [[210, 266], [235, 266], [235, 348], [260, 348]], o: 1 },
        { p: [[360, 206], [360, 300]], o: 2, l: [370, 258, 'scale'] },
        { p: [[460, 158], [510, 158]], o: 2 },
        { p: [[460, 348], [510, 348]], o: 2 },
        { p: [[710, 158], [735, 158], [735, 240], [760, 240]], o: 3 },
        { p: [[710, 348], [735, 348], [735, 266], [760, 266]], o: 3 },
        { p: [[940, 240], [965, 240], [965, 158], [990, 158]], o: 4 },
        { p: [[940, 266], [965, 266], [965, 348], [990, 348]], o: 5 },
        { p: [[1080, 206], [1080, 300]], o: 5, red: true, l: [1090, 258, 'expected'] },
        { p: [[360, 438], [360, 396]], o: 6, red: true, dash: true },
        { p: [[610, 438], [610, 396]], o: 6, red: true, dash: true },
        { p: [[1130, 467], [1185, 467], [1185, 158], [1170, 158]], o: 6, red: true, dash: true }
      ]
    },
    /* RV32I: stages and hazard handling from docs/ARCHITECTURE.md */
    rv: {
      text: [
        { x: 115, y: 34, t: 'IF', c: 'stage', a: 'middle' }, { x: 450, y: 34, t: 'EX', c: 'stage', a: 'middle' },
        { x: 787, y: 34, t: 'MEM', c: 'stage', a: 'middle' }, { x: 1050, y: 34, t: 'WB', c: 'stage', a: 'middle' }
      ],
      nodes: [
        { x: 30, y: 120, w: 170, h: 70, t: 'PC', s: ['PC+4 or target'], o: 0 },
        { x: 30, y: 230, w: 170, h: 80, t: 'imem.v', s: ['instruction ROM'], o: 0 },
        { x: 225, y: 90, w: 26, h: 300, r: 8, v: 'IF/EX', o: 1 },
        { x: 275, y: 100, w: 160, h: 64, t: 'decode', o: 1 },
        { x: 275, y: 185, w: 160, h: 64, t: 'regfile.v', s: ['read'], o: 1 },
        { x: 275, y: 270, w: 160, h: 64, t: 'imm gen', o: 1 },
        { x: 460, y: 115, w: 165, h: 100, t: 'alu.v', s: ['operand muxes', 'take forwards'], o: 2 },
        { x: 460, y: 245, w: 165, h: 64, t: 'branch cmp', s: ['BEQ BNE JAL'], o: 2 },
        { x: 650, y: 90, w: 26, h: 300, r: 8, v: 'EX/MEM', o: 3 },
        { x: 700, y: 170, w: 175, h: 90, t: 'dmem.v', s: ['LW / SW'], o: 3 },
        { x: 900, y: 90, w: 26, h: 300, r: 8, v: 'MEM/WB', o: 4 },
        { x: 950, y: 170, w: 210, h: 90, t: 'writeback mux', s: ['ALU, load, or PC+4'], o: 4 },
        { x: 400, y: 380, w: 250, h: 70, t: 'hazard unit', s: ['load-use: stall 1 cycle'], o: 6, c: 'hot' }
      ],
      wires: [
        { p: [[115, 190], [115, 230]], o: 0 },
        { p: [[200, 270], [225, 270]], o: 1 },
        { p: [[251, 132], [275, 132]], o: 1 }, { p: [[251, 217], [275, 217]], o: 1 }, { p: [[251, 302], [275, 302]], o: 1 },
        { p: [[435, 132], [447, 132], [447, 150], [460, 150]], o: 2 },
        { p: [[435, 217], [447, 217], [447, 180], [460, 180]], o: 2 },
        { p: [[435, 302], [452, 302], [452, 277], [460, 277]], o: 2 },
        { p: [[625, 165], [650, 165]], o: 3 },
        { p: [[676, 215], [700, 215]], o: 3 },
        { p: [[875, 215], [900, 215]], o: 4 },
        { p: [[926, 215], [950, 215]], o: 4 },
        { p: [[663, 90], [663, 70], [560, 70], [560, 115]], o: 5, red: true, l: [672, 66, 'forward from EX/MEM'] },
        { p: [[913, 90], [913, 52], [520, 52], [520, 115]], o: 5, red: true, l: [922, 48, 'forward from MEM/WB'] },
        { p: [[1055, 260], [1055, 478], [263, 478], [263, 236], [275, 236]], o: 5, l: [1065, 470, 'writeback'] },
        { p: [[543, 309], [543, 352], [16, 352], [16, 145], [30, 145]], o: 6, red: true, dash: true, l: [24, 344, 'taken branch: squash'] },
        { p: [[400, 415], [8, 415], [8, 160], [30, 160]], o: 7, red: true, dash: true, l: [24, 408, 'stall: hold PC and IF/EX'] },
        { p: [[650, 415], [663, 415], [663, 390]], o: 7, red: true, dash: true, l: [690, 412, 'bubble into EX/MEM'] }
      ]
    },
    /* PE: ports and widths from rtl/pe.v */
    pe: {
      nodes: [{ x: 170, y: 130, w: 220, h: 150, t: 'pe', f: 'rtl/pe.v', s: ['acc ← acc + a × b', 'when en; clear zeroes it', 'a and b move on next clock'], o: 1 }],
      wires: [
        { p: [[20, 175], [170, 175]], o: 0, l: [20, 165, 'a_in [7:0]'] },
        { p: [[280, 16], [280, 130]], o: 0, l: [292, 40, 'b_in [7:0]'] },
        { p: [[390, 175], [540, 175]], o: 2, l: [400, 165, 'a_out, +1 clk'] },
        { p: [[280, 280], [280, 404]], o: 2, l: [292, 390, 'b_out, +1 clk'] },
        { p: [[390, 250], [540, 250]], o: 3, red: true, l: [400, 240, 'c_out [31:0]'] }
      ],
      text: [{ x: 20, y: 330, t: 'DATA_WIDTH = 8', c: 'lbl' }, { x: 20, y: 350, t: 'ACC_WIDTH = 32', c: 'lbl' }]
    },
    /* CNN chain: modules and shapes from cnn-accelerator/README.md */
    cnn: {
      frames: [{ x: 6, y: 8, w: 1188, h: 364, t: 'top_accelerator.v: start / done handshake, chain_mem.v between stages' }],
      nodes: [
        { x: 155, y: 26, w: 890, h: 50, t: 'mac_unit.v', s: [], o: 0 },
        { x: 18, y: 130, w: 117, h: 100, t: 'image', s: ['8 × 8 INT8'], o: 1 },
        { x: 155, y: 130, w: 175, h: 100, t: 'Conv1', f: 'conv1_controller.v', s: ['4 ch, 3 × 3', '8×8 → 6×6'], o: 2 },
        { x: 350, y: 130, w: 150, h: 100, t: 'requant', f: 'requant_bridge.v', s: ['ReLU, shift,', 'clamp'], o: 3 },
        { x: 520, y: 130, w: 175, h: 100, t: 'Conv2', f: 'conv2_controller.v', s: ['4 → 8 ch, 3 × 3', '→ 4×4'], o: 4 },
        { x: 715, y: 130, w: 150, h: 100, t: 'requant', f: 'requant_bridge.v', s: ['ReLU, shift,', 'clamp'], o: 5 },
        { x: 885, y: 130, w: 160, h: 100, t: 'FC', f: 'fc_controller.v', s: ['128 → 10'], o: 6 },
        { x: 1065, y: 130, w: 117, h: 100, t: 'logits', s: ['10 classes'], o: 7, c: 'hot' },
        { x: 155, y: 270, w: 175, h: 50, t: 'conv1_mem.v', o: 2 },
        { x: 520, y: 270, w: 175, h: 50, t: 'conv2_mem.v', o: 4 },
        { x: 885, y: 270, w: 160, h: 50, t: 'fc_mem.v', o: 6 }
      ],
      wires: [
        { p: [[135, 180], [155, 180]], o: 2 }, { p: [[330, 180], [350, 180]], o: 3 }, { p: [[500, 180], [520, 180]], o: 4 },
        { p: [[695, 180], [715, 180]], o: 5 }, { p: [[865, 180], [885, 180]], o: 6 }, { p: [[1045, 180], [1065, 180]], o: 7, red: true },
        { p: [[242, 76], [242, 130]], o: 2, dash: true }, { p: [[607, 76], [607, 130]], o: 4, dash: true }, { p: [[965, 76], [965, 130]], o: 6, dash: true },
        { p: [[242, 270], [242, 230]], o: 2, pkt: false }, { p: [[607, 270], [607, 230]], o: 4, pkt: false }, { p: [[965, 270], [965, 230]], o: 6, pkt: false }
      ],
      text: [{ x: 600, y: 56, t: 'INT8 × INT8 → INT32', c: 'lbl', a: 'middle' }]
    },
    /* card scanner: pipeline from the repo README; my part is marked */
    poke: {
      nodes: [
        { x: 15, y: 50, w: 150, h: 100, t: 'photo', s: ['smartphone'], o: 0 },
        { x: 185, y: 50, w: 150, h: 100, t: 'YOLO11n OBB', s: ['detect card'], o: 1 },
        { x: 355, y: 50, w: 150, h: 100, t: 'warp', s: ['perspective', 'correction'], o: 2 },
        { x: 525, y: 50, w: 150, h: 100, t: 'composite', s: ['gray background'], o: 3 },
        { x: 695, y: 50, w: 150, h: 100, t: 'EfficientNet', s: ['B0, 128-d', 'embedding'], o: 4 },
        { x: 865, y: 50, w: 150, h: 100, t: 'torch.cdist', s: ['vs reference DB'], o: 5 },
        { x: 1035, y: 50, w: 150, h: 100, t: 'card ID', s: ['558 cards'], o: 6 },
        { x: 695, y: 200, w: 490, h: 76, t: 'App/server.py', s: ['FastAPI app. My part: model into the app interface'], o: 7, mine: true }
      ],
      wires: [
        { p: [[165, 100], [185, 100]], o: 1 }, { p: [[335, 100], [355, 100]], o: 2 }, { p: [[505, 100], [525, 100]], o: 3 },
        { p: [[675, 100], [695, 100]], o: 4 }, { p: [[845, 100], [865, 100]], o: 5 }, { p: [[1015, 100], [1035, 100]], o: 6 },
        { p: [[940, 150], [940, 200]], o: 7, red: true }, { p: [[1110, 150], [1110, 200]], o: 7, red: true }
      ]
    }
  };
  $$('[data-diagram]').forEach(fig => {
    const svg = fig.querySelector('svg.dg'), spec = SPECS[fig.dataset.diagram];
    if (svg && spec) { const up = diagram(svg, spec); job(fig, (p, t) => up(clamp(p * 1.15), t)); }
  });

  /* ---------- 3. flow chains: a red head walks the chain ---------- */
  $$('[data-flow]').forEach(ol => {
    const li = $$('li', ol);
    job(ol, p => {
      const n = reduce ? li.length : Math.floor(clamp(p * 1.3) * (li.length + .001));
      li.forEach((e, i) => { e.classList.toggle('on', i < n); e.classList.toggle('head', i === n - 1); });
    });
  });

  /* ---------- 4. stats count up once, in dot-matrix digits ---------- */
  $$('[data-count]').forEach(b => {
    const to = +b.dataset.count, sep = b.hasAttribute('data-sep'), fmt = v => sep ? v.toLocaleString('en-US') : String(v);
    let t0 = null;
    if (reduce) return;
    b.textContent = fmt(0);
    job(b, (p, t, skipped) => {
      if (skipped) { b.textContent = fmt(to); t0 = -1e9; return; }
      if (t0 === null && p > .15) t0 = t;
      if (t0 === null) return;
      const k = ease(clamp((t - t0) / 1.4));
      b.textContent = fmt(Math.round(to * k));
    });
  });

  /* ---------- 5. LED PE grid: PE(i,j) fires at cycle i+j ---------- */
  const led = document.getElementById('led');
  if (led) {
    const ctx = led.getContext('2d'); let W = 0, H = 0, dpr = 1;
    const size = () => { const r = led.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; led.width = W * dpr; led.height = H * dpr; };
    size(); addEventListener('resize', size);
    const N = 8, LOOP = 2 * N + 3, D = .42;
    job(led, (p, t) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const m = Math.min(W, H), cell = m / (N + 2.2), ox = (W - cell * N) / 2 + cell * .4, oy = (H - cell * N) / 2 + cell * .4;
      const c = reduce ? 6 : (t / D) % LOOP;
      const LB = 6, bw = [], br = new Path2D();
      for (let b = 0; b < LB; b++) bw.push(new Path2D());
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const d = c - (i + j), f = Math.exp(-d * d * 1.6), lit = f > .08 ? f : 0;
        const x = ox + j * cell + cell / 2, y = oy + i * cell + cell / 2, rr = cell * .075 + lit * cell * .03;
        const b = Math.min(LB - 1, ((.14 + .86 * lit) * LB) | 0);
        // 3x3 sub-dots per PE: an LED cluster like Nothing's glyphs; the centre goes red at peak
        for (let a = -1; a <= 1; a++) for (let e = -1; e <= 1; e++) {
          const P = lit > .6 && a === 0 && e === 0 ? br : bw[b];
          const cx = x + a * cell * .22, cy = y + e * cell * .22; P.moveTo(cx + rr, cy); P.arc(cx, cy, rr, 0, 6.283);
        }
      }
      for (let b = 0; b < LB; b++) { ctx.globalAlpha = (b + .5) / LB; ctx.fillStyle = '#26282D'; ctx.fill(bw[b]); }
      ctx.globalAlpha = 1; ctx.fillStyle = '#D71921'; ctx.fill(br);
      // operands entering: activations from the left, weights from the top, each lane one cycle later
      ctx.globalAlpha = 1;
      for (let k = 0; k < N; k++) {
        const s = c - k;
        if (s > -1 && s < N) {
          ctx.fillStyle = '#D71921'; ctx.beginPath(); ctx.arc(ox + (s + .5) * cell - cell * .5, oy + k * cell + cell * .5 - cell * .42, cell * .06, 0, 6.283); ctx.fill();
          ctx.fillStyle = '#26282D'; ctx.beginPath(); ctx.arc(ox + k * cell + cell * .5 - cell * .42, oy + (s + .5) * cell - cell * .5, cell * .06, 0, 6.283); ctx.fill();
        }
      }
    });
  }

  /* ---------- 6. halftone wipe: the white section eats into the navy as growing dots ---------- */
  let wipeFn = null;
  const ntEl = document.getElementById('nt');
  if (ntEl && !reduce) {
    const cv = document.createElement('canvas'); cv.id = 'wipe'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
    const cx = cv.getContext('2d'); let cw = 0, ch = 0, cd = 1, drawn = false;
    const sz = () => { cd = Math.min(2, devicePixelRatio || 1); cw = innerWidth; ch = innerHeight; cv.width = cw * cd; cv.height = ch * cd; };
    sz(); addEventListener('resize', sz);
    const heroText = document.querySelector('.hero__text'), heroLbl = document.getElementById('labels');
    let lastFade = -1;
    wipeFn = (t, ntTop) => {
      const band = Math.max(240, ch * .55), y0 = ntTop - band;
      const fade = Math.round(clamp((ntTop - ch * .95) / (ch * .45)) * 100) / 100;
      if (fade !== lastFade) { lastFade = fade; if (heroText) heroText.style.opacity = fade; if (heroLbl) heroLbl.style.opacity = fade; }
      if (ntTop < -4 || y0 - 40 > ch) { if (drawn) { cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); drawn = false; } return; }
      drawn = true; cx.setTransform(cd, 0, 0, cd, 0, 0); cx.clearRect(0, 0, cw, ch);
      const g = cw < 700 ? 14 : 20, rMax = g * .74, W2 = new Path2D(), R2 = new Path2D();
      const top = Math.max(0, y0 - 40), bot = Math.min(ch, ntTop + 2);
      for (let y = Math.floor(top / g) * g + g / 2; y < bot; y += g) {
        const row = Math.round(y / g), off = (row & 1) ? g / 2 : 0;
        for (let x = off; x < cw + g; x += g) {
          // a slow double sine keeps the edge alive, like liquid filling the grid
          const wave = Math.sin(x * .012 + t * .9) * 18 + Math.sin(x * .031 - t * .6) * 9;
          const k = clamp((y - y0 - wave) / (band - 60));
          if (k <= 0) continue;
          const r = rMax * Math.pow(k, 1.35);
          const h = (((x | 0) * 73856093) ^ (row * 19349663)) >>> 0;
          const P = (h % 89 === 0 && k < .85) ? R2 : W2;
          P.moveTo(x + r, y); P.arc(x, y, r, 0, 6.283);
        }
      }
      cx.fillStyle = '#FFFFFF'; cx.fill(W2); cx.fillRect(0, ntTop - g * 1.2, cw, g * 1.2 + 4); cx.fillStyle = '#D71921'; cx.fill(R2);
    };
  }

  /* ---------- 7. paragraphs light up word by word as you read ---------- */
  if (!reduce) $$('.nt-lede, .nt-sum, .nt-ask').forEach(p => {
    if (p.children.length) return; // only plain-text paragraphs
    const words = p.textContent.trim().split(/\s+/); p.textContent = '';
    const spans = words.map((w, i) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; p.append(s); if (i < words.length - 1) p.append(' '); s.style.opacity = .15; return s; });
    p.classList.add('reveal');
    const last = new Array(spans.length).fill(.15);
    job(p, (q, t, skipped) => {
      const lit = skipped ? 1e9 : clamp(q * 1.15) * (spans.length + 2);
      spans.forEach((s, i) => { const a = Math.round((.15 + .85 * clamp(lit - i)) * 50) / 50; if (a !== last[i]) { s.style.opacity = a; last[i] = a; } });
    });
  });

  /* ---------- 8. tilt-in: cards swing up from an angle and settle flat ---------- */
  if (!reduce) $$('.nt-stats > div, .nt-fig, .nt-cards > li, .nt-gaps > div, .nt-demo').forEach(el => {
    el.classList.add('tilt');
    const idx = [...el.parentNode.children].indexOf(el) % 4;
    let lastE = -1;
    job(el, (q, t, skipped) => {
      const e = skipped ? 1 : Math.round(ease(clamp(q * 1.9 - idx * .12)) * 500) / 500;
      if (e === lastE) return; lastE = e;
      if (e >= 1) { el.style.transform = 'none'; el.style.opacity = 1; return; }
      el.style.transform = `perspective(1400px) rotateX(${((1 - e) * 16).toFixed(2)}deg) translateY(${((1 - e) * 50).toFixed(1)}px) scale(${(.965 + .035 * e).toFixed(4)})`;
      el.style.opacity = (.25 + .75 * e).toFixed(3);
    });
  });

  /* ---------- 9. stacking cards: each Background cell pins, the next slides over it ---------- */
  const grid = document.querySelector('.nt-grid');
  if (grid && !reduce) {
    grid.classList.add('stack');
    const cells = $$('.nt-cell', grid), lastS = cells.map(() => -1);
    job(grid, () => {
      const rs = cells.map(c => c.getBoundingClientRect());
      cells.forEach((c, i) => {
        let k = 0;
        for (let j = i + 1; j < cells.length; j++) k += clamp(1 - (rs[j].top - rs[i].top) / (rs[i].height * .9));
        const s = Math.round((1 - .045 * k) * 1000) / 1000;
        if (s === lastS[i]) return; lastS[i] = s;
        c.style.transform = s < 1 ? `scale(${s})` : '';
        c.style.filter = k > .01 ? `brightness(${(1 - .05 * k).toFixed(3)})` : '';
      });
    });
  }

  /* ---------- 10. 3D project ring: four cards on a ring that turns as you scroll ---------- */
  const ring = document.getElementById('ring'), ringEl = document.getElementById('ringEl');
  if (ring && ringEl) {
    if (reduce) ring.classList.add('ring-static');
    else {
      const cards = $$('.rc', ringEl), pips = $$('.nt-ring__pips li', ring), num = document.getElementById('ringNum');
      let lastA = -1, lastIdx = -1, R = 0;
      const setR = () => {
        R = Math.round(ringEl.offsetWidth * .72);
        lastA = -1;
      };
      setR(); addEventListener('resize', setR);
      job(ring, (q, t, skipped, r) => {
        let a;
        if (skipped || !r) a = 270;
        else {
          const p = clamp(-r.top / Math.max(1, r.height - VH)), pos = p * 3.0001;
          const i = Math.min(2, Math.floor(pos)), f = pos - i;
          a = pos >= 3 ? 270 : (i + smooth(.2, .8, f)) * 90;   // hold on each card, then turn
        }
        const enter = r ? clamp(1 - r.top / VH) : 1;           // ring swings in as it arrives
        const sway = reduce ? 0 : Math.sin(t * .6) * 1.2;
        const key = Math.round((a + sway) * 20) / 20 + enter * 1000;
        if (key !== lastA) {
          lastA = key;
          const rx = (-7 + (1 - enter) * 18).toFixed(2), sc = (.82 + .18 * enter).toFixed(3), spin = -a + sway - (1 - enter) * 40;
          cards.forEach((c, k) => {
            const facing = Math.cos((k * 90 - a) * Math.PI / 180);
            // full transform per card: push back by R, tilt, turn to its slot, push out by R (the ring's radius)
            c.style.transform = `translateZ(${-R}px) rotateX(${rx}deg) rotateY(${(k * 90 + spin).toFixed(2)}deg) translateZ(${R}px) scale(${sc})`;
            c.style.zIndex = 100 + Math.round(facing * 100);
            // cards turned away are hidden outright: some engines ignore backface-visibility without preserve-3d
            c.style.opacity = facing > .02 ? (.12 + .88 * clamp(facing)).toFixed(3) : 0;
            c.style.visibility = facing > .02 ? 'visible' : 'hidden';
            c.style.pointerEvents = facing > .85 ? 'auto' : 'none';
            c.tabIndex = facing > .85 ? 0 : -1;
          });
        }
        const idx = Math.min(3, Math.round(a / 90));
        if (idx !== lastIdx) { lastIdx = idx; if (num) num.textContent = '0' + (idx + 1); pips.forEach((pp, k) => pp.classList.toggle('on', k === idx)); }
      });
    }
  }

  /* ---------- 11. signal trace: one red packet rides a circuit trace through every project ---------- */
  const trace = document.getElementById('trace'), work = document.getElementById('work');
  if (trace && work && !reduce) {
    const fill = document.getElementById('traceFill'), pkt = document.getElementById('tracePkt');
    const projs = $$('.nt-proj', work);
    let vias = [], tH = 0, lastF = -1, curF = 0, sig = '';
    const layout = () => {
      const s2 = projs.map(p => p.offsetTop + ':' + p.offsetHeight).join(',');
      if (s2 === sig) return; sig = s2;   // only rebuild when the layout really moved
      // offsetTop ignores transforms, so the tilt-ins can't skew the trace
      const y0 = projs[0].offsetTop, y1 = projs[projs.length - 1].offsetTop + projs[projs.length - 1].offsetHeight;
      tH = y1 - y0; trace.style.top = y0 + 'px'; trace.style.height = tH + 'px';
      vias.forEach(v => v.el.remove());
      vias = projs.map(pr => { const el = document.createElement('i'); el.className = 'via'; const y = pr.offsetTop - y0 + 6; el.style.top = y + 'px'; trace.appendChild(el); const on = curF >= y; el.classList.toggle('on', on); return { el, y, on }; });
      lastF = -1;
    };
    layout(); addEventListener('resize', layout); setInterval(layout, 2500);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    job(trace, (q, t, skipped, r) => {
      const f = skipped ? tH : Math.round(clamp(VH * .55 - (r ? r.top : 0), 0, tH));
      if (f === lastF) return; lastF = f; curF = f;
      fill.style.height = f + 'px'; pkt.style.top = f + 'px'; pkt.style.opacity = f > 0 && f < tH ? 1 : 0;
      vias.forEach(v => { const on = f >= v.y; if (on !== v.on) { v.on = on; v.el.classList.toggle('on', on); } });
    });
  }

  /* ---------- 12. velocity lean: projects tilt with scroll speed and spring back ---------- */
  let leanFn = null;
  if (!reduce) {
    const leanEls = $$('.nt-proj'); leanEls.forEach(e => e.classList.add('lean'));
    let lastY = scrollY, vel = 0, lastSk = 0;
    leanFn = () => {
      const dy = scrollY - lastY; lastY = scrollY;
      vel += (clamp(dy, -120, 120) - vel) * .14;
      const sk = Math.round(clamp(vel * .045, -1.6, 1.6) * 100) / 100;
      if (sk === lastSk) return; lastSk = sk;
      for (const e of leanEls) { const r = e.getBoundingClientRect(); if (r.bottom < -100 || r.top > VH + 100) { if (e.style.transform) e.style.transform = ''; continue; } e.style.transform = Math.abs(sk) < .03 ? '' : `skewY(${-sk}deg)`; }
    };
  }

  /* ---------- nav goes black over this section ---------- */
  const nt = document.getElementById('nt'), nav = document.querySelector('.nav');

  let navDark = null;
  /* ---------- loop ---------- */
  function tick(ms) {
    const t = ms / 1000;
    // read phase: every rect first, so writes below never force a second layout
    const rs = jobs.map(j => j.el.getBoundingClientRect());
    // at the very bottom of the page, anything on screen counts as fully scrolled (tall screens can't scroll further)
    const atEnd = scrollY + VH >= document.documentElement.scrollHeight - 4;
    const ntTop = nt ? nt.getBoundingClientRect().top : 1e9;
    for (let i = 0; i < jobs.length; i++) {
      if (nearR(rs[i])) { jobs[i].fn(atEnd && rs[i].top < VH ? 1 : progR(rs[i]), t, false, rs[i]); jobs[i].past = false; }
      else if (rs[i].bottom < 0 && !jobs[i].past) { jobs[i].fn(1, t, true); jobs[i].past = true; }
    }
    if (wipeFn) wipeFn(t, ntTop);
    if (leanFn) leanFn();
    if (nav) { const dk = ntTop < 80; if (dk !== navDark) { nav.classList.toggle('dark', dk); navDark = dk; } }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
