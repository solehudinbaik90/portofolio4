// =============================================
// GLOBAL STATE
// =============================================
const G = 10;
let scene = 'freefall';
let running = false;
let t = 0;
let dt = 1/60;

// Object state per scene
let state = {};

// Sliders
const slMass     = document.getElementById('sl-mass');
const slHeight   = document.getElementById('sl-height');
const slFriction = document.getElementById('sl-friction');
const slAngle    = document.getElementById('sl-angle');
const slK        = document.getElementById('sl-k');

// Canvas
const canvas = document.getElementById('mainCanvas');
const ctx    = canvas.getContext('2d');

let W, H;
function resizeCanvas() {
  const wrap = canvas.parentElement;
  W = wrap.clientWidth;
  H = 460;
  canvas.width  = W;
  canvas.height = H;
}

// Energy trail
let energyTrail = []; // [{ep,ek,em,x}]

// =============================================
// SCENE SETUP
// =============================================
function setScene(s) {
  scene = s;
  running = false;
  document.getElementById('btnPlay').textContent = '▶ Mulai';
  document.querySelectorAll('.scene-btn').forEach((b, i) => {
    b.classList.toggle('active', ['freefall','pendulum','ramp','spring','projectile'][i] === s);
  });

  // Show/hide controls
  document.getElementById('grp-angle').style.display   = (s === 'pendulum') ? '' : 'none';
  document.getElementById('grp-spring-k').style.display = (s === 'spring') ? '' : 'none';
  document.getElementById('grp-friction').style.display = (s === 'spring' || s === 'projectile') ? 'none' : '';
  document.getElementById('col-q').style.display       = 'none';

  const titles = {
    freefall:  '🪂 Skenario: Jatuh Bebas — Amati konversi Ep → Ek',
    pendulum:  '🔮 Skenario: Bandul — Osilasi Ep ↔ Ek tanpa gesekan',
    ramp:      '⛷️ Skenario: Lintasan Miring — Benda meluncur di lereng',
    spring:    '🌀 Skenario: Pegas — Energi potensial elastis ↔ kinetik',
    projectile:'🎯 Skenario: Gerak Parabola — Ep + Ek + gerak horizontal'
  };
  document.getElementById('sceneTitle').textContent = titles[s];

  const formulas = {
    freefall:  `<span class="formula-pill"><span class="hl-em">E<sub>m</sub></span> = <span class="hl-ep">E<sub>p</sub></span> + <span class="hl-ek">E<sub>k</sub></span></span><span class="formula-pill"><span class="hl-ep">mgh</span> = <span class="hl-ek">½mv²</span></span><span class="formula-pill">v = √(2gh)</span>`,
    pendulum:  `<span class="formula-pill"><span class="hl-ep">E<sub>p</sub></span> = mgl(1−cosθ)</span><span class="formula-pill"><span class="hl-ek">E<sub>k</sub></span> = ½mv²</span><span class="formula-pill"><span class="hl-em">E<sub>m</sub></span> = konstan</span>`,
    ramp:      `<span class="formula-pill"><span class="hl-ep">mgh</span> → <span class="hl-ek">½mv²</span> + <span class="hl-q">Q (gesekan)</span></span><span class="formula-pill">v = √(2gh − 2μgh)</span>`,
    spring:    `<span class="formula-pill"><span class="hl-ep">E<sub>p</sub></span> = ½kx²</span><span class="formula-pill"><span class="hl-ek">E<sub>k</sub></span> = ½mv²</span><span class="formula-pill"><span class="hl-em">E<sub>m</sub></span> = ½kA²</span>`,
    projectile:`<span class="formula-pill"><span class="hl-ep">mgy</span> + <span class="hl-ek">½mv²</span> = konstan</span><span class="formula-pill">v = √(vx²+vy²)</span>`
  };
  document.getElementById('formulaBar').innerHTML = formulas[s];

  const infos = {
    freefall:  '💡 <strong>Jatuh Bebas:</strong> Saat benda jatuh, energi potensial (<strong>mgh</strong>) berubah menjadi energi kinetik (<strong>½mv²</strong>). Total energi mekanik tetap konstan!',
    pendulum:  '💡 <strong>Bandul:</strong> Di titik tertinggi → semua energi potensial. Di titik terbawah → semua kinetik. Total selalu sama (tanpa gesekan).',
    ramp:      '💡 <strong>Lintasan Miring:</strong> Gesekan mengubah sebagian energi mekanik menjadi kalor (<strong>Q</strong>). Semakin besar gesekan, semakin kecil kecepatan akhir.',
    spring:    '💡 <strong>Pegas:</strong> Benda bergetar. Di simpangan maksimum → semua Ep. Di titik seimbang → semua Ek. Total Em = ½kA² tetap konstan.',
    projectile:'💡 <strong>Gerak Parabola:</strong> Selama terbang, total Ep + Ek konstan (abaikan udara). Saat naik Ep ↑ Ek ↓, saat turun Ep ↓ Ek ↑.'
  };
  document.getElementById('infoBox').innerHTML = infos[s];

  energyTrail = [];
  initState();
  updateUI();
  drawFrame();
}

