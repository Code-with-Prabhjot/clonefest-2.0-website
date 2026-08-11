/**
 * Clonefest 2.0 — Google Apps Script
 *
 * HOW TO USE:
 * 1. Open your Google Sheet
 * 2. Extensions → Apps Script
 * 3. Replace everything in Code.gs with this file
 * 4. Click Save (floppy disk icon)
 * 5. Click Deploy → New deployment  (or Manage deployments → edit existing one)
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Click Deploy → copy the Web app URL
 * 7. Paste that URL into patch_003_sheets_fix.sql (script_url variable)
 *    and re-run the patch in Supabase.
 *
 * SHEET LAYOUT (auto-created on first run):
 * Col A: Timestamp | B: Event | C: Full Name | D: USN | E: Branch | F: Batch
 * Col G: Role | H: Team Name | I: User ID
 *
 * NOTE: If your sheet already exists with the old 6-column layout, either:
 *   (a) Delete the 'Registrations' sheet so it is recreated with new headers, OR
 *   (b) Manually insert the 3 new columns (USN, Branch, Batch) after Full Name.
 */

const SHEET_NAME = 'Registrations';

function doPost(e) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let sheet   = ss.getSheetByName(SHEET_NAME);

    // Auto-create the sheet with headers if it doesn't exist yet
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Timestamp',
        'Event',
        'Full Name',
        'USN',
        'Branch',
        'Batch',
        'Role',
        'Team Name',
        'User ID',
      ]);
      // Bold the header row
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
      // Freeze header row
      sheet.setFrozenRows(1);
    }

    // Parse the JSON payload from Supabase
    const data = JSON.parse(e.postData.contents);

    // Append a new row with all profile fields
    sheet.appendRow([
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      data.event     || '',
      data.full_name || '',
      data.usn       || '',
      data.branch    || '',
      data.batch     || '',
      data.role      || '',
      data.team_name || '',
      data.id        || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Log the error for debugging (Apps Script → Executions log)
    console.error('Error in doPost:', err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * doGet is required so the script doesn't 404 on browser access.
 * Returns a simple status page.
 */
function doGet() {
  return ContentService
    .createTextOutput('Clonefest 2.0 — Sheets webhook is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}
