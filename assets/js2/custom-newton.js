// ═══════════════════════════════════════════════════
//  GLOBALS
// ═══════════════════════════════════════════════════
const canvas = document.getElementById('simCanvas');
const ctx    = canvas.getContext('2d');
let activeTab = 0;
let animId = null;
let running = false;
let simTime = 0;
let trail   = [];
const SCALE = 4; // pixels per meter

// Per-scene state
const state = {
  // Tab 0
  x0: 0, v0: 50, trail0: [],
  // Tab 1
  x1: 0, v1: 0, t1: 0,
  // Tab 2
  x2a: 0, x2b: 0, v2a: 0, v2b: 0
};

// ═══════════════════════════════════════════════════
//  RESIZE
// ═══════════════════════════════════════════════════
function resize() {
  const area = canvas.parentElement;
  canvas.width  = area.clientWidth;
  canvas.height = area.clientHeight - 40; // minus formula bar
  draw();
}
window.addEventListener('resize', resize);

// ═══════════════════════════════════════════════════
//  TAB SWITCHING
// ═══════════════════════════════════════════════════
function switchTab(i) {
  stopSim();
  activeTab = i;
  document.querySelectorAll('.tab').forEach((t,idx) => t.classList.toggle('active', idx===i));
  document.querySelectorAll('.tab-ctrl').forEach((c,idx) => c.style.display = idx===i ? '' : 'none');
  resetSim();
}

// ═══════════════════════════════════════════════════
//  SLIDER HELPER
// ═══════════════════════════════════════════════════
function updateSlider(id, valId, val, unit) {
  document.getElementById(valId).textContent = val + (unit ? ' '+unit : '');
}

// ═══════════════════════════════════════════════════
//  SIMULATION CONTROL
// ═══════════════════════════════════════════════════
function playSim() {
  if (running) {
    stopSim();
  } else {
    running = true;
    document.getElementById('btnPlay').textContent = '⏸ Pause';
    document.getElementById('btnPlay').className   = 'btn btn-pause';
    loop();
  }
}

function stopSim() {
  running = false;
  cancelAnimationFrame(animId);
  document.getElementById('btnPlay').textContent = '▶ Mulai';
  document.getElementById('btnPlay').className   = 'btn btn-play';
}

function resetSim() {
  stopSim();
  simTime = 0;
  state.x0 = 0; state.v0 = +document.getElementById('v0').value; state.trail0 = [];
  state.x1 = 0; state.v1 = 0; state.t1 = 0;
  state.x2a = 0; state.x2b = 0; state.v2a = 0; state.v2b = 0;
  updateReadouts();
  draw();
}

let lastTime = null;
function loop(ts) {
  if (!running) return;
  if (!lastTime) lastTime = ts;
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  simTime += dt;
  step(dt);
  draw();
  updateReadouts();
  animId = requestAnimationFrame(loop);
}

// Fix: pass timestamp to requestAnimationFrame
function playSim() {
  if (running) {
    stopSim();
  } else {
    running = true;
    lastTime = null;
    document.getElementById('btnPlay').textContent = '⏸ Pause';
    document.getElementById('btnPlay').className   = 'btn btn-pause';
    animId = requestAnimationFrame(loop);
  }
}

// ═══════════════════════════════════════════════════
//  PHYSICS STEP
// ═══════════════════════════════════════════════════
function step(dt) {
  if (activeTab === 0) {
    const hasFriction = document.getElementById('showFriction').checked;
    const m = +document.getElementById('m0').value;
    const mu = hasFriction ? 0.3 : 0;
    const g  = 9.8;
    const fr = mu * m * g * Math.sign(state.v0); 
    const a  = -fr / m;
    state.v0 += a * dt;
    if (hasFriction && Math.sign(state.v0) !== Math.sign(state.v0 - a*dt) && state.v0*state.v0 < 0.5) {
      state.v0 = 0;
    }
    state.x0 += state.v0 * dt;
    if (document.getElementById('showTrail').checked) {
      state.trail0.push({x: state.x0, t: simTime});
      if (state.trail0.length > 300) state.trail0.shift();
    }
  }

  if (activeTab === 1) {
    const F  = +document.getElementById('f1').value;
    const m  = +document.getElementById('m1').value;
    const mu = +document.getElementById('mu').value;
    const g  = 9.8;
    let fr = 0;
    if (state.v1 !== 0) fr = mu * m * g * Math.sign(state.v1);
    else if (Math.abs(F) < mu * m * g) fr = F; // static friction
    const Fnet = F - fr;
    const a    = Fnet / m;
    state.v1 += a * dt;
    state.x1 += state.v1 * dt;
    state.t1 += dt;
  }

  if (activeTab === 2) {
    const F  = +document.getElementById('f2').value;
    const ma = +document.getElementById('ma').value;
    const mb = +document.getElementById('mb').value;
    // Two blocks connected — push scenario
    const aTot = F / (ma + mb);
    state.v2a += aTot * dt;
    state.v2b += aTot * dt;
    state.x2a += state.v2a * dt;
    state.x2b += state.v2b * dt;
  }
}

