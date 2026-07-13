// js/cover.js — Cover Beranda: hero countdown + motivasi + progress kesiapan (desktop).

// ── Sasaran & jendela waktu ─────────────────────────────────────────────
const TARGET_JEPANG = new Date(2029, 6, 13);   // 13 Juli 2029 (bulan 0-indeks: 6 = Juli)
const MULAI_JEPANG  = new Date(2026, 6, 13);   // titik mulai (untuk komponen "waktu")

// ── Bobot tiap komponen progress (boleh diubah; tak harus berjumlah 100) ─
const BOBOT_PROGRESS = { waktu: 1, tabungan: 1, level: 1, quest: 1 };

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

// ── Hitung mundur kalender (thn/bln/hr + jam/mnt/dtk) ────────────────────
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

// ── Komponen progress ───────────────────────────────────────────────────
// (a) waktu — murni kalender, dihitung tiap detik
function fraksiWaktu() {
  const total = TARGET_JEPANG - MULAI_JEPANG;
  const lewat = Date.now() - MULAI_JEPANG;
  return Math.max(0, Math.min(1, lewat / total));
}

// (b,c,d) tabungan / level-xp / quest — dari IndexedDB, dihitung saat render
let _fraksiData = { tabungan: 0, level: 0, quest: 0 };

async function hitungFraksiData() {
  // (b) Tabungan Japan Fund → saldo terakhir / milestone terakhir (Rp185 jt)
  let fTab = 0;
  if (typeof ambilFinansial === "function") {
    const arr = await ambilFinansial();
    const saldo = arr.length ? arr[arr.length - 1].jumlah : 0;
    const targetDana = (typeof JAPAN_MILESTONE !== "undefined")
      ? JAPAN_MILESTONE[JAPAN_MILESTONE.length - 1] : 185000000;
    fTab = Math.min(1, saldo / targetDana);
  }

  // (c) Level / XP → total XP / XP untuk Level 50 (= keberangkatan)
  let fLvl = 0;
  if (typeof totalXP === "function") {
    const xp = await totalXP();
    const ambangMax = (typeof KONFIG !== "undefined" && KONFIG.ambangXP[50]) || 45000;
    fLvl = Math.min(1, xp / ambangMax);
  }

  // (d) Quest utama → jumlah quest selesai / total quest
  let fQue = 0;
  if (typeof ambilQuests === "function" && typeof questSelesaiSet === "function") {
    const quests = await ambilQuests();
    const set = await questSelesaiSet();
    const done = quests.filter((q) => set.has(q.id)).length;
    fQue = quests.length ? done / quests.length : 0;
  }

  return { tabungan: fTab, level: fLvl, quest: fQue };
}

// Skor gabungan (rata-rata berbobot) → { pct: 0..100, f: {komponen} }
function progressGabungan() {
  const f = { waktu: fraksiWaktu(), ..._fraksiData };
  const b = BOBOT_PROGRESS;
  const tot = b.waktu + b.tabungan + b.level + b.quest;
  const skor = (f.waktu*b.waktu + f.tabungan*b.tabungan + f.level*b.level + f.quest*b.quest) / tot;
  return { pct: skor * 100, f };
}

// ── Bangun elemen cover ─────────────────────────────────────────────────
async function coverJepang() {
  _fraksiData = await hitungFraksiData();
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
          <span>Kesiapan menuju keberangkatan</span>
          <span id="cover-persen">0%</span>
        </div>
        <div class="cover-bar"><span id="cover-bar-isi" style="width:0%"></span></div>
        <div class="cover-rincian">
          <span><b id="rinci-waktu">0%</b> Waktu</span>
          <span><b id="rinci-tabungan">0%</b> Tabungan</span>
          <span><b id="rinci-level">0%</b> Level/XP</span>
          <span><b id="rinci-quest">0%</b> Quest</span>
        </div>
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

// ── Satu interval global (waktu tiap detik; data lain dari cache render) ──
let _coverInterval = null;
function mulaiCoverJam() {
  if (!window.matchMedia || !window.matchMedia("(min-width: 900px)").matches) return;
  const setTxt = (id, teks) => { const e = document.getElementById(id); if (e) e.textContent = teks; };

  const tik = () => {
    const box = document.getElementById("cover-hitung");
    if (!box) return; // cover sedang tidak tampil
    const t = hitungMundur(TARGET_JEPANG);
    box.querySelector('[data-u="tahun"]').textContent = pad2(t.tahun);
    box.querySelector('[data-u="bulan"]').textContent = pad2(t.bulan);
    box.querySelector('[data-u="hari"]').textContent  = pad2(t.hari);
    setTxt("cover-jam", `${pad2(t.jam)} : ${pad2(t.menit)} : ${pad2(t.detik)}`);

    const { pct, f } = progressGabungan();
    const isi = document.getElementById("cover-bar-isi");
    if (isi) isi.style.width = pct.toFixed(1) + "%";
    setTxt("cover-persen", pct.toFixed(pct < 10 ? 1 : 0) + "%");

    const p = (x) => (x * 100).toFixed(x < 0.1 ? 1 : 0) + "%";
    setTxt("rinci-waktu",    p(f.waktu));
    setTxt("rinci-tabungan", p(f.tabungan));
    setTxt("rinci-level",    p(f.level));
    setTxt("rinci-quest",    p(f.quest));
  };

  tik();
  if (!_coverInterval) _coverInterval = setInterval(tik, 1000);
}