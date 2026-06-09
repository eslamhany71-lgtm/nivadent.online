// js/home.js - NivaDent Master Shell (SaaS Routing, Dynamic Branding, Roles, Translations, Chat & Security)

const SMART_VERSION = Math.floor(Date.now() / 3600000); 

// 🔴 لقط الـ ID من الرابط لو احنا داخلين كمنتحلين شخصية 🔴
const urlParams = new URLSearchParams(window.location.search);
const impersonateParam = urlParams.get('impersonate');
if (impersonateParam) {
    sessionStorage.setItem('impersonatedClinicId', impersonateParam);
    window.history.replaceState({}, document.title, window.location.pathname); 
}

function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('btn-theme');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('niva_theme', 'light');
        // أيقونة القمر للوضع الفاتح
        if(themeBtn) themeBtn.innerHTML = '<span class="material-symbols-rounded">dark_mode</span>'; 
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('niva_theme', 'dark');
        // أيقونة الشمس للوضع الليلي
        if(themeBtn) themeBtn.innerHTML = '<span class="material-symbols-rounded">light_mode</span>'; 
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem('niva_theme') || 'light');
    if (localStorage.getItem('sidebarPinned') === 'true' && window.innerWidth > 992) { 
        document.body.classList.add('sidebar-pinned'); 
    }
    let overlay = document.createElement('div');
    overlay.id = 'mobile-overlay'; 
    overlay.className = 'mobile-overlay'; 
    overlay.onclick = toggleSidebar; 
    document.body.appendChild(overlay);
});

// 🔴 دالة التوجيه المركزية 🔴
function loadPage(pageUrl, clickedLi) {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const role = sessionStorage.getItem('userRole');
// سحب البيانات الخام من الذاكرة للفحص
    const rawPerms = sessionStorage.getItem('userPermissions');
    const rawFeatures = sessionStorage.getItem('clinicFeatures');
    const isSuperAdmin = (role === 'superadmin');

    // 🛡️ حاجز الأمان الصامت: لو البيانات لسه مجتش من السيرفر، انتظر صامتاً تماماً ولا تظهر أي ألرت!
    if ((!rawPerms || !rawFeatures) && !isSuperAdmin) {
        console.log("⏳ الميزات أو الصلاحيات لسه بتحمل من الفايربيز.. إعادة المحاولة صامتاً بعد 300 مللي ثانية...");
        setTimeout(() => { loadPage(pageUrl, clickedLi); }, 300);
        return; // أوقف تنفيذ الدالة فوراً ولا تسمح بظهور الألرت الملعون
    }
    const basePage = pageUrl.split('?')[0].replace('.html', '');

    const routeMap = {
        'patients': { perm: 'patients', feature: 'patients' },
        'patient-profile': { perm: 'patients', feature: 'patients' }, 
        'add-patient': { perm: 'patients', feature: 'patients' },      
        'calendar': { perm: 'calendar', feature: 'appointments' },
        'services': { perm: 'services', feature: 'services' },
        'contracts': { perm: 'contracts', feature: 'contracts' },
        'invoices': { perm: 'invoices', feature: 'invoices' },
        'finances': { perm: 'finances', feature: 'accounts' },
        'inventory': { perm: 'inventory', feature: 'inventory' },
        'reports': { perm: 'reports', feature: 'reports' },
        'branches': { perm: 'branches', feature: 'branches' },
        'hr': { perm: 'hr', feature: 'hr' },
        'notifications': { perm: 'notifications', feature: 'notifications' },
        'portal_settings': { perm: 'portal', feature: 'portal' },
        'settings': { perm: 'settings', feature: 'settings' },
        'portal': { perm: 'portal', feature: 'portal' },
        'ticket' : { perm: 'ticket', feature: 'ticket' },
    };

    if (role !== 'superadmin' && routeMap[basePage]) {
        const features = window.clinicFeatures || JSON.parse(sessionStorage.getItem('clinicFeatures')) || {};
        const perms = JSON.parse(sessionStorage.getItem('userPermissions')) || {};
        
        const routeData = routeMap[basePage];
        const isFeatureEnabled = features[routeData.feature] !== false; 
        const isUserPermitted = perms[routeData.perm] === true;

        if (!isFeatureEnabled || !isUserPermitted) {
            alert(isAr ? "⛔ عفواً، لا تملك صلاحية للوصول إلى هذا القسم، أو أن الميزة غير مفعلة لعيادتك." : "⛔ Access Denied. Feature disabled or missing permissions.");
            return; 
        }
    }

    if (window.showLoader) window.showLoader(isAr ? "جاري فتح الصفحة..." : "Loading page...");
    let finalUrl = pageUrl.includes('?') ? `${pageUrl}&v=${SMART_VERSION}` : `${pageUrl}?v=${SMART_VERSION}`;
    const frame = document.getElementById('content-frame');
    frame.src = finalUrl;
    
    frame.onload = function() {
        if (window.hideLoader) window.hideLoader();
        frame.contentWindow.postMessage({ type: 'THEME_CHANGE', theme: document.body.getAttribute('data-theme') }, '*');
    };
    
    sessionStorage.setItem('lastOpenedPage', pageUrl);

    if (clickedLi) {
        document.querySelectorAll('#nav-links li').forEach(li => li.classList.remove('active'));
        clickedLi.classList.add('active');
        if(clickedLi.id) sessionStorage.setItem('lastActiveNavId', clickedLi.id);
    } else {
        const lastNavId = sessionStorage.getItem('lastActiveNavId');
        if (lastNavId) {
            document.querySelectorAll('#nav-links li').forEach(li => li.classList.remove('active'));
            const activeLi = document.getElementById(lastNavId);
            if(activeLi) activeLi.classList.add('active');
        }
    }

    if (window.innerWidth <= 992) {
        document.getElementById('sidebar').classList.remove('active');
        const overlay = document.getElementById('mobile-overlay');
        if(overlay) overlay.classList.remove('active');
    }
}

function switchAppLanguage(lang) {
    setLanguage(lang); 
    updatePageContent(lang); 
    const frame = document.getElementById('content-frame');
    if(frame.contentWindow) frame.contentWindow.location.reload();
}

