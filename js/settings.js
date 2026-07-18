// settings.js — MODUL 12: Setelan & tema. Satu variabel --gold mengubah seluruh aksen.

const DAFTAR_TEMA = [
  { id: "default", nama: "Emas",  warna: "#e8b04b" },
  { id: "merah",   nama: "Merah", warna: "#d64545" },
];

// Pembungkus store "settings" (keyPath "key").
async function simpanSetting(key, value) {
  await simpan("settings", { key, value, diubah: Date.now() });
}
async function ambilSetting(key, bawaan = null) {
  const s = await ambil("settings", key);
  return s ? s.value : bawaan;
}

// Terapkan tema ke <html> (CSS yang menimpa --gold berdasarkan atribut ini).
function terapkanTema(tema) {
  if (tema && tema !== "default") document.documentElement.dataset.tema = tema;
  else delete document.documentElement.dataset.tema;
}

async function muatTema() {
  terapkanTema(await ambilSetting("tema", "default"));
}

// Modal setelan (pakai kelas .modal dari Modul 8).
async function bukaSetelan() {
  const temaSekarang = await ambilSetting("tema", "default");

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  const modal = document.createElement("div");
  modal.className = "modal";

  const h = document.createElement("h2");
  h.className = "modal-judul";
  h.textContent = "Setelan";
  modal.appendChild(h);

  const label = document.createElement("p");
  label.className = "modal-desk";
  label.textContent = "Tema aksen";
  modal.appendChild(label);

  const swatches = document.createElement("div");
  swatches.className = "tema-pilih";
  for (const t of DAFTAR_TEMA) {
    const b = document.createElement("button");
    b.className = "tema-swatch" + (t.id === temaSekarang ? " aktif" : "");
    b.style.background = t.warna;
    b.title = t.nama;
    b.addEventListener("click", async () => {
      terapkanTema(t.id);
      await simpanSetting("tema", t.id);
      swatches.querySelectorAll(".tema-swatch").forEach((x) => x.classList.remove("aktif"));
      b.classList.add("aktif");
    });
    swatches.appendChild(b);
  }
  modal.appendChild(swatches);

  const aksi = document.createElement("div");
  aksi.className = "modal-aksi";
  const tutup = document.createElement("button");
  tutup.className = "tombol tombol-utama";
  tutup.textContent = "Selesai";
  tutup.addEventListener("click", () => overlay.remove());
  aksi.appendChild(tutup);
  modal.appendChild(aksi);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function pasangTombolSetelan() {
  const btn = document.getElementById("btn-setelan");
  if (btn) btn.addEventListener("click", bukaSetelan);
}