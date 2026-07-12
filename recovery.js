// recovery.js — MODUL 7: Recovery Mode (sekring pelindung) & Never Miss Twice.

function formatTanggal(d) {
  const y = d.getFullYear();
  const b = String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0");
  return `${y}-${b}-${t}`;
}
function tanggalKemarin() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatTanggal(d);
}

// Selisih hari antara dua tanggal "YYYY-MM-DD".
function selisihHari(tglAwal, tglAkhir) {
  const a = new Date(tglAwal + "T00:00:00");
  const b = new Date(tglAkhir + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

// Rata-rata keberhasilan (0–1) selama N hari terakhir (abaikan hari tanpa kewajiban).
async function keberhasilanKeseluruhan(jumlahHari) {
  const logs = await ambilSemua("logs");
  if (logs.length === 0) return null;
  const pertama = logs.map((l) => l.date).sort()[0];   // tanggal log paling awal

  let total = 0, hitung = 0;
  for (let i = 0; i < jumlahHari; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const tgl = formatTanggal(d);
    if (tgl < pertama) continue;                        // abaikan hari sebelum kamu mulai
    const skor = await skorHari(tgl);
    if (skor !== null) { total += skor; hitung++; }
  }
  return hitung === 0 ? null : (total / hitung) / 100;
}

// Turunkan semua habit ber-tangga kembali ke level pertama.
async function turunkanSemuaKeLevel1() {
  const habits = await ambilSemua("habits");
  for (const h of habits) {
    if (!Array.isArray(h.levels) || h.levels.length <= 1) continue;
    h.levelSekarang = h.levels[0].level; // kembali ke level pertama
    h.mulaiLevelIni = tanggalHariIni();
    h.diubah = Date.now();
    await simpan("habits", h);
  }
}

// Cek & atur Recovery Mode otomatis.
async function cekRecovery() {
  const k = await ambilKarakter();

  if (!k.recovery) {
    // Jangan menilai "slump" sebelum ada cukup riwayat (min. 14 hari sejak log pertama).
    const logs = await ambilSemua("logs");
    if (logs.length === 0) return false;
    const pertama = logs.map((l) => l.date).sort()[0];
    if (selisihHari(pertama, formatTanggal(new Date())) < 14) return false;

    const rate14 = await keberhasilanKeseluruhan(14);
    if (rate14 !== null && rate14 < 0.30) {
      k.recovery = true;
      k.diubah = Date.now();
      await simpan("character", k);
      await turunkanSemuaKeLevel1();
      alert("Recovery Mode aktif. Ini sekring pelindung, bukan hukuman.\nFokus 3 habit termudah dulu. 🛡️");
    }
  } else {
    const rate7 = await keberhasilanKeseluruhan(7);
    if (rate7 !== null && rate7 >= 0.60) {
      k.recovery = false;
      k.diubah = Date.now();
      await simpan("character", k);
      alert("Kamu pulih. Recovery Mode nonaktif — selamat datang kembali. 🌤️");
    }
  }
  return k.recovery;
}

// Never Miss Twice: himpunan habitId yang KEMARIN jatuh tempo tapi tak selesai.
// Hanya berlaku kalau kemarin kamu memang aktif (menyelesaikan minimal 1 habit).
async function habitTerlewatKemarin() {
  const kemarin = tanggalKemarin();
  const logsKemarin = await ambilPerTanggal(kemarin);
  const doneSet = new Set(logsKemarin.filter((l) => l.status === "done").map((l) => l.habitId));
  if (doneSet.size === 0) return new Set();   // tak aktif kemarin → bukan "miss"

  const dueKemarin = await habitHariIni(kemarin);
  return new Set(dueKemarin.filter((h) => !doneSet.has(h.id)).map((h) => h.id));
}


// ── MODUL 17: Aturan Delevel — sinyal restrukturisasi, bukan hukuman ──
// TIDAK men-delevel karena: relapse (sudah = Failure Debrief), sakit 1–2 hari,
// atau gagal di level tertinggi sebuah habit (itu menurunkan level HABIT, bukan karakter).

// Berapa hari berturut (dari hari ini mundur) skor < ambangPersen.
async function hitungHariBerturutRendah(ambangPersen) {
  const logs = await ambilSemua("logs");
  if (logs.length === 0) return 0;
  const pertama = logs.map((l) => l.date).sort()[0];
  let berturut = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const tgl = formatTanggal(d);
    if (tgl < pertama) break;              // sebelum kamu mulai → berhenti
    const skor = await skorHari(tgl);
    if (skor === null) continue;           // hari tanpa kewajiban → tak memutus
    if (skor < ambangPersen) berturut++;
    else break;                            // ada hari yang cukup → putus
  }
  return berturut;
}

// Berapa hari berturut semua habit Tier S (aktif) diabaikan.
async function hitungHariTierSDiabaikan() {
  const logs = await ambilSemua("logs");
  if (logs.length === 0) return 0;
  const pertama = logs.map((l) => l.date).sort()[0];
  const tierS = (await ambilSemua("habits")).filter((h) => h.aktif && h.tier === "S");
  if (tierS.length === 0) return 0;
  const idS = new Set(tierS.map((h) => h.id));
  let berturut = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const tgl = formatTanggal(d);
    if (tgl < pertama) break;
    const logHari = await ambilPerTanggal(tgl);
    if (logHari.some((l) => l.status === "done" && idS.has(l.habitId))) break;
    berturut++;
  }
  return berturut;
}

// Berapa hari sejak habit APA PUN terakhir diselesaikan.
async function hariTanpaHabit() {
  const logs = await ambilSemua("logs");
  const doneDates = logs.filter((l) => l.status === "done").map((l) => l.date).sort();
  if (doneDates.length === 0) return 0;   // belum pernah → jangan hukum
  return selisihHari(doneDates[doneDates.length - 1], formatTanggal(new Date()));
}

async function turunLevel(jumlah, alasan) {
  const k = await ambilKarakter();
  if (k.level <= 1) return;
  k.level = Math.max(1, k.level - jumlah);
  k.diubah = Date.now();
  await simpan("character", k);
  alert(`⬇️ Delevel — turun ke Level ${k.level}.\n${alasan}\n\nIni sinyal untuk menata ulang, bukan hukuman. 🕊️`);
}

async function turunLevelKe(target, alasan) {
  const k = await ambilKarakter();
  if (k.level <= target) return;
  k.level = target;
  k.diubah = Date.now();
  await simpan("character", k);
  alert(`⬇️ Delevel — kembali ke Level ${k.level}.\n${alasan}\n\nBukan hukuman — kesempatan memulai lebih ringan. 🕊️`);
}

// Periksa semua trigger delevel. Cukup sekali per hari.
async function cekDelevel() {
  const k = await ambilKarakter();
  const hariIni = tanggalHariIni();
  if (k.delevelDicekPada === hariIni) return;   // sudah dicek hari ini → jangan menumpuk
  k.delevelDicekPada = hariIni;
  await simpan("character", k);

  const tanpa = await hariTanpaHabit();
  if (tanpa >= 60) return turunLevelKe(1, "60 hari tanpa satu pun habit — mulai lagi dari awal.");
  if (tanpa >= 30) return turunLevel(2, "30 hari tanpa satu pun habit.");

  if ((await hitungHariBerturutRendah(30)) >= 21)
    return turunLevel(1, "21 hari berturut skor di bawah 30%.");

  if ((await hitungHariTierSDiabaikan()) >= 7)
    return turunLevel(1, "Semua habit Tier S terlewat 7 hari berturut.");
}