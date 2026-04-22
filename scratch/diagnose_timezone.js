const axios = require('axios');

async function checkBackend() {
  try {
    const res = await axios.get('http://localhost:5000/api/patient/profile');
    console.log('Backend Profile Data:', res.data);
  } catch (err) {
    console.error('Backend unreachable or error:', err.message);
  }
}
checkBackend();
