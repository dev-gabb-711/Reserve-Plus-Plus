/* =====================================================
   DOM References
   ===================================================== */

const filterBtn = document.getElementById('filterBtn')
const filterPop = document.getElementById('filterPop')
const applyFilters = document.getElementById('applyFilters')

const filterChecks = filterPop
  ? Array.from(filterPop.querySelectorAll("input[type='checkbox']"))
  : []

const labGrid = document.getElementById('lab-room-grid')
const reservationList = document.getElementById('reservationList')

const calGrid = document.getElementById('calendar-days-grid')
const prevBtn = document.getElementById('prev-month')
const nextBtn = document.getElementById('next-month')
const calMonthLabel = document.getElementById('calMonthLabel')

const liveStatusBox = document.getElementById('liveStatusBox')

/* =====================================================
   State
   ===================================================== */

let activeBuildingFilters = new Set([
  'andrew',
  'gokongwei',
  'velasco',
  'lasalle'
])

let viewDate = new Date()
let liveStatusInterval = null

/* =====================================================
   Date Utilities
   ===================================================== */

function pad2 (n) {
  return String(n).padStart(2, '0')
}

function toISODateKey (d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function mondayIndex (jsDay) {
  return (jsDay + 6) % 7
}

function parseDateFromReservation (value) {
  if (!value) return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  const raw = String(value).trim()
  if (!raw) return null

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2]) - 1
    const day = Number(isoMatch[3])
    const d = new Date(year, month, day)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const prettyMatch = raw.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})$/)
  if (prettyMatch) {
    const months = {
      jan: 0,
      january: 0,
      feb: 1,
      february: 1,
      mar: 2,
      march: 2,
      apr: 3,
      april: 3,
      may: 4,
      jun: 5,
      june: 5,
      jul: 6,
      july: 6,
      aug: 7,
      august: 7,
      sep: 8,
      sept: 8,
      september: 8,
      oct: 9,
      october: 9,
      nov: 10,
      november: 10,
      dec: 11,
      december: 11
    }

    const monthName = prettyMatch[1].toLowerCase()
    const monthIndex = months[monthName]
    const day = Number(prettyMatch[2])
    const year = Number(prettyMatch[3])

    if (monthIndex !== undefined) {
      const d = new Date(year, monthIndex, day)
      return Number.isNaN(d.getTime()) ? null : d
    }
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizeReservationDateToISO (value) {
  const parsed = parseDateFromReservation(value)
  if (!parsed) return ''
  return toISODateKey(parsed)
}

function formatTimeDisplay (dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
    return ''
  }

  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function formatMinutesRemaining (msDiff) {
  const totalMinutes = Math.max(0, Math.ceil(msDiff / 60000))
  return String(totalMinutes)
}

function formatPendingCountdown (msDiff) {
  const totalSeconds = Math.max(0, Math.floor(msDiff / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/* =====================================================
   Time Parsing Helpers
   ===================================================== */

function normalizeTimeToken (value) {
  return String(value || '')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function convert12HourTo24Hour (timeStr) {
  const value = normalizeTimeToken(timeStr)
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)

  if (!match) return null

  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridiem = match[3].toUpperCase()

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null
  }

  if (meridiem === 'AM') {
    if (hours === 12) hours = 0
  } else {
    if (hours !== 12) hours += 12
  }

  return `${pad2(hours)}:${pad2(minutes)}`
}

function convert24HourTo12Hour (hours, minutes) {
  const suffix = hours >= 12 ? 'PM' : 'AM'
  let displayHour = hours % 12
  if (displayHour === 0) displayHour = 12
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`
}

function normalizeSingleTimeTo24 (timeStr) {
  const value = normalizeTimeToken(timeStr)

  if (!value) return null

  const already24 = value.match(/^(\d{1,2}):(\d{2})$/)
  if (already24) {
    const hours = Number(already24[1])
    const minutes = Number(already24[2])

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${pad2(hours)}:${pad2(minutes)}`
    }
  }

  return convert12HourTo24Hour(value)
}

function addThirtyMinutesToTimeLabel (timeLabel) {
  const normalized = normalizeSingleTimeTo24(timeLabel)
  if (!normalized) return null

  let [hours, minutes] = normalized.split(':').map(Number)

  minutes += 30
  if (minutes >= 60) {
    hours += 1
    minutes -= 60
  }
  if (hours >= 24) {
    hours %= 24
  }

  return convert24HourTo12Hour(hours, minutes)
}

function normalizeTimeRange (rawTime) {
  const value = normalizeTimeToken(rawTime)
  if (!value) return ''

  if (value.includes('-')) {
    const parts = value.split(/\s*-\s*/)
    if (parts.length === 2) {
      const start = normalizeTimeToken(parts[0])
      const end = normalizeTimeToken(parts[1])

      if (normalizeSingleTimeTo24(start) && normalizeSingleTimeTo24(end)) {
        return `${start} - ${end}`
      }
    }
  }

  try {
    const parsed = JSON.parse(value)

    if (Array.isArray(parsed) && parsed.length) {
      const start = normalizeTimeToken(parsed[0])
      const last = normalizeTimeToken(parsed[parsed.length - 1])

      const end = addThirtyMinutesToTimeLabel(last)

      if (start && end) {
        return `${start} - ${end}`
      }
    }
  } catch (err) {
    // Not JSON; continue below
  }

  const maybeSingle = normalizeSingleTimeTo24(value)
  if (maybeSingle) {
    const end = addThirtyMinutesToTimeLabel(value)
    if (end) {
      return `${normalizeTimeToken(value)} - ${end}`
    }
  }

  return value
}

function buildDateTime (dateStr, timeStr) {
  const normalizedTime = normalizeSingleTimeTo24(timeStr)
  if (!dateStr || !normalizedTime) return null

  const baseDate = parseDateFromReservation(dateStr)
  if (!baseDate) return null

  const [hours, minutes] = normalizedTime.split(':').map(Number)

  const dateTime = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    0,
    0
  )

  return Number.isNaN(dateTime.getTime()) ? null : dateTime
}

