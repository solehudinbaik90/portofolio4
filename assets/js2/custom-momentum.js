// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════
const state = {
  m1: 2.0, m2: 3.0,
  v1: 5.0, v2: -3.0,
  e: 1.0,
  x1: 0, x2: 0,     // runtime positions (canvas units)
  cv1: 0, cv2: 0,   // current velocities
  running: false,
  paused: false,
  speed: 1.0,
  collided: false,
  collisionCount: 0,
  t: 0,
  trail1: [], trail2: [],
  // pre/post collision snapshots
  preV1: null, preV2: null,
  postV1: null, postV2: null,
  // chart data
  chartData: { t: [], p1: [], p2: [], ptotal: [], ek1: [], ek2: [], ektotal: [] },
  mode: 'elastic',
  animId: null,
  lastTS: null,
};

// ═══════════════════════════════════════════════════════
//  CANVAS SETUP
// ═══════════════════════════════════════════════════════
const simCanvas = document.getElementById('simCanvas');
const ctx = simCanvas.getContext('2d');
const chartMom = document.getElementById('chart-momentum');
const ctxM = chartMom.getContext('2d');
const chartEK = document.getElementById('chart-energy');
const ctxE = chartEK.getContext('2d');

function resizeCanvases() {
  const wrap = simCanvas.parentElement;
  simCanvas.width  = wrap.clientWidth;
  simCanvas.height = simCanvas.clientHeight;
  chartMom.width  = chartMom.parentElement.clientWidth  - 24;
  chartMom.height = chartMom.parentElement.clientHeight - 30;
  chartEK.width   = chartEK.parentElement.clientWidth  - 24;
  chartEK.height  = chartEK.parentElement.clientHeight - 30;
  render();
}
window.addEventListener('resize', resizeCanvases);
setTimeout(resizeCanvases, 50);

// ═══════════════════════════════════════════════════════
//  PHYSICS HELPERS
// ═══════════════════════════════════════════════════════
function ballRadius(m) { return Math.max(20, Math.min(48, 16 + m * 3.5)); }

function computePostCollision(m1, m2, v1, v2, e) {
  const v1f = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
  const v2f = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);
  return { v1f, v2f };
}

function momentum(m, v) { return m * v; }
function kineticEnergy(m, v) { return 0.5 * m * v * v; }

// ═══════════════════════════════════════════════════════
//  UI ↔ STATE SYNC
// ═══════════════════════════════════════════════════════
function updateSlider(id) {
  const val = parseFloat(document.getElementById(id).value);
  if (id === 'm1') {
    state.m1 = val;
    document.getElementById('m1-val').textContent = val.toFixed(1) + ' kg';
  } else if (id === 'v1') {
    state.v1 = val;
    document.getElementById('v1-val').textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' m/s ' + (val >= 0 ? '→' : '←');
  } else if (id === 'm2') {
    state.m2 = val;
    document.getElementById('m2-val').textContent = val.toFixed(1) + ' kg';
  } else if (id === 'v2') {
    state.v2 = val;
    document.getElementById('v2-val').textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + ' m/s ' + (val >= 0 ? '→' : '←');
  }
  updateMomentumBadges();
  if (!state.running) {
    initPositions();
    render();
  }
}

function updateElasticity() {
  const e = parseFloat(document.getElementById('e-coeff').value);
  state.e = e;
  document.getElementById('e-val').textContent = e.toFixed(2);
  // Auto-set mode tabs
  if (e >= 1.0) setModeTab('elastic');
  else if (e <= 0.0) setModeTab('inelastic');
  else setModeTab('partial');
}

function setMode(mode) {
  state.mode = mode;
  let e = mode === 'elastic' ? 1.0 : mode === 'inelastic' ? 0.0 : 0.5;
  state.e = e;
  document.getElementById('e-coeff').value = e;
  document.getElementById('e-val').textContent = e.toFixed(2);
  setModeTab(mode);
  if (!state.running) render();
}
function setModeTab(mode) {
  document.querySelectorAll('.mode-tab').forEach((b, i) => {
    b.classList.toggle('active', ['elastic','partial','inelastic'][i] === mode);
  });
}

