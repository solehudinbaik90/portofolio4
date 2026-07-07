const g = 9.8;

const materials = {
  kayu:      600,
  es:        917,
  aluminium: 2700,
  besi:      7870,
  tembaga:   8960,
  emas:      19320,
  gabus:     120,
};

const fluids = {
  air:     1000,
  airlaut: 1025,
  minyak:  850,
  raksa:   13600,
  alkohol: 789,
};

// Animasi
let animState = { active: false, progress: 0, raf: null };

// ─── HELPERS ────────────────────────────────────────────────────────────────

function getParams() {
  const mass    = parseFloat(document.getElementById('slMass').value);
  const volCm3  = parseFloat(document.getElementById('slVol').value);
  const vol     = volCm3 * 1e-6;                 // m³
  const isFull  = document.getElementById('togFull').checked;
  const subPct  = parseFloat(document.getElementById('slSubVol').value) / 100;
  const vSub    = isFull ? vol : vol * subPct;
  const rhoF    = parseFloat(document.getElementById('slFluidDens').value);
  const rhoObj  = mass / vol;

  const W    = mass * g;
  const Fa   = rhoF * g * vSub;
  const Wapp = W - Fa;
  return { mass, vol, volCm3, vSub, rhoF, rhoObj, W, Fa, Wapp, isFull, subPct };
}

function statusLabel(p) {
  if (p.Wapp < -0.01) return ['🎈 Terapung (Naik)', '#34d399'];
  if (Math.abs(p.Wapp) <= 0.01) return ['⚖️ Melayang (Setimbang)', '#fbbf24'];
  return ['🪨 Tenggelam', '#f87171'];
}

// ─── UPDATE PANEL ───────────────────────────────────────────────────────────

function update() {
  const p = getParams();

  // Label slider
  document.getElementById('lblMass').textContent    = p.mass.toFixed(2) + ' kg';
  document.getElementById('lblVol').textContent     = p.volCm3.toFixed(0) + ' cm³';
  document.getElementById('lblSubVol').textContent  = Math.round(p.subPct * 100) + '%';
  document.getElementById('lblFluidDens').textContent = parseFloat(document.getElementById('slFluidDens').value) + ' kg/m³';

  // Tampil/sembunyikan slider partial
  document.getElementById('partialGroup').style.display =
    document.getElementById('togFull').checked ? 'none' : 'block';

  // Hasil
  document.getElementById('resW').textContent    = p.W.toFixed(2) + ' N';
  document.getElementById('resFa').textContent   = p.Fa.toFixed(2) + ' N';
  document.getElementById('resWapp').textContent = p.Wapp.toFixed(2) + ' N';
  document.getElementById('resDens').textContent = Math.round(p.rhoObj) + ' kg/m³';

  const [label, color] = statusLabel(p);
  const el = document.getElementById('resStatus');
  el.textContent = label;
  el.style.color = color;

  drawScene(p, animState.progress);
}

// ─── MATERIAL / FLUID PRESET ─────────────────────────────────────────────

function onMaterialChange() {
  const v = document.getElementById('selMaterial').value;
  if (v === 'custom') return;
  const rho = materials[v];
  const mass = parseFloat(document.getElementById('slMass').value);
  const vol  = (mass / rho) * 1e6;  // cm³
  const sl   = document.getElementById('slVol');
  sl.value = Math.min(Math.max(vol, 100), 10000);
  update();
}

function onFluidChange() {
  const v = document.getElementById('selFluid').value;
  if (v === 'custom') return;
  document.getElementById('slFluidDens').value = fluids[v];
  update();
}

// ─── CANVAS DRAWING ──────────────────────────────────────────────────────

