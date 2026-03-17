/**
 * @file KiTa Lummerland — i18n / Internationalisierung
 * @description Leichtgewichtiges Übersetzungssystem für die KiTa-App.
 *   Unterstützt: de, en, tr, ru, ar, zh, pl, uk
 *   RTL-Support für Arabisch (ar).
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════
//  Available Languages
// ═══════════════════════════════════════════════════════════════

/** @type {Object.<string, string>} Language code → native name */
const LANGUAGES = {
    de: 'Deutsch',
    en: 'English',
    tr: 'Türkçe',
    ru: 'Русский',
    ar: 'العربية',
    zh: '中文',
    pl: 'Polski',
    uk: 'Українська',
};

/** @type {Set<string>} RTL languages */
const RTL_LANGS = new Set(['ar']);

// ═══════════════════════════════════════════════════════════════
//  Translation Dictionaries
// ═══════════════════════════════════════════════════════════════

const I18N = {
// ---------------------------------------------------------------
//  DEUTSCH (Basis / Fallback)
// ---------------------------------------------------------------
de: {
    // Login
    appName: 'KiTa Lummerland',
    loginTagline: 'Volldampf voraus zur Essensplanung!',
    email: 'E-Mail',
    password: 'Passwort',
    login: 'Anmelden',
    loggingIn: 'Anmelden...',
    register: 'Neuen Account erstellen',
    registering: 'Registrieren...',
    or: 'oder',
    demoBtn: 'Demo ohne Anmeldung',
    firebaseNotLoaded: 'Firebase nicht geladen.',
    emailAndPwRequired: 'E-Mail und Passwort eingeben.',
    pwMinLength: 'Passwort: mind. 6 Zeichen.',

    // Auth errors
    'auth/user-not-found': 'Benutzer nicht gefunden.',
    'auth/wrong-password': 'Falsches Passwort.',
    'auth/invalid-email': 'Ungültige E-Mail.',
    'auth/invalid-credential': 'E-Mail oder Passwort falsch.',
    'auth/too-many-requests': 'Zu viele Versuche. Bitte warten.',
    'auth/network-request-failed': 'Netzwerk-Fehler.',
    'auth/email-already-in-use': 'E-Mail bereits registriert.',
    'auth/weak-password': 'Passwort zu kurz.',

    // Header
    headerTitle: 'Lummerland',
    themeTitle: 'Darstellung',
    logoutTitle: 'Abmelden',

    // Tabs
    tabSchedule: 'Fahrplan',
    tabMeals: 'Speisen',
    tabChildren: 'Waggons',
    tabAdmin: 'Stellwerk',

    // View titles
    titleSchedule: 'Fahrplan',
    titleMeals: 'Speisen',
    titleChildren: 'Waggons',
    titleAdmin: 'Stellwerk',
    printTitle: 'KiTa Lummerland - Fahrplan der Woche',

    // Week
    weekLabel: 'KW',

    // Days
    monday: 'Montag',
    tuesday: 'Dienstag',
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',

    // Categories
    catAll: 'Alle',
    catMeat: 'Fleisch',
    catFish: 'Fisch',
    catVeggie: 'Veggie',
    catVegetarian: 'Vegetarisch',
    catVegan: 'Vegan',

    // Roles
    roleAdmin: 'Admin',
    roleKitchen: 'Küche',
    roleParent: 'Eltern',

    // Actions
    cancel: 'Abbrechen',
    done: 'Fertig',
    edit: 'Bearb.',
    delete: 'Entf.',
    create: 'Anlegen',
    remove: 'Entfernen',
    print: 'Drucken',

    // Meal modal
    newMeal: 'Neue Speise',
    editMeal: 'Speise bearbeiten',
    mealName: 'Name',
    mealNamePlaceholder: 'Name der Speise',
    mealCategory: 'Kategorie',
    mealDescription: 'Beschreibung',
    mealDescPlaceholder: 'Optional',
    allergens: 'Allergene',
    noAllergens: 'Keine Allergene',

    // Child modal
    newChild: 'Kind hinzufügen',
    editChild: 'Kind bearbeiten',
    firstName: 'Vorname',
    lastName: 'Nachname',
    group: 'Gruppe',
    groupPlaceholder: 'z.B. Lummerland',
    notes: 'Hinweise',
    notesPlaceholder: 'z.B. kein Schweinefleisch',
    allergies: 'Allergien',

    // Pick meal
    pickMealTitle: 'Proviant wählen',
    pickMealDay: '{day} \u2014 Proviant wählen',
    addMealToDay: '+ Proviant laden',

    // User modal
    createUser: 'Benutzer anlegen',
    userName: 'Name',
    userNamePlaceholder: 'Vorname Nachname',
    userEmail: 'E-Mail',
    userEmailPlaceholder: 'name@example.de',
    userPassword: 'Passwort',
    userPwPlaceholder: 'Mind. 6 Zeichen',
    userRole: 'Rolle',
    userChild: 'Kind',
    noChild: 'Kein Kind',

    // Action sheet
    confirmDeleteMeal: '„{name}" wirklich löschen?',
    confirmDeleteGeneric: 'Speise löschen?',
    confirmRemoveChild: '{name} entfernen?',
    confirmRemoveChildGeneric: 'Kind entfernen?',
    confirmRemoveUser: 'Benutzer wirklich entfernen?',

    // Empty states
    emptyMeals: 'Gleis leer \u2013 Emma wartet auf Kohle!',
    emptyChildren: 'Noch keine Waggons angehängt!',
    emptyUsers: 'Kein Stellwerker im Dienst',
    emptyPickList: 'Kein Proviant an Bord!',

    // Stats / Variety
    varietyTooMuchMeat: 'Zu viel Dampf im Kessel \u2013 weniger Fleisch!',
    varietyNeedFish: 'Emma empfiehlt: Mind. 1x Fisch/Woche.',
    varietyMoreVeggie: 'Mehr Grünes an Bord nehmen!',
    varietyTipPrefix: 'Lokführer-Tipp:',
    varietyGood: 'Ausgezeichneter Fahrplan \u2013 volle Fahrt voraus!',

    // Allergy warnings
    allergyWarning: 'Achtung!',
    allergyBannerPrefix: 'Allergien von {name}:',

    // Theme picker
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeSystem: 'Automatisch',

    // Language picker
    languageTitle: 'Sprache',

    // Onboarding
    onboardingTitle: 'Neuer Anstrich, gleicher Kurs!',
    onboardingText: 'Willkommen zum neuen Lummerland-Design! Emma hat frische Farbe bekommen, aber unter der Haube läuft alles wie gewohnt.',
    onboardingFeature1: 'Fahrplan-Ansicht',
    onboardingFeature2: 'Waggon-System',
    onboardingFeature3: 'Stellwerk',
    onboardingBtn: 'Volldampf voraus!',

    // 14 EU Allergens
    allergenGluten: 'Gluten',
    allergenKrebstiere: 'Krebstiere',
    allergenEier: 'Eier',
    allergenFisch: 'Fisch',
    allergenErdnuesse: 'Erdnüsse',
    allergenSoja: 'Soja',
    allergenMilch: 'Milch/Laktose',
    allergenSchalenfruchte: 'Schalenfrüchte',
    allergenSellerie: 'Sellerie',
    allergenSenf: 'Senf',
    allergenSesam: 'Sesam',
    allergenSulfite: 'Sulfite',
    allergenLupinen: 'Lupinen',
    allergenWeichtiere: 'Weichtiere',

    // Buttons (new meal tooltip etc.)
    newMealTitle: 'Neue Speise',
    addChildTitle: 'Neuen Waggon anhängen',
    addUserTitle: 'Neuen Stellwerker anlegen',
    apiLoadMeals: 'Speisen-Vorschläge laden',
    apiNoResults: 'Keine Ergebnisse',

    // Mandala-Security-System
    lukasApproved: 'Lukas-geprüft',
    frauMahlzahnWarning: 'Frau Mahlzahn warnt:',

    // Emmas Dampf-Counter
    dampfPortions: 'Portionen',
    dampfVeggie: 'Veggie',
    dampfAllergenAlerts: 'Allergen-Alarme',

    // Notbremse
    notbremseTitle: 'Notbremse — Stornieren',
    signalRot: 'Signal steht auf Rot!',
    signalRotMsg: 'Die Bestellfrist ist abgelaufen. Bitte kontaktieren Sie die Küche direkt.',

    // Lukas-Modus / Waggon
    waggonFilter: 'Waggons',

    // Die Wilde 13
    wilde13Title: 'Die Wilde 13!',
    wilde13Text: 'Piraten haben die Verbindung gekapert! Etwas ist schiefgelaufen.',
    wilde13Recovery: 'Zurück zum Leuchtturm',
    wilde13UnknownError: 'Unbekannter Fehler',

    // KiTa-Speisedatenbank
    kitaDbLoad: 'KiTa-Gerichte laden (50 Rezepte)',
    kitaDbAdded: 'Gerichte hinzugefügt',
    kitaDbAllLoaded: 'Alle Gerichte bereits geladen',
},

// ---------------------------------------------------------------
//  ENGLISH
// ---------------------------------------------------------------
en: {
    appName: 'KiTa Lummerland',
    loginTagline: 'Full steam ahead to meal planning!',
    email: 'Email',
    password: 'Password',
    login: 'Sign In',
    loggingIn: 'Signing in...',
    register: 'Create New Account',
    registering: 'Registering...',
    or: 'or',
    demoBtn: 'Demo without login',
    firebaseNotLoaded: 'Firebase not loaded.',
    emailAndPwRequired: 'Enter email and password.',
    pwMinLength: 'Password: min. 6 characters.',

    'auth/user-not-found': 'User not found.',
    'auth/wrong-password': 'Wrong password.',
    'auth/invalid-email': 'Invalid email.',
    'auth/invalid-credential': 'Email or password incorrect.',
    'auth/too-many-requests': 'Too many attempts. Please wait.',
    'auth/network-request-failed': 'Network error.',
    'auth/email-already-in-use': 'Email already registered.',
    'auth/weak-password': 'Password too short.',

    headerTitle: 'Lummerland',
    themeTitle: 'Appearance',
    logoutTitle: 'Sign Out',

    tabSchedule: 'Schedule',
    tabMeals: 'Meals',
    tabChildren: 'Children',
    tabAdmin: 'Admin',

    titleSchedule: 'Schedule',
    titleMeals: 'Meals',
    titleChildren: 'Children',
    titleAdmin: 'Admin',
    printTitle: 'KiTa Lummerland - Weekly Meal Plan',

    weekLabel: 'CW',

    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',

    catAll: 'All',
    catMeat: 'Meat',
    catFish: 'Fish',
    catVeggie: 'Veggie',
    catVegetarian: 'Vegetarian',
    catVegan: 'Vegan',

    roleAdmin: 'Admin',
    roleKitchen: 'Kitchen',
    roleParent: 'Parent',

    cancel: 'Cancel',
    done: 'Done',
    edit: 'Edit',
    delete: 'Del.',
    create: 'Create',
    remove: 'Remove',
    print: 'Print',

    newMeal: 'New Meal',
    editMeal: 'Edit Meal',
    mealName: 'Name',
    mealNamePlaceholder: 'Meal name',
    mealCategory: 'Category',
    mealDescription: 'Description',
    mealDescPlaceholder: 'Optional',
    allergens: 'Allergens',
    noAllergens: 'No allergens',

    newChild: 'Add Child',
    editChild: 'Edit Child',
    firstName: 'First Name',
    lastName: 'Last Name',
    group: 'Group',
    groupPlaceholder: 'e.g. Lummerland',
    notes: 'Notes',
    notesPlaceholder: 'e.g. no pork',
    allergies: 'Allergies',

    pickMealTitle: 'Choose Meal',
    pickMealDay: '{day} \u2014 Choose Meal',
    addMealToDay: '+ Add meal',

    createUser: 'Create User',
    userName: 'Name',
    userNamePlaceholder: 'First Last',
    userEmail: 'Email',
    userEmailPlaceholder: 'name@example.com',
    userPassword: 'Password',
    userPwPlaceholder: 'Min. 6 characters',
    userRole: 'Role',
    userChild: 'Child',
    noChild: 'No child',

    confirmDeleteMeal: 'Really delete "{name}"?',
    confirmDeleteGeneric: 'Delete meal?',
    confirmRemoveChild: 'Remove {name}?',
    confirmRemoveChildGeneric: 'Remove child?',
    confirmRemoveUser: 'Really remove user?',

    emptyMeals: 'No meals yet \u2013 time to stock up!',
    emptyChildren: 'No children registered yet!',
    emptyUsers: 'No users found',
    emptyPickList: 'No meals available!',

    varietyTooMuchMeat: 'Too much meat this week!',
    varietyNeedFish: 'Recommendation: At least 1x fish/week.',
    varietyMoreVeggie: 'Add more veggie options!',
    varietyTipPrefix: 'Tip:',
    varietyGood: 'Great variety \u2013 well balanced!',

    allergyWarning: 'Warning!',
    allergyBannerPrefix: 'Allergies of {name}:',

    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'Auto',

    languageTitle: 'Language',

    onboardingTitle: 'New look, same great app!',
    onboardingText: 'Welcome to the new Lummerland design! Emma got a fresh coat of paint, but everything works just like before.',
    onboardingFeature1: 'Schedule View',
    onboardingFeature2: 'Children',
    onboardingFeature3: 'Admin Panel',
    onboardingBtn: 'Full steam ahead!',

    allergenGluten: 'Gluten',
    allergenKrebstiere: 'Crustaceans',
    allergenEier: 'Eggs',
    allergenFisch: 'Fish',
    allergenErdnuesse: 'Peanuts',
    allergenSoja: 'Soy',
    allergenMilch: 'Milk/Lactose',
    allergenSchalenfruchte: 'Tree Nuts',
    allergenSellerie: 'Celery',
    allergenSenf: 'Mustard',
    allergenSesam: 'Sesame',
    allergenSulfite: 'Sulfites',
    allergenLupinen: 'Lupin',
    allergenWeichtiere: 'Mollusks',

    newMealTitle: 'New Meal',
    addChildTitle: 'Add Child',
    addUserTitle: 'Create User',
    apiLoadMeals: 'Load meal suggestions',
    apiNoResults: 'No results',

    // Mandala-Security-System
    lukasApproved: 'Lukas-approved',
    frauMahlzahnWarning: 'Frau Mahlzahn warns:',

    // Emmas Dampf-Counter
    dampfPortions: 'Portions',
    dampfVeggie: 'Veggie',
    dampfAllergenAlerts: 'Allergen alerts',

    // Notbremse
    notbremseTitle: 'Emergency brake — Cancel',
    signalRot: 'Signal is red!',
    signalRotMsg: 'The order deadline has passed. Please contact the kitchen directly.',

    // Lukas-Modus / Waggon
    waggonFilter: 'Wagons',

    // Die Wilde 13
    wilde13Title: 'The Wild 13!',
    wilde13Text: 'Pirates have hijacked the connection! Something went wrong.',
    wilde13Recovery: 'Back to the Lighthouse',
    wilde13UnknownError: 'Unknown error',
    kitaDbLoad: 'Load KiTa meals (50 recipes)',
    kitaDbAdded: 'meals added',
    kitaDbAllLoaded: 'All meals already loaded',
},

// ---------------------------------------------------------------
//  TÜRKÇE
// ---------------------------------------------------------------
tr: {
    appName: 'KiTa Lummerland',
    loginTagline: 'Yemek planlamasına tam yol ileri!',
    email: 'E-Posta',
    password: 'Şifre',
    login: 'Giriş Yap',
    loggingIn: 'Giriş yapılıyor...',
    register: 'Yeni Hesap Oluştur',
    registering: 'Kaydediliyor...',
    or: 'veya',
    demoBtn: 'Girişsiz Demo',
    firebaseNotLoaded: 'Firebase yüklenemedi.',
    emailAndPwRequired: 'E-posta ve şifre girin.',
    pwMinLength: 'Şifre: en az 6 karakter.',

    'auth/user-not-found': 'Kullanıcı bulunamadı.',
    'auth/wrong-password': 'Yanlış şifre.',
    'auth/invalid-email': 'Geçersiz e-posta.',
    'auth/invalid-credential': 'E-posta veya şifre yanlış.',
    'auth/too-many-requests': 'Çok fazla deneme. Lütfen bekleyin.',
    'auth/network-request-failed': 'Ağ hatası.',
    'auth/email-already-in-use': 'E-posta zaten kayıtlı.',
    'auth/weak-password': 'Şifre çok kısa.',

    headerTitle: 'Lummerland',
    themeTitle: 'Görünüm',
    logoutTitle: 'Çıkış',

    tabSchedule: 'Program',
    tabMeals: 'Yemekler',
    tabChildren: 'Çocuklar',
    tabAdmin: 'Yönetim',

    titleSchedule: 'Program',
    titleMeals: 'Yemekler',
    titleChildren: 'Çocuklar',
    titleAdmin: 'Yönetim',
    printTitle: 'KiTa Lummerland - Haftalık Yemek Planı',

    weekLabel: 'HF',

    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',

    catAll: 'Tümü',
    catMeat: 'Et',
    catFish: 'Balık',
    catVeggie: 'Vejeteryan',
    catVegetarian: 'Vejeteryan',
    catVegan: 'Vegan',

    roleAdmin: 'Yönetici',
    roleKitchen: 'Mutfak',
    roleParent: 'Ebeveyn',

    cancel: 'İptal',
    done: 'Tamam',
    edit: 'Düzenle',
    delete: 'Sil',
    create: 'Oluştur',
    remove: 'Kaldır',
    print: 'Yazdır',

    newMeal: 'Yeni Yemek',
    editMeal: 'Yemek Düzenle',
    mealName: 'Ad',
    mealNamePlaceholder: 'Yemek adı',
    mealCategory: 'Kategori',
    mealDescription: 'Açıklama',
    mealDescPlaceholder: 'İsteğe bağlı',
    allergens: 'Alerjenler',
    noAllergens: 'Alerjen yok',

    newChild: 'Çocuk Ekle',
    editChild: 'Çocuk Düzenle',
    firstName: 'Ad',
    lastName: 'Soyad',
    group: 'Grup',
    groupPlaceholder: 'ör. Lummerland',
    notes: 'Notlar',
    notesPlaceholder: 'ör. domuz eti yok',
    allergies: 'Alerjiler',

    pickMealTitle: 'Yemek Seç',
    pickMealDay: '{day} \u2014 Yemek Seç',
    addMealToDay: '+ Yemek ekle',

    createUser: 'Kullanıcı Oluştur',
    userName: 'Ad',
    userNamePlaceholder: 'Ad Soyad',
    userEmail: 'E-Posta',
    userEmailPlaceholder: 'ad@ornek.de',
    userPassword: 'Şifre',
    userPwPlaceholder: 'En az 6 karakter',
    userRole: 'Rol',
    userChild: 'Çocuk',
    noChild: 'Çocuk yok',

    confirmDeleteMeal: '„{name}" silinsin mi?',
    confirmDeleteGeneric: 'Yemek silinsin mi?',
    confirmRemoveChild: '{name} kaldırılsın mı?',
    confirmRemoveChildGeneric: 'Çocuk kaldırılsın mı?',
    confirmRemoveUser: 'Kullanıcı kaldırılsın mı?',

    emptyMeals: 'Henüz yemek yok!',
    emptyChildren: 'Henüz çocuk kaydedilmedi!',
    emptyUsers: 'Kullanıcı bulunamadı',
    emptyPickList: 'Mevcut yemek yok!',

    varietyTooMuchMeat: 'Bu hafta çok fazla et var!',
    varietyNeedFish: 'Öneri: Haftada en az 1x balık.',
    varietyMoreVeggie: 'Daha fazla sebze ekleyin!',
    varietyTipPrefix: 'İpucu:',
    varietyGood: 'Harika çeşitlilik!',

    allergyWarning: 'Dikkat!',
    allergyBannerPrefix: '{name} alerjileri:',

    themeLight: 'Açık',
    themeDark: 'Koyu',
    themeSystem: 'Otomatik',

    languageTitle: 'Dil',

    onboardingTitle: 'Yeni görünüm, aynı harika uygulama!',
    onboardingText: 'Lummerland\'ın yeni tasarımına hoş geldiniz! Her şey eskisi gibi çalışıyor.',
    onboardingFeature1: 'Haftalık Plan',
    onboardingFeature2: 'Çocuklar',
    onboardingFeature3: 'Yönetim',
    onboardingBtn: 'Başlayalım!',

    allergenGluten: 'Gluten',
    allergenKrebstiere: 'Kabuklu deniz ürünleri',
    allergenEier: 'Yumurta',
    allergenFisch: 'Balık',
    allergenErdnuesse: 'Yer fıstığı',
    allergenSoja: 'Soya',
    allergenMilch: 'Süt/Laktoz',
    allergenSchalenfruchte: 'Sert kabuklu meyveler',
    allergenSellerie: 'Kereviz',
    allergenSenf: 'Hardal',
    allergenSesam: 'Susam',
    allergenSulfite: 'Sülfitler',
    allergenLupinen: 'Acı bakla',
    allergenWeichtiere: 'Yumuşakçalar',

    newMealTitle: 'Yeni Yemek',
    addChildTitle: 'Çocuk Ekle',
    addUserTitle: 'Kullanıcı Oluştur',
    apiLoadMeals: 'Yemek önerileri yükle',
    apiNoResults: 'Sonuç yok',
    lukasApproved: 'Lukas onaylı', frauMahlzahnWarning: 'Frau Mahlzahn uyarıyor:',
    dampfPortions: 'Porsiyon', dampfVeggie: 'Vejetaryen', dampfAllergenAlerts: 'Alerjen uyarıları',
    notbremseTitle: 'Acil fren — İptal', signalRot: 'Sinyal kırmızı!', signalRotMsg: 'Sipariş süresi doldu.',
    waggonFilter: 'Vagonlar',
    wilde13Title: 'Vahşi 13!', wilde13Text: 'Korsanlar bağlantıyı ele geçirdi!', wilde13Recovery: 'Deniz Fenerine Dön', wilde13UnknownError: 'Bilinmeyen hata',
},

// ---------------------------------------------------------------
//  РУССКИЙ
// ---------------------------------------------------------------
ru: {
    appName: 'KiTa Lummerland',
    loginTagline: 'Полный вперёд к планированию питания!',
    email: 'Эл. почта',
    password: 'Пароль',
    login: 'Войти',
    loggingIn: 'Вход...',
    register: 'Создать аккаунт',
    registering: 'Регистрация...',
    or: 'или',
    demoBtn: 'Демо без входа',
    firebaseNotLoaded: 'Firebase не загружен.',
    emailAndPwRequired: 'Введите почту и пароль.',
    pwMinLength: 'Пароль: мин. 6 символов.',

    'auth/user-not-found': 'Пользователь не найден.',
    'auth/wrong-password': 'Неверный пароль.',
    'auth/invalid-email': 'Неверный адрес почты.',
    'auth/invalid-credential': 'Неверная почта или пароль.',
    'auth/too-many-requests': 'Слишком много попыток. Подождите.',
    'auth/network-request-failed': 'Ошибка сети.',
    'auth/email-already-in-use': 'Почта уже зарегистрирована.',
    'auth/weak-password': 'Пароль слишком короткий.',

    headerTitle: 'Lummerland',
    themeTitle: 'Оформление',
    logoutTitle: 'Выйти',

    tabSchedule: 'План',
    tabMeals: 'Блюда',
    tabChildren: 'Дети',
    tabAdmin: 'Управление',

    titleSchedule: 'План',
    titleMeals: 'Блюда',
    titleChildren: 'Дети',
    titleAdmin: 'Управление',
    printTitle: 'KiTa Lummerland - Еженедельное меню',

    weekLabel: 'Нед.',

    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',

    catAll: 'Все',
    catMeat: 'Мясо',
    catFish: 'Рыба',
    catVeggie: 'Вегет.',
    catVegetarian: 'Вегетарианское',
    catVegan: 'Веган',

    roleAdmin: 'Админ',
    roleKitchen: 'Кухня',
    roleParent: 'Родитель',

    cancel: 'Отмена',
    done: 'Готово',
    edit: 'Ред.',
    delete: 'Удал.',
    create: 'Создать',
    remove: 'Удалить',
    print: 'Печать',

    newMeal: 'Новое блюдо',
    editMeal: 'Редактировать блюдо',
    mealName: 'Название',
    mealNamePlaceholder: 'Название блюда',
    mealCategory: 'Категория',
    mealDescription: 'Описание',
    mealDescPlaceholder: 'Необязательно',
    allergens: 'Аллергены',
    noAllergens: 'Без аллергенов',

    newChild: 'Добавить ребёнка',
    editChild: 'Редактировать',
    firstName: 'Имя',
    lastName: 'Фамилия',
    group: 'Группа',
    groupPlaceholder: 'напр. Lummerland',
    notes: 'Примечания',
    notesPlaceholder: 'напр. без свинины',
    allergies: 'Аллергии',

    pickMealTitle: 'Выбрать блюдо',
    pickMealDay: '{day} \u2014 Выбрать блюдо',
    addMealToDay: '+ Добавить блюдо',

    createUser: 'Создать пользователя',
    userName: 'Имя',
    userNamePlaceholder: 'Имя Фамилия',
    userEmail: 'Эл. почта',
    userEmailPlaceholder: 'name@example.de',
    userPassword: 'Пароль',
    userPwPlaceholder: 'Мин. 6 символов',
    userRole: 'Роль',
    userChild: 'Ребёнок',
    noChild: 'Без ребёнка',

    confirmDeleteMeal: 'Удалить «{name}»?',
    confirmDeleteGeneric: 'Удалить блюдо?',
    confirmRemoveChild: 'Удалить {name}?',
    confirmRemoveChildGeneric: 'Удалить ребёнка?',
    confirmRemoveUser: 'Удалить пользователя?',

    emptyMeals: 'Пока нет блюд!',
    emptyChildren: 'Дети ещё не добавлены!',
    emptyUsers: 'Пользователей нет',
    emptyPickList: 'Нет доступных блюд!',

    varietyTooMuchMeat: 'Слишком много мяса на этой неделе!',
    varietyNeedFish: 'Рекомендация: минимум 1 раз рыба в неделю.',
    varietyMoreVeggie: 'Добавьте больше овощных блюд!',
    varietyTipPrefix: 'Совет:',
    varietyGood: 'Отличное разнообразие!',

    allergyWarning: 'Внимание!',
    allergyBannerPrefix: 'Аллергии {name}:',

    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    themeSystem: 'Авто',

    languageTitle: 'Язык',

    onboardingTitle: 'Новый дизайн, тот же функционал!',
    onboardingText: 'Добро пожаловать в обновлённый Lummerland! Новый внешний вид, но всё работает как прежде.',
    onboardingFeature1: 'Расписание',
    onboardingFeature2: 'Дети',
    onboardingFeature3: 'Управление',
    onboardingBtn: 'Поехали!',

    allergenGluten: 'Глютен',
    allergenKrebstiere: 'Ракообразные',
    allergenEier: 'Яйца',
    allergenFisch: 'Рыба',
    allergenErdnuesse: 'Арахис',
    allergenSoja: 'Соя',
    allergenMilch: 'Молоко/Лактоза',
    allergenSchalenfruchte: 'Орехи',
    allergenSellerie: 'Сельдерей',
    allergenSenf: 'Горчица',
    allergenSesam: 'Кунжут',
    allergenSulfite: 'Сульфиты',
    allergenLupinen: 'Люпин',
    allergenWeichtiere: 'Моллюски',

    newMealTitle: 'Новое блюдо',
    addChildTitle: 'Добавить ребёнка',
    addUserTitle: 'Создать пользователя',
    apiLoadMeals: 'Загрузить предложения блюд',
    apiNoResults: 'Нет результатов',
    lukasApproved: 'Одобрено Лукасом', frauMahlzahnWarning: 'Фрау Мальцан предупреждает:',
    dampfPortions: 'Порции', dampfVeggie: 'Вегетарианские', dampfAllergenAlerts: 'Аллергены',
    notbremseTitle: 'Стоп-кран — Отмена', signalRot: 'Сигнал красный!', signalRotMsg: 'Срок заказа истёк.',
    waggonFilter: 'Вагоны',
    wilde13Title: 'Дикая 13!', wilde13Text: 'Пираты перехватили связь!', wilde13Recovery: 'К маяку', wilde13UnknownError: 'Неизвестная ошибка',
},

// ---------------------------------------------------------------
//  العربية (ARABIC)
// ---------------------------------------------------------------
ar: {
    appName: 'KiTa Lummerland',
    loginTagline: 'انطلق نحو تخطيط الوجبات!',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    login: 'تسجيل الدخول',
    loggingIn: 'جارٍ الدخول...',
    register: 'إنشاء حساب جديد',
    registering: 'جارٍ التسجيل...',
    or: 'أو',
    demoBtn: 'تجربة بدون تسجيل',
    firebaseNotLoaded: 'لم يتم تحميل Firebase.',
    emailAndPwRequired: 'أدخل البريد وكلمة المرور.',
    pwMinLength: 'كلمة المرور: 6 أحرف على الأقل.',

    'auth/user-not-found': 'المستخدم غير موجود.',
    'auth/wrong-password': 'كلمة مرور خاطئة.',
    'auth/invalid-email': 'بريد إلكتروني غير صالح.',
    'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة.',
    'auth/too-many-requests': 'محاولات كثيرة. يرجى الانتظار.',
    'auth/network-request-failed': 'خطأ في الشبكة.',
    'auth/email-already-in-use': 'البريد مسجّل مسبقاً.',
    'auth/weak-password': 'كلمة المرور قصيرة جداً.',

    headerTitle: 'Lummerland',
    themeTitle: 'المظهر',
    logoutTitle: 'تسجيل الخروج',

    tabSchedule: 'الجدول',
    tabMeals: 'الوجبات',
    tabChildren: 'الأطفال',
    tabAdmin: 'الإدارة',

    titleSchedule: 'الجدول',
    titleMeals: 'الوجبات',
    titleChildren: 'الأطفال',
    titleAdmin: 'الإدارة',
    printTitle: 'KiTa Lummerland - خطة الوجبات الأسبوعية',

    weekLabel: 'أسبوع',

    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',

    catAll: 'الكل',
    catMeat: 'لحوم',
    catFish: 'سمك',
    catVeggie: 'نباتي',
    catVegetarian: 'نباتي',
    catVegan: 'نباتي صرف',

    roleAdmin: 'مدير',
    roleKitchen: 'مطبخ',
    roleParent: 'والد',

    cancel: 'إلغاء',
    done: 'تم',
    edit: 'تعديل',
    delete: 'حذف',
    create: 'إنشاء',
    remove: 'إزالة',
    print: 'طباعة',

    newMeal: 'وجبة جديدة',
    editMeal: 'تعديل الوجبة',
    mealName: 'الاسم',
    mealNamePlaceholder: 'اسم الوجبة',
    mealCategory: 'الفئة',
    mealDescription: 'الوصف',
    mealDescPlaceholder: 'اختياري',
    allergens: 'المواد المسببة للحساسية',
    noAllergens: 'لا توجد مواد مسببة للحساسية',

    newChild: 'إضافة طفل',
    editChild: 'تعديل بيانات الطفل',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    group: 'المجموعة',
    groupPlaceholder: 'مثال: Lummerland',
    notes: 'ملاحظات',
    notesPlaceholder: 'مثال: بدون لحم خنزير',
    allergies: 'الحساسية',

    pickMealTitle: 'اختر وجبة',
    pickMealDay: '{day} \u2014 اختر وجبة',
    addMealToDay: '+ إضافة وجبة',

    createUser: 'إنشاء مستخدم',
    userName: 'الاسم',
    userNamePlaceholder: 'الاسم الكامل',
    userEmail: 'البريد الإلكتروني',
    userEmailPlaceholder: 'name@example.de',
    userPassword: 'كلمة المرور',
    userPwPlaceholder: '6 أحرف على الأقل',
    userRole: 'الدور',
    userChild: 'الطفل',
    noChild: 'بدون طفل',

    confirmDeleteMeal: 'حذف "{name}"؟',
    confirmDeleteGeneric: 'حذف الوجبة؟',
    confirmRemoveChild: 'إزالة {name}؟',
    confirmRemoveChildGeneric: 'إزالة الطفل؟',
    confirmRemoveUser: 'إزالة المستخدم؟',

    emptyMeals: 'لا توجد وجبات بعد!',
    emptyChildren: 'لم يتم تسجيل أطفال بعد!',
    emptyUsers: 'لا يوجد مستخدمون',
    emptyPickList: 'لا توجد وجبات متاحة!',

    varietyTooMuchMeat: 'لحوم كثيرة هذا الأسبوع!',
    varietyNeedFish: 'يُنصح بسمك مرة واحدة أسبوعياً.',
    varietyMoreVeggie: 'أضف المزيد من الخضروات!',
    varietyTipPrefix: 'نصيحة:',
    varietyGood: 'تنوع ممتاز!',

    allergyWarning: 'تنبيه!',
    allergyBannerPrefix: 'حساسية {name}:',

    themeLight: 'فاتح',
    themeDark: 'داكن',
    themeSystem: 'تلقائي',

    languageTitle: 'اللغة',

    onboardingTitle: 'مظهر جديد، نفس الوظائف!',
    onboardingText: 'مرحباً بالتصميم الجديد! كل شيء يعمل كما كان.',
    onboardingFeature1: 'الجدول',
    onboardingFeature2: 'الأطفال',
    onboardingFeature3: 'الإدارة',
    onboardingBtn: 'هيا نبدأ!',

    allergenGluten: 'غلوتين',
    allergenKrebstiere: 'قشريات',
    allergenEier: 'بيض',
    allergenFisch: 'سمك',
    allergenErdnuesse: 'فول سوداني',
    allergenSoja: 'صويا',
    allergenMilch: 'حليب/لاكتوز',
    allergenSchalenfruchte: 'مكسرات',
    allergenSellerie: 'كرفس',
    allergenSenf: 'خردل',
    allergenSesam: 'سمسم',
    allergenSulfite: 'كبريتات',
    allergenLupinen: 'ترمس',
    allergenWeichtiere: 'رخويات',

    newMealTitle: 'وجبة جديدة',
    addChildTitle: 'إضافة طفل',
    addUserTitle: 'إنشاء مستخدم',
    apiLoadMeals: 'تحميل اقتراحات الوجبات',
    apiNoResults: 'لا توجد نتائج',
    lukasApproved: 'معتمد من لوكاس', frauMahlzahnWarning: 'تحذير فراو مالزان:',
    dampfPortions: 'حصص', dampfVeggie: 'نباتي', dampfAllergenAlerts: 'تنبيهات الحساسية',
    notbremseTitle: 'فرامل طوارئ — إلغاء', signalRot: 'الإشارة حمراء!', signalRotMsg: 'انتهى الموعد النهائي للطلب.',
    waggonFilter: 'عربات',
    wilde13Title: 'الـ 13 المتوحشة!', wilde13Text: 'القراصنة اختطفوا الاتصال!', wilde13Recovery: 'العودة للمنارة', wilde13UnknownError: 'خطأ غير معروف',
},

// ---------------------------------------------------------------
//  中文 (CHINESE)
// ---------------------------------------------------------------
zh: {
    appName: 'KiTa Lummerland',
    loginTagline: '全速前进，规划餐食！',
    email: '电子邮箱',
    password: '密码',
    login: '登录',
    loggingIn: '登录中...',
    register: '创建新账户',
    registering: '注册中...',
    or: '或',
    demoBtn: '免登录演示',
    firebaseNotLoaded: 'Firebase 未加载。',
    emailAndPwRequired: '请输入邮箱和密码。',
    pwMinLength: '密码至少6个字符。',

    'auth/user-not-found': '用户未找到。',
    'auth/wrong-password': '密码错误。',
    'auth/invalid-email': '无效的邮箱地址。',
    'auth/invalid-credential': '邮箱或密码不正确。',
    'auth/too-many-requests': '尝试次数过多，请稍候。',
    'auth/network-request-failed': '网络错误。',
    'auth/email-already-in-use': '邮箱已被注册。',
    'auth/weak-password': '密码太短。',

    headerTitle: 'Lummerland',
    themeTitle: '外观',
    logoutTitle: '退出',

    tabSchedule: '周计划',
    tabMeals: '菜品',
    tabChildren: '儿童',
    tabAdmin: '管理',

    titleSchedule: '周计划',
    titleMeals: '菜品',
    titleChildren: '儿童',
    titleAdmin: '管理',
    printTitle: 'KiTa Lummerland - 每周餐食计划',

    weekLabel: '第',

    monday: '周一',
    tuesday: '周二',
    wednesday: '周三',
    thursday: '周四',
    friday: '周五',

    catAll: '全部',
    catMeat: '肉类',
    catFish: '鱼类',
    catVeggie: '素食',
    catVegetarian: '素食',
    catVegan: '纯素',

    roleAdmin: '管理员',
    roleKitchen: '厨房',
    roleParent: '家长',

    cancel: '取消',
    done: '完成',
    edit: '编辑',
    delete: '删除',
    create: '创建',
    remove: '移除',
    print: '打印',

    newMeal: '新菜品',
    editMeal: '编辑菜品',
    mealName: '名称',
    mealNamePlaceholder: '菜品名称',
    mealCategory: '类别',
    mealDescription: '描述',
    mealDescPlaceholder: '可选',
    allergens: '过敏原',
    noAllergens: '无过敏原',

    newChild: '添加儿童',
    editChild: '编辑儿童信息',
    firstName: '名',
    lastName: '姓',
    group: '班级',
    groupPlaceholder: '例如 Lummerland',
    notes: '备注',
    notesPlaceholder: '例如 不吃猪肉',
    allergies: '过敏',

    pickMealTitle: '选择菜品',
    pickMealDay: '{day} — 选择菜品',
    addMealToDay: '+ 添加菜品',

    createUser: '创建用户',
    userName: '姓名',
    userNamePlaceholder: '姓名',
    userEmail: '邮箱',
    userEmailPlaceholder: 'name@example.de',
    userPassword: '密码',
    userPwPlaceholder: '至少6个字符',
    userRole: '角色',
    userChild: '儿童',
    noChild: '无',

    confirmDeleteMeal: '确定删除"{name}"？',
    confirmDeleteGeneric: '删除菜品？',
    confirmRemoveChild: '移除 {name}？',
    confirmRemoveChildGeneric: '移除儿童？',
    confirmRemoveUser: '确定移除用户？',

    emptyMeals: '还没有菜品！',
    emptyChildren: '还没有注册儿童！',
    emptyUsers: '没有用户',
    emptyPickList: '没有可选菜品！',

    varietyTooMuchMeat: '本周肉类太多！',
    varietyNeedFish: '建议：每周至少一次鱼类。',
    varietyMoreVeggie: '增加更多蔬菜选项！',
    varietyTipPrefix: '提示：',
    varietyGood: '搭配很好！',

    allergyWarning: '注意！',
    allergyBannerPrefix: '{name}的过敏信息：',

    themeLight: '浅色',
    themeDark: '深色',
    themeSystem: '自动',

    languageTitle: '语言',

    onboardingTitle: '全新外观，一如既往！',
    onboardingText: '欢迎使用新版 Lummerland 设计！焕然一新的界面，熟悉的功能。',
    onboardingFeature1: '周计划',
    onboardingFeature2: '儿童管理',
    onboardingFeature3: '管理面板',
    onboardingBtn: '开始使用！',

    allergenGluten: '麸质',
    allergenKrebstiere: '甲壳类',
    allergenEier: '鸡蛋',
    allergenFisch: '鱼',
    allergenErdnuesse: '花生',
    allergenSoja: '大豆',
    allergenMilch: '牛奶/乳糖',
    allergenSchalenfruchte: '坚果',
    allergenSellerie: '芹菜',
    allergenSenf: '芥末',
    allergenSesam: '芝麻',
    allergenSulfite: '亚硫酸盐',
    allergenLupinen: '羽扇豆',
    allergenWeichtiere: '软体动物',

    newMealTitle: '新菜品',
    addChildTitle: '添加儿童',
    addUserTitle: '创建用户',
    apiLoadMeals: '加载菜品建议',
    apiNoResults: '无结果',
    lukasApproved: '卢卡斯认证', frauMahlzahnWarning: '马尔赞夫人警告：',
    dampfPortions: '份量', dampfVeggie: '素食', dampfAllergenAlerts: '过敏警报',
    notbremseTitle: '紧急刹车 — 取消', signalRot: '红灯！', signalRotMsg: '订餐截止时间已过。',
    waggonFilter: '车厢',
    wilde13Title: '狂野13！', wilde13Text: '海盗劫持了连接！', wilde13Recovery: '返回灯塔', wilde13UnknownError: '未知错误',
},

// ---------------------------------------------------------------
//  POLSKI
// ---------------------------------------------------------------
pl: {
    appName: 'KiTa Lummerland',
    loginTagline: 'Pełną parą do planowania posiłków!',
    email: 'E-mail',
    password: 'Hasło',
    login: 'Zaloguj się',
    loggingIn: 'Logowanie...',
    register: 'Utwórz nowe konto',
    registering: 'Rejestracja...',
    or: 'lub',
    demoBtn: 'Demo bez logowania',
    firebaseNotLoaded: 'Firebase nie załadowany.',
    emailAndPwRequired: 'Wprowadź e-mail i hasło.',
    pwMinLength: 'Hasło: min. 6 znaków.',

    'auth/user-not-found': 'Użytkownik nie znaleziony.',
    'auth/wrong-password': 'Błędne hasło.',
    'auth/invalid-email': 'Nieprawidłowy e-mail.',
    'auth/invalid-credential': 'E-mail lub hasło niepoprawne.',
    'auth/too-many-requests': 'Za dużo prób. Poczekaj.',
    'auth/network-request-failed': 'Błąd sieci.',
    'auth/email-already-in-use': 'E-mail już zarejestrowany.',
    'auth/weak-password': 'Hasło za krótkie.',

    headerTitle: 'Lummerland',
    themeTitle: 'Wygląd',
    logoutTitle: 'Wyloguj',

    tabSchedule: 'Plan',
    tabMeals: 'Posiłki',
    tabChildren: 'Dzieci',
    tabAdmin: 'Zarządzanie',

    titleSchedule: 'Plan',
    titleMeals: 'Posiłki',
    titleChildren: 'Dzieci',
    titleAdmin: 'Zarządzanie',
    printTitle: 'KiTa Lummerland - Tygodniowy plan posiłków',

    weekLabel: 'Tydz.',

    monday: 'Poniedziałek',
    tuesday: 'Wtorek',
    wednesday: 'Środa',
    thursday: 'Czwartek',
    friday: 'Piątek',

    catAll: 'Wszystkie',
    catMeat: 'Mięso',
    catFish: 'Ryba',
    catVeggie: 'Wege',
    catVegetarian: 'Wegetariańskie',
    catVegan: 'Wegańskie',

    roleAdmin: 'Admin',
    roleKitchen: 'Kuchnia',
    roleParent: 'Rodzic',

    cancel: 'Anuluj',
    done: 'Gotowe',
    edit: 'Edytuj',
    delete: 'Usuń',
    create: 'Utwórz',
    remove: 'Usuń',
    print: 'Drukuj',

    newMeal: 'Nowy posiłek',
    editMeal: 'Edytuj posiłek',
    mealName: 'Nazwa',
    mealNamePlaceholder: 'Nazwa posiłku',
    mealCategory: 'Kategoria',
    mealDescription: 'Opis',
    mealDescPlaceholder: 'Opcjonalnie',
    allergens: 'Alergeny',
    noAllergens: 'Brak alergenów',

    newChild: 'Dodaj dziecko',
    editChild: 'Edytuj dziecko',
    firstName: 'Imię',
    lastName: 'Nazwisko',
    group: 'Grupa',
    groupPlaceholder: 'np. Lummerland',
    notes: 'Uwagi',
    notesPlaceholder: 'np. bez wieprzowiny',
    allergies: 'Alergie',

    pickMealTitle: 'Wybierz posiłek',
    pickMealDay: '{day} \u2014 Wybierz posiłek',
    addMealToDay: '+ Dodaj posiłek',

    createUser: 'Utwórz użytkownika',
    userName: 'Imię',
    userNamePlaceholder: 'Imię Nazwisko',
    userEmail: 'E-mail',
    userEmailPlaceholder: 'name@example.de',
    userPassword: 'Hasło',
    userPwPlaceholder: 'Min. 6 znaków',
    userRole: 'Rola',
    userChild: 'Dziecko',
    noChild: 'Brak',

    confirmDeleteMeal: 'Usunąć „{name}"?',
    confirmDeleteGeneric: 'Usunąć posiłek?',
    confirmRemoveChild: 'Usunąć {name}?',
    confirmRemoveChildGeneric: 'Usunąć dziecko?',
    confirmRemoveUser: 'Usunąć użytkownika?',

    emptyMeals: 'Brak posiłków!',
    emptyChildren: 'Brak zarejestrowanych dzieci!',
    emptyUsers: 'Brak użytkowników',
    emptyPickList: 'Brak dostępnych posiłków!',

    varietyTooMuchMeat: 'Za dużo mięsa w tym tygodniu!',
    varietyNeedFish: 'Zalecenie: min. 1x ryba tygodniowo.',
    varietyMoreVeggie: 'Dodaj więcej opcji wegetariańskich!',
    varietyTipPrefix: 'Wskazówka:',
    varietyGood: 'Świetna różnorodność!',

    allergyWarning: 'Uwaga!',
    allergyBannerPrefix: 'Alergie {name}:',

    themeLight: 'Jasny',
    themeDark: 'Ciemny',
    themeSystem: 'Auto',

    languageTitle: 'Język',

    onboardingTitle: 'Nowy wygląd, te same funkcje!',
    onboardingText: 'Witamy w nowym designie Lummerland! Wszystko działa jak dotychczas.',
    onboardingFeature1: 'Plan tygodnia',
    onboardingFeature2: 'Dzieci',
    onboardingFeature3: 'Zarządzanie',
    onboardingBtn: 'Zaczynamy!',

    allergenGluten: 'Gluten',
    allergenKrebstiere: 'Skorupiaki',
    allergenEier: 'Jaja',
    allergenFisch: 'Ryby',
    allergenErdnuesse: 'Orzechy ziemne',
    allergenSoja: 'Soja',
    allergenMilch: 'Mleko/Laktoza',
    allergenSchalenfruchte: 'Orzechy',
    allergenSellerie: 'Seler',
    allergenSenf: 'Gorczyca',
    allergenSesam: 'Sezam',
    allergenSulfite: 'Siarczyny',
    allergenLupinen: 'Łubin',
    allergenWeichtiere: 'Mięczaki',

    newMealTitle: 'Nowy posiłek',
    addChildTitle: 'Dodaj dziecko',
    addUserTitle: 'Utwórz użytkownika',
    apiLoadMeals: 'Załaduj propozycje posiłków',
    apiNoResults: 'Brak wyników',
    lukasApproved: 'Zatwierdzone przez Lukasa', frauMahlzahnWarning: 'Pani Mahlzahn ostrzega:',
    dampfPortions: 'Porcje', dampfVeggie: 'Wege', dampfAllergenAlerts: 'Alerty alergenów',
    notbremseTitle: 'Hamulec awaryjny — Anuluj', signalRot: 'Sygnał czerwony!', signalRotMsg: 'Termin zamówienia minął.',
    waggonFilter: 'Wagony',
    wilde13Title: 'Dzika 13!', wilde13Text: 'Piraci przechwycili połączenie!', wilde13Recovery: 'Powrót do latarni', wilde13UnknownError: 'Nieznany błąd',
},

// ---------------------------------------------------------------
//  УКРАЇНСЬКА
// ---------------------------------------------------------------
uk: {
    appName: 'KiTa Lummerland',
    loginTagline: 'Повний хід до планування їжі!',
    email: 'Ел. пошта',
    password: 'Пароль',
    login: 'Увійти',
    loggingIn: 'Вхід...',
    register: 'Створити акаунт',
    registering: 'Реєстрація...',
    or: 'або',
    demoBtn: 'Демо без входу',
    firebaseNotLoaded: 'Firebase не завантажено.',
    emailAndPwRequired: 'Введіть пошту та пароль.',
    pwMinLength: 'Пароль: мін. 6 символів.',

    'auth/user-not-found': 'Користувача не знайдено.',
    'auth/wrong-password': 'Невірний пароль.',
    'auth/invalid-email': 'Невірна ел. пошта.',
    'auth/invalid-credential': 'Пошта або пароль невірні.',
    'auth/too-many-requests': 'Забагато спроб. Зачекайте.',
    'auth/network-request-failed': 'Помилка мережі.',
    'auth/email-already-in-use': 'Пошта вже зареєстрована.',
    'auth/weak-password': 'Пароль закороткий.',

    headerTitle: 'Lummerland',
    themeTitle: 'Оформлення',
    logoutTitle: 'Вийти',

    tabSchedule: 'Розклад',
    tabMeals: 'Страви',
    tabChildren: 'Діти',
    tabAdmin: 'Керування',

    titleSchedule: 'Розклад',
    titleMeals: 'Страви',
    titleChildren: 'Діти',
    titleAdmin: 'Керування',
    printTitle: 'KiTa Lummerland - Тижневе меню',

    weekLabel: 'Тижд.',

    monday: 'Понеділок',
    tuesday: 'Вівторок',
    wednesday: 'Середа',
    thursday: 'Четвер',
    friday: "П'ятниця",

    catAll: 'Всі',
    catMeat: "М'ясо",
    catFish: 'Риба',
    catVeggie: 'Вегет.',
    catVegetarian: 'Вегетаріанське',
    catVegan: 'Веган',

    roleAdmin: 'Адмін',
    roleKitchen: 'Кухня',
    roleParent: 'Батьки',

    cancel: 'Скасувати',
    done: 'Готово',
    edit: 'Ред.',
    delete: 'Вид.',
    create: 'Створити',
    remove: 'Видалити',
    print: 'Друк',

    newMeal: 'Нова страва',
    editMeal: 'Редагувати страву',
    mealName: 'Назва',
    mealNamePlaceholder: 'Назва страви',
    mealCategory: 'Категорія',
    mealDescription: 'Опис',
    mealDescPlaceholder: 'Необов\'язково',
    allergens: 'Алергени',
    noAllergens: 'Без алергенів',

    newChild: 'Додати дитину',
    editChild: 'Редагувати',
    firstName: "Ім'я",
    lastName: 'Прізвище',
    group: 'Група',
    groupPlaceholder: 'напр. Lummerland',
    notes: 'Примітки',
    notesPlaceholder: 'напр. без свинини',
    allergies: 'Алергії',

    pickMealTitle: 'Вибрати страву',
    pickMealDay: '{day} \u2014 Вибрати страву',
    addMealToDay: '+ Додати страву',

    createUser: 'Створити користувача',
    userName: "Ім'я",
    userNamePlaceholder: "Ім'я Прізвище",
    userEmail: 'Ел. пошта',
    userEmailPlaceholder: 'name@example.de',
    userPassword: 'Пароль',
    userPwPlaceholder: 'Мін. 6 символів',
    userRole: 'Роль',
    userChild: 'Дитина',
    noChild: 'Без дитини',

    confirmDeleteMeal: 'Видалити «{name}»?',
    confirmDeleteGeneric: 'Видалити страву?',
    confirmRemoveChild: 'Видалити {name}?',
    confirmRemoveChildGeneric: 'Видалити дитину?',
    confirmRemoveUser: 'Видалити користувача?',

    emptyMeals: 'Страв поки немає!',
    emptyChildren: 'Дітей ще не додано!',
    emptyUsers: 'Користувачів немає',
    emptyPickList: 'Немає доступних страв!',

    varietyTooMuchMeat: "Забагато м'яса цього тижня!",
    varietyNeedFish: 'Рекомендація: мін. 1 раз риба на тиждень.',
    varietyMoreVeggie: 'Додайте більше овочевих страв!',
    varietyTipPrefix: 'Порада:',
    varietyGood: 'Чудове різноманіття!',

    allergyWarning: 'Увага!',
    allergyBannerPrefix: 'Алергії {name}:',

    themeLight: 'Світла',
    themeDark: 'Темна',
    themeSystem: 'Авто',

    languageTitle: 'Мова',

    onboardingTitle: 'Новий дизайн, той самий функціонал!',
    onboardingText: 'Ласкаво просимо до оновленого Lummerland! Новий вигляд, але все працює як і раніше.',
    onboardingFeature1: 'Розклад',
    onboardingFeature2: 'Діти',
    onboardingFeature3: 'Керування',
    onboardingBtn: 'Поїхали!',

    allergenGluten: 'Глютен',
    allergenKrebstiere: 'Ракоподібні',
    allergenEier: 'Яйця',
    allergenFisch: 'Риба',
    allergenErdnuesse: 'Арахіс',
    allergenSoja: 'Соя',
    allergenMilch: 'Молоко/Лактоза',
    allergenSchalenfruchte: 'Горіхи',
    allergenSellerie: 'Селера',
    allergenSenf: 'Гірчиця',
    allergenSesam: 'Кунжут',
    allergenSulfite: 'Сульфіти',
    allergenLupinen: 'Люпин',
    allergenWeichtiere: 'Молюски',

    newMealTitle: 'Нова страва',
    addChildTitle: 'Додати дитину',
    addUserTitle: 'Створити користувача',
    apiLoadMeals: 'Завантажити пропозиції страв',
    apiNoResults: 'Немає результатів',
    lukasApproved: 'Схвалено Лукасом', frauMahlzahnWarning: 'Фрау Мальцан попереджає:',
    dampfPortions: 'Порції', dampfVeggie: 'Вегетаріанські', dampfAllergenAlerts: 'Алергени',
    notbremseTitle: 'Стоп-кран — Скасувати', signalRot: 'Сигнал червоний!', signalRotMsg: 'Термін замовлення минув.',
    waggonFilter: 'Вагони',
    wilde13Title: 'Дика 13!', wilde13Text: 'Пірати перехопили з\'єднання!', wilde13Recovery: 'До маяка', wilde13UnknownError: 'Невідома помилка',
},

}; // end I18N

