// Caution: The cache storage API is "origin storage" (like localStorage, and IndexedDB).
// If you run many sites on the same origin (for example, yourname.github.io/myapp),
// be careful that you don't delete caches for your other sites.
// To avoid this, give your cache names a prefix unique to the current site, eg myapp-static-v1,
// and don't touch caches unless they begin with myapp-.
var CACHE_NAME = "qbwebmail-v5";
// var AVATAR_CACHE_NAME = "qbwebmail-static-v1";

// Clean bundle results of webpack development environment
function removeHotUpdateBundles(assets) {
  let as = [];
  assets.forEach((a) => {
    if (!a.match(/hot-update/)) as.push(a);
  });

  return as;
}

self.addEventListener("install", function (event) {
  // Open a cache
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      let ass = serviceWorkerOption.assets.concat(["/", "/mail/u/INBOX"]);
      return cache.addAll(removeHotUpdateBundles(ass));
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // caches.match() always resolves
      // but in case of success response will have value
      if (response !== undefined) return response;

      return fetch(event.request).then(
        function (response) {
          // response may be used only once
          // we need to save clone to put one copy in cache
          // and serve second one
          let responseClone = response.clone();
          let method = responseClone.clone().method;
          if (method == "GET") {
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, responseClone);
            });
          }

          return response;
        },
        (err) => {
          console.log(err);
        }
      );
    })
  );
});

self.addEventListener("activate", function (event) {
  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all([
        ...keyList.map(function (key) {
          if (cacheWhitelist.indexOf(key) === -1) {
            return caches.delete(key);
          }
        }),
        clients.claim(),
      ]);
    })
  );
});

addEventListener("message", (messageEvent) => {
  if (messageEvent.data === "skipWaiting") return skipWaiting();
});
