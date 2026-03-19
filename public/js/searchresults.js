/* =====================================================
   DATA SOURCE
   ===================================================== */

const rawSearchResults = document.getElementById('searchResultsData')
const DATA = rawSearchResults ? JSON.parse(rawSearchResults.textContent) : []

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

function getUrlQuery () {
  const params = new URLSearchParams(window.location.search)
  return (params.get('q') || '').trim()
}

function syncSearchInputWithUrl () {
  if (!searchInput) return
  searchInput.value = getUrlQuery()
}

/* =====================================================
   SEARCH HELPERS
   ===================================================== */

function getSearchQuery () {
  return (searchInput?.value || '').trim().toLowerCase()
}

function matchesSearch (item, q) {
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

function matchesBuilding (item, building) {
  if (!building || item.type === 'user') return true
  return item.buildingCode === building
}

function matchesRoom (item, room) {
  if (!room || item.type === 'user') return true
  return String(item.room).includes(room)
}

function matchesDate (item, date) {
  if (!date || item.type === 'user') return true
  return item.date === date
}

function sortResults (items, sortValue) {
  const sorted = [...items]

  if (sortValue === 'room') {
    sorted.sort((a, b) => {
      if (a.type === 'user' || b.type === 'user') return 0
      return Number(a.room) - Number(b.room)
    })
  }

  return sorted
}

/* =====================================================
   APPLY FILTERS
   ===================================================== */

function applyAllFilters () {
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

function openFilterPanel () {
  filterPanel.classList.add('show')
  filterPanel.setAttribute('aria-hidden', 'false')
}

function closeFilterPanel () {
  filterPanel.classList.remove('show')
  filterPanel.setAttribute('aria-hidden', 'true')
}

function toggleFilterPanel () {
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
    buildingFilter.value = ''
    roomFilter.value = ''
    dateFilter.value = ''
    sortFilter.value = 'soonest'

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
function render () {
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
      const safeCode = item.buildingCode
        ? item.buildingCode.toLowerCase()
        : 'default'
      const barClass = `bld-${safeCode}`

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
   FILTER POPULATION (Search Results)
   ===================================================== */
function populateSearchFilters () {
  const bldFilter = document.getElementById('buildingFilter')
  if (!bldFilter) return

  const uniqueBuildings = {}

  // 1. Scan all search results to find unique buildings
  if (typeof DATA !== 'undefined') {
    DATA.forEach(item => {
      // Only check items that have building data (ignoring user profiles)
      if (item.buildingCode && item.building) {
        uniqueBuildings[item.buildingCode] = item.building
      }
    })
  }

  // 2. Inject the dynamically found buildings into the dropdown
  Object.keys(uniqueBuildings).forEach(code => {
    const opt = document.createElement('option')
    opt.value = code
    opt.textContent = `${uniqueBuildings[code]} (${code})`
    bldFilter.appendChild(opt)
  })
}

// Run the function immediately
populateSearchFilters()

/* =====================================================
   INITIAL LOAD
   ===================================================== */

syncSearchInputWithUrl()
applyAllFilters()
