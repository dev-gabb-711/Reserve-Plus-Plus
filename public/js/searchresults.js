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
   FILTER LOGIC
   ===================================================== */

function applyAllFilters () {
  const q = getSearchQuery()
  current = DATA.filter(item => matchesSearch(item, q))
  render()
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

    /* ================= USER RESULT ================= */

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
    }

    /* ================= LAB RESULT ================= */

    else {
      const barClass = item.buildingCode === 'G' ? 'bld-g' : 'bld-a'
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
  /* Live filter on current results while typing */
  searchInput.addEventListener('input', applyAllFilters)

  /* Real database search on Enter */
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
   INITIAL LOAD
   ===================================================== */

syncSearchInputWithUrl()
applyAllFilters()