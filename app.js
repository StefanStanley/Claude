// === KiTa Lummerland Essensplanung App (Firebase) ===

let auth, db;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    }
} catch (err) {
    console.error('Firebase init:', err.message);
}

const ALLERGENS = [
    { id: 'gluten', name: 'Gluten' }, { id: 'krebstiere', name: 'Krebstiere' },
    { id: 'eier', name: 'Eier' }, { id: 'fisch', name: 'Fisch' },
    { id: 'erdnuesse', name: 'Erdnüsse' }, { id: 'soja', name: 'Soja' },
    { id: 'milch', name: 'Milch/Laktose' }, { id: 'schalenfruchte', name: 'Schalenfrüchte' },
    { id: 'sellerie', name: 'Sellerie' }, { id: 'senf', name: 'Senf' },
    { id: 'sesam', name: 'Sesam' }, { id: 'sulfite', name: 'Sulfite' },
    { id: 'lupinen', name: 'Lupinen' }, { id: 'weichtiere', name: 'Weichtiere' },
];
const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const CATEGORIES = { fleisch: 'Fleisch', fisch: 'Fisch', vegetarisch: 'Vegetarisch', vegan: 'Vegan' };
const ROLE_LABELS = { admin: 'Admin', kueche: 'Küche', eltern: 'Eltern' };

let state = {
    meals: [], children: [], weekPlans: {}, users: [],
    currentWeekOffset: 0, editingMealId: null, editingChildId: null, pickingDay: null,
    currentUser: null, demoMode: false,
};

// ===================== AUTH =====================
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

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = e.target.querySelector('button[type="submit"]');
    errEl.classList.add('hidden');
    if (!auth) { errEl.textContent = 'Firebase nicht geladen.'; errEl.classList.remove('hidden'); return; }
    btn.disabled = true; btn.textContent = 'Anmelden...';
    try {
        await auth.signInWithEmailAndPassword(email, pw);
    } catch (err) {
        const msgs = {
            'auth/user-not-found': 'Benutzer nicht gefunden.',
            'auth/wrong-password': 'Falsches Passwort.',
            'auth/invalid-email': 'Ungültige E-Mail.',
            'auth/invalid-credential': 'E-Mail oder Passwort falsch.',
            'auth/too-many-requests': 'Zu viele Versuche. Bitte warten.',
            'auth/network-request-failed': 'Netzwerk-Fehler.',
        };
        errEl.textContent = msgs[err.code] || err.code + ' — ' + err.message;
        errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false; btn.textContent = 'Anmelden';
    }
});

document.getElementById('btn-register').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('btn-register');
    errEl.classList.add('hidden');
    if (!auth) { errEl.textContent = 'Firebase nicht geladen.'; errEl.classList.remove('hidden'); return; }
    if (!email || !pw) { errEl.textContent = 'E-Mail und Passwort eingeben.'; errEl.classList.remove('hidden'); return; }
    if (pw.length < 6) { errEl.textContent = 'Passwort: mind. 6 Zeichen.'; errEl.classList.remove('hidden'); return; }
    btn.disabled = true; btn.textContent = 'Registrieren...';
    try {
        await auth.createUserWithEmailAndPassword(email, pw);
    } catch (err) {
        const msgs = { 'auth/email-already-in-use': 'E-Mail bereits registriert.', 'auth/weak-password': 'Passwort zu kurz.', 'auth/invalid-email': 'Ungültige E-Mail.' };
        errEl.textContent = msgs[err.code] || err.code || err.message;
        errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false; btn.textContent = 'Neuen Account erstellen';
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    if (state.demoMode) {
        state.demoMode = false; state.currentUser = null;
        state.meals = []; state.children = []; state.weekPlans = {}; state.users = [];
        showLogin(); return;
    }
    auth.signOut();
});

// ===================== DEMO MODE =====================
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

function showLogin() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
}

function showApp() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    const u = state.currentUser;
    document.getElementById('user-info').innerHTML =
        `${esc(u.name)} <span class="role-badge">${ROLE_LABELS[u.role] || u.role}</span>`;
    applyRole();
}

