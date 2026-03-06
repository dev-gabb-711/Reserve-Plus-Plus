/* =====================================================
   Data Source
   - Reads search results passed from Handlebars
   ===================================================== */
const rawSearchResults = document.getElementById("searchResultsData");
const DATA = rawSearchResults ? JSON.parse(rawSearchResults.textContent) : [];

/* =====================================================
   DOM Helpers + References
   ===================================================== */
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

/* =====================================================
   State
   ===================================================== */
let current = [...DATA];

/* =====================================================
   Formatting + Search Helpers
   ===================================================== */
function fmtDate(dateStr) {
  if (!dateStr) return "No date set";

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

/* =====================================================
   Filtering + Sorting Logic
   ===================================================== */
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
      const roomDigits = String(item.room || "").replace(/[A-Z]/gi, "");
      if (!(String(item.room || "").toUpperCase().includes(rr) || roomDigits.includes(rr))) {
        return false;
      }
    }

    if (d && item.date && item.date !== d) return false;
    if (d && !item.date) return false;

    return true;
  });

  const sort = sortFilter.value;

  if (sort === "room") {
    filtered.sort((a, b) => String(a.room).localeCompare(String(b.room)) || Number(a.seat) - Number(b.seat));
  } else {
    filtered.sort((a, b) => {
      const aRoom = String(a.room || "");
      const bRoom = String(b.room || "");
      return aRoom.localeCompare(bRoom) || Number(a.seat) - Number(b.seat);
    });
  }

  current = filtered;
  render();
}

/* =====================================================
   Rendering Results
   ===================================================== */
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

    const meta = item.date && item.time
      ? `${fmtDate(item.date)} | ${item.time} • ${item.building}`
      : `${item.building}`;

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

/* =====================================================
   Filter Panel UI Behavior
   ===================================================== */
if (filterBtn && filterPanel) {
  filterBtn.addEventListener("click", () => {
    filterPanel.classList.toggle("open");
    filterPanel.setAttribute("aria-hidden", String(!filterPanel.classList.contains("open")));
  });

  document.addEventListener("click", (e) => {
    const inside = filterPanel.contains(e.target) || filterBtn.contains(e.target);

    if (!inside) {
      filterPanel.classList.remove("open");
      filterPanel.setAttribute("aria-hidden", "true");
    }
  });
}

/* =====================================================
   Input + Button Handlers
   ===================================================== */
if (searchInput) {
  searchInput.addEventListener("input", applyAllFilters);
}

if (applyFilters) {
  applyFilters.addEventListener("click", () => {
    applyAllFilters();

    if (filterPanel) {
      filterPanel.classList.remove("open");
      filterPanel.setAttribute("aria-hidden", "true");
    }
  });
}

if (clearFilters) {
  clearFilters.addEventListener("click", () => {
    buildingFilter.value = "";
    roomFilter.value = "";
    dateFilter.value = "";
    sortFilter.value = "soonest";
    searchInput.value = "";
    applyAllFilters();
  });
}

/* =====================================================
   Initial Load
   ===================================================== */
applyAllFilters();

/* =====================================================
   Dashboard Routing
   ===================================================== */
function goToDashboard() {
  const role = localStorage.getItem('role');

  if (role === 'admin') {
    location.href = '/admin-dashboard';
  } else {
    location.href = '/dashboard';
  }
}