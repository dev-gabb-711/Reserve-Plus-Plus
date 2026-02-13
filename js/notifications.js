/* =====================================================
   Avatar Utility (Demo Placeholder)
   - Generates a simple SVG avatar using a given color
   - Replace with real profile images later
   ===================================================== */
function makeAvatar(color) {
  return `
  data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>
    <rect width='100' height='100' rx='50' fill='${color}'/>
    <circle cx='50' cy='40' r='15' fill='white'/>
    <rect x='30' y='55' width='40' height='25' rx='12' fill='white'/>
  </svg>
  `;
}


/* =====================================================
   Notifications Data (Demo Content)
   - Replace with API/database data later
   ===================================================== */
let notifications = [
  {
    id: 1,
    name: "IT Assist",
    role: "Lab Technician",
    snippet: "PC Concern has been resolved",
    body: "Your PC concern has been successfully resolved.",
    avatar: makeAvatar("purple")
  },
  {
    id: 2,
    name: "Reserve++ Team",
    role: "System",
    snippet: "Please answer this survey",
    body: "Please answer the feedback survey.",
    avatar: makeAvatar("blue")
  },
  {
    id: 3,
    name: "Room A1103 • Seat 1",
    role: "Reservation",
    snippet: "Reservation cancelled successfully",
    body: "Your reservation has been cancelled.",
    avatar: makeAvatar("teal")
  }
];


/* =====================================================
   State
   - Stores which notification is currently selected
   ===================================================== */
let selectedID = null;


/* =====================================================
   DOM References
   ===================================================== */
const notifList = document.getElementById("notifList");

const detailHead = document.getElementById("detailHead");
const detailAvatar = document.getElementById("detailAvatar");
const detailTitle = document.getElementById("detailTitle");
const detailRole = document.getElementById("detailRole");

const detailDivider = document.getElementById("detailDivider");
const detailBody = document.getElementById("detailBody");
const detailActions = document.getElementById("detailActions");

const searchInput = document.getElementById("searchInput");
const removeBtn = document.getElementById("removeBtn");
const cancelBtn = document.getElementById("cancelBtn");


/* =====================================================
   Detail Panel States
   ===================================================== */

/**
 * Resets the right panel into a true "empty" state.
 * - No header, no divider, no buttons, no avatar
 * - Only shows the empty message
 */
function showEmptyDetail() {
  selectedID = null;

  detailHead.classList.add("is-hidden");
  detailDivider.classList.add("is-hidden");
  detailActions.classList.add("is-hidden");

  detailBody.classList.add("is-empty");
  detailBody.innerText = "Your notifications will appear here";
}

/**
 * Loads a notification into the right panel.
 * - Restores header, divider, and buttons
 */
function showDetail(n) {
  selectedID = n.id;

  detailHead.classList.remove("is-hidden");
  detailDivider.classList.remove("is-hidden");
  detailActions.classList.remove("is-hidden");

  detailBody.classList.remove("is-empty");

  detailAvatar.src = n.avatar;
  detailTitle.innerText = n.name;
  detailRole.innerText = n.role;
  detailBody.innerText = n.body;
}


/* =====================================================
   Rendering
   ===================================================== */

/**
 * Renders the notification list in the left panel.
 * Highlights the currently selected notification.
 */
function renderNotifications(list) {
  notifList.innerHTML = "";

  list.forEach(function (n) {
    const item = document.createElement("div");
    item.className = "notif-item" + (n.id === selectedID ? " active" : "");

    item.innerHTML = `
      <img src="${n.avatar}" class="avatar" alt="">
      <div>
        <div class="notif-name">${n.name}</div>
        <div class="notif-snippet">${n.snippet}</div>
      </div>
    `;

    item.onclick = function () {
      selectNotification(n.id);
      renderNotifications(list);
    };

    notifList.appendChild(item);
  });
}


/* =====================================================
   Selection Logic
   ===================================================== */

/**
 * Loads the selected notification details into the right panel.
 */
function selectNotification(id) {
  const n = notifications.find(x => x.id === id);
  if (!n) return;

  showDetail(n);
}


/* =====================================================
   Actions: Remove + Cancel Selection
   ===================================================== */

/**
 * Removes the currently selected notification from the list,
 * then returns to the empty detail state.
 */
removeBtn.onclick = function () {
  if (selectedID == null) return;

  notifications = notifications.filter(x => x.id !== selectedID);
  renderNotifications(notifications);

  showEmptyDetail();
};

/**
 * Clears selection and resets the detail panel to empty state.
 */
cancelBtn.onclick = function () {
  showEmptyDetail();
};


/* =====================================================
   Search / Filter
   ===================================================== */

/**
 * Filters notifications by name (case-insensitive).
 * Renders only matching results in the list.
 */
searchInput.oninput = function () {
  const text = this.value.toLowerCase();

  const filtered = notifications.filter(n =>
    n.name.toLowerCase().includes(text)
  );

  renderNotifications(filtered);
};


/* =====================================================
   Initial Render
   ===================================================== */

renderNotifications(notifications);
showEmptyDetail();


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
