/**
 * @file KiTa Lummerland — Essensplanung App
 * @description Single-Page-Application zur Verwaltung von Wochenspeiseplänen,
 *   Speisen, Kindern und Benutzern in einer KiTa. Unterstützt Firebase Auth
 *   und Firestore als Backend sowie einen Offline-Demo-Modus.
 * @version 2.0.0
 * @license MIT
 *
 * @requires firebase-app-compat.js
 * @requires firebase-auth-compat.js
 * @requires firebase-firestore-compat.js
 * @requires firebase-config.js — exportiert globale `firebaseConfig`
 */

// ═══════════════════════════════════════════════════════════════
//  Type Definitions
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} Allergen
 * @property {string} id    — Eindeutiger Bezeichner (z.B. 'gluten')
 * @property {string} name  — Anzeigename (z.B. 'Gluten')
 */

/**
 * @typedef {Object} Meal
 * @property {string}   id          — Firestore-Dokument-ID oder Demo-ID
 * @property {string}   name        — Name der Speise
 * @property {'fleisch'|'fisch'|'vegetarisch'|'vegan'} category
 * @property {string}   description — Optionale Beschreibung
 * @property {string[]} allergens   — Array von Allergen-IDs
 */

/**
 * @typedef {Object} Child
 * @property {string}   id        — Firestore-Dokument-ID oder Demo-ID
 * @property {string}   firstname — Vorname
 * @property {string}   lastname  — Nachname
 * @property {string}   group     — KiTa-Gruppe (z.B. 'Lummerland')
 * @property {string}   notes     — Freitext-Hinweise
 * @property {string[]} allergens — Array von Allergen-IDs
 */

/**
 * @typedef {Object} AppUser
 * @property {string}      uid     — Firebase Auth UID
 * @property {string}      email
 * @property {string}      name    — Anzeigename
 * @property {'admin'|'kueche'|'eltern'} role
 * @property {string|null} childId — Zugeordnetes Kind (nur bei Rolle 'eltern')
 */

/**
 * @typedef {Object.<number, string[]>} WeekPlanData
 * Mapping von Wochentag-Index (0=Mo … 4=Fr) auf Array von Meal-IDs.
 */

/**
 * @typedef {Object} AppState
 * @property {Meal[]}   meals
 * @property {Child[]}  children
 * @property {Object.<string, WeekPlanData>} weekPlans — Key: 'YYYY-WW'
 * @property {AppUser[]} users
 * @property {number}    currentWeekOffset — 0 = aktuelle Woche
 * @property {string|null} editingMealId
 * @property {string|null} editingChildId
 * @property {number|null} pickingDay — Wochentag-Index für Speiseauswahl
 * @property {AppUser|null} currentUser
 * @property {boolean}  demoMode
 */

// ═══════════════════════════════════════════════════════════════
//  Firebase Initialisation
// ═══════════════════════════════════════════════════════════════

/** @type {firebase.auth.Auth|undefined} */
let auth;
/** @type {firebase.firestore.Firestore|undefined} */
let db;

try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    }
} catch (err) {
    console.error('Firebase init:', err.message);
}

// ═══════════════════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Allergen[]} Die 14 EU-Hauptallergene */
const ALLERGENS = [
    { id: 'gluten', name: 'Gluten' }, { id: 'krebstiere', name: 'Krebstiere' },
    { id: 'eier', name: 'Eier' }, { id: 'fisch', name: 'Fisch' },
    { id: 'erdnuesse', name: 'Erdnüsse' }, { id: 'soja', name: 'Soja' },
    { id: 'milch', name: 'Milch/Laktose' }, { id: 'schalenfruchte', name: 'Schalenfrüchte' },
    { id: 'sellerie', name: 'Sellerie' }, { id: 'senf', name: 'Senf' },
    { id: 'sesam', name: 'Sesam' }, { id: 'sulfite', name: 'Sulfite' },
    { id: 'lupinen', name: 'Lupinen' }, { id: 'weichtiere', name: 'Weichtiere' },
];

/** @type {string[]} Wochentage Keys (für tDay()) */
const DAY_KEYS = [0, 1, 2, 3, 4];

/** @type {Object.<string, string>} Kategorie-ID → i18n-Key */
const CATEGORY_KEYS = { fleisch: 'catMeat', fisch: 'catFish', vegetarisch: 'catVegetarian', vegan: 'catVegan' };

/** @type {Object.<string, string>} Rollen-ID → i18n-Key */
const ROLE_KEYS = { admin: 'roleAdmin', kueche: 'roleKitchen', eltern: 'roleParent' };

// ═══════════════════════════════════════════════════════════════
//  Application State
// ═══════════════════════════════════════════════════════════════

/** @type {AppState} Globaler, reaktiver App-Zustand */
let state = {
    meals: [], children: [], weekPlans: {}, users: [],
    currentWeekOffset: 0, editingMealId: null, editingChildId: null, pickingDay: null,
    currentUser: null, demoMode: false,
    /** @type {Object.<string, Object>} KiTa settings including cutoff times */
    kitaSettings: { cutoffHour: 9, cutoffMinute: 0 },
    /** @type {Object.<string, string>} Group → Waggon name mapping */
    waggonMap: {},
};

// ═══════════════════════════════════════════════════════════════
//  Authentication
// ═══════════════════════════════════════════════════════════════

/**
 * Firebase Auth State Observer.
 * Wird bei jedem Login/Logout automatisch aufgerufen.
 * Erstellt bei erstmaligem Login automatisch ein User-Dokument in Firestore.
 * Der erste registrierte Benutzer erhält die Rolle 'admin'.
 */
if (auth) {
    auth.onAuthStateChanged(async (user) => {
        const errEl = document.getElementById('login-error');
        if (user) {
            state.currentUser = { uid: user.uid, email: user.email, name: user.email.split('@')[0], role: 'admin', childId: null };
            showApp();
            try {
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists) {
                    state.currentUser = { uid: user.uid, ...doc.data() };
                } else {
                    const snap = await db.collection('users').get();
                    const role = snap.empty ? 'admin' : 'eltern';
                    const data = { email: user.email, name: user.email.split('@')[0], role: role, childId: null };
                    await db.collection('users').doc(user.uid).set(data);
                    state.currentUser = { uid: user.uid, ...data };
                }
                showApp();
                await loadAllData();
                renderAll();
            } catch (err) {
                console.error('Firestore:', err.message);
                renderAll();
            }
            errEl.classList.add('hidden');
        } else {
            state.currentUser = null;
            showLogin();
        }
    });
}

/**
 * Login-Formular Submit-Handler.
 * Authentifiziert den Benutzer mit E-Mail und Passwort.
 * Zeigt lokalisierte Fehlermeldungen bei Firebase Auth Errors.
 * @listens submit#form-login
 */
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = e.target.querySelector('button[type="submit"]');
    errEl.classList.add('hidden');
    if (!auth) { errEl.textContent = t('firebaseNotLoaded'); errEl.classList.remove('hidden'); return; }
    btn.disabled = true; btn.textContent = t('loggingIn');
    try {
        await auth.signInWithEmailAndPassword(email, pw);
    } catch (err) {
        errEl.textContent = t(err.code) !== err.code ? t(err.code) : (err.code + ' — ' + err.message);
        errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false; btn.textContent = t('login');
    }
});

/**
 * Registrierungs-Button Handler.
 * Erstellt ein neues Firebase Auth Konto. Mindestens 6 Zeichen Passwort erforderlich.
 * @listens click#btn-register
 */
document.getElementById('btn-register').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('btn-register');
    errEl.classList.add('hidden');
    if (!auth) { errEl.textContent = t('firebaseNotLoaded'); errEl.classList.remove('hidden'); return; }
    if (!email || !pw) { errEl.textContent = t('emailAndPwRequired'); errEl.classList.remove('hidden'); return; }
    if (pw.length < 6) { errEl.textContent = t('pwMinLength'); errEl.classList.remove('hidden'); return; }
    btn.disabled = true; btn.textContent = t('registering');
    try {
        await auth.createUserWithEmailAndPassword(email, pw);
    } catch (err) {
        errEl.textContent = t(err.code) !== err.code ? t(err.code) : (err.code || err.message);
        errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false; btn.textContent = t('register');
    }
});

