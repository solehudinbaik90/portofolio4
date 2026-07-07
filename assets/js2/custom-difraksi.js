// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let mode = 'single';
let animating = false;
let animFrame = null;
let phase = 0;
let opts = { wave: true, labels: true, color: true };

const modeLabels = {
  single:  'Celah Tunggal — Difraksi Fraunhofer',
  double:  'Celah Ganda — Eksperimen Young',
  grating: 'Kisi Difraksi'
};

const modeDesc = {
  single: 'Cahaya melewati celah tunggal. Gelombang Huygens dari setiap titik celah berinterferensi menghasilkan pola terang-gelap di layar.',
  double: 'Dua celah bertindak sebagai dua sumber koheren. Interferensi konstruktif dan destruktif menghasilkan pola garis terang & gelap bergantian.',
  grating: 'Banyak celah sejajar menghasilkan pola difraksi sangat tajam. Digunakan untuk memisahkan panjang gelombang cahaya (spektroskopi).'
};

const modeFormula = {
  single:  { title:'Celah Tunggal', formula:'a·sin θ = mλ', desc:'Minimum ke-m\na = lebar celah\nλ = panjang gelombang' },
  double:  { title:'Celah Ganda',   formula:'d·sin θ = mλ', desc:'Maksimum ke-m\nd = jarak antar celah\nλ = panjang gelombang' },
  grating: { title:'Kisi Difraksi', formula:'d·sin θ = mλ', desc:'Orde terang ke-m\nd = konstanta kisi\nN = jumlah celah' }
};

// ─────────────────────────────────────────────
// Canvas setup
// ─────────────────────────────────────────────
const mainCanvas = document.getElementById('mainCanvas');
const ctx = mainCanvas.getContext('2d');
const screenCanvas = document.getElementById('screenCanvas');
const sctx = screenCanvas.getContext('2d');
const intensityCanvas = document.getElementById('intensityCanvas');
const ictx = intensityCanvas.getContext('2d');

function resizeCanvases() {
  const area = mainCanvas.parentElement;
  mainCanvas.width = area.clientWidth;
  mainCanvas.height = area.clientHeight - screenCanvas.parentElement.offsetHeight - intensityCanvas.offsetHeight - 30;
  screenCanvas.width = area.clientWidth;
  screenCanvas.height = 70;
  intensityCanvas.width = area.clientWidth;
  intensityCanvas.height = 100;
  render();
}

// ─────────────────────────────────────────────
// Wavelength → RGB
// ─────────────────────────────────────────────
function wavelengthToRGB(wl) {
  let r=0, g=0, b=0;
  if (wl >= 380 && wl < 440) { r=(440-wl)/60; g=0; b=1; }
  else if (wl < 490) { r=0; g=(wl-440)/50; b=1; }
  else if (wl < 510) { r=0; g=1; b=(510-wl)/20; }
  else if (wl < 580) { r=(wl-510)/70; g=1; b=0; }
  else if (wl < 645) { r=1; g=(645-wl)/65; b=0; }
  else if (wl <= 750) { r=1; g=0; b=0; }
  const factor = wl<420 ? 0.3+(wl-380)*0.7/40 : wl>700 ? 0.3+(750-wl)*0.7/50 : 1.0;
  return [Math.round(r*255*factor), Math.round(g*255*factor), Math.round(b*255*factor)];
}

function getRGBStr(alpha=1) {
  const wl = +document.getElementById('wavelength').value;
  const [r,g,b] = wavelengthToRGB(wl);
  return `rgba(${r},${g},${b},${alpha})`;
}

function updateWlDot() {
  const wl = +document.getElementById('wavelength').value;
  const [r,g,b] = wavelengthToRGB(wl);
  document.getElementById('wlDot').style.background = `rgb(${r},${g},${b})`;
}

// ─────────────────────────────────────────────
// Intensity functions
// ─────────────────────────────────────────────
function singleSlitI(theta, a, lambda) {
  const beta = Math.PI * a * Math.sin(theta) / lambda;
  if (Math.abs(beta) < 1e-9) return 1;
  return Math.pow(Math.sin(beta)/beta, 2);
}

function doubleSlitI(theta, a, d, lambda) {
  const beta = Math.PI * a * Math.sin(theta) / lambda;
  const delta = Math.PI * d * Math.sin(theta) / lambda;
  const env = Math.abs(beta) < 1e-9 ? 1 : Math.pow(Math.sin(beta)/beta, 2);
  return env * Math.pow(Math.cos(delta), 2);
}

