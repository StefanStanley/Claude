// TV-V Entgelttabelle – Grundentgelt der ersten (Eingangs-)Stufe je Entgeltgruppe.
// Monatlich brutto bei 39 Std./Woche. Quellen: öffentlich recherchierte
// Tarifinfos (Stand April 2026). Werte können jederzeit im Feld überschrieben
// werden und werden lokal gespeichert.
const TVV_TABELLE = {
    "2026": {
        gueltigVon: "01.06.2026",
        gueltigBis: "31.03.2027",
        stufe1: {
            "EG 1":  2604.51,
            "EG 2":  2922.27,
            "EG 3":  3095.47,
            "EG 4":  3314.22,
            "EG 5":  3505.59,
            "EG 6":  3743.00,
            "EG 7":  3988.65,
            "EG 8":  4280.31,
            "EG 9":  4618.94,
            "EG 10": 4911.53,
            "EG 11": 5252.83,
            "EG 12": 5594.19,
            "EG 13": 5984.29,
            "EG 14": 6374.40,
            "EG 15": 6813.22,
        },
    },
};

const AKTIVE_TABELLE = "2026";
const ENTGELTGRUPPEN = Object.keys(TVV_TABELLE[AKTIVE_TABELLE].stufe1);
const STORAGE_KEY = "tvv-praemie-rechner-v1";

const el = {
    entgeltgruppe: document.getElementById("entgeltgruppe"),
    stufe1: document.getElementById("stufe1"),
    stufe1Hint: document.getElementById("stufe1-hint"),
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
    tabellenHinweis: document.getElementById("tabellen-hinweis"),
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

function tabellenwert(eg) {
    return TVV_TABELLE[AKTIVE_TABELLE].stufe1[eg];
}

function populateEntgeltgruppen() {
    ENTGELTGRUPPEN.forEach((eg) => {
        const wert = tabellenwert(eg);
        const opt = document.createElement("option");
        opt.value = eg;
        opt.textContent = `${eg} – ${euro.format(wert)}`;
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
    const eg = el.entgeltgruppe.value;
    const perEG = (state.stufe1ByEG || {})[eg];
    el.stufe1.value = perEG !== undefined && perEG !== ""
        ? perEG
        : String(tabellenwert(eg)).replace(".", ",");

    if (state.prozentsatz) el.prozentsatz.value = state.prozentsatz;
    if (state.teilzeit) el.teilzeit.value = state.teilzeit;
    if (state.monate) el.monate.value = state.monate;

    renderStufe1Hinweis();
}

function renderStufe1Hinweis() {
    const eg = el.entgeltgruppe.value;
    const tabellenwertEG = tabellenwert(eg);
    const aktuell = parseNum(el.stufe1.value);
    const weichtAb = Number.isFinite(aktuell) &&
        Math.abs(aktuell - tabellenwertEG) > 0.005;
    const tabelleTxt = `TV-V ${AKTIVE_TABELLE}: ${eg} Stufe 1 = ${euro.format(tabellenwertEG)}`;
    el.stufe1Hint.textContent = weichtAb
        ? `${tabelleTxt} (abweichend überschrieben)`
        : tabelleTxt;
}

function onEntgeltgruppeChange() {
    const state = loadState();
    const eg = el.entgeltgruppe.value;
    const perEG = (state.stufe1ByEG || {})[eg];
    el.stufe1.value = perEG !== undefined && perEG !== ""
        ? perEG
        : String(tabellenwert(eg)).replace(".", ",");
    saveState();
    calculate();
    renderStufe1Hinweis();
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
    el.stufe1.value = String(tabellenwert(el.entgeltgruppe.value)).replace(".", ",");
    el.prozentsatz.value = "3.5";
    el.teilzeit.value = "100";
    el.monate.value = "12";
    renderStufe1Hinweis();
    calculate();
}

function renderTabellenhinweis() {
    const t = TVV_TABELLE[AKTIVE_TABELLE];
    el.tabellenHinweis.textContent =
        `Grundlage: TV-V Entgelttabelle ${AKTIVE_TABELLE} ` +
        `(gültig ${t.gueltigVon}–${t.gueltigBis}), 39 Std./Woche. ` +
        `Werte sind als Richtwerte hinterlegt und können überschrieben werden.`;
}

function init() {
    populateEntgeltgruppen();
    applyState(loadState());
    renderTabellenhinweis();

    el.entgeltgruppe.addEventListener("change", onEntgeltgruppeChange);
    [el.stufe1, el.prozentsatz, el.teilzeit, el.monate].forEach((input) => {
        input.addEventListener("input", () => {
            saveState();
            calculate();
            if (input === el.stufe1) renderStufe1Hinweis();
        });
    });
    el.reset.addEventListener("click", reset);

    calculate();
}

init();
