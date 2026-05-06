/**
 * Service Worker for 教師小幫手
 *
 * 此檔由 scripts/write-version.mjs 在 build 時自動產出 sw.js，
 * 把 __BUILD_VERSION__ 替換為當次 build 的 hash。請勿直接修改 sw.js。
 *
 * 策略：
 *  - HTML / navigate request → network-first（永遠優先抓最新）
 *  - 靜態資源 (JS/CSS chunk 已自帶 hash, 圖片) → cache-first
 *  - version.json → 永遠 network-only（前端用來偵測新版）
 *  - Firebase / Google API → 跳過不快取（永遠 network）
 *  - 跨域 opaque response → 跳過 cache.put 避免報錯
 */
const CACHE_VERSION = "__BUILD_VERSION__";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const HTML_CACHE = `html-${CACHE_VERSION}`;

// SW scope 在 GitHub Pages = /Message/，本地 dev = /
const SCOPE_PATH = (() => {
  try {
    return new URL(self.registration.scope).pathname;
  } catch {
    return "/";
  }
})();

const PRECACHE_URLS = [
  SCOPE_PATH,
  `${SCOPE_PATH}favicon.ico`,
  `${SCOPE_PATH}icon-192.png`,
  `${SCOPE_PATH}icon-512.png`,
  `${SCOPE_PATH}apple-touch-icon.png`,
  `${SCOPE_PATH}og-image.png`,
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] precache failed: ${url}`, err);
          }),
        ),
      ),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.endsWith(CACHE_VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // 跳過 Firebase / Google APIs / Gemini API（永遠 network，不要快取）
  const skipHosts = [
    "googleapis.com",
    "cloudfunctions.net",
    "run.app",
    "firebaseapp.com",
    "googleusercontent.com",
    "gstatic.com",
  ];
  if (skipHosts.some((h) => url.hostname.includes(h))) return;

  // version.json：永遠 network，前端輪詢用
  if (url.pathname.endsWith("/version.json")) {
    event.respondWith(fetch(req, { cache: "no-store" }));
    return;
  }

  // HTML / 路由 navigate → network-first
  const isNavigate =
    req.mode === "navigate" ||
    url.pathname === SCOPE_PATH ||
    url.pathname === SCOPE_PATH.replace(/\/$/, "") ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith("/");
  if (isNavigate) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 其他靜態資源 → cache-first
  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(HTML_CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type !== "opaque") {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    // 連 root scope 的 cache 也試一下
    const fallback = await caches.match(SCOPE_PATH);
    if (fallback) return fallback;
    throw err;
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type !== "opaque") {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    throw err;
  }
}

// 接收前端「立即啟用新 SW」訊息
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
