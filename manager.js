// manager.js — MODUL 15: Manajer Habit (khusus desktop).
// CRUD habit + editor tangga level. Menulis langsung ke store "habits".
// Prinsip dokumen: HP untuk MENJALANI, desktop untuk MENGATUR.

// ── Migrasi skema: habit lama (field "kaizen") → array "levels" ────────
// Aman diulang: hanya menyentuh habit yang belum punya "levels".
async function migrasiHabits() {
  const habits = await ambilSemua("habits");
  let diubah = 0;
  for (const h of habits) {
    if (Array.isArray(h.levels)) continue;          // sudah skema baru → lewati
    if (h.kaizen) {
      // habit ber-tangga lama → jadikan 1 level dari target sekarang
      h.levels = [{
        level: 1,
        milestone: "Level 1",
        target: `${h.kaizen.target} ${h.kaizen.satuan}`,
        nilai: h.kaizen.target,
        satuan: h.kaizen.satuan,
      }];
      h.levelSekarang = h.kaizen.level || 1;
    } else {
      // habit ya/tidak → 1 level tanpa angka (checklist tampilkan nama saja)
      h.levels = [{ level: 1, milestone: "", target: "", nilai: null, satuan: "" }];
      h.levelSekarang = 1;
    }
    delete h.kaizen;                                 // buang field lama
    h.diubah = Date.now();
    await simpan("habits", h);
    diubah++;
  }
  if (diubah) console.log(`Migrasi: ${diubah} habit mendapat "levels".`);
  return diubah;
}

