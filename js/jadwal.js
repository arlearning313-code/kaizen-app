// js/jadwal.js — Tab "Jadwal Harian": tempatkan habit di jam berapa (format 24 jam).
//  • Atur/set: DESKTOP saja (jam melingkar + panel Rencana + form).
//  • Lihat hasil: DESKTOP (jam melingkar) & MOBILE (daftar vertikal, read-only).
//  • Data: 1 record di store "settings" (key "jadwal") → array blok {id, habitId, menit}.
//    menit = menit sejak tengah malam (0..1439). Tidak mengubah skema habit.

// Warna titik: habit diwarnai per kategori; kegiatan manual pakai warna netral.
const WARNA_KATEGORI = {
  "Anti-Corrupt": "#e0574a", "Karier": "#4a90d9", "Fisik": "#4fb286",
  "Spiritual": "#e8b04b", "Mental": "#b57ee6", "Sosial": "#5aa9e6",
  "Emosional": "#e79fb0", "Lainnya": "#8f8db0",
};
const WARNA_MANUAL = "#9aa5b1";
function warnaBlok(b, map) {
  if (b.habitId) { const h = map[b.habitId]; return (h && WARNA_KATEGORI[h.kategori]) || WARNA_KATEGORI["Lainnya"]; }
  return WARNA_MANUAL;
}
function namaBlok(b, map) {
  if (b.habitId) { const h = map[b.habitId]; return h ? h.nama : "(habit terhapus)"; }
  return b.nama || "(kegiatan)";
}

