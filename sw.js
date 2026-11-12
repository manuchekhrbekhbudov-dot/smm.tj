// SMM.TJ service worker: makes the site installable as an app. It deliberately caches nothing,
// so a new deploy is always picked up immediately (no stale pages).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
