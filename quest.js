// quest.js — Main Quest: tampil & bisa dicentang di MOBILE,
// serta CRUD (tambah/edit/hapus) di DESKTOP.
// Definisi quest disimpan sebagai 1 record di store "settings" (key "quests")
// — tanpa mengubah skema DB. Status "selesai" tetap di store "achievements"
// (id "Q-…") seperti Modul 18, jadi XP-nya otomatis dihitung totalXP().

// ── Penyimpanan definisi quest ─────────────────────────────────────────
async function ambilQuests() {
  const rec = await ambil("settings", "quests");
  return rec && Array.isArray(rec.value) ? rec.value : [];
}
async function simpanQuests(daftar) {
  await simpan("settings", { key: "quests", value: daftar });
}
async function seedQuestsJikaKosong() {
  const ada = await ambilQuests();
  if (ada.length > 0) return;
  await simpanQuests(KONFIG.quests || []);
  console.log(`Seed quest — ${(KONFIG.quests || []).length} quest dimasukkan.`);
}

// ── Status selesai (pakai store achievements yang sudah ada) ────────────
async function questSelesaiSet() {
  return new Set((await ambilSemua("achievements")).map((a) => a.id));
}
async function toggleQuest(q) {
  const sudah = await ambil("achievements", q.id);
  if (sudah) {
    await hapus("achievements", q.id);                    // batal selesai
  } else {
    await simpan("achievements", { id: q.id, nama: q.nama, hadiah: q.xp, dibuka: new Date().toISOString() });
  }
  await renderQuestMobile();
  if (typeof renderManajerQuest === "function") await renderManajerQuest();
  if (typeof renderDashboard === "function") await renderDashboard();
}

// ── MOBILE: daftar quest yang bisa dicentang ───────────────────────────
async function renderQuestMobile() {
  const el = document.getElementById("quest-mobile");
  if (!el) return;
  el.innerHTML = "";

  const quests = (await ambilQuests()).slice().sort((a, b) => a.unlock - b.unlock);
  if (quests.length === 0) return;

  const k = await ambilKarakter();
  const selesai = await questSelesaiSet();

  const judul = document.createElement("h2");
  judul.className = "quest-mobile-judul";
  judul.textContent = "Main Quest";
  el.appendChild(judul);

  const ul = document.createElement("ul");
  ul.className = "daftar";
  for (const q of quests) {
    const sudah = selesai.has(q.id);
    const terkunci = k.level < q.unlock;

    const li = document.createElement("li");
    li.className = "baris" + (sudah ? " selesai" : "") + (terkunci && !sudah ? " terkunci" : "");

    const kotak = document.createElement("span");
    kotak.className = "kotak" + (sudah ? " on" : "");

    const nama = document.createElement("span");
    nama.className = "nama";
    nama.textContent = sudah ? `${q.nama} — "${q.identitas}"` : q.nama;

    li.append(kotak, nama);

    if (terkunci && !sudah) {
      const badge = document.createElement("span");
      badge.className = "badge-lock";
      badge.textContent = `🔒 Lv ${q.unlock}`;
      li.appendChild(badge);
    } else {
      const badge = document.createElement("span");
      badge.className = "badge-xp";
      badge.textContent = `+${q.xp} XP`;
      li.appendChild(badge);
      li.addEventListener("click", () => {
        if (!sudah && !confirm(`Selesaikan "${q.nama}"?\n\nJujur — hanya jika benar-benar tercapai.\n"${q.identitas}"   (+${q.xp} XP)`)) return;
        toggleQuest(q);
      });
    }
    ul.appendChild(li);
  }
  el.appendChild(ul);
}

