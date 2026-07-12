// kaizen.js — MODUL 6 (disempurnakan di Modul 15B): leveling per habit
// mengikuti tangga "levels". Naik ke level BERIKUTNYA di tangga hanya setelah
// dikuasai (≥ rateMinimal selama hariMinimal). Menawarkan, tak memaksa.

// Tanggal "jumlahHari" hari lalu (termasuk hari ini) → "YYYY-MM-DD".
function tanggalMundur(jumlahHari) {
  const d = new Date();
  d.setDate(d.getDate() - jumlahHari + 1);
  const y = d.getFullYear();
  const b = String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0");
  return `${y}-${b}-${t}`;
}

// Tingkat keberhasilan habit (0–1) selama jendela hari terakhir.
// "mulai" (opsional) = jangan hitung hari sebelum level ini dimulai.
async function keberhasilanHabit(habitId, jumlahHari, mulai = null) {
  let batas = tanggalMundur(jumlahHari);
  if (mulai && mulai > batas) batas = mulai;

  const logs = await ambilSemua("logs");
  const hariSelesai = new Set(
    logs
      .filter((l) => l.habitId === habitId && l.status === "done" && l.date >= batas)
      .map((l) => l.date)
  );
  return hariSelesai.size / jumlahHari;
}

// Indeks level yang sedang aktif di dalam array levels.
function indeksLevelSekarang(habit) {
  const idx = habit.levels.findIndex((l) => l.level === habit.levelSekarang);
  return idx === -1 ? 0 : idx;
}

// Cek apakah satu habit layak naik ke level BERIKUTNYA. Kembalikan tawaran atau null.
async function cekNaikHabit(habit) {
  if (!Array.isArray(habit.levels) || habit.levels.length <= 1) return null; // tak bertangga
  const idx = indeksLevelSekarang(habit);
  if (idx >= habit.levels.length - 1) return null;                           // sudah di puncak

  const aturan = KONFIG.aturanKaizen;
  const rate = await keberhasilanHabit(habit.id, aturan.hariMinimal, habit.mulaiLevelIni || null);
  if (rate < aturan.rateMinimal) return null;                               // belum dikuasai — tanpa hukuman

  const berikut = habit.levels[idx + 1];
  return { levelBaru: berikut.level, targetBaru: berikut.target, milestoneBaru: berikut.milestone };
}

// Terapkan kenaikan: pindah ke level berikutnya di tangga.
async function naikkanHabit(habit, levelBaru) {
  habit.levelSekarang = levelBaru;
  habit.mulaiLevelIni = tanggalHariIni(); // reset hitungan hariMinimal
  habit.diubah = Date.now();
  await simpan("habits", habit);
}

// Tawarkan kenaikan untuk semua habit yang layak (tidak memaksa).
async function tawarkanKaizen() {
  const habits = await ambilSemua("habits");
  for (const h of habits) {
    const tawaran = await cekNaikHabit(h);
    if (!tawaran) continue;

    const setuju = confirm(
      `🌱 "${h.nama}" sudah kamu kuasai.\n\n` +
      `Naik ke Level ${tawaran.levelBaru}` +
      (tawaran.milestoneBaru ? ` — ${tawaran.milestoneBaru}` : "") + `?\n` +
      (tawaran.targetBaru ? `Target baru: ${tawaran.targetBaru}` : "")
    );
    if (setuju) {
      await naikkanHabit(h, tawaran.levelBaru);
      alert(`"${h.nama}" naik ke Level ${tawaran.levelBaru}. 1% lebih baik. 📈`);
    }
  }
  if (typeof tampilkanChecklist === "function") await tampilkanChecklist();
  if (typeof renderManajer === "function") await renderManajer();
}