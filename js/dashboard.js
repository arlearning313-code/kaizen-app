// dashboard.js — MODUL 10: Dashboard desktop (tampil hanya di layar lebar via CSS).

function buatKartu(judul, spanPenuh = false) {
  const card = document.createElement("div");
  card.className = "dash-card" + (spanPenuh ? " dash-span" : "");
  if (judul) {
    const h = document.createElement("h3");
    h.className = "dash-judul";
    h.textContent = judul;
    card.appendChild(h);
  }
  return card;
}

function kelasIntensitas(skor) {
  if (skor === null) return "h0";
  if (skor >= 80) return "h4";
  if (skor >= 50) return "h3";
  if (skor >= 25) return "h2";
  if (skor > 0) return "h1";
  return "h0";
}

// Heatmap konsistensi N hari terakhir.
async function heatmapKonsistensi(jumlahHari) {
  const card = buatKartu("Konsistensi", true);
  const grid = document.createElement("div");
  grid.className = "heatmap";
  for (let i = jumlahHari - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const tgl = formatTanggal(d);
    const skor = await skorHari(tgl);
    const sel = document.createElement("span");
    sel.className = "heat " + kelasIntensitas(skor);
    sel.title = `${tgl}: ${skor === null ? "—" : skor + "%"}`;
    grid.appendChild(sel);
  }
  card.appendChild(grid);
  return card;
}

// Tren rata-rata skor per minggu.
async function trenMingguan(jumlahMinggu) {
  const card = buatKartu("Tren mingguan");
  const chart = document.createElement("div");
  chart.className = "bar-chart";
  for (let w = jumlahMinggu - 1; w >= 0; w--) {
    let total = 0, hitung = 0;
    for (let d = 0; d < 7; d++) {
      const hari = new Date();
      hari.setDate(hari.getDate() - (w * 7 + d));
      const skor = await skorHari(formatTanggal(hari));
      if (skor !== null) { total += skor; hitung++; }
    }
    const nilai = hitung === 0 ? 0 : Math.round(total / hitung);
    const kol = document.createElement("div");
    kol.className = "bar-kol";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${nilai}%`;
    bar.title = `${nilai}%`;
    kol.appendChild(bar);
    chart.appendChild(kol);
  }
  card.appendChild(chart);
  return card;
}

// Panel Kesiapan: slider per-area (Gap Analysis) → rata-rata = % kesiapan.
async function panelKesiapan() {
  const card = buatKartu("Kesiapan menuju Jepang", true);
  const nilai = await ambilKesiapan();

  const total = document.createElement("div");
  total.className = "tracker-angka";
  total.textContent = (await kesiapanTotal()) + "% siap";
  card.appendChild(total);

  for (const a of (KONFIG.areaKesiapan || [])) {
    const row = document.createElement("div");
    row.className = "kesiapan-area";
    row.innerHTML = `
      <div class="kesiapan-atas">
        <span class="kesiapan-nama">${a.nama}</span>
        <span class="kesiapan-persen">${nilai[a.id]}%</span>
      </div>
      <input class="kesiapan-slider" type="range" min="0" max="100" step="5" value="${nilai[a.id]}">
      <div class="kesiapan-gap"><b>Sekarang:</b> ${a.sekarang} &nbsp;·&nbsp; <b>Ideal:</b> ${a.ideal}</div>`;
    const slider = row.querySelector(".kesiapan-slider");
    const label = row.querySelector(".kesiapan-persen");
    slider.addEventListener("input", () => { label.textContent = slider.value + "%"; });
    slider.addEventListener("change", async () => {
      await setKesiapanArea(a.id, Number(slider.value));
      total.textContent = (await kesiapanTotal()) + "% siap";
      if (typeof renderSidebarKarakter === "function") await renderSidebarKarakter();
    });
    card.appendChild(row);
  }
  return card;
}

// Rakit seluruh dashboard.
async function renderDashboard() {
  const el = document.getElementById("dashboard");
  if (!el) return;
  el.innerHTML = "";

  const pct = await kesiapanTotal();
  const st = stageDariKesiapan(pct) || { no: 1, ringkas: "" };

  if (typeof coverJepang === "function") el.appendChild(await coverJepang()); // hero countdown
  el.appendChild(kartuHero(pct, st));
  el.appendChild(await panelKesiapan());
  el.appendChild(await heatmapKonsistensi(84));
  el.appendChild(await trenMingguan(8));
  if (typeof renderSidebarKarakter === "function") renderSidebarKarakter();
}