// ═══════════════════════════════════════════════════
//  READOUTS
// ═══════════════════════════════════════════════════
function fmt(n, dec=2) { return isNaN(n) ? '—' : n.toFixed(dec); }

function updateReadouts() {
  if (activeTab === 0) {
    const m = +document.getElementById('m0').value;
    document.getElementById('r0_v').textContent = fmt(state.v0,1);
    document.getElementById('r0_t').textContent = fmt(simTime,1);
    document.getElementById('r0_x').textContent = fmt(state.x0,1);
    document.getElementById('r0_p').textContent = fmt(m * state.v0,1);
    document.getElementById('formulaBar').textContent =
      `p = mv = ${m} × ${fmt(state.v0,1)} = ${fmt(m*state.v0,1)} kg·m/s  |  ΣF = 0 → v = konstan`;
  }
  if (activeTab === 1) {
    const F  = +document.getElementById('f1').value;
    const m  = +document.getElementById('m1').value;
    const mu = +document.getElementById('mu').value;
    const g  = 9.8;
    const fr = mu * m * g;
    const Fnet = F - (state.v1 !== 0 ? fr * Math.sign(state.v1) : Math.min(fr, Math.abs(F)) * Math.sign(F));
    const a    = Fnet / m;
    document.getElementById('r1_a').textContent = fmt(a);
    document.getElementById('r1_v').textContent = fmt(state.v1,1);
    document.getElementById('r1_f').textContent = fmt(F);
    document.getElementById('r1_t').textContent = fmt(state.t1,1);
    document.getElementById('formulaBar').textContent =
      `a = F/m = ${F} / ${m} = ${fmt(a)} m/s²  |  μ=${mu}  →  F_gesek = ${fmt(fr,1)} N`;
  }
  if (activeTab === 2) {
    const F  = +document.getElementById('f2').value;
    const ma = +document.getElementById('ma').value;
    const mb = +document.getElementById('mb').value;
    const a1 = F / (ma + mb);
    const a2 = -F / (ma + mb);
    document.getElementById('r2_a1').textContent = fmt(a1);
    document.getElementById('r2_a2').textContent = fmt(a2);
    document.getElementById('r2_f').textContent  = `${F}`;
    document.getElementById('r2_fr').textContent = `−${F}`;
    document.getElementById('formulaBar').textContent =
      `F_aksi = ${F} N  →  F_reaksi = −${F} N  |  a = F/(m₁+m₂) = ${fmt(a1)} m/s²`;
  }
}

// ═══════════════════════════════════════════════════
//  DRAWING
// ═══════════════════════════════════════════════════
const COLORS = {
  sky:    '#0d1117',
  ground: '#1a2332',
  grid:   'rgba(255,255,255,0.04)',
  obj:    '#63b3ed',
  obj2:   '#fc8181',
  arrow:  '#f6e05e',
  arrow2: '#68d391',
  text:   '#e2e8f0',
  trail:  'rgba(99,179,237,0.3)',
};

function drawGrid() {
  const W = canvas.width, H = canvas.height;
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  const step = 50;
  for (let x = 0; x < W; x += step) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
  }
  for (let y = 0; y < H; y += step) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
  }
}

function drawGround(y) {
  const W = canvas.width;
  ctx.fillStyle = '#2d3748';
  ctx.fillRect(0, y, W, 18);
  // hatching
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W + 20; x += 16) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x-16, y+18); ctx.stroke();
  }
}

