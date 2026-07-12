// achievements.js — MODUL 9: Buka trophy otomatis saat kondisinya terpenuhi.

// Daftar tanggal unik yang punya minimal 1 habit selesai.
async function hariHariUnik() {
  const logs = await ambilSemua("logs");
  const set = new Set(logs.filter((l) => l.status === "done").map((l) => l.date));
  return [...set];
}

// Periksa semua trophy; buka yang kondisinya kini benar.
async function cekAchievements() {
  const trophies = KONFIG.trophies || [];
  const terbuka = new Set((await ambilSemua("achievements")).map((a) => a.id));
  const baru = [];

  for (const t of trophies) {
    if (terbuka.has(t.id)) continue;          // sudah terbuka → lewati
    if (await t.kondisi()) {
      await simpan("achievements", {
        id: t.id,
        nama: t.nama,
        hadiah: t.hadiah,
        dibuka: new Date().toISOString(),
      });
      baru.push(t);
    }
  }

  for (const t of baru) tampilkanTrophy(t);   // notifikasi kecil per trophy baru
  return baru;
}

// Notifikasi "toast" kecil di layar.
function tampilkanTrophy(trophy) {
  const toast = document.createElement("div");
  toast.className = "toast-trophy";

  const judul = document.createElement("strong");
  judul.textContent = `🏆 ${trophy.nama}`;

  const desk = document.createElement("span");
  desk.textContent = `${trophy.deskripsi}  +${trophy.hadiah} XP`;

  toast.append(judul, desk);
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("keluar"), 3500);
  setTimeout(() => toast.remove(), 4200);
}

// ── MODUL 18: helper kondisi trophy ───────────────────────────────────
function geserTanggal(tgl, delta) {
  const d = new Date(tgl + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return formatTanggal(d); // dari recovery.js
}

// Run terpanjang hari berturut dalam kumpulan tanggal.
function streakMaksTanggal(dates) {
  const set = new Set(dates);
  let maks = 0;
  for (const d of set) {
    if (set.has(geserTanggal(d, -1))) continue; // bukan awal sebuah run
    let len = 1, cur = d;
    while (set.has(geserTanggal(cur, 1))) { cur = geserTanggal(cur, 1); len++; }
    if (len > maks) maks = len;
  }
  return maks;
}

async function tanggalSelesai(habitId) {
  const logs = await ambilSemua("logs");
  return logs.filter((l) => l.status === "done" && l.habitId === habitId).map((l) => l.date);
}
async function streakBebasCorruptionMaks() {
  return streakMaksTanggal(await tanggalSelesai("H-05")); // H-05 = hari bersih
}
async function streakHariAktifMaks() {
  const logs = await ambilSemua("logs");
  return streakMaksTanggal(logs.filter((l) => l.status === "done").map((l) => l.date));
}
async function adaHabitSelesai(habitId) {
  const logs = await ambilSemua("logs");
  return logs.some((l) => l.status === "done" && l.habitId === habitId);
}
async function habitStackSehari(ids) {
  const logs = await ambilSemua("logs");
  const perHari = {};
  for (const l of logs) {
    if (l.status !== "done") continue;
    (perHari[l.date] ||= new Set()).add(l.habitId);
  }
  return Object.values(perHari).some((set) => ids.every((id) => set.has(id)));
}
async function adaJurnalTipe(tipe) {
  const journal = await ambilSemua("journal");
  return journal.some((j) => j.type === tipe);
}
async function gateTerverifikasi(level) {
  const k = await ambilKarakter();
  return !!(k.gateDikonfirmasi && k.gateDikonfirmasi[level]);
}
async function adaFinansial() {
  const s = await ambil("settings", "finansial"); // diisi Modul 20; sampai itu → false
  return !!(s && Array.isArray(s.value) && s.value.length > 0);
}