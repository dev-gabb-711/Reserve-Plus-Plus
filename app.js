const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const hbs = require('hbs')
const session = require('express-session')
const multer = require('multer')

const app = express()

/*===========================================
 * SESSION CREATION
 ============================================ */
app.use(
  session({
    secret: 'sikretLangDaw',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 60 * 60 * 1000,
      secure: false
    }
  })
)

/* ==========================================
   1. DATABASE CONNECTION
   ========================================== */
mongoose
  .connect('mongodb://127.0.0.1:27017/ReserveDB')
  .then(() => console.log('Connected to MongoDB! Slay Architect.'))
  .catch(err => console.error('Database connection error:', err))

/* ==========================================
   2. SETTINGS & MIDDLEWARE
   ========================================== */
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

hbs.registerPartials(path.join(__dirname, 'views', 'partials'))

/* ==========================================
   3. HANDLEBARS HELPERS
   ========================================== */
hbs.registerHelper('eq', (a, b) => a === b)
hbs.registerHelper('firstChar', value => {
  if (!value) return ''
  return String(value).charAt(0).toUpperCase()
})
hbs.registerHelper('json', context => JSON.stringify(context))

/* ==========================================
   4. IMPORT MODELS
   ========================================== */
const User = require('./models/User')
const Lab = require('./models/Lab')
const Ticket = require('./models/Ticket')
const Reservation = require('./models/Reservation')
const Notification = require('./models/Notification')

/* ==========================================
   5. HELPER FUNCTIONS
   ========================================== */

function normalizeRoomCode(value) {
  return String(value || '').replace(/^[A-Za-z]+/, '')
}

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login')
  }
  next()
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login')
  }

  if (req.session.user.role !== 'Admin') {
    return res.status(403).send('Unauthorized')
  }

  next()
}

function makeAvatar(color) {
  return `
  data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>
    <rect width='100' height='100' rx='50' fill='${color}'/>
    <circle cx='50' cy='40' r='15' fill='white'/>
    <rect x='30' y='55' width='40' height='25' rx='12' fill='white'/>
  </svg>
  `
}

function getNotificationAvatar(type, senderAvatar) {
  if (senderAvatar && String(senderAvatar).trim() !== '') {
    return senderAvatar
  }

  if (type === 'IT Assist') return makeAvatar('purple')
  if (type === 'Reservation') return makeAvatar('teal')
  return makeAvatar('blue')
}

function formatNotificationForClient(notif) {
  return {
    id: String(notif._id),
    _id: String(notif._id),
    name: notif.senderName || notif.type || 'System',
    role: notif.senderRole || notif.type || 'System',
    snippet: notif.message || '',
    body: notif.message || '',
    avatar: getNotificationAvatar(notif.type, notif.senderAvatar),
    type: notif.type || 'System',
    title: notif.title || 'Notification',
    isRead: !!notif.isRead,
    createdAt: notif.createdAt
  }
}

async function createNotificationSafe(data) {
  try {
    await Notification.create(data)
  } catch (err) {
    console.error('Notification creation failed:', err.message)
  }
}

