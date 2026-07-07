/* ════════════════════════════════════════════
   UTILITIES
════════════════════════════════════════════ */
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/* ════════════════════════════════════════════
   PARTICLE SYSTEM
════════════════════════════════════════════ */
function createParticles(n, xMin, xMax, yMin, yMax, color, speed) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    arr.push({
      x: xMin + Math.random() * (xMax - xMin),
      y: yMin + Math.random() * (yMax - yMin),
      vx: Math.cos(angle) * speed * (0.5 + Math.random()),
      vy: Math.sin(angle) * speed * (0.5 + Math.random()),
      r: 3.5 + Math.random() * 1.5,
      color
    });
  }
  return arr;
}

function updateParticles(particles, xMin, xMax, yMin, yMax, speedFactor) {
  particles.forEach(p => {
    p.x += p.vx * speedFactor;
    p.y += p.vy * speedFactor;
    if (p.x - p.r < xMin) { p.x = xMin + p.r; p.vx = Math.abs(p.vx); }
    if (p.x + p.r > xMax) { p.x = xMax - p.r; p.vx = -Math.abs(p.vx); }
    if (p.y - p.r < yMin) { p.y = yMin + p.r; p.vy = Math.abs(p.vy); }
    if (p.y + p.r > yMax) { p.y = yMax - p.r; p.vy = -Math.abs(p.vy); }
  });
}

function drawParticles(ctx, particles, glow) {
  particles.forEach(p => {
    ctx.save();
    if (glow) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  });
}

/* ════════════════════════════════════════════
   MINI CHART HELPER
════════════════════════════════════════════ */
function drawMiniChart(canvasId, points, xLabel, yLabel, color, currentX, currentY) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement.clientWidth - 24 || 260;
  const H = 150;
  canvas.width  = W;
  canvas.height = H;

  const pad = { l: 46, r: 16, t: 14, b: 32 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  ctx.fillStyle = '#081420';
  ctx.fillRect(0, 0, W, H);

  // grid
  ctx.strokeStyle = '#1a3550';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (i / 4) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
  }
  for (let i = 0; i <= 5; i++) {
    const x = pad.l + (i / 5) * plotW;
    ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
  }

  // axes
  ctx.strokeStyle = '#2a5070';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b);
  ctx.lineTo(W - pad.r, H - pad.b);
  ctx.stroke();

  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = 0, yMax = Math.max(...ys) * 1.1;

  function px(v) { return pad.l + ((v - xMin) / (xMax - xMin)) * plotW; }
  function py(v) { return H - pad.b - ((v - yMin) / (yMax - yMin)) * plotH; }

  // curve
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  points.forEach((p, i) => {
    i === 0 ? ctx.moveTo(px(p[0]), py(p[1])) : ctx.lineTo(px(p[0]), py(p[1]));
  });
  ctx.stroke();
  ctx.shadowBlur = 0;

  // current point
  ctx.beginPath();
  ctx.arc(px(currentX), py(currentY), 6, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;

  // labels
  ctx.fillStyle = '#4a7a9a';
  ctx.font = '10px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(xLabel, pad.l + plotW / 2, H - 4);
  ctx.save(); ctx.translate(12, pad.t + plotH / 2);
  ctx.rotate(-Math.PI / 2); ctx.fillText(yLabel, 0, 0); ctx.restore();

  // axis tick values
  ctx.font = '9px monospace';
  ctx.fillStyle = '#3a6080';
  ctx.textAlign = 'right';
  [0, 0.5, 1].forEach(f => {
    const v = yMin + f * (yMax - yMin);
    ctx.fillText(v.toFixed(1), pad.l - 4, py(v) + 3);
  });
  ctx.textAlign = 'center';
  [0, 0.5, 1].forEach(f => {
    const v = xMin + f * (xMax - xMin);
    ctx.fillText(v.toFixed(0), px(v), H - pad.b + 12);
  });
}

/* ════════════════════════════════════════════
   TAB SWITCHING
════════════════════════════════════════════ */
function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}

/* ════════════════════════════════════════════
   BOYLE SIMULATION
════════════════════════════════════════════ */
const boyle = {
  canvas: null, ctx: null,
  particles: [],
  p1Ref: 1.0,
  v1Ref: 200,
  animId: null
};

