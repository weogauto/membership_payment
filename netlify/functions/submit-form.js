// File: netlify/functions/submit-form.js

// We need a fetch implementation for Node.js.
// Run `npm install node-fetch` in your terminal if you don't have it.
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Get the secret Google Script URL from the environment variable
  const SCRIPT_URL = process.env.APPS_SCRIPT_URL;

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: event.body // Forward the form data from the original request
    });

    const data = await response.json();

    // Return the same success/error response from the Google Script
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error submitting form' })
    };
  }
};