/**
 * Logout-Handler. Setzt im Demo-Modus den State zurück,
 * ansonsten wird Firebase Auth signOut aufgerufen.
 * @listens click#btn-logout
 */
document.getElementById('btn-logout').addEventListener('click', () => {
    if (state.demoMode) {
        state.demoMode = false; state.currentUser = null;
        state.meals = []; state.children = []; state.weekPlans = {}; state.users = [];
        showLogin(); return;
    }
    auth.signOut();
});

// ═══════════════════════════════════════════════════════════════
//  Demo Mode
// ═══════════════════════════════════════════════════════════════

/**
 * Aktiviert den Demo-Modus mit vorbelegten Testdaten.
 * Kein Firebase-Zugriff nötig — alle Daten nur im lokalen State.
 * @listens click#btn-demo
 */
document.getElementById('btn-demo').addEventListener('click', () => {
    state.demoMode = true;
    state.currentUser = { uid: 'demo', email: 'demo@lummerland.de', name: 'Jim Knopf', role: 'admin', childId: null };
    state.meals = [
        { id: 'd1', name: 'Spaghetti Bolognese', category: 'fleisch', description: '', allergens: ['gluten', 'milch'] },
        { id: 'd2', name: 'Fischstäbchen mit Kartoffelpüree', category: 'fisch', description: '', allergens: ['fisch', 'gluten', 'milch'] },
        { id: 'd3', name: 'Gemüse-Lasagne', category: 'vegetarisch', description: '', allergens: ['gluten', 'milch', 'eier'] },
        { id: 'd4', name: 'Reis mit Gemüsecurry', category: 'vegan', description: '', allergens: [] },
        { id: 'd5', name: 'Hähnchen-Nuggets mit Pommes', category: 'fleisch', description: '', allergens: ['gluten'] },
        { id: 'd6', name: 'Lachs mit Brokkoli', category: 'fisch', description: '', allergens: ['fisch'] },
        { id: 'd7', name: 'Kartoffelsuppe', category: 'vegan', description: '', allergens: ['sellerie'] },
        { id: 'd8', name: 'Pfannkuchen mit Apfelmus', category: 'vegetarisch', description: '', allergens: ['gluten', 'milch', 'eier'] },
    ];
    state.children = [
        { id: 'c1', firstname: 'Jim', lastname: 'Knopf', group: 'Lummerland', notes: '', allergens: [] },
        { id: 'c2', firstname: 'Lukas', lastname: 'Lokomotivführer', group: 'Lummerland', notes: '', allergens: ['milch'] },
        { id: 'c3', firstname: 'Li', lastname: 'Si', group: 'Mandala', notes: 'kein Schweinefleisch', allergens: ['erdnuesse', 'soja'] },
        { id: 'c4', firstname: 'Prinzessin', lastname: 'Li Si', group: 'Mandala', notes: '', allergens: [] },
    ];
    const wk = getWeekKey(0);
    state.weekPlans[wk] = { 0: ['d1'], 1: ['d6'], 2: ['d3', 'd4'], 3: ['d5'], 4: ['d8', 'd7'] };
    state.users = [
        { uid: 'demo', email: 'demo@lummerland.de', name: 'Jim Knopf', role: 'admin', childId: null },
        { uid: 'demo2', email: 'kueche@lummerland.de', name: 'Frau Waas', role: 'kueche', childId: null },
    ];
    showApp(); renderAll();
});

// ═══════════════════════════════════════════════════════════════
//  View Switching
// ═══════════════════════════════════════════════════════════════

/** Zeigt die Login-Seite und versteckt die App */
function showLogin() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
}

/**
 * Zeigt die App-Oberfläche und aktualisiert Header-Informationen.
 * Setzt Benutzername, Rollen-Badge und passt Navigations-Sichtbarkeit an.
 */
function showApp() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    const u = state.currentUser;
    document.getElementById('user-info').innerHTML =
        `${esc(u.name)} <span class="role-badge">${tRole(u.role)}</span>`;
    applyRole();
}

/**
 * Passt die UI-Sichtbarkeit basierend auf der Benutzerrolle an.
 * Staff (admin/kueche) sieht Bearbeitungsoptionen, Admin sieht Benutzerverwaltung.
 */
function applyRole() {
    const r = state.currentUser?.role;
    const staff = r === 'admin' || r === 'kueche';
    document.querySelectorAll('.nav-role-staff').forEach(el => el.style.display = staff ? '' : 'none');
    document.querySelectorAll('.nav-role-admin').forEach(el => el.style.display = r === 'admin' ? '' : 'none');
    document.querySelectorAll('.btn-role-staff').forEach(el => el.style.display = staff ? '' : 'none');
}

/**
 * Prüft ob der aktuelle Benutzer Staff-Rechte hat (Admin oder Küche).
 * @returns {boolean}
 */
function isStaff() { return ['admin', 'kueche'].includes(state.currentUser?.role); }

/**
 * Prüft ob der aktuelle Benutzer Admin ist.
 * @returns {boolean}
 */
function isAdmin() { return state.currentUser?.role === 'admin'; }

// ═══════════════════════════════════════════════════════════════
//  Firestore Data Layer
// ═══════════════════════════════════════════════════════════════

/**
 * Lädt alle Daten parallel aus Firestore in den lokalen State.
 * Lädt Speisen, Kinder und Wochenpläne. Admins erhalten zusätzlich die Benutzerliste.
 * @async
 * @throws {Error} Bei Firestore-Netzwerkfehlern
 */
async function loadAllData() {
    const [mSnap, cSnap, wSnap] = await Promise.all([
        db.collection('meals').get(), db.collection('children').get(), db.collection('weekPlans').get(),
    ]);
    state.meals = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.children = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.weekPlans = {};
    wSnap.docs.forEach(d => { state.weekPlans[d.id] = d.data(); });
    if (isAdmin()) {
        const uSnap = await db.collection('users').get();
        state.users = uSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
    }
}

/** Rendert alle Views neu (Wochenplan, Speisen, Kinder, ggf. Benutzer). */
function renderAll() { renderWeekPlan(); renderMealsList(); renderChildrenList(); if (isAdmin()) renderUsersList(); }

// ═══════════════════════════════════════════════════════════════
//  Calendar / Week Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Berechnet das Datum des Montags einer Woche relativ zur aktuellen.
 * @param {number} off — Wochen-Offset (0 = aktuelle Woche, -1 = letzte, +1 = nächste)
 * @returns {Date} Montag 00:00:00 der Zielwoche
 */
function getMonday(off) {
    const n = new Date(); const d = n.getDay();
    const diff = n.getDate() - d + (d === 0 ? -6 : 1);
    const m = new Date(n.setDate(diff)); m.setDate(m.getDate() + off * 7); m.setHours(0, 0, 0, 0); return m;
}

/**
 * Erzeugt den Firestore-Dokumentschlüssel für eine Woche.
 * @param {number} off — Wochen-Offset
 * @returns {string} Format: 'YYYY-WW' (z.B. '2026-12')
 */
function getWeekKey(off) {
    const m = getMonday(off), y = m.getFullYear(), j = new Date(y, 0, 1);
    return `${y}-${String(Math.ceil((Math.floor((m - j) / 864e5) + j.getDay() + 1) / 7)).padStart(2, '0')}`;
}

/**
 * Erzeugt ein lesbares Wochenlabel.
 * @param {number} off — Wochen-Offset
 * @returns {string} z.B. 'KW 12  ·  16.3. – 20.3.2026'
 */
function getWeekLabel(off) {
    const m = getMonday(off), f = new Date(m); f.setDate(f.getDate() + 4);
    const fmt = d => `${d.getDate()}.${d.getMonth() + 1}.`;
    return `${t('weekLabel')} ${getWeekKey(off).split('-')[1]}  \u00b7  ${fmt(m)} \u2013 ${fmt(f)}${m.getFullYear()}`;
}

/**
 * Gibt das formatierte Datum eines Wochentags zurück.
 * @param {number} off — Wochen-Offset
 * @param {number} i   — Tagesindex (0=Mo … 4=Fr)
 * @returns {string} z.B. '16.3.'
 */
function getDayDate(off, i) { const m = getMonday(off), d = new Date(m); d.setDate(d.getDate() + i); return `${d.getDate()}.${d.getMonth() + 1}.`; }

