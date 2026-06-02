const CACHE_NAME = 'nivadent-erp-cache-v3';

// الملفات الثابتة فقط (الصور والـ CSS) هي اللي بتتحفظ كاش ثابت لتسريع النظام
const ASSETS_TO_CACHE = [
    '/', '/index.html', '/activate.html', '/dashboard.html', 
    '/patients.html', '/patient-profile.html', '/session-details.html', 
    '/finances.html', '/calendar.html', '/settings.html', 
    '/super-admin.html', '/404.html', '/home.html', '/inventory.html',
    '/assets/logo.png',
    '/css/style.css', '/css/home.css', '/css/dashboard.css', 
    '/css/patients.css', '/css/patient-profile.css', '/css/finances.css', 
    '/css/calendar.css', '/css/settings.css', '/css/super-admin.css', 
    '/css/dental-chart.css', '/css/inventory.css',
    '/js/firebase-config.js', '/js/auth.js', '/js/lang-manager.js', 
    '/js/home.js', '/js/dashboard.js', '/js/patients.js', 
    '/js/patient-profile.js', '/js/session-details.js', '/js/finances.js', 
    '/js/calendar.js', '/js/settings.js', '/js/super-admin.js', 
    '/js/dental-chart.js', '/js/inventory.js', '/js/backup.js'
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

    // استثناء خدمات جوجل والفايربيز تماماً
    if (requestUrl.hostname.includes('gstatic.com') || 
        requestUrl.hostname.includes('googleapis.com') || 
        requestUrl.hostname.includes('firebaseio.com')) {
        return;
    }

    if (requestUrl.origin !== self.location.origin) return;

    if (event.request.method === 'GET') {
        const isCodeFile = requestUrl.pathname.endsWith('.js') || requestUrl.pathname.endsWith('.html') || requestUrl.pathname === '/';
        
        if (isCodeFile) {
            // ⭐ استراتيجية Network-First لملفات الكود: روح للسيرفر فوراً عشان التحديث يسمّع في ثانية
            event.respondWith(
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request.url.split('?')[0], responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => caches.match(event.request, { ignoreSearch: true }))
            );
        } else {
            // استراتيجية Cache-First للصور والـ CSS لتوفير السرعة
            event.respondWith(
                caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
                    return cachedResponse || fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request.url.split('?')[0], responseToCache);
                            });
                        }
                        return networkResponse;
                    });
                })
            );
        }
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
