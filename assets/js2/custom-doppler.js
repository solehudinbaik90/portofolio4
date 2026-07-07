// ============================================
// CONSTANTS & STATE
// ============================================
const canvas  = document.getElementById('dopplerCanvas');
const ctx     = canvas.getContext('2d');
const wCanvas = document.getElementById('waveCanvas');
const wCtx    = wCanvas.getContext('2d');

let W, H;
let running   = false;
let animId    = null;
let simTime   = 0;
let dt        = 1/60;
let scenario  = 'free';

// Source state
let srcX, srcY, srcVX, srcVY;
// Observer state
let obsX, obsY;

// Wave fronts: {x, y, radius, born}
let waves = [];
let waveTimer = 0;

// Scenario-specific
let scenarioData = {};

// ============================================
// INIT
// ============================================
function resizeCanvas() {
  const wrap = canvas.parentElement;
  W = wrap.clientWidth;
  H = 420;
  canvas.width  = W;
  canvas.height = H;
}

function getParams() {
  return {
    f0:     +document.getElementById('sl-f0').value,
    vs:     +document.getElementById('sl-vs').value,
    vo:     +document.getElementById('sl-vo').value,
    vsound: +document.getElementById('sl-vsound').value,
    obsMove: document.getElementById('chkObsMove').checked,
    showWaves: document.getElementById('chkShowWaves').checked,
    showMach:  document.getElementById('chkShowMach').checked,
  };
}

function setScenario(s) {
  scenario = s;
  running  = false;
  cancelAnimationFrame(animId);
  document.getElementById('btnPlay').textContent = '▶ Mulai';

  document.querySelectorAll('.scene-btn').forEach((b,i) => {
    b.classList.toggle('active', ['free','approach','recede','pass','sonic','obsMove'][i] === s);
  });

  const titles = {
    free:    '🚗 Mode Bebas — Atur semua parameter sesukamu',
    approach:'➡️ Sumber Mendekat — Amati kenaikan frekuensi',
    recede:  '⬅️ Sumber Menjauh — Amati penurunan frekuensi',
    pass:    '↔️ Sumber Melintas — Dengar perubahan saat melintas',
    sonic:   '💥 Sonic Boom — Kecepatan melebihi suara (Mach > 1)',
    obsMove: '🚶 Pengamat Bergerak — Pengamat mendekati/menjauhi sumber',
  };
  document.getElementById('sceneTitle').textContent = titles[s];

  const infos = {
    free:   '💡 <strong>Mode Bebas:</strong> Atur parameter sesuai kebutuhanmu. Amati bagaimana muka gelombang berubah bentuk saat sumber bergerak.',
    approach:'💡 <strong>Mendekat:</strong> Sumber bergerak ke arah pengamat. Muka gelombang di depan <strong>termampatkan</strong> → λ lebih kecil → <strong>f′ > f₀</strong> (nada lebih tinggi).',
    recede: '💡 <strong>Menjauh:</strong> Sumber bergerak menjauhi pengamat. Muka gelombang di belakang <strong>merenggang</strong> → λ lebih besar → <strong>f′ < f₀</strong> (nada lebih rendah).',
    pass:   '💡 <strong>Melintas:</strong> Saat sumber mendekat f′ tinggi, saat tepat melewati f′ = f₀, setelah melewati f′ rendah. Inilah suara ambulans yang lewat!',
    sonic:  '💡 <strong>Sonic Boom:</strong> Ketika Mach ≥ 1, sumber melampaui kecepatan suara. Semua muka gelombang bertumpuk membentuk <strong>kerucut Mach</strong> → gelombang kejut (sonic boom).',
    obsMove:'💡 <strong>Pengamat Bergerak:</strong> Pengamat mendekati sumber → f′ naik. Pengamat menjauhi → f′ turun. Rumus: f′ = f₀ × (v ± v_obs) / v',
  };
  document.getElementById('infoBox').innerHTML = infos[s];

  // Preset parameters for each scenario
  const presets = {
    free:    { vs: 80,  vo: 0,   f0: 440,  vsound: 340 },
    approach:{ vs: 100, vo: 0,   f0: 440,  vsound: 340 },
    recede:  { vs: 100, vo: 0,   f0: 440,  vsound: 340 },
    pass:    { vs: 120, vo: 0,   f0: 440,  vsound: 340 },
    sonic:   { vs: 400, vo: 0,   f0: 440,  vsound: 340 },
    obsMove: { vs: 0,   vo: 60,  f0: 440,  vsound: 340 },
  };
  const p = presets[s];
  document.getElementById('sl-vs').value = p.vs;
  document.getElementById('sl-vo').value = p.vo;
  document.getElementById('sl-f0').value = p.f0;
  document.getElementById('sl-vsound').value = p.vsound;
  document.getElementById('chkObsMove').checked = (s === 'obsMove');

  resetSim();
}