/**
 * Gibt den Wochenplan für eine Woche zurück (erstellt ihn ggf. leer).
 * @param {number} off — Wochen-Offset
 * @returns {WeekPlanData}
 */
function getWeekPlan(off) { const k = getWeekKey(off); if (!state.weekPlans[k]) state.weekPlans[k] = { 0: [], 1: [], 2: [], 3: [], 4: [] }; return state.weekPlans[k]; }

// ═══════════════════════════════════════════════════════════════
//  iOS Tab Bar Navigation
// ═══════════════════════════════════════════════════════════════

/**
 * Tab-Bar Click-Handler. Wechselt zwischen den Haupt-Views.
 * @listens click.ios-tab
 */
document.querySelectorAll('.ios-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.ios-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${btn.dataset.view}`).classList.add('active');
    });
});

// ═══════════════════════════════════════════════════════════════
//  Modal / Sheet Management
// ═══════════════════════════════════════════════════════════════

/**
 * Öffnet ein iOS-Sheet-Modal und blockiert Hintergrund-Scroll.
 * @param {string} id — DOM-ID des Sheet-Elements
 */
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Schließt ein iOS-Sheet-Modal und gibt Scroll wieder frei.
 * @param {string} id — DOM-ID des Sheet-Elements
 */
function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    document.body.style.overflow = '';
}

/** Backdrop-Tap schließt das übergeordnete Sheet */
document.querySelectorAll('.ios-sheet-backdrop').forEach(bd => {
    bd.addEventListener('click', () => {
        bd.closest('.ios-sheet, .ios-action-sheet').classList.add('hidden');
        document.body.style.overflow = '';
    });
});

/** Cancel-Buttons schließen ihr Sheet */
document.querySelectorAll('.ios-sheet-cancel, .modal-cancel').forEach(b => {
    b.addEventListener('click', () => {
        const sheet = b.closest('.ios-sheet, .ios-action-sheet');
        if (sheet) { sheet.classList.add('hidden'); document.body.style.overflow = ''; }
    });
});

// ═══════════════════════════════════════════════════════════════
//  iOS Action Sheet (ersetzt native confirm())
// ═══════════════════════════════════════════════════════════════

/**
 * Zeigt ein iOS-style Action Sheet mit destruktiver Aktion.
 * Ersetzt den nativen Browser-confirm()-Dialog.
 *
 * @param {string}   title        — Beschreibung der Aktion
 * @param {string}   confirmLabel — Text des roten Bestätigungs-Buttons
 * @param {Function} onConfirm    — Callback bei Bestätigung
 *
 * @example
 * showActionSheet('Speise löschen?', 'Löschen', async () => { ... });
 */
function showActionSheet(title, confirmLabel, onConfirm) {
    const sheet = document.getElementById('ios-action-sheet');
    document.getElementById('action-sheet-title').textContent = title;
    const btn = document.getElementById('action-sheet-confirm');
    btn.textContent = confirmLabel;
    btn.onclick = () => { sheet.classList.add('hidden'); document.body.style.overflow = ''; onConfirm(); };
    document.getElementById('action-sheet-cancel').onclick = () => { sheet.classList.add('hidden'); document.body.style.overflow = ''; };
    sheet.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// ═══════════════════════════════════════════════════════════════
//  Allergen UI Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Rendert iOS-Toggle-Switches für alle 14 Allergene in einen Container.
 * @param {string}   id  — DOM-ID des Zielcontainers
 * @param {string[]} sel — Bereits ausgewählte Allergen-IDs
 */
function renderAllergenCB(id, sel = []) {
    document.getElementById(id).innerHTML = ALLERGENS.map(a =>
        `<div class="ios-allergen-row">
            <span>${tAllergen(a.id)}</span>
            <label class="ios-toggle">
                <input type="checkbox" value="${a.id}" ${sel.includes(a.id) ? 'checked' : ''}>
                <div class="ios-toggle-track"></div>
            </label>
        </div>`
    ).join('');
}

/**
 * Liest alle aktivierten Allergen-Toggles aus einem Container.
 * @param {string} id — DOM-ID des Containers
 * @returns {string[]} Aktivierte Allergen-IDs
 */
function getCheckedAllergens(id) { return [...document.querySelectorAll(`#${id} input:checked`)].map(c => c.value); }

// ═══════════════════════════════════════════════════════════════
//  Speisen (Meals) — CRUD
// ═══════════════════════════════════════════════════════════════

/**
 * Rendert die Speisen-Liste als iOS Grouped Inset List.
 * Filtert optional nach Kategorie. Staff-User sehen Bearbeiten/Löschen-Buttons.
 * @param {'alle'|'fleisch'|'fisch'|'vegetarisch'|'vegan'} [filter='alle']
 */
function renderMealsList(filter = 'alle') {
    const list = document.getElementById('meals-list');
    const items = filter === 'alle' ? state.meals : state.meals.filter(m => m.category === filter);
    const staff = isStaff();
    if (!items.length) { list.innerHTML = `<p style="text-align:center;color:var(--ios-label-tertiary);padding:2rem;font-size:0.88rem;">${t('emptyMeals')}</p>`; return; }
    list.innerHTML = items.map(m => {
        const aNames = m.allergens.map(id => tAllergen(id)).join(', ');
        return `<div class="meal-card">
            <div class="meal-card-info">
                <div class="meal-title">${esc(m.name)} <span class="category-badge cat-${m.category}">${tCategory(m.category)}</span></div>
                <div class="meal-meta">${aNames ? aNames : t('noAllergens')}</div>
            </div>
            ${staff ? `<div class="meal-card-actions">
                <button class="btn-small btn-edit" onclick="editMeal('${m.id}')">${t('edit')}</button>
                <button class="btn-small btn-delete" onclick="deleteMeal('${m.id}')">${t('delete')}</button>
            </div>` : ''}
        </div>`;
    }).join('');
}

/** Segmented Control Filter für Speisen-Kategorien */
document.querySelectorAll('#meals-filter .ios-seg-btn').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('#meals-filter .ios-seg-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); renderMealsList(b.dataset.filter);
    });
});

/** Öffnet das Speise-Modal im Erstellungsmodus. Nur für Staff. */
document.getElementById('btn-add-meal').addEventListener('click', () => {
    if (!isStaff()) return;
    state.editingMealId = null;
    document.getElementById('modal-meal-title').textContent = t('newMeal');
    document.getElementById('form-meal').reset();
    renderAllergenCB('meal-allergens');
    openModal('modal-meal');
});

/**
 * Öffnet das Speise-Modal im Bearbeitungsmodus.
 * @param {string} id — Meal-ID
 * @global
 */
window.editMeal = function (id) {
    if (!isStaff()) return;
    const m = state.meals.find(x => x.id === id); if (!m) return;
    state.editingMealId = id;
    document.getElementById('modal-meal-title').textContent = t('editMeal');
    document.getElementById('meal-name').value = m.name;
    document.getElementById('meal-category').value = m.category;
    document.getElementById('meal-description').value = m.description || '';
    renderAllergenCB('meal-allergens', m.allergens);
    openModal('modal-meal');
};

/**
 * Löscht eine Speise nach Bestätigung via Action Sheet.
 * Entfernt die Speise auch aus allen Wochenplänen.
 * @param {string} id — Meal-ID
 * @global
 */
window.deleteMeal = function (id) {
    if (!isStaff()) return;
    const m = state.meals.find(x => x.id === id);
    showActionSheet(
        m ? t('confirmDeleteMeal', { name: m.name }) : t('confirmDeleteGeneric'),
        t('delete'),
        async () => {
            if (!state.demoMode) await db.collection('meals').doc(id).delete();
            state.meals = state.meals.filter(m => m.id !== id);
            for (const k of Object.keys(state.weekPlans)) {
                const p = state.weekPlans[k]; let changed = false;
                for (let d = 0; d < 5; d++) if (p[d] && p[d].includes(id)) { p[d] = p[d].filter(x => x !== id); changed = true; }
                if (changed && !state.demoMode) await db.collection('weekPlans').doc(k).set(p);
            }
            renderMealsList(); renderWeekPlan();
        }
    );
};

/**
 * Speise-Formular Submit. Erstellt oder aktualisiert eine Speise.
 * Im Demo-Modus werden IDs mit Timestamp generiert.
 * @listens submit#form-meal
 */
