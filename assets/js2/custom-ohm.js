// ==========================================
// VARIABEL UTAMA
// ==========================================
let voltage = 4.5;
let resistance = 500;
let animFrame = 0;
let arrowOffset = 0;

const canvas = document.getElementById('circuit');
const ctx = canvas.getContext('2d');

// ==========================================
// KALKULASI
// ==========================================
function calculate() {
  const current_A = voltage / resistance;
  const current_mA = current_A * 1000;

  // Update displays
  document.getElementById('voltageDisplay').textContent = parseFloat(voltage).toFixed(1);
  document.getElementById('resistanceDisplay').textContent = Math.round(resistance);
  document.getElementById('currentDisplay').textContent = current_mA.toFixed(1);
  document.getElementById('currentAmpDisplay').textContent = current_A.toFixed(4);

  // Progress bar (max ~900 mA)
  const barPct = Math.min((current_mA / 900) * 100, 100);
  document.getElementById('currentBar').style.width = barPct + '%';

  // Current description
  const descEl = document.getElementById('currentDesc');
  if (current_mA < 5) descEl.textContent = "Arus sangat kecil";
  else if (current_mA < 50) descEl.textContent = "Arus kecil";
  else if (current_mA < 200) descEl.textContent = "Arus sedang";
  else if (current_mA < 500) descEl.textContent = "Arus besar";
  else descEl.textContent = "Arus sangat besar! ⚠️";

  // Relative size description
  const vNorm = (voltage - 0.1) / 8.9;
  const rNorm = (resistance - 10) / 990;
  const iNorm = current_A / (9/10);
  const relEl = document.getElementById('relativeDesc');
  let desc = "Dalam persamaan: ";
  if (vNorm > 0.6) desc += "V <strong style='color:#3399ff'>besar</strong>";
  else if (vNorm > 0.3) desc += "V <strong style='color:#3399ff'>sedang</strong>";
  else desc += "V <strong style='color:#3399ff'>kecil</strong>";
  desc += " → I ";
  if (iNorm > 0.6) desc += "<strong style='color:#ff4444'>besar</strong>";
  else if (iNorm > 0.3) desc += "<strong style='color:#ff4444'>sedang</strong>";
  else desc += "<strong style='color:#ff4444'>kecil</strong>";
  relEl.innerHTML = desc;

  // Animate formula size
  animateFormula(vNorm, iNorm, rNorm);

  // Redraw circuit
  drawCircuit();
}

// ==========================================
// ANIMASI UKURAN HURUF FORMULA
// ==========================================
function animateFormula(vNorm, iNorm, rNorm) {
  const minSize = 2.5;
  const maxSize = 6;
  const scaleV = minSize + vNorm * (maxSize - minSize);
  const scaleI = minSize + iNorm * (maxSize - minSize);
  const scaleR = minSize + rNorm * (maxSize - minSize);

  document.getElementById('fV').style.fontSize = scaleV + 'rem';
  document.getElementById('fI').style.fontSize = scaleI + 'rem';
  document.getElementById('fR').style.fontSize = scaleR + 'rem';
}

