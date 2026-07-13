// js/jadwal.js — Tab "Jadwal Harian": tempatkan habit di jam berapa (format 24 jam).
//  • Atur/set: DESKTOP saja (jam melingkar + panel Rencana + form).
//  • Lihat hasil: DESKTOP (jam melingkar) & MOBILE (daftar vertikal, read-only).
//  • Data: 1 record di store "settings" (key "jadwal") → array blok {id, habitId, menit}.
//    menit = menit sejak tengah malam (0..1439). Tidak mengubah skema habit.

// Palet rarity — sama dengan yang dipakai di CSS (.app .baris[data-rarity]).
const WARNA_RARITY = { common: "#8f8db0", rare: "#5aa9e6", epic: "#b57ee6", legendary: "#e8b04b" };

// ── Penyimpanan (pola sama dengan trackers.js / quest.js) ───────────────
async function ambilJadwal() {
  const rec = await ambil("settings", "jadwal");
  return rec && Array.isArray(rec.value) ? rec.value : [];
}
async function simpanJadwal(arr) {
  await simpan("settings", { key: "jadwal", value: arr, diubah: Date.now() });
}
async function tambahBlok(habitId, menitUTC) {
  const arr = await ambilJadwal();
  arr.push({ id: "blok-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), habitId, menitUTC });
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

// ── Geometri jam melingkar ──────────────────────────────────────────────
const JAM_CX = 180, JAM_CY = 180, JAM_R = 140, JAM_HUB = 60;
function titikJam(r, m) {
  const th = (m / 1440) * 2 * Math.PI;               // 0:00 di atas, searah jarum jam
  return [JAM_CX + r * Math.sin(th), JAM_CY - r * Math.cos(th)];
}

function svgJam(blok, map) {
  let ticks = "", labels = "";
  for (let h = 0; h < 24; h++) {
    const m = h * 60, mayor = h % 3 === 0;
    const [x1, y1] = titikJam(JAM_R - (mayor ? 12 : 6), m);
    const [x2, y2] = titikJam(JAM_R, m);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" `
      + `stroke="${mayor ? "rgba(232,176,75,.55)" : "rgba(255,255,255,.16)"}" stroke-width="${mayor ? 2 : 1}"/>`;
    if (mayor) {
      const [lx, ly] = titikJam(JAM_R + 20, m);
      labels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" class="jam-label" text-anchor="middle" dominant-baseline="central">${jmDua(h)}</text>`;
    }
  }

  let dots = "";
  for (const b of blok) {
    const h = map[b.habitId];
    const warna = WARNA_RARITY[h && h.rarity] || WARNA_RARITY.common;
    const mLokal = menitLokalBlok(b);                       // ← konversi ke waktu device
    const [x, y] = titikJam(JAM_R, mLokal);
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${warna}" stroke="#0d1230" stroke-width="2">`
      + `<title>${menitKeTeks(mLokal)} — ${escTeks(h ? h.nama : "(terhapus)")}</title></circle>`;
  }

  const now = menitSekarang();
  const [sx, sy] = titikJam(JAM_HUB - 6, now);
  const [ex, ey] = titikJam(JAM_R - 4, now);

  return `
    <svg viewBox="0 0 360 360" class="jam-svg" role="img" aria-label="Jam 24 jam">
      <circle cx="${JAM_CX}" cy="${JAM_CY}" r="${JAM_R}" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="14"/>
      ${ticks}${labels}${dots}
      <line id="jam-jarum" class="jam-jarum" x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}"/>
      <circle cx="${JAM_CX}" cy="${JAM_CY}" r="${JAM_HUB}" fill="rgba(8,11,32,.85)" stroke="rgba(255,255,255,.08)"/>
      <circle class="jam-pusat" cx="${JAM_CX}" cy="${JAM_CY}" r="5"/>
      <text id="jam-teks" class="jam-tengah" x="${JAM_CX}" y="${JAM_CY - 4}" text-anchor="middle">${menitKeTeks(now)}</text>
      <text class="jam-tengah-sub" x="${JAM_CX}" y="${JAM_CY + 18}" text-anchor="middle">HARI INI</text>
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
  jamCard.innerHTML = svgJam(blok, map);
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
      const h = map[b.habitId];
      const row = document.createElement("div");
      row.className = "jadwal-row";
      const dot = document.createElement("span");
      dot.className = "jadwal-dot";
      dot.style.background = WARNA_RARITY[h && h.rarity] || WARNA_RARITY.common;
      const waktu = document.createElement("span");
      waktu.className = "jadwal-waktu";
      waktu.textContent = menitKeTeks(menitLokalBlok(b));      // ← waktu device
      const nama = document.createElement("span");
      nama.className = "jadwal-nama";
      nama.textContent = h ? h.nama : "(habit terhapus)";
      const del = document.createElement("button");
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
  if (aktif.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "(tidak ada habit aktif)";
    sel.appendChild(opt);
  }
  for (const h of aktif) {
    const opt = document.createElement("option");
    opt.value = h.id;
    opt.textContent = h.nama;
    sel.appendChild(opt);
  }

  const time = document.createElement("input");
  time.type = "time";
  time.className = "modal-input";
  time.value = "08:00";

  const btn = document.createElement("button");
  btn.className = "tombol tombol-utama";
  btn.textContent = "+ Blok";
  btn.addEventListener("click", async () => {
    if (!sel.value) { alert("Pilih habit dulu."); return; }
    const [jj, mm] = (time.value || "").split(":").map(Number);
    if (Number.isNaN(jj) || Number.isNaN(mm)) { alert("Waktu tidak valid."); return; }
    await tambahBlok(sel.value, lokalKeUTC(jj * 60 + mm));    // ← wall-clock WIB → UTC
    await refreshJadwal();
  });

  form.append(sel, time, btn);
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

  const blok = (await ambilJadwal()).slice().sort((a, b) => menitLokalBlok(a) - menitLokalBlok(b));
  if (blok.length === 0) return;
  const map = await petaHabit();

  const judul = document.createElement("h2");
  judul.className = "jadwal-mobile-judul";
  judul.textContent = "Jadwal Harian";
  el.appendChild(judul);

  const ul = document.createElement("ul");
  ul.className = "jadwal-mlist";
  for (const b of blok) {
    const h = map[b.habitId];
    const li = document.createElement("li");
    li.className = "jadwal-mrow";
    const t = document.createElement("span");
    t.className = "jadwal-mwaktu";
    t.textContent = menitKeTeks(menitLokalBlok(b));            // ← waktu device (WITA/WIT/WIB)
    const dot = document.createElement("span");
    dot.className = "jadwal-dot";
    dot.style.background = WARNA_RARITY[h && h.rarity] || WARNA_RARITY.common;
    const nama = document.createElement("span");
    nama.className = "jadwal-mnama";
    nama.textContent = h ? h.nama : "(habit terhapus)";
    li.append(t, dot, nama);
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
    const [sx, sy] = titikJam(JAM_HUB - 6, now);
    const [ex, ey] = titikJam(JAM_R - 4, now);
    const jarum = svg.querySelector("#jam-jarum");
    if (jarum) {
      jarum.setAttribute("x1", sx.toFixed(1)); jarum.setAttribute("y1", sy.toFixed(1));
      jarum.setAttribute("x2", ex.toFixed(1)); jarum.setAttribute("y2", ey.toFixed(1));
    }
    const teks = svg.querySelector("#jam-teks");
    if (teks) teks.textContent = menitKeTeks(now);
  };
  tik();
  if (!_jamInterval) _jamInterval = setInterval(tik, 15000);
}