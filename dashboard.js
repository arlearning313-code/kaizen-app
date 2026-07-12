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

// Kartu karakter: level, XP, status.
function kartuKarakter(k, xp) {
  const card = buatKartu(null);
  card.classList.add("dash-karakter");

  const lv = document.createElement("div");
  lv.className = "dash-level";
  lv.textContent = `Level ${k.level}`;

  const st = typeof stageDari === "function" ? stageDari(k.level) : null;
  const stageEl = document.createElement("div");
  stageEl.className = "dash-stage";
  stageEl.textContent = st ? `Stage ${st.no} · ${st.nama}` : "";

  const xpEl = document.createElement("div");
  xpEl.className = "dash-xp";
  xpEl.textContent = `${xp.toLocaleString("id-ID")} XP`;

  const status = document.createElement("div");
  status.className = "dash-status";
  status.textContent = k.recovery ? "🛡️ Recovery Mode" : (st ? st.ringkas : "Aktif");

  card.append(lv, stageEl, xpEl, status);
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

// Tren rata-rata skor per minggu (batang sederhana).
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

// Panel Skill Gate: progres XP + tombol konfirmasi manual.
async function panelSkillGate(k, xp) {
  const card = buatKartu("Skill Gate");
  const target = k.level + 1;
  const ambang = KONFIG.ambangXP[target];
  const gate = KONFIG.skillGate[target];

  const info = document.createElement("p");
  info.className = "dash-teks";

  if (ambang === undefined) {
    info.textContent = "Kamu di level tertinggi yang terdefinisi.";
    card.appendChild(info);
    return card;
  }

  info.textContent = `Menuju Level ${target}: ${xp}/${ambang} XP.`;
  card.appendChild(info);

  if (gate) {
    const g = document.createElement("p");
    g.className = "dash-teks";
    g.textContent = `Syarat nyata: ${gate.deskripsi}`;
    card.appendChild(g);

    if (k.gateDikonfirmasi[target]) {
      const done = document.createElement("p");
      done.className = "dash-teks";
      done.textContent = "✅ Skill Gate sudah dikonfirmasi.";
      card.appendChild(done);
    } else {
      const btn = document.createElement("button");
      btn.className = "tombol tombol-utama";
      btn.textContent = "Konfirmasi: Ya, selesai";
      btn.addEventListener("click", async () => {
        if (confirm(`Konfirmasi jujur — "${gate.deskripsi}"?\n\nTak bisa dipalsukan. Hanya centang kalau benar-benar selesai.`)) {
          await konfirmasiGate(target);
          await renderDashboard();
        }
      });
      card.appendChild(btn);
    }
  }
  return card;
}

// Panel pola pemicu.
async function panelPemicu() {
  const card = buatKartu("Pola pemicu");
  const journal = await ambilSemua("journal");
  const pemicu = journal.filter((j) => j.type === "trigger");

  const info = document.createElement("p");
  info.className = "dash-teks";
  info.textContent = `${pemicu.length} catatan pemicu.` +
    (pemicu.length < 30 ? " Kumpulkan 30 untuk melihat pola." : "");
  card.appendChild(info);

  const daftar = document.createElement("ul");
  daftar.className = "dash-list";
  for (const p of pemicu.slice(-5).reverse()) {
    const li = document.createElement("li");
    li.textContent = `${(p.dibuat || "").slice(0, 10)} — ${p.meta?.situasi || "(tanpa situasi)"}`;
    daftar.appendChild(li);
  }
  card.appendChild(daftar);
  return card;
}

// Panel Trophy: berapa terbuka + beberapa terbaru.
async function panelTrophy() {
  const card = buatKartu("Trophy");
  const semua = await ambilSemua("achievements");
  const trofi = semua.filter((a) => (a.id || "").startsWith("T-"));
  const total = (KONFIG.trophies || []).length;

  const info = document.createElement("p");
  info.className = "dash-teks";
  info.textContent = `${trofi.length} / ${total} terbuka.`;
  card.appendChild(info);

  const ul = document.createElement("ul");
  ul.className = "dash-list";
  for (const a of trofi.slice(-6).reverse()) {
    const li = document.createElement("li");
    li.textContent = `🏆 ${a.nama}`;
    ul.appendChild(li);
  }
  card.appendChild(ul);
  return card;
}

// Panel Main Quest: 15 misi identitas, konfirmasi manual (mirip Skill Gate).
async function panelQuest(k) {
  const card = buatKartu("Main Quest", true);
  const terbuka = new Set((await ambilSemua("achievements")).map((a) => a.id));
  const list = document.createElement("div");
  list.className = "quest-list";

  for (const q of (KONFIG.quests || [])) {
    const selesai = terbuka.has(q.id);
    const terkunci = k.level < q.unlock;

    const row = document.createElement("div");
    row.className = "quest-row";

    const info = document.createElement("div");
    info.className = "quest-info";
    const nama = document.createElement("div");
    nama.className = "quest-nama" + (selesai ? " selesai" : "");
    nama.textContent = q.nama;
    const ident = document.createElement("div");
    ident.className = "quest-ident";
    ident.textContent = selesai ? `"${q.identitas}"` : `Lv ${q.unlock} · +${q.xp} XP`;
    info.append(nama, ident);

    const aksi = document.createElement("div");
    aksi.className = "quest-aksi";
    if (selesai) {
      const s = document.createElement("span");
      s.className = "quest-status ok"; s.textContent = "✅";
      aksi.appendChild(s);
    } else if (terkunci) {
      const s = document.createElement("span");
      s.className = "quest-status lock"; s.textContent = `🔒 Lv ${q.unlock}`;
      aksi.appendChild(s);
    } else {
      const btn = document.createElement("button");
      btn.className = "tombol";
      btn.textContent = "Tandai selesai";
      btn.addEventListener("click", async () => {
        if (confirm(`Selesaikan quest "${q.nama}"?\n\nKonfirmasi jujur — hanya jika benar-benar tercapai.\nIdentitas: "${q.identitas}"   (+${q.xp} XP)`)) {
          await simpan("achievements", { id: q.id, nama: q.nama, hadiah: q.xp, dibuka: new Date().toISOString() });
          await renderDashboard();
        }
      });
      aksi.appendChild(btn);
    }
    row.append(info, aksi);
    list.appendChild(row);
  }
  card.appendChild(list);
  return card;
}

// Rakit seluruh dashboard.
async function renderDashboard() {
  const el = document.getElementById("dashboard");
  if (!el) return;
  el.innerHTML = "";

  const k = await ambilKarakter();
  const xp = await totalXP();

  el.appendChild(kartuKarakter(k, xp));
  el.appendChild(await panelSkillGate(k, xp));
  el.appendChild(await heatmapKonsistensi(84));
  el.appendChild(await trenMingguan(8));
  el.appendChild(await panelPemicu());
  el.appendChild(await panelTrophy());
}