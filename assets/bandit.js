// Hero animation: Gaussian Thompson sampling for a 10-armed bandit, drawn as a tilted 3-D ridge plot.
//
// Every arm pays a Gaussian reward with unknown mean mu_k (noise sd 1) and has a N(0, 1) prior on mu_k, so its
// posterior stays Gaussian: N(m_k, s_k^2). Each pull draws one value from every posterior, pulls the arm with the
// largest draw, observes the reward and updates that posterior. The ten posterior densities stand one behind the
// other on a grid, seen slightly from above and from the side (the view sways gently). Small dots on each
// baseline are the current draws; the arm that won the draw is highlighted; the faint tick is its true mean.
// Stats: cumulative regret of Thompson sampling and of uniformly random choice. Plain canvas, no libraries.
(function () {
  const canvas = document.querySelector('canvas.bandit');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stat = k => document.querySelector(`[data-k="${k}"]`);
  const TRUE_MU = [-0.6, 0.3, -1.1, 0.8, -0.2, 1.2, -0.8, 0.5, -1.4, 0.1];       // unknown to the algorithm
  const K = TRUE_MU.length, BEST = Math.max(...TRUE_MU), N_MAX = 900, G = 160;
  const SIGMA = 1, PRIOR_SD = 1, LO = -3, HI = 3;                                  // reward noise, prior, axis range
  const nx = v => (v - LO) / (HI - LO);                                            // value -> [0, 1] across the plot
  const TEAL = [121, 192, 207], AMBER = [233, 196, 106];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  function randn() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  const XS = Array.from({ length: G + 1 }, (_, i) => i / G);
  function heights(m, sd, out) {                              // Gaussian density, compressed so sharp peaks stay on screen
    for (let i = 0; i <= G; i++) {
      const v = LO + XS[i] * (HI - LO), z = (v - m) / sd, d = Math.exp(-0.5 * z * z) / (sd * 2.5066282746);
      out[i] = d / (d + 1.1);
    }
  }

  // ---- state: posterior precision and precision-weighted sum per arm ----
  let prec, sum, pulls, regTS, regR, draws, chosen, lastPull, target, shown;
  const post = k => ({ m: sum[k] / prec[k], sd: 1 / Math.sqrt(prec[k]) });
  function reset() {
    prec = new Array(K).fill(1 / (PRIOR_SD * PRIOR_SD)); sum = new Array(K).fill(0);
    pulls = 0; regTS = 0; regR = 0; draws = null; chosen = -1; lastPull = 0;
    target = TRUE_MU.map(() => new Float64Array(G + 1)); shown = TRUE_MU.map(() => new Float64Array(G + 1));
    for (let k = 0; k < K; k++) { heights(0, PRIOR_SD, target[k]); shown[k].set(target[k]); }
  }
  function pull(now) {
    const samples = TRUE_MU.map((_, k) => { const { m, sd } = post(k); return m + sd * randn(); });
    chosen = samples.indexOf(Math.max(...samples));
    const r = TRUE_MU[chosen] + SIGMA * randn();
    prec[chosen] += 1 / (SIGMA * SIGMA); sum[chosen] += r / (SIGMA * SIGMA);
    const { m, sd } = post(chosen); heights(m, sd, target[chosen]);
    draws = samples.map(v => Math.min(Math.max(nx(v), 0), 1));
    regTS += BEST - TRUE_MU[chosen]; regR += BEST - TRUE_MU[Math.floor(Math.random() * K)];
    pulls++; lastPull = now;
  }

  // ---- projection: x = reward axis scaled to [0, 1] (left-right), k = arm (front-back), y = density (up) ----
  let W, H, sway = 0, fit = null;
  function raw(x, k, y) {
    const X = (x - 0.5) * 2.1, Z = (k - (K - 1) / 2) * 0.2, Y = y * 0.6;
    const yaw = -0.2 + sway, pitch = 0.48, D = 4.2;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const X1 = X * cy - Z * sy, Z1 = X * sy + Z * cy;
    const Y2 = Y * cp + Z1 * sp, Z2 = Z1 * cp - Y * sp;
    return [X1 / (D + Z2), -Y2 / (D + Z2)];
  }
  function fitView() {                                        // scale the scene to fill the canvas (with room for labels)
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const x of [0, 1]) for (const k of [-0.6, K - 0.4]) for (const y of [0, 0.85]) {
      const [u, v] = raw(x, k, y); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v);
    }
    const mL = W * 0.06, mR = W * 0.03, mT = H * 0.03, mB = H * 0.09;
    const s = Math.min((W - mL - mR) / (u1 - u0), (H - mT - mB) / (v1 - v0));
    fit = { s, ox: mL + ((W - mL - mR) - s * (u1 - u0)) / 2 - s * u0, oy: mT + ((H - mT - mB) - s * (v1 - v0)) / 2 - s * v0 };
  }
  function project(x, k, y) { const [u, v] = raw(x, k, y); return [fit.ox + fit.s * u, fit.oy + fit.s * v]; }

  function draw(now) {
    W = canvas.width; H = canvas.height; ctx.clearRect(0, 0, W, H);
    sway = 0.06 * Math.sin(now / 5200); if (!fit || fit.W !== W) { const sv = sway; sway = 0; fitView(); fit.W = W; sway = sv; }
    const fs = Math.round(W / 48); ctx.font = `${fs}px ui-monospace, Menlo, monospace`;

    // floor grid: lines of constant reward running back in depth
    ctx.lineWidth = 1;
    for (const x of [0, nx(-2), nx(-1), nx(0), nx(1), nx(2), 1]) {
      const [x0, y0] = project(x, -0.6, 0), [x1, y1] = project(x, K - 0.4, 0);
      ctx.strokeStyle = x === 0 || x === 1 ? 'rgba(126,154,162,.35)' : x === nx(0) ? 'rgba(126,154,162,.28)' : 'rgba(126,154,162,.14)';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    ctx.fillStyle = '#6F8A92'; ctx.textAlign = 'center';
    for (const v of [-2, 0, 2]) { const [tx, ty] = project(nx(v), -0.6, 0); ctx.fillText(String(v).replace('-', '−'), tx, ty + fs + 4); }
    { const [tx, ty] = project(nx(2.8), -0.6, 0); ctx.textAlign = 'right'; ctx.fillText('μ →', tx, ty + fs + 4); }

    // ease the drawn densities towards the current posteriors
    const e = 0.18;
    for (let k = 0; k < K; k++) { const s = shown[k], t = target[k]; for (let i = 0; i <= G; i++) s[i] += (t[i] - s[i]) * e; }

    // ridges, painted back to front
    const flash = Math.max(0, 1 - (now - lastPull) / 900);
    for (let k = K - 1; k >= 0; k--) {
      const win = k === chosen, depth = k / (K - 1), base = 0.85 - 0.45 * depth;
      const col = win ? AMBER : TEAL, pts = [];
      for (let i = 0; i <= G; i++) pts.push(project(XS[i], k, shown[k][i]));
      const [bx0, by0] = project(0, k, 0), [bx1, by1] = project(1, k, 0);
      let top = Infinity; for (const p of pts) top = Math.min(top, p[1]);
      const g = ctx.createLinearGradient(0, top, 0, Math.max(by0, by1));
      g.addColorStop(0, rgba(col, (win ? 0.34 : 0.22) * base + 0.05)); g.addColorStop(1, 'rgba(12,32,38,0.92)');
      ctx.beginPath(); ctx.moveTo(bx0, by0); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.lineTo(bx1, by1); ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.strokeStyle = rgba(col, win ? 0.55 + 0.45 * Math.max(flash, 0.4) : base); ctx.lineWidth = win ? 2.4 : 1.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(bx1, by1); ctx.strokeStyle = 'rgba(126,154,162,.28)'; ctx.lineWidth = 1; ctx.stroke();
      const [px, py] = project(nx(TRUE_MU[k]), k, 0);
      ctx.strokeStyle = 'rgba(230,235,237,.35)'; ctx.beginPath(); ctx.moveTo(px, py - 4); ctx.lineTo(px, py + 4); ctx.stroke();
      if (draws) {
        const [dx, dy] = project(draws[k], k, 0);
        if (win) {
          const i = Math.round(draws[k] * G), [, cy] = project(draws[k], k, shown[k][i]);
          ctx.strokeStyle = rgba(AMBER, 0.5 + 0.5 * flash); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx, cy); ctx.stroke();
          ctx.beginPath(); ctx.arc(dx, dy, 4 + 5 * flash, 0, 7); ctx.fillStyle = rgba(AMBER, 0.95); ctx.fill();
        } else { ctx.beginPath(); ctx.arc(dx, dy, 2.6, 0, 7); ctx.fillStyle = rgba(TEAL, 0.45 + 0.4 * base); ctx.fill(); }
      }
      ctx.fillStyle = win ? rgba(AMBER, 0.95) : `rgba(126,154,162,${0.55 + 0.3 * base})`; ctx.textAlign = 'right';
      ctx.font = `${Math.round(fs * (0.92 - 0.22 * depth))}px ui-monospace, Menlo, monospace`;
      ctx.fillText(String(k + 1), bx0 - 8, by0 + 4);
      ctx.font = `${fs}px ui-monospace, Menlo, monospace`;
    }
    { const [lx, ly] = project(0, K - 1, 0); ctx.fillStyle = '#6F8A92'; ctx.textAlign = 'right'; ctx.fillText('arm', lx - 8, ly - fs); }

    const set = (k, v) => { const el = stat(k); if (el) el.textContent = v; };
    set('pulls', pulls); set('match', regTS.toFixed(1)); set('regret', regR.toFixed(1));
  }

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  reset();
  if (reduced) { const n = performance.now(); for (let i = 0; i < 500; i++) pull(n); for (let k = 0; k < K; k++) shown[k].set(target[k]); draw(n + 2000); return; }
  let visible = false, last = 0, hold = 0;
  function tick(now) {
    if (!visible) return;
    const interval = pulls < 25 ? 520 : pulls < 120 ? 170 : 70;      // slow start so single pulls are readable
    if (now - last > interval) {
      last = now;
      if (pulls >= N_MAX) { if (!hold) hold = now; if (now - hold > 4000) { reset(); hold = 0; } } else pull(now);
    }
    draw(now); requestAnimationFrame(tick);
  }
  new IntersectionObserver(es => es.forEach(e => { const was = visible; visible = e.isIntersecting; if (visible && !was) requestAnimationFrame(tick); })).observe(canvas);
  draw(performance.now());
})();