function updatePageContent(lang) {
    const t = {
        ar: {
            header: "لوحة التحكم", navDash: "الداشبورد", navPatients: "المرضى والأشعة", 
            navCalendar: "المواعيد والتقويم", navServices: "الخدمات والأسعار", navContracts: "التعاقدات والخصومات",
            navInvoices: "الفواتير", navFinances: "الحسابات والمصروفات", navInventory: "المخزون الطبي", 
            navReports: "التقارير التحليلية", navBranches: "إدارة الفروع", navHr: "شؤون الموظفين",
            navNotif: "الإشعارات", navPortal: "بوابة العيادة (للمرضى)", navSettings: "إعدادات العيادة", 
            navSuper: "إدارة النظام المركزية", logout: "تسجيل خروج",
            alertText: "⚠️ تنبيه هام: اشتراك العيادة سينتهي خلال {days} أيام. يرجى التواصل مع الإدارة للتجديد.",
            alertToday: "⚠️ تنبيه هام: اشتراك العيادة ينتهي اليوم! يرجى التجديد فوراً.",
            navSupport: "الدعم الفني والتقييمات", modSupTitle: "مركز المساعدة والتقييم", 
            tabTicket: " طلب دعم فني", tabReview: "⭐ تقييم النظام", tabChat: "💬 مراسلة الإدارة (Live)",
            modSupDesc: "هل تواجه مشكلة أو تحتاج إلى إضافة ميزة جديدة للعيادة？ اكتب رسالتك وسنقوم بالرد عليك في أسرع وقت.", 
            btnSupSend: "إرسال طلب الدعم (Ticket)", rateTitle: "ما تقييمك لسيستم NivaDent؟", rateSub: "رأيك يهمنا ويساعدنا على تطوير النظام.",
            btnRevSend: "نشر التقييم ⭐", aiTitle: "المساعد الذكي Niva", aiWelcome: "مرحباً دكتور! 👋 أنا مساعدك الذكي Niva. كيف يمكنني مساعدتك اليوم?",
            poweredBy: "Powered by", chatInputPlaceholder: "اكتب رسالتك هنا للإدارة...", btnChatSend: "إرسال 🚀",
            btnUpgradeHeader: "إدارة الاشتراك",
        },
        en: {
            header: "Dashboard", navDash: "Overview", navPatients: "Patients & X-Rays", 
            navCalendar: "Calendar", navServices: "Services & Pricing", navContracts: "Contracts & Discounts",
            navInvoices: "Invoices", navFinances: "Finances", navInventory: "Medical Inventory", 
            navReports: "Analytical Reports", navBranches: "Branches Management", navHr: "Staff Management",
            navNotif: "Notifications", navPortal: "Patient Portal", navSettings: "Clinic Settings", 
            navSuper: "Super Admin", logout: "Logout",
            alertText: "⚠️ Important: Clinic subscription expires in {days} days. Please renew.",
            alertToday: "⚠️ Important: Clinic subscription expires TODAY! Please renew.",
            navSupport: "Support & Reviews", modSupTitle: "Help & Rating Center", 
            tabTicket: " Support Ticket", tabReview: "⭐ System Review", tabChat: "💬 Live Chat",
            modSupDesc: "Facing an issue or need a new feature? Write your ticket and we'll reply ASAP.", 
            btnSupSend: "Submit Support Ticket", rateTitle: "How do you rate NivaDent?", rateSub: "Your feedback helps us improve the system.",
            btnRevSend: "Post Review ⭐", aiTitle: "Niva Assistant", aiWelcome: "Hello Doctor! 👋 I'm Niva, your smart assistant. How can I help you today?",
            poweredBy: "Powered by", chatInputPlaceholder: "Type your message to admin...", btnChatSend: "Send 🚀",
            btnUpgradeHeader: "Upgrade",
        }
    };
    const c = t[lang] || t.ar;
    const setTxt = (id, txt) => { if(document.getElementById(id)) document.getElementById(id).innerText = txt; };

    setTxt('txt-header', c.header); setTxt('nav-dash', c.navDash); setTxt('nav-patients', c.navPatients); 
    setTxt('nav-calendar', c.navCalendar); setTxt('nav-finances', c.navFinances); setTxt('nav-invoices', c.navInvoices); 
    setTxt('nav-inventory', c.navInventory); setTxt('nav-settings', c.navSettings); setTxt('nav-super', c.navSuper); 
    setTxt('btn-logout', c.logout);
  const upgradeBtn = document.getElementById('btn-upgrade-header');
if (upgradeBtn) {
    // استخدمنا || عشان لو ملقاش الكلمة في القاموس يكتب Upgrade وميكتبش undefined أبداً
    upgradeBtn.innerText = t.btnUpgradeHeader || "Upgrade"; 
}
    
    const itemsList = document.querySelectorAll('#nav-links li');
    itemsList.forEach(li => {
        const perm = li.getAttribute('data-perm');
        if (perm === 'services') li.querySelector('span:last-child').innerText = c.navServices;
        if (perm === 'contracts') li.querySelector('span:last-child').innerText = c.navContracts;
        if (perm === 'reports') li.querySelector('span:last-child').innerText = c.navReports;
        if (perm === 'branches') li.querySelector('span:last-child').innerText = c.navBranches;
        if (perm === 'hr') li.querySelector('span:last-child').innerText = c.navHr;
        if (perm === 'notifications') li.querySelector('span:last-child').innerText = c.navNotif;
    });

    setTxt('nav-portal', c.navPortal); setTxt('nav-support', c.navSupport); setTxt('mod-support-title', c.modSupTitle);
    
    setTxt('btn-tab-ticket', c.tabTicket); setTxt('btn-tab-review', c.tabReview); 
    if(document.getElementById('btn-tab-chat')) document.getElementById('btn-tab-chat').innerText = c.tabChat; // 🔴 ترجمة تابة الشات
    
    setTxt('mod-support-desc', c.modSupDesc); setTxt('btn-support-send', c.btnSupSend);
    setTxt('txt-rate-title', c.rateTitle); setTxt('txt-rate-sub', c.rateSub); setTxt('btn-review-send', c.btnRevSend);
    
    setTxt('ai-title', c.aiTitle); setTxt('ai-welcome-msg', c.aiWelcome);
    setTxt('txt-powered-sidebar', c.poweredBy);

    const msgBox = document.getElementById('support_message');
    if(msgBox) msgBox.placeholder = lang === 'ar' ? "اكتب تفاصيل المشكلة أو طلبك هنا..." : "Type issue details or request here...";
    
    const revBox = document.getElementById('review_message');
    if(revBox) revBox.placeholder = lang === 'ar' ? "اكتب رأيك أو تجربتك مع السيستم (اختياري)..." : "Write your experience with the system (Optional)...";

    // 🔴 ترجمة الشات 🔴
    const chatInput = document.getElementById('live_chat_input');
    if(chatInput) chatInput.placeholder = c.chatInputPlaceholder;
    const chatBtn = document.getElementById('btn-chat-send');
    if(chatBtn) chatBtn.innerText = c.btnChatSend;

    window.homeLang = c;
}

