// character.js — MODUL 5 (dirombak): Mesin KESIAPAN menuju Jepang.
// Tak ada lagi XP / level / Skill Gate. "Kemajuan" = rata-rata penilaian jujur
// atas tiap area Gap Analysis (Bab V dokumen). Disimpan di store "settings".

// Baris karakter minimal (id "me") — disimpan untuk kompatibilitas & ekspor.
async function ambilKarakter() {
  let k = await ambil("character", "me");
  if (!k) {
    k = { id: "me", dibuat: Date.now(), diubah: Date.now() };
    await simpan("character", k);
  }
  return k;
}

// Nilai kesiapan per-area → objek { areaId: persen(0–100) }.
async function ambilKesiapan() {
  const rec = await ambil("settings", "kesiapan");
  const tersimpan = rec && rec.value && typeof rec.value === "object" ? rec.value : {};
  const hasil = {};
  for (const a of (KONFIG.areaKesiapan || [])) {
    const v = Number(tersimpan[a.id]);
    hasil[a.id] = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
  }
  return hasil;
}

// Simpan nilai satu area.
async function setKesiapanArea(areaId, persen) {
  const now = await ambilKesiapan();
  now[areaId] = Math.max(0, Math.min(100, Number(persen) || 0));
  await simpan("settings", { key: "kesiapan", value: now, diubah: Date.now() });
  return now;
}

// % Kesiapan keseluruhan = rata-rata semua area (0–100).
async function kesiapanTotal() {
  const nilai = Object.values(await ambilKesiapan());
  if (nilai.length === 0) return 0;
  return Math.round(nilai.reduce((a, b) => a + b, 0) / nilai.length);
}