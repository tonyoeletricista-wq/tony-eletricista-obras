const C='tony-v11';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 try{await self.clients.claim()}catch(x){}
 try{const ks=await caches.keys();for(const k of ks){if(k.indexOf('tony')===0){await caches.delete(k)}}}catch(x){}
})()));
self.addEventListener('fetch',e=>{});