function getDefaultPermissions(role) {
    const allOn = { patients: true, calendar: true, finances: true, invoices: true, inventory: true, reports: true, settings: true, services: true, contracts: true, branches: true, hr: true, notifications: true, portal: true, support: true };
    if (role === 'admin' || role === 'superadmin') return allOn;
    if (role === 'doctor') return { ...allOn, finances: false, invoices: false, reports: false, settings: false, hr: false, branches: false };
    if (role === 'receptionist') return { ...allOn, reports: false, settings: false, hr: false, branches: false, inventory: false };
    return { patients: false, calendar: false, finances: false, invoices: false, inventory: false, reports: false, settings: false, services: false, contracts: false, branches: false, hr: false, notifications: false, portal: false, support: false };
}

function applyPermissions(perms, role) {
    const superAdminLi = document.getElementById('nav-super-admin') || document.getElementById('nav-super-admin-li');
    if (superAdminLi) superAdminLi.style.display = (role === 'superadmin' && !sessionStorage.getItem('impersonatedClinicId')) ? 'block' : 'none';
    
    if (role === 'superadmin') return;

    const features = window.clinicFeatures || JSON.parse(sessionStorage.getItem('clinicFeatures')) || {};

    const restrictedItems = document.querySelectorAll('#nav-links li');
    restrictedItems.forEach(item => {
        let permKey = item.getAttribute('data-perm');
        
        if (!permKey && item.id) {
            if (item.id.includes('patients')) permKey = 'patients';
            else if (item.id.includes('calendar')) permKey = 'calendar';
            else if (item.id.includes('finances')) permKey = 'finances';
            else if (item.id.includes('invoices')) permKey = 'invoices';
            else if (item.id.includes('inventory')) permKey = 'inventory';
            else if (item.id.includes('settings')) permKey = 'settings';
            else if (item.id.includes('portal')) permKey = 'portal';
            else if (item.id.includes('support')) permKey = 'support';
            else if (item.id.includes('dash')) permKey = 'dash';
        }

        if (!permKey) return; 
        if (permKey === 'dash') { item.style.display = 'block'; return; }

        let featureKey = permKey;
        if (permKey === 'calendar') featureKey = 'appointments';
        if (permKey === 'finances') featureKey = 'accounts';

        const isFeatureEnabled = features[featureKey] !== false;
        const isUserPermitted = perms && perms[permKey] === true;

        if (!isFeatureEnabled || !isUserPermitted) {
            item.style.display = 'none';
        } else {
            item.style.display = 'block';
        }
    });

    const isReportsEnabled = (features['reports'] !== false) && perms && perms.reports === true;
    if (!isReportsEnabled) {
        document.querySelectorAll('.btn-finance').forEach(btn => btn.style.display = 'none');
    } else {
        document.querySelectorAll('.btn-finance').forEach(btn => btn.style.display = 'inline-block');
    }
}

// 🔴 رادار الإشعارات المركزي 🔴
let globalNotifUnsubscribe = null;

function startGlobalNotificationsListener(clinicId, role, branchId) {
    if (!clinicId || clinicId === 'default') return;
    
    const badge = document.getElementById('global-notif-badge');
    const bellContainer = document.getElementById('global-bell-container');
    if (!badge || !bellContainer) return;

    if (globalNotifUnsubscribe) globalNotifUnsubscribe();

    let queryRef = db.collection("Notifications")
        .where("clinicId", "==", clinicId)
        .where("isRead", "==", false);

    if (role !== 'admin' && role !== 'superadmin') {
        queryRef = queryRef.where("branchId", "==", branchId);
    }

    globalNotifUnsubscribe = queryRef.onSnapshot(snap => {
        const count = snap.docs.length;
        if (count > 0) {
            badge.innerText = count > 99 ? '+99' : count;
            badge.classList.add('active');
            
            snap.docChanges().forEach(change => {
                if (change.type === 'added') {
                    bellContainer.classList.add('ringing');
                    setTimeout(() => bellContainer.classList.remove('ringing'), 600);
                }
            });
        } else {
            badge.innerText = '0';
            badge.classList.remove('active');
            bellContainer.classList.remove('ringing');
        }
    }, err => {
        console.error("Global Notif Error:", err);
    });
}

// 🔴 رادار حالة المستخدم (نسخة محصنة متوافقة مع الآيفون) 🔴
let homeFallbackTimer = null;

firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        // إلغاء أي طرد مؤقت لو الفايربيز صحي
        if (homeFallbackTimer) clearTimeout(homeFallbackTimer);

        document.getElementById('userEmail').innerText = user.email;
        if (window.showLoader) window.showLoader(document.body.dir === 'rtl' ? "جاري تهيئة النظام..." : "Initializing...");

        try {
            const userDoc = await db.collection("Users").doc(user.email).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                let role = userData.role || 'reception';
                if (sessionStorage.getItem('impersonatedClinicId')) {
                    role = 'admin'; 
                }
                
                const clinicId = sessionStorage.getItem('impersonatedClinicId') || userData.clinicId || sessionStorage.getItem('clinicId') || 'default';
                const branchId = userData.branchId || sessionStorage.getItem('branchId') || 'main'; 
                sessionStorage.setItem('clinicId', clinicId);
                sessionStorage.setItem('userRole', role); 
                // تأمين للحسابات المركزية عشان متدخلش في انتظار لانهائي
                if (role === 'superadmin' || clinicId === 'default') {
                    sessionStorage.setItem('clinicFeatures', JSON.stringify({}));
                }

                let userPermissions = userData.permissions;
                let defaultPerms = getDefaultPermissions(role);
                
                if (!userPermissions) {
                    userPermissions = defaultPerms;
                    if(!sessionStorage.getItem('impersonatedClinicId')) {
                        db.collection("Users").doc(user.email).update({ permissions: userPermissions }).catch(e=>{});
                    }
                } else {
                    let isMissingKeys = false;
                    for (let key in defaultPerms) {
                        if (userPermissions[key] === undefined) {
                            userPermissions[key] = defaultPerms[key];
                            isMissingKeys = true;
                        }
                    }
                    if (isMissingKeys && !sessionStorage.getItem('impersonatedClinicId')) {
                        db.collection("Users").doc(user.email).update({ permissions: userPermissions }).catch(e=>{});
                    }
                }
                
                sessionStorage.setItem('userPermissions', JSON.stringify(userPermissions));

                applyPermissions(userPermissions, role);
                loadClinicBranding(clinicId);
                
                if(role !== 'superadmin' && clinicId !== 'default') {
                    checkSubscriptionAlert(clinicId);
                }

                startGlobalNotificationsListener(clinicId, role, branchId);

                if (sessionStorage.getItem('impersonatedClinicId')) {
                    const logoutBtn = document.getElementById('btn-logout');
                    if (logoutBtn) {
                        const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
                        logoutBtn.innerHTML = isAr ? "❌ إغلاق العيادة والعودة" : "❌ Close & Return";
                        logoutBtn.classList.remove('btn-danger');
                        logoutBtn.style.backgroundColor = '#e11d48';
                        logoutBtn.onclick = (e) => {
                            e.preventDefault();
                            sessionStorage.removeItem('impersonatedClinicId');
                            window.close(); 
                            window.location.href = 'home.html'; 
                        };
                    }
                }

                const lastPage = sessionStorage.getItem('lastOpenedPage');
                const lastNavId = sessionStorage.getItem('lastActiveNavId');
                
                let pageToLoad = lastPage || 'dashboard.html';
                let navToClick = lastNavId ? document.getElementById(lastNavId) : document.getElementById('nav-item-dash');

                if (navToClick && navToClick.style.display === 'none') {
                    pageToLoad = 'dashboard.html';
                    navToClick = document.getElementById('nav-item-dash');
                }

                loadPage(pageToLoad, navToClick);
                
                // 🔴 رادار الطرد الإجباري 🔴
                db.collection("Users").doc(user.email).onSnapshot(async (doc) => {
                    if (doc.exists && doc.data().forceLogout === true) {
                        alert("🔒 تم تسجيل خروجك إدارياً من قبل السوبر أدمن.");
                        await db.collection("Users").doc(user.email).update({ forceLogout: false });
                        firebase.auth().signOut().then(() => {
                            sessionStorage.clear();
                            localStorage.removeItem('niva_logged_in');
                            window.top.location.href = 'index.html';
                        });
                    }
                });
                            
                // 🚨 Death Switch (حماية الطرد النهائي للعيادة المحذوفة) 🚨
                if (clinicId && clinicId !== 'default') {
                    db.collection("Clinics").doc(clinicId).onSnapshot(doc => {
                        if (!doc.exists || doc.data().status === 'deleted') {
                            alert("🚫 تم إغلاق أو إزالة هذه العيادة من قِبل إدارة النظام. سيتم تسجيل خروجك الآن.");
                            firebase.auth().signOut().then(() => {
                                sessionStorage.clear();
                                localStorage.removeItem('niva_logged_in');
                                window.location.href = "index.html";
                            });
                        }
                    });
                }

            }
        } catch (error) {
            console.error("خطأ في جلب بيانات المستخدم:", error);
        } finally {
            if (window.hideLoader) window.hideLoader();
        }
    } else {
        // 🔴 التعديل السحري: هل هذا طرد حقيقي أم بطء من الآيفون؟
        if (localStorage.getItem('niva_logged_in') === 'true') {
            console.log("⏳ الآيفون يقرأ الجلسة ببطء في الرئيسية.. مهلة 4 ثواني...");
            homeFallbackTimer = setTimeout(() => {
                if (!firebase.auth().currentUser) {
                    localStorage.removeItem('niva_logged_in');
                    window.location.href = "index.html";
                }
            }, 4000);
        } else {
            // لو مفيش وتد أمان، ده معناه إنه طرد حقيقي
            window.location.href = "index.html";
        }
    }
});

// =========================================================================
// 🛡️ نظام الحماية وتتبع الحالة (Presence & Idle Timeout)
// =========================================================================
const IDLE_TIMEOUT_MINUTES = 30; 
const OFFLINE_MARK_MINUTES = 15; 
let currentPresenceStatus = "online"; 

function updateUserPresence(isOnlineStatus) {
    const user = firebase.auth().currentUser;
    if (user) {
        const docId = user.email || user.uid; 
        db.collection("Users").doc(docId).set({ 
            isOnline: isOnlineStatus, 
            lastSeen: firebase.firestore.FieldValue.serverTimestamp() 
        }, { merge: true }).catch(()=>{});
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { 
        currentPresenceStatus = "online"; 
        updateUserPresence(true); 
    } else if (document.visibilityState === 'hidden') { 
        currentPresenceStatus = "offline"; 
        updateUserPresence(false); 
    }
});

function updateLastActiveTime() {
    localStorage.setItem('lastActiveNiva', Date.now());
    if (currentPresenceStatus === "offline" && firebase.auth().currentUser) { 
        currentPresenceStatus = "online"; 
        updateUserPresence(true); 
    }
}

// الاستماع لحركات المستخدم (ضفت النقر لزيادة دقة الرصد)
document.onmousemove = updateLastActiveTime; 
document.onkeypress = updateLastActiveTime; 
document.ontouchstart = updateLastActiveTime;
document.onclick = updateLastActiveTime;

setInterval(() => {
    const lastActive = localStorage.getItem('lastActiveNiva');
    if (lastActive && firebase.auth().currentUser) {
        const diffMinutes = (Date.now() - Number(lastActive)) / (1000 * 60);
        
        if (diffMinutes >= IDLE_TIMEOUT_MINUTES) {
            if(firebase.auth().currentUser) {
                updateUserPresence(false);
                
                firebase.auth().signOut().then(() => {
                    // 1. مسح الذاكرة المؤقتة بالكامل
                    sessionStorage.clear(); 
                    
                    // 2. المسح الشامل القاسي للـ LocalStorage مع الحفاظ على مظهر الموقع
                    const lang = localStorage.getItem('preferredLang');
                    const theme = localStorage.getItem('niva_theme');
                    localStorage.clear(); // ده بيمسح وتد الأمان (niva_logged_in) وأي داتا تانية
                    if(lang) localStorage.setItem('preferredLang', lang);
                    if(theme) localStorage.setItem('niva_theme', theme);

                    // 3. عرض رسالة التنبيه باللغة المحددة
                    const isAr = (lang || 'ar') === 'ar';
                    alert(isAr ? "🔒 تم تسجيل الخروج تلقائياً لعدم الاستخدام لفترة طويلة (حماية لبيانات العيادة)." : "🔒 Logged out automatically due to inactivity (Data Protection)."); 
                    
                    // 4. التوجيه الإجباري الآمن (replace تمنع العودة للخلف)
                    window.top.location.replace('index.html');
                }).catch(() => {
                    window.top.location.replace('index.html');
                });
            }
        } else if (diffMinutes >= OFFLINE_MARK_MINUTES && currentPresenceStatus === "online") {
            currentPresenceStatus = "offline"; 
            updateUserPresence(false);
        }
    }
}, 60000);

