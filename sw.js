// 🔴 1. رقم الإصدار: غيره في كل مرة ترفع فيها تعديل (مثلاً 1.2, 1.3)
const APP_VERSION = '1.2'; 
const CACHE_NAME = `nivadent-erp-cache-v${APP_VERSION}`; // 👈 تم تعريفه مرة واحدة فقط
 
// 2. الملفات اللي هتتكيش
const ASSETS_TO_CACHE = [
    '/', '/index.html', '/activate.html', '/dashboard.html',
    '/patients.html', '/patient-profile.html', '/session-details.html',
    '/finances.html', '/calendar.html', '/settings.html',
    '/super-admin.html', '/404.html', '/home.html', '/inventory.html',
    '/assets/logo.png',
    '/css/style.css', '/css/home.css', '/css/dashboard.css',
    '/css/patients.css', '/css/patient-profile.css', '/css/finances.css',
    '/css/calendar.css', '/css/settings.css', '/css/super-admin.css',
    '/css/dental-chart.css', '/css/inventory.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('✅ جاري تخزين الملفات الأساسية...');
            for (let asset of ASSETS_TO_CACHE) {
                try { await cache.add(new Request(asset, { cache: 'reload' })); } 
                catch (err) { console.warn('⚠️ تم تخطي الملف:', asset); }
            }
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => { 
                if (key !== CACHE_NAME) {
                    console.log('🧹 مسح كاش قديم:', key);
                    return caches.delete(key); 
                } 
            })
        ))
    );
});

self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) return;
    const requestUrl = new URL(event.request.url);

    // استثناء الفايربيز
    if (requestUrl.hostname.includes('gstatic.com') || 
        requestUrl.hostname.includes('googleapis.com') || 
        requestUrl.hostname.includes('firebaseio.com')) {
        return;
    }

    if (requestUrl.origin !== self.location.origin) return;

    if (event.request.method === 'GET') {
        const isCodeFile = requestUrl.pathname.endsWith('.js') || requestUrl.pathname.endsWith('.html') || requestUrl.pathname === '/';
        
        if (isCodeFile) {
            // الاستراتيجية الذكية للملفات البرمجية
            event.respondWith(
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request.url.split('?')[0], responseToCache));
                    }
                    return networkResponse;
                }).catch(() => caches.match(event.request, { ignoreSearch: true }))
            );
        } else {
            // الاستراتيجية الذكية للصور والـ CSS
            event.respondWith(
                caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
                    return cachedResponse || fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(event.request.url.split('?')[0], responseToCache));
                        }
                        return networkResponse;
                    });
                })
            );
        }
    }
});

// 3. الاستماع لرسالة الزرار
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
