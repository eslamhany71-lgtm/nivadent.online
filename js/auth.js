// auth.js - Al Dokan ERP Cloud System - Full Security & Fixed Premature Redirect

const auth = firebase.auth();
const db = firebase.firestore();
let isLoginInProgress = false; 

// ==========================================
// 🔴 1. مراقب حالة الدخول (الحارس المحصن ضد التسرع) 🔴
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        // 🔴 الضربة القاضية: لو اليوزر بيعمل حساب تجريبي أو "بيسجل دخول حالاً"، نمنع الحارس من التوجيه الإجباري!
        if (sessionStorage.getItem('isRegistering') === 'true' || isLoginInProgress === true) {
            console.log("⏳ الدالة الأساسية تعمل.. الحارس في وضع الانتظار.");
            return; 
        }

        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
            // استخدام href بدلاً من replace لعدم استفزاز ذاكرة الآيفون
            window.location.href = 'home.html';
        }
    } else {
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && window.location.pathname !== '') {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }
    }
});

function requestNotificationPermission() {
    if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") console.log("تم تفعيل إذن التنبيهات");
            });
        }
    }
}

async function logout() {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email) {
        try {
            await db.collection("Users").doc(currentUser.email).update({
                isOnline: false,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {}
    }
    
    await auth.signOut();
    sessionStorage.clear();
    localStorage.removeItem('lastActiveNiva');
    localStorage.removeItem('niva_logged_in'); // 🔴 خلع وتد الأمان عند الخروج
    window.location.replace("index.html");
}

// ==========================================
// 🚀 2. دالة تسجيل الدخول (الأساسية) 🚀
// ==========================================
async function loginById() {
    const codeInput = document.getElementById('empCode');
    const passInput = document.getElementById('password');
    const errorDiv = document.getElementById('errorMessage');

    if (!codeInput || !passInput) return;

    const rawInput = codeInput.value.trim().toLowerCase(); 
    const pass = passInput.value.trim();

    if (!rawInput || !pass) { 
        if (errorDiv) errorDiv.innerText = document.body.dir === 'rtl' ? "برجاء إكمال البيانات" : "Please complete data"; 
        return; 
    }

    const btn = document.getElementById('btn-login');
    if (btn) { btn.innerText = "..."; btn.disabled = true; }

    isLoginInProgress = true; 
    if (window.showLoader) window.showLoader(document.body.dir === 'rtl' ? "جاري التحقق من البيانات..." : "Checking credentials...");

    try {
        let loginEmail = rawInput;
        let usedCode = rawInput;

        if (!rawInput.includes('@')) {
            const empDoc = await db.collection("clinicId").doc(rawInput).get();
            if (!empDoc.exists || !empDoc.data().email) throw { code: 'custom/user-not-found' }; 
            loginEmail = empDoc.data().email;
        }

        // 🔴 التعديل السحري: LOCAL بدلاً من SESSION لضمان بقاء الحساب على الآيفون 🔴
        await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

        const userCredential = await auth.signInWithEmailAndPassword(loginEmail, pass);
        const actualEmail = userCredential.user.email;

        const userDoc = await db.collection("Users").doc(actualEmail).get();
        if (!userDoc.exists) throw { code: 'custom/user-not-found' };
        
        const userData = userDoc.data();
        const targetClinicId = userData.clinicId || 'default';
        const targetBranchId = userData.branchId || 'main'; 
        const finalRole = userData.role;
        const userPermissions = userData.permissions || {}; 

        if(rawInput.includes('@')) usedCode = userData.empCode || rawInput;

        if (targetClinicId !== 'default' && finalRole !== 'superadmin') {
            const clinicDoc = await db.collection("Clinics").doc(targetClinicId).get();
            if (clinicDoc.exists) {
                const clinicStatus = clinicDoc.data().status;
                if (clinicStatus === 'suspended') {
                    await auth.signOut();
                    throw { code: 'custom/suspended-clinic' };
                }
            }
        }

        await db.collection("Users").doc(actualEmail).update({
            isOnline: true,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });

        sessionStorage.setItem('userRole', finalRole);
        sessionStorage.setItem('empCode', usedCode);
        sessionStorage.setItem('clinicId', targetClinicId);
        sessionStorage.setItem('branchId', targetBranchId); 
        sessionStorage.setItem('userPermissions', JSON.stringify(userPermissions));

        
        // 🔴 زراعة وتد الأمان قبل التحويل للآيفون
        localStorage.setItem('niva_logged_in', 'true');
        // 🔴 خدعة الآيفون: تأخير التوجيه 800 مللي ثانية للسماح للفايربيز بحفظ الجلسة في الـ IndexedDB
        setTimeout(() => {
            window.location.href = "home.html"; 
        }, 800); 

    } catch (error) {
        if (window.hideLoader) window.hideLoader();
        await auth.signOut().catch(()=>{}); 
        isLoginInProgress = false; 
        
        if (btn) {
            btn.innerText = document.body.dir === 'rtl' ? "تسجيل الدخول" : "Login";
            btn.disabled = false;
        }
        if (errorDiv) {
            const isRtl = document.body.dir === 'rtl';
            if (error.code === 'custom/suspended-clinic') {
                errorDiv.innerText = isRtl ? "عفواً، حساب هذه العيادة موقوف مؤقتاً." : "Account suspended.";
            } else if (error.code === 'auth/user-not-found' || error.code === 'custom/user-not-found' || error.code === 'auth/wrong-password') {
                errorDiv.innerText = isRtl ? "خطأ في البريد/الكود أو كلمة المرور" : "Error in Email/Code or Password";
            } else {
                errorDiv.innerText = isRtl ? "خطأ في عملية الدخول" : "Login error occurred";
            }
        }
    }
}


// ==========================================
// إنشاء حساب تجريبي مجاني (بنظام OTP المزدوج)
// ==========================================
let confirmationResultGlobal = null; 

function openTrialModal() {
    document.getElementById('trial_clinic_name').value = '';
    document.getElementById('trial_admin_name').value = '';
    document.getElementById('trial_phone').value = '';
    document.getElementById('trial_email').value = '';
    document.getElementById('trial_password').value = '';
    document.getElementById('otp_code_input').value = '';
    
    document.getElementById('step-1-data').style.display = 'block';
    document.getElementById('step-2-otp').style.display = 'none';
    document.getElementById('trialModal').style.display = 'flex';

    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'normal', 
            'callback': (response) => { console.log("✅ الكابتشا اتحلت!"); }
        });
    }
}