function applyRole() {
    const r = state.currentUser?.role;
    const staff = r === 'admin' || r === 'kueche';
    document.querySelectorAll('.nav-role-staff').forEach(el => el.style.display = staff ? '' : 'none');
    document.querySelectorAll('.nav-role-admin').forEach(el => el.style.display = r === 'admin' ? '' : 'none');
    document.querySelectorAll('.btn-role-staff').forEach(el => el.style.display = staff ? '' : 'none');
}

function isStaff() { return ['admin', 'kueche'].includes(state.currentUser?.role); }
function isAdmin() { return state.currentUser?.role === 'admin'; }

// ===================== FIRESTORE =====================
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

function renderAll() { renderWeekPlan(); renderMealsList(); renderChildrenList(); if (isAdmin()) renderUsersList(); }

// ===================== WEEK HELPERS =====================
function getMonday(off) {
    const n = new Date(); const d = n.getDay();
    const diff = n.getDate() - d + (d === 0 ? -6 : 1);
    const m = new Date(n.setDate(diff)); m.setDate(m.getDate() + off * 7); m.setHours(0, 0, 0, 0); return m;
}
function getWeekKey(off) {
    const m = getMonday(off), y = m.getFullYear(), j = new Date(y, 0, 1);
    return `${y}-${String(Math.ceil((Math.floor((m - j) / 864e5) + j.getDay() + 1) / 7)).padStart(2, '0')}`;
}
function getWeekLabel(off) {
    const m = getMonday(off), f = new Date(m); f.setDate(f.getDate() + 4);
    const fmt = d => `${d.getDate()}.${d.getMonth() + 1}.`;
    return `KW ${getWeekKey(off).split('-')[1]}  ·  ${fmt(m)} – ${fmt(f)}${m.getFullYear()}`;
}
function getDayDate(off, i) { const m = getMonday(off), d = new Date(m); d.setDate(d.getDate() + i); return `${d.getDate()}.${d.getMonth() + 1}.`; }
function getWeekPlan(off) { const k = getWeekKey(off); if (!state.weekPlans[k]) state.weekPlans[k] = { 0: [], 1: [], 2: [], 3: [], 4: [] }; return state.weekPlans[k]; }

// ===================== iOS TAB BAR NAVIGATION =====================
document.querySelectorAll('.ios-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.ios-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${btn.dataset.view}`).classList.add('active');
    });
});

// ===================== MODALS (iOS Sheet) =====================
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    document.body.style.overflow = '';
}

// Close on backdrop tap
document.querySelectorAll('.ios-sheet-backdrop').forEach(bd => {
    bd.addEventListener('click', () => {
        bd.closest('.ios-sheet, .ios-action-sheet').classList.add('hidden');
        document.body.style.overflow = '';
    });
});

// Close on cancel
document.querySelectorAll('.ios-sheet-cancel, .modal-cancel').forEach(b => {
    b.addEventListener('click', () => {
        const sheet = b.closest('.ios-sheet, .ios-action-sheet');
        if (sheet) { sheet.classList.add('hidden'); document.body.style.overflow = ''; }
    });
});

// ===================== iOS ACTION SHEET (replaces confirm) =====================
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

// ===================== ALLERGEN HELPERS (iOS Toggle Switches) =====================
function renderAllergenCB(id, sel = []) {
    document.getElementById(id).innerHTML = ALLERGENS.map(a =>
        `<div class="ios-allergen-row">
            <span>${a.name}</span>
            <label class="ios-toggle">
                <input type="checkbox" value="${a.id}" ${sel.includes(a.id) ? 'checked' : ''}>
                <div class="ios-toggle-track"></div>
            </label>
        </div>`
    ).join('');
}
function getCheckedAllergens(id) { return [...document.querySelectorAll(`#${id} input:checked`)].map(c => c.value); }

