const mongoose = require('mongoose');
const User = require('./models/User');
const Lab = require('./models/Lab');
const Ticket = require('./models/Ticket');
const Reservation = require('./models/Reservation');
const Notification = require('./models/Notification');

mongoose.connect('mongodb://127.0.0.1:27017/ReserveDB').then(async () => {
    console.log("Connected to MongoDB");

    await User.deleteMany({});
    await Lab.deleteMany({});
    await Ticket.deleteMany({});
    await Reservation.deleteMany({});
    await Notification.deleteMany({});

    /* ==========================================
       1. SAMPLE USERS
       ========================================== */
    await User.insertMany([
        {
            firstName: "Ross",
            lastName: "Manalang",
            email: "ross@dlsu.edu.ph",
            password: "123"
        },
        {
            firstName: "Gabriel",
            lastName: "Infante",
            email: "gabriel@dlsu.edu.ph",
            password: "123"
        },
        {
            firstName: "Gabby",
            lastName: "Martinez",
            email: "gabby@dlsu.edu.ph",
            password: "123"
        },
        {
            firstName: "Marion",
            lastName: "Melanio",
            email: "marion@dlsu.edu.ph",
            password: "123"
        },
        {
            firstName: "Nicolo",
            lastName: "Tartaglia",
            email: "nicolo@dlsu.edu.ph",
            role: "Admin",
            password: "123"
        }
    ]);

    /* ==========================================
       2. LAB HELPER
       ========================================== */
    const createSeats = (num) => {
        const seats = [];
        for (let i = 1; i <= num; i++) {
            seats.push({ seatNumber: i.toString() });
        }
        return seats;
    };

    /* ==========================================
       3. SAMPLE LABS
       ========================================== */
    await Lab.insertMany([
        {
            labCode: "G201",
            building: "Gokongwei Hall",
            seats: createSeats(30)
        },
        {
            labCode: "G202",
            building: "Gokongwei Hall",
            seats: createSeats(30)
        },
        {
            labCode: "203",
            building: "Gokongwei Hall",
            seats: createSeats(45)
        },
        {
            labCode: "A1707",
            building: "Br. Andrew Hall",
            seats: createSeats(30)
        },
        {
            labCode: "A1904",
            building: "Br. Andrew Hall",
            seats: createSeats(45)
        }
    ]);

    const users = await User.find().lean();
    const labs = await Lab.find().lean();

    /* ==========================================
       4. TIME HELPERS FOR LIVE STATUS TESTING
       ========================================== */

    const now = new Date();

    const formatDateKey = (dateObj) => {
        return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    };

    const formatHourSlot = (startHour, endHour) => {
        return `${String(startHour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`;
    };

    const today = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDate = formatDateKey(today);
    const tomorrowDate = formatDateKey(tomorrow);

    const currentHour = now.getHours();

    /*
      ACTIVE STATE:
      Marion gets a reservation that is active right now.
      Example: if now is 15:20, slot becomes 15:00 - 16:00
    */
    const activeStartHour = currentHour;
    const activeEndHour = (currentHour + 1) % 24;
    const marionActiveSlot = formatHourSlot(activeStartHour, activeEndHour);

    /*
      PENDING STATE:
      Gabby gets a reservation later today if possible.
      If it is too late already, push it to tomorrow morning
      so the dashboard still shows a pending state.
    */
    let gabbyPendingDate = todayDate;
    let gabbyPendingSlot = "";

    if (currentHour <= 20) {
        const pendingStartHour = currentHour + 2;
        const pendingEndHour = currentHour + 3;
        gabbyPendingSlot = formatHourSlot(pendingStartHour, pendingEndHour);
    } else {
        gabbyPendingDate = tomorrowDate;
        gabbyPendingSlot = "09:00 - 10:00";
    }

    /*
      EXTRA OLD RESERVATIONS:
      Gabriel gets a past/fixed reservation.
      Ross gets no reservation at all so he shows "No Reservation".
    */

    /* ==========================================
       5. SAMPLE TICKETS
       ========================================== */
    await Ticket.insertMany([
        {
            user: users[0]._id, // Ross
            building: "Br. Andrew Hall",
            roomNumber: "1103",
            seatNumber: "5",
            concernCategory: "PC Unresponsive",
            description: "Issue desc",
            status: "Pending"
        },
        {
            user: users[1]._id, // Gabriel
            building: "Gokongwei Hall",
            roomNumber: "201",
            seatNumber: "3",
            concernCategory: "Software",
            description: "Issue desc",
            status: "Pending"
        },
        {
            user: users[2]._id, // Gabby
            building: "Gokongwei Hall",
            roomNumber: "201",
            seatNumber: "7",
            concernCategory: "Audio",
            description: "Issue desc",
            status: "Pending"
        },
        {
            user: users[3]._id, // Marion
            building: "Gokongwei Hall",
            roomNumber: "202",
            seatNumber: "19",
            concernCategory: "Software",
            description: "Issue desc",
            status: "Pending"
        },
        {
            user: users[4]._id, // Nicolo
            building: "Br. Andrew Hall",
            roomNumber: "1707",
            seatNumber: "6",
            concernCategory: "Keyboard Not Working",
            description: "Issue desc",
            status: "Pending"
        }
    ]);

    /* ==========================================
       6. SAMPLE RESERVATIONS
       ========================================== */
    await Reservation.insertMany([
        {
            user: users[1]._id, // Gabriel
            lab: labs[1]._id,   // G202
            seatNumber: "10",
            date: "2026-03-10",
            timeSlot: "10:00 - 11:00",
            status: "Active"
        },
        {
            user: users[2]._id, // Gabby -> PENDING
            lab: labs[4]._id,   // A1904
            seatNumber: "6",
            date: gabbyPendingDate,
            timeSlot: gabbyPendingSlot,
            status: "Active"
        },
        {
            user: users[3]._id, // Marion -> ACTIVE NOW
            lab: labs[3]._id,   // A1707
            seatNumber: "19",
            date: todayDate,
            timeSlot: marionActiveSlot,
            status: "Active"
        }
        /*
          Ross intentionally has NO reservation
          so his dashboard can show the "No Reservation" state.
        */
    ]);

    /* ==========================================
       7. SAMPLE NOTIFICATIONS
       ========================================== */
    await Notification.insertMany([
        {
            recipient: users[0]._id, // Ross
            title: "Lab Reminder",
            message: "You currently have no reservation for today. Reserve early to secure a seat.",
            type: "System"
        },
        {
            recipient: users[1]._id, // Gabriel
            title: "Reservation Confirmed",
            message: "Your reservation has been recorded successfully.",
            type: "Reservation"
        },
        {
            recipient: users[2]._id, // Gabby
            title: "Reservation Reminder",
            message: `Reminder: Your reservation is scheduled for ${gabbyPendingDate} at ${gabbyPendingSlot}.`,
            type: "Reservation"
        },
        {
            recipient: users[3]._id, // Marion
            title: "Reservation Active",
            message: `You are currently checked in for your reservation at ${marionActiveSlot}.`,
            type: "Reservation"
        },
        {
            recipient: users[4]._id, // Nicolo
            title: "New Ticket Alert",
            message: "A new IT ticket has been submitted and requires your action.",
            type: "IT Assist"
        }
    ]);

    console.log("Sample data inserted successfully.");
    console.log("------------------------------------------");
    console.log(`Marion (ACTIVE):  ${todayDate} | ${marionActiveSlot}`);
    console.log(`Gabby (PENDING):  ${gabbyPendingDate} | ${gabbyPendingSlot}`);
    console.log("Ross (NONE):      no reservation");
    console.log("------------------------------------------");

    mongoose.disconnect();
}).catch(err => console.error(err));