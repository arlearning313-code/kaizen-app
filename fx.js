// fx.js — STAGE 4: Efek mikro-interaksi. Semua efek hanya jalan di desktop (≥900px);
// di mobile fungsi-fungsi ini tidak menghasilkan apa pun → tampilan mobile tetap identik.

let fxPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
document.addEventListener("pointerdown", (e) => { fxPointer = { x: e.clientX, y: e.clientY }; }, true);

function fxDesktop() { return window.innerWidth >= 900; }

// Burst partikel dari titik (x,y).
function fxBurst(x, y, warna, jumlah = 12) {
  const wrap = document.createElement("div");
  wrap.className = "fx-burst";
  wrap.style.left = x + "px";
  wrap.style.top = y + "px";
  for (let i = 0; i < jumlah; i++) {
    const p = document.createElement("span");
    const sudut = (Math.PI * 2 * i) / jumlah + Math.random() * 0.5;
    const jarak = 26 + Math.random() * 34;
    p.style.setProperty("--dx", Math.cos(sudut) * jarak + "px");
    p.style.setProperty("--dy", Math.sin(sudut) * jarak + "px");
    p.style.setProperty("--warna", warna);
    p.style.animationDelay = Math.random() * 40 + "ms";
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 950);
}

// Angka "+XP" melayang naik.
function fxFloatXP(x, y, teks, warna) {
  const el = document.createElement("div");
  el.className = "fx-xp";
  el.textContent = teks;
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.color = warna;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

// Dipanggil dari toggleHabit saat sebuah habit BARU jadi selesai.
function fxHabitSelesai(habit) {
  if (!fxDesktop()) return;                 // mobile: tanpa efek
  const warna = getComputedStyle(document.documentElement).getPropertyValue("--gold").trim() || "#e8b04b";
  const { x, y } = fxPointer;
  fxBurst(x, y, warna);
  if (habit && habit.xp) fxFloatXP(x, y, "+" + habit.xp + " XP", warna);
}

// Perayaan level-up. Desktop = overlay; mobile = alert lama (teks identik).
function rayakanLevelUp(levelBaru, st) {
  if (!fxDesktop()) {
    alert(`⬆️ Naik ke Level ${levelBaru}${st ? " · " + st.nama : ""}!\n\nTerus melangkah. 📈`);
    return;
  }
  const stg = (typeof stageVisual === "function" && st) ? stageVisual(st.no) : { kanji: "改", c1: "#e8b04b" };
  const ov = document.createElement("div");
  ov.className = "fx-levelup";
  ov.style.setProperty("--c1", stg.c1);
  ov.innerHTML = `
    <div class="fx-lu-flash"></div>
    <div class="fx-lu-kartu">
      <div class="fx-lu-kanji">${stg.kanji}</div>
      <div class="fx-lu-label">LEVEL UP</div>
      <div class="fx-lu-level">Level ${levelBaru}</div>
      <div class="fx-lu-stage">${st ? "Stage " + st.no + " · " + st.nama : ""}</div>
    </div>`;
  document.body.appendChild(ov);

  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  for (let n = 0; n < 3; n++) setTimeout(() => fxBurst(cx, cy, stg.c1, 16), n * 160);

  const tutup = () => { ov.classList.add("keluar"); setTimeout(() => ov.remove(), 500); };
  ov.addEventListener("click", tutup);
  setTimeout(tutup, 2400);
}