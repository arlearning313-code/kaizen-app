// sync.js — MODUL 11: Ekspor & impor seluruh data sebagai satu file JSON.
// Analogi: "save / load" game. Ekspor dari HP → impor di desktop.

const VERSI_BACKUP = 1;

// ── EKSPOR: kumpulkan 6 laci → satu objek → unduh sebagai file ──────
async function ekspor() {
  const data = {
    versi: VERSI_BACKUP,
    diekspor: new Date().toISOString(),
    habits: await ambilSemua("habits"),
    logs: await ambilSemua("logs"),
    journal: await ambilSemua("journal"),
    character: await ambilSemua("character"),
    achievements: await ambilSemua("achievements"),
    settings: await ambilSemua("settings"),
  };

  const teks = JSON.stringify(data, null, 2);
  const blob = new Blob([teks], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const tgl = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const a = document.createElement("a");
  a.href = url;
  a.download = `kaizen-backup-${tgl}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// ── Gabung satu store dengan aturan last-write-wins per record ──────
async function gabungStore(namaStore, records) {
  let ditambah = 0, diperbarui = 0;

  for (const rec of records) {
    const kunci = namaStore === "settings" ? rec.key : rec.id;
    const lama = await ambil(namaStore, kunci);

    if (!lama) {
      await simpan(namaStore, rec);            // belum ada → tambahkan
      ditambah++;
    } else if ((rec.diubah ?? 0) > (lama.diubah ?? 0)) {
      await simpan(namaStore, rec);            // versi impor lebih baru → timpa
      diperbarui++;
    }
    // kalau lama lebih baru / sama → biarkan (last-write-wins)
  }
  return { ditambah, diperbarui };
}

// ── IMPOR: baca teks file → gabungkan ke tiap store ────────────────
async function impor(teks) {
  let data;
  try {
    data = JSON.parse(teks);
  } catch (e) {
    alert("File tidak valid — bukan JSON yang benar.");
    return;
  }
  if (!data.versi) {
    alert("File ini sepertinya bukan backup Kaizen.");
    return;
  }
  // (Kalau suatu saat format berubah, di sinilah tempat migrasi versi.)

  const stores = ["habits", "logs", "journal", "character", "achievements", "settings"];
  let totalTambah = 0, totalPerbarui = 0;

  for (const s of stores) {
    const hasil = await gabungStore(s, data[s] || []);
    totalTambah += hasil.ditambah;
    totalPerbarui += hasil.diperbarui;
  }

  alert(`Impor selesai.\nDitambah: ${totalTambah} record\nDiperbarui: ${totalPerbarui} record`);
  if (typeof tampilkanChecklist === "function") await tampilkanChecklist();
}

// ── Pasang perilaku ke tombol di layar ─────────────────────────────
function pasangTombolSync() {
  const btnEks = document.getElementById("btn-ekspor");
  const btnImp = document.getElementById("btn-impor");
  const fileImp = document.getElementById("file-impor");
  if (!btnEks || !btnImp || !fileImp) return;

  btnEks.addEventListener("click", ekspor);
  btnImp.addEventListener("click", () => fileImp.click());
  fileImp.addEventListener("change", async () => {
    const file = fileImp.files[0];
    if (!file) return;
    await impor(await file.text());
    fileImp.value = ""; // reset agar file sama bisa dipilih ulang
  });
}