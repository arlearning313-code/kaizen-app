// js/cover.js — Cover Beranda: hero countdown + motivasi menuju Jepang (desktop).

// ── Sasaran & jendela waktu ─────────────────────────────────────────────
const TARGET_JEPANG = new Date(2029, 6, 13);   // 13 Juli 2029 (bulan 0-indeks: 6 = Juli)
const MULAI_JEPANG  = new Date(2026, 6, 13);   // titik mulai (saat target ditetapkan) → dasar % progress

// ── Kutipan bergilir (berganti tiap hari) ───────────────────────────────
const KUTIPAN_JEPANG = [
  { id: "Perjalanan seribu mil dimulai dari satu langkah kecil.", jp: "千里の道も一歩から",   ro: "Senri no michi mo ippo kara" },
  { id: "Jatuh tujuh kali, bangkit delapan kali.",               jp: "七転び八起き",         ro: "Nanakorobi yaoki" },
  { id: "Sedikit demi sedikit, lama-lama menjadi gunung.",       jp: "塵も積もれば山となる", ro: "Chiri mo tsumoreba yama to naru" },
  { id: "Sesudah musim dingin, musim semi pasti tiba.",          jp: "冬来たりなば春遠からじ", ro: "Fuyu kitarinaba haru tookaraji" },
  { id: "Setiap hari, satu langkah lebih baik.",                 jp: "一歩一歩",             ro: "Ippo ippo" },
  { id: "Perbaikan kecil, setiap hari.",                         jp: "改善",                 ro: "Kaizen" },
];

function kutipanHariIni() {
  const hari = Math.floor(Date.now() / 86400000);
  return KUTIPAN_JEPANG[hari % KUTIPAN_JEPANG.length];
}

// ── Hitung mundur kalender yang konsisten (thn/bln/hr + jam/mnt/dtk) ─────
function hitungMundur(target) {
  const now = new Date();
  if (target <= now) return { tahun:0, bulan:0, hari:0, jam:0, menit:0, detik:0, habis:true };

  let cursor = new Date(now), totalBulan = 0;
  while (true) {
    const coba = new Date(cursor); coba.setMonth(cursor.getMonth() + 1);
    if (coba <= target) { cursor = coba; totalBulan++; } else break;
  }
  const tahun = Math.floor(totalBulan / 12);
  const bulan = totalBulan % 12;

  let sisa = target - cursor;
  const hari  = Math.floor(sisa / 86400000); sisa -= hari  * 86400000;
  const jam   = Math.floor(sisa / 3600000);  sisa -= jam   * 3600000;
  const menit = Math.floor(sisa / 60000);    sisa -= menit * 60000;
  const detik = Math.floor(sisa / 1000);
  return { tahun, bulan, hari, jam, menit, detik, habis:false };
}

const pad2 = (n) => String(n).padStart(2, "0");

// ── Bangun elemen cover ─────────────────────────────────────────────────
function coverJepang() {
  const k = kutipanHariIni();
  const el = document.createElement("section");
  el.className = "dash-span cover-jp";

  el.innerHTML = `
    <div class="cover-pita">日本への道</div>
    <div class="cover-isi">
      <p class="cover-kicker">改善 · STRATEGI MENUJU JEPANG</p>
      <h2 class="cover-judul">MENUJU<br>JEPANG</h2>
      <p class="cover-sub">目標 · TARGET ${TARGET_JEPANG.getFullYear()}</p>

      <div class="cover-cd" id="cover-hitung">
        <div class="cd-unit"><span class="cd-num" data-u="tahun">--</span><span class="cd-lbl">年 Tahun</span></div>
        <span class="cd-titik">:</span>
        <div class="cd-unit"><span class="cd-num" data-u="bulan">--</span><span class="cd-lbl">月 Bulan</span></div>
        <span class="cd-titik">:</span>
        <div class="cd-unit"><span class="cd-num" data-u="hari">--</span><span class="cd-lbl">日 Hari</span></div>
      </div>
      <p class="cover-jam" id="cover-jam">-- : -- : --</p>

      <div class="cover-progress">
        <div class="cover-progress-head">
          <span>Progress menuju keberangkatan</span>
          <span id="cover-persen">0%</span>
        </div>
        <div class="cover-bar"><span id="cover-bar-isi" style="width:0%"></span></div>
      </div>

      <blockquote class="cover-kutipan">
        <span class="kutipan-jp">${k.jp}</span>
        <span class="kutipan-id">"${k.id}"</span>
        <span class="kutipan-ro">${k.ro}</span>
      </blockquote>
    </div>`;

  mulaiCoverJam();
  return el;
}

// ── Satu interval global (aman meski renderDashboard dipanggil berkali-kali) ──
let _coverInterval = null;
function mulaiCoverJam() {
  // Fitur desktop saja — jangan jalankan timer di HP
  if (!window.matchMedia || !window.matchMedia("(min-width: 900px)").matches) return;

  const tik = () => {
    const box = document.getElementById("cover-hitung");
    if (!box) return; // cover sedang tidak tampil
    const t = hitungMundur(TARGET_JEPANG);
    box.querySelector('[data-u="tahun"]').textContent = pad2(t.tahun);
    box.querySelector('[data-u="bulan"]').textContent = pad2(t.bulan);
    box.querySelector('[data-u="hari"]').textContent  = pad2(t.hari);

    const jamEl = document.getElementById("cover-jam");
    if (jamEl) jamEl.textContent = `${pad2(t.jam)} : ${pad2(t.menit)} : ${pad2(t.detik)}`;

    const total = TARGET_JEPANG - MULAI_JEPANG;
    const lewat = Date.now() - MULAI_JEPANG;
    const pct   = Math.max(0, Math.min(100, (lewat / total) * 100));
    const isi = document.getElementById("cover-bar-isi");
    const per = document.getElementById("cover-persen");
    if (isi) isi.style.width = pct.toFixed(1) + "%";
    if (per) per.textContent = pct.toFixed(pct < 10 ? 1 : 0) + "%";
  };

  tik();
  if (!_coverInterval) _coverInterval = setInterval(tik, 1000);
}