async function checkSubscriptionAlert(clinicId) {
    try {
        db.collection("Clinics").doc(clinicId).onSnapshot(async (clinicDoc) => {
            if (clinicDoc.exists) {
                const cData = clinicDoc.data();
                
                window.clinicFeatures = cData.features || {};
                sessionStorage.setItem('clinicFeatures', JSON.stringify(window.clinicFeatures));
                const savedPerms = sessionStorage.getItem('userPermissions');
                const savedRole = sessionStorage.getItem('userRole');
                if (savedPerms && savedRole) {
                    applyPermissions(JSON.parse(savedPerms), savedRole);
                }

                const now = new Date();
                
                if (cData.status === 'suspended') { 
                    showPaywallBlocker("تم إيقاف الحساب", "عفواً، تم إيقاف حساب عيادتك إدارياً. يرجى التواصل مع الدعم الفني للاستفسار."); 
                    return; 
                }
                
                let expireDate = null;
                if (cData.nextPaymentDate) {
                    expireDate = typeof cData.nextPaymentDate.toDate === 'function' ? cData.nextPaymentDate.toDate() : new Date(cData.nextPaymentDate);
                } else if (cData.trialEndDate) {
                    expireDate = typeof cData.trialEndDate.toDate === 'function' ? cData.trialEndDate.toDate() : new Date(cData.trialEndDate);
                }
                
                if (expireDate) {
                    if (now > expireDate) {
                        if (cData.status !== 'expired') { 
                            await db.collection("Clinics").doc(clinicId).update({ 
                                status: 'expired', 
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
                            }); 
                        }
                        showPaywallBlocker("انتهى الاشتراك", "عفواً، لقد انتهت فترة تجربتك المجانية أو اشتراكك.");
                    } else {
                        hidePaywallBlocker();
                        const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24)); 
                        if (diffDays >= 0 && diffDays <= 3) {
                            showBillingAlert(diffDays); 
                        } else {
                            hideBillingAlert(); 
                        }
                    }
                }
            }
        });
    } catch (error) { 
        console.error("خطأ في فحص الاشتراك:", error); 
    }
}

function showPaywallBlocker(title, message) {
    let blocker = document.getElementById('paywall-blocker');
    if (!blocker) {
        blocker = document.createElement('div'); 
        blocker.id = 'paywall-blocker';
        blocker.style.cssText = "position: fixed; inset: 0; background: rgba(15, 23, 42, 0.95); z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(10px); color: white; text-align: center; direction: rtl; padding: 20px;";
        document.body.appendChild(blocker);
    }
    blocker.innerHTML = `<div style="background: white; color: #0f172a; padding: 40px; border-radius: 20px; max-width: 500px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);"><div style="font-size: 50px; margin-bottom: 15px;">⚠️</div><h2 style="margin: 0 0 15px 0; font-size: 24px; color: #dc2626; font-weight: 900;">${title}</h2><p style="margin: 0 0 25px 0; color: #475569; line-height: 1.6; font-size: 16px;">${message}</p><button onclick="firebase.auth().signOut().then(() => { sessionStorage.clear(); window.location.href = 'index.html'; })" style="background: #dc2626; color: white; border: none; padding: 15px; width: 100%; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer;">تسجيل الخروج</button></div>`;
}

function hidePaywallBlocker() { 
    const blocker = document.getElementById('paywall-blocker'); 
    if (blocker) blocker.remove(); 
}

function showBillingAlert(daysLeft) {
    if(document.getElementById('billing-alert-banner')) return;
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    let alertMsg = daysLeft === 0 
        ? (isAr ? "⚠️ تنبيه هام: اشتراك العيادة ينتهي اليوم! يرجى التجديد فوراً." : "⚠️ Warning: Subscription expires TODAY! Please renew.") 
        : (isAr ? `⚠️ تنبيه هام: اشتراك العيادة سينتهي خلال ${daysLeft} أيام. يرجى التواصل مع الإدارة للتجديد.` : `⚠️ Warning: Subscription expires in ${daysLeft} days. Please renew.`);
    
    const alertDiv = document.createElement('div'); 
    alertDiv.id = "billing-alert-banner";
    alertDiv.style.cssText = "background-color: #ef4444; color: white; text-align: center; padding: 10px; font-weight: bold; font-size: 14px; z-index: 9999; position: relative; width: 100%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); animation: slideDown 0.3s ease-out;";
    alertDiv.innerHTML = `<span>${alertMsg}</span>`; 
    document.body.insertBefore(alertDiv, document.body.firstChild);
}

function hideBillingAlert() { 
    const alertDiv = document.getElementById('billing-alert-banner'); 
    if(alertDiv) alertDiv.remove(); 
}

async function loadClinicBranding(clinicId) {
    if (clinicId === 'default' || !clinicId) return; 
    try {
        const clinicDoc = await db.collection("Clinics").doc(clinicId).get();
        if (clinicDoc.exists) {
            const clinicData = clinicDoc.data();
            if (clinicData.clinicName) { 
                const nameElement = document.getElementById('txt-clinic-name'); 
                if (nameElement) nameElement.innerText = clinicData.clinicName; 
            }
            if (clinicData.logoUrl) { 
                const logoContainer = document.getElementById('clinic-logo-container'); 
                if (logoContainer) logoContainer.innerHTML = `<img src="${clinicData.logoUrl}" alt="Clinic Logo" style="max-width: 45px; max-height: 45px; border-radius: 8px; object-fit: contain;">`; 
            }
        }
    } catch (error) { 
        console.error("خطأ في جلب بيانات العيادة:", error); 
    }
}

function toggleSidebar() { 
    document.getElementById('sidebar').classList.toggle('active'); 
    document.getElementById('mobile-overlay').classList.toggle('active'); 
}

function toggleSidebarDesktop() { 
    document.body.classList.toggle('sidebar-pinned'); 
    localStorage.setItem('sidebarPinned', document.body.classList.contains('sidebar-pinned')); 
}

// ===============================================
// 🔴 قسم الدعم الفني، التقييمات وشات الإدارة المباشر 🔴
// ===============================================
let liveChatUnsubscribe = null; // متغير لغلق اتصال الشات عند قفل المودال

function openSupportModal() { 
    document.getElementById('support_message').value = ''; 
    document.getElementById('review_message').value = ''; 
    setRating(0); 
    switchSupportTab('ticket'); 
    document.getElementById('supportModal').style.display = 'flex'; 
}