function initBoyle() {
  boyle.canvas = document.getElementById('boyleCanvas');
  boyle.ctx    = boyle.canvas.getContext('2d');
  boyle.canvas.width  = boyle.canvas.parentElement.clientWidth  || 560;
  boyle.canvas.height = 320;
  boyle.particles = createParticles(30, 0, 1, 0, 1, '#7ecfff', 1.2);
  animateBoyle();
}

function animateBoyle() {
  if (boyle.animId) cancelAnimationFrame(boyle.animId);
  const p  = parseFloat(document.getElementById('boyle-p1').value);
  const k  = boyle.p1Ref * boyle.v1Ref;
  const v2 = k / p;
  drawBoyle(p, v2);
  boyle.animId = requestAnimationFrame(animateBoyle);
}

function drawBoyle(pressure, volume) {
  const ctx = boyle.ctx;
  const W   = boyle.canvas.width;
  const H   = boyle.canvas.height;
  ctx.clearRect(0, 0, W, H);

  // background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#081420');
  bg.addColorStop(1, '#0d1f30');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // cylinder dimensions based on volume
  const vRatio   = clamp(volume / boyle.v1Ref, 0.3, 2.5);
  const cylH     = 160;
  const cylW_max = W * 0.55;
  const cylW     = clamp(cylW_max * vRatio * 0.7, 80, cylW_max);
  const cylX     = (W - cylW) / 2;
  const cylY     = (H - cylH) / 2;
  const thick    = 8;

  // glow based on pressure
  const glowAlpha = clamp((pressure - 0.5) / 3.5, 0, 1);
  ctx.shadowColor = `rgba(255, 100, 100, ${glowAlpha * 0.6})`;
  ctx.shadowBlur  = 20 * glowAlpha;

  // cylinder body
  ctx.fillStyle = 'rgba(20, 50, 80, 0.85)';
  ctx.beginPath();
  ctx.roundRect(cylX, cylY, cylW, cylH, 6);
  ctx.fill();
  ctx.shadowBlur = 0;

  // cylinder border
  const borderGrad = ctx.createLinearGradient(cylX, 0, cylX + cylW, 0);
  borderGrad.addColorStop(0, '#2a6090');
  borderGrad.addColorStop(1, '#1a4060');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = thick;
  ctx.beginPath();
  ctx.roundRect(cylX + thick / 2, cylY + thick / 2,
    cylW - thick, cylH - thick, 4);
  ctx.stroke();

  // piston
  const pistonGrad = ctx.createLinearGradient(0, cylY, 0, cylY + 20);
  const pCol = pressure > 2 ? '#ff7070' : pressure > 1.5 ? '#ff9944' : '#aaddff';
  pistonGrad.addColorStop(0, pCol);
  pistonGrad.addColorStop(1, '#2a5070');
  ctx.fillStyle = pistonGrad;
  ctx.beginPath();
  ctx.roundRect(cylX + thick, cylY, cylW - thick * 2, 20, [4, 4, 0, 0]);
  ctx.fill();

  // piston handle
  ctx.strokeStyle = '#aaddff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(W / 2, cylY);
  ctx.lineTo(W / 2, cylY - 30);
  ctx.stroke();

  // arrow indicating piston direction
  const arrowUp = pressure > boyle.p1Ref;
  ctx.fillStyle = arrowUp ? '#ff8585' : '#85ff85';
  ctx.beginPath();
  const ax = W / 2, ay = cylY - 30;
  if (arrowUp) {
    ctx.moveTo(ax, ay - 14); ctx.lineTo(ax + 10, ay); ctx.lineTo(ax - 10, ay);
  } else {
    ctx.moveTo(ax, ay + 14); ctx.lineTo(ax + 10, ay); ctx.lineTo(ax - 10, ay);
  }
  ctx.fill();

  // update particles to stay inside cylinder
  const pxMin = cylX + thick + 4;
  const pxMax = cylX + cylW - thick - 4;
  const pyMin = cylY + 22;
  const pyMax = cylY + cylH - thick;

  const speedFactor = clamp(pressure / boyle.p1Ref, 0.5, 3);
  updateParticles(boyle.particles, pxMin, pxMax, pyMin, pyMax, speedFactor);

  // nudge out-of-bounds particles
  boyle.particles.forEach(p => {
    p.x = clamp(p.x, pxMin + p.r, pxMax - p.r);
    p.y = clamp(p.y, pyMin + p.r, pyMax - p.r);
  });

  // particle color: red if pressure high
  boyle.particles.forEach(p => {
    p.color = pressure > 2.5 ? '#ff7070' : pressure > 1.5 ? '#ffa070' : '#7ecfff';
  });
  drawParticles(ctx, boyle.particles, true);

  // labels
  ctx.font = 'bold 13px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a0d4f0';
  ctx.fillText(`P = ${pressure.toFixed(1)} atm`, W / 2, cylY - 44);
  ctx.font = '11px Segoe UI';
  ctx.fillStyle = '#6a9ab8';
  ctx.fillText(`V = ${(boyle.v1Ref * boyle.p1Ref / pressure).toFixed(1)} L`, W / 2, cylY - 28);

  // T label
  ctx.fillStyle = '#3a7a3a';
  ctx.fillText('T = konstan', W / 2, cylY + cylH + 22);

  // thermometer icon
  drawThermometer(ctx, cylX - 40, cylY + cylH / 2, 0.5, '#3a9a5a');
}