function parseReservationDateTime (dateStr, timeSlot, whichPart) {
  if (!dateStr || !timeSlot) return null

  const cleaned = normalizeTimeRange(timeSlot)
  const slotParts = cleaned.split(/\s*-\s*/)

  if (slotParts.length !== 2) return null

  const startTime = slotParts[0]
  const endTime = slotParts[1]

  const startDateTime = buildDateTime(dateStr, startTime)
  const endDateTime = buildDateTime(dateStr, endTime)

  if (!startDateTime || !endDateTime) return null

  if (whichPart === 'start') {
    return startDateTime
  }

  const adjustedEnd = new Date(endDateTime)

  if (adjustedEnd <= startDateTime) {
    adjustedEnd.setDate(adjustedEnd.getDate() + 1)
  }

  return adjustedEnd
}

/* =====================================================
   Building Helpers
   ===================================================== */

function inferBuildingKey (text) {
  const value = String(text || '')
    .trim()
    .toLowerCase()

  if (!value) return ''

  if (
    value.includes('andrew') ||
    value.includes('br. andrew') ||
    value.includes('br andrew') ||
    /^a\d+/i.test(value) ||
    value.includes('room a')
  ) {
    return 'andrew'
  }

  if (
    value.includes('gokongwei') ||
    /^g\d+/i.test(value) ||
    /^gk\d+/i.test(value) ||
    value.includes('room g')
  ) {
    return 'gokongwei'
  }

  if (
    value.includes('velasco') ||
    /^v\d+/i.test(value) ||
    value.includes('room v')
  ) {
    return 'velasco'
  }

  if (
    value.includes('st. la salle') ||
    value.includes('st la salle') ||
    value.includes('la salle') ||
    /^ls\d+/i.test(value) ||
    value.includes('room ls')
  ) {
    return 'lasalle'
  }

  return ''
}

