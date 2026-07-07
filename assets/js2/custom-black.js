  // ─── Helpers ───────────────────────────────────────────────
  const get = id => document.getElementById(id);
  const fmt = (n, d=1) => Number(n).toFixed(d);

  // Slider live update
  const sliders = [
    ['m1','m1v'], ['T1','T1v'], ['m2','m2v'], ['T2','T2v']
  ];
  sliders.forEach(([sid, vid]) => {
    get(sid).addEventListener('input', () => {
      get(vid).textContent = get(sid).value;
      drawStatic();
    });
  });
  ['mat1','mat2'].forEach(id => get(id).addEventListener('change', drawStatic));

  // ─── Canvas setup ───────────────────────────────────────────
  const canvas = get('mainCanvas');
  const ctx = canvas.getContext('2d');
  let animId = null;
  let animating = false;

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = 220 * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  window.addEventListener('resize', () => { resizeCanvas(); drawStatic(); });
  resizeCanvas();

  // ─── Draw static scene ──────────────────────────────────────
  function drawScene(progress = 0, Teq = null) {
    const W = canvas.offsetWidth;
    const H = 220;
    ctx.clearRect(0, 0, W, H);

    const m1 = +get('m1').value;
    const T1 = +get('T1').value;
    const m2 = +get('m2').value;
    const T2 = +get('T2').value;

    // Background beaker
    const beakerX = W/2 - 140, beakerW = 280, beakerH = 140, beakerY = 55;

    // Beaker body
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(beakerX, beakerY);
    ctx.lineTo(beakerX, beakerY + beakerH);
    ctx.lineTo(beakerX + beakerW, beakerY + beakerH);
    ctx.lineTo(beakerX + beakerW, beakerY);
    ctx.stroke();

    // Hot object (left)
    const hotW = Math.min(80, 30 + m1 * 0.05);
    const hotH = Math.min(80, 20 + m1 * 0.06);
    const hotX = beakerX + 30;
    const hotY = beakerY + beakerH - hotH - 10;

    // Interpolate hot color toward Teq
    const hotProgress = progress;
    const hotTemp = Teq !== null ? T1 + (Teq - T1) * hotProgress : T1;
    const coldTemp = Teq !== null ? T2 + (Teq - T2) * hotProgress : T2;

    const hotColor = tempToColor(hotTemp, 0, 300);
    const coldColor = tempToColor(coldTemp, 0, 300);

    // Glow effect
    ctx.shadowColor = hotColor;
    ctx.shadowBlur = 15 * (1 - progress * 0.5);
    ctx.fillStyle = hotColor;
    roundRect(ctx, hotX, hotY, hotW, hotH, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Hot label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 Panas', hotX + hotW/2, hotY - 8);
    ctx.fillText(fmt(hotTemp, 1) + '°C', hotX + hotW/2, hotY + hotH/2 + 4);

    // Cold object (right)
    const coldW = Math.min(80, 30 + m2 * 0.05);
    const coldH = Math.min(80, 20 + m2 * 0.06);
    const coldX = beakerX + beakerW - coldW - 30;
    const coldY = beakerY + beakerH - coldH - 10;

    ctx.shadowColor = coldColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = coldColor;
    roundRect(ctx, coldX, coldY, coldW, coldH, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.fillText('❄️ Dingin', coldX + coldW/2, coldY - 8);
    ctx.fillText(fmt(coldTemp, 1) + '°C', coldX + coldW/2, coldY + coldH/2 + 4);

    // Heat flow arrows (animated)
    if (progress > 0 && progress < 1) {
      drawHeatArrows(ctx, hotX + hotW, hotY + hotH/2, coldX, coldY + coldH/2, progress);
    }

    // Equilibrium line
    if (progress >= 1 && Teq !== null) {
      ctx.strokeStyle = '#a8e063';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(beakerX + 10, beakerY + beakerH - 20);
      ctx.lineTo(beakerX + beakerW - 10, beakerY + beakerH - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#a8e063';
      ctx.font = 'bold 11px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText('⚖️ Kesetimbangan: ' + fmt(Teq, 1) + '°C', W/2, beakerY + beakerH - 25);
    }

    // Title
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Kalorimeter (sistem terisolasi)', W/2, beakerY - 8);
  }

  function drawStatic() {
    if (!animating) drawScene(0, null);
  }

  function drawHeatArrows(ctx, x1, y, x2, y2, progress) {
    const cx = (x1 + x2) / 2;
    const arrowCount = 3;
    for (let i = 0; i < arrowCount; i++) {
      const t = ((progress * 2 + i / arrowCount) % 1);
      const ax = x1 + (x2 - x1) * t;
      const ay = y + (y2 - y) * t;
      ctx.fillStyle = `rgba(255, 200, 50, ${0.8 - t * 0.5})`;
      ctx.font = '14px serif';
      ctx.textAlign = 'center';
      ctx.fillText('→', ax, ay + 5);
    }
  }

  function tempToColor(T, minT, maxT) {
    const ratio = Math.max(0, Math.min(1, (T - minT) / (maxT - minT)));
    const r = Math.round(50 + ratio * 205);
    const g = Math.round(130 - ratio * 100);
    const b = Math.round(255 - ratio * 230);
    return `rgb(${r},${g},${b})`;
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

  // ─── Calculate ──────────────────────────────────────────────
  function calculate() {
    const m1 = +get('m1').value / 1000; // kg
    const T1 = +get('T1').value;
    const c1 = +get('mat1').value;
    const m2 = +get('m2').value / 1000;
    const T2 = +get('T2').value;
    const c2 = +get('mat2').value;

    if (T1 <= T2) {
      get('statusBar').textContent = '⚠️ Suhu benda panas harus lebih tinggi dari benda dingin!';
      get('statusBar').style.color = '#ff6b35';
      return null;
    }

    const Teq = (m1 * c1 * T1 + m2 * c2 * T2) / (m1 * c1 + m2 * c2);
    const Q1 = m1 * c1 * (T1 - Teq);
    const Q2 = m2 * c2 * (Teq - T2);
    return { Teq, Q1, Q2, T1, T2 };
  }

  function formatJoule(Q) {
    if (Q >= 1000) return fmt(Q/1000, 2) + ' kJ';
    return fmt(Q, 1) + ' J';
  }

  // ─── Animate ────────────────────────────────────────────────
  function runAnimation(result) {
    if (animId) cancelAnimationFrame(animId);
    animating = true;
    const duration = 2200;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease in-out
      const ease = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;

      drawScene(ease, result.Teq);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        animating = false;
        updateThermometers(result);
        showResults(result);
      }
    }
    animId = requestAnimationFrame(step);
  }

  function updateThermometers(r) {
    const maxT = 300;
    const pct = v => Math.min(100, Math.max(2, (v / maxT) * 100));

    get('th1').style.height = pct(r.T1) + '%';
    get('th1lbl').textContent = fmt(r.T1) + '°C';

    get('th2').style.height = pct(r.T2) + '%';
    get('th2lbl').textContent = fmt(r.T2) + '°C';

    get('theq').style.height = pct(r.Teq) + '%';
    get('theqlbl').textContent = fmt(r.Teq, 2) + '°C';
  }

  function showResults(r) {
    get('resTeq').textContent = fmt(r.Teq, 2) + ' °C';
    get('resQ1').textContent = formatJoule(r.Q1);
    get('resQ2').textContent = formatJoule(r.Q2);
    const diff = Math.abs(r.Q1 - r.Q2);
    const ok = diff < 0.01;
    get('resCheck').textContent = ok ? '✅ Q₁ = Q₂' : '⚠️ ' + fmt(diff,2) + ' J selisih';

    // Narrative explanation
    const mat1name = get('mat1').options[get('mat1').selectedIndex].text.split(' ')[0];
    const mat2name = get('mat2').options[get('mat2').selectedIndex].text.split(' ')[0];
    get('explainBox').innerHTML = `
      <b>📊 Hasil Analisis:</b><br><br>
      🔥 <b>${mat1name}</b> (${get('m1').value} g, ${r.T1}°C) melepas kalor sebesar <b style="color:#ff6b35">${formatJoule(r.Q1)}</b>.<br>
      ❄️ <b>${mat2name}</b> (${get('m2').value} g, ${r.T2}°C) menyerap kalor sebesar <b style="color:#4fc3f7">${formatJoule(r.Q2)}</b>.<br><br>
      Keduanya mencapai suhu kesetimbangan <b style="color:#a8e063">${fmt(r.Teq,2)}°C</b>.<br><br>
      <b>Asas Black terpenuhi:</b> Q<sub>lepas</sub> ≈ Q<sub>terima</sub> ✅ (dalam sistem terisolasi sempurna)
    `;
  }

  // ─── Button handlers ────────────────────────────────────────
  get('btnSimulate').addEventListener('click', () => {
    const result = calculate();
    if (!result) return;
    get('statusBar').textContent = '🔄 Mensimulasikan perpindahan kalor...';
    get('statusBar').style.color = '#ffd200';
    runAnimation(result);
    setTimeout(() => {
      get('statusBar').textContent = '✅ Kesetimbangan termal tercapai!';
      get('statusBar').style.color = '#a8e063';
    }, 2300);
  });

  get('btnReset').addEventListener('click', () => {
    if (animId) cancelAnimationFrame(animId);
    animating = false;
    get('m1').value = 200; get('m1v').textContent = 200;
    get('T1').value = 90;  get('T1v').textContent = 90;
    get('m2').value = 300; get('m2v').textContent = 300;
    get('T2').value = 20;  get('T2v').textContent = 20;
    get('mat1').value = 900;
    get('mat2').value = 4186;
    get('resTeq').textContent = '—';
    get('resQ1').textContent = '—';
    get('resQ2').textContent = '—';
    get('resCheck').textContent = '—';
    get('statusBar').textContent = '⚙️ Atur parameter lalu klik Jalankan Simulasi';
    get('statusBar').style.color = '#a8e063';
    ['th1','th2','theq'].forEach(id => get(id).style.height = '0%');
    ['th1lbl','th2lbl','theqlbl'].forEach(id => get(id).textContent = '—');
    get('explainBox').innerHTML = `<b>📖 Asas Black</b> menyatakan bahwa kalor yang dilepas benda panas <b>sama dengan</b> kalor yang diterima benda dingin, asalkan sistem terisolasi sempurna.<br><br>Gunakan slider untuk mengubah massa, suhu, dan jenis material — lalu amati bagaimana suhu kesetimbangan berubah!`;
    drawStatic();
  });

  // ─── Init ───────────────────────────────────────────────────
  drawStatic();