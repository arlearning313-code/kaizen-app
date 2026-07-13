const NAMA_CACHE = "kaizen-v31"
const FILE_INTI = ["./", "./index.html", "./manifest.json", "./css/styles.css", "./img/kaizen-logo-icon-192.png", "./img/kaizen-logo-icon-512.png", "./img/japan-hero.jpg", "./fonts/Fraunces-standard.woff2", "./fonts/Newsreader-standard.woff2", "./js/db.js", "./js/config.js", "./js/ui.js", "./js/skor.js", "./js/sync.js", "./js/character.js", "./js/achievements.js", "./js/journal.js", "./js/kaizen.js", "./js/recovery.js", "./js/dashboard.js", "./js/manager.js", "./js/quest.js", "./js/trackers.js", "./js/settings.js", "./js/navigasi.js", "./js/karakter-ui.js", "./js/fx.js", "./js/cover.js", "./js/jadwal.js"]

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
        .open(NAMA_CACHE)
        .then((cache) => {
            return cache.addAll(FILE_INTI)
        })
    )
})

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches
        .match(event.request)
        .then((response) => {
            if (response !== undefined) {
                return response
            }
            return fetch(event.request)
        })
    )
})

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
        .keys()
        .then((cache) => {
            return Promise.all(cache.map((satuNama) => {
                if (satuNama === NAMA_CACHE) {
                    return null
                }
                return caches.delete(satuNama)
            }))
        })
    )
})