function formatDateTimeShort(value) {
  if (!value) return 'No date available'

  const date = new Date(value)
  if (isNaN(date.getTime())) return 'No date available'

  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function buildDashboardBuildings(labs, tickets) {
  return labs.reduce((groups, lab) => {
    let buildingGroup = groups.find(group => group.title === lab.building)

    if (!buildingGroup) {
      buildingGroup = {
        title: lab.building,
        image: '/img/lab.jpg',
        rooms: []
      }
      groups.push(buildingGroup)
    }

    const unresolvedTickets = tickets.filter(ticket => {
      const ticketBuilding = ticket.lab?.building || ''
      const ticketRoom = ticket.lab?.labCode || ''

      return (
        ticket.status === 'Unresolved' &&
        ticketBuilding === lab.building &&
        normalizeRoomCode(ticketRoom) === normalizeRoomCode(lab.labCode)
      )
    })

    buildingGroup.rooms.push({
      name: `Room ${lab.labCode}`,
      status: unresolvedTickets.length > 0 ? 'assist' : 'ok',
      count: unresolvedTickets.length
    })

    return groups
  }, [])
}

function buildDashboardTickets(tickets) {
  return tickets.slice(0, 6).map((ticket, index) => {
    const firstName = ticket.user?.firstName || ''
    const lastName = ticket.user?.lastName || ''
    const fullName = `${firstName} ${lastName}`.trim()

    return {
      _id: ticket._id,
      displayId: index + 1,
      roomLabel: `Room ${ticket.lab?.labCode || 'Unknown'}`,
      seatLabel: `Seat ${ticket.seatNumber}`,
      studentName: fullName || ticket.user?.email || 'Unknown User',
      submittedAt: formatDateTimeShort(ticket.createdAt),
      issue: ticket.concernCategory,
      status: ticket.status
    }
  })
}

function buildMiniNotifications(notifications) {
  return notifications.map(notif => ({
    _id: notif._id,
    name: notif.senderName || notif.type || 'System',
    avatar: notif.senderAvatar || '/img/dlsu.png',
    snippet: notif.message
  }))
}

function buildSearchResults(labs) {
  const searchResults = []

  labs.forEach(lab => {
    const buildingCode = String(lab.labCode || '')
      .charAt(0)
      .toUpperCase()

    ;(lab.seats || []).forEach(seat => {
      searchResults.push({
        buildingCode,
        building: lab.building,
        room: lab.labCode,
        seat: seat.seatNumber,
        date: '',
        time: ''
      })
    })
  })

  return searchResults
}

function buildStudentNotifications(notifications) {
  return notifications.map(notif => ({
    ...notif,
    senderName: notif.senderName || notif.type || 'System',
    avatar: notif.senderAvatar || '/img/system_profile.png'
  }))
}

/**
 * Calculates a user-friendly time range (e.g., "09:00 AM - 10:30 AM")
 * from an array of 30-min time slots for the dashboard.
 */
function calculateTimeRangeServer(slots) {
  if (!slots || slots.length === 0) return ''

  try {
    const sorted = [...slots].sort(
      (a, b) => new Date('1970/01/01 ' + a) - new Date('1970/01/01 ' + b)
    )

    const start = sorted[0]
    const lastSlot = sorted[sorted.length - 1]

    let [time, modifier] = lastSlot.split(' ')
    let [hours, minutes] = time.split(':')

    let h = parseInt(hours, 10)
    if (h === 12) h = 0
    if (modifier === 'PM') h += 12

    const endDate = new Date(1970, 0, 1, h, parseInt(minutes, 10))
    endDate.setMinutes(endDate.getMinutes() + 30)

    const endStr = endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    return `${start} - ${endStr}`
  } catch (e) {
    return slots.join(', ')
  }
}

/* ==========================================
   6. GET ROUTES
   ========================================== */

app.get('/', (req, res) => res.render('index'))
app.get('/login', (req, res) => res.render('login'))
app.get('/signup', (req, res) => res.render('signup'))

app.get('/logout', requireLogin, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout failed:', err)
      return res.redirect('/dashboard')
    }

    res.clearCookie('connect.sid')
    res.redirect('/login')
  })
})

