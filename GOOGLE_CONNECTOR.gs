/**
 * SHOPBOX | Data Connector for Google Sheets
 * -----------------------------------------
 * This script exposes spreadsheet data as a JSON endpoint for the Shopbox platform.
 * It strictly adheres to the schema required for high-performance static rendering.
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📦 Shopbox Tools')
      .addItem('Upload Image', 'showUploadDialog')
      .addItem('Open Rich Text Editor', 'openRichEditor')
      .addToUi();
}

/**
 * RICH TEXT EDITOR SIDEBAR
 */
function openRichEditor() {
  const html = HtmlService.createHtmlOutput(getEditorHtml())
    .setTitle('📦 SHOPBOX Rich Editor')
    .setWidth(450);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getSelectedCellData() {
  return SpreadsheetApp.getActiveRange().getValue();
}

function saveRichText(html) {
  SpreadsheetApp.getActiveRange().setValue(html);
}

function getEditorHtml() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; padding: 15px; background: #0f172a; color: white; }
        .editor-container { background: white; color: #333; height: 350px; border-radius: 8px; margin-bottom: 15px; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .logo { font-weight: 800; color: #10b981; font-size: 14px; }
        button { 
          background: #10b981; color: white; border: none; padding: 10px 20px; 
          border-radius: 6px; font-weight: 600; cursor: pointer; width: 100%;
          transition: all 0.2s;
        }
        button:hover { background: #059669; transform: translateY(-1px); }
        .label { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">SHOPBOX. EDITOR</div>
      </div>
      <div class="label">Live Formatting</div>
      <div id="editor" class="editor-container"></div>
      <button onclick="save()">Save to Cell</button>

      <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
      <script>
        var quill = new Quill('#editor', {
          theme: 'snow',
          modules: {
            toolbar: [
              [{ 'header': [1, 2, false] }],
              ['bold', 'italic', 'underline'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['clean']
            ]
          }
        });

        // Load initial data
        google.script.run.withSuccessHandler(function(data) {
          quill.root.innerHTML = data || '';
        }).getSelectedCellData();

        function save() {
          var html = quill.root.innerHTML;
          google.script.run.withSuccessHandler(function() {
            var btn = document.querySelector('button');
            btn.innerText = '✅ Saved!';
            btn.style.background = '#059669';
            setTimeout(() => {
              btn.innerText = 'Save to Cell';
              btn.style.background = '#10b981';
            }, 2000);
          }).saveRichText(html);
        }
      </script>
    </body>
    </html>
  `;
}

function showUploadDialog() {
  const html = HtmlService.createHtmlOutput(
    '<div style="font-family: sans-serif; padding: 10px;">' +
    '  <p style="font-size: 14px;">Upload product image to <b>Shopbox Assets</b>:</p>' +
    '  <input type="file" id="fileInput" onchange="upload(this)">' +
    '  <div id="status" style="margin-top: 10px; font-size: 12px; color: #10b981;"></div>' +
    '</div>' +
    '<script>' +
    'function upload(e) { ' +
    '  const file = e.files[0];' +
    '  const status = document.getElementById("status");' +
    '  status.innerText = "Uploading " + file.name + "...";' +
    '  const reader = new FileReader();' +
    '  reader.onload = function(e) {' +
    '    google.script.run.withSuccessHandler(function(url) {' +
    '       status.innerText = "Success! Link added to row.";' +
    '       setTimeout(google.script.host.close, 1500);' +
    '    }).handleUpload(e.target.result, file.name);' +
    '  };' +
    '  reader.readAsDataURL(file);' +
    '}' +
    '</script>'
  ).setWidth(350).setHeight(150);
  SpreadsheetApp.getUi().showModalDialog(html, '� SHOPBOX Image Uploader');
}

function handleUpload(base64, name) {
  const folderName = "Shopbox Assets";
  const folders = DriveApp.getFoldersByName(folderName);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
  
  const contentType = base64.split(";")[0].split(":")[1];
  const data = Utilities.base64Decode(base64.split(",")[1]);
  const file = folder.createFile(Utilities.newBlob(data, contentType, name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const url = "https://drive.google.com/uc?export=view&id=" + file.getId();
  SpreadsheetApp.getActiveRange().setValue(url);
  return url;
}

/**
 * API ENDPOINT: Serves Google Sheet data as JSON
 */
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const json = data.map((row, rowIndex) => {
    let obj = {};
    headers.forEach((header, i) => {
      // Create lower-case keys without spaces (e.g. "Product Name" -> "productname")
      const key = header.toLowerCase().replace(/\s/g, '');
      obj[key] = row[i];
    });
    return obj;
  });

  return ContentService.createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON);
}
