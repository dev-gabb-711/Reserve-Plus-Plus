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
      const role = localStorage.getItem('reserveRole')
      window.location.href =
        role === 'Admin' ? '/admin-dashboard' : '/dashboard'
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

const editForm = document.getElementById('editProfileForm')

if (editForm) {
  editForm.addEventListener('submit', function (e) {
    e.preventDefault()

    const formData = new FormData(editForm)

    fetch(editForm.action, {
      method: 'POST',
      body: formData // No need for 'headers', automatic na ang multipart/form-data
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Update avatar preview with cache-busting
          if (data.profilePic) {
            avatarPreview.src = `${data.profilePic}?t=${new Date().getTime()}`
          }
          alert('Profile updated successfully!')

          window.location.href = `/profile/${data.userId || ''}`
        } else {
          alert(data.message || 'Error updating profile')
        }
      })
      .catch(err => {
        console.error(err)
        alert('An error occurred. Please check your connection.')
      })
  })
}