// ===================== SPEISEN =====================
function renderMealsList(filter = 'alle') {
    const list = document.getElementById('meals-list');
    const items = filter === 'alle' ? state.meals : state.meals.filter(m => m.category === filter);
    const staff = isStaff();
    if (!items.length) { list.innerHTML = '<p style="text-align:center;color:var(--ios-label-tertiary);padding:2rem;font-size:0.88rem;">Keine Speisen vorhanden</p>'; return; }
    list.innerHTML = items.map(m => {
        const aNames = m.allergens.map(id => ALLERGENS.find(a => a.id === id)?.name || id).join(', ');
        return `<div class="meal-card">
            <div class="meal-card-info">
                <div class="meal-title">${esc(m.name)} <span class="category-badge cat-${m.category}">${CATEGORIES[m.category]}</span></div>
                <div class="meal-meta">${aNames ? aNames : 'Keine Allergene'}</div>
            </div>
            ${staff ? `<div class="meal-card-actions">
                <button class="btn-small btn-edit" onclick="editMeal('${m.id}')">Bearb.</button>
                <button class="btn-small btn-delete" onclick="deleteMeal('${m.id}')">Entf.</button>
            </div>` : ''}
        </div>`;
    }).join('');
}

// Segmented control for meals filter
document.querySelectorAll('#meals-filter .ios-seg-btn').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('#meals-filter .ios-seg-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); renderMealsList(b.dataset.filter);
    });
});

document.getElementById('btn-add-meal').addEventListener('click', () => {
    if (!isStaff()) return;
    state.editingMealId = null;
    document.getElementById('modal-meal-title').textContent = 'Neue Speise';
    document.getElementById('form-meal').reset();
    renderAllergenCB('meal-allergens');
    openModal('modal-meal');
});

window.editMeal = function (id) {
    if (!isStaff()) return;
    const m = state.meals.find(x => x.id === id); if (!m) return;
    state.editingMealId = id;
    document.getElementById('modal-meal-title').textContent = 'Speise bearbeiten';
    document.getElementById('meal-name').value = m.name;
    document.getElementById('meal-category').value = m.category;
    document.getElementById('meal-description').value = m.description || '';
    renderAllergenCB('meal-allergens', m.allergens);
    openModal('modal-meal');
};

