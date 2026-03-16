// === KiTa Lummerland Essensplanung App (Firebase) ===

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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
    currentUser: null,
};

// ===================== AUTH =====================
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const errEl = document.getElementById('login-error');
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
            console.error('Auth error:', err);
            errEl.textContent = 'Firestore-Fehler: ' + err.message + ' — Bitte Firestore-Datenbank in der Firebase Console erstellen!';
            errEl.classList.remove('hidden');
            await auth.signOut();
        }
    } else {
        state.currentUser = null;
        showLogin();
    }
});

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');
    try {
        await auth.signInWithEmailAndPassword(email, pw);
    } catch (err) {
        const msgs = {
            'auth/user-not-found': 'Benutzer nicht gefunden.',
            'auth/wrong-password': 'Falsches Passwort.',
            'auth/invalid-email': 'Ungültige E-Mail.',
            'auth/invalid-credential': 'E-Mail oder Passwort falsch.',
            'auth/too-many-requests': 'Zu viele Versuche. Bitte warten.',
        };
        errEl.textContent = msgs[err.code] || 'Anmeldung fehlgeschlagen.';
        errEl.classList.remove('hidden');
    }
});

document.getElementById('btn-register').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');
    if (!email || !pw) { errEl.textContent = 'Bitte E-Mail und Passwort eingeben.'; errEl.classList.remove('hidden'); return; }
    if (pw.length < 6) { errEl.textContent = 'Passwort muss mind. 6 Zeichen haben.'; errEl.classList.remove('hidden'); return; }
    try {
        await auth.createUserWithEmailAndPassword(email, pw);
    } catch (err) {
        const msgs = {
            'auth/email-already-in-use': 'Diese E-Mail ist bereits registriert.',
            'auth/weak-password': 'Passwort zu kurz (mind. 6 Zeichen).',
            'auth/invalid-email': 'Ungültige E-Mail-Adresse.',
        };
        errEl.textContent = msgs[err.code] || 'Registrierung fehlgeschlagen: ' + err.message;
        errEl.classList.remove('hidden');
    }
});

document.getElementById('btn-logout').addEventListener('click', () => auth.signOut());

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
    return `KW ${getWeekKey(off).split('-')[1]} (${fmt(m)} - ${fmt(f)}${m.getFullYear()})`;
}
function getDayDate(off, i) { const m = getMonday(off), d = new Date(m); d.setDate(d.getDate() + i); return `${d.getDate()}.${d.getMonth() + 1}.`; }
function getWeekPlan(off) { const k = getWeekKey(off); if (!state.weekPlans[k]) state.weekPlans[k] = { 0: [], 1: [], 2: [], 3: [], 4: [] }; return state.weekPlans[k]; }

// ===================== NAVIGATION =====================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${btn.dataset.view}`).classList.add('active');
    });
});

// ===================== MODALS =====================
function openModal(id) { document.getElementById(id).classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); document.body.style.overflow = ''; }
document.querySelectorAll('.modal-close, .modal-cancel').forEach(b => {
    b.addEventListener('click', () => { b.closest('.modal').classList.add('hidden'); document.body.style.overflow = ''; });
});
document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) { m.classList.add('hidden'); document.body.style.overflow = ''; } });
});

// ===================== ALLERGEN HELPERS =====================
function renderAllergenCB(id, sel = []) {
    document.getElementById(id).innerHTML = ALLERGENS.map(a =>
        `<label><input type="checkbox" value="${a.id}" ${sel.includes(a.id) ? 'checked' : ''}> ${a.name}</label>`
    ).join('');
}
function getCheckedAllergens(id) { return [...document.querySelectorAll(`#${id} input:checked`)].map(c => c.value); }