function closeSupportModal() { 
    document.getElementById('supportModal').style.display = 'none'; 
    if (liveChatUnsubscribe) {
        liveChatUnsubscribe();
        liveChatUnsubscribe = null;
    }
}

function switchSupportTab(tabName) {
    document.getElementById('btn-tab-ticket').classList.remove('active');
    document.getElementById('btn-tab-review').classList.remove('active');
    if(document.getElementById('btn-tab-chat')) document.getElementById('btn-tab-chat').classList.remove('active');
    
    document.getElementById('support-ticket-view').style.display = 'none';
    document.getElementById('support-review-view').style.display = 'none';
    if(document.getElementById('support-chat-view')) document.getElementById('support-chat-view').style.display = 'none';

    if (tabName === 'ticket') {
        document.getElementById('btn-tab-ticket').classList.add('active');
        document.getElementById('support-ticket-view').style.display = 'block';
    } else if (tabName === 'review') {
        document.getElementById('btn-tab-review').classList.add('active');
        document.getElementById('support-review-view').style.display = 'block';
    } else if (tabName === 'chat') {
        document.getElementById('btn-tab-chat').classList.add('active');
        document.getElementById('support-chat-view').style.display = 'flex';
        startLiveChat(); // تفعيل جلب الرسائل
    }
}

// 🔴 دالة جلب الشات المباشر (للدكتور) 🔴
function startLiveChat() {
    const clinicId = sessionStorage.getItem('clinicId');
    const chatArea = document.getElementById('live_chat_area');
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    
    if(!clinicId || !chatArea) return;
    
    if(liveChatUnsubscribe) liveChatUnsubscribe(); // قفل القديم لو موجود
    
    chatArea.innerHTML = `<div style="text-align:center; color:#94a3b8; padding: 20px;">${isAr?'جاري الاتصال بالإدارة...':'Connecting to support...'}</div>`;
    
    liveChatUnsubscribe = db.collection("LiveChats")
        .where("clinicId", "==", clinicId)
        .orderBy("createdAt", "asc")
        .onSnapshot(snap => {
            chatArea.innerHTML = '';
            if(snap.empty) {
                chatArea.innerHTML = `<div style="text-align:center; color:#94a3b8; padding: 20px;">${isAr?'مرحباً بك! يمكنك مراسلة الإدارة المباشرة من هنا.':'Hello! You can chat with live support here.'}</div>`;
                return;
            }
            snap.forEach(doc => {
                const msg = doc.data();
                const isSuperAdmin = msg.senderRole === 'superadmin';
                
                // لو السوبر أدمن هو اللي باعت (يبان على الشمال لونه مختلف)
                // لو الدكتور هو اللي باعت (يبان على اليمين لونه أزرق)
                const alignStyles = isSuperAdmin 
                    ? 'align-self: flex-start; background: #f1f5f9; color: #0f172a; border-bottom-left-radius: 0; border: 1px solid #cbd5e1;' 
                    : 'align-self: flex-end; background: #0284c7; color: white; border-bottom-right-radius: 0;';
                
                chatArea.innerHTML += `
                    <div style="max-width: 80%; padding: 10px 15px; border-radius: 12px; ${alignStyles} box-shadow: 0 1px 2px rgba(0,0,0,0.05); margin-bottom: 5px;">
                        <div style="font-size: 11px; font-weight: bold; margin-bottom: 4px; opacity: 0.9;">${msg.senderName || '---'}</div>
                        <div style="font-size: 14px; line-height: 1.4;">${msg.text}</div>
                        <div style="font-size: 10px; opacity: 0.7; margin-top: 5px; text-align: ${isSuperAdmin?'left':'right'};">${msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString(isAr?'ar-EG':'en-US', {hour: '2-digit', minute:'2-digit'}) : ''}</div>
                    </div>
                `;
            });
            chatArea.scrollTop = chatArea.scrollHeight; // النزول للأسفل
        });
}

