const { google } = require('googleapis');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Uses individual env vars (GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY)
    // matching your .env file — NOT the JSON blob pattern
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID2;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID2 not configured');
    }

    // Fetch columns A through Z
    // Column A (index 0) = animal_id
    // Column D (index 3) = species
    // Column Z (index 25) = adoption_date
    // Adjust 'Sheet1' if your tab has a different name
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:Z',
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.status(200).json({ data: [], total: 0 });
    }

    // Row 0 is the header — skip it
    const data = rows.slice(1)
      .map(row => ({
        animal_id:     row[0]  || '',   // Column A
        species:       row[3]  || '',   // Column D
        adoption_date: row[25] || '',   // Column Z
      }))
      .filter(r => r.adoption_date && r.species);

    res.status(200).json({ data, total: data.length });

  } catch (error) {
    console.error('Error fetching LOS sheet data:', error);
    res.status(500).json({
      error: 'Failed to fetch data from Google Sheets',
      details: error.message,
    });
  }
};