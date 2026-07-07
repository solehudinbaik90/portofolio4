// =============================================
// STATE
// =============================================
let mode = 'single';
let k = 200, x = 0.15;
let k1s = 200, k2s = 300, xs = 0.15;
let k1p = 150, k2p = 200, xp = 0.10;
let animTick = 0;
let draggingMass = false;

const canvas = document.getElementById('sim');
const ctx = canvas.getContext('2d');

// =============================================
// TABS
// =============================================
function switchTab(t) {
  mode = t;
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', ['single','series','parallel'][i] === t);
  });
  ['single','series','parallel'].forEach(id => {
    document.getElementById('tab-' + id).classList.toggle('active', id === t);
  });
  calculate();
}

// =============================================
// CALCULATE
// =============================================
function getKeff() {
  if (mode === 'single') return { keff: k, disp: x };
  if (mode === 'series') {
    const keff = 1 / (1/k1s + 1/k2s);
    return { keff, disp: xs };
  }
  if (mode === 'parallel') {
    const keff = k1p + k2p;
    return { keff, disp: xp };
  }
}

function calculate() {
  const { keff, disp } = getKeff();
  const F = -keff * disp;           // Hooke: F = -kx
  const Fmag = Math.abs(F);
  const Ep = 0.5 * keff * disp * disp;

  // Force display
  const forceEl = document.getElementById('forceVal');
  const unitEl  = document.getElementById('forceUnit');
  if (Fmag >= 100) {
    forceEl.textContent = Fmag.toFixed(1);
    unitEl.textContent = 'Newton (N)';
  } else if (Fmag >= 1) {
    forceEl.textContent = Fmag.toFixed(2);
    unitEl.textContent = 'Newton (N)';
  } else {
    forceEl.textContent = (Fmag * 1000).toFixed(1);
    unitEl.textContent = 'miliNewton (mN)';
  }

  // Nature
  const natureEl = document.getElementById('forceNature');
  const barEl    = document.getElementById('forceBar');
  if (Math.abs(disp) < 0.001) {
    natureEl.className = 'result-nature neutral';
    natureEl.textContent = '⏺ Pegas dalam keadaan natural';
    barEl.style.width = '0%';
  } else if (disp > 0) {
    natureEl.className = 'result-nature stretch';
    natureEl.textContent = '↕ Pegas Diregangkan (Tensile)';
    barEl.className = 'force-bar-fill fill-stretch';
  } else {
    natureEl.className = 'result-nature compress';
    natureEl.textContent = '↔ Pegas Dimampatkan (Compressive)';
    barEl.className = 'force-bar-fill fill-compress';
  }

  // Bar
  const maxF = 500 * 0.40;
  const pct = Math.min(100, (Fmag / maxF) * 100);
  barEl.style.width = pct + '%';
  document.getElementById('maxForceLabel').textContent = maxF.toFixed(0) + ' N';

  // Breakdown
  document.getElementById('bd-k').textContent = keff.toFixed(1) + ' N/m';
  document.getElementById('bd-x').textContent = (disp >= 0 ? '+' : '') + disp.toFixed(3) + ' m';
  document.getElementById('bd-F').textContent = F.toFixed(3) + ' N';
  document.getElementById('bd-Ep').textContent = Ep.toFixed(4) + ' J';

  const keffRow = document.getElementById('bd-keff-row');
  if (mode !== 'single') {
    keffRow.style.display = 'block';
    document.getElementById('bd-keff').textContent = keff.toFixed(2) + ' N/m';
  } else {
    keffRow.style.display = 'none';
  }

  // Energy bars
  const maxEp = 0.5 * 500 * 0.40 * 0.40;
  const maxFb = 500 * 0.40;
  const maxK  = mode === 'parallel' ? 800 : 500;
  document.getElementById('pe-val').textContent = Ep.toFixed(3) + ' J';
  document.getElementById('f-val').textContent  = Fmag.toFixed(2) + ' N';
  document.getElementById('keff-val').textContent = keff.toFixed(1) + ' N/m';
  document.getElementById('pe-bar').style.height   = Math.min(100, (Ep / maxEp) * 100) + '%';
  document.getElementById('f-bar').style.height    = Math.min(100, (Fmag / maxFb) * 100) + '%';
  document.getElementById('keff-bar').style.height = Math.min(100, (keff / maxK) * 100) + '%';

  // Sync slider labels
  document.getElementById('kVal').textContent  = k + ' N/m';
  document.getElementById('xVal').textContent  = (x >= 0 ? '+' : '') + x.toFixed(2) + ' m';
  document.getElementById('k1Val').textContent = k1s + ' N/m';
  document.getElementById('k2Val').textContent = k2s + ' N/m';
  document.getElementById('xSerVal').textContent = '+' + xs.toFixed(2) + ' m';
  document.getElementById('kp1Val').textContent = k1p + ' N/m';
  document.getElementById('kp2Val').textContent = k2p + ' N/m';
  document.getElementById('xParVal').textContent = '+' + xp.toFixed(2) + ' m';
}

