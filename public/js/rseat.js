/* =====================================================
   Application State
   ===================================================== */
const appState = {
  currentBld: '',
  currentLab: '',
  selectedSeats: [],
  reservations: [],
  editingTargetId: null,
  viewDate: new Date(),
  selectedDate: new Date(),
  tempSlots: [],
  bookedDates: [],
  bookedSlots: [],
  bookedSlotsData: {},
  data: {}
}

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

function escapeHtml (value) {
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

  const tone = variantMap[variant] || variantMap.info

  toastEl.className = 'toast border-0 text-white'
  toastEl.setAttribute('role', 'alert')
  toastEl.setAttribute('aria-live', 'assertive')
  toastEl.setAttribute('aria-atomic', 'true')
  toastEl.dataset.bsAutohide = String(autohide)
  toastEl.dataset.bsDelay = String(delay)
  toastEl.style.background = 'rgba(18,18,18,0.95)'
  toastEl.style.backdropFilter = 'blur(12px)'
  toastEl.style.border = `1px solid ${tone.border}`
  toastEl.style.boxShadow = '0 8px 24px rgba(0,0,0,0.28)'

  toastEl.innerHTML = `
    <div
      class="toast-header text-white border-0"
      style="background:transparent; position:relative; padding-right:2.5rem;"
    >
      <span class="material-symbols-rounded me-2 mt-1 ${tone.iconClass}">${tone.icon}</span>
      <strong class="me-auto mt-1">${escapeHtml(title)}</strong>
      <button
        type="button"
        class="btn-close btn-close-white"
        data-bs-dismiss="toast"
        aria-label="Close"
        style="position:absolute; top:0.7rem; right:0.75rem; margin:0;"
      ></button>
    </div>
    <div class="toast-body pt-0">${escapeHtml(message)}</div>
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

function showConfirmToast ({
  title = 'Please confirm',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  onConfirm = () => {}
} = {}) {
  const container = getToastContainer()
  const toastEl = document.createElement('div')

  const variantMap = {
    success: {
      icon: 'check_circle',
      border: 'rgba(46, 204, 113, 0.45)',
      btnClass: 'btn-success'
    },
    danger: {
      icon: 'warning',
      border: 'rgba(255, 107, 74, 0.45)',
      btnClass: 'btn-danger'
    },
    warning: {
      icon: 'help',
      border: 'rgba(255, 193, 7, 0.45)',
      btnClass: 'btn-warning'
    },
    info: {
      icon: 'info',
      border: 'rgba(90, 169, 255, 0.45)',
      btnClass: 'btn-info'
    }
  }

  const tone = variantMap[variant] || variantMap.warning

  toastEl.className = 'toast border-0 text-white'
  toastEl.setAttribute('role', 'alertdialog')
  toastEl.setAttribute('aria-live', 'assertive')
  toastEl.setAttribute('aria-atomic', 'true')
  toastEl.dataset.bsAutohide = 'false'
  toastEl.style.background = 'rgba(18,18,18,0.97)'
  toastEl.style.backdropFilter = 'blur(12px)'
  toastEl.style.border = `1px solid ${tone.border}`
  toastEl.style.boxShadow = '0 8px 24px rgba(0,0,0,0.28)'

  toastEl.innerHTML = `
    <div
      class="toast-header text-white border-0"
      style="background:transparent; position:relative; padding-right:2.5rem;"
    >
      <span class="material-symbols-rounded me-2 mt-1">${tone.icon}</span>
      <strong class="me-auto mt-1">${escapeHtml(title)}</strong>
      <button
        type="button"
        class="btn-close btn-close-white"
        data-bs-dismiss="toast"
        aria-label="Close"
        style="position:absolute; top:0.7rem; right:0.75rem; margin:0;"
      ></button>
    </div>
    <div class="toast-body">
      <div class="mb-3">${escapeHtml(message)}</div>
      <div class="d-flex gap-2 justify-content-end">
        <button type="button" class="btn btn-sm btn-outline-light" data-confirm-toast-cancel="true">${escapeHtml(cancelText)}</button>
        <button type="button" class="btn btn-sm ${tone.btnClass}" data-confirm-toast-confirm="true">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `

  container.appendChild(toastEl)

  const toast = bootstrap.Toast.getOrCreateInstance(toastEl, {
    autohide: false
  })

  toastEl.addEventListener('click', event => {
    const confirmBtn = event.target.closest(
      '[data-confirm-toast-confirm="true"]'
    )
    const cancelBtn = event.target.closest(
      '[data-confirm-toast-cancel="true"]'
    )

    if (confirmBtn) {
      onConfirm()
      toast.hide()
    }

    if (cancelBtn) {
      toast.hide()
    }
  })

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove()
  })

  toast.show()
  return toastEl
}

/* =====================================================
   Helpers
   ===================================================== */
function getFullLabCode () {
  return String(appState.currentLab || '').trim()
}

function getReservationColorClass (buildingName) {
  const building = String(buildingName || '')
    .toLowerCase()
    .trim()

  if (
    building.includes('andrew') ||
    building.includes('br. andrew') ||
    building.includes('br andrew')
  ) {
    return 'green'
  }

  if (building.includes('gokongwei')) {
    return 'orange'
  }

  if (building.includes('velasco')) {
    return 'blue'
  }

  if (
    building.includes('st. la salle') ||
    building.includes('st la salle') ||
    building.includes('la salle')
  ) {
    return 'purple'
  }

  return 'green'
}

function normalizeBuildingName (buildingName) {
  const building = String(buildingName || '')
    .toLowerCase()
    .trim()

  if (
    building.includes('andrew') ||
    building.includes('br. andrew') ||
    building.includes('br andrew')
  ) {
    return 'Br. Andrew Hall'
  }

  if (building.includes('gokongwei')) {
    return 'Gokongwei Hall'
  }

  if (building.includes('velasco')) {
    return 'Velasco Hall'
  }

  if (
    building.includes('st. la salle') ||
    building.includes('st la salle') ||
    building.includes('la salle')
  ) {
    return 'St. La Salle Hall'
  }

  return String(buildingName || '').trim()
}

function parseSeatArray (seatValue) {
  if (Array.isArray(seatValue)) {
    return seatValue.map(Number).filter(n => !Number.isNaN(n))
  }

  if (seatValue === undefined || seatValue === null) {
    return []
  }

  return String(seatValue)
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !Number.isNaN(n))
}

function applyCurrentBuildingTheme (buildingName) {
  const root = document.documentElement
  const building = String(buildingName || '').toLowerCase()

  let color = '#2ecc71'
  let strong = '#27c468'
  let soft = 'rgba(46, 204, 113, 0.22)'
  let shadow = 'rgba(46, 204, 113, 0.22)'

  if (building.includes('gokongwei')) {
    color = '#ff9b54'
    strong = '#f08d47'
    soft = 'rgba(255, 155, 84, 0.22)'
    shadow = 'rgba(255, 155, 84, 0.22)'
  } else if (building.includes('velasco')) {
    color = '#5aa9ff'
    strong = '#4698f5'
    soft = 'rgba(90, 169, 255, 0.22)'
    shadow = 'rgba(90, 169, 255, 0.22)'
  } else if (
    building.includes('st. la salle') ||
    building.includes('st la salle') ||
    building.includes('la salle')
  ) {
    color = '#b07cff'
    strong = '#9d68f2'
    soft = 'rgba(176, 124, 255, 0.22)'
    shadow = 'rgba(176, 124, 255, 0.22)'
  }

  root.style.setProperty('--active-building', color)
  root.style.setProperty('--active-building-strong', strong)
  root.style.setProperty('--active-building-soft', soft)
  root.style.setProperty('--active-building-shadow', shadow)
}

/* =====================================================
   Sync Labs from Database
   ===================================================== */
function syncLabsFromDatabase () {
  if (!window.DB_LABS || window.DB_LABS.length === 0) return

  window.DB_LABS.sort((a, b) =>
    String(a.labCode).localeCompare(String(b.labCode), undefined, {
      numeric: true,
      sensitivity: 'base'
    })
  )

  appState.data = {}

  const defaultBg =
    "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('../img/topbox.png')"

  const buildingStyles = {
    'Gokongwei Hall': defaultBg,
    'Br. Andrew Hall': defaultBg,
    'Velasco Hall': defaultBg,
    'St. La Salle Hall': defaultBg,
    default: defaultBg
  }

  window.DB_LABS.forEach(lab => {
    const bldName = normalizeBuildingName(lab.building)

    if (!appState.data[bldName]) {
      appState.data[bldName] = {
        labs: [],
        bg: buildingStyles[bldName] || buildingStyles.default
      }
    }

    if (!appState.data[bldName].labs.includes(lab.labCode)) {
      appState.data[bldName].labs.push(lab.labCode)
    }
  })
}

/* =====================================================
   Database Fetching Logic
   ===================================================== */
async function fetchMyReservations () {
  try {
    const res = await fetch('/api/reservations/me')
    if (!res.ok) throw new Error('Failed to load reservations')

    const data = await res.json()

    appState.reservations = data.map(dbRes => {
      let slotsArr = []

      try {
        slotsArr = JSON.parse(dbRes.timeSlot || '[]')
      } catch (e) {
        slotsArr = dbRes.timeSlot ? [dbRes.timeSlot] : []
      }

      return {
        id: dbRes._id,
        userId: dbRes.user?._id,
        building: dbRes.lab
          ? normalizeBuildingName(dbRes.lab.building)
          : 'Unknown Building',
        lab: dbRes.lab ? dbRes.lab.labCode : 'Unknown Lab',
        seat: dbRes.seatNumber,
        date: dbRes.date,
        time:
          Array.isArray(slotsArr) && slotsArr.length > 0
            ? calculateTimeRange(slotsArr)
            : dbRes.timeSlot,
        slots: slotsArr
      }
    })

    renderReservations()
  } catch (err) {
    console.error('Error loading reservations:', err)
  }
}

async function fetchBookedSlots () {
  const labCode = getFullLabCode()
  if (!labCode) return

  let labId = ''
  if (window.DB_LABS) {
    const foundLab = window.DB_LABS.find(l => l.labCode === labCode)
    if (foundLab) labId = foundLab._id
  }

  const dateStr = appState.selectedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const selectedSeats = appState.selectedSeats || []
  const seatsStr = encodeURIComponent(JSON.stringify(selectedSeats))

  appState.bookedSlots = []
  appState.bookedSlotsData = {}

  try {
    const res = await fetch(
      `/api/reservations/booked?labId=${labId}&labCode=${labCode}&date=${dateStr}&seats=${seatsStr}`
    )
    if (!res.ok) throw new Error('Failed to fetch slots')

    const data = await res.json()

    appState.bookedSlotsData = data
    appState.bookedSlots = Object.keys(data)

    if (typeof renderTimeGrid === 'function') {
      renderTimeGrid()
    }
  } catch (err) {
    console.error('Error loading slots:', err)
  }
}

/* =====================================================
   Bootstrapping
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  syncLabsFromDatabase()

  const role = document.body.dataset.role

  if (role !== 'Admin') {
    const field = document.getElementById('adminStudentField')
    if (field) field.style.display = 'none'
  }

  const buildings = Object.keys(appState.data)
  if (buildings.length > 0 && !appState.currentBld) {
    appState.currentBld = buildings[0]
    appState.currentLab = appState.data[appState.currentBld].labs[0] || ''
  }

  fetchMyReservations()
  fetchBookedSlots()
  refreshUI()

  const switchBuildingBtn = document.getElementById('switchBuildingBtn')
  if (switchBuildingBtn) {
    switchBuildingBtn.onclick = () => {
      clearEditMode()

      const buildingsList = Object.keys(appState.data)

      if (buildingsList.length > 0) {
        const currentIndex = buildingsList.indexOf(appState.currentBld)
        const nextIndex = (currentIndex + 1) % buildingsList.length

        appState.currentBld = buildingsList[nextIndex]

        const titleEl = document.getElementById('currentBuildingName')
        if (titleEl) titleEl.innerText = appState.currentBld

        if (appState.data[appState.currentBld].labs.length > 0) {
          appState.currentLab = appState.data[appState.currentBld].labs[0]
        } else {
          appState.currentLab = ''
        }
      }

      appState.selectedSeats = []

      refreshUI()
      fetchBookedSlots()
    }
  }

  const btnCancelEdit = document.getElementById('btnCancelEdit')
  if (btnCancelEdit) {
    btnCancelEdit.onclick = () => {
      if (!appState.editingTargetId) return
      bootstrap.Modal.getOrCreateInstance(
        document.getElementById('confirmCancelModal')
      ).show()
    }
  }

  const btnConfirmEdit = document.getElementById('btnConfirmEdit')
  if (btnConfirmEdit) {
    btnConfirmEdit.onclick = () => {
      if (!appState.editingTargetId) return
      bootstrap.Modal.getOrCreateInstance(
        document.getElementById('successModal')
      ).show()
    }
  }

  const btnOpenModal = document.getElementById('btnOpenModal')
  if (btnOpenModal) {
    btnOpenModal.onclick = async () => {
      appState.tempSlots = []
      await fetchBookedSlots()
      openBookingFlow()
    }
  }

  const finalConfirm = document.getElementById('finalConfirm')
  if (finalConfirm) {
    finalConfirm.onclick = () => {
      if (appState.tempSlots.length === 0) return

      const dateStr = appState.selectedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      const timeRange = calculateTimeRange(appState.tempSlots)

      populateReservationForm(dateStr, timeRange)

      bootstrap.Modal.getOrCreateInstance(
        document.getElementById('reservationModal')
      ).hide()

      setTimeout(() => {
        bootstrap.Modal.getOrCreateInstance(
          document.getElementById('summaryModal')
        ).show()
      }, 400)
    }
  }

  const reservationForm = document.getElementById('reservation-form')
  if (reservationForm) {
    reservationForm.addEventListener('submit', e => {
      e.preventDefault()
      submitReservationForm()
    })
  }

  const openEditFlow = document.getElementById('openEditFlow')

  if (openEditFlow) {
    openEditFlow.onclick = async () => {
      if (!appState.editingTargetId) {
        showToast({
          title: 'No reservation selected',
          message: 'Please select a reservation from the list first.',
          variant: 'warning'
        })
        return
      }

      const targetId = appState.editingTargetId
      const res = appState.reservations.find(r => r.id === targetId)

      if (res) {
        const targetBuilding = normalizeBuildingName(res.building || '')
        const cleanLab = String(res.lab || '').trim()

        appState.selectedSeats = parseSeatArray(res.seat)
        appState.tempSlots = res.slots ? [...res.slots] : []

        const studentSelect = document.getElementById('studentSelect')

        if (studentSelect) {
          if (res.userId) {
            if (studentSelect && typeof $ !== 'undefined') {
              $('#studentSelect').val(res.userId).trigger('change')
            }
          } else {
            studentSelect.value = ''
          }

          if (studentSelect && typeof $ !== 'undefined') {
            $('#studentSelect').trigger('change')
          }
        }

        if (targetBuilding && cleanLab) {
          appState.currentBld = targetBuilding
          appState.currentLab = cleanLab

          const resDate = new Date(res.date)
          if (!Number.isNaN(resDate.getTime())) {
            appState.selectedDate = resDate
            appState.viewDate = new Date(resDate)
          }

          refreshUI()
          await fetchBookedSlots()
        }

        openBookingFlow()
      }
    }
  }

  const executeDelete = document.getElementById('executeDelete')
  if (executeDelete) {
    executeDelete.onclick = async () => {
      const targetId = appState.editingTargetId
      if (!targetId) return

      try {
        const res = await fetch(`/api/reservations/${targetId}`, {
          method: 'DELETE'
        })

        if (res.ok) {
          appState.reservations = appState.reservations.filter(
            r => r.id !== targetId
          )
          appState.editingTargetId = null
          renderReservations()
          fetchBookedSlots()

          bootstrap.Modal.getOrCreateInstance(
            document.getElementById('confirmCancelModal')
          ).hide()

          const editDesc = document.querySelector('.edit-desc')
          if (editDesc) {
            editDesc.innerText = 'Select a reservation to edit.'
          }

          setTimeout(() => {
            bootstrap.Modal.getOrCreateInstance(
              document.getElementById('cancelSuccessModal')
            ).show()
          }, 400)
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  if (typeof $ !== 'undefined' && $('#studentSelect').length > 0) {
    $('#studentSelect').select2({
      dropdownParent: $('#summaryModal'),
      placeholder: 'Search for a student...',
      allowClear: true,
      ajax: {
        url: '/api/students',
        dataType: 'json',
        delay: 250,
        data: function (params) {
          return { term: params.term }
        },
        processResults: function (data) {
          return {
            results: data.map(user => ({
              id: user._id,
              text: `${user.firstName} ${user.lastName}`,
              email: user.email
            }))
          }
        },
        cache: true
      },
      templateResult: function (user) {
        if (!user.id) return user.text

        return $(`
          <div>
            <div>${user.text}</div>
            <div style="font-style: italic; font-size: 0.85em; opacity: 0.7;">
              ${user.email}
            </div>
          </div>
        `)
      },
      templateSelection: function (user) {
        return user.text || user.id
      }
    })
  }
})

/* =====================================================
   Populate Reservation Form
   ===================================================== */
function populateReservationForm (dateStr, timeRange) {
  const labCode = getFullLabCode()

  let labId = ''
  if (window.DB_LABS) {
    const foundLab = window.DB_LABS.find(l => l.labCode === labCode)
    if (foundLab) labId = foundLab._id
  }

  document.getElementById('building').value = appState.currentBld
  document.getElementById('lab').value = labCode
  document.getElementById('labId').value = labId
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
  document.getElementById('isAnonymous').checked = false
}

/* =====================================================
   Form Submission Handler
   ===================================================== */
async function submitReservationForm () {
  const form = document.getElementById('reservation-form')
  const formData = new FormData(form)

  const labCodeStr = getFullLabCode()
  const existingResId = formData.get('reservation_id')

  const selectedStudent = document.getElementById('studentSelect')?.value

  const reservationData = {
    labId: formData.get('labId'),
    labCode: labCodeStr,
    seats: JSON.parse(formData.get('seats')),
    date: formData.get('date'),
    timeRange: formData.get('time'),
    slotsArray: JSON.parse(formData.get('slots')),
    isAnonymous: document.getElementById('isAnonymous').checked,
    user: selectedStudent || null
  }

  const fetchUrl = existingResId
    ? `/api/reservations/${existingResId}`
    : '/api/reservations'
  const fetchMethod = existingResId ? 'PUT' : 'POST'

  try {
    const response = await fetch(fetchUrl, {
      method: fetchMethod,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData)
    })

    if (response.ok) {
      await fetchMyReservations()
      await fetchBookedSlots()

      appState.editingTargetId = null

      const editDesc = document.querySelector('.edit-desc')
      if (editDesc) {
        editDesc.innerText = 'Select a reservation to edit.'
      }

      bootstrap.Modal.getOrCreateInstance(
        document.getElementById('summaryModal')
      ).hide()

      setTimeout(() => {
        bootstrap.Modal.getOrCreateInstance(
          document.getElementById('successModal')
        ).show()
        appState.selectedSeats = []
        renderSeats()
      }, 400)
    } else {
      const errData = await response.json()
      showToast({
        title: 'Reservation not saved',
        message: 'Could not save: ' + (errData.error || 'Please try again.'),
        variant: 'danger',
        delay: 4500
      })
    }
  } catch (err) {
    console.error('Database save failed:', err)
    showToast({
      title: 'Reservation not saved',
      message: 'Something went wrong while saving your reservation.',
      variant: 'danger',
      delay: 4500
    })
  }
}

/* =====================================================
   Seat Grid Rendering
   ===================================================== */
function renderSeats () {
  const grid = document.getElementById('seatContainer')
  if (grid) grid.innerHTML = ''

  const btnOpenModal = document.getElementById('btnOpenModal')
  if (btnOpenModal) btnOpenModal.disabled = true

  if (
    !appState.currentBld ||
    !appState.currentLab ||
    !appState.data[appState.currentBld]
  ) {
    return
  }

  const fullLabCode = getFullLabCode()

  const displayLabCode = document.getElementById('displayLabCode')
  if (displayLabCode) displayLabCode.innerText = fullLabCode

  let totalSeats = 40
  if (window.DB_LABS) {
    const currentLabObj = window.DB_LABS.find(l => l.labCode === fullLabCode)

    if (currentLabObj && currentLabObj.seats) {
      totalSeats = currentLabObj.seats.length
    }
  }

  for (let i = 1; i <= totalSeats; i++) {
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

      const updateBtn = document.getElementById('btnOpenModal')
      if (updateBtn) {
        updateBtn.disabled = appState.selectedSeats.length === 0
      }
    }

    if (grid) grid.appendChild(el)
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
  if (!calGrid) return

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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + 7)

  for (let p = 0; p < firstDay; p++) {
    calGrid.appendChild(document.createElement('div'))
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayEl = document.createElement('div')
    const loopDate = new Date(year, month, d)

    const isOutOfRange = loopDate < today || loopDate > maxDate

    const checkDate = loopDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

    const activeLabCode = getFullLabCode()

    const userSlotsForDay = appState.reservations
      .filter(r => r.date === checkDate && r.lab === activeLabCode)
      .reduce((acc, r) => acc.concat(r.slots || []), [])

    let totalBookedCount = userSlotsForDay.length
    if (
      d === appState.selectedDate.getDate() &&
      month === appState.selectedDate.getMonth()
    ) {
      totalBookedCount = new Set([...userSlotsForDay, ...appState.bookedSlots])
        .size
    }

    const isDayFullyBooked = totalBookedCount >= 18

    dayEl.className = `cal-day ${
      isDayFullyBooked || isOutOfRange ? 'unavailable' : ''
    } ${
      d === appState.selectedDate.getDate() &&
      month === appState.selectedDate.getMonth()
        ? 'selected'
        : ''
    }`

    if (userSlotsForDay.length > 0 && !isDayFullyBooked && !isOutOfRange) {
      dayEl.style.borderBottom = '2px solid #ff6b4a'
    }

    dayEl.innerText = d

    if (!isDayFullyBooked && !isOutOfRange) {
      dayEl.onclick = () => {
        appState.selectedDate = new Date(year, month, d)
        appState.tempSlots = []
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
  if (!grid) return

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
    const editingRes = appState.editingTargetId
      ? appState.reservations.find(r => r.id === appState.editingTargetId)
      : null

    const isCurrentEditSlot =
      editingRes &&
      editingRes.date === dateStr &&
      editingRes.slots &&
      editingRes.slots.includes(s)

    const isGlobalOccupied =
      appState.bookedSlots.includes(s) && !isCurrentEditSlot

    const isUserReserved = appState.reservations.some(res => {
      const isSameDate = res.date === dateStr
      const activeLabCode = getFullLabCode()
      const isSameLab = res.lab === activeLabCode
      const hasSlot = res.slots && res.slots.includes(s)
      const isNotBeingEdited = res.id !== appState.editingTargetId

      const resSeats = parseSeatArray(res.seat)
      const overlapsSeat = appState.selectedSeats.some(sel =>
        resSeats.includes(sel)
      )

      return (
        isSameDate && isSameLab && hasSlot && isNotBeingEdited && overlapsSeat
      )
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
        if (idx > -1) {
          appState.tempSlots.splice(idx, 1)
        } else {
          appState.tempSlots.push(s)
        }
      }
    } else if (isGlobalOccupied) {
      const userInfo = appState.bookedSlotsData[s]

      if (userInfo) {
        chip.style.pointerEvents = 'auto'
        chip.style.cursor = 'help'

        chip.dataset.userId = userInfo.userId
        chip.dataset.userName = userInfo.name
        chip.dataset.userAvatar = userInfo.avatar

        chip.onmouseenter = e => showPopover(e, userInfo)
        chip.onmouseleave = hidePopover
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

  const modalSub = document.getElementById('modalSub')
  if (modalSub) {
    const fullLabCode = getFullLabCode()
    modalSub.innerText = `${fullLabCode} • Select Date & Time`
  }

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById('reservationModal')
  ).show()
}

/* =====================================================
   UI Refresh
   ===================================================== */
function refreshUI () {
  const bldData = appState.data[appState.currentBld]
  if (!bldData) return

  applyCurrentBuildingTheme(appState.currentBld)

  const titleEl = document.getElementById('currentBuildingName')
  if (titleEl) titleEl.innerText = appState.currentBld

  const bgEl = document.getElementById('heroBg')
  if (bgEl && bldData.bg) bgEl.style.backgroundImage = bldData.bg

  const nav = document.getElementById('labNavBar')
  if (nav && bldData.labs) {
    nav.innerHTML = bldData.labs
      .map(
        l => `
          <button class="btn-lab-round ${
            appState.currentLab === l ? 'active' : ''
          }" onclick="setLab('${l}')">${l}</button>
        `
      )
      .join('')
  }

  renderSeats()
}

/* =====================================================
   Lab Switching
   ===================================================== */
window.setLab = l => {
  clearEditMode()
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
  if (!container) return

  container.innerHTML = appState.reservations
    .map(res => {
      const colorClass = getReservationColorClass(res.building)
      const id = String(res.id)

      return `
        <div class="mini-card ${colorClass}" data-res-id="${id}" onclick="selectForEdit(event,'${id}')">
          <div class="accent"></div>
          <div class="info">
            <strong>${res.lab} • Seat(s) ${
        Array.isArray(res.seat) ? res.seat.join(', ') : res.seat
      }</strong>
            <p>${res.date} | ${res.time}</p>
          </div>
        </div>
      `
    })
    .join('')
}

/* =====================================================
   Reservation Selection for Editing
   ===================================================== */
window.selectForEdit = (e, id) => {
  appState.editingTargetId = id
  const res = appState.reservations.find(r => r.id === id)
  if (!res) return

  const editDesc = document.querySelector('.edit-desc')
  if (editDesc) {
    editDesc.innerText = `Editing: ${res.lab} Seat(s) ${
      Array.isArray(res.seat) ? res.seat.join(', ') : res.seat
    }`
  }

  const targetBuilding = normalizeBuildingName(res.building)
  const cleanLab = String(res.lab || '').trim()

  if (targetBuilding && cleanLab) {
    appState.currentBld = targetBuilding
    appState.currentLab = cleanLab

    refreshUI()
    fetchBookedSlots()
  }

  document.querySelectorAll('.mini-card').forEach(c => {
    c.style.border = '1px solid rgba(255,255,255,0.1)'
    c.style.boxShadow = 'none'
  })

  const card = e.currentTarget
  card.style.border = '1px solid #ff6b4a'
  card.style.boxShadow = '0 0 10px rgba(255,107,74,0.3)'
}

/* =====================================================
   Helper: Clear Edit Mode
   ===================================================== */
function clearEditMode () {
  appState.editingTargetId = null
  const desc = document.querySelector('.edit-desc')
  if (desc) desc.innerText = 'Select a reservation to edit.'

  document.querySelectorAll('#activeResContainer .mini-card').forEach(c => {
    c.style.border = '1px solid rgba(255,255,255,0.1)'
    c.style.boxShadow = 'none'
  })
}

/* =====================================================
   Hover Popover Logic & Auto-Refresh Timer
   ===================================================== */
const popover = document.getElementById('userPopover')
let popoverTimer

function showPopover (e, user) {
  if (!popover) return
  clearTimeout(popoverTimer)

  const rect = e.currentTarget.getBoundingClientRect()

  const popAvatar = document.getElementById('popAvatar')
  const popName = document.getElementById('popName')
  const btnCancelNoShow = document.getElementById('btnCancelNoShow')

  if (popAvatar) popAvatar.src = user.avatar || '../img/default-avatar.png'

  if (popName) {
    if (user.isAnonymous && document.body.dataset.role === 'Admin') {
      popName.innerHTML = `${user.name} <span style="font-size:0.6rem; background:#ff6b4a; color:white; padding:2px 5px; border-radius:4px; margin-left:5px; vertical-align: middle;">ANONYMOUS</span>`
    } else {
      popName.innerText = user.name || 'Unknown User'
    }
    popName.href = user.userId ? `/profile/${user.userId}` : '#'
  }

  if (btnCancelNoShow) {
    btnCancelNoShow.style.display = 'none'
    btnCancelNoShow.onclick = null

    if (document.body.dataset.role === 'Admin' && user.resId) {
      try {
        const slotTimeStr = user.startTime || e.currentTarget.innerText.trim()

        const [time, modifier] = slotTimeStr.split(' ')
        let [hours, minutes] = time.split(':').map(Number)

        if (hours === 12) hours = 0
        if (modifier === 'PM') hours += 12

        const slotDate = new Date(appState.selectedDate)
        slotDate.setHours(hours, minutes, 0, 0)

        const now = new Date()
        const diffMins = (now - slotDate) / 1000 / 60

        const isTesting = true

        if (isTesting || (diffMins >= 10 && diffMins <= 20)) {
          btnCancelNoShow.style.display = 'block'
          btnCancelNoShow.onclick = () => executeNoShowCancel(user.resId)
        }
      } catch (err) {
        console.error('Time logic error:', err)
      }
    }
  }

  popover.style.display = 'flex'
  let topPos = rect.top - popover.offsetHeight - 10
  if (topPos < 10) topPos = rect.bottom + 10
  popover.style.top = `${topPos}px`
  popover.style.left = `${rect.left}px`
}

async function executeNoShowCancel (reservationId) {
  showConfirmToast({
    title: 'Cancel reservation?',
    message: 'Mark this student as a no-show and cancel the reservation?',
    confirmText: 'Yes, cancel',
    cancelText: 'Keep reservation',
    variant: 'danger',
    onConfirm: async () => {
      try {
        const res = await fetch(
          `/api/reservations/${reservationId}?reason=noshow`,
          {
            method: 'DELETE'
          }
        )

        if (res.ok) {
          hidePopover()
          appState.bookedSlots = []
          await fetchBookedSlots()
          await fetchMyReservations()

          bootstrap.Modal.getOrCreateInstance(
            document.getElementById('cancelSuccessModal')
          ).show()
        } else {
          showToast({
            title: 'Cancellation failed',
            message: 'Failed to cancel the reservation.',
            variant: 'danger'
          })
        }
      } catch (err) {
        console.error('No-Show Cancel Error:', err)
        showToast({
          title: 'Cancellation failed',
          message: 'Something went wrong while cancelling the reservation.',
          variant: 'danger'
        })
      }
    }
  })
}

function hidePopover () {
  if (!popover) return

  popoverTimer = setTimeout(() => {
    if (!popover.matches(':hover')) {
      popover.style.display = 'none'
    }
  }, 300)
}

if (popover) {
  popover.onmouseenter = () => {
    clearTimeout(popoverTimer)
    popover.style.display = 'flex'
  }
  popover.onmouseleave = () => {
    hidePopover()
  }
}

setInterval(() => {
  if (appState.currentLab && appState.selectedDate) {
    fetchBookedSlots()
  }
}, 30000)

syncLabsFromDatabase()