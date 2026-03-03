/* =====================================================
   Application State
   - Central store for current building/lab, selections, reservations, and calendar state
   ===================================================== */
const appState = {
	currentBld: "Gokongwei Hall",
	currentLab: "201",
	selectedSeats: [],
	reservations: [],
	editingTargetId: null,
	viewDate: new Date(),
	selectedDate: new Date(),
	tempSlots: [],
	bookedDates: [],
	bookedSlots: [],
	data: {
		"Gokongwei Hall": {
			labs: ["201", "302", "305", "407"],
			bg: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('../img/gok_lab.jpg')"
		},
		"Andrew Gonzales Hall": {
			labs: ["1102", "1403", "1405", "1501", "1704"],
			bg: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('../img/ag_lab.jpg')"
		}
	}
};


/* =====================================================
   Bootstrapping
   - Initializes the UI once the DOM is ready
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
	randomizeOccupancy();
	refreshUI();
	renderReservations();


	/* =====================================================
	   Building + Lab Switching
	   ===================================================== */

	// Switch building and reset seat/lab selections
	document.getElementById('switchBuildingBtn').onclick = () => {
		appState.currentBld = (appState.currentBld.includes("Gok"))
			? "Andrew Gonzales Hall"
			: "Gokongwei Hall";

		appState.currentLab = appState.data[appState.currentBld].labs[0];
		appState.selectedSeats = [];

		randomizeOccupancy();
		refreshUI();
	};


	/* =====================================================
	   Reservation Editing / Deletion Modals
	   ===================================================== */

	// Cancel edit attempt (shows confirmation modal)
	document.getElementById('btnCancelEdit').onclick = () => {
		if (!appState.editingTargetId) return;
		new bootstrap.Modal(document.getElementById('confirmCancelModal')).show();
	};

	// Confirm edit (shows success modal)
	document.getElementById('btnConfirmEdit').onclick = () => {
		if (!appState.editingTargetId) return;
		new bootstrap.Modal(document.getElementById('successModal')).show();
	};


	/* =====================================================
	   Booking Flow (Open, Review, Submit)
	   ===================================================== */

	// Start booking flow (new reservation)
	document.getElementById('btnOpenModal').onclick = () => {
		appState.tempSlots = [];
		openBookingFlow();
	};

	// Move to summary screen (requires at least 1 selected time slot)
	document.getElementById('finalConfirm').onclick = () => {
		if (appState.tempSlots.length === 0) return;

		const dateStr = appState.selectedDate.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
		const timeRange = calculateTimeRange(appState.tempSlots);

		// Populate form with data
		populateReservationForm(dateStr, timeRange);

		bootstrap.Modal.getInstance(document.getElementById('reservationModal')).hide();
		setTimeout(() => { new bootstrap.Modal(document.getElementById('summaryModal')).show(); }, 400);
	};

	// Form submission handler
	document.getElementById('reservation-form').addEventListener('submit', (e) => {
		e.preventDefault();
		submitReservationForm();
	});

	// Delete reservation (after confirmation)
	document.getElementById('executeDelete').onclick = () => {
		const targetId = Number(appState.editingTargetId);

		appState.reservations = appState.reservations.filter(r => r.id !== targetId);
		appState.editingTargetId = null;

		renderReservations();
		bootstrap.Modal.getInstance(document.getElementById('confirmCancelModal')).hide();
		document.querySelector('.edit-desc').innerText = "Select a reservation to edit.";

		setTimeout(() => { new bootstrap.Modal(document.getElementById('cancelSuccessModal')).show(); }, 400);
	};

	// Continue editing (loads reservation seats + slots back into booking flow)
	document.getElementById('openEditFlow').onclick = () => {
		if (!appState.editingTargetId) {
			alert("Please select a reservation from the list first.");
			return;
		}

		const targetId = Number(appState.editingTargetId);
		const res = appState.reservations.find(r => r.id === targetId);

		if (res) {
			appState.selectedSeats = res.seat.toString().split(', ').map(s => parseInt(s));
			appState.tempSlots = res.slots ? [...res.slots] : [];
			openBookingFlow();
		}
	};
});


/* =====================================================
   Populate Reservation Form
   - Fills form fields with reservation data
   ===================================================== */
