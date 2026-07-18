// manager.js — MODUL 15 (disederhanakan): Manajer Habit (desktop).
// Form ringkas: Nama (wajib) + Kategori + Frekuensi + Takaran + Catatan. ID otomatis.

const KATEGORI = ["Anti-Corrupt", "Karier", "Fisik", "Spiritual", "Mental", "Sosial", "Emosional", "Lainnya"];

function escAttr(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function labelFrekuensi(f) {
  if (!f) return "Harian";
  if (f.tipe === "mingguan") return "Mingguan";
  if (f.tipe === "bulanan") return "Bulanan";
  if (f.tipe === "opsional") return "Opsional";
  return "Harian";
}

// ID otomatis: H-01, H-02, … (cari nomor terbesar yang ada, +1).
async function idBerikutnya() {
  const habits = await ambilSemua("habits");
  let maks = 0;
  for (const h of habits) {
    const m = /^H-(\d+)$/.exec(h.id || "");
    if (m) maks = Math.max(maks, Number(m[1]));
  }
  return "H-" + String(maks + 1).padStart(2, "0");
}

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

  el.appendChild(grupHabit("Sedang dikerjakan", aktif, "Belum ada habit — klik “+ Habit Baru”."));
  el.appendChild(grupHabit("Nonaktif (arsip)", nonaktif, "Semua habit sedang aktif. 🌱"));
}

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

function barisManajer(h) {
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
  nm.textContent = h.nama;
  const meta = document.createElement("div");
  meta.className = "manajer-meta";
  const bag = [h.kategori || "Lainnya", labelFrekuensi(h.frekuensi)];
  if (h.frekuensi?.detil) bag.push(h.frekuensi.detil);
  meta.textContent = bag.join(" · ");
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

async function toggleAktif(id) {
  const h = await ambil("habits", id);
  if (!h) return;
  h.aktif = !h.aktif;
  h.diubah = Date.now();
  await simpan("habits", h);
  await renderManajer();
  if (typeof tampilkanChecklist === "function") await tampilkanChecklist();
}

function bukaEditorHabit(habit) {
  const baru = !habit;
  const h = habit
    ? JSON.parse(JSON.stringify(habit))
    : { id: "", nama: "", kategori: "Lainnya", frekuensi: { tipe: "harian", detil: "" }, catatan: "", aktif: true, diubah: 0 };
  if (!h.frekuensi) h.frekuensi = { tipe: "harian" };

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <h2 class="modal-judul">${baru ? "Habit Baru" : "Edit Habit"}</h2>
    <label class="modal-label">Nama (wajib)
      <input class="modal-input" id="f-nama" value="${escAttr(h.nama)}" placeholder="mis. Belajar Bahasa Jepang">
    </label>
    <label class="modal-label">Kategori
      <select class="modal-input" id="f-kategori">
        ${KATEGORI.map((k) => `<option ${h.kategori===k?"selected":""}>${k}</option>`).join("")}
      </select>
    </label>
    <label class="modal-label">Frekuensi
      <select class="modal-input" id="f-frek">
        ${[["harian","Setiap hari"],["mingguan","Mingguan"],["bulanan","Bulanan"],["opsional","Opsional (tak dihitung skor)"]]
          .map(([v,t]) => `<option value="${v}" ${h.frekuensi?.tipe===v?"selected":""}>${t}</option>`).join("")}
      </select>
    </label>
    <label class="modal-label" id="wrap-hari" style="display:none">Hari (0=Min … 6=Sab), pisah koma
      <input class="modal-input" id="f-hari" value="${(h.frekuensi?.hari||[]).join(",")}">
    </label>
    <label class="modal-label" id="wrap-tanggal" style="display:none">Tanggal (1–31)
      <input class="modal-input" id="f-tanggal" type="number" min="1" max="31" value="${h.frekuensi?.tanggal||1}">
    </label>
    <label class="modal-label">Takaran (opsional)
      <input class="modal-input" id="f-detil" value="${escAttr(h.frekuensi?.detil||"")}" placeholder='mis. "30 menit", "3 push up"'>
    </label>
    <label class="modal-label">Catatan / alasan (opsional)
      <textarea class="modal-input" id="f-catatan" rows="2" placeholder="Kenapa habit ini penting buatmu?">${escAttr(h.catatan||"")}</textarea>
    </label>

    <div class="modal-aksi">
      <button class="tombol" id="btn-batal">Batal</button>
      <button class="tombol tombol-utama" id="btn-simpan">Simpan</button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const selFrek = modal.querySelector("#f-frek");
  const wrapHari = modal.querySelector("#wrap-hari");
  const wrapTgl = modal.querySelector("#wrap-tanggal");
  function toggleFrek() {
    wrapHari.style.display = selFrek.value === "mingguan" ? "block" : "none";
    wrapTgl.style.display = selFrek.value === "bulanan" ? "block" : "none";
  }
  selFrek.addEventListener("change", toggleFrek);
  toggleFrek();

  modal.querySelector("#f-nama").focus();
  modal.querySelector("#btn-batal").addEventListener("click", () => overlay.remove());
  modal.querySelector("#btn-simpan").addEventListener("click", async () => {
    const val = (id) => modal.querySelector(id).value.trim();
    const data = {
      id: baru ? await idBerikutnya() : h.id,
      nama: val("#f-nama"),
      kategori: modal.querySelector("#f-kategori").value,
      catatan: val("#f-catatan"),
      aktif: baru ? true : !!h.aktif,
      diubah: Date.now(),
    };
    const tipe = selFrek.value;
    const detil = val("#f-detil");
    if (tipe === "mingguan") {
      data.frekuensi = { tipe, detil, hari: val("#f-hari").split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n)) };
    } else if (tipe === "bulanan") {
      data.frekuensi = { tipe, detil, tanggal: Number(modal.querySelector("#f-tanggal").value) || 1 };
    } else {
      data.frekuensi = { tipe, detil };
    }
    if (await simpanHabit(data)) overlay.remove();
  });
}

async function simpanHabit(data) {
  if (!data.nama) { alert("Nama wajib diisi."); return false; }
  await simpan("habits", data);
  await renderManajer();
  if (typeof tampilkanChecklist === "function") await tampilkanChecklist();
  return true;
}

async function hapusHabit(id) {
  if (!confirm("Hapus habit ini? Tindakan ini tidak bisa dibatalkan.")) return;
  await hapus("habits", id);
  if (confirm("Hapus juga semua catatan (log) habit ini?")) {
    const logs = await ambilSemua("logs");
    for (const l of logs) if (l.habitId === id) await hapus("logs", l.id);
  }
  await renderManajer();
  if (typeof tampilkanChecklist === "function") await tampilkanChecklist();
}