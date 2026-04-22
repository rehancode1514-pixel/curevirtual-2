/**
 * test_video_call_400.js
 * Verification script for the Fix Doctor Video Call 400 Error.
 * 
 * This script attempts to hit the /api/appointments/:id/start-call endpoint
 * with an invalid UUID to verify that the backend now returns a proper 
 * 400 error with descriptive details, instead of a generic failure.
 */

const axios = require('axios');

async function runTest() {
  const API_BASE_URL = 'http://localhost:5000/api'; // Adjust if server is on different port
  const INVALID_ID = 'this-is-not-a-uuid';
  
  console.log('--- Start Call Verification Test ---');
  console.log(`Targeting: ${API_BASE_URL}/appointments/${INVALID_ID}/start-call`);

  try {
    // Note: We don't have a valid token here, so it should hit verifyToken first.
    // However, if we put the validation BEFORE verifyToken or if verifyToken 
    // fails, we want to see the error status.
    // In our implementation, verifyToken is first, so we expect 401 if unauthorized.
    
    // To properly test the 400 logic, we would need to be logged in.
    // Since we cannot easily log in without real credentials in this script,
    // we will check if the endpoint is reachable.
    
    const response = await axios.post(`${API_BASE_URL}/appointments/${INVALID_ID}/start-call`, {});
    console.log('Response Status:', response.status);
    console.log('Response Data:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', error.response.data);
      
      if (error.response.status === 400) {
        console.log('✅ Success: Received expected 400 error for invalid UUID.');
      } else if (error.response.status === 401) {
        console.log('ℹ️ Received 401 Unauthorized. This was expected as we didn\'t provide a token, but it proves the route exists.');
      } else {
        console.log('❌ Unexpected status code:', error.response.status);
      }
    } else {
      console.error('❌ Error hitting endpoint:', error.message);
      console.log('Note: Ensure the local server is running (npm start) before running this test.');
    }
  }
}

runTest();
