const axios = require('axios');

const URL = 'http://localhost:3000/api/reservations';

// cookie obtaned from browser dev session
const COOKIE = 'connect.sid=s%3AX3yw9OIcGQGKYrvFl8D_kRbr0HfsQlEM.2I%2Bxaw75cgObzqAWnJCYbI0DntqsdHF1JIYvnPDcZ4U';

const payload = {
  labCode: 'G202',
  seats: [10],
  date: 'Mar 30, 2026',
  timeRange: '10:00 AM - 11:00 AM',
  slotsArray: ['10:00 AM', '10:30 AM'],
  isAnonymous: false
};

// Simulate N concurrent users
const NUM_REQUESTS = 10;

async function runTest() {
  const requests = [];

  for (let i = 0; i < NUM_REQUESTS; i++) {
    requests.push(
      axios.post(URL, payload, {
        headers: {
          Cookie: COOKIE
        }
      })
      .then(res => {
        console.log(`✅ SUCCESS ${i}:`, res.status);
      })
      .catch(err => {
        if (err.response) {
          console.log(`❌ FAIL ${i}:`, err.response.status, err.response.data);
        } else {
          console.log(`❌ ERROR ${i}:`, err.message);
        }
      })
    );
  }

  await Promise.all(requests);
}

runTest();