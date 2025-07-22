// File: netlify/functions/submit-form.js

const { URLSearchParams } = require('url');
const busboy = require('busboy');

// Helper function to parse multipart form data
function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    const fields = {};

    try {
      const bb = busboy({
        headers: {
          'content-type': event.headers['content-type'] || event.headers['Content-Type'],
        },
      });

      bb.on('field', (fieldname, val) => {
        fields[fieldname] = val;
      });

      bb.on('close', () => {
        resolve(fields);
      });
      
      bb.on('error', err => {
        reject(err);
      });

      // The body is base64 encoded by Netlify for multipart forms
      bb.end(Buffer.from(event.body, 'base64'));
    } catch (err) {
      reject(err);
    }
  });
}

exports.handler = async (event) => {
  // Use dynamic import for node-fetch v3
  const { default: fetch } = await import('node-fetch');

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const SCRIPT_URL = process.env.APPS_SCRIPT_URL;
    if (!SCRIPT_URL) {
      throw new Error("Server configuration error: Script URL not found.");
    }

    const fields = await parseMultipartForm(event);

    const params = new URLSearchParams();
    for (const key in fields) {
      params.append(key, fields[key]);
    }

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Google Script responded with status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    console.error("RUNTIME ERROR:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ result: 'error', error: 'An unexpected server error occurred.' }),
    };
  }
};