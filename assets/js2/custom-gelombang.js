// ══════════════════════════════════════════
//   STATE
// ══════════════════════════════════════════
let simTime = 0;
let running = false;
let animId  = null;
let lastTs  = null;
let speedMul = 1;
let mode = 'travel'; // 'travel' | 'standing' | 'super'
let wave2Active = false;

// Time-domain history
const TD_MAX = 400;
let tdHistory = [];
let tdHistory2 = [];
let tdHistorySum = [];

// Params
let p = {};
function readParams() {
  p.A     = parseFloat(document.getElementById('amp').value);
  p.f     = parseFloat(document.getElementById('freq').value);
  p.v     = parseFloat(document.getElementById('vel').value);
  p.phi   = parseFloat(document.getElementById('phase').value);
  p.A2    = parseFloat(document.getElementById('amp2').value);
  p.f2    = parseFloat(document.getElementById('freq2').value);
  p.v2    = parseFloat(document.getElementById('vel2').value);
  p.phi2  = parseFloat(document.getElementById('phase2').value);
  // derived
  p.lam   = p.v / p.f;
  p.k     = 2*Math.PI / p.lam;
  p.omega = 2*Math.PI * p.f;
  p.T     = 1 / p.f;
  p.lam2  = p.v2 / p.f2;
  p.k2    = 2*Math.PI / p.lam2;
  p.omega2= 2*Math.PI * p.f2;
}

// Wave functions
function y1(x, t) {
  if (mode === 'standing') {
    return p.A * Math.sin(p.k * x + p.phi) * Math.cos(p.omega * t);
  }
  return p.A * Math.sin(p.k * x - p.omega * t + p.phi);
}
function y2(x, t) {
  if (mode === 'standing') {
    return -p.A2 * Math.sin(p.k2 * x + p.phi2) * Math.cos(p.omega2 * t);
  }
  return p.A2 * Math.sin(p.k2 * x + p.omega2 * t + p.phi2); // travels LEFT
}
function ySum(x, t) {
  if (wave2Active || mode === 'super' || mode === 'standing') {
    return y1(x,t) + y2(x,t);
  }
  return y1(x,t);
}

// ══════════════════════════════════════════
//   CANVAS SETUP
// ══════════════════════════════════════════
const canvases = {
  main:   document.getElementById('mainCanvas'),
  time:   document.getElementById('timeCanvas'),
  energy: document.getElementById('energyCanvas'),
};
const ctxs = {};
for (const k in canvases) ctxs[k] = canvases[k].getContext('2d');

function resizeCanvases() {
  const area = document.querySelector('.canvas-area');
  const w = area.clientWidth - 60;
  canvases.main.width   = w; canvases.main.height   = 200;
  canvases.time.width   = w; canvases.time.height   = 140;
  canvases.energy.width = w; canvases.energy.height = 120;
  draw();
}
window.addEventListener('resize', resizeCanvases);

// ══════════════════════════════════════════
//   DRAWING
// ══════════════════════════════════════════
const X_DOMAIN = 20; // metres shown

function drawGrid(ctx, W, H, midY, pxPerMeter, maxA) {
  if (!document.getElementById('showGrid').checked) return;
  ctx.strokeStyle = 'rgba(96,165,250,0.1)';
  ctx.lineWidth = 1;
  // vertical lines
  for (let x = 0; x <= X_DOMAIN; x += 2) {
    const px = x * pxPerMeter;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.font = '10px monospace';
    ctx.fillText(x+'m', px+2, H-4);
  }
  // horizontal amplitude guides
  for (const frac of [-1,-0.5,0.5,1]) {
    const py = midY - frac * maxA * pxPerMeter;
    ctx.beginPath(); ctx.moveTo(0,py); ctx.lineTo(W,py); ctx.stroke();
  }
}

function drawAxis(ctx, W, H, midY) {
  ctx.strokeStyle = 'rgba(148,163,184,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0,midY); ctx.lineTo(W,midY); ctx.stroke();
}

