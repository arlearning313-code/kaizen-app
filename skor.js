// skor.js — MODUL 4: Mesin skor harian (persentase). Filosofis: tak pernah menghukum.

const HARI_BAIK = 70; // ambang "hari baik" dalam persen

// Hitung skor satu hari. Kembalikan null bila TAK ADA habit jatuh tempo —
// hari tanpa kewajiban tidak boleh dihukum jadi 0%.
async function skorHari(tanggal) {
  const jatuhTempo = await habitHariIni(tanggal);   // dari Modul 3 (ui.js)
  if (jatuhTempo.length === 0) return null;          // "kosong", bukan 0

  const logs = await ambilPerTanggal(tanggal);
  const selesaiSet = new Set(
    logs.filter((l) => l.status === "done").map((l) => l.habitId)
  );
  const selesai = jatuhTempo.filter((h) => selesaiSet.has(h.id)).length;

  return Math.round((selesai / jatuhTempo.length) * 100);
}

// true kalau skor termasuk "hari baik" (>= 70%).
function hariBaik(skor) {
  return skor !== null && skor >= HARI_BAIK;
}