function updateBoyle() {
  const p = parseFloat(document.getElementById('boyle-p1').value);
  const k = boyle.p1Ref * boyle.v1Ref;
  const v2 = k / p;
  document.getElementById('boyle-p1-val').textContent    = p.toFixed(1) + ' atm';
  document.getElementById('boyle-p1-disp').textContent   = p.toFixed(1) + ' atm';
  document.getElementById('boyle-v1').textContent         = boyle.v1Ref + ' L';
  document.getElementById('boyle-v2').textContent         = v2.toFixed(1) + ' L';
  document.getElementById('boyle-k').textContent          = k.toFixed(1);

  // chart
  const pts = [];
  for (let pp = 0.3; pp <= 4.5; pp += 0.2) pts.push([pp, k / pp]);
  drawMiniChart('boyleChart', pts, 'P (atm)', 'V (L)', '#ff6b6b', p, v2);
}

/* ════════════════════════════════════════════
   CHARLES SIMULATION
════════════════════════════════════════════ */
const charles = {
  canvas: null, ctx: null,
  particles: [],
  tRef: 300, vRef: 100,
  animId: null
};

function initCharles() {
  charles.canvas = document.getElementById('charlesCanvas');
  charles.ctx    = charles.canvas.getContext('2d');
  charles.canvas.width  = charles.canvas.parentElement.clientWidth || 560;
  charles.canvas.height = 320;
  charles.particles = createParticles(28, 0, 1, 0, 1, '#ffd166', 1.0);
  animateCharles();
}

function animateCharles() {
  if (charles.animId) cancelAnimationFrame(charles.animId);
  const T  = parseFloat(document.getElementById('charles-t').value);
  const V  = charles.vRef * T / charles.tRef;
  drawCharles(T, V);
  charles.animId = requestAnimationFrame(animateCharles);
}