function closeTrialModal() { document.getElementById('trialModal').style.display = 'none'; }

function cancelOTP() {
    document.getElementById('step-2-otp').style.display = 'none';
    document.getElementById('step-1-data').style.display = 'block';
    document.getElementById('otp_code_input').value = '';
}

window.sendOTP = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-trial');
    const phone = document.getElementById('trial_phone').value.trim();
    const password = document.getElementById('trial_password').value;

    if (phone.length !== 11) { alert("❌ رقم الموبايل يجب أن يكون 11 رقم بالضبط."); return; }
    
    const syndicateId = document.getElementById('trial_syndicate_id').value.trim();
    const syndicateRegex = /^[1-9][0-9]{2,5}$/;
    
    if (!syndicateRegex.test(syndicateId)) {
        alert("❌ يرجى إدخال رقم قيد نقابي صحيح (يجب أن يحتوي على أرقام فقط، ولا يقل عن 3 ولا يزيد عن 6 أرقام).");
        return; 
    }

    const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$");
    if (!strongRegex.test(password)) {
        alert("❌ كلمة المرور ضعيفة! يجب ألا تقل عن 8 أحرف، وتحتوي على حرف كبير، حرف صغير، رقم، ورمز.");
        return; 
    }

    btn.disabled = true;
    btn.innerText = "جاري إرسال الكود...";
    const formattedPhone = "+20" + phone.substring(1); 

    try {
        auth.settings.appVerificationDisabledForTesting = true;

        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { 'size': 'invisible' });
        }
        
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await auth.signInWithPhoneNumber(formattedPhone, appVerifier);
        
        confirmationResultGlobal = confirmationResult; 

        document.getElementById('step-1-data').style.display = 'none';
        document.getElementById('step-2-otp').style.display = 'block';

    } catch (error) {
        console.error("SMS Error:", error);
        alert("❌ فشل إرسال الكود: " + error.message);
        
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
        }
    } finally {
        btn.disabled = false;
        btn.innerText = "تأكيد وإرسال كود التفعيل 📱";
    }
}

