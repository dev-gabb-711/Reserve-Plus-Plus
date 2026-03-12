/* =====================================================
   Avatar Utility
   - Generates a simple SVG avatar fallback using a given color
   - Used only when no real avatar is available
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
   State
   - notifications: all notifications fetched from backend
   - selectedID: currently selected notification id
   ===================================================== */
let notifications = [];
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
 * Resets the right panel into a true empty state.
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

  markNotificationAsRead(n.id);
}

/* =====================================================
   Helpers
   ===================================================== */

/**
 * Returns a fallback avatar color based on notification type.
 */
function getFallbackAvatar(type) {
  if (type === "IT Assist") return makeAvatar("purple");
  if (type === "Reservation") return makeAvatar("teal");
  return makeAvatar("blue");
}

/**
 * Normalizes backend notification data into the structure
 * expected by this page.
 */
function normalizeNotification(n) {
  const type = n.type || "System";

  return {
    id: String(n._id || n.id),
    name: n.senderName || type || "System",
    role: n.senderRole || type || "System",
    snippet: n.message || n.snippet || "",
    body: n.message || n.body || "",
    avatar: n.senderAvatar || getFallbackAvatar(type),
    type: type,
    isRead: !!n.isRead
  };
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

  if (!list.length) {
    notifList.innerHTML = `
      <div class="notif-empty">
        No notifications found.
      </div>
    `;
    return;
  }

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
      renderNotifications(getFilteredNotifications());
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
  const n = notifications.find(function (x) {
    return x.id === String(id);
  });

  if (!n) return;

  showDetail(n);
}

/* =====================================================
   API Calls
   ===================================================== */

/**
 * Fetches notifications for the logged-in user.
 */
async function fetchNotifications() {
  try {
    const response = await fetch("/api/notifications/me");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch notifications");
    }

    notifications = data.map(normalizeNotification);
    renderNotifications(getFilteredNotifications());
    showEmptyDetail();
  } catch (error) {
    console.error("Error fetching notifications:", error);

    notifications = [];
    renderNotifications([]);
    showEmptyDetail();
  }
}

/**
 * Deletes a notification from the database.
 */
async function deleteNotification(id) {
  try {
    const response = await fetch(`/api/notifications/${id}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete notification");
    }

    notifications = notifications.filter(function (x) {
      return x.id !== String(id);
    });

    renderNotifications(getFilteredNotifications());
    showEmptyDetail();
  } catch (error) {
    console.error("Error deleting notification:", error);
    alert("Failed to delete notification.");
  }
}

/**
 * Marks a notification as read in the database.
 */
async function markNotificationAsRead(id) {
  try {
    await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH"
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

/* =====================================================
   Search / Filter
   ===================================================== */

/**
 * Returns notifications filtered by the search box text.
 */
function getFilteredNotifications() {
  const text = searchInput.value.trim().toLowerCase();

  if (!text) return notifications;

  return notifications.filter(function (n) {
    return (
      n.name.toLowerCase().includes(text) ||
      n.role.toLowerCase().includes(text) ||
      n.snippet.toLowerCase().includes(text) ||
      n.body.toLowerCase().includes(text)
    );
  });
}

searchInput.oninput = function () {
  renderNotifications(getFilteredNotifications());
};

/* =====================================================
   Actions: Remove + Cancel Selection
   ===================================================== */

/**
 * Removes the currently selected notification from the database,
 * then resets the detail panel.
 */
removeBtn.onclick = function () {
  if (selectedID == null) return;
  deleteNotification(selectedID);
};

/**
 * Clears selection and resets the detail panel to empty state.
 */
cancelBtn.onclick = function () {
  showEmptyDetail();
  renderNotifications(getFilteredNotifications());
};

/* =====================================================
   Initial Render
   ===================================================== */
showEmptyDetail();
fetchNotifications();