// =============================================
// SLIDERS
// =============================================
document.getElementById('kSlider').addEventListener('input', e => { k = +e.target.value; calculate(); });
document.getElementById('xSlider').addEventListener('input', e => { x = +e.target.value / 100; calculate(); });
document.getElementById('k1Slider').addEventListener('input', e => { k1s = +e.target.value; calculate(); });
document.getElementById('k2Slider').addEventListener('input', e => { k2s = +e.target.value; calculate(); });
document.getElementById('xSerSlider').addEventListener('input', e => { xs = +e.target.value / 100; calculate(); });
document.getElementById('kp1Slider').addEventListener('input', e => { k1p = +e.target.value; calculate(); });
document.getElementById('kp2Slider').addEventListener('input', e => { k2p = +e.target.value; calculate(); });
document.getElementById('xParSlider').addEventListener('input', e => { xp = +e.target.value / 100; calculate(); });

// =============================================
// RESET
// =============================================
function resetAll() {
  mode = 'single'; k = 200; x = 0.15;
  k1s = 200; k2s = 300; xs = 0.15;
  k1p = 150; k2p = 200; xp = 0.10;
  document.getElementById('kSlider').value  = 200;
  document.getElementById('xSlider').value  = 15;
  document.getElementById('k1Slider').value = 200;
  document.getElementById('k2Slider').value = 300;
  document.getElementById('xSerSlider').value = 15;
  document.getElementById('kp1Slider').value = 150;
  document.getElementById('kp2Slider').value = 200;
  document.getElementById('xParSlider').value = 10;
  switchTab('single');
}

// =============================================
// CANVAS DRAW
// =============================================
const WALL_X   = 80;
const SPRING_Y_SINGLE = 130;
const COIL_N   = 14;

function drawSpring(ctx, x1, y1, x2, y2, coils, color, stretched) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  const steps = coils * 2;
  const amp = stretched > 0.15 ? Math.max(6, 18 - stretched * 40)
             : stretched < -0.05 ? Math.max(4, 14 - Math.abs(stretched) * 20)
             : 14;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= steps; i++) {
    const t   = i / steps;
    const cx  = x1 + dx * t;
    const cy  = y1 + dy * t;
    // Perpendicular offset
    const offX = -dy/len * amp * (i % 2 === 0 ? 1 : -1);
    const offY =  dx/len * amp * (i % 2 === 0 ? 1 : -1);
    ctx.lineTo(cx + offX, cy + offY);
  }
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function drawMass(ctx, cx, cy, label, color, tick) {
  const size = 32;
  const pulse = Math.sin(tick * 0.06) * 2;

  // Shadow
  ctx.shadowColor = color;
  ctx.shadowBlur = 18 + pulse;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(cx - size, cy - size, size*2, size*2, 8);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.roundRect(cx - size + 4, cy - size + 4, size - 4, size - 6, 6);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy);
  ctx.textBaseline = 'alphabetic';
}

function drawWall(ctx, x, y1, y2) {
  ctx.fillStyle = 'rgba(180,140,60,0.3)';
  ctx.fillRect(x - 14, y1, 14, y2 - y1);
  ctx.strokeStyle = 'rgba(200,160,80,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();

  // Hatching
  ctx.strokeStyle = 'rgba(200,160,80,0.3)';
  ctx.lineWidth = 1;
  for (let y = y1; y < y2; y += 14) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 14, y + 10); ctx.stroke();
  }
}