// =============================================
// STATE INIT
// =============================================
function initState() {
  t = 0;
  const m  = +slMass.value;
  const h0 = +slHeight.value;
  const fr = +slFriction.value / 100;

  if (scene === 'freefall') {
    state = { m, h: h0, v: 0, h0, lost: 0, fr, done: false };
  }
  else if (scene === 'pendulum') {
    const L = 5, theta0 = +slAngle.value * Math.PI/180;
    state = { m, L, theta: theta0, omega: 0, theta0, fr, lost: 0 };
  }
  else if (scene === 'ramp') {
    const angle = 30 * Math.PI/180;
    state = { m, h: h0, v: 0, h0, angle, fr, lost: 0, done: false };
  }
  else if (scene === 'spring') {
    const k  = +slK.value;
    const A  = 2.5; // amplitude in meters
    state = { m, k, A, x: A, vx: 0, lost: 0 };
  }
  else if (scene === 'projectile') {
    const v0 = 15, angleD = 45, fr = 0;
    const theta = angleD * Math.PI/180;
    state = { m, h: h0, vx: v0*Math.cos(theta), vy: v0*Math.sin(theta), x: 0, h0, done: false, fr: 0 };
  }
}

// =============================================
// PHYSICS STEP
// =============================================
function physicsStep(nSteps) {
  for (let i = 0; i < nSteps; i++) {
    if (scene === 'freefall') stepFreefall();
    else if (scene === 'pendulum') stepPendulum();
    else if (scene === 'ramp') stepRamp();
    else if (scene === 'spring') stepSpring();
    else if (scene === 'projectile') stepProjectile();
    t += dt;
  }
}

function stepFreefall() {
  if (state.done) return;
  const fr = state.fr;
  const drag = fr * state.m * G;
  const a = G - drag/state.m;
  state.v += a * dt;
  state.h -= state.v * dt;
  state.lost += drag * state.v * dt;
  if (state.h <= 0) { state.h = 0; state.v = 0; state.done = true; }
}

function stepPendulum() {
  const { L, fr } = state;
  const damp = fr * 2;
  const alpha = -(G / L) * Math.sin(state.theta) - damp * state.omega;
  state.omega += alpha * dt;
  state.theta  += state.omega * dt;
  const h0 = L * (1 - Math.cos(state.theta0));
  state.lost = state.m * G * h0 - getEm(state);
  if (state.lost < 0) state.lost = 0;
}

function stepRamp() {
  if (state.done) return;
  const { angle, fr, m } = state;
  const g_eff = G * (Math.sin(angle) - fr * Math.cos(angle));
  const a     = Math.max(0, g_eff);
  state.v += a * dt;
  state.h  = Math.max(0, state.h - state.v * Math.sin(angle) * dt);
  const friction_force = fr * m * G * Math.cos(angle);
  state.lost += friction_force * state.v * dt;
  if (state.h <= 0) { state.h = 0; state.v = 0; state.done = true; }
}

function stepSpring() {
  const { k, m } = state;
  const a = -(k/m) * state.x;
  state.vx += a * dt;
  state.x  += state.vx * dt;
}

function stepProjectile() {
  if (state.done) return;
  state.vy -= G * dt;
  state.h  += state.vy * dt;
  state.x  += state.vx * dt;
  if (state.h <= 0) { state.h = 0; state.vy = 0; state.vx = 0; state.done = true; }
}

