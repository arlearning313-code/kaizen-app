const NAMA_CACHE = "kaizen-v6"
const FILE_INTI = ["./", "./index.html", "./styles.css", "./db.js", "./config.js", "./ui.js", "./skor.js", "./sync.js", "./manifest.json", "./kaizen-logo-icon-192.png", "./kaizen-logo-icon-512.png"]

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
