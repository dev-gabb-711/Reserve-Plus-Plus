/* =====================================================
   DOM References
   ===================================================== */

const ticketGrid = document.getElementById('ticketGrid')

const filterBtn = document.getElementById('filterBtn')
const filterPop = document.getElementById('filterPop')
const applyFiltersBtn = document.getElementById('applyFiltersBtn')
const clearFiltersBtn = document.getElementById('clearFiltersBtn')

const buildingFilter = document.getElementById('buildingFilter')
const roomFilter = document.getElementById('roomFilter')
const categoryFilter = document.getElementById('categoryFilter')

/* =====================================================
   Helpers
   ===================================================== */

function escapeHtml (value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDate (dateString) {
  if (!dateString) return 'No date available'

  const date = new Date(dateString)

  if (isNaN(date.getTime())) return 'No date available'

  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function getTicketTitle (ticket, index) {
  return `Assistance Ticket ${index + 1}`
}

function getBuilding (ticket) {
  return ticket.lab?.building || 'Unknown Building'
}

function getRoom (ticket) {
  return ticket.lab?.labCode || 'Unknown Room'
}

function getSeat (ticket) {
  return ticket.seatNumber ? `Seat ${ticket.seatNumber}` : 'No Seat'
}

function getTicketSubtitle (ticket) {
  return `${getBuilding(ticket)} • ${getRoom(ticket)} • ${getSeat(ticket)}`
}

function getStudentName (ticket) {
  if (!ticket.user) return 'Unknown User'

  const firstName = ticket.user.firstName || ''
  const lastName = ticket.user.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim()

  return (
    fullName ||
    ticket.user.fullName ||
    ticket.user.name ||
    ticket.user.username ||
    ticket.user.email ||
    'Unknown User'
  )
}

function getStudentEmail (ticket) {
  return ticket.user?.email || 'No email available'
}

function getIssue (ticket) {
  return ticket.concernCategory || 'No issue category'
}

function getDescription (ticket) {
  return ticket.description && ticket.description.trim() !== ''
    ? ticket.description
    : 'No description provided.'
}

/* =====================================================
   Resolve Ticket (Fetch Check)
   ===================================================== */
document.addEventListener('click', async e => {
  if (e.target.classList.contains('resolve-btn')) {
    const btn = e.target
    const ticketId = btn.getAttribute('data-ticket-id')

    // Optional: disable button to prevent double-clicks
    btn.disabled = true
    btn.textContent = 'Resolving...'

    try {
      const response = await fetch(
        `/resolve-ticket/${encodeURIComponent(ticketId)}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json'
          }
        }
      )

      if (
        response.status === 401 ||
        (response.redirected && response.url.includes('/login'))
      ) {
        showToast({
          title: 'Session Expired',
          message: 'You need to re-log in. Redirecting...',
          variant: 'danger'
        })
        setTimeout(() => location.replace('/logout'), 2500)
        return
      }

      if (response.ok) {
        showToast({
          title: 'Success',
          message: 'Ticket marked as resolved!',
          variant: 'success'
        })
        setTimeout(() => location.reload(), 1000)
      } else {
        showToast({
          title: 'Error',
          message: 'Failed to resolve ticket.',
          variant: 'danger'
        })
        btn.disabled = false
        btn.textContent = 'Resolved'
      }
    } catch (err) {
      console.error(err)
      showToast({
        title: 'Error',
        message: 'Server error occurred.',
        variant: 'danger'
      })
      btn.disabled = false
      btn.textContent = 'Resolved'
    }
  }
})

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

function showToast ({
  title = 'Notice',
  message = '',
  variant = 'warning',
  delay = 3500
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
      border: 'rgba(231, 76, 60, 0.45)',
      iconClass: 'text-danger'
    },
    warning: {
      icon: 'warning',
      border: 'rgba(241, 196, 15, 0.45)',
      iconClass: 'text-warning'
    }
  }
  const conf = variantMap[variant] || variantMap.warning

  toastEl.className =
    'toast align-items-center text-white bg-dark border-0 mb-2'
  toastEl.style.borderLeft = `4px solid ${conf.border}`
  toastEl.style.minWidth = '250px'
  toastEl.setAttribute('role', 'alert')
  toastEl.setAttribute('aria-live', 'assertive')
  toastEl.setAttribute('aria-atomic', 'true')

  toastEl.innerHTML = `
    <div class="toast-header bg-dark text-white" style="border-bottom: 1px solid rgba(255,255,255,0.1);">
      <span class="material-symbols-rounded ${conf.iconClass} me-2" style="font-size: 1.2rem;">${conf.icon}</span>
      <strong class="me-auto">${title}</strong>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body" style="font-size: 0.9rem;">${message}</div>
  `

  container.appendChild(toastEl)
  const bsToast = new bootstrap.Toast(toastEl, { delay })
  bsToast.show()
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove())
}

/* =====================================================
   Ticket Data Source
   ===================================================== */

const ticketsFromScriptTag = (() => {
  const el = document.getElementById('ticketData')
  if (!el) return []

  try {
    const parsed = JSON.parse(el.textContent)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to parse ticketData JSON:', err)
    return []
  }
})()

const allTickets = ticketsFromScriptTag.filter(ticket => {
  return ticket.status === 'Unresolved' || !ticket.status
})

/* =====================================================
   Filters State
   ===================================================== */

let selectedFilters = {
  building: '',
  room: '',
  category: ''
}

/* =====================================================
   Populate Filter Options
   ===================================================== */

function getUniqueSortedValues (values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

function populateSelectOptions (selectEl, values, placeholder) {
  if (!selectEl) return

  selectEl.innerHTML = `<option value="">${placeholder}</option>`

  values.forEach(value => {
    const option = document.createElement('option')
    option.value = value
    option.textContent = value
    selectEl.appendChild(option)
  })
}

function populateFilterOptions () {
  const buildings = getUniqueSortedValues(
    allTickets.map(ticket => getBuilding(ticket))
  )
  const rooms = getUniqueSortedValues(allTickets.map(ticket => getRoom(ticket)))
  const categories = getUniqueSortedValues(
    allTickets.map(ticket => getIssue(ticket))
  )

  populateSelectOptions(buildingFilter, buildings, 'All Buildings')
  populateSelectOptions(roomFilter, rooms, 'All Rooms')
  populateSelectOptions(categoryFilter, categories, 'All Categories')
}

/* =====================================================
   Filter Logic
   ===================================================== */

function getFilteredTickets () {
  return allTickets.filter(ticket => {
    const buildingMatch =
      !selectedFilters.building ||
      getBuilding(ticket) === selectedFilters.building

    const roomMatch =
      !selectedFilters.room || getRoom(ticket) === selectedFilters.room

    const categoryMatch =
      !selectedFilters.category || getIssue(ticket) === selectedFilters.category

    return buildingMatch && roomMatch && categoryMatch
  })
}

/* =====================================================
   Ticket Rendering
   ===================================================== */

function renderTickets () {
  if (!ticketGrid) return

  const filteredTickets = getFilteredTickets()

  if (filteredTickets.length === 0) {
    ticketGrid.innerHTML = `
      <div class="ticket-card empty-state">
        <div class="ticket-head">
          <div class="t-title">No matching assistance tickets</div>
          <div class="t-sub">Try changing or clearing your filters.</div>
        </div>
      </div>
    `
    return
  }

  ticketGrid.innerHTML = filteredTickets
    .map((ticket, index) => {
      return `
        <div class="ticket-card">

          <div class="ticket-head">
            <div class="t-title">${escapeHtml(
              getTicketTitle(ticket, index)
            )}</div>
            <div class="t-sub">${escapeHtml(getTicketSubtitle(ticket))}</div>
          </div>

          <div class="ticket-line"></div>

          <div class="ticket-body">
            <div><span class="k">Lab User:</span> ${escapeHtml(
              getStudentName(ticket)
            )}</div>
            <div><span class="k">Email:</span> ${escapeHtml(
              getStudentEmail(ticket)
            )}</div>
            <div><span class="k">Issue:</span> ${escapeHtml(
              getIssue(ticket)
            )}</div>
            <div><span class="k">Status:</span> ${escapeHtml(
              ticket.status || 'Unresolved'
            )}</div>
            <div><span class="k">Description:</span> ${escapeHtml(
              getDescription(ticket)
            )}</div>
            <div><span class="k">Submitted:</span> ${escapeHtml(
              formatDate(ticket.createdAt)
            )}</div>
          </div>

          <div class="ticket-actions">
            <button class="pill-btn resolve-btn" data-ticket-id="${
              ticket._id
            }">Resolved</button>
          </div>

        </div>
      `
    })
    .join('')
}

/* =====================================================
   Filter Popup Events
   ===================================================== */

function openFilterPopup () {
  if (!filterPop) return
  filterPop.hidden = false
}

function closeFilterPopup () {
  if (!filterPop) return
  filterPop.hidden = true
}

if (filterBtn) {
  filterBtn.addEventListener('click', event => {
    event.stopPropagation()

    if (filterPop.hidden) {
      openFilterPopup()
    } else {
      closeFilterPopup()
    }
  })
}

if (applyFiltersBtn) {
  applyFiltersBtn.addEventListener('click', () => {
    selectedFilters.building = buildingFilter?.value || ''
    selectedFilters.room = roomFilter?.value || ''
    selectedFilters.category = categoryFilter?.value || ''

    renderTickets()
    closeFilterPopup()
  })
}

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener('click', () => {
    selectedFilters = {
      building: '',
      room: '',
      category: ''
    }

    if (buildingFilter) buildingFilter.value = ''
    if (roomFilter) roomFilter.value = ''
    if (categoryFilter) categoryFilter.value = ''

    renderTickets()
    closeFilterPopup()
  })
}

document.addEventListener('click', event => {
  if (!filterPop || !filterBtn) return

  const clickedInsidePopup = filterPop.contains(event.target)
  const clickedFilterButton = filterBtn.contains(event.target)

  if (!clickedInsidePopup && !clickedFilterButton && !filterPop.hidden) {
    closeFilterPopup()
  }
})

/* =====================================================
   DYNAMIC FILTER POPULATION (IT Assist Admin)
   ===================================================== */
function populateTicketFilters () {
  const bldFilter = document.getElementById('buildingFilter')
  const roomFilter = document.getElementById('roomFilter')
  const catFilter = document.getElementById('categoryFilter')

  if (!bldFilter || !roomFilter || !catFilter) return

  const rawDataEl = document.getElementById('ticketData')
  let tickets = []
  if (rawDataEl) {
    try {
      tickets = JSON.parse(rawDataEl.textContent || '[]')
    } catch (err) {
      console.error('Failed to parse ticket data.')
    }
  }

  const buildings = new Set()
  const rooms = new Set()
  const categories = new Set()

  // 1. ALWAYS load all buildings and rooms from the main database
  if (typeof window.DB_LABS !== 'undefined') {
    window.DB_LABS.forEach(lab => {
      if (lab.building) buildings.add(lab.building)
      if (lab.labCode) rooms.add(lab.labCode)
    })
  }

  // 2. Also check tickets to get legacy rooms and ticket Categories
  tickets.forEach(ticket => {
    if (ticket.building) buildings.add(ticket.building)
    if (ticket.room) rooms.add(ticket.room)
    if (ticket.category) categories.add(ticket.category)
  })

  // 3. Inject options
  buildings.forEach(bld => bldFilter.appendChild(new Option(bld, bld)))
  rooms.forEach(room => roomFilter.appendChild(new Option(room, room)))
  categories.forEach(cat => catFilter.appendChild(new Option(cat, cat)))
}

// Run the function immediately
populateTicketFilters()

/* =====================================================
   Init
   ===================================================== */

populateFilterOptions()
renderTickets()