// =============================================
// ENERGY GETTERS
// =============================================
function getEnergies() {
  const m = state.m;
  let ep = 0, ek = 0, em = 0, q = 0;

  if (scene === 'freefall') {
    ep = m * G * Math.max(0, state.h);
    const v2 = state.v * state.v;
    ek = 0.5 * m * v2;
    q  = state.lost;
    em = ep + ek;
  }
  else if (scene === 'pendulum') {
    const h = state.L * (1 - Math.cos(state.theta));
    ep = m * G * h;
    ek = 0.5 * m * state.L * state.L * state.omega * state.omega;
    em = ep + ek;
    q  = state.lost;
  }
  else if (scene === 'ramp') {
    ep = m * G * Math.max(0, state.h);
    ek = 0.5 * m * state.v * state.v;
    em = ep + ek;
    q  = state.lost;
  }
  else if (scene === 'spring') {
    ep = 0.5 * state.k * state.x * state.x;
    ek = 0.5 * m * state.vx * state.vx;
    em = ep + ek;
    q  = 0;
  }
  else if (scene === 'projectile') {
    const v2 = state.vx*state.vx + state.vy*state.vy;
    ep = m * G * Math.max(0, state.h);
    ek = 0.5 * m * v2;
    em = ep + ek;
    q  = 0;
  }

  return { ep, ek, em, q };
}

function getEm(s) {
  if (scene !== 'pendulum') return 0;
  const h = s.L * (1 - Math.cos(s.theta));
  return s.m * G * h + 0.5 * s.m * s.L * s.L * s.omega * s.omega;
}

// =============================================
// UI UPDATE
// =============================================
function updateUI() {
  const { ep, ek, em, q } = getEnergies();
  const maxE = Math.max(em + q, 1);

  // Bar heights
  document.getElementById('bar-ep').style.height = Math.min(100, ep/maxE*100) + '%';
  document.getElementById('bar-ek').style.height = Math.min(100, ek/maxE*100) + '%';
  document.getElementById('bar-em').style.height = Math.min(100, em/maxE*100) + '%';
  document.getElementById('bar-q' ).style.height = Math.min(100, q /maxE*100) + '%';

  const fmt = v => v < 0.001 ? '0.00' : v < 100 ? v.toFixed(2) : v.toFixed(1);
  document.getElementById('ep-val').textContent = fmt(ep) + ' J';
  document.getElementById('ek-val').textContent = fmt(ek) + ' J';
  document.getElementById('em-val').textContent = fmt(em) + ' J';
  document.getElementById('q-val' ).textContent = fmt(q)  + ' J';

  // Show heat column if gesekan active
  const hasFr = q > 0.01;
  document.getElementById('col-q').style.display = (hasFr || scene === 'ramp') ? '' : 'none';

  // Conservation badge
  const badge = document.getElementById('consBadge');
  const E0 = state.m * G * (state.h0 || state.L*(1-Math.cos(state.theta0||0)) || state.A*state.A*state.k/(2*state.m) || 10);
  if (q > 0.05) {
    badge.className = 'conservation-badge badge-lost';
    badge.textContent = '🔥 Energi dialihkan ke kalor (gesekan aktif)';
  } else if (running || t > 0) {
    badge.className = 'conservation-badge badge-ok';
    badge.textContent = '✅ Energi mekanik kekal: Em = ' + fmt(em) + ' J';
  } else {
    badge.className = 'conservation-badge badge-neutral';
    badge.textContent = '⚙️ Atur parameter & jalankan simulasi';
  }

  // Readouts
  let h_disp = 0, v_disp = 0;
  if (scene === 'freefall') { h_disp = state.h; v_disp = state.v; }
  else if (scene === 'pendulum') {
    h_disp = state.L * (1 - Math.cos(state.theta));
    v_disp = Math.abs(state.L * state.omega);
  }
  else if (scene === 'ramp')   { h_disp = state.h; v_disp = state.v; }
  else if (scene === 'spring') { h_disp = Math.abs(state.x); v_disp = Math.abs(state.vx); }
  else if (scene === 'projectile') { h_disp = state.h; v_disp = Math.sqrt(state.vx**2 + state.vy**2); }

  document.getElementById('rd-h').textContent = h_disp.toFixed(2) + ' m';
  document.getElementById('rd-v').textContent = v_disp.toFixed(2) + ' m/s';
  document.getElementById('rd-m').textContent = state.m.toFixed(1) + ' kg';
  document.getElementById('rd-t').textContent = t.toFixed(2) + ' s';

  document.getElementById('lbl-m').textContent = (+slMass.value).toFixed(1) + ' kg';
  document.getElementById('lbl-h').textContent = (+slHeight.value).toFixed(1) + ' m';
  document.getElementById('lbl-fr').textContent = slFriction.value + '%';
  document.getElementById('lbl-angle').textContent = slAngle.value + '°';
  document.getElementById('lbl-k').textContent = slK.value + ' N/m';
}

