// File: netlify/functions/submit-form.js
// USE THIS CODE IF YOUR package.json has "node-fetch": "^3.3.2"

const { URLSearchParams } = require('url');

exports.handler = async function (event) {
  const { default: fetch } = await import('node-fetch');

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  if (!SCRIPT_URL) {
    return { statusCode: 500, body: JSON.stringify({ result: 'error', error: 'Server configuration error.' }) };
  }

  try {
    const params = new URLSearchParams(event.body);
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
        throw new Error(`Google Script responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    console.error("RUNTIME ERROR:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ result: 'error', error: 'An unexpected error occurred during submission.' }),
    };
  }
};