function drawArrow(x1,y1,x2,y2,color,label,labelPos='end') {
  const dx = x2-x1, dy = y2-y1;
  const len = Math.sqrt(dx*dx+dy*dy);
  if (len < 2) return;
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  // arrowhead
  const angle = Math.atan2(dy,dx);
  ctx.beginPath();
  ctx.translate(x2,y2);
  ctx.rotate(angle);
  ctx.moveTo(0,0); ctx.lineTo(-12,-5); ctx.lineTo(-12,5); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (label) {
    ctx.fillStyle = color;
    ctx.font = 'bold 12px Segoe UI';
    const lx = labelPos === 'end' ? x2+6 : (x1+x2)/2;
    const ly = labelPos === 'end' ? y2-6 : (y1+y2)/2 - 8;
    ctx.fillText(label, lx, ly);
  }
}

function drawBlock(x, y, w, h, color, label, mass) {
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x+4, y+4, w, h);
  // block
  const grad = ctx.createLinearGradient(x,y,x,y+h);
  grad.addColorStop(0, color);
  grad.addColorStop(1, shadeColor(color, -40));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // label
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(label, x+w/2, y+h/2-4);
  ctx.font = '10px Segoe UI';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(mass+' kg', x+w/2, y+h/2+12);
  ctx.textAlign = 'left';
}

function shadeColor(hex, amt) {
  const c = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (c>>16)+amt));
  const g = Math.max(0, Math.min(255, ((c>>8)&0xff)+amt));
  const b = Math.max(0, Math.min(255, (c&0xff)+amt));
  return `rgb(${r},${g},${b})`;
}

function draw() {
  if (!canvas.width) { resize(); return; }
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = COLORS.sky;
  ctx.fillRect(0,0,W,H);
  drawGrid();

  if (activeTab === 0) drawScene0(W, H);
  if (activeTab === 1) drawScene1(W, H);
  if (activeTab === 2) drawScene2(W, H);
}