// =============================================
// DRAW
// =============================================
function drawFrame() {
  resizeCanvas();
  ctx.clearRect(0, 0, W, H);

  // Background grid
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 50) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
  for (let gy = 0; gy < H; gy += 50) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

  if (scene === 'freefall')   drawFreefall();
  else if (scene === 'pendulum') drawPendulum();
  else if (scene === 'ramp')  drawRamp();
  else if (scene === 'spring') drawSpring();
  else if (scene === 'projectile') drawProjectile();

  // Energy trail
  if (document.getElementById('trailCheck').checked && energyTrail.length > 1) {
    drawTrail();
  }
}

// --- DRAW HELPERS ---
function drawGround(y) {
  ctx.fillStyle = 'rgba(60,120,60,0.4)';
  ctx.fillRect(0, y, W, H - y);
  ctx.strokeStyle = 'rgba(80,180,80,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();

  ctx.strokeStyle = 'rgba(80,180,80,0.2)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y + 12); ctx.stroke();
  }
}

function drawBall(cx, cy, r, color, glowColor, label) {
  ctx.shadowColor = glowColor; ctx.shadowBlur = 20;
  const grad = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
  grad.addColorStop(0, lighten(color));
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5;
  ctx.stroke();

  if (label) {
    ctx.font = 'bold 11px Arial'; ctx.fillStyle = 'white';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
  }
}

function lighten(hex) {
  return hex + 'aa';
}

function drawArrowV(x, y1, y2, color, label) {
  if (Math.abs(y2-y1) < 6) return;
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.setLineDash([5,4]);
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
  ctx.setLineDash([]);
  const dir = y2 > y1 ? 1 : -1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y2);
  ctx.lineTo(x-7, y2 - dir*12);
  ctx.lineTo(x+7, y2 - dir*12);
  ctx.closePath(); ctx.fill();
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 12, (y1+y2)/2);
}

function drawHeightLabel(x, yCur, yGround, h) {
  if (h < 0.05) return;
  ctx.strokeStyle = 'rgba(255,200,50,0.5)'; ctx.lineWidth = 1;
  ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(x+50, yCur); ctx.lineTo(x+50, yGround); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffcc44'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'left';
  ctx.fillText('h = ' + h.toFixed(2) + ' m', x + 56, (yCur + yGround)/2 + 4);
  ctx.strokeStyle = 'rgba(255,200,50,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x+46, yCur); ctx.lineTo(x+54, yCur); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+46, yGround); ctx.lineTo(x+54, yGround); ctx.stroke();
}

// =============================================
// DRAW FREEFALL
// =============================================
function drawFreefall() {
  const GROUND_Y = H - 50;
  const MAX_H    = 10;
  const pxPerM   = (GROUND_Y - 80) / MAX_H;
  const { h } = state;

  drawGround(GROUND_Y);

  // Height ruler
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  for (let hm = 0; hm <= MAX_H; hm += 2) {
    const gy = GROUND_Y - hm * pxPerM;
    ctx.beginPath(); ctx.moveTo(30, gy); ctx.lineTo(50, gy); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '10px Arial'; ctx.textAlign = 'right';
    ctx.fillText(hm + 'm', 28, gy + 4);
  }

  const ballX = W * 0.45;
  const ballY = GROUND_Y - h * pxPerM;
  const ballR = 22;

  // Dotted path
  ctx.strokeStyle = 'rgba(100,200,255,0.2)'; ctx.lineWidth = 1;
  ctx.setLineDash([4,6]);
  ctx.beginPath(); ctx.moveTo(ballX, 80); ctx.lineTo(ballX, GROUND_Y - ballR); ctx.stroke();
  ctx.setLineDash([]);

  drawHeightLabel(ballX, ballY, GROUND_Y, h);

  // Velocity arrow
  if (state.v > 0.3) {
    const arLen = Math.min(60, state.v * 6);
    drawArrowV(ballX + 40, ballY, ballY + arLen, '#44aaff', 'v=' + state.v.toFixed(1) + 'm/s');
  }

  drawBall(ballX, ballY, ballR, '#1177cc', '#44aaff', 'm=' + state.m.toFixed(1));

  // Energy labels on object
  const { ep, ek } = getEnergies();
  ctx.font = '10px Arial';
  ctx.fillStyle = '#ff9933'; ctx.textAlign = 'right';
  ctx.fillText('Ep=' + ep.toFixed(1) + 'J', ballX - 30, ballY - 8);
  ctx.fillStyle = '#44aaff';
  ctx.fillText('Ek=' + ek.toFixed(1) + 'J', ballX - 30, ballY + 12);

  if (state.done) {
    ctx.fillStyle = 'rgba(255,120,50,0.9)'; ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💥 Benda mencapai tanah!', W/2, GROUND_Y - 20);
  }
}

