// ui.js — MODUL 3: Checklist harian (jantung versi HP).

// Tanggal hari ini → "YYYY-MM-DD" (waktu lokal perangkat).
function tanggalHariIni() {
  const d = new Date();
  const y = d.getFullYear();
  const b = String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0");
  return `${y}-${b}-${t}`;
}

// Dipindahkan dari recovery.js — masih dipakai dashboard.js (heatmap/tren).
function formatTanggal(d) {
  const y = d.getFullYear();
  const b = String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0");
  return `${y}-${b}-${t}`;
}

// Jam (0–23) mulai memunculkan kartu pengingat untuk habit yang belum dicentang.
const JAM_PENGINGAT = 18;

// Apakah habit punya alasan yang bisa ditampilkan?
function adaAlasan(h) {
  const a = h.alasan || {};
  return !!(a.diam || a.lakuin || a.mantra);
}

// Bangun kartu alasan (pengingat) untuk satu habit.
function kartuAlasan(h, tanggal) {
  const a = h.alasan || {};
  const card = document.createElement("div");
  card.className = "kartu-alasan";
  card.addEventListener("click", (e) => e.stopPropagation());

  if (a.diam) {
    const b = document.createElement("div");
    b.className = "ka-blok ka-diam";
    b.innerHTML = '<span class="ka-lbl">Kalau aku diam</span>';
    b.appendChild(document.createTextNode(a.diam));
    card.appendChild(b);
  }
  if (a.lakuin) {
    const b = document.createElement("div");
    b.className = "ka-blok ka-lakuin";
    b.innerHTML = '<span class="ka-lbl">Kalau aku lakuin — jadi siapa aku</span>';
    b.appendChild(document.createTextNode(a.lakuin));
    card.appendChild(b);
  }
  if (a.mantra) {
    const m = document.createElement("div");
    m.className = "ka-mantra";
    m.textContent = '"' + a.mantra + '"';
    card.appendChild(m);
  }

  const btn = document.createElement("button");
  btn.className = "ka-lakukan";
  btn.textContent = "Lakukan sekarang ✓";
  btn.addEventListener("click", (e) => { e.stopPropagation(); toggleHabit(h, tanggal); });
  card.appendChild(btn);

  return card;
}

// Saring habit AKTIF yang jatuh tempo pada satu tanggal, sesuai frekuensinya.
async function habitHariIni(tanggal) {
  const semua = await ambilSemua("habits");
  const d = new Date(tanggal + "T00:00:00");
  const hari = d.getDay();   // 0=Minggu … 6=Sabtu
  const tgl = d.getDate();   // 1..31

  return semua.filter((h) => {
    if (!h.aktif) return false;
    const f = h.frekuensi || {};
    if (f.tipe === "harian") return true;
    if (f.tipe === "opsional") return true;   // muncul tiap hari, tak dihitung ke skor
    if (f.tipe === "mingguan") return Array.isArray(f.hari) && f.hari.includes(hari);
    if (f.tipe === "bulanan") return f.tanggal === tgl;
    return false;
  });
}

// Centang / batal-centang satu habit untuk satu tanggal.
async function toggleHabit(habit, tanggal) {
  const id = `${tanggal}_${habit.id}`;
  const logLama = await ambil("logs", id);
  const menjadiSelesai = !(logLama && logLama.status === "done");

  if (logLama && logLama.status === "done") {
    await hapus("logs", id);
  } else {
    await simpan("logs", {
      id, habitId: habit.id, date: tanggal, status: "done",
      nilai: null, catatan: null, diubah: Date.now(),
    });
  }
  if (menjadiSelesai && typeof fxHabitSelesai === "function") fxHabitSelesai(habit);
  await tampilkanChecklist();
}

// Gambar seluruh checklist hari ini.
async function tampilkanChecklist() {
  const tanggal = tanggalHariIni();
  const habits = await habitHariIni(tanggal);
  const logs = await ambilPerTanggal(tanggal);
  const selesai = new Set(logs.filter((l) => l.status === "done").map((l) => l.habitId));

  document.getElementById("tanggal-hari-ini").textContent =
    new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

  const daftar = document.getElementById("daftar-habit");
  daftar.innerHTML = "";

  if (habits.length === 0) {
    const li = document.createElement("li");
    li.className = "baris-kosong";
    li.textContent = "Belum ada habit. Tambahkan lewat Manajer Habit (desktop).";
    daftar.appendChild(li);
  }

  for (const h of habits) {
    const sudah = selesai.has(h.id);
    const li = document.createElement("li");
    li.className = "baris" + (sudah ? " selesai" : "");

    const kotak = document.createElement("span");
    kotak.className = "kotak" + (sudah ? " on" : "");

    const nama = document.createElement("span");
    nama.className = "nama";
    nama.textContent = h.frekuensi?.detil ? `${h.nama} · ${h.frekuensi.detil}` : h.nama;

    li.append(kotak, nama);
    li.addEventListener("click", () => toggleHabit(h, tanggal));

    const jam = new Date().getHours();
    if (!sudah && jam >= JAM_PENGINGAT && adaAlasan(h)) {
      li.appendChild(kartuAlasan(h, tanggal));
    }

    daftar.appendChild(li);
  }

  const skor = await skorHari(tanggal);
  const ringkasan = document.getElementById("ringkasan");
  if (skor === null) {
    ringkasan.textContent = "Tidak ada habit jatuh tempo hari ini. Istirahat yang cukup. 🌙";
  } else {
    const terjadwal = habits.filter((h) => h.frekuensi.tipe !== "opsional");
    const jumlahSelesai = terjadwal.filter((h) => selesai.has(h.id)).length;
    const labelBaik = hariBaik(skor) ? " · hari baik ✨" : "";
    ringkasan.textContent = `${skor}% — ${jumlahSelesai}/${terjadwal.length} selesai${labelBaik}`;
  }
}