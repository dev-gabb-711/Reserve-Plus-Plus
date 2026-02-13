
const editBtn = document.getElementById("editBtn");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

const viewMode = document.getElementById("viewMode");
const editMode = document.getElementById("editMode");
const leftViewActions = document.getElementById("leftViewActions");
const leftEditActions = document.getElementById("leftEditActions");

const viewName = document.getElementById("viewName");
const viewEmail = document.getElementById("viewEmail");
const viewPass = document.getElementById("viewPass");

const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passInput = document.getElementById("passInput");

const avatarFile = document.getElementById("avatarFile");
const avatarPreview = document.getElementById("avatarPreview");

function setEdit(isEdit){
  viewMode.classList.toggle("is-hidden", isEdit);
  editMode.classList.toggle("is-hidden", !isEdit);
  leftViewActions.classList.toggle("is-hidden", isEdit);
  leftEditActions.classList.toggle("is-hidden", !isEdit);
}

editBtn.onclick = () => setEdit(true);

cancelBtn.onclick = () => {
  nameInput.value = viewName.textContent;
  emailInput.value = viewEmail.textContent;
  passInput.value = "passwordpassword";
  setEdit(false);
};

saveBtn.onclick = () => {
  viewName.textContent = nameInput.value.trim() || "User";
  viewEmail.textContent = emailInput.value.trim() || "sample.email@dlsu.edu.ph";
  viewPass.textContent = "****************";
  setEdit(false);
};

avatarFile.onchange = (e) => {
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  avatarPreview.src = url;
};