document.getElementById('form-meal').addEventListener('submit', async (e) => {
    e.preventDefault(); if (!isStaff()) return;
    const name = document.getElementById('meal-name').value.trim();
    const cat = document.getElementById('meal-category').value;
    const desc = document.getElementById('meal-description').value.trim();
    const allergens = getCheckedAllergens('meal-allergens');
    if (state.editingMealId) {
        const m = state.meals.find(x => x.id === state.editingMealId);
        if (m) { m.name = name; m.category = cat; m.description = desc; m.allergens = allergens; if (!state.demoMode) await db.collection('meals').doc(m.id).set({ name, category: cat, description: desc, allergens }); }
    } else if (state.demoMode) {
        state.meals.push({ id: 'demo_' + Date.now(), name, category: cat, description: desc, allergens });
    } else {
        const ref = await db.collection('meals').add({ name, category: cat, description: desc, allergens });
        state.meals.push({ id: ref.id, name, category: cat, description: desc, allergens });
    }
    closeModal('modal-meal'); renderMealsList(); renderWeekPlan();
});

// ═══════════════════════════════════════════════════════════════
//  Speisen-API (TheMealDB) — Vorschläge laden
// ═══════════════════════════════════════════════════════════════

/**
 * Lädt Speise-Vorschläge von TheMealDB und fügt sie dem lokalen State hinzu.
 * Kategorisiert automatisch basierend auf Zutaten (Fleisch/Fisch/Veggie/Vegan).
 * @async
 * @global
 */
window.loadMealsFromAPI = async function () {
    if (!isStaff()) return;
    const btn = document.getElementById('btn-load-api-meals');
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    try {
        const letters = ['a','b','c','d','e','f','g','h','l','m','p','r','s','t'];
        const letter = letters[Math.floor(Math.random() * letters.length)];
        const resp = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
        const data = await resp.json();
        if (!data.meals || !data.meals.length) {
            if (btn) { btn.disabled = false; btn.textContent = t('apiNoResults') || 'Keine Ergebnisse'; }
            return;
        }
        const meatKw = ['chicken','beef','pork','lamb','turkey','duck','bacon','ham','sausage','steak','meat','veal'];
        const fishKw = ['fish','salmon','tuna','shrimp','prawn','cod','crab','lobster','anchov','sardine','squid','mussel','clam','oyster'];
        const dairyKw = ['milk','cheese','cream','butter','yogurt','egg'];
        let added = 0;
        for (const meal of data.meals.slice(0, 8)) {
            if (state.meals.some(m => m.name === meal.strMeal)) continue;
            const ingrs = [];
            for (let i = 1; i <= 20; i++) {
                const ing = meal['strIngredient' + i];
                if (ing && ing.trim()) ingrs.push(ing.trim().toLowerCase());
            }
            const ingrStr = ingrs.join(' ');
            let category = 'vegan';
            if (meatKw.some(k => ingrStr.includes(k))) category = 'fleisch';
            else if (fishKw.some(k => ingrStr.includes(k))) category = 'fisch';
            else if (dairyKw.some(k => ingrStr.includes(k))) category = 'vegetarisch';
            const allergens = [];
            if (ingrStr.includes('wheat') || ingrStr.includes('flour') || ingrStr.includes('bread') || ingrStr.includes('pasta') || ingrStr.includes('noodle')) allergens.push('gluten');
            if (ingrStr.includes('egg')) allergens.push('eier');
            if (fishKw.some(k => ingrStr.includes(k))) allergens.push('fisch');
            if (ingrStr.includes('milk') || ingrStr.includes('cream') || ingrStr.includes('cheese') || ingrStr.includes('butter') || ingrStr.includes('yogurt')) allergens.push('milch');
            if (ingrStr.includes('peanut')) allergens.push('erdnuesse');
            if (ingrStr.includes('soy') || ingrStr.includes('soya')) allergens.push('soja');
            if (ingrStr.includes('celery')) allergens.push('sellerie');
            if (ingrStr.includes('mustard')) allergens.push('senf');
            if (ingrStr.includes('sesame')) allergens.push('sesam');
            const desc = meal.strInstructions ? meal.strInstructions.substring(0, 120) + '...' : '';
            const newMeal = { id: state.demoMode ? 'api_' + Date.now() + '_' + added : null, name: meal.strMeal, category, description: desc, allergens };
            if (!state.demoMode) {
                const ref = await db.collection('meals').add({ name: newMeal.name, category, description: desc, allergens });
                newMeal.id = ref.id;
            } else {
                newMeal.id = 'api_' + Date.now() + '_' + added;
            }
            state.meals.push(newMeal);
            added++;
        }
        renderMealsList(); renderWeekPlan();
    } catch (err) {
        console.error('TheMealDB API:', err.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '\u{1F50D} ' + (t('apiLoadMeals') || 'Speisen laden'); }
    }
};

// ═══════════════════════════════════════════════════════════════
//  Kinder (Children) — CRUD
// ═══════════════════════════════════════════════════════════════

/**
 * Rendert die Kinderliste als iOS Grouped Inset List.
 * Zeigt Allergie-Tags und Gruppen-Zuordnung.
 */
function renderChildrenList() {
    const list = document.getElementById('children-list');
    if (!state.children.length) { list.innerHTML = `<p style="text-align:center;color:var(--ios-label-tertiary);padding:2rem;font-size:0.88rem;">${t('emptyChildren')}</p>`; return; }
    list.innerHTML = state.children.map(c => {
        const aNames = c.allergens.map(id => tAllergen(id));
        return `<div class="child-card">
            <div class="child-card-info">
                <div class="child-name">${esc(c.firstname)} ${esc(c.lastname)}</div>
                <div class="child-meta">${c.group ? esc(c.group) : ''}${c.notes ? ' \u00b7 ' + esc(c.notes) : ''}</div>
                <div class="child-allergies">${aNames.length ? aNames.map(n => `<span class="allergy-tag">${n}</span>`).join('') : ''}</div>
            </div>
            <div class="meal-card-actions">
                <button class="btn-small btn-edit" onclick="editChild('${c.id}')">${t('edit')}</button>
                <button class="btn-small btn-delete" onclick="deleteChild('${c.id}')">${t('delete')}</button>
            </div>
        </div>`;
    }).join('');
}

/** Öffnet das Kind-Modal im Erstellungsmodus */
document.getElementById('btn-add-child').addEventListener('click', () => {
    if (!isStaff()) return;
    state.editingChildId = null;
    document.getElementById('modal-child-title').textContent = t('newChild');
    document.getElementById('form-child').reset();
    renderAllergenCB('child-allergens');
    openModal('modal-child');
});

/**
 * Öffnet das Kind-Modal im Bearbeitungsmodus.
 * @param {string} id — Child-ID
 * @global
 */
window.editChild = function (id) {
    if (!isStaff()) return;
    const c = state.children.find(x => x.id === id); if (!c) return;
    state.editingChildId = id;
    document.getElementById('modal-child-title').textContent = t('editChild');
    document.getElementById('child-firstname').value = c.firstname;
    document.getElementById('child-lastname').value = c.lastname;
    document.getElementById('child-group').value = c.group || '';
    document.getElementById('child-notes').value = c.notes || '';
    renderAllergenCB('child-allergens', c.allergens);
    openModal('modal-child');
};

/**
 * Löscht ein Kind nach Bestätigung via Action Sheet.
 * @param {string} id — Child-ID
 * @global
 */
window.deleteChild = function (id) {
    if (!isStaff()) return;
    const c = state.children.find(x => x.id === id);
    showActionSheet(
        c ? t('confirmRemoveChild', { name: c.firstname + ' ' + c.lastname }) : t('confirmRemoveChildGeneric'),
        t('remove'),
        async () => {
            if (!state.demoMode) await db.collection('children').doc(id).delete();
            state.children = state.children.filter(c => c.id !== id);
            renderChildrenList();
        }
    );
};

/**
 * Kind-Formular Submit. Erstellt oder aktualisiert ein Kind.
 * @listens submit#form-child
 */
