exports.handler = async function (event) {
    const { default: fetch } = await import('node-fetch');
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // 1. Check for the secret URL
    const SCRIPT_URL = process.env.APPS_SCRIPT_URL;
    if (!SCRIPT_URL) {
        // console.error("FATAL: APPS_SCRIPT_URL environment variable not found.");
        return { statusCode: 500, body: JSON.stringify({ valid: false, error: 'Server configuration error.' }) };
    }

    // 2. Check for the Membership ID from the browser
    const membershipId = event.queryStringParameters.membershipId;
    if (!membershipId) {
        // console.error("ERROR: membershipId not found in query string.");
        return { statusCode: 400, body: JSON.stringify({ valid: false, error: 'Membership ID is required.' }) };
    }

    console.log(`Validation request received for ID: ${membershipId}`);

    try {
        const validationUrl = `${SCRIPT_URL}?action=validate&membershipId=${encodeURIComponent(membershipId)}`;
        const response = await fetch(validationUrl);
        const data = await response.json();

        // console.log("Response from Google Script:", JSON.stringify(data));
        
        return {
        statusCode: 200,
        body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("RUNTIME ERROR during fetch to Google Script:", error);
        return {
        statusCode: 500,
        body: JSON.stringify({ valid: false, error: 'Error during validation.' })
        };
    }
};