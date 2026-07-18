// quest.js — Tab Quest (Jalur Penguasaan). Proyek belajar jangka panjang,
// dikerjakan 30–60 menit/hari. Centang sesi → akumulasi sesi & jam tumbuh.

const WARNA_QUEST = [
  ["#e8b04b", "Emas"], ["#f06a5a", "Merah"], ["#7fd1c4", "Teal"],
  ["#5aa9e6", "Biru"], ["#b57ee6", "Ungu"], ["#e79fb0", "Merah muda"],
];

// ID otomatis: Q-01, Q-02, …
async function idBerikutnyaQuest() {
  const qs = await ambilSemua("quests");
  let maks = 0;
  for (const q of qs) {
    const m = /^Q-(\d+)$/.exec(q.id || "");
    if (m) maks = Math.max(maks, Number(m[1]));
  }
  return "Q-" + String(maks + 1).padStart(2, "0");
}

// Jam estimasi = jumlah sesi × target menit ÷ 60.
function jamQuest(sesi, targetMenit) {
  return (sesi * (targetMenit || 30) / 60);
}

async function renderQuest() {
  const el = document.getElementById("manajer-quest");
  if (!el) return;
  el.innerHTML = "";

  const head = document.createElement("div");
  head.className = "manajer-head";
  const h2 = document.createElement("h2");
  h2.className = "manajer-judul";
  h2.textContent = "Quest · Jalur Penguasaan";
  const btnBaru = document.createElement("button");
  btnBaru.className = "tombol tombol-utama";
  btnBaru.textContent = "+ Quest Baru";
  btnBaru.addEventListener("click", () => bukaEditorQuest(null));
  head.append(h2, btnBaru);
  el.appendChild(head);

  const intro = document.createElement("p");
  intro.className = "qt-intro";
  intro.textContent = "Belajar singkat tapi dalam — 30–60 menit tiap hari. Yang penting muncul, bukan cepat selesai.";
  el.appendChild(intro);

  const quests = (await ambilSemua("quests")).sort((a, b) => (a.id > b.id ? 1 : -1));
  const logs = await ambilSemua("questLogs");
  const tanggal = tanggalHariIni();

  let totalSesi = 0, totalJam = 0;
  for (const q of quests) {
    const n = logs.filter((l) => l.questId === q.id).length;
    totalSesi += n;
    totalJam += jamQuest(n, q.targetMenit);
  }
  const agg = document.createElement("div");
  agg.className = "qt-agg";
  agg.innerHTML =
    `<span class="qt-agg-num">${totalSesi}</span> sesi · ` +
    `<span class="qt-agg-num">${totalJam.toFixed(1)}</span> jam total kamu bangun` +
    (quests.length ? ` di ${quests.length} jalur` : "");
  el.appendChild(agg);

  const list = document.createElement("div");
  list.className = "qt-list";
  if (quests.length === 0) {
    const kosong = document.createElement("p");
    kosong.className = "manajer-kosong";
    kosong.textContent = "Belum ada quest — klik “+ Quest Baru”.";
    list.appendChild(kosong);
  }
  for (const q of quests) list.appendChild(kartuQuest(q, logs, tanggal));
  el.appendChild(list);
}