// ── SCENE 0: Hukum I ──────────────────────────────
function drawScene0(W, H) {
  const groundY = H - 80;
  drawGround(groundY);

  // axes label
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px Segoe UI';

  // trail
  if (document.getElementById('showTrail').checked && state.trail0.length > 1) {
    ctx.strokeStyle = COLORS.trail;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const originX = 60;
    state.trail0.forEach((pt,i) => {
      const px = originX + pt.x * 2.5;
      if (i === 0) ctx.moveTo(px, groundY - 28);
      else         ctx.lineTo(px, groundY - 28);
    });
    ctx.stroke();
  }

  // block
  const blockW = 60, blockH = 40;
  const originX = 60;
  let bx = originX + state.x0 * 2.5;
  // clamp and wrap
  if (bx > W + blockW) { state.x0 = -(originX + blockW) / 2.5; bx = originX + state.x0*2.5; state.trail0=[]; }
  const by = groundY - blockH;
  drawBlock(bx - blockW/2, by, blockW, blockH, COLORS.obj, '📦', +document.getElementById('m0').value);

  // velocity arrow
  if (document.getElementById('showVel').checked && Math.abs(state.v0) > 0.5) {
    const scale = 1.8;
    drawArrow(bx, by+blockH/2, bx + state.v0*scale, by+blockH/2, COLORS.arrow, `v=${fmt(state.v0,1)} m/s`);
  }

  // friction indicator
  if (document.getElementById('showFriction').checked) {
    ctx.fillStyle = '#fc8181';
    ctx.font = '12px Segoe UI';
    ctx.fillText('⚠ Gesekan μ=0.3', W/2-50, groundY - 60);
    // friction arrow
    if (Math.abs(state.v0) > 0.5) {
      drawArrow(bx, by+blockH/2, bx - 50*Math.sign(state.v0), by+blockH/2, '#fc8181', 'f_gesek');
    }
  }

  // speed indicator dots
  for (let i = 0; i < 8; i++) {
    const r = 4 + Math.abs(state.v0) / 40;
    ctx.beginPath();
    ctx.arc(bx - 90 + i*12, by - 18, r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(99,179,237,${0.15 + (8-i)*0.1})`;
    ctx.fill();
  }
}

// ── SCENE 1: Hukum II ─────────────────────────────
function drawScene1(W, H) {
  const groundY = H - 80;
  drawGround(groundY);

  const F    = +document.getElementById('f1').value;
  const m    = +document.getElementById('m1').value;
  const mu   = +document.getElementById('mu').value;
  const g    = 9.8;
  const fr   = mu * m * g;
  const Fnet = F - fr * Math.sign(state.v1 || F);
  const a    = Fnet / m;

  const blockW = 60, blockH = 40;
  const originX = W / 2;
  const bx = originX + state.x1 * 3;
  const by = groundY - blockH;

  // draw block
  const clampedBx = Math.max(blockW/2+10, Math.min(W-blockW/2-10, bx));
  drawBlock(clampedBx - blockW/2, by, blockW, blockH, COLORS.obj, '🧱', m);

  // Force arrow
  if (document.getElementById('showForceVec').checked && F !== 0) {
    const scale = 1.2;
    drawArrow(clampedBx, by+blockH/2, clampedBx + F*scale, by+blockH/2, COLORS.arrow, `F=${F} N`);
  }

  // Friction arrow
  if (mu > 0 && Math.abs(state.v1) > 0.1) {
    drawArrow(clampedBx, by+blockH/2, clampedBx - fr*1.2*Math.sign(state.v1), by+blockH/2, '#fc8181', `f=${fmt(fr,1)} N`, 'mid');
  }

  // Acceleration arrow
  if (document.getElementById('showAccVec').checked && Math.abs(a) > 0.01) {
    drawArrow(clampedBx, by - 12, clampedBx + a*8, by - 12, COLORS.arrow2, `a=${fmt(a,2)} m/s²`);
  }

  // Mass indicator (size of block visual hint)
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '11px Segoe UI';
  ctx.fillText(`Massa = ${m} kg`, 20, 30);

  // velocity bar
  const barW = 160, barX = W - 200, barY = 30;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.roundRect && ctx.beginPath();
  ctx.fillRect(barX, barY, barW, 14);
  const vFrac = Math.min(1, Math.abs(state.v1) / 30);
  ctx.fillStyle = state.v1 >= 0 ? '#48bb78' : '#fc8181';
  ctx.fillRect(barX, barY, barW * vFrac, 14);
  ctx.fillStyle = '#fff';
  ctx.font = '10px Segoe UI';
  ctx.fillText(`v = ${fmt(state.v1,1)} m/s`, barX, barY - 4);
}

// ── SCENE 2: Hukum III ────────────────────────────
function drawScene2(W, H) {
  const groundY = H - 80;
  drawGround(groundY);

  const F  = +document.getElementById('f2').value;
  const ma = +document.getElementById('ma').value;
  const mb = +document.getElementById('mb').value;

  const blockW = 55, blockH = 45;
  const centerX = W / 2;
  const gap = 4;
  const aTot = F / (ma + mb);

  // positions
  const dispA = state.x2a * 3;
  const dispB = state.x2b * 3;
  const axRight = centerX - gap/2 - blockW + dispA;
  const bxLeft  = centerX + gap/2 + dispB;
  const by = groundY - blockH;

  // Draw A (pushed)
  drawBlock(axRight, by, blockW, blockH, COLORS.obj, 'A', ma);
  // Draw B
  drawBlock(bxLeft,  by, blockW, blockH, COLORS.obj2, 'B', mb);

  // contact highlight
  const contactX = axRight + blockW;
  const gradient = ctx.createLinearGradient(contactX-8, 0, contactX+8, 0);
  gradient.addColorStop(0, 'rgba(246,224,94,0)');
  gradient.addColorStop(0.5, 'rgba(246,224,94,0.6)');
  gradient.addColorStop(1, 'rgba(246,224,94,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(contactX-8, by, 16, blockH);

  // Action arrow (A pushes B)
  const aCenter = axRight + blockW + blockW/2 + gap/2;
  const bCenter = bxLeft + blockW/2;
  drawArrow(contactX, by+blockH/2, contactX + F*0.8, by+blockH/2, COLORS.arrow, `F=${F} N`);
  // Reaction arrow (B pushes A)
  drawArrow(contactX, by+blockH/2 - 14, contactX - F*0.8, by+blockH/2 - 14, COLORS.arrow2, `−F=${F} N`);

  // accelerations
  const accA = aTot;
  const accB = aTot;
  ctx.fillStyle = COLORS.arrow;
  ctx.font = 'bold 11px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(`a = ${fmt(accA,2)} m/s²`, axRight + blockW/2, by - 14);
  ctx.fillStyle = COLORS.arrow2;
  ctx.fillText(`a = ${fmt(accB,2)} m/s²`, bxLeft + blockW/2, by - 14);
  ctx.textAlign = 'left';

  // Legend
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '11px Segoe UI';
  ctx.fillText('🟡 Gaya Aksi', 20, 30);
  ctx.fillStyle = COLORS.arrow2;
  ctx.fillText('🟢 Gaya Reaksi', 20, 46);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('⚡ Kontak', 20, 62);
}

// ═══════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════
window.addEventListener('load', () => {
  resize();
  resetSim();
  updateReadouts();
});