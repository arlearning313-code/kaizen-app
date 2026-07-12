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