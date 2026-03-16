// === KiTa Lummerland Essensplanung App ===

// --- Allergene (EU-Verordnung 1169/2011) ---
const ALLERGENS = [
    { id: 'gluten', name: 'Gluten' },
    { id: 'krebstiere', name: 'Krebstiere' },
    { id: 'eier', name: 'Eier' },
    { id: 'fisch', name: 'Fisch' },
    { id: 'erdnuesse', name: 'Erdnüsse' },
    { id: 'soja', name: 'Soja' },
    { id: 'milch', name: 'Milch/Laktose' },
    { id: 'schalenfruchte', name: 'Schalenfrüchte' },
    { id: 'sellerie', name: 'Sellerie' },
    { id: 'senf', name: 'Senf' },
    { id: 'sesam', name: 'Sesam' },
    { id: 'sulfite', name: 'Sulfite' },
    { id: 'lupinen', name: 'Lupinen' },
    { id: 'weichtiere', name: 'Weichtiere' },
];

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const CATEGORIES = {
    fleisch: 'Fleisch',
    fisch: 'Fisch',
    vegetarisch: 'Vegetarisch',
    vegan: 'Vegan',
};

// --- State ---
let state = {
    meals: [],
    children: [],
    weekPlans: {},
    currentWeekOffset: 0,
    editingMealId: null,
    editingChildId: null,
    pickingDay: null,
    parentChildId: null,
    parentWeekOffset: 0,
};

// --- Persistence ---
function save() {
    localStorage.setItem('kita-lummerland', JSON.stringify({
        meals: state.meals,
        children: state.children,
        weekPlans: state.weekPlans,
    }));
}

function load() {
    const data = localStorage.getItem('kita-lummerland');
    if (data) {
        const parsed = JSON.parse(data);
        state.meals = parsed.meals || [];
        state.children = parsed.children || [];
        state.weekPlans = parsed.weekPlans || {};
    }
    if (state.meals.length === 0) {
        loadSampleData();
    }
}

function loadSampleData() {
    state.meals = [
        { id: genId(), name: 'Spaghetti Bolognese', category: 'fleisch', allergens: ['gluten', 'sellerie'], description: '' },
        { id: genId(), name: 'Fischstäbchen mit Kartoffelpüree', category: 'fisch', allergens: ['fisch', 'gluten', 'milch'], description: '' },
        { id: genId(), name: 'Gemüse-Nudeln', category: 'vegetarisch', allergens: ['gluten'], description: '' },
        { id: genId(), name: 'Kartoffelsuppe', category: 'vegan', allergens: ['sellerie'], description: '' },
        { id: genId(), name: 'Hähnchen-Reis', category: 'fleisch', allergens: [], description: '' },
        { id: genId(), name: 'Pfannkuchen mit Apfelmus', category: 'vegetarisch', allergens: ['gluten', 'eier', 'milch'], description: '' },
        { id: genId(), name: 'Lachsnudeln', category: 'fisch', allergens: ['fisch', 'gluten', 'milch'], description: '' },
        { id: genId(), name: 'Gemüsecurry mit Reis', category: 'vegan', allergens: [], description: '' },
        { id: genId(), name: 'Milchreis mit Zimt', category: 'vegetarisch', allergens: ['milch'], description: '' },
        { id: genId(), name: 'Schnitzel mit Pommes', category: 'fleisch', allergens: ['gluten', 'eier'], description: '' },
    ];
    save();
}

function genId() {
    return Math.random().toString(36).substring(2, 10);
}

// --- Week Helpers ---
function getMonday(offset) {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setDate(monday.getDate() + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function getWeekKey(offset) {
    const mon = getMonday(offset);
    const year = mon.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const days = Math.floor((mon - oneJan) / 86400000);
    const weekNum = Math.ceil((days + oneJan.getDay() + 1) / 7);
    return `${year}-${String(weekNum).padStart(2, '0')}`;
}

function getWeekLabel(offset) {
    const mon = getMonday(offset);
    const fri = new Date(mon);
    fri.setDate(fri.getDate() + 4);
    const fmt = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
    return `KW ${getWeekKey(offset).split('-')[1]} (${fmt(mon)} - ${fmt(fri)}${mon.getFullYear()})`;
}

function getDayDate(offset, dayIndex) {
    const mon = getMonday(offset);
    const d = new Date(mon);
    d.setDate(d.getDate() + dayIndex);
    return `${d.getDate()}.${d.getMonth() + 1}.`;
}

function getWeekPlan(offset) {
    const key = getWeekKey(offset);
    if (!state.weekPlans[key]) {
        state.weekPlans[key] = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    }
    return state.weekPlans[key];
}

// --- Navigation ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${btn.dataset.view}`).classList.add('active');
        if (btn.dataset.view === 'eltern') renderParentView();
    });
});

