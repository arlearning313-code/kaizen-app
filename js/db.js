// db.js — MODUL 1: Lapisan penyimpanan (IndexedDB)
// Semua modul lain berbicara ke database HANYA lewat fungsi di file ini.
// Analogi: 1 database = 1 workbook Excel; tiap store = 1 sheet; tiap record = 1 baris.

const NAMA_DB = "kaizen-db";
const VERSI_DB = 2;

let _dbPromise = null; // simpan koneksi supaya tak dibuka berulang

// Buka (atau buat) database. Blok onupgradeneeded hanya jalan saat
// DB pertama dibuat, atau saat VERSI_DB dinaikkan.
function bukaDatabase() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(NAMA_DB, VERSI_DB);

    req.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("habits")) {
        db.createObjectStore("habits", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("logs")) {
        const logs = db.createObjectStore("logs", { keyPath: "id" });
        logs.createIndex("byDate", "date", { unique: false });   // cari cepat per tanggal
        logs.createIndex("byHabit", "habitId", { unique: false }); // cari cepat per habit
      }
      if (!db.objectStoreNames.contains("journal")) {
        const journal = db.createObjectStore("journal", { keyPath: "id" });
        journal.createIndex("byType", "type", { unique: false });
      }
      if (!db.objectStoreNames.contains("character")) {
        db.createObjectStore("character", { keyPath: "id" }); // 1 baris saja: id = "me"
      }
      if (!db.objectStoreNames.contains("achievements")) {
        db.createObjectStore("achievements", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
            if (!db.objectStoreNames.contains("quests")) {
        db.createObjectStore("quests", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("questLogs")) {
        const ql = db.createObjectStore("questLogs", { keyPath: "id" });
        ql.createIndex("byDate", "date", { unique: false });
        ql.createIndex("byQuest", "questId", { unique: false });
      }
    };

    req.onsuccess = (event) => resolve(event.target.result);
    req.onerror = (event) => reject(event.target.error);
  });

  return _dbPromise;
}

// Pembungkus kecil: jalankan 1 transaksi pada 1 store, kembalikan Promise.
async function _transaksi(namaStore, mode, aksi) {
  const db = await bukaDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(namaStore, mode);
    const req = aksi(tx.objectStore(namaStore));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---- API publik: hanya 5 fungsi ini yang dipakai modul lain ----

function simpan(namaStore, objek) {
  return _transaksi(namaStore, "readwrite", (store) => store.put(objek));
}

function ambil(namaStore, id) {
  return _transaksi(namaStore, "readonly", (store) => store.get(id));
}

function ambilSemua(namaStore) {
  return _transaksi(namaStore, "readonly", (store) => store.getAll());
}

function hapus(namaStore, id) {
  return _transaksi(namaStore, "readwrite", (store) => store.delete(id));
}

function kosongkan(namaStore) {
  return _transaksi(namaStore, "readwrite", (store) => store.clear());
}

// Ambil semua log pada 1 tanggal, lewat index "byDate".
async function ambilPerTanggal(tanggal) {
  const db = await bukaDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("logs", "readonly");
    const req = tx.objectStore("logs").index("byDate").getAll(tanggal);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}