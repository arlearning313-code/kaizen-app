// ui.js — MODUL 3: Checklist harian (jantung versi HP).
// Menampilkan habit yang jatuh tempo hari ini & menyimpan centang ke store "logs".

// Tanggal hari ini → "YYYY-MM-DD" (waktu lokal perangkat).
function tanggalHariIni() {
  const d = new Date();
  const y = d.getFullYear();
  const b = String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0");
  return `${y}-${b}-${t}`;
}

// Saring habit AKTIF yang jatuh tempo pada satu tanggal, sesuai frekuensinya.
async function habitHariIni(tanggal) {
  const semua = await ambilSemua("habits");
  const d = new Date(tanggal + "T00:00:00");
  const hari = d.getDay();   // 0=Minggu, 1=Senin, ... 6=Sabtu
  const tgl = d.getDate();   // 1..31

  return semua.filter((h) => {
    if (!h.aktif) return false;
    const f = h.frekuensi;
    if (f.tipe === "harian") return true;
    if (f.tipe === "mingguan") return f.hari.includes(hari);
    if (f.tipe === "bulanan") return f.tanggal === tgl;
    return false;
  });
}

// Centang / batal-centang satu habit untuk satu tanggal.
async function toggleHabit(habit, tanggal) {
  const id = `${tanggal}_${habit.id}`;          // 1 catatan per habit per hari
  const logLama = await ambil("logs", id);

  if (logLama && logLama.status === "done") {
    await hapus("logs", id);                     // batal centang
  } else {
    await simpan("logs", {
      id,
      habitId: habit.id,
      date: tanggal,
      status: "done",
      nilai: null,
      catatan: null,
      diubah: Date.now(),                        // untuk last-write-wins (Modul 11)
    });
  }
  await tampilkanChecklist();                    // gambar ulang layar
}

// Gambar seluruh checklist hari ini.
async function tampilkanChecklist() {
  const tanggal = tanggalHariIni();
  const habits = await habitHariIni(tanggal);
  const logs = await ambilPerTanggal(tanggal);
  const selesai = new Set(
    logs.filter((l) => l.status === "done").map((l) => l.habitId)
  );

  // Tanggal di header (mis. "Minggu, 12 Juli 2026")
  document.getElementById("tanggal-hari-ini").textContent =
    new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

  // Daftar habit
  const daftar = document.getElementById("daftar-habit");
  daftar.innerHTML = "";

  for (const h of habits) {
    const sudah = selesai.has(h.id);

    const li = document.createElement("li");
    li.className = "baris" + (sudah ? " selesai" : "");

    const kotak = document.createElement("span");
    kotak.className = "kotak" + (sudah ? " on" : "");

    const nama = document.createElement("span");
    nama.className = "nama";
    nama.textContent = h.nama;

    li.append(kotak, nama);
    li.addEventListener("click", () => toggleHabit(h, tanggal));
    daftar.appendChild(li);
  }

    // Baris ringkasan — pakai mesin skor Modul 4 (skor.js)
  const skor = await skorHari(tanggal);
  const ringkasan = document.getElementById("ringkasan");
  if (skor === null) {
    ringkasan.textContent = "Tidak ada habit jatuh tempo hari ini. Istirahat yang cukup. 🌙";
  } else {
    const jumlahSelesai = habits.filter((h) => selesai.has(h.id)).length;
    const labelBaik = hariBaik(skor) ? " · hari baik ✨" : "";
    ringkasan.textContent = `${skor}% — ${jumlahSelesai}/${habits.length} selesai${labelBaik}`;
  }
}