// ═══════════════════════════════════════════════════════════════
//  i18n Engine
// ═══════════════════════════════════════════════════════════════

/** @type {string} Current language code */
let currentLang = 'de';

/**
 * Returns the stored language preference from localStorage.
 * @returns {string} Language code (default: 'de')
 */
function getLangPref() {
    return localStorage.getItem('kita-lang') || 'de';
}

/**
 * Translates a key to the current language. Falls back to German (de).
 * Supports simple {placeholder} interpolation.
 * @param {string} key — Translation key
 * @param {Object.<string, string>} [vars] — Placeholder replacements
 * @returns {string} Translated string
 */
function t(key, vars) {
    let str = (I18N[currentLang] && I18N[currentLang][key]) || I18N.de[key] || key;
    if (vars) {
        for (const [k, v] of Object.entries(vars)) {
            str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
        }
    }
    return str;
}

/**
 * Returns the translated allergen name by allergen ID.
 * @param {string} id — Allergen ID (e.g. 'gluten')
 * @returns {string} Translated name
 */
function tAllergen(id) {
    const keyMap = {
        gluten: 'allergenGluten', krebstiere: 'allergenKrebstiere',
        eier: 'allergenEier', fisch: 'allergenFisch',
        erdnuesse: 'allergenErdnuesse', soja: 'allergenSoja',
        milch: 'allergenMilch', schalenfruchte: 'allergenSchalenfruchte',
        sellerie: 'allergenSellerie', senf: 'allergenSenf',
        sesam: 'allergenSesam', sulfite: 'allergenSulfite',
        lupinen: 'allergenLupinen', weichtiere: 'allergenWeichtiere',
    };
    return t(keyMap[id] || id);
}