app.get('/dashboard', async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/login')

    const userId = req.session.user.id
    const studentUser = await User.findById(userId).lean()
    const labs = await Lab.find().lean()

    const reservationDocs = await Reservation.find({
      user: userId,
      status: 'Active'
    })
      .populate('lab')
      .lean()

    const reservations = reservationDocs.map(reservation => {
      const roomCode = reservation.lab?.labCode || ''
      const building = reservation.lab?.building || ''
      const buildingKey = String(building).toLowerCase().includes('andrew')
        ? 'andrew'
        : String(building).toLowerCase().includes('gokongwei')
          ? 'gokongwei'
          : ''

      let calculatedTime = reservation.timeSlot
      try {
        const parsedSlots = JSON.parse(reservation.timeSlot)
        if (Array.isArray(parsedSlots)) {
          calculatedTime = calculateTimeRangeServer(parsedSlots)
        }
      } catch (e) {
        // Ignore old format
      }

      return {
        ...reservation,
        roomNumber: roomCode,
        roomLabel: roomCode
          ? `Room ${roomCode} • Seat ${reservation.seatNumber}`
          : `Seat ${reservation.seatNumber}`,
        dateLabel: reservation.date || '',
        timeLabel: calculatedTime || '',
        dateISO: reservation.date || '',
        timeSlot: calculatedTime || '',
        building,
        buildingKey
      }
    })

    const rawNotifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    const notifications = buildStudentNotifications(rawNotifications)

    res.render('dashboard', { studentUser, labs, reservations, notifications })
  } catch (err) {
    console.error('Error loading student dashboard:', err)
    res.status(500).send('Error loading dashboard')
  }
})

app.get('/admin-dashboard', requireAdmin, async (req, res) => {
  try {
    const adminUser = await User.findById(req.session.user.id).lean()
    const labs = await Lab.find().lean()

    const allTickets = await Ticket.find()
      .populate('user')
      .populate('lab')
      .sort({ createdAt: -1 })
      .lean()

    const rawNotifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .lean()

    const dashboardBuildings = buildDashboardBuildings(labs, allTickets)

    const dashboardTickets = buildDashboardTickets(
      allTickets.filter(ticket => ticket.status === 'Unresolved')
    )

    const miniNotifications = buildMiniNotifications(rawNotifications)

    res.render('admindashboard', {
      adminUser,
      dashboardBuildings,
      dashboardTickets,
      miniNotifications
    })
  } catch (err) {
    console.error('Error loading admin dashboard:', err)
    res.status(500).send('Error loading admin dashboard')
  }
})

app.get('/reserve', async (req, res) => {
  try {
    const labs = await Lab.find().lean()
    res.render('rseat', { labs })
  } catch (err) {
    console.error('Error loading labs:', err)
    res.status(500).send('Error loading labs')
  }
})

app.get('/it-assist', requireLogin, async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/login')

    const userId = req.session.user.id
    const studentUser = await User.findById(userId).lean()

    res.render('itassist', { studentUser })
  } catch (err) {
    console.error('Error loading it-assist page:', err)
    res.status(500).send('Error loading it-assist')
  }
})

app.get('/it-assist-admin', requireAdmin, async (req, res) => {
  try {
    const { ticketId } = req.query

    let query = { status: 'Unresolved' }

    if (ticketId) {
      query = {
        _id: ticketId,
        status: 'Unresolved'
      }
    }

    const allTickets = await Ticket.find(query)
      .populate('user')
      .populate('lab')
      .sort({ createdAt: -1 })
      .lean()

    res.render('itassistadmin', {
      ticketsJson: JSON.stringify(allTickets || [])
    })
  } catch (err) {
    console.error('Error loading admin tickets:', err)
    res.status(500).send('Error loading admin tickets')
  }
})

app.get('/notifications', requireLogin, async (req, res) => {
  try {
    res.render('notifications')
  } catch (err) {
    console.error('Error loading notifications:', err)
    res.status(500).send('Error loading notifications')
  }
})

app.get('/profile', requireLogin, (req, res) => {
  res.redirect(`/profile/${req.session.user.id}`)
})

