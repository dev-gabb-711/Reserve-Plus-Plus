require('dotenv').config()

if (process.env.USE_CUSTOM_DNS === 'true') {
  const dns = require('node:dns')
  dns.setServers(['8.8.8.8', '8.8.4.4'])
}

const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const { engine } = require('express-handlebars')
const session = require('express-session')
const multer = require('multer')

const app = express()

/*===========================================
 * SESSION CREATION
 ============================================ */
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      path: '/',
      maxAge: 60 * 60 * 1000,
      secure: false,
      httpOnly: true
    }
  })
)

app.use((req, res, next) => {
  console.log('===== SESSION DEBUG =====')
  console.log('Session ID:', req.sessionID)
  console.log('Session data:', req.session)
  console.log('Incoming request:', req.method, req.url)
  console.log('-------------------------\n')

  next()
})

/* ==========================================
   1. DATABASE CONNECTION
   ========================================== */

console.log('ENV URI:', process.env.MONGODB_URI)

mongoose
  .connect(
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/reserveplusplus'
  )
  .then(() => console.log(' MongoDB connected'))
  .catch(err => console.error(' Database connection error:', err))

/* ==========================================
   2. SETTINGS & MIDDLEWARE
   ========================================== */
app.engine(
  'hbs',
  engine({
    extname: '.hbs',
    defaultLayout: false,
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
      eq: (a, b) => a === b,
      firstChar: value => {
        if (!value) return ''
        return String(value).charAt(0).toUpperCase()
      },
      json: context => JSON.stringify(context)
    }
  })
)
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

/* ==========================================
   3. IMPORT MODELS
   ========================================== */
const User = require('./models/User')
const Lab = require('./models/Lab')
const Ticket = require('./models/Ticket')
const Reservation = require('./models/Reservation')
const Notification = require('./models/Notification')

/* ==========================================
   4. HELPER FUNCTIONS
   ========================================== */

function normalizeRoomCode (value) {
  return String(value || '').replace(/^[A-Za-z]+/, '')
}

function requireLogin (req, res, next) {
  if (!req.session.user) {
    if (
      req.xhr ||
      (req.headers.accept && req.headers.accept.includes('json'))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Redirecting...',
        redirect: '/login'
      })
    }
    return res.redirect('/login')
  }
  next()
}

function requireAdmin (req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login')
  }

  if (req.session.user.role !== 'Admin') {
    return res.status(403).send('Unauthorized')
  }

  res.set(
    'Cache-Control',
    'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
  )
  next()
}

function makeAvatar (color) {
  return `
  data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>
    <rect width='100' height='100' rx='50' fill='${color}'/>
    <circle cx='50' cy='40' r='15' fill='white'/>
    <rect x='30' y='55' width='40' height='25' rx='12' fill='white'/>
  </svg>
  `
}

function getNotificationAvatar (type, senderAvatar) {
  if (senderAvatar && String(senderAvatar).trim() !== '') {
    return senderAvatar
  }

  if (type === 'IT Assist') return makeAvatar('purple')
  if (type === 'Reservation') return makeAvatar('teal')
  return makeAvatar('blue')
}

