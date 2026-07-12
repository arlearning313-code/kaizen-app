// trackers.js — MODUL 20: tracker khusus (opsional), tampil di dashboard desktop.
//  (1) Corruption streak + milestone neurobiologis
//  (2) Japan Fund (tabungan bertahap)
//  (3) Penanda level Bahasa Jepang (N5 → N4 → N3)
// Semua data disimpan di store "settings" (ikut ter-backup oleh sync.js).

// ── (1) Corruption streak ──────────────────────────────────────────────
const NEURO_MILESTONE = [
  { hari: 3,  catatan: "Reseptor dopamin mulai pulih; kabut mental menipis." },
  { hari: 7,  catatan: "Seminggu — jalur reward mulai menyeimbangkan diri." },
  { hari: 14, catatan: "Dua minggu — kontrol impuls (prefrontal) menguat." },
  { hari: 30, catatan: "Sebulan — kebiasaan baru mulai terpatri di otak." },
  { hari: 60, catatan: "Dua bulan — sirkuit lama melemah, identitas baru mengeras." },
  { hari: 90, catatan: "90 hari — reset neurologis besar. Kamu bukan orang yang sama." },
];

// Streak berjalan: hari bersih (H-05) berturut yang berakhir hari ini / kemarin.
async function streakCorruptionSaatIni() {
  const dates = new Set(await tanggalSelesai("H-05")); // H-05 = catatan "hari bersih"
  let cur = tanggalHariIni();
  if (!dates.has(cur)) cur = geserTanggal(cur, -1);     // kelonggaran: hari ini belum dicentang
  let streak = 0;
  while (dates.has(cur)) { streak++; cur = geserTanggal(cur, -1); }
  return streak;
}

async function panelCorruption() {
  const card = buatKartu("Bebas Corruption");
  const streak = await streakCorruptionSaatIni();
  const maks = await streakBebasCorruptionMaks();

  const angka = document.createElement("div");
  angka.className = "tracker-angka";
  angka.textContent = `${streak} hari`;
  card.appendChild(angka);

  const sub = document.createElement("p");
  sub.className = "dash-teks";
  sub.textContent = `Rekor terpanjang: ${maks} hari. Centang H-05 tiap hari bersih.`;
  card.appendChild(sub);

  const tercapai = [...NEURO_MILESTONE].reverse().find((m) => m.hari <= streak);
  if (tercapai) {
    const p = document.createElement("p");
    p.className = "dash-teks tracker-neuro";
    p.textContent = `✓ Hari ${tercapai.hari}: ${tercapai.catatan}`;
    card.appendChild(p);
  }
  const berikut = NEURO_MILESTONE.find((m) => m.hari > streak);
  if (berikut) {
    const p = document.createElement("p");
    p.className = "dash-teks";
    p.textContent = `Menuju hari ${berikut.hari} — ${berikut.hari - streak} hari lagi.`;
    card.appendChild(p);
  }
  return card;
}

// ── (2) Japan Fund ─────────────────────────────────────────────────────
const JAPAN_MILESTONE = [25000000, 50000000, 100000000, 185000000];

async function ambilFinansial() {
  const rec = await ambil("settings", "finansial");
  return rec && Array.isArray(rec.value) ? rec.value : [];
}
async function tambahFinansial(jumlah) {
  const arr = await ambilFinansial();
  arr.push({ tgl: tanggalHariIni(), jumlah });
  await simpan("settings", { key: "finansial", value: arr, diubah: Date.now() });
}
function rupiah(n) { return "Rp" + Number(n || 0).toLocaleString("id-ID"); }

async function panelJapanFund() {
  const card = buatKartu("Japan Fund");
  const arr = await ambilFinansial();
  const saldo = arr.length ? arr[arr.length - 1].jumlah : 0;

  const angka = document.createElement("div");
  angka.className = "tracker-angka";
  angka.textContent = rupiah(saldo);
  card.appendChild(angka);

  const next = JAPAN_MILESTONE.find((m) => m > saldo);
  const info = document.createElement("p");
  info.className = "dash-teks";
  info.textContent = next
    ? `${Math.min(100, Math.round((saldo / next) * 100))}% menuju ${rupiah(next)}.`
    : "Semua milestone tercapai. ✈️";
  card.appendChild(info);

  const ul = document.createElement("ul");
  ul.className = "dash-list";
  for (const m of JAPAN_MILESTONE) {
    const li = document.createElement("li");
    li.textContent = `${saldo >= m ? "✅" : "⬜"} ${rupiah(m)}`;
    ul.appendChild(li);
  }
  card.appendChild(ul);

  const wrap = document.createElement("div");
  wrap.className = "tracker-input";
  const inp = document.createElement("input");
  inp.type = "number"; inp.min = "0"; inp.placeholder = "Update saldo (angka)";
  inp.className = "modal-input";
  const btn = document.createElement("button");
  btn.className = "tombol tombol-utama"; btn.textContent = "Simpan";
  btn.addEventListener("click", async () => {
    const v = Number(inp.value);
    if (inp.value === "" || Number.isNaN(v) || v < 0) { alert("Masukkan angka yang benar."); return; }
    await tambahFinansial(v);
    if (typeof cekAchievements === "function") await cekAchievements(); // buka trophy "Tabungan Pertama"
    if (typeof cekNaikLevel === "function") await cekNaikLevel();
    await renderDashboard();
  });
  wrap.append(inp, btn);
  card.appendChild(wrap);
  return card;
}

// ── (3) Level Bahasa Jepang ────────────────────────────────────────────
const JLPT = ["Belum mulai", "N5", "N4", "N3"];

async function ambilBahasa() {
  const rec = await ambil("settings", "bahasaJepang");
  return rec && Number.isInteger(rec.value) ? rec.value : 0;
}
async function setBahasa(idx) {
  await simpan("settings", { key: "bahasaJepang", value: idx, diubah: Date.now() });
}

async function panelBahasa() {
  const card = buatKartu("Bahasa Jepang");
  const lvl = await ambilBahasa();

  const angka = document.createElement("div");
  angka.className = "tracker-angka";
  angka.textContent = JLPT[lvl] || JLPT[0];
  card.appendChild(angka);

  const row = document.createElement("div");
  row.className = "tracker-input";
  JLPT.forEach((nama, i) => {
    const b = document.createElement("button");
    b.className = "tombol" + (i === lvl ? " tombol-utama" : "");
    b.textContent = nama;
    b.addEventListener("click", async () => { await setBahasa(i); await renderDashboard(); });
    row.appendChild(b);
  });
  card.appendChild(row);

  const hint = document.createElement("p");
  hint.className = "dash-teks";
  hint.textContent = "Penanda untuk quest & Skill Gate Jepang (N5 · L18, N4 · L25, N3 · L37).";
  card.appendChild(hint);
  return card;
}
