// config.js — MODUL 2: semua "angka permainan" & daftar habit di SATU tempat.
// Analogi: ini config.py-mu. Ubah aturan di sini, tanpa menyentuh mesin.

const KONFIG = {

  // ── Ambang XP: total XP untuk MENCAPAI level tersebut ───────────
  // Ini angka OTORITATIF — kamu yang tetapkan (rapikan bila dokumenmu tumpang tindih).
  ambangXP: {
    2: 500,
    3: 1200,
    4: 2200,
    5: 3500,
    6: 5000,
    7: 7000,
  },

  // ── Skill Gate: syarat nyata ya/tidak untuk naik ke level tertentu.
  // Level yang tak disebut = cukup XP, tanpa gate.
  skillGate: {
    5: { deskripsi: "Python: 100% selesai (bukan 'hampir')", dikonfirmasi: false },
  },

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
    { id: "H-05", nama: "Bebas relapse (Corruption Debuff)", kategori: "mental",
      tier: "S", rarity: "legendary", xp: 50, frekuensi: { tipe: "harian" },
      kaizen: null, aktif: true },

    { id: "H-34", nama: "Sholat lima waktu", kategori: "spiritual",
      tier: "S", rarity: "epic", xp: 30, frekuensi: { tipe: "harian" },
      kaizen: null, aktif: true },

    { id: "H-DW", nama: "Deep Work 45 menit", kategori: "skill",
      tier: "A", rarity: "rare", xp: 20, frekuensi: { tipe: "harian" },
      kaizen: { level: 1, target: 45, satuan: "menit", targetMaks: 120 }, aktif: true },

    { id: "H-PU", nama: "Push-up", kategori: "fisik",
      tier: "B", rarity: "common", xp: 10, frekuensi: { tipe: "harian" },
      kaizen: { level: 1, target: 3, satuan: "repetisi", targetMaks: 100 }, aktif: true },

    { id: "H-PL", nama: "Plank", kategori: "fisik",
      tier: "B", rarity: "common", xp: 10, frekuensi: { tipe: "harian" },
      kaizen: { level: 1, target: 20, satuan: "detik", targetMaks: 300 }, aktif: true },

    { id: "H-MED", nama: "Meditasi", kategori: "mental",
      tier: "B", rarity: "common", xp: 10, frekuensi: { tipe: "harian" },
      kaizen: null, aktif: true },

    { id: "H-BACA", nama: "Baca 1 halaman", kategori: "skill",
      tier: "C", rarity: "common", xp: 8, frekuensi: { tipe: "harian" },
      kaizen: null, aktif: true },

    { id: "H-18", nama: "Build in Public (1 post)", kategori: "skill",
      tier: "A", rarity: "rare", xp: 15, frekuensi: { tipe: "mingguan", hari: [1, 4] },
      kaizen: null, aktif: true },
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