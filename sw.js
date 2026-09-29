const C='tony-v9';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  await self.clients.claim();
  const ks=await caches.keys();
  for(const k of ks){try{await caches.delete(k)}catch(err){}}
  const ws=await self.clients.matchAll({type:'window'});
  for(const w of ws){try{w.navigate(w.url)}catch(err){}}
})()));
self.addEventListener('fetch',e=>{});
