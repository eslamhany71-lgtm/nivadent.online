// js/super-admin.js - Master Cloud Logic (SaaS)

// 🔴 كود مسح الذاكرة المؤقتة (Cache) العنيدة للموبايل
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
        }
    });
}

const db = firebase.firestore();
let allClinicsList = []; 
let clinicUsersUnsubscribe = null; 
// 🛡️ رتبة المستخدم الحالي في لوحة السوبر أدمن
let currentNivaRole = 'owner';
let currentActiveTab = 'active'; 

function updatePageContent(lang) {
    const t = {
        ar: {
            // 🔴 الأساسيات
            title: "إدارة النظام المركزية (SaaS)", sub: "لوحة تحكم المالك - صلاحيات عليا", search: "بحث بالاسم، الإيميل، أو الرقم المرجعي...", btnAdd: "إضافة عيادة يدوياً", btnAddUser: "توليد كود دعوة",
            totClinics: "العيادات النشطة", totSusp: "العيادات الموقوفة", totPatients: "المرضى (في كل النظام)",
            thDate: "تاريخ الاشتراك", thNextPay: "ميعاد الانتهاء", thName: "اسم العيادة / الباقة", thEmail: "إيميل الأدمن", thStatus: "الحالة", thAction: "إجراءات",
            loading: "جاري تحميل البيانات...", empty: "لا توجد عيادات مسجلة حالياً.",
            
            // 🔴 إضافة عيادة
            mTitle: "تسجيل عيادة جديدة بالنظام", lName: "اسم العيادة / المركز الطبي", lEmail: "البريد الإلكتروني للأدمن", 
            lHint: "* يجب إنشاء هذا الحساب لاحقاً من شاشة تسجيل الدخول.", lPhone: "رقم الموبايل",
            lPkg: "باقة الاشتراك", optPkgT7: "تجريبي (7 أيام)", optPkgT14: "تجريبي (14 يوم)", optPkgMonth: "شهري (Monthly)", optPkgYear: "سنوي (Yearly)",
            lPlan: "حالة الحساب", optAct: "نشط (Active)", optSusp: "موقوف (Suspended)", btnSave: "إنشاء العيادة وتوليد المعرف",
            lLimit: "الحد الأقصى للمستخدمين", hintLimit: "شاملاً حساب الدكتور المالك", lPrice: "قيمة الاشتراك (ج.م)",
            
            // 🔴 الحالات والإجراءات
            sAct: "نشط", sSusp: "موقوف", sExpired: "منتهي (خلص وقته)", 
            btnPaid: "تم الدفع", btnCancelSub: "إيقاف الحساب", btnRenew: "تفعيل الحساب", btnDelete: "حذف العيادة",
            msgSuccess: "تم إنشاء العيادة بنجاح!\n\nكود الدخول: {id}\nإيميل الأدمن: {email}\n\nيرجى إرسال الكود للدكتور لتفعيل الحساب.",
            msgError: "حدث خطأ أثناء الإنشاء!", msgConfirmToggle: "هل متأكد من تغيير حالة العيادة؟",
            msgConfirmPaid: "هل تريد تأكيد استلام الدفعة وتجديد الاشتراك؟",
            msgWarnDel: "تحذير: هذا سيحذف العيادة تماماً ولن يمكن استرجاعها! اكتب '1234' للتأكيد:", msgDelSuccess: "تم حذف العيادة بنجاح.", btnSaving: "جاري الإنشاء...",
            
            // 🔴 النوافذ المنبثقة
            ovrTitle: "تحكم يدوي في الاشتراك", ovrDiscount: "نسبة خصم خاصة (%)", ovrTrial: "تمديد تجربة (أيام إضافية)", ovrBtn: "حفظ التعديلات المالية",
            mUpgTitle: "🚀 ترقية العيادة التجريبية", mUpgSub: "حدد الباقة وقيمة الاشتراك لتوليد كود الدخول الجديد للعيادة.",
            lUpgPkg: "باقة الاشتراك", optUpgMonth: "شهري (Monthly)", optUpgYear: "سنوي (Yearly)",
            lUpgPrice: "الاشتراك (ج.م)", lUpgLimit: "الحد الأقصى للمستخدمين", btnConfirmUpg: "تأكيد الترقية وتوليد الكود",
            mUserTitle: "توليد كود دعوة مستخدم", mUserSub: "اختر العيادة والوظيفة لتوليد كود (يعمل كـ Override في حالة الطوارئ).",
            lUClinic: "العيادة التابعة لها", lUName: "اسم المستخدم", lURole: "الصلاحية الممنوحة (Role)",
            optUAdmin: "مدير نظام (Doctor/Admin)", optUDoc: "طبيب (صلاحية محدودة)", optURec: "موظف استقبال", optUNur: "مساعد / ممرضة", btnSubUser: "توليد كود الدعوة",
            modDetTitle: "لوحة تحكم العيادة المتقدمة", lblDetName: "اسم العيادة", lblDetCode: "كود العيادة", lblDetEmail: "إيميل الأدمن", lblDetPhone: "الموبايل",
            lblDetPkg: "نوع الباقة", lblDetCreated: "تاريخ الإنشاء", lblDetLimit: "الحد الأقصى للمستخدمين", lblDetPrice: "قيمة الاشتراك المتفق عليها:",
            txtTeamTitle: "👥 فريق العمل والمستخدمين", thUName: "اسم المستخدم", thUEmail: "البريد / الكود", thURole: "الصلاحية",
            thUDate: "تاريخ الانضمام", thUOnline: "متصل الآن؟", thULast: "آخر ظهور", txtULoad: "جاري تحميل المستخدمين...",
            
            // 🔴 التابات (Tabs)
            tabActive: "🏢 العيادات النشطة", tabTrials: "🚀 التجارب المجانية", tabSupport: "🎧 الدعم الفني", tabReviews: "⭐ التقييمات",
            tabChat: "💬 المراسلة", tabTeam: "🛡️ فريق الإدارة", tabPending: "⏳ الطلبات المعلقة", tabRevenue: "💰 الماليات والإيرادات", tabAudit: "📡 سجل النشاط (Audit)",
            
            // 🔴 الموديولات الجديدة (الطلبات، الماليات، الرادار)
            kpiPending: "طلبات دفع معلقة", kpiExpired: "اشتراكات منتهية", kpiSoon: "ينتهي خلال 3 أيام", kpiActive: "إجمالي العيادات النشطة", 
            kpiTrials: "تجارب مجانية (Trials)", kpiTeam: "مديرين السوبر أدمن", kpiStaff: "موظفين العيادات", kpiPatients: "إجمالي المرضى بالأنظمة",
            pendTitle: "⚡ تفعيل الباقات يدوياً", pendSub: "راجع الرقم المرجعي أو الإيصال مع حساباتك البنكية، ثم اضغط على زر التفعيل لتحديث باقة العيادة فوراً.",
            thReqDate: "تاريخ الطلب", thReqClinic: "العيادة / الإيميل", thReqPkg: "الباقة والمبلغ", thReqRef: "الرقم المرجعي / الإيصال", thReqAction: "إجراءات التفعيل",
            revMRR: "الإيرادات الشهرية المتكررة (MRR)", revTotal: "إجمالي الأرباح المحصلة", revChart: "📈 مؤشر نمو الإيرادات", revTable: "🧾 سجل المعاملات المالية الأخيرة",
            thRevDate: "التاريخ", thRevClinic: "العيادة", thRevPkg: "الباقة", thRevAmt: "المبلغ المدفوع", thRevMethod: "وسيلة الدفع", thRevStatus: "الحالة",
            auditTitle: "📡 رادار النظام الحي (Live Audit Trail)", auditSub: "سجل دقيق بكل حركة تحدث في النظام (تسجيل، دفع، تفعيل، انتهاء).",
            
            // 🔴 الإشعارات وصحة السيرفر
            noSupport: "لا توجد تذاكر دعم فني.", noReviews: "لا توجد تقييمات حتى الآن.", btnReply: "رد وإغلاق", msgReplySent: "تم إرسال الرد وإغلاق التذكرة بنجاح.",
            sysHealthTitle: "صحة السيرفر (System Health)", sysHealthDb: "حالة قواعد البيانات", sysHealthUsage: "مؤشر الاستهلاك",
            annTitle: "📢 الإذاعة المركزية (Global Announcements)", annSub: "إرسال إشعار فوري للعيادات على النظام (سيظهر في جرس الإشعارات لديهم).",
            annBtn: "🚀 إرسال الآن", chatWith: "تواصل مع:", chatPlaceholder: "اكتب رسالتك للعيادة هنا...", chatSend: "إرسال 🚀",
            teamAddTitle: "إضافة موظف إدارة جديد", teamEmail: "البريد الإلكتروني (جيميل)", teamRole: "الرتبة (الصلاحية)", teamAddBtn: "إضافة الموظف",
            roleSales: "مبيعات (Sales - رؤية فقط)", roleSupport: "دعم فني (Support)",
            
            // 🔴 باقات النظام 🔴
            pkgStart: "تجريبي (7 أيام)", pkgPro: "شهري (Clinic Pro)", pkgGrowth: "ربع سنوي (Growth)", pkgElite: "سنوي (Elite)", pkgLife: "مدى الحياة (Lifetime)",
            msgPkgChanged: "✅ تم تغيير باقة العيادة وتحديث الحصص وتاريخ الانتهاء بنجاح!", msgPkgErr: "❌ حدث خطأ أثناء تغيير الباقة", btnPkgChange: "تغيير الباقة",
            lblSelectPkg: "اختر الباقة الجديدة", btnSavePkg: "حفظ وتفعيل الباقة 🚀",
            toastNewReq: "طلب دفع جديد!", toastNewReqSub: "تم استلام مرفق جديد من:",
            msgApprove: "هل أنت متأكد من استلام المبلغ وتفعيل باقة هذه العيادة؟", msgReject: "هل أنت متأكد من رفض هذا الطلب؟",
            actSuccess: "تم تفعيل العيادة بنجاح!", actError: "حدث خطأ أثناء التفعيل."
        },
        en: {
            // 🔴 Core
            title: "Central SaaS Management", sub: "Owner Dashboard - Super Admin", search: "Search by name, email, or reference...", btnAdd: "Add Clinic Manually", btnAddUser: "Generate User Invite",
            totClinics: "Active Clinics", totSusp: "Suspended Clinics", totPatients: "Total Patients",
            thDate: "Sub Date", thNextPay: "Next Payment", thName: "Clinic / Package", thEmail: "Admin Email", thStatus: "Status", thAction: "Actions",
            loading: "Loading data...", empty: "No clinics registered yet.",
            
            // 🔴 Add Clinic
            mTitle: "Register New Clinic", lName: "Clinic / Center Name", lEmail: "Admin Email", 
            lHint: "* This account must be created later from login screen.", lPhone: "Mobile Number",
            lPkg: "Subscription Package", optPkgT7: "Trial (7 Days)", optPkgT14: "Trial (14 Days)", optPkgMonth: "Monthly", optPkgYear: "Yearly",
            lPlan: "Account Status", optAct: "Active", optSusp: "Suspended", btnSave: "Create Clinic & Generate ID",
            lLimit: "Max Users", hintLimit: "Including Admin doctor", lPrice: "Subscription Price",
            
            // 🔴 Actions & Statuses
            sAct: "Active", sSusp: "Suspended", sExpired: "Expired", 
            btnPaid: "Paid", btnCancelSub: "Suspend Acc", btnRenew: "Activate Acc", btnDelete: "Delete Clinic",
            msgSuccess: "Clinic created successfully!\n\nAccess Code: {id}\nAdmin Email: {email}\n\nPlease send code to the doctor.",
            msgError: "Error creating clinic!", msgConfirmToggle: "Are you sure you want to change the status?",
            msgConfirmPaid: "Confirm payment receipt and renew subscription?",
            msgWarnDel: "WARNING: Type '1234' to confirm permanent deletion:", msgDelSuccess: "Clinic deleted successfully.", btnSaving: "Creating...",
            
            // 🔴 Modals
            ovrTitle: "Subscription Override", ovrDiscount: "Special Discount (%)", ovrTrial: "Trial Extension (Days)", ovrBtn: "Save Financial Changes",
            mUpgTitle: "🚀 Upgrade Trial Clinic", mUpgSub: "Select package and price to generate a new access code.",
            lUpgPkg: "Subscription Package", optUpgMonth: "Monthly", optUpgYear: "Yearly",
            lUpgPrice: "Price (EGP)", lUpgLimit: "Max Users Limit", btnConfirmUpg: "Confirm Upgrade & Generate",
            mUserTitle: "Generate User Invite", mUserSub: "Select clinic and role to override and generate code.",
            lUClinic: "Select Clinic", lUName: "User Name", lURole: "Assigned Role",
            optUAdmin: "System Admin", optUDoc: "Doctor", optURec: "Receptionist", optUNur: "Nurse / Assistant", btnSubUser: "Generate Invite Code",
            modDetTitle: "Advanced Clinic Dashboard", lblDetName: "Clinic Name", lblDetCode: "Access Code", lblDetEmail: "Admin Email", lblDetPhone: "Phone",
            lblDetPkg: "Package", lblDetCreated: "Created At", lblDetLimit: "Max Users Limit", lblDetPrice: "Agreed Subscription Price:",
            txtTeamTitle: "👥 Staff & Users", thUName: "User Name", thUEmail: "Email / Code", thURole: "Role",
            thUDate: "Join Date", thUOnline: "Online?", thULast: "Last Seen", txtULoad: "Loading users...",

            // 🔴 Tabs
            tabActive: "🏢 Active Clinics", tabTrials: "🚀 Free Trials", tabSupport: "🎧 Support", tabReviews: "⭐ Reviews",
            tabChat: "💬 Live Chat", tabTeam: "🛡️ Niva Team", tabPending: "⏳ Pending Requests", tabRevenue: "💰 Revenue Hub", tabAudit: "📡 Audit Trail",
            
            // 🔴 New Modules (Pending, Revenue, Audit)
            kpiPending: "Pending Payments", kpiExpired: "Expired Subs", kpiSoon: "Expiring in 3 Days", kpiActive: "Total Active Clinics", 
            kpiTrials: "Free Trials", kpiTeam: "System Admins", kpiStaff: "Clinics Staff", kpiPatients: "Total Patients",
            pendTitle: "⚡ Manual Activation", pendSub: "Review the reference number or receipt with your bank accounts, then approve to activate.",
            thReqDate: "Req Date", thReqClinic: "Clinic / Email", thReqPkg: "Package & Amount", thReqRef: "Ref Number / Receipt", thReqAction: "Actions",
            revMRR: "Monthly Recurring Revenue (MRR)", revTotal: "Total Collected Revenue", revChart: "📈 Revenue Growth Index", revTable: "🧾 Recent Transactions",
            thRevDate: "Date", thRevClinic: "Clinic", thRevPkg: "Package", thRevAmt: "Amount Paid", thRevMethod: "Payment Method", thRevStatus: "Status",
            auditTitle: "📡 Live System Radar", auditSub: "Detailed log of every system action (Registration, Payment, Activation).",
            
            // 🔴 System Health & Broadcast
            noSupport: "No support tickets found.", noReviews: "No reviews yet.", btnReply: "Reply & Close", msgReplySent: "Reply sent and ticket closed successfully.",
            sysHealthTitle: "System Health", sysHealthDb: "Database Status", sysHealthUsage: "Usage Indicator",
            annTitle: "📢 Global Announcements", annSub: "Send instant notification to clinics on the system (appears in their bell).",
            annBtn: "🚀 Send Now", chatWith: "Chat with:", chatPlaceholder: "Type your message here...", chatSend: "Send 🚀",
            teamAddTitle: "Add New Admin", teamEmail: "Email (Gmail)", teamRole: "Role (Permission)", teamAddBtn: "Add Member",
            roleSales: "Sales (View Only)", roleSupport: "Support (Tech Support)",
            
            // 🔴 Packages 🔴
            pkgStart: "Trial (7 Days)", pkgPro: "Monthly (Clinic Pro)", pkgGrowth: "Quarterly (Growth)", pkgElite: "Yearly (Elite)", pkgLife: "Lifetime Partner",
            msgPkgChanged: "✅ Package changed and limits updated successfully!", msgPkgErr: "❌ Error changing package", btnPkgChange: "Change Package",
            lblSelectPkg: "Select New Package", btnSavePkg: "Save & Activate 🚀",
            toastNewReq: "New Payment Request!", toastNewReqSub: "New attachment received from:",
            msgApprove: "Confirm payment receipt and activate clinic?", msgReject: "Are you sure you want to reject this request?",
            actSuccess: "Clinic activated successfully!", actError: "Activation Error."
        }
    };
    const c = t[lang] || t.ar;
    window.superLang = c; // حفظ الترجمة عالمياً عشان باقي الدوال تقرأ منها
    const setTxt = (id, txt) => { if(document.getElementById(id)) document.getElementById(id).innerText = txt; };

    // 🔴 ترجمة العناوين والأزرار القديمة
    setTxt('txt-title', c.title); setTxt('txt-subtitle', c.sub); 
    if(document.getElementById('searchInput')) document.getElementById('searchInput').placeholder = c.search;
    setTxt('btn-add-clinic', c.btnAdd); setTxt('btn-add-user', c.btnAddUser);
    
    setTxt('th-date', c.thDate); setTxt('th-next-pay', c.thNextPay); setTxt('th-name', c.thName); setTxt('th-email', c.thEmail); setTxt('th-status', c.thStatus); setTxt('th-action', c.thAction);
    if(document.getElementById('txt-loading')) setTxt('txt-loading', c.loading);
    
    setTxt('mod-title', c.mTitle); setTxt('lbl-c-name', c.lName); setTxt('lbl-c-email', c.lEmail); setTxt('lbl-c-hint', c.lHint); setTxt('lbl-c-phone', c.lPhone); 
    setTxt('lbl-c-pkg', c.lPkg); setTxt('opt-pkg-t7', c.optPkgT7); setTxt('opt-pkg-t14', c.optPkgT14); setTxt('opt-pkg-month', c.optPkgMonth); setTxt('opt-pkg-year', c.optPkgYear);
    setTxt('lbl-c-plan', c.lPlan); setTxt('opt-active', c.optAct); setTxt('opt-susp', c.optSusp); setTxt('btn-save', c.btnSave);
    setTxt('lbl-c-limit', c.lLimit); setTxt('hint-c-limit', c.hintLimit); setTxt('lbl-c-price', c.lPrice);
    
    setTxt('mod-upgrade-title', c.mUpgTitle); setTxt('mod-upgrade-sub', c.mUpgSub);
    setTxt('lbl-upg-pkg', c.lUpgPkg); setTxt('opt-upg-month', c.optUpgMonth); setTxt('opt-upg-year', c.optUpgYear);
    setTxt('lbl-upg-price', c.lUpgPrice); setTxt('lbl-upg-limit', c.lUpgLimit); setTxt('btn-confirm-upgrade', c.btnConfirmUpg);
    
    setTxt('mod-user-title', c.mUserTitle); setTxt('mod-user-sub', c.mUserSub);
    setTxt('lbl-u-clinic', c.lUClinic); setTxt('lbl-u-name', c.lUName); setTxt('lbl-u-role', c.lURole);
    setTxt('opt-u-admin', c.optUAdmin); setTxt('opt-u-doc', c.optUDoc); setTxt('opt-u-rec', c.optURec); setTxt('opt-u-nur', c.optUNur); setTxt('btn-submit-user', c.btnSubUser);

    setTxt('mod-det-title', c.modDetTitle); setTxt('lbl-det-name', c.lblDetName); setTxt('lbl-det-code', c.lblDetCode); setTxt('lbl-det-email', c.lblDetEmail); setTxt('lbl-det-phone', c.lblDetPhone);
    setTxt('lbl-det-pkg', c.lblDetPkg); setTxt('lbl-det-created', c.lblDetCreated); setTxt('lbl-det-limit', c.lblDetLimit); setTxt('lbl-det-price', c.lblDetPrice);
    setTxt('txt-team-title', c.txtTeamTitle); setTxt('th-u-name', c.thUName); setTxt('th-u-email', c.thUEmail); setTxt('th-u-role', c.thURole);
    setTxt('th-u-date', c.thUDate); setTxt('th-u-online', c.thUOnline); setTxt('th-u-last', c.thULast);
    if(document.getElementById('txt-u-load')) setTxt('txt-u-load', c.txtULoad);

    // 🔴 ترجمة التابات
    if(document.getElementById('tab-active')) document.getElementById('tab-active').innerHTML = c.tabActive;
    if(document.getElementById('tab-trials')) document.getElementById('tab-trials').innerHTML = c.tabTrials;
    const supBadge = document.getElementById('badge-support');
    if(document.getElementById('tab-support')) document.getElementById('tab-support').innerHTML = c.tabSupport + (supBadge ? supBadge.outerHTML : '');
    if(document.getElementById('tab-reviews')) document.getElementById('tab-reviews').innerHTML = c.tabReviews;
    if(document.getElementById('tab-chat')) document.getElementById('tab-chat').innerHTML = c.tabChat;
    if(document.getElementById('tab-team')) document.getElementById('tab-team').innerHTML = c.tabTeam;
    const pendBadge = document.getElementById('badge-pending');
    if(document.getElementById('tab-pending')) document.getElementById('tab-pending').innerHTML = c.tabPending + (pendBadge ? pendBadge.outerHTML : '');
    if(document.getElementById('tab-revenue')) document.getElementById('tab-revenue').innerText = c.tabRevenue;
    if(document.getElementById('tab-audit')) document.getElementById('tab-audit').innerText = c.tabAudit;

    // 🔴 ترجمة الكروت الجديدة الذكية (KPIs)
    const kpiHeaders = document.querySelectorAll('.kpi-card h4');
    if(kpiHeaders.length >= 8) {
        kpiHeaders[0].innerText = c.kpiPending;
        kpiHeaders[1].innerText = c.kpiExpired;
        kpiHeaders[2].innerText = c.kpiSoon;
        kpiHeaders[3].innerText = c.kpiActive;
        kpiHeaders[4].innerText = c.kpiTrials;
        kpiHeaders[5].innerText = c.kpiTeam;
        kpiHeaders[6].innerText = c.kpiStaff;
        kpiHeaders[7].innerText = c.kpiPatients;
    }

    // 🔴 ترجمة شاشة الطلبات المعلقة
    const pendTitleEl = document.querySelector('#view-pending h3');
    if(pendTitleEl) pendTitleEl.innerText = c.pendTitle;
    const pendSubEl = document.querySelector('#view-pending p');
    if(pendSubEl) pendSubEl.innerText = c.pendSub;
    const pendTh = document.querySelectorAll('#pendingPaymentsTable th');
    if(pendTh.length >= 5) {
        pendTh[0].innerText = c.thReqDate; pendTh[1].innerText = c.thReqClinic; pendTh[2].innerText = c.thReqPkg;
        pendTh[3].innerText = c.thReqRef; pendTh[4].innerText = c.thReqAction;
    }

    // 🔴 ترجمة شاشة المركز المالي
    const revMrrEl = document.querySelector('#view-revenue .stat-card:nth-child(1) h3');
    if(revMrrEl) revMrrEl.innerText = c.revMRR;
    const revTotEl = document.querySelector('#view-revenue .stat-card:nth-child(2) h3');
    if(revTotEl) revTotEl.innerText = c.revTotal;
    const revChartEl = document.querySelector('#view-revenue > .stat-card:nth-of-type(2) h3');
    if(revChartEl) revChartEl.innerText = c.revChart;
    const revTableTitle = document.querySelector('#view-revenue > h3');
    if(revTableTitle) revTableTitle.innerText = c.revTable;
    
    const revTh = document.querySelectorAll('#transactionsTable th');
    if(revTh.length >= 6) {
        revTh[0].innerText = c.thRevDate; revTh[1].innerText = c.thRevClinic; revTh[2].innerText = c.thRevPkg;
        revTh[3].innerText = c.thRevAmt; revTh[4].innerText = c.thRevMethod; revTh[5].innerText = c.thRevStatus;
    }

    // 🔴 ترجمة شاشة الرادار
    const auditTitleEl = document.querySelector('#view-audit h3');
    if(auditTitleEl) auditTitleEl.innerText = c.auditTitle;
    const auditSubEl = document.querySelector('#view-audit p');
    if(auditSubEl) auditSubEl.innerText = c.auditSub;

    // 🔴 ترجمة التنبيهات وصحة السيرفر
    setTxt('lbl-c-pat-limit', lang === 'ar' ? 'سعة المرضى' : 'Patients Limit');
    setTxt('lbl-c-wa-limit', lang === 'ar' ? 'رصيد الواتس' : 'WhatsApp Balance');
    setTxt('lbl-det-pat-limit', lang === 'ar' ? 'سعة المرضى بالباقة' : 'Plan Patients Limit');
    setTxt('lbl-det-wa-limit', lang === 'ar' ? 'رصيد رسائل الواتساب' : 'WhatsApp Messages Limit');
    setTxt('mod-ovr-title', c.ovrTitle); setTxt('lbl-ovr-discount', c.ovrDiscount); setTxt('lbl-ovr-trial', c.ovrTrial); setTxt('btn-save-override', c.ovrBtn);

    const sysTitleEl = document.querySelector('.stat-card h3 span');
    if(sysTitleEl && sysTitleEl.parentElement) {
        sysTitleEl.parentElement.innerHTML = `<span style="animation: blink 2s infinite;">⚡</span> ${c.sysHealthTitle}`;
    }
    const sysLabels = document.querySelectorAll('#sys-status-text, #sys-load-text');
    if(sysLabels.length === 2) {
        if(sysLabels[0].previousElementSibling && sysLabels[0].previousElementSibling.tagName === 'SPAN') sysLabels[0].previousElementSibling.innerText = c.sysHealthDb;
        if(sysLabels[1].previousElementSibling && sysLabels[1].previousElementSibling.tagName === 'SPAN') sysLabels[1].previousElementSibling.innerText = c.sysHealthUsage;
    }

    const annH3 = document.querySelector('h3:has(+ p)');
    if(annH3) {
        annH3.innerHTML = `📢 ${c.annTitle}`;
        if(annH3.nextElementSibling) annH3.nextElementSibling.innerText = c.annSub;
    }
    const annBtn = document.querySelector('button[onclick="sendGlobalAnnouncement()"]');
    if(annBtn) annBtn.innerHTML = `${c.annBtn}`;

    const chatTitle = document.querySelector('#view-chat strong');
    if(chatTitle) chatTitle.innerText = c.chatWith;
    const chatInput = document.getElementById('chat_msg_input');
    if(chatInput) chatInput.placeholder = c.chatPlaceholder;
    const chatBtn = document.querySelector('#view-chat button');
    if(chatBtn) chatBtn.innerHTML = c.chatSend;

    const teamTitle = document.querySelector('#view-team h3');
    if(teamTitle) teamTitle.innerText = c.teamAddTitle;
    const teamLabels = document.querySelectorAll('#addNivaAdminForm label');
    if(teamLabels.length >= 2) {
        teamLabels[0].innerText = c.teamEmail;
        teamLabels[1].innerText = c.teamRole;
    }
    const teamAddBtn = document.getElementById('btn-add-niva-admin');
    if(teamAddBtn) teamAddBtn.innerText = c.teamAddBtn;
    
    const roleSelect = document.getElementById('niva_admin_role');
    if(roleSelect && roleSelect.options.length >= 2) {
        roleSelect.options[0].text = c.roleSales;
        roleSelect.options[1].text = c.roleSupport;
    }
}
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        const emailEl = document.getElementById('userEmail');
        if (emailEl) { emailEl.innerText = user.email; }
        
        try {
            const adminDoc = await db.collection("NivaAdmins").doc(user.email).get();
            if (adminDoc.exists) {
                currentNivaRole = adminDoc.data().role; 
            } else if (user.email === 'eslamhany71@gmail.com') { // حساب المالك الأساسي
                currentNivaRole = 'owner'; 
            } else {
                currentNivaRole = 'sales'; 
            }
        } catch(e) { console.error("Error reading admin role", e); }

        loadClinics();
        loadGlobalStats(); 
        loadSupportTickets();
        loadSystemReviews();
        loadNivaTeam(); 
        loadPendingPayments();
        loadTransactions();
        loadAuditTrail();
        
    } else {
        window.location.href = "index.html";
    }
});