/**
 * Returns the translated day name.
 * @param {number} i — Day index (0=Mon … 4=Fri)
 * @returns {string}
 */
function tDay(i) {
    const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    return t(keys[i]);
}

/**
 * Returns the translated category label.
 * @param {string} cat — Category key ('fleisch', 'fisch', 'vegetarisch', 'vegan')
 * @returns {string}
 */
function tCategory(cat) {
    const map = { fleisch: 'catMeat', fisch: 'catFish', vegetarisch: 'catVegetarian', vegan: 'catVegan' };
    return t(map[cat] || cat);
}

/**
 * Returns translated category label for segmented controls (shorter).
 * @param {string} cat
 * @returns {string}
 */
function tCategoryShort(cat) {
    const map = { fleisch: 'catMeat', fisch: 'catFish', vegetarisch: 'catVeggie', vegan: 'catVegan', alle: 'catAll' };
    return t(map[cat] || cat);
}

/**
 * Returns the translated role label.
 * @param {string} role — Role key
 * @returns {string}
 */
function tRole(role) {
    const map = { admin: 'roleAdmin', kueche: 'roleKitchen', eltern: 'roleParent' };
    return t(map[role] || role);
}

/**
 * Applies all data-i18n attributes in the DOM and sets RTL direction.
 */
function applyLanguageToDOM() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    // Placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPh);
    });
    // Titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
    // HTML lang attribute & RTL
    const html = document.documentElement;
    html.lang = currentLang;
    if (RTL_LANGS.has(currentLang)) {
        html.dir = 'rtl';
    } else {
        html.dir = 'ltr';
    }
}

/**
 * Sets and applies a new language.
 * @param {string} lang — Language code
 */
function setLanguage(lang) {
    if (!I18N[lang]) lang = 'de';
    currentLang = lang;
    localStorage.setItem('kita-lang', lang);
    applyLanguageToDOM();
    // Re-render dynamic content if app is loaded
    if (typeof renderAll === 'function' && state && state.currentUser) {
        renderAll();
    }
}

// Initialize language on load
currentLang = getLangPref();
