// karakter-ui.js — Emblem karakter: cincin KESIAPAN + evolusi 7 Stage.
// Tampil di sidebar (kompak) & Dashboard (hero). Gaya dikurung desktop via CSS.

const STAGE_VISUAL = {
  1: { kanji: "忍", nama: "Survival",      c1: "#e0574a", c2: "#7a1f18" },
  2: { kanji: "定", nama: "Stabilization", c1: "#e0a23a", c2: "#7a5410" },
  3: { kanji: "育", nama: "Growth",        c1: "#cf9a3a", c2: "#5a3e10" },
  4: { kanji: "拓", nama: "Expansion",     c1: "#e0873a", c2: "#5a3410" },
  5: { kanji: "立", nama: "Independence",  c1: "#d66a45", c2: "#5a2717" },
  6: { kanji: "旅", nama: "Japan Ready",   c1: "#d64545", c2: "#6e1717" },
  7: { kanji: "夢", nama: "Dream",         c1: "#f0c650", c2: "#8a6410" },
};
function stageVisual(no) { return STAGE_VISUAL[no] || STAGE_VISUAL[1]; }

// Emblem: cincin terisi sesuai % kesiapan; inti = kanji stage + angka %.
function emblemMarkup(pct, stg, ukuran) {
  const r = ukuran / 2 - 6;
  const C = 2 * Math.PI * r;
  const c = ukuran / 2;
  return `
    <div class="emblem" style="--c1:${stg.c1};--c2:${stg.c2};width:${ukuran}px;height:${ukuran}px">
      <svg class="emblem-ring" width="${ukuran}" height="${ukuran}" viewBox="0 0 ${ukuran} ${ukuran}">
        <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="4"/>
        <circle class="ring-maju" cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--c1)" stroke-width="4"
                stroke-linecap="round" transform="rotate(-90 ${c} ${c})"
                stroke-dasharray="${C}" stroke-dashoffset="${C}"/>
      </svg>
      <div class="emblem-inti">
        <span class="emblem-kanji">${stg.kanji}</span>
        <span class="emblem-lv">${pct}%</span>
      </div>
    </div>`;
}

function animasiRing(wadah, fraksi) {
  const ring = wadah.querySelector(".ring-maju");
  if (!ring) return;
  const C = parseFloat(ring.getAttribute("stroke-dasharray"));
  const prev = parseFloat(wadah.dataset.fraksi || "0");
  ring.style.strokeDashoffset = C * (1 - prev);
  requestAnimationFrame(() => { ring.style.strokeDashoffset = C * (1 - fraksi); });
  wadah.dataset.fraksi = fraksi;
}

// ── Sidebar: emblem kompak ────────────────────────────────────────────
async function renderSidebarKarakter() {
  const el = document.getElementById("sidebar-karakter");
  if (!el) return;
  const pct = await kesiapanTotal();
  const st = stageDariKesiapan(pct) || { no: 1, nama: "Survival" };
  const stg = stageVisual(st.no);

  el.innerHTML =
    emblemMarkup(pct, stg, 84) +
    `<div class="side-kar-info">
       <div class="side-kar-stage">${st.nama}</div>
       <div class="side-kar-xp">${pct}% siap</div>
       <div class="side-kar-sisa">menuju Jepang</div>
     </div>`;
  el.onclick = () => { if (typeof gantiView === "function") gantiView("beranda"); };
  animasiRing(el, pct / 100);
}

// ── Dashboard: kartu hero besar ───────────────────────────────────────
function kartuHero(pct, st) {
  const stg = stageVisual(st.no);
  const card = document.createElement("div");
  card.className = "dash-card dash-span hero-kar";
  card.style.setProperty("--c1", stg.c1);
  card.style.setProperty("--c2", stg.c2);
  card.innerHTML =
    `<div class="hero-emblem">${emblemMarkup(pct, stg, 132)}</div>
     <div class="hero-info">
       <div class="hero-stage">Stage ${st.no} · ${stg.nama}</div>
       <div class="hero-level">${pct}% siap ke Jepang</div>
       <div class="hero-bar"><span style="width:${pct}%"></span></div>
       <div class="hero-sisa">Dinilai dari ${(KONFIG.areaKesiapan || []).length} area (Gap Analysis).</div>
       <div class="hero-ringkas">${st.ringkas || ""}</div>
     </div>`;
  requestAnimationFrame(() => animasiRing(card, pct / 100));
  return card;
}