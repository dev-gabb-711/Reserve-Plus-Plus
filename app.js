const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const hbs = require('hbs');

const app = express();


// 1. DATABASE CONNECTION

mongoose.connect('mongodb://127.0.0.1:27017/ReserveDB')
    .then(() => console.log('Connected to MongoDB! Slay Architect.'))
    .catch(err => console.error('Database connection error:', err));

// 2. SETTINGS & MIDDLEWARE

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


hbs.registerPartials(path.join(__dirname, 'views', 'partials'));


// 3. IMPORT MODELS

const User = require('./models/User');
const Lab = require('./models/Lab');
const Ticket = require('./models/Ticket');
const Reservation = require('./models/Reservation');
const Notification = require('./models/Notification');

// ==========================================
// 4. GET ROUTES (Displaying All Your Pages)
// ==========================================

//login saka signup here
app.get('/', (req, res) => res.render('login'));
app.get('/', (req, res) => res.render('signup'));

// Dashboards
app.get('/dashboard', (req, res) => res.render('dashboard'));
app.get('/admin-dashboard', (req, res) => res.render('admindashboard'));

// Reservation & Lab View
app.get('/reserve', async (req, res) => {
    try {
        const labs = await Lab.find().lean();
        res.render('rseat', { labs });
    } catch (err) { res.status(500).send("Error loading labs"); }
});

// IT Assist Pages
app.get('/it-assist', (req, res) => res.render('itassist'));
app.get('/it-assist-admin', async (req, res) => {
    try {
        const allTickets = await Ticket.find().populate('user').lean();
        res.render('itassistadmin', { tickets: allTickets });
    } catch (err) { res.status(500).send("Error loading admin tickets"); }
});

// Notifications
app.get('/notifications', async (req, res) => {
    try {
        const notifs = await Notification.find().lean();
        res.render('notifications', { notifications: notifs });
    } catch (err) { res.status(500).send("Error loading notifications"); }
});

// Profile & Search
app.get('/profile', (req, res) => res.render('profile'));
app.get('/search-results', (req, res) => res.render('searchresults'));

// Auth (Prep for Phase 3)
app.get('/login', (req, res) => res.render('login'));
app.get('/signup', (req, res) => res.render('signup'));

// 5. POST ROUTES (Actions)


// Submit Ticket
app.post('/submit-ticket', async (req, res) => {
    try {
        const newTicket = new Ticket({
            user: req.body.userId, 
            building: req.body.building,
            roomNumber: req.body.room,
            seatNumber: req.body.seat,
            concernCategory: req.body.concern,
            description: req.body.message
        });
        await newTicket.save();
        res.redirect('/it-assist');
    } catch (err) { res.status(500).send("Submit failed: " + err.message); }
});

// Resolve Ticket
app.post('/resolve-ticket/:id', async (req, res) => {
    try {
        await Ticket.findByIdAndUpdate(req.params.id, { status: 'Resolved' });
        res.redirect('/it-assist-admin');
    } catch (err) { res.status(500).send("Resolve error"); }
});


// 6. SERVER START

const PORT = 3000;
app.listen(PORT, () => console.log(` Running at http://localhost:${PORT}`));