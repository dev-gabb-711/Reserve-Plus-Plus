/* =====================================================
   PROFILE PAGE SCRIPT
   - Avatar preview
   - Delete account modal submit
   - Horizontal reservation scroll
   - Alert replacement via Bootstrap toasts
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
      <span class="material-symbols-rounded me-2 mt-1 ${tone.iconClass}">${
    tone.icon
  }</span>
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

document.addEventListener('DOMContentLoaded', () => {
  const avatarFile = document.getElementById('avatarFile')
  const avatarPreview = document.getElementById('avatarPreview')

  const deleteForm = document.getElementById('deleteProfileForm')
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn')

  const scrollRows = document.querySelectorAll(
    '.reservations-grid--outsider, .reservations-grid--owner'
  )

  const editForm = document.getElementById('editProfileForm')

  if (avatarFile && avatarPreview) {
    avatarFile.addEventListener('change', event => {
      const file = event.target.files?.[0]
      if (!file) return

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']

      if (!allowedTypes.includes(file.type)) {
        event.target.value = ''
        showToast({
          title: 'Invalid file type',
          message: 'Please upload an image file in JPG, PNG, or GIF format.',
          variant: 'warning',
          delay: 4500
        })
        return
      }

      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        event.target.value = ''
        showToast({
          title: 'File too large',
          message: 'Please upload an image smaller than 2MB.',
          variant: 'warning',
          delay: 4500
        })
        return
      }

      const previewUrl = URL.createObjectURL(file)
      avatarPreview.src = previewUrl
    })
  }

  if (confirmDeleteBtn && deleteForm) {
    confirmDeleteBtn.addEventListener('click', () => {
      deleteForm.submit()
    })
  }

  scrollRows.forEach(row => {
    row.addEventListener(
      'wheel',
      e => {
        e.preventDefault()
        row.scrollBy({
          left: e.deltaY * 1.2,
          behavior: 'smooth'
        })
      },
      { passive: false }
    )
  })

  if (editForm) {
    editForm.addEventListener('submit', function (e) {
      e.preventDefault()

      const formData = new FormData(editForm)

      fetch(editForm.action, {
        method: 'POST',
        body: formData
      })
        .then(async res => {
          if (res.status === 401) {
            showToast({
              title: 'Session Expired',
              message: 'You have been logged out. Redirecting to login...',
              variant: 'danger'
            })
            setTimeout(() => {
              location.assign('/login')
            }, 2500)
            return
          }

          let data = {}

          try {
            data = await res.json()
          } catch (err) {
            data = {}
          }

          return { ok: res.ok, data }
        })
        .then(({ ok, data }) => {
          if (ok && data.success) {
            if (data.profilePic && avatarPreview) {
              avatarPreview.src = `${data.profilePic}?t=${new Date().getTime()}`
            }

            showToast({
              title: 'Profile updated',
              message: 'Your profile was updated successfully.',
              variant: 'success',
              delay: 2200
            })

            setTimeout(() => {
              location.assign(`/profile/${data.userId || ''}`)
            }, 900)
          } else {
            showToast({
              title: 'Update failed',
              message: data.message || 'Error updating profile.',
              variant: 'danger',
              delay: 4500
            })
          }
        })
        .catch(err => {
          console.error(err)
          showToast({
            title: 'Connection error',
            message: 'An error occurred. Please check your connection.',
            variant: 'danger',
            delay: 4500
          })
        })
    })
  }
})
