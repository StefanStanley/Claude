const ENTGELTGRUPPEN = [
    "EG 1", "EG 2", "EG 3", "EG 4", "EG 5",
    "EG 6", "EG 7", "EG 8", "EG 9",
    "EG 10", "EG 11", "EG 12", "EG 13", "EG 14", "EG 15"
];

const STORAGE_KEY = "tvv-praemie-rechner-v1";

const el = {
    entgeltgruppe: document.getElementById("entgeltgruppe"),
    stufe1: document.getElementById("stufe1"),
    prozentsatz: document.getElementById("prozentsatz"),
    teilzeit: document.getElementById("teilzeit"),
    monate: document.getElementById("monate"),
    reset: document.getElementById("reset-btn"),
    resultPraemie: document.getElementById("result-praemie"),
    bStufe1: document.getElementById("b-stufe1"),
    bProzent: document.getElementById("b-prozent"),
    bGrund: document.getElementById("b-grund"),
    bTeilzeit: document.getElementById("b-teilzeit"),
    bMonate: document.getElementById("b-monate"),
    bTotal: document.getElementById("b-total"),
};

const euro = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
});

const percent = (value) =>
    new Intl.NumberFormat("de-DE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value) + " %";

function populateEntgeltgruppen() {
    ENTGELTGRUPPEN.forEach((eg) => {
        const opt = document.createElement("option");
        opt.value = eg;
        opt.textContent = eg;
        el.entgeltgruppe.appendChild(opt);
    });
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function saveState() {
    const state = {
        entgeltgruppe: el.entgeltgruppe.value,
        stufe1ByEG: Object.assign({}, loadState().stufe1ByEG || {}, {
            [el.entgeltgruppe.value]: el.stufe1.value,
        }),
        prozentsatz: el.prozentsatz.value,
        teilzeit: el.teilzeit.value,
        monate: el.monate.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyState(state) {
    if (state.entgeltgruppe && ENTGELTGRUPPEN.includes(state.entgeltgruppe)) {
        el.entgeltgruppe.value = state.entgeltgruppe;
    }
    const egValue = el.entgeltgruppe.value;
    const perEG = (state.stufe1ByEG || {})[egValue];
    if (perEG !== undefined && perEG !== "") {
        el.stufe1.value = perEG;
    }
    if (state.prozentsatz) el.prozentsatz.value = state.prozentsatz;
    if (state.teilzeit) el.teilzeit.value = state.teilzeit;
    if (state.monate) el.monate.value = state.monate;
}

function onEntgeltgruppeChange() {
    const state = loadState();
    const perEG = (state.stufe1ByEG || {})[el.entgeltgruppe.value];
    el.stufe1.value = perEG !== undefined ? perEG : "";
    saveState();
    calculate();
}

function parseNum(value) {
    if (value === "" || value === null || value === undefined) return NaN;
    const n = Number(String(value).replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
}

function calculate() {
    const stufe1 = parseNum(el.stufe1.value);
    const prozent = parseNum(el.prozentsatz.value);
    const teilzeit = parseNum(el.teilzeit.value);
    const monate = parseNum(el.monate.value);

    if (!Number.isFinite(stufe1) || stufe1 <= 0 || !Number.isFinite(prozent)) {
        el.resultPraemie.textContent = "–";
        el.bStufe1.textContent = "–";
        el.bProzent.textContent = "–";
        el.bGrund.textContent = "–";
        el.bTeilzeit.textContent = "–";
        el.bMonate.textContent = "–";
        el.bTotal.textContent = "–";
        return;
    }

    const tz = Number.isFinite(teilzeit) ? teilzeit : 100;
    const mn = Number.isFinite(monate) ? monate : 12;

    const grund = stufe1 * (prozent / 100);
    const total = grund * (tz / 100) * (mn / 12);

    el.resultPraemie.textContent = euro.format(total);
    el.bStufe1.textContent = euro.format(stufe1);
    el.bProzent.textContent = percent(prozent);
    el.bGrund.textContent = euro.format(grund);
    el.bTeilzeit.textContent = percent(tz);
    el.bMonate.textContent = `${mn} / 12`;
    el.bTotal.textContent = euro.format(total);
}

function reset() {
    localStorage.removeItem(STORAGE_KEY);
    el.entgeltgruppe.selectedIndex = 0;
    el.stufe1.value = "";
    el.prozentsatz.value = "3.5";
    el.teilzeit.value = "100";
    el.monate.value = "12";
    calculate();
}

function init() {
    populateEntgeltgruppen();
    applyState(loadState());

    el.entgeltgruppe.addEventListener("change", onEntgeltgruppeChange);
    [el.stufe1, el.prozentsatz, el.teilzeit, el.monate].forEach((input) => {
        input.addEventListener("input", () => {
            saveState();
            calculate();
        });
    });
    el.reset.addEventListener("click", reset);

    calculate();
}

init();
