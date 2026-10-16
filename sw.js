// 秘密の種と宝探し: オンラインでもオフラインでも遊べるようにするサービスワーカー
// ファイルを更新したら、下の CACHE の数字を変えると端末に確実に反映されます
const CACHE = "hsg-v4";
const FILES = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  // 自分(hsg-)の古いキャッシュだけ消す。同じサイトの他のアプリのキャッシュには触らない
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("hsg-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // このゲームのファイル: ネット優先(更新がすぐ届く)、オフラインならキャッシュ
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request).then((m) => m || caches.match("index.html")))
    );
    return;
  }
  // Google Fonts: 一度読み込んだら保存して、オフラインでも同じ文字で表示
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const net = fetch(e.request).then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return r;
        }).catch(() => cached);
        return cached || net;
      })
    );
  }
});