function updateMomentumBadges() {
  const p1 = state.m1 * (state.running ? state.cv1 : state.v1);
  const p2 = state.m2 * (state.running ? state.cv2 : state.v2);
  document.getElementById('p1-badge').textContent = 'p = ' + p1.toFixed(1) + ' kg·m/s';
  document.getElementById('p2-badge').textContent = 'p = ' + p2.toFixed(1) + ' kg·m/s';
}

function setSpeed(s) {
  state.speed = s;
  document.querySelectorAll('.speed-btn').forEach(b => {
    b.classList.toggle('active', parseFloat(b.textContent) === s || b.textContent === s + '×');
  });
  // simpler: match by index
  const speeds = [.25, .5, 1, 2, 4];
  document.querySelectorAll('.speed-btn').forEach((b, i) => {
    b.classList.toggle('active', speeds[i] === s);
  });
}

// ═══════════════════════════════════════════════════════
//  SIMULATION CONTROL
// ═══════════════════════════════════════════════════════
function initPositions() {
  const W = simCanvas.width;
  const H = simCanvas.height;
  const r1 = ballRadius(state.m1);
  const r2 = ballRadius(state.m2);
  const cx = W / 2;
  state.x1 = cx - r1 - 60;
  state.x2 = cx + r2 + 60;
  state.cv1 = state.v1;
  state.cv2 = state.v2;
  state.trail1 = [];
  state.trail2 = [];
}

function startSim() {
  if (state.paused) {
    state.paused = false;
    state.lastTS = null;
    document.getElementById('btn-play').disabled  = true;
    document.getElementById('btn-pause').disabled = false;
    loop();
    return;
  }
  // Fresh start
  initPositions();
  state.t = 0;
  state.collided = false;
  state.collisionCount = 0;
  state.running = true;
  state.paused = false;
  state.preV1 = state.v1;
  state.preV2 = state.v2;
  state.postV1 = null;
  state.postV2 = null;
  state.chartData = { t: [], p1: [], p2: [], ptotal: [], ek1: [], ek2: [], ektotal: [] };

  document.getElementById('btn-play').disabled  = true;
  document.getElementById('btn-pause').disabled = false;
  document.getElementById('collision-count').textContent = '0';

  // Set initial data display
  document.getElementById('d-v1i').textContent = state.v1.toFixed(2) + ' m/s';
  document.getElementById('d-v2i').textContent = state.v2.toFixed(2) + ' m/s';
  const pi = momentum(state.m1, state.v1) + momentum(state.m2, state.v2);
  document.getElementById('d-pi').textContent = pi.toFixed(3) + ' kg·m/s';
  const eki = kineticEnergy(state.m1, state.v1) + kineticEnergy(state.m2, state.v2);
  document.getElementById('d-eki').textContent = eki.toFixed(3) + ' J';

  state.lastTS = null;
  if (state.animId) cancelAnimationFrame(state.animId);
  loop();
}

function pauseSim() {
  state.paused = true;
  cancelAnimationFrame(state.animId);
  document.getElementById('btn-play').disabled  = false;
  document.getElementById('btn-pause').disabled = true;
}

function resetSim() {
  state.running = false;
  state.paused = false;
  cancelAnimationFrame(state.animId);
  state.t = 0;
  state.collisionCount = 0;
  state.chartData = { t: [], p1: [], p2: [], ptotal: [], ek1: [], ek2: [], ektotal: [] };
  state.preV1 = null; state.postV1 = null;
  state.preV2 = null; state.postV2 = null;
  initPositions();
  document.getElementById('btn-play').disabled  = false;
  document.getElementById('btn-pause').disabled = true;
  document.getElementById('collision-count').textContent = '0';
  // Reset data panel
  ['d-v1f','d-v2f','d-pf','d-ekf','d-dek'].forEach(id => {
    document.getElementById(id).textContent = '— ';
  });
  document.getElementById('info-tip').innerHTML = '<strong>💡 Tips:</strong> Atur massa dan kecepatan kedua bola, lalu tekan <strong>Mulai</strong>.';
  document.getElementById('imp-val-1').textContent = '0.0 N·s';
  document.getElementById('imp-val-2').textContent = '0.0 N·s';
  document.getElementById('imp-fill-1').style.width = '0%';
  document.getElementById('imp-fill-2').style.width = '0%';
  updateMomentumBadges();
  render();
  drawChart();
}