function populateReservationForm(dateStr, timeRange) {
	const labCode = appState.currentBld[0] + appState.currentLab;

	// Populate form inputs (hidden)
	document.getElementById('building').value = appState.currentBld;
	document.getElementById('lab').value = labCode;
	document.getElementById('seats').value = JSON.stringify(appState.selectedSeats);
	document.getElementById('date').value = dateStr;
	document.getElementById('time').value = timeRange;
	document.getElementById('slots').value = JSON.stringify(appState.tempSlots);
	document.getElementById('reservationId').value = appState.editingTargetId || '';

	// Update display spans with the same data
	document.getElementById('sumBld').innerText = appState.currentBld;
	document.getElementById('sumLabSeat').innerText = `${labCode} • Seat(s) ${appState.selectedSeats.join(', ')}`;
	document.getElementById('sumDate').innerText = dateStr;
	document.getElementById('sumTime').innerText = timeRange;
}


/* =====================================================
   Form Submission Handler
   - Extracts form data and logs to console
   ===================================================== */
function submitReservationForm() {
	const form = document.getElementById('reservation-form');
	const formData = new FormData(form);

	// Extract data from form fields
	const reservationData = {
		building: formData.get('building'),
		lab: formData.get('lab'),
		seats: JSON.parse(formData.get('seats')),
		date: formData.get('date'),
		time: formData.get('time'),
		slots: JSON.parse(formData.get('slots')),
		reservation_id: formData.get('reservation_id') || null,
		created_at: new Date().toISOString()
	};

	// Log extracted data to console
	console.log('=== RESERVATION DATA EXTRACTED FROM FORM ===');
	console.log('Building:', reservationData.building);
	console.log('Lab:', reservationData.lab);
	console.log('Seats:', reservationData.seats);
	console.log('Date:', reservationData.date);
	console.log('Time:', reservationData.time);
	console.log('Slots:', reservationData.slots);
	console.log('Reservation ID:', reservationData.reservation_id);
	console.log('Created At:', reservationData.created_at);
	console.log('Full Data:', reservationData);
	console.log('=============================================');

	// Show success with extracted data
	showReservationSuccess(reservationData);
}


/* =====================================================
   Show Reservation Success
   - Updates local state and shows success modal
   ===================================================== */
function showReservationSuccess(reservationData) {
	const dateStr = reservationData.date;
	const timeRange = reservationData.time;

	// Edit existing reservation
	if (reservationData.reservation_id) {
		const targetId = Number(reservationData.reservation_id);
		const resIndex = appState.reservations.findIndex(r => r.id === targetId);

		if (resIndex !== -1) {
			appState.reservations[resIndex].date = dateStr;
			appState.reservations[resIndex].time = timeRange;
			appState.reservations[resIndex].seat = reservationData.seats.join(', ');
			appState.reservations[resIndex].slots = [...reservationData.slots];
			appState.reservations[resIndex].building = reservationData.building;
		}
	}
	// Create new reservation
	else {
		appState.reservations.unshift({
			id: Date.now(),
			building: reservationData.building,
			lab: reservationData.lab,
			seat: reservationData.seats.join(', '),
			date: dateStr,
			time: timeRange,
			slots: [...reservationData.slots]
		});
	}

	// UI refresh after save
	renderReservations();
	appState.editingTargetId = null;
	document.querySelector('.edit-desc').innerText = "Select a reservation to edit.";

	const sumModalEl = document.getElementById('summaryModal');
	const sumModal = bootstrap.Modal.getInstance(sumModalEl);
	sumModal.hide();

	// Show success modal once summary modal fully closes
	sumModalEl.addEventListener('hidden.bs.modal', function () {
		new bootstrap.Modal(document.getElementById('successModal')).show();
		appState.selectedSeats = [];
		renderSeats();
	}, { once: true });
}


/* =====================================================
   Seat Grid Rendering
   - Displays 40 selectable seats and enables booking button when selected
   ===================================================== */
function renderSeats() {
	const grid = document.getElementById('seatContainer');
	grid.innerHTML = "";

	document.getElementById('btnOpenModal').disabled = true;
	document.getElementById('displayLabCode').innerText = (appState.currentBld[0] + appState.currentLab);

	for (let i = 1; i <= 40; i++) {
		const el = document.createElement('div');
		el.className = `seat-unit ${appState.selectedSeats.includes(i) ? 'selected' : ''}`;
		el.innerHTML = `<span class="material-symbols-rounded">desktop_windows</span> Seat ${i}`;

		// Toggle seat selection
		el.onclick = () => {
			if (appState.selectedSeats.includes(i)) {
				appState.selectedSeats = appState.selectedSeats.filter(s => s !== i);
				el.classList.remove('selected');
			} else {
				appState.selectedSeats.push(i);
				el.classList.add('selected');
			}
			document.getElementById('btnOpenModal').disabled = (appState.selectedSeats.length === 0);
		};

		grid.appendChild(el);
	}
}


