// ==========================================
// STATE
// ==========================================
const K = 8.99e9;
let q1Mag = 2e-6, q1Sign = 1;
let q2Mag = 3e-6, q2Sign = -1;
let dist = 0.30;

// Canvas drag state
const canvas = document.getElementById('sim');
const ctx = canvas.getContext('2d');
let dragging = null;
let charge1X = 0, charge2X = 0;
let animTick = 0;

// ==========================================
// CALCULATE & UPDATE UI
// ==========================================
function calculate() {
  const q1 = q1Mag * q1Sign;
  const q2 = q2Mag * q2Sign;
  const r = dist;
  const F = K * Math.abs(q1) * Math.abs(q2) / (r * r);

  // Nature
  const sameSign = q1Sign === q2Sign;
  const bothZero = false;
  const natureEl = document.getElementById('forceNature');
  const barEl = document.getElementById('forceBar');
  if (F < 1e-6) {
    natureEl.className = 'force-nature zero';
    natureEl.textContent = '— tidak ada gaya —';
    barEl.className = 'force-bar-fill fill-attract';
  } else if (sameSign) {
    natureEl.className = 'force-nature repel';
    natureEl.textContent = '↔ Tolak-Menolak (Repulsif)';
    barEl.className = 'force-bar-fill fill-repel';
  } else {
    natureEl.className = 'force-nature attract';
    natureEl.textContent = '↕ Tarik-Menarik (Attraktif)';
    barEl.className = 'force-bar-fill fill-attract';
  }

  // Force value
  let fDisplay, fUnit;
  if (F >= 1) {
    fDisplay = F.toFixed(2); fUnit = 'N';
    document.getElementById('forceVal').textContent = fDisplay;
    document.querySelector('.force-unit').textContent = 'Newton (N)';
  } else if (F >= 0.001) {
    fDisplay = (F*1000).toFixed(2); fUnit = 'mN';
    document.getElementById('forceVal').textContent = fDisplay;
    document.querySelector('.force-unit').textContent = 'miliNewton (mN)';
  } else {
    fDisplay = (F*1e6).toFixed(2); fUnit = 'μN';
    document.getElementById('forceVal').textContent = fDisplay;
    document.querySelector('.force-unit').textContent = 'mikroNewton (μN)';
  }

  // Bar (log scale)
  const maxF = K * 10e-6 * 10e-6 / (0.05 * 0.05);
  const pct = Math.min(100, (Math.log10(F + 1) / Math.log10(maxF + 1)) * 100);
  barEl.style.width = pct + '%';

  // Breakdown
  document.getElementById('bd1').textContent = formatCharge(q1);
  document.getElementById('bd2').textContent = formatCharge(q2);
  document.getElementById('bdr').textContent = r.toFixed(2) + ' m';
  document.getElementById('bdr2').textContent = (r*r).toFixed(4) + ' m²';
  document.getElementById('bdF').textContent = F.toExponential(3) + ' N';

  updateChargeLabels();
}

function formatCharge(q) {
  const sign = q >= 0 ? '+' : '−';
  const val = Math.abs(q) * 1e6;
  return sign + val.toFixed(1) + ' μC';
}

function updateChargeLabels() {
  const q1 = q1Mag * q1Sign;
  const q2 = q2Mag * q2Sign;
  document.getElementById('q1Val').textContent = formatCharge(q1);
  document.getElementById('q2Val').textContent = formatCharge(q2);
  document.getElementById('rVal').textContent = dist.toFixed(2) + ' m';

  // Dot colors
  const d1 = document.getElementById('dot1');
  const d2 = document.getElementById('dot2');
  d1.style.background = q1Sign > 0 ? '#ff4444' : '#4488ff';
  d1.textContent = q1Sign > 0 ? '+' : '−';
  d2.style.background = q2Sign > 0 ? '#ff4444' : '#4488ff';
  d2.textContent = q2Sign > 0 ? '+' : '−';
}

// ==========================================
// SIGN BUTTONS
// ==========================================
function setSign(which, s) {
  if (which === 1) {
    q1Sign = s === 'pos' ? 1 : -1;
    document.getElementById('q1pos').className = 'sign-btn pos' + (s==='pos' ? ' active' : '');
    document.getElementById('q1neg').className = 'sign-btn neg' + (s==='neg' ? ' active' : '');
  } else {
    q2Sign = s === 'pos' ? 1 : -1;
    document.getElementById('q2pos').className = 'sign-btn pos' + (s==='pos' ? ' active' : '');
    document.getElementById('q2neg').className = 'sign-btn neg' + (s==='neg' ? ' active' : '');
  }
  calculate();
}

