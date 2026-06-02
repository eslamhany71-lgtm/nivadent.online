const CACHE_NAME = 'aldokan-erp-cache-v10'; // 🔴 النسخة 10 لحل مشكلة الموبايل 🔴

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
            console.log('✅ جاري تخزين الملفات الأساسية لتسريع النظام...');
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
                    console.log('🧹 مسح كاش قديم مضروب:', key);
                    return caches.delete(key); 
                } 
            })
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // 1. استثناء البروتوكولات غير المدعومة
    if (!event.request.url.startsWith('http')) return;

    const requestUrl = new URL(event.request.url);

    // 🔴 2. "حائط الصد" - منع التدخل نهائياً في خدمات جوجل والفايربيز 🔴
    // الخطوة دي بتضمن إن الـ Integrity بتاع الكابتشا يفضل سليم 100%
    if (requestUrl.hostname.includes('gstatic.com') || 
        requestUrl.hostname.includes('googleapis.com') || 
        requestUrl.hostname.includes('firebaseio.com')) {
        return; // خروج فوري وترك الطلب للشبكة الأصلية
    }

    // 3. منع تكييش أي ملفات خارجية أخرى لضمان الاستقرار
    if (requestUrl.origin !== self.location.origin) return;

    // 4. منطق التكييش للملفات المحلية (NivaDent Files)
    if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // تكييش النسخة الجديدة للعمل أوفلاين لاحقاً
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            // التخزين بدون الـ Query Strings لضمان السرعة
                            cache.put(event.request.url.split('?')[0], responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => null);

                // رد من الكاش لو متاح، وإلا انتظر الشبكة
                return cachedResponse || fetchPromise.then(res => res || new Response(
                    "عفواً، لا يوجد اتصال بالإنترنت وهذه الصفحة لم يتم تحميلها مسبقاً.", 
                    { status: 503, headers: new Headers({ 'Content-Type': 'text/html; charset=utf-8' }) }
                ));
            })
        );
    }
});

// الكود النظيف داخل ملف sw-v2.js الجديد
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