function initPositions() {
  resizeCanvas();
  const p = getParams();

  if (scenario === 'approach') {
    srcX = -80; srcY = H/2;
    srcVX = p.vs; srcVY = 0;
    obsX  = W * 0.80; obsY = H/2;
  } else if (scenario === 'recede') {
    srcX = W + 80; srcY = H/2;
    srcVX = -p.vs; srcVY = 0;
    obsX  = W * 0.20; obsY = H/2;
  } else if (scenario === 'pass') {
    srcX = -60; srcY = H/2;
    srcVX = p.vs; srcVY = 0;
    obsX  = W * 0.5; obsY = H/2 + 90;
  } else if (scenario === 'sonic') {
    srcX = -80; srcY = H/2;
    srcVX = p.vs; srcVY = 0;
    obsX  = W * 0.80; obsY = H/2;
  } else if (scenario === 'obsMove') {
    srcX = W/2; srcY = H/2;
    srcVX = 0; srcVY = 0;
    obsX  = W * 0.85; obsY = H/2;
  } else {
    // free
    srcX = W * 0.15; srcY = H/2;
    srcVX = p.vs; srcVY = 0;
    obsX  = W * 0.80; obsY = H/2;
  }

  waves = [];
  waveTimer = 0;
  simTime = 0;
}

function resetSim() {
  running = false;
  cancelAnimationFrame(animId);
  document.getElementById('btnPlay').textContent = '▶ Mulai';
  initPositions();
  updateUI();
  drawFrame();
}

// ============================================
// PHYSICS
// ============================================
function physicsStep() {
  const p = getParams();

  // Source movement
  srcX += srcVX * dt;
  srcY += srcVY * dt;

  // Observer movement
  if (p.obsMove || scenario === 'obsMove') {
    if (document.getElementById('chkObsMove').checked) {
      // Observer moves toward source
      const dx = srcX - obsX;
      const dist = Math.abs(dx);
      if (dist > 20) {
        obsX += (dx > 0 ? 1 : -1) * p.vo * dt;
      }
    }
  }

  // Wrap source (continuous)
  if (srcX > W + 200) { srcX = -200; waves = []; }
  if (srcX < -200)    { srcX = W + 200; waves = []; }

  // Emit wavefronts
  const T0 = 1 / p.f0;
  waveTimer += dt;
  while (waveTimer >= T0) {
    waves.push({ x: srcX, y: srcY, r: 0, born: simTime });
    waveTimer -= T0;
    if (waves.length > 200) waves.shift();
  }

  // Expand waves
  waves.forEach(w => {
    w.r += p.vsound * dt;
  });

  // Cull old waves
  waves = waves.filter(w => w.r < Math.max(W, H) * 1.5);

  simTime += dt;
}

