// fx.js — Efek mikro-interaksi: burst partikel, "+XP" melayang, perayaan level-up.
// Berlaku UNIVERSAL (mobile + desktop) karena semuanya terkait aksi centang habit.

let fxPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
document.addEventListener("pointerdown", (e) => { fxPointer = { x: e.clientX, y: e.clientY }; }, true);

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

// Dipanggil dari toggleHabit saat sebuah habit BARU jadi selesai.
function fxHabitSelesai(habit) {
  const warna = getComputedStyle(document.documentElement).getPropertyValue("--gold").trim() || "#e8b04b";
  const { x, y } = fxPointer;
  fxBurst(x, y, warna);
}