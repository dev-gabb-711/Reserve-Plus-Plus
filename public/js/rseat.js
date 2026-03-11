/* =====================================================
   Application State
   - Central store for current building/lab, selections, reservations, and calendar state
   ===================================================== */
const appState = {
  currentBld: 'Gokongwei Hall',
  currentLab: '201',
  selectedSeats: [],
  reservations: [],
  editingTargetId: null,
  viewDate: new Date(),
  selectedDate: new Date(),
  tempSlots: [],
  bookedDates: [],
  bookedSlots: [],
  data: {
    'Gokongwei Hall': {
      labs: ['201', '302', '305', '407'],
      bg: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('../img/gok_lab.jpg')"
    },
    'Andrew Gonzales Hall': {
      labs: ['1102', '1403', '1405', '1501', '1704'],
      bg: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('../img/ag_lab.jpg')"
    }
  }
}

/* =====================================================
   Database Fetching Logic
   ===================================================== */
async function fetchMyReservations () {
  try {
    // MUST have the leading slash!
    const res = await fetch('/api/reservations/me')
    if (!res.ok) throw new Error('Failed to load reservations')

    const data = await res.json()

    // Map database data to fit your UI structure
    appState.reservations = data.map(dbRes => {
      let slotsArr = []

      try {
        // Try to parse the new array format
        slotsArr = JSON.parse(dbRes.timeSlot || '[]')
      } catch (e) {
        // If it fails, it's an old string reservation. Just wrap it in an array!
        slotsArr = [dbRes.timeSlot]
      }

      return {
        id: dbRes._id, // Real database ID!
        building: dbRes.lab ? dbRes.lab.building : 'Unknown Building',
        lab: dbRes.lab ? dbRes.lab.labCode : 'Unknown Lab',
        seat: dbRes.seatNumber,
        date: dbRes.date,
        time: Array.isArray(slotsArr) ? slotsArr.join(', ') : dbRes.timeSlot,
        slots: slotsArr
      }
    })

    // Re-render the right sidebar with the newly fetched data
    renderReservations()
  } catch (err) {
    console.error('Error loading reservations:', err)
  }
}

async function fetchBookedSlots () {
  const labCode = appState.currentBld[0] + appState.currentLab

  // Search the injected database array for the real MongoDB ID
  let labId = ''
  if (window.DB_LABS) {
    const foundLab = window.DB_LABS.find(
      l => l.labCode === appState.currentLab || l.labCode === labCode
    )
    if (foundLab) labId = foundLab._id
  }

  const dateStr = appState.selectedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  try {
    const res = await fetch(
      `/api/reservations/booked?labId=${labId}&labCode=${labCode}&date=${dateStr}`
    )
    if (!res.ok) throw new Error('Failed to fetch slots')

    const takenSlots = await res.json()

    // Update the global state with REAL booked slots!
    appState.bookedSlots = takenSlots

    // Redraw the time grid to black out the unavailable chips
    renderTimeGrid()
  } catch (err) {
    console.error('Error loading slots:', err)
  }
}

