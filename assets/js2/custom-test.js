// ══════════════════════════════════════
//  DATA SOAL
// ══════════════════════════════════════
const questions = [
  {
    q: "Sebuah mobil bergerak dengan kecepatan awal 10 m/s dan mengalami percepatan 2 m/s² selama 5 sekon. Jarak yang ditempuh mobil selama waktu tersebut adalah….",
    opts: ["50 m","60 m","70 m","75 m","80 m"],
    ans: 3
  },
  {
    q: "Sebuah benda bermassa 4 kg mula-mula diam, kemudian ditarik gaya konstan sehingga kecepatannya mencapai 10 m/s dalam waktu 5 sekon. Besar gaya konstan yang bekerja adalah….",
    opts: ["8 N","10 N","12 N","15 N","20 N"],
    ans: 0
  },
  {
    q: "Sebuah bola bermassa 0,5 kg dilempar vertikal ke atas dengan kecepatan awal 20 m/s. Ketinggian maksimum yang dicapai bola adalah… (g = 10 m/s²)",
    opts: ["20 m","25 m","30 m","35 m","40 m"],
    ans: 0
  },
  {
    q: "Sebuah benda bermassa 0,2 kg diputar dengan kecepatan sudut 10 rad/s pada lintasan berjari-jari 0,5 m. Gaya sentripetalnya adalah ….",
    opts: ["0,5 N","1 N","5 N","10 N","50 N"],
    ans: 3
  },
  {
    q: "Seorang penjaga gawang menarik tangannya ke belakang saat menangkap bola. Tujuan utama tindakan ini adalah….",
    opts: [
      "Memperlama waktu kontak dengan bola",
      "Memperkecil gaya yang dirasakan tangan",
      "Memperkecil impuls yang diterima bola",
      "Memperbesar kecepatan bola",
      "Memperkecil tekanan pada tangan"
    ],
    ans: 1
  },
  {
    q: "Sebuah mesin Carnot bekerja antara reservoir panas 500 K dan reservoir dingin 300 K. Efisiensi termalnya adalah….",
    opts: ["20%","33%","40%","50%","60%"],
    ans: 2
  },
  {
    q: "Sebuah senar panjang 1,2 m memiliki 4 perut dengan cepat rambat 240 m/s. Frekuensinya adalah ….",
    opts: ["200 Hz","400 Hz","480 Hz","520 Hz","600 Hz"],
    ans: 1
  },
  {
    q: "Sebuah senar panjang 0,6 m memiliki 3 simpul dengan cepat rambat 120 m/s. Frekuensinya adalah ….",
    opts: ["100 Hz","120 Hz","150 Hz","180 Hz","200 Hz"],
    ans: 4
  },
  {
    q: "Perbedaan antara massa inti dan massa penyusunnya (defek massa) berkaitan dengan….",
    opts: [
      "Proton dan elektron",
      "Massa inti lebih besar dari massa penyusunnya",
      "Sebagian massa berubah menjadi energi ikat",
      "Selisih massa digunakan untuk elektron",
      "Energi ikat elektron"
    ],
    ans: 2
  },
  {
    q: "Muatan q = 2 μC bergerak 5×10⁶ m/s tegak lurus medan magnet 0,02 T. Besar gaya Lorentz adalah ….",
    opts: ["0,02 N","0,20 N","2,0 N","20 N","200 N"],
    ans: 1
  },
  {
    q: "Sebuah sistem menerima kalor sebesar 800 J dari reservoir panas dan melakukan usaha sebesar 300 J pada lingkungan. Perubahan energi dalam (ΔU) sistem adalah ….",
    opts: ["500 J","1100 J","−500 J","−300 J","300 J"],
    ans: 0
  },
  {
    q: "Sebuah lampu 100 Watt dipasang pada tegangan 220 Volt. Kuat arus listrik yang mengalir adalah ….",
    opts: ["0,45 A","2,2 A","4,5 A","22 A","45 A"],
    ans: 0
  },
  {
    q: "Tiga resistor: R₁ = 4 Ω dan R₂ = 12 Ω dihubungkan paralel, hasilnya diseri dengan R₃ = 9 Ω. Jika tegangan sumber 24 V, kuat arus total yang mengalir adalah ….",
    opts: ["1,0 A","1,5 A","2,0 A","3,0 A","4,0 A"],
    ans: 2
  },
  {
    q: "Sebuah batang konduktor panjang 0,5 m bergerak tegak lurus terhadap medan magnet seragam B = 0,2 T dengan kecepatan 10 m/s. Besar ggl yang timbul adalah ….",
    opts: ["0,5 V","1,0 V","1,5 V","2,0 V","2,5 V"],
    ans: 1
  },
  {
    q: "Sebuah muatan positif bergerak di bawah kawat berarus listrik searah sumbu x (+). Jika muatan bergerak searah arus, arah gaya Lorentz yang dialami adalah searah sumbu ….",
    opts: ["y (+)","y (−)","x (+)","x (−)","z (+)"],
    ans: 0
  },
  {
    q: "Jika kecepatan cahaya 3×10⁸ m/s dan indeks bias kaca 1,5, cepat rambat cahaya dalam kaca adalah ….",
    opts: ["4,5×10⁸ m/s","2×10⁸ m/s","4,5×10⁷ m/s","2×10⁷ m/s","1×10⁷ m/s"],
    ans: 1
  },
  {
    q: "Sebuah lensa cembung tipis memiliki fokus 15 cm. Sebuah benda ditempatkan 10 cm di depan lensa. Posisi bayangan dan jenisnya adalah ….",
    opts: [
      "6 cm, nyata terbalik",
      "15 cm, nyata terbalik",
      "30 cm, maya tegak",
      "30 cm, nyata terbalik",
      "45 cm, maya tegak"
    ],
    ans: 2
  },
  {
    q: "Sebuah cermin cekung memiliki jari-jari kelengkungan 40 cm. Sebuah benda diletakkan pada jarak 60 cm di depan cermin. Posisi bayangan dan sifatnya adalah ….",
    opts: [
      "20 cm, maya, tegak",
      "20 cm, nyata, terbalik",
      "60 cm, maya, tegak",
      "30 cm, nyata, terbalik",
      "120 cm, nyata, terbalik"
    ],
    ans: 3
  },
  {
    q: "Perhatikan pernyataan berikut:\n(1) Pengamatan dengan mata berakomodasi maksimum\n(2) Bayangan akhir maya terbalik diperbesar\n(3) Benda berada pada fokus objektif\n(4) Bayangan objektif jatuh di fokus okuler\nPernyataan yang sesuai dengan pembentukan bayangan optimal pada mikroskop adalah ….",
    opts: ["(1) dan (2)","(1) dan (3)","(2) dan (3)","(2) dan (4)","(3) dan (4)"],
    ans: 0
  },
  {
    q: "Sebuah kapal selam berada pada kedalaman 50 m di bawah permukaan laut (ρ = 1000 kg/m³, g = 10 m/s², Patm = 1×10⁵ Pa). Tekanan total yang dialami dinding kapal selam adalah ….",
    opts: ["2,0×10⁵ Pa","3,5×10⁵ Pa","4,0×10⁵ Pa","5,0×10⁵ Pa","6,0×10⁵ Pa"],
    ans: 4
  },
  {
    q: "Sebuah bola logam hanya dapat melewati cincin logam jika keduanya berada pada suhu ruang. Saat cincin dipanaskan, apa yang terjadi pada ukuran lubang cincin?",
    opts: ["Mengecil","Menjadi padat","Tetap","Bertambah","Hilang bentuknya"],
    ans: 3
  },
  {
    q: "Air mengalir dalam pipa horizontal. Jika kecepatan aliran naik dari 1 m/s menjadi 2 m/s, perubahan tekanan adalah … (ρ = 1000 kg/m³)",
    opts: ["1.500 Pa","500 Pa","1.000 Pa","2.000 Pa","2.500 Pa"],
    ans: 0
  },
  {
    q: "Tentang percepatan sentripetal, pernyataan yang benar adalah…\n(1) Dimiliki oleh benda yang berputar\n(2) Arahnya berubah-ubah\n(3) Bergantung pada kecepatan tangensial\n(4) Sebanding dengan jari-jari orbit",
    opts: ["1 dan 2","1 dan 3","2 dan 3","2 dan 4","3 dan 4"],
    ans: 0
  },
  {
    q: "Energi kinetik maksimum elektron yang dipancarkan jika logam dengan fungsi kerja 3 eV disinari cahaya berenergi 5 eV adalah ….",
    opts: ["0,6 eV","2 eV","8 eV","15 eV","20 eV"],
    ans: 1
  },
  {
    q: "Dua muatan masing-masing 2 μC dipisahkan sejauh 0,1 m. Besar gaya Coulomb antar keduanya (k = 9×10⁹ N·m²/C²) adalah ….",
    opts: ["1,8 N","2,4 N","3,2 N","3,6 N","4,2 N"],
    ans: 3
  },
  {
    q: "Sebuah senar panjang 0,6 m menghasilkan 3 simpul dengan cepat rambat 120 m/s. Frekuensi getarannya adalah ….",
    opts: ["100 Hz","120 Hz","150 Hz","180 Hz","200 Hz"],
    ans: 2
  },
  {
    q: "Sebuah balok kayu massa jenis 0,8 g/cm³ terapung di atas air (ρ air = 1 g/cm³). Jika volume balok 200 cm³, volume yang tercelup adalah ….",
    opts: ["80 cm³","100 cm³","120 cm³","160 cm³","200 cm³"],
    ans: 3
  },
  {
    q: "Sebuah batang konduktor panjang 0,5 m bergerak tegak lurus terhadap medan magnet B = 0,2 T dengan kecepatan 10 m/s dalam rangkaian tertutup. Besar emf yang timbul adalah ….",
    opts: ["0,5 V","1,0 V","1,5 V","2,0 V","2,5 V"],
    ans: 1
  },
  {
    q: "Sebuah lensa cembung tipis memiliki fokus 15 cm. Benda ditempatkan 10 cm di depan lensa. Besar jarak bayangan dari lensa dan jenisnya adalah ….",
    opts: [
      "6 cm, nyata terbalik",
      "15 cm, nyata terbalik",
      "30 cm, maya tegak",
      "30 cm, nyata terbalik",
      "45 cm, maya tegak"
    ],
    ans: 2
  },
  {
    q: "Sebuah rangkaian RC terdiri dari resistor 2,0 kΩ dan kapasitor 10 μF. Waktu agar tegangan kapasitor mencapai sekitar 63% tegangan sumber adalah ….",
    opts: ["5 ms","10 ms","15 ms","20 ms","25 ms"],
    ans: 3
  },
  {
    q: "Sebuah mesin Carnot bekerja antara reservoir panas 500 K dan dingin 300 K. Efisiensi termal mesin Carnot tersebut adalah ….",
    opts: ["40%","33%","50%","60%","20%"],
    ans: 0
  },
  {
    q: "Sebuah senar panjang 1,2 m dengan kedua ujung terikat menghasilkan 4 perut. Jika cepat rambat gelombang 240 m/s, frekuensinya adalah ….",
    opts: ["200 Hz","400 Hz","480 Hz","600 Hz","800 Hz"],
    ans: 1
  },
  {
    q: "Sebuah kapal selam berada pada kedalaman 50 m (ρ = 1000 kg/m³, g = 10 m/s², Patm = 1×10⁵ Pa). Tekanan total yang dialami dinding kapal selam adalah ….",
    opts: ["2,0×10⁵ Pa","3,5×10⁵ Pa","4,0×10⁵ Pa","5,0×10⁵ Pa","6,0×10⁵ Pa"],
    ans: 4
  },
  {
    q: "Sebuah benda bermassa 4 kg mula-mula diam, lalu dipercepat hingga 10 m/s dalam 5 s. Gaya konstan yang bekerja adalah ….",
    opts: ["8 N","10 N","12 N","15 N","20 N"],
    ans: 0
  },
  {
    q: "Sebuah cermin cekung memiliki jari-jari kelengkungan 40 cm. Benda diletakkan 60 cm di depan cermin. Posisi bayangan dan sifatnya adalah ….",
    opts: [
      "20 cm, maya, tegak",
      "20 cm, nyata, terbalik",
      "60 cm, maya, tegak",
      "30 cm, nyata, terbalik",
      "120 cm, nyata, terbalik"
    ],
    ans: 3
  },
  {
    q: "Dua muatan titik +4 μC dan +6 μC dipisahkan sejauh 0,3 m (k = 9×10⁹ N·m²/C²). Besar gaya Coulomb antar keduanya adalah ….",
    opts: ["0,24 N","1,2 N","2,4 N","24 N","240 N"],
    ans: 2
  },
  {
    q: "Sebuah partikel bermuatan q = 2 μC bergerak 5×10⁶ m/s tegak lurus medan magnet 0,02 T. Besar gaya magnetik yang dialami adalah ….",
    opts: ["0,02 N","0,20 N","2,0 N","20 N","200 N"],
    ans: 1
  },
  {
    q: "Sebuah sistem menerima kalor 800 J dan melakukan kerja 300 J. Perubahan energi dalam sistem adalah ….",
    opts: ["500 J","1100 J","−500 J","−300 J","300 J"],
    ans: 0
  },
  {
    q: "Tiga resistor R₁ = 4 Ω dan R₂ = 12 Ω disusun paralel, kemudian diseri dengan R₃ = 9 Ω. Jika tegangan sumber 24 V, arus totalnya adalah ….",
    opts: ["1,0 A","1,5 A","2,0 A","3,0 A","4,0 A"],
    ans: 2
  },
  {
    q: "Sebuah senar panjang 0,9 m memiliki 3 perut gelombang dengan cepat rambat 180 m/s. Frekuensi gelombang adalah ….",
    opts: ["150 Hz","300 Hz","450 Hz","600 Hz","900 Hz"],
    ans: 1
  },
  {
    q: "Sebuah benda bermassa 2 kg bergerak ke kanan 6 m/s lalu memantul ke kiri 4 m/s setelah tumbukan. Besar impulsnya adalah ….",
    opts: ["2 Ns","8 Ns","10 Ns","20 Ns","24 Ns"],
    ans: 3
  },
  {
    q: "Dua celah kembar berjarak 0,30 mm dan layar 2,0 m, panjang gelombang 600 nm. Jarak antar garis terang adalah ….",
    opts: ["1,0 mm","2,0 mm","3,0 mm","3,5 mm","4,0 mm"],
    ans: 4
  },
  {
    q: "Air mengalir dari kecepatan 1 m/s menjadi 2 m/s dalam pipa datar. Perubahan tekanan adalah … (ρ = 1000 kg/m³)",
    opts: ["500 Pa","1000 Pa","1500 Pa","2000 Pa","2500 Pa"],
    ans: 2
  },
  {
    q: "Dua resistor 6 Ω dan 12 Ω dipasang paralel. Hambatan penggantinya adalah ….",
    opts: ["3 Ω","4 Ω","6 Ω","8 Ω","9 Ω"],
    ans: 1
  },
  {
    q: "Sebuah benda bermassa 5 kg dijatuhkan dari ketinggian 10 m. Energi kinetiknya sesaat sebelum menyentuh tanah adalah … (g = 10 m/s²)",
    opts: ["25 J","50 J","100 J","250 J","500 J"],
    ans: 4
  },
  {
    q: "Sebuah lampu spesifikasi 20 W, 220 V dipasang pada tegangan 110 V. Energi listrik yang terpakai dalam 1 jam adalah ….",
    opts: ["72 kJ","36 kJ","44 kJ","22 kJ","18 kJ"],
    ans: 4
  },
  {
    q: "Dua muatan +3 μC dan −3 μC terpisah sejauh 3 cm (k = 9×10⁹). Besar dan jenis gaya Coulombnya adalah ….",
    opts: [
      "90 N dan tolak-menolak",
      "90 N dan tarik-menarik",
      "2.700 N dan tolak-menolak",
      "2.700 N dan tarik-menarik",
      "Tidak ada jawaban yang benar"
    ],
    ans: 1
  },
  {
    q: "Dua muatan yang berjarak R memiliki gaya Coulomb F. Jika jaraknya diubah menjadi 2R, gaya Coulombnya menjadi ….",
    opts: ["2F","F/2","4F","F/4","Tidak berubah"],
    ans: 3
  },
  {
    q: "Dua kapasitor 6 μF dan 12 μF disusun seri dengan beda potensial 220 V. Energi yang tersimpan adalah ….",
    opts: ["440,0 mJ","220,0 mJ","110,2 mJ","96,8 mJ","55,1 mJ"],
    ans: 3
  },
  {
    q: "Perhatikan pernyataan tentang efek fotolistrik:\n(1) Lepas tidaknya elektron dari logam ditentukan oleh panjang gelombang cahaya.\n(2) Intensitas cahaya tidak menjamin keluarnya elektron dari permukaan logam.\n(3) Di bawah frekuensi ambang, elektron tetap keluar jika intensitas diperbesar.\nPernyataan yang benar adalah ….",
    opts: [
      "(1), (2), dan (3)",
      "(1) dan (2) saja",
      "(1) dan (3) saja",
      "(2) dan (3) saja",
      "(3) saja"
    ],
    ans: 1
  }
];