// ═══════════════════════════════════════════════════════
//  ANIMATION LOOP
// ═══════════════════════════════════════════════════════
const SCALE = 40; // pixels per m/s unit → scaled to canvas
const DT_BASE = 1 / 60;

function loop(ts) {
  if (!state.running || state.paused) return;
  if (!state.lastTS) state.lastTS = ts || performance.now();
  const elapsed = ((ts || performance.now()) - state.lastTS) / 1000;
  state.lastTS = ts || performance.now();
  const dt = Math.min(elapsed, 0.05) * state.speed;
  state.t += dt;

  const W = simCanvas.width;
  const H = simCanvas.height;
  const r1 = ballRadius(state.m1);
  const r2 = ballRadius(state.m2);

  // Wall bounce
  if (state.x1 - r1 <= 0)   { state.x1 = r1;     state.cv1 = Math.abs(state.cv1); }
  if (state.x1 + r1 >= W)   { state.x1 = W - r1; state.cv1 = -Math.abs(state.cv1); }
  if (state.x2 - r2 <= 0)   { state.x2 = r2;     state.cv2 = Math.abs(state.cv2); }
  if (state.x2 + r2 >= W)   { state.x2 = W - r2; state.cv2 = -Math.abs(state.cv2); }

  // Ball-ball collision detection
  const dist = Math.abs(state.x1 - state.x2);
  const minDist = r1 + r2;

  if (dist <= minDist && !state.collided) {
    state.collided = true;
    state.collisionCount++;
    document.getElementById('collision-count').textContent = state.collisionCount;

    const { v1f, v2f } = computePostCollision(state.m1, state.m2, state.cv1, state.cv2, state.e);
    state.cv1 = v1f;
    state.cv2 = v2f;

    // Separate balls
    const overlap = minDist - dist;
    if (state.x1 < state.x2) {
      state.x1 -= overlap / 2;
      state.x2 += overlap / 2;
    } else {
      state.x1 += overlap / 2;
      state.x2 -= overlap / 2;
    }

    // Flash
    const flash = document.getElementById('flash');
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 150);

    // Save post-collision data (first collision)
    if (state.collisionCount === 1) {
      state.postV1 = v1f;
      state.postV2 = v2f;
      updatePostCollisionData();
    }
    updateImpulse();
  } else if (dist > minDist + 2) {
    state.collided = false;
  }

  // Move
  const pixPerSec = SCALE;
  state.x1 += state.cv1 * pixPerSec * dt;
  state.x2 += state.cv2 * pixPerSec * dt;

  // Trails
  if (document.getElementById('show-trail').checked) {
    const y = H / 2;
    state.trail1.push({ x: state.x1, y });
    state.trail2.push({ x: state.x2, y });
    if (state.trail1.length > 120) state.trail1.shift();
    if (state.trail2.length > 120) state.trail2.shift();
  }

  // Chart data (throttled)
  if (state.chartData.t.length === 0 || state.t - state.chartData.t[state.chartData.t.length - 1] > 0.05) {
    pushChartData();
  }

  updateMomentumBadges();
  updateCanvasInfo();

  render();
  drawChart();

  // Stop if both balls stuck at walls or very slow
  state.animId = requestAnimationFrame(loop);
}

function pushChartData() {
  const cd = state.chartData;
  cd.t.push(state.t);
  const p1 = momentum(state.m1, state.cv1);
  const p2 = momentum(state.m2, state.cv2);
  cd.p1.push(p1); cd.p2.push(p2); cd.ptotal.push(p1 + p2);
  const ek1 = kineticEnergy(state.m1, state.cv1);
  const ek2 = kineticEnergy(state.m2, state.cv2);
  cd.ek1.push(ek1); cd.ek2.push(ek2); cd.ektotal.push(ek1 + ek2);
  // Cap length
  const MAX = 300;
  if (cd.t.length > MAX) {
    Object.keys(cd).forEach(k => cd[k].shift());
  }
}