// --- Modals ---
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    document.body.style.overflow = '';
}

document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').classList.add('hidden');
        document.body.style.overflow = '';
    });
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
});

// === SPEISEN VERWALTUNG ===
function renderAllergenCheckboxes(containerId, selected = []) {
    const container = document.getElementById(containerId);
    container.innerHTML = ALLERGENS.map(a => `
        <label>
            <input type="checkbox" value="${a.id}" ${selected.includes(a.id) ? 'checked' : ''}>
            ${a.name}
        </label>
    `).join('');
}

function getCheckedAllergens(containerId) {
    return Array.from(
        document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)
    ).map(cb => cb.value);
}

function renderMealsList(filter = 'alle') {
    const list = document.getElementById('meals-list');
    const filtered = filter === 'alle'
        ? state.meals
        : state.meals.filter(m => m.category === filter);

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state empty-meals"><p>Keine Speisen vorhanden.</p><p class="hint">Erstelle eine neue Speise mit dem Button oben.</p></div>';
        return;
    }

    list.innerHTML = filtered.map(m => {
        const allergenNames = m.allergens.map(id => ALLERGENS.find(a => a.id === id)?.name || id).join(', ');
        return `
        <div class="meal-card" data-id="${m.id}">
            <div class="meal-card-info">
                <div class="meal-title">${escHtml(m.name)} <span class="category-badge cat-${m.category}">${CATEGORIES[m.category]}</span></div>
                <div class="meal-meta">${allergenNames ? 'Allergene: ' + allergenNames : 'Keine Allergene'}</div>
            </div>
            <div class="meal-card-actions">
                <button class="btn-small btn-edit" onclick="editMeal('${m.id}')">Bearbeiten</button>
                <button class="btn-small btn-delete" onclick="deleteMeal('${m.id}')">L\u00f6schen</button>
            </div>
        </div>`;
    }).join('');
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderMealsList(btn.dataset.filter);
    });
});

document.getElementById('btn-add-meal').addEventListener('click', () => {
    state.editingMealId = null;
    document.getElementById('modal-meal-title').textContent = 'Neue Speise';
    document.getElementById('form-meal').reset();
    renderAllergenCheckboxes('meal-allergens');
    openModal('modal-meal');
});

window.editMeal = function(id) {
    const meal = state.meals.find(m => m.id === id);
    if (!meal) return;
    state.editingMealId = id;
    document.getElementById('modal-meal-title').textContent = 'Speise bearbeiten';
    document.getElementById('meal-name').value = meal.name;
    document.getElementById('meal-category').value = meal.category;
    document.getElementById('meal-description').value = meal.description || '';
    renderAllergenCheckboxes('meal-allergens', meal.allergens);
    openModal('modal-meal');
};

window.deleteMeal = function(id) {
    if (!confirm('Speise wirklich l\u00f6schen?')) return;
    state.meals = state.meals.filter(m => m.id !== id);
    for (const key of Object.keys(state.weekPlans)) {
        const plan = state.weekPlans[key];
        for (let d = 0; d < 5; d++) {
            if (plan[d]) plan[d] = plan[d].filter(mid => mid !== id);
        }
    }
    save();
    renderMealsList();
    renderWeekPlan();
};

document.getElementById('form-meal').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('meal-name').value.trim();
    const category = document.getElementById('meal-category').value;
    const description = document.getElementById('meal-description').value.trim();
    const allergens = getCheckedAllergens('meal-allergens');

    if (state.editingMealId) {
        const meal = state.meals.find(m => m.id === state.editingMealId);
        if (meal) {
            meal.name = name;
            meal.category = category;
            meal.description = description;
            meal.allergens = allergens;
        }
    } else {
        state.meals.push({ id: genId(), name, category, allergens, description });
    }
    save();
    closeModal('modal-meal');
    renderMealsList();
    renderWeekPlan();
});

