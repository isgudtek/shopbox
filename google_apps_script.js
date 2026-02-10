/**
 * FLUX SMART SHOP CONNECTOR
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete everything and paste this code
 * 4. Click the "Save" icon
 * 5. Click "Deploy" > "New Deployment"
 * 6. Select Type: "Web App"
 * 7. Execute as: "Me" | Who has access: "Anyone"
 * 8. Copy the Web App URL and use it in your shop's script.js
 * 
 * NEW HEADERS SUPPORTED: Short Description, Long Description
 */

function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('🚀 Shop Tools')
        .addItem('Upload Image for Selected Row', 'showUploadDialog')
        .addToUi();
}

/**
 * Opens a file picker dialog
 */
function showUploadDialog() {
    const html = HtmlService.createHtmlOutput(
        '<style>body{font-family:sans-serif;padding:20px;display:flex;flex-direction:column;gap:10px;}input{padding:10px;border:1px solid #ccc;border-radius:4px;}</style>' +
        '<h3>Select Image</h3>' +
        '<input type="file" accept="image/*" onchange="upload(this)">' +
        '<div id="status" style="font-size:12px;color:#666">Ready.</div>' +
        '<script>' +
        'function upload(e) { ' +
        '  const file = e.files[0];' +
        '  const reader = new FileReader();' +
        '  document.getElementById("status").innerText = "Uploading " + file.name + "...";' +
        '  reader.onload = function(e) {' +
        '    google.script.run.withSuccessHandler(close).handleUpload(e.target.result, file.name);' +
        '  };' +
        '  reader.readAsDataURL(file);' +
        '}' +
        'function close() { google.script.host.close(); }' +
        '</script>'
    ).setWidth(350).setHeight(180);
    SpreadsheetApp.getUi().showModalDialog(html, '🚀 Upload Product Image');
}

/**
 * Handles the file upload to Google Drive and updates the sheet
 */
function handleUpload(base64, name) {
    const folderName = "Flux Assets";
    const folders = DriveApp.getFoldersByName(folderName);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    const contentType = base64.split(";")[0].split(":")[1];
    const data = Utilities.base64Decode(base64.split(",")[1]);
    const file = folder.createFile(Utilities.newBlob(data, contentType, name));

    // Make the file publicly viewable so the shop can see it
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const url = "https://drive.google.com/uc?export=view&id=" + file.getId();

    // Set the URL in the currently selected cell
    SpreadsheetApp.getActiveRange().setValue(url);
}

/**
 * Serves the Sheet data as a Smart JSON Feed
 */
function doGet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    const json = data.map(row => {
        let obj = {};
        headers.forEach((header, i) => {
            // Map header names to lowercase keys (e.g. "Image URL" -> "imageurl")
            const key = header.toLowerCase().replace(/\s/g, '');
            obj[key] = row[i];
        });
        return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(json))
        .setMimeType(ContentService.MimeType.JSON);
}
