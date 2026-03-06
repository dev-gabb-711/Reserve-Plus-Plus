/* =====================================================
   DOM Reference
   ===================================================== */

const ticketGrid = document.getElementById("ticketGrid");


/* =====================================================
   Static Ticket Data (Demo Content)
   - Replace with API/database data later
   ===================================================== */

const tickets = [
    { title:"Assistance Ticket 1", sub:"A1103 • Seat 1", issue:"PC Unresponsive", status:"Unresolved", priority:"1" },
    { title:"Assistance Ticket 1", sub:"A1103 • Seat 1", issue:"PC Unresponsive", status:"Unresolved", priority:"1" },
    { title:"Assistance Ticket 1", sub:"A1103 • Seat 1", issue:"PC Unresponsive", status:"Unresolved", priority:"1" },
    { title:"Assistance Ticket 1", sub:"A1103 • Seat 1", issue:"PC Unresponsive", status:"Unresolved", priority:"1" },
    { title:"Assistance Ticket 1", sub:"A1103 • Seat 1", issue:"PC Unresponsive", status:"Unresolved", priority:"1" },
    { title:"Assistance Ticket 1", sub:"A1103 • Seat 1", issue:"PC Unresponsive", status:"Unresolved", priority:"1" }
];


/* =====================================================
   Ticket Rendering
   - Dynamically generates ticket cards inside ticketGrid
   ===================================================== */

ticketGrid.innerHTML = tickets.map(t => `
    <div class="ticket-card">

        <div class="ticket-head">
            <div class="t-title">${t.title}</div>
            <div class="t-sub">${t.sub}</div>
        </div>

        <div class="ticket-line"></div>

        <div class="ticket-body">
            <div><span class="k">Issue :</span> ${t.issue}</div>
            <div><span class="k">Status:</span> ${t.status}</div>
            <div><span class="k">Priority Level:</span> ${t.priority}</div>
        </div>

        <div class="ticket-actions">
            <button class="pill-btn" type="button">Resolved</button>
        </div>

    </div>
`).join("");


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
        location.href = './admindashboard';
    } else {
        location.href = './dashboard';
    }
}