// ── DESKTOP: Manajer Quest (CRUD) ──────────────────────────────────────
async function renderManajerQuest() {
  const el = document.getElementById("manajer-quest");
  if (!el) return;
  el.innerHTML = "";

  const head = document.createElement("div");
  head.className = "manajer-head";
  const h2 = document.createElement("h2");
  h2.className = "manajer-judul";
  h2.textContent = "Manajer Quest";
  const btnBaru = document.createElement("button");
  btnBaru.className = "tombol tombol-utama";
  btnBaru.textContent = "+ Quest Baru";
  btnBaru.addEventListener("click", () => bukaEditorQuest(null));
  head.append(h2, btnBaru);
  el.appendChild(head);

  const quests = (await ambilQuests()).slice().sort((a, b) => a.unlock - b.unlock);
  const selesai = await questSelesaiSet();
  const list = document.createElement("div");
  list.className = "manajer-list";
  for (const q of quests) {
    const baris = document.createElement("div");
    baris.className = "manajer-baris";

    const info = document.createElement("div");
    info.className = "manajer-info";
    const nm = document.createElement("div");
    nm.className = "manajer-nama";
    nm.textContent = q.nama + (selesai.has(q.id) ? " ✅" : "");
    const meta = document.createElement("div");
    meta.className = "manajer-meta";
    meta.textContent = `Unlock Lv ${q.unlock} · +${q.xp} XP · "${q.identitas}"`;
    info.append(nm, meta);

    const aksi = document.createElement("div");
    aksi.className = "manajer-aksi";
    const bEdit = document.createElement("button");
    bEdit.className = "tombol"; bEdit.textContent = "Edit";
    bEdit.addEventListener("click", () => bukaEditorQuest(q));
    const bHapus = document.createElement("button");
    bHapus.className = "tombol"; bHapus.textContent = "Hapus";
    bHapus.addEventListener("click", () => hapusQuest(q.id));
    aksi.append(bEdit, bHapus);

    baris.append(info, aksi);
    list.appendChild(baris);
  }
  el.appendChild(list);
}

function bukaEditorQuest(quest) {
  const baru = !quest;
  const q = quest ? { ...quest } : { id: "", nama: "", unlock: 1, xp: 100, identitas: "" };

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <h2 class="modal-judul">${baru ? "Quest Baru" : "Edit Quest"}</h2>
    <label class="modal-label">ID (unik, mis. Q-python-dasar)
      <input class="modal-input" id="q-id" value="${escAttr(q.id)}" ${baru ? "" : "readonly"}>
    </label>
    <label class="modal-label">Nama quest
      <input class="modal-input" id="q-nama" value="${escAttr(q.nama)}">
    </label>
    <label class="modal-label">Terbuka di Level
      <input class="modal-input" id="q-unlock" type="number" min="1" value="${q.unlock}">
    </label>
    <label class="modal-label">XP hadiah
      <input class="modal-input" id="q-xp" type="number" min="0" value="${q.xp}">
    </label>
    <label class="modal-label">Kalimat identitas
      <input class="modal-input" id="q-ident" value="${escAttr(q.identitas)}">
    </label>
    <div class="modal-aksi">
      <button class="tombol" id="q-batal">Batal</button>
      <button class="tombol tombol-utama" id="q-simpan">Simpan</button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector("#q-batal").addEventListener("click", () => overlay.remove());
  modal.querySelector("#q-simpan").addEventListener("click", async () => {
    const data = {
      id: modal.querySelector("#q-id").value.trim(),
      nama: modal.querySelector("#q-nama").value.trim(),
      unlock: Number(modal.querySelector("#q-unlock").value) || 1,
      xp: Number(modal.querySelector("#q-xp").value) || 0,
      identitas: modal.querySelector("#q-ident").value.trim(),
    };
    if (await simpanQuest(data, baru)) overlay.remove();
  });
}

async function simpanQuest(data, baru) {
  if (!data.id) { alert("ID wajib diisi."); return false; }
  if (!data.nama) { alert("Nama wajib diisi."); return false; }
  const daftar = await ambilQuests();
  const idx = daftar.findIndex((x) => x.id === data.id);
  if (baru && idx !== -1) { alert(`ID "${data.id}" sudah dipakai.`); return false; }
  if (idx === -1) daftar.push(data);
  else daftar[idx] = data;
  await simpanQuests(daftar);
  await renderManajerQuest();
  await renderQuestMobile();
  return true;
}

async function hapusQuest(id) {
  if (!confirm(`Hapus quest "${id}"? Tindakan ini tidak bisa dibatalkan.`)) return;
  const daftar = (await ambilQuests()).filter((x) => x.id !== id);
  await simpanQuests(daftar);
  await hapus("achievements", id);   // bersihkan status selesai kalau ada
  await renderManajerQuest();
  await renderQuestMobile();
  if (typeof renderDashboard === "function") await renderDashboard();
}