function drawCharles(T, V) {
  const ctx = charles.ctx;
  const W   = charles.canvas.width;
  const H   = charles.canvas.height;
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a1820');
  bg.addColorStop(1, '#0d2030');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // cylinder that changes height
  const vRatio  = V / charles.vRef;
  const baseH   = 180;
  const cylH    = clamp(baseH * vRatio, 60, 260);
  const cylW    = 120;
  const cylX    = (W - cylW) / 2;
  const cylY    = H / 2 + 60 - cylH;
  const thick   = 7;

  // heat glow at bottom
  const heatIntensity = clamp((T - 100) / 500, 0, 1);
  const glowR = Math.floor(lerp(50, 255, heatIntensity));
  const glowG = Math.floor(lerp(60, 120, 1 - heatIntensity));
  ctx.shadowColor = `rgb(${glowR},${glowG},30)`;
  ctx.shadowBlur  = 30 * heatIntensity;

  // bottom base (fixed)
  ctx.fillStyle = '#2a5070';
  ctx.beginPath();
  ctx.roundRect(cylX - 10, H / 2 + 60, cylW + 20, 14, 4);
  ctx.fill();
  ctx.shadowBlur = 0;

  // cylinder walls
  ctx.fillStyle = 'rgba(15, 40, 65, 0.9)';
  ctx.fillRect(cylX, cylY, cylW, cylH);
  ctx.strokeStyle = '#2a6090';
  ctx.lineWidth = thick;
  ctx.strokeRect(cylX + thick / 2, cylY, cylW - thick, cylH - thick / 2);

  // flame at bottom
  if (T > 200) drawFlame(ctx, W / 2, H / 2 + 76, heatIntensity);

  // piston on top
  const pGrad = ctx.createLinearGradient(0, cylY - 8, 0, cylY + 8);
  pGrad.addColorStop(0, '#aaddff');
  pGrad.addColorStop(1, '#2a6090');
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.roundRect(cylX + thick, cylY - 4, cylW - thick * 2, 18, 4);
  ctx.fill();

  // piston rod
  ctx.strokeStyle = '#5a9abf';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(W / 2, cylY - 4);
  ctx.lineTo(W / 2, cylY - 30);
  ctx.stroke();

  // particles
  const pxMin = cylX + thick + 4;
  const pxMax = cylX + cylW - thick - 4;
  const pyMin = cylY + 18;
  const pyMax = H / 2 + 60 - 4;

  const spd = clamp(T / charles.tRef, 0.4, 3.5);
  updateParticles(charles.particles, pxMin, pxMax, pyMin, pyMax, spd);
  charles.particles.forEach(p => {
    p.x = clamp(p.x, pxMin + p.r, pxMax - p.r);
    p.y = clamp(p.y, pyMin + p.r, pyMax - p.r);
    const hot = clamp((T - 100) / 500, 0, 1);
    p.color = `hsl(${lerp(210, 30, hot)}, 90%, 70%)`;
  });
  drawParticles(ctx, charles.particles, true);

  // labels
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px Segoe UI';
  ctx.fillStyle = '#ffe080';
  ctx.fillText(`T = ${T} K (${T - 273} °C)`, W / 2, cylY - 44);
  ctx.font = '11px Segoe UI';
  ctx.fillStyle = '#a0cce0';
  ctx.fillText(`V = ${V.toFixed(1)} L`, W / 2, cylY - 28);
  ctx.fillStyle = '#5a9a7a';
  ctx.fillText('P = konstan', W / 2, H / 2 + 86);

  // thermometer
  drawThermometer(ctx, cylX - 42, H / 2, heatIntensity, `hsl(${lerp(210, 20, heatIntensity)},90%,55%)`);
}

function drawFlame(ctx, x, y, intensity) {
  const flameH = 20 * intensity;
  for (let i = 0; i < 5; i++) {
    const fi = i / 4;
    ctx.beginPath();
    ctx.ellipse(
      x + (fi - 0.5) * 30,
      y - flameH * fi,
      4 + fi * 6,
      8 + fi * flameH,
      0, 0, Math.PI * 2
    );
    ctx.fillStyle = `rgba(255, ${Math.floor(lerp(200, 60, fi))}, 0, ${0.6 - fi * 0.3})`;
    ctx.fill();
  }
}

function updateCharles() {
  const T  = parseFloat(document.getElementById('charles-t').value);
  const V  = charles.vRef * T / charles.tRef;
  document.getElementById('charles-t-val').textContent   = T + ' K';
  document.getElementById('charles-t-disp').textContent  = T + ' K';
  document.getElementById('charles-tc').textContent      = (T - 273) + ' °C';
  document.getElementById('charles-v').textContent       = V.toFixed(1) + ' L';
  document.getElementById('charles-ratio').textContent   = (V / T).toFixed(4);

  const pts = [];
  for (let t = 80; t <= 650; t += 20) pts.push([t, charles.vRef * t / charles.tRef]);
  drawMiniChart('charlesChart', pts, 'T (K)', 'V (L)', '#ffd166', T, V);
}

/* ════════════════════════════════════════════
   GAY-LUSSAC SIMULATION
════════════════════════════════════════════ */
const gay = {
  canvas: null, ctx: null,
  particles: [],
  tRef: 300, pRef: 1.0,
  animId: null
};

function initGay() {
  gay.canvas = document.getElementById('gayCanvas');
  gay.ctx    = gay.canvas.getContext('2d');
  gay.canvas.width  = gay.canvas.parentElement.clientWidth || 560;
  gay.canvas.height = 320;
  gay.particles = createParticles(30, 0, 1, 0, 1, '#06d6a0', 1.0);
  animateGay();
}

