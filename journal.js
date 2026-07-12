// journal.js — MODUL 8: Jurnal fleksibel (debrief, pemicu, surat masa depan, dll).
// Semua entri teks tinggal di satu store "journal", dibedakan lewat field "type".

// Simpan satu entri jurnal.
async function simpanEntri(type, teks, meta = {}) {
  const entri = {
    id: `${type}_${Date.now()}`,
    type,
    teks,
    meta,
    dibuat: new Date().toISOString(),
    diubah: Date.now(),
  };
  await simpan("journal", entri);
  return entri;
}

// ── Modal generik: tampilkan form, kembalikan Promise berisi jawaban (null jika batal).
function bukaModal(judul, fields, opsi = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal";

    const h = document.createElement("h2");
    h.className = "modal-judul";
    h.textContent = judul;
    modal.appendChild(h);

    if (opsi.deskripsi) {
      const p = document.createElement("p");
      p.className = "modal-desk";
      p.textContent = opsi.deskripsi;
      modal.appendChild(p);
    }

    const inputs = [];
    for (const f of fields) {
      const label = document.createElement("label");
      label.className = "modal-label";
      label.textContent = f.label;

      const input = document.createElement("textarea");
      input.className = "modal-input";
      input.rows = f.rows || 2;
      if (f.placeholder) input.placeholder = f.placeholder;

      label.appendChild(input);
      modal.appendChild(label);
      inputs.push({ key: f.key, input });
    }

    const aksi = document.createElement("div");
    aksi.className = "modal-aksi";

    const batal = document.createElement("button");
    batal.className = "tombol";
    batal.textContent = "Batal";
    batal.addEventListener("click", () => { overlay.remove(); resolve(null); });

    const simpanBtn = document.createElement("button");
    simpanBtn.className = "tombol tombol-utama";
    simpanBtn.textContent = opsi.tombolSimpan || "Simpan";
    simpanBtn.addEventListener("click", () => {
      const hasil = {};
      for (const it of inputs) hasil[it.key] = it.input.value.trim();
      overlay.remove();
      resolve(hasil);
    });

    aksi.append(batal, simpanBtn);
    modal.appendChild(aksi);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    if (inputs[0]) inputs[0].input.focus();
  });
}

// ── Failure Debrief (dipicu relapse H-05): 4 pertanyaan → +20 XP ──
async function catatRelapse() {
  const jawaban = await bukaModal(
    "Failure Debrief",
    [
      { key: "apa", label: "Apa yang terjadi?" },
      { key: "internal", label: "Bagaimana kondisi internalmu saat itu?" },
      { key: "pemicu", label: "Apa pemicunya?" },
      { key: "beda", label: "Satu hal yang bisa berbeda lain kali?" },
    ],
    {
      deskripsi: "Ini bukan hukuman. Kegagalan diubah jadi data. Kamu tidak turun level.",
      tombolSimpan: "Simpan (+20 XP)",
    }
  );
  if (jawaban === null) return;

  await simpanEntri("debrief", "", jawaban); // +20 XP dihitung otomatis oleh totalXP()
  await cekAchievements();
  if (typeof cekNaikLevel === "function") await cekNaikLevel();
  alert("Tersimpan. +20 XP. Lanjutkan dari hari berikutnya — dengan lembut. 🌱");
}

// ── Catatan pemicu (2 menit sebelum tidur) ────────────────────────
async function catatPemicu() {
  const jawaban = await bukaModal(
    "Catatan Pemicu (2 menit)",
    [
      { key: "situasi", label: "Situasi / apa yang terjadi?" },
      { key: "perasaan", label: "Apa yang kamu rasakan?" },
      { key: "pikiran", label: "Pikiran yang muncul?" },
    ],
    { deskripsi: "Setelah 30 hari, pola-pola ini akan terbaca di dashboard desktop." }
  );
  if (jawaban === null) return;

  await simpanEntri("trigger", "", jawaban);
  alert("Catatan pemicu tersimpan. 🌙");
}

// ── Surat untuk diri di masa depan (dikunci, muncul lagi +3 bulan) ─
async function tulisSuratMasaDepan() {
  const jawaban = await bukaModal(
    "Surat untuk Diri di Masa Depan",
    [{ key: "surat", label: "Tulis pesanmu:", rows: 6, placeholder: "Kepada diriku 3 bulan lagi..." }],
    { deskripsi: "Akan dikunci dan muncul kembali 3 bulan lagi sebagai jangkar.", tombolSimpan: "Kunci surat" }
  );
  if (jawaban === null || !jawaban.surat) return;

  const munculLagi = new Date();
  munculLagi.setMonth(munculLagi.getMonth() + 3);
  await simpanEntri("future_letter", jawaban.surat, {
    munculPada: munculLagi.toISOString(),
    dibaca: false,
  });
  alert("Surat terkunci. Sampai jumpa 3 bulan lagi. ✉️");
}

// ── Saat mulai: tawarkan baca surat yang tanggal-munculnya sudah lewat.
async function cekSuratMasaDepan() {
  const journal = await ambilSemua("journal");
  const sekarang = Date.now();
  const surat = journal.find(
    (j) => j.type === "future_letter" && !j.meta?.dibaca &&
           new Date(j.meta?.munculPada).getTime() <= sekarang
  );
  if (!surat) return;

  if (confirm("Ada surat dari dirimu di masa lalu. Baca sekarang?")) {
    alert(surat.teks);
    surat.meta.dibaca = true;
    surat.diubah = Date.now();
    await simpan("journal", surat);
  }
}

// ── Pasang perilaku ke tombol jurnal ──────────────────────────────
function pasangTombolJurnal() {
  const r = document.getElementById("btn-relapse");
  const p = document.getElementById("btn-pemicu");
  const s = document.getElementById("btn-surat");
  if (r) r.addEventListener("click", catatRelapse);
  if (p) p.addEventListener("click", catatPemicu);
  if (s) s.addEventListener("click", tulisSuratMasaDepan);
}