/* =====================================================
   Occupancy Demo Generator
   - Randomly marks booked dates and time slots (placeholder behavior)
   ===================================================== */
function randomizeOccupancy() {
	appState.bookedDates = Array.from({ length: 4 }, () => {
		const day = Math.floor(Math.random() * 28) + 1;
		return `${appState.viewDate.getFullYear()}-${String(appState.viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	});

	const allSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"];
	appState.bookedSlots = allSlots.sort(() => 0.5 - Math.random()).slice(0, 3);
}


/* =====================================================
   Time Range Helper
   - Converts selected 30-min slots into a formatted range
   ===================================================== */
function calculateTimeRange(slots) {
	if (slots.length === 0) return "";

	const sorted = [...slots].sort((a, b) =>
		new Date('1970/01/01 ' + a) - new Date('1970/01/01 ' + b)
	);

	const start = sorted[0];
	const lastSlot = sorted[sorted.length - 1];

	let [time, modifier] = lastSlot.split(' ');
	let [hours, minutes] = time.split(':');

	let h = parseInt(hours, 10);
	if (h === 12) h = 0;
	if (modifier === 'PM') h += 12;

	const endDate = new Date(1970, 0, 1, h, parseInt(minutes, 10));
	endDate.setMinutes(endDate.getMinutes() + 30);

	const endStr = endDate.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	});

	return `${start} - ${endStr}`;
}


/* =====================================================
   Calendar Rendering
   - Displays month grid and handles date selection
   ===================================================== */
function renderCalendar() {
	const calGrid = document.getElementById('calendarEl');
	const monthYearStr = appState.viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

	// Build header + day labels
	calGrid.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 w-100" style="grid-column: span 7;">
            <button class="btn btn-sm btn-outline-light border-0" onclick="changeMonth(-1)">‹</button>
            <span class="fw-bold small">${monthYearStr}</span>
            <button class="btn btn-sm btn-outline-light border-0" onclick="changeMonth(1)">›</button>
        </div>
        <div class="cal-day-label">S</div><div class="cal-day-label">M</div><div class="cal-day-label">T</div>
        <div class="cal-day-label">W</div><div class="cal-day-label">T</div><div class="cal-day-label">F</div>
        <div class="cal-day-label">S</div>
    `;

	const year = appState.viewDate.getFullYear();
	const month = appState.viewDate.getMonth();
	const firstDay = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	// Padding for the first week (empty cells)
	for (let p = 0; p < firstDay; p++) calGrid.appendChild(document.createElement('div'));

	// Create day cells
	for (let d = 1; d <= daysInMonth; d++) {
		const dayEl = document.createElement('div');
		const checkDate = new Date(year, month, d).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});

		// Collect reserved time slots for this day (from user's reservations)
		const userSlotsForDay = appState.reservations
			.filter(r => r.date === checkDate)
			.reduce((acc, r) => acc.concat(r.slots || []), []);

		// Determine if the day should be marked unavailable
		const totalBookedCount = new Set([...userSlotsForDay, ...appState.bookedSlots]).size;
		const isDayFullyBooked = totalBookedCount >= 18;

		dayEl.className = `cal-day ${isDayFullyBooked ? 'unavailable' : ''} ${
			d === appState.selectedDate.getDate() && month === appState.selectedDate.getMonth() ? 'selected' : ''
		}`;

		// Visual indicator for days with reservations
		if (userSlotsForDay.length > 0 && !isDayFullyBooked) {
			dayEl.style.borderBottom = "2px solid #ff6b4a";
		}

		dayEl.innerText = d;

		// Allow selecting only if not fully booked
		if (!isDayFullyBooked) {
			dayEl.onclick = () => {
				appState.selectedDate = new Date(year, month, d);
				renderCalendar();
				renderTimeGrid();
			};
		}

		calGrid.appendChild(dayEl);
	}
}


/* =====================================================
   Month Navigation (Exposed to Window)
   - Used by inline onclick in calendar header buttons
   ===================================================== */
window.changeMonth = (dir) => {
	appState.viewDate.setMonth(appState.viewDate.getMonth() + dir);
	randomizeOccupancy();
	renderCalendar();
};