// ══════════════════════════════════════
//  STATE
// ══════════════════════════════════════
let currentQ    = 0;
let answers     = new Array(50).fill(-1);
let timerSec    = 120 * 60;
let timerHandle = null;
let userName    = '';

// ══════════════════════════════════════
//  MULAI TES
// ══════════════════════════════════════
function startTest() {
  const input = document.getElementById('name-input').value.trim();
  if (!input) {
    document.getElementById('name-input').focus();
    document.getElementById('name-input').style.borderColor = '#f87171';
    setTimeout(() => { document.getElementById('name-input').style.borderColor = '#334155'; }, 1500);
    return;
  }
  userName = input;
  document.getElementById('display-name').textContent = '👤 ' + userName;
  document.getElementById('intro-screen').style.display = 'none';
  document.getElementById('test-screen').style.display  = 'block';

  buildNavGrid();
  renderQuestion(0);
  startTimer();
}

// ══════════════════════════════════════
//  TIMER
// ══════════════════════════════════════
function startTimer() {
  timerHandle = setInterval(() => {
    timerSec--;
    updateTimerDisplay();
    if (timerSec <= 0) {
      clearInterval(timerHandle);
      submitTest();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el  = document.getElementById('timer');
  const m   = String(Math.floor(timerSec / 60)).padStart(2, '0');
  const s   = String(timerSec % 60).padStart(2, '0');
  el.textContent = m + ':' + s;
  el.className   = timerSec <= 300 ? 'danger' : timerSec <= 600 ? 'warning' : '';
}

// ══════════════════════════════════════
//  RENDER SOAL
// ══════════════════════════════════════
function renderQuestion(idx) {
  currentQ = idx;
  const q  = questions[idx];
  const keys = ['A','B','C','D','E'];

  document.getElementById('question-counter').textContent = `Soal ${idx+1} / 50`;
  document.getElementById('progress-bar').style.width = ((idx+1)/50*100) + '%';

  const optsHTML = q.opts.map((o, i) => `
    <label class="option-label ${answers[idx] === i ? 'selected' : ''}" onclick="selectAnswer(${i})">
      <input type="radio" name="opt" value="${i}" ${answers[idx] === i ? 'checked' : ''}/>
      <span class="option-key">${keys[i]}</span>
      <span>${o}</span>
    </label>
  `).join('');

  document.getElementById('question-block').innerHTML = `
    <div class="question-number">Soal ${idx+1} dari 50</div>
    <div class="question-text">${q.q.replace(/\n/g,'<br/>')}</div>
    <div class="options">${optsHTML}</div>
  `;

  document.getElementById('btn-prev').disabled = idx === 0;
  document.getElementById('btn-next').disabled = idx === 49;

  updateNavGrid();
}

// ══════════════════════════════════════
//  PILIH JAWABAN
// ══════════════════════════════════════
function selectAnswer(i) {
  answers[currentQ] = i;
  renderQuestion(currentQ);
}

// ══════════════════════════════════════
//  NAVIGASI
// ══════════════════════════════════════
function goTo(idx) {
  if (idx < 0 || idx > 49) return;
  renderQuestion(idx);
}

// ══════════════════════════════════════
//  GRID NAVIGATOR
// ══════════════════════════════════════
function buildNavGrid() {
  const grid = document.getElementById('nav-grid');
  grid.innerHTML = '';
  for (let i = 0; i < 50; i++) {
    const d = document.createElement('div');
    d.className  = 'nav-dot';
    d.textContent = i+1;
    d.id         = `nd-${i}`;
    d.onclick    = () => goTo(i);
    grid.appendChild(d);
  }
}

function updateNavGrid() {
  for (let i = 0; i < 50; i++) {
    const d = document.getElementById(`nd-${i}`);
    if (!d) continue;
    d.className = 'nav-dot' +
      (i === currentQ  ? ' current'  :
       answers[i] >= 0 ? ' answered' : '');
  }
}

// ══════════════════════════════════════
//  KONFIRMASI KUMPULKAN
// ══════════════════════════════════════
function openConfirm() {
  const kosong = answers.filter(a => a < 0).length;
  document.getElementById('modal-unanswered').textContent =
    kosong === 0
      ? 'Semua soal sudah dijawab. Yakin ingin mengumpulkan?'
      : `Masih ada ${kosong} soal yang belum dijawab. Yakin ingin mengumpulkan sekarang?`;
  document.getElementById('confirm-modal').style.display = 'flex';
}

function closeConfirm() {
  document.getElementById('confirm-modal').style.display = 'none';
}

// ══════════════════════════════════════
//  KUMPULKAN & HITUNG NILAI
// ══════════════════════════════════════
function submitTest() {
  clearInterval(timerHandle);
  document.getElementById('confirm-modal').style.display = 'none';

  let benar = 0;
  for (let i = 0; i < 50; i++) {
    if (answers[i] === questions[i].ans) benar++;
  }

  const salah  = answers.filter((a,i) => a >= 0 && a !== questions[i].ans).length;
  const kosong = answers.filter(a => a < 0).length;
  const nilai  = Math.round((benar / 50) * 100);

  // Kriteria: LULUS jika nilai >= 65 (atau == 60), TIDAK LULUS jika < 60
  // "LULUS jika pas 60 atau lebih dari 65" → lulus jika nilai == 60 atau nilai > 65
  // nilai antara 61–64 → tidak lulus berdasarkan soal
  const lulus = (nilai === 60 || nilai > 65);

  document.getElementById('test-screen').style.display  = 'none';
  const rs = document.getElementById('result-screen');
  rs.style.display = 'flex';

  document.getElementById('result-icon').textContent  = lulus ? '🎉' : '😔';
  document.getElementById('result-name').textContent  = userName;
  document.getElementById('result-score').textContent = nilai;
  document.getElementById('result-score').className   = 'result-score ' + (lulus ? 'lulus' : 'tidak-lulus');

  const badge = document.getElementById('result-badge');
  badge.textContent = lulus ? '✅ LULUS' : '❌ TIDAK LULUS';
  badge.className   = 'result-badge ' + (lulus ? 'lulus' : 'tidak-lulus');

  document.getElementById('stat-benar').textContent  = benar;
  document.getElementById('stat-salah').textContent  = salah;
  document.getElementById('stat-kosong').textContent = kosong;

  document.getElementById('result-msg').textContent = lulus
    ? `Selamat, ${userName}! Kamu berhasil lulus tes ini dengan menjawab ${benar} soal dengan benar. Pertahankan prestasimu!`
    : `Sayang sekali, ${userName}. Kamu menjawab benar ${benar} dari 50 soal. Pelajari kembali materi yang belum dikuasai dan coba lagi!`;
}

// ══════════════════════════════════════
//  ULANGI TES
// ══════════════════════════════════════
function retryTest() {
  answers     = new Array(50).fill(-1);
  currentQ    = 0;
  timerSec    = 120 * 60;
  userName    = '';

  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('test-screen').style.display   = 'none';
  document.getElementById('intro-screen').style.display  = 'flex';
  document.getElementById('name-input').value            = '';
  updateTimerDisplay();
}