// kaizen.js — MODUL 6: Leveling per habit. Naik target maks +20%,
// hanya setelah dikuasai (≥80% selama 21 hari). Menawarkan, tak memaksa.

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

// Cek apakah satu habit layak naik level. Kembalikan tawaran atau null.
async function cekNaikHabit(habit) {
  if (!habit.kaizen) return null;                 // habit ya/tidak → tak ada leveling
  const aturan = KONFIG.aturanKaizen;

  const rate = await keberhasilanHabit(habit.id, aturan.hariMinimal, habit.kaizen.mulaiLevelIni || null);
  if (rate < aturan.rateMinimal) return null;     // belum saatnya — tanpa hukuman

  const targetBaru = Math.min(
    Math.round(habit.kaizen.target * aturan.faktor),
    habit.kaizen.targetMaks
  );
  if (targetBaru <= habit.kaizen.target) return null; // sudah mentok di targetMaks
  return { targetSekarang: habit.kaizen.target, targetBaru };
}

// Terapkan kenaikan level pada satu habit.
async function naikkanHabit(habit, targetBaru) {
  habit.kaizen.level += 1;
  habit.kaizen.target = targetBaru;
  habit.kaizen.mulaiLevelIni = tanggalHariIni(); // reset hitungan 21 hari
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
      `Naik level? Target baru: ${tawaran.targetBaru} ${h.kaizen.satuan} ` +
      `(dari ${tawaran.targetSekarang}).`
    );
    if (setuju) {
      await naikkanHabit(h, tawaran.targetBaru);
      alert(`"${h.nama}" naik ke level ${h.kaizen.level}. 1% lebih baik. 📈`);
    }
  }
  if (typeof tampilkanChecklist === "function") await tampilkanChecklist();
}