// === KINDER & ALLERGIEN ===
function renderChildrenList() {
    const list = document.getElementById('children-list');
    if (state.children.length === 0) {
        list.innerHTML = '<div class="empty-state empty-children"><p>Noch keine Kinder eingetragen.</p><p class="hint">F\u00fcge Kinder hinzu, um Allergie-Warnungen im Speiseplan zu sehen.</p></div>';
        return;
    }

    list.innerHTML = state.children.map(c => {
        const allergenNames = c.allergens.map(id => ALLERGENS.find(a => a.id === id)?.name || id);
        return `
        <div class="child-card" data-id="${c.id}">
            <div class="child-card-info">
                <div class="child-name">${escHtml(c.firstname)} ${escHtml(c.lastname)}</div>
                <div class="child-meta">${c.group ? 'Gruppe: ' + escHtml(c.group) : ''}${c.notes ? ' | ' + escHtml(c.notes) : ''}</div>
                <div class="child-allergies">
                    ${allergenNames.length > 0
                        ? allergenNames.map(n => `<span class="allergy-tag">${n}</span>`).join('')
                        : '<span style="font-size:0.8rem;color:var(--text-light);">Keine Allergien</span>'
                    }
                </div>
            </div>
            <div class="meal-card-actions">
                <button class="btn-small btn-edit" onclick="editChild('${c.id}')">Bearbeiten</button>
                <button class="btn-small btn-delete" onclick="deleteChild('${c.id}')">L\u00f6schen</button>
            </div>
        </div>`;
    }).join('');
}

document.getElementById('btn-add-child').addEventListener('click', () => {
    state.editingChildId = null;
    document.getElementById('modal-child-title').textContent = 'Kind hinzuf\u00fcgen';
    document.getElementById('form-child').reset();
    renderAllergenCheckboxes('child-allergens');
    openModal('modal-child');
});

window.editChild = function(id) {
    const child = state.children.find(c => c.id === id);
    if (!child) return;
    state.editingChildId = id;
    document.getElementById('modal-child-title').textContent = 'Kind bearbeiten';
    document.getElementById('child-firstname').value = child.firstname;
    document.getElementById('child-lastname').value = child.lastname;
    document.getElementById('child-group').value = child.group || '';
    document.getElementById('child-notes').value = child.notes || '';
    renderAllergenCheckboxes('child-allergens', child.allergens);
    openModal('modal-child');
};

window.deleteChild = function(id) {
    if (!confirm('Kind wirklich l\u00f6schen?')) return;
    state.children = state.children.filter(c => c.id !== id);
    save();
    renderChildrenList();
    renderParentView();
};

document.getElementById('form-child').addEventListener('submit', (e) => {
    e.preventDefault();
    const firstname = document.getElementById('child-firstname').value.trim();
    const lastname = document.getElementById('child-lastname').value.trim();
    const group = document.getElementById('child-group').value.trim();
    const notes = document.getElementById('child-notes').value.trim();
    const allergens = getCheckedAllergens('child-allergens');

    if (state.editingChildId) {
        const child = state.children.find(c => c.id === state.editingChildId);
        if (child) {
            child.firstname = firstname;
            child.lastname = lastname;
            child.group = group;
            child.notes = notes;
            child.allergens = allergens;
        }
    } else {
        state.children.push({ id: genId(), firstname, lastname, group, notes, allergens });
    }
    save();
    closeModal('modal-child');
    renderChildrenList();
    renderParentView();
});

