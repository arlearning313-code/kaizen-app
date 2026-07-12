// navigasi.js — Navigasi desktop (sidebar RPG). Mobile mengabaikan seluruh file ini.
// Cara kerja: set body[data-view] → CSS desktop menampilkan hanya view yang aktif.

function gantiView(nama) {
  document.body.dataset.view = nama;

  // Sorot item nav aktif
  document.querySelectorAll(".nav-item").forEach((b) => {
    b.classList.toggle("aktif", b.dataset.target === nama);
  });

  // Geser indikator torii ke item aktif
  const aktif = document.querySelector(`.nav-item[data-target="${nama}"]`);
  const nav = document.querySelector(".sidebar-nav");
  if (aktif && nav) {
    nav.style.setProperty("--sorot-y", aktif.offsetTop + "px");
    nav.style.setProperty("--sorot-h", aktif.offsetHeight + "px");
  }

  // Retrigger animasi reveal bertingkat
  document.body.classList.remove("view-masuk");
  void document.body.offsetWidth; // paksa reflow
  document.body.classList.add("view-masuk");
}

function pasangNavigasi() {
  document.querySelectorAll(".nav-item").forEach((b) => {
    b.addEventListener("click", () => gantiView(b.dataset.target));
  });

  // Aksi di kaki sidebar memakai fungsi global yang sudah ada
  const e = document.getElementById("nav-ekspor");
  const i = document.getElementById("nav-impor");
  const s = document.getElementById("nav-setelan");
  if (e) e.addEventListener("click", () => { if (typeof ekspor === "function") ekspor(); });
  if (i) i.addEventListener("click", () => { const f = document.getElementById("file-impor"); if (f) f.click(); });
  if (s) s.addEventListener("click", () => { if (typeof bukaSetelan === "function") bukaSetelan(); });

  gantiView("beranda"); // view awal di desktop
}