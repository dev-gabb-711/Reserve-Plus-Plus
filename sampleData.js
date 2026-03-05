const mongoose = require('mongoose');
const User = require('./models/User');
const Lab = require('./models/Lab');
const Ticket = require('./models/Ticket');
const Reservation = require('./models/Reservation');
const Notification = require('./models/Notification');

mongoose.connect('mongodb://127.0.0.1:27017/ReserveDB').then(async () => {
    console.log("Connected to MongoDB");

    await User.deleteMany({});

    // Sample users (4 students, 1 admin)
    await User.insertMany([
        {   firstName: "Ross", 
            lastName: "Manalang", 
            email: "ross@dlsu.edu.ph",
            password: "123" 
        },
        
        {   firstName: "Gabriel", 
            lastName: "Infante", 
            email: "gabriel@dlsu.edu.ph",
            password: "123" 
        },
        
        {   firstName: "Gabby", 
            lastName: "Martinez", 
            email: "gabby@dlsu.edu.ph",
            password: "123" 
        },

        {   firstName: "Marion", 
            lastName: "Melanio", 
            email: "marion@dlsu.edu.ph",
            password: "123" 
        },

        {   firstName: "Nicolo", 
            lastName: "Tartaglia", 
            email: "nicolo@dlsu.edu.ph",
            role: "Admin",
            password: "123" 
        },
    ]);

    const createSeats = (num) => {
        const seats = [];
        for (let i = 1; i <= num; i++) {
            seats.push({ seatNumber: i.toString() });
        }
        return seats;
    };

    await Lab.deleteMany({});
    
    // Sample labs
    await Lab.insertMany([
        {   labCode: "G201",
            building: "Gokongwei Hall",
            seats: createSeats(30)
        },

        {   labCode: "G202",
            building: "Gokongwei Hall",
            seats: createSeats(30)
        },

        {   labCode: "203",
            building: "Gokongwei Hall",
            seats: createSeats(45)
        },

        {   labCode: "A1707",
            building: "Br. Andrew Hall",
            seats: createSeats(30)
        },

        {   labCode: "A1904",
            building: "Br. Andrew Hall",
            seats: createSeats(45)
        }
    ]);

    // Sample tickets
    const users = await User.find().lean();
    await Ticket.insertMany([
        {   user: users[0]._id, 
            building: "Br. Andrew Hall", 
            roomNumber: "1103", 
            seatNumber: "5", 
            concernCategory: "PC Unresponsive", 
            description: "Issue desc", 
            status: "Pending" 
        },
        
        {   user: users[1]._id, 
            building: "Gokongwei Hall", 
            roomNumber: "201", 
            seatNumber: "3", 
            concernCategory: "Software", 
            description: "Issue desc", 
            status: "Pending" 
        },

        {   user: users[2]._id, 
            building: "Gokongwei Hall", 
            roomNumber: "201", 
            seatNumber: "7", 
            concernCategory: "Audio", 
            description: "Issue desc", 
            status: "Pending" 
        },

        {   user: users[3]._id, 
            building: "Gokongwei Hall", 
            roomNumber: "202", 
            seatNumber: "19", 
            concernCategory: "Software", 
            description: "Issue desc", 
            status: "Pending" 
        },

        {   user: users[4]._id, 
            building: "Br. Andrew Hall", 
            roomNumber: "1707", 
            seatNumber: "6", 
            concernCategory: "Keyboard Not Working", 
            description: "Issue desc", 
            status: "Pending" 
        }
    ]);

    // Sample Reservations

    const labs = await Lab.find().lean();
    await Reservation.insertMany([
        {
            user: users[0]._id,       
            lab: labs[0]._id,         
            seatNumber: "5",
            date: "2026-03-10",
            timeSlot: "09:00 - 10:00",
            status: "Active"
        },
        {
            user: users[1]._id,       
            lab: labs[1]._id,         
            seatNumber: "10",
            date: "2026-03-10",
            timeSlot: "10:00 - 11:00",
            status: "Active"
        },
        {
            user: users[2]._id,       
            lab: labs[2]._id,         
            seatNumber: "7",
            date: "2026-03-11",
            timeSlot: "11:00 - 12:00",
            status: "Active"
        },
        {
            user: users[3]._id,       
            lab: labs[3]._id,         
            seatNumber: "19",
            date: "2026-03-11",
            timeSlot: "13:00 - 14:00",
            status: "Active"
        },
        {
            user: users[2]._id,       
            lab: labs[4]._id,         
            seatNumber: "6",
            date: "2026-03-12",
            timeSlot: "14:00 - 15:00",
            status: "Active"
        }
    ]);

    // Sample notifs
    await Notification.insertMany([
        {
            recipient: users[0]._id,  
            title: "Reservation Confirmed",
            message: "Your reservation for Computer Lab 1 on 2026-03-10 has been confirmed.",
            type: "Reservation"
        },
        {
            recipient: users[1]._id,  
            title: "Ticket Received",
            message: "Your IT ticket regarding software issue has been received.",
            type: "IT Assist"
        },
        {
            recipient: users[2]._id,  
            title: "System Update",
            message: "The lab system will undergo maintenance on 2026-03-15.",
            type: "System"
        },
        {
            recipient: users[3]._id,  
            title: "Reservation Reminder",
            message: "Reminder: Your reservation for Br. Andrew Hall Lab A1707 is tomorrow at 13:00.",
            type: "Reservation"
        },
        {
            recipient: users[4]._id,  
            title: "New Ticket Alert",
            message: "A new IT ticket has been submitted and requires your action.",
            type: "IT Assist"
        }
    ]);

    console.log("Sample data inserted");
    mongoose.disconnect();
}).catch(err => console.error(err));