// === WOCHENPLAN ===
function renderWeekPlan() {
    const grid = document.getElementById('weekplan-grid');
    const plan = getWeekPlan(state.currentWeekOffset);
    const weekLabel = getWeekLabel(state.currentWeekOffset);
    document.getElementById('current-week').textContent = weekLabel;

    // Print header
    const printLabel = document.getElementById('print-week-label');
    if (printLabel) printLabel.textContent = weekLabel;

    grid.innerHTML = DAYS.map((day, i) => {
        const mealIds = plan[i] || [];
        const dateStr = getDayDate(state.currentWeekOffset, i);
        const mealsHtml = mealIds.map(mid => {
            const meal = state.meals.find(m => m.id === mid);
            if (!meal) return '';
            const warnings = getAllergyWarnings(meal);
            return `
                <div class="day-meal">
                    <button class="btn-remove-meal" onclick="removeMealFromDay(${i}, '${mid}')" title="Entfernen">&times;</button>
                    <div class="meal-name">${escHtml(meal.name)}</div>
                    <span class="category-badge cat-${meal.category}">${CATEGORIES[meal.category]}</span>
                    ${warnings}
                </div>`;
        }).join('');

        return `
        <div class="day-card">
            <div class="day-card-header">${day}<span class="day-date">${dateStr}</span></div>
            <div class="day-card-body">
                ${mealsHtml}
                <button class="btn-add-day-meal" onclick="pickMealForDay(${i})">+ Speise</button>
            </div>
        </div>`;
    }).join('');

    renderStats();
    checkVariety();
}

// === STATISTIK-BAR ===
function renderStats() {
    const plan = getWeekPlan(state.currentWeekOffset);
    const categories = { fleisch: 0, fisch: 0, vegetarisch: 0, vegan: 0 };

    for (let d = 0; d < 5; d++) {
        for (const mid of (plan[d] || [])) {
            const meal = state.meals.find(m => m.id === mid);
            if (meal) categories[meal.category]++;
        }
    }

    const bar = document.getElementById('stats-bar');
    bar.innerHTML = `
        <div class="stat-card stat-fleisch">
            <div class="stat-value" style="color:var(--cat-fleisch)">${categories.fleisch}</div>
            <div class="stat-label">Fleisch</div>
        </div>
        <div class="stat-card stat-fisch">
            <div class="stat-value" style="color:var(--cat-fisch)">${categories.fisch}</div>
            <div class="stat-label">Fisch</div>
        </div>
        <div class="stat-card stat-vegetarisch">
            <div class="stat-value" style="color:var(--cat-vegetarisch)">${categories.vegetarisch}</div>
            <div class="stat-label">Vegetarisch</div>
        </div>
        <div class="stat-card stat-vegan">
            <div class="stat-value" style="color:var(--cat-vegan)">${categories.vegan}</div>
            <div class="stat-label">Vegan</div>
        </div>
    `;
}

function getAllergyWarnings(meal) {
    if (state.children.length === 0 || meal.allergens.length === 0) return '';
    const affected = [];
    for (const child of state.children) {
        const common = meal.allergens.filter(a => child.allergens.includes(a));
        if (common.length > 0) {
            const names = common.map(id => ALLERGENS.find(a => a.id === id)?.name || id);
            affected.push(`<strong>${escHtml(child.firstname)}</strong>: ${names.join(', ')}`);
        }
    }
    if (affected.length === 0) return '';
    return `<div class="allergy-warning">Allergie-Hinweis:<br>${affected.join('<br>')}</div>`;
}

