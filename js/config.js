// config.js — MODUL 2: area kesiapan & stage di SATU tempat.
// Versi ini MEMBUANG: XP, ambang level, Skill Gate, trophy, quest, dan seed habit.
// "Level" kini = KESIAPAN menuju Jepang, dinilai per-area (Bab V · Gap Analysis).

const KONFIG = {

  // ── 7 Stage: dipetakan dari % Kesiapan (bukan lagi level/XP) ──────
  stages: [
    { no: 1, nama: "Survival",              ringkas: "Keluar dari autopilot. Prioritas: jangan berhenti." },
    { no: 2, nama: "Stabilization",         ringkas: "Ritme terbentuk, Corruption turun, koneksi pertama." },
    { no: 3, nama: "Growth",                ringkas: "AI Engineering dimulai, portfolio, identitas dari dalam." },
    { no: 4, nama: "Expansion",             ringkas: "Dari membangun ke menghasilkan." },
    { no: 5, nama: "Independence",          ringkas: "Mandiri, N3 selesai, Corruption sangat jarang." },
    { no: 6, nama: "Japan Ready",           ringkas: "Semua syarat difinalkan. Hitungan bulan." },
    { no: 7, nama: "Dream Nearly Achieved", ringkas: "Kesiapan penuh — keberangkatan." },
  ],

  // ── Area Kesiapan (Bab V · Gap Analysis) ─────────────────────────
  // Nilai sendiri 0–100% tiap area. Rata-rata = % Kesiapan keseluruhan.
  areaKesiapan: [
    { id:"regulasi-emosi", nama:"Regulasi Emosi",           sekarang:"Pelarian otomatis ketika stres",               ideal:"Duduk dengan ketidaknyamanan, proses emosi tanpa lari" },
    { id:"disiplin",       nama:"Disiplin",                 sekarang:"Mood-dependent, berhenti saat kondisi buruk",   ideal:"Sistem-driven, bergerak meski kondisi tak sempurna" },
    { id:"kesehatan",      nama:"Kesehatan Fisik",          sekarang:"Jarang olahraga, pola makan tak terjaga",       ideal:"Olahraga ≥3×/minggu, pola makan cukup sehat" },
    { id:"jepang",         nama:"Bahasa Jepang",            sekarang:"Dasar sudah terlupa",                           ideal:"N3 minimum sebelum berangkat" },
    { id:"inggris",        nama:"Bahasa Inggris",           sekarang:"Sedang ditingkatkan",                           ideal:"C1 untuk klien internasional" },
    { id:"karier",         nama:"Karier Teknis",            sekarang:"Python 80%",                                    ideal:"AI Engineer dengan portfolio & track record freelance" },
    { id:"corruption",     nama:"Corruption Management",    sekarang:"5×+/minggu, aktif melemahkan",                  ideal:"Diputus atau dikurangi drastis" },
    { id:"identitas",      nama:"Identitas Diri",           sekarang:"Dibangun dari luar ke dalam",                   ideal:"Solid dari dalam, tak bergantung pencapaian" },
    { id:"spiritual",      nama:"Spiritual",                sekarang:"Tidak konsisten, lemah",                        ideal:"Satu praktik konsisten jadi anchor ketenangan" },
    { id:"toleransi",      nama:"Toleransi Ketidakpastian", sekarang:"Sangat rendah (kecemasan antisipatori tinggi)", ideal:"Cukup tinggi untuk bertahan sendirian di negara asing" },
  ],
};

// Peta % Kesiapan (0–100) → salah satu dari 7 Stage.
function stageDariKesiapan(pct) {
  const daftar = KONFIG.stages || [];
  if (daftar.length === 0) return null;
  const idx = Math.min(daftar.length - 1, Math.floor((pct / 100) * daftar.length));
  return daftar[Math.max(0, idx)];
}