/* =====================================================
   Time Slot Grid Rendering
   - Shows 30-minute selectable chips for the selected date
   ===================================================== */
function renderTimeGrid() {
	const grid = document.getElementById('timeSlotGrid');
	grid.innerHTML = "";

	// Build 30-minute slots from 8:00 AM to 4:30 PM
	const slots = [];
	for (let h = 8; h <= 16; h++) {
		const ampm = h >= 12 ? 'PM' : 'AM';
		const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
		slots.push(`${String(displayH).padStart(2, '0')}:00 ${ampm}`);
		slots.push(`${String(displayH).padStart(2, '0')}:30 ${ampm}`);
	}

	const dateStr = appState.selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

	slots.forEach(s => {
		// Demo occupied slots (random)
		const isRandomOccupied = appState.bookedSlots.includes(s);

		// Occupied slots coming from user reservations (excluding the one being edited)
		const isUserReserved = appState.reservations.some(res => {
			const isSameDate = res.date === dateStr;
			const hasSlot = res.slots && res.slots.includes(s);
			const isNotBeingEdited = res.id !== Number(appState.editingTargetId);
			return isSameDate && hasSlot && isNotBeingEdited;
		});

		const isUnavailable = isRandomOccupied || isUserReserved;

		const chip = document.createElement('div');
		chip.className = `chip-time ${appState.tempSlots.includes(s) ? 'active' : ''} ${isUnavailable ? 'unavailable' : ''}`;
		chip.innerText = s;

		// Toggle slot selection (only if available)
		if (!isUnavailable) {
			chip.onclick = () => {
				chip.classList.toggle('active');
				const idx = appState.tempSlots.indexOf(s);
				idx > -1 ? appState.tempSlots.splice(idx, 1) : appState.tempSlots.push(s);
			};
		}

		grid.appendChild(chip);
	});
}


/* =====================================================
   Booking Flow Launcher
   - Opens the booking modal after preparing calendar + slots
   ===================================================== */
function openBookingFlow() {
	renderCalendar();
	renderTimeGrid();
	new bootstrap.Modal(document.getElementById('reservationModal')).show();
}


/* =====================================================
   UI Refresh (Header + Lab Navbar + Seats)
   ===================================================== */
function refreshUI() {
	document.getElementById('currentBuildingName').innerText = appState.currentBld;
	document.getElementById('heroBg').style.backgroundImage = appState.data[appState.currentBld].bg;

	const nav = document.getElementById('labNavBar');
	nav.innerHTML = appState.data[appState.currentBld].labs.map(l => `
        <button class="btn-lab-round ${appState.currentLab === l ? 'active' : ''}" onclick="setLab('${l}')">${l}</button>
    `).join('');

	renderSeats();
}


/* =====================================================
   Lab Switching
   ===================================================== */
function setLab(l) {
	appState.currentLab = l;
	appState.selectedSeats = [];
	randomizeOccupancy();
	refreshUI();
}


/* =====================================================
   Reservations List Rendering
   - Displays reservations and supports selecting one for edit
   ===================================================== */
function renderReservations() {
	const container = document.getElementById('activeResContainer');

	container.innerHTML = appState.reservations.map(res => {
		const building = String(res.building ?? "").toLowerCase().trim();
		const colorClass = building.includes("andrew gonzales")
			? "green"
			: (building.includes("gokongwei") ? "red" : "");

		const id = String(res.id);

		return `
      <div class="mini-card ${colorClass}" data-res-id="${id}" onclick="selectForEdit(event,'${id}')">
        <div class="accent"></div>
        <div class="info">
          <strong>${res.lab} • Seat(s) ${res.seat}</strong>
          <p>${res.date} | ${res.time}</p>
        </div>
      </div>
    `;
	}).join('');
}


/* =====================================================
   Reservation Selection for Editing (Exposed to Window)
   - Called by inline onclick from reservation cards
   ===================================================== */
window.selectForEdit = (e, id) => {
	const targetId = Number(id);
	appState.editingTargetId = targetId;

	const res = appState.reservations.find(r => r.id === targetId);
	if (!res) return;

	document.querySelector('.edit-desc').innerText = `Editing: ${res.lab} Seat(s) ${res.seat}`;

	// Reset borders, then highlight the selected card
	document.querySelectorAll('#activeResContainer .mini-card')
		.forEach(c => c.style.border = "1px solid rgba(255,255,255,0.12)");

	e.currentTarget.style.border = "1px solid #ff6b4a";
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