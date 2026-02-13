
// Hardcoded sample results (Para lang may makita ako, pasabi na lang if need ilagay sa separate file or something)
const DATA = [
    { buildingCode: "G", building: "Gokongwei Hall", room: "G203", seat: 1, date: "2026-02-27", time: "04:15" },
    { buildingCode: "G", building: "Gokongwei Hall", room: "G203", seat: 7, date: "2026-02-27", time: "08:30" },
    { buildingCode: "G", building: "Gokongwei Hall", room: "G301", seat: 2, date: "2026-02-28", time: "10:00" },
    { buildingCode: "G", building: "Gokongwei Hall", room: "G302", seat: 6, date: "2026-02-28", time: "13:00" },
    { buildingCode: "G", building: "Gokongwei Hall", room: "G401", seat: 9, date: "2026-03-01", time: "09:00" },

    { buildingCode: "A", building: "Br. Andrew Hall", room: "A1103", seat: 1, date: "2026-02-27", time: "11:15" },
    { buildingCode: "A", building: "Br. Andrew Hall", room: "A1103", seat: 4, date: "2026-02-27", time: "15:30" },
    { buildingCode: "A", building: "Br. Andrew Hall", room: "A1201", seat: 3, date: "2026-02-28", time: "08:00" },
    { buildingCode: "A", building: "Br. Andrew Hall", room: "A1202", seat: 8, date: "2026-03-01", time: "14:45" },
    { buildingCode: "A", building: "Br. Andrew Hall", room: "A1304", seat: 5, date: "2026-03-02", time: "16:00" },
];

const el = (id) => document.getElementById(id);

const resultList = el("resultList");
const emptyState = el("emptyState");

const searchInput = el("searchInput");
const buildingFilter = el("buildingFilter");
const roomFilter = el("roomFilter");
const dateFilter = el("dateFilter");
const sortFilter = el("sortFilter");

const filterBtn = el("filterBtn");
const filterPanel = el("filterPanel");
const clearFilters = el("clearFilters");
const applyFilters = el("applyFilters");

let current = [...DATA];

function fmtDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const m = d.toLocaleString(undefined, { month: "short" });
    const day = String(d.getDate()).padStart(2, "0");
    return `${m} ${day}`;
}

function getSearchQuery() {
    return (searchInput.value || "").trim().toLowerCase();
}

function matchesSearch(item, q) {
    if (!q) return true;
    const hay = [
    item.building,
    item.buildingCode,
    item.room,
    String(item.seat),
    item.date,
    item.time
    ].join(" ").toLowerCase();
    return hay.includes(q);
}

function applyAllFilters() {
    const q = getSearchQuery();
    const b = buildingFilter.value;
    const r = (roomFilter.value || "").trim();
    const d = dateFilter.value;

    let filtered = DATA.filter(item => {
    if (!matchesSearch(item, q)) return false;

    if (b && item.buildingCode !== b) return false;

    if (r) {
        const rr = r.toUpperCase();
        // allow typing "203" or "G203"/"A1103"
        const roomDigits = item.room.replace(/[A-Z]/g, "");
        if (!(item.room.includes(rr) || roomDigits.includes(rr))) return false;
    }

    if (d && item.date !== d) return false;

    return true;
    });

    // Sort
    const sort = sortFilter.value;
    if (sort === "room") {
    filtered.sort((a, b) => a.room.localeCompare(b.room) || a.seat - b.seat);
    } else {
    // soonest: by date then time
    filtered.sort((a, b) => {
        const at = `${a.date}T${a.time}:00`;
        const bt = `${b.date}T${b.time}:00`;
        return at.localeCompare(bt);
    });
    }

    current = filtered;
    render();
}

function render() {
    resultList.innerHTML = "";

    if (!current.length) {
    emptyState.hidden = false;
    return;
    }
    emptyState.hidden = true;

    current.forEach(item => {
    const barClass = item.buildingCode === "G" ? "bld-g" : "bld-a";
    const title = `Room ${item.room} • Seat ${item.seat}`;
    const meta = `${fmtDate(item.date)} | ${item.time} • ${item.building}`;

    const card = document.createElement("div");
    card.className = "result-item";
    card.innerHTML = `
    <div class="building-bar ${barClass}" title="${item.building}"></div>
    <div class="result-main">
    <div class="result-title">${title}</div>
    <div class="result-meta">${meta}</div>
    </div>
`;

    resultList.appendChild(card);
    });
}

/* Filter panel toggle */
filterBtn.addEventListener("click", () => {
    filterPanel.classList.toggle("open");
    filterPanel.setAttribute("aria-hidden", String(!filterPanel.classList.contains("open")));
});

/* Close filter panel when clicking outside */
document.addEventListener("click", (e) => {
    const inside = filterPanel.contains(e.target) || filterBtn.contains(e.target);
    if (!inside) {
    filterPanel.classList.remove("open");
    filterPanel.setAttribute("aria-hidden", "true");
    }
});

/* Live search */
searchInput.addEventListener("input", applyAllFilters);

/* Buttons */
applyFilters.addEventListener("click", () => {
    applyAllFilters();
    filterPanel.classList.remove("open");
    filterPanel.setAttribute("aria-hidden", "true");
});

clearFilters.addEventListener("click", () => {
    buildingFilter.value = "";
    roomFilter.value = "";
    dateFilter.value = "";
    sortFilter.value = "soonest";
    searchInput.value = "";
    applyAllFilters();
});

applyAllFilters();

// function for keeping track of which dashboard to visit
function goToDashboard() {
        const role = localStorage.getItem('role');

        if (role === 'admin') {
            location.href = './admindashboard.html';
        } else {
            location.href = './dashboard.html';
        }
}