function drawScene(p, progress) {
  const canvas = document.getElementById('simCanvas');
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // --- Tangki ---
  const tankX = W * 0.2, tankW = W * 0.6;
  const tankTop = H * 0.22, tankH = H * 0.65;
  const tankBottom = tankTop + tankH;

  // Warna fluida berdasarkan jenis
  const rhoF = p.rhoF;
  let fluidColor, fluidAlpha;
  if (rhoF > 10000) { fluidColor = '180,180,200'; fluidAlpha = 0.75; }       // raksa
  else if (rhoF > 900) { fluidColor = '30,130,255'; fluidAlpha = 0.55; }     // air
  else { fluidColor = '255,200,80'; fluidAlpha = 0.45; }                      // minyak/alkohol

  // Gambar tangki
  ctx.save();
  ctx.strokeStyle = 'rgba(125,211,252,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(tankX, tankTop, tankW, tankH);

  // Fluida
  const fluidTop = tankTop + tankH * 0.1;
  ctx.fillStyle = `rgba(${fluidColor},${fluidAlpha})`;
  ctx.fillRect(tankX + 1, fluidTop, tankW - 2, tankBottom - fluidTop - 1);

  // Efek gelombang ringan di permukaan
  ctx.beginPath();
  ctx.strokeStyle = `rgba(${fluidColor},0.9)`;
  ctx.lineWidth = 2;
  for (let xi = 0; xi < tankW; xi++) {
    const y = fluidTop + Math.sin((xi / tankW) * Math.PI * 4 + Date.now() / 600) * 2;
    xi === 0 ? ctx.moveTo(tankX + xi, y) : ctx.lineTo(tankX + xi, y);
  }
  ctx.stroke();

  // Label fluida
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '11px Segoe UI';
  ctx.textAlign = 'left';
  ctx.fillText(`ρ_fluida = ${rhoF} kg/m³`, tankX + 6, tankBottom - 8);
  ctx.restore();

  // --- Posisi benda ---
  // Animasi: 0 = di atas air, 1 = posisi akhir
  const [statusTxt] = statusLabel(p);
  const willFloat = statusTxt.includes('Terapung') || statusTxt.includes('Melayang');

  // Ukuran benda (proporsional volume)
  const bSize = Math.max(24, Math.min(80, 14 + p.volCm3 / 100));

  const startY = tankTop - bSize - 20;

  let finalY;
  if (willFloat) {
    // Mengapung: sebagian di permukaan
    const fracSub = Math.min(p.rhoObj / p.rhoF, 1);
    finalY = fluidTop - bSize * (1 - fracSub);
  } else {
    // Tenggelam: di dasar
    finalY = tankBottom - bSize - 4;
  }

  const objY = startY + (finalY - startY) * progress;
  const objX = W / 2 - bSize / 2;

  // Warna benda berdasarkan material
  const mat = document.getElementById('selMaterial').value;
  let objColor;
  if (mat === 'emas')      objColor = '#fbbf24';
  else if (mat === 'tembaga') objColor = '#c2855e';
  else if (mat === 'besi')    objColor = '#6b7280';
  else if (mat === 'aluminium') objColor = '#9ca3af';
  else if (mat === 'es')    objColor = '#bfdbfe';
  else if (mat === 'kayu')  objColor = '#a16207';
  else if (mat === 'gabus') objColor = '#fef08a';
  else                      objColor = '#60a5fa';

  // Berapa persen tercelup (untuk warna overlap)
  const objBottom = objY + bSize;
  const submergedPx = Math.max(0, objBottom - fluidTop);
  const fracSubPx = Math.min(1, submergedPx / bSize);

  // Gambar benda
  ctx.save();
  // Bagian di atas air
  ctx.fillStyle = objColor;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, objX, objY, bSize, bSize, 6);
  ctx.fill();
  ctx.stroke();

  // Overlay bawah air (sedikit lebih gelap)
  if (fracSubPx > 0) {
    ctx.save();
    ctx.rect(tankX, fluidTop, tankW, tankH);
    ctx.clip();
    ctx.fillStyle = 'rgba(0,80,160,0.3)';
    roundRect(ctx, objX, objY, bSize, bSize, 6);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  // Tanda silang tengah benda
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(objX + bSize/2, objY + 4);
  ctx.lineTo(objX + bSize/2, objY + bSize - 4);
  ctx.moveTo(objX + 4, objY + bSize/2);
  ctx.lineTo(objX + bSize - 4, objY + bSize/2);
  ctx.stroke();
  ctx.restore();

  // --- Panah Gaya (hanya saat tercelup sebagian/penuh) ---
  if (progress > 0.3) {
    const cx = W / 2;
    const midY = objY + bSize / 2;
    const arrowScale = Math.min(1, (progress - 0.3) / 0.5);

    // Gaya berat → bawah (merah)
    drawArrow(ctx, cx, midY, cx, midY + normalizeArrow(p.W) * arrowScale,
              '#f87171', `W=${p.W.toFixed(1)}N`, 'right');

    // Gaya apung → atas (hijau)
    if (fracSubPx > 0) {
      drawArrow(ctx, cx, midY, cx, midY - normalizeArrow(p.Fa) * arrowScale,
                '#34d399', `Fₐ=${p.Fa.toFixed(1)}N`, 'right');
    }
  }

  // --- Info massa jenis benda di kiri benda ---
  if (progress > 0.5) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, objX - 110, objY, 100, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 11px Segoe UI';
    ctx.textAlign = 'right';
    ctx.fillText(`ρ = ${Math.round(p.rhoObj)} kg/m³`, objX - 8, objY + 15);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '10px Segoe UI';
    ctx.fillText(`m = ${p.mass.toFixed(1)} kg`, objX - 8, objY + 31);
    ctx.restore();
  }

  // --- Status badge ---
  const [badge, badgeColor] = statusLabel(p);
  ctx.save();
  ctx.fillStyle = badgeColor + '33';
  roundRect(ctx, W/2 - 90, 10, 180, 28, 8);
  ctx.fill();
  ctx.fillStyle = badgeColor;
  ctx.font = 'bold 13px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(badge, W/2, 28);
  ctx.restore();
}