function kartuQuest(q, logs, tanggal) {
  const sesi = logs.filter((l) => l.questId === q.id).length;
  const jam = jamQuest(sesi, q.targetMenit).toFixed(1);
  const sudah = logs.some((l) => l.id === `${tanggal}_${q.id}`);

  const card = document.createElement("div");
  card.className = "qt-card";
  card.style.setProperty("--qt-warna", q.warna || "#e8b04b");

  const head = document.createElement("div");
  head.className = "qt-head";
  const ikon = document.createElement("span");
  ikon.className = "qt-ikon";
  ikon.textContent = q.ikon || "⚔️";
  const info = document.createElement("div");
  info.className = "qt-info";
  const nm = document.createElement("div");
  nm.className = "qt-nama";
  nm.textContent = q.nama;
  const sub = document.createElement("div");
  sub.className = "qt-sub";
  sub.textContent = (q.sub ? q.sub + " · " : "") + (q.targetMenit || 30) + " mnt/hari";
  info.append(nm, sub);
  head.append(ikon, info);
  card.appendChild(head);

  const stat = document.createElement("div");
  stat.className = "qt-stat";
  stat.innerHTML = `<span class="qt-stat-num">${sesi}</span> sesi · <span class="qt-stat-num">~${jam}</span> jam total`;
  card.appendChild(stat);

  const aksi = document.createElement("div");
  aksi.className = "qt-aksi";
  const go = document.createElement("button");
  go.className = "qt-go" + (sudah ? " done" : "");
  go.textContent = sudah ? "Sudah hari ini ✓" : "Selesai sesi hari ini ✓";
  go.addEventListener("click", () => toggleSesiQuest(q, tanggal));
  const edit = document.createElement("button");
  edit.className = "tombol";
  edit.textContent = "Edit";
  edit.addEventListener("click", () => bukaEditorQuest(q));
  const hapus = document.createElement("button");
  hapus.className = "tombol";
  hapus.textContent = "Hapus";
  hapus.addEventListener("click", () => hapusQuest(q.id));
  aksi.append(go, edit, hapus);
  card.appendChild(aksi);

  return card;
}

async function toggleSesiQuest(q, tanggal) {
  const id = `${tanggal}_${q.id}`;
  const ada = await ambil("questLogs", id);
  if (ada) {
    await hapus("questLogs", id);
  } else {
    await simpan("questLogs", { id, questId: q.id, date: tanggal, diubah: Date.now() });
    if (typeof fxHabitSelesai === "function") fxHabitSelesai(q);
  }
  await renderQuest();
}

function bukaEditorQuest(quest) {
  const baru = !quest;
  const q = quest
    ? JSON.parse(JSON.stringify(quest))
    : { id: "", nama: "", sub: "", ikon: "⚔️", warna: "#e8b04b", targetMenit: 45, aktif: true, diubah: 0 };

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <h2 class="modal-judul">${baru ? "Quest Baru" : "Edit Quest"}</h2>
    <label class="modal-label">Nama (wajib)
      <input class="modal-input" id="q-nama" value="${escAttr(q.nama)}" placeholder="mis. Kursus Python">
    </label>
    <label class="modal-label">Deskripsi singkat (opsional)
      <input class="modal-input" id="q-sub" value="${escAttr(q.sub || "")}" placeholder="mis. Dasar → mahir">
    </label>
    <label class="modal-label">Target menit / hari
      <input class="modal-input" id="q-menit" type="number" min="5" max="240" value="${q.targetMenit || 45}">
    </label>
    <label class="modal-label">Ikon (emoji)
      <input class="modal-input" id="q-ikon" value="${escAttr(q.ikon || "⚔️")}" maxlength="2" placeholder="⚔️">
    </label>
    <label class="modal-label">Warna
      <select class="modal-input" id="q-warna">
        ${WARNA_QUEST.map(([v, t]) => `<option value="${v}" ${q.warna === v ? "selected" : ""}>${t}</option>`).join("")}
      </select>
    </label>
    <div class="modal-aksi">
      <button class="tombol" id="q-batal">Batal</button>
      <button class="tombol tombol-utama" id="q-simpan">Simpan</button>
    </div>`;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector("#q-nama").focus();
  modal.querySelector("#q-batal").addEventListener("click", () => overlay.remove());
  modal.querySelector("#q-simpan").addEventListener("click", async () => {
    const val = (id) => modal.querySelector(id).value.trim();
    const data = {
      id: baru ? await idBerikutnyaQuest() : q.id,
      nama: val("#q-nama"),
      sub: val("#q-sub"),
      ikon: val("#q-ikon") || "⚔️",
      warna: modal.querySelector("#q-warna").value,
      targetMenit: Number(modal.querySelector("#q-menit").value) || 45,
      aktif: true,
      diubah: Date.now(),
    };
    if (!data.nama) { alert("Nama wajib diisi."); return; }
    await simpan("quests", data);
    overlay.remove();
    await renderQuest();
  });
}

async function hapusQuest(id) {
  if (!confirm("Hapus quest ini? Semua catatan sesinya juga ikut terhapus.")) return;
  await hapus("quests", id);
  const logs = await ambilSemua("questLogs");
  for (const l of logs) if (l.questId === id) await hapus("questLogs", l.id);
  await renderQuest();
}