// ── Bantu kecil ────────────────────────────────────────────────────────
function levelAktif(h) {
  if (!Array.isArray(h.levels) || h.levels.length === 0) return null;
  return h.levels.find((l) => l.level === h.levelSekarang) || h.levels[0];
}
function escAttr(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Daftar habit dikelompokkan: aktif (sedang dikerjakan) vs nonaktif ──
async function renderManajer() {
  const el = document.getElementById("manajer");
  if (!el) return;
  el.innerHTML = "";

  const head = document.createElement("div");
  head.className = "manajer-head";
  const h2 = document.createElement("h2");
  h2.className = "manajer-judul";
  h2.textContent = "Manajer Habit";
  const btnBaru = document.createElement("button");
  btnBaru.className = "tombol tombol-utama";
  btnBaru.textContent = "+ Habit Baru";
  btnBaru.addEventListener("click", () => bukaEditorHabit(null));
  head.append(h2, btnBaru);
  el.appendChild(head);

  const habits = (await ambilSemua("habits")).sort((a, b) => (a.id > b.id ? 1 : -1));
  const aktif = habits.filter((h) => h.aktif);
  const nonaktif = habits.filter((h) => !h.aktif);

  el.appendChild(grupHabit("Sedang dikerjakan", aktif, "Belum ada habit aktif — nyalakan sakelar di bawah."));
  el.appendChild(grupHabit("Nonaktif (arsip)", nonaktif, "Semua habit sedang aktif. 🌱"));
}

// Satu grup (judul + hitungan + daftar baris, atau pesan kosong).
function grupHabit(judul, daftarHabit, pesanKosong) {
  const wrap = document.createElement("div");

  const jud = document.createElement("div");
  jud.className = "manajer-grup-judul";
  jud.innerHTML = `${judul} · <span class="jml">${daftarHabit.length} habit</span>`;
  wrap.appendChild(jud);

  if (daftarHabit.length === 0) {
    const kosong = document.createElement("p");
    kosong.className = "manajer-kosong";
    kosong.textContent = pesanKosong;
    wrap.appendChild(kosong);
    return wrap;
  }

  const list = document.createElement("div");
  list.className = "manajer-list";
  for (const h of daftarHabit) list.appendChild(barisManajer(h));
  wrap.appendChild(list);
  return wrap;
}

// Satu baris habit: [sakelar] [info] [Edit] [Hapus].
function barisManajer(h) {
  const lv = levelAktif(h);
  const baris = document.createElement("div");
  baris.className = "manajer-baris" + (h.aktif ? "" : " nonaktif");

  const sw = document.createElement("label");
  sw.className = "switch";
  sw.title = h.aktif ? "Sedang dikerjakan — klik untuk nonaktifkan" : "Nonaktif — klik untuk mulai kerjakan";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = !!h.aktif;
  cb.addEventListener("change", () => toggleAktif(h.id));
  const slider = document.createElement("span");
  slider.className = "slider";
  sw.append(cb, slider);

  const info = document.createElement("div");
  info.className = "manajer-info";
  const nm = document.createElement("div");
  nm.className = "manajer-nama";
  nm.textContent = `${h.id} · ${h.nama}`;
  const meta = document.createElement("div");
  meta.className = "manajer-meta";
  const tangga = Array.isArray(h.levels) ? `${h.levels.length} level` : "—";
  meta.textContent =
    `Tier ${h.tier} · ${h.xp} XP · ${h.frekuensi?.tipe || "?"} · ${tangga}` +
    (lv && lv.target ? ` · sekarang: ${lv.target}` : "");
  info.append(nm, meta);

  const aksi = document.createElement("div");
  aksi.className = "manajer-aksi";
  const btnEdit = document.createElement("button");
  btnEdit.className = "tombol";
  btnEdit.textContent = "Edit";
  btnEdit.addEventListener("click", () => bukaEditorHabit(h));
  const btnHapus = document.createElement("button");
  btnHapus.className = "tombol";
  btnHapus.textContent = "Hapus";
  btnHapus.addEventListener("click", () => hapusHabit(h.id));
  aksi.append(btnEdit, btnHapus);

  baris.append(sw, info, aksi);
  return baris;
}

// Nyalakan/matikan satu habit langsung dari daftar.
async function toggleAktif(id) {
  const h = await ambil("habits", id);
  if (!h) return;
  h.aktif = !h.aktif;
  h.diubah = Date.now();
  await simpan("habits", h);
  await renderManajer();
  if (typeof tampilkanChecklist === "function") await tampilkanChecklist();
  if (typeof renderDashboard === "function") await renderDashboard();
}

// ── Editor modal: buat baru (habit=null) atau edit ─────────────────────
function bukaEditorHabit(habit) {
  const baru = !habit;
  // salin dalam agar batal tidak mengubah data asli
  const h = habit
    ? JSON.parse(JSON.stringify(habit))
    : {
        id: "", nama: "", kategori: "", tier: "B", rarity: "common",
        xp: 10, frekuensi: { tipe: "harian" }, aktif: true,
        levelSekarang: 1,
        levels: [{ level: 1, milestone: "", target: "", nilai: null, satuan: "" }],
        diubah: 0,
      };
  if (!Array.isArray(h.levels) || h.levels.length === 0) {
    h.levels = [{ level: 1, milestone: "", target: "", nilai: null, satuan: "" }];
  }

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  const modal = document.createElement("div");
  modal.className = "modal modal-lebar";
  modal.innerHTML = `
    <h2 class="modal-judul">${baru ? "Habit Baru" : "Edit Habit"}</h2>
    <p class="modal-desk">Perubahan langsung tersimpan ke penyimpananmu.</p>
    <label class="modal-label">ID (unik, mis. H-28)
      <input class="modal-input" id="f-id" value="${escAttr(h.id)}" ${baru ? "" : "readonly"}>
    </label>
    <label class="modal-label">Nama
      <input class="modal-input" id="f-nama" value="${escAttr(h.nama)}">
    </label>
    <label class="modal-label">Kategori
      <input class="modal-input" id="f-kategori" value="${escAttr(h.kategori)}">
    </label>
    <label class="modal-label">Tier
      <select class="modal-input" id="f-tier">
        ${["S","A","B","C"].map((t) => `<option ${h.tier===t?"selected":""}>${t}</option>`).join("")}
      </select>
    </label>
    <label class="modal-label">Rarity
      <select class="modal-input" id="f-rarity">
        ${["common","rare","epic","legendary"].map((r) => `<option ${h.rarity===r?"selected":""}>${r}</option>`).join("")}
      </select>
    </label>
    <label class="modal-label">XP per centang
      <input class="modal-input" id="f-xp" type="number" min="0" value="${h.xp}">
    </label>
    <label class="modal-label">Frekuensi
      <select class="modal-input" id="f-frek">
        ${["harian","mingguan","bulanan"].map((t) => `<option value="${t}" ${h.frekuensi?.tipe===t?"selected":""}>${t}</option>`).join("")}
      </select>
    </label>
    <label class="modal-label" id="wrap-hari" style="display:none">Hari (0=Min … 6=Sab), pisah koma
      <input class="modal-input" id="f-hari" value="${(h.frekuensi?.hari||[]).join(",")}">
    </label>
    <label class="modal-label" id="wrap-tanggal" style="display:none">Tanggal (1–31)
      <input class="modal-input" id="f-tanggal" type="number" min="1" max="31" value="${h.frekuensi?.tanggal||1}">
    </label>
    <label class="modal-label" style="display:flex;align-items:center;gap:8px">
      <input type="checkbox" id="f-aktif" ${h.aktif?"checked":""} style="width:auto"> Aktif (tampil di checklist)
    </label>

    <h3 class="modal-sub">Tangga Level</h3>
    <p class="modal-desk">Tiap level: milestone · target (teks) · nilai (angka, opsional) · satuan.</p>
    <div class="level-head">
      <span>Lv</span><span>Milestone</span><span>Target</span><span>Nilai</span><span>Satuan</span><span></span>
    </div>
    <div id="level-list"></div>
    <button class="tombol" id="btn-tambah-level" style="margin-top:8px">+ Tambah Level</button>

    <div class="modal-aksi">
      <button class="tombol" id="btn-batal">Batal</button>
      <button class="tombol tombol-utama" id="btn-simpan">Simpan</button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Frekuensi: tampilkan input tambahan sesuai tipe
  const selFrek = modal.querySelector("#f-frek");
  const wrapHari = modal.querySelector("#wrap-hari");
  const wrapTgl = modal.querySelector("#wrap-tanggal");
  function toggleFrek() {
    wrapHari.style.display = selFrek.value === "mingguan" ? "block" : "none";
    wrapTgl.style.display = selFrek.value === "bulanan" ? "block" : "none";
  }
  selFrek.addEventListener("change", toggleFrek);
  toggleFrek();

  // Baris-baris level
  const levelList = modal.querySelector("#level-list");
  function gambarLevels() {
    levelList.innerHTML = "";
    h.levels.forEach((lv, i) => {
      const row = document.createElement("div");
      row.className = "level-row";
      row.innerHTML = `
        <span class="level-no">${i + 1}</span>
        <input class="modal-input lv-milestone" placeholder="milestone" value="${escAttr(lv.milestone||"")}">
        <input class="modal-input lv-target" placeholder="mis. 5 push up/hari" value="${escAttr(lv.target||"")}">
        <input class="modal-input lv-nilai" type="number" placeholder="nilai" value="${lv.nilai ?? ""}">
        <input class="modal-input lv-satuan" placeholder="satuan" value="${escAttr(lv.satuan||"")}">
        <button class="tombol lv-hapus" title="Hapus level">✕</button>
      `;
      row.querySelector(".lv-milestone").addEventListener("input", (e) => (lv.milestone = e.target.value));
      row.querySelector(".lv-target").addEventListener("input", (e) => (lv.target = e.target.value));
      row.querySelector(".lv-nilai").addEventListener("input", (e) => (lv.nilai = e.target.value === "" ? null : Number(e.target.value)));
      row.querySelector(".lv-satuan").addEventListener("input", (e) => (lv.satuan = e.target.value));
      row.querySelector(".lv-hapus").addEventListener("click", () => {
        if (h.levels.length <= 1) { alert("Minimal harus ada 1 level."); return; }
        h.levels.splice(i, 1);
        h.levels.forEach((l, idx) => (l.level = idx + 1)); // rapikan nomor
        gambarLevels();
      });
      levelList.appendChild(row);
    });
  }
  gambarLevels();

  modal.querySelector("#btn-tambah-level").addEventListener("click", () => {
    h.levels.push({ level: h.levels.length + 1, milestone: "", target: "", nilai: null, satuan: "" });
    gambarLevels();
  });

  modal.querySelector("#btn-batal").addEventListener("click", () => overlay.remove());
  modal.querySelector("#btn-simpan").addEventListener("click", async () => {
    const data = {
      id: modal.querySelector("#f-id").value.trim(),
      nama: modal.querySelector("#f-nama").value.trim(),
      kategori: modal.querySelector("#f-kategori").value.trim(),
      tier: modal.querySelector("#f-tier").value,
      rarity: modal.querySelector("#f-rarity").value,
      xp: Number(modal.querySelector("#f-xp").value) || 0,
      aktif: modal.querySelector("#f-aktif").checked,
      levelSekarang: h.levelSekarang || 1,
      levels: h.levels,
      diubah: Date.now(),
    };
    const tipe = selFrek.value;
    if (tipe === "mingguan") {
      data.frekuensi = {
        tipe,
        hari: modal.querySelector("#f-hari").value.split(",")
          .map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n)),
      };
    } else if (tipe === "bulanan") {
      data.frekuensi = { tipe, tanggal: Number(modal.querySelector("#f-tanggal").value) || 1 };
    } else {
      data.frekuensi = { tipe: "harian" };
    }
    if (await simpanHabit(data, baru)) overlay.remove();
  });
}

// ── Simpan (dengan validasi) ───────────────────────────────────────────
async function simpanHabit(data, baru) {
  if (!data.id) { alert("ID wajib diisi."); return false; }
  if (!data.nama) { alert("Nama wajib diisi."); return false; }
  if (baru && (await ambil("habits", data.id))) {
    alert(`ID "${data.id}" sudah dipakai. Pilih ID lain.`);
    return false;
  }
  if (!Array.isArray(data.levels) || data.levels.length === 0) {
    data.levels = [{ level: 1, milestone: "", target: "", nilai: null, satuan: "" }];
  }
  if (!data.levelSekarang || data.levelSekarang < 1) data.levelSekarang = 1;
  if (data.levelSekarang > data.levels.length) data.levelSekarang = data.levels.length;

  await simpan("habits", data);
  await renderManajer();
  if (typeof tampilkanChecklist === "function") await tampilkanChecklist();
  if (typeof renderDashboard === "function") await renderDashboard();
  return true;
}

// ── Hapus (dengan konfirmasi; opsi bersihkan log) ──────────────────────
async function hapusHabit(id) {
  if (!confirm(`Hapus habit "${id}"? Tindakan ini tidak bisa dibatalkan.`)) return;
  await hapus("habits", id);
  if (confirm("Hapus juga semua catatan (log) habit ini?")) {
    const logs = await ambilSemua("logs");
    for (const l of logs) if (l.habitId === id) await hapus("logs", l.id);
  }
  await renderManajer();
  if (typeof tampilkanChecklist === "function") await tampilkanChecklist();
  if (typeof renderDashboard === "function") await renderDashboard();
}