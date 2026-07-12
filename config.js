// config.js — MODUL 2: semua "angka permainan" & daftar habit di SATU tempat.
// Analogi: ini config.py-mu. Ubah aturan di sini, tanpa menyentuh mesin.

const KONFIG = {

  // ── Ambang XP: total XP untuk MENCAPAI level tersebut ───────────
  // Ini angka OTORITATIF — kamu yang tetapkan (rapikan bila dokumenmu tumpang tindih).
  ambangXP: {
    2:500, 3:700, 4:900, 5:1100, 6:1300, 7:1500,
    8:2000, 9:2500, 10:3000, 11:3500, 12:4000, 13:4500, 14:5000, 15:5500,
    16:6000, 17:6500, 18:7000, 19:7500, 20:8000, 21:8500, 22:9000, 23:9500, 24:10000, 25:10500,
    26:11000, 27:11500, 28:12000, 29:12500, 30:13000, 31:13500, 32:14000, 33:14500, 34:15000, 35:15500,
    36:16000, 37:17000, 38:18000, 39:19000, 40:20000, 41:21000, 42:22000,
    43:24000, 44:26000, 45:28000, 46:30000, 47:32000, 48:34000,
    49:38000, 50:45000,
  },

  // ── Skill Gate: syarat nyata ya/tidak untuk naik ke level tertentu.
  // Level yang tak disebut = cukup XP, tanpa gate.
  skillGate: {
    7:  { deskripsi: "Konsistensi — ≥2 habit Tier S rate ≥70% selama 30 hari; pola trigger Corruption dikenali." },
    8:  { deskripsi: "Konsistensi — Corruption turun ke maks 3–4×/minggu selama 2 minggu." },
    10: { deskripsi: "Konsistensi — Sistem berjalan 3 bulan; ≥3 habit Tier S rate 70%+ selama 90 hari." },
    13: { deskripsi: "Psikologi — Aktif di ≥1 komunitas online, ≥3 kontribusi bermakna." },
    15: { deskripsi: "Psikologi — Ada ≥1 manusia yang benar-benar dipercaya." },
    16: { deskripsi: "Python — 100% selesai; bisa membuat script mandiri." },
    18: { deskripsi: "Jepang — Hiragana, Katakana, dan N5 (vocab & grammar) dikuasai." },
    22: { deskripsi: "Freelance — ≥1 percobaan nyata melamar/menawarkan jasa internasional." },
    24: { deskripsi: "Portfolio — ≥2 project AI/Python solid yang bisa dijelaskan ke klien." },
    25: { deskripsi: "Jepang — N4 dimulai aktif (Anki dsb.), min 2 minggu konsisten." },
    27: { deskripsi: "Tabungan — liquid ≥ Rp25.000.000." },
    35: { deskripsi: "Income — remote/freelance konsisten ≥2 bulan; tabungan > Rp50 juta." },
    37: { deskripsi: "Jepang — N3 dikuasai; bisa komunikasi sehari-hari." },
    39: { deskripsi: "Konsistensi — Corruption <1×/bulan selama 3 bulan; relapse tak crash." },
  },

  // ── Aturan mesin Kaizen (Modul 6) ──────────────────────────────
  aturanKaizen: { hariMinimal: 21, rateMinimal: 0.8, faktor: 1.2 },


  // ── 7 Stage: peta level → babak perjalanan (Modul 17) ──────────
  stages: [
    { no: 1, nama: "Survival",              min: 1,  max: 7,  ringkas: "Keluar dari autopilot. Prioritas: jangan berhenti." },
    { no: 2, nama: "Stabilization",         min: 8,  max: 15, ringkas: "Ritme terbentuk, Corruption turun, koneksi pertama." },
    { no: 3, nama: "Growth",                min: 16, max: 25, ringkas: "AI Engineering dimulai, portfolio, identitas dari dalam." },
    { no: 4, nama: "Expansion",             min: 26, max: 35, ringkas: "Dari membangun ke menghasilkan. Income mulai." },
    { no: 5, nama: "Independence",          min: 36, max: 42, ringkas: "Mandiri, N3 selesai, Corruption sangat jarang." },
    { no: 6, nama: "Japan Ready",           min: 43, max: 48, ringkas: "Semua syarat difinalkan. Hitungan bulan." },
    { no: 7, nama: "Dream Nearly Achieved", min: 49, max: 50, ringkas: "Level 50 = keberangkatan." },
  ],

  // ── Daftar habit ───────────────────────────────────────────────
  // Skema tiap habit:
  //   id        : kode unik (pakai kode dokumenmu, mis. "H-05")
  //   nama      : teks yang tampil di checklist
  //   kategori  : "fisik" | "mental" | "spiritual" | "skill" | ...
  //   tier      : "S" | "A" | "B" | "C"
  //   rarity    : "common" | "rare" | "epic" | "legendary"
  //   xp        : XP saat habit dicentang selesai
  //   frekuensi : { tipe:"harian" }
  //             | { tipe:"mingguan", hari:[1,4] }   // 0=Min,1=Sen,...,6=Sab
  //             | { tipe:"bulanan", tanggal:1 }
  //   kaizen    : null (habit ya/tidak)  ATAU
  //             | { level:1, target:3, satuan:"repetisi", targetMaks:100 }
  //   aktif     : true/false
  //
  // ⬇️ INI CONTOH. Ganti & lengkapi jadi 41 habit dari dokumenmu.
  habits: [
    { id:"H-01", nama:"Urge Surfing Practice", kategori:"Anti-Corrupt, Emosional", tier:"S", rarity:"rare", xp:10,
      frekuensi:{tipe:"opsional"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Mengendarai gelombang urge",target:"",nilai:null,satuan:""}] },
    { id:"H-02", nama:"Identifikasi Trigger Harian", kategori:"Anti-Corrupt, Mental", tier:"A", rarity:"rare", xp:10,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Sadar pemicu",target:"2 menit sebelum tidur",nilai:2,satuan:"menit"}] },
    { id:"H-03", nama:"Dopamine Reset Ritual Pagi", kategori:"Anti-Corrupt, Fisik", tier:"A", rarity:"rare", xp:10,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Pagi tanpa layar dulu",target:"",nilai:null,satuan:""}] },
    { id:"H-04", nama:"Replacement Activity Bank", kategori:"Anti-Corrupt, Anti-Escape", tier:"B", rarity:"common", xp:8,
      frekuensi:{tipe:"mingguan",hari:[1]}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Perbarui daftar pengganti",target:"",nilai:null,satuan:""}] },
    { id:"H-05", nama:"Corruption Debuff (hari bersih)", kategori:"Anti-Corrupt", tier:"S", rarity:"legendary", xp:25,
      frekuensi:{tipe:"opsional"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Satu hari bersih",target:"",nilai:null,satuan:""}] },
    { id:"H-06", nama:"Emotional Check-In Harian", kategori:"Emosional, Anti-Escape", tier:"S", rarity:"epic", xp:15,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Menamai perasaan",target:"5 menit",nilai:5,satuan:"menit"}] },
    { id:"H-07", nama:"Anti-Overthinking Timer", kategori:"Anti-Overthinking", tier:"B", rarity:"common", xp:5,
      frekuensi:{tipe:"opsional"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Putus siklus pikiran",target:"",nilai:null,satuan:""}] },
    { id:"H-08", nama:"Scheduled Worry Time", kategori:"Anti-Overthinking, Emosional", tier:"B", rarity:"rare", xp:10,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Wadahi kekhawatiran",target:"15 menit",nilai:15,satuan:"menit"}] },
    { id:"H-09", nama:"Bedtime Completion Ritual", kategori:"Anti-Escape, Fisik", tier:"A", rarity:"rare", xp:10,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Tutup hari dengan sadar",target:"",nilai:null,satuan:""}] },
    { id:"H-10", nama:"Future Self Correspondence", kategori:"Identity, Emosional", tier:"B", rarity:"epic", xp:30,
      frekuensi:{tipe:"opsional"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Surat untuk diri masa depan",target:"",nilai:null,satuan:""}] },
    { id:"H-11", nama:"Failure Debrief", kategori:"Emosional, Identity", tier:"B", rarity:"epic", xp:20,
      frekuensi:{tipe:"opsional"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Belajar dari kegagalan",target:"",nilai:null,satuan:""}] },
    { id:"H-12", nama:"Voice Journaling", kategori:"Emosional, Sosial", tier:"C", rarity:"rare", xp:15,
      frekuensi:{tipe:"mingguan",hari:[1]}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Bicara pada diri sendiri",target:"",nilai:null,satuan:""}] },
    { id:"H-13", nama:"Identity Journaling", kategori:"Identity, Emosional", tier:"S", rarity:"epic", xp:15,
      frekuensi:{tipe:"mingguan",hari:[1]}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Menulis siapa aku",target:"30 menit",nilai:30,satuan:"menit"}] },
    { id:"H-14", nama:"Satu Koneksi Aman", kategori:"Sosial, Identity", tier:"S", rarity:"epic", xp:15,
      frekuensi:{tipe:"mingguan",hari:[1]}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Satu koneksi bermakna",target:"1 koneksi",nilai:1,satuan:"orang"}] },
    { id:"H-15", nama:"Trust Repair Journaling", kategori:"Emosional, Identity", tier:"B", rarity:"rare", xp:10,
      frekuensi:{tipe:"mingguan",hari:[1]}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Memperbaiki kepercayaan",target:"",nilai:null,satuan:""}] },
    { id:"H-16", nama:"Micro-Social Exposure Harian", kategori:"Sosial", tier:"A", rarity:"rare", xp:10,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Satu interaksi kecil",target:"1 interaksi",nilai:1,satuan:"interaksi"}] },
    { id:"H-17", nama:"Deep Work Session (Python/AI)", kategori:"Karier, Produktivitas", tier:"S", rarity:"legendary", xp:25,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Fokus tanpa gangguan",target:"45 menit",nilai:45,satuan:"menit"}] },
    { id:"H-18", nama:"Build in Public (GitHub)", kategori:"Karier, Sosial", tier:"B", rarity:"rare", xp:10,
      frekuensi:{tipe:"mingguan",hari:[1]}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Tunjukkan karya",target:"1 post",nilai:1,satuan:"post"}] },
    { id:"H-19", nama:"English Learning", kategori:"Karier, Sosial", tier:"A", rarity:"rare", xp:10,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Latih bahasa Inggris",target:"15 menit",nilai:15,satuan:"menit"}] },
    { id:"H-20", nama:"Belajar Bahasa Jepang", kategori:"Karier, Sosial", tier:"S", rarity:"epic", xp:15,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Menuju N5",target:"30 menit",nilai:30,satuan:"menit"}] },
    { id:"H-21", nama:"Freelance Research & Market Edu", kategori:"Karier, Finansial", tier:"C", rarity:"rare", xp:10,
      frekuensi:{tipe:"mingguan",hari:[1]}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Pahami pasar",target:"1 jam",nilai:60,satuan:"menit"}] },
    { id:"H-22", nama:"Investasi Rutin Saham AS (DCA)", kategori:"Finansial", tier:"A", rarity:"epic", xp:20,
      frekuensi:{tipe:"bulanan",tanggal:1}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Konsisten menabung-investasi",target:"",nilai:null,satuan:""}] },
    { id:"H-23", nama:"Japan Life Cost Research", kategori:"Finansial", tier:"B", rarity:"rare", xp:15,
      frekuensi:{tipe:"opsional"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Riset biaya hidup Jepang",target:"",nilai:null,satuan:""}] },
    { id:"H-24", nama:"Belajar Matematika", kategori:"Karier, Mental", tier:"B", rarity:"rare", xp:10,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Asah logika",target:"",nilai:null,satuan:""}] },
    { id:"H-25", nama:"Jalan Kaki 10 Menit", kategori:"Fisik", tier:"A", rarity:"rare", xp:10,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Gerak minimal",target:"10 menit",nilai:10,satuan:"menit"}] },
    { id:"H-26", nama:"Pola Makan 1 Perubahan/Bulan", kategori:"Fisik", tier:"C", rarity:"rare", xp:15,
      frekuensi:{tipe:"bulanan",tanggal:1}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Satu perbaikan makan",target:"",nilai:null,satuan:""}] },
    { id:"H-27", nama:"Pemeriksaan Kesehatan Tahunan", kategori:"Fisik", tier:"C", rarity:"epic", xp:50,
      frekuensi:{tipe:"opsional"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Cek kesehatan menyeluruh",target:"",nilai:null,satuan:""}] },
    { id:"H-28", nama:"Push Up", kategori:"Fisik", tier:"B", rarity:"common", xp:5,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1,
      levels:[
        {level:1,milestone:"Proof of Agency",target:"3 push up/hari",nilai:3,satuan:"repetisi"},
        {level:2,milestone:"Momentum Terbentuk",target:"5 push up/hari",nilai:5,satuan:"repetisi"},
        {level:3,milestone:"Kekuatan Mulai Terasa",target:"8 push up/hari",nilai:8,satuan:"repetisi"},
        {level:4,milestone:"Habit Sudah Natural",target:"12 push up/hari",nilai:12,satuan:"repetisi"},
        {level:5,milestone:"Milestone Fisik",target:"20 push up/hari",nilai:20,satuan:"repetisi"},
        {level:6,milestone:"Dua Puluh Lima",target:"25 push up/hari",nilai:25,satuan:"repetisi"},
        {level:7,milestone:"Tiga Puluh",target:"30 push up/hari",nilai:30,satuan:"repetisi"},
        {level:8,milestone:"Tiga Puluh Lima",target:"35 push up/hari",nilai:35,satuan:"repetisi"},
        {level:9,milestone:"Empat Puluh",target:"40 push up/hari",nilai:40,satuan:"repetisi"},
        {level:10,milestone:"Lima Puluh — Bukti Kaizen",target:"50 push up/hari",nilai:50,satuan:"repetisi"},
      ] },
    { id:"H-29", nama:"Plank", kategori:"Fisik", tier:"B", rarity:"common", xp:5,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1,
      levels:[
        {level:1,milestone:"Mulai Bertahan",target:"20 detik/hari",nilai:20,satuan:"detik"},
        {level:2,milestone:"Toleransi Meningkat",target:"30 detik/hari",nilai:30,satuan:"detik"},
        {level:3,milestone:"Setengah Menit Lebih",target:"45 detik/hari",nilai:45,satuan:"detik"},
        {level:4,milestone:"Satu Menit",target:"60 detik/hari",nilai:60,satuan:"detik"},
        {level:5,milestone:"Tahan Lebih Lama",target:"90 detik/hari",nilai:90,satuan:"detik"},
        {level:6,milestone:"Satu Menit Lima Belas",target:"105 detik/hari",nilai:105,satuan:"detik"},
        {level:7,milestone:"Dua Menit — Milestone",target:"120 detik/hari",nilai:120,satuan:"detik"},
        {level:8,milestone:"Dua Menit Tiga Puluh",target:"150 detik/hari",nilai:150,satuan:"detik"},
        {level:9,milestone:"Tiga Menit",target:"180 detik/hari",nilai:180,satuan:"detik"},
        {level:10,milestone:"Empat Menit — Toleransi Penuh",target:"240 detik/hari",nilai:240,satuan:"detik"},
      ] },
    { id:"H-30", nama:"Hand Grip", kategori:"Fisik", tier:"B", rarity:"common", xp:5,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Kekuatan genggam",target:"2 set/hari",nilai:2,satuan:"set"}] },
    { id:"H-31", nama:"Somatic Release Practice", kategori:"Fisik, Emosional", tier:"B", rarity:"common", xp:5,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Lepaskan tegangan tubuh",target:"5 menit",nilai:5,satuan:"menit"}] },
    { id:"H-32", nama:"Satu Ibadah yang Konsisten", kategori:"Spiritual", tier:"C", rarity:"common", xp:5,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Konsisten satu ibadah",target:"",nilai:null,satuan:""}] },
    { id:"H-33", nama:"Gratitude + Surrender Practice", kategori:"Spiritual, Emosional", tier:"A", rarity:"rare", xp:10,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Syukur & berserah",target:"3 menit",nilai:3,satuan:"menit"}] },
    { id:"H-34", nama:"Sholat Wajib 5 Waktu", kategori:"Spiritual", tier:"S", rarity:"epic", xp:15,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Lima waktu tepat",target:"",nilai:null,satuan:""}] },
    { id:"H-35", nama:"Istighfar", kategori:"Spiritual, Emosional", tier:"A", rarity:"rare", xp:10,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Perbanyak istighfar",target:"",nilai:null,satuan:""}] },
    { id:"H-36", nama:"Membaca Al-Qur'an + Terjemahan", kategori:"Spiritual", tier:"A", rarity:"rare", xp:10,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Baca & pahami",target:"",nilai:null,satuan:""}] },
    { id:"H-37", nama:"Sedekah", kategori:"Spiritual, Identity", tier:"C", rarity:"common", xp:5,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Beri, sekecil apa pun",target:"",nilai:null,satuan:""}] },
    { id:"H-38", nama:"Meditasi", kategori:"Mental, Anti-Overthinking", tier:"S", rarity:"epic", xp:15,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Hadir & tenang",target:"",nilai:null,satuan:""}] },
    { id:"H-39", nama:"Bermain Puzzle", kategori:"Mental, Produktivitas", tier:"B", rarity:"common", xp:5,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Latih otak",target:"",nilai:null,satuan:""}] },
    { id:"H-40", nama:"Boredom Tolerance Practice", kategori:"Anti-Overthinking, Identity", tier:"S", rarity:"epic", xp:15,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Nyaman dengan bosan",target:"5 menit",nilai:5,satuan:"menit"}] },
    { id:"H-41", nama:"Membaca Buku", kategori:"Mental, Identity", tier:"B", rarity:"rare", xp:10,
      frekuensi:{tipe:"harian"}, aktif:true, levelSekarang:1, levels:[{level:1,milestone:"Mulai 1 halaman",target:"1 halaman",nilai:1,satuan:"halaman"}] },
  ],

  // ── Trophy: pasangan "kondisi + hadiah XP" (Modul 9) ────────────
  // kondisi() mengembalikan true kalau trophy layak dibuka.
  trophies: [
    {
      id: "T-langkah-pertama",
      nama: "Langkah Pertama",
      deskripsi: "Menyelesaikan habit pertamamu.",
      hadiah: 20,
      kondisi: async () => {
        const logs = await ambilSemua("logs");
        return logs.some((l) => l.status === "done");
      },
    },
    {
      id: "T-hari-baik-pertama",
      nama: "Hari Baik Pertama",
      deskripsi: "Mencapai hari dengan skor 70% atau lebih.",
      hadiah: 30,
      kondisi: async () => {
        for (const t of await hariHariUnik()) {
          if (hariBaik(await skorHari(t))) return true;
        }
        return false;
      },
    },
    {
      id: "T-tujuh-hari",
      nama: "Tujuh Hari",
      deskripsi: "Mencatat di 7 hari yang berbeda.",
      hadiah: 50,
      kondisi: async () => (await hariHariUnik()).length >= 7,
    },
  ],
};

// Peta level → salah satu dari 7 Stage (Modul 17).
function stageDari(level) {
  const daftar = KONFIG.stages || [];
  return daftar.find((st) => level >= st.min && level <= st.max) || daftar[daftar.length - 1] || null;
}

// ── Seeding: isi store "habits" HANYA jika masih kosong ────────────
async function seedJikaKosong() {
  const adaSekarang = await ambilSemua("habits");
  if (adaSekarang.length > 0) {
    console.log(`Seed dilewati — sudah ada ${adaSekarang.length} habit.`);
    return;
  }
  for (const habit of KONFIG.habits) {
    await simpan("habits", habit);
  }
  console.log(`Seed selesai — ${KONFIG.habits.length} habit dimasukkan.`);
}