app.get('/profile/:id', requireLogin, async (req, res) => {
  try {
    const viewedUserId = req.params.id
    const loggedInUserId = req.session.user.id

    const isOwner = String(viewedUserId) === String(loggedInUserId)
    const isEditMode = isOwner && req.query.edit === 'true'

    const profileUser = await User.findById(viewedUserId).lean()

    if (!profileUser) {
      return res.status(404).send('User not found')
    }

    const reservationDocs = await Reservation.find({
      user: viewedUserId,
      status: 'Active'
    })
      .populate('lab')
      .sort({ createdAt: -1 })
      .lean()

    const reservations = reservationDocs.map(reservation => {
      let calculatedTime = reservation.timeSlot

      try {
        const parsedSlots = JSON.parse(reservation.timeSlot)
        if (Array.isArray(parsedSlots)) {
          calculatedTime = calculateTimeRangeServer(parsedSlots)
        }
      } catch (e) {
        // Ignore old format
      }

      return {
        ...reservation,
        roomLabel: reservation.lab?.labCode
          ? `Room ${reservation.lab.labCode} • Seat ${reservation.seatNumber}`
          : `Seat ${reservation.seatNumber}`,
        dateLabel: reservation.date || '',
        timeLabel: calculatedTime || ''
      }
    })

    res.render('profile', {
      pageTitle: isOwner ? 'My Profile' : `${profileUser.firstName}'s Profile`,
      profileUser: {
        ...profileUser,
        fullName: `${profileUser.firstName} ${profileUser.lastName}`,
        displayRole: profileUser.role === 'Admin' ? 'Admin' : 'Lab User',
        profilePic: profileUser.profilePic || '/img/def_avatar.jpg',
        description: profileUser.description || ''
      },
      reservations,
      isOwner,
      isEditMode
    })
  } catch (err) {
    console.error('Error loading profile:', err)
    res.status(500).send('Error loading profile')
  }
})

app.get('/search-results', async (req, res) => {
  try {
    const q = (req.query.q || '').trim()

    const labs = await Lab.find().lean()
    const labResults = buildSearchResults(labs)

    let userResults = []

    if (q) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: q, $options: 'i' } },
          { lastName: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      }).lean()

      userResults = users.map(u => ({
        type: 'user',
        userId: u._id,
        name: `${u.firstName} ${u.lastName}`,
        avatar: u.profilePic || '/img/def_avatar.jpg',
        role: u.role === 'Admin' ? 'Admin' : 'Lab User'
      }))
    }

    const combinedResults = [
      ...userResults,
      ...labResults.map(r => ({
        ...r,
        type: 'lab'
      }))
    ]

    res.render('searchresults', { searchResults: combinedResults })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).send('Search failed')
  }
})

app.get('/api/labs', async (req, res) => {
  try {
    const labs = await Lab.find().lean()
    res.json(labs)
  } catch (err) {
    console.error('Error fetching labs:', err)
    res.status(500).json({ error: 'Failed to fetch labs' })
  }
})

/* ==========================================
   7. POST ROUTES
   ========================================== */

app.post('/login', async (req, res) => {
  try {
    const mail = (req.body.email || '').trim().toLowerCase()
    const pass = (req.body.password || '').trim()

    if (!mail || !pass) {
      return res.status(400).send('Please enter both email and password.')
    }

    const user = await User.findOne({ email: mail })

    if (!user || user.password !== pass) {
      return res.status(400).send('Invalid login')
    }

    req.session.user = {
      id: user._id,
      role: user.role,
      name: user.firstName
    }

    if (user.role === 'Admin') {
      return res.redirect('/admin-dashboard')
    } else {
      return res.redirect('/dashboard')
    }
  } catch (err) {
    console.error('Login failed:', err)
    res.status(500).send('Login failed: ' + err.message)
  }
})

app.post('/signup', async (req, res) => {
  try {
    const first = (req.body.firstName || '').trim()
    const last = (req.body.lastName || '').trim()
    const mail = (req.body.email || '').trim().toLowerCase()
    const pass = (req.body.password || '').trim()

    if (!first || !last || !mail || !pass) {
      return res.status(400).send('Please fill in all required fields.')
    }

    const existingUser = await User.findOne({ email: mail })

    if (existingUser) {
      return res.status(400).send('An account with that email already exists.')
    }

    const newUser = new User({
      firstName: first,
      lastName: last,
      email: mail,
      password: pass,
      role: 'Student',
      description: '',
      profilePic: '/img/def_avatar.jpg'
    })

    await newUser.save()
    res.redirect('/login')
  } catch (err) {
    console.error('Signup failed:', err)
    res.status(500).send('Signup failed: ' + err.message)
  }
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads'))
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    const uniqueName = `${Date.now()}-${file.fieldname}${ext}`
    cb(null, uniqueName)
  }
})