// 🔴 دالة إرسال رسالة شات للإدارة 🔴
async function sendClinicChatMessage() {
    const clinicId = sessionStorage.getItem('clinicId');
    const input = document.getElementById('live_chat_input');
    const text = input.value.trim();
    
    if(!clinicId || !text) return;
    input.value = ''; // تفريغ الخانة فوراً
    
    const docName = document.getElementById('userEmail') ? document.getElementById('userEmail').innerText.split('@')[0] : 'Dr';
    
    try {
        await db.collection("LiveChats").add({
            clinicId: clinicId,
            text: text,
            senderRole: 'clinic',
            senderName: docName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch(e) { 
        console.error("Chat Send Error:", e); 
        const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
        alert(isAr ? "حدث خطأ أثناء إرسال الرسالة." : "Error sending message."); 
    }
}

function setRating(val) {
    document.getElementById('current_rating').value = val;
    const stars = document.getElementById('star-container').querySelectorAll('span');
    stars.forEach(star => {
        if (parseInt(star.getAttribute('data-val')) <= val) {
            star.classList.add('active');
            star.style.color = '#fbbf24';
        } else {
            star.classList.remove('active');
            star.style.color = document.body.getAttribute('data-theme') === 'dark' ? '#475569' : '#cbd5e1';
        }
    });
}

async function sendSupportTicket() {
    const msg = document.getElementById('support_message').value.trim();
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';

    if (!msg) { alert(isAr ? "برجاء كتابة الرسالة أولاً!" : "Please write a message first!"); return; }
    
    const btn = document.getElementById('btn-support-send'); 
    const originalText = btn ? btn.innerText : 'إرسال'; 
    if(btn) btn.innerText = isAr ? "⏳ جاري الإرسال..." : "Sending...";
    
    try {
        await db.collection("SupportTickets").add({ 
            clinicId: sessionStorage.getItem('clinicId') || 'غير معروف', 
            clinicName: document.getElementById('txt-clinic-name') ? document.getElementById('txt-clinic-name').innerText : 'غير معروف', 
            userEmail: document.getElementById('userEmail') ? document.getElementById('userEmail').innerText : 'غير معروف', 
            message: msg, 
            status: "open", 
            timestamp: firebase.firestore.FieldValue.serverTimestamp() 
        });
        alert(isAr ? "✅ تم إرسال تذكرة الدعم للإدارة بنجاح!" : "✅ Ticket submitted successfully!"); 
        closeSupportModal();
    } catch (error) { 
        console.error("Error sending ticket:", error); 
        alert(isAr ? "❌ حدث خطأ أثناء الإرسال." : "❌ Error sending ticket."); 
    } finally { 
        if(btn) btn.innerText = originalText; 
    }
}

async function sendSystemReview() {
    const rating = parseInt(document.getElementById('current_rating').value);
    const msg = document.getElementById('review_message').value.trim();
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';

    if (rating === 0) { alert(isAr ? "برجاء اختيار عدد النجوم أولاً!" : "Please select a star rating!"); return; }
    
    const btn = document.getElementById('btn-review-send'); 
    const originalText = btn ? btn.innerText : 'نشر التقييم ⭐'; 
    if(btn) btn.innerText = isAr ? "⏳ جاري النشر..." : "Posting...";
    
    try {
        await db.collection("SystemReviews").add({ 
            clinicId: sessionStorage.getItem('clinicId') || 'غير معروف', 
            clinicName: document.getElementById('txt-clinic-name') ? document.getElementById('txt-clinic-name').innerText : 'غير معروف', 
            userEmail: document.getElementById('userEmail') ? document.getElementById('userEmail').innerText : 'غير معروف', 
            rating: rating,
            comment: msg, 
            createdAt: firebase.firestore.FieldValue.serverTimestamp() 
        });
        alert(isAr ? "🎉 شكراً لك! تم نشر تقييمك بنجاح." : "🎉 Thank you! Review posted successfully."); 
        closeSupportModal();
    } catch (error) { 
        console.error("Error sending review:", error); 
        alert(isAr ? "❌ حدث خطأ أثناء الإرسال." : "❌ Error posting review."); 
    } finally { 
        if(btn) btn.innerText = originalText; 
    }
}

window.addEventListener('click', function(event) { 
    const modal = document.getElementById('supportModal'); 
    if (event.target === modal) closeSupportModal(); 
});
// ===============================================

function toggleAIPanel() { 
    const panel = document.getElementById('niva-ai-panel'); 
    const triggerBtn = document.getElementById('niva-btn-trigger'); 
    if (panel.style.display === 'flex') { 
        panel.style.display = 'none'; 
        triggerBtn.innerHTML = '🤖'; 
        triggerBtn.classList.remove('open'); 
    } else { 
        panel.style.display = 'flex'; 
        triggerBtn.innerHTML = '❌'; 
        triggerBtn.classList.add('open'); 
    } 
}

function appendToAIChat(text, isUser = false) { 
    const chatBody = document.getElementById('niva-ai-chat'); 
    const msgDiv = document.createElement('div'); 
    msgDiv.className = isUser ? 'user-msg' : 'ai-msg'; 
    msgDiv.innerHTML = text; 
    chatBody.appendChild(msgDiv); 
    chatBody.scrollTop = chatBody.scrollHeight; 
}

async function askAI(promptType) {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const clinicId = sessionStorage.getItem('clinicId');

    let userMsg = "";
    if (promptType === 'income') userMsg = isAr ? "كم إجمالي إيرادات العيادة اليوم؟" : "What is today's total income?";
    else if (promptType === 'expenses') userMsg = isAr ? "كم إجمالي مصروفات العيادة اليوم؟" : "What is today's total expenses?";
    else if (promptType === 'debts') userMsg = isAr ? "من هم المرضى المتعثرين؟ وما هو إجمالي الديون؟" : "Who are the defaulting patients? Total debts?";
    else if (promptType === 'appointments') userMsg = isAr ? "ما هو موقف مواعيد اليوم؟" : "What is today's appointment status?";
    else if (promptType === 'tomorrow') userMsg = isAr ? "ما هي مواعيد عيادة الغد؟" : "What are tomorrow's appointments?";
    else if (promptType === 'inventory') userMsg = isAr ? "هل يوجد نواقص في المخزن الطبي؟" : "Are there any inventory shortages?";

    appendToAIChat(userMsg, true);
    
    if (!clinicId || clinicId === 'default') {
        setTimeout(() => {
            appendToAIChat(isAr ? "⚠️ <strong>تنبيه:</strong> أنا مساعد ذكي مخصص لقراءة بيانات العيادات فقط. أنت الآن مسجل دخول بحساب (الإدارة المركزية)." : "⚠️ <strong>Alert:</strong> AI reads clinic data only. Please login with a clinic account to test.", false);
        }, 500);
        return;
    }

    const loadingId = "ai-loading-" + Date.now();
    appendToAIChat(`<span id="${loadingId}" style="color:#64748b;">⏳ ${isAr ? 'جاري الفحص السريع...' : 'Checking data...'}</span>`);

    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
        let aiResponse = "";

        if (promptType === 'income') {
            const snap = await db.collection("Finances").where("clinicId", "==", clinicId).where("date", "==", todayStr).where("type", "==", "income").get();
            let total = 0; snap.forEach(doc => total += Number(doc.data().amount));
            aiResponse = isAr ? `✅ إجمالي المبالغ المحصلة اليوم هو: <strong>${total} ج.م</strong> من ${snap.size} عملية توريد.` : `✅ Today's total collected income is: <strong>${total} EGP</strong> from ${snap.size} transactions.`;
        } 
        else if (promptType === 'expenses') {
            const snap = await db.collection("Finances").where("clinicId", "==", clinicId).where("date", "==", todayStr).where("type", "==", "expense").get();
            let total = 0; snap.forEach(doc => total += Number(doc.data().amount));
            aiResponse = isAr ? `📉 إجمالي المصروفات المسجلة اليوم هو: <strong style="color:#dc2626;">${total} ج.م</strong> في ${snap.size} بند.` : `📉 Today's total expenses are: <strong style="color:#dc2626;">${total} EGP</strong> in ${snap.size} items.`;
        }
        else if (promptType === 'debts') {
            const snap = await db.collection("Patients").where("clinicId", "==", clinicId).where("totalDebt", ">", 0).get();
            let totalDebts = 0; let patientsList = [];
            snap.forEach(doc => { let d = doc.data(); totalDebts += Number(d.totalDebt); patientsList.push(`${d.name} (${d.totalDebt} ج.م)`); });
            if (snap.size === 0) { aiResponse = isAr ? "✨ ممتاز! لا يوجد مرضى عليهم مديونيات للعيادة." : "✨ Great! No patients with outstanding debts."; } 
            else {
                let topList = patientsList.slice(0, 3).join('<br> - '); 
                let moreHtml = patientsList.length > 3 ? `<br><small>...و ${patientsList.length - 3} مرضى آخرين (راجع صفحة المرضى).</small>` : "";
                aiResponse = isAr ? `💸 إجمالي الديون المستحقة للعيادة هو: <strong>${totalDebts} ج.م</strong> موزع على ${snap.size} مريض.<br><strong>أبرز المتعثرين:</strong><br> - ${topList} ${moreHtml}` : `💸 Total debts owed to clinic: <strong>${totalDebts} EGP</strong> across ${snap.size} patients.`;
            }
        }
        else if (promptType === 'appointments') {
            const snap = await db.collection("Appointments").where("clinicId", "==", clinicId).where("date", "==", todayStr).get();
            let total = snap.size, completed = 0, pending = 0, cancelled = 0;
            snap.forEach(doc => {
                const s = doc.data().status;
                if (s === 'completed') completed++; else if (s === 'cancelled') cancelled++; else pending++;
            });
            aiResponse = isAr ? `📅 إجمالي حجوزات اليوم: <strong>${total}</strong><br>✔️ اكتمل: ${completed}<br>⏳ في الانتظار: ${pending}<br>🚫 ملغي: ${cancelled}` : `📅 Total appointments today: <strong>${total}</strong><br>✔️ Completed: ${completed}<br>⏳ Pending: ${pending}<br>🚫 Cancelled: ${cancelled}`;
        }
        else if (promptType === 'tomorrow') {
            const snap = await db.collection("Appointments").where("clinicId", "==", clinicId).where("date", "==", tomorrowStr).get();
            let total = snap.size;
            if (total === 0) { aiResponse = isAr ? "لا توجد أي حجوزات مسجلة لغدٍ حتى الآن. 🏖️" : "No appointments scheduled for tomorrow yet. 🏖️"; } 
            else { aiResponse = isAr ? `🔮 يوجد <strong>${total} كشوفات</strong> مسجلة غداً.` : `🔮 There are <strong>${total} appointments</strong> scheduled for tomorrow.`; }
        }
        else if (promptType === 'inventory') {
            const snap = await db.collection("Inventory").where("clinicId", "==", clinicId).get();
            let shortages = [];
            snap.forEach(doc => { const item = doc.data(); if (item.qty <= item.minAlert) shortages.push(item.name); });
            if (shortages.length === 0) { aiResponse = isAr ? "📦 المخزون في أمان! لا توجد نواقص حالياً." : "📦 Inventory is safe! No shortages currently."; } 
            else { aiResponse = isAr ? `🚨 <strong>تحذير!</strong> يوجد ${shortages.length} أصناف أوشكت على الانتهاء:<br> - ${shortages.join('<br> - ')}` : `🚨 <strong>Warning!</strong> ${shortages.length} items are running low:<br> - ${shortages.join('<br> - ')}`; }
        }

        const loadingElement = document.getElementById(loadingId);
        if(loadingElement && loadingElement.parentElement) loadingElement.parentElement.remove();
        appendToAIChat(aiResponse, false);

    } catch (error) {
        console.error(error);
        const loadingElement = document.getElementById(loadingId);
        if(loadingElement && loadingElement.parentElement) loadingElement.parentElement.remove();
        appendToAIChat(isAr ? "❌ حدث خطأ أثناء سحب البيانات. يرجى المحاولة لاحقاً." : "❌ Error fetching data. Please try again.", false);
    }
}

function openPortalSettings() {
    const currentClinicId = sessionStorage.getItem('clinicId');
    if (!currentClinicId || currentClinicId === 'default') {
        alert("لا يمكن إنشاء رابط لعيادة افتراضية. يرجى تسجيل الدخول بحساب عيادة.");
        return;
    }
    const portalUrl = `https://nivadent.web.app/portal.html?clinicId=${currentClinicId}`;
    document.getElementById('clinic_portal_link').value = portalUrl;
    
    const qrContainer = document.getElementById('clinic_qr_container');
    qrContainer.innerHTML = ''; 
    new QRCode(qrContainer, { text: portalUrl, width: 180, height: 180, colorDark : "#0f172a", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H });
    document.getElementById('clinicPortalModal').style.display = 'flex';
}

function copyPortalLink() {
    const linkInput = document.getElementById('clinic_portal_link');
    linkInput.select();
    document.execCommand("copy");
    alert("✅ تم نسخ الرابط بنجاح!");
}

function printClinicQR() {
    const qrCanvas = document.querySelector('#clinic_qr_container canvas');
    if (!qrCanvas) return;
    const imgData = qrCanvas.toDataURL("image/png");
    const clinicName = document.getElementById('txt-clinic-name').innerText;
    
    const printArea = document.getElementById('portalPrintArea');
    printArea.innerHTML = `
        <div style="text-align: center; font-family: 'Tajawal', sans-serif; padding: 40px; border: 4px solid #0284c7; border-radius: 20px; max-width: 500px; margin: 0 auto; background: white;">
            <h1 style="color: #0284c7; font-size: 36px; margin-bottom: 10px;">${clinicName}</h1>
            <h2 style="color: #0f172a; margin-top: 0;">بوابة المريض الذكية</h2>
            <img src="${imgData}" style="width: 250px; height: 250px; margin: 20px 0;">
            <p style="font-size: 20px; font-weight: bold; color: #d97706;">قم بمسح الكود بكاميرا هاتفك</p>
            <ul style="text-align: right; font-size: 18px; color: #475569; display: inline-block; padding-right: 20px;">
                <li style="margin-bottom: 10px;">✅ تابع دورك في الانتظار</li>
                <li style="margin-bottom: 10px;">✅ احجز موعد جديد بسهولة</li>
                <li style="margin-bottom: 10px;">✅ راجع حساباتك الطبية</li>
            </ul>
        </div>
    `;
    
    document.getElementById('clinicPortalModal').style.display = 'none';
    printArea.style.display = 'block'; 
    
    const style = document.createElement('style');
    style.id = 'temp-print-style';
    style.innerHTML = `@media print { body * { visibility: hidden; } #portalPrintArea, #portalPrintArea * { visibility: visible; } #portalPrintArea { position: absolute; left: 0; top: 0; width: 100%; } }`;
    document.head.appendChild(style);

    setTimeout(() => {
        window.print();
        printArea.innerHTML = '';
        printArea.style.display = 'none';
        document.head.removeChild(style); 
    }, 500);
}

window.openPortalSettings = openPortalSettings;
window.copyPortalLink = copyPortalLink;
window.printClinicQR = printClinicQR;

// 🔴 استقبال الإشارات من الداشبورد 🔴
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'REFRESH_SIDEBAR') {
        console.log("الداشبورد بتنبهنا لتحديث العيادة:", event.data.clinicId);
        loadClinicBranding(event.data.clinicId);
    }
});
