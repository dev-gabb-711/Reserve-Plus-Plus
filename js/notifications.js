

// Avatar generator (Replace with real pictures)
function makeAvatar(color)
{
  return `
  data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>
    <rect width='100' height='100' rx='50' fill='${color}'/>
    <circle cx='50' cy='40' r='15' fill='white'/>
    <rect x='30' y='55' width='40' height='25' rx='12' fill='white'/>
  </svg>
  `;
}


// Notifications data
let notifications =
[
  {
    id:1,
    name:"IT Assist",
    role:"Lab Technician",
    snippet:"PC Concern has been resolved",
    body:"Your PC concern has been successfully resolved.",
    avatar:makeAvatar("purple")
  },

  {
    id:2,
    name:"Reserve++ Team",
    role:"System",
    snippet:"Please answer this survey",
    body:"Please answer the feedback survey.",
    avatar:makeAvatar("blue")
  },

  {
    id:3,
    name:"Room A1103 • Seat 1",
    role:"Reservation",
    snippet:"Reservation cancelled successfully",
    body:"Your reservation has been cancelled.",
    avatar:makeAvatar("teal")
  }

];


let selectedID = null;

const notifList = document.getElementById("notifList");
const detailAvatar = document.getElementById("detailAvatar");
const detailTitle = document.getElementById("detailTitle");
const detailRole = document.getElementById("detailRole");
const detailBody = document.getElementById("detailBody");

const searchInput = document.getElementById("searchInput");

// Render notifications
function renderNotifications(list)
{
  notifList.innerHTML = "";

  list.forEach(function(n)
  {
    let item = document.createElement("div");

    item.className = "notif-item" + (n.id === selectedID ? " active" : "");

    item.innerHTML =
    `
      <img src="${n.avatar}" class="avatar">

      <div>
        <div class="notif-name">${n.name}</div>
        <div class="notif-snippet">${n.snippet}</div>
      </div>
    `;

    item.onclick = function()
    {
      selectNotification(n.id);
      renderNotifications(list);
    };

    notifList.appendChild(item);
  });
}



// Select notification
function selectNotification(id)
{
  let n = notifications.find(x => x.id === id);
  if (!n) return;

  selectedID = id;

  detailAvatar.src = n.avatar;
  detailTitle.innerText = n.name;
  detailRole.innerText = n.role;
  detailBody.innerText = n.body;
}

// Remove notification
document
.getElementById("removeBtn")
.onclick =
function()
{

  if(selectedID == null)
  return;

  notifications =
  notifications.filter(
    x => x.id !== selectedID
  );

  renderNotifications(notifications);

};

// Cancel selection
document
.getElementById("cancelBtn")
.onclick =
function()
{

  selectedID = null;

  detailTitle.innerText =
  "Notifications";

  detailRole.innerText =
  "";

  detailBody.innerText =
  "Select a notification";

};

// Search
searchInput.oninput =
function()
{

  let text =
  this.value.toLowerCase();

  let filtered =
  notifications.filter(
    n =>
      n.name.toLowerCase().includes(text)
  );

  renderNotifications(filtered);

};


// Initial render
renderNotifications(notifications);

// function for keeping track of which dashboard to visit
function goToDashboard() {
        const role = localStorage.getItem('role');

        if (role === 'admin') {
            location.href = './admindashboard.html';
        } else {
            location.href = './dashboard.html';
        }
}