/* =====================================================
   Bootstrapping
   - Initializes the UI once the DOM is ready
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Fetch real data immediately when page loads
  fetchMyReservations()
  fetchBookedSlots()
  refreshUI()

  /* =====================================================
	   Building + Lab Switching
	   ===================================================== */

  document.getElementById('switchBuildingBtn').onclick = () => {
    appState.currentBld = appState.currentBld.includes('Gok')
      ? 'Andrew Gonzales Hall'
      : 'Gokongwei Hall'

    appState.currentLab = appState.data[appState.currentBld].labs[0]
    appState.selectedSeats = []

    refreshUI()
    fetchBookedSlots()
  }

  /* =====================================================
	   Reservation Editing / Deletion Modals
	   ===================================================== */

  document.getElementById('btnCancelEdit').onclick = () => {
    if (!appState.editingTargetId) return
    new bootstrap.Modal(document.getElementById('confirmCancelModal')).show()
  }

  document.getElementById('btnConfirmEdit').onclick = () => {
    if (!appState.editingTargetId) return
    new bootstrap.Modal(document.getElementById('successModal')).show()
  }

  /* =====================================================
	   Booking Flow (Open, Review, Submit)
	   ===================================================== */

  document.getElementById('btnOpenModal').onclick = () => {
    appState.tempSlots = []
    openBookingFlow()
  }

  document.getElementById('finalConfirm').onclick = () => {
    if (appState.tempSlots.length === 0) return

    const dateStr = appState.selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const timeRange = calculateTimeRange(appState.tempSlots)

    populateReservationForm(dateStr, timeRange)

    bootstrap.Modal.getInstance(
      document.getElementById('reservationModal')
    ).hide()
    setTimeout(() => {
      new bootstrap.Modal(document.getElementById('summaryModal')).show()
    }, 400)
  }

  document.getElementById('reservation-form').addEventListener('submit', e => {
    e.preventDefault()
    submitReservationForm()
  })

  // Continue editing
  document.getElementById('openEditFlow').onclick = () => {
    if (!appState.editingTargetId) {
      alert('Please select a reservation from the list first.')
      return
    }

    const targetId = appState.editingTargetId
    const res = appState.reservations.find(r => r.id === targetId)

    if (res) {
      appState.selectedSeats = res.seat
        .toString()
        .split(', ')
        .map(s => parseInt(s))
      appState.tempSlots = res.slots ? [...res.slots] : []
      openBookingFlow()
    }
  }

  // Soft Delete in Database
  document.getElementById('executeDelete').onclick = async () => {
    const targetId = appState.editingTargetId

    try {
      const res = await fetch(`/api/reservations/${targetId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        // Success! Remove from UI and refresh the blackout slots
        appState.reservations = appState.reservations.filter(
          r => r.id !== targetId
        )
        appState.editingTargetId = null
        renderReservations()
        fetchBookedSlots()

        bootstrap.Modal.getInstance(
          document.getElementById('confirmCancelModal')
        ).hide()
        document.querySelector('.edit-desc').innerText =
          'Select a reservation to edit.'
        setTimeout(() => {
          new bootstrap.Modal(
            document.getElementById('cancelSuccessModal')
          ).show()
        }, 400)
      }
    } catch (err) {
      console.error(err)
    }
  }
})

/* =====================================================
   Populate Reservation Form
   ===================================================== */
function populateReservationForm (dateStr, timeRange) {
  const labCode = appState.currentBld[0] + appState.currentLab

  // Search the injected database array for the real MongoDB ID
  let labId = ''
  if (window.DB_LABS) {
    const foundLab = window.DB_LABS.find(
      l => l.labCode === appState.currentLab || l.labCode === labCode
    )
    if (foundLab) labId = foundLab._id
  }

  document.getElementById('building').value = appState.currentBld
  document.getElementById('lab').value = labCode
  document.getElementById('labId').value = labId // Save the true ID
  document.getElementById('seats').value = JSON.stringify(
    appState.selectedSeats
  )
  document.getElementById('date').value = dateStr
  document.getElementById('time').value = timeRange
  document.getElementById('slots').value = JSON.stringify(appState.tempSlots)
  document.getElementById('reservationId').value =
    appState.editingTargetId || ''

  document.getElementById('sumBld').innerText = appState.currentBld
  document.getElementById(
    'sumLabSeat'
  ).innerText = `${labCode} • Seat(s) ${appState.selectedSeats.join(', ')}`
  document.getElementById('sumDate').innerText = dateStr
  document.getElementById('sumTime').innerText = timeRange
}

/* =====================================================
   Form Submission Handler
   ===================================================== */
async function submitReservationForm () {
  const form = document.getElementById('reservation-form')
  const formData = new FormData(form)

  const reservationData = {
    labId: formData.get('labId'), // Sending the true ObjectId!
    labCode: formData.get('lab'),
    seats: JSON.parse(formData.get('seats')),
    date: formData.get('date'),
    timeRange: formData.get('time'),
    slotsArray: JSON.parse(formData.get('slots')) // Send the array of chips
  }

  try {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData)
    })

    if (response.ok) {
      // Refresh our lists from the DB!
      await fetchMyReservations()
      await fetchBookedSlots()

      // Handle UI cleanup
      appState.editingTargetId = null
      document.querySelector('.edit-desc').innerText =
        'Select a reservation to edit.'

      const sumModalEl = document.getElementById('summaryModal')
      bootstrap.Modal.getInstance(sumModalEl).hide()

      setTimeout(() => {
        new bootstrap.Modal(document.getElementById('successModal')).show()
        appState.selectedSeats = []
        renderSeats()
      }, 400)
    } else {
      const errData = await response.json()
      alert('Could not save: ' + errData.error)
    }
  } catch (err) {
    console.error('Database save failed:', err)
  }
}

/* =====================================================
   Seat Grid Rendering
   ===================================================== */
function renderSeats () {
  const grid = document.getElementById('seatContainer')
  grid.innerHTML = ''

  document.getElementById('btnOpenModal').disabled = true
  document.getElementById('displayLabCode').innerText =
    appState.currentBld[0] + appState.currentLab

  for (let i = 1; i <= 40; i++) {
    const el = document.createElement('div')
    el.className = `seat-unit ${
      appState.selectedSeats.includes(i) ? 'selected' : ''
    }`
    el.innerHTML = `<span class="material-symbols-rounded">desktop_windows</span> Seat ${i}`

    el.onclick = () => {
      if (appState.selectedSeats.includes(i)) {
        appState.selectedSeats = appState.selectedSeats.filter(s => s !== i)
        el.classList.remove('selected')
      } else {
        appState.selectedSeats.push(i)
        el.classList.add('selected')
      }
      document.getElementById('btnOpenModal').disabled =
        appState.selectedSeats.length === 0
    }

    grid.appendChild(el)
  }
}

/* =====================================================
   Time Range Helper
   ===================================================== */
function calculateTimeRange (slots) {
  if (slots.length === 0) return ''

  const sorted = [...slots].sort(
    (a, b) => new Date('1970/01/01 ' + a) - new Date('1970/01/01 ' + b)
  )

  const start = sorted[0]
  const lastSlot = sorted[sorted.length - 1]

  let [time, modifier] = lastSlot.split(' ')
  let [hours, minutes] = time.split(':')

  let h = parseInt(hours, 10)
  if (h === 12) h = 0
  if (modifier === 'PM') h += 12

  const endDate = new Date(1970, 0, 1, h, parseInt(minutes, 10))
  endDate.setMinutes(endDate.getMinutes() + 30)

  const endStr = endDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  return `${start} - ${endStr}`
}

/* =====================================================
   Calendar Rendering
   ===================================================== */
function renderCalendar () {
  const calGrid = document.getElementById('calendarEl')
  const monthYearStr = appState.viewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  calGrid.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 w-100" style="grid-column: span 7;">
            <button class="btn btn-sm btn-outline-light border-0" onclick="changeMonth(-1)">‹</button>
            <span class="fw-bold small">${monthYearStr}</span>
            <button class="btn btn-sm btn-outline-light border-0" onclick="changeMonth(1)">›</button>
        </div>
        <div class="cal-day-label">S</div><div class="cal-day-label">M</div><div class="cal-day-label">T</div>
        <div class="cal-day-label">W</div><div class="cal-day-label">T</div><div class="cal-day-label">F</div>
        <div class="cal-day-label">S</div>
    `

  const year = appState.viewDate.getFullYear()
  const month = appState.viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let p = 0; p < firstDay; p++)
    calGrid.appendChild(document.createElement('div'))

  for (let d = 1; d <= daysInMonth; d++) {
    const dayEl = document.createElement('div')
    const checkDate = new Date(year, month, d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

    const userSlotsForDay = appState.reservations
      .filter(r => r.date === checkDate)
      .reduce((acc, r) => acc.concat(r.slots || []), [])

    const totalBookedCount = new Set([
      ...userSlotsForDay,
      ...appState.bookedSlots
    ]).size
    const isDayFullyBooked = totalBookedCount >= 18

    dayEl.className = `cal-day ${isDayFullyBooked ? 'unavailable' : ''} ${
      d === appState.selectedDate.getDate() &&
      month === appState.selectedDate.getMonth()
        ? 'selected'
        : ''
    }`

    if (userSlotsForDay.length > 0 && !isDayFullyBooked) {
      dayEl.style.borderBottom = '2px solid #ff6b4a'
    }

    dayEl.innerText = d

    // Allow selecting only if not fully booked
    if (!isDayFullyBooked) {
      dayEl.onclick = () => {
        appState.selectedDate = new Date(year, month, d)
        appState.tempSlots = [] // Clear current selections when switching days

        // Fetch the real booked slots for the new date!
        fetchBookedSlots()
        renderCalendar()
      }
    }

    calGrid.appendChild(dayEl)
  }
}

/* =====================================================
   Month Navigation
   ===================================================== */
window.changeMonth = dir => {
  appState.viewDate.setMonth(appState.viewDate.getMonth() + dir)
  renderCalendar()
}

/* =====================================================
   Time Slot Grid Rendering
   ===================================================== */
function renderTimeGrid () {
  const grid = document.getElementById('timeSlotGrid')
  grid.innerHTML = ''

  const slots = []
  for (let h = 8; h <= 16; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
    slots.push(`${String(displayH).padStart(2, '0')}:00 ${ampm}`)
    slots.push(`${String(displayH).padStart(2, '0')}:30 ${ampm}`)
  }

  const dateStr = appState.selectedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  slots.forEach(s => {
    const isGlobalOccupied = appState.bookedSlots.includes(s)

    const isUserReserved = appState.reservations.some(res => {
      const isSameDate = res.date === dateStr
      const hasSlot = res.slots && res.slots.includes(s)
      const isNotBeingEdited = res.id !== appState.editingTargetId
      return isSameDate && hasSlot && isNotBeingEdited
    })

    const isUnavailable = isGlobalOccupied || isUserReserved

    const chip = document.createElement('div')
    chip.className = `chip-time ${
      appState.tempSlots.includes(s) ? 'active' : ''
    } ${isUnavailable ? 'unavailable' : ''}`
    chip.innerText = s

    if (!isUnavailable) {
      chip.onclick = () => {
        chip.classList.toggle('active')
        const idx = appState.tempSlots.indexOf(s)
        idx > -1
          ? appState.tempSlots.splice(idx, 1)
          : appState.tempSlots.push(s)
      }
    }

    grid.appendChild(chip)
  })
}

/* =====================================================
   Booking Flow Launcher
   ===================================================== */
function openBookingFlow () {
  renderCalendar()
  renderTimeGrid()
  new bootstrap.Modal(document.getElementById('reservationModal')).show()
}

/* =====================================================
   UI Refresh
   ===================================================== */
function refreshUI () {
  document.getElementById('currentBuildingName').innerText = appState.currentBld
  document.getElementById('heroBg').style.backgroundImage =
    appState.data[appState.currentBld].bg

  const nav = document.getElementById('labNavBar')
  nav.innerHTML = appState.data[appState.currentBld].labs
    .map(
      l => `
        <button class="btn-lab-round ${
          appState.currentLab === l ? 'active' : ''
        }" onclick="setLab('${l}')">${l}</button>
    `
    )
    .join('')

  renderSeats()
}

/* =====================================================
   Lab Switching
   ===================================================== */
window.setLab = l => {
  appState.currentLab = l
  appState.selectedSeats = []
  refreshUI()
  fetchBookedSlots()
}

/* =====================================================
   Reservations List Rendering
   ===================================================== */
function renderReservations () {
  const container = document.getElementById('activeResContainer')

  container.innerHTML = appState.reservations
    .map(res => {
      const building = String(res.building ?? '')
        .toLowerCase()
        .trim()
      const colorClass = building.includes('andrew gonzales')
        ? 'green'
        : building.includes('gokongwei')
        ? 'red'
        : ''
      const id = String(res.id)

      return `
      <div class="mini-card ${colorClass}" data-res-id="${id}" onclick="selectForEdit(event,'${id}')">
        <div class="accent"></div>
        <div class="info">
          <strong>${res.lab} • Seat(s) ${res.seat}</strong>
          <p>${res.date} | ${res.time}</p>
        </div>
      </div>
    `
    })
    .join('')
}

/* =====================================================
   Reservation Selection for Editing (Exposed to Window)
   - Called by inline onclick from reservation cards
   ===================================================== */
window.selectForEdit = (e, id) => {
  appState.editingTargetId = id
  const res = appState.reservations.find(r => r.id === id)
  if (!res) return

  document.querySelector(
    '.edit-desc'
  ).innerText = `Editing: ${res.lab} Seat(s) ${res.seat}`

  // Reset borders, then highlight the selected card
  document
    .querySelectorAll('#activeResContainer .mini-card')
    .forEach(c => (c.style.border = '1px solid rgba(255,255,255,0.12)'))

  e.currentTarget.style.border = '1px solid #ff6b4a'
}