// ==========================================
// SLIDERS
// ==========================================
document.getElementById('q1Slider').addEventListener('input', function() {
  q1Mag = parseFloat(this.value) * 1e-6;
  calculate();
});
document.getElementById('q2Slider').addEventListener('input', function() {
  q2Mag = parseFloat(this.value) * 1e-6;
  calculate();
});
document.getElementById('rSlider').addEventListener('input', function() {
  dist = parseFloat(this.value) / 100;
  calculate();
});

// ==========================================
// RESET
// ==========================================
function resetAll() {
  q1Mag = 2e-6; q1Sign = 1;
  q2Mag = 3e-6; q2Sign = -1;
  dist = 0.30;
  document.getElementById('q1Slider').value = 2;
  document.getElementById('q2Slider').value = 3;
  document.getElementById('rSlider').value = 30;
  document.getElementById('q1pos').className = 'sign-btn pos active';
  document.getElementById('q1neg').className = 'sign-btn neg';
  document.getElementById('q2pos').className = 'sign-btn pos';
  document.getElementById('q2neg').className = 'sign-btn neg active';
  calculate();
}

// ==========================================
// CANVAS DRAW
// ==========================================
function getChargePositions() {
  const W = canvas.width, H = canvas.height;
  const cx = W / 2;
  const pixPerMeter = 400;
  const halfDist = (dist * pixPerMeter) / 2;
  const c1x = cx - halfDist;
  const c2x = cx + halfDist;
  return { c1x, c2x, cy: H / 2 };
}

function drawSim() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // BG grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const { c1x, c2x, cy } = getChargePositions();
  const q1 = q1Mag * q1Sign;
  const q2 = q2Mag * q2Sign;
  const sameSign = q1Sign === q2Sign;
  const F = K * Math.abs(q1) * Math.abs(q2) / (dist * dist);

  // === FIELD LINES ===
  drawFieldLines(ctx, c1x, cy, c2x, cy, q1Sign, q2Sign, q1Mag, q2Mag);

  // === FORCE VECTOR ARROWS ===
  const maxF = K * 10e-6 * 10e-6 / (0.05 * 0.05);
  const fNorm = Math.min(1, F / (maxF * 0.05));
  const arrowLen = 20 + fNorm * 80;
  const arrowColor = sameSign ? 'rgba(255,160,30,0.9)' : 'rgba(50,180,255,0.9)';

  if (F > 1e-9) {
    if (sameSign) {
      drawArrow(ctx, c1x, cy, c1x - arrowLen, cy, arrowColor, 4);
      drawArrow(ctx, c2x, cy, c2x + arrowLen, cy, arrowColor, 4);
    } else {
      drawArrow(ctx, c1x, cy, c1x + arrowLen, cy, arrowColor, 4);
      drawArrow(ctx, c2x, cy, c2x - arrowLen, cy, arrowColor, 4);
    }
  }

  // === DISTANCE RULER ===
  drawRuler(ctx, c1x, c2x, cy + 55);

  // === CHARGES ===
  drawCharge(ctx, c1x, cy, q1Mag * 1e6, q1Sign, animTick);
  drawCharge(ctx, c2x, cy, q2Mag * 1e6, q2Sign, animTick + 30);

  // === LABELS ===
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = q1Sign > 0 ? '#ff9999' : '#99aaff';
  ctx.fillText(formatCharge(q1), c1x, cy - 52);
  ctx.fillStyle = q2Sign > 0 ? '#ff9999' : '#99aaff';
  ctx.fillText(formatCharge(q2), c2x, cy - 52);

  // Force label center
  ctx.font = 'bold 12px Arial';
  ctx.fillStyle = '#88ff88';
  ctx.textAlign = 'center';
  let fStr;
  if (F >= 1) fStr = 'F = ' + F.toFixed(2) + ' N';
  else if (F >= 0.001) fStr = 'F = ' + (F*1000).toFixed(2) + ' mN';
  else fStr = 'F = ' + (F*1e6).toFixed(2) + ' μN';
  ctx.fillText(fStr, W / 2, 24);
  ctx.font = '11px Arial';
  ctx.fillStyle = sameSign ? '#ffcc66' : '#66ccff';
  ctx.fillText(sameSign ? '↔ Tolak-Menolak' : '↕ Tarik-Menarik', W / 2, 42);

  animTick++;
}

