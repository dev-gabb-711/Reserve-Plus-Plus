/* =====================================================
   PROFILE PAGE SCRIPT
   - Supports backend-rendered profile modes
   - Handles avatar preview in edit mode
   - Handles delete-account confirmation
   - Handles close button fallback
   ===================================================== */

/* =====================================================
   DOM REFERENCES
   ===================================================== */

const avatarFile = document.getElementById('avatarFile')
const avatarPreview = document.getElementById('avatarPreview')

const deleteForm = document.getElementById('deleteProfileForm')
const deleteBtn = document.getElementById('deleteBtn')

const closeButtons = document.querySelectorAll('.profile-close-btn')

/* =====================================================
   AVATAR UPLOAD PREVIEW
   ===================================================== */

if (avatarFile && avatarPreview) {
  avatarFile.addEventListener('change', event => {
    const file = event.target.files && event.target.files[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    avatarPreview.src = previewUrl
  })
}

/* =====================================================
   DELETE ACCOUNT CONFIRMATION
   ===================================================== */

if (deleteBtn && deleteForm) {
  deleteBtn.addEventListener('click', event => {
    event.preventDefault()

    const isConfirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )

    if (isConfirmed) {
      deleteForm.submit()
    }
  })
}

/* =====================================================
   CLOSE BUTTON HANDLER
   ===================================================== */

closeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/dashboard'
    }
  })
})

/* =====================================================
   HORIZONTAL SCROLL FOR RESERVATION ROWS
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const scrollRows = document.querySelectorAll(
    '.reservations-grid--outsider, .reservations-grid--owner'
  )

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
})