/* =====================================================
   Ticket Form Logic (Scoped Module)
   - Handles ticket UI, database-driven dropdowns,
     submission, and loading from backend
   ===================================================== */
(function () {
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
        <span class="material-symbols-rounded me-2 mt-1 ${tone.iconClass}">${tone.icon}</span>
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

  /* -------------------------
     DOM References
     ------------------------- */
  const form = document.getElementById('ticketForm')
  const chipsWrap = document.getElementById('concernChips')
  const buildingEl = document.getElementById('building')
  const roomEl = document.getElementById('room')
  const seatEl = document.getElementById('seat')
  const messageEl = document.getElementById('message')
  const cancelBtn = document.getElementById('cancelBtn')
  const ticketsPane = document.getElementById('ticketsPane')

  /* -------------------------
     State
     ------------------------- */
  let selectedConcern = ''
  let tickets = []
  let labs = []

  /* =====================================================
     Ticket Rendering Helpers
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

  function formatDateTime (dateString) {
    if (!dateString) return 'No date available'

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'No date available'

    return date.toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  function statusToClass (status) {
    const s = (status || '').toLowerCase()

    if (s.includes('resolved')) return 'green'
    if (s.includes('unresolved')) return 'red'
    return 'purple'
  }

  function getRoomLabel (ticket) {
    return ticket.lab?.labCode || 'Unknown Room'
  }

  function getBuildingLabel (ticket) {
    return ticket.lab?.building || 'Unknown Building'
  }

  function getTicketStatus (ticket) {
    return ticket.status || 'Unresolved'
  }

  function getTicketIssue (ticket) {
    return ticket.concernCategory || 'Other'
  }

  function ticketCardHTML (ticket) {
    const cls = statusToClass(ticket.status)
    const room = getRoomLabel(ticket)
    const building = getBuildingLabel(ticket)
    const seat = ticket.seatNumber || 'N/A'
    const status = getTicketStatus(ticket)
    const issue = getTicketIssue(ticket)
    const submitted = formatDateTime(ticket.createdAt)

    return `
      <div class="mini-card ${cls}">
        <div class="info">
          <strong>${escapeHtml(building)} • ${escapeHtml(room)} • Seat ${escapeHtml(seat)}</strong>
          <p><span class="mini-label">Issue:</span> ${escapeHtml(issue)}</p>
          <p><span class="mini-label">Status:</span> ${escapeHtml(status)}</p>
          <p><span class="mini-label">Submitted:</span> ${escapeHtml(submitted)}</p>
        </div>
      </div>
    `.trim()
  }

  function renderTickets () {
    if (!ticketsPane) return

    if (!tickets || tickets.length === 0) {
      ticketsPane.innerHTML = `<p class="mb-0" style="opacity:.75;">No tickets yet.</p>`
      return
    }

    ticketsPane.innerHTML = tickets.map(ticketCardHTML).join('')
  }

  /* =====================================================
     Dropdown Helpers
     ===================================================== */

  function fillSelect (selectEl, placeholder, values) {
    if (!selectEl) return

    selectEl.innerHTML = `<option value="" selected disabled>${placeholder}</option>`

    values.forEach(value => {
      const option = document.createElement('option')
      option.value = value
      option.textContent = value
      selectEl.appendChild(option)
    })

    selectEl.value = ''
  }

  function populateBuildingOptions () {
    const uniqueBuildings = [...new Set(labs.map(lab => lab.building))]

    fillSelect(buildingEl, 'Select building...', uniqueBuildings)
    fillSelect(roomEl, 'Select room...', [])
    fillSelect(seatEl, 'Select seat...', [])

    roomEl.disabled = true
    seatEl.disabled = true
  }

  function populateRoomOptions (building) {
    const filteredLabs = labs.filter(lab => lab.building === building)
    const roomCodes = filteredLabs.map(lab => lab.labCode)

    fillSelect(roomEl, 'Select room...', roomCodes)
    fillSelect(seatEl, 'Select seat...', [])

    roomEl.disabled = false
    seatEl.disabled = true
  }

  function populateSeatOptions (building, roomCode) {
    const selectedLab = labs.find(
      lab => lab.building === building && lab.labCode === roomCode
    )

    const seatNumbers = selectedLab
      ? (selectedLab.seats || []).map(seat => seat.seatNumber)
      : []

    fillSelect(seatEl, 'Select seat...', seatNumbers)
    seatEl.disabled = false
  }

  /* =====================================================
     Form + Chip Utilities
     ===================================================== */

  function clearChipSelection () {
    selectedConcern = ''
    if (!chipsWrap) return

    chipsWrap
      .querySelectorAll('.chip.active')
      .forEach(btn => btn.classList.remove('active'))
  }

  function resetForm () {
    if (form) form.reset()
    clearChipSelection()
    populateBuildingOptions()

    if (messageEl) messageEl.value = ''
  }

  /* =====================================================
     Backend Communication
     ===================================================== */

  async function fetchLabs () {
    try {
      const response = await fetch('/api/labs')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch labs')
      }

      labs = Array.isArray(data) ? data : []
      populateBuildingOptions()
    } catch (error) {
      console.error('Error fetching labs:', error)

      if (buildingEl) buildingEl.disabled = true
      if (roomEl) roomEl.disabled = true
      if (seatEl) seatEl.disabled = true
    }
  }

  async function fetchTickets () {
    try {
      const response = await fetch('/api/tickets/me')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tickets')
      }

      tickets = Array.isArray(data) ? data : []
      renderTickets()
    } catch (error) {
      console.error('Error fetching tickets:', error)

      if (ticketsPane) {
        ticketsPane.innerHTML = `<p class="mb-0" style="opacity:.75;">Failed to load tickets.</p>`
      }
    }
  }

  async function submitTicket (payload) {
    const response = await fetch('/submit-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit ticket')
    }

    return data
  }

  /* =====================================================
     Concern Chips Interaction
     ===================================================== */

  if (chipsWrap) {
    chipsWrap.addEventListener('click', e => {
      const btn = e.target.closest('.chip')
      if (!btn) return

      const concern = btn.dataset.concern || btn.textContent.trim()
      const isActive = btn.classList.contains('active')

      chipsWrap
        .querySelectorAll('.chip.active')
        .forEach(b => b.classList.remove('active'))

      if (isActive) {
        selectedConcern = ''
      } else {
        btn.classList.add('active')
        selectedConcern = concern
      }
    })
  }

  /* =====================================================
     Dropdown Interactions
     ===================================================== */

  if (buildingEl) {
    buildingEl.addEventListener('change', () => {
      const building = buildingEl.value
      if (!building) return

      populateRoomOptions(building)
    })
  }

  if (roomEl) {
    roomEl.addEventListener('change', () => {
      const building = buildingEl.value
      const room = roomEl.value

      if (!building || !room) return

      populateSeatOptions(building, room)
    })
  }

  /* =====================================================
     Form Submission
     ===================================================== */

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault()

      const building = buildingEl?.value.trim() || ''
      const room = roomEl?.value.trim() || ''
      const seat = seatEl?.value.trim() || ''
      const message = messageEl?.value.trim() || ''

      if (!building || !room || !seat) {
        showToast({
          title: 'Incomplete fields',
          message: 'Please complete the building, room, and seat fields.',
          variant: 'warning'
        })
        return
      }

      if (!selectedConcern && !message) {
        showToast({
          title: 'Missing concern',
          message: 'Please select a concern or enter a message.',
          variant: 'warning'
        })
        return
      }

      try {
        await submitTicket({
          building,
          room,
          seat,
          concern: selectedConcern || 'Other',
          message
        })

        await fetchTickets()
        resetForm()

        showToast({
          title: 'Submitted',
          message: 'Your concern was submitted successfully.',
          variant: 'success'
        })
      } catch (error) {
        console.error('Submit error:', error)
        showToast({
          title: 'Submission failed',
          message: error.message || 'Failed to submit concern.',
          variant: 'danger'
        })
      }
    })
  }

  /* =====================================================
     Cancel Button
     ===================================================== */

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => resetForm())
  }

  /* =====================================================
     Initial Render
     ===================================================== */
  if (roomEl) roomEl.disabled = true
  if (seatEl) seatEl.disabled = true

  fetchLabs()
  fetchTickets()
})()

/* =====================================================
   Controls the Navigation of Faq Modal
   ===================================================== */

function openFaqModal () {
  const modal = document.getElementById('faqModal')
  modal.style.display = 'flex'
  document.body.style.overflow = 'hidden'
}

function closeFaqModal () {
  const modal = document.getElementById('faqModal')
  modal.style.display = 'none'
  document.body.style.overflow = 'auto'
}

window.onclick = function (event) {
  const modal = document.getElementById('faqModal')
  if (event.target === modal) {
    modal.style.display = 'none'
    document.body.style.overflow = 'auto'
  }
}