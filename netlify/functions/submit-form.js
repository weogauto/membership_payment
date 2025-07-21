// File: netlify/functions/submit-form.js

const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SCRIPT_URL = process.env.APPS_SCRIPT_URL;

  // --- ADD THESE LINES FOR DEBUGGING ---
  console.log("Attempting to access environment variable APPS_SCRIPT_URL...");
  if (SCRIPT_URL) {
    console.log("Successfully retrieved URL:", SCRIPT_URL.substring(0, 45) + "..."); // Log first 45 chars for security
  } else {
    console.error("CRITICAL: APPS_SCRIPT_URL environment variable is NOT SET!");
  }
  // --- END OF DEBUGGING LINES ---

  // Add a guard clause to stop execution if the URL is missing
  if (!SCRIPT_URL) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ result: 'error', error: 'Server configuration error. Please contact admin.' }) 
    };
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: event.body
    });
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error("Error during fetch to Google Script:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ result: 'error', error: 'An error occurred while submitting.' })
    };
  }
};