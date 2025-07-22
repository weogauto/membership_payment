// File: netlify/functions/submit-form.js

import { URLSearchParams } from 'url';
import busboy from 'busboy';

// Helper function to parse multipart form data from Netlify's event body
function parseMultipartForm(event) {
  return new Promise((resolve) => {
    const fields = {};
    const bb = busboy({
      headers: {
        'content-type': event.headers['content-type'] || event.headers['Content-Type'],
      },
    });

    bb.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    bb.on('file', (name, file) => file.resume());
    bb.on('close', () => resolve(fields));
    bb.end(Buffer.from(event.body, 'base64'));
  });
}

export const handler = async (event) => {
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
      throw new Error(`Google Script responded with status: ${response.status}`);
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    console.error("RUNTIME ERROR in submit-form.js:", error.toString());
    return {
      statusCode: 500,
      body: JSON.stringify({ result: 'error', error: 'An unexpected server error occurred.' }),
    };
  }
};