function getBuildingColor (buildingKey) {
  switch (buildingKey) {
    case 'andrew':
      return {
        bg: '#50ff78',
        shadow: 'rgba(80, 255, 120, 0.18)'
      }
    case 'gokongwei':
      return {
        bg: '#ff9b54',
        shadow: 'rgba(255, 155, 84, 0.22)'
      }
    case 'velasco':
      return {
        bg: '#5aa9ff',
        shadow: 'rgba(90, 169, 255, 0.20)'
      }
    case 'lasalle':
      return {
        bg: '#b07cff',
        shadow: 'rgba(176, 124, 255, 0.22)'
      }
    default:
      return {
        bg: '#50ff78',
        shadow: 'rgba(80, 255, 120, 0.18)'
      }
  }
}

function assignReservationBuildingKeys () {
  if (!reservationList) return

  const cards = Array.from(reservationList.querySelectorAll('.res-card'))

  cards.forEach(card => {
    const roomEl = card.querySelector('.res-room')
    const timeEl = card.querySelector('.res-time')

    const roomText = roomEl ? roomEl.textContent : ''
    const timeText = timeEl ? timeEl.textContent : ''
    const combinedText = `${roomText} ${timeText}`

    const buildingKey = inferBuildingKey(
      card.dataset.bldg ||
        card.dataset.building ||
        card.dataset.lab ||
        combinedText
    )

    card.dataset.bldg = buildingKey
  })
}

function applyLabBuildingStyles () {
  if (!labGrid) return

  const labCards = Array.from(labGrid.querySelectorAll('.lab-room'))

  labCards.forEach(card => {
    const sub = card.querySelector('.lab-sub')
    const pill = card.querySelector('.lab-pill')

    const buildingText = sub ? sub.textContent : ''
    const buildingKey = inferBuildingKey(buildingText)

    card.dataset.bldg = buildingKey

    if (!pill) return

    const colors = getBuildingColor(buildingKey)

    pill.style.background = colors.bg
    pill.style.boxShadow = `0 10px 24px ${colors.shadow}`
  })
}

function renderLabsByFilter () {
  if (!labGrid) return

  const labCards = Array.from(labGrid.querySelectorAll('.lab-room'))

  labCards.forEach(card => {
    const key = card.dataset.bldg || ''

    if (!key) {
      card.style.display = ''
      return
    }

    card.style.display = activeBuildingFilters.has(key) ? '' : 'none'
  })
}

function syncChecks () {
  filterChecks.forEach(check => {
    check.checked = activeBuildingFilters.has(check.value)
  })
}

/* =====================================================
   Reservations Styling + Mapping
   ===================================================== */

function applyReservationStyles () {
  if (!reservationList) return

  assignReservationBuildingKeys()

  const cards = Array.from(reservationList.querySelectorAll('.res-card'))

  cards.forEach(card => {
    const bar = card.querySelector('.res-accent-bar')
    const buildingKey = card.dataset.bldg || ''

    if (!bar) return

    const colors = getBuildingColor(buildingKey)

    bar.style.background = colors.bg
    bar.style.boxShadow = `0 10px 24px ${colors.shadow}`
  })
}

function buildReservationMap () {
  const map = new Map()

  if (!reservationList) return map

  assignReservationBuildingKeys()

  const cards = Array.from(reservationList.querySelectorAll('.res-card'))

  cards.forEach(card => {
    const rawDate = card.dataset.date || ''
    const dateISO = normalizeReservationDateToISO(rawDate)
    const buildingKey = card.dataset.bldg || ''

    if (!dateISO || !buildingKey) return

    if (!map.has(dateISO)) {
      map.set(dateISO, new Set())
    }

    map.get(dateISO).add(buildingKey)
  })

  return map
}

/* =====================================================
   Live Reservation Status
   ===================================================== */

