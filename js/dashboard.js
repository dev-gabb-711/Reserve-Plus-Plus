document.addEventListener('DOMContentLoaded', () => {
	initLabScroller();
	initCalendar();
});

// =========================
// 1. Populate Lab Scroller
// =========================
function initLabScroller() {
	const container = document.getElementById('lab-scroll-container');

	// Sample Data (10 labs)
	const labsData = [
		{ room: "Room A1103 • Seat 1", bld: "Br. Andrew Gonzalez Hall", accent: "accent-red" },
		{ room: "Room G203 • Seat 4", bld: "Gokongwei Hall", accent: "accent-purple" },
		{ room: "Room A1105 • Seat 12", bld: "Br. Andrew Gonzalez Hall", accent: "accent-red" },
		{ room: "Room LS214 • Seat 2", bld: "St. La Salle Hall", accent: "accent-purple" },
		{ room: "Room V301 • Seat 8", bld: "Velasco Hall", accent: "accent-red" },
		{ room: "Room G305 • Seat 1", bld: "Gokongwei Hall", accent: "accent-purple" },
		{ room: "Room A1402 • Seat 5", bld: "Br. Andrew Gonzalez Hall", accent: "accent-red" },
		{ room: "Room Y401 • Seat 3", bld: "Yuchengco Hall", accent: "accent-purple" },
		{ room: "Room J202 • Seat 7", bld: "St. Joseph Hall", accent: "accent-red" },
		{ room: "Room A1103 • Seat 9", bld: "Br. Andrew Gonzalez Hall", accent: "accent-purple" },
	];

	// Generate HTML for each card
	labsData.forEach(lab => {
		const card = document.createElement('div');
		card.className = `lab-card ${lab.accent}`;
		card.innerHTML = `
            <div class="lab-info">
                <h4>${lab.room}</h4>
                <p>${lab.bld}</p>
            </div>
        `;
		container.appendChild(card);
	});
}


// =========================
// 2. Functional Calendar
// =========================
let currentDate = new Date();

function initCalendar() {
	renderCalendar();

	// Event Listeners for Prev/Next buttons
	document.getElementById('prev-month').addEventListener('click', () => {
		currentDate.setMonth(currentDate.getMonth() - 1);
		renderCalendar();
	});

	document.getElementById('next-month').addEventListener('click', () => {
		currentDate.setMonth(currentDate.getMonth() + 1);
		renderCalendar();
	});
}

function renderCalendar() {
	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();

	const monthYearText = document.getElementById('current-month-year');
	const daysGrid = document.getElementById('calendar-days-grid');

	// Update Header text (e.g., "February 2026")
	const monthNames = ["January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];
	monthYearText.innerText = `${monthNames[month]} ${year}`;

	// Calculations for grid generation
	// 1. Get day of week the 1st falls on (0=Sun, 1=Mon... 6=Sat). 
	//    We adjust so 0=Mon to match our grid layout.
	let firstDayIndex = new Date(year, month, 1).getDay();
	firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

	// 2. Get total days in current month
	const lastDateOfMonth = new Date(year, month + 1, 0).getDate();

	// Get today's actual date for highlighting
	const today = new Date();

	let daysHTML = "";

	// Add empty spans for days before the 1st of the month
	for (let i = 0; i < firstDayIndex; i++) {
		daysHTML += `<span class="empty"></span>`;
	}

	// Add actual dates
	for (let i = 1; i <= lastDateOfMonth; i++) {
		// Check if this date is officially "Today"
		const isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear());
		const activeClass = isToday ? 'current-date' : '';

		daysHTML += `<span class="${activeClass}">${i}</span>`;
	}

	daysGrid.innerHTML = daysHTML;
}

// function for keeping track of which dashboard to visit
function goToDashboard() {
        const role = localStorage.getItem('role');

        if (role === 'admin') {
            location.href = './admindashboard.html';
        } else {
            location.href = './dashboard.html';
        }
}