// =============================================
// DRAW PENDULUM
// =============================================
function drawPendulum() {
  const pivotX = W * 0.5;
  const pivotY = 60;
  const L_px   = 200;
  const { theta, L, m } = state;

  const bobX = pivotX + Math.sin(theta) * L_px;
  const bobY = pivotY + Math.cos(theta) * L_px;

  // Ceiling
  ctx.fillStyle = 'rgba(180,140,60,0.3)';
  ctx.fillRect(pivotX - 60, 0, 120, 18);
  ctx.strokeStyle = 'rgba(200,160,80,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pivotX - 60, 18); ctx.lineTo(pivotX + 60, 18); ctx.stroke();

  // Equilibrium line
  ctx.strokeStyle = 'rgba(100,255,100,0.2)'; ctx.lineWidth = 1;
  ctx.setLineDash([5,5]);
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(pivotX, pivotY + L_px + 40); ctx.stroke();
  ctx.setLineDash([]);

  // Height annotation
  const h_eq = L_px; // y of lowest point
  const h_cur = pivotY + Math.cos(theta) * L_px;
  if (Math.abs(theta) > 0.05) {
    ctx.strokeStyle = 'rgba(255,200,50,0.4)'; ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(bobX - 40, bobY); ctx.lineTo(bobX - 40, pivotY + L_px); ctx.stroke();
    ctx.setLineDash([]);
    const hh = L * (1 - Math.cos(theta));
    ctx.fillStyle = '#ffcc44'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'right';
    ctx.fillText('h=' + hh.toFixed(2) + 'm', bobX - 44, (bobY + pivotY + L_px)/2 + 4);
  }

  // String
  const grad = ctx.createLinearGradient(pivotX, pivotY, bobX, bobY);
  grad.addColorStop(0, 'rgba(200,200,200,0.5)');
  grad.addColorStop(1, 'rgba(200,200,200,0.9)');
  ctx.strokeStyle = grad; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY + 18); ctx.lineTo(bobX, bobY); ctx.stroke();

  // Pivot
  ctx.fillStyle = '#888';
  ctx.beginPath(); ctx.arc(pivotX, pivotY, 7, 0, Math.PI*2); ctx.fill();

  // Bob
  const speed = Math.abs(L * state.omega);
  const color = speed > 3 ? '#cc2200' : '#1177cc';
  const glow  = speed > 3 ? '#ff4400' : '#44aaff';
  drawBall(bobX, bobY, 22, color, glow, 'm=' + m.toFixed(1));

  // Velocity vector at bob
  if (Math.abs(state.omega) > 0.05) {
    const vx = state.L * state.omega * Math.cos(state.theta);
    const vy = -state.L * state.omega * Math.sin(state.theta);
    const vscale = 15;
    ctx.strokeStyle = '#44aaff'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(bobX, bobY); ctx.lineTo(bobX + vx*vscale, bobY + vy*vscale); ctx.stroke();
    ctx.fillStyle = '#44aaff'; ctx.font = '10px Arial'; ctx.textAlign = 'left';
    ctx.fillText('v', bobX + vx*vscale + 4, bobY + vy*vscale);
  }
}

