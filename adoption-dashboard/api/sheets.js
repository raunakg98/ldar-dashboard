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
    // Parse the service account credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
    
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get the spreadsheet ID from environment variable
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    // Fetch data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Dashboard!A:C', // Adjust to your sheet name and columns
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    // Convert to format matching CSV structure
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    res.status(200).json({ data, headers });
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data from Google Sheets',
      details: error.message 
    });
  }
};