// ═══════════════════════════════════════════════════════
//  UPDATE DISPLAYS
// ═══════════════════════════════════════════════════════
function updatePostCollisionData() {
  const { m1, m2, preV1, preV2, postV1, postV2 } = state;
  document.getElementById('d-v1f').textContent = postV1.toFixed(3) + ' m/s';
  document.getElementById('d-v2f').textContent = postV2.toFixed(3) + ' m/s';
  const pf = momentum(m1, postV1) + momentum(m2, postV2);
  document.getElementById('d-pf').textContent = pf.toFixed(3) + ' kg·m/s';
  const ekf = kineticEnergy(m1, postV1) + kineticEnergy(m2, postV2);
  document.getElementById('d-ekf').textContent = ekf.toFixed(3) + ' J';
  const eki = kineticEnergy(m1, preV1) + kineticEnergy(m2, preV2);
  const dek = ekf - eki;
  document.getElementById('d-dek').textContent = dek.toFixed(3) + ' J';
  document.getElementById('d-dek').style.color = dek < -0.01 ? '#ff9800' : '#3fb950';

  const pi = momentum(m1, preV1) + momentum(m2, preV2);
  const consP = Math.abs(pi) < 0.001 ? 100 : Math.min(100, (1 - Math.abs(pf - pi) / Math.abs(pi)) * 100);
  const consE = Math.abs(eki) < 0.001 ? 100 : Math.min(100, (ekf / eki) * 100);
  document.getElementById('bar-momentum').style.width = consP.toFixed(0) + '%';
  document.getElementById('bar-energy').style.width   = Math.max(0, consE).toFixed(0) + '%';
  document.getElementById('cons-p-val').textContent = consP.toFixed(0) + '%';
  document.getElementById('cons-e-val').textContent = Math.max(0, consE).toFixed(0) + '%';

  document.getElementById('info-tip').innerHTML =
    '<strong>💥 Tumbukan ke-' + state.collisionCount + ':</strong> ' +
    'v₁: ' + preV1.toFixed(1) + ' → ' + postV1.toFixed(2) + ' m/s | ' +
    'v₂: ' + preV2.toFixed(1) + ' → ' + postV2.toFixed(2) + ' m/s | ' +
    'ΔEK = ' + dek.toFixed(2) + ' J';
}

function updateImpulse() {
  if (state.preV1 === null) return;
  const J1 = state.m1 * (state.cv1 - state.preV1);
  const J2 = state.m2 * (state.cv2 - state.preV2);
  const maxJ = Math.max(Math.abs(J1), Math.abs(J2), 1);
  document.getElementById('imp-val-1').textContent = J1.toFixed(2) + ' N·s';
  document.getElementById('imp-val-2').textContent = J2.toFixed(2) + ' N·s';
  const pct1 = Math.min(100, (Math.abs(J1) / maxJ) * 100);
  const pct2 = Math.min(100, (Math.abs(J2) / maxJ) * 100);
  document.getElementById('imp-fill-1').style.width = pct1.toFixed(0) + '%';
  document.getElementById('imp-fill-2').style.width = pct2.toFixed(0) + '%';
  const fill1 = document.getElementById('imp-fill-1');
  const fill2 = document.getElementById('imp-fill-2');
  if (J1 < 0) { fill1.style.left = 'auto'; fill1.style.right = '50%'; }
  else        { fill1.style.left = '50%';  fill1.style.right = 'auto'; }
  if (J2 < 0) { fill2.style.left = 'auto'; fill2.style.right = '50%'; }
  else        { fill2.style.left = '50%';  fill2.style.right = 'auto'; }
}