// =============================================
// DRAW RAMP
// =============================================
function drawRamp() {
  const GROUND_Y = H - 50;
  const MAX_H    = 10;
  const pxPerM   = (GROUND_Y - 80) / MAX_H;
  const h0       = state.h0;
  const angle    = 30 * Math.PI/180;

  // Ramp
  const topX  = W * 0.18;
  const topY  = GROUND_Y - h0 * pxPerM;
  const baseX = topX + h0 * pxPerM / Math.tan(angle);
  const baseY = GROUND_Y;

  ctx.fillStyle = 'rgba(120,80,40,0.35)';
  ctx.beginPath();
  ctx.moveTo(topX, topY);
  ctx.lineTo(baseX, baseY);
  ctx.lineTo(topX, baseY);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = 'rgba(200,150,80,0.6)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(baseX, baseY); ctx.stroke();

  drawGround(GROUND_Y);

  // Ball on ramp
  const h = state.h;
  const frac = (h0 - h) / h0;
  const bx = topX + (baseX - topX) * frac;
  const by = topY + (baseY - topY) * frac - 12;

  drawHeightLabel(bx, by + 12, GROUND_Y, h);

  if (state.v > 0.1) {
    const arDir = (baseX - topX) / Math.hypot(baseX - topX, baseY - topY);
    const arLen = Math.min(55, state.v * 5);
    ctx.strokeStyle = '#44aaff'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + arDir*arLen, by + (baseY-topY)/(baseX-topX)*arDir*arLen); ctx.stroke();
  }

  drawBall(bx, by, 20, '#1166bb', '#44aaff', '');

  const { ep, ek, q } = getEnergies();
  ctx.font = '10px Arial'; ctx.textAlign = 'left';
  ctx.fillStyle = '#ff9933'; ctx.fillText('Ep=' + ep.toFixed(1) + 'J', bx + 26, by - 8);
  ctx.fillStyle = '#44aaff'; ctx.fillText('Ek=' + ek.toFixed(1) + 'J', bx + 26, by + 8);
  if (q > 0.1) { ctx.fillStyle = '#ffaa44'; ctx.fillText('Q=' + q.toFixed(1) + 'J', bx + 26, by + 24); }

  if (state.done) {
    ctx.fillStyle = 'rgba(80,220,80,0.9)'; ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✅ Selesai! v akhir = ' + state.v.toFixed(2) + ' m/s', W/2, GROUND_Y - 20);
  }
}

// =============================================
// DRAW SPRING
// =============================================
function drawSpring() {
  const CY = H * 0.5;
  const WALL_X = 80;
  const NATURE_LEN = W * 0.42;
  const PX_PER_M = 60;
  const { x, k, A } = state;

  const massX = WALL_X + NATURE_LEN + x * PX_PER_M;

  // Wall
  ctx.fillStyle = 'rgba(180,140,60,0.3)';
  ctx.fillRect(WALL_X - 18, CY - 70, 18, 140);
  ctx.strokeStyle = 'rgba(200,160,80,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(WALL_X, CY-70); ctx.lineTo(WALL_X, CY+70); ctx.stroke();
  for (let y = CY-70; y < CY+70; y+=16) {
    ctx.strokeStyle = 'rgba(200,160,80,0.2)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(WALL_X, y); ctx.lineTo(WALL_X-16, y+12); ctx.stroke();
  }

  // Natural length line
  ctx.strokeStyle = 'rgba(100,255,100,0.25)'; ctx.lineWidth = 1;
  ctx.setLineDash([5,5]);
  ctx.beginPath(); ctx.moveTo(WALL_X + NATURE_LEN, CY-50); ctx.lineTo(WALL_X + NATURE_LEN, CY+50); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font='10px Arial'; ctx.fillStyle='rgba(100,255,100,0.5)'; ctx.textAlign='center';
  ctx.fillText('x=0', WALL_X + NATURE_LEN, CY - 56);

  // Displacement label
  if (Math.abs(x) > 0.05) {
    const eqX = WALL_X + NATURE_LEN;
    ctx.strokeStyle = 'rgba(255,200,50,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(eqX, CY + 50); ctx.lineTo(massX, CY + 50); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffcc44'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
    ctx.fillText('x = ' + (x>=0?'+':'') + x.toFixed(2) + ' m', (eqX + massX)/2, CY + 64);
  }

  // Spring coils
  const coils = 12;
  const startX = WALL_X;
  const endX   = massX - 28;
  const steps  = coils * 2;
  const dx     = endX - startX;
  const compressed = x < -0.1, stretched = x > 0.1;
  const amp = compressed ? Math.max(5, 16 + x*25) : stretched ? Math.max(5, 16 - x*18) : 16;
  const springColor = stretched ? '#6acef5' : compressed ? '#ff6644' : '#aaccff';

  ctx.beginPath(); ctx.moveTo(startX, CY);
  for (let i = 1; i <= steps; i++) {
    const tx  = startX + dx * (i / steps);
    const off = amp * (i % 2 === 0 ? 1 : -1);
    ctx.lineTo(tx, CY + off);
  }
  ctx.lineTo(endX, CY);
  ctx.strokeStyle = springColor; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

  // Mass block
  const sz = 34;
  ctx.shadowColor = '#1177cc'; ctx.shadowBlur = 18;
  const mgrad = ctx.createLinearGradient(massX-sz, CY-sz, massX+sz, CY+sz);
  mgrad.addColorStop(0, '#2a88cc');
  mgrad.addColorStop(1, '#0a3366');
  ctx.fillStyle = mgrad;
  ctx.beginPath(); ctx.roundRect(massX-sz, CY-sz, sz*2, sz*2, 8); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'white'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('m=' + state.m.toFixed(1), massX, CY);
  ctx.textBaseline = 'alphabetic';

  // Force arrow
  const F = -k * x;
  if (Math.abs(F) > 1) {
    const arLen = Math.min(70, Math.abs(F) / (k * A) * 70);
    const arDir = F > 0 ? -1 : 1;
    ctx.strokeStyle = '#ffaa00'; ctx.fillStyle = '#ffaa00'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(massX, CY - sz - 10);
    ctx.lineTo(massX + arDir * arLen, CY - sz - 10); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(massX + arDir*arLen, CY-sz-10);
    ctx.lineTo(massX + arDir*(arLen-12), CY-sz-18);
    ctx.lineTo(massX + arDir*(arLen-12), CY-sz-2);
    ctx.closePath(); ctx.fill();
    ctx.font='10px Arial'; ctx.textAlign='center'; ctx.fillStyle='#ffaa00';
    ctx.fillText('F='+Math.abs(F).toFixed(1)+'N', massX + arDir*arLen/2, CY-sz-22);
  }
}