window.deleteMeal = function (id) {
    if (!isStaff()) return;
    const m = state.meals.find(x => x.id === id);
    showActionSheet(
        m ? `„${m.name}" wirklich löschen?` : 'Speise löschen?',
        'Löschen',
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

// ===================== KINDER =====================
function renderChildrenList() {
    const list = document.getElementById('children-list');
    if (!state.children.length) { list.innerHTML = '<p style="text-align:center;color:var(--ios-label-tertiary);padding:2rem;font-size:0.88rem;">Noch keine Kinder</p>'; return; }
    list.innerHTML = state.children.map(c => {
        const aNames = c.allergens.map(id => ALLERGENS.find(a => a.id === id)?.name || id);
        return `<div class="child-card">
            <div class="child-card-info">
                <div class="child-name">${esc(c.firstname)} ${esc(c.lastname)}</div>
                <div class="child-meta">${c.group ? esc(c.group) : ''}${c.notes ? ' · ' + esc(c.notes) : ''}</div>
                <div class="child-allergies">${aNames.length ? aNames.map(n => `<span class="allergy-tag">${n}</span>`).join('') : ''}</div>
            </div>
            <div class="meal-card-actions">
                <button class="btn-small btn-edit" onclick="editChild('${c.id}')">Bearb.</button>
                <button class="btn-small btn-delete" onclick="deleteChild('${c.id}')">Entf.</button>
            </div>
        </div>`;
    }).join('');
}

document.getElementById('btn-add-child').addEventListener('click', () => {
    if (!isStaff()) return;
    state.editingChildId = null;
    document.getElementById('modal-child-title').textContent = 'Kind hinzufügen';
    document.getElementById('form-child').reset();
    renderAllergenCB('child-allergens');
    openModal('modal-child');
});

window.editChild = function (id) {
    if (!isStaff()) return;
    const c = state.children.find(x => x.id === id); if (!c) return;
    state.editingChildId = id;
    document.getElementById('modal-child-title').textContent = 'Kind bearbeiten';
    document.getElementById('child-firstname').value = c.firstname;
    document.getElementById('child-lastname').value = c.lastname;
    document.getElementById('child-group').value = c.group || '';
    document.getElementById('child-notes').value = c.notes || '';
    renderAllergenCB('child-allergens', c.allergens);
    openModal('modal-child');
};

window.deleteChild = function (id) {
    if (!isStaff()) return;
    const c = state.children.find(x => x.id === id);
    showActionSheet(
        c ? `${c.firstname} ${c.lastname} entfernen?` : 'Kind entfernen?',
        'Entfernen',
        async () => {
            if (!state.demoMode) await db.collection('children').doc(id).delete();
            state.children = state.children.filter(c => c.id !== id);
            renderChildrenList();
        }
    );
};

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

// ===================== WOCHENPLAN =====================
function renderWeekPlan() {
    const grid = document.getElementById('weekplan-grid');
    const plan = getWeekPlan(state.currentWeekOffset);
    const wl = getWeekLabel(state.currentWeekOffset);
    document.getElementById('current-week').textContent = wl;
    const pl = document.getElementById('print-week-label'); if (pl) pl.textContent = wl;
    const staff = isStaff();
    renderParentBanner();

    grid.innerHTML = DAYS.map((day, i) => {
        const ids = plan[i] || [];
        const dateStr = getDayDate(state.currentWeekOffset, i);
        const mealsHtml = ids.map(mid => {
            const m = state.meals.find(x => x.id === mid); if (!m) return '';
            return `<div class="day-meal">
                <div class="meal-name">${esc(m.name)}</div>
                <span class="category-badge cat-${m.category}">${CATEGORIES[m.category]}</span>
                ${staff ? `<button class="btn-remove-meal" onclick="removeMealFromDay(${i},'${mid}')">&times;</button>` : ''}
                ${getAllergyWarnings(m)}
            </div>`;
        }).join('');
        return `<div class="day-card">
            <div class="day-card-header">${day} <span class="day-date">${dateStr}</span></div>
            <div class="day-card-body">${mealsHtml}${staff ? `<button class="btn-add-day-meal" onclick="pickMealForDay(${i})">+ Speise hinzufügen</button>` : ''}</div>
        </div>`;
    }).join('');
    renderStats(); if (staff) checkVariety();
}

function renderParentBanner() {
    const b = document.getElementById('parent-allergy-banner'); if (!b) return;
    if (state.currentUser?.role !== 'eltern' || !state.currentUser?.childId) { b.classList.add('hidden'); return; }
    const c = state.children.find(x => x.id === state.currentUser.childId);
    if (!c || !c.allergens.length) { b.classList.add('hidden'); return; }
    b.classList.remove('hidden');
    b.innerHTML = `<strong>Allergien von ${esc(c.firstname)}:</strong> ${c.allergens.map(id => ALLERGENS.find(a => a.id === id)?.name || id).join(', ')}`;
}

function getAllergyWarnings(meal) {
    if (!meal.allergens.length) return '';
    if (state.currentUser?.role === 'eltern') {
        if (!state.currentUser.childId) return '';
        const c = state.children.find(x => x.id === state.currentUser.childId); if (!c) return '';
        const common = meal.allergens.filter(a => c.allergens.includes(a));
        if (!common.length) return '';
        return `<div class="allergy-warning"><strong>Achtung!</strong> ${common.map(id => ALLERGENS.find(a => a.id === id)?.name || id).join(', ')}</div>`;
    }
    if (!state.children.length) return '';
    const aff = [];
    for (const c of state.children) {
        const common = meal.allergens.filter(a => c.allergens.includes(a));
        if (common.length) aff.push(`<strong>${esc(c.firstname)}</strong>: ${common.map(id => ALLERGENS.find(a => a.id === id)?.name || id).join(', ')}`);
    }
    return aff.length ? `<div class="allergy-warning">${aff.join(' · ')}</div>` : '';
}

function renderStats() {
    const plan = getWeekPlan(state.currentWeekOffset);
    const cats = { fleisch: 0, fisch: 0, vegetarisch: 0, vegan: 0 };
    for (let d = 0; d < 5; d++) for (const mid of (plan[d] || [])) { const m = state.meals.find(x => x.id === mid); if (m) cats[m.category]++; }
    document.getElementById('stats-bar').innerHTML =
        Object.entries(cats).map(([k, v]) => `<div class="stat-card stat-${k}"><div class="stat-value" style="color:var(--cat-${k})">${v}</div><div class="stat-label">${CATEGORIES[k]}</div></div>`).join('');
}

function checkVariety() {
    const plan = getWeekPlan(state.currentWeekOffset), el = document.getElementById('variety-alert');
    const cats = { fleisch: 0, fisch: 0, vegetarisch: 0, vegan: 0 }; let total = 0;
    for (let d = 0; d < 5; d++) for (const mid of (plan[d] || [])) { const m = state.meals.find(x => x.id === mid); if (m) { cats[m.category]++; total++; } }
    if (total < 3) { el.classList.add('hidden'); return; }
    const msgs = [];
    if (cats.fleisch / total > 0.5) msgs.push('Zu viele Fleischgerichte.');
    if (cats.fisch === 0 && total >= 4) msgs.push('Mind. 1x Fisch/Woche empfohlen.');
    if ((cats.vegetarisch + cats.vegan) / total < 0.3 && total >= 4) msgs.push('Mehr vegetarisch/vegan empfohlen.');
    if (msgs.length) { el.className = 'ios-banner alert alert-warning'; el.innerHTML = '<strong>Tipp:</strong> ' + msgs.join(' '); }
    else if (total >= 5) { el.className = 'ios-banner alert alert-success'; el.textContent = 'Gute Abwechslung!'; }
    else el.classList.add('hidden');
}

document.getElementById('prev-week').addEventListener('click', () => { state.currentWeekOffset--; renderWeekPlan(); });
document.getElementById('next-week').addEventListener('click', () => { state.currentWeekOffset++; renderWeekPlan(); });

window.pickMealForDay = function (i) {
    if (!isStaff()) return; state.pickingDay = i;
    document.getElementById('modal-pick-title').textContent = `${DAYS[i]} — Speise wählen`;
    renderPickList('alle');
    document.querySelectorAll('.pick-filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.pick-filter-btn[data-filter="alle"]').classList.add('active');
    openModal('modal-pick-meal');
};

function renderPickList(filter) {
    const list = document.getElementById('pick-meals-list');
    const items = filter === 'alle' ? state.meals : state.meals.filter(m => m.category === filter);
    if (!items.length) { list.innerHTML = '<p style="text-align:center;color:var(--ios-label-tertiary);padding:2rem;font-size:0.88rem;">Keine Speisen</p>'; return; }
    list.innerHTML = items.map(m => {
        const aNames = m.allergens.map(id => ALLERGENS.find(a => a.id === id)?.name || id).join(', ');
        return `<div class="meal-card" onclick="selectMealForDay('${m.id}')">
            <div class="meal-card-info">
                <div class="meal-title">${esc(m.name)} <span class="category-badge cat-${m.category}">${CATEGORIES[m.category]}</span></div>
                <div class="meal-meta">${aNames || 'Keine Allergene'}</div>
            </div>
        </div>`;
    }).join('');
}

document.querySelectorAll('.pick-filter-btn').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('.pick-filter-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); renderPickList(b.dataset.filter);
    });
});