function drawForceArrow(ctx, x, y, length, color, label) {
  if (Math.abs(length) < 4) return;
  const x2 = x + length;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y); ctx.stroke();
  const dir = length > 0 ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - dir*12, y - 7);
  ctx.lineTo(x2 - dir*12, y + 7);
  ctx.closePath(); ctx.fill();
  ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
  ctx.fillText(label, (x + x2)/2, y - 10);
}

function drawEquilibriumLine(ctx, x, y, h) {
  ctx.strokeStyle = 'rgba(100,255,100,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.moveTo(x, y - h/2); ctx.lineTo(x, y + h/2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '10px Arial'; ctx.fillStyle = 'rgba(100,255,100,0.5)';
  ctx.textAlign = 'left'; ctx.fillText('x = 0', x + 4, y - h/2 + 14);
}

function drawSim() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
  for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

  const { keff, disp } = getKeff();
  const F = -keff * disp;
  const Fmag = Math.abs(F);
  const maxF = 500 * 0.40;
  const arrowLen = (Fmag / maxF) * 80;

  if (mode === 'single') {
    const NATURE_LEN = 280;
    const springEnd  = WALL_X + NATURE_LEN + disp * 400;
    const massX      = springEnd;
    const cy         = SPRING_Y_SINGLE;

    drawWall(ctx, WALL_X, cy - 60, cy + 60);
    drawEquilibriumLine(ctx, WALL_X + NATURE_LEN, cy, 80);

    // Spring color by state
    const springColor = disp > 0.02 ? '#6acef5' : disp < -0.02 ? '#ff6644' : '#aaccff';
    drawSpring(ctx, WALL_X, cy, massX - 32, cy, COIL_N, springColor, disp);

    // Displacement label
    if (Math.abs(disp) > 0.005) {
      const eqX = WALL_X + NATURE_LEN;
      ctx.strokeStyle = 'rgba(255,200,50,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(eqX, cy + 42); ctx.lineTo(massX, cy + 42); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffcc44'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
      ctx.fillText('x = ' + (disp >= 0 ? '+' : '') + disp.toFixed(2) + ' m', (eqX + massX)/2, cy + 56);
      // Tick marks
      ctx.strokeStyle = 'rgba(255,200,50,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(eqX, cy + 36); ctx.lineTo(eqX, cy + 48); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(massX, cy + 36); ctx.lineTo(massX, cy + 48); ctx.stroke();
    }

    drawMass(ctx, massX, cy, 'm', disp > 0.02 ? '#1a7aaa' : disp < -0.02 ? '#aa3311' : '#336688', animTick);

    // Force arrow on mass
    if (Fmag > 0.5) {
      const arDir = F > 0 ? -1 : 1; // F = -kx, so if disp>0, F<0 (leftward)
      drawForceArrow(ctx, massX, cy - 48, arDir * Math.min(arrowLen, 70),
        disp > 0 ? '#6acef5' : '#ff6644',
        'F=' + Fmag.toFixed(1) + 'N');
    }

    // Title
    ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#88ff88'; ctx.textAlign = 'center';
    ctx.fillText('k = ' + k + ' N/m  |  x = ' + (disp>=0?'+':'') + disp.toFixed(2) + ' m  |  F = ' + (-keff*disp).toFixed(2) + ' N', W/2, 22);

  } else if (mode === 'series') {
    // Two springs in series, horizontal
    const keff_s = 1 / (1/k1s + 1/k2s);
    const NATURE = 250;
    const totalLen = NATURE + xs * 350;
    const mid = WALL_X + totalLen / 2;
    const endX = WALL_X + totalLen;
    const cy = SPRING_Y_SINGLE;

    drawWall(ctx, WALL_X, cy - 55, cy + 55);

    const c1 = '#ffd700', c2 = '#ff9966';
    drawSpring(ctx, WALL_X, cy, mid - 10, cy, 8, c1, xs/2);
    drawSpring(ctx, mid + 10, cy, endX - 32, cy, 8, c2, xs/2);

    // Junction
    ctx.beginPath(); ctx.arc(mid, cy, 7, 0, Math.PI*2);
    ctx.fillStyle = '#ccc'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();

    drawMass(ctx, endX, cy, 'm', '#336688', animTick);

    ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700'; ctx.fillText('k₁=' + k1s, (WALL_X + mid)/2, cy - 38);
    ctx.fillStyle = '#ff9966'; ctx.fillText('k₂=' + k2s, (mid + endX)/2, cy - 38);
    ctx.fillStyle = '#88ff88';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('k_eff = ' + keff_s.toFixed(1) + ' N/m  |  F = ' + (keff_s * xs).toFixed(2) + ' N', W/2, 22);

  } else if (mode === 'parallel') {
    // Two springs in parallel, vertical offset
    const keff_p = k1p + k2p;
    const NATURE  = 280;
    const springEnd = WALL_X + NATURE + xp * 350;
    const cy1 = 90, cy2 = 175;

    drawWall(ctx, WALL_X, cy1 - 30, cy2 + 30);

    drawSpring(ctx, WALL_X, cy1, springEnd - 32, cy1, COIL_N - 4, '#ffd700', xp);
    drawSpring(ctx, WALL_X, cy2, springEnd - 32, cy2, COIL_N - 4, '#ff9966', xp);

    // Connector plate
    ctx.fillStyle = 'rgba(120,200,120,0.3)';
    ctx.strokeStyle = 'rgba(120,220,120,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(springEnd - 32, cy1 - 20, 10, cy2 - cy1 + 40, 4); ctx.fill(); ctx.stroke();

    drawMass(ctx, springEnd + 10, (cy1+cy2)/2, 'm', '#336688', animTick);

    ctx.font = 'bold 11px Arial'; ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd700'; ctx.fillText('k₁=' + k1p + ' N/m', WALL_X + 20, cy1 - 14);
    ctx.fillStyle = '#ff9966'; ctx.fillText('k₂=' + k2p + ' N/m', WALL_X + 20, cy2 + 24);
    ctx.fillStyle = '#88ff88'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
    ctx.fillText('k_eff = ' + keff_p + ' N/m  |  F = ' + (keff_p * xp).toFixed(2) + ' N', W/2, 22);
  }

  animTick++;
}

