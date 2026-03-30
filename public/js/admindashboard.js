/* =====================================================
   DOM References
   ===================================================== */
const heroTrack = document.getElementById('heroTrack')
const ticketTrack = document.getElementById('ticketTrack')
const labSearch = document.getElementById('labSearch')
const announceText = document.getElementById('announceText')
const postBtn = document.getElementById('postBtn')
const clearBtn = document.getElementById('clearBtn')
const notifMini = document.getElementById('notifMini')

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
   Hero Carousel Controls
   ===================================================== */
function getHeroIndex () {
  const w = heroTrack?.clientWidth || 1
  return Math.round(heroTrack.scrollLeft / w)
}

function updateHeroArrows () {
  if (!heroTrack) return

  const cards = heroTrack.querySelectorAll('.hero-card')
  const idx = getHeroIndex()
  const isFirst = idx <= 0
  const isLast = idx >= cards.length - 1

  document
    .querySelectorAll('.hero-prev')
    .forEach(btn => (btn.style.display = isFirst ? 'none' : 'grid'))

  document
    .querySelectorAll('.hero-next')
    .forEach(btn => (btn.style.display = isLast ? 'none' : 'grid'))
}

function setupHeroScroll () {
  if (!heroTrack) return

  heroTrack.addEventListener('click', e => {
    const prev = e.target.closest('.hero-prev')
    const next = e.target.closest('.hero-next')
    if (!prev && !next) return

    const step = heroTrack.clientWidth
    heroTrack.scrollBy({
      left: prev ? -step : step,
      behavior: 'smooth'
    })
  })

  heroTrack.addEventListener('scroll', () => {
    requestAnimationFrame(updateHeroArrows)
  })

  window.addEventListener('resize', updateHeroArrows)
  updateHeroArrows()
}

/* =====================================================
   Horizontal Scroll Enhancement
   ===================================================== */
function enableWheelHorizontalScroll (el) {
  if (!el) return

  el.addEventListener(
    'wheel',
    e => {
      const canScrollX = el.scrollWidth > el.clientWidth + 1
      const insideRoomScroll = e.target.closest('.room-scroll')

      if (!canScrollX || insideRoomScroll) return

      const intentVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX)
      if (!intentVertical) return

      e.preventDefault()
      el.scrollBy({ left: e.deltaY, behavior: 'auto' })
    },
    { passive: false }
  )
}

/* =====================================================
   Search Navigation
   ===================================================== */
function setupLabSearch () {
  if (!labSearch) return

  labSearch.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return

    event.preventDefault()

    const keyword = labSearch.value.trim()
    if (!keyword) return

    window.location.href = `/search-results?q=${encodeURIComponent(keyword)}`
  })
}

/* =====================================================
   Announcement Helpers
   ===================================================== */
function setAnnouncementButtonState (isPosting) {
  if (!postBtn) return

  postBtn.disabled = isPosting
  postBtn.textContent = isPosting ? 'Posting...' : 'Post'
}

function clearAnnouncementField () {
  if (announceText) {
    announceText.value = ''
    announceText.focus()
  }
}

function escapeHtml (value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function prependMiniNotification (name, snippet) {
  if (!notifMini) return

  const item = document.createElement('div')
  item.className = 'mini-item'
  item.innerHTML = `
    <img
      src="/img/system_profile.png"
      class="mini-ava"
      alt="${escapeHtml(name)}"
      onerror="this.onerror=null;this.src='/img/system_profile.png';"
    >
    <div class="mini-text">
      <div class="mini-name">${escapeHtml(name)}</div>
      <div class="mini-snippet">${escapeHtml(snippet)}</div>
    </div>
  `

  notifMini.prepend(item)

  while (notifMini.children.length > 4) {
    notifMini.removeChild(notifMini.lastElementChild)
  }
}

/* =====================================================
   Announcement Buttons
   ===================================================== */
function setupAnnouncementActions () {
  if (clearBtn && announceText) {
    clearBtn.addEventListener('click', () => {
      clearAnnouncementField()
    })
  }

  if (postBtn && announceText) {
    postBtn.addEventListener('click', async () => {
      const value = announceText.value.trim()

      if (!value) {
        showToast({
          title: 'Empty Textbox',
          message: 'Please write an announcement first.',
          variant: 'warning'
        })
        return
      }

      try {
        setAnnouncementButtonState(true)

        const response = await fetch('/admin/announcements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            message: value
          })
        })

        if (response.status === 401) {
          showToast({
            title: 'Session Expired',
            message: 'Your session has ended. Logging you out...',
            variant: 'danger'
          })

          setTimeout(() => {
            location.replace('/logout')
          }, 2500)

          return
        }

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to post announcement.')
        }

        prependMiniNotification('Reserve++ Team', value)
        clearAnnouncementField()
        showToast({
          title: 'Success',
          message: 'Announcement posted successfully.',
          variant: 'success'
        })
      } catch (err) {
        console.error('Announcement posting failed:', err)

        const errorMsg = err.message.includes('<')
          ? 'Server error: Received HTML instead of data. Check server logs.'
          : err.message || 'Failed to post announcement.'
        showToast({
          title: 'Posting Failed',
          message: errorMsg,
          variant: 'danger'
        })
      } finally {
        setAnnouncementButtonState(false)
      }
    })
  }
}

/* =====================================================
   Initial Setup
   ===================================================== */
setupHeroScroll()
enableWheelHorizontalScroll(heroTrack)
enableWheelHorizontalScroll(ticketTrack)
setupLabSearch()
setupAnnouncementActions()
