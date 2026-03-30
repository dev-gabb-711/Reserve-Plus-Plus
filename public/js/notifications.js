/* =====================================================
   Toast Helpers
   ===================================================== */
function getToastContainer () {
  let container = document.getElementById('toastContainer')

  if (!container) {
    container = document.createElement('div')
    container.id = 'toastContainer'
    container.className = 'toast-container position-fixed top-0 end-0 p-3'
    container.style.zIndex = '1085'
    document.body.appendChild(container)
  }

  return container
}

function escapeHtmlToast (value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function showToast ({
  title = 'Notice',
  message = '',
  variant = 'warning',
  delay = 3500,
  autohide = true
} = {}) {
  const container = getToastContainer()
  const toastEl = document.createElement('div')

  const variantMap = {
    success: {
      icon: 'check_circle',
      border: 'rgba(46, 204, 113, 0.45)',
      iconClass: 'text-success'
    },
    danger: {
      icon: 'error',
      border: 'rgba(255, 107, 74, 0.45)',
      iconClass: 'text-danger'
    },
    warning: {
      icon: 'warning',
      border: 'rgba(255, 193, 7, 0.45)',
      iconClass: 'text-warning'
    },
    info: {
      icon: 'info',
      border: 'rgba(90, 169, 255, 0.45)',
      iconClass: 'text-info'
    }
  }

  const tone = variantMap[variant] || variantMap.warning

  toastEl.className = 'toast border-0 text-white'
  toastEl.setAttribute('role', 'alert')
  toastEl.setAttribute('aria-live', 'assertive')
  toastEl.setAttribute('aria-atomic', 'true')
  toastEl.dataset.bsAutohide = String(autohide)
  toastEl.dataset.bsDelay = String(delay)
  toastEl.style.background = 'rgba(18,18,18,0.95)'
  toastEl.style.border = `1px solid ${tone.border}`
  toastEl.style.backdropFilter = 'blur(12px)'
  toastEl.style.boxShadow = '0 8px 24px rgba(0,0,0,0.28)'

  toastEl.innerHTML = `
    <div
      class="toast-header text-white border-0"
      style="background:transparent; position:relative; padding-right:2.5rem;"
    >
      <span class="material-symbols-rounded me-2 mt-1 ${tone.iconClass}">${
    tone.icon
  }</span>
      <strong class="me-auto mt-1">${escapeHtmlToast(title)}</strong>
      <button
        type="button"
        class="btn-close btn-close-white"
        data-bs-dismiss="toast"
        aria-label="Close"
        style="position:absolute; top:0.7rem; right:0.75rem; margin:0;"
      ></button>
    </div>
    <div class="toast-body pt-0">${escapeHtmlToast(message)}</div>
  `

  container.appendChild(toastEl)

  const toast = bootstrap.Toast.getOrCreateInstance(toastEl, {
    autohide,
    delay
  })

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove()
  })

  toast.show()
  return toastEl
}

/* =====================================================
   Avatar Utility
   - Generates a simple SVG avatar fallback using a given color
   - Used only when no real avatar is available
   ===================================================== */
function makeAvatar (color) {
  return `
  data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>
    <rect width='100' height='100' rx='50' fill='${color}'/>
    <circle cx='50' cy='40' r='15' fill='white'/>
    <rect x='30' y='55' width='40' height='25' rx='12' fill='white'/>
  </svg>
  `
}

/* =====================================================
   State
   - notifications: all notifications fetched from backend
   - selectedID: currently selected notification id
   ===================================================== */
let notifications = []
let selectedID = null

/* =====================================================
   DOM References
   ===================================================== */
const notifList = document.getElementById('notifList')

const detailHead = document.getElementById('detailHead')
const detailAvatar = document.getElementById('detailAvatar')
const detailTitle = document.getElementById('detailTitle')
const detailRole = document.getElementById('detailRole')

const detailDivider = document.getElementById('detailDivider')
const detailBody = document.getElementById('detailBody')
const detailActions = document.getElementById('detailActions')

const searchInput = document.getElementById('searchInput')
const removeBtn = document.getElementById('removeBtn')
const cancelBtn = document.getElementById('cancelBtn')

/* =====================================================
   Detail Panel States
   ===================================================== */

/**
 * Resets the right panel into a true empty state.
 */
function showEmptyDetail () {
  selectedID = null

  detailHead.classList.add('is-hidden')
  detailDivider.classList.add('is-hidden')
  detailActions.classList.add('is-hidden')

  detailBody.classList.add('is-empty')
  detailBody.innerText = 'Your notifications will appear here'
}

/**
 * Loads a notification into the right panel.
 */
function showDetail (n) {
  selectedID = n.id

  detailHead.classList.remove('is-hidden')
  detailDivider.classList.remove('is-hidden')
  detailActions.classList.remove('is-hidden')

  detailBody.classList.remove('is-empty')

  detailAvatar.src = n.avatar
  detailTitle.innerText = n.name
  detailRole.innerText = n.role
  detailBody.innerText = n.body

  markNotificationAsRead(n.id)
}

/* =====================================================
   Helpers
   ===================================================== */

/**
 * Returns a fallback avatar color based on notification type.
 */
function getFallbackAvatar (type) {
  if (type === 'IT Assist') return makeAvatar('purple')
  if (type === 'Reservation') return makeAvatar('teal')
  return makeAvatar('blue')
}

/**
 * Normalizes backend notification data into the structure
 * expected by this page.
 */
