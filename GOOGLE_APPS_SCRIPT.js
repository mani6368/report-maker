
// COPY THE CODE BELOW INTO YOUR GOOGLE APPS SCRIPT EDITOR
// 1. Go to your Google Sheet
// 2. Extensions > Apps Script
// 3. Paste this code.
// 4. Click "Deploy" > "New Deployment"
// 5. Select type: "Web App"
// 6. Description: "Login API"
// 7. Execute as: "Me" (Important!)
// 8. Who has access: "Anyone" (Important! even if sheet is restricted)
// 9. Click "Deploy"
// 10. Copy the "Web App URL" and paste it into src/pages/Login.jsx

function doPost(e) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (!e.postData) {
        return ContentService.createTextOutput("No data received");
    }

    var data = JSON.parse(e.postData.contents);

    // ACTION: LOGIN (Verify)
    if (data.type === 'login') {
        var values = sheet.getDataRange().getValues();
        // Assuming columns: [Timestamp, Username, Email, Password, Type]
        // Email is index 2, Password is index 3

        var found = false;
        // Start from 1 to skip header if exists, or 0 if no header. Assuming 1 for safety.
        for (var i = 0; i < values.length; i++) {
            if (values[i][2] == data.email && values[i][3] == data.password) {
                found = true;
                break;
            }
        }

        if (found) {
            return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
                .setMimeType(ContentService.MimeType.JSON);
        } else {
            return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": "Invalid email or password" }))
                .setMimeType(ContentService.MimeType.JSON);
        }
    }

    // ACTION: HEADER CHECK (Optional, just ensuring consistency)
    // ACTION: REGISTER (Append)
    else {
        sheet.appendRow([
            new Date(),
            data.username || "",
            data.email || "",
            data.password || "",
            "register" // Explicitly mark as register type
        ]);

        return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet(e) {
    return ContentService.createTextOutput("Login API is running.");
}