function updateCanvasInfo() {
  const p = (momentum(state.m1, state.cv1) + momentum(state.m2, state.cv2)).toFixed(2);
  const ek= (kineticEnergy(state.m1, state.cv1) + kineticEnergy(state.m2, state.cv2)).toFixed(2);
  document.getElementById('canvas-info').textContent =
    't = ' + state.t.toFixed(2) + ' s  |  p = ' + p + ' kg·m/s  |  EK = ' + ek + ' J';
}

// ═══════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════
function render() {
  const W = simCanvas.width;
  const H = simCanvas.height;
  const midY = H / 2;
  ctx.clearRect(0, 0, W, H);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0f1e');
  bg.addColorStop(1, '#050810');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Floor / track
  const trackY = midY + Math.max(ballRadius(state.m1), ballRadius(state.m2)) + 18;
  ctx.fillStyle = 'rgba(88,166,255,.06)';
  ctx.fillRect(0, trackY, W, H - trackY);
  ctx.strokeStyle = 'rgba(88,166,255,.25)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, trackY); ctx.lineTo(W, trackY); ctx.stroke();
  // Tick marks
  ctx.strokeStyle = 'rgba(88,166,255,.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, trackY); ctx.lineTo(x, trackY + 6); ctx.stroke();
  }

  // Walls
  const wallGrad = (x) => {
    const g = ctx.createLinearGradient(x, 0, x + 10, 0);
    g.addColorStop(0, 'rgba(88,166,255,.3)');
    g.addColorStop(1, 'rgba(88,166,255,0)');
    return g;
  };
  ctx.fillStyle = wallGrad(0);
  ctx.fillRect(0, 0, 10, H);
  const rightWallGrad = ctx.createLinearGradient(W - 10, 0, W, 0);
  rightWallGrad.addColorStop(0, 'rgba(88,166,255,0)');
  rightWallGrad.addColorStop(1, 'rgba(88,166,255,.3)');
  ctx.fillStyle = rightWallGrad;
  ctx.fillRect(W - 10, 0, 10, H);

  const r1 = ballRadius(state.m1);
  const r2 = ballRadius(state.m2);
  const x1 = state.x1, x2 = state.x2;
  const y1 = midY, y2 = midY;

  // ── Trails
  if (document.getElementById('show-trail').checked) {
    drawTrail(state.trail1, 'rgba(255,107,107,.5)');
    drawTrail(state.trail2, 'rgba(78,205,196,.5)');
  }

  // ── Momentum vectors
  if (document.getElementById('show-momentum').checked) {
    const scale = 5;
    const p1 = state.m1 * (state.running ? state.cv1 : state.v1);
    const p2 = state.m2 * (state.running ? state.cv2 : state.v2);
    drawArrow(ctx, x1, y1 + r1 + 28, x1 + p1 * scale, y1 + r1 + 28,
      'rgba(255,107,107,.85)', 2.5, 'p₁=' + p1.toFixed(1));
    drawArrow(ctx, x2, y2 + r2 + 28, x2 + p2 * scale, y2 + r2 + 28,
      'rgba(78,205,196,.85)', 2.5, 'p₂=' + p2.toFixed(1));
  }

  // ── Velocity vectors
  if (document.getElementById('show-vectors').checked) {
    const scale = 18;
    const cv1 = state.running ? state.cv1 : state.v1;
    const cv2 = state.running ? state.cv2 : state.v2;
    drawArrow(ctx, x1, y1 - r1 - 14, x1 + cv1 * scale, y1 - r1 - 14,
      'rgba(255,213,61,.9)', 2, 'v₁=' + cv1.toFixed(1) + 'm/s');
    drawArrow(ctx, x2, y2 - r2 - 14, x2 + cv2 * scale, y2 - r2 - 14,
      'rgba(210,168,255,.9)', 2, 'v₂=' + cv2.toFixed(1) + 'm/s');
  }

  // ── Ball 1
  drawBall(x1, y1, r1, '#ff6b6b', '#ff4444', state.m1, '1');
  // ── Ball 2
  drawBall(x2, y2, r2, '#4ecdc4', '#00bcd4', state.m2, '2');

  // ── Center of mass indicator
  const mx = state.running
    ? (state.m1 * state.x1 + state.m2 * state.x2) / (state.m1 + state.m2)
    : W / 2;
  ctx.strokeStyle = 'rgba(255,255,255,.3)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CM', mx, 12);
}

