// ===============================================================
//  UTILITIES
// ===============================================================
function $(id){ return document.getElementById(id); }

function showTab(name){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  $('tab-'+name).classList.add('active');
  event.target.classList.add('active');
  if(name==='mistar')  drawMistar();
  if(name==='jangka')  drawJangka();
  if(name==='mikro')   drawMikro();
}

function resizeCanvas(canvas){
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, w: rect.width, h: rect.height };
}

// ===============================================================
//  MISTAR
// ===============================================================
let mistarQuizVal = 12.0;

function drawMistarOnCanvas(canvasId, measureVal, showObject=true){
  const canvas = $(canvasId);
  const { ctx, w, h } = resizeCanvas(canvas);

  ctx.clearRect(0,0,w,h);
  const maxCm = 30;
  const rulerX = 20, rulerW = w - 40;
  const rulerY = 40, rulerH = 36;
  const pxPerCm = rulerW / maxCm;

  // Ruler body
  const grad = ctx.createLinearGradient(rulerX, rulerY, rulerX, rulerY+rulerH);
  grad.addColorStop(0,'#f5e6a3');
  grad.addColorStop(1,'#c8a84b');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(rulerX, rulerY, rulerW, rulerH, 4);
  ctx.fill();
  ctx.strokeStyle = '#8b6914';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Ticks & labels
  ctx.fillStyle = '#1a1a00';
  ctx.font = '9px Arial';
  ctx.textAlign = 'center';
  for(let mm=0; mm<=maxCm*10; mm++){
    const x = rulerX + (mm/10)*pxPerCm;
    let tickH;
    if(mm % 10 === 0)      tickH = 14;
    else if(mm % 5 === 0)  tickH = 10;
    else                   tickH = 6;
    ctx.beginPath();
    ctx.moveTo(x, rulerY);
    ctx.lineTo(x, rulerY + tickH);
    ctx.strokeStyle = '#4a3500';
    ctx.lineWidth = mm%10===0 ? 1.2 : 0.7;
    ctx.stroke();
    if(mm % 10 === 0 && mm > 0){
      ctx.fillText(mm/10, x, rulerY + rulerH - 4);
    }
  }

  if(!showObject){ return; }

  // Object
  const objX = rulerX;
  const objW = measureVal * pxPerCm;
  const objY = rulerY + rulerH + 10;
  const objH = 20;

  const og = ctx.createLinearGradient(objX, objY, objX, objY+objH);
  og.addColorStop(0,'#60a5fa');
  og.addColorStop(1,'#1d4ed8');
  ctx.fillStyle = og;
  ctx.beginPath();
  ctx.roundRect(objX, objY, objW, objH, 4);
  ctx.fill();
  ctx.strokeStyle='#93c5fd';
  ctx.lineWidth=1;
  ctx.stroke();

  // Arrow line
  ctx.strokeStyle='#ffd700';
  ctx.lineWidth=1.5;
  ctx.setLineDash([4,3]);
  ctx.beginPath();
  ctx.moveTo(rulerX, rulerY+rulerH+2);
  ctx.lineTo(rulerX, objY+objH+4);
  ctx.moveTo(rulerX+objW, rulerY+rulerH+2);
  ctx.lineTo(rulerX+objW, objY+objH+4);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label
  ctx.fillStyle='#ffd700';
  ctx.font='bold 11px Arial';
  ctx.textAlign='center';
  ctx.fillText(measureVal.toFixed(1)+' cm', rulerX + objW/2, h-4);
}

function drawMistar(){
  const val = parseFloat($('mistar-len').value);
  $('mistar-len-val').textContent = val.toFixed(1)+' cm';
  $('mistar-result').textContent  = val.toFixed(1)+' cm';
  $('mistar-mm').textContent      = (val*10).toFixed(1)+' mm';
  drawMistarOnCanvas('canvas-mistar', val);
}