// ===================== SPEISEN =====================
function renderMealsList(filter = 'alle') {
    const list = document.getElementById('meals-list');
    const items = filter === 'alle' ? state.meals : state.meals.filter(m => m.category === filter);
    const staff = isStaff();
    if (!items.length) { list.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:2rem;">Keine Speisen.</p>'; return; }
    list.innerHTML = items.map(m => {
        const aNames = m.allergens.map(id => ALLERGENS.find(a => a.id === id)?.name || id).join(', ');
        return `<div class="meal-card">
            <div class="meal-card-info">
                <div class="meal-title">${esc(m.name)} <span class="category-badge cat-${m.category}">${CATEGORIES[m.category]}</span></div>
                <div class="meal-meta">${aNames ? 'Allergene: ' + aNames : 'Keine Allergene'}</div>
            </div>
            ${staff ? `<div class="meal-card-actions">
                <button class="btn-small btn-edit" onclick="editMeal('${m.id}')">Bearbeiten</button>
                <button class="btn-small btn-delete" onclick="deleteMeal('${m.id}')">Löschen</button>
            </div>` : ''}
        </div>`;
    }).join('');
}

document.querySelectorAll('.filter-btn').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
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

window.deleteMeal = async function (id) {
    if (!isStaff() || !confirm('Speise wirklich löschen?')) return;
    await db.collection('meals').doc(id).delete();
    state.meals = state.meals.filter(m => m.id !== id);
    for (const k of Object.keys(state.weekPlans)) {
        const p = state.weekPlans[k]; let changed = false;
        for (let d = 0; d < 5; d++) if (p[d] && p[d].includes(id)) { p[d] = p[d].filter(x => x !== id); changed = true; }
        if (changed) await db.collection('weekPlans').doc(k).set(p);
    }
    renderMealsList(); renderWeekPlan();
};

document.getElementById('form-meal').addEventListener('submit', async (e) => {
    e.preventDefault(); if (!isStaff()) return;
    const name = document.getElementById('meal-name').value.trim();
    const cat = document.getElementById('meal-category').value;
    const desc = document.getElementById('meal-description').value.trim();
    const allergens = getCheckedAllergens('meal-allergens');
    if (state.editingMealId) {
        const m = state.meals.find(x => x.id === state.editingMealId);
        if (m) { m.name = name; m.category = cat; m.description = desc; m.allergens = allergens; await db.collection('meals').doc(m.id).set({ name, category: cat, description: desc, allergens }); }
    } else {
        const ref = await db.collection('meals').add({ name, category: cat, description: desc, allergens });
        state.meals.push({ id: ref.id, name, category: cat, description: desc, allergens });
    }
    closeModal('modal-meal'); renderMealsList(); renderWeekPlan();
});

// ===================== KINDER =====================
function renderChildrenList() {
    const list = document.getElementById('children-list');
    if (!state.children.length) { list.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:2rem;">Noch keine Kinder.</p>'; return; }
    list.innerHTML = state.children.map(c => {
        const aNames = c.allergens.map(id => ALLERGENS.find(a => a.id === id)?.name || id);
        return `<div class="child-card">
            <div class="child-card-info">
                <div class="child-name">${esc(c.firstname)} ${esc(c.lastname)}</div>
                <div class="child-meta">${c.group ? 'Gruppe: ' + esc(c.group) : ''}${c.notes ? ' | ' + esc(c.notes) : ''}</div>
                <div class="child-allergies">${aNames.length ? aNames.map(n => `<span class="allergy-tag">${n}</span>`).join('') : '<span style="font-size:0.8rem;color:var(--text-light);">Keine Allergien</span>'}</div>
            </div>
            <div class="meal-card-actions">
                <button class="btn-small btn-edit" onclick="editChild('${c.id}')">Bearbeiten</button>
                <button class="btn-small btn-delete" onclick="deleteChild('${c.id}')">Löschen</button>
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

window.deleteChild = async function (id) {
    if (!isStaff() || !confirm('Kind wirklich löschen?')) return;
    await db.collection('children').doc(id).delete();
    state.children = state.children.filter(c => c.id !== id);
    renderChildrenList();
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
        if (c) { Object.assign(c, data); await db.collection('children').doc(c.id).set(data); }
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
                ${staff ? `<button class="btn-remove-meal" onclick="removeMealFromDay(${i},'${mid}')">&times;</button>` : ''}
                <div class="meal-name">${esc(m.name)}</div>
                <span class="category-badge cat-${m.category}">${CATEGORIES[m.category]}</span>
                ${getAllergyWarnings(m)}
            </div>`;
        }).join('');
        return `<div class="day-card">
            <div class="day-card-header">${day}<span class="day-date">${dateStr}</span></div>
            <div class="day-card-body">${mealsHtml}${staff ? `<button class="btn-add-day-meal" onclick="pickMealForDay(${i})">+ Speise</button>` : ''}</div>
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
        return `<div class="allergy-warning"><strong>Achtung!</strong> Enthält: ${common.map(id => ALLERGENS.find(a => a.id === id)?.name || id).join(', ')}</div>`;
    }
    if (!state.children.length) return '';
    const aff = [];
    for (const c of state.children) {
        const common = meal.allergens.filter(a => c.allergens.includes(a));
        if (common.length) aff.push(`<strong>${esc(c.firstname)}</strong>: ${common.map(id => ALLERGENS.find(a => a.id === id)?.name || id).join(', ')}`);
    }
    return aff.length ? `<div class="allergy-warning">Allergie-Hinweis:<br>${aff.join('<br>')}</div>` : '';
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
    if (cats.fleisch / total > 0.5) msgs.push('Zu viele Fleischgerichte. Empfehlung: max. 2-3x/Woche.');
    if (cats.fisch === 0 && total >= 4) msgs.push('Empfehlung: Mind. 1x Fisch/Woche.');
    if ((cats.vegetarisch + cats.vegan) / total < 0.3 && total >= 4) msgs.push('Empfehlung: Mehr vegetarisch/vegan.');
    if (msgs.length) { el.className = 'alert alert-warning'; el.innerHTML = '<strong>Abwechslungs-Check:</strong><br>' + msgs.join('<br>'); }
    else if (total >= 5) { el.className = 'alert alert-success'; el.textContent = 'Gute Abwechslung!'; }
    else el.classList.add('hidden');
}

document.getElementById('prev-week').addEventListener('click', () => { state.currentWeekOffset--; renderWeekPlan(); });
document.getElementById('next-week').addEventListener('click', () => { state.currentWeekOffset++; renderWeekPlan(); });

window.pickMealForDay = function (i) {
    if (!isStaff()) return; state.pickingDay = i;
    document.getElementById('modal-pick-title').textContent = `Speise für ${DAYS[i]} auswählen`;
    renderPickList('alle');
    document.querySelectorAll('.pick-filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.pick-filter-btn[data-filter="alle"]').classList.add('active');
    openModal('modal-pick-meal');
};

function renderPickList(filter) {
    const list = document.getElementById('pick-meals-list');
    const items = filter === 'alle' ? state.meals : state.meals.filter(m => m.category === filter);
    if (!items.length) { list.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:2rem;">Keine Speisen.</p>'; return; }
    list.innerHTML = items.map(m => {
        const aNames = m.allergens.map(id => ALLERGENS.find(a => a.id === id)?.name || id).join(', ');
        return `<div class="meal-card" onclick="selectMealForDay('${m.id}')">
            <div class="meal-card-info">
                <div class="meal-title">${esc(m.name)} <span class="category-badge cat-${m.category}">${CATEGORIES[m.category]}</span></div>
                <div class="meal-meta">${aNames ? 'Allergene: ' + aNames : 'Keine Allergene'}</div>
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
    await db.collection('weekPlans').doc(k).set(plan);
    closeModal('modal-pick-meal'); renderWeekPlan();
};

window.removeMealFromDay = async function (di, mealId) {
    if (!isStaff()) return;
    const k = getWeekKey(state.currentWeekOffset), plan = getWeekPlan(state.currentWeekOffset);
    if (plan[di]) { const idx = plan[di].indexOf(mealId); if (idx !== -1) plan[di].splice(idx, 1); }
    await db.collection('weekPlans').doc(k).set(plan);
    renderWeekPlan();
};

// ===================== BENUTZERVERWALTUNG =====================
function renderUsersList() {
    const list = document.getElementById('users-list'); if (!list) return;
    if (!state.users.length) { list.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:2rem;">Keine Benutzer.</p>'; return; }
    list.innerHTML = state.users.map(u => {
        const childName = u.childId ? (() => { const c = state.children.find(x => x.id === u.childId); return c ? `${c.firstname} ${c.lastname}` : ''; })() : '';
        const isSelf = u.uid === state.currentUser?.uid;
        return `<div class="child-card">
            <div class="child-card-info">
                <div class="child-name">${esc(u.name || u.email)} <span class="role-badge">${ROLE_LABELS[u.role] || u.role}</span></div>
                <div class="child-meta">${esc(u.email)}${childName ? ' | Kind: ' + esc(childName) : ''}</div>
            </div>
            ${!isSelf ? `<div class="meal-card-actions"><button class="btn-small btn-delete" onclick="deleteUser('${u.uid}')">Löschen</button></div>` : ''}
        </div>`;
    }).join('');
}

document.getElementById('btn-add-user').addEventListener('click', () => {
    document.getElementById('form-user').reset();
    document.getElementById('user-form-error').classList.add('hidden');
    document.getElementById('user-child-assign').classList.add('hidden');
    const cs = document.getElementById('user-child-select');
    cs.innerHTML = '<option value="">-- Kein Kind --</option>' +
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
        const msgs = { 'auth/email-already-in-use': 'E-Mail wird bereits verwendet.', 'auth/weak-password': 'Passwort zu kurz (mind. 6 Zeichen).', 'auth/invalid-email': 'Ungültige E-Mail.' };
        errEl.textContent = msgs[err.code] || 'Fehler: ' + err.message;
        errEl.classList.remove('hidden');
    }
});

window.deleteUser = async function (uid) {
    if (!confirm('Benutzer wirklich entfernen?')) return;
    await db.collection('users').doc(uid).delete();
    state.users = state.users.filter(u => u.uid !== uid);
    renderUsersList();
};

// ===================== UTILITIES =====================
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
