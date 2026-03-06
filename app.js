const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const hbs = require('hbs');

const app = express();

/* ==========================================
   1. DATABASE CONNECTION
   ========================================== */
mongoose.connect('mongodb://127.0.0.1:27017/ReserveDB')
  .then(() => console.log('Connected to MongoDB! Slay Architect.'))
  .catch(err => console.error('Database connection error:', err));

/* ==========================================
   2. SETTINGS & MIDDLEWARE
   ========================================== */
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

/* ==========================================
   3. HANDLEBARS HELPERS
   ========================================== */
hbs.registerHelper('eq', (a, b) => a === b);
hbs.registerHelper('firstChar', (value) => {
  if (!value) return '';
  return String(value).charAt(0).toUpperCase();
});
hbs.registerHelper('json', (context) => JSON.stringify(context));

/* ==========================================
   4. IMPORT MODELS
   ========================================== */
const User = require('./models/User');
const Lab = require('./models/Lab');
const Ticket = require('./models/Ticket');
const Reservation = require('./models/Reservation');
const Notification = require('./models/Notification');

/* ==========================================
   5. HELPER FUNCTIONS
   ========================================== */

/**
 * Removes leading letters from a room/lab code
 * so values like "G201" and "201" can still match.
 */
function normalizeRoomCode(value) {
  return String(value || '').replace(/^[A-Za-z]+/, '');
}

/**
 * Builds grouped building data for the admin dashboard hero cards.
 */
function buildDashboardBuildings(labs, tickets) {
  return labs.reduce((groups, lab) => {
    let buildingGroup = groups.find(group => group.title === lab.building);

    if (!buildingGroup) {
      buildingGroup = {
        title: lab.building,
        image: '/img/lab.jpg',
        rooms: []
      };
      groups.push(buildingGroup);
    }

    const unresolvedTickets = tickets.filter(ticket =>
      ticket.building === lab.building &&
      normalizeRoomCode(ticket.roomNumber) === normalizeRoomCode(lab.labCode) &&
      ticket.status !== 'Resolved'
    );

    buildingGroup.rooms.push({
      name: `Room ${lab.labCode}`,
      status: unresolvedTickets.length > 0 ? 'assist' : 'ok',
      count: unresolvedTickets.length
    });

    return groups;
  }, []);
}

/**
 * Builds simplified ticket cards for the admin dashboard.
 */
function buildDashboardTickets(tickets) {
  return tickets.slice(0, 6).map((ticket, index) => ({
    _id: ticket._id,
    displayId: index + 1,
    roomLabel: `Room ${ticket.roomNumber}`,
    seatLabel: `Seat ${ticket.seatNumber}`,
    issue: ticket.concernCategory,
    status: ticket.status,
    priority:
      ticket.status === 'Pending' ? 1 :
      ticket.status === 'In Progress' ? 2 : 3
  }));
}

/**
 * Builds the mini notification list shown in the admin dashboard profile card.
 */
function buildMiniNotifications(notifications) {
  return notifications.map(notif => ({
    _id: notif._id,
    name: notif.senderName || notif.type || 'System',
    avatar: notif.senderAvatar || '/img/dlsu.png',
    snippet: notif.message
  }));
}

/**
 * Builds search results data from labs and their seats.
 */
function buildSearchResults(labs) {
  const searchResults = [];

  labs.forEach(lab => {
    const buildingCode = String(lab.labCode || '').charAt(0).toUpperCase();

    (lab.seats || []).forEach(seat => {
      searchResults.push({
        buildingCode,
        building: lab.building,
        room: lab.labCode,
        seat: seat.seatNumber,
        date: '',
        time: ''
      });
    });
  });

  return searchResults;
}

/**
 * Builds student dashboard notifications with avatar fallback.
 */
function buildStudentNotifications(notifications) {
  return notifications.map(notif => ({
    ...notif,
    senderName: notif.senderName || notif.type || 'System',
    avatar: notif.senderAvatar || '/img/system_profile.png'
  }));
}

/* ==========================================
   6. GET ROUTES
   ========================================== */

// Default landing page
app.get('/', (req, res) => res.render('index'));

// Auth pages
app.get('/login', (req, res) => res.render('login'));
app.get('/signup', (req, res) => res.render('signup'));

// Student dashboard
app.get('/dashboard', async (req, res) => {
  try {
    const userId = req.query.userId;

    const studentUser = userId
      ? await User.findById(userId).lean()
      : await User.findOne({ role: 'Student' }).lean();

    const labs = await Lab.find().lean();

    const reservationDocs = userId
      ? await Reservation.find({ user: userId, status: 'Active' }).populate('lab').lean()
      : await Reservation.find({ status: 'Active' }).populate('lab').lean();

    const reservations = reservationDocs.map(reservation => {
      const roomCode = reservation.lab?.labCode || '';
      const building = reservation.lab?.building || '';

      const buildingKey = String(building).toLowerCase().includes('andrew')
        ? 'andrew'
        : String(building).toLowerCase().includes('gokongwei')
          ? 'gokongwei'
          : '';

      return {
        ...reservation,
        roomLabel: roomCode
          ? `Room ${roomCode} • Seat ${reservation.seatNumber}`
          : `Seat ${reservation.seatNumber}`,
        dateLabel: reservation.date || '',
        timeLabel: reservation.timeSlot || '',
        building,
        buildingKey
      };
    });

    const rawNotifications = userId
      ? await Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(5).lean()
      : await Notification.find().sort({ createdAt: -1 }).limit(5).lean();

    const notifications = buildStudentNotifications(rawNotifications);

    res.render('dashboard', {
      studentUser,
      labs,
      reservations,
      notifications
    });
  } catch (err) {
    console.error('Error loading student dashboard:', err);
    res.status(500).send('Error loading dashboard');
  }
});

