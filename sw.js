const C='tony-obras-v7';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))])));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
 if(r.mode==='navigate')return e.respondWith(fetch(r,{cache:'no-store'}).catch(()=>caches.match('./')));
 if(/\.(html|css|js|json)$/.test(new URL(r.url).pathname))return e.respondWith(fetch(r,{cache:'no-store'}).catch(()=>caches.match(r)));
 e.respondWith(caches.match(r).then(h=>h||fetch(r)))});