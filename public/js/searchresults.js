/* =====================================================
   DATA SOURCE
   ===================================================== */

const rawSearchResults = document.getElementById('searchResultsData')
const DATA = rawSearchResults ? JSON.parse(rawSearchResults.textContent) : []

/* =====================================================
   BUILDING HELPERS
   ===================================================== */

function normalizeBuildingKey(value) {
  const text = String(value || '')
    .trim()
    .toLowerCase()

  if (
    text.includes('gokongwei') ||
    text === 'g' ||
    text === 'gk' ||
    text.startsWith('g2') ||
    text.startsWith('g3') ||
    text.startsWith('g')
  ) {
    return 'gokongwei'
  }

  if (
    text.includes('andrew') ||
    text.includes('br. andrew') ||
    text.includes('br andrew') ||
    text === 'a' ||
    text.startsWith('a1') ||
    text.startsWith('a')
  ) {
    return 'andrew'
  }

  if (
    text.includes('velasco') ||
    text === 'v' ||
    text.startsWith('v2') ||
    text.startsWith('v3') ||
    text.startsWith('v4') ||
    text.startsWith('v')
  ) {
    return 'velasco'
  }

  if (
    text.includes('st. la salle') ||
    text.includes('st la salle') ||
    text.includes('lasalle') ||
    text.includes('la salle') ||
    text === 'ls' ||
    text.startsWith('ls')
  ) {
    return 'lasalle'
  }

  return 'default'
}

function getBuildingBarClass(item) {
  const buildingKey = normalizeBuildingKey(item.building || item.buildingCode || item.room)
  return `bld-${buildingKey}`
}

/* =====================================================
   BUILDING THEME HELPER
   ===================================================== */

function applyBuildingTheme(building) {
  const root = document.documentElement
  const key = normalizeBuildingKey(building)

  let color = '#2ecc71'
  let strong = '#27c468'
  let soft = 'rgba(46, 204, 113, 0.22)'
  let shadow = 'rgba(46, 204, 113, 0.22)'

  if (key === 'gokongwei') {
    color = '#ff9b54'
    strong = '#ff7a45'
    soft = 'rgba(255, 155, 84, 0.22)'
    shadow = 'rgba(255, 155, 84, 0.22)'
  } else if (key === 'velasco') {
    color = '#5aa9ff'
    strong = '#3f8cff'
    soft = 'rgba(90, 169, 255, 0.22)'
    shadow = 'rgba(90, 169, 255, 0.22)'
  } else if (key === 'lasalle') {
    color = '#b07cff'
    strong = '#9a60ff'
    soft = 'rgba(176, 124, 255, 0.22)'
    shadow = 'rgba(176, 124, 255, 0.22)'
  }

  root.style.setProperty('--active-building', color)
  root.style.setProperty('--active-building-strong', strong)
  root.style.setProperty('--active-building-soft', soft)
  root.style.setProperty('--active-building-shadow', shadow)
}

/* =====================================================
   DOM REFERENCES
   ===================================================== */

const resultList = document.getElementById('resultList')
const emptyState = document.getElementById('emptyState')
const searchInput = document.getElementById('searchInput')

const filterBtn = document.getElementById('filterBtn')
const filterPanel = document.getElementById('filterPanel')

const buildingFilter = document.getElementById('buildingFilter')
const roomFilter = document.getElementById('roomFilter')
const dateFilter = document.getElementById('dateFilter')
const sortFilter = document.getElementById('sortFilter')

const clearFilters = document.getElementById('clearFilters')
const applyFiltersBtn = document.getElementById('applyFilters')

/* =====================================================
   STATE
   ===================================================== */

let current = [...DATA]

/* =====================================================
   URL QUERY HELPERS
   ===================================================== */

function getUrlQuery() {
  const params = new URLSearchParams(window.location.search)
  return (params.get('q') || '').trim()
}

function syncSearchInputWithUrl() {
  if (!searchInput) return
  searchInput.value = getUrlQuery()
}

/* =====================================================
   SEARCH HELPERS
   ===================================================== */

function getSearchQuery() {
  return (searchInput?.value || '').trim().toLowerCase()
}

function matchesSearch(item, q) {
  if (!q) return true

  if (item.type === 'user') {
    const hay = [item.name, item.role].join(' ').toLowerCase()
    return hay.includes(q)
  }

  const hay = [
    item.building,
    item.buildingCode,
    item.room,
    String(item.seat),
    item.date || '',
    item.time || ''
  ]
    .join(' ')
    .toLowerCase()

  return hay.includes(q)
}

/* =====================================================
   FILTER HELPERS
   ===================================================== */

function matchesBuilding(item, building) {
  if (!building || item.type === 'user') return true

  const itemKey = normalizeBuildingKey(item.buildingCode || item.building || item.room)
  const filterKey = normalizeBuildingKey(building)

  return itemKey === filterKey
}

function matchesRoom(item, room) {
  if (!room || item.type === 'user') return true
  return String(item.room).toLowerCase().includes(room.toLowerCase())
}

function matchesDate(item, date) {
  if (!date || item.type === 'user') return true
  return item.date === date
}

function sortResults(items, sortValue) {
  const sorted = [...items]

  if (sortValue === 'room') {
    sorted.sort((a, b) => {
      if (a.type === 'user' || b.type === 'user') return 0

      const roomA = String(a.room || '').replace(/[^\d]/g, '')
      const roomB = String(b.room || '').replace(/[^\d]/g, '')

      return Number(roomA) - Number(roomB)
    })
  }

  return sorted
}