window.verifyOTPAndRegister = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-verify-otp');
    const otpCode = document.getElementById('otp_code_input').value.trim();

    if (otpCode.length !== 6) { alert("❌ يرجى إدخال الكود المكون من 6 أرقام بشكل صحيح."); return; }

    sessionStorage.setItem('isRegistering', 'true');
    btn.disabled = true;
    btn.innerText = "جاري التحقق وإنشاء العيادة...";

    try {
        await confirmationResultGlobal.confirm(otpCode);
        console.log("✅ الهاتف موثق بنجاح!");

        const clinicName = document.getElementById('trial_clinic_name').value.trim();
        const adminName = document.getElementById('trial_admin_name').value.trim();
        const phone = document.getElementById('trial_phone').value.trim();
        const email = document.getElementById('trial_email').value.trim().toLowerCase();
        const password = document.getElementById('trial_password').value;
        const syndicateId = document.getElementById('trial_syndicate_id').value.trim(); 

        // 🔴 حماية الجلسة أثناء الإنشاء 🔴
        await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const actualEmail = userCredential.user.email;

        const accessCode = Math.floor(10000 + Math.random() * 90000).toString();
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7); 

        const clinicRef = await db.collection("Clinics").add({
            clinicName: clinicName, adminEmail: actualEmail, phone1: phone,
            status: 'active', package: 'trial_7', maxUsers: 3, maxPatients: 500, maxWhatsapp: 50,    
            accessCode: accessCode, hasUsedTrial: true,
            syndicateId: syndicateId,
            nextPaymentDate: firebase.firestore.Timestamp.fromDate(expirationDate),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        const newClinicId = clinicRef.id;

        await db.collection("clinicId").doc(accessCode).set({
            clinicId: newClinicId, name: clinicName, phone: phone, email: actualEmail, role: "admin", activated: true
        });

        await db.collection("Users").doc(actualEmail).set({
            role: 'admin', name: adminName, empCode: 'TRIAL-ADMIN', email: actualEmail, clinicId: newClinicId, branchId: 'main', 
            permissions: { patients: true, calendar: true, finances: true, inventory: true, reports: true, settings: true, services: true, contracts: true, branches: true, hr: true, notifications: true },
            isOnline: true, lastLogin: firebase.firestore.FieldValue.serverTimestamp(), createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        sessionStorage.setItem('userRole', 'admin');
        sessionStorage.setItem('empCode', 'TRIAL-ADMIN');
        sessionStorage.setItem('clinicId', newClinicId);
        sessionStorage.setItem('branchId', 'main'); 

        alert(`✅ مبروك يا دكتور ${adminName}!\nتم توثيق الرقم وتفعيل العيادة بنجاح.\n🔑 كود العيادة الخاص بك للدخول هو: [ ${accessCode} ]`);
        
        sessionStorage.removeItem('isRegistering');
        window.location.replace("home.html");

    } catch (error) {
        sessionStorage.removeItem('isRegistering');
        console.error("OTP or Registration Error:", error);
        alert("❌ الكود غير صحيح أو حدث خطأ: " + error.message);
        btn.disabled = false;
        btn.innerText = "تحقق وإنشاء الحساب 🚀";
    }
}

// ==========================================
// دوال تفعيل حساب موظف (الممرضة/الدكتور)
// ==========================================
function openStaffModal() {
    document.getElementById('staffInviteCode').value = '';
    document.getElementById('staffEmail').value = '';
    document.getElementById('staffPassword').value = '';
    document.getElementById('staffModal').style.display = 'flex';
}

function closeStaffModal() { document.getElementById('staffModal').style.display = 'none'; }

async function activateStaffAccount(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-activate-staff');
    btn.disabled = true;
    btn.innerText = "جاري فحص الكود والتفعيل...";

    const inviteCode = document.getElementById('staffInviteCode').value.trim().toUpperCase(); 
    const newEmail = document.getElementById('staffEmail').value.trim().toLowerCase();
    const newPassword = document.getElementById('staffPassword').value.trim();

    if (window.showLoader) window.showLoader("جاري فحص الكود...");

    try {
        const inviteDoc = await db.collection("InviteCodes").doc(inviteCode).get();

        if (!inviteDoc.exists) {
            if (window.hideLoader) window.hideLoader();
            alert("❌ كود الدعوة غير صحيح أو غير مسجل في النظام.");
            btn.disabled = false; btn.innerText = "تفعيل الحساب والدخول";
            return;
        }

        const inviteData = inviteDoc.data();

        if (inviteData.activated) {
            if (window.hideLoader) window.hideLoader();
            alert("❌ هذا الكود تم استخدامه وتفعيله مسبقاً.");
            btn.disabled = false; btn.innerText = "تفعيل الحساب والدخول";
            return;
        }

        isLoginInProgress = true;
        if (window.showLoader) window.showLoader("جاري تفعيل الحساب...");

        // 🔴 التعديل السحري للموظف 🔴
        await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        await auth.createUserWithEmailAndPassword(newEmail, newPassword);

        const assignedBranch = inviteData.branchId || 'main';
        
        let defaultPerms = { patients: false, calendar: false, finances: false, inventory: false, reports: false, settings: false, services: false, contracts: false, branches: false, hr: false, notifications: false };
        if (inviteData.role === 'admin') defaultPerms = { patients: true, calendar: true, finances: true, inventory: true, reports: true, settings: true, services: true, contracts: true, branches: true, hr: true, notifications: true };
        else if (inviteData.role === 'doctor') defaultPerms = { ...defaultPerms, patients: true, calendar: true, inventory: true };
        else if (inviteData.role === 'receptionist') defaultPerms = { ...defaultPerms, patients: true, calendar: true, finances: true };
        else defaultPerms = { ...defaultPerms, patients: true, calendar: true, inventory: true };

        await db.collection("Users").doc(newEmail).set({
            name: inviteData.name, email: newEmail, role: inviteData.role, 
            clinicId: inviteData.clinicId, branchId: assignedBranch, permissions: defaultPerms,
            empCode: inviteCode, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isOnline: true, lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection("InviteCodes").doc(inviteCode).update({
            activated: true, activatedByEmail: newEmail, activatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        sessionStorage.setItem('userRole', inviteData.role);
        sessionStorage.setItem('empCode', inviteCode);
        sessionStorage.setItem('clinicId', inviteData.clinicId);
        sessionStorage.setItem('branchId', assignedBranch); 
        sessionStorage.setItem('userPermissions', JSON.stringify(defaultPerms));

        if (window.hideLoader) window.hideLoader();
        alert(`✅ تم تفعيل الحساب بنجاح يا ${inviteData.name}!\nجاري تحويلك للعيادة...`);
        
if (window.showLoader) window.showLoader("جاري التحويل...");
        setTimeout(() => {
            window.location.replace("home.html");
        }, 800);

    } catch (error) {
        if (window.hideLoader) window.hideLoader();
        console.error("Staff Activation Error:", error);
        isLoginInProgress = false;
        btn.disabled = false; btn.innerText = "تفعيل الحساب والدخول";
        
        if (error.code === 'auth/email-already-in-use') alert("❌ هذا البريد الإلكتروني مستخدم بالفعل في حساب آخر.");
        else if (error.code === 'auth/weak-password') alert("❌ كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل.");
        else alert("❌ حدث خطأ أثناء التفعيل: " + error.message);
    }
}

function openResetModal() {
    const emailInput = document.getElementById('resetEmailInput');
    const modal = document.getElementById('resetModal');
    if (emailInput) emailInput.value = "";
    if (modal) modal.style.display = "flex";
}
function closeResetModal() {
    const modal = document.getElementById('resetModal');
    if (modal) modal.style.display = "none";
}

async function sendResetLink(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmailInput').value;
    const btn = document.getElementById('btn-send-reset');
    const lang = localStorage.getItem('preferredLang') || 'ar';
    
    if (btn) { btn.disabled = true; btn.innerText = lang === 'ar' ? "جاري الإرسال..." : "Sending..."; btn.style.opacity = "0.7"; }
    try {
        await auth.sendPasswordResetEmail(email);
        alert(lang === 'ar' ? "تم إرسال رابط استعادة كلمة المرور بنجاح! يرجى مراجعة صندوق الوارد الخاص بك (أو مجلد Spam)." : "Password reset link sent successfully! Please check your inbox (or Spam folder).");
        closeResetModal();
    } catch (error) {
        if (error.code === 'auth/user-not-found') alert(lang === 'ar' ? "هذا البريد الإلكتروني غير مسجل في النظام." : "This email is not registered.");
        else if (error.code === 'auth/invalid-email') alert(lang === 'ar' ? "صيغة البريد الإلكتروني غير صحيحة." : "Invalid email format.");
        else alert((lang === 'ar' ? "حدث خطأ: " : "Error: ") + error.message);
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = lang === 'ar' ? "إرسال رابط الاستعادة" : "Send Reset Link"; btn.style.opacity = "1"; }
    }
}

async function activateAccount() {
    const codeRaw = document.getElementById('reg-code').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const realEmail = document.getElementById('reg-email').value.trim().toLowerCase();
    const pass = document.getElementById('reg-pass').value.trim();
    const msg = document.getElementById('reg-msg');

    if(!codeRaw || !phone || !realEmail || !pass) { 
        if(msg) msg.innerText = document.body.dir === 'rtl' ? "برجاء إكمال كافة البيانات" : "Please complete all fields"; 
        return; 
    }

    if (window.showLoader) window.showLoader(document.body.dir === 'rtl' ? "جاري فحص البيانات..." : "Checking data...");

    try {
        if(msg) msg.innerText = document.body.dir === 'rtl' ? "جاري فحص البيانات..." : "Checking data...";
        const empDoc = await db.collection("clinicId").doc(codeRaw).get();

        if (!empDoc.exists) {
            if(window.hideLoader) window.hideLoader();
            if(msg) msg.innerText = document.body.dir === 'rtl' ? "الكود غير مسجل، راجع إدارة النظام" : "Code not registered, contact admin"; 
            return;
        }

        const empData = empDoc.data();
        
        // ==========================================
        // 🔒 القفل المزدوج لمنع اختراق الحسابات المفعلة
        // ==========================================
        // هنفحص لو الحساب متفعل سواء كان Boolean أو String، وهنفحص لو ليه إيميل مسجل مسبقاً
        const isActivated = empData.activated === true || empData.activated === "true";
        const hasEmailAssigned = empData.email && empData.email.trim() !== "";

        if (isActivated || hasEmailAssigned) {
            if(window.hideLoader) window.hideLoader();
            if(msg) msg.innerText = document.body.dir === 'rtl' ? "هذا الكود مستخدم ومفعل بالفعل ولا يمكن إعادة استخدامه!" : "This code is already activated and cannot be reused!"; 
            return; // 🔴 طرد فوري ومنع تنفيذ باقي الكود
        }
        // ==========================================

        if (empData.phone !== phone) {
            if(window.hideLoader) window.hideLoader();
            if(msg) msg.innerText = document.body.dir === 'rtl' ? "رقم الموبايل غير مطابق للسجلات" : "Phone number does not match records"; 
            return;
        }

        if(window.showLoader) window.showLoader(document.body.dir === 'rtl' ? "جاري إنشاء الحساب..." : "Creating account...");
        if(msg) msg.innerText = document.body.dir === 'rtl' ? "جاري إنشاء الحساب... برجاء الانتظار" : "Creating account... Please wait";

        isLoginInProgress = true;
        
        // 🔴 التعديل السحري هنا أيضاً 🔴
        await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        await auth.createUserWithEmailAndPassword(realEmail, pass);
        
        await db.collection("Users").doc(realEmail).set({
            role: (empData.role || "admin").toLowerCase().trim(),
            name: empData.name, empCode: codeRaw, email: realEmail, clinicId: empData.clinicId || 'default', branchId: 'main', 
            permissions: { patients: true, calendar: true, finances: true, inventory: true, reports: true, settings: true, services: true, contracts: true, branches: true, hr: true, notifications: true }
        });

        // هنا بنأكد على الفايربيز إنه يحفظها كـ Boolean حقيقي عشان متعملش مشاكل بعد كده
        await db.collection("clinicId").doc(codeRaw).update({ activated: true, email: realEmail });

        if(window.hideLoader) window.hideLoader();
        if(msg) msg.innerText = document.body.dir === 'rtl' ? "تم التفعيل بنجاح! جاري تحويلك..." : "Activation successful! Redirecting...";
        
        setTimeout(() => { 
            if(window.showLoader) window.showLoader(document.body.dir === 'rtl' ? "جاري التحويل..." : "Redirecting...");
            window.location.replace("index.html"); 
        }, 1500);

    } catch (error) {
        if(window.hideLoader) window.hideLoader();
        isLoginInProgress = false;
        if(msg) {
            const isRtl = document.body.dir === 'rtl';
            if (error.code === 'auth/email-already-in-use') msg.innerText = isRtl ? "هذا البريد الإلكتروني مستخدم بالفعل" : "Email already in use";
            else if (error.code === 'auth/invalid-email') msg.innerText = isRtl ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format";
            else msg.innerText = (isRtl ? "خطأ: " : "Error: ") + error.message;
        }
    }
}

// 🔴 دوال الترجمة ومودال الخصوصية 🔴
function openPrivacyModal() { document.getElementById('privacyModal').style.display = 'flex'; }
function closePrivacyModal() { document.getElementById('privacyModal').style.display = 'none'; }

function updatePageContent(lang) {
    const currentYear = new Date().getFullYear();
    const translations = {
        ar: {
            title: "تسجيل الدخول - نظام NivaDent", welcome: "أهلاً بك في NivaDent", subLogin: "قم بتسجيل الدخول لإدارة عيادتك",
            code: "البريد الإلكتروني أو كود العيادة", pass: "كلمة المرور", btn: "تسجيل الدخول", newEmp: "حساب جديد؟", actLink: "تفعيل حساب العيادة من هنا",
            brandTitle: "NivaDent", brandDesc: "النظام السحابي الأذكى لإدارة عيادات طب الأسنان من إنتاج Start Online Agency. صُمم لرفع كفاءة العيادة، تنظيم المواعيد، وإدارة ملفات المرضى باحترافية وسهولة.",
            feat1: "✔️ ملف طبي ذكي وأشعة", feat2: "✔️ إدارة الجلسات والمواعيد", feat3: "✔️ روشتات وحسابات دقيقة",
            forgotPass: "نسيت كلمة المرور؟", resetTitle: "استعادة كلمة المرور", resetSub: "أدخل بريدك الإلكتروني المسجل لدينا، وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.",
            btnReset: "إرسال رابط الاستعادة", emailPlaceholder: "أدخل البريد الإلكتروني",
            actPageTitle: "تفعيل الحساب - NivaDent", actWelcome: "تفعيل حساب العيادة", actSub: "يرجى إدخال البيانات المسجلة لدى إدارة النظام",
            actCode: "كود الدخول", actPhone: "رقم الموبايل", actPass: "اختر كلمة مرور جديدة", btnAct: "تفعيل الحساب الآن",
            backLoginStr: "لديك حساب بالفعل؟", backLoginLink: "العودة للدخول", brandActTitle: "أهلاً بك في NivaDent",
            brandActDesc: "يسعدنا انضمامك. قم بتفعيل حسابك للوصول إلى لوحة تحكم عيادتك وإدارة مواعيدك وملفات مرضاك بكل سهولة.", actEmail: "البريد الإلكتروني للعيادة",
            staffInvite: " لدي كود دعوة (تفعيل حساب موظف)", btnTrialTxt: "ابدأ فترة تجريبية مجانية (7 أيام)", 
            copyright: `© ${currentYear} Start Online Agency. جميع الحقوق محفوظة.`, privacy: "سياسة الخصوصية والتأمين (Privacy Policy)", poweredBy: "Powered by",
            mTrialTitle: " إنشاء حساب تجريبي", mTrialSub: "جرب النظام بكامل مميزاته مجاناً لمدة 7 أيام", 
            lTClinic: "اسم العيادة", pTClinic: "مثال: عيادة النور لطب الأسنان", lTAdmin: "اسم الطبيب / المدير", pTAdmin: "الاسم بالكامل",
            lTPhone: "رقم الموبايل للتواصل", pTPhone: "01xxxxxxxxx", lTEmail: "البريد الإلكتروني (للدخول)", pTEmail: "clinic@example.com",
            lTPass: "كلمة المرور (6 أحرف أو أكثر)", pTPass: "********", btnSubmitTrial: "إنشاء الحساب وبدء التجربة",
            mPrivTitle: "سياسة الخصوصية وتأمين البيانات", privH1: "1. سرية السجلات الطبية", privP1: "نحن في Start Online Agency ندرك تماماً حساسية السجلات الطبية. جميع بيانات مرضاك (التشخيص، الأشعة، المديونيات) مشفرة ومحفوظة في قواعد بيانات سحابية آمنة لا يمكن لأي طرف ثالث الاطلاع عليها.",
            privH2: "2. النسخ الاحتياطي التلقائي (Cloud Backup)", privP2: "لا داعي للقلق من فقدان البيانات. يقوم النظام بعمل نسخ احتياطي تلقائي ولحظي للبيانات. في حالة فقدان جهازك أو تغييره، ستجد جميع بيانات عيادتك كما هي بمجرد تسجيل الدخول.",
            privH3: "3. حقوق الملكية الفكرية", privP3: "نظام NivaDent هو منتج برمجي مملوك بالكامل لشركة Start Online Agency. لا يجوز نسخ، إعادة بيع، أو هندسة عكسية لأي جزء من النظام دون إذن كتابي مسبق.",
            privH4: "4. استخدام البيانات للتطوير", privP4: "نحن لا نقوم ببيع أو مشاركة بيانات عيادتك مع أي جهة إعلانية. النظام يجمع فقط بعض الإحصائيات الفنية مجهولة المصدر لتحسين الأداء وسرعة النظام.", btnPrivOk: "موافق ومفهوم"
        },
        en: {
            title: "Login - NivaDent System", welcome: "Welcome to NivaDent", subLogin: "Sign in to manage your clinic",
            code: "Email or Access Code", pass: "Password", btn: "Login", newEmp: "New Account?", actLink: "Activate clinic account here",
            brandTitle: "NivaDent", brandDesc: "The smartest cloud system for dental practice management powered by Start Online Agency. Designed to increase efficiency, organize appointments, and manage patient records professionally.",
            feat1: "✔️ Smart Medical Records & X-Rays", feat2: "✔️ Appointments & Sessions Management", feat3: "✔️ E-Prescriptions & Accurate Billing",
            forgotPass: "Forgot Password?", resetTitle: "Reset Password", resetSub: "Enter your registered email, and we will send you a link to set a new password.",
            btnReset: "Send Reset Link", emailPlaceholder: "Enter email address",
            actPageTitle: "Activate Account - NivaDent", actWelcome: "Activate Clinic Account", actSub: "Please enter the data registered with the system administration",
            actCode: "Access Code", actPhone: "Mobile Number", actPass: "Choose a new password", btnAct: "Activate Account Now",
            backLoginStr: "Already have an account?", backLoginLink: "Back to Login", brandActTitle: "Welcome to NivaDent",
            brandActDesc: "We are glad you joined. Activate your account to access your clinic's dashboard, manage appointments, and track patient files easily.", actEmail: "Clinic Email Address",
            staffInvite: " I have an invite code (Staff)", btnTrialTxt: "Start Free Trial (7 Days)", 
            copyright: `© ${currentYear} Start Online Agency. All rights reserved.`, privacy: "Privacy Policy & Security", poweredBy: "Powered by",
            mTrialTitle: " Create Trial Account", mTrialSub: "Try full features free for 7 days", 
            lTClinic: "Clinic Name", pTClinic: "e.g., Al-Nour Dental Clinic", lTAdmin: "Doctor / Admin Name", pTAdmin: "Full Name",
            lTPhone: "Contact Phone", pTPhone: "01xxxxxxxxx", lTEmail: "Email (For Login)", pTEmail: "clinic@example.com",
            lTPass: "Password (Min 6 chars)", pTPass: "********", btnSubmitTrial: "Create Account & Start Trial",
            mPrivTitle: "Privacy Policy & Data Security", privH1: "1. Medical Records Confidentiality", privP1: "At Start Online Agency, we fully understand the sensitivity of medical records. All your patient data is encrypted and stored in secure cloud databases inaccessible to any third party.",
            privH2: "2. Automatic Cloud Backup", privP2: "No need to worry about data loss. The system performs automatic real-time backups. If your device is lost, you will find your clinic's data intact upon logging in.",
            privH3: "3. Intellectual Property Rights", privP3: "NivaDent is a software product fully owned by Start Online Agency. Copying, reselling, or reverse engineering any part of the system without prior written permission is prohibited.",
            privH4: "4. Data Usage for Development", privP4: "We do not sell or share your clinic's data with advertisers. The system only collects anonymous technical statistics to improve performance.", btnPrivOk: "I Understand & Agree"
        }
    };
    const t = translations[lang] || translations['ar'];
    document.body.dir = (lang === 'en') ? 'ltr' : 'rtl';
    const safeSetText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };
    const safeSetPlaceholder = (id, text) => { const el = document.getElementById(id); if (el) el.placeholder = text; };

    if (document.title.includes('دخول') || document.title.includes('Login')) document.title = t.title;
    safeSetText('txt-welcome', t.welcome); safeSetText('sub-login', t.subLogin); safeSetText('lbl-code', t.code);
    safeSetText('lbl-pass', t.pass); safeSetText('btn-login', t.btn); safeSetText('txt-new', t.newEmp);
    safeSetText('link-activate', t.actLink); safeSetText('txt-brand', t.brandTitle); safeSetText('brand-desc', t.brandDesc);
    safeSetText('feat-1', t.feat1); safeSetText('feat-2', t.feat2); safeSetText('feat-3', t.feat3);
    safeSetText('link-forgot', t.forgotPass); safeSetText('txt-reset-title', t.resetTitle); safeSetText('txt-reset-sub', t.resetSub);
    safeSetText('btn-send-reset', t.btnReset); safeSetPlaceholder('resetEmailInput', t.emailPlaceholder);
    if (document.title.includes('تفعيل') || document.title.includes('Activate')) document.title = t.actPageTitle;
    safeSetText('txt-act-welcome', t.actWelcome); safeSetText('txt-act-sub', t.actSub); safeSetText('lbl-act-code', t.actCode);
    safeSetText('lbl-act-phone', t.actPhone); safeSetText('lbl-act-pass', t.actPass); safeSetText('btn-activate', t.btnAct);
    safeSetText('txt-back-str', t.backLoginStr); safeSetText('link-back-login', t.backLoginLink); safeSetText('brand-act-title', t.brandActTitle);
    safeSetText('brand-act-desc', t.brandActDesc); safeSetText('lbl-act-email', t.actEmail);
    
    safeSetText('txt-staff-invite', t.staffInvite); safeSetText('btn-trial-txt', t.btnTrialTxt);
    safeSetText('txt-copyright', t.copyright); safeSetText('link-privacy', t.privacy); safeSetText('txt-powered', t.poweredBy);
    
    safeSetText('mod-trial-title', t.mTrialTitle); safeSetText('mod-trial-sub', t.mTrialSub);
    safeSetText('lbl-t-clinic', t.lTClinic); safeSetPlaceholder('trial_clinic_name', t.pTClinic);
    safeSetText('lbl-t-admin', t.lTAdmin); safeSetPlaceholder('trial_admin_name', t.pTAdmin);
    safeSetText('lbl-t-phone', t.lTPhone); safeSetPlaceholder('trial_phone', t.pTPhone);
    safeSetText('lbl-t-email', t.lTEmail); safeSetPlaceholder('trial_email', t.pTEmail);
    safeSetText('lbl-t-pass', t.lTPass); safeSetPlaceholder('trial_password', t.pTPass);
    safeSetText('btn-submit-trial', t.btnSubmitTrial);

    safeSetText('mod-priv-title', t.mPrivTitle);
    safeSetText('priv-h1', t.privH1); safeSetText('priv-p1', t.privP1);
    safeSetText('priv-h2', t.privH2); safeSetText('priv-p2', t.privP2);
    safeSetText('priv-h3', t.privH3); safeSetText('priv-p3', t.privP3);
    safeSetText('priv-h4', t.privH4); safeSetText('priv-p4', t.privP4);
    safeSetText('btn-priv-ok', t.btnPrivOk);
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    // جلب العنصر (الأيقونة) اللي جنب حقل الإدخال
    const icon = input.nextElementSibling;
    
    if (input.type === "password") {
        input.type = "text";
        icon.innerText = "visibility"; // عين مفتوحة
    } else {
        input.type = "password";
        icon.innerText = "visibility_off"; // عين مقفولة
    }
}

function checkPasswordStrength(password) {
    const bar = document.getElementById('pass-strength-bar');
    const label = document.getElementById('pass-strength-label');
    if (!bar || !label) return;
    
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';
    if (!password) { bar.style.width = '0%'; label.innerText = ''; return; }

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[a-z]/)) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 1;

    switch (strength) {
        case 0: case 1: case 2:
            bar.style.width = '33%'; bar.style.background = '#ef4444'; label.innerText = isAr ? 'ضعيفة 🔴' : 'Weak 🔴'; label.style.color = '#ef4444'; break;
        case 3: case 4:
            bar.style.width = '66%'; bar.style.background = '#f59e0b'; label.innerText = isAr ? 'متوسطة 🟡' : 'Medium 🟡'; label.style.color = '#f59e0b'; break;
        case 5:
            bar.style.width = '100%'; bar.style.background = '#10b981'; label.innerText = isAr ? 'قوية ✅' : 'Strong ✅'; label.style.color = '#10b981'; break;
    }
}
// ==========================================
// 🎨 نظام التنقل السينمائي بين الشاشات (Blur & Slide)
// ==========================================
function toggleAuthForms(target, event) {
    if (event) event.preventDefault(); // 🔴 منع المتصفح من القفز وتوليد خطأ 404

    const loginSec = document.getElementById('login-section');
    const actSec = document.getElementById('activate-section');
    const isAr = (localStorage.getItem('preferredLang') || 'ar') === 'ar';

    if (target === 'activate') {
        // خروج شاشة اللوجين
        loginSec.classList.remove('active', 'slide-in-right');
        loginSec.classList.add('slide-out-left');
        
        // دخول شاشة التفعيل (إزالة كلاسات الاختفاء إجبارياً) 🔴
        actSec.classList.remove('slide-out-left', 'slide-in-right');
        actSec.classList.add('active');
        
        // تغيير نصوص الماركة
        const brandTitle = document.getElementById('txt-brand');
        const brandDesc = document.getElementById('brand-desc');
        if(brandTitle) brandTitle.innerText = isAr ? "تفعيل حساب العيادة" : "Activate Clinic";
        if(brandDesc) brandDesc.innerText = isAr ? "قم بتفعيل حسابك للوصول إلى لوحة تحكم عيادتك وإدارة مواعيدك وملفات مرضاك بكل سهولة." : "Activate your account to access your clinic's dashboard.";
        
    } else {
        // خروج شاشة التفعيل
        actSec.classList.remove('active', 'slide-in-right');
        actSec.classList.add('slide-out-left');
        
        // عودة شاشة اللوجين (إزالة كلاسات الاختفاء إجبارياً) 🔴
        loginSec.classList.remove('slide-out-left', 'slide-in-right');
        loginSec.classList.add('active');

        const brandTitle = document.getElementById('txt-brand');
        const brandDesc = document.getElementById('brand-desc');
        if(brandTitle) brandTitle.innerText = "NivaDent";
        if(brandDesc) brandDesc.innerText = window.superLang ? window.superLang.brandDesc : (isAr ? "النظام السحابي الأذكى لإدارة عيادات طب الأسنان" : "The smartest cloud system for dental practice management");
    }
}

// تعديل بسيط عشان يقبل الـ ID بتاع حقل الباسوورد لو عندنا أكتر من واحد (Login و Activate)
window.togglePasswordVisibility = function(inputId = 'password') {
    const passInput = document.getElementById(inputId);
    const toggleIcon = passInput.nextElementSibling; // يجيب الأيقونة اللي جنبه
    if (passInput && toggleIcon) {
        if (passInput.type === 'password') { passInput.type = 'text'; toggleIcon.innerText = '🙈'; } 
        else { passInput.type = 'password'; toggleIcon.innerText = '👁️'; }
    }
}