window.selectMealForDay = async function (mealId) {
    if (!isStaff()) return;
    const k = getWeekKey(state.currentWeekOffset), plan = getWeekPlan(state.currentWeekOffset);
    if (!plan[state.pickingDay]) plan[state.pickingDay] = [];
    plan[state.pickingDay].push(mealId);
    if (!state.demoMode) await db.collection('weekPlans').doc(k).set(plan);
    closeModal('modal-pick-meal'); renderWeekPlan();
};

window.removeMealFromDay = async function (di, mealId) {
    if (!isStaff()) return;
    const k = getWeekKey(state.currentWeekOffset), plan = getWeekPlan(state.currentWeekOffset);
    if (plan[di]) { const idx = plan[di].indexOf(mealId); if (idx !== -1) plan[di].splice(idx, 1); }
    if (!state.demoMode) await db.collection('weekPlans').doc(k).set(plan);
    renderWeekPlan();
};

// ===================== BENUTZERVERWALTUNG =====================
function renderUsersList() {
    const list = document.getElementById('users-list'); if (!list) return;
    if (!state.users.length) { list.innerHTML = '<p style="text-align:center;color:var(--ios-label-tertiary);padding:2rem;font-size:0.88rem;">Keine Benutzer</p>'; return; }
    list.innerHTML = state.users.map(u => {
        const childName = u.childId ? (() => { const c = state.children.find(x => x.id === u.childId); return c ? `${c.firstname} ${c.lastname}` : ''; })() : '';
        const isSelf = u.uid === state.currentUser?.uid;
        return `<div class="child-card">
            <div class="child-card-info">
                <div class="child-name">${esc(u.name || u.email)} <span class="role-badge">${ROLE_LABELS[u.role] || u.role}</span></div>
                <div class="child-meta">${esc(u.email)}${childName ? ' · ' + esc(childName) : ''}</div>
            </div>
            ${!isSelf ? `<div class="meal-card-actions"><button class="btn-small btn-delete" onclick="deleteUser('${u.uid}')">Entf.</button></div>` : ''}
        </div>`;
    }).join('');
}

