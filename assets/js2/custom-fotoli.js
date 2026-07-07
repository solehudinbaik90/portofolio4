/* ════════════════════════════════
   CONSTANTS & DATA
═══════════════════════════════════ */
const h_eV = 4.136e-15; // eV·s
const h_J  = 6.626e-34; // J·s
const e    = 1.602e-19; // C

const metals = [
  { sym:'Na', name:'Natrium',    phi:2.28 },
  { sym:'K',  name:'Kalium',     phi:2.30 },
  { sym:'Ca', name:'Kalsium',    phi:2.87 },
  { sym:'Al', name:'Aluminium',  phi:4.08 },
  { sym:'Cu', name:'Tembaga',    phi:4.50 },
  { sym:'Pt', name:'Platinum',   phi:5.65 },
];

let selectedMetal = 0;
let simRunning = false;
let animId = null;
let photons  = [];
let electrons = [];
let sparks   = [];
let frameCount = 0;

/* ════════════════════════════════
   METAL GRID
═══════════════════════════════════ */
function buildMetalGrid() {
  const grid = document.getElementById('metalGrid');
  grid.innerHTML = '';
  metals.forEach((m, i) => {
    const btn = document.createElement('div');
    btn.className = 'metal-btn' + (i === selectedMetal ? ' active' : '');
    btn.innerHTML = `
      <div class="symbol">${m.sym}</div>
      <div class="name">${m.name}</div>
      <div class="phi">φ=${m.phi} eV</div>`;
    btn.onclick = () => { selectedMetal = i; buildMetalGrid(); update(); };
    grid.appendChild(btn);
  });
}

/* ════════════════════════════════
   PHYSICS CALC
═══════════════════════════════════ */
function getParams() {
  const nu  = parseFloat(document.getElementById('slFreq').value) * 1e14;
  const I   = parseFloat(document.getElementById('slInt').value);
  const V   = parseFloat(document.getElementById('slVolt').value);
  const phi = metals[selectedMetal].phi;
  const E_photon = h_eV * nu;            // eV
  const Ek = Math.max(0, E_photon - phi);
  const Vs = Ek;                          // stopping voltage
  const emits = E_photon > phi;
  return { nu, I, V, phi, E_photon, Ek, Vs, emits };
}

function update() {
  const p = getParams();

  // Slider display
  const nu14 = p.nu / 1e14;
  document.getElementById('valFreq').textContent =
    nu14.toFixed(1) + ' × 10¹⁴ Hz';
  document.getElementById('valInt').textContent =
    document.getElementById('slInt').value + '%';
  document.getElementById('valVolt').textContent =
    parseFloat(document.getElementById('slVolt').value).toFixed(1) + ' V';

  // Results
  document.getElementById('resE').textContent   = p.E_photon.toFixed(3) + ' eV';
  document.getElementById('resPhi').textContent = p.phi.toFixed(2)     + ' eV';
  document.getElementById('resEk').textContent  = p.Ek > 0 ? p.Ek.toFixed(3) + ' eV' : '0 eV';
  document.getElementById('resVs').textContent  = p.Vs > 0 ? p.Vs.toFixed(3) + ' V'  : '0 V';

  // Status
  const badge = document.getElementById('statusBadge');
  const dot   = badge.querySelector('.status-dot');
  const txt   = document.getElementById('statusText');
  if (p.emits) {
    badge.className = 'status-badge status-emit';
    dot.className   = 'status-dot dot-emit';
    txt.textContent = `✅ Elektron terpancar! Ek = ${p.Ek.toFixed(3)} eV`;
  } else {
    badge.className = 'status-badge status-no';
    dot.className   = 'status-dot dot-no';
    txt.textContent = `❌ Tidak ada emisi (E < φ)`;
  }

  // ctrl info
  document.getElementById('ctrlInfo').textContent =
    `E_foton = ${p.E_photon.toFixed(3)} eV | φ = ${p.phi} eV | Ek = ${p.Ek.toFixed(3)} eV`;
}