function checkVariety() {
    const plan = getWeekPlan(state.currentWeekOffset);
    const alertEl = document.getElementById('variety-alert');
    const categories = { fleisch: 0, fisch: 0, vegetarisch: 0, vegan: 0 };
    let totalMeals = 0;

    for (let d = 0; d < 5; d++) {
        for (const mid of (plan[d] || [])) {
            const meal = state.meals.find(m => m.id === mid);
            if (meal) {
                categories[meal.category]++;
                totalMeals++;
            }
        }
    }

    if (totalMeals < 3) {
        alertEl.classList.add('hidden');
        return;
    }

    const messages = [];
    const fleischAnteil = categories.fleisch / totalMeals;
    const vegAnteil = (categories.vegetarisch + categories.vegan) / totalMeals;

    if (fleischAnteil > 0.5) {
        messages.push('Zu viele Fleischgerichte diese Woche. Empfehlung: max. 2-3x pro Woche.');
    }
    if (categories.fisch === 0 && totalMeals >= 4) {
        messages.push('Empfehlung: Mindestens 1x Fisch pro Woche einplanen.');
    }
    if (vegAnteil < 0.3 && totalMeals >= 4) {
        messages.push('Empfehlung: Mehr vegetarische/vegane Gerichte f\u00fcr eine ausgewogene Ern\u00e4hrung.');
    }
    if (categories.vegetarisch === 0 && categories.vegan === 0 && totalMeals >= 3) {
        messages.push('Kein vegetarisches oder veganes Gericht geplant.');
    }

    // Doppelte Speisen prüfen
    const allMealIds = [];
    for (let d = 0; d < 5; d++) {
        allMealIds.push(...(plan[d] || []));
    }
    const duplicates = allMealIds.filter((id, idx) => allMealIds.indexOf(id) !== idx);
    if (duplicates.length > 0) {
        const dupNames = [...new Set(duplicates)].map(id => {
            const m = state.meals.find(meal => meal.id === id);
            return m ? m.name : '';
        }).filter(Boolean);
        if (dupNames.length > 0) {
            messages.push(`Doppelte Speisen: ${dupNames.join(', ')}.`);
        }
    }

    if (messages.length > 0) {
        alertEl.className = 'alert alert-warning';
        alertEl.innerHTML = '<strong>Abwechslungs-Check:</strong><br>' + messages.join('<br>');
    } else if (totalMeals >= 5) {
        alertEl.className = 'alert alert-success';
        alertEl.textContent = 'Gute Abwechslung! Der Speiseplan ist ausgewogen.';
    } else {
        alertEl.classList.add('hidden');
    }
}

document.getElementById('prev-week').addEventListener('click', () => {
    state.currentWeekOffset--;
    renderWeekPlan();
});

document.getElementById('next-week').addEventListener('click', () => {
    state.currentWeekOffset++;
    renderWeekPlan();
});

window.pickMealForDay = function(dayIndex) {
    state.pickingDay = dayIndex;
    document.getElementById('modal-pick-title').textContent = `Speise f\u00fcr ${DAYS[dayIndex]} ausw\u00e4hlen`;
    renderPickList('alle');
    // Reset filter buttons
    document.querySelectorAll('.pick-filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.pick-filter-btn[data-filter="alle"]').classList.add('active');
    openModal('modal-pick-meal');
};

function renderPickList(filter) {
    const list = document.getElementById('pick-meals-list');
    const filtered = filter === 'alle'
        ? state.meals
        : state.meals.filter(m => m.category === filter);

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state empty-meals"><p>Keine Speisen verf\u00fcgbar.</p><p class="hint">Bitte zuerst unter "Speisen" neue Gerichte anlegen.</p></div>';
        return;
    }

    list.innerHTML = filtered.map(m => {
        const allergenNames = m.allergens.map(id => ALLERGENS.find(a => a.id === id)?.name || id).join(', ');
        return `
        <div class="meal-card" onclick="selectMealForDay('${m.id}')">
            <div class="meal-card-info">
                <div class="meal-title">${escHtml(m.name)} <span class="category-badge cat-${m.category}">${CATEGORIES[m.category]}</span></div>
                <div class="meal-meta">${allergenNames ? 'Allergene: ' + allergenNames : 'Keine Allergene'}</div>
            </div>
        </div>`;
    }).join('');
}

document.querySelectorAll('.pick-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.pick-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderPickList(btn.dataset.filter);
    });
});

window.selectMealForDay = function(mealId) {
    const plan = getWeekPlan(state.currentWeekOffset);
    if (!plan[state.pickingDay]) plan[state.pickingDay] = [];
    plan[state.pickingDay].push(mealId);
    save();
    closeModal('modal-pick-meal');
    renderWeekPlan();
};

window.removeMealFromDay = function(dayIndex, mealId) {
    const plan = getWeekPlan(state.currentWeekOffset);
    if (plan[dayIndex]) {
        const idx = plan[dayIndex].indexOf(mealId);
        if (idx !== -1) plan[dayIndex].splice(idx, 1);
    }
    save();
    renderWeekPlan();
};