// Admin dashboard
app.get('/admin-dashboard', async (req, res) => {
  try {
    const userId = req.query.userId;

    const adminUser = userId
      ? await User.findById(userId).lean()
      : await User.findOne({ role: 'Admin' }).lean();

    const labs = await Lab.find().lean();
    const allTickets = await Ticket.find().populate('user').lean();
    const rawNotifications = await Notification.find().sort({ createdAt: -1 }).limit(4).lean();

    const dashboardBuildings = buildDashboardBuildings(labs, allTickets);

    const dashboardTickets = buildDashboardTickets(
      allTickets.filter(ticket => ticket.status !== 'Resolved')
    );

    const miniNotifications = buildMiniNotifications(rawNotifications);

    res.render('admindashboard', {
      adminUser,
      dashboardBuildings,
      dashboardTickets,
      miniNotifications
    });
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    res.status(500).send('Error loading admin dashboard');
  }
});

// Reservation & Lab View
app.get('/reserve', async (req, res) => {
  try {
    const labs = await Lab.find().lean();
    res.render('rseat', { labs });
  } catch (err) {
    console.error('Error loading labs:', err);
    res.status(500).send('Error loading labs');
  }
});

// IT Assist pages
app.get('/it-assist', (req, res) => res.render('itassist'));

app.get('/it-assist-admin', async (req, res) => {
  try {
    const allTickets = await Ticket.find().populate('user').lean();
    res.render('itassistadmin', { tickets: allTickets });
  } catch (err) {
    console.error('Error loading admin tickets:', err);
    res.status(500).send('Error loading admin tickets');
  }
});

// Notifications
app.get('/notifications', async (req, res) => {
  try {
    const notifs = await Notification.find().sort({ createdAt: -1 }).lean();
    res.render('notifications', { notifications: notifs });
  } catch (err) {
    console.error('Error loading notifications:', err);
    res.status(500).send('Error loading notifications');
  }
});

// Profile
app.get('/profile', (req, res) => res.render('profile'));

// Search Results
app.get('/search-results', async (req, res) => {
  try {
    const labs = await Lab.find().lean();
    const searchResults = buildSearchResults(labs);

    res.render('searchresults', { searchResults });
  } catch (err) {
    console.error('Error loading search results:', err);
    res.status(500).send('Error loading search results');
  }
});

/* ==========================================
   7. POST ROUTES
   ========================================== */

// Log in user
app.post('/login', async (req, res) => {
  try {
    const mail = (req.body.email || '').trim().toLowerCase();
    const pass = (req.body.password || '').trim();

    if (!mail || !pass) {
      return res.status(400).send('Please enter both email and password.');
    }

    const user = await User.findOne({ email: mail });

    if (!user) {
      return res.status(400).send('Account not found.');
    }

    if (user.password !== pass) {
      return res.status(400).send('Incorrect password.');
    }

    if (user.role === 'Admin') {
      return res.redirect(`/admin-dashboard?userId=${user._id}`);
    }

    return res.redirect(`/dashboard?userId=${user._id}`);
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).send('Login failed: ' + err.message);
  }
});

// Sign up user
app.post('/signup', async (req, res) => {
  try {
    const first = (req.body.firstName || '').trim();
    const last = (req.body.lastName || '').trim();
    const mail = (req.body.email || '').trim().toLowerCase();
    const pass = (req.body.password || '').trim();

    if (!first || !last || !mail || !pass) {
      return res.status(400).send('Please fill in all required fields.');
    }

    const existingUser = await User.findOne({ email: mail });

    if (existingUser) {
      return res.status(400).send('An account with that email already exists.');
    }

    const newUser = new User({
      firstName: first,
      lastName: last,
      email: mail,
      password: pass,
      role: 'Student'
    });

    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    console.error('Signup failed:', err);
    res.status(500).send('Signup failed: ' + err.message);
  }
});

// Submit ticket
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
  } catch (err) {
    console.error('Submit failed:', err);
    res.status(500).send('Submit failed: ' + err.message);
  }
});

// Resolve ticket
app.post('/resolve-ticket/:id', async (req, res) => {
  try {
    await Ticket.findByIdAndUpdate(req.params.id, { status: 'Resolved' });
    res.redirect(req.get('Referrer') || '/it-assist-admin');
  } catch (err) {
    console.error('Resolve error:', err);
    res.status(500).send('Resolve error');
  }
});

/* ==========================================
   8. SERVER START
   ========================================== */
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Running at http://localhost:${PORT}`);
});