function formatNotificationForClient (notif) {
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

async function createNotificationSafe (data) {
  try {
    await Notification.create(data)
  } catch (err) {
    console.error('Notification creation failed:', err.message)
  }
}

function formatDateTimeShort (value) {
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

function buildDashboardBuildings (labs, tickets) {
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

function buildDashboardTickets (tickets) {
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

function buildMiniNotifications (notifications) {
  return notifications.map(notif => ({
    _id: notif._id,
    name: notif.senderName || notif.type || 'System',
    avatar: notif.senderAvatar || '/img/dlsu.png',
    snippet: notif.message
  }))
}

function buildSearchResults (labs) {
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

function buildStudentNotifications (notifications) {
  return notifications.map(notif => ({
    ...notif,
    senderName: notif.senderName || notif.type || 'System',
    avatar: notif.senderAvatar || '/img/system_profile.png'
  }))
}

function calculateTimeRangeServer (slots) {
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

function getReservationColorClass (buildingName) {
  const building = String(buildingName || '')
    .toLowerCase()
    .trim()

  if (
    building.includes('andrew') ||
    building.includes('br. andrew') ||
    building.includes('br andrew')
  ) {
    return 'green'
  }

  if (building.includes('gokongwei')) {
    return 'orange'
  }

  if (building.includes('velasco')) {
    return 'blue'
  }

  if (
    building.includes('st. la salle') ||
    building.includes('st la salle') ||
    building.includes('la salle')
  ) {
    return 'purple'
  }

  return 'green'
}

/* ==========================================
   5. GET ROUTES
   ========================================== */

app.get('/', (req, res) => res.render('index'))

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard')
  }
  res.render('login')
})

app.get('/signup', (req, res) => res.render('signup'))

app.get('/logout', (req, res) => {
  console.log('BEFORE DESTROY:', req.session)

  req.session.destroy(err => {
    if (err) {
      console.error('Destroy error:', err)
      return res.redirect('/dashboard')
    }

    console.log('AFTER DESTROY (should be gone)')

    res.clearCookie('connect.sid', { path: '/' })

    res.redirect('/login')
  })
})

app.get('/home', requireLogin, (req, res) => {
  if (req.session.user.role === 'Admin') {
    res.redirect('/admin-dashboard')
  } else {
    res.redirect('/dashboard')
  }
})

app.get('/support', requireLogin, (req, res) => {
  if (req.session.user.role === 'Admin') {
    res.redirect('/it-assist-admin')
  } else {
    res.redirect('/it-assist')
  }
})

app.get('/dashboard', requireLogin, async (req, res) => {
  try {
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
      } catch (e) {}

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

app.get('/reserve', requireLogin, async (req, res) => {
  try {
    const labs = await Lab.find().lean()
    res.render('rseat', {
      labs,
      loggedInRole: req.session.user.role
    })
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

app.get('/api/students', requireAdmin, async (req, res) => {
  try {
    const search = req.query.term || ''

    const students = await User.find({
      role: 'Student',
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).limit(10)

    res.json(students)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
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
      } catch (e) {}

      return {
        ...reservation,
        roomLabel: reservation.lab?.labCode
          ? `Room ${reservation.lab.labCode} • Seat ${reservation.seatNumber}`
          : `Seat ${reservation.seatNumber}`,
        dateLabel: reservation.date || '',
        timeLabel: calculatedTime || '',
        buildingClass: getReservationColorClass(reservation.lab?.building)
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
      isEditMode,
      loggedInRole: req.session.user.role
    })
  } catch (err) {
    console.error('Error loading profile:', err)
    res.status(500).send('Error loading profile')
  }
})

app.get('/search-results', requireLogin, async (req, res) => {
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
   6. POST ROUTES
   ========================================== */

app.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body

  try {
    const user = await User.findOne({
      email: email.toLowerCase()
    })

    if (!user) {
      return res.render('login', {
        errorMessage: 'User does not exist.',
        email
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.render('login', { errorMessage: 'Incorrect password.', email })
    }

    req.session.regenerate(err => {
      if (err) return res.status(500).send('Error')

      req.session.user = {
        id: user._id,
        name: user.firstName,
        role: user.role
      }

      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000
      } else {
        req.session.cookie.maxAge = 60 * 60 * 1000
      }

      if (user.role === 'Admin') {
        res.redirect('/admin-dashboard')
      } else {
        res.redirect('/dashboard')
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).render('login', { errorMessage: 'Server error.' })
  }
})

app.post('/signup', async (req, res) => {
  try {
    const first = (req.body.firstName || '').trim()
    const last = (req.body.lastName || '').trim()
    const mail = (req.body.email || '').trim().toLowerCase()
    const pass = (req.body.password || '').trim()

    if (!first || !last || !mail || !pass) {
      return res.render('signup', {
        errorMessage: 'Please fill in all required fields.'
      })
    }

    if (!mail.endsWith('@dlsu.edu.ph')) {
      return res.render('signup', {
        errorMessage: 'Only DLSU email addresses are allowed.'
      })
    }

    const existingUser = await User.findOne({ email: mail })
    if (existingUser) {
      return res.render('signup', {
        errorMessage: 'An account with that email already exists.'
      })
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
    res.render('signup', { errorMessage: 'Signup failed: ' + err.message })
  }
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

app.post(
  '/profile/:id/edit',
  requireLogin,
  upload.single('profilePic'),
  async (req, res) => {
    try {
      const viewedUserId = req.params.id
      const loggedInUserId = req.session.user.id

      if (String(viewedUserId) !== String(loggedInUserId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized' })
      }

      const user = await User.findById(viewedUserId)

      user.firstName = (req.body.firstName || '').trim()
      user.lastName = (req.body.lastName || '').trim()

      const newEmail = (req.body.email || '').trim().toLowerCase()
      if (!newEmail.endsWith('@dlsu.edu.ph')) {
        return res.status(400).json({
          success: false,
          message:
            'Error updating profile: Only DLSU email addresses are allowed.'
        })
      }
      user.email = newEmail

      const newDescription = (req.body.description || '').trim()
      if (newDescription.length > 500) {
        return res.status(400).json({
          success: false,
          message:
            'Error updating profile: Description cannot exceed 500 characters.'
        })
      }
      user.description = newDescription

      if (req.body.password && req.body.password.trim() !== '') {
        user.password = req.body.password.trim()
      }

      if (req.file) {
        user.profilePic = '/uploads/' + req.file.filename
      }

      await user.save()

      req.session.user.name = user.firstName

      res.json({
        success: true,
        profilePic: user.profilePic,
        userId: viewedUserId
      })
    } catch (err) {
      console.error('Error updating profile:', err)
      res
        .status(500)
        .json({ success: false, message: 'Error updating profile' })
    }
  }
)

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

    if (!building || !room || !seat) {
      return res.status(400).json({
        error: 'Building, room, and seat are required.'
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
    const ticket = await Ticket.findById(req.params.id).populate('lab').lean()

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
/*
REVISION: encapsulated the reservation process inside a transaction session (para matapos in one go yung reservation before another post for the same slot can interrupt)

aside from the seatslot key and additional try-catch logic, the procedure is the same as before.

*/
app.post('/api/reservations', async (req, res) => {
  // mongodb transac sesh init
  const dbSession = await mongoose.startSession();

  try {
    let resultReservation;

    await dbSession.withTransaction(async () => {
      console.log("DEBUG: Transaction started for request...");

      if (!req.session.user) {
        throw new Error('UNAUTHORIZED');
      }

      const { labId, labCode, seats, date, timeRange, slotsArray, isAnonymous } = req.body;

      let lab;
      if (labId) {
        lab = await Lab.findById(labId).session(dbSession);
      } else {
        lab = await Lab.findOne({ labCode: labCode }).session(dbSession);
      }

      if (!lab) throw new Error('LAB_NOT_FOUND');

      let userId = req.session.user.id
      if (req.session.user.role === 'Admin' && req.body.user) {
        userId = req.body.user
      }

      // normalize seats into array
      const seatArray = Array.isArray(seats) ? seats : [seats]

      // generate atomic keys
      const seatSlotKeys = []

      seatArray.forEach(seat => {
        slotsArray.forEach(slot => {
          seatSlotKeys.push(`${seat}_${slot}`)
        })
      })

      const newReservation = new Reservation({
        user: userId,
        createdBy: req.session.user.id,
        lab: lab._id,
        labCode: labCode,
        seatNumber: seats,
        date: date,
        timeRange: timeRange,
        slotsArray: slotsArray,
        timeSlot: JSON.stringify(slotsArray),
        seatSlotKeys: seatSlotKeys,
        isAnonymous: isAnonymous || false
      });

      try {
        await newReservation.save({ session: dbSession })
      } catch (err) {
        if (err.code === 11000) {
          throw new Error('CONFLICT')
        }
        throw err
      }
      
      // Store the result to send after commit
      resultReservation = newReservation;
    });

    // Run post reservation functions like notifications AFTER the transaction succeeds
    await createNotificationSafe({
      recipient: resultReservation.user,
      senderName: 'Reserve++ Team',
      senderRole: 'Reservation System',
      title: 'Reservation Created',
      message: `Your reservation for Room ${resultReservation.labCode}, Seat ${
        Array.isArray(resultReservation.seatNumber) ? resultReservation.seatNumber.join(', ') : resultReservation.seatNumber
      } on ${resultReservation.date} has been created successfully.`,
      type: 'Reservation'
    });

    res.status(201).json(resultReservation);

  } catch (error) {
    // Handling specific errors thrown inside the transaction
    if (error.message === 'CONFLICT') {
      return res.status(400).json({ error: 'Time slot already booked' });
    }
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ error: 'Please log in first.' });
    }
    if (error.message === 'LAB_NOT_FOUND') {
      return res.status(404).json({ error: 'Lab not found' });
    }

    console.error('Reservation Transaction Error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  } finally {
    await dbSession.endSession();
  }
});

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
      .populate('user', 'firstName lastName email profilePic role')
      .sort({ createdAt: -1 })

    res.json(reservations)
  } catch (error) {
    console.error('Fetch Error:', error)
    res.status(500).json({ error: 'Failed to fetch reservations' })
  }
})

app.get('/api/reservations/booked', async (req, res) => {
  try {
    const { labId, date, seats } = req.query
    if (!labId || !date) return res.json({})

    let selectedSeats = []
    if (seats) {
      try {
        selectedSeats = JSON.parse(seats).map(String)
      } catch (err) {
        console.error('Seat parsing error:', err)
      }
    }

    const bookings = await Reservation.find({
      lab: labId,
      date: date,
      status: 'Active'
    }).populate('user')

    const bookedData = {}
    const isAdmin = req.session.user && req.session.user.role === 'Admin'

    const timeToMinutes = timeStr => {
      if (!timeStr) return 0
      const [time, modifier] = timeStr.trim().split(' ')
      if (!time || !modifier) return 0
      let [hours, minutes] = time.split(':').map(Number)
      if (hours === 12) hours = 0
      if (modifier === 'PM') hours += 12
      return hours * 60 + minutes
    }

    bookings.forEach(booking => {
      let bookingSeats = []
      if (Array.isArray(booking.seatNumber)) {
        bookingSeats = booking.seatNumber.map(String)
      } else if (typeof booking.seatNumber === 'string') {
        bookingSeats = booking.seatNumber.split(',').map(s => s.trim())
      } else if (
        booking.seatNumber !== undefined &&
        booking.seatNumber !== null
      ) {
        bookingSeats = [String(booking.seatNumber)]
      }

      let overlaps = false
      if (selectedSeats.length === 0) {
        overlaps = true
      } else {
        overlaps = selectedSeats.some(s => bookingSeats.includes(s))
      }

      if (
        overlaps &&
        booking.slotsArray &&
        booking.slotsArray.length > 0 &&
        booking.user
      ) {
        const sortedSlots = [...booking.slotsArray].sort(
          (a, b) => timeToMinutes(a) - timeToMinutes(b)
        )
        const actualStartTime = sortedSlots[0]

        booking.slotsArray.forEach(slot => {
          if (isAdmin || !booking.isAnonymous) {
            bookedData[slot] = {
              userId: booking.user._id,
              resId: booking._id,
              name: `${booking.user.firstName} ${booking.user.lastName}`.trim(),
              email: booking.user.email || '',
              avatar: booking.user.profilePic || '/img/def_avatar.jpg',
              isAnonymous: booking.isAnonymous,
              startTime: actualStartTime,
              slotTime: slot
            }
          } else {
            bookedData[slot] = {
              name: 'Anonymous Student',
              avatar: '/img/def_avatar.jpg',
              isAnonymous: true,
              startTime: actualStartTime,
              slotTime: slot
            }
          }
        })
      }
    })

    res.json(bookedData)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch booked slots' })
  }
})

app.get('/api/reservations/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const reservation = await Reservation.findById(req.params.id)
      .populate('user', 'firstName lastName email profilePic role')
      .populate('lab')

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const isAdmin = req.session.user.role === 'Admin'
    const isOwner =
      String(reservation.user?._id) === String(req.session.user.id)

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    res.json(reservation)
  } catch (error) {
    console.error('Fetch reservation by id error:', error)
    res.status(500).json({ error: 'Failed to fetch reservation' })
  }
})

app.put('/api/reservations/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Please log in first.' })
    }

    const existingReservation = await Reservation.findById(req.params.id)

    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const isAdmin = req.session.user.role === 'Admin'
    const isOwner =
      String(existingReservation.user) === String(req.session.user.id)

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Forbidden' })
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
      return res.status(404).json({ error: 'Lab not found' })
    }

    let userId = existingReservation.user
    if (req.session.user.role === 'Admin' && req.body.user) {
      userId = req.body.user
    }

    const conflict = await Reservation.findOne({
      _id: { $ne: req.params.id },
      lab: lab._id,
      date: date,
      status: 'Active',
      slotsArray: { $in: slotsArray },
      seatNumber: { $in: seats }
    })

    if (conflict) {
      return res.status(400).json({ error: 'Time slot already booked' })
    }

    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      {
        user: userId,
        createdBy: req.session.user.id,
        lab: lab._id,
        seatNumber: seats,
        date: date,
        timeRange: timeRange,
        timeSlot: JSON.stringify(slotsArray),
        slotsArray: slotsArray,
        isAnonymous: isAnonymous || false
      },
      { new: true }
    )

    if (!updatedReservation) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    res.json(updatedReservation)
  } catch (error) {
    console.error('Update Error:', error)
    res.status(500).json({ error: 'Failed to update reservation' })
  }
})

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const existingReservation = await Reservation.findById(req.params.id)

    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const isAdmin = req.session.user.role === 'Admin'
    const isOwner =
      String(existingReservation.user) === String(req.session.user.id)

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const cancelledReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    ).populate('lab')

    if (!cancelledReservation) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const isNoShow = req.query.reason === 'noshow'

    const notifTitle = isNoShow
      ? 'Reservation Cancelled (No-Show)'
      : 'Reservation Cancelled'
    const notifMessage = isNoShow
      ? `Your reservation for Room ${
          cancelledReservation.lab?.labCode || ''
        }, Seat ${
          cancelledReservation.seatNumber
        } has been cancelled by an Admin due to a no-show.`
      : `Your reservation for Room ${
          cancelledReservation.lab?.labCode || ''
        }, Seat ${
          cancelledReservation.seatNumber
        } has been successfully cancelled.`

    await createNotificationSafe({
      recipient: cancelledReservation.user,
      senderName: 'Reserve++ Team',
      senderRole: 'Reservation System',
      title: notifTitle,
      message: notifMessage,
      type: 'Reservation'
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Cancel Error:', error)
    res.status(500).json({ error: 'Failed to cancel reservation' })
  }
})

/* ==========================================
   7. SERVER START
   ========================================== */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Running at http://localhost:${PORT}`)
})