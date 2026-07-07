  const g = 9.8;
  let mode = 'pipe';
  let animRunning = false;
  let particles = [];
  let animFrame;

  function setMode(m) {
    mode = m;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    resetSim();

    if (m === 'torricelli') {
      document.getElementById('grp_rho').style.display = 'none';
      document.getElementById('lbl_h1').closest('.control-group').style.display='block';
    } else {
      document.getElementById('grp_rho').style.display = 'block';
    }
    drawPipe();
    updateLabels();
  }

  function updateLabels() {
    document.getElementById('lbl_d1').textContent = (+document.getElementById('d1').value).toFixed(1) + ' cm';
    document.getElementById('lbl_d2').textContent = (+document.getElementById('d2').value).toFixed(1) + ' cm';
    document.getElementById('lbl_h1').textContent = (+document.getElementById('h1').value).toFixed(1) + ' m';
    document.getElementById('lbl_h2').textContent = (+document.getElementById('h2').value).toFixed(1) + ' m';
    document.getElementById('lbl_v1').textContent = (+document.getElementById('v1').value).toFixed(1) + ' m/s';
    document.getElementById('lbl_p1').textContent = (+document.getElementById('p1').value).toFixed(0) + ' kPa';
    document.getElementById('lbl_rho').textContent = (+document.getElementById('rho').value).toFixed(0) + ' kg/m³';
    // v2 from continuity
    const d1 = +document.getElementById('d1').value / 100;
    const d2 = +document.getElementById('d2').value / 100;
    const v1 = +document.getElementById('v1').value;
    const v2 = v1 * (d1 * d1) / (d2 * d2);
    document.getElementById('lbl_v2').textContent = v2.toFixed(2) + ' m/s';
  }

  function syncContinuity() {
    const d1 = +document.getElementById('d1').value / 100;
    const d2 = +document.getElementById('d2').value / 100;
    const v1 = +document.getElementById('v1').value;
    const v2 = v1 * (d1 * d1) / (d2 * d2);
    document.getElementById('v2').value = Math.min(20, v2);
  }

  function getValues() {
    const d1 = +document.getElementById('d1').value / 100;
    const d2 = +document.getElementById('d2').value / 100;
    const h1 = +document.getElementById('h1').value;
    const h2 = +document.getElementById('h2').value;
    const v1 = +document.getElementById('v1').value;
    const P1 = +document.getElementById('p1').value * 1000;
    const rho = +document.getElementById('rho').value;
    const A1 = Math.PI * d1 * d1 / 4;
    const A2 = Math.PI * d2 * d2 / 4;
    const v2 = v1 * A1 / A2;
    const P2 = P1 + 0.5 * rho * v1 * v1 - 0.5 * rho * v2 * v2 + rho * g * (h1 - h2);
    const ek1 = 0.5 * rho * v1 * v1;
    const ek2 = 0.5 * rho * v2 * v2;
    const pe1 = rho * g * h1;
    const pe2 = rho * g * h2;
    const lhs = P1 + ek1 + pe1;
    const rhs = P2 + ek2 + pe2;
    return { d1, d2, h1, h2, v1, v2, P1, P2, rho, ek1, ek2, pe1, pe2, lhs, rhs };
  }

  function runSim() {
    const v = getValues();
    stopAnim();

    document.getElementById('res_p1').textContent = (v.P1 / 1000).toFixed(2);
    document.getElementById('res_p2').textContent = (v.P2 / 1000).toFixed(2);
    document.getElementById('res_v2').textContent = v.v2.toFixed(2);
    document.getElementById('res_ek1').textContent = v.ek1.toFixed(1);
    document.getElementById('res_ek2').textContent = v.ek2.toFixed(1);

    // Verify
    const diff = Math.abs(v.lhs - v.rhs);
    const card = document.getElementById('card_verify');
    if (v.P2 < 0) {
      document.getElementById('res_verify').textContent = '⚠️ P₂ < 0';
      document.getElementById('res_verify_unit').textContent = 'Tekanan negatif (kavitasi)';
      card.className = 'result-card invalid';
    } else {
      document.getElementById('res_verify').textContent = '✓ Valid';
      document.getElementById('res_verify_unit').textContent = 'Δ = ' + diff.toFixed(1) + ' Pa';
      card.className = 'result-card valid';
    }

    // Gauges
    const maxE = Math.max(v.P1, v.P2, v.ek1, v.ek2, v.pe1, v.pe2, 1);
    function pct(x) { return Math.min(100, Math.max(2, (x / maxE) * 100)); }
    document.getElementById('bar_p1').style.height  = pct(v.P1) + '%';
    document.getElementById('bar_p2').style.height  = pct(v.P2 > 0 ? v.P2 : 0) + '%';
    document.getElementById('bar_ek1').style.height = pct(v.ek1) + '%';
    document.getElementById('bar_ek2').style.height = pct(v.ek2) + '%';
    document.getElementById('bar_pe1').style.height = pct(v.pe1) + '%';
    document.getElementById('bar_pe2').style.height = pct(v.pe2) + '%';

    document.getElementById('gval_p1').textContent  = (v.P1 / 1000).toFixed(1) + ' kPa';
    document.getElementById('gval_p2').textContent  = (v.P2 / 1000).toFixed(1) + ' kPa';
    document.getElementById('gval_ek1').textContent = (v.ek1).toFixed(0) + ' Pa';
    document.getElementById('gval_ek2').textContent = (v.ek2).toFixed(0) + ' Pa';
    document.getElementById('gval_pe1').textContent = (v.pe1).toFixed(0) + ' Pa';
    document.getElementById('gval_pe2').textContent = (v.pe2).toFixed(0) + ' Pa';

    // Info
    const faster = v.v2 > v.v1;
    document.getElementById('infoBox').innerHTML = `
      <strong>📊 Analisis:</strong><br/>
      Kecepatan di titik 2 <strong>${faster ? 'lebih cepat' : 'lebih lambat'}</strong> (v₂ = ${v.v2.toFixed(2)} m/s vs v₁ = ${v.v1.toFixed(2)} m/s) karena penampang pipa ${faster ? 'mengecil' : 'membesar'} (persamaan kontinuitas).<br/>
      Tekanan di titik 2: <strong>${(v.P2/1000).toFixed(2)} kPa</strong> — ${v.P2 < v.P1 ? '↓ turun' : '↑ naik'} dari titik 1.<br/>
      Total energi Bernoulli: <strong>${(v.lhs/1000).toFixed(3)} kPa</strong> (titik 1) = <strong>${(v.rhs/1000).toFixed(3)} kPa</strong> (titik 2) — ${diff < 1 ? '✓ Terkonsevasi' : '⚠ Selisih ' + diff.toFixed(1) + ' Pa'}
    `;

    startAnim(v);
    drawPipe(v);
  }

  function resetSim() {
    stopAnim();
    document.getElementById('d1').value = 8;
    document.getElementById('d2').value = 4;
    document.getElementById('h1').value = 0;
    document.getElementById('h2').value = 3;
    document.getElementById('v1').value = 2;
    document.getElementById('p1').value = 200;
    document.getElementById('rho').value = 1000;
    updateLabels();
    ['res_p1','res_p2','res_v2','res_ek1','res_ek2','res_verify'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
    document.getElementById('res_verify_unit').textContent = '—';
    document.getElementById('card_verify').className = 'result-card';
    ['bar_p1','bar_p2','bar_ek1','bar_ek2','bar_pe1','bar_pe2'].forEach(id => {
      document.getElementById(id).style.height = '0%';
    });
    ['gval_p1','gval_p2','gval_ek1','gval_ek2','gval_pe1','gval_pe2'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
    document.getElementById('infoBox').innerHTML = `⚙️ Atur parameter pada panel di atas, lalu klik <strong>▶ Jalankan Simulasi</strong> untuk melihat hasilnya.<br/><br/><strong>Asumsi:</strong> Fluida ideal (tak viskos, tak kompresibel), aliran steady, berlaku persamaan kontinuitas A₁v₁ = A₂v₂.`;
    particles = [];
    drawPipe();
  }

  /* ===== CANVAS DRAWING ===== */
  function drawPipe(vals) {
    const canvas = document.getElementById('pipeCanvas');
    const W = canvas.offsetWidth; canvas.width = W;
    const H = 200;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const d1 = +document.getElementById('d1').value;
    const d2 = +document.getElementById('d2').value;
    const h1 = +document.getElementById('h1').value;
    const h2 = +document.getElementById('h2').value;

    const maxD = 16;
    const r1 = (d1 / maxD) * 55 + 10;
    const r2 = (d2 / maxD) * 55 + 10;

    // Heights (inverted Y)
    const maxH = 10;
    const groundY = H - 20;
    const cy1 = groundY - (h1 / maxH) * (H - 60) - r1;
    const cy2 = groundY - (h2 / maxH) * (H - 60) - r2;

    const x1 = W * 0.12, x2 = W * 0.38;
    const x3 = W * 0.62, x4 = W * 0.88;

    // Ground line
    ctx.strokeStyle = 'rgba(0,188,212,0.2)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0,188,212,0.15)';
    ctx.font = '10px Segoe UI';
    ctx.fillText('Tanah (h=0)', 4, groundY - 3);

    // Pipe body
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(0,120,180,0.7)');
    grad.addColorStop(0.5, 'rgba(0,200,220,0.5)');
    grad.addColorStop(1, 'rgba(0,100,160,0.7)');

    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(0,220,255,0.6)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    // Top wall
    ctx.moveTo(x1, cy1 - r1);
    ctx.lineTo(x2, cy1 - r1);
    ctx.quadraticCurveTo(x2 + (x3 - x2) * 0.5, (cy1 - r1 + cy2 - r2) / 2, x3, cy2 - r2);
    ctx.lineTo(x4, cy2 - r2);
    // Bottom wall
    ctx.lineTo(x4, cy2 + r2);
    ctx.lineTo(x3, cy2 + r2);
    ctx.quadraticCurveTo(x2 + (x3 - x2) * 0.5, (cy1 + r1 + cy2 + r2) / 2, x2, cy1 + r1);
    ctx.lineTo(x1, cy1 + r1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Flow arrows (static if no anim)
    if (!animRunning) {
      drawArrows(ctx, x1, x2, x3, x4, cy1, cy2, r1, r2);
    }

    // Dimension labels
    ctx.fillStyle = '#80deea';
    ctx.font = 'bold 11px Segoe UI';
    ctx.fillText(`d₁=${d1}cm`, x1, cy1 - r1 - 6);
    ctx.fillText(`d₂=${d2}cm`, x4 - 10, cy2 - r2 - 6);

    // Height markers
    ctx.strokeStyle = 'rgba(105,240,174,0.5)';
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    if (h1 > 0) {
      ctx.beginPath();
      ctx.moveTo(x1 - 10, groundY);
      ctx.lineTo(x1 - 10, cy1);
      ctx.stroke();
      ctx.fillStyle = '#69f0ae';
      ctx.font = '10px Segoe UI';
      ctx.fillText(`h₁=${h1}m`, x1 - 32, (groundY + cy1) / 2);
    }
    if (h2 > 0) {
      ctx.beginPath();
      ctx.moveTo(x4 + 10, groundY);
      ctx.lineTo(x4 + 10, cy2);
      ctx.stroke();
      ctx.fillStyle = '#69f0ae';
      ctx.fillText(`h₂=${h2}m`, x4 + 12, (groundY + cy2) / 2);
    }
    ctx.setLineDash([]);

    // Point labels
    if (vals) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Segoe UI';
      ctx.fillText(`P₁=${(vals.P1/1000).toFixed(1)}kPa`, x1, cy1 + r1 + 16);
      ctx.fillText(`v₁=${vals.v1.toFixed(1)}m/s`, x1, cy1 + r1 + 28);
      ctx.fillText(`P₂=${(vals.P2/1000).toFixed(1)}kPa`, x4 - 20, cy2 + r2 + 16);
      ctx.fillText(`v₂=${vals.v2.toFixed(1)}m/s`, x4 - 20, cy2 + r2 + 28);
    }
  }

  function drawArrows(ctx, x1, x2, x3, x4, cy1, cy2, r1, r2) {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    const pts = [
      [x1 + 20, cy1, x2 - 20, cy1],
      [(x2 + x3) / 2, (cy1 + cy2) / 2, (x2 + x3) / 2 + 30, (cy1 + cy2) / 2 + (cy2 - cy1) * 0.5],
      [x3 + 20, cy2, x4 - 20, cy2]
    ];
    pts.forEach(([sx, sy, ex, ey]) => {
      ctx.beginPath();
      ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
      ctx.stroke();
      // arrowhead
      const angle = Math.atan2(ey - sy, ex - sx);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 8 * Math.cos(angle - 0.4), ey - 8 * Math.sin(angle - 0.4));
      ctx.lineTo(ex - 8 * Math.cos(angle + 0.4), ey - 8 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
    });
  }

  /* ===== PARTICLE ANIMATION ===== */
  function startAnim(vals) {
    animRunning = true;
    particles = [];
    const canvas = document.getElementById('pipeCanvas');
    const W = canvas.width;
    for (let i = 0; i < 30; i++) {
      particles.push(createParticle(W, vals, Math.random()));
    }
    animateParticles(vals);
  }

  function stopAnim() {
    animRunning = false;
    if (animFrame) cancelAnimationFrame(animFrame);
  }

  function createParticle(W, vals, progress) {
    return {
      progress: progress,
      offset: (Math.random() - 0.5) * 0.6,
      speed: 0.003 + (vals.v1 / 20) * 0.008,
      color: `hsl(${180 + Math.random() * 40},80%,70%)`
    };
  }

  function animateParticles(vals) {
    const canvas = document.getElementById('pipeCanvas');
    const W = canvas.width, H = 200;
    const ctx = canvas.getContext('2d');

    const d1 = +document.getElementById('d1').value;
    const d2 = +document.getElementById('d2').value;
    const h1 = +document.getElementById('h1').value;
    const h2 = +document.getElementById('h2').value;
    const maxD = 16, maxH = 10;
    const r1 = (d1 / maxD) * 55 + 10;
    const r2 = (d2 / maxD) * 55 + 10;
    const groundY = H - 20;
    const cy1 = groundY - (h1 / maxH) * (H - 60) - r1;
    const cy2 = groundY - (h2 / maxH) * (H - 60) - r2;
    const x1 = W * 0.12, x4 = W * 0.88;

    drawPipe(vals);

    particles.forEach(p => {
      const t = p.progress;
      const x = x1 + (x4 - x1) * t;
      const cy = cy1 + (cy2 - cy1) * t;
      const r  = r1  + (r2  - r1)  * t;
      const y  = cy + p.offset * r;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      // Speed proportional to 1/(r*r) (continuity)
      const rNorm = r1 + (r2 - r1) * t;
      const speedFactor = (r1 * r1) / (rNorm * rNorm);
      p.progress += p.speed * speedFactor;
      if (p.progress > 1) { p.progress = 0; }
    });

    if (animRunning) animFrame = requestAnimationFrame(() => animateParticles(vals));
  }

  // Init
  updateLabels();
  drawPipe();

  window.addEventListener('resize', () => {
    if (animRunning) return;
    drawPipe();
  });