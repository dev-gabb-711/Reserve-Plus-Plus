(function () {
    const form = document.getElementById("ticketForm");
    const chipsWrap = document.getElementById("concernChips");
    const buildingEl = document.getElementById("building");
    const roomEl = document.getElementById("room");
    const seatEl = document.getElementById("seat");
    const messageEl = document.getElementById("message");
    const cancelBtn = document.getElementById("cancelBtn");
    const ticketsPane = document.getElementById("ticketsPane");

    let selectedConcern = "";

    // Demo data (replace later with API response)
    let tickets = [
    { room: "G203", seat: 1, status: "Pending" },
    { room: "A1103", seat: 1, status: "Resolved" },
    { room: "A1103", seat: 1, status: "Resolved" },
    { room: "A1103", seat: 1, status: "Resolved" },
    { room: "A1103", seat: 1, status: "Resolved" },
    { room: "A1103", seat: 1, status: "Resolved" },
    { room: "A1103", seat: 1, status: "Resolved" },
    ];

    function statusToClass(status) {
    const s = (status || "").toLowerCase();
    if (s.includes("pending") || s.includes("open") || s.includes("waiting")) return "red";
    if (s.includes("resolved") || s.includes("closed") || s.includes("done")) return "green";
    return "purple";
    }

    function ticketCardHTML(t) {
    const cls = statusToClass(t.status);
    return `
        <div class="mini-card ${cls}">
        <div class="accent"></div>
        <div class="info">
            <strong>Room ${t.room} • Seat ${t.seat}</strong>
            <p>${t.status}</p>
        </div>
        </div>
    `.trim();
    }

    function renderTickets() {
    if (!tickets || tickets.length === 0) {
        ticketsPane.innerHTML = `<p class="mb-0" style="opacity:.75;">No tickets yet.</p>`;
        return;
    }
    ticketsPane.innerHTML = tickets.map(ticketCardHTML).join("");
    }

    function clearChipSelection() {
    selectedConcern = "";
    chipsWrap.querySelectorAll(".chip.active").forEach(btn => btn.classList.remove("active"));
    }

    function resetForm() {
    form.reset();
    clearChipSelection();
    }

    // Chip click: select/deselect concern (does NOT require message)
    chipsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;

    const concern = btn.dataset.concern || btn.textContent.trim();
    const isActive = btn.classList.contains("active");

    chipsWrap.querySelectorAll(".chip.active").forEach(b => b.classList.remove("active"));

    if (isActive) {
        selectedConcern = "";
    } else {
        btn.classList.add("active");
        selectedConcern = concern;
    }
    });

    // Submit: allow (chip only) OR (message only) OR both
    form.addEventListener("submit", (e) => {
    e.preventDefault();

    const building = buildingEl.value.trim();
    const room = roomEl.value.trim();
    const seat = seatEl.value.trim();
    const message = messageEl.value.trim();

    // Minimal validation for location info (usually required)
    if (!building || !room || seat === "") return;

    // Must have at least a selected concern OR a message
    if (!selectedConcern && !message) return;

    // Create a new ticket (demo behavior)
    tickets = [
        { room: room.toUpperCase(), seat: Number(seat), status: "Pending" },
        ...tickets
    ];
    renderTickets();
    resetForm();
    });

    cancelBtn.addEventListener("click", () => resetForm());

    // Initial render
    renderTickets();
})();

// function for keeping track of which dashboard to visit
function goToDashboard() {
        const role = localStorage.getItem('role');

        if (role === 'admin') {
            location.href = './admindashboard.html';
        } else {
            location.href = './dashboard.html';
        }
}