// =============================================
// CANVAS DRAG (single mode, move mass)
// =============================================
function getCanvasX(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  return (clientX - rect.left) * scaleX;
}

canvas.addEventListener('mousedown', e => {
  if (mode !== 'single') return;
  const cx = getCanvasX(e);
  const NATURE = 280;
  const massX = WALL_X + NATURE + x * 400;
  if (Math.abs(cx - massX) < 40) draggingMass = true;
});
canvas.addEventListener('touchstart', e => {
  if (mode !== 'single') return;
  const cx = getCanvasX(e);
  const NATURE = 280;
  const massX = WALL_X + NATURE + x * 400;
  if (Math.abs(cx - massX) < 44) draggingMass = true;
}, { passive: true });

canvas.addEventListener('mousemove', e => {
  if (!draggingMass || mode !== 'single') return;
  const cx = getCanvasX(e);
  const NATURE = 280;
  x = Math.max(-0.40, Math.min(0.40, (cx - WALL_X - NATURE) / 400));
  document.getElementById('xSlider').value = Math.round(x * 100);
  calculate();
});
canvas.addEventListener('touchmove', e => {
  if (!draggingMass || mode !== 'single') return;
  e.preventDefault();
  const cx = getCanvasX(e);
  const NATURE = 280;
  x = Math.max(-0.40, Math.min(0.40, (cx - WALL_X - NATURE) / 400));
  document.getElementById('xSlider').value = Math.round(x * 100);
  calculate();
}, { passive: false });

canvas.addEventListener('mouseup',  () => { draggingMass = false; });
canvas.addEventListener('touchend', () => { draggingMass = false; });

// =============================================
// ANIMATION LOOP
// =============================================
function animate() {
  drawSim();
  requestAnimationFrame(animate);
}

// =============================================
// INIT
// =============================================
if (!ctx.roundRect) {
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

calculate();
animate();