const upload = multer({ storage: storage })

app.post('/profile/:id/edit', requireLogin, upload.single('profilePic'), async (req, res) => {
  try {
    const viewedUserId = req.params.id
    const loggedInUserId = req.session.user.id

    if (String(viewedUserId) !== String(loggedInUserId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' })
    }

    const updates = {
      firstName: (req.body.firstName || '').trim(),
      lastName: (req.body.lastName || '').trim(),
      email: (req.body.email || '').trim().toLowerCase(),
      description: (req.body.description || '').trim()
    }

    if (req.body.password) {
      updates.password = req.body.password.trim()
    }

    if (req.file) {
      updates.profilePic = '/uploads/' + req.file.filename
    }

    await User.findByIdAndUpdate(viewedUserId, updates)
    req.session.user.name = updates.firstName

    res.json({
      success: true,
      profilePic: updates.profilePic,
      userId: viewedUserId
    })
  } catch (err) {
    console.error('Error updating profile:', err)
    res.status(500).json({ success: false, message: 'Error updating profile' })
  }
})

app.post('/profile/:id/delete', requireLogin, async (req, res) => {
  try {
    const viewedUserId = req.params.id
    const loggedInUserId = req.session.user.id

    if (String(viewedUserId) !== String(loggedInUserId)) {
      return res.status(403).send('Unauthorized')
    }

    await Reservation.updateMany(
      { user: viewedUserId, status: 'Active' },
      { status: 'Cancelled' }
    )

    await Ticket.deleteMany({ user: viewedUserId })
    await Notification.deleteMany({ recipient: viewedUserId })

    await User.findByIdAndDelete(viewedUserId)

    req.session.destroy(err => {
      if (err) {
        console.error('Session destroy error:', err)
        return res.redirect('/login')
      }
      res.redirect('/signup')
    })
  } catch (err) {
    console.error('Error deleting account:', err)
    res.status(500).send('Error deleting account')
  }
})

/* ==========================================
   IT ASSIST ROUTES
   ========================================== */

app.post('/submit-ticket', requireLogin, async (req, res) => {
  try {
    const building = (req.body.building || '').trim()
    const room = (req.body.room || '').trim().toUpperCase()
    const seat = Number(req.body.seat)
    const concern = (req.body.concern || '').trim()
    const message = (req.body.message || '').trim()

    const allowedBuildings = ['Br. Andrew Hall', 'Gokongwei Hall']

    if (!building || !room || !seat) {
      return res.status(400).json({
        error: 'Building, room, and seat are required.'
      })
    }

    if (!allowedBuildings.includes(building)) {
      return res.status(400).json({
        error: 'Invalid building value.'
      })
    }

    if (!concern && !message) {
      return res.status(400).json({
        error: 'Please select a concern or enter a message.'
      })
    }

    const matchedLab = await Lab.findOne({
      building: building,
      labCode: room
    })

    if (!matchedLab) {
      return res.status(404).json({
        error: 'Selected lab was not found in the database.'
      })
    }

    const newTicket = new Ticket({
      user: req.session.user.id,
      lab: matchedLab._id,
      seatNumber: seat,
      concernCategory: concern || 'Other',
      description: message,
      status: 'Unresolved'
    })

    await newTicket.save()

    await createNotificationSafe({
      recipient: req.session.user.id,
      senderName: 'IT Assist',
      senderRole: 'Support Desk',
      title: 'Ticket Submitted',
      message: `Your concern for Room ${matchedLab.labCode}, Seat ${seat} has been submitted successfully.`,
      type: 'IT Assist'
    })

    res.status(201).json({
      success: true,
      message: 'Ticket submitted successfully.',
      ticket: newTicket
    })
  } catch (err) {
    console.error('Submit failed:', err)
    res.status(500).json({ error: 'Submit failed: ' + err.message })
  }
})

app.post('/resolve-ticket/:id', requireAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('lab')
      .lean()

    if (!ticket) {
      return res.status(404).send('Ticket not found')
    }

    await createNotificationSafe({
      recipient: ticket.user,
      senderName: 'IT Assist',
      senderRole: 'Lab Technician',
      title: 'Concern Resolved',
      message: `Your concern for Room ${
        ticket.lab?.labCode || 'Unknown'
      }, Seat ${ticket.seatNumber} has been resolved.`,
      type: 'IT Assist'
    })

    await Ticket.findByIdAndDelete(req.params.id)

    res.redirect(req.get('Referrer') || '/it-assist-admin')
  } catch (err) {
    console.error('Resolve error:', err)
    res.status(500).send('Resolve error')
  }
})

