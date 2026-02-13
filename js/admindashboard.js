/* =====================================================
   Utility Functions
   ===================================================== */

/**
 * Generates a simple SVG avatar using a given color.
 * Used for notification profile images.
 */
function makeAvatar(color) {
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>
        <rect width='100' height='100' rx='50' fill='${color}'/>
        <circle cx='50' cy='40' r='15' fill='white'/>
        <rect x='30' y='55' width='40' height='25' rx='12' fill='white'/>
    </svg>`;
}


/* =====================================================
   DOM References
   ===================================================== */

const heroTrack = document.getElementById("heroTrack");
const ticketTrack = document.getElementById("ticketTrack");
const notifMini = document.getElementById("notifMini");


/* =====================================================
   Static Data: Buildings and Room Status
   ===================================================== */

const buildings = [
    {
        title: "Br. Andrew Gonzalez Hall",
        image: "../img/lab.jpg",
        rooms: [
            { name: "Room A1103 • 33", status: "assist", count: 2 },
            { name: "Room A1103 • 1", status: "assist", count: 5 },
            { name: "Room A1103 • 12", status: "ok", count: 0 },
            { name: "Room A1103 • 4", status: "assist", count: 4 },
            { name: "Room A1103 • 18", status: "assist", count: 1 },
            { name: "Room A1103 • 21", status: "ok", count: 0 },
            { name: "Room A1103 • 7", status: "assist", count: 3 },
            { name: "Room A1103 • 10", status: "assist", count: 6 },
            { name: "Room A1103 • 14", status: "ok", count: 0 },
            { name: "Room A1103 • 2", status: "assist", count: 2 },
            { name: "Room A1103 • 9", status: "ok", count: 0 },
            { name: "Room A1103 • 5", status: "assist", count: 4 }
        ]
    },
    {
        title: "Gokongwei Hall",
        image: "../img/lab.jpg",
        rooms: [
            { name: "Room GK201 • 6", status: "ok", count: 0 },
            { name: "Room GK201 • 11", status: "assist", count: 1 },
            { name: "Room GK201 • 3", status: "assist", count: 2 },
            { name: "Room GK202 • 17", status: "ok", count: 0 },
            { name: "Room GK202 • 22", status: "assist", count: 5 },
            { name: "Room GK202 • 9", status: "assist", count: 3 },
            { name: "Room GK203 • 14", status: "ok", count: 0 },
            { name: "Room GK203 • 1", status: "assist", count: 4 },
            { name: "Room GK203 • 8", status: "assist", count: 2 },
            { name: "Room GK204 • 19", status: "ok", count: 0 },
            { name: "Room GK204 • 25", status: "assist", count: 6 },
            { name: "Room GK204 • 4", status: "assist", count: 1 }
        ]
    }
];


/* =====================================================
   Static Data: Assistance Tickets
   ===================================================== */

const tickets = [
    { id: 1, room: "A1103", seat: "Seat 1", issue: "PC Unresponsive", status: "Unresolved", priority: 1 },
    { id: 2, room: "GK202", seat: "Seat 17", issue: "Keyboard missing", status: "Unresolved", priority: 2 },
    { id: 3, room: "GK204", seat: "Seat 4", issue: "Monitor flickering", status: "Ongoing", priority: 3 }
];


/* =====================================================
   Static Data: Notifications
   ===================================================== */

const notifications = [
    {
        id: 1,
        name: "IT Assist",
        snippet: "PC Concern has been resolved",
        avatar: makeAvatar("purple")
    },
    {
        id: 2,
        name: "IT Assist",
        snippet: "Keyboard replaced in Room A1103 • Seat 4",
        avatar: makeAvatar("purple")
    },
    {
        id: 3,
        name: "System",
        snippet: "Scheduled maintenance tonight from 10:00 PM to 12:00 AM",
        avatar: makeAvatar("indigo")
    },
    {
        id: 4,
        name: "Lab Admin",
        snippet: "New assistance ticket filed for Room GK202 • Seat 17",
        avatar: makeAvatar("teal")
    }
];


/* =====================================================
   Rendering Functions
   ===================================================== */

/**
 * Renders the building hero carousel with room statuses.
 */
function renderHero() {
    heroTrack.innerHTML = buildings.map(building => `
        <article class="hero-card">
            <div class="hero-bg" style="background-image:linear-gradient(110deg, rgba(110,55,185,0.2), rgba(0,0,0,0.2)),url('${building.image}')"></div>
            <div class="hero-inner">
                <div class="hero-top">
                    <div class="hero-title">${building.title}</div>
                    <div class="hero-arrows">
                        <button class="hero-arrow hero-prev" type="button" aria-label="Previous">
                            <span class="material-symbols-rounded">chevron_left</span>
                        </button>
                        <button class="hero-arrow hero-next" type="button" aria-label="Next">
                            <span class="material-symbols-rounded">chevron_right</span>
                        </button>
                    </div>
                </div>

                <div class="room-scroll">
                    <div class="room-grid">
                        ${building.rooms.map(room => `
                            <div class="room-row">
                                <span class="pill-dot ${room.status === "ok" ? "ok" : "bad"}"></span>
                                <div class="room-meta">
                                    <div class="room-name">${room.name}</div>
                                    <div class="room-sub">
                                        ${room.status === "ok" ? "All Good" : `${room.count} Assistance Requests`}
                                    </div>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>
        </article>
    `).join("");
}


/**
 * Renders the assistance ticket cards.
 */
function renderTickets() {
    ticketTrack.innerHTML = tickets.map(ticket => `
        <article class="ticket-card">
            <div class="ticket-bg"></div>

            <div class="ticket-content">
                <div class="ticket-head">
                    <div class="ticket-title">Assistance Ticket ${ticket.id}</div>
                    <div class="ticket-sub">${ticket.room} • ${ticket.seat}</div>
                </div>

                <div class="ticket-divider"></div>

                <div class="ticket-body">
                    <div class="kv-row"><span>Issue : ${ticket.issue}</span></div>
                    <div class="kv-row"><span>Status : ${ticket.status}</span></div>
                    <div class="kv-row"><span>Priority Level : ${ticket.priority}</span></div>
                </div>

                <div class="ticket-foot">
                    <button class="ticket-btn">Resolved</button>
                </div>
            </div>
        </article>
    `).join("");
}


/**
 * Renders the mini notification list.
 */
function renderNotifications() {
    notifMini.innerHTML = notifications.map(n => `
        <div class="mini-item">
            <img src="${n.avatar}" class="mini-ava" alt="">
            <div class="mini-text">
                <div class="mini-name">${n.name}</div>
                <div class="mini-snippet">${n.snippet}</div>
            </div>
        </div>
    `).join("");
}


/* =====================================================
   Hero Carousel Controls
   ===================================================== */

/**
 * Calculates the current hero slide index.
 */
function getHeroIndex() {
    const w = heroTrack.clientWidth || 1;
    return Math.round(heroTrack.scrollLeft / w);
}


/**
 * Updates visibility of navigation arrows
 * depending on current slide position.
 */
function updateHeroArrows() {
    const idx = getHeroIndex();
    const isFirst = idx <= 0;
    const isLast = idx >= buildings.length - 1;

    document.querySelectorAll(".hero-prev")
        .forEach(btn => btn.style.display = isFirst ? "none" : "grid");

    document.querySelectorAll(".hero-next")
        .forEach(btn => btn.style.display = isLast ? "none" : "grid");
}


/**
 * Enables click-based hero carousel navigation.
 */
function setupHeroScroll() {
    heroTrack.addEventListener("click", (e) => {
        const prev = e.target.closest(".hero-prev");
        const next = e.target.closest(".hero-next");
        if (!prev && !next) return;

        const step = heroTrack.clientWidth;
        heroTrack.scrollBy({
            left: prev ? -step : step,
            behavior: "smooth"
        });
    });

    heroTrack.addEventListener("scroll", () =>
        requestAnimationFrame(updateHeroArrows)
    );

    window.addEventListener("resize", updateHeroArrows);
    updateHeroArrows();
}


/* =====================================================
   Horizontal Scroll Enhancement
   ===================================================== */

/**
 * Converts vertical mouse wheel movement
 * into horizontal scrolling for carousels.
 */
function enableWheelHorizontalScroll(el) {
    el.addEventListener("wheel", (e) => {
        const canScrollX = el.scrollWidth > el.clientWidth + 1;
        const atTopBoxRoomScroll = e.target.closest(".room-scroll");

        if (!canScrollX || atTopBoxRoomScroll) return;

        const intentVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
        if (!intentVertical) return;

        e.preventDefault();
        el.scrollBy({ left: e.deltaY, behavior: "auto" });
    }, { passive: false });
}


/* =====================================================
   Initial Rendering & Setup
   ===================================================== */

renderHero();
renderTickets();
renderNotifications();
setupHeroScroll();
enableWheelHorizontalScroll(heroTrack);
enableWheelHorizontalScroll(ticketTrack);


/* =====================================================
   Dashboard Navigation Logic
   ===================================================== */

/**
 * Redirects user to appropriate dashboard
 * based on stored role in localStorage.
 */
function goToDashboard() {
    const role = localStorage.getItem('role');

    if (role === 'admin') {
        location.href = './admindashboard.html';
    } else {
        location.href = './dashboard.html';
    }
}
