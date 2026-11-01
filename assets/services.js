// Animated visuals for the three Services cards (same look as the hero terminal).
// Markup: <figure class="viz" data-viz="forecast|dag|uplift"> … <canvas aria-hidden="true"></canvas></figure>
// Plain canvas 2D, no libraries. Animates only while visible; one static frame with prefers-reduced-motion.
(function () {
  const C = {
    bg: '#0B1F25', grid: 'rgba(126,154,162,.16)', axis: 'rgba(126,154,162,.45)', label: '#7E9AA2', dim: '#6F8A92',
    cyan: '#79C0CF', teal: '#5E8C97', teal2: '#8FB3BC', amber: '#E9C46A', white: '#E6EBED',
  };
  const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  // deterministic pseudo-random numbers
  function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function gauss(n) { return (hash(n) + hash(n + 17.3) + hash(n + 41.9) + hash(n + 73.1) - 2) * 1.2; }
  const fontPx = w => clamp(Math.round(w / 34), 9, 12);
  function font(ctx, w, scale = 1, weight = 400) { ctx.font = `${weight} ${Math.round(fontPx(w) * scale)}px ${MONO}`; }

  // ======================================================================================
  // 1. 15-minute grid load: actuals + probabilistic forecast (p50, 50%/90% bands)
  // ======================================================================================
  const forecast = {
    // 15-minute grid load (MW): daily profile + weekday/weekend effect + AR(1) noise at quarter-hour resolution.
    // Time unit: hours since Monday 00:00 of day 0. Forecast = p50 + 50%/90% quantile bands widening with lead time.
    START: 2 * 24 + 14,                           // animation starts Wednesday 14:00
    SPEED: 0.9,                                   // simulated hours per second
    init() { return { e: [0] }; },
    noise(S, q) {                                 // AR(1) anomaly per quarter-hour, deterministic
      const e = S.e;
      while (e.length <= q) { const k = e.length; e.push(0.965 * e[k - 1] + 3.2 * gauss(k * 1.37)); }
      return e[q];
    },
    profile(h) {                                  // expected load in MW at hour h (periodic, no jumps at midnight)
      const circ = (hod, m, sd) => { let d = Math.abs(hod - m) % 24; d = Math.min(d, 24 - d); return Math.exp(-0.5 * (d / sd) ** 2); };
      const shape = (hod, shift) => 172
        + 62 * circ(hod, 11.8 + shift, 3.9)        // daytime plateau after the morning ramp
        - 16 * circ(hod, 13.6 + shift, 1.5)        // midday dip (solar)
        + 66 * circ(hod, 18.3 + shift, 1.35)       // evening peak ~17–19h
        - 8 * circ(hod, 4.0, 1.6);                 // night valley ~03–05h
      const hod = ((h % 24) + 24) % 24;
      const wd = shape(hod, 0), we = 165 + (shape(hod, 1.2) - 165) * 0.78;      // weekend: lower and later
      let wk = 0; for (let i = -6; i <= 6; i++) { const d = Math.floor((h + i * 0.5) / 24) % 7; wk += d >= 5 ? 1 : 0; }
      wk /= 13;                                    // smooth weekday/weekend transition around midnight
      return wd + (we - wd) * wk;
    },
    weather(h) { return 7 * Math.sin(2 * Math.PI * h / 61) + 4 * Math.sin(2 * Math.PI * h / 23.3); },
    actual(S, h) { const q = Math.floor(h * 4); return this.profile(q / 4) + this.weather(q / 4) + this.noise(S, q); },
    draw(ctx, w, h, t, S) {
      const fs = fontPx(w);
      font(ctx, w, 0.9);
      const yLabelW = ctx.measureText('300 MW').width + 8;
      const pad = { l: yLabelW + 4, r: 10, t: Math.round(fs * 1.7), b: Math.round(fs * 3.4) };
      const PW = w - pad.l - pad.r, PH = h - pad.t - pad.b;
      const now = this.START + t * this.SPEED;
      const past = 30, future = 30;
      const x = hr => pad.l + ((hr - (now - past)) / past / 2) * PW;
      const yMin = 135, yMax = 295;
      const y = v => pad.t + (1 - (v - yMin) / (yMax - yMin)) * PH;
      const nowX = x(now), qNow = Math.floor(now * 4);

      ctx.save(); ctx.beginPath(); ctx.rect(pad.l, 0, PW, h); ctx.clip();
      // time grid: every 6 h, labels 00:00 / 06:00 / 12:00 / 18:00 (only 00 and 12 on narrow cards)
      const narrow = (x(6) - x(0)) < ctx.measureText('00:00 ').width * 1.6;
      font(ctx, w, 0.85); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
      for (let g = Math.ceil((now - past) / 6) * 6; g <= now + future; g += 6) {
        const gx = x(g), hod = ((g % 24) + 24) % 24;
        ctx.strokeStyle = hod === 0 ? 'rgba(126,154,162,.28)' : C.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(gx, pad.t); ctx.lineTo(gx, pad.t + PH); ctx.stroke();
        const half = ctx.measureText('00:00').width / 2;
        if ((!narrow || hod % 12 === 0) && gx - half >= pad.l && gx + half <= pad.l + PW) {
          ctx.fillStyle = C.dim; ctx.fillText(String(hod).padStart(2, '0') + ':00', gx, pad.t + PH + fs * 1.15);
        }
      }
      ctx.restore();
      // y grid + MW labels
      font(ctx, w, 0.85); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (const v of [150, 200, 250]) {
        ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(pad.l, y(v)); ctx.lineTo(pad.l + PW, y(v)); ctx.stroke();
        ctx.fillStyle = C.dim; ctx.fillText(v + ' MW', pad.l - 6, y(v));
      }

      ctx.save(); ctx.beginPath(); ctx.rect(pad.l, 0, PW, h); ctx.clip();
      // forecast from "now": p50 = profile + decaying current anomaly; bands widen with lead time
      const anomaly = this.noise(S, qNow), steps = Math.round(future * 4);
      const p50 = hr => { const lead = hr - now; return this.profile(hr) + this.weather(hr) * Math.exp(-lead / 30) + anomaly * Math.pow(0.965, lead * 4); };
      const sd = hr => { const lead = Math.max(hr - now, 0); return 3 + 15 * (1 - Math.exp(-lead / 5)) + 0.35 * lead; };
      const band = (z, fill) => {
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) { const hr = now + i / 4; const v = p50(hr) + z * sd(hr); i ? ctx.lineTo(x(hr), y(v)) : ctx.moveTo(x(hr), y(v)); }
        for (let i = steps; i >= 0; i--) { const hr = now + i / 4; ctx.lineTo(x(hr), y(p50(hr) - z * sd(hr))); }
        ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
      };
      band(1.645, 'rgba(121,192,207,.13)');
      band(0.674, 'rgba(121,192,207,.25)');
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) { const hr = now + i / 4; i ? ctx.lineTo(x(hr), y(p50(hr))) : ctx.moveTo(x(hr), y(p50(hr))); }
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 1.8; ctx.stroke();

      // actuals: thin connected line at 15-min resolution, revealed up to "now"
      ctx.beginPath();
      const q0 = Math.floor((now - past) * 4) - 1;
      for (let q = q0; q <= qNow; q++) { const hr = q / 4, px = x(hr), py = y(this.actual(S, hr)); q === q0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
      ctx.lineTo(nowX, y(this.actual(S, qNow / 4)));
      ctx.strokeStyle = 'rgba(230,235,237,.85)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();

      // now line
      ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(230,235,237,.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(nowX, pad.t); ctx.lineTo(nowX, pad.t + PH); ctx.stroke(); ctx.setLineDash([]);
      font(ctx, w, 0.9); ctx.fillStyle = C.label; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('now', nowX, pad.t - fs * 0.45);

      // legend
      const fy = h - fs * 0.55; let lx = pad.l;
      font(ctx, w, 0.9); ctx.textAlign = 'left';
      const item = (drawSw, text) => { drawSw(lx, fy - fs * 0.35); lx += 15; ctx.fillStyle = C.label; ctx.fillText(text, lx, fy); lx += ctx.measureText(text).width + 11; };
      item((a, b) => { ctx.strokeStyle = 'rgba(230,235,237,.85)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(a, b + 1); ctx.lineTo(a + 3, b - 2); ctx.lineTo(a + 6, b + 1); ctx.lineTo(a + 10, b - 1); ctx.stroke(); }, 'actual');
      item((a, b) => { ctx.strokeStyle = C.cyan; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a + 10, b); ctx.stroke(); }, 'p50');
      item((a, b) => { ctx.fillStyle = 'rgba(121,192,207,.13)'; ctx.fillRect(a, b - 5, 10, 10); ctx.fillStyle = 'rgba(121,192,207,.28)'; ctx.fillRect(a, b - 2.5, 10, 5); }, 'p50/p90 band');
    },
  };

  // ======================================================================================
  // 2. Causal DAG with signal flow, backdoor path and adjustment
  // ======================================================================================
  const dag = {
    nodes: {
      Season: { x: 0.50, y: 0.12 },
      Promotion: { x: 0.19, y: 0.50, role: 'treat' },
      Demand: { x: 0.56, y: 0.52 },
      Price: { x: 0.86, y: 0.14 },
      Revenue: { x: 0.84, y: 0.88, role: 'out' },
    },
    edges: [['Season', 'Promotion'], ['Season', 'Demand'], ['Promotion', 'Demand'], ['Price', 'Demand'], ['Price', 'Revenue'], ['Demand', 'Revenue']],
    init() { return {}; },
    draw(ctx, w, h, t) {
      const fs = fontPx(w), padB = fs * 2.2, AH = h - padB;
      const P = 12;
      const cyc = 12, ph = (t % cyc);
      // phase weights
      const backdoor = ph > 4 && ph < 7.2 ? Math.min(1, (ph - 4) / 0.5) * Math.min(1, (7.2 - ph) / 0.4) : 0;
      const adjust = ph > 7 && ph < 11.6 ? Math.min(1, (ph - 7) / 0.5) * Math.min(1, (11.6 - ph) / 0.5) : 0;
      const causalPath = new Set(['Promotion>Demand', 'Demand>Revenue']);
      const backPath = new Set(['Season>Promotion', 'Season>Demand']);

      font(ctx, w, 1, 500);
      const box = {};
      for (const [k, n] of Object.entries(this.nodes)) {
        const tw = ctx.measureText(k).width, bw = tw + fs * 1.6, bh = fs * 2.1;
        const cx = P + n.x * (w - 2 * P), cy = P + n.y * (AH - 2 * P);
        box[k] = { cx, cy, hw: bw / 2, hh: bh / 2 };
      }
      const edgePts = (a, b) => {
        const A = box[a], B = box[b], dx = B.cx - A.cx, dy = B.cy - A.cy;
        const ta = Math.min(A.hw / Math.abs(dx || 1e-6), A.hh / Math.abs(dy || 1e-6));
        const tb = Math.min(B.hw / Math.abs(dx || 1e-6), B.hh / Math.abs(dy || 1e-6));
        return [A.cx + dx * ta, A.cy + dy * ta, B.cx - dx * (tb + 0.04), B.cy - dy * (tb + 0.04)];
      };

      // edges
      for (const [a, b] of this.edges) {
        const key = a + '>' + b, [x1, y1, x2, y2] = edgePts(a, b);
        let col = 'rgba(143,179,188,.45)', lw = 1.3, dash = [];
        if (causalPath.has(key)) { col = C.cyan; lw = 2.2; }
        if (backPath.has(key)) {
          if (backdoor > 0) { col = `rgba(233,196,106,${0.45 + 0.55 * backdoor})`; lw = 1.3 + backdoor; }
          if (adjust > 0) { col = `rgba(143,179,188,${0.45 - 0.3 * adjust})`; dash = [4, 4]; }
        }
        ctx.setLineDash(dash); ctx.strokeStyle = col; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
        // arrowhead
        const ang = Math.atan2(y2 - y1, x2 - x1), s = 6 + lw;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - s * Math.cos(ang - 0.42), y2 - s * Math.sin(ang - 0.42));
        ctx.lineTo(x2 - s * Math.cos(ang + 0.42), y2 - s * Math.sin(ang + 0.42)); ctx.closePath(); ctx.fill();
        // particles
        const blocked = backPath.has(key) && adjust > 0.3;
        if (!blocked) {
          const n = causalPath.has(key) ? 3 : 2, speed = causalPath.has(key) ? 0.42 : 0.3;
          for (let i = 0; i < n; i++) {
            const u = (t * speed + i / n + (key.length % 7) / 7) % 1;
            const px = lerp(x1, x2, u), py = lerp(y1, y2, u);
            const pc = causalPath.has(key) ? C.cyan : (backPath.has(key) && backdoor > 0 ? C.amber : C.teal2);
            ctx.globalAlpha = Math.sin(Math.PI * u) * 0.95; ctx.fillStyle = pc;
            ctx.beginPath(); ctx.arc(px, py, causalPath.has(key) ? 2.6 : 2, 0, 2 * Math.PI); ctx.fill(); ctx.globalAlpha = 1;
          }
        }
      }

      // nodes
      for (const [k, n] of Object.entries(this.nodes)) {
        const b = box[k], r = b.hh;
        const rr = (x, yy, ww, hh2, rad) => { ctx.beginPath(); ctx.moveTo(x + rad, yy); ctx.arcTo(x + ww, yy, x + ww, yy + hh2, rad); ctx.arcTo(x + ww, yy + hh2, x, yy + hh2, rad); ctx.arcTo(x, yy + hh2, x, yy, rad); ctx.arcTo(x, yy, x + ww, yy, rad); ctx.closePath(); };
        if (k === 'Season' && adjust > 0) {               // adjustment ring
          ctx.strokeStyle = `rgba(121,192,207,${0.9 * adjust})`; ctx.lineWidth = 2;
          rr(b.cx - b.hw - 4, b.cy - b.hh - 4, 2 * b.hw + 8, 2 * b.hh + 8, r + 4); ctx.stroke();
        }
        rr(b.cx - b.hw, b.cy - b.hh, 2 * b.hw, 2 * b.hh, r);
        ctx.fillStyle = n.role === 'treat' ? '#123540' : n.role === 'out' ? '#2A2A1E' : '#0F2A31'; ctx.fill();
        ctx.strokeStyle = n.role === 'treat' ? C.cyan : n.role === 'out' ? C.amber : (k === 'Season' && backdoor > 0 ? C.amber : '#2E5059');
        ctx.lineWidth = n.role ? 1.6 : 1.2; ctx.stroke();
        font(ctx, w, 1, 500); ctx.fillStyle = n.role ? C.white : '#CFE3E8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(k, b.cx, b.cy + 0.5);
      }

      // status line
      font(ctx, w, 0.95); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      const yy = h - fs * 0.6;
      let msg, col;
      if (adjust > 0.5) { msg = 'adjust for {Season} → effect identified ✓'; col = C.cyan; }
      else if (backdoor > 0.5) { msg = 'backdoor: Promotion ← Season → Demand'; col = C.amber; }
      else { msg = 'effect: Promotion → Demand → Revenue'; col = C.label; }
      ctx.fillStyle = col; ctx.fillText(msg, P, yy);
    },
  };

  // ======================================================================================
  // 3. Causal ML: heterogeneous treatment effects (CATE) + uplift curve
  // ======================================================================================
  const uplift = {
    init() {
      const N = 150, pts = [];
      for (let i = 0; i < N; i++) {
        const x1 = hash(i * 3.1 + 1), x2 = hash(i * 5.7 + 2);
        const tau = 0.65 * Math.sin(Math.PI * x1) * (0.35 + 0.65 * x2) + 0.25 * (x1 > 0.62 && x2 > 0.5 ? 1 : 0) - 0.08;
        pts.push({ x1, x2, tau, noise: 0.35 * gauss(i * 9.3), delay: hash(i * 2.3 + 7) });
      }
      const tmin = Math.min(...pts.map(p => p.tau)), tmax = Math.max(...pts.map(p => p.tau));
      pts.forEach(p => { p.u = (p.tau - tmin) / (tmax - tmin); });
      // oracle uplift curve: target in order of true effect
      const sorted = [...pts].sort((a, b) => b.tau - a.tau);
      const tot = pts.reduce((s, p) => s + p.tau, 0);
      let acc = 0; const curve = [0];
      sorted.forEach(p => { acc += p.tau; curve.push(acc / tot); });
      return { pts, curve, N };
    },
    color(v) {                                   // teal → cyan → amber
      const stops = [[0, [46, 106, 119]], [0.5, [121, 192, 207]], [1, [233, 196, 106]]];
      v = clamp(v, 0, 1); let i = v < 0.5 ? 0 : 1; const f = (v - stops[i][0]) / 0.5;
      const c = stops[i][1].map((a, j) => Math.round(lerp(a, stops[i + 1][1][j], f)));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    },
    draw(ctx, w, h, t, S) {
      const fs = fontPx(w), cyc = 11, ph = t % cyc;
      const prog = ph < 7 ? ease(ph / 7) : ph < 10 ? 1 : 1 - (ph - 10);      // fit, hold, quick reset
      const padB = fs * 2.6, P = 10;
      const sx = P + fs * 0.4, sy = P + fs * 1.2, sw = w * 0.58 - sx, sh = h - padB - sy - fs * 0.4;
      // scatter frame
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy + sh); ctx.lineTo(sx + sw, sy + sh); ctx.stroke();
      font(ctx, w, 0.9); ctx.fillStyle = C.dim; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'right'; ctx.fillText('x₁ →', sx + sw, sy + sh + fs * 1.05);
      ctx.textAlign = 'left'; ctx.fillText('↑ x₂', sx - 2, sy - fs * 0.45);
      const r = clamp(w / 120, 2.4, 3.8);
      for (const p of S.pts) {
        const local = clamp((prog * 1.25 - p.delay * 0.25), 0, 1);
        const est = lerp(0.5, clamp(p.u + p.noise * (1 - local) * 0.6, 0, 1), local);
        ctx.fillStyle = this.color(est); ctx.globalAlpha = 0.55 + 0.45 * local;
        ctx.beginPath(); ctx.arc(sx + 4 + p.x1 * (sw - 8), sy + 4 + (1 - p.x2) * (sh - 8), r, 0, 2 * Math.PI); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // colour bar
      const cbx = sx, cby = h - fs * 1.05, cbw = Math.min(sw * 0.38, 80), cbh = 5;
      for (let i = 0; i < cbw; i++) { ctx.fillStyle = this.color(i / cbw); ctx.fillRect(cbx + i, cby, 1.2, cbh); }
      font(ctx, w, 0.9); ctx.fillStyle = C.label; ctx.textBaseline = 'middle';
      ctx.fillText('τ̂(x)  CATE', cbx + cbw + 8, cby + cbh / 2);

      // uplift curve inset
      const ix = w * 0.645, iy = P + fs * 1.2, iw = w - ix - P, ih = h - padB - iy - fs * 0.4;
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ix, iy + ih); ctx.lineTo(ix + iw, iy + ih); ctx.stroke();
      const X = f => ix + f * iw, Y = v => iy + ih - clamp(v, 0, 1.15) / 1.15 * ih;
      ctx.setLineDash([3, 4]); ctx.strokeStyle = C.dim; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1), Y(1)); ctx.stroke(); ctx.setLineDash([]);
      const n = S.curve.length - 1;
      const val = i => lerp(i / n, S.curve[i], prog);
      ctx.beginPath(); ctx.moveTo(X(0), Y(0));
      for (let i = 1; i <= n; i++) ctx.lineTo(X(i / n), Y(val(i)));
      ctx.lineTo(X(1), Y(1));
      for (let i = n; i >= 0; i--) ctx.lineTo(X(i / n), Y(i / n));
      ctx.closePath(); ctx.fillStyle = 'rgba(121,192,207,.18)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(X(0), Y(0));
      for (let i = 1; i <= n; i++) ctx.lineTo(X(i / n), Y(val(i)));
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 2; ctx.stroke();
      font(ctx, w, 0.9); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      ctx.fillStyle = C.label; ctx.fillText('uplift curve', ix, iy - fs * 0.45);
      ctx.fillStyle = C.dim; ctx.textAlign = 'right'; ctx.fillText('random', ix + iw - 2, Y(0.42));
      ctx.textAlign = 'left'; ctx.fillStyle = C.label;
      ctx.textAlign = 'right'; ctx.fillText('% targeted →', ix + iw, iy + ih + fs * 1.05);
    },
  };

  const VIZ = { forecast, dag, uplift };
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [];

  document.querySelectorAll('figure.viz[data-viz]').forEach(fig => {
    const kind = VIZ[fig.dataset.viz], canvas = fig.querySelector('canvas');
    if (!kind || !canvas) return;
    const item = { fig, kind, canvas, ctx: canvas.getContext('2d'), state: kind.init(), visible: false, w: 0, h: 0, t0: performance.now() };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = canvas.clientWidth || 320, h = Math.round(w * 10 / 16);
      if (w === item.w) return;
      item.w = w; item.h = h; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      item.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(item, reduced ? staticT(fig.dataset.viz) : (performance.now() - item.t0) / 1000);
    };
    item.resize = resize;
    items.push(item);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
    resize();
  });
  function staticT(kind) { return kind === 'forecast' ? 3 : kind === 'dag' ? 8.5 : 8.5; }
  function render(item, t) {
    const { ctx, w, h } = item; if (!w) return;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    item.kind.draw(ctx, w, h, t, item.state);
  }
  if (reduced || !items.length) return;

  let running = false;
  function loop(now) {
    let any = false;
    for (const it of items) if (it.visible) { any = true; render(it, (now - it.t0) / 1000); }
    if (any) requestAnimationFrame(loop); else running = false;
  }
  const io = new IntersectionObserver(es => {
    es.forEach(e => { const it = items.find(i => i.canvas === e.target); if (it) it.visible = e.isIntersecting; });
    if (!running && items.some(i => i.visible)) { running = true; requestAnimationFrame(loop); }
  });
  items.forEach(it => io.observe(it.canvas));
})();
