// character.js — MODUL 5: Mesin XP & Skill Gate (dua gerbang untuk naik level).
// XP dijumlahkan dari data; level naik hanya jika XP cukup DAN Skill Gate dikonfirmasi.

// Ambil baris karakter (selalu 1 baris, id "me"). Buat kalau belum ada.
async function ambilKarakter() {
  let k = await ambil("character", "me");
  if (!k) {
    k = {
      id: "me",
      level: 1,
      recovery: false,
      gateDikonfirmasi: {},   // { "5": true } → gate level 5 sudah dicentang manual
      diubah: Date.now(),
    };
    await simpan("character", k);
  }
  if (!k.gateDikonfirmasi) k.gateDikonfirmasi = {}; // amankan karakter lama / hasil impor
  return k;
}

// Total XP = XP habit selesai + bonus achievement + bonus Failure Debrief.
async function totalXP() {
  const habits = await ambilSemua("habits");
  const xpHabit = {};
  for (const h of habits) xpHabit[h.id] = h.xp || 0;

  let xp = 0;

  const logs = await ambilSemua("logs");
  for (const l of logs) {
    if (l.status === "done") xp += xpHabit[l.habitId] || 0;
  }

  const achievements = await ambilSemua("achievements");   // masih kosong; siap dipakai Modul 9
  for (const a of achievements) xp += a.hadiah || 0;

  const journal = await ambilSemua("journal");             // masih kosong; siap dipakai Modul 8
  for (const j of journal) {
    if (j.type === "debrief") xp += j.xp || 20;
  }

  return xp;
}

// Dua gerbang: XP cukup DAN (kalau ada) Skill Gate sudah dikonfirmasi.
async function bisaNaikLevel(karakter) {
  const target = karakter.level + 1;
  const ambang = KONFIG.ambangXP[target];
  if (ambang === undefined) return false;         // sudah level maksimum

  if ((await totalXP()) < ambang) return false;   // gerbang 1: XP

  const gate = KONFIG.skillGate[target];
  if (gate && !karakter.gateDikonfirmasi[target]) return false; // gerbang 2: Skill Gate

  return true;
}

// Konfirmasi Skill Gate untuk level tujuan (kamu centang "Ya" secara manual).
async function konfirmasiGate(targetLevel) {
  const k = await ambilKarakter();
  k.gateDikonfirmasi[targetLevel] = true;
  k.diubah = Date.now();
  await simpan("character", k);
  return k;
}

// Terapkan kenaikan level kalau kedua gerbang lolos. Kembalikan true kalau naik.
async function naikLevel() {
  const k = await ambilKarakter();
  if (!(await bisaNaikLevel(k))) return false;
  k.level += 1;
  k.diubah = Date.now();
  await simpan("character", k);
  return true;
}

// Naikkan level sebanyak yang layak (bisa >1 sekaligus), lalu beri tahu &
// gambar ulang. Dipanggil tiap kali XP berubah. Aman terhadap loop (dibatasi).
async function cekNaikLevel() {
  let naik = 0, levelBaru = null;
  for (let pass = 0; pass < 5; pass++) {          // batas aman: level→trophy level→level lagi
    let naikPass = 0;
    while (await naikLevel()) {
      naikPass++; naik++;
      levelBaru = (await ambilKarakter()).level;
    }
    if (naikPass === 0) break;
    if (typeof cekAchievements === "function") await cekAchievements(); // trophy berbasis level
  }
  if (naik > 0) {
    const st = typeof stageDari === "function" ? stageDari(levelBaru) : null;
    alert(`⬆️ Naik ke Level ${levelBaru}${st ? " · " + st.nama : ""}!\n\nTerus melangkah. 📈`);
    if (typeof renderDashboard === "function") await renderDashboard();
    if (typeof tampilkanChecklist === "function") await tampilkanChecklist();
    if (typeof renderQuestMobile === "function") await renderQuestMobile();
    if (typeof renderManajerQuest === "function") await renderManajerQuest();
  }
  return naik;
}