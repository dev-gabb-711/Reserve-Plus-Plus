/* =====================================================
   Ticket Form Logic (Scoped Module)
   - Handles ticket UI, database-driven dropdowns,
     submission, and loading from backend
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
    let tickets = [];
    let labs = [];

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
                    <strong>Room ${t.roomNumber} • Seat ${t.seatNumber}</strong>
                    <p>${t.status || "Pending"}</p>
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
       Dropdown Helpers
       ===================================================== */

    /**
     * Fills a select element with placeholder + options.
     */
    function fillSelect(selectEl, placeholder, values) {
        if (!selectEl) return;

        selectEl.innerHTML = `
            <option value="" selected disabled>${placeholder}</option>
        `;

        values.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            selectEl.appendChild(option);
        });

        selectEl.value = "";
    }

    /**
     * Loads unique building values from labs into the building dropdown.
     */
    function populateBuildingOptions() {
        const uniqueBuildings = [...new Set(labs.map(lab => lab.building))];
        fillSelect(buildingEl, "Select building...", uniqueBuildings);
        fillSelect(roomEl, "Select room...", []);
        fillSelect(seatEl, "Select seat...", []);
        roomEl.disabled = true;
        seatEl.disabled = true;
    }

    /**
     * Loads room options based on selected building.
     */
    function populateRoomOptions(building) {
        const filteredLabs = labs.filter(lab => lab.building === building);
        const roomCodes = filteredLabs.map(lab => lab.labCode);

        fillSelect(roomEl, "Select room...", roomCodes);
        fillSelect(seatEl, "Select seat...", []);
        roomEl.disabled = false;
        seatEl.disabled = true;
    }

    /**
     * Loads seat options based on selected room.
     */
    function populateSeatOptions(building, roomCode) {
        const selectedLab = labs.find(
            lab => lab.building === building && lab.labCode === roomCode
        );

        const seatNumbers = selectedLab
            ? (selectedLab.seats || []).map(seat => seat.seatNumber)
            : [];

        fillSelect(seatEl, "Select seat...", seatNumbers);
        seatEl.disabled = false;
    }

    /* =====================================================
       Form + Chip Utilities
       ===================================================== */

    /**
     * Clears selected concern and removes active styling from chips.
     */
    function clearChipSelection() {
        selectedConcern = "";
        chipsWrap.querySelectorAll(".chip.active").forEach(btn => btn.classList.remove("active"));
    }

    /**
     * Resets the form inputs and clears chip selection.
     * Also resets dependent dropdowns.
     */
    function resetForm() {
        form.reset();
        clearChipSelection();
        populateBuildingOptions();
    }

    /* =====================================================
       Backend Communication
       ===================================================== */

    /**
     * Fetches available labs from the backend.
     */
    async function fetchLabs() {
        try {
            const response = await fetch("/api/labs");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch labs");
            }

            labs = data || [];
            populateBuildingOptions();
        } catch (error) {
            console.error("Error fetching labs:", error);

            if (buildingEl) buildingEl.disabled = true;
            if (roomEl) roomEl.disabled = true;
            if (seatEl) seatEl.disabled = true;
        }
    }

    /**
     * Fetches the current user's tickets from the backend.
     */
    async function fetchTickets() {
        try {
            const response = await fetch("/api/tickets/me");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch tickets");
            }

            tickets = data;
            renderTickets();
        } catch (error) {
            console.error("Error fetching tickets:", error);
            ticketsPane.innerHTML = `<p class="mb-0" style="opacity:.75;">Failed to load tickets.</p>`;
        }
    }

    /**
     * Submits a new ticket to the backend.
     */
    async function submitTicket(payload) {
        const response = await fetch("/submit-ticket", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to submit ticket");
        }

        return data;
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

        chipsWrap.querySelectorAll(".chip.active").forEach(b => b.classList.remove("active"));

        if (isActive) {
            selectedConcern = "";
        } else {
            btn.classList.add("active");
            selectedConcern = concern;
        }
    });

    /* =====================================================
       Dropdown Interactions
       ===================================================== */

    buildingEl.addEventListener("change", () => {
        const building = buildingEl.value;
        if (!building) return;

        populateRoomOptions(building);
    });

    roomEl.addEventListener("change", () => {
        const building = buildingEl.value;
        const room = roomEl.value;

        if (!building || !room) return;

        populateSeatOptions(building, room);
    });

    /* =====================================================
       Form Submission
       ===================================================== */

    /**
     * Submission rule:
     * - Must have building + room + seat
     * - Must have at least selectedConcern OR message
     * - Submits to backend and reloads the ticket list
     */
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const building = buildingEl.value.trim();
        const room = roomEl.value.trim();
        const seat = seatEl.value.trim();
        const message = messageEl.value.trim();

        if (!building || !room || !seat) {
            alert("Please complete the building, room, and seat fields.");
            return;
        }

        if (!selectedConcern && !message) {
            alert("Please select a concern or enter a message.");
            return;
        }

        try {
            await submitTicket({
                building,
                room,
                seat,
                concern: selectedConcern,
                message
            });

            await fetchTickets();
            resetForm();
            alert("Concern submitted successfully.");
        } catch (error) {
            console.error("Submit error:", error);
            alert(error.message || "Failed to submit concern.");
        }
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
    roomEl.disabled = true;
    seatEl.disabled = true;

    fetchLabs();
    fetchTickets();
})();

/* =====================================================
   Controls the Navigation of Faq Modal
   ===================================================== */

/**
 * Lets the user click and scroll through the FAQ modal
 * that contains FAQs
 */
function openFaqModal() {
    const modal = document.getElementById("faqModal");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeFaqModal() {
    const modal = document.getElementById("faqModal");
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}

window.onclick = function (event) {
    const modal = document.getElementById("faqModal");
    if (event.target == modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
};