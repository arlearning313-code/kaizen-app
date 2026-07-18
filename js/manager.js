// manager.js — MODUL 15 (dirombak): Manajer Habit (khusus desktop).
// Field form mengikuti kartu habit di dokumen (Bab VI): Kategori, Frekuensi,
// Tingkat Dampak, Tingkat Kesulitan, Tujuan, Masalah, Alasan Penting, Deskripsi.
// Tak ada lagi Tier / Rarity / XP / tangga level.

const DAMPAK = ["Sangat Tinggi", "Tinggi", "Sedang", "Rendah-Sedang", "Rendah"];
const KESULITAN = ["Sangat Sulit", "Sedang-Sulit", "Sedang", "Mudah-Sedang", "Mudah"];

function escAttr(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function labelFrekuensi(f) {
  if (!f) return "?";
  if (f.tipe === "mingguan") return "Mingguan";
  if (f.tipe === "bulanan") return "Bulanan";
  if (f.tipe === "opsional") return "Ongoing/opsional";
  return "Harian";
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
  nm.textContent = `${h.id} · ${h.nama}`;
  const meta = document.createElement("div");
  meta.className = "manajer-meta";
  const bag = [h.kategori || "—", labelFrekuensi(h.frekuensi)];
  if (h.frekuensi?.detil) bag.push(h.frekuensi.detil);
  if (h.dampak) bag.push("Dampak " + h.dampak);
  if (h.kesulitan) bag.push(h.kesulitan);
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
    : {
        id: "", nama: "", kategori: "",
        frekuensi: { tipe: "harian", detil: "" },
        dampak: "Sedang", kesulitan: "Sedang",
        tujuan: "", masalah: "", alasan: "", deskripsi: "",
        aktif: true, diubah: 0,
      };
  if (!h.frekuensi) h.frekuensi = { tipe: "harian" };

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  const modal = document.createElement("div");
  modal.className = "modal modal-lebar";
  modal.innerHTML = `
    <h2 class="modal-judul">${baru ? "Habit Baru" : "Edit Habit"}</h2>
    <p class="modal-desk">Isi mengikuti kartu habit di dokumen (Bab VI).</p>
    <label class="modal-label">ID (unik, mis. H-01)
      <input class="modal-input" id="f-id" value="${escAttr(h.id)}" ${baru ? "" : "readonly"}>
    </label>
    <label class="modal-label">Nama
      <input class="modal-input" id="f-nama" value="${escAttr(h.nama)}">
    </label>
    <label class="modal-label">Kategori (mis. Fisik · Spiritual · Karier, Sosial)
      <input class="modal-input" id="f-kategori" value="${escAttr(h.kategori)}">
    </label>
    <label class="modal-label">Frekuensi
      <select class="modal-input" id="f-frek">
        ${[["harian","Harian"],["mingguan","Mingguan"],["bulanan","Bulanan"],["opsional","Ongoing / opsional"]]
          .map(([v,t]) => `<option value="${v}" ${h.frekuensi?.tipe===v?"selected":""}>${t}</option>`).join("")}
      </select>
    </label>
    <label class="modal-label">Takaran / detail (opsional, mis. "30 menit", "3 push up")
      <input class="modal-input" id="f-detil" value="${escAttr(h.frekuensi?.detil||"")}">
    </label>
    <label class="modal-label" id="wrap-hari" style="display:none">Hari (0=Min … 6=Sab), pisah koma
      <input class="modal-input" id="f-hari" value="${(h.frekuensi?.hari||[]).join(",")}">
    </label>
    <label class="modal-label" id="wrap-tanggal" style="display:none">Tanggal (1–31)
      <input class="modal-input" id="f-tanggal" type="number" min="1" max="31" value="${h.frekuensi?.tanggal||1}">
    </label>
    <label class="modal-label">Tingkat Dampak
      <select class="modal-input" id="f-dampak">
        ${DAMPAK.map((d) => `<option ${h.dampak===d?"selected":""}>${d}</option>`).join("")}
      </select>
    </label>
    <label class="modal-label">Tingkat Kesulitan
      <select class="modal-input" id="f-kesulitan">
        ${KESULITAN.map((d) => `<option ${h.kesulitan===d?"selected":""}>${d}</option>`).join("")}
      </select>
    </label>
    <label class="modal-label">Tujuan
      <textarea class="modal-input" id="f-tujuan" rows="2">${escAttr(h.tujuan)}</textarea>
    </label>
    <label class="modal-label">Masalah yang Diselesaikan
      <textarea class="modal-input" id="f-masalah" rows="2">${escAttr(h.masalah)}</textarea>
    </label>
    <label class="modal-label">Alasan Penting
      <textarea class="modal-input" id="f-alasan" rows="3">${escAttr(h.alasan)}</textarea>
    </label>
    <label class="modal-label">Deskripsi (opsional)
      <textarea class="modal-input" id="f-deskripsi" rows="2">${escAttr(h.deskripsi)}</textarea>
    </label>
    <label class="modal-label" style="display:flex;align-items:center;gap:8px">
      <input type="checkbox" id="f-aktif" ${h.aktif?"checked":""} style="width:auto"> Aktif (tampil di checklist)
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

  modal.querySelector("#btn-batal").addEventListener("click", () => overlay.remove());
  modal.querySelector("#btn-simpan").addEventListener("click", async () => {
    const val = (id) => modal.querySelector(id).value.trim();
    const data = {
      id: val("#f-id"),
      nama: val("#f-nama"),
      kategori: val("#f-kategori"),
      dampak: modal.querySelector("#f-dampak").value,
      kesulitan: modal.querySelector("#f-kesulitan").value,
      tujuan: val("#f-tujuan"),
      masalah: val("#f-masalah"),
      alasan: val("#f-alasan"),
      deskripsi: val("#f-deskripsi"),
      aktif: modal.querySelector("#f-aktif").checked,
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
    if (await simpanHabit(data, baru)) overlay.remove();
  });
}

async function simpanHabit(data, baru) {
  if (!data.id) { alert("ID wajib diisi."); return false; }
  if (!data.nama) { alert("Nama wajib diisi."); return false; }
  if (baru && (await ambil("habits", data.id))) {
    alert(`ID "${data.id}" sudah dipakai. Pilih ID lain.`);
    return false;
  }
  await simpan("habits", data);
  await renderManajer();
  if (typeof tampilkanChecklist === "function") await tampilkanChecklist();
  return true;
}

async function hapusHabit(id) {
  if (!confirm(`Hapus habit "${id}"? Tindakan ini tidak bisa dibatalkan.`)) return;
  await hapus("habits", id);
  if (confirm("Hapus juga semua catatan (log) habit ini?")) {
    const logs = await ambilSemua("logs");
    for (const l of logs) if (l.habitId === id) await hapus("logs", l.id);
  }
  await renderManajer();
  if (typeof tampilkanChecklist === "function") await tampilkanChecklist();
}