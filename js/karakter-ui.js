// karakter-ui.js — STAGE 3: Emblem karakter RPG + XP ring, evolusi 7 Stage.
// Tampil di sidebar (kompak) & Dashboard (hero). Semua gaya dikurung desktop di CSS.

const STAGE_VISUAL = {
  1: { kanji: "忍", nama: "Survival",      c1: "#e0574a", c2: "#7a1f18" },
  2: { kanji: "定", nama: "Stabilization", c1: "#e0a23a", c2: "#7a5410" },
  3: { kanji: "育", nama: "Growth",        c1: "#4fb286", c2: "#155140" },
  4: { kanji: "拓", nama: "Expansion",     c1: "#4a90d9", c2: "#173e66" },
  5: { kanji: "立", nama: "Independence",  c1: "#8b6fd6", c2: "#382a63" },
  6: { kanji: "旅", nama: "Japan Ready",   c1: "#d64545", c2: "#6e1717" },
  7: { kanji: "夢", nama: "Dream",         c1: "#f0c650", c2: "#8a6410" },
};
function stageVisual(no) { return STAGE_VISUAL[no] || STAGE_VISUAL[1]; }

// Progres XP menuju level berikutnya (pakai ambangXP dari config.js).
function progresXP(k, xp) {
  const bawah = KONFIG.ambangXP[k.level] || 0;
  const atas = KONFIG.ambangXP[k.level + 1];
  if (atas === undefined) return { fraksi: 1, sisa: 0, maxLevel: true };
  const rentang = atas - bawah;
  const maju = xp - bawah;
  const fraksi = Math.max(0, Math.min(1, rentang > 0 ? maju / rentang : 0));
  return { fraksi, sisa: Math.max(0, atas - xp), maxLevel: false };
}

// Markup emblem: SVG ring + inti (kanji + level). ukuran = diameter px.
function emblemMarkup(k, stg, ukuran) {
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
        <span class="emblem-lv">Lv ${k.level}</span>
      </div>
    </div>`;
}

// Animasikan ring dari nilai lama → baru (halus).
function animasiRing(wadah, fraksi) {
  const ring = wadah.querySelector(".ring-maju");
  if (!ring) return;
  const C = parseFloat(ring.getAttribute("stroke-dasharray"));
  const prev = parseFloat(wadah.dataset.fraksi || "0");
  ring.style.strokeDashoffset = C * (1 - prev);
  requestAnimationFrame(() => { ring.style.strokeDashoffset = C * (1 - fraksi); });
  wadah.dataset.fraksi = fraksi;
}

// ── Sidebar: emblem kompak (ikut ter-update tiap XP berubah) ──────────
async function renderSidebarKarakter() {
  const el = document.getElementById("sidebar-karakter");
  if (!el) return;
  const k = await ambilKarakter();
  const xp = await totalXP();
  const stg = stageVisual((stageDari(k.level) || { no: 1 }).no);
  const prog = progresXP(k, xp);

  el.innerHTML =
    emblemMarkup(k, stg, 84) +
    `<div class="side-kar-info">
       <div class="side-kar-stage">${prog.maxLevel ? "★ " : ""}${stg.nama}</div>
       <div class="side-kar-xp">${prog.maxLevel ? "MAX" : xp.toLocaleString("id-ID") + " XP"}</div>
       <div class="side-kar-sisa">${k.recovery ? "🛡️ Recovery" : (prog.maxLevel ? "Level tertinggi" : prog.sisa.toLocaleString("id-ID") + " XP lagi")}</div>
     </div>`;
  el.onclick = () => { if (typeof gantiView === "function") gantiView("beranda"); };
  animasiRing(el, prog.fraksi);
}

// ── Dashboard: kartu hero besar (dipakai menggantikan kartuKarakter) ──
function kartuHero(k, xp) {
  const st = stageDari(k.level) || { no: 1, ringkas: "" };
  const stg = stageVisual(st.no);
  const prog = progresXP(k, xp);

  const card = document.createElement("div");
  card.className = "dash-card dash-span hero-kar";
  card.style.setProperty("--c1", stg.c1);
  card.style.setProperty("--c2", stg.c2);
  card.innerHTML =
    `<div class="hero-emblem">${emblemMarkup(k, stg, 132)}</div>
     <div class="hero-info">
       <div class="hero-stage">Stage ${st.no} · ${stg.nama}</div>
       <div class="hero-level">Level ${k.level}</div>
       <div class="hero-xp">${xp.toLocaleString("id-ID")} XP${prog.maxLevel ? " · MAX" : ""}</div>
       <div class="hero-bar"><span style="width:${Math.round(prog.fraksi * 100)}%"></span></div>
       <div class="hero-sisa">${k.recovery ? "🛡️ Recovery Mode aktif" : (prog.maxLevel ? "Level tertinggi terdefinisi" : prog.sisa.toLocaleString("id-ID") + " XP menuju Level " + (k.level + 1))}</div>
       <div class="hero-ringkas">${st.ringkas || ""}</div>
     </div>`;
  requestAnimationFrame(() => animasiRing(card, prog.fraksi));
  return card;
}