// ── Penyimpanan (pola sama dengan trackers.js / quest.js) ───────────────
async function ambilJadwal() {
  const rec = await ambil("settings", "jadwal");
  return rec && Array.isArray(rec.value) ? rec.value : [];
}
async function simpanJadwal(arr) {
  await simpan("settings", { key: "jadwal", value: arr, diubah: Date.now() });
}
// payload = { habitId } untuk habit, atau { nama } untuk kegiatan manual.
async function tambahBlok(payload, menitUTC) {
  const arr = await ambilJadwal();
  const blok = { id: "blok-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), menitUTC };
  if (payload && payload.habitId) blok.habitId = payload.habitId;
  else if (payload && payload.nama) blok.nama = payload.nama;
  arr.push(blok);
  await simpanJadwal(arr);
}
async function hapusBlok(id) {
  await simpanJadwal((await ambilJadwal()).filter((b) => b.id !== id));
}

// ── Konversi timezone (Model B: blok = instan absolut) ──────────────────
// Blok disimpan sebagai "menit UTC dalam sehari" (0..1439). Tiap device
// menampilkannya sesuai timezone-nya (WIB/WITA/WIT). Indonesia tanpa DST.
function offsetMenit() { return new Date().getTimezoneOffset(); }        // UTC − lokal (WIB = −420)
function menitLokalBlok(b) {
  if (typeof b.menitUTC === "number") return (b.menitUTC - offsetMenit() + 1440) % 1440;
  if (typeof b.menit === "number") return b.menit;   // blok lama (wall-clock) → tampil apa adanya
  return 0;
}
function lokalKeUTC(menitLokal) { return (menitLokal + offsetMenit() + 1440) % 1440; }

// Migrasi sekali: blok lama (.menit) → .menitUTC memakai offset device ini.
// Dipanggil di path DESKTOP saja (tempat Anda mengatur; device Anda WIB).
async function migrasiJadwalUTC() {
  if (!window.matchMedia || !window.matchMedia("(min-width: 900px)").matches) return; // desktop-only (WIB)
  const arr = await ambilJadwal();
  let berubah = false;
  for (const b of arr) {
    if (typeof b.menitUTC !== "number" && typeof b.menit === "number") {
      b.menitUTC = lokalKeUTC(b.menit);
      delete b.menit;
      berubah = true;
    }
  }
  if (berubah) await simpanJadwal(arr);
}

// ── Util waktu ──────────────────────────────────────────────────────────
const jmDua = (n) => String(n).padStart(2, "0");
function menitKeTeks(m) { return `${jmDua(Math.floor(m / 60))}.${jmDua(m % 60)}`; }
function menitSekarang() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function escTeks(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
async function petaHabit() {
  const semua = await ambilSemua("habits");
  const map = {};
  for (const h of semua) map[h.id] = h;
  return map;
}

// ── Geometri jam melingkar (muka 12 jam, ala jam dinding) ───────────────
const JAM_CX = 180, JAM_CY = 180, JAM_R = 140, JAM_HUB = 60;

// Paruh hari yang ditampilkan: "pagi" (00–12) atau "malam" (12–24). Bisa di-flip.
let _paruh = null;
function paruhSekarang() { return menitSekarang() < 720 ? "pagi" : "malam"; }

// Titik pada muka 12 jam. mInHalf = menit dalam paruh (0..719); 0 = atas, searah jarum jam.
function titikJam12(r, mInHalf) {
  const th = (mInHalf / 720) * 2 * Math.PI;
  return [JAM_CX + r * Math.sin(th), JAM_CY - r * Math.cos(th)];
}

function svgJam(blok, map) {
  const paruh = _paruh || (_paruh = paruhSekarang());
  const basisJam = paruh === "malam" ? 12 : 0;          // label 00–11 atau 12–23

  let ticks = "", labels = "";
  for (let hh = 0; hh < 12; hh++) {
    const mInHalf = hh * 60, mayor = hh % 3 === 0;      // mayor di 12/3/6/9 (atas/kanan/bawah/kiri)
    const [x1, y1] = titikJam12(JAM_R - (mayor ? 12 : 6), mInHalf);
    const [x2, y2] = titikJam12(JAM_R, mInHalf);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" `
      + `stroke="${mayor ? "rgba(232,176,75,.55)" : "rgba(255,255,255,.16)"}" stroke-width="${mayor ? 2 : 1}"/>`;
    const [lx, ly] = titikJam12(JAM_R + 20, mInHalf);
    labels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" class="jam-label${mayor ? " mayor" : ""}" text-anchor="middle" dominant-baseline="central">${jmDua(hh + basisJam)}</text>`;
  }

  let dots = "";
  for (const b of blok) {
    const mLokal = menitLokalBlok(b);
    if ((mLokal < 720 ? "pagi" : "malam") !== paruh) continue;   // hanya blok di paruh aktif
    const warna = warnaBlok(b, map);
    const [x, y] = titikJam12(JAM_R, mLokal % 720);
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${warna}" stroke="#0d1230" stroke-width="2">`
      + `<title>${menitKeTeks(mLokal)} — ${escTeks(namaBlok(b, map))}</title></circle>`;
  }

  const now = menitSekarang();
  const cocok = (now < 720 ? "pagi" : "malam") === paruh;      // jarum penuh hanya di paruh saat ini
  const [sx, sy] = titikJam12(JAM_HUB - 6, now % 720);
  const [ex, ey] = titikJam12(JAM_R - 4, now % 720);

  return `
    <svg viewBox="0 0 360 360" class="jam-svg" role="img" aria-label="Jam ${paruh}">
      <circle cx="${JAM_CX}" cy="${JAM_CY}" r="${JAM_R}" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="14"/>
      ${ticks}${labels}${dots}
      <line id="jam-jarum" class="jam-jarum" style="opacity:${cocok ? 1 : .28}" x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}"/>
      <circle cx="${JAM_CX}" cy="${JAM_CY}" r="${JAM_HUB}" fill="rgba(8,11,32,.85)" stroke="rgba(255,255,255,.08)"/>
      <circle class="jam-pusat" cx="${JAM_CX}" cy="${JAM_CY}" r="5"/>
      <text id="jam-teks" class="jam-tengah" x="${JAM_CX}" y="${JAM_CY - 4}" text-anchor="middle">${menitKeTeks(now)}</text>
      <text class="jam-tengah-sub" x="${JAM_CX}" y="${JAM_CY + 18}" text-anchor="middle">${paruh === "malam" ? "MALAM" : "PAGI"}</text>
    </svg>`;
}

// ── DESKTOP: view #jadwal (jam + Rencana + form) ────────────────────────
async function renderJadwal() {
  const el = document.getElementById("jadwal");
  if (!el) return;
  el.innerHTML = "";

  await migrasiJadwalUTC();                                   // ← migrasi blok lama sekali (di WIB)
  const blok = (await ambilJadwal()).slice().sort((a, b) => menitLokalBlok(a) - menitLokalBlok(b));
  const map = await petaHabit();

  const head = document.createElement("div");
  head.innerHTML = `<h2 class="manajer-judul">Jadwal Harian</h2>`
    + `<p class="jadwal-sub">Susun harimu sebagai busur waktu — atur di sini, lihat hasilnya di mana saja.</p>`;
  el.appendChild(head);

  const grid = document.createElement("div");
  grid.className = "jadwal-grid";

  const jamCard = document.createElement("div");
  jamCard.className = "dash-card jadwal-jam-card";
  const flip = document.createElement("button");
  flip.className = "jadwal-flip";
  const jamWrap = document.createElement("div");
  jamWrap.className = "jadwal-jam-svg";
  const gambar = () => {
    if (!_paruh) _paruh = paruhSekarang();
    flip.innerHTML = (_paruh === "malam")
      ? `🌙 Malam · 12–24 <span>⇄</span>`
      : `☀️ Pagi · 00–12 <span>⇄</span>`;
    jamWrap.innerHTML = svgJam(blok, map);
  };
  flip.addEventListener("click", () => {
    _paruh = (_paruh === "malam") ? "pagi" : "malam";
    gambar();
    mulaiJamJarum();
  });
  gambar();
  jamCard.append(flip, jamWrap);
  grid.appendChild(jamCard);

  const side = document.createElement("div");
  side.className = "jadwal-side";

  const rencana = document.createElement("div");
  rencana.className = "dash-card";
  rencana.innerHTML = `<h3 class="dash-judul">Rencana · ${blok.length} blok</h3>`;
  const list = document.createElement("div");
  list.className = "jadwal-list";
  if (blok.length === 0) {
    const p = document.createElement("p");
    p.className = "dash-teks";
    p.textContent = "Belum ada blok. Tambahkan lewat form di bawah.";
    list.appendChild(p);
  } else {
    for (const b of blok) {
      const row = document.createElement("div");
      row.className = "jadwal-row";
      const dot = document.createElement("span");
      dot.className = "jadwal-dot";
      dot.style.background = warnaBlok(b, map);
      const waktu = document.createElement("span");
      waktu.className = "jadwal-waktu";
      waktu.textContent = menitKeTeks(menitLokalBlok(b));      // ← waktu device
      const nama = document.createElement("span");
      nama.className = "jadwal-nama";
      nama.textContent = namaBlok(b, map);      const del = document.createElement("button");
      del.className = "tombol jadwal-hapus";
      del.textContent = "✕";
      del.title = "Hapus blok";
      del.addEventListener("click", async () => { await hapusBlok(b.id); await refreshJadwal(); });
      row.append(dot, waktu, nama, del);
      list.appendChild(row);
    }
  }
  rencana.appendChild(list);
  side.appendChild(rencana);

  const formCard = document.createElement("div");
  formCard.className = "dash-card";
  formCard.innerHTML = `<h3 class="dash-judul">Tambah blok</h3>`;
  const form = document.createElement("div");
  form.className = "jadwal-form";

  const sel = document.createElement("select");
  sel.className = "modal-input";
  const aktif = Object.values(map).filter((h) => h.aktif)
    .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  for (const h of aktif) {
    const opt = document.createElement("option");
    opt.value = h.id;
    opt.textContent = h.nama;
    sel.appendChild(opt);
  }
  const optManual = document.createElement("option");
  optManual.value = "__manual__";
  optManual.textContent = "✏️ Kegiatan manual…";
  sel.appendChild(optManual);

  // Nama untuk kegiatan manual (mis. Tidur, Kursus Python) — muncul saat opsi manual dipilih.
  const namaManual = document.createElement("input");
  namaManual.type = "text";
  namaManual.className = "modal-input";
  namaManual.placeholder = "Nama kegiatan (mis. Tidur, Kursus Python)";
  const sinkronManual = () => { namaManual.style.display = sel.value === "__manual__" ? "" : "none"; };
  sel.addEventListener("change", sinkronManual);
  sinkronManual();

  const time = document.createElement("input");
  time.type = "time";
  time.className = "modal-input";
  time.value = "08:00";

  const btn = document.createElement("button");
  btn.className = "tombol tombol-utama";
  btn.textContent = "+ Blok";
  btn.addEventListener("click", async () => {
    const [jj, mm] = (time.value || "").split(":").map(Number);
    if (Number.isNaN(jj) || Number.isNaN(mm)) { alert("Waktu tidak valid."); return; }
    let payload;
    if (sel.value === "__manual__") {
      const nama = namaManual.value.trim();
      if (!nama) { alert("Isi nama kegiatannya dulu."); return; }
      payload = { nama };
    } else {
      if (!sel.value) { alert("Pilih habit atau kegiatan manual."); return; }
      payload = { habitId: sel.value };
    }
    await tambahBlok(payload, lokalKeUTC(jj * 60 + mm));    // ← wall-clock WIB → UTC
    if (sel.value === "__manual__") namaManual.value = "";
    await refreshJadwal();
  });

  form.append(sel, namaManual, time, btn);
  formCard.appendChild(form);
  side.appendChild(formCard);

  grid.appendChild(side);
  el.appendChild(grid);

  mulaiJamJarum();
}

// ── MOBILE: daftar vertikal read-only (#jadwal-mobile di dalam .app) ────
async function renderJadwalMobile() {
  const el = document.getElementById("jadwal-mobile");
  if (!el) return;
  el.innerHTML = "";

  const judul = document.createElement("h2");
  judul.className = "jadwal-mobile-judul";
  judul.textContent = "Jadwal Harian";
  el.appendChild(judul);

  const blok = (await ambilJadwal()).slice().sort((a, b) => menitLokalBlok(a) - menitLokalBlok(b));
  if (blok.length === 0) {
    const p = document.createElement("p");
    p.className = "jadwal-mkosong";
    p.textContent = "Belum ada jadwal di perangkat ini. Atur blok lewat desktop, lalu Ekspor → Impor agar muncul di sini.";
    el.appendChild(p);
    return;
  }
  const map = await petaHabit();

  const ul = document.createElement("ul");
  ul.className = "jadwal-mlist";
  for (const b of blok) {
    const li = document.createElement("li");
    li.className = "jadwal-mrow";
    const t = document.createElement("span");
    t.className = "jadwal-mwaktu";
    t.textContent = menitKeTeks(menitLokalBlok(b));            // ← waktu device (WITA/WIT/WIB)
    const dot = document.createElement("span");
    dot.className = "jadwal-dot";
    dot.style.background = warnaBlok(b, map);
    const nama = document.createElement("span");
    nama.className = "jadwal-mnama";
    nama.textContent = namaBlok(b, map);    li.append(t, dot, nama);
    ul.appendChild(li);
  }
  el.appendChild(ul);
}

async function refreshJadwal() {
  await renderJadwal();
  if (typeof renderJadwalMobile === "function") await renderJadwalMobile();
}

// ── Jarum waktu hidup (desktop saja) ────────────────────────────────────
let _jamInterval = null;
function mulaiJamJarum() {
  if (!window.matchMedia || !window.matchMedia("(min-width: 900px)").matches) return;
  const tik = () => {
    const svg = document.querySelector("#jadwal .jam-svg");
    if (!svg) return;
    const now = menitSekarang();
    const cocok = (now < 720 ? "pagi" : "malam") === _paruh;
    const [sx, sy] = titikJam12(JAM_HUB - 6, now % 720);
    const [ex, ey] = titikJam12(JAM_R - 4, now % 720);
    const jarum = svg.querySelector("#jam-jarum");
    if (jarum) {
      jarum.setAttribute("x1", sx.toFixed(1)); jarum.setAttribute("y1", sy.toFixed(1));
      jarum.setAttribute("x2", ex.toFixed(1)); jarum.setAttribute("y2", ey.toFixed(1));
      jarum.style.opacity = cocok ? 1 : 0.28;
    }
    const teks = svg.querySelector("#jam-teks");
    if (teks) teks.textContent = menitKeTeks(now);
  };
  tik();
  if (!_jamInterval) _jamInterval = setInterval(tik, 15000);
}