app.post('/admin/announcements', requireAdmin, async (req, res) => {
  try {
    const message = (req.body.message || '').trim()

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Announcement message is required.'
      })
    }

    const studentUsers = await User.find({
      role: { $ne: 'Admin' }
    })
      .select('_id')
      .lean()

    const notificationsToInsert = studentUsers.map(user => ({
      recipient: user._id,
      senderName: 'Reserve++ Team',
      senderRole: 'System Announcement',
      senderAvatar: '/img/system_profile.png',
      title: 'Announcement',
      message: message,
      type: 'Announcement'
    }))

    await Notification.insertMany(notificationsToInsert)

    res.json({
      success: true,
      message: 'Announcement sent successfully.'
    })
  } catch (err) {
    console.error('Announcement posting failed:', err)

    res.status(500).json({
      success: false,
      error: 'Failed to post announcement.'
    })
  }
})

/* ==========================================
   API ROUTES (TICKETS)
   ========================================== */

app.get('/api/tickets/me', requireLogin, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.session.user.id })
      .populate('lab')
      .sort({ createdAt: -1 })
      .lean()

    res.json(tickets)
  } catch (err) {
    console.error('Fetch tickets failed:', err)
    res.status(500).json({ error: 'Failed to fetch tickets' })
  }
})

/* ==========================================
   API ROUTES (NOTIFICATIONS)
   ========================================== */

app.get('/api/notifications/me', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .lean()

    const formattedNotifications = notifications.map(
      formatNotificationForClient
    )

    res.json(formattedNotifications)
  } catch (err) {
    console.error('Error fetching notifications:', err)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

app.delete('/api/notifications/:id', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id

    const deletedNotification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: userId
    })

    if (!deletedNotification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting notification:', err)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

app.patch('/api/notifications/:id/read', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id

    const updatedNotification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: userId
      },
      { isRead: true },
      { returnDocument: 'after' }
    )

    if (!updatedNotification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Error marking notification as read:', err)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

/* ==========================================
   API ROUTES (RESERVATIONS)
   ========================================== */

app.post('/api/reservations', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Please log in first.' })
    }

    const { labId, labCode, seats, date, timeRange, slotsArray, isAnonymous } =
      req.body

    let lab
    if (labId) {
      lab = await Lab.findById(labId)
    } else {
      const cleanCode = normalizeRoomCode(labCode)
      lab = await Lab.findOne({ labCode: cleanCode })
    }

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found in database.' })
    }

    const newReservation = new Reservation({
      user: req.session.user.id,
      lab: lab._id,
      labCode: labCode,
      seatNumber: seats,
      date: date,
      timeRange: timeRange,
      slotsArray: slotsArray,
      timeSlot: JSON.stringify(slotsArray),
      isAnonymous: isAnonymous || false
    })

    await newReservation.save()

    await createNotificationSafe({
      recipient: req.session.user.id,
      senderName: 'Reserve++ Team',
      senderRole: 'Reservation System',
      title: 'Reservation Created',
      message: `Your reservation for Room ${lab.labCode}, Seat ${seats.join(
        ', '
      )} on ${date} has been created successfully.`,
      type: 'Reservation'
    })

    res.status(201).json(newReservation)
  } catch (error) {
    console.error('Reservation Error:', error)
    res.status(500).json({ error: 'Failed to create reservation' })
  }
})