// ============================================
// DOPPLER CALCULATIONS
// ============================================
function calcDoppler() {
  const p = getParams();
  const { f0, vsound } = p;

  // Direction: positive = source moves toward fixed right observer
  const signSrc = srcVX > 0 ? 1 : -1; // +1 moving right

  // vs_effective: component toward observer (right observer)
  // f' = f0 * (v + vo) / (v - vs) for approach
  const vs = Math.abs(srcVX);
  const vo = p.obsMove ? p.vo : 0;

  // front (source approaching)
  const fFront = vsound > vs
    ? f0 * (vsound + vo) / (vsound - vs)
    : Infinity;

  // back (source receding)
  const fBack = f0 * (vsound - vo) / (vsound + vs);

  // lambda front & back
  const lambdaFront = vsound > vs
    ? (vsound - vs) / f0
    : 0;
  const lambdaBack  = (vsound + vs) / f0;

  // Mach
  const mach = vsound > 0 ? vs / vsound : 0;

  // Observed frequency based on relative position
  const dxObs = obsX - srcX;
  let fObs;
  if (vsound <= vs) {
    fObs = Infinity; // sonic boom
  } else {
    const voSign = (dxObs > 0) ? 1 : -1;  // observer side
    const srcSign = (srcVX * dxObs < 0) ? -1 : 1; // approaching or receding
    // standard Doppler
    const voComp = (document.getElementById('chkObsMove').checked)
      ? p.vo * (dxObs < 0 ? 1 : -1) // obs moving toward src
      : 0;
    fObs = f0 * (vsound + voComp) / (vsound - srcVX * (dxObs > 0 ? 1 : -1));
    if (fObs < 0) fObs = Math.abs(fObs);
  }

  return { fFront, fBack, lambdaFront, lambdaBack, mach, fObs };
}

// ============================================
// UPDATE UI
// ============================================
function updateUI() {
  const p = getParams();
  const { fFront, fBack, lambdaFront, lambdaBack, mach, fObs } = calcDoppler();

  document.getElementById('lbl-f0').textContent     = p.f0 + ' Hz';
  document.getElementById('lbl-vs').textContent     = p.vs + ' m/s';
  document.getElementById('lbl-vo').textContent     = p.vo + ' m/s';
  document.getElementById('lbl-vsound').textContent = p.vsound + ' m/s';

  const fmt  = v => isFinite(v) ? v.toFixed(1) : '∞';
  const fmtL = v => v > 0 ? v.toFixed(3) : '—';

  document.getElementById('fd-f0').textContent   = p.f0 + ' Hz';
  document.getElementById('fd-fp').textContent   = isFinite(fObs) ? fObs.toFixed(1) + ' Hz' : '∞ (Boom!)';
  document.getElementById('fd-mach').textContent = mach.toFixed(3);

  document.getElementById('obs-lfront').textContent = fmtL(lambdaFront) + ' m';
  document.getElementById('obs-lback').textContent  = fmtL(lambdaBack)  + ' m';
  document.getElementById('obs-ffront').textContent = fmt(fFront) + ' Hz';
  document.getElementById('obs-fback').textContent  = fmt(fBack)  + ' Hz';

  // Doppler badge
  const badge = document.getElementById('dopplerBadge');
  if (mach >= 1) {
    badge.className = 'doppler-effect-bar effect-sonic';
    badge.textContent = '💥 SONIC BOOM — Mach ' + mach.toFixed(2) + ' (Melebihi kecepatan suara!)';
    document.getElementById('canvasWrap').classList.add('sonic-active');
  } else {
    document.getElementById('canvasWrap').classList.remove('sonic-active');
    const dxObs = obsX - srcX;
    const approaching = srcVX * dxObs > 0;
    if (!running && simTime === 0) {
      badge.className = 'doppler-effect-bar effect-neutral';
      badge.textContent = '⚙️ Jalankan simulasi untuk melihat efek';
    } else if (approaching) {
      const ratio = (fObs / p.f0 - 1) * 100;
      badge.className = 'doppler-effect-bar effect-approach';
      badge.textContent = '🔴 Sumber MENDEKAT — f′ = ' + fObs.toFixed(1) + ' Hz (+' + ratio.toFixed(1) + '%)';
    } else {
      const ratio = (1 - fObs / p.f0) * 100;
      badge.className = 'doppler-effect-bar effect-recede';
      badge.textContent = '🔵 Sumber MENJAUH — f′ = ' + fObs.toFixed(1) + ' Hz (−' + ratio.toFixed(1) + '%)';
    }
  }

  drawWaveViz(fObs, p.f0);
}