/* ════════════════════════════════
   CANVAS SIMULATION
═══════════════════════════════════ */
const canvas = document.getElementById('simCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function freqToColor(nu14) {
  if (nu14 < 5)        return '#ff2200';
  else if (nu14 < 5.5) return '#ff6600';
  else if (nu14 < 6.2) return '#ffaa00';
  else if (nu14 < 6.9) return '#ffff00';
  else if (nu14 < 7.5) return '#88ff00';
  else if (nu14 < 8.3) return '#00ccff';
  else if (nu14 < 9)   return '#0055ff';
  else if (nu14 < 10)  return '#7700ff';
  else                 return '#cc00ff';
}

function spawnPhoton(p) {
  const y = canvas.height * 0.35 + (Math.random() - .5) * canvas.height * 0.22;
  photons.push({
    x: 30,
    y,
    vx: 2.8 + p.I * 0.018,
    vy: (Math.random() - .5) * 0.4,
    color: freqToColor(p.nu / 1e14),
    r: 4,
    life: 1,
    emits: p.emits
  });
}

function spawnElectron(x, y, p) {
  const angle = -Math.PI/2 + (Math.random() - .5) * 1.4;
  const speed = 1.5 + p.Ek * 0.7;
  electrons.push({
    x, y,
    vx: Math.cos(angle) * speed * (1 + p.V * 0.15),
    vy: Math.sin(angle) * speed,
    life: 1,
    trail: []
  });
  // sparks
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2;
    sparks.push({
      x, y,
      vx: Math.cos(a) * (1 + Math.random() * 2),
      vy: Math.sin(a) * (1 + Math.random() * 2),
      life: 1,
      color: `hsl(${40 + Math.random()*30},100%,70%)`
    });
  }
}