app.put('/api/reservations/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Please log in first.' })
    }

    const { labId, labCode, seats, date, timeRange, slotsArray, isAnonymous } =
      req.body

    let lab
    if (labId) {
      lab = await Lab.findById(labId)
    } else {
      const cleanCode = normalizeRoomCode(labCode)
      lab = await Lab.findOne({ labCode: cleanCode })
    }

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found in database.' })
    }

    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      {
        lab: lab._id,
        seatNumber: seats.join(', '),
        date: date,
        timeRange: timeRange,
        timeSlot: JSON.stringify(slotsArray),
        isAnonymous: isAnonymous || false
      },
      { new: true }
    )

    if (!updatedReservation) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    await createNotificationSafe({
      recipient: req.session.user.id,
      senderName: 'Reserve++ Team',
      senderRole: 'Reservation System',
      title: 'Reservation Updated',
      message: `Your reservation for Room ${lab.labCode}, Seat ${seats.join(
        ', '
      )} on ${date} has been updated successfully.`,
      type: 'Reservation'
    })

    res.json(updatedReservation)
  } catch (error) {
    console.error('Update Error:', error)
    res.status(500).json({ error: 'Failed to update reservation' })
  }
})

app.get('/api/reservations/me', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const reservations = await Reservation.find({
      user: req.session.user.id,
      status: 'Active'
    })
      .populate('lab')
      .sort({ createdAt: -1 })

    res.json(reservations)
  } catch (error) {
    console.error('Fetch Error:', error)
    res.status(500).json({ error: 'Failed to fetch reservations' })
  }
})

app.get('/api/reservations/booked', async (req, res) => {
  try {
    const { labId, labCode, date } = req.query

    let lab
    if (labId) {
      lab = await Lab.findById(labId)
    } else {
      const cleanCode = normalizeRoomCode(labCode)
      lab = await Lab.findOne({ labCode: cleanCode })
    }

    if (!lab) return res.json({})

    const bookings = await Reservation.find({
      lab: lab._id,
      date: date,
      status: 'Active'
    }).populate('user', 'firstName lastName email profilePic')

    let bookedData = {}

    bookings.forEach(booking => {
      if (booking.timeSlot && booking.user) {
        try {
          const slots = JSON.parse(booking.timeSlot)
          slots.forEach(slot => {
            if (booking.isAnonymous) {
              bookedData[slot] = null
            } else {
              bookedData[slot] = {
                userId: booking.user._id,
                name: `${booking.user.firstName} ${booking.user.lastName}`.trim(),
                email: booking.user.email || '',
                avatar: booking.user.profilePic || '/img/def_avatar.jpg'
              }
            }
          })
        } catch (e) {
          // Ignore old string format errors
        }
      }
    })

    res.json(bookedData)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch booked slots' })
  }
})

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const cancelledReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    ).populate('lab')

    if (!cancelledReservation) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    await createNotificationSafe({
      recipient: req.session.user.id,
      senderName: 'Reserve++ Team',
      senderRole: 'Reservation System',
      title: 'Reservation Cancelled',
      message: `Your reservation for Room ${
        cancelledReservation.lab?.labCode || ''
      }, Seat ${cancelledReservation.seatNumber} has been cancelled.`,
      type: 'Reservation'
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Cancel Error:', error)
    res.status(500).json({ error: 'Failed to cancel reservation' })
  }
})

/* ==========================================
   8. SERVER START
   ========================================== */
const PORT = 3000
app.listen(PORT, () => {
  console.log(`Running at http://localhost:${PORT}`)
})