// =============================================
// DRAW PROJECTILE
// =============================================
function drawProjectile() {
  const GROUND_Y = H - 50;
  const MAX_H    = 12;
  const MAX_X    = 35;
  const pxPerMy  = (GROUND_Y - 60) / MAX_H;
  const pxPerMx  = (W - 80) / MAX_X;

  drawGround(GROUND_Y);

  const { x, h, vx, vy } = state;
  const bx = 60 + x * pxPerMx;
  const by = GROUND_Y - h * pxPerMy;

  // Trajectory trace
  if (energyTrail.length > 1) {
    ctx.strokeStyle = 'rgba(100,200,255,0.3)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([4,4]);
    ctx.beginPath();
    energyTrail.forEach((pt, i) => {
      const px = 60 + pt.px * pxPerMx;
      const py = GROUND_Y - pt.py * pxPerMy;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke(); ctx.setLineDash([]);
  }

  drawHeightLabel(bx, by, GROUND_Y, h);

  // Velocity arrow
  if (!state.done && (Math.abs(vx) + Math.abs(vy)) > 0.5) {
    const speed  = Math.sqrt(vx*vx + vy*vy);
    const scale  = Math.min(50, speed * 2.5);
    const nx = vx / speed, ny = -vy / speed;
    ctx.strokeStyle = '#44aaff'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + nx*scale, by + ny*scale); ctx.stroke();
    ctx.fillStyle = '#44aaff'; ctx.font = '10px Arial'; ctx.textAlign = 'left';
    ctx.fillText('v=' + speed.toFixed(1), bx + nx*scale + 4, by + ny*scale);
  }

  drawBall(bx, Math.min(by, GROUND_Y), 20, '#cc3300', '#ff5533', '');

  if (state.done) {
    ctx.fillStyle = 'rgba(255,200,50,0.9)'; ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎯 Mendarat! Jarak = ' + state.x.toFixed(1) + ' m', W/2, GROUND_Y - 20);
  }
}

// =============================================
// ENERGY TRAIL
// =============================================
function drawTrail() {
  if (scene === 'projectile') return; // handled separately

  const { ep: epMax, em: emMax } = getInitialEnergy();
  const maxE = emMax + 1;

  const trailW = W * 0.80;
  const trailH = 30;
  const tx = W * 0.10;
  const ty = H - 18;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.roundRect(tx - 4, ty - trailH - 4, trailW + 8, trailH + 8, 6); ctx.fill();

  const maxTrail = Math.max(1, energyTrail.length - 1);
  energyTrail.forEach((pt, i) => {
    const px = tx + (i / maxTrail) * trailW;
    const epH = (pt.ep / maxE) * trailH;
    const ekH = (pt.ek / maxE) * trailH;
    ctx.fillStyle = 'rgba(255,100,0,0.7)';
    ctx.fillRect(px, ty - epH, 2, epH);
    ctx.fillStyle = 'rgba(0,150,255,0.7)';
    ctx.fillRect(px + 2, ty - ekH, 2, ekH);
  });

  ctx.font = '9px Arial'; ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,100,0,0.8)'; ctx.fillText('Ep', tx, ty - trailH - 6);
  ctx.fillStyle = 'rgba(0,150,255,0.8)'; ctx.fillText('Ek', tx + 20, ty - trailH - 6);
}

function getInitialEnergy() {
  const m = state.m;
  if (scene === 'freefall')   return { ep: m*G*state.h0, em: m*G*state.h0 };
  if (scene === 'ramp')       return { ep: m*G*state.h0, em: m*G*state.h0 };
  if (scene === 'pendulum')   { const h0=state.L*(1-Math.cos(state.theta0)); return {ep:m*G*h0,em:m*G*h0}; }
  if (scene === 'spring')     { const e=0.5*state.k*state.A*state.A; return {ep:e,em:e}; }
  if (scene === 'projectile') { const e=m*G*state.h0+0.5*m*(state.vx*state.vx+state.vy*state.vy); return{ep:m*G*state.h0,em:e};}
  return { ep: 1, em: 1 };
}

// =============================================
// ANIMATION LOOP
// =============================================
let animId = null;
let trailTick = 0;

function loop() {
  physicsStep(3);
  trailTick++;
  if (trailTick % 4 === 0) {
    const { ep, ek } = getEnergies();
    const pt = { ep, ek };
    if (scene === 'projectile') { pt.px = state.x; pt.py = state.h; }
    energyTrail.push(pt);
    if (energyTrail.length > 400) energyTrail.shift();
  }
  updateUI();
  drawFrame();

  const done = (scene === 'freefall' || scene === 'ramp' || scene === 'projectile') && state.done;
  if (done) { running = false; document.getElementById('btnPlay').textContent = '▶ Mulai'; return; }

  if (running) animId = requestAnimationFrame(loop);
}

function togglePlay() {
  if (running) {
    running = false;
    cancelAnimationFrame(animId);
    document.getElementById('btnPlay').textContent = '▶ Lanjut';
  } else {
    if ((scene === 'freefall' || scene === 'ramp' || scene === 'projectile') && state.done) resetSim();
    running = true;
    document.getElementById('btnPlay').textContent = '⏸ Pause';
    loop();
  }
}

function stepOnce() {
  if (running) return;
  physicsStep(3);
  const { ep, ek } = getEnergies();
  energyTrail.push({ ep, ek, px: state.x||0, py: state.h||0 });
  updateUI();
  drawFrame();
}

function resetSim() {
  running = false;
  cancelAnimationFrame(animId);
  document.getElementById('btnPlay').textContent = '▶ Mulai';
  energyTrail = [];
  initState();
  updateUI();
  drawFrame();
}

// =============================================
// SLIDER EVENTS
// =============================================
[slMass, slHeight, slFriction, slAngle, slK].forEach(sl => {
  sl.addEventListener('input', () => {
    if (!running) { initState(); updateUI(); drawFrame(); }
    else updateUI();
  });
});

// =============================================
// INIT
// =============================================
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x+r, y);
    this.lineTo(x+w-r, y); this.arcTo(x+w, y, x+w, y+r, r);
    this.lineTo(x+w, y+h-r); this.arcTo(x+w, y+h, x+w-r, y+h, r);
    this.lineTo(x+r, y+h); this.arcTo(x, y+h, x, y+h-r, r);
    this.lineTo(x, y+r); this.arcTo(x, y, x+r, y, r);
    this.closePath();
  };
}

window.addEventListener('resize', () => { if (!running) drawFrame(); });
setScene('freefall');