function setLiveStatusState (state, payload = {}) {
  if (!liveStatusBox) return

  liveStatusBox.dataset.state = state

  if (state === 'active') {
    const activeCount = document.getElementById('liveActiveCount')
    const activeRoom = document.getElementById('liveActiveRoom')
    const activeStart = document.getElementById('liveActiveStart')
    const activeEnd = document.getElementById('liveActiveEnd')

    if (activeCount) activeCount.textContent = payload.count || '0'
    if (activeRoom) activeRoom.textContent = payload.room || ''
    if (activeStart) activeStart.textContent = payload.start || ''
    if (activeEnd) activeEnd.textContent = payload.end || ''
    return
  }

  if (state === 'pending') {
    const pendingCount = document.getElementById('livePendingCount')
    const pendingRoom = document.getElementById('livePendingRoom')
    const pendingStart = document.getElementById('livePendingStart')
    const pendingEnd = document.getElementById('livePendingEnd')

    if (pendingCount) pendingCount.textContent = payload.count || '0'
    if (pendingRoom) pendingRoom.textContent = payload.room || ''
    if (pendingStart) pendingStart.textContent = payload.start || ''
    if (pendingEnd) pendingEnd.textContent = payload.end || ''
    return
  }
}

function getReservationCardsForLiveStatus () {
  if (!reservationList) return []
  return Array.from(reservationList.querySelectorAll('.res-card'))
}

function extractLiveReservations () {
  assignReservationBuildingKeys()

  const cards = getReservationCardsForLiveStatus()

  return cards
    .map(card => {
      const roomTextEl = card.querySelector('.res-room')
      const roomText = roomTextEl ? roomTextEl.textContent.trim() : ''

      const rawDate = card.dataset.date || ''
      const rawTime = card.dataset.time || ''
      const buildingKey = card.dataset.bldg || ''

      const normalizedDate = normalizeReservationDateToISO(rawDate)
      const normalizedTime = normalizeTimeRange(rawTime)

      const start = parseReservationDateTime(rawDate, normalizedTime, 'start')
      const end = parseReservationDateTime(rawDate, normalizedTime, 'end')

      return {
        roomText,
        dateISO: normalizedDate,
        timeSlot: normalizedTime,
        buildingKey,
        start,
        end
      }
    })
    .filter(item => {
      return (
        item.roomText &&
        item.dateISO &&
        item.timeSlot &&
        item.start instanceof Date &&
        !Number.isNaN(item.start.getTime()) &&
        item.end instanceof Date &&
        !Number.isNaN(item.end.getTime()) &&
        item.end > item.start
      )
    })
    .sort((a, b) => a.start - b.start)
}

function updateLiveStatus () {
  if (!liveStatusBox) return

  const now = new Date()
  const reservations = extractLiveReservations()

  if (!reservations.length) {
    setLiveStatusState('none')
    return
  }

  const activeReservations = reservations.filter(
    res => now >= res.start && now < res.end
  )

  if (activeReservations.length) {
    const currentReservation = activeReservations.sort(
      (a, b) => a.end - b.end
    )[0]

    setLiveStatusState('active', {
      count: formatMinutesRemaining(currentReservation.end - now),
      room: currentReservation.roomText,
      start: `Started: ${formatTimeDisplay(currentReservation.start)}`,
      end: `Ends: ${formatTimeDisplay(currentReservation.end)}`
    })
    return
  }

  const pendingReservations = reservations
    .filter(res => res.start > now)
    .sort((a, b) => a.start - b.start)

  if (pendingReservations.length) {
    const nearestPending = pendingReservations[0]

    setLiveStatusState('pending', {
      count: formatPendingCountdown(nearestPending.start - now),
      room: nearestPending.roomText,
      start: `Starts at: ${formatTimeDisplay(nearestPending.start)}`,
      end: `Ends at: ${formatTimeDisplay(nearestPending.end)}`
    })
    return
  }

  setLiveStatusState('none')
}

function startLiveStatusTimer () {
  if (!liveStatusBox) return

  if (liveStatusInterval) {
    clearInterval(liveStatusInterval)
  }

  updateLiveStatus()
  liveStatusInterval = setInterval(updateLiveStatus, 1000)
}

/* =====================================================
   Calendar Rendering
   ===================================================== */

