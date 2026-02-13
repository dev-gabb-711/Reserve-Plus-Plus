/* =====================================================
   DOM References: Buttons
   ===================================================== */

const editBtn = document.getElementById("editBtn");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");


/* =====================================================
   DOM References: Mode Containers + Action Groups
   ===================================================== */

const viewMode = document.getElementById("viewMode");
const editMode = document.getElementById("editMode");
const leftViewActions = document.getElementById("leftViewActions");
const leftEditActions = document.getElementById("leftEditActions");


/* =====================================================
   DOM References: Display Fields (View Mode)
   ===================================================== */

const viewName = document.getElementById("viewName");
const viewEmail = document.getElementById("viewEmail");
const viewPass = document.getElementById("viewPass");


/* =====================================================
   DOM References: Inputs (Edit Mode)
   ===================================================== */

const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passInput = document.getElementById("passInput");


/* =====================================================
   DOM References: Avatar Upload
   ===================================================== */

const avatarFile = document.getElementById("avatarFile");
const avatarPreview = document.getElementById("avatarPreview");


/* =====================================================
   View/Edit Mode Toggle
   ===================================================== */

/**
 * Switches between view mode and edit mode.
 * - isEdit = true  -> show edit UI, hide view UI
 * - isEdit = false -> show view UI, hide edit UI
 */
function setEdit(isEdit) {
  viewMode.classList.toggle("is-hidden", isEdit);
  editMode.classList.toggle("is-hidden", !isEdit);
  leftViewActions.classList.toggle("is-hidden", isEdit);
  leftEditActions.classList.toggle("is-hidden", !isEdit);
}


/* =====================================================
   Button Handlers
   ===================================================== */

/** Enter edit mode */
editBtn.onclick = () => setEdit(true);

/**
 * Cancel edits:
 * - Restores inputs from current view values
 * - Switches back to view mode
 */
cancelBtn.onclick = () => {
  nameInput.value = viewName.textContent;
  emailInput.value = viewEmail.textContent;

  // Demo placeholder password (avoid exposing real passwords in UI)
  passInput.value = "passwordpassword";

  setEdit(false);
};

/**
 * Save edits:
 * - Updates view mode text fields from input values
 * - Masks password display
 * - Switches back to view mode
 */
saveBtn.onclick = () => {
  viewName.textContent = nameInput.value.trim() || "User";
  viewEmail.textContent = emailInput.value.trim() || "sample.email@dlsu.edu.ph";
  viewPass.textContent = "****************";
  setEdit(false);
};


/* =====================================================
   Avatar Upload Preview
   ===================================================== */

/**
 * Updates avatar image preview when a new file is chosen.
 * Uses a temporary object URL for instant preview.
 */
avatarFile.onchange = (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  avatarPreview.src = url;
};

/* =====================================================
   Dashboard Routing (Role-based Redirect)
   ===================================================== */

function goToDashboard() {
    const role = localStorage.getItem('role');

    if (role === 'admin') {
        location.href = './admindashboard.html';
    } else {
        location.href = './dashboard.html';
    }
}