function normalizeNotification (n) {
  const type = n.type || 'System'

  return {
    id: String(n._id || n.id),
    name: n.senderName || type || 'System',
    role: n.senderRole || type || 'System',
    snippet: n.message || n.snippet || '',
    body: n.message || n.body || '',
    avatar: n.senderAvatar || getFallbackAvatar(type),
    type,
    isRead: !!n.isRead
  }
}

/* =====================================================
   Rendering
   ===================================================== */

/**
 * Renders the notification list in the left panel.
 * Highlights the currently selected notification.
 */
function renderNotifications (list) {
  notifList.innerHTML = ''

  if (!list.length) {
    notifList.innerHTML = `
      <div class="notif-empty">
        No notifications found.
      </div>
    `
    return
  }

  list.forEach(function (n) {
    const item = document.createElement('div')
    item.className = 'notif-item' + (n.id === selectedID ? ' active' : '')

    item.innerHTML = `
      <div class="avatar-container">
        <img src="${n.avatar}" class="avatar" alt="">
        ${!n.isRead ? '<span class="unread-badge"></span>' : ''}
      </div>
      <div>
        <div class="notif-name">${n.name}</div>
        <div class="notif-snippet">${n.snippet}</div>
      </div>
    `

    item.onclick = async function () {
      const success = await markNotificationAsRead(n.id)

      if (success === 'ZOMBIE') return

      n.isRead = true
      selectNotification(n.id)
      renderNotifications(getFilteredNotifications())
    }

    notifList.appendChild(item)
  })
}

/* =====================================================
   Selection Logic
   ===================================================== */

/**
 * Loads the selected notification details into the right panel.
 */
function selectNotification (id) {
  const n = notifications.find(function (x) {
    return x.id === String(id)
  })

  if (!n) return

  // NOTE: Removed the markNotificationAsRead() call from inside showDetail()
  showDetail(n)
}

/* =====================================================
   API Calls
   ===================================================== */

/**
 * Fetches notifications for the logged-in user.
 */
async function fetchNotifications () {
  try {
    const response = await fetch('/api/notifications/me', {
      headers: { Accept: 'application/json' }
    })

    if (
      response.status === 401 ||
      (response.redirected && response.url.includes('/login'))
    ) {
      showToast({
        title: 'Session Expired',
        message: 'You need to re-log in. Redirecting...',
        variant: 'danger'
      })
      setTimeout(() => location.replace('/login'), 2500)
      return
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch notifications')
    }

    notifications = data.map(normalizeNotification)
    renderNotifications(getFilteredNotifications())
    showEmptyDetail()
  } catch (error) {
    console.error('Error fetching notifications:', error)
    if (error.message !== 'Session Expired') {
      notifications = []
      renderNotifications([])
      showEmptyDetail()
    }
  }
}

/**
 * Deletes a notification from the database.
 */
async function deleteNotification (id) {
  try {
    const response = await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' }
    })

    // ZOMBIE TAB CHECK
    if (
      response.status === 401 ||
      (response.redirected && response.url.includes('/login'))
    ) {
      showToast({
        title: 'Session Expired',
        message: 'You need to re-log in. Redirecting...',
        variant: 'danger'
      })
      setTimeout(() => location.replace('/login'), 2500)
      return
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete notification')
    }

    notifications = notifications.filter(function (x) {
      return x.id !== String(id)
    })

    renderNotifications(getFilteredNotifications())
    showEmptyDetail()
    showToast({
      title: 'Deleted',
      message: 'Notification removed.',
      variant: 'success'
    })
  } catch (error) {
    console.error('Error deleting notification:', error)
    if (error.message !== 'Session Expired') {
      showToast({
        title: 'Delete failed',
        message: 'Failed to delete notification.',
        variant: 'danger'
      })
    }
  }
}

/**
 * Marks a notification as read in the database.
 */
async function markNotificationAsRead (id) {
  try {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Accept: 'application/json' }
    })

    if (
      response.status === 401 ||
      (response.redirected && response.url.includes('/login'))
    ) {
      showToast({
        title: 'Session Expired',
        message: 'You need to re-log in. Redirecting...',
        variant: 'danger'
      })
      setTimeout(() => location.replace('/login'), 2500)
      return 'ZOMBIE'
    }

    return response.ok
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

/* =====================================================
   Search / Filter
   ===================================================== */

/**
 * Returns notifications filtered by the search box text.
 */
function getFilteredNotifications () {
  const text = searchInput.value.trim().toLowerCase()

  if (!text) return notifications

  return notifications.filter(function (n) {
    return (
      n.name.toLowerCase().includes(text) ||
      n.role.toLowerCase().includes(text) ||
      n.snippet.toLowerCase().includes(text) ||
      n.body.toLowerCase().includes(text)
    )
  })
}

searchInput.oninput = function () {
  renderNotifications(getFilteredNotifications())
}

/* =====================================================
   Actions: Remove + Cancel Selection
   ===================================================== */

/**
 * Removes the currently selected notification from the database,
 * then resets the detail panel.
 */
removeBtn.onclick = function () {
  if (selectedID == null) return
  deleteNotification(selectedID)
}

/**
 * Clears selection and resets the detail panel to empty state.
 */
cancelBtn.onclick = function () {
  showEmptyDetail()
  renderNotifications(getFilteredNotifications())
}

/* =====================================================
   Initial Render
   ===================================================== */
showEmptyDetail()
fetchNotifications()
