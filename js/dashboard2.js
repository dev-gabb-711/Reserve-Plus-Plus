const labGrid = document.getElementById("lab-room-grid");
/* const labSearch = document.getElementById("labSearch");
const filterBtn = document.getElementById("filterBtn");
const filterPop = document.getElementById("filterPop");
const applyFilters = document.getElementById("applyFilters");
const filterChecks = Array.from(filterPop.querySelectorAll("input[type='checkbox']")); */

const reservationList = document.getElementById("reservationList");
const calGrid = document.getElementById("calendar-days-grid");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");
const calMonthLabel = document.getElementById("calMonthLabel");

const labsToday = [
    { room: "Room A1103 • Seat 1", building: "Br. Andrew Gonzalez Hall", bldgKey: "andrew" },
    { room: "Room A1103 • Seat 12", building: "Br. Andrew Gonzalez Hall", bldgKey: "andrew" },
    { room: "Room A1103 • Seat 4", building: "Br. Andrew Gonzalez Hall", bldgKey: "andrew" },
    { room: "Room G203 • Seat 1", building: "Gokongwei Hall", bldgKey: "gokongwei" },
    { room: "Room GK202 • Seat 17", building: "Gokongwei Hall", bldgKey: "gokongwei" },
    { room: "Room GK204 • Seat 4", building: "Gokongwei Hall", bldgKey: "gokongwei" }
];

const reservations = [
    { room: "Room G203 • Seat 1", building: "Gokongwei Hall", bldgKey: "gokongwei", dateISO: "2026-02-27", timeLabel: "Feb 27 | 4:15 AM" },
    { room: "Room A1103 • Seat 1", building: "Br. Andrew Gonzalez Hall", bldgKey: "andrew", dateISO: "2026-02-27", timeLabel: "Feb 27 | 4:15 AM" },
    { room: "Room A1103 • Seat 1", building: "Br. Andrew Gonzalez Hall", bldgKey: "andrew", dateISO: "2026-02-15", timeLabel: "Feb 27 | 4:15 AM" }
];

let activeBuildingFilters = new Set(["andrew", "gokongwei"]);
let viewDate = new Date();

/* function getQuery() {
    return (labSearch.value || "").trim().toLowerCase();
} */

function renderLabs() {
    /* const q = getQuery();
    const filtered = labsToday.filter(item => {
    if (!activeBuildingFilters.has(item.bldgKey)) return false;
    if (!q) return true;
    return (item.room + " " + item.building).toLowerCase().includes(q);
    }); */

    labGrid.innerHTML = labsToday.map(item => `
    <div class="lab-room" data-bldg="${item.bldgKey}">
        <span class="lab-pill bldg-${item.bldgKey}"></span>
        <div class="lab-meta">
        <div class="lab-name">${item.room}</div>
        <div class="lab-sub">${item.building}</div>
        </div>
    </div>
    `).join("");
} 

/*function syncChecks() {
    filterChecks.forEach(c => c.checked = activeBuildingFilters.has(c.value));
}*/

function pad2(n) {
    return String(n).padStart(2, "0");
}

function toISODateKey(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function mondayIndex(jsDay) {
    return (jsDay + 6) % 7;
}

function buildReservationMap() {
    const map = new Map();
    reservations.forEach(r => {
    if (!map.has(r.dateISO)) map.set(r.dateISO, new Set());
    map.get(r.dateISO).add(r.bldgKey);
    });
    return map;
}

function renderReservations() {
    reservationList.innerHTML = reservations.map(r => {
    const accentClass = r.bldgKey === "andrew" ? "green-accent" : "red-accent";
    return `
        <div class="res-card ${accentClass}">
        <div class="res-accent-bar"></div>
        <div class="res-info">
            <div class="res-room">${r.room}</div>
            <div class="res-time">${r.timeLabel}</div>
        </div>
        </div>
    `;
    }).join("");
}

function renderCalendar() {
    const resMap = buildReservationMap();
    const todayKey = toISODateKey(new Date());

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    calMonthLabel.textContent = viewDate.toLocaleString(undefined, { month: "long", year: "numeric" });

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = mondayIndex(first.getDay());
    const daysInMonth = last.getDate();

    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push({ empty: true });

    for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const key = toISODateKey(dateObj);
    cells.push({ empty: false, day: d, key });
    }

    while (cells.length % 7 !== 0) cells.push({ empty: true });

    calGrid.innerHTML = cells.map(c => {
    if (c.empty) return `<span class="empty"></span>`;

    const classes = [];
    if (c.key === todayKey) classes.push("today");

    const bset = resMap.get(c.key);
    if (bset && bset.size) {
        classes.push("has-res");
        if (bset.size > 1) classes.push("multi");
        else classes.push(bset.has("andrew") ? "bldg-andrew" : "bldg-gokongwei");
    }

    return `<span class="${classes.join(" ")}" data-date="${c.key}">${c.day}</span>`;
    }).join("");
}

/* filterBtn.addEventListener("click", () => {
    syncChecks();
    filterPop.classList.toggle("show");
}); 

applyFilters.addEventListener("click", () => {
    activeBuildingFilters = new Set(filterChecks.filter(c => c.checked).map(c => c.value));
    renderLabs();
    filterPop.classList.remove("show");
}); */

document.addEventListener("click", (e) => {
    const within = e.target.closest(".hero-actions");
    if (!within) filterPop.classList.remove("show");
});

// labSearch.addEventListener("input", renderLabs);

prevBtn.addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
});

nextBtn.addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
});

renderLabs();
renderReservations();
renderCalendar();