function genMistarQuiz(){
  mistarQuizVal = Math.round(Math.random()*280+10)/10;
  drawMistarOnCanvas('canvas-mistar-quiz', mistarQuizVal, false);
  // Draw object arrow separately
  const canvas = $('canvas-mistar-quiz');
  const dpr = window.devicePixelRatio||1;
  const w = canvas.getBoundingClientRect().width;
  const maxCm=30, rulerX=20, rulerW=w-40, rulerY=40;
  const pxPerCm=rulerW/maxCm;
  const ctx=canvas.getContext('2d');
  // Red arrow pointer
  const x=rulerX+mistarQuizVal*pxPerCm;
  ctx.fillStyle='#f87171';
  ctx.beginPath();
  ctx.moveTo(x,rulerY-4);
  ctx.lineTo(x-6,rulerY-14);
  ctx.lineTo(x+6,rulerY-14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle='#f87171';
  ctx.font='bold 11px Arial';
  ctx.textAlign='center';
  ctx.fillText('?',x,rulerY-16);

  $('quiz-mistar-q').textContent = 'Baca skala pada tanda panah merah di atas. Berapa nilai pengukurannya (cm)?';
  $('quiz-mistar-ans').value='';
  $('quiz-mistar-fb').textContent='';
  $('quiz-mistar-fb').className='feedback';
}

function checkMistar(){
  const ans = parseFloat($('quiz-mistar-ans').value);
  const fb  = $('quiz-mistar-fb');
  if(isNaN(ans)){ fb.textContent='Masukkan angka dulu!'; fb.className='feedback wrong'; return; }
  const diff = Math.abs(ans - mistarQuizVal);
  if(diff <= 0.1){
    fb.textContent = `✅ Benar! Jawaban: ${mistarQuizVal.toFixed(1)} cm`;
    fb.className='feedback correct';
  } else {
    fb.textContent = `❌ Kurang tepat. Jawaban: ${mistarQuizVal.toFixed(1)} cm`;
    fb.className='feedback wrong';
  }
}

// ===============================================================
//  JANGKA SORONG
// ===============================================================
let jangkaQuizVal = 32.4;

function drawJangkaOnCanvas(canvasId, mmVal){
  const canvas = $(canvasId);
  const {ctx,w,h} = resizeCanvas(canvas);
  ctx.clearRect(0,0,w,h);

  const mainMM  = Math.floor(mmVal);
  const nonius  = Math.round((mmVal - mainMM)*10); // 0..9
  const actualVal = mainMM + nonius*0.1;

  // ---- LAYOUT ----
  const startX = 30, endX = w-30;
  const mainLen = endX - startX;
  const pxPerMM = mainLen / 160;
  const baseY   = 60;
  const rulerH  = 30;

  // ---- MAIN SCALE (skala utama) ----
  const mg = ctx.createLinearGradient(startX,baseY,startX,baseY+rulerH);
  mg.addColorStop(0,'#d1d5db'); mg.addColorStop(1,'#6b7280');
  ctx.fillStyle=mg;
  ctx.fillRect(startX,baseY,mainLen,rulerH);
  ctx.strokeStyle='#374151'; ctx.lineWidth=1; ctx.strokeRect(startX,baseY,mainLen,rulerH);

  ctx.fillStyle='#111';
  ctx.font='9px Arial'; ctx.textAlign='center';
  for(let mm=0;mm<=160;mm++){
    const x=startX+mm*pxPerMM;
    let th;
    if(mm%10===0)     th=14;
    else if(mm%5===0) th=10;
    else              th=6;
    ctx.beginPath();
    ctx.moveTo(x,baseY);
    ctx.lineTo(x,baseY+th);
    ctx.strokeStyle='#374151';
    ctx.lineWidth=mm%10===0?1.2:0.6;
    ctx.stroke();
    if(mm%10===0) ctx.fillText(mm,x,baseY+26);
  }

  // ---- SLIDING JAW (rahang geser) ----
  const jawOffset = mainMM * pxPerMM;
  const jawX = startX + jawOffset;
  // Nonius plate
  const noniusLen = 10 * pxPerMM * (10/10); // 10 nonius divs covering 9mm
  const ng = ctx.createLinearGradient(jawX,baseY+rulerH,jawX,baseY+rulerH+44);
  ng.addColorStop(0,'#93c5fd'); ng.addColorStop(1,'#1d4ed8');
  ctx.fillStyle=ng;
  ctx.fillRect(jawX,baseY+rulerH,noniusLen+pxPerMM*2,44);
  ctx.strokeStyle='#1e40af'; ctx.lineWidth=1.5;
  ctx.strokeRect(jawX,baseY+rulerH,noniusLen+pxPerMM*2,44);

  // Nonius ticks (10 divs = 9 mm spacing → each div = 0.9 mm)
  const nSpacing = 9*pxPerMM/10;
  ctx.font='8px Arial';
  for(let i=0;i<=10;i++){
    const nx = jawX + i*nSpacing;
    const isCoincide = (i===nonius);
    ctx.strokeStyle = isCoincide ? '#ffd700':'rgba(255,255,255,0.7)';
    ctx.lineWidth   = isCoincide ? 2 : 0.8;
    ctx.beginPath();
    ctx.moveTo(nx, baseY+rulerH);
    ctx.lineTo(nx, baseY+rulerH + (isCoincide?28:16));
    ctx.stroke();
    ctx.fillStyle = isCoincide ? '#ffd700':'rgba(255,255,255,0.6)';
    ctx.textAlign='center';
    ctx.fillText(i, nx, baseY+rulerH+38);
  }

  // Label berimpit
  const coinX = jawX + nonius*nSpacing;
  ctx.fillStyle='#ffd700';
  ctx.font='bold 9px Arial';
  ctx.textAlign='center';
  ctx.fillText('✦', coinX, baseY+rulerH-4);

  // Measurement label
  ctx.fillStyle='#ffd700';
  ctx.font='bold 13px Arial';
  ctx.textAlign='left';
  ctx.fillText(`= ${actualVal.toFixed(1)} mm`, startX, h-6);

  // Skala utama reading line
  ctx.strokeStyle='#ef4444'; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
  ctx.beginPath();
  ctx.moveTo(jawX,baseY-2);
  ctx.lineTo(jawX,baseY+rulerH+2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle='#ef4444';
  ctx.font='9px Arial'; ctx.textAlign='center';
  ctx.fillText(mainMM+' mm', jawX, baseY-6);

  // Legend
  ctx.font='9px Arial'; ctx.textAlign='right';
  ctx.fillStyle='#ef4444'; ctx.fillText('━ Skala Utama', w-30, h-20);
  ctx.fillStyle='#ffd700'; ctx.fillText('✦ Garis berimpit', w-30, h-6);
}

function drawJangka(){
  const val = parseFloat($('js-val').value);
  $('js-val-disp').textContent = val.toFixed(1)+' mm';
  const mainMM  = Math.floor(val);
  const nonius  = Math.round((val-mainMM)*10);
  $('js-main').textContent    = mainMM+' mm';
  $('js-nonius').textContent  = (nonius*0.1).toFixed(1)+' mm';
  $('js-result').textContent  = (mainMM+nonius*0.1).toFixed(1)+' mm';
  drawJangkaOnCanvas('canvas-jangka', val);
}

function genJangkaQuiz(){
  jangkaQuizVal = Math.round(Math.random()*1490+10)/10;
  drawJangkaOnCanvas('canvas-jangka-quiz', jangkaQuizVal);
  $('quiz-jangka-q').textContent = 'Baca skala di atas. Berapa nilai pengukuran jangka sorong? (mm)';
  $('quiz-jangka-ans').value='';
  $('quiz-jangka-fb').textContent='';
  $('quiz-jangka-fb').className='feedback';
}

function checkJangka(){
  const ans = parseFloat($('quiz-jangka-ans').value);
  const fb  = $('quiz-jangka-fb');
  if(isNaN(ans)){ fb.textContent='Masukkan angka dulu!'; fb.className='feedback wrong'; return; }
  const mainMM = Math.floor(jangkaQuizVal);
  const nonius = Math.round((jangkaQuizVal-mainMM)*10);
  const correct = +(mainMM + nonius*0.1).toFixed(1);
  if(Math.abs(ans-correct)<=0.1){
    fb.textContent=`✅ Benar! Jawaban: ${correct} mm`;
    fb.className='feedback correct';
  } else {
    fb.textContent=`❌ Kurang tepat. Jawaban: ${correct} mm (SU: ${mainMM} + nonius: ${(nonius*0.1).toFixed(1)})`;
    fb.className='feedback wrong';
  }
}

// ===============================================================
//  MIKROMETER
// ===============================================================
let mikroQuizVal = 7.38;

function drawMikroOnCanvas(canvasId, mmVal){
  const canvas = $(canvasId);
  const {ctx,w,h} = resizeCanvas(canvas);
  ctx.clearRect(0,0,w,h);

  // Sleeve reading decomposition
  const halfMM     = Math.floor(mmVal/0.5)*0.5;   // last visible 0.5 mark
  const mainAbove  = Math.floor(mmVal);            // whole mm marks
  const halfVis    = (halfMM - mainAbove) >= 0.5;  // is 0.5 mark visible?
  const thimbleDiv = Math.round((mmVal - halfMM)/0.01); // 0..49

  // ---- SLEEVE (barrel) ----
  const slX = 20, slW = w-40;
  const slY = 30, slH = 40;
  const midY = slY + slH/2;
  const pxPer05 = (slW-80)/50; // 50 half-mm spans shown

  const slg = ctx.createLinearGradient(slX,slY,slX,slY+slH);
  slg.addColorStop(0,'#d1d5db'); slg.addColorStop(1,'#9ca3af');
  ctx.fillStyle=slg;
  ctx.fillRect(slX,slY,slW-60,slH);
  ctx.strokeStyle='#6b7280'; ctx.lineWidth=1; ctx.strokeRect(slX,slY,slW-60,slH);

  // datum line
  ctx.strokeStyle='#374151'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(slX,midY); ctx.lineTo(slX+slW-60,midY); ctx.stroke();

  // Sleeve ticks
  const visible05 = 25; // how many 0.5mm marks to show
  const startMark = Math.max(0, halfMM - visible05*0.5);
  ctx.font='8px Arial';
  for(let i=0;i<=visible05*2;i++){
    const markVal = startMark + i*0.5;
    const x = slX + (markVal - startMark)*pxPer05;
    if(x < slX || x > slX+slW-62) continue;
    const isFullMM = (markVal % 1 === 0);
    const isHalf   = !isFullMM;
    ctx.beginPath();
    if(isFullMM){
      ctx.moveTo(x,slY); ctx.lineTo(x,midY-2);
      ctx.strokeStyle='#374151'; ctx.lineWidth=1;
      ctx.stroke();
      ctx.fillStyle='#111'; ctx.textAlign='center';
      ctx.fillText(markVal.toFixed(0),x,slY-4);
    } else {
      ctx.moveTo(x,midY+2); ctx.lineTo(x,slY+slH);
      ctx.strokeStyle='#6b7280'; ctx.lineWidth=0.8;
      ctx.stroke();
    }
  }

  // Thimble
  const thimbleX = slX + (halfMM-startMark)*pxPer05;
  const thW = 60, thH = slH+20;
  const tg = ctx.createLinearGradient(thimbleX,slY-10,thimbleX,slY+thH-10);
  tg.addColorStop(0,'#93c5fd'); tg.addColorStop(1,'#1d4ed8');
  ctx.fillStyle=tg;
  ctx.fillRect(thimbleX, slY-10, thW, thH);
  ctx.strokeStyle='#1e40af'; ctx.lineWidth=1.5;
  ctx.strokeRect(thimbleX, slY-10, thW, thH);

  // Thimble divisions (0-49, show ~20 around active)
  const divH=12, totalDiv=50;
  const thimbleCenterDiv = thimbleDiv;
  const pxPerDiv = slH/10;
  const visRange = 15;

  for(let d=-visRange;d<=visRange;d++){
    let div = ((thimbleCenterDiv + d) % totalDiv + totalDiv) % totalDiv;
    const dy = midY + d*pxPerDiv;
    if(dy < slY-10 || dy > slY+thH-10) continue;
    const isCurrent = (d===0);
    const isMain    = (div%5===0);
    ctx.strokeStyle = isCurrent ? '#ffd700' : 'rgba(255,255,255,0.6)';
    ctx.lineWidth   = isCurrent ? 2 : 0.8;
    const tickW     = isMain ? thW-4 : thW/2;
    ctx.beginPath();
    ctx.moveTo(thimbleX+2, dy);
    ctx.lineTo(thimbleX+2+tickW, dy);
    ctx.stroke();
    if(isMain || isCurrent){
      ctx.fillStyle= isCurrent ? '#ffd700' : 'rgba(255,255,255,0.7)';
      ctx.font=isCurrent?'bold 9px Arial':'8px Arial';
      ctx.textAlign='left';
      ctx.fillText(div.toString().padStart(2,'0'), thimbleX+thW-18, dy+3);
    }
  }

  // Datum line extended into thimble
  ctx.strokeStyle='#ef4444'; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(thimbleX,midY); ctx.lineTo(thimbleX+thW,midY);
  ctx.stroke();

  // Result label
  ctx.fillStyle='#ffd700'; ctx.font='bold 13px Arial'; ctx.textAlign='left';
  ctx.fillText(`= ${mmVal.toFixed(2)} mm`, slX, h-6);

  // Breakdown
  ctx.fillStyle='#aaa'; ctx.font='9px Arial';
  ctx.fillText(`SU: ${halfMM.toFixed(1)} mm  +  Thimble: ${thimbleDiv} × 0.01 = ${(thimbleDiv*0.01).toFixed(2)} mm`, slX, h-18);
}

function drawMikro(){
  const val = parseFloat($('mik-val').value);
  $('mik-val-disp').textContent = val.toFixed(2)+' mm';
  const halfMM    = Math.floor(val/0.5)*0.5;
  const thimbleDiv= Math.round((val-halfMM)/0.01);
  $('mik-main').textContent    = halfMM.toFixed(1)+' mm';
  $('mik-thimble').textContent = thimbleDiv+' div';
  $('mik-result').textContent  = val.toFixed(2)+' mm';
  drawMikroOnCanvas('canvas-mikro', val);
}

function genMikroQuiz(){
  mikroQuizVal = Math.round(Math.random()*2499+1)/100;
  drawMikroOnCanvas('canvas-mikro-quiz', mikroQuizVal);
  $('quiz-mikro-q').textContent = 'Baca skala mikrometer di atas. Berapa nilai pengukurannya? (mm)';
  $('quiz-mikro-ans').value='';
  $('quiz-mikro-fb').textContent='';
  $('quiz-mikro-fb').className='feedback';
}

function checkMikro(){
  const ans    = parseFloat($('quiz-mikro-ans').value);
  const fb     = $('quiz-mikro-fb');
  if(isNaN(ans)){fb.textContent='Masukkan angka dulu!';fb.className='feedback wrong';return;}
  const halfMM    = Math.floor(mikroQuizVal/0.5)*0.5;
  const thimble   = Math.round((mikroQuizVal-halfMM)/0.01);
  const correct   = +(halfMM+thimble*0.01).toFixed(2);
  if(Math.abs(ans-correct)<=0.01){
    fb.textContent=`✅ Benar! Jawaban: ${correct} mm`;
    fb.className='feedback correct';
  } else {
    fb.textContent=`❌ Kurang tepat. Jawaban: ${correct} mm (SU: ${halfMM.toFixed(1)} + thimble: ${thimble}×0.01=${(thimble*0.01).toFixed(2)})`;
    fb.className='feedback wrong';
  }
}

// ===============================================================
//  INIT
// ===============================================================
window.addEventListener('load', ()=>{
  drawMistar();
  genMistarQuiz();
  genJangkaQuiz();
  genMikroQuiz();
});

window.addEventListener('resize', ()=>{
  drawMistar();
  drawJangka();
  drawMikro();
});