/* =====================================================
   APPLY FILTERS
   ===================================================== */

function applyAllFilters() {
  const q = getSearchQuery()

  const building = buildingFilter?.value || ''
  const room = roomFilter?.value.trim() || ''
  const date = dateFilter?.value || ''
  const sort = sortFilter?.value || 'soonest'

  current = DATA.filter(item => {
    return (
      matchesSearch(item, q) &&
      matchesBuilding(item, building) &&
      matchesRoom(item, room) &&
      matchesDate(item, date)
    )
  })

  current = sortResults(current, sort)

  render()
}

/* =====================================================
   FILTER PANEL TOGGLE
   ===================================================== */

function openFilterPanel() {
  if (!filterPanel) return
  filterPanel.classList.add('show')
  filterPanel.setAttribute('aria-hidden', 'false')
}

function closeFilterPanel() {
  if (!filterPanel) return
  filterPanel.classList.remove('show')
  filterPanel.setAttribute('aria-hidden', 'true')
}

function toggleFilterPanel() {
  if (!filterPanel) return

  if (filterPanel.classList.contains('show')) {
    closeFilterPanel()
  } else {
    openFilterPanel()
  }
}

if (filterBtn && filterPanel) {
  filterBtn.addEventListener('click', e => {
    e.stopPropagation()
    toggleFilterPanel()
  })

  filterPanel.addEventListener('click', e => {
    e.stopPropagation()
  })

  document.addEventListener('click', e => {
    if (!filterPanel.contains(e.target) && !filterBtn.contains(e.target)) {
      closeFilterPanel()
    }
  })

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeFilterPanel()
  })
}

/* =====================================================
   FILTER BUTTONS
   ===================================================== */

if (clearFilters) {
  clearFilters.addEventListener('click', () => {
    if (buildingFilter) buildingFilter.value = ''
    if (roomFilter) roomFilter.value = ''
    if (dateFilter) dateFilter.value = ''
    if (sortFilter) sortFilter.value = 'soonest'

    applyAllFilters()
  })
}

if (applyFiltersBtn) {
  applyFiltersBtn.addEventListener('click', () => {
    applyAllFilters()
    closeFilterPanel()
  })
}

/* =====================================================
   RENDERING RESULTS
   ===================================================== */

function render() {
  if (!resultList || !emptyState) return

  resultList.innerHTML = ''

  if (!current.length) {
    emptyState.hidden = false
    return
  }

  emptyState.hidden = true

  current.forEach(item => {
    const card = document.createElement('div')
    card.className = 'result-item'

    if (item.type === 'user') {
      card.innerHTML = `
        <img class="result-avatar" src="${item.avatar}" alt="${item.name}">
        <div class="result-main">
          <div class="result-title">${item.name}</div>
          <div class="result-meta">${item.role}</div>
        </div>
      `

      card.style.cursor = 'pointer'

      card.addEventListener('click', () => {
        window.location.href = `/profile/${item.userId}`
      })
    } else {
      const barClass = getBuildingBarClass(item)

      const title = `Room ${item.room} • Seat ${item.seat}`

      const meta =
        item.date && item.time
          ? `${item.date} | ${item.time} • ${item.building}`
          : `${item.building}`

      card.innerHTML = `
        <div class="building-bar ${barClass}"></div>
        <div class="result-main">
          <div class="result-title">${title}</div>
          <div class="result-meta">${meta}</div>
        </div>
      `

      const buildingName = item.building || item.buildingCode || item.room

      card.addEventListener('mouseenter', () => {
        applyBuildingTheme(buildingName)
      })

      card.addEventListener('click', () => {
        applyBuildingTheme(buildingName)
      })
    }

    resultList.appendChild(card)
  })
}

/* =====================================================
   SEARCH INPUT BEHAVIOR
   ===================================================== */

if (searchInput) {
  searchInput.addEventListener('input', applyAllFilters)

  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault()

      const q = searchInput.value.trim()

      if (!q) {
        window.location.href = '/search-results'
        return
      }

      window.location.href = '/search-results?q=' + encodeURIComponent(q)
    }
  })
}

/* =====================================================
   FILTER POPULATION
   ===================================================== */

function populateSearchFilters() {
  const bldFilter = document.getElementById('buildingFilter')
  if (!bldFilter) return

  const uniqueBuildings = new Map()

  DATA.forEach(item => {
    if (item.type === 'user') return

    const key = normalizeBuildingKey(item.buildingCode || item.building || item.room)
    if (key === 'default') return

    let label = 'Br. Andrew Hall'

    if (key === 'gokongwei') {
      label = 'Gokongwei Hall'
    } else if (key === 'velasco') {
      label = 'Velasco Hall'
    } else if (key === 'lasalle') {
      label = 'St. La Salle Hall'
    }

    uniqueBuildings.set(key, label)
  })

  uniqueBuildings.forEach((label, key) => {
    const opt = document.createElement('option')
    opt.value = key
    opt.textContent = label
    bldFilter.appendChild(opt)
  })
}

populateSearchFilters()

/* =====================================================
   INITIAL LOAD
   ===================================================== */

syncSearchInputWithUrl()
applyBuildingTheme('andrew')
applyAllFilters()