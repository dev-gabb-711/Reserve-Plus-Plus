const mongoose = require('mongoose')
const User = require('./models/User')
const Lab = require('./models/Lab')
const Ticket = require('./models/Ticket')
const Reservation = require('./models/Reservation')
const Notification = require('./models/Notification')

/* ==========================================
   DATABASE CONNECTION
   ========================================== */
mongoose
  .connect('mongodb://127.0.0.1:27017/ReserveDB')
  .then(() => seedDatabase())
  .catch(err => console.error(err))

/* ==========================================
   MAIN SEED FUNCTION
   ========================================== */
async function seedDatabase () {
  try {
    console.log('Connected to MongoDB')

    await User.deleteMany({})
    await Lab.deleteMany({})
    await Ticket.deleteMany({})
    await Reservation.deleteMany({})
    await Notification.deleteMany({})

    /* ==========================================
       1. HELPERS
       ========================================== */

    function createSeats (num) {
      const seats = []
      for (let i = 1; i <= num; i++) {
        seats.push({ seatNumber: String(i) })
      }
      return seats
    }

    function formatDateKey (dateObj) {
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }

    function to12HourLabel (hours, minutes) {
      const suffix = hours >= 12 ? 'PM' : 'AM'
      let displayHour = hours % 12
      if (displayHour === 0) displayHour = 12

      return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`
    }

    function buildSlotsArray (startHour, startMinute, numberOfSlots) {
      const slots = []

      let h = startHour
      let m = startMinute

      for (let i = 0; i < numberOfSlots; i++) {
        slots.push(to12HourLabel(h, m))
        m += 30

        if (m >= 60) {
          h += 1
          m = 0
        }

        if (h >= 24) h = h % 24
      }

      return slots
    }

    function buildTimeRangeFromSlots (slotsArray) {
      if (!slotsArray || !slotsArray.length) return ''

      const start = slotsArray[0]
      const last = slotsArray[slotsArray.length - 1]

      const [time, suffix] = last.split(' ')
      let [hour, minute] = time.split(':').map(Number)

      if (suffix === 'PM' && hour !== 12) hour += 12
      if (suffix === 'AM' && hour === 12) hour = 0

      minute += 30
      if (minute >= 60) {
        hour += 1
        minute = 0
      }
      if (hour >= 24) hour = hour % 24

      const end = to12HourLabel(hour, minute)
      return `${start} - ${end}`
    }

    function makeReservationPayload ({
      userId,
      labId,
      labCode,
      seatNumbers,
      date,
      slotsArray,
      isAnonymous = false,
      status = 'Active'
    }) {
      return {
        user: userId,
        lab: labId,
        labCode,
        seatNumber: seatNumbers,
        date,
        timeSlot: JSON.stringify(slotsArray),
        slotsArray,
        timeRange: buildTimeRangeFromSlots(slotsArray),
        isAnonymous,
        status
      }
    }

    /* ==========================================
       2. SAMPLE USERS
       ========================================== */
    const insertedUsers = await User.insertMany([
      {
        firstName: 'Ross',
        lastName: 'Manalang',
        email: 'ross@dlsu.edu.ph',
        password: '123',
        role: 'Student',
        profilePic: '/img/def_avatar.jpg',
        description: 'Scenario account: no reservation for today.'
      },
      {
        firstName: 'Gabriel',
        lastName: 'Infante',
        email: 'gabriel@dlsu.edu.ph',
        password: '123',
        role: 'Student',
        profilePic: '/img/def_avatar.jpg',
        description: 'Usually reserves seats for coding work.'
      },
      {
        firstName: 'Gabby',
        lastName: 'Martinez',
        email: 'gabby@dlsu.edu.ph',
        password: '123',
        role: 'Student',
        profilePic: '/img/def_avatar.jpg',
        description: 'Scenario account: has a reservation later today.'
      },
      {
        firstName: 'Marion',
        lastName: 'Melanio',
        email: 'marion@dlsu.edu.ph',
        password: '123',
        role: 'Student',
        profilePic: '/img/def_avatar.jpg',
        description: 'Scenario account: currently inside the active reservation window.'
      },
      {
        firstName: 'Nicolo',
        lastName: 'Tartaglia',
        email: 'nicolo@dlsu.edu.ph',
        password: '123',
        role: 'Admin',
        profilePic: '/img/def_avatar.jpg',
        description: 'Reserve++ system administrator.'
      },
      {
        firstName: 'Alyssa',
        lastName: 'Cruz',
        email: 'alyssa@dlsu.edu.ph',
        password: '123',
        role: 'Student',
        profilePic: '/img/def_avatar.jpg',
        description: 'Usually studies in Andrew Hall.'
      },
      {
        firstName: 'Daniel',
        lastName: 'Reyes',
        email: 'daniel@dlsu.edu.ph',
        password: '123',
        role: 'Student',
        profilePic: '/img/def_avatar.jpg',
        description: 'Likes late afternoon reservation slots.'
      },
      {
        firstName: 'Patricia',
        lastName: 'Lopez',
        email: 'patricia@dlsu.edu.ph',
        password: '123',
        role: 'Student',
        profilePic: '/img/def_avatar.jpg',
        description: 'Often uses multi-seat reservations for group work.'
      }
    ])

    const userMap = {
      ross: insertedUsers.find(u => u.email === 'ross@dlsu.edu.ph'),
      gabriel: insertedUsers.find(u => u.email === 'gabriel@dlsu.edu.ph'),
      gabby: insertedUsers.find(u => u.email === 'gabby@dlsu.edu.ph'),
      marion: insertedUsers.find(u => u.email === 'marion@dlsu.edu.ph'),
      nicolo: insertedUsers.find(u => u.email === 'nicolo@dlsu.edu.ph'),
      alyssa: insertedUsers.find(u => u.email === 'alyssa@dlsu.edu.ph'),
      daniel: insertedUsers.find(u => u.email === 'daniel@dlsu.edu.ph'),
      patricia: insertedUsers.find(u => u.email === 'patricia@dlsu.edu.ph')
    }

    /* ==========================================
       3. SAMPLE LABS
       ========================================== */
    const insertedLabs = await Lab.insertMany([
      {
        labCode: 'G201',
        building: 'Gokongwei Hall',
        seats: createSeats(30)
      },
      {
        labCode: 'G202',
        building: 'Gokongwei Hall',
        seats: createSeats(30)
      },
      {
        labCode: 'G203',
        building: 'Gokongwei Hall',
        seats: createSeats(45)
      },
      {
        labCode: 'A1707',
        building: 'Br. Andrew Hall',
        seats: createSeats(30)
      },
      {
        labCode: 'A1904',
        building: 'Br. Andrew Hall',
        seats: createSeats(45)
      },
      {
        labCode: 'A1103',
        building: 'Br. Andrew Hall',
        seats: createSeats(25)
      },
      {
        labCode: 'G305',
        building: 'Gokongwei Hall',
        seats: createSeats(40)
      },
      {
        labCode: 'A1503',
        building: 'Br. Andrew Hall',
        seats: createSeats(40)
      }
    ])

    const labMap = {
      G201: insertedLabs.find(l => l.labCode === 'G201'),
      G202: insertedLabs.find(l => l.labCode === 'G202'),
      G203: insertedLabs.find(l => l.labCode === 'G203'),
      A1707: insertedLabs.find(l => l.labCode === 'A1707'),
      A1904: insertedLabs.find(l => l.labCode === 'A1904'),
      A1103: insertedLabs.find(l => l.labCode === 'A1103'),
      G305: insertedLabs.find(l => l.labCode === 'G305'),
      A1503: insertedLabs.find(l => l.labCode === 'A1503')
    }

    /* ==========================================
       4. TIME SETUP
       ========================================== */
    const now = new Date()

    const today = new Date(now)
    const tomorrow = new Date(now)
    const dayAfterTomorrow = new Date(now)

    tomorrow.setDate(tomorrow.getDate() + 1)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

    const todayDate = formatDateKey(today)
    const tomorrowDate = formatDateKey(tomorrow)
    const dayAfterTomorrowDate = formatDateKey(dayAfterTomorrow)

    /* ==========================================
       4A. SCENARIO CONTROL BLOCK
       Edit these values whenever you want to
       test different live reservation states.
       ========================================== */

    // 1) NO RESERVATION TODAY
    // Ross will intentionally have no reservation for today.

    // 2) RESERVATION LATER TODAY
    // Gabby gets a future reservation later than the current time.
    let gabbyLaterTodayDate = todayDate
    let gabbyLaterTodaySlots = []

    const gabbyStart = new Date(now)
    gabbyStart.setMinutes(0, 0, 0)
    gabbyStart.setHours(gabbyStart.getHours() + 2)

    if (gabbyStart.getDate() !== today.getDate()) {
      gabbyLaterTodayDate = tomorrowDate
      gabbyLaterTodaySlots = buildSlotsArray(9, 0, 1) // 30 mins tomorrow if already too late today
    } else {
      gabbyLaterTodaySlots = buildSlotsArray(gabbyStart.getHours(), gabbyStart.getMinutes(), 1)
    }

    // 3) CURRENTLY USING THE LAB
    // Marion gets a reservation that started at the current half-hour block
    // and lasts for 30 minutes, so the account is "currently active".
    const marionActiveStartHour = now.getHours()
    const marionActiveStartMinute = now.getMinutes() < 30 ? 0 : 30
    const marionActiveSlots = buildSlotsArray(marionActiveStartHour, marionActiveStartMinute, 1)

    /* ==========================================
       Extra sample reservations for other users
       ========================================== */
    const gabrielPastSlots = buildSlotsArray(10, 0, 2)
    const alyssaFutureSlots = buildSlotsArray(8, 0, 2)
    const danielFutureSlots = buildSlotsArray(14, 0, 3)
    const patriciaFutureSlots = buildSlotsArray(10, 30, 4)

    /* ==========================================
       5. SAMPLE TICKETS
       ========================================== */
    await Ticket.insertMany([
      {
        user: userMap.ross._id,
        lab: labMap.A1103._id,
        seatNumber: 5,
        concernCategory: 'PC Unresponsive / Frozen',
        description: 'Computer freezes after logging in.',
        status: 'Unresolved'
      },
      {
        user: userMap.gabriel._id,
        lab: labMap.G201._id,
        seatNumber: 3,
        concernCategory: 'Software/App Crashing',
        description: 'Required software is missing from the desktop.',
        status: 'Unresolved'
      },
      {
        user: userMap.gabby._id,
        lab: labMap.G201._id,
        seatNumber: 7,
        concernCategory: 'Audio / Headphone Jack Issue',
        description: 'Headphone jack is not working properly.',
        status: 'Unresolved'
      },
      {
        user: userMap.marion._id,
        lab: labMap.G202._id,
        seatNumber: 19,
        concernCategory: 'Software/App Crashing',
        description: 'IDE keeps crashing during class.',
        status: 'Unresolved'
      },
      {
        user: userMap.nicolo._id,
        lab: labMap.A1707._id,
        seatNumber: 6,
        concernCategory: 'Keyboard / Mouse Not Working',
        description: 'Several keys do not respond.',
        status: 'Unresolved'
      },
      {
        user: userMap.alyssa._id,
        lab: labMap.A1904._id,
        seatNumber: 12,
        concernCategory: 'Monitor No Display',
        description: 'Screen flickers every few seconds.',
        status: 'Unresolved'
      },
      {
        user: userMap.daniel._id,
        lab: labMap.G305._id,
        seatNumber: 8,
        concernCategory: 'No Internet Connection',
        description: 'Cannot access online course tools.',
        status: 'Resolved'
      },
      {
        user: userMap.patricia._id,
        lab: labMap.G203._id,
        seatNumber: 21,
        concernCategory: 'Keyboard / Mouse Not Working',
        description: 'Mouse cursor moves inconsistently.',
        status: 'Unresolved'
      }
    ])

    /* ==========================================
       6. SAMPLE RESERVATIONS
       ========================================== */
    await Reservation.insertMany([
      /* ------------------------------------------
         GABRIEL - old completed reservation
         ------------------------------------------ */
      makeReservationPayload({
        userId: userMap.gabriel._id,
        labId: labMap.G202._id,
        labCode: labMap.G202.labCode,
        seatNumbers: [10],
        date: todayDate,
        slotsArray: gabrielPastSlots,
        status: 'Completed'
      }),

      /* ------------------------------------------
         GABBY - reservation later today
         ------------------------------------------ */
      makeReservationPayload({
        userId: userMap.gabby._id,
        labId: labMap.A1904._id,
        labCode: labMap.A1904.labCode,
        seatNumbers: [6],
        date: gabbyLaterTodayDate,
        slotsArray: gabbyLaterTodaySlots,
        status: 'Active'
      }),

      /* ------------------------------------------
         MARION - currently active 30-minute slot
         ------------------------------------------ */
      makeReservationPayload({
        userId: userMap.marion._id,
        labId: labMap.A1707._id,
        labCode: labMap.A1707.labCode,
        seatNumbers: [19],
        date: todayDate,
        slotsArray: marionActiveSlots,
        isAnonymous: true,
        status: 'Active'
      }),

      /* ------------------------------------------
         Extra sample reservations
         ------------------------------------------ */
      makeReservationPayload({
        userId: userMap.alyssa._id,
        labId: labMap.A1103._id,
        labCode: labMap.A1103.labCode,
        seatNumbers: [4],
        date: tomorrowDate,
        slotsArray: alyssaFutureSlots,
        status: 'Active'
      }),

      makeReservationPayload({
        userId: userMap.daniel._id,
        labId: labMap.G305._id,
        labCode: labMap.G305.labCode,
        seatNumbers: [14],
        date: tomorrowDate,
        slotsArray: danielFutureSlots,
        status: 'Active'
      }),

      makeReservationPayload({
        userId: userMap.patricia._id,
        labId: labMap.G203._id,
        labCode: labMap.G203.labCode,
        seatNumbers: [22, 23],
        date: tomorrowDate,
        slotsArray: patriciaFutureSlots,
        status: 'Active'
      }),

      makeReservationPayload({
        userId: userMap.nicolo._id,
        labId: labMap.G201._id,
        labCode: labMap.G201.labCode,
        seatNumbers: [2],
        date: todayDate,
        slotsArray: buildSlotsArray(16, 0, 2),
        status: 'Cancelled'
      })

      /*
        ROSS intentionally has NO reservation today
        so her dashboard shows the "none" state.
      */
    ])

    /* ==========================================
       7. SAMPLE NOTIFICATIONS
       ========================================== */
    await Notification.insertMany([
      {
        recipient: userMap.ross._id,
        senderName: 'System',
        senderRole: 'Reserve++',
        senderAvatar: '/img/def_avatar.jpg',
        title: 'Lab Reminder',
        message:
          'You currently have no reservation for today. Reserve early to secure a seat.',
        type: 'System'
      },
      {
        recipient: userMap.gabriel._id,
        senderName: 'Reserve++ Team',
        senderRole: 'Reservation System',
        senderAvatar: '/img/def_avatar.jpg',
        title: 'Reservation Confirmed',
        message: `Your previous reservation in ${labMap.G202.labCode} has been recorded successfully.`,
        type: 'Reservation'
      },
      {
        recipient: userMap.gabby._id,
        senderName: 'Reserve++ Team',
        senderRole: 'Reservation System',
        senderAvatar: '/img/def_avatar.jpg',
        title: 'Reservation Reminder',
        message: `Reminder: Your reservation is scheduled at ${buildTimeRangeFromSlots(gabbyLaterTodaySlots)}.`,
        type: 'Reservation'
      },
      {
        recipient: userMap.marion._id,
        senderName: 'Reserve++ Team',
        senderRole: 'Reservation System',
        senderAvatar: '/img/def_avatar.jpg',
        title: 'Reservation Active',
        message: `You are currently checked in for your reservation at ${buildTimeRangeFromSlots(marionActiveSlots)}.`,
        type: 'Reservation'
      },
      {
        recipient: userMap.nicolo._id,
        senderName: 'IT Assist',
        senderRole: 'Lab Technician',
        senderAvatar: '/img/def_avatar.jpg',
        title: 'New Ticket Alert',
        message: 'A new IT ticket has been submitted and requires your action.',
        type: 'IT Assist'
      },
      {
        recipient: userMap.alyssa._id,
        senderName: 'Reserve++ Team',
        senderRole: 'Reservation System',
        senderAvatar: '/img/def_avatar.jpg',
        title: 'Reservation Scheduled',
        message: `Your lab seat in ${labMap.A1103.labCode} is all set.`,
        type: 'Reservation'
      },
      {
        recipient: userMap.daniel._id,
        senderName: 'IT Assist',
        senderRole: 'Support Desk',
        senderAvatar: '/img/def_avatar.jpg',
        title: 'Ticket Resolved',
        message: 'Your reported issue has been marked as resolved.',
        type: 'IT Assist'
      },
      {
        recipient: userMap.patricia._id,
        senderName: 'System',
        senderRole: 'Reserve++',
        senderAvatar: '/img/def_avatar.jpg',
        title: 'Group Reservation Saved',
        message: 'Your multi-seat reservation has been saved successfully.',
        type: 'System'
      }
    ])

    console.log('Sample data inserted successfully.')
    console.log('------------------------------------------')
    console.log(`Today:                    ${todayDate}`)
    console.log(`Tomorrow:                 ${tomorrowDate}`)
    console.log(`Day after tomorrow:       ${dayAfterTomorrowDate}`)
    console.log('------------------------------------------')
    console.log(`ROSS (NONE):              no reservation today`)
    console.log(`GABBY (LATER TODAY):      ${buildTimeRangeFromSlots(gabbyLaterTodaySlots)} | ${gabbyLaterTodayDate}`)
    console.log(`MARION (ACTIVE NOW):      ${buildTimeRangeFromSlots(marionActiveSlots)} | ${todayDate}`)
    console.log('------------------------------------------')
    console.log('Test accounts:')
    console.log('ross@dlsu.edu.ph / 123')
    console.log('gabby@dlsu.edu.ph / 123')
    console.log('marion@dlsu.edu.ph / 123')
    console.log('------------------------------------------')
  } catch (err) {
    console.error('Sample data seeding failed:', err)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}