function drawCharge(ctx, x, y, magMC, sign, tick) {
  const r = 14 + magMC * 2.5;
  const col = sign > 0 ? '#ff4444' : '#4488ff';
  const colLight = sign > 0 ? '#ff9999' : '#99bbff';

  // Glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
  glow.addColorStop(0, col + '55');
  glow.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Outer ring pulse
  const pulseR = r + 4 + Math.sin(tick * 0.08) * 4;
  ctx.beginPath();
  ctx.arc(x, y, pulseR, 0, Math.PI * 2);
  ctx.strokeStyle = col + '66';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Main circle
  const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 0, x, y, r);
  grad.addColorStop(0, colLight);
  grad.addColorStop(0.5, col);
  grad.addColorStop(1, sign > 0 ? '#880000' : '#002288');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Sign symbol
  ctx.fillStyle = 'white';
  ctx.font = `bold ${r * 1.2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sign > 0 ? '+' : '−', x, y + 1);
  ctx.textBaseline = 'alphabetic';
}

function drawArrow(ctx, x1, y1, x2, y2, color, lineWidth) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 14;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI/7), y2 - headLen * Math.sin(angle - Math.PI/7));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI/7), y2 - headLen * Math.sin(angle + Math.PI/7));
  ctx.closePath();
  ctx.fill();
}

function drawRuler(ctx, x1, x2, y) {
  ctx.strokeStyle = 'rgba(100,220,100,0.5)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath(); ctx.moveTo(x1, y - 6); ctx.lineTo(x1, y + 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y - 6); ctx.lineTo(x2, y + 6); ctx.stroke();

  ctx.fillStyle = 'rgba(100,220,100,0.8)';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('r = ' + dist.toFixed(2) + ' m', (x1 + x2) / 2, y + 18);
}

function drawFieldLines(ctx, x1, y1, x2, y2, s1, s2, m1, m2) {
  const numLines = 6;
  const sameSign = s1 === s2;

  for (let i = 0; i < numLines; i++) {
    const angle = (i / numLines) * Math.PI * 2;
    const lineColor = sameSign ? 'rgba(255,140,0,0.15)' : 'rgba(80,180,255,0.12)';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 6]);

    ctx.beginPath();
    if (sameSign) {
      const r = 22 + (m1 * 1e6) * 3;
      ctx.arc(x1, y1, r, 0, Math.PI * 2);
      ctx.stroke();
      const r2 = 22 + (m2 * 1e6) * 3;
      ctx.beginPath();
      ctx.arc(x2, y2, r2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const cx = (x1 + x2) / 2;
      const ex = x1 + Math.cos(angle) * 55;
      const ey = y1 + Math.sin(angle) * 55;
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cx, y1 + Math.sin(angle + Math.PI/3) * 40, x2, y2);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
}

// ==========================================
// DRAG SUPPORT
// ==========================================
function getCanvasXY(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('touchstart', startDrag, { passive: true });
canvas.addEventListener('mousemove', doDrag);
canvas.addEventListener('touchmove', doDrag, { passive: false });
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('touchend', endDrag);

function startDrag(e) {
  const { x } = getCanvasXY(e);
  const { c1x, c2x } = getChargePositions();
  const r1 = 14 + q1Mag * 1e6 * 2.5;
  const r2 = 14 + q2Mag * 1e6 * 2.5;
  if (Math.abs(x - c1x) < r1 + 8) dragging = 1;
  else if (Math.abs(x - c2x) < r2 + 8) dragging = 2;
}

function doDrag(e) {
  if (!dragging) return;
  if (e.preventDefault) e.preventDefault();
  const { x } = getCanvasXY(e);
  const W = canvas.width;
  const cx = W / 2;
  const pixPerMeter = 400;

  if (dragging === 1) {
    const newHalf = Math.max(10, cx - x);
    dist = Math.min(0.90, Math.max(0.05, (newHalf * 2) / pixPerMeter));
  } else if (dragging === 2) {
    const newHalf = Math.max(10, x - cx);
    dist = Math.min(0.90, Math.max(0.05, (newHalf * 2) / pixPerMeter));
  }

  document.getElementById('rSlider').value = Math.round(dist * 100);
  calculate();
}

function endDrag() { dragging = null; }

// ==========================================
// ANIMATION LOOP
// ==========================================
function animate() {
  drawSim();
  requestAnimationFrame(animate);
}

// ==========================================
// INIT
// ==========================================
calculate();
animate();