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

const closeBtn = document.getElementById('closeBtn')

/* =====================================================
   AVATAR UPLOAD PREVIEW
   ===================================================== */

/**
 * Updates the visible avatar preview when the user selects
 * a new image file in edit mode.
 */
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

/**
 * Prevents accidental account deletion by asking the user
 * to confirm before the delete form is submitted.
 */
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

/**
 * Sends the user back to the previous page.
 * If there is no previous page in history, fall back
 * to the dashboard.
 */
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/dashboard'
    }
  })
}