// === ELTERN-ANSICHT ===
function renderParentView() {
    const select = document.getElementById('parent-child-select');
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Kind ausw\u00e4hlen --</option>' +
        state.children.map(c =>
            `<option value="${c.id}">${escHtml(c.firstname)} ${escHtml(c.lastname)}</option>`
        ).join('');
    if (currentVal) select.value = currentVal;
    renderParentPlan();
}

document.getElementById('parent-child-select').addEventListener('change', (e) => {
    state.parentChildId = e.target.value || null;
    state.parentWeekOffset = 0;
    renderParentPlan();
});

document.getElementById('parent-prev-week').addEventListener('click', () => {
    state.parentWeekOffset--;
    renderParentPlan();
});

document.getElementById('parent-next-week').addEventListener('click', () => {
    state.parentWeekOffset++;
    renderParentPlan();
});

function renderParentPlan() {
    const wrapper = document.getElementById('parent-weekplan');
    const login = document.getElementById('parent-login');

    if (!state.parentChildId) {
        wrapper.classList.add('hidden');
        login.classList.remove('hidden');
        return;
    }

    login.classList.add('hidden');
    wrapper.classList.remove('hidden');

    const child = state.children.find(c => c.id === state.parentChildId);
    if (!child) return;

    document.getElementById('parent-current-week').textContent = getWeekLabel(state.parentWeekOffset);

    const plan = getWeekPlan(state.parentWeekOffset);
    const grid = document.getElementById('parent-plan-grid');

    grid.innerHTML = DAYS.map((day, i) => {
        const mealIds = plan[i] || [];
        const dateStr = getDayDate(state.parentWeekOffset, i);
        const mealsHtml = mealIds.map(mid => {
            const meal = state.meals.find(m => m.id === mid);
            if (!meal) return '';
            const common = meal.allergens.filter(a => child.allergens.includes(a));
            const hasWarning = common.length > 0;
            const warningNames = common.map(id => ALLERGENS.find(a => a.id === id)?.name || id);
            return `
                <div class="day-meal" ${hasWarning ? 'style="border:2px solid var(--danger);"' : ''}>
                    <div class="meal-name">${escHtml(meal.name)}</div>
                    <span class="category-badge cat-${meal.category}">${CATEGORIES[meal.category]}</span>
                    ${hasWarning ? `<div class="allergy-warning"><strong>Achtung!</strong> Enth\u00e4lt: ${warningNames.join(', ')}</div>` : ''}
                </div>`;
        }).join('');

        return `
        <div class="day-card">
            <div class="day-card-header">${day}<span class="day-date">${dateStr}</span></div>
            <div class="day-card-body">
                ${mealsHtml || '<span style="color:var(--text-light);font-size:0.85rem;">Noch nicht geplant</span>'}
            </div>
        </div>`;
    }).join('');

    // Allergie-Info des Kindes
    const infoBox = document.getElementById('child-allergies-info');
    const childAllergens = child.allergens.map(id => ALLERGENS.find(a => a.id === id)?.name || id);
    infoBox.innerHTML = `
        <h3>Allergien von ${escHtml(child.firstname)}</h3>
        ${childAllergens.length > 0
            ? `<div class="child-allergies">${childAllergens.map(n => `<span class="allergy-tag">${n}</span>`).join('')}</div>`
            : '<p style="color:var(--text-light);">Keine Allergien eingetragen.</p>'
        }
        ${child.notes ? `<p style="margin-top:0.5rem;font-size:0.9rem;"><strong>Hinweise:</strong> ${escHtml(child.notes)}</p>` : ''}
    `;
}

// === OPEN FOOD FACTS ZUTATEN-SUCHE ===
const OFF_ALLERGEN_MAP = {
    'en:gluten': 'gluten',
    'en:crustaceans': 'krebstiere',
    'en:eggs': 'eier',
    'en:fish': 'fisch',
    'en:peanuts': 'erdnuesse',
    'en:soybeans': 'soja',
    'en:milk': 'milch',
    'en:nuts': 'schalenfruchte',
    'en:celery': 'sellerie',
    'en:mustard': 'senf',
    'en:sesame-seeds': 'sesam',
    'en:sulphur-dioxide-and-sulphites': 'sulfite',
    'en:lupin': 'lupinen',
    'en:molluscs': 'weichtiere',
};

let selectedIngredients = [];

document.getElementById('btn-search-ingredient').addEventListener('click', () => {
    searchIngredients();
});

document.getElementById('ingredient-search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchIngredients();
    }
});

async function searchIngredients() {
    const query = document.getElementById('ingredient-search-input').value.trim();
    if (!query) return;

    const results = document.getElementById('ingredient-search-results');
    results.innerHTML = '<div class="search-loading">Suche l\u00e4uft...</div>';

    try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=8&lc=de&fields=product_name,allergens_tags,allergens,brands`;
        const resp = await fetch(url);
        const data = await resp.json();

        if (!data.products || data.products.length === 0) {
            results.innerHTML = '<div class="search-loading">Keine Ergebnisse gefunden.</div>';
            return;
        }

        results.innerHTML = data.products.map((p, idx) => {
            const name = p.product_name || 'Unbekannt';
            const brand = p.brands || '';
            const allergenTags = p.allergens_tags || [];
            const mapped = allergenTags
                .map(tag => {
                    const localId = OFF_ALLERGEN_MAP[tag];
                    if (localId) return ALLERGENS.find(a => a.id === localId)?.name || '';
                    return '';
                })
                .filter(Boolean);

            return `
                <div class="search-result-item" onclick="selectIngredient(${idx})">
                    <div class="result-name">${escHtml(name)}${brand ? ' <span style="font-weight:400;color:var(--text-light);">(' + escHtml(brand) + ')</span>' : ''}</div>
                    <div class="result-allergens">
                        ${mapped.length > 0 ? 'Allergene: ' + mapped.map(n => `<span>${n}</span>`).join(' ') : 'Keine Allergene erkannt'}
                    </div>
                </div>`;
        }).join('');

        // Store products for selection
        window._searchProducts = data.products;
    } catch (err) {
        results.innerHTML = '<div class="search-loading">Fehler bei der Suche. Bitte pr\u00fcfe deine Internetverbindung.</div>';
    }
}

window.selectIngredient = function(idx) {
    const product = window._searchProducts?.[idx];
    if (!product) return;

    const name = product.product_name || 'Unbekannt';
    const allergenTags = product.allergens_tags || [];

    // Add to selected ingredients
    selectedIngredients.push({ name, allergenTags });
    renderIngredientTags();

    // Auto-check allergens
    for (const tag of allergenTags) {
        const localId = OFF_ALLERGEN_MAP[tag];
        if (localId) {
            const cb = document.querySelector(`#meal-allergens input[value="${localId}"]`);
            if (cb) cb.checked = true;
        }
    }

    // Clear search
    document.getElementById('ingredient-search-input').value = '';
    document.getElementById('ingredient-search-results').innerHTML = '';
};

window.removeIngredientTag = function(idx) {
    selectedIngredients.splice(idx, 1);
    renderIngredientTags();
    recalcAllergens();
};

function renderIngredientTags() {
    const container = document.getElementById('ingredient-tags');
    if (selectedIngredients.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = selectedIngredients.map((ing, i) =>
        `<span class="ingredient-tag">${escHtml(ing.name)} <span class="remove-tag" onclick="removeIngredientTag(${i})">&times;</span></span>`
    ).join('');
}

function recalcAllergens() {
    // Uncheck all first
    document.querySelectorAll('#meal-allergens input[type="checkbox"]').forEach(cb => cb.checked = false);
    // Re-check based on remaining ingredients
    for (const ing of selectedIngredients) {
        for (const tag of ing.allergenTags) {
            const localId = OFF_ALLERGEN_MAP[tag];
            if (localId) {
                const cb = document.querySelector(`#meal-allergens input[value="${localId}"]`);
                if (cb) cb.checked = true;
            }
        }
    }
}

// Reset ingredients when opening meal form
const origOpenMealAdd = document.getElementById('btn-add-meal').onclick;
document.getElementById('btn-add-meal').addEventListener('click', () => {
    selectedIngredients = [];
    renderIngredientTags();
    document.getElementById('ingredient-search-results').innerHTML = '';
    document.getElementById('ingredient-search-input').value = '';
});

// --- Utilities ---
function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Init ---
load();
renderWeekPlan();
renderMealsList();
renderChildrenList();
renderParentView();
