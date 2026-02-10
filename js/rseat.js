document.addEventListener('DOMContentLoaded', () => {
	const seatContainer = document.getElementById('seatContainer');
	const timeGrid = document.getElementById('timeGrid');
	const btnOpenModal = document.getElementById('btnOpenModal');
	let selectedSeats = [];
	let selectedTimes = [];

	// 1. Generate 8x4 Seat Grid (32 monitors)
	const reservedIndices = [1, 5, 14, 22]; // Mock reserved seats
	for (let i = 1; i <= 32; i++) {
		const seat = document.createElement('div');
		seat.className = 'seat';

		if (reservedIndices.includes(i)) {
			seat.classList.add('reserved');
			seat.innerHTML = `<i class="material-symbols-rounded">desktop_windows</i><span>RSVD</span>`;
		} else {
			seat.innerHTML = `<i class="material-symbols-rounded">desktop_windows</i><span>SEAT ${i}</span>`;
			seat.onclick = () => {
				seat.classList.toggle('selected');
				const idx = selectedSeats.indexOf(i);
				idx > -1 ? selectedSeats.splice(idx, 1) : selectedSeats.push(i);

				btnOpenModal.disabled = selectedSeats.length === 0;
				document.getElementById('modal-seat-list').innerText = `Seats: ${selectedSeats.join(', ')}`;
			};
		}
		seatContainer.appendChild(seat);
	}

	// 2. Generate 30-minute Time Slots (8 AM - 6 PM)
	const startTime = 8 * 60; // 8:00 AM
	const endTime = 18 * 60;  // 6:00 PM

	for (let t = startTime; t < endTime; t += 30) {
		const h = Math.floor(t / 60);
		const m = t % 60;
		const displayTime = `${h > 12 ? h - 12 : h}:${m === 0 ? '00' : '30'} ${h >= 12 ? 'PM' : 'AM'}`;

		const chip = document.createElement('div');
		chip.className = 'time-chip';
		chip.innerText = displayTime;
		chip.onclick = () => {
			chip.classList.toggle('selected');
			const idx = selectedTimes.indexOf(displayTime);
			idx > -1 ? selectedTimes.splice(idx, 1) : selectedTimes.push(displayTime);
		};
		timeGrid.appendChild(chip);
	}
});

function completeReservation() {
	alert("Reservation submitted for review!");
	location.reload();
}