// ============================================
// WAVE VISUALIZER (bottom panel)
// ============================================
let wavePhase = 0;
function drawWaveViz(fObs, f0) {
  const W2 = wCanvas.width;
  const H2 = wCanvas.height;
  wCtx.clearRect(0, 0, W2, H2);

  wavePhase += dt * (isFinite(fObs) ? fObs : f0) * 0.5;

  const drawSineWave = (freq, color, yOff, label) => {
    wCtx.beginPath();
    wCtx.strokeStyle = color;
    wCtx.lineWidth = 2;
    for (let x = 0; x < W2; x++) {
      const y = yOff + 12 * Math.sin((x / W2) * freq * 0.5 + wavePhase);
      x === 0 ? wCtx.moveTo(x, y) : wCtx.lineTo(x, y);
    }
    wCtx.stroke();
    wCtx.fillStyle = color;
    wCtx.font = '9px Arial';
    wCtx.textAlign = 'left';
    wCtx.fillText(label, 4, yOff - 16);
  };

  drawSineWave(f0, 'rgba(100,180,255,0.6)', H2 * 0.35, 'f₀ = ' + f0 + ' Hz');
  drawSineWave(isFinite(fObs) ? fObs : f0, 'rgba(255,160,50,0.85)', H2 * 0.72, "f' = " + (isFinite(fObs) ? fObs.toFixed(1) : '∞') + ' Hz');
}

// ============================================
// DRAW MAIN CANVAS
// ============================================
function drawFrame() {
  resizeCanvas();
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = 'radial-gradient(ellipse at 50% 50%, #071525, #020810)';
  const bg = ctx.createRadialGradient(W/2, H/2, 10, W/2, H/2, Math.max(W,H)*0.7);
  bg.addColorStop(0, '#071828');
  bg.addColorStop(1, '#010810');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 50) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += 50) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  // Ground line (subtle)
  ctx.strokeStyle = 'rgba(100,150,100,0.15)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();
  ctx.setLineDash([]);

  const p = getParams();
  const { mach } = calcDoppler();
  const isSonic = mach >= 1;

  // ---- DRAW WAVE FRONTS ----
  if (p.showWaves) {
    waves.forEach((w, i) => {
      if (w.r <= 0) return;
      const age = simTime - w.born;
      const alpha = Math.max(0, 0.55 - age * 0.12);

      // Color: front waves = warm (orange/red), back = cool (blue)
      const dxAtBirth = W * 0.5 - w.x; // relative to center
      const isFrontWave = srcVX > 0
        ? w.x >= srcX - w.r * 0.3
        : w.x <= srcX + w.r * 0.3;

      let r, g, b;
      if (isSonic) {
        r = 255; g = 220; b = 50;
      } else if (srcVX > 0) {
        // Front: compressed = orange-red
        r = 255; g = 140; b = 60;
        // Back: expanded = blue
      } else {
        r = 80; g = 160; b = 255;
      }

      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth = isSonic ? 1.5 : 1.2;
      ctx.stroke();
    });

    // Front (compressed) waves in red, back (expanded) in blue — for moving source
    if (srcVX !== 0 && waves.length > 0 && !isSonic) {
      waves.forEach(w => {
        if (w.r <= 0) return;
        const age = simTime - w.born;
        const alpha = Math.max(0, 0.65 - age * 0.14);
        // Arc toward direction of motion = compressed
        const angleDir = Math.atan2(srcVY, srcVX || 0.001);
        // Front half
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, angleDir - Math.PI/2, angleDir + Math.PI/2);
        ctx.strokeStyle = `rgba(255,100,60,${alpha * 0.8})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        // Back half
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, angleDir + Math.PI/2, angleDir - Math.PI/2);
        ctx.strokeStyle = `rgba(60,120,255,${alpha * 0.8})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });
    }
  }

  // ---- MACH CONE ----
  if (isSonic && p.showMach && waves.length > 0) {
    const sinTheta = p.vsound / Math.abs(srcVX);
    const theta = Math.asin(Math.min(1, sinTheta));
    const coneLen = Math.max(W, H);
    const dirSign = srcVX > 0 ? 1 : -1;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(srcX, srcY);
    ctx.lineTo(srcX - dirSign * coneLen * Math.cos(theta),
               srcY - coneLen * Math.sin(theta));
    ctx.moveTo(srcX, srcY);
    ctx.lineTo(srcX - dirSign * coneLen * Math.cos(theta),
               srcY + coneLen * Math.sin(theta));
    ctx.strokeStyle = 'rgba(255,220,50,0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Fill cone
    ctx.beginPath();
    ctx.moveTo(srcX, srcY);
    ctx.lineTo(srcX - dirSign * coneLen * Math.cos(theta),
               srcY - coneLen * Math.sin(theta));
    ctx.lineTo(srcX - dirSign * coneLen * Math.cos(theta),
               srcY + coneLen * Math.sin(theta));
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,200,0,0.04)';
    ctx.fill();
    ctx.restore();

    // Mach angle label
    ctx.fillStyle = 'rgba(255,220,50,0.8)';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('θ = arcsin(1/M) = ' + (theta * 180/Math.PI).toFixed(1) + '°',
      srcX - dirSign * 80, srcY - 40);
  }

  // ---- SOURCE (moving vehicle) ----
  const isMoving = Math.abs(srcVX) > 0 || Math.abs(srcVY) > 0;
  drawSource(srcX, srcY, srcVX, isSonic);

  // ---- OBSERVER ----
  drawObserver(obsX, obsY);

  // ---- DISTANCE LINE ----
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.moveTo(srcX, srcY); ctx.lineTo(obsX, obsY); ctx.stroke();
  ctx.setLineDash([]);

  const dist = Math.sqrt((obsX - srcX)**2 + (obsY - srcY)**2);
  const midX = (srcX + obsX) / 2;
  const midY = (srcY + obsY) / 2 - 14;
  ctx.fillStyle = 'rgba(180,200,255,0.55)';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('d = ' + (dist / (W / 80)).toFixed(1) + ' m', midX, midY);

  // ---- LABELS ----
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,160,80,0.9)';
  ctx.fillText('v_s = ' + p.vs + ' m/s', srcX, srcY - 36);
  ctx.fillStyle = 'rgba(100,220,100,0.9)';
  ctx.fillText('Pengamat', obsX, obsY + 42);

  // Frequency annotations at observer
  const { fObs } = calcDoppler();
  const fpColor = fObs > p.f0 ? '#ff8844' : fObs < p.f0 ? '#8899ff' : '#88ff88';
  ctx.fillStyle = fpColor;
  ctx.font = 'bold 13px Arial';
  ctx.fillText("f' = " + (isFinite(fObs) ? fObs.toFixed(1) : '∞') + ' Hz', obsX, obsY - 42);

  // Time display
  ctx.fillStyle = 'rgba(150,180,220,0.5)';
  ctx.font = '11px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('t = ' + simTime.toFixed(2) + ' s', 12, 20);
  ctx.fillText('v_sound = ' + p.vsound + ' m/s', 12, 36);
  if (isSonic) {
    ctx.fillStyle = 'rgba(255,220,50,0.9)';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('⚡ MACH ' + calcDoppler().mach.toFixed(2), 12, 56);
  }
}

function drawSource(x, y, vx, isSonic) {
  const glowColor = isSonic ? '#ffdd00' : '#00aaff';
  const bodyColor = isSonic ? '#cc8800' : '#1166cc';

  // Glow
  ctx.shadowColor = glowColor;
  ctx.shadowBlur  = 24;

  // Body (car/plane shape)
  ctx.save();
  ctx.translate(x, y);
  if (vx < 0) ctx.scale(-1, 1);

  // Car body
  ctx.fillStyle = isSonic ? '#cc9900' : '#1a77dd';
  ctx.beginPath();
  ctx.roundRect(-24, -12, 48, 20, 6);
  ctx.fill();

  // Car roof
  ctx.fillStyle = isSonic ? '#ffcc00' : '#2a99ff';
  ctx.beginPath();
  ctx.roundRect(-14, -22, 28, 14, 5);
  ctx.fill();

  // Wheels
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-14, 10, 6, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, 10, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.arc(-14, 10, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, 10, 3, 0, Math.PI*2); ctx.fill();

  // Speaker/horn
  ctx.fillStyle = '#ffaa00';
  ctx.beginPath(); ctx.arc(22, -4, 4, 0, Math.PI*2); ctx.fill();

  ctx.restore();
  ctx.shadowBlur = 0;

  // Pulse ring on source
  const pRadius = 16 + 12 * Math.abs(Math.sin(simTime * 8));
  ctx.beginPath();
  ctx.arc(x, y, pRadius, 0, Math.PI*2);
  ctx.strokeStyle = `rgba(${isSonic ? '255,220,50' : '0,180,255'},${0.3 - pRadius * 0.006})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawObserver(x, y) {
  ctx.shadowColor = '#44ff88';
  ctx.shadowBlur  = 16;

  // Body
  ctx.fillStyle = '#226633';
  ctx.beginPath();
  ctx.roundRect(x - 12, y - 26, 24, 30, 5);
  ctx.fill();

  // Head
  ctx.fillStyle = '#ffddaa';
  ctx.beginPath();
  ctx.arc(x, y - 34, 11, 0, Math.PI*2);
  ctx.fill();

  // Ear (receiver symbol)
  ctx.fillStyle = '#ffaa44';
  ctx.beginPath();
  ctx.arc(x + 11, y - 34, 5, -Math.PI/2, Math.PI/2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Sound waves received (animated)
  const { fObs } = calcDoppler();
  const freq = isFinite(fObs) ? Math.min(fObs, 2000) : 1000;
  for (let i = 1; i <= 3; i++) {
    const phase = (simTime * freq * 0.003 + i * 0.3) % 1;
    const r = 18 + phase * 22;
    const alpha = 0.5 * (1 - phase);
    ctx.beginPath();
    ctx.arc(x, y - 34, r, -Math.PI * 0.7, Math.PI * 0.7);
    ctx.strokeStyle = `rgba(100,255,150,${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// ============================================
// ANIMATION LOOP
// ============================================
function loop() {
  physicsStep();
  updateUI();
  drawFrame();
  if (running) animId = requestAnimationFrame(loop);
}

function togglePlay() {
  if (running) {
    running = false;
    cancelAnimationFrame(animId);
    document.getElementById('btnPlay').textContent = '▶ Lanjut';
  } else {
    running = true;
    document.getElementById('btnPlay').textContent = '⏸ Pause';
    loop();
  }
}

// ============================================
// SLIDER EVENTS
// ============================================
['sl-f0','sl-vs','sl-vo','sl-vsound'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    if (!running) {
      initPositions();
      drawFrame();
    }
    updateUI();

    // Update source velocity if in free mode & not running
    if (!running) {
      const p = getParams();
      if (scenario === 'approach') { srcVX = p.vs; }
      else if (scenario === 'recede') { srcVX = -p.vs; }
      else if (scenario === 'pass' || scenario === 'free') { srcVX = p.vs; }
      else if (scenario === 'sonic') { srcVX = p.vs; }
    }
  });
});

['chkObsMove','chkShowWaves','chkShowMach'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    updateUI(); drawFrame();
  });
});

// ============================================
// ROUNDRECT POLYFILL
// ============================================
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

// ============================================
// INIT
// ============================================
setScenario('free');