/* =====================================================
   DOM References
   ===================================================== */

const labGrid = document.getElementById("lab-room-grid");

/* Optional Search + Filter UI (disabled for now)
const labSearch = document.getElementById("labSearch");
const filterBtn = document.getElementById("filterBtn");
const filterPop = document.getElementById("filterPop");
const applyFilters = document.getElementById("applyFilters");
const filterChecks = Array.from(filterPop.querySelectorAll("input[type='checkbox']"));
*/

const reservationList = document.getElementById("reservationList");
const calGrid = document.getElementById("calendar-days-grid");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");
const calMonthLabel = document.getElementById("calMonthLabel");


/* =====================================================
   Static Data (Demo / Placeholder Content)
   ===================================================== */

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


/* =====================================================
   State (Active Filters + Calendar View)
   ===================================================== */

let activeBuildingFilters = new Set(["andrew", "gokongwei"]);
let viewDate = new Date();


/* =====================================================
   Lab Rendering
   ===================================================== */

/* Optional search query helper (disabled for now)
function getQuery() {
    return (labSearch.value || "").trim().toLowerCase();
}
*/

/**
 * Renders lab cards into the "Labs Today" grid.
 * (Filtering/search is currently commented out, but kept for future use.)
 */
function renderLabs() {
    /* Search + filter logic (disabled for now)
    const q = getQuery();
    const filtered = labsToday.filter(item => {
        if (!activeBuildingFilters.has(item.bldgKey)) return false;
        if (!q) return true;
        return (item.room + " " + item.building).toLowerCase().includes(q);
    });
    */

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

/* Checkbox syncing for filter popup (disabled for now)
function syncChecks() {
    filterChecks.forEach(c => c.checked = activeBuildingFilters.has(c.value));
}
*/


/* =====================================================
   Date Utilities
   ===================================================== */

/** Pads a number to 2 digits (e.g., 2 -> "02") */
function pad2(n) {
    return String(n).padStart(2, "0");
}

/** Converts a Date object into an ISO-like YYYY-MM-DD string */
function toISODateKey(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Converts JS day index (Sun=0..Sat=6) into Monday-first index (Mon=0..Sun=6) */
function mondayIndex(jsDay) {
    return (jsDay + 6) % 7;
}


/* =====================================================
   Reservation Mapping + Rendering
   ===================================================== */

/**
 * Creates a map of dateISO -> Set(buildingKeys)
 * Used to mark calendar days with reservations and building color.
 */
function buildReservationMap() {
    const map = new Map();

    reservations.forEach(r => {
        if (!map.has(r.dateISO)) map.set(r.dateISO, new Set());
        map.get(r.dateISO).add(r.bldgKey);
    });

    return map;
}

/**
 * Renders reservation cards in the sidebar/list.
 * Color accents are based on building key.
 */
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


/* =====================================================
   Calendar Rendering
   ===================================================== */

/**
 * Renders the calendar grid for the month currently stored in viewDate.
 * - Highlights today's date
 * - Marks dates with reservations (single or multi-building)
 */
function renderCalendar() {
    const resMap = buildReservationMap();
    const todayKey = toISODateKey(new Date());

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Calendar header label (e.g., "February 2026")
    calMonthLabel.textContent = viewDate.toLocaleString(undefined, {
        month: "long",
        year: "numeric"
    });

    // Month boundaries and grid padding calculation
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = mondayIndex(first.getDay());
    const daysInMonth = last.getDate();

    // Build cell metadata for calendar rendering
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push({ empty: true });

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const key = toISODateKey(dateObj);
        cells.push({ empty: false, day: d, key });
    }

    // Pad the remaining cells so the grid ends on a full week row
    while (cells.length % 7 !== 0) cells.push({ empty: true });

    // Render calendar HTML
    calGrid.innerHTML = cells.map(c => {
        if (c.empty) return `<span class="empty"></span>`;

        const classes = [];

        // Highlight today's date
        if (c.key === todayKey) classes.push("today");

        // Mark reserved dates and apply building-based classes
        const bset = resMap.get(c.key);
        if (bset && bset.size) {
            classes.push("has-res");

            if (bset.size > 1) {
                classes.push("multi");
            } else {
                classes.push(bset.has("andrew") ? "bldg-andrew" : "bldg-gokongwei");
            }
        }

        return `<span class="${classes.join(" ")}" data-date="${c.key}">${c.day}</span>`;
    }).join("");
}


/* =====================================================
   Filter Popup Logic (disabled for now)
   ===================================================== */

/*
filterBtn.addEventListener("click", () => {
    syncChecks();
    filterPop.classList.toggle("show");
});

applyFilters.addEventListener("click", () => {
    activeBuildingFilters = new Set(
        filterChecks.filter(c => c.checked).map(c => c.value)
    );
    renderLabs();
    filterPop.classList.remove("show");
});
*/


/* =====================================================
   Global Click Handler (Popup Dismiss)
   ===================================================== */

/**
 * Closes the filter popup when clicking outside the action area.
 * NOTE: This assumes filterPop exists/enabled; keep disabled if filterPop is commented out.
 */
document.addEventListener("click", (e) => {
    const within = e.target.closest(".hero-actions");
    if (!within) filterPop.classList.remove("show");
});

// labSearch.addEventListener("input", renderLabs);


/* =====================================================
   Calendar Navigation Controls
   ===================================================== */

prevBtn.addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
});

nextBtn.addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
});


/* =====================================================
   Initial Render
   ===================================================== */

renderLabs();
renderReservations();
renderCalendar();