function normalizeArrow(force) {
  return Math.min(75, Math.max(12, force * 1.5));
}

function drawArrow(ctx, x1, y1, x2, y2, color, label, side) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len < 2) return;
  const ux = dx/len, uy = dy/len;
  const hw = 7, hl = 12;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * hl, y2 - uy * hl);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux*hl - uy*hw, y2 - uy*hl + ux*hw);
  ctx.lineTo(x2 - ux*hl + uy*hw, y2 - uy*hl - ux*hw);
  ctx.closePath();
  ctx.fill();

  // Label gaya
  ctx.shadowBlur = 0;
  ctx.font = 'bold 10px Segoe UI';
  ctx.textAlign = side === 'right' ? 'left' : 'right';
  const lx = x2 + (side === 'right' ? 8 : -8);
  ctx.fillText(label, lx, y2 + 4);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── ANIMASI ─────────────────────────────────────────────────────────────

function animateDrop() {
  if (animState.raf) cancelAnimationFrame(animState.raf);
  animState.progress = 0;
  animState.active = true;

  const duration = 1200;
  const start = performance.now();

  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    // Easing: ease-in-out
    animState.progress = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;

    const p = getParams();
    drawScene(p, animState.progress);

    if (t < 1) {
      animState.raf = requestAnimationFrame(step);
    } else {
      animState.progress = 1;
      animState.active = false;
      // Loop animasi gelombang
      loopWave();
    }
  }

  animState.raf = requestAnimationFrame(step);
}

function loopWave() {
  const p = getParams();
  drawScene(p, 1);
  animState.raf = requestAnimationFrame(loopWave);
}

function resetSim() {
  if (animState.raf) cancelAnimationFrame(animState.raf);
  animState.progress = 0;
  animState.active = false;
  update();
}

// ─── RESIZE CANVAS ───────────────────────────────────────────────────────

function resizeCanvas() {
  const canvas = document.getElementById('simCanvas');
  const wrapper = canvas.parentElement;
  canvas.width  = wrapper.clientWidth;
  canvas.height = Math.max(300, Math.min(460, wrapper.clientWidth * 0.65));
  const p = getParams();
  drawScene(p, animState.progress);
}

window.addEventListener('resize', () => { resizeCanvas(); });

// ─── INIT ─────────────────────────────────────────────────────────────────

window.onload = () => {
  resizeCanvas();
  update();
};