function getCalendarGradientForBuildings (buildingSet) {
  const orderedKeys = ['andrew', 'gokongwei', 'velasco', 'lasalle'].filter(
    key => buildingSet.has(key)
  )

  const colorMap = {
    andrew: '#50ff78',
    gokongwei: '#ff9b54',
    velasco: '#5aa9ff',
    lasalle: '#b07cff'
  }

  const colors = orderedKeys.map(key => colorMap[key]).filter(Boolean)

  if (!colors.length) {
    return '#50ff78'
  }

  if (colors.length === 1) {
    return colors[0]
  }

  return `linear-gradient(135deg, ${colors.join(', ')})`
}

function renderCalendar () {
  if (!calGrid) return

  const resMap = buildReservationMap()
  const todayKey = toISODateKey(new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  if (calMonthLabel) {
    calMonthLabel.textContent = viewDate.toLocaleString(undefined, {
      month: 'long',
      year: 'numeric'
    })
  }

  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)

  const startPad = mondayIndex(first.getDay())
  const daysInMonth = last.getDate()

  const cells = []

  for (let i = 0; i < startPad; i++) {
    cells.push({ empty: true })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d)
    const key = toISODateKey(dateObj)

    cells.push({
      empty: false,
      day: d,
      key
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ empty: true })
  }

  calGrid.innerHTML = cells
    .map(cell => {
      if (cell.empty) {
        return `<span class="empty"></span>`
      }

      const classes = []

      if (cell.key === todayKey) {
        classes.push('today')
      }

      return `<span class="${classes.join(' ')}" data-date="${cell.key}">${
        cell.day
      }</span>`
    })
    .join('')

  const daySpans = Array.from(calGrid.querySelectorAll('span[data-date]'))

  daySpans.forEach(dayEl => {
    const dateKey = dayEl.dataset.date
    const buildingSet = resMap.get(dateKey)

    if (!buildingSet || !buildingSet.size) return

    dayEl.classList.add('has-res')
    dayEl.style.setProperty(
      '--calendar-bg',
      getCalendarGradientForBuildings(buildingSet)
    )

    dayEl.style.position = 'relative'
    dayEl.style.setProperty('background', 'transparent')
    dayEl.style.setProperty('z-index', '0')
    dayEl.style.setProperty('--calendar-shadow', 'none')
    dayEl.setAttribute('data-hasres', 'true')
  })

  const styleId = 'dashboard-calendar-inline-style'
  let styleTag = document.getElementById(styleId)

  if (!styleTag) {
    styleTag = document.createElement('style')
    styleTag.id = styleId
    document.head.appendChild(styleTag)
  }

  styleTag.textContent = `
    .cal-days span[data-hasres="true"]::after{
      content:"";
      position:absolute;
      width:30px;
      height:30px;
      border-radius:50%;
      z-index:-2;
      opacity:0.95;
      background:var(--calendar-bg, #50ff78);
      box-shadow:var(--calendar-shadow, none);
    }
  `
}

/* =====================================================
   Filter Popup Logic
   ===================================================== */

if (filterBtn && filterPop) {
  filterBtn.addEventListener('click', e => {
    e.stopPropagation()
    syncChecks()
    filterPop.classList.toggle('show')
  })
}

if (applyFilters) {
  applyFilters.addEventListener('click', () => {
    activeBuildingFilters = new Set(
      filterChecks.filter(check => check.checked).map(check => check.value)
    )

    renderLabsByFilter()

    if (filterPop) {
      filterPop.classList.remove('show')
    }
  })
}

/* =====================================================
   Global Click Handler
   ===================================================== */

document.addEventListener('click', e => {
  if (!filterPop) return

  const clickedInsideFilter = e.target.closest('.hero-actions')

  if (!clickedInsideFilter) {
    filterPop.classList.remove('show')
  }
})

/* =====================================================
   Calendar Navigation
   ===================================================== */

if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
    renderCalendar()
  })
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
    renderCalendar()
  })
}

/* =====================================================
   Initial Render
   ===================================================== */

applyLabBuildingStyles()
renderLabsByFilter()
applyReservationStyles()
renderCalendar()
startLiveStatusTimer()
