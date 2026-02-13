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
		"Gokongwei Hall": { labs: ["201", "302", "305", "407"], bg: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('../img/gok_lab.jpg')" },
		"Andrew Gonzales Hall": { labs: ["1102", "1403", "1405", "1501", "1704"], bg: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('../img/ag_lab.jpg')" }
	}
};

document.addEventListener('DOMContentLoaded', () => {
	randomizeOccupancy();
	refreshUI();
	renderReservations();

	document.getElementById('switchBuildingBtn').onclick = () => {
		appState.currentBld = (appState.currentBld.includes("Gok")) ? "Andrew Gonzales Hall" : "Gokongwei Hall";
		appState.currentLab = appState.data[appState.currentBld].labs[0];
		appState.selectedSeats = [];
		randomizeOccupancy();
		refreshUI();
	};

	document.getElementById('btnCancelEdit').onclick = () => {
		if (!appState.editingTargetId) return;
		new bootstrap.Modal(document.getElementById('confirmCancelModal')).show();
	};

	document.getElementById('btnConfirmEdit').onclick = () => {
		if (!appState.editingTargetId) return;
		new bootstrap.Modal(document.getElementById('successModal')).show();
	};

	document.getElementById('btnOpenModal').onclick = () => {
		appState.tempSlots = [];
		openBookingFlow();
	};

	document.getElementById('finalConfirm').onclick = () => {
		if (appState.tempSlots.length === 0) return;

		const dateStr = appState.selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		const timeRange = calculateTimeRange(appState.tempSlots);

		document.getElementById('sumBld').innerText = appState.currentBld;
		document.getElementById('sumLabSeat').innerText = `${appState.currentBld[0]}${appState.currentLab} • Seat(s) ${appState.selectedSeats.join(', ')}`;
		document.getElementById('sumDate').innerText = dateStr;
		document.getElementById('sumTime').innerText = timeRange;

		bootstrap.Modal.getInstance(document.getElementById('reservationModal')).hide();
		setTimeout(() => { new bootstrap.Modal(document.getElementById('summaryModal')).show(); }, 400);
	};

	document.getElementById('btnFinalSubmit').onclick = () => {
		const dateStr = appState.selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		const timeRange = calculateTimeRange(appState.tempSlots);

		if (appState.editingTargetId) {
			const targetId = Number(appState.editingTargetId);
			const resIndex = appState.reservations.findIndex(r => r.id === targetId);
			if (resIndex !== -1) {
				appState.reservations[resIndex].date = dateStr;
				appState.reservations[resIndex].time = timeRange;
				appState.reservations[resIndex].seat = appState.selectedSeats.join(', ');
				appState.reservations[resIndex].slots = [...appState.tempSlots];
				appState.reservations[resIndex].building = appState.reservations[resIndex].building ?? appState.currentBld;
			}
		} else {
			appState.reservations.unshift({
				id: Date.now(),
				building: appState.currentBld,
				lab: (appState.currentBld[0] + appState.currentLab),
				seat: appState.selectedSeats.join(', '),
				date: dateStr,
				time: timeRange,
				slots: [...appState.tempSlots]
			});
		}

		renderReservations();
		appState.editingTargetId = null;
		document.querySelector('.edit-desc').innerText = "Select a reservation to edit.";

		const sumModalEl = document.getElementById('summaryModal');
		const sumModal = bootstrap.Modal.getInstance(sumModalEl);
		sumModal.hide();

		sumModalEl.addEventListener('hidden.bs.modal', function () {
			const successModal = new bootstrap.Modal(document.getElementById('successModal'));
			successModal.show();
			appState.selectedSeats = [];
			renderSeats();
		}, { once: true });
	};

	document.getElementById('executeDelete').onclick = () => {
		const targetId = Number(appState.editingTargetId);
		appState.reservations = appState.reservations.filter(r => r.id !== targetId);
		appState.editingTargetId = null;
		renderReservations();
		bootstrap.Modal.getInstance(document.getElementById('confirmCancelModal')).hide();
		document.querySelector('.edit-desc').innerText = "Select a reservation to edit.";
		setTimeout(() => { new bootstrap.Modal(document.getElementById('cancelSuccessModal')).show(); }, 400);
	};

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

function renderSeats() {
	const grid = document.getElementById('seatContainer');
	grid.innerHTML = "";
	document.getElementById('btnOpenModal').disabled = true;
	document.getElementById('displayLabCode').innerText = (appState.currentBld[0] + appState.currentLab);

	for (let i = 1; i <= 40; i++) {
		const el = document.createElement('div');
		el.className = `seat-unit ${appState.selectedSeats.includes(i) ? 'selected' : ''}`;
		el.innerHTML = `<span class="material-symbols-rounded">desktop_windows</span> Seat ${i}`;

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

function randomizeOccupancy() {
	appState.bookedDates = Array.from({ length: 4 }, () => {
		const day = Math.floor(Math.random() * 28) + 1;
		return `${appState.viewDate.getFullYear()}-${String(appState.viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	});
	const allSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"];
	appState.bookedSlots = allSlots.sort(() => 0.5 - Math.random()).slice(0, 3);
}

function calculateTimeRange(slots) {
	if (slots.length === 0) return "";
	const sorted = [...slots].sort((a, b) => new Date('1970/01/01 ' + a) - new Date('1970/01/01 ' + b));
	const start = sorted[0];
	const lastSlot = sorted[sorted.length - 1];

	let [time, modifier] = lastSlot.split(' ');
	let [hours, minutes] = time.split(':');
	let h = parseInt(hours, 10);
	if (h === 12) h = 0;
	if (modifier === 'PM') h += 12;

	let endDate = new Date(1970, 0, 1, h, parseInt(minutes, 10));
	endDate.setMinutes(endDate.getMinutes() + 30);

	const endStr = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
	return `${start} - ${endStr}`;
}

function renderCalendar() {
	const calGrid = document.getElementById('calendarEl');
	const monthYearStr = appState.viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

	for (let p = 0; p < firstDay; p++) calGrid.appendChild(document.createElement('div'));

	for (let d = 1; d <= daysInMonth; d++) {
		const dayEl = document.createElement('div');
		const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		const checkDate = new Date(year, month, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

		const userSlotsForDay = appState.reservations
			.filter(r => r.date === checkDate)
			.reduce((acc, r) => acc.concat(r.slots || []), []);

		const totalBookedCount = new Set([...userSlotsForDay, ...appState.bookedSlots]).size;
		const isDayFullyBooked = totalBookedCount >= 18;

		dayEl.className = `cal-day ${isDayFullyBooked ? 'unavailable' : ''} ${d === appState.selectedDate.getDate() && month === appState.selectedDate.getMonth() ? 'selected' : ''}`;

		if (userSlotsForDay.length > 0 && !isDayFullyBooked) {
			dayEl.style.borderBottom = "2px solid #ff6b4a";
		}

		dayEl.innerText = d;

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

window.changeMonth = (dir) => {
	appState.viewDate.setMonth(appState.viewDate.getMonth() + dir);
	randomizeOccupancy();
	renderCalendar();
};

function renderTimeGrid() {
	const grid = document.getElementById('timeSlotGrid');
	grid.innerHTML = "";

	const slots = [];
	for (let h = 8; h <= 16; h++) {
		const ampm = h >= 12 ? 'PM' : 'AM';
		const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
		slots.push(`${String(displayH).padStart(2, '0')}:00 ${ampm}`);
		slots.push(`${String(displayH).padStart(2, '0')}:30 ${ampm}`);
	}

	const dateStr = appState.selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

	slots.forEach(s => {
		const isRandomOccupied = appState.bookedSlots.includes(s);

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

function openBookingFlow() {
	renderCalendar();
	renderTimeGrid();
	new bootstrap.Modal(document.getElementById('reservationModal')).show();
}

function refreshUI() {
	document.getElementById('currentBuildingName').innerText = appState.currentBld;
	document.getElementById('heroBg').style.backgroundImage = appState.data[appState.currentBld].bg;
	const nav = document.getElementById('labNavBar');
	nav.innerHTML = appState.data[appState.currentBld].labs.map(l => `
        <button class="btn-lab-round ${appState.currentLab === l ? 'active' : ''}" onclick="setLab('${l}')">${l}</button>
    `).join('');
	renderSeats();
}

function setLab(l) {
	appState.currentLab = l;
	appState.selectedSeats = [];
	randomizeOccupancy();
	refreshUI();
}

function renderReservations() {
	const container = document.getElementById('activeResContainer');

	container.innerHTML = appState.reservations.map(res => {
		const building = String(res.building ?? "").toLowerCase().trim();
		const colorClass = building.includes("andrew gonzales") ? "green" : (building.includes("gokongwei") ? "red" : "");
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

window.selectForEdit = (e, id) => {
	const targetId = Number(id);
	appState.editingTargetId = targetId;

	const res = appState.reservations.find(r => r.id === targetId);
	if (!res) return;

	document.querySelector('.edit-desc').innerText = `Editing: ${res.lab} Seat(s) ${res.seat}`;

	document.querySelectorAll('#activeResContainer .mini-card').forEach(c => c.style.border = "1px solid rgba(255,255,255,0.12)");
	e.currentTarget.style.border = "1px solid #ff6b4a";
};
