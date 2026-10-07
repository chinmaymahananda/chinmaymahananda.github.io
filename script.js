/* Chinmay Mahananda portfolio
   Hero: a sealed chip package that comes apart as you scroll.
   1. Packaged: nickel lid, ceramic cavity substrate, decoupling caps, BGA balls.
   2. Exploded: lid lifts, wire bonds release, and the die's Sky130 metal stack (met5 down to li1)
      separates layer by layer, each with routing in its preferred direction.
   3. Dive: the camera drops onto the die floorplan; routing draws in and the ride ends on the
      8x8 systolic array. Activations flow along rows, weights down columns, each lane skewed by
      one cycle, so PE(i,j) fires at cycle i+j: the diagonal wavefront real systolic arrays have. */
(() => {
  const reduce = (() => { try { return localStorage.getItem('motion') === 'off'; } catch (e) { return false; } })(); // user switch overrides the OS setting
  if (reduce) document.documentElement.classList.add('rm'); // motion switched off by the visitor
  const PROF = /[?&]prof/.test(location.search) ? (window.__prof = { hero: [], render: [], nt: [] }) : null; // timing only when ?prof is in the URL
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- radio-style segmented controls ---------- */
  function seg(root, onPick) {
    const btns = $$('button', root);
    const pick = b => { btns.forEach(x => x.setAttribute('aria-checked', x === b)); onPick(b); };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => pick(b));
      b.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault(); const n = btns[(i + d + btns.length) % btns.length]; n.focus(); pick(n);
      });
    });
    pick(btns.find(b => b.getAttribute('aria-checked') === 'true') || btns[0]);
  }

  /* ---------- Gap C demo (numbers from the mx-conformance README) ---------- */
  const block = $('#block');
  for (let i = 0; i < 16; i++) block.appendChild(document.createElement('i'));
  const GAPC = { aligned: { z: 1, e: '0.0000' }, pow2: { z: 6, e: '0.1892' } };
  seg($('#gapc .seg'), b => {
    const m = GAPC[b.dataset.mode];
    $$('i', block).forEach((c, i) => c.classList.toggle('z', i < m.z));
    $('#gz').textContent = `${m.z} of 16`; $('#ge').textContent = m.e;
  });

  /* ---------- RV32I timing demo ---------- */
  const TIMING = { // from openlane/riscv_core/RESULTS.md
    100: { t: '100 MHz, 10 ns: passed. Critical path 1.57 ns, WNS / TNS 0.0 / 0.0, about 0.75 µW.', spd: '3.6s', fail: false },
    333: { t: '333 MHz, 3 ns: passed. Critical path 1.87 ns, WNS / TNS 0.0 / 0.0, zero DRC, LVS and routing violations, about 2.79 µW.', spd: '2.2s', fail: false },
    500: { t: '500 MHz, 2 ns: failed. Setup violations, WNS −0.58 ns, TNS −5.72 ns, critical path 2.47 ns. Kept in the repo.', spd: '1.3s', fail: true }
  };
  seg($('#timing .seg'), b => {
    const m = TIMING[b.dataset.f], pipe = $('#timing .pipe');
    pipe.style.setProperty('--spd', m.spd); pipe.classList.toggle('fail', m.fail);
    $('#tread').textContent = m.t;
  });

  /* ---------- Conv1 enable-latency waveform (desktop layout, plus a compact one for phones) ---------- */
  const wv = $('#wv'), NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, p = wv) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  let wvD = 1, wvCompact = null, renderWave = () => {};
  function buildWave() {
    const compact = innerWidth < 700; if (compact === wvCompact) return; wvCompact = compact;
    // phones: labels sit above each trace and the window is 6 cycles, so the whole thing fits with no scrolling
    const L = compact ? { X0: 4, CW: 52, CY: 6, rows: [40, 100, 160], W: 320, H: 180, pulse: 3 }
                      : { X0: 110, CW: 60, CY: 8, rows: [28, 74, 120], W: 640, H: 150, pulse: 4 };
    wv.innerHTML = ''; wv.setAttribute('viewBox', `0 0 ${L.W} ${L.H}`);
    const ttl = el('title', { id: 'wvt' }); ttl.textContent = 'Waveform of clock, ROM data valid and MAC enable';
    const { X0, CW, CY, rows } = L, end = X0 + CY * CW;
    const g = el('g', { class: 'grid' });
    for (let c = 0; c <= CY; c++) el('line', { x1: X0 + c * CW, x2: X0 + c * CW, y1: compact ? rows[0] - 12 : 10, y2: L.H - 10 }, g);
    ['clk', 'rom_data', 'mac_en'].forEach((n, i) => { const t = compact ? el('text', { x: X0, y: rows[i] - 17 }) : el('text', { x: 0, y: rows[i] + 4 }); t.textContent = n; });
    let clk = `M${X0} ${rows[0] + 10}`;
    for (let c = 0; c < CY; c++) { const x = X0 + c * CW; clk += ` V${rows[0] - 10} H${x + CW / 2} V${rows[0] + 10} H${x + CW}`; }
    el('path', { d: clk, class: 'tr clk' });
    // tap index advances at cycle 1; registered address + registered ROM put valid data on the bus at cycle 3
    const dv = rows[1], xv = X0 + 3 * CW, xe = compact ? end - 6 : X0 + 7 * CW;
    el('path', { d: `M${X0} ${dv} H${xv - 6} L${xv} ${dv - 10} H${xe} L${xe + 6} ${dv} H${end} M${xv - 6} ${dv} L${xv} ${dv + 10} H${xe} L${xe + 6} ${dv}`, class: 'tr dv' });
    const valid = el('text', { x: xv + 10, y: dv + 4 }); valid.textContent = 'valid';
    const enG = el('g', {}), en = el('path', { class: 'tr en' }, enG), mark = el('text', { y: rows[2] - (compact ? 17 : 16) }, enG);
    renderWave = d => {
      const y = rows[2], x1 = X0 + (1 + d) * CW, x2 = Math.min(end, x1 + L.pulse * CW);
      en.setAttribute('d', `M${X0} ${y + 10} H${x1} V${y - 10} H${x2} V${y + 10} H${end}`);
      enG.classList.toggle('bad', d === 1);
      mark.setAttribute('x', compact ? Math.max(X0 + 60, x1 + 6) : x1 + 6);
      mark.textContent = d === 1 ? 'fires a cycle early' : 'aligned with valid data';
      mark.style.fill = d === 1 ? 'var(--bad)' : 'var(--amber)';
    };
    renderWave(wvD);
  }
  buildWave(); addEventListener('resize', buildWave);
  seg($('#bug .seg'), b => {
    wvD = +b.dataset.d; renderWave(wvD);
    $('#bread').textContent = wvD === 1 ? '124 of 144 outputs mismatched the golden model' : 'Enable aligned with valid data. The fix that brought Conv1 up.';
  });

  /* ---------- scroll position as a waveform ---------- */
  const wave = $('#wave'), cur = $('#wavecursor');
  let wW = 0;
  function drawWave() {
    wW = innerWidth; wave.setAttribute('viewBox', `0 0 ${wW} 14`);
    let d = 'M0 11'; for (let x = 0; x < wW; x += 24) d += ` V3 H${x + 12} V11 H${x + 24}`;
    wave.innerHTML = `<defs><clipPath id="wc"><rect id="wcr" width="0" height="14"/></clipPath></defs><path d="${d}"/><path class="done" clip-path="url(#wc)" d="${d}"/>`;
  }
  drawWave(); addEventListener('resize', drawWave);
  const docP = () => clamp((window.__sY ?? scrollY) / Math.max(1, document.documentElement.scrollHeight - innerHeight));

  /* ---------- smooth scroll (optional) ---------- */
  // scroll activity timestamp: background work waits for a pause so it never competes with your finger
  window.__lastScroll = 0;
  const markScroll = () => { window.__lastScroll = performance.now(); };
  addEventListener('scroll', markScroll, { passive: true }); addEventListener('touchmove', markScroll, { passive: true });
  const finePointer = matchMedia('(pointer: fine)').matches;
  let lenis = null;
  if (!reduce && window.Lenis && finePointer) {   // smooth wheel for mouse/trackpad only; touch keeps native momentum
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = a.getAttribute('href'); if (t.length < 2) return;
      e.preventDefault(); lenis.scrollTo(t === '#top' ? 0 : t, { offset: -70 });
    }));
  }

  if (!lenis) $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return; const el = document.querySelector(id); if (!el) return;
    e.preventDefault(); scrollTo({ top: el.getBoundingClientRect().top + scrollY - 70, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------- device tier: pick the best settings this hardware can hold, from the first frame ---------- */
  const TIER = (() => {
    let gpu = '';
    try { const c = document.createElement('canvas'), g = c.getContext('webgl'), e = g && g.getExtension('WEBGL_debug_renderer_info'); gpu = e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : ''; const lose = g && g.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); } catch (e) {}
    const apple = /Apple/i.test(gpu) || /iPhone|iPad|Macintosh/.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || (apple ? 8 : 4);
    const weak = /Mali-(T|G5\d|G7[0-2])|Adreno \(TM\) ([1-5]\d\d|6[0-1]\d)|PowerVR|SwiftShader|llvmpipe|Intel\(R\) HD/i.test(gpu);
    const level = (weak || mem < 4 || cores < 4) ? 1 : (apple || cores >= 8) ? 3 : 2;
    return { gpu, apple, level };
  })();
  window.__tier = TIER;

  /* ---------- hero ---------- */
  const hero = $('.hero'), canvas = $('#die'), labelsEl = $('#labels');
  const beats = $$('.beat'), hint = $('#hint');
  let gl = null;
  // probe WebGL on a throwaway canvas so three.js can still pick WebGL2 on the real one
  const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  try { if (window.THREE && hasGL) gl = initScene(); } catch (err) { console.warn('3D scene off:', err); gl = null; }
  if (!gl || reduce) document.documentElement.classList.add('no-gl');

  // touch devices scroll natively; scroll-driven animations follow a gently eased copy of the position (desktop already has Lenis)
  let sY = scrollY, lastFrame = 0, heroRun = 1;
  const TAU = 0;   // 1:1 with your finger: native touch scrolling is already smooth; easing here only adds lag
  const measureHero = () => { heroRun = Math.max(1, hero.offsetHeight - innerHeight); };
  measureHero(); addEventListener('resize', measureHero);
  function stepScroll(time) {
    const dt = lastFrame ? Math.min(64, time - lastFrame) : 16; lastFrame = time;
    const y = scrollY, gap = y - sY;
    if (!TAU || Math.abs(gap) > innerHeight * 2.5 || Math.abs(gap) < .3) sY = y;   // big jumps snap, tiny gaps settle
    else sY += gap * (1 - Math.exp(-dt / TAU));
    window.__sY = sY;
  }
  const heroP = () => reduce ? 0.3 : clamp(sY / heroRun);

  function setBeats(p) {
    if (reduce || !gl) { beats.forEach((b, i) => { b.style.opacity = i === 0 ? 1 : 0; }); return; }
    const o = [1 - smooth(.06, .12, p), smooth(.4, .46, p) * (1 - smooth(.58, .64, p)), smooth(.86, .93, p)];
    beats.forEach((b, i) => { const v = Math.round(o[i] * 200) / 200; if (b._o === v) return; b._o = v; b.style.opacity = v; b.style.transform = `translate3d(0, ${((1 - v) * 24).toFixed(1)}px, 0)`; b.setAttribute('aria-hidden', v < .5); });
    hint.style.opacity = 1 - smooth(.02, .06, p);
  }

  function initScene() {
    const T = THREE;
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    const scene = new T.Scene();
    scene.fog = new T.Fog(0x0A0F1F, 150, 420);
    const cam = new T.PerspectiveCamera(36, 1, 0.1, 900);
    scene.add(new T.AmbientLight(0x8090c0, 0.5));
    const key = new T.DirectionalLight(0xffffff, 0.85); key.position.set(40, 90, 50); scene.add(key);
    const rim = new T.DirectionalLight(0x6e8bff, 0.55); rim.position.set(-60, 30, -60); scene.add(rim);
    const warm = new T.DirectionalLight(0xffb547, 0.25); warm.position.set(60, 10, -30); scene.add(warm);

    // studio environment for metal reflections, generated in code (no image assets)
    {
      const env = new T.Scene();
      env.add(new T.Mesh(new T.SphereGeometry(50, 32, 16), new T.MeshBasicMaterial({ color: 0x0b1226, side: T.BackSide })));
      const panel = (c, w, h, x, y, z) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
      panel(0xffffff, 40, 8, 0, 40, 10); panel(0x9fb2ff, 30, 30, -45, 10, 0); panel(0xffd08a, 12, 30, 45, 5, -10); panel(0x445080, 60, 20, 0, -20, -45);
      const pm = new T.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(env, 0.04).texture; pm.dispose();
    }

    const AMBER = 0xffb547, BLUE = 0x6e8bff;
    const lineMat = (c, o) => new T.LineBasicMaterial({ color: c, transparent: true, opacity: o });
    const fadeables = []; // materials whose opacity we drive
    const fade = (m) => { m.transparent = true; fadeables.push(m); return m; };

    // seeded random so the chip looks identical on every visit
    let seed = 1337; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // once a texture is on the GPU its canvas is freed (iOS Safari has a hard canvas-memory budget)
    const freeAfterUpload = t => { t.onUpdate = () => { const im = t.image; setTimeout(() => { if (im && im.getContext) { im.width = 1; im.height = 1; } }, 0); t.onUpdate = null; }; return t; };
    const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); return freeAfterUpload(t); };
    const TW = Math.min(renderer.capabilities.maxTextureSize, innerWidth < 700 ? (TIER.level >= 2 ? 1536 : 1024) : 2048); // sized to what the screen can show

    /* ===== DIE (floorplan) ===== */
    const DW = 46, DD = 32;
    const dieG = new T.Group(); scene.add(dieG);
    const die = new T.Mesh(new T.BoxGeometry(DW, 0.6, DD), new T.MeshStandardMaterial({ color: 0x10183a, roughness: .55, metalness: .45 }));
    die.position.y = -0.5; dieG.add(die);
    const dieEdge = new T.LineSegments(new T.EdgesGeometry(die.geometry), lineMat(BLUE, .5)); dieEdge.position.copy(die.position); dieG.add(dieEdge);
    const gp = [];
    for (let x = -DW / 2; x <= DW / 2; x += 1) gp.push(x, -0.19, -DD / 2, x, -0.19, DD / 2);
    for (let z = -DD / 2; z <= DD / 2; z += 1) gp.push(-DW / 2, -0.19, z, DW / 2, -0.19, z);
    const gg = new T.BufferGeometry(); gg.setAttribute('position', new T.Float32BufferAttribute(gp, 3));
    dieG.add(new T.LineSegments(gg, lineMat(0x24305a, .45)));
    // seal ring around the die edge
    const sealRing = new T.Mesh(new T.RingGeometry(0, 1, 4, 1), new T.MeshBasicMaterial());
    sealRing.visible = false;

    // systolic array
    const N = 8, SP = 1.5, PS = 1.12, off = (N - 1) * SP / 2;
    const px = j => j * SP - off, pz = i => i * SP - off;
    const peGeo = new T.BoxGeometry(PS, 0.36, PS), peEdge = new T.EdgesGeometry(peGeo);
    const peMesh = new T.InstancedMesh(peGeo, new T.MeshStandardMaterial({ color: 0xffffff, roughness: .5, metalness: .2 }), N * N);
    const pes = [], ep = [], eSrc = peEdge.attributes.position.array, M0 = new T.Matrix4();
    const PE_BASE = new T.Color(0x1b2552), PE_HOT = new T.Color(2.4, 1.55, .55), peCol = new T.Color();
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const k = i * N + j; M0.makeTranslation(px(j), 0, pz(i)); peMesh.setMatrixAt(k, M0); peMesh.setColorAt(k, PE_BASE);
      for (let q = 0; q < eSrc.length; q += 3) ep.push(eSrc[q] + px(j), eSrc[q + 1], eSrc[q + 2] + pz(i));
      pes.push({ k, i, j, f: -1 });
    }
    dieG.add(peMesh);
    const peEdgeGeo = new T.BufferGeometry(); peEdgeGeo.setAttribute('position', new T.Float32BufferAttribute(ep, 3));
    dieG.add(new T.LineSegments(peEdgeGeo, lineMat(BLUE, .6)));
    const wp = [];
    for (let k = 0; k < N; k++) { wp.push(-off - 1.6, .02, pz(k), off + 1.6, .02, pz(k)); wp.push(px(k), .02, -off - 1.6, px(k), .02, off + 1.6); }
    const wg = new T.BufferGeometry(); wg.setAttribute('position', new T.Float32BufferAttribute(wp, 3));
    dieG.add(new T.LineSegments(wg, lineMat(0x3a4a8a, .7)));
    const pg = new T.SphereGeometry(0.15, 12, 8);
    const actM = new T.MeshBasicMaterial({ color: AMBER }), wtM = new T.MeshBasicMaterial({ color: 0x9fb2ff });
    const acts = [], wts = [];
    for (let k = 0; k < N; k++) { const a = new T.Mesh(pg, actM); dieG.add(a); acts.push(a); const w = new T.Mesh(pg, wtM); dieG.add(w); wts.push(w); }
    const glow = new T.PointLight(AMBER, 0, 14); glow.position.set(0, 3, 0); dieG.add(glow);

    // macros
    const macros = [];
    function macro(x, z, w, d, h, label, stripes) {
      const g = new T.Group(); g.position.set(x, 0, z);
      const box = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({ color: 0x182250, roughness: .6, metalness: .25 }));
      box.position.y = h / 2 - 0.18; g.add(box);
      const e = new T.LineSegments(new T.EdgesGeometry(box.geometry), lineMat(BLUE, .7)); e.position.copy(box.position); g.add(e);
      if (stripes) {
        const sp = [];
        for (let s = 1; s < stripes; s++) { const zz = -d / 2 + s * d / stripes; sp.push(-w / 2 + .3, h - 0.17, zz, w / 2 - .3, h - 0.17, zz); }
        const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
        g.add(new T.LineSegments(sg, lineMat(0x3a4a8a, .8)));
      }
      dieG.add(g);
      macros.push({ g, label, top: new T.Vector3(x, h + 0.6, z) });
    }
    macro(-15.5, -4.5, 10, 9, 0.9, 'RV32I core', 4);
    macro(14.5, -7.5, 9, 6.5, 0.6, 'weight buffer', 10);
    macro(14.5, 6, 9, 6.5, 0.6, 'activation buffer', 10);
    macro(-15.5, 9.5, 10, 5, 0.5, null, 3);

    // die I/O pads (also the wire-bond landing sites)
    const padXs = [], padGeo = new T.BoxGeometry(0.8, 0.25, 0.8), padMat = new T.MeshStandardMaterial({ color: 0x8a94b8, metalness: .9, roughness: .25 });
    const padPts = [];
    for (let x = -DW / 2 + 1.5; x <= DW / 2 - 1.5; x += 1.6) for (const z of [-DD / 2 + .9, DD / 2 - .9]) padPts.push([x, z]);
    for (let z = -DD / 2 + 2.5; z <= DD / 2 - 2.5; z += 1.6) for (const x of [-DW / 2 + .9, DW / 2 - .9]) padPts.push([x, z]);
    const pads = new T.InstancedMesh(padGeo, padMat, padPts.length);
    const M4 = new T.Matrix4();
    padPts.forEach(([x, z], k) => { M4.makeTranslation(x, -0.05, z); pads.setMatrixAt(k, M4); });
    dieG.add(pads);

    // routing buses, drawn in during the dive
    const routes = [];
    function bus(pts, width = 4, gap = .32, color = AMBER) {
      for (let b = 0; b < width; b++) {
        const o = (b - (width - 1) / 2) * gap, arr = [];
        pts.forEach(([x, z], k) => {
          const segs = [pts[k - 1], pts[k + 1]].filter(Boolean);
          const hz = segs.some(q => q[1] === z), vt = segs.some(q => q[0] === x);
          arr.push(x + (vt ? o : 0), .06 + b * .002, z + (hz ? o : 0));
        });
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(arr, 3));
        const ln = new T.Line(geo, lineMat(color, .9)); ln.geometry.setDrawRange(0, 0); dieG.add(ln);
        routes.push({ ln, n: arr.length / 3 });
      }
    }
    bus([[off + 1.6, -3], [6.5, -3], [6.5, -7.5], [10, -7.5]]);
    bus([[off + 1.6, 3], [6.5, 3], [6.5, 6], [10, 6]]);
    bus([[-off - 1.6, -2], [-8, -2], [-8, -4.5], [-10.5, -4.5]], 6, .28, BLUE);
    bus([[-off - 1.6, 4], [-8, 4], [-8, 9.5], [-10.5, 9.5]]);
    bus([[-15.5, -9], [-15.5, -14], [0, -14], [0, -off - 1.6]], 3, .3, BLUE);
    bus([[14.5, 9.25], [14.5, 14], [-2, 14], [-2, off + 1.6]], 3, .3, BLUE);

    /* ===== METAL STACK (Sky130: li1, met1..met5) ===== */
    // each layer: preferred routing direction, pitch and width scaled from the real stack's character
    const LAYERS = [
      { name: 'li1, local interconnect', dir: 'h', pitch: 7, w: 2, col: '#7d8fd6', stubs: true },
      { name: 'met1', dir: 'v', pitch: 9, w: 3, col: '#6e8bff' },
      { name: 'met2', dir: 'h', pitch: 11, w: 3.5, col: '#8f7dff' },
      { name: 'met3', dir: 'v', pitch: 18, w: 6, col: '#5aa6ff' },
      { name: 'met4', dir: 'h', pitch: 26, w: 9, col: '#9fb2ff' },
      { name: 'met5, power straps', dir: 'v', pitch: 90, w: 30, col: '#ffb547', power: true }
    ];
    const TH = Math.round(TW * DD / DW);
    function metalTex(L) {
      return tex(TW, TH, (c, w, h) => {
        const s = w / 2048; // keep detail consistent across resolutions
        c.clearRect(0, 0, w, h); c.fillStyle = L.col; c.strokeStyle = L.col;
        const P = L.pitch * s * 2, Wd = Math.max(1, L.w * s * 2);
        if (L.power) {
          c.globalAlpha = .9;
          // ring + straps
          c.lineWidth = Wd * 1.4; c.strokeRect(Wd, Wd, w - Wd * 2, h - Wd * 2);
          for (let x = P; x < w - P / 2; x += P) c.fillRect(x - Wd / 2, Wd, Wd, h - Wd * 2);
          // via arrays where straps cross the ring
          c.fillStyle = '#fff3d6'; c.globalAlpha = .55;
          for (let x = P; x < w - P / 2; x += P) for (const y of [Wd * .6, h - Wd * 1.6]) for (let k = 0; k < 4; k++) c.fillRect(x - Wd / 2 + k * Wd / 4 + 2, y, Wd / 6, Wd / 6);
          return;
        }
        const along = L.dir === 'h' ? w : h, across = L.dir === 'h' ? h : w;
        for (let t = P / 2; t < across; t += P) {
          let a = rnd() * 40 * s;
          while (a < along) {
            const len = (L.stubs ? 10 + rnd() * 50 : 30 + rnd() * 260) * s * 2, gap = (6 + rnd() * (L.stubs ? 40 : 60)) * s * 2;
            c.globalAlpha = .5 + rnd() * .4;
            if (L.dir === 'h') c.fillRect(a, t - Wd / 2, len, Wd); else c.fillRect(t - Wd / 2, a, Wd, len);
            // vias at segment ends
            c.globalAlpha = .95; const vs = Wd * 1.1;
            if (rnd() < .6) { if (L.dir === 'h') c.fillRect(a, t - vs / 2, vs, vs); else c.fillRect(t - vs / 2, a, vs, vs); }
            a += len + gap;
          }
        }
      });
    }

    // the same drawing as metalTex, split into small slices that fit between frames
    function metalSlices(L) {
      const c = document.createElement('canvas'); c.width = TW; c.height = TH; const g = c.getContext('2d');
      const w = TW, h = TH, s = w / 2048, P = L.pitch * s * 2, Wd = Math.max(1, L.w * s * 2), steps = [];
      g.fillStyle = L.col; g.strokeStyle = L.col;
      if (L.power) steps.push(() => {
        g.globalAlpha = .9; g.lineWidth = Wd * 1.4; g.strokeRect(Wd, Wd, w - Wd * 2, h - Wd * 2);
        for (let x = P; x < w - P / 2; x += P) g.fillRect(x - Wd / 2, Wd, Wd, h - Wd * 2);
        g.fillStyle = '#fff3d6'; g.globalAlpha = .55;
        for (let x = P; x < w - P / 2; x += P) for (const y of [Wd * .6, h - Wd * 1.6]) for (let k = 0; k < 4; k++) g.fillRect(x - Wd / 2 + k * Wd / 4 + 2, y, Wd / 6, Wd / 6);
      });
      else {
        const along = L.dir === 'h' ? w : h, across = L.dir === 'h' ? h : w, ts = [];
        for (let t = P / 2; t < across; t += P) ts.push(t);
        for (let i = 0; i < ts.length; i += 10) { const chunk = ts.slice(i, i + 10); steps.push(() => {
          for (const t of chunk) { let a = rnd() * 40 * s;
            while (a < along) {
              const len = (L.stubs ? 10 + rnd() * 50 : 30 + rnd() * 260) * s * 2, gap = (6 + rnd() * (L.stubs ? 40 : 60)) * s * 2;
              g.globalAlpha = .5 + rnd() * .4;
              if (L.dir === 'h') g.fillRect(a, t - Wd / 2, len, Wd); else g.fillRect(t - Wd / 2, a, Wd, len);
              g.globalAlpha = .95; const vs = Wd * 1.1;
              if (rnd() < .6) { if (L.dir === 'h') g.fillRect(a, t - vs / 2, vs, vs); else g.fillRect(t - vs / 2, a, vs, vs); }
              a += len + gap;
            } } }); }
      }
      return { c, steps };
    }
    // tiny placeholder so every material compiles with its final shader up front; real textures arrive during idle time
    const PH = new T.CanvasTexture(document.createElement('canvas'));
    const stack = LAYERS.map((L, k) => {
      const m = fade(new T.MeshBasicMaterial({ map: PH, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, opacity: 0 }));
      const mesh = new T.Mesh(new T.PlaneGeometry(DW, DD), m); mesh.rotation.x = -Math.PI / 2;
      const frame = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(DW, DD)), fade(lineMat(new T.Color(L.col).getHex(), 0)));
      frame.rotation.x = -Math.PI / 2;
      const g2 = new T.Group(); g2.add(mesh, frame); scene.add(g2);
      return { g: g2, m, f: frame.material, L, k };
    });

    /* ===== PACKAGE ===== */
    const PW = 84, PD = 70, PT = 4;      // substrate
    const LW = 64, LD = 50;              // lid
    const pkg = new T.Group(); scene.add(pkg);
    // substrate top: ceramic with gold bond fingers and fan-out traces
    const subTop = tex(TW, Math.round(TW * PD / PW), (c, w, h) => {
      const sx = w / PW, sz = h / PD;
      const g0 = c.createLinearGradient(0, 0, w, h); g0.addColorStop(0, '#2b2f3a'); g0.addColorStop(1, '#1d212b');
      c.fillStyle = g0; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(255,255,255,${rnd() * .035})`; c.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
      const cx = w / 2, cz = h / 2;
      c.strokeStyle = '#c99a3c'; c.lineWidth = 1.4 * sx / 6;
      // traces from bond fingers outward to vias near the edge
      for (let k = 0; k < 220; k++) {
        const side = k % 4, f = rnd();
        let x0, z0, x1, z1;
        if (side === 0) { x0 = cx + (f - .5) * (DW + 6) * sx; z0 = cz - (DD / 2 + 4) * sz; x1 = x0 + (f - .5) * 30 * sx; z1 = (2 + rnd() * 3) * sz; }
        else if (side === 1) { x0 = cx + (f - .5) * (DW + 6) * sx; z0 = cz + (DD / 2 + 4) * sz; x1 = x0 + (f - .5) * 30 * sx; z1 = h - (2 + rnd() * 3) * sz; }
        else if (side === 2) { x0 = cx - (DW / 2 + 4) * sx; z0 = cz + (f - .5) * (DD + 6) * sz; x1 = (2 + rnd() * 3) * sx; z1 = z0 + (f - .5) * 30 * sz; }
        else { x0 = cx + (DW / 2 + 4) * sx; z0 = cz + (f - .5) * (DD + 6) * sz; x1 = w - (2 + rnd() * 3) * sx; z1 = z0 + (f - .5) * 30 * sz; }
        c.globalAlpha = .55; c.beginPath(); c.moveTo(x0, z0);
        if (side < 2) c.lineTo(x0, (z0 + z1) / 2), c.lineTo(x1, z1); else c.lineTo((x0 + x1) / 2, z0), c.lineTo(x1, z1);
        c.stroke();
        c.globalAlpha = .9; c.fillStyle = '#e2b866'; c.beginPath(); c.arc(x1, z1, .45 * sx, 0, 7); c.fill();
      }
      // bond finger ring
      c.globalAlpha = 1; c.fillStyle = '#e8c070';
      for (let x = -DW / 2; x <= DW / 2; x += 1.6) for (const z of [-DD / 2 - 3.2, DD / 2 + 2.6]) c.fillRect(cx + x * sx, cz + z * sz, .7 * sx, .6 * sz);
      for (let z = -DD / 2; z <= DD / 2; z += 1.6) for (const x of [-DW / 2 - 3.2, DW / 2 + 2.6]) c.fillRect(cx + x * sx, cz + z * sz, .6 * sx, .7 * sz);
      // cavity floor (die attach area) and pin-1 mark
      c.fillStyle = 'rgba(160,170,190,.18)'; c.fillRect(cx - (DW / 2 + 1) * sx, cz - (DD / 2 + 1) * sz, (DW + 2) * sx, (DD + 2) * sz);
      c.fillStyle = '#e8c070'; c.beginPath(); c.moveTo(2 * sx, 2 * sz); c.lineTo(7 * sx, 2 * sz); c.lineTo(2 * sx, 7 * sz); c.fill();
    });
    const sideMat = new T.MeshStandardMaterial({ color: 0x2a2e38, roughness: .8, metalness: .1 });
    const subMats = [sideMat, sideMat, new T.MeshStandardMaterial({ map: subTop, roughness: .6, metalness: .25 }), sideMat, sideMat, sideMat].map(fade);
    const substrate = new T.Mesh(new T.BoxGeometry(PW, PT, PD), subMats);
    substrate.position.y = -0.8 - PT / 2; pkg.add(substrate);
    // cavity wall (seal ring) the lid sits on
    const wallMat = fade(new T.MeshStandardMaterial({ color: 0x3a3f4c, roughness: .5, metalness: .4 }));
    const wallH = 5.2, wallT = 2.2, wall = new T.Group();
    [[0, -(LD / 2 - wallT / 2), LW, wallT], [0, LD / 2 - wallT / 2, LW, wallT], [-(LW / 2 - wallT / 2), 0, wallT, LD - wallT * 2], [LW / 2 - wallT / 2, 0, wallT, LD - wallT * 2]]
      .forEach(([x, z, w, d]) => { const b = new T.Mesh(new T.BoxGeometry(w, wallH, d), wallMat); b.position.set(x, -0.8 + wallH / 2, z); wall.add(b); });
    pkg.add(wall);
    // decoupling capacitors (0402-style): ceramic body with tinned ends
    const caps = [];
    for (let x = -LW / 2 + 2; x <= LW / 2 - 2; x += 2.6) for (const z of [-LD / 2 - 3.5, LD / 2 + 3.5]) caps.push([x, z, 0]);
    for (let z = -LD / 2 + 3; z <= LD / 2 - 3; z += 2.6) for (const x of [-LW / 2 - 3.5, LW / 2 + 3.5]) caps.push([x, z, 1]);
    const capBody = new T.InstancedMesh(new T.BoxGeometry(1.2, .7, .65), fade(new T.MeshStandardMaterial({ color: 0x8a6a46, roughness: .7 })), caps.length);
    const capEnd = new T.InstancedMesh(new T.BoxGeometry(.32, .74, .7), fade(new T.MeshStandardMaterial({ color: 0xc8ccd6, metalness: .9, roughness: .25 })), caps.length * 2);
    const Q = new T.Quaternion(), V = new T.Vector3(), S = new T.Vector3(1, 1, 1), up = new T.Vector3(0, 1, 0);
    caps.forEach(([x, z, r], k) => {
      Q.setFromAxisAngle(up, r ? Math.PI / 2 : 0);
      M4.compose(V.set(x, -0.8 + .35, z), Q, S); capBody.setMatrixAt(k, M4);
      for (const s2 of [-1, 1]) { const dx = r ? 0 : s2 * .6, dz = r ? s2 * .6 : 0; M4.compose(V.set(x + dx, -0.8 + .37, z + dz), Q, S); capEnd.setMatrixAt(k * 2 + (s2 > 0 ? 1 : 0), M4); }
    });
    pkg.add(capBody, capEnd);
    // BGA solder balls
    const balls = [];
    for (let x = -PW / 2 + 3; x <= PW / 2 - 3; x += 3.2) for (let z = -PD / 2 + 3; z <= PD / 2 - 3; z += 3.2) if (!(Math.abs(x) < 9 && Math.abs(z) < 9)) balls.push([x, z]);
    const ballMesh = new T.InstancedMesh(new T.SphereGeometry(1.15, 16, 10), fade(new T.MeshStandardMaterial({ color: 0xd6dae2, metalness: 1, roughness: .18 })), balls.length);
    balls.forEach(([x, z], k) => { M4.makeTranslation(x, 0, z); ballMesh.setMatrixAt(k, M4); });
    const ballG = new T.Group(); ballG.add(ballMesh); scene.add(ballG);

    // lid: brushed nickel, laser-etched marking
    const lidTex = () => tex(TW, Math.round(TW * LD / LW), (c, w, h) => {
      const g1 = c.createLinearGradient(0, 0, w, h); g1.addColorStop(0, '#b9c0cc'); g1.addColorStop(.5, '#9aa2b0'); g1.addColorStop(1, '#c4cad4');
      c.fillStyle = g1; c.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 1) { c.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '40,46,60'},${rnd() * .06})`; c.fillRect(0, y, w, 1); }
      const u = w / 100;
      c.fillStyle = 'rgba(30,34,46,.9)';
      c.font = `600 ${u * 6.4}px "IBM Plex Sans Condensed", sans-serif`; c.fillText('C. MAHANANDA', u * 8, h * .36);
      c.font = `500 ${u * 3.1}px "IBM Plex Mono", monospace`;
      c.fillText('DV / RTL', u * 8, h * .36 + u * 6);
      c.fillText('2026', u * 8, h * .36 + u * 10.5);
      // 2D code mark
      const qx = w - u * 24, qy = h * .2, cs = u * .9;
      for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) if (i === 0 || j === 15 || rnd() < .45) c.fillRect(qx + i * cs, qy + j * cs, cs, cs);
      c.beginPath(); c.arc(u * 5, u * 5, u * 1.6, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = u * .3; c.strokeRect(u * 2.5, u * 2.5, w - u * 5, h - u * 5);
    });
    const lidMap = lidTex();
    const lidMat = fade(new T.MeshStandardMaterial({ map: lidMap, metalness: .7, roughness: .5, envMapIntensity: .55 }));
    const lid = new T.Mesh(new T.BoxGeometry(LW, 1.2, LD), [fade(new T.MeshStandardMaterial({ color: 0xa9b0bd, metalness: .8, roughness: .4, envMapIntensity: .6 })), null, lidMat, null, null, null]);
    lid.material = [lid.material[0], lid.material[0], lidMat, lid.material[0], lid.material[0], lid.material[0]];
    scene.add(lid);
    // redraw etching once web fonts are in
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { const n = lidTex(); lidMat.map = n; lidMat.needsUpdate = true; });

    // wire bonds: gold arcs from die pads to substrate bond fingers
    const bondPos = [];
    padPts.forEach(([x, z]) => {
      const onX = Math.abs(Math.abs(z) - (DD / 2 - .9)) < .01;
      const x2 = onX ? x * 1.04 : Math.sign(x) * (DW / 2 + 3), z2 = onX ? Math.sign(z) * (DD / 2 + 3) : z * 1.04;
      const curve = new T.QuadraticBezierCurve3(new T.Vector3(x, .1, z), new T.Vector3((x + x2) / 2, 2.6, (z + z2) / 2), new T.Vector3(x2, -.75, z2));
      const pts = curve.getPoints(10);
      for (let k = 0; k < pts.length - 1; k++) bondPos.push(pts[k].x, pts[k].y, pts[k].z, pts[k + 1].x, pts[k + 1].y, pts[k + 1].z);
    });
    const bg2 = new T.BufferGeometry(); bg2.setAttribute('position', new T.Float32BufferAttribute(bondPos, 3));
    const bondMat = fade(lineMat(0xffcf6a, .95));
    const bonds = new T.LineSegments(bg2, bondMat); scene.add(bonds);

    /* ===== background prep: build each metal texture and upload it to the GPU one idle slot at a time ===== */
    // background prep, time-boxed inside the render loop: ~9 ms per frame when you're still, ~3.5 ms while scrolling,
    // GPU uploads one at a time and spaced apart, so no single frame is ever blocked
    const quietBG = () => performance.now() - window.__lastScroll > 250;
    const heavy = fn => { fn.heavy = true; return fn; }, lights = [], heavies = [];
    stack.forEach(S2 => { const b = metalSlices(S2.L); b.steps.forEach(st => lights.push(st));
      heavies.push(heavy(() => { const tx = freeAfterUpload(new T.CanvasTexture(b.c)); tx.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); S2.m.map = tx; if (renderer.initTexture) renderer.initTexture(tx); })); });
    const pending = lights.concat(heavies);
    let heavyGap = 0;
    const prepStep = () => {
      const t0 = performance.now(), still = quietBG(), budget = still ? 9 : 3.5;
      while (pending.length && !pending[0].heavy && performance.now() - t0 < budget) pending.shift()();
      if (pending.length && pending[0].heavy && (still || ++heavyGap % 12 === 0)) pending.shift()();
    };
    const flushPrep = () => { while (pending.length) pending.shift()(); };

    /* ===== labels ===== */
    const labels = [];
    const addLabel = (t, cls, pos, vis) => { const e = document.createElement('span'); e.textContent = t; if (cls) e.className = cls; labelsEl.appendChild(e); labels.push({ e, pos, vis, v: new T.Vector3(), full: t, short: t.split(',')[0] }); };
    // exploded-view callouts, anchored at each layer's right edge
    addLabel('lid', 'call', () => [LW / 2, lid.position.y, 0], s => s.ex > .7 && s.dive < .2);
    stack.slice().reverse().forEach(S2 => addLabel(S2.L.name, 'call', () => [DW / 2, S2.g.position.y, 0], s => s.ex > .7 && s.dive < .2));
    addLabel('die, transistors and floorplan', 'call', () => [DW / 2, 0, 0], s => s.ex > .7 && s.dive < .2);
    addLabel('substrate, ceramic with 0402 decaps', 'call', () => [PW / 2, pkg.position.y - 1, 0], s => s.ex > .7 && s.dive < .2);
    addLabel('BGA balls', 'call', () => [PW / 2 - 3, ballG.position.y, 0], s => s.ex > .7 && s.dive < .2);
    // floorplan labels after the dive
    addLabel('systolic MAC array, 8 × 8 PEs', '', () => [0, 1.2, -off - 1.4], s => s.dive > .6 && s.p < .97);
    macros.filter(m => m.label).forEach(m => addLabel(m.label, '', () => [m.top.x, m.top.y, m.top.z], s => s.dive > .8 && s.close < .5));

    let W = 0, H = 0;
    const phone = () => innerWidth < 700;
    const DPR = devicePixelRatio || 1;
    let maxPR = phone() ? Math.min(DPR, TIER.level === 3 ? 3 : TIER.level === 2 ? 2.5 : 2) : Math.min(DPR, TIER.level === 1 ? 1.5 : 2), lastW = 0, lastH = 0;
    function resize(force) {
      const nw = canvas.clientWidth, nh = canvas.clientHeight;
      if (!force && nw === lastW && Math.abs(nh - lastH) < 2) return; lastW = nw; lastH = nh;
      W = nw; H = nh;
      if (typeof labels !== 'undefined') labels.forEach(l => { l.e.textContent = W < 700 ? l.short : l.full; });
      renderer.setPixelRatio(maxPR);
      renderer.setSize(W, H, false); cam.aspect = W / H; cam.fov = W / H < .9 ? 50 : 36; cam.updateProjectionMatrix();
    }
    resize(true); addEventListener('resize', () => resize(false));
    // adaptive quality: if frames run long on this device, step the render resolution down
    // measure this screen's frame interval (60/90/120 Hz), then trade resolution against it:
    // step down only when frames run late, step back up (to native sharpness) when there's headroom
    const capPR = phone() ? Math.min(DPR, TIER.level === 1 ? 2.25 : 3) : Math.min(DPR, 2);
    const quiet = () => performance.now() - window.__lastScroll > 300;
    let wantPR = 0;
    let ftAcc = 0, ftN = 0, lastT = 0, warmN = 0, base = 0, upOK = 0, holdUntil = 0; const first = [];
    function perf(ms) {
      if (wantPR && quiet()) { maxPR = wantPR; wantPR = 0; resize(true); lastT = ms; return; }   // apply only while you're not scrolling
      if (++warmN < 120) { lastT = ms; return; }
      const dt = ms - lastT; lastT = ms;
      if (!(dt > 0 && dt < 200)) return;
      if (!base) { first.push(dt); if (first.length === 60) { first.sort((a, b) => a - b); base = Math.max(6.5, first[8]); } return; }
      ftAcc += dt; ftN++;
      if (ftN < 60) return;
      const avg = ftAcc / ftN; ftAcc = 0; ftN = 0; const floor = phone() ? 1.5 : 1;
      if (avg > base * 1.45 && maxPR > floor) { wantPR = Math.max(floor, maxPR - .25); holdUntil = ms + 10000; upOK = 0; }
      else if (avg < base * 1.08 && maxPR < capPR && ms > holdUntil) { if (++upOK >= 3) { wantPR = Math.min(capPR, maxPR + .25); upOK = 0; } }
      else upOK = 0;
    }

    let mx = 0, my = 0, tmx = 0, tmy = 0;
    addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; }, { passive: true });

    // camera keyframes: [p, position, look target]
    const KF = [
      [0.00, [78, 70, 112], [-14, -2, 6]],
      [0.10, [70, 62, 100], [-12, -2, 4]],
      [0.34, [118, 46, 84], [-8, 16, 0]],
      [0.44, [104, 52, 70], [-6, 14, 0]],
      [0.60, [0, 82, 24], [0, 0, 0]],
      [0.76, [-3, 30, 30], [0, 0, 0]],
      [1.00, [10.5, 8.5, 15.5], [-6, 0, 2.2]]
    ].map(([p, a, b]) => [p, new T.Vector3(...a), new T.Vector3(...b)]);
    // portrait phones: framed for a tall screen (chip above the text, stack left of its callouts, array filling the width)
    const KF_P = [
      [0.00, [112, 104, 156], [0, -16, 6]],
      [0.10, [100, 94, 140], [0, -14, 4]],
      [0.34, [132, 48, 118], [14, 10, 0]],
      [0.44, [122, 54, 102], [12, 10, 0]],
      [0.60, [0, 104, 30], [0, 0, 1]],
      [0.76, [-3, 76, 62], [0, 0, 2]],
      [1.00, [6, 22, 22], [-1, 0, 1]]
    ].map(([p, a, b]) => [p, new T.Vector3(...a), new T.Vector3(...b)]);
    const camAt = (p, pos, look) => {
      const K = W / H < .9 ? KF_P : KF;
      let i = 0; while (i < K.length - 2 && p > K[i + 1][0]) i++;
      const [p0, a0, b0] = K[i], [p1, a1, b1] = K[i + 1];
      const t = smooth(p0, p1, p);
      pos.lerpVectors(a0, a1, t); look.lerpVectors(b0, b1, t);
    };

    const D = 0.42, LOOP = 2 * N + 3;
    const pos = new T.Vector3(), look = new T.Vector3(), tmpV = new T.Vector3();
    const st = {};

    function frame(time, p) {
      perf(time);
      const t = reduce ? 6.3 : time / 1000;
      mx += (tmx - mx) * .05; my += (tmy - my) * .05;
      if (pending.length) { if (p > .07) flushPrep(); else prepStep(); }
      const ex = smooth(.1, .34, p);            // explode amount
      const dive = smooth(.46, .62, p);         // package and stack clear away
      const close = smooth(.8, 1, p);
      Object.assign(st, { p, ex, dive, close });

      // dataflow wavefront
      const c = (t / D) % LOOP;
      for (let k = 0; k < N; k++) {
        const s = c - k, vis = s > -1.2 && s < N + .2;
        acts[k].visible = vis; wts[k].visible = vis;
        const x = lerp(-off - SP, off + SP, (s + 1) / (N + 1));
        acts[k].position.set(x, .36, pz(k)); wts[k].position.set(px(k), .44, x);
      }
      let energy = 0;
      let colDirty = false;
      for (const pe of pes) { const d = c - (pe.i + pe.j), f = Math.exp(-d * d * 2.2); energy += f;
        const q = Math.round(f * 40) / 40; if (q !== pe.f) { pe.f = q; peMesh.setColorAt(pe.k, peCol.copy(PE_BASE).lerp(PE_HOT, q)); colDirty = true; } }
      if (colDirty) peMesh.instanceColor.needsUpdate = true;
      glow.intensity = energy * .05;

      // package parts
      const pkgO = 1 - dive;
      lid.position.y = lerp(4.4 + .6, 46, ex) + dive * 30;
      lid.rotation.z = ex * .06; lid.rotation.x = -ex * .04;
      lid.material.forEach(m => m.opacity = pkgO); lid.visible = pkgO > .01;
      pkg.position.y = lerp(0, -12, ex) - dive * 20;
      [...subMats, wallMat, capBody.material, capEnd.material].forEach(m => m.opacity = pkgO);
      pkg.visible = pkgO > .01;
      ballG.position.y = lerp(-0.8 - PT - 1, -26, ex) - dive * 30;
      ballMesh.material.opacity = pkgO; ballG.visible = pkgO > .01;
      bondMat.opacity = .95 * (1 - smooth(.1, .16, p)); bonds.visible = bondMat.opacity > .01;
      // metal stack rises off the die and spreads
      stack.forEach(S2 => {
        const k = S2.k;
        S2.g.position.y = lerp(.55 + k * .07, 6 + k * 5.6, smooth(.12 + k * .014, .25 + k * .012, p)) + dive * (8 + k * 6);
        const o = lerp(.1, 1, ex) * (1 - smooth(.46, .56, p));
        S2.m.opacity = o * (S2.L.power ? .9 : .85); S2.f.opacity = o * .5; S2.g.visible = o > .01;
      });
      dieEdge.material.opacity = lerp(.5, .9, ex);

      // routing draws in once the camera is over the die
      routes.forEach((r, k) => { const q = smooth(.58 + (k % 6) * .02, .76 + (k % 6) * .02, p); r.ln.visible = q > 0; r.ln.geometry.setDrawRange(0, Math.ceil(q * r.n)); r.ln.material.opacity = .25 + q * .7; });

      // camera
      camAt(p, pos, look);
      pos.x += mx * lerp(8, 3, dive); pos.y -= my * lerp(5, 2, dive);
      if (!reduce) pos.x += Math.sin(t * .12) * lerp(2.5, .5, dive);
      cam.position.copy(pos); cam.lookAt(look);
      const r0 = PROF && performance.now(); renderer.render(scene, cam); if (PROF) PROF.render.push(performance.now() - r0);

      // labels
      labels.forEach(l => {
        const [x, y, z] = l.pos(); l.v.set(x, y, z).project(cam);
        const on = l.vis(st) && l.v.z < 1 && Math.abs(l.v.x) < 1.05;
        if (l.on !== on) { l.e.classList.toggle('on', on); l.on = on; }
        // GPU-only positioning (transform), and only when visible and actually moved
        if (on) { const x = Math.round((l.v.x * .5 + .5) * W * 2) / 2, y = Math.round((-l.v.y * .5 + .5) * H * 2) / 2;
          if (x !== l.x || y !== l.y) { l.x = x; l.y = y; l.e.style.transform = `translate3d(${x}px, ${y}px, 0) ${l.e.classList.contains('call') ? 'translate(14px, -50%)' : 'translate(-50%, -50%)'}`; } }
      });
    }
    return { frame };
  }

  /* ---------- main loop ---------- */
  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
  let last = -1;
  const nav = $('.nav');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function tick(time) {
    if (lenis) lenis.raf(time);
    stepScroll(time);
    const p = heroP();
    setBeats(p);
    if (gl && (visible || last < 0)) { const t0 = PROF && performance.now(); gl.frame(time, p); if (PROF) PROF.hero.push(performance.now() - t0); }
    last = p;
    const dp = docP(), r = $('#wcr');
    nav.classList.toggle('solid', scrollY > hero.offsetHeight - innerHeight - 40);
    if (r) r.setAttribute('width', dp * wW);
    cur.style.transform = `translateX(${dp * (wW - 1)}px)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* motion switch: follows the OS by default; a click stores the choice and reloads */
(() => {
  const b = document.getElementById('motion'); if (!b) return;
  let off; try { off = localStorage.getItem('motion') === 'off'; } catch (e) { off = false; }
  b.textContent = off ? 'Motion off' : 'Motion on'; b.setAttribute('aria-pressed', String(!off));
  b.addEventListener('click', () => { try { localStorage.setItem('motion', off ? 'on' : 'off'); } catch (e) {} location.reload(); });
})();
