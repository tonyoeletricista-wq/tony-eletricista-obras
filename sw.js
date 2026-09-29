const C='tony-off';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{await self.clients.claim();
 for(const k of await caches.keys())await caches.delete(k);
 for(const c of await self.clients.matchAll({type:'window'}))c.navigate(c.url)} catch(e=>{})()));
self.addEventListener('fetch',e=>{});