function animateGay() {
  if (gay.animId) cancelAnimationFrame(gay.animId);
  const T  = parseFloat(document.getElementById('gay-t').value);
  const P  = gay.pRef * T / gay.tRef;
  drawGay(T, P);
  gay.animId = requestAnimationFrame(animateGay);
}

function drawGay(T, P) {
  const ctx = gay.ctx;
  const W   = gay.canvas.width;
  const H   = gay.canvas.height;
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#081a14');
  bg.addColorStop(1, '#0a1e20');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // fixed rigid container
  const cW = 140, cH = 160;
  const cX = (W - cW) / 2;
  const cY = (H - cH) / 2;
  const thick = 10;

  const heatIntensity = clamp((T - 100) / 500, 0, 1);
  const pressureRatio = P / gay.pRef;

  // glow
  ctx.shadowColor = `rgba(0, 255, 160, ${heatIntensity * 0.5})`;
  ctx.shadowBlur  = 25 * heatIntensity;

  // wall (rigid — thick)
  const wallGrad = ctx.createLinearGradient(cX, 0, cX + cW, 0);
  wallGrad.addColorStop(0, '#1a6050');
  wallGrad.addColorStop(1, '#0d4038');
  ctx.fillStyle = wallGrad;
  ctx.beginPath();
  ctx.roundRect(cX, cY, cW, cH, 8);
  ctx.fill();

  // inner area
  ctx.fillStyle = 'rgba(5, 20, 18, 0.9)';
  ctx.fillRect(cX + thick, cY + thick, cW - thick * 2, cH - thick * 2);
  ctx.shadowBlur = 0;

  // pressure indicator bars on sides
  const barH = clamp(cH * 0.6 * (pressureRatio - 0.3) / 1.7, 0, cH * 0.7);
  ctx.fillStyle = `rgba(${Math.floor(lerp(20, 255, heatIntensity))}, ${Math.floor(lerp(200, 80, heatIntensity))}, 100, 0.5)`;
  ctx.fillRect(cX + 2, cY + cH / 2 - barH / 2, thick - 2, barH);
  ctx.fillRect(cX + cW - thick, cY + cH / 2 - barH / 2, thick - 2, barH);

  // top/bottom pressure bars
  ctx.fillRect(cX + cW / 4, cY + 2, cW / 2, thick - 2);
  ctx.fillRect(cX + cW / 4, cY + cH - thick, cW / 2, thick - 2);

  // flame at bottom
  if (T > 150) drawFlame(ctx, W / 2, cY + cH + 4, heatIntensity * 0.8);

  // particles
  const pxMin = cX + thick + 4;
  const pxMax = cX + cW - thick - 4;
  const pyMin = cY + thick + 4;
  const pyMax = cY + cH - thick - 4;

  const spd = clamp(T / gay.tRef, 0.4, 3.5);
  updateParticles(gay.particles, pxMin, pxMax, pyMin, pyMax, spd);
  gay.particles.forEach(p => {
    p.x = clamp(p.x, pxMin + p.r, pxMax - p.r);
    p.y = clamp(p.y, pyMin + p.r, pyMax - p.r);
    const hot = clamp((T - 100) / 500, 0, 1);
    p.color = `hsl(${lerp(165, 0, hot)}, 90%, 60%)`;
  });
  drawParticles(ctx, gay.particles, true);

  // pressure wave circles when high pressure
  if (pressureRatio > 1.5) {
    const cx2 = (pxMin + pxMax) / 2;
    const cy2 = (pyMin + pyMax) / 2;
    for (let r = 10; r < 50; r += 15) {
      ctx.beginPath();
      ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 150, 50, ${0.15 * (pressureRatio - 1.5)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // labels
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px Segoe UI';
  ctx.fillStyle = '#60f0b0';
  ctx.fillText(`T = ${T} K`, W / 2, cY - 40);
  ctx.font = '11px Segoe UI';
  ctx.fillStyle = '#a0e0c0';
  ctx.fillText(`P = ${P.toFixed(2)} atm`, W / 2, cY - 24);

  ctx.fillStyle = '#4a8a9a';
  ctx.fillText('V = konstan (wadah kaku)', W / 2, cY + cH + (T > 150 ? 44 : 22));

  // pressure gauge on right
  drawPressureGauge(ctx, cX + cW + 46, cY + cH / 2, P, gay.pRef * 600 / gay.tRef);

  // thermometer on left
  drawThermometer(ctx, cX - 42, cY + cH / 2, heatIntensity, `hsl(${lerp(165, 0, heatIntensity)}, 90%, 55%)`);
}

/* ════════════════════════════════════════════
   DECORATIVE: THERMOMETER
════════════════════════════════════════════ */
function drawThermometer(ctx, x, y, level, color) {
  const h = 80, w = 12;
  const bulbR = 10;
  const top = y - h / 2;

  ctx.fillStyle = '#1a3a50';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, top, w, h, w / 2);
  ctx.fill();

  const fillH = h * clamp(level, 0.05, 1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - w / 2 + 2, top + h - fillH, w - 4, fillH, (w - 4) / 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, top + h + bulbR, bulbR, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.fillStyle = '#1a3a50';
  ctx.beginPath();
  ctx.arc(x, top + h + bulbR, bulbR - 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, top + h + bulbR, bulbR - 5, 0, Math.PI * 2);
  ctx.fill();
}

/* ════════════════════════════════════════════
   DECORATIVE: PRESSURE GAUGE
════════════════════════════════════════════ */
function drawPressureGauge(ctx, cx, cy, p, maxP) {
  const r = 28;
  ctx.strokeStyle = '#1a4a3a';
  ctx.lineWidth   = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#081a14';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // tick marks
  for (let i = 0; i <= 8; i++) {
    const angle = -Math.PI * 0.75 + (i / 8) * Math.PI * 1.5;
    const r1 = r - 5, r2 = r - 2;
    ctx.strokeStyle = i === 4 ? '#aaa' : '#2a5a48';
    ctx.lineWidth = i % 4 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    ctx.stroke();
  }

  // needle
  const ratio = clamp(p / maxP, 0, 1);
  const needleAngle = -Math.PI * 0.75 + ratio * Math.PI * 1.5;
  const hot = clamp(p / maxP, 0, 1);
  ctx.strokeStyle = `hsl(${lerp(160, 0, hot)}, 90%, 60%)`;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur  = 8;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(needleAngle) * (r - 8), cy + Math.sin(needleAngle) * (r - 8));
  ctx.stroke();
  ctx.shadowBlur = 0;

  // center dot
  ctx.fillStyle = '#60f0b0';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '8px monospace';
  ctx.fillStyle = '#06d6a0';
  ctx.textAlign = 'center';
  ctx.fillText(p.toFixed(2), cx, cy + r + 12);
  ctx.fillText('atm', cx, cy + r + 22);
}

function updateGay() {
  const T  = parseFloat(document.getElementById('gay-t').value);
  const P  = gay.pRef * T / gay.tRef;
  document.getElementById('gay-t-val').textContent   = T + ' K';
  document.getElementById('gay-t-disp').textContent  = T + ' K';
  document.getElementById('gay-tc').textContent      = (T - 273) + ' °C';
  document.getElementById('gay-p').textContent       = P.toFixed(2) + ' atm';
  document.getElementById('gay-ratio').textContent   = (P / T).toFixed(5);

  const pts = [];
  for (let t = 80; t <= 650; t += 20) pts.push([t, gay.pRef * t / gay.tRef]);
  drawMiniChart('gayChart', pts, 'T (K)', 'P (atm)', '#06d6a0', T, P);
}

/* ════════════════════════════════════════════
   INIT ON LOAD
════════════════════════════════════════════ */
window.addEventListener('load', () => {
  initBoyle();
  updateBoyle();

  // lazy init untuk Charles & Gay ketika tab dibuka
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(() => {
        const id = btn.textContent.trim();
        if (id.includes('Charles') && !charles.canvas) {
          initCharles(); updateCharles();
        }
        if (id.includes('Gay') && !gay.canvas) {
          initGay(); updateGay();
        }
      }, 50);
    });
  });

  // initial chart renders
  updateBoyle();
});

// resize handler
window.addEventListener('resize', () => {
  if (boyle.canvas) {
    boyle.canvas.width = boyle.canvas.parentElement.clientWidth || 560;
  }
  if (charles.canvas) {
    charles.canvas.width = charles.canvas.parentElement.clientWidth || 560;
  }
  if (gay.canvas) {
    gay.canvas.width = gay.canvas.parentElement.clientWidth || 560;
  }
  updateBoyle();
  if (charles.canvas) updateCharles();
  if (gay.canvas) updateGay();
});