document.getElementById('form-child').addEventListener('submit', async (e) => {
    e.preventDefault(); if (!isStaff()) return;
    const data = {
        firstname: document.getElementById('child-firstname').value.trim(),
        lastname: document.getElementById('child-lastname').value.trim(),
        group: document.getElementById('child-group').value.trim(),
        notes: document.getElementById('child-notes').value.trim(),
        allergens: getCheckedAllergens('child-allergens'),
    };
    if (state.editingChildId) {
        const c = state.children.find(x => x.id === state.editingChildId);
        if (c) { Object.assign(c, data); if (!state.demoMode) await db.collection('children').doc(c.id).set(data); }
    } else if (state.demoMode) {
        state.children.push({ id: 'demo_' + Date.now(), ...data });
    } else {
        const ref = await db.collection('children').add(data);
        state.children.push({ id: ref.id, ...data });
    }
    closeModal('modal-child'); renderChildrenList();
});

// ═══════════════════════════════════════════════════════════════
//  Mandala-Security-System (Allergie-Logik)
// ═══════════════════════════════════════════════════════════════

/**
 * Prüft ob eine Speise für ein Kind sicher ist (Mandala-Check).
 * Vergleicht child.allergens mit meal.allergens.
 * @param {Child} child
 * @param {Meal} meal
 * @returns {{ isLukasApproved: boolean, conflicts: string[], childName: string }}
 */
function checkMandala(child, meal) {
    if (!child || !meal) return { isLukasApproved: true, conflicts: [], childName: '' };
    const conflicts = (meal.allergens || []).filter(a => (child.allergens || []).includes(a));
    return {
        isLukasApproved: conflicts.length === 0,
        conflicts: conflicts,
        childName: child.firstname || '',
    };
}

/**
 * Prüft alle Kinder gegen eine Speise und gibt den Mandala-Status zurück.
 * @param {Meal} meal
 * @returns {{ allSafe: boolean, alerts: Array<{child: Child, conflicts: string[]}> }}
 */
function checkMandalaAll(meal) {
    const alerts = [];
    for (const child of state.children) {
        const result = checkMandala(child, meal);
        if (!result.isLukasApproved) {
            alerts.push({ child, conflicts: result.conflicts });
        }
    }
    return { allSafe: alerts.length === 0, alerts };
}

/**
 * Erzeugt erweiterte Allergie-Warnungen mit Frau-Mahlzahn-Warnung und Lukas-Badge.
 * @param {Meal} meal
 * @returns {string} HTML
 */
function getMandalaWarnings(meal) {
    if (!meal.allergens || !meal.allergens.length) {
        return `<div class="lukas-approved-badge"><span class="lukas-badge-icon">&#x2714;</span> <span data-i18n="lukasApproved">${t('lukasApproved')}</span></div>`;
    }
    if (state.currentUser?.role === 'eltern') {
        if (!state.currentUser.childId) return '';
        const c = state.children.find(x => x.id === state.currentUser.childId);
        if (!c) return '';
        const result = checkMandala(c, meal);
        if (result.isLukasApproved) {
            return `<div class="lukas-approved-badge"><span class="lukas-badge-icon">&#x2714;</span> ${t('lukasApproved')}</div>`;
        }
        return `<div class="frau-mahlzahn-warning"><span class="mahlzahn-icon">&#x1F6A8;</span> <strong>${t('frauMahlzahnWarning')}</strong> ${result.conflicts.map(id => tAllergen(id)).join(', ')}</div>`;
    }
    // Staff view: check all children
    const check = checkMandalaAll(meal);
    if (check.allSafe) {
        return `<div class="lukas-approved-badge"><span class="lukas-badge-icon">&#x2714;</span> ${t('lukasApproved')}</div>`;
    }
    const alertHtml = check.alerts.map(a =>
        `<strong>${esc(a.child.firstname)}</strong>: ${a.conflicts.map(id => tAllergen(id)).join(', ')}`
    ).join(' &middot; ');
    return `<div class="frau-mahlzahn-warning"><span class="mahlzahn-icon">&#x1F6A8;</span> <strong>${t('frauMahlzahnWarning')}</strong> ${alertHtml}</div>`;
}

// ═══════════════════════════════════════════════════════════════
//  Emmas Dampf-Counter (Portionen-Analytik)
// ═══════════════════════════════════════════════════════════════

/**
 * Berechnet Portionsstatistiken für einen Tag.
 * @param {number} weekOffset
 * @param {number} [dayIndex] - Optional: nur für einen Tag. Ohne = ganze Woche.
 * @returns {{ totalPortions: number, veggieCount: number, allergenAlerts: number }}
 */
function getDampfCounter(weekOffset, dayIndex) {
    const plan = getWeekPlan(weekOffset);
    let totalPortions = 0, veggieCount = 0, allergenAlerts = 0;
    const days = dayIndex !== undefined ? [dayIndex] : [0, 1, 2, 3, 4];

    for (const d of days) {
        const ids = plan[d] || [];
        for (const mid of ids) {
            const m = state.meals.find(x => x.id === mid);
            if (!m) continue;
            // Each meal slot = portions for all active children
            totalPortions += state.children.length;
            if (m.category === 'vegetarisch' || m.category === 'vegan') {
                veggieCount += state.children.length;
            }
            // Count allergen alerts
            const check = checkMandalaAll(m);
            allergenAlerts += check.alerts.length;
        }
    }
    return { totalPortions, veggieCount, allergenAlerts };
}

/**
 * Rendert den Dampf-Counter als kompakte Statistik-Leiste.
 */
function renderDampfCounter() {
    const el = document.getElementById('dampf-counter');
    if (!el) return;
    if (!isStaff()) { el.classList.add('hidden'); return; }

    const counter = getDampfCounter(state.currentWeekOffset);
    el.classList.remove('hidden');
    el.innerHTML = `
        <div class="dampf-counter-row">
            <div class="dampf-stat">
                <span class="dampf-stat-icon">&#x1F682;</span>
                <span class="dampf-stat-value">${counter.totalPortions}</span>
                <span class="dampf-stat-label">${t('dampfPortions')}</span>
            </div>
            <div class="dampf-stat dampf-stat-veggie">
                <span class="dampf-stat-icon">&#x1F331;</span>
                <span class="dampf-stat-value">${counter.veggieCount}</span>
                <span class="dampf-stat-label">${t('dampfVeggie')}</span>
            </div>
            <div class="dampf-stat ${counter.allergenAlerts > 0 ? 'dampf-stat-alert' : 'dampf-stat-safe'}">
                <span class="dampf-stat-icon">${counter.allergenAlerts > 0 ? '&#x1F6A8;' : '&#x2705;'}</span>
                <span class="dampf-stat-value">${counter.allergenAlerts}</span>
                <span class="dampf-stat-label">${t('dampfAllergenAlerts')}</span>
            </div>
        </div>`;
}

// ═══════════════════════════════════════════════════════════════
//  Notbremse (Schnell-Stornierung mit Deadline-Check)
// ═══════════════════════════════════════════════════════════════

/**
 * Prüft ob die Bestellfrist für einen bestimmten Tag abgelaufen ist.
 * @param {number} dayIndex - 0=Mo, 4=Fr
 * @param {number} [weekOffset] - default: state.currentWeekOffset
 * @returns {boolean} true wenn Frist abgelaufen
 */
function isDeadlinePassed(dayIndex, weekOffset) {
    const off = weekOffset !== undefined ? weekOffset : state.currentWeekOffset;
    const monday = getMonday(off);
    const targetDate = new Date(monday);
    targetDate.setDate(targetDate.getDate() + dayIndex);
    targetDate.setHours(state.kitaSettings.cutoffHour, state.kitaSettings.cutoffMinute, 0, 0);
    return new Date() > targetDate;
}

/**
 * Notbremse: 1-Click Stornierung einer Speise von einem Tag.
 * Prüft Deadline, zeigt "Signal steht auf Rot" wenn zu spät.
 * @param {number} dayIndex
 * @param {string} mealId
 * @global
 */
window.notbremse = async function(dayIndex, mealId) {
    if (!isStaff()) return;

    if (isDeadlinePassed(dayIndex)) {
        // Signal steht auf Rot - zu spät zum Stornieren
        const el = document.getElementById('notbremse-alert');
        if (el) {
            el.classList.remove('hidden');
            el.innerHTML = `<div class="notbremse-rot">
                <span class="notbremse-signal">&#x1F6D1;</span>
                <strong>${t('signalRot')}</strong> ${t('signalRotMsg')}
            </div>`;
            setTimeout(() => el.classList.add('hidden'), 4000);
        }
        return;
    }

    // Optimistic UI: sofort entfernen
    const k = getWeekKey(state.currentWeekOffset);
    const plan = getWeekPlan(state.currentWeekOffset);
    if (plan[dayIndex]) {
        const idx = plan[dayIndex].indexOf(mealId);
        if (idx !== -1) plan[dayIndex].splice(idx, 1);
    }
    renderWeekPlan();

    // Persistieren
    if (!state.demoMode) {
        try {
            await db.collection('weekPlans').doc(k).set(plan);
        } catch (err) {
            // Rollback on error
            plan[dayIndex] = plan[dayIndex] || [];
            plan[dayIndex].push(mealId);
            renderWeekPlan();
            handleWilde13Error(err);
        }
    }
};

// ═══════════════════════════════════════════════════════════════
//  Lukas-Modus (Gruppen-/Waggon-Verwaltung + Drag & Drop)
// ═══════════════════════════════════════════════════════════════

/** Currently dragged meal info */
let dragData = null;

/**
 * Startet einen Drag-Vorgang für eine Speise im Wochenplan.
 * @param {DragEvent} e
 * @param {number} fromDay - Quell-Tagesindex
 * @param {string} mealId - Meal-ID
 */
window.onDragStartMeal = function(e, fromDay, mealId) {
    dragData = { fromDay, mealId };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ fromDay, mealId }));
    e.target.closest('.day-meal')?.classList.add('dragging');
};

/**
 * Erlaubt Drop auf einem Tag-Container.
 * @param {DragEvent} e
 */
window.onDragOverDay = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('day-card-dragover');
};

/**
 * Entfernt Drag-Over-Styling.
 * @param {DragEvent} e
 */
window.onDragLeaveDay = function(e) {
    e.currentTarget.classList.remove('day-card-dragover');
};

/**
 * Verschiebt eine Speise per Drag & Drop zwischen Tagen.
 * @param {DragEvent} e
 * @param {number} toDay - Ziel-Tagesindex
 */
window.onDropDay = async function(e, toDay) {
    e.preventDefault();
    e.currentTarget.classList.remove('day-card-dragover');
    if (!dragData || !isStaff()) return;

    const { fromDay, mealId } = dragData;
    if (fromDay === toDay) { dragData = null; return; }

    const k = getWeekKey(state.currentWeekOffset);
    const plan = getWeekPlan(state.currentWeekOffset);

    // Remove from source
    if (plan[fromDay]) {
        const idx = plan[fromDay].indexOf(mealId);
        if (idx !== -1) plan[fromDay].splice(idx, 1);
    }
    // Add to target
    if (!plan[toDay]) plan[toDay] = [];
    plan[toDay].push(mealId);

    dragData = null;
    renderWeekPlan();

    if (!state.demoMode) {
        try {
            await db.collection('weekPlans').doc(k).set(plan);
        } catch (err) {
            handleWilde13Error(err);
        }
    }
};

/**
 * Gibt die Waggon-Gruppen zurück (einzigartige Gruppen aller Kinder).
 * @returns {string[]}
 */
function getWaggonGroups() {
    const groups = new Set();
    for (const c of state.children) {
        if (c.group) groups.add(c.group);
    }
    return [...groups].sort();
}

/**
 * Rendert den Gruppen-Filter im Wochenplan.
 */
function renderWaggonFilter() {
    const el = document.getElementById('waggon-filter');
    if (!el || !isStaff()) { if (el) el.classList.add('hidden'); return; }

    const groups = getWaggonGroups();
    if (!groups.length) { el.classList.add('hidden'); return; }

    el.classList.remove('hidden');
    el.innerHTML = `<div class="waggon-filter-row">
        <span class="waggon-filter-label">&#x1F683; ${t('waggonFilter')}:</span>
        ${groups.map(g => `<button class="waggon-filter-btn" data-group="${esc(g)}">${esc(g)}</button>`).join('')}
        <button class="waggon-filter-btn waggon-filter-all active">${t('catAll')}</button>
    </div>`;

    el.querySelectorAll('.waggon-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            el.querySelectorAll('.waggon-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state._activeWaggonFilter = btn.dataset.group || null;
            renderWeekPlan();
        });
    });
}

// ═══════════════════════════════════════════════════════════════
//  Die Wilde 13 (Robustes Error Handling)
// ═══════════════════════════════════════════════════════════════

/**
 * Globaler Error-Handler. Fängt unbehandelte Fehler ab.
 * Zeigt die "Wilde 13" Fehlerseite.
 * @param {Error|string} error
 */
function handleWilde13Error(error) {
    const msg = error?.message || error?.toString() || t('wilde13UnknownError');
    console.error('[Wilde 13]', msg);
    showWilde13Page(msg);
}

/**
 * Zeigt die Wilde-13-Fehlerseite.
 * @param {string} message
 */
function showWilde13Page(message) {
    const el = document.getElementById('wilde13-error-page');
    if (!el) return;
    const msgEl = document.getElementById('wilde13-error-msg');
    if (msgEl) msgEl.textContent = message;
    el.classList.remove('hidden');
}

/**
 * "Zurück zum Leuchtturm" — Recovery-Funktion.
 * Setzt Cache/State zurück und leitet zum Dashboard.
 * @global
 */
window.zurueckZumLeuchtturm = function() {
    const el = document.getElementById('wilde13-error-page');
    if (el) el.classList.add('hidden');

    // Reset to safe state
    state.editingMealId = null;
    state.editingChildId = null;
    state.pickingDay = null;

    // Close all modals
    document.querySelectorAll('.ios-sheet, .ios-action-sheet').forEach(s => s.classList.add('hidden'));
    document.body.style.overflow = '';

    // Navigate to Fahrplan
    document.querySelectorAll('.ios-tab').forEach(b => b.classList.remove('active'));
    document.querySelector('.ios-tab[data-view="wochenplan"]')?.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-wochenplan')?.classList.add('active');

    // Re-render
    try { renderAll(); } catch (e) { console.error('Recovery render failed:', e); }
};

/** Global error handlers */
window.addEventListener('error', (e) => {
    if (e.message?.includes('Script error')) return;
    handleWilde13Error(e.error || e.message);
});

window.addEventListener('unhandledrejection', (e) => {
    handleWilde13Error(e.reason);
});

// ═══════════════════════════════════════════════════════════════
//  Wochenplan (Weekly Meal Plan)
// ═══════════════════════════════════════════════════════════════

/**
 * Rendert den kompletten Wochenplan als 5-Tage-Grid.
 * Zeigt pro Tag die zugewiesenen Speisen, Kategorie-Badges, Allergie-Warnungen
 * und (für Staff) Buttons zum Hinzufügen/Entfernen.
 */
function renderWeekPlan() {
    const grid = document.getElementById('weekplan-grid');
    const plan = getWeekPlan(state.currentWeekOffset);
    const wl = getWeekLabel(state.currentWeekOffset);
    document.getElementById('current-week').textContent = wl;
    const pl = document.getElementById('print-week-label'); if (pl) pl.textContent = wl;
    const staff = isStaff();
    renderParentBanner();

    grid.innerHTML = DAY_KEYS.map(i => {
        const day = tDay(i);
        const ids = plan[i] || [];
        const dateStr = getDayDate(state.currentWeekOffset, i);
        const deadlinePassed = isDeadlinePassed(i);
        const mealsHtml = ids.map(mid => {
            const m = state.meals.find(x => x.id === mid); if (!m) return '';
            const dragAttr = staff ? `draggable="true" ondragstart="onDragStartMeal(event,${i},'${mid}')"` : '';
            return `<div class="day-meal" ${dragAttr}>
                <div class="meal-name">${esc(m.name)}</div>
                <span class="category-badge cat-${m.category}">${tCategory(m.category)}</span>
                ${staff ? `<button class="btn-notbremse" onclick="notbremse(${i},'${mid}')" title="${t('notbremseTitle')}">&#x1F6D1;</button>` : ''}
                ${staff ? `<button class="btn-remove-meal" onclick="removeMealFromDay(${i},'${mid}')">&times;</button>` : ''}
                ${getMandalaWarnings(m)}
            </div>`;
        }).join('');
        const dropAttrs = staff ? `ondragover="onDragOverDay(event)" ondragleave="onDragLeaveDay(event)" ondrop="onDropDay(event,${i})"` : '';
        return `<div class="day-card ${deadlinePassed ? 'day-card-locked' : ''}" ${dropAttrs}>
            <div class="day-card-header">${day} <span class="day-date">${dateStr}</span>${deadlinePassed ? ' <span class="deadline-badge">&#x1F512;</span>' : ''}</div>
            <div class="day-card-body">${mealsHtml}${staff ? `<button class="btn-add-day-meal" onclick="pickMealForDay(${i})">${t('addMealToDay')}</button>` : ''}</div>
        </div>`;
    }).join('');
    renderStats(); renderDampfCounter(); renderWaggonFilter();
    if (staff) checkVariety();
}

/**
 * Zeigt ein Allergie-Banner für Eltern mit zugeordnetem Kind.
 * Nur sichtbar wenn die Rolle 'eltern' ist und ein Kind zugeordnet ist.
 */
function renderParentBanner() {
    const b = document.getElementById('parent-allergy-banner'); if (!b) return;
    if (state.currentUser?.role !== 'eltern' || !state.currentUser?.childId) { b.classList.add('hidden'); return; }
    const c = state.children.find(x => x.id === state.currentUser.childId);
    if (!c || !c.allergens.length) { b.classList.add('hidden'); return; }
    b.classList.remove('hidden');
    b.innerHTML = `<strong>${t('allergyBannerPrefix', { name: esc(c.firstname) })}</strong> ${c.allergens.map(id => tAllergen(id)).join(', ')}`;
}

/**
 * Erzeugt HTML für Allergie-Warnungen bei einer Speise.
 * - Eltern: Warnt nur bei Übereinstimmung mit dem eigenen Kind
 * - Staff: Warnt bei allen betroffenen Kindern der KiTa
 *
 * @param {Meal} meal — Die zu prüfende Speise
 * @returns {string} HTML-String (leer wenn keine Warnung)
 */
function getAllergyWarnings(meal) {
    if (!meal.allergens.length) return '';
    if (state.currentUser?.role === 'eltern') {
        if (!state.currentUser.childId) return '';
        const c = state.children.find(x => x.id === state.currentUser.childId); if (!c) return '';
        const common = meal.allergens.filter(a => c.allergens.includes(a));
        if (!common.length) return '';
        return `<div class="allergy-warning"><strong>${t('allergyWarning')}</strong> ${common.map(id => tAllergen(id)).join(', ')}</div>`;
    }
    if (!state.children.length) return '';
    const aff = [];
    for (const c of state.children) {
        const common = meal.allergens.filter(a => c.allergens.includes(a));
        if (common.length) aff.push(`<strong>${esc(c.firstname)}</strong>: ${common.map(id => tAllergen(id)).join(', ')}`);
    }
    return aff.length ? `<div class="allergy-warning">${aff.join(' · ')}</div>` : '';
}

/**
 * Rendert die Kategorie-Statistik-Karten für den aktuellen Wochenplan.
 * Zeigt Anzahl Fleisch/Fisch/Veggie/Vegan als Zahlen-Badges.
 */
function renderStats() {
    const plan = getWeekPlan(state.currentWeekOffset);
    const cats = { fleisch: 0, fisch: 0, vegetarisch: 0, vegan: 0 };
    for (let d = 0; d < 5; d++) for (const mid of (plan[d] || [])) { const m = state.meals.find(x => x.id === mid); if (m) cats[m.category]++; }
    document.getElementById('stats-bar').innerHTML =
        Object.entries(cats).map(([k, v]) => `<div class="stat-card stat-${k}"><div class="stat-value" style="color:var(--cat-${k})">${v}</div><div class="stat-label">${tCategory(k)}</div></div>`).join('');
}

/**
 * Prüft die Abwechslung im Wochenplan und zeigt Empfehlungen.
 * Regeln: Max. 50% Fleisch, mind. 1x Fisch, mind. 30% veggie/vegan.
 * Nur ab 3+ geplanten Speisen aktiv.
 */
function checkVariety() {
    const plan = getWeekPlan(state.currentWeekOffset), el = document.getElementById('variety-alert');
    const cats = { fleisch: 0, fisch: 0, vegetarisch: 0, vegan: 0 }; let total = 0;
    for (let d = 0; d < 5; d++) for (const mid of (plan[d] || [])) { const m = state.meals.find(x => x.id === mid); if (m) { cats[m.category]++; total++; } }
    if (total < 3) { el.classList.add('hidden'); return; }
    const msgs = [];
    if (cats.fleisch / total > 0.5) msgs.push(t('varietyTooMuchMeat'));
    if (cats.fisch === 0 && total >= 4) msgs.push(t('varietyNeedFish'));
    if ((cats.vegetarisch + cats.vegan) / total < 0.3 && total >= 4) msgs.push(t('varietyMoreVeggie'));
    if (msgs.length) { el.className = 'ios-banner alert alert-warning'; el.innerHTML = '<strong>' + t('varietyTipPrefix') + '</strong> ' + msgs.join(' '); }
    else if (total >= 5) { el.className = 'ios-banner alert alert-success'; el.textContent = t('varietyGood'); }
    else el.classList.add('hidden');
}

/** Wochen-Navigation: vorherige Woche */
document.getElementById('prev-week').addEventListener('click', () => { state.currentWeekOffset--; renderWeekPlan(); });
/** Wochen-Navigation: nächste Woche */
document.getElementById('next-week').addEventListener('click', () => { state.currentWeekOffset++; renderWeekPlan(); });

/**
 * Öffnet das Speise-Auswahl-Sheet für einen bestimmten Wochentag.
 * @param {number} i — Tagesindex (0=Mo … 4=Fr)
 * @global
 */
window.pickMealForDay = function (i) {
    if (!isStaff()) return; state.pickingDay = i;
    document.getElementById('modal-pick-title').textContent = t('pickMealDay', { day: tDay(i) });
    renderPickList('alle');
    document.querySelectorAll('.pick-filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.pick-filter-btn[data-filter="alle"]').classList.add('active');
    openModal('modal-pick-meal');
};

/**
 * Rendert die Speisen-Auswahlliste im Pick-Modal.
 * @param {'alle'|'fleisch'|'fisch'|'vegetarisch'|'vegan'} filter
 */
function renderPickList(filter) {
    const list = document.getElementById('pick-meals-list');
    const items = filter === 'alle' ? state.meals : state.meals.filter(m => m.category === filter);
    if (!items.length) { list.innerHTML = `<p style="text-align:center;color:var(--ios-label-tertiary);padding:2rem;font-size:0.88rem;">${t('emptyPickList')}</p>`; return; }
    list.innerHTML = items.map(m => {
        const aNames = m.allergens.map(id => tAllergen(id)).join(', ');
        return `<div class="meal-card" onclick="selectMealForDay('${m.id}')">
            <div class="meal-card-info">
                <div class="meal-title">${esc(m.name)} <span class="category-badge cat-${m.category}">${tCategory(m.category)}</span></div>
                <div class="meal-meta">${aNames || t('noAllergens')}</div>
            </div>
        </div>`;
    }).join('');
}

/** Filter-Buttons im Speise-Auswahl-Sheet */
document.querySelectorAll('.pick-filter-btn').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('.pick-filter-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); renderPickList(b.dataset.filter);
    });
});

/**
 * Fügt eine Speise einem Wochentag hinzu und persistiert in Firestore.
 * @param {string} mealId — Meal-ID
 * @global
 * @async
 */
window.selectMealForDay = async function (mealId) {
    if (!isStaff()) return;
    const k = getWeekKey(state.currentWeekOffset), plan = getWeekPlan(state.currentWeekOffset);
    if (!plan[state.pickingDay]) plan[state.pickingDay] = [];
    plan[state.pickingDay].push(mealId);
    if (!state.demoMode) await db.collection('weekPlans').doc(k).set(plan);
    closeModal('modal-pick-meal'); renderWeekPlan();
};

/**
 * Entfernt eine Speise von einem Wochentag und persistiert in Firestore.
 * @param {number} di     — Tagesindex (0=Mo … 4=Fr)
 * @param {string} mealId — Meal-ID
 * @global
 * @async
 */
window.removeMealFromDay = async function (di, mealId) {
    if (!isStaff()) return;
    const k = getWeekKey(state.currentWeekOffset), plan = getWeekPlan(state.currentWeekOffset);
    if (plan[di]) { const idx = plan[di].indexOf(mealId); if (idx !== -1) plan[di].splice(idx, 1); }
    if (!state.demoMode) await db.collection('weekPlans').doc(k).set(plan);
    renderWeekPlan();
};

// ═══════════════════════════════════════════════════════════════
//  Benutzerverwaltung (Admin only)
// ═══════════════════════════════════════════════════════════════

/**
 * Rendert die Benutzerliste als iOS Grouped Inset List.
 * Zeigt Rollen-Badge und ggf. zugeordnetes Kind.
 * Der eigene Account kann nicht gelöscht werden.
 */
function renderUsersList() {
    const list = document.getElementById('users-list'); if (!list) return;
    if (!state.users.length) { list.innerHTML = `<p style="text-align:center;color:var(--ios-label-tertiary);padding:2rem;font-size:0.88rem;">${t('emptyUsers')}</p>`; return; }
    list.innerHTML = state.users.map(u => {
        const childName = u.childId ? (() => { const c = state.children.find(x => x.id === u.childId); return c ? `${c.firstname} ${c.lastname}` : ''; })() : '';
        const isSelf = u.uid === state.currentUser?.uid;
        return `<div class="child-card">
            <div class="child-card-info">
                <div class="child-name">${esc(u.name || u.email)} <span class="role-badge">${tRole(u.role)}</span></div>
                <div class="child-meta">${esc(u.email)}${childName ? ' \u00b7 ' + esc(childName) : ''}</div>
            </div>
            ${!isSelf ? `<div class="meal-card-actions"><button class="btn-small btn-delete" onclick="deleteUser('${u.uid}')">${t('delete')}</button></div>` : ''}
        </div>`;
    }).join('');
}

/** Öffnet das Benutzer-Erstellungs-Modal und füllt die Kind-Auswahl */
document.getElementById('btn-add-user').addEventListener('click', () => {
    document.getElementById('form-user').reset();
    document.getElementById('user-form-error').classList.add('hidden');
    document.getElementById('user-child-assign').classList.add('hidden');
    const cs = document.getElementById('user-child-select');
    cs.innerHTML = `<option value="">${t('noChild')}</option>` +
        state.children.map(c => `<option value="${c.id}">${esc(c.firstname)} ${esc(c.lastname)}</option>`).join('');
    openModal('modal-user');
});

/** Zeigt/versteckt die Kind-Zuweisung basierend auf der gewählten Rolle */
document.getElementById('user-role').addEventListener('change', e => {
    document.getElementById('user-child-assign').classList.toggle('hidden', e.target.value !== 'eltern');
});

/**
 * Benutzer-Formular Submit. Erstellt einen neuen Firebase Auth Account
 * über eine sekundäre App-Instanz (um den aktuellen Admin nicht auszuloggen)
 * und legt ein User-Dokument in Firestore an.
 * @listens submit#form-user
 */
document.getElementById('form-user').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('user-form-error');
    errEl.classList.add('hidden');
    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const pw = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    const childId = role === 'eltern' ? document.getElementById('user-child-select').value || null : null;
    try {
        const sec = firebase.initializeApp(firebaseConfig, 'Secondary');
        const cred = await sec.auth().createUserWithEmailAndPassword(email, pw);
        const uid = cred.user.uid;
        await sec.auth().signOut(); await sec.delete();
        await db.collection('users').doc(uid).set({ email, name, role, childId });
        state.users.push({ uid, email, name, role, childId });
        closeModal('modal-user'); renderUsersList();
    } catch (err) {
        errEl.textContent = t(err.code) !== err.code ? t(err.code) : err.message;
        errEl.classList.remove('hidden');
    }
});

/**
 * Löscht einen Benutzer nach Bestätigung via Action Sheet.
 * Entfernt nur das Firestore-Dokument (Firebase Auth Account bleibt bestehen).
 * @param {string} uid — Firebase Auth UID
 * @global
 */
window.deleteUser = function (uid) {
    showActionSheet(t('confirmRemoveUser'), t('remove'), async () => {
        if (!state.demoMode) await db.collection('users').doc(uid).delete();
        state.users = state.users.filter(u => u.uid !== uid);
        renderUsersList();
    });
};

// ═══════════════════════════════════════════════════════════════
//  Theme (Light / Dark / System)
// ═══════════════════════════════════════════════════════════════

/**
 * Liest die gespeicherte Theme-Präferenz aus localStorage.
 * @returns {'light'|'dark'|'system'} Standard: 'system'
 */
function getThemePref() { return localStorage.getItem('kita-theme') || 'system'; }

/**
 * Wendet das Theme auf das Dokument an.
 * Setzt data-theme Attribut, aktualisiert meta theme-color und Header-Icon.
 * @param {'light'|'dark'|'system'} pref — Gewählte Präferenz
 */
function applyTheme(pref) {
    const html = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    let effective;
    if (pref === 'system') {
        effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
        effective = pref;
    }
    html.setAttribute('data-theme', effective);
    if (meta) meta.content = effective === 'dark' ? '#0d1820' : '#1a3a5f';
    updateThemeIcon(effective);
}

/**
 * Aktualisiert das Theme-Toggle-Icon im Header (Sonne/Mond).
 * @param {'light'|'dark'} effective — Aktuell angewendetes Theme
 */
function updateThemeIcon(effective) {
    const btn = document.getElementById('btn-theme');
    if (!btn) return;
    if (effective === 'dark') {
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    } else {
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    }
}

/**
 * Aktualisiert die aktive Auswahl im Theme-Picker-Sheet.
 * @param {'light'|'dark'|'system'} pref
 */
function updateThemePicker(pref) {
    document.querySelectorAll('.ios-theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === pref);
    });
}

// Theme beim Laden anwenden
applyTheme(getThemePref());

/** Reagiert auf System-Theme-Änderungen (z.B. OS Darkmode wechselt) */
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getThemePref() === 'system') applyTheme('system');
});

/** Öffnet den Theme-Picker */
document.getElementById('btn-theme').addEventListener('click', () => {
    updateThemePicker(getThemePref());
    openModal('modal-theme');
});

/** Theme-Auswahl im Picker — speichert sofort in localStorage */
document.querySelectorAll('.ios-theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
        const pref = opt.dataset.theme;
        localStorage.setItem('kita-theme', pref);
        applyTheme(pref);
        updateThemePicker(pref);
    });
});

// ═══════════════════════════════════════════════════════════════
//  Utility Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Escaped einen String für sichere HTML-Ausgabe (XSS-Schutz).
 * Nutzt die native DOM-API statt Regex für zuverlässiges Escaping.
 * @param {string} s — Unescapeter String
 * @returns {string} HTML-sicherer String
 */
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ═══════════════════════════════════════════════════════════════
//  Language Picker (rendered dynamically)
// ═══════════════════════════════════════════════════════════════

/**
 * Rendert die Sprachauswahl im Theme/Settings-Sheet.
 * Zeigt alle verfügbaren Sprachen als klickbare Buttons.
 */
function renderLangPicker() {
    const el = document.getElementById('lang-picker');
    if (!el) return;
    el.innerHTML = Object.entries(LANGUAGES).map(([code, name]) =>
        `<button class="ios-lang-btn${code === currentLang ? ' active' : ''}" data-lang="${code}">${name}</button>`
    ).join('');
    el.querySelectorAll('.ios-lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
            renderLangPicker();
        });
    });
}

// Render language picker when theme sheet opens (augment existing handler)
const origThemeBtn = document.getElementById('btn-theme');
origThemeBtn.addEventListener('click', () => { renderLangPicker(); });

// Apply language to DOM on initial load
applyLanguageToDOM();

// ═══════════════════════════════════════════════════════════════
//  Onboarding Overlay — V2.0 Lummerland
// ═══════════════════════════════════════════════════════════════

/**
 * Zeigt das Onboarding-Overlay einmalig beim ersten Besuch nach dem V2.0-Update.
 * Nutzt localStorage um den Status zu speichern.
 */
(function initOnboarding() {
    const KEY = 'kita-lml-v2-onboarded';
    if (localStorage.getItem(KEY)) return;
    const overlay = document.getElementById('lml-onboarding');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    document.getElementById('lml-onboarding-close').addEventListener('click', () => {
        overlay.classList.add('hidden');
        localStorage.setItem(KEY, '1');
    });
})();
