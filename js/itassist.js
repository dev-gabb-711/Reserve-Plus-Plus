/* =====================================================
   Ticket Form Logic (Scoped Module)
   - Encapsulates ticket UI behavior to avoid global conflicts
   ===================================================== */
(function () {
    /* -------------------------
       DOM References
       ------------------------- */
    const form = document.getElementById("ticketForm");
    const chipsWrap = document.getElementById("concernChips");
    const buildingEl = document.getElementById("building");
    const roomEl = document.getElementById("room");
    const seatEl = document.getElementById("seat");
    const messageEl = document.getElementById("message");
    const cancelBtn = document.getElementById("cancelBtn");
    const ticketsPane = document.getElementById("ticketsPane");

    /* -------------------------
       State
       ------------------------- */
    let selectedConcern = "";

    /* -------------------------
       Demo Data (replace later with API response)
       ------------------------- */
    let tickets = [
        { room: "G203", seat: 1, status: "Pending" },
        { room: "A1103", seat: 1, status: "Resolved" },
        { room: "A1103", seat: 1, status: "Resolved" },
        { room: "A1103", seat: 1, status: "Resolved" },
        { room: "A1103", seat: 1, status: "Resolved" },
        { room: "A1103", seat: 1, status: "Resolved" },
        { room: "A1103", seat: 1, status: "Resolved" },
    ];

    /* =====================================================
       Ticket Rendering Helpers
       ===================================================== */

    /**
     * Maps a ticket status string to a UI class used for styling.
     * - Pending/Open/Waiting => red
     * - Resolved/Closed/Done => green
     * - Anything else => purple
     */
    function statusToClass(status) {
        const s = (status || "").toLowerCase();
        if (s.includes("pending") || s.includes("open") || s.includes("waiting")) return "red";
        if (s.includes("resolved") || s.includes("closed") || s.includes("done")) return "green";
        return "purple";
    }

    /**
     * Returns the HTML string for a single ticket mini-card.
     */
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

    /**
     * Renders all tickets into the tickets panel.
     * Shows a fallback message if there are no tickets yet.
     */
    function renderTickets() {
        if (!tickets || tickets.length === 0) {
            ticketsPane.innerHTML = `<p class="mb-0" style="opacity:.75;">No tickets yet.</p>`;
            return;
        }
        ticketsPane.innerHTML = tickets.map(ticketCardHTML).join("");
    }


    /* =====================================================
       Form + Chip Utilities
       ===================================================== */

    /**
     * Clears selected concern and removes "active" styling from chips.
     */
    function clearChipSelection() {
        selectedConcern = "";
        chipsWrap.querySelectorAll(".chip.active").forEach(btn => btn.classList.remove("active"));
    }

    /**
     * Resets the form inputs and clears chip selection.
     */
    function resetForm() {
        form.reset();
        clearChipSelection();
    }


    /* =====================================================
       Concern Chips Interaction
       ===================================================== */

    /**
     * Handles chip selection/deselection.
     * - Clicking a chip selects it and deselects others
     * - Clicking an already active chip clears the selection
     */
    chipsWrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".chip");
        if (!btn) return;

        const concern = btn.dataset.concern || btn.textContent.trim();
        const isActive = btn.classList.contains("active");

        // Ensure only one chip is active at a time
        chipsWrap.querySelectorAll(".chip.active").forEach(b => b.classList.remove("active"));

        if (isActive) {
            selectedConcern = "";
        } else {
            btn.classList.add("active");
            selectedConcern = concern;
        }
    });


    /* =====================================================
       Form Submission
       ===================================================== */

    /**
     * Submission rule:
     * - Must have building + room + seat
     * - Must have at least (selectedConcern OR message) or both
     * - Adds a new "Pending" ticket (demo behavior)
     */
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


    /* =====================================================
       Cancel Button
       ===================================================== */

    /**
     * Cancels current input and restores default form state.
     */
    cancelBtn.addEventListener("click", () => resetForm());


    /* =====================================================
       Initial Render
       ===================================================== */

    renderTickets();
})();


/* =====================================================
   Dashboard Routing (Role-based Redirect)
   ===================================================== */

/**
 * Redirects the user to the correct dashboard page
 * based on the stored role in localStorage.
 */
function goToDashboard() {
    const role = localStorage.getItem('role');

    if (role === 'admin') {
        location.href = './admindashboard.html';
    } else {
        location.href = './dashboard.html';
    }
}