function drawBall(x, y, r, color1, color2, mass, label) {
  // Shadow
  ctx.save();
  ctx.shadowColor = color1;
  ctx.shadowBlur = 20;
  // Gradient fill
  const grad = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2 + 'cc');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowBlur = 0;
  // Border
  ctx.strokeStyle = 'rgba(255,255,255,.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  // Specular highlight
  ctx.beginPath();
  ctx.arc(x - r * .28, y - r * .28, r * .25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.25)';
  ctx.fill();
  // Label
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.max(11, r * .55)}px Segoe UI`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mass.toFixed(mass % 1 ? 1 : 0) + 'kg', x, y);
}

function drawTrail(pts, color) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = .4;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawArrow(c, x1, y1, x2, y2, color, lw, label) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 3) {
    // Draw a dot for zero vector
    c.beginPath();
    c.arc(x1, y1, 3, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
    return;
  }
  const angle = Math.atan2(dy, dx);
  const headLen = Math.min(12, len * .4);

  c.save();
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = lw;

  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();

  // Arrowhead
  c.beginPath();
  c.moveTo(x2, y2);
  c.lineTo(x2 - headLen * Math.cos(angle - .4), y2 - headLen * Math.sin(angle - .4));
  c.lineTo(x2 - headLen * Math.cos(angle + .4), y2 - headLen * Math.sin(angle + .4));
  c.closePath();
  c.fill();

  // Label
  if (label) {
    c.font = '10px monospace';
    c.textAlign = dx >= 0 ? 'left' : 'right';
    c.textBaseline = 'bottom';
    c.fillText(label, x2 + (dx >= 0 ? 4 : -4), y2 - 3);
  }
  c.restore();
}

// ═══════════════════════════════════════════════════════
//  CHARTS
// ═══════════════════════════════════════════════════════
function drawChart() {
  drawMomentumChart();
  drawEnergyChart();
}

function drawMomentumChart() {
  const c = ctxM;
  const W = chartMom.width, H = chartMom.height;
  if (!W || !H) return;
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#0a0f1e';
  c.fillRect(0, 0, W, H);

  const cd = state.chartData;
  if (cd.t.length < 2) {
    c.fillStyle = 'rgba(255,255,255,.2)';
    c.font = '11px Segoe UI';
    c.textAlign = 'center';
    c.fillText('Mulai simulasi...', W / 2, H / 2);
    return;
  }

  const pad = { t: 10, b: 20, l: 44, r: 10 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  const maxT = cd.t[cd.t.length - 1];
  const allP = [...cd.p1, ...cd.p2, ...cd.ptotal];
  const minP = Math.min(...allP) * 1.2;
  const maxP = Math.max(...allP) * 1.2 || 1;

  const tx = t => pad.l + (t / (maxT || 1)) * cW;
  const ty = p => pad.t + cH - ((p - minP) / (maxP - minP || 1)) * cH;

  // Grid
  c.strokeStyle = 'rgba(255,255,255,.05)';
  c.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (cH / 4) * i;
    c.beginPath(); c.moveTo(pad.l, y); c.lineTo(W - pad.r, y); c.stroke();
    const val = maxP - (maxP - minP) * i / 4;
    c.fillStyle = 'rgba(255,255,255,.3)';
    c.font = '9px monospace';
    c.textAlign = 'right';
    c.fillText(val.toFixed(1), pad.l - 4, y + 3);
  }

  // Lines
  const series = [
    { data: cd.p1,     color: 'rgba(255,107,107,.9)',  label: 'p₁' },
    { data: cd.p2,     color: 'rgba(78,205,196,.9)',   label: 'p₂' },
    { data: cd.ptotal, color: 'rgba(255,255,255,.6)',  label: 'pT', dash: [4,3] },
  ];
  series.forEach(s => {
    c.beginPath();
    if (s.dash) c.setLineDash(s.dash); else c.setLineDash([]);
    c.strokeStyle = s.color;
    c.lineWidth = s.dash ? 1.5 : 2;
    s.data.forEach((v, i) => {
      const x = tx(cd.t[i]), y = ty(v);
      i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    });
    c.stroke();
    c.setLineDash([]);
    // Legend dot
    const li = series.indexOf(s);
    c.fillStyle = s.color;
    c.fillRect(W - pad.r - 60 + li * 20, pad.t + 2, 8, 8);
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.font = '9px monospace';
    c.textAlign = 'left';
    c.fillText(s.label, W - pad.r - 50 + li * 20, pad.t + 10);
  });

  // Axis label
  c.fillStyle = 'rgba(255,255,255,.3)';
  c.save();
  c.translate(10, H / 2);
  c.rotate(-Math.PI / 2);
  c.font = '9px monospace';
  c.textAlign = 'center';
  c.fillText('p (kg·m/s)', 0, 0);
  c.restore();
  c.fillText('t (s)', W / 2, H - 2);
}

function drawEnergyChart() {
  const c = ctxE;
  const W = chartEK.width, H = chartEK.height;
  if (!W || !H) return;
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#0a0f1e';
  c.fillRect(0, 0, W, H);

  const cd = state.chartData;
  if (cd.t.length < 2) {
    c.fillStyle = 'rgba(255,255,255,.2)';
    c.font = '11px Segoe UI';
    c.textAlign = 'center';
    c.fillText('Mulai simulasi...', W / 2, H / 2);
    return;
  }

  const pad = { t: 10, b: 20, l: 44, r: 10 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  const maxT = cd.t[cd.t.length - 1];
  const allE = [...cd.ek1, ...cd.ek2, ...cd.ektotal];
  const maxE = Math.max(...allE) * 1.2 || 1;

  const tx = t => pad.l + (t / (maxT || 1)) * cW;
  const ty = e => pad.t + cH - (e / maxE) * cH;

  c.strokeStyle = 'rgba(255,255,255,.05)';
  c.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (cH / 4) * i;
    c.beginPath(); c.moveTo(pad.l, y); c.lineTo(W - pad.r, y); c.stroke();
    const val = maxE * (1 - i / 4);
    c.fillStyle = 'rgba(255,255,255,.3)';
    c.font = '9px monospace';
    c.textAlign = 'right';
    c.fillText(val.toFixed(1), pad.l - 4, y + 3);
  }

  const series = [
    { data: cd.ek1,     color: 'rgba(255,107,107,.9)',  label: 'EK₁' },
    { data: cd.ek2,     color: 'rgba(78,205,196,.9)',   label: 'EK₂' },
    { data: cd.ektotal, color: 'rgba(255,211,61,.8)',   label: 'EKT', dash: [4,3] },
  ];
  series.forEach(s => {
    c.beginPath();
    if (s.dash) c.setLineDash(s.dash); else c.setLineDash([]);
    c.strokeStyle = s.color;
    c.lineWidth = s.dash ? 1.5 : 2;
    s.data.forEach((v, i) => {
      const x = tx(cd.t[i]), y = ty(v);
      i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    });
    c.stroke();
    c.setLineDash([]);
    const li = series.indexOf(s);
    c.fillStyle = s.color;
    c.fillRect(W - pad.r - 80 + li * 26, pad.t + 2, 8, 8);
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.font = '9px monospace';
    c.textAlign = 'left';
    c.fillText(s.label, W - pad.r - 70 + li * 26, pad.t + 10);
  });

  c.fillStyle = 'rgba(255,255,255,.3)';
  c.save();
  c.translate(10, H / 2);
  c.rotate(-Math.PI / 2);
  c.font = '9px monospace';
  c.textAlign = 'center';
  c.fillText('EK (J)', 0, 0);
  c.restore();
  c.fillText('t (s)', W / 2, H - 2);
}

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
updateMomentumBadges();
initPositions();
render();
drawChart();