// ==========================================
// GAMBAR RANGKAIAN
// ==========================================
function drawCircuit() {
  const W = canvas.width;
  const H = canvas.height;
  const current_mA = (voltage / resistance) * 1000;
  const arrowCount = Math.max(1, Math.min(8, Math.round(current_mA / 100)));
  const wireColor = '#444';
  const wireGlow = `rgba(${Math.round(100 + (current_mA/900)*155)}, 50, 50, 0.6)`;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = 'rgba(10,15,40,0.8)';
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 12);
  ctx.fill();

  const cx = W / 2;
  const cy = H / 2;
  const wireX1 = 50, wireX2 = W - 50;
  const wireY = cy;
  const topY = cy - 70;
  const botY = cy + 70;

  // === DRAW WIRES ===
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#555';
  ctx.shadowColor = wireGlow;
  ctx.shadowBlur = 8;

  // Top wire
  ctx.beginPath();
  ctx.moveTo(wireX1, topY);
  ctx.lineTo(wireX2, topY);
  ctx.stroke();

  // Bottom wire
  ctx.beginPath();
  ctx.moveTo(wireX1, botY);
  ctx.lineTo(wireX2, botY);
  ctx.stroke();

  // Left wire
  ctx.beginPath();
  ctx.moveTo(wireX1, topY);
  ctx.lineTo(wireX1, botY);
  ctx.stroke();

  // Right wire
  ctx.beginPath();
  ctx.moveTo(wireX2, topY);
  ctx.lineTo(wireX2, botY);
  ctx.stroke();

  ctx.shadowBlur = 0;

  // === BATTERIES (left side) ===
  const batteryX = wireX1 + 20;
  const battCount = Math.max(1, Math.min(6, Math.round(voltage / 1.5)));
  const battW = 16;
  const battH = 38;
  const battStartX = batteryX;
  const battSpacing = 22;

  for (let b = 0; b < battCount; b++) {
    const bx = battStartX + b * battSpacing;
    const by = cy - battH / 2 - 15;

    // Battery body
    const grad = ctx.createLinearGradient(bx, by, bx + battW, by);
    grad.addColorStop(0, '#666');
    grad.addColorStop(0.3, '#bbb');
    grad.addColorStop(1, '#333');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bx, by, battW, battH, 3);
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.stroke();

    // + / - terminals
    ctx.fillStyle = '#ff9900';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('+', bx + 4, by - 4);
    ctx.fillStyle = '#888';
    ctx.fillText('−', bx + 4, by + battH + 13);

    // Voltage stripe
    ctx.fillStyle = 'rgba(255,200,0,0.15)';
    ctx.fillRect(bx + 2, by + 2, battW - 4, 10);
  }

  // Battery label
  ctx.fillStyle = '#aaccff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${voltage.toFixed(1)} V`, batteryX + (battCount * battSpacing) / 2, cy + 50);

  // === RESISTOR (right-center) ===
  const resX = cx + 80;
  const resY = topY;
  const resW = 100;
  const resH = 28;

  // Resistor body
  const rGrad = ctx.createLinearGradient(resX, resY - resH/2, resX, resY + resH/2);
  rGrad.addColorStop(0, '#cc4400');
  rGrad.addColorStop(0.4, '#ffaa00');
  rGrad.addColorStop(1, '#cc4400');
  ctx.fillStyle = rGrad;
  ctx.beginPath();
  ctx.roundRect(resX, resY - resH / 2, resW, resH, 6);
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Resistance bands
  const bandColors = ['#111','#888','#ff4400','#222','#ffcc00'];
  const numBands = Math.min(bandColors.length, Math.round(3 + (resistance / 1000) * 2));
  for (let i = 0; i < numBands; i++) {
    const bx = resX + 14 + i * 14;
    ctx.fillStyle = bandColors[i % bandColors.length];
    ctx.fillRect(bx, resY - resH / 2 + 3, 5, resH - 6);
  }

  // Dots texture
  const dotCount = Math.round(4 + (resistance / 1000) * 20);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  for (let d = 0; d < dotCount; d++) {
    const dx = resX + 8 + Math.random() * (resW - 16);
    const dy = resY - resH / 2 + 4 + Math.random() * (resH - 8);
    ctx.beginPath();
    ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Resistor label
  ctx.fillStyle = '#aaccff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(resistance)} Ω`, resX + resW / 2, topY + 28);

  // === CURRENT ARROWS ===
  const arrowColor = `rgba(255, ${Math.max(0, 180 - current_mA/2)}, 0, 0.9)`;
  ctx.fillStyle = arrowColor;
  ctx.shadowColor = arrowColor;
  ctx.shadowBlur = 12;

  arrowOffset = (arrowOffset + 2 + (current_mA / 200)) % 60;

  // Top wire arrows (left to right)
  for (let a = 0; a < arrowCount; a++) {
    const ax = (wireX1 + 40 + (a * 60) + arrowOffset) % (wireX2 - wireX1 - 60) + wireX1 + 20;
    if (ax < wireX2 - 30) drawArrow(ctx, ax, topY, 14, 10, true);
  }

  // Bottom wire arrows (right to left)
  for (let a = 0; a < arrowCount; a++) {
    const ax = wireX2 - 40 - ((a * 60 + arrowOffset) % (wireX2 - wireX1 - 60));
    if (ax > wireX1 + 30) drawArrow(ctx, ax, botY, 14, 10, false);
  }

  ctx.shadowBlur = 0;

  // === CURRENT READOUT ===
  ctx.fillStyle = 'rgba(255,60,60,0.9)';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`I = ${(current_mA).toFixed(1)} mA`, cx - 20, cy + 8);

  // Legend
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('→ arah arus', wireX1 + 5, topY - 10);
}

function drawArrow(ctx, x, y, len, size, right) {
  const dir = right ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dir * len, y);
  ctx.moveTo(x + dir * len, y);
  ctx.lineTo(x + dir * (len - size), y - size / 2);
  ctx.moveTo(x + dir * len, y);
  ctx.lineTo(x + dir * (len - size), y + size / 2);
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

// ==========================================
// ANIMASI LOOP
// ==========================================
function animate() {
  drawCircuit();
  requestAnimationFrame(animate);
}

// ==========================================
// EVENT LISTENERS
// ==========================================
document.getElementById('voltageSlider').addEventListener('input', function () {
  voltage = parseFloat(this.value);
  calculate();
});

document.getElementById('resistanceSlider').addEventListener('input', function () {
  resistance = parseFloat(this.value);
  calculate();
});

// ==========================================
// RESET
// ==========================================
function resetValues() {
  voltage = 4.5;
  resistance = 500;
  document.getElementById('voltageSlider').value = 4.5;
  document.getElementById('resistanceSlider').value = 500;
  calculate();
}

// ==========================================
// INIT
// ==========================================
calculate();
animate();