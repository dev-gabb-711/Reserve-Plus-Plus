/* =====================================================
   PROFILE PAGE SCRIPT
   - Avatar preview
   - Delete account modal submit
   - Close button redirect
   - Horizontal reservation scroll
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const avatarFile = document.getElementById('avatarFile')
  const avatarPreview = document.getElementById('avatarPreview')

  const deleteForm = document.getElementById('deleteProfileForm')
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn')

  const closeButtons = document.querySelectorAll('.profile-close-btn')

  const scrollRows = document.querySelectorAll(
    '.reservations-grid--outsider, .reservations-grid--owner'
  )

  if (avatarFile && avatarPreview) {
    avatarFile.addEventListener('change', event => {
      const file = event.target.files?.[0]
      if (!file) return

      const previewUrl = URL.createObjectURL(file)
      avatarPreview.src = previewUrl
    })
  }

  if (confirmDeleteBtn && deleteForm) {
    confirmDeleteBtn.addEventListener('click', () => {
      deleteForm.submit()
    })
  }

  closeButtons.forEach(btn => {
    btn.addEventListener('click', event => {
      event.preventDefault()
      window.location.href = '/dashboard'
    })
  })

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