// File: netlify/functions/submit-form.js

import { URLSearchParams } from 'url';
import busboy from 'busboy';

// Helper function to parse multipart form data from Netlify's event body
function parseMultipartForm(event) {
  return new Promise((resolve) => {
    const fields = {};

    // Initialize busboy with the request headers
    const bb = busboy({
      headers: {
        'content-type': event.headers['content-type'] || event.headers['Content-Type'],
      },
    });

    // Process text fields
    bb.on('field', (fieldname, val) => {
      console.log(`Processed field: ${fieldname} = ${val}`);
      fields[fieldname] = val;
    });

    // Ignore file uploads
    bb.on('file', (name, file) => {
      file.resume();
    });

    // Signal that parsing is complete
    bb.on('close', () => {
      resolve(fields);
    });

    // Netlify Functions encode the body as base64 when it's multipart
    bb.end(Buffer.from(event.body, 'base64'));
  });
}

export const handler = async (event) => {
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

    // Use the new parser to correctly get all form fields
    const fields = await parseMultipartForm(event);

    // Reconstruct the body in a format Google Apps Script understands
    const params = new URLSearchParams();
    for (const key in fields) {
      params.append(key, fields[key]);
    }

    console.log("Forwarding to Google with params:", params.toString());

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
    console.error("RUNTIME ERROR:", error.toString());
    return {
      statusCode: 500,
      body: JSON.stringify({ result: 'error', error: 'An unexpected server error occurred.' }),
    };
  }
};