// المتغيرات الجديدة الخاصة بالمركز المالي والطلبات
let isInitialPendingLoad = true;
let revChartInstance = null;

// دالة التابات المحدثة لتدعم الشاشات الجديدة
function switchMainTab(tabName) {
    currentActiveTab = tabName;
    document.querySelectorAll('.sa-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.main-view-container').forEach(v => v.style.display = 'none');
    
    if (tabName === 'active' || tabName === 'trials') {
        const tabEl = document.getElementById(`tab-${tabName}`);
        if(tabEl) tabEl.classList.add('active');
        document.getElementById('view-clinics').style.display = 'block';
        renderClinicsTable(); 
    } 
    else {
        const targetTab = document.getElementById(`tab-${tabName}`);
        const targetView = document.getElementById(`view-${tabName}`);
        if(targetTab) targetTab.classList.add('active');
        if(targetView) targetView.style.display = 'block';
    }
}

function switchClinicDetTab(tabName) {
    document.getElementById('cdet-info').style.display = 'none';
    document.getElementById('cdet-features').style.display = 'none';
    document.getElementById('cdet-security').style.display = 'none';
    
    document.getElementById('tab-det-info').classList.remove('active');
    document.getElementById('tab-det-features').classList.remove('active');
    document.getElementById('tab-det-security').classList.remove('active');
    
    document.getElementById('cdet-' + tabName).style.display = 'block';
    document.getElementById('tab-det-' + tabName).classList.add('active');
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function loadSupportTickets() {
    db.collection("SupportTickets").orderBy("timestamp", "desc").onSnapshot(snap => {
        const tbody = document.getElementById('supportBody');
        if(!tbody) return;
        tbody.innerHTML = '';
        let openCount = 0;
        const lang = localStorage.getItem('preferredLang') || 'ar';
        const isAr = lang === 'ar';

        if (snap.empty) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b;">${window.superLang.noSupport || 'لا توجد تذاكر دعم فني.'}</td></tr>`;
            document.getElementById('badge-support').style.display = 'none';
            return;
        }

        snap.forEach(doc => {
            const ticket = doc.data();
            if (ticket.status === 'open') openCount++;

            let statusHtml = ticket.status === 'open' 
                ? `<span class="support-status support-open">${isAr ? 'مفتوحة (قيد الانتظار)' : 'Open'}</span>`
                : `<span class="support-status support-closed">${isAr ? 'مغلقة (تم الرد)' : 'Closed'}</span>`;

            let dateStr = '---';
            if (ticket.timestamp) {
                const d = typeof ticket.timestamp.toDate === 'function' ? ticket.timestamp.toDate() : new Date(ticket.timestamp);
                dateStr = `<span dir="ltr">${d.toLocaleDateString(isAr?'ar-EG':'en-US')} ${d.toLocaleTimeString(isAr?'ar-EG':'en-US', {hour:'2-digit', minute:'2-digit'})}</span>`;
            }

            let actionBtn = ticket.status === 'open' 
                ? `<button class="btn-primary" style="background:#0ea5e9; border:none; padding:5px 10px; border-radius:5px;" onclick='openReplyTicketModal("${doc.id}", ${JSON.stringify(ticket).replace(/'/g, "&#39;")})'>✉️ ${window.superLang.btnReply || 'رد'}</button>`
                : `<button class="btn-action" style="background:#f1f5f9; color:#94a3b8; border:1px solid #e2e8f0; cursor:not-allowed;" disabled>✔️ تمت</button>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-size: 13px; color: #475569;">${dateStr}</td>
                <td>
                    <strong style="color: #0f172a;">🏢 ${ticket.clinicName || '---'}</strong><br>
                    <small style="color: #64748b;" dir="ltr">${ticket.userEmail || '---'}</small>
                </td>
                <td style="max-width: 300px; white-space: normal; line-height: 1.5;">${ticket.message || '---'}</td>
                <td>${statusHtml}</td>
                <td style="text-align: center;">${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });

        const badge = document.getElementById('badge-support');
        if(badge) {
            if (openCount > 0) {
                badge.innerText = openCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    });
}

function openReplyTicketModal(id, ticket) {
    document.getElementById('reply_ticket_id').value = id;
    document.getElementById('reply_clinic_id').value = ticket.clinicId;
    document.getElementById('ticket_reply_text').value = '';

    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    let dateStr = '---';
    if (ticket.timestamp && ticket.timestamp.seconds) {
        const d = new Date(ticket.timestamp.seconds * 1000);
        dateStr = `<span dir="ltr">${d.toLocaleDateString(isAr?'ar-EG':'en-US')} ${d.toLocaleTimeString(isAr?'ar-EG':'en-US', {hour:'2-digit', minute:'2-digit'})}</span>`;
    }

    document.getElementById('ticket-info-display').innerHTML = `
        <strong>العيادة:</strong> ${ticket.clinicName}<br>
        <strong>الرسالة الأصلية:</strong> <br> <span style="color:#0f172a; display:block; padding:10px; background:white; border-radius:6px; margin-top:5px; border:1px solid #cbd5e1;">${ticket.message}</span>
    `;

    openModal('replyTicketModal');
}

async function submitTicketReply(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.innerText = "...";

    const ticketId = document.getElementById('reply_ticket_id').value;
    const clinicId = document.getElementById('reply_clinic_id').value;
    const replyText = document.getElementById('ticket_reply_text').value.trim();

    try {
        await db.collection("SupportTickets").doc(ticketId).update({
            status: 'closed',
            reply: replyText,
            repliedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection("Notifications").add({
            clinicId: clinicId,
            branchId: 'main', 
            title: "رد على طلب الدعم الفني",
            message: replyText,
            type: "system",
            isRead: false,
            createdAt: new Date().toISOString()
        });

        alert(window.superLang.msgReplySent || "تم الرد وإغلاق التذكرة بنجاح.");
        closeModal('replyTicketModal');
    } catch (err) {
        console.error(err);
        alert("حدث خطأ أثناء الرد.");
    } finally {
        btn.disabled = false; btn.innerText = window.superLang.btnReply || "إرسال الرد وإغلاق التيكت";
    }
}

function loadSystemReviews() {
    db.collection("SystemReviews").orderBy("createdAt", "desc").onSnapshot(snap => {
        const container = document.getElementById('reviewsContainer');
        if(!container) return;
        container.innerHTML = '';
        
        if (snap.empty) {
            container.innerHTML = `<div style="text-align: center; padding: 20px; color: #64748b; grid-column: 1/-1;">${window.superLang.noReviews || 'لا توجد تقييمات حتى الآن.'}</div>`;
            return;
        }

        snap.forEach(doc => {
            const r = doc.data();
            let starsHtml = '⭐'.repeat(r.rating || 5);
            
            let dateStr = '---';
            if (r.createdAt) {
                const d = typeof r.createdAt.toDate === 'function' ? r.createdAt.toDate() : new Date(r.createdAt);
                dateStr = d.toLocaleDateString();
            }

            container.innerHTML += `
                <div class="review-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span class="stars">${starsHtml}</span>
                        <span style="color: #94a3b8; font-size: 12px;">${dateStr}</span>
                    </div>
                    <p style="margin: 0 0 10px 0; font-size: 15px; line-height: 1.5;">"${r.comment || 'بدون تعليق'}"</p>
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; align-items: center; gap: 10px;">
                        <div style="width: 30px; height: 30px; background: #e0f2fe; color: #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">🏢</div>
                        <div style="font-size: 13px; color: #475569;">
                            <strong>${r.clinicName || 'عيادة مجهولة'}</strong><br>
                            <span dir="ltr">${r.userEmail || ''}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}

async function openClinicDetailsModal(clinicId) {
    const clinic = allClinicsList.find(c => c.id === clinicId);
    if (!clinic) return;

    const lang = localStorage.getItem('preferredLang') || 'ar';
    const isAr = lang === 'ar';
    const cLang = window.superLang;

    // 🔴 استخدام الترجمة الذكية للباقات
    let pkgLabel = '';
    if(clinic.package === 'trial_7') pkgLabel = cLang.pkgStart || 'Trial 7 Days';
    else if(clinic.package === 'quarterly') pkgLabel = cLang.pkgGrowth || 'Quarterly';
    else if(clinic.package === 'yearly') pkgLabel = cLang.pkgElite || 'Yearly';
    else if(clinic.package === 'lifetime') pkgLabel = cLang.pkgLife || 'Lifetime';
    else pkgLabel = cLang.pkgPro || 'Monthly';

    const detPhone = document.getElementById('det-clinic-phone');
    let phoneFound = clinic.phone1 || clinic.adminPhone || null;
    if (detPhone) detPhone.innerText = phoneFound || '---';

    let clinicCreatedStr = '---';
    if (clinic.createdAt) {
        const cd = typeof clinic.createdAt.toDate === 'function' ? clinic.createdAt.toDate() : new Date(clinic.createdAt);
        clinicCreatedStr = cd.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
    }

    document.getElementById('det-clinic-name').innerText = clinic.clinicName;
    document.getElementById('det-clinic-code').innerText = clinic.accessCode || '---';
    document.getElementById('det-clinic-email').innerText = clinic.adminEmail || '---';
    document.getElementById('det-clinic-pkg').innerText = pkgLabel;
    
    const detCreated = document.getElementById('det-clinic-created');
    if (detCreated) detCreated.innerText = clinicCreatedStr;

    const priceDisplay = document.getElementById('det-clinic-price');
    if (priceDisplay) priceDisplay.innerText = clinic.subPrice || 0;
    
    const limitDisplay = document.getElementById('det-clinic-limit');
    if (limitDisplay) limitDisplay.innerText = clinic.maxUsers || 1;

    const patLimitDisplay = document.getElementById('det-clinic-pat-limit');
    if (patLimitDisplay) patLimitDisplay.innerText = clinic.maxPatients || 500; 
    
    const waLimitDisplay = document.getElementById('det-clinic-wa-limit');
    if (waLimitDisplay) waLimitDisplay.innerText = clinic.maxWhatsapp || 100; 
    
    const hiddenId = document.getElementById('current-det-clinic-id');
    if (hiddenId) hiddenId.value = clinic.id;

    const f = clinic.features || {};
    const getF = (val) => val === undefined ? true : val;

    document.getElementById('feat_patients').checked = getF(f.patients);
    document.getElementById('feat_appointments').checked = getF(f.appointments);
    document.getElementById('feat_services').checked = getF(f.services);
    document.getElementById('feat_contracts').checked = getF(f.contracts);
    document.getElementById('feat_invoices').checked = getF(f.invoices);
    document.getElementById('feat_accounts').checked = getF(f.accounts);
    document.getElementById('feat_inventory').checked = getF(f.inventory);
    document.getElementById('feat_reports').checked = getF(f.reports);
    document.getElementById('feat_branches').checked = getF(f.branches);
    document.getElementById('feat_hr').checked = getF(f.hr);
    document.getElementById('feat_notifications').checked = getF(f.notifications);
    document.getElementById('feat_portal').checked = getF(f.portal);
    document.getElementById('feat_settings').checked = getF(f.settings);
    document.getElementById('feat_support').checked = getF(f.support);

    switchClinicDetTab('info');

    document.getElementById('clinicDetailsModal').style.display = 'flex';
    
    const tbody = document.getElementById('det-users-body');
    const secTbody = document.getElementById('det-security-body');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">${isAr ? 'جاري تجميع بيانات المستخدمين...' : 'Fetching users...'}</td></tr>`;
    if(secTbody) secTbody.innerHTML = `<tr><td colspan="3" style="text-align: center;">${isAr ? 'جاري تجميع البيانات الأمنية...' : 'Fetching security data...'}</td></tr>`;

    try {
        const [adminCodesSnap, invitesSnap] = await Promise.all([
            db.collection("clinicId").where("clinicId", "==", clinicId).get(),
            db.collection("InviteCodes").where("clinicId", "==", clinicId).get()
        ]);

        let pendingUsers = [];
        let fallbackDate = clinic.createdAt ? (typeof clinic.createdAt.toDate === 'function' ? clinic.createdAt.toDate() : new Date(clinic.createdAt)) : new Date(0);

        adminCodesSnap.forEach(doc => {
            const a = doc.data();
            if (!a.activated) {
                pendingUsers.push({ 
                    name: isAr ? 'مدير العيادة (الأدمن)' : 'Clinic Admin', identifier: `${isAr ? 'كود التفعيل' : 'Code'}: ${doc.id}`, 
                    role: 'admin', status: 'pending', isOnline: false, lastLogin: null, createdAt: fallbackDate 
                });
            }
        });
        
        invitesSnap.forEach(doc => {
            const inv = doc.data();
            if (!inv.activated) {
                let invDate = inv.createdAt ? (typeof inv.createdAt.toDate === 'function' ? inv.createdAt.toDate() : new Date(inv.createdAt)) : fallbackDate;
                pendingUsers.push({ 
                    name: inv.name || (isAr ? 'موظف مجهول' : 'Unknown Staff'), identifier: `${isAr ? 'كود الدعوة' : 'Invite'}: ${doc.id}`, 
                    role: inv.role, status: 'pending', isOnline: false, lastLogin: null, createdAt: invDate 
                });
            }
        });

        if (clinicUsersUnsubscribe) { clinicUsersUnsubscribe(); }

        clinicUsersUnsubscribe = db.collection("Users").where("clinicId", "==", clinicId)
            .onSnapshot(usersSnap => {
                let staffList = [...pendingUsers]; 

                usersSnap.forEach(doc => {
                    const u = doc.data();
                    let uDate = u.createdAt ? (typeof u.createdAt.toDate === 'function' ? u.createdAt.toDate() : new Date(u.createdAt)) : fallbackDate;
                    staffList.push({ 
                        name: u.name || '---', identifier: u.email || doc.id, 
                        role: u.role, status: u.status || 'active', 
                        isOnline: u.isOnline || false, lastLogin: u.lastLogin || null, createdAt: uDate 
                    });
                });

                staffList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

                tbody.innerHTML = '';
                if(secTbody) secTbody.innerHTML = '';
                
                if (staffList.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">${isAr ? 'لا يوجد مستخدمين.' : 'No users found.'}</td></tr>`;
                    if(secTbody) secTbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #64748b;">${isAr ? 'لا يوجد مستخدمين.' : 'No users found.'}</td></tr>`;
                } else {
                    staffList.forEach(u => {
                        let roleAr = u.role === 'admin' ? (isAr ? 'أدمن (مدير)' : 'Admin') : (u.role === 'nurse' ? (isAr ? 'ممرضة' : 'Nurse') : (u.role === 'receptionist' ? (isAr ? 'استقبال' : 'Reception') : (u.role === 'doctor' ? (isAr ? 'طبيب' : 'Doctor') : u.role)));
                        let roleColor = u.role === 'admin' ? '#dc2626' : (u.role === 'doctor' ? '#0284c7' : '#d97706');
                        let roleBg = u.role === 'admin' ? '#fee2e2' : (u.role === 'doctor' ? '#e0f2fe' : '#fef3c7');
                        
                        let identHtml = u.status === 'pending' ? `<strong style="color: #dc2626;">${u.identifier}</strong>` : `<span dir="ltr">${u.identifier}</span>`;
                        let onlineHtml = ''; let lastSeenHtml = '---';

                        if (u.status === 'pending') {
                            onlineHtml = `<span style="color:#d97706; font-size:12px;">⏳ ${isAr ? 'لم يفعل' : 'Pending'}</span>`;
                        } else {
                            if (u.isOnline) {
                                onlineHtml = `<span class="status-online">${isAr ? 'أونلاين' : 'Online'}</span>`;
                                lastSeenHtml = `<span style="color:#10b981; font-weight:bold;">${isAr ? 'الآن' : 'Now'}</span>`;
                            } else {
                                onlineHtml = `<span style="color:#94a3b8; font-size:20px;" title="${isAr ? 'أوفلاين' : 'Offline'}">💤</span>`;
                                if (u.lastLogin) {
                                    try {
                                        const d = typeof u.lastLogin.toDate === 'function' ? u.lastLogin.toDate() : new Date(u.lastLogin);
                                        lastSeenHtml = `<span class="status-offline" dir="ltr">${d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')} ${d.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {hour:'2-digit', minute:'2-digit'})}</span>`;
                                    } catch(e) { lastSeenHtml = '---'; }
                                } else { lastSeenHtml = `<span class="status-offline">${isAr ? 'لم يسجل دخول' : 'Never'}</span>`; }
                            }
                        }

                        let joinDateHtml = '---';
                        if (u.createdAt.getTime() !== 0) joinDateHtml = `<span dir="ltr" style="color: #475569; font-size: 13px;">${u.createdAt.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>`;

                        tbody.innerHTML += `<tr>
                            <td style="font-weight: bold; color: #334155;">${u.name}</td>
                            <td style="text-align: right;">${identHtml}</td>
                            <td><span style="background: ${roleBg}; color: ${roleColor}; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: bold;">${roleAr}</span></td>
                            <td style="text-align: center;">${joinDateHtml}</td>
                            <td style="text-align: center;">${onlineHtml}</td>
                            <td>${lastSeenHtml}</td>
                        </tr>`;

                        if (secTbody) {
                            let isRealEmail = u.identifier.includes('@');
                            let secStatusHtml = u.status === 'suspended' ? `<span style="color:#ef4444; font-weight:bold; background:#fee2e2; padding:4px 8px; border-radius:4px;">${isAr ? 'موقوف 🚫' : 'Suspended 🚫'}</span>` : 
                                               (u.status === 'pending' ? `<span style="color:#d97706; font-weight:bold;">${isAr ? 'معلق ⏳' : 'Pending ⏳'}</span>` : `<span style="color:#10b981; font-weight:bold;">${isAr ? 'نشط ✅' : 'Active ✅'}</span>`);
                            
                            let resetBtn = isRealEmail ? `<button onclick="sendUserPasswordReset('${u.identifier}')" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold;" title="إرسال رابط لتغيير الباسوورد">🔑 ${isAr ? 'باسوورد' : 'Reset Pass'}</button>` : '';
                            let suspendBtn = '';
                            if (isRealEmail && u.role !== 'admin') { 
                                if (u.status === 'suspended') {
                                    suspendBtn = `<button onclick="toggleUserAccountStatus('${u.identifier}', 'active')" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">▶️ ${isAr ? 'تفعيل' : 'Activate'}</button>`;
                                } else {
                                    suspendBtn = `<button onclick="toggleUserAccountStatus('${u.identifier}', 'suspended')" style="background:#f59e0b; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">⏸️ ${isAr ? 'إيقاف' : 'Suspend'}</button>`;
                                }
                            }
                            let forceLogoutBtn = (isRealEmail && u.isOnline) ? `<button onclick="forceUserLogout('${u.identifier}')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold;" title="طرد من النظام حالاً">🚪 ${isAr ? 'طرد' : 'Kick'}</button>` : `<button style="background:#cbd5e1; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:not-allowed;" disabled>🚪 ${isAr ? 'أوفلاين' : 'Offline'}</button>`;

                            secTbody.innerHTML += `<tr>
                                <td><strong style="color:#334155; font-size:15px;">${u.name}</strong><br><small dir="ltr" style="color:#64748b;">${u.identifier}</small></td>
                                <td style="text-align: center;">${secStatusHtml}</td>
                                <td style="text-align: center; display: flex; gap: 8px; justify-content: center;">
                                    ${resetBtn}
                                    ${suspendBtn}
                                    ${forceLogoutBtn}
                                </td>
                            </tr>`;
                        }
                    });
                }
            });

    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">${isAr ? 'حدث خطأ في تحميل البيانات.' : 'Error loading data.'}</td></tr>`;
    }

    const overrideBtn = document.getElementById('btn-override-clinic');
    const impersonateBtn = document.getElementById('btn-impersonate-clinic');

    if (currentNivaRole !== 'owner') {
        if (overrideBtn) overrideBtn.style.display = 'none';
        if (impersonateBtn) impersonateBtn.style.display = 'none';
    } else {
        if (overrideBtn) overrideBtn.style.display = 'flex';
        if (impersonateBtn) impersonateBtn.style.display = 'flex';
    }
}

async function editClinicPatientsLimit() {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const currentLimit = document.getElementById('det-clinic-pat-limit').innerText;
    const clinicId = document.getElementById('current-det-clinic-id').value;
    if (!clinicId) return;

    let newLimit = prompt(isAr ? "أدخل سعة المرضى القصوى الجديدة:" : "Enter new max patients limit:", currentLimit);
    if (newLimit !== null && newLimit.trim() !== "") {
        const numLimit = Number(newLimit);
        if (!isNaN(numLimit) && numLimit >= 1) {
            if (window.showLoader) window.showLoader(isAr ? "جاري التحديث..." : "Updating limit...");
            try {
                await db.collection("Clinics").doc(clinicId).update({ maxPatients: numLimit });
                document.getElementById('det-clinic-pat-limit').innerText = numLimit;
            } catch (err) {
                console.error(err);
                alert(isAr ? "حدث خطأ أثناء التحديث" : "Error updating limit");
            } finally {
                if (window.hideLoader) window.hideLoader();
            }
        } else {
            alert(isAr ? "برجاء إدخال رقم صحيح أكبر من 0." : "Please enter a valid number.");
        }
    }
}

async function editClinicWhatsappLimit() {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const currentLimit = document.getElementById('det-clinic-wa-limit').innerText;
    const clinicId = document.getElementById('current-det-clinic-id').value;
    if (!clinicId) return;

    let newLimit = prompt(isAr ? "أدخل رصيد رسائل الواتساب الجديد:" : "Enter new WhatsApp limit:", currentLimit);
    if (newLimit !== null && newLimit.trim() !== "") {
        const numLimit = Number(newLimit);
        if (!isNaN(numLimit) && numLimit >= 0) {
            if (window.showLoader) window.showLoader(isAr ? "جاري التحديث..." : "Updating limit...");
            try {
                await db.collection("Clinics").doc(clinicId).update({ maxWhatsapp: numLimit });
                document.getElementById('det-clinic-wa-limit').innerText = numLimit;
            } catch (err) {
                console.error(err);
                alert(isAr ? "حدث خطأ أثناء التحديث" : "Error updating limit");
            } finally {
                if (window.hideLoader) window.hideLoader();
            }
        } else {
            alert(isAr ? "برجاء إدخال رقم صحيح." : "Please enter a valid number.");
        }
    }
}

async function saveClinicFeatures() {
    const clinicId = document.getElementById('current-det-clinic-id').value;
    if(!clinicId) return;
    
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    if (window.showLoader) window.showLoader(isAr ? "جاري تطبيق الصلاحيات..." : "Saving features...");
    
    const updatedFeatures = {
        patients: document.getElementById('feat_patients').checked,
        appointments: document.getElementById('feat_appointments').checked,
        services: document.getElementById('feat_services').checked,
        contracts: document.getElementById('feat_contracts').checked,
        invoices: document.getElementById('feat_invoices').checked,
        accounts: document.getElementById('feat_accounts').checked,
        inventory: document.getElementById('feat_inventory').checked,
        reports: document.getElementById('feat_reports').checked,
        branches: document.getElementById('feat_branches').checked,
        hr: document.getElementById('feat_hr').checked,
        notifications: document.getElementById('feat_notifications').checked,
        portal: document.getElementById('feat_portal').checked,
        settings: document.getElementById('feat_settings').checked,
        support: document.getElementById('feat_support').checked
    };

    try {
        await db.collection("Clinics").doc(clinicId).update({ 
            features: updatedFeatures,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(isAr ? "✅ تم حفظ وتحديث صلاحيات العيادة بنجاح!" : "✅ Features updated successfully!");
    } catch(e) {
        console.error(e);
        alert(isAr ? "حدث خطأ أثناء الحفظ" : "Error saving features");
    } finally {
        if (window.hideLoader) window.hideLoader();
    }
}

async function editClinicPrice() {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const currentPriceStr = document.getElementById('det-clinic-price').innerText;
    const clinicId = document.getElementById('current-det-clinic-id').value;
    if (!clinicId) return;

    let newPrice = prompt(isAr ? "أدخل قيمة الاشتراك الجديدة (ج.م):" : "Enter new subscription price (EGP):", currentPriceStr);
    if (newPrice !== null && newPrice.trim() !== "") {
        const numPrice = Number(newPrice);
        if (!isNaN(numPrice) && numPrice >= 0) {
            if (window.showLoader) window.showLoader(isAr ? "جاري التحديث..." : "Updating price...");
            try {
                await db.collection("Clinics").doc(clinicId).update({ subPrice: numPrice });
                document.getElementById('det-clinic-price').innerText = numPrice;
            } catch (err) {
                console.error(err);
                alert(isAr ? "حدث خطأ أثناء التحديث" : "Error updating price");
            } finally {
                if (window.hideLoader) window.hideLoader();
            }
        } else {
            alert(isAr ? "برجاء إدخال رقم صحيح." : "Please enter a valid number.");
        }
    }
}

async function editClinicUsersLimit() {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const currentLimit = document.getElementById('det-clinic-limit').innerText;
    const clinicId = document.getElementById('current-det-clinic-id').value;
    if (!clinicId) return;

    let newLimit = prompt(isAr ? "أدخل الحد الأقصى الجديد للمستخدمين (شاملاً المدير):" : "Enter new max users limit (including admin):", currentLimit);
    if (newLimit !== null && newLimit.trim() !== "") {
        const numLimit = Number(newLimit);
        if (!isNaN(numLimit) && numLimit >= 1) {
            if (window.showLoader) window.showLoader(isAr ? "جاري تحديث الصلاحيات..." : "Updating limit...");
            try {
                await db.collection("Clinics").doc(clinicId).update({ maxUsers: numLimit });
                document.getElementById('det-clinic-limit').innerText = numLimit;
            } catch (err) {
                console.error(err);
                alert(isAr ? "حدث خطأ أثناء التحديث" : "Error updating limit");
            } finally {
                if (window.hideLoader) window.hideLoader();
            }
        } else {
            alert(isAr ? "برجاء إدخال رقم صحيح أكبر من 0." : "Please enter a valid number greater than 0.");
        }
    }
}

function closeClinicDetailsModal() { 
    document.getElementById('clinicDetailsModal').style.display = 'none'; 
    if (clinicUsersUnsubscribe) {
        clinicUsersUnsubscribe();
        clinicUsersUnsubscribe = null;
    }
}

function openClinicModal() {
    document.getElementById('clinicForm').reset();
    document.getElementById('clinicModal').style.display = 'flex';
}

function closeClinicModal() {
    document.getElementById('clinicModal').style.display = 'none';
}

async function openUserModal() {
    document.getElementById('userForm').reset();
    const clinicSelect = document.getElementById('user_clinic');
    const branchSelect = document.getElementById('user_branch');
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    
    clinicSelect.innerHTML = `<option value="">${isAr ? 'جاري تحميل العيادات...' : 'Loading clinics...'}</option>`;
    branchSelect.innerHTML = `<option value="main">${isAr ? 'الفرع الرئيسي' : 'Main Branch'}</option>`;
    
    document.getElementById('userModal').style.display = 'flex';

    try {
        const snap = await db.collection("Clinics").where("status", "==", "active").get();
        clinicSelect.innerHTML = `<option value="" disabled selected>${isAr ? 'اختر العيادة...' : 'Select clinic...'}</option>`;
        snap.forEach(doc => {
            const c = doc.data();
            clinicSelect.innerHTML += `<option value="${doc.id}">${c.clinicName}</option>`;
        });

        clinicSelect.onchange = async function() {
            const selectedClinicId = this.value;
            branchSelect.innerHTML = `<option value="">${isAr ? 'جاري التحميل...' : 'Loading...'}</option>`;
            try {
                const branchSnap = await db.collection("Branches").where("clinicId", "==", selectedClinicId).get();
                branchSelect.innerHTML = `<option value="main">${isAr ? 'الفرع الرئيسي' : 'Main Branch'}</option>`;
                branchSnap.forEach(bDoc => {
                    branchSelect.innerHTML += `<option value="${bDoc.id}">${bDoc.data().name}</option>`;
                });
            } catch(err) {
                console.error("Error fetching branches:", err);
                branchSelect.innerHTML = `<option value="main">${isAr ? 'الفرع الرئيسي' : 'Main Branch'}</option>`;
            }
        };

    } catch(e) {
        console.error(e);
        clinicSelect.innerHTML = `<option value="">${isAr ? 'خطأ في تحميل العيادات' : 'Error loading clinics'}</option>`;
    }
}

function closeUserModal() { document.getElementById('userModal').style.display = 'none'; }

async function saveNewUser(e) {
    e.preventDefault();
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerText = isAr ? "جاري توليد الكود..." : "Generating...";

    const userName = document.getElementById('user_name').value.trim();
    const clinicId = document.getElementById('user_clinic').value;
    const branchId = document.getElementById('user_branch').value; 
    const role = document.getElementById('user_role').value; 

    if (!clinicId) { alert(isAr ? "برجاء اختيار العيادة أولاً." : "Select clinic first."); btn.disabled = false; btn.innerText = window.superLang.btnSubUser; return; }

    if (window.showLoader) window.showLoader(isAr ? "جاري إنشاء كود الدعوة..." : "Generating invite code...");

    try {
        const inviteCode = Math.floor(10000 + Math.random() * 90000).toString();

        await db.collection("InviteCodes").doc(inviteCode).set({
            name: userName,
            role: role,
            clinicId: clinicId,
            branchId: branchId, 
            activated: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(isAr ? `✅ تم توليد كود الدعوة بنجاح!\n\nالكود: ${inviteCode}\nالاسم: ${userName}\nالوظيفة: ${role}\nالفرع: ${branchId === 'main' ? 'الرئيسي' : 'فرع إضافي'}\n\nيرجى إعطاء هذا الكود للموظف لتفعيل حسابه.` : `✅ Invite Code Generated!\n\nCode: ${inviteCode}\nName: ${userName}\nRole: ${role}`);
        closeUserModal();
    } catch (error) {
        console.error("Error generating code:", error);
        alert(isAr ? "حدث خطأ أثناء توليد الكود!" : "Error generating code!");
    } finally {
        btn.disabled = false;
        btn.innerText = window.superLang.btnSubUser;
        if (window.hideLoader) window.hideLoader();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === this) {
                if (this.id === 'clinicDetailsModal' && clinicUsersUnsubscribe) {
                    clinicUsersUnsubscribe();
                    clinicUsersUnsubscribe = null;
                }
                this.style.display = 'none';
            }
        });
    });
});

async function saveNewClinic(e) {
    e.preventDefault();
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const btn = document.getElementById('btn-save');
    btn.disabled = true; btn.innerText = window.superLang.btnSaving;

    if (window.showLoader) window.showLoader(isAr ? "جاري تجهيز مساحة العيادة على السيرفر..." : "Setting up new clinic...");

    const clinicName = document.getElementById('clinic_name').value.trim();
    const adminEmail = document.getElementById('clinic_admin_email').value.trim().toLowerCase();
    const plan = document.getElementById('clinic_plan').value; 
    const packageType = document.getElementById('clinic_package').value; 
    
    const subPriceInput = document.getElementById('clinic_sub_price');
    const subPrice = subPriceInput && subPriceInput.value ? Number(subPriceInput.value) : 0;
    
    const phoneInput = document.getElementById('clinic_phone');
    const adminPhone = phoneInput && phoneInput.value.trim() !== "" ? phoneInput.value.trim() : "01000000000";

    const maxUsersInput = document.getElementById('clinic_max_users');
    const maxUsers = maxUsersInput ? Number(maxUsersInput.value) : 3;

    const maxPatientsInput = document.getElementById('clinic_max_patients');
    const maxPatients = maxPatientsInput ? Number(maxPatientsInput.value) : 500;
    
    const maxWhatsappInput = document.getElementById('clinic_max_whatsapp');
    const maxWhatsapp = maxWhatsappInput ? Number(maxWhatsappInput.value) : 100;

    try {
        const accessCode = Math.floor(10000 + Math.random() * 90000).toString();
        const uniqueClinicId = "clinic_" + accessCode + "_" + Date.now().toString().slice(-4);

        const nextPayDate = new Date();
        if (packageType === 'monthly') { nextPayDate.setMonth(nextPayDate.getMonth() + 1); } 
        else if (packageType === 'quarterly') { nextPayDate.setMonth(nextPayDate.getMonth() + 3); } 
        else if (packageType === 'yearly') { nextPayDate.setFullYear(nextPayDate.getFullYear() + 1); } 
        else if (packageType === 'lifetime') { nextPayDate.setFullYear(nextPayDate.getFullYear() + 100); } 
        else if (packageType === 'trial_7') { nextPayDate.setDate(nextPayDate.getDate() + 7); } 
        else if (packageType === 'trial_14') { nextPayDate.setDate(nextPayDate.getDate() + 14); }

        await db.collection("Clinics").doc(uniqueClinicId).set({
            clinicName: clinicName,
            status: plan,
            package: packageType, 
            subPrice: subPrice, 
            maxUsers: maxUsers,
            maxPatients: maxPatients,
            maxWhatsapp: maxWhatsapp,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            nextPaymentDate: nextPayDate,
            logoUrl: "",
            accessCode: accessCode,
            adminEmail: adminEmail,
            adminPhone: adminPhone
        });

        await db.collection("clinicId").doc(accessCode).set({
            activated: false,
            name: clinicName,
            phone: adminPhone,
            email: adminEmail,
            role: "admin",
            clinicId: uniqueClinicId
        });

        let msg = window.superLang.msgSuccess.replace('{id}', accessCode).replace('{email}', adminEmail);
        alert(msg);
        closeClinicModal();
    } catch (error) {
        console.error("Error creating clinic:", error);
        alert(window.superLang.msgError);
    } finally {
        btn.disabled = false; btn.innerText = window.superLang.btnSave;
        if (window.hideLoader) window.hideLoader();
    }
}

function loadClinics() {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    if (window.showLoader && allClinicsList.length === 0) window.showLoader(isAr ? "جاري مزامنة بيانات النظام..." : "Syncing SaaS data...");

    db.collection("Clinics").orderBy("createdAt", "desc").onSnapshot(async (snap) => {
        allClinicsList = []; 
        let activeCount = 0;
        let trialsCount = 0;
        let expiredCount = 0;
        let expiringSoonCount = 0;
        const now = new Date();

        for (const doc of snap.docs) {
            const c = doc.data();
            c.id = doc.id;

            if (c.nextPaymentDate) {
                const npDate = typeof c.nextPaymentDate.toDate === 'function' ? c.nextPaymentDate.toDate() : new Date(c.nextPaymentDate);
                
                // تحديث الحالة التلقائي للعيادات المنتهية
                if (now > npDate && c.status !== 'expired' && c.status !== 'suspended') {
                    db.collection("Clinics").doc(c.id).update({
                        status: 'expired',
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(e => console.error("Auto-expire error:", e));
                    c.status = 'expired'; 
                }

                // حساب العيادات التي ستنتهي قريباً (أقل من 3 أيام)
                const diffDays = Math.ceil((npDate - now) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays <= 3 && c.status === 'active') {
                    expiringSoonCount++;
                }
            }

            allClinicsList.push(c); 
            
            // تجميع الإحصائيات للكروت
            if (c.status === 'active') activeCount++;
            if (c.package === 'trial_7') trialsCount++;
            if (c.status === 'expired' || c.status === 'suspended') expiredCount++;
        }
        
        // تغذية الكروت الجديدة بالأرقام بأمان
        const elActive = document.getElementById('stat-clinics');
        const elTrials = document.getElementById('stat-trials');
        const elExpired = document.getElementById('stat-expired-subs');
        const elSoon = document.getElementById('stat-expiring-soon');

        if(elActive) elActive.innerText = activeCount;
        if(elTrials) elTrials.innerText = trialsCount;
        if(elExpired) elExpired.innerText = expiredCount;
        if(elSoon) elSoon.innerText = expiringSoonCount;
        
        // تشغيل باقي الموديولات
        renderClinicsTable(); 
        updateMRRStats(); 
        updateSystemHealth(); 
        populateClinicDropdowns();
        
        if (window.hideLoader) window.hideLoader();
    }, () => {
        if (window.hideLoader) window.hideLoader();
    });
}

function populateClinicDropdowns() {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const activeClinics = allClinicsList.filter(c => c.status === 'active');
    
    // دروب داون الإذاعة
    const annDropdown = document.getElementById('global_announcement_target');
    if (annDropdown) {
        annDropdown.innerHTML = `<option value="all">🌍 ${isAr ? 'إرسال لجميع العيادات النشطة' : 'Send to all active clinics'}</option>`;
        activeClinics.forEach(c => {
            annDropdown.innerHTML += `<option value="${c.id}">🏢 ${c.clinicName}</option>`;
        });
    }

    // دروب داون الشات
    const chatDropdown = document.getElementById('chat_clinic_select');
    if (chatDropdown) {
        const currentSelected = chatDropdown.value;
        chatDropdown.innerHTML = `<option value="" disabled selected>${isAr ? 'اختر عيادة لبدء المراسلة...' : 'Select clinic to chat...'}</option>`;
        activeClinics.forEach(c => {
            chatDropdown.innerHTML += `<option value="${c.id}">🏢 ${c.clinicName}</option>`;
        });
        if (currentSelected) chatDropdown.value = currentSelected;
    }
}

function renderClinicsTable() {
    const tbody = document.getElementById('clinicsBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    const lang = localStorage.getItem('preferredLang') || 'ar';
    const isAr = lang === 'ar';
    const now = new Date();
    const cLang = window.superLang;

    const filteredClinics = allClinicsList.filter(c => {
        const isTrial = c.package === 'trial_7'; 
        if (currentActiveTab === 'trials') return isTrial;
        return !isTrial; 
    });

    if (filteredClinics.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">${cLang.empty}</td></tr>`;
        return;
    }

    filteredClinics.forEach(c => {
        const dateStr = c.createdAt ? c.createdAt.toDate().toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '---';
        
        let nextPayStr = "---";
        let payStyle = "";
        let alertBadge = "";

        if (c.nextPaymentDate) {
            const npDate = typeof c.nextPaymentDate.toDate === 'function' ? c.nextPaymentDate.toDate() : new Date(c.nextPaymentDate);
            nextPayStr = npDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US');
            
            const diffTime = npDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays < 0 && c.status !== 'suspended') {
                payStyle = "color: red; font-weight: bold;";
                alertBadge = `<span style="background: red; color: white; padding: 2px 5px; border-radius: 4px; font-size: 10px; margin-right: 5px;">${isAr?'منتهي':'Expired'}</span>`;
            } else if (diffDays >= 0 && diffDays <= 3 && c.status === 'active') {
                payStyle = "color: #d97706; font-weight: bold;";
                alertBadge = `<span style="background: #fef3c7; color: #d97706; padding: 2px 5px; border-radius: 4px; font-size: 10px; margin-right: 5px; border: 1px solid #fde68a;">⚠️ ${isAr?'قريباً':'Soon'}</span>`;
            } else {
                payStyle = "color: green;";
            }
        }

        let adminEmail = c.adminEmail || "---";
        let accessCode = c.accessCode || ""; 

        let pkgLabel = '';
        if(c.package === 'trial_7') pkgLabel = cLang.pkgStart || 'Trial 7';
        else if(c.package === 'quarterly') pkgLabel = cLang.pkgGrowth || 'Quarterly';
        else if(c.package === 'yearly') pkgLabel = cLang.pkgElite || 'Yearly';
        else if(c.package === 'lifetime') pkgLabel = cLang.pkgLife || 'Lifetime';
        else pkgLabel = cLang.pkgPro || 'Monthly';

        let statusHtml = '';
        if(c.status === 'active') statusHtml = `<span class="status-badge status-active">${cLang.sAct}</span>`;
        else if(c.status === 'expired') statusHtml = `<span class="status-badge" style="background:#fee2e2; color:#ef4444; border:1px solid #fca5a5;">${cLang.sExpired}</span>`;
        else statusHtml = `<span class="status-badge status-suspended">${cLang.sSusp}</span>`;

        let toggleBtnHtml = '';
        if (c.status === 'suspended' || c.status === 'expired') {
            toggleBtnHtml = `<button class="btn-primary" onclick="toggleSubscription('${c.id}', 'active')" style="background:#3b82f6; border:none; padding:5px 10px; color:white; border-radius:5px; cursor:pointer;">▶️ ${cLang.btnRenew}</button>`;
        } else {
            toggleBtnHtml = `<button class="btn-warning" onclick="toggleSubscription('${c.id}', 'suspended')" style="background:#f59e0b; border:none; padding:5px 10px; color:white; border-radius:5px; cursor:pointer;">⏸️ ${cLang.btnCancelSub}</button>`;
        }

        let btnPkgTxt = cLang.btnPkgChange || (isAr ? "تغيير الباقة" : "Package");

        let actionsHtml = '';
        
        if (currentActiveTab === 'trials') {
            actionsHtml = `
                <button onclick="openUpgradeTrialModal('${c.id}', '${c.clinicName.replace(/'/g,"\\'")}', '${adminEmail}', '${c.phone1||''}', ${c.maxUsers||3}, ${c.maxPatients||500}, ${c.maxWhatsapp||100})" style="background:#10b981; border:none; padding:5px 10px; color:white; border-radius:5px; cursor:pointer; font-weight: bold; width: 100%;">🚀 ${isAr ? 'ترقية العيادة ودفع الاشتراك' : 'Upgrade & Pay'}</button>
            `;
        } 
        else {
            actionsHtml = `
                <button onclick="markAsPaid('${c.id}')" style="background:#10b981; border:none; padding:5px 10px; color:white; border-radius:5px; cursor:pointer;" title="${isAr ? 'إضافة شهر جديد' : 'Renew'}">💰 ${cLang.btnPaid}</button>
                <button onclick="openChangePackageModal('${c.id}')" style="background:#8b5cf6; border:none; padding:5px 10px; color:white; border-radius:5px; cursor:pointer;" title="${btnPkgTxt}">📦 ${btnPkgTxt}</button>
                ${toggleBtnHtml}
            `;
            
            if (currentNivaRole === 'owner') {
                actionsHtml += `<button class="btn-danger" onclick="deleteClinic('${c.id}', '${accessCode}')" style="background:#ef4444; border:none; padding:5px 10px; color:white; border-radius:5px; cursor:pointer;">🗑️ ${cLang.btnDelete}</button>`;
            }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dateStr}</td>
            <td style="${payStyle}" dir="ltr">${nextPayStr} ${alertBadge}</td>
            <td>
                <a class="clinic-link" onclick="openClinicDetailsModal('${c.id}')">🏢 ${c.clinicName}</a><br>
                <small style="color:gray;">${isAr?'الكود':'Code'}: ${accessCode || '---'} | ${isAr?'الباقة':'Plan'}: <span style="color:#3b82f6;">${pkgLabel}</span> | ${isAr?'السعة':'Limit'}: <strong>${c.maxUsers||1}</strong></small>
            </td>
            <td dir="ltr" style="text-align:start;">${adminEmail}</td>
            <td>${statusHtml}</td>
            <td style="text-align: center; display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                ${actionsHtml}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openUpgradeTrialModal(clinicId, clinicName, adminEmail, adminPhone, currentMaxUsers, currentMaxPat, currentMaxWa) {
    document.getElementById('upg_clinic_id').value = clinicId;
    document.getElementById('upg_clinic_name').value = clinicName;
    document.getElementById('upg_admin_email').value = adminEmail;
    document.getElementById('upg_admin_phone').value = adminPhone || '';
    
    document.getElementById('upg_package').value = 'monthly';
    document.getElementById('upg_price').value = '';
    
    document.getElementById('upg_max_users').value = currentMaxUsers || '5';
    document.getElementById('upg_max_patients').value = currentMaxPat || '500';
    document.getElementById('upg_max_whatsapp').value = currentMaxWa || '100';
    
    document.getElementById('upgradeTrialModal').style.display = 'flex';
}

function closeUpgradeTrialModal() { document.getElementById('upgradeTrialModal').style.display = 'none'; }

async function confirmUpgradeTrial(e) {
    e.preventDefault();
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const btn = document.getElementById('btn-confirm-upgrade');
    btn.disabled = true;
    
    const clinicId = document.getElementById('upg_clinic_id').value;
    const clinicName = document.getElementById('upg_clinic_name').value;
    const adminEmail = document.getElementById('upg_admin_email').value;
    const adminPhone = document.getElementById('upg_admin_phone').value;
    const packageType = document.getElementById('upg_package').value;
    const subPrice = Number(document.getElementById('upg_price').value);
    
    const maxUsers = Number(document.getElementById('upg_max_users').value);
    const maxPatients = Number(document.getElementById('upg_max_patients').value);
    const maxWhatsapp = Number(document.getElementById('upg_max_whatsapp').value);

    if (window.showLoader) window.showLoader(isAr ? "جاري ترقية العيادة وتوليد كود الدخول..." : "Upgrading clinic...");

    try {
        const accessCode = Math.floor(10000 + Math.random() * 90000).toString();
        const nextPayDate = new Date();
        if (packageType === 'monthly') nextPayDate.setMonth(nextPayDate.getMonth() + 1);
        else if (packageType === 'quarterly') nextPayDate.setMonth(nextPayDate.getMonth() + 3);
        else if (packageType === 'yearly') nextPayDate.setFullYear(nextPayDate.getFullYear() + 1);
        else if (packageType === 'lifetime') nextPayDate.setFullYear(nextPayDate.getFullYear() + 100);

        await db.collection("Clinics").doc(clinicId).update({
            planType: firebase.firestore.FieldValue.delete(), 
            package: packageType,
            subPrice: subPrice,
            maxUsers: maxUsers,
            maxPatients: maxPatients,
            maxWhatsapp: maxWhatsapp,
            accessCode: accessCode,
            nextPaymentDate: nextPayDate,
            status: 'active'
        });

        await db.collection("clinicId").doc(accessCode).set({
            activated: true, 
            name: clinicName,
            phone: adminPhone || "",
            email: adminEmail,
            role: "admin",
            clinicId: clinicId
        });

        alert(isAr ? `✅ تم ترقية العيادة بنجاح!\n\nتم توليد كود دخول جديد للدكتور:\nكود العيادة: ${accessCode}\nقيمة الاشتراك: ${subPrice} ج.م` : `✅ Clinic upgraded successfully!\nNew Code: ${accessCode}`);
        closeUpgradeTrialModal();
    } catch (error) {
        console.error(error);
        alert(isAr ? "حدث خطأ أثناء الترقية" : "Upgrade error");
    } finally {
        btn.disabled = false;
        if (window.hideLoader) window.hideLoader();
    }
}

// 🔴 مودال تغيير الباقة الموحد والديناميكي 🔴
function openChangePackageModal(clinicId) {
    const lang = localStorage.getItem('preferredLang') || 'ar';
    const isAr = lang === 'ar';
    const c = window.superLang; 

    let modal = document.getElementById('dynamicPkgModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dynamicPkgModal';
        modal.className = 'modal no-print';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; text-align: ${isAr ? 'right' : 'left'}; direction: ${isAr ? 'rtl' : 'ltr'};">
            <span class="close-modal" onclick="document.getElementById('dynamicPkgModal').style.display='none'" style="${isAr ? 'left: 25px; right: auto;' : 'right: 25px; left: auto;'}">&times;</span>
            <h2 style="margin-bottom: 20px; color: #0f172a;">📦 ${c.btnPkgChange || (isAr ? 'تغيير باقة العيادة' : 'Change Clinic Package')}</h2>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">${isAr ? 'سيتم تحديث الحصص (المستخدمين، المرضى) وتاريخ الانتهاء تلقائياً بناءً على الباقة الجديدة.' : 'Limits and expiration date will update automatically.'}</p>
            
            <input type="hidden" id="dyn_edit_pkg_clinic_id" value="${clinicId}">
            
            <div class="form-group">
                <label style="font-weight: bold; margin-bottom: 5px; display: block;">${c.lblSelectPkg || (isAr ? 'اختر الباقة الجديدة' : 'Select New Package')}</label>
                <select id="dyn_new_pkg_select" class="search-box" style="direction: ${isAr ? 'rtl' : 'ltr'}; margin-bottom: 20px; width: 100%;">
                    <option value="trial_7">${c.pkgStart || 'تجريبي (7 أيام)'}</option>
                    <option value="monthly">${c.pkgPro || 'شهري (Clinic Pro)'}</option>
                    <option value="quarterly">${c.pkgGrowth || 'ربع سنوي (Growth)'}</option>
                    <option value="yearly">${c.pkgElite || 'سنوي (Elite)'}</option>
                    <option value="lifetime">${c.pkgLife || 'مدى الحياة (Lifetime)'}</option>
                </select>
            </div>
            
            <button class="btn-primary" style="width: 100%; justify-content: center; background: #8b5cf6; border: none; font-size: 16px;" onclick="saveNewPackage()">${c.btnSavePkg || (isAr ? 'حفظ وتفعيل الباقة 🚀' : 'Save & Activate 🚀')}</button>
        </div>
    `;
    modal.style.display = 'flex';
}

async function saveNewPackage() {
    // 🔴 بيقرا من الـ ID الجديد عشان مياخدش القيمة الفاضية
    const clinicId = document.getElementById('dyn_edit_pkg_clinic_id').value;
    const newPkg = document.getElementById('dyn_new_pkg_select').value;
    if(!clinicId || !newPkg) return;

    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    if(window.showLoader) window.showLoader(isAr ? "جاري تغيير الباقة وتحديث الحصص..." : "Updating package & limits...");
    
    try {
        let maxU = 3, maxP = 500, maxW = 50, monthsToAdd = 0;
        
        if(newPkg === 'trial_7') { maxU = 3; maxP = 500; maxW = 50; } 
        else if(newPkg === 'monthly') { maxU = 5; maxP = 10000; maxW = 500; monthsToAdd = 1; }
        else if(newPkg === 'quarterly') { maxU = 10; maxP = 20000; maxW = 2000; monthsToAdd = 3; }
        else if(newPkg === 'yearly') { maxU = 25; maxP = 50000; maxW = 5000; monthsToAdd = 12; }
        else if(newPkg === 'lifetime') { maxU = 50; maxP = 100000; maxW = 10000; monthsToAdd = 1200; } 

        const nextPayDate = new Date();
        if(newPkg === 'trial_7') {
            nextPayDate.setDate(nextPayDate.getDate() + 7); 
        } else {
            nextPayDate.setMonth(nextPayDate.getMonth() + monthsToAdd); 
        }

        await db.collection("Clinics").doc(clinicId).update({
            package: newPkg,
            planType: firebase.firestore.FieldValue.delete(), 
            maxUsers: maxU,
            maxPatients: maxP,
            maxWhatsapp: maxW,
            nextPaymentDate: nextPayDate,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('dynamicPkgModal').style.display = 'none';
        if(window.hideLoader) window.hideLoader();
        alert(window.superLang.msgPkgChanged || (isAr ? "✅ تم تغيير باقة العيادة وتحديث الحصص وتاريخ الانتهاء بنجاح!" : "✅ Package changed and limits updated successfully!"));
        
    } catch(e) {
        console.error("Error updating package:", e);
        if(window.hideLoader) window.hideLoader();
        alert(window.superLang.msgPkgErr || (isAr ? "❌ حدث خطأ أثناء تغيير الباقة" : "❌ Error changing package"));
    }
}

async function markAsPaid(clinicId) {
    if(confirm(window.superLang.msgConfirmPaid)) {
        const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
        if (window.showLoader) window.showLoader(isAr ? "جاري التجديد..." : "Renewing...");
        try {
            const clinic = allClinicsList.find(c => c.id === clinicId);
            let monthsToAdd = 1;
            if(clinic) {
                if(clinic.package === 'quarterly') monthsToAdd = 3;
                else if(clinic.package === 'yearly') monthsToAdd = 12;
                else if(clinic.package === 'lifetime') monthsToAdd = 1200;
            }
            
            const newNextPay = new Date();
            newNextPay.setMonth(newNextPay.getMonth() + monthsToAdd); 
            
            await db.collection("Clinics").doc(clinicId).update({ 
                status: 'active',
                nextPaymentDate: newNextPay,
                package: clinic ? clinic.package : 'monthly' 
            });
        } catch (e) {
            console.error(e);
        } finally {
            if (window.hideLoader) window.hideLoader();
        }
    }
}

async function toggleSubscription(clinicId, newStatus) {
    if(confirm(window.superLang.msgConfirmToggle)) {
        const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
        if (window.showLoader) window.showLoader(isAr ? "جاري تغيير الحالة..." : "Updating status...");
        try {
            await db.collection("Clinics").doc(clinicId).update({ status: newStatus });
        } catch (e) {
            console.error(e);
        } finally {
            if (window.hideLoader) window.hideLoader();
        }
    }
}

async function deleteClinic(clinicId, accessCode) {
    const code = prompt(window.superLang.msgWarnDel);
    if (code === '1234') {
        const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
        if (window.showLoader) window.showLoader(isAr ? "جاري مسح العيادة نهائياً..." : "Deleting clinic...");
        try {
            await db.collection("Clinics").doc(clinicId).delete();
            if(accessCode && accessCode !== "") {
                await db.collection("clinicId").doc(accessCode).delete();
            }
            alert(window.superLang.msgDelSuccess + (isAr ? "\n\nملاحظة: إذا كان الدكتور متصلاً الآن، سيقوم (نظام الحماية) بطرده تلقائياً بمجرد تحديث صفحته." : "\n\nNote: If doctor is online, they will be force logged out automatically."));
        } catch (e) {
            console.error(e);
        } finally {
            if (window.hideLoader) window.hideLoader();
        }
    }
}

function loadGlobalStats() {
    // حساب إجمالي المرضى في كل العيادات
    db.collection("Patients").get().then(snap => {
        const countEl = document.getElementById('stat-all-patients');
        if(countEl) countEl.innerText = snap.size;
    }).catch(e => console.error("Error loading patients stats:", e));

    // حساب إجمالي المستخدمين والموظفين في العيادات
    db.collection("Users").get().then(snap => {
        const staffEl = document.getElementById('stat-clinic-staff');
        if(staffEl) staffEl.innerText = snap.size;
    }).catch(e => console.error("Error loading users stats:", e));
}

function filterData() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    
    const cRows = document.getElementById('clinicsBody').getElementsByTagName('tr');
    for (let i = 0; i < cRows.length; i++) {
        const nameCol = cRows[i].getElementsByTagName('td')[2]; 
        if (nameCol) {
            const textToSearch = nameCol.textContent.toLowerCase();
            if (textToSearch.indexOf(input) > -1) cRows[i].style.display = "";
            else cRows[i].style.display = "none";
        }
    }
    
    const sRows = document.getElementById('supportBody');
    if (sRows) {
        const rows = sRows.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            const clinicCol = rows[i].getElementsByTagName('td')[1]; 
            if (clinicCol) {
                const textToSearch = clinicCol.textContent.toLowerCase();
                if (textToSearch.indexOf(input) > -1) rows[i].style.display = "";
                else rows[i].style.display = "none";
            }
        }
    }
}

window.onload = () => {
    const lang = localStorage.getItem('preferredLang') || 'ar';
    document.body.dir = lang === 'en' ? 'ltr' : 'rtl';
    updatePageContent(lang);
};

// ==========================================
// 🔴 دوال وحدة الأمان (Security & IAM) 🔴
// ==========================================

async function sendUserPasswordReset(email) {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    if(!confirm(isAr ? `هل أنت متأكد من إرسال رابط إعادة تعيين كلمة المرور إلى:\n${email} ؟` : `Send reset link to ${email}?`)) return;
    
    if (window.showLoader) window.showLoader(isAr ? "جاري إرسال الرابط..." : "Sending link...");
    try {
        const actionCodeSettings = {
            url: 'https://nivadent.online/', 
            handleCodeInApp: false
        };
        await firebase.auth().sendPasswordResetEmail(email, actionCodeSettings);
        alert(isAr ? "✅ تم إرسال رابط تغيير كلمة المرور للإيميل بنجاح!" : "✅ Password reset link sent successfully!");
    } catch (error) {
        console.error("Error sending reset email:", error);
        alert(isAr ? "❌ حدث خطأ! تأكد أن هذا الإيميل مسجل فعلياً في النظام." : "❌ Error sending link.");
    } finally {
        if (window.hideLoader) window.hideLoader();
    }
}

async function toggleUserAccountStatus(email, newStatus) {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    if(!confirm(isAr ? "هل أنت متأكد من تغيير حالة هذا الموظف؟" : "Are you sure?")) return;
    
    if (window.showLoader) window.showLoader(isAr ? "جاري التحديث..." : "Updating...");
    try {
        await db.collection("Users").doc(email).update({ 
            status: newStatus,
            forceLogout: newStatus === 'suspended' ? true : false 
        });
    } catch (error) {
        console.error("Error toggling user status:", error);
        alert(isAr ? "❌ حدث خطأ!" : "❌ Error!");
    } finally {
        if (window.hideLoader) window.hideLoader();
    }
}

async function forceUserLogout(email) {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    if(!confirm(isAr ? `هل تريد فعلاً إجبار هذا الحساب على تسجيل الخروج فوراً؟\n(${email})` : "Force logout this user?")) return;
    
    if (window.showLoader) window.showLoader(isAr ? "جاري طرد المستخدم..." : "Forcing logout...");
    try {
        await db.collection("Users").doc(email).update({ forceLogout: true });
        alert(isAr ? "✅ تم إرسال أمر الطرد! سيتم تسجيل خروجه في ثواني." : "✅ Force logout command sent!");
    } catch (error) {
        console.error("Error forcing logout:", error);
        alert(isAr ? "❌ حدث خطأ!" : "❌ Error!");
    } finally {
        if (window.hideLoader) window.hideLoader();
    }
}

async function impersonateClinic() {
    const clinicId = document.getElementById('current-det-clinic-id').value;
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    if(!clinicId) return;

    if(confirm(isAr ? "هل تريد الدخول إلى لوحة تحكم هذه العيادة الآن؟" : "Enter this clinic's dashboard?")) {
        window.open(`home.html?impersonate=${clinicId}`, '_blank'); 
    }
}

function openOverrideModal() {
    const clinicId = document.getElementById('current-det-clinic-id').value;
    const clinic = allClinicsList.find(c => c.id === clinicId);
    if (!clinic) return;

    document.getElementById('ovr_clinic_id').value = clinicId;
    document.getElementById('ovr_discount').value = (clinic.overrides && clinic.overrides.discount) || 0;
    document.getElementById('ovr_trial_days').value = 0;
    document.getElementById('ovr_notes').value = (clinic.overrides && clinic.overrides.notes) || "";

    openModal('overrideModal');
}

async function saveOverride(e) {
    e.preventDefault();
    const clinicId = document.getElementById('ovr_clinic_id').value;
    const discount = Number(document.getElementById('ovr_discount').value);
    const trialDays = Number(document.getElementById('ovr_trial_days').value);
    const notes = document.getElementById('ovr_notes').value.trim();
    
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    if (window.showLoader) window.showLoader(isAr ? "جاري حفظ التعديلات..." : "Saving overrides...");

    try {
        const updateData = {
            "overrides.discount": discount,
            "overrides.notes": notes,
            "overrides.lastModifiedBy": "SuperAdmin",
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (trialDays > 0) {
            const clinic = allClinicsList.find(c => c.id === clinicId);
            let currentExp = clinic.nextPaymentDate ? (clinic.nextPaymentDate.toDate ? clinic.nextPaymentDate.toDate() : new Date(clinic.nextPaymentDate)) : new Date();
            currentExp.setDate(currentExp.getDate() + trialDays);
            updateData.nextPaymentDate = firebase.firestore.Timestamp.fromDate(currentExp);
        }

        await db.collection("Clinics").doc(clinicId).update(updateData);
        alert(isAr ? "✅ تم تحديث بيانات الاشتراك بنجاح!" : "✅ Subscription updated!");
        closeModal('overrideModal');
        closeClinicDetailsModal(); 
    } catch (err) {
        console.error(err);
        alert(isAr ? "حدث خطأ أثناء الحفظ" : "Error saving overrides");
    } finally {
        if (window.hideLoader) window.hideLoader();
    }
}

let mrrChart = null;
function updateMRRStats() {
    const activeClinics = allClinicsList.filter(c => c.status === 'active');
    let totalMRR = 0;
    
    const chartData = activeClinics.map(c => {
        const price = Number(c.subPrice) || 0;
        const discount = (c.overrides && c.overrides.discount) || 0;
        const finalPrice = price - (price * (discount / 100));
        totalMRR += finalPrice;
        return { name: c.clinicName, revenue: finalPrice };
    });

    const mrrEl = document.getElementById('stat-mrr');
    if(mrrEl) mrrEl.innerText = Math.round(totalMRR).toLocaleString();

    const canvas = document.getElementById('mrrChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (mrrChart) mrrChart.destroy();
    
    mrrChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(d => d.name),
            datasets: [{
                label: 'Revenue',
                data: chartData.map(d => d.revenue),
                backgroundColor: '#a78bfa',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { beginAtZero: true } }
        }
    });
}

async function sendGlobalAnnouncement() {
    const msgBox = document.getElementById('global_announcement_msg');
    const msg = msgBox.value.trim();
    const type = document.getElementById('global_announcement_type').value;
    const target = document.getElementById('global_announcement_target').value;
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';

    if (!msg) {
        alert(isAr ? "⚠️ يرجى كتابة الرسالة أولاً قبل الإرسال!" : "⚠️ Please write a message first!");
        return;
    }

    if (!confirm(isAr ? "هل أنت متأكد من إرسال هذا الإشعار الآن؟" : "Broadcast this announcement?")) {
        return;
    }

    if (window.showLoader) window.showLoader(isAr ? "جاري الإرسال..." : "Sending...");

    try {
        let clinicsToNotify = [];
        if (target === 'all') {
            clinicsToNotify = allClinicsList.filter(c => c.status === 'active');
        } else {
            clinicsToNotify = allClinicsList.filter(c => c.id === target);
        }

        const batch = db.batch(); 
        let count = 0;

        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        clinicsToNotify.forEach(clinic => {
            const notifRef = db.collection("Notifications").doc(); 
            batch.set(notifRef, {
                clinicId: clinic.id,
                branchId: 'main', 
                title: isAr ? "رسالة من الإدارة (NivaDent)" : "System Announcement",
                message: msg,
                type: type,
                isRead: false,
                date: todayStr,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            count++;
        });

        if (count > 0) {
            await batch.commit(); 
            alert(isAr ? `✅ بوم! تم إرسال الإشعار بنجاح إلى ${count} عيادة!` : `✅ Successfully sent to ${count} clinics!`);
            msgBox.value = ''; 
        } else {
            alert(isAr ? "لا توجد عيادات لتلقي الإشعار." : "No clinics found.");
        }

    } catch (error) {
        console.error("Broadcast Error:", error);
        alert(isAr ? "❌ حدث خطأ أثناء الإرسال." : "❌ Error sending announcement.");
    } finally {
        if (window.hideLoader) window.hideLoader();
    }
}

let currentChatUnsubscribe = null;
function loadClinicChat() {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const clinicId = document.getElementById('chat_clinic_select').value;
    const chatArea = document.getElementById('chat_messages_area');
    
    if(!clinicId) {
        chatArea.innerHTML = `<div style="text-align:center; color:#94a3b8; margin: auto; font-size: 18px;">💬 ${isAr?'اختر عيادة لبدء المحادثة':'Select a clinic to chat'}</div>`;
        return;
    }
    
    if(currentChatUnsubscribe) currentChatUnsubscribe();
    
    chatArea.innerHTML = `<div style="text-align:center; color:#94a3b8; margin: auto;">${isAr?'جاري تحميل المحادثة...':'Loading chat...'}</div>`;
    
    currentChatUnsubscribe = db.collection("LiveChats")
        .where("clinicId", "==", clinicId)
        .orderBy("createdAt", "asc")
        .onSnapshot(snap => {
            chatArea.innerHTML = '';
            if(snap.empty) {
                chatArea.innerHTML = `<div style="text-align:center; color:#94a3b8; margin: auto;">${isAr?'لا توجد رسائل سابقة. ابدأ المحادثة الآن!':'No previous messages. Start chatting now!'}</div>`;
                return;
            }
            snap.forEach(doc => {
                const msg = doc.data();
                const isSuperAdmin = msg.senderRole === 'superadmin';
                const alignStyles = isSuperAdmin ? 'align-self: flex-end; background: #3b82f6; color: white; border-bottom-left-radius: 0;' : 'align-self: flex-start; background: white; color: #0f172a; border: 1px solid #e2e8f0; border-bottom-right-radius: 0;';
                
                chatArea.innerHTML += `
                    <div style="max-width: 70%; padding: 12px 15px; border-radius: 12px; ${alignStyles} box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <div style="font-size: 11px; font-weight: bold; margin-bottom: 5px; opacity: 0.9;">${msg.senderName || '---'}</div>
                        <div style="font-size: 15px; line-height: 1.4;">${msg.text}</div>
                        <div style="font-size: 10px; opacity: 0.7; margin-top: 5px; text-align: ${isSuperAdmin?'right':'left'};">${msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString(isAr?'ar-EG':'en-US', {hour: '2-digit', minute:'2-digit'}) : ''}</div>
                    </div>
                `;
            });
            chatArea.scrollTop = chatArea.scrollHeight; 
        });
}

async function sendAdminChatMessage() {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const clinicId = document.getElementById('chat_clinic_select').value;
    const input = document.getElementById('chat_msg_input');
    const text = input.value.trim();
    
    if(!clinicId || !text) return;
    input.value = ''; 
    
    try {
        await db.collection("LiveChats").add({
            clinicId: clinicId,
            text: text,
            senderRole: 'superadmin',
            senderName: isAr ? 'دعم NivaDent 🛡️' : 'NivaDent Support 🛡️',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await db.collection("Notifications").add({
            clinicId: clinicId,
            branchId: 'main',
            title: isAr ? "رسالة جديدة من الإدارة 💬" : "New message from Support 💬",
            message: text.length > 30 ? text.substring(0, 30) + '...' : text,
            type: "chat",
            isRead: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
    } catch(e) { 
        console.error("Chat Error:", e); 
        alert(isAr ? "حدث خطأ أثناء إرسال الرسالة." : "Error sending message."); 
    }
}

function loadNivaTeam() {
    if (currentNivaRole !== 'owner') {
        const teamTab = document.getElementById('tab-team');
        if(teamTab) teamTab.style.display = 'none';
        return; 
    }

    db.collection("NivaAdmins").onSnapshot(snap => {
        const tbody = document.getElementById('nivaTeamBody');
        const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
        
        // تغذية كارت فريق النظام المركزى
        const elAdmins = document.getElementById('stat-system-admins');
        if(elAdmins) elAdmins.innerText = snap.size;

        if (!tbody) return;
        tbody.innerHTML = '';

        if (snap.empty) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b;">${isAr?'لا يوجد موظفين حالياً.':'No staff members.'}</td></tr>`;
            return;
        }

        snap.forEach(doc => {
            const admin = doc.data();
            const email = doc.id;
            let roleStr = admin.role === 'sales' ? (isAr?'مبيعات (Sales)':'Sales') : (admin.role === 'support' ? (isAr?'دعم فني (Support)':'Support') : (isAr?'مدير (Owner)':'Owner'));
            
            let dateStr = '---';
            if(admin.addedAt) {
                const d = typeof admin.addedAt.toDate === 'function' ? admin.addedAt.toDate() : new Date(admin.addedAt);
                dateStr = d.toLocaleDateString(isAr?'ar-EG':'en-US');
            }

            tbody.innerHTML += `
                <tr>
                    <td dir="ltr" style="text-align: start; font-weight: bold; color: #0f172a;">${email}</td>
                    <td><span style="background:#e0f2fe; color:#0284c7; padding:4px 8px; border-radius:6px; font-size:13px; font-weight:bold;">${roleStr}</span></td>
                    <td style="text-align: center;">${dateStr}</td>
                    <td style="text-align: center;">
                        <button class="btn-danger" onclick="deleteNivaAdmin('${email}')" style="background:#ef4444; border:none; padding:5px 10px; color:white; border-radius:5px; cursor:pointer;">🗑️ ${isAr?'إزالة':'Remove'}</button>
                    </td>
                </tr>
            `;
        });
    });
}

async function addNivaAdmin(e) {
    e.preventDefault();
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    if (currentNivaRole !== 'owner') { alert(isAr?"غير مصرح لك!":"Unauthorized!"); return; }

    const email = document.getElementById('niva_admin_email').value.trim().toLowerCase();
    const role = document.getElementById('niva_admin_role').value;
    const btn = document.getElementById('btn-add-niva-admin');
    
    btn.disabled = true; btn.innerText = isAr?"جاري الإضافة...":"Adding...";
    try {
        await db.collection("NivaAdmins").doc(email).set({
            role: role,
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(isAr?"✅ تم إضافة الموظف بنجاح للوحة السوبر أدمن!":"✅ Admin added successfully!");
        document.getElementById('addNivaAdminForm').reset();
    } catch (err) {
        console.error(err);
        alert(isAr?"حدث خطأ أثناء الإضافة.":"Error adding admin.");
    } finally {
        btn.disabled = false; btn.innerText = window.superLang.teamAddBtn || (isAr?"إضافة الموظف":"Add Admin");
    }
}

async function deleteNivaAdmin(email) {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    if (currentNivaRole !== 'owner') return;
    if (email === 'eslamhany71@gmail.com') { alert(isAr?"لا يمكن حذف المالك الأساسي للنظام!":"Cannot delete main owner!"); return; }

    if (confirm(isAr?`هل أنت متأكد من سحب الصلاحيات وإزالة الموظف (${email})؟`:`Are you sure you want to remove admin (${email})?`)) {
        try {
            await db.collection("NivaAdmins").doc(email).delete();
        } catch (err) {
            console.error(err);
        }
    }
}

function updateSystemHealth() {
    const maxCapacity = 100; 
    const activeClinics = allClinicsList.filter(c => c.status === 'active').length;
    
    let loadPercentage = Math.round((activeClinics / maxCapacity) * 100);
    if (loadPercentage > 100) loadPercentage = 100;

    const loadBar = document.getElementById('sys-load-bar');
    const loadText = document.getElementById('sys-load-text');
    const statusText = document.getElementById('sys-status-text');

    if(!loadBar || !loadText) return;

    loadText.innerText = `${loadPercentage}%`;
    loadBar.style.width = `${loadPercentage}%`;
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';

    if (loadPercentage < 50) {
        loadBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)'; 
        statusText.innerHTML = isAr ? 'مستقر 🟢' : 'Stable 🟢';
        statusText.style.color = '#34d399';
    } else if (loadPercentage < 80) {
        loadBar.style.background = '#f59e0b'; 
        statusText.innerHTML = isAr ? 'ضغط متوسط 🟡' : 'Medium Load 🟡';
        statusText.style.color = '#f59e0b';
    } else {
        loadBar.style.background = '#ef4444'; 
        statusText.innerHTML = isAr ? 'خطر / اقترب للحد 🔴' : 'Critical Load 🔴';
        statusText.style.color = '#ef4444';
    }
}
// =====================================================================
// 🌟 الموديولات الجديدة (المركز المالي، الطلبات، السجل، الكروت الذكية) 🌟
// =====================================================================

// 🟢 1. نظام التنبيهات الحية (Toasts)
function showRealTimeToast(title, message) {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const toast = document.createElement('div');
    toast.style.cssText = `position: fixed; bottom: 30px; left: 30px; background: #0f172a; color: white; padding: 15px 25px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); z-index: 9999999; display: flex; align-items: center; gap: 20px; font-family: 'Tajawal', sans-serif; animation: slideUp 0.5s ease-out; border: 1px solid #334155; direction: ${isAr ? 'rtl' : 'ltr'};`;
    toast.innerHTML = `
        <div style="font-size: 24px;">🔔</div>
        <div>
            <h6 style="margin: 0; font-weight: bold; font-size: 15px; color: #10b981;">${title}</h6>
            <small style="opacity: 0.85;">${message}</small>
        </div>
    `;
    document.body.appendChild(toast);
    
    // تشغيل صوت تنبيه خفيف (اختياري)
    try { const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); audio.play(); } catch(e){}

    setTimeout(() => {
        toast.style.animation = "slideDown 0.5s ease-out forwards";
        setTimeout(() => toast.remove(), 500);
    }, 6000);
}

// 📡 2. نظام السجل الحي (Audit Trail Logger)
async function logToSystemAudit(actionType, message, clinicId = "System") {
    try {
        await db.collection("SystemAuditLogs").add({
            actionType: actionType, // 'success', 'warning', 'info', 'danger'
            message: message,
            clinicId: clinicId,
            actor: currentNivaRole,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch(e) { console.error("Audit Log Error:", e); }
}

function loadAuditTrail() {
    db.collection("SystemAuditLogs").orderBy("createdAt", "desc").limit(50).onSnapshot(snap => {
        const container = document.getElementById('audit-timeline-container');
        if(!container) return;
        const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
        let html = '';

        if (snap.empty) {
            container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">${isAr?'الرادار هادئ، لا توجد نشاطات حالياً.':'Radar is quiet. No activities.'}</div>`;
            return;
        }

        snap.forEach(doc => {
            const log = doc.data();
            let iconClass = 'blue'; let icon = 'ℹ️';
            if(log.actionType === 'success') { iconClass = 'green'; icon = '✅'; }
            else if(log.actionType === 'warning') { iconClass = 'yellow'; icon = '⚠️'; }
            else if(log.actionType === 'danger') { iconClass = 'red'; icon = '🛑'; }

            let dateStr = log.createdAt ? new Date(log.createdAt.toDate()).toLocaleString(isAr?'ar-EG':'en-US') : (isAr?'الآن':'Now');

            html += `
                <div class="audit-item">
                    <div class="audit-icon ${iconClass}">${icon}</div>
                    <div class="audit-content">
                        <span class="audit-time" dir="ltr">${dateStr} | ${log.actor || 'System'}</span>
                        <p class="audit-text"><strong>[${log.clinicId || 'System'}]</strong> - ${log.message}</p>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    });
}

// 🟢 3. نظام الطلبات المعلقة والزرار السحري (المعدل لدعم العيادات الجديدة والإيصالات)
let allPendingPaymentsArray = [];
let allPendingClinicsArray = [];

function loadPendingPayments() {
    const tbody = document.getElementById('pendingPaymentsBody');
    const badge = document.getElementById('badge-pending');
    const statPending = document.getElementById('stat-pending-payments');
    const c = window.superLang || {};
    
    if(!tbody) return;

    // دالة داخلية لرسم الجدول بعد تجميع الداتا من الكوليكشنين
    const renderCombinedTable = () => {
        const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
        let html = '';
        let totalCount = allPendingPaymentsArray.length + allPendingClinicsArray.length;

        // 1. رسم إيصالات الدفع القديمة
        allPendingPaymentsArray.forEach(req => {
            let dateStr = req.createdAt ? new Date(req.createdAt.toDate()).toLocaleDateString() : '---';
            let pkgLabel = c[req.packageType === 'yearly' ? 'pkgElite' : 'pkgPro'] || req.packageType;
            let proofHtml = req.referenceNumber 
                ? `<span style="font-family: monospace; font-size: 16px; background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 6px; font-weight: bold; border: 1px dashed #38bdf8;">#${req.referenceNumber}</span>`
                : `<a href="${req.receiptUrl}" target="_blank" style="background: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-weight: bold; border: 1px solid #cbd5e1;">📸 ${isAr?'عرض الإيصال':'View Receipt'}</a>`;

            const matchedClinic = typeof allClinicsList !== 'undefined' ? allClinicsList.find(clinic => clinic.id === req.clinicId) : null;
            const realClinicName = matchedClinic ? matchedClinic.clinicName : req.clinicId;
            const realEmail = matchedClinic ? (matchedClinic.adminEmail || req.userEmail) : req.userEmail;

            html += `
                <tr>
                    <td style="font-weight: bold; color: #475569;">${dateStr}</td>
                    <td>
                        <a class="clinic-link" onclick="openClinicDetailsModal('${req.clinicId}')" style="cursor: pointer; color: #0ea5e9; font-weight: bold; font-size: 15px; text-decoration: none;">🏢 ${realClinicName}</a><br>
                        <small dir="ltr" style="color: #64748b;">${realEmail}</small>
                    </td>
                    <td><span style="color: #8b5cf6; font-weight: bold;">${pkgLabel}</span><br><span style="color: #10b981; font-weight: bold;">${req.price} ج.م</span></td>
                    <td>${proofHtml}</td>
                    <td style="text-align: center;">
                        <button onclick="approvePendingPayment('${req.docId}', '${req.clinicId}', '${req.packageType || 'monthly'}', ${req.price})" style="background: #10b981; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ ${isAr?'تفعيل الإيصال':'Approve'}</button>
                        <button onclick="rejectPendingPayment('${req.docId}')" style="background: #ef4444; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-inline-start: 5px;">❌ ${isAr?'رفض':'Reject'}</button>
                    </td>
                </tr>
            `;
        });

        // 2. رسم العيادات الجديدة المسجلة (الاستراتيجية الجديدة)
        allPendingClinicsArray.forEach(clinic => {
            let dateStr = clinic.createdAt ? new Date(clinic.createdAt.toDate()).toLocaleDateString() : '---';
            let proofHtml = clinic.syndicateId 
                ? `<span style="font-family: monospace; font-size: 14px; background: #fef08a; color: #b45309; padding: 4px 10px; border-radius: 6px; font-weight: bold; border: 1px dashed #f59e0b;">نقابة: ${clinic.syndicateId}</span>`
                : `<span style="color:#94a3b8;">بدون نقابة</span>`;

            html += `
                <tr style="background-color: #f8fafc; border-right: 4px solid #f59e0b;">
                    <td style="font-weight: bold; color: #475569;">${dateStr}</td>
                    <td>
                        <span style="color: #0ea5e9; font-weight: bold; font-size: 15px;">🏢 ${clinic.clinicName}</span><br>
                        <small dir="ltr" style="color: #64748b;">${clinic.adminEmail}</small><br>
                        <small dir="ltr" style="color: #64748b;">📞 ${clinic.phone1 || ''}</small>
                    </td>
                    <td><span style="color: #f59e0b; font-weight: bold;">حساب جديد (Pending)</span><br><span style="color: #10b981; font-weight: bold;">باقة مجانية</span></td>
                    <td>${proofHtml}</td>
                    <td style="text-align: center;">
                        <button onclick="approveNewClinic('${clinic.id}')" style="background: #0284c7; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ ${isAr?'موافقة وتفعيل':'Approve'}</button>
                        <button onclick="rejectNewClinic('${clinic.id}', '${clinic.adminEmail}')" style="background: #ef4444; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-inline-start: 5px;">❌ ${isAr?'طرد':'Delete'}</button>
                    </td>
                </tr>
            `;
        });

        if (totalCount === 0) tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b;">${isAr?'لا توجد طلبات أو عيادات معلقة.':'No pending requests.'}</td></tr>`;
        else tbody.innerHTML = html;

        if(badge) { badge.innerText = totalCount; badge.style.display = totalCount > 0 ? 'flex' : 'none'; }
        if(statPending) statPending.innerText = totalCount;
    };

    // مراقب الإيصالات القديمة
    db.collection("PendingPayments").orderBy("createdAt", "desc").onSnapshot(snap => {
        allPendingPaymentsArray = [];
        snap.forEach(doc => {
            const req = doc.data();
            if (req.status === 'قيد المراجعة' || req.status === 'pending') {
                allPendingPaymentsArray.push({ docId: doc.id, ...req });
            }
        });
        renderCombinedTable();
    });

    // 🔴 مراقب العيادات الجديدة (قيد المراجعة)
    db.collection("Clinics").where("status", "==", "pending").onSnapshot(snap => {
        allPendingClinicsArray = [];
        snap.forEach(doc => {
            allPendingClinicsArray.push({ id: doc.id, ...doc.data() });
        });
        renderCombinedTable();
    });
}
// ==========================================
// 🟢 دوال تفعيل وطرد العيادات الجديدة (Pending Strategy)
// ==========================================
window.approveNewClinic = async function(clinicId) {
    if(!confirm("هل أنت متأكد من الموافقة على هذه العيادة وتفعيل حسابها للعمل؟")) return;
    try {
        await db.collection("Clinics").doc(clinicId).update({ status: 'active' });
        alert("✅ تم تفعيل العيادة بنجاح! يمكن للطبيب تسجيل الدخول الآن.");
    } catch (error) {
        console.error(error);
        alert("❌ حدث خطأ أثناء التفعيل.");
    }
};

window.rejectNewClinic = async function(clinicId, adminEmail) {
    if(!confirm("هل أنت متأكد من رفض طلب هذه العيادة وحذف بياناتها نهائياً؟ (لا يمكن التراجع)")) return;
    try {
        const batch = db.batch();
        
        // 1. مسح كود الدخول
        const codeSnap = await db.collection("clinicId").where("clinicId", "==", clinicId).get();
        codeSnap.forEach(doc => batch.delete(doc.ref));
        
        // 2. مسح المستخدم
        if (adminEmail) batch.delete(db.collection("Users").doc(adminEmail));
        
        // 3. مسح العيادة
        batch.delete(db.collection("Clinics").doc(clinicId));
        
        await batch.commit();
        alert("🗑️ تم رفض الطلب ومسح العيادة الوهمية بنجاح.");
    } catch (error) {
        console.error(error);
        alert("❌ حدث خطأ أثناء الحذف.");
    }
};

async function approvePendingPayment(requestId, clinicId, pkgType, price) {
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const c = window.superLang;
    if(!confirm(c.msgApprove || "هل أنت متأكد من استلام المبلغ وتفعيل باقة هذه العيادة؟")) return;

    if (window.showLoader) window.showLoader(isAr ? "جاري تفعيل الحساب وإرسال الإشعار..." : "Activating...");

    try {
        // 1. تحديد حصص الباقة
        let maxU = 5, maxP = 10000, maxW = 500, monthsToAdd = 1;
        if(pkgType === 'quarterly') { maxU = 10; maxP = 20000; maxW = 2000; monthsToAdd = 3; }
        else if(pkgType === 'yearly') { maxU = 25; maxP = 50000; maxW = 5000; monthsToAdd = 12; }
        else if(pkgType === 'lifetime') { maxU = 50; maxP = 100000; maxW = 10000; monthsToAdd = 1200; } 

        const nextPayDate = new Date();
        nextPayDate.setMonth(nextPayDate.getMonth() + monthsToAdd); 

        // 2. تفعيل العيادة وتحديث البيانات
        await db.collection("Clinics").doc(clinicId).update({
            status: 'active', package: pkgType, planType: firebase.firestore.FieldValue.delete(), 
            maxUsers: maxU, maxPatients: maxP, maxWhatsapp: maxW, subPrice: price,
            nextPaymentDate: nextPayDate, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 3. إغلاق الطلب المعلق
        await db.collection("PendingPayments").doc(requestId).update({
            status: "مقبول", approvedAt: firebase.firestore.FieldValue.serverTimestamp(), approvedBy: currentNivaRole
        });

        // 💌 4. إرسال الإشعار الجميل للعيادة 💌
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        let pkgLabel = c[pkgType === 'yearly' ? 'pkgElite' : 'pkgPro'] || pkgType;

        await db.collection("Notifications").add({
            clinicId: clinicId,
            branchId: 'main', 
            title: isAr ? "🎉 تم تفعيل باقتك بنجاح!" : "🎉 Subscription Activated!",
            message: isAr ? `مرحباً بك في NivaDent 💙! تم تأكيد استلام اشتراكك بقيمة ${price} ج.م وتفعيل باقة (${pkgLabel}). نتمنى لك تجربة عمل مميزة معنا.` : `Payment of ${price} EGP received. Package (${pkgLabel}) is now active. Thank you for trusting NivaDent! 💙`,
            type: "success",
            isRead: false,
            date: todayStr, 
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 5. تسجيل الحركة في الرادار الخاص بك
        logToSystemAudit('success', `تم قبول الدفع وتفعيل باقة (${pkgLabel}) بمبلغ ${price} ج.م وإرسال إشعار ترحيبي للعيادة.`, clinicId);
        
        alert(c.actSuccess || "✅ تم التفعيل بنجاح وإرسال الإشعار للعيادة!");
    } catch (e) {
        console.error("Approval Error:", e);
        alert(c.actError || "❌ حدث خطأ أثناء التفعيل.");
    } finally {
        if (window.hideLoader) window.hideLoader();
    }
}

async function rejectPendingPayment(requestId) {
    const c = window.superLang;
    if(!confirm(c.msgReject || "هل أنت متأكد من الرفض؟")) return;
    try {
        await db.collection("PendingPayments").doc(requestId).update({
            status: "مرفوض", rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        logToSystemAudit('danger', `تم رفض إيصال/طلب دفع.`, "System");
    } catch(e) { console.error(e); }
}

// 🟢 4. المركز المالي (Revenue Hub)
function loadTransactions() {
    db.collection("PendingPayments").where("status", "==", "مقبول").orderBy("approvedAt", "desc").onSnapshot(snap => {
        const tbody = document.getElementById('transactionsBody');
        const revenueEl = document.getElementById('stat-total-revenue');
        const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
        const c = window.superLang;
        
        if(!tbody) return;
        let totalRevenue = 0; let html = '';

        if (snap.empty) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">${isAr?'لا توجد معاملات مالية محصلة حتى الآن.':'No transactions yet.'}</td></tr>`;
            if(revenueEl) revenueEl.innerText = '0';
            return;
        }

        snap.forEach(doc => {
            const t = doc.data();
            totalRevenue += Number(t.price) || 0;
            let dateStr = t.approvedAt ? new Date(t.approvedAt.toDate()).toLocaleDateString() : '---';
            let method = t.referenceNumber ? (isAr ? 'مرجعي/إنستاباي' : 'Ref/InstaPay') : (isAr ? 'إيصال/تحويل' : 'Manual Receipt');
            let pkgLabel = c[t.packageType === 'yearly' ? 'pkgElite' : 'pkgPro'] || t.packageType;

            // 🔴 جلب اسم العيادة الحقيقي للمركز المالي وجعلها قابلة للضغط
            const matchedClinic = allClinicsList.find(clinic => clinic.id === t.clinicId);
            const realClinicName = matchedClinic ? matchedClinic.clinicName : t.clinicId;

            html += `
                <tr>
                    <td style="color: #64748b; font-size: 13px;">${dateStr}</td>
                    <td><a class="clinic-link" onclick="openClinicDetailsModal('${t.clinicId}')" style="cursor: pointer; color: #0ea5e9; font-weight: bold; font-size: 14px; text-decoration: none;">🏢 ${realClinicName}</a></td>
                    <td><span style="background: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 12px;">${pkgLabel}</span></td>
                    <td style="font-weight: bold; color: #10b981;">${t.price} ج.م</td>
                    <td style="color: #475569;"><span style="font-size: 16px;">📱</span> ${method}</td>
                    <td><span style="background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: bold;">${isAr?'مكتمل':'Completed'} ✅</span></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        if(revenueEl) revenueEl.innerText = Math.round(totalRevenue).toLocaleString();
        updateRevenueChart(snap.docs);
    });
}

function updateRevenueChart(docs) {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    const monthlyData = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    docs.forEach(doc => {
        const d = doc.data();
        if(d.approvedAt) {
            const date = new Date(d.approvedAt.toDate());
            const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if(!monthlyData[key]) monthlyData[key] = 0;
            monthlyData[key] += Number(d.price) || 0;
        }
    });

    const labels = Object.keys(monthlyData).reverse();
    const data = Object.values(monthlyData).reverse();

    const ctx = canvas.getContext('2d');
    if (revChartInstance) revChartInstance.destroy();
    
    revChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : [isAr?'لا توجد بيانات':'No Data'],
            datasets: [{
                label: isAr ? 'الإيرادات المحصلة' : 'Revenue',
                data: data.length > 0 ? data : [0],
                borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 3, fill: true, tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

// 🟢 5. النوافذ الذكية لكروت الـ Dashboard
async function openKpiDetails(type) {
    const modal = document.getElementById('kpiDetailsModal');
    const thead = document.getElementById('kpi-modal-thead');
    const tbody = document.getElementById('kpi-modal-tbody');
    const title = document.getElementById('kpi-modal-title');
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';

    if(!modal || !thead || !tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">${isAr?'جاري جلب البيانات...':'Fetching data...'}</td></tr>`;
    modal.style.display = 'flex';

    try {
        if (type === 'expired_subs') {
            title.innerText = isAr ? '🛑 قائمة الاشتراكات المنتهية' : 'Expired Subscriptions';
            thead.innerHTML = isAr ? `<th>العيادة</th><th>تاريخ الانتهاء</th><th>الإيميل</th><th>الموبايل</th>` : `<th>Clinic</th><th>Expired At</th><th>Email</th><th>Phone</th>`;
            const expired = allClinicsList.filter(c => c.status === 'expired' || c.status === 'suspended');
            if(expired.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">${isAr?'لا يوجد عيادات منتهية.':'No expired clinics.'}</td></tr>`; return; }
            
            let html = '';
            expired.forEach(c => {
                let dateStr = c.nextPaymentDate ? new Date(c.nextPaymentDate.toDate ? c.nextPaymentDate.toDate() : c.nextPaymentDate).toLocaleDateString() : '---';
                html += `<tr><td><strong style="color:#ef4444;">${c.clinicName}</strong></td><td dir="ltr">${dateStr}</td><td>${c.adminEmail}</td><td>${c.phone1 || c.adminPhone || '---'}</td></tr>`;
            });
            tbody.innerHTML = html;
        } 
        else if (type === 'expiring_soon') {
            title.innerText = isAr ? '⚠️ عيادات ينتهي اشتراكها قريباً (أقل من 3 أيام)' : 'Expiring Soon (< 3 days)';
            thead.innerHTML = isAr ? `<th>العيادة</th><th>تاريخ الانتهاء</th><th>الباقة</th><th>الإيميل</th>` : `<th>Clinic</th><th>Exp Date</th><th>Package</th><th>Email</th>`;
            const now = new Date();
            const soon = allClinicsList.filter(c => {
                if(!c.nextPaymentDate || c.status !== 'active') return false;
                const npDate = new Date(c.nextPaymentDate.toDate ? c.nextPaymentDate.toDate() : c.nextPaymentDate);
                const diffDays = Math.ceil((npDate - now) / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 3;
            });

            if(soon.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">${isAr?'الوضع آمن. لا توجد باقات ستنتهي قريباً.':'Safe. No clinics expiring soon.'}</td></tr>`; return; }
            let html = '';
            soon.forEach(c => {
                let dateStr = c.nextPaymentDate ? new Date(c.nextPaymentDate.toDate ? c.nextPaymentDate.toDate() : c.nextPaymentDate).toLocaleDateString() : '---';
                html += `<tr><td><strong style="color:#d97706;">${c.clinicName}</strong></td><td dir="ltr" style="font-weight:bold;">${dateStr}</td><td>${c.package}</td><td>${c.adminEmail}</td></tr>`;
            });
            tbody.innerHTML = html;
        }
        else if (type === 'clinic_staff') {
            title.innerText = isAr ? '👨‍💻 إحصائية موظفي العيادات (عينة نشطة)' : 'Clinic Staff Stats';
            thead.innerHTML = isAr ? `<th>الاسم</th><th>العيادة</th><th>الوظيفة</th><th>الحالة</th>` : `<th>Name</th><th>Clinic</th><th>Role</th><th>Status</th>`;
            
            const usersSnap = await db.collection("Users").orderBy("createdAt", "desc").limit(50).get();
            if(usersSnap.empty) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">${isAr?'لا يوجد مستخدمين.':'No users.'}</td></tr>`; return; }

            let html = '';
            usersSnap.forEach(doc => {
                const u = doc.data();
                const clinicName = allClinicsList.find(c => c.id === u.clinicId)?.clinicName || u.clinicId;
                let statusHtml = u.isOnline ? `<span style="color:#10b981;">${isAr?'متصل':'Online'}</span>` : `<span style="color:#94a3b8;">${isAr?'غير متصل':'Offline'}</span>`;
                html += `<tr><td><strong>${u.name || u.email}</strong></td><td>${clinicName}</td><td>${u.role}</td><td>${statusHtml}</td></tr>`;
            });
            tbody.innerHTML = html;
            document.getElementById('stat-clinic-staff').innerText = '+'+usersSnap.size;
        }
    } catch(e) {
        console.error("Modal Data Error:", e);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">${isAr?'حدث خطأ أثناء جلب البيانات.':'Error loading data.'}</td></tr>`;
    }
}