function drawScene(p) {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a0e1a');
  bg.addColorStop(1, '#0f1929');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
  }

  // ── METAL PLATE ──
  const plateX = W * 0.52;
  const plateT = 22;
  const plateH = H * 0.62;
  const plateY = (H - plateH) / 2;

  // Metal glow
  if (p.emits) {
    const glowGrad = ctx.createRadialGradient(
      plateX + plateT/2, H/2, 0,
      plateX + plateT/2, H/2, 80
    );
    glowGrad.addColorStop(0, 'rgba(96,165,250,.25)');
    glowGrad.addColorStop(1, 'rgba(96,165,250,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(plateX - 60, plateY - 20, plateT + 80, plateH + 40);
  }

  // Plate body
  const plateGrad = ctx.createLinearGradient(plateX, 0, plateX + plateT, 0);
  plateGrad.addColorStop(0, '#64748b');
  plateGrad.addColorStop(0.4, '#94a3b8');
  plateGrad.addColorStop(1, '#334155');
  ctx.fillStyle = plateGrad;
  ctx.beginPath();
  ctx.roundRect(plateX, plateY, plateT, plateH, 4);
  ctx.fill();

  // Metal label
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.font      = 'bold 13px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(metals[selectedMetal].sym, plateX + plateT/2, plateY - 10);
  ctx.font      = '10px Segoe UI';
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.fillText(`φ=${metals[selectedMetal].phi}eV`, plateX + plateT/2, plateY - 22);

  // ── COLLECTOR PLATE ──
  const colX = W * 0.82;
  const colH = H * 0.45;
  const colY = (H - colH) / 2;
  const colGrad = ctx.createLinearGradient(colX, 0, colX + 12, 0);
  colGrad.addColorStop(0, '#1e3a5f');
  colGrad.addColorStop(1, '#2d5a8e');
  ctx.fillStyle = colGrad;
  ctx.beginPath();
  ctx.roundRect(colX, colY, 12, colH, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  ctx.font = '10px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText('Kolektor', colX + 6, colY - 10);

  // ── LIGHT SOURCE ──
  const srcX = 40, srcY = H/2;
  const srcColor = freqToColor(p.nu/1e14);
  const srcGrad = ctx.createRadialGradient(srcX, srcY, 0, srcX, srcY, 28);
  srcGrad.addColorStop(0, srcColor + 'ff');
  srcGrad.addColorStop(0.5, srcColor + '88');
  srcGrad.addColorStop(1, srcColor + '00');
  ctx.fillStyle = srcGrad;
  ctx.beginPath(); ctx.arc(srcX, srcY, 28, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(srcX, srcY, 10, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.font = 'bold 11px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText('Sumber', srcX, srcY + 26);
  ctx.fillText('Cahaya', srcX, srcY + 38);

  // ── PHOTONS ──
  photons.forEach(ph => {
    ctx.save();
    ctx.globalAlpha = ph.life;
    // trail
    const trail = ctx.createLinearGradient(ph.x - 20, 0, ph.x, 0);
    trail.addColorStop(0, ph.color + '00');
    trail.addColorStop(1, ph.color + 'aa');
    ctx.strokeStyle = trail;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ph.x - 20, ph.y); ctx.lineTo(ph.x, ph.y); ctx.stroke();
    // body
    const pg = ctx.createRadialGradient(ph.x, ph.y, 0, ph.x, ph.y, ph.r * 2.5);
    pg.addColorStop(0, 'white');
    pg.addColorStop(0.3, ph.color);
    pg.addColorStop(1, ph.color + '00');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(ph.x, ph.y, ph.r * 2.5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });

  // ── ELECTRONS ──
  electrons.forEach(el => {
    ctx.save();
    ctx.globalAlpha = el.life;
    // trail
    if (el.trail.length > 1) {
      ctx.strokeStyle = `rgba(96,165,250,${el.life * .5})`;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(el.trail[0].x, el.trail[0].y);
      el.trail.forEach(t => ctx.lineTo(t.x, t.y));
      ctx.stroke();
    }
    // glow
    const eg = ctx.createRadialGradient(el.x, el.y, 0, el.x, el.y, 10);
    eg.addColorStop(0, 'white');
    eg.addColorStop(0.3, '#60a5fa');
    eg.addColorStop(1, '#60a5fa00');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(el.x, el.y, 10, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });

  // ── SPARKS ──
  sparks.forEach(sp => {
    ctx.save();
    ctx.globalAlpha = sp.life * 0.9;
    ctx.fillStyle = sp.color;
    ctx.beginPath(); ctx.arc(sp.x, sp.y, 2.5 * sp.life, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });

  // ── WIRE / CIRCUIT ──
  ctx.strokeStyle = 'rgba(148,163,184,.3)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(plateX + plateT, H * 0.88);
  ctx.lineTo(plateX + plateT + 30, H * 0.88);
  ctx.lineTo(colX + 6, H * 0.88);
  ctx.lineTo(colX + 6, colY + colH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(plateX, H * 0.88);
  ctx.lineTo(srcX, H * 0.88);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── LABELS ──
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.font = '11px Segoe UI';
  ctx.textAlign = 'left';
  ctx.fillText('💡 Foton', 65, H * 0.25);
  if (p.emits) {
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('⚡ Elektron terpancar →', plateX + plateT + 8, H * 0.3);
  } else {
    ctx.fillStyle = '#f87171';
    ctx.fillText('✗ Tidak ada emisi', plateX + plateT + 8, H * 0.3);
  }

  // ── HUD ──
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.beginPath(); ctx.roundRect(12, H-68, 220, 56, 8); ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 11px Consolas';
  ctx.textAlign = 'left';
  ctx.fillText(`ν = ${(p.nu/1e14).toFixed(1)} × 10¹⁴ Hz`, 20, H-50);
  ctx.fillStyle = '#a78bfa';
  ctx.fillText(`E = ${p.E_photon.toFixed(3)} eV  |  φ = ${p.phi} eV`, 20, H-36);
  ctx.fillStyle = p.emits ? '#6ee7b7' : '#f87171';
  ctx.fillText(`Ek_maks = ${p.Ek.toFixed(3)} eV`, 20, H-22);
}

/* ════════════════════════════════
   ANIMATION LOOP
═══════════════════════════════════ */
function animate() {
  const p = getParams();
  frameCount++;

  // Spawn photons
  const spawnRate = Math.max(2, Math.round(12 - p.I * 0.09));
  if (frameCount % spawnRate === 0) spawnPhoton(p);

  const plateX = canvas.width * 0.52;

  // Update photons
  photons.forEach(ph => {
    ph.x += ph.vx;
    ph.y += ph.vy;
    if (ph.x >= plateX - 4 && !ph.hit) {
      ph.hit = true;
      ph.life = 0;
      if (ph.emits) spawnElectron(plateX - 2, ph.y, p);
    }
    if (ph.x > canvas.width + 20) ph.life = -1;
  });
  photons = photons.filter(ph => ph.life > 0 && !ph.hit);

  // Update electrons
  electrons.forEach(el => {
    el.trail.push({ x: el.x, y: el.y });
    if (el.trail.length > 14) el.trail.shift();
    el.x += el.vx;
    el.y += el.vy;
    el.vy += 0.03;
    el.life -= 0.012;
  });
  electrons = electrons.filter(el => el.life > 0 && el.x < canvas.width + 10);

  // Update sparks
  sparks.forEach(sp => {
    sp.x += sp.vx; sp.y += sp.vy;
    sp.vy += 0.06;
    sp.life -= 0.06;
  });
  sparks = sparks.filter(sp => sp.life > 0);

  drawScene(p);
  animId = requestAnimationFrame(animate);
}

/* ════════════════════════════════
   CONTROLS
═══════════════════════════════════ */
function toggleSim() {
  simRunning = !simRunning;
  const btn = document.getElementById('btnPlay');
  if (simRunning) {
    btn.textContent = '⏸ Pause';
    resizeCanvas();
    animate();
  } else {
    btn.textContent = '▶ Jalankan';
    cancelAnimationFrame(animId);
  }
}

function resetSim() {
  cancelAnimationFrame(animId);
  simRunning = false;
  document.getElementById('btnPlay').textContent = '▶ Jalankan';
  photons = []; electrons = []; sparks = []; frameCount = 0;
  document.getElementById('slFreq').value = 7;
  document.getElementById('slInt').value  = 50;
  document.getElementById('slVolt').value = 0;
  selectedMetal = 0;
  buildMetalGrid();
  update();
  resizeCanvas();
  drawScene(getParams());
}

/* ════════════════════════════════
   TABS
═══════════════════════════════════ */
function switchTab(id) {
  document.querySelectorAll('.tab').forEach((t,i) => {
    const ids = ['sim','chart','info'];
    t.classList.toggle('active', ids[i] === id);
  });
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('active', v.id === 'view-' + id);
  });
  if (id === 'chart') { setTimeout(drawAllCharts, 50); }
}

/* ════════════════════════════════
   CHARTS
═══════════════════════════════════ */
function drawAllCharts() {
  drawEkFreqChart();
  drawIIntChart();
  drawEFreqChart();
  drawIVChart();
}

function setupChart(canvasId, title) {
  const c = document.getElementById(canvasId);
  c.width  = c.offsetWidth;
  c.height = c.offsetHeight;
  return { c, cx: c.getContext('2d'), W: c.width, H: c.height };
}

function chartBase(cx, W, H, xLabel, yLabel) {
  cx.fillStyle = '#0a0e1a';
  cx.fillRect(0, 0, W, H);
  const pad = { l:48, r:16, t:16, b:38 };
  // Axes
  cx.strokeStyle = '#334155';
  cx.lineWidth = 1;
  cx.beginPath();
  cx.moveTo(pad.l, pad.t); cx.lineTo(pad.l, H-pad.b);
  cx.lineTo(W-pad.r, H-pad.b); cx.stroke();
  // Labels
  cx.fillStyle = '#64748b';
  cx.font = '10px Segoe UI';
  cx.textAlign = 'center';
  cx.fillText(xLabel, W/2, H-6);
  cx.save(); cx.translate(12, H/2); cx.rotate(-Math.PI/2);
  cx.fillText(yLabel, 0, 0); cx.restore();
  return pad;
}

function drawEkFreqChart() {
  const { c, cx, W, H } = setupChart('chartEkFreq');
  const phi = metals[selectedMetal].phi;
  const pad = chartBase(cx, W, H, 'Frekuensi ν (×10¹⁴ Hz)', 'Ek_maks (eV)');
  const nuMin=4, nuMax=12;
  const EkMax = h_eV * nuMax*1e14 - phi;
  const nu0_14 = phi / (h_eV * 1e14);

  // Region: no emission
  cx.fillStyle = 'rgba(239,68,68,.07)';
  const x0 = pad.l + (nuMin-nuMin)/(nuMax-nuMin)*(W-pad.l-pad.r);
  const x1 = pad.l + (nu0_14-nuMin)/(nuMax-nuMin)*(W-pad.l-pad.r);
  cx.fillRect(pad.l, pad.t, Math.min(x1,W-pad.r)-pad.l, H-pad.t-pad.b);

  // Threshold line
  cx.strokeStyle = '#f87171';
  cx.lineWidth = 1;
  cx.setLineDash([4,4]);
  cx.beginPath(); cx.moveTo(x1, pad.t); cx.lineTo(x1, H-pad.b); cx.stroke();
  cx.setLineDash([]);
  cx.fillStyle = '#f87171';
  cx.font = '9px Segoe UI';
  cx.textAlign = 'center';
  cx.fillText(`ν₀=${nu0_14.toFixed(1)}`, x1, pad.t+10);

  // Ek line
  cx.strokeStyle = '#10b981';
  cx.lineWidth = 2.5;
  cx.beginPath();
  for (let nu14 = nuMin; nu14 <= nuMax; nu14 += 0.05) {
    const Ek = Math.max(0, h_eV * nu14*1e14 - phi);
    const px = pad.l + (nu14-nuMin)/(nuMax-nuMin)*(W-pad.l-pad.r);
    const py = H-pad.b - Ek/EkMax*(H-pad.t-pad.b);
    if (nu14 === nuMin) cx.moveTo(px,py); else cx.lineTo(px,py);
  }
  cx.stroke();

  // Current point
  const p = getParams();
  const curNu14 = p.nu/1e14;
  const curEk   = p.Ek;
  const curX = pad.l + (curNu14-nuMin)/(nuMax-nuMin)*(W-pad.l-pad.r);
  const curY = H-pad.b - Math.min(curEk,EkMax)/EkMax*(H-pad.t-pad.b);
  cx.fillStyle = '#fbbf24';
  cx.beginPath(); cx.arc(curX, curY, 6, 0, Math.PI*2); cx.fill();

  // Tick labels x
  cx.fillStyle = '#64748b'; cx.font='9px Segoe UI'; cx.textAlign='center';
  for (let i=4; i<=12; i+=2) {
    const px = pad.l + (i-nuMin)/(nuMax-nuMin)*(W-pad.l-pad.r);
    cx.fillText(i, px, H-pad.b+12);
  }
}

function drawIIntChart() {
  const { c, cx, W, H } = setupChart('chartIInt');
  const pad = chartBase(cx, W, H, 'Intensitas (%)', 'Arus Relatif');
  const p = getParams();

  if (p.emits) {
    const grad = cx.createLinearGradient(pad.l, 0, W-pad.r, 0);
    grad.addColorStop(0, '#6366f100');
    grad.addColorStop(1, '#6366f133');
    cx.fillStyle = grad;
    cx.fillRect(pad.l, pad.t, W-pad.r-pad.l, H-pad.t-pad.b);

    cx.strokeStyle = '#818cf8';
    cx.lineWidth = 2.5;
    cx.beginPath();
    for (let I=0; I<=100; I++) {
      const px = pad.l + I/100*(W-pad.l-pad.r);
      const py = H-pad.b - I/100*(H-pad.t-pad.b);
      if (I===0) cx.moveTo(px,py); else cx.lineTo(px,py);
    }
    cx.stroke();

    const curX = pad.l + p.I/100*(W-pad.l-pad.r);
    const curY = H-pad.b - p.I/100*(H-pad.t-pad.b);
    cx.fillStyle = '#fbbf24';
    cx.beginPath(); cx.arc(curX, curY, 6, 0, Math.PI*2); cx.fill();
  } else {
    cx.strokeStyle = '#f87171';
    cx.lineWidth = 2;
    cx.beginPath();
    cx.moveTo(pad.l, H-pad.b);
    cx.lineTo(W-pad.r, H-pad.b);
    cx.stroke();
    cx.fillStyle = '#f87171';
    cx.font = '11px Segoe UI';
    cx.textAlign = 'center';
    cx.fillText('Tidak ada emisi — ν < ν₀', W/2, H/2);
  }

  for (let i=0; i<=100; i+=25) {
    const px = pad.l + i/100*(W-pad.l-pad.r);
    cx.fillStyle='#64748b'; cx.font='9px Segoe UI'; cx.textAlign='center';
    cx.fillText(i+'%', px, H-pad.b+12);
  }
}

function drawEFreqChart() {
  const { c, cx, W, H } = setupChart('chartEFreq');
  const pad = chartBase(cx, W, H, 'Frekuensi (×10¹⁴ Hz)', 'Energi Foton (eV)');
  const nuMin=4, nuMax=12;
  const EMax = h_eV * nuMax*1e14;

  cx.strokeStyle = '#fbbf24';
  cx.lineWidth = 2.5;
  cx.beginPath();
  for (let nu14=nuMin; nu14<=nuMax; nu14+=0.1) {
    const E = h_eV * nu14*1e14;
    const px = pad.l + (nu14-nuMin)/(nuMax-nuMin)*(W-pad.l-pad.r);
    const py = H-pad.b - E/EMax*(H-pad.t-pad.b);
    if (nu14===nuMin) cx.moveTo(px,py); else cx.lineTo(px,py);
  }
  cx.stroke();

  const p = getParams();
  const curNu14 = p.nu/1e14;
  const curX = pad.l + (curNu14-nuMin)/(nuMax-nuMin)*(W-pad.l-pad.r);
  const curY = H-pad.b - p.E_photon/EMax*(H-pad.t-pad.b);
  cx.fillStyle = '#f87171';
  cx.beginPath(); cx.arc(curX, curY, 6, 0, Math.PI*2); cx.fill();

  for (let i=4; i<=12; i+=2) {
    const px = pad.l + (i-nuMin)/(nuMax-nuMin)*(W-pad.l-pad.r);
    cx.fillStyle='#64748b'; cx.font='9px Segoe UI'; cx.textAlign='center';
    cx.fillText(i, px, H-pad.b+12);
  }
}

function drawIVChart() {
  const { c, cx, W, H } = setupChart('chartIV');
  const pad = chartBase(cx, W, H, 'Tegangan (V)', 'Arus (rel)');
  const p = getParams();
  const Vs = -p.Vs;
  const Vmin=-3, Vmax=3;

  cx.strokeStyle = '#f59e0b';
  cx.lineWidth = 2.5;
  cx.beginPath();
  for (let V=Vmin; V<=Vmax; V+=0.05) {
    const I = p.emits ? Math.max(0, Math.min(1, (V - Vs)/2)) : 0;
    const px = pad.l + (V-Vmin)/(Vmax-Vmin)*(W-pad.l-pad.r);
    const py = H-pad.b - I*(H-pad.t-pad.b)*0.85;
    if (V===Vmin) cx.moveTo(px,py); else cx.lineTo(px,py);
  }
  cx.stroke();

  if (p.emits) {
    const vsx = pad.l + (Vs-Vmin)/(Vmax-Vmin)*(W-pad.l-pad.r);
    cx.strokeStyle = '#f87171'; cx.lineWidth=1; cx.setLineDash([4,4]);
    cx.beginPath(); cx.moveTo(vsx,pad.t); cx.lineTo(vsx,H-pad.b); cx.stroke();
    cx.setLineDash([]);
    cx.fillStyle='#f87171'; cx.font='9px Segoe UI'; cx.textAlign='center';
    cx.fillText(`-Vs=${Vs.toFixed(2)}V`, vsx, pad.t+10);
  }

  // V=0 line
  const v0x = pad.l + (0-Vmin)/(Vmax-Vmin)*(W-pad.l-pad.r);
  cx.strokeStyle='#334155'; cx.lineWidth=1;
  cx.beginPath(); cx.moveTo(v0x,pad.t); cx.lineTo(v0x,H-pad.b); cx.stroke();

  for (let v=-3; v<=3; v++) {
    const px = pad.l + (v-Vmin)/(Vmax-Vmin)*(W-pad.l-pad.r);
    cx.fillStyle='#64748b'; cx.font='9px Segoe UI'; cx.textAlign='center';
    cx.fillText(v+'V', px, H-pad.b+12);
  }
}

/* ════════════════════════════════
   INIT & EVENTS
═══════════════════════════════════ */
['slFreq','slInt','slVolt'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    update();
    if (document.getElementById('view-chart').classList.contains('active'))
      drawAllCharts();
  });
});

window.addEventListener('resize', () => {
  resizeCanvas();
  if (!simRunning) drawScene(getParams());
  if (document.getElementById('view-chart').classList.contains('active'))
    drawAllCharts();
});

buildMetalGrid();
update();
resizeCanvas();
drawScene(getParams());