document.getElementById('btn-add-user').addEventListener('click', () => {
    document.getElementById('form-user').reset();
    document.getElementById('user-form-error').classList.add('hidden');
    document.getElementById('user-child-assign').classList.add('hidden');
    const cs = document.getElementById('user-child-select');
    cs.innerHTML = '<option value="">Kein Kind</option>' +
        state.children.map(c => `<option value="${c.id}">${esc(c.firstname)} ${esc(c.lastname)}</option>`).join('');
    openModal('modal-user');
});

document.getElementById('user-role').addEventListener('change', e => {
    document.getElementById('user-child-assign').classList.toggle('hidden', e.target.value !== 'eltern');
});

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
        const msgs = { 'auth/email-already-in-use': 'E-Mail bereits verwendet.', 'auth/weak-password': 'Passwort zu kurz.', 'auth/invalid-email': 'Ungültige E-Mail.' };
        errEl.textContent = msgs[err.code] || err.message;
        errEl.classList.remove('hidden');
    }
});

window.deleteUser = function (uid) {
    showActionSheet('Benutzer wirklich entfernen?', 'Entfernen', async () => {
        if (!state.demoMode) await db.collection('users').doc(uid).delete();
        state.users = state.users.filter(u => u.uid !== uid);
        renderUsersList();
    });
};

// ===================== THEME (Light / Dark / System) =====================
function getThemePref() { return localStorage.getItem('kita-theme') || 'system'; }

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
    if (meta) meta.content = effective === 'dark' ? '#000000' : '#F2F2F7';
    updateThemeIcon(effective);
}

function updateThemeIcon(effective) {
    const btn = document.getElementById('btn-theme');
    if (!btn) return;
    if (effective === 'dark') {
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    } else {
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    }
}

function updateThemePicker(pref) {
    document.querySelectorAll('.ios-theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === pref);
    });
}

// Init theme on load
applyTheme(getThemePref());

// Listen for system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getThemePref() === 'system') applyTheme('system');
});

// Open theme picker
document.getElementById('btn-theme').addEventListener('click', () => {
    updateThemePicker(getThemePref());
    openModal('modal-theme');
});

// Theme option clicks
document.querySelectorAll('.ios-theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
        const pref = opt.dataset.theme;
        localStorage.setItem('kita-theme', pref);
        applyTheme(pref);
        updateThemePicker(pref);
    });
});

// ===================== UTILITIES =====================
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
