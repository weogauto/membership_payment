// File: netlify/functions/submit-form.js
// This version is for node-fetch v3

const { URLSearchParams } = require('url');

exports.handler = async function (event) {
  // Use dynamic import for node-fetch v3
  const { default: fetch } = await import('node-fetch');

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  if (!SCRIPT_URL) {
    console.error("FATAL: APPS_SCRIPT_URL environment variable not found.");
    return { statusCode: 500, body: JSON.stringify({ result: 'error', error: 'Server configuration error.' }) };
  }

  try {
    // Parse the incoming form data
    const params = new URLSearchParams(event.body);
    console.log("Forwarding to Google Script with params:", params.toString());

    // Forward the data to the Google Apps Script
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
        throw new Error(`Google Script responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Response from Google Script:", JSON.stringify(data));

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error("RUNTIME ERROR in submit-form:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ result: 'error', error: 'An unexpected error occurred during submission.' }),
    };
  }
};