function drawWaveLine(ctx, W, midY, pxPerM, yFn, color, lineW=2.5) {
  const steps = W * 2;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth   = lineW;
  ctx.shadowColor = color;
  ctx.shadowBlur  = 8;
  for (let i = 0; i <= steps; i++) {
    const x  = (i / steps) * X_DOMAIN;
    const px = (i / steps) * W;
    const py = midY - yFn(x, simTime) * pxPerM;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawParticleDots(ctx, W, midY, pxPerM, yFn, color) {
  if (!document.getElementById('showDots').checked) return;
  const N = 20;
  for (let i = 0; i <= N; i++) {
    const x  = (i / N) * X_DOMAIN;
    const px = (i / N) * W;
    const yv = yFn(x, simTime);
    const py = midY - yv * pxPerM;
    const r  = 3.5;
    const grad = ctx.createRadialGradient(px,py,0,px,py,r*2);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, color);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

function drawMainCanvas() {
  const cvs = canvases.main;
  const ctx = ctxs.main;
  const W = cvs.width, H = cvs.height;
  const midY = H / 2;
  const maxA = 2.2;
  const pxPerM = (H * 0.42) / maxA;

  ctx.clearRect(0, 0, W, H);

  // BG gradient
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'rgba(10,20,60,0.9)');
  bg.addColorStop(1,'rgba(5,10,30,0.9)');
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,W,H);

  drawGrid(ctx, W, H, midY, W / X_DOMAIN, maxA);
  drawAxis(ctx, W, H, midY);

  if (mode === 'super' || mode === 'standing' || wave2Active) {
    // Draw wave 1 (dashed blue)
    ctx.setLineDash([6,4]);
    drawWaveLine(ctx, W, midY, pxPerM, y1, 'rgba(96,165,250,0.6)', 1.5);
    // Draw wave 2 (dashed red)
    drawWaveLine(ctx, W, midY, pxPerM, y2, 'rgba(248,113,113,0.6)', 1.5);
    ctx.setLineDash([]);
    // Draw sum (solid white/cyan)
    drawWaveLine(ctx, W, midY, pxPerM, ySum, 'rgba(167,243,208,1)', 2.8);
    drawParticleDots(ctx, W, midY, pxPerM, ySum, '#6ee7b7');
  } else {
    drawWaveLine(ctx, W, midY, pxPerM, y1, '#60a5fa', 2.8);
    drawParticleDots(ctx, W, midY, pxPerM, y1, '#93c5fd');
  }

  // Amplitude label
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`A = ${p.A.toFixed(2)} m`, 8, 18);
  ctx.fillText(`λ = ${p.lam.toFixed(2)} m`, 8, 32);
}

function drawTimeCanvas() {
  const cvs = canvases.time;
  const ctx = ctxs.time;
  const W = cvs.width, H = cvs.height;
  const midY = H / 2;
  const maxA = 2.2;
  const pxPerM = (H * 0.38) / maxA;

  ctx.clearRect(0,0,W,H);
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'rgba(10,20,60,0.9)');
  bg.addColorStop(1,'rgba(5,10,30,0.9)');
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,W,H);

  // grid
  if (document.getElementById('showGrid').checked) {
    ctx.strokeStyle = 'rgba(96,165,250,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const px = i * W/10;
      ctx.beginPath(); ctx.moveTo(px,0); ctx.lineTo(px,H); ctx.stroke();
    }
  }
  drawAxis(ctx, W, H, midY);

  // draw history
  function drawHistory(hist, color) {
    if (hist.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;
    hist.forEach((v, i) => {
      const px = (i / (TD_MAX-1)) * W;
      const py = midY - v * pxPerM;
      i === 0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (mode === 'super' || mode === 'standing' || wave2Active) {
    drawHistory(tdHistory,  'rgba(96,165,250,0.5)');
    drawHistory(tdHistory2, 'rgba(248,113,113,0.5)');
    drawHistory(tdHistorySum,'rgba(167,243,208,1)');
  } else {
    drawHistory(tdHistory, '#60a5fa');
  }

  // Current time cursor
  const cx = ((tdHistory.length-1) / (TD_MAX-1)) * W;
  ctx.strokeStyle = 'rgba(255,255,100,0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,H); ctx.stroke();
  ctx.setLineDash([]);

  // label
  ctx.fillStyle='rgba(148,163,184,0.6)';
  ctx.font='10px monospace';
  ctx.fillText('x = 0', 6, 16);
  ctx.fillText(`T = ${p.T.toFixed(2)} s`, 6, 28);
}

function drawEnergyCanvas() {
  if (!document.getElementById('showEnergy').checked) {
    document.getElementById('energy-card').style.display = 'none';
    return;
  }
  document.getElementById('energy-card').style.display = '';
  const cvs = canvases.energy;
  const ctx = ctxs.energy;
  const W = cvs.width, H = cvs.height;

  ctx.clearRect(0,0,W,H);
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'rgba(10,20,60,0.9)');
  bg.addColorStop(1,'rgba(5,10,30,0.9)');
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,W,H);

  const steps = W;
  const maxE  = 0.5 * p.A * p.A; // normalize

  for (let i = 0; i < steps; i++) {
    const x  = (i / steps) * X_DOMAIN;
    const yv = ySum(x, simTime);
    // dy/dx ≈ (y(x+dx) - y(x)) / dx
    const dx  = X_DOMAIN / steps;
    const dydt = ySum(x, simTime + 0.001) - yv; // approx velocity ∝ this
    const EK   = 0.5 * (dydt / 0.001) ** 2;
    const EP   = 0.5 * p.omega**2 * yv**2;
    const normEK = Math.min(EK / (p.omega**2 * p.A**2), 1);
    const normEP = Math.min(EP / (0.5 * p.omega**2 * p.A**2 * 2), 1);
    const hEK = normEK * (H * 0.45);
    const hEP = normEP * (H * 0.45);

    // Kinetic (blue)
    ctx.fillStyle = `rgba(59,130,246,${0.4+normEK*0.6})`;
    ctx.fillRect(i, H/2 - hEK, 1, hEK);
    // Potential (red)
    ctx.fillStyle = `rgba(239,68,68,${0.4+normEP*0.6})`;
    ctx.fillRect(i, H/2, 1, hEP);
  }

  // baseline
  ctx.strokeStyle = 'rgba(148,163,184,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();

  ctx.fillStyle='rgba(96,165,250,0.8)';
  ctx.font='10px monospace';
  ctx.fillText('Ek (kinetik)', 6, H/2-4);
  ctx.fillStyle='rgba(248,113,113,0.8)';
  ctx.fillText('Ep (potensial)', 6, H/2+14);
}

function draw() {
  drawMainCanvas();
  drawTimeCanvas();
  drawEnergyCanvas();
  updateInfoDisplay();
}

// ══════════════════════════════════════════
//   ANIMATION LOOP
// ══════════════════════════════════════════
function animate(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min((ts - lastTs) / 1000, 0.05) * speedMul;
  lastTs = ts;
  simTime += dt;

  // Update time-domain history
  tdHistory.push(y1(0, simTime));
  tdHistory2.push(y2(0, simTime));
  tdHistorySum.push(ySum(0, simTime));
  if (tdHistory.length > TD_MAX)    tdHistory.shift();
  if (tdHistory2.length > TD_MAX)   tdHistory2.shift();
  if (tdHistorySum.length > TD_MAX) tdHistorySum.shift();

  document.getElementById('time-display').textContent = `t = ${simTime.toFixed(2)} s`;
  document.getElementById('m-y0').textContent = ySum(0, simTime).toFixed(3);

  draw();
  animId = requestAnimationFrame(animate);
}

function startSim() {
  if (running) return;
  running = true;
  lastTs = null;
  animId = requestAnimationFrame(animate);
  document.getElementById('btn-play').style.opacity='0.5';
  document.getElementById('btn-pause').style.opacity='1';
}
function pauseSim() {
  running = false;
  cancelAnimationFrame(animId);
  document.getElementById('btn-play').style.opacity='1';
  document.getElementById('btn-pause').style.opacity='0.5';
}
function resetSim() {
  pauseSim();
  simTime = 0;
  tdHistory = []; tdHistory2 = []; tdHistorySum = [];
  document.getElementById('time-display').textContent = 't = 0.00 s';
  draw();
}

// ══════════════════════════════════════════
//   PARAMS UPDATE
// ══════════════════════════════════════════
function updateParams() {
  readParams();

  document.getElementById('ampVal').textContent    = p.A.toFixed(2)+' m';
  document.getElementById('freqVal').textContent   = p.f.toFixed(1)+' Hz';
  document.getElementById('velVal').textContent    = p.v.toFixed(1)+' m/s';
  document.getElementById('phaseVal').textContent  = p.phi.toFixed(2)+' rad';
  document.getElementById('amp2Val').textContent   = p.A2.toFixed(2)+' m';
  document.getElementById('freq2Val').textContent  = p.f2.toFixed(1)+' Hz';
  document.getElementById('vel2Val').textContent   = p.v2.toFixed(1)+' m/s';
  document.getElementById('phase2Val').textContent = p.phi2.toFixed(2)+' rad';

  document.getElementById('lambdaInfo').textContent = p.lam.toFixed(3)+' m';
  document.getElementById('kInfo').textContent      = p.k.toFixed(4)+' rad/m';
  document.getElementById('omegaInfo').textContent  = p.omega.toFixed(3)+' rad/s';
  document.getElementById('periodInfo').textContent = p.T.toFixed(3)+' s';

  document.getElementById('m-lambda').textContent = p.lam.toFixed(2);
  document.getElementById('m-period').textContent = p.T.toFixed(3);
  document.getElementById('m-vel').textContent    = p.v.toFixed(2);

  if (!running) draw();
}

function updateInfoDisplay() {
  document.getElementById('m-lambda').textContent = p.lam.toFixed(2);
  document.getElementById('m-period').textContent = p.T.toFixed(3);
  document.getElementById('m-vel').textContent    = p.v.toFixed(2);
}

// ══════════════════════════════════════════
//   MODE
// ══════════════════════════════════════════
function setMode(m) {
  mode = m;
  ['travel','standing','super'].forEach(id => {
    document.getElementById('tab-'+id).classList.toggle('active', id===m);
  });

  const superposePanel = document.getElementById('superpose-panel');
  const wave2Controls  = document.getElementById('wave2-controls');
  const w1title        = document.getElementById('w1-title');
  const formulaDisp    = document.getElementById('formula-display');
  const mainTitle      = document.getElementById('main-canvas-title');

  if (m === 'travel') {
    superposePanel.style.display = 'none';
    wave2Active = false;
    wave2Controls.style.display = 'none';
    w1title.textContent = '🔵 Gelombang';
    formulaDisp.textContent = 'y = A·sin(kx − ωt + φ)';
    mainTitle.textContent   = '🌊 Gelombang Berjalan — y(x, t)';
  } else if (m === 'standing') {
    superposePanel.style.display = 'none';
    wave2Active = true;
    wave2Controls.style.display = '';
    w1title.textContent = '🔵 Gel. Maju';
    formulaDisp.textContent = 'y = 2A·cos(ωt)·sin(kx)';
    mainTitle.textContent   = '🎵 Gelombang Stasioner — y(x, t)';
    // sync params
    document.getElementById('amp2').value  = document.getElementById('amp').value;
    document.getElementById('freq2').value = document.getElementById('freq').value;
    document.getElementById('vel2').value  = document.getElementById('vel').value;
  } else { // super
    superposePanel.style.display = 'none';
    wave2Active = true;
    wave2Controls.style.display = '';
    w1title.textContent = '🔵 Gelombang 1';
    formulaDisp.textContent = 'y = y₁(x,t) + y₂(x,t)';
    mainTitle.textContent   = '⚡ Superposisi Gelombang — y(x, t)';
  }

  resetSim();
  updateParams();
}

function toggleWave2() {
  wave2Active = document.getElementById('toggleW2').checked;
  document.getElementById('wave2-controls').style.display = wave2Active ? '' : 'none';
  updateParams();
}

// ══════════════════════════════════════════
//   SPEED
// ══════════════════════════════════════════
function setSpeed(s) {
  speedMul = s;
  document.querySelectorAll('.chip').forEach(c => {
    const label = c.textContent;
    const val = {'¼×':0.25,'½×':0.5,'1×':1,'2×':2,'4×':4}[label];
    c.classList.toggle('active', val === s);
  });
}

// ══════════════════════════════════════════
//   INIT
// ══════════════════════════════════════════
window.addEventListener('load', () => {
  resizeCanvases();
  readParams();
  updateParams();
  draw();
  startSim();
});