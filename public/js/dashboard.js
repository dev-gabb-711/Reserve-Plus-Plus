/* =====================================================
   DOM References
   ===================================================== */

const filterBtn = document.getElementById("filterBtn");
const filterPop = document.getElementById("filterPop");
const applyFilters = document.getElementById("applyFilters");

const filterChecks = filterPop
  ? Array.from(filterPop.querySelectorAll("input[type='checkbox']"))
  : [];

const labGrid = document.getElementById("lab-room-grid");
const reservationList = document.getElementById("reservationList");

const calGrid = document.getElementById("calendar-days-grid");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");
const calMonthLabel = document.getElementById("calMonthLabel");

const liveStatusBox = document.getElementById("liveStatusBox");

/* =====================================================
   State
   ===================================================== */

let activeBuildingFilters = new Set(["andrew", "gokongwei"]);
let viewDate = new Date();

/* =====================================================
   Date Utilities
   ===================================================== */

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function mondayIndex(jsDay) {
  return (jsDay + 6) % 7;
}

function parseDateFromReservation(value) {
  if (!value) return null;

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function formatTimeDisplay(dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
    return "";
  }

  return dateObj.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

/* =====================================================
   Building Helpers
   ===================================================== */

function inferBuildingKey(text) {
  const value = String(text || "").trim().toLowerCase();

  if (!value) return "";

  if (
    value.includes("andrew") ||
    /^a\d+/i.test(value) ||
    value.includes("room a")
  ) {
    return "andrew";
  }

  if (
    value.includes("gokongwei") ||
    /^g\d+/i.test(value) ||
    /^gk\d+/i.test(value) ||
    value.includes("room g")
  ) {
    return "gokongwei";
  }

  return "";
}

function applyLabBuildingStyles() {
  if (!labGrid) return;

  const labCards = Array.from(labGrid.querySelectorAll(".lab-room"));

  labCards.forEach(card => {
    const sub = card.querySelector(".lab-sub");
    const pill = card.querySelector(".lab-pill");

    const buildingText = sub ? sub.textContent : "";
    const buildingKey = inferBuildingKey(buildingText);

    card.dataset.bldg = buildingKey;

    if (!pill) return;

    pill.style.background = "";
    pill.style.boxShadow = "";

    if (buildingKey === "andrew") {
      pill.style.background = "#ffffff";
      pill.style.boxShadow = "0 10px 24px rgba(255,255,255,0.18)";
    } else if (buildingKey === "gokongwei") {
      pill.style.background = "#ff7a45";
      pill.style.boxShadow = "0 10px 24px rgba(255,122,69,0.18)";
    }
  });
}

function renderLabsByFilter() {
  if (!labGrid) return;

  const labCards = Array.from(labGrid.querySelectorAll(".lab-room"));

  labCards.forEach(card => {
    const key = card.dataset.bldg || "";

    if (!key) {
      card.style.display = "";
      return;
    }

    card.style.display = activeBuildingFilters.has(key) ? "" : "none";
  });
}

function syncChecks() {
  filterChecks.forEach(check => {
    check.checked = activeBuildingFilters.has(check.value);
  });
}

/* =====================================================
   Reservations Styling + Mapping
   ===================================================== */

function applyReservationStyles() {
  if (!reservationList) return;

  const cards = Array.from(reservationList.querySelectorAll(".res-card"));

  cards.forEach(card => {
    const bar = card.querySelector(".res-accent-bar");
    const buildingKey = card.dataset.bldg || "";

    if (!bar) return;

    bar.style.background = "";
    bar.style.boxShadow = "";

    if (buildingKey === "andrew") {
      bar.style.background = "#ffffff";
      bar.style.boxShadow = "0 10px 24px rgba(255,255,255,0.18)";
    } else if (buildingKey === "gokongwei") {
      bar.style.background = "#ff7a45";
      bar.style.boxShadow = "0 10px 24px rgba(255,122,69,0.18)";
    }
  });
}

function buildReservationMap() {
  const map = new Map();

  if (!reservationList) return map;

  const cards = Array.from(reservationList.querySelectorAll(".res-card"));

  cards.forEach(card => {
    const dateISO = card.dataset.date || "";
    const buildingKey = card.dataset.bldg || "";

    if (!dateISO || !buildingKey) return;

    if (!map.has(dateISO)) {
      map.set(dateISO, new Set());
    }

    map.get(dateISO).add(buildingKey);
  });

  return map;
}

/* =====================================================
   Live Reservation Status
   - Scoped only to the dashboard live status card
   ===================================================== */

function setLiveStatusState(state, payload = {}) {
  if (!liveStatusBox) return;

  liveStatusBox.dataset.state = state;

  if (state === "active") {
    const activeCount = document.getElementById("liveActiveCount");
    const activeRoom = document.getElementById("liveActiveRoom");
    const activeStart = document.getElementById("liveActiveStart");
    const activeEnd = document.getElementById("liveActiveEnd");

    if (activeCount && payload.count) {
      activeCount.textContent = payload.count;
    }

    if (activeRoom && payload.room) {
      activeRoom.textContent = payload.room;
    }

    if (activeStart && payload.start) {
      activeStart.textContent = payload.start;
    }

    if (activeEnd && payload.end) {
      activeEnd.textContent = payload.end;
    }
  }

  if (state === "pending") {
    const pendingCount = document.getElementById("livePendingCount");
    const pendingRoom = document.getElementById("livePendingRoom");
    const pendingStart = document.getElementById("livePendingStart");
    const pendingEnd = document.getElementById("livePendingEnd");

    if (pendingCount && payload.count) {
      pendingCount.textContent = payload.count;
    }

    if (pendingRoom && payload.room) {
      pendingRoom.textContent = payload.room;
    }

    if (pendingStart && payload.start) {
      pendingStart.textContent = payload.start;
    }

    if (pendingEnd && payload.end) {
      pendingEnd.textContent = payload.end;
    }
  }
}

function getReservationCardsForLiveStatus() {
  if (!reservationList) return [];

  return Array.from(reservationList.querySelectorAll(".res-card"));
}

function extractLiveReservations() {
  const cards = getReservationCardsForLiveStatus();

  return cards.map(card => {
    const roomTextEl = card.querySelector(".res-room");
    const timeTextEl = card.querySelector(".res-time");

    const roomText = roomTextEl ? roomTextEl.textContent.trim() : "";
    const timeText = timeTextEl ? timeTextEl.textContent.trim() : "";

    const dateISO = card.dataset.date || "";
    const dateObj = parseDateFromReservation(dateISO);

    return {
      roomText,
      timeText,
      dateISO,
      dateObj
    };
  }).filter(item => item.roomText);
}

/* =====================================================
   Demo Loader
   - Temporary visual state control until reservation
     time fields are finalized by the backend
   ===================================================== */

function initLiveStatusDemo() {
  if (!liveStatusBox) return;

  /*
    CHANGE THIS VALUE TO TEST DIFFERENT STATES:
    "active"
    "pending"
    "none"
  */
  const demoState = "active";

  if (demoState === "active") {
    const firstReservation = extractLiveReservations()[0];

    setLiveStatusState("active", {
      count: "30",
      room: firstReservation?.roomText || "Room A1103 • Seat 1",
      start: "Started: 3:00 PM",
      end: "Ends: 3:30 PM"
    });

    return;
  }

  if (demoState === "pending") {
    const firstReservation = extractLiveReservations()[0];

    setLiveStatusState("pending", {
      count: "12:40",
      room: firstReservation?.roomText || "Room A1103 • Seat 1",
      start: "Starts at: 3:00 PM",
      end: "Ends at: 3:30 PM"
    });

    return;
  }

  setLiveStatusState("none");
}

/* =====================================================
   Calendar Rendering
   ===================================================== */

function renderCalendar() {
  if (!calGrid) return;

  const resMap = buildReservationMap();
  const todayKey = toISODateKey(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  if (calMonthLabel) {
    calMonthLabel.textContent = viewDate.toLocaleString(undefined, {
      month: "long",
      year: "numeric"
    });
  }

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const startPad = mondayIndex(first.getDay());
  const daysInMonth = last.getDate();

  const cells = [];

  for (let i = 0; i < startPad; i++) {
    cells.push({ empty: true });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const key = toISODateKey(dateObj);

    cells.push({
      empty: false,
      day: d,
      key
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ empty: true });
  }

  calGrid.innerHTML = cells.map(cell => {
    if (cell.empty) {
      return `<span class="empty"></span>`;
    }

    const classes = [];

    if (cell.key === todayKey) {
      classes.push("today");
    }

    return `<span class="${classes.join(" ")}" data-date="${cell.key}">${cell.day}</span>`;
  }).join("");

  const daySpans = Array.from(calGrid.querySelectorAll("span[data-date]"));

  daySpans.forEach(dayEl => {
    const dateKey = dayEl.dataset.date;
    const buildingSet = resMap.get(dateKey);

    if (!buildingSet || !buildingSet.size) return;

    dayEl.classList.add("has-res");

    if (buildingSet.size > 1) {
      dayEl.style.setProperty("--calendar-bg", "linear-gradient(135deg, #ffffff, #ff7a45)");
    } else if (buildingSet.has("andrew")) {
      dayEl.style.setProperty("--calendar-bg", "#ffffff");
    } else if (buildingSet.has("gokongwei")) {
      dayEl.style.setProperty("--calendar-bg", "#ff7a45");
    }

    dayEl.style.position = "relative";
    dayEl.style.setProperty("background", "transparent");
    dayEl.style.setProperty("z-index", "0");
    dayEl.style.setProperty("--calendar-shadow", "none");
    dayEl.setAttribute("data-hasres", "true");
  });

  const styleId = "dashboard-calendar-inline-style";
  let styleTag = document.getElementById(styleId);

  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = `
    .cal-days span[data-hasres="true"]::after{
      content:"";
      position:absolute;
      width:30px;
      height:30px;
      border-radius:50%;
      z-index:-2;
      opacity:0.95;
      background:var(--calendar-bg, #ff7a45);
      box-shadow:var(--calendar-shadow, none);
    }
  `;
}

/* =====================================================
   Filter Popup Logic
   ===================================================== */

if (filterBtn) {
  filterBtn.addEventListener("click", () => {
    syncChecks();
    filterPop.classList.toggle("show");
  });
}

if (applyFilters) {
  applyFilters.addEventListener("click", () => {
    activeBuildingFilters = new Set(
      filterChecks.filter(check => check.checked).map(check => check.value)
    );

    renderLabsByFilter();
    filterPop.classList.remove("show");
  });
}

/* =====================================================
   Global Click Handler
   ===================================================== */

document.addEventListener("click", (e) => {
  if (!filterPop) return;

  const within = e.target.closest(".hero-actions");

  if (!within) {
    filterPop.classList.remove("show");
  }
});

/* =====================================================
   Calendar Navigation
   ===================================================== */

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    viewDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() - 1,
      1
    );

    renderCalendar();
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    viewDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      1
    );

    renderCalendar();
  });
}

/* =====================================================
   Initial Render
   ===================================================== */

applyLabBuildingStyles();
renderLabsByFilter();
applyReservationStyles();
renderCalendar();
initLiveStatusDemo();