function gratingI(theta, a, d, N, lambda) {
  const beta = Math.PI * a * Math.sin(theta) / lambda;
  const delta = Math.PI * d * Math.sin(theta) / lambda;
  const env = Math.abs(beta) < 1e-9 ? 1 : Math.pow(Math.sin(beta)/beta, 2);
  const sinD = Math.sin(delta);
  const sinND = Math.sin(N * delta);
  const multi = Math.abs(sinD) < 1e-9 ? N*N : Math.pow(sinND/sinD, 2);
  return env * multi / (N*N);
}

function getIntensity(theta) {
  const wl = +document.getElementById('wavelength').value * 1e-9;
  const a  = +document.getElementById('slitWidth').value * 1e-6;
  const d  = +document.getElementById('slitSep').value * 1e-6;
  const N  = +document.getElementById('numSlits').value;
  if (mode === 'single')  return singleSlitI(theta, a, wl);
  if (mode === 'double')  return doubleSlitI(theta, a, d, wl);
  if (mode === 'grating') return gratingI(theta, a, d, N, wl);
  return 0;
}

// ─────────────────────────────────────────────
// MAIN RENDER
// ─────────────────────────────────────────────
function render() {
  drawMain();
  drawScreen();
  drawIntensity();
  updateResults();
}

function drawMain() {
  const W = mainCanvas.width, H = mainCanvas.height;
  ctx.clearRect(0, 0, W, H);

  // background gradient
  const bg = ctx.createLinearGradient(0, 0, W, 0);
  bg.addColorStop(0, '#05050f');
  bg.addColorStop(1, '#08081a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const barrierX = W * 0.38;
  const screenX  = W * 0.92;
  const centerY  = H / 2;

  // === Draw waves propagating ===
  if (opts.wave) {
    drawPropagatingWaves(ctx, W, H, barrierX, screenX, centerY);
  }

  // === Barrier ===
  drawBarrier(ctx, W, H, barrierX, centerY);

  // === Screen ===
  drawScreenLine(ctx, W, H, screenX, centerY);

  // === Labels ===
  if (opts.labels) {
    drawSceneLabels(ctx, W, H, barrierX, screenX, centerY);
  }
}

function drawPropagatingWaves(ctx, W, H, barrierX, screenX, centerY) {
  const wl   = +document.getElementById('wavelength').value;
  const amp  = +document.getElementById('amplitude').value;
  const a    = +document.getElementById('slitWidth').value * 1e-6;
  const d    = +document.getElementById('slitSep').value * 1e-6;
  const N    = +document.getElementById('numSlits').value;
  const [r,g,b] = wavelengthToRGB(wl);

  // Incident plane wave (left of barrier)
  const pixPerNm = 0.15;
  const waveSpacing = wl * pixPerNm;

  ctx.save();
  for (let x = 20; x < barrierX - 5; x += waveSpacing) {
    const xp = x + (phase * waveSpacing / (2*Math.PI)) % waveSpacing;
    const alpha = 0.15 + 0.1 * amp;
    ctx.beginPath();
    ctx.moveTo(xp, 10);
    ctx.lineTo(xp, H - 10);
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();

  // Huygens wavelets from slits
  const slitPositions = getSlitCenters(centerY);

  const maxR = screenX - barrierX;
  const numArcs = 10;

  ctx.save();
  // clip to right half
  ctx.beginPath();
  ctx.rect(barrierX, 0, W - barrierX, H);
  ctx.clip();

  slitPositions.forEach(sy => {
    for (let i = 0; i < numArcs; i++) {
      const frac = (i / numArcs + phase / (2*Math.PI)) % 1;
      const radius = frac * maxR;
      const alpha = (1 - frac) * 0.35 * amp;
      ctx.beginPath();
      ctx.arc(barrierX, sy, radius, -Math.PI/2, Math.PI/2);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  });
  ctx.restore();

  // Interference pattern beams
  drawInterferenceBeams(ctx, W, H, barrierX, screenX, centerY, r, g, b, amp);
}

function getSlitCenters(centerY) {
  const a  = +document.getElementById('slitWidth').value;
  const d  = +document.getElementById('slitSep').value;
  const N  = +document.getElementById('numSlits').value;

  if (mode === 'single') return [centerY];

  if (mode === 'double') return [centerY - d*6, centerY + d*6];

  // grating
  const positions = [];
  const totalSpan = (N-1) * d * 6;
  for (let i = 0; i < N; i++) {
    positions.push(centerY - totalSpan/2 + i * d * 6);
  }
  return positions;
}

function drawInterferenceBeams(ctx, W, H, barrierX, screenX, centerY, r, g, b, amp) {
  const wl  = +document.getElementById('wavelength').value * 1e-9;
  const d   = +document.getElementById('slitSep').value * 1e-6;
  const N   = +document.getElementById('numSlits').value;
  const L   = screenX - barrierX;

  // Draw bright order beams
  const maxOrders = mode === 'grating' ? 4 : 2;
  for (let m = -maxOrders; m <= maxOrders; m++) {
    let sinT;
    if (mode === 'single') {
      if (m === 0) sinT = 0;
      else continue;
    } else {
      sinT = m * wl / d;
    }
    if (Math.abs(sinT) > 0.85) continue;
    const tanT = sinT / Math.sqrt(1 - sinT*sinT);
    const yScreen = centerY + tanT * L;
    if (yScreen < 0 || yScreen > H) continue;

    const I = Math.abs(getIntensity(Math.asin(sinT)));
    const beamAlpha = I * 0.12 * amp;
    if (beamAlpha < 0.01) continue;

    const grad = ctx.createLinearGradient(barrierX, centerY, screenX, yScreen);
    grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},${beamAlpha})`);

    ctx.beginPath();
    ctx.moveTo(barrierX, centerY - 3);
    ctx.lineTo(barrierX, centerY + 3);
    ctx.lineTo(screenX, yScreen + 4);
    ctx.lineTo(screenX, yScreen - 4);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

function drawBarrier(ctx, W, H, barrierX, centerY) {
  const slitW = +document.getElementById('slitWidth').value;
  const slitPx = slitW * 8;
  const positions = getSlitCenters(centerY);

  ctx.fillStyle = '#1a1a55';
  ctx.strokeStyle = '#4455cc';
  ctx.lineWidth = 1;

  // Draw barrier as two halves between slits
  const sortedPos = [...positions].sort((a,b)=>a-b);

  let regions = [];
  // before first slit
  regions.push([0, sortedPos[0] - slitPx/2]);
  // between slits
  for (let i = 0; i < sortedPos.length - 1; i++) {
    regions.push([sortedPos[i] + slitPx/2, sortedPos[i+1] - slitPx/2]);
  }
  // after last slit
  regions.push([sortedPos[sortedPos.length-1] + slitPx/2, H]);

  regions.forEach(([y1, y2]) => {
    if (y2 > y1) {
      ctx.fillRect(barrierX - 4, y1, 8, y2-y1);
      ctx.strokeRect(barrierX - 4, y1, 8, y2-y1);
    }
  });

  // Draw slit openings (bright edges)
  positions.forEach(sy => {
    ctx.strokeStyle = 'rgba(100,150,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(barrierX - 6, sy - slitPx/2);
    ctx.lineTo(barrierX + 6, sy - slitPx/2);
    ctx.moveTo(barrierX - 6, sy + slitPx/2);
    ctx.lineTo(barrierX + 6, sy + slitPx/2);
    ctx.stroke();
  });
}

function drawScreenLine(ctx, W, H, screenX) {
  const grad = ctx.createLinearGradient(screenX-2, 0, screenX+2, 0);
  grad.addColorStop(0, 'rgba(200,220,255,0)');
  grad.addColorStop(0.5, 'rgba(200,220,255,0.4)');
  grad.addColorStop(1, 'rgba(200,220,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(screenX-2, 0, 4, H);
}

function drawSceneLabels(ctx, W, H, barrierX, screenX, centerY) {
  ctx.font = '11px Segoe UI';
  ctx.fillStyle = 'rgba(120,140,220,0.7)';
  ctx.textAlign = 'center';

  // Label "Sumber"
  ctx.fillText('Sumber', 30, centerY);
  ctx.fillText('Cahaya', 30, centerY + 14);

  // Label "Celah"
  ctx.fillText('Celah', barrierX, H - 16);

  // Label "Layar"
  ctx.fillText('Layar', screenX, H - 16);

  // Distance arrow
  const dist = +document.getElementById('screenDist').value;
  ctx.fillStyle = 'rgba(100,120,180,0.5)';
  ctx.fillText(`L = ${dist.toFixed(1)} m`, (barrierX + screenX)/2, H - 8);

  // Orde labels
  if (mode !== 'single') {
    const wl = +document.getElementById('wavelength').value * 1e-9;
    const d  = +document.getElementById('slitSep').value * 1e-6;
    const L  = screenX - barrierX;

    for (let m = -3; m <= 3; m++) {
      const sinT = m * wl / d;
      if (Math.abs(sinT) > 0.8) continue;
      const tanT = sinT / Math.sqrt(1 - sinT*sinT);
      const yS = centerY + tanT * L;
      if (yS < 20 || yS > H - 20) continue;

      ctx.fillStyle = 'rgba(255,220,100,0.6)';
      ctx.textAlign = 'right';
      ctx.font = '10px Segoe UI';
      ctx.fillText(`m=${m}`, screenX - 5, yS + 4);
    }
    ctx.textAlign = 'center';
  }
}

// ─────────────────────────────────────────────
// SCREEN (bright fringe display)
// ─────────────────────────────────────────────
function drawScreen() {
  const W = screenCanvas.width, H = screenCanvas.height;
  sctx.clearRect(0, 0, W, H);
  sctx.fillStyle = '#02020a';
  sctx.fillRect(0, 0, W, H);

  const amp  = +document.getElementById('amplitude').value;
  const wl   = +document.getElementById('wavelength').value;
  const [r,g,b] = wavelengthToRGB(wl);
  const useColor = opts.color;

  const nPoints = W;
  const thetaMax = Math.PI * 0.48;

  // draw pixel by pixel
  const imgData = sctx.createImageData(W, H);

  for (let px = 0; px < W; px++) {
    const theta = (px / W - 0.5) * 2 * thetaMax;
    const I = getIntensity(theta) * amp;
    const brightness = Math.min(1, I);
    const cr = useColor ? r : 255;
    const cg = useColor ? g : 255;
    const cb = useColor ? b : 255;
    for (let py = 0; py < H; py++) {
      const idx = (py * W + px) * 4;
      imgData.data[idx]   = cr * brightness;
      imgData.data[idx+1] = cg * brightness;
      imgData.data[idx+2] = cb * brightness;
      imgData.data[idx+3] = 255;
    }
  }
  sctx.putImageData(imgData, 0, 0);

  // center mark
  sctx.strokeStyle = 'rgba(255,255,255,0.15)';
  sctx.lineWidth = 1;
  sctx.setLineDash([3,3]);
  sctx.beginPath();
  sctx.moveTo(W/2, 0);
  sctx.lineTo(W/2, H);
  sctx.stroke();
  sctx.setLineDash([]);
}

// ─────────────────────────────────────────────
// INTENSITY GRAPH
// ─────────────────────────────────────────────
function drawIntensity() {
  const W = intensityCanvas.width, H = intensityCanvas.height;
  ictx.clearRect(0, 0, W, H);
  ictx.fillStyle = '#04040e';
  ictx.fillRect(0, 0, W, H);

  // grid
  ictx.strokeStyle = 'rgba(50,60,120,0.4)';
  ictx.lineWidth = 1;
  for (let y = 0; y <= H; y += H/4) {
    ictx.beginPath();
    ictx.moveTo(0, y);
    ictx.lineTo(W, y);
    ictx.stroke();
  }

  const amp   = +document.getElementById('amplitude').value;
  const wl    = +document.getElementById('wavelength').value;
  const [r,g,b] = wavelengthToRGB(wl);
  const thetaMax = Math.PI * 0.48;

  // filled area
  ictx.beginPath();
  ictx.moveTo(0, H);
  for (let px = 0; px <= W; px++) {
    const theta = (px / W - 0.5) * 2 * thetaMax;
    const I = Math.min(1, getIntensity(theta) * amp);
    ictx.lineTo(px, H - I * (H - 8));
  }
  ictx.lineTo(W, H);
  ictx.closePath();
  ictx.fillStyle = `rgba(${r},${g},${b},0.18)`;
  ictx.fill();

  // line
  ictx.beginPath();
  for (let px = 0; px <= W; px++) {
    const theta = (px / W - 0.5) * 2 * thetaMax;
    const I = Math.min(1, getIntensity(theta) * amp);
    const y = H - I * (H - 8);
    px === 0 ? ictx.moveTo(px, y) : ictx.lineTo(px, y);
  }
  ictx.strokeStyle = `rgb(${r},${g},${b})`;
  ictx.lineWidth = 2;
  ictx.stroke();

  // axis labels
  ictx.fillStyle = 'rgba(100,120,180,0.6)';
  ictx.font = '10px Segoe UI';
  ictx.textAlign = 'left';
  ictx.fillText('I', 4, 14);
  ictx.textAlign = 'center';
  ictx.fillText('0°', W/2, H - 2);
  ictx.fillText('-θ', 20, H - 2);
  ictx.fillText('+θ', W - 20, H - 2);
}

// ─────────────────────────────────────────────
// RESULTS UPDATE
// ─────────────────────────────────────────────
function updateResults() {
  const wl = +document.getElementById('wavelength').value;
  const a  = +document.getElementById('slitWidth').value;
  const d  = +document.getElementById('slitSep').value;
  const L  = +document.getElementById('screenDist').value;
  const N  = +document.getElementById('numSlits').value;

  document.getElementById('res-lambda').textContent = wl + ' nm';

  let theta1Deg = '—', fringeStr = '—', resolStr = '—';

  if (mode === 'single') {
    const sinT = (wl*1e-9) / (a*1e-6);
    if (sinT <= 1) {
      theta1Deg = (Math.asin(sinT) * 180 / Math.PI).toFixed(1) + '°';
      const fringe = 2 * L * (wl*1e-9) / (a*1e-6) * 1000;
      fringeStr = fringe.toFixed(1) + ' mm';
    }
  } else if (mode === 'double') {
    const sinT = (wl*1e-9) / (d*1e-6);
    if (sinT <= 1) {
      theta1Deg = (Math.asin(sinT) * 180 / Math.PI).toFixed(1) + '°';
      const fringe = L * (wl*1e-9) / (d*1e-6) * 1000;
      fringeStr = fringe.toFixed(1) + ' mm';
    }
  } else {
    const sinT = (wl*1e-9) / (d*1e-6);
    if (sinT <= 1) {
      theta1Deg = (Math.asin(sinT) * 180 / Math.PI).toFixed(1) + '°';
      resolStr = 'N×m = ' + N;
    }
  }

  document.getElementById('res-theta1').textContent = theta1Deg;
  document.getElementById('res-fringe').textContent = fringeStr;
  document.getElementById('res-resolusi').textContent = resolStr;
}

// ─────────────────────────────────────────────
// UI ACTIONS
// ─────────────────────────────────────────────
function setMode(m) {
  mode = m;
  document.querySelectorAll('.mode-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.mode === m);
  });

  document.getElementById('canvasLabel').textContent = modeLabels[m];
  document.getElementById('modeDesc').textContent = modeDesc[m];

  const f = modeFormula[m];
  document.getElementById('formulaBox').innerHTML = `
    <div class="formula-title">${f.title}</div>
    <div class="formula">${f.formula}</div>
    <div style="font-size:0.75rem;color:#8899bb;margin-top:6px;white-space:pre-line">${f.desc}</div>
  `;

  // show/hide sep & N controls
  document.getElementById('sepControl').style.display = m === 'single' ? 'none' : '';
  document.getElementById('numSlitsControl').style.display = m === 'grating' ? '' : 'none';

  render();
}

function updateAll() {
  document.getElementById('wlVal').innerHTML =
    document.getElementById('wavelength').value + ' nm <span class="wl-indicator" id="wlDot"></span>';
  updateWlDot();
  document.getElementById('ampVal').textContent =
    (+document.getElementById('amplitude').value).toFixed(1);
  document.getElementById('slitWVal').textContent =
    (+document.getElementById('slitWidth').value).toFixed(1) + ' μm';
  document.getElementById('slitSepVal').textContent =
    (+document.getElementById('slitSep').value).toFixed(1) + ' μm';
  document.getElementById('numSlitsVal').textContent =
    document.getElementById('numSlits').value;
  document.getElementById('distVal').textContent =
    (+document.getElementById('screenDist').value).toFixed(1) + ' m';
  render();
}

function toggleOption(key) {
  opts[key] = !opts[key];
  document.getElementById('toggle' + key.charAt(0).toUpperCase() + key.slice(1))
    .classList.toggle('on', opts[key]);
  render();
}

function animate() {
  if (animating) return;
  animating = true;
  function loop() {
    phase += 0.06;
    if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
    drawMain();
    animFrame = requestAnimationFrame(loop);
  }
  loop();
}

function stopAnimation() {
  animating = false;
  if (animFrame) cancelAnimationFrame(animFrame);
  animFrame = null;
}

function resetAll() {
  stopAnimation();
  phase = 0;
  document.getElementById('wavelength').value = 550;
  document.getElementById('amplitude').value = 1.0;
  document.getElementById('slitWidth').value = 2.0;
  document.getElementById('slitSep').value = 4.0;
  document.getElementById('numSlits').value = 5;
  document.getElementById('screenDist').value = 1.0;
  setMode('single');
  updateAll();
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
window.addEventListener('resize